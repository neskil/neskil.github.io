// THE VALLEY UNZIPS: a hill country of worn blue denim, stitched in orange and riveted in copper, where a brass slider
// the size of a church runs down a zip a mile long and the valley parts behind it onto turkey-red cotton.
// STYLE (the law): nothing is lit; shading is wear (vertex attribute), lines are felled seams with separate dashes
// (geometry), metal is two flat tones, the sky is chambray with slubs. Flat switch on: every hex is the colour shown.
// World space is the hero's space: zip on x = 0, course +Z, red plain y 0, denim floor y 4, right of course = -X.
// FIX 1: the entry heads 36 degrees east of the course along the pocket seam with the slider (start z 310) on that axis; the gaze
// is lifted to the slider's hoop for the flight up the V; the parting line is flown 14 m up; the belt loops are doubled straps with
// their own material (wear set only by the distance from the strap's edges) and dash rows; whiskers are thin creases.
// POLISH 2 (outside eye, second round): twelve different pictures. The course (1250 m, 55 s): the pocket seam; high round the knee with the gaze
// dipped (the tear seen whole); down the fall into the V; low up the lining behind the creeping slider; out over the EAST breaker as it begins
// to run (its tab face-on, then the casting from its left with the red wedge at right); high over the east flank as it strikes the stop
// (z 752); back across the zip line above the opened valley; over its right shoulder; down to the slope past a dropped pocket square; the ring.
// Brass and copper carry a third flat tone (tarnish, on faces turned from the afternoon) and a drawn dark edge (a hull, geometry), so the
// casting reads as a solid thing; teeth are edged the same way. The front pockets gape on red bags; a pocket square of the lining's cotton
// lies on the slope; the ridge behind the waistband is taller and folded. Knee: about twenty thin threads, short lip fringe.
// POLISH 3 (outside eye, third round): the cloth is drawn in the metal's hand (five flat indigo tones cut into hard shapes along the grain,
// a thin crisp twill line, slub flecks; see the parts file). The knee's lip is a narrow hard edge with separate threads. The lining carries a
// printed border and medallions from z 404 (its second act). At u 0.43 the path climbs higher and the gaze drops, so the slider and tab stand
// whole over the printed lining. THE ENDING: the exit moved to x -100 at the head of a lead seam (two rows of dashes from z 664 to the
// waistband); the descent is over by u 0.87 and the last 160 m run level and straight at a larger stitched ring (close binding, an outer row
// of dashes, a rubbed pale collar) with the pocket square at its foot and a belt loop arching over the line.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, PALETTE, zipLaw } from '../parts/the-valley-unzips.js';
import { GLSL_ROLL } from '../parts/the-valley-unzips.js';   // R7 s1: flankPos, CALLED by the seams this round lays on the flat cloth beside the zip

const DURATION = 55;
// POLISH 2 route (about 1210 m): pocket seam; high over the knee's east third (the tear seen whole, from above); down the fall into the V;
// low up the lining on the zip line; out over the west breaker and a wide arc over the west flank while the slider runs (seen side-on, far,
// with the whole red wedge); back to the zip line behind the stopped slider; level over its right shoulder; dive to the slope seam; the ring
// REPAIR 3: with the slider on its law (it creeps at 7 m/s until 25 s) the casting stands up to 70 m further south through the middle of
// the flight than the staged table had it, and the lens (22 to 25 m/s) gains 16 to 18 m on it every second it flies along the zip. The
// course is mended in space from the foot of the fall to the east arc, each knot a place of the world (its reason beside it); the knee
// flown round, the fall's upper half, the east arc from (126, 94, 540), the crossing and the ending are live's.
const ROUTE = [
  [-210, 72, 0], [-185.3, 72, 33.7], [-160.7, 73, 67.4],     // the pocket seam, level, to its end
  [-170, 88, 108], [-182, 96, 152], [-164, 88, 194],          // round the west of the knee, the tear below on the left
  [-126, 72, 224],                                            // the head of the fall, over the frayed edge
  [-88, 50, 236], [-52, 29, 244],                             // down the fall, 40 m and more over the west roll (its crest stands to 30 m at x -70)
  [-24, 16, 256], [-9, 12, 283], [-3, 12, 318],               // THE LOW RUN: on the lining between the two rows of teeth, 12 m up, the casting whole ahead; it ends 125 m behind the casting's middle (68 m behind the hanging pull) (125 m is a plain number: about one length of casting and pull)
  [10, 25, 329], [30, 38, 340],                               // THE HERO: up and to the left, 68 to 75 m behind the pull, its face (eye and slot) square to the lens
  [52, 44, 354],                                              // over the east roll (crest to 32 m here, 110 m behind the casting), 12 m clear
  [70, 41, 372], [81, 38, 394],                               // down the outside of the east roll to the flank, 80 m off the line
  [86, 37, 418], [89, 37, 442],                               // THE SIDE ELEVATION (the brief: 'beside the slider ... teeth entering its mouth meshed and leaving parted; it begins to run'): along the closed east flank 86 to 89 m off the line (50 m off the plane of the casting's side), level with its top plate's shoulder, abeam of the red just behind the pull as it begins to run
  [93, 42, 465], [102, 60, 494],                              // it runs away; the lens climbs after it
  [126, 94, 540], [116, 102, 594],                            // the east arc, high: the slider running to its stop, the red wedge it leaves
  [62, 102, 624], [-8, 96, 642], [-70, 93, 670],              // back across the zip line 100 m up, over the stopped casting
  [-89, 73, 697], [-98.5, 50, 721], [-101.5, 39.5, 748],      // down over its right shoulder to the lead seam
  [-101.5, 38, 800], [-101, 41.5, 829], [-100, 54, 903.5]];   // level up the seam to the stitched ring
const pace = (u) => 0.7 + 0.25 * smoothstep(0.05, 0.14, u) + 0.1 * smoothstep(0.2, 0.3, u) - 0.15 * smoothstep(0.36, 0.42, u)
  + 0.25 * smoothstep(0.46, 0.54, u) - 0.25 * smoothstep(0.68, 0.78, u) - 0.1 * smoothstep(0.86, 0.94, u);
// REPAIR 3: THE SLIDER'S LAW, in the journey's own seconds (the seconds the pace function gives for u, never wall time), the brief's:
// it creeps at 7 m/s from where it stands on entry; at 25 s it begins to run, 7 to 38 m/s in three seconds; it strikes the bottom stop
// (centre z 752: the stop is the brass staple at z 800) and stands. A smooth function (zipLaw in the parts file), no table: by its own
// sum it strikes at 33.5 s. Z_START 300 is where the line of the pocket seam (the entry's axis) meets the zip, the slider's rear on it.
const ZIP = { start: 300, stop: 752, creep: 7, top: 38, runAt: 25, spin: 3 };

// colourways: [cloth, fade, most-worn, stitch, zip metal, cotton, chambray] + the tones the style kit hard-codes
const WAYS = {
  indigo: { pal: PALETTE, raw: '#1B2B4A', wrong: '#C9D3E0', polish: '#E9D69A', dot: '#F3EFE4', deep: '#A92C25', stitchDark: '#B5631C', tick: 0 },
  black: { pal: ['#2B2C32', '#8B9098', '#D9D5CB', '#EFECE4', '#A7AFB8', '#D2A32C', '#C6D0DA'], raw: '#16171B', wrong: '#B4B8BF',
    polish: '#E6EBEF', dot: '#F3EFE4', deep: '#B98A1E', stitchDark: '#BDB9AE', tick: 0 },
  ecru: { pal: ['#D3C6A7', '#E6DDC8', '#F3EEE2', '#27406B', '#C9A24A', '#35558C', '#BFD0E4'], raw: '#A39473', wrong: '#F1ECDF',
    polish: '#E9D69A', dot: '#E9E4D6', deep: '#2B477A', stitchDark: '#1B2B4A', tick: 1 },
};

