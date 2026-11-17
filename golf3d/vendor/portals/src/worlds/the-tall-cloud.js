// The Tall Cloud: high summer drawn as hand-painted cel animation. A straw hat rides the wind off a hilltop washing line,
// out over a ruled plain of flowers beside one little railcar, into the travelling shadow of a single cloud as tall as the
// sky, through the first fat drops of rain and out into the sun again, and up the cloud's sunlit face to a gap in it.
// Under the cloud the hat is in its shade paints with everything else: the shadow's line is the event. The climb keeps the
// plain in the picture: the railcar on its line, the three strips of other crop between their hedges, the river bend.
// The turrets stand on the cloud's side of the course and take the world's one sun (white, a cream crescent on the
// sunward edge, blue-grey, violet); one small free-standing tower stands out in the plain to the right of them, with its
// flat violet shadow; the gap is a painted hoop set in the cloud, and the hat ends the flight riding low in its opening.
// (Three departures from the letter of the brief that its authors agreed to keep, 17:50 UTC: the rain is pale, not ink;
// one free-standing tower; the hat whole, flying ahead, ending in the ring.)
// The hat leads the flight as a whole hat seen from outside (it is never fixed to the lens); the cloud's underside and the
// turrets we climb are near gouache lobes (style.makeNearCloud), the near rain short pale strokes in three held drawings,
// the far rain soft pale shafts of broad brush strokes hanging from the base, the lightning a held cel. Seven small cumulus stand in ranks toward the
// horizon and drift, each with its own flat violet shadow on the crop.
// STYLE (all from one makeStyle instance in ../parts/the-tall-cloud.js): cels = a plum line round two flat paints and one
// highlight, moving on twos; the painted layer (sky, cloud, land beyond 700 m) = gouache with no line, moving smoothly.
// A cast shadow swaps paints (a second colour table), it never darkens. post.flat = 1: the paint written is the paint shown.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero, makeSunflower } from '../parts/the-tall-cloud.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// piecewise-linear table lookup: knots = [[x, y], ...] ascending in x
const table = (knots, x) => {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) if (x <= knots[i][0]) return lerp(knots[i - 1][1], knots[i][1], (x - knots[i - 1][0]) / (knots[i][0] - knots[i - 1][0]));
  return knots[knots.length - 1][1];
};
// the hill: 34 m high, its summit a little to the left of the course so the railway can skirt its right foot
const hillH = (x, z) => { const r = Math.hypot(x - 18, z + 12); return 34 * (1 - sstep(26, 150, r)); };
// brief seconds at which the flight reaches distance d along its course (the journey's own clock; everything scripted reads
// it): hilltop to 6 s, downhill to 11, low between the flower heads to 13, alongside the railcar to 15.6, up as the shadow's
// edge crosses (17), under the cloud to 25.5, out into the sun, and from 28 s the climb up the cloud's lit face
const D2S = [[0, 0], [60, 6], [150, 11], [230, 13], [320, 15.6], [375, 17], [590, 25.5], [640, 28], [1157, 40]];
// the railcar's place on its line at brief second s: it runs in to the halt at the hill's foot as we come over the crest,
// stands a moment, and sets off again beside us (a single car, driven from either end)
const CAR_Z = [[0, 330], [2, 270], [4, 205], [5.5, 160], [6.6, 140], [7.2, 136], [10.2, 136], [10.7, 139], [11.3, 150], [12, 186], [13, 245], [13.6, 262], [14.5, 296], [15.6, 338], [17, 412], [21, 516], [25.5, 640], [28, 716], [30.5, 880], [33, 1050], [36, 1230], [40, 1420], [44, 1540]];   // under the cloud it keeps 40 to 50 m ahead of us and comes out into the sun just before we do; it is lost below as we climb and found again from the top, far down on its line

// the shadow's two edges, in metres ahead of the hat at brief second s. An animator's timing, not a simulation: the near
// edge comes on fast, hangs a few metres ahead of the brim for a held breath, then sweeps over; the far edge the same.
// (values are for the scalloped line's base; on the course itself the line lies about 8 m nearer). The near edge hangs
// some 32 m out, a line across the middle of the picture, sweeps in, and lies across the brim for half a second.
const EDGE_A = [[0, 560], [10, 260], [13, 150], [15, 112], [15.6, 92], [16, 76], [16.5, 52], [16.8, 40], [17.1, 26], [17.38, 11.4], [17.9, 10.6], [18.15, -8], [20, -62], [40, -700]];
// the shadow is 300 m deep: for the whole of the rain the far edge is a thin bright bar under the cloud base
const EDGE_B = [[0, 860], [15, 420], [17.8, 330], [21, 262], [23.5, 160], [25, 44], [25.6, 16], [25.85, -1], [26.1, -5], [26.4, -16], [28, -70], [40, -600]];
// the cloud base overhead: a painted lid ROOF_H above the eye. Its rim (metres ahead of the hat) comes over us from behind and
// closes down toward the horizon over three seconds while the line on the ground is still out in the field; from 17.8 s the
// rim is the shadow's far edge, and it lifts away again as that edge crosses.
// how much of the rain is falling at brief second s: "rain streaks from 18 s, densest at 21 s"; after the far edge
// crosses (25.5 s) "the last drops fall through sunlight for two seconds"
const RAIN = [[0, 0], [17.5, 0], [18, 0.16], [19, 0.58], [21, 1], [24.2, 1], [25.5, 0.62], [27.6, 0], [40, 0]];
const ROOF_RIM = [[0, -3000], [13.6, -300], [14.5, 40], [15.2, 120], [16.0, 180], [16.6, 236], [17.2, 270], [17.75, 324], [40, 324]], ROOF_H = 46;

