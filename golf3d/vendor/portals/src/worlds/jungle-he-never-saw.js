// THE JUNGLE HE NEVER SAW, after Henri Rousseau. A hothouse jungle of hard cut blades in forty greens, each a
// separate flat that hinges to stay square to the lens, lapped like scenery over green-black paint, under a pale
// empty sky and a flat red disc that lights nothing. We fly the lane at monkey height, push through six ranks that
// swing aside like stage flats, climb beside the tallest lotus stalk, round its bloom, drop into an orange tree full
// of ruffed monkeys and leave low over a bay through a ring wreathed in spear blades.
// Everything is drawn by the one blade material of the hero part (src/parts/jungle-he-never-saw.js): real cut
// geometry, unlit, no fog, no light, no full-screen pass. post.flat: a pigment written is the pigment shown.
// THE PICTURE AS IT STANDS (third correction, 6 Oct): what Rousseau painted himself is here, what was not his is not.
// Sky: his evening, flat lit paint in three stops (amber with a little vermilion at the leaf line, a rose blush, the pale
// pigment on top), empty of cloud and of anything in the air; one hard disc 16 degrees across cut by leaves, with no glow.
// Water: the same grade upside down (pale under the eye, the warm stops toward the far bank), the shore's dark reflection,
// and the disc standing in it in his naive way as a ladder of level vermilion bars reaching toward us. No pad, reed or
// small lotus of the bay lies on the ladder as the eye has it anywhere from u 0.70 to 0.96 (offLadder).
// The ring is the engine's gold swirled orb inside its wreath of forty hinged spear blades, all green.
// The cast: one big tawny cat, frontal and wide-eyed (round ears, pale muzzle, ruled whiskers, ring eyes, no stripe), looking
// out of the leaves on the starboard edge of the lane at u 0.08: it stands in the open among broad paddle and heart leaves
// in plain greens, the trimmed combed grass at its feet, a pair of eyes in the gap beside it, and no striped blade within
// 12 m. Ruffed monkeys (four heads over blades in the lane; a troop of three on the swinging ranks at u 0.16; one in the
// great bloom; the orange tree's; one big dark one at the top of a green-black paddle plant on the bay's reed islet, at
// the port edge of the disc at u 0.79, one great rose lotus low in the water under the disc). Rose flamingos in pure
// profile in two small groups: four in a row in the lotus pool before the far shore, as tall as small trees, and four in
// the bay (one before the islet's starboard end, three toward the far bank) with the stepping one near us on the last
// straight. Birds PERCH and none flies: eighteen white and green-black birds in pure profile, each standing on the tip of
// a lotus bud on a tall jointed stalk, on a bare twig beside it or on a torch flower that stands on the sky, in twos and
// threes, each lifting one stiff wing as a toy does, keyed to u (never to world time); none is in the air and none
// stands across the disc from any place on the path (from the lane two stand over its top rim, three to starboard of it). Round eyes in the gaps until u 0.88. The one black snake (no eye, no bright ring)
// pouring down the starboard paddle plant at the exit, cut out whole against one light paddle blade just behind it.
// Nobody is here: no figure.
// The place: shores packed rank over rank (horror vacui), reeds, arum leaves and fronds round both waters; pads 8 m across
// with ruled ripples and small lotus in flower and bud on the near water of both (those not passed close are cut lite);
// the orange tree bears oranges or pale blossom; tall blossom spikes, white and pink, over the leaves; tall trees behind
// the leaf wall (pale trunks, round crowns of whole lapped leaves with fruit, fan and feather palms, drooping stems,
// lianas), those round the pool held under the bloom heads. What stands on the sky above the wall is the brief's own:
// lotus heads and buds on tall jointed stalks, torch flowers, and near the lens single paddle blades on bare stalks
// cropped by the top edge; they stand clear of the disc as seen from the reveal and the climb. Oranges as big as houses
// and torch flowers in the lane and the shore's trees; the arc stays 25 m off the great bloom so it is whole at the
// closest pass; nothing of the orange tree crosses the lens. The gaze stays on the stand from the reveal into the climb,
// rests a little below level at the bloom, and holds the islet until we are past it. At the exit both paddle fans are
// regular and complete; the disc stands to port of the port plant, cut by blades.
// World axes: entry along +Z; port = +X, starboard = -X. Hero local (x,y,z) -> world (-x, y, 270 - z).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, jnsMonkey, jnsEyes, jnsLotus } from '../parts/jungle-he-never-saw.js';

const RAD = Math.PI / 180;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const POOL = { x: 0, z: 270, r: 75 };
const BAY = { x: -99, z: 402, rx: 38, rz: 76 };
const TREE = { x: -82, y: 20, z: 320, r: 22, trunk: [-101, 0, 314] };
const END = [-108.9, 8, 459.5], END_DIR = [-0.2215, 0, 0.9751];          // exit: 12.8 degrees to starboard of +Z
const SEAT0 = [-9, 2.2, 96];
const ZIN = 23;                                                           // z of the entry point
const LANE = [[0, -260], [0, 12], [0, 40], [1.2, 66], [-1.5, 90], [-3.5, 106], [-3.5, 152]];

function laneDist(x, z) {
  let m = 1e9;
  for (let i = 0; i + 1 < LANE.length; i++) {
    const ax = LANE[i][0], az = LANE[i][1], bx = LANE[i + 1][0] - ax, bz = LANE[i + 1][1] - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
    m = Math.min(m, Math.hypot(x - ax - bx * t, z - az - bz * t));
  }
  return m;
}
const poolDist = (x, z) => Math.hypot(x - POOL.x, z - POOL.z) - POOL.r;
const bayDist = (x, z) => (Math.hypot((x - BAY.x) / BAY.rx, (z - BAY.z) / BAY.rz) - 1) * BAY.rx;
// The painted bank: 0 on the lane floor, under water in the pool and the bay, rising to 20 m at 60 m off.
function groundBase(x, z) {
  const w = Math.min(poolDist(x, z), bayDist(x, z)), l = laneDist(x, z) - 7;
  if (w < 0) return Math.max(-1.5, w * 0.5);
  const d = Math.min(w, Math.max(0, l));
  return 20 * Math.min(1, d / 60);
}

