// LIGHT FROM THE LEFT (after Johannes Vermeer, 1632 to 1675).
// One white room lit by leaded windows on the left, then out between the open leaves of the casement and across the
// harbour after a strip of sun running along the roofs. World space IS the brief's room space: +z the room's length
// (the course), +x to port (left), y 0 the marble floor. Everything is shaded with the hero's style routines
// (src/parts/light-from-the-left.js): no lights, no fog, no screen pass. The cloud field is a function of place and of u
// alone (570 m times u: pools indoors, strip outdoors, the bank's breaks and the ten cumulus all read it); only the loops
// with no beginning (curtain, leaf, milk, boats, water, figures) run on the clock, each from a phase of its own fork.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, STYLE_GLSL, KIND, Geo, roomMaterial, outdoorMaterial, makeBeads, setStyle, disp, PALETTE, MIXES } from '../parts/light-from-the-left.js';

const scl = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the last straight: 64 degrees to port of +Z, into the bridge arch
const END = [150, -6.5, 96], FWD = [Math.sin(64 * Math.PI / 180), 0, Math.cos(64 * Math.PI / 180)], PORT = [FWD[2], 0, -FWD[0]];
const along = (d, side = 0, y = END[1]) => [END[0] - FWD[0] * d + PORT[0] * side, y, END[2] - FWD[2] * d + PORT[2] * side];

export default {
  id: 'light-from-the-left',
  name: 'Light from the Left',
  category: 'artists',
  placeKind: 'interior',
  after: 'Johannes Vermeer, 1632 to 1675',
  weirdness: 0.2,
  media: ['interior', 'air', 'water'],

  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1)), vary = ctx.vary || {};
    // ---- every random fork of the world, in one fixed list, each named for its thing (nothing else draws from ctx.rng) ----
    const F = {};
    for (const thing of ['weather hour cast and cloths', 'casement table and leaves', 'tapestry curtain', 'lion-head chair', 'viol', 'bread on the far table', 'woman at the far window',
      'houses of the town', 'houses along the far wall', 'limes', 'town dots', 'sand grains', 'figures on the sand', 'herring hulls', 'barges', 'rowing boats', 'gate and bridge dots', 'back row and nave', 'piles']) F[thing] = ctx.rng.fork('light-from-the-left: ' + thing);
    for (const thing of ['figures by the gates', 'limes along the far wall', 'doubles after rain', 'water tremble', 'wall waver', 'marble and glass shimmer', 'crown stir']) F[thing] = ctx.core.makeRng(ctx.core.hashSeed(thing + ':' + ctx.seed));
    // ---- the edition ----
    const rv = F['weather hour cast and cloths'];
    let weather = rv.pick(['cloud', 'cloud', 'cloud', 'rain', 'rain', 'pearl']);
    if (vary.hour === 'dawn') weather = 'pearl';
    const golden = vary.hour === 'golden' ? 0.7 : (rv.chance(0.2) ? 0.6 : 0);
    const cast = rv.pick(['milk', 'milk', 'lace', 'casement']);
    const altCloth = rv.chance(0.4);                       // blue and ochre carpet with a red chair
    const rare = !!vary.rare;                              // the shower
    const C = { white: disp(PALETTE[0]), lemon: disp(PALETTE[1]), ultra: disp(PALETTE[2]), shade: disp(PALETTE[3]), red: disp(PALETTE[4]), sky: disp(PALETTE[5]), black: disp(PALETTE[6]),
      slate: disp(MIXES.slate), tile: disp(MIXES.tile), ochre: disp(MIXES.ochre), sand: disp(MIXES.sand), green: disp(MIXES.green), umber: disp(MIXES.umber), stone: disp('#BDB7A6') };

    const hero = await buildHero({ ...ctx, rng: F['casement table and leaves'] }, { detail, weather, golden, exposure: 1, vista: false, sky: true, floor: false, wallZ0: 18, wallZ1: 40, outY0: -10 });
    hero.object.position.set(9, 0, 29); hero.object.rotation.y = -Math.PI / 2; scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    await ctx.yield();
    const room = hero.room, U = hero.uniforms;             // this build's own set of uniforms: every material of this build shares it, no other build does
    U.uCloth.value = altCloth ? 1 : 0;
    setStyle(U, weather === 'rain' ? { stripLo: 0.7, stripHi: 0.84 } : weather === 'pearl' ? { stripLo: 0.76, stripHi: 0.88 } : { stripLo: 0.62, stripHi: 0.82 });
    U.uOccMin.value[2].set(-9, 0, 1); U.uOccMax.value[2].set(-4.1, 10.5, 6);
    if (rare) setStyle(U, weather === 'cloud' ? { stripLo: 0.1, stripHi: 0.32 } : weather === 'rain' ? { stripLo: 0.24, stripHi: 0.44 } : { stripLo: 0.36, stripHi: 0.54 });   // the strip that follows the shower is twice as wide
    // the slate bank's place: it reaches behind the town, so slate stands above the roofs from every eye on the harbour: its far edge is typed 36 m beyond the town's far edge (the back row and the nave's back wall at x 264; 264 + 36 = 300); the rim's line stands 11 m short of that, wandering 13 m either way; its belly clear of the tower;
    // after rain it hangs lower and reaches further (335) over wet roofs and quay; the pearl overcast reaches further still (350): settings of the weather; pearl is one pale overcast whose pools are faint and slow
    if (weather === 'rain') U.uBank.value.set(335, 105, 1, 0); else if (weather === 'pearl') U.uBank.value.set(350, 112, 0, 1); else U.uBank.value.set(300, 112, 0, 0);
    U.uPool.value.set(weather === 'pearl' ? 0.62 : 0.22, weather === 'pearl' ? 2.5 : 1);
    U.uPhase.value.set(F['water tremble']() * 40, F['wall waver']() * 40, F['marble and glass shimmer']() * 40, F['crown stir']() * 40);

    // ---- the path: 190 m, the brief's course ----
    const path = makePath([
      [-2, 3.3, 0], [-1.7, 3.3, 3.5], [-0.2, 3.3, 8.5], [1.5, 3.3, 14], [1.5, 3.3, 20], [4.6, 4.0, 24.2], [9.9, 4.8, 29],
      [19.5, 2.9, 34.3], [32, -3.2, 39.6], along(117, 0, -7), along(95, 0, -7), along(70, 0, -6.6), along(35), along(0),
    ]);

    const S = { ctx, scene, room, U, hero, path, detail, vary, weather, golden, cast, altCloth, rare, C, F,
      mRoom: hero.materials.room, mOut: hero.materials.outdoor, mPane: hero.materials.pane, mBead: hero.materials.bead,
      beads: [], tick: [], add(geo, mat, parent) { const m = new THREE.Mesh(geo.build ? geo.build() : geo, mat); m.frustumCulled = false; (parent || room).add(m); return m; } };
    await buildShell(S); await ctx.yield();
    await buildFurniture(S); await ctx.yield();
    await buildWoman(S); await ctx.yield();
    await buildTown(S); await ctx.yield();
    await buildHarbour(S); await ctx.yield();
    await buildBridge(S); await ctx.yield();
    room.add(makeBeads(S.beads, S.mBead));
    await ctx.yield();

    // gaze: indoors within 20 degrees of the room's length and a little raised (the seated eye, horizon at 45 percent);
    // outdoors raised so the horizon lies at 30 percent and the slate cloud holds the top
    const _g = new THREE.Vector3();
    const pois = [
      { at: [-1, 6.4, 54], from: 0, to: 0.115, weight: 0.3, fade: 0.2 },
      { at: [8.6, 4.8, 27.5], from: 0.015, to: 0.118, weight: 0.3, fade: 0.3 },                                       // the hero: the lit casement over the table's far end, the jug against the leaf
      { at: [26, -10, 80], from: 0.165, to: 0.215, weight: 0.28, fade: 0.03 },                                        // the break-out: down to the sand and its figures
      { at: (time, u) => path.pointAt(u, _g).set(_g.x + FWD[0] * 100, _g.y + 45, _g.z + FWD[2] * 100), from: 0.23, to: 0.985, weight: 0.42, fade: 0.12 },
      { at: [190, 150, 130], from: 0.2, to: 0.38, weight: 0.28, fade: 0.4 },                                          // through the dive the gaze is held up on the town's sky: horizon low, the slate cloud on top
      { at: [END[0] + FWD[0] * 15, 14, END[2] + FWD[2] * 15], from: 0.8, to: 0.985, weight: 0.13, fade: 0.08 },      // the yellow wall's window over the arch
    ];
    const pace = (u) => {
      let p = 0.45 - 0.09 * sstep(0.085, 0.105, u) * (1 - sstep(0.145, 0.165, u));
      p += (1.6 - p) * sstep(0.165, 0.215, u);
      return p + (1 - p) * sstep(0.86, 0.91, u);
    };
    // the opening holds the far side of the arch (buildBridge) until the last metres before the bridge; the portal is that opening
    const portal = { shape: 'arch', width: 12, height: 9, color: '#E9E6D8', glow: 0, halo: false, blendDistance: 25, revealDistance: 60, veil: '#D8CFA4' };

    return {
      scene, path, duration: 40, pace,
      camera: { near: 0.2, far: 4000, lookAhead: 8, sway: 0, bank: 0.45, nearThrough: 0.3 },
      pois, portal,
      post: { exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 2 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);                     // the cloud field: 570 m times u (hero.update writes it), a gap on z 96 at u 1
        hero.update(dt, time, camera);
        const live = ctx.portalView && ctx.portalView.live ? 1 : 0, L = U.uLive;
        L.value += (live - L.value) * Math.min(1, dt * 1.5);      // the far side of the arch gives way only to a picture that is there
        for (let i = 0; i < S.tick.length; i++) S.tick[i](time, u, camera);
      },
      dispose() {},
    };
  },
};

// ------------------------------------------------------------------------------------------------------------
// a quad whose lit side is made to face `want` (so nobody has to think about winding); uv follows the corners
function Q(g, pts, want, col, kind = 0, melt = 0, uv = null) {
  const [a, b, , d] = pts, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { pts = [pts[0], pts[3], pts[2], pts[1]]; if (uv) uv = [uv[0], uv[1], uv[6], uv[7], uv[4], uv[5], uv[2], uv[3]]; }
  g.quad(pts[0], pts[1], pts[2], pts[3], col, kind, melt, uv);
}
// wall pieces in the planes x = const and z = const, uv in metres (for the tile skirting)
const wallX = (g, x, nx, za, zb, ya, yb, kind, col = [1, 1, 1]) => Q(g, [[x, ya, za], [x, ya, zb], [x, yb, zb], [x, yb, za]], [nx, 0, 0], col, kind, 0, [za, ya, zb, ya, zb, yb, za, yb]);
const wallZ = (g, z, nz, xa, xb, ya, yb, kind, col = [1, 1, 1]) => Q(g, [[xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z]], [0, 0, nz], col, kind, 0, [xa, ya, xb, ya, xb, yb, xa, yb]);

// THE ROOM: z -6 to 54 (floor, ceiling and side walls run on behind the entry so the picture in the previous
// portal has a floor under it), x -9 to 9, 11 m high; three casements in the port wall; the back wall closed.
async function buildShell(S) {
  const { C } = S, K = KIND, g = new Geo(), gP = new Geo(), Z0 = -40, Z1 = 54, frame = [0.2, 0.165, 0.14];
  g.quad([-9, 0, Z0], [-9, 0, Z1], [9, 0, Z1], [9, 0, Z0], [1, 1, 1], K.floor);
  // ceiling boards and umber beams across the room
  Q(g, [[-9, 11, Z0], [9, 11, Z0], [9, 11, Z1], [-9, 11, Z1]], [0, -1, 0], C.umber, K.ceil, 0, null);   // the umber beams (every 5.75 m) are painted in the ceiling's own material, soft-edged
  // starboard wall, back wall: plaster over a blue and white tile skirting with an umber rail
  wallX(g, -9, 1, Z0, Z1, 0, 0.44, K.tiles); wallX(g, -9, 1, Z0, Z1, 0.44, 11, K.plaster);
  wallZ(g, 54, -1, -9, 9, 0, 0.44, K.tiles); wallZ(g, 54, -1, -9, 9, 0.44, 11, K.plaster);
  g.box(-8.97, 0.47, (Z0 + Z1) / 2, 0.06, 0.06, Z1 - Z0, C.umber, { kind: K.wood, bevel: 0.02, melt: 0.3 });
  g.box(0, 0.47, 53.97, 18, 0.06, 0.06, C.umber, { kind: K.wood, bevel: 0.02, melt: 0.3 });
  // port wall on both sides of the hero's piece (z 18..40), with the first and the far casement
  const openLight = S.cast === 'casement';
  const port = (zA, zB, w0, w1) => {
    wallX(g, 9, -1, zA, zB, 0, 0.44, K.tiles); wallX(g, 9, -1, zA, zB, 0.44, 2, K.plaster); wallX(g, 9, -1, zA, zB, 10, 11, K.plaster);
    wallX(g, 9, -1, zA, w0, 2, 10, K.plaster); wallX(g, 9, -1, w1, zB, 2, 10, K.plaster);
    g.box(8.97, 0.47, (zA + zB) / 2, 0.06, 0.06, zB - zA, C.umber, { kind: K.wood, bevel: 0.02, melt: 0.3 });
    // reveals, a sill board, the oak cross and four milky leaded lights
    const fx = 9.95, zm = (w0 + w1) / 2;
    Q(g, [[9, 2, w0], [fx, 2, w0], [fx, 10, w0], [9, 10, w0]], [0, 0, 1], [1, 1, 1], K.plaster);
    Q(g, [[9, 2, w1], [fx, 2, w1], [fx, 10, w1], [9, 10, w1]], [0, 0, -1], [1, 1, 1], K.plaster);
    Q(g, [[9, 10, w0], [fx, 10, w0], [fx, 10, w1], [9, 10, w1]], [0, -1, 0], [1, 1, 1], K.plaster);
    g.box(9.35, 1.94, zm, 1.15, 0.12, w1 - w0 + 0.3, C.umber, { kind: K.wood, bevel: 0.035, melt: 0.6 });
    const fo = { kind: K.wood, bevel: 0.05, melt: 0.3 };
    for (const z of [w0 + 0.2, w1 - 0.2]) g.box(fx, 6, z, 0.34, 8, 0.4, frame, fo);
    g.box(fx, 9.83, zm, 0.34, 0.34, w1 - w0, frame, fo); g.box(fx, 2.11, zm, 0.36, 0.22, w1 - w0, frame, fo);
    g.box(fx, 8.18, zm, 0.4, 0.36, w1 - w0 - 0.6, frame, fo); g.box(fx, 6, zm, 0.34, 7.6, 0.34, frame, fo);
    const lights = [[w0 + 0.4, zm - 0.17, 2.22, 8.0], [zm + 0.17, w1 - 0.4, 2.22, 8.0], [w0 + 0.4, zm - 0.17, 8.36, 9.66], [zm + 0.17, w1 - 0.4, 8.36, 9.66]];
    lights.forEach(([za, zb, ya, yb], i) => {
      if (openLight && w0 > 40 && i === 1) return;                    // the woman holds this leaf open (buildWoman hangs it)
      Q(gP, [[fx, ya, za], [fx, ya, zb], [fx, yb, zb], [fx, yb, za]], [-1, 0, 0], [1, 1, 1], K.pane, 0, [0, 0, zb - za, 0, zb - za, yb - ya, 0, yb - ya]);
      for (let y = ya + 1.9; y < yb - 0.5; y += 1.9) g.box(fx - 0.06, y, (za + zb) / 2, 0.05, 0.05, zb - za, C.black, { bevel: 0.02, melt: 0.3 });
    });
    // the wall's thickness seen through an open light, and the brick outside
    Q(g, [[10.3, 2, w0], [fx, 2, w0], [fx, 10, w0], [10.3, 10, w0]], [0, 0, 1], [1, 1, 1], K.plaster);
  };
  port(Z0, 18, 3, 12); port(40, Z1, 45, 53);
  await S.ctx.yield();
  // THE MAP, 9 m wide on the closed back wall: blank land shapes, no lettering; black rods with ball ends
  const nz = S.ctx.noise, mx0 = 3.6, mw = 9, my0 = 3.5, mh = 6.1, parch = mixc(C.white, C.ochre, 0.3);
  g.grid(54, 36, (u, v) => [mx0 - mw * u, my0 + mh * v, 53.86 - 0.06 * Math.sin(v * Math.PI) - 0.025 * Math.sin(u * 17 + v * 3)], (u, v) => {
    const e = Math.min(u, 1 - u) * mw, f = Math.min(v, 1 - v) * mh, edge = Math.min(e, f);
    if (edge < 0.16) return scl(parch, 0.82);
    if (edge < 0.62) return mixc(parch, C.ochre, 0.32 + 0.25 * (Math.sin(u * 60) * Math.sin(v * 40) > 0.3 ? 1 : 0));   // a border of cartouches, blank
    if (edge < 0.7) return scl(C.umber, 1.2);
    const land = nz.fbm2(u * 3.1 + 7, v * 2.2 + 3, 4) + 0.35 * Math.sin(u * 4.4 + 1) - 0.25 * (v - 0.5);
    const coast = Math.abs(land - 0.08);
    let c = land > 0.08 ? mixc(parch, C.ochre, 0.42 + 0.2 * nz.n2(u * 9, v * 7)) : mixc(parch, C.shade, 0.3);
    if (coast < 0.035) c = mixc(c, C.umber, 0.6);
    return scl(c, 0.97 + 0.06 * nz.n2(u * 23, v * 19));
  }, { melt: 0 });
  for (const y of [my0 - 0.1, my0 + mh + 0.1]) {
    g.box(mx0 - mw / 2, y, 53.78, mw + 0.5, 0.2, 0.2, C.black, { bevel: 0.08, melt: 0.4 });
    for (const x of [mx0 + 0.35, mx0 - mw - 0.35]) g.lathe(x, y - 0.19, 53.78, [[0.02, 0], [0.15, 0.07], [0.19, 0.19], [0.15, 0.31], [0.02, 0.38]], 10, C.black, { melt: 0.5 });
  }
  // the ebony-framed picture, a dim blur
  const px = -6.9, py = 6.3, pw = 2.5, phh = 3.1;
  g.box(px, py, 53.86, pw + 0.7, phh + 0.7, 0.24, scl(C.black, 1.25), { bevel: 0.1, melt: 0.35 });
  g.grid(10, 12, (u, v) => [px + pw / 2 - pw * u, py - phh / 2 + phh * v, 53.72], (u, v) => {
    const t = nz.fbm2(u * 1.7 + 30, v * 1.5 + 11, 3);
    return scl(mixc(mixc(C.umber, C.slate, 0.5 + 0.5 * t), C.ochre, sstep(0.1, 0.5, t) * 0.35 * (1 - v)), 1.15);
  }, { melt: 0 });
  // the hand's faults, on the window wall's bare pier between the first casement and the hero's: one nail and its
  // shadow falling away from the nearer window, one hole where another was, with its own soft shade
  g.box(8.94, 5.7, 15.3, 0.12, 0.05, 0.05, scl(C.black, 1.6), { bevel: 0.015, melt: 0.3 });
  g.grid(6, 2, (u, v) => [8.985, 5.7 - 0.4 * u + (v - 0.5) * 0.045, 15.33 + 0.32 * u + (v - 0.5) * 0.056], (u, v) => mixc(C.shade, C.white, 0.2 + 0.75 * u + 0.6 * Math.abs(v - 0.5)), { melt: 0, kind: 0 });
  g.grid(10, 2, (u, v) => { const a = u * Math.PI * 2, r = 0.065 * v; return [8.985, 4.5 + Math.sin(a) * r * 1.2 - 0.015 * v, 20.7 + Math.cos(a) * r]; }, (u, v) => (v < 0.75 ? mixc(C.umber, C.shade, 0.25 + 0.4 * v) : mixc(C.shade, C.white, 0.5)), { melt: 0, flip: true });
  await S.ctx.yield();
  S.add(g, S.mRoom); S.add(gP, S.mPane);
}