export default {
  id: 'the-tall-cloud',
  name: 'The Tall Cloud',
  category: 'sky',
  weirdness: 0.25,
  media: ['air', 'open', 'rail'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    const C = (h) => new THREE.Color(h);

    // ---- the seeded look: hour, weather, crop and colourway, cast, and the rare event
    const vr = rng.fork('look');
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : vr.pick(['day', 'day', 'day', 'golden', 'golden', 'dawn', 'night']);
    if (!['day', 'golden', 'dawn', 'night'].includes(hour)) hour = 'day';
    const weather = vr.pick(['shower', 'shower', 'dry', 'burst']);
    const crop = vr.pick(['sunflower', 'sunflower', 'poppy', 'cornflower']);
    const cast = { swifts: vr.chance(0.4), butterflies: vr.chance(0.35), sparrows: vr.chance(0.4) };
    const rare = !!vary.rare;

    const style = makeStyle(ctx, {});
    const pal = style.palette, side = style.side, RX = -16 * side;       // RX: the railway's x (screen-right)
    const lineX = (z) => (18.5 - (z - 19) * 11 / 24) * side;             // the washing line slants in toward the course, so its sheets face the flight
    // colourways are repaints of the same paint pots, so every material follows
    pal.car = C('#D8362B'); pal.carShade = C('#7E2440'); pal.band = C('#F2DDB0'); pal.bandShade = C('#A99BB0');
    pal.sheet = C('#F7F3E8'); pal.sheetShade = C('#B9B6DA'); pal.wood = C('#8A6A4A'); pal.woodShade = C('#4E3E52');
    pal.steel = C('#6E6A86'); pal.steelShade = C('#3F3857'); pal.roof = C('#D8362B'); pal.roofShade = C('#7E2440');
    pal.strawShade.set('#A8957C'); pal.stripShade = C('#A28F8E'); pal.dirt = C('#C9A46A'); pal.dirtShade = C('#7C6A78'); pal.dark = C('#3A3050'); pal.darkShade = C('#2A1F3D');
    if (crop === 'poppy') { pal.petal.set('#E2402C'); pal.ochre.set('#9A2C44'); pal.disc.set('#3A2A3A'); pal.discShade.set('#2A1F3D'); pal.car.set('#F4C21C'); pal.carShade.set('#B98A2E'); }
    if (crop === 'cornflower') { pal.petal.set('#3F63D0'); pal.ochre.set('#33479A'); pal.disc.set('#2B2F6E'); pal.discShade.set('#231F4D'); pal.car.set('#3F9A58'); pal.carShade.set('#24566A'); pal.band.set('#F4E2A8'); }
    if (hour === 'golden') {
      pal.cobalt.set('#3559AE'); pal.skyMid.set('#7C8FC8'); pal.skyLow.set('#F0C8A4');
      pal.white.set('#FFE6C8'); pal.cream.set('#F6AE8E'); pal.blueGrey.set('#A98FB6'); pal.violet.set('#5E3F86'); pal.shadowFar.set('#7A5C9E');
      if (crop === 'sunflower') pal.petal.set('#F5A81A');
      pal.green.set('#8DB436'); pal.greenHi.set('#C4D450'); pal.sheet.set('#FFEFD6'); pal.straw.set('#EDB95C'); pal.farGreen.set('#7FA07A'); pal.farBlue.set('#9C9CC6');
    } else if (hour === 'dawn') {
      pal.cobalt.set('#7FAEE0'); pal.skyMid.set('#BFD9DC'); pal.skyLow.set('#F6EFB4');
      pal.white.set('#FBE3DA'); pal.cream.set('#F7C3B6'); pal.blueGrey.set('#A9B4D6'); pal.violet.set('#6C63AE'); pal.shadowFar.set('#8C8AC6');
      pal.river.set('#F4F1E2'); pal.farGreen.set('#86B59C'); pal.farBlue.set('#A9C4DC'); pal.green.set('#7CBB52');
    } else if (hour === 'night') {
      pal.cobalt.set('#1E3278'); pal.skyMid.set('#33509C'); pal.skyLow.set('#7C8FCC');
      pal.white.set('#FBB79A'); pal.cream.set('#E8846F'); pal.blueGrey.set('#6C6FB0'); pal.violet.set('#3B3378'); pal.shadowFar.set('#3F3F86');
      pal.farGreen.set('#3F6E78'); pal.farBlue.set('#56689E'); pal.river.set('#9FB0D8');
      // blue hour: every cel is already in its shade paints, and the cloud's shadow takes it one table further
      const bluer = (c) => c.setRGB(0.60 * c.r + 0.05 * c.b, 0.50 * c.g + 0.20 * c.b, Math.min(1, 0.90 * c.b + 0.40 * c.g + 0.027));
      for (const [l, s] of [['petal', 'ochre'], ['disc', 'discShade'], ['green', 'greenShade'], ['red', 'wine'], ['straw', 'strawShade'], ['car', 'carShade'], ['band', 'bandShade'],
        ['sheet', 'sheetShade'], ['wood', 'woodShade'], ['steel', 'steelShade'], ['roof', 'roofShade'], ['dirt', 'dirtShade'], ['dark', 'darkShade']]) { pal[l].copy(pal[s]); bluer(pal[s]); }
      pal.greenHi.set('#3F8A5A'); bluer(pal.greenDeep); bluer(pal.stripShade);
    }
    await ctx.yield();

    // ---- the hero: the cloud, its shadow, gust and rain, the dome, the ink ring (it brings no land: that is below)
    const hero = await buildHero(ctx, { style, stage: false, ring: false, detail, weather: weather === 'dry' ? 'dry' : undefined, cloudScale: hour === 'dawn' ? 0.8 : 1 });
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---- the course
    // level over the hilltop, down the slope, low between the flower heads, in beside the railcar's windows, up as the
    // shadow's edge sweeps under us, level under the cloud, then a steep climb up the cloud's sunlit face that eases out
    // level above its lower turrets, into a gap in it (X is toward the cloud; KX mirrors with the style's side)
    const KX = side, EXIT = new THREE.Vector3(128 * KX, 176, 1050), RP = 10.5;   // RP: the opening's radius (a hoop 25 m across in its wreath)
    const path = makePath([[0, 38, 0], [0, 38, 30], [0, 36.6, 52], [0, 28, 73], [0, 18.5, 97], [-1 * KX, 10.5, 121], [-3 * KX, 6.4, 150], [-5.5 * KX, 5.3, 185],
      [-8.5 * KX, 5.1, 222], [-9.2 * KX, 5.1, 258], [-8.6 * KX, 6.5, 286], [-6 * KX, 12, 312], [-3 * KX, 20, 340], [0, 25.5, 376], [0, 27, 420], [0, 27, 480], [2 * KX, 26, 535], [6 * KX, 27, 590],
      [12 * KX, 33, 632], [20 * KX, 62, 656], [30 * KX, 112, 690], [42 * KX, 160, 724], [54 * KX, 192, 756], [64 * KX, 204, 792], [76 * KX, 206, 836], [90 * KX, 203, 890], [104 * KX, 196, 950], [116 * KX, 186, 1000], [EXIT.x, EXIT.y, EXIT.z]]);   // the climb tops out 206 m up with a quarter of the flight still to run: a long glide down the cloud's face to the gap, the whole plain below
    const NS = 256, zOfU = new Float32Array(NS + 1), tmpP = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) zOfU[i] = path.pointAt(i / NS, tmpP).z;
    const zAt = (u) => { const f = clamp01(u) * NS, i = Math.min(NS - 1, Math.floor(f)); return lerp(zOfU[i], zOfU[i + 1], f - i); };
    const LEN = path.length, sOfU = (u) => table(D2S, clamp01(u) * LEN);     // brief seconds at progress u
    const uOfS = (s) => { let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (sOfU(m) < s) lo = m; else hi = m; } return (lo + hi) / 2; };
    const pace = (u) => table([[0, 10], [50, 10], [80, 14], [150, 18], [200, 17], [320, 19], [375, 21], [590, 23], [660, 27], [900, 28], [1060, 27], [1157, 26]], clamp01(u) * LEN) / 20;
    await ctx.yield();

    // ---- the land: one sheet under the style's ground shader, fine round the hill, coarse out to 30 km
    const axis = (a, b, step) => { const o = [-30000, -13000, -6000, -3000, -1600, -900, -560, -380, -260]; for (let v = a; v <= b + 1e-3; v += step) o.push(v); o.push(260, 380, 560, 900, 1600, 3000, 6000, 13000, 30000); return o.filter((v, i) => i === 0 || v > o[i - 1]); };
    const xs = axis(-150, 190, 5), zs = axis(-170, 175, 5);
    xs.push(RX + 3 * side, RX + 6 * side); xs.sort((p, q) => p - q);
    const nx = xs.length, nz = zs.length, gp = new Float32Array(nx * nz * 3), gf = new Float32Array(nx * nz), gi = [];
    const railZ0 = 118;                                                      // the line starts in a shallow cutting at the hill's foot
    const landH = (x, z) => { let h = hillH(x, z); if (z > railZ0 - 24) h = lerp(h, Math.min(h, 0), (1 - sstep(4, 13, Math.abs(x - RX))) * sstep(railZ0 - 24, railZ0 - 6, z)); return h; };
    for (let j = 0, k = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++, k++) {
        const x = xs[i], z = zs[j], h = landH(x, z);
        gp[k * 3] = x; gp[k * 3 + 1] = h; gp[k * 3 + 2] = z;
        gf[k] = (hillH(x, z) < 0.35 && (x - RX) * side > 4.2) ? 1 : 0;
      }
      if (j % 16 === 15) await ctx.yield();
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; gi.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
    const landG = new THREE.BufferGeometry();
    landG.setAttribute('position', new THREE.BufferAttribute(gp, 3)); landG.setAttribute('aField', new THREE.BufferAttribute(gf, 1)); landG.setIndex(gi);
    const landM = style.ground({ rowSpacing: 1.5, rowNear: 34, field: true });
    if (crop !== 'sunflower') {   // poppies stand in green wheat, cornflowers in ripe wheat: the rows are the wheat's own two paints
      // and the flower is the dab's eye, so the far field stays a clean flat instead of a mix of two inks
      const u = landM.uniforms, wheat = crop === 'poppy' ? ['#8FC04A', '#2B6A5C', '#B9D862', '#3F8A7C'] : ['#E6C25A', '#6C6FA6', '#F5DD8C', '#9A8FC0'];
      u.uGreen = { value: C(wheat[0]) }; u.uGreenDeep = { value: C(wheat[1]) }; u.uPetal = { value: C(wheat[2]) }; u.uOchre = { value: C(wheat[3]) };
      u.uDisc = { value: pal.petal }; u.uDiscSh = { value: pal.ochre }; u.uRule = { value: pal.petal }; u.uEye = { value: 0.33 }; u.uLine = { value: 1 };   // the far ruling carries the flower's colour
      if (hour === 'night') { u.uGreen.value.copy(u.uGreenDeep.value); u.uGreenDeep.value.multiplyScalar(0.8); u.uPetal.value.copy(u.uOchre.value); u.uOchre.value.multiplyScalar(0.8); }
    }
    landM.uniforms.uFieldSh.value = 0;                                       // a cast shadow is one flat violet shape, on flowers and grass alike
    style.uniforms.uHillAt.value.set(18, -12, 146, 1);                         // on the hill the drawn wind comes from behind us and overtakes us down the slope
    const land = new THREE.Mesh(landG, landM); land.frustumCulled = false; scene.add(land);
    await ctx.yield();

    // ---- the near flowers: true cels in a box that travels with the hat, snapped to the row grid by the wrap itself
    const BX = 78, BZ = 96, fr = rng.fork('flowers');
    const nFl = Math.round(2300 * detail * Math.min(1.1, Math.max(0.8, density)));
    const flowerG = makeSunflower(style, fr);
    const flowerM = style.cel({ lean: 1, inkCap: 0.03, root: /* glsl */`
      { vec2 bx = vec2(${BX.toFixed(1)}, ${BZ.toFixed(1)}); float rnd = fract(root.x*0.731 + root.z*0.417), rnd2 = fract(root.x*0.377 + root.z*0.913);
        vec2 c0 = cameraPosition.xz + vec2(0., 36.);
        vec2 rel = mod(root.xz - c0 + 0.5*bx, bx) - 0.5*bx; vec2 nr = c0 + rel;
        wp.xz += nr - root.xz; root.xz = nr;
        vec2 q = rel / (0.5*bx); q *= q; float e = sqrt(sqrt(q.x*q.x + q.y*q.y + 1e-9));
        keep = step(142. + 14.*rnd2, length(root.xz - vec2(18., -12.))) * step(4.6, (root.x - (${RX.toFixed(1)})) * uSide)
             * smoothstep(0., 0.07, 0.62 + 0.38*rnd - e) * (1. - smoothstep(46. + 20.*rnd2, 62. + 20.*rnd2, cameraPosition.y)); }` });   // from the height of the climb a head is a speck: they sink away one by one as we rise, and the ruled rows carry the field
    const flowers = new THREE.InstancedMesh(flowerG, flowerM, nFl); flowers.frustumCulled = false;
    {
      const m4 = new THREE.Object3D(), rows = Math.round(BX / 1.5), per = Math.ceil(nFl / rows);
      for (let i = 0; i < nFl; i++) {
        const r = i % rows, k = Math.floor(i / rows);
        m4.position.set((r + 0.5) * 1.5 + fr.range(-0.13, 0.13), 0, (k + fr()) * BZ / per);
        m4.rotation.set(0, fr.range(-0.3, 0.3), 0); const s = fr.range(0.86, 1.12); m4.scale.set(s, s * fr.range(0.92, 1.1), s); m4.updateMatrix();
        flowers.setMatrixAt(i, m4.matrix);
        if (i % 600 === 599) await ctx.yield();
      }
    }
    scene.add(flowers);
    await ctx.yield();

    // ---- hill grass: clumps of blade cards in two greens, leaning to the wind bands in held poses
    const tris = (v) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v), 3)); g.computeVertexNormals(); return g; };
    const merge = (list) => { const g = mergeGeometries(list, false); list.forEach((q) => q.dispose()); return g; };
    const celPart = (g, lit, shade, hi = 0, card = false) => { style.paint(g, lit, shade, hi); return [g, style.inkOf(g, { card })]; };
    const gr = rng.fork('grass'), tuftParts = [];
    for (let b = 0; b < 6; b++) {
      const a = b / 6 * 6.283 + gr.range(-0.4, 0.4), h = gr.range(0.9, 1.9), w = gr.range(0.16, 0.26), out = gr.range(0.25, 0.75), ca = Math.cos(a), sa = Math.sin(a);
      const g = tris([-sa * w, 0, ca * w, sa * w, 0, -ca * w, ca * out, h, sa * out]);
      const n = g.attributes.normal; for (let k = 0; k < 3; k++) n.setXYZ(k, ca * 0.8, 0.45, sa * 0.8);
      tuftParts.push(...celPart(g, b % 3 === 0 ? pal.greenHi : pal.green, pal.greenShade, 0, true));
    }
    const tuftG = merge(tuftParts), nTuft = Math.round(5400 * detail * Math.min(1.15, density));   // long grass in clumps, thickest down the slope to the right of the course
    const tufts = new THREE.InstancedMesh(tuftG, style.cel({ lean: 1, inkCap: 0.035 }), nTuft); tufts.frustumCulled = false;
    {
      const m4 = new THREE.Object3D();
      for (let i = 0; i < nTuft; i++) {
        let x = 0, z = 0, ok = false;
        for (let t = 0; t < 6 && !ok; t++) {
          const near = gr() < 0.62, slope = i % 16 < 3; x = slope ? -gr.range(-8, 44) * side : near ? gr.range(-30, 34) : gr.range(-120, 160); z = slope ? gr.range(36, 142) : near ? gr.range(-6, 150) : gr.range(-150, 160);
          ok = hillH(x, z) > 0.5 && !(z > railZ0 - 20 && Math.abs(x - RX) < 9) && !(z > 16 && z < 46 && Math.abs(x - lineX(z)) < 3);
        }
        const s = ok ? gr.range(0.55, 1.0) * (Math.abs(x) < 6 ? 0.6 : 1) : 0;
        m4.position.set(x, landH(x, z) - 0.05, z); m4.rotation.set(0, gr() * 6.283, 0); m4.scale.set(s, s * gr.range(0.8, 1.1), s); m4.updateMatrix();
        tufts.setMatrixAt(i, m4.matrix);
        if (i % 600 === 599) await ctx.yield();
      }
    }
    scene.add(tufts);
    await ctx.yield();

    const ticks = [];                       // (dt, time, camera, u, s, tq) for every living thing; s = brief seconds, tq = time on twos
    const camP = new THREE.Vector3(), camQ = new THREE.Quaternion(), camS = new THREE.Vector3(), camF = new THREE.Vector3(0, 0, 1);

    // ---- the straw hat: a whole hat, seen from outside, that leads the flight (it is never fixed to the lens)
    const hat = new THREE.Group(); hat.matrixAutoUpdate = false; scene.add(hat);
    const hatM = style.cel({ inkCap: 0.05 });
    {
      // A whole hat (it is seen from behind through the previous world's portal): a round brim of sixteen woven rounds
      // in two ochres, close hatching in the darker ochre following the rounds, ink for the rim alone, a domed crown
      // with its red band and the knot the two tails leave from. a = 0 is the front of the brim.
      const hr = rng.fork('hat'), parts = [], R0 = 1.5, R1 = 3.5, seg = 64, NR = 16;
      const brimY = (r, a) => { const q = (r - R0) / (R1 - R0); return -0.2 * q * q + 0.07 * Math.sin(a * 3 + 0.6) * q; };
      const P = (r, a, lift = 0) => [Math.sin(a) * r, brimY(r, a) + lift, -Math.cos(a) * r];
      const hiPatch = (x, y, z) => {                                          // one pale patch with soft corners, front right
        const a = Math.atan2(x, -z), r = Math.hypot(x, z), u = (a - 0.44) / 0.27, v = (r - 2.72) / 0.5;
        return clamp01(0.5 + 1.6 * (1 - Math.sqrt(Math.sqrt(u * u * u * u + v * v * v * v))));
      };
      const straw2 = pal.straw.clone().lerp(C('#B48A45'), 0.3);
      for (let k = 0; k < NR; k++) {
        const v = [], ra = R0 + (R1 - R0) * k / NR, rb = R0 + (R1 - R0) * (k + 1) / NR;
        for (let i = 0; i < seg; i++) { const a0 = i / seg * 6.2832, a1 = (i + 1) / seg * 6.2832; v.push(...P(ra, a0), ...P(rb, a0), ...P(rb, a1), ...P(ra, a0), ...P(rb, a1), ...P(ra, a1)); }
        const g = tris(v), n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
        style.paint(g, k % 2 ? pal.straw : straw2, pal.strawShade, hiPatch);
        parts.push(g); if (k === NR - 1) parts.push(style.inkOf(g, { card: true }));
      }
      await ctx.yield();                                                      // the hat in one step ran to 31 ms on a busy machine
      const dash = [];                                                        // the weave: stitches lying along the rounds, staggered
      for (let k = 0; k < NR; k++) {
        const r = R0 + (R1 - R0) * (k + 0.5) / NR, n = Math.round(6.2832 * r / 0.3);
        for (let i = 0; i < n; i++) {
          const a = (i + (k % 2) * 0.5 + hr.range(-0.1, 0.1)) / n * 6.2832, da = 0.085 / r, w = 0.021, sl = (k % 2 ? 0.014 : -0.014);
          dash.push(...P(r - w - sl, a - da, 0.012), ...P(r + w - sl, a - da, 0.012), ...P(r + w + sl, a + da, 0.012), ...P(r - w - sl, a - da, 0.012), ...P(r + w + sl, a + da, 0.012), ...P(r - w + sl, a + da, 0.012));
        }
      }
      const dg = tris(dash), dn = dg.attributes.normal; for (let i = 0; i < dn.count; i++) dn.setXYZ(i, 0, 1, 0);
      parts.push(style.paint(dg, C('#B48A45'), pal.strawShade.clone().multiplyScalar(0.78)));
      await ctx.yield();
      const crown = new THREE.SphereGeometry(R0, 24, 7, 0, 6.2832, 0, 1.5708).toNonIndexed(); crown.scale(1, 0.633, 1);
      parts.push(...celPart(crown, pal.straw, pal.strawShade, (x, y, z) => (y > 0.62 && x > 0.2 && x < 1.0 && z < 0.3 && z > -0.9 ? 1 : 0)));
      const band = new THREE.CylinderGeometry(R0 * 1.0, R0 * 1.03, 0.42, 32, 1, true).toNonIndexed(); band.translate(0, 0.23, 0);
      parts.push(...celPart(band, pal.red, pal.wine));
      const knot = new THREE.OctahedronGeometry(0.3, 1).toNonIndexed(); knot.scale(0.8, 0.9, 1.3); knot.translate(-1.42, 0.3, -0.78);
      parts.push(...celPart(knot, pal.red, pal.wine));
      const hm = new THREE.Mesh(merge(parts), hatM); hm.frustumCulled = false; hat.add(hm);
    }
    await ctx.yield();
    // the ribbon: two tails that leave the knot on the band, run out over the brim to the front left and snap at their
    // tips, in four held shapes (four meshes made now, one shown at a time)
    // A drawn tail holds its width: when the hat is far ahead of us in the gap the two tails are still a clear red stroke
    // each (true size wherever that is larger)
    const ribM = style.cel({ inkCap: 0.05, vertex: /* glsl */`{ float g = 1.25*uPx*length(wp.xyz - cameraPosition); wp.xyz += normalize(mm[1].xyz) * (aHi > 0.1 ? 1. : -1.) * max(0., g - 0.09*length(mm[1].xyz)); }` });   // (length(mm[1]): the size the hat is drawn at)
    const ribbonPoses = [];
    for (let pz = 0; pz < 4; pz++) {
      const parts = [];
      for (let t = 0; t < 2; t++) {
        const v = [], n = 18, ph = pz * 1.571 + t * 2.1, w = 0.09 - t * 0.014;
        const B = [-1.45, 0.34 - t * 0.12, -0.8], Cc = [-4.5 + t * 0.4, 0.3 - t * 0.3, -2.9 + t * 0.4], E = [-1.55 - t * 0.9, 0.5 - t * 0.5, -4.55 + t * 0.55];
        const pt = (q) => {
          const a = (1 - q) * (1 - q), b = 2 * q * (1 - q), c = q * q, amp = 0.02 + 0.33 * q * q;
          return [a * B[0] + b * Cc[0] + c * E[0] + amp * 0.5 * Math.cos(q * 7.3 - ph), a * B[1] + b * Cc[1] + c * E[1] + amp * Math.sin(q * 8.6 - ph), a * B[2] + b * Cc[2] + c * E[2] + amp * 1.3 * Math.cos(q * 7.3 - ph)];
        };
        for (let i = 0; i < n; i++) {
          const f0 = i / n, f1 = (i + 1) / n, a = pt(f0), b = pt(f1), w0 = w * (1 + 0.3 * Math.sin(f0 * 9 - ph)), w1 = f1 > 0.99 ? 0.015 : w * (1 + 0.3 * Math.sin(f1 * 9 - ph));
          const L0 = [a[0], a[1] - w0, a[2]], R0p = [a[0], a[1] + w0, a[2]], L1 = [b[0], b[1] - w1, b[2]], R1p = [b[0], b[1] + w1, b[2]];
          v.push(...L0, ...R0p, ...R1p, ...L0, ...R1p, ...L1);
        }
        const g = tris(v), nn = g.attributes.normal; for (let i = 0; i < nn.count; i++) if (nn.getZ(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
        const cp = celPart(g, pal.red, pal.wine, (x, y, z, i) => [0, 0.2, 0.2, 0, 0.2, 0][i % 6], true); parts.push(...cp);   // (aHi marks the tail's upper edge for ribM; it stays under the highlight's threshold)
      }
      const m = new THREE.Mesh(merge(parts), ribM); m.frustumCulled = false; m.visible = pz === 0; hat.add(m); ribbonPoses.push(m);
    }
    // The hat is the wind's, and we follow it. It is in the picture, whole, from the first frame to the ring: it tumbles
    // ahead of us off the hilltop, races down the slope, skims the flower heads ahead of us while we run in beside the
    // railcar's windows, is lifted by the gust that runs before the shadow's edge, keeps to the cloud's side of the course
    // under the cloud (the lightning stands out beyond the railway), is carried across in front of
    // us by the far edge's gust, and sails up the cloud's face into the gap. It never drops behind the lens.
    // HAT = [brief second, metres ahead along the course, metres to screen-right, metres above the course ahead, how hard
    // it tumbles]. Every knot is one of the journey's own events (the D2S clock, the brief's beats, a key of the gaze):
    const HAT = [[0, 14, -0.6, -2.3, 0.35],                                   // the entry
      [1.9, 16, -0.5, -2.0, 0.4], [4.3, 18, -3, -1.5, 0.5],                   // the washing line's near post, its far post
      [6, 17, 3, -1.6, 0.6], [7, 19, -4, -1.2, 0.9],                          // the crest; the swallows cross
      [9, 20, -5, -1.0, 1], [11, 15.5, -2, -2.0, 0.6],                        // the railcar comes out from behind the hill; the foot of the slope
      [13, 14.5, -2.6, 3.0, 0.4], [14.4, 14.5, -2.6, 1.9, 0.45],              // in beside the car's first window, riding above the three dragonflies that hang beside us there (they are under its brim, not on it); where the course begins to rise
      [15.6, 14.5, -2.6, -1.6, 0.5], [16.4, 14, -3.5, -0.6, 0.9],             // the rise at its steepest, past the car's last window; the gaze is down on the field
      [17, 14, -5, -0.5, 1.2],                                                // the bow wave reaches us and the gust has it
      [18, 17, -8, -1.5, 1], [21, 23, -11, -2.5, 0.7],                        // the first drops; the rain at its densest
      [24.8, 19, -8, -3.2, 0.9], [25.5, 15.5, 0, -2.6, 1],                    // the rain is thinning; the far edge crosses (the hat is crossing in front of us)
      [26.5, 16.5, 5.5, 1.2, 0.8], [40, 16.5, 6, 1.5, 0.6]];                  // the gaze begins to turn down to the line; (from the foot of the climb its place is taken from the picture, below)
    // On the climb the gaze tips steeply up and down, so there the hat's place is taken in the picture itself, from where
    // the free-standing tower stands in it: to the right of the tower while the eye is below the tower's top, over it as
    // the eye rises past its top to the top of the climb; then the gap draws it in (by the metres left to the hoop): it
    // comes down the wall's side to the hoop from the right, rides in the lower part of its opening, and flies on
    // through it ahead of us. TOWER: where the tower stands and how high (its block, further down, sets the true top).
    const TOWER = { x: -78 * KX, z: 1110, top: 170 }, CLIMB_TOP = 206;       // CLIMB_TOP: the height the course tops out at
    const hatExit = path.tangentAt(1, new THREE.Vector3()).normalize(), hatRing = new THREE.Vector3(), hatQ3 = new THREE.Quaternion();
    const hatR = new THREE.Vector3().crossVectors(hatExit, new THREE.Vector3(0, 1, 0)).normalize(), hatU = new THREE.Vector3().crossVectors(hatR, hatExit).normalize(), hatV = new THREE.Vector3();   // the hoop's own right and up
    const camR = new THREE.Vector3(), camU = new THREE.Vector3(), hatQ = new THREE.Quaternion(), hatQ2 = new THREE.Quaternion(), hatS = new THREE.Vector3();
    const hatAt = (s, c) => { if (s <= HAT[0][0]) return HAT[0][c]; for (let i = 1; i < HAT.length; i++) if (s <= HAT[i][0]) { const f = (s - HAT[i - 1][0]) / (HAT[i][0] - HAT[i - 1][0]); return lerp(HAT[i - 1][c], HAT[i][c], f * f * (3 - 2 * f)); } return HAT[HAT.length - 1][c]; };
    const hatRot = new THREE.Matrix4(), hatE = new THREE.Euler(0, 0, 0, 'YXZ'), hatP = new THREE.Vector3(), hatT = new THREE.Vector3(), hatSc = new THREE.Vector3();
    let camPe0 = 0.936, camPe5 = 1.664;                                        // the lens: the projection's own two scales (read from the camera every frame)
    const RIB_SEQ = [0, 1, 2, 3, 2, 1, 0, 1, 3, 2, 0, 3, 1, 2];
    const HAT_IN = [0, -5.4, -0.42, 1.4];                                        // in the hoop: metres right and up from its middle, tip toward us, turn about its crown
    const placeHat = (u, s, tq, time) => {                                    // its tilts and spin are held poses (k); where it is moves on smooth time, never in steps
      const d = clamp01(u) * LEN, amp = hatAt(s, 4), k = Math.floor(tq * 4);     // held tilts, a new one every third drawing
      const toGap = hatV.copy(EXIT).sub(camP).dot(hatExit);                    // metres we have yet to fly to the hoop
      // wS: 0 while it flies the course ahead of us, 1 on the climb, where its place is taken in the picture (it changes
      // over between the place where the far edge crosses, D2S's 590 m, and 20 m past the foot of the climb, 640 m);
      // wR: 1 at the gap (it leaves for the hoop when the hoop is 232 m off and is in its opening 145 m out)
      const wS = sstep(590, 660, d), fR = Math.pow(clamp01((232 - toGap) / 87), 1.6), wR = fR * fR * (3 - 2 * fR);
      // Along the course: so many metres ahead of the eye on the course itself. Its heading from the eye then turns with
      // the gaze (about the vertical only), so when the gaze goes round to the railcar and comes back the hat keeps its
      // place in the picture and is never left outside it; to the side and above are metres in the world.
      path.posAtDist(d + hatAt(s, 1), hatP); path.tangentAtDist(d, hatT); hatT.y = 0; if (hatT.lengthSq() < 1e-6) hatT.set(0, 0, 1); hatT.normalize();
      const fh = Math.hypot(camF.x, camF.z) || 1, fx = camF.x / fh, fz = camF.z / fh, turn = Math.atan2(fx, fz) - Math.atan2(hatT.x, hatT.z), ct = Math.cos(turn), sn = Math.sin(turn);
      const rx = hatP.x - camP.x, rz = hatP.z - camP.z, lat = hatAt(s, 2);
      hatP.x = camP.x + rx * ct + rz * sn - fz * lat; hatP.z = camP.z - rx * sn + rz * ct + fx * lat; hatP.y += hatAt(s, 3) + 0.35 * amp * Math.sin(time * 1.63);
      hatP.y = Math.max(hatP.y, Math.max(landH(hatP.x, hatP.z), hillH(hatP.x, hatP.z) < 0.4 ? 3.4 : 0) + 0.9);
      // its top is tipped toward us so the crown and the red band show, its ribbons stream back toward us, and it turns
      // and tumbles in held poses
      hatE.set(-0.85 + amp * 0.45 * Math.sin(k * 1.9), Math.atan2(fx, fz), amp * 0.5 * Math.sin(k * 0.83 + 1));
      hatQ.setFromEuler(hatE);
      if (wS > 0) {
        // On the climb: where the tower's top (T) and its middle (M) stand in the picture now, and from them the hat's
        // place: beside the tower on its right, level with its middle, while the eye is below the tower's top; up and
        // over the tower's top as the eye rises from there to the top of the climb (it rises first and crosses after,
        // so it goes round the tower's shoulder, never across its face). Smooth: every term is the camera's or the
        // tower's own place. (ax, ay: across and up in the picture, -1 .. 1; kept inside it.)
        const pj = (y, c) => { hatV.set(TOWER.x, y, TOWER.z).sub(camP); return hatV.dot(c ? camU : camR) * (c ? camPe5 : camPe0) / Math.max(hatV.dot(camF), 1); };
        const rise = sstep(TOWER.top - 60, CLIMB_TOP, camP.y), over = sstep(0.3, 1, rise);
        const ax = Math.max(-0.6, Math.min(0.6, lerp(pj(0.55 * TOWER.top, 0) + 0.5, pj(TOWER.top, 0) - 0.2, over)));
        const ay = Math.max(-0.45, Math.min(0.58, lerp(pj(0.55 * TOWER.top, 1) - 0.1, pj(TOWER.top, 1) + 0.5, rise)));
        const ds = lerp(20.5, 25, rise), bob = 0.035 * Math.sin(time * 1.63), bob2 = 0.03 * Math.sin(time * 1.07 + 2);   // it rides the air: a slow smooth drift, no steps
        hatS.copy(camP).addScaledVector(camF, ds * (1 + bob2)).addScaledVector(camR, (ax + bob) * ds / camPe0).addScaledVector(camU, (ay + 0.6 * bob) * ds / camPe5);
        hatP.lerp(hatS, wS);
        hatE.set(0.8 + amp * 0.4 * Math.sin(k * 1.9), 0, amp * 0.5 * Math.sin(k * 0.83 + 1)); hatQ2.setFromEuler(hatE).premultiply(camQ);   // tipped toward the eye whatever the gaze
        hatQ.slerp(hatQ2, wS);
      }
      let hatK = 1;                                                           // how large it is drawn (1 until it flies on through the gap)
      if (wR > 0) {                                                           // drawn to the gap: one smooth path from its place in the picture to the hoop
        // It comes in from the lower right and settles in the lower part of the opening (HAT_IN below the middle: the
        // middle stays clear); on the way it flies on our line of sight to that place, so it is seen in the opening from
        // the first. It leads us there: it keeps some 60 to 70 m ahead of the eye while the hoop grows round it (a clear
        // small hat in the opening, not a speck on the hoop's rim) and is at the hoop itself for the last stretch, where
        // it turns its crown toward us, flat to the gap (34 to 21 m out).
        // Then it flies on through the hoop ahead of us: from 30 m out it runs away from us into the gap along the
        // gap's own axis, faster than we close (thru: metres beyond the hoop, none at 30 m out, 13 m when we are 15 m
        // out, 100 m when we are 6 m out), so over the last 27 m of our flight (0.8 s) it stops growing and then
        // grows small into the swirl. What lies beyond the hoop is the next world's, so the hat is drawn where the eye
        // sees it against the opening, on our side of the hoop, at the size it has at that distance (hatK): whole all
        // the way, never laid across the hoop's plane, and in the picture as a speck until we are 3 m out.
        const e = 1 - sstep(155, 208, toGap), flip = 1 - sstep(21, 34, toGap), near = Math.max(toGap - 2.8, 0.01);
        hatK = Math.max(sstep(3, 30, toGap), 1e-3); const thru = near / hatK - near;
        hatRing.copy(EXIT).addScaledVector(hatR, HAT_IN[0] + 8 * (1 - e) + 0.4 * Math.sin(time * 1.07 + 2)).addScaledVector(hatU, HAT_IN[1] + 0.8 * flip - 7 * (1 - e) + 0.3 * Math.sin(time * 1.63)).addScaledVector(hatExit, -2.8 + thru);
        hatRing.sub(camP).multiplyScalar(hatK * lerp(0.5, 1, 1 - sstep(12, 175, toGap))).add(camP);
        hatP.lerp(hatRing, wR);
        hatE.set(lerp(HAT_IN[2] + amp * 0.12 * Math.sin(k * 1.9), -1.5708, flip), Math.atan2(hatExit.x, hatExit.z), (1 - flip) * amp * 0.3 * Math.sin(k * 0.83 + 1)); hatQ3.setFromEuler(hatE);   // crown and red band toward us
        hatQ.slerp(hatQ3, wR);
      }
      // tilt toward the eye, then the spin about its own crown; in the hoop the spin settles (held wobbles only), so the two tails stream out to one side
      hatRot.makeRotationFromQuaternion(hatQ); hat.matrix.makeRotationY(lerp(amp * (0.45 * k + 0.6 * Math.sin(k * 0.6)), HAT_IN[3] + 0.22 * Math.sin(k * 0.6), wR)).premultiply(hatRot).scale(hatSc.setScalar(hatK)).setPosition(hatP); hat.matrixWorldNeedsUpdate = true;
      hat.visible = toGap > 3;                                                // it is in the picture to the end (never switched off before the last 3 m)
      const pose = RIB_SEQ[Math.floor(tq * 6) % RIB_SEQ.length];              // a new ribbon drawing every other drawing
      for (let i = 0; i < 4; i++) ribbonPoses[i].visible = i === pose;
      // the hat's own cast shadow: a flat violet ellipse on the land below and ahead of it (a painter's cheat on the sun's
      // height); too high above the land it casts none
      const gy = Math.max(landH(hatP.x, hatP.z), hillH(hatP.x, hatP.z) < 0.4 ? 2.6 : 0), hd = Math.max(0.5, hatP.y - gy);
      if (hd < 45 && hat.visible) style.uniforms.uHat.value.set(hatP.x + hatT.x * 1.6 * hd + hatT.z * 0.6 * hd, hatP.z + hatT.z * 1.6 * hd - hatT.x * 0.6 * hd, 3.4, hatP.y - 0.9);
      else style.uniforms.uHat.value.set(0, -1e6, 0.001, -1e6);
    };
    ticks.push((dt, time, camera, u, s, tq) => {
      camera.matrixWorld.decompose(camP, camQ, camS); camF.set(0, 0, -1).applyQuaternion(camQ); camR.set(1, 0, 0).applyQuaternion(camQ); camU.set(0, 1, 0).applyQuaternion(camQ);
      camPe0 = camera.projectionMatrix.elements[0] || camPe0; camPe5 = camera.projectionMatrix.elements[5] || camPe5;
      placeHat(u, s, tq, time);
    });
    await ctx.yield();
    // ==== CAST ====

    // ---- the railway: bank, two rails, sleepers, poles with three wires, the halt at the hill's foot
    const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x, y, z); return g; };
    const quadG = (a, b, c, d) => tris([...a, ...b, ...c, ...a, ...c, ...d]);
    const celM = style.cel({ inkCap: 0.09 });                                   // the one material for built things
    const RAIL_END = 1700, railParts = [], lineParts = [];                      // lineParts: the rails and the poles, which hold their width on screen (below)
    {
      const v = [], top = 1.0, hw = 1.7, bw = 3.6;                             // the bank: grass sides, a dirt top
      for (let z = railZ0; z < RAIL_END; z += 52) {
        const z1 = Math.min(RAIL_END, z + 52);
        v.push(RX - bw, 0, z, RX - hw, top, z1, RX - hw, top, z, RX - bw, 0, z, RX - bw, 0, z1, RX - hw, top, z1);
        v.push(RX + hw, top, z, RX + bw, 0, z1, RX + bw, 0, z, RX + hw, top, z, RX + hw, top, z1, RX + bw, 0, z1);
      }
      const sides = tris(v), n = sides.attributes.normal, p = sides.attributes.position;
      for (let i = 0; i < n.count; i++) { const sg = p.getX(i) > RX ? 1 : -1; n.setXYZ(i, sg * 0.55, 0.83, 0); }
      railParts.push(...celPart(sides, pal.green, pal.greenShade));
      await ctx.yield();                                                       // (a seam: the bank's sides are laid)
      const topG = quadG([RX - hw, top, railZ0], [RX - hw, top, RAIL_END], [RX + hw, top, RAIL_END], [RX + hw, top, railZ0]);
      const tn = topG.attributes.normal; for (let i = 0; i < tn.count; i++) tn.setXYZ(i, 0, 1, 0);
      railParts.push(style.paint(topG, pal.dirt, pal.dirtShade));
      const sl = [];                                                            // sleepers: flat dark bars, thinned with distance
      for (let z = railZ0 + 0.6; z < 1300; z += (z < 420 ? 1.5 : 3)) sl.push(RX - 1.15, top + 0.02, z, RX - 1.15, top + 0.02, z + 0.42, RX + 1.15, top + 0.02, z + 0.42, RX - 1.15, top + 0.02, z, RX + 1.15, top + 0.02, z + 0.42, RX + 1.15, top + 0.02, z);
      const slG = tris(sl), sn = slG.attributes.normal; for (let i = 0; i < sn.count; i++) sn.setXYZ(i, 0, 1, 0);
      railParts.push(style.paint(slG, pal.dirt.clone().lerp(pal.wood, 0.4), pal.dirtShade.clone().lerp(pal.woodShade, 0.4)));   // close to the ballast's own paint: we now run beside them, and bars that tick past twelve times a second must not flicker
      await ctx.yield();                                                       // (the bank and its sleepers are laid; the rails next)
      for (const sx of [-0.75, 0.75]) {                                         // the rails; after a heavy burst their tops carry one highlight line
        for (let z = railZ0; z < RAIL_END; z += 28) {                              // in lengths, so each holds its own width on screen (below)
          const z1 = Math.min(RAIL_END, z + 28), r = box(0.13, 0.16, z1 - z, RX + sx, top + 0.1, (z + z1) / 2);
          lineParts.push(...celPart(r, pal.steel, pal.steelShade, weather === 'burst' ? (x, y) => (y > top + 0.17 ? 1 : 0) : 0));
          if (z > railZ0 && Math.round((z - railZ0) / 28) % 20 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
      railParts.push(...celPart(box(2.6, 1.3, 0.5, RX, top + 0.65, railZ0 - 0.4), pal.wood, pal.woodShade));           // buffer stop
      railParts.push(...celPart(box(2.4, 0.5, 20, RX + 3.0 * side, top + 0.05, 141), pal.band, pal.bandShade));        // the halt's platform
      railParts.push(...celPart(box(0.16, 2.6, 0.16, RX + 3.6 * side, top + 1.6, 132.5), pal.wood, pal.woodShade));
      railParts.push(...celPart(box(0.1, 0.7, 2.2, RX + 3.6 * side, top + 2.7, 132.5), pal.sheet, pal.sheetShade, 0));  // its name board
    }
    await ctx.yield();
    const poleZ = []; for (let z = 150; z < 1310; z += 40) poleZ.push(z);
    const PX = RX - 7 * side, wireParts = [];
    for (const z of poleZ) {
      lineParts.push(...celPart(box(0.28, 9.4, 0.28, PX, 4.7, z), pal.wood, pal.woodShade));
      lineParts.push(...celPart(box(2.6, 0.2, 0.2, PX, 8.7, z), pal.wood, pal.woodShade));
      if (z % 400 === 350) await ctx.yield();
    }
    await ctx.yield();                                                         // (the poles stand; the wires next)
    const wireY = (f) => 8.95 - 1.1 * 4 * f * (1 - f);                           // three wires, drawn as ink ribbons that hold their pixel width
    for (let w = 0; w < 3; w++) {
      const v = [], sagW = [], wx = PX + (w - 1) * 1.1;
      for (let k = 0; k < poleZ.length - 1; k++) {
        for (let i = 0; i < 6; i++) {
          const f0 = i / 6, f1 = (i + 1) / 6, z0 = poleZ[k] + 40 * f0, z1 = poleZ[k] + 40 * f1, y0 = wireY(f0), y1 = wireY(f1);
          v.push(wx, y0, z0, wx, y0, z0, wx, y1, z1, wx, y0, z0, wx, y1, z1, wx, y1, z1);
          const s0 = 4 * f0 * (1 - f0), s1 = 4 * f1 * (1 - f1); sagW.push(s0, s0, s1, s0, s1, s1);
        }
      }
      const g = tris(v); style.paint(g, pal.ink, pal.ink);
      const n = g.attributes.normal, ik = g.attributes.aInk, hi = g.attributes.aHi, up = [-1, 1, 1, -1, 1, -1];
      for (let i = 0; i < n.count; i++) { n.setXYZ(i, 0, up[i % 6], 0); ik.setX(i, 2); hi.setX(i, sagW[i]); }
      wireParts.push(g);
    }
    await ctx.yield();
    // The built things stand in the sun, so each casts: a short flat violet shape on the land down the sun line, as long as
    // its height throws it under the world's one sun (metres of height over the sun's slope). The railcar (5 m to the top
    // of its roof), the halt's platform (1.3 m) and its name post (3.9 m) at their true lengths; a pole's true shadow
    // (9 m) would run on up the bank and across the rails, so it is drawn as far as the foot of the bank and no further
    // (a painter's cheat on the sun's height, as the hat's is). The bank, its top and the sleepers take the shapes that
    // lie on them (their material is land-like below 1.1 m); the car itself, the rails and the poles keep their paints.
    {
      const tanS = style.sun.y / Math.hypot(style.sun.x, style.sun.z), alX = Math.abs(style.sun.x) / Math.hypot(style.sun.x, style.sun.z), B = style.uniforms.uBox.value, BT = style.uniforms.uBoxT.value;
      B[0].set(RX, -1e7, 1.4, 7); BT[0].set(5 / tanS, 0, 0, 0);                                         // the railcar (placed each frame)
      B[1].set(PX, poleZ[0], 0.14, 0.14); BT[1].set((7 - 3.6) / alX, 40, poleZ[0], poleZ[poleZ.length - 1]);   // the poles, one every 40 m: from the pole to the bank's foot
      B[2].set(RX + 3.0 * side, 141, 1.2, 10); BT[2].set(1.3 / tanS, 0, 0, 0);                           // the halt's platform
      B[3].set(RX + 3.6 * side, 132.5, 0.08, 0.08); BT[3].set(3.9 / tanS, 0, 0, 0);                      // its name post
    }
    const rail = new THREE.Mesh(merge(railParts), style.cel({ inkCap: 0.09, cast: 1.1 })); rail.frustumCulled = false; scene.add(rail);
    // A drawn line holds its width: seen from far off or from the height of the climb, each rail, each pole and each
    // cross-arm is still about a pixel and a half across (true size wherever that is larger), so the railway stays a
    // line that leads the eye and never breaks into specks
    const HOLD = /* glsl */`{ float dC = length(wp.xyz - cameraPosition), g = 0.8*uPx*dC, rx = position.x - (${RX.toFixed(1)}), qx = position.x - (${PX.toFixed(1)});
        if (abs(rx) < 1.) wp.x += sign(abs(rx) - 0.75) * sign(rx) * max(0., g - 0.065);
        else if (abs(qx) < 0.2) wp.x += sign(qx) * max(0., g - 0.14);
        else wp.y += sign(position.y - 8.7) * max(0., g - 0.1); }`;
    await ctx.yield();
    const lines = new THREE.Mesh(merge(lineParts), style.cel({ inkCap: 0.09, vertex: HOLD })); lines.frustumCulled = false; scene.add(lines);
    // wires dip as the gust passes them, in the gust's own held poses (aHi carries the sag weight; ink ignores it otherwise)
    const wires = new THREE.Mesh(merge(wireParts), style.cel({ inkCap: 0.065, vertex: 'wp.y -= 0.9 * bow(wp.xz) * aHi;' })); wires.frustumCulled = false; scene.add(wires);
    await ctx.yield();

    // ---- the railcar: one self-propelled car, 14 m, colour by the crop's colourway, cream band, six windows a side
    const car = new THREE.Group(); scene.add(car);
    const carY = 1.18, carParts = [];
    {
      carParts.push(...celPart(box(2.3, 0.7, 12.4, 0, 0.55, 0), pal.dark, pal.darkShade));                 // underframe
      carParts.push(...celPart(box(2.8, 2.5, 14, 0, 2.15, 0), pal.car, pal.carShade));                     // body
      const roof = new THREE.CylinderGeometry(1.52, 1.52, 13.9, 10, 1, false, Math.PI / 2, Math.PI).toNonIndexed(); roof.rotateX(Math.PI / 2); roof.scale(1, 0.3, 1); roof.translate(0, 3.4, 0);
      carParts.push(...celPart(roof, pal.car, pal.carShade, (x, y) => (y > 3.83 ? 1 : 0)));
      carParts.push(...celPart(box(0.9, 0.42, 1.5, 0, 3.98, 3.4), pal.band, pal.bandShade));               // roof vent
      for (const sx of [-1, 1]) {
        const xb = sx * 1.415, band = quadG([xb, 2.0, -6.9], [xb, 2.0, 6.9], [xb, 3.05, 6.9], [xb, 3.05, -6.9]);
        const bn = band.attributes.normal; for (let i = 0; i < bn.count; i++) bn.setXYZ(i, sx, 0, 0);
        carParts.push(style.paint(band, pal.band, pal.bandShade));
        for (let w = 0; w < 6; w++) {
          const z0 = -6.1 + w * 2.08, xw = sx * 1.43, win = quadG([xw, 2.16, z0], [xw, 2.16, z0 + 1.5], [xw, 2.92, z0 + 1.5], [xw, 2.92, z0]);
          const wn = win.attributes.normal; for (let i = 0; i < wn.count; i++) wn.setXYZ(i, sx, 0, 0);
          const cp = celPart(win, pal.steel, pal.darkShade, (x, y, z) => (y > 2.5 && z > z0 + 1 ? 1 : 0), true); carParts.push(...cp);
        }
      }
      for (const sz of [-1, 1]) {                                                                           // end windows and a lamp
        const zz = sz * 7.02, win = quadG([-0.95, 2.16, zz], [0.95, 2.16, zz], [0.95, 2.95, zz], [-0.95, 2.95, zz]);
        const wn = win.attributes.normal; for (let i = 0; i < wn.count; i++) wn.setXYZ(i, 0, 0, sz);
        carParts.push(...celPart(win, pal.steel, pal.darkShade, 0, true));
        carParts.push(...celPart(box(1.9, 0.3, 0.3, 0, 0.75, sz * 7.05), pal.dark, pal.darkShade));
      }
      const body = new THREE.Mesh(merge(carParts), celM); body.frustumCulled = false; car.add(body);
    }
    await ctx.yield();
    const wheelPoses = [];
    for (let pz = 0; pz < 3; pz++) {                                                                        // wheels and coupling rods in three held drawings
      const parts = [], a = pz * Math.PI * 2 / 9;
      for (const sx of [-1, 1]) {
        for (const wz of [-5.3, -3.9, 3.9, 5.3]) {
          const w = new THREE.CylinderGeometry(0.52, 0.52, 0.22, 9).toNonIndexed(); w.rotateZ(Math.PI / 2); w.rotateX(a); w.translate(sx * 0.86, 0.34, wz);
          parts.push(...celPart(w, pal.steel, pal.darkShade, (x, y, z, i) => (i % 9 < 3 ? 1 : 0)));
        }
        for (const bz of [-4.6, 4.6]) parts.push(...celPart(box(0.08, 0.13, 1.7, sx * 1.0, 0.34 + 0.27 * Math.sin(a * 3), bz + 0.27 * Math.cos(a * 3)), pal.band, pal.bandShade));
      }
      const m = new THREE.Mesh(merge(parts), celM); m.frustumCulled = false; m.visible = pz === 0; car.add(m); wheelPoses.push(m);
      await ctx.yield();
    }
    const puffG = merge([[0, 0, 0, 1], [0.22, 0.28, 0.9, 0.72], [-0.12, -0.12, -0.85, 0.6]].flatMap(([x, y, z, r]) => celPart(new THREE.IcosahedronGeometry(r, 1).toNonIndexed().translate(x, y, z), pal.sheet, pal.sheetShade)));   // a cloudlet of three rounds, not a ball
    const puffs = [0, 1, 2].map(() => { const m = new THREE.Mesh(puffG, celM); m.frustumCulled = false; car.add(m); return m; });
    const carZ = (s) => table(CAR_Z, s);
    ticks.push((dt, time, camera, u, s, tq) => {
      const z = carZ(s), v = (carZ(s + 0.1) - carZ(s - 0.1)) / 0.2, dir = v >= 0 ? 1 : -1;
      car.position.set(RX, carY + 0.03 * Math.round(Math.sin(tq * 7)), z); style.uniforms.uBox.value[0].set(RX, z, 1.4, 7);   // (its cast shadow goes with it)
      const pose = ((Math.floor(z / 0.36) % 3) + 3) % 3; for (let i = 0; i < 3; i++) wheelPoses[i].visible = i === pose;
      for (let i = 0; i < 3; i++) {                                                                         // three puff shapes off the roof vent
        // the newest is the size of the vent; the oldest lies no higher than the window band is tall, flattens and is gone
        const age = (Math.floor(tq * 6) / 6 * 0.55 + i / 3) % 1, thin = age > 0.72 ? (age > 0.88 ? 0.42 : 0.72) : 1, sc = (0.26 + 0.3 * age) * thin, still = Math.max(0, 1 - Math.abs(v) / 8);
        puffs[i].position.set(-0.25 * side * age, 4.42 + age * (0.45 + 1.3 * still), 3.4 - dir * (0.45 + age * (1.3 + Math.min(4.6, Math.abs(v) * 0.24))));
        puffs[i].scale.set(sc, sc * 0.8 * thin, sc * 1.05); puffs[i].rotation.set(0, dir > 0 ? 0 : Math.PI, 0.35 * i);
      }
    });
    await ctx.yield();

    // ---- the hilltop: the washing line 8 m to the left (five sheets, two shirts, one empty peg), the bicycle, the round tree
    const LX = lineX(19), lineTop = (z) => landH(lineX(z), z) + 5.6, lineYaw = -Math.atan2(11, 24) * side;
    const clothM = style.cel({ inkCap: 0.06, vertex: /* glsl */`
      { float hang = clamp(-position.y / 3.2, 0., 1.); float ph = position.z*1.5 + uTq*7. + mm[3].z*0.9 + mm[3].x;
        float b = (0.28 + 0.5*sin(ph)) * hang * hang + 0.55*hang*(bow(mm[3].xz) + step(0.5, windBand(mm[3].xz)));
        wp.xyz += normalize(mat3(mm) * vec3(-1., 0., 0.)) * b * uSide + vec3(0., 0.35*b*hang, 0.);
        wn = normalize(mat3(mm) * vec3(-uSide, 0.25*hang, 1.7*cos(ph)*hang) + vec3(1e-5, 0., 0.)); }` });
    const clothG = (w, h, shirt) => {                                             // local: hung from y = 0 down to -h, along z, facing -x*side
      const v = [], nz = 5, ny = 4, parts = [];
      const P = (i, j) => { const fz = i / nz, fy = j / ny; let y = -h * fy; if (shirt && fy > 0.99 && Math.abs(fz - 0.5) < 0.25) y += h * 0.1; return [0, y - 0.12 * Math.sin(fz * Math.PI) * (1 - fy), (fz - 0.5) * w * (shirt && fy < 0.45 ? 1.5 : 1)]; };
      for (let j = 0; j < ny; j++) for (let i = 0; i < nz; i++) v.push(...P(i, j), ...P(i + 1, j), ...P(i + 1, j + 1), ...P(i, j), ...P(i + 1, j + 1), ...P(i, j + 1));
      const g = tris(v); parts.push(...celPart(g, pal.sheet, pal.sheetShade, 0, true));
      for (const pz of [-0.4, 0.4]) parts.push(style.paint(box(0.1, 0.28, 0.1, 0, 0.02, pz * w), pal.wood, pal.woodShade));   // pegs
      return merge(parts);
    };
    const sheetG = clothG(2.9, 3.2, false), shirtG = clothG(1.6, 2.1, true);
    await ctx.yield();
    const wash = [], washSlots = [20.8, 24.0, 27.2, 30.2, 33.3, 36.2, 39.4], hill = new THREE.Group(); scene.add(hill);
    washSlots.forEach((z, i) => {
      const m = new THREE.Mesh(i === 2 || i === 5 ? shirtG : sheetG, clothM); m.frustumCulled = false;
      m.position.set(lineX(z), lineTop(z) - 0.08 - 0.25 * Math.sin((z - 19) / 24 * Math.PI), z); m.rotation.y = lineYaw; m.userData.home = m.position.clone(); scene.add(m); wash.push(m);
    });
    {
      const parts = [];
      for (const z of [19, 43]) parts.push(...celPart(box(0.26, 6.2, 0.26, lineX(z), landH(lineX(z), z) + 2.9, z), pal.wood, pal.woodShade));
      const v = [], up = [];                                                     // the line itself: an ink ribbon with a little sag
      for (let i = 0; i < 12; i++) { const z0 = 19 + i * 2, z1 = z0 + 2, y0 = lineTop(z0) - 0.25 * Math.sin((z0 - 19) / 24 * Math.PI), y1 = lineTop(z1) - 0.25 * Math.sin((z1 - 19) / 24 * Math.PI), x0 = lineX(z0), x1 = lineX(z1);
        v.push(x0, y0, z0, x0, y0, z0, x1, y1, z1, x0, y0, z0, x1, y1, z1, x1, y1, z1); up.push(-1, 1, 1, -1, 1, -1); }
      const lg = tris(v); style.paint(lg, pal.ink, pal.ink); for (let i = 0; i < up.length; i++) { lg.attributes.normal.setXYZ(i, 0, up[i], 0); lg.attributes.aInk.setX(i, 2); }
      parts.push(lg);
      parts.push(style.paint(box(0.12, 0.34, 0.12, lineX(41.6), lineTop(41.6) - 0.12, 41.6), pal.red, pal.wine));     // the empty peg where the hat hung
      // the bicycle, leaning on the near post
      const bike = [], wheel = () => new THREE.TorusGeometry(0.95, 0.07, 4, 16).toNonIndexed();
      const w1 = wheel(); w1.rotateY(Math.PI / 2); w1.translate(0, 0.95, -1.25); const w2 = wheel(); w2.rotateY(Math.PI / 2); w2.translate(0, 0.95, 1.25);
      bike.push(w1, w2, box(0.07, 0.07, 2.3, 0, 1.75, 0), box(0.07, 1.2, 0.07, 0, 1.4, -0.3), box(0.07, 1.5, 0.07, 0, 1.6, 1.1), box(0.5, 0.1, 0.5, 0, 2.05, -0.35), box(0.9, 0.07, 0.07, 0, 2.4, 1.15));
      const bar1 = box(0.07, 0.07, 1.5, 0, 1.3, -0.75); bike.push(bar1);
      const bg = merge(bike); bg.rotateZ(0.2 * side); bg.rotateY(-0.5 * side); bg.translate(lineX(43) - 1.3 * side, landH(lineX(43), 43) - 0.05, 41.4);
      parts.push(...celPart(bg, pal.dark, pal.darkShade));
      await ctx.yield();
      // the round tree on the right: a trunk and three crown lobes in two greens with one highlight cluster
      const tx = -10 * side, tz = 50, ty = landH(tx, tz);
      parts.push(...celPart(new THREE.CylinderGeometry(0.32, 0.5, 4.6, 7).toNonIndexed().translate(tx, ty + 2.2, tz), pal.wood, pal.woodShade));
      [[0, 6.2, 0, 2.9], [-1.9, 5.2, 0.9, 2.2], [1.7, 5.4, -0.8, 2.3]].forEach(([dx, dy, dz, r], i) => {
        const lobe = new THREE.IcosahedronGeometry(r, 2).toNonIndexed(); lobe.scale(1, 0.86, 1); lobe.translate(tx + dx, ty + dy, tz + dz);
        parts.push(...celPart(lobe, i ? pal.green : pal.greenHi.clone().lerp(pal.green, 0.5), pal.greenShade, i === 0 ? (x, y, z) => (y > ty + 7.6 && x < tx - 0.2 ? 1 : 0) : 0));
      });
      await ctx.yield();
      const hm = new THREE.Mesh(merge(parts), style.cel({ inkCap: 0.09, hiPaint: pal.greenHi })); hm.frustumCulled = false; hill.add(hm);
    }
    await ctx.yield();
    // ---- down the slope there is nothing built: long grass in clumps (above), the pale wind band that overtakes us and
    // flattens it (style: uHillAt), the hat's violet ellipse streaking over it, swallows crossing at 7 s
    await ctx.yield();

    // ---- to the right beyond the line: three strips of other crop, nine poplars at 400 m, the white farm with its red roof
    {
      const parts = [], flat = (x0, x1, z0, z1, lit, shade, y = 0.04) => {
        const g = quadG([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]), n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
        parts.push(style.paint(g, lit, shade));
      };
      const strips = [[6, 44, pal.greenHi, pal.greenShade], [44, 92, pal.straw, pal.stripShade], [92, 150, pal.farGreen, pal.greenDeep]];
      for (const [a, b, lit, shade] of strips) {
        flat(RX - a * side, RX - b * side, 150, 1700, lit, shade);
        for (let k = 1; k < 6; k++) { const x = a + (b - a) * k / 6; flat(RX - x * side, RX - (x + 1.6) * side, 150, 1700, lit.clone().lerp(shade, 0.35), shade.clone().lerp(pal.ink, 0.15), 0.07); }
      }
      { const sm = style.cel({ inkCap: 0.09, cast: 0.5 }); sm.polygonOffset = true; sm.polygonOffsetFactor = -2; sm.polygonOffsetUnits = -6;   // the strips lie a hand above the land: pull them toward the eye in depth
        const m = new THREE.Mesh(merge(parts.splice(0)), sm); m.frustumCulled = false; scene.add(m); }
      await ctx.yield();
      const fx = RX - 78 * side, fz = 600;                                         // the farm
      parts.push(...celPart(box(16, 6, 9, fx, 3, fz), pal.sheet, pal.sheetShade));
      const roofG = new THREE.CylinderGeometry(0.01, 6.6, 4.2, 4, 1).toNonIndexed(); roofG.rotateY(Math.PI / 4); roofG.scale(1.9, 1, 1); roofG.translate(fx, 8.1, fz);
      parts.push(...celPart(roofG, pal.roof, pal.roofShade));
      parts.push(...celPart(box(9, 5, 7, fx - 15 * side, 2.5, fz + 4), pal.sheet, pal.sheetShade));
      const r2 = new THREE.CylinderGeometry(0.01, 5.2, 3.2, 4, 1).toNonIndexed(); r2.rotateY(Math.PI / 4); r2.scale(1.35, 1, 1.05); r2.translate(fx - 15 * side, 6.6, fz + 4);
      parts.push(...celPart(r2, pal.roof, pal.roofShade));
      const fm = new THREE.Mesh(merge(parts), celM); fm.frustumCulled = false; scene.add(fm);
    }
    await ctx.yield();
    const poplarPoses = [];                                                         // poplars shiver from lit to highlight: two drawings
    for (const pz of [0, 1]) {
      const parts = [], pr = rng.fork('poplar');
      for (let i = 0; i < 9; i++) {
        const x = RX - (26 + i * 11.5) * side, z = 400 + i * 3.5 + pr.range(-2, 2), h = pr.range(15, 19);
        const sp = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(); sp.scale(2.3, h * 0.5, 2.3); sp.translate(x, h * 0.56, z);
        parts.push(...celPart(sp, pal.green, pal.greenShade, (px, py, pzz, k) => (((Math.floor(k / 3) * 7 + i * 3 + pz * 5) % 11) < 2 ? 1 : 0)));
        parts.push(...celPart(box(0.5, 2.4, 0.5, x, 1.2, z), pal.wood, pal.woodShade));
      }
      const m = new THREE.Mesh(merge(parts), style.cel({ inkCap: 0.12, hiPaint: pal.greenHi })); m.frustumCulled = false; m.visible = pz === 0; scene.add(m); poplarPoses.push(m);
      await ctx.yield();
    }
    ticks.push((dt, time, camera, u, s, tq) => { const k = Math.floor(tq * 4) % 2; poplarPoses[0].visible = k === 0; poplarPoses[1].visible = k === 1; });
    await ctx.yield();

    // ---- creatures: all cels, wing poses on twos (the pose is chosen in the vertex shader; aHi marks what the pose moves)
    // A wing is a flat card, and a flat card seen along its own plane is a hair. So no wing is ever drawn flat: every card is
    // pitched (its leading edge raised), every pose of the scissor holds the tips above or below the body's plane, and the
    // line round a creature may grow wide enough to hold its pixel width at the distances they fly.
    const flyer = (code, hi, cap = 0.05) => style.cel({ inkCap: cap, hiPaint: hi, vertex: code });
    const wingTri = (parts, pts, lit, shade, tipIdx, midIdx = []) => {          // one wing card; the vertices in tipIdx flap (those in midIdx, the wrist, by less than half as much)
      const g = tris(pts.flat()), n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
      const cp = celPart(g, lit, shade, (x, y, z, i) => (tipIdx.includes(i) ? 1 : midIdx.includes(i) ? 0.42 : 0), true);
      const src = g.attributes.aHi, dst = cp[1].attributes.aHi; for (let i = 0; i < src.count; i++) dst.setX(i, src.getX(i));
      parts.push(...cp);
    };
    const bodyG = (len, r, lit, shade) => { const g = new THREE.OctahedronGeometry(1, 1).toNonIndexed(); g.scale(r, r * 0.8, len / 2); return celPart(g, lit, shade); };
    const FLAP3 = /* glsl */`{ float k = mod(floor(uTq*12. + 0.5) + floor(fract(mm[3].x*0.37 + mm[3].y*0.71)*3.), 3.) - 1.;
        wp.xyz += normalize(mm[1].xyz) * length(mm[0].xyz) * aHi * (k * 0.4 + 0.19) - normalize(mm[0].xyz) * length(mm[0].xyz) * sign(position.x) * aHi * abs(k) * 0.16; }`;   // three poses: tips low, a shallow V, high (never flat)
    const dummy = new THREE.Object3D(), vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), vD = new THREE.Vector3(), fwdH = new THREE.Vector3(), rightH = new THREE.Vector3();
    const camFrame = (u) => { path.tangentAt(clamp01(u), fwdH); fwdH.y = 0; if (fwdH.lengthSq() < 1e-6) fwdH.set(0, 0, 1); fwdH.normalize(); rightH.set(-fwdH.z, 0, fwdH.x); };   // rightH = screen-right
    // bank: the creature rolls about its own body so that its back turns toward the eye by that angle (a wing seen in plan is a shape; seen along its plane it is a hair)
    const place = (mesh, i, pos, ahead, sc, bank = 0) => {
      dummy.position.copy(pos); dummy.lookAt(ahead);
      if (bank) { vC.set(1, 0, 0).applyQuaternion(dummy.quaternion); dummy.rotateZ(vC.dot(vD.copy(camP).sub(pos)) > 0 ? -bank : bank); }
      dummy.scale.setScalar(sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    };

    // swallows (or swifts): fourteen, 1.2 m across, a three-pose scissor; pairs cross just ahead of the brim at 7, 13, 29 and 34 s
    const NSW = 14, swParts = [], swDark = cast.swifts ? pal.dark : C('#2F3F86'), swShade = cast.swifts ? pal.darkShade : C('#2A1F3D');
    swParts.push(...bodyG(0.62, 0.085, swDark, swShade));
    if (!cast.swifts) swParts.push(...celPart(new THREE.OctahedronGeometry(0.07, 0).toNonIndexed().translate(0, -0.03, 0.2), pal.roof, pal.roofShade));   // the red throat
    for (const sx of [-1, 1]) {
      // the wing is one solid blade of a scissor: a short arm out to the wrist, then the long pointed hand swept back
      const rL = [sx * 0.05, 0.07, 0.24], rT = [sx * 0.05, -0.04, -0.06], wL = [sx * 0.27, 0.05, 0.2], wT = [sx * 0.25, -0.02, 0.0], tip = [sx * 0.6, 0, cast.swifts ? -0.36 : -0.24];
      wingTri(swParts, [rL, rT, wL, rT, wT, wL, wL, wT, tip], swDark, swShade, [8], [2, 4, 5, 6, 7]);
      wingTri(swParts, [[sx * 0.015, 0, -0.2], [sx * 0.08, 0, -0.26], [sx * 0.17, 0, -0.64]], swDark, swShade, []);       // forked tail, its two streamers
    }
    const swallows = new THREE.InstancedMesh(merge(swParts), flyer(FLAP3, swDark, 0.085), NSW); swallows.frustumCulled = false; scene.add(swallows);
    const SW_CROSS = [7, 13, 29, 34], swPos = (i, time, s, out) => {
      const pair = i >> 1, ph = i * 2.399;
      if (pair < 4) {                                                             // a swoop across the course, a hand's width tall as it passes
        const tau = (s - SW_CROSS[pair] - (i & 1) * 0.28) / 1.05, dirn = pair === 1 ? -1 : 1;
        if (Math.abs(tau) < 3) { out.copy(camP).addScaledVector(camF, 7.2 + (i & 1) * 1.3 + 5.5 * tau * tau).addScaledVector(rightH, dirn * tau * 15); out.y += 0.7 + (i & 1) * 0.6 + 1.3 * tau * tau; return out; }
      }
      const a = time * (0.5 + 0.06 * (i % 5)) + ph, R = 9 + 3 * (i % 4);        // otherwise they hawk in loops ahead of the hat
      return out.copy(camP).addScaledVector(fwdH, 30 + 9 * Math.sin(ph * 3.1) + R * Math.sin(a)).addScaledVector(rightH, 17 * Math.sin(ph * 1.7) + R * 1.3 * Math.cos(a)).setY(Math.max(6, camP.y + 3 + 4 * Math.sin(ph * 5.3) + 2.5 * Math.sin(a * 1.7 + ph)));
    };
    ticks.push((dt, time, camera, u, s) => {
      camFrame(u);
      for (let i = 0; i < NSW; i++) {
        swPos(i, time, s, vA); swPos(i, time + 0.06, s + 0.06, vB);
        const tauA = i < 8 ? Math.abs(s - SW_CROSS[i >> 1] - (i & 1) * 0.28) / 1.05 : 9; vB.addScaledVector(fwdH, 0.9 * sstep(1.2, 3, tauA));   // (a crossing bird flies across the picture, its whole length seen)                 // as a pair swoops across in front of us it banks, and its back and both blades are seen whole
        place(swallows, i, vA, vB, i < 8 ? 1.3 : 1, 0.55 + 0.5 * (1 - sstep(1.4, 3, tauA)));
      }
      swallows.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();

    // dragonflies: twenty over the flowers, two blurred wing shapes swapped each drawing; three hang beside the hat from 12 to 16 s
    const NDF = Math.max(8, Math.round(20 * Math.min(1, detail + 0.2))), dfParts = [], dfr = rng.fork('dragonfly');
    dfParts.push(...bodyG(1.0, 0.07, C('#2FA7B8'), C('#24566A')), ...celPart(new THREE.OctahedronGeometry(0.11, 0).toNonIndexed().translate(0, 0.01, 0.46), pal.greenHi, pal.greenShade));
    for (const sx of [-1, 1]) {                                                 // two blurred wing shapes a side: broad paddles, the fore pair and the hind pair, each pitched
      const fore = [[sx * 0.04, 0.06, 0.40], [sx * 0.04, 0.01, 0.31], [sx * 0.46, 0.0, 0.29], [sx * 0.80, 0.04, 0.39], [sx * 0.44, 0.09, 0.47]];
      const hind = [[sx * 0.04, 0.06, 0.21], [sx * 0.04, 0.01, 0.12], [sx * 0.42, 0.0, 0.03], [sx * 0.72, 0.04, 0.07], [sx * 0.44, 0.09, 0.20]];
      for (const w of [fore, hind]) wingTri(dfParts, [w[0], w[1], w[2], w[0], w[2], w[3], w[0], w[3], w[4]], pal.blueGrey, pal.sheetShade, [2, 4, 5, 7, 8]);
      // and the blur of the beat itself, the fan the two pairs sweep between their two drawings, as one upright shape a side: seen from
      // behind or in front a dragonfly is a body between two pale wedges, never four hairs (a wing is never drawn only flat)
      wingTri(dfParts, [[sx * 0.05, 0.035, 0.26], [sx * 0.78, 0.2, 0.23], [sx * 0.78, -0.12, 0.23]], pal.blueGrey, pal.sheetShade, []);
    }
    const dragon = new THREE.InstancedMesh(merge(dfParts), flyer(/* glsl */`{ float k = mod(floor(uTq*12. + 0.5) + floor(fract(mm[3].x*0.37)*2.), 2.) - 0.5;
        wp.xyz += normalize(mm[1].xyz) * length(mm[0].xyz) * aHi * k * 0.3 * (position.z > 0.21 ? 1. : -1.); }`, pal.blueGrey, 0.06), NDF); dragon.frustumCulled = false; scene.add(dragon);
    // THE THREE THAT KEEP US COMPANY (brief: "three hang level with the hat 5 m to the left from 12 to 16 s") fly the ROUTE, each on its
    // own course: a dragonfly waits over the flowers at its own place on the course, off to the cloud's side; when the flight has come to
    // within its lead of it, it flies along at that lead (a station on the course so many metres ahead of where the flight has flown to),
    // comes in beside the course, and at the end of its stretch stops over the flowers again and is passed. Its place is the course at
    // its station plus an offset in the PATH's own frame (to the cloud's side, above the course) and a slow wander of its own; it heads
    // along its own flight and rolls into its own sideways drift. Nothing here reads the camera, its height or the gaze: where the
    // route's line and the gaze take the picture, the three are in it or out of it.
    // dOfS: the metres flown at a brief second (the clock D2S read backward), so "12 to 16 s" is a stretch of the route in metres.
    const dOfS = (sec) => table(D2S.map(([dd, ss]) => [ss, dd]), sec), DF_JOIN = dOfS(12), DF_PART = dOfS(16);
    // lead: every one flies nearer to us than the hat's near brim (the hat rides 14 m ahead at its least, its brim is 3.5 m: 10.5 m; less
    // half a wing, 1 m, and the wander, 0.9 m: under 8.6 m). left: the brief's 5 m to the left of the hat's line, one a little further in
    // and one a little further out. up: over the flower heads (which top out 4.1 m up under a course 5.1 m up), and up with the course as it rises.
    // DF_WAIT: where one waits before it joins us, to the cloud's side of everything the hat's brim sweeps as it passes low over the field
    // (the hat's place 3.6 m to that side + the brim's half width 3.5 + the hat's bob 0.4 + half a wing 1 + the wander 0.9 = 9.4 m). The three wait apart
    // from one another (each 6 m further along the course and 1.8 m further out than the last: two wings and both wanders), so they
    // join us one after another, and stop apart at the end. DF_IN: the metres of flight over which one comes in from its waiting place
    // to its place beside us, or peels away again (28 m: three and a half of its 8 m leads). The first is in beside us when the
    // flight reaches the 12 s place and begins to peel away at the 16 s place; the others 6 and 12 m later at both ends.
    const DF_WAIT = 9.4, DF_IN = 28, cor = ctx.core.makeRng(ctx.core.hashSeed('companions:' + ctx.seed));
    const DF_CO = [[8.5, 2.5, -0.9], [7, 4, -0.5], [8, 5.5, -1.1]].map(([lead, left, up], i) => ({ lead, left, up, a: DF_JOIN + lead - DF_IN - 2 + 6 * i, b: DF_PART + lead + DF_IN + 6 + 6 * i, wait: DF_WAIT + 1.8 * i,
      ph: [cor() * 6.283, cor() * 6.283, cor() * 6.283], w: [cor.range(0.7, 1.1), cor.range(1.0, 1.5), cor.range(0.5, 0.8)] }));
    const ramp = (x, w) => (x <= -w ? 0 : x >= w ? x : (x + w) * (x + w) / (4 * w));   // 0, then x, joined by a curve 2 w wide
    const coSt = (c, d) => c.a + ramp(d + c.lead - c.a, 10) - ramp(d + c.lead - c.b, 10);   // its station: it waits at a, flies at its lead, stops at b
    const coT = new THREE.Vector3(), coL = new THREE.Vector3();
    const coAt = (c, d, time, out) => {                                          // its place when the flight has flown d metres (time null: without its wander)
      const st = coSt(c, d); path.posAtDist(st, out); path.tangentAtDist(st, coT); coT.y = 0; if (coT.lengthSq() < 1e-6) coT.set(0, 0, 1); coT.normalize(); coL.set(coT.z * side, 0, -coT.x * side);
      const wx = time === null ? 0 : 0.45 * Math.sin(time * c.w[0] + c.ph[0]), wy = time === null ? 0 : 0.2 * Math.sin(time * c.w[1] + c.ph[1]), wa = time === null ? 0 : 0.7 * Math.sin(time * c.w[2] + c.ph[2]);
      // it comes in beside the course over the first DF_IN metres it flies with us (the hat is by then past it), and peels away to the
      // cloud's side again over the last DF_IN metres before it stops, so we pass it at its waiting distance, not beside the lens
      const lat = lerp(c.wait, c.left, sstep(c.a + 2, c.a + 2 + DF_IN, d + c.lead) * (1 - sstep(c.b - 6 - DF_IN, c.b - 6, d + c.lead))) + wx;
      out.addScaledVector(coL, lat).addScaledVector(coT, wa); out.y += c.up + wy;
      return out;
    };
    const dfHome = []; for (let i = 0; i < NDF; i++) dfHome.push([dfr.range(4, 15) * (dfr() < 0.7 ? side : -side * 0.8), dfr.range(4.2, 8.6), 150 + (i / NDF) * 330 + dfr.range(-8, 8), dfr() * 6.283]);
    // THE FREE ONES keep out of the way of the things that fly the course. A free dragonfly hovers about its home, hopping up to 0.8 m to
    // either side of it and 1.2 m along the field (1.5 m in all). The course is walked at even steps of ROUTE METRES (every 2 m) over the
    // stretch the field covers (homes are dealt from z 142 to z 488; with the clearance to either end that is the course from DF_FROM to
    // DF_TO metres flown, found on the path below), and a home is moved straight sideways (its height, its place along the field and its draws
    // stay) until, at every step:
    //  the eye: it is DF_LENS = 6.5 m or more from the course in space (none hovers in our way);
    //  the hat: on the cloud's side, wherever the course is low enough for the hat's brim to reach a dragonfly's height (below DF_LOW =
    //   13.5 m: the highest home 8.6 + its bob 0.3 + the tilted brim's half height 2.6 + the hat's lowest ride under the course 2), it is
    //   DF_CLOUD = 9 m or more to that side: the hat's place 3.6 m to the cloud's side + the brim's half width 3.5 + a hop 0.8 + half a
    //   wing 1.0 = 8.9, round 9;
    //  the railcar: a home the eye's rule would leave within DF_RAIL = 3.5 m of the middle of the rails (half the car 1.43 + a hop 0.8 +
    //   half a wing 1.02 = 3.25) goes to the cloud's side of the course instead;
    //  a companion: it is DF_CO_GAP = 3.4 m or more from every place a companion holds (a hop 1.5 + the companion's wander 0.9 + half a wing 1.0).
    const DF_LENS = 6.5, DF_CLOUD = 9, DF_LOW = 13.5, DF_RAIL = 3.5, DF_CO_GAP = 3.4, crs = [];
    for (let d = 0; d <= LEN; d += 2) { path.posAtDist(d, tmpP); if (tmpP.z > 142 - DF_CLOUD && tmpP.z < 488 + DF_CLOUD) crs.push([tmpP.x, tmpP.y, tmpP.z, d]); }
    const coPts = []; for (const c of DF_CO) for (const q of crs) { coAt(c, q[3], null, tmpP); coPts.push([tmpP.x, tmpP.y, tmpP.z]); }
    await ctx.yield();
    for (let i = 3; i < NDF; i++) {
      const h = dfHome[i];
      for (let pass = 0; pass < 12; pass++) {
        let worst = 0, wx = h[0];
        for (const q of crs) {                                                   // the eye, the hat, the railcar
          const dx = h[0] - q[0], dy = h[1] - q[1], dz = h[2] - q[2], cloud = dx * side >= 0;
          let need = Math.sqrt(Math.max(0, DF_LENS * DF_LENS - dy * dy)), sg = cloud ? side : -side;
          if (cloud && q[1] < DF_LOW) need = Math.max(need, DF_CLOUD);
          const lack = need - Math.hypot(dx, dz); if (lack <= worst) continue;
          let x = q[0] + sg * Math.sqrt(Math.max(0, need * need - dz * dz));
          if (!cloud && Math.abs(x - RX) < DF_RAIL) { const nc = q[1] < DF_LOW ? DF_CLOUD : need; x = q[0] + side * Math.sqrt(Math.max(0, nc * nc - dz * dz)); }
          worst = lack; wx = x;
        }
        if (worst <= 1e-3) for (const q of coPts) {                                 // then a companion's place: the home goes further out, beyond it
          const dx = h[0] - q[0], dy = h[1] - q[1], dz = h[2] - q[2], lack = DF_CO_GAP - Math.hypot(dx, dy, dz);
          if (lack > worst) { worst = lack; wx = q[0] + side * Math.sqrt(Math.max(0, DF_CO_GAP * DF_CO_GAP - dy * dy - dz * dz)); }   // (always outward: the companions keep to the cloud's side)
        }
        if (worst <= 1e-3) break;
        h[0] = wx;
      }
    }
    await ctx.yield();
    // placed and turned by its own flight alone: heading along its flight, rolled into its own drift, and nose down by as much as it is
    // flying forward (a dragonfly leans into its flight as it hovers level)
    const placeOwn = (mesh, i, pos, ahead, sc, roll, dip = 0) => { dummy.position.copy(pos); dummy.lookAt(ahead); dummy.rotateX(dip); dummy.rotateZ(roll); dummy.scale.setScalar(sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); };
    ticks.push((dt, time, camera, u, s, tq) => {
      const hop = Math.floor(tq * 2), d = clamp01(u) * LEN;
      for (let i = 0; i < NDF; i++) {
        const h = dfHome[i], j = Math.sin(hop * 12.9898 + i * 78.233) * 43758.5453, jx = (j - Math.floor(j)) - 0.5;
        if (i < 3) {                                                              // a companion: its station on the route, its own wander, heading along its own flight
          const c = DF_CO[i], go = clamp01(coSt(c, d + 1) - coSt(c, d)), vx = 0.45 * c.w[0] * Math.cos(time * c.w[0] + c.ph[0]);   // go: 0 while it hovers, 1 while it flies with us; vx: its sideways drift, m/s
          coAt(c, d, time, vA);
          vB.copy(vA).addScaledVector(coT, 0.6 + go).addScaledVector(coL, 0.5 * vx);
          placeOwn(dragon, i, vA, vB, 1.1, -0.9 * vx * side, 0.42 * go);
        } else {
          vA.set(h[0] + jx * 1.6, h[1] + 0.3 * Math.sin(time * 1.7 + h[3]), h[2] + 1.2 * Math.sin(hop * 2.3 + i)); vB.set(vA.x + Math.sin(h[3] + hop), vA.y, vA.z + Math.cos(h[3] + hop));
          placeOwn(dragon, i, vA, vB, 1.15, 0.5 * Math.sin(hop * 1.3 + h[3]));   // a held roll of its own with each hop
        }
      }
      dragon.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();

    // egrets: five white birds rising out of the flowers ahead at 15 s, just before the shadow line, and flying left toward
    // the cloud: white in sun, lilac as the line passes them. (Variation: a cloud of white butterflies instead.)
    const NEG = cast.butterflies ? 26 : 5, egParts = [], egr = rng.fork('egret'), egK = cast.butterflies ? 0.3 : 1;
    egParts.push(...bodyG(1.25, 0.15, pal.sheet, pal.sheetShade));
    if (!cast.butterflies) egParts.push(...celPart(box(0.05, 0.05, 0.42, 0, -0.02, 0.8), pal.petal, pal.ochre), ...celPart(box(0.04, 0.04, 0.7, 0, -0.06, -0.9), pal.dark, pal.darkShade));
    for (const sx of [-1, 1]) wingTri(egParts, [[sx * 0.1, 0.12, 0.34], [sx * 0.1, -0.04, -0.3], [sx * 0.75, -0.02, -0.2], [sx * 0.1, 0.12, 0.34], [sx * 0.75, -0.02, -0.2], [sx * 0.72, 0.1, 0.28], [sx * 0.72, 0.1, 0.28], [sx * 0.75, -0.02, -0.2], [sx * 1.32, 0.04, -0.12]], pal.sheet, pal.sheetShade, [2, 4, 5, 6, 7, 8]);
    const egrets = new THREE.InstancedMesh(merge(egParts), flyer(/* glsl */`{ float k = mod(floor(uTq*6. + 0.5) + floor(fract(mm[3].x*0.37 + mm[3].y*0.71)*3.), 3.) - 1.;
        float tip = step(1.0, abs(position.x)); wp.xyz += normalize(mm[1].xyz) * length(mm[0].xyz) * aHi * (k * (0.34 + 0.5*tip) + 0.2 + 0.12*tip) - normalize(mm[0].xyz) * length(mm[0].xyz) * sign(position.x) * aHi * abs(k) * (0.1 + 0.25*tip); }`, pal.sheet, 0.075), NEG);
    egrets.frustumCulled = false; scene.add(egrets);
    const egHome = []; for (let i = 0; i < NEG; i++) egHome.push([egr.range(0, 9) * side, 366 + egr.range(0, 20), egr.range(0, 0.9), egr.range(0.85, 1.15)]);
    ticks.push((dt, time, camera, u, s) => {
      for (let i = 0; i < NEG; i++) {
        const h = egHome[i], t = s - 14.9 - h[2], on = t > 0 && t < 16;
        const at = (tt, o) => o.set(h[0] + side * (4.2 * tt + 0.1 * tt * tt) * h[3], 2.4 + 6.3 * (1 - Math.exp(-tt * 0.8)) + 0.2 * tt + (cast.butterflies ? 0.9 * Math.sin(time * 5 + i * 1.7) : 0), h[1] + 3 * tt + (cast.butterflies ? 0.8 * Math.cos(time * 3.1 + i) : 0));
        at(Math.max(0, t), vA); at(Math.max(0, t) + 0.1, vB);
        place(egrets, i, vA, vB, on ? 1.05 * egK * Math.min(1, t * 2.5) + 1e-4 : 1e-4);
      }
      egrets.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();

    // crows (or sparrows) on the wires: six, two of which drop off as the railcar passes
    const crK = cast.sparrows ? 0.62 : 1, crLit = cast.sparrows ? pal.wood : pal.dark, crShade = cast.sparrows ? pal.woodShade : pal.darkShade;
    const crowSit = [...bodyG(1.25, 0.26, crLit, crShade), ...celPart(new THREE.OctahedronGeometry(0.2, 1).toNonIndexed().translate(0, 0.3, 0.5), crLit, crShade), ...celPart(box(0.07, 0.07, 0.3, 0, 0.27, 0.82), pal.petal, pal.ochre)];
    const crowsSit = new THREE.InstancedMesh(merge(crowSit), celM, 6); crowsSit.frustumCulled = false; scene.add(crowsSit);
    const crowFly = [...bodyG(1.25, 0.2, crLit, crShade)];
    for (const sx of [-1, 1]) wingTri(crowFly, [[sx * 0.1, 0.11, 0.32], [sx * 0.1, -0.05, -0.3], [sx * 1.15, -0.02, -0.18], [sx * 0.1, 0.11, 0.32], [sx * 1.15, -0.02, -0.18], [sx * 1.05, 0.08, 0.24]], crLit, crShade, [2, 4, 5]);
    const crowsFly = new THREE.InstancedMesh(merge(crowFly), flyer(FLAP3, crLit, 0.085), 2); crowsFly.frustumCulled = false; scene.add(crowsFly);
    const crowZ = [326, 334, 194, 201, 262, 270].map((z) => { const k = Math.floor((z - 150) / 40), f = (z - 150 - k * 40) / 40; return [PX + 1.1, wireY(f) + 0.26 * crK, z]; });
    ticks.push((dt, time, camera, u, s, tq) => {
      const cz = carZ(s);
      for (let i = 0; i < 6; i++) {
        const c = crowZ[i], t = i < 2 ? s - (15.0 + i * 0.4) : -1, sag = 0.9 * (cz > c[2] - 30 && cz < c[2] + 8 ? 0 : 0);
        vA.set(c[0], c[1] - sag, c[2]); vB.set(c[0] + side * (i % 2 ? 0.4 : 1), c[1] + (Math.floor(tq * 1.5 + i * 0.37) % 3 === 0 ? -0.25 : 0), c[2] - 0.8 + (i % 3) * 0.6);
        place(crowsSit, i, vA, vB, t > 0 ? 1e-4 : crK);
        if (i < 2) {                                                              // off the wire, a drop, then away over the car toward us and up
          const tt = Math.max(0, t), at = (q, o) => o.set(c[0] + side * (2.2 * q + 0.5 * q * q), c[1] - 2.2 * Math.sin(Math.min(q, 1.4) * 2.2) * Math.exp(-q * 0.6) + 0.45 * q * q * 0.5, c[2] + (9 + i * 2) * q);
          at(tt, vA); at(tt + 0.1, vB); place(crowsFly, i, vA, vB, t > 0 && t < 14 ? crK * 1.15 : 1e-4);
        }
      }
      crowsSit.instanceMatrix.needsUpdate = true; crowsFly.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();

    // petals torn loose at the shadow's edges, tumbling past in six held poses (uLean carries how many are in the air)
    const NPT = Math.round(210 * detail), ptr = rng.fork('petal');
    // a petal is a small folded card: two halves that catch the two paints, and the line round it
    const petalG = merge(celPart(tris([0, 0, -0.15, 0.075, 0.035, 0, 0, 0, 0.15, 0, 0, -0.15, 0, 0, 0.15, -0.075, 0.035, 0]), pal.petal, pal.ochre, 0, true));
    const petalM = style.cel({ inkCap: 0.022, lean: 0,
      root: /* glsl */`float sd = fract(root.x*3.71 + root.z*1.37);
        { vec3 bx = vec3(40., 12., 50.); vec3 c0 = cameraPosition + vec3(0., 0.5, 22.);
          vec3 rel = mod(root + vec3(-uSide*3.5, -1.1 - sd, -15. - 6.*sd) * uTime - c0 + 0.5*bx, bx) - 0.5*bx; vec3 nr = c0 + rel;
          wp.xyz += nr - root; root = nr; keep = step(sd, uLean) * smoothstep(7.5, 9.5, length(nr - cameraPosition)); }`,
      vertex: /* glsl */`{ float a = floor(uTq*6. + sd*6.) * 1.047 + sd*20.; vec3 r = wp.xyz - root; float ca = cos(a), sa = sin(a), cb = cos(a*0.7), sb = sin(a*0.7);
          r = vec3(r.x*ca - r.y*sa, r.x*sa + r.y*ca, r.z); r = vec3(r.x, r.y*cb - r.z*sb, r.y*sb + r.z*cb); wp.xyz = root + r;
          vec3 m = vec3(wn.x*ca - wn.y*sa, wn.x*sa + wn.y*ca, wn.z); m = vec3(m.x, m.y*cb - m.z*sb, m.y*sb + m.z*cb); wn = normalize(m + vec3(0., 1e-5, 0.)); }` });
    const petals = new THREE.InstancedMesh(petalG, petalM, NPT); petals.frustumCulled = false;
    for (let i = 0; i < NPT; i++) { dummy.position.set(ptr.range(0, 40), ptr.range(0, 12), ptr.range(0, 50)); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(ptr.range(1.7, 2.5)); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix); }   // large enough to read as petals, not specks
    scene.add(petals);
    ticks.push((dt, time, camera, u, s) => { petalM.uniforms.uLean.value = Math.max(sstep(16.2, 17.2, s) * (1 - sstep(18.8, 20.8, s)), 0.95 * sstep(25, 25.8, s) * (1 - sstep(30.6, 31.8, s))); });   // the far edge's gust tears them loose and carries them up the cloud's face with us: they are still tumbling past as the plain comes back blazing below

    // splash crowns: on the rails, the bank and the near leaves through the shadow, and on the car's own roof
    if (weather !== 'dry') {
      const spr = rng.fork('splash'), nS = Math.round(300 * detail), pts = new Float32Array(nS * 3);
      for (let i = 0; i < nS; i++) {                                              // both rails, the bank, the near leaves
        const k = i % 4, z = 385 + (i / nS) * 250 + spr.range(-3, 3);
        if (k < 2) pts.set([RX + (k ? -0.75 : 0.75), 1.27, z], i * 3);
        else if (k === 2) pts.set([RX + spr.range(-1.5, 3.4) * side, 1.03, z], i * 3);
        else pts.set([(Math.floor(spr.range(-3, 9)) + 0.5) * 1.5 * side + spr.range(-0.4, 0.4), spr.range(1.4, 2.9), z], i * 3);
      }
      scene.add(style.makeSplashes(pts, spr, 1.0, 0.012));
      const nR = 8, rp = new Float32Array(nR * 3);                               // and a row of crowns standing on the car's own roof
      for (let i = 0; i < nR; i++) rp.set([spr.range(-0.9, 0.9), 3.88 - 0.2 * Math.abs(spr.range(-1, 1)), -6.5 + (i + spr()) * 13 / nR], i * 3);
      car.add(style.makeSplashes(rp, spr, 0.6, 0.008));
    }
    await ctx.yield();

    // RARE: the whole line. The gust takes all the washing, and five sheets and two shirts sail with us as a flock for the
    // entire flight, tumbling in held poses and changing paint one by one as the edge crosses them. Each flies the route's
    // line over the ground: its station is a point of the course so many metres ahead of the metres we have flown (its
    // own lead, and a slow surge of its own), and it keeps to one side of the course there (flL: level and across the
    // course). In height it rides the air we ride: the course's height at the metres we have flown, and its own metres
    // above that (the gust that carries the flock goes up the cloud's face as we do; it does not run on up the course
    // ahead of us). Nothing here reads the lens or the gaze. Past the hoop the course runs straight on.
    if (rare) {
      const flT = new THREE.Vector3(), flL = new THREE.Vector3(), flH = new THREE.Vector3();
      ticks.push((dt, time, camera, u, s, tq) => {
        const k = Math.floor(tq * 4), d = clamp01(u) * LEN;
        for (let i = 0; i < wash.length; i++) {
          const m = wash[i], go = sstep(1.2 + i * 0.35, 3.6 + i * 0.35, s), sgn = i % 2 ? 1 : -1, up = 2.4 + (i % 3) * 1.5 + 1.1 * Math.sin(time * 0.8 + i * 1.3);
          const st = d + 13 + i * 3.4 + 2.5 * Math.sin(time * 0.6 + i * 1.9), on = Math.min(st, LEN);
          path.posAtDist(on, vA); path.tangentAtDist(on, flT).normalize(); vA.addScaledVector(flT, st - on);
          flL.set(flT.z, 0, -flT.x); if (flL.lengthSq() < 1e-6) flL.set(1, 0, 0); flL.normalize();
          vA.addScaledVector(flL, sgn * (4.6 + i * 1.5) + 1.6 * Math.sin(time * 0.43 + i * 2.6)); vA.y = path.posAtDist(d, flH).y + up;
          m.position.lerpVectors(m.userData.home, vA, go);
          const a1 = Math.sin(k * 0.9 + i * 2.1), a2 = Math.sin(k * 0.55 + i * 1.3), a3 = Math.cos(k * 0.7 + i * 0.8);
          m.rotation.set(go * (0.5 + 0.7 * a1), lineYaw + go * 1.3 * a2, go * 0.8 * a3);
        }
      });
    }

    // ---- the middle flowers: two-tone dabs standing up out of the ruled ground beyond the true cels, in a travelling,
    // row-snapped box (no line at this distance: a head of petal paint over a leaf of green). Sunflowers stand on ground
    // that is already their own two paints, so their box has no visible edge. Flowers standing in wheat (poppies,
    // cornflowers) would show the box from the hill as an island, so there the dabs thin by distance from the eye alone,
    // drop their green leaf beyond the near field, and hand over to head-only flecks that carry the colour to the far merge.
    {
      const wheat = crop !== 'sunflower';
      const MX = wheat ? 330 : 198, MZ = 240, mr = rng.fork('dabs'), nD = Math.round(13000 * detail * Math.min(1.1, Math.max(0.8, density)));
      const face = new THREE.Vector3(-0.42 * side, 0.34, -0.84).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), face), hv = [];
      for (let i = 0; i < 4; i++) { const a = [0, 1, 2, 3, 4, 5].map((k) => { const an = k / 6 * 6.2832; return new THREE.Vector3(Math.cos(an) * 0.54, Math.sin(an) * 0.54, 0).applyQuaternion(q); }); const t = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5]][i]; for (const k of t) hv.push(a[k].x, a[k].y + 2.72, a[k].z); }
      const headG = tris(hv), hn = headG.attributes.normal; for (let i = 0; i < hn.count; i++) hn.setXYZ(i, face.x, face.y, face.z);
      style.paint(headG, pal.petal, pal.ochre);
      const leafG = tris([-0.62, 1.0, 0, 0.62, 1.4, 0, 0, 2.6, 0, -0.5, 0.3, 0.1, 0.55, 0.1, -0.1, 0, 2.2, 0]), ln = leafG.attributes.normal; for (let i = 0; i < ln.count; i++) ln.setXYZ(i, -0.3 * side, 0.6, -0.74);
      style.paint(leafG, pal.green, pal.greenShade);
      const WRAP = (bx, bz, ahead) => /* glsl */`
          vec2 bx = vec2(${bx.toFixed(1)}, ${bz.toFixed(1)}); float rnd = fract(root.x*0.731 + root.z*0.417), rnd2 = fract(root.x*0.377 + root.z*0.913);
          vec2 c0 = cameraPosition.xz + vec2(0., ${ahead.toFixed(1)});
          vec2 rel = mod(root.xz - c0 + 0.5*bx, bx) - 0.5*bx; vec2 nr = c0 + rel;
          wp.xz += nr - root.xz; root.xz = nr;
          float inField = step(142. + 14.*rnd2, length(root.xz - vec2(18., -12.))) * step(4.6, (root.x - (${RX.toFixed(1)})) * uSide);
          float rr = length(nr - cameraPosition.xz);`;
      const dabRoot = (leaf) => /* glsl */`
        { ${WRAP(MX, MZ, 100)}
          vec2 q = rel / (0.5*bx); q *= q; float e = sqrt(sqrt(q.x*q.x + q.y*q.y + 1e-9));
          vec2 qc = (nr - cameraPosition.xz - vec2(0., 36.)) / vec2(${(BX / 2).toFixed(1)}, ${(BZ / 2).toFixed(1)}); qc *= qc; float ec = sqrt(sqrt(qc.x*qc.x + qc.y*qc.y + 1e-9));
          keep = inField * smoothstep(0., 0.07, ec - (0.5 + 0.4*rnd2));
          ${wheat ? `float pk = 1. - 0.74*smoothstep(78., 150., rr) - 0.26*smoothstep(150., 178., rr);
          keep *= smoothstep(0., 0.1, pk - rnd) * smoothstep(0., 0.06, 1. - e);` : 'keep *= smoothstep(0., 0.05, 0.45 + 0.55*rnd - e);'}
          keep *= 1. - smoothstep(50. + 20.*rnd2, 66. + 20.*rnd2, cameraPosition.y);
          ${leaf ? 'keep *= 1. - smoothstep(52. + 30.*rnd2, 76. + 44.*rnd2, rr);' : ''} }`;
      const place = async (mesh, n, bx, bz, y, sc) => {
        const m4 = new THREE.Object3D(), rows = Math.round(bx / 1.5), per = Math.ceil(n / rows);
        for (let i = 0; i < n; i++) {
          const r = i % rows, k = Math.floor(i / rows);
          m4.position.set((r + 0.5) * 1.5 + mr.range(-0.13, 0.13), y, (k + mr()) * bz / per);
          m4.rotation.set(0, mr.range(-0.3, 0.3), 0); const s = sc * mr.range(0.86, 1.12); m4.scale.set(s, s * mr.range(0.92, 1.1), s); m4.updateMatrix();
          mesh.setMatrixAt(i, m4.matrix);
          if (i % 800 === 799) await ctx.yield();
        }
      };
      const dabs = new THREE.InstancedMesh(wheat ? headG : merge([headG, leafG]), style.cel({ lean: 1, inkCap: 0.03, root: dabRoot(false) }), nD); dabs.frustumCulled = false;
      await place(dabs, nD, MX, MZ, 0, 1);
      scene.add(dabs);
      ticks.push(() => { dabs.visible = camP.y < 88; });                          // (by then every dab has sunk away of itself: nothing pops)
      if (wheat) {
        await ctx.yield();
        // the same plants' leaves (one instance buffer for both), kept only in the near field
        const leaves = new THREE.InstancedMesh(leafG, style.cel({ lean: 1, inkCap: 0.03, root: dabRoot(true) }), nD); leaves.frustumCulled = false;
        leaves.instanceMatrix = dabs.instanceMatrix; scene.add(leaves);
        await ctx.yield();
        // flecks: one head each, no leaf, never under 3 pixels across, thinned so that they cover the same share of the
        // picture from the hilltop as from 9 m up, and thinning away with distance into the ruled lines of the same paint
        const FX = 642, FZ = 540, nF = Math.round(7000 * detail * Math.min(1.1, Math.max(0.8, density))), rho = nF / (FX * FZ);
        const fv = [[-0.5, 0], [0, -0.5], [0.5, 0], [-0.5, 0], [0.5, 0], [0, 0.5]].flatMap(([x, y]) => { const v = new THREE.Vector3(x, y, 0).applyQuaternion(q); return [v.x, v.y, v.z]; });
        const fleckG = tris(fv), fn = fleckG.attributes.normal; for (let i = 0; i < fn.count; i++) fn.setXYZ(i, face.x, face.y, face.z);
        style.paint(fleckG, pal.petal, pal.ochre);
        const fleckM = style.cel({ lean: 0, inkCap: 0.03, root: /* glsl */`
        { ${WRAP(FX, FZ, 275)}
          vec3 tc = root - cameraPosition; float dist = length(tc);
          float g = max(1., 1.5*uPx*dist/0.5);
          wp.xyz = root + (wp.xyz - root)*g;
          float sinT = clamp(-tc.y / max(dist, 1.), 0.012, 1.);
          float pk = 0.3 * (1. - smoothstep(240., 520., dist)) * sinT / (${rho.toFixed(5)} * 0.5 * g*g);
          keep = inField * smoothstep(118., 186., rr) * smoothstep(0., 0.12, pk - rnd); }` });
        const flecks = new THREE.InstancedMesh(fleckG, fleckM, nF); flecks.frustumCulled = false;
        await place(flecks, nF, FX, FZ, 2.7, 1);
        scene.add(flecks);
      }
    }
    await ctx.yield();

    // ==== THE CLOUD AT ARM'S LENGTH ====
    // (1) Its underside as it passes over: ranks of dark pouches hanging 30 m above the flight, real lobes that slide past
    // each other as we fly under them (the painted lid behind them carries the rest to the horizon).
    // (2) The turrets of its sunlit trailing face, which the flight climbs, and the gap in them that is the way out.
    const cr = rng.fork('near'), stormLobes = [], towerLobes = [];
    const lobe = (list, x, y, z, r, o = {}) => list.push({ x, y, z, r, flat: o.flat ?? 1, dark: !!o.dark, phase: cr() * 6.283, grow: o.grow ?? 0.5, gx: o.gx ?? cr.range(-0.6, 0.6), gy: o.gy ?? 1, bias: o.bias ?? 0, seed: cr(), keep: !!o.keep });
    for (let j = 0; j < 6; j++) {
      for (let i = -6; i <= 6; i++) {
        const near = Math.abs(i) < 2, r = near ? cr.range(17, 25) : cr.range(26, 44) * (1 + 0.1 * Math.abs(i) / 6);
        const x = (i * 43 + cr.range(-13, 13) + (j % 2) * 21) * KX, z = 392 + j * 44 + cr.range(-12, 12);
        lobe(stormLobes, x, 27 + 29 + r * 0.9 + cr.range(0, 9) + Math.abs(i) * 2.5, z, r, { dark: true, bias: cr.range(-0.12, 0.2), gy: -1, grow: 0.7 });
        if (near && cr() < 0.7) lobe(stormLobes, x + cr.range(-16, 16), 27 + 27 + 9, z + cr.range(-16, 16), cr.range(8, 12), { dark: true, bias: cr.range(0, 0.25), gy: -1, grow: 1 });
      }
      await ctx.yield();
    }
    // the turrets: stacks of lobes that shrink upward to a growing cap, piled to the cloud side of the climb and behind the gap
    const dirE = path.tangentAt(1, new THREE.Vector3()).normalize(), eR = new THREE.Vector3().crossVectors(dirE, new THREE.Vector3(0, 1, 0)).normalize(), eU = new THREE.Vector3().crossVectors(eR, dirE).normalize();
    // Big forms, not one size of lump: a first turret at the foot of the climb, a wall the climb goes up beside, a giant
    // behind it that spreads into an anvil, shelves that stand out of the walls with flat violet undersides, and more
    // behind the gap. Every one of these stands on the cloud's side of the course: to the right of it the sky is cobalt,
    // the small cumulus of the painted layer and the one free-standing tower authored further down.
    // TUR = [x toward the cloud, z, top, radius, tone, shelf height or 0]
    const TUR = [[176, 640, 250, 60, 0, 150], [156, 772, 330, 68, 0.02, 215], [268, 905, 440, 96, 0, 300], [230, 972, 280, 68, -0.04, 0], [236, 1090, 250, 66, 0, 170], [150, 1210, 230, 62, 0, 0], [336, 1150, 320, 72, -0.02, 0]];
    // Each big round carries smaller rounds of its own on the side we see (authored lobes, as the far cloud is drawn: every
    // one a single shape cut into the four values; no pattern inside a lobe)
    const kids = (x, y, z, r, bias, n) => {
      for (let j = 0; j < n; j++) {
        const az = -1.5708 + cr.range(-1.5, 0.8), el = cr.range(-0.25, 1.0), d = r * cr.range(0.7, 0.96), kr = r * cr.range(0.24, 0.42);
        lobe(towerLobes, x + Math.cos(el) * Math.cos(az) * d * KX, y + Math.sin(el) * d, z + Math.cos(el) * Math.sin(az) * d, kr, { bias: bias + cr.range(-0.14, 0.12) + 0.12 * Math.sin(el), grow: 0.9 });
      }
    };
    for (const [tx, tz, top0, r0, tone, shelf] of TUR) {
      const top = top0 * cr.range(0.95, 1.06), tilt = cr.range(-0.1, 0.1);
      let y = 54 + r0 * 0.5, r = r0 * cr.range(0.98, 1.1), i = 0;
      lobe(towerLobes, tx * KX, 46 + r0 * 0.3, tz, r0 * 1.25, { dark: true, bias: 0.1, grow: 0.3, flat: 0.62 });      // its flat violet foot
      while (y < top) {
        const w = (i % 2 ? 1 : -1) * r * 0.5, f = (y - 52) / Math.max(top - 52, 1);
        const b1 = tone + (w > 0 ? -0.34 : 0.0) + 0.3 * f + cr.range(-0.06, 0.06), b2 = tone + (w < 0 ? -0.3 : 0.04) + 0.25 * f, z1 = tz + cr.range(-0.3, 0.3) * r, z2 = tz - r * 0.55 + cr.range(-0.2, 0.2) * r;
        lobe(towerLobes, (tx + w + tilt * (y - 50)) * KX, y, z1, r, { bias: b1 });   // the side away from the sun is laid in the shade paints
        kids((tx + w + tilt * (y - 50)) * KX, y, z1, r, b1, 4);
        lobe(towerLobes, (tx - w * 1.5 + tilt * (y - 50)) * KX, y - r * 0.25, z2, r * 0.62, { bias: b2, grow: 0.8 });
        kids((tx - w * 1.5 + tilt * (y - 50)) * KX, y - r * 0.25, z2, r * 0.62, b2, 2);
        y += r * 0.8; r *= 0.9; i++;
      }
      const cx = tx + tilt * (top - 50);
      lobe(towerLobes, cx * KX, top + r * 0.25, tz, r * 0.95, { bias: tone + 0.14, grow: 1 });
      kids(cx * KX, top + r * 0.25, tz, r * 0.95, tone + 0.12, 3);
      lobe(towerLobes, (cx - r * 0.8) * KX, top - r * 0.3, tz - r * 0.4, r * 0.55, { bias: tone + 0.16, grow: 1 });
      lobe(towerLobes, (cx + r * 0.75) * KX, top - r * 0.4, tz - r * 0.3, r * 0.5, { bias: tone - 0.05, grow: 1 });
      if (shelf) {                                                               // a shelf: a flat plate standing out on the sun side, lit on top, a violet plate tucked under it
        const sx = tx - r0 * 1.05, sr = r0 * 0.95;
        lobe(towerLobes, sx * KX, shelf - sr * 0.2, tz - 6, sr * 1.04, { dark: true, bias: 0.16, flat: 0.34, grow: 0.3 });
        lobe(towerLobes, sx * KX, shelf, tz - 10, sr, { bias: tone + 0.2, flat: 0.36, grow: 0.5 });
        lobe(towerLobes, (sx - sr * 0.8) * KX, shelf + sr * 0.05, tz - 14, sr * 0.6, { bias: tone + 0.24, flat: 0.42, grow: 0.6 });
      }
    }
    {                                                                            // the anvil: the giant's top drawn out in flat plates, a dark belly beneath (it keeps to the cloud's side of the course)
      const ax = 268, az = 905, ay = 452;
      for (let i = 0; i < 6; i++) {
        const fx = ax - 12 - i * 20, fz = az - 70 + i * 56, rr = 132 - i * 9;
        lobe(towerLobes, fx * KX, ay - 30 - i * 2, fz + 10, rr * 0.96, { dark: true, bias: 0.3 - 0.03 * i, flat: 0.26, grow: 0.3 });
        lobe(towerLobes, fx * KX, ay + 6 - i * 2, fz, rr, { bias: 0.1 - 0.02 * i, flat: 0.3, grow: 0.5 });
      }
    }
    // low shelves of cloud between the turrets' feet, in the shade paints
    for (const [x, z, r] of [[214, 706, 40], [196, 846, 36], [176, 930, 34], [190, 1024, 38], [262, 1010, 44]]) {
      const b = -0.26 + cr.range(-0.05, 0.1);
      lobe(towerLobes, x * KX, 40 + r * 0.36, z, r, { bias: b, flat: 0.6, grow: 0.5 });
      kids(x * KX, 40 + r * 0.36, z, r, b - 0.06, 6);                           // rounds standing up out of each shelf (seen from the top of the climb a shelf is never one flat shape)
      await ctx.yield();
    }
    await ctx.yield();
    // the gap: a wreath of small rounds close about the opening, a second of larger ones behind it, and the hollow's walls
    const onRing = (a, R, back, out = new THREE.Vector3()) => out.copy(EXIT).addScaledVector(eR, Math.cos(a) * R).addScaledVector(eU, Math.sin(a) * R).addScaledVector(dirE, back);
    for (let i = 0; i < 11; i++) { const r = cr.range(6.2, 9.8), p = onRing(i / 11 * 6.283 + cr.range(-0.12, 0.12), RP + 1.6 + r * 1.16, 1.2 + r * 0.25); lobe(towerLobes, p.x, p.y, p.z, r, { keep: true, bias: cr.range(0, 0.16), grow: 0.9 }); }
    for (let i = 0; i < 10; i++) { const r = cr.range(9.5, 14), p = onRing(i / 10 * 6.283 + 0.3 + cr.range(-0.15, 0.15), RP + 3.2 + r * 1.1, 7 + r * 0.5); lobe(towerLobes, p.x, p.y, p.z, r, { keep: true, dark: true, bias: cr.range(0.3, 0.55), grow: 0.7 }); }   // the throat of the gap, in the shade paints
    for (let i = 0; i < 6; i++) { const r = cr.range(28, 42), p = onRing(1.0 + i / 6 * 3.3, 30 + r * 1.2, 32 + r * 0.6); lobe(towerLobes, p.x, p.y, p.z, r, { keep: true, bias: cr.range(-0.3, -0.05) }); }   // the hollow's walls stand on the cloud side and above: the sun side is left open to the sky
    for (let i = 0; i < 6; i++) { const r = cr.range(26, 40), p = onRing(1.25 + i / 6 * 3.5, r * 0.9, 85 + r); lobe(towerLobes, p.x, p.y, p.z, r, { keep: true, dark: true, bias: cr.range(0.05, 0.4) }); }   // the back of the hollow, in the dark paints
    // ONE free-standing tower (the authors' amendment of 17:50, as the live version has it): a small turret standing out in
    // the plain on the sun side of the climb, piled of the same rounds in the same four values under the world's one sun.
    // It stands 78 m to the right of the course at z 1110 (live's stands at z 990; this flight's gaze on the climb is
    // held further left and less far down than live's, so from there the tower slid out of the lower right corner by
    // u 0.79): from here it is whole in the picture from u 0.565 to u 0.83, standing over the strips, and a little
    // larger (37 m in radius, about 150 m tall) so that it is about as large in the picture as live's. It is the only cloud
    // that stands there besides the seven small cumulus of the painted layer. (Authored last, so that nothing drawn
    // before it changes.)
    {
      const tx = TOWER.x * KX, tz = TOWER.z, r0 = 37, tone = -0.04, top = 140 * cr.range(1.02, 1.1), tilt = cr.range(-0.08, 0.08);
      const towSh = [[tx * KX, 46 + r0 * 0.3, tz, r0 * 1.25]];                 // towSh: its great rounds (x, y, z, r), for its cast shadow below
      lobe(towerLobes, tx * KX, 46 + r0 * 0.3, tz, r0 * 1.25, { dark: true, bias: 0.1, grow: 0.3, flat: 0.9 });          // its violet foot
      let y = 52 + r0 * 0.5, r = r0 * cr.range(1.0, 1.1), i = 0;
      while (y < top) {
        const w = (i % 2 ? 1 : -1) * r * 0.5, f = (y - 52) / Math.max(top - 52, 1), x1 = (tx + w + tilt * (y - 50)) * KX, x2 = (tx - w * 1.5 + tilt * (y - 50)) * KX;
        const b1 = tone + (w > 0 ? -0.3 : 0.0) + 0.3 * f + cr.range(-0.06, 0.06), b2 = tone + (w < 0 ? -0.26 : 0.04) + 0.25 * f, z1 = tz + cr.range(-0.3, 0.3) * r, z2 = tz - r * 0.55 + cr.range(-0.2, 0.2) * r;
        lobe(towerLobes, x1, y, z1, r, { bias: b1 });
        kids(x1, y, z1, r, b1, 4);
        towSh.push([x1, y, z1, r], [x2, y - r * 0.25, z2, r * 0.66]);
        lobe(towerLobes, x2, y - r * 0.25, z2, r * 0.66, { bias: b2, grow: 0.8 });
        kids(x2, y - r * 0.25, z2, r * 0.66, b2, 2);
        y += r * 0.72; r *= 0.9; i++;
      }
      const cx = tx + tilt * (top - 50);
      lobe(towerLobes, cx * KX, top + r * 0.25, tz, r * 0.95, { bias: tone + 0.14, grow: 1 });
      kids(cx * KX, top + r * 0.25, tz, r * 0.95, tone + 0.12, 3);
      lobe(towerLobes, (cx - r * 0.8) * KX, top - r * 0.3, tz - r * 0.4, r * 0.55, { bias: tone + 0.16, grow: 1 });
      lobe(towerLobes, (cx + r * 0.75) * KX, top - r * 0.4, tz - r * 0.3, r * 0.5, { bias: tone - 0.05, grow: 1 });
      towSh.push([cx * KX, top + r * 0.25, tz, r * 0.95], [(cx - r * 0.8) * KX, top - r * 0.3, tz - r * 0.4, r * 0.55], [(cx + r * 0.75) * KX, top - r * 0.4, tz - r * 0.3, r * 0.5]);
      TOWER.top = top + r * 1.2;                                               // the top of its cap (the hat's rule on the climb reads it)
      // It stands in the sun, so it casts: one flat violet shape with a cut edge on the crop beside it ("a cast shadow is
      // one flat violet shape with a cut edge"), and the shape is the tower's own outline as the sun sees it: a disc for
      // each of its great rounds (its foot, the rounds of its stem, its cap and the two turrets on the cap), set out
      // across the sun line as the round stands off the tower's axis and down the sun line by the round's height over
      // the foot (metres of height over the sun's slope), so the stem tapers and the turrets stand clear at its end.
      // A painter's cheat on the sun's height, as the hat's shadow is: the true shadow of a cloud whose foot rides 50 m
      // up would lie across the railway and the flight's own course. So its foot is laid under the tower's sunward
      // edge (one foot radius up the sun line from the tower's axis), and the whole outline is drawn at the largest
      // scale at which its furthest reach still ends 2 m short of the railway's bank (never larger than true): the
      // railcar, which changed paint once each way under the tall cloud, runs past it in its sun paints.
      {
        const sun = style.sun, hs = Math.hypot(sun.x, sun.z), alx = -sun.x / hs, alz = -sun.z / hs, slope = sun.y / hs;   // al: down the sun line on the land; across: (alz, -alx)
        const cxT = tx * KX, y0 = towSh[0][1], rootX = cxT - alx * r0, rootZ = tz - alz * r0, lim = Math.abs(RX - 3.6 * side - 2 * side - rootX);   // room in x from its foot to 2 m short of the bank's foot
        let k = 1; for (const [x, y, z, r] of towSh) { const ac = (x - cxT) * alz - (z - tz) * alx, reach = Math.abs(alx) * (y - y0) / slope + Math.abs(ac * alz) + r; k = Math.min(k, lim / reach); }
        const L = style.uniforms.uTowL.value; let bx = 0, bz = 0, n = 0;
        towSh.slice(0, L.length).forEach(([x, y, z, r], i) => { const ac = (x - cxT) * alz - (z - tz) * alx, al = (y - y0) / slope; L[i].set(rootX + k * (ac * alz + al * alx), rootZ + k * (-ac * alx + al * alz), k * r); bx += L[i].x; bz += L[i].y; n++; });
        bx /= n; bz /= n; let br = 0; for (let i = 0; i < n; i++) br = Math.max(br, Math.hypot(L[i].x - bx, L[i].y - bz) + L[i].z);
        style.uniforms.uTow.value.set(bx, bz, br + 1, 0);
      }
    }
    await ctx.yield();
    // nothing stands in the flight's way: a lobe that reaches into the corridor is drawn smaller or left out
    const clearOf = (list) => list.filter((l) => { if (l.keep) return true; const d = path.distanceTo(l.x, l.y, l.z); if (d < 1.2 * l.r + 9) l.r = (d - 9) / 1.2; return l.r > 7; });
    const stormCloud = style.makeNearCloud(clearOf(stormLobes)), towerCloud = style.makeNearCloud(clearOf(towerLobes));
    stormCloud.material.uniforms.uLid.value = 1; stormCloud.renderOrder = -0.7; hero.parts.roof.renderOrder = -0.75;       // far to near: the turrets, the painted lid, the hanging pouches
    towerCloud.material.uniforms.uRimK.value = 1;                               // the world's one sun: each lit lobe's sunward edge is a crescent of the cloud's own cream
    scene.add(stormCloud, towerCloud);
    await ctx.yield();
    // ---- to the right of the line: hedges in the two greens. One along each edge of the three strips of other crop, and
    // hedgerows across the grass beyond them (no other crop, no lane, no second farm: the white farm and the nine poplars
    // above are the only ones). From the height of the climb they rule the plain below us.
    {
      const fq = rng.fork('hedges'), hedge = [], X = (a) => RX - a * side;                           // a = metres to the right of the line
      const clearOfBuilt = (x, z) => !(Math.abs(z - 600) < 34 && Math.abs((RX - x) * side - 84) < 34) && !(z > 388 && z < 446 && (RX - x) * side < 132);   // the farm's yard; the poplar row
      const hedgeLine = (x0, z0, x1, z1, step = 9, big = 1.15) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let i = 0; i <= n; i++) { const f = i / n, x = lerp(x0, x1, f) + fq.range(-0.7, 0.7), z = lerp(z0, z1, f) + fq.range(-0.7, 0.7); if (fq() > 0.07 && clearOfBuilt(x, z)) hedge.push([x, z, big * fq.range(0.8, 1.25)]); } };
      for (const a of [44, 92, 150]) hedgeLine(X(a), 156, X(a), 1560);
      await ctx.yield();
      const colA = [150, 268, 400];
      for (let c = 1; c < colA.length; c++) hedgeLine(X(colA[c]), 200 + c * 37, X(colA[c]), 1500, 12, 1.5);
      for (let c = 0; c < colA.length - 1; c++) { let z = 236 + c * 61; while (z < 1480) { hedgeLine(X(colA[c]), z, X(colA[c + 1]), z, 12, 1.5); z += fq.range(190, 270); } }
      await ctx.yield();
      // round bushes in the two greens, one instanced cel
      const dome = (det) => {                                                       // a bush stands on the ground: its underside is left out
        const src = new THREE.IcosahedronGeometry(1, det).toNonIndexed(), q = src.attributes.position, v = [], cut = det ? -0.75 : -1.3;
        for (let i = 0; i < q.count; i += 3) if (q.getY(i) + q.getY(i + 1) + q.getY(i + 2) > cut) for (let k = i; k < i + 3; k++) v.push(q.getX(k), q.getY(k), q.getZ(k));
        src.dispose(); const g = tris(v), n = g.attributes.normal, p = g.attributes.position;
        for (let i = 0; i < n.count; i++) n.setXYZ(i, p.getX(i), p.getY(i), p.getZ(i));     // (a unit sphere's normal is its own position)
        g.scale(3.7, 2.5, 3.7); g.translate(0, 1.8, 0); return g;
      };
      const bg = dome(0);
      const keepN = hedge.filter((h, i) => ((i * 0.618034) % 1) < Math.min(1, detail + 0.15));
      const bushM = style.cel({ inkCap: 0.3, hiPaint: pal.greenHi }), m4 = new THREE.Object3D();
      const plant = async (geo, list) => {
        const mesh = new THREE.InstancedMesh(merge(celPart(geo, pal.green, pal.greenShade)), bushM, list.length); mesh.frustumCulled = false;
        for (let i = 0; i < list.length; i++) { const h = list[i]; m4.position.set(h[0], 0, h[1]); m4.rotation.set(0, i * 2.4, 0); m4.scale.set(h[2], h[2], h[2]); m4.updateMatrix(); mesh.setMatrixAt(i, m4.matrix); if (i % 500 === 499) await ctx.yield(); }
        scene.add(mesh);
      };
      const close = (h) => h[1] < 700 && (RX - h[0]) * side < 100;                // the hedges we pass close by are drawn rounder
      await plant(bg, keepN.filter((h) => !close(h)));
      await ctx.yield();
      await plant(dome(1), keepN.filter(close));
    }
    await ctx.yield();
    // the gap's own frame: a clean painted hoop round the opening, set in the cloud
    {
      const g = merge([[RP, RP + 0.45, pal.ink], [RP + 0.45, RP + 1.4, pal.petal], [RP + 1.4, RP + 1.74, pal.ink]].map(([a, b, c]) => style.paint(new THREE.RingGeometry(a, b, 96, 1).toNonIndexed(), c, c)));   // a painted hoop: ink, the petal yellow, ink
      const m = new THREE.Mesh(g, celM); m.frustumCulled = false; m.position.copy(EXIT).addScaledVector(dirE, -0.06);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirE.clone().negate()); scene.add(m);
      // (nothing more: no rays, no fill. The opening is clear and shows what lies beyond.)
    }
    // far rain under the base (the amendment: pale, as the live version has it): soft pale shafts hanging from the cloud's
    // base out in the field, two or three in the picture at a time from the moment the base is over them (u 0.295) until
    // it lifts away; each is seen whole and in the middle distance. The near rain is the pale strokes.
    // They are painted after the turrets and before the base's lid and pouches, so the base lies over the head of every
    // shaft: a shaft is only ever seen below the base's own scalloped rim, hanging out of it (it has no top edge).
    const curtainM = style.curtainMat(), curtainG = new THREE.PlaneGeometry(2, 1, 1, 1).translate(0, 0.5, 0), curtains = [], curT = new THREE.Vector3();
    // (the last six stand further out to either side: as the base closes over the field there are shafts hanging from
    // it on the cloud's side and on the railway's, near and far)
    for (const [x, z, hw, h] of [[74, 500, 36, 86], [-88, 486, 34, 86], [110, 590, 34, 88], [-52, 604, 26, 86], [90, 644, 28, 88], [-64, 668, 26, 88],
      [136, 528, 26, 86], [-132, 548, 26, 86], [172, 610, 30, 88], [-158, 632, 28, 88], [146, 652, 26, 88], [-124, 668, 26, 88]]) {
      const m = new THREE.Mesh(curtainG, curtainM); m.position.set(x * KX, 0, z); m.scale.set(hw, h, 1); m.frustumCulled = false; m.visible = false; m.renderOrder = -0.77; scene.add(m); curtains.push(m);
    }
    // and nearer the lens than the box of strokes round the camera reaches: a second, smaller box of shorter strokes of
    // the same pale paint, in the same three drawings, slanting with the same gust, from its own stream; they fall
    // between us and the brim ahead from the first drops on (their number goes with the rain's, like the others')
    scene.add(style.makeRain(Math.round(90 * detail), ctx.core.makeRng(ctx.core.hashSeed('nearRain:' + ctx.seed)), { box: [14, 10, 16], fall: [2.4, 2.6], len: [0.35, 0.3], near: 2.4 }));
    style.uniforms.uGap0.value.set(58 * KX, 508, 28, 20); style.uniforms.uGap1.value.set(-66 * KX, 578, 22, 40); style.uniforms.uGap2.value.set(62 * KX, 612, 40, 20);
    // LIGHTNING (not in the brief: an amendment its designer lets stand within five limits, 7 Oct 04:12, kept word for word in the notes).
    // 1. A bolt is ONE flat white cel shape with a cut edge (no line, no glow), held on twos for about a second: thin for a drawing, full,
    //    thin again, gone. 2. It lights nothing: no paint, sky, ground or cloud changes while it stands (the base's pouches keep their
    //    paints). 3. Only in the rain passage inside the cloud's shadow, from the first drops (the journey's 18 s) to the far edge (25.5 s),
    //    its head in the base, standing out in the field BEYOND the railway's line (22 to 56 m to the far side of the rails, 95 to 125 m
    //    ahead of where the flight is when it strikes: further off than the railcar, which runs 40 to 50 m ahead on the line itself, and
    //    on the other side of the picture from the hat, which keeps to the cloud's side of the course through the storm). 4. At most five
    //    in a flight, never two at once, 1.5 s of plain rain or more between two: as many as the passage holds at eleven drawings each
    //    (0.92 s) with 1.5 s between (three, at this flight's pace). 5. Their moments and places come from a stream of their
    //    own and are met by METRES FLOWN: the passage is a stretch of the route (D2S read backward), the flight's own seconds along it
    //    come from the pace table (flightSec: seconds flown at so many metres), and the spare time is dealt out by the stream before,
    //    between and after the bolts. Whatever the world's clock reads when a viewer enters, the bolts stand at the same places of the flight.
    const flightSec = (() => {                                                   // seconds of flight at d metres flown: the pace table integrated over the route (duration 44 s)
      const acc = [0]; for (let d = 0; d < LEN; d += 2) acc.push(acc[acc.length - 1] + (Math.min(LEN, d + 2) - d) * 0.5 * (1 / pace(d / LEN) + 1 / pace(Math.min(LEN, d + 2) / LEN)));
      const k = 44 / acc[acc.length - 1]; return (d) => { const f = Math.min(Math.max(d, 0), LEN - 1e-6) / 2, i = Math.floor(f); return k * lerp(acc[i], acc[Math.min(i + 1, acc.length - 1)], f - i); };
    })();
    const dAtSec = (t) => { let lo = 0, hi = LEN; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (flightSec(m) < t) lo = m; else hi = m; } return (lo + hi) / 2; };
    const BOLT_N = 11, BOLT_HOLD = BOLT_N / 12, BOLT_GAP = 1.5, BOLT_TOP = 84, BOLT_NEAR = 95, BOLT_FAR = 125, BOLT_RIM = 12, bolts = [], boltAt = [], bo = ctx.core.makeRng(ctx.core.hashSeed('bolts:' + ctx.seed));
    const rimAt = (sec) => zAt(uOfS(sec)) + Math.min(table(ROOF_RIM, sec), table(EDGE_B, sec) - 6 + 22 * sstep(21.5, 24.5, sec));   // the base's far rim in the world (as update() lays it)
    // The passage a bolt may stand in: from the first drops to the last place where a bolt going out still stands under the
    // base, that is where the base's far rim (which is coming toward us by then) still lies a scallop's depth (BOLT_RIM)
    // beyond a bolt that struck BOLT_NEAR metres ahead of the flight. Walked back along the route in steps of 2 m.
    const stormT0 = flightSec(dOfS(18)), stormT1 = (() => {
      const q = new THREE.Vector3();
      for (let dE = dOfS(25.5); dE > dOfS(18); dE -= 2) { const tE = flightSec(dE); if (rimAt(sOfU(dE / LEN)) - BOLT_RIM >= path.posAtDist(dAtSec(tE - BOLT_HOLD), q).z + BOLT_NEAR) return tE; }
      return stormT0;
    })();
    const NB = Math.max(0, Math.min(5, Math.floor((stormT1 - stormT0 + BOLT_GAP) / (BOLT_HOLD + BOLT_GAP))));
    {
      const spare = stormT1 - stormT0 - NB * BOLT_HOLD - (NB - 1) * BOLT_GAP, w = []; let sum = 0, at = stormT0;
      for (let i = 0; i <= NB; i++) { w.push(bo.range(0.2, 1)); sum += w[i]; }
      for (let i = 0; i < NB; i++) { at += spare * w[i] / sum; boltAt.push(at); at += BOLT_HOLD + BOLT_GAP; }   // each strike in the flight's own seconds
    }
    for (let bi = 0; bi < NB; bi++) {
      const dS = dAtSec(boltAt[bi]), dE = dAtSec(boltAt[bi] + BOLT_HOLD), pb = path.posAtDist(dS, new THREE.Vector3()), pe = path.posAtDist(dE, new THREE.Vector3()), sE = sOfU(dE / LEN);
      // its place in the world; under the base to its last drawing (a scallop's depth inside the base's far rim as that lies when the bolt goes out)
      const bx = RX - side * bo.range(22, 56), bz = Math.min(pb.z + bo.range(BOLT_NEAR, BOLT_FAR), rimAt(sE) - BOLT_RIM);
      const v = [], top = BOLT_TOP, n = 9; let px = 0, branch = null;
      const seg = (x0, y0, x1, y1, w0, w1) => v.push(x0 - w0, y0, 0, x0 + w0, y0, 0, x1 + w1, y1, 0, x0 - w0, y0, 0, x1 + w1, y1, 0, x1 - w1, y1, 0);
      for (let i = 0; i < n; i++) {
        const y0 = top * (1 - i / n), y1 = top * (1 - (i + 1) / n), nx = px + (i % 2 ? 1 : -1) * bo.range(3, 8) + bo.range(-2, 2), w0 = 2.4 - 0.16 * i, w1 = 2.4 - 0.16 * (i + 1);
        seg(px, y0, nx, y1, w0, w1); if (i === 3) branch = [nx, y1]; px = nx;
      }
      let [qx, qy] = branch; for (let i = 0; i < 3; i++) { const nx = qx + bo.range(5, 9), ny = qy - bo.range(7, 11); seg(qx, qy, nx, ny, 1.2 - 0.3 * i, 0.9 - 0.3 * i); qx = nx; qy = ny; }
      const g = tris(v), nn = g.attributes.normal; for (let i = 0; i < nn.count; i++) nn.setXYZ(i, 0, 1, 0);
      const m = new THREE.Mesh(style.paint(g, pal.white, pal.white), celM); m.position.set(bx, 0, bz); m.frustumCulled = false; m.visible = false; scene.add(m); bolts.push(m);
    }
    ticks.push((dt, time, camera, u, s) => {
      // the base arrives as one mass: the pouches are full size from the first and ride inside the painted lid (uLid), coming
      // down with its rim as it closes over us and lifting away with it; none is ever scaled up from nothing
      // (it is drawn while its rim is ahead of us: a rule in space, the rim's own place)
      const rimD = style.uniforms.uRoof.value.y - camP.z;
      stormCloud.visible = rimD > 1; if (stormCloud.visible) stormCloud.userData.sort(camP);
      // the turrets of the lit face, the gap's wreath and the free-standing tower are fixed lobes in the world: they stand
      // where they stand from the first frame of the flight to the last (nothing is hidden, grown or switched on at a
      // time), far off over the plain from the hilltop and nearer as we fly; each lobe goes on swelling and rolling over
      // in smooth time, as the far cloud's do
      towerCloud.userData.sort(camP);
      // a rain shaft hangs from the base: it is let down from the lid once the lid's rim has passed over its head (never a
      // pane standing alone in the sunny sky), and is drawn up again as the base lifts away
      path.tangentAtDist(clamp01(u) * LEN, curT); curT.y = 0; if (curT.lengthSq() < 1e-6) curT.set(0, 0, 1); curT.normalize();   // the course's own heading here
      for (const c of curtains) {
        const dz = c.position.z - camP.z, h = c.userData.h, g = dz <= 0 ? 1 : clamp01(((h - camP.y) - (ROOF_H / Math.max(rimD, 1) + 0.07) * dz) / 22);
        // and it is drawn up again by where the eye is, in metres, from the shaft itself: as we come within one and a half
        // of its own breadths of its foot, and gone at one breadth (a shaft stands out in the field, never a pane beside us),
        // and as we draw level with it: over the 20 m of flight in which the metres it stands ahead along the course
        // (ah) fall past the metres its outer edge stands off to the side of the course (ac + its half breadth), so a
        // shaft is let go while it is still ahead of us and off to one side, whichever way the gaze is turned. Drawn
        // up means its strokes end higher, each still at its own ragged height (scale.z carries that to the shader;
        // the card itself keeps its size)
        const dx = c.position.x - camP.x, dd = Math.hypot(dx, dz), ah = dx * curT.x + dz * curT.z, ac = Math.abs(dx * curT.z - dz * curT.x);
        const gg = clamp01(g * 1.8) * sstep(2 * c.userData.hw, 3 * c.userData.hw, dd) * sstep(-10, 10, ah - ac - c.userData.hw);
        c.visible = stormCloud.visible && weather !== 'dry' && gg > 0.02; c.scale.z = Math.max(gg, 0.001);
      }
      // each bolt, by the metres flown: eleven held drawings on twos of the flight's own seconds from its strike (a thin one, nine full,
      // a thin one: 0.92 s), then nothing. Nothing else changes while it stands.
      const tb = flightSec(clamp01(u) * LEN);
      for (let i = 0; i < NB; i++) { const k = Math.floor((tb - boltAt[i]) * 12); bolts[i].visible = k >= 0 && k < BOLT_N && weather !== 'dry'; bolts[i].scale.x = k === 0 || k === BOLT_N - 1 ? 0.6 : 1; }   // a dry shadow brings the gust only
    });
    for (const c of curtains) { c.userData.hw = c.scale.x; c.userData.h = c.scale.y; }
    await ctx.yield();

    // ==== TAIL ====
    // the gaze (one point of interest whose aim changes along the course): on the tall cloud over the hilltop and down the
    // slope; round to the railcar while we run beside its windows; down onto the field as the shadow's edge races in; level
    // under the cloud; and on the climb held down toward the line, so the plain stays in the picture below the turrets
    const cloudPoi = A.cloudPoi.clone(), poiP = new THREE.Vector3(), poiA = new THREE.Vector3(), poiT = new THREE.Vector3(), poiOut = new THREE.Vector3();
    const poiDown = new THREE.Vector3(0.05 * KX, -0.3, 1).normalize(), poiStorm = new THREE.Vector3(0.16 * KX, 0.02, 1).normalize(), poiClimb = new THREE.Vector3(-0.42 * KX, -0.62, 1).normalize();   // on the climb one held aim, down and toward the line: the plain, the railway and the car stay in the picture under the turrets
    const poiAt = (time, u) => {
      const s = sOfU(u); path.pointAt(clamp01(u), poiP); path.tangentAt(clamp01(u), poiT);
      const wc = 0.7 * sstep(0.3, 2, s) * (1 - sstep(11.6, 12.8, s)), wcar = 1.3 * sstep(12.5, 13.5, s) * (1 - sstep(15.2, 16.2, s)), wd = 0.9 * sstep(15.4, 16.4, s) * (1 - sstep(17.6, 19, s));
      const ws = 0.6 * sstep(18, 19.5, s) * (1 - sstep(25, 26.5, s)), wcl = sstep(26.5, 29.5, s) * (1 - sstep(36.8, 39.3, s));
      poiOut.copy(poiT).multiplyScalar(Math.max(0.15, 1 - wc - wcar - wd - ws - wcl));
      poiOut.addScaledVector(poiA.copy(cloudPoi).sub(poiP).normalize(), wc);
      poiOut.addScaledVector(poiA.set(RX, 3.2, carZ(s) - 2).sub(poiP).normalize(), wcar);
      poiOut.addScaledVector(poiDown, wd).addScaledVector(poiStorm, ws).addScaledVector(poiClimb, wcl).normalize();
      return poiOut.multiplyScalar(4000).add(poiP);
    };
    hero.setClock(0); style.setShadow(table(EDGE_A, 0), table(EDGE_B, 0)); style.update(0, 0, null);
    // until the first update the hat hangs where the flight will find it: 13 m along the entry axis, a little below the eye
    path.pointAt(0, camP); placeHat(0, 0, 0, 0);
    return {
      scene, path, duration: 44, pace,
      camera: { fov: 62, near: 0.3, far: 5000, lookAhead: 22, sway: 0.5, bank: 0.4 },
      pois: [{ at: poiAt, from: 0.03, to: 0.95, weight: 0.6 }],
      portal: { shape: 'circle', radius: RP, color: '#F7F3E8', style: 'ring', glow: 0, halo: false, tilt: true, revealDistance: 320, blendDistance: 25 },   // the flat paints hold until the last 25 m
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        const s = sOfU(u), tq = Math.floor(time * 12) / 12;
        hero.setClock(s);
        { const cz = zAt(u), zA = cz + table(EDGE_A, s), zB = cz + table(EDGE_B, s); style.setShadow(zA, zB); style.setRoof(-1e6, cz + Math.min(table(ROOF_RIM, s), table(EDGE_B, s) - 6 + 22 * sstep(21.5, 24.5, s)), ROOF_H); }   // the base lifts away over our heads as the far line crosses (it no longer hangs on as a band along the top of the picture)
        style.setRain(weather === 'dry' ? 0 : table(RAIN, s));
        if (weather === 'burst') style.setRain(Math.min(1, style.uniforms.uRain.value * 1.7));
        style.update(dt, time, camera); hero.update(dt, time, camera);
        for (let i = 0; i < ticks.length; i++) ticks[i](dt, time, camera, u, s, tq);
      },
      dispose() {},
    };
  },
};
