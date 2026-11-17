// WHERE THE PAGE WAS FOLDED: klecksography. We fly the crease of an enormous folded sheet as it is opened.
// World space IS the brief's crease frame: +Z is the crease at x 0, y 0; the right leaf is x > 0. Only the right half
// of anything is built; style.mirror() draws it again with x negated, so every twin matches in shape and in motion.
// Everything scripted hangs on ONE clock, tJ: the brief's journey seconds (0..41), read from the camera's z, so the
// Figure, the moths, the blooms and the snapping threads stay in step whatever the pace. Ambient loops run on time.
// Post is the engine's flat switch: the hexes written are the hexes shown. No lights, no fog, no blending, no pass.
// Polish 5: the far end of the pressed fold is closed with a
// strip of card (no ruled white line up the frame), the exit is 16.4 m inside with style.corona() round it and carmine and
// orange bled into both walls beside it, and the build yields more often.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeStyle, buildHero, FIG_Z0, GLSL_COMMON, FOLD_FRAG, FOLD_ROWS } from '../parts/where-the-page-was-folded.js';

const CAM_Z = [[0, 0], [182, 7], [438, 15], [735, 24], [960, 33], [1152, 41]];   // the brief's journey: camera z -> seconds
function journeySeconds(z) {
  let i = 1; while (i < CAM_Z.length - 1 && z > CAM_Z[i][0]) i++;
  const a = CAM_Z[i - 1], b = CAM_Z[i]; return lerp(a[1], b[1], clamp((z - a[0]) / (b[0] - a[0]), 0, 1));
}
function journeyZ(t) {            // the same table read the other way: the lens's z at a journey second
  let i = 1; while (i < CAM_Z.length - 1 && t > CAM_Z[i][1]) i++;
  const a = CAM_Z[i - 1], b = CAM_Z[i]; return lerp(a[0], b[0], clamp((t - a[1]) / (b[1] - a[1]), 0, 1));
}
const SKIM = 10.5;            // metres: a length left from a skim along the right leaf that the course no longer flies. It still places two carmine blots, a flight of moths and sixteen drops: each up the leaf where a point this far off the leaf is 70 m (the flight: 72 m) above the crease

