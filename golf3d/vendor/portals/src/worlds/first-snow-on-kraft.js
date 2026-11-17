// First Snow on Brown Paper: an upland valley drawn in three coloured pencils on kraft, the way a draughtsman works a toned sheet:
// sepia for the place (the oak, the wall, the bracken hillside, the woods on the far hills, the dark snow cloud), white for the snow,
// which is still falling and still being laid, stroke by stroke, as we fly up the valley; one orange animal on the wall.
// Every solid is bare paper (a mesh that writes depth and outputs exactly the paper colour); every mark is an instanced hatching
// quad from the hero's style (src/parts/first-snow-on-kraft.js): a place in the world, the hand's 55 degrees on the page,
// alpha-tested against a pencil atlas; a quad may carry a whole group of five or six parallel strokes. Sky, hills and land are all
// hatching with a place in the world. No lights, no fog, no bloom, no full-screen pass; post.flat = 1, so every pigment is its own hex.
// (round 19) TWO RULES OF PLACE, said here in the open; each holds on every seed and for the whole flight:
// (1) BEYOND THE STREAM THE FIRST SNOW LIES WHEN WE COME. Every mark that stands on the far side of the stream and whose landing
//     the snow's own timetable puts before the moment the course crosses the stream is there from the first frame, and the thorn
//     that stands on the stream's near bank is finished (all its snow lies). On the near side, under and before us as we come in,
//     and everywhere after that moment, the snow is laid ahead of us as it always was. THE TREE IS NOT TOUCHED: within 30 m of
//     its trunk every mark lands as it always did (the tree is drawn by the snow in view, whole).
// (2) THE BRINK IS DRAWN WHERE THE SUN STANDS BEHIND IT: the top of the hill's face is hatched without a gap along the stretch of
//     the brink over which the sun's disc is seen from anywhere on the course (found at the build from the course, the disc and
//     the hill's foot line, the whole course walked at steps of 2 m, the same on every seed), so wherever the brink is what hides the disc's
//     foot, the foot ends on the hill's ragged top. Where a nearer shoulder of the hill hides an end of the disc, that end still
//     meets the shoulder's own edge as it did.
// And one order of the site owner's: on the animals round 18 enlarged, the orange strokes keep the length they had before it.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { PALETTE, makeStyle, StrokeBuf, strokeGeometry, sweepTube, layAnimal, buildHero } from '../parts/first-snow-on-kraft.js';

const OAK_Z = 372, BACK = 60, ABEAM = 55, END_Z = OAK_Z + BACK + 34, END_X = -64, END_Y = 8, BAY = 0.464, DURATION = 40, Z0 = 122;      // the course starts at the stream; the turn passes ABEAM of the trunk and tops out BACK behind it
const STOCKS = {
  kraft: { pal: PALETTE, white: 1, sepia: 1, title: 'First Snow on Brown Paper' },
  chocolate: { pal: ['#6B4734', '#F3E5C4', '#FCF4DC', '#1D0F08', '#E67632', '#C0A084'], white: 1.05, sepia: 0.85, title: 'First Snow on Chocolate Paper' },
  straw: { pal: ['#D8C08A', '#FBF8EC', '#FFFEF8', '#5B3B26', '#D9652B', '#F1E6C6'], white: 0.6, sepia: 1.5, title: 'First Snow on Straw Paper' },
};