// ------------------------------------------------------------------------------------------------------------
// The cropped near edge and the things of the room: tapestry curtain, lion-head chair, viol, the far table.
async function buildFurniture(S) {
  const { C, detail } = S, K = KIND, g = new Geo(), nz = S.ctx.noise;
  let rng = S.F['tapestry curtain'];
  const bead = (list, P, N, col, base, size, swell = 1) => list.push([P[0] + N[0] * 0.03, P[1] + N[1] * 0.03, P[2] + N[2] * 0.03, N[0], N[1], N[2], col[0], col[1], col[2], base[0], base[1], base[2], size, swell]);
  const xfP = (m, P) => { const e = m.elements; return [e[0] * P[0] + e[4] * P[1] + e[8] * P[2] + e[12], e[1] * P[0] + e[5] * P[1] + e[9] * P[2] + e[13], e[2] * P[0] + e[6] * P[1] + e[10] * P[2] + e[14]]; };
  const xfN = (m, N) => { const e = m.elements; return [e[0] * N[0] + e[4] * N[1] + e[8] * N[2], e[1] * N[0] + e[5] * N[1] + e[9] * N[2], e[2] * N[0] + e[6] * N[1] + e[10] * N[2]]; };

  // THE CURTAIN: a tapestry drawn back against the starboard wall, z 1..6, x -9..-4, in deep soft folds. Local to its rail.
  const piv = new THREE.Group(); piv.position.set(-9, 10.5, 1.2); S.room.add(piv);
  const gc = new Geo(), ph = rng() * 6.28, cb = [];
  const cur = (u, v) => {
    const s = u * 6.9, hang = 1 - v, gather = 0.86 + 0.14 * hang;                    // v 0 the hem, 1 the rail
    const fold = 0.34 * Math.sin(s * 5.2 + ph + 0.5 * Math.sin(v * 3.1)) * (0.45 + 0.55 * hang) + 0.12 * Math.sin(s * 11.3 + ph * 2. + v * 2.);
    const along = s * gather + 0.2 * Math.sin(v * 2.4 + ph) * hang;
    return [along * 0.72 + fold * 0.69, -10.3 * hang + 0.05 * Math.sin(s * 5.2 + ph) * (v < 0.02 ? 1 : 0), along * 0.69 - fold * 0.72];
  };
  const tap = (u, v) => {                                                           // verdure: dark blue and umber leaves, ochre fruit, a red-brown border
    const a = nz.fbm2(u * 7 + 3, v * 15 + 1, 3), b = nz.n2(u * 19 + 9, v * 37);
    let c = mixc(scl(C.ultra, 0.62), scl(C.umber, 0.8), sstep(-0.25, 0.35, a));
    c = mixc(c, scl(C.green, 0.75), sstep(0.25, 0.6, b) * 0.6);
    if (b < -0.52) c = mixc(c, C.ochre, 0.7);
    if (u > 0.95 || v < 0.03) c = mixc(c, scl(C.ochre, 0.6), 0.55);
    return c;
  };
  const nu = Math.round(64 * detail), nv = Math.round(40 * detail);
  const cg = gc.grid(nu, nv, cur, tap, { melt: 0.9 });
  for (let i = 0, n = Math.round(260 * detail); i < n; i++) {                          // swollen pointilles on the fold crests: his out-of-focus foreground
    const q = Math.floor(rng() * (nv + 1)) * (nu + 1) + Math.floor((0.25 + 0.75 * rng()) * nu), P = cg.pts[q], N = cg.nrm[q];
    const f = N[0] * 0.69 - N[2] * 0.72; if (Math.abs(f) > 0.3) bead(cb, P, f > 0 ? N : [-N[0], -N[1], -N[2]], (rng() < 0.4 || rng() < 0.5) ? C.lemon : C.white, scl(C.umber, 0.8), 0.05 + rng() * 0.03, 1.3 + 0.8 * rng());
  }
  const curtain = new THREE.Mesh(gc.build(), roomMaterial(S.U, { side: THREE.DoubleSide })); curtain.frustumCulled = false; piv.add(curtain);
  piv.add(makeBeads(cb, S.mBead));
  const cp = [rng() * 6.28, rng() * 6.28, rng() * 6.28, rng() * 6.28];
  S.tick.push((time) => { piv.rotation.y = 0.014 * Math.sin(time * 0.55 + cp[0]) + 0.006 * Math.sin(time * 1.27 + cp[1]); piv.scale.set(1 + 0.012 * Math.sin(time * 0.43 + cp[2]), 1, 1 + 0.03 * Math.sin(time * 0.61 + cp[3])); });
  await S.ctx.yield();

  rng = S.F['lion-head chair'];
  // THE CHAIR at (-3, 0, 10): Spanish chair, velvet seat and back, brass studs, lion-head finials; turned a little to the window
  const velvet = S.altCloth ? scl(C.red, 0.92) : C.ultra, brass = C.ochre, wood = C.umber, wo = { kind: K.wood, bevel: 0.04, melt: 0.7 };
  const mc = new THREE.Matrix4().makeRotationY(0.38).setPosition(-3, 0, 10); g.xf = mc;       // its back to the door, as he sets his foreground chairs: velvet panel, stud rows and lion heads face the entry
  // a solid piece of furniture: square back posts, turned front legs, deep rails and stretchers (all edges rounded
  // over a hand's width so they melt), a padded velvet seat, a velvet back panel between the posts
  const wr = { kind: K.wood, bevel: 0.11, melt: 0.85 }, turned = [[0.2, 0], [0.24, 0.08], [0.17, 0.2], [0.15, 0.34], [0.21, 0.5], [0.25, 0.66], [0.2, 0.82], [0.15, 0.94], [0.2, 1.04], [0.22, 1.12]];
  for (const x of [-0.84, 0.84]) {
    g.box(x, 1.68, -0.76, 0.38, 3.36, 0.38, wood, wr);                                 // back post, floor to finial
    g.lathe(x, 0, 0.74, turned, 12, wood, { kind: K.wood, melt: 0.85 }); g.box(x, 1.36, 0.74, 0.4, 0.52, 0.4, wood, wr);   // turned front leg under a square block
    g.box(x, 0.42, 0, 0.22, 0.3, 1.36, wood, wr); g.box(x, 1.32, 0, 0.3, 0.4, 1.3, wood, wr);                    // side stretcher, side rail
  }
  g.box(0, 0.66, 0.74, 1.5, 0.46, 0.18, wood, wr); g.box(0, 1.32, 0.74, 1.5, 0.4, 0.3, wood, wr);               // the broad front stretcher, front rail
  g.box(0, 0.42, -0.76, 1.5, 0.3, 0.2, wood, wr); g.box(0, 1.32, -0.76, 1.5, 0.4, 0.3, wood, wr); g.box(0, 3.24, -0.76, 1.4, 0.26, 0.26, wood, wr);
  g.box(0, 1.52, 0, 1.92, 0.36, 1.74, scl(velvet, 0.8), { bevel: 0.14, melt: 0.85 });
  g.grid(12, 10, (u, v) => { const x = (u - 0.5) * 1.84, z = (v - 0.5) * 1.66, e = Math.min(1, 6 * Math.min(u, 1 - u, v, 1 - v)); return [x, 1.56 + 0.2 * Math.sqrt(e) + 0.05 * Math.sin(u * 5 + v * 3), z]; }, (u, v) => scl(velvet, 0.92 + 0.14 * Math.sin(u * 9 + v * 7)), { melt: 0.85, flip: true });
  g.box(0, 2.62, -0.76, 1.36, 1.2, 0.24, scl(velvet, 0.86), { bevel: 0.1, melt: 0.85 });                          // the back panel, velvet on both faces
  for (const sgn of [-1, 1]) g.grid(8, 6, (u, v) => [(u - 0.5) * 1.3, 2.06 + v * 1.12, -0.76 + sgn * (0.125 + 0.06 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI))], (u, v) => scl(velvet, 0.94 + 0.1 * Math.sin(u * 7 + v * 5)), { melt: 0.85, flip: sgn < 0 });
  for (const x of [-0.84, 0.84]) {                                                    // lion heads: carved finials that widen from the posts, muzzle forward, mane in lumps
    g.lathe(x, 3.34, -0.76, [[0.2, 0], [0.23, 0.06], [0.18, 0.13], [0.22, 0.22], [0.27, 0.34], [0.26, 0.46], [0.19, 0.56], [0.08, 0.62], [0.0, 0.63]], 12, mixc(wood, brass, 0.14), { kind: K.wood, melt: 0.85, squash: (a, y) => 1 + 0.08 * Math.sin(a * 5 + y * 17) + (y > 0.2 ? 0.2 * Math.max(0, Math.sin(a)) : 0) });
    for (let i = 0; i < 12; i++) { const a = rng() * 6.28, y = 3.58 + rng() * 0.3; bead(S.beads, xfP(mc, [x + Math.cos(a) * 0.26, y, -0.76 + Math.sin(a) * 0.26]), xfN(mc, [Math.cos(a), 0.3, Math.sin(a)]), rng() < 0.6 ? C.lemon : C.white, brass, 0.045 + rng() * 0.03, 1.3 + 0.6 * rng()); }
  }
  // brass studs in rows along the edges of the velvet (a row a little out of true, each stud a swollen pointille)
  const stud = (P, N) => bead(S.beads, xfP(mc, P), xfN(mc, N), rng() < 0.7 ? C.lemon : C.white, brass, 0.05 + rng() * 0.025, 1.3 + 0.6 * rng());
  const row = (A, B, N, pitch = 0.17) => { const len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(2, Math.round(len / pitch));
    for (let i = 0; i <= n; i++) { const t = (i + (rng() - 0.5) * 0.3) / n; stud([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + (rng() - 0.5) * 0.02, A[2] + (B[2] - A[2]) * t], N); } };
  for (const sgn of [-1, 1]) { const z = -0.76 + sgn * 0.15, N = [0, 0.1, sgn];
    row([-0.62, 2.1, z], [0.62, 2.1, z], N); row([-0.62, 3.14, z], [0.62, 3.14, z], N); row([-0.62, 2.27, z], [-0.62, 2.97, z], N); row([0.62, 2.27, z], [0.62, 2.97, z], N); }
  row([-0.92, 1.45, 0.9], [0.92, 1.45, 0.9], [0, 0.3, 1]); row([-0.92, 1.45, -0.9], [0.92, 1.45, -0.9], [0, 0.3, -1]);
  for (const sgn of [-1, 1]) row([sgn * 0.98, 1.45, -0.72], [sgn * 0.98, 1.45, 0.72], [sgn, 0.3, 0]);
  await S.ctx.yield();

  rng = S.F.viol;
  // THE VIOL on the floor at (-3, 0, 16), on its back, the neck toward the far wall
  const mv = new THREE.Matrix4().makeRotationY(-1.823).setPosition(-2.71, 0, 14.88); g.xf = mv;
  const top = mixc(C.umber, C.ochre, 0.5), Lb = 2.3, wid = (t) => 0.5 * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 0.7) * (1 - 0.3 * Math.exp(-(((t - 0.55) / 0.11) ** 2))) * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0.0, t)) * 0.98 + 0.03)) + 0.02) * 1.7;
  const belly = g.grid(26, 8, (u, v) => { const w = wid(u), s = (v - 0.5) * 2; return [u * Lb, 0.42 + 0.1 * Math.cos(s * 1.57) * Math.min(1, w * 3), s * w]; }, (u, v) => scl(top, 0.95 + 0.12 * Math.sin(v * 40)), { kind: K.wood, melt: 0.8, flip: true });
  for (const sgn of [-1, 1]) g.grid(26, 1, (u, v) => [u * Lb, 0.02 + v * 0.4, sgn * wid(u)], scl(C.umber, 0.9), { kind: K.wood, melt: 0.8, flip: sgn < 0 });
  g.box(Lb + 0.75, 0.56, 0, 1.7, 0.1, 0.2, scl(C.black, 1.3), { bevel: 0.03, melt: 0.6 });                              // fingerboard and neck
  g.box(Lb + 0.7, 0.44, 0, 1.5, 0.16, 0.14, C.umber, wo);
  g.box(Lb + 1.75, 0.5, 0, 0.5, 0.2, 0.2, C.umber, wo); g.lathe(Lb + 2.05, 0.38, 0, [[0.02, 0], [0.13, 0.06], [0.16, 0.16], [0.1, 0.27], [0.02, 0.3]], 10, C.umber, { kind: K.wood, melt: 0.8 });
  for (const [dx, dz] of [[1.6, 0.2], [1.75, -0.2], [1.9, 0.2], [1.72, 0.2]]) g.box(Lb + dx, 0.5, dz, 0.05, 0.05, 0.22, scl(C.black, 1.3), { bevel: 0.02, melt: 0.5 });
  g.box(0.75, 0.62, 0, 0.07, 0.2, 0.52, mixc(top, C.white, 0.3), { bevel: 0.02, melt: 0.6 });                            // bridge
  g.box(0.25, 0.56, 0, 0.5, 0.05, 0.14, scl(C.black, 1.3), { bevel: 0.02, melt: 0.6 });                                  // tailpiece
  for (const sgn of [-1, 1]) g.box(1.02, 0.515, sgn * 0.3, 0.52, 0.03, 0.06, scl(C.black, 1.4), { bevel: 0.012, melt: 0.5 });   // the sound holes, as two dark dabs
  g.box(1.6, 0.635, 0, 2.6, 0.012, 0.13, mixc(top, C.white, 0.42), { bevel: 0.005, melt: 0.4 });                         // the strings, one pale band
  for (let i = 0, n = Math.round(46 * detail); i < n; i++) { const q = Math.floor(rng() * 9) * 27 + Math.floor(rng() * 27); const P = belly.pts[q], N = belly.nrm[q]; if (Math.abs(P[2]) > 0.3 || rng() < 0.2) bead(S.beads, xfP(mv, P), xfN(mv, N), rng() < 0.5 ? C.lemon : C.white, top, 0.045 + rng() * 0.04, 1); }
  g.xf = null;

  await S.ctx.yield();
  rng = S.F['bread on the far table'];
  // THE FAR TABLE, hard against the closed wall beside the far window (the woman works at it 22 m or more from the
  // route, so it stands as far up the room as the room goes): oak, a blue cloth, bread in a basket with a beaded crust
  const tx = S.cast === 'casement' ? 2.5 : 5.9, tz = 52.5, tt = 2.3;
  g.box(tx, tt - 0.09, tz, 2.9, 0.18, 2.4, C.umber, wo);
  for (const [dx, dz] of [[-1.25, -1], [1.25, -1], [-1.25, 1], [1.25, 1]]) g.box(tx + dx, (tt - 0.18) / 2, tz + dz, 0.2, tt - 0.18, 0.2, C.umber, wo);
  g.grid(18, 14, (u, v) => { const a = (u - 0.5) * 3.3, b = (v - 0.5) * 2.8, ox = Math.max(0, Math.abs(a) - 1.47), oz = Math.max(0, Math.abs(b) - 1.22), d = Math.max(ox, oz);
    return [tx + Math.sign(a) * Math.min(Math.abs(a), 1.47 + 0.08 * Math.min(1, d * 6)) + 0.04 * Math.sin(b * 6) * (ox > 0 ? 1 : 0), tt + 0.03 - d * 4.2 + 0.02 * Math.sin(a * 5 + b * 4), tz + Math.sign(b) * Math.min(Math.abs(b), 1.22 + 0.08 * Math.min(1, d * 6)) + 0.04 * Math.sin(a * 6) * (oz > 0 ? 1 : 0)]; },
  (u, v) => scl(S.altCloth ? mixc(C.green, C.ultra, 0.5) : C.ultra, 0.95 + 0.1 * Math.sin(u * 30 + v * 17)), { melt: 0.8, flip: true });
  const bx = tx - 0.6, bz = tz - 0.55, by = tt + 0.04;
  const bg = g.lathe(bx, by, bz, [[0.02, 0.02], [0.3, 0.02], [0.4, 0.14], [0.5, 0.33], [0.54, 0.4], [0.5, 0.42]], 24, (u, v) => scl(C.ochre, 0.8 + 0.25 * (Math.sin(u * 75) > 0 ? 1 : 0.4)), { melt: 0.7 });
  const lf = g.grid(12, 8, (u, v) => { const a = u * 6.283, b = (v - 0.5) * Math.PI; return [bx + Math.cos(a) * Math.cos(b) * 0.4, by + 0.44 + Math.sin(b) * 0.2 * (b < 0 ? 0.5 : 1), bz + Math.sin(a) * Math.cos(b) * 0.33]; }, mixc(disp('#8A5A2C'), C.ochre, 0.4), { melt: 0.75, flip: true });
  for (let i = 0, n = Math.round(110 * detail); i < n; i++) { const r = rng() < 0.5, q = r ? (4 + Math.floor(rng() * 2)) * 25 + Math.floor(rng() * 24) : (4 + Math.floor(rng() * 5)) * 13 + Math.floor(rng() * 12), src = r ? bg : lf; bead(S.beads, src.pts[q], src.nrm[q], rng() < 0.55 ? C.lemon : C.white, C.ochre, 0.05 + rng() * 0.05, 1); }
  S.farTable = { x: tx, z: tz, top: tt + 0.04 };
  await S.ctx.yield();
  S.add(g, S.mRoom);
}