export default {
  id: 'where-the-page-was-folded',
  name: 'Where the Page Was Folded',
  category: 'alien',
  weirdness: 0.85,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    // ---- variations: stock and inks by hour, wetness with density, the Figure's family by seed (in buildHero)
    const sr = rng.fork('stock');
    const side = (label) => sr.fork(label);    // streams of the web's dark blots, the near threads, the mid-valley moths, the cleft's and the gutter's drops, the standing blots and the rings
    const pickStock = sr.pick(['day', 'day', 'day', 'day', 'dawn', 'golden', 'night', 'day']);
    const stock = ['day', 'dawn', 'golden', 'night'].includes(vary.hour) ? vary.hour : pickStock;
    const wetness = clamp(((vary.density ?? 1) - 0.7) / 0.6 * 0.75 + sr.range(0, 0.25), 0, 1);   // dry pull .. soaked
    const rare = !!vary.rare;
    const style = makeStyle(ctx, { stock });
    const scene = new THREE.Scene();
    scene.background = style.palette.blank.clone();
    const sky = style.sky(5200); scene.add(sky);
    const HOOP_R = 8.2;                       // (polish 5) the exit's inside radius
    const HOOP_BLOT = { z: 1147, rz: 50 }, HOOP_BLOT_Z = HOOP_BLOT.z - HOOP_BLOT.rz;   // the hoop's own bled colour on the walls, and where it begins
    const right = new THREE.Group();          // the right half of the world; mirrored at the end of build()
    const sheetAt = style.sheetAt, leafPoint = style.leafPoint, tmp = new THREE.Vector3();
    await ctx.yield();

    // ---- the path: the crease plane from first to last
    // (polish 1: the course never leaves the crease plane, so the frame is a whole symmetrical blot from first to last; what
    // was the half-picture is now a low pass down the red gutter, wet carmine at arm's length on BOTH sides, and the depth
    // comes from ink standing in the air at many distances: the standing blots of the valley and the films of the cleft)
    const path = makePath([[0, 45, 0], [0, 45, 90], [0, 43, 182], [0, 33, 300], [0, 22, 392], [0, 16, 462], [0, 21, 530],
      [0, 38, 596], [0, 63, 660], [0, 90, 715], [0, 113, 770], [0, 134, 818],
      [0, 156, 860], [0, 165, 900], [0, 172.5, 950], [0, 180, 1000], [0, 180, 1075], [0, 180, 1150]]);

    // ---- the blots of the right leaf. Black to z 380, carmine from 380, pale washes from 780; black and carmine
    // carry on into the cleft so that the first threads are black, then red, then every wash.
    const br = rng.fork('blots'), blots = [];
    const figClear = (z, r, rz, rr) => Math.abs(z - FIG_Z0) < 135 + rz && r < 175 + rr;      // the Figure's own ground
    const add = (b) => { blots.push({ seed: br.range(1, 60), thin: br.range(0.1, 0.7), pool: 0.2 + 0.55 * wetness, lobes: br.int(2, 4), ...b }); };
    // black: the entry's twins either side of the Figure, and big far ones up the leaf
    for (let i = 0, t = 0; i < 24 && t < 600; t++) {
      const z = br.range(-260, 400), big = br.chance(0.3), rz = big ? br.range(80, 150) : br.range(22, 70), rr = rz * br.range(0.65, 1.2), r = rr + 12 + br.range(0, 1) ** 2 * 900;
      if (figClear(z, r, rz, rr) || (z < 60 && r < 60 + rr)) continue;
      if (blots.some((o) => Math.hypot(o.z - z, o.r - r) < (o.rz + rz) * 0.9)) continue;
      add({ z, r, rz, rr, ink: 0 }); i++;
    }
    add({ z: 250, r: 330, rz: 95, rr: 70, ink: 0 }); add({ z: 80, r: 114, rz: 54, rr: 50, ink: 0, pool: 0.35, thin: 0.3, lobes: 3, seed: 31.9 });   // two black blots typed onto the entry's floor, the same on every seed: one 330 m up the leaf at z 250, one 114 m up it at z 80
    // the thumb smear, along the crease, as a thumb leaves it: pressed broad at one end, dragged out and thinning, never a bar
    for (let i = 0; i < 6; i++) blots.push({ z: 37 + 9.5 * i, r: 43 + 2.6 * Math.sin(i * 1.1 + 0.5) + 0.6 * i, rz: 9.5 - 0.7 * i, rr: 6.2 - 0.8 * i, ink: 0, thin: 0.62 + 0.06 * i, pool: 0.05, lobes: 2, seed: 7.7 + 3.1 * i });
    // carmine: the blot at z 352 and the lobe on the crease at z 420 where the two leaves' fronts run in and join, the long blot of the leaf from z 481 to z 731 (under the line of the old skim), and the rest
    add({ z: 352, r: 96, rz: 62, rr: 104, ink: 1, thin: 0.25, pool: 0.6, lobes: 3 });
    add({ z: 420, r: 6, rz: 96, rr: 92, ink: 1, thin: 0.3, pool: 0.62, lobes: 3, seed: 23.4, late: 0.15 });      // ... and the lobe where the two fronts run in and join across the crease
    add({ z: 455, r: 250, rz: 70, rr: 80, ink: 1 });
    { const a = sheetAt(605).slope, rS = (70 - SKIM * Math.cos(a)) / Math.sin(a);
      add({ z: 606, r: rS - 24, rz: 125, rr: 50, ink: 1, thin: 0.3, pool: 0.75, lobes: 4 });               // 250 m long, centred 24 m down the leaf from rS: its upper rim lies 26 m above rS
      add({ z: 652, r: rS + 78, rz: 44, rr: 30, ink: 1, thin: 0.5, pool: 0.6 }); }
    for (let i = 0, t = 0; i < 9 && t < 300; t++) {
      const z = br.range(400, 840), rz = br.range(35, 110), rr = rz * br.range(0.7, 1.3), r = rr * 0.6 + br.range(0, 1) ** 1.4 * 800;
      if (z > 500 && z < 715 && r < 260) continue;                                             // the long blot keeps its ground: none of these is centred within 260 m of the crease from z 500 to 715
      if (blots.some((o) => Math.hypot(o.z - z, o.r - r) < (o.rz + rz) * 0.85)) continue;
      add({ z, r, rz, rr, ink: 1 }); i++;
    }
    // (polish 1) the gutter the course flies low along is wet carmine on both sides from z 456 to z 676, the far edge of its second blot (not as far as the cleft's mouth); beyond it a black blot lies at z 706, and four small black blots lie further up the leaf
    blots.push({ z: 520, r: 26, rz: 64, rr: 44, ink: 1, thin: 0.62, pool: 0.2 + 0.55 * wetness, lobes: 3, seed: 41.3 },
      { z: 618, r: 20, rz: 58, rr: 40, ink: 1, thin: 0.55, pool: 0.2 + 0.55 * wetness, lobes: 4, seed: 12.9 },
      { z: 706, r: 34, rz: 52, rr: 46, ink: 0, thin: 0.3, pool: 0.2 + 0.55 * wetness, lobes: 3, seed: 27.1 },
      { z: 588, r: 58, rz: 17, rr: 13, ink: 0, thin: 0.2, pool: 0.5, lobes: 3, seed: 5.3 }, { z: 628, r: 84, rz: 21, rr: 15, ink: 0, thin: 0.25, pool: 0.5, lobes: 2, seed: 44.7 },
      { z: 664, r: 62, rz: 15, rr: 18, ink: 0, thin: 0.2, pool: 0.5, lobes: 3, seed: 18.2 }, { z: 556, r: 92, rz: 14, rr: 11, ink: 0, thin: 0.3, pool: 0.5, lobes: 2, seed: 33.9 });
    // the cleft: washes that meet without mixing over half of each wall, with black and carmine between
    const cleft0 = blots.length;
    for (let i = 0, t = 0; i < 26 && t < 600; t++) {
      const z = br.range(770, 1215) - (i % 3 === 0 ? 0 : 60), rz = br.range(30, 95) * (z > 1000 ? 0.6 : 1), rr = rz * br.range(0.8, 1.9), r = br.range(-10, 760);
      const q0 = br(), q1 = br(), q2 = br.int(0, 3), calm = z > 1085 && Math.abs(r - 181) < 70 + rr, ink = calm ? 2 + q2 : q0 < 0.14 ? 0 : q1 < 0.16 ? 1 : 2 + q2;   // of these none is dark beyond z 1085 about r 181, where the hoop stands in the leaf (the hoop's own carmine is laid there below, with HOOP_BLOT)
      if (z > 985 && Math.abs(r - 181) < 125 + rr) continue;                                  // the last 160 m at path height belong to the small washes
      if (blots.some((o) => Math.hypot(o.z - z, (o.r - r) * 0.7) < (o.rz + rz) * 0.62)) continue;
      add({ z, r, rz, rr, ink, thin: br.range(0.25, 0.8) }); i++;
    }
    const cleft1 = blots.length;
    await ctx.yield();
    for (let i = 0, t = 0; i < 48 && t < 700; t++) {                                           // the last bridge: small washes, close-set, at arm's length
      const z = br.range(950, 1218), rz = br.range(11, 30), rr = rz * br.range(0.9, 2.2), r = sheetAt(z).pathY + br.range(-95, 120), ink = i % 9 === 0 && z < 1085 ? 1 : 2 + (i % 4);
      if (blots.some((o) => o.rz < 31 && Math.hypot(o.z - z, (o.r - r) * 0.6) < (o.rz + rz) * 0.7)) continue;
      add({ z, r, rz, rr, ink, thin: br.range(0.15, 0.75), lobes: br.int(2, 4) }); i++;
    }
    // In the web no one wash may own the wall beside us, and something dark always stands at path height. Washes within reach
    // of the path are held small (the nearer the seam, the smaller: the wall is at arm's length there); two dark blots with
    // two washes against each stand at the mouth of the cleft; and from z 842 to 990 small blots are set close. The ink each of
    // these is dealt here (every fourth one dark) does not stand: the cells below give each the ink of the cell it lies in. All from a stream of their own.
    // Carmine blooms from nothing on approach.
    { const dk = side('dark'), pathR = (z) => { const sh = sheetAt(z); return sh.pathY / Math.sin(sh.slope); }, flip = dk.int(0, 1), mine = [];
      for (let i = cleft0; i < cleft1; i++) { const b = blots[i], cap = lerp(50, 26, smoothstep(820, 900, b.z));
        if ((b.ink >= 2 || b.z > 840) && b.z > 770 && b.z < 1000 && Math.abs(b.r - pathR(b.z)) < b.rr * 1.45 + 60) { b.rz = Math.min(b.rz, cap); b.rr = Math.min(b.rr, cap * 1.1); } }
      [800, 850].forEach((z0, k) => {
        const z = z0 + dk.range(-8, 8), r = pathR(z) + (k % 2 ? 24 : -18) + dk.range(-8, 8), w0 = dk.int(0, 3), sd = dk.range(1, 60), sc = k ? 0.75 : 1;
        add({ z, r, rz: dk.range(28, 36) * sc, rr: dk.range(34, 46) * sc, ink: k === flip ? 0 : 1, thin: dk.range(0.12, 0.3), pool: 0.55, lobes: 4, seed: sd });
        add({ z: z + dk.range(30, 40) * sc, r: r + (k % 2 ? -48 : 46) * sc + dk.range(-8, 8), rz: dk.range(20, 28) * sc, rr: dk.range(24, 36) * sc, ink: 2 + w0, thin: dk.range(0.3, 0.7), lobes: 3, seed: sd + 7.3 });
        add({ z: z - dk.range(28, 38) * sc, r: r + (k % 2 ? 42 : -44) * sc + dk.range(-8, 8), rz: dk.range(20, 28) * sc, rr: dk.range(24, 36) * sc, ink: 2 + (w0 + 1 + dk.int(0, 2)) % 4, thin: dk.range(0.3, 0.7), lobes: 3, seed: sd + 19.1 });
      });
      for (let i = 0, t = 0; i < 46 && t < 700; t++) {
        const z = dk.range(842, 990), rz = dk.range(11, 22) * lerp(1.25, 0.9, smoothstep(850, 960, z)), rr = rz * dk.range(0.9, 2), r = pathR(z) + dk.range(-85, 105), sd = dk.range(1, 60), th = dk.range(0.15, 0.7), lb = dk.int(2, 4);
        if (mine.some((o) => Math.hypot(o.z - z, (o.r - r) * 0.6) < (o.rz + rz) * 0.62)) continue;
        const dark = i % 4 === 0, b = { z, r, rz, rr, ink: dark ? ((i >> 2) + flip) % 3 === 1 ? 0 : 1 : 2 + (i % 4 + (i >> 2)) % 4, thin: dark ? th * 0.45 : th, pool: dark ? 0.55 : undefined, lobes: lb, seed: sd };
        if (b.pool === undefined) delete b.pool;
        mine.push(b); add(b); i++;
      }
      await ctx.yield();
      // ... and the small blots of the web take their ink from where they stand, in cells 24 m by 34 m, so that neighbours
      // never share one: every 2 by 2 block holds four different inks, one of them dark (carmine, or black)
      const md = (a, n) => ((a % n) + n) % n;
      for (const b of blots) { const dr = b.r - pathR(b.z);
        if (b.z < 842 || b.z > 1000 || Math.abs(dr) > 130 || b.rz > 32) continue;
        const cz = Math.floor(b.z / 24) + flip, cr = Math.floor((dr + 204) / 34), c4 = md(cz, 2) + 2 * md(cr, 2), blk = (cz >> 1) + (cr >> 1), dark = c4 === md(blk, 4);
        b.ink = dark ? (md(blk, 3) === 0 ? 0 : 1) : 2 + c4;      // each 2 by 2 block of cells holds four different inks, one of them dark
        b.rz = Math.min(b.rz, dark ? 13 : 19); b.rr = Math.min(b.rr, dark ? 17 : 25); if (dark) { b.thin = Math.min(b.thin, 0.3); b.pool = 0.55; } }   // dark is an accent at arm's length, never a wall
      // ... and right at path height, where the wall is nearest and any blot fills a third of the frame, the ink is laid in
      // drops six to nine metres across, by the same rule in cells half the size
      for (let i = 0, t = 0; i < 46 && t < 700; t++) {
        const z = dk.range(846, 996), dr = dk.range(-30, 30), rz = dk.range(5.5, 9), rr = rz * dk.range(1, 1.5), sd = dk.range(1, 60), th = dk.range(0.15, 0.6);
        if (mine.some((o) => o.tiny && Math.hypot(o.z - z, o.dr - dr) < 9)) continue;
        const cz = Math.floor(z / 13) + flip, cr = Math.floor((dr + 64) / 15), c4 = md(cz, 2) + 2 * md(cr, 2), blk = (cz >> 1) + (cr >> 1), dark = c4 === md(blk, 4);
        add({ z, r: pathR(z) + dr, rz, rr, ink: dark ? (md(blk, 3) === 0 ? 0 : 1) : 2 + c4, thin: dark ? th * 0.5 : th, pool: 0.5, lobes: 2, seed: sd }); mine.push({ tiny: true, z, dr, rz: 0, r: 1e6 }); i++;
      }
    }
    // (polish 5) the exit's colour reaches the walls too: where the hoop's rim stands in each leaf the card has drunk carmine,
    // and orange beyond it, so the ring of wet colour round the opening is whole (the film between the walls carries the rest)
    { const rH = sheetAt(1150).pathY / Math.sin(sheetAt(1150).slope);
      blots.push({ z: HOOP_BLOT.z, r: rH, rz: HOOP_BLOT.rz, rr: 54, ink: 2, late: -0.12, thin: 0.5, pool: 0.3, lobes: 4, seed: 21.7 },
        { z: 1148, r: rH, rz: 30, rr: 31, ink: 1, late: -0.3, thin: 0.2, pool: 0.6, lobes: 4, seed: 9.3 }); }
    // THE ENDS OF THE INK IN THE RED, each a thing of the fold. RED_NEAR: where the red arrives, the near edge of the first carmine
    // blot on the leaf, from the blot list (the standing figures begin there: they are seen from afar). RED_FLOOR: where the
    // floor itself is red, the brief's 'carmine from z 380' (the throws begin there: they lie in the red). VALLEY_END: the knee of
    // the fold, where the valley ends and the cleft begins (both end there). The fold's own table has rows of valley (14 and 28
    // degrees from level) and then rows of cleft (58 degrees and steeper); the valley ends at the first row of that table whose
    // leaf is steeper than 45 degrees, more wall than floor: the brief's row 'z 730: 58 degrees, 60 m, y 100'. Between its rows
    // the leaf eases from 28 to 58 degrees and itself passes 45 degrees near z 598: the end is the table's row, not that
    // crossing, and what stands on the steeper leaf from z 598 to the row stays.
    const RED_NEAR = blots.reduce((m, b) => (b.ink === 1 ? Math.min(m, b.z - b.rz) : m), Infinity), RED_FLOOR = 380, VALLEY_END = FOLD_ROWS.find((z) => sheetAt(z).slope > Math.PI / 4);
    // INK IN THE RED (the leaf): black thrown onto the valley floor from where the floor is red (RED_FLOOR) to the valley's end
    // (VALLEY_END), in throws of one blot 10 to 22 m long with its 'satellite spatters 0.5 to 4 m across', laid over whatever lies
    // there and never on the crease. A throw's place up the leaf is by lot, 16 to 136 m (16 to 96 m beyond z 520): most throws
    // lie on wet carmine, not all (some on bare card or on black). From a stream of their own.
    { const kr = ctx.core.makeRng(ctx.core.hashSeed('redink:' + ctx.seed));
      for (let z0 = RED_FLOOR + kr.range(0, 14); z0 < VALLEY_END; z0 += kr.range(11, 21)) { const r0 = 16 + kr.range(0, 1) ** 1.5 * (z0 < 520 ? 120 : 80), rz0 = kr.range(5, 11), n = kr.int(2, 4);
        blots.push({ z: z0, r: Math.max(r0, 8 + rz0 * 0.7), rz: rz0, rr: rz0 * kr.range(0.5, 0.85), ink: 0, late: -0.22, thin: kr.range(0.05, 0.3), pool: 0.6, lobes: kr.int(2, 4), seed: kr.range(1, 60) });
        for (let k = 0; k < n; k++) { const rz = kr.range(0.8, 2), a = kr.range(0, 6.283), dd = rz0 + kr.range(1.5, 9);
          blots.push({ z: z0 + Math.cos(a) * dd, r: Math.max(7 + rz, r0 + Math.sin(a) * dd * 0.8), rz, rr: rz * kr.range(0.8, 1.2), ink: 0, late: -0.22, thin: kr.range(0.05, 0.25), pool: 0.6, lobes: 1, seed: kr.range(1, 60) }); } } }
    await ctx.yield();
    const map = await style.paintInkMap(blots, { width: 832, height: 544, z0: -300, r0: 0, zLen: 1620, rLen: 1060 });
    await ctx.yield();

    // ---- the leaves: one ruled, cockled sheet per side, 2 km up the slope, deckle-edged
    const cockle = (z, r) => { const m = map.sample(z, r); return m[0] < 0.75 ? (m[2] - 0.45) * 0.9 : 0; };
    const leafGeo = await style.leafGeometryAsync({ z0: -300, z1: 1320, nz: 200, rMax: 2000, nr: 120, rPow: 2.2, cockle, deckle: 34 });
    await ctx.yield();
    const cardMat = style.card({ map: map.texture, mapRect: map.rect });
    cardMat.uniforms.uBloomFrom.value = 1;
    cardMat.uniforms.uStampB.value.set(1128, 188);        // the Figure's last print stands on both walls just short of the hoop, so the hoop keeps the grey seam behind it
    // The Figure can never open wider than the page: flying open in the cleft it is as large as the gap beside it lets it be
    // (figSizeAt). The 27.5 and the 0.3 below serve the flying Figure only: they are numbers fitted all along the flight to what
    // the third version's lens-solved pose gave, left as they were, untouched.
    // THE LAST PRINT is as large as the thing that presses it where it is pressed: the shut blade, whose size at a station is
    // figShutSizeAt (the Figure's law below calls the same function), read at the print's own hinge, uStampB's z. It reads
    // nothing of the lens, the clock or a share of the flight.
    const figSizeAt = (z) => Math.max(0.3, sheetAt(z).halfGap / 27.5);
    const figShutSizeAt = (z) => lerp(1, 0.86, smoothstep(640, 880, z));
    cardMat.uniforms.uStampBK.value = figShutSizeAt(cardMat.uniforms.uStampB.value.x);
    const leaf = new THREE.Mesh(leafGeo, cardMat); leaf.frustumCulled = false; right.add(leaf);
    // (polish 5) THE SEAM. Where the leaves are pressed shut the gap between them is a metre or two, and from down the
    // valley the blank showed through it as a ruled white line up the middle of the frame. The fold is closed there with
    // the card's own back: one strip across the end of the cleft, in the grey the walls beside it have at each height.
    { const NY = 20, pos = new Float32Array((NY + 1) * 6), nor = new Float32Array((NY + 1) * 6), lf = new Float32Array((NY + 1) * 4).fill(9000), fo = new Float32Array((NY + 1) * 2), idx = [];
      for (let j = 0; j <= NY; j++) { const y = -12 + 2030 * (j / NY) ** 1.6, f = Math.min(1, 0.4 + 0.6 * Math.exp(-Math.max(y, 0) / 500));
        pos.set([0, y, 1316, 44, y, 1316], j * 6); nor.set([0, 0, -1, 0, 0, -1], j * 6); fo[j * 2] = fo[j * 2 + 1] = f;
        if (j < NY) { const k = j * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('leaf', new THREE.BufferAttribute(lf, 2)); g.setAttribute('fold', new THREE.BufferAttribute(fo, 1)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1000, 1316), 1e5);
      const spine = new THREE.Mesh(g, cardMat); spine.frustumCulled = false; right.add(spine); }
    await ctx.yield();

    // ---- the hero: the Figure, on the world's own leaves
    const hero = await buildHero(ctx, { style, stock, detail, wetness, page: false, backdrop: false });
    hero.object.position.set(0, 0, FIG_Z0); hero.bindCard(cardMat); scene.add(hero.object);
    await ctx.yield();

    // ---- THREADS across the cleft. Right halves only: each runs from its root on the wall to the crease plane, and its
    // twin is the other half. Threads on our line snap on the journey clock, 25-40 m ahead of the lens; every other
    // thread stretches, necks, snaps and is drawn again on a loop of its own, so the web is never still.
    const tr = rng.fork('threads'), tlist = [];
    const wallAt = (z, y) => { const a = sheetAt(z).slope, r = y / Math.sin(a); return { x: r * Math.cos(a), r, a }; };
    const inkAtZ = (z, q) => (z < 850 ? 0 : z < 905 ? (q < 0.5 ? 0 : 1) : q < 0.14 ? 0 : q < 0.34 ? 1 : 2 + Math.min(3, Math.floor((q - 0.34) / 0.66 * 4)));
    for (let z = 806; z < HOOP_BLOT_Z; z += tr.range(12.5, 17) * 1.75) {                 // on our line: 12 m and more apart, as far as the hoop's own blot (past it the bridge is the hoop itself, and nothing is strung across the ring)
      const y = sheetAt(z).pathY + tr.range(-5, 7), w = wallAt(z, y), lead = tr.range(25, 40);
      tlist.push({ a: [w.x, y + tr.range(-1.5, 3), z + tr.range(-2, 2)], b: [0, y, z], half: true, breakAt: journeySeconds(z - lead), width: tr.range(0.28, 0.46) * (0.75 + 0.5 * wetness), sag: w.x * (0.22 + 1.8 * (tr.range(0.05, 0.16) - 0.05)), ink: inkAtZ(z, tr()), seed: tr() });
    }
    const nLoop = Math.round((330 + 330 * wetness) * detail);
    for (let i = 0, t = 0; i < nLoop && t < nLoop * 12; t++) {
      const z = tr.range(770, 1204), sh = sheetAt(z), y = sh.pathY + (tr.chance(0.14) ? tr.range(-62, -19) : 19 + 385 * tr() ** 1.15), w = wallAt(z, y);
      const q = tr(), period = tr.range(16, 44), wd = tr.range(0.16, 0.62), sg = tr.range(0.04, 0.2), sd = tr(), dz = tr.range(-3, 3), dy = tr.range(-2, 4), ph = tr.range(0, 60), brk = tr.range(0.72, 0.9);
      if (w.x < 6 || w.x > 56 || y < 8 || Math.abs(y - sh.pathY) < (z > 1030 ? 46 : 26)) continue;
      const slim = clamp(Math.abs(y - sh.pathY) / 70, 0.5, 1);
      tlist.push({ a: [w.x, y + dy, z + dz], b: [0, y, z], half: true, breakAt: period * brk, period, phase: ph, width: wd * slim * (0.7 + 0.6 * wetness), sag: w.x * (0.2 + 2.1 * (sg - 0.04) * (0.6 + 0.8 * sd)), ink: inkAtZ(z, q), seed: sd });   // wet ink hangs: the middle a tenth to a quarter of the span below the roots
      i++; if (i % 300 === 299) await ctx.yield();
    }
    { const t2 = side('nearthreads'), n2 = Math.round(30 * detail);                    // hung just off our line, most of them below it (the Figure flies above): each necks and snaps as we come up to it
      for (let i = 0; i < n2; i++) { const z = 835 + (i + t2()) * 295 / n2, sh = sheetAt(z), y = sh.pathY + (i % 3 === 0 ? 1 : -1) * t2.range(15, 44) * (i % 3 === 0 ? 1 : 1.4), w = wallAt(z, y), ld = t2.range(6, 46), wd = t2.range(0.26, 0.5), sg = t2.range(0.24, 0.5), q = t2(), sd = t2();
        if (w.x < 5 || y < 8) continue;
        tlist.push({ a: [w.x, y + 2 * sd, z + 4 * sd - 2], b: [0, y, z], half: true, breakAt: journeySeconds(z - ld), width: wd * (0.75 + 0.5 * wetness), sag: w.x * sg, ink: inkAtZ(z, q), seed: sd }); } }
    const uClock = { value: 0 };                       // journey seconds, shared by everything scripted
    const threadMat = style.thread({ neckDur: 1.5, snapDur: 0.75, root: 3, rootLen: 0.07 }); threadMat.uniforms.uClock = uClock;
    const threads = new THREE.Mesh(style.threadGeometry(tlist, 16), threadMat); threads.frustumCulled = false; right.add(threads);
    await ctx.yield();

    // ---- the exit: the last bridge, a thread that opened into a hoop of wet black ink, webbed into both leaves
    const END = path.pointAt(1);
    const hoop = style.hoop({ wallX: wallAt(END.z, END.y).x + 0.6 }); hoop.position.copy(END); right.add(hoop);
    // (polish 5) the opening is as wide as the cleft allows (16.4 m inside: the rim's flanks stand in the leaves), and the
    // hoop bleeds a ring of wet colour into the film around it, up and down the cleft, as we come (see style.corona)
    hoop.scale.setScalar(HOOP_R / 7);
    await ctx.yield();
    const corona = style.corona({ inner: HOOP_R * 9.2 / 7, seed: 1 + ((Math.abs(+ctx.seed || 0) * 0.618034) % 1) * 8 }); corona.position.set(END.x, END.y, END.z + 0.35); right.add(corona);
    await ctx.yield();

    // ---- BLOT-MOTHS: each is two half-blots hinged on a crease of its own (one shape, drawn twice by its own fold),
    // opening and closing about once a second. Scripted flights leave the page on the journey clock; the rest loop on time.
    const mr = rng.fork('moths'), AW = 48, atlas = new Uint8Array(AW * 4 * AW * 4), N = ctx.noise;
    for (let s = 0; s < 4; s++) {
      const sd = mr.range(1, 80), L = []; for (let k = 0; k < 4; k++) L.push([mr.range(0.12, 0.6), mr.range(0.18, 0.82), mr.range(0.1, 0.24), mr.range(0.1, 0.26)]);
      L.push([0.06, 0.5, 0.1, mr.range(0.3, 0.42)]);                                       // the body, on the hinge
      for (let j = 0; j < AW; j++) for (let i = 0; i < AW; i++) {
        const x = (i + 0.5) / AW, y = (j + 0.5) / AW; let d = 1;
        for (const l of L) { const e = Math.hypot((x - l[0]) / l[2], (y - l[1]) / l[3]) - 1, h = clamp(0.5 + (e - d) / 0.5, 0, 1); d = lerp(e, d, h) - 0.12 * h * (1 - h); }
        d += 0.22 * N.fbm2(x * 5 + sd, y * 5, 2) + smoothstep(0.82, 1, Math.max(x, Math.abs(y - 0.5) * 2)) * 2;
        const q = (j * AW * 4 + s * AW + i) * 4;
        atlas[q] = 255 * clamp(0.5 - d * 0.3, 0, 1); atlas[q + 1] = 255 * clamp(0.5 + 0.9 * N.n2(x * 4 - sd, y * 4 + sd), 0, 1); atlas[q + 2] = 255 * clamp(0.5 + 0.8 * N.n2(x * 6 + sd, y * 6 - sd) - d * 0.2, 0, 1); atlas[q + 3] = 255;
      }
      await ctx.yield();
    }
    const mothTex = new THREE.DataTexture(atlas, AW * 4, AW, THREE.RGBAFormat); mothTex.minFilter = mothTex.magFilter = THREE.LinearFilter; mothTex.needsUpdate = true;
    await ctx.yield();
    const moths = [];     // { p: start, v: metres a second, t0: journey second it leaves (-1 = loops on time), life, size, shape, ink, seed }
    const mAdd = (m) => moths.push({ seed: mr(), shape: mr.int(0, 3), ink: 0, life: 9, size: mr.range(2.4, 6), t0: -1, ...m });
    // THE THREE PAIRS THAT PASS THE LENS, dealt from the brief's own words: 'They lift from the floor in the Figure's wake at 2-7 s,
    // the nearest pair passing 5 m either side of the lens at 4 s, a fifth of the frame tall'. All from a stream of their own.
    // Its SPEED is drawn between two of the brief's figures: 22.5 m/s (the lens flies 45 m above the crease, and the nearest pair,
    // lifting no sooner than 2 s, is beside it at 4 s) and 26 m/s (the lens's own pace there: no moth outflies it).
    // Its MEETING PLACE with the lens is drawn by lot along the stretch the lens flies from the first second this moth can be
    // up there (2 s and the climb) to 7 s, the lens's z at those seconds from the journey table; 5 m from the crease plane for
    // the nearest pair, a drawn 5 to 9 m for the other two (the 9 a plain number), at the lens's own height there.
    // WHERE IT LIFTS is a place on the floor down the fold from the meeting place, toward and under the Figure, drawn by lot
    // over the ground it can have flown from since 2 s. The second it leaves is SOLVED from those two places and its speed,
    // and is read, as every scripted moth's is, from the lens's place through the journey table, never from the world's clock.
    // Its SIZE: the nearest pair is as large as a pair can be and pass 5 m from the crease plane (the moths' own shader turns one
    // back 0.7 m and its own size short of that plane, so that it never crosses its twin); the other two are drawn between the
    // brief's least (2 m) and that.
    { const mp = ctx.core.makeRng(ctx.core.hashSeed('passmoths:' + ctx.seed)), LIFT0 = 2, NEAR_AT = 4, PASS1 = 7, LENS_Y = 45, PACE = 26, NEAR = 5, TURN = 0.7, big = NEAR - TURN, at = new THREE.Vector3();
      for (let k = 0; k < 3; k++) {
        const sp = mp.range(LENS_Y / (NEAR_AT - LIFT0), PACE), tM = mp.range(LIFT0 + LENS_Y / sp, PASS1), zM = journeyZ(tM), xM = k === 0 ? NEAR : mp.range(NEAR, 9);
        let dA = 0, dB = path.length; for (let j = 0; j < 30; j++) { const dm = (dA + dB) / 2; if (path.posAtDist(dm, at).z < zM) dA = dm; else dB = dm; }
        const yM = path.posAtDist(dA, at).y;                                                       // the lens's own height where they meet
        const reach = Math.sqrt(Math.max(0, (sp * (tM - LIFT0)) ** 2 - yM * yM)), far = reach * Math.sqrt(mp()), turn = mp.range(0, Math.PI / 2);
        const xS = xM + far * Math.cos(turn), zS = zM + far * Math.sin(turn); leafPoint(zS, xS / Math.cos(sheetAt(zS).slope), tmp);
        const way = Math.hypot(xM - tmp.x, yM - tmp.y, zM - zS), fly = way / sp;
        moths.push({ p: [tmp.x, tmp.y, zS], v: [(xM - tmp.x) / fly, (yM - tmp.y) / fly, (zM - zS) / fly], t0: tM - fly, life: 8, size: k === 0 ? big : mp.range(2, big), shape: (k + mp.int(0, 3)) % 4, ink: 0, seed: mp() }); } }
    const nWake = Math.round(46 * detail);                                                 // 0.6 to 6.8 s of the journey clock: they lift from the floor in the Figure's wake, from z 70 to z 420, the further the later
    for (let i = 0; i < nWake; i++) { const z = mr.range(70, 420), r = mr.range(6, 150); leafPoint(z, r, tmp);
      mAdd({ p: [tmp.x, tmp.y + 0.6, z], v: [mr.range(-1.5, 2.5), mr.range(3.5, 8), mr.range(-6, 5)], t0: clamp((z - 60) / 60 + mr.range(-0.6, 0.8), 0.6, 7.2), life: mr.range(9, 15) }); }
    const nSide = Math.round(40 * detail);                                                 // 16 to 21.1 s of the journey clock: a flight leaves the right leaf from z 575 to z 735, the further the later (and its twin flight the left leaf)
    for (let i = 0; i < nSide; i++) { const z = mr.range(575, 735), sh = sheetAt(z), r = (72 - SKIM * Math.cos(sh.slope)) / Math.sin(sh.slope) + mr.range(-34, 46); leafPoint(z, r, tmp);
      const out = mr.range(2.5, 6.5) + 1.2, up = mr.range(1, 5);     // (they are carmine on carmine until they clear the leaf's edge, so they leave a little before we draw level and fly out smartly)
      mAdd({ p: [tmp.x, tmp.y, z], v: [-Math.sin(sh.slope) * out, Math.cos(sh.slope) * out + up, mr.range(-3, 7)], t0: clamp(16.4 + (z - 575) / 38 + mr.range(-0.5, 0.5), 16, 21.2), life: mr.range(8, 13), ink: 1, size: mr.range(2.2, 6) }); }
    // (near the seam they fly out toward us, where the cleft is wider)
    for (let i = 0; i < 44; i++) { const z = i < 20 ? mr.range(800, 1140) : mr.range(980, 1150), y = sheetAt(z).pathY + mr.range(15, 36) * (mr.chance(0.4) ? -1 : 1), sz = mr.range(1.5, 3.1);   // 44 pairs thread the cleft, each starting 15 to 36 m above or below the path's height and no nearer the crease plane than its own size and 1.5 m
      mAdd({ p: [Math.max(sz + 1.5, Math.min(sz + mr.range(4, 9), wallAt(z, y).x - sz - 1.5)), y, z], v: [mr.range(-0.1, 0.1), mr.range(-0.1, 0.1), mr.range(4, 9) * (z < 1000 && mr.chance(0.5) ? 1 : -1)], life: mr.range(14, 22), ink: inkAtZ(z, mr()), size: sz }); }
    const nAmb = Math.round(62 * detail * (0.8 + 0.4 * (vary.density ?? 1)));              // and the rest wander the valley on loops of their own
    for (let i = 0; i < 18; i++) { const z = mr.range(95, 430), x = mr.range(7, 120);                     // low over the entry's floor, where the picture is first seen
      mAdd({ p: [x, x * 0.25 + mr.range(7, 34), z], v: [mr.range(-1.5, 1.5), mr.range(-0.4, 1.2), mr.range(-6, 6)], life: mr.range(11, 20), size: mr.range(3, 7.5) }); }
    for (let i = 0; i < nAmb; i++) { const z = mr.range(20, 880), sh = sheetAt(z), y = sh.pathY + mr.range(-28, 60), xw = y / Math.tan(sh.slope), x = mr.range(8, Math.max(12, Math.min(xw - 6, 120)));
      mAdd({ p: [x, y, z], v: [mr.range(-1.2, 1.2), mr.range(-0.5, 1.6), mr.range(-7, 7)], life: mr.range(12, 24), ink: z < 400 ? 0 : z < 790 ? 1 : inkAtZ(z, mr()) }); }
    { const m2 = side('midmoths'), n2 = Math.round(34 * detail);                          // the middle of the valley is never still: pairs low over both slopes
      for (let i = 0; i < n2; i++) { const z = m2.range(270, 740), sh = sheetAt(z), x = m2.range(14, 64), y = Math.max(sh.pathY + m2.range(-12, 26), x * Math.tan(sh.slope) + 5);
        mAdd({ p: [x, y, z], v: [m2.range(-1.2, 1.2), m2.range(-0.4, 1.4), m2.range(-6, 6)], life: m2.range(10, 18), ink: z < 400 ? 0 : 1, size: m2.range(2.6, 6), seed: m2(), shape: m2.int(0, 3) }); } }
    await ctx.yield();
    const mothGeo = new THREE.InstancedBufferGeometry();
    mothGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.5, 1, 1, -0.5, 1, 0, 0.5, 1, 1, 0.5, 1, 0, -0.5, -1, 1, -0.5, -1, 0, 0.5, -1, 1, 0.5, -1], 3));   // (out from the hinge, along it, which half)
    mothGeo.setIndex([0, 1, 2, 2, 1, 3, 4, 6, 5, 6, 7, 5]);
    { const n = moths.length, P = new Float32Array(n * 3), V = new Float32Array(n * 3), K = new Float32Array(n * 4), M = new Float32Array(n * 2);
      moths.forEach((m, i) => { P.set(m.p, i * 3); V.set(m.v, i * 3); K.set([m.t0, m.life, m.size, m.seed], i * 4); M.set([m.shape, m.ink], i * 2); });
      mothGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); mothGeo.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 3));
      mothGeo.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 4)); mothGeo.setAttribute('aM', new THREE.InstancedBufferAttribute(M, 2));
      mothGeo.instanceCount = n; mothGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const mothMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...style.uniforms, uClock, uAtlas: { value: mothTex }, uFigLine: { value: new THREE.Vector4(0, 60, 500, 0) } },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec3 aP, aV; attribute vec4 aK; attribute vec2 aM; uniform float uClock; uniform vec4 uFigLine;
        varying vec2 vUv; varying vec3 vW, vN; varying float vInk, vShape;
        void main(){
          float life = max(aK.y, 1.), loop = step(aK.x, -.5), sd = aK.w * 6.283;
          float t = mix(uClock - aK.x, mod(uTime + aK.w * life * 7., life), loop);
          float vis = step(0., t) * step(t, life);
          float open = smoothstep(0., 1.3, t) * (1. - smoothstep(life - 1.8, life, t));        // it opens off the page and at last shuts to nothing
          vec3 c = aP + aV * t + vec3(sin(t * .9 + sd) * 1.5, sin(t * 1.3 + sd * 2.) * 1.1, cos(t * .7 + sd * 3.) * 1.5) * smoothstep(0., 2.5, t);
          c.x = max(abs(c.x), aK.z + .7);                                                      // it turns back short of the crease plane, where its twin turns too
          // nothing crosses the line between the lens and the Figure: a moth that would fold shut instead (and so does its twin:
          // the test is made for the lens and for its mirror image)
          vec3 cm = vec3(-cameraPosition.x, cameraPosition.yz), fa = uFigLine.xyz - cameraPosition, fb = uFigLine.xyz - cm;
          float ta = clamp(dot(c - cameraPosition, fa) / max(dot(fa, fa), 1.), 0., 1.), tb = clamp(dot(c - cm, fb) / max(dot(fb, fb), 1.), 0., 1.);
          float dl = min(length(c - cameraPosition - fa * ta) - 60. * ta, length(c - cm - fb * tb) - 60. * tb);
          float clr = mix(1., smoothstep(aK.z + .5, aK.z + 3.5, dl), uFigLine.w * (1. - smoothstep(.5, .7, min(ta, tb))));
          vec3 f = aV / max(length(aV), 1e-3), sv = cross(vec3(0., 1., 0.), f); sv = sv / max(length(sv), 1e-3); vec3 u2 = cross(f, sv);
          float beat = .5 + .5 * sin(uTime * (5.2 + 2. * fract(aK.w * 13.)) + sd * 5.);
          float ang = mix(1.47, .1 + 1.1 * beat, open), h = position.z;
          vec3 dir = sv * h * cos(ang) + u2 * sin(ang);
          float size = aK.z * vis * (.3 + .7 * open) * clr;
          vec3 p = c + f * position.y * size * 1.2 + dir * position.x * size;
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz; vN = mat3(modelMatrix) * (cross(f, dir) * h);
          vUv = vec2(position.x, position.y + .5); vInk = aM.y; vShape = aM.x;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        uniform sampler2D uAtlas; varying vec2 vUv; varying vec3 vW, vN; varying float vInk, vShape;
        void main(){
          vec4 a = texture2D(uAtlas, vec2((vShape + clamp(vUv.x, .02, .98)) * .25, vUv.y));
          float d = a.r - .5 + (vn(vUv * vec2(7., 34.) + vShape * 9.) - .5) * .035;                // capillary rim
          if (d < 0.) discard;
          float rim = 1. - smoothstep(0., .028, d);                                               // (a narrow one: the body of a moth is ink at full strength)
          vec3 col = wash(vInk, max(rim * .5, smoothstep(.79, .81, a.g) * .5));                     // flat ink and one squeezed step, crisp-edged
          vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3); vec3 n = vN / max(length(vN), 1e-4);
          float pool = smoothstep(.56, .62, a.b) * (1. - rim);
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(mix(col, hiAt(vInk), smoothstep(.5, .54, slit(n, v, .25, .7) * pool)), 1.); }`,
    });
    const mothMesh = new THREE.Mesh(mothGeo, mothMat); mothMesh.frustumCulled = false; right.add(mothMesh);
    await ctx.yield();

    // ---- BEADS: drops of standing ink that run down the leaf in fits and leave a trail, each with its twin in step
    const dr = rng.fork('beads'), beads = [];
    const nBead = Math.round(380 * detail * (0.55 + 0.9 * wetness));
    for (let t = 0; beads.length < nBead && t < nBead * 40; t++) {
      const z0 = dr.range(-180, 1200), r = dr.range(14, 720), run = Math.min(dr.range(25, 130), r - 6), per = dr.range(9, 22), ph = dr.range(0, 30), size = dr.range(0.5, 1.35), k = dr();
      leafPoint(z0, r, tmp); const near = Math.min(path.distanceTo(tmp.x, tmp.y, tmp.z), path.distanceTo(-tmp.x, tmp.y, tmp.z)) < 42;
      const z = near ? Math.round(z0 / 15) * 15 + 3 * Math.sin(z0 * 7.1) : z0, m = map.sample(z, r);   // the strobe rule: trails near the lens fall in rows 15 m apart
      if (m[0] > 0.6 || run < 10) continue;
      beads.push([z, sheetAt(z).slope, r, run, per, ph, size * (near ? 1 : 1 + 0.6 * k), m[3]]);
      if (t % 50 === 49) await ctx.yield();
    }
    for (let i = 0, n = Math.round(130 * detail); i < n; i++) {   // and in the cleft, where both walls are at arm's length
      const z0 = i % 5 < 2 ? dr.range(1085, 1212) : dr.range(800, 1212), z = Math.round(z0 / 15) * 15 + 3 * Math.sin(z0 * 7.1), sh = sheetAt(z), r = sh.pathY / Math.sin(sh.slope) + dr.range(-10, i % 5 < 2 ? 45 : 95), m = map.sample(z, r);
      beads.push([z, sh.slope, r, dr.range(30, 90), dr.range(5, 11), dr.range(0, 30), dr.range(0.5, 1.2), m[0] > 0.6 ? inkAtZ(z, dr()) : m[3]]);
    }
    // 'drops start down both slopes in step', toward the crease: two files of ten down the red valley. The rows are typed (one every
    // 10 m from z 352, one every 11 m from z 452; the places up the leaf, the runs and the sizes too); only the lots are by lot, from the
    // drops' own stream: 4 m (4.5 m) either way along the fold, 3 m up or down the leaf, each period and each phase. With twenty phases spread by lot some are on their way at any moment
    { const vd = ctx.core.makeRng(ctx.core.hashSeed('valleydrops:' + ctx.seed));
      for (let i = 0; i < 10; i++) { const zA = 352 + 10 * i + vd.range(-4, 4), zB = 452 + 11 * i + vd.range(-4.5, 4.5), perA = vd.range(9, 11.2), perB = vd.range(10, 12.2);
        beads.push([zA, sheetAt(zA).slope, 50 + 9 * ((i * 3) % 5) + vd.range(-3, 3), 40 + 3 * i, perA, vd.range(0, perA), 1.5 + 0.2 * (i % 2), 1]);
        beads.push([zB, sheetAt(zB).slope, 56 + 11 * ((i * 3) % 5) + vd.range(-3, 3), 34 + 2 * i, perB, vd.range(0, perB), 1.4 + 0.2 * (i % 2), 1]); } }
    { const d3 = side('cleftbeads');                                                    // more drops on both walls of the web and of the last bridge
      for (let i = 0, n = Math.round(70 * detail); i < n; i++) { const z0 = d3.range(820, 1205), z = Math.round(z0 / 15) * 15 + 3 * Math.sin(z0 * 7.1), sh = sheetAt(z), r = sh.pathY / Math.sin(sh.slope) + d3.range(-45, 80), m = map.sample(z, r);
        beads.push([z, sh.slope, r, d3.range(26, 70), d3.range(4.5, 9), d3.range(0, 30), d3.range(0.6, 1.2), m[0] > 0.6 ? inkAtZ(z, d3()) : m[3]]); } }
    await ctx.yield();
    { const d2 = side('skimbeads');                                                     // sixteen carmine drops on the leaf, two to a row, rows 15 m apart from z 560 to z 665, from 3 m below to 30 m above the place up the leaf that SKIM gives
      for (let i = 0; i < 16; i++) { const z = 560 + 15 * (i % 8) + d2.range(-2, 2), sh = sheetAt(z), r = (70 - SKIM * Math.cos(sh.slope)) / Math.sin(sh.slope) + d2.range(-3, 30);
        beads.push([z, sh.slope, r, d2.range(18, 38), d2.range(5.5, 9), d2.range(0, 30), d2.range(0.8, 1.25), 1]); } }
    await ctx.yield();
    const beadGeo = new THREE.InstancedBufferGeometry();
    { const sp = new THREE.SphereGeometry(1, 7, 4).toNonIndexed(), sq = sp.attributes.position, pos = [], nor = [], kind = [];
      for (let i = 0; i < sq.count; i++) { pos.push(sq.getX(i), sq.getY(i), sq.getZ(i)); nor.push(sp.attributes.normal.getX(i), sp.attributes.normal.getY(i), sp.attributes.normal.getZ(i)); kind.push(0); }
      for (let s = 0; s < 6; s++) { const a = s / 6, b = (s + 1) / 6; for (const q of [[a, -1], [b, -1], [a, 1], [a, 1], [b, -1], [b, 1]]) { pos.push(q[0], 0, q[1]); nor.push(0, 1, 0); kind.push(1); } }
      sp.dispose();
      beadGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); beadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); beadGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
      const n = beads.length, B = new Float32Array(n * 4), C = new Float32Array(n * 4); beads.forEach((b, i) => { B.set(b.slice(0, 4), i * 4); C.set(b.slice(4), i * 4); });
      beadGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); beadGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 4));
      beadGeo.instanceCount = n; beadGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const beadMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...style.uniforms, uBloomZ: cardMat.uniforms.uBloomZ, uBloomLen: cardMat.uniforms.uBloomLen },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec4 aB, aC; attribute float aKind; uniform float uBloomZ, uBloomLen;
        varying vec3 vW, vN; varying float vInk, vKind, vPale;
        float wob(float r, float sd){ return sin(r * .21 + sd) * .9 + sin(r * .83 + sd * 2.7) * .28 + (vn(vec2(r * 1.7, sd)) - .5) * .3; }   // a drop wanders with the fibres
        void main(){
          float lc = fract((uTime + aC.y) / max(aC.x, 1.)), prog = lc + .02 * sin(lc * 38.);            // it runs in fits, never backwards
          float born = mix(1., smoothstep(.5, .7, (uBloomZ - aB.x) / max(uBloomLen, 1.)), step(.5, aC.w));   // no drop before its blot
          float r = aB.z - aB.w * prog, rTop = aB.z - aB.w * prog * smoothstep(.7, 1., lc), sd = aC.y * 3.1;               // the trail soaks in from its top
          float ca = cos(aB.y), sa = sin(aB.y); vec3 nrm = vec3(-sa, ca, 0.), dn = vec3(-ca, -sa, 0.), p, n;
          // the drop's own place, folded as the fragment will be, gives its distance: never taller than a twentieth of the frame
          vec4 wc = modelMatrix * vec4(r * ca, r * sa, aB.x + wob(r, sd), 1.); wc.xyz = foldW(wc.xyz, modelMatrix[1].y);
          float dist = length(cameraPosition - wc.xyz), px = dist * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
          float size = min(aC.z, dist * .014) * smoothstep(0., .06, lc) * (1. - smoothstep(.84, .98, lc)) * born;
          rTop = min(rTop, r + 2. + 17. * min(aC.z, dist * .014));                                              // the trail soaks in behind it
          if (aKind < .5) { float tail = position.x < 0. ? 1. + .55 * position.x : 1.;
            p = vec3(r * ca, r * sa, aB.x + wob(r, sd)) + dn * position.x * size * (position.x < 0. ? 2.2 : 1.1) + nrm * (position.y * .5 * tail + .42) * size + vec3(0., 0., position.z * .72 * tail * size);
            n = dn * normal.x + nrm * normal.y * 1.8 + vec3(0., 0., normal.z * 1.3); vPale = smoothstep(6., 16., size / max(px, 1e-4)); }   // (how large it is drawn: a big drop's highlight stays a small one)
          else { float k = position.x, rr = mix(r, rTop, k); p = vec3(rr * ca, rr * sa, aB.x + wob(rr, sd)) + nrm * .08; n = nrm;
            // the wet trail: narrower than its drop, tapering to nothing at its top; where it would be under a pixel it is not drawn
            float hw = size * .62 * (1. - k) * sqrt(1. - k) * (.8 + .4 * vn(vec2(rr * .9, sd))), mn = px * .8;
            vPale = clamp(1.6 - hw / mn, 0., 1.); hw = hw > mn * .9 ? max(hw, mn) : 0.;
            p.z += position.z * hw; }
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz; vN = mat3(modelMatrix) * n; vInk = aC.w; vKind = aKind;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        varying vec3 vW, vN; varying float vInk, vKind, vPale;
        void main(){ vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3); vec3 n = vN / max(length(vN), 1e-4);
          // a drop is its ink at full strength with ONE small crisp highlight: the slit overhead, where the drop's skin faces
          // half way between the eye and straight up. Its trail is the middle wash step: paler than full ink, wetter than a thin wash or bare card.
          n = n * sign(dot(n, v) + 1e-5); vec3 hv = v + vec3(0., 1., 0.); hv = hv / max(length(hv), 1e-3);
          float th = mix(.8, .95, vPale); vec3 drop = mix(inkAt(vInk), hiAt(vInk), smoothstep(th, th + .025, dot(n, hv)));
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(vKind < .5 ? drop : wash(vInk, mix(.5, .62, vPale)), 1.); }`,
    });
    const beadMesh = new THREE.Mesh(beadGeo, beadMat); beadMesh.frustumCulled = false; right.add(beadMesh);
    await ctx.yield();
    // ---- STANDING BLOTS (polish 1): the depth of the valley. Ink that has peeled up off the page as the Figure did and
    // stands on it, each one two half-blots hinged on a crease of its own (so each is a small symmetrical figure, like the
    // moths, 27 to 170 m tall), its foot following the slope of the leaf. Four ranks: gates beside the crease that the course passes
    // between, a middle rank on both slopes, giants far up the leaves, and the file of black figures in the red (below); with four
    // typed onto the entry's slopes. Those dealt early 0 stand up in the Figure's wake, in mirror pairs; the others have stood since
    // the page was opened. Black to z 372 (about one in eight carmine beyond z 250), then carmine and black; none stands beyond the valley's end.
    const pr = side('standing'), stands = [];
    const sInk = (z, q) => (z < 372 ? (q < 0.12 && z > 250 ? 1 : 0) : z < 742 ? (q < 0.4 ? 0 : 1) : q < 0.2 ? 1 : 2 + Math.min(3, Math.floor((q - 0.2) / 0.8 * 4)));
    const sAdd = (z, x, w, h, o = {}) => { const q = pr(), sd = pr.range(1, 60), yw = pr.range(-0.32, 0.32);
      const tn = Math.tan(sheetAt(z).slope); w = Math.min(w, 0.3 * h / tn);
      stands.push({ z, x, w, h, tan: tn, seed: sd, ink: o.ink ?? sInk(z, q), yaw: o.yaw ?? yw, early: o.early ?? 0 }); };
    // the gates: pairs close beside the crease, 44 to 66 m apart along it from z 172 (the inner edge of each never nearer the crease plane than 7.5 m)
    for (let z = 172; z < 700; z += pr.range(44, 66)) { const x = pr.range(19, 30), w = Math.min(x - 7.5, pr.range(10, 15)), h = pr.range(30, 48) * lerp(1, 1.35, smoothstep(520, 740, z)); sAdd(z, x, w, h, { yaw: pr.range(0.1, 0.5) }); }
    // the middle rank
    for (let i = 0, t = 0, n = Math.round(44 * detail); i < n && t < 900; t++) {
      const z = pr.range(30, 690), x = pr.range(38, lerp(175, 46, smoothstep(430, 735, z))), h = pr.range(30, 72), w = h * pr.range(0.36, 0.6);
      if (x - w < 9 || (z < 150 && x < 95) || stands.some((o) => Math.abs(o.z - z) < 22 && Math.abs(o.x - x) < (o.w + w) * 0.9)) continue;
      sAdd(z, x, w, h, { early: z < 135 ? 1 : 0 }); i++;
    }
    // the giants, far up both leaves
    for (let i = 0, t = 0; i < 34 && t < 900; t++) {
      const z = pr.range(60, 700), k = smoothstep(430, 760, z), x = pr.range(lerp(190, 62, k), lerp(430, 190, k)), h = pr.range(70, 170) * lerp(1, 0.75, k), w = h * pr.range(0.38, 0.6);
      if (stands.some((o) => Math.abs(o.z - z) < 40 && Math.abs(o.x - x) < (o.w + w) * 0.8)) continue;
      sAdd(z, x, w, h, { early: z < 372 ? 1 : 0 }); i++;
    }
    sAdd(118, 150, 30, 62, { early: 1, ink: 0, yaw: 0.2 }); sAdd(205, 232, 46, 96, { early: 1, ink: 0, yaw: 0.25 });
    sAdd(86, 54, 16, 37, { early: 1, ink: 0, yaw: 0.3 }); sAdd(132, 104, 24, 52, { early: 1, ink: 0, yaw: 0.2 });       // four standing blots typed onto the entry's slopes (and their twins), the same on every seed, standing since the page was opened: two far up the leaf (line above), two nearer the crease (this line)
    // INK IN THE RED: black figures stand in the valley where the carmine is, from where the red arrives (RED_NEAR) to the knee of
    // the fold, where the valley ends (VALLEY_END, the table's row at z 730), both as said above; each
    // is a whole blot hinged on a crease of its own and its twin stands across the fold. They are DRAWN as a file down each slope,
    // one every 20 to 34 m along the fold, by turns close beside the crease and further up the leaf (places, sizes and turns from
    // a stream of their own), and every one that is drawn stands. The valley is held already by the gates, the middle rank and the
    // giants, which stand in rows one behind another. One figure stands ON another when both of these hold: (along the fold) the
    // further one's halves, folded toward the entry as far as they fold while it breathes (0.74 rad, the standing blot's own
    // shader: sin 0.74 = 0.67 of its half width; its twist and its turn about the vertical are not counted), reach the nearer
    // one's row; and (up the leaf) their feet are nearer than the sum of their half widths and 4 m more (the brief's largest
    // 'satellite spatters 0.5 to 4 m across': room for one to lie between them). A figure drawn on an older stand is MOVED to the
    // nearest clear place on the leaf, up it, down it or along the fold, between the red's near edge and the knee and never nearer the crease
    // than its own half width and the 7.5 m (a plain number) that every rank of standing blots keeps from our line. So the file
    // as it stands is a little looser than the file as drawn: what it is over seeds 1 to 50 is counted in the notes.
    { const ks = ctx.core.makeRng(ctx.core.hashSeed('inkstands:' + ctx.seed)), SPATTER = 4, DEEP = Math.sin(0.74), Z_A = RED_NEAR, Z_B = VALLEY_END;
      // the file's first figure falls by lot anywhere in the first two strides beyond the red's near edge (a stride is
      // 20 to 34 m, 27 at the mean: two are 54 m)
      for (let z0 = Z_A + ks.range(0, 54), i = 0; z0 < Z_B; z0 += ks.range(20, 34), i++) {
        const close = i % 2 === 0, x0 = close ? ks.range(19, 32) : ks.range(40, 68), h = ks.range(27, 44) * lerp(1, 1.3, smoothstep(520, 740, z0)) * (close ? 1 : 1.3), sd = ks.range(1, 60), yw = ks.range(-0.3, 0.3), k = ks.range(0.42, 0.62);
        const w = Math.min(x0 - 7.5, h * k, 0.3 * h / Math.tan(sheetAt(z0).slope)), xLow = w + 7.5;
        // the ground each older stand holds against a figure this wide: from where its own halves reach toward the entry to where
        // this figure's would reach it from beyond, and the two half widths and the spatter to either side of its foot
        const held = stands.map((o) => [o.z - DEEP * o.w, o.z + DEEP * w, o.x - (o.w + w + SPATTER), o.x + (o.w + w + SPATTER)]);
        // at one place along the fold, the nearest clear place up or down the leaf from where it was drawn
        const clearAt = (zz) => { let dn = x0, up = x0;
          for (let go = true; go;) { go = false;
            for (const g of held) { if (zz <= g[0] + 1e-6 || zz >= g[1] - 1e-6) continue;
              if (dn > g[2] + 1e-6 && dn < g[3] - 1e-6) { dn = g[2]; go = true; }
              if (up > g[2] + 1e-6 && up < g[3] - 1e-6) { up = g[3]; go = true; } } }
          return dn >= xLow && x0 - dn <= up - x0 ? dn : up; };
        let z = z0, x = clearAt(z0);
        if (x !== x0) {
          // ... and the nearest clear place on the leaf is that one, or lies along the fold where a held ground begins or ends (or the valley does)
          let best = Math.abs(x - x0); const tryAt = (zz) => { if (zz < Z_A || zz > Z_B || Math.abs(zz - z0) >= best) return; const xx = clearAt(zz), d = Math.hypot(zz - z0, xx - x0); if (d < best) { best = d; z = zz; x = xx; } };
          tryAt(Z_A); tryAt(Z_B); for (const g of held) { tryAt(g[0]); tryAt(g[1]); } }
        const tn = Math.tan(sheetAt(z).slope);
        stands.push({ z, x, w: Math.min(w, 0.3 * h / tn), h, tan: tn, seed: sd, ink: 0, yaw: yw, early: 0 });
        if (i % 4 === 3) await ctx.yield(); } }
    await ctx.yield();
    const standGeo = new THREE.InstancedBufferGeometry();
    { const NX = 4, NY = 12, pos = [], idx = [];
      for (let hh = 0; hh < 2; hh++) { const base = pos.length / 3;
        for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) pos.push(i / NX, j / NY, hh ? -1 : 1);
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = base + j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; if (hh) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, c, b, d); } }
      standGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); standGeo.setIndex(idx);
      const n = stands.length, P = new Float32Array(n * 3), Q = new Float32Array(n * 4), R = new Float32Array(n * 2);
      stands.forEach((s, i) => { P.set([s.x, s.tan, s.z], i * 3); Q.set([s.w, s.h, Math.round(s.seed * 32) / 32, s.ink], i * 4); R.set([s.yaw, s.early], i * 2); });
      standGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); standGeo.setAttribute('aQ', new THREE.InstancedBufferAttribute(Q, 4)); standGeo.setAttribute('aR', new THREE.InstancedBufferAttribute(R, 2));
      standGeo.instanceCount = n; standGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    // the shape of a pressed blot, shared by the standing blots and the films: a few seeded lobes run together, torn by
    // noise, with capillary fingers on the rim. p in 0..1 (x out from the blot's own crease, y up); > 0 is ink.
    const GLSL_BLOT = /* glsl */`
      float ell(vec2 q, vec2 c, vec2 r){ return 1. - length((q - c) / r); }
      float blotField(vec2 p, float sd){
        vec2 q = p + (vec2(vn(p * 2.6 + sd), vn(p * 2.6 + sd + 17.3)) - .5) * .16;
        float d = ell(q, vec2(0., .36), vec2(.07 + .07 * h21(vec2(sd, 1.)), .4));                        // the body, on the crease
        d = max(d, ell(q, vec2(0., .0), vec2(.34 + .22 * h21(vec2(sd, 2.)), .1 + .07 * h21(vec2(sd, 2.5)))));  // the foot, spreading into the page
        for (int k = 0; k < 4; k++) { float fk = float(k);
          vec2 c = vec2(.14 + .3 * h21(vec2(sd, fk + 3.)), .24 + .15 * fk + .1 * h21(vec2(sd, fk + 9.)));
          vec2 r = vec2(.13 + .2 * h21(vec2(sd, fk + 15.)), .05 + .085 * h21(vec2(sd, fk + 21.)));
          float e = ell(q, c, r), hh = clamp(.5 + (e - d) / .7, 0., 1.); d = mix(d, e, hh) + .17 * hh * (1. - hh); }
        d = min(d, -ell(q, vec2(.12 + .16 * h21(vec2(sd, 31.)), .45 + .3 * h21(vec2(sd, 32.))), vec2(.035 + .03 * h21(vec2(sd, 33.)), .025)) * .6);   // an eye
        d += (vn(p * vec2(5., 6.) + sd) - .5) * .2 - .05;
        d -= smoothstep(.8, 1., max(p.x, p.y)) * 2.5;                                                 // never as far as the sheet's own edge
        return d; }
    `;
    const uRiseZ = { value: 150 }, uCamZ = { value: 0 };
    const standMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...style.uniforms, uRiseZ },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec3 aP; attribute vec4 aQ; attribute vec2 aR; uniform float uRiseZ;
        varying vec2 vUv; varying vec3 vW, vN; varying float vInk, vSeed, vTall;
        void main(){
          float sd = aQ.z * 6.283, up = mix(clamp((uRiseZ - aP.z) / 90., 0., 1.), 1., aR.y);
          float e = up * up * (3. - 2. * up), spring = 1. + .16 * sin(up * 9.) * (1. - up);               // it stands up off the page, and settles
          float beat = .5 + .5 * sin(uTime * (.45 + .35 * fract(aQ.z * 7.13)) + sd);
          float ang = mix(1.5, .12 + .62 * beat, e), h = position.z;                                   // from a shut blade it opens, and goes on breathing
          ang += (position.y - .45) * .9 * sin(sd * 3.) * e;                                           // and each half is twisted a little along its height: no view has the whole of it edge-on
          vec3 f = vec3(sin(aR.x), 0., -cos(aR.x)), s = vec3(cos(aR.x), 0., sin(aR.x));
          vec3 dir = s * h * cos(ang) + f * sin(ang);
          float py = position.y, tall = aQ.y * e * spring;
          vec3 p = vec3(aP.x, 0., aP.z) + dir * position.x * aQ.x * (.35 + .65 * e);
          p += s * (vn(vec2(position.y * 2.6 + sd, aQ.z * 3.)) - .5) * aQ.x * .34 * position.y * e;                // its own crease is no ruled line: it wanders as it rises
          p += f * py * py * tall * (.1 + .07 * sin(uTime * .6 + sd * 3.)) * (.3 + position.x);           // its top curls over, toward us
          p.z += py * tall * .03 * sin(uTime * .8 + sd * 2. + py * 2.);
          p.x = max(p.x, 4.);
          p.y = max(aP.x - aQ.x, 4.) * aP.y - 1. + py * (tall + 1.);                                   // it stands upright, planted: the leaf itself hides its foot
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz;
          vN = mat3(modelMatrix) * (cross(vec3(0., 1., 0.), dir) * h);
          vUv = position.xy; vInk = aQ.w; vSeed = aQ.z; vTall = aQ.y;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + GLSL_BLOT + /* glsl */`
        varying vec2 vUv; varying vec3 vW, vN; varying float vInk, vSeed, vTall;
        void main(){
          float m = vTall, sd0 = floor(vSeed * 32. + .5) / 32.;       // (a seed that goes through a hash must be exact: an interpolated one glitters)
          vec2 fw = fwidth(vUv) * m * 3.;                                                              // (no grain finer than three pixels: it would only glitter)
          // capillary fingers along the fibres: the rim is pushed in and out (a warp of the shape, never a speckle)
          vec2 uvw = vUv + vec2((vn(vUv * vec2(m * .32, m * .07) + sd0) - .5) * .05 * clamp(1. - max(fw.x * .32, fw.y * .07), 0., 1.), (vn(vUv * vec2(m * .09, m * .3) - sd0) - .5) * .03 * clamp(1. - max(fw.x * .09, fw.y * .3), 0., 1.));
          uvw += (vec2(vn(vUv * 9. + sd0), vn(vUv * 9. - sd0 + 5.)) - .5) * .055 + (vec2(vn(vUv * 21. - sd0), vn(vUv * 21. + sd0 + 3.)) - .5) * .022 * clamp(1.4 - max(fw.x, fw.y) * .12, 0., 1.);   // pressed, not drawn: no edge is smooth
          float d = blotField(uvw, sd0);
          // ... and that crease is embossed, not sharp: the ink of each half stops short of it in lobes and meets its twin only here
          // and there, so that a blot seen from the side ends in a blot's edge and never in a ruled one
          d = min(d, (uvw.x - max(0., vn(vec2(vUv.y * 11. + sd0 * 7., sd0)) - .38) * .16 - max(0., vn(vec2(vUv.y * 31., sd0 * 5.)) - .5) * .05) * 7.);
          { vec2 g = uvw * vec2(7., 9.), c = floor(g), f = fract(g) - .5 - (vec2(h21(c + sd0), h21(c - sd0 + 9.)) - .5) * .5;      // satellite spatter, close about it
            float keep = step(.62, h21(c * 1.7 + sd0 + 2.)) * step(-.5, d) * step(uvw.y, .9) * step(uvw.x, .9);
            d = max(d, (.05 + .2 * h21(c + sd0 * 3.) - length(f * vec2(1., 1.5))) * keep * .5 - (1. - keep)); }
          if (d < 0.) discard;
          float rim = 1. - smoothstep(.0, .05, d), tide = smoothstep(.05, .06, d) * (1. - smoothstep(.12, .13, d));
          float sq = vn(vUv * vec2(3.2, 5.) + sd0 * 1.3) * .7 + vn(vUv * vec2(6.5, 10.) + sd0) * .3, sq2 = vn(vUv * vec2(5., 7.5) - sd0);
          float thin = max(smoothstep(.66, .68, sq) * .5 + smoothstep(.77, .79, sq) * .4, smoothstep(.8, .82, sq2) * .5);   // squeezed washes, in flat steps
          thin = max(thin * (1. - tide), rim * .5);
          vec3 col = wash(vInk, thin);
          vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3);
          vec3 n = vN + vec3(0., (vn(vUv * vec2(2.5, 4.) + sd0 * 2.) - .5) * 2.2, 0.); n = n / max(length(n), 1e-4);   // pooled ink: the slit slides over it
          float pool = smoothstep(.64, .68, vn(vUv * vec2(3., 4.5) + sd0 * 3.7)) * (1. - rim) * (1. - step(.01, thin)) * clamp(1.5 - max(fw.x, fw.y) * 2., 0., 1.);
          col = mix(col, hiAt(vInk), smoothstep(.5, .54, slit(n, v, .3, .75) * pool));
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
    const standMesh = new THREE.Mesh(standGeo, standMat); standMesh.frustumCulled = false; standMesh.name = 'standing'; right.add(standMesh);
    await ctx.yield();
    // ---- RINGS (polish 1): the depth of the cleft. Where the leaves are still parting the wet ink does not only pull
    // into threads: here and there a film of it opens into a ragged ring, held to both walls by strands (the hoop at the
    // end is the last of them, and the only one that will not tear). Each begins as a blot hung in the air with a small
    // hole in it, and opens as we come; the course passes through eight or nine of them among the 14 to 16 sheets of the file
    // (the four washes once each; black and carmine each come more than once).
    // Half of each is built and the fold completes it.
    // THE SHEETS HANG ALL THE WAY: the first, black, at the cleft's mouth (z 800, where the brief's cleft begins), and every later one
    // one drawn stride of 17 to 24 m beyond the one before, the strides from a stream of their own; the file ends with the last
    // sheet that still falls short of the hoop's own bled colour on the walls (HOOP_BLOT_Z), wherever that is. Counted over seeds
    // 1 to 50: 14 to 16 sheets; the fifth stands anywhere from z 874 to 891 (17 m), the tenth from z 970 to 1,001 (31 m), the
    // last from z 1,073 to 1,097 (24 m). Two kinds, by
    // turns: the RINGS that stand from the valley (black at the mouth, carmine, the four washes by lot, carmine, black: the first
    // two sheets, the last, and every second one between), and between them the PRESSED sheets (see below), which bloom as we come.
    const fr = side('films'), films = [], pressed = [], fInks = [0, 1, ...fr.shuffle([2, 3, 4, 5]), 1, 0];
    { const sq = ctx.core.makeRng(ctx.core.hashSeed('sheets:' + ctx.seed)), st = [0], MOUTH_Z = 800; let sum = 0, ring = 0, pr2 = 0;
      for (;;) { const next = sum + sq.range(17, 24); if (MOUTH_Z + next >= HOOP_BLOT_Z) break; sum = next; st.push(sum); }
      st.forEach((d, k) => { const z = MOUTH_Z + d, sh = sheetAt(z), cy = sh.pathY, wx = wallAt(z, cy).x, isRing = k < 2 || k === st.length - 1 || k % 2 === 1;
        const o = { z, cy, W: wallAt(z, cy + 120).x + 5, r0: clamp(wx * 0.46, 10, 15), cot: 1 / Math.tan(sh.slope), wx };
        if (isRing) { const ik = k === st.length - 1 ? 0 : fInks[Math.min(ring, 7)]; ring++; films.push({ ...o, seed: fr.range(1, 60), ink: stock === 'dawn' && ik > 3 ? ik - 2 : ik }); }
        else { const ik = 2 + pr2 % 4; pressed.push({ ...o, seed: sq.range(1, 60), ink: stock === 'dawn' && ik > 3 ? ik - 2 : ik, n: pr2++ }); } }); }
    const filmGeo = new THREE.InstancedBufferGeometry();
    { const pg = new THREE.PlaneGeometry(1, 1, 6, 16); pg.translate(0.5, 0.5, 0);
      filmGeo.setAttribute('position', pg.attributes.position); filmGeo.setIndex(pg.index);
      const n = films.length, A = new Float32Array(n * 4), B = new Float32Array(n * 3);
      films.forEach((f, i) => { A.set([f.z, f.cy, f.W, f.r0], i * 4); B.set([Math.round(f.seed * 32) / 32, f.ink, f.cot], i * 3); });
      filmGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); filmGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
      filmGeo.instanceCount = n; filmGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const filmMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...style.uniforms, uCamZ },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec4 aA; attribute vec3 aB; varying vec2 vM; varying vec3 vW; varying vec4 vK; varying vec2 vCot;
        void main(){ float sd = aB.x * 6.283;
          vec3 p = vec3(position.x * aA.z, aA.y - 90. + position.y * 190., aA.x);
          p.z += sin(uTime * .5 + sd + position.y * 6.) * 1.2 * position.x + sin(uTime * .37 + sd * 2. + position.x * 4.) * .7;   // it billows, slowly
          vM = vec2(p.x, p.y - aA.y); vK = vec4(aA.x, aA.w, aB.x, aB.y); vCot = vec2(aB.z, aA.y);
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + /* glsl */`
        uniform float uCamZ; varying vec2 vM; varying vec3 vW; varying vec4 vK; varying vec2 vCot;
        void main(){ float sd = floor(vK.z * 32. + .5) / 32., ink = floor(vK.w + .5), R = vK.y; vec2 m = vM;
          m += vec2(vn(m * vec2(.9, .22) + sd) - .5, (vn(m * vec2(.25, .8) - sd) - .5) * 1.6) * .9 + (vec2(vn(m * .2 + sd), vn(m * .2 - sd + 7.)) - .5) * 3.4;       // capillary fingers: the edge is pushed in and out, and hangs
          float open = smoothstep(-300., -95., uCamZ - vK.x);                                             // the hole opens as we come
          vec2 q = vec2(max(m.x, 1e-3), m.y * (m.y > 0. ? .8 : 1.));
          float ang = atan(q.y, q.x), rad = length(q), wob = vn(vec2(ang * 2.3, sd)) - .5;
          float r0 = R * mix(.2, 1., open) * (1. + .3 * wob + .12 * (vn(vec2(ang * 7., sd + 3.)) - .5) + .04 * sin(uTime * .7 + ang * 3. + sd));
          float r1 = R * (1. + .3 * wob) + R * (.34 + .55 * vn(vec2(ang * 1.7 + 4., sd * 1.3)));          // the band keeps its outer edge
          float d = min(rad - r0, r1 - rad) / R;
          // the film ends before the wall in a torn edge of its own (the wall's own line up the leaf is ruled: no ink may end on it);
          // only its strands reach the leaf
          d = min(d, ((vM.y + vCot.y) * vCot.x - vM.x - 1.2 - 3.4 * vn(vec2(vM.y * .21 + sd, sd * 1.7)) - 1.3 * vn(vec2(vM.y * .9, sd))) / R * 2.);
          // strands to the wall: thick where they leave the ring, sagging a little, some of them missing
          // (a strand is pulled ink, not a spoke: it wanders as it goes and thins toward the leaf, so neither of its edges is a ruled line)
          float k = (ang - .1 * sin(rad * .07 + sd) + (vn(vec2(rad * .13 + sd, ang * 1.5)) - .5) * .24 + (vn(vec2(rad * .5, ang * 4. + sd)) - .5) * .05) * 2.4 + sd, cell = floor(k), fk = abs(fract(k) - .5);
          float hw = (.3 + .5 * h21(vec2(cell, sd))) * (1. + 2. * exp(-max(rad - r1, 0.) / (R * .5))) * step(.3, h21(vec2(cell, sd + 5.))) * mix(1., .55, smoothstep(r1 + 4., r1 + 30., rad)) * (.55 + 1.1 * vn(vec2(rad * .42 + cell * 7.1, sd)));   // ... and it beads as it thins
          d = max(d, min((hw - fk / 2.4 * rad) / R * 2., (rad - r0) / R));
          d = min(d, (.66 - vn(m * vec2(.19, .15) + sd * 2.3)) * 1.1 + step(r1, rad));                 // torn: small holes in the band
          { vec2 g = m * vec2(.22, .2), c = floor(g), f = fract(g) - .5 - (vec2(h21(c + sd), h21(c - sd + 9.)) - .5) * .5;         // spatter thrown off as it opened
            float keep = step(.6, h21(c * 1.7 + sd + 2.)) * step(r1, rad) * step(rad, r1 + 11.);
            d = max(d, (.06 + .22 * h21(c + sd * 3.) - length(f)) * keep * .4 - (1. - keep)); }
          if (d < 0.) discard;
          float rim = 1. - smoothstep(0., .03, d), tide = smoothstep(.03, .04, d) * (1. - smoothstep(.1, .11, d));
          float sq = fbm3(m * vec2(.16, .12) - sd * 1.7);
          float thin = smoothstep(.55, .57, sq) * .5 + smoothstep(.68, .7, sq) * .4;                      // squeezed washes, in flat steps
          thin = max(thin * (1. - tide), rim * .5);
          vec3 col = wash(ink, thin);
          vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3);
          vec3 n = vec3((vn(m * .21 + sd) - .5) * 1.2, (vn(m * .17 - sd) - .5) * 2.4, -1.); n = n / max(length(n), 1e-4);
          float pool = smoothstep(.5, .56, fbm3(m * .13 + sd * 3.7)) * (1. - rim) * (1. - step(.01, thin));
          col = mix(col, hiAt(ink), smoothstep(.5, .54, slit(n, v, .3, .75) * pool));
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
    const filmMesh = new THREE.Mesh(filmGeo, filmMat); filmMesh.frustumCulled = false; right.add(filmMesh);
    await ctx.yield();
    // ---- THE PRESSED SHEETS: one clear figure for each stretch of the bloom. Between the rings hangs a sheet pressed whole: a broad
    // blot of ONE ink reaching toward both walls (a calm ground), and in its middle, round the opening we fly through, a bold
    // figure in a second ink, hinged on the fold like every blot here (a body on the crease, lobes either side, eyes, the opening
    // its mouth). The grounds take the four washes in the brief's order (orange, sea green, blue, yellow) with the figure black;
    // on the last bridge (from z 1,000, the brief's row) the ground is black and stands as two pillars in the narrow cleft, with
    // the figure a face in carmine and the washes. Each blooms from its figure outward as the lens comes from 104 to 64 m
    // ('new blots blooming in the cleft keyed to our approach'), and tears open round our line from 46 m: by the time it is near
    // it is a collar and strands, and the next figure stands whole inside it.
    const pressGeo = new THREE.InstancedBufferGeometry();
    { const pg = new THREE.PlaneGeometry(1, 1, 6, 16); pg.translate(0.5, 0.5, 0);
      pressGeo.setAttribute('position', pg.attributes.position); pressGeo.setIndex(pg.index);
      const n = pressed.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 2);
      pressed.forEach((f, i) => { const late = f.z >= 1000; A.set([f.z, f.cy, f.W, f.r0], i * 4); B.set([Math.round(f.seed * 32) / 32, late ? 0 : f.ink, late ? f.ink : 0, late ? 1 : 0], i * 4); C.set([f.cot, clamp(f.wx * 0.56, 12.5, 19)], i * 2); });
      pressGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); pressGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); pressGeo.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 2));
      pressGeo.instanceCount = n; pressGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const pressMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: { ...style.uniforms, uCamZ },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec4 aA, aB; attribute vec2 aC; varying vec2 vM; varying vec3 vW; varying vec4 vK, vJ; varying vec2 vC;
        void main(){ float sd = aB.x * 6.283;
          vec3 p = vec3(position.x * aA.z, aA.y - 90. + position.y * 190., aA.x);
          p.z += sin(uTime * .5 + sd + position.y * 6.) * 1.2 * position.x + sin(uTime * .37 + sd * 2. + position.x * 4.) * .7;   // it billows, slowly
          vM = vec2(p.x, p.y - aA.y); vK = vec4(aA.x, aA.w, aB.x, aA.y); vJ = vec4(aB.y, aB.z, aB.w, 0.); vC = aC;
          vec4 w = modelMatrix * vec4(p, 1.); w.xyz = foldW(w.xyz, modelMatrix[1].y); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL_COMMON + FOLD_FRAG + GLSL_BLOT + /* glsl */`
        uniform float uCamZ; varying vec2 vM; varying vec3 vW; varying vec4 vK, vJ; varying vec2 vC;
        void main(){ float sd = floor(vK.z * 32. + .5) / 32., R = vK.y, S = vC.y, D = vK.x - uCamZ, face = step(.5, vJ.z); vec2 m = vM;
          float grow = 1. - smoothstep(64., 104., D), tear = 1. - smoothstep(18., 46., D);
          m += vec2(vn(m * vec2(.9, .22) + sd) - .5, (vn(m * vec2(.25, .8) - sd) - .5) * 1.6) * .9 + (vec2(vn(m * .2 + sd), vn(m * .2 - sd + 7.)) - .5) * 2.6;       // capillary fingers: every edge is pushed in and out
          vec2 q = vec2(max(m.x, 1e-3), m.y); float ang = atan(q.y, q.x), rad = length(q), wob = vn(vec2(ang * 2.3, sd)) - .5;
          // no ink ends on the wall's own ruled line: it stops short in a torn edge
          float marg = ((vM.y + vK.w) * vC.x - vM.x - 1.2 - 3.4 * vn(vec2(vM.y * .21 + sd, sd * 1.7)) - 1.3 * vn(vec2(vM.y * .9, sd))) / R * 2.;
          // the opening: the figure's mouth, torn wide as we come up to it
          float r0 = R * mix(.3, 1.04, tear) * (1. + .3 * wob + .1 * (vn(vec2(ang * 7., sd + 3.)) - .5) + .04 * sin(uTime * .7 + ang * 3. + sd));
          float dH = (rad - r0) / R;
          // THE FIGURE: the blot's own shape about the opening, and a collar round the mouth
          float gF = smoothstep(0., .55, grow), gG = smoothstep(.25, 1., grow);
          float dF = min(blotField(vec2(m.x, m.y + S * .4) / S, sd) * 2.4, (gF * S * .82 - rad) / R + (vn(vec2(ang * 5., sd + 9.)) - .5) * .5 - .3 * (1. - gF));
          dF = min(max(dF, min(dH, (r0 + R * (.4 + .32 * vn(vec2(ang * 1.7 + 4., sd * 1.3))) * mix(1., .5, tear) - rad) / R) - .6 * (1. - gF)), marg);   // (the collar is whole all the way round, and the wider the mouth has torn the thinner it is drawn)
          // THE GROUND: a ring of one ink about the figure, taller than it is wide (on the last bridge tall enough to stand as pillars), torn in a few places
          float rG = max(S * (.74 + .38 * vn(vec2(ang * 1.4 + sd, sd * 2.1))), r0 + R * (.55 + .55 * vn(vec2(ang * 1.9 - sd, sd * 2.7)))) * (1. + (.2 + .95 * face) * abs(sin(ang)));
          float dG = min((rG * gG - rad) / R - .3 * (1. - gG), marg);
          // as the mouth tears wide the ground is drawn out: a band stays about the collar, and beyond it the ink pulls into strands
          // held to the walls (thick where they leave the band, some of them missing), with the cleft showing between them
          { float tr2 = smoothstep(0., .85, tear), rCut = mix(rG + 6., r0 + R * (.75 + .6 * vn(vec2(ang * 1.7 + 4., sd * 1.3 + 2.))), tr2);
            float k = (ang - .1 * sin(rad * .07 + sd) + (vn(vec2(rad * .13 + sd, ang * 1.5)) - .5) * .24 + (vn(vec2(rad * .5, ang * 4. + sd)) - .5) * .05) * 2.4 + sd, cell = floor(k), fk = abs(fract(k) - .5);
            float hw0 = (.3 + .5 * h21(vec2(cell, sd))) * step(.25, h21(vec2(cell, sd + 5.))) * mix(1., .55, smoothstep(rG + 4., rG + 30., rad)) * (.55 + 1.1 * vn(vec2(rad * .42 + cell * 7.1, sd))), hw = hw0 * (1. + 2. * exp(-max(rad - rCut, 0.) / (R * .5)));
            float strand = (hw - fk / 2.4 * rad) / R * 2.;
            // (only the strands' thin ends reach the leaf: the ground itself stops short of the wall in its torn edge)
            dG = max(min(dG, max((rCut - rad) / R, strand)), min(min(strand, max(marg, (hw0 - fk / 2.4 * rad) / R * 2.)), (rG + tr2 * 70. - rad) / R) - step(tr2, .001)); }
          dG = min(dG, (.78 - vn(m * vec2(.11, .085) + sd * 2.3)) * 1.6);
          { vec2 g = m * vec2(.3, .26) + sd * 3., c = floor(g), f = fract(g) - .5 - (vec2(h21(c + 3.), h21(c + 11.)) - .5) * .5;     // the figure's own satellite spatters, lying in the ground
            dF = max(dF, min(mix(-1., (.07 + .21 * h21(c + 5.) - length(f)) * 1.4, step(.66, h21(c * 1.3 + 7.))), min(dG, dH) - .12)); }
          float d = min(max(dF, dG), dH);
          { vec2 g = m * vec2(.22, .2), c = floor(g), f = fract(g) - .5 - (vec2(h21(c + sd), h21(c - sd + 9.)) - .5) * .5;         // spatter thrown off round the ground's rim
            float keep = step(.6, h21(c * 1.7 + sd + 2.)) * step(rG * gG, rad) * step(rad, rG * gG + 9.) * step(.3, gG) * step(0., marg);
            d = max(d, (.06 + .22 * h21(c + sd * 3.) - length(f)) * keep * .4 - (1. - keep)); }
          if (d < 0.) discard;
          float isF = step(0., dF) * step(0., dH);
          // which ink: the ground's, or the figure's (a face takes carmine about its mouth and the washes by lobes beyond)
          float fInk = mix(vJ.y, rad < r0 + R * (.55 + .3 * wob) ? 1. : 2. + mod(floor(ang * 1.6 + sd * 5. + rad / S * 2.) + vJ.y, 4.), face);
          float ink = floor(mix(vJ.x, fInk, isF) + .5);
          float de = mix(min(dG, max(-dF, 0.) + step(dF, -1e-4) * 9.), dF, isF); de = min(de, dH);              // distance to this ink's own edge
          float rim = 1. - smoothstep(0., .03, de), tide = smoothstep(.03, .04, de) * (1. - smoothstep(.1, .11, de));
          float sq = fbm3(m * vec2(.16, .12) - sd * 1.7);
          float thin = smoothstep(.62, .64, sq) * .5 + smoothstep(.74, .76, sq) * .4;                    // squeezed washes, in flat steps (few: the ground is calm)
          thin = max(thin * (1. - tide), rim * .5);
          vec3 col = wash(ink, thin);
          vec3 e = cameraPosition - vW; vec3 v = e / max(length(e), 1e-3);
          vec3 n = vec3((vn(m * .21 + sd) - .5) * 1.2, (vn(m * .17 - sd) - .5) * 2.4, -1.); n = n / max(length(n), 1e-4);
          float pool = smoothstep(.5, .56, fbm3(m * .13 + sd * 3.7)) * (1. - rim) * (1. - step(.01, thin));
          col = mix(col, hiAt(ink), smoothstep(.5, .54, slit(n, v, .3, .75) * pool));
          foldClip(vW, modelMatrix[1].y); gl_FragColor = vec4(col, 1.); }`,
    });
    const pressMesh = new THREE.Mesh(pressGeo, pressMat); pressMesh.frustumCulled = false; right.add(pressMesh);
    await ctx.yield();
    // ---- THE FOLD: everything above was the right half
    const world = style.mirror(right); scene.add(world);
    await ctx.yield();
    // ---- THE SECOND FOLD (rare): at 24 s a horizontal crease opens at path height and everything above it gains a twin
    // below. A y-flipped copy of the whole world, folded about that crease in the vertex stage and clipped to its side.
    let under = null;
    if (rare) {
      style.uniforms.uFold2.value.set(0, 0, 1);
      under = new THREE.Group(); under.scale.y = -1; under.visible = false;
      const a = world.clone(), b = hero.object.clone(); under.add(a, b);
      under.traverse((o) => { o.frustumCulled = false; if (o.name === 'standing') o.visible = false; });   // (the standing blots are down in the valley, far below the second crease: its twin does not need them)
      b.traverse((o) => { if (o.isMesh && o.material.defines && o.material.defines.WING_TIED) o.visible = false; });   // its peel threads are long snapped
      scene.add(under);
      await ctx.yield();
    }

    const camP = new THREE.Vector3(), figP = new THREE.Vector3(), U = cardMat.uniforms;
    U.uBloomLen.value = 300; U.uBloomMin.value = 0.42; U.uBloomBlackZ.value = 836;       // in the web black blooms on approach too
    const figBody = {}, gazeBody = {};
    // the path by distance, sampled once every two metres and read by interpolation: no steps in anything that follows it
    const PT_N = Math.ceil(path.length / 2), ptab = new Float32Array((PT_N + 1) * 3);
    for (let i = 0; i <= PT_N; i++) { path.posAtDist(i * path.length / PT_N, tmp); ptab[i * 3] = tmp.x; ptab[i * 3 + 1] = tmp.y; ptab[i * 3 + 2] = tmp.z; if (i % 40 === 39) await ctx.yield(); }
    const pathAt = (dd, out) => { const f = clamp(dd / path.length, 0, 1) * PT_N, i = Math.min(PT_N - 1, Math.floor(f)), k = f - i, q = i * 3; return out.set(lerp(ptab[q], ptab[q + 3], k), lerp(ptab[q + 1], ptab[q + 4], k), lerp(ptab[q + 2], ptab[q + 5], k)); };
    // THE FIGURE'S COURSE. It is the world's cast, not the ride: it flies the fold ahead of us, its station the lens's own plus a
    // lead that is a law of the place (235 m as it peels, 295 m over the open floor, 200 m in the cleft, closing on the hoop),
    // and everything else is a law of ITS OWN station zF: the height of its middle (off the page, low over the valley with its
    // tail 14 m above the crease, up the cleft's mouth to 45 m over the brief's line, down a little to the hoop), its size (it can
    // never open wider than the page: no more of it than the cleft beside it is wide), its pitch (nose up as it climbs) and how
    // far it is among standing walls. The gaze follows it with one pull. Its station is the lens's z plus the lead: that much of
    // it reads the lens's place; nothing of it reads the lens's height, its place across the fold or its gaze.
    // SAID PLAINLY: every number in this law (the leads 235, 60, 95 and 55 and the places they change at, the heights 30, 40,
    // 160 and 9, the sizes, the pitches) is fitted all along the flight to what the third version's lens-solved pose gave: the
    // third version's keys under another spelling, not reasons of the fold. They are left as they were, untouched, and are to be
    // cured in a later round from the fold's own table.
    const figLaw = (camZ, o) => {
      const uJ = journeySeconds(camZ) / 41;
      o.uJ = uJ; o.lead = 235 + 60 * smoothstep(250, 340, camZ) - 95 * smoothstep(540, 760, camZ) - 55 * smoothstep(830, 1010, camZ);
      const zF = o.zF = Math.min(1150, FIG_Z0 + Math.max(0, Math.max(0, camZ) + o.lead - FIG_Z0) * smoothstep(0.07, 0.2, uJ));
      o.y = 30 + 40 * smoothstep(262, 335, zF) + 160 * smoothstep(835, 1005, zF) - 9 * smoothstep(1030, 1145, zF);
      o.sizeOpen = figShutSizeAt(zF); o.size = Math.min(o.sizeOpen, figSizeAt(zF));
      o.pitch = 0.6 + 0.18 * smoothstep(880, 950, zF) - 0.1 * smoothstep(1050, 1145, zF); o.cleft = smoothstep(880, 945, zF);
      return o;
    };
    // the one pull on the Figure: its place worked out here, from u alone (the lens's place on the route at u, then the course above)
    const gazeLaw = {}, figAt = (time, u) => {
      const L = figLaw(pathAt(clamp(u, 0, 1) * path.length, figP).z, gazeLaw), b = hero.bodyAt(L.uJ, L, gazeBody);
      return figP.set(0, (b.fly < 0.02 ? 4 : b.y * b.fly) + 18 * smoothstep(0.1, 0.2, L.uJ), FIG_Z0 + (b.fly < 0.02 ? 0 : (L.zF - FIG_Z0) * b.fly));
    };
    const flightLaw = {};
    const setClock = (camZ, time) => {
      const tJ = journeySeconds(camZ), uJ = tJ / 41;
      uClock.value = tJ;
      const L = figLaw(camZ, flightLaw), zF = L.zF, lead = L.lead, fb = hero.bodyAt(uJ, L, figBody);
      hero.setFlight(L);
      hero.setProgress(uJ, Math.max(0, camZ) + lead - 235);
      threadMat.uniforms.uFigCut.value.set(zF + 55 * fb.size, 50);
      uRiseZ.value = zF - 110 + 150 * smoothstep(0.1, 0.2, uJ); uCamZ.value = camZ;                     // the standing blots get up in the Figure's wake
      mothMat.uniforms.uFigLine.value.set(0, fb.y * fb.fly + 18 * smoothstep(0.1, 0.2, uJ), FIG_Z0 + (zF - FIG_Z0) * fb.fly, smoothstep(0.2, 0.3, uJ) * (1 - smoothstep(0.86, 0.9, uJ)));
      corona.material.uniforms.uOpen.value = lerp(0.3, 1, smoothstep(690, 1030, camZ));   // the exit's colour bleeds out as we come
      U.uBloomZ.value = camZ + 330;                                   // blots swell from their cores between 330 and 30 m ahead
      U.uGrow.value = 0.9 + 0.1 * (1 - Math.exp(-Math.max(0, time) / 30));   // and every blot is still creeping outward
      if (under) { const k = smoothstep(23.2, 27.5, tJ); style.uniforms.uFold2.value.x = k; under.visible = k > 0.001; }
    };
    setClock(0, 0); hero.update(0, 0, null);
    return {
      scene, path, duration: 41, title: 'Where the Page Was Folded',
      pace: (u) => lerp(lerp(0.92, 1.16, smoothstep(0.1, 0.22, u)), lerp(0.8, 0.86, smoothstep(0.82, 0.92, u)), smoothstep(0.52, 0.72, u)),
      camera: { fov: 62, near: 0.5, far: 7000, lookAhead: 30, sway: 0, bank: 0 },
      pois: [{ at: figAt, from: 0.1, to: 0.83, weight: 0.55 }],
      portal: { shape: 'circle', radius: HOOP_R, color: '#15151A', glow: 0.15, halo: false, revealDistance: 300 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        camP.setFromMatrixPosition(camera.matrixWorld);
        setClock(camP.z, time);
        hero.update(dt, time, camera);                                // also style.update(): the shared clock and the pixel floor of thin things
        sky.position.copy(camP);
      },
      dispose() { style.noMap.dispose(); },
    };
  },
};