export default {
  id: 'jungle-he-never-saw',
  name: 'The Jungle He Never Saw',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Henri Rousseau, 1844 to 1910',
  weirdness: 0.35,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = Math.max(0.6, Math.min(1, ctx.quality?.detail ?? 1)), vary = ctx.vary || {};
    const density = Math.max(0.85, Math.min(1.1, vary.density ?? 1));
    const scene = new THREE.Scene();

    // ---- the look of this visit (drawn first, from a fork, so the layout draws stay in step) ----
    const lr = rng.fork ? rng.fork('look') : rng;
    const pickHour = lr(), castRoll = lr(), monkeyRoll = lr();
    let hour = { golden: 'evening', dawn: 'morning', night: 'moon', day: 'rain' }[vary.hour];
    if (!hour) hour = { m: 'morning', e: 'evening', n: 'moon', r: 'rain' }['mmmeeeeeennneerrrree'[Math.min(19, Math.floor(pickHour * 20))]];
    const blossom = castRoll < 0.3 || (castRoll > 0.9 && castRoll < 0.93), rare = !!vary.rare;

    // ---- the path ----
    // round the great bloom (heart at world x 7, z 270): r metres from the heart at bearing deg, seen from the entry side
    const arc = (deg, y, r = 18) => [-(-7 + r * Math.sin(deg * RAD)), y, 270 - r * Math.cos(deg * RAD)];
    const path = makePath([
      [0, 9, ZIN], [0, 9, 40], [1.2, 9, 66], [-1.5, 9.1, 90], [-3.5, 9.8, 106], [-3.5, 13.5, 118], [-3.5, 33, 162], [-3.5, 53, 207], [-3.5, 65.5, 236],
      arc(24.8, 68, 25), arc(42, 68.5, 25), arc(58, 68.5, 25), arc(74, 68, 25), arc(92, 68, 25), arc(112, 66.5, 25),   // 25 m off the heart all the way round: the bloom is whole in the frame
      [-24, 57, 287], [-40, 41, 297], [-62, 23, 306], [-75, 13, 311], [-80.5, 9.6, 333], [-85.6, 8.2, 355.5], [-95.6, 8, 400], END,
    ]);
    const NS = 640, sp = new Float32Array((NS + 1) * 3), tv = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, tv); sp[i * 3] = tv.x; sp[i * 3 + 1] = tv.y; sp[i * 3 + 2] = tv.z; }
    // nearest path sample in 3D: { u, d }
    const near3 = (x, y, z) => {
      let best = 1e18, bi = 0;
      for (let i = 0; i <= NS; i++) { const dx = sp[i * 3] - x, dy = sp[i * 3 + 1] - y, dz = sp[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
      return { u: bi / NS, d: Math.sqrt(best) };
    };
    const at = (u) => { const i = Math.max(0, Math.min(NS, Math.round(u * NS))); return [sp[i * 3], sp[i * 3 + 1], sp[i * 3 + 2]]; };
    const dirAt = (u) => { const t = path.tangentAt(Math.max(0, Math.min(1, u)), new THREE.Vector3()); return [t.x, t.y, t.z]; };
    // side vector to port (+X at the entry) at u, level
    const portAt = (u) => { const t = dirAt(u), l = Math.hypot(t[0], t[2]) || 1; return [t[2] / l, 0, -t[0] / l]; };
    const uPool = near3(-3.5, 22, 150).u, uGreat = near3(-10, 68, 268).u, uTree = near3(-75, 13, 311).u;
    await ctx.yield();

    // ---- the hero: the lotus stand, front toward the entry ----
    const hero = await buildHero(ctx, { uSpan: [uPool, uPool + (uGreat - uPool) / 0.63], shut: rare, detail, backdrop: false, darkMonkey: monkeyRoll < 0.2,
      waterSky: { top: '#ffffff', mid: '#ffffff', low: '#ffffff', disc: '#ffffff', sun: new THREE.Vector3(0, 1, 0) } });   // filled in below, when the disc has its place
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, 270);
    scene.add(hero.object);
    const style = hero.style, G = style.greens, pig = style.pig, white = style.white, A = hero.anchors;
    const W = (l) => [-l[0], l[1], 270 - l[2]];
    await ctx.yield();

    // ---- sky: an empty band of flat paint and one disc ----
    // the disc stands in the widest gap between bloom heads as seen from the entry, 10.5 to 13.5 degrees to port
    // (no further: at the exit it must stand clear of the port paddle plant, 24 degrees off the ring's axis)
    let sunBest = 12, sunGap = -1;
    for (let b = 12.5; b <= 14.75; b += 0.25) {
      let m = 99;
      for (const bl of A.blooms) { const w = W(bl.heart), D = Math.hypot(w[0], w[2] - ZIN); m = Math.min(m, Math.abs(Math.atan2(w[0], w[2] - ZIN) / RAD - b) - (bl.radius / D) / RAD + Math.abs(Math.atan2(w[1] - 9, D) / RAD - 11) * 0.5); }
      m -= Math.abs(b - 13.5) * 0.15;
      if (m > sunGap) { sunGap = m; sunBest = b; }
    }
    const sunB = sunBest * RAD, sunE = (hour === 'morning' ? 10.5 : hour === 'moon' ? 14 : 12.5) * RAD;
    const sunDir = new THREE.Vector3(Math.sin(sunB) * Math.cos(sunE), Math.sin(sunE), Math.cos(sunB) * Math.cos(sunE));
    const pale = pig[4], rose = pig[6], ta = { r: 0, g: 0, b: 0 }, tb = { r: 0, g: 0, b: 0 };
    // a mix as paint on a palette (in display space, so viridian let down with white stays green and never greys)
    const mixS = (a, b, t) => { a.getRGB(ta, THREE.SRGBColorSpace); b.getRGB(tb, THREE.SRGBColorSpace); return new THREE.Color().setRGB(ta.r + (tb.r - ta.r) * t, ta.g + (tb.g - ta.g) * t, ta.b + (tb.b - ta.b) * t, THREE.SRGBColorSpace); };
    // The sky is still empty flat paint, but it is LIT paint: three stops, the lightest at the leaf line, so every
    // crown stands dark on a band of light and the water (which is painted with the same grade upside down) carries
    // it to our feet. The disc is his full disc, hard edged, 16 degrees across.
    const cream = mixS(white, pig[3], 0.22), gold = mixS(mixS(white, pig[3], 0.45), pig[5], 0.16);
    // the evening is his sunset: lead white warmed with chrome yellow and a little vermilion at the leaf line (amber),
    // rose above it, the pale sky pigment on top. Still flat paint, no glow and no ray: the warmth is in the stops.
    const amber = mixS(mixS(white, pig[3], 0.44), pig[5], 0.3), blush = mixS(cream, rose, 0.66);
    const skyCols = {
      evening: { top: mixS(mixS(pale, white, 0.22), rose, 0.1), mid: blush, low: amber, disc: pig[5], size: 16 },
      morning: { top: mixS(mixS(pale, white, 0.45), rose, 0.4), mid: mixS(mixS(pale, white, 0.5), rose, 0.75), low: mixS(rose, gold, 0.55), disc: mixS(pig[5], pig[3], 0.3), size: 15 },
      moon: { top: mixS(pig[1], pale, 0.5), mid: mixS(pale, white, 0.25), low: mixS(mixS(white, pig[3], 0.34), amber, 0.3), disc: mixS(white, pig[3], 0.1), size: 16 },
      rain: { top: mixS(pale, pig[1], 0.06), mid: mixS(pale, white, 0.3), low: mixS(mixS(white, gold, 0.4), amber, 0.35), disc: pig[5], size: 15 },
    }[hour];
    const skyShape = { band: 0.15, span: 0.62 };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), style.sky({ sun: sunDir, ground: pig[0], ...skyShape, ...skyCols }));
    // the water keeps the pale sky pigment under us (the pink bird and the rose lotus must stand on it) and carries the warm stops only toward the far shore
    const waterCols = { ...skyCols, top: mixS(skyCols.top, pale, 0.5), mid: mixS(mixS(skyCols.mid, skyCols.low, 0.35), skyCols.top, 0.3) };
    const waterShape = { band: 0.09, span: 0.36 }, waterSky = { ...waterCols, ...waterShape, sun: sunDir, amount: 0.92 };   // the water spreads the light band wider than the sky does
    {
      const pm = hero.object.getObjectByName('pool');
      if (pm) { const pu = pm.material.uniforms, sh = Math.hypot(sunDir.x, sunDir.z) || 1; pu.uSkyTop.value.copy(waterCols.top); pu.uSkyMid.value.copy(waterCols.mid); pu.uSkyLow.value.copy(waterCols.low); pu.uSkyDisc.value.copy(skyCols.disc);
        pu.uSunH.value.set(sunDir.x / sh, sunDir.z / sh, sunDir.y, sh); pu.uSkyP.value.set(waterShape.band, waterShape.span, Math.sin(skyCols.size * 0.5 * RAD), 0.92);
        pu.uShore.value.set(POOL.x, POOL.z, POOL.r, POOL.r); pu.uRefl.value.set(30, 46, 11, 0.92); }
    }
    sky.renderOrder = -1; sky.frustumCulled = false; sky.name = 'sky';
    scene.add(sky);

    // ---- everything else is blades: one set, one instanced mesh per cut shape ----
    const set = style.set();
    const FAR_N = { spear: 7, paddle: 5, heart: 6, fan: 9, sword: 7 };
    const KINDS = ['spear', 'paddle', 'spear', 'heart', 'fern', 'paddle', 'fan', 'sword', 'spear', 'paddle'];
    const HALF = { spear: 0.3, paddle: 0.28, heart: 0.24, fern: 0.5, fan: 0.3, sword: 0.42, torch: 0.1 };   // lateral reach / h when hinged 50 degrees
    // The leaf line dead ahead of the entry is held low so the disc and the bloom heads stand on it.
    const sunDeg = sunE / RAD, sunBd = sunB / RAD, V2 = at(0.9), exitB = Math.atan2(END_DIR[0], END_DIR[2]) / RAD;
    const capTop = (x, z) => {
      const D = Math.hypot(x, z - ZIN);
      if (D < 9 || z < ZIN + 2) return 1e9;
      const b = Math.atan2(x, z - ZIN) / RAD, off = Math.abs(b);
      let ang = 7.5;
      const ds = Math.abs(b - sunBd);
      if (ds < 7) ang = Math.min(ang, sunDeg - 3.2 + sstep(4, 7, ds) * 4);
      // the lane's own plants (nearer than 60 m) are held down only under the disc: a notch of sky on its bearing, and
      // it is held from every place the eye passes in the first seconds, not from the entry point alone
      const near = z < 70 || D < 60;
      ang += near ? sstep(7.5, 15, ds) * 45 : sstep(22, 36, off) * 30;
      let cap = 9 + D * Math.tan(Math.min(60, ang) * RAD);
      if (near) for (let k = 1; k < 5; k++) {
        const ez = ZIN + k * 9, Dk = Math.hypot(x, z - ez);
        if (z < ez + 3 || Dk < 7) continue;
        const dk = Math.abs(Math.atan2(x, z - ez) / RAD - sunBd);
        cap = Math.min(cap, 9 + Dk * Math.tan(Math.min(60, Math.min(7.5, sunDeg - 3.2 + sstep(4, 7, dk) * 4) + sstep(7.5, 15, dk) * 45) * RAD));
      }
      // and again from the last straight: a valley of sky over the ring, with the disc 24 degrees to port of it
      const ex = x - V2[0], ez = z - V2[2], D2 = Math.hypot(ex, ez);
      if (D2 > 30 && ex * END_DIR[0] + ez * END_DIR[2] > 0) {
        const b2 = Math.atan2(ex, ez) / RAD, rel = Math.abs(b2 - exitB), ds2 = Math.abs(b2 - sunBd);
        let a2 = 9 + sstep(13, 40, rel) * 26;
        if (ds2 < 9) a2 = Math.min(a2, sunDeg - 2.4 + sstep(5, 9, ds2) * 24);
        cap = Math.min(cap, 5 + D2 * Math.tan(Math.min(60, a2) * RAD));
      }
      return cap;
    };
    // THE AMPHITHEATRE. Seen from bloom height a level forest is a carpet of tips, so beyond the far shore the dark bank
    // itself climbs (to 55 m more by 340 m from the great bloom) and a few ranks of giant flats stand on it one above
    // the other, each whole against green-black paint. It stays under the entry's leaf line and clear of the route.
    const BL = [-6, 270], rBloom = (x, z) => Math.hypot(x - BL[0], z - BL[1]);
    const ground = (x, z) => {
      const base = groundBase(x, z), rb = rBloom(x, z);
      if (rb < 105 || base < 19.9) return base;
      const e = 55 * sstep(105, 340, rb) * sstep(45, 120, path.nearestXZ(x, z).dist) * sstep(10, 80, bayDist(x, z));
      return base + Math.max(0, Math.min(e, capTop(x, z) - 52 - base));
    };
    // ---- the bank: one sheet of green-black paint ----
    {
      const N = 72, pos = new Float32Array((N + 1) * (N + 1) * 3), idx = [];
      const warp = (s) => s * (240 + 760 * s * s * s * s);
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i <= N; i++) {
          const x = -40 + warp((i / N) * 2 - 1), z = 290 + warp((j / N) * 2 - 1), k = (j * (N + 1) + i) * 3;
          pos[k] = x; pos[k + 1] = ground(x, z); pos[k + 2] = z;
        }
        if (j % 6 === 5) await ctx.yield();
      }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      const bank = new THREE.Mesh(g, style.flat(pig[0], { side: THREE.DoubleSide }));
      bank.name = 'bank'; bank.frustumCulled = false; scene.add(bank);
    }
    await ctx.yield();

    const E79 = at(0.79), BAY_E = Array.from({ length: 9 }, (_, i) => at(0.75 + i * 0.01));   // the bay's low valley toward the disc, held from u 0.75 to 0.83
    // THE DISC'S LADDER OF BARS ON THE BAY, as the eye has it all the way from u 0.70 to 0.96 (the
    // mirrored disc, drawn out toward us by the water's shader): a pad that would lie on it is moved to starboard of it
    // (null: no room, it is left out), so the bars reach toward us unbroken
    const LAD_E = Array.from({ length: 27 }, (_, i) => at(0.7 + i * 0.01)), LAD_R = Math.sin(8.4 * RAD);   // every hundredth of the flight from u 0.70 to 0.96: the ladder is clear all the way over the bay
    const offLadder = (x0, z0, r) => {
      let x = x0, z = z0;
      const sx = Math.sin(sunB), sz = Math.cos(sunB), sy = Math.sin(sunE), sh = Math.cos(sunE);
      for (let q = 0; q < 8; q++) {
        let push = 0;
        for (const e of LAD_E) {
          const dx = x - e[0], dz = z - e[2], al = dx * sx + dz * sz, lat = -dx * sz + dz * sx;
          if (al < 4) continue;
          const de = (e[1] / Math.hypot(al, e[1]) - sy) * 0.36;
          if (Math.abs(de) >= LAD_R) continue;
          const half = (Math.sqrt(LAD_R * LAD_R - de * de) / sh) * al + r + 0.6;
          if (Math.abs(lat) < half) push = Math.max(push, half - lat + 0.3);
        }
        if (!push) return [x, z];
        x -= sz * push; z += sx * push;
      }
      return null;
    };
    const lanePts = [[SEAT0[0], SEAT0[1] + 4, SEAT0[2]]], keepOutHas = (x, y, z, r) => lanePts.some((k) => Math.hypot(k[0] - x, k[1] - y, k[2] - z) < r + 5);
    const yawTo = (x, z, u) => { const t = at(Math.max(0, u - 0.07)); return Math.atan2(t[0] - x, t[2] - z); };
    const inTree = (x, z) => Math.hypot(x - TREE.x, z - TREE.z) < TREE.r - 1;
    const nearEnd = (x, z) => Math.hypot(x - END[0], z - END[2]) < 15;
    let nPlants = 0, nTorch = 0;
    const SEAT = SEAT0, CAT = SEAT0;                              // the seat of the lane's one incident: the wide-eyed cat among broad leaves
    // THE REVEAL'S VALLEY: as the last rank swings aside (the eye at y 27 over z 148) the near shore ahead is kept
    // under the line from that eye to the water's edge, so the stand is seen over a strip of lit water, not over a wall.
    const sightCap = (x, z) => {
      if (z < 152 || z > 215) return 1e9;
      const off = Math.abs(x + 3.5), w = sstep(20, 46, off);
      return Math.max(0, 27.5 * (203 - z) / 55) + 3 + w * 70 + (w > 0.999 ? 1e9 : 0);
    };
    // one plant, cut down to clear the path; returns its height or 0 if it was not placed
    const putPlant = (x, z, kind, h, o = {}) => {
      const y = Math.max(0, ground(x, z)), n = path.nearestXZ(x, z);
      const half = HALF[kind] || 0.3, room = (n.dist - 4) / half;
      if (h > room && y + h > n.y - 5) h = Math.max(room, n.y - 5 - y);
      h = Math.min(h, capTop(x, z) - y, sightCap(x, z) - y);
      if (n.u > 0.63 && n.u < 0.8 && n.dist < 26) h = Math.min(h, 3.5 + n.dist * 0.4);       // inside the orange tree only the tree stands near the lens
      if (h < (o.minH ?? 6)) return 0;
      // THE ISLET'S SKY: all the way from u 0.75 to 0.83 the bank under the disc is kept low, so the paddle plant on the islet and
      // its monkey stand dark against the red round (a plant cut out here still takes its three draws: the layout stays in step)
      for (const EB of BAY_E) { const dx = x - EB[0], dz = z - EB[2], D = Math.hypot(dx, dz), ds = Math.abs(Math.atan2(dx, dz) / RAD - sunBd);
        if (D > 5 && dz > 0 && ds < 22) h = Math.min(h, EB[1] + D * Math.tan((5.2 + sstep(13, 22, ds) * 34) * RAD) - y); }
      if (h < (o.minH ?? 6)) { const r = o.rng || rng; r(); r(); r(); return 0; }
      if (!o.rng && x > SEAT[0] - 6.5 && x < SEAT[0] + 6 && z > SEAT[2] - 20 && z < SEAT[2] + 3) { rng(); rng(); rng(); return 0; }
      // o.sink: the plant stands that fraction of itself below the ground, top unmoved: far crowns sit down on the rank
      // in front and no sky shows between their bare stalks
      const hs = o.sink ? h / (1 - o.sink) : h, ys = y - (hs - h);
      const kindP = kind === 'sword' && Math.hypot(x - SEAT[0], z - SEAT[2]) < 14 ? 'heart' : kind;   // no striped blade within 12 m of the cat (same three draws)
      set.plant(o.rng || rng, { x, y: ys, z, yaw: o.yaw ?? yawTo(x, z, n.u), h: hs, kind: kindP, gi: o.gi, waveS: (o.waveS ?? n.u) + Math.min(0.04, n.dist / 4000), swing: o.swing, count: o.count ?? (kind === 'fern' ? 5 : undefined), nod: o.nod, dark: o.dark });
      nPlants++; if (kind === 'torch') nTorch++;
      return h;
    };

    // the six ranks that stand right across the lane and swing aside like scenery
    const rankSeats = [];
    for (let r = 0; r < 6; r++) {
      const z = 106 + r * 9, pp = path.nearestXZ(-3.5, z), px = -3.5;
      for (let k = 0; k < 4; k++) for (const side of [1, -1]) {
        const x = px + side * (3.4 + k * 8.2 + ((r + k) % 2) * 1.6 + rng() * 1.2), zz = z + (rng() - 0.5) * 2;
        const kind = k === 0 ? (r % 2 ? 'spear' : 'paddle') : rng.pick(['paddle', 'spear', 'heart', 'fan']);
        const h = Math.min(capTop(x, zz), pp.y + 8 + rng() * 3 + k * 1.5);
        const sw = k < 2 ? side * Math.max(0.02, pp.u - 0.012 - k * 0.002) : 0;
        const y = Math.max(0, ground(x, zz));
        const ryaw = Math.PI + (rng() - 0.5) * 0.2;
        set.plant(rng, { x, y, z: zz, yaw: ryaw, h: h - y, kind, gi: 6 + ((r * 5 + k * 7) % 20), waveS: pp.u, swing: sw });
        if (k === 0) rankSeats.push({ r, side, x, y, z: zz, yaw: ryaw, h: h - y, swing: sw, waveS: pp.u });
        nPlants++;
      }
    }
    await ctx.yield();

    // the lapped leaf wall beside the route: ranks 9 m apart near the path, wider and LARGER with distance. The near
    // ranks carry the darker greens, and behind each fan stands a second fan of green-black blades: the paint between the flats.
    const farShore = (x, z) => z > 228 && x > -52 && rBloom(x, z) > 84;       // the amphitheatre's ground: ranks, not the grid
    const X0 = -470, X1 = 400, Z0 = -150, Z1 = 810, CELL = 9;
    for (let j = 0; j * CELL + Z0 < Z1; j++) {
      const zc = Z0 + j * CELL;
      for (let i = 0; i * CELL + X0 < X1; i++) {
        const xc = X0 + i * CELL + (j % 2) * 4.5;
        if (poolDist(xc, zc) < 3 || bayDist(xc, zc) < 3) continue;
        const n = path.nearestXZ(xc, zc), d = n.dist;
        // beyond the pool, behind the bay's own first ranks, the plants are few and giant too: from the bloom nothing is a carpet
        const back = d > 30 && zc > 240 && rBloom(xc, zc) > 84 && bayDist(xc, zc) > 14;
        const lvl = back ? (d < 115 ? 3 : 4) : d < 55 ? 1 : d < 115 ? 2 : 4;
        if (i % lvl || j % lvl) continue;
        const jx = (rng() - 0.5) * 7 * lvl, jz = (rng() - 0.5) * 3 * lvl, kr = rng(), hr = rng(), keep = rng(), gr = rng();
        const x = xc + jx, z = zc + jz;
        if (zc > 100 && zc < 156 && Math.abs(xc + 3.5) < 34) continue;          // the six ranks stand here
        if (inTree(x, z) || nearEnd(x, z) || poolDist(x, z) < 2 || bayDist(x, z) < 2 || farShore(x, z)) continue;
        if (lvl > 1 && keep > detail * density) continue;                        // phones thin the far ranks only
        const sc = lvl > 2 ? 3 : 1 + 2 * Math.max(0, Math.min(1, (d - 10) / 300));
        const torch = kr > 0.955, k0 = torch ? 'torch' : KINDS[Math.floor(kr * 10.47) % 10], kind = k0 === 'fern' && lvl > 1 ? 'spear' : k0;
        const h = (kind === 'sword' ? 7 + hr * 5 : kind === 'fern' ? 9 + hr * 6 : torch ? 14 + hr * 12 : 10 + hr * 20) * sc;
        const o = lvl === 4 ? { count: FAR_N[kind] } : {};
        if ((d < 70 || lvl === 3) && !torch) { o.gi = gr > 0.86 ? 18 + Math.floor(gr * 70) % 11 : Math.floor(gr * gr * 19); o.dark = (kind === 'paddle' || kind === 'heart' ? 4 : 5) + (d < 70 ? 1 : 0); }
        putPlant(x, z, kind, h, o);
      }
      await ctx.yield();
    }
    // the amphitheatre: four ranks of giant flats round the far shore, standing one above the other on the climbing
    // bank; under the entry's leaf line (the capped sector) only the first and third stand, so each shows whole.
    {
      const RK = [[92, 62, 16], [150, 84, 25], [225, 112, 37], [320, 148, 52]], RKIND = ['paddle', 'spear', 'fan', 'spear', 'heart', 'paddle', 'spear'];
      for (let k = 0; k < 4; k++) {
        const [R, T, gap] = RK[k], n = Math.floor((195 * RAD * R) / gap);
        for (let i = 0; i <= n; i++) {
          const th = (-80 + (i / n) * 195 + (rng() - 0.5) * 3) * RAD, rr = R + (rng() - 0.5) * (6 + k * 5), hr = rng();
          const x = BL[0] + Math.sin(th) * rr, z = BL[1] + Math.cos(th) * rr;
          if (inTree(x, z) || poolDist(x, z) < 4 || bayDist(x, z) < 6 || path.nearestXZ(x, z).dist < 22) continue;
          const cap = capTop(x, z), y = Math.max(0, ground(x, z)), top = T * (0.9 + 0.2 * hr);
          if (cap < top * 0.85 && (k === 3 || (k === 1 && i % 2))) continue;
          const kind = RKIND[(i + k * 3) % 7];
          putPlant(x, z, kind, top - y, { yaw: Math.atan2(BL[0] - x, BL[1] - z), waveS: 0.3 + 0.2 * (rr / 320), minH: 16, gi: Math.floor(hr * 23), dark: k < 2 ? (kind === 'paddle' || kind === 'heart' ? 4 : 5) : 0 });
        }
        await ctx.yield();
      }
      // and far behind the disc a few flats so tall that they cut its foot from the lane and from the bloom alike
      for (let i = 0; i < 6; i++) {
        const b = (sunBd - 6 + i * 2.4 + (rng() - 0.5)) * RAD, D = 1300 + ((i * 3) % 5) * 70, off = Math.abs(i - 2.5);
        const top = 9 + D * Math.tan((sunDeg - 1.7 + (off < 1 ? 0 : 0.5)) * RAD), x = Math.sin(b) * D, z = ZIN + Math.cos(b) * D;
        set.plant(rng, { x, y: 20, z, yaw: Math.PI, h: top - 20, kind: i % 2 ? 'paddle' : 'spear', gi: 3 + i * 4, waveS: 0.5, count: i % 2 ? 5 : 7 });
        nPlants++;
      }
    }
    // the level leaf horizon: giant blades beyond 400 m
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * 6.2832 + rng() * 0.03, r = 440 + rng() * 150, hh = 58 + rng() * 44, kr = rng();
      const x = -30 + Math.sin(a) * r, z = 270 + Math.cos(a) * r;
      putPlant(x, z, kr < 0.45 ? 'paddle' : kr < 0.8 ? 'heart' : 'fan', hh * (i % 5 === 2 ? 1.3 : i % 3 ? 1 : 0.8), { yaw: Math.atan2(-30 - x, 270 - z), waveS: 0.5, minH: 14, dark: 3, sink: 0.3, count: kr < 0.45 ? 7 : kr < 0.8 ? 8 : 9 });
      if (i % 8 === 7) await ctx.yield();
    }
    for (let i = 0; i < 100; i++) {                     // and a second, taller wall far behind it, so no bank shows over the leaves from the bloom
      const a = (i / 100) * 6.2832 + rng() * 0.03, r = 800 + rng() * 80, hh = 110 + rng() * 40, kr = rng();
      const x = -30 + Math.sin(a) * r, z = 270 + Math.cos(a) * r, kind = kr < 0.6 ? 'heart' : 'paddle';
      putPlant(x, z, kind, hh * (i % 4 === 1 ? 1.35 : i % 2 ? 1.05 : 0.85), { yaw: Math.atan2(-30 - x, 270 - z), waveS: 0.5, minH: 20, sink: 0.34, count: kind === 'heart' ? 8 : 7, dark: 2, gi: 2 + Math.floor(kr * 14) });
      if (i % 8 === 7) await ctx.yield();
    }
    // HORROR VACUI. Round the whole pool the flats stand rank over rank, each lapping its neighbours by a third and
    // the rank behind by half, crowns rounded and of unequal height, so that from bloom height the bank is never seen
    // as a bare hill: green-black shows only as leaf-shaped gaps between one complete plant and the next.
    {
      const pr = rng.fork ? rng.fork('pack') : rng;
      const RANKS = [[75.5, 6.5, 12, 5], [80, 11, 19, 7], [88, 17, 27, 9], [99, 25, 37, 11], [113, 30, 46, 13], [130, 36, 54, 16], [150, 42, 62, 19], [175, 50, 72, 23], [205, 58, 84, 28], [240, 66, 96, 33], [282, 76, 110, 39], [330, 86, 125, 46]];
      const LOW = ['sword', 'heart', 'fern', 'paddle', 'sword', 'heart'], TALL = ['paddle', 'heart', 'paddle', 'fan', 'heart', 'paddle', 'spear', 'heart'];
      let c = 0;
      for (let k = 0; k < RANKS.length; k++) {
        const [R, h0, h1, gap] = RANKS[k], n = Math.floor((6.2832 * R) / gap);
        for (let i = 0; i < n; i++) {
          const r1 = pr(), r2 = pr(), r3 = pr(), r4 = pr();
          const th = ((i + (k % 2) * 0.5 + (r1 - 0.5) * 0.5) / n) * 6.2832, rr = R + (r2 - 0.5) * gap * 0.5;
          const x = POOL.x + Math.sin(th) * rr, z = POOL.z + Math.cos(th) * rr;
          if (poolDist(x, z) < (k ? 1.5 : -2.5) || bayDist(x, z) < 5 || inTree(x, z) || nearEnd(x, z)) continue;
          const pd = path.nearestXZ(x, z);
          if (pd.dist < (z < 215 ? 26 : 12)) continue;                      // the lane keeps its own wall; the valley of the reveal stays open
          if (k > 4 && r4 > detail * density + 0.15) continue;
          const kind = k < 3 ? LOW[(i + k * 2) % 6] : TALL[(i * 3 + k) % 8];
          const lineTop = (59 + (rBloom(x, z) - 92) * 0.27) * (0.86 + 0.26 * r3 + (i % 7 === 3 ? 0.14 : 0)) - Math.max(0, ground(x, z));
          const h = Math.min((h0 + (h1 - h0) * r3 * r3) * (i % 7 === 3 ? 1.28 : 1), Math.max(k < 3 ? 6 : 14, lineTop)), wide = kind === 'paddle' || kind === 'heart';
          putPlant(x, z, kind, h, { rng: pr, yaw: Math.atan2(BL[0] - x, BL[1] - z), waveS: 0.3 + 0.2 * (rr / 330), minH: k < 3 ? 6 : 12,
            gi: r4 > 0.84 ? 17 + Math.floor(r1 * 11) : Math.floor(r1 * r1 * 20), dark: kind === 'sword' || kind === 'fern' ? 3 : wide ? 4 : 5, count: kind === 'fern' ? 5 : undefined });
          if (++c % 16 === 0) await ctx.yield();
        }
      }
    }
    // torch flowers over the leaves beside the route: a warm accent in every frame
    for (const [u, off, hh] of [[0.07, 13, 20], [0.13, -15, 24], [0.2, 20, 26], [0.86, -42, 24], [0.9, 44, 22], [0.96, -24, 20], [0.99, 30, 26]]) {
      const p = at(u), s = portAt(u);
      putPlant(p[0] + s[0] * off, p[2] + s[2] * off, 'torch', hh, { minH: 8 });
    }
    await ctx.yield();

    // ---- combed grass: stiff hairs in tufts, all leaning the same 8 degrees; the ones under us part as we pass ----
    {
      const GC = 3.3, lean = [Math.sin(8 * RAD), Math.cos(8 * RAD), 0];
      // THE CAT'S LAWN. lawnE: every second sample of the route from the entry to 0.03 of the course before the sample nearest the seat.
      // lawnT: five points in plan, 3 m apart, on the line through the seat square to yawTo there (the x axis, at rest, of a plant standing
      // at the seat with that yaw), from -3 m to 9 m along it. lawnAt(x, z) is Infinity unless z is between ZIN - 6 and 12 m past the seat's z and x
      // within 30 m of the seat's; there it is the least (Infinity where there is none), over every pair of a sample and a point whose
      // straight stretch in plan from the one to the other (ends included, no further) passes nearer than 12 m to (x, z) in plan, of:
      // that stretch's height at its place nearest (x, z) in plan (from the sample's y to y 3 at the point), less 0.3 m, less the
      // ground's height at (x, z) taken as 0 where it is lower, the whole taken as 2.4 m where it is less; plus half of what the
      // stretch's distance from (x, z) in plan is over 2.6 m, plus half the square of what it is over 7 m.
      const lawnE = [], lawnT = [];
      { const uS = path.nearestXZ(SEAT[0], SEAT[2]).u, ya = yawTo(SEAT[0], SEAT[2], uS), k0 = Math.max(0, Math.round((uS - 0.03) * NS));
        for (let k = 0; k <= k0; k += 2) lawnE.push([sp[k * 3], sp[k * 3 + 1], sp[k * 3 + 2]]);
        for (const o of [-3, 0, 3, 6, 9]) lawnT.push([SEAT[0] + Math.cos(ya) * o, SEAT[2] - Math.sin(ya) * o]); }
      const lawnAt = (x, z) => {
        let lawn = Infinity;
        if (z > ZIN - 6 && z < SEAT[2] + 12 && Math.abs(x - SEAT[0]) < 30) {
          const g = Math.max(0, ground(x, z));
          for (const E of lawnE) for (const T of lawnT) {
            const ex = T[0] - E[0], ez = T[1] - E[2], s = Math.max(0, Math.min(1, ((x - E[0]) * ex + (z - E[2]) * ez) / (ex * ex + ez * ez)));
            const dl = Math.hypot(x - E[0] - ex * s, z - E[2] - ez * s);
            if (dl < 12) lawn = Math.min(lawn, Math.max(E[1] + (3 - E[1]) * s - 0.3 - g, 2.4) + 0.5 * Math.max(0, dl - 2.6) + 0.5 * Math.max(0, dl - 7) ** 2);
          }
        }
        return lawn;
      };
      // capAt: the least of the three trims the loop below makes on a tuft: 1.3 m under the route within 4.5 m of it; in the seat's rectangle 2.6 m plus a tenth of the seat's z less the place's; lawnAt.
      const capAt = (x, z, y, n) => Math.min(n.dist < 4.5 ? n.y - y - 1.3 : Infinity, x > SEAT[0] - 5.5 && x < SEAT[0] + 7 && z > SEAT[2] - 16 && z < SEAT[2] + 1 ? 2.6 + (SEAT[2] - z) * 0.1 : Infinity, lawnAt(x, z));
      let c = 0;
      for (let j = 0; -45 + j * GC < 520; j++) {
        const zc = -45 + j * GC;
        for (let i = 0; -175 + i * GC < 75; i++) {
          const xc = -175 + i * GC + (j % 2) * 1.6;
          const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
          const x = xc + (r1 - 0.5) * 2.6, z = zc + (r2 - 0.5) * 2.6;
          if (poolDist(x, z) < 0.5 || bayDist(x, z) < 0.5) continue;
          const n = path.nearestXZ(x, z), d = n.dist;
          const lawn = lawnAt(x, z);
          if (d > 56 || (lawn > 5.5 && r3 > (n.u > 0.55 ? 1.3 : 1.05) * (1 - d / 60) * detail * (d < 5 ? 1 : d < 18 ? 0.52 : 0.32))) continue;   // the chance a tuft is kept is times 0.52 from 5 to 18 m of the route, times 0.32 from 18 to 56 m; none is kept beyond 56 m; none is thinned where lawn is 5.5 m or less
          if (Math.hypot(x - END[0], z - END[2]) < 17) continue;
          const y = Math.max(0, ground(x, z)), sc = 1 + d / 60;
          let h = (3 + r4 * 5) * sc;
          if (d < 4.5) h = Math.min(h, n.y - y - 1.3);
          if (x > SEAT[0] - 5.5 && x < SEAT[0] + 7 && z > SEAT[2] - 16 && z < SEAT[2] + 1) h = Math.min(h, 2.6 + (SEAT[2] - z) * 0.1);   // grass hides its feet, never its face
          h = Math.min(h, lawn);                                 // no taller than lawn
          if (h < 1.6) continue;
          const p = at(n.u), s = portAt(n.u), side = (x - p[0]) * s[0] + (z - p[2]) * s[2] >= 0 ? 1 : -1;
          const gi = (r4 > 0.86 ? 13 : 3) + Math.floor(r1 * 12), k = h / 5, yaw = yawTo(x, z, n.u);                   // dark greens; one tuft in seven is a light accent
          const common = { pivot: [x, y, z], yaw, waveS: n.u, phase: r2, swing: d < 4.5 && n.y - y < 14 ? side * Math.max(0.01, n.u - 0.008) : 0, nod: 0.6 };
          for (let q = 0; q < 8; q++) {
            const f = ((q * 5) % 8) / 8;
            set.blade('grass', { ...common, base: [(q - 3.5) * 0.52 * k, 0, 0], axis: lean, len: h * (0.62 + 0.38 * f), wid: (0.42 + 0.2 * f) * k, a: G[gi + (q % 3)], b: G[gi + 8 + (q % 2) * 2], layer: q });
          }
          if (h < 4.5 && lawn <= 5.5) {                                         // a tuft that stands under 4.5 m where lawn is 5.5 m or less: eight more blades at its own foot on layers 8 to 15 and a twin of eight, these sixteen with no midrib (veins -1); each eight stand 0.47 m apart and are 0.42 to 0.595 m wide whatever the height
            for (let q = 0; q < 8; q++) { const f = ((q * 3) % 8) / 8; set.blade('grass', { ...common, base: [(q - 3.5) * 0.47 + 0.24, 0, 0], axis: lean, len: h * (0.62 + 0.38 * f), wid: 0.42 + 0.2 * f, a: G[gi + (q % 3)], b: G[gi + 8 + (q % 2) * 2], layer: q + 8, veins: -1 }); }
            // the twin stands 1.65 m toward +x and 1.65 m toward -z of the tuft, on layers 16 to 23, however near another tuft or twin stands: its foot at the ground's height there (0 where the ground is lower); the tuft's height but no more than capAt there; yaw, waveS, side and swing as the lines above reckon them, from its own place and its own nearest sample; phase and pigments the tuft's
            const x2 = x + 1.65, z2 = z - 1.65, n2 = path.nearestXZ(x2, z2), y2 = Math.max(0, ground(x2, z2)), h2 = Math.min(h, capAt(x2, z2, y2, n2));
            const p2 = at(n2.u), s2 = portAt(n2.u), side2 = (x2 - p2[0]) * s2[0] + (z2 - p2[2]) * s2[2] >= 0 ? 1 : -1;
            const twin = { pivot: [x2, y2, z2], yaw: yawTo(x2, z2, n2.u), waveS: n2.u, phase: r2, swing: n2.dist < 4.5 && n2.y - y2 < 14 ? side2 * Math.max(0.01, n2.u - 0.008) : 0, nod: 0.6 };
            for (let q = 0; q < 8; q++) { const f = ((q * 3 + 1) % 8) / 8; set.blade('grass', { ...twin, base: [(q - 3.5) * 0.47 + 0.24, 0, 0], axis: lean, len: h2 * (0.62 + 0.38 * f), wid: 0.42 + 0.2 * f, a: G[gi + (q % 3)], b: G[gi + 8 + (q % 2) * 2], layer: q + 16, veins: -1 }); }
          }
          if (++c % 60 === 0) await ctx.yield();
        }
        if (j % 3 === 2) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- THE INCIDENT of the lane: one big tawny cat looks straight out of the leaves, frontal and wide-eyed (round ears,
    // pale muzzle, ruled whiskers, ring eyes, no stripe on it or near it). It stands in the open among BROAD leaves in plain
    // greens: big paddle blades fanned behind it, one heart leaf lapping its shoulder, low heart leaves beside its tail,
    // the trimmed combed grass at its feet, its face whole. An animal of ours, built of the same cut blades as everything
    // else, feet not quite on the ground. No striped blade stands within 12 m of it (putPlant turns any sword there into
    // a heart-leaf plant). ----
    {
      const cr = rng.fork ? rng.fork('cat') : rng, k = 1.12, uC = path.nearestXZ(CAT[0], CAT[2]).u;
      const A = pig[5].clone().lerp(pig[0], 0.42), B = pig[5].clone().lerp(pig[3], 0.62), paleA = pale.clone().lerp(pig[3], 0.2), paleB = white.clone().lerp(pale, 0.2);
      const c = { pivot: CAT, yaw: yawTo(CAT[0], CAT[2], uC), limit: 3.2, waveS: uC, phase: 0.37, nod: 0.2 };
      const part = (shape, bx, by, ang, len, wid, layer, a = A, b = B, more = {}) =>
        set.blade(shape, { ...c, base: [bx * k, by * k, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: len * k, wid: wid * k, layer, a, b, veins: -1, ...more });
      part('sword', 8.6, 1.6, 0.55, 4.4, 0.55, 15, A, B, { anim: [0.25, 0, 0.9, 0.2] });        // tail, lifted, wagging stiffly
      part('paddle', 1.0, 1.9, 1.72, 8.6, 3.9, 16, A, B, { veins: 0 });                            // the long back
      part('disc', 5.6, 0.2, 0, 3.7, 3.9, 17);                                                     // haunch
      part('spear', -1.25, 1.5, 3.02, 1.9, 1.05, 18); part('spear', 1.25, 1.5, 3.26, 1.9, 1.05, 18);   // forepaws
      part('disc', -1.95, 4.75, 0, 1.45, 1.45, 19); part('disc', 1.95, 4.75, 0, 1.45, 1.45, 19);   // round ears
      part('disc', -1.95, 5.05, 0, 0.7, 0.7, 20, pig[0], A); part('disc', 1.95, 5.05, 0, 0.7, 0.7, 20, pig[0], A);
      part('disc', 0, 1.25, 0, 4.7, 5.4, 21);                                                      // the head, a full round
      part('disc', 0, 1.4, 0, 2.0, 2.9, 22, paleA, paleB);                                         // muzzle
      part('heart', 0, 3.45, 3.1416, 0.8, 1.0, 23, pig[0], A.clone().lerp(pig[0], 0.5));           // nose
      for (const sd of [-1, 1]) {
        part('disc', sd * 1.22, 3.5, 0, 1.4, 1.4, 24, pig[2], pig[3]);                             // ring eyes, wide
        part('disc', sd * 1.22, 3.92, 0, 0.6, 0.6, 25, pig[0], pig[0]);
        for (let q = 0; q < 3; q++) part('grass', sd * 0.9, 2.15 + q * 0.12, sd * (1.25 + q * 0.3), 2.3, 0.13, 26, paleB, paleB);   // ruled whiskers
      }
      jnsEyes(set, { x: CAT[0] + 9.5, y: 5.2, z: CAT[2] + 1.5, waveS: uC }, 1.25, { flip: 1, gi: 11 });   // and a pair of eyes in the green-black gap beside it
      // the one heart leaf, in the cat's own plane: over its back and haunch, under its ears and face
      part('heart', 4.3, -0.6, -0.42, 5.4, 4.7, 17.5, G[15], G[29], { veins: 0 });
      // broad leaves round it, each plant a complete regular fan: [metres to starboard, metres beyond, height, kind, count, green]
      // (four plants, three draws each, as the four plants that stood here took: the lane's oranges hang where they hung)
      for (const [dx, dz, h, kind, count, gi] of [[-4.6, 2.2, 12.5, 'paddle', 3, 18], [4.4, 2.8, 15.5, 'paddle', 3, 22], [9.4, -0.6, 6.4, 'heart', 6, 19], [-2.2, 3.4, 8.2, 'heart', 6, 11]])
        set.plant(cr, { x: CAT[0] - dx, y: 0, z: CAT[2] + dz, yaw: Math.PI, h, kind, count, gi, waveS: uC, dark: 1 });
      // ---- oranges as big as houses hang in the lane's trees: flat discs graded orange to yellow-green ----
      const oa = pig[5], ob = pig[5].clone().lerp(pig[3], 0.6);
      for (const [mu, moff, mdy] of [[0.05, 12, 2.5], [0.1, -12.5, 3], [0.155, 12, 3.5], [0.21, -12, 4], [0.03, -10, -3.5], [0.04, 7.5, -1.1], [0.052, -9.5, 0], [0.068, 11, 1], [0.08, -12, -0.5], [0.1, 10, -3]]) { const mp = at(mu), ms = portAt(mu); lanePts.push([mp[0] + ms[0] * moff, mp[1] + mdy + 1.5, mp[2] + ms[2] * moff]); }
      for (let i = 0; i < 22; i++) {
        const u = 0.04 + (i / 22) * 0.2 + cr() * 0.01, p = at(u), sd = portAt(u), side = i % 2 ? 1 : -1, off = side * (11.5 + cr() * 13), size = 1.9 + cr() * 1.1;
        const x = p[0] + sd[0] * off, z = p[2] + sd[2] * off, y = Math.min(p[1] + 1.5 + cr() * 9 + Math.abs(off) * 0.25, capTop(x, z) - size - 1);
        if (y < 6 || keepOutHas(x, y + size * 0.5, z, size)) continue;
        set.blade('disc', { pivot: [x, y, z], limit: 3.2, waveS: u, phase: cr(), nod: 0.5, veins: -1, len: size, wid: size, a: oa, b: ob, layer: 12 });
        set.blade('spear', { pivot: [x, y + size * 0.9, z], limit: 3.2, waveS: u, phase: 0.5, nod: 0.5, base: [0, 0, 0], axis: [0.5, 0.87, 0], len: size * 0.9, wid: size * 0.42, a: G[6], b: G[18], layer: 11 });   // its one leaf
      }
    }

    await ctx.yield();
    // ---- eyes in the dark gaps: six pairs round the entry, none after u 0.88 ----
    const keepOut = [];
    {
      // each pair brings its own green-black leaves behind it; none is wider than a twentieth of the frame where it is seen
      const E = [[0.03, -10, -2, 0.4], [0.04, 7.5, 0.4, 0.36], [0.052, -9.5, 1.5, 0.42], [0.068, 11, 2.5, 0.5], [0.08, -12, 1, 0.5], [0.1, 10, -1.5, 0.45]];
      for (let i = 0; i < 8; i++) E.push([0.115 + i * 0.019, (i % 2 ? -1 : 1) * (9 + rng() * 5), rng() * 5 - 2, 0.42 + rng() * 0.25]);
      for (let i = 0; i < 10; i++) E.push([0.63 + i * 0.017, (i % 2 ? 1 : -1) * (11 + rng() * 5), rng() * 7 - 3.5, 0.55 + rng() * 0.3]);
      for (let i = 0; i < 6; i++) E.push([0.81 + i * 0.011, (i % 2 ? -1 : 1) * (30 + rng() * 9), 2 + rng() * 5, 1.2 + rng() * 0.4]);
      for (const [u, off, dy, size] of E) {
        const p = at(u), s = portAt(u), e = { x: p[0] + s[0] * off, y: Math.max(1.5, u < 0.3 ? Math.min(12.5, p[1] + dy) : p[1] + dy), z: p[2] + s[2] * off, waveS: u };
        if (Math.hypot(e.x - SEAT[0], e.z - SEAT[2]) < 11) continue;
        jnsEyes(set, e, size, { flip: off > 0 ? 1 : -1, gi: 6 + Math.floor(((u * 977) % 1) * 10) });
        keepOut.push([e.x, e.y, e.z]);
      }
    }

    // six more pairs far off in the green-black of the amphitheatre, between its ranks: seen from the bloom, never from the bay
    [[14, 130], [27, 185], [40, 150], [53, 195], [66, 140], [80, 175]].forEach(([deg, r], i) => {
      const x = BL[0] + Math.sin(deg * RAD) * r, z = BL[1] + Math.cos(deg * RAD) * r;
      jnsEyes(set, { x, y: ground(x, z) + 7 + (i % 3) * 3, z, waveS: 0.45 }, 2.1 + (i % 2) * 0.5, { back: false });
    });

    await ctx.yield();
    // ---- the orange tree: a round dark crown of spear blades on ruled branches, fruit as flat discs, monkeys ----
    const tree = { fruit: 0 };
    {
      const C = [TREE.x, TREE.y, TREE.z], T = TREE.trunk, top = [-89.5, 25, 318.5];
      const seg = (a, b, wid, gi, layer = 1) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
        set.blade('stalk', { pivot: a, limit: 0, waveS: uTree, nod: 0, mode: 1, axis: [dx / len, dy / len, dz / len], len, wid, a: G[gi], b: G[gi + 9], layer });
      };
      const mid = [(T[0] + top[0]) / 2 - 0.8, 12, (T[2] + top[2]) / 2];
      seg(T, mid, 2.0, 3); seg(mid, top, 1.7, 3);
      set.blade('stalk', { pivot: mid, limit: 0, nod: 0, mode: 1, base: [0, -0.35, 0], len: 0.8, wid: 3, a: G[1], b: G[8], layer: 2, veins: -1 });
      for (let i = 0; i < 16; i++) {                    // ruled branches
        const a = (i / 16) * 6.2832 + rng() * 0.3, e = -0.5 + rng() * 1.5, r = 11 + rng() * 6;
        const b = [C[0] + Math.cos(a) * Math.cos(e) * r, C[1] + Math.sin(e) * r, C[2] + Math.sin(a) * Math.cos(e) * r];
        const from = i % 2 ? top : mid, m = [(from[0] + b[0]) / 2, (from[1] + b[1]) / 2, (from[2] + b[2]) / 2];
        // no ruled branch crosses the lens: every point of it stands 10 m clear of the route
        let clear = b[1] >= 2;
        for (let q = 1; q <= 6 && clear; q++) { const f = q / 6; if (near3(from[0] + (b[0] - from[0]) * f, from[1] + (b[1] - from[1]) * f, from[2] + (b[2] - from[2]) * f).d < 10) clear = false; }
        if (!clear) continue;
        seg(from, b, 0.55, 5, 1);
      }
      for (let i = 0; i < 46; i++) {                     // the dark of the crown: rosettes of green-black spear leaves, paint between the leaves
        const a = rng() * 6.2832, cz = rng() * 2 - 1, rr = TREE.r * 0.78 * Math.cbrt(rng()), sxy = Math.sqrt(1 - cz * cz), size = 6.5 + rng() * 3.5, rot = rng() * 6.2832;
        const x = C[0] + Math.cos(a) * sxy * rr, y = C[1] + cz * rr, z = C[2] + Math.sin(a) * sxy * rr;
        if (near3(x, y, z).d < 12.5 + size) continue;
        for (let q = 0; q < 6; q++) {
          const t = rot + q * 1.0472;
          set.blade('spear', { pivot: [x, y, z], limit: 3.2, nod: 0, axis: [Math.sin(t), Math.cos(t), 0], len: size * (q % 2 ? 1 : 0.8), wid: size * 0.42, a: pig[0], b: q % 3 ? pig[0] : G[0], veins: -1, layer: q % 2 });
        }
      }
      await ctx.yield();
      let placed = 0;
      for (let i = 0; i < 700 && placed < 150; i++) {    // clusters of six dark spears: 900 blades
        const a = rng() * 6.2832, cz = rng() * 2 - 1, rr = TREE.r * (0.42 + 0.58 * Math.sqrt(rng())), sxy = Math.sqrt(1 - cz * cz), hh = 8 + rng() * 3.5;
        const x = C[0] + Math.cos(a) * sxy * rr, y = C[1] + cz * rr - hh * 0.5, z = C[2] + Math.sin(a) * sxy * rr;
        const n = near3(x, y + hh * 0.5, z);
        if (n.d < 10.5 + hh * 0.5 || y < Math.max(0, ground(x, z)) + 0.3) continue;
        set.plant(rng, { x, y, z, yaw: yawTo(x, z, n.u), h: hh, kind: 'spear', count: 6, gi: Math.floor(rng() * 9), waveS: n.u });
        placed++;
        if (placed % 30 === 29) await ctx.yield();
      }
      await ctx.yield();
      const M = [[0.738, -5.8, -1.6, 2.9], [0.665, 9, 2.5, 2.8], [0.685, -9.5, 3.5, 2.8], [0.7, 8.5, -3.5, 2.6], [0.74, 8, 1.5, 2.8], [0.755, -8.5, 2.5, 2.8],
        [0.77, 7.5, -2, 2.6], [0.785, -8, -1, 2.8], [0.8, 9, 3, 3.0], [0.05, 12, 2.5, 3.2], [0.1, -12.5, 3, 3.2], [0.155, 12, 3.5, 4.4], [0.21, -12, 4, 4.6]];
      // (the row ISLET_ROW is a seat left empty in the tree: it takes its draws and its keep-out, so the layout stays in step; the last of the tree's monkeys sits on the bay's islet)
      const ISLET_ROW = 8;
      tree.monkeys = [];
      for (const [u, off, dy] of M) { const p = at(u), s = portAt(u); keepOut.push([p[0] + s[0] * off, Math.max(0.5, p[1] + dy) + 1.5, p[2] + s[2] * off]); }
      const fa = blossom ? pale.clone() : pig[5], fb = blossom ? white.clone().lerp(pale, 0.25) : pig[5].clone().lerp(pig[3], 0.6);
      for (let i = 0; i < 400 && tree.fruit < 60; i++) {   // sixty fruit, flat discs 4 m across, the nearest sliding by 5 m off
        let x, y, z;
        if (i % 2) { const u = uTree - 0.045 + rng() * 0.13, p = at(u), a = rng() * 6.2832, r = 7 + rng() * 5; x = p[0] + Math.cos(a) * r; y = p[1] + (rng() - 0.5) * 12; z = p[2] + Math.sin(a) * r; }
        else { const a = rng() * 6.2832, cz = rng() * 2 - 1, rr = TREE.r * (0.5 + 0.48 * rng()), sxy = Math.sqrt(1 - cz * cz); x = C[0] + Math.cos(a) * sxy * rr; y = C[1] + cz * rr; z = C[2] + Math.sin(a) * sxy * rr; }
        const n = near3(x, y, z), close = tree.fruit < 3, size = close ? 2.3 + rng() * 0.4 : 3.4 + rng() * 1.0;
        if (n.d < (close ? 8.5 : 10.5) + size * 0.5 || Math.hypot(x - C[0], y - C[1], z - C[2]) > TREE.r || y < 3) continue;
        if (keepOut.some((k) => Math.hypot(k[0] - x, k[1] - y, k[2] - z) < size * 0.5 + 3)) continue;
        const fc = { pivot: [x, y - size * 0.5, z], limit: 3.2, waveS: n.u, phase: rng(), nod: 0.5, veins: -1 };
        if (!blossom) set.blade('disc', { ...fc, len: size, wid: size, a: fa, b: fb, layer: 12 });
        else {                                             // the blossom cast: five round petals about a small heart, a flower and never an eye
          const rot = (tree.fruit * 2.4) % 6.2832, R = size * 0.56;
          for (let q = 0; q < 5; q++) {
            const t = rot + q * 1.2566;
            set.blade('heart', { ...fc, base: [Math.sin(t) * R, size * 0.5 + Math.cos(t) * R, 0], axis: [-Math.sin(t), -Math.cos(t), 0], len: R * 0.98, wid: R * 1.12, a: fa, b: fb, layer: 12 + (q % 2), veins: q % 2 ? 0 : -1 });
          }
          set.blade('disc', { ...fc, base: [0, size * 0.39, 0], len: size * 0.22, wid: size * 0.22, a: pig[5].clone().lerp(pig[3], 0.5), b: G[39], layer: 15 });
        }
        tree.fruit++;
      }
      await ctx.yield();
      // the monkeys: one at arm's length to starboard at u 0.72, seven more in the crown (the ninth sits on the bay's islet),
      // four heads over blades in the lane
      for (let mi = 0; mi < M.length; mi++) {
        const [u, off, dy, size] = M[mi];
        const p = at(u), s = portAt(u), x = p[0] + s[0] * off, y = Math.max(0.5, p[1] + dy), z = p[2] + s[2] * off;
        const dk = rng() < 0.4;
        if (!size || mi === ISLET_ROW) { rng(); rng(); continue; }
        jnsMonkey(set, rng, { x, y, z, waveS: u }, { size: size * (u > 0.6 && u !== M[0][0] ? 1.35 : 1), dark: dk && u !== M[0][0] && u > 0.06, nod: 0.3 });   // the crown's monkeys are built large: they must read from the top of the drop
        if (u > 0.6) set.blade('stalk', { pivot: [x - s[2] * 3.5, y - 0.1, z + s[0] * 3.5], limit: 0, waveS: u, nod: 0, mode: 1, axis: [s[2], 0, -s[0]], len: 7, wid: 0.7, a: G[4], b: G[14], layer: 1 });   // its ruled perch
        tree.monkeys.push([x, y, z, size]);
      }
    }
    await ctx.yield();

    // ---- the drop: we fall BETWEEN flats. The two lotus that stand out toward the starboard shore hold big paddle
    // leaves across the dive, tips 4 m from our line, above eye level so the top of the frame crops them; each swings
    // aside on its stalk as we reach it. Pads lie on the water under the dive.
    {
      const uA = uGreat + 0.05, uB = uTree - 0.02;
      for (const bl of A.blooms) {
        const hw = W(bl.heart), fw = W(bl.foot);
        for (const [dy, gi] of [[9, 22], [16, 8]]) {
          let best = null;                                  // the route's nearest point to this stalk at that height
          for (let u = uA; u <= uB; u += 0.004) {
            const p = at(u), f = Math.max(0, Math.min(0.9, (p[1] + dy) / hw[1])), sx = fw[0] + (hw[0] - fw[0]) * f, sz = fw[2] + (hw[2] - fw[2]) * f, d = Math.hypot(p[0] - sx, p[2] - sz);
            if (!best || d < best.d) best = { d, u, p, sx, sz, y: p[1] + dy };
          }
          if (!best || best.d > 24 || best.d < 8 || best.y > hw[1] - bl.radius * 0.5) continue;
          const t = dirAt(best.u), s = portAt(best.u), side = (best.sx - best.p[0]) * s[0] + (best.sz - best.p[2]) * s[2] > 0 ? 1 : -1;
          const L = Math.min(13.5, best.d - 4 + (dy < 0 ? 2 : 0)), ang = side * (dy < 0 ? 1.75 : 1.32), c = { pivot: [best.sx, best.y, best.sz], yaw: Math.atan2(-t[0], -t[2]), limit: 0.3, waveS: best.u, phase: 0.2 + gi * 0.03, swing: side * Math.max(0.02, best.u - 0.006) };
          set.blade('sword', { ...c, axis: [Math.sin(ang), Math.cos(ang), 0], len: L * 0.3, wid: 0.45, a: G[6], b: G[16], layer: 3, veins: -1 });
          set.blade('paddle', { ...c, base: [Math.sin(ang) * L * 0.2, Math.cos(ang) * L * 0.2, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: L * 0.86, wid: L * 0.37, a: G[gi], b: G[gi + 10], layer: 4, veins: 15 });
          set.blade('spear', { ...c, base: [0, 0, 0], axis: [Math.sin(ang * 0.6), Math.cos(ang * 0.6), 0], len: L * 0.7, wid: L * 0.36, a: pig[0], b: G[2], layer: -1, veins: 0 });   // and a darker leaf behind it
        }
      }
      for (let i = 0; i < 12; i++) {                     // pads under the dive
        const u = uA + (uB - uA) * (0.25 + 0.75 * rng()), p = at(u), s = portAt(u), off = (rng() - 0.5) * 44, x = p[0] + s[0] * off, z = p[2] + s[2] * off;
        const size = 5 + rng() * 3.5, dir = rng() * 6.2832, gi = 8 + Math.floor(rng() * 12), ph = rng();
        if (poolDist(x, z) > -size * 0.6 || A.blooms.some((bl) => { const f = W(bl.foot); return Math.hypot(f[0] - x, f[2] - z) < size * 0.5 + 2; })) continue;
        set.blade('pad', { pivot: [x, 0.07, z], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[gi], b: G[gi + 12], layer: 2 + (i % 3), phase: ph });
      }
    }

    await ctx.yield();
    // the pink bird: a frontal flat in pure profile, one stiff stepping leg and a folding neck (k 1.4 = 7 m to the bill)
    const flamingo = (pivot, k, yaw, limit, waveS, phase, mir, cols) => {
      const ra = cols ? cols[0] : rose.clone().lerp(pig[5], 0.3), rb = cols ? cols[1] : rose.clone().lerp(white, 0.45);
      const c = { pivot, yaw, limit, waveS, phase, nod: 0.3 };
      const part = (shape, bx, by, ang, len, wid, layer, a = ra, b = rb, more = {}) =>
        set.blade(shape, { ...c, base: [mir * bx * k, by * k, 0], axis: [mir * Math.sin(ang), Math.cos(ang), 0], len: len * k, wid: wid * k, layer, a, b, veins: -1, ...more });
      part('stalk', 0.25, 0, 0.03, 2.5, 0.2, 20, ra, ra);                                   // standing leg
      part('stalk', -0.2, 2.45, 3.0, 1.25, 0.2, 20, ra, ra, { anim: [0.5, 0, 1.1, phase] });  // the stepping leg: thigh
      part('stalk', -0.05, 1.3, 3.25, 1.2, 0.18, 21, ra, ra, { anim: [0.22, 0.5, 1.1, phase] });   // and shin, lifted
      part('spear', 1.0, 2.9, 1.9, 1.5, 0.6, 22);                                            // tail feathers
      part('spear', 0.9, 3.1, 1.6, 1.3, 0.5, 23);
      part('heart', 1.1, 2.75, -1.42, 2.3, 1.5, 24, ra, rb, { veins: 0 });                   // body
      part('spear', 0.6, 3.05, 1.75, 1.5, 0.62, 25, cols ? cols[2] : rose.clone().lerp(pig[5], 0.5), rb);     // folded wing
      part('sword', -0.95, 2.95, -0.5, 1.15, 0.3, 26, ra, rb, { anim: [0.1, 0, 0.55, phase + 0.2] });    // the neck: three ruled pieces
      part('sword', -1.48, 3.85, 0.42, 0.95, 0.27, 27, ra, rb, { anim: [0.14, 0, 0.55, phase + 0.2] });
      part('sword', -1.12, 4.62, -0.75, 0.62, 0.25, 28, ra, rb, { anim: [0.16, 0, 0.55, phase + 0.2] });
      part('disc', -1.62, 4.72, 0, 0.52, 0.52, 29, ra, rb);                                  // head
      part('spear', -1.74, 5.05, -2.2, 0.75, 0.3, 30, pig[5].clone().lerp(pig[3], 0.4), pig[0]);   // bill, dark at the tip
      part('disc', -1.66, 4.93, 0, 0.11, 0.11, 31, pig[0], pig[0]);                          // eye
    };
    // THE FLAMINGOS OF THE POOL (after his own Flamingoes of 1907): four rose birds in pure profile standing in a row in
    // the water before the far shore among the pads and the lotus stalks, seen from the reveal and all the way up the
    // climb. As tall as small trees (19 to 22 m): scale is wrong by rule. A second group of four stands in the bay.
    {
      const feet = A.blooms.map((bl) => W(bl.foot));
      const FL = [[-15, 327, 4.4, 1], [3, 322, 3.8, 1], [22, 329, 4.5, -1], [40, 316, 3.9, 1]];
      FL.forEach(([x0, z, k, mir], i) => {
        let x = x0;
        for (let q = 0; q < 4 && feet.some((f) => Math.hypot(f[0] - x, f[2] - z) < 7); q++) x += 7;
        flamingo([x, 0, z], k, yawTo(x, z, 0.32), 3.2, 0.3 + (i + 4) * 0.012, ((i + 4) * 0.37) % 1, mir);
      });
    }
    // oranges as big as houses and torch flowers in the shore's trees too: the warm accent seen from the climb and the bloom
    {
      const fr = rng.fork ? rng.fork('shore-fruit') : rng, oa = pig[5], ob = pig[5].clone().lerp(pig[3], 0.6);
      for (let i = 0; i < 46; i++) {
        const r1 = fr(), r2 = fr(), r3 = fr(), r4 = fr();
        const th = (-105 + 210 * ((i + r1) / 46)) * RAD, rr = 82 + r2 * r2 * 75, x = POOL.x + Math.sin(th) * rr, z = POOL.z + Math.cos(th) * rr;
        if (inTree(x, z) || bayDist(x, z) < 8 || poolDist(x, z) < 5 || path.nearestXZ(x, z).dist < 22) continue;
        if (i % 4 === 3) { putPlant(x, z, 'torch', 26 + r3 * 20 + (rr - 82) * 0.2, { rng: fr, minH: 12, yaw: Math.atan2(BL[0] - x, BL[1] - z), waveS: 0.4 }); continue; }
        const size = 4.6 + r3 * 3 + (rr - 82) * 0.03, y = Math.min(Math.max(0, ground(x, z)) + (9 + (rr - 82) * 0.3) * (0.55 + 0.6 * r4), capTop(x, z) - size - 1.5);
        if (y < 5) continue;
        set.blade('disc', { pivot: [x, y, z], limit: 3.2, waveS: 0.4, phase: r1, nod: 0.5, veins: -1, len: size, wid: size, a: oa, b: ob, layer: 12 });
        if (i % 12 === 11) await ctx.yield();
        set.blade('spear', { pivot: [x, y + size * 0.9, z], limit: 3.2, waveS: 0.4, phase: 0.5, nod: 0.5, base: [0, 0, 0], axis: [0.5, 0.87, 0], len: size * 0.9, wid: size * 0.42, a: G[6], b: G[18], layer: 11 });
      }
    }
    await ctx.yield();
    // ---- the bay: flat pale water with ruled ripples, pads, and the one pink bird in profile ----
    const uBird = 0.9, exitYaw = Math.atan2(-END_DIR[0], -END_DIR[2]);
    const bird = (() => { const p = at(uBird), s = portAt(uBird); return [p[0] + s[0] * 7.2, 0, p[2] + s[2] * 7.2]; })();
    {
      const rip = [[bird[0], bird[2], 0.3]];
      for (let i = 0; i < 34; i++) {
        let x, z;
        if (i < 12) { const u = 0.845 + i * 0.0125, p = at(u), s = portAt(u), off = (i % 2 ? -1 : 1) * (2.5 + ((i * 5) % 7) * 1.5); x = p[0] + s[0] * off; z = p[2] + s[2] * off; rng(); rng(); }   // under the last straight
        else { const a = rng() * 6.2832, r = Math.sqrt(rng()) * 0.92; x = BAY.x + Math.cos(a) * r * BAY.rx; z = BAY.z + Math.sin(a) * r * BAY.rz; }
        if (bayDist(x, z) > -3) continue;
        const size = 5 + rng() * 3.5, dir = rng() * 6.2832, gi = 10 + Math.floor(rng() * 12), ph = rng();
        if (Math.hypot(x - bird[0], z - bird[2]) < size * 0.5 + 1.5) continue;
        { const q = offLadder(x, z, size * 0.5); if (!q || bayDist(q[0], q[1]) > -3) continue; x = q[0]; z = q[1]; }   // never on the disc's ladder (no draw of the rng follows)
        set.blade('pad', { pivot: [x, 0.05, z], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[gi], b: G[gi + 12], layer: 2 + (i % 3), phase: ph });
        if (rip.length < 24 && (i < 12 || i % 2)) rip.push([x, z, ph]);
      }
      const g = new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2).scale(BAY.rx + 1.5, 1, BAY.rz + 1.5).translate(BAY.x, 0, BAY.z);
      const bay = new THREE.Mesh(g, style.flat(pig[4], { ripples: rip, sky: waterSky }));
      bay.material.uniforms.uLine.value.lerp(pig[4], 0.35);
      bay.material.uniforms.uShore.value.set(BAY.x, BAY.z, BAY.rx + 1.5, BAY.rz + 1.5); bay.material.uniforms.uRefl.value.set(24, 40, 7, 0.92);
      bay.name = 'bay'; scene.add(bay);
      flamingo(bird, 1.4, yawTo(bird[0], bird[2], uBird), 1.3, uBird, 0.21, 1);
    }

    {
      const br = rng.fork ? rng.fork('bay-lotus') : rng;
      for (const [u, off, palePet, hh, R] of [[0.835, -11, false, 8.5, 3.4], [0.91, -13, true, 9.5, 3.7], [0.975, 12, false, 7.5, 3.2]]) {
        const p = at(u), sd = portAt(u), x = p[0] + sd[0] * off, z = p[2] + sd[2] * off;
        if (bayDist(x, z) > -2) continue;
        jnsLotus(set, br, { foot: [x + 0.6, 0, z + 0.4], heart: [x, hh, z], R, pale: palePet, waveS: u, waveTop: u, reach: 2.6, thick: 0.75, lite: true });
      }
    }

    await ctx.yield();
    // ---- the exit: two paddle plants 26 m tall lean together over a ring wreathed in forty spear blades ----
    const exitFeet = [];
    {
      const sx = -END_DIR[2], sz = END_DIR[0];                  // toward starboard (screen right on the approach)
      const EXIT_S = 1.005;                                     // the last wave reaches the two plants as it goes out through the ring, a moment before we do
      const leanPaddle = (off, back, h, lean, gi, ph) => {
        const x = END[0] + sx * off - END_DIR[0] * back, z = END[2] + sz * off - END_DIR[2] * back, y = Math.max(0, ground(x, z));
        // limit under 0.01: the flat neither hinges nor pitches back; it stands just behind the ring, so the wreath is whole in front of it
        const c = { pivot: [x, y, z], yaw: exitYaw, limit: 0.005, waveS: EXIT_S, phase: ph, nod: 1 }, ax = [Math.sin(lean), Math.cos(lean), 0];
        set.blade('stalk', { ...c, len: h * 0.72, wid: h * 0.035 + 0.12, a: G[gi - 4], b: G[gi + 4], veins: -1 });
        for (let i = 0; i < 7; i++) {
          const s = (i / 6) * 2 - 1, ang = s * 0.85 + lean, by = h * (0.4 + 0.3 * (1 - Math.abs(s))), len = h * (0.42 - 0.1 * Math.abs(s));
          set.blade('paddle', { ...c, base: [ax[0] * by, ax[1] * by, 0], axis: [Math.sin(ang), Math.cos(ang), 0], layer: 1 + (i % 2 ? i : 7 - i), len, wid: len * 0.36, a: G[gi], b: G[gi + 8], veins: 14 });
        }
        {                                                    // one big light leaf low on the outer side of the plant
          const ang = lean - Math.sign(lean) * 0.62, len = h * 0.52;
          set.blade('paddle', { ...c, base: [ax[0] * 1.5, ax[1] * 1.5, 0], axis: [Math.sin(ang), Math.cos(ang), 0], layer: 1, len, wid: len * 0.46, a: G[24], b: G[38], veins: 14 });
        }
        return { foot: [x, y, z], ax, h };
      };
      // both fans are regular and complete, each leaf in its place, and both nod in full. On the last straight the disc
      // stands to port of the port plant and slides behind its fan as we close
      exitFeet.push(leanPaddle(-14, -1, 26, 0.27, 12, 0.3), leanPaddle(14, -1, 26, -0.27, 22, 0.6));   // the starboard one is light: the snake is read against it
      // one light chrome-green paddle blade stands half a metre behind the snake's own flat (4 m nearer than the plant,
      // 3.5 m to starboard), under its whole head and lower coil, so the green-black S is cut out on both sides
      { const f = exitFeet[1];
        set.blade('paddle', { pivot: [f.foot[0] - END_DIR[0] * 4.0 - END_DIR[2] * 3.5, f.foot[1], f.foot[2] - END_DIR[2] * 4.0 + END_DIR[0] * 3.5], yaw: exitYaw, limit: 0.005, waveS: EXIT_S, phase: 0.6, nod: 1,
          base: [-2.3, 3.2, 0], axis: [Math.sin(-0.07), Math.cos(-0.07), 0], layer: 9, len: 19, wid: 13.5, a: G[27], b: G[39], veins: 14 }); }
      const wc = { pivot: END, yaw: exitYaw, limit: 0, waveS: 0.995, nod: 1 };
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * 6.2832, t = a + (i % 2 ? 0.62 : 1.12), gi = 3 + ((i * 7) % 19), r = i % 2 ? 8.3 : 7.8, hot = i % 5 === 2;
        set.blade('spear', { ...wc, phase: i / 40, base: [Math.cos(a) * r, Math.sin(a) * r, 0], axis: [Math.cos(t), Math.sin(t), 0], len: i % 2 ? 6.6 : 5.2, wid: i % 2 ? 2.5 : 2.0,
          a: hot ? G[24] : G[gi], b: hot ? G[39] : G[gi + 9], layer: 1 + (i % 4) + (hot ? 4 : 0) });
      }
      // three lapped flats that cut the disc, 24 degrees to port of the ring's axis
      const b0 = Math.atan2(sunDir.x, sunDir.z);
      for (let i = 0; i < 3; i++) {
        const b = b0 + (i - 1) * 0.085, r = 150 + i * 14, x = END[0] - END_DIR[0] * 40 + Math.sin(b) * r, z = END[2] - END_DIR[2] * 40 + Math.cos(b) * r, y = Math.max(0, ground(x, z));
        const top = 5 + r * Math.tan(sunE + (i - 0.6) * 0.035);
        set.plant(rng, { x, y, z, yaw: exitYaw, h: (top - y) * 1.05, kind: i === 1 ? 'paddle' : 'spear', gi: 4 + i * 9, waveS: 1, limit: 0.5 });
      }
    }
    // ==== THE HEIGHT OF THE JUNGLE ====
    // Behind and among the leaf wall stand his tall trees, rank over rank: smooth pale trunks, big round crowns of
    // unequal height (a mass of whole lapped leaves, each its own green, over green-black), fan palms, feather palms
    // and very tall stems with drooping blades, so the skyline rises and falls and the sky is seen as shaped openings.
    // The disc keeps a notch along the whole flight; crowns only cut its foot.
    const tr = rng.fork ? rng.fork('tall') : rng;
    const trunkA = mixS(pig[2], pig[3], 0.35), trunkB = mixS(pig[3], pale, 0.45);
    const EYES = Array.from({ length: 49 }, (_, i) => at(i * 0.02));   // every fiftieth of the flight, entry to exit: the disc keeps its notch all the way
    const tallCap = (x, z, jit) => {
      let cap = 1e9;
      for (const E of EYES) {
        const dx = x - E[0], dz = z - E[2], D = Math.hypot(dx, dz);
        if (D < 12) continue;
        const ds = Math.abs(Math.atan2(dx, dz) / RAD - sunBd);
        if (ds < 11) cap = Math.min(cap, E[1] + D * Math.tan((sunDeg - 5 + 4.5 * jit + sstep(5.5, 11, ds) * 40) * RAD));
      }
      const dz0 = z - ZIN, D0 = Math.hypot(x, dz0);
      if (dz0 > 0 && D0 < 330) cap = Math.min(cap, 9 + D0 * Math.tan((7.5 + sstep(9, 19, Math.abs(Math.atan2(x, dz0) / RAD - 4)) * 44) * RAD));   // the lane's low leaf line dead ahead
      const ex = x - V2[0], ez = z - V2[2], D2 = Math.hypot(ex, ez);
      if (D2 > 20 && ex * END_DIR[0] + ez * END_DIR[2] > 0) cap = Math.min(cap, 5 + D2 * Math.tan((9 + sstep(7, 21, Math.abs(Math.atan2(ex, ez) / RAD - exitB)) * 44) * RAD));   // the valley over the ring
      for (const EB of BAY_E) { const dx = x - EB[0], dz = z - EB[2], D = Math.hypot(dx, dz), ds = Math.abs(Math.atan2(dx, dz) / RAD - sunBd);
        if (D > 5 && dz > 0 && ds < 22) cap = Math.min(cap, EB[1] + D * Math.tan((5.2 + sstep(13, 22, ds) * 34) * RAD)); }
      return cap;
    };
    let nTall = 0;
    // one tall tree: kind 0 round crown, 1 fan palm, 2 feather palm, 3 drooping stem. H is the top above the foot.
    const tallTree = (x, z, H, kind, o = {}) => {
      const y = Math.max(0, ground(x, z)), r1 = tr(), r2 = tr(), r3 = tr(), n = path.nearestXZ(x, z);
      H = Math.min(H, tallCap(x, z, r3) - y);
      if (H < (o.minH ?? 30)) return null;
      const Rc = kind === 0 ? H * (0.2 + 0.07 * r2) * (o.wide || 1) : kind === 3 ? H * 0.2 : H * 0.28, cy = H - Rc;
      if (near3(x, y + cy, z).d < Rc + 9 || n.dist < 15) return null;
      const gi = o.gi ?? Math.floor(r1 * 22), c = { pivot: [x, y, z], yaw: o.yaw ?? yawTo(x, z, n.u), waveS: (o.waveS ?? n.u) + Math.min(0.04, n.dist / 4000), phase: r1, nod: 0.45 };
      const tw = H * 0.042 + 0.9;
      set.blade('stalk', { ...c, len: kind === 3 ? H * 0.97 : cy + Rc * 0.2, wid: kind === 3 ? tw * 0.7 : tw, a: kind === 3 ? G[Math.max(0, gi - 3)] : trunkA, b: kind === 3 ? G[gi + 6] : trunkB, veins: -1, stripes: kind === 1 || kind === 2 ? 11 : 0, layer: 0 });
      if (kind === 0) {
        const N = o.leaves || 26, wide = gi % 3 === 0;
        set.blade('disc', { ...c, base: [0, cy - Rc * 0.9, 0], len: Rc * 1.8, wid: Rc * 1.8, a: pig[0], b: G[0], veins: -1, layer: 1 });
        for (let i = 0; i < N; i++) {
          const f = (i + 0.5) / N, rr = Rc * 0.86 * Math.sqrt(f), a = i * 2.39996 + r2 * 6.28, sx = Math.sin(a), sy = Math.cos(a);
          let ax = sx * 0.85, ay = sy * 0.85 + 0.62; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
          const len = Rc * (0.68 - 0.14 * f), g2 = Math.min(29, gi + ((i * 7) % 6));
          set.blade(wide ? 'heart' : 'spear', { ...c, base: [sx * rr - ax * len * 0.4, cy + sy * rr - ay * len * 0.4, 0], axis: [ax, ay, 0], len, wid: len * (wide ? 0.62 : 0.4), a: G[g2], b: G[Math.min(39, g2 + 8 + (i % 3))], layer: 2 + (N - i) * 0.25 });
        }
        const nf = o.fruit ?? 4;
        for (let i = 0; i < nf; i++) {                     // oranges (or pale blossom discs) high in the crown
          const a = r1 * 6.28 + i * 2.1, rr = Rc * (0.3 + 0.45 * ((i * 0.37 + r2) % 1)), s = Rc * 0.2;
          set.blade('disc', { ...c, base: [Math.sin(a) * rr, cy + Math.cos(a) * rr - s * 0.5, 0], len: s, wid: s, a: fruitA, b: fruitB, veins: -1, layer: 12 });
        }
      } else if (kind === 1) {                             // fan palm: a half round of ruled blades
        for (let i = 0; i < 6; i++) { const s = (i + 0.5) / 6 * 2 - 1; set.blade('spear', { ...c, base: [0, cy - Rc * 0.1, 0], axis: [Math.sin(s * 1.5), Math.cos(s * 1.5), 0], len: Rc * 1.02, wid: Rc * 0.5, a: pig[0], b: G[1], veins: -1, layer: 1 }); }
        for (let i = 0; i < 15; i++) {
          const s = (i / 14) * 2 - 1, ang = s * 1.95, g2 = Math.min(29, gi + (i % 2) * 5);
          set.blade('sword', { ...c, base: [0, cy, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: Rc * (1 - 0.12 * Math.abs(s)), wid: Rc * 0.2, a: G[g2], b: G[Math.min(39, g2 + 9)], layer: 2 + (i % 2 ? i : 15 - i) * 0.3 });
        }
      } else if (kind === 2) {                             // feather palm: toothed fronds arching out and down
        for (let i = 0; i < 5; i++) {
          const s = (i / 4) * 2 - 1, ang = s * 2.05, g2 = Math.min(29, gi + (i % 3) * 3);
          set.blade('fern', { ...c, base: [0, cy, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: Rc * (1.15 - 0.2 * Math.abs(s)), wid: Rc * 0.36, a: G[g2], b: G[Math.min(39, g2 + 9)], layer: 2 + (i % 2 ? i : 5 - i) * 0.4 });
        }
        for (let i = 0; i < 3; i++) set.blade('disc', { ...c, base: [(i - 1) * Rc * 0.1, cy - Rc * 0.16 - (i % 2) * Rc * 0.05, 0], len: Rc * 0.12, wid: Rc * 0.12, a: fruitA, b: fruitB, veins: -1, layer: 9 });
      } else {                                             // a very tall stem: pairs of long blades that droop
        for (let i = 0; i < 12; i++) {
          const f = i / 11, side = i % 2 ? 1 : -1, ang = side * (2.25 - 1.75 * f * f), by = H * (0.5 + 0.47 * f), len = H * (0.24 - 0.08 * f), g2 = Math.min(29, gi + (i % 4) * 2);
          set.blade('sword', { ...c, base: [0, by, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len, wid: len * 0.17 + 0.3, a: G[g2], b: G[Math.min(39, g2 + 9)], layer: 2 + i * 0.3, stripes: i % 3 ? 0 : 9 });
        }
      }
      nTall++;
      return { x, y, z, H, Rc, top: [x, y + cy, z] };
    };
    const fruitA = pig[5], fruitB = pig[5].clone().lerp(pig[3], 0.6);
    const tallTrees = [];
    {
      const KL = [0, 2, 0, 1, 0, 3, 0, 2, 1, 0];
      // beside the lane: two ranks each side, crowns over the leaf wall, stems that pass the top of the frame
      for (let i = 0; i < 22; i++) {
        const side = i % 2 ? 1 : -1, z = 34 + i * 8.6 + tr() * 5, far = i % 4 > 1, off = far ? 44 + tr() * 26 : 23 + tr() * 12, lx = z < 66 ? 0 : z < 106 ? -1.5 : -3.5;
        const t = tallTree(lx + side * off, z, (far ? 56 : 40) + tr() * 24, far ? KL[(i * 3) % 10] : KL[i % 10], { minH: 26 });
        if (t) tallTrees.push(t);
      }
      for (let i = 0; i < 6; i++) { const side = i % 2 ? -1 : 1, z = 52 + i * 21 + tr() * 6; tallTree((z < 106 ? 0 : -3.5) + side * (17 + tr() * 5), z, 38 + tr() * 16, 3, { minH: 24 }); }
      await ctx.yield();
      // round the pool: four rings standing over the packed shore, every top under the bloom heads
      const RINGS = [[104, 26, 58, 84, 0], [158, 26, 96, 132, 1], [198, 14, 124, 156, 1], [232, 20, 128, 168, 2]];
      for (const [R, n, h0, h1, k] of RINGS) {
        for (let i = 0; i < n; i++) {
          const th = ((i + (k % 2) * 0.5 + (tr() - 0.5) * 0.5) / n) * 6.2832, rr = R + (tr() - 0.5) * R * 0.22, hr = tr();
          const x = POOL.x + Math.sin(th) * rr, z = POOL.z + Math.cos(th) * rr;
          if (inTree(x, z) || bayDist(x, z) < 8 || sightCap(x, z) < 1e8 || path.nearestXZ(x, z).dist < 24) continue;
          const kind = KL[(i * 7 + k * 3) % 10];
          let H = (h0 + (h1 - h0) * hr) * (kind === 3 ? 0.8 : 1) - (k ? Math.max(0, ground(x, z)) * 0.5 : 0);
          // THE LOTUS STAND TALLER THAN THE TREES: round the pool every top stays under the bloom heads, as seen from the
          // reveal and from bloom height (the packed shore's own leaf line, plus 6 m)
          H = Math.min(H, 59 + (rBloom(x, z) - 92) * 0.27 + 6 - Math.max(0, ground(x, z)));
          const t = tallTree(x, z, H, kind, { yaw: z > 215 ? Math.atan2(BL[0] - x, BL[1] - z) : undefined, waveS: z > 215 ? 0.3 + 0.2 * (rr / 330) : undefined, leaves: k === 2 ? 22 : 26, minH: 34, fruit: k === 2 ? 3 : 5, wide: 1 + 0.12 * k });
          if (t) tallTrees.push(t);
        }
        await ctx.yield();
      }
      // both banks of the bay and behind the ring
      for (let i = 0; i < 26; i++) {
        const u = 0.72 + (i / 26) * 0.3, p = at(Math.min(1, u)), s = portAt(Math.min(1, u)), side = i % 2 ? 1 : -1, far = i % 4 > 1, off = side * ((far ? 74 : 50) + tr() * 22), ext = Math.max(0, u - 1) * 520;
        const x = p[0] + s[0] * off + END_DIR[0] * ext, z = p[2] + s[2] * off + END_DIR[2] * ext;
        if (inTree(x, z) || bayDist(x, z) < 6 || poolDist(x, z) < 6) { tr(); continue; }
        const t = tallTree(x, z, (far ? 62 : 44) + tr() * 26, KL[(i * 3 + 1) % 10], { minH: 28 });
        if (t) tallTrees.push(t);
      }
      for (let i = 0; i < 12; i++) {
        const lat = (i % 2 ? 1 : -1) * (18 + Math.floor(i / 2) * 17 + tr() * 8), fwd = 55 + ((i * 5) % 7) * 16 + tr() * 10;
        const x = END[0] + END_DIR[0] * fwd + END_DIR[2] * lat, z = END[2] + END_DIR[2] * fwd - END_DIR[0] * lat;
        tallTree(x, z, 44 + tr() * 40 + fwd * 0.2, KL[(i * 3 + 2) % 10], { yaw: exitYaw, minH: 22, waveS: 1 });
      }
      await ctx.yield();
    }
    // ---- the troop at the ranks (u 0.16): his monkeys with their oranges, seated in the forks of the flats that
    // stand across the lane, at eye level; they are painted on the flat and swing aside with it like scenery ----
    {
      const seat = (c, ox, oy, k, dark, ph, sp) => {
        const A = dark ? pig[0].clone().lerp(pig[1], 0.15) : pig[5].clone().lerp(pig[0], 0.66), B = dark ? pig[1].clone().lerp(pig[2], 0.2) : pig[5].clone().lerp(pig[0], 0.3), wh = white.clone().lerp(pale, 0.25);
        const part = (shape, bx, by, ang, len, wid, layer, a = A, b = B, more = {}) =>
          set.blade(shape, { ...c, base: [ox + bx * k, oy + by * k, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: len * k, wid: wid * k, layer, a, b, veins: -1, ...more });
        part('sword', 0.3, 0.3, 2.0, 1.5, 0.17, 20);
        part('spear', -0.2, 0.42, -2.0, 0.95, 0.34, 21); part('spear', 0.2, 0.42, 2.0, 0.95, 0.34, 21);
        part('paddle', 0, 0.05, 0, 1.5, 0.95, 22);
        part('disc', 0, 0.42, 0, 0.6, 0.5, 23, B, pig[5].clone().lerp(pig[3], 0.35));
        part('sword', -0.36, 1.3, -2.55, 0.95, 0.24, 24);
        part('sword', 0.36, 1.3, 1.25, 0.95, 0.24, 24, A, B, { anim: [0.55, 0, sp, ph] });
        part('disc', 0, 1.22, 0, 1.2, 1.2, 25, pale, wh);
        part('disc', -0.44, 1.86, 0, 0.3, 0.3, 26); part('disc', 0.44, 1.86, 0, 0.3, 0.3, 26);
        part('disc', 0, 1.4, 0, 0.86, 0.82, 27);
        part('disc', 0, 1.42, 0, 0.36, 0.44, 28, pale, wh);
        for (const s of [-1, 1]) { part('disc', s * 0.19, 1.8, 0, 0.27, 0.27, 29, pig[2], pig[3]); part('disc', s * 0.19, 1.875, 0, 0.12, 0.12, 30, pig[0], pig[0]); }
        part('disc', 1.3, 1.45, 0, 0.62, 0.62, 31, pig[5], pig[5].clone().lerp(pig[3], 0.55), { anim: [0, 1.5 * k, sp, ph] });
        part('disc', -1.5, 0.5, 0, 0.7, 0.7, 19, pig[5], pig[5].clone().lerp(pig[3], 0.6));          // and one orange kept beside it
      };
      for (const s of rankSeats) {
        const pick = s.r === 1 ? [0.0, 0.47, 1.75] : s.r === 2 && s.side > 0 ? [0.5, 0.6, 1.45] : s.r === 3 && s.side < 0 ? [-0.6, 0.62, 1.5] : null;
        if (!pick) continue;
        const c = { pivot: [s.x, s.y, s.z], yaw: s.yaw, waveS: s.waveS, phase: 0.5, swing: s.swing, nod: 1 };
        seat(c, pick[0] * s.side, s.h * pick[1], pick[2], s.r === 2, 0.2 + s.r * 0.23 + (s.side > 0 ? 0.4 : 0), 1.6 + s.r * 0.15);
      }
    }
    // ---- lianas: long ruled curves hung from crown to crown ----
    {
      let nl = 0;
      for (let i = 0; i + 1 < tallTrees.length && nl < 16; i++) {
        const A0 = tallTrees[i], B0 = tallTrees[i + 1 + (i % 2 && i + 2 < tallTrees.length ? 1 : 0)], d = Math.hypot(A0.x - B0.x, A0.z - B0.z);
        if (d < 22 || d > 95) continue;
        const a = [A0.top[0], A0.top[1] - A0.Rc * 0.5, A0.top[2]], b = [B0.top[0], B0.top[1] - B0.Rc * 0.5, B0.top[2]], sag = d * (0.3 + 0.2 * tr()), NSG = 9, gi = 2 + (i % 5) * 2;
        const pt = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - sag * 4 * f * (1 - f), a[2] + (b[2] - a[2]) * f];
        let ok = true;
        for (let q = 1; q < NSG && ok; q++) { const p = pt(q / NSG); if (near3(p[0], p[1], p[2]).d < 9 || p[1] < Math.max(0, ground(p[0], p[2])) + 6) ok = false; }
        if (!ok) continue;
        for (let q = 0; q < NSG; q++) {
          const p = pt(q / NSG), p2 = pt((q + 1) / NSG), dx = p2[0] - p[0], dy = p2[1] - p[1], dz = p2[2] - p[2], len = Math.hypot(dx, dy, dz);
          set.blade('stalk', { pivot: p, limit: 0, waveS: 0.3, nod: 0, mode: 1, axis: [dx / len, dy / len, dz / len], len: len * 1.04, wid: 0.75 + d * 0.012, a: G[gi], b: G[gi + 10], veins: -1, layer: 1 });
        }
        nl++;
      }
    }
    await ctx.yield();
    // ---- tall blossom spikes, white and pink, standing over the leaves (his foxglove candles) ----
    const spike = (x, z, h, pink, o = {}) => {
      const y = Math.max(0, ground(x, z)), n = path.nearestXZ(x, z);
      if (n.dist < 12 || y + h > tallCap(x, z, 0.5) + 6) return;
      const c = { pivot: [x, y, z], yaw: o.yaw ?? yawTo(x, z, n.u), waveS: n.u, phase: tr(), nod: 0.7 }, a = pink ? rose.clone().lerp(pig[5], 0.18) : pale.clone().lerp(white, 0.3), b = pink ? rose.clone().lerp(white, 0.5) : white.clone();
      set.blade('stalk', { ...c, len: h * 0.62, wid: h * 0.03 + 0.2, a: G[4], b: G[14], veins: -1 });
      for (let i = 0; i < 2; i++) set.blade('paddle', { ...c, base: [0, h * 0.12, 0], axis: [Math.sin(i ? 0.9 : -0.9), Math.cos(0.9), 0], len: h * 0.34, wid: h * 0.13, a: G[6 + i * 3], b: G[17 + i * 3], veins: 12, layer: 1 });
      for (let i = 0; i < 12; i++) {
        const r = Math.floor(i / 2), side = i % 2 ? 1 : -1, ang = side * (0.62 - 0.07 * r), by = h * (0.46 + 0.09 * r), len = h * (0.2 - 0.016 * r);
        set.blade('spear', { ...c, base: [0, by, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len, wid: len * 0.42, a, b, tip: 0.5, layer: 2 + r });
      }
    };
    // a lotus bud on its stalk with one paddle leaf (the phase is given, so no draw is taken here)
    const budAt = (x, z, h, pl, u, ph) => {
      const c = { pivot: [x, 0, z], yaw: yawTo(x, z, u), waveS: u, phase: ph, nod: 0.6 }, L = h * 0.3;
      const pa = pl ? pale.clone().lerp(pig[1], 0.16) : rose.clone().lerp(pig[5], 0.2), pb = pl ? pale.clone().lerp(white, 0.6) : rose.clone().lerp(white, 0.5);
      set.blade('stalk', { ...c, len: h * 0.74, wid: h * 0.03 + 0.25, a: G[5], b: G[17], veins: -1 });
      set.blade('paddle', { ...c, base: [0, h * 0.2, 0], axis: [Math.sin(1.0), Math.cos(1.0), 0], len: h * 0.3, wid: h * 0.12, a: G[8], b: G[18], veins: 12, layer: 1 });
      for (const [ang, k, layer] of [[-0.44, 0.8, 2], [0.44, 0.8, 2], [-0.21, 0.95, 3], [0.21, 0.95, 3], [0, 1, 4]])
        set.blade('spear', { ...c, base: [0, h * 0.7, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len: L * k, wid: L * 0.4, a: pa, b: pb, tip: 0.5, layer });
      for (const sd of [-1, 1]) set.blade('spear', { ...c, base: [0, h * 0.7, 0], axis: [Math.sin(sd * 0.8), Math.cos(0.8), 0], len: L * 0.42, wid: L * 0.22, a: G[1], b: G[10], layer: 5 });
    };
    // ---- THE WATER'S EDGE: reeds, arum leaves and overhanging fronds all round the pool and the bay, some standing in
    // the water, so the water is seen through and under plants and never as a bare rim ----
    {
      const er = rng.fork ? rng.fork('edge') : rng, RK = ['sword', 'heart', 'sword', 'fern', 'heart', 'sword', 'paddle'], OFF = [-3.2, 0.8, -1.4, 2.6, -0.4, 3.4, -2.4];
      const edge = (x, z, i, yaw) => {
        const kind = RK[i % 7], r = er(), n = path.nearestXZ(x, z);
        let h = kind === 'sword' ? 4.5 + r * 4.5 : kind === 'fern' ? 7 + r * 5 : 6.5 + r * 6;
        if (n.dist < 22) h = Math.min(h, 3.2 + n.dist * 0.26);
        putPlant(x, z, kind, h, { rng: er, yaw, minH: 3, gi: kind === 'sword' ? 4 + Math.floor(r * 14) : Math.floor(r * 24), dark: 1, count: kind === 'fern' ? 2 : kind === 'sword' ? 6 : kind === 'heart' ? 6 : 5 });
      };
      const NP = Math.round(104 * detail);
      for (let i = 0; i < NP; i++) {
        const th = ((i + er() * 0.5) / NP) * 6.2832, rr = POOL.r + OFF[i % 7] * 1.3, x = POOL.x + Math.sin(th) * rr, z = POOL.z + Math.cos(th) * rr;
        if (bayDist(x, z) < 1 || inTree(x, z)) { er(); continue; }
        edge(x, z, i, Math.atan2(BL[0] - x, BL[1] - z));
        if (i % 20 === 19) await ctx.yield();
      }
      const NB = Math.round(90 * detail);
      for (let i = 0; i < NB; i++) {
        const th = ((i + er() * 0.5) / NB) * 6.2832, k = 1 + (OFF[(i * 3) % 7] * 1.2) / BAY.rx, x = BAY.x + Math.sin(th) * BAY.rx * k, z = BAY.z + Math.cos(th) * BAY.rz * (1 + (OFF[(i * 3) % 7] * 1.2) / BAY.rz);
        if (poolDist(x, z) < 1 || inTree(x, z) || nearEnd(x, z)) { er(); continue; }
        edge(x, z, i + 3, undefined);
        if (i % 20 === 19) await ctx.yield();
      }
      // more pads, and small lotus standing in both waters
      for (let i = 0; i < 44; i++) {
        const inBay = i % 2 === 1, a = er() * 6.2832, r = 0.55 + 0.4 * Math.sqrt(er()), size = 4 + er() * 3.5, dir = er() * 6.2832, gi = 8 + Math.floor(er() * 12), ph = er();
        const x = inBay ? BAY.x + Math.cos(a) * r * BAY.rx : POOL.x + Math.cos(a) * r * POOL.r, z = inBay ? BAY.z + Math.sin(a) * r * BAY.rz : POOL.z + Math.sin(a) * r * POOL.r;
        if (Math.min(-poolDist(x, z), 1e9) < size * 0.6 && -bayDist(x, z) < size * 0.6) continue;
        if (A.blooms.some((bl) => { const f = W(bl.foot); return Math.hypot(f[0] - x, f[2] - z) < size * 0.5 + 2; }) || Math.hypot(x - bird[0], z - bird[2]) < size) continue;
        const pq = inBay ? offLadder(x, z, size * 0.5) : [x, z];
        if (!pq || (inBay && bayDist(pq[0], pq[1]) > -size * 0.6)) continue;
        set.blade('pad', { pivot: [pq[0], 0.06, pq[1]], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[gi], b: G[gi + 12], layer: 2 + (i % 3), phase: ph });
      }
      for (const [x, z, hh, R, pl] of [[-52, 232, 9, 3.6, false], [44, 236, 10.5, 4, true], [58, 262, 9, 3.6, false], [-58, 262, 10, 3.8, true], [30, 216, 8, 3.2, false], [-36, 214, 8.5, 3.3, true], [-118, 372, 8, 3.2, true], [-72, 432, 9, 3.4, false], [-122, 426, 8.5, 3.3, false]]) {
        if (path.nearestXZ(x, z).dist < 11 && near3(x, hh, z).d < 11) continue;
        jnsLotus(set, er, { foot: [x + 0.6, 0, z + 0.4], heart: [x, hh, z], R, pale: pl, waveS: path.nearestXZ(x, z).u, waveTop: path.nearestXZ(x, z).u, reach: 2.6, thick: 0.75, lite: z < 300 });   // the pool's are seen from 40 m and more: lite
      }
      // THE FLAMINGOS OF THE BAY: four rose birds in pure profile, one before the islet's starboard end (seen from u 0.74
      // to 0.83), three toward the far bank; the stepping one stands near us on the last straight
      [[-80.8, 393.8, 1.6, 1], [-74, 447, 1.9, -1], [-88.5, 440, 2.1, 1], [-124, 404, 1.6, -1]].forEach(([x, z, k, mir], i) => flamingo([x, 0, z], k, yawTo(x, z, 0.86), 3.2, 0.9 + i * 0.01, (i * 0.31 + 0.1) % 1, mir));
      // between the birds: small lotus in flower and in bud, each with a pad, a reed and an arum leaf at its foot,
      // in the near water under the reveal, before the far shore, and by the bay's far bank
      const bud = (x, z, h, pl, u) => budAt(x, z, h, pl, u, er());
      // [x, z, height, R (0 = a bud), pale]
      const SM = [[31, 224, 13.5, 4.9, false], [26, 230, 16, 0, true], [-21, 226, 14, 4.8, false], [-12, 221, 11, 0, true], [-44, 236, 15, 0, false],
        [-33, 318, 17, 0, false], [-41, 311, 13, 0, true], [-64, 444, 12, 4.2, false], [-94, 446, 9, 0, true], [-67, 452, 8, 0, false], [-117, 398, 9.5, 0, true], [-112, 388, 9, 0, false],
        // in flower in the near water, low under the sight line of the reveal (u 0.25), and one beside the islet (u 0.79 to 0.85)
        [-2, 205, 10.5, 5, false], [28, 208, 12, 4.8, true], [-19, 207, 9.5, 4.6, false]];   // the first of each row stands to port of the disc's ladder as the reveal has it, not on it
      const feet2 = A.blooms.map((bl) => W(bl.foot));
      SM.forEach(([x0, z, hh, R, pl], i) => {
        let x = x0;
        for (let q = 0; q < 4 && feet2.some((f) => Math.hypot(f[0] - x, f[2] - z) < 7); q++) x += 7;
        const n = path.nearestXZ(x, z);
        if (n.dist < 11 && near3(x, hh, z).d < 11) return;
        if (R) jnsLotus(set, er, { foot: [x + 0.6, 0, z + 0.4], heart: [x, hh, z], R, pale: pl, waveS: n.u, waveTop: n.u, reach: 3.4, thick: 0.9, lite: z < 300 || z > 420 });   // only the one beside the islet is passed close
        else bud(x, z, hh, pl, n.u);
        const size = 4.5 + (i % 3), yaw = z < 360 ? Math.atan2(BL[0] - x, BL[1] - z) : undefined;
        const pq = z > 360 ? offLadder(x + 4.5, z - 3, size * 0.5) : [x + 4.5, z - 3];
        if (pq) set.blade('pad', { pivot: [pq[0], 0.06, pq[1]], limit: 0, nod: 0, mode: 2, base: [-size * 0.5, 0, 0], axis: [1, 0, 0], len: size, wid: size, a: G[9 + i], b: G[21 + i], layer: 2 + (i % 3), phase: i * 0.17 });
        // a reed or an arum leaf at its foot (in the bay, on whichever side of it is clear of the disc's ladder)
        const ex = z > 360 ? ([x - 3.5, x + 5, x - 10].find((q) => { const c = offLadder(q, z + 1.5, 3); return c && c[0] === q; }) ?? x + 5) : x - 3.5;
        edge(ex, z + 1.5, i % 2 ? 1 : 0, yaw);
      });
    }
    await ctx.yield();
    // ---- THE ISLET (u 0.79): a reed islet in the bay under the disc. Nobody is here. On its hummock stands one tall
    // green-black paddle plant, and in its fork sits a big dark ruffed monkey, its ruffed head touching the port edge of the red
    // round at u 0.79 (the disc shows whole beside it, and stands clear of the islet from there to the ring), its orange beside it;
    // one great rose lotus stands low in the water under the disc.
    // All flat cut shapes, always square to the lens. ----
    {
      const cr2 = rng.fork ? rng.fork('charmer') : rng;
      const ID = 50, IS = [E79[0] + Math.sin(sunB) * ID, E79[2] + Math.cos(sunB) * ID], iu = 0.86, dk = pig[0], dk2 = pig[0].clone().lerp(pig[1], 0.3);
      const bx = -Math.cos(sunB), bz = Math.sin(sunB);                       // across the eye's line (toward screen right)
      const P3 = (lat, y, fwd) => [IS[0] + bx * lat + Math.sin(sunB) * fwd, y, IS[1] + bz * lat + Math.cos(sunB) * fwd];
      // the islet: a dark hummock and a thicket of reeds and arum leaves on it, lower toward the eye
      const hc = { pivot: P3(0, -2.5, 1.5), limit: 3.2, waveS: iu, nod: 0, veins: -1 };
      set.blade('disc', { ...hc, len: 10.6, wid: 17, a: dk, b: dk, layer: 0 });
      const IK = ['sword', 'heart', 'sword', 'fern', 'heart', 'sword'];
      for (let i = 0; i < 16; i++) {
        const lat = (i - 7.5) * 1.45 + (cr2() - 0.5), fwd = -1.5 - (i % 3) * 1.6, p = P3(lat, 0, fwd), kind = IK[i % 6], near = Math.abs(lat) < 3.2;
        set.plant(cr2, { x: p[0], y: 0, z: p[2], yaw: Math.atan2(E79[0] - p[0], E79[2] - p[2]), h: (near ? 7.6 : Math.abs(lat) < 8 ? 8.2 + cr2() * 1.2 : 8.5 + cr2() * 2.5) * (kind === 'sword' ? 0.94 : 1), kind, gi: 2 + ((i * 5) % 19), waveS: iu, dark: 0, count: kind === 'fern' ? 3 : kind === 'sword' ? 7 : undefined });
      }
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, p = P3(Math.cos(a) * (11 + i), 0.06, Math.sin(a) * 7 - 6), size = 4.5 + (i % 3), q = offLadder(p[0], p[2], size * 0.5); if (!q) continue; set.blade('pad', { pivot: [q[0], 0.06, q[1]], limit: 0, nod: 0, mode: 2, base: [-size * 0.5, 0, 0], axis: [1, 0, 0], len: size, wid: size, a: G[10 + i * 2], b: G[22 + i * 2], layer: 2 + (i % 3), phase: i * 0.19 }); }
      // the paddle plant: a stalk and six green-black paddles fanned low and wide, the middle left open for the monkey.
      // The monkey is built large (scale is wrong by rule) and seated so that from the eye at u 0.79 its ruffed head
      // stands at the port edge of the red round and the round itself is left open (as we pass, the plant slides away to port of it).
      const MK = 11, mk8 = MK / 2.4, top = E79[1] + ID * Math.tan(sunE), seatY = top - 1.4 * mk8, pp = P3(-9.5, 0, 0), yawI = Math.atan2(E79[0] - pp[0], E79[2] - pp[2]);
      const c = { pivot: pp, yaw: yawI, limit: 3.2, waveS: iu, phase: 0.3, nod: 0.25 };
      set.blade('stalk', { ...c, len: seatY + 0.6, wid: 1.5, a: dk, b: dk2, veins: -1, layer: 40 });
      for (let i = 0; i < 6; i++) {
        const sd = i % 2 ? 1 : -1, r = Math.floor(i / 2), ang = sd * (0.88 + r * 0.26), len = 16 - r * 1.4;
        set.blade('paddle', { ...c, base: [0, seatY - 4.6 + r * 0.5, 0], axis: [Math.sin(ang), Math.cos(ang), 0], len, wid: len * 0.4, a: dk, b: r === 1 ? G[2] : dk2, veins: 12, layer: 41 + r });
      }
      jnsMonkey(set, cr2, { x: pp[0], y: seatY, z: pp[2], yaw: yawI, waveS: iu }, { size: MK, dark: true, nod: 0.25 });
      // before the islet, under the disc, one great lotus in flower on a jointed stalk (rose, white tipped), low enough to leave the round open; and two buds
      { const lp = P3(-1, 0, -4), lr = rng.fork ? rng.fork('islet-lotus') : cr2;
        jnsLotus(set, lr, { foot: [lp[0] + 0.8, 0, lp[2] + 0.5], heart: [lp[0], 9.5, lp[2]], R: 5.6, pale: false, waveS: iu, waveTop: iu, reach: 3.6, thick: 1.3 });
        for (const [bp, bh, bpl, bph] of [[P3(5.5, 0, 0.5), 11, false, 0.2], [P3(3.5, 0, -8), 8.5, true, 0.7]]) budAt(bp[0], bp[2], bh, bpl, iu, bph); }
      // pads on the water beside the disc's ladder of bars (to starboard of it, never on it), laid at even steps along the bay
      let np = 0;
      for (const ue of [0.77, 0.8, 0.83, 0.86, 0.89, 0.92]) for (const [D, lat] of (np % 4 < 2 ? [[11, -2.5], [28, -4]] : [[19, 3.5], [38, 2]])) {
        const e = at(ue), size = 4.2 + ((np * 3) % 4) * 0.8, dir = np * 1.9, q = offLadder(e[0] + Math.sin(sunB) * D + bx * lat, e[2] + Math.cos(sunB) * D + bz * lat, size * 0.5);
        np++;
        if (!q) continue;
        const x = q[0], z = q[1];
        if (bayDist(x, z) > -size * 0.7 || Math.hypot(x - bird[0], z - bird[2]) < size + 1 || Math.hypot(x - IS[0], z - IS[1]) < 12) continue;
        set.blade('pad', { pivot: [x, 0.055, z], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[9 + (np % 10)], b: G[21 + (np % 10)], layer: 2 + (np % 3), phase: np * 0.13 });
      }
    }
    await ctx.yield();
    // ---- THE POND IS FULL: more pads 8 m across with ruled ripples round them on the near water of both ponds (under the
    // reveal, and under the eye from the islet to the ring), and small lotus in flower and in bud, rose and pale mixed,
    // standing low in it, clear of the disc's ladder of bars. ----
    {
      const pr2 = rng.fork ? rng.fork('pond') : rng, feet3 = A.blooms.map((bl) => W(bl.foot));
      const pm = hero.object.getObjectByName('pool'), bm = scene.getObjectByName('bay');
      let np = 0, slotP = 16, slotB = 13;       // of the 24 ruled rings each water has, these are given to the new pads
      const pad8 = (x, z, size) => {
        const dir = np * 2.3 + 0.7, ph = (np * 0.21) % 1; np++;
        set.blade('pad', { pivot: [x, 0.065, z], limit: 0, nod: 0, mode: 2, base: [-Math.sin(dir) * size * 0.5, 0, -Math.cos(dir) * size * 0.5], axis: [Math.sin(dir), 0, Math.cos(dir)], len: size, wid: size, a: G[9 + ((np * 3) % 11)], b: G[21 + ((np * 3) % 11)], layer: 2 + (np % 3), phase: ph });
        return ph;
      };
      const ring = (mesh, slot, x, z, ph) => { if (!mesh || slot > 23) return; const un = mesh.material.uniforms; un.uC.value[slot].set(x, z, ph); un.uN.value = Math.max(un.uN.value, slot + 1); };
      const small = (x, z, hh, R, pl, u, lite) => {      // a small lotus in flower (R) or in bud (R 0)
        if (R) jnsLotus(set, pr2, { foot: [x + 0.5, 0, z + 0.3], heart: [x, hh, z], R, pale: pl, waveS: u, waveTop: u, reach: 2.4, thick: 0.7, lite });
        else budAt(x, z, hh, pl, u, Math.abs(x * 0.37 + z * 0.11) % 1);
      };
      // the near water of the pool, under the reveal (u 0.25)
      for (const [x0, z, size] of [[-10, 200, 8], [9, 199.5, 7.6], [27, 205, 8.2], [-29, 206, 7.8], [5, 214, 8.4], [-33, 219, 8], [35, 217, 7.6], [-4, 231, 8.2]]) {
        let x = x0;
        for (let q = 0; q < 3 && feet3.some((f) => Math.hypot(f[0] - x, f[2] - z) < size * 0.5 + 2.5); q++) x += 7;
        if (poolDist(x, z) > -size * 0.5) continue;
        ring(pm, slotP++, -x, 270 - z, pad8(x, z, size));       // the pool's rings are ruled in the hero's own space
      }
      for (const [x, z, hh, R, pl] of [[-27, 213, 10, 0, false], [31, 212, 9, 0, true], [40, 230, 10, 4.2, false]]) small(x, z, hh, R, pl, uPool, true);
      // the bay, from the islet to the ring: [u, metres to port of the route, size]
      for (const [u, off, size] of [[0.8, 8, 8], [0.81, -7, 7.6], [0.822, 12, 8.2], [0.835, 5.5, 7.8], [0.85, 14.5, 8.4], [0.862, -10, 8], [0.875, 11.5, 7.6], [0.89, -8.5, 8.2], [0.905, 13, 8], [0.92, -11, 7.8], [0.93, 9, 8.2]]) {
        const p = at(u), s = portAt(u), q = offLadder(p[0] + s[0] * off, p[2] + s[2] * off, size * 0.5);
        if (!q) continue;
        const x = q[0], z = q[1];
        if (bayDist(x, z) > -size * 0.55 || Math.hypot(x - bird[0], z - bird[2]) < size * 0.5 + 2 || Math.hypot(x - E79[0] - Math.sin(sunB) * 50, z - E79[2] - Math.cos(sunB) * 50) < 13) continue;
        ring(bm, slotB++, x, z, pad8(x, z, size));
      }
      // [u, metres to port, height, R (0 = a bud), pale]
      for (const [u, off, hh, R, pl] of [[0.855, -15.5, 6.5, 3.6, false], [0.87, 17, 7, 0, true], [0.885, -15, 6, 0, false], [0.915, 16.5, 7.5, 3.8, true], [0.935, -14, 6.5, 0, true], [0.955, 13.5, 6, 0, false]]) {
        const p = at(u), s = portAt(u), x = p[0] + s[0] * off, z = p[2] + s[2] * off;
        if (bayDist(x, z) > -2.5 || nearEnd(x, z) || Math.hypot(x - bird[0], z - bird[2]) < 6) continue;
        small(x, z, hh, R, pl, u, true);
      }
    }
    await ctx.yield();
    // ---- THE SKYLINE STANDS ON THE SKY (u 0.20 to 0.52). No tree is raised: what breaks the level leaf wall is what the
    // brief puts on the sky. Lotus heads and buds on tall jointed stalks behind the wall (taller than every tree), torch
    // flowers over the leaves, and near the lens at the frame's sides single paddle blades on bare stalks that the top
    // edge crops. Each keeps clear of the disc as seen from the lane, the reveal and the bloom. ----
    {
      const sr = rng.fork ? rng.fork('skyline') : rng;
      const gy = (x, z) => Math.max(0, ground(x, z));
      // THE BIRDS OF THE SKYLINE PERCH (none flies, none crosses the disc): a white or a green-black bird in pure profile,
      // s metres long, a flat of eight cut pieces standing on a tip that stands on the sky; it lifts one stiff wing as a
      // toy does. c is the perch's own hinge (the bird nods with what it stands on), bx, by its feet in that plane.
      const perch = (c, bx, by, s, wh, mir, wph) => {
        const a = wh ? pale.clone().lerp(white, 0.35) : pig[0].clone(), b = wh ? white.clone() : pig[0].clone().lerp(pig[1], 0.6), w2 = wh ? pale.clone().lerp(pig[1], 0.14) : pig[0].clone().lerp(pig[1], 0.3);
        const bill = pig[5].clone().lerp(pig[3], 0.45), eye = wh ? pig[0] : pig[3];
        const part = (shape, x, y, ang, len, wid, layer, ca = a, cb = b, more = {}) =>
          set.blade(shape, { ...c, base: [bx + mir * x * s, by + y * s, 0], axis: [mir * Math.sin(ang), Math.cos(ang), 0], len: len * s, wid: wid * s, a: ca, b: cb, veins: -1, layer: 60 + layer, ...more });
        part('stalk', -0.06, 0, 0.04, 0.42, 0.05, 0, pig[0], pig[0]); part('stalk', 0.1, 0, -0.04, 0.42, 0.05, 0, pig[0], pig[0]);   // two stiff legs
        part('spear', 0.3, 0.56, 1.95, 0.62, 0.22, 1);                                          // tail
        part('paddle', 0.42, 0.42, -1.22, 0.95, 0.5, 2);                                        // body
        part('spear', -0.18, 0.74, 1.8, 0.66, 0.28, 3, w2, b, { anim: [0.3, 0, -21, wph] });    // the wing it lifts, keyed to u (about three lifts a flight; still in the portal picture)
        part('disc', -0.5, 0.72, 0, 0.32, 0.32, 4);                                             // head
        part('spear', -0.6, 0.93, -1.8, 0.34, 0.12, 5, bill, bill);                             // bill
        part('disc', -0.52, 0.86, 0, 0.07, 0.07, 6, eye, eye);
      };
      // a bud on a tall jointed stalk: ruled joints, two paddle leaves, five shut petals let down to white at the tip.
      // birds: [white, mirror, size, twig] each: a bird on the bud's tip, or (twig: its lean, radians) on a bare twig beside it
      const skyBud = (x, z, top, L, pl, u, gi, birds = []) => {
        const y0 = gy(x, z), nJ = 6, H = top - L - y0, ph = (x * 0.013 + z * 0.007 + 10) % 1, w0 = 1.5 + L * 0.06;
        for (let i = 0; i < nJ; i++) {
          const zg = (q) => (q === 0 || q === nJ ? 0 : (q % 2 ? 1 : -1) * 0.8), a = [x + zg(i), y0 + (H * i) / nJ, z], b = [x + zg(i + 1), y0 + (H * (i + 1)) / nJ, z];
          const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), w = w0 * (1 - 0.35 * (i / nJ)), c = { pivot: a, limit: 0, waveS: u, phase: ph, nod: 0, mode: 1, axis: [dx / len, dy / len, 0] };
          set.blade('stalk', { ...c, len, wid: w, a: G[gi - 4], b: G[gi + 12], layer: 1 });
          if (i > 0) set.blade('stalk', { ...c, base: [0, -0.3, 0], len: 0.8, wid: w * 1.25, a: G[Math.max(0, gi - 7)], b: G[gi + 3], layer: 2, veins: -1 });
          if (i === 3 || i === 5) { const sd = i === 3 ? 1 : -1, PL = L * 0.9; set.blade('paddle', { pivot: a, yaw: yawTo(x, z, u), limit: 0.87, waveS: u, phase: ph, nod: 0.6, base: [0, 0, 0], axis: [Math.sin(sd * 1.0), Math.cos(1.0), 0], len: PL, wid: PL * 0.38, a: G[gi], b: G[gi + 9], layer: 3, veins: 14 }); }
        }
        const c = { pivot: [x, top - L, z], limit: 3.2, waveS: u, phase: ph, nod: 0.5 };
        const pa = pl ? pale.clone().lerp(pig[1], 0.16) : rose.clone().lerp(pig[5], 0.2), pb = pl ? pale.clone().lerp(white, 0.6) : rose.clone().lerp(white, 0.5);
        for (const [ang, k, layer] of [[-0.44, 0.8, 2], [0.44, 0.8, 2], [-0.21, 0.95, 3], [0.21, 0.95, 3], [0, 1, 4]])
          set.blade('spear', { ...c, axis: [Math.sin(ang), Math.cos(ang), 0], len: L * k, wid: L * 0.4, a: pa, b: pb, tip: 0.5, layer });
        for (const sd of [-1, 1]) set.blade('spear', { ...c, axis: [Math.sin(sd * 0.8), Math.cos(0.8), 0], len: L * 0.42, wid: L * 0.22, a: G[1], b: G[10], layer: 5 });
        birds.forEach(([wh, mir, bs, twig], i) => {
          if (!twig) return perch(c, 0, L * 0.97, bs, wh, mir, ph + i * 0.3);
          set.blade('stalk', { ...c, axis: [Math.sin(twig), Math.cos(twig), 0], len: L * 1.05, wid: 0.45 + L * 0.02, a: G[gi - 4], b: G[gi + 8], veins: -1, layer: 1 });
          perch(c, Math.sin(twig) * L * 1.03, Math.cos(twig) * L * 1.03, bs, wh, mir, ph + i * 0.3);
        });
      };
      // a torch flower F metres long held over the leaves on a bare stalk
      const skyTorch = (x, z, top, F, u, bird) => {
        const y0 = gy(x, z), yf = top - F * 1.1;
        set.blade('stalk', { pivot: [x, y0, z], limit: 0, waveS: u, nod: 0, mode: 1, axis: [0, 1, 0], len: yf - y0 + F * 0.1, wid: 0.9 + F * 0.03, a: G[4], b: G[14], veins: -1, layer: 0 });
        set.plant(sr, { x, y: yf, z, yaw: yawTo(x, z, u), h: F, kind: 'torch', waveS: u, nod: 0.6 });
        if (bird) perch({ pivot: [x, top - F * 0.06, z], limit: 3.2, waveS: u, phase: 0.5, nod: 0 }, 0, 0, bird[2], bird[0], bird[1], x * 0.01);
      };
      // one great paddle blade on a bare stalk beside the lens: it turns about its own rib to stay square to us
      const nearBlade = (x, z, top, L, lean, gi, u) => {
        const y0 = gy(x, z), by = top - L * Math.cos(lean), ph = (x * 0.05 + z * 0.02 + 10) % 1, c = { pivot: [x, y0, z], yaw: yawTo(x, z, u), limit: 0, waveS: u, phase: ph, nod: 0.5, mode: 1 };
        set.blade('stalk', { ...c, axis: [0, 1, 0], len: by - y0 + 1, wid: 0.75 + L * 0.02, a: G[Math.max(0, gi - 4)], b: G[gi + 6], veins: -1, layer: 0 });
        set.blade('paddle', { ...c, base: [0, by - y0, 0], axis: [Math.sin(lean), Math.cos(lean), 0], len: L, wid: L * 0.4, a: G[gi], b: G[gi + 9], veins: 14, layer: 2 });
      };
      // to port of the pool (the left of the reveal; dead ahead from the bloom), then to starboard and beyond the far shore
      jnsLotus(set, sr, { foot: [88, gy(88, 237), 237], heart: [86, 79, 236], R: 9.5, pale: true, waveS: 0.4, waveTop: 0.42, reach: 7, thick: 2, lite: true });
      skyBud(118, 318, 98, 11, false, 0.44, 12, [[0, 1, 11]]); skyBud(112, 290, 90, 10, true, 0.43, 9, [[1, -1, 12], [1, 1, 11, -1.1]]);   // its twig leans to port, away from the disc
      skyTorch(110, 226, 86, 26, 0.45, [1, 1, 12]); skyTorch(97, 268, 68.5, 24, 0.42); skyTorch(189, 407, 108, 34, 0.46, [0, -1, 17]);   // far to port: from the lane it stands 11 degrees clear of the disc
      jnsLotus(set, sr, { foot: [-78, gy(-78, 273), 273], heart: [-76, 79.5, 272], R: 9, pale: false, waveS: 0.33, waveTop: 0.36, reach: 6, thick: 2, lite: true });
      skyBud(-48.2, 360.3, 86.6, 11, true, 0.4, 10, [[1, 1, 13], [0, -1, 12, -1.1]]); skyBud(-80.6, 242, 68, 9, false, 0.3, 13, [[0, 1, 11], [1, -1, 10, 1.1]]);
      skyTorch(-92, 262, 68, 24, 0.32, [1, -1, 11]); skyTorch(-19.2, 374.4, 74.8, 30, 0.42, [0, 1, 13]);
      // beside the lens, cropped by the top edge: at the last rank (u 0.20) and on the near shore to both sides (u 0.25)
      nearBlade(15.3, 145.4, 41, 12, 0.2, 14, 0.2); nearBlade(17.7, 171.2, 53, 13, 0.25, 9, 0.25); nearBlade(-26.8, 173.3, 56, 13, -0.25, 17, 0.25);
      // beyond the great bloom, in the pool (u 0.47 to 0.52): from bloom height the port leaf wall stands 17 to 20 degrees
      // up, so what breaks it stands near, in the water: two pale buds on tall jointed stalks and two
      // paddle blades on bare stalks, all of unequal height, the last cropped by the top edge at u 0.52
      skyBud(58, 306, 94, 10, true, 0.5, 10); nearBlade(46, 290, 95, 15, 0.2, 5, 0.49); skyBud(42, 236, hour === 'moon' ? 104 : 97, 10, true, 0.47, 8, [[0, -1, 11], [1, 1, 10, 1.1]]);   // both stand to port of the disc as seen from the reveal and the climb. No bird stands on the first (from the lane its tip is before the disc); the second is raised so that from the lane its two birds stand over the disc's top rim, clear of it, the twig leaning to starboard
      // two more buds on tall jointed stalks in the pool's starboard water: from the lane they stand on the sky over the leaf
      // line to starboard of the disc, each with its birds; on the climb they pass 18 and 30 m to starboard
      skyBud(-22, 213, 68, 11, true, 0.36, 9, [[1, 1, 12], [0, -1, 11, 1.1], [1, 1, 10, -1.1]]); skyBud(-34, 230, 71, 10, false, 0.38, 12, [[0, 1, 11], [1, -1, 10, 1.1]]);
      nearBlade(40, 322, 100, 14, -0.2, 12, 0.5);
    }
    await ctx.yield();
    // ---- blossom spikes, white and pink, over the leaves (nothing flies over them: the birds of the skyline perch) ----
    {
      const SPK = [[0.088, 28, 27, 0], [0.09, -19, 27, 1], [0.13, 22, 30, 1], [0.17, -24, 32, 0], [0.75, 34, 26, 1], [0.8, -40, 30, 0], [0.84, 40, 24, 0], [0.88, -44, 30, 1], [0.93, 36, 26, 1], [0.98, -32, 28, 0]];
      for (const [u, off, h, pink] of SPK) { const p = at(u), s = portAt(u); spike(p[0] + s[0] * off, p[2] + s[2] * off, h, pink); }
      for (let i = 0; i < 14; i++) {
        const th = (i / 14) * 6.2832 + tr() * 0.3, rr = 96 + tr() * 60, x = POOL.x + Math.sin(th) * rr, z = POOL.z + Math.cos(th) * rr;
        if (inTree(x, z) || bayDist(x, z) < 8 || sightCap(x, z) < 1e8 || path.nearestXZ(x, z).dist < 22) continue;
        spike(x, z, 44 + tr() * 26 + (rr - 96) * 0.3, i % 2, { yaw: Math.atan2(BL[0] - x, BL[1] - z) });
      }
    }
    await ctx.yield();
    await ctx.yield();
    set.finish(scene);
    await ctx.yield();

    // ---- things that travel: the black snake pouring down the starboard stalk, thrown oranges, rain ----
    const snake = { mesh: [], dir: new THREE.Vector3() };
    {
      const f = exitFeet[1], ss = style.set(), R = [Math.cos(exitYaw), 0, -Math.sin(exitYaw)];
      snake.dir.set(R[0] * f.ax[0], f.ax[1], R[2] * f.ax[0]).normalize();
      // a fat green-black S, 17 m of it, its coils swinging 2.5 m to either side, banded only in the darkest greens (it is
      // the one BLACK snake); two big light
      // paddle leaves low on the plant stand behind it so the dark reads.
      // the snake's own flat stands 4.5 m nearer than the plant, in front of the wreath
      const c = { pivot: [f.foot[0] - END_DIR[0] * 4.5 - END_DIR[2] * 3.5, f.foot[1], f.foot[2] - END_DIR[2] * 4.5 + END_DIR[0] * 3.5], yaw: exitYaw, limit: 0.005, waveS: 1.005, phase: 0.6, nod: 1 }, P = [], NSEG = 30;
      for (let i = 0; i <= NSEG; i++) { const t = 12 + i * 0.56, off = 2.5 * Math.sin(i * 0.27 + 0.5) * Math.min(1, 0.45 + i * 0.12); P.push([f.ax[0] * t + f.ax[1] * off, f.ax[1] * t - f.ax[0] * off]); }
      const dark = pig[0], ringA = G[5], ringB = G[10];
      for (let i = 0; i < NSEG; i++) {                    // a fat body, tapering to the tail, a dark green band every third piece
        const dx = P[i][0] - P[i + 1][0], dy = P[i][1] - P[i + 1][1], len = Math.hypot(dx, dy), an = [0.05, 0, 2.2, i * 0.07], w = 2.7 - i * 0.05;
        ss.blade('sword', { ...c, base: [P[i + 1][0], P[i + 1][1], 0], axis: [dx / len, dy / len, 0], len: len * 1.6, wid: w, a: dark, b: dark, layer: 30 + (NSEG - i), veins: -1, anim: an });
        if (i % 3 === 1) ss.blade('stalk', { ...c, base: [P[i + 1][0] + (dx / len) * len * 0.5, P[i + 1][1] + (dy / len) * len * 0.5, 0], axis: [dx / len, dy / len, 0], len: len * 0.55, wid: w * 0.9, a: ringA, b: ringB, layer: 30.5 + (NSEG - i), veins: -1, anim: an });
      }
      const hx = -0.5, hy = -0.87, an = [0.05, 0, 2.2, -0.1];     // the head, down and away: a broad heart and a vermilion tongue. No eye: no eye is in the exit picture
      ss.blade('heart', { ...c, base: [P[0][0] - hx * 0.8, P[0][1] - hy * 0.8, 0], axis: [hx, hy, 0], len: 4.6, wid: 3.6, a: dark, b: dark, layer: 66, veins: -1, anim: an });
      for (const tw of [-0.3, 0.3]) ss.blade('grass', { ...c, base: [P[0][0] + hx * 3.6, P[0][1] + hy * 3.6, 0], axis: [Math.sin(-2.62 + tw), Math.cos(-2.62 + tw), 0], len: 2.0, wid: 0.4, a: pig[5], b: pig[5], layer: 65, veins: -1, anim: [0.12, 0, 5, tw] });
      snake.mesh = ss.finish(scene);
    }
    const flyers = [];
    for (let i = 0; i < 4; i++) {
      const fs = style.set(), size = i < 3 ? 2.2 : 1.1;
      fs.blade('disc', { pivot: [0, 0, 0], limit: 3.2, nod: 0, base: [0, -size * 0.5, 0], len: size, wid: size, a: pig[5], b: pig[5].clone().lerp(pig[3], 0.6), veins: -1, layer: 40 });
      const m = fs.finish(scene)[0]; m.position.set(0, -500, 0); m.name = 'thrown-orange';
      flyers.push(m);
    }
    const uD0 = uGreat + 0.04, uD1 = uTree - 0.015;
    const drops = [[uD0 + (uD1 - uD0) * 0.03, 3.4, 4.5], [uD0 + (uD1 - uD0) * 0.3, -3.8, 4], [uD0 + (uD1 - uD0) * 0.57, 3.2, 4.6]];
    const tossFrom = tree.monkeys[0];
    const RAIN_P = 60, rainDir = new THREE.Vector3(Math.sin(20 * RAD), -Math.cos(20 * RAD), 0);
    let rain = null;
    if (hour === 'rain') {
      const rs = style.set(), n = Math.round(760 * detail), a = mixS(white, pale, 0.8), b = mixS(white, pale, 0.4);
      for (let i = 0; i < n; i++) {
        const u = rng() * 1.04 - 0.02, p = at(Math.max(0, Math.min(1, u))), s = portAt(u), nearLens = i % 6 === 0;
        const r0 = rng(), off = nearLens ? (r0 < 0.5 ? -1 : 1) * (2.5 + r0 * 9) : (r0 - 0.5) * 90, dy = (rng() - 0.5) * (nearLens ? 20 : 70), w = 0.1 + Math.abs(off) * 0.004;
        for (let k = 0; k < 2; k++) {
          const q = [p[0] + s[0] * off - rainDir.x * k * RAIN_P, p[1] + dy - rainDir.y * k * RAIN_P - 15, p[2] + s[2] * off];
          rs.blade('stalk', { pivot: q, limit: 0, nod: 0, mode: 1, axis: [-rainDir.x, -rainDir.y, 0], len: 30, wid: w, a, b, veins: -1, layer: 3 });
        }
        if (i % 200 === 199) await ctx.yield();
      }
      rain = rs.finish(scene)[0]; rain.name = 'rain';
      style.uniforms.uLean.value = 1;
    }
    await ctx.yield();

    // ---- the flight ----
    const bump = (u, a, b) => sstep(a - 0.025, a + 0.025, u) * (1 - sstep(b - 0.025, b + 0.025, u));
    const pace = (u) => 1 + 0.25 * bump(u, uPool + 0.04, uGreat - 0.07) - 0.34 * bump(u, uGreat - 0.035, uGreat + 0.04)
      + 0.55 * bump(u, uGreat + 0.07, uTree - 0.03) - 0.3 * bump(u, uTree + 0.005, Math.min(0.86, uTree + 0.1));
    const heart = W(A.great.heart), mk = tree.monkeys[0], bloomAt = new THREE.Vector3(), dropAt = new THREE.Vector3();
    // The gaze. Up the climb it rests on the stalk under the great bloom, at bloom height on the bloom itself from a
    // little above (so the far shore's wall stands behind it), then it slides past the heart to the far shore under
    // the disc, and on the drop it rests on the top of the orange tree, not on the water.
    const aimBloom = (time, u) => {
      const k = sstep(0.4, 0.455, u), s = sstep(0.532, 0.575, u);
      return bloomAt.set(heart[0] + 9 * s, heart[1] - 13 + 16.5 * k - 3 * s, heart[2] + 32 * s);
    };
    const aimDrop = (time, u) => dropAt.set(TREE.x - 2, TREE.y + 22 - 10 * sstep(0.54, 0.6, u) - 11 * sstep(0.6, 0.69, u), TREE.z + 1);
    const pois = [
      { at: new THREE.Vector3(2, 26, 270), from: 0.13, to: 0.3, weight: 0.6 },
      { at: new THREE.Vector3(2, 38, 270), from: 0.215, to: 0.335, weight: 0.6 },   // held on the stand between the reveal and the climb: the sky is empty by rule, so the eye does not swing up into it
      { at: new THREE.Vector3(2, 32, 270), from: 0.24, to: 0.33, weight: 0.6 },    // and once more through the first of the climb: the bare band of sky stays about a third of the frame
      { at: aimBloom, from: 0.29, to: 0.575, weight: 0.9, fade: 0.2 },
      { at: new THREE.Vector3(mk[0], mk[1] + 1.6, mk[2]), from: 0.685, to: 0.74, weight: 0.5 },
      { at: new THREE.Vector3(E79[0] + Math.sin(sunB) * 50, 15, E79[2] + Math.cos(sunB) * 50), from: 0.765, to: 0.85, weight: 0.4 },   // the islet: its monkey stays in the frame until we are past it
      { at: new THREE.Vector3(bird[0], 3.8, bird[2]), from: 0.8, to: 0.895, weight: 0.4 },
    ];
    // the same aims again: the steady camera takes a third of each weight, and several pulls keep the picture in its frame
    for (let i = 0; i < 4; i++) pois.push({ at: aimBloom, from: 0.42, to: 0.57, weight: 0.8, fade: 0.25 });
    for (let i = 0; i < 4; i++) pois.push({ at: aimDrop, from: 0.54, to: uTree - 0.005, weight: 0.7, fade: 0.22 });
    const U = style.uniforms, camP = new THREE.Vector3(), tp = new THREE.Vector3(), tq = new THREE.Vector3();
    const dawnHold = A.uOf(17) + 0.031;
    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 4000, bank: 0.1 },   // his horizon is level
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F2C96A', glow: 0, halo: false, frame: 0, revealDistance: 260 },
      post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        hero.update(dt, time, camera);
        if (hour === 'morning' && !rare) hero.setShut(10, Math.max(dawnHold, u > 0.28 ? 0.28 + (u - 0.28) * 2.5 : 0));   // the far blooms open as the first wave reaches them
        camP.setFromMatrixPosition(camera.matrixWorld);
        sky.position.copy(camP);
        for (let i = 0; i < 3; i++) {                     // three oranges fall past us faster than we fall
          const d = drops[i], s = (u - d[0]) / 0.05, m = flyers[i];
          if (s <= 0 || s >= 1) { m.position.set(0, -500, 0); continue; }
          const uu = u + 0.022 + 0.02 * s + 0.07 * s * s;
          path.pointAt(Math.min(1, uu), tp); path.tangentAt(Math.min(1, uu), tq);
          const l = Math.hypot(tq.x, tq.z) || 1;
          m.position.set(tp.x + (tq.z / l) * d[1], tp.y + d[2] - 2.5 * s, tp.z - (tq.x / l) * d[1]);
        }
        {                                                 // the monkey's orange, tossed across our bows
          const s = (u - 0.7) / 0.045, m = flyers[3];
          if (s <= 0 || s >= 1) m.position.set(0, -500, 0);
          else {
            path.pointAt(0.752, tp); path.tangentAt(0.752, tq);
            const l = Math.hypot(tq.x, tq.z) || 1, e = s * s * (3 - 2 * s);
            m.position.set(tossFrom[0] + (tp.x + (tq.z / l) * 9 - tossFrom[0]) * e, tossFrom[1] + 2.2 + (tp.y - tossFrom[1]) * e + 3 * Math.sin(Math.PI * s), tossFrom[2] + (tp.z - (tq.x / l) * 9 - tossFrom[2]) * e);
          }
        }
        const sl = -6 * sstep(0.84, 1, u);                // the snake pours down its stalk
        for (const m of snake.mesh) m.position.copy(snake.dir).multiplyScalar(sl);
        if (rain) rain.position.copy(rainDir).multiplyScalar((time * 30) % RAIN_P);
      },
      dispose() { hero.dispose?.(); },
    };
  },
};