// ------------------------------------------------------------------------------------------------------------
// The far figure: one small woman at the far window, back turned, white cap, lemon fur-trimmed jacket, blue
// apron. Three casts by seed: the milk-pourer, a lace-maker bent over her cushion, a woman opening the casement.
async function buildWoman(S) {
  const { C, cast } = S, rng = S.F['woman at the far window'], g = new Geo(), T = S.farTable;
  const lace = cast === 'lace', open = cast === 'casement';
  // where she stands is 22 m or more from every point of the route (22.7 m; 22.6 m at the casement)
  const pos = open ? [5.6, 0, 52.6] : [3.3, 0, 51.5], yaw = open ? 1.75 : 0.95, sit = lace ? 0.75 : 0, lean = lace ? 0.3 : open ? 0.0 : 0.1;
  const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(pos[0], pos[1], pos[2]);
  const upper = base.clone().multiply(new THREE.Matrix4().makeTranslation(0, 2.5 - sit, 0)).multiply(new THREE.Matrix4().makeRotationX(lean));
  const W = (m, P) => new THREE.Vector3(P[0], P[1], P[2]).applyMatrix4(m).toArray();
  const blue = C.ultra, jacket = C.lemon, fur = mixc(C.white, C.shade, 0.12);
  g.xf = base;                                              // skirt and apron: blue, in heavy folds
  g.lathe(0, 0.08, 0, [[1.52, 0], [1.55, 0.3], [1.5, 0.9], [1.3, 1.6 - sit * 0.6], [0.92, 2.2 - sit], [0.6, 2.5 - sit], [0.52, 2.6 - sit]], 22, (u, v) => scl(blue, 0.85 + 0.2 * Math.sin(u * 44)), { melt: 0.85, squash: (a, y) => 1 + 0.06 * Math.sin(a * 9) * (1 - y / 2.6) + 0.05 * Math.sin(a * 4 + 1) + (lace ? 0.25 * Math.max(0, Math.sin(a)) : 0) });
  if (lace) g.box(0, 0.9, -0.5, 1.5, 1.8, 1.3, C.umber, { kind: KIND.wood, bevel: 0.1, melt: 0.8 });       // her stool, mostly hidden
  g.xf = upper;                                             // the jacket: lemon, flared over the hips, trimmed with white fur
  g.lathe(0, 0, 0, [[0.9, -0.5], [0.94, -0.36], [0.82, -0.3], [0.58, 0.04], [0.54, 0.3], [0.62, 0.75], [0.7, 1.1], [0.64, 1.3], [0.42, 1.45], [0.2, 1.54], [0.17, 1.64]], 20, (u, v) => (v < 0.14 ? fur : scl(jacket, 0.93 + 0.1 * Math.sin(u * 31 + v * 9))), { melt: 0.85, squash: (a, y) => 1 + (0.16 + 0.26 * sstep(0.5, 1.2, y) * (1 - sstep(1.3, 1.5, y))) * Math.abs(Math.cos(a)) });
  // head in a white cap that falls to the shoulders; from behind the cap is all there is
  g.lathe(0, 1.52, 0.03, [[0.22, 0], [0.38, 0.08], [0.47, 0.3], [0.47, 0.52], [0.4, 0.74], [0.26, 0.9], [0.1, 0.97], [0.0, 0.98]], 14, C.white, { melt: 0.85, squash: (a, y) => 1 + (y < 0.3 ? 0.25 * Math.max(0, -Math.sin(a)) : 0) });
  const limb = (m, a, b, r, col) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.xf = m.clone().multiply(new THREE.Matrix4().compose(A.add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    g.lathe(0, -len / 2 - r * 0.5, 0, [[0.02, 0], [r * 0.8, r * 0.3], [r * 1.05, len * 0.3], [r, len * 0.75], [r * 0.8, len + r * 0.7], [0.02, len + r], ], 8, col, { melt: 0.85 });
  };
  const hands = [];
  for (const sgn of [-1, 1]) {
    const sh = [sgn * 0.74, 1.18, 0.05];
    let el, ha;
    if (open && sgn > 0) { el = [1.08, 0.72, 0.5]; ha = [0.8, 1.42, 1.3]; }                 // the hand on the leaf
    else if (open) { el = [-0.9, 0.55, 0.25]; ha = [-0.85, 0.0, 0.85]; }
    else if (lace) { el = [sgn * 0.85, 0.5, 0.45]; ha = [sgn * 0.3, 0.42, 1.15]; }
    else { el = [sgn * 0.92, 0.55, 0.3]; ha = [sgn * 0.42, 0.42 + (sgn > 0 ? 0.12 : 0), 1.1]; }
    limb(upper, sh, el, 0.27, jacket); limb(upper, el, ha, 0.22, jacket);
    g.xf = upper; g.lathe(ha[0], ha[1] - 0.1, ha[2], [[0.19, 0], [0.21, 0.08], [0.19, 0.2]], 8, fur, { melt: 0.8 });
    hands.push(W(upper, ha));
  }
  for (let i = 0; i < 40; i++) { const a = rng() * 6.28, P = W(upper, [Math.cos(a) * 0.9 * (1 + 0.22 * Math.abs(Math.cos(a))), -0.36 + rng() * 0.1, Math.sin(a) * 0.9]), N = new THREE.Vector3(Math.cos(a), 0.2, Math.sin(a)).transformDirection(upper).toArray(); S.beads.push([...P, ...N, ...C.white, ...fur, 0.05 + rng() * 0.04, 1]); }
  g.xf = null;
  const hx = (hands[0][0] + hands[1][0]) / 2, hy = (hands[0][1] + hands[1][1]) / 2, hz = (hands[0][2] + hands[1][2]) / 2;
  if (cast === 'milk') {
    // earthenware jug in her hands, tipped; a bowl on the table; between them the thread of milk
    const earth = mixc(C.tile, C.umber, 0.35), bowl = [T.x - 1.0, T.top, T.z - 0.75];
    g.xf = new THREE.Matrix4().makeTranslation(hx, hy - 0.05, hz).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.9 * Math.cos(yaw), 0, -0.9 * Math.sin(yaw))));
    g.lathe(0, -0.3, 0, [[0.02, 0], [0.2, 0.02], [0.33, 0.2], [0.34, 0.4], [0.24, 0.6], [0.2, 0.72], [0.24, 0.8]], 14, earth, { melt: 0.8 });
    g.xf = null;
    g.lathe(bowl[0], bowl[1], bowl[2], [[0.05, 0], [0.3, 0.02], [0.5, 0.2], [0.58, 0.34], [0.52, 0.33], [0.4, 0.2], [0.05, 0.12]], 18, earth, { melt: 0.8 });
    const lip = [hx + 0.42 * Math.sin(yaw), hy + 0.22, hz + 0.42 * Math.cos(yaw)];
    const gm = new Geo(); gm.grid(1, 8, (u, v) => { const t = v, w = (u - 0.5) * 0.085; return [lip[0] + (bowl[0] - lip[0]) * t * t * 0.9 + w * Math.cos(yaw), lip[1] + (bowl[1] + 0.2 - lip[1]) * t, lip[2] + (bowl[2] - lip[2]) * t * t * 0.9 - w * Math.sin(yaw)]; }, C.white, { melt: 0 });
    const milk = new THREE.Mesh(gm.build(), roomMaterial(S.U, { side: THREE.DoubleSide })); milk.frustumCulled = false; S.room.add(milk);
    const mp = [0, 0];
    S.tick.push((time) => { const k = 0.012 * Math.sin(time * 5.1 + mp[0]) + 0.008 * Math.sin(time * 8.3 + mp[1]); milk.position.set(k * Math.cos(yaw), 0, -k * Math.sin(yaw)); });
    for (let i = 0; i < 26; i++) { const a = rng() * 6.28; S.beads.push([bowl[0] + Math.cos(a) * 0.56, bowl[1] + 0.35, bowl[2] + Math.sin(a) * 0.56, Math.cos(a) * 0.5, 0.86, Math.sin(a) * 0.5, ...(rng() < 0.4 ? C.lemon : C.white), ...earth, 0.05 + rng() * 0.03, 1]); }
    mp[0] = rng() * 6.28; mp[1] = rng() * 6.28;
  } else if (lace) {
    // the lace cushion on the table edge: blue, with white and lemon threads spilling
    const cx = hx + 0.25 * Math.sin(yaw), cz = hz + 0.25 * Math.cos(yaw), cy = Math.max(T.top, hy - 0.45);
    g.lathe(cx, cy - 0.05, cz, [[0.05, 0], [0.5, 0.05], [0.62, 0.22], [0.5, 0.4], [0.05, 0.46]], 16, scl(C.ultra, 1.1), { melt: 0.8 });
    for (let k = 0; k < 5; k++) { const a = rng() * 6.28, col = k % 2 ? C.white : C.lemon; g.grid(6, 1, (u, v) => [cx + Math.cos(a) * (0.3 + u * 0.7) + (v - 0.5) * 0.07 * Math.sin(a), cy + 0.4 - u * u * 0.5 + 0.05 * Math.sin(u * 9 + k), cz + Math.sin(a) * (0.3 + u * 0.7) - (v - 0.5) * 0.07 * Math.cos(a)], col, { melt: 0.3 }); }
    for (let i = 0; i < 30; i++) { const a = rng() * 6.28, r = rng() * 0.5; S.beads.push([cx + Math.cos(a) * r, cy + 0.45, cz + Math.sin(a) * r, 0, 1, 0, ...C.white, ...C.ultra, 0.045 + rng() * 0.03, 1]); }
  } else {
    // the leaf she holds open: the far casement's further lower light, hung on its far jamb, swinging a little
    const piv = new THREE.Group(); piv.position.set(9.9, 0, 52.6); S.room.add(piv);
    const gw = new Geo(), gp = new Geo(), frame = [0.2, 0.165, 0.14], fo = { kind: KIND.wood, bevel: 0.04, melt: 0.3 }, Wd = 3.4;
    gw.box(0, 5.1, 0.12, 0.13, 5.8, 0.24, frame, fo); gw.box(0, 5.1, Wd - 0.12, 0.13, 5.8, 0.24, frame, fo); gw.box(0, 2.34, Wd / 2, 0.13, 0.24, Wd, frame, fo); gw.box(0, 7.86, Wd / 2, 0.13, 0.24, Wd, frame, fo);
    Q(gp, [[0, 2.46, 0.24], [0, 2.46, Wd - 0.24], [0, 7.74, Wd - 0.24], [0, 7.74, 0.24]], [-1, 0, 0], [1, 1, 1], KIND.pane, 0, [0, 0, Wd - 0.48, 0, Wd - 0.48, 5.28, 0, 5.28]);
    const a = new THREE.Mesh(gw.build(), S.mRoom), b = new THREE.Mesh(gp.build(), S.mPane); a.frustumCulled = b.frustumCulled = false; piv.add(a, b);
    const lp = [0, 0];
    S.tick.push((time) => { piv.rotation.y = Math.PI + 1.25 + 0.1 * Math.sin(time * 0.525 + lp[0]) + 0.02 * Math.sin(time * 0.7 + lp[1]); });
    g.lathe(T.x - 0.2, T.top, T.z + 0.2, [[0.05, 0], [0.45, 0.02], [0.62, 0.12], [0.66, 0.2], [0.6, 0.19], [0.05, 0.06]], 18, mixc(C.ochre, C.white, 0.35), { melt: 0.8 });     // basin
    g.lathe(T.x - 0.2, T.top + 0.07, T.z + 0.2, [[0.02, 0], [0.2, 0.02], [0.3, 0.3], [0.26, 0.55], [0.15, 0.8], [0.19, 0.95]], 14, C.white, { melt: 0.8 });                   // white jug in it
    for (let i = 0; i < 30; i++) { const an = rng() * 6.28; S.beads.push([T.x - 0.2 + Math.cos(an) * 0.64, T.top + 0.22, T.z + 0.2 + Math.sin(an) * 0.64, Math.cos(an) * 0.5, 0.86, Math.sin(an) * 0.5, ...(rng() < 0.6 ? C.lemon : C.white), ...C.ochre, 0.05 + rng() * 0.03, 1]); }
    lp[0] = rng() * 6.28; lp[1] = rng() * 6.28;
  }
  const m = new THREE.Mesh(g.build(), roomMaterial(S.U, { side: THREE.DoubleSide })); m.frustumCulled = false; S.room.add(m);
}