export default {
  id: 'first-snow-on-kraft',
  name: 'First Snow on Brown Paper',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // ---------- the edition: stock, weather, cast, tree (chosen once, here) ----------
    const pick = (r, a) => { let acc = 0; for (const [k, w] of a) { acc += w; if (r < acc) return k; } return a[0][0]; };
    const stockId = pick(rng(), [['kraft', 0.5], ['chocolate', 0.25], ['straw', 0.25]]);
    const weather = pick(rng(), [['fine', 0.5], ['heavy', 0.27], ['thin', 0.23]]);
    const cast = pick(rng(), [['pony', 0.5], ['hind', 0.25], ['sheep', 0.25]]);
    const tree = pick(rng(), [['oak', 0.5], ['pine', 0.25], ['beech', 0.25]]);
    const duskHint = vary.hour === 'night' ? 0.5 : vary.hour === 'golden' ? 0.35 : (vary.hour === 'dawn' || vary.hour === 'day') ? 0 : rng.range(0, 0.25);
    const stock = STOCKS[stockId], pal = stock.pal, WK = stock.white * (weather === 'heavy' ? 1.15 : weather === 'thin' ? 0.8 : 1), SK = stock.sepia;
    const heavy = weather === 'heavy';

    const scene = new THREE.Scene();
    const style = makeStyle(ctx, { palette: pal, duskHint });
    scene.background = style.paperScene;
    style.uniforms.uFar.value.set(1 / 150, 100, 1400);      // far marks a little longer, fewer; past 1.4 km only the backdrop's own marks
    const U = style.uniforms;
    await ctx.yield();

    // ---------- the course: +Z up the valley from the stream, beside the wall, through the herd; round the back of the crown; up to the tear ----------
    const K = 1.174;
    const pts = [[0, 3.7, Z0], [0, 3.7, Z0 + 28], [0, 3.5, 190], [0, 2.8, 228], [0, 2.3, 262], [2.5 * K, 2.3, 288], [9 * K, 2.5, 308], [29, 6, 326], [47, 13, 347],     // (the swing goes wide and climbs early: 52 m from the trunk at its nearest, so the whole tree stands in the frame with paper over it, and the tear, which must cross behind the tree somewhere, crosses behind the crown and not the bare trunk)
      [ABEAM, 15.5, OAK_Z], [52.5, 17.6, OAK_Z + 23], [43.5, 19.8, OAK_Z + 43], [26, 20, OAK_Z + 56], [8, 15.5, OAK_Z + 63.5], [-8, 10.5, OAK_Z + 69], [-36, 9.25, 453.5], [END_X, END_Y, END_Z]];
    // (round 4: from the top of the turn the course comes DOWN to the valley floor and runs its last 60 m level, 8 m up, over white
    // ground through the gathered herd to the tear, which is torn in the foot of the hillside: the way out is a picture seen from near)
    // (the last straight bears 20 degrees up the valley from the turn's end: the tear, which must cross behind the tree once as we
    // swing out, has crossed and stands clear to its left by the time the whole tree is in the frame)
    const path = makePath(pts), L = path.length;
    // lingering, in metres a second along the course: 11.5 over the stream, 9 beside the wall and through the herd (5.5 beside the
    // animal at arm's length), 12 round the tree, 12.5 on the approach
    const speed = (d) => 11.5 - 2.5 * smoothstep(50, 110, d) - 3.5 * smoothstep(150, 164, d) * (1 - smoothstep(180, 194, d)) + 3 * smoothstep(200, 236, d) + 0.5 * smoothstep(350, 390, d);
    const pace = (u) => speed(u * L) / 10.6;
    // flight seconds from u, the way the engine integrates pace (so the drawing keeps its timetable at any speed)
    const NS = 256, sTab = new Float32Array(NS + 1);
    { let acc = 0; for (let i = 1; i <= NS; i++) { acc += 1 / pace((i - 0.5) / NS); sTab[i] = acc; } for (let i = 1; i <= NS; i++) sTab[i] *= DURATION / acc; }
    const secOfU = (u) => { const f = clamp(u, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)); return lerp(sTab[i], sTab[i + 1], f - i); };
    const uOfS = (s) => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (secOfU(m) < s) lo = m; else hi = m; } return lo; };

    // ---------- the land: one paper heightfield (valley floor, stream cut, the scarp to port, a low brow to starboard) ----------
    const GX0 = -136, GZ0 = 64, CELL = 3.5, NX = 82, NZ = 150, GW = NX + 1;
    const H = new Float32Array(GW * (NZ + 1)), PU = new Float32Array(GW * (NZ + 1)), PD = new Float32Array(GW * (NZ + 1)), CV = new Float32Array(GW * (NZ + 1)), RISE = new Float32Array(GW * (NZ + 1));
    const STREAM = [150, 0.2, 5, 0.045, 0.6], streamZ = (x) => STREAM[0] + STREAM[1] * x + STREAM[2] * Math.sin(x * STREAM[3] + STREAM[4]);      // (round 19: the stream's line by its five numbers, the same line; the style is handed them)
    // (round 19) BEYOND THE STREAM THE FIRST SNOW LIES WHEN WE COME. S_LIES is the moment of the snow's timetable (flight seconds by
    // place, secOfU) at which the course crosses the stream; it is found from the course and the stream, not typed (the course is
    // walked from the entry in steps of half a metre to the first place past the stream's line, then halved in). The style takes
    // it as uLies and the stream's line as uStream: a mark that stands up the valley of that line and whose landing time is
    // earlier is drawn as one that was there from the start (T below 0). No draw is changed and no mark is added or removed:
    // beyond the stream, live's burst of landings in the first seconds is simply already down.
    const S_LIES = (() => { const q = new THREE.Vector3(), past = (u) => (path.pointAt(u, q), q.z >= streamZ(q.x)); let hi = 0; while (hi < 1 && !past(hi)) hi += 0.5 / L;
      let lo = Math.max(0, hi - 0.5 / L); for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (past(m)) hi = m; else lo = m; } return secOfU(lo); })();
    // THE TREE IS NOT TOUCHED by this rule: within TREE_KEEP of the trunk every mark keeps its landing time. 30 m: the crown's furthest
    // reach from the trunk on any edition is 28.6 m (the oak's 23 m crown by its envelope's 1.13 and 1.1; the beech 28.1 m with its
    // centre 4.5 m off; the pine less) and the bare circle's edge is at most 26.7 m out.
    const TREE_KEEP = 30;
    U.uLies.value = S_LIES; U.uStream.value = STREAM; U.uTree.value.set(0, OAK_Z, TREE_KEEP);
    // (round 4: round the tear the hillside turns 20 degrees to face the last straight, a bay 110 m wide, so its skyline lies level across the frame on the approach)
    const footX = (z) => -52 + 8 * noise.n2(z * 0.008, 3.1) * smoothstep(25, 110, Math.abs(z - END_Z)) + BAY * (z - END_Z) * (1 - smoothstep(55, 125, Math.abs(z - END_Z)));
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const x = GX0 + i * CELL, z = GZ0 + j * CELL, k = j * GW + i, np = path.nearestXZ(x, z);
        const dOak = Math.hypot(x, z - OAK_Z);
        let h = (1.5 * noise.fbm2(x * 0.011 + 5, z * 0.011, 3) + 0.5 * noise.n2(x * 0.045, z * 0.045)) * smoothstep(7, 42, np.dist) * smoothstep(27, 50, dOak);
        const b = smoothstep(62, 150, x); h += 8.5 * b * Math.sqrt(b) * (0.8 + 0.3 * noise.n2(z * 0.01, 7.7));                     // the brow the barn stands under
        const rise = clamp(footX(z) - x, 0, 70), rs = rise * smoothstep(0, 9, rise) * (1 + 0.05 * noise.n2(x * 0.03, z * 0.03 + 9));
        h -= 1.5 * (1 - smoothstep(1.6, 4.4, Math.abs(z - streamZ(x)))) * (1 - smoothstep(0, 8, rise));
        h += rs; const h0 = h;
        if (np.dist < 13 && rise > 0) h = lerp(h, Math.min(h, lerp(np.y - 7.4, h, smoothstep(8.5, 13, np.dist))), smoothstep(0, 5, rise));     // the cutting the tear sits in
        H[k] = h; CV[k] = h0 - h; PU[k] = np.u; PD[k] = np.dist; RISE[k] = rise;
      }
      if (j % 6 === 5) await ctx.yield();
    }
    const samp = (A, x, z) => {
      const fx = clamp((x - GX0) / CELL, 0, NX - 1e-3), fz = clamp((z - GZ0) / CELL, 0, NZ - 1e-3), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * GW + i;
      return lerp(lerp(A[k], A[k + 1], a), lerp(A[k + GW], A[k + GW + 1], a), b);
    };
    const hAt = (x, z) => {                                  // exactly the mesh's two triangles per cell
      const fx = clamp((x - GX0) / CELL, 0, NX - 1e-3), fz = clamp((z - GZ0) / CELL, 0, NZ - 1e-3), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * GW + i;
      return a + b <= 1 ? H[k] + a * (H[k + 1] - H[k]) + b * (H[k + GW] - H[k]) : H[k + GW + 1] + (1 - a) * (H[k + GW] - H[k + GW + 1]) + (1 - b) * (H[k + 1] - H[k + GW + 1]);
    };
    const sAt = (x, z) => secOfU(samp(PU, x, z));           // the moment the camera is nearest a place, in flight seconds
    {
      const pos = new Float32Array(GW * (NZ + 1) * 3), idx = [];
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * GW + i; pos[k * 3] = GX0 + i * CELL; pos[k * 3 + 1] = H[k]; pos[k * 3 + 2] = GZ0 + j * CELL; }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * GW + i; idx.push(k, k + GW, k + 1, k + 1, k + GW, k + GW + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeBoundingSphere();
      const land = new THREE.Mesh(g, style.paper); land.name = 'land-paper'; scene.add(land);
    }
    await ctx.yield();
    const meshes = [];
    const addStrokes = (buf, mat, name, cx, cy, cz, r) => {
      if (!buf.n) return null;
      const m = new THREE.Mesh(strokeGeometry(buf, new THREE.Vector3(cx, cy, cz), r), mat); m.name = name; m.frustumCulled = r < 1e3; scene.add(m); meshes.push(m); return m;
    };
    const R = rng.fork('marks');
    const solid = { pos: [], idx: [] };                       // every still paper solid but the land and the oak goes in here
    const box = (x0, y0, z0, x1, y1, z1, tx = 0) => {         // tx: the top is narrower by this much each side
      const b = solid.pos.length / 3; solid.pos.push(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, x0 + tx, y1, z0, x1 - tx, y1, z0, x1 - tx, y1, z1, x0 + tx, y1, z1);
      for (const q of [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]]) solid.idx.push(b + q[0], b + q[1], b + q[2], b + q[0], b + q[2], b + q[3]);
    };

    // ---------- the moor. Sepia is the place and is there before we come (tussock feet, shadow hatch, tracks); white is the snow:
    // some lies already, the rest is laid ahead of our passing, group by group, the first stroke of each falling to its place ----------
    const TILE = 56, NT = 10, tiles = Array.from({ length: NT }, () => new StrokeBuf());
    const tileOf = (z) => tiles[clamp(Math.floor((z - GZ0) / TILE), 0, NT - 1)];
    // (round 16) THE BARE GROUND UNDER THE THORN THAT STANDS TOWARD THE SUN. The thorn of the far side named here by its place and
    // size in the thorn block's list is laid FAR_UP times its size there. It stands, as the tree does, on ground the snow does not
    // reach: a circle in the tree's own proportion (the tree is 40 m tall on 46 m of bare ground: 2.3 m of radius for each time of
    // a thorn's size, the edge ragged) inside which no mark of the moor is laid. The filter sits on the moor's own buffers: every
    // draw is taken as it always was and the mark is simply not kept, so nothing after it is dealt otherwise. A thorn's own marks
    // are laid with the filter off.
    const FAR_UP = 2.5, UNDER = [[-9.5, 186, 1.2]];
    const underThorn = (x, z) => UNDER.some((u) => Math.hypot(x - u[0], z - u[1]) < 2.3 * u[2] * FAR_UP * (1 + 0.1 * noise.n2(x * 0.25 + 31, z * 0.25)));
    let layingThorn = false;
    for (const tl of tiles) { const add0 = tl.add; tl.add = function (x, y, z, ...a) { return !layingThorn && y < hAt(x, z) + 0.9 && underThorn(x, z) ? -1 : add0.call(this, x, y, z, ...a); }; }
    const bareEdge = (x, z) => 24.5 + 2.2 * noise.n2(x * 0.07 + 31, z * 0.07);
    const WALL_X = 6.4, WALL_Z0 = 180, WALL_Z1 = 262;
    // the four animals of the opening stand broadside by the course, each on a patch of bare paper with a drift behind it: [z, x, yaw]
    const OPENS = [[142.5, 7.0, 3.3], [160.5, -7.5, 0.35], [170.5, -7.0, 0.3], [174, 9.5, 3.35]];
    // when the snow reaches a place: 2 to 7 s ahead of us, earlier off to the sides; a good third of it lies there from the start
    const landAt = (x, z, r) => Math.max(sAt(x, z) - lerp(4, 7, smoothstep(150, 300, z)) * (0.35 + 0.65 * r) - 0.02 * samp(PD, x, z), 0.5 + 1.5 * r);
    const snowT = (x, z, r, pre = 0.4) => (R() < pre ? -9 : landAt(x, z, r));
    // the animals gathered before the tear: [metres before it, metres to starboard of the straight, heading off the straight's own]; each stands on bare paper, the snow behind it
    const GATH = [[7, 12, 1.5], [13, -13, -1.45], [24, 13.5, 0.5], [33, -12.5, 1.4], [45, 12.5, 1.7], [56, -15, -0.4]];
    const nearGath = (x, z, m) => { const e = path.end, t = path.endTangent, dx = x - e.x, dz = z - e.z, back = -(dx * t.x + dz * t.z), side = dz * t.x - dx * t.z; if (back < 70 && back > 0) for (const g of GATH) if (Math.abs(side - g[1]) < 3.3 + m && back - g[0] > -2.2 - m && back - g[0] < 9.5 + m) return true; return false; };
    const free = (x, z, m) => {
      if (nearGath(x, z, m)) return false;
      if (Math.hypot(x, z - OAK_Z) < bareEdge(x, z) + m) return false;
      if (Math.abs(z - streamZ(x)) < 6.9 + m) return false;
      for (const o of OPENS) if (Math.abs(x - o[1]) < 2.7 + m && Math.abs(z - o[0]) < 1.5 + m) return false;
      if (x > WALL_X - 2.4 - m && x < WALL_X + 11 + m && z > WALL_Z0 - 2 && z < WALL_Z1 + 2) return false;       // a strip of bare paper either side of the wall
      return samp(RISE, x, z) < 3 && x > GX0 + 2 && x < GX0 + NX * CELL - 2 && z > GZ0 + 2 && z < GZ0 + NZ * CELL - 2;
    };
    // a tussock: one fan of five white strokes on its crown (it trembles on its foot), three sepia strokes at its foot
    const tussock = (buf, x, y, z, T, big, w = 1, white = true) => {
      if (white && R() < WK) buf.group(x, y + 0.05, z, R.range(0.42, 0.58) * big, 0.5 * big * w, 5, 0, R.range(0.5, 0.84), T, 0, R(), 5);
      if (R() < SK) buf.group(x - 0.13 * big, y + 0.06, z + 0.05, R.range(0.26, 0.36) * big, 0.34 * big * w, 3, 1, R.range(0.6, 0.84), -9, 1, R(), 0);
    };
    // a drift: snow LIES. A patch of white hatch groups laid close enough to close up, waxy where it is deepest; sepia on its lee edge
    const drift = (buf, x, z, T, n, sz, flag = 0) => {
      const half = 0.55 * sz * Math.sqrt(n);
      for (let k = 0; k < n; k++) {
        const px = x + R.range(-1, 1) * half * 1.5, pz = z + R.range(-1, 1) * half * 0.6;
        if (!free(px, pz, 0.3)) continue;
        buf.group(px, hAt(px, pz) + 0.06, pz, R.range(0.75, 1.2) * sz, R.range(0.8, 1.15) * sz, 6, 0, R() < 0.42 ? 0.95 : R.range(0.64, 0.88), T < 0 ? -9 : T + 0.22 * k, k ? 1 : 0, R(), flag);
      }
      if (R() < 0.5 * SK) for (let k = 0; k < 2 + n / 4; k++) { const px = x - half * 1.5 - R.range(0.2, 1.2), pz = z + R.range(-1, 1) * half * 0.6 + 0.4; if (free(px, pz, 0.3)) buf.group(px, hAt(px, pz) + 0.05, pz, R.range(0.6, 0.9) * sz, R.range(0.7, 1.0) * sz, 5, 1, R.range(0.6, 0.82), -9, 1, R(), R() < 0.4 ? 2 : 0); }
    };
    const snowLies = (x, z) => noise.fbm2(x * 0.016 + 19, z * 0.034 + 7, 2);            // long across the valley: the drifts lie in bands
    const SWING = (z) => (z > 262 ? (z - 262) * 0.1 * K : 0);
    {
      const dN = Math.min(dens, 1.05);
      // tussocks: the whole valley floor, thick near the course, thinning to the sides
      const nT = Math.round(4600 * Math.min(dens, 1.2) * detail);
      for (let i = 0; i < nT; i++) {
        const z = R.range(100, 585), d = 2.2 + 140 * Math.pow(R(), 3), x = (z > 300 ? 13 * smoothstep(300, 350, z) : 0) + d * R.sign(), r = R(), big = R.range(0.75, 1.3), g = R();
        if (i % 250 === 249) await ctx.yield();
        if (!free(x, z, 0) || noise.n2(x * 0.035 + 11, z * 0.035) < -0.3 + 0.35 * g) continue;
        const dO = Math.hypot(x, z - OAK_Z); if (dO < 47 && g > smoothstep(33, 47, dO)) continue;        // the hero's apron hatches the ring round the bare circle
        tussock(tileOf(z), x, hAt(x, z), z, snowT(x, z, r), big * (1 + d / 90), 1, d < 38);     // far off, half of them are only their dark feet
      }
      // the ground we fly over, z 105 to 310, 30 m either side: fans close enough to count their five strokes
      const nN = Math.round(4200 * dN * detail);
      for (let i = 0; i < nN; i++) {
        const z = R.range(105, 310), d = 30 * Math.pow(R(), 1.5), x = SWING(z) + d * R.sign(), r = R(), big = R.range(0.85, 1.5), g = R();
        if (i % 250 === 249) await ctx.yield();
        if (!free(x, z, 0) || noise.n2(x * 0.06 + 71, z * 0.06) < -0.45 + 0.3 * g) continue;
        tussock(tileOf(z), x, hAt(x, z), z, snowT(x, z, r), big, big > 1.2 ? 1.2 : 1);
      }
      // ... and right under us, 7 m either side of the course: the strip the bottom of the frame looks down on
      const nU = Math.round(1700 * dN * detail);
      for (let i = 0; i < nU; i++) {
        const z = R.range(102, 300), x = SWING(z) + R.range(0, 7.5) * R.sign(), r = R(), big = R.range(1.0, 1.7), g = R();
        if (i % 250 === 249) await ctx.yield();
        if (!free(x, z, 0) || noise.n2(x * 0.09 + 5, z * 0.09 + 40) < -0.55 + 0.3 * g) continue;
        if (g < 0.72) tussock(tileOf(z), x, hAt(x, z), z, snowT(x, z, r), big, 1.2); else drift(tileOf(z), x, z, snowT(x, z, r, 0.5), 3, 0.9);
      }
      // a few big clumps at 4 to 9 m that stand a tenth of the frame high as we pass
      for (let z = 132, k = 0; z < 300; z += R.range(6, 10), k++) {
        const side = k % 2 ? 1 : -1, x = SWING(z) + side * R.range(3.6, 8.5), big = R.range(2.1, 2.9), r = R();
        if (!free(x, z, 0.6)) continue;
        tussock(tileOf(z), x, hAt(x, z), z, snowT(x, z, 0.3 + 0.5 * r, 0.25), big, 1.3);
        tussock(tileOf(z), x + R.range(0.5, 0.9), hAt(x, z), z + R.range(-0.5, 0.5), snowT(x, z, 0.5, 0.25), big * 0.6, 1.2);
      }
      await ctx.yield();
      // drifts near the course: solid white where the snow lies (the bands of a slow noise), bare paper and tussock between
      const nND = Math.round(2600 * dN * detail);
      for (let i = 0; i < nND; i++) {
        const z = R.range(104, 330), d = 3 + 52 * Math.pow(R(), 1.25), x = SWING(z) + d * R.sign(), r = R(), g = R(), n = 4 + R.int(0, 5), sz = R.range(0.8, 1.25) * (1 + d / 70);
        if (i % 150 === 149) await ctx.yield();
        if (!free(x, z, 1.2) || snowLies(x, z) < 0.02 + 0.25 * g || R() > WK) continue;
        drift(tileOf(z), x, z, snowT(x, z, r, 0.45), n, sz);
      }
      // ... and out across the whole floor and up the brow, larger and fewer
      const nFD = Math.round(1700 * Math.min(dens, 1.2) * detail);
      for (let i = 0; i < nFD; i++) {
        const z = R.range(100, 586), x = R.range(-60, 150), r = R(), g = R(), n = 4 + R.int(0, 4), sz = R.range(1.5, 2.3);
        if (i % 150 === 149) await ctx.yield();
        const pd = samp(PD, x, z);
        if (pd < 40 || !free(x, z, 1.5) || snowLies(x, z) < -0.05 + 0.3 * g || R() > WK) continue;
        if (Math.hypot(x, z - OAK_Z) < 106) continue;                                    // the ring round the tree is drawn below, to be seen from above
        drift(tileOf(z), x, z, snowT(x, z, r, 0.6), n, sz * (1 + pd / 160));
      }
      // THE FIRST SNOW LIES AND GROWS (round 4). Broad level passes of hard white chalk across the valley floor, each a run of hatch
      // groups laid side by side along the land: a few lie there when we come, half the field is white by the herd, nearly all of it
      // by the top of the turn. Near the course a pass is laid a few seconds ahead of us (or after we have gone by: the turn looks
      // back down on a whiter valley); far off they come by a timetable of their own. Bare paper is left in ragged islands between.
      {
        const PR = rng.fork('passes'), kD = 0.55 + 0.45 * detail, q = new THREE.Vector3(), pxT = new Float32Array(280);
        for (let i = 0; i <= 300; i++) { path.pointAt(i / 300 * 0.6, q); const zi = Math.round(q.z - 100); if (zi >= 0 && zi < 280 && q.z <= OAK_Z + 1) pxT[zi] = q.x; }
        const onePass = (x0, zc, sz, near) => {
          const run = PR.range(5, 22) * sz, g = PR(), wob = PR.range(0, 6.28), sA = sAt(x0, zc), r2 = PR();
          let T;
          if (g < 0.08) T = -9;
          else if (near) T = g < lerp(0.3, 0.92, clamp(sA / 30, 0, 1)) ? Math.max(0.5, sA - lerp(3, 8, r2)) : Math.min(33, sA + lerp(4, 14, r2));
          else T = lerp(1.5, 32, (g - 0.08) / 0.92);
          let k = 0;
          for (let x = x0; x < x0 + run; ) {
            const wid = PR.range(1.5, 2.1) * sz, len = PR.range(0.8, 1.15) * sz * (near ? 1 + 0.35 * smoothstep(300, 330, zc) : 1.3), pz = zc + 0.35 * sz * Math.sin(x * 0.4 / sz + wob) + PR.range(-0.15, 0.15) * sz, hard = PR() < 0.6, sd = PR();
            if (free(x, pz, 0.5) && snowLies(x * 1.7 + 40, pz * 1.7) > -0.3 && PR() < WK) { tileOf(pz).group(x, hAt(x, pz) + 0.07, pz, len, wid, 6, 0, hard ? 0.95 : PR.range(0.8, 0.88), T < 0 ? -9 : T + 0.1 * k, k ? 1 + k % 4 : 0, sd, 6); k++; }
            x += wid * PR.range(0.55, 0.72);
          }
          return run;
        };
        let cnt = 0;
        for (let z = 101; z < 372; z += 1.25 / kD) {             // beside and under the course, as far as the swing
          q.x = pxT[clamp(Math.round(z - 100), 0, 279)];
          for (let x = q.x - 36 + PR.range(0, 5); x < q.x + 36; ) { const pd = samp(PD, x, z), sz = clamp(0.72 + pd / 34, 0.8, 1.7); x += onePass(x, z + PR.range(-0.4, 0.4), sz, true) + PR.range(0.5, 5) * sz * (PR() < 0.25 ? 3 : 1); if (++cnt % 60 === 0) await ctx.yield(); }
        }
        for (let z = 100; z < 587; z += 3.3 / kD) {              // the whole floor of the valley and the brow, larger and fewer
          for (let x = -66 + PR.range(0, 8); x < 150; ) { const pd = samp(PD, x, z), sz = clamp(0.9 + pd / 60, 1.5, 2.6), nearStrip = z < 372 && pd < 33; x += (nearStrip ? 12 : onePass(x, z + PR.range(-1, 1), sz, pd < 70 && z > 330)) + PR.range(0.5, 6) * sz * (PR() < 0.25 ? 3 : 1); if (++cnt % 60 === 0) await ctx.yield(); }
        }
      }
      // pony tracks: two lines of sepia ticks wandering up the valley from the stream to where the herd stands
      for (let t = 0; t < 2; t++) {
        const x0 = t ? 9 : -5, ph = R.range(0, 6.28);
        for (let z = 157; z < 296; z += 0.55) {
          const x = x0 + 4.5 * Math.sin(z * 0.045 + ph) + 2 * Math.sin(z * 0.11 + ph * 2) + (Math.round(z / 0.55) % 2 ? 0.16 : -0.16);
          if (!free(x, z, 0.3) || noise.n2(z * 0.07 + t * 9, 2.2) < -0.35) continue;
          tileOf(z).add(x, hAt(x, z) + 0.04, z + R.range(-0.08, 0.08), R.range(0.2, 0.28), 0.05, 1, R.range(0.65, 0.88), -9, 1, R(), 0);
        }
        await ctx.yield();
      }
    }
    // ---------- the moor round the tree, drawn to be seen from the turn (12 to 24 m up, 40 to 110 m off): drifts in wide hard groups
    // (flag 6: they keep their white from above), thick in a ring round the ground under the crown ----------
    {
      const nR = Math.round(1500 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nR; i++) {
        const a = R.range(0, 6.2832), rr = Math.sqrt(R.range(24 * 24, 108 * 108)), x = Math.sin(a) * rr, z = OAK_Z + Math.cos(a) * rr, g = R(), r = R(), n = 3 + R.int(0, 3), sz = R.range(1.2, 1.9);
        if (i % 150 === 149) await ctx.yield();
        const edge = bareEdge(x, z) + 1.6;
        if (rr < edge || !free(x, z, 1.2) || g > lerp(1, 0.4, smoothstep(40, 70, rr)) || R() > WK + 0.2) continue;
        if (rr > 50 && snowLies(x, z) < -0.1) continue;
        const T = R() < 0.5 ? -9 : rr < 52 ? 2 + 5 * clamp((z - OAK_Z + 47) / 94, 0, 1) + 1.2 * r : landAt(x, z, r), buf = tileOf(z);
        for (let k = 0; k < n; k++) {
          const px = x + (k - n / 2) * 0.9 * sz + R.range(-0.3, 0.3), pz = z + R.range(-0.7, 0.7) * sz;
          if (Math.hypot(px, pz - OAK_Z) < edge - 0.8) continue;
          buf.group(px, hAt(px, pz) + 0.06, pz, R.range(0.7, 1.1) * sz, R.range(0.7, 1.0) * sz, 5, 0, R() < 0.35 ? 0.95 : R.range(0.64, 0.86), T, k ? 1 : 0, R(), 6);
        }
        if (g < 0.3 * SK) { const px = x - 1.1 * sz - 0.9, pz = z + 0.8 * sz; if (Math.hypot(px, pz - OAK_Z) > edge) buf.group(px, hAt(px, pz) + 0.05, pz, R.range(0.6, 0.9) * sz, 0.9 * sz, 5, 1, R.range(0.6, 0.8), -9, 1, R(), 6); }
      }
      // (5b, G2) the white closes hard round the bare circle: a ragged ring of pressed hatch, two rows, along its 46 m edge, so the only
      // undrawn ground is known by the white round it from the far end of the valley and from the turn. Its stream is its own, made from
      // the seed and a name (it draws from no other); it lies from the first frame and has no time of its own (T -9, as half of the drifts it lies among)
      const rg = ctx.core.makeRng(ctx.core.hashSeed('bare-ring:' + ctx.seed));
      for (let a = 0; a < 6.2832; a += rg.range(0.012, 0.024)) for (let row = 0; row < 2; row++) {
        const x0 = Math.sin(a) * 30, z0 = OAK_Z + Math.cos(a) * 30, rr = bareEdge(x0, z0) + 0.5 + 1.5 * row + rg.range(0, 1.3), x = Math.sin(a) * rr, z = OAK_Z + Math.cos(a) * rr, g = rg(), sd = rg();
        if (g > (row ? 0.7 : 0.92) * Math.min(1, WK + 0.2) || !free(x, z, 0.2)) continue;
        tileOf(z).group(x, hAt(x, z) + 0.06, z, rg.range(0.8, 1.15), rg.range(1.0, 1.5), 5, 0, sd < 0.55 ? 0.95 : 0.88, -9, row + (g < 0.2 ? 0 : 1), rg(), 6);
      }
    }
    await ctx.yield();
    // ---------- the stream: a dark sepia band between two white lips, rushes that nod, strokes that slide on the water ----------
    {
      const flow = new StrokeBuf('flow'), sb = tileOf(150), lipK = 0.85 * Math.min(1, WK + 0.25);
      for (let x = -58; x < 128; x += 0.5) {
        const zc = streamZ(x), tz = streamZ(x + 1) - zc, tl = Math.hypot(1, tz), g = Math.floor((x + 58) / 2.5);
        if (samp(RISE, x, zc) > 1) continue;
        const T = ((g * 7) % 5) < 2 ? -9 : 0.5 + Math.abs(x) * 0.035 + ((g * 3) % 4) * 0.3;
        for (const side of [-1, 1]) {
          // a lip: white hatch standing along the top of the bank (the far one deeper, so it shows over the water)
          for (let m = 0; m < (side > 0 ? 2 : 1); m++) if (R() < lipK) { const mz = zc + side * (R.range(4.7, 5.6) + m * 0.85); sb.group(x + R.range(-0.2, 0.2), hAt(x, mz) + 0.08, mz, R.range(0.7, 1.0) * (side > 0 ? 1 : 0.7), 0.62, 5, 0, R() < 0.4 ? 0.95 : R.range(0.66, 0.86), T, m ? 1 : 0, R(), 0); }
          // the dark under the lip: sepia down the bank's face. The far face is turned to us as we come, and is what says "water"
          for (let m = 0; m < (side > 0 ? 2 : 1); m++) { const fz = zc + side * (side > 0 ? R.range(2.9, 4.3) : R.range(2.3, 4.0)); sb.group(x + R.range(-0.2, 0.2), hAt(x, fz) + 0.07, fz, R.range(0.55, 0.8), 0.62, 5, 1, R.range(0.78, 0.9), -9, 1, R(), R() < 0.3 ? 9 : 0); }
        }
        if (g % 2 === 0 || noise.n2(g * 1.3, 8.1) > 0.1) {   // rushes: long white strokes on the lips, nodding on their feet
          const side = g % 3 === 0 ? 1 : -1, tall = side < 0 ? 1 : 0.7;
          if (R() < 0.85) { const rz = zc + side * R.range(3.9, 4.7); sb.add(x + R.range(-0.2, 0.2), hAt(x, rz) + 0.05, rz, R.range(0.9, 1.5) * tall, 0.075, 0, R.range(0.7, 0.9), R() < 0.5 ? -9 : 1 + 2 * R(), 1 + R.int(0, 4), R(), 4); }
        }
        for (let m = 0; m < 2; m++) { const sz = zc + R.range(-1.7, 1.7); sb.group(x + R.range(-0.2, 0.2), hAt(x, sz) + 0.05, sz, R.range(0.5, 0.8), 0.64, 5, 1, R.range(0.74, 0.9), -9, 1, R(), R() < 0.35 ? 9 : 0); }   // the dark water on the bed
        if (R() < 0.7) { const fz = zc + R.range(-1.2, 1.2); flow.add(x, hAt(x, fz) + 0.1, fz, R.range(0.6, 0.95), 0.07, 1, R.range(0.7, 0.9), -9, 1 + R.int(0, 4), R(), 0); flow.setAlt(7 / tl, 0, 7 * tz / tl); }
        if (Math.round(x * 2) % 80 === 0) await ctx.yield();
      }
      addStrokes(flow, style.strokeFlow, 'stream-flow', 30, 0, 156, 110);
    }
    await ctx.yield();
    // ---------- the wall: 82 m of dry stone, the one built line in the valley: a hard white cap over a sepia face, bare paper either side ----------
    const GAP0 = 236, GAP1 = 238.6;
    {
      for (let z = WALL_Z0; z < WALL_Z1; z += 1.3) {
        if (Math.round((z - WALL_Z0) / 1.3) % 16 === 15) await ctx.yield();
        const z1 = Math.min(z + 1.3, WALL_Z1), gap = z + 0.65 > GAP0 && z + 0.65 < GAP1, g = hAt(WALL_X, z + 0.65), top = g + (gap ? 1.12 : 1.4 + R.range(-0.09, 0.1));
        if (gap) box(WALL_X - 0.04, g - 0.3, z, WALL_X + 0.04, top, z1); else box(WALL_X - 0.42, g - 0.4, z, WALL_X + 0.42, top, z1, 0.1);
        const buf = tileOf(z), T0 = sAt(WALL_X, z) - 5;
        if (gap) {                                          // the hurdle across the gap: six sepia strokes
          for (let k = 0; k < 3; k++) buf.add(WALL_X - 0.06, g + 0.25 + 0.4 * k + R.range(-0.04, 0.04), z + R.range(0.3, 1.0), 1.5, 0.075, 1, 0.85, -9, 1, R(), 0);
          continue;
        }
        const broken = noise.n2(z * 0.21, 4.4) < -0.4;      // where the cap of snow has slipped
        for (let k = 0; k < 4; k++) {
          const zz = lerp(z, z1, (k + R()) / 4);
          // the cap: hard white, a third of a metre deep, on the edge of the coping turned to us
          if (!broken && R() < 0.96 * Math.min(1, WK + 0.3)) buf.group(WALL_X - 0.3, top + 0.2 + R.range(-0.03, 0.04), zz, R.range(0.62, 0.8), 0.44, 5, 0, R() < 0.6 ? 0.95 : R.range(0.74, 0.88), R() < 0.8 ? -9 : Math.max(0.6, T0 + 2.5 * R()), k ? 1 : 0, R(), 0);
          // the lee face in two courses of sepia hatch, paper showing between the stones here and there
          for (let c = 0; c < 2; c++) if ((c ? noise.n2(zz * 1.7, 3.3) > -0.5 : noise.n2(zz * 0.9, 7.1) > 0.15) && R() < 0.95 * Math.min(1, SK + 0.2)) buf.group(WALL_X - 0.47, top - 0.9 + c * 0.52 + R.range(-0.04, 0.04), zz, R.range(0.6, 0.72), 0.46, 5, 1, R.range(0.8, 0.92), -9, 1, R(), R() < 0.3 ? 9 : 0);
        }
      }
    }
    await ctx.yield();
    const HUT = { x: -96, z: 446, y: 0 }; HUT.y = hAt(HUT.x + 3, HUT.z) - 0.2;
    // the white ground before the tear: a tongue of snow up the cutting and its banks, 60 m long (1 in its middle, 0 outside it)
    const apronAt = (x, z) => { const e = path.end, t = path.endTangent, dx = x - e.x, dz = z - e.z, back = -(dx * t.x + dz * t.z), side = dz * t.x - dx * t.z; return back > 2.5 && back < 84 ? clamp(1.25 - Math.abs(side + 2) / lerp(13, 26, back / 84), 0, 1) : 0; };
    const sideP = (back, sd) => [path.end.x - path.endTangent.x * back - path.endTangent.z * sd, path.end.z - path.endTangent.z * back + path.endTangent.x * sd];      // a place by the last straight: metres before the tear, metres to starboard
    const BOLD = [[...sideP(15, -17), 3.7], [...sideP(9, 16.5), 3.1]];      // the last straight's line; the two thorns that stand beside it
    // ---------- thorn trees, the oak in miniature: sepia limbs there from the start, the snow laid along them early ----------
    {
      const ex = path.end;
      const TH = [[-13, 204, 1], [16, 246, 1.1], [-10.5, 226, 1.15], [-44, 318, 1], [-41, 352, 1], [-6.8, streamZ(-6.8) - 5.4, 2.1], [-9.5, 186, 1.2], BOLD[0], BOLD[1], [...sideP(43, 18), 1.4], [30, 214, 1.2]], trLive = rng.fork('thorns'), tsLive = rng.fork('thorn-snow'), dark = { pos: [], idx: [], lit: [], piv: [], litFn: (rx, ry, rz) => ry + rx * 0.5 - 0.5 };
      // (the two on the slope beside the last straight are a size up and drawn at full strength, the tree in miniature: the foreground of the approach)
      // (round 15) THE TWO THORNS BEYOND THE WALL STAND A SIZE UP: the brief has thorns "along the wall ... drawn like the oak in
      // miniature and finished early, so the eye learns the rule before it meets the oak"; the two that stand beyond the wall
      // (TH 1 and TH 10) are laid at twice their size in shaded wood, as the two by the last straight are, at their own places
      // (their drift lies on the lit side and their dark falls toward the wall, by the same light).
      // Live's deal is held for every other thing: each of the two is first dealt as live with nothing laid (every draw of the
      // shared streams and of the world's own stream taken as live and not used), then laid at its size from streams forked
      // from its own berry stream, which nothing else reads.
      // (round 16) THE ONE OF THE FAR SIDE THAT STANDS TOWARD THE SUN (UNDER, by the moor's buffers) is laid the same way at FAR_UP times
      // its size, on its bare ground: no drift at the foot and no snow to stand in, for the snow does not reach under it.
      const UP = { 1: 2, 10: 2 }, NONE = { add() {}, group() {} }, GHOST = { pos: [], idx: [] }; let upSrc = null;
      for (const u of UNDER) UP[TH.findIndex((t) => t[0] === u[0] && t[1] === u[1] && t[2] === u[2])] = FAR_UP;
      layingThorn = true;
      for (let ti = 0; ti < TH.length; ti++) for (const pass of UP[ti] ? [0, 1] : [0]) {
        const up = !!UP[ti] && pass === 1, ghost = !!UP[ti] && pass === 0, bare = up && UNDER.some((u) => u[0] === TH[ti][0] && u[1] === TH[ti][1]);
        const tr = up ? upSrc.fork('thorn-up') : trLive, ts = up ? upSrc.fork('thorn-up-snow') : tsLive;
        const [tx, tz, tb0] = TH[ti], tb = up ? tb0 * UP[ti] : tb0, ty = hAt(tx, tz), buf = ghost ? NONE : tileOf(tz), boldT = ti === 7 || ti === 8 || up, T0 = Math.max(0.6, sAt(tx, tz) - (ti > 6 ? 12 : 6)), lean = tr.range(-0.5, -0.2);
        const limbs = [];
        const grow = (p, d, len, r, depth) => {
          const n = depth === 0 ? 5 : 4, ch = [[p[0], p[1], p[2], r]]; let q = p.slice(), dd = d.slice();
          for (let i = 1; i <= n; i++) {
            dd = [dd[0] + tr.range(-0.3, 0.3) + (depth ? lean * 0.25 : lean * 0.12), dd[1] + tr.range(-0.2, 0.25) + (depth ? 0.05 : 0), dd[2] + tr.range(-0.3, 0.3)];
            const l = Math.hypot(dd[0], dd[1], dd[2]) || 1; dd = dd.map((v) => v / l); q = [q[0] + dd[0] * len / n, q[1] + dd[1] * len / n, q[2] + dd[2] * len / n];
            if (bare && path.distanceTo(q[0], q[1], q[2]) < 5) break;      // (round 16) a limb of the thorn a size up on the far side ends 5 m short of the way we pass
            ch.push([q[0], q[1], q[2], Math.max(0.012, r * (1 - 0.8 * i / n))]);
            if (depth < 2 && i >= (depth === 0 ? 2 : 1)) for (let c = 0; c < (depth === 0 ? 2 : 1) + (tr() < 0.5 ? 1 : 0); c++) {
              const a = tr.range(0, 6.28), e = tr.range(0, 0.6);
              grow(q, [Math.cos(a) * Math.cos(e) + lean, Math.sin(e), Math.sin(a) * Math.cos(e)], len * tr.range(0.55, 0.8), Math.max(0.012, r * (1 - 0.8 * i / n) * 0.6), depth + 1);
            }
          }
          limbs.push(ch); if (r > 0.03 && ch.length > 1) sweepTube(ch, depth === 0 ? 6 : 4, ghost ? GHOST : boldT ? dark : solid);     // (the two bold ones are shaded wood, like the tree)
        };
        grow([tx, ty - 0.3, tz], [lean * 0.4, 1, 0], 2.6 * tb, 0.17 * tb, 0);
        for (const ch of limbs) for (let i = 1; i < ch.length; i++) {
          const a = ch[i - 1], c = ch[i], sl = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), n = Math.floor(sl * 6 + tr()), Tl = tr() < 0.4 ? -9 : T0 + tr.range(0, 3.2), T = tz < streamZ(tx) ? -9 : Tl;      // (round 19) a thorn on the stream's near bank is finished when we come (its draws taken as live)
          for (let k = 0; k < n; k++) {
            const f = tr(), x = lerp(a[0], c[0], f), y = lerp(a[1], c[1], f), z = lerp(a[2], c[2], f), r = lerp(a[3], c[3], f);
            if (y < ty + 0.2) continue;
            if (tr() < WK * (boldT ? 0.4 : 1)) buf.add(x + r * 0.3, y + r + 0.015, z - r * 0.4, tr.range(0.3, 0.5) + r, 0.04, 0, tr.range(0.5, 0.88), T, k % 6, tr(), 0);
            if (tr() < 0.7 * SK) buf.add(x - r * 0.3, y - r - 0.015, z + r * 0.3, tr.range(0.28, 0.44) + r, 0.04, 1, tr.range(0.55, 0.8), -9, 1, tr(), 0);
            if (r > 0.05 && tr() < 0.75) { const fx = ti >= 7 && ti <= 9; buf.group(x + (fx ? r * 1.05 : -r * 0.5), y, z - (fx ? 0 : r * 1.05), 0.45 + 2.4 * r, 0.3 + 1.6 * r, 4, 1, tr.range(0.8, 0.92), -9, 1, tr(), tr() < 0.3 ? 9 : 0); }
            // hard white along the top of every limb, in broad groups that hold their pigment from 80 m (flag 7: the size they are given)
            if (boldT && r > 0.03 && k % 2 === 0 && ts() < WK + 0.15) buf.group(x + r * 0.4, y + r + 0.24, z, ts.range(0.55, 0.75), ts.range(0.6, 0.85), 4, 0, ts() < 0.65 ? 0.95 : 0.88, T < 0 ? -9 : T, 1 + k % 4, ts(), 7);
          }
        }
        {
          const bk = up ? upSrc.fork('thorn-up-berries') : rng.fork('berries-' + ti), every = boldT ? 0.8 : ti === 5 ? 0.4 : 0.3;
          for (const ch of limbs) { const q = ch[ch.length - 1], q0 = ch[Math.max(0, ch.length - 2)]; if (q[3] > 0.05 || q[1] < ty + 1 || bk() > every || path.distanceTo(q[0], q[1], q[2]) < 9) continue;
            for (let k = 0, n = 1 + bk.int(0, 2); k < n; k++) { const f = bk(); buf.group(lerp(q0[0], q[0], f) + bk.range(-0.15, 0.15), lerp(q0[1], q[1], f) - 0.2, lerp(q0[2], q[2], f) + bk.range(-0.15, 0.15), bk.range(0.17, 0.23) * (boldT ? 1.25 : 1), bk.range(0.24, 0.34) * (boldT ? 1.25 : 1), 3, 2, 0.95, -9, 1, bk(), 0); } }
          if (ghost) upSrc = bk;
        }
        if (boldT && !bare) for (let k = 0; k < 12; k++) {             // its drift: snow banked against the foot on the side the course passes, the dark it throws below it
          const px = tx + ts.range(0.8, 4.2), pz = tz + ts.range(-3.2, 3.2), wh = k < 7;
          buf.group(wh ? px : tx - ts.range(0.5, 2.5), hAt(wh ? px : tx, pz) + 0.3, pz, ts.range(0.9, 1.3), ts.range(1.0, 1.5), 5, wh ? 0 : 1, wh ? (k % 2 ? 0.95 : 0.88) : 0.86, -9, 1, ts(), wh ? 7 : 9);
        }
        // the snow it stands in and the dark it throws
        if (!bare) for (let k = 0; k < 5; k++) { const px = tx + tr.range(-1.6, 1.6) * tb, pz = tz + tr.range(-1, 1); buf.group(px, hAt(px, pz) + 0.06, pz, tr.range(0.6, 0.9), 0.7, 5, k < 3 ? 0 : 1, k < 3 ? 0.9 : 0.75, -9, 1, tr(), 0); }
        await ctx.yield();
      }
      layingThorn = false;
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dark.pos), 3)); dg.setIndex(dark.idx);
      dg.setAttribute('aLit', new THREE.BufferAttribute(new Float32Array(dark.lit), 1)); dg.setAttribute('aPiv', new THREE.BufferAttribute(new Float32Array(dark.piv), 3)); dg.computeBoundingSphere();
      const dm = new THREE.Mesh(dg, style.paperDark); dm.name = 'thorn-wood'; scene.add(dm);
    }
    // ---------- the scarp: the one large sepia mass in the valley. Dead bracken hatched hard in beds, there from the start, in sepia only
    // (the brief's own words); snow lying along the foot of the slope; two walls climbing it; its top a ragged line under the sky ----------
    {
      const ex = path.end, nP = Math.round(7400 * (0.5 + 0.5 * detail)), nC = Math.round(380 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nP + nC; i++) {
        const more = i >= nP;                                     // ... and more of it in and round the cutting, so the tear sits in a hillside hatched on every side
        const z = more ? ex.z + R.range(-28, 28) : R.range(96, 588), rise = more ? R.range(2, 66) : 70 * Math.pow(R(), 0.85), x = footX(z) - rise - R.range(0, 1), r = R(), g = R();
        if (i % 150 === 149) await ctx.yield();
        if (x < GX0 + 2) continue;
        if (BOLD.some((b) => x > b[0] - 3.3 * b[2] && x < b[0] + 2 && Math.abs(z - b[1] - BAY * (b[0] - x)) < 1.25 * b[2] * (1 + 0.25 * noise.n2(x * 0.2, z * 0.2)))) continue;      // bare paper behind each of the two thorns, as the straight sees them
        const cut = samp(CV, x, z) > 0.05, pd = samp(PD, x, z);
        if (apronAt(x, z) > 0.3 && g > 0.2) continue;
        if (Math.abs(x - HUT.x) < 9.5 && Math.abs(z - HUT.z) < 11) continue;               // the hut stands in a clearing                                    // (the snow lies there: only a little of the bracken shows through)
        const bed = noise.n2(x * 0.03 + 3, z * 0.03) + 0.5 * noise.n2(x * 0.09, z * 0.09 + 5);       // bracken grows in beds
        if (!cut && !more && bed < -0.4 + 0.3 * g) continue;
        if (more && (!cut && pd > 26 || (Math.abs(x - ex.x) < 3.5 && Math.abs(z - ex.z) < 6.5))) continue;
        const y = hAt(x, z), dP = Math.hypot(z - ex.z, y - ex.y), near = pd < 42 || more, sz = near ? R.range(0.9, 1.4) : R.range(1.5, 2.3) * (1 + pd / 260), buf = tileOf(z);
        const foot = !cut && rise < 13 + 6 * noise.n2(z * 0.02, 1.7);                     // snow lies along the foot: the tree's dark trunk stands against it
        const n = near ? 2 + R.int(0, 2) : 2 + R.int(0, 1);
        if (!foot || g < 0.3) for (let k = 0; k < n; k++) {
          const pz = z + R.range(-1, 1) * sz, px = x + R.range(-0.8, 0.8) * sz;
          if (R() < Math.min(SK, 1.2)) buf.group(px, hAt(px, pz) + 0.15, pz, R.range(0.95, 1.4) * sz, R.range(0.9, 1.25) * sz, 6, 1, R.range(0.76, 0.92), -9, 1, R(), R() < 0.22 ? 9 : 0);
        }
        const wT = dP < 30 ? lerp(29, 38.4, r) : R() < 0.4 ? -9 : clamp(sAt(x, z) - 4 - 9 * r, 0.8, 34);        // what is laid within 30 m of the tear lands late (in live a ring of white dabs; from 14 on the snow along the foot there)
        // (14) THE HILL ABOVE ITS FOOT IS SEPIA ONLY. The white dab that lay on a clump's shoulder above the foot is no longer laid: the
        // hill is one sepia mass, and the white birds, the two thorns and the tear's pale rim are the white things on it. Its numbers are
        // still drawn from R, by the same calls in the same order, so that every mark dealt after it is the one it always was. The snow
        // along the foot is laid as before
        if ((foot ? g > 0.2 : g > 0.64) && R() < WK) {
          const gz = z + R.range(-0.4, 0.4), gl = R.range(0.7, 1.0) * sz, gw = R.range(0.7, 1.0) * sz * (foot ? 1.3 : 1), gp = R() < 0.3 ? 0.95 : R.range(0.62, 0.86), gs = R();
          if (foot) buf.group(x + 0.5, y + 0.2, gz, gl, gw, 5, 0, gp, wT, 0, gs, 0);
        }
      }
      // (5b, G3; 5c, G6) THE TEAR SITS IN THE DARKEST HATCH. An addition to the hillside above, which stays as it is: between 7.6 m and 19 m
      // from the tear's middle on the hill's own face (z up the valley, rise above its foot) the bracken is hatched closer, pressed hard and
      // crossed at 25 degrees, its edge ragged (14 to 19 m); none on the white ground before the tear, behind the two thorns or in the hut's
      // clearing. It is the hill's own sepia and is there as the hill's sepia is (T -9, like the groups above). The number of places is the
      // area they are dealt over times a density (the one 5b had over its 62 m square), so a narrower ring is fewer places, not closer ones.
      // Its stream is its own, made from the seed and a name (it draws from no other)
      {
        const TR = ctx.core.makeRng(ctx.core.hashSeed('tear-ring:' + ctx.seed)), tearRise = footX(END_Z) - END_X, RG = 19, RG_DENS = 560 / (62 * 62), nRg = Math.round((2 * RG) * (2 * RG) * RG_DENS * (0.6 + 0.4 * detail));      // tearRise: the tear's own height on that face; RG: the ring's outer edge (m); RG_DENS: places per square metre of the face
        for (let i = 0; i < nRg; i++) {
          const z = ex.z + TR.range(-RG, RG), rise = tearRise + TR.range(-RG, RG), x = footX(z) - rise - TR.range(0, 1), g = TR();
          if (i % 50 === 49) await ctx.yield();
          if (x < GX0 + 2 || rise < 1) continue;
          if (BOLD.some((b) => x > b[0] - 3.3 * b[2] && x < b[0] + 2 && Math.abs(z - b[1] - BAY * (b[0] - x)) < 1.25 * b[2] * (1 + 0.25 * noise.n2(x * 0.2, z * 0.2)))) continue;      // (the bare paper behind each of the two thorns is kept)
          if (apronAt(x, z) > 0.3 && g > 0.2) continue;
          if (Math.abs(x - HUT.x) < 9.5 && Math.abs(z - HUT.z) < 11) continue;
          const cut = samp(CV, x, z) > 0.05, pd = samp(PD, x, z), ringD = Math.hypot(z - ex.z, rise - tearRise), inRing = ringD < 16.5 + 2.5 * noise.n2(z * 0.12, rise * 0.12 + 3);
          if (ringD > RG || ringD < 7.6) continue;
          if ((!cut && pd > 26 && !inRing) || (Math.abs(x - ex.x) < 3.5 && Math.abs(z - ex.z) < 6.5)) continue;
          const sz = TR.range(0.9, 1.4), buf = tileOf(z), foot = !cut && !inRing && rise < 13 + 6 * noise.n2(z * 0.02, 1.7), n = 2 + TR.int(0, 2);      // (outside the ring proper the snow along the hill's foot is left to lie)
          if (!foot || g < 0.3) for (let k = 0; k < n; k++) {
            const pz = z + TR.range(-1, 1) * sz, px = x + TR.range(-0.8, 0.8) * sz;
            if (TR() < Math.min(SK, 1.2)) buf.group(px, hAt(px, pz) + 0.15, pz, TR.range(0.95, 1.4) * sz, TR.range(0.9, 1.25) * sz, 6, 1, TR.range(0.86, 0.92), -9, 1, TR(), TR() < 0.6 ? 9 : 0);
          }
        }
      }
      {
        const AR = rng.fork('apron'), e = path.end, t = path.endTangent; let k = 0;
        for (let back = 3.5; back < 84; back += 1.45) for (let side = -30; side < 27; ) {
          const x = e.x - t.x * back - t.z * side, z = e.z - t.z * back + t.x * side, ap = apronAt(x, z), wid = AR.range(3.0, 4.6), g = AR(), g2 = AR(), sd = AR();
          if (ap > 0.1 && g < 0.3 + 0.7 * ap && g2 < WK + 0.2 && !nearGath(x, z, 0)) tileOf(z).group(x, hAt(x, z) + 0.3, z, AR.range(1.7, 2.4), wid, 6, 0, sd < 0.7 ? 0.95 : 0.88, g2 < 0.3 ? -9 : lerp(20, 33.5, sd), k++ % 5 ? 1 : 0, AR(), 7);
          side += wid * AR.range(0.6, 0.95);
        }
        // tracks up it into the tear: two lines of dark ticks
        for (const s0 of [-4.5, 2.5]) for (let back = 82; back > 5; back -= 0.75) { const side = s0 + 2.2 * Math.sin(back * 0.11 + s0) + (Math.round(back / 0.75) % 2 ? 0.2 : -0.2), x = e.x - t.x * back - t.z * side, z = e.z - t.z * back + t.x * side; if (noise.n2(back * 0.09, s0) > -0.4) tileOf(z).add(x, hAt(x, z) + 0.28, z, AR.range(0.4, 0.55), 0.13, 1, 0.9, -9, 1, AR(), 7); }
      }
      // two field walls climbing it: a broken dark line, snow on it in a few unequal stretches, lost in the bracken between
      for (const z0 of [274, 490]) for (let rise = 1.5; rise < 68; rise += R.range(0.7, 1.6)) {
        const z = z0 + 0.22 * rise + 1.5 * noise.n2(rise * 0.08, z0), x = footX(z) - rise, y = hAt(x, z), buf = tileOf(z);
        if (noise.n2(rise * 0.075 + z0, 9.1) < -0.22) continue;
        buf.group(x, y + 0.5, z, R.range(0.85, 1.2), R.range(0.65, 1.0), 5, 1, R.range(0.84, 0.92), -9, 1, R(), 0);
        if (noise.n2(rise * 0.05, z0 * 1.3 + 2) > 0.02 && R() < 0.85) buf.group(x + 0.1, y + 1.2, z, R.range(0.45, 0.75), R.range(0.6, 0.95), 5, 0, 0.95, -9, 1, R(), 0);
      }
      // the hill is one hill behind the tree: its foot and its skyline are carried through the reserve round the crown as a broken
      // line of a few white and sepia marks (flag 7.6: let through), so the eye joins the two halves
      for (let z = 292; z < 452; z += R.range(2.5, 6)) {
        const fx = footX(z), on = noise.n2(z * 0.045, 12.7), g = R(), g2 = R();
        if (on > -0.25 && g < 0.75) { const x = fx - R.range(1.5, 5); tileOf(z).group(x, hAt(x, z) + 0.5, z, R.range(1.2, 1.9), R.range(1.6, 2.6), 4, 0, 0.9, -9, 1, R(), 7.6); }
        if (on < 0.3 && g2 < 0.6) { const x = fx - R.range(6, 10); tileOf(z).group(x, hAt(x, z) + 0.6, z, R.range(1.3, 1.9), R.range(1.2, 2.0), 3, 1, 0.74, -9, 1, R(), 7.6); }
        const sk = noise.n2(z * 0.06 + 5, 3.3);
        if (sk > -0.2 && R() < 0.7) { const x = fx - 69.5 - R.range(0, 3); tileOf(z).group(x, hAt(x, z) + 0.8, z, R.range(1.8, 2.6), R.range(1.6, 2.8), 3, 1, 0.74, -9, 1, R(), 7.6); }
        if (sk > 0.25 && R() < 0.5) { const x = fx - 71; tileOf(z).group(x, hAt(x, z) + 1.6, z, R.range(1.3, 1.8), R.range(1.6, 2.4), 3, 0, 0.82, -9, 1, R(), 7.6); }
      }
    }
    await ctx.yield();
    // ---------- the far side of the valley and what stands on it: marks made for the distance (flag 7: the size they are given;
    // their pressure is their tone). A wall climbing the brow, a barn under it with snow on its roof, a row of trees along the top ----------
    const bd = new StrokeBuf();
    const mark = (x, y, z, len, wid, pen, tone) => bd.add(x, y, z, len, wid, pen, tone, -9, 1, R(), 7);
    const farTree = (x, z, h) => {
      const y = hAt(x, z); mark(x, y + h * 0.22, z, h * 0.5, h * 0.09, 1, 0.85);
      for (let k = 0, n = 5 + R.int(0, 3); k < n; k++) { const a = R.range(0, 6.28), rr = R.range(0, 0.3) * h; mark(x + Math.cos(a) * rr, y + h * (0.62 + 0.3 * Math.sin(a) * R()), z + R.range(-1, 1), h * R.range(0.3, 0.42), h * R.range(0.14, 0.2), 1, R.range(0.66, 0.85)); }
      for (let k = 0; k < 3; k++) mark(x + h * R.range(0.0, 0.3), y + h * R.range(0.78, 0.98), z - 0.5, h * R.range(0.2, 0.3), h * 0.11, 0, 0.92);
    };
    {
      for (let z = 196; z < 584; z += R.range(9, 17)) farTree(128 + 14 * noise.n2(z * 0.01, 3) + R.range(-3, 3), z, R.range(7, 11));
      for (let t = 0; t <= 1; t += 1 / 80) {                 // the field wall that leaves the valley wall and climbs the brow
        const x = lerp(8.2, 150, t), z = 253 + 48 * t + 3 * Math.sin(t * 5), y = hAt(x, z), capped = noise.n2(t * 30, 5.5) > -0.45;
        if (x < 64) { const buf = tileOf(z); buf.group(x, y + 0.6, z, 1.0, 0.8, 5, 1, 0.9, -9, 1, R(), 0); buf.group(x + 0.9, y + 0.6, z + 0.3, 1.0, 0.8, 5, 1, 0.86, -9, 1, R(), 0); if (capped) { buf.group(x, y + 1.3, z, 0.55, 0.8, 5, 0, 0.95, -9, 1, R(), 0); buf.group(x + 0.9, y + 1.3, z + 0.3, 0.55, 0.8, 5, 0, 0.95, -9, 1, R(), 0); } }
        else { mark(x, y + 0.6, z, 1.3, 1.0, 1, 0.86); if (capped) mark(x, y + 1.4, z, 0.8, 0.9, 0, 0.95); }
      }
      await ctx.yield();
      // the barn: paper walls and roof; sepia hatch on the walls we see, hard white on the roof slope turned to us, a drift at its foot
      const bx = 100, bz = 322, g = hAt(bx, bz) - 0.2;
      box(bx - 4.5, g - 2, bz - 7.5, bx + 4.5, g + 4.6, bz + 7.5); box(bx - 5, g + 4.6, bz - 8, bx + 5, g + 8.2, bz + 8, 4.8);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) mark(bx - 5.1 + 4.6 * (j + 0.5) / 4, g + 4.8 + 3.5 * (j + 0.5) / 4, bz - 7.6 + 15.2 * (i + R()) / 9, 1.9, 1.35, 0, 0.95);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) if (!(i === 4 && j < 2)) mark(bx - 4.7, g + 0.8 + 1.35 * j, bz - 7.2 + 14.4 * (i + R()) / 9, 1.7, 1.25, 1, 0.9);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if (j < 3 || (i > 0 && i < 4)) if (!(i === 2 && j === 2)) mark(bx - 4.1 + 8.2 * (i + 0.5) / 5, g + 0.8 + 1.4 * j, bz - 7.7, 1.7, 1.25, 1, 0.82);
      for (let i = 0; i < 8; i++) mark(bx - 5.6 - R(), g + 0.4, bz - 8 + 16 * (i + R()) / 8, 1.0, 1.5, 0, 0.92);
      farTree(bx + 9, bz + 14, 11); farTree(bx - 6, bz + 17, 8.5); farTree(bx + 12, bz - 12, 9.5);
      mark(bx - 4.75, g + 1.5, bz - 0.4, 1.5, 1.5, 2, 0.95);                             // a light in its door: the sanguine
      // the shepherd's hut on the hillside up-valley of the tear: paper walls, sepia hatch, snow on the roof slope turned to us, the
      // sanguine in its window, its smoke going up (see the smoke buffer below)
      const hx = HUT.x, hz = HUT.z, hg = HUT.y;
      box(hx - 5, hg - 9, hz - 4.6, hx + 3.6, hg + 4, hz + 4.6); box(hx - 1.2, hg + 5.5, hz - 3.3, hx, hg + 9, hz - 2.2);
      {                                                         // the roof: a ridge running back into the hill, so the gable faces the valley
        const v0 = solid.pos.length / 3, y0 = hg + 4, y1 = hg + 8, xa = hx - 5.3, xb = hx + 4.1;
        solid.pos.push(xa, y0, hz - 5.2, xb, y0, hz - 5.2, xb, y0, hz + 5.2, xa, y0, hz + 5.2, xa, y1, hz, xb, y1, hz);
        for (const t of [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [1, 2, 5], [3, 0, 4]]) solid.idx.push(v0 + t[0], v0 + t[1], v0 + t[2]);
      }
      const hm = (x, y, z, len, wid, pen, tone, lanes = 4) => bd.group(x, y, z, len, wid, lanes, pen, tone, -9, 1, R(), 7);
      const fx = hx + 3.75;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if (!(i === 4 && j === 1) && !(i === 1)) hm(fx, hg + 0.95 + 1.75 * j, hz - 4.2 + 8.4 * (i + 0.5) / 6, 1.5, 1.3, 1, 0.9);      // the wall under the gable
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3 - j * 2; i++) if (!(j === 0 && i === 1)) hm(fx + 0.4, hg + 4.9 + 1.7 * j, hz + (i - (2 - j * 2) / 2) * 2.2, 1.5, 1.4, 1, 0.9);      // the gable
      hm(fx + 0.45, hg + 5.0, hz, 1.5, 1.4, 2, 0.95, 5);                                 // the window under the gable, and the one by the door: the sanguine
      hm(fx + 0.05, hg + 2.7, hz - 4.2 + 8.4 * 4.5 / 6, 1.5, 1.35, 2, 0.95, 5);
      hm(fx + 0.05, hg + 1.3, hz - 4.2 + 8.4 * 1.5 / 6, 2.3, 1.15, 1, 0.95, 5);          // the door
      for (const e of [-1, 1]) for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6; hm(fx + 0.5, hg + 4.35 + 4.1 * t, hz + e * 5.4 * (1 - t), 1.5, 1.5, 0, 0.95, 5); hm(fx - 2.5, hg + 4.5 + 4.1 * t, hz + e * 5.6 * (1 - t * 0.9), 1.6, 1.6, 0, 0.95, 5); }      // snow down both slopes of the roof
      hm(hx - 0.6, hg + 8.4, hz - 2.75, 1.6, 1.0, 1, 0.9);
      for (let i = 0; i < 12; i++) hm(fx + 0.6 + 3 * R(), hg - 0.9 - 2.4 * R(), hz - 7 + 14 * (i + R()) / 12, 1.4, 2.0, 0, 0.95, 5);    // the drift it stands in
    }
    await ctx.yield();
    // ---------- the far hills, three ranges, each a paper curtain (it hides what is behind it): snow fields in white hatch, lighter
    // range by range, woods in sepia, trees along the skylines ----------
    {
      const HCZ = 260, BR = [520, 760, 1060], BH = [64, 112, 165], BL = [34, 50, 72], BW = [24, 36, 50], WT = [0.8, 0.64, 0.52], ST = [0.72, 0.58, 0.48];
      const crest = (a, b) => BH[b] * (0.66 + 0.42 * noise.n2(Math.cos(a) * 2.7 + b * 5 + 20, Math.sin(a) * 2.7) + 0.12 * noise.n2(Math.cos(a) * 9 + b, Math.sin(a) * 9));
      for (let b = 0; b < 3; b++) {
        const NSEG = 144, v0 = solid.pos.length / 3;
        for (let i = 0; i <= NSEG; i++) { const a = (i / NSEG) * 6.2832; solid.pos.push(Math.sin(a) * BR[b], -40, HCZ + Math.cos(a) * BR[b], Math.sin(a) * BR[b], crest(a, b), HCZ + Math.cos(a) * BR[b]); if (i < NSEG) { const k = v0 + i * 2; solid.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
        const n = Math.round(6.2832 * BR[b] / (BW[b] * 0.62)), rr = BR[b] - 6;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * 6.2832, c = crest(a0, b); if (i % 50 === 49) await ctx.yield();
          for (let row = 0; row < 4; row++) {
            const a = a0 + R.range(0, 6.2832 / n), f = ((row + R()) / 4) * 0.9, x = Math.sin(a) * rr, y = c * f - 4, z = HCZ + Math.cos(a) * rr;
            const wood = noise.n2(Math.cos(a) * 7 + 50 + b * 9, Math.sin(a) * 7 + f * 1.5), snow = noise.n3(Math.cos(a) * 5 + b * 7, f * 2.2, Math.sin(a) * 5);
            if (b < 2 && wood > 0.2 && f > 0.15) { if (R() < Math.min(1, SK)) bd.group(x, y, z, BL[b] * 0.8, BW[b] * 0.9, 6, 1, ST[b], -9, 1, R(), R() < 0.35 ? 7.25 : 7); }
            else if (snow > -0.3 && R() < WK + 0.1) bd.group(x, y, z, BL[b], BW[b], 6, 0, WT[b], -9, 1, R(), 7);
          }
          if (b < 2 && i % 2 === 0 && noise.n2(Math.cos(a0) * 11 + b * 3, Math.sin(a0) * 11) > 0.05) mark(Math.sin(a0) * rr, c + BL[b] * 0.14, HCZ + Math.cos(a0) * rr, BL[b] * 0.5, BW[b] * 0.36, 1, ST[b]);
        }
        await ctx.yield();
      }
    }
    // ---------- the sky, laid the way a draughtsman lays one. Low over the hills a band of level chalk passes, each pass a run of
    // white hatch of its own length, the rows closing up toward the horizon; in the top of the sheet the snow cloud the fall comes
    // from, a few large ragged masses of sepia hatch crossed where they are heaviest; between band and cloud, bare paper ----------
    {
      const SR = 1900, D2R = Math.PI / 180, SKY_Y = -20, SKY_Z = 300, kS = 0.6 + 0.4 * detail;
      const put = (aD, elD, len, wid, pen, tone, fl) => { const a = aD * D2R, el = elD * D2R, ce = Math.cos(el); bd.group(Math.sin(a) * ce * SR, Math.sin(el) * SR + SKY_Y, SKY_Z + Math.cos(a) * ce * SR, len, wid, wid > 150 ? 7 : 6, pen, tone, -9, 1, R(), fl); };
      const ROWS = [5.0, 6.1, 7.4, 9.0, 11.0, 13.6];
      // a pass is a run of one to eight patches laid by one swing of the arm: neighbours overlap into one stretch of hatch, the
      // row's height wanders by a stroke length, the gaps run from none to a hand's width; no two passes the same length
      const pass = (aD, el, r, tone0, aMax) => {
        const nP = R() < 0.28 ? 1 : 2 + R.int(0, 6), w0 = R.range(40, 150) * (R() < 0.25 ? 1.75 : 1), len0 = R.range(30, 54) * (1 + 0.12 * r), tone = tone0 + R.range(-0.07, 0.08);
        let wob = R.range(-0.5, 0.5);
        for (let p = 0; p < nP && aD < aMax; p++) {
          const wid = w0 * R.range(0.7, 1.3), g = R(); wob = clamp(wob + R.range(-0.3, 0.3), -0.8, 0.8);
          if (g < WK + 0.2) put(aD, el + wob * (0.55 + 0.12 * r), len0 * R.range(0.8, 1.2), wid, 0, tone, 7);
          aD += (wid / SR) / D2R * R.range(0.3, 0.55);
        }
        return aD + (w0 / SR) / D2R * 7 * R() * R();
      };
      for (let r = 0; r < ROWS.length; r++) {
        const cover = lerp(0.3, -0.25, r / (ROWS.length - 1));          // the low rows run nearly unbroken; the top ones are a few short passes
        let aD = R.range(0, 20);
        while (aD < 360) {
          const a = aD * D2R, on = noise.n2(Math.sin(a) * 1.9 + r * 3.7 + 40, Math.cos(a) * 1.9 - r * 2.3) + 0.5 * noise.n2(Math.sin(a) * 5.5 + r * 9, Math.cos(a) * 5.5);
          if (on < cover) aD = pass(aD, ROWS[r], r, lerp(0.76, 0.5, r / (ROWS.length - 1)) + 0.06 * (on < cover - 0.3 ? 1 : 0), 360); else aD += R.range(1.2, 3.5);
        }
        await ctx.yield();
      }
      // the scarp walls the port side and hides that band: its ragged top gets passes of its own, close over it
      for (const elD of [27, 29.6, 32.5]) { let aD = -150 + R.range(0, 9); while (aD < -30) { if (noise.n2(aD * 0.06 + elD, 4.4) < 0.2) aD = pass(aD, elD, 3, 0.6, -30); else aD += R.range(2, 5); } }
      // the snow cloud: [azimuth, elevation, half width, half height, pen, tone] in degrees; azimuth 0 is up the valley, -90 over the scarp.
      // Three tiers of big ragged masses, darker and closer toward the top of the sheet; pale chalk masses low between them.
      const MASS = [[-38, 28, 19, 6.5, 1, 1], [22, 30, 23, 7.5, 1, 1], [70, 27, 17, 6, 1, 1], [128, 30, 22, 7, 1, 1], [185, 28, 18, 6.5, 1, 1], [-88, 43, 22, 6.5, 1, 1], [-140, 38, 18, 6, 1, 1],
        [-8, 42, 22, 7, 1, 1.12], [48, 44, 20, 7, 1, 1.12], [100, 41, 20, 6.5, 1, 1.1], [158, 43, 21, 7, 1, 1.1], [-50, 47, 17, 6, 1, 1.12], [-118, 52, 19, 6.5, 1, 1.12], [215, 41, 19, 6.5, 1, 1.1],
        [20, 58, 26, 8, 1, 1.22], [110, 57, 26, 8, 1, 1.2], [-70, 61, 26, 8, 1, 1.22], [-170, 58, 26, 8, 1, 1.2],
        [-18, 19, 12, 3.6, 0, 1], [46, 20.5, 13, 3.8, 0, 1], [98, 19, 12, 3.5, 0, 1], [156, 20, 13, 3.6, 0, 1], [-62, 34.5, 12, 3.4, 0, 1], [-112, 31, 12, 3.4, 0, 1], [208, 21, 12, 3.5, 0, 1]];
      for (let m = 0; m < MASS.length; m++) {
        const [a0, e0, ha, he, pen, tk] = MASS[m], az0 = a0 + R.range(-6, 6), n = Math.round(ha * he * 0.95 * kS);
        for (let i = 0; i < n; i++) {
          // strokes of every length, the big ones first and in the heart, small ones along the ragged edge; neighbours overlap by half
          const u1 = R.range(-1, 1), u2 = R.range(-1, 1), q = Math.hypot(u1, u2 * 1.15), sz = lerp(1, 0.34, clamp(q + R.range(-0.25, 0.25), 0, 1)), g = R(), cz = R();
          const aD = az0 + u1 * ha / Math.cos(e0 * D2R), elD = e0 + u2 * he + 2.2 * noise.n2(u1 * 2.2 + m * 7, 3.3) - 1.6 * u1 * u1;
          const rag = noise.n2(u1 * 2.6 + m * 11 + 5, u2 * 2.6) * 0.42;
          if (q + rag > 0.98 || g > Math.min(1, (pen ? SK : WK) + 0.1)) continue;
          if (pen) put(aD, elD, R.range(150, 215) * sz, R.range(170, 250) * sz, 1, clamp((0.5 - 0.2 * q + 0.1 * rag) * tk, 0.3, 0.64), q < 0.5 && cz < 0.5 ? 7.25 : 7);
          else put(aD, elD, R.range(110, 160) * sz, R.range(150, 230) * sz, 0, clamp(0.56 - 0.2 * q, 0.34, 0.6), 7);
        }
        await ctx.yield();
      }
      // the wash: thin sepia hatch over the whole sky, closer toward the top of the sheet. It is let through the reserve round the
      // crown (flag 7.6), so the white crown stands on a plain, slightly darker sky and never on a cloud's edge
      for (let i = 0, n = Math.round(520 * kS); i < n; i++) {
        const aD = R.range(0, 360), t = Math.sqrt(R()), elD = lerp(64, 12, t), g = R(), len = R.range(150, 230), wid = R.range(46, 74);
        if (g > lerp(1, 0.3, t) * Math.min(1, SK + 0.2)) continue;
        put(aD, elD, len, wid, 1, R.range(0.36, 0.46), 7.6);
      }
      // THE SUN: low and red, standing behind the scarp's brink up-valley of the tear, the hill hiding its foot, drawn in the sanguine:
      // a disc of hard hatch and level strokes of afterglow along the ridge either side of it. (A drawn thing with a place in the
      // world, like every mark.)
      // (round 13) THE SUN'S RINGS THREE TIMES AS FAR OUT on every seed (SUN_GROW: a number tuned on the whole field, for no still), in
      // the same pencil: the strokes keep their size, there are more rings of them, and the disc measures about 2.4 to 2.8 times its
      // old width in the picture. Its height, its place along the valley and its plane's turn are as they were; the plane stands
      // further back, behind the brink. Its lower edge is the hill's own line: the disc is laid whole and the hill's paper hides its foot.
      // (round 17) FOUR AND A HALF TIMES AS FAR OUT (the disc's radius 56.25 m, one and a half times its width of round 13), by the
      // same construction and from the same stream of its own: beside the tree on the turn the sun is the second large thing in the
      // picture, and where the tree passes before it the disc shows round the crown and through it. Height, place and turn as they were.
      {
        const SUN_GROW = 4.5, sn = rng.fork('sun'), S = { z: 508, r0: 12.5 }; S.r = S.r0 * SUN_GROW; S.x = footX(S.z) - 71.5; S.y = 76.5;      // r0: the radius the strokes were sized for (the disc's own until round 13); r: the disc's radius
        // (round 13) LIVE'S DEAL HELD: the fork 'sun' is walked through the disc loop it always had (five rings on 0.9 of r0, each place
        // and each lay held to 70.6 m) for its draws alone, so the afterglow below is dealt the numbers it always was. The draws are kept;
        // the lays are not laid twice (the disc itself is laid below, from a stream of its own)
        for (let ring = 0; ring < 5; ring++) { const d = ring / 4 * 0.9, n = ring ? Math.round(6.5 * ring) : 1;
          for (let i = 0; i < n; i++) { const a = (i + sn.range(0.2, 0.8)) / n * 6.2832; if (S.y + Math.sin(a) * d * S.r0 < 70.6) continue; sn.range(4.6, 5.6); sn.range(4.2, 5.2); sn(); sn(); } }
        // the disc: rings of hard hatch groups; it stands in a plane turned to the valley. The rings are 2.8 m apart and a ring's places
        // 2.7 m apart, as they always were (four rings and the centre on 0.9 of r0), so the count of rings and of places follows from
        // the radius. A stroke has the size the old disc gave it at the same distance in metres from the rim: within r0 of the rim the
        // lays grow small toward it, so its edge is a round one; further in they are all the centre's size.
        // Its stream is its own, made from the seed and a name (it draws from no other; a fork would cost its parent a draw)
        const wide = ctx.core.makeRng(ctx.core.hashSeed('sun-wide:' + ctx.seed)), RING = 0.9 * S.r0 / 4, rings = Math.round(0.9 * S.r / RING);
        // THE DISC STANDS WHOLE BEHIND THE BRINK, and nothing holds its lays: the hill's own paper (which writes depth) hides its foot.
        // The old plane runs out over the hill's face up-valley (the foot line bends away under it), so the disc's plane is moved
        // back from the valley, across it and by a distance found from the place alone: as far as the old plane, anywhere within the
        // disc's radius of the centre, runs out from the hill's foot line further than it does at the centre (footX, walked at the
        // land's own cell). So every place of the new plane stands at least as far behind the foot line, and so behind the brink
        // (the foot line moved by the rise's cap), as the old centre does. The afterglow below stays on the old plane
        let back = 0; { const n = Math.ceil(2 * S.r / CELL); for (let i = 0; i <= n; i++) { const c = S.r * (2 * i / n - 1); back = Math.max(back, c * 0.5 - (footX(S.z + c * 0.87) - footX(S.z))); } }
        const DX = S.x - back;      // the disc's centre across the valley (S.x: the old one, the afterglow's); c below: metres along the plane from the centre
        for (let ring = 0; ring <= rings; ring++) { const rho = ring * RING, d = Math.max(0, 1 - (S.r - rho) / S.r0), n = ring ? Math.round(6.5 * ring) : 1;
          for (let i = 0; i < n; i++) { const a = (i + wide.range(0.2, 0.8)) / n * 6.2832, c = Math.cos(a) * rho, v = Math.sin(a) * rho;
            // (5b, G1) each place of a ring is laid three times over, a fifth of a stroke apart along it and a third of a lane across, the two outer lays pressed hard: no paper is left inside the disc
            const sl = wide.range(4.6, 5.6) * (1 - 0.42 * d), sw = wide.range(4.2, 5.2) * (1 - 0.3 * d), sp = wide() < 0.75 ? 0.95 : 0.88, ss = wide();
            for (let m = -1; m <= 1; m++) { const cc = c + m * sw / 12.3, yy = S.y + v + m * 0.22 * sl; bd.group(DX + cc * 0.5, yy, S.z + cc * 0.87, sl, sw, 5, 2, m ? 0.95 : sp, -9, 1, ss, 7.6); } } }
        // (round 19) THE BRINK IS DRAWN WHERE THE SUN STANDS BEHIND IT. The hill's paper hides the disc's foot along the brink, and where
        // no bed of bracken reaches the top the disc ended on a bare straight line. Along the stretch of the brink the disc's plane
        // spans AS IT IS SEEN FROM THE COURSE (every place of the brink that a straight line on the map from a place of the course to
        // either end of the disc crosses, found here from the course walked at steps of 2 m, the disc and the hill's foot line; 6 m more at either end) the top of the hill's face is
        // hatched in three close rows of the bracken's own sepia groups (the size, pressure and lay of the hill's far beds), the
        // top row on the brink itself (from 1 m short of it to 2 m beyond, on the flat top, by a noise of the place), so the strokes
        // stand up over the hill's edge and the line is ragged. They are the hill's sepia and are
        // there as it is (T -9); they die away in the reserve round the crown as the hill's hatch does. Their stream is their own,
        // made from the seed and a name (it draws from no other).
        {
          const BR = ctx.core.makeRng(ctx.core.hashSeed('sun-brink:' + ctx.seed)), q = new THREE.Vector3(); let zA = S.z, zB = S.z;
          for (let d = 0; d <= L; d += 2) { path.pointAt(d / L, q); for (const c of [-S.r, S.r]) { const tx = DX + c * 0.5, tz = S.z + c * 0.87;
            for (let k = 1; k <= 400; k++) { const x = lerp(q.x, tx, k / 400), z = lerp(q.z, tz, k / 400); if (x < footX(z) - 70) { zA = Math.min(zA, z); zB = Math.max(zB, z); break; } } } }
          for (let z = zA - 6; z < zB + 6; z += BR.range(0.9, 1.5)) {
            const top = 72 - 3 * (0.5 + 0.5 * noise.n2(z * 0.11 + 9, 21.3));      // the hill's face ends 70 m in from its foot line: the top row stands on the brink itself
            for (let row = 0; row < 3; row++) {
              const rise = top - row * 2.6 - BR.range(0, 1.2), pz = z + BR.range(-0.6, 0.6), x = footX(pz) - rise, sz = BR.range(1.5, 2.1);
              if (BR() >= Math.min(SK, 1.2) || x <= GX0 + 2) continue;      // (the stock's sepia: on a paper that takes less of it a row is left out)
              tileOf(pz).group(x, hAt(x, pz) + 0.15, pz, BR.range(0.95, 1.4) * sz, BR.range(0.9, 1.25) * sz, 6, 1, BR.range(0.76, 0.92), -9, 1, BR(), BR() < 0.22 ? 9 : 0);
            }
          }
        }
        // the afterglow: level strokes of the sanguine either side of it, three rows, dying away outward
        // (round 13: dealt as it always was, number for number, on the plane it always had. A stroke the wider disc now stands
        // behind, its place inside the disc's radius, is left out: not dealt again, not moved)
        for (const sd of [-1, 1]) for (let row = 0; row < 3; row++) for (let d = 18 + 4 * row + sn.range(0, 6); d < 88 - 16 * row; ) {
          const wid = sn.range(6, 14) * (1 - 0.25 * row), far = d / 88;
          if (sn() < 0.85 - 0.45 * far) { const y = 72.2 + 3.6 * row + sn.range(-0.5, 0.5), len = sn.range(2.0, 2.9), ss = sn(), under = Math.hypot(d, y - S.y) < S.r; if (!under) bd.group(S.x + sd * d * 0.5, y, S.z + sd * d * 0.87, len, wid, 6, 2, lerp(0.92, 0.62, far), -9, 1, ss, 7.6); }
          d += wid * sn.range(0.7, 1.7);
        }
      }
    }
    await ctx.yield();
    addStrokes(bd, style.stroke, 'backdrop', 0, 0, 300, 1e4);
    {                                                           // the hut's smoke: strokes sliding up and down-wind from its chimney, white and (lit by the low sun) sanguine
      const sm = rng.fork('smoke'), sk = new StrokeBuf('flow'), top = HUT.y + 8.8;
      for (let i = 0; i < 34; i++) { const h = 13 * Math.pow(sm(), 1.2); sk.group(HUT.x - 0.6 + 0.3 * h + sm.range(-0.4, 0.4) * (1 + 0.15 * h), top + 0.6 + h, HUT.z - 2.75 - 0.2 * h + sm.range(-0.4, 0.4), sm.range(0.9, 1.3) * (1 + 0.05 * h), sm.range(0.7, 1.1) * (1 + 0.07 * h), 3, i % 5 === 0 ? 2 : 0, i % 5 === 0 ? 0.9 : sm.range(0.7, 0.86), -9, 1, sm(), 7); sk.setAlt(1.4, 5.5, 0.6); }
      addStrokes(sk, style.strokeFlow, 'smoke', HUT.x, HUT.y + 12, HUT.z, 30);
    }
    await ctx.yield();
    // ---------- the herd: two by the stream where we come in, two under the wall, the rest in the open before the tree, rumps to the
    // weather (the hero keeps three under the oak). Bodies are bare paper; snow on their backs, sepia beneath ----------
    const herd = { paper: { pos: [], idx: [] }, rig: { piv: [], rig: [] }, strokes: new StrokeBuf('rig') }, herdAt = [], herdS = [];
    // (round 18) THE HERD READS: two sizes. HERD_SC: the herd in the open at its typed places (the slots after the four of the opening;
    // not the animal at arm's length, not the four of the opening, not the aerial ones, and not the dealt ones, whose places are not
    // typed and may fall beside another's) stands 1.6 times its made size. HB_SC: the seven before the tree (below) stand at the aerial
    // ones' own 1.75. A8's sizes (1.14 to 2.3 times) hold: 1.14 times 1.6 or 1.75, times 0.93 to 1.08
    const HB_SC = 1.75, HERD_SC = 1.6;
    const NEAR = { x: -0.8, z: 300, shakeT: 19 };              // the animal at arm's length; it shakes as we come abeam of it
    NEAR.shakeT = secOfU((NEAR.z - 14 - Z0) / L);          // it shakes while it is still ahead of us and well inside the frame (the gaze has left it for the tree, which must stay whole)
    {
      const hr = rng.fork('herd'), nH = Math.round(clamp(13 * dens, 11, 14)), kSc = cast === 'sheep' ? 1.25 : cast === 'hind' ? 1.05 : 1.14;
      // [side, z, metres off the course] or [0, z, x, yaw]. Slot 0 stands inside the swing of the course: we round it at 7 to 9 m
      const SLOTS = [[0, NEAR.z, NEAR.x], ...OPENS.map((o) => [0, ...o]), [0, 312, -5.5], [0, 317.5, 0.5], [0, 319.5, -11.5], [1, 289, 8.2], [-1, 293, 7.6], [1, 308, 10], [1, 326, 11]];
      const place = (x, z, side) => { for (let k = 0; k < 40; k++) { if (path.nearestXZ(x, z).dist >= 6.6 && Math.hypot(x, z - OAK_Z) > 31) break; x += side * 0.5; } return x; };
      const eT = path.endTangent, eP = path.end, yawIn = Math.atan2(-eT.z, eT.x), gat = (back, sd, yaw) => [0, eP.z - eT.z * back + eT.x * sd, eP.x - eT.x * back - eT.z * sd, yaw, 2];
      const EXTRA = [...GATH.map((g) => gat(g[0], g[1], yawIn + g[2])), [0, 401, 23, 0.64, 2], [0, 410, 13.5, 0.9, 2], [0, 392, 29, 3.6, 2]];
      for (let i = 0; i < nH + EXTRA.length; i++) {
        const slot = i >= nH ? EXTRA[i - nH] : SLOTS[i], side = slot ? slot[0] || -1 : hr.sign(), near = i === 0, open = i >= 1 && i <= 4, aerial = !!(slot && slot[4]);
        const z = near ? NEAR.z : slot ? slot[1] + (open ? 0 : hr.range(-1, 1)) : hr.range(268, 346), px = path.nearestXZ(side * 60, z);
        const cx = path.pointAt(px.u).x, x0 = aerial ? slot[2] : place(slot && !slot[0] ? slot[2] : cx + side * (slot ? slot[2] : hr.range(12, 22)), z, slot && slot[2] > 0 && !slot[0] ? 1 : side), x = near ? NEAR.x : x0;
        const sT = sAt(x, z), o = { ox: x, oz: z, oy: hAt(x, z), yaw: near ? 2.09 + hr.range(-0.1, 0.1) : slot && slot[3] !== undefined ? slot[3] : Math.PI + hr.range(-0.55, 0.55), sc: kSc * (near ? (cast === 'sheep' ? 1.3 : 1.12) : open ? 1.2 : hr.range(0.93, 1.08)) * (aerial ? 1.75 : slot && !near && !open ? HERD_SC : 1), phase: hr(), shakeT: near ? NEAR.shakeT : -1,
          headDrop: near ? 0.02 : hr.range(-0.05, 0.3), T0: open ? -20 : clamp(sT - 12 - hr.range(0, 2.5), -20, 14), spread: 4, kind: cast, bold: near ? 1.45 : open ? 1.7 : 1.6, rich: near || open || aerial ? 1.7 : 1, far: aerial ? 7 : !near, lenBold: open ? 1.1 : undefined, redLen: slot && !near && !open && !aerial ? 1 / HERD_SC : 1,      // (round 19, the site owner's order) the body grown by HERD_SC, its orange strokes the length they were
          red: cast === 'hind' ? 1 : near || open || (i * 7 + 3) % 5 < 2 ? (cast === 'sheep' ? 1 : 0.9) : 0 };
        if (aerial) { o.headDrop = [0.7, -0.1, 0.3][i % 3]; o.T0 = -20; }
        layAnimal(herd, hr, o); herdAt.push(new THREE.Vector3(x, o.oy + 1.0, z)); herdS.push(sT);
        // the drift it stands against: the moor behind it is white, so the undrawn body is a brown hole in it
        const pp = path.pointAt(px.u), ex = x - pp.x, ez = z - pp.z + 6, el = Math.hypot(ex, ez) || 1;
        for (let k = 0; k < (aerial ? 0 : near || open ? 9 : 5); k++) {
          const along = hr.range(1.6, near ? 12 : 9), across = hr.range(-4.5, 4.5) * (near ? 1.5 : 1), bx = x + (ex * along - ez * across) / el, bz = z + (ez * along + ex * across) / el;
          if (free(bx, bz, 0)) drift(tileOf(bz), bx, bz, open || hr() < 0.5 ? -9 : Math.max(0.8, o.T0 + hr.range(0, 3.5)), 4, 1.0);
        }
        await ctx.yield();
      }
      // (round 10) THE HERD ROUND THE TREE: five more of the cast where the aerial three stand, on the white ground round the oak's bare
      // circle on its up-valley side: 33 to 45 m from the trunk, on the arc from straight up-valley of it round toward the starboard brow
      // as far as the bearing of the third of the three plus 25 degrees. Their stream is their own, made from the seed and a name (it
      // draws from no other); they stand from the first frame, as the three do, and have no time of their own
      const hm = ctx.core.makeRng(ctx.core.hashSeed('herd-round:' + ctx.seed)), three = herdAt.slice(-3), eight = three.map((p, k) => [p.x, p.z, EXTRA[EXTRA.length - 3 + k][3]]);
      const arc = Math.atan2(three[2].x, three[2].z - OAK_Z) + 25 * Math.PI / 180;
      for (let k = 0, tries = 0; k < 5 && tries < 600; tries++) {
        const b = hm.range(0, arc), rr = Math.sqrt(hm.range(33 * 33, 45 * 45)), x = Math.sin(b) * rr, z = OAK_Z + Math.cos(b) * rr;
        // 6 m from every other animal's place (the hero's three stand within 22 m of the trunk, parts 819: 11 m and more from this band),
        // 6.6 m from the course's line on the ground (place()'s own rule), on ground free() allows
        if (path.nearestXZ(x, z).dist < 6.6 || !free(x, z, 0) || herdAt.some((p) => Math.hypot(p.x - x, p.z - z) < 6) || eight.some((p) => Math.hypot(p[0] - x, p[1] - z) < 6)) continue;
        // yaw over the whole circle, but for the one rule of the herd: no two neighbours within 9 m face the same way within 20 degrees
        let yaw = hm.range(0, 6.2832);
        for (let t = 0; t < 40 && eight.some((p) => Math.hypot(p[0] - x, p[1] - z) < 9 && Math.abs(Math.atan2(Math.sin(yaw - p[2]), Math.cos(yaw - p[2]))) < 20 * Math.PI / 180); t++) yaw = hm.range(0, 6.2832);
        // laid as the aerial three are (their scale, bold, rich, far 7, the three headDrops by turn, T0 -20, shakeT -1; no drift)
        const i = nH + EXTRA.length + k;
        layAnimal(herd, hm, { ox: x, oz: z, oy: hAt(x, z), yaw, sc: kSc * hm.range(0.93, 1.08) * 1.75, phase: hm(), shakeT: -1, headDrop: [0.7, -0.1, 0.3][i % 3], T0: -20, spread: 4, kind: cast, bold: 1.6, rich: 1.7, far: 7,
          red: cast === 'hind' ? 1 : (i * 7 + 3) % 5 < 2 ? (cast === 'sheep' ? 1 : 0.9) : 0 });
        eight.push([x, z, yaw]); k++;
        await ctx.yield();
      }
      // (round 10) THEIR TRACKS ACROSS THE WHITE: one line of the pony tracks' make (the same tick, step, left and right, wander; its own
      // phase from the same new stream; T -9: it lies from the first frame) from a typed place on the moor (x 9, z 326; no animal stands
      // there) to the z of the middle of the eight, or sooner where a tick would fall within 3 m of one of them. free() refuses some (the bare ground under the tree)
      {
        const mx = eight.reduce((s, p) => s + p[0], 0) / eight.length, mz = eight.reduce((s, p) => s + p[1], 0) / eight.length, ph = hm.range(0, 6.28);
        for (let z = 326; z < mz; z += 0.55) {
          const x = 9 + (mx - 9) * (z - 326) / (mz - 326) + 4.5 * Math.sin(z * 0.045 + ph) + 2 * Math.sin(z * 0.11 + ph * 2) + (Math.round(z / 0.55) % 2 ? 0.16 : -0.16);
          if (eight.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3)) break;
          if (!free(x, z, 0.3)) continue;
          tileOf(z).add(x, hAt(x, z) + 0.04, z + hm.range(-0.08, 0.08), hm.range(0.2, 0.28), 0.05, 1, hm.range(0.65, 0.88), -9, 1, hm(), 0);
        }
        await ctx.yield();
      }
      // (round 18) THE HERD BEFORE THE TREE: seven more of the cast on the white ground outside the oak's bare circle on its down-valley
      // side, the ground the course swings round to starboard: 34 to 42 m from the trunk, on the arc from 25 degrees to port of straight
      // down-valley round to 50 degrees to starboard of it (further round they would stand under the climbing course); 8 m and more
      // from the course's line on the ground, 7 m from every other animal's place (the herd's, the aerial three, round 10's five),
      // on ground free() allows. Their stream is their own, made from the seed and a name (it draws from no other); they are made as
      // the herd in the open is made (its timetable by sAt, rumps to the weather within its own 0.55), with
      // the marks of the four of the opening (bold, rich, lenBold); no drift (drift() draws from the land's stream). THEY CARRY NO ORANGE
      // (A2, A21: the fox, the sun and the thorn haws only): red 0 for every one of the seven, on every cast; the marks of the herd's
      // red are neither dealt nor laid, and the stream deals as it falls
      {
        const hb = ctx.core.makeRng(ctx.core.hashSeed('herd-before:' + ctx.seed)), all = [...herdAt.map((p) => [p.x, p.z]), ...eight.map((p) => [p[0], p[1]])];
        for (let k = 0, tries = 0; k < 7 && tries < 900; tries++) {
          const b = hb.range(-25, 50) * Math.PI / 180, rr = Math.sqrt(hb.range(34 * 34, 42 * 42)), x = Math.sin(b) * rr, z = OAK_Z - Math.cos(b) * rr;
          if (path.nearestXZ(x, z).dist < 8 || !free(x, z, 0) || all.some((p) => Math.hypot(p[0] - x, p[1] - z) < 7)) continue;
          layAnimal(herd, hb, { ox: x, oz: z, oy: hAt(x, z), yaw: Math.PI + hb.range(-0.55, 0.55), sc: kSc * HB_SC * hb.range(0.93, 1.08), phase: hb(), shakeT: -1, headDrop: hb.range(-0.05, 0.3),
            T0: clamp(sAt(x, z) - 12 - hb.range(0, 2.5), -20, 14), spread: 4, kind: cast, bold: 1.7, rich: 1.7, far: true, lenBold: 1.1, red: 0 });
          all.push([x, z]); k++;
          await ctx.yield();
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(herd.paper.pos), 3)); g.setIndex(herd.paper.idx);
      g.setAttribute('aPiv', new THREE.BufferAttribute(new Float32Array(herd.rig.piv), 3)); g.setAttribute('aRig', new THREE.BufferAttribute(new Float32Array(herd.rig.rig), 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 15, 300), 260);
      const m = new THREE.Mesh(g, style.paperRigDark); m.name = 'herd-paper'; scene.add(m);
      addStrokes(herd.strokes, style.strokeRig, 'herd-strokes', -20, 15, 300, 260);
    }
    await ctx.yield();
    // ---------- loose snow: lifted off the drift crests by the two breaths of wind and laid 6 to 10 m further on ----------
    {
      const loose = new StrokeBuf('loose'), nL = Math.round(1500 * detail);
      for (let i = 0; i < nL; i++) {
        if (i % 300 === 299) await ctx.yield();
        const first = i % 2 === 0, z = first ? R.range(262, 350) : R.range(382, 474), x = first ? R.range(-40, 52) : R.range(-50, 36), r = R(), ax = x - R.range(6, 10), az = z + R.range(-2, 2);
        if (!free(x, z, 0.5) || !free(ax, az, 0.5)) continue;
        loose.add(x, hAt(x, z) + 0.07, z, R.range(0.45, 0.85), 0.04, 0, R.range(0.55, 0.88), first ? landAt(x, z, r) : 10 + 12 * r, i % 6, R(), first ? 0 : 1); loose.setAlt(ax, hAt(ax, az) + 0.07, az);
      }
      addStrokes(loose, style.strokeLoose, 'loose', 0, 0, 370, 130);
      U.uGust.value.set(14, 12, 19, 30);
    }
    for (let i = 0; i < NT; i++) { addStrokes(tiles[i], style.stroke, 'moor-' + i, 6, 25, GZ0 + (i + 0.5) * TILE, 180); await ctx.yield(); }
    // ---------- the fall itself: short strokes in the air round the eye, and a wider, sparser fall through the depth of the picture ----------
    {
      const air = new StrokeBuf('snow'), nA = Math.round((heavy ? 8000 : weather === 'thin' ? 5200 : 7000) * detail), nB = Math.round(nA * 0.4);
      for (let i = 0; i < nA; i++) { air.add(R(), R(), R(), (heavy ? 0.5 : 0.36) * R.range(0.8, 1.3), 0.034, 0, R.range(0.6, 0.88), -1, 0, R(), 0); air.setAlt(66, 40, 66); }
      for (let i = 0; i < nB; i++) { air.add(R(), R(), R(), (heavy ? 0.6 : 0.45) * R.range(0.8, 1.3), 0.07, 0, R.range(0.5, 0.75), -1, 0, R(), 0); air.setAlt(230, 80, 230); }
      await ctx.yield();
      addStrokes(air, style.strokeSnow, 'air-snow', 0, 0, 0, 1e4);
    }
    await ctx.yield();
    // ---------- the one orange mark: a fox trotting the wall top (or a cock pheasant, or a robin puffed against the cold) ----------
    const beast = { paper: { pos: [], idx: [] }, rig: { piv: [], rig: [] }, strokes: new StrokeBuf('rig') };
    const beastKind = cast === 'sheep' ? 'pheasant' : cast === 'hind' ? 'robin' : 'fox', WALL_Y = 1.52;
    {
      const br = rng.fork('beast'), yaw = -Math.PI / 2, ph = br(), sc = beastKind === 'fox' ? 1.62 : beastKind === 'pheasant' ? 1.7 : 3.4;
      const Wb = (a, y, l) => [-l * sc, y * sc, a * sc];                         // about its own feet; heading +Z; +l is the side we see from the course
      const S = beastKind === 'fox' ? {
        // a fox in silhouette: a brush as deep as the body and a third of its length, white-tipped; a waist; a level back; the head
        // carried above the back's line, two ear ticks, the muzzle narrowing to a point; four legs, each its own strokes
        body: [[-0.38, 0.43, 0, 0.07], [-0.24, 0.44, 0, 0.125], [0.0, 0.44, 0, 0.105], [0.24, 0.455, 0, 0.135], [0.38, 0.48, 0, 0.1]],
        head: [[0.34, 0.5, 0, 0.095], [0.45, 0.61, 0, 0.085], [0.55, 0.675, 0, 0.092], [0.66, 0.66, 0, 0.06], [0.8, 0.62, 0, 0.018]],
        tail: [[-0.36, 0.45, 0, 0.04], [-0.52, 0.44, 0, 0.055], [-0.7, 0.42, 0, 0.14], [-0.92, 0.41, 0, 0.165], [-1.1, 0.41, 0, 0.13], [-1.25, 0.41, 0, 0.03]],
        legs: [[0.34, 0.07], [0.2, -0.07], [-0.19, 0.07], [-0.33, -0.07]], legY: 0.42, legN: 4, legLen: 0.17,
        ears: [[0.5, 0.82, 0.075], [0.58, 0.81, -0.075]],
        marks: [['body', 52, 2, -0.7, 1.35], ['body', 12, 1, 2.3, 3.7], ['head', 18, 2, -0.9, 1.0, 0.05, 0.8], ['head', 4, 0, 1.4, 2.4, 0.55, 1], ['head', 5, 0, 1.6, 2.6, 0, 0.45],
          ['tail', 78, 2, -0.9, 2.5, 0.3, 0.7, 1.2], ['tail', 5, 1, -0.6, 0.6, 0.02, 0.26, 0.7], ['tail', 30, 0, -0.9, 2.5, 0.72, 0.98, 1.2], ['tail', 7, 1, 2.6, 3.9, 0.3, 0.8], ['body', 7, 1, -0.5, 0.5, 0.05, 0.9, 0.8]], short: 0.56,     // (many short strokes: it runs beside us at 7 m, and must keep its shape there)
      } : beastKind === 'pheasant' ? {
        body: [[-0.22, 0.34, 0, 0.07], [0, 0.36, 0, 0.125], [0.16, 0.4, 0, 0.1], [0.24, 0.46, 0, 0.06]],
        head: [[0.2, 0.44, 0, 0.06], [0.27, 0.58, 0, 0.045], [0.33, 0.63, 0, 0.042], [0.41, 0.61, 0, 0.012]],
        tail: [[-0.18, 0.35, 0, 0.05], [-0.5, 0.38, 0, 0.035], [-0.9, 0.44, 0, 0.022], [-1.2, 0.49, 0, 0.012]],
        legs: [[0.04, 0.05], [0.0, -0.05]], legY: 0.3,
        marks: [['body', 26, 2, -0.5, 1.5], ['head', 4, 0, -0.5, 1.5, 0.3, 0.5], ['head', 5, 2, -0.5, 1.5, 0.55, 1], ['tail', 14, 1, -0.6, 1.4], ['tail', 8, 2, -0.6, 1.4, 0, 0.6], ['body', 7, 1, 2.3, 3.6]],
      } : {
        body: [[-0.1, 0.16, 0, 0.06], [0, 0.17, 0, 0.105], [0.1, 0.19, 0, 0.085]],
        head: [[0.07, 0.2, 0, 0.075], [0.13, 0.27, 0, 0.068], [0.2, 0.27, 0, 0.02]],
        tail: [[-0.08, 0.17, 0, 0.03], [-0.2, 0.2, 0, 0.02], [-0.28, 0.22, 0, 0.012]],
        legs: [[0.02, 0.035], [0.0, -0.035]], legY: 0.1,
        marks: [['head', 14, 2, 1.0, 2.6, 0, 0.7], ['body', 10, 2, 1.3, 2.8, 0.4, 1], ['body', 10, 1, -0.6, 1.0], ['head', 4, 1, -0.5, 0.8], ['tail', 5, 1, -0.5, 1.2], ['body', 3, 0, 2.6, 3.4, 0, 0.5]],
      };
      const PIV = { body: [0, S.body[1][1], 0, 0], head: [S.head[0][0], S.head[0][1], 0, 1], tail: [S.tail[0][0], S.tail[0][1], 0, 2] };
      const rigOf = (pv) => { const w = Wb(pv[0], pv[1], pv[2]); return [w[0], w[1], w[2], pv[3], ph, yaw, -1]; };
      const chainW = (c) => c.map((q) => { const w = Wb(q[0], q[1], q[2]); return [w[0], w[1], w[2], q[3] * sc]; });
      for (const k of ['body', 'head', 'tail']) sweepTube(chainW(S[k]), 7, beast.paper, 0.85, beast.rig, rigOf(PIV[k]));
      for (const [a, l] of S.legs) sweepTube(chainW([[a, S.legY, l, 0.045], [a + 0.02, S.legY * 0.5, l, 0.03], [a, 0, l, 0.03]]), 4, beast.paper, 1, beast.rig, rigOf([a, S.legY - 0.02, l, 4]));
      const T0 = -20;
      for (const [k, n, pen, f0, f1, t0 = 0, t1 = 1, lk = 1] of S.marks) for (let i = 0; i < n; i++) {
        const c = S[k], t = lerp(t0, t1, (i + br()) / n) * (c.length - 1), j = Math.min(c.length - 2, Math.floor(t)), q = c[j].map((v, m) => lerp(v, c[j + 1][m], t - j)), f = br.range(f0, f1);
        const w = Wb(q[0], q[1] + Math.cos(f) * (q[3] + 0.01), Math.sin(f) * (q[3] + 0.01) * 0.85), rg = rigOf(PIV[k]);
        beast.strokes.add(w[0], w[1], w[2], br.range(0.15, 0.23) * sc * (beastKind === 'robin' ? 0.6 : 1) * (S.short || 1) * lk, 0.065 * (lk > 1 ? 1.3 : 1), pen, pen === 0 ? 0.95 : br.range(0.84, 0.96), T0 + br.range(0, 2.2), i % 6 ? 1 + i % 5 : 0, br(), 0);
        beast.strokes.setRig(rg[0], rg[1], rg[2], rg[3], rg[4], rg[5], rg[6]);
      }
      const lN = S.legN || 3, lL = S.legLen || 0.13;
      for (const [a, l] of S.legs) for (let i = 0; i < lN; i++) { const w = Wb(a, S.legY * (0.86 - 0.74 * i / lN), l + 0.03), rg = rigOf([a, S.legY - 0.02, l, 4]); beast.strokes.add(w[0], w[1], w[2], lL * sc, lN > 3 ? 0.075 : 0.05, 1, 0.9, T0 + 1 + br(), 1 + i, br(), 0); beast.strokes.setRig(rg[0], rg[1], rg[2], rg[3], rg[4], rg[5], rg[6]); }
      for (const [a, y, l] of S.ears || []) for (let i = 0; i < 2; i++) { const w = Wb(a, y - 0.035 * i, l), rg = rigOf(PIV.head); beast.strokes.add(w[0], w[1], w[2], 0.13 * sc, 0.085, 1, 0.95, T0 + 1, 1, br(), 0); beast.strokes.setRig(rg[0], rg[1], rg[2], rg[3], rg[4], rg[5], rg[6]); }
    }
    const beastG = new THREE.Group(); beastG.name = 'the-orange-one'; scene.add(beastG);
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(beast.paper.pos), 3)); g.setIndex(beast.paper.idx);
      g.setAttribute('aPiv', new THREE.BufferAttribute(new Float32Array(beast.rig.piv), 3)); g.setAttribute('aRig', new THREE.BufferAttribute(new Float32Array(beast.rig.rig), 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 7);
      beastG.add(new THREE.Mesh(g, style.paperRig));
      beastG.add(new THREE.Mesh(strokeGeometry(beast.strokes, new THREE.Vector3(0, 0.5, 0), 6), style.strokeRig));
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(solid.pos), 3)); sg.setIndex(solid.idx); sg.computeBoundingSphere();
      const sm = new THREE.Mesh(sg, style.paper); sm.name = 'wall-thorn-paper'; scene.add(sm);
    }
    // it runs the cap the way we are going at our own speed, 4.5 m ahead of us from where the course passes z 196 to the wall's far
    // end, so the one orange mark is beside us, broadside and large, for six seconds; then it leaps down and runs off up the brow
    let sA = 6, sB = 12; { const q = new THREE.Vector3(); for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, q); if (q.z <= 196) sA = secOfU(i / 400); if (q.z <= 256) sB = secOfU(i / 400); } }
    const FOX_V = 60 / Math.max(sB - sA, 1), sFox = sB;
    const foxZ = (s) => clamp(200.5 + FOX_V * (s - sA), WALL_Z0 + 1.6, 352);
    const foxX = (z) => 0.35 * Math.max(0, z - WALL_Z1), foxY = (z) => { const t = clamp((z - WALL_Z1 + 2) / 6, 0, 1); return -1.45 * t * t * (3 - 2 * t) + 0.55 * Math.sin(Math.PI * t) - 6 * smoothstep(336, 348, z); };
    // its second run (round 4): from the foot of the hillside up the white ground on the down-valley bank of the cutting to the foot
    // of the tear, over the last straight; a line of prints is left in the white behind it
    const sRun0 = secOfU(0.69), sLeap = secOfU(0.925), sRun1 = secOfU(0.978), RUN = [];
    {
      const ex = path.end, et = path.endTangent, rx = -et.z, rz = et.x, q = new THREE.Vector3(), pr2 = rng.fork('prints'), pb = new StrokeBuf();     // (rx, rz): to starboard of the last straight (down the valley)
      for (let i = 0; i <= 26; i++) {
        const t = i / 22, back = lerp(105, 5, t), side = lerp(14, 8.5, t) + 1.0 * Math.sin(t * 7), x = ex.x - et.x * back + rx * side, z = ex.z - et.z * back + rz * side;
        if (i <= 22) RUN.push([x, hAt(x, z) + 0.05, z]); else { const k = (i - 22) / 4, bk = lerp(5, -3.5, k), sd = lerp(RUN[22][3], 0, Math.min(1, k * 1.6)); RUN.push([ex.x - et.x * bk + rx * sd, lerp(RUN[22][1], ex.y - 4.2, Math.min(1, k * 1.5)) + 2.2 * Math.sin(Math.PI * Math.min(1, k * 1.5)) - et.y * bk, ex.z - et.z * bk + rz * sd]); }
        if (i <= 22) RUN[i].push(side);
      }
      for (let i = 0; i < 22; i++) for (let k = 0; k < 8; k++) {
        const f = (k + 0.5) / 8, x = lerp(RUN[i][0], RUN[i + 1][0], f) + (k % 2 ? 0.22 : -0.22), z = lerp(RUN[i][2], RUN[i + 1][2], f), T = lerp(sRun0, sLeap, (i + f) / 22) + 0.15;
        pb.add(x, hAt(x, z) + 0.25, z + pr2.range(-0.1, 0.1), pr2.range(0.42, 0.56), 0.16, 1, 0.92, T, 1, pr2(), 7);
      }
      addStrokes(pb, style.stroke, 'prints', ex.x, ex.y, ex.z, 80);
    }
    await ctx.yield();

    // ---------- the hero: the Unseen Oak (its own apron hatches the ring round the bare circle) ----------
    const hero = await buildHero(ctx, { palette: pal, detail, weather, shedding: rare, style, backdrop: false, apron: true, cast, tree, ponyBold: 1.7, ponyRich: 1.7, ponyFar: true, ponyScale: 2.3, ponyRed: cast === 'sheep' ? [1, 0, 1] : cast === 'hind' ? [1, 1, 1] : [1, 0, 0.8] });
    hero.object.position.set(0, 0, OAK_Z); scene.add(hero.object);
    await ctx.yield();

    // ---------- the tear: a ragged pale-fibred hole in the hillside, a flap of paper curled back from it ----------
    const tearU = { uTime: U.uTime, uRes: U.uRes, uFibreD: { value: new THREE.Color(pal[5]) }, uSepiaD: U.uSepiaD, uPaperD: U.uPaperD };
    const tear = new THREE.Group(), uOpen = { value: 0 }, sOpen = secOfU(0.72), sOpen1 = secOfU(0.785); tear.name = 'tear';
    {
      const tr = rng.fork('tear'), rIn = (a) => 7.55 + 0.32 * noise.n2(Math.cos(a) * 2.2 + 60, Math.sin(a) * 2.2) + 0.12 * noise.n2(Math.cos(a) * 9, Math.sin(a) * 9 + 60);
      const fibreMat = new THREE.ShaderMaterial({ uniforms: tearU, side: THREE.DoubleSide, fog: false, toneMapped: false,
        vertexShader: /* glsl */`
          attribute vec3 aTip; attribute vec4 aK; uniform float uTime; uniform vec2 uRes;
          void main(){
            float t = aK.x, side = aK.y, seed = aK.z, len = max(length(aTip), 1e-3);
            vec3 tip = position + aTip + vec3(-aTip.y, aTip.x, 0.)*(0.2*sin(uTime*1.3 + seed*40.)) + vec3(0., 0., 0.16*len*sin(uTime*0.9 + seed*17.));
            vec4 c0 = projectionMatrix*modelViewMatrix*vec4(position, 1.), c1 = projectionMatrix*modelViewMatrix*vec4(tip, 1.);
            vec2 d = (c1.xy/max(c1.w, 0.05) - c0.xy/max(c0.w, 0.05))*uRes; float dl = length(d); d = dl > 1e-4 ? d/dl : vec2(1., 0.);
            vec4 c = mix(c0, c1, t); float px = max(aK.w*projectionMatrix[1][1]*uRes.y*0.5/max(c.w, 0.05), 1.6)*(1. - 0.6*t);
            c.xy += vec2(-d.y, d.x)*side*px/uRes*max(c.w, 0.05); gl_Position = c;
          }`,
        fragmentShader: /* glsl */`uniform vec3 uFibreD; void main(){ gl_FragColor = vec4(uFibreD, 1.); }` });
      const sheetMat = new THREE.ShaderMaterial({ uniforms: tearU, side: THREE.DoubleSide, fog: false, toneMapped: false,
        vertexShader: /* glsl */`
          attribute vec4 aWave; attribute vec2 aUv; uniform float uTime; varying float vBoth; varying vec2 vQ;
          void main(){ vBoth = aWave.w; vQ = aUv; float w = sin(uTime*0.8) + 0.35*sin(uTime*2.1 + position.x);
            gl_Position = projectionMatrix*modelViewMatrix*vec4(position + aWave.xyz*w, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uFibreD, uSepiaD, uPaperD; varying float vBoth; varying vec2 vQ;
          void main(){
            if (vBoth > 0.5) { gl_FragColor = vec4(uFibreD, 1.); return; }
            if (vQ.y > 0.96 + 0.04*sin(vQ.x*23.)*sin(vQ.x*9. + 1.)) discard;                    // its ragged end
            // hatching drawn on the sheet itself: sepia in the shadow of the fold and the curl (fibre side),
            // and the hillside's own bracken hatch on the page side where the tip curls over
            float q = (vQ.x*5. + vQ.y*5.5)/0.24, fw = fwidth(q), ln = abs(fract(q) - 0.5)*2., gap = step(0.14, fract(floor(q)*0.37 + vQ.y*1.7));
            float zone = gl_FrontFacing ? 1. : max(smoothstep(0.3, 0.55, vQ.y)*(1. - smoothstep(0.74, 0.8, vQ.y)), 1. - smoothstep(0.05, 0.22, vQ.y));
            float ink = mix(1. - smoothstep(0.34 - fw, 0.34 + fw, ln), 0.34, smoothstep(0.35, 0.7, fw))*zone*gap;
            float edge = max(1. - smoothstep(0.05, 0.085, min(vQ.x, 1. - vQ.x)), smoothstep(0.84, 0.88, vQ.y));   // the sheet is the same brown paper on both sides: pale only where it has split
            gl_FragColor = vec4(mix(mix(uPaperD, uFibreD, edge), uSepiaD, ink*(1. - edge)), 1.);
          }` });
      // fibres: ~1,200 ribbons round the edge, most reaching into the hole, some curling toward us
      const nF = Math.round(1200 * (0.6 + 0.4 * detail)), fp = [], ft = [], fk = [], fi = [];
      for (let i = 0; i < nF; i++) {
        const a = tr.range(0, 6.2832), r0 = rIn(a) + tr.range(-0.05, 0.3), len = tr.range(0.3, 1.0) * (tr() < 0.12 ? 2 : 1), tilt = tr.range(-0.7, 0.7), out = tr() < 0.25;
        const da = a + Math.PI + tilt, dz = out ? tr.range(0.3, 0.9) : tr.range(-0.1, 0.25), cz = Math.sqrt(1 - Math.min(dz * dz, 0.9)), seed = tr(), w = tr.range(0.03, 0.07), b = fp.length / 3;
        for (let v = 0; v < 4; v++) { fp.push(Math.cos(a) * r0, Math.sin(a) * r0, 0.02); ft.push(Math.cos(da) * cz * len, Math.sin(da) * cz * len, dz * len); fk.push(v >> 1, (v & 1) * 2 - 1, seed, w); }
        fi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fg.setAttribute('aTip', new THREE.Float32BufferAttribute(ft, 3));
      fg.setAttribute('aK', new THREE.Float32BufferAttribute(fk, 4)); fg.setIndex(fi); fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
      tear.add(new THREE.Mesh(fg, fibreMat));
      // the torn edge (pale where the sheet has split) and the flap, curled back on a 1.5 m roll
      const sp = [], sw = [], sq = [], si = [], NB = 240;
      // (5b, G3) the pale torn edge is nowhere narrower than 0.6 m (it was 0.3): a bright rim all the way round the hole
      for (let i = 0; i <= NB; i++) { const a = (i / NB) * 6.2832, r0 = rIn(a), r1 = r0 + 0.6 + 1.9 * Math.max(0, noise.n2(Math.cos(a) * 3.1 + 80, Math.sin(a) * 3.1) + 0.25) + 0.5 * Math.max(0, noise.n2(Math.cos(a) * 9 + 80, Math.sin(a) * 9)) + (i % 2) * tr.range(0.03, 0.3);
        sp.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0); sw.push(0, 0, 0, 1, 0, 0, 0, 1); sq.push(0, 0, 0, 0); if (i < NB) { const b = i * 2; si.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      const A0 = 2.3 + tr.range(-0.15, 0.2), FA = 14, FV = 26, fb = sp.length / 3;
      for (let j = 0; j <= FV; j++) for (let i = 0; i <= FA; i++) {
        const v = j / FV, hw = 0.3 * (1 - 0.93 * Math.pow(v, 1.3)), a = A0 + (i / FA - 0.5) * 2 * hw + 0.18 * v * v, r0 = rIn(a) + 0.05, er = [Math.cos(a), Math.sin(a)];
        const fl = Math.min(v / 0.7, 1), phi = Math.max(0, (v - 0.7) / 0.3) * 3.3, ro = r0 + 2.3 * fl + 0.6 * Math.sin(phi), z = 0.15 + 0.9 * fl * fl + 0.6 * (1 - Math.cos(phi));
        sp.push(er[0] * ro, er[1] * ro, z); sw.push(er[0] * 0.15 * v * v, er[1] * 0.15 * v * v, 0.5 * v * v, 0); sq.push(i / FA, v);
        if (i < FA && j < FV) { const b = fb + j * (FA + 1) + i; si.push(b, b + 1, b + FA + 1, b + 1, b + FA + 2, b + FA + 1); }
      }
      const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sgeo.setAttribute('aWave', new THREE.Float32BufferAttribute(sw, 4)); sgeo.setAttribute('aUv', new THREE.Float32BufferAttribute(sq, 2));
      sgeo.setIndex(si); sgeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14);
      tear.add(new THREE.Mesh(sgeo, sheetMat));
      tear.position.copy(path.end).addScaledVector(path.endTangent, -0.3); tear.lookAt(path.end.clone().addScaledVector(path.endTangent, -2)); scene.add(tear); tear.updateMatrixWorld(true);
      // THE HILL TEARS OPEN (round 4). Until we leave the tree the hillside is whole: a plug of the sheet's own paper lies over the
      // opening. As the gaze swings up the hill (u 0.70 to 0.775) the hole is torn: the plug's inner edge and the whole torn rim grow
      // from a nick to the full hole (uOpen), and the hatching in and round it is drawn on as it opens.
      {
        const pp = [], pa = [], pi = [], NP = 96;
        for (let i = 0; i <= NP; i++) { const a = (i / NP) * 6.2832, r0 = rIn(a) * 0.97; pp.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * 8.5, Math.sin(a) * 8.5, 0); pa.push(1, 0); if (i < NP) { const b = i * 2; pi.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
        const pgm = new THREE.BufferGeometry(); pgm.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pgm.setAttribute('aIn', new THREE.Float32BufferAttribute(pa, 1)); pgm.setIndex(pi); pgm.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
        const plug = new THREE.Mesh(pgm, new THREE.ShaderMaterial({ uniforms: { uOpen: uOpen, uPaperD: U.uPaperD }, side: THREE.DoubleSide, fog: false, toneMapped: false,
          vertexShader: /* glsl */`attribute float aIn; uniform float uOpen; void main(){ vec3 p = position; p.xy *= mix(1., uOpen, aIn); gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`,
          fragmentShader: /* glsl */`uniform vec3 uPaperD; void main(){ gl_FragColor = vec4(uPaperD, 1.); }` }));
        plug.name = 'tear-plug'; plug.position.copy(path.end).addScaledVector(path.endTangent, -0.12); plug.quaternion.copy(tear.quaternion); scene.add(plug);
      }
      // the hole is drawn too: the shadow the torn edge throws into it (sepia hatch inside the upper rim, crossed where it is deepest), a
      // little white where the light gets in below, and the dark the curled flap throws on the hillside. Marks, half a metre proud of the opening.
      const tm = new StrokeBuf(), v = new THREE.Vector3(), tput = (lx, ly, lz, len, wid, pen, press, fl) => { v.set(lx, ly, lz).applyMatrix4(tear.matrixWorld); tm.group(v.x, v.y, v.z, len, wid, 5, pen, press, lerp(sOpen + 0.5, sOpen1 + 0.6, clamp(Math.hypot(lx, ly) / 8.5, 0, 1)) + 0.5 * tr(), 1, tr(), fl); };
      for (let i = 0; i < 210; i++) {
        const a = tr.range(0.35, 3.65), dep = 4.8 * Math.pow(tr(), 1.6) * (0.3 + 0.7 * Math.sin((a - 0.35) / 3.3 * Math.PI)), rr = rIn(a) - 0.35 - dep, g = tr();
        if (g < Math.min(1, SK + 0.1)) tput(Math.cos(a) * rr, Math.sin(a) * rr, 0.25, tr.range(0.7, 1.05), tr.range(0.75, 1.1), 1, tr.range(0.8, 0.92), dep < 1.6 && g < 0.45 ? 9 : 0);
      }
      for (let i = 0; i < 34; i++) { const a = tr.range(3.9, 5.9), rr = rIn(a) - 0.4 - 1.5 * tr() * tr(); tput(Math.cos(a) * rr, Math.sin(a) * rr, 0.25, tr.range(0.6, 0.9), tr.range(0.7, 1.0), 0, i % 2 ? 0.95 : 0.86, 0); }
      for (let i = 0; i < 40; i++) { const a = A0 - tr.range(0.3, 0.62), rr = rIn(a) + tr.range(0.6, 3.2); tput(Math.cos(a) * rr, Math.sin(a) * rr, 0.2, tr.range(0.7, 1.0), tr.range(0.8, 1.1), 1, tr.range(0.82, 0.92), i % 3 ? 0 : 9); }
      // the torn margin: white chalk where the light catches the curl of the lower left edge, sepia under the curl of the upper right
      for (let i = 0; i < 64; i++) { const a = tr.range(3.2, 5.5), rr = rIn(a) + 0.35 + 1.5 * tr() * tr(); tput(Math.cos(a) * rr, Math.sin(a) * rr, 0.3, tr.range(0.5, 0.8), tr.range(0.55, 0.9), 0, 0.95, 7); }
      for (let i = 0; i < 70; i++) { const a = tr.range(-0.75, 1.75), rr = rIn(a) + 0.5 + 1.9 * tr(); tput(Math.cos(a) * rr, Math.sin(a) * rr, 0.3, tr.range(0.6, 0.95), tr.range(0.6, 0.95), 1, tr.range(0.84, 0.92), i % 3 ? 7 : 7.25); }
      // ... and in the opening itself the snow goes on falling: chalk strokes sliding down across it (never a blank pane, even from far off)
      {
        const ts = new StrokeBuf('flow'), dn = new THREE.Vector3();
        for (let i = 0; i < 90; i++) { const a = tr.range(0, 6.2832), rr = 5.6 * Math.sqrt(tr()); v.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.75 + 0.5, 0.4).applyMatrix4(tear.matrixWorld);
          ts.add(v.x, v.y, v.z, tr.range(0.7, 1.15), 0.11, 0, tr.range(0.8, 0.95), sOpen1 + 0.3 + tr(), 1 + i % 4, tr(), 1); ts.setAlt(tr.range(0.3, 0.9), -5.5, tr.range(-0.3, 0.3)); }
        addStrokes(ts, style.strokeFlow, 'tear-snow', path.end.x, path.end.y, path.end.z, 14);
      }
      addStrokes(tm, style.stroke, 'tear-marks', path.end.x, path.end.y, path.end.z, 14);
    }
    await ctx.yield();

    // ---------- the flight ----------
    const cr = hero.anchors.crown, poiB = new THREE.Vector3(), poiC = new THREE.Vector3(), poiD = new THREE.Vector3();
    // leaving the tree: the gaze is carried round from the crown to the tear at an even rate over three and a half seconds (u 0.705 to
    // 0.80), not let go to whip round at the end of the turn. The buntings lift just before it starts.
    const pP = new THREE.Vector3(), dT = new THREE.Vector3(), dE = new THREE.Vector3();
    const pan = (pt, u) => {
      const t = smoothstep(0.735, 0.805, u); if (t <= 0) return pt;
      path.pointAt(clamp(u, 0, 1), pP); dT.copy(pt).sub(pP).normalize(); dE.copy(path.end).sub(pP).normalize(); const ang = dT.angleTo(dE);
      if (ang > 1e-3) { const sn = Math.sin(ang), s0 = Math.sin((1 - t) * ang) / sn, s1 = Math.sin(t * ang) / sn; dT.multiplyScalar(s0).addScaledVector(dE, s1); }
      return pt.copy(pP).addScaledVector(dT, 80);
    };
    U.uBirdT.value = 29.2;
    // the gaze takes the whole tree whatever the edition: its middle while we are low and near, a little under it from the climbing
    // turn so the frame holds blank sky over the crown AND the ground under it with its animals
    const crownAim = new THREE.Vector3(cr.center.x, cr.top * 0.46, OAK_Z + cr.center.z), turnAim = new THREE.Vector3(cr.center.x * 0.5, cr.top * 0.39, OAK_Z + cr.center.z * 0.5), treeAim = new THREE.Vector3(0, cr.top * 0.45, OAK_Z);
    const ponyAim = new THREE.Vector3(NEAR.x, 2.6, NEAR.z), beyondAim = new THREE.Vector3(-9, 6.5, 345);
    // the buntings' line: gathered FLOCK_T seconds after they lift, 27 m ahead of the eye on the last straight, then down it at our own speed into the tear
    {
      const tb = U.uBirdT.value, FLOCK_T = 4.6, pa = path.pointAt(uOfS(34)), pb = path.pointAt(uOfS(36)), v = pa.distanceTo(pb) / 2, et = path.endTangent;
      const c1 = path.pointAt(uOfS(tb + FLOCK_T)).addScaledVector(et, 27); c1.y += 2.2; c1.z -= 1.5;
      const c0 = c1.clone().addScaledVector(et, -v * FLOCK_T);
      U.uFlockC.value.set(c0.x, c0.y, c0.z - OAK_Z, FLOCK_T); U.uFlockV.value.copy(et).multiplyScalar(v);       // hero-local (the oak stands at z = OAK_Z)
      U.uFlockEnd.value.set(et.x, et.y, et.z, path.end.clone().sub(c0).dot(et) - 1.5);
    }
    // the reserve: what lies beyond the tree is not drawn inside an oval round its crown (bare paper with a ragged margin; see the stroke shader)
    U.uHalo.value.set(cr.center.x, (cr.lowY + cr.top) * 0.5 + 1, OAK_Z + cr.center.z, 1); U.uHaloR.value.set(cr.radius + 1.5, (cr.top - cr.lowY) * 0.5 + 1.5);
    const update = (dt, time, camera, u) => {
      const s = secOfU(u);
      hero.setSeconds(s); hero.update(dt, time, camera);
      { const o = smoothstep(0.72, 0.785, u); uOpen.value = o; tear.scale.setScalar(Math.max(o, 0.002)); }
      if (s < sRun0) {                                        // the wall's cap, beside us; then down and off up the brow
        const fz = foxZ(s); beastG.position.set(WALL_X + foxX(fz), WALL_Y + foxY(fz) + (beastKind === 'robin' ? 0.1 * Math.abs(Math.sin(time * 5)) : 0), fz); beastG.rotation.set(0, 0, 0);
      } else {                                                // ... and again on the hillside: up the white ground beside the cutting, making for the tear ahead of us
        const t = s < sLeap ? 22 * clamp((s - sRun0) / (sLeap - sRun0), 0, 1) : 22 + 4 * clamp((s - sLeap) / (sRun1 - sLeap), 0, 1), i = Math.min(RUN.length - 2, Math.floor(t)), k = t - i, a = RUN[i], b = RUN[i + 1];
        beastG.position.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k) + (beastKind === 'robin' ? 0.1 * Math.abs(Math.sin(time * 5)) : 0.06 * Math.abs(Math.sin(time * 8.4))), lerp(a[2], b[2], k));
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; beastG.rotation.set(-0.7 * Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ');
      }
    };
    update(0, 0, null, 0);
    return {
      scene, path, duration: DURATION, pace,
      title: (rare ? 'The Shedding: ' : '') + stock.title,
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 60, near: 0.25, far: 3200, lookAhead: 30, sway: 0.5, bank: 0.4, nearThrough: 0.3 },
      pois: [
        // the one orange mark, held in the middle of the frame from 25 m ahead of us until we are past it
        { at: (time, u) => { const z = foxZ(secOfU(u)); return poiB.set(WALL_X + foxX(z), WALL_Y + 0.5 + foxY(z), z); }, from: uOfS(sA - 2.2), to: uOfS(sFox + 0.9), weight: 0.55, fade: 0.2 },
        { at: treeAim, from: uOfS(sFox + 0.3), to: 160 / L, weight: 0.4 },
        // one gaze from the herd to the tear's straight: the animal at arm's length, then over the ones beyond it up to the crown,
        // then the whole tree for the whole turn; let go after the buntings lift
        { at: (time, u) => { const d = u * L, a = smoothstep(150, 174, d), b = smoothstep(186, 214, d); poiC.copy(ponyAim).lerp(beyondAim, a * a).lerp(crownAim, b).lerp(turnAim, smoothstep(214, 250, d)); return pan(poiC, u); }, from: 126 / L, to: uOfS(36.5), weight: 0.86, fade: 0.17 },
        // round the turn the tree holds the gaze almost wholly (the steady camera takes a third of this: the trunk and most of the crown stay in its frame)
        { at: (time, u) => { const d = u * L; poiD.copy(crownAim).lerp(turnAim, smoothstep(214, 250, d)); return pan(poiD, u); }, from: 216 / L, to: uOfS(36.5), weight: 0.72, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: pal[5], veil: pal[5], glow: 0, revealDistance: 600, tilt: true, blendDistance: 25 },
      // flat: no tone map, so the kraft and every pencil reach the screen as their own hex
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 2 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      update,
      dispose() { hero.dispose(); U.uAtlas.value.dispose(); },
    };
  },
};
