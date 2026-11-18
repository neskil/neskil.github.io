// SHELVES OF LIT MEMORIES: the chasm and what stands in it (the islands' builder). Everything is placed by the plan's CHASM,
// TOWER, PLAT, ISLES, WHEEL and TUBES (read here, never copied). x east, y up, z south; the flight comes from the north.
//  THE CHASM: a round pit about the plan's middle: a sheer wall from the rim (y 0) down in four real ledges (14, 52, 112 and
//   196 m down, 6 to 9 m broad), drawn in as twenty great buttresses with real relief (31 to 60 m broad, 12 to 28 m proud, a sloped shoulder
//   under the rim; the stream 'wall'), in broad beds of dusky violet stone (islemat's chasm) lit by the dome, by the islands'
//   and the tower's glow and from below by the mist: four level sheets of slow glowing mist lie in the pit from 118 to 200 m
//   down (islemat's mist), under which the bowl (470 m down) is lost. The mist is lit in colour: under each island a broad pool
//   of its own light, under each line of light a faint track, before the tower the window's colour. A low kerb round the rim
//   (1.1 m) with a line of small lamps, 9 m apart. ON THE LEDGES rows and heaps of dim grey orbs lie where they fell (about
//   1,800, the stream 'ledge-orbs'; one in seven still holds a ghost of colour); the buttresses nearest an island hold its glow.
//   DIM GREY ORBS (glass balls 1.5 to 3.1 m in radius; 400 by the seed's density, 280 to 520) fall as a slow soft rain at 2.2
//   to 3.6 m a second, each with a short soft trail: three in four pour over the rim's lip in loose streams in the bays between
//   the buttresses and leave the wall as they fall 300 m; the rest fall in fourteen loose clusters deep in the pit, from 95 to
//   325 m down. Each begins again at the top, swelling from nothing, and fades as it sinks. Dealt from the stream 'grey-orbs'
//   (every die before any test, eight tries an orb at the most). None within 60 m in plan of the route's typed line; the deep
//   ones keep clear of every stem. None floats at the islands' level.
//  THE STEMS AND THE ISLANDS: each island a round disc with a rounded under-side on a slim stem out of the dark, a kerb and
//   small lamps round its edge, its top paved; on it one bold set of things lit by its own lamps, with nobody on it:
//   FUNFAIR (the great wheel, a striped tent, a spiral slide, a carousel roof, six stalls, strings of lamps), RINK, HOUSE,
//   FAR-WEST (golden horns and organ pipes), FAR-EAST (blocks, arches, a tower of rings); each is told where it is built below.
//  THE GREAT WHEEL (the plan's WHEEL): its disc in the plane of WHEEL.x, turning about its axle once in 40 s by the clock; two
//   rims, inner rings, sixteen spokes a side, a hub, sixteen gondolas that hang level, lamps along rims and spokes; on a trestle.
//  THE LINES OF LIGHT: from a short mast (14 m, a bright ball at its head) by each island's middle one taut unbroken ribbon
//   (a slim core 0.16 m broad, never under 2 pixels, a narrow soft glow) to the pod's shell under the window's sill (14 m and more over the trains' track); brighter stretches some 22 m long run along it
//   toward the tower, 50 m apart, one passing a place every 4 s (12.5 m a second); small bulbs along it, 8 m apart: a strung line of lamps.
//  THE TOWER: a stem flaring into the ring terrace (the plan's collar) with lamps round its rim and on its deck; on it a
//   rounded pod (an ellipsoid on a flat foot, widest at 0.42 of its height) with fine ribs; ONE band of milky window facing
//   north, from TOWER.win0 to win1 and 100 degrees round (islemat's windowGlass: a steady ground, amber at the sill going to
//   rose-violet at the top; its light is gold at every clock, and over the gold blue, red, green and violet visit in turn, 10 s
//   each, never taking it over: a round of 40 s whose place at the clock's zero the seed deals, the stream 'window') deep in a raised frame (behind the glass, dimly, tier over tier of softly glowing orbs: light only): fourteen panes across
//   and four high between real mullions and transoms, a sill of lamps. Behind the glass five broad blurred lights in the orbs'
//   colours drift across the band (10 to 18 s each) over the steady ground: light only, no shape. Its light falls on the terrace, on the ring's platform
//   and on the shell beside the band. Six rows of small round lit ports; a crown ring that gives its own light, with lamps;
//   five collars (the sockets) where the plan's glass tubes come through the crown's shell. Every size follows the plan.
//  OVER THE FUNFAIR three slow soft searchlights that lean east; OVER THE WHOLE PIT eleven slow blooms of coloured sparks
//   (islemat's beams and sparks); soft glows round the wheel, over each island and before the tower's window.
//  THE RING'S PLATFORM: a round deck on a slim stem, a low rim with small lamps 4.7 m apart, low on the rim. Nothing stands on the deck; nothing of
//   this part crosses the flown line (its nearest skin is the platform's rim, 13.8 m under the line).
// NOTHING here is keyed to the flight, the lens or a seed's number; what moves goes by the world's clock (the wheel, the orbs,
// the pulses, the window's colour, the mist, the searchlights, the blooms), each a plain function of the clock. No figure, nothing lettered, no emblem.
// A SEED DEALS: ctx.vary.rare a sixth small island far to the south, 400 m beyond the tower (a banded beacon 46 m tall with a
// steady lamp, its own line of light); ctx.vary.density the count of grey orbs and of lamps on the funfair's strings.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CHASM, TOWER, PLAT, ISLES, WHEEL, ROUTE, MOUTH, ORB } from './shelves-of-lit-memories-plan.js';
import * as PLAN from './shelves-of-lit-memories-plan.js';
import { solid, chasm, shell, windowGlass, lamps, greyOrbs, lineOfLight, sprites, mist, orbTrail, beams, sparks, ledgeOrbs } from './shelves-of-lit-memories-islemat.js';

const PI = Math.PI, TAU = PI * 2, C = (hex) => new THREE.Color(hex), UP = new THREE.Vector3(0, 1, 0);
// a solid of revolution about the upright through the origin from a profile of [radius, height]. Listed up the outside its faces
// look outward. From the profile's place `crisp` on every corner is kept sharp (0: all sharp; Infinity: all smooth).
// phi 0 looks south (+z), pi north. Its uv: x once round (or once across a part turn), y along the profile
function lathe(pts, segs, crisp = 0, phi0 = 0, phiLen = TAU) {
  const p = []; pts.forEach((q, i) => { const v = new THREE.Vector2(Math.max(q[0], 0.001), q[1]); p.push(v); if (i >= Math.max(crisp, 1) && i < pts.length - 1) p.push(v.clone()); });
  return new THREE.LatheGeometry(p, segs, phi0, phiLen);
}
// paint(g, colour, glow): every corner's colour and how much of it the thing gives off as its own light (islemat's solid)
function paint(g, c, glow = 0) {
  const n = g.attributes.position.count, A = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { A[i * 4] = c.r; A[i * 4 + 1] = c.g; A[i * 4 + 2] = c.b; A[i * 4 + 3] = glow; }
  g.setAttribute('aCol', new THREE.BufferAttribute(A, 4)); return g;
}
// many painted geometries as one (plain triangles; only what the material reads is kept)
function join(list) {
  const flat = list.map((g) => { const q = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(q.attributes)) if (!['position', 'normal', 'aCol'].includes(name)) q.deleteAttribute(name);
    return q; });
  const m = mergeGeometries(flat); for (const g of list) g.dispose(); for (const g of flat) g.dispose(); return m;
}
const box = (w, h, d, x, y, z, c, glow = 0, turn = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (turn) g.rotateY(turn); return paint(g.translate(x, y + h / 2, z), c, glow); };      // y: its foot
const cyl = (r0, r1, h, x, y, z, c, glow = 0, seg = 12, open = false) => paint(new THREE.CylinderGeometry(r1, r0, h, seg, 1, open).translate(x, y + h / 2, z), c, glow);      // r0 at its foot (y), r1 at its head
const ball = (r, x, y, z, c, glow = 0, detail = 2) => paint(new THREE.IcosahedronGeometry(r, detail).translate(x, y, z), c, glow);
const hoop = (R, t, x, y, z, c, glow = 0, seg = 48, ts = 8) => paint(new THREE.TorusGeometry(R, t, ts, seg).rotateX(PI / 2).translate(x, y, z), c, glow);      // lying level
const disc = (r, x, y, z, c, glow = 0, seg = 64) => paint(new THREE.CircleGeometry(r, seg).rotateX(-PI / 2).translate(x, y, z), c, glow);      // looking up
// a round beam between two places, `t` its radius (`t1` at its far end if it tapers)
function beam(a, b, t, c, glow = 0, seg = 6, t1 = t) {
  const A = new THREE.Vector3(...a), d = new THREE.Vector3(...b).sub(A), L = Math.max(d.length(), 1e-3);
  const g = new THREE.CylinderGeometry(t1, t, L, seg, 1, true).translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.multiplyScalar(1 / L))).translate(A.x, A.y, A.z);
  return paint(g, c, glow);
}
// lit(list, x, y, z, r, colour, k): a round lamp of radius r at a place, for lampMesh
const lit = (list, x, y, z, r, c, k = 1) => { list.push(x, y, z, r, c.r * k, c.g * k, c.b * k); };
function lampMesh(list, mat) {
  const n = list.length / 7, P = new Float32Array(n * 3), L = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { P.set(list.slice(i * 7, i * 7 + 3), i * 3); L.set([list[i * 7 + 4], list[i * 7 + 5], list[i * 7 + 6], list[i * 7 + 3]], i * 4); }
  const mesh = new THREE.Mesh(sprites(n, { aPos: [P, 3], aLamp: [L, 4] }), mat); mesh.frustumCulled = false; mesh.renderOrder = 2; return mesh;
}
// the distance in plan from (x, z) to the route's line over the chasm (the straight runs between the plan's typed places)
function routeGap(x, z) {
  let best = 1e9;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const a = ROUTE[i], b = ROUTE[i + 1]; if (b[2] < MOUTH[2] - 120) continue;
    const dx = b[0] - a[0], dz = b[2] - a[2], t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[2]) * dz) / Math.max(dx * dx + dz * dz, 1e-6)));
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t));
  }
  return best;
}
// the tower's pod: its radius at a height (an ellipsoid on a flat foot `foot` of its breadth wide, widest at `mid` of its height)
const POD = { foot: 0.24, mid: 0.42 };
const podR = (y) => { const s = Math.min(1, Math.max(0, (y - TOWER.y0) / (TOWER.y1 - TOWER.y0))), m = POD.mid;
  return TOWER.r * (s < m ? POD.foot + (1 - POD.foot) * Math.sqrt(Math.max(1 - ((m - s) / m) ** 2, 0)) : Math.sqrt(Math.max(1 - ((s - m) / (1 - m)) ** 2, 0))); };