// ------------------------------------------------------------------------------------------------------------
// THE TOWN in one band, x 150 to 250, z -60 to 260: 220 house plots in four rows under red tile and slate (those the
// gates, the canal and the tower's foot take are left out), a further row of tall roofs and the church's nave behind
// them, the pale tower, forty limes; its y-flipped double under the water. The near band (the first row, the gates,
// the yellow wall) stands in the slate cloud's shade: see townSun in the part.
function house(gT, C, rng, x, z, w, d, eave, ridge, alongZ, wall, roof, stepped, windows) {
  const K = KIND, WY = -11, x0 = x - d / 2, x1 = x + d / 2, z0 = z - w / 2, z1 = z + w / 2, m = 0.5, KB = wall[1] > 0.7 ? K.wash : K.brick, lines = gT.lines, stone = mixc(C.stone, wall, 0.25);
  Q(gT, [[x0, WY, z0], [x0, WY, z1], [x0, eave, z1], [x0, eave, z0]], [-1, 0, 0], wall, KB, m, [z0, WY, z1, WY, z1, eave, z0, eave]);
  Q(gT, [[x0, WY, z0], [x1, WY, z0], [x1, eave, z0], [x0, eave, z0]], [0, 0, -1], wall, KB, m, [x0, WY, x1, WY, x1, eave, x0, eave]);
  Q(gT, [[x0, WY, z1], [x1, WY, z1], [x1, eave, z1], [x0, eave, z1]], [0, 0, 1], wall, KB, m, [x0, WY, x1, WY, x1, eave, x0, eave]);
  if (alongZ) {
    const sl = Math.hypot(d / 2, ridge - eave);
    Q(gT, [[x0 - 0.5, eave - 0.4, z0 - 0.3], [x0 - 0.5, eave - 0.4, z1 + 0.3], [x, ridge, z1 + 0.3], [x, ridge, z0 - 0.3]], [-1, 1, 0], roof, K.roof, m, [z0, 0, z1, 0, z1, sl, z0, sl]);
    Q(gT, [[x1, eave, z0], [x1, eave, z1], [x, ridge, z1], [x, ridge, z0]], [1, 1, 0], roof, K.roof, m, [z0, 0, z1, 0, z1, sl, z0, sl]);
    lines.push([[x - 0.15, ridge + 0.05, z0], [x - 0.15, ridge + 0.05, z1], roof, 1.2], [[x0 - 0.55, eave - 0.35, z0], [x0 - 0.55, eave - 0.35, z1], roof, 0.8]);
    Q(gT, [[x0, eave, z0], [x1, eave, z0], [x, ridge, z0], [x, ridge, z0]], [0, 0, -1], wall, KB, m); Q(gT, [[x0, eave, z1], [x1, eave, z1], [x, ridge, z1], [x, ridge, z1]], [0, 0, 1], wall, KB, m);
  } else {
    const sl = Math.hypot(w / 2, ridge - eave);
    Q(gT, [[x0, eave, z0], [x1, eave, z0], [x1, ridge, z], [x0, ridge, z]], [0, 1, -1], roof, K.roof, m, [x0, 0, x1, 0, x1, sl, x0, sl]);
    Q(gT, [[x0, eave, z1], [x1, eave, z1], [x1, ridge, z], [x0, ridge, z]], [0, 1, 1], roof, K.roof, m, [x0, 0, x1, 0, x1, sl, x0, sl]);
    lines.push([[x0, ridge + 0.05, z], [x1, ridge + 0.05, z], roof, 0.7]);
    if (stepped) { const n = 9; for (let i = 0; i < n; i++) { const t = i / n, ww = w * (1 - t) + 0.5, ya = eave + (ridge - eave) * t, yb = eave + (ridge - eave) * (t + 1 / n) + 0.45;
      Q(gT, [[x0 - 0.06, ya, z - ww / 2], [x0 - 0.06, ya, z + ww / 2], [x0 - 0.06, yb, z + ww / 2], [x0 - 0.06, yb, z - ww / 2]], [-1, 0, 0], wall, KB, m, [z - ww / 2, ya, z + ww / 2, ya, z + ww / 2, yb, z - ww / 2, yb]);
      // each step under a weathered stone coping that stands proud of the brick, so the gable is a crow-step and never a stair of cubes
      Q(gT, [[x0 - 0.14, yb - 0.1, z - ww / 2 - 0.22], [x0 - 0.14, yb - 0.1, z + ww / 2 + 0.22], [x0 - 0.14, yb + 0.26, z + ww / 2 + 0.22], [x0 - 0.14, yb + 0.26, z - ww / 2 - 0.22]], [-1, 0, 0], scl(stone, i % 2 ? 0.96 : 0.86), K.object, 0.6);
      if (i % 3 === 1) lines.push([[x0 - 0.2, yb + 0.28, z - ww / 2], [x0 - 0.2, yb + 0.28, z + ww / 2], stone, 0.5]); }
      gT.box(x0 + 0.3, ridge + 1.1, z, 0.5, 1.5, 0.5, stone, { bevel: 0.1, melt: 0.6 });                // the finial stone
    } else { Q(gT, [[x0, eave, z0], [x0, eave, z1], [x0, ridge, z], [x0, ridge, z]], [-1, 0, 0], wall, KB, m);
      for (const sg of [-1, 1]) { const zc = z + sg * w / 2, e = [0, ridge - eave, -sg * w / 2], l = Math.hypot(e[1], e[2]), n = [0, -e[2] / l * sg * 0.34, e[1] / l * sg * 0.34];   // a pale verge along each rake
        Q(gT, [[x0 - 0.1, eave + n[1] * -1, zc + n[2] * -1], [x0 - 0.1, ridge + n[1] * -1, z + n[2] * -1], [x0 - 0.1, ridge + n[1], z + n[2]], [x0 - 0.1, eave + n[1], zc + n[2]]], [-1, 0, 0], scl(stone, 0.9), K.object, 0.6); }
      lines.push([[x0 - 0.15, eave, z0], [x0 - 0.15, ridge, z], stone, 0.5], [[x0 - 0.15, ridge, z], [x0 - 0.15, eave, z1], stone, 0.5]); }
  }
  if (rng() < 0.6) { const cz = z + (rng() - 0.5) * w * 0.5; gT.box(x + (alongZ ? 0.9 : (rng() - 0.5) * d * 0.5), ridge + 0.3, cz, 1.3, 3.4, 1.3, scl(C.tile, 0.85), { bevel: 0.12, melt: 0.5, kind: K.brick }); }
  if (windows) {                                              // a few dark lights and a door, as dabs
    const dark = mixc(C.slate, C.black, 0.45), n = Math.max(1, Math.floor(w / 3.6));
    for (let f = 0; f < 2; f++) { const y = WY + 5.5 + f * 5.2; if (y + 3 > eave) break;
      for (let i = 0; i < n; i++) { const zc = z0 + (i + 0.5) * w / n; if (rng() < 0.2) continue; Q(gT, [[x0 - 0.05, y, zc - 0.7], [x0 - 0.05, y, zc + 0.7], [x0 - 0.05, y + 2.6, zc + 0.7], [x0 - 0.05, y + 2.6, zc - 0.7]], [-1, 0, 0], dark, K.object, 0.6);
        Q(gT, [[x0 - 0.09, y - 0.3, zc - 0.95], [x0 - 0.09, y - 0.3, zc + 0.95], [x0 - 0.09, y, zc + 0.95], [x0 - 0.09, y, zc - 0.95]], [-1, 0, 0], stone, K.object, 0.6);   // its stone sill
        if (f === 0) lines.push([[x0 - 0.15, y - 0.05, zc - 0.9], [x0 - 0.15, y - 0.05, zc + 0.9], stone, 0.25]); } }
  }
}
async function buildTown(S) {
  const { C, detail } = S, K = KIND, WY = -11, gT = new Geo();
  let rng = S.F['houses of the town'];
  gT.lines = [];                                              // rough or wet rims the dots will sit on: [from, to, the paint under them, weight]
  const walls = [C.tile, scl(C.tile, 0.82), mixc(C.tile, C.ochre, 0.45), scl(C.white, 0.93), scl(C.white, 0.86), mixc(C.tile, C.umber, 0.5), mixc(C.tile, C.stone, 0.4)];
  const roofs = [C.tile, C.tile, scl(C.tile, 1.08), mixc(C.tile, C.ochre, 0.25), C.slate, mixc(C.slate, C.umber, 0.3), C.slate];
  const canal = (x, z, r) => { const dx = x - END[0], dz = z - END[2], f = dx * FWD[0] + dz * FWD[2], l = dx * PORT[0] + dz * PORT[2]; return f > -40 && Math.abs(l) < r; };
  const N = 220, rows = 4;
  for (let i = 0; i < N; i++) {
    const row = i % rows, z = -60 + ((i + 0.5) / N) * 320 + (rng() - 0.5) * 6, w = 8 + rng() * 7, d = 11 + rng() * 6;
    const x = 158 + row * 17.5 + rng() * 7, alongZ = rng() < (row === 0 ? 0.55 : 0.85), eave = WY + 11 + row * 4.5 + rng() * 8, ridge = eave + 8 + rng() * 7 + row * 1.5;
    const wl = walls[Math.floor(rng() * walls.length)], rf = roofs[Math.floor(rng() * roofs.length)], st = rng() < 0.35;
    if (canal(x, z, row === 0 ? 34 : 13)) continue;                                // the gates, the bridge and the canal behind it stand here
    if (Math.hypot(x - 215, z - 150) < 14) continue;                               // the tower's foot
    house(gT, C, rng, x, z, alongZ ? w * 1.9 : w, d, eave, alongZ ? eave + (ridge - eave) * 0.7 : ridge, alongZ, wl, rf, st, row < 2);
    if (i % 24 === 23) await S.ctx.yield();
  }
  // the town wall along the water, brick, with a whitewashed stretch; it stops where the gates stand
  const wallQ = (z0, z1, h, col) => { Q(gT, [[150, WY, z0], [150, WY, z1], [150, h, z1], [150, h, z0]], [-1, 0, 0], col, col[1] > 0.7 ? K.wash : K.brick, 0.4, [z0, WY, z1, WY, z1, h, z0, h]);
    Q(gT, [[149.9, h - 0.4, z0], [149.9, h - 0.4, z1], [149.9, h + 0.12, z1], [149.9, h + 0.12, z0]], [-1, 0, 0], mixc(C.stone, col, 0.3), K.object, 0.6);        // its coping
    gT.lines.push([[149.8, h + 0.1, z0], [149.8, h + 0.1, z1], C.stone, 0.45], [[149.85, WY + 0.25, z0], [149.85, WY + 0.25, z1], scl(col, 0.6), 0.6]); };      // the quay's edge and the waterline
  wallQ(-70, 20, -4.5, C.tile); wallQ(20, 62, -5.2, scl(C.white, 0.9)); wallQ(134, 190, -5, scl(C.tile, 0.9)); wallQ(190, 270, -4.2, mixc(C.tile, C.umber, 0.3));
  wallQ(270, 740, -4.6, mixc(C.tile, C.umber, 0.35));                             // beyond the last houses the wall runs on to starboard under its trees, to the frame's edge
  rng = S.F['houses along the far wall'];
  for (let i = 0; i < 20; i++) { const z = 272 + i * 23 + rng() * 8, w = 8 + rng() * 6, eave = WY + 19 + rng() * 9;      // roofs of 25 to 40 m over the water, as the town's are
    house(gT, C, rng, 162 + rng() * 16, z, w * 1.9, 12, eave, eave + 6 + rng() * 6, true, walls[Math.floor(rng() * walls.length)], roofs[Math.floor(rng() * roofs.length)], false, false); }
  // behind the last row a further row of tall roofs and the church's long slate nave beside its tower: the far skyline
  rng = S.F['back row and nave'];
  for (let i = 0; i < 26; i++) { const z = -52 + i * 12 + rng() * 7, w = 8 + rng() * 6, eave = WY + 21 + rng() * 7;      // ridges 28 to 40 m over the water
    if (Math.abs(z - 150) < 22) continue;                       // the church stands here
    house(gT, C, rng, 236 + rng() * 9, z, w * 1.9, 12, eave, eave + 7 + rng() * 5, true, walls[Math.floor(rng() * walls.length)], roofs[Math.floor(rng() * roofs.length)], false, false); }
  house(gT, C, rng, 243, 150, 19, 42, WY + 37, WY + 52, false, C.stone, C.slate, false, false);
  await S.ctx.yield();
  Q(gT, [[150, -4.5, -70], [150, -4.5, 62], [158, -4.5, 62], [158, -4.5, -70]], [0, 1, 0], C.sand, K.sand, 0); Q(gT, [[150, -4.6, 134], [150, -4.6, 270], [158, -4.6, 270], [158, -4.6, 134]], [0, 1, 0], C.sand, K.sand, 0);
  await S.ctx.yield();
  // the pale church tower, 110 m, at (215, 150): square stages, an open lantern, a slate spire
  let ty = WY; const stages = [[13.5, 44], [11.5, 19], [9.2, 15], [6.6, 11]];
  for (const [s, h] of stages) {
    gT.box(215, ty + h / 2, 150, s, h, s, C.stone, { bevel: 0.5, melt: 0.6 }); gT.box(215, ty + h, 150, s + 1.3, 1.3, s + 1.3, scl(C.stone, 0.92), { bevel: 0.3, melt: 0.6 });
    for (const sg of [-1, 1]) for (const ax of [0, 1]) {                           // tall dark lights in each face
      const o = s / 2 + 0.06, a = ty + h * 0.45, b = ty + h * 0.86, hw = s * 0.13, dark = mixc(C.slate, C.black, 0.3);
      for (const off of [-s * 0.22, s * 0.22]) {
        if (ax) Q(gT, [[215 + sg * o, a, 150 + off - hw], [215 + sg * o, a, 150 + off + hw], [215 + sg * o, b, 150 + off + hw], [215 + sg * o, b, 150 + off - hw]], [sg, 0, 0], dark, K.object, 0.5);
        else Q(gT, [[215 + off - hw, a, 150 + sg * o], [215 + off + hw, a, 150 + sg * o], [215 + off + hw, b, 150 + sg * o], [215 + off - hw, b, 150 + sg * o]], [0, 0, sg], dark, K.object, 0.5);
      }
    }
    ty += h;
  }
  gT.lathe(215, ty, 150, [[3.6, 0], [3.2, 4], [1.3, 12], [0.3, 19], [0, 21]], 8, C.slate, { melt: 0.6 });
  for (const [dx, dz] of [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]]) gT.lathe(215 + dx, WY + 44, 150 + dz, [[1.3, 0], [1.2, 5], [0, 11]], 6, C.stone, { melt: 0.6 });
  await S.ctx.yield();
  rng = S.F.limes;
  // forty limes behind the wall and between the gates: soft rounded masses (crowns in their own geometry, veiled in buildBridge), pale dots on the lit side
  // (the dots are dealt about a bearing 13 degrees to port of the sun's own: dots and limes come from the one stream, so another bearing would deal the forty limes anew)
  const gL = new Geo(), lb = [], nl = 40, sun = [-0.72, 0.52, -0.46], leaf = scl(C.green, 1.1);
  for (let i = 0; i < nl; i++) {
    const near = i < 14, z = near ? (i % 2 ? 44 + rng() * 22 : 128 + rng() * 26) : -55 + rng() * 310, x = near ? 153.5 + rng() * 5 : 152 + rng() * 9;
    if (canal(x, z, 30) && !near) continue;
    const h = 20 + rng() * 10, r = 4.5 + rng() * 2.6, p1 = rng() * 6.28, base = WY + 6.4;
    gT.box(x, WY + 6, z, 0.9, 12, 0.9, scl(C.umber, 0.8), { bevel: 0.3, melt: 0.6 });
    for (let l = 0; l < 8; l++) {                                                   // a crown of many soft lobes, never one ball
      const rl = r * (l ? 0.5 + 0.2 * rng() : 0.8), hl = rl * (1.5 + 0.5 * rng()), a = p1 + l * 2.4, rr = l ? r * (0.25 + 0.3 * rng()) : 0, ox = Math.cos(a) * rr, oz = Math.sin(a) * rr, oy = l ? (h - 6.4 - hl) * (0.25 + 0.7 * rng()) : h - 6.4 - hl * 1.0, prof = [], p2 = rng() * 6.28;
      for (let k = 0; k <= 8; k++) { const t = k / 8; prof.push([rl * Math.pow(Math.sin(Math.PI * (0.05 + 0.93 * t)), 0.8), hl * t]); }
      gL.lathe(x + ox, base + Math.max(0, oy), z + oz, prof, 12, (u, v) => scl(leaf, 0.97 + 0.1 * v), { melt: 1, kind: K.tree, squash: (an, y) => 1 + 0.07 * Math.sin(an * 3 + y + p2) + 0.04 * Math.sin(an * 5 - y * 2 + p2) });
    }
    if (i % 4 === 3) await S.ctx.yield();
    for (let k = 0, nb = Math.round(120 * detail); k < nb; k++) {
      const a = rng() * 6.28, e = rng() * 1.2 - 0.1, n = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)];
      if (n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2] < 0.05 + 0.5 * rng()) continue;
      lb.push([x + n[0] * (r * 0.95 + 1.4), base + (h - 6.4) * (0.5 + 0.45 * n[1]) + 1.4 * n[1], z + n[2] * (r * 0.95 + 1.4), n[0], n[1], n[2],     // on the veil, not under it
        ...(rng() < 0.2 ? C.lemon : C.white), ...leaf, 0.07 + 0.05 * rng(), 1]);
    }
  }
  // limes like the forty along the wall that runs on to starboard past the last houses: rounded masses of 20 to 30 m
  { const rl = S.F['limes along the far wall'];
    for (let i = 0; i < 18; i++) {
      const z = 276 + i * 26 + rl() * 12, x = 152.5 + rl() * 6, h = 20 + rl() * 10, r = 5 + rl() * 3, p1 = rl() * 6.28, base = WY + 6.4;
      gT.box(x, WY + 6, z, 0.9, 12, 0.9, scl(C.umber, 0.8), { bevel: 0.3, melt: 0.6 });
      for (let l = 0; l < 5; l++) {
        const rr = l ? r * (0.55 + 0.2 * rl()) : r * 0.85, hl = rr * (1.5 + 0.5 * rl()), a = p1 + l * 2.4, off = l ? r * (0.3 + 0.3 * rl()) : 0, oy = l ? (h - 6.4 - hl) * (0.2 + 0.7 * rl()) : h - 6.4 - hl, p2 = rl() * 6.28, prof = [];
        for (let k = 0; k <= 6; k++) { const t = k / 6; prof.push([rr * Math.pow(Math.sin(Math.PI * (0.05 + 0.93 * t)), 0.8), hl * t]); }
        gL.lathe(x + Math.cos(a) * off, base + Math.max(0, oy), z + Math.sin(a) * off, prof, 10, (u, v) => scl(leaf, 0.97 + 0.1 * v), { melt: 1, kind: K.tree, squash: (an, y) => 1 + 0.07 * Math.sin(an * 3 + y + p2) + 0.04 * Math.sin(an * 5 - y * 2 + p2) });
      }
      if (i % 6 === 5) await S.ctx.yield();
    } }
  await S.ctx.yield();
  // THE TOWN'S DOTS: pale pointilles in uneven clusters of 8 to 24 on what is rough or wet: roof ridges and eaves, the
  // crow-steps' copings, sills, the quay's edge and the waterline; smaller and closer together the further off
  rng = S.F['town dots']; S.townDots = lb.length;
  const lines = gT.lines, cum = []; let tot = 0;
  for (const l of lines) { tot += l[3] * Math.hypot(l[1][0] - l[0][0], l[1][1] - l[0][1], l[1][2] - l[0][2]); cum.push(tot); }
  for (let c = 0, nc = Math.round(430 * detail); c < nc; c++) {
    const pick = rng() * tot; let lo = 0, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < pick) lo = mid + 1; else hi = mid; }
    const [A, B, base] = lines[lo], len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) || 1, t0 = rng(), m = 8 + Math.floor(rng() * 17), lem = rng() < 0.14;
    const back = Math.min(1, Math.max(0, (A[0] - 150) / 90)), spread = 1.5 - 0.9 * back;          // metres: 1.5 at the water wall, 0.6 on the last roofs
    for (let k = 0; k < m; k++) { const t = Math.min(1, Math.max(0, t0 + rng.gauss() * spread / len));
      lb.push([A[0] + (B[0] - A[0]) * t - 0.05, A[1] + (B[1] - A[1]) * t + rng.gauss() * 0.1, A[2] + (B[2] - A[2]) * t, -0.75, 0.6, 0, ...(lem && rng() < 0.6 ? C.lemon : mixc(C.white, C.sand, 0.3)), ...base, (0.05 + 0.06 * rng() * rng()) * (1 - 0.35 * back), 1]); }
    if (c % 100 === 99) await S.ctx.yield();
  }
  S.gTown = gT; S.gLime = gL; S.townBeads = lb;
}

