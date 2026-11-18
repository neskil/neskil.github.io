// FIREWORKS UNDER THE WASH: a formal pleasure garden on a firework night, drawn in wax on white paper where it can
// hardly be seen, until a flood of blue-black ink sweeps through it from behind and every fountain, wheel and
// palace of fire stands out at once. Wax resist: white cartridge paper, candle / lemon / rose / turquoise / scarlet
// wax, one blue-black ink at three depths. No light, no shadow, no fog, no bloom: bright is bare wax, dark is coats.
//
// Space: one straight axis. World coordinates are the hero's local ones: the fire palace stands at z = 0 facing +z,
// the entry is at z = 300 (s = 0; s = 300 - z is metres along the axis), the hoop and exit portal at z = -80.
// Lawn s -30..18, avenue of twenty fountain pairs s 18..123, wheel terraces s 130..170, basin s 170..300, palace
// s 300, back court s 300..380. The ground falls 6 m from the lawn to the basin.
// Everything is shaded with the hero's style kit (src/parts/fireworks-under-the-wash.js): paperMaterial for ground
// and solids, WaxBatch for every stroke, the one coats() routine in every shader; the bead and rubbed-wax shaders
// below include the same STYLE_GLSL. post.flat = 1: the colour written is the colour shown.
// Staging (pois): the second coat's lip is under the eye by u 0.02; at u 0.08 the gaze looks ahead and a little down, the lip and
// the wet broderie in the lower half and the palace whole on the axis above; it swings to the white peacock standing on a pier of
// the port hedge at u 0.16 (its train falls down the pier's face; the three port fountains before it are low) and returns to the
// palace, seen whole from 9 m up as the fountains part (u 0.25); it holds the palace through the swing over the basin (u 0.42-0.6:
// one swan crosses our bow at 0.524-0.56, the other keeps to starboard) and opens on the rose willows and the rose terrace at
// u 0.6-0.68; the fall is flown through a parting over the arch; the back court is flown dead straight and level at the
// hoop's height, as the brief has it (80 m), so the camera meets the hoop head-on.
// The basin is dark ink with its reflection drawn: under each lit part of the palace one narrow column of broad round-cornered
// zigzags from its foot to our keel, under each willow and wheel a chain in its colour, lanes of bare ink between; each stroke
// is wiped before a swan comes and laid again behind it (reflStroke). The three backruns stand over the palace. The four
// great willows, the far trees' coats and everything else that happens once are keyed to u.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { buildHero, wash, STYLE_GLSL, PAL, WAX_PALETTE, paperMaterial, makeSky, WaxBatch, makeWheels, addScroll, drawRocket } from '../parts/fireworks-under-the-wash.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// the ground: level lawn at y = 6 behind z 285, falling to the basin level (0) by z 150
const groundY = (z) => 6 * sstep(150, 285, z);
// the basin's own measures (the hero's local z): its near rim, and the foot of the fall where its strokes are kicked up off the ink
const BASIN_Z1 = 130, FALL_FOOT = 11.4;

// merged boxes / prisms for the solids (hedges, piers, steps, limes): position + normal only, the paper shader needs no more
function solidBuilder() {
  const pos = [], nor = [], idx = [];
  const quad = (a, b, c, d) => { const i = pos.length / 3, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    pos.push(...a, ...b, ...c, ...d); for (let k = 0; k < 4; k++) nor.push(nx, ny, nz); idx.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  const S = {
    quad,
    // a box whose four top corners may sit at different heights (hedges follow the slope); yb = bottom heights likewise
    box(x0, x1, z0, z1, yt, yb = 0) { const T = typeof yt === 'number' ? [yt, yt, yt, yt] : yt, B = typeof yb === 'number' ? [yb, yb, yb, yb] : yb;   // order: (x0,z0) (x1,z0) (x1,z1) (x0,z1)
      const b = [[x0, B[0], z0], [x1, B[1], z0], [x1, B[2], z1], [x0, B[3], z1]], t = [[x0, T[0], z0], [x1, T[1], z0], [x1, T[2], z1], [x0, T[3], z1]];
      quad(t[0], t[3], t[2], t[1]); quad(b[0], t[0], t[1], b[1]); quad(b[1], t[1], t[2], b[2]); quad(b[2], t[2], t[3], b[3]); quad(b[3], t[3], t[0], b[0]); },
    // a clipped obelisk or cone of n sides: base radius r at y0, apex at y1 (top radius rt)
    spire(x, z, y0, y1, r, n = 4, rt = 0.02, a0 = Math.PI / 4) { for (let k = 0; k < n; k++) { const a = a0 + k * TAU / n, b = a0 + (k + 1) * TAU / n;
      quad([x + Math.cos(a) * r, y0, z + Math.sin(a) * r], [x + Math.cos(a) * rt, y1, z + Math.sin(a) * rt], [x + Math.cos(b) * rt, y1, z + Math.sin(b) * rt], [x + Math.cos(b) * r, y0, z + Math.sin(b) * r]); } },
    geometry() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; },
    get tris() { return idx.length / 3; }, get verts() { return pos.length / 3; },
  };
  return S;
}