// a disc on its stem: the profile up the outside (foot in the depths, a flare under the disc, a rounded under-side, a kerb)
const stemProfile = (R, top, rs) => [[rs, -440], [rs, top - 80], [rs * 1.15, top - 55], [rs * 1.8, top - 36], [R * 0.22, top - 24], [R * 0.48, top - 15], [R * 0.78, top - 8.5],
  [R * 0.95, top - 4.5], [R, top - 2], [R, top + 0.8], [R - 1, top + 0.8], [R - 1, top - 0.05]];

export async function buildIsles(ctx, world) {
  // the world's clock, and with it where the round of the window's visitors stands at the clock's zero (0 to 1): dealt once, from a stream of its own
  const shared = { ...world, uRound: { value: ctx.core.makeRng(ctx.core.hashSeed('window:' + ctx.seed))() } };
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('shelves-of-lit-memories:' + name + ':' + ctx.seed));
  const vary = ctx.vary || {}, rare = !!vary.rare, dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1)), detail = ctx.quality ? ctx.quality.detail : 1;
  const group = new THREE.Group(); group.name = 'isles';
  const made = [], put = (g, m, parent = group) => { const mesh = new THREE.Mesh(g, m); made.push(g, m); parent.add(mesh); return mesh; };
  const T = TOWER, cx = CHASM.x, cz = CHASM.z, R = CHASM.r;
  const cream = C('#f6e9d8'), red = C('#e2403a'), gold = C('#f5c044'), teal = C('#2fa3a8'), blue = C('#3a8fe6'), warm = C('#ffcf86'), amber = C('#ffa858');
  const five = [ORB.gold, ORB.blue, ORB.red, ORB.green, ORB.violet].map(C);
  const flush = async (parts, m) => { if (parts.length) put(join(parts.splice(0)), m); await ctx.yield(); };      // what is gathered so far becomes one mesh; then the build yields
  const stemTint = '#a99cdc', lampMat = lamps(shared, {}), still = [];      // `still`: every lamp that does not move, drawn as one mesh
  made.push(lampMat);

  // ---- the chasm: the wall in ledges down to a bowl lost in mist, drawn in here and there as a great buttress with real
  // relief (twenty round the pit, 31 to 60 m broad, 12 to 28 m proud, each with a sloped shoulder under the rim; flat faces:
  // hewn stone); the kerb; four level sheets of slow glowing mist from 118 to 200 m down. It looks inward (listed from the rim down)
  const isles = ISLES.map((I) => ({ ...I })); if (rare) isles.push({ name: 'beacon', x: cx - 60, z: cz + 400, y: 42, r: 34 });
  const KEY = [-0.52, 0.3, -0.8, 0.5];      // a soft violet light from the north-west, so that a round stem reads round
  const winMid = (T.win0 + T.win1) / 2;
  const glowCol = { funfair: '#ffa040', rink: '#9ccfff', house: '#ff9a3c', 'far-west': '#ffc23a', 'far-east': '#ff6a9a', beacon: '#ffd9a0' };
  const glows = [[T.x, winMid, T.z, 260, '#ffd090', 0.6], ...isles.map((I) => [I.x, I.y + 6, I.z, 135, glowCol[I.name], 4.5])];      // on the wall: the tower's glow, each island's own colour on the buttresses nearest it
  // where each island's line of light runs, in plan: from its short mast to the pod's shell
  const MAST = { funfair: [0, 0], rink: [0, -33], house: [0, -4] }, TOWARD = { 'far-west': 0.5, 'far-east': 0.77, beacon: 0.5 };
  const lineY = T.y0 + (T.y1 - T.y0) * 0.2, lineR = podR(lineY) + 0.3;      // a line of light ends on the pod's shell under the window's sill: well over the trains' track round the terrace
  const lineOf = (I) => { const dx0 = T.x - I.x, dz0 = T.z - I.z, l0 = Math.hypot(dx0, dz0), k = (TOWARD[I.name] || 0) * I.r, off = MAST[I.name] || [dx0 / l0 * k, dz0 / l0 * k];
    const mx = I.x + off[0], mz = I.z + off[1], dx = mx - T.x, dz = mz - T.z, l = Math.hypot(dx, dz); return [mx, mz, T.x + dx / l * lineR, T.z + dz / l * lineR]; };
  // on the mist: a broad soft pool of each island's own light under it (gold and red under the fair, ice blue under the rink,
  // amber under the house, gold under the horns, red, green and blue under the blocks), a small one under the ring's platform
  const pools = [[PLAT.x, PLAT.z, 45, '#ffcf96', 0.25]];
  for (const I of isles) pools.push(...({ funfair: [[I.x - 14, I.z + 6, 110, '#ffa81e', 0.72], [I.x + 30, I.z - 16, 85, '#ff3020', 0.6]], rink: [[I.x, I.z, 115, '#5ab4ff', 0.72]], house: [[I.x, I.z, 105, '#ff8420', 0.68]],
    'far-west': [[I.x, I.z, 115, '#ffb41e', 0.72]], 'far-east': [[I.x - 34, I.z + 8, 66, '#ff4030', 0.6], [I.x + 32, I.z - 22, 66, '#40d848', 0.52], [I.x + 6, I.z + 38, 66, '#3090ff', 0.6]] }[I.name] || [[I.x, I.z, 70, '#ffd9a0', 0.4]]));
  const mistLight = { pools, tracks: isles.map(lineOf), win: [T.x, T.z - T.r - 60, 150, 0.5] };
  const butt = []; { const rng = stream('wall'), N = 20; for (let k = 0; k < N; k++) butt.push({ a: (k + 0.2 + 0.6 * rng()) / N * TAU, w: 0.03 + 0.028 * rng(), d: 12 + 16 * rng(), top: 8 + 30 * rng() }); }
  const buttAt = (a) => { let best = null, v = 0;      // how far the wall is drawn in at a bearing, and by which buttress
    for (const q of butt) { let da = Math.abs(a - q.a) % TAU; if (da > PI) da = TAU - da; const f = q.d * Math.min(1, Math.max(0, 1 - da / q.w) / 0.45); if (f > v) { v = f; best = q; } }
    return [v, best]; };
  {
    const prof = [[R, 0], [R, -6], [R, -14], [R - 6, -14], [R - 6, -30], [R - 6, -52], [R - 13, -52], [R - 13, -80], [R - 13, -112], [R - 21, -112], [R - 21, -196], [R - 30, -196], [R - 30, -300],
      [R - 80, -400], [R * 0.5, -450], [0.001, -470]], NC = 384, NR = prof.length, pos = [], uv = [], idx = [], colB = [], colQ = [];
    for (let j = 0; j <= NC; j++) { const a = j / NC * TAU, [b, q] = buttAt(a), sn = Math.sin(a), cs = Math.cos(a); colB.push(b); colQ.push(q);
      for (let i = 0; i < NR; i++) { const [r0, y] = prof[i], g = q ? Math.min(1, -y / q.top) * (y < -300 ? Math.max(0, (y + 440) / 140) : 1) : 0, r = r0 - b * g;
        pos.push(cx + r * sn, y, cz + r * cs); uv.push(j / NC, i / (NR - 1)); } }
    for (let j = 0; j < NC; j++) for (let i = 0; i < NR - 1; i++) { const a0 = j * NR + i, b0 = a0 + NR; idx.push(a0, b0, a0 + 1, b0 + 1, a0 + 1, b0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const wall = g.toNonIndexed(); wall.computeVertexNormals(); g.dispose();
    const wallMat = chasm(shared, { pit: [cx, cz], lamps: glows, ledges: [14, 52, 112, 196] }); put(wall, wallMat);
    await ctx.yield();
    put(lathe([[R + 1.8, 0], [R + 1.8, 1.1], [R - 0.4, 1.1], [R - 0.4, -0.6]], 192).translate(cx, 0, cz), shell(shared, { tint: '#8d7fc0', ribs: [260, 0.03, 0, 0.5] }));
    { const n = Math.round(TAU * (R + 0.7) / 9); for (let k = 0; k < n; k++) { const an = (k + 0.5) / n * TAU; lit(still, cx + (R + 0.7) * Math.sin(an), 1.5, cz + (R + 0.7) * Math.cos(an), 0.28, C('#ffc98a')); } }      // a line of small lamps along the kerb, 9 m apart
    // dim grey orbs lying on the four ledges where they fell (the stream 'ledge-orbs'): rows along the back wall (18 to 60 m)
    // and heaps two deep and two high (9 to 22 m), 14 to 70 m apart (fewer on the lowest ledge); one in seven still holds a
    // ghost of an orb's colour. Each lies on the wall's own faces (between two columns of the wall); none on a buttress's flank
    {
      const rng = stream('ledge-orbs'), P = [], K = [], Tn = [], grey = C(ORB.grey), W = 1024, cov = new Float32Array(W * 4), sum = new Float32Array(W * 12); let li = -1;
      const at = (j, r0, D) => { const q = colQ[j % NC], r = r0 - colB[j % NC] * (q ? Math.min(1, D / q.top) : 0), an = j / NC * TAU; return [cx + r * Math.sin(an), cz + r * Math.cos(an)]; };
      for (const [D, rIn, rOut, share] of [[14, R - 6, R, 1], [52, R - 13, R - 6, 1], [112, R - 21, R - 13, 1], [196, R - 30, R - 21, 0.5]]) {
        const round = TAU * (rIn + rOut) / 2; let s0 = rng() * 40; li++;      // metres round the ledge
        for (let item = 0; item < 400 && s0 < round; item++) {
          const heap = rng() < 0.4, len = heap ? rng.range(9, 22) : rng.range(18, 60), gap = rng.range(14, 70) / share, base = rng.range(1.1, 1.9); let u = s0; s0 += len + gap;
          for (let k = 0; k < 60 && u < s0 - gap; k++) {
            const rad = base * rng.range(0.8, 1.1), tone = rng(), ghost = rng(), ci = Math.floor(rng() * 5) % 5, front = rng(), up = rng();
            const a = u / round * NC, j = Math.floor(a), f = a - j; u += rad * 2.05;
            const o0 = at(j, rOut, D), o1 = at(j + 1, rOut, D), i0 = at(j, rIn, D), i1 = at(j + 1, rIn, D);
            const ox = o0[0] + (o1[0] - o0[0]) * f, oz = o0[1] + (o1[1] - o0[1]) * f, ix = i0[0] + (i1[0] - i0[0]) * f, iz = i0[1] + (i1[1] - i0[1]) * f, w = Math.hypot(ox - ix, oz - iz);
            if (Math.abs(colB[j % NC] - colB[(j + 1) % NC]) > 1.5 || w < rad * 2.2) continue;
            const tint = ghost < 0.14 ? grey.clone().lerp(five[ci], 0.5) : grey;
            const lay = (t, y, r) => { P.push(ox + (ix - ox) * t, y, oz + (iz - oz) * t); K.push(r, tone); Tn.push(tint.r, tint.g, tint.b);
              const q = li * W + Math.floor(a / NC * W) % W, c = PI * r * r / (round / W * 4); cov[q] += c; sum[q * 3] += tint.r * c; sum[q * 3 + 1] += tint.g * c; sum[q * 3 + 2] += tint.b * c; };      // and its share of the ledge's band
            lay((rad + 0.05) / w, -D + rad, rad);      // against the back wall
            if (heap) { if (front < 0.7 && w > rad * 4.3) lay(rad * 3 / w, -D + rad * 0.9, rad * 0.9); if (up < 0.6) lay((rad * 1.05 + 0.05) / w, -D + rad * 2.6, rad * 0.85); }
          }
        }
      }
      const lo = put(sprites(P.length / 3, { aPos: [new Float32Array(P), 3], aK: [new Float32Array(K), 2], aTint: [new Float32Array(Tn), 3] }), ledgeOrbs(shared)); lo.frustumCulled = false; lo.renderOrder = -9;
      // the band the wall shows where the orbs are too small to draw: once round the pit (1024 steps of 3.2 m), a row a ledge: the
      // orbs' mean colour times the share of a 4 m band they fill, and that share; softened twice along the ledge
      const bytes = new Uint8Array(W * 16);
      for (let l = 0; l < 4; l++) {
        for (let pass = 0; pass < 2; pass++) for (const [arr, n] of [[cov, 1], [sum, 3]]) for (let ch = 0; ch < n; ch++) { const src = new Float32Array(W); for (let i = 0; i < W; i++) src[i] = arr[(l * W + i) * n + ch];
          for (let i = 0; i < W; i++) arr[(l * W + i) * n + ch] = 0.25 * src[(i + W - 1) % W] + 0.5 * src[i] + 0.25 * src[(i + 1) % W]; }
        for (let i = 0; i < W; i++) { const q = l * W + i, c = cov[q], k = (c > 1 ? 1 / c : 1) * 255; bytes[q * 4] = Math.min(255, sum[q * 3] * k); bytes[q * 4 + 1] = Math.min(255, sum[q * 3 + 1] * k); bytes[q * 4 + 2] = Math.min(255, sum[q * 3 + 2] * k); bytes[q * 4 + 3] = Math.min(255, c * 255); }
      }
      const heapTex = new THREE.DataTexture(bytes, W, 4, THREE.RGBAFormat); heapTex.wrapS = THREE.RepeatWrapping; heapTex.magFilter = heapTex.minFilter = THREE.LinearFilter; heapTex.needsUpdate = true;
      made.push(heapTex); wallMat.uniforms.uHeap.value = heapTex;
    }
    await ctx.yield();
    for (const [y, k, dx, dz, off, ro] of [[-200, 0.88, -0.5, -0.6, 11.3, -8], [-168, 0.6, 0.7, -1.6, 7.1, -7], [-142, 0.5, -1.2, 1.9, 3.7, -6], [-118, 0.42, 2.2, 0.8, 0, -5]])
      put(new THREE.CircleGeometry(R - 5, 72).rotateX(-PI / 2).translate(cx, y, cz), mist(shared, { pit: [cx, cz, R], lay: [dx, dz, k, off], ...mistLight })).renderOrder = ro;
  }
  await ctx.yield();
  // ---- the grey orbs: a slow soft rain, each with a short soft trail. Three in four pour over the rim's lip in loose streams
  // in the bays between the wall's buttresses and leave the wall as they fall; the rest fall in loose clusters deep in the pit
  // (from 95 m down). None within 60 m in plan of the flown line. Every die before any test; at most eight tries an orb
  {
    const rng = stream('grey-orbs'), want = Math.round(400 * dens * (detail < 0.6 ? 0.7 : 1)), lipP = [], lipK = [], deepP = [], deepK = [];
    const bays = butt.map((q, k) => { const n = butt[(k + 1) % butt.length]; let a1 = n.a; if (a1 < q.a) a1 += TAU; return { a: (q.a + q.w + a1 - n.w) / 2, w: Math.max(0.01, (a1 - n.w - q.a - q.w) / 2 - 0.02) }; });
    const clusters = []; for (let k = 0; k < 14; k++) clusters.push([rng() * TAU, Math.sqrt(rng()) * (R - 120)]);
    for (let tries = 0; tries < want * 8 && (lipP.length + deepP.length) / 3 < want; tries++) {
      const lip = rng() < 0.75, bay = bays[Math.floor(rng() * bays.length) % bays.length], cl = clusters[Math.floor(rng() * clusters.length) % clusters.length];
      const u = rng() * 2 - 1, v = rng(), ph = rng(), sp = rng.range(2.2, 3.6), sw = rng() * TAU, tone = rng(), rad = rng.range(1.5, 2.6), oa = rng() * TAU, od = 34 * Math.sqrt(rng());
      let x, z, a = 0;
      if (lip) { a = bay.a + u * Math.abs(u) * bay.w; const rr = R - 38 - 16 * v * v; x = cx + rr * Math.sin(a); z = cz + rr * Math.cos(a); }      // gathered toward the bay's middle and the wall
      else { x = cx + cl[1] * Math.sin(cl[0]) + od * Math.sin(oa); z = cz + cl[1] * Math.cos(cl[0]) + od * Math.cos(oa); }
      if (routeGap(x, z) < 64) continue;      // 64 m from the route's typed line: 60 and more from the flown line
      if (lip) { if (routeGap(cx + (R - 3) * Math.sin(a), cz + (R - 3) * Math.cos(a)) < 64 || buttAt(a + 0.012)[0] > 0 || buttAt(a - 0.012)[0] > 0) continue;
        lipP.push(x, ph, z); lipK.push(sp, rad, sw, tone); continue; }
      if (Math.hypot(x - cx, z - cz) > R - 90 || Math.hypot(x - T.x, z - T.z) < T.collar * 0.12 + 12 || Math.hypot(x - PLAT.x, z - PLAT.z) < 12 || isles.some((I) => Math.hypot(x - I.x, z - I.z) < 16)) continue;      // clear of every stem
      deepP.push(x, ph, z); deepK.push(sp, rad * 1.2, sw, tone);
    }
    for (const [P, K, o] of [[lipP, lipK, { top: -1, span: 300, pit: [cx, cz, R - 3, 1] }], [deepP, deepK, { top: -95, span: 230, pit: [cx, cz, 0, 0] }]]) {
      const g = sprites(P.length / 3, { aPos: [new Float32Array(P), 3], aK: [new Float32Array(K), 4] });
      put(g, greyOrbs(shared, o)).frustumCulled = false;
      const tr = new THREE.Mesh(g, orbTrail(shared, o)); made.push(tr.material); tr.frustumCulled = false; tr.renderOrder = 1; group.add(tr);
    }
  }
  await ctx.yield();

  // ---- the stems and the discs
  for (const I of isles) {
    put(lathe(stemProfile(I.r, I.y, 4.2 + I.r * 0.03), I.name === 'funfair' ? 128 : 72, 8).translate(I.x, 0, I.z),
      shell(shared, { tint: stemTint, ribs: [I.r > 50 ? 36 : 18, 0.018, 6, 0.5], warm: [I.y + 1, 30, 0.95], lift: 1.6, key: KEY, glow: [T.x, (T.win0 + T.win1) / 2, T.z, 240, 0.5] }));
    const cols = { funfair: five, rink: [C('#e6f0ff')], house: [warm], 'far-west': [warm, amber] }[I.name] || five, n = Math.round(TAU * I.r / 4.5), nu = Math.round(TAU * I.r / 9);      // small lamps round the disc's edge, 4.5 m apart; amber ones under its rim, 9 m apart
    for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * TAU; lit(still, I.x + (I.r + 0.3) * Math.sin(a), I.y + 0.5, I.z + (I.r + 0.3) * Math.cos(a), 0.3, cols[k % cols.length]); }
    for (let k = 0; k < nu; k++) { const a = k / nu * TAU; lit(still, I.x + I.r * 0.93 * Math.sin(a), I.y - 4.9, I.z + I.r * 0.93 * Math.cos(a), 0.34, amber, 0.9); }
    await ctx.yield();
  }

  // ---- the tower: the stem and the ring terrace; the pod; the great window deep in its frame (fourteen panes across, four
  // high: the mullions and transoms stand 1.6 m proud of the glass, the frame 2.4 m); the lit crown ring and the five sockets;
  // six rows of lit ports; lamps along the terrace's rim and on its deck. Every size follows the plan's TOWER
  const glowOf = (reach, k) => [T.x, winMid, T.z - podR(winMid) - 5, reach, k];      // the window's light, from before the glass (it looks north)
  {
    const y0 = T.y0, y1 = T.y1, H = y1 - y0, col = T.collar, tx = T.x, tz = T.z, half = 50 * PI / 180, rs = col * 0.12, NP = 14, NT = 3;
    put(lathe([[rs, -440], [rs, y0 - col * 1.05], [rs * 1.2, y0 - col * 0.6], [rs * 1.9, y0 - col * 0.27], [col * 0.45, y0 - col * 0.115], [col * 0.8, y0 - col * 0.046], [col, y0 - 1.6], [col, y0 + 1.2],
      [col - 1.4, y0 + 1.2], [col - 1.4, y0 - 0.05]], 128, 6).translate(tx, 0, tz),
      shell(shared, { tint: '#c9bfe6', ribs: [64, 0.03, 0, 0.6], warm: [y0 + 2, 28, 0.85], lift: 1.5, key: KEY, glow: glowOf(120, 0.4) }));
    const pp = [];
    for (let i = 0; i <= 16; i++) { const f = i / 16 * PI / 2; pp.push([T.r * (POD.foot + (1 - POD.foot) * Math.sin(f)), y0 + H * POD.mid * (1 - Math.cos(f))]); }
    for (let i = 1; i <= 28; i++) { const f = i / 28 * PI / 2; pp.push([T.r * Math.cos(f), y0 + H * (POD.mid + (1 - POD.mid) * Math.sin(f))]); }
    const win = [tx, tz, Math.cos(half), T.win0, T.win1];
    put(lathe(pp, 144, Infinity).translate(tx, 0, tz), shell(shared, { tint: '#ece6f8', ribs: [96, 0.03, 12, 1], warm: [y0 + 1, 26, 0.8], lift: 2.2, win: [...win, 0.6], spill: 16, key: KEY }));
    await ctx.yield();
    const band = (ya, yb, off, n = 14) => { const q = []; for (let i = 0; i <= n; i++) { const y = ya + (yb - ya) * i / n; q.push([podR(y) + off, y]); } return q; };
    put(lathe(band(T.win0, T.win1, 0.3), 112, Infinity, PI - half, 2 * half).translate(tx, 0, tz), windowGlass(shared, { grid: [NP, NT + 1], mull: [0.012, 0.012], gain: 1.02 }));
    // a fin on the shell: three faces (two flanks and a front) from d0 to d1 metres proud, wm metres broad, at bearing a
    const fin = (a, wm, d0, d1, ya, yb, n = 12) => { const q = [], ix = [];
      for (let i = 0; i <= n; i++) { const y = ya + (yb - ya) * i / n, r = podR(y), da = wm / 2 / r;
        for (const [d, sd] of [[d0, -1], [d1, -1], [d1, 1], [d0, 1]]) q.push((r + d) * Math.sin(a + sd * da), y, (r + d) * Math.cos(a + sd * da)); }
      for (let i = 0; i < n; i++) for (let f = 0; f < 3; f++) { const v = i * 4 + f; ix.push(v, v + 1, v + 4, v + 1, v + 5, v + 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.setIndex(ix);
      const out = g.toNonIndexed(); out.computeVertexNormals(); g.dispose(); out.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2)); return out; };
    const rail = (ya, yb, d0, d1, pad = 0) => lathe([[podR(ya) + d0, ya], [podR(ya) + d1, ya], [podR(yb) + d1, yb], [podR(yb) + d0, yb]], 112, 0, PI - half - pad, 2 * half + 2 * pad);
    const trims = [rail(T.win0 - 2.4, T.win0, 0.2, 2.7, 0.04), rail(T.win1, T.win1 + 2.4, 0.2, 2.7, 0.04)];
    for (let k = 1; k <= NT; k++) { const y = T.win0 + (T.win1 - T.win0) * k / (NT + 1); trims.push(rail(y - 0.5, y + 0.5, 0.25, 1.9)); }
    for (const sd of [-1, 1]) trims.push(fin(PI + sd * (half + 0.02), 2.6, 0.2, 2.7, T.win0 - 2.4, T.win1 + 2.4));
    for (let k = 1; k < NP; k++) trims.push(fin(PI - half + 2 * half * k / NP, 0.8, 0.25, 1.9, T.win0, T.win1));
    // the five sockets: a stout collar round each glass tube where its course (the plan's TUBES, read here) comes through the
    // crown's shell, turned along the course
    const Z = new THREE.Vector3(0, 0, 1), tr = PLAN.TUBE ? PLAN.TUBE.r : 1.9;
    for (const c of PLAN.TUBES || []) {
      const n = c.points.length; let hit = null;
      for (let t = n - 1; t > Math.max(n - 6, 0) && !hit; t -= 0.05) { const q = PLAN.courseAt(c, t); if (q[1] > y1 || Math.hypot(q[0] - tx, q[2] - tz) > podR(q[1])) hit = q; }
      if (!hit) continue;
      const q = new THREE.Quaternion().setFromUnitVectors(Z, new THREE.Vector3(hit[3], hit[4], hit[5]).normalize());
      trims.push(new THREE.TorusGeometry(tr + 0.35, 0.42, 8, 28).applyQuaternion(q).translate(hit[0] - tx, hit[1], hit[2] - tz));
    }
    const flat = trims.map((g) => g.index ? g.toNonIndexed() : g);
    put(mergeGeometries(flat).translate(tx, 0, tz), shell(shared, { tint: '#f4e2bc', ribs: [1, 0, 0, 1], warm: [y0 + 1, 26, 0.5], lift: 2.6, win: [...win, 1.0], spill: 16, side: THREE.DoubleSide }));
    for (const g of trims) g.dispose(); for (const g of flat) g.dispose();
    await ctx.yield();
    // the crown: a ring that gives its own light, a row of lamps on it
    const yc = y0 + H * 0.9, rc = podR(yc) + 0.4;
    put(paint(new THREE.TorusGeometry(rc, 1.2, 8, 112).rotateX(PI / 2).translate(tx, yc, tz), C('#ffe6b8'), 1.5), solid(shared, { stage: 0.3 }));
    for (let k = 0; k < 48; k++) { const a = (k + 0.5) / 48 * TAU; lit(still, tx + (rc + 1.3) * Math.sin(a), yc + 0.4, tz + (rc + 1.3) * Math.cos(a), 0.5, C('#ffe2b0'), 1.3); }
    const tl = []; for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; tl.push([tx + col * 0.86 * Math.sin(a), y0 + 3, tz + col * 0.86 * Math.cos(a), 30, '#ffb870', 0.9]); }
    put(join([disc(col - 1.4, tx, y0, tz, C('#8c7fb4'), 0, 128)]), solid(shared, { lamps: tl, stage: 0.14, pave: [3, 1], glow: glowOf(72, 1.2) }));
    const nr = Math.round(TAU * (col - 0.7) / 4.2), nd = Math.round(TAU * col * 0.86 / 7.5), ns = NP * 3;
    for (let k = 0; k < nr; k++) { const a = k / nr * TAU; lit(still, tx + (col - 0.7) * Math.sin(a), y0 + 1.7, tz + (col - 0.7) * Math.cos(a), 0.32, C('#ffc98a')); }
    for (let k = 0; k < nd; k++) { const a = (k + 0.5) / nd * TAU; lit(still, tx + col * 0.86 * Math.sin(a), y0 + 0.6, tz + col * 0.86 * Math.cos(a), 0.38, C('#ffb870')); }
    for (let j = 0; j < ns; j++) { const a = PI - half + 2 * half * (j + 0.5) / ns, rr = podR(T.win0 - 1.2) + 3; lit(still, tx + rr * Math.sin(a), T.win0 - 1.2, tz + rr * Math.cos(a), 0.34, C('#ffd9a0')); }      // a row of lamps along the window's sill
    // rows of small round lit ports: two under the window's band and two over it all the way round; two beside the band round the pod's back
    for (const [yy, r, back] of [[y0 + H * 0.1, 0.55, 0], [y0 + H * 0.18, 0.5, 0], [T.win0 + 14, 0.5, 1], [T.win1 - 14, 0.5, 1], [y0 + H * 0.78, 0.5, 0], [y0 + H * 0.86, 0.45, 0]]) {
      const rr = podR(yy) + 0.25, n = Math.round(TAU * rr / 5.2);
      for (let j = 0; j < n; j++) { const a = (j + 0.5) / n * TAU; if (back && Math.abs(a - PI) < half + 0.12) continue; lit(still, tx + rr * Math.sin(a), yy, tz + rr * Math.cos(a), r, C('#ffd9a0'), 1); }
    }
  }
  await ctx.yield();

  // ---- the ring's platform (by the plan's PLAT): a deck on its own stem, a low rim with small lamps 4.7 m apart; nothing stands on the deck
  {
    const P = PLAT, d = P.deck, r = P.r, pl = [];
    put(lathe([[2.2, -440], [2.2, d - 30], [3, d - 15], [5.5, d - 7], [r - 2.5, d - 2.6], [r, d - 1.2], [r, d + 0.7], [r - 0.7, d + 0.7], [r - 0.7, d - 0.05]], 64, 5).translate(P.x, 0, P.z),
      shell(shared, { tint: '#d9d0ee', ribs: [32, 0.03, 0, 0.8], warm: [d + 1, 12, 0.8], lift: 1.8, key: KEY, glow: glowOf(85, 0.9) }));
    for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * TAU; pl.push([P.x + r * Math.sin(a), d + 1.5, P.z + r * Math.cos(a), 9, '#ffcf96', 0.8]); }
    put(join([disc(r - 0.7, P.x, d, P.z, C('#9a8cc4'), 0, 48)]), solid(shared, { lamps: pl, stage: 0.16, pave: [2, 1], glow: glowOf(85, 1.5) }));
    const nl = Math.round(TAU * r / 4.7); for (let k = 0; k < nl; k++) { const a = (k + 0.5) / nl * TAU; lit(still, P.x + (r - 0.35) * Math.sin(a), d + 0.95, P.z + (r - 0.35) * Math.cos(a), 0.2, C('#ffd9a0')); }      // 4.7 m apart, low on the rim: under the ring's foot
  }
  await ctx.yield();
  // ---- THE FUNFAIR ISLAND: the great wheel on its trestle at the island's west edge (the plan's WHEEL); a striped round tent
  // with a pennon and a lit door; a spiral slide round a small tower; a little carousel roof; strings of lamps between nine
  // poles round the island (none before the wheel). Everything stands east of x -6 (the disc's own edge) and under y 112.
  const W = WHEEL, wr = W.r, wheel = new THREE.Group(), gondolas = [];
  const quad = (a, b, c, d) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3)); g.computeVertexNormals(); return g; };
  const tri = (a, b, c) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); g.computeVertexNormals(); return g; };
  {
    const I = isles.find((q) => q.name === 'funfair'), top = I.y, parts = [], fl = [];      // fl: the wheel's own lamps (they turn with it)
    const mat = solid(shared, { stage: 0.3, pave: [4, 1], lamps: [[W.x - 7, W.y, W.z, 46, '#ffc27a', 1.1], [W.x - 5, top + 5, W.z, 30, '#ffc27a', 1.0], [I.x + 10, top + 5, I.z + 8, 30, '#ffd9a0', 0.9],
      [I.x - 18, top + 5, I.z + 34, 24, '#ffb060', 1.0], [I.x + 6, top + 14, I.z - 30, 28, '#ffe0a8', 0.9], [I.x + 42, top + 8, I.z, 34, '#ffc27a', 0.8], [I.x, top + 8, I.z + 48, 30, '#ffc27a', 0.8],
      [I.x, top + 8, I.z - 52, 30, '#ffc27a', 0.8]] }); made.push(mat);
    const striped = (prof, n, cols, x, z) => { for (let k = 0; k < n; k++) parts.push(paint(lathe(prof, 2, 0, k / n * TAU, TAU / n).translate(x, 0, z), cols[k % cols.length])); };
    parts.push(disc(I.r - 1, I.x, top, I.z, C('#a8788c'), 0, 128));
    // the trestle: an A of two legs either side of the wheel, a tie across each, the axle between their heads
    for (const sx of [-4.7, 4.7]) { const x = W.x + sx;
      for (const sz of [-17, 17]) parts.push(beam([x, top, W.z + sz], [x, W.y, W.z], 0.6, teal, 0, 8), box(2.6, 1, 2.6, x, top, W.z + sz, cream));
      parts.push(beam([x, top + 15, W.z - 9.9], [x, top + 15, W.z + 9.9], 0.35, teal, 0, 8), box(1.8, 1.8, 1.8, x, W.y - 0.9, W.z, red)); }
    parts.push(beam([W.x - 4.7, W.y, W.z], [W.x + 4.7, W.y, W.z], 0.5, cream, 0, 10));
    // the boarding deck under the wheel's lowest gondola, two steps to the east, a lamp post at each corner
    parts.push(box(8.4, 1.1, 13, W.x, top, W.z, cream), box(2, 0.7, 9, W.x + 5.2, top, W.z, cream), box(2, 0.35, 9, W.x + 7.2, top, W.z, cream), box(8.6, 0.2, 13.2, W.x, top + 1.1, W.z, red));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { parts.push(cyl(0.14, 0.1, 3.4, W.x + sx * 3.9, top + 1.1, W.z + sz * 6.2, teal, 0, 6)); lit(still, W.x + sx * 3.9, top + 4.8, W.z + sz * 6.2, 0.3, warm, 1.1); }
    // the wheel, in its own frame about the axle (x along the axle): two rims, two inner rings a side, sixteen spokes a side with
    // a zigzag of braces at the rim, a tie across at each gondola, the hub; lamps along both rims (80 a side) and every spoke (7)
    wheel.position.set(W.x, W.y, W.z); group.add(wheel);
    const wp = [], torX = (Rr, t, x, seg = 96) => paint(new THREE.TorusGeometry(Rr, t, 8, seg).rotateY(PI / 2).translate(x, 0, 0), cream);
    for (const sx of [-1.8, 1.8]) {
      const P = (r, an, x = sx) => [x, r * Math.cos(an), r * Math.sin(an)], out = Math.sign(sx) * 0.5;
      wp.push(torX(wr, 0.42, sx), torX(wr - 3.4, 0.2, sx), torX(wr * 0.5, 0.22, sx, 64));
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * TAU, a1 = (k + 0.5) / 16 * TAU, a2 = (k + 1) / 16 * TAU;
        wp.push(beam(P(2.2, a, sx * 1.6), P(wr, a), 0.2, cream), beam(P(wr - 3.4, a1), P(wr, a), 0.11, cream, 0, 4), beam(P(wr - 3.4, a1), P(wr, a2), 0.11, cream, 0, 4));
        for (let j = 0; j < 7; j++) { const r = 5 + j * 3.5; lit(fl, sx * (1.6 - 0.6 * (r - 2.2) / (wr - 2.2)) + out, r * Math.cos(a), r * Math.sin(a), 0.25, j % 2 ? amber : warm, 1.2); }
      }
      for (let k = 0; k < 80; k++) { const a = k / 80 * TAU; lit(fl, sx + out * 1.1, wr * Math.cos(a), wr * Math.sin(a), 0.3, warm, 1.3); }
      wp.push(paint(new THREE.SphereGeometry(1.5, 16, 10).scale(0.55, 1, 1).translate(sx * 1.85, 0, 0), gold, 0.5));
      lit(fl, sx * 2.4, 0, 0, 0.5, C('#fff0c8'), 1.2);
    }
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; wp.push(beam([-1.8, wr * Math.cos(a), wr * Math.sin(a)], [1.8, wr * Math.cos(a), wr * Math.sin(a)], 0.16, cream)); }
    wp.push(paint(new THREE.CylinderGeometry(2.4, 2.4, 6.2, 24).rotateZ(PI / 2), red));
    await flush(parts, mat);
    put(join(wp), mat, wheel);
    await ctx.yield();
    const wl = lampMesh(fl, lampMat); made.push(wl.geometry); wheel.add(wl);
    // the gondolas (nobody in them): a rod from the pivot, a roof, a band of lit window between four posts, a body
    const gondola = (c) => { const g = [beam([0, 0, 0], [0, -1.05, 0], 0.09, cream, 0, 5), paint(new THREE.CylinderGeometry(0.3, 1.75, 0.75, 8).translate(0, -1.42, 0), c),
      box(2.0, 0.95, 2.4, 0, -2.75, 0, C('#ffe2b0'), 1.5), box(2.2, 1.1, 2.6, 0, -3.85, 0, c), box(2.32, 0.14, 2.72, 0, -2.8, 0, cream)];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(box(0.22, 0.95, 0.22, sx * 1.0, -2.75, sz * 1.2, c));
      return join(g); };
    const gg = five.map((c) => { const g = gondola(c); made.push(g); return g; });
    for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(gg[k % 5], mat); group.add(m); gondolas.push({ m, a: k / 16 * TAU }); }
    await ctx.yield();
    // the tent: 28 stripes, a pole with a plain pennon, a lit door toward the north-west
    const tx = I.x + 10, tz = I.z + 27, dn = Math.atan2(-0.8, -0.6);
    striped([[13, top], [13, top + 6], [14.2, top + 6.4], [14.2, top + 7.2], [8.5, top + 12], [1.3, top + 18.5], [0.9, top + 20]], 28, [red, cream], tx, tz);
    parts.push(beam([tx, top + 20, tz], [tx, top + 27, tz], 0.18, cream), paint(tri([tx, top + 26.8, tz], [tx, top + 24.6, tz], [tx + 4.4, top + 25.7, tz]), gold, 0.15));
    parts.push(box(4.6, 4.8, 0.6, tx + 13 * Math.sin(dn), top, tz + 13 * Math.cos(dn), C('#ffd9a0'), 1.6, dn), box(6, 0.7, 1.2, tx + 13.2 * Math.sin(dn), top + 4.8, tz + 13.2 * Math.cos(dn), gold, 0.1, dn));
    await flush(parts, mat);
    // the slide: a small tower with lit slots and a cap, a chute winding down round it three and a quarter times
    const sx0 = I.x + 6, sz0 = I.z - 30, N = 140, pos = [], idx = [];
    parts.push(cyl(2.6, 2.4, 24, sx0, top, sz0, gold, 0, 16), cyl(3.6, 0.2, 6.5, sx0, top + 24, sz0, red, 0, 16), cyl(4.4, 4.4, 0.5, sx0, top + 20.4, sz0, cream, 0, 20));
    for (let k = 0; k < 5; k++) { const a = dn + k * 1.9; parts.push(box(1, 2.4, 0.4, sx0 + 2.45 * Math.sin(a), top + 3 + k * 4.2, sz0 + 2.45 * Math.cos(a), C('#ffe2b0'), 1.6, a)); }
    for (let i = 0; i <= N; i++) { const q = i / N, a = 2.2 + q * 3.25 * TAU, y = top + 20.6 - 20 * q, s = Math.sin(a), c = Math.cos(a);
      pos.push(sx0 + 3.4 * s, y, sz0 + 3.4 * c, sx0 + 6.2 * s, y + 0.5, sz0 + 6.2 * c, sx0 + 6.3 * s, y + 1.5, sz0 + 6.3 * c);
      if (i < N) { const k = i * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); } }
    const chute = new THREE.BufferGeometry(); chute.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); chute.setIndex(idx); chute.computeVertexNormals();
    parts.push(paint(chute, blue));
    await flush(parts, mat);
    // the carousel's roof on its posts, lamps under its eave
    const ax = I.x - 18, az = I.z + 34;
    parts.push(cyl(7.6, 7.6, 0.6, ax, top, az, cream, 0, 24), cyl(0.5, 0.5, 9.6, ax, top, az, gold, 0, 8), cyl(7.9, 7.9, 0.7, ax, top + 5.6, az, gold, 0.25, 24, true), ball(0.7, ax, top + 10.6, az, gold, 0.5, 1));
    striped([[8.2, top + 6.3], [4.5, top + 8.4], [0.5, top + 10.2]], 16, [gold, red], ax, az);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; parts.push(cyl(0.16, 0.16, 5.2, ax + 6.6 * Math.sin(a), top + 0.6, az + 6.6 * Math.cos(a), cream, 0, 6)); }
    for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; lit(still, ax + 8.1 * Math.sin(a), top + 5.5, az + 8.1 * Math.cos(a), 0.17, warm); }
    // six stalls in an arc east of the wheel: a lit front toward the wheel, a striped awning over it
    for (let k = 0; k < 6; k++) { const a = (k - 2.5) * 0.3, bx = W.x + 27 * Math.cos(a), bz = W.z + 27 * Math.sin(a) * 1.25, t = Math.atan2(W.x - bx, W.z - bz), s = Math.sin(t), c = Math.cos(t), cc = five[(k + 1) % 5];
      parts.push(box(5.4, 3.4, 4, bx, top, bz, cc, 0, t), box(4.6, 1.9, 0.3, bx + 2 * s, top + 1.2, bz + 2 * c, C('#ffe2b0'), 1.5, t), box(6, 0.35, 5, bx, top + 3.4, bz, cream, 0, t));
      for (let j = 0; j < 6; j++) parts.push(paint(quad([bx + 2 * s + (j - 3) * c, top + 3.75, bz + 2 * c - (j - 3) * s], [bx + 2 * s + (j - 2) * c, top + 3.75, bz + 2 * c - (j - 2) * s],
        [bx + 4.2 * s + (j - 2) * c, top + 2.8, bz + 4.2 * c - (j - 2) * s], [bx + 4.2 * s + (j - 3) * c, top + 2.8, bz + 4.2 * c - (j - 3) * s]), j % 2 ? cream : red));
      lit(still, bx + 2.3 * s, top + 4.3, bz + 2.3 * c, 0.3, warm, 1.1); }
    await flush(parts, mat);
    // nine poles round the island, a lamp on each, a sagging string of coloured lamps from each to the next
    const n = Math.round(9 * dens), pole = (k) => { const a = k * TAU / 10; return [I.x + 61 * Math.cos(a), I.z + 61 * Math.sin(a)]; };
    for (let k = 0; k < 10; k++) { if (k === 5) continue; const p = pole(k);
      parts.push(cyl(0.24, 0.16, 9, p[0], top, p[1], cream, 0, 6)); lit(still, p[0], top + 9.3, p[1], 0.34, warm);
      if (k === 4) continue; const q = pole((k + 1) % 10);
      for (let j = 1; j <= n; j++) { const u = j / (n + 1); lit(still, p[0] + (q[0] - p[0]) * u, top + 9 - 6.4 * u * (1 - u), p[1] + (q[1] - p[1]) * u, 0.17, five[j % 5]); } }
    put(join(parts), mat);
  }
  await ctx.yield();
  // ---- THE RINK ISLAND: a pale sheet of ice (an oval 92 by 52 m) with its lines, low white boards with a red rail, four
  // floodlight masts 34 m tall with bright heads turned to the ice, two goal frames, tiers of empty benches along both long sides
  const mastAt = { funfair: [0, 0], rink: [0, -33], house: [0, -4] };      // where each island's short mast stands, from its middle
  {
    const I = isles.find((q) => q.name === 'rink'), top = I.y, x0 = I.x, z0 = I.z, parts = [], white = C('#f2f4fa'), cool = C('#e6f0ff'), heads = [[-52, -30], [52, -30], [-52, 30], [52, 30]];
    const mat = solid(shared, { stage: 0.2, stageColor: '#dfe8ff', pave: [5, 0.8], lamps: heads.map(([dx, dz]) => [x0 + dx * 0.7, top + 30, z0 + dz * 0.6, 52, '#dfeaff', 1.5]) });
    const ell = (prof, c) => paint(lathe(prof, 72).scale(46.6, 1, 26.6).translate(x0, top, z0), c);
    parts.push(disc(I.r - 1, x0, top, z0, C('#7f8cb8'), 0, 72), paint(new THREE.CircleGeometry(1, 72).rotateX(-PI / 2).scale(46, 1, 26).translate(x0, top + 0.12, z0), C('#cfe6f6')));
    parts.push(box(0.7, 0.03, 51, x0, top + 0.13, z0, red), box(0.7, 0.03, 48, x0 - 15, top + 0.13, z0, blue), box(0.7, 0.03, 48, x0 + 15, top + 0.13, z0, blue),
      paint(new THREE.RingGeometry(5.6, 6.3, 48).rotateX(-PI / 2).translate(x0, top + 0.14, z0), blue));
    parts.push(ell([[1.012, 0], [1.012, 1.4], [1, 1.4], [1, 0]], white), ell([[1.016, 1.4], [1.016, 1.65], [0.996, 1.65], [0.996, 1.4]], red));
    await flush(parts, mat);
    for (const [dx, dz] of heads) { const mx = x0 + dx, mz = z0 + dz, a = Math.atan2(-dx, -dz), s = Math.sin(a), c = Math.cos(a);      // each head looks to the ice's middle
      parts.push(cyl(0.9, 0.45, 34, mx, top, mz, C('#8e97b8'), 0, 8), cyl(1.6, 1.6, 1.2, mx, top, mz, white, 0, 8), beam([mx - 3.6 * c, top + 34, mz + 3.6 * s], [mx + 3.6 * c, top + 34, mz - 3.6 * s], 0.26, C('#8e97b8'), 0, 8));
      for (let i = 0; i < 4; i++) { const u = (i - 1.5) * 2.2, hx = mx + u * c, hz = mz - u * s;      // four round lamp hoods on a cross-arm, turned down to the ice
        parts.push(beam([hx, top + 34, hz], [hx + 1.5 * s, top + 33, hz + 1.5 * c], 0.3, C('#59628a'), 0, 10, 1.05), ball(0.8, hx + 1.2 * s, top + 33.2, hz + 1.2 * c, cool, 1.4, 1));
        lit(still, hx + 1.6 * s, top + 32.95, hz + 1.6 * c, 0.6, cool, 1.6); } }
    for (const s of [-1, 1]) { const gx = x0 + s * 38, bx = gx + s * 2.2, za = z0 - 2.6, zb = z0 + 2.6;
      parts.push(beam([gx, top + 0.1, za], [gx, top + 3.4, za], 0.16, red), beam([gx, top + 0.1, zb], [gx, top + 3.4, zb], 0.16, red), beam([gx, top + 3.4, za], [gx, top + 3.4, zb], 0.16, red),
        beam([gx, top + 3.4, za], [bx, top + 0.2, za], 0.1, white), beam([gx, top + 3.4, zb], [bx, top + 0.2, zb], 0.1, white), beam([bx, top + 0.2, za], [bx, top + 0.2, zb], 0.1, white)); }
    for (const s of [-1, 1]) for (const [xa, xb] of s < 0 ? [[-36, -7], [7, 36]] : [[-34, 34]]) for (let t = 0; t < 6; t++) {
      const zz = z0 + s * (31 + t * 2.2), w = xb - xa, xm = x0 + (xa + xb) / 2;
      parts.push(box(w, 0.9 * (t + 1), 2.2, xm, top, zz, C('#6b74a0')), box(w - 1, 0.28, 0.7, xm, top + 0.9 * (t + 1) + 0.25, zz, t % 2 ? teal : amber)); }
    put(join(parts), mat);
  }
  await ctx.yield();

  // ---- THE HOUSE ISLAND: one tall narrow house (17 by 14 m, walls 34 m, a steep roof to 49 m, a chimney) with lit windows on
  // every face and a lit door to the north; a great round-headed tree with a swing on a bough; a white fence round the lawn; a
  // path of lamps from the door to the island's north-west edge
  {
    const I = isles.find((q) => q.name === 'house'), top = I.y, x0 = I.x, z0 = I.z, parts = [], wall = C('#f2d27a'), glass = C('#ffe2a8'), bark = C('#7a4e36');
    const hx = x0 - 24, hz = z0 + 12, hw = 17, hd = 14, hh = 34, y1 = top + hh, y2 = y1 + 15, xa = hx - hw / 2 - 1.2, xb = hx + hw / 2 + 1.2, za = hz - hd / 2 - 1.2, zb = hz + hd / 2 + 1.2;
    const mat = solid(shared, { stage: 0.24, pave: [3, 0.5], lamps: [[hx, top + 6, hz - 16, 30, '#ffcf8a', 1.1], [hx - 16, top + 8, hz, 26, '#ffcf8a', 0.8], [x0 + 24, top + 5, z0 - 12, 30, '#ffd9a0', 0.9],
      [x0 - 10, top + 6, z0 - 34, 28, '#ffcf8a', 0.8], [hx + 16, top + 8, hz, 26, '#ffcf8a', 0.8], [hx, top + 8, hz + 16, 26, '#ffcf8a', 0.7], [x0 + 40, top + 6, z0 + 20, 30, '#ffcf8a', 0.7], [x0 + 24, top + 30, z0 + 2, 40, '#ffe6b0', 0.5]] });
    parts.push(disc(I.r - 1, x0, top, z0, C('#3f8f52'), 0, 72), box(hw, hh, hd, hx, top, hz, wall), box(hw + 1.2, 1, hd + 1.2, hx, top, hz, cream), box(3, 10, 3, hx + 4.5, y1 + 3, hz + 2, C('#b8644a')));
    parts.push(paint(quad([xa, y1, za], [xa, y1, zb], [hx, y2, zb], [hx, y2, za]), red), paint(quad([xb, y1, zb], [xb, y1, za], [hx, y2, za], [hx, y2, zb]), red),
      paint(tri([xa, y1, za], [hx, y2, za], [xb, y1, za]), wall), paint(tri([xb, y1, zb], [hx, y2, zb], [xa, y1, zb]), wall));
    for (let r = 0; r < 5; r++) for (const s of [-1, 1]) { const wy = top + 4.5 + r * 6;
      for (let c = 0; c < 3; c++) if (!(r === 0 && c === 1 && s < 0)) parts.push(box(2.6, 3.4, 0.4, hx + (c - 1) * 5.2, wy, hz + s * (hd / 2 + 0.05), glass, 1.4 + ((r * 3 + c) % 3) * 0.3));
      for (let c = 0; c < 2; c++) parts.push(box(0.4, 3.4, 2.6, hx + s * (hw / 2 + 0.05), wy, hz + (c - 0.5) * 5.6, glass, 1.4 + ((r + c) % 3) * 0.3)); }
    parts.push(box(3, 5, 0.5, hx, top, hz - hd / 2 - 0.1, bark), box(3, 1.2, 0.5, hx, top + 5.2, hz - hd / 2 - 0.1, glass, 1.8), box(5, 0.6, 3, hx, top, hz - hd / 2 - 1.6, cream));
    await flush(parts, mat);
    // the tree: a trunk, a great round head and two lesser, a bough with the swing (two ropes and a seat), a few small lamps in its head
    const tx = x0 + 24, tz = z0 + 2, rt = stream('tree'), bx = tx - 11, bz = tz - 6, leaf = C('#4fb866');
    parts.push(cyl(2.3, 1.5, 19, tx, top, tz, bark, 0, 10), ball(16, tx, top + 31, tz, leaf, 0.03, 3), ball(9.5, tx - 10, top + 23, tz + 5, C('#3f9f58'), 0.03, 2), ball(8.5, tx + 10, top + 25, tz - 5, C('#5cc470'), 0.03, 2),
      beam([tx, top + 13, tz], [bx - 2, top + 15, bz - 1], 0.75, bark, 0, 6, 0.4));
    for (const s of [-1, 1]) parts.push(beam([bx + s * 1.1, top + 14.6, bz], [bx + s * 1.1, top + 3.2, bz], 0.09, cream, 0, 4));
    parts.push(box(2.8, 0.22, 0.9, bx, top + 3, bz, red));
    for (let k = 0; k < 16; k++) { const a = rt() * TAU, e = rt.range(-0.2, 0.9); lit(still, tx + 16.3 * Math.cos(e) * Math.sin(a), top + 31 + 16.3 * Math.sin(e), tz + 16.3 * Math.cos(e) * Math.cos(a), 0.3, warm); }
    await flush(parts, mat);
    for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; parts.push(box(0.5, 2.3, 0.5, x0 + 62 * Math.sin(a), top, z0 + 62 * Math.cos(a), cream, 0, a)); }
    parts.push(hoop(62, 0.14, x0, top + 0.9, z0, cream, 0, 96, 4), hoop(62, 0.14, x0, top + 1.8, z0, cream, 0, 96, 4));
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { const u = 6 + k * 7.5, lx = hx - 0.55 * u + s * 2.6 * 0.83, lz = hz - hd / 2 - 0.83 * u - s * 2.6 * 0.55;
      parts.push(cyl(0.14, 0.1, 4.2, lx, top, lz, cream, 0, 6)); lit(still, lx, top + 4.5, lz, 0.36, warm, 1.1); }
    put(join(parts), mat);
  }
  await ctx.yield();
  // ---- THE FAR-WEST ISLAND (music): a rank of fifteen golden organ pipes in a fan (74 m in the middle, 39 m at the ends, each
  // leaning 3 degrees more than its neighbour, a lit mouth low on its front, a lamp at its head) and before them three great golden
  // horns, their bells 33 m across and lit within, a ring of lamps round each bell. It faces the ring's platform. Far: bold shapes.
  {
    const I = isles.find((q) => q.name === 'far-west'), top = I.y, x0 = I.x, z0 = I.z, parts = [], horn = C('#f2b838'), bell = [];
    const fl = Math.hypot(PLAT.x - x0, PLAT.z - z0), fx = (PLAT.x - x0) / fl, fz = (PLAT.z - z0) / fl, px = -fz, pz = fx;
    const mat = solid(shared, { stage: 0.42, stageColor: '#ffd08a', pave: [5, 0.6], lamps: [-1, 0, 1].flatMap((k) => [[x0 + px * k * 26 + fx * 30, top + 8, z0 + pz * k * 26 + fz * 30, 40, '#ffc878', 1],
      [x0 + px * k * 26 - fx * 4, top + 10, z0 + pz * k * 26 - fz * 4, 36, '#ffc878', 0.9]]) });
    parts.push(disc(I.r - 1, x0, top, z0, C('#8a6a9c'), 0, 72));
    for (let k = -7; k <= 7; k++) {
      const h = 74 - 5 * Math.abs(k), bx = x0 + px * k * 5.4 - fx * 14, bz = z0 + pz * k * 5.4 - fz * 14, lean = 0.05 * k, ex = px * Math.sin(lean) * h, ez = pz * Math.sin(lean) * h, ey = Math.cos(lean) * h;
      parts.push(beam([bx, top, bz], [bx + ex, top + ey, bz + ez], 2.3, horn, 0.12, 12), beam([bx, top, bz], [bx + ex * 0.06, top + ey * 0.06, bz + ez * 0.06], 2.9, C('#c9892a'), 0.1, 12),
        box(2.4, 3.2, 0.5, bx + fx * 2.25 + ex * 0.14, top + ey * 0.12, bz + fz * 2.25 + ez * 0.14, C('#ffe2a8'), 1.6, Math.atan2(fx, fz)));
      lit(still, bx + ex, top + ey + 0.6, bz + ez, 0.9, warm, 1.2);
    }
    await flush(parts, mat);
    for (let i = 0; i <= 18; i++) bell.push([1.3 + 15 * Math.pow(i / 18, 3.4), 60 * i / 18]);
    for (let k = -1; k <= 1; k++) {
      const q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(fx * 0.5 + px * k * 0.62, 0.78, fz * 0.5 + pz * k * 0.62).normalize());
      const bx = x0 + px * k * 17 + fx * 12, bz = z0 + pz * k * 17 + fz * 12, lay = (g) => g.applyQuaternion(q).translate(bx, top + 1, bz);
      parts.push(paint(lay(lathe(bell, 28, Infinity)), horn, 0.12), paint(lay(new THREE.CircleGeometry(1.3 + 15 * Math.pow(0.86, 3.4), 28).rotateX(-PI / 2).translate(0, 60 * 0.86, 0)), C('#ffd27a'), 1.3));
      for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, v = new THREE.Vector3(16.5 * Math.cos(a), 60, 16.5 * Math.sin(a)).applyQuaternion(q); lit(still, bx + v.x, top + 1 + v.y, bz + v.z, 0.7, warm, 1.2); }
    }
    put(join(parts), mat);
  }
  await ctx.yield();

  // ---- THE FAR-EAST ISLAND (toys): six tall bright blocks (26 to 64 m) with two lit belts each and a lamp on top, a smaller
  // block askew on the tallest, an arch on the ground between two blocks and one on a block, a tower of six rings stacked on a
  // pole (each smaller than the one under it, 45 m of rings) with a golden ball over it. Far: bold shapes.
  {
    const I = isles.find((q) => q.name === 'far-east'), top = I.y, x0 = I.x, z0 = I.z, parts = [], violet = C('#9a6cf0'), green = C('#58c468'), belt = C('#ffe6b8');
    const mat = solid(shared, { stage: 0.42, pave: [5, 0.6], lamps: [[x0 - 16, top + 20, z0 - 40, 44, '#ffd9a0', 1], [x0 - 50, top + 14, z0 - 14, 40, '#ffd9a0', 1], [x0 + 30, top + 16, z0 - 34, 40, '#ffd9a0', 0.9],
      [x0 + 4, top + 10, z0 + 16, 36, '#ffd9a0', 0.9], [x0 + 50, top + 12, z0 + 6, 36, '#ffd9a0', 0.8], [x0 - 30, top + 12, z0 + 50, 36, '#ffd9a0', 0.8]] });
    parts.push(disc(I.r - 1, x0, top, z0, C('#7a6aa8'), 0, 72), box(11, 11, 11, x0 + 10, top + 64, z0 - 40, red, 0.1, 0.5));
    for (const [dx, dz, w, h, d, t, c] of [[-50, 10, 16, 40, 16, 0.2, red], [10, -40, 16, 64, 16, -0.3, gold], [24, 0, 20, 38, 20, 0.5, blue], [46, -24, 14, 52, 14, 0.1, green], [-20, 34, 22, 26, 16, -0.2, violet], [30, 36, 16, 30, 16, 0.4, amber]]) {
      parts.push(box(w, h, d, x0 + dx, top, z0 + dz, c, 0.1, t), box(w + 0.6, 2.6, d + 0.6, x0 + dx, top + h * 0.72, z0 + dz, belt, 1.3, t), box(w + 0.6, 2.6, d + 0.6, x0 + dx, top + h * 0.3, z0 + dz, belt, 1.3, t));
      lit(still, x0 + dx, top + h + 1.2, z0 + dz, 1.0, warm, 1.2);
    }
    await flush(parts, mat);
    const arch = (dx, y, dz, Rr, t, turn, c) => paint(new THREE.TorusGeometry(Rr, t, 10, 28, PI).rotateY(turn).translate(x0 + dx, y, z0 + dz), c, 0.1);
    parts.push(arch(5, top, 38, 13, 3, 0, red), arch(24, top + 38, 0, 7, 2, 0.8, gold));
    const rx = x0 - 16, rz = z0 - 12; let y = top;
    for (let k = 0; k < 6; k++) { const t = 5.2 - 0.5 * k; parts.push(hoop(13 - 1.7 * k, t, rx, y + t, rz, [red, amber, gold, green, blue, violet][k], 0.12, 32, 10)); y += 2 * t * 0.94; }
    parts.push(cyl(1.5, 1.5, y - top + 4, rx, top, rz, cream, 0, 10), ball(3.4, rx, y + 6, rz, gold, 0.5, 2)); lit(still, rx, y + 10, rz, 1.1, warm, 1.3);
    put(join(parts), mat);
  }
  await ctx.yield();

  // ---- the rare deal's sixth island, small and far to the south: a banded beacon 46 m tall, its lamp room steadily lit
  if (rare) {
    const I = isles.find((q) => q.name === 'beacon'), top = I.y, x0 = I.x, z0 = I.z, parts = [disc(I.r - 1, x0, top, z0, C('#8a7ab0'), 0, 48)];
    for (let k = 0; k < 6; k++) parts.push(cyl(6 - k * 0.36, 6 - (k + 1) * 0.36, 6, x0, top + k * 6, z0, k % 2 ? cream : red, 0.06, 20));
    parts.push(cyl(5, 5, 0.8, x0, top + 36, z0, cream, 0, 20), cyl(3, 3, 5, x0, top + 36.8, z0, C('#fff0c8'), 2.2, 16), cyl(3.8, 0.3, 4.5, x0, top + 41.8, z0, red, 0, 16));
    lit(still, x0, top + 39.3, z0, 2.2, C('#fff0c8'), 1.4);
    put(join(parts), solid(shared, { stage: 0.4, pave: [3, 0.7], lamps: [[x0, top + 4, z0 - 12, 20, '#ffcf8a', 1], [x0, top + 4, z0 + 12, 20, '#ffcf8a', 1], [x0 + 12, top + 4, z0, 20, '#ffcf8a', 1], [x0 - 12, top + 4, z0, 20, '#ffcf8a', 1]] }));
  }

  // ---- the lines of light: from each island's short mast (a bright ball at its head) to the pod's shell under the window's sill, one taut ribbon
  {
    const SEG = 24, pos = [], A = [], B = [], PH = [], idx = [], rng = stream('lines'), masts = [], toTower = { 'far-west': 0.5, 'far-east': 0.77, beacon: 0.5 };
    for (const I of isles) {
      const dx0 = T.x - I.x, dz0 = T.z - I.z, l0 = Math.hypot(dx0, dz0), k = (toTower[I.name] || 0) * I.r, off = mastAt[I.name] || [dx0 / l0 * k, dz0 / l0 * k];
      const mx = I.x + off[0], mz = I.z + off[1], dx = mx - T.x, dz = mz - T.z, l = Math.hypot(dx, dz), a = [mx, I.y + 14.6, mz], b = [T.x + dx / l * lineR, lineY, T.z + dz / l * lineR];
      const ph = rng(), base = pos.length / 3;
      for (let i = 0; i <= SEG; i++) for (const sd of [-1, 1]) { pos.push(i / SEG, sd, 0); A.push(...a); B.push(...b); PH.push(ph); }
      for (let i = 0; i < SEG; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      masts.push(cyl(0.45, 0.2, 14, mx, I.y, mz, cream, 0, 8), cyl(1.3, 0.9, 0.8, mx, I.y, mz, cream, 0, 10), ball(0.75, a[0], a[1], a[2], C('#fff0cc'), 1.6, 1));
      lit(still, a[0], a[1], a[2], 0.85, C('#fff0cc'), 1.3); lit(still, b[0], b[1], b[2], 0.5, C('#fff0cc'), 1.2);
      const nb = Math.floor((l - lineR) / 8), bc = { funfair: five, rink: [C('#e6f0ff')], house: [warm], 'far-west': [warm, amber] }[I.name] || five;      // small bulbs along it, 8 m apart
      for (let i = 1; i < nb; i++) { const f = i / nb; lit(still, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, 0.3, bc[i % bc.length], 1.25); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(PH, 1)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, 0, cz), 2000);
    const lines = put(g, lineOfLight(shared, { width: 0.16 })); lines.frustumCulled = false; lines.renderOrder = 2;
    put(join(masts), solid(shared, { stage: 0.5 }));
  }
  await ctx.yield();
  // ---- over the funfair: three slow soft searchlights (each sweeps round in 31 s and nods in 23 s, leaning east: away from the
  // flown line); over the whole pit eleven slow blooms of coloured sparks (each opens once every 10 to 15 s, each for itself)
  {
    const I = isles.find((q) => q.name === 'funfair'), rng = stream('sky-show'), SEG = 10, pos = [], A = [], Q = [], idx = [];
    for (const [x, z, az, tilt, len] of [[I.x + 30, I.z + 40, -0.5, 0.42, 300], [I.x + 48, I.z - 16, 0.25, 0.55, 340], [I.x + 8, I.z + 54, 0.7, 0.48, 280]]) {
      const ph = rng() * TAU, base = pos.length / 3;
      for (let i = 0; i <= SEG; i++) for (const sd of [-1, 1]) { pos.push(i / SEG, sd, 0); A.push(x, I.y + 2.2, z); Q.push(az, tilt, ph, len); }
      for (let i = 0; i < SEG; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      lit(still, x, I.y + 2.4, z, 0.9, C('#fff0d0'), 1.4);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3));
    g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(I.x, 150, I.z), 2000);
    const bm = put(g, beams(shared, {})); bm.frustumCulled = false; bm.renderOrder = 1;
    // eleven blooms spread over the sky: one over each island, two over the tower, four over the pit between them (200 to 285 m up)
    const anchors = [...ISLES.map((q) => [q.x, q.z]), [T.x - 60, T.z + 10], [T.x + 70, T.z - 30], [cx - 170, cz - 110], [cx + 150, cz - 190], [cx - 40, cz + 170], [cx + 130, cz + 60]];
    const NB = anchors.length, NS = Math.round(84 * (detail < 0.6 ? 0.6 : 1)), cC = [], cD = [], cS = [];
    for (let b = 0; b < NB; b++) { const c = [anchors[b][0] + rng.range(-40, 40), rng.range(200, 285), anchors[b][1] + rng.range(-40, 40)], period = rng.range(10, 15), ph = rng(), reach = rng.range(42, 70);
      for (let k = 0; k < NS; k++) { const u = rng() * 2 - 1, a = rng() * TAU, f = rng.range(0.7, 1), sz = rng.range(0.5, 0.9), h = Math.sqrt(Math.max(1 - u * u, 0));
        cC.push(c[0], c[1], c[2], period); cD.push(h * Math.cos(a), u, h * Math.sin(a), reach * f); cS.push(ph, b, sz); } }
    const sm = put(sprites(NB * NS, { aC: [new Float32Array(cC), 4], aD: [new Float32Array(cD), 4], aS: [new Float32Array(cS), 3] }), sparks(shared, {})); sm.frustumCulled = false; sm.renderOrder = 1;
  }
  await ctx.yield();
  // soft glows that read from afar (light in the night's haze): round the wheel, over each island, before the tower's window
  {
    const gl = [], glowMat = lamps(shared, { halo: 1, gain: 0, haloGain: 1 }), gc = { funfair: '#ffb870', rink: '#cfe0ff', house: '#ffcf96', 'far-west': '#ffc870', 'far-east': '#f0b8ff', beacon: '#ffd9a0' };
    lit(gl, WHEEL.x + 2, WHEEL.y, WHEEL.z, WHEEL.r * 1.15, C('#ffb060'), 0.24);
    for (const I of isles) lit(gl, I.x, I.y + 16, I.z, I.r * 0.8, C(gc[I.name] || '#ffcf96'), 0.15);
    lit(gl, T.x, winMid + 16, T.z - podR(winMid) - 2, T.r * 0.62, C('#ffb469'), 0.07);      // high and small: it does not reach down to the ring
    const gm = lampMesh(gl, glowMat); made.push(gm.geometry, glowMat); group.add(gm);
  }
  const sl = lampMesh(still, lampMat); made.push(sl.geometry); group.add(sl);
  const turn = (t) => { const th = t * TAU / 40; wheel.rotation.x = th;
    for (const g of gondolas) g.m.position.set(W.x, W.y + wr * Math.cos(g.a + th), W.z + wr * Math.sin(g.a + th)); };
  turn(shared.uTime.value);
  return { object: group, update(t) { turn(t); }, dispose() { for (const m of made) m.dispose(); } };
}