// ------------------------------------------------------------------------------------------------------------
// Boats. Local frame: x along the keel, y up from the waterline, z the beam. Bluff Dutch ends, strakes in the shader.
function hull(g, L, beam, fb, sheer, draft, col, wale, o = {}) {
  const girth = beam * 1.7, dd = o.dd ?? 0.45, nu = o.nu || 28, nv = o.nv || 12, ox = o.x || 0, oz = o.z || 0, cs = Math.cos(o.yaw || 0), sn = Math.sin(o.yaw || 0), oy = o.y || 0;
  const T = (x, y, z) => [ox + x * cs + z * sn, oy + y, oz - x * sn + z * cs];
  const half = (u) => beam / 2 * Math.pow(Math.max(0.0001, Math.sin(Math.PI * (u * 0.94 + 0.03))), 0.45), gun = (u) => fb + sheer * (2 * u - 1) * (2 * u - 1);
  const sk = g.grid(nu, nv, (u, v) => { const th = v * Math.PI, sy = Math.pow(Math.max(0, Math.sin(th)), 0.7), b = half(u), yg = gun(u); return T((u - 0.5) * L, yg - (yg + draft) * sy, b * Math.cos(th) * (1 + 0.1 * sy)); },
    (u, v) => (Math.min(v, 1 - v) < 0.07 ? wale : col), { kind: KIND.hull, melt: 0.5, uvf: (u, v) => [(u - 0.5) * L, v * girth] });
  g.grid(10, 2, (u, v) => { const uu = 0.04 + u * 0.92; return T((uu - 0.5) * L, gun(uu) - dd, half(uu) * (dd > 0.5 ? 0.8 : 0.94) * (1 - 2 * v)); }, o.deck || [0.36, 0.3, 0.23], { melt: 0.4 });
  return { skin: sk, T, half, gun, nu, nv };
}
// the two herring hulls: 26 m, tarred, leeboards, a mast with its yard lowered and the sail furled on it
function herring(S, g, beads, flipSide) {
  const { C, detail } = S, rng = S.F['herring hulls'], tar = scl(C.black, 1.45), wale = mixc(C.umber, C.black, 0.25);
  const h = hull(g, 26, 7.2, 3.3, 2.4, 1.6, tar, wale);
  for (const s of [-1, 1]) g.grid(14, 1, (u, v) => { const a = u * 6.283; return [1.6 + Math.cos(a) * v * (1.0 + 0.35 * Math.sin(a)), 2.3 + Math.sin(a) * v * 1.9, s * (3.8 + 0.04 * v)]; }, scl(C.black, 1.9), { melt: 0.4, kind: KIND.hull, uvf: (u, v) => [u * 6, v * 2] });       // leeboards, tarred
  g.lathe(-2.5, 2.4, 0, [[0.34, 0], [0.3, 9], [0.2, 19], [0.12, 23], [0, 23.3]], 8, C.umber, { melt: 0.6 });                               // mast
  g.box(3.5, 9.2, 0.5, 15, 0.26, 0.26, C.umber, { bevel: 0.1, melt: 0.5 });                                                                // the lowered yard
  const p1 = rng() * 6.28;
  g.grid(22, 8, (u, v) => { const a = v * 6.283, r = (0.5 + 0.16 * Math.sin(u * 23 + p1)) * Math.sqrt(Math.max(0.02, Math.sin(Math.PI * u))) ; return [-3.6 + u * 14.2, 8.55 + Math.sin(a) * r * 0.9 - 0.5 * Math.sin(Math.PI * u), 0.5 + Math.cos(a) * r]; },
    (u, v) => scl(mixc(C.white, C.sand, 0.35), 0.9 + 0.1 * Math.sin(u * 60)), { melt: 0.8 });                                              // the furled sail
  g.box(-9.6, 4.75, 0, 3.4, 1.0, 3.6, mixc(C.umber, C.tile, 0.3), { bevel: 0.3, melt: 0.8 });                                               // the steersman's hutch
  for (const [x1, x2] of [[-2.5, 10.5], [-2.5, -11.5]]) { const len = Math.hypot(x2 - x1, 19); const m = new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, 14, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(-(x2 - x1), 19)), new THREE.Vector3(1, 1, 1)); g.xf = m; g.box(0, 0, 0, 0.1, len, 0.1, scl(C.umber, 0.8), { bevel: 0.03, melt: 0.5 }); g.xf = null; }   // stays
  // pale pointilles on the shaded tar, in clusters of 8 to 24 along the wale, the plank seams (every 0.9 m of girth,
  // where the shader draws the strakes) and the waterline; the side toward the course the richest, never in rows
  const L = 26, draft = 1.6, girth = 7.2 * 1.7;
  const at = (u, v) => { const th = v * Math.PI, sy = Math.pow(Math.max(0, Math.sin(th)), 0.7), b = h.half(u), yg = h.gun(u); return [(u - 0.5) * L, yg - (yg + draft) * sy, b * Math.cos(th) * (1 + 0.1 * sy)]; };
  const put = (u, v, size) => {
    const P = at(u, v), A = at(Math.min(1, u + 0.004), v), B = at(u, Math.min(1, v + 0.004));
    const ux = A[0] - P[0], uy = A[1] - P[1], uz = A[2] - P[2], vx = B[0] - P[0], vy = B[1] - P[1], vz = B[2] - P[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1, o = (nz * P[2] > 0 ? 1 : -1) / l; nx *= o; ny *= o; nz *= o;
    if (P[1] < 0.12) return;                                   // nothing under the water
    const c = rng() < 0.14 ? C.lemon : rng() < 0.55 ? C.white : scl(C.white, 0.94);
    beads.push([P[0] + nx * 0.05, P[1] + ny * 0.05, P[2] + nz * 0.05, nx, ny, nz, ...c, ...tar, size, 1]);
  };
  const lines = [0.035, 0.0735, 0.147, 0.2205, 0.294];          // the wale, then the seams, as fractions of the girth
  for (let c = 0, nc = Math.round(230 * detail); c < nc; c++) {
    const near = rng() < 0.82, kind = rng(), u0 = 0.04 + 0.92 * rng(), m = 8 + Math.floor(rng() * 17);
    for (let k = 0; k < m; k++) {
      const u = Math.min(0.985, Math.max(0.015, u0 + rng.gauss() * 0.022));
      let v;
      if (kind < 0.3) { const yg = h.gun(u), sw = Math.pow(Math.min(1, (yg - 0.2 - 0.25 * Math.abs(rng.gauss())) / (yg + draft)), 1 / 0.7); v = Math.asin(Math.min(1, Math.max(0, sw))) / Math.PI; }   // just over the water
      else v = lines[kind < 0.5 ? 0 : 1 + Math.floor((kind - 0.5) * 8) % 4] + rng.gauss() * 0.006;
      put(u, near === flipSide ? v : 1 - v, 0.045 + 0.05 * rng() * rng());
    }
  }
}
// a far or small figure as six dabs: skirt or breeches, body, collar, head, hat, one touch of colour
function figure(g, C, rng, x, y, z, s = 1) {
  const dark = [scl(C.black, 1.5), mixc(C.slate, C.black, 0.5), scl(C.umber, 0.8)][Math.floor(rng() * 3)], woman = rng() < 0.5, touch = [C.lemon, C.ultra, C.white, C.white][Math.floor(rng() * 4)];
  g.lathe(x, y, z, woman ? [[1.15 * s, 0], [0.95 * s, 1.2 * s], [0.5 * s, 2.7 * s]] : [[0.5 * s, 0], [0.6 * s, 1.5 * s], [0.5 * s, 2.7 * s]], 6, dark, { melt: 0.7 });
  g.lathe(x, y + 2.6 * s, z, [[0.55 * s, 0], [0.7 * s, 0.8 * s], [0.5 * s, 1.5 * s]], 6, rng() < 0.3 ? touch : dark, { melt: 0.7 });
  g.lathe(x, y + 4.0 * s, z, [[0.6 * s, 0], [0.3 * s, 0.22 * s]], 6, C.white, { melt: 0.6 });
  g.lathe(x, y + 4.15 * s, z, [[0.2 * s, 0], [0.33 * s, 0.3 * s], [0.2 * s, 0.62 * s]], 6, woman ? C.white : mixc(C.sand, C.tile, 0.3), { melt: 0.7 });
  g.lathe(x, y + 4.6 * s, z, woman ? [[0.36 * s, 0], [0.2 * s, 0.3 * s], [0, 0.34 * s]] : [[0.75 * s, 0], [0.36 * s, 0.08 * s], [0.3 * s, 0.5 * s], [0, 0.52 * s]], 6, woman ? C.white : scl(C.black, 1.4), { melt: 0.6 });
  g.box(x + 0.5 * s, y + 2.4 * s, z + 0.3 * s, 0.5 * s, 1.0 * s, 0.5 * s, touch, { bevel: 0.15 * s, melt: 0.7 });
}