export default {
  id: 'fireworks-under-the-wash',
  name: 'Fireworks Under the Wash',
  category: 'city',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary ?? {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(WAX_PALETTE[1]);

    // ---- the edition: every seeded choice is made here, once, before anything is built ----
    const vr = rng.fork('edition');
    // ONE draw picks a whole edition (ink + programme + the paper's weather together), so neighbouring seeds differ at a glance
    const EDITIONS = [['blue-black', 'rose-turquoise', 1], ['blue-black', 'rose-turquoise', 1], ['sepia', 'lemon', 0.2], ['blue-black', 'alternating', 0.2], ['two-coat', 'alternating', 1], ['sepia', 'lemon', 0.2]];
    let ed = EDITIONS[Math.min(5, Math.floor(vr() * 6))]; vr.chance(0.62); vr.pick([0, 1, 2, 3]);
    if (vary.hour === 'dawn' || vary.hour === 'day') ed = EDITIONS[4]; else if (vary.hour === 'night' && ed[0] === 'two-coat') ed = EDITIONS[3];   // asked for daylight, it is the palest night
    const ink = ed[0], programme = ed[1], damp = ed[2];
    const front = vr.chance(0.36) ? 'dome' : 'pediment';
    const peacocks = vr.chance(0.78);                                                 // the cast: peacocks and swans, or swans only
    const rare = !!vary.rare;                                                         // the bouquet
    const palette = WAX_PALETTE.slice();
    if (ink === 'two-coat') { palette[3] = '#243C78'; palette[2] = '#4563A0'; palette[1] = '#93AAD4'; }   // a night left at two coats: bluer
    if (ink === 'sepia') { palette[8] = '#8A5622'; }
    const accentL = programme === 'lemon' ? PAL.LEMON : PAL.ROSE, accentR = programme === 'lemon' ? PAL.LEMON : PAL.TURQ;
    await ctx.yield();

    // where the fronts are at journey u (s = metres along the axis; the palace stands at s 300, the hoop at 380)
    const F2 = [[0, -24], [0.02, 20], [0.05, 45], [0.08, 66], [0.11, 76], [0.14, 86], [0.2, 103], [0.28, 300], [0.36, 470], [0.5, 1200], [1, 1200]];
    const F3 = [[0, -90], [0.28, -60], [0.34, 135], [0.39, 152], [0.415, 164], [0.44, 176], [0.47, 191], [0.55, 256], [0.63, 300], [0.76, 308.6], [0.8, 323], [0.83, 350], [0.85, 370], [0.865, 381], [0.91, 390], [1, 400]];
    const S2 = [[0, -300], [0.008, -40], [0.02, 150], [0.05, 168], [0.08, 182], [0.16, 208], [0.24, 240], [0.28, 270], [0.31, 900], [1, 900]];
    const S3 = [[0, -900], [0.3, -600], [0.34, -150], [0.38, 15], [0.43, 150], [0.47, 300], [0.5, 900], [1, 900]];   // the third coat in the sky: metres ahead of the eye
    const key = (tab, u) => { for (let i = 1; i < tab.length; i++) if (u <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / Math.max(b[0] - a[0], 1e-6); } return tab[tab.length - 1][1]; };
    const schedule = (u) => [key(F2, u), key(F3, u), clamp((u - 0.45) / 0.3, 0, 1)];
    const uOfF3 = (sv) => { for (let i = 1; i < F3.length; i++) if (sv <= F3[i][1]) { const a = F3[i - 1], b = F3[i]; return a[0] + (b[0] - a[0]) * (sv - a[1]) / Math.max(b[1] - a[1], 1e-6); } return 1; };

    // ---- the hero: the fire palace, its fall, basin, flank terraces, wheels and rockets ----
    const hero = await buildHero(ctx, { palette, detail, front, programme: programme === 'lemon' ? 'lemon' : 'rose-turquoise', bouquet: rare, damp, ground: false, driveWash: false, preview: false, zigN: 1, zigAt: (z) => 2, gran: ink === 'two-coat' ? 2.0 : 1 });
    scene.add(hero.object);
    await ctx.yield();
    // this visit's wash, kept here and copied into the shared uniforms just before every drawing of this scene
    // (the style kit's uniforms are module-wide, and the same world can be on screen twice: once here, once in a portal)
    const W = { time: 0, prog: 0, front: new THREE.Vector4(90, -60, -90, 60), pool: 0, damp, gran: ink === 'two-coat' ? 2.0 : 1, sepia: ink === 'sepia' ? 1 : 0, pal: palette.map((h) => new THREE.Color(h)) };
    const sky = makeSky(); scene.add(sky);

    // ---- the path: one straight axis with two gentle drifts ----
    const A = hero.anchors, seat = A.portalSeat.position;
    const path = makePath([
      [0, 10.5, 300], [0, 10.45, 282], [0, 10.05, 263], [0, groundY(245) + 4.4, 245], [0, groundY(226) + 4.1, 226], [0, groundY(206) + 8.4, 206], [0, groundY(190) + 9.4, 190], [0, groundY(174) + 6.6, 174], [0, groundY(160) + 4.2, 160], [0, 3.6, 143], [0, 3.25, 131],
      [2.2, 2.9, 118], [6.6, 2.6, 102], [10.6, 2.5, 86], [13.2, 2.5, 70], [11.6, 2.6, 52], [5.4, 3.1, 31], [0.8, 4.2, 13], [0, 5.4, 2], [0, 7, -10], [0, 8.6, -21], [0, seat.y, -30], [0, seat.y, -55], [0, seat.y, seat.z],
    ]);
    const uOfZ = (z) => { let lo = 0, hi = 1; const p = new THREE.Vector3(); for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; path.pointAt(m, p); if (p.z > z) lo = m; else hi = m; } return (lo + hi) / 2; };
    await ctx.yield();

    // ---- paper: the ground, one sheet, sunk under the basin so the pooled ink lies in it ----
    {
      const xs = [], zs = [];
      for (let x = -700; x <= 700; x += (Math.abs(x) < 140 ? 10 : 80)) xs.push(x);
      for (let z = -700; z <= 760; z += (z >= -130 && z < 340 ? 6 : 70)) zs.push(z);
      const pos = new Float32Array(xs.length * zs.length * 3), nor = new Float32Array(xs.length * zs.length * 3), idx = [];
      for (let j = 0; j < zs.length; j++) for (let i = 0; i < xs.length; i++) { const k = (j * xs.length + i) * 3, x = xs[i], z = zs[j];
        const inBasin = Math.abs(x) < 64 && z > 1 && z < 129;
        pos[k] = x; pos[k + 1] = (inBasin ? -1.4 : groundY(z)) - 0.04; pos[k + 2] = z; nor[k + 1] = 1; }
      for (let j = 0; j + 1 < zs.length; j++) for (let i = 0; i + 1 < xs.length; i++) { const a = j * xs.length + i, b = a + 1, c = a + xs.length, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
      const ground = new THREE.Mesh(g, paperMaterial({ base: 0 })); ground.name = 'paper'; scene.add(ground);
    }
    await ctx.yield();
    const solids = solidBuilder();                       // everything dark and built: one coat more than the ground
    const far = solidBuilder();                          // the far trees: half a coat fewer
    const xr = makeRng(((ctx.seed ?? 1) >>> 0) * 977 + 31);   // a second hand, for marks added later (leaves the first hand's draws as they were)
    const yr = makeRng(((ctx.seed ?? 1) >>> 0) * 1291 + 77);  // and a third, for the marks of the third round
    const zr = makeRng(((ctx.seed ?? 1) >>> 0) * 1543 + 19);  // and a fourth
    const qr = makeRng(((ctx.seed ?? 1) >>> 0) * 1787 + 53);  // and a fifth, for the fourth round's marks (reflections, far trees)
    // a stream of its own for a thing added later: made from the world's seed and a name, it draws from no other stream
    const named = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // four great willows, wept over the basin where the swing of the path opens the flanks: one from each long rim and one
    // behind each wing, rose to port and turquoise to starboard, with their zigzags in the ink beneath them
    const WILLOWS = [{ s: -1, x: -66, z: 36, h: 38, col: PAL.ROSE, ph: 0.6 }, { s: -1, x: -43, z: -24, h: 50, col: PAL.ROSE, ph: 0.82 }, { s: 1, x: 66, z: 36, h: 38, col: PAL.TURQ, ph: 0.74 }, { s: 1, x: 43, z: -24, h: 50, col: PAL.TURQ, ph: 0.52 }];
    const rim = new WaxBatch(2048);                      // the broken candle line along every top and fire-facing edge
    const up = [0, 1, 0];
    // a broken candle line from a to b (a hand's line: strokes of about 2.6 m with gaps, bowed and off the edge)
    const candle = (ax, ay, az, bx, by, bz, o = {}) => { const rng = o.R ?? ctx.rng, L = Math.hypot(bx - ax, by - ay, bz - az), n = Math.max(1, Math.round(L / (o.pitch ?? 2.6))), jj = o.j ?? 0.07;
      for (let i = 0; i < n; i++) { if (rng.chance(o.skip ?? 0.14)) continue; const t0 = (i + rng.range(0.03, 0.14)) / n, t1 = (i + rng.range(0.82, 1.0)) / n, tm = (t0 + t1) / 2, j = rng.range(-jj, jj), bw = rng.range(-0.1, 0.1) * jj / 0.07;
        rim.stroke([lerp(ax, bx, t0), lerp(ay, by, t0) + j, lerp(az, bz, t0)], [lerp(ax, bx, tm), lerp(ay, by, tm) + j + bw, lerp(az, bz, tm)], [lerp(ax, bx, t1), lerp(ay, by, t1) + j, lerp(az, bz, t1)],
          { w: (o.w ?? 0.1) * rng.range(0.8, 1.25), col: o.col ?? PAL.PAPER, kind: 0, seed: rng(), bead: 0.7, n: o.n }); } };

    // ---- the avenue: hedges, box obelisks, pleached limes (dark paper, edged in candle) ----
    const PITCH = 5.25, NF = 20, fz = (i) => 282 - 2.6 - i * PITCH;      // fountain i stands at z = fz(i), x = +-6.5
    for (const s of [-1, 1]) {
      // clipped yew hedge, 4 m high, in bays that follow the slope; every fourth bay a taller pier with a finial
      for (let i = -1; i < NF + 1; i++) { const z0 = 282 - i * PITCH, z1 = z0 - PITCH, g0 = groundY(z0), g1 = groundY(z1), xa = s * 11.6, xb = s * 14.2;
        solids.box(Math.min(xa, xb), Math.max(xa, xb), z1, z0, [g1 + 4, g1 + 4, g0 + 4, g0 + 4], [g1 - 0.3, g1 - 0.3, g0 - 0.3, g0 - 0.3]);
        candle(xa, g0 + 4.02, z0, xa, g1 + 4.02, z1);                                         // the top, fire-facing edge
        if (i === -1) { rim.stroke([s * 11.95, g0 + 0.35, z0 + 0.05], [s * 12.9, g0 + 5.7, z0 + 0.05], [s * 13.85, g0 + 0.35, z0 + 0.05], { n: [0, 0, 1], w: 0.11, col: PAL.PAPER, kind: 0, seed: xr(), bead: 0.8 });   // the end of the hedge, facing the entry: its own niche and edges
          candle(xa, g0 + 4.03, z0 + 0.04, xb, g0 + 4.03, z0 + 0.04, { pitch: 1.4, skip: 0 }); candle(xa, g0 + 0.2, z0 + 0.04, xa, g0 + 4, z0 + 0.04, { pitch: 1.5, skip: 0.05 }); }
        { const gm = (g0 + g1) / 2, xf = xa - s * 0.04, nn = [-s, 0, 0];           // a niche drawn on the wall of each bay: two candle arches
          const train = peacocks && s < 0 && i === 10;                                  // (the peacock's train hangs over this bay: its niche is never drawn)
          for (const [in0, top, w] of [[0.55, 5.9, 0.115], [1.15, 4.7, 0.085]]) rim.stroke([xf, g0 + 0.35, z0 - in0], [xf, gm + top, (z0 + z1) / 2 + rng.range(-0.15, 0.15)], [xf, g1 + 0.35, z1 + in0], { n: nn, w, col: PAL.PAPER, kind: train ? 2 : 0, k0: 5, k1: 6, seed: rng(), bead: 0.8 }); }
        if (!(peacocks && s < 0 && i === 10)) { const xf = xa - s * 0.05, nn = [-s, 0, 0]; candle(xf, g1 + 0.35, z1, xf, g1 + 3.75, z1, { R: qr, pitch: 1.25, skip: 0.1, w: 0.065, n: nn }); candle(xf, g0 + 0.2, z0 - 0.3, xf, g1 + 0.2, z1 + 0.3, { R: qr, pitch: 1.7, skip: 0.2, w: 0.055, n: nn, col: i % 2 ? PAL.LEMON : PAL.PAPER }); }
        if ((i + 2) % 4 === 0) { const zc = z0, gc = groundY(zc); solids.box(Math.min(s * 11.1, s * 14.7), Math.max(s * 11.1, s * 14.7), zc - 1.1, zc + 1.1, gc + 5.3, gc - 0.3); solids.spire(s * 12.9, zc, gc + 5.3, gc + 7.4, 1.25);
          candle(s * 11.1, gc + 0.3, zc + 1.1, s * 11.1, gc + 5.3, zc + 1.1, { pitch: 1.8 }); candle(s * 11.1, gc + 0.3, zc - 1.1, s * 11.1, gc + 5.3, zc - 1.1, { pitch: 1.8 }); candle(s * 11.1, gc + 5.32, zc - 1.1, s * 11.1, gc + 5.32, zc + 1.1, { pitch: 1.2, skip: 0 });
          candle(s * 12.0, gc + 5.4, zc, s * 12.85, gc + 7.4, zc, { pitch: 1.3, skip: 0 }); }
      }
      // forty obelisks of box, one before each fountain gap
      for (let i = 0; i < NF; i++) { const z = fz(i) + PITCH / 2, g = groundY(z), x = s * 9.4; solids.spire(x, z, g - 0.1, g + 3.5, 0.78);
        candle(x - s * 0.55, g + 0.2, z + 0.5, x - s * 0.04, g + 3.45, z + 0.02, { pitch: 1.2, skip: 0.05, w: 0.07 }); }
      // pleached limes: a row of separate clipped heads on bare trunks behind the hedge, sky between them, each with a
      // scalloped candle line over its fire-facing side (the hand's heights are uneven)
      for (let i = 0; i < NF + 1; i++) { const zc = 282 - i * PITCH - PITCH / 2 + xr.range(-0.2, 0.2), g = groundY(zc), xc = s * 19.4, r = xr.range(1.85, 2.2), y0 = g + 6.0 + xr.range(-0.35, 0.45), h = xr.range(3.0, 4.1), a0 = Math.PI / 8;
        solids.spire(xc, zc, y0, y0 + h * 0.42, r * 0.7, 8, r, a0); solids.spire(xc, zc, y0 + h * 0.42, y0 + h * 0.82, r, 8, r * 0.72, a0); solids.spire(xc, zc, y0 + h * 0.82, y0 + h, r * 0.72, 8, 0.02, a0);
        solids.box(xc - 0.22, xc + 0.22, zc - 0.22, zc + 0.22, y0 + 0.5, g - 0.3);
        const xf = xc - s * (r * 0.93 + 0.07), nn = [-s, 0, 0], lo = y0 + 0.35;
        rim.stroke([xf, lo, zc + r * 0.86], [xf, y0 + 1.9 * h - 0.5, zc + xr.range(-0.3, 0.3)], [xf, lo + xr.range(-0.1, 0.2), zc - r * 0.86], { n: nn, w: 0.12, col: PAL.PAPER, kind: 0, seed: xr(), bead: 0.7 });
        if (xr.chance(0.7)) rim.stroke([xf, lo - 0.25, zc + r * 0.6], [xf, lo - 0.45, zc], [xf, lo - 0.25, zc - r * 0.6], { n: nn, w: 0.085, col: PAL.PAPER, kind: 0, seed: xr(), bead: 0.5 });
        if (i % 2 === 0) rim.stroke([xf + s * 0.9, g + 0.4, zc], null, [xf + s * 0.9, y0 - 0.2, zc + xr.range(-0.1, 0.1)], { n: nn, w: 0.07, col: PAL.PAPER, kind: 0, seed: xr(), bead: 0.4 }); }
    }
    await ctx.yield();

    // ---- fire fountains: every stroke is laid base to tip, stands, and sinks while the next is laid ----
    const fnt = new WaxBatch(4096);
    const fountain = (b, x, z, g, side, col, sc, amount, arcs = 9, near = 0, hold = 0) => {
      const P = (o) => ({ w: rng.range(0.07, 0.105) * (0.7 + 0.3 * sc), kind: hold ? 4 : 1, hold, k0: rng(), k1: rng.range(1.5, 2.8), seed: rng(), bead: 0.4, ...o });
      const tint = () => { const r = rng(); return r < 0.34 ? PAL.PAPER : r < 0.5 ? PAL.LEMON + 0.35 : col + rng.range(0.25, 0.5); };
      const n = (k) => Math.max(2, Math.round(k * amount));
      for (let k = n(12); k--;) { const h = rng.range(6.4, 9.4) * sc, lx = rng.range(-0.7, 0.7) * sc, lz = rng.range(-0.7, 0.7) * sc;       // the plume
        b.stroke([x + lx * 0.15, g + 0.05, z + lz * 0.15], [x + lx * 0.3 + rng.range(-0.3, 0.3), g + h * 0.55, z + lz * 0.3], [x + lx, g + h, z + lz], P({ col: tint() })); }
      for (let k = n(arcs); k--;) { const reach = rng.range(3.6, 5.5) * sc, zz = rng.range(-2.5, 2.5) * sc;                                     // arching over the path, meeting overhead
        b.stroke([x, g + 0.05, z], [x - side * rng.range(0.4, 1.5) * sc, g + rng.range(10.2, 12.2) * sc, z + zz * 0.3], [x - side * reach, g + rng.range(8.2, 9.6) * sc, z + zz], P({ col: tint(), kind: near ? 4 : 1, hold: near })); }
      for (let k = n(7); k--;) { const reach = rng.range(1.2, 2.5) * sc, zz = rng.range(-2.2, 2.2) * sc;                                     // falling beside the path
        b.stroke([x, g + 0.05, z], [x - side * reach * 0.45, g + rng.range(6, 9.5) * sc, z + zz * 0.4], [x - side * reach, g + rng.range(0.15, 2.6) * sc, z + zz], P({ col: tint() })); }
      for (let k = n(14); k--;) { const a = rng() * TAU, r = rng.range(1.4, 3.6) * sc, ca = Math.cos(a) * (Math.cos(a) * side < 0 ? 0.55 : 0.8), sa = Math.sin(a);  // thrown out all round (less toward the path: the axis stays open)
        b.stroke([x, g + 0.05, z], [x + ca * r * 0.45, g + rng.range(4.5, 8.2) * sc, z + sa * r * 0.45], [x + ca * r, g + rng.range(0.2, 3.2) * sc, z + sa * r], P({ col: tint() })); }
      for (let k = n(8); k--;) { const a = rng() * TAU, r = rng.range(0.3, 2.4) * sc, y = g + rng.range(5.5, 10) * sc, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;   // dabs thrown off the top
        b.stroke([px, y, pz], null, [px + rng.range(-0.1, 0.1), y - rng.range(0.28, 0.42), pz], P({ col: rng.chance(0.5) ? PAL.PAPER : PAL.LEMON, w: 0.1, k1: rng.range(0.8, 1.4) })); }
    };
    const fAmount = density * (0.7 + 0.3 * detail);
    for (let i = -2; i < NF; i++) { const z = fz(i), g = groundY(z);
      for (const s of [-1, 1]) { const col = programme === 'lemon' ? PAL.LEMON : programme === 'alternating' ? ((i + 2 + (s > 0 ? 1 : 0)) % 2 ? PAL.TURQ : PAL.ROSE) : (s < 0 ? PAL.ROSE : PAL.TURQ);
        const low = peacocks && s < 0 && (i === 8 || i === 9 || i === 10);   // by the peacock's pier: a low fountain either side of the bird and a tuft at the hedge's foot before it
        fountain(fnt, s * 6.5, z, g, s, col, low ? (i === 9 ? 0.22 : 0.46) : i < 14 ? 1 : [0.8, 0.62, 0.48, 0.42, 0.4, 0.4][i - 14], fAmount, low && i < 10 ? 0 : i < 11 ? 8 : i < 13 ? 4 : 0, 36, i < 2 ? 0 : 44); }
      if (i % 4 === 3) await ctx.yield(); }
    // six small candle fountains ringing the hoop in the back court
    for (const [x, z, sc] of [[-9.5, -69, 1.05], [9.5, -69, 1.05], [-13.5, -80, 1.25], [13.5, -80, 1.25], [-9.5, -91, 0.85], [9.5, -91, 0.85]]) fountain(fnt, x, z, 0, Math.sign(x), PAL.PAPER, sc, fAmount * 1.0);
    for (const z of [-16, -27, -38, -49, -60]) for (const s of [-1, 1]) fountain(fnt, s * 7.6, z, 0, s, PAL.LEMON, 0.66, fAmount * 1.05, 6);   // and low ones lighting the way to it
    scene.add(fnt.build({ segs: 6, spacing: 0.12 }));
    await ctx.yield();

    // moths: single candle ticks circling the fountains (the tick is redrawn as it goes; the circle runs on the clock)
    const moths = new WaxBatch(512), nMoth = Math.round(400 * detail * density);
    const mothAt = [[-9.5, -69, 5], [9.5, -69, 5], [-13.5, -80, 5], [13.5, -80, 5], [-7.4, -20, 3.5], [7.4, -20, 3.5], [-7.4, -36, 3.5], [7.4, -36, 3.5], [-7.4, -52, 3.5], [7.4, -52, 3.5], [5, 131.6, 5.5], [-16, 131.6, 5.5], [16, 131.6, 5.5], [27.5, 131.6, 5.5], [-27.5, 131.6, 5.5]];
    for (let k = 0; k < nMoth; k++) { const el = rng.chance(0.3) ? rng.pick(mothAt) : null, i = rng.int(0, NF - 1), s = rng.sign(), cx = el ? el[0] : s * 6.5, cz = el ? el[1] : fz(i), g = groundY(cz), r = rng.range(1.0, el ? 3.2 : 4.6), a = rng() * TAU, y = g + rng.range(1.2, el ? el[2] : 9.5), dir = rng.sign(), L = rng.range(0.22, 0.36);
      const px = cx + Math.cos(a) * r, pz = cz + Math.sin(a) * r, tx = -Math.sin(a) * dir, tz = Math.cos(a) * dir, dy = rng.range(-0.12, 0.12);
      moths.stroke([px, y, pz], [px + tx * L * 0.5, y + dy + 0.08, pz + tz * L * 0.5], [px + tx * L, y + dy, pz + tz * L], { w: 0.05, col: PAL.PAPER, kind: 1, k0: rng(), k1: rng.range(0.45, 0.9), seed: rng(), bead: 0, pivot: [cx, y, cz], spin: dir * rng.range(0.5, 1.5) }); }
    scene.add(moths.build({ segs: 2, spinAxis: new THREE.Vector3(0, 1, 0), pad: 6 }));
    await ctx.yield();

    // ---- broderie: scrolls, dashes and dabs of candle and lemon lying flat, where the ink is seen to refuse the wax ----
    const bands = []; for (let k = 0; k < 6; k++) bands.push(new WaxBatch(1024));
    const bandOf = (z) => bands[z >= 285 ? 0 : z >= 240 ? 1 : z >= 195 ? 2 : z >= 150 ? 3 : z >= 60 ? 4 : 5];
    const beadPts = [];                                   // points on wax near the path where the ink will stand in droplets
    const SC = [[[-1, 0], [-0.2, 1.1], [0.75, 0.25]], [[-1, 0], [-1.3, -0.6], [-0.6, -0.75]], [[0.75, 0.25], [1.15, -0.2], [0.55, -0.4]]];
    const scroll = (x, z, size, ang, col, wmul = 1) => { const g = groundY(z), slope = Math.abs(groundY(z + 1) - groundY(z - 1)) * 0.5, y = g + 0.05 + slope * size * 0.8;
      addScroll(bandOf(z), rng, x, z, size, ang, col, y, wmul);
      if (Math.abs(x) < 15) { const c = Math.cos(ang), s = Math.sin(ang); for (const q of SC) for (const t of [0.22, 0.5, 0.8]) { if (rng.chance(0.45)) continue; const it = 1 - t, u = it * it * q[0][0] + 2 * it * t * q[1][0] + t * t * q[2][0], v = it * it * q[0][1] + 2 * it * t * q[1][1] + t * t * q[2][1];
        beadPts.push([x + (u * c - v * s) * size + rng.range(-0.03, 0.03), y, z + (u * s + v * c) * size + rng.range(-0.03, 0.03), rng()]); } } };
    const pair = (x, z, size, ang, lemon = 0.55, wm = 1) => { scroll(x, z, size * rng.range(0.9, 1.1), ang + rng.range(-0.12, 0.12), rng.chance(lemon) ? PAL.LEMON : PAPERC, wm); scroll(-x, z + rng.range(-0.15, 0.15), size * rng.range(0.9, 1.1), Math.PI - ang + rng.range(-0.12, 0.12), rng.chance(lemon) ? PAL.LEMON : PAPERC, wm); };
    const PAPERC = PAL.PAPER;
    // a line of pressed dabs (25-40 cm, fat, a little off the line)
    const dabs = (x0, z0, x1, z1, col, pitch = 0.85) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / pitch)), dx = (x1 - x0) / L, dz = (z1 - z0) / L;
      for (let i = 0; i < n; i++) { if (rng.chance(0.08)) continue; const t = (i + 0.5 + rng.range(-0.2, 0.2)) / n, x = lerp(x0, x1, t) + rng.range(-0.06, 0.06), z = lerp(z0, z1, t) + rng.range(-0.06, 0.06), h = rng.range(0.13, 0.21), tr = rng.range(-0.35, 0.35), ex = dx - dz * tr, ez = dz + dx * tr, y = groundY(z) + 0.06;
        bandOf(z).stroke([x - ex * h, y, z - ez * h], null, [x + ex * h, y, z + ez * h], { n: up, w: rng.range(0.1, 0.15), col: rng.chance(0.2) ? PAL.PAPER : col, kind: 0, seed: rng(), bead: 1 });
        if (Math.abs(x) < 15 && rng.chance(0.3)) beadPts.push([x, y, z, rng()]); } };
    const bro = 0.6 + 0.4 * detail;
    // the lawn (s -30..18): open, a wide figure either side of the axis
    { let k = 0; for (let z = 328; z > 284; z -= 3.3 / bro) { const row = k++ % 2;
        for (const x of row ? [1.9, 6.2, 10.6, 15.2, 21, 28, 36] : [4.0, 8.4, 12.9, 18, 24.5, 32]) pair(x + rng.range(-0.3, 0.3), z + rng.range(-0.3, 0.3), x > 16 ? rng.range(1.5, 2.1) : rng.range(1.15, 1.6), row ? 0.6 : 2.2, 0.66, 1.45);
        if (k % 4 === 0) await ctx.yield(); }
      for (const x of [-16.6, 16.6, -38, 38]) dabs(x, 329, x, 284.5, PAL.LEMON); dabs(-38, 329, 38, 329, PAL.LEMON, 1.1);
      for (const x of [-5.45, 5.45, -7.5, 7.5]) dabs(x, 327, x, 283.5, PAL.LEMON, 0.8); }
    await ctx.yield();
    // the avenue (s 18..123): a parterre down the middle, under the path, and a strip behind each row of fountains
    { let k = 0; for (let z = 281; z > 177; z -= 1.75 / bro) { const row = k++ % 3, big = z > 246;   // the first of it, seen from high up at the entry, is drawn larger and mostly lemon
        if (big && k % 2) continue;
        for (const x of big ? [row === 1 ? 2.3 : row ? 3.5 : 1.9] : row === 0 ? [1.0, 3.9] : row === 1 ? [2.5] : [1.4, 4.2]) pair(x + rng.range(-0.15, 0.15), z, rng.range(0.7, 1.0) * (big ? 1.6 : 1), row === 1 ? 1.57 + rng.range(-0.2, 0.2) : row ? 0.5 : 2.4, big ? 0.85 : 0.55, big ? 1.8 : 1);
        if (row === 1) pair(8.3, z, rng.range(0.6, 0.8), 1.2, 0.3);
        if (k % 8 === 0) await ctx.yield(); }
      for (const x of [-5.45, 5.45, -7.5, 7.5, -10.9, 10.9]) dabs(x, 283, x, 176, Math.abs(x) > 10 ? PAL.PAPER : PAL.LEMON, Math.abs(x) > 6 ? 1.1 : 0.8);
      for (const x of [-16.1, 16.1, -23.6, 23.6]) dabs(x, 283, x, 176, PAL.LEMON, 1.5);
      for (let z = 280; z > 178; z -= 5.25 / bro) pair(27.5 + rng.range(-0.5, 0.5), z, rng.range(1.3, 1.8), 1.0, 0.6);
      for (let k = 0, z = 279; z > 208; z -= yr.range(7.5, 9.5), k++) { const sd = k % 2 ? 1 : -1, sz = yr.range(2.6, 3.3);   // the lawn's figure: large lemon and candle scrolls, read from the entry before any ink reaches them
        scroll(sd * yr.range(2.6, 3.4), z, sz, sd > 0 ? 0.7 + yr.range(-0.2, 0.2) : 2.4 + yr.range(-0.2, 0.2), k % 3 === 2 ? PAL.PAPER : PAL.LEMON, 2.5); scroll(-sd * yr.range(8.6, 9.4), z - 3, sz * 0.62, yr.range(0, TAU), k % 3 === 0 ? PAL.PAPER : PAL.LEMON, 2.1); } }
    await ctx.yield();
    // between the wheel terraces and up to the balustrade (s 123..170)
    { let k = 0; for (let z = 175; z > 134; z -= 2.1 / bro) { const row = k++ % 2;
        for (const x of row ? [1.3, 4.4, 7.6] : [2.9, 6.0, 9.6, 12.6]) pair(x + rng.range(-0.2, 0.2), z, rng.range(0.75, 1.1), row ? 0.9 : 2.1);
        if (k % 6 === 0) await ctx.yield(); }
      for (const x of [-13.9, 13.9]) dabs(x, 172, x, 133.5, PAL.LEMON); dabs(-13.9, 175.5, -5.5, 175.5, PAL.PAPER); dabs(5.5, 175.5, 13.9, 175.5, PAL.PAPER);
      dabs(-13.9, 132.9, 13.9, 132.9, PAL.LEMON, 0.7); dabs(-13.2, 133.5, 13.2, 133.5, PAL.PAPER, 1.1);                    // a border along the foot of the balustrade
      for (const z of [147.5, 143.6, 139.8, 136.2]) for (const x of [-11.2, -8.1, -5.0, -1.8, 1.4, 4.6, 7.8, 10.9]) { const xx = x + xr.range(-0.3, 0.3) + (z % 2 > 1 ? 0.8 : -0.4);
        scroll(xx, z + xr.range(-0.35, 0.35), xr.range(0.62, 0.9), xr.range(0, TAU), xr.chance(0.5) ? PAL.LEMON : PAL.PAPER, 1.15); } }
    // the back court (s 300..380), seen whole from the arch 80 m off and from 9 m up: a parterre with one figure.
    // Half-rings of broad pressed strokes round the hoop (they foreshorten to nested curves that lead to it), a few
    // large scrolls between them, two lemon lines down the axis; nothing here is finer than the side of the crayon.
    { const flatStroke = (p0, pm, p1, w, col) => { bandOf(p0[1]).stroke([p0[0], 0.06, p0[1]], [pm[0], 0.06, pm[1]], [p1[0], 0.06, p1[1]], { n: up, w, col, kind: 0, seed: xr(), bead: 1 });
        if (Math.abs(pm[0]) < 15) for (const t of [0.2, 0.5, 0.8]) if (xr.chance(0.6)) beadPts.push([lerp(p0[0], p1[0], t) + xr.range(-0.05, 0.05), 0.06, lerp(p0[1], p1[1], t) + xr.range(-0.05, 0.05), xr()]); };
      let ri = 0; for (const r of [11.5, 19.5, 28, 37.5, 48]) { const lem = ri++ % 2 === 0, n = Math.round(Math.PI * 1.15 * r / 6.2), R = (a, rr) => [Math.sin(a) * rr, -80 + Math.cos(a) * rr];
        for (let i = 0; i < n; i++) { const a0 = -1.8 + 3.6 * (i + xr.range(0.06, 0.16)) / n, a1 = -1.8 + 3.6 * (i + xr.range(0.8, 0.94)) / n, am = (a0 + a1) / 2, jr = xr.range(-0.25, 0.25), p0 = R(a0, r + jr), p1 = R(a1, r + jr), pm = R(am, (r + jr) / Math.cos((a1 - a0) / 2) + xr.range(-0.2, 0.2));
          if (pm[1] > -8.5 || Math.abs(pm[0]) > 47 || (pm[1] < -80 && r > 26) || xr.chance(0.07)) continue;
          flatStroke(p0, pm, p1, xr.range(0.22, 0.3), xr.chance(0.2) ? (lem ? PAL.PAPER : PAL.LEMON) : (lem ? PAL.LEMON : PAL.PAPER)); }
        await ctx.yield(); }
      for (const [r, size] of [[15.5, 2.2], [23.7, 2.7], [32.7, 3.1], [42.7, 3.4]]) { const n = Math.round(Math.PI * 1.1 * r / (size * 2.45));
        for (let i = 0; i < n; i++) { const a = -1.72 + 3.44 * (i + 0.5) / n + xr.range(-0.03, 0.03), x = Math.sin(a) * r, z = -80 + Math.cos(a) * r; if (z > -11 || Math.abs(x) > 45 || (z < -80 && r > 25) || Math.abs(x) < 6.2) continue;
          scroll(x, z, size * xr.range(0.9, 1.1), -a + (i % 2 ? 0.5 : 2.6) + xr.range(-0.2, 0.2), xr.chance(0.5) ? PAL.LEMON : PAL.PAPER, 1.9); } }
      for (const z of [-13.5, -22, -30.5]) for (let x = 9.5; x < 46; x += 8.6) { if (Math.hypot(x, z + 80) < 50.5) continue; const sz = xr.range(2.3, 2.9), ang = xr.range(0.5, 2.6);
        scroll(x + xr.range(-0.5, 0.5), z + xr.range(-0.5, 0.5), sz, ang, xr.chance(0.5) ? PAL.LEMON : PAL.PAPER, 1.9); scroll(-x + xr.range(-0.5, 0.5), z + xr.range(-0.5, 0.5), sz, Math.PI - ang, xr.chance(0.5) ? PAL.LEMON : PAL.PAPER, 1.9); }
      for (const x of [-4.3, 4.3]) for (let z = -11; z > -66; z -= 3.6) { if (xr.chance(0.06)) continue; const j = xr.range(-0.12, 0.12); flatStroke([x + j, z - xr.range(0.1, 0.4)], [x + j + xr.range(-0.15, 0.15), z - 1.6], [x + j, z - xr.range(2.8, 3.2)], xr.range(0.17, 0.22), xr.chance(0.15) ? PAL.PAPER : PAL.LEMON); }
      for (const a of [0.5, 0.95, 1.38]) for (const s of [-1, 1]) { const r1 = Math.min(47.5, 70 / Math.max(Math.cos(a), 0.1), 46 / Math.sin(a));   // rays of pressed dabs running in to the hoop
        dabs(s * Math.sin(a) * 12.5, -80 + Math.cos(a) * 12.5, s * Math.sin(a) * r1, -80 + Math.cos(a) * r1, a > 0.9 ? PAL.PAPER : PAL.LEMON, 1.5); }
      for (const z of [-1.4, -5.0, -8.4]) for (const x of [2.5, 6.2]) { const sz = xr.range(1.15, 1.45), ang = xr.range(0.6, 2.4);
        scroll(x + xr.range(-0.2, 0.2), z + xr.range(-0.2, 0.2), sz, ang, xr.chance(0.6) ? PAL.LEMON : PAL.PAPER, 1.5); scroll(-x + xr.range(-0.2, 0.2), z + xr.range(-0.2, 0.2), sz, Math.PI - ang, xr.chance(0.6) ? PAL.LEMON : PAL.PAPER, 1.5); }
      for (const z of [1.3, -10.2]) for (let x = -7.6; x < 7; x += 3.1) flatStroke([x + xr.range(0.1, 0.4), z], [x + 1.5, z + xr.range(-0.15, 0.15)], [x + xr.range(2.5, 2.9), z], xr.range(0.15, 0.2), z > 0 ? PAL.PAPER : PAL.LEMON);
      for (const x of [-28.6, 28.6]) dabs(x, -11, x, -40, PAL.PAPER, 0.9); dabs(-44, -10, 44, -10, PAL.PAPER, 1.0); }
    await ctx.yield();
    for (const b of bands) if (b.n) scene.add(b.build({ segs: b === bands[5] ? 5 : 3, fringe: true, margin: b === bands[5] ? 3.6 : 5, minPx: b === bands[5] ? 1.45 : 0.75 }));
    await ctx.yield();

    // ---- the wheel terraces (s 130..170): three steps climbing away either side, five wheels a side turning on nothing ----
    const wheelAt = [[9.6, 5.0, 167, 4.0], [16.5, 1.1 + 5.3, 159, 4.0], [10.6, 5.3, 150.5, 3.8], [22, 2.2 + 5.6, 146, 4.2], [13, 5.6, 138.5, 3.9]];
    const wheelHubs = [];
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const xa = s * (15 + 5.5 * k), xb = s * 62, z0 = 134 + k * 1.6, z1 = 170 - k * 1.6, h = 1.1 * (k + 1);
        solids.box(Math.min(xa, xb), Math.max(xa, xb), z0, z1, h, -0.5);
        candle(xa, h + 0.03, z0, xa, h + 0.03, z1); candle(xa, h + 0.03, z1, xb, h + 0.03, z1, { skip: 0.25 }); candle(xa, h - 1.05, z1, xa, h, z1, { pitch: 1.1, skip: 0 }); }
      const yaw = -s * 0.5, c = Math.cos(yaw), sn = Math.sin(yaw);
      const list = wheelAt.map((w, i) => { const X = s * w[0], Z = w[2], r = w[3] * rng.range(0.94, 1.06); wheelHubs.push(new THREE.Vector4(X, w[1], Z, r));
        const acc = s < 0 ? accentL : accentR; return { c: [X * c - Z * sn, w[1], X * sn + Z * c], r, col: acc === PAL.LEMON ? (i % 2 ? PAL.PAPER : PAL.LEMON) : acc, plain: acc === PAL.LEMON, dir: -s }; });
      const wg = makeWheels(rng, list); wg.rotation.y = yaw; scene.add(wg);
      await ctx.yield();
    }

    // ---- the head of the basin: a balustrade with urn piers (the peacock's pier is the first to port) ----
    const urns = new WaxBatch(512);
    const pier = (x, z, h = 2.0, flame = true) => { const g = groundY(z);
      solids.box(x - 0.7, x + 0.7, z - 0.7, z + 0.7, g + h, g - 0.4);
      if (Math.abs(x) < 17 && z > 120) {                 // the piers we pass at arm's length are drawn as pedestals: arrises, cap and base mouldings, an inset panel on every face
        const t = g + h, b = g + 0.1, q = 0.72, O = { R: yr, pitch: 0.95, skip: 0, w: 0.05, j: 0.025 };
        for (const [dx, dz] of [[-q, q], [q, q], [-q, -q], [q, -q]]) candle(x + dx, b, z + dz, x + dx, t, z + dz, O);
        for (const [ax, az, bx, bz] of [[-q, q, q, q], [q, q, q, -q], [q, -q, -q, -q], [-q, -q, -q, q]]) { const nn = [(ax + bx) / (2 * q), 0, (az + bz) / (2 * q)];
          candle(x + ax * 1.06, t + 0.03, z + az * 1.06, x + bx * 1.06, t + 0.03, z + bz * 1.06, { ...O, w: 0.07 }); candle(x + ax, t - 0.24, z + az, x + bx, t - 0.24, z + bz, { ...O, w: 0.035, col: PAL.LEMON, n: nn });
          candle(x + ax, b + 0.22, z + az, x + bx, b + 0.22, z + bz, { ...O, w: 0.04, n: nn });
          const cx = x + nn[0] * (q + 0.02), cz = z + nn[2] * (q + 0.02), tx = nn[2], tz = -nn[0], P4 = (u, y) => [cx + tx * u, y, cz + tz * u];
          for (const [u0, y0, u1, y1] of [[-0.42, b + 0.5, -0.42, t - 0.5], [0.42, b + 0.5, 0.42, t - 0.5], [-0.42, t - 0.5, 0.42, t - 0.5], [-0.42, b + 0.5, 0.42, b + 0.5]]) { const A = P4(u0, y0), C = P4(u1, y1);
            rim.stroke(A, [(A[0] + C[0]) / 2 + yr.range(-0.03, 0.03), (A[1] + C[1]) / 2 + yr.range(-0.03, 0.03), (A[2] + C[2]) / 2], C, { n: nn, w: 0.035, col: PAL.LEMON, kind: 0, seed: yr(), bead: 0.8 }); } }
      } else {
      for (const [dx, dz] of [[-0.7, 0.7], [0.7, 0.7]]) candle(x + dx, g + 0.1, z + dz, x + dx, g + h, z + dz, { pitch: 1.0, skip: 0.05, w: 0.1 });
      candle(x - 0.75, g + h + 0.02, z + 0.7, x + 0.75, g + h + 0.02, z + 0.7, { pitch: 0.8, skip: 0, w: 0.14 });
      rim.stroke([x - 0.4, g + 0.25, z + 0.72], [x, g + h * 1.25, z + 0.72], [x + 0.4, g + 0.25, z + 0.72], { n: [0, 0, 1], w: 0.085, col: PAL.LEMON, kind: 0, seed: xr(), bead: 0.8 }); }  // a panel on the face
      if (!flame) return;
      const y0 = g + h, prof = (t) => (t < 0.25 ? 0.42 - t * 0.9 : t < 0.9 ? 0.2 + 0.42 * Math.sin((t - 0.25) / 0.65 * Math.PI * 0.5) : 0.62 - (t - 0.9) * 0.9);
      for (const q of [-1, 1]) for (let k = 0; k < 4; k++) { const t0 = k * 0.3, t1 = t0 + 0.27; urns.stroke([x + q * prof(t0), y0 + t0, z + 0.2], null, [x + q * prof(t1), y0 + t1, z + 0.2], { w: 0.07, col: PAL.PAPER, kind: 0, seed: rng(), bead: 0.6 }); }
      urns.stroke([x - 0.5, y0 + 1.2, z + 0.2], [x, y0 + 1.12, z + 0.2], [x + 0.5, y0 + 1.2, z + 0.2], { w: 0.07, col: PAL.LEMON, kind: 0, seed: rng(), bead: 0.6 });
      const per = rng.range(1.2, 1.8), ph = rng();
      for (let k = 0; k < 7; k++) { const lean = (k - 3) * 0.33 + rng.range(-0.15, 0.15), hg = rng.range(1.6, 3.4) * (k === 3 ? 1.2 : 1);
        urns.stroke([x + lean * 0.2, y0 + 1.2, z + 0.2], [x + lean, y0 + 1.2 + hg * 0.55, z + 0.2 + rng.range(-0.3, 0.3)], [x + lean * 0.5 + rng.range(-0.3, 0.3), y0 + 1.2 + hg, z + 0.2 + rng.range(-0.4, 0.4)], { w: 0.085, col: (k % 2 ? PAL.LEMON : PAL.PAPER) + 0.3, kind: 1, k0: (ph + k * 0.15) % 1, k1: per, seed: rng(), bead: 0 }); } };
    const PIER = [-5, 2.0, 131.6];                        // the peacock's pier: x, top height, z
    for (const s of [-1, 1]) {
      const xs = [5, 16, 27.5, 39, 51, 64.5];
      for (let i = 0; i < xs.length; i++) { pier(s * xs[i], 131.6, 2.0, !(s < 0 && i === 0));
        if (i + 1 < xs.length) { const xa = s * (xs[i] + 0.7), xb = s * (xs[i + 1] - 0.7); solids.box(Math.min(xa, xb), Math.max(xa, xb), 131.35, 131.85, 1.15, -0.3);
          candle(xa, 1.18, 131.87, xb, 1.18, 131.87, { skip: 0.06, w: i > 0 ? 0.15 : 0.07, pitch: 2.2 }); if (i === 0) candle(xa, 1.18, 131.33, xb, 1.18, 131.33, { R: yr, skip: 0.06, w: 0.07, pitch: 2.2 }); candle(xa, 1.42, 131.6, xb, 1.42, 131.6, { skip: 0.2, w: 0.075, pitch: 1.7, col: PAL.LEMON }); candle(xa, 0.1, 131.9, xb, 0.1, 131.9, { skip: 0.3, w: 0.09 });
          for (let x = Math.min(xa, xb) + 0.5; x < Math.max(xa, xb) - 0.3; x += 0.95) { const tx = x + rng.range(-0.04, 0.04), sk = rng.chance(0.06), a1 = rng.range(0.03, 0.14), a2 = rng.range(0.82, 1.0), a3 = rng.range(-0.07, 0.07), a4 = rng.range(-0.1, 0.1);
            if (i > 0) { if (!sk) rim.stroke([x, 0.2 + a1 * 0.8 + a3, 131.87], [(x + tx) / 2, 0.6 + a3 + a4, 131.87], [tx, 0.2 + a2 * 0.8 + a3, 131.87], { w: 0.115, col: PAL.PAPER, kind: 0, seed: rng(), bead: 0.7 }); else rng(); continue; }
            rng(); for (const zf of [131.87, 131.33]) for (const q of [-1, 1]) rim.stroke([x + q * 0.09, 0.2, zf], [x + q * 0.42, 0.52 + a3, zf], [tx + q * 0.07, 1.04, zf], { n: [0, 0, zf > 131.6 ? 1 : -1], w: 0.034, col: PAL.PAPER, kind: 0, seed: yr(), bead: 0.7 });
            rim.stroke([x - 0.16, 0.17, 131.87], null, [x + 0.16, 0.17, 131.87], { n: [0, 0, 1], w: 0.04, col: PAL.PAPER, kind: 0, seed: yr(), bead: 0.5 }); }
          if (Math.abs(xa) < 40) for (let x = Math.min(xa, xb) + 1.6; x < Math.max(xa, xb) - 1.2; x += 2.85) { const per = xr.range(1.1, 1.7), ph = xr();       // candle ends burning along the coping
            for (let k = 0; k < 3; k++) { const lean = (k - 1) * 0.22 + xr.range(-0.08, 0.08), hg = xr.range(0.7, 1.25) * (k === 1 ? 1.25 : 1);
              urns.stroke([x + lean * 0.3, 1.42, 131.6], [x + lean, 1.42 + hg * 0.55, 131.6], [x + lean * 0.4 + xr.range(-0.1, 0.1), 1.42 + hg, 131.6], { w: 0.075, col: (k === 1 ? PAL.PAPER : PAL.LEMON) + 0.3, kind: 1, k0: (ph + k * 0.3) % 1, k1: per, seed: xr(), bead: 0 }); } } } }
      for (const z of [108, 86, 64, 42, 20]) pier(s * 67.2, z, 1.8, true);                    // piers down the long sides of the basin
    }
    // the crowd, implied: two rows of candle dots along the far balustrades at the palace foot
    for (const s of [-1, 1]) for (const [y, z] of [[1.25, 30.5], [2.3, 29.2]]) for (let x = 67.5; x < 111; x += rng.range(0.55, 0.9)) urns.stroke([s * x, y + rng.range(0, 0.2), z], null, [s * x + rng.range(-0.05, 0.05), y + rng.range(0.28, 0.4), z], { w: 0.1, col: PAL.PAPER, kind: 1, k0: rng(), k1: rng.range(3, 6), seed: rng(), bead: 0 });
    // rockets behind the yew, left and right of the hoop (never behind the disc): each one broad stroke up and a willow wept
    // clockwise a stroke at a time, rose to port and turquoise to starboard, lifted and laid again on the clock
    const courtRk = new WaxBatch(128);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const x = s * (25 + k * 9.5 + xr.range(-1.5, 1.5)), z = xr.range(-118, -100) - k * 2, h = xr.range(27, 37) - k * 1.5;
      drawRocket(courtRk, xr, x, z, h, s < 0 ? PAL.ROSE : PAL.TURQ, 0, 0, false, { w: 0.3, n: 8, spread: xr.range(0.2, 0.26), drop: 0.95, y0: 0, loop: { per: xr.range(4.0, 5.6), ph: (k * 0.27 + (s > 0 ? 0.13 : 0) + xr.range(0, 0.1)) % 1 } }); }
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const x = s * (64 + k * 24 + xr.range(-4, 4)), z = xr.range(-150, -128), h = xr.range(50, 66);      // and two taller, farther off, for the view from the arch
      drawRocket(courtRk, xr, x, z, h, s < 0 ? PAL.ROSE : PAL.TURQ, 0, 0, false, { w: 0.42, n: 9, spread: xr.range(0.2, 0.25), drop: 0.9, y0: 0, loop: { per: xr.range(4.8, 6.4), ph: (0.4 + k * 0.33 + (s > 0 ? 0.2 : 0)) % 1 } }); }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = s * (73 + k * 15 + xr.range(-3, 3)), z = xr.range(-4, 20), h = xr.range(40, 50) - k * 3 + (k === 1 ? 9 : 0);
      drawRocket(courtRk, xr, x, z, h, s < 0 ? PAL.ROSE : PAL.TURQ, 0, 0, false, { w: 0.34, n: 8, spread: xr.range(0.22, 0.27), drop: 0.95, y0: 6, loop: { per: xr.range(5.4, 7.4), ph: (k * 0.31 + (s > 0 ? 0.17 : 0) + xr.range(0, 0.1)) % 1 } }); }
    // the four great willows are keyed to u like every rocket that belongs to the journey (never to the clock, so every flight
    // sees them where the stills do): each is launched again and again, every 0.075 of the journey, one stroke up and thirteen
    // wept clockwise over about three seconds, standing while the next rocket climbs beside it; so from the first frame to the
    // fall each willow always has two thirds of its strokes wept or more
    { const spent = new WaxBatch(64), wr = makeRng(((ctx.seed ?? 1) >>> 0) * 2003 + 11);
      for (const W of WILLOWS) { const per = zr.range(6.4, 7.6), o = { w: W.z < 0 ? 0.5 : 0.44, n: 13, spread: W.z < 0 ? 0.3 : 0.34, drop: 1.25, y0: W.z < 0 ? 6 : 0, yaw: W.z < 0 ? 0 : Math.atan2(0.83, W.s * 0.55), trunk: W.col + 0.45 };
        drawRocket(spent, zr, W.x, W.z, W.h, W.col, 0, 0, false, { ...o, step: 0.017, loop: { per, ph: 0 } });      // (the fourth hand's draws stay as they were)
        for (let i = 0; i < 11; i++) drawRocket(courtRk, wr, W.x + wr.range(-1.2, 1.2), W.z, W.h * wr.range(0.94, 1.05), W.col, -0.04 + W.ph * 0.03 + i * 0.075, 0.0125, false, o); } }
    scene.add(courtRk.build({ segs: 10, minPx: 1.5 }));
    // the court's wet floor carries a drawn sheen like the basin's: level candle glints laid and lifted
    const cgl = new WaxBatch(512);
    for (let i = Math.round(170 * detail); i--;) { const z = xr.range(-78, -5), x = xr.range(-1, 1) * (10 + 30 * xr()), L = xr.range(2.6, 6.5), bw = xr.range(-0.1, 0.1);
      if (Math.hypot(x, z + 80) < 9.5) continue; cgl.stroke([x - L / 2, 0.07, z], [x, 0.07, z + bw], [x + L / 2, 0.07, z + xr.range(-0.08, 0.08)], { n: up, w: xr.range(0.07, 0.11), col: xr.chance(0.2) ? PAL.LEMON : PAL.PAPER, kind: 1, k0: xr(), k1: xr.range(1.6, 3.4), seed: xr(), bead: 0 }); }
    scene.add(cgl.build({ segs: 3, minPx: 1.0 }));
    await ctx.yield();

    // ---- the back court: a half-round of yew behind the hoop, with obelisk finials ----
    { const R0 = 29, R1 = 32.5, N = 22, hy = 16;
      for (let i = 0; i < N; i++) { const a0 = Math.PI * (i / N), a1 = Math.PI * ((i + 1) / N), am = (a0 + a1) / 2, p = (r, a) => [Math.cos(a) * r, -80 - Math.sin(a) * r];
        const A0 = p(R0, a0), A1 = p(R0, a1), B0 = p(R1, a0), B1 = p(R1, a1);
        solids.quad([A0[0], -0.3, A0[1]], [A1[0], -0.3, A1[1]], [A1[0], hy, A1[1]], [A0[0], hy, A0[1]]);              // the inner face, toward the hoop
        solids.quad([A0[0], hy, A0[1]], [A1[0], hy, A1[1]], [B1[0], hy, B1[1]], [B0[0], hy, B0[1]]);
        solids.quad([B1[0], -0.3, B1[1]], [B0[0], -0.3, B0[1]], [B0[0], hy, B0[1]], [B1[0], hy, B1[1]]);
        candle(A0[0], hy + 0.04, A0[1], A1[0], hy + 0.04, A1[1], { skip: 0.04, w: 0.33, pitch: 2.1 }); candle(A0[0] * 0.99, hy - 0.75, A0[1] + 0.2, A1[0] * 0.99, hy - 0.75, A1[1] + 0.2, { skip: 0.3, w: 0.13, pitch: 2.1, col: PAL.LEMON }); candle(B0[0], hy + 0.04, B0[1], B1[0], hy + 0.04, B1[1], { skip: 0.4, w: 0.12 });
        candle(A0[0] * 0.995, 0.3, A0[1] + 0.1, A0[0] * 0.995, hy - 0.5, A0[1] + 0.1, { pitch: 1.9, skip: 0.12, w: 0.17 });
        // the heavy top line, the side of the crayon: it stands a little inside the wall and clear above it, so the half-round is told by it from the arch
        { const T0 = p(R0 - 0.5, a0 - 0.012), T1 = p(R0 - 0.5, a1 + 0.012), Tm = p(R0 - 0.5, am), ok = xr.chance(0.9), dy = xr.range(-0.2, 0.3), sd = xr();
          if (ok) rim.stroke([T0[0], hy + 0.75, T0[1]], [Tm[0], hy + 0.75 + dy, Tm[1]], [T1[0], hy + 0.75, T1[1]], { w: 1.1, col: i % 4 === 1 ? PAL.LEMON : PAL.PAPER, kind: 5, k0: 44, k1: 78, seed: sd, bead: 0 });
          if (i % 3 !== 1 && Math.abs(Math.cos(a1)) > 0.4) { const m = p(R0 + 0.8, a1), per = yr.range(1.2, 1.8), ph = yr();      // candle ends burning along the top, between the obelisks (none behind the disc)
            for (let k = 0; k < 3; k++) { const lean = (k - 1) * 0.5 + yr.range(-0.15, 0.15), hg = yr.range(2.2, 3.8) * (k === 1 ? 1.25 : 1);
              urns.stroke([m[0] + lean * 0.3, hy + 0.6, m[1]], [m[0] + lean, hy + 0.6 + hg * 0.55, m[1]], [m[0] + lean * 0.4 + yr.range(-0.2, 0.2), hy + 0.6 + hg, m[1]], { w: 0.17, col: (k === 1 ? PAL.PAPER : PAL.LEMON) + 0.3, kind: 1, k0: (ph + k * 0.3) % 1, k1: per, seed: yr(), bead: 0 }); } } }
        if (i % 2 === 0) { const f0 = [Math.cos(a0 + 0.03) * (R0 - 0.1), -80 - Math.sin(a0 + 0.03) * (R0 - 0.1)], f1 = [Math.cos(a1 + (a1 - a0) - 0.03) * (R0 - 0.1), -80 - Math.sin(a1 + (a1 - a0) - 0.03) * (R0 - 0.1)], fm = [Math.cos(a1) * (R0 - 0.1), -80 - Math.sin(a1) * (R0 - 0.1)];
          rim.stroke([f0[0], 0.6, f0[1]], [fm[0], hy * 1.5, fm[1]], [f1[0], 0.6, f1[1]], { w: 0.5, col: PAL.PAPER, kind: 5, k0: 52, k1: 86, seed: xr(), bead: 0 }); }
        // the niche: two candle arches on the wall of each bay, as on the avenue hedges
        const q = (t, y, r = R0 - 0.07) => { const a = a0 + (a1 - a0) * t; return [Math.cos(a) * r, y, -80 - Math.sin(a) * r]; }, nn = [-Math.cos(am), 0, Math.sin(am)];
        { const c0 = q(0.06, hy * 0.84), c1 = q(0.94, hy * 0.84); candle(c0[0], c0[1], c0[2], c1[0], c1[1], c1[2], { R: zr, pitch: 2.1, skip: 0.1, w: 0.2, n: nn, col: i % 2 ? PAL.LEMON : PAL.PAPER }); }
        for (const [t0, yj, rise, w, col] of [[0.15, hy * 0.6, 2.1, 0.27, PAL.PAPER], [0.31, hy * 0.43, 1.3, 0.19, i % 2 ? PAL.PAPER : PAL.LEMON]]) { const L = q(t0, 0.4), Lt = q(t0, yj), Rt = q(1 - t0, yj), Rb = q(1 - t0, 0.4);
          candle(L[0], L[1], L[2], Lt[0], Lt[1], Lt[2], { pitch: 2.0, skip: 0.04, w, n: nn, col }); candle(Rb[0], Rb[1], Rb[2], Rt[0], Rt[1], Rt[2], { pitch: 2.0, skip: 0.04, w, n: nn, col });
          rim.stroke(Lt, q(0.5 + xr.range(-0.05, 0.05), yj + 2 * rise), Rt, { n: nn, w: w * 1.05, col, kind: 0, seed: xr(), bead: 0.8 }); }
        if (i % 3 === 1 && Math.abs(Math.cos(am)) > 0.4) { const m = p((R0 + R1) / 2, am), per = rng.range(1.3, 1.9), ph = rng(); for (let k = 0; k < 5; k++) { const lean = (k - 2) * 0.6 + rng.range(-0.2, 0.2), hg = rng.range(5, 9); urns.stroke([m[0] + lean * 0.2, hy + 4.2, m[1]], [m[0] + lean, hy + 4.2 + hg * 0.55, m[1]], [m[0] + lean * 0.5 + rng.range(-0.3, 0.3), hy + 4.2 + hg, m[1]], { w: 0.24, col: (k % 2 ? PAL.LEMON : PAL.PAPER) + 0.3, kind: 1, k0: (ph + k * 0.21) % 1, k1: per, seed: rng(), bead: 0 }); } }
        if (i % 3 === 1) { const m = p((R0 + R1) / 2, am); solids.spire(m[0], m[1], hy, hy + 4.2, 1.6); candle(m[0] - 0.9, hy + 0.3, m[1] + 1.1, m[0], hy + 4.1, m[1] + 0.05, { pitch: 1.5, skip: 0, w: 0.14 }); candle(m[0] + 0.9, hy + 0.3, m[1] + 1.1, m[0], hy + 4.1, m[1] + 0.05, { pitch: 1.5, skip: 0.3, w: 0.1 }); } }
      // THE BACK TIER (stream yew-top), a thing of its own behind the half-round, on the side away from the hoop: a second hedge
      // on the same centre, its inner face at the wall's outer radius, 3 m thick, 20.5 m to the foot of its scallops (every
      // bay rises in a low arch 1.9 m high, cut through the hedge's whole thickness), matte black as the wall. The wall with
      // its top line, candle ends and obelisks stands in front of it, as it was; the tier rises behind and above it and
      // carries the half-round's black up round the whole hoop. Its candle stands to either side of the disc and nowhere
      // behind it, by the wall's own rule for its candle ends: a bay is edged only where the cosine of its middle angle is
      // over 0.4 either way. In such a bay the candle runs along each scallop's edge and one unbroken line as broad as the
      // candle follows the scallops above it (it stands at every distance, so it is not the wall's 2 m line); a bay behind
      // the disc is the black hedge alone and draws nothing from the stream. The tier's two ends, at its outermost places,
      // are edged as the wall's are: every line of it by its own stream.
      { const R2 = R1 + 3, hb = 20.5, SCAL = 1.9, yt = named('yew-top'), pt = (r, a) => [Math.cos(a) * r, -80 - Math.sin(a) * r];
        for (let i = 0; i < N; i++) { const a0 = Math.PI * (i / N), a1 = Math.PI * ((i + 1) / N), am = (a0 + a1) / 2, A0 = pt(R1, a0), A1 = pt(R1, a1), B0 = pt(R2, a0), B1 = pt(R2, a1);
          solids.quad([A0[0], hy, A0[1]], [A1[0], hy, A1[1]], [A1[0], hb, A1[1]], [A0[0], hb, A0[1]]);              // its face, from the wall's top up
          solids.quad([B1[0], -0.3, B1[1]], [B0[0], -0.3, B0[1]], [B0[0], hb, B0[1]], [B1[0], hb, B1[1]]);          // its back
          const lit = Math.abs(Math.cos(am)) > 0.4;                                                               // (the wall's rule for its candle ends: none behind the disc)
          for (let k = 0; k < 4; k++) { const sc = (r, t) => { const q = pt(r, a0 + (a1 - a0) * t); return [q[0], hb + SCAL * Math.sin(Math.PI * t), q[1]]; };
            const P0 = sc(R1, k / 4), P1 = sc(R1, (k + 1) / 4), Q0 = sc(R2, k / 4), Q1 = sc(R2, (k + 1) / 4), C0 = sc(R1 - 0.15, k / 4), C1 = sc(R1 - 0.15, (k + 1) / 4);
            solids.quad([P0[0], hb, P0[2]], [P1[0], hb, P1[2]], P1, P0); solids.quad([Q1[0], hb, Q1[2]], [Q0[0], hb, Q0[2]], Q0, Q1); solids.quad(P0, P1, Q1, Q0);
            if (lit) candle(C0[0], C0[1] + 0.05, C0[2], C1[0], C1[1] + 0.05, C1[2], { R: yt, skip: 0.03, w: 0.3, pitch: 1.2 }); }
          if (lit) { const T0 = pt(R1 - 0.5, a0 - 0.012), T1 = pt(R1 - 0.5, a1 + 0.012), Tm = pt(R1 - 0.5, am);
            if (yt.chance(0.9)) { const dy = yt.range(-0.2, 0.3), sd = yt(); rim.stroke([T0[0], hb + 0.35, T0[1]], [Tm[0], hb + 0.35 + 2 * SCAL + dy, Tm[1]], [T1[0], hb + 0.35, T1[1]], { w: 0.3, col: i % 4 === 1 ? PAL.LEMON : PAL.PAPER, kind: 0, seed: sd, bead: 0 }); } }
          if (i % 4 === 3) await ctx.yield(); }
        for (const s of [-1, 1]) { solids.quad([s * R1, -0.3, -80], [s * R2, -0.3, -80], [s * R2, hb, -80], [s * R1, hb, -80]);
          candle(s * R1, hy, -79.95, s * R1, hb, -79.95, { R: yt, pitch: 1.7, skip: 0.05, w: 0.16 }); candle(s * R2, 0.2, -79.95, s * R2, hb, -79.95, { R: yt, pitch: 1.7, skip: 0.2, w: 0.12 }); candle(s * R1, hb + 0.04, -79.95, s * R2, hb + 0.04, -79.95, { R: yt, pitch: 1.7, skip: 0, w: 0.16 }); } }
      for (const s of [-1, 1]) { solids.quad([s * R0, -0.3, -80], [s * R1, -0.3, -80], [s * R1, hy, -80], [s * R0, hy, -80]); solids.quad([s * R1, -0.3, -80], [s * R0, -0.3, -80], [s * R0, hy, -80], [s * R1, hy, -80]);
        candle(s * R0, 0.2, -79.95, s * R0, hy, -79.95, { pitch: 1.7, skip: 0.05, w: 0.16 }); candle(s * R1, 0.2, -79.95, s * R1, hy, -79.95, { pitch: 1.7, skip: 0.2, w: 0.12 }); candle(s * R0, hy + 0.04, -79.95, s * R1, hy + 0.04, -79.95, { pitch: 1.7, skip: 0, w: 0.16 }); } }
    scene.add(urns.build({ segs: 4 }));
    // ---- far trees: clipped allees and distant woods, half a coat paler than the ground they stand on ----
    const farSpans = [];                                 // [first vertex, end vertex, x, z] of every far tree: each takes the wash whole, by where it stands
    { const tr = rng.fork('far'), farB = far;
      const tree = (...a) => { const v0 = farB.verts; tree0(...a); if (farB.verts > v0) farSpans.push([v0, farB.verts, a[0], a[1]]); };
      const tree0 = (x, z, h, r, far = farB, kind = -1) => { const g = groundY(z) - 0.5; if (far !== farB) rim.stroke([x - Math.sign(x) * r * 0.97, g + h * 0.32, z + r * 0.8], [x - Math.sign(x) * r * 0.97, g + h * 1.3, z + xr.range(-0.4, 0.4)], [x - Math.sign(x) * r * 0.97, g + h * 0.32, z - r * 0.8], { n: [-Math.sign(x), 0, 0], w: 0.17, col: PAL.PAPER, kind: 0, seed: xr(), bead: 0.6 });
        else if (kind < 0 && Math.abs(x) < 50) { const sx = Math.sign(x) || 1, e = (t, o) => [x - sx * r * o, g + h * t, z + qr.range(-0.3, 0.3)];   // a far tree of the avenue: drawn, with a broken candle line down its near edge
          rim.stroke(e(0.97, 0.3), e(0.8, 0.86), e(0.56, 0.98), { w: 0.2, col: PAL.PAPER, kind: 0, seed: qr(), bead: 0 }); if (qr.chance(0.75)) rim.stroke(e(0.46, 1.0), e(0.33, 1.04), e(0.16, 0.92), { w: 0.17, col: qr.chance(0.25) ? PAL.LEMON : PAL.PAPER, kind: 0, seed: qr(), bead: 0 }); }
        if (kind >= 0) { const sx = Math.sign(x) || 1;
          if (kind === 1) { far.spire(x, z, g, g + h * 0.3, r * 0.45, 6, r, 0.3); far.spire(x, z, g + h * 0.3, g + h, r, 6, r * 0.06, 0.3); }
          else { far.spire(x, z, g + h * 0.3, g + h * 0.7, r * 0.75, 7, r, 0.3); far.spire(x, z, g + h * 0.7, g + h, r, 7, r * 0.3, 0.3); far.spire(x, z, g, g + h * 0.32, r * 0.13, 4, r * 0.13); }
          if (zr.chance(0.34) || (Math.abs(x) < 160 && z > 150 && z < 300)) rim.stroke([x - sx * r * 0.8, g + h * 0.36, z], [x - sx * r * 1.08, g + h * 0.72, z], [x - sx * r * 0.35, g + h * 0.97, z], { w: 0.26, col: zr.chance(0.3) ? PAL.LEMON : PAL.PAPER, kind: 0, seed: zr(), bead: 0 });
          return; }
        if (tr.chance(0.45)) far.spire(x, z, g, g + h, r, 6, r * 0.12, tr() * 3); else { far.spire(x, z, g + h * 0.28, g + h * 0.74, r * 0.72, 6, r, 0.3); far.spire(x, z, g + h * 0.74, g + h, r, 6, r * 0.25, 0.3); far.spire(x, z, g, g + h * 0.3, r * 0.14, 4, r * 0.14); } };
      for (const s of [-1, 1]) { for (let z = 330; z > -140; z -= 13) { if (z > 178) tree(s * (44 + tr.range(-1, 1)), z, tr.range(13, 16), 4.6, z > 214 ? solids : farB); if (z > 178) tree(s * (30 + tr.range(-0.6, 0.6)), z + 6.5, tr.range(10, 12), 3.4, z > 207 ? solids : farB); }
        for (let z = 360, i = 0; z > -260; z -= 21, i++) { const k = i % 3 === 0 ? 1 : 0; tree(s * (135 + tr.range(-5, 5)), z, k ? tr.range(34, 42) : tr.range(19, 25), k ? 3.4 : 6.4, farB, k); tree(s * (190 + tr.range(-12, 12)), z + 9, k ? tr.range(22, 28) : tr.range(40, 50), k ? 8 : 4.2, farB, 1 - k); } }
      await ctx.yield();
      for (let i = 0; i < 46; i++) { const a = -1.25 + 2.5 * (i + tr()) / 46, r = tr.range(230, 520), k = i % 3 === 0 ? 1 : 0; tree(Math.sin(a) * r, -60 - Math.cos(a) * r * 0.8, (k ? tr.range(44, 60) : tr.range(22, 34)) * (0.7 + r / 700), k ? tr.range(4, 5.5) : tr.range(8, 12), farB, k); }
      for (let i = 0; i < 15; i++) { const k = i % 2; tree(-196 + i * 28 + tr.range(-5, 5), tr.range(-150, -200), k ? tr.range(36, 46) : tr.range(20, 27), k ? 3.6 : 8, farB, k); } }
    await ctx.yield();
    scene.add(new THREE.Mesh(solids.geometry(), paperMaterial({ base: 1, side: THREE.DoubleSide })));
    // the far trees are one flat tone each, half a coat paler than the ground they stand on (distance is a coat fewer): no
    // granulation, no bands, no sheen and no lip across them, so no facet of them shows; each takes a coat whole as the front
    // reaches its foot (eased over a dozen metres of the front's travel, so nothing pops)
    const farMat = new THREE.ShaderMaterial({ uniforms: { ...wash }, side: THREE.DoubleSide,
      vertexShader: STYLE_GLSL + /* glsl */`attribute vec2 aFoot; varying float vC; void main(){ float s = dot(vec3(aFoot.x, 0.0, aFoot.y) - uWashO, uWashD);
  vC = max(-0.5 + step(uFront.x, s) + smoothstep(-6.0, 6.0, uFront.y - s) + smoothstep(-6.0, 6.0, uFront.z - s), 0.0);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
      fragmentShader: STYLE_GLSL + /* glsl */`varying float vC; void main(){ gl_FragColor = vec4(inkTone(vC), 1.0); }` });
    const farGeo = far.geometry(); { const foot = new Float32Array(far.verts * 2); for (const [v0, v1, x, z] of farSpans) for (let v = v0; v < v1; v++) { foot[v * 2] = x; foot[v * 2 + 1] = z; } farGeo.setAttribute('aFoot', new THREE.BufferAttribute(foot, 2)); }
    const farMesh = new THREE.Mesh(farGeo, farMat); scene.add(farMesh);
    await ctx.yield();

    // ---- white peacocks: candle strokes, turquoise eyes in the train, a scarlet dab for the crest ----
    // local frame: r to the bird's right, y up, f forward. fan = { u0, u1 }: the train is raised stroke by stroke as u runs u0..u1
    const peacock = (b, fanB, base, fwd, ps, fan, sc = 1) => { const rx = fwd[2], rz = -fwd[0];
      const Pt = (r, y, f) => [base[0] + (rx * r + fwd[0] * f) * sc, base[1] + y * sc, base[2] + (rz * r + fwd[2] * f) * sc];
      const S = (bb, a, m, c, o) => bb.stroke(Pt(...a), m ? Pt(...m) : null, Pt(...c), { kind: 0, seed: rng(), bead: 0.8, col: PAL.PAPER, ...o, w: o.w * sc });
      S(b, [0, 0.5, -0.38], [0, 0.86, 0.0], [0, 0.6, 0.34], { w: 0.2 }); S(b, [0, 0.45, -0.3], [0, 0.2, 0.05], [0, 0.52, 0.36], { w: 0.18 }); S(b, [0, 0.52, -0.25], null, [0, 0.52, 0.25], { w: 0.22 });
      S(b, [-0.2, 0.42, 0.26], [0, 0.22, 0.36], [0.2, 0.42, 0.26], { w: 0.16 }); for (const q of [-1, 1]) S(b, [q * 0.2, 0.36, 0.1], [q * 0.27, 0.62, 0.1], [q * 0.1, 0.84, 0.22], { w: 0.14 });
      S(b, [0, 0.62, 0.28], [0, 1.02, 0.52], [0, 1.34, 0.3], { w: 0.085 }); S(b, [0, 1.34, 0.3], null, [0, 1.39, 0.5], { w: 0.1 }); S(b, [0, 1.38, 0.5], null, [0, 1.34, 0.64], { w: 0.05, col: PAL.LEMON });
      for (const q of [-1, 0, 1]) S(b, [q * 0.06, 1.44, 0.33], null, [q * 0.13, 1.66, 0.3], { w: 0.055, col: PAL.SCARLET, bead: 0 });
      for (const q of [-1, 1]) S(b, [q * 0.09, 0.3, 0], null, [q * 0.09, 0, 0.04], { w: 0.04, col: PAL.LEMON });
      if (!fan) {                                         // at rest: the train trails behind and hangs down the hedge face
        for (let k = 0; k < 10; k++) { const t = k / 9, jr = rng.range(-0.15, 0.15), r = ps * (0.25 + 0.75 * t) + jr, L = rng.range(1.9, 2.9), big = sc > 1.5;
          // (the large bird by the path: its train goes back along the top and falls over the edge, down the dark face, eight to twelve strokes side by side)
          const f = -(0.42 + 1.75 * t) + jr * 0.4, tip = big ? [0.16 + 0.4 * Math.abs(jr) + 0.1 * t, 0.5 - L * 0.7 - 0.3 * Math.sin(t * 3.1), f] : [r * 1.4, 0.5 - L * 0.82, -0.5 - L * 0.45];
          S(b, [0, 0.55, -0.32], big ? [tip[0] * 0.7, 0.74, f * 0.7] : [r * 0.7, 0.6, -0.5 - L * 0.4], tip, { w: 0.075, col: k % 3 === 1 ? PAL.LEMON + 0.5 : PAL.PAPER });
          S(b, [tip[0], tip[1] + 0.24, tip[2] + 0.08], null, tip, { w: 0.15, col: PAL.TURQ, bead: 0.4 });
          if (big && k % 2 === 0) { const m = [tip[0] * 0.7, 0.74, f * 0.7], q = (u) => [0, 1, 2].map((j) => (1 - u) * (1 - u) * [0, 0.55, -0.32][j] + 2 * u * (1 - u) * m[j] + u * u * tip[j]), e0 = q(0.6), e1 = q(0.68);
            b.stroke(Pt(...e0), null, Pt(...e1), { w: 0.11 * sc, col: PAL.TURQ, kind: 0, seed: qr(), bead: 0.4 }); } }
        return; }
      for (let k = 0; k < 5; k++) { const r = (k - 2) * 0.16, L = rng.range(1.0, 1.5); S(b, [0, 0.55, -0.32], [r, 0.45, -0.5 - L * 0.5], [r * 1.8, 0.05, -0.5 - L], { w: 0.07 }); }
      const N = 27, du = (fan.u1 - fan.u0) / N;
      for (let k = 0; k < N; k++) { const th = -1.72 + 3.44 * (k + 0.5) / N + rng.range(-0.03, 0.03), R = rng.range(2.75, 3.05), sn = Math.sin(th), cs = Math.cos(th), k0 = fan.u0 + k * du, tip = [sn * R, 0.6 + cs * R, -0.5];
        S(fanB, [0, 0.6, -0.3], [sn * R * 0.5 + cs * 0.12, 0.6 + cs * R * 0.5 - sn * 0.12, -0.62], tip, { w: 0.07, col: k % 4 === 2 ? PAL.LEMON + 0.45 : PAL.PAPER, kind: 2, k0, k1: k0 + du * 2.2 });
        S(fanB, [sn * (R - 0.3), 0.6 + cs * (R - 0.3), -0.5], null, tip, { w: 0.17, col: PAL.TURQ, kind: 2, k0: k0 + du * 1.6, k1: k0 + du * 2.4, bead: 0.4 });
        S(fanB, [sn * (R - 0.16) + cs * 0.02, 0.6 + cs * (R - 0.16), -0.52], null, [sn * (R - 0.06), 0.6 + cs * (R - 0.06), -0.52], { w: 0.07, col: PAL.SCARLET, kind: 2, k0: k0 + du * 2.2, k1: k0 + du * 2.6, bead: 0 });
        for (const q of [0.55, 0.78, 0.97]) if (rng.chance(0.75)) { const pt = Pt(sn * R * q, 0.6 + cs * R * q, -0.47); shakeB.push([pt[0], pt[1], pt[2], rng(), 2, rng.range(0.05, 0.1), th + rng.range(-0.5, 0.5), rng.range(0.8, 2.4)]); }
        if (k + 1 < N) { const t2 = th + 1.72 / N, R2 = R * rng.range(0.6, 0.7), s2 = Math.sin(t2), c2 = Math.cos(t2), tip2 = [s2 * R2, 0.6 + c2 * R2, -0.46];
          S(fanB, [0, 0.6, -0.3], null, tip2, { w: 0.055, col: PAL.PAPER, kind: 2, k0: k0 + du * 0.5, k1: k0 + du * 2.6 });
          S(fanB, [s2 * (R2 - 0.22), 0.6 + c2 * (R2 - 0.22), -0.46], null, tip2, { w: 0.13, col: PAL.TURQ, kind: 2, k0: k0 + du * 2, k1: k0 + du * 2.8, bead: 0.4 }); } } };
    const birds = new WaxBatch(512), fanB = new WaxBatch(256), shakeB = [], PEA = [-11.25, groundY(229.5) + 5.32, 229.3];   // the hedge peacock we turn to: on the pier's top, at its edge toward the path
    const FAN = { u0: 0.36, u1: 0.406 };
    const fanGroup = new THREE.Group(); fanGroup.position.set(PIER[0] + 0.15, PIER[1], PIER[2]);
    if (peacocks) {
      const fd = new THREE.Vector3(0 - fanGroup.position.x, 0, 150 - PIER[2]).normalize();
      peacock(birds, fanB, [fanGroup.position.x, PIER[1], PIER[2]], [fd.x, 0, fd.z], 1, FAN);
      for (const [i, s] of [[2, -1], [6, 1], [10, -1], [14, 1]]) { const z = 282 - i * PITCH, g = groundY(z); if (i === 10) peacock(birds, null, [PEA[0], PEA[1], PEA[2]], [0, 0, 1], 1, null, 2.2); else peacock(birds, null, [s * 11.45, g + 5.3, z + 0.6], [0, 0, -1], s, null); }
    } else { fanB.stroke([0, -5, 0], null, [0, -5.2, 0], { w: 0.01, kind: 2, k0: 2, k1: 3 }); birds.stroke([0, -5, 0], null, [0, -5.2, 0], { w: 0.01, kind: 2, k0: 2, k1: 3 }); }
    scene.add(birds.build({ segs: 4 }));
    // the fan is its own small batch, drawn about the pier so it can be shaken
    { const m = fanB.build({ segs: 4 }); m.position.copy(fanGroup.position).multiplyScalar(-1); fanGroup.add(m); scene.add(fanGroup); }
    await ctx.yield();

    // ---- swans: candle, scarlet bills. Five float on the basin; two run across the ink and fly beside us ----
    // local frame: +z forward, +x right, y up (the group's yaw sets the heading)
    const swanBody = (b, o, flying) => { const S = (a, m, c, q) => b.stroke([o[0] + a[0], o[1] + a[1], o[2] + a[2]], m ? [o[0] + m[0], o[1] + m[1], o[2] + m[2]] : null, [o[0] + c[0], o[1] + c[1], o[2] + c[2]], { kind: 0, seed: rng(), bead: 0.5, col: PAL.PAPER, ...q });
      const fb = flying ? 0.62 : 1;
      S([0, 0.14, -0.78], [0, 0.0, 0], [0, 0.22, 0.62], { w: 0.2 * fb }); S([0, 0.32, -0.82], [0, 0.66 - (flying ? 0.12 : 0), -0.1], [0, 0.32, 0.52], { w: 0.2 * fb }); S([0, 0.3, -0.6], null, [0, 0.3, 0.45], { w: 0.24 * fb });
      for (const q of [-1, 1]) { S([q * 0.24 * (flying ? 0.8 : 1), 0.26, -0.62], [q * 0.38 * (flying ? 0.8 : 1), 0.32, 0], [q * 0.15, 0.3, 0.5], { w: 0.14 * fb }); if (!flying) { S([q * 0.2, 0.42, 0.25], [q * 0.4, 0.62, -0.3], [q * 0.16, 0.5, -0.86], { w: 0.1 }); S([q * 0.3, 0.36, 0.1], [q * 0.42, 0.46, -0.4], [q * 0.2, 0.36, -0.95], { w: 0.08 }); } }
      S([0, 0.36, -0.8], null, [0, 0.52, -1.02], { w: 0.09 });
      if (flying) { S([0, 0.32, 0.5], [0, 0.78, 1.0], [0, 0.6, 1.62], { w: 0.085 }); S([0, 0.6, 1.62], null, [0, 0.68, 1.9], { w: 0.115 }); S([0, 0.66, 1.88], null, [0, 0.55, 2.2], { w: 0.09, col: PAL.SCARLET, bead: 0 });
        for (const q of [-1, 1]) S([q * 0.1, 0.12, -0.6], null, [q * 0.12, 0.1, -1.15], { w: 0.04, col: PAL.LEMON, bead: 0 }); }
      else { S([0, 0.32, 0.5], [0, 0.8, 0.98], [0, 1.08, 0.62], { w: 0.08 }); S([0, 1.08, 0.62], [0, 1.22, 0.56], [0, 1.18, 0.8], { w: 0.085 }); S([0, 1.17, 0.8], null, [0, 1.1, 1.0], { w: 0.06, col: PAL.SCARLET, bead: 0 }); } };
    const swanWing = (q) => { const b = new WaxBatch(16), S = (a, m, c, w) => b.stroke(a, m, c, { kind: 0, seed: rng(), bead: 0.3, col: PAL.PAPER, w });
      S([0, 0, 0.12], [q * 1.0, 0.12, 0.3], [q * 2.2, 0, 0.0], 0.085);
      for (let k = 0; k < 7; k++) { const t = (k + 0.6) / 7, x = q * (0.2 + 2.0 * t), L = 0.75 + 0.5 * Math.sin(t * 2.4); S([x, 0.02, 0.2 - 0.2 * t], [x + q * 0.08, 0, -L * 0.5], [x + q * (0.1 + 0.25 * t), -0.03, -L], 0.075); }
      const g = b.build({ segs: 3 }); g.position.set(q * 0.14, 0.4, 0.12); return g; };
    const flyers = [], DV = 0.014;
    // where a flyer is at journey u: v = its own place along the path, out = metres to starboard, h = height over the ink, fly = 0 running .. 1 flying
    const VK = [[0, 0.52], [0.488, 0.52], [0.526, 0.549], [0.56, 0.585], [0.585, 0.607], [0.612, 0.629], [0.66, 0.70], [0.74, 0.86], [1, 0.9]];
    const vLin = (u) => { for (let i = 1; i < VK.length; i++) if (u <= VK[i][0]) { const a = VK[i - 1], b = VK[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); } return 0.9; };
    const vOf = (u) => (vLin(u - 0.008) + vLin(u - 0.004) + vLin(u) + vLin(u + 0.004) + vLin(u + 0.008)) / 5;   // (eased through its keys: the bird never stalls)
    // one crosses our bow from starboard to port at u 0.524-0.56 (before the image at 0.58, so it is never in front of the disc)
    const _fp = new THREE.Vector3(), _ft = new THREE.Vector3();
    const flyerAt = (u, f, out) => { const v = vOf(u) + f.dv; path.pointAt(v, _fp); path.tangentAt(v, _ft);
      const away = sstep(0.635, 0.75, u), cross = f.grow ? sstep(0.524, 0.56, u) : 0, off = lerp(f.off, -6.6 - 1.6 * sstep(0.585, 0.63, u), cross) + away * (f.grow ? -40 : 40);
      out.set(_fp.x - _ft.z * off, 0, _fp.z + _ft.x * off); out.crs = cross; out.away = away; return out; };
    // the runners' own lanes, the numbers their flight is made with (metres to starboard of the path, which of the two crosses
    // our bow, how far along the path the second goes ahead of the first, its height and wing phase): kept in one place, for
    // the two birds themselves (below) and for whoever must keep clear of where they wait, run and fly
    const RUNNERS = [0, 1].map((j) => ({ off: j ? 7.5 : 2.5, grow: j ? 0 : 4.6, dv: j * DV, up: j * 1.5, ph: j * 1.7 }));
    // WHERE THE FIVE FLOAT (stream swans-afloat): one rule of the basin. Its length from the near rim to the fall's foot is cut
    // in five equal reaches and one swan floats in each, alternately to port and to starboard of the course's line (the first
    // side by a draw), 5 to 14 m from that line and never nearer, and never within 3.5 m of a runner's lane. What it keeps
    // clear of is built from the things themselves: the course over the basin, between the basin's own ends (its near rim and
    // the fall's foot), a point at every metre or less; and each runner's whole track in plan, asked of its own flight
    // (flyerAt: where it waits, runs, crosses and flies off), two points to every metre of the course. A swan is offered up
    // to 24 places in its reach and takes the first that is clear; if none is clear it is not there on this visit: it is
    // not built and draws nothing more (FLOAT holds the swans that are placed, five or fewer).
    // The stream's draws, in order: the first side; then for each swan in turn its place along its reach, its distances from
    // the course's line, one after another until a place is clear, and then, if it is placed, its bow's side and its tilt.
    // A swan floats broadside to the course: its length lies across the course's line where that line passes its reach, bow
    // to port or to starboard by one draw and up to 20 degrees off square by another (a rule of the place: the swan's own
    // reach and the course's line there; nothing of the eye).
    const swanRng = named('swans-afloat'), FLOAT = []; { const sw = swanRng, q = new THREE.Vector3(), t = new THREE.Vector3(), NEAR = 5, FAR = 14, LANE = 3.5;
      // metres from (x, z) to a line of points, in plan
      const off = (line, x, z) => { let m = Infinity; for (let i = 1; i < line.length; i++) { const a = line[i - 1], b = line[i], ex = b[0] - a[0], ez = b[1] - a[1], ll = ex * ex + ez * ez, s = ll > 0 ? clamp(((x - a[0]) * ex + (z - a[1]) * ez) / ll, 0, 1) : 0; m = Math.min(m, Math.hypot(x - a[0] - ex * s, z - a[1] - ez * s)); } return m; };
      const u0 = uOfZ(BASIN_Z1), u1 = uOfZ(FALL_FOOT), nc = Math.ceil((u1 - u0) * path.length), nl = Math.ceil(2 * path.length), course = [], tracks = [];
      for (let i = 0; i <= nc; i++) { path.pointAt(lerp(u0, u1, i / nc), q); course.push([q.x, q.z]); }
      for (const f of RUNNERS) { const tr = []; for (let i = 0; i <= nl; i++) { flyerAt(i / nl, f, q); tr.push([q.x, q.z]); } tracks.push(tr); }
      const zNear = BASIN_Z1 - 6, zFar = FALL_FOOT + 3, reach = (zNear - zFar) / 5; let side = sw.sign();
      for (let i = 0; i < 5; i++, side = -side) { const z0 = zNear - (i + sw.range(0.2, 0.8)) * reach, v = uOfZ(z0); let x = 0, z = 0, on = 0;
        path.pointAt(v, q); path.tangentAt(v, t); const l = Math.hypot(t.x, t.z) || 1;
        for (let k = 0; k < 24 && !on; k++) { const d = sw.range(NEAR, FAR), px = q.x - t.z / l * d * side, pz = q.z + t.x / l * d * side;
          if (off(course, px, pz) >= NEAR && tracks.every((tr) => off(tr, px, pz) >= LANE)) { x = px; z = pz; on = 1; } }
        if (on) FLOAT.push([x, z, Math.atan2(-t.z, t.x) + (sw.sign() > 0 ? 0 : Math.PI) + sw.range(-0.35, 0.35)]); } }
    await ctx.yield();
    const floatB = new WaxBatch(128), floaters = new THREE.Group();
    for (const [x, z, yaw] of FLOAT) { const c = Math.cos(yaw), s = Math.sin(yaw), tmp = new WaxBatch(32), SW = 1.75; swanBody(tmp, [0, 0, 0], false);
      for (let i = 0; i < tmp.n; i++) { const R = (arr) => { const px = arr[i * 3] * SW, pz = arr[i * 3 + 2] * SW; return [x + px * c + pz * s, 0.06 + arr[i * 3 + 1] * SW, z - px * s + pz * c]; };
        floatB.stroke(R(tmp.A), R(tmp.B), R(tmp.C), { w: tmp.N[i * 4 + 3] * SW * 0.8, col: tmp.K[i * 4], kind: 0, seed: tmp.S[i * 4], bead: 0.5 }); }
      for (let k = 0; k < 3; k++) { const a = rng() * TAU, r = rng.range(1.3, 2.1) * 1.7; floatB.stroke([x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r], [x + Math.cos(a + 0.5) * r * 1.05, 0.07, z + Math.sin(a + 0.5) * r * 1.05], [x + Math.cos(a + 1.0) * r, 0.07, z + Math.sin(a + 1.0) * r], { n: up, w: 0.11, col: PAL.PAPER, kind: 1, k0: rng(), k1: rng.range(2.4, 3.6), seed: rng(), bead: 0 }); } }
    floaters.add(floatB.build({ segs: 4, minPx: 1.2 })); scene.add(floaters);
    // what the brief gives each floating swan (stream swans-afloat goes on): its own short zigzag in the ink under it, candle
    // white, its end toward us (up the course), appearing as the third coat pools there. Nothing else is laid here: no ring
    // lies round a floater (the brief gives a wax ring to each footfall of the two that run, and to nothing that floats)
    { const sw = swanRng, swanB = new WaxBatch(128), q = new THREE.Vector3();
      for (const [x, z] of FLOAT) { path.pointAt(uOfZ(Math.min(z + 14, 290)), q); const dx = q.x - x, dz = q.z - z, l = Math.hypot(dx, dz) || 1, ex = dx / l, ez = dz / l, L = sw.range(3.4, 4.8), j = sw.range(-0.25, 0.25), kPool = uOfF3(300 - z - L - 3.3) - 0.008;
        swanB.stroke([x + ex * (1.3 + L) - ez * j, 0.076, z + ez * (1.3 + L) + ex * j], null, [x + ex * 1.3, 0.076, z + ez * 1.3], { n: up, w: sw.range(0.13, 0.16), zig: sw.range(0.42, 0.56), hold: sw.range(1.5, 2.0), col: PAL.PAPER, seed: sw(), bead: 0.7, kind: 2, k0: kPool, k1: kPool + 0.022 }); }
      floaters.add(swanB.build({ segs: 4, minPx: 1.2 })); }
    for (let j = 0; j < 2; j++) { const g = new THREE.Group(), bb = new WaxBatch(32); swanBody(bb, [0, 0, 0], true); g.add(bb.build({ segs: 4 })); const wl = swanWing(-1), wr = swanWing(1); g.add(wl); g.add(wr); g.scale.setScalar(1.3); scene.add(g);
      flyers.push({ g, wl, wr, ...RUNNERS[j] }); }
    // the pools of bare ink: wherever a swan is, runs or flies, and the ink seen just behind it from the eye (7 m), no reflection is drawn;
    // the two flyers keep to the lanes between the columns of the reflection (2.5 and 7.5 m to starboard; the one that crosses, 6.6 to 8.2 m to port and 7 to 9 m ahead of the eye)
    const lanes = []; { const c = new THREE.Vector3(), q = new THREE.Vector3();
      for (let u = 0.47; u < 0.648; u += 0.004) { path.pointAt(u, c); for (const f of flyers) { flyerAt(u, f, q); const dx = q.x - c.x, dz = q.z - c.z, l = Math.hypot(dx, dz) || 1; const tight = f.grow ? u > 0.518 && u < 0.566 : u > 0.556; lanes.push([q.x - dx / l * 0.5, q.z - dz / l * 0.5, q.x + dx / l * (tight ? (f.grow ? 2 : 3) : 7), q.z + dz / l * (tight ? (f.grow ? 2 : 3) : 7), tight ? (f.grow ? 1.4 : 1.7) : f.grow && u > 0.56 ? 1.5 : 2.0, u]); } }
      for (const [x, z] of FLOAT) lanes.push([x, z, x, z, 5.2, -1]); }
    const _lp = new THREE.Vector3(), pathX = (z) => path.pointAt(uOfZ(z), _lp).x;
    // partU(x, z): the journey u at which the ink at (x, z) must be bare for a swan (-1: always, a floating swan is there; Infinity: never)
    let partLast = -1; const partU = (x, z) => { let m = Infinity; partLast = -1; for (const L of lanes) { const ex = L[2] - L[0], ez = L[3] - L[1], ll = ex * ex + ez * ez, t = ll > 0 ? clamp(((x - L[0]) * ex + (z - L[1]) * ez) / ll, 0, 1) : 0; if (Math.hypot(x - L[0] - ex * t, z - L[1] - ez * t) < L[4]) { m = Math.min(m, L[5]); partLast = Math.max(partLast, L[5]); } } return m; };
    const bare = (x, z) => partU(x, z) < 2;
    // a reflection stroke: revealed as the third coat pools (u = k); one that lies where a swan will come is wiped again before
    // it comes, from its near end, as water parts for a bird (kind 3: laid over w, lifted between k + 8w and k + 9w)
    // and it is laid again when the bird has gone by (the water closes behind it)
    const reflStroke = (b, A, C, k, o, half) => { let uB = Infinity, uL = -1; for (const t of [0, 0.5, 1]) { uB = Math.min(uB, partU(lerp(A[0], C[0], t), lerp(A[2], C[2], t))); uL = Math.max(uL, partLast); }
      if (uB === Infinity) { b.stroke(A, null, C, { ...o, kind: 2, k0: k, k1: k + 0.022 }); return; }
      // (a long stroke in a swan's way parts and closes in two halves, the near half first)
      if (!half && Math.hypot(C[0] - A[0], C[2] - A[2]) > 4.4) { const M = [(A[0] + C[0]) / 2, A[1], (A[2] + C[2]) / 2]; reflStroke(b, A, M, k, o, 1); reflStroke(b, M, C, k, { ...o, seed: (o.seed * 7.31 + 0.37) % 1 }, 1); return; }
      if (uB < 0) return; const w = (uB - 0.004 - k) / 9; if (w >= 0.0035) b.stroke(A, null, C, { ...o, kind: 3, k0: k, k1: w });
      if (uL < 0.66) b.stroke(A, null, C, { ...o, kind: 2, k0: Math.max(k, uL + 0.0005), k1: Math.max(k, uL + 0.0005) + 0.005 }); };
    await ctx.yield();
    // footfalls: each leaves a wax ring on the ink, drawn as the foot lands
    const rings = new WaxBatch(128); { const p = new THREE.Vector3(), t = new THREE.Vector3();
      for (let j = 0; j < 2; j++) for (let k = 0; k < 9; k++) { const u = 0.49 + k * 0.0042 + j * 0.0015, v = vOf(u) + j * DV; path.pointAt(v, p); path.tangentAt(v, t); const rx = -t.z, rz = t.x, off = (j ? 7.5 : 2.5) + (k % 2 ? 0.28 : -0.28), cx = p.x + rx * off, cz = p.z + rz * off, r = rng.range(0.3, 0.42), a0 = rng() * TAU;
        for (let q = 0; q < 3; q++) { const a = a0 + q * TAU / 3, b = a + TAU / 3 * 0.8, m = (a + b) / 2; rings.stroke([cx + Math.cos(a) * r, 0.07, cz + Math.sin(a) * r], [cx + Math.cos(m) * r * 1.2, 0.07, cz + Math.sin(m) * r * 1.2], [cx + Math.cos(b) * r, 0.07, cz + Math.sin(b) * r], { n: up, w: 0.055, col: PAL.PAPER, kind: 3, k0: u + 0.001, k1: 0.006, seed: rng(), bead: 0 }); } } }
    // the pooled ink carries a drawn sheen: a few level candle glints laid and lifted near the eye; most of the basin is bare
    const glint = new WaxBatch(256); { 
      for (let i = Math.round(420 * detail); i--;) { const z = 4 + 124 * Math.sqrt(rng()), x = pathX(z) + rng.range(-1, 1) * rng.range(3, 30), L = rng.range(0.8, 2.8), bw = rng.range(-0.12, 0.12);
        const e1 = rng.range(-0.08, 0.08), w = rng.range(0.035, 0.06), lem = rng.chance(0.2), k0 = rng(), k1 = rng.range(2.6, 5.5), sd = rng();
        if (Math.abs(x) > 60 || i % 7) continue; const L2 = L * 2.4 + 2.2; if (bare(x, z) || bare(x - L2 / 2, z) || bare(x + L2 / 2, z)) continue;
        glint.stroke([x - L2 / 2, 0.07, z], [x, 0.07, z + bw * 5 + (bw < 0 ? -0.25 : 0.25)], [x + L2 / 2, 0.07, z + e1 * 3], { n: up, w: w * 1.7, col: lem ? PAL.LEMON : PAL.PAPER, kind: 4, hold: 30, k0, k1: k1 + 1.5, seed: sd, bead: 0.5 }); }
      for (let i = Math.round(80 * detail); i--;) { const z = xr.range(133, 152), x = xr.range(-13.5, 13.5), L = xr.range(0.9, 2.6);
        const o = { n: up, w: xr.range(0.04, 0.065) * 2.3, col: xr.chance(0.25) ? PAL.LEMON : PAL.PAPER, kind: 4, hold: 40, k0: xr(), k1: xr.range(1.8, 3.6) + 1, seed: xr(), bead: 0.4 }, b0 = xr.range(-0.1, 0.1), b1 = xr.range(-0.08, 0.08);
        if (i % 4 === 0) glint.stroke([x - L, 0.08, z], [x, 0.08, z + b0 * 4], [x + L, 0.08, z + b1 * 2], o); } }
    await ctx.yield();
    // THE REFLECTION, drawn: under each bright thing that stands over the basin its zigzag lies on the ink in its own colour:
    // ONE narrow column from the thing's foot toward us, thinner and lighter than the thing itself, thinning and breaking as
    // it comes, with lanes of bare ink between the columns and round every swan. The columns and the fall in lemon and
    // candle, the terrace wheels and the willows in rose to port and turquoise to starboard.
    const refl = new WaxBatch(512), EYE = [11.5, 82], laid = []; {
      // every stroke laid is remembered, so that a later chain breaks off where it would cross an earlier one (no hatching)
      const clear = (ax, az, bx, bz, id, r) => { for (const q of laid) { if (q[4] === id) continue; const ex = q[2] - q[0], ez = q[3] - q[1], ll = Math.max(ex * ex + ez * ez, 1e-6);
        for (let i = 0; i < 5; i++) { const x = lerp(ax, bx, i / 4), z = lerp(az, bz, i / 4), t = clamp(((x - q[0]) * ex + (z - q[1]) * ez) / ll, 0, 1); if (Math.hypot(x - q[0] - ex * t, z - q[1] - ez * t) < r) return false; } } return true; };
      // put: one broad round-cornered zigzag from (ax, az), its end toward us, to (bx, bz), its end toward the thing it reflects
      const put = (ax, az, bx, bz, id, col, w, zg, per, gap = 2.4) => { if (Math.abs(ax) > 62.3 || Math.abs(bx) > 62.3 || Math.min(az, bz) < 5.6 || Math.max(az, bz) > 127.3 || !clear(ax, az, bx, bz, id, gap)) return false;
        reflStroke(refl, [ax, 0.076, az], [bx, 0.076, bz], uOfF3(300 - Math.max(az, bz) - 2) - 0.008, { n: up, w, zig: zg, hold: per, col, seed: qr(), bead: 0.7 }); laid.push([ax, az, bx, bz, id]); return true; };
      // a chain from the foot of a thing (x0, z0) toward us (x1, z1): strokes that lengthen, broaden and break as they come
      let chainId = 0; const chain = (x0, z0, x1, z1, col, o = {}) => { const id = ++chainId, L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L; let d = qr.range(0.5, 2.5);
        while (d < L - 2) { const t = d / L, Ls = Math.min(qr.range(4.2, 6.4) + 5 * t, L - d), d1 = d + Ls, j0 = qr.range(-0.3, 0.3), j1 = qr.range(-0.3, 0.3), wh = qr.chance(0.14);
          if (!qr.chance(0.05 + 0.12 * t)) put(x0 + dx * d1 - dz * j1, z0 + dz * d1 + dx * j1, x0 + dx * d - dz * j0, z0 + dz * d + dx * j0, id, wh ? PAL.PAPER : col, (o.w ?? 0.12) * lerp(0.8, 1.5, t) * qr.range(0.9, 1.12), (o.zig ?? 0.6) * lerp(0.7, 1.35, t) * qr.range(0.85, 1.15), qr.range(3.0, 4.0) * lerp(0.75, 1.3, t));
          d = d1 + qr.range(1.0, 2.0) + 2.0 * t; } };
      // (1) what stands over the ink in colour lies in it in that colour: the willows and the flank wheels, rose to port, turquoise to starboard
      for (const sd of [-1, 1]) { const wc = sd < 0 ? accentL : accentR;
        for (const W of WILLOWS) { if (W.s !== sd) continue;
          if (W.z < 0) for (const q of [-1, 1]) { const x0 = W.x + q * 4.2; chain(x0, 9, x0 + (10 - x0) * 0.3, 9 + qr.range(58, 80), W.col, { w: 0.14, zig: 0.78 }); }     // the willow behind the wing: down the basin beside the columns'
          else for (const q of [-1, 0, 1]) { const x0 = sd * 62, z0 = W.z + q * 5.5, f = q === 0 ? qr.range(0.86, 0.92) : qr.range(0.66, 0.8); chain(x0, z0, x0 + (9.5 - x0) * f, z0 + (63 + q * 13 - z0) * f, W.col, { w: 0.14, zig: 0.78 }); } }   // the willow on the rim: across the ink toward the path
        for (const [x0, z0, x1, z1] of [[62, 9, 40, 52], [62, 17, 47, 40]]) chain(sd * x0, z0, sd * x1 + 5, z1, wc, { w: 0.13, zig: 0.7 });     // the wheels on the flank terrace
        await ctx.yield(); }
      // (2) the palace: one narrow column under each lit part of the front, from its foot down the whole basin, fanning in
      // toward the eye as a reflection does and then following the path under our own keel: candle under the parting and
      // the fall's bays, lemon under the arch's jambs and the columns; lanes of bare ink two or three columns wide between
      const COLS = [[-0.4, -0.4, PAL.PAPER, PAL.LEMON], [-5.2, -9.2, PAL.PAPER, PAL.LEMON], [5.0, 9.0, PAL.PAPER, PAL.LEMON], [-10.3, -16.5, PAL.LEMON, PAL.PAPER], [10.1, 16.3, PAL.LEMON, PAL.PAPER],
        [-15.4, -25.5, PAL.PAPER, PAL.LEMON], [15.2, 25.5, PAL.PAPER, PAL.LEMON], [-20.6, -32.5, PAL.LEMON, PAL.PAPER], [20.4, 32.5, PAL.LEMON, PAL.PAPER],
        [-2.9, -4.7, PAL.LEMON, PAL.PAPER, 1], [2.3, 4.5, PAL.LEMON, PAL.PAPER, 1]];     // (the last two: the arch's jambs, between the others, laid last)
      for (const [off, offP, col, alt, inner] of COLS) { const id = ++chainId, zc = Math.abs(off) < 6 ? 36 : Math.abs(off) < 11 ? 62 : Math.abs(off) < 16 ? 86 : 100, X = (z) => pathX(z) + lerp(offP, off, sstep(4, zc, z)); let z = qr.range(6.5, 9.5);
        while (z < 122) { const L = qr.range(5.5, 8), z1 = Math.min(z + L, 127), c0 = qr.chance(0.2) ? alt : col, c = !rare ? c0 : c0 === PAL.LEMON ? PAL.ROSE + (qr.chance(0.3) ? 0.25 : 0) : qr.chance(0.45) ? PAL.ROSE + 0.25 : c0;   // (under the bouquet the lemon columns lie in rose, and half the candle)
          if (!qr.chance(0.06) || Math.abs(off) < 11) put(X(z1) + qr.range(-0.25, 0.25), z1, X(z) + qr.range(-0.25, 0.25), z, id, c, qr.range(0.15, 0.19), qr.range(0.62, 0.82) * (inner ? 0.8 : 1), qr.range(2.8, 3.6), inner ? 1.75 : 2.4);   // (the five under the eye are never skipped: one of them is always at arm's length)
          z = z1 + qr.range(0.6, 1.3); }
        await ctx.yield(); }
      // (3) the outermost bay and columns of the front: short chains under them, toward us
      for (const sd of [-1, 1]) for (const [x, col, f0] of [[39.5, PAL.LEMON, 0.3], [46.5, PAL.PAPER, 0.26], [55.4, PAL.LEMON, 0.3]]) { const x0 = sd * x, f = f0 * qr.range(0.9, 1.1);
        chain(x0, 8, x0 + (EYE[0] - x0) * f, 8 + (EYE[1] - 8) * f, col, { w: 0.12, zig: 0.62 }); }
      // the bouquet: forty rose willows over the whole front score the whole basin with rose
      if (rare) for (let i = 0; i < 900; i++) { const z = 8 + 112 * Math.sqrt(xr()), x = i < 170 ? xr.range(-61, 61) : clamp(pathX(z) + (i < 500 ? xr.range(-19, 19) : xr.range(-9, 9)), -61, 61), L = xr.range(5, 9.5), k = uOfF3(300 - z - L - 2) + xr.range(0.004, 0.03), x1 = x + x * 0.01 * L + xr.range(-0.6, 0.6), w = xr.range(0.06, 0.09), zg = xr.range(0.42, 0.72), wh = xr.chance(0.3), sd = xr();
        if (z + L > 127.5 || !clear(x1, z + L, x, z, -2, 1.15)) continue;
        reflStroke(refl, [x1, 0.078, z + L], [x, 0.078, z], k, { n: up, w: w * 1.5, zig: zg, hold: 1.5 + 12 * (w - 0.06), col: PAL.ROSE + (wh ? 0.25 : 0), seed: sd, bead: 0.6 }); laid.push([x1, z + L, x, z, -1]); } }
    scene.add(refl.build({ segs: 1, minPx: 1.25 }));
    await ctx.yield();
    // THE MIRROR (stream basin-mirror), added to the reflection above and laid after it, in a batch of its own: the ink
    // between the course and the palace carries the palace's own light. Every stroke is a broad round-cornered candle zigzag
    // lying in the basin's plane by world coordinates; it appears as the third coat pools at its place and parts for a swan
    // by the live strokes' own law (reflStroke), breaks off where it would come too near a stroke laid before it in another
    // chain (lanes of bare ink stay between the columns), and none comes within 4 m of the course's line.
    const mirror = new WaxBatch(512), mirrorN = { front: 0, rim: 0, tall: 0, rockets: 0, refused: { dash: 0, alone: 0, level: 0 } }; {
      await ctx.yield();
      const mr = named('basin-mirror'), FR = hero.front, KEEP = 4;
      const course = []; for (let z = 134; z >= 0; z -= 1) course.push([pathX(z), z]);
      const xAt = (z) => { const f = clamp(134 - z, 0, 133.999), i = Math.floor(f); return lerp(course[i][0], course[i + 1][0], f - i); };   // the course's x over the basin, read off the samples
      const offCourse = (x, z) => { let m = Infinity; for (const c of course) m = Math.min(m, Math.hypot(x - c[0], z - c[1])); return m; };
      const clearOf = (ax, az, bx, bz, id, r, turn) => { for (const q of laid) { if (q[4] === id || (turn && q[5])) continue; const ex = q[2] - q[0], ez = q[3] - q[1], ll = Math.max(ex * ex + ez * ez, 1e-6);
        for (let i = 0; i < 5; i++) { const x = lerp(ax, bx, i / 4), z = lerp(az, bz, i / 4), t = clamp(((x - q[0]) * ex + (z - q[1]) * ez) / ll, 0, 1); if (Math.hypot(x - q[0] - ex * t, z - q[1] - ez * t) < r) return false; } } return true; };
      // a stroke that stands only while its rocket's willow stands: drawn from u = a and lifted by u = end (the rocket
      // strokes' own clock), not before the ink has pooled there (k), and parted for a swan as every stroke of the basin is
      // (laid into the batch b, as reflStroke lays)
      const timed = (b, A, C, k, a, end, o) => { let uB = Infinity, uL = -1; for (const t of [0, 0.5, 1]) { uB = Math.min(uB, partU(lerp(A[0], C[0], t), lerp(A[2], C[2], t))); uL = Math.max(uL, partLast); }
        const span = (u0, u1) => { const ww = (u1 - u0) / 9; if (ww >= 0.0035) b.stroke(A, null, C, { ...o, kind: 3, k0: u0, k1: ww }); };
        if (uB === Infinity) span(Math.max(a, k), end); else if (uB >= 0) { span(Math.max(a, k), Math.min(end, uB - 0.004)); span(Math.max(a, k, uL + 0.0005), end); } };
      // lay: one zigzag from (ax, az), its end toward us, to (bx, bz), its end toward the thing it mirrors. It makes the stroke
      // (its place tested, its lane kept) and hands it back for mark() below, which lays it or refuses it.
      // ASK FIRST, DRAW AFTER: no draw of the stream is taken for a stroke before the stroke has come as far as the test
      // that reads it. Its width, zigzag and period, its colour, may be handed over as a draw still to be taken (a function):
      // width and zigzag are taken when the ends lie in the basin (the test of the course reads them), the period when
      // the place is clear (the rule of the mark reads it), colour and seed only when the stroke is laid (mark).
      const val = (v) => typeof v === 'function' ? v() : v;
      const lay = (ax, az, bx, bz, id, col, w, zg, per, gap, life) => { if (Math.abs(ax) > 62.3 || Math.abs(bx) > 62.3 || Math.min(az, bz) < 5.6 || Math.max(az, bz) > 127.3) return false;
        w = val(w); zg = val(zg);
        for (let i = 0; i <= 4; i++) if (offCourse(lerp(ax, bx, i / 4), lerp(az, bz, i / 4)) < KEEP + zg + w + 0.1) return false;
        if (!clearOf(ax, az, bx, bz, id, gap, !!life)) return false;
        const A = [ax, 0.076, az], C = [bx, 0.076, bz], o = { n: up, w, zig: zg, hold: val(per), bead: 0.7 }, k = uOfF3(300 - Math.max(az, bz) - 2) - 0.008;
        if (!life) laid.push([ax, az, bx, bz, id]);
        return { A, C, k, o, col, life, id }; };
      let mid = 1000;
      // a chain along a line from the thing's foot (x0, z0) toward (x1, z1): strokes that lengthen, broaden and part as they come
      const run = (x0, z0, x1, z1, col, o = {}) => { const id = ++mid, L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L; let d = mr.range(0.4, 1.8), n = 0;
        while (d < L - 2.5) { const t = d / L, Ls = Math.min(mr.range(4.0, 5.6) + 4 * t, L - d), d1 = d + Ls, j0 = mr.range(-0.3, 0.3), j1 = mr.range(-0.3, 0.3), c = () => mr.chance(0.14) ? PAL.PAPER : col + (o.fade && mr.chance(0.3) ? 0.25 : 0);
          n += mark([lay(x0 + dx * d1 - dz * j1, z0 + dz * d1 + dx * j1, x0 + dx * d - dz * j0, z0 + dz * d + dx * j0, id, c, () => (o.w ?? 0.15) * lerp(0.8, 1.5, t) * mr.range(0.9, 1.12), () => (o.zig ?? 0.75) * lerp(0.7, 1.35, t) * mr.range(0.85, 1.15), () => mr.range(3.0, 4.0) * lerp(0.75, 1.3, t), o.gap ?? 2.4)]);
          d = d1 + mr.range(1.0, 2.0) + 2.0 * t; }
        return n; };
      // THE COLUMNS OF THE MIRROR. The live reflection lays its columns 5.1, 10.2, 15.3 and 20.5 m either side of the course
      // (as they pass under us), each fanning out to its foot under the palace. The mirror's columns lie in the lanes of
      // bare ink between them and, beyond them, on in the same rhythm: at the offsets of SLOTS from the course, each from
      // its own foot under the front (its offset over 0.62, as the live columns fan: under the paired columns at 12 m, the
      // windows at 20 and 47, their jambs at 29, 37 and 42, the end columns at 54 and 58). Every second one of the outer
      // field is the front's, the ones between are the rockets'; the three lanes by the course are the front's.
      const SLOTS = [7.65, 12.75, 17.9, 23.1, 25.7, 28.3, 30.9, 33.5, 36.1], isRockets = (i) => i > 3 && i % 2 === 0;
      // a column's line: its x at z, from its foot under the front to its offset from the course at the near end
      const lineOf = (near) => { const x0 = near / 0.62, zc = Math.abs(near) < 11 ? 62 : Math.abs(near) < 16 ? 86 : 100; return (z) => xAt(z) + lerp(x0 - xAt(FALL_FOOT), near, sstep(4, zc, z)); };
      // THE RULE OF THE MARK, one rule for every stroke of the mirror, here where each is laid. A mark of the mirror is a
      // hand's zigzag with a turn in it, and it runs down the basin. mark() is given what was made for one zigzag (a single
      // stroke that carries its own zigzag, or the traverses of a broad one in their order, false where one was not made)
      // and lays of it only: a stroke at least as long as one swing of its own zigzag, there and back (its period:
      // shorter, it is a dot or a dash); a traverse that stands beside another traverse of its zigzag that is laid (alone
      // it is a dash without a turn); and, where the columns stand (from the course out to the line of the outermost column
      // on either side), no stroke that lies level, running more across the basin than down it (a level mark across the
      // columns is the live glints' own). What the rule refuses keeps its lane: the ink stays bare where it would have lain
      // and nothing else is laid in its place (a rocket's stroke keeps a lane only when it is laid, as before: only rockets'
      // strokes follow it, and they pass one another's lanes). A stroke takes its colour and its seed here, when it is
      // laid, and only then; what is refused, or lies wholly in a swan's pool, takes neither. mark() returns the number laid.
      const edge = [lineOf(-SLOTS[SLOTS.length - 1]), lineOf(SLOTS[SLOTS.length - 1])], probe = new WaxBatch(4);
      const mark = (list) => { let n = 0;
        // put: what the basin's own parting law lays of a made stroke, into the batch b (a rocket's stroke by its rocket's clock)
        const put = (b, S) => { if (S.life) timed(b, S.A, S.C, S.k, S.life[0], S.life[1], S.o); else reflStroke(b, S.A, S.C, S.k, S.o); };
        // shows: whether the law lays anything of it, asked of a batch that is never built (it lays nothing where a floating swan's pool is)
        const shows = (S) => { probe.n = 0; put(probe, S); return probe.n > 0; };
        // lays: the stroke is laid, and takes its colour and then its seed
        const lays = (S) => { S.o.col = val(S.col); S.o.seed = mr(); put(mirror, S); };
        // (a traverse stands if anything of it shows)
        const stands = list.map((S) => { if (!S || S.o.zig > 0) return false; return shows(S); });
        list.forEach((S, i) => { if (!S) return; const dx = S.C[0] - S.A[0], dz = S.C[2] - S.A[2];
          if (S.o.zig > 0) { if (Math.hypot(dx, dz) < S.o.hold) { mirrorN.refused.dash++; return; }
            if (Math.abs(dx) > Math.abs(dz) && [0, 0.25, 0.5, 0.75, 1].some((t) => { const x = S.A[0] + dx * t, z = S.A[2] + dz * t; return x > edge[0](z) && x < edge[1](z); })) { mirrorN.refused.level++; return; }
            // (a rocket's stroke that could never show, the ink pooling there too late, is not laid and keeps no lane)
            if (S.life) { if (!shows(S)) return; lays(S); laid.push([S.A[0], S.A[2], S.C[0], S.C[2], S.id, 1]); } else if (shows(S)) lays(S);
            n++; return; }
          if (!stands[i]) return;
          if (!stands[i - 1] && !stands[i + 1]) { mirrorN.refused.alone++; return; }
          lays(S); n++; });
        return n; };
      // one column, from the foot toward the near end. sink(near end x, z, far end x, z, w, zig, period, gap, index)
      // makes one stroke and hands it back (lay). A rocket's column is a chain of long strokes scored toward us, as
      // the live columns are (each a lazy zigzag in the shader). A column of the front is a chain of BROAD zigzags drawn
      // stroke by stroke: the hand goes from side to side as it comes toward us, each traverse one pressed candle stroke
      // with round ends, three to six of them to a zigzag and then bare ink before the next; traverse, pitch and width
      // grow as they come (0.8 m a side and 0.4 m broad at the foot, a metre a side and 0.7 m broad at the near end), so
      // the nearest are the widest and stand farthest apart.
      const column = async (near, zEnd, sink, broad) => { const X = lineOf(near); let z = FALL_FOOT - 4.4 + mr.range(0, 2.5), m = 0, n = 0;
        while (z < Math.min(zEnd, 127) - 2) { const t = clamp((z - FALL_FOOT) / (BASIN_Z1 - FALL_FOOT), 0, 1); if (m % 4 === 3) await ctx.yield();
          if (broad) { const turns = 3 + Math.floor(mr() * 4), p = lerp(1.4, 2.6, t) * mr.range(0.9, 1.1), zz = []; let part = null, h = 0, w = 0, sgn = 0;
            // (a zigzag asks at its first traverse whether it is parted, and a parted one draws nothing more; a traverse asks first whether it is
            // lifted; the first traverse that is laid draws the zigzag's swing, its breadth and its side, and each laid one its own shift)
            for (let k = 0; k < turns && z + p < 127.2; k++, z += p, sgn = -sgn) { if (part === null) part = mr.chance(0.03 + 0.07 * t); if (part || mr.chance(0.08)) { zz.push(false); continue; }
              if (!sgn) { h = lerp(0.8, 1.08, t) * mr.range(0.9, 1.1); w = lerp(0.2, 0.36, t) * mr.range(0.9, 1.12); sgn = mr.sign(); } const j = mr.range(-0.12, 0.12);
              zz.push(sink(X(z + p) - sgn * h + j, z + p, X(z) + sgn * h + j, z, w, 0, 0, lerp(0.9, 1.15, t), m, t)); }
            n += mark(zz); m++; z += mr.range(0.9, 1.6) + 2.6 * t; continue; }
          const L = mr.range(3.6, 5.0) + 4.5 * t, z1 = Math.min(z + L, 127);
          if (!mr.chance(0.04 + 0.08 * t)) n += mark([sink(X(z1) + mr.range(-0.2, 0.2), z1, X(z) + mr.range(-0.2, 0.2), z, () => lerp(0.12, 0.3, t) * mr.range(0.9, 1.12), () => lerp(0.42, 1.0, t) * mr.range(0.85, 1.15), () => lerp(2.3, 4.3, t) * mr.range(0.9, 1.1), lerp(1.6, 2.1, t), m, t)]);
          m++; z = z1 + mr.range(0.5, 1.1) + 2.0 * t; }
        return n; };
      // (1) WHAT STANDS ROUND THE BASIN lies in it in its own colour (laid first: the columns of the front break off where one of these crosses). Under each flame on the rim's piers a short chain from
      // the rim into the ink (lemon and candle, as the flames are); under each great willow more chains between the live
      // ones, broader and as long as the tree is tall; under each wheel of the flank terraces a chain as long as three
      // times its height, in its side's colour.
      for (const sd of [-1, 1]) { let i = sd > 0 ? 1 : 0; for (const z of [108, 86, 64, 42, 20]) { const zt = clamp(z + 7, 8, 126); mirrorN.rim += run(sd * 62, z, lerp(sd * 62, pathX(zt), 0.24), lerp(z, zt, 0.24), i++ % 2 ? PAL.PAPER : PAL.LEMON, { w: 0.12, zig: 0.6, gap: 2.2 }); }
        for (const x of [5, 16, 27.5, 39, 51]) { if (sd < 0 && x === 5) continue; mirrorN.rim += run(sd * x, 127.2, sd * x + (pathX(112) - sd * x) * 0.1, 127.2 - mr.range(9, 13), i++ % 2 ? PAL.PAPER : PAL.LEMON, { w: 0.12, zig: 0.6, gap: 2.2 }); } }
      await ctx.yield();
      for (const W of WILLOWS) { const tall = W.h / 38;
        if (W.z < 0) mirrorN.tall += run(W.x, 9, W.x + (pathX(70) - W.x) * 0.42, 9 + W.h * 1.9, W.col, { w: 0.19, zig: 0.95, gap: 2.6, fade: 1 });
        else for (const q of [-0.5, 0.5]) { const x0 = W.s * 62, z0 = W.z + q * 5.5; mirrorN.tall += run(x0, z0, x0 + (9.5 - x0) * 0.94 * tall, z0 + (63 + q * 13 - z0) * 0.94 * tall, W.col, { w: 0.19, zig: 0.95, gap: 2.6, fade: 1 }); } }
      await ctx.yield();
      for (const h of A.wheelHubs) { const sd = Math.sign(h.position.x), wc = sd < 0 ? accentL : accentR, z0 = h.position.z + 6 + (Math.abs(h.position.x) - 78) * 0.45, tx = pathX(64), len = 3 * (h.position.y + h.radius), dl = Math.hypot(tx - sd * 62, 64 - z0);
        mirrorN.tall += run(sd * 62, z0, sd * 62 + (tx - sd * 62) * len / dl, z0 + (64 - z0) * len / dl, wc, { w: 0.11 + 0.012 * h.radius, zig: 0.8, gap: 2.4, fade: 1 }); }
      await ctx.yield();
      // (2) THE FRONT LAID DOWN. Its columns stand close at the foot and thin toward us: the three by the course come the
      // whole way, each of the others as far as its own draw gives (half of them the whole way). Under the fall (between
      // its parting and its ends) the first of a column is candle white, as the fall is below its lip; the rest, and
      // every column outside the fall, is lemon, as the lip, the windows and the crown are.
      for (const sd of [-1, 1]) for (let i = 0; i < SLOTS.length; i++) { if (isRockets(i)) continue; const id = ++mid, x0 = SLOTS[i] / 0.62, underFall = x0 > FR.parting && x0 < FR.fallHalf, r = i < 3 ? 0 : mr();
        mirrorN.front += await column(sd * SLOTS[i], r < 0.5 ? 127 : FALL_FOOT + 30 + 94 * (r - 0.5) / 0.5, (ax, az, bx, bz, w, zg, per, gap) => lay(ax, az, bx, bz, id, () => { const base = underFall && bz < FALL_FOOT + 26 ? PAL.PAPER : PAL.LEMON, c0 = mr.chance(0.14) ? (base === PAL.LEMON ? PAL.PAPER : PAL.LEMON) : base;
          // (under the bouquet lemon lies in rose, as the live columns do)
          return !rare ? c0 : c0 === PAL.LEMON ? PAL.ROSE + (mr.chance(0.3) ? 0.25 : 0) : mr.chance(0.45) ? PAL.ROSE + 0.25 : c0; }, w, zg, per, gap), true);
        await ctx.yield(); }
      // (3) UNDER THE ROCKETS' FAN: each rocket's willow lies in the ink in its own colour while it stands, in the rockets'
      // lane nearest to where it is seen over the palace from the basin's middle station, as long as the rocket is high.
      // Each stroke takes the clock of the rocket's own strokes (hero.rockets: launched at u0, each drawn over w and lifted
      // 9 w later), so the zigzags score the basin as the rockets are drawn and go with them; where one rocket follows
      // another in a lane, its strokes are laid as the earlier one's are lifted. Between rockets the lane is bare ink.
      { const busy = {};
        for (const R of hero.rockets.slice().sort((a, b) => a.u0 - b.u0)) { const f = (EYE[1] - FALL_FOOT) / (EYE[1] - R.z), xr0 = EYE[0] + (R.x - EYE[0]) * f, sd = Math.sign(xr0) || 1; let si = -1;
          for (let i = 0; i < SLOTS.length; i++) if (isRockets(i) && (si < 0 || Math.abs(SLOTS[i] - Math.abs(xr0) * 0.62) < Math.abs(SLOTS[si] - Math.abs(xr0) * 0.62))) si = i;
          const key = sd * si, from = busy[key] ?? 0, id = ++mid; busy[key] = R.u0 + R.w * 10;
          mirrorN.rockets += await column(sd * SLOTS[si], FALL_FOOT + R.apexY * 0.95, (ax, az, bx, bz, w, zg, per, gap, m) => lay(ax, az, bx, bz, id, () => R.col + (mr.chance(0.3) ? 0.25 : 0), w, zg, per, gap, [Math.max(R.u0 + R.w * (0.9 + 0.28 * m), from), R.u0 + R.w * (9.9 + 0.28 * m)])); }
        await ctx.yield(); }
    }
    scene.add(mirror.build({ segs: 1, minPx: 1.25 }));
    await ctx.yield();
    scene.add(glint.build({ segs: 3, minPx: 1.5 }));
    scene.add(rings.build({ segs: 4 }));
    scene.add(rim.build({ segs: 6, minPx: 1.3 }));
    await ctx.yield();

    // ---- the hoop: a ring 1.4 m thick rubbed solid with candle on both faces, on two candle posts ----
    const HOOP = new THREE.Vector3(seat.x, seat.y, seat.z + 0.3), HOOP_S = 300 - seat.z;
    const rubMat = new THREE.ShaderMaterial({
      uniforms: { ...wash, uC: { value: HOOP } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: STYLE_GLSL + /* glsl */`
uniform vec3 uC; varying vec3 vW;
void main(){ vec2 q = vW.xy - uC.xy; float rad = length(q), a = atan(q.y, q.x + 1e-5), d = length(cameraPosition - vW);
  float post = step(q.y, -7.45) * step(2.95, abs(q.x)) * step(abs(q.x), 3.85);                                         // the posts are rubbed up and down, the ring round and round
  vec2 sp = mix(vec2(a * rad, rad), vW.yx, min(post, 1.0));
  float edge = (fwTooth(sp * vec2(0.9, 2.0)) - 0.5) * 0.22;
  if (post < 0.5 && (rad < 7.3 + edge || rad > 8.7 + edge)) discard;       // (the ring stands a hand clear of the blank disc, radius 7, so it reads as a ring round it: three coats show dark between)
  float fine = 1.0 - smoothstep(0.02, 0.07, d * uPx);
  float tooth = fwTooth(vec2(sp.x * 0.5, sp.y * 3.1) + 3.7), press = 0.72 + 0.28 * fwVn(vec2(sp.x * 0.35, sp.y * 1.3));
  float hole = step(0.42 + 0.5 * press, tooth + 0.45 * (1.0 - step(0.2, fwVn(vec2(sp.x * 0.8, 7.0 + sp.y * 0.6))))) * fine;
  hole = max(hole, step(0.8, fwVn(vec2(sp.x * 0.5, sp.y * 4.6) + 11.3)) * (1.0 - smoothstep(0.1, 0.2, d * uPx)));   // where the rubbing skipped: long streaks of ink along the stroke
  // the band holds paper and ink and nothing between them: a skipped streak or fleck is the ink of the three coats under it,
  // with a hard edge, or (finer than the eye can part them) it is not drawn
  vec3 col = mix(uPal[0], uPal[3], step(0.5, hole));
  gl_FragColor = vec4(col, 1.0); }` });
    { const g = new THREE.RingGeometry(7.1, 8.9, 72, 1), ring = new THREE.Mesh(g, rubMat); ring.position.copy(HOOP); scene.add(ring);
      const pg = solidBuilder(); for (const s of [-1, 1]) { const x = s * 3.4; pg.quad([x - 0.32, 0, HOOP.z - 0.02], [x + 0.32, 0, HOOP.z - 0.02], [x + 0.36, HOOP.y - 7.6, HOOP.z - 0.02], [x - 0.36, HOOP.y - 7.6, HOOP.z - 0.02]); }
      scene.add(new THREE.Mesh(pg.geometry(), rubMat)); }

    // ---- beads: the ink stands on the wax in droplets that swell behind the lip, roll downhill and drip; on the hoop they sheet off the lower rim ----
    const beadMat = new THREE.ShaderMaterial({
      uniforms: { ...wash, uC: { value: HOOP }, uHoopS: { value: HOOP_S }, uFan: { value: new THREE.Vector4(FAN.u1, 0, 0, 0) }, uFanR: { value: new THREE.Vector3(1, 0, 0) }, uFanF: { value: new THREE.Vector3(0, 0, 1) } }, side: THREE.DoubleSide,
      vertexShader: STYLE_GLSL + /* glsl */`
attribute vec4 iP; attribute vec4 iM; uniform vec3 uC; uniform float uHoopS; uniform vec4 uFan; uniform vec3 uFanR; uniform vec3 uFanF; varying vec3 vL; varying vec2 vT;
void main(){ vec3 base = iP.xyz; float seed = iP.w, size = iM.y; vec3 p = position; float grow = 0.0, tear = 0.0;
  if (iM.x < 0.5) {                                                    // on ground wax
    vec4 k = coats(base, 0.0); float back = k.w, s2 = fract(seed * 17.3);
    grow = step(0.5, k.x) * smoothstep(0.4, 4.0 + 6.0 * seed, back) * (1.0 - smoothstep(34.0, 58.0, back)) * mix(0.55, 1.0, uDamp);
    float roll = clamp((back - 7.0 - 22.0 * s2) / 9.0, 0.0, 1.0) * step(0.45, seed);   // some roll downhill and are gone
    base += uWashD * roll * roll * (0.5 + 1.3 * s2) + cross(uWashD, vec3(0., 1., 0.)) * roll * (seed - 0.72) * 0.5;
    grow *= 1.0 - smoothstep(0.75, 1.0, roll);
  } else if (iM.x > 1.5) {                                             // on the peacock's fan: swell as the coat crosses, then shaken off
    float tt = clamp((uProg - uFan.x - 0.014 * seed) / 0.024, 0.0, 1.0);
    base += (uFanR * sin(iM.z) + vec3(0., 1., 0.) * cos(iM.z)) * iM.w * tt + vec3(0., -2.4, 0.) * tt * tt + uFanF * 0.7 * tt;
    grow = smoothstep(uFan.x - 0.03, uFan.x - 0.006, uProg) * (1.0 - smoothstep(0.75, 1.0, tt));
    p = position.xzy;
  } else {                                                             // on the hoop: swell, slide round to the lower rim, hang, drop
    float climb = 0.5 - 0.5 * cos(iM.z);                                 // the wash climbs the hoop from its foot: 0 at the bottom, 1 at the top
    float wet = smoothstep(0.846 + 0.034 * climb + 0.01 * seed, 0.866 + 0.034 * climb + 0.01 * seed, uProg);
    float cyc = fract(uTime * (0.16 + 0.1 * fract(seed * 7.7)) + seed * 5.0);
    float sl = smoothstep(0.12, 0.72, cyc), a = iM.z * mix(1.0, 0.3, sl * sl), R = mix(iM.w, 8.58, sl);
    float fall = max(cyc - 0.78, 0.0) / 0.22;
    base = uC + vec3(sin(a) * R, -cos(a) * R - fall * fall * max(uC.y - 8.58 * cos(a) - 0.2, 0.3), 0.12);
    grow = wet * smoothstep(0.0, 0.14, cyc) * (0.7 + 0.5 * sl) * (1.0 - smoothstep(0.85, 1.0, fall));
    tear = smoothstep(0.45, 0.78, cyc) * smoothstep(-0.55, 0.45, cos(a)) * (1.0 - 0.45 * smoothstep(0.0, 0.5, fall));   // it hangs from the lower arc as a tear, and falls as a shorter one
    p = position.xzy; p.y *= 1.0 + 1.9 * tear * step(0.0, p.y); }
  float dist = length(cameraPosition - base);
  float r = size * grow; if (iM.x > 0.5 && iM.x < 1.5) r = max(r, min(grow, 1.0) * (3.1 + 2.4 * tear) * dist * uPx); r *= smoothstep(1.0, 2.4, r / max(dist * uPx, 1e-5));   // a bead under a pixel and a half is not drawn at all; a hanging or falling tear is never under five pixels and a half
  vL = position; vT = vec2(tear, seed); gl_Position = projectionMatrix * viewMatrix * vec4(base + p * r, 1.0); }`,
      fragmentShader: STYLE_GLSL + /* glsl */`
varying vec3 vL; varying vec2 vT;
void main(){ vec2 q = vL.xz; float tear = vT.x, sd = vT.y, rl = length(q); vec2 qd = q / max(rl, 1e-4);
  // a round drop with a hand-uneven outline (the six-sided dome is only its carrier: nothing of it shows)
  float rim = 0.775 + 0.085 * fwVn(qd * 1.7 + sd * 37.0);
  float yy = clamp(q.y / rim, 0.0, 1.0), wC = sqrt(max(rim * rim - q.y * q.y, 0.0));
  float wT = rim * pow(max(1.0 - yy, 0.0), 1.15) * (1.0 + 0.9 * yy);       // a tear: the upper half drawn out to a point (the vertex shader has stretched it)
  if (abs(q.x) > mix(wC, min(wC, wT), tear * step(0.0, q.y))) discard;
  vec2 qs = vec2(q.x, q.y > 0.0 ? q.y * (1.0 + 1.9 * tear) : q.y);
  vec3 col = uPal[3];
  if (length(qs - vec2(-0.2, 0.17)) > rim * 0.8 && q.x - q.y > 0.3) col = uPal[2];                    // a crescent of the paler coat on the far side
  if (length(qs - vec2(-0.3, 0.27)) < 0.15 + 0.05 * fwVn(qd * 2.1 + sd * 9.0)) col = uPal[0];        // the window: a round fleck of bare paper
  gl_FragColor = vec4(col, 1.0); }` });
    const domeGeo = (() => { const pos = [], idx = []; for (let k = 0; k < 6; k++) { const a = k * TAU / 6; pos.push(Math.cos(a), 0, Math.sin(a)); } for (let k = 0; k < 6; k++) { const a = (k + 0.5) * TAU / 6; pos.push(Math.cos(a) * 0.68, 0.52, Math.sin(a) * 0.68); }
      for (let k = 0; k < 6; k++) { const a = k, b = (k + 1) % 6, c = 6 + k, d = 6 + (k + 5) % 6; idx.push(a, c, b, a, d, c); } idx.push(6, 8, 7, 6, 9, 8, 6, 10, 9, 6, 11, 10);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g; })();
    const beadMesh = (list, centre, radius) => { const n = Math.max(1, list.length), g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', domeGeo.getAttribute('position')); g.setIndex(domeGeo.getIndex());
      const P = new Float32Array(n * 4), M = new Float32Array(n * 4); list.forEach((b, i) => { P.set(b.slice(0, 4), i * 4); M.set(b.slice(4, 8), i * 4); });
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iM', new THREE.InstancedBufferAttribute(M, 4)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(centre, radius); const m = new THREE.Mesh(g, beadMat); m.renderOrder = 3; scene.add(m); return m; };
    { const maxB = Math.round(3700 * detail), keep = Math.min(1, maxB / Math.max(1, beadPts.length)), nearB = [], farB = [], br = rng.fork('beads');
      for (const b of beadPts) { if (br() > keep) continue; const e = [b[0], b[1] + 0.01, b[2], b[3], 0, br.range(0.035, 0.085) * (b[2] < 0 ? 2.3 : 1), 0, 0]; (b[2] > 228 ? nearB : farB).push(e); }
      beadMesh(nearB, new THREE.Vector3(0, 5, 280), 62); beadMesh(farB, new THREE.Vector3(0, 2, 180), 62);
      const hb = [], hr = named('hoop-rim'); for (let i = Math.round(85 * detail); i--;) { const a = hr.range(-1, 1), a0 = Math.sign(a) * Math.pow(Math.abs(a), 0.7) * Math.PI; hb.push([0, 0, 0, hr(), 1, hr.range(0.2, 0.36) * 2.0, a0, 7.45 + hr.range(0, 1.15)]); }   // (85 large drops: the rubbed candle band shows between them)
      beadMesh(hb, HOOP.clone(), 13); beadMesh(shakeB, fanGroup.position.clone(), 9);
      if (peacocks) { const fd = new THREE.Vector3(-fanGroup.position.x, 0, 150 - PIER[2]).normalize(); beadMat.uniforms.uFanF.value.copy(fd); beadMat.uniforms.uFanR.value.set(fd.z, 0, -fd.x); } }
    await ctx.yield();

    // ---- the flight ----
    const pace = (u) => { let p = lerp(0.55, 1.2, sstep(0, 0.075, u)); p = lerp(p, 0.95, sstep(0.27, 0.36, u)); p = lerp(p, 0.84, sstep(0.44, 0.52, u)); return lerp(p, 1, sstep(0.74, 0.82, u)); };
    const palaceEye = new THREE.Vector3(0, 21, 0), fanEye = new THREE.Vector3(PIER[0], PIER[1] + 2.3, PIER[2]);
    const _g1 = new THREE.Vector3(), _g2 = new THREE.Vector3();
    const pois = [{ at: palaceEye, from: 0.03, to: 0.345, weight: 0.3 }, { at: new THREE.Vector3(0, 30, 0), from: 0.19, to: 0.34, weight: 0.42, fade: 0.35 }, { at: palaceEye, from: 0.42, to: 0.6, weight: 0.6 }, { at: new THREE.Vector3(-64, 22, 26), from: 0.588, to: 0.69, weight: 0.72, fade: 0.26 },
      { at: (time, u) => path.pointAt(u, _g1).add(_g2.set(0.3, -9.5, -30)), from: 0.036, to: 0.122, weight: 0.74, fade: 0.4 },    // ahead and a little down: the lip and the scrolls it has just uncovered below, the palace whole above them
      { at: new THREE.Vector3(0, 9, -80), from: 0.755, to: 0.935, weight: 0.55, fade: 0.3 }];                                           // the hoop held while the path swings to starboard of it
    if (peacocks) pois.push({ at: new THREE.Vector3(PEA[0] + 1.5, PEA[1] + 0.2, PEA[2] - 1.8), from: 0.116, to: 0.194, weight: 0.74, fade: 0.36 });   // the peacock on the hedge beside us
    else pois.push({ at: (time, u) => path.pointAt(u, _g1).add(_g2.set(-0.3, 7, -24)), from: 0.122, to: 0.205, weight: 0.34, fade: 0.4 });       // (swans only: up into the tunnel of strokes)
    if (peacocks) pois.push({ at: fanEye, from: 0.35, to: 0.45, weight: 0.75 });
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3(), _sz = new THREE.Vector2();
    // copy this visit's wash into the style kit's shared uniforms just before this scene is drawn, whichever camera draws it
    const setWash = (camera, h) => {
      wash.uTime.value = W.time; wash.uProg.value = W.prog; wash.uFront.value.copy(W.front); wash.uPool.value = W.pool; wash.uDamp.value = W.damp; wash.uGran.value = W.gran; wash.uSepia.value = W.sepia; wash.uSheen.value = W.sheen ?? 0.86; wash.uSky3.value = W.sky3 ?? -900; wash.uSky2.value = W.sky2 ?? -300;
      wash.uWashO.value.set(0, 0, 300); wash.uWashD.value.set(0, 0, -1);
      for (let i = 0; i < 9; i++) wash.uPal.value[i].copy(W.pal[i]);
      if (camera) { wash.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(h, 64));
        const e = camera.matrixWorld.elements, br = sky.material.uniforms.uBackrun.value;
        for (let i = 0; i < 3; i++) { const B = BACKRUN[i], dx = B[0] - e[12], dy = B[1] - e[13], dz = B[2] - e[14], l = Math.hypot(dx, dy, dz) || 1; br[i].set(dx / l, dy / l, dz / l, dz < -40 ? Math.min(B[3] / l, 0.42) : 0); } } };
    const BACKRUN = [[-62, 122, -50, 56], [16, 148, -64, 42], [70, 106, -44, 66]];
    scene.onBeforeRender = (renderer, sc, camera) => { const rt = renderer.getRenderTarget(); setWash(camera, rt ? rt.height : renderer.getDrawingBufferSize(_sz).y); };
    const apply = (time, u) => { const f = schedule(u); W.time = time; W.prog = u; W.front.y = f[0]; W.front.z = f[1]; W.pool = f[2]; W.sheen = lerp(0.86, 0.52, sstep(0.77, 0.84, u)); W.sky3 = key(S3, u); W.sky2 = key(S2, u); };
    apply(0, 0); setWash(null, 720);
    await ctx.yield();

    return {
      scene, path, duration: 40, pace,
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 26, sway: 0.5, bank: 0.22 },
      pois,
      portal: { shape: 'circle', radius: 7, color: WAX_PALETTE[0], veil: WAX_PALETTE[0], style: 'ring', glow: 0, halo: false, revealDistance: 260, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      edition: { ink, damp, programme, front, peacocks, rare },
      counts: { reflection: refl.n, mirror: mirror.n, mirrorBy: mirrorN, floaters: FLOAT },
      update(dt, time, camera, u) {
        u = clamp(u ?? 0, 0, 1);
        apply(time, u); hero.setProgress(u); hero.update(dt, time, camera);
        setWash(camera, ctx.renderer.getDrawingBufferSize(_sz).y);
        // the peacock shakes the beads off once the fan is up
        const shake = sstep(FAN.u1 - 0.004, FAN.u1 + 0.004, u) * (1 - sstep(0.44, 0.455, u));
        fanGroup.rotation.z = Math.sin(time * 34) * 0.03 * shake; fanGroup.rotation.x = Math.sin(time * 27 + 1) * 0.02 * shake;
        floaters.position.set(0.5 * Math.sin(time * 0.17), 0.035 * Math.sin(time * 1.1), 0.7 * Math.sin(time * 0.11 + 1));
        for (const f of flyers) {
          flyerAt(u, f, _q); _p.copy(_fp); _t.copy(_ft);
          const fly = sstep(0.52, 0.546, u), away = _q.away, run = sstep(0.486, 0.494, u) * (1 - fly), cross = _q.crs;
          const rx = -_t.z, rz = _t.x, y = lerp(0.12 + 0.16 * run * Math.abs(Math.sin(time * 9 + f.ph)), Math.max(0.7, _p.y - 1.85) + f.up * 0.3, fly) + away * (16 + 2 * f.up);
          f.g.position.set(_q.x, y, _q.z);
          const lat = (f.grow ? -0.7 : 0.7) * away - 1.1 * cross * (1 - cross) * 4 * 0.25 - (f.grow ? 0.1 * cross * (1 - away) : 0);   // having crossed, it bears a little to port
          f.g.rotation.set(-0.12 * run - 0.2 * away, Math.atan2(_t.x + rx * lat, _t.z + rz * lat), 0, 'YXZ');
          const open = sstep(0.472, 0.492, u), flap = Math.sin(time * (7.5 + 5 * run) + f.ph) * (0.25 + 0.22 * fly + 0.25 * run) + 0.12;
          f.wl.rotation.z = -flap * open - (1 - open) * 1.35; f.wr.rotation.z = flap * open + (1 - open) * 1.35;
          const ws = 0.25 + 0.75 * open; f.wl.scale.setScalar(ws); f.wr.scale.setScalar(ws);
        }
      },
      dispose() { domeGeo.dispose(); },
    };
  },
};