export default {
  id: 'the-valley-unzips',
  name: 'The Valley Unzips',
  category: 'bizarre',
  weirdness: 0.75,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, renderer = ctx.renderer;
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // ---- the seeded look: wash x colourway x hour ---------------------------------------------------------------
    const vr = rng.fork ? rng.fork('look') : rng;
    const a = vr(), b = vr(), c = vr();
    const wash = a < 0.12 ? 'raw' : a < 0.27 ? 'worn' : a < 0.5 ? 'stonewashed' : a < 0.8 ? 'worn' : 'raw';
    const wayId = b < 0.45 || b > 0.9 ? 'indigo' : b < 0.7 ? 'black' : 'ecru';
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : (c < 0.6 ? 'day' : c < 0.84 ? 'golden' : c < 0.93 ? 'dawn' : 'night');
    const way = WAYS[wayId], night = hour === 'night';
    const washK = wash === 'raw' ? -0.17 : wash === 'stonewashed' ? 0.2 : 0;      // added to every baked wear value
    const breeze = clamp(0.75 + 0.5 * (vary.mood ?? 0.5), 0.7, 1.3);
    const style = makeStyle(ctx, { palette: way.pal, breeze });
    const P = style.palette, U = style.uniforms;
    P.raw.set(way.raw); P.wrong.set(way.wrong); P.brassPolish.set(way.polish); P.white.set('#F3EFE4');
    P.orangeDark.set(way.stitchDark); P.redDeep.set(way.deep);
    if (night) {                                           // the cloth raw dark; stitches and brass unchanged, no lamps
      P.indigo.lerp(P.raw, 0.55); P.fade.lerp(P.indigo, 0.5); P.ecru.lerp(P.fade, 0.45); P.wrong.lerp(P.indigo, 0.45);
      P.raw.multiplyScalar(0.8); P.red.multiplyScalar(0.8); P.redDeep.multiplyScalar(0.8);
    }
    const skyHex = { day: way.pal[6], golden: '#E9D9BC', dawn: '#CFD8E6', night: '#1E2B47' }[hour] || way.pal[6];
    const slubHex = { day: '#E6DDC8', golden: '#E3A9A0', dawn: '#F0DCD0', night: '#93A3C0' }[hour] || '#E6DDC8';
    P.chambray.set(skyHex);
    if (hour === 'golden') U.uRight.value.set(-1, -0.42, 0.12).normalize();       // the polish moved low
    if (hour === 'dawn') U.uRight.value.set(1, 0.28, 0.12).normalize();           // the polish on the left
    const scene = new THREE.Scene();
    scene.background = P.chambray.clone();
    const sky = style.sky(); sky.material.uniforms.cSlub.value = new THREE.Color(slubHex); scene.add(sky);
    await ctx.yield();

    // ---- path, pace and the journey clock (the slider's schedule is in journey seconds) ---------------------------
    const path = makePath(ROUTE);
    const NT = 256, tTab = new Float32Array(NT + 1);
    { let acc = 0; for (let i = 1; i <= NT; i++) { acc += 1 / clamp(pace((i - 0.5) / NT), 0.35, 2.5); tTab[i] = acc; }
      for (let i = 0; i <= NT; i++) tTab[i] *= DURATION / acc; }
    const secAt = (u) => { const f = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(f)); return lerp(tTab[i], tTab[i + 1], f - i); };
    const uAt = (sec) => { let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tTab[m] < sec) lo = m; else hi = m; }
      return (lo + clamp((sec - tTab[lo]) / Math.max(tTab[hi] - tTab[lo], 1e-6), 0, 1)) / NT; };

    // ---- the hero: the zip, its teeth, the slider and tab, the rolling flanks, the red plain ----------------------
    const zipZ = zipLaw(ZIP), sliderAtU = (u) => zipZ(secAt(u));          // where the slider stands when the flight has come to u
    const hero = await buildHero(ctx, { style, detail, wash, billow: 1.5, duration: DURATION, demo: false, law: zipZ });
    scene.add(hero.object);
    hero.parts.plain.material.uniforms.cDot.value = new THREE.Color(way.dot);
    if (hero.parts.plain.material.uniforms.uTick) hero.parts.plain.material.uniforms.uTick.value = way.tick;
    if (hero.parts.plain.material.uniforms.uPrint) hero.parts.plain.material.uniforms.uPrint.value = 1;   // POLISH 3: the lining's second act, a printed border and medallions: the part begins its print at z 404 (its factor step(404.0, p.y)); the block 'lining-print' below carries the same print south of there
    await ctx.yield();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const cutU = hero.parts.flank.material.uniforms;
    const disposables = [], updaters = [];

    // ---- the lie of the land: one height function for terrain, seams, stitches, rivets ---------------------------
    const kneeWide = rare || wash === 'stonewashed';
    const KV = -22;                                         // the path crosses the knee 22 m east of its middle
    const KN = { x: -133 - 0.844 * KV, z: 123 + 0.536 * KV, dx: 0.536, dz: 0.844, a: 52, b: kneeWide ? 71 : 60, floor: 5 };
    const kneeD = (x, z) => { const px = x - KN.x, pz = z - KN.z; return Math.hypot((px * KN.dx + pz * KN.dz) / KN.a, (px * KN.dz - pz * KN.dx) / KN.b); };
    cutU.uCut.value.set(KN.x, KN.z, KN.a * 0.97, KN.b * 0.97); cutU.uCutDir.value.set(KN.dx, KN.dz);
    const bulge = (z) => 95 * smoothstep(-140, -20, z) * (1 - smoothstep(170, 265, z));
    const inZone = (x, z) => Math.abs(x) < 155 && z < 820 && z > -800;
    const sA = rng.range(0, 50), sB = rng.range(0, 50);
    // WRINKLES: the hills are rumpled cloth. Two families of long folds with sharp crests, written in sines only so
    // that the terrain shader can draw the same crest (a thin rubbed line) and hollow (a raw dark line) at any distance
    const W1 = 0.6 + rng.range(-0.25, 0.25), W2 = W1 + 1.9, WA = [Math.cos(W1), Math.sin(W1), Math.cos(W2), Math.sin(W2), sA * 0.13, sB * 0.13];
    const fold1 = (x, z) => Math.sin(0.021 * (x * WA[0] + z * WA[1]) + 1.8 * Math.sin(0.0063 * (-x * WA[1] + z * WA[0]) + WA[4]) + 0.9 * Math.sin(0.011 * (x * 0.7 + z * 0.5)));
    const fold2 = (x, z) => Math.sin(0.047 * (x * WA[2] + z * WA[3]) + 1.5 * Math.sin(0.012 * (-x * WA[3] + z * WA[2]) + WA[5]) + 0.8 * Math.sin(0.017 * (x * 0.4 - z * 0.8)));
    const foldMask = (x, z) => { const B = x < 0 ? bulge(z) : 0, e0 = Math.abs(x) - 155; return smoothstep(50, 230, e0 + B) * lerp(1, 0.3, B / 95) * (1 - smoothstep(790, 830, z)); };
    const ridge = (f) => { const r = 0.5 + 0.5 * f; return r * r * r * r; };
    const foldN = (z) => smoothstep(945, 1020, z);
    function landRaw(x, z) {
      const west = x < 0, B = west ? bulge(z) : 0, e = Math.abs(x) - 155 + B, e0 = Math.abs(x) - 155;
      let h = 0;
      if (e > 0) {
        const und = noise.fbm2(x * 0.0035 + sA, z * 0.0035 + sB, 3), wide = lerp(150, 62, B / 95);
        h = 60 * smoothstep(0, wide, e) * (1 - 0.12 * smoothstep(0, 60, e - wide) * (1 - B / 95));
        h += 34 * smoothstep(60, 260, e0) * (0.75 + 0.45 * und) + 16 * und * smoothstep(120, 300, e0);
        h += 210 * smoothstep(260, 780, e0) * (0.6 + 0.4 * noise.fbm2(x * 0.0021 + sB, z * 0.0026 + sA, 2));     // the far ridges stand to the top third of the frame
        h += foldMask(x, z) * (17 * ridge(fold1(x, z)) + 7 * ridge(fold2(x, z)));
        h += 5 * noise.n2(x * 0.011 + sA, z * 0.011) * smoothstep(20, 120, e0);
      }
      if (west && B > 0) {                                   // the pocket hill leans down toward the valley head, so the zip shows over it
        const sAl = (x + 210) * 0.5906 + z * 0.807;
        h *= lerp(1, 1 - 0.22 * smoothstep(10, 80, sAl) - 0.36 * smoothstep(80, 190, sAl), B / 95);
        const sLat = (x + 210) * 0.807 - z * 0.5906;         // metres to the valley side of the entry line
        h *= 1 - 0.6 * smoothstep(5, 60, sAl) * smoothstep(6, 30, sLat) * (1 - smoothstep(55, 110, z)) * (B / 95);     // the valley-side shoulder falls away faster, before the knee
        h *= 1 - 0.58 * Math.exp(-((x + 112) * (x + 112) + (z - 90) * (z - 90)) / 2100);      // a sag in the shoulder, on the sight line from the entry to the red wedge
      }
      const ramp = 28 * smoothstep(815, 905, z) + 6 * smoothstep(905, 1100, z);
      h = 4 + ramp + h * (1 - 0.25 * ramp / 34);
      const fN = foldN(z);
      h += (290 * (1 - 0.6 * Math.exp(-((x + 100) * (x + 100)) / 14400)) * smoothstep(925, 1090, z) * (0.72 + 0.28 * noise.fbm2(x * 0.004 + sA, 7.7, 2)) + fN * (24 * ridge(fold1(x, z)) + 9 * ridge(fold2(x, z)))) * (1 - smoothstep(500, 800, Math.abs(x)));   // the rise behind the waistband closes the valley head
      const kd = kneeD(x, z);
      if (kd < 1.05) h = lerp(KN.floor, h, smoothstep(0.80, 1.0, kd));
      return h;
    }
    let carved = 0;
    function land(x, z) {                                    // with the corridor carved: cloth stays 8 m under the lens
      let h = landRaw(x, z); carved = 0;
      if (h > 6 && x > -300 && x < 40 && z > -40 && z < 940) {
        const n = path.nearestXZ(x, z);
        if (n.dist < 34) { const h2 = Math.min(h, lerp(n.y - 8, h, smoothstep(10, 34, n.dist))); carved = h - h2; h = h2; }
      }
      return h;
    }
    // panels: each is cut with its own grain (rib along the direction of travel where we fly over it)
    const grainOf = (x, z) => (z > 820 ? 0.10 : x < 0 ? (z < 290 ? 0.56 : 0.07) : -0.12);

    const NX = Math.round(228 * (0.75 + 0.25 * detail)), NZ = Math.round(258 * (0.75 + 0.25 * detail));
    const gx = new Float32Array(NX + 1), gz = new Float32Array(NZ + 1);
    for (let i = 0; i <= NX; i++) { const t = (i / NX) * 2 - 1; gx[i] = 320 * t + 600 * t * t * t; }
    for (let j = 0; j <= NZ; j++) { const t = (j / NZ) * 2 - 1; gz[j] = 250 + 520 * t + 330 * t * t * t; }
    const nV = (NX + 1) * (NZ + 1), hs = new Float32Array(nV), tp = new Float32Array(nV * 3), tuv = new Float32Array(nV * 2), tw = new Float32Array(nV), tfold = new Float32Array(nV);
    const floorV = new Uint8Array(nV);
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const k = j * (NX + 1) + i, x = gx[i], z = gz[j], h = land(x, z);
        hs[k] = h; floorV[k] = inZone(x, z) && h <= 4.05 ? 1 : 0; tfold[k] = Math.max(foldMask(x, z), foldN(z) * (1 - smoothstep(500, 800, Math.abs(x)))) * (1 - smoothstep(0.5, 6, carved));
        tp[k * 3] = x; tp[k * 3 + 1] = floorV[k] ? 3.1 : h; tp[k * 3 + 2] = z;
        const g = grainOf(x, z), cg = Math.cos(g), sg = Math.sin(g);
        tuv[k * 2] = x * cg - z * sg; tuv[k * 2 + 1] = x * sg + z * cg;
      }
      await ctx.yield();
    }
    // WEAR is the only shading: crests and convex places rubbed pale, hollows raw dark, plus low noise and the wash
    const nightK = night ? -0.06 : 0;
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) {
        const k = j * (NX + 1) + i, x = gx[i], z = gz[j], h = hs[k];
        const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, NX), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZ);
        const dxm = Math.max(gx[i1] - gx[i0], 1) * 0.5, dzm = Math.max(gz[j1] - gz[j0], 1) * 0.5;
        const lap = (hs[j * (NX + 1) + i0] + hs[j * (NX + 1) + i1] - 2 * h) / (dxm * dxm) + (hs[j0 * (NX + 1) + i] + hs[j1 * (NX + 1) + i] - 2 * h) / (dzm * dzm);
        const sl = Math.hypot((hs[j * (NX + 1) + i1] - hs[j * (NX + 1) + i0]) / (2 * dxm), (hs[j1 * (NX + 1) + i] - hs[j0 * (NX + 1) + i]) / (2 * dzm));
        let w = 0.30 + clamp(-lap * 14, -0.12, 0.10) * (1 - 0.8 * smoothstep(0.5, 1.1, sl)) * lerp(1, 0.25, smoothstep(40, 160, Math.abs(x) - 155 + (x < 0 ? bulge(z) : 0)));
        { const a0 = Math.max(i - 4, 0), a1 = Math.min(i + 4, NX), b0 = Math.max(j - 4, 0), b1 = Math.min(j + 4, NZ), ddx = Math.max(gx[a1] - gx[a0], 1) * 0.5, ddz = Math.max(gz[b1] - gz[b0], 1) * 0.5;
          const lap4 = (hs[j * (NX + 1) + a0] + hs[j * (NX + 1) + a1] - 2 * h) / (ddx * ddx) + (hs[b0 * (NX + 1) + i] + hs[b1 * (NX + 1) + i] - 2 * h) / (ddz * ddz);
          w += clamp(-lap4 * 14, -0.08, 0.05) * smoothstep(-20, 40, Math.abs(x) - 155);                                 // hill-scale: crests pale, hollows raw
          }   // whisker creases across the slopes                                    // curvature
        const e0 = Math.abs(x) - 155;
        w += 0.03 * smoothstep(30, 110, h) * smoothstep(0, 60, e0) - 0.08 * smoothstep(0.5, 1.3, sl);   // heights rubbed, steep faces kept raw
        w += (0.10 * noise.fbm2(tuv[k * 2] * 0.017 + sB, tuv[k * 2 + 1] * 0.0023 + sA, 3) + 0.05 * noise.n2(tuv[k * 2] * 0.04, tuv[k * 2 + 1] * 0.006 + sA)) * smoothstep(0, 40, e0 + 60);   // POLISH 3: slivers along the grain, not round patches
        w += 0.12 * smoothstep(815, 850, z) * (1 - smoothstep(905, 912, z));   // whiskers across the worn slope
        const kd = kneeD(x, z);
        w += 0.26 * smoothstep(0.90, 1.0, kd) * (1 - smoothstep(1.03, 1.13, kd)) - 0.3 * (1 - smoothstep(0.8, 0.95, kd));   // frayed lips pale, the pit raw
        const fl = clamp((h - 4) / 6, 0, 1);                                             // settle to the flank's tone at the join
        tw[k] = clamp(lerp(0.32, w, e0 > 0 ? smoothstep(0, 30, e0) : fl), 0.02, 1);      // the wash is added in the shader, after the shapes are cut
      }
      if (j % 2 === 1) await ctx.yield();
    }
    const tix = [];
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) {
        const k = j * (NX + 1) + i, k2 = k + NX + 1;
        if (floorV[k] && floorV[k + 1] && floorV[k2] && floorV[k2 + 1] && Math.abs(gx[i]) < 152 && Math.abs(gx[i + 1]) < 152) continue;   // the hero's ground
        const cx = (gx[i] + gx[i + 1]) * 0.5, cz = (gz[j] + gz[j + 1]) * 0.5;
        if (kneeD(cx, cz) < 0.7) continue;                                               // the red shows at the bottom of the knee
        tix.push(k, k2, k + 1, k + 1, k2, k2 + 1);
      }
      if (j % 15 === 14) await ctx.yield();
    }
    const terrGeo = new THREE.BufferGeometry();
    terrGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    terrGeo.setAttribute('uv', new THREE.BufferAttribute(tuv, 2));
    terrGeo.setAttribute('aWear', new THREE.BufferAttribute(tw, 1));
    terrGeo.setIndex(tix); terrGeo.boundingSphere = new THREE.Sphere(V3(0, 0, 250), 1500);
    terrGeo.setAttribute('aFold', new THREE.BufferAttribute(tfold, 1));
    const denimMat = style.denim({ billow: 1.5 });
    // the hills' own cloth: the baked wear cut into crisp shapes, a thin rubbed line on every fold crest, a raw line in
    // every hollow, and whisker fans (five sharp creases each) spreading downhill from the rivets and seam ends
    const NFAN = 20, fans = []; for (let i = 0; i < NFAN; i++) fans.push(new THREE.Vector4(1e6, 1e6, 0, 100));
    const terrMat = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), uBillow: { value: 1.5 }, uFan: { value: fans }, uWash: { value: washK + nightK },
        uWA: { value: new THREE.Vector4(WA[0], WA[1], WA[2], WA[3]) }, uWB: { value: new THREE.Vector2(WA[4], WA[5]) } },
      vertexShader: style.glsl.common + /* glsl */`
        attribute float aWear; attribute float aFold; uniform float uBillow; varying vec2 vUv; varying float vWear; varying float vFoldK; varying vec2 vXZ;
        void main(){ vUv = uv; vWear = aWear; vFoldK = aFold; vec4 wp = modelMatrix * vec4(position, 1.0); vXZ = wp.xz;
          wp.y += uBillow * denimBillow(wp.xz, uTime);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
        uniform vec4 uFan[${NFAN}]; uniform vec4 uWA; uniform vec2 uWB; uniform float uWash; varying vec2 vUv; varying float vWear; varying float vFoldK; varying vec2 vXZ;
        void main(){ vec2 p = vXZ; float fw = fwidth(vWear) + 1e-4; float aa = 0.5 * (fwidth(p.x) + fwidth(p.y)) + 1e-3;
          float wear = vWear + 0.12 * smoothstep(0.47 - fw, 0.47 + fw, vWear) + 0.10 * smoothstep(0.62 - fw, 0.62 + fw, vWear) - 0.10 * (1.0 - smoothstep(0.20 - fw, 0.20 + fw, vWear));
          float f1 = sin(0.021 * (p.x * uWA.x + p.y * uWA.y) + 1.8 * sin(0.0063 * (-p.x * uWA.y + p.y * uWA.x) + uWB.x) + 0.9 * sin(0.011 * (p.x * 0.7 + p.y * 0.5)));
          float f2 = sin(0.047 * (p.x * uWA.z + p.y * uWA.w) + 1.5 * sin(0.012 * (-p.x * uWA.w + p.y * uWA.z) + uWB.y) + 0.8 * sin(0.017 * (p.x * 0.4 - p.y * 0.8)));
          float thin = 1.0 - smoothstep(1.5, 5.0, aa);                       // lines thinner than a pixel melt into the tone
          float crest = max(smoothstep(0.9930, 0.9965, f1), smoothstep(0.9900, 0.9950, f2) * thin);
          float hollow = max(smoothstep(0.9930, 0.9965, -f1), 0.7 * smoothstep(0.9900, 0.9950, -f2) * thin);
          float side = smoothstep(0.55, 0.57, f1) * (1.0 - smoothstep(0.62, 0.64, f1)) * step(0.55, dnNoise(p * 0.011));   // a broken crease on the fold's shoulder
          wear += vFoldK * (0.46 * crest + 0.22 * side * thin - 0.30 * hollow);
          float fan = 0.0;
          for (int i = 0; i < ${NFAN}; i++) { vec4 F = uFan[i]; vec2 d = p - F.xy; vec2 dir = vec2(cos(F.z), sin(F.z));
            float u = dot(d, dir), v = d.x * dir.y - d.y * dir.x; float q = v / max(u, 4.0) / 0.15; float k = floor(q + 0.5);
            float len = F.w * (0.55 + 0.45 * fract(sin(k * 12.9898 + F.z * 7.0) * 43758.5453));
            float dist = abs(q - k) * 0.15 * max(u, 4.0);
            float line = (1.0 - smoothstep(0.8, 0.8 + aa, dist)) * (1.0 - step(2.5, abs(k))) * smoothstep(7.0, 18.0, u) * (1.0 - smoothstep(0.75 * len, len, u));
            fan = max(fan, line); }
          // the worn slope under the waistband: whiskers, thin crisp creases running up it, each its own length
          float sa = p.x * 0.085 + 0.9 * dnNoise(vec2(p.x * 0.01, p.y * 0.02)); float si = floor(sa + 0.5);
          float sh = dnHash(vec2(si * 1.7 + 3.0, 9.0)), sz = 817.0 + 30.0 * dnHash(vec2(si * 2.3 + 1.0, 5.0));
          float sd = abs(sa - si - 0.3 * (sh - 0.5)) / 0.085;
          float sl = (1.0 - smoothstep(0.42, 0.42 + aa, sd)) * step(0.35, sh) * smoothstep(sz, sz + 4.0, p.y)
            * (1.0 - smoothstep(sz + 25.0 + 40.0 * sh, sz + 32.0 + 40.0 * sh, p.y)) * (1.0 - smoothstep(902.0, 907.0, p.y));
          wear += 0.40 * fan * thin + 0.36 * sl * thin + uWash;
          gl_FragColor = vec4(denimColor(vUv, clamp(wear, 0.0, 1.0), true), 1.0); }`,
    });
    const terrain = new THREE.Mesh(terrGeo, terrMat); terrain.name = 'denim-hills'; terrain.frustumCulled = false; scene.add(terrain);
    await ctx.yield();

    // ---- SEAMS: a line is a seam, a raised felled ridge with two rows of separate dashes, built as geometry -------
    const GLSL_PUCKER = /* glsl */`
      // a pucker travels down every seam: a 1 m swell 12 m long, one every 110 m, at 13 m/s
      float seamPucker(float along){ float c = mod(along - uTime * 13.0, 110.0) - 55.0; return 1.15 * exp(-c * c / 38.0) + 0.22 * sin(along * 0.37); }`;
    const seamMat = new THREE.ShaderMaterial({
      uniforms: style.clothUniforms(),
      vertexShader: style.glsl.common + GLSL_PUCKER + /* glsl */`
        attribute float aWear; attribute float aCrown; varying vec2 vUv; varying float vWear;
        void main(){ vUv = uv; vWear = aWear; vec4 wp = modelMatrix * vec4(position, 1.0);
          wp.y += 1.5 * denimBillow(wp.xz, uTime) + aCrown * seamPucker(uv.y);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      // REPAIR 3 (the opening): the rubbed crown of a seam under the lens was one flat pale shape. Within about 40 m of the lens it now
      // shows its cloth (the brief: 'denim at 5 m: single yarns as slubby indigo cords with ecru peeping between'): short hard strokes of
      // worn indigo warp lying along the seam on the pale crown, each a yarn; further off they are under a pixel and melt into the tone
      fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
        varying vec2 vUv; varying float vWear;
        void main(){ vec3 col = denimColor(vUv, vWear, true);
          float mpp = fwidth(vUv.x) + fwidth(vUv.y), nearK = 1.0 - smoothstep(0.035, 0.11, mpp);
          float yn = dnNoise(vec2(vUv.x * 3.1 + 2.0 * dnNoise(vUv * 0.37 + 7.0), vUv.y * 0.55)), ay = clamp(fwidth(yn), 1e-4, 0.2);
          float cord = smoothstep(0.56 - ay, 0.56 + ay, yn) * nearK * smoothstep(0.58, 0.8, vWear);
          gl_FragColor = vec4(mix(col, mix(cFade, cIndigo, 0.35), 0.8 * cord), 1.0); }`,
    });
    // cords: stitches, bar tacks, loose tails. Instanced or not; ride the billow and the pucker; aSway lifts a loose end
    const cordMat = (col, dark, billow = 1.5) => new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), cA: { value: col }, cB: { value: dark }, cH: { value: P.raw }, uBillow: { value: billow } },
      vertexShader: style.glsl.common + GLSL_PUCKER + /* glsl */`
        attribute float aAlong; attribute float aSway; uniform float uBillow; varying vec2 vUv;
        void main(){ vUv = uv; vec3 lp = position;
          #ifdef USE_INSTANCING
            vec3 org = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            lp.x *= mix(max(1.0, distance(org, cameraPosition) * 0.0045), 1.0, step(1.5, uv.y));   // a dash stays a line of orange far off; its holes keep their own size
            vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.0);
          #else
            vec4 wp = modelMatrix * vec4(lp, 1.0);
          #endif
          wp.y += uBillow * denimBillow(wp.xz, uTime) + step(0.5, aAlong) * seamPucker(aAlong + position.z);
          float k = aSway * aSway * uBreeze;
          wp.y += k * (5.0 + 4.5 * sin(uTime * 0.7 + wp.x * 0.031 + wp.z * 0.043));
          wp.x += k * 2.5 * sin(uTime * 1.1 + wp.z * 0.09); wp.z += k * 1.8 * sin(uTime * 0.83 + wp.x * 0.07);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform vec3 cA, cB, cH; varying vec2 vUv;
        void main(){ if (vUv.y > 1.5) { gl_FragColor = vec4(cH, 1.0); return; }      // the hole a stitch dives into (uv.y 2 on a near dash)
          float t = vUv.x / 0.9 + vUv.y * 0.9; float fw = fwidth(t);
          float ply = smoothstep(0.72 - fw, 0.72 + fw, abs(fract(t) - 0.5) * 2.0) * (1.0 - smoothstep(0.15, 0.35, fw));
          gl_FragColor = vec4(mix(cA, cB, ply), 1.0); }`,
    });
    // REPAIR 3 (the opening): a near stitch is a hoop of thread with its two holes in the cloth (the brief: 'each stitch a separate two-ply
    // dash ... dimpled where it dives into the cloth'): the dash's own geometry, and at each end a small raw-dark hole it goes down into
    const holedStitch = (geo) => {
      const pos = Array.from(geo.attributes.position.array), uvs = Array.from(geo.attributes.uv.array), idx = Array.from(geo.index.array);
      for (const zc of [-3.25, 3.25]) { const b = pos.length / 3; pos.push(0, 0.02, zc); uvs.push(0, 2);
        for (let i = 0; i < 10; i++) { const an = (i / 10) * Math.PI * 2; pos.push(Math.cos(an) * 0.66, 0.02, zc + Math.sin(an) * 0.52); uvs.push(0, 2); }
        for (let i = 0; i < 10; i++) idx.push(b, b + 1 + (i + 1) % 10, b + 1 + i); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1)); g.setIndex(idx); geo.dispose(); return g; };
    // the seam plan, [x, z] control points. near: stitched with full dashes; far: coarse ribbon only
    const POCKET = [[-203, 37], [-415, 170], [-480, 60], [-380, -110], [-252, -45]];
    const wob = (pts, amp) => pts.map(([x, z], i) => (i === 0 || i === pts.length - 1 ? [x, z] : [x + amp * noise.n2(z * 0.004 + sA, i * 3.1), z + amp * noise.n2(x * 0.004 + sB, i * 1.7)]));
    const SEAMS = [
      { id: 'pocket-seam', pts: [[-240.7, -42], [-210, 0], [-185.3, 33.7], [-155, 75]], near: 2, tack: [0, 1] },
      { id: 'pocket-rim-a', pts: [POCKET[4], [-228, -4], POCKET[0]], near: 2 },
      { id: 'pocket-mouth', pts: [POCKET[0], [-300, 96], POCKET[1]], near: 2 },
      { id: 'pocket-b', pts: [POCKET[1], POCKET[2], POCKET[3], POCKET[4]], near: 1, sharp: true },
      { id: 'west-side', pts: wob([[-345, -330], [-330, -60], [-322, 200], [-300, 420], [-322, 640], [-300, 815], [-290, 898]], 22), near: 1 },
      { id: 'east-side', pts: wob([[320, -330], [300, -40], [322, 230], [296, 470], [318, 700], [300, 898]], 22), near: 1 },
      { id: 'west-yoke', pts: [[-158, 292], [-240, 288], [-322, 300], [-480, 318], [-800, 300]], near: 1, tack: [1, 0] },
      { id: 'east-yoke', pts: [[158, 215], [240, 190], [322, 180], [520, 120], [800, 70]], near: 1, tack: [1, 0] },
      { id: 'east-yoke-2', pts: [[158, 610], [250, 640], [318, 650], [520, 700], [800, 690]], near: 1, tack: [1, 0] },
      { id: 'west-yoke-2', pts: [[-158, 560], [-240, 590], [-318, 600], [-520, 650], [-800, 640]], near: 1, tack: [1, 0] },
      { id: 'slope', pts: [[-100, 664], [-100.6, 720], [-100, 776], [-100.4, 824], [-100, 862], [-100, 895]], near: 2, tack: [1, 0] },   // POLISH 3: the lead seam, straight to the ring
      { id: 'hem', pts: wob([[-800, 838], [-300, 832], [-158, 828], [0, 826], [158, 828], [300, 834], [800, 842]], 5), near: 1 },
      // the front pockets: two long curved mouths from the waistband out to the side seams, and the coin pocket inside the west one
      { id: 'pocket-mouth-w', pts: [[-116, 900], [-150, 862], [-205, 800], [-262, 730], [-302, 662]], near: 1, tack: [1, 1] },
      { id: 'pocket-mouth-e', pts: [[116, 900], [150, 862], [205, 800], [262, 730], [300, 656]], near: 1, tack: [1, 1] },
      { id: 'coin-pocket', pts: [[-178, 897], [-188, 856], [-236, 850], [-248, 893]], near: 1, sharp: true },
      { id: 'far-west', pts: wob([[-610, -330], [-590, 100], [-620, 500], [-585, 898]], 30), near: 0 },
      { id: 'far-east', pts: wob([[600, -330], [620, 150], [585, 520], [610, 898]], 30), near: 0 },
    ];
    const XS = [[-6.4, 0.05, 0.10], [-4.6, 0.12, 0.03], [-3.7, 1.7, 0.74], [-2.2, 2.05, 0.92], [0, 1.9, 0.76], [2.2, 2.05, 0.92], [3.7, 1.7, 0.74], [4.6, 0.12, 0.03], [6.4, 0.05, 0.10]];
    const sp = [], suv = [], swr = [], scr = [], six = [], stFull = [], stLite = [], tacks = [], seamInfo = {};
    const m4 = new THREE.Matrix4(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3();
    const frameAt = (x, y, z, dx, dy, dz) => { bz.set(dx, dy, dz).normalize(); bx.set(bz.z, 0, -bz.x).normalize(); by.crossVectors(bz, bx); return m4.makeBasis(bx, by, bz).setPosition(x, y, z); };
    let alongBase = 20;
    for (const S of SEAMS) {
      const curve = S.sharp ? new THREE.CurvePath() : new THREE.CatmullRomCurve3(S.pts.map(([x, z]) => V3(x, 0, z)), false, 'centripetal');
      if (S.sharp) for (let i = 0; i + 1 < S.pts.length; i++) curve.add(new THREE.LineCurve3(V3(S.pts[i][0], 0, S.pts[i][1]), V3(S.pts[i + 1][0], 0, S.pts[i + 1][1])));
      const len = curve.getLength(), step = S.near === 2 ? 3.5 : S.near === 1 ? 6 : 12, n = Math.max(2, Math.round(len / step));
      const pts = curve.getSpacedPoints(n), base = sp.length / 3, samples = [];
      for (let i = 0; i <= n; i++) {
        const p = pts[i], q0 = pts[Math.max(i - 1, 0)], q1 = pts[Math.min(i + 1, n)];
        let tx = q1.x - q0.x, tz = q1.z - q0.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const nx = tz, nz = -tx, along = alongBase + (i / n) * len, endK = smoothstep(0, 9, Math.min(i, n - i) * (len / n));
        const row = [];
        for (let c = 0; c < XS.length; c++) {
          const [o, hh, ww] = XS[c], x = p.x + nx * o, z = p.z + nz * o, y = land(x, z) + hh * (0.25 + 0.75 * endK) + 0.12;
          sp.push(x, y, z); suv.push(o + base * 0.37, along); swr.push(clamp(ww + washK * 0.6 + nightK, 0.02, 1)); scr.push(hh > 1 ? endK : 0); row.push(y);
          if (i < n && c < XS.length - 1) { const k = base + i * XS.length + c, k2 = k + XS.length; six.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
        }
        samples.push({ x: p.x, z: p.z, tx, tz, nx, nz, along, yl: row[3], yr: row[5], yc: row[4] });
        if (i % 30 === 29) await ctx.yield();
      }
      seamInfo[S.id] = samples;
      // two rows of separate dashes, 7 m long with a 3 m gap; the hand wanders half a metre and skips one in forty
      if (S.near > 0) for (let r = 0; r < 2; r++) {
        for (let d = 6 + r * 4.5; d < len - 8; d += 10) {
          if (((d / 10) | 0) % 30 === 29) await ctx.yield();
          if (rng() < 0.025) continue;
          const f = (d / len) * n, i = Math.min(n - 1, Math.floor(f)), a0 = samples[i], a1 = samples[i + 1], t = f - i;
          const o = (r === 0 ? -2.2 : 2.2) + 0.5 * noise.n2(d * 0.03 + alongBase, r * 9.1);
          const x = lerp(a0.x, a1.x, t) + a0.nx * o, z = lerp(a0.z, a1.z, t) + a0.nz * o;
          const y0 = r === 0 ? lerp(a0.yl, a1.yl, t) : lerp(a0.yr, a1.yr, t), e = 3.5 / (len / n);
          const j0 = clamp(Math.round(f - e), 0, n), j1 = clamp(Math.round(f + e), 0, n), sy = ((r === 0 ? samples[j1].yl : samples[j1].yr) - (r === 0 ? samples[j0].yl : samples[j0].yr)) / 7;
          const nearPath = S.near === 2 || path.nearestXZ(x, z).dist < 110;
          frameAt(x, y0 + 0.05, z, a0.tx, sy, a0.tz);
          (nearPath ? stFull : stLite).push({ m: m4.clone(), along: alongBase + d });
        }
      }
      for (let e = 0; e < 2; e++) if (S.tack && S.tack[e]) { const a0 = samples[e === 0 ? 2 : n - 2]; tacks.push({ x: a0.x, z: a0.z, y: a0.yc, tx: a0.tx * (e ? -1 : 1), tz: a0.tz * (e ? -1 : 1) }); }
      alongBase += len + 37;
      await ctx.yield();
    }
    const seamGeo = new THREE.BufferGeometry();
    seamGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); seamGeo.setAttribute('uv', new THREE.Float32BufferAttribute(suv, 2));
    seamGeo.setAttribute('aWear', new THREE.Float32BufferAttribute(swr, 1)); seamGeo.setAttribute('aCrown', new THREE.Float32BufferAttribute(scr, 1));
    seamGeo.setIndex(six);
    const seams = new THREE.Mesh(seamGeo, seamMat); seams.name = 'seams'; seams.frustumCulled = false; scene.add(seams);
    await ctx.yield();

    // the pocket's double arc of stitching: dashes alone, straight into the cloth
    for (let r = 0; r < 2; r++) {
      const A = V3(-262 - r * 8, 0, -30 + r * 9), B = V3(-420 + r * 10, 0, 40 + r * 34), Cc = V3(-398 + r * 6, 0, 150 - r * 6);
      const arc = new THREE.QuadraticBezierCurve3(A, B, Cc), L = arc.getLength(), q = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let d = 4; d < L - 6; d += 10) {
        if (rng() < 0.025) continue;
        arc.getPointAt(d / L, q); arc.getTangentAt(d / L, tg);
        const y0 = land(q.x - tg.x * 3.5, q.z - tg.z * 3.5), y1 = land(q.x + tg.x * 3.5, q.z + tg.z * 3.5);
        frameAt(q.x, (y0 + y1) / 2 + 0.25, q.z, tg.x, (y1 - y0) / 7, tg.z);
        (path.nearestXZ(q.x, q.z).dist < 110 ? stFull : stLite).push({ m: m4.clone(), along: 0 });
      }
    }
    const stitchCol = P.orange, stitchMat = cordMat(stitchCol, P.orangeDark);
    const liteGeo = (() => {                                 // a far dash: the same cord with fewer facets
      const pos = [], uvs = [], idx = [], nu = 4, len = 7;
      for (let i = 0; i <= nu; i++) { const sx = i / nu, z = (sx - 0.5) * len, e = Math.min(sx, 1 - sx) * len, dive = 1 - smoothstep(0, 0.9, e);
        for (let j = 0; j <= 2; j++) { const an = (j / 2) * Math.PI; pos.push(-Math.cos(an) * 0.45, Math.sin(an) * 0.45 - dive * 0.7 - 0.05, z); uvs.push(sx * len, j / 2); } }
      for (let i = 0; i < nu; i++) for (let j = 0; j < 2; j++) { const k = i * 3 + j, k2 = k + 3; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); return g;
    })();
    for (const [list, geo, name] of [[stFull, holedStitch(style.stitchGeometry(7)), 'stitches-near'], [stLite, liteGeo, 'stitches-far']]) {
      if (!list.length) { geo.dispose(); continue; }
      const im = new THREE.InstancedMesh(geo, stitchMat, list.length), al = new Float32Array(list.length);
      list.forEach((o, i) => { im.setMatrixAt(i, o.m); al[i] = o.along; });
      geo.setAttribute('aAlong', new THREE.InstancedBufferAttribute(al, 1));
      im.name = name; im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // bar tacks (dense zigzag blocks 20 m long closing a seam end) and, at each, one loose end that lifts and falls
    const tailAt = [];
    { const pos = [], uvs = [], sway = [], idx = [];
      const quad = (ax, ay, az, bx2, by2, bz2, hw, s0, s1) => {
        let dx = bx2 - ax, dz = bz2 - az; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const k = pos.length / 3;
        pos.push(ax - dz * hw, ay, az + dx * hw, ax + dz * hw, ay, az - dx * hw, bx2 - dz * hw, by2, bz2 + dx * hw, bx2 + dz * hw, by2, bz2 - dx * hw);
        uvs.push(0, 0, 0, 1, l, 0, l, 1); sway.push(s0, s0, s1, s1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); };
      for (const T of tacks) {
        const nx = T.tz, nz = -T.tx;
        for (let i = 0; i < 30; i++) { const d0 = i * 0.68, d1 = d0 + 0.68, sd = i % 2 ? 1 : -1;
          quad(T.x + T.tx * d0 + nx * 2.6 * sd, T.y + 0.5, T.z + T.tz * d0 + nz * 2.6 * sd, T.x + T.tx * d1 - nx * 2.6 * sd, T.y + 0.5, T.z + T.tz * d1 - nz * 2.6 * sd, 0.42, 0, 0); }
        const L = rng.range(6, 15), side = rng() < 0.5 ? -1 : 1, ang = rng.range(0.5, 1.2) * side, ca = Math.cos(ang), sa = Math.sin(ang);
        const dx = -(T.tx * ca - T.tz * sa), dz = -(T.tx * sa + T.tz * ca); tailAt.push([T.x, T.y, T.z]);
        for (let i = 0; i < 10; i++) { const d0 = (i / 10) * L, d1 = ((i + 1) / 10) * L, x0 = T.x + dx * d0, z0 = T.z + dz * d0, x1 = T.x + dx * d1, z1 = T.z + dz * d1;
          quad(x0, Math.max(land(x0, z0), T.y - 2.2) + 0.5, z0, x1, Math.max(land(x1, z1), T.y - 2.2) + 0.5, z1, 0.4, i / 10, (i + 1) / 10); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1)); g.setIndex(idx);
      const tm = cordMat(stitchCol, P.orangeDark); tm.side = THREE.DoubleSide;
      const mesh = new THREE.Mesh(g, tm); mesh.name = 'bar-tacks'; mesh.frustumCulled = false; scene.add(mesh); }
    await ctx.yield();

    // rivets: copper domes 6 m across with a stamped ring and a centre dimple, wherever seams meet
    const rivetGeo = (() => {
      const prof = [[0, 0.5, 0], [0.45, 0.55, 0], [0.75, 1.35, 0], [1.35, 1.3, 0], [1.9, 0.95, 0], [2.0, 1.12, 1], [2.3, 1.12, 1], [2.4, 0.7, 0], [2.78, 0.42, 0], [3.0, 0.3, 1], [3.06, -0.4, 1]];
      const seg = 20, pos = [], ed = [], idx = [];
      for (let i = 0; i < prof.length; i++) for (let j = 0; j <= seg; j++) { const an = (j / seg) * Math.PI * 2; pos.push(Math.cos(an) * prof[i][0], prof[i][1], Math.sin(an) * prof[i][0]); ed.push(prof[i][2]); }
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) { const k = i * (seg + 1) + j, k2 = k + seg + 1; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(ed, 1));
      g.setIndex(idx); g.computeVertexNormals(); return g;
    })();
    const rivetAt = [[-222, 8], [-183, 59], ...POCKET.slice(1), [-409, 160], [-470, 66], [-384, -98], [-258, -38], [-240.7, -42], [-322, 300], [-318, 600], [322, 180], [318, 650],
      [-158, 292], [158, 215], [158, 610], [-158, 560], [-300, 832], [300, 834], [-100, 824], [-590, 310], [-600, 645], [600, 115], [590, 695], [-290, 898], [300, 898],
      [-327, 290], [-312, 610], [330, 190], [310, 640], [-168, 300], [168, 222], [166, 600], [-166, 552], [-114, 842], [-86, 842], [-114, 870], [-86, 870], [-610, 838], [606, 840],
      [-128, 884], [-292, 676], [128, 884], [290, 670], [-170, 884], [-256, 880], [-150, 846], [150, 846]];
    const rivets = new THREE.InstancedMesh(rivetGeo, style.metal('copper'), rivetAt.length);
    { const up = new THREE.Vector3(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), yAxis = V3(0, 1, 0);
      rivetAt.forEach(([x, z], i) => {
        const h = land(x, z), gxx = (land(x + 3, z) - land(x - 3, z)) / 6, gzz = (land(x, z + 3) - land(x, z - 3)) / 6;
        up.set(-gxx, 1, -gzz).normalize(); if (i === 1) up.set(0.3, 1, -0.22).normalize();          // one is set crooked
        qq.setFromUnitVectors(yAxis, up); const onSeam = i < 7 || (i > 10 && i < 24);
        m4.compose(V3(x, h + (onSeam ? 2.1 : 0.2), z), qq, sc); rivets.setMatrixAt(i, m4);
      }); }
    { let n = 0;                                            // whisker fans: downhill from the rivets out on the hills
      for (const [x, z] of rivetAt) { if (n >= NFAN || inZone(x, z) || path.nearestXZ(x, z).dist < 30) continue;
        const gxx = landRaw(x + 8, z) - landRaw(x - 8, z), gzz = landRaw(x, z + 8) - landRaw(x, z - 8);
        fans[n++].set(x, z, Math.atan2(-gzz, -gxx) + rng.range(-0.5, 0.5), rng.range(70, 150)); } }
    rivets.name = 'rivets'; rivets.frustumCulled = false; scene.add(rivets);
    await ctx.yield();

    // ---- THE KNEE: a ripped hole, red at its bottom, bridged by white weft threads that run our way ---------------
    { const cm = style.cotton(); cm.uniforms.cDot.value = new THREE.Color(way.dot); cm.uniforms.uTick.value = way.tick;
      const g = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
      const patch = new THREE.Mesh(g, cm); patch.scale.set(KN.b * 0.84, 1, KN.a * 0.84); patch.rotation.y = Math.atan2(KN.dx, KN.dz);
      patch.position.set(KN.x, KN.floor + 2.2, KN.z); patch.name = 'knee-red'; scene.add(patch); }
    // REPAIR 3 (the opening): A CORD IS DRAWN AS TWISTED YARN, so that a white thread near the lens reads at a glance as a thread and not as a
    // streak: three plies wind round the cord as evenly spaced diagonal lines in the brief's pale blue (worked out from the cord's own length
    // and the angle round it, so each line bends toward the edges as a helix does), and a fuzz of short loose fibres stands off it (thin
    // triangles rooted on the cord, moving with it). Two flat tones; nothing is lit. The cords stand where they stood.
    const yarnPale = new THREE.Color(way.pal[6]).lerp(P.fade, 0.45);
    const kneeMat = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms(), cA: { value: P.white }, cB: { value: yarnPale }, uSec: { value: 0 } },
      vertexShader: style.glsl.common + /* glsl */`
        attribute vec4 aT; attribute vec3 aLip0; attribute vec3 aLip1; attribute vec2 aRing; attribute vec2 aK; uniform float uSec; varying vec4 vY; varying vec2 vRing;
        void main(){ float t = aT.x, ph = aT.y, sag = aT.z, snapAt = aT.w; float bow = 4.0 * t * (1.0 - t);
          vec3 ax = aLip1 - aLip0; float L = length(ax); vec3 lat = vec3(ax.z, 0.0, -ax.x) / max(length(ax.xz), 1e-3);
          vec3 p = mix(aLip0, aLip1, t); p.y -= sag * bow;
          float near = 1.0 - smoothstep(12.0, 70.0, distance(p, cameraPosition));
          p += lat * bow * uBreeze * (1.6 * sin(uTime * 0.9 + ph) + 0.5 * sin(uTime * 2.3 + ph * 1.7));
          p.y += bow * (0.9 * sin(uTime * 0.7 + ph * 2.0) * uBreeze + 0.22 * near * sin(uTime * 34.0 + ph * 5.0));     // it hums as we pass
          // the knee gives (rare): the thread parts in the middle and each half whips back to hang from its lip
          float x = max(uSec - snapAt, 0.0) * step(0.5, snapAt); float r = (1.0 - exp(-3.0 * x) * cos(8.0 * x)) * step(1e-4, x);
          float hl = t < 0.5 ? t : 1.0 - t; vec3 lip = t < 0.5 ? aLip0 : aLip1; vec3 inw = (t < 0.5 ? 1.0 : -1.0) * ax / max(L, 1e-3);
          vec3 hang = lip + vec3(0.0, -hl * L * 0.92, 0.0) + inw * (2.0 + 5.0 * hl * hl * sin(uTime * 1.3 + ph)) + lat * 2.5 * hl * sin(uTime * 1.7 + ph);
          p = mix(p, hang, clamp(r, 0.0, 1.25));
          float wide = max(1.0, distance(p, cameraPosition) * 0.011);                 // POLISH 4: a cord keeps a drawn width far off
          p += (lat * aRing.x + vec3(0.0, aRing.y, 0.0)) * wide;
          vY = vec4(t * L, 1.32 * aK.x * wide, aK.y, 0.0); vRing = aRing / (0.66 * aK.x);      // metres along, drawn diameter, fibre flag; the unit ring
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 cA, cB; varying vec4 vY; varying vec2 vRing;
        void main(){ if (vY.z > 0.5) { gl_FragColor = vec4(cA, 1.0); return; }                    // a loose fibre: plain white
          float pitch = 2.4 * vY.y, ang = atan(vRing.y, vRing.x);
          float c = (vY.x / pitch + ang / 6.2832) * 3.0, fq = 3.0 * fwidth(vY.x) / pitch + 0.02;
          float ply = smoothstep(0.64 - fq, 0.64 + fq, abs(fract(c) - 0.5) * 2.0) * (1.0 - smoothstep(0.30, 0.75, fq));     // far off, or seen end on, a string is plain white
          gl_FragColor = vec4(mix(cA, cB, ply), 1.0); }`,
    });
    { const NTH = 140, SEG = 16, SID = 5, aT = [], l0 = [], l1 = [], ring = [], kk = [], idx = [], kr = rng.fork ? rng.fork('knee') : rng;
      const cands = [];
      const offs = [];
      for (let sd = -1; sd <= 1; sd += 2) { let v = 5.6, i = 0; while (Math.abs(KV + sd * v) < KN.b * 0.95 && offs.length < NTH) { offs.push([KV + sd * v, i % 2 === 0 || v > 30 ? 1 : 0.5]); v += (i % 2 === 0 ? 5.6 : 6.6); i++; } }
      for (let i = 0; i < offs.length; i++) {
        if (i % 4 === 3) await ctx.yield();
        const v = offs[i][0] + kr.range(-0.3, 0.3), thick = offs[i][1] * (Math.abs(offs[i][0] - KV) > 30 ? kr.range(0.45, 0.9) : 1);
        const half = KN.a * Math.sqrt(Math.max(1 - (v / KN.b) * (v / KN.b), 0.02)) * 1.03;
        const cx = KN.x + KN.dz * v, cz = KN.z - KN.dx * v;
        const p0 = V3(cx - KN.dx * half, 0, cz - KN.dz * half), p1 = V3(cx + KN.dx * half, 0, cz + KN.dz * half);
        p0.y = land(p0.x, p0.z) + 0.6; p1.y = land(p1.x, p1.z) + 0.6;
        let sag = kr.range(0.5, 9) * (half / KN.a); if (kr() < 0.16) sag = -kr.range(3, 9) * (half / KN.a); if (thick < 0.7) sag += 3;
        // keep 5 m clear of the lens: lift or drop the thread out of the corridor
        for (let tries = 0; tries < 8; tries++) { let bad = false;
          for (let q = 1; q < 8; q++) { const t = q / 8, bow = 4 * t * (1 - t); if (path.distanceTo(lerp(p0.x, p1.x, t), lerp(p0.y, p1.y, t) - sag * bow, lerp(p0.z, p1.z, t)) < 6.2) bad = true; }
          if (!bad) break; sag += sag < -1 ? -2.5 : 2.5; }
        cands.push({ v, p0, p1, sag, thick, ph: kr.range(0, 6.28) });
      }
      // the three that part on a rare visit: the nearest beside the lens, alternate sides, a second apart
      const order = cands.map((c2, i) => i).sort((i, j) => Math.abs(cands[i].v - KV) - Math.abs(cands[j].v - KV));
      const snapSec = [7.2, 8.2, 9.2];
      order.slice(0, 3).forEach((i, k) => { cands[i].snap = rare ? snapSec[k] : 0; });
      cands.forEach((c2, n) => {
        const base = n * (SEG + 1) * SID;
        for (let i = 0; i <= SEG; i++) for (let j = 0; j < SID; j++) { const an = (j / SID) * Math.PI * 2;
          aT.push(i / SEG, c2.ph, c2.sag, c2.snap || 0); l0.push(c2.p0.x, c2.p0.y, c2.p0.z); l1.push(c2.p1.x, c2.p1.y, c2.p1.z); ring.push(Math.cos(an) * 0.66 * c2.thick, Math.sin(an) * 0.66 * c2.thick); kk.push(c2.thick, 0);
          if (i < SEG) { const k = base + i * SID + j, kn = base + i * SID + (j + 1) % SID; idx.push(k, kn, k + SID, kn, kn + SID, k + SID); } }
      });
      // REPAIR 3: the fuzz of the yarn (the brief: 'short loose fibres 0.3 to 0.8 m long'): one fibre every two metres or so of each cord,
      // a thin triangle rooted on the cord's skin and standing off it at its own angle; it rides the cord (same vertex code). Its own stream.
      { const zr = ctx.core.makeRng(ctx.core.hashSeed('knee-fuzz:' + ctx.seed));
        for (const c2 of cands) { const Lc = c2.p0.distanceTo(c2.p1), nf = Math.round(Lc / 2.1), R0 = 0.66 * c2.thick;
          for (let f = 0; f < nf; f++) { const t = (f + zr()) / nf, an = zr.range(0, 6.2832), len = zr.range(0.35, 0.8), lean = zr.range(-0.5, 0.5) / Lc, hw = 0.085 / Lc, k = aT.length / 4;
            for (const [dt, rr] of [[-hw, R0 * 0.8], [hw, R0 * 0.8], [lean, R0 + len]]) {
              aT.push(clamp(t + dt, 0, 1), c2.ph, c2.sag, c2.snap || 0); l0.push(c2.p0.x, c2.p0.y, c2.p0.z); l1.push(c2.p1.x, c2.p1.y, c2.p1.z); ring.push(Math.cos(an) * rr, Math.sin(an) * rr); kk.push(c2.thick, 1); }
            idx.push(k, k + 1, k + 2); } } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(l0, 3)); g.setAttribute('aLip0', new THREE.Float32BufferAttribute(l0, 3));
      g.setAttribute('aLip1', new THREE.Float32BufferAttribute(l1, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 4));
      g.setAttribute('aRing', new THREE.Float32BufferAttribute(ring, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 2)); g.setIndex(idx);
      kneeMat.side = THREE.DoubleSide;
      const threads = new THREE.Mesh(g, kneeMat); threads.name = 'knee-threads'; threads.frustumCulled = false; scene.add(threads);
      updaters.push((dt, time, camera, u) => { kneeMat.uniforms.uSec.value = secAt(u); }); }
    await ctx.yield();

    // ---- FRINGE: wherever an edge is frayed white weft threads hang and stream; the grass and waterfalls here ------
    { const fr = rng.fork ? rng.fork('fringe') : rng, K = detail * density * (wash === 'stonewashed' ? 1.35 : 1);
      const aA = [], aD = [], aS = [];
      const add = (x, y, z, dx, dz, len, reach, drop) => { aA.push(x, y, z); aD.push(dx * len * reach, len * drop, dz * len * reach); aS.push(fr.range(0, 6.28), fr.range(0.36, 0.5)); };   // POLISH 3: each thread a separate drawn line
      const nLip = Math.round(560 * K);
      for (let i = 0; i < nLip; i++) {                       // the knee's lips: hanging into the hole
        if (i % 60 === 59) await ctx.yield();
        const th = (i + fr.range(-0.2, 0.2)) / nLip * 6.2832, ca = Math.cos(th), sa = Math.sin(th), far = ca > 0.35;
        const x = KN.x + KN.dx * KN.a * ca * 0.99 + KN.dz * KN.b * sa * 0.99, z = KN.z + KN.dz * KN.a * ca * 0.99 - KN.dx * KN.b * sa * 0.99;
        if (Math.abs(KN.b * sa - KV) < 7.5) continue;
        const y = land(x, z), depth = y - KN.floor - 3; if (depth < 6) continue;
        let ix = KN.x - x, iz = KN.z - z; const il = Math.hypot(ix, iz) || 1; ix /= il; iz /= il;
        if (i % 2) { fr.range(9, 26); continue; }
        add(x, y + 0.4, z, ix, iz, Math.min(fr.range(6, 8), depth), 0.3, 0.92);
        if (far && fr() < 2) { const x2 = x + KN.dx * 9, z2 = z + KN.dz * 9;                 // the far lip: streaming down the fall, our way
          add(x2, land(x2, z2) + 0.6, z2, 0.62, 0.78, fr.range(6.5, 8.5), 0.85, 0.42); }
      }
      const nFace = Math.round(500 * K);
      for (let i = 0; i < nFace; i++) {                      // the hem of the fall and the valley face of the pocket hill
        if (i % 60 === 59) await ctx.yield();
        const tier = i % 2, z = -45 + 300 * (i + fr.range(-0.2, 0.2)) / nFace, x = -155 + bulge(z) - (tier ? 54 : 36) - fr.range(0, 1.5), y = landRaw(x, z);   // POLISH 4: two frayed tiers, evenly combed
        if (y < 14 || kneeD(x, z) < 1.12 || path.nearestXZ(x, z).dist < 9) continue;
        const gx2 = landRaw(x + 4, z) - landRaw(x - 4, z), gz2 = landRaw(x, z + 4) - landRaw(x, z - 4), gl = Math.hypot(gx2, gz2) || 1;
        add(x, y + 0.5, z, -gx2 / gl, -gz2 / gl, Math.min(fr.range(7.5, 9.5), y * 0.95), 0.62, 0.72);
      }
      const SEGF = 6, bp = [], bi = [];
      for (let i = 0; i <= SEGF; i++) for (const sd of [-1, 1]) bp.push(i / SEGF, sd, 0);
      for (let i = 0; i < SEGF; i++) { const k = i * 2; bi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); g.setIndex(bi);
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(aA), 3)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(aD), 3));
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 2)); g.instanceCount = aS.length / 2;
      g.boundingSphere = new THREE.Sphere(V3(-130, 30, 120), 400);
      const fm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cA: { value: P.white.clone().lerp(P.fade, 0.22) }, cB: { value: P.white.clone().lerp(P.fade, 0.62) }, cP: { value: yarnPale.clone().lerp(P.fade, 0.5) } }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + /* glsl */`
          attribute vec3 aA; attribute vec3 aD; attribute vec2 aS; varying float vT; varying float vK; varying vec3 vY;
          vec3 strand(float t){ vec3 h = vec3(aD.x, 0.0, aD.z); float hl = max(length(h), 1e-3); vec3 lat = vec3(h.z, 0.0, -h.x) / hl;
            vec3 p = aA + h * t + vec3(0.0, -aD.y * t * t, 0.0);
            p.y += 1.5 * denimBillow(aA.xz, uTime) * (1.0 - t);
            float amp = t * t * (1.2 + 0.05 * aD.y) * uBreeze;
            p += lat * 0.5 * sin(t * 8.0 + aS.x * 3.0) * smoothstep(0.0, 0.3, t);                    // the yarn's own kink
            p += lat * amp * sin(uTime * 1.25 + aS.x + t * 3.1) + h / hl * amp * 0.8 * sin(uTime * 0.8 + aS.x * 1.7 + t * 2.0);
            p.y += amp * 0.6 * sin(uTime * 1.7 + aS.x * 2.3 + t * 4.0);
            return p; }
          void main(){ float t = position.x; vT = t; vK = fract(aS.x * 7.31); vec3 p = strand(t), q = strand(t + 0.04);
            vec4 mv = viewMatrix * vec4(p, 1.0), mq = viewMatrix * vec4(q, 1.0);
            vec2 d = mq.xy - mv.xy; d = d / max(length(d), 1e-4);
            float hw = max(aS.y, -mv.z * 0.0032) * (1.0 - 0.3 * t * t);
            mv.xy += vec2(-d.y, d.x) * position.y * hw;
            vY = vec3(t * length(aD), position.y, 2.0 * hw);                                       // metres along, -1..1 across, drawn width
            gl_Position = projectionMatrix * mv; }`,
        // REPAIR 3 (the opening): a fringe thread is yarn: its plies are evenly spaced diagonal lines in the brief's pale blue (lines finer than
        // the raster take their flat tint, as every fine line here), and its free end is frayed into three strands of uneven length, every thread, near and far
        fragmentShader: /* glsl */`uniform vec3 cA, cB, cP; varying float vT; varying float vK; varying vec3 vY;
          void main(){
            float c = vY.x / (0.8 * vY.z) + 0.5 * vY.y, fq = fwidth(vY.x) / (0.8 * vY.z) + 0.5 * fwidth(vY.y);
            float ply = smoothstep(0.60 - fq, 0.60 + fq, abs(fract(c) - 0.5) * 2.0) * (1.0 - smoothstep(0.25, 0.6, fq));
            float k3 = floor((vY.y * 0.5 + 0.5) * 3.0), tip = 0.80 + 0.17 * fract(sin(k3 * 12.9898 + vK * 78.233) * 43758.5453);
            if (vT > 0.74 && (vT > tip || abs(fract((vY.y * 0.5 + 0.5) * 3.0) - 0.5) > 0.5 - 0.22 * smoothstep(0.74, 0.86, vT))) discard;
            gl_FragColor = vec4(mix(mix(cA, cB, max(smoothstep(0.0, 0.25, vT) * 0.5, step(0.6, vK))), cP, ply), 1.0); }`,
      });
      const fringe = new THREE.Mesh(g, fm); fringe.name = 'fringe'; fringe.frustumCulled = false; scene.add(fringe); }
    await ctx.yield();

    // ---- THE WAISTBAND across the valley head, its copper button, two belt loops, and the buttonhole (the exit) ----
    const BZ = 908, bandBase = (x) => land(x, BZ + 3);
    { const xs = []; for (let x = -840; x <= 840.01; x += Math.abs(x + 100) < 260 ? 7 : 20) xs.push(x);
      const XB = [[0, -5, 0.2], [0, 1.2, 0.3], [-0.5, 3, 0.8], [0, 5.2, 0.12], [0, 22, 0.34], [0, 37.5, 0.12], [-0.5, 40, 0.8], [0, 42.5, 0.36], [1.3, 44.6, 0.86], [3, 45.2, 0.95], [4.7, 44.6, 0.86], [6, 42, 0.3], [6, -5, 0.2]];
      const pos = [], uvs = [], wr = [], idx = [], c45 = Math.SQRT1_2, bandSt = [];
      xs.forEach((x, i) => { const b0 = bandBase(x), nz = noise.fbm2(x * 0.011 + sA, 3.3, 3);
        XB.forEach(([dz, dy, ww], c2) => { const y = b0 + dy; pos.push(x, y, BZ + dz); uvs.push((x - y) * c45 + 500, (x + y) * c45);
          wr.push(clamp(ww + 0.16 * nz * (ww > 0.2 && ww < 0.5 ? 1 : 0.3) + washK * 0.7 + nightK, 0.02, 1));
          if (i < xs.length - 1 && c2 < XB.length - 1) { const k = i * XB.length + c2, k2 = k + XB.length; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); } }); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aWear', new THREE.Float32BufferAttribute(wr, 1)); g.setIndex(idx);
      const band = new THREE.Mesh(g, denimMat); band.name = 'waistband'; band.frustumCulled = false; scene.add(band);
      // its topstitch: two rows under the fold and two above the hem, dashes lying on the standing cloth
      let bsN = 0;
      for (const dy of [1.9, 4.1, 38.6, 41]) for (let x = -420 + (dy % 2) * 4; x < 330; x += 10) {
        if (++bsN % 50 === 0) await ctx.yield();
        if (rng() < 0.025 || (Math.hypot(x - path.end.x, dy - 22) < 22) || (dy > 30 && Math.abs(x + 19) < 11 && false)) continue;
        const b0 = bandBase(x), b1 = bandBase(x + 4); bz.set(4, b1 - b0, 0).normalize(); by.set(0, 0, -1); bx.crossVectors(by, bz);
        bandSt.push(m4.makeBasis(bx, by, bz).setPosition(x, b0 + dy, BZ - 0.15).clone()); }
      const sg = liteGeo.clone(); sg.deleteAttribute('aAlong');
      const im = new THREE.InstancedMesh(sg, stitchMat, bandSt.length); bandSt.forEach((m, i) => im.setMatrixAt(i, m));
      im.name = 'band-stitches'; im.frustumCulled = false; scene.add(im); }
    await ctx.yield();
    const exitM = path.frameAt(true, new THREE.Matrix4(), true), exitP = path.end.clone(), RS = 1.36;   // POLISH 4: the ring a third larger (portal radius 9.5)
    { // the buttonhole: bound all round in close stitches, each a short cord lying on the ring
      const N = 96, NO = 26, sg = liteGeo.clone(); sg.deleteAttribute('aAlong');   // POLISH 3: a larger binding, an outer row of dashes, a rubbed pale collar
      const ringMat = cordMat(P.orange, P.orangeDark, 0);
      const im = new THREE.InstancedMesh(sg, ringMat, N + NO), q = new THREE.Vector3(), sc = new THREE.Vector3();
      for (let i = 0; i < N; i++) { const an = (i / N) * Math.PI * 2 + 0.03 * Math.sin(i * 7.1), ca = Math.cos(an), sa = Math.sin(an), r0 = 10.5 + 0.3 * Math.sin(i * 3.7);
        bz.set(ca, sa, 0); by.set(0, 0, 1); bx.crossVectors(by, bz);
        m4.makeBasis(bx, by, bz).scale(sc.set(0.92, 1.3, 0.92)).setPosition(q.set(ca * r0, sa * r0, 0.25)); im.setMatrixAt(i, m4); }
      for (let i = 0; i < NO; i++) { const an = (i / NO) * Math.PI * 2 + 0.02 * Math.sin(i * 5.3), ca = Math.cos(an), sa = Math.sin(an), r1 = 17.2 + 0.25 * Math.sin(i * 2.9);
        bz.set(-sa, ca, 0); by.set(0, 0, 1); bx.crossVectors(by, bz);
        m4.makeBasis(bx, by, bz).scale(sc.set(1, 1.2, 0.46)).setPosition(q.set(ca * r1, sa * r1, 0.2)); im.setMatrixAt(N + i, m4); }
      const purl = new THREE.Mesh(new THREE.TorusGeometry(7.3, 0.5, 6, 72), ringMat); purl.position.z = 0.2;
      const lip = new THREE.Mesh(new THREE.RingGeometry(7.0, 14.2, 72, 1), style.thread(P.orangeDark, { dark: P.orangeDark })); lip.position.z = -0.3;
      const paleC = wayId === 'black' ? P.fade.clone().lerp(P.indigo, 0.45) : P.fade.clone().lerp(P.ecru, 0.72), collar = new THREE.Mesh(new THREE.RingGeometry(14.2, 19.6, 72, 1), style.thread(paleC, { dark: paleC })); collar.position.z = -0.4;
      const hole = new THREE.Group(); hole.add(im, purl, lip, collar); hole.matrixAutoUpdate = false; hole.matrix.copy(exitM).scale(V3(RS, RS, 1)); hole.name = 'buttonhole'; im.frustumCulled = false; scene.add(hole);
      // the button to its left: copper, 20 m across
      const prof = [[0, 2.4, 0], [2.3, 2.4, 0], [3.0, 1.3, 0], [6.2, 1.3, 0], [6.5, 2.0, 1], [7.4, 2.0, 1], [7.7, 1.3, 0], [8.4, 1.4, 0], [8.8, 2.7, 1], [9.6, 2.9, 1], [10, 2.0, 1], [10, -1, 0]];
      const seg = 40, pos = [], ed = [], idx = [];
      for (let i = 0; i < prof.length; i++) for (let j = 0; j <= seg; j++) { const an = (j / seg) * Math.PI * 2; pos.push(Math.cos(an) * prof[i][0], prof[i][1], Math.sin(an) * prof[i][0]); ed.push(prof[i][2]); }
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) { const k = i * (seg + 1) + j, k2 = k + seg + 1; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aEdge', new THREE.Float32BufferAttribute(ed, 1));
      g.setIndex(idx); g.computeVertexNormals(); g.rotateX(-Math.PI / 2);
      const button = new THREE.Mesh(g, rivets.material); button.position.set(exitP.x + 42, exitP.y + 1, BZ - 0.6); button.name = 'button'; scene.add(button); }
    // ---- POLISH 4: THE SHIRT-TAIL. The lining's turkey-red cotton spills out over the waistband round the buttonhole: it comes down the
    // ---- ridge behind, over the band's top and hangs down its face in a curved tail, printed with a medallion whose centre is the ring
    { const EX = exitP.x, EY = exitP.y, W = 290, NA = 60, NB = 32, TOPY = 46.4, pos = [], qq2 = [], ee = [], idx = [];
      const prof = (x, b0, s, out, amp, span) => {                  // up the face, over the top, then blousing out above the band and back down to the ridge
        if (s <= TOPY) return out.set(x, b0 + s, BZ - 1.1);
        if (s <= TOPY + 9) return out.set(x, b0 + TOPY + 0.5, BZ - 1.1 + (s - TOPY));
        const t = s - TOPY - 9, z = BZ + 7.9 + t * 0.62; return out.set(x, Math.max(land(x, z), b0 + 40) + 1.5 + amp * Math.pow(Math.sin(Math.PI * clamp(t / span, 0, 1)), 0.7), z); };
      const pv = new THREE.Vector3();
      for (let i = 0; i <= NA; i++) { const a0 = (i / NA) * 2 - 1, x = EX + a0 * W * 0.5, b0 = bandBase(x), aa = Math.abs(a0);
        const sH = 3 + (TOPY + 40) * Math.pow(aa, 2.4) + 1.6 * Math.sin(a0 * 21) * (1 - aa), sT = TOPY + 9 + 96 * (1 - 0.55 * a0 * a0);
        for (let j = 0; j <= NB; j++) { const s = lerp(sH, Math.max(sT, sH + 1), j / NB); prof(x, b0, s, pv, 47 * (1 - 0.6 * a0 * a0), Math.max(sT - TOPY - 9, 1));
          pos.push(pv.x, pv.y, pv.z); qq2.push(x - EX, b0 + s - EY); ee.push(Math.min(s - sH, Math.max(sT, sH + 1) - s), s);
          if (i < NA && j < NB) { const k = i * (NB + 1) + j, k2 = k + NB + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }
        if (i % 6 === 5) await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(qq2, 2));
      g.setAttribute('aE', new THREE.Float32BufferAttribute(ee, 2)); g.setIndex(idx);
      const tm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cRed: { value: P.red }, cDeep: { value: P.redDeep }, cDot: { value: new THREE.Color(way.dot) }, uR0: { value: 19.6 * RS } },
        side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
        vertexShader: style.glsl.common + /* glsl */`
          attribute vec2 aQ; attribute vec2 aE; varying vec2 vQ; varying vec2 vE;
          void main(){ vQ = aQ; vE = aE; vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.y += 1.5 * denimBillow(wp.xz, uTime);
            float hem = (1.0 - smoothstep(0.0, 14.0, aE.x)) * step(aE.y, 46.0);                 // the tail's hem lifts off the band on the breeze
            wp.z -= hem * uBreeze * (1.3 + 1.1 * sin(uTime * 1.2 + aQ.x * 0.11) + 0.4 * sin(uTime * 2.7 + aQ.x * 0.37));
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          uniform vec3 cRed, cDeep, cDot; uniform float uR0; varying vec2 vQ; varying vec2 vE;
          float disc(vec2 d, float r, float aa){ return 1.0 - smoothstep(r, r + aa, length(d)); }
          float wheel(vec2 q, float r, float an, float n, float rad, float size, float aa){ float sp = abs(fract(an * n / 6.2832) - 0.5) * 6.2832 / n * max(r, 1.0); return disc(vec2(sp, r - rad), size, aa); }
          void main(){ vec2 q = vQ; float e = vE.x; float aa = 0.7 * (fwidth(q.x) + fwidth(q.y)) + 1e-4; float thin = 1.0 - smoothstep(0.6, 1.8, aa);
            float r = length(q); float an = atan(q.y, q.x + 1e-4 * step(abs(q.x) + abs(q.y), 1e-4));
            float R = uR0;                                                                       // the collar's rim: the print begins outside it
            float med = max(1.0 - smoothstep(0.55, 0.55 + aa, abs(r - R - 3.2)), (1.0 - smoothstep(0.3, 0.3 + aa, abs(r - R - 5.4))) * thin);
            med = max(med, wheel(q, r, an, 22.0, R + 10.5, 2.1, aa));                              // a wheel of large drops
            med = max(med, wheel(q, r, an + 0.1428, 22.0, R + 15.6, 1.0, aa) * thin);              // a small dot between each pair
            med = max(med, 1.0 - smoothstep(0.5, 0.5 + aa, abs(r - R - 19.5)));
            med = max(med, wheel(q, r, an, 64.0, R + 23.2, 0.85, aa) * thin);                      // a close dotted ring
            med = max(med, (1.0 - smoothstep(0.3, 0.3 + aa, abs(r - R - 26.6))) * thin);
            float ray = (1.0 - smoothstep(0.42, 0.42 + aa, abs(fract(an * 44.0 / 6.2832) - 0.5) * 6.2832 / 44.0 * r)) * step(R + 29.0, r) * (1.0 - step(R + 36.0 + 5.0 * step(0.5, fract(an * 22.0 / 6.2832)), r)) * thin;
            vec2 cq = q - (floor(q / 11.0) + 0.5) * 11.0; float sprig = disc(cq, 1.15, aa) * step(R + 44.0, r) * step(11.0, e);
            float ln = max(1.0 - smoothstep(0.5, 0.5 + aa, abs(e - 3.0)), (1.0 - smoothstep(0.25, 0.25 + aa, abs(e - 9.4))) * thin);   // the hem's border
            float bd = disc(vec2(mod(q.x + 2.6, 5.2) - 2.6, e - 6.2), 1.2, aa) * step(4.0, e);
            float f1 = q.x * 0.085 + 1.1 * sin(q.y * 0.03 + 0.6) + 0.5 * sin(q.x * 0.021), w1 = fwidth(f1) + 1e-4;     // long drape creases outside the medallion
            float cr = (1.0 - smoothstep(0.05, 0.05 + w1, abs(sin(f1)))) * thin * step(R + 40.0, r) * step(0.3, fract(floor(f1 / 3.14159) * 0.37));
            vec3 col = mix(cRed, cDeep, max(cr, 1.0 - smoothstep(0.0, 0.6 + aa, e)));
            col = mix(col, cDot, max(max(med, ray), max(max(ln, bd), sprig)));
            gl_FragColor = vec4(col, 1.0); }`,
      });
      const tail = new THREE.Mesh(g, tm); tail.name = 'shirt-tail'; tail.frustumCulled = false; scene.add(tail); }
    await ctx.yield();
    { // two belt loops arching over the last slope; we fly under both. Doubled straps 12 m wide with a real thickness: even raw
      // cloth with the rib along the strap, both long edges rubbed to one continuous pale line, a row of dashes inside each
      // edge on both faces, three long thin fade streaks. Wear is set only by the distance from the strap's edges.
      const pos = [], uvs = [], sdw = [], idx = [], tp2 = [], tu2 = [], ti2 = [], loopSt = [];
      const LOOPS = [{ z0: 884, yaw: 0.05, A: 16, off: 0 }, { z0: 887, yaw: -0.12, A: 15, off: -56 },
        { z0: 888, yaw: 0.1, A: 15, off: 122 }, { z0: 888, yaw: -0.07, A: 15, off: -196 }, { z0: 888, yaw: 0.04, A: 15, off: 290 }];   // each sewn on a little askew; the second stands wide of the button
      const ZS = [-6, -5.1, 0, 5.1, 6], SEG = 30, RIN = 0.95, wdir = new THREE.Vector3(), pA = new THREE.Vector3(), pB = new THREE.Vector3(), tn = new THREE.Vector3(), nn = new THREE.Vector3();
      for (const L of LOOPS) {
        const z0 = L.z0, cx = path.pointAt(path.nearestXZ(-50, z0).u).x + L.off, cy = Math.cos(L.yaw), sy = Math.sin(L.yaw);
        const LP = (ph, rr, dz, out) => { const lx = -L.A * rr * Math.cos(ph), yb = land(cx + lx * cy, z0 + lx * sy) - 2;
          return out.set(cx + lx * cy - dz * sy, yb + 37 * rr * Math.pow(Math.max(Math.sin(ph), 0), 0.8), z0 + lx * sy + dz * cy); };
        for (let layer = 0; layer < 2; layer++) { const base = pos.length / 3, rr = layer ? RIN : 1;        // outer and inner face
          for (let i = 0; i <= SEG; i++) { const ph = (i / SEG) * Math.PI;
            ZS.forEach((dz, c2) => { LP(ph, rr, dz, pA); pos.push(pA.x, pA.y, pA.z); uvs.push(dz, ph * 30 + layer * 53 + z0); sdw.push(0);
              if (i < SEG && c2 < ZS.length - 1) { const k = base + i * ZS.length + c2, k2 = k + ZS.length; idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); } }); } }
        for (const dz of [-6, 6]) { const base = pos.length / 3;                                             // the strap's two edges: its thickness, rubbed pale
          for (let i = 0; i <= SEG; i++) { const ph = (i / SEG) * Math.PI;
            for (const rr of [1, RIN]) { LP(ph, rr, dz, pA); pos.push(pA.x, pA.y, pA.z); uvs.push(dz, ph * 30 + z0); sdw.push(1); }
            if (i < SEG) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } } }
        wdir.set(-sy, 0, cy);
        for (let layer = 0; layer < 2; layer++) for (const dz of [-4.1, 4.1]) {                                 // one row of dashes inside each edge, on both faces
          const rr = layer ? RIN : 1, N = 240; let acc = 0, next = 5 + (dz > 0 ? 4 : 0); LP(0, rr, dz, pA);
          for (let i = 1; i <= N; i++) { const ph = (i / N) * Math.PI; LP(ph, rr, dz, pB); acc += pA.distanceTo(pB);
            if (acc >= next && ph < Math.PI - 0.12) { next += 10;
              LP(ph - 0.03, rr, dz, tn); LP(ph + 0.03, rr, dz, nn); bz.subVectors(nn, tn).normalize(); by.crossVectors(wdir, bz).normalize();                             // radial, away from the arch's middle
              if (layer) by.negate(); bx.crossVectors(by, bz).normalize();
              loopSt.push(m4.makeBasis(bx, by, bz).setPosition(pB.x + by.x * 0.12, pB.y + by.y * 0.12, pB.z + by.z * 0.12).clone()); }
            pA.copy(pB); } }
        for (const sd of [-1, 1]) { const lx = sd * (L.A + 0.5), y0 = land(cx + lx * cy, z0 + lx * sy) + 2.5;        // the bar tack at each foot
          const T = (dz) => [cx + lx * cy - dz * sy, z0 + lx * sy + dz * cy];
          for (let i = 0; i < 17; i++) { const k = tp2.length / 3, dA = -5.6 + i * 0.66, yA = y0 + (i % 2 ? 2.8 : 0), yB = y0 + (i % 2 ? 0 : 2.8);
            const a0 = T(dA - 0.4), a1 = T(dA + 0.4), b0 = T(dA + 0.26), b1 = T(dA + 1.06);
            tp2.push(a0[0], yA, a0[1], a1[0], yA, a1[1], b0[0], yB, b0[1], b1[0], yB, b1[1]); tu2.push(0, 0, 0, 1, 2.8, 0, 2.8, 1); ti2.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aSide', new THREE.Float32BufferAttribute(sdw, 1)); g.setIndex(idx);
      const loopMat = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), uBase: { value: clamp(0.31 + washK * 0.7 + nightK, 0.05, 0.6) } }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + /* glsl */`
          attribute float aSide; varying vec2 vUv; varying float vSide;
          void main(){ vUv = uv; vSide = aSide; vec4 wp = modelMatrix * vec4(position, 1.0);
            wp.y += 1.5 * denimBillow(wp.xz, uTime);
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: style.glsl.common + style.glsl.denimFrag + /* glsl */`
          uniform float uBase; varying vec2 vUv; varying float vSide;
          void main(){ float ax = abs(vUv.x), aa = fwidth(vUv.x) + 1e-4, thin = 1.0 - smoothstep(0.5, 1.4, aa);
            float edge = smoothstep(5.1 - aa, 5.1 + aa, ax);                       // both long edges rubbed to one pale line
            float st = 0.0;
            for (int i = 0; i < 3; i++) { float fi = float(i); float x0 = -2.7 + 2.9 * fi + 0.35 * sin(vUv.y * 0.045 + fi * 2.1);
              float on = smoothstep(0.40, 0.44, dnNoise(vec2(vUv.y * 0.03 + fi * 13.7, 2.5)));     // long, broken once or twice along the strap
              st = max(st, (1.0 - smoothstep(0.20, 0.20 + aa, abs(vUv.x - x0))) * on); }
            float wear = mix(uBase + 0.34 * st * thin + 0.50 * edge, 0.80, step(0.5, vSide));
            gStreak = 0.0;                                                          // no fade islands on a strap
            gl_FragColor = vec4(denimColor(vUv, clamp(wear, 0.0, 1.0), true), 1.0); }`,
      });
      const loops = new THREE.Mesh(g, loopMat); loops.name = 'belt-loops'; loops.frustumCulled = false; scene.add(loops);
      { const sg = liteGeo.clone(); sg.deleteAttribute('aAlong');
        const im = new THREE.InstancedMesh(sg, stitchMat, loopSt.length); loopSt.forEach((m, i) => im.setMatrixAt(i, m));
        im.name = 'loop-stitches'; im.frustumCulled = false; scene.add(im); }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp2, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(tu2, 2)); tg.setIndex(ti2);
      const tm = cordMat(P.orange, P.orangeDark); tm.side = THREE.DoubleSide;
      const lt = new THREE.Mesh(tg, tm); lt.name = 'loop-tacks'; lt.frustumCulled = false; scene.add(lt); }
    await ctx.yield();

    // ---- the J of the fly: two rows of dashes that run down beside the zip and hook in under the bottom stop ------------
    { const sg = liteGeo.clone(); sg.deleteAttribute('aAlong'); const list = [], zs0 = hero.sliderZAt(1e3) + 16;
      for (let r = 0; r < 2; r++) { const R1 = 26 - r * 5, R2 = 40 - r * 5, x0 = -22, x1 = x0 - R1; let d = 2 + r * 5;
        for (; d < 44; d += 10) list.push(frameAt(x1 + 0.4 * noise.n2(d * 0.05, r * 3.3), 4.75, zs0 + d, 0, 0, 1).clone());
        for (let a = 0.12 + r * 0.1; a < 1.5; a += 10 / (0.5 * (R1 + R2))) list.push(frameAt(x0 - R1 * Math.cos(a), 4.75, zs0 + 46 + R2 * Math.sin(a), Math.sin(a) * R1, 0, Math.cos(a) * R2).clone()); }
      const im = new THREE.InstancedMesh(sg, cordMat(P.orange, P.orangeDark, 0), list.length); list.forEach((m, i) => im.setMatrixAt(i, m));
      im.name = 'fly-j-stitch'; im.frustumCulled = false; scene.add(im); }
    await ctx.yield();

    // ---- R7 s1: THE SEAMS OF THE FLAT CLOTH BESIDE THE ZIP (added blocks only; no live line is changed by them). The brief: 'Seams:
    // ---- raised flat-felled ridges 9 m wide and 2 m high carrying two rows of orange topstitch ... they are the roads and field edges',
    // ---- 'Rivets: copper domes 6 m across ... wherever seams meet', 'Bar tacks ... closing every seam end'; the designer's word of 18:59 UTC
    // ---- on 7 October: 'seams as roads and field edges across the flat cloth on both sides of the zip, a rivet where two seams meet and a
    // ---- bar tack at every seam's end, are the design's own and are owed there.'
    // SHARED BY ITEMS 7 AND 8 (these lines stay while either item stays). Everything they lay on a flank is a new part of a live thing, the
    // rolling flank, and reads that thing's state by live's own rule CALLED, never copied: its place and its face's normal come from flankPos
    // (the part's GLSL_ROLL, imported), so it lies, lifts, winds and breathes exactly as the cloth under it does, with live's uCurl, uHop and
    // billow (the flank's own uBillow uniform, shared, not a second number). Nothing here is begun, ended, moved or lit by the journey,
    // the clock, a seed or the eye APART FROM THE CLOTH IT IS SEWN ON: on flat cloth these things read no key; on cloth the opening has
    // passed they show as the cloth under them shows, so live's typed key uCurl (the roll's growth over u 0.05 to 0.22) and uHop reach
    // them through the roll's radius and through nothing else (the owner, 7 October 21:53: it stands as a part of a live thing reading
    // that thing's state by live's rule, called and not copied).
    // THE TUCKED RULE: where the opening has passed a point (t under zipOpen(s), CALLED) and flankPos returns no winding for it, the cloth
    // there is 'tucked under at the contact line' (the part's words) and the thing on it has no size (a ridge: no height). flankShown is 1 on
    // flat or wound cloth and 0 on tucked cloth. It is continuous, so nothing pops: a thing the contact line overtakes shrinks over the
    // first 2 m the opening passes it by, and a thing whose winding runs out shrinks over its last 2 m of wound arc (2 m: a plain number).
    // The wound arc is th times the roll's mean radius, read from gFlankR as flankPos left it (max(R * 0.92, 0.5): the part's own Rm).
    const GLSL_TUCK = /* glsl */`
      float flankShown(float s, float t, float th){ float d = zipOpen(s) - t, arc = th * max(gFlankR * 0.92, 0.5);
        return mix(1.0, smoothstep(0.0, 1.0, arc / clamp(d, 1e-3, 2.0)), smoothstep(0.0, 2.0, d)); }`;
    const zipSt = hero.object.getObjectByName('zip-stitches'), flankBillow = hero.parts.flank.material.uniforms.uBillow, flankRidges = [];
    // a dash on the flank: the zip's own dash geometry (shared from the mesh 'zip-stitches', not rebuilt), placed by the zip's own vertex law
    // (a COPY of the text of the part's 'zip-stitches' vertex shader) with three things added: a direction of its own in (s, t), the slope of
    // its bed, and the tucked rule, judged ONCE for the whole dash at its centre. The seam's pucker is the world's own seamPucker, called.
    // Its far width (0.0045 of the eye's distance) is live's law for every dash (the cord material and the zip's dashes). Colours and the
    // two-ply drawing are the stitch material's own fragment text, used by reference.
    // one dash = [side, s, t, lift off the face, direction ds, dt, slope m per m, metres along its seam (0: no pucker)]
    const flankDashes = (list, name) => {
      if (!list.length || !zipSt) return null;
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', zipSt.geometry.attributes.position); g.setAttribute('uv', zipSt.geometry.attributes.uv); g.setIndex(zipSt.geometry.index);
      g.setAttribute('aST', new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((q) => q.slice(0, 4))), 4));
      g.setAttribute('aDir', new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((q) => q.slice(4, 8))), 4));
      g.instanceCount = list.length; g.boundingSphere = new THREE.Sphere(V3(0, 0, 0), 900);
      const m = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), uBillow: flankBillow, cA: { value: stitchCol }, cB: { value: P.orangeDark }, cH: { value: P.raw } }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + GLSL_ROLL + GLSL_PUCKER + GLSL_TUCK + /* glsl */`
          attribute vec4 aST; attribute vec4 aDir; varying vec2 vUv;
          void main(){ vec3 n; float th;
            vec3 org = flankPos(aST.x, aST.y, aST.z, n, th);
            float k = flankShown(aST.y, aST.z, th);
            float wide = max(1.0, distance(org, cameraPosition) * 0.0045);
            vec3 lp = position * k;
            vec2 st = aST.yz + aDir.xy * lp.z + vec2(-aDir.y, aDir.x) * lp.x * wide;
            vec3 p = flankPos(aST.x, st.x, st.y, n, th);
            p += n * k * (aST.w + aDir.z * position.z + position.y + 0.1 + step(0.5, aDir.w) * seamPucker(aDir.w + position.z)); vUv = uv;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
        fragmentShader: stitchMat.fragmentShader,
      });
      const mesh = new THREE.Mesh(g, m); mesh.name = name; mesh.frustumCulled = false; scene.add(mesh); return mesh; };
    await ctx.yield();

    // ITEM 8: THE NORTH YOKES RUN ON TO THE ZIP SEAM, WITH A COPPER RIVET AT EACH MEETING. Live's 'east-yoke-2' and 'west-yoke-2' stop in
    // open cloth at the hill's foot (|x| 158); a seam ends at a seam. Each is carried on from its first sample along that sample's own
    // tangent (seamInfo, read) to the outer edge of the zip seam's gutter, t 18.5 (|x| 23.5): a ridge of live's profile XS with live's wear
    // formula, two dash rows 2.2 m either side at live's pitch, phase and wander (live's noise expression with its metres carried on below
    // zero), and the pucker of live's seams with live's 'along' carried on, so a pucker crosses the join without a break. All of it rides
    // flankPos (from |x| 158 to 155, t to 153: flankPos returns the floor there). Heights: at the join the new ridge begins at live's end
    // height (the quarter) so there is no step, and is at full height by the rim of live's rivet, which sits on the join (3 m, the rivet's
    // radius: the rise is under the dome and the seam dips once, as live's end already does, not twice); at its zip end it has live's own
    // end ramp (9 m). Live's tack and rivet at the hill's foot stand where they stood and now lie ON the seam, not at its end. The new end
    // meets the zip seam: a rivet and no tack. One rivet (live's rivetGeo; style.metal('copper') with a placement of its own that hands on
    // vP, and SCRATCH set, so that it wears as live's fifty do) on each centre line one rivet's radius (3 m) short of the end, 2.1 m above
    // the cloth as live seats a rivet on a seam, standing in the cloth's own frame and tucked with it. No dash lies under a rivet: none
    // within 3.5 m of the join (half a dash) or 9.5 m of the zip end (the dome's 6 m and half a dash). Stream 'flank-yokes' (one draw a
    // dash: the skipped stitch, one in forty). Nothing is appended to SEAMS or rivetAt.
    // ONE RULE FOR ALL FOUR YOKES, BY THE PLACE: a yoke is carried on to the zip seam where its zip end lies on cloth still closed at the
    // entry. The two north yokes' ends do; the two south yokes' ends (z 299.4 and 256.8 on the zip seam) lie on cloth the opening takes
    // at the entry or within seconds of it, so the south pair is not carried on and stops at the hill's foot as live has it.
    { const yr = ctx.core.makeRng(ctx.core.hashSeed('flank-yokes:' + ctx.seed));
      const rp = [], ruv = [], rh = [], rcr = [], rw = [], rix = [], dashes = [], riv = [];
      const sPos = seams.geometry.attributes.position.array, sUv = seams.geometry.attributes.uv.array;
      for (const id of ['east-yoke-2', 'west-yoke-2']) {
        const a0 = seamInfo[id][0], sgn = a0.x < 0 ? -1 : 1, cx = -a0.tx, cz = -a0.tz, L = (Math.abs(a0.x) - 23.5) / Math.abs(cx);
        // the cloth coordinate across live's seam (the uv.x its centre line carries), read from live's own mesh so the yarns run on
        let uOff = 0; for (let k = 0; k < sPos.length / 3; k++) if (sPos[k * 3] === Math.fround(a0.x) && sPos[k * 3 + 2] === Math.fround(a0.z)) { uOff = sUv[k * 2]; break; }
        const hk = (d) => 0.25 + 0.75 * Math.min(smoothstep(0, 3, d), smoothstep(0, 9, L - d));
        const n = Math.round(L / 2), base = rp.length / 3;
        for (let i = 0; i <= n; i++) { const d = (i / n) * L, px = a0.x + cx * d, pz = a0.z + cz * d, k = hk(d);
          for (let c = 0; c < XS.length; c++) { const [o, hh, ww] = XS[c], x = px + a0.nx * o, z = pz + a0.nz * o;
            rp.push(sgn, z, sgn * x - 5); ruv.push(o + uOff, a0.along - d); rh.push(hh * k); rcr.push(hh > 1 ? (k - 0.25) / 0.75 : 0); rw.push(clamp(ww + washK * 0.6 + nightK, 0.02, 1));
            if (i < n && c < XS.length - 1) { const q = base + i * XS.length + c, q2 = q + XS.length; rix.push(q, q2, q + 1, q + 1, q2, q2 + 1); } } }
        for (let r = 0; r < 2; r++) for (let dd = 10 - (6 + r * 4.5); dd <= L - 9.5; dd += 10) {
          const skip = yr() < 0.025; if (skip || dd < 3.5) continue;
          const o = (r === 0 ? -2.2 : 2.2) + 0.5 * noise.n2(-dd * 0.03 + a0.along, r * 9.1);
          const x = a0.x + cx * dd + a0.nx * o, z = a0.z + cz * dd + a0.nz * o;
          dashes.push([sgn, z, sgn * x - 5, 2.05 * hk(dd) + 0.07, a0.tz, sgn * a0.tx, 2.05 * (hk(dd - 3.5) - hk(dd + 3.5)) / 7, a0.along - dd]); }
        riv.push(sgn, a0.z + cz * (L - 3), sgn * (a0.x + cx * (L - 3)) - 5);
        flankRidges.push({ x: a0.x, z: a0.z, cx, cz, L });
        await ctx.yield();
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
      rg.setAttribute('aH', new THREE.Float32BufferAttribute(rh, 1)); rg.setAttribute('aCrown', new THREE.Float32BufferAttribute(rcr, 1));
      rg.setAttribute('aWear', new THREE.Float32BufferAttribute(rw, 1)); rg.setIndex(rix); rg.boundingSphere = new THREE.Sphere(V3(0, 0, 0), 900);
      // the ridge: placed as the part places its 'zip-seam' ridge (a COPY of that vertex text) plus live's pucker and the tucked rule (per
      // vertex: a ridge is one strip, there is no dash to cut); drawn by live's seam material's own fragment text, used by reference
      const rm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), uBillow: flankBillow }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + GLSL_ROLL + GLSL_PUCKER + GLSL_TUCK + /* glsl */`
          attribute float aWear; attribute float aH; attribute float aCrown; varying vec2 vUv; varying float vWear;
          void main(){ vec3 n; float th; vec3 p = flankPos(position.x, position.y, position.z, n, th);
            float k = flankShown(position.y, position.z, th);
            p += n * (k * (aH + aCrown * seamPucker(uv.y)) + 0.12); vUv = uv; vWear = aWear;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }`,
        fragmentShader: seamMat.fragmentShader,
      });
      const ridge = new THREE.Mesh(rg, rm); ridge.name = 'flank-yoke-seams'; ridge.frustumCulled = false; scene.add(ridge);
      flankDashes(dashes, 'flank-yoke-stitches');
      const vg = new THREE.InstancedBufferGeometry();
      for (const key of ['position', 'normal', 'aEdge']) vg.setAttribute(key, rivetGeo.attributes[key]);
      vg.setIndex(rivetGeo.index); vg.setAttribute('aST', new THREE.InstancedBufferAttribute(new Float32Array(riv), 3)); vg.instanceCount = riv.length / 3;
      vg.boundingSphere = new THREE.Sphere(V3(0, 0, 0), 900);
      const vm = style.metal('copper', { uniforms: { ...style.clothUniforms(), uBillow: flankBillow },
        vertexShader: style.glsl.common + GLSL_ROLL + GLSL_TUCK + /* glsl */`
          attribute float aEdge; attribute vec3 aST; varying float vEdge; varying vec3 vN; varying vec3 vP;
          void main(){ vEdge = aEdge; vP = position; vec3 n; float th;
            vec3 org = flankPos(aST.x, aST.y, aST.z, n, th); float k = flankShown(aST.y, aST.z, th);
            vec3 e1 = vec3(n.y, -n.x, 0.0);
            vec3 p = org + k * (e1 * position.x + n * (position.y + 2.1) + vec3(0.0, 0.0, position.z));
            vN = mat3(modelMatrix) * (e1 * normal.x + n * normal.y + vec3(0.0, 0.0, normal.z));
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0); }` });
      vm.defines = { SCRATCH: 1 };
      const fr = new THREE.Mesh(vg, vm); fr.name = 'flank-yoke-rivets'; fr.frustumCulled = false; scene.add(fr); }
    await ctx.yield();

    // ITEM 7: THE FLY'S STITCH RUNS THE LENGTH OF THE FLY. Live's two rows of the fly's J (the block above: x -48 and -43) begin from nothing
    // at z 770. They are carried south at live's pitch, phase and wander (live's own expression: the row's x1 + 0.4 * noise.n2(d * 0.05,
    // r * 3.3), d its metres from live's zs0, carried on below zero) to z -330, where the zip's own dashes begin. They ride the west flank's
    // face at t 43 and 38 (x = -(t + 5)), 0.65 m off it: live's rows lie at y 4.75, less the floor's 4 and the 0.1 the dash's law adds, so
    // there is no step at z 770. One skip in forty (the brief: 'one skipped stitch in forty') from the stream 'fly-rows', one draw a dash.
    // No dash whose centre or either end has kneeD under 1.0, inside which the land is the knee's; none whose centre or either end is
    // within a carried ridge's half-width (6.4 m) of its centre line (item 8's list; empty if that item is taken out). Both rules, and the
    // tucked rule in the shader, are judged for the whole dash, so none is cut in half.
    { const fr = ctx.core.makeRng(ctx.core.hashSeed('fly-rows:' + ctx.seed)), zs0 = hero.sliderZAt(1e3) + 16, list = [];
      const onRidge = (x, z) => flankRidges.some((q) => { const u = (x - q.x) * q.cx + (z - q.z) * q.cz; return u > 0 && u < q.L && Math.abs((x - q.x) * q.cz - (z - q.z) * q.cx) < 6.4; });
      for (let r = 0; r < 2; r++) { const x1 = -22 - (26 - r * 5);
        for (let d = 2 + r * 5 - 10; zs0 + d >= -330; d -= 10) {
          const skip = fr() < 0.025, x = x1 + 0.4 * noise.n2(d * 0.05, r * 3.3), z = zs0 + d;
          if (skip || Math.min(kneeD(x, z), kneeD(x, z - 3.5), kneeD(x, z + 3.5)) < 1.0 || onRidge(x, z) || onRidge(x, z - 3.5) || onRidge(x, z + 3.5)) continue;
          list.push([-1, z, -x - 5, 0.65, 1, 0, 0, 0]); }
        await ctx.yield(); }
      flankDashes(list, 'fly-rows'); }
    await ctx.yield();

    // ITEM 9: THE FLY'S BAR TACK AND ITS TAIL (the brief: 'Bar tacks: dense orange zigzag blocks 20 m long closing every seam end'; 'Thread
    // tails: at every bar tack one loose orange end 6 to 15 m long lifts and falls'). Where live's rows begin to hook (z 812): one tack from
    // z 792 to 812 on x -45.5, its half-width live's 2.6 m, which spans the two rows (x -48 and -43), and one loose tail, both built as live
    // builds its tacks and tails (30 zigzag strokes of 0.68 m; a tail of ten pieces whose sway grows to its free end), in a mesh of its own
    // with a material of live's tack kind. It lies 0.45 m over the rows' own height (4.75), as live's tacks lie over their dashes, on
    // closed cloth north of the stop that the zip never opens, and like live's rows there it does not billow. Stream 'fly-tack': three
    // draws (the tail's length, side and angle). It is small: the lens is never under 33 m from closed cloth, and no larger landmark is
    // built here (the designer's word bars another button, label or loop).
    { const tr = ctx.core.makeRng(ctx.core.hashSeed('fly-tack:' + ctx.seed)), T = { x: -45.5, y: 4.7, z: 792, tx: 0, tz: 1 }, pos = [], uvs = [], sway = [], idx = [];
      const quad = (ax, ay, az, bx2, by2, bz2, hw, s0, s1) => {
        let dx = bx2 - ax, dz = bz2 - az; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const k = pos.length / 3;
        pos.push(ax - dz * hw, ay, az + dx * hw, ax + dz * hw, ay, az - dx * hw, bx2 - dz * hw, by2, bz2 + dx * hw, bx2 + dz * hw, by2, bz2 - dx * hw);
        uvs.push(0, 0, 0, 1, l, 0, l, 1); sway.push(s0, s0, s1, s1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); };
      const nx = T.tz, nz = -T.tx;
      for (let i = 0; i < 30; i++) { const d0 = i * 0.68, d1 = d0 + 0.68, sd = i % 2 ? 1 : -1;
        quad(T.x + T.tx * d0 + nx * 2.6 * sd, T.y + 0.5, T.z + T.tz * d0 + nz * 2.6 * sd, T.x + T.tx * d1 - nx * 2.6 * sd, T.y + 0.5, T.z + T.tz * d1 - nz * 2.6 * sd, 0.42, 0, 0); }
      const L = tr.range(6, 15), side = tr() < 0.5 ? -1 : 1, ang = tr.range(0.5, 1.2) * side, ca = Math.cos(ang), sa = Math.sin(ang);
      const dx = -(T.tx * ca - T.tz * sa), dz = -(T.tx * sa + T.tz * ca);
      for (let i = 0; i < 10; i++) { const d0 = (i / 10) * L, d1 = ((i + 1) / 10) * L;
        const x0 = T.x + dx * d0, z0 = T.z + dz * d0, x1 = T.x + dx * d1, z1 = T.z + dz * d1;
        quad(x0, Math.max(land(x0, z0), T.y - 2.2) + 0.5, z0, x1, Math.max(land(x1, z1), T.y - 2.2) + 0.5, z1, 0.4, i / 10, (i + 1) / 10); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1)); g.setIndex(idx);
      const tm = cordMat(stitchCol, P.orangeDark, 0); tm.side = THREE.DoubleSide;
      const mesh = new THREE.Mesh(g, tm); mesh.name = 'fly-tack'; mesh.frustumCulled = false; scene.add(mesh); }
    await ctx.yield();

    // ---- R8 s1: A BACK POCKET SEWN ON THE EAST CLOTH (added lines only; no line of the start version is changed by them). The designer's
    // ---- ruling of 18:59 UTC on 7 October: 'What the flat cloth MAY carry besides, garment true: a pocket's sewn outline with its curved
    // ---- double stitch, a patch, a hem's pucker, a loose thread tail', with 'a rivet where two seams meet and a bar tack at every seam's
    // ---- end'. The brief: 'Seams: raised flat-felled ridges 9 m wide and 2 m high carrying two rows of orange topstitch, each stitch a
    // ---- separate two-ply dash 7 m long with a 3 m gap', 'Rivets: copper domes 6 m across ... wherever seams meet', 'Bar tacks: dense
    // ---- orange zigzag blocks 20 m long', 'Thread tails: at every bar tack one loose orange end 6 to 15 m long lifts and falls', and the
    // ---- light: rubbed pale are 'the crown of every seam, the edges of pockets'; 'the gutters beside seams ... stay raw dark'.
    // SHARED BY THIS ROUND'S THINGS (they stay while any of them stays). Everything here lies on cloth that is flat for the whole flight,
    // so it rides no roll and needs no tucked rule. It is built at the height live's land() gives for its place, and it BREATHES WITH THE
    // FLOOR UNDER IT: the floor there is the hero's flank, whose breath is the part's flankPos (flat branch: floor height plus its billow
    // held by the distance from the tape), so each material here is one of live's own (the seam's, the cord's, the kit's denim), its text
    // used by reference, with ONE term exchanged: live's free billow of the hills for the flank's own, CALLED (flankBed: flankPos at the
    // vertex's own place, less the part's floor height). The part's floor height and tape gap are read from the hero (anchors.zipFrom.y;
    // openingAt's edge less its w), not typed. The uBillow these materials read is the flank's own uniform object, shared.
    const flatY = hero.anchors.zipFrom.y, tapeGap = (() => { const o = hero.openingAt(0, 0); return o.edge - o.w; })();
    const GLSL_BED = /* glsl */`
      float flankBed(vec2 xz){ vec3 n; float th; return flankPos(xz.x < 0.0 ? -1.0 : 1.0, xz.y, abs(xz.x) - ${tapeGap.toFixed(1)}, n, th).y - ${flatY.toFixed(1)}; }`;
    const flatBed = (vs) => { const c = style.glsl.common, body = vs.slice(vs.indexOf(c) + c.length);
      return c + GLSL_ROLL + GLSL_BED + body.replace('uniform float uBillow;', '').replace(/(?:uBillow|1\.5) \* denimBillow\(wp\.xz, uTime\)/, 'flankBed(wp.xz)'); };
    const onFlat = (m) => { m.uniforms = { ...style.clothUniforms(), ...m.uniforms, uBillow: flankBillow }; m.vertexShader = flatBed(m.vertexShader); return m; };
    // THE BREAKER'S REACH. Cloth that stays flat for the whole flight lies outside the opening at its widest (the slider at its stop):
    // |x| over openingAt(z, stop).edge, which is 0.3 * (767 - z) + 17 where the opening is past its eased start. But the rolled edge
    // flops OUTWARD over flat cloth: the part's own words are 'the roll spans |x| from edge - 1.2 roll to edge + 1.2 roll' and 'it swells
    // to 1.22 R between gathers'. So nothing of this round lies nearer the zip than flatReach(z) = edge + 1.2 * 1.22 * roll, both read
    // from the part by openingAt, CALLED with the stop (sliderZAt of a late second); and each thing keeps a margin beyond it.
    const zStopAll = hero.sliderZAt(1e3), flatReach = (z) => { const o = hero.openingAt(z, zStopAll); return o.edge + 1.2 * 1.22 * o.roll; };
    const SEAMW = 9;                                         // one seam's width (the brief: 'ridges 9 m wide'): this round's margin to every bound of a room
    // polygons in plan, [x, z]: a line moved inward by its own distance (unequal insets: one number a side), and the meeting points
    const insetPoly = (P5, ds) => { const n = P5.length; let ar = 0; for (let i = 0; i < n; i++) { const p = P5[i], q = P5[(i + 1) % n]; ar += p[0] * q[1] - q[0] * p[1]; }
      const sg = ar > 0 ? 1 : -1, L = P5.map((p, i) => { const q = P5[(i + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]), nx = -(q[1] - p[1]) / l * sg, nz = (q[0] - p[0]) / l * sg, d = Array.isArray(ds) ? ds[i] : ds;
        return { px: p[0] + nx * d, pz: p[1] + nz * d, dx: (q[0] - p[0]) / l, dz: (q[1] - p[1]) / l, nx, nz }; });
      return L.map((b, i) => { const a = L[(i + n - 1) % n], den = a.dx * b.dz - a.dz * b.dx, t = ((b.px - a.px) * b.dz - (b.pz - a.pz) * b.dx) / den; return [a.px + a.dx * t, a.pz + a.dz * t]; }); };
    // metres inside a convex polygon to its nearest side (negative outside), and which side that is
    const insideBy = (P5, x, z, out) => { const n = P5.length; let ar = 0, best = 1e9, bi = 0; for (let i = 0; i < n; i++) { const p = P5[i], q = P5[(i + 1) % n]; ar += p[0] * q[1] - q[0] * p[1]; }
      const sg = ar > 0 ? 1 : -1; for (let i = 0; i < n; i++) { const p = P5[i], q = P5[(i + 1) % n], l = Math.hypot(q[0] - p[0], q[1] - p[1]), d = (-(q[1] - p[1]) * (x - p[0]) + (q[0] - p[0]) * (z - p[1])) / l * sg; if (d < best) { best = d; bi = i; } }
      if (out) out.side = bi; return best; };
    await ctx.yield();
    {
      // THE ROOM, in metres, verified from the source: EAST, x 40 to 150 (40: 5 m clear of the stopped casting's 35 m half-width; 150: the
      // flank's cloth ends at 155, where the hills begin), z 615 to 815 (615: clear of the carried east yoke, whose ridge reaches z 614 at
      // x 158; 815: the worn slope under the hem begins there and the hem's ridge can come down to z 814.6), LESS what the breaker reaches
      // (flatReach above: the room's south-west corner is not flat for the whole flight; at z 615 the reach is x 76). The pocket's whole
      // footprint (its gutters too) keeps one seam's width to every one of those bounds, the breaker's reach among them.
      // THE SHIELD: as wide as the room lets (110 - 2 * 9 = 92 m), 1.15 times as tall as wide (105.8 m; the room's 200 m let it); a level
      // top hem to the north, two sides running south and inward by 6 % of the width each, to lower corners a fifth of the height above
      // the point (6 % and a fifth: plain numbers), two short edges meeting in a point on the middle line. It is centred across the room.
      // Along the room it cannot stand in the middle (the breaker would lie on its south-west corner), so it stands midway between the
      // northmost and the southmost places that keep the margin to every bound: found here by trying places every half metre (a plain
      // number) from the north, the margin tried every 2 m round the outline. Nothing in this reads a seed, the clock, u or the eye.
      const pr = ctx.core.makeRng(ctx.core.hashSeed('east-back-pocket:' + ctx.seed));
      const ROOM = { x0: 40, x1: 150, z0: 615, z1: 815 }, PW = ROOM.x1 - ROOM.x0 - 2 * SEAMW, PH = Math.min(1.15 * PW, ROOM.z1 - ROOM.z0 - 2 * SEAMW), xc = (ROOM.x0 + ROOM.x1) / 2;
      const shieldAt = (zTop) => [[xc - PW / 2, zTop], [xc + PW / 2, zTop], [xc + PW / 2 - 0.06 * PW, zTop - 0.8 * PH], [xc, zTop - PH], [xc - PW / 2 + 0.06 * PW, zTop - 0.8 * PH]];
      const roomBy = (x, z) => Math.min(x - ROOM.x0, ROOM.x1 - x, z - ROOM.z0, ROOM.z1 - z, x - flatReach(z));       // metres inside the room, the breaker's reach among its bounds
      const fitBy = (S5) => { let m = 1e9; for (let i = 0; i < S5.length; i++) { const p = S5[i], q = S5[(i + 1) % S5.length], n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2);
        for (let k = 0; k <= n; k++) m = Math.min(m, roomBy(lerp(p[0], q[0], k / n), lerp(p[1], q[1], k / n))); } return m; };
      const zNorth = ROOM.z1 - SEAMW; let zSouth = zNorth;
      while (zSouth - 0.5 - PH >= ROOM.z0 + SEAMW && fitBy(shieldAt(zSouth - 0.5)) >= SEAMW) zSouth -= 0.5;
      const zTop = (zNorth + zSouth) / 2, FOOT = shieldAt(zTop);                   // the footprint: outer edge of the outline seam's outer gutter
      await ctx.yield();
      // (b) THE OUTLINE AS THE DESIGN'S SEAM: live's ridge profile XS with live's wear formula, laid round all five sides as one closed
      // strip, its centre line XS's half-width (6.4 m) inside the footprint, so the turned edge of the pocket's cloth is the ridge's outer
      // flank (the step: 0.12 to 1.7 m in 0.9 m) and the dark gutter outside it lies on the floor, as beside every live seam. Sections
      // every 2 m (live's seam sampling is 2 m); at a corner the section lies on the bisector, so the profile turns the corner whole.
      // Full height all round (a closed seam has no end to ramp to); live's crown flag, so live's pucker travels round the pocket.
      const HALF = XS[XS.length - 1][0], CL = insetPoly(FOOT, HALF), rows = [], sideAt = [];
      { let along = 20;                                       // 20: where live's first seam begins its metres
        for (let s = 0; s < 5; s++) { const p = CL[s], q = CL[(s + 1) % 5], pv = CL[(s + 4) % 5], l = Math.hypot(q[0] - p[0], q[1] - p[1]), tx = (q[0] - p[0]) / l, tz = (q[1] - p[1]) / l;
          const lp = Math.hypot(p[0] - pv[0], p[1] - pv[1]), px = (p[0] - pv[0]) / lp, pz = (p[1] - pv[1]) / lp, nx = tz, nz = -tx, mx = tz + pz, mz = -(tx + px), mk = 1 / (1 + tx * px + tz * pz), n = Math.round(l / 2);
          sideAt.push({ x: p[0], z: p[1], tx, tz, nx, nz, l, along, row0: rows.length, n });
          for (let i = 0; i < n; i++) rows.push(i === 0 ? { x: p[0], z: p[1], nx: mx * mk, nz: mz * mk, along } : { x: p[0] + tx * l * i / n, z: p[1] + tz * l * i / n, nx, nz, along: along + l * i / n });
          along += l; }
        rows.push({ ...rows[0], along }); }
      await ctx.yield();
      const uOff = pr.range(0, 400), rp = [], ruv = [], rw = [], rcr = [], rix = [];             // the cloth coordinate across this seam (live: a number of its own for every seam)
      rows.forEach((R, i) => { XS.forEach(([o, hh, ww], c) => { const x = R.x + R.nx * o, z = R.z + R.nz * o;
        rp.push(x, land(x, z) + hh + 0.12, z); ruv.push(o + uOff, R.along); rw.push(clamp(ww + washK * 0.6 + nightK, 0.02, 1)); rcr.push(hh > 1 ? 1 : 0);
        if (i < rows.length - 1 && c < XS.length - 1) { const k = i * XS.length + c, k2 = k + XS.length; rix.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }); });
      await ctx.yield();
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
      rg.setAttribute('aWear', new THREE.Float32BufferAttribute(rw, 1)); rg.setAttribute('aCrown', new THREE.Float32BufferAttribute(rcr, 1)); rg.setIndex(rix);
      const pocketSeamMat = onFlat(new THREE.ShaderMaterial({ uniforms: {}, side: THREE.DoubleSide, vertexShader: seamMat.vertexShader, fragmentShader: seamMat.fragmentShader }));
      const pocketSeam = new THREE.Mesh(rg, pocketSeamMat); pocketSeam.name = 'east-pocket-seam'; pocketSeam.frustumCulled = false; scene.add(pocketSeam);
      // two rows of separate dashes on each side's crown: live's loop, number for number (first dash 6 m and 10.5 m in, 10 m pitch, none
      // within 8 m of the side's end, rows 2.2 m either side wandering half a metre by live's noise expression, 0.05 m over the crown
      // (2.05 + 0.12), one skip in forty: one draw a dash from this stage's stream), each side stitched as a seam of its own from corner
      // to corner. A dash near the route is live's full dash with its holes, a far one live's light dash, by live's own rule (110 m in
      // plan from the route, CALLED). Their metres along (for the pucker) are the outline's own.
      const pkFull = [], pkLite = [], crownY = XS[3][1] + 0.12;
      for (const S of sideAt) for (let r = 0; r < 2; r++) for (let d = 6 + r * 4.5; d < S.l - 8; d += 10) {
        if (pr() < 0.025) continue;
        const o = (r === 0 ? -2.2 : 2.2) + 0.5 * noise.n2(d * 0.03 + S.along, r * 9.1), x = S.x + S.tx * d + S.nx * o, z = S.z + S.tz * d + S.nz * o;
        frameAt(x, land(x, z) + crownY + 0.05, z, S.tx, 0, S.tz);
        (path.nearestXZ(x, z).dist < 110 ? pkFull : pkLite).push({ m: m4.clone(), along: S.along + d }); }
      await ctx.yield();
      // (a) THE POCKET'S CLOTH: a second layer of the world's own denim (style.denim, the kit's cloth shader, CALLED), standing proud of
      // the floor by a cloth's thickness: 1 m, a plain number (half the seam's 2 m: a felled seam is the cloth turned twice on itself).
      // Its edge runs under the outline seam's centre line, where the ridge stands 1.9 m, so this layer's own edge is never seen: what
      // is seen is the ridge's outer flank rising from the floor (the turned edge, the step) and its inner flank coming down to the face.
      // Its GRAIN is turned 0.35 rad against the course the other way from the floor's (0.10 to 0.19 rad): a plain number, as a separate
      // panel is cut; its place in the cloth's noise is two draws of this stage's stream (the wear's seed).
      // Its WEAR, by the metres q inward from the foot of the nearest raised thing (the seam's inner foot, XS's 4.6 m; the hem band's
      // step): the gutter raw dark (XS's own gutter tones, 0.03 at the foot to 0.10 at 1.8 m, XS's gutter width); then rubbed pale
      // (the brief: 'the edges of pockets'), XS's flank tone 0.74 at 4.5 m (a plain number: half a seam's width); then back to THE CLOTH
      // TONE by 22.5 m (two seam widths further), the middle keeping it. The rubbed tones take the wash as live's waistband does
      // (washK * 0.7 + nightK); the cloth tone is READ from the floor under the pocket's middle (the flank's own baked wear at its
      // nearest vertex), so on every wash the middle is the floor's tone. Slivers along the grain: the hills' own expression (W 212).
      const CLOTH = 1, HEMW = 13.5, FOOTIN = XS[7][0], HEMIN = HEMW - FOOTIN, GR = -0.35, cgr = Math.cos(GR), sgr = Math.sin(GR), uA = pr.range(0, 400), uB = pr.range(0, 400);
      let floorTone = 0.32; { const fg = hero.parts.flank.geometry, fpz = fg.attributes.position.array, fwr = fg.attributes.aWear.array, pzc = zTop - PH / 2; let bd = 1e9;
        for (let k = 0; k < fwr.length; k++) if (fpz[k * 3] > 0) { const dd = Math.abs(fpz[k * 3 + 1] - pzc) + Math.abs(fpz[k * 3 + 2] + tapeGap - xc); if (dd < bd) { bd = dd; floorTone = fwr[k]; } } }
      const faceWear = (q, u, v) => { const k = smoothstep(4.5, 22.5, q), tone = q < 1.8 ? lerp(XS[7][2], XS[8][2], clamp(q / 1.8, 0, 1)) : lerp(XS[8][2], XS[2][2], smoothstep(1.8, 4.5, q));
        return clamp(lerp(tone + washK * 0.7 + nightK, floorTone, k) + 0.10 * noise.fbm2(u * 0.017 + uA * 0.1, v * 0.0023 + uB * 0.1, 3) * smoothstep(1.8, 9, q), 0.02, 1); };
      const fpos = [], fuv = [], fwr2 = [], fix = [], SEGS = [12, 12, 6, 6, 12], NR = SEGS.reduce((a2, b2) => a2 + b2, 0), QS = [-1, 0, 1.8, 4.5, 9, 15, 22.5];
      const putF = (x, z, y, w) => { const u = x * cgr - z * sgr + uA, v = x * sgr + z * cgr + uB; fpos.push(x, land(x, z) + y, z); fuv.push(u, v); fwr2.push(w < 0 ? faceWear(-w - 1, u, v) : w); };
      QS.forEach((q, j) => { const R5 = insetPoly(CL, q < 0 ? [HEMIN, 0, 0, 0, 0] : [HEMIN + q, FOOTIN + q, FOOTIN + q, FOOTIN + q, FOOTIN + q]);
        for (let s = 0; s < 5; s++) for (let k = 0; k < SEGS[s]; k++) { const p = R5[s], p2 = R5[(s + 1) % 5]; putF(lerp(p[0], p2[0], k / SEGS[s]), lerp(p[1], p2[1], k / SEGS[s]), CLOTH, -Math.max(q, 0) - 1); }
        if (j > 0) for (let k = 0; k < NR; k++) { const a0 = (j - 1) * NR + k, a1 = (j - 1) * NR + (k + 1) % NR, b0 = a0 + NR, b1 = a1 + NR; fix.push(a0, a1, b0, a1, b1, b0); } });
      { const last = (QS.length - 1) * NR; let mx = 0, mz = 0; for (let k = 0; k < NR; k++) { mx += fpos[(last + k) * 3] / NR; mz += fpos[(last + k) * 3 + 2] / NR; }
        putF(mx, mz, CLOTH, -QS[QS.length - 1] - 1); for (let k = 0; k < NR; k++) fix.push(last + k, last + (k + 1) % NR, last + NR); }
      await ctx.yield();
      // THE TOP HEM, A DOUBLED BAND: the pocket's cloth folded over on itself along its top edge, 13.5 m wide from the cloth's edge (a
      // plain number: one and a half seam widths). Its outer 9.2 m are the outline seam itself; from under that seam's inner crown
      // (2.2 m inside the centre line, where the ridge stands 2.05 m) the fold runs on level at two cloths' thickness (2 m) to the hem's
      // lower edge 8.9 m inside the centre line, and steps down one cloth to the face. Between the two side seams (it ends 4.1 m inside
      // their centre lines, where their inner flanks pass the face's height). Wear: XS's own tones (0.76, the middle of a seam; 0.92, a
      // crown, along the rubbed lower edge; the step going down to the gutter's 0.03), with live's seam formula for the wash.
      { const b0 = fpos.length / 3, NB = 12, cols = [[2.2, 2 * CLOTH, XS[4][2]], [HEMIN - 1.5, 2 * CLOTH, XS[4][2]], [HEMIN, 2 * CLOTH, XS[3][2]], [HEMIN + 0.4, CLOTH - 0.1, XS[7][2]]];
        const xOn = (S, z, ins) => S.x + S.nx * ins + S.tx * ((z - S.z - S.nz * ins) / S.tz), zT = CL[0][1];
        for (let i = -1; i <= NB + 1; i++) cols.forEach(([o, y, w], c) => { const z = zT - o, xl = xOn(sideAt[4], z, 4.1), xr = xOn(sideAt[1], z, 4.1), end = i < 0 || i > NB;
          putF(end ? (i < 0 ? xl - 0.4 : xr + 0.4) : lerp(xl, xr, i / NB), z, end ? CLOTH - 0.1 : y, clamp((end ? XS[7][2] : w) + washK * 0.6 + nightK, 0.02, 1));
          if (i <= NB && c < cols.length - 1) { const k = b0 + (i + 1) * cols.length + c, k2 = k + cols.length; fix.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }); }
      const fgeo = new THREE.BufferGeometry();
      fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3)); fgeo.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
      fgeo.setAttribute('aWear', new THREE.Float32BufferAttribute(fwr2, 1)); fgeo.setIndex(fix);
      const pocketCloth = new THREE.Mesh(fgeo, onFlat(style.denim({ twoSided: true }))); pocketCloth.name = 'east-pocket-cloth'; pocketCloth.frustumCulled = false; scene.add(pocketCloth);
      await ctx.yield();
      // (c) THE CURVED DOUBLE STITCH across the face (the arcs every back pocket carries): ONE curve stated by the pocket's own measure:
      // it starts and ends on the two side seams' centre lines at 62 % of the pocket's height above its point, and dips to 40 % of the
      // height on the middle line (62 and 40: plain numbers); a quadratic curve through those three places. Two rows of dashes, one
      // 2.2 m to either side of it (live's row offset from a seam's middle), dashes alone, straight into the cloth, as live's west pocket
      // has them (W 409 to 420: first dash 4 m along, 10 m pitch, none within 6 m of the end, 0.25 m over the cloth, no pucker), one
      // skip in forty (one draw a dash). No dash either of whose ends lies on a side seam (within the ridge's inner foot, 4.6 m, of the
      // outline's centre line): a rule of the place, tried after the draw.
      { const zPt = zTop - PH, zA = zPt + 0.62 * PH, zM = zPt + 0.40 * PH, xOn = (S, z) => S.x + S.tx * ((z - S.z) / S.tz);
        const arc = new THREE.QuadraticBezierCurve3(V3(xOn(sideAt[4], zA), 0, zA), V3(xc, 0, 2 * zM - zA), V3(xOn(sideAt[1], zA), 0, zA)), L = arc.getLength(), q = new THREE.Vector3(), tg = new THREE.Vector3();
        for (let r = 0; r < 2; r++) for (let d = 4; d < L - 6; d += 10) {
          const skip = pr() < 0.025; arc.getPointAt(d / L, q); arc.getTangentAt(d / L, tg);
          const o = r === 0 ? -2.2 : 2.2, x = q.x + tg.z * o, z = q.z - tg.x * o;
          if (skip || insideBy(CL, x - tg.x * 3.5, z - tg.z * 3.5) < FOOTIN || insideBy(CL, x + tg.x * 3.5, z + tg.z * 3.5) < FOOTIN) continue;
          frameAt(x, land(x, z) + CLOTH + 0.25, z, tg.x, 0, tg.z);
          (path.nearestXZ(x, z).dist < 110 ? pkFull : pkLite).push({ m: m4.clone(), along: 0 }); } }
      await ctx.yield();
      // the dashes: live's two dash geometries (the kit's stitch with live's holes; live's light dash) and live's cord material
      // (cordMat, CALLED: the two-ply drawing, the far width, the pucker), on the floor's own breath
      const pocketCord = onFlat(cordMat(stitchCol, P.orangeDark));
      for (const [list, geo, name] of [[pkFull, holedStitch(style.stitchGeometry(7)), 'east-pocket-stitches-near'], [pkLite, liteGeo.clone(), 'east-pocket-stitches-far']]) {
        if (!list.length) { geo.dispose(); continue; }
        const im = new THREE.InstancedMesh(geo, pocketCord, list.length), al = new Float32Array(list.length);
        list.forEach((o, i) => { im.setMatrixAt(i, o.m); al[i] = o.along; });
        geo.setAttribute('aAlong', new THREE.InstancedBufferAttribute(al, 1));
        im.name = name; im.frustumCulled = false; scene.add(im);
      }
      await ctx.yield();
      // (d) A COPPER RIVET AT EACH OF THE TWO TOP CORNERS, where the hem's seam meets a side seam (the design's law: a rivet where two
      // seams meet): live's rivetGeo (the design's 6 m dome, no larger), on the corner of the two centre lines, 2.1 m over the cloth as
      // live seats a rivet on a seam, upright (the floor is level there), in the kit's copper (style.metal('copper'), CALLED) with
      // SCRATCH set so that it wears as live's fifty do. Its placement text is the kit's stock metal vertex text, a COPY, plus the
      // floor's breath at the dome's own foot. NO RIVET AT THE THREE LOWER CORNERS: there one seam turns; two seams do not meet.
      { const rm = style.metal('copper', { uniforms: { ...style.clothUniforms(), uBillow: flankBillow },
          vertexShader: style.glsl.common + GLSL_ROLL + GLSL_BED + /* glsl */`
            attribute float aEdge; varying float vEdge; varying vec3 vN; varying vec3 vP;
            void main(){ vEdge = aEdge; vP = position; mat4 mm = modelMatrix * instanceMatrix; vN = mat3(mm) * normal;
              vec4 wp = mm * vec4(position, 1.0); wp.y += flankBed(mm[3].xz);
              gl_Position = projectionMatrix * viewMatrix * wp; }` });
        rm.defines = { SCRATCH: 1 };
        const pv = new THREE.InstancedMesh(rivetGeo, rm, 2), q0 = new THREE.Quaternion(), s1 = V3(1, 1, 1);
        for (let i = 0; i < 2; i++) { m4.compose(V3(CL[i][0], land(CL[i][0], CL[i][1]) + 2.1, CL[i][1]), q0, s1); pv.setMatrixAt(i, m4); }
        pv.name = 'east-pocket-rivets'; pv.frustumCulled = false; scene.add(pv); }
      // (e) A BAR TACK 20 m LONG AT EACH END OF THE TOP HEM, lying along the hem's centre line inside the corner rivet, and at each ONE
      // LOOSE TAIL (the brief: 'at every bar tack one loose orange end 6 to 15 m long lifts and falls'). Built as live builds its tacks
      // and tails (W 441 to 452: 30 zigzag strokes of 0.68 m, half-width 2.6 m, which spans the two rows; a tail of ten pieces whose
      // sway grows to its free end; length 6 to 15 m, a side, an angle of 0.5 to 1.2 rad: three draws a tail from this stage's stream),
      // drawn by live's cord material, CALLED, so the breeze moves the tails by live's own rule for a tail. Each tack begins 7.5 m from
      // its corner (a plain number: a tail leaving at its least angle then passes 7.5 * sin 0.5 = 3.6 m from the rivet's middle, clear
      // of the dome's 3.06 m and its own half-width). A tail lies on whatever of the pocket is under it (the height of this pocket's own
      // things at that place, worked out from the same numbers they were built with) by live's expression. If the hem were too short for
      // two tacks of 20 m and their setting-in (55 m; it is 79 m) none would be built and the rivets would close the ends.
      { const pos = [], uvs = [], sway = [], idx = [], SET = 7.5, hemL = Math.hypot(CL[1][0] - CL[0][0], CL[1][1] - CL[0][1]);
        const quad = (ax, ay, az, bx2, by2, bz2, hw, s0, s1) => {
          let dx = bx2 - ax, dz = bz2 - az; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const k = pos.length / 3;
          pos.push(ax - dz * hw, ay, az + dx * hw, ax + dz * hw, ay, az - dx * hw, bx2 - dz * hw, by2, bz2 + dx * hw, bx2 + dz * hw, by2, bz2 - dx * hw);
          uvs.push(0, 0, 0, 1, l, 0, l, 1); sway.push(s0, s0, s1, s1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); };
        const topOf = (x, z) => { const sd = {}, d = insideBy(CL, x, z, sd), a = Math.abs(d); let h = 0;
          for (let c = 4; c < XS.length - 1; c++) if (a >= XS[c][0] && a <= XS[c + 1][0]) h = lerp(XS[c][1], XS[c + 1][1], (a - XS[c][0]) / (XS[c + 1][0] - XS[c][0])) + 0.12;
          return d > 0 ? Math.max(h, sd.side === 0 && d < HEMIN ? 2 * CLOTH : CLOTH) : h; };
        if (hemL >= 2 * (SET + 20)) for (let e = 0; e < 2; e++) {
          const S = sideAt[0], sg = e ? -1 : 1, d0 = e ? S.l - SET : SET, tx = S.tx * sg, tz = S.tz * sg, T = { x: S.x + S.tx * d0, z: S.z + S.tz * d0 }, nx = tz, nz = -tx;
          T.y = land(T.x, T.z) + XS[4][1] + 0.12;
          for (let i = 0; i < 30; i++) { const a0 = i * 0.68, a1 = a0 + 0.68, sd = i % 2 ? 1 : -1;
            quad(T.x + tx * a0 + nx * 2.6 * sd, T.y + 0.5, T.z + tz * a0 + nz * 2.6 * sd, T.x + tx * a1 - nx * 2.6 * sd, T.y + 0.5, T.z + tz * a1 - nz * 2.6 * sd, 0.42, 0, 0); }
          const L = pr.range(6, 15), side = pr() < 0.5 ? -1 : 1, ang = pr.range(0.5, 1.2) * side, ca = Math.cos(ang), sa = Math.sin(ang);
          const dx = -(tx * ca - tz * sa), dz = -(tx * sa + tz * ca);
          for (let i = 0; i < 10; i++) { const a0 = (i / 10) * L, a1 = ((i + 1) / 10) * L, x0 = T.x + dx * a0, z0 = T.z + dz * a0, x1 = T.x + dx * a1, z1 = T.z + dz * a1;
            quad(x0, Math.max(land(x0, z0) + topOf(x0, z0), T.y - 2.2) + 0.5, z0, x1, Math.max(land(x1, z1) + topOf(x1, z1), T.y - 2.2) + 0.5, z1, 0.4, i / 10, (i + 1) / 10); } }
        if (pos.length) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
          g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1)); g.setIndex(idx);
          const tm = onFlat(cordMat(stitchCol, P.orangeDark)); tm.side = THREE.DoubleSide;
          const mesh = new THREE.Mesh(g, tm); mesh.name = 'east-pocket-tacks'; mesh.frustumCulled = false; scene.add(mesh); } }
      // (the east back pocket ends here)
    }
    await ctx.yield();

    // ---- R8 s2: A PATCH SEWN ON THE WEST CLOTH, AND THE HEM'S PUCKER (added lines only; no line of the start version or of stage s1 is
    // ---- changed by them). The designer's ruling of 18:59 UTC on 7 October: 'What the flat cloth MAY carry besides, garment true: a
    // ---- pocket's sewn outline with its curved double stitch, a patch, a hem's pucker, a loose thread tail.' The brief: 'Raw cloth is
    // ---- indigo', 'wherever an edge is frayed ... white weft threads hang', 'puckers along hems', 'one skipped stitch in forty'.
    // Both lie on cloth flat for the whole flight and breathe with the floor under them by stage s1's rule (onFlat, flatReach, SEAMW).
    {
      const pw = ctx.core.makeRng(ctx.core.hashSeed('west-patch:' + ctx.seed));
      // THE FLOOR UNDER THEM, READ: the west flank's own cloth coordinate and baked wear at a place, from the flank's own mesh (its
      // vertices are (side, s, t) in rows of one s; the row's length is counted, not typed), so that a thing can be cut from, or turned
      // against, the floor's own grain and keep the floor's own tone where it meets the floor.
      const fgW = hero.parts.flank.geometry, fP = fgW.attributes.position.array, fW = fgW.attributes.aWear.array, fU = fgW.attributes.uv.array, half = fW.length / 2;
      let nT = 1; while (fP[(half + nT) * 3 + 1] === fP[half * 3 + 1]) nT++;
      const nS = half / nT;
      const floorAt = (x, z) => { const t = -x - tapeGap; let i = 0, j = 0; while (i < nS - 2 && fP[(half + (i + 1) * nT) * 3 + 1] <= z) i++; while (j < nT - 2 && fP[(half + j + 1) * 3 + 2] <= t) j++;
        const k = half + i * nT + j, a = clamp((z - fP[k * 3 + 1]) / (fP[(k + nT) * 3 + 1] - fP[k * 3 + 1]), 0, 1), b = clamp((t - fP[k * 3 + 2]) / (fP[(k + 1) * 3 + 2] - fP[k * 3 + 2]), 0, 1);
        const mixv = (arr, n, c) => lerp(lerp(arr[k * n + c], arr[(k + 1) * n + c], b), lerp(arr[(k + nT) * n + c], arr[(k + nT + 1) * n + c], b), a);
        return { w: mixv(fW, 1, 0), u: mixv(fU, 2, 0), v: mixv(fU, 2, 1) }; };
      const wsFull = [], wsLite = [];                        // this stage's dashes (the patch's row and the hem's row)
      // (a) ONE PATCH. THE ROOM, verified: the outer west strip, x -150 to -110 (150: the flank's cloth ends at 155; 110: the lead seam's
      // ridge at x -100 reaches -107), z 570 to 815 (570: the carried west yoke's ridge reaches z 564 on the strip; 815: the worn slope
      // begins); the breaker's reach there is x -93 at most (at z 570), so the whole strip is flat for the whole flight. The patch is a
      // rectangle as wide as the strip lets with one seam's width to each side (40 - 2 * 9 = 22 m) and one and a half times as long
      // (33 m), lying along the strip, centred in it across and along (x -130, z 692.5). Its frayed threads (2 to 5 m) lie beyond its
      // edge, inside the strip. NEW, UNWORN DENIM: wear 0.02, the floor of the world's wear law (every baked wear is clamped to it): the
      // cloth's own raw tone, no new hex, the same all over (a new patch has no rubbed edge). Proud of the floor by a cloth's thickness
      // (1 m, stage s1's plain number), its cut edge a short wall leaning 0.4 m out (plain). Its GRAIN IS TURNED A QUARTER against the
      // floor's: its cloth coordinate is the floor's own at that place (read), turned 90 degrees, moved by two draws of this stage's
      // stream. The kit's denim (style.denim, CALLED). No ridge (a patch has no felled seam), NO RIVET and no bar tack (a patch is not
      // riveted, and its sewing has no seam's end).
      const PROOM = { x0: -150, x1: -110, z0: 570, z1: 815 }, PTW = PROOM.x1 - PROOM.x0 - 2 * SEAMW, PTL = 1.5 * PTW, PTH = 1;
      const pxc = (PROOM.x0 + PROOM.x1) / 2, pzc = (PROOM.z0 + PROOM.z1) / 2, RECT = [[pxc - PTW / 2, pzc - PTL / 2], [pxc + PTW / 2, pzc - PTL / 2], [pxc + PTW / 2, pzc + PTL / 2], [pxc - PTW / 2, pzc + PTL / 2]];
      { const pA = pw.range(0, 400), pB = pw.range(0, 400), NXP = 4, NZP = 6, pos = [], uvs = [], wr = [], idx = [];
        for (let j = -1; j <= NZP + 1; j++) for (let i = -1; i <= NXP + 1; i++) {
          const wall = i < 0 || j < 0 || i > NXP || j > NZP, x = RECT[0][0] + PTW * clamp(i, 0, NXP) / NXP + (i < 0 ? -0.4 : i > NXP ? 0.4 : 0), z = RECT[0][1] + PTL * clamp(j, 0, NZP) / NZP + (j < 0 ? -0.4 : j > NZP ? 0.4 : 0), F = floorAt(x, z);
          pos.push(x, land(x, z) + (wall ? 0.05 : PTH), z); uvs.push(F.v + pA, -F.u + pB); wr.push(0.02);
          if (i <= NXP && j <= NZP) { const k = (j + 1) * (NXP + 3) + i + 1, k2 = k + NXP + 3; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setAttribute('aWear', new THREE.Float32BufferAttribute(wr, 1)); g.setIndex(idx);
        const patch = new THREE.Mesh(g, onFlat(style.denim({ twoSided: true }))); patch.name = 'west-patch-cloth'; patch.frustumCulled = false; scene.add(patch); }
      await ctx.yield();
      // ITS FOUR EDGES FRAYED (the brief: 'wherever an edge is frayed ... white weft threads hang'): short white threads all round it BY THE
      // FRINGE'S OWN LAW: the fringe's own ribbon (the base geometry of live's mesh 'fringe', shared, not rebuilt), the fringe's own two
      // shader texts by reference (its kink, its sway on the breeze, its plies and frayed tip) and its own three colours (the same
      // uniform objects), with ONE term exchanged: where a hanging fringe thread takes the hills' billow at its root, fading to its free
      // end, a thread of the patch lies on the cloth all its length and takes the floor's own breath at its root (flankBed, called).
      // Each thread is rooted on the top of the patch's cut edge and lies OUTWARD over the floor, 2 to 5 m long (the order's), level
      // with the patch's top (the fringe's own swing at a tip is 0.91 m at most at the strongest breeze, less than the patch's 1 m, so
      // no thread dips into the floor), up to 0.35 rad askew (plain). HOW MANY: the fringe's own density on the knee's lip, 280 threads on the ordinary lip's
      // 353 m (0.79 a metre of edge), times live's own scale for the fringe (detail, density, 1.35 on the stonewashed wash): 87 on the
      // patch's 110 m at scale 1. Five draws a thread from this stage's stream (place, angle, length, and the fringe's phase and width).
      { const fringeM = scene.getObjectByName('fringe'), per = 2 * (PTW + PTL), K = detail * density * (wash === 'stonewashed' ? 1.35 : 1);
        const n = Math.round(per * (280 / (2 * Math.PI * Math.sqrt((KN.a * KN.a + 60 * 60) / 2))) * K), aA = [], aD = [], aS = [];
        for (let i = 0; i < n; i++) { let d = ((i + pw.range(-0.2, 0.2) + n) % n) / n * per, s = 0; const an = pw.range(-0.35, 0.35), len = pw.range(2, 5);
          for (; s < 3; s++) { const l = s % 2 ? PTL : PTW; if (d < l) break; d -= l; }
          const p = RECT[s], q = RECT[(s + 1) % 4], l = s % 2 ? PTL : PTW, tx = (q[0] - p[0]) / l, tz = (q[1] - p[1]) / l, ox = tz, oz = -tx, ca = Math.cos(an), sa = Math.sin(an);
          const x = p[0] + tx * d, z = p[1] + tz * d, dx = ox * ca - oz * sa, dz = ox * sa + oz * ca;
          aA.push(x, land(x, z) + PTH, z); aD.push(dx * len, 0, dz * len); aS.push(pw.range(0, 6.28), pw.range(0.36, 0.5)); }
        if (fringeM && n) { const g = new THREE.InstancedBufferGeometry(), fm0 = fringeM.material, c = style.glsl.common;
          g.setAttribute('position', fringeM.geometry.attributes.position); g.setIndex(fringeM.geometry.index);
          g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(aA), 3)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(new Float32Array(aD), 3));
          g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 2)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(V3(pxc, 5, pzc), 60);
          const fm = new THREE.ShaderMaterial({ uniforms: { ...style.clothUniforms(), uBillow: flankBillow, cA: fm0.uniforms.cA, cB: fm0.uniforms.cB, cP: fm0.uniforms.cP }, side: THREE.DoubleSide,
            vertexShader: c + GLSL_ROLL + GLSL_BED + fm0.vertexShader.slice(fm0.vertexShader.indexOf(c) + c.length).replace('1.5 * denimBillow(aA.xz, uTime) * (1.0 - t)', 'flankBed(aA.xz)'),
            fragmentShader: fm0.fragmentShader });
          const fray = new THREE.Mesh(g, fm); fray.name = 'west-patch-fray'; fray.frustumCulled = false; scene.add(fray); } }
      await ctx.yield();
      // (b) SEWN DOWN by ONE ROW OF ORANGE DASHES 2.2 m inside its edge all round (live's row offset), live's dash (7 m) and gap (3 m): on
      // each side of the row's rectangle (17.6 by 28.6 m) as many whole dashes as it holds at that pitch (two and three), set about the
      // side's middle; 0.25 m over the patch (live's lift for dashes alone); one skip in forty, one draw a dash. And ONE ROW OF LARGE WHIP
      // STITCHES OVER THE EDGE in the white stitch's thread (live's white cord, cordMat(P.white, white at 0.86), the lining's: CALLED):
      // every 4 m about (a plain number; each side takes a whole number of them), each a ribbon 0.45 m in half-width (live's dash
      // radius) from 1.6 m inside the edge, over it, down to the floor 1.2 m outside, slanting 1 m along the edge (1.6, 1.2, 1: plain).
      { const pos = [], uvs = [], idx = [], IN = insetPoly(RECT, 2.2);
        const rib = (ax, ay, az, bx2, by2, bz2, u0) => { let dx = bx2 - ax, dz = bz2 - az; const l = Math.hypot(dx, dz) || 1, l3 = Math.hypot(l, by2 - ay), k = pos.length / 3; dx /= l; dz /= l;
          pos.push(ax - dz * 0.45, ay, az + dx * 0.45, ax + dz * 0.45, ay, az - dx * 0.45, bx2 - dz * 0.45, by2, bz2 + dx * 0.45, bx2 + dz * 0.45, by2, bz2 - dx * 0.45);
          uvs.push(u0, 0, u0, 1, u0 + l3, 0, u0 + l3, 1); idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); return u0 + l3; };
        for (let s = 0; s < 4; s++) {
          { const p = IN[s], q = IN[(s + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]), tx = (q[0] - p[0]) / l, tz = (q[1] - p[1]) / l, n = Math.floor((l + 3) / 10);
            for (let k = 0; k < n; k++) { if (pw() < 0.025) continue; const d = l / 2 + (k + 0.5 - n / 2) * 10, x = p[0] + tx * d, z = p[1] + tz * d;
              frameAt(x, land(x, z) + PTH + 0.25, z, tx, 0, tz); (path.nearestXZ(x, z).dist < 110 ? wsFull : wsLite).push({ m: m4.clone(), along: 0 }); } }
          const p = RECT[s], q = RECT[(s + 1) % 4], l = Math.hypot(q[0] - p[0], q[1] - p[1]), tx = (q[0] - p[0]) / l, tz = (q[1] - p[1]) / l, ox = tz, oz = -tx, n = Math.round(l / 4);
          for (let k = 0; k < n; k++) { const d = (k + 0.5) * l / n, ex = p[0] + tx * d, ez = p[1] + tz * d, ix = ex - ox * 1.6 - tx * 0.5, iz = ez - oz * 1.6 - tz * 0.5, fx = ex + ox * 1.2 + tx * 0.5, fz = ez + oz * 1.2 + tz * 0.5;
            const u1 = rib(ix, land(ix, iz) + PTH + 0.2, iz, ex, land(ex, ez) + PTH + 0.2, ez, 0); rib(ex, land(ex, ez) + PTH + 0.2, ez, fx, land(fx, fz) + 0.2, fz, u1); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
        const wm = onFlat(cordMat(P.white, P.white.clone().multiplyScalar(0.86))); wm.side = THREE.DoubleSide;
        const whip = new THREE.Mesh(g, wm); whip.name = 'west-patch-whip'; whip.frustumCulled = false; scene.add(whip); }
      await ctx.yield();
      // (c) THE HEM'S PUCKER (the brief's style note: 'puckers along hems'), on the inner west strip. THE ROOM, verified: x -92 to -55 (92:
      // the lead seam's gutter reaches -107 and its tack's tail can lie to about -86; 55: the fly's rows are at -48 and -43 and the
      // fly's tack's tail can lie to -60), z 570 to 815, LESS the breaker's reach: the strip's south is NOT flat for the whole flight
      // (at z 570 the breaker reaches x -93, the whole strip's width). So the line runs down the strip's middle (x -73.5) only from
      // where its whole width (4.5 m either side) keeps one seam's width beyond the breaker's reach (found by trying every half metre
      // northward from z 579; it is z 677.5) to one seam's width short of the strip's north bound (z 806): 128.5 m, not the 245 m asked.
      // WHAT IT IS: one stitched line with the cloth drawn up along it, as a sewn hem draws it. One row of orange dashes at live's pitch
      // (first dash 6 m in, 10 m pitch, none within 8 m of the end; one skip in forty, one draw a dash) on a LOW RIDGE 0.2 m high and
      // 2.4 m wide (0.2: a plain number, a tenth of a seam's height), and in every gap between two dashes ONE SMALL CROSS PUCKER: the
      // cloth lifted 0.5 m (plain) across the line, 3 m long along it (the gap) and 9 m across (one seam's width in all), highest on
      // the line and dying out to the sides; so one pucker a dash's pitch. The whole stands 0.7 m at most at rest, and live's own
      // travelling pucker (seamPucker, the world's W 288, CALLED through the seam material's own vertex text) rides it at a fifth of
      // its size (crown flag 0.2: plain), 0.27 m more at most: never over half a seam's height (1 m). Wear: XS's own tones (0.76 on the
      // stitched ridge, 0.92 on a pucker's crest, 0.74 on its shoulders, the gutter's 0.10 beside the ridge) with live's seam formula
      // for the wash; its outermost vertices take THE FLOOR'S OWN tone and its cloth coordinate is THE FLOOR'S OWN (both read), so it is
      // the floor's cloth drawn up, with no edge of its own. Sections every half metre. Drawn by live's seam material's texts.
      { const SROOM = { x0: -92, x1: -55, z0: 570, z1: 815 }, hx = (SROOM.x0 + SROOM.x1) / 2, HW = SEAMW / 2, zN = SROOM.z1 - SEAMW; let zS = SROOM.z0 + SEAMW;
        while (zS < zN && -(hx + HW) - flatReach(zS) < SEAMW) zS += 0.5;
        const len = zN - zS, nsec = Math.round(len / 0.5), pos = [], uvs = [], wr = [], cr = [], idx = [], COLS = [-1, -0.5, -0.2, 0, 0.2, 0.5, 1];
        const gapK = (a) => { const cg = 11 + 10 * Math.round((a - 11) / 10), da = Math.abs(a - cg); return cg >= 11 && cg + 5 < len - 8 && da < 1.5 ? 0.5 + 0.5 * Math.cos(Math.PI * da / 1.5) : 0; };   // a gap between two dashes: its middle 5 m past a dash's middle
        const tone = (t) => clamp(t + washK * 0.6 + nightK, 0.02, 1);
        for (let i = 0; i <= nsec; i++) { const a = len * i / nsec, z = zS + a, g = gapK(a);
          COLS.forEach((c, k) => { const ac = Math.abs(c), o = c * (ac > 0.7 ? lerp(1.8, HW, g) : ac > 0.3 ? lerp(3, 6, g) : 6), x = hx + o, F = floorAt(x, z);
            const h = 0.2 * (1 - smoothstep(0, 1.3, Math.abs(o))) + 0.5 * g * (1 - (o / HW) * (o / HW));
            pos.push(x, land(x, z) + 0.12 + h, z); uvs.push(F.u, F.v); cr.push(ac < 0.1 ? 0.2 : ac < 0.3 ? 0.1 : 0);
            wr.push(ac > 0.7 ? F.w : ac > 0.3 ? lerp(F.w, tone(XS[2][2]), g) : ac > 0.1 ? tone(lerp(XS[8][2], XS[3][2], g)) : tone(lerp(XS[4][2], XS[3][2], g)));
            if (i < nsec && k < COLS.length - 1) { const q = i * COLS.length + k, q2 = q + COLS.length; idx.push(q, q2, q + 1, q + 1, q2, q2 + 1); } });
          if (i % 60 === 59) await ctx.yield(); }
        for (let d = 6; d < len - 8; d += 10) { if (pw() < 0.025) continue; const z = zS + d;
          frameAt(hx, land(hx, z) + 0.12 + 0.2 + 0.05, z, 0, 0, 1); (path.nearestXZ(hx, z).dist < 110 ? wsFull : wsLite).push({ m: m4.clone(), along: 0 }); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setAttribute('aWear', new THREE.Float32BufferAttribute(wr, 1)); g.setAttribute('aCrown', new THREE.Float32BufferAttribute(cr, 1)); g.setIndex(idx);
        const hm = onFlat(new THREE.ShaderMaterial({ uniforms: {}, side: THREE.DoubleSide, vertexShader: seamMat.vertexShader, fragmentShader: seamMat.fragmentShader }));
        const hemP = new THREE.Mesh(g, hm); hemP.name = 'west-hem-pucker'; hemP.frustumCulled = false; scene.add(hemP); }
      await ctx.yield();
      // this stage's dashes: live's two dash geometries and live's cord material, CALLED, on the floor's own breath (as stage s1's)
      { const wCord = onFlat(cordMat(stitchCol, P.orangeDark));
        for (const [list, geo, name] of [[wsFull, holedStitch(style.stitchGeometry(7)), 'west-stitches-near'], [wsLite, liteGeo.clone(), 'west-stitches-far']]) {
          if (!list.length) { geo.dispose(); continue; }
          const im = new THREE.InstancedMesh(geo, wCord, list.length), al = new Float32Array(list.length);
          list.forEach((o, i) => { im.setMatrixAt(i, o.m); al[i] = o.along; });
          geo.setAttribute('aAlong', new THREE.InstancedBufferAttribute(al, 1));
          im.name = name; im.frustumCulled = false; scene.add(im); } }
      // (the west patch and the hem's pucker end here)
    }
    await ctx.yield();

    // ---- INSIDE THE GAP: what the lining carries. A centre seam sewn in white, pressed open, three woven labels and
    // ---- three spare buttons; all lie on the red (y 0) and are under the closed floor until the zip has passed ----
    { const sg = liteGeo.clone(); sg.deleteAttribute('aAlong');
      const wm = cordMat(P.white, P.white.clone().multiplyScalar(0.86), 0), list = [];
      for (let r = 0; r < 2; r++) for (let z = -330 + r * 5; z < hero.sliderZAt(1e3) + 30; z += 10) {
        const x = (r ? 3.1 : -3.1) + 0.4 * noise.n2(z * 0.03, r * 5.5 + 2.2);
        list.push(m4.makeTranslation(x, 0.3, z).clone()); }
      const im = new THREE.InstancedMesh(sg, wm, list.length); list.forEach((m, i) => im.setMatrixAt(i, m));
      im.name = 'lining-stitches'; im.frustumCulled = false; scene.add(im);
      // the pressed-open allowance (a deeper strip with a pale overlocked line down each edge) and the labels: one material
      const pos = [], uvs = [], kind = [], idx = [];
      const quad = (cx, cz, w, l, yaw, y, k, seed) => { const c = Math.cos(yaw), sn = Math.sin(yaw), b = pos.length / 3;
        for (const [a, d] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = a * w * 0.5, lz = d * l * 0.5;
          pos.push(cx + lx * c + lz * sn, y, cz - lx * sn + lz * c); uvs.push((a * 0.5 + 0.5) * w, (d * 0.5 + 0.5) * l); kind.push(k, seed, w, l); }
        idx.push(b, b + 2, b + 1, b, b + 3, b + 2); };
      quad(0, 220, 13, 1110, 0, 0.12, 0, 0);
      quad(21, 318, 17, 27, 0.16, 0.34, 1, 3.1); quad(-15, 548, 14, 22, -0.22, 0.34, 1, 7.7); quad(17, 668, 12, 12, 0.5, 0.34, 1, 12.9);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 4)); g.setIndex(idx);
      const lm = new THREE.ShaderMaterial({
        uniforms: { cDeep: { value: P.redDeep }, cRed: { value: P.red }, cPale: { value: P.white }, cEcru: { value: P.ecru }, cInk: { value: P.indigo }, cSt: { value: P.orange } },
        vertexShader: /* glsl */`attribute vec4 aKind; varying vec4 vK; varying vec2 vUv;
          void main(){ vK = aKind; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 cDeep, cRed, cPale, cEcru, cInk, cSt; varying vec4 vK; varying vec2 vUv;
          float lh(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
          void main(){ vec2 q = vUv, sz = vK.zw; float aa = fwidth(q.x) + fwidth(q.y) + 1e-4; vec3 col;
            float ex = min(q.x, sz.x - q.x), ey = min(q.y, sz.y - q.y);
            if (vK.x < 0.5) {                                   // the allowance: pressed open, an overlocked line inside each edge
              float line = (1.0 - smoothstep(0.28, 0.28 + aa, abs(ex - 1.0))) * (1.0 - smoothstep(0.5, 1.4, aa));
              col = mix(mix(cDeep, cRed, 0.35), cPale, line);
            } else {                                            // a woven label: ecru, rows of woven words, stitched down at both short ends
              float rows = floor(sz.y / 3.0), ry = (q.y - 3.2) / 2.6, ri = floor(ry);
              float wl = sz.x * (0.45 + 0.4 * lh(vec2(ri, vK.y)));
              float cx = (q.x - 2.4) / 1.5, ci = floor(cx);
              float word = step(0.34, lh(vec2(ci * 1.7 + ri * 5.3, vK.y))) * step(2.4, q.x) * step(q.x, wl) * step(0.0, ry) * step(ri, rows - 3.0);
              float bar = (1.0 - smoothstep(0.30, 0.30 + aa / 2.6, abs(fract(ry) - 0.5))) * word * (1.0 - smoothstep(0.42, 0.42 + aa / 1.5, abs(fract(cx) - 0.5)));
              float st = (1.0 - smoothstep(0.26, 0.26 + aa, abs(ey - 1.1))) * step(0.5, fract(q.x / 1.6)) * step(1.0, ex);
              float mark = (1.0 - smoothstep(1.3, 1.3 + aa, length(q - vec2(sz.x - 3.2, sz.y - 4.6))));
              col = mix(cEcru, cInk, bar * (1.0 - smoothstep(0.5, 1.2, aa)));
              col = mix(col, cRed, mark); col = mix(col, cSt, st * (1.0 - smoothstep(0.4, 1.0, aa)));
              col = mix(col, mix(cEcru, cInk, 0.25), (1.0 - smoothstep(0.0, 0.3 + aa, min(ex, ey))) * 0.8);
            }
            gl_FragColor = vec4(col, 1.0); }`,
      });
      const mesh = new THREE.Mesh(g, lm); mesh.name = 'lining-labels'; mesh.frustumCulled = false; scene.add(mesh);
      const spare = new THREE.InstancedMesh(rivetGeo, rivets.material, 3), sc = new THREE.Vector3(1.7, 1.7, 1.7), q0 = new THREE.Quaternion();
      [[15, 356], [-13, 474], [-17, 612]].forEach(([x, z], i) => { m4.compose(V3(x, 0.1, z), q0, sc); spare.setMatrixAt(i, m4); });
      spare.name = 'spare-buttons'; spare.frustumCulled = false; scene.add(spare); }
    await ctx.yield();

    // ---- POLISH 1p: THE LINING'S PRINT RUNS THE WHOLE ZIP (the brief: 'Under the denim is turkey red with a sparse white dot, flat').
    // ---- The parts file prints the lining's medallions and border only north of z 404 (its factor step(404.0, p.y)); south of that the
    // ---- opened wedge was bare dots. This is the same print on the same cloth, laid south from there to the start of the pressed seam.
    // A THING OF THE CLOTH: every place and size below is in the cloth's own metres on the cloth's own repeat, and no random draw is made (so
    // no stream). WHAT THE BLOCK DOES READ, said as it is: the pixel's footprint (aa and thinK from fwidth, so that a line or dot under a
    // pixel melts as the part's do); the shared clock, once (uTime in the travelling crease of the ground it repaints, the plain's own); the
    // colourway the seed deals (the block is not built on the ticking colourway, and its three colours are the colourway's); and the slider's
    // place, through zipOpen called on the shared uSliderZ (the same crease). It prints only where the lining is dotted. It lies under the
    // closed floor (y 4) and the closed tape and is unveiled by the zip's own opening passing over it, nothing else.
    //   ONE QUAD (2 triangles, one draw call, no texture): THE LINING'S OWN SHEET drawn a second time, vertex for vertex (the plain's own
    //   geometry, place and vertex shader), after the plain. A quad of its own 3 cm over the plain was tried first and lost the depth test
    //   to the plain in low views (two large sheets cut into different triangles are not interpolated alike: the print came and went
    //   with the eye's height, and a lift large enough to be safe would lie over the pressed allowance at y 0.12 and the parted tape, whose
    //   outer edge dips to y 0.06). Drawn on the plain's own vertices its depth is the plain's own at every pixel, so the print shows
    //   exactly where the plain shows and nowhere else: under the allowance, the labels, the tapes and teeth, and under the closed floor.
    //   So the REACH of the print is kept in the shader, in the cloth's metres: x within 72 m of the zip line (the outer edge of the
    //   border's cleared band in the parts file, 54 to 72 m), z -335 to 652: from the start of the pressed seam (the allowance quad above,
    //   220 - 555) to the reach of the last rosette that is not under the stopped casting (628 + 24).
    //   THE MEDALLION is the parts file's own, number for number: centres every 124 m at z 442 - 124 k (the same mod), a ring at r 27, a
    //   thin ring at r 10, fourteen drops of r 1.9 at r 18.5, thirty dots of r 1.1 at r 32.5, the small dots cleared inside r 36.
    //   THE BORDER is the parts file's own: lines 58 and 62 m from the zip line, a row of dots of r 1.6 every 12 m at 67.5 m.
    //   Both are kept only SOUTH of z 404, where the parts file's own print begins, so nothing is printed twice.
    //   A SMALL ROSETTE IN EVERY GAP OF THE PRINT, on the zip line at the midpoints of the same repeat (z 380 + 124 k), as far north as 628
    //   (the next, 752, lies under the stopped casting). Its reach is 24 m: the medallions clear their dots to 36 m, which leaves 26 m of
    //   each 62 m half repeat, and 24 keeps 2 m of plain red either side. In the lining's dot white: ONE BOLD RING 2 m thick (r 9.25 to
    //   11.25: with the wheel and the rim it brings the white inside the rosette's reach to a fifth, 356 of 1,810 m2; bold because the pressed allowance, 13 m wide, lies over the middle, so the ring shows as two arcs either side of the seam
    //   and a solid heart would be hidden, and to set it apart from the medallion's thin inner ring), a wheel of TEN solid drops of r 2.3
    //   at r 15.5 (the medallion's idiom: the angle folded by the count, a disc at a radius) and a rim of 24 small dots of r 0.9 at r 20.5
    //   that melt where they are under a pixel (the parts file's thinK). The ring's middle radius, the counts and the dot sizes are plain numbers.
    //   North of z 404 ONLY the rosettes' discs (504 and 628) are kept, so the parts file's medallions and border there are untouched.
    //   THE GROUND inside a cleared place is the plain's own red with the plain's own lines (crease, warp, fold, wrinkle: the parts file's
    //   formulas, the opening read by CALLING zipOpen on the shared uSliderZ), so the edge of a cleared place cannot be told from the plain.
    //   These drawing formulas are COPIES of the text of cotton() in the parts file: a later change there would leave them behind.
    //   Not on the ticking colourway (the parts file prints nothing on the ticking either).
    if (!way.tick) {
      const pm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cRed: { value: P.red }, cDeep: { value: P.redDeep }, cDot: { value: new THREE.Color(way.dot) } },
        vertexShader: hero.parts.plain.material.vertexShader,
        fragmentShader: style.glsl.common + /* glsl */`
          uniform vec3 cRed, cDeep, cDot; varying vec3 vW;
          void main(){ vec2 p = vW.xz;
            // (a) the reach of each motif first: a fragment outside every cleared place is dropped before any noise or angle is worked out
            vec2 mq = vec2(p.x, mod(p.y - 380.0, 124.0) - 62.0); float r = length(mq);
            float bx = abs(p.x); float reach = step(-335.0, p.y) * step(p.y, 652.0); float south = reach * (1.0 - step(404.0, p.y));
            float inMed = south * step(r, 36.0), inBrd = south * step(54.0, bx) * step(bx, 72.0);
            vec2 sq = vec2(p.x, mod(p.y - 318.0, 124.0) - 62.0); float rs = length(sq); float inRos = reach * step(rs, 24.0);
            float aa = 0.7 * (fwidth(p.x) + fwidth(p.y)) + 1e-4; float thinK = 1.0 - smoothstep(0.6, 1.6, aa);
            if (inMed + inBrd + inRos < 0.5) discard;
            // (b) the ink: the medallion and the border, the parts file's formulas
            float an = atan(mq.y, mq.x + 1e-3 * step(abs(mq.x) + abs(mq.y), 1e-3));
            float sp = abs(fract(an * 14.0 / 6.2832) - 0.5) * 6.2832 / 14.0 * max(r, 1.0);
            float sp2 = abs(fract(an * 30.0 / 6.2832) - 0.5) * 6.2832 / 30.0 * max(r, 1.0);
            float med = max(1.0 - smoothstep(0.8, 0.8 + aa, abs(r - 27.0)), (1.0 - smoothstep(0.5, 0.5 + aa, abs(r - 10.0))) * thinK);
            med = max(med, 1.0 - smoothstep(1.9, 1.9 + aa, length(vec2(sp, r - 18.5))));
            med = max(med, 1.0 - smoothstep(1.1, 1.1 + aa, length(vec2(sp2, r - 32.5))));
            float brd = max(1.0 - smoothstep(0.7, 0.7 + aa, abs(bx - 58.0)), (1.0 - smoothstep(0.35, 0.35 + aa, abs(bx - 62.0))) * thinK);
            brd = max(brd, 1.0 - smoothstep(1.6, 1.6 + aa, length(vec2(bx - 67.5, mod(p.y, 12.0) - 6.0))));
            // the rosette: a bold ring, a wheel of ten drops, a rim of 24 small dots
            float sa = atan(sq.y, sq.x + 1e-3 * step(abs(sq.x) + abs(sq.y), 1e-3));
            float rp = abs(fract(sa * 10.0 / 6.2832) - 0.5) * 6.2832 / 10.0 * max(rs, 1.0);
            float rp2 = abs(fract(sa * 24.0 / 6.2832) - 0.5) * 6.2832 / 24.0 * max(rs, 1.0);
            float ros = 1.0 - smoothstep(1.0, 1.0 + aa, abs(rs - 10.25));
            ros = max(ros, 1.0 - smoothstep(2.3, 2.3 + aa, length(vec2(rp, rs - 15.5))));
            ros = max(ros, (1.0 - smoothstep(0.9, 0.9 + aa, length(vec2(rp2, rs - 20.5)))) * thinK);
            float ink = max(max(med * inMed, brd * inBrd), ros * inRos);
            // (c) the ground: the plain's own red and lines
            float w = zipOpen(p.y); float inside = w - abs(p.x);
            float band = smoothstep(-2.0, 6.0, inside) * (1.0 - smoothstep(16.0, 34.0, inside)) * step(1.0, w);
            float ph = inside * 0.26 + uTime * 1.2 + 2.5 * dnNoise(p * 0.035); float fp = fwidth(ph);
            float crease = (1.0 - smoothstep(0.16, 0.16 + 2.0 * fp + 0.02, abs(fract(ph) - 0.5) * 2.4)) * band * (1.0 - smoothstep(0.25, 0.6, fp));
            float wq = p.x / 1.15 + 0.35 * dnNoise(vec2(p.x * 0.9, p.y * 0.03)); float wf = fwidth(wq) + 1e-4;
            float warp = (1.0 - smoothstep(0.10, 0.10 + wf, abs(fract(wq) - 0.5))) * (1.0 - smoothstep(0.12, 0.3, wf));
            float fq = (p.x * 0.94 + p.y * 0.21) / 37.0 + 0.5 * dnNoise(p * 0.013); float ff = fwidth(fq) + 1e-5;
            float fid = floor(fq); float foldL = (1.0 - smoothstep(0.011, 0.011 + ff, abs(fract(fq) - 0.5))) * step(0.3, dnHash(vec2(fid, 3.0))) * (1.0 - smoothstep(0.02, 0.06, ff));
            float gq = (p.x * 0.5 - p.y * 0.86) / 19.0 + 0.9 * dnNoise(p * 0.021 + 7.0); float gf = fwidth(gq) + 1e-5;
            float wr = (1.0 - smoothstep(0.014, 0.014 + gf, abs(fract(gq) - 0.5))) * step(0.62, dnNoise(p * 0.045 + 3.0)) * (1.0 - smoothstep(0.03, 0.08, gf));
            vec3 col = mix(cRed, cDeep, max(max(crease, 0.45 * warp), max(foldL, wr)));
            // (d)
            gl_FragColor = vec4(mix(col, cDot, ink), 1.0); }`,
      });
      const print = new THREE.Mesh(hero.parts.plain.geometry, pm); print.position.copy(hero.parts.plain.position);
      print.renderOrder = 1; print.name = 'lining-print'; print.frustumCulled = false; hero.parts.plain.parent.add(print);
    }
    await ctx.yield();

    // ---- POLISH 2: RED AT THE VALLEY HEAD. The two front pockets gape, showing their bags of the same turkey-red cotton, and a
    // ---- pocket square of it (a printed border, a medallion) lies dropped on the slope beside the stopped slider, one corner lifting
    { const cm = style.cotton(); cm.uniforms.cDot.value = new THREE.Color(way.dot); cm.uniforms.uTick.value = way.tick;
      const pos = [], idx = [];
      for (const id of ['pocket-mouth-w', 'pocket-mouth-e']) { const sm = seamInfo[id], n = sm.length - 1, base = pos.length / 3, NC = 5;
        for (let i = 0; i <= n; i++) { const a0 = sm[i], t = i / n, wdt = 30 * Math.pow(Math.sin(Math.PI * clamp(t * 1.04 - 0.02, 0, 1)), 0.7);
          for (let c2 = 0; c2 < NC; c2++) { const o = 4.4 + wdt * (c2 / (NC - 1)), x = a0.x + a0.nx * o, z = a0.z + a0.nz * o;
            pos.push(x, land(x, z) + 0.7 - 1.2 * Math.sin(Math.PI * c2 / (NC - 1)), z);
            if (i < n && c2 < NC - 1) { const k = base + i * NC + c2, k2 = k + NC; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }
          if (i % 12 === 11) await ctx.yield(); }
        await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      cm.side = THREE.DoubleSide; cm.polygonOffset = true; cm.polygonOffsetFactor = -2; cm.polygonOffsetUnits = -2;
      const bags = new THREE.Mesh(g, cm); bags.name = 'pocket-bags'; bags.frustumCulled = false; scene.add(bags); }
    { const S = 74, NG = 40, cx = -50, cz = 862, yaw = 0.36, cy = Math.cos(yaw), sy = Math.sin(yaw), pos = [], ab = [], idx = [];
      for (let j = 0; j <= NG; j++) { for (let i = 0; i <= NG; i++) { const a0 = (i / NG) * 2 - 1, b0 = (j / NG) * 2 - 1;
          // dropped, not laid: the square is gathered a little toward its middle and thrown into soft folds
          const gth = 1 - 0.07 * (1 - a0 * a0) * (1 - b0 * b0), lx = a0 * S * 0.5 * gth, lz = b0 * S * 0.5 * gth;
          const x = cx + lx * cy + lz * sy, z = cz - lx * sy + lz * cy;
          const f1 = 0.5 + 0.5 * Math.sin(a0 * 6.1 + 1.6 * Math.sin(b0 * 2.3) + 0.7), f2 = 0.5 + 0.5 * Math.sin(b0 * 5.2 + 1.3 * a0 + 2.1);
          const edge = Math.min(1 - Math.abs(a0), 1 - Math.abs(b0));
          let dS = 1e9, dR = 1e9;                              // it lies OVER the hem seam, the slope seam and their rivets
          for (const id of ['hem', 'slope']) for (const q of seamInfo[id]) { const dd = Math.hypot(q.x - x, q.z - z); if (dd < dS) dS = dd; }
          for (const [rx, rz] of rivetAt) { const dd = Math.hypot(rx - x, rz - z); if (dd < dR) dR = dd; }
          const over = Math.max(2.5 * (1 - smoothstep(4.5, 11, dS)), 4.2 * (1 - smoothstep(2.5, 8, dR)));
          pos.push(x, land(x, z) + 0.9 + over + (2.6 * f1 * f1 + 1.8 * f2 * f2) * smoothstep(0, 0.25, edge) + 0.6 * Math.sin(a0 * 19 + b0 * 3) * (1 - smoothstep(0, 0.12, edge)), z);
          ab.push(a0, b0);
          if (i < NG && j < NG) { const k = j * (NG + 1) + i, k2 = k + NG + 1; idx.push(k, k2, k + 1, k + 1, k2, k2 + 1); } }
        await ctx.yield(); }   // every row of the bandana: five rows ran to 57 ms in one stretch on a busy machine
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAB', new THREE.Float32BufferAttribute(ab, 2)); g.setIndex(idx);
      const bm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cRed: { value: P.red }, cDeep: { value: P.redDeep }, cDot: { value: new THREE.Color(way.dot) }, uS: { value: S * 0.5 } }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + /* glsl */`
          attribute vec2 aAB; varying vec2 vAB;
          void main(){ vAB = aAB; vec4 wp = modelMatrix * vec4(position, 1.0);
            float lift = smoothstep(0.45, 1.0, aAB.x) * smoothstep(0.45, 1.0, aAB.y);          // one corner lifts and falls on the breeze
            wp.y += 1.5 * denimBillow(wp.xz, uTime) + lift * lift * uBreeze * (7.0 + 5.0 * sin(uTime * 0.8) + 1.5 * sin(uTime * 2.1 + aAB.x * 9.0))
              + 0.35 * uBreeze * sin(uTime * 1.4 + aAB.x * 7.0 + aAB.y * 5.0);
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`
          uniform vec3 cRed, cDeep, cDot; uniform float uS; varying vec2 vAB;
          void main(){ vec2 q = vAB * uS; float aa = 0.7 * (fwidth(q.x) + fwidth(q.y)) + 1e-4; float thin = 1.0 - smoothstep(0.5, 1.5, aa);
            float e = uS - max(abs(q.x), abs(q.y));                                           // metres in from the hem
            float ln = max(1.0 - smoothstep(0.45, 0.45 + aa, abs(e - 3.2)), (1.0 - smoothstep(0.22, 0.22 + aa, abs(e - 9.6))) * thin);
            vec2 bq = vec2(abs(q.x) > abs(q.y) ? q.y : q.x, e);                                // a row of dots inside the border line
            float bd = (1.0 - smoothstep(1.15, 1.15 + aa, length(vec2(mod(bq.x + 2.4, 4.8) - 2.4, bq.y - 6.4)))) * step(4.5, e);
            float r = length(q);                                                              // the medallion: two rings and a wheel of drops
            float an = atan(q.y, q.x + 1e-4 * step(abs(q.x) + abs(q.y), 1e-4)); float sp = abs(fract(an * 12.0 / 6.2832) - 0.5) * 6.2832 / 12.0 * max(r, 1.0);
            float med = max(1.0 - smoothstep(0.4, 0.4 + aa, abs(r - 17.0)), (1.0 - smoothstep(0.3, 0.3 + aa, abs(r - 6.0))) * thin);
            med = max(med, (1.0 - smoothstep(1.2, 1.2 + aa, length(vec2(sp, r - 11.5)))));
            vec2 cq = q - (floor(q / 9.0) + 0.5) * 9.0;                                        // sprigs between medallion and border
            float sprig = (1.0 - smoothstep(0.8, 0.8 + aa, length(cq))) * step(20.0, r) * step(12.5, e);
            float f1 = vAB.x * 6.1 + 1.6 * sin(vAB.y * 2.3) + 0.7, f2 = vAB.y * 5.2 + 1.3 * vAB.x + 2.1;      // a crease line in each fold's valley
            float w1 = fwidth(f1) + 1e-4, w2 = fwidth(f2) + 1e-4;
            float cr = max((1.0 - smoothstep(0.05, 0.05 + w1, abs(sin(f1 * 0.5 + 0.7854)) )) , (1.0 - smoothstep(0.05, 0.05 + w2, abs(sin(f2 * 0.5 + 0.7854))))) * thin;
            vec3 col = mix(cRed, cDeep, max(cr, 1.0 - smoothstep(0.0, 0.5 + aa, e)));
            col = mix(col, cDot, max(max(ln, bd), max(med, sprig)));
            gl_FragColor = vec4(col, 1.0); }`,
      });
      const sq = new THREE.Mesh(g, bm); sq.name = 'pocket-square'; sq.frustumCulled = false; scene.add(sq); }
    await ctx.yield();

    // ---- LINT: tufts of pale cotton fluff on the breeze, a few always near the lens, thickest where the teeth part -
    { const lr = rng.fork ? rng.fork('lint') : rng, n = Math.round(500 * detail * density), pos = [], sd = [], kd2 = [], idx = [];
      for (let i = 0; i < n; i++) { const a0 = lr(), a1 = lr(), a2 = lr(), a3 = lr(), kind = i < n * 0.24 ? 1 : 0, k = i * 4;
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(cx, cy, 0); sd.push(a0, a1, a2, a3); kd2.push(kind); }
        idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(sd, 4));
      g.setAttribute('aKind', new THREE.Float32BufferAttribute(kd2, 1)); g.setIndex(idx);
      const lm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cA: { value: P.white }, cB: { value: P.wrong.clone().lerp(P.white, 0.4) } },
        vertexShader: style.glsl.common + /* glsl */`
          attribute vec4 aSeed; attribute float aKind; varying vec2 vC; varying float vS;
          void main(){ vec3 box = mix(vec3(170.0, 70.0, 170.0), vec3(110.0, 44.0, 150.0), aKind);
            vec3 ctr = mix(cameraPosition, vec3(0.0, 20.0, uSliderZ - 85.0), aKind);
            vec3 p = aSeed.xyz * box + vec3(-2.3, 0.0, 1.2) * uTime * (0.6 + 0.9 * aSeed.w) * uBreeze;
            p = mod(p - ctr + box * 0.5, box) - box * 0.5 + ctr;
            p += vec3(sin(uTime * 0.7 + aSeed.x * 30.0), cos(uTime * 0.9 + aSeed.y * 17.0), sin(uTime * 0.6 + aSeed.z * 11.0)) * 1.3;
            float dc = distance(p, cameraPosition), dk = distance(p, ctr);
            float s = mix(0.3, 1.1, aSeed.w * aSeed.w) * smoothstep(3.0, 7.0, dc) * (1.0 - smoothstep(0.38, 0.5, dk / box.x));
            float an = uTime * (0.3 + aSeed.x) + aSeed.y * 6.28; vec2 c = position.xy; c = vec2(c.x * cos(an) - c.y * sin(an), c.x * sin(an) + c.y * cos(an));
            vC = position.xy; vS = aSeed.w * 50.0 + aSeed.x * 7.0;
            vec4 mv = viewMatrix * vec4(p, 1.0); mv.xy += c * s;
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: style.glsl.common + /* glsl */`
          uniform vec3 cA, cB; varying vec2 vC; varying float vS;
          void main(){ float d = length(vC); float n = dnNoise(vC * 2.6 + vS);
            if (d + 0.55 * (n - 0.5) > 0.74) discard;
            gl_FragColor = vec4(mix(cA, cB, step(0.5, dnNoise(vC * 4.5 + vS * 1.7))), 1.0); }`,
      });
      const lint = new THREE.Mesh(g, lm); lint.name = 'lint'; lint.frustumCulled = false; scene.add(lint); }
    // ---- FUZZ: short loose fibres on the cloth within 30 m of the path, leaning with the breeze ---------------------
    { const fz = rng.fork ? rng.fork('fuzz') : rng, n = Math.round(4200 * detail * density), pos = [], tip = [], idx = [], q = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const u = fz(), off = (fz() < 0.5 ? -1 : 1) * fz.range(2, 30), an = fz.range(0, 6.28), hh = fz.range(0.5, 1.3), ph = fz.range(0, 6.28);
        path.pointAt(u, q); path.tangentAt(u, tg);
        const x = q.x + tg.z * off, z = q.z - tg.x * off; if (inZone(x, z) && landRaw(x, z) <= 4.05) continue;
        const y = land(x, z); if (q.y - y > 45 || kneeD(x, z) < 1.0) continue;
        const k = pos.length / 3, c = Math.cos(an) * 0.09, sn = Math.sin(an) * 0.09;
        pos.push(x - c, y, z - sn, x + c, y, z + sn, x, y + hh, z); tip.push(0, ph, 0, ph, 1, ph); idx.push(k, k + 1, k + 2);
        if (i % 150 === 149) await ctx.yield();   // 600 fibres ran to 130 ms in one stretch on a busy machine
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTip', new THREE.Float32BufferAttribute(tip, 2)); g.setIndex(idx);
      const fm = new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms(), cA: { value: P.fade.clone().lerp(P.ecru, 0.35) } }, side: THREE.DoubleSide,
        vertexShader: style.glsl.common + /* glsl */`
          attribute vec2 aTip;
          void main(){ vec3 p = position; p.y += 1.5 * denimBillow(p.xz, uTime);
            p += vec3(-1.0, -0.25, 0.5) * aTip.x * (0.3 + 0.32 * sin(uTime * 1.6 + aTip.y + p.x * 0.15)) * uBreeze;
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
        fragmentShader: /* glsl */`uniform vec3 cA; void main(){ gl_FragColor = vec4(cA, 1.0); }`,
      });
      const fuzz = new THREE.Mesh(g, fm); fuzz.name = 'fuzz'; fuzz.frustumCulled = false; scene.add(fuzz); }
    await ctx.yield();

    // ---- the gaze and the frame ---------------------------------------------------------------------------------
    // REPAIR 3: THE GAZE. Three entries, no two on one target, none over 1: the knee, the slider, the ring. Every window opens and closes at
    // a PLACE of the course (uOf: the path's own u nearest a point of the world), never at a typed share of the journey. The slider's
    // entry works out where the casting stands from u by the law INSIDE its own function (sliderAtU), never from what update() left, and
    // its mark moves along the slider's line by rules of the thing itself:
    //   seen from below its hoop the mark is the middle of the casting and its pull (33 m up, 34 m behind its centre); from above the hoop
    //   the mark sinks to its foot (12 m up, 12 m behind);
    //   from far off (over 195 m), and while it runs with the lens well behind it, the mark trails up to 54 m behind it, on the red it has
    //   just opened, so the wedge is in the picture with the slider at its point; within 62 m of the stop the mark comes back onto it;
    //   once it has struck and the lens has come over to the west of the line, the mark stands at the waist of the casting, 20 m behind
    //   its centre (its pull lies 57 to 106 m behind), so the stopped slider stands whole, the ring over it, until the lens turns to the ring.
    const uOf = (x, z) => path.nearestXZ(x, z).u;
    const poiS = V3(0, 30, 240), eyeS = V3(0, 0, 0), poiE = path.end.clone();
    const sliderAim = (t, u) => {
      const sec = secAt(u || 0), zs = zipZ(sec), v = (zipZ(sec + 0.1) - zipZ(sec - 0.1)) / 0.2; path.pointAt(u || 0, eyeS);
      const behind = zs - eyeS.z, up = smoothstep(26, 80, eyeS.y), far = smoothstep(195, 250, Math.hypot(eyeS.x, behind));
      const run = smoothstep(12, 34, v) * (1 - smoothstep(ZIP.stop - 62, ZIP.stop, zs)) * smoothstep(105, 150, behind);
      const over = smoothstep(ZIP.stop - 22, ZIP.stop, zs) * smoothstep(-16, 55, -eyeS.x);
      return poiS.set(-8 * far - 3 * over, lerp(lerp(33, 12, up), 6, far) + 12 * over, zs - lerp(34, 12, up) - 54 * Math.max(far, run) - 8 * over);
    };
    const pois = [
      // the knee: the gaze dips into the tear, seen whole from above; from the end of the pocket seam's first reach to the westmost point round the hole
      { at: [KN.x + 8, 10, KN.z + 6], from: uOf(-185.3, 33.7), to: uOf(-182, 152), weight: 0.55, fade: 0.3 },
      // the slider: from where the tear has passed its widest (west of the hole) to the foot of the dive onto the lead seam
      { at: sliderAim, from: uOf(-177, 127), to: uOf(-100.5, 726), weight: 0.85, fade: 0.06 },
      // the ring, dead ahead up the lead seam: from the head of the dive over the casting's right shoulder
      { at: poiE, from: uOf(-77, 677), to: uOf(-100.4, 868), weight: 0.8, fade: 0.2 },
    ];
    const camP = new THREE.Vector3(), HOP_Z = 432;
    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 62, near: 0.5, far: 5600, lookAhead: 26, bank: 0.2 },
      pois,
      portal: { shape: 'circle', radius: 9.5, tilt: true, color: '#FFF1D2', glow: 0.8, revealDistance: 300 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        camP.setFromMatrixPosition(camera.matrixWorld);
        style.update(dt, time, camera);
        U.uCurl.value = smoothstep(0.05, 0.22, u);
        U.uHop.value.set(HOP_Z, 0.62);                        // the west roll sits low where we hop it beside the stopped slider            // the breakers near the slider rise while we cross the knee
        hero.setProgress(secAt(u) / DURATION);
        hero.update(dt, time, camera);
        for (const f of updaters) f(dt, time, camera, u, camP);
      },
      dispose() { for (const d of disposables) d.dispose(); },
    };
  },
};