// ------------------------------------------------------------------------------------------------------------
// Outside the casement: the sand quay 14 m below with its nine figures, the still water, the moored and the towed
// barge, eight small boats, and the two herring hulls 5 m to port of the course.
async function buildHarbour(S) {
  const { C, detail, room } = S, K = KIND, gQ = new Geo(), gT = S.gTown, WY = -11;
  let rng = S.F['sand grains'];
  const mBoat = S.mBoat = outdoorMaterial(S.U, { side: THREE.DoubleSide });
  // quay: a sand shelf under the house wall, sloping into the water; the house's own brick foot
  // the waterline wanders between x 30 and 40 (a function of z); the shelf reaches y -11.5 a little beyond it
  const shoreX = (z) => 35.2 + 2.1 * Math.sin(z * 0.11 + 1) + 1.5 * Math.sin(z * 0.29) + 1.0 * Math.sin(z * 0.53 + 2) + 0.9 * Math.sin(z * 0.93 + 0.6) + 0.5 * Math.sin(z * 1.7 + 4);
  const quayY = (x, z) => (x <= 27 ? -10 : -10 - 1.5 * Math.pow(Math.min(1, (x - 27) * 0.832 / (shoreX(z) - 27)), 2.2));
  Q(gQ, [[10.3, -10, -120], [10.3, -10, 190], [27, -10, 190], [27, -10, -120]], [0, 1, 0], C.sand, K.sand, 0);
  for (let h = 0; h < 6; h++) { gQ.grid(Math.round(70 * detail), 7, (u, v) => { const z = -120 + 310 * (h + u) / 6, x = 27 + v * (shoreX(z) - 27) / 0.832; return [x, quayY(x, z), z]; }, C.sand, { kind: K.sand, melt: 0, flip: true, ext: true }); await S.ctx.yield(); }
  Q(gQ, [[10.3, -10, -120], [10.3, -10, 18], [10.3, 14, 18], [10.3, 14, -120]], [1, 0, 0], C.tile, K.brick, 0.3, [-120, -10, 18, -10, 18, 14, -120, 14]);
  for (const [za, zb, ya, yb] of [[40, 45, -10, 14], [53, 190, -10, 14], [45, 53, -10, 2], [45, 53, 10, 14]]) Q(gQ, [[10.3, ya, za], [10.3, ya, zb], [10.3, yb, zb], [10.3, yb, za]], [1, 0, 0], C.tile, K.brick, 0.3, [za, ya, zb, ya, zb, yb, za, yb]);
  Q(gQ, [[10.3, 11.6, 18], [10.3, 11.6, 40], [10.3, 14, 40], [10.3, 14, 18]], [1, 0, 0], C.tile, K.brick, 0.3, [18, 11.6, 40, 11.6, 40, 14, 18, 14]);
  S.add(gQ, S.mOut);
  const drift = [20, 40, 1], g0 = S.beads.length;
  for (let i = 0, n = Math.round(1700 * detail * Math.min(1.25, Math.max(0.75, S.vary.density || 1))); i < n; i++) {                      // pale grains and shells on the sand under the drop
    if (i % 40 === 0) { drift[0] = 0.5 + 16 * rng() * rng(); drift[1] = 12 + rng() * 78; drift[2] = 0.25 + rng() * 0.5; }   // they lie in dense drifts along the tide lines, which follow the wandering shore
    const z = drift[1] + rng.gauss() * drift[2] * 7, x = Math.min(shoreX(z) - 0.3, shoreX(z) - drift[0] + rng.gauss() * drift[2]), y = quayY(x, z);
    if (x < 10.8) continue;
    S.beads.push([x, y + 0.03, z, 0, 1, 0, ...(rng() < 0.16 ? C.lemon : mixc(C.white, C.sand, 0.2)), ...C.sand, 0.045 + 0.06 * rng() * rng(), 1]);
  }
  S.sandGrains = [g0, S.beads.length];
  rng = S.F['figures on the sand'];
  // nine tiny dark figures on the sand, in three knots, each 25 m or more from the course
  const knots = [[27.5, 84, 4], [20, 150, 3], [26, -8, 2]], kph = [];
  knots.forEach(([kx, kz, nf], k) => {
    const gf = new Geo(); for (let i = 0; i < nf; i++) {
      const fx = (rng() - 0.5) * 2.2 - (i % 2) * 2.6, fz = (i - 1) * 2.4 + rng(), fs = 0.95 + rng() * 0.15;
      // its shadow under the cloud: a soft dark pool lying away from the hidden sun (toward the water), fading into the sand
      gf.grid(12, 2, (u, v) => { const a = u * Math.PI * 2, r = v, la = Math.cos(a) * r * 2.3 * fs, ac = Math.sin(a) * r * 1.25 * fs; return [fx + 1.12 * fs + 0.685 * la - 0.734 * ac, 0.03 + 0.01 * i, fz + 1.279 * fs + 0.734 * la + 0.685 * ac]; }, (u, v) => mixc(C.sand, scl(C.shade, 0.66), v < 0.25 ? 0.62 : v < 0.75 ? 0.4 : 0), { kind: K.sand, melt: 0 });
      figure(gf, C, rng, fx, 0, fz, fs);
    }
    const m = new THREE.Mesh(gf.build(), mBoat); m.frustumCulled = false; m.position.set(kx, quayY(kx - 1, kz), kz); room.add(m);
    S.tick.push((time) => { const q = kph[k]; m.position.x = kx + 0.7 * Math.sin(time * 0.4 + q[0]); m.position.z = kz + 0.9 * Math.sin(time * 0.275 + q[1]); m.rotation.y = 0.05 * Math.sin(time * 0.6 + q[2]); });
  });
  for (let k = 0; k < knots.length; k++) kph.push([rng() * 6.28, rng() * 6.28, rng() * 6.28]);
  await S.ctx.yield();
  // a boat that rocks, with its double under the water
  const yawF = -Math.atan2(FWD[2], FWD[0]);
  const afloat = (geo, beads, x, z, yaw, amp) => {
    const ph = [0, 0, 0];                                      // filled from the boat's own fork once it is built
    const G = new THREE.Group(); G.position.set(x, WY, z); G.rotation.y = yaw; room.add(G);
    const r1 = new THREE.Group(), mir = new THREE.Group(), r2 = new THREE.Group(); mir.scale.y = -1; G.add(r1, mir); mir.add(r2);
    const bg = geo.build(), a = new THREE.Mesh(bg, mBoat), b = new THREE.Mesh(bg, mBoat); a.frustumCulled = b.frustumCulled = false; r1.add(a); r2.add(b);
    if (beads && beads.length) r1.add(makeBeads(beads, S.mBead));
    S.tick.push((time) => { const rx = amp * Math.sin(time * 0.8 + ph[0]), rz = amp * 0.5 * Math.sin(time * 0.53 + ph[1]), y = 0.07 * Math.sin(time * 0.66 + ph[2]); r1.rotation.set(rx, 0, rz); r2.rotation.set(rx, 0, rz); r1.position.y = y; r2.position.y = y; });
    G.userData.ph = ph;
    return G;
  };
  const rocking = [];
  for (const [d, side, fl] of [[90.7, 14.3, true], [85.9, 21.3, true]]) {
    const gh = new Geo(), hb = []; herring(S, gh, hb, fl); const p = along(d, side);
    rocking.push(afloat(gh, hb, p[0], p[2], yawF - 0.6 - (side > 20 ? 0.05 : 0), 0.022));
    await S.ctx.yield();
  }
  for (const G of rocking) { const rh = S.F['herring hulls']; G.userData.ph.splice(0, 3, rh() * 6.28, rh() * 6.28, rh() * 6.28); }
  rng = S.F.barges;
  // barges: one moored under the quay, one towed across the course 30 m ahead (its crossing keyed to u; its crew is never
  // nearer the eye than 34 m)
  const barge = (g, towed) => {
    hull(g, 19, 5.4, 1.5, 0.5, 0.8, mixc(C.umber, C.black, 0.5), mixc(C.ochre, C.umber, 0.3), { nu: 20, nv: 8 });
    for (let i = 0; i < 5; i++) g.lathe(-4 + i * 1.9 + rng() * 0.5, 1.0, (rng() - 0.5) * 1.6, [[0.6, 0], [0.75, 0.5], [0.75, 1.0], [0.6, 1.5], [0, 1.52]], 8, mixc(C.ochre, C.umber, 0.3 + rng() * 0.4), { melt: 0.6 });
    if (towed) figure(g, C, rng, -7.6, 1.0, 0.3, 0.8);          // the moored barge lies under 25 m from the route from end to end: it carries nobody
    g.lathe(5.5, 1.0, 0, [[0.2, 0], [0.16, 8], [0, 8.2]], 6, C.umber, { melt: 0.5 });
    if (towed) { hull(g, 7.5, 2.6, 0.9, 0.5, 0.5, scl(C.black, 1.8), C.ochre, { nu: 12, nv: 6, x: 19 }); figure(g, C, rng, 18, 0.4, 0, 0.75); figure(g, C, rng, 20.5, 0.4, 0.2, 0.75); g.box(12.5, 1.2, 0, 7, 0.09, 0.09, mixc(C.sand, C.umber, 0.5), { bevel: 0.03, melt: 0.3 }); }
  };
  const g1 = new Geo(); barge(g1, false); const moored = afloat(g1, null, 39.2, 27, Math.PI / 2 + 0.1, 0.012);
  const g2 = new Geo(); barge(g2, true); const tow = afloat(g2, null, 0, 0, yawF + Math.PI / 2, 0.012);
  for (const G of [moored, tow]) G.userData.ph.splice(0, 3, rng() * 6.28, rng() * 6.28, rng() * 6.28);
  S.tick.push((time, u) => { const s = -52 + 104 * sstep(0.27, 0.7, u), p = along(58 - 0.1 * s, s); tow.position.set(p[0], WY, p[2]); });
  rng = S.F['rowing boats'];
  // eight small boats under the town wall and at the sand's edge; mooring piles by the herring hulls
  const spots = [[146.3, 8, 1.5], [146, 31, 1.6], [146.5, 55, 1.45], [145.6, 142, 1.7], [146.4, 168, 1.5], [146, 204, 1.6], [40.5, 2, 1.4], [40, 84, 1.75]];
  for (const [d, sd, yw] of [[52, -8.6, 0.5], [31, 9.2, 2.2]]) { const p = along(d, sd); spots[d > 40 ? 1 : 4] = [p[0], p[2], yw, 1]; }
  for (const [d, sd, yw] of [[6.5, 21.5, 2.75], [10.5, -25.5, 2.5]]) { const p = along(d, sd); spots.push([p[0], p[2], yw, 1]); }   // and two made fast under the gates: the whitewashed front, the turrets      // two of them lie out in the harbour beside the course
  const gSB = new Geo();                                       // open boats are seen from above: both sides of the planking show
  const plank = mixc(C.ochre, C.umber, 0.45), oar = mixc(C.sand, C.white, 0.3);
  for (const [x, z, yw, nearCourse] of spots) {                    // rowing boats: open, floorboards low in the shell, three thwarts, the oars shipped along them
    const Ls = 7 + rng() * 2, fb = nearCourse ? 1.35 : 0.9, cA = rng() < 0.5 ? scl(C.black, 1.8) : mixc(C.umber, C.black, 0.4), cB = rng() < 0.5 ? C.ochre : mixc(C.white, C.shade, 0.3);
    const hb = hull(gSB, Ls, nearCourse ? 3 : 2.5, fb, nearCourse ? 0.8 : 0.45, 0.5, cA, cB, { nu: 12, nv: 6, x, z, y: WY, yaw: yw, dd: fb * 0.72, deck: scl(plank, 0.8) });
    gSB.xf = new THREE.Matrix4().makeRotationY(yw).setPosition(x, WY, z);
    for (const t of [0.27, 0.5, 0.7]) gSB.box((t - 0.5) * Ls, hb.gun(t) - 0.26, 0, 0.44, 0.1, hb.half(t) * 1.92, plank, { bevel: 0.03, melt: 0.5 });
    for (const sg of [-1, 1]) { gSB.box(0.04 * Ls, hb.gun(0.5) - 0.17, sg * 0.42, Ls * 0.6, 0.08, 0.09, oar, { bevel: 0.03, melt: 0.5 }); gSB.box(0.36 * Ls, hb.gun(0.5) - 0.17, sg * 0.42, Ls * 0.14, 0.05, 0.26, oar, { bevel: 0.02, melt: 0.5 }); }
    gSB.xf = null;
    if (nearCourse) for (let c = 0; c < 4; c++) { const t0 = 0.12 + 0.76 * rng(), sg = rng() < 0.5 ? -1 : 1;                 // the gunwale's wet rim, dotted in clusters
      for (let i = 0, n = Math.round(18 * detail); i < n; i++) { const t = Math.min(0.96, Math.max(0.04, t0 + rng.gauss() * 0.05)), P = hb.T((t - 0.5) * Ls, hb.gun(t) + 0.03 - 0.12 * rng(), sg * hb.half(t) * 1.02);
        S.beads.push([P[0], P[1], P[2], 0, 1, 0, ...(rng() < 0.15 ? C.lemon : C.white), ...C.umber, 0.045 + 0.04 * rng(), 1]); } }
  }
  { const bg = gSB.build(), a = new THREE.Mesh(bg, mBoat), b = new THREE.Mesh(bg, mBoat); a.frustumCulled = b.frustumCulled = false; b.scale.y = -1; b.position.y = -22; room.add(a, b); }
  // mooring piles: the herring hulls' four, one for each boat lying out by the course, and two pairs that mark the
  // channel into the arch (8 m to either side, 18 and 8 m before the bridge); wet rims and caps dotted
  rng = S.F.piles;
  for (const [d, s] of [[77.5, 7], [104, 23], [99, 30.5], [72, 13.5], [47.5, -11], [35.5, 11.6], [18, -8.2], [18, 8.2], [8, -7.6], [8, 7.6]]) { const p = along(d, s), tall = d < 60 ? 5.2 + rng() : 6;
    gT.lathe(p[0], WY - 2, p[2], [[0.36, 0], [0.34, tall - 0.4], [0.26, tall - 0.1], [0, tall]], 8, mixc(C.umber, C.black, 0.3), { melt: 0.5 });
    if (d < 60) for (let k = 0, n = Math.round(22 * detail); k < n; k++) { const a = rng() * 6.28, top = rng() < 0.4, y = top ? WY - 2 + tall - 0.25 * rng() : WY + 0.12 + 0.3 * Math.abs(rng.gauss());
      S.beads.push([p[0] + Math.cos(a) * 0.37, y, p[2] + Math.sin(a) * 0.37, Math.cos(a), top ? 0.7 : 0.2, Math.sin(a), ...(rng() < 0.15 ? C.lemon : mixc(C.white, C.sand, 0.25)), ...C.umber, 0.045 + 0.04 * rng(), 1]); } }
  // the water: still, the sky doubled in it, over the mirrored town
  const gW = new Geo(); gW.quad([27.5, WY, -500], [27.5, WY, 700], [520, WY, 700], [520, WY, -500], [1, 1, 1], K.water);
  const water = S.add(gW, outdoorMaterial(S.U, { water: true })); water.renderOrder = 3;
  await S.ctx.yield();
  if (S.rare) buildShower(S);
}

// THE SHOWER (rare): a soft slate veil of rain crossing the port end of the town during the water crossing; the
// harbour turns pewter under it. Its place is a function of u.
function buildShower(S) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...S.U, uVeilZ: { value: -400 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform mat4 uRoomFromWorld; uniform float uVeilZ; varying vec3 vP; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position + vec3(0., 0., uVeilZ), 1.); vP = (uRoomFromWorld*w).xyz; vUv = uv; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`${STYLE_GLSL}
      varying vec3 vP; varying vec2 vUv;
      void main(){
        float edge = smoothstep(0., 0.3, vUv.x)*(1. - smoothstep(0.7, 1., vUv.x));
        float tf = uTime + uPhase.y;
        float fall = vnoise(vec2((vP.z + vP.y*0.3)*0.22, vP.y*0.015 + tf*0.4))*0.55 + vnoise(vec2((vP.z + vP.y*0.3)*0.7, vP.y*0.03 + tf*0.7))*0.35;
        float up = vUv.y;                                            // 0 at the water (or the sheet's near edge), 1 in the cloud
        float a = edge*(0.66 + 0.4*fall)*smoothstep(0., 0.1, up)*mix(0.9, 1.3, up);
        vec3 col = mix(vec3(0.47, 0.505, 0.54), vec3(0.34, 0.375, 0.42), up)*(0.9 + 0.2*fall);
        gl_FragColor = vec4(toScene(col), clamp(a, 0., 0.88));
      }`,
  });
  const g = new THREE.BufferGeometry();
  // a standing veil in front of the town (x 143) and a lying sheet on the water under it
  const P = [143, -11, -70, 143, -11, 70, 143, 95, 70, 143, 95, -70, 60, -10.9, -70, 60, -10.9, 70, 143, -10.9, 70, 143, -10.9, -70];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0.5, 0, 0.5], 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4; S.room.add(m);
  S.tick.push((time, u) => { mat.uniforms.uVeilZ.value = -230 + 275 * sstep(0.2, 0.56, u) - 45 * sstep(0.6, 0.95, u); });
}

// ------------------------------------------------------------------------------------------------------------
// THE WAY OUT: the one-arch stone bridge across the course's end, a long-roofed gate to port, a twin-turret gate to
// starboard, and above the bridge, set back, the yellow wall with its open leaded window. Built in the arch's own
// frame (x to port, z along the course beyond the arch) and written into the town's geometry, so it is doubled too.
async function buildBridge(S) {
  const { C, detail, room } = S, rng = S.F['gate and bridge dots'], K = KIND, gT = new Geo(), WY = -11, phi = Math.atan2(FWD[0], FWD[2]);    // gates, bridge and yellow wall: their own geometry, doubled like the town's
  const MB = new THREE.Matrix4().makeRotationY(phi).setPosition(END[0], 0, END[2]);
  const toRoom = (P) => new THREE.Vector3(P[0], P[1], P[2]).applyMatrix4(MB).toArray(), dirRoom = (N) => new THREE.Vector3(N[0], N[1], N[2]).transformDirection(MB).toArray();
  gT.xf = MB;
  const stone = C.stone, brick = C.tile, white = scl(C.white, 0.92), DECK = -1.25, HW = 9;
  // the bridge face around the opening (12 wide, 3 m of pier and a half-round of radius 6: the portal's own shape)
  const inn = [[6, WY - 1.5], [6, -8]], N = 16; for (let i = 1; i < N; i++) { const t = i / N * Math.PI; inn.push([6 * Math.cos(t), -8 + 6 * Math.sin(t)]); } inn.push([-6, -8], [-6, WY - 1.5]);
  const outer = (p, i) => { if (i < 2) return [HW, p[1]]; if (i > inn.length - 3) return [-HW, p[1]]; const dx = p[0] / 6, dy = (p[1] + 8) / 6, t = Math.min(HW / Math.max(Math.abs(dx), 1e-3), (DECK + 8) / Math.max(dy, 1e-3)); return [dx * t, -8 + dy * t]; };
  const ring = (p, i) => { if (i < 2) return [6.95, p[1]]; if (i > inn.length - 3) return [-6.95, p[1]]; return [p[0] * 6.95 / 6, -8 + (p[1] + 8) * 6.95 / 6]; };
  for (let i = 0; i < inn.length - 1; i++) {
    const a = inn[i], b = inn[i + 1], oa = outer(a, i), ob = outer(b, i + 1), ra = ring(a, i), rb = ring(b, i + 1);
    Q(gT, [[ra[0], ra[1], 0], [rb[0], rb[1], 0], [ob[0], ob[1], 0], [oa[0], oa[1], 0]], [0, 0, -1], mixc(brick, stone, 0.35), K.brick, 0.3, [ra[0], ra[1], rb[0], rb[1], ob[0], ob[1], oa[0], oa[1]]);
    Q(gT, [[a[0], a[1], -0.3], [b[0], b[1], -0.3], [rb[0], rb[1], -0.3], [ra[0], ra[1], -0.3]], [0, 0, -1], scl(stone, i % 2 ? 1.02 : 0.9), K.object, 0.3);
    Q(gT, [[a[0], a[1], -0.3], [b[0], b[1], -0.3], [b[0], b[1], 7], [a[0], a[1], 7]], [-a[0] - b[0], -8 - (a[1] + b[1]) / 2 - 0.01, 0], scl(stone, 0.8), K.object, 0.2);       // the barrel of the arch
    Q(gT, [[ra[0], ra[1], -0.3], [rb[0], rb[1], -0.3], [rb[0], rb[1], 0], [ra[0], ra[1], 0]], [ra[0], ra[1] + 8, 0], scl(stone, 0.85), K.object, 0.2);
  }
  gT.box(0, DECK + 0.1, 3.5, HW * 2, 0.5, 7.6, scl(stone, 0.95), { bevel: 0.12, melt: 0.4 });                    // the deck's edge course
  gT.box(0, DECK + 0.85, -0.1, HW * 2, 1.2, 0.5, mixc(brick, stone, 0.3), { bevel: 0.06, melt: 0.4, kind: K.brick });       // parapet, brick under a stone coping
  gT.box(0, DECK + 1.56, -0.1, HW * 2 + 0.3, 0.22, 0.8, stone, { bevel: 0.07, melt: 0.4 });
  gT.box(0, -1.72, -0.42, 1.1, 1.35, 0.36, scl(stone, 1.06), { bevel: 0.08, melt: 0.4 });                                    // keystone
  await S.ctx.yield();
  // three small dark figures on the town's quay beyond the gates, 33 m or more from the route, backs to us (over the arch
  // stands only the yellow wall with its open leaded window); they shift a little, on the clock
  { const rf = S.F['figures by the gates'];
    for (const [x, z, y] of [[151.6, 57, -4.5], [151.9, 60.3, -4.5], [151.6, 138, -4.6]]) {
      const gf = new Geo(); figure(gf, C, rf, 0, 0, 0, 0.92 + rf() * 0.12);
      const m = new THREE.Mesh(gf.build(), S.mBoat), q = [rf() * 6.28, rf() * 6.28]; m.frustumCulled = false; m.position.set(x, y, z); room.add(m);
      S.tick.push((time) => { m.position.z = z + 0.4 * Math.sin(time * 0.325 + q[0]) + 0.05 * Math.sin(time * 0.6 + q[1]); });
    } }
  // GATE TO PORT (long-roofed) and GATE TO STARBOARD (twin turrets): masses with real relief. Fronts are cut for
  // their lights (reveals, a dark pane set back, stone sill, cross-bar), carry a damp stone plinth at the water, a
  // string course and an eaves cornice; roofs overhang; whitewash is its own surface kind, patched and stained.
  const bq = (x0, x1, y0, y1, z, col, kind = K.brick) => Q(gT, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, -1], col, kind, 0.4, [x0, y0, x1, y0, x1, y1, x0, y1]);
  const sq = (x, z0, z1, y0, y1, nx, col, kind = K.brick) => Q(gT, [[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [nx, 0, 0], col, kind, 0.4, [z0, y0, z1, y0, z1, y1, z0, y1]);
  const roofX = (x0, x1, z0, z1, eave, ridge, col) => { const zm = (z0 + z1) / 2, sl = Math.hypot(zm - z0, ridge - eave);
    Q(gT, [[x0, eave, z0], [x1, eave, z0], [x1, ridge, zm], [x0, ridge, zm]], [0, 1, -1], col, K.roof, 0.5, [x0, 0, x1, 0, x1, sl, x0, sl]);
    Q(gT, [[x0, eave, z1], [x1, eave, z1], [x1, ridge, zm], [x0, ridge, zm]], [0, 1, 1], col, K.roof, 0.5, [x0, 0, x1, 0, x1, sl, x0, sl]);
    Q(gT, [[x0, eave, z0], [x1, eave, z0], [x1, eave - 0.25, z0 + 0.2], [x0, eave - 0.25, z0 + 0.2]], [0, -1, -0.3], scl(col, 0.7), K.object, 0.4); };
  const dark = mixc(C.slate, C.black, 0.4), plinthC = mixc(stone, C.slate, 0.45), wash = scl(C.white, 0.9), bo = { bevel: 0.05, melt: 0.45 };
  const front = (x0, x1, y0, y1, z, holes, col, kind, o = {}) => {
    const uq = (a, lo, hi) => [...new Set(a.filter((v) => v >= lo && v <= hi))].sort((p, q) => p - q);
    const X = uq([x0, x1, ...holes.flatMap((h) => [h[0], h[0] + h[2]])], x0, x1), Y = uq([y0, y1, y1 - 2.2, ...holes.flatMap((h) => [h[1], h[1] + h[3]])], y0, y1);
    for (let i = 0; i < X.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2, cy = (Y[j] + Y[j + 1]) / 2;
      if (holes.some((h) => cx > h[0] && cx < h[0] + h[2] && cy > h[1] && cy < h[1] + h[3])) continue;
      bq(X[i], X[i + 1], Y[j], Y[j + 1], z, scl(col, o.eave && cy > y1 - 2.2 ? 0.8 : 1), kind);             // the eave's own shade
    }
    const dep = o.depth ?? 0.5, rv = scl(col, 0.8);
    for (const [hx, hy, hw, hh] of holes) {
      sq(hx, z, z + dep, hy, hy + hh, 1, rv, kind); sq(hx + hw, z, z + dep, hy, hy + hh, -1, rv, kind);
      Q(gT, [[hx, hy + hh, z], [hx + hw, hy + hh, z], [hx + hw, hy + hh, z + dep], [hx, hy + hh, z + dep]], [0, -1, 0], scl(col, 0.66), kind, 0.4);
      Q(gT, [[hx, hy, z], [hx + hw, hy, z], [hx + hw, hy, z + dep], [hx, hy, z + dep]], [0, 1, 0], col, kind, 0.4);
      bq(hx, hx + hw, hy, hy + hh, z + dep, dark, K.object);
      if (hy > WY + 1) gT.box(hx + hw / 2, hy - 0.1, z - 0.05, hw + 0.4, 0.22, 0.32, stone, bo);
      if (hw < 2.2) { gT.box(hx + hw / 2, hy + hh / 2, z + dep - 0.07, 0.13, hh, 0.1, wash, bo); gT.box(hx + hw / 2, hy + hh * 0.62, z + dep - 0.07, hw, 0.13, 0.1, wash, bo); }
    }
  };
  const ledge = (x0, x1, y, z, h, out, col, kind = K.object) => gT.box((x0 + x1) / 2, y, z - out / 2 + 0.05, x1 - x0 + out * 0.6, h, out + 0.1, col, { bevel: Math.min(0.08, h * 0.3), melt: 0.45, kind });
  // port: the long range under slate
  const pw = []; for (const x of [12.3, 31.6, 35.9, 40.2, 44]) for (const [y, h] of [[-6.8, 3.2], [0.3, 3.4]]) pw.push([x - 0.8, y, 1.6, h]);
  front(HW, 46, WY, 8.6, -1, pw, brick, K.brick, { eave: 1 });
  sq(HW, -1, 12, WY, 7, -1, brick); sq(46, -1, 12, WY, 7, 1, brick); roofX(HW - 0.5, 46.5, -2.1, 14.1, 7, 19, C.slate);
  Q(gT, [[HW, 7, -1], [HW, 7, 13], [HW, 19, 6], [HW, 19, 6]], [-1, 0, 0], brick, K.brick, 0.4, [-1, 7, 13, 7, 6, 19, 6, 19]);
  ledge(HW, 46, WY + 0.85, -1, 1.7, 0.4, plinthC); ledge(HW, 46, -2.3, -1, 0.3, 0.16, stone); ledge(HW, 46, 6.55, -1, 0.5, 0.6, wash);
  for (const x of [33.5, 40.5]) { gT.box(x, 10.3, 0.2, 2.0, 2.2, 2.4, wash, { bevel: 0.06, melt: 0.45, kind: K.wash }); bq(x - 0.55, x + 0.55, 9.8, 11.0, -1.02, dark, K.object); gT.box(x, 11.55, 0.1, 2.5, 0.3, 2.9, C.slate, bo); }
  for (const x of [13.5, 30, 44.2]) gT.box(x, 19.4, 6, 1.4, 3.4, 1.4, scl(brick, 0.85), { bevel: 0.1, melt: 0.5, kind: K.brick });
  // its whitewashed stepped front, standing forward: blocks with stone copings, never a flat staircase
  const AZ = -2.5;
  front(16, 28, WY, 7, AZ, [[20.6, WY + 0.5, 2.8, 6.4], [17.2, 0.6, 1.5, 3.2], [25.3, 0.6, 1.5, 3.2]], wash, K.wash, { depth: 0.7 });
  sq(16, AZ, -1, WY, 7, -1, wash, K.wash); sq(28, AZ, -1, WY, 7, 1, wash, K.wash); ledge(16, 28, WY + 0.7, AZ, 1.4, 0.35, plinthC);
  for (let i = 0; i < 5; i++) { const ww = 12 * (1 - i / 5), ya = 7 + i * 2.5;
    gT.box(22, ya + 1.25, AZ + 0.5, ww, 2.5, 1.0, wash, { bevel: 0.04, melt: 0.5, kind: K.wash }); gT.box(22, ya + 2.6, AZ + 0.5, ww + 0.36, 0.24, 1.3, stone, bo); }
  gT.box(22, 20.6, AZ + 0.5, 0.7, 1.6, 0.7, stone, { bevel: 0.12, melt: 0.5 });
  for (const [x, y, w, h] of [[22, 9.2, 1.5, 2.6], [22, 14.2, 1.1, 1.9]]) { gT.box(x, y + h / 2, AZ - 0.02, w + 0.5, h + 0.5, 0.14, stone, bo); bq(x - w / 2, x + w / 2, y, y + h, AZ - 0.1, dark, K.object); }
  gT.lathe(34, 17, 6, [[1.5, 0], [1.5, 4], [2.0, 4.2], [1.9, 4.5], [1.2, 6.5], [0.2, 10], [0, 10.4]], 10, (u, v) => (v > 0.4 ? C.slate : wash), { melt: 0.5 });
  await S.ctx.yield();
  // starboard: a brick block under red tile, a dark passage, and the two round towers standing forward into the water
  const sb = scl(brick, 0.92), sw = [[-27.4, WY + 0.5, 3.8, 7.4], [-26.3, 2.6, 1.6, 3]];
  for (const x of [-13.4, -38, -41.6]) for (const [y, h] of [[-5.6, 3.2], [2.2, 3.2]]) sw.push([x - 0.8, y, 1.6, h]);
  front(-44, -HW, WY, 10.6, 1.5, sw, sb, K.brick, { eave: 1, depth: 0.6 });
  sq(-HW, -1, 14, WY, 9, 1, sb); sq(-44, 1.5, 14, WY, 9, -1, brick); roofX(-44.5, -HW + 0.5, 0.4, 15.1, 9, 17, C.tile);
  Q(gT, [[-HW, 9, 1.5], [-HW, 9, 14], [-HW, 17, 7.75], [-HW, 17, 7.75]], [1, 0, 0], sb, K.brick, 0.4, [1.5, 9, 14, 9, 7.75, 17, 7.75, 17]);
  bq(-HW, -HW + 0.01, WY, 9, -1, brick);
  ledge(-44, -HW, WY + 0.85, 1.5, 1.7, 0.4, plinthC); ledge(-44, -HW, 0.9, 1.5, 0.3, 0.16, stone); ledge(-44, -HW, 8.55, 1.5, 0.5, 0.6, wash);
  for (const x of [-13.5, -39.5]) gT.box(x, 17.2, 7.75, 1.4, 3.2, 1.4, scl(brick, 0.85), { bevel: 0.1, melt: 0.5, kind: K.brick });
  const tY = [0, 1.7, 1.9, 10, 10.1, 10.5, 10.6, 17, 17.6, 18.9], tR = [3.85, 3.85, 3.6, 3.6, 3.8, 3.8, 3.6, 3.55, 3.95, 3.95], tC = [plinthC, plinthC, sb, sb, stone, stone, sb, sb, wash, wash];
  for (const x of [-19, -32]) {
    gT.lathe(x, WY, -3.5, tY.map((y, i) => [tR[i], y]), 16, (u, v) => tC[Math.round(v * 9)], { melt: 0.55, kind: K.brick, uvf: (u, v) => [u * 22.6, tY[Math.round(v * 9)]] });
    gT.lathe(x, WY + 18.9, -3.5, [[4.4, -0.3], [4.35, 0], [2.7, 4.6], [0.45, 12.2], [0, 12.9]], 16, C.slate, { melt: 0.55, kind: K.roof, uvf: (u, v) => [u * 20, v * 13] });
    for (const y of [-3.2, 3]) { gT.box(x, y + 1.2, -7.1, 1.8, 3.0, 0.24, stone, bo); bq(x - 0.55, x + 0.55, y + 0.15, y + 2.3, -7.24, dark, K.object); }
  }
  await S.ctx.yield();
  // THE YELLOW WALL above the bridge, set back, with its open leaded window; a stepped head in blocks and a tile roof behind
  const YZ = 15, yw = 11;
  bq(-yw, yw, DECK, 22, YZ, C.lemon, K.wash); sq(-yw, YZ, YZ + 14, DECK, 22, -1, mixc(C.lemon, C.ochre, 0.3), K.wash); sq(yw, YZ, YZ + 14, DECK, 22, 1, mixc(C.lemon, C.ochre, 0.3), K.wash);
  // its head: seven crow-steps a man's height each, every one under a weathered stone coping that stands proud, and a finial stone
  const YS = 7, YH = 10.4 / YS;
  for (let i = 0; i < YS; i++) { const ww = yw * 2 * (1 - i / YS), ya = 22 + i * YH;
    gT.box(0, ya + YH / 2, YZ + 0.5, ww, YH, 1.0, C.lemon, { bevel: 0.04, melt: 0.5, kind: K.wash }); gT.box(0, ya + YH + 0.1, YZ + 0.42, ww + 0.7, 0.3, 1.5, scl(stone, i % 2 ? 0.98 : 0.9), { bevel: 0.1, melt: 0.6 }); }
  gT.lathe(0, 22 + 10.4 + 0.2, YZ + 0.5, [[0.5, 0], [0.42, 0.5], [0.6, 0.8], [0.3, 1.5], [0.36, 1.9], [0, 2.4]], 8, stone, { melt: 0.6 });
  ledge(-yw, yw, 21.7, YZ, 0.3, 0.2, stone);
  Q(gT, [[-yw, 22, YZ + 1], [-yw, 22, YZ + 14], [0, 32, YZ + 14], [0, 32, YZ + 1]], [-1, 1, 0], C.tile, K.roof, 0.5, [0, 0, 13, 0, 13, 14, 0, 14]); Q(gT, [[yw, 22, YZ + 1], [yw, 22, YZ + 14], [0, 32, YZ + 14], [0, 32, YZ + 1]], [1, 1, 0], C.tile, K.roof, 0.5, [0, 0, 13, 0, 13, 14, 0, 14]);
  // the window: dark room behind, stone surround, one leaf standing open with its leads, the other shut
  const wx0 = -3.4, wx1 = 3.4, wy0 = 8.5, wy1 = 18, TR = 14.5, fr = [0.2, 0.165, 0.14];
  bq(wx0, wx1, wy0, wy1, YZ - 0.06, mixc(C.slate, C.black, 0.55), K.object);
  for (const [x, y, w, h] of [[0, wy0 - 0.3, 7.8, 0.6], [0, wy1 + 0.3, 7.8, 0.6], [wx0 - 0.3, (wy0 + wy1) / 2, 0.6, wy1 - wy0], [wx1 + 0.3, (wy0 + wy1) / 2, 0.6, wy1 - wy0], [0, (wy0 + wy1) / 2, 0.4, wy1 - wy0], [0, TR + 0.2, 6.8, 0.4]]) gT.box(x, y, YZ - 0.25, w, h, 0.4, x === 0 && w < 7.5 ? fr : stone, { bevel: 0.08, melt: 0.4 });
  Q(gT, [[0.2, wy0, YZ - 0.3], [wx1, wy0, YZ - 0.3], [wx1, TR, YZ - 0.3], [0.2, TR, YZ - 0.3]], [0, 0, -1], [1, 1, 1], K.pane, 0, [0, 0, wx1 - 0.2, 0, wx1 - 0.2, TR - wy0, 0, TR - wy0]);
  for (const [x0, x1] of [[wx0, -0.2], [0.2, wx1]]) Q(gT, [[x0, TR + 0.4, YZ - 0.3], [x1, TR + 0.4, YZ - 0.3], [x1, wy1, YZ - 0.3], [x0, wy1, YZ - 0.3]], [0, 0, -1], [1, 1, 1], K.pane, 0, [0, 0, x1 - x0, 0, x1 - x0, wy1 - TR - 0.4, 0, wy1 - TR - 0.4]);
  const lw = 3.0, ca = Math.cos(1.05), sa = Math.sin(1.05);                                                       // the open leaf, hinged at the port jamb, swung out toward us
  Q(gT, [[wx0, wy0, YZ - 0.3], [wx0 + lw * ca, wy0, YZ - 0.3 - lw * sa], [wx0 + lw * ca, TR, YZ - 0.3 - lw * sa], [wx0, TR, YZ - 0.3]], [0.8, 0, -0.5], [1, 1, 1], K.pane, 0, [0, 0, lw, 0, lw, TR - wy0, 0, TR - wy0]);
  Q(gT, [[wx0 - 0.02, wy0, YZ - 0.3], [wx0 - 0.02 + lw * ca, wy0, YZ - 0.32 - lw * sa], [wx0 - 0.02 + lw * ca, TR, YZ - 0.32 - lw * sa], [wx0 - 0.02, TR, YZ - 0.3]], [-0.8, 0, 0.5], [1, 1, 1], K.pane, 0, [0, 0, lw, 0, lw, TR - wy0, 0, TR - wy0]);
  for (const [t, w] of [[0.04, 0.16], [lw - 0.04, 0.16]]) { const m = new THREE.Matrix4().makeRotationY(1.05).setPosition(wx0 + t * ca, 0, YZ - 0.31 - t * sa); gT.xf = MB.clone().multiply(m); gT.box(0, (wy0 + TR) / 2, 0, w, TR - wy0, 0.1, scl(wash, 0.95), { bevel: 0.03, melt: 0.3 }); }
  gT.xf = MB;
  gT.xf = null;
  // beaded mortar and stone, in clusters of 8 to 25 along what is rough or wet: the plinths at the waterline, the
  // corners, the copings of the steps, the turrets' rings, the arch ring and the parapet; never strewn over a wall
  const TW = (x, r, y0, hh) => (a, b) => { const t = Math.PI * (1 + a); return { P: [x + Math.cos(t) * r, y0 + hh * b, -3.5 + Math.sin(t) * r], N: [Math.cos(t), 0.2, Math.sin(t)], base: plinthC }; };
  const faces = [
    { w: 2.2, L: 1e3, H: 8, f: (a, b) => { const i = Math.min(YS - 1, Math.floor(a * YS)), ww = yw * 2 * (1 - i / YS) + 0.6; return { P: [(b - 0.5) * ww, 22 + (i + 1) * YH + 0.3, YZ - 0.36], N: [0, 0.6, -0.8], base: stone }; } },
    { w: 1.2, L: 22, H: 0.3, f: (a, b) => ({ P: [(a - 0.5) * 22, 21.85 + 0.12 * b, YZ - 0.22], N: [0, 0.5, -0.85], base: stone }) },
    { w: 3, L: 37, H: 1.7, f: (a, b) => ({ P: [HW + 37 * a, WY + 0.15 + 1.7 * b, -1.42], N: [0, 0.2, -1], base: plinthC }) },
    { w: 2, L: 12, H: 1.5, f: (a, b) => ({ P: [16 + 12 * a, WY + 0.15 + 1.5 * b, AZ - 0.37], N: [0, 0.2, -1], base: plinthC }) },
    { w: 2, L: 33, H: 0.3, f: (a, b) => ({ P: [(a < 0.5 ? 16.04 : 27.96) + (b - 0.5) * 0.3, WY + 1.5 + 16.5 * ((a * 2) % 1), AZ - 0.05], N: [0, 0, -1], base: wash }) },
    { w: 2.4, L: 1e3, H: 8, f: (a, b) => { const i = Math.min(4, Math.floor(a * 5)), ww = 12 * (1 - i / 5) + 0.3; return { P: [22 + (b - 0.5) * ww, 7 + (i + 1) * 2.5 + 0.14, AZ - 0.17], N: [0, 0.6, -0.8], base: stone }; } },
    { w: 1.5, L: 17, H: 0.3, f: (a, b) => ({ P: [HW + 0.06 + 0.3 * b, WY + 0.5 + 17 * a, -1.05], N: [-0.5, 0, -0.85], base: brick }) },
    { w: 1.5, L: 37, H: 0.3, f: (a, b) => ({ P: [HW + 37 * a, -2.38 + 0.2 * b, -1.22], N: [0, 0.4, -0.9], base: stone }) },
    { w: 2, L: 12, H: 1.6, f: TW(-19, 3.9, WY + 0.15, 1.6) }, { w: 2, L: 12, H: 1.6, f: TW(-32, 3.9, WY + 0.15, 1.6) },
    { w: 1.2, L: 12, H: 0.5, f: TW(-19, 3.85, WY + 10.1, 0.4) }, { w: 1.2, L: 12, H: 0.5, f: TW(-32, 3.85, WY + 10.1, 0.4) },
    { w: 1.2, L: 12, H: 1.2, f: TW(-19, 4.0, WY + 17.6, 1.2) }, { w: 1.2, L: 12, H: 1.2, f: TW(-32, 4.0, WY + 17.6, 1.2) },
    { w: 2.5, L: 35, H: 1.7, f: (a, b) => ({ P: [-44 + 35 * a, WY + 0.15 + 1.7 * b, 1.08], N: [0, 0.2, -1], base: plinthC }) },
    { w: 1, L: 17, H: 2.5, f: (a, b) => ({ P: [-HW + 0.05, WY + 0.5 + 17 * a, -1 + 2.5 * b], N: [1, 0, -0.2], base: brick }) },
    { w: 2.2, L: 19, H: 0.8, f: (a, b) => { const t = Math.PI * a, r = 6.1 + 0.8 * b; return { P: [r * Math.cos(t), -8 + r * Math.sin(t), -0.33], N: [0, 0, -1], base: stone }; } },
    { w: 1.2, L: 18, H: 0.3, f: (a, b) => ({ P: [(a - 0.5) * 18, DECK + 1.6 + 0.12 * b, -0.52], N: [0, 0.6, -0.8], base: stone }) },
    { w: 1.5, L: 5.2, H: 1.3, f: (a, b) => ({ P: [(a < 0.5 ? -1 : 1) * (6.2 + 2.6 * ((a * 2) % 1)), WY + 0.2 + 1.3 * b, -0.04], N: [0, 0.2, -1], base: stone }) },
  ];
  const c01 = (x) => Math.min(1, Math.max(0, x)), wsum = faces.reduce((t, f) => t + f.w, 0);
  for (let c = 0, nc = Math.round(210 * detail); c < nc; c++) {
    let pick = rng() * wsum, F = faces[0]; for (const f of faces) { pick -= f.w; if (pick <= 0) { F = f; break; } }
    const a0 = rng(), b0 = rng(), m = 8 + Math.floor(rng() * 18), lem = rng() < 0.12;
    for (let k = 0; k < m; k++) {
      let a = c01(a0 + rng.gauss() * 0.7 / F.L); if (F.L === 33 || F.L === 5.2) a = a0 < 0.5 ? Math.min(a, 0.499) : Math.max(a, 0.5);      // a cluster keeps to its own edge
      const q = F.f(a, c01(b0 + rng.gauss() * 0.35 / F.H)), Pr = toRoom(q.P), Nr = dirRoom(q.N);
      S.beads.push([Pr[0] + Nr[0] * 0.04, Pr[1], Pr[2] + Nr[2] * 0.04, Nr[0], Nr[1], Nr[2], ...(lem && rng() < 0.6 ? C.lemon : mixc(C.white, C.sand, 0.3)), ...q.base, 0.045 + 0.06 * rng() * rng(), 1]);
    }
  }
  await S.ctx.yield();
  // THE FAR SIDE OF THE ARCH: the canal behind the bridge, painted along the ray in the opening (KIND.far) and doubled
  // under the water. It lies in shade until the field's gap lands on it with the yellow wall; in the last metres
  // before the bridge it gives way to the opening itself, which is the portal.
  { const gD = new Geo(); gD.xf = MB;
    const rim = [[6, WY], ...inn.slice(1, inn.length - 1), [-6, WY]];
    for (let i = 0; i < rim.length; i++) { const a = rim[i], b = rim[(i + 1) % rim.length]; Q(gD, [[a[0], a[1], -0.25], [b[0], b[1], -0.25], [0, -9, -0.25], [0, -9, -0.25]], [0, 0, -1], [1, 1, 1], K.far, 0); }
    gD.xf = null;
    const bg = gD.build(), mFar = outdoorMaterial(S.U, { far: true }), a = new THREE.Mesh(bg, mFar), b = new THREE.Mesh(bg, mFar);
    a.frustumCulled = b.frustumCulled = false; a.renderOrder = 6; b.renderOrder = 1; b.scale.y = -1; b.position.y = -22; room.add(a, b); }
  await S.ctx.yield();
  // AFTER RAIN the wet roofs and the wet quay double their beads: under every dot of a ridge, an eave or a tide line
  // lies its own dimmer double
  if (S.weather === 'rain') { const rd = S.F['doubles after rain'], dim = (c, b) => mixc(c, b, 0.45);
    for (const [target, list, sand] of [[S.townBeads, S.townBeads.slice(S.townDots), false], [S.beads, S.beads.slice(S.sandGrains[0], S.sandGrains[1]), true]]) {
      for (const d of list) { const o = 0.1 + 0.08 * rd(); target.push([d[0] - (sand ? o : 0.05), d[1] - (sand ? 0 : o), d[2], d[3], d[4], d[5], ...dim([d[6], d[7], d[8]], [d[9], d[10], d[11]]), d[9], d[10], d[11], d[12] * 0.9, 1]); }
      await S.ctx.yield();
    } }
  for (const geo of [S.gTown, gT]) {
    const bg = geo.build(); await S.ctx.yield();
    const town = new THREE.Mesh(bg, S.mOut), mirror = new THREE.Mesh(bg, S.mOut); town.frustumCulled = mirror.frustumCulled = false;
    mirror.scale.y = -1; mirror.position.y = -22; room.add(town, mirror);
  }
  // the limes: crowns, their doubles, and over the crowns one soft veil of the same geometry so no crown has an outline
  const lg = S.gLime.build(); await S.ctx.yield();
  const crowns = new THREE.Mesh(lg, S.mOut), crowns2 = new THREE.Mesh(lg, S.mOut), veil = new THREE.Mesh(lg, outdoorMaterial(S.U, { crown: true }));
  crowns.frustumCulled = crowns2.frustumCulled = veil.frustumCulled = false; crowns2.scale.y = -1; crowns2.position.y = -22; veil.renderOrder = 2;
  room.add(crowns, crowns2, veil);
  room.add(makeBeads(S.townBeads, S.mBead));
}
