// THE SAIGA RIVER, 20,000 years ago. Kolyma lowland, western Beringia, late June, local midnight at 69 degrees north.
// Flown as a raven: a river of saiga pours across a flowering loess terrace, parts round a file of woolly mammoths,
// threads the gaps between them and spills down a slumped bluff into a braided river, under a sun that does not set.
// World space = the hero's local space (src/parts/mammoth-midnight-sun.js): the file walks an arc of radius 280 about
// (0, 0, 280) toward +X; arc coordinates a (along the walk) and q (outward = downstream = toward the river).
// North (the midnight sun) is about -Z, west -X. Three looks by seed / ctx.vary.hour: midnight rose, a clear blue evening with
// cumulus and their shadows (sun 11 degrees up in the west-north-west), autumn ochre under a low western sun (first snow
// on the humps). The flight: in from the east against the light, across a thaw pond to the lone bull, north beside the stream,
// round the matriarch, up the file into the sun, through the gap, one wheel over the slump and the river with the stream, back
// up the slump and along the terrace to the tail bull, into the thaw gully. Cast by seed: Lena horses or two woolly rhinos. Rare: two cave lions watch.
// Polish m4 (see shots/mammoth-midnight-sun/polish-m4-1/notes.md): the gully floor's dark sparkling stream and the gaze along the
// file and over the wheel from round m3; the ice wedges as bodies standing proud of the wall; the column on the bars further out,
// soft-edged, beside the sun; bowed polygon troughs, threads that swell and pinch, shallow pond rims; a churned, terraced slump.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import { makeHorizonRidges } from '../kit/terrain.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, SAIGA_FLOW_GLSL, CLOUD_GLSL, RIVER_GLSL } from '../parts/mammoth-midnight-sun.js';

const C = (h) => new THREE.Color(h);
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const R = 280, DUR = 40;
const SWELL = [4, 30], BLUFF = [20, 44, 15];           // the swell the file walks; the slump ramp [q0, run, drop]
const RIVER_Y = -SWELL[0] - BLUFF[2];                  // the braided river's bars

// ---- the three looks. palette order (the hero's): rose, sun, lilac, grass, sage, coat, poppy
const MOODS = {
  rose: {
    palette: ['#F2A28A', '#F6C877', '#7F86B5', '#A8A46A', '#B9C2B0', '#3B2620', '#F4D03A'],
    sunEl: 3, sunAz: -12, sunCol: '#F6C877', sunI: 2.2, skyCol: '#7F86B5', skyI: 3.2, groundCol: '#C9B48A', groundI: 2.2,
    zenith: '#6f78b4', mid: '#c9a0a8', horizon: '#F2A28A', scatter: '#ffc27a', fog: '#D9A898', fogAway: '#8C8AB0', fogD: 0.00125,
    loess: '#C9B48A', grassRoot: '#6f6a3c', grassTip: '#d8c886', dust: '#F6C877', water: '#f3b99a', hills: '#8C86B4', snow: '#e8b0a8',
    cirrus: { lit: '#ffc9a0', shade: '#a98aa6', coverage: 0.42 }, cloud: 0, sunDisc: 9, sunSize: 1.5, glow: 1.0,
    exposure: 1.0, bloom: 0.35, shadowTint: '#10132c', tint: '#fff3ea', snowCoat: 0, shadowLen: 19, shadowOp: 0.5, hemi: 1.25, key: 2.2,
  },
  noon: {   // the blue look: a clear evening, the sun 11 degrees up in the west-north-west (ahead as we come in and along the file), cumulus and their racing shadows
    palette: ['#d9d2cf', '#ffe0b0', '#6f9bd6', '#96a25c', '#b0beae', '#3B2620', '#F4D03A'],
    sunEl: 11, sunAz: -70, sunCol: '#ffd08a', sunI: 3.2, skyCol: '#7fa6da', skyI: 1.9, groundCol: '#C9B48A', groundI: 1.6,
    zenith: '#1f4f9e', mid: '#5e8fd0', horizon: '#f0d8ac', scatter: '#ffd9a0', fog: '#d6cfb8', fogAway: '#a9bcd6', fogD: 0.0007,
    loess: '#bfa066', grassRoot: '#56622e', grassTip: '#d4c96a', dust: '#f6dfb0', water: '#9fbde0', hills: '#7890ba', snow: '#f3efe8',
    cirrus: { lit: '#fff0d8', shade: '#9fb0cc', coverage: 0.2 }, cloud: 1, sunDisc: 12, sunSize: 1.3, glow: 0.6,
    exposure: 0.96, bloom: 0.3, shadowTint: '#0a1026', tint: '#fff8ee', snowCoat: 0, shadowLen: 5.1, shadowOp: 0.92, shadowCol: [0.32, 0.36, 0.58], saigaFill: 0.8, saigaExpo: 0.32, hemi: 1.0, key: 3.1,
    gain: 1.3, troughC: '#4f5c2c', troughK: 0.62, contrast: 1.1, sat: 1.12, coatExpo: 0.68, coatFill: 1.5,
  },
  ochre: {   // autumn evening: the sun 8 degrees up, just south of west (ahead-left as we come in, ahead along the file and over the ring), long blue shadows
    palette: ['#f0c690', '#ffd596', '#8fa3c6', '#a88c4a', '#a3aa9c', '#3B2620', '#d8b23a'],
    sunEl: 8, sunAz: -96, sunCol: '#ffc88e', sunI: 3.2, skyCol: '#8298c6', skyI: 2.1, groundCol: '#c9a86a', groundI: 2.0,
    zenith: '#24509e', mid: '#7896c8', horizon: '#f6c684', scatter: '#ffb25c', fog: '#e2bf8e', fogAway: '#9aa8c4', fogD: 0.0009,
    loess: '#b3a482', grassRoot: '#5c5a30', grassTip: '#dcc072', dust: '#f8cf86', water: '#a9bcd8', hills: '#8088ae', snow: '#f4e6d4',
    cirrus: { lit: '#ffd9a4', shade: '#8088ae', coverage: 0.4 }, cloud: 0, sunDisc: 12, sunSize: 1.4, glow: 0.85,
    exposure: 0.96, bloom: 0.36, shadowTint: '#141c3c', tint: '#fff2de', snowCoat: 1, shadowLen: 7, shadowOp: 0.92, shadowCol: [0.3, 0.33, 0.58], saigaFill: 0.8, saigaExpo: 0.34, hemi: 1.1, key: 3.1,
    gain: 1.2, troughC: '#465c2a', troughK: 0.78, contrast: 1.1, sat: 1.1, coatExpo: 0.72, coatFill: 1.7,
  },
};

export default {
  id: 'mammoth-midnight-sun',
  name: 'The Saiga River',
  category: 'prehistoric',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const pause = () => ctx.yield();
    // ---- seeded choices first, in one fixed order
    const roll = rng(), hour = vary.hour || 'any';
    const moodName = hour === 'day' ? 'noon' : hour === 'golden' || hour === 'dawn' ? (roll < 0.5 ? 'ochre' : 'rose') : hour === 'night' ? 'rose'
      : roll >= 0.5 ? 'rose' : roll >= 0.25 ? 'noon' : 'ochre';
    const mood = MOODS[moodName];
    const rhinos = rng.chance(0.33), horseN = rng.int(20, 60), rare = !!vary.rare;
    const sunDir = skyDirection(mood.sunEl, mood.sunAz).normalize();
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(mood.fog), mood.fogD);

    // ---- the hero: both herds on the swell; it lays no ground of its own here
    const hero = await buildHero(ctx, {
      palette: mood.palette, detail, ground: false, saiga: 360, swell: SWELL, bluff: BLUFF, duration: DUR, bullDistance: 76, wakes: true,
      sunDir: sunDir.toArray(), sunIntensity: mood.sunI, skyIntensity: mood.skyI, groundIntensity: mood.groundI,
      shadowOpacity: mood.shadowOp, dust: moodName === 'noon' ? 0.2 : 0.34, coatExposure: mood.coatExpo ?? 0.62, coatFill: mood.coatFill ?? 1.15,
    });
    hero.setLight({ sunDir, sunColor: C(mood.sunCol), sunIntensity: mood.sunI, sky: C(mood.skyCol), skyIntensity: mood.skyI, ground: C(mood.groundCol), groundIntensity: mood.groundI });
    hero.uniforms.uShadow.value.x = Math.min(mood.shadowLen, hero.uniforms.uShadow.value.x);
    hero.uniforms.uDustCol.value.copy(C(mood.dust)); hero.uniforms.uDustLit.value = moodName === 'rose' ? 0 : 0.06;
    if (mood.shadowCol) hero.uniforms.uShadowCol.value.set(...mood.shadowCol);   // under a higher sun every animal stands on a dark blue-lilac shadow
    hero.uniforms.uSaigaFill.value = mood.saigaFill ?? 1; hero.uniforms.uSaigaExpo.value = mood.saigaExpo ?? 0.27;
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    const aOf = (p) => Math.atan2(p.x, R - p.z) * R, WALKD = 1.3 * DUR;   // arc coordinate of a point; metres the file walks during the flight
    // the slump ramp lies where the 30 m gap in the file will be when we pass it (u 0.6), so the gap opens straight onto the fall
    // (a first guess here; the flight below moves it to sit ahead and to the right of the raven at u 0.6)
    let aRamp = aOf(A.gap) + WALKD * 0.6 - 2;
    HU.uLane.value.z = aRamp;
    HU.uCloud.value = mood.cloud;
    HU.uWidth.value.set(13, 78, 13.5);   // half-widths: a narrow river coming in, the fan along the file, the ribbon down the ramp
    await pause();

    // ---- THE LAND. One height function shared by mesh, path and everything that stands on it.
    // terrace + swell (exactly the hero's, so every animal stands on it), the bluff with its slump ramp, the braided
    // river plain below, and the thaw gully behind the file's tail that holds the exit.
    const fly = A.flyThrough, seat = A.portalSeat.position.clone(), exit0 = fly[fly.length - 2].clone();
    { const sh = seat.clone().sub(exit0).setY(0).normalize().multiplyScalar(4); exit0.add(sh); seat.add(sh); }
    const gd = seat.clone().sub(exit0).setY(0).normalize(), gl = new THREE.Vector3(-gd.z, 0, gd.x).multiplyScalar(-1);   // gully axis (heading) and its left (south) side
    if (gl.z < 0) gl.multiplyScalar(-1);
    const G0 = exit0.clone().addScaledVector(gd, -10), sSeat = 72, sEnd = sSeat + 13, GDEPTH = 12;
    const pR = new THREE.Vector3(), nR = new THREE.Vector3(), RB = 800; let CBx = 0, CBz = 0;
    const setRamp = (a) => { aRamp = a; HU.uLane.value.z = a; pR.copy(hero.arcPoint(a, 63, 0)); nR.set(Math.sin(a / R), 0, -Math.cos(a / R)); CBx = pR.x - nR.x * RB; CBz = pR.z - nR.z * RB; };
    setRamp(aRamp);
    const noise = ctx.noise;
    const GWALL = [10.4, 10.0];                        // where the left (south) and right (north) walls stand, metres from the axis
    const gullyWob = (s) => 1.1 * Math.sin(s * 0.21) + 0.7 * Math.sin(s * 0.53 + 1.3);
    const GBACK = 2.6;
    const gAlong = (s) => sstep(0, 38, s) * (1 - sstep(sEnd + GBACK, sEnd + GBACK + 2.2, s));   // the cut reaches its full depth 38 m in: a trench, not a bowl
    const gully = (x, z, out) => {                     // -> depth below the terrace; out = [s, lateral]
      const dx = x - G0.x, dz = z - G0.z, s = dx * gd.x + dz * gd.z, l = dx * gl.x + dz * gl.z;
      if (out) { out[0] = s; out[1] = l; }
      if (s < -4 || s > sEnd + 9 || Math.abs(l) > 26) return 0;
      const wob = 1.1 * Math.sin(s * 0.21) + 0.7 * Math.sin(s * 0.53 + 1.3);
      // a cut bank: both walls stand close to vertical (the fall happens inside one cell of the fine patch grid)
      // (this heightfield wall stands GBACK behind the wall ribbons and the turf lip, which are what is seen)
      const wall = l > 0 ? 1 - sstep(GWALL[0] + GBACK + wob * 0.5, GWALL[0] + GBACK + 1.0 + wob * 0.5, l) : 1 - sstep(GWALL[1] + GBACK + wob * 0.6, GWALL[1] + GBACK + 1.0 + wob * 0.6, -l);
      const along = gAlong(s);
      const bed = sstep(2.6, 6, Math.abs(l - (2.4 * Math.sin(s * 0.1) + 1.3 * Math.sin(s * 0.27 + 1))));   // 0 in the stream's bed, which lies level across
      const floor = 1 - (0.035 * (0.5 + 0.5 * Math.sin(s * 0.9 + l * 0.7)) + 0.045 * (0.5 + 0.5 * Math.sin(s * 0.37 - l * 1.3 + 2))) * sstep(0.5, 1, wall) * bed + 0.012 * (1 - bed);   // silt mounds beside it
      return GDEPTH * along * wall * floor;
    };
    const land = (x, z) => {
      const dz = z - R, q = Math.hypot(x, dz) - R;
      let y = -SWELL[0] * (1 - Math.exp(-(q * q) / (SWELL[1] * SWELL[1])));
      const dB = Math.hypot(x - CBx, z - CBz) - RB;
      if (dB > -40 || q > BLUFF[0] - 2) {
        const a = Math.atan2(x, -dz) * R, m = 1 - sstep(42, 60, Math.abs(a - aRamp));
        const ragged = 3.5 * noise.n2(x * 0.021, z * 0.021) + 1.2 * noise.n2(x * 0.09, z * 0.09);
        const cliff = sstep(-2.5, 6.5, dB + ragged), ramp = sstep(BLUFF[0], BLUFF[0] + BLUFF[1], q);
        let drop = BLUFF[2] * lerp(cliff, ramp, m);
        if (dB > 20) drop += -0.5 * sstep(0.35, 0.6, 0.5 + 0.5 * noise.n2(x * 0.011 + 9, z * 0.03)) * sstep(20, 40, dB)   // gravel bars stand a little proud
          - 9 * sstep(430, 520, dB) - 16 * sstep(900, 1500, dB);                                                                // the far bank and the land behind it
        y -= drop;
      }
      return y - gully(x, z);
    };
    hero.groundAt = land;

    // ---- the flight. Four pictures, not one: (1) down the stream, diving past the lone bull among the saiga; (2) the turn at
    // the matriarch and low up the file, face to face; (3) with the stream through the 30 m gap, out over the lip of the slump
    // and down the fall, then banking west above the ramp with the river below; (4) back to the file on its far side, low past
    // the last cows and the tail bull with the light behind them, and round behind him into the gully.
    // Every animal is where it will be when we get there (the loop below settles the timing).
    const matriarch = hero.mammoths.find((m) => m.kind === 'matriarch'), tailBull = hero.mammoths.find((m) => m.kind === 'tailBull');
    const tailCow = hero.mammoths.filter((m) => m.kind === 'cow' || m.kind === 'young').reduce((b, m) => (m.a < b.a ? m : b));
    const AP = (a, q, y) => hero.arcPoint(a, q, y), lu = HU.uLane.value.x, ptmp = new THREE.Vector3(), aGap0 = aOf(A.gap);
    const loneB = hero.mammoths.find((m) => m.kind === 'loneBull'), BP = (e, n, y) => hero.arcPoint(loneB.a + e * R / (R + loneB.q), loneB.q + n, y);
    const WB = (dx, dz, y) => { const p = hero.arcPoint(loneB.a, loneB.q, 0); p.x += dx; p.z += dz; p.y = land(p.x, p.z) + y; return p; };   // metres east and south of the lone bull, y above the ground
    const PA = (a, q, y) => { const p = hero.arcPoint(a, q, 0); p.y = Math.max(y, land(p.x, p.z) + 4.6); return p; };   // absolute height, never under 4.6 m of air
    let path = null, uTurn = 0.26, uGap = 0.52, uOver = 0.74, uBull = 0.8, aG = 0, aC = 0;
    for (let it = 0; it < 5; it++) {
      const aM = matriarch.a + WALKD * uTurn, apex = AP(aM + 3, -12.5, 3.6);
      aG = aGap0 + WALKD * uGap; aC = tailCow.a + WALKD * uOver;
      const D = Math.max(44, aG - aC), aB = tailBull.a + WALKD * uBull;
      setRamp(aG - 30);   // the slump lies north-west of the gap, under our wheel: the stream that threads the gap with us swings left and pours down it
      // the way in (polish 2): from the EAST, heading west-north-west into the low sun, so the stream crosses ahead of us against the
      // light with the lone bull standing in its near edge; we swing right round him (he passes on our left, haloed) and run north
      // beside the stream to the matriarch. WB / BP: metres from the lone bull (world east and south / along the arc and outward).
      const pts = [WB(50, 16.5, 5.2), WB(36, 10.5, 4.3), WB(22.5, 4, 3.4), WB(11.5, -7.5, 3.0), WB(11.5, -22, 3.3), AP(aM + 15, -40, 6.2), AP(aM + 16, -22, 4.7), apex, AP(aM - 15, -8.3, 3.3)];
      const n1 = Math.max(1, Math.round((aM - 15 - (aG + 22)) / 26));
      for (let i = 1; i < n1; i++) pts.push(AP(lerp(aM - 15, aG + 22, i / n1), i % 2 ? -9.8 : -8.3, i % 2 ? 3.6 : 2.6));   // level with the domes, then low and close under them
      const gapIn = AP(aG - 3, 1.5, 5.0), cowBy = AP(Math.min(aG - 44, aB + 19), 17, 3.6), bullBy = AP(aB + 2, 10, 3.4), aR1 = aG - 0.55 * D;   // cowBy: back up on the terrace, north-east of the tail bull
      // (polish 2) out through the gap and down beside the ribbon on the slump, one left-hand wheel 13 m above its foot with the river and
      // the low sun ahead, then back up the slump against the flow, over the lip, and west along the terrace to the tail bull
      pts.push(AP(aG + 24, -10.5, 7.2), AP(aG + 8, -8.2, 6.4), gapIn, PA(aG - 4, 23, 3.0), PA(aG - 7, 45, 0.6), PA(aG - 22, 60, -4.0), PA(aG - 32, 49, -7.4), PA(aG - 32.5, 31, -2.0), cowBy, bullBy, AP(aB - 10, 1.5, 4.4), exit0.clone(), seat.clone());
      path = makePath(pts);
      uTurn = path.nearestXZ(apex.x, apex.z).u; uGap = path.nearestXZ(gapIn.x, gapIn.z).u; uOver = path.nearestXZ(cowBy.x, cowBy.z).u; uBull = path.nearestXZ(bullBy.x, bullBy.z).u;
      await pause();
    }
    await pause();
    // THAW PONDS (polish 2): shallow meltwater pools over the permafrost on the dead-level part of the terrace, east of the
    // stream, each in a dark margin of cotton sedge. They mirror the sky and carry the low sun's glitter into the foreground.
    const NP = 8, ponds = [];
    for (const [dx, dz, r] of [[28, 2, 7], [58, -6, 10], [33, -20, 7], [57, 26, 9], [38, -42, 8], [70, 6, 12], [14, 30, 6.5], [62, -30, 9]]) {
      const c = WB(dx, dz, 0), q = Math.hypot(c.x, c.z - R) - R;
      if (q < -46 && ponds.length < NP) ponds.push(new THREE.Vector4(c.x, c.z, r, 3 + ponds.length * 7.3));
    }
    while (ponds.length < NP) ponds.push(new THREE.Vector4(0, 9000, 1, 0));
    const pondAt = (x, z) => { let m = 9; for (const o of ponds) m = Math.min(m, Math.hypot(x - o.x, z - o.y) / o.z); return m; };   // under ~1.1: water or its wet edge

    // ---- terrain mesh: a stretched grid (3.5 m cells under the action, growing outward) + a fine patch for the gully
    const gridAxis = (lo, hi, step, grow, reach) => {
      const a = []; for (let v = lo; v <= hi + 1e-6; v += step) a.push(v);
      let d = step, v0 = lo, v1 = a[a.length - 1];
      while (v1 - hi < reach) { d *= grow; v0 -= d; v1 += d; a.unshift(v0); a.push(v1); }
      return a;
    };
    const gtmp = [0, 0];
    const gridGeometry = async (nx, nz, at, eps, sinkGully) => {
      const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), aux = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
      let k = 0;
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++, k++) {
          const [x, z] = at(i, j), y = land(x, z);
          const hx = land(x + eps, z) - land(x - eps, z), hz = land(x, z + eps) - land(x, z - eps), il = 1 / Math.hypot(hx, 2 * eps, hz);
          const gdp = gully(x, z, gtmp), inside = sinkGully && gtmp[0] > 2 && gtmp[0] < sEnd + 4 && Math.abs(gtmp[1]) < 20;
          pos[k * 3] = x; pos[k * 3 + 1] = inside ? y - 40 : y; pos[k * 3 + 2] = z;
          nor[k * 3] = -hx * il; nor[k * 3 + 1] = 2 * eps * il; nor[k * 3 + 2] = -hz * il;
          aux[k * 3] = gdp; aux[k * 3 + 1] = gtmp[0]; aux[k * 3 + 2] = gtmp[1];
        }
        if (j % 2 === 1) await pause();
      }
      await pause();
      let t = 0;
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[t++] = a; idx[t++] = c; idx[t++] = b; idx[t++] = b; idx[t++] = c; idx[t++] = d; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aGully', new THREE.BufferAttribute(aux, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      return g;
    };
    const xs = gridAxis(-196, 216, 4, 1.25, 2600), zs = gridAxis(-128, 188, 4, 1.25, 2600);
    const mainGeo = await gridGeometry(xs.length, zs.length, (i, j) => [xs[i], zs[j]], 1.2, true);
    await pause();
    const PS = 1.25, pnx = Math.round((sEnd + 16) / PS) + 1, pnz = Math.round(52 / PS) + 1;
    const patchGeo = await gridGeometry(pnx, pnz, (i, j) => { const s = -6 + i * PS, l = -26 + j * PS; return [G0.x + gd.x * s + gl.x * l, G0.z + gd.z * s + gl.z * l]; }, 0.45, false);
    await pause();
    const time = { value: 0 };
    const GU = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time,
      uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uArc: HU.uArc, uLane: HU.uLane, uWidth: HU.uWidth, uStream: HU.uStream,
      uLoess: { value: C(mood.loess) }, uGrass: { value: C(mood.palette[3]) }, uSage: { value: C(mood.palette[4]) }, uPoppy: { value: C(mood.palette[6]) },
      uSilt: { value: C('#3A2F2A') }, uIce: { value: C('#5F7F8A') }, uWater: { value: C(mood.water) }, uGravel: { value: C('#8f8674') }, uWillow: { value: C(moodName === 'ochre' ? '#b89a2c' : '#5f7038') },
      uRiver: { value: new THREE.Vector4(CBx, CBz, RB, RIVER_Y) }, uRamp: { value: new THREE.Vector4(aRamp, BLUFF[0], BLUFF[1], GDEPTH) },
      uGain: { value: mood.gain ?? (moodName === 'noon' ? 1.45 : 1) }, uCloud: HU.uCloud, uTroughC: { value: C(mood.troughC ?? (moodName === 'noon' ? '#5a643a' : '#5f7038')) }, uTroughK: { value: mood.troughK ?? (moodName === 'noon' ? 0.46 : 0.38) }, uLow: { value: sstep(20, 4, mood.sunEl) }, uRose: { value: C(mood.palette[0]) }, uPond: { value: ponds }, uPondDeep: { value: C(mood.zenith).multiplyScalar(0.55) },
      uSkyHor: { value: C(mood.horizon) }, uSkyZen: { value: C(mood.zenith) }, uScatC: { value: C(mood.scatter) }, uCirLit: { value: C(mood.cirrus.lit) },   // (m7) this look's own sky colours, for what the still water mirrors
      uRiverW: HU.uRiverW, uBarBox: HU.uBarBox, uBarTex: HU.uBarTex,   // (Mend 1) the river's own law (RIVER_GLSL), for the metres in from a waterline
    };
    const groundMat = new THREE.ShaderMaterial({ uniforms: GU, defines: { NP }, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(mainGeo, groundMat), patch = new THREE.Mesh(patchGeo, groundMat);
    ground.renderOrder = -0.5; patch.renderOrder = -0.5; ground.frustumCulled = false; ground.name = 'ground-main'; patch.name = 'ground-patch';
    scene.add(ground, patch);
    await pause();
    // the turf lip of the gully: a ragged mat of sod overhanging the top of each wall and the head wall, its soil
    // underside hanging in a torn curtain, roots dangling and stirring (what a heightfield cannot give)
    {
      const pos = [], col = [], sway = [], lr = rng.fork('lip');
      const cTurf = C(mood.palette[3]).lerp(C(mood.loess), 0.2), cEdge = C(mood.grassRoot).multiplyScalar(0.8), cSoil = C('#8a6e50'), cDeep = C('#66503c'), cRoot = C('#6e5740');
      const V = (pt, c, w, lit) => { pos.push(pt[0], pt[1], pt[2]); col.push(c.r, c.g, c.b); sway.push(w, lit); };
      const tri = (a, b, c2) => { V(...a); V(...b); V(...c2); };
      const quad = (a, b, c2, d) => { tri(a, b, c2); tri(a, c2, d); };
      const at = (sg, l, y) => [G0.x + gd.x * sg + gl.x * l, y, G0.z + gd.z * sg + gl.z * l];
      const run = (n, ptAt) => {   // ptAt(i) -> { o: outer point [s, l], e: lip edge [s, l], k: 0..1 how deep the cut is here }
        let prev = null, hsm = 0.5;
        for (let i = 0; i <= n; i++) {
          const r = ptAt(i), k = r.k, ty = land(...at(r.o[0], r.o[1], 0).filter((v, j) => j !== 1));
          hsm = hsm * 0.72 + lr() * 0.28; const hang = (0.3 + 0.55 * hsm) * k, droop = 0.1 + 0.12 * lr();
          const cur = { A: at(r.o[0], r.o[1], ty + 0.07), B: at(r.e[0], r.e[1], ty - droop * k), C: at(r.e[0] + r.n[0] * 0.18, r.e[1] + r.n[1] * 0.18, ty - droop * k - hang), M: at(r.e[0] + r.n[0] * 0.9, r.e[1] + r.n[1] * 0.9, ty + 0.07), k, tint: 0.75 + 0.5 * lr() };
          if (prev && (k > 0.05 || prev.k > 0.05)) {
            const t0 = cTurf.clone().multiplyScalar(prev.tint), t1 = cTurf.clone().multiplyScalar(cur.tint);
            quad([prev.A, t0, 0, 1], [cur.A, t1, 0, 1], [cur.M, t1, 0, 1], [prev.M, t0, 0, 1]);
            quad([prev.M, t0, 0, 1], [cur.M, t1, 0, 1], [cur.B, cEdge, 0, 0.7], [prev.B, cEdge, 0, 0.7]);
            quad([prev.B, cSoil, 0, 0.1], [cur.B, cSoil, 0, 0.1], [cur.C, cDeep, 0.25, 0], [prev.C, cDeep, 0.25, 0]);
            const nr = k > 0.4 ? 1 + (lr() < 0.6 ? 1 : 0) : 0;
            for (let j = 0; j < nr; j++) {   // roots: tapering strands, pale against the dark wall
              const f = lr(), len = (0.5 + 1.9 * lr() * lr()) * k, w = 0.03 + 0.03 * lr();
              const m = cur.B.map((v, q) => prev.B[q] + (v - prev.B[q]) * f), d = cur.B.map((v, q) => (v - prev.B[q]) * w / 0.9);
              const tip = [m[0] + r.n2[0] * 0.25 * (lr() - 0.3), m[1] - len, m[2] + r.n2[1] * 0.25 * (lr() - 0.3)];
              tri([[m[0] - d[0], m[1] + 0.02, m[2] - d[2]], cRoot, 0, 0.35], [[m[0] + d[0], m[1] + 0.02, m[2] + d[2]], cRoot, 0, 0.35], [tip, cRoot, 1, 0.3]);
            }
          }
          prev = cur;
        }
      };
      const kAt = (sg) => sstep(1, 4, GDEPTH * sstep(0, 38, sg)), xz = (sg, l) => { const q = at(sg, l, 0); return [q[0] - G0.x, q[2] - G0.z]; };
      for (const sd of [1, -1]) {
        const base = sd > 0 ? GWALL[0] + 1.0 : GWALL[1] + 1.0, wk = sd > 0 ? 0.5 : 0.6, n = Math.round((sEnd + 2) / 0.9);
        run(n, (i) => { const sg = 1 + i * 0.9, lt = base + gullyWob(sg) * wk, ov = 0.45 + 0.7 * lr(); return { o: [sg, sd * (lt + GBACK + 1.4)], e: [sg, sd * (lt - ov)], n: [0, sd * 1], n2: xz(0, -sd), k: kAt(sg) }; });
        await pause();
      }
      { const l0 = -(GWALL[1] + GBACK + 2.4), l1 = GWALL[0] + GBACK + 2.4, n = Math.round((l1 - l0) / 0.9), st = sEnd + 2.2;
        run(n, (i) => { const l = l0 + (l1 - l0) * i / n, ov = 0.45 + 0.7 * lr(); return { o: [st + GBACK + 1.4, l], e: [st - ov, l], n: [1, 0], n2: xz(-1, 0), k: 1 }; }); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 2));
      g.computeBoundingSphere();
      const lip = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uLow: GU.uLow, uGain: GU.uGain },
        vertexShader: LIP_VERT, fragmentShader: LIP_FRAG, fog: true, side: THREE.DoubleSide }));
      lip.name = 'gully-lip'; scene.add(lip);
    }
    await pause();
    let m7Wedges = null, m7WallAt = null, m7WallU = null;   // (m7) set in the block below: where the ice wedges stand, and a point of a wall's own surface (for the falls)
    // THE CUT BANKS: the two walls and the head wall as their own near-vertical ribbons with true along / depth
    // coordinates (a heightfield smears a 12 m wall across one row of cells), so the beds, clods and ice wedges are sharp.
    // Each stands just inside the heightfield's wall, under the turf lip, with an apron of slumped silt at its foot.
    {
      const pos = [], aw = [], an = [], awf = [], idx = [], ROWS = 9, STEP = 0.7;
      // (polish m4) ICE WEDGES: where each stands along a wall [s, top half-width, share of the wall's depth, seed]; no rng (a fixed hash of its index)
      const hsh = (k, j) => { const v = Math.sin(k * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
      const WEDGES = { 1: [], [-1]: [] };
      for (const sd of [1, -1]) for (let k = 0; k < 7; k++) { const j = sd > 0 ? 0 : 7; if (hsh(k + j, 1) < 0.84) WEDGES[sd].push([15.5 + k * 10.4 + 3.2 * (hsh(k + j, 2) - 0.5), 1.3 + 0.5 * hsh(k + j, 3), 0.5 + 0.18 * hsh(k + j, 4), (k + j + 1) / 16]); }
      // (m7) THE FALLS' LINES: meltwater comes down beside one shoulder of each wedge, where the thawed gap drains (which one: by the wedge's own number), [metres along the wall, the wedge]
      const fallLine = (w) => w[0] + (Math.round(w[3] * 16) % 2 ? 1 : -1) * w[1] * (1.0 + 0.25 * ((w[3] * 16 * 0.37) % 1));   // (Mend 2) at the wedge's shoulder and just outside it (1 to 1.25 of its top half-width from its middle; before: 0.5 to 0.75, on the ice's own face, which hid the ice)
      // -> metres from the nearest fall's line, as a SIZE (never signed: a signed value changes sign midway between two falls, and the
      // wall's shader then reads the zero it passes through inside that one quad as the wet rock under a fall)
      const fallAt = (sd, sg) => { let b = 99; if (sd) for (const w of WEDGES[sd]) b = Math.min(b, Math.abs(sg - fallLine(w))); return b; };
      const awx = [];
      const wedgeAt = (sd, sg) => { let b = null, bd = 99; if (sd) for (const w of WEDGES[sd]) { const d = Math.abs(sg - w[0]); if (d < bd) { bd = d; b = w; } } return b ? [bd, b[1], b[2], b[3]] : [99, 0, 0.4, 0]; };
      const ribbon = (n, at) => {   // at(i) -> { x, z, nx, nz (into the cut), along, depth, top }
        const base = pos.length / 3;
        for (let i = 0; i <= n; i++) {
          const r = at(i);
          for (let k = 0; k <= ROWS; k++) {
            const f = k / ROWS, ap = sstep(0.7, 1, f), bulge = 0.16 * noise.n2(r.along * 0.7 + 40, f * 5) + 0.1 * noise.n2(r.along * 2.1, f * 13 + 9);
            const inw = ((1.0 * f + 2.2 * ap * ap) * Math.min(1, r.depth / 5) + bulge * Math.min(1, r.depth / 3)) - 0.9;   // metres toward the axis from the rim line (polish m3: where the cut is shallow the bank no longer splays out over the floor as a grey slab)
            pos.push(r.x + r.nx * inw, r.top - 0.05 - f * (r.depth + 0.35), r.z + r.nz * inw); aw.push(r.along, f * (r.depth + 0.35), r.depth); an.push(r.nx, r.nz); awf.push(...r.wf); awx.push(r.fx);
          }
        }
        for (let i = 0; i < n; i++) for (let k = 0; k < ROWS; k++) { const a = base + i * (ROWS + 1) + k, b = a + ROWS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      };
      const P2 = (sg, l) => [G0.x + gd.x * sg + gl.x * l, G0.z + gd.z * sg + gl.z * l];
      for (const sd of [1, -1]) {
        const W = sd > 0 ? GWALL[0] : GWALL[1], wk = sd > 0 ? 0.5 : 0.6, S0 = 7.3, n = Math.round((sEnd + 1.5 - (S0 - 1)) / STEP);   // (polish m3) the ribbons begin where the cut is 1.2 m deep: before that the heightfield's own soil bank shows (a ribbon strip stood there as a grey sliver)
        ribbon(n, (i) => { const sg = S0 + i * STEP, l = sd * (W + 1.0 + gullyWob(sg) * wk), [x, z] = P2(sg, l), [xo, zo] = P2(sg, l + sd * (GBACK + 1.8));
          return { x, z, nx: -sd * gl.x, nz: -sd * gl.z, along: sg + (sd > 0 ? 0 : 300), depth: GDEPTH * sstep(0, 38, sg), top: land(xo, zo), wf: wedgeAt(sd, sg), fx: fallAt(sd, sg) }; });
        await pause();
      }
      { const l0 = -(GWALL[1] + 2.5), l1 = GWALL[0] + 2.5, n = Math.round((l1 - l0) / STEP), st = sEnd + 2.2;
        ribbon(n, (i) => { const l = l0 + (l1 - l0) * i / n, [x, z] = P2(st, l), [xo, zo] = P2(st + GBACK + 3.6, l);
          return { x, z, nx: -gd.x, nz: -gd.z, along: l + 600, depth: GDEPTH, top: land(xo, zo), wf: wedgeAt(0, 0), fx: 99 }; }); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3)); g.setAttribute('aWN', new THREE.Float32BufferAttribute(an, 2)); g.setAttribute('aWf', new THREE.Float32BufferAttribute(awf, 4)); g.setAttribute('aWx', new THREE.Float32BufferAttribute(awx, 1));
      g.setIndex(idx); g.computeBoundingSphere();
      const sunH = Math.max(0.05, Math.hypot(sunDir.x, sunDir.z));
      const walls = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGain: GU.uGain, uLow: GU.uLow,
        uSilt: GU.uSilt, uIce: GU.uIce, uLoess: GU.uLoess, uLitD: { value: Math.min(3.4, Math.max(2.2, 20 * sunDir.y / sunH)) } },
        vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide }));
      walls.name = 'gully-walls'; scene.add(walls); m7WallU = walls.material.uniforms;
      await pause();
      // each wedge is a BODY of ground ice standing a hand to half a metre proud of the thawing bank: a rounded, melt-fluted
      // buttress 2.5 to 3.5 m across under the turf, tapering to a point, built on the wall's own surface (so it leans with it)
      const ip = [], ia = [], ii = [], NJ = 10, NI = 8;
      // (m7) a point of a wall: side sd, sg metres along the gully, h metres below the rim, `proud` metres out from the wall's face
      m7Wedges = { 1: WEDGES[1].map((w) => [fallLine(w), w]), [-1]: WEDGES[-1].map((w) => [fallLine(w), w]) };
      m7WallAt = (sd, sg, h, proud) => {
        const W = sd > 0 ? GWALL[0] : GWALL[1], wk = sd > 0 ? 0.5 : 0.6, l = sd * (W + 1.0 + gullyWob(sg) * wk), [x, z] = P2(sg, l), [xo, zo] = P2(sg, l + sd * (GBACK + 1.8)), depth = GDEPTH * sstep(0, 38, sg), top = land(xo, zo);
        const f = h / (depth + 0.35), ap = sstep(0.7, 1, f), bulge = 0.16 * noise.n2((sg + (sd > 0 ? 0 : 300)) * 0.7 + 40, f * 5) + 0.1 * noise.n2((sg + (sd > 0 ? 0 : 300)) * 2.1, f * 13 + 9);
        const inw = ((1.0 * f + 2.2 * ap * ap) * Math.min(1, depth / 5) + bulge * Math.min(1, depth / 3)) - 0.9;
        return { x: x - sd * gl.x * (inw + proud), y: top - 0.05 - h, z: z - sd * gl.z * (inw + proud), depth, nx: -sd * gl.x, nz: -sd * gl.z };
      };
      for (const sd of [1, -1]) for (const [c, w, dk, seed] of WEDGES[sd]) {
        const W = sd > 0 ? GWALL[0] : GWALL[1], wk = sd > 0 ? 0.5 : 0.6, base = ip.length / 3;
        for (let j = 0; j <= NJ; j++) for (let i = 0; i <= NI; i++) {
          const xn = -1 + 2 * i / NI, dep0 = GDEPTH * sstep(0, 38, c), wdeep = Math.max(0.5, dep0 * dk), h = 0.3 + (wdeep + 0.2) * j / NJ;
          const t = sat(1 - (h - 0.45) / wdeep), half = Math.max(0.03, w * Math.pow(t, 0.6) * 1.08 - 0.13 + 0.11 * noise.n2(seed * 73, h * 1.3)) * 1.08;
          const sg = c + xn * half, l = sd * (W + 1.0 + gullyWob(sg) * wk), [x, z] = P2(sg, l), [xo, zo] = P2(sg, l + sd * (GBACK + 1.8)), depth = GDEPTH * sstep(0, 38, sg), top = land(xo, zo);
          const f = h / (depth + 0.35), ap = sstep(0.7, 1, f), bulge = 0.16 * noise.n2((sg + (sd > 0 ? 0 : 300)) * 0.7 + 40, f * 5) + 0.1 * noise.n2((sg + (sd > 0 ? 0 : 300)) * 2.1, f * 13 + 9);
          const inw = ((1.0 * f + 2.2 * ap * ap) * Math.min(1, depth / 5) + bulge * Math.min(1, depth / 3)) - 0.9;
          const round = Math.sqrt(Math.max(0, 1 - xn * xn * 0.97)), flute = 0.06 * Math.sin(i * 2.4 + seed * 60 + j * 0.5) + 0.09 * noise.n2(xn * 2.2 + seed * 31, h * 0.9);
          // (m7) THE ICE IS SET INTO THE WALL: its flanks sink a forearm behind the bank's own face, so the thawed silt closes
          // round it with a dark gap, and out of that recess its middle swells as a rounded boss up to 0.42 m proud of the bank
          // at its head (live: the whole body .2 to .9 m proud of the wall, flanks and all, which read as a slab or a pane hung
          // on the cliff). Its melt-flutes keep their depth.
          const out = -0.25 + (0.25 + 0.42 * Math.pow(t, 0.7) + flute * (0.5 + 0.9 * t)) * round * sstep(-0.02, 0.16, j / NJ) * Math.min(1, half / 0.3);   // (Mend 2) its belly stands up to 0.42 m proud (before: 0.16, and seen along the wall the bank hid the ice)
          ip.push(x - sd * gl.x * (inw + out), top - 0.05 - h, z - sd * gl.z * (inw + out)); ia.push(xn * half, h, t, seed);
        }
        for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const a = base + j * (NI + 1) + i, b = a + NI + 1; if (sd > 0) ii.push(a, b, a + 1, a + 1, b, b + 1); else ii.push(a, a + 1, b, a + 1, b + 1, b); }
      }
      const ig = new THREE.BufferGeometry();
      ig.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); ig.setAttribute('aI', new THREE.Float32BufferAttribute(ia, 4)); ig.setIndex(ii); ig.computeVertexNormals(); ig.computeBoundingSphere();
      const ice = new THREE.Mesh(ig, new THREE.ShaderMaterial({ uniforms: { ...walls.material.uniforms }, vertexShader: ICE_VERT, fragmentShader: ICE_FRAG, fog: true, side: THREE.DoubleSide }));
      ice.name = 'ice-wedges'; scene.add(ice);
    }
    await pause();

    // ---- sky, light, far hills
    const sky = makeSky({
      rng, preset: moodName === 'noon' ? 'day' : 'sunset', zenith: mood.zenith, mid: mood.mid, horizon: mood.horizon, ground: mood.fogAway,
      horizonPow: moodName === 'rose' ? 2.6 : 4.5, midPow: moodName === 'rose' ? 1.3 : 1.6, sunElevation: mood.sunEl, sunAzimuth: mood.sunAz, sunColor: mood.sunCol, sunSize: mood.sunSize, sunIntensity: mood.sunDisc,
      stars: 0, sunGlow: mood.glow, sunGlowTight: 0.35, scatterColor: mood.scatter, scatter: moodName === 'noon' ? 0.28 : moodName === 'ochre' ? 0.55 : 0.5, scatterPow: moodName === 'ochre' ? 3.5 : 3, scatterHigh: 0.1,
      clouds: mood.cloud > 0 ? { coverage: 0.3, lit: '#ffffff', shade: '#8fa2c4', scale: 1.2 } : false,
      clouds2: { coverage: mood.cirrus.coverage, stretch: 1, lit: mood.cirrus.lit, shade: mood.cirrus.shade, scale: 0.8, wind: [0.006, 0.001], haze: 0.1 },
      fogColor: mood.fog, lightElevationMin: 8,
    });
    scene.add(sky.object);
    await pause();
    // five long bars of high cloud level across the sky on the sun's side, lit from below
    const bars = new THREE.Mesh(barsGeometry(rng.fork('bars'), mood.sunAz), new THREE.ShaderMaterial({ uniforms: { uTime: time, uLit: { value: C(mood.cirrus.lit).multiplyScalar(moodName === 'rose' ? 1.15 : 1) }, uShade: { value: C(mood.cirrus.shade) },
      uAlpha: { value: moodName === 'rose' ? 0.9 : moodName === 'ochre' ? 0.6 : 0.5 } }, vertexShader: BARS_VERT, fragmentShader: BARS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    bars.renderOrder = -0.9; bars.frustumCulled = false; scene.add(bars);
    const ridges = makeHorizonRidges({
      rng: rng.fork('ridges'), layers: 3, radius: [2500, 3500], height: [45, 150], base: -40, jagged: 0.22, coverage: 0.8, colorNear: mood.hills,
      fog: scene.fog, sunDir, sunColor: mood.sunCol, sunIntensity: 0.7, snow: mood.snow, snowLine: 0.5, rim: 0.35,
    });
    scene.add(ridges.object);
    await pause();

    // ---- ground cover: fescue bunches with bare loess between, sage cushions, poppies, pasqueflowers, oxytrope
    const onTerrace = (x, z) => (Math.hypot(x - CBx, z - CBz) - RB < -5 && gully(x, z) < 0.3 && land(x, z) > -SWELL[0] * (1 - Math.exp(-((Math.hypot(x, z - R) - R) ** 2) / (SWELL[1] * SWELL[1]))) - 0.5) ? 1 : 0;
    const tuftKeep = (x, z) => (pondAt(x, z) < 0.93 ? 0 : 1) * onTerrace(x, z) * (0.3 + 0.7 * sstep(-0.3, 0.2, noise.n2(x * 0.07, z * 0.07)));
    const grass = await makeTufts({
      rng: rng.fork('grass'), path, land, keep: tuftKeep, noise, pause, count: Math.round(13000 * detail * Math.min(1.15, density)), radius: 38, bias: 1.8, blades: 4,
      shadow: { uShadowCol: HU.uShadowCol, uShOp: { value: moodName === 'rose' ? 0.55 : 0.8 } },
      uniforms: { uTime: time, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uLow: GU.uLow, uCloud: GU.uCloud, uFade: { value: new THREE.Vector3(70, 105, 0) },
        uWind: { value: new THREE.Vector2(0.5, 0.866) }, uArc: HU.uArc, uShLen: { value: Math.min(mood.shadowLen, 5.5) }, uRoot: { value: C(mood.grassRoot) }, uTip: { value: C(mood.grassTip) }, uSageC: { value: C(mood.palette[4]) } },
    });
    scene.add(grass.object, grass.shadow);
    await pause();
    // arctic poppies (every bowl facing the sun), pasqueflowers, oxytrope: small wild blooms, not a meadow
    const flowers = await makeTufts({
      rng: rng.fork('flowers'), path, land, noise, pause, count: Math.round(2300 * detail * density), radius: 26, bias: 1.7, geometry: flowerGeometry(),
      keep: (x, z) => (pondAt(x, z) < 1.12 ? 0 : 1) * onTerrace(x, z) * sstep(-0.15, 0.4, noise.n2(x * 0.045 + 31, z * 0.045)),
      flowers: [mood.palette[6], mood.palette[6], '#efe6c8', mood.palette[6], '#8d6cc4', '#8d6cc4'].map(C), yaw: Math.atan2(-sunDir.x, sunDir.z), uniforms: grass.material.uniforms,
    });
    scene.add(flowers.object);
    await pause();
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: 'pollen', time, count: Math.round(700 * detail), box: [46, 3.0, 46], follow: 'xz', center: [0, -0.6, 0], size: [0.03, 0.07],
      colors: [mood.dust, '#f4dcb0', mood.palette[0]], intensity: moodName === 'rose' ? 0.6 : 0.5, opacity: 0.7 });   // fluff and midges: low, warm, dimmer than the sky (no stars here)
    scene.add(motes.object);
    await pause();
    // ---- the rest of the stream: a second near tier round the camera on the way in, a mid tier down the ramp, cards on the fords
    const farBounds = new THREE.Sphere(new THREE.Vector3(40, -5, -60), 560);
    // sIn: 220 full animals in a 70 m window that slides down the river with the camera; sBand: the whole incoming river
    // behind and ahead of it at range; sFan: the fan along the file at range; sMid: the ribbon pouring down the ramp.
    const sIn = hero.makeSaigaTier({ count: 150, lod: 'near', qFrom: -186, qTo: -128, bias: 1 });
    scene.add(sIn, sIn.userData.shadow);
    await pause();
    const sBand = hero.makeSaigaTier({ count: Math.round(760 * detail), lod: 'far', qFrom: -236, qTo: -36, bounds: farBounds, bias: 1, nearFade: [12, 22] });
    sBand.userData.shadow.geometry.boundingSphere = farBounds;
    scene.add(sBand, sBand.userData.shadow);
    await pause();
    const sFan = hero.makeSaigaTier({ count: Math.round(330 * detail), lod: 'mid', qFrom: -70, qTo: 44, bounds: farBounds, bias: 1 });
    scene.add(sFan, sFan.userData.shadow);
    await pause();
    const sMid = hero.makeSaigaTier({ count: Math.round(830 * detail), lod: 'far', qFrom: 14, qTo: 150, bounds: farBounds, bias: 1, wake: true });   // (m7) wake: its wakes on the river (no draw of chance: the tier's own instances)
    sMid.userData.shadow.geometry.boundingSphere = farBounds;
    scene.add(sMid, sMid.userData.shadow, sMid.userData.wake);
    await pause();
    const heroTier = hero.object.children.find((c) => c.userData && c.userData.uWrap), camP = new THREE.Vector3();
    const fordQ = new THREE.Vector4(140, 480, -1e5, 1e5), fordNearQ = { value: [-1e5, -1e5, -1e5, -1e5, -1e5, -1e5] };   // (m7) fordNearQ: for each of the six fords' lines, nearer than this q its cards are whole animals (set below, by a rule of the place)
    {
      const n = Math.round(2000 * detail), iA = new Float32Array(n * 4), fr = rng.fork('fords');
      for (let i = 0; i < n; i++) iA.set([fr.range(-1, 1), fr(), fr.range(0.85, 1.15), fr()], i * 4);
      const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
      g.setAttribute('position', q.getAttribute('position')); g.setIndex(q.getIndex()); g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
      g.instanceCount = n; g.boundingSphere = farBounds;
      const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, uQ: { value: fordQ }, uCoat: { value: C('#b89a70') }, uRiverY: { value: RIVER_Y }, uNearQ: fordNearQ },
        defines: { NM: hero.NM }, vertexShader: FORD_VERT, fragmentShader: FORD_FRAG, fog: true, side: THREE.DoubleSide });
      const fords = new THREE.Mesh(g, m); fords.name = 'fords'; scene.add(fords);
    }
    await pause();
    // the fall of dust over the ramp: it hangs gold in the light, behind and beyond the file
    const rampMid = hero.arcPoint(aRamp + 44, 96, 0), fallDust = fx.makeMist({ rng: rng.fork('fall'), time, count: Math.round(46 * detail), area: [60, 12, 100], center: [rampMid.x, RIVER_Y + 7, rampMid.z],
      size: [13, 26], color: C(mood.dust).multiplyScalar(moodName === 'rose' ? 0.82 : 0.7), opacity: 0.07, drift: [0.5, 0, 0.25], flatten: 0.6, floorFade: 1 });
    fallDust.object.visible = false; scene.add(fallDust.object);   // (polish 2: it read as a milky patch over the ramp from above; the plume beside the slump carries the dust)
    await pause();
    // THE PLUME: the dust of thousands of hooves on the ramp, rolling up 20 m over the bluff edge and leaning downwind;
    // soft lit sprites in one draw (gold toward the sun, rose-grey on the shaded side, capped so it never clips)
    const plumeU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uArc: HU.uArc,
      uDust: { value: C(mood.dust).lerp(C('#fff6ea'), moodName === 'rose' ? 0.25 : 0.5) }, uShade: { value: C(mood.fogAway).lerp(C(mood.palette[0]), 0.35) },
      uRampP: { value: new THREE.Vector4(aRamp + 36, BLUFF[0], BLUFF[1], BLUFF[2]) }, uPlume: { value: 1 }, uAlpha: { value: 0.94 }, uSoft: { value: 0 }, uSwellH: { value: SWELL[0] }, uPl: { value: new THREE.Vector4(0, 0, 1, 1) } };
    {
      const n = Math.round(70 * detail), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), pr = rng.fork('plume');
      for (let i = 0; i < n; i++) { iA.set([pr.range(-1, 1), pr(), pr.range(5.5, 10), pr()], i * 4); iB.set([pr.range(0.04, 0.065), pr(), pr(), pr()], i * 4); }
      const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
      g.setAttribute('position', q.getAttribute('position')); g.setIndex(q.getIndex());
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
      g.instanceCount = n; g.boundingSphere = farBounds;
      const plume = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: plumeU, vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, transparent: true, depthWrite: false, fog: true }));
      plume.name = 'plume'; plume.renderOrder = 2.5; scene.add(plume);
      // THE SECOND COLUMN (polish 3): where the stream leaves the foot of the slump and gallops out over the dry silt bars it
      // raises a towering column, west of the ramp, between the wheel of our flight and the low sun: backlit as we pass beside it
      // (u 0.5 to 0.66), and standing behind the file all the way up it. Same puffs, own place and size.
      const plume2 = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...plumeU, uRampP: { value: new THREE.Vector4(aRamp - 156, 100, 24, BLUFF[2]) }, uPl: { value: new THREE.Vector4(1, RIVER_Y, 2.6, 2.1) }, uAlpha: { value: moodName === 'rose' ? 0.72 : 0.9 }, uSoft: { value: 1 } },   // (polish m4) it stands 90 m further up the river and half as large again: the same size from the file, and from our wheel over the slump whole in the frame, to the right of the low sun
       
        vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, transparent: true, depthWrite: false, fog: true }));
      plume2.name = 'plume-bars'; plume2.renderOrder = 2.4; scene.add(plume2);
    }
    await pause();

    // ---- where the raven looks
    const gz = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const fallAt = hero.arcPoint(aRamp + 9, 108, 0).setY(RIVER_Y + 1);
    const gapCow = hero.mammoths.filter((m) => m.kind === 'cow' || m.kind === 'young').reduce((b, m) => (Math.abs(m.a - (aGap0 - 15)) < Math.abs(b.a - (aGap0 - 15)) ? m : b));
    const fileAhead = (k) => (t, u) => { path.pointAt(u, ptmp); return hero.arcPoint(aOf(ptmp) - 11, 0.3, 2.2, gz[k]); };   // (polish m3) the gaze turns further into the file, so the mammoth passing us is whole in the frame until it is nearly abeam
    const pois = [
      { at: A.loneBull.clone().setY(-1.4), from: 0.0, to: 0.115, weight: 0.85 },
      { at: (t, u) => hero.positionAt(matriarch, u, gz[0]).setY(2.3), from: 0.125, to: uTurn + 0.07, weight: 0.85 },
      { at: fileAhead(1), from: uTurn + 0.05, to: uGap - 0.075, weight: 0.64 },
      { at: (t, u) => hero.positionAt(gapCow, u, gz[1]).setY(1.9), from: uGap - 0.07, to: uGap - 0.004, weight: 0.6 },                // the cow on the far side of the gap, with the river behind her
      { at: fallAt, from: uGap - 0.012, to: uGap + 0.1, weight: 0.6 },                                              // over the lip: down the fall to the fords
      { at: (t, u) => { path.pointAt(u, ptmp); return hero.arcPoint(aOf(ptmp) - 12, 0, 1.6, gz[2]); }, from: uGap + 0.2, to: uOver - 0.01, weight: 0.6 },   // climbing back up the slump: the file on the skyline above us
      { at: hero.arcPoint(aRamp - 168, 129, 0).setY(RIVER_Y + 18), from: uGap + 0.045, to: uGap + 0.205, weight: 0.85 },   // wheeling over the bars: up the river into the light
      { at: (t, u) => hero.positionAt(tailBull, u, gz[3]).setY(2.6), from: uOver - 0.005, to: uBull + 0.012, weight: 0.6 },
    ];
    // ---- the ravens. The one we ride is ONE group carried with the camera (nape, bill, wingtips); its mate flies ahead-left.
    const ravenGeo = ravenGeometry();
    const ravenMat = (bias, sweep) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol,
      uTime: time, uFlap: { value: 0 }, uAmp: { value: 1 }, uBias: { value: bias }, uSweep: { value: sweep } }, vertexShader: RAVEN_VERT, fragmentShader: RAVEN_FRAG, fog: true, side: THREE.DoubleSide });
    const rider = new THREE.Group(); rider.name = 'rider'; rider.matrixAutoUpdate = false;
    const riderMat = ravenMat(0, 0), riderBird = new THREE.Mesh(ravenGeometry(false), riderMat);
    riderBird.scale.setScalar(1.9); riderBird.rotation.y = Math.PI; riderBird.position.set(0, -0.86, -0.55); riderBird.frustumCulled = false;
    rider.add(riderBird);
    const hands = [-1, 1].map((sd) => { const h = new THREE.Mesh(wingtipGeometry(sd), riderMat); h.position.set(sd * 1.75, -1.02, -1.4); h.rotation.order = 'YXZ'; h.frustumCulled = false; h.userData.side = sd; rider.add(h); return h; });
    scene.add(rider);
    const mateMat = ravenMat(0.2, 0.22), mate = new THREE.Mesh(ravenGeo, mateMat);
    mate.matrixAutoUpdate = false; mate.frustumCulled = false; scene.add(mate);
    // (polish 3) two ravens fly with us, as ravens follow the herds: ahead and well to either side, a little above our own
    // height so they sit against the sky (at 7 m dead ahead one read as a dark blob in the middle of the picture)
    const mate2Mat = ravenMat(0.2, 0.22), mate2 = new THREE.Mesh(ravenGeo, mate2Mat); mate2.matrixAutoUpdate = false; mate2.frustumCulled = false; scene.add(mate2);
    const birds = [{ mesh: mate, mat: mateMat, ahead: 11.5, lat: 3.8, up: 1.7, ph: 2, bank: 0, rolls: 1 }, { mesh: mate2, mat: mate2Mat, ahead: 18, lat: -5.2, up: 2.9, ph: 4.4, bank: 0, rolls: 0 }];
    const mP = new THREE.Vector3(), mT = new THREE.Vector3(), mX = new THREE.Vector3(), mY = new THREE.Vector3(), mS = new THREE.Vector3(1.35, 1.35, 1.35), UP = new THREE.Vector3(0, 1, 0);
    await pause();

    // ---- at range: Lena horses (small, stocky, big-headed, dun) break out on the left and gallop clear
    const lena = { ...F.HERD_PRESETS.horse, h: 1.3, bodyLen: 1.08, width: 0.43, depth: 0.6, leg: [0.1, 0.06, 0.042], neckLen: 0.5, neck: [0.33, 0.2], headLen: 0.54, headR: 0.125, mane: 0.75, chest: 1.2 };
    const fauna = F.makeFauna(scene, { light: { sunDir, sunColor: C(mood.sunCol), sunIntensity: mood.key * 0.5, sky: C(mood.skyCol), skyIntensity: mood.hemi * 0.95, ground: C(mood.groundCol), groundIntensity: mood.hemi * 0.8 } });
    const horses = rhinos ? null : fauna.add(F.makeHerd({
      rng: rng.fork('horses'), preset: lena, count: Math.round(horseN * 0.62), mode: 'migrate', gait: 'run', speed: 2.62, heightAt: land, spread: [5, 36],
      cross: { path, u: 0.125, lead: 5.5, offset: -39.5, side: -1, angle: 25, span: 120, height: 0, bow: 15, duration: DUR },
      coat: '#a98a5c', belly: '#cdb48a', legs: '#4a382c', sock: '#30251d', accent: '#2c221a', pattern: 'none', fill: 0.5, tints: ['#ffffff', '#f2e6d4', '#fff4e0', '#e6d8c4'],
    }), { always: true });
    await pause();
    // ---- the variation cast (built only on the visits that have it): two woolly rhinos in place of the horses; rare: two cave lions
    const beastMat = (expo, shag, seed) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGroundCol: HU.uGroundCol,
      uTime: time, uGait: { value: 0 }, uMove: { value: 0 }, uRise: { value: 1 }, uSeed: { value: seed }, uExpo: { value: expo }, uShag: { value: shag } }, vertexShader: BEAST_VERT, fragmentShader: BEAST_FRAG, fog: true, side: THREE.DoubleSide });
    const lions = [], rhinoList = [], rhinoDir = new THREE.Vector3(), rhinoS = new THREE.Vector3(), lionAQ = [0, 0];
    if (rare) {
      const geo = beastGeometry(LION), P = path.pointAt(0.185), T = path.tangentAt(0.185), look = path.pointAt(0.12);
      [[7.3, 2.6, 1.08, 1.3], [10.2, -2.8, 1, 4.1]].forEach(([left, fwd, sc, seed]) => {
        const m = new THREE.Mesh(geo, beastMat(0.2, 0.45, seed)), x = P.x + T.z * left + T.x * fwd, z = P.z - T.x * left + T.z * fwd;
        m.position.set(x, land(x, z), z); m.rotation.y = Math.atan2(look.x - x, look.z - z) + (seed - 2.5) * 0.08; m.scale.setScalar(sc); m.frustumCulled = false;
        scene.add(m); lions.push(m); lionAQ[0] += aOf(m.position) / 2; lionAQ[1] += (Math.hypot(x, z - R) - R) / 2;
      });
      await pause();
    }
    if (rhinos) {
      const geo = beastGeometry(RHINO), P = path.posAtDist(76), T = path.tangentAtDist(76), sideOff = rare ? 14 : 9.5, ang = 0.12;
      rhinoS.set(P.x + T.z * sideOff, 0, P.z - T.x * sideOff);
      rhinoDir.set(T.x * Math.cos(ang) + T.z * Math.sin(ang), 0, T.z * Math.cos(ang) - T.x * Math.sin(ang)).normalize();
      [[0, 0, 1, 0.7], [-5.5, 4.6, 0.9, 3.3]].forEach(([back, left, sc, seed]) => {
        const m = new THREE.Mesh(geo, beastMat(0.42, 1, seed)); m.scale.setScalar(sc); m.rotation.y = Math.atan2(rhinoDir.x, rhinoDir.z); m.frustumCulled = false;
        m.userData = { back, left }; scene.add(m); rhinoList.push(m);
      });
      await pause();
    }
    if (lions.length) {   // on the rare visit the gaze goes to the lions first, then to the matriarch
      pois[1].from = 0.185;
      pois.push({ at: lions[0].position.clone().lerp(lions[1].position, 0.5).add(new THREE.Vector3(0, 1.0, 0)), from: 0.085, to: 0.185, weight: 0.6 });
    }
    else if (horses) pois.push({ at: (t, u) => horses.positionAt(t, u, gz[0]).setY(-2.8), from: 0.095, to: 0.15, weight: 0.3 });
    else if (rhinoList.length) pois.push({ at: (t, u) => gz[0].copy(rhinoList[0].position).setY(rhinoList[0].position.y + 1.2), from: 0.1, to: 0.17, weight: 0.4 });
    let rhinoPrev = 0, rhinoMove = 0;
    const horseVis = []; if (horses) horses.object.traverse((o) => { if (o.material && o.material.uniforms && o.material.uniforms.uVis) horseVis.push(o.material.uniforms.uVis); });
    HU.uSnow.value = mood.snowCoat;

    // ===================================================================================================================
    // (m7) THE ADDS. Everything new that draws chance draws it here, after the last fork of live ('horses'), each thing from a
    // stream of its own made from the world's seed and a name: it takes nothing from ctx.rng or from any fork of live.
    // In order: 'm7-falls' (meltwater), 'm7-bands' (the sky), 'm7b-fords' (the ford cards' animals). The dust is live's and draws nothing here.
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // ---- THE RIVER PLAIN for whatever wades: the river's circle, and the plain's height above the animals' own datum (the hero's
    // groundY: swell and ramp) baked once from land(), so every wader stands on the bars' true surface. 3 m texels (the bars'
    // relief is a noise of 33 m and more); the box holds the foot of the slump and the whole fan of the fords.
    {
      const gY = (q) => -SWELL[0] * (1 - Math.exp(-(q * q) / (SWELL[1] * SWELL[1]))) - BLUFF[2] * sstep(BLUFF[0], BLUFF[0] + BLUFF[1], q);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let da = -200; da <= 200; da += 25) for (const q of [56, 200, 350, 500]) { const pt = hero.arcPoint(aRamp + da, q, 0); x0 = Math.min(x0, pt.x); x1 = Math.max(x1, pt.x); z0 = Math.min(z0, pt.z); z1 = Math.max(z1, pt.z); }
      const TW = Math.min(256, Math.ceil((x1 - x0) / 3)), TH = Math.min(256, Math.ceil((z1 - z0) / 3)), data = new Uint8Array(TW * TH * 4);
      for (let j = 0; j < TH; j++) {
        const z = z0 + (j + 0.5) / TH * (z1 - z0);
        for (let i = 0; i < TW; i++) { const x = x0 + (i + 0.5) / TW * (x1 - x0), q = Math.hypot(x, z - R) - R, v = Math.round(255 * sat((land(x, z) - gY(q)) / 0.75)), k = (j * TW + i) * 4; data[k] = v; data[k + 1] = v; data[k + 2] = v; data[k + 3] = 255; }
        if (j % 12 === 11) await pause();
      }
      const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat, THREE.UnsignedByteType); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
      HU.uBarTex.value = tex; HU.uBarBox.value.set(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)); HU.uRiverW.value.set(CBx, CBz, RB, RIVER_Y);
    }
    await pause();
    // ---- THE FORDS' NEAR REACH. A rule of the place, decided here for each of the six fords' lines by that line's own distance:
    // as far along a line as it lies within FORD_NEAR metres of the nearest point of the route, its cards are whole animals
    // (four legs in stride, neck, head, horns: FORD_FRAG); beyond, a card is the knot of animals live drew (a line that nowhere
    // comes that near is knots all along). Between the two, over 40 m of the line's run, each card turns at a place of its own
    // (FORD_VERT). Same cards, same lines, same count, same size law.
    // FORD_NEAR, by the place: the route passes the fords' first line at 80 to 85 m on every seed (verify-m7b/fordnear.mjs) and goes no
    // nearer. Half as far again, at 125 m, a saiga's leg (9 cm) is under two and a half minutes of arc across and its whole body a
    // third of a degree tall: someone standing on the route there sees a moving dark shape and no longer its legs, so beyond that
    // distance from the nearest point of the route a card for a knot of animals serves, as in live.
    // (The reason would hold for any route: it is measured from wherever the route itself passes, line by line, and it names what an eye standing there can make of a leg.)
    const FORD_NEAR = 125;
    [-5 / 6, -0.5, -1 / 6, 1 / 6, 0.5, 5 / 6].forEach((f, li) => {
      let qn = -1e5;
      for (let q = fordQ.x; q <= fordQ.y; q += 2.5) { const pt = hero.arcPoint(aRamp + f * HU.uWidth.value.z + f * (q - 104) * 0.42, q, 0); if (path.distanceTo(pt.x, RIVER_Y, pt.z) < FORD_NEAR) qn = q; }
      fordNearQ.value[li] = qn;
    });
    await pause();
    // ---- THE FALLS: meltwater off every ice wedge of both walls, and the mist where it lands (FALL_VERT / FALL_FRAG, MIST_*)
    {
      const r = own('m7-falls'), pos = [], aF = [], aN = [], idx = [], mA = [], mB = [], FHW = 1.05, RS = 0.55;   // a ribbon 2.1 m across holds the threads and their spray; a row of the mesh every 0.55 m of fall
      for (const sd of [1, -1]) for (const [s0] of m7Wedges[sd]) {
        const dep = m7WallAt(sd, s0, 1, 0).depth;
        if (dep < 3) continue;   // (as the wall's own shader: no ice, no melt where the cut is under 3 m deep)
        const Lf = dep * 0.86, rows = Math.max(2, Math.round((Lf - 0.7) / RS)), base = pos.length / 3, fs = r();
        for (let j = 0; j <= rows; j++) for (const xn of [-1, 1]) {
          const h = 0.7 + (Lf - 0.7) * j / rows, pt = m7WallAt(sd, s0 + xn * FHW, h, 0.36 + 0.03 * h);
          pos.push(pt.x, pt.y, pt.z); aF.push(xn, h - 0.7, Lf - 0.7, fs); aN.push(pt.nx, pt.nz, h);
        }
        for (let j = 0; j < rows; j++) { const a = base + j * 2, b = a + 2; if (sd > 0) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b); }
        for (let k = 0; k < 6; k++) { const pt = m7WallAt(sd, s0 + (r() - 0.5) * 1.5, Lf + 0.1, 0.6 + 0.5 * r()); mA.push(pt.x, pt.y + 0.1, pt.z, 0.7 + 0.7 * r()); mB.push(r(), 0.07 + 0.08 * r(), pt.nx, pt.nz); }
      }
      const fallU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uSunDir: HU.uSunDir, uSunCol: HU.uSunCol, uSkyCol: HU.uSkyCol, uGain: GU.uGain, uLow: GU.uLow, uLitD: m7WallU.uLitD };
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(aF, 4)); g.setAttribute('aFN', new THREE.Float32BufferAttribute(aN, 3));
      g.setIndex(idx); g.computeBoundingSphere();
      const falls = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: fallU, vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide }));
      falls.name = 'falls'; falls.renderOrder = 1.5; scene.add(falls);
      const mg = new THREE.InstancedBufferGeometry(), mq = new THREE.PlaneGeometry(2, 2), nm = mA.length / 4;
      mg.setAttribute('position', mq.getAttribute('position')); mg.setIndex(mq.getIndex());
      mg.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(mA), 4)); mg.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(mB), 4));
      mg.instanceCount = nm; mg.boundingSphere = g.boundingSphere.clone(); mg.boundingSphere.radius += 6;
      const mist = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: fallU, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false, fog: true }));
      mist.name = 'falls-mist'; mist.renderOrder = 1.6; scene.add(mist);
    }
    await pause();
    // ---- THE SKY: three dozen high bands all round, on the same far shell and following the camera as live's bars do (a child of
    // that mesh: no line of update() is theirs). Each takes the clear sky's own colour behind it from the kit (sky.colorAt).
    {
      { const bp = bars.geometry.getAttribute('position'), th = new Float32Array(bp.count); for (let i = 0; i < bp.count; i += 2) { th[i] = th[i + 1] = 0.5 * Math.abs(bp.getY(i + 1) - bp.getY(i)); } bars.geometry.setAttribute('aTh', new THREE.Float32BufferAttribute(th, 1)); }
      const bands = new THREE.Mesh(bandsGeometry(own('m7-bands'), sunDir, (d, c) => sky.colorAt(d, c)), new THREE.ShaderMaterial({ uniforms: { uTime: time, uSunDir: HU.uSunDir,
        uLit: { value: C(mood.cirrus.lit).multiplyScalar(moodName === 'rose' ? 1.15 : 1) }, uShade: { value: C(mood.cirrus.shade) }, uAlpha: { value: moodName === 'rose' ? 0.8 : moodName === 'ochre' ? 0.66 : 0.6 } },
        vertexShader: BANDS_VERT, fragmentShader: BANDS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      bands.name = 'sky-bands'; bands.renderOrder = -0.89; bands.frustumCulled = false; bars.add(bands);
    }
    await pause();
    // ---- THE FORD CARDS' ANIMALS (m7b): nine numbers a card from a stream of their own, handed to the cards as one more
    // attribute (FORD_VERT's iF: a card's turning number, four sizes, three gaps, the fourth animal). Live's stream 'fords' is as live deals it.
    {
      const fg = scene.getObjectByName('fords').geometry, iF = new Float32Array(fg.instanceCount * 9), r = own('m7b-fords');
      for (let i = 0; i < iF.length; i++) iF[i] = r();
      fg.setAttribute('iF', new THREE.InstancedBufferAttribute(iF, 9));
    }
    await pause();
    // ===================================================================================================================
    // @@EXTRAS (animals and the rest are added above this line)

    const dustA = HU.uDustA.value;
    return {
      scene, path, duration: DUR,
      pace: (u) => lerp(lerp(lerp(lerp(1.2, 0.72, sstep(uTurn - 0.09, uTurn - 0.02, u)), 0.85, sstep(uTurn + 0.04, uTurn + 0.1, u)), 1.0, sstep(uGap - 0.02, uGap + 0.06, u)), 1.03, sstep(uBull, uBull + 0.06, u)),
      title: 'The Saiga River · 20,000 years ago',
      ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 22, sway: 0.6, bank: 0.15 },
      pois,
      portal: { shape: 'circle', radius: 6.2, color: '#CFE8F0', glow: 0.7, revealDistance: 260 },
      post: { exposure: mood.exposure, bloom: { strength: mood.bloom, radius: 0.6, threshold: 0.92 },
        grade: { saturation: mood.sat ?? 1.05, contrast: mood.contrast ?? 1.05, tint: mood.tint, shadowTint: mood.shadowTint, vignette: 0.22, grain: 0.02 } },
      update(dt, t, camera, u) {
        time.value = t;
        hero.setProgress(u);
        const k = 1 - sstep(uOver + 0.0, uOver + 0.07, u);
        hero.setStream(k); hero.setStreamWindow(lerp(-300, 130, sstep(uOver - 0.04, uOver + 0.07, u)), 1e5);
        hero.update(dt, t, camera);
        fordQ.z = HU.uQ.value.z; fallDust.update(dt, t, camera);
        plumeU.uPlume.value = lerp(1, 0.45, sstep(uOver, uOver + 0.1, u));
        fauna.update(dt, t, camera, u);
        // the near animals keep to us: the incoming tier's 70 m window slides down the river with the camera, and the
        // tier that threads the file stays in the lanes ahead of us (both wrap, so no animal ever changes its run)
        camera.getWorldPosition(camP);
        HU.uDustA.value = dustA * (1 - 0.7 * sstep(7, 13, camP.y)) * (1 - 0.8 * sstep(uGap - 0.07, uGap - 0.01, u));   // from above, the low dust behind the file must not veil the stream
        const camQ = Math.hypot(camP.x, camP.z - R) - R, camA = aOf(camP), q0 = Math.min(-80, Math.max(-232, camQ - 13));
        sIn.userData.uQ.x = q0; sIn.userData.uQ.y = q0 + 58;
        if (heroTier) {   // ... and when we go out over the lip its q window comes with us, so the ribbon on the ramp is made of whole animals
          heroTier.userData.uWrap.set(Math.min(0.56, Math.max(-0.56, (camA - 16 * sstep(uTurn - 0.08, uTurn + 0.04, u) * (1 - sstep(uGap - 0.05, uGap, u)) - HU.uLane.value.y) / HU.uWidth.value.y)), 0.88, 0);
          const hq = Math.min(14, Math.max(-52, camQ - 44)); heroTier.userData.uQ.x = hq; heroTier.userData.uQ.y = hq + 88;
        }
        if (horses) {   // once they have galloped clear they are gone (their baked track ends on the terrace; beyond it there is only air)
          const hv = 1 - sstep(0.19, 0.24, u);
          horses.uniforms.uVis.value *= hv; for (let i = 0; i < horseVis.length; i++) horseVis[i].value = horses.uniforms.uVis.value;
        }
        if (lions.length) {
          const rise = sstep(0.1, 0.16, u);
          for (const m of lions) m.material.uniforms.uRise.value = rise;
          HU.uRepel.value.set(lionAQ[0], lionAQ[1], lerp(5, 17, rise), 18);
        }
        if (horses && !lions.length) {   // the stream leaves a hole round the horses as they break out through its edge
          horses.positionAt(t, u, ptmp);
          HU.uRepel.value.set(aOf(ptmp), Math.hypot(ptmp.x, ptmp.z - R) - R, 14 * sstep(0.02, 0.05, u) * (1 - sstep(0.2, 0.25, u)), 28);
        }
        if (rhinoList.length) {
          const s0 = 0.5 * (u * path.length - 30), ds = dt > 1e-4 ? (s0 - rhinoPrev) / dt : 0; rhinoPrev = s0;
          rhinoMove += (sat(ds / 3) - rhinoMove) * Math.min(1, dt * 3);
          for (const m of rhinoList) {
            const s = 34 * (1 - Math.exp(-Math.max(0, s0 + 6) / 34)) - 6 + m.userData.back, x = rhinoS.x + rhinoDir.x * s + rhinoDir.z * m.userData.left, z = rhinoS.z + rhinoDir.z * s - rhinoDir.x * m.userData.left;
            m.position.set(x, land(x, z), z); m.material.uniforms.uGait.value = s * 3.7; m.material.uniforms.uMove.value = rhinoMove * Math.exp(-Math.max(0, s0 + 6) / 34);
          }
          if (!lions.length) { const m = rhinoList[0]; HU.uRepel.value.set(aOf(m.position), Math.hypot(m.position.x, m.position.z - R) - R, 5, 8); }
        }
        // the raven we ride: everything carried with the camera is this one group
        rider.visible = u > 0 && !ctx.through;
        rider.matrix.copy(camera.matrixWorld); rider.matrixWorldNeedsUpdate = true;
        // It glides with nothing of itself in the picture; every 3.6 s it rows for a second and a half, and then the five
        // primaries of each wingtip sweep up into the lower corners and the nape lifts into the bottom edge (0 = wingtips forward).
        const bd = Math.abs(((u - 0.205) / 0.09 + 0.5) % 1 + 1) % 1 - 0.5, flapR = 0 * bd;   // (polish 3) it never lifts into the frame: outside reviewers read the nape and wingtips as cut-off shapes
        const beatR = 0.5 + 0.5 * Math.cos(t * TAU * 2.7 + u * 180);
        riderBird.position.y = -0.86 - 1.3 * (1 - flapR);
        for (const h of hands) { h.position.y = -1.02 - 1.9 * (1 - flapR); h.rotation.set(0.14 - lerp(0.3, 0.95 * beatR, flapR), h.userData.side * (0.1 + 0.12 * beatR * flapR), -h.userData.side * 0.15 * beatR * flapR); }
        // its mate: ahead and to the left on the same line, flapping and gliding; one half-roll at u 0.5
        for (const b of birds) {   // near the ring they peel away up and outward over the rim (they never cross the portal ahead of us)
          const off = sstep(0.83, 0.95, u), md = u * path.length + b.ahead + 5 * off;
          path.posAtDist(md, mP); path.tangentAtDist(md, mT); mT.normalize();
          path.tangentAtDist(md + 6, mX); const turn = mT.x * mX.z - mT.z * mX.x; b.bank += (sat(Math.abs(turn) * 6) * Math.sign(turn) * -0.5 - b.bank) * Math.min(1, dt * 2.5);
          mX.crossVectors(UP, mT).normalize(); mY.crossVectors(mT, mX);
          mP.addScaledVector(mX, b.lat + Math.sign(b.lat) * 28 * off + 0.35 * Math.sin(t * 0.6 + b.ph)); mP.y += b.up + 13 * off + 0.25 * Math.sin(t * 0.9 + b.ph) + 0.1 * Math.sin(t * 2.3 + b.ph);
          const rk = b.rolls * Math.sin(Math.PI * sat((u - (uTurn + 0.115)) / 0.045)), roll = Math.PI * rk * rk + b.bank, cr = Math.cos(roll), sr = Math.sin(roll);
          ptmp.copy(mX).multiplyScalar(cr).addScaledVector(mY, sr); mY.multiplyScalar(cr).addScaledVector(mX, -sr); mX.copy(ptmp);
          b.mesh.matrix.makeBasis(mX, mY, mT).scale(mS).setPosition(mP); b.mesh.matrixWorldNeedsUpdate = true;
          b.mat.uniforms.uFlap.value = t * TAU * 3.3 + b.ph; b.mat.uniforms.uAmp.value = sstep(-0.3, 0.2, Math.sin(t * 0.8 + b.ph * 1.25)) * (1 - rk * rk);
        }
        sky.update(dt, t, camera); ridges.update(dt, t, camera);
        camera.getWorldPosition(bars.position);
        motes.setOpacity(0.5 * (1 - sstep(0.84, 0.9, u)) * (1 - sstep(12, 24, camQ)));   // the fluff rides at terrace height: none of it over the gully, where it would speck the sky
        motes.update(dt, t, camera);
      },
      dispose() { sky.dispose(); },
    };
  },
};

// ---------------------------------------------------------------------------------------------------------
// THE LAND's shader: loess terrace netted with frost polygons (fescue bunches, sage, flower specks, the trodden trail and
// the lanes the stream has beaten), bare bluff and slump ramp, the braided river (bars, willow mats, shining channels),
// and the thaw gully (frozen silt, ice wedges that drip, silt mounds and meltwater threads). Self-lit like the hero.
const GROUND_VERT = /* glsl */`
attribute vec3 aGully;
varying vec3 vWorld, vN, vG;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vN = normal; vG = aGully;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const GLSL_GN = /* glsl */`
float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 gh2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gh(i), gh(i + vec2(1., 0.)), f.x), mix(gh(i + vec2(0., 1.)), gh(i + vec2(1., 1.)), f.x), f.y); }
`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uLoess, uGrass, uSage, uPoppy, uSilt, uIce, uWater, uGravel, uWillow, uRose;
uniform vec4 uArc, uLane, uRiver, uRamp; uniform vec4 uPond[NP]; uniform vec3 uWidth, uTroughC, uPondDeep; uniform float uTime, uLow, uStream, uGain, uTroughK;
uniform vec3 uSkyHor, uSkyZen, uScatC, uCirLit;   // (m7) this look's own sky (horizon, zenith, the wash round the sun, a lit band), for what still water mirrors
varying vec3 vWorld, vN, vG;
#include <fog_pars_fragment>
${GLSL_GN}
${CLOUD_GLSL}
${RIVER_GLSL}
vec2 gMr = vec2(0.);   // set by voro: from the point to its cell's centre, in cell units
vec2 gEn = vec2(0., 1.);   // (m7) set by voro: the unit normal of the nearest cell edge (the same line from either side of it, up to its sign)
vec3 voro(vec2 x){   // x: distance to the nearest cell edge, y: cell id, z: distance to the cell centre
  vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){ vec2 g = vec2(float(i), float(j)), o = gh2(n + g) * .7 + .15, r = g + o - f; float d = dot(r, r); if(d < md){ md = d; mr = r; mg = g; } }
  float ed = 8.;
  for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++){ vec2 g = mg + vec2(float(i), float(j)), o = gh2(n + g) * .7 + .15, r = g + o - f; vec2 dr = r - mr; float l2 = dot(dr, dr); if(l2 > 1e-5){ vec2 en = dr / sqrt(l2); float e = dot(.5 * (mr + r), en); if(e < ed){ ed = e; gEn = en; } } }
  gMr = mr; return vec3(ed, gh(n + mg), sqrt(md));
}
void main(){
  vec2 p = vWorld.xz; vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float dist = length(cameraPosition - vWorld), near = 1. - smoothstep(30., 140., dist), mid = 1. - smoothstep(120., 420., dist);
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float q = length(p - vec2(0., uArc.x)) - uArc.x, dB = length(p - uRiver.xy) - uRiver.z;
  float steep = smoothstep(.02, .15, 1. - N.y);
  float n1 = gn(p * .9), n2 = gn(p * 3.7 + 11.), n3 = gn(p * .13 + 3.);
  // ---- the terrace
  vec3 poly = voro(p / 13.5 + .3 * vec2(gn(p * .05), gn(p * .05 + 7.)) + .13 * vec2(gn(p * .17 + 3.), gn(p * .17 + 9.)) + .04 * vec2(gn(p * .55 + 13.), gn(p * .55 + 1.))); vec2 pMr = gMr, pEn = gEn;
  // (polish m4) the sedge of a trough grows in clumps: its belt swells, thins and breaks along the trough, with a ragged edge
  float tvar = smoothstep(.25, .7, gn(p * .075 + 41.) * .65 + gn(p * .31 + 5.) * .35);
  float trough = (1. - smoothstep(.02 + .02 * tvar, .06 + .11 * tvar, poly.x + .03 * (n1 - .5) + .035 * (gn(p * .43 + 7.) - .5))) * (.45 + .55 * tvar);
  float tn = gn(p * 2.3) * .45 + gn(p * 5.9 + 3.) * .33 + gn(p * 13. + 9.) * .22, tuft = smoothstep(.5, .6, tn) * (.6 + .4 * gn(p * 23.));
  float sage = smoothstep(.62, .7, gn(p * 2.9 + 31.) * .6 + gn(p * 8.1 + 5.) * .4) * smoothstep(.45, .6, n3) * (1. - tuft);
  vec3 cv = voro(p * 1.3 + 40. + .5 * vec2(n2, n1)); vec2 hMr = gMr; float crack = (1. - smoothstep(.0, .035, cv.x)) * near * smoothstep(.3, .6, n1) * .6;
  vec3 c = uLoess * (.8 + .3 * n3 + .12 * n1) * (1. - .35 * crack);
  vec3 grass = mix(uGrass, uLoess, .25) * (.55 + .5 * n2 + .4 * tuft) * mix(vec3(1.), vec3(.75, 1.05, .7), trough);
  float cover = mix(.5 + .25 * trough, tuft * (.85 + .15 * n2) + trough * .45, near);
  c = mix(c, grass, clamp(cover, 0., 1.));
  c = mix(c, mix(uSage, uGrass, .4) * (.5 + .3 * n2), sage * mix(.4, .85, near));
  // three tones: pale raised polygon centres, grey sage in drifts 30 m across, dark sedge-green troughs
  float drift = smoothstep(.5, .68, gn(p * .033 + 17.) * .7 + .3 * n3);
  c = mix(c, uSage * (.62 + .2 * n2), drift * .5);
  c *= 1. + .08 * smoothstep(.2, .5, poly.x) * (1. - drift);
  c = mix(c, uTroughC * (.7 + .4 * n2), trough * uTroughK);
  // (m7) A FINER SECOND SCALE INSIDE THE NET. At a grazing angle the sedge belts of the troughs ran together into broad dark bands
  // and the polygon centres lay as large flat tiles. The belt is now tussocks (clumps a hand to a stride across: darker hearts,
  // paler gaps, the same mean tone), and second-order frost cracks 3 to 5 m apart net each polygon's centre in thin sedge lines.
  // (Mend 2) the first m7's tussocks were a smooth noise and did not show. Now the belt is broken into sharp-edged patches a
  // stride to a few metres across (dark wet sedge hollows, pale dry cotton-sedge tops: 1.3 and .64 of the belt's tone, the same
  // mean) and, within some 100 m, into single tussocks (the 0.8 m cells of the hummock net, each its own tone, a dark gap round
  // it). From 260 m on the belt is live's. The straight distance from the eye (dist): a 2 m patch is seen under half a degree
  // across beyond 260 m and a 0.8 m tussock beyond 100 m; there they merge into the belt's own tone.
  float tus = smoothstep(.32, .64, tn), fineK = 1. - smoothstep(90., 260., dist);
  float tpat = smoothstep(.44, .56, gn(p * .33 + 7.) * .55 + gn(p * 1.1 + 2.) * .45);
  c *= mix(1., mix(1.3, .64, tpat) * mix(1., (.8 + .4 * cv.y) * (1. - .28 * (1. - smoothstep(.0, .1, cv.x))), 1. - smoothstep(40., 100., dist)), trough * fineK);
  float sec = (1. - smoothstep(.0, .035 + dist * .0006, abs(gn(p * .27 + 19.) + .12 * (gn(p * 1.7 + 3.) - .5) - .5))) * smoothstep(.1, .2, poly.x) * (1. - smoothstep(110., 260., dist));
  c = mix(c, uTroughC * (.62 + .5 * n2), sec * uTroughK * .7 * (.4 + .6 * tus));
  vec3 fv = voro(p * 2.9 + 90.); float fl = (1. - smoothstep(.03, .07, fv.z)) * near * step(.72, fv.y) * (1. - sage);
  c = mix(c, fv.y > .9 ? vec3(.3, .14, .5) : (trough > .5 ? vec3(.8) : uPoppy), fl);
  // thaw ponds: water inside a wobbling outline, wet dark silt at the edge, a margin of sedge round it
  float dz = uArc.x - p.y; if(abs(dz) < 1e-3) dz = 1e-3; float a = atan(p.x, dz) * uArc.x;
  float pond = 0., pring = 0., pdepP = 0., pwet = 0.;
  for(int i = 0; i < NP; i++){
    vec4 pd = uPond[i]; float d = length(p - pd.xy) / max(pd.z, 1.) + .36 * (gn(p * .15 + pd.w) - .5) + .08 * (n1 - .5);
    // (m7) the pool lies IN the ground: its bed shelves in from the waterline over the outer third (live: one tenth, a rim), and a
    // band of wet silt as wide again lies outside the water, under the sedge
    pond = max(pond, 1. - smoothstep(.84, .88, d)); pring = max(pring, 1. - smoothstep(.9, 1.3, d)); pdepP = max(pdepP, 1. - smoothstep(.56, .87, d)); pwet = max(pwet, 1. - smoothstep(.87, 1.04, d + .05 * (n2 - .5)));
  }
  float wetT = smoothstep(.47, .6, gn(p * .019 + 3.) * .7 + gn(p * .06 + 11.) * .3) * (1. - smoothstep(-12., -4., dB)) * (1. - smoothstep(.1, .5, vG.x)) * (1. - smoothstep(15., 21., q) * (1. - smoothstep(44., 60., abs(a - uRamp.x))));
  float tedge = poly.x + .014 * (n1 - .5) + .01 * (n2 - .5);
  float twn = gn(p * .045 + 5.) * .7 + gn(p * .16 + 2.) * .3, twid = (.022 + .03 * smoothstep(.3, .6, twn) + .08 * smoothstep(.62, .8, twn)) * smoothstep(.2, .36, gn(p * .028 + 21.));
  float tw = (1. - smoothstep(twid * .5, twid + .008, tedge)) * wetT * step(.004, twid), tm = (1. - smoothstep(twid + .015, twid + .04 + .09 * tvar, tedge + .02 * (n2 - .5))) * wetT * (.5 + .5 * smoothstep(.3, .55, tn)), pondR = pond;
  float pdep = mix(1. - smoothstep(0., 1., tedge / max(twid, 1e-3)), pdepP, pondR);   // 0 at the waterline .. 1 where it is a hand deep
  pring = max(pring, tm * .9); pond = max(pond, tw);
  c = mix(c, vec3(.2, .27, .1) * (.6 + .7 * n2 + .6 * tuft), pring * .92);
  c = mix(c, uSilt * 1.5, smoothstep(.86, 1., pring) * (1. - pond) * .6);
  // (m7) wet dark silt at every water's edge: a band round the pools, a line along each running thread
  float twet = (1. - smoothstep(twid + .004, twid + .02, tedge + .006 * (n2 - .5))) * wetT * step(.004, twid);
  c = mix(c, uSilt * 1.3 * (.8 + .4 * n2), max(pwet, twet) * (1. - pond) * .78);
  float trail = (1. - smoothstep(1.2, 3.6, abs(q))) * (.6 + .4 * n1);
  float k1 = smoothstep(-110., -12., q), k2 = smoothstep(6., 38., q), ac = mix(mix(uLane.x, uLane.y, k1), uLane.z, k2), w = mix(mix(uWidth.x, uWidth.y, k1), uWidth.z, k2);
  float ln = (a - ac) / max(w, 1.), inS = (1. - smoothstep(.85, 1.1, abs(ln))) * smoothstep(-330., -250., q);
  float beaten = inS * (.25 + .5 * smoothstep(.3, .7, gn(p * .31 + 5.) * .6 + n1 * .4)) * mid;   // trampled patches (polish 3: the lanes were noise stretched 60:1 and read as a smeared texture)
  float hoof = (1. - smoothstep(.05, .1 + .08 * fract(fv.y * 31.), fv.z)) * step(fv.y, .34) * inS * (1. - smoothstep(10., 34., dist));
  float stone = (1. - smoothstep(.1, .2 + .1 * fract(fv.y * 17.), fv.z)) * step(.86, fract(fv.y * 7.3)) * (1. - smoothstep(14., 46., dist)) * (1. - sage) * (1. - tuft);
  c = mix(c, uLoess * .62, trail * .55);
  c = mix(c, uLoess * (.95 + .2 * n2), beaten * .6);
  c *= 1. - .42 * hoof;
  c = mix(c, uGravel * (.9 + .5 * fract(fv.y * 53.)), stone * .8);
  // ---- bare faces: the bluff, the slump ramp churned by hooves
  float rampTop = smoothstep(uRamp.y - 4., uRamp.y + 10., q);
  vec3 face = uLoess * (.6 + .25 * gn(vec2(vWorld.y * 1.7, (p.x + p.y) * .05)) + .2 * gn(vec2((p.x - p.y) * .9, vWorld.y * .25)));
  face = mix(face, uSilt * 1.7, .4 * smoothstep(.45, .75, gn(vec2(vWorld.y * .6 + 3., (p.x + p.y) * .02))));
  face *= (.74 + .5 * gn(p * 1.1 + 3.)) * (1. - .35 * (1. - smoothstep(.06, .28, cv.z)) * near);
  float bare = max(max(steep, rampTop * max(inS, steep)), max(smoothstep(-5., 1., dB), rampTop * (1. - smoothstep(40., 58., abs(a - uRamp.x)))));   // nothing of the terrace's net on the slump or below the bluff
  float churn = gn(p * 1.3 + 2.) * .45 + gn(p * 3.3 + 7.) * .33 + gn(p * 7.9) * .22;   // clods and scuffs, no streaks
  float bench = smoothstep(.5, .66, gn(vec2(ln * 2.6 + 9., q * .19 + 1.7 * gn(p * .07))));
  float rampM = 1. - smoothstep(38., 56., abs(a - uRamp.x) + 5. * (n1 - .5));
  // (polish m4) terracettes: slumped steps along the contour, warped, each dying out after a few metres; a few runnels wander down the slope
  float tq = q * .55 + 2.4 * gn(p * .06 + 2.) + .9 * gn(p * .21) + .25 * gn(p * .9), tfr = fract(tq), riser = smoothstep(.7, .93, tfr) * (1. - smoothstep(.93, 1., tfr)) * smoothstep(.3, .55, gn(p * .1 + 17.) * .6 + gn(vec2(a * .31, q * .09)) * .4);
  float rn = gn(vec2(a * .085 + .3 * gn(p * .2), q * .022) + 5.), runnel = (1. - smoothstep(.0, .035 + .02 * n1, abs(rn - .5))) * smoothstep(.45, .7, gn(vec2(a * .04 + 3., q * .03)));
  float clod = smoothstep(.55, .75, gn(p * 4.1 + 1.) * .6 + gn(p * 9.3) * .4) * near;
  vec3 rampC = mix((uLoess * .66 + uSilt * .4) * vec3(.9, .9, 1.08), uLoess * 1.08, smoothstep(.3, .7, churn)) * (1. - .2 * bench) * (1. - .16 * (1. - smoothstep(.08, .3, cv.z)) * near) * (1. - .2 * hoof);
  rampC *= (1. - .34 * riser) * (1. + .12 * smoothstep(.1, .6, tfr) * (1. - riser)) * (1. - .3 * runnel) * (1. - .22 * clod) * mix(.9, 1.04, inS);
  rampC *= (1. - .3 * (1. - smoothstep(.0, .05, cv.x)) * (1. - smoothstep(8., 34., dist))) * (1. - .28 * hoof);   // mud cracks and hoof pits, sharp where we skim it
  rampC = mix(rampC, uGrass * vec3(.5, .56, .3) * (.7 + .6 * n2), smoothstep(.6, .72, tn) * (1. - inS) * .7 * step(.5, tfr));   // sedge has taken the treads outside the beaten lane
  // (m7) DETAIL OF A FINER SCALE INSIDE THE BIG FORMS of the slump and the bluff, where the lens passes close: clods and scuffs a
  // hand to a forearm across over the whole ramp (live's fine marks ended 8 to 34 m from the eye and the slope beyond lay smooth),
  // stones thawed out of it; on the steep faces the grain is laid on the face itself (by height and along it), so nothing drawn
  // on the ground plan is dragged down the bank.
  float rfk = 1. - smoothstep(90., 220., dist);   // (the straight distance from the eye: a clod a forearm across is under a tenth of a degree beyond 220 m)
  rampC *= mix(1., .68 + .64 * smoothstep(.3, .7, tn), rfk) * mix(1., .86 + .28 * gn(p * 6.7 + 13.), near);
  rampC = mix(rampC, uGravel * (.8 + .6 * fract(fv.y * 53.)), (1. - smoothstep(.08, .2 + .1 * fract(fv.y * 17.), fv.z)) * step(.8, fract(fv.y * 7.3)) * (1. - smoothstep(18., 60., dist)) * .7);
  // (m7c) THE SLUMP IS CRACKED GROUND. A thaw slump moves as blocks: plates of silt 2 to 4 m across with a dark fissure round every one,
  // and the fissure is what says that the ground has broken. A plate's own tone lies within .985 to 1.015 of the ramp's and its own tilt
  // (in the RELIEF below) is about a sixtieth of a degree at the most: under the sun of any of the three looks two plates differ across
  // their shared edge by no more than four hundredths of the ramp's lit tone. PLATES LIE ON A SLOPE: the whole block term goes with the
  // ground's own slope by the mesh's normal (N here, before any painted relief): none of it under 4 degrees, all of it from 9 (.0698, .1564: their sines). To 330 m of straight distance from the eye (from 140 m it weakens: a 3 m block is under half a degree across at 330 m). The figures: verify-m7c/tiltlaw.mjs, slump.mjs.
  float blkK = bare * rampTop * rampM * (1. - smoothstep(140., 330., dist)) * (.3 + .7 * smoothstep(.3, .62, gn(p * .045 + 31.))) * smoothstep(.0698, .1564, length(N.xz)), blkFis = 0.; vec2 blkTilt = vec2(0.);   // (broken tracts some 20 to 40 m across among ground that has slid whole: a slump is not broken evenly)
  if(blkK > .01){
    vec3 bv = voro(p / 2.9 + 60. + .3 * vec2(gn(p * .21 + 4.), gn(p * .21 + 9.)));
    blkFis = (1. - smoothstep(.0, .035 + dist * .0006, bv.x)) * (.5 + .5 * smoothstep(.2, .6, gn(p * .4 + bv.y * 9.)));
    blkTilt = (vec2(fract(bv.y * 17.3), fract(bv.y * 41.7)) - .5) * 2.;
    rampC *= mix(1., (.985 + .03 * bv.y) * (1. - .5 * blkFis), blkK);
  }
  vec2 tw3 = vec2(N.x * N.x, N.z * N.z) / max(N.x * N.x + N.z * N.z, 1e-4);
  float fcl = tw3.x * (gn(vec2(p.y * 2.3, vWorld.y * 3.1)) * .6 + gn(vec2(p.y * 5.9 + 3., vWorld.y * 7.3)) * .4) + tw3.y * (gn(vec2(p.x * 2.3, vWorld.y * 3.1) + 5.) * .6 + gn(vec2(p.x * 5.9 + 8., vWorld.y * 7.3)) * .4);
  face *= mix(1., .7 + .6 * fcl, steep * rfk);
  c = mix(c, mix(face, rampC, rampTop * rampM), bare);
  // ---- the braided river
  float riv = (1. - smoothstep(uRiver.w + 1.1, uRiver.w + 2.4, vWorld.y)) * step(0., dB), water = 0., rivCh = 1., wetRim = 0.; vec2 barBump = vec2(0.);
  if(riv > 0.){
    float bx = p.x - uRiver.x, bz = -(p.y - uRiver.y); if(abs(bz) < 1e-3) bz = 1e-3;
    vec2 rp = vec2(atan(bx, bz) * uRiver.z, dB);
    float wv = gn(rp * vec2(.004, .012)) * 2. - 1., wv2 = gn(rp * vec2(.011, .03) + 7.) * 2. - 1.;
    float ch1 = abs(sin(dB * .047 + wv * 2.6 + wv2 * .9 + rp.x * .004)), ch2 = abs(sin(dB * .027 - rp.x * .019 + wv2 * 2.4 + 1.7)), ch3 = abs(sin(dB * .021 + rp.x * .013 + wv * 3.1 + 4.));
    float ch = min(ch1, min(ch2, ch3) + .1);
    rivCh = ch + .25 * (gn(rp * vec2(.02, .07)) - .5);   // (m7: live's own value, named) under .36 to .44 open water; it falls toward mid channel
    water = (1. - smoothstep(.36, .44, rivCh)) * smoothstep(6., 16., dB);
    vec3 bar = uGravel * (.7 + .5 * n2 * near + .3 * gn(rp * vec2(.03, .1)));
    // LIVE'S WILLOW, letter for letter: mats along the waterlines of the bars and of the near shore, in live's own colour and amount
    // (Mend 2: the first m7 moved the willow 2 to 5 m in from the water and laid a wet rim where it had stood; wherever a bar
    // is narrow that took the willow away)
    float wlive = smoothstep(.5, .66, gn(rp * vec2(.035, .08) + 3.)) * (1. - smoothstep(.44, .7, ch)) * .8;
    bar = mix(bar, uWillow * (.5 + .5 * n1) * mix(1., .75 + .5 * tn, near), wlive);   // (m7: near the lens the mat is leaves and twigs, the same mean tone)
    // (m7) MORE WILLOW, further in on the broad bars: ragged clumps 4 to 13 m across with silt between, from 2 m inside the
    // waterline (METRES IN FROM THE WATERLINE: the braid value above the waterline over its own slope, a metre to either side)
    float wcl = smoothstep(.36, .6, gn(p * .075 + 9.) * .5 + gn(p * .23 + 9.) * .3 + tn * .2);
    float dBa, dBb; vec2 rgr = vec2(riverChv(p + vec2(1., 0.), dBa), riverChv(p + vec2(0., 1.), dBb)) - rivCh;
    float mIn = max(rivCh - .44, 0.) / max(length(rgr), .004);
    float wmat = smoothstep(.42, .6, gn(rp * vec2(.035, .08) + 3.) + .08 * (n1 - .5) + .2 * (gn(p * .09 + 5.) - .5)) * (1. - smoothstep(.52, .8, ch)) * smoothstep(2., 5., mIn);
    bar = mix(bar, uWillow * (.5 + .5 * n1) * (.62 + .7 * tn) * (.85 + .5 * smoothstep(.5, .8, gn(p * .6 + 2.))), wmat * (.1 + .9 * wcl) * .9 * (1. - wlive * 1.25));
    // (Mend 2) THE WET MARGIN of every channel, .6 to 2.6 m wide, only where no willow stands at the water: looked down into it is
    // dark wet silt; looked along it mirrors the sky as the water beside it does (wetRim, below), so from afar a bar has no dark
    // ring round it. (The first m7's pale dry crest is gone: it paled live's gravel.)
    wetRim = (1. - smoothstep(.6, 2.6, mIn)) * smoothstep(6., 16., dB) * (1. - wlive * 1.25);
    bar *= 1. - .4 * wetRim * (.7 + .3 * n1) * clamp(V.y * 2.5, 0., 1.);
    // (Mend 2) THE BARS HAVE FORM: low scroll ridges and chutes 5 to 16 m apart lying along the flow, a hand to a forearm high.
    // Flat, a bar under a sun 3 to 11 degrees up takes almost no light and lies on the bright water as a dark flat shape; with
    // its own relief (barBump, added to the normal in the RELIEF below) the faces toward the sun are lit and those away from
    // it shaded. In the bank circle's own frame: rp = (metres along the bank, metres out from it).
    { vec2 rh = normalize(p - uRiver.xy + vec2(1e-4, 0.)), th = vec2(-rh.y, rh.x);
      float b0 = gn(rp * vec2(.06, .19) + 11.) * .65 + gn(rp * vec2(.17, .45) + 3.) * .35, b1 = gn((rp + vec2(1.2, 0.)) * vec2(.06, .19) + 11.) * .65 + gn((rp + vec2(1.2, 0.)) * vec2(.17, .45) + 3.) * .35, b2 = gn((rp + vec2(0., .5)) * vec2(.06, .19) + 11.) * .65 + gn((rp + vec2(0., .5)) * vec2(.17, .45) + 3.) * .35;
      barBump = (th * (b1 - b0) / 1.2 + rh * (b2 - b0) / .5) * .8 * (1. - water) * smoothstep(6., 16., dB) * (1. - smoothstep(500., 900., dist)); }   // (slopes to some 15 degrees; gone by 900 m of straight distance, where a 5 m ridge is a third of a degree across)
    bar = mix(bar, uLoess * .9, inS * (1. - smoothstep(60., 140., dB)) * .5);   // the beaten fan at the foot of the ramp
    c = mix(c, bar, riv);
  }
  // ---- the thaw gully: a cut bank of frozen ground. vG = (depth below the rim here, metres along it, metres across it)
  float gd = vG.x, gs = vG.y, glat = vG.z, inG = smoothstep(.25, 1.4, gd), gwall = 0., thread = 0., tf = 1.;
  if(inG > 0.){
    // the walls seen are their own ribbons (WALL_FRAG); this heightfield wall stands behind them, plain dark silt
    float wall = smoothstep(.5, .8, 1. - N.y) * max(smoothstep(8., 11., abs(glat)), smoothstep(84., 87., gs)); gwall = wall;   // only the cut banks (polish 3: a silt mound's steeper side took the wall's dark tone and read as a shapeless dark mass in the stream)
    if(wall > .6 && gd > 1.5) discard;   // (hidden behind the ribbons; its stretched cells must never poke through them)
    vec3 wc = uSilt * (1.3 + .8 * gn(vec2(gs * .9, vWorld.y * 2.3)));
    wc = mix(mix(vec3(.4, .27, .16), uLoess * .7, n1) * (.75 + .5 * n2), wc, smoothstep(1.6, 4.5, gd));   // (polish m3) where the cut is still shallow its bank is thawed brown soil in the sun (it stood there as a grey slab)
    // the floor: silt mounds, and three or four thin dark threads of meltwater with a pale glint, leading to the ring
    float cl = 2.4 * sin(gs * .1) + 1.3 * sin(gs * .27 + 1.), hw = 3.2 + 1.3 * sin(gs * .17 + 2.);   // the stream's middle and half-width here
    float sd = abs(glat - cl) + 1.2 * (gn(vec2(gs * .45, glat * .7)) - .5), bars = smoothstep(.6, .68, gn(vec2(gs * .16 + 3., glat * .45 + 5.)));
    thread = (1. - smoothstep(hw - .3, hw, sd)) * (1. - bars * smoothstep(.2, .5, sd / max(hw, .5) + .3)) * (1. - wall) * smoothstep(1.2, 3.5, gd);
    tf = sd / max(hw, .5);
    float damp = (1. - smoothstep(hw, hw + 1.8, sd)) * (1. - wall) * (1. - .85 * thread);
    // (polish 3) the floor read as a dark shapeless mass: paler drying silt broken into mud-crack plates, cobbles thawed out of
    // the banks, and a margin of sedge with white cotton heads along the stream
    // (polish m3) the floor: warm slumped silt in mounds and mud plates (no grey noise), wet and dark toward the water, mossy
    // sedge in ragged drifts along the stream and in patches under the banks, cotton heads, cobbles thawed out of the walls;
    // the stream itself is DARK open water between pale silt bars, carrying the sky and the sun's sparkle to the ring
    float mud = 1. - smoothstep(.0, .06, cv.x);
    float mnd = gn(vec2(gs * .23, glat * .31) + 3.) * .6 + gn(vec2(gs * .61, glat * .8)) * .4;
    vec3 fc = mix(uSilt * 2.3 * vec3(1.08, 1., .9), uLoess * .7, clamp(.2 + .75 * mnd + .2 * (n2 - .5), 0., 1.)) * (.8 + .4 * cv.y) * (1. - .34 * mud);
    fc = mix(fc, uSilt * 1.25, damp * .7);                                                    // wet silt at the water's edge
    float barM = bars * (1. - smoothstep(hw - .1, hw + .4, sd));
    fc = mix(fc, mix(uLoess * .8, uGravel * 1.1, n2) * (1. - .3 * mud), barM * (1. - wall) * .85);   // the bars: pale washed silt and gravel
    float peb = (1. - smoothstep(.1, .22, fv.z)) * step(.62, fv.y);
    fc = mix(fc, uGravel * (.8 + .7 * fv.y), peb * .75);
    float sdn = sd + 1.4 * (gn(vec2(gs * .5 + 9., glat * .6)) - .5);
    float sedge = max((1. - smoothstep(hw + .3, hw + 3.2, sdn)) * smoothstep(hw - .6, hw + .3, sdn), .8 * smoothstep(.56, .7, gn(vec2(gs * .19 + 2., glat * .27 + 7.)))) * (1. - wall) * smoothstep(.22, .5, tn);
    fc = mix(fc, mix(vec3(.15, .2, .08), vec3(.3, .33, .12), n2) * (.7 + .6 * tuft), sedge * .85 * (.45 + .55 * smoothstep(.3, .6, gn(p * 1.1 + 4.))));
    fc = mix(fc, vec3(.8, .8, .76), (1. - smoothstep(.05, .11, fv.z)) * step(fv.y, .3) * sedge);
    c = mix(c, mix(fc, wc, wall), inG);
  }
  // ---- light
  float cs = cloudShade(p, uTime);
  // in the gully the sun reaches only the top of the walls (the low looks: the top metre, lit rose); the rest is open
  // shade filled by the sky above and by the pale rim, and it never goes black
  float gShade = inG * mix(smoothstep(.8, 3.0, gd) * .8, smoothstep(1.0, 3.0, gd), uLow);
  float sunVis = (1. - .64 * cs) * (1. - gShade);
  { // RELIEF (polish 3). Three scales, all sharp-edged, so a low sun rakes the ground into light and shade and nothing reads
    // as a smeared texture: frost hummocks 0.8 m across with a crack round each (near), the banks of the polygon troughs
    // (out to the middle distance), and a little broad swell. Hoof prints are pits.
    float open = (1. - inG) * (1. - riv) * (1. - pond);
    float e = .3, bk = (1. - smoothstep(50., 200., dist)) * open * ((.13 + .08 * uLow) * (1. - .7 * rampTop) + .15 * rampTop * rampM);
    vec2 pa = p * .8, pb = p * 2.6 + 5.;
    float hA = gn(pa) * .6 + gn(pb) * .4, hB = gn(pa + vec2(e * .8, 0.)) * .6 + gn(pb + vec2(e * 2.6, 0.)) * .4, hC = gn(pa + vec2(0., e * .8)) * .6 + gn(pb + vec2(0., e * 2.6)) * .4;
    vec2 hd = -hMr / max(length(hMr), 1e-3), td = -pMr / max(length(pMr), 1e-3);
    float hf = (1. - smoothstep(16., 70., dist)) * max(open, inG * (1. - gwall) * (1. - thread)) * (1. - .5 * bare), bareP = smoothstep(.3, .62, gn(p * .11 + 9.) * .65 + n3 * .35), hs = (1. - smoothstep(.0, .15, cv.x)) * hf * (.13 + .08 * uLow) * (.25 + .75 * bareP) * (.6 + .8 * n1) * (1. - .8 * bare * (1. - .7 * rampTop * rampM));
    float tfk = (1. - smoothstep(120., 420., dist)) * open * (1. - bare), ts = smoothstep(.0, .025, poly.x) * (1. - smoothstep(.03, .16, poly.x)) * tfk * (.3 + .2 * uLow);
    N = normalize(N - vec3(hB - hA, 0., hC - hA) * (bk / e) + vec3(hd.x, 0., hd.y) * hs + vec3(td.x, 0., td.y) * ts
      - vec3(barBump.x, 0., barBump.y) * riv + vec3(blkTilt.x, 0., blkTilt.y) * .0002 * blkK);   // (Mend 2) the bars' scroll ridges; each block of the slump tilted its own way
    c *= 1. - .2 * (1. - smoothstep(.0, .03, cv.x)) * hf * (1. - inS * .5) * (.2 + .8 * bareP) * (1. - .8 * bare); }
  float ndl = max(dot(N, uSunDir), 0.), back = max(0., -dot(V, uSunDir)), graze = 1. - abs(V.y);
  ndl = mix(ndl, max(ndl, .55), inG * gwall * step(.05, dot(N, uSunDir)) * (1. - smoothstep(.6, 2.6, gd)));                              // the lit lip of the cut
  vec3 fill = uSkyCol * (.3 + .08 * N.y) * (1. + 1.2 * inG);
  vec3 lit = c * (fill + uSunCol * sunVis * uGain * (.1 * uLow + .62 * ndl + .2 * back * back * graze * graze * uLow));
  if(thread > 0.){   // the stream mirrors the sky, and the bright sky round the sun even where the sun itself is behind the wall
    vec2 rip = vec2(gn(vec2(gs * 1.1 - uTime * .9, glat * 2.3)), gn(vec2(gs * 1.7 - uTime * 1.3, glat * 3.1 + 4.))) - .5;
    vec3 Rr = reflect(-V, normalize(vec3(rip.x * .12, 1., rip.y * .12)));
    float fres = 1. - max(V.y, 0.); fres *= fres;
    float sp = max(dot(Rr, normalize(vec3(uSunDir.x, max(uSunDir.y, .25), uSunDir.z))), 0.), sp2 = sp * sp; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2;
    float shal = smoothstep(.55, 1., tf);                                                     // shallow over the silt at its edges
    vec3 deepC = mix(uPondDeep * .55, lit * vec3(.6, .7, .8), .18 + .5 * shal);
    float spk = smoothstep(.8, .93, gn(vec2(gs * 4.3 - uTime * 2.6, glat * 6.1)) * .6 + gn(vec2(gs * 9.1 - uTime * 4., glat * 11.) + 3.) * .4);
    vec3 wc2 = mix(deepC, mix(uPondDeep * 1.5, uWater * .5 + uSunCol * .02, sp * sp), fres * .4) * (.86 + .34 * rip.x)
      + uSunCol * (sp2 * sp2 * .025 + .6 * spk * (.25 + .75 * sp * sp)) * (1. - .6 * shal);
    lit = mix(lit, wc2, thread);
  }
  lit += uSunCol * uGrass * tuft * near * .08 * back * (1. - bare) * (1. - riv) * (1. - inG) * sunVis;
  if(water > 0.){
    vec2 rip = vec2(gn(p * .7 + uTime * vec2(.5, .2)), gn(p * .9 - uTime * vec2(.3, .4))) - .5;
    vec3 Rr = reflect(-V, normalize(vec3(rip.x * .16, 1., rip.y * .16)));
    float fres = 1. - max(V.y, 0.); fres = fres * fres * fres;
    float sp = max(dot(Rr, uSunDir), 0.), sp2 = sp * sp; sp2 *= sp2; sp2 *= sp2; float sp3 = sp2 * sp2; sp3 *= sp3;
    float gl = smoothstep(.5, .85, gn(p * 2.3 + uTime * vec2(.7, -.4))) * smoothstep(.35, .7, gn(p * .9 - uTime * vec2(.2, .5)));
    // (m7) THE RIVER HAS DEPTH. Looked into (not along), a channel darkens toward its middle and the shallows at its margins show
    // the bed; along the water (fres near 1) it is live's bright mirror, untouched. THE GLITTER SPARKLES: live's glints were laid
    // at one scale (0.4 m), which is under a pixel beyond a few tens of metres, so under the sun the lobes summed to a white sheet.
    // The glints now keep a size that follows the distance (two octaves of cells about a hundredth of the distance across,
    // blended, so nothing pops): points of light with darker ripple between them. The mean under the sun is live's (the glint
    // factor averages .1 in both: .17 and .62 of the two lobes), the points are brighter (to 1.07 and 3.5 against .62 and 1.7).
    float dpt = 1. - smoothstep(.1, .4, rivCh), shal = 1. - smoothstep(.0, .5, dpt);
    float lg = log2(max(dist, 6.)), l0 = floor(lg), lfr = lg - l0, sc0 = exp2(l0) * .011; vec2 q0 = p / sc0, q1 = q0 * .5, dft = uTime * vec2(.9, -.5);
    float gk = mix(smoothstep(.56, .84, gn(q0 + dft)) * smoothstep(.3, .7, gn(q0 * .31 - dft * .3)), smoothstep(.56, .84, gn(q1 + dft)) * smoothstep(.3, .7, gn(q1 * .31 - dft * .3)), lfr);
    float rl = gn(vec2(dot(p, vec2(.8, .6)) * 1.7 + uTime * .5, dot(p, vec2(-.6, .8)) * .45)) * near;   // ripple lines, near
    vec3 wbody = uWater * (.42 + .5 * fres) * (.9 + .25 * rip.x);                                                    // live's body
    wbody = mix(wbody, wbody * vec3(.56, .66, .8) + uPondDeep * .1, smoothstep(.3, 1., dpt) * (1. - .8 * fres));     // the channels darken
    wbody = mix(wbody, lit * vec3(.54, .64, .66), shal * .56 * (1. - fres));                                        // the shallows show the bed (Mend 2: .56 of it, wet and cooler; at .72 the shallows read as sand flats)
    wbody *= 1. - (.1 + .22 * shal) * (rl - .5);                                                                     // (the riffle over a shallow bed)
    vec3 wcol = wbody + uSunCol * (sp2 * sp2 * (.03 + 1.4 * gk) + sp3 * (.12 + 5. * gk)) * sunVis;   // (Mend 1) the same means (.17, .62: gk averages .1), more of it in the points and less between them, so the path under a higher sun sparkles instead of whiting out
    lit = mix(lit, wcol, water * riv);
  }
  if(wetRim > 0.){   // (Mend 2) the wet margin of a bar, looked along: it mirrors the sky as the water beside it does
    float fr = 1. - max(V.y, 0.); fr = fr * fr * fr;
    lit = mix(lit, uWater * (.42 + .5 * fr) * .9, wetRim * fr * .75 * riv * (1. - water));
  }
  if(pond > 0.){   // still water: the deep sky straight down, the bright horizon at a grazing angle, the sun's glitter toward the light
    // (polish m4) shallow meltwater: the silt bed shows through at the rim, olive, then the sky's deep blue where it is a hand deep;
    // long cat's-paws of wind cross it; emergent sedge stands in the shallows; the fine ripple fades with distance (no white specks)
    float nf = 1. - smoothstep(22., 80., dist);
    vec2 rip = vec2(gn(p * 1.3 + uTime * vec2(.35, .15)), gn(p * 1.7 - uTime * vec2(.2, .3))) - .5, rf = (vec2(gn(p * 7. + uTime * vec2(.9, .4)), gn(p * 8.3 - uTime * vec2(.5, .8))) - .5) * nf;
    vec3 Rr = reflect(-V, normalize(vec3(rip.x * .08 + rf.x * .1, 1., rip.y * .08 + rf.y * .1)));
    float fres = 1. - max(V.y, 0.); fres *= fres; fres *= fres;
    float sp = max(dot(Rr, uSunDir), 0.), sp2 = sp * sp; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2; float sp3 = sp2 * sp2; sp3 *= sp3;
    float spk = mix(.12, smoothstep(.74, .92, gn(p * 4.3 + uTime * vec2(1.7, .6)) * .6 + gn(p * 9.1 - uTime * vec2(.9, 2.1)) * .4), nf);   // the sun's glitter as points, not a white sheet
    vec3 bed = uLoess * vec3(.4, .46, .38) * (.75 + .5 * n2) * (uSkyCol * .34 + uSunCol * sunVis * uGain * .3);
    float deepK = smoothstep(.0, mix(.3, .6, pondR), pdep + .25 * (n1 - .5) * pondR);
    // (m7) RUNNING WATER in the threads: the current's lines, drawn along the trough itself (the net's own edge line, turned one way
    // down the plain's fall so both banks agree), slipping downstream; riffles sparkle where the thread pinches
    vec2 tT = vec2(pEn.y, -pEn.x); if(dot(tT, vec2(.5, .866)) < 0.) tT = -tT;
    float sAl = dot(p, tT), tAc = clamp(tedge / max(twid, 1e-3), 0., 1.);
    float cur = gn(vec2(sAl * .7 - uTime * .9, tAc * 3.4)) * .6 + gn(vec2(sAl * 1.9 - uTime * 1.7, tAc * 7. + 3.)) * .4, run = 1. - pondR;
    vec3 body = mix(bed, mix(mix(uPondDeep * 1.5, uWater * .62, .3) * (.88 + .24 * rip.x) * (.78 + .44 * cur), uPondDeep * (.75 + .5 * rip.y), pondR), deepK);
    vec2 wd = vec2(dot(p, vec2(.5, .866)), dot(p, vec2(-.866, .5)));
    float paw = smoothstep(.5, .8, gn(vec2(wd.x * .22 - uTime * .35, wd.y * .9)) * .65 + gn(vec2(wd.x * .7 - uTime * .6, wd.y * 2.9)) * .35);
    body += uWater * .12 * paw * deepK * nf * pondR;
    // (m7) STILL WATER MIRRORS THIS SKY: straight down the deep zenith (the body above), toward a grazing angle the bright horizon
    // warmed on the sun's side, and the high bands lying in it as long soft streaks that slide as we pass
    float ry = clamp(Rr.y, 0., 1.); vec2 Rh = Rr.xz / max(length(Rr.xz), 1e-3), Sh = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
    float toS = max(dot(Rh, Sh), 0.);
    vec3 skyR = mix(mix(uSkyHor, uWater, .5), mix(uSkyZen, uWater, .35) * .8, sqrt(ry));
    skyR = mix(skyR, uScatC, toS * toS * toS * (1. - ry) * .5);
    vec2 cu = Rr.xz / max(Rr.y + .1, .1);
    float cband = smoothstep(.5, .74, gn(vec2(dot(cu, vec2(.8, .6)) * .3 + 3. + uTime * .006, dot(cu, vec2(-.6, .8)) * 1.5)) * .65 + gn(cu * 1.9 + 7.) * .35) * (1. - smoothstep(3., 8., length(cu)));
    skyR = mix(skyR, uCirLit * .9, cband * .5 * pondR);
    float fr5 = 1. - max(V.y, 0.), fS = .05 + .95 * fr5 * fr5 * fr5 * fr5;
    vec3 pc = mix(body, mix(uWater * mix(.7, .95, pondR), skyR, .75), max(fres, fS * pondR * .9) * mix(.45, 1., pondR)) + uSunCol * (sp2 * .05 + sp3 * .1 + spk * sp2 * .55) * sunVis;
    pc += uSunCol * run * smoothstep(.62, .86, cur) * (.03 + .5 * sp2) * sunVis * nf;                    // the riffle's glints
    // (m7) sedge stands in the shallows all round, each stem over its own dark image in the water
    float reed = (1. - smoothstep(.05, .1, fv.z)) * step(.3, fv.y) * (1. - smoothstep(.2, .72, pdep)) * near;
    pc = mix(pc, vec3(.2, .28, .1) * (.6 + .8 * n2) * (uSkyCol * .34 + uSunCol * sunVis * uGain * .4), reed * .8);
    lit = mix(lit, pc, pond);
  }
  gl_FragColor = vec4(lit, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// GROUND COVER of the mammoth steppe: fescue bunches (a fan of tapering blades with pale seed-head tips) a metre apart,
// and low grey cushions of steppe sage, in one instanced draw. Self-lit like the land, tips catching the level sun.
// iA = (x, y, z, yaw), iB = (width, height, kind 0 fescue | 1 sage, seed), iTint = rgb.
const TUFT_VERT = /* glsl */`
attribute vec4 iA, iB; attribute vec3 iTint; attribute vec2 aBlade;   // aBlade: (0 root .. 1 tip, blade seed)
uniform float uTime, uShLen; uniform vec3 uFade, uSunDir; uniform vec2 uWind; uniform vec4 uArc;
varying vec3 vWorld, vCol; varying float vH, vKind; varying vec2 vSh;
#include <fog_pars_vertex>
void main(){
  float c = cos(iA.w), s = sin(iA.w), h = aBlade.x;
  vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c) * vec3(iB.x, iB.y, iB.x);
  vec3 base = iA.xyz; float d = length(cameraPosition - base), keep = 1. - smoothstep(uFade.x, uFade.y, d);
  // wind: gusts cross the plain as visible waves; every blade also shivers on its own
  float gust = sin(dot(base.xz, uWind) * .075 - uTime * 1.5) * .5 + .5; gust *= gust;
  float gust2 = sin(dot(base.xz, vec2(-uWind.y, uWind.x)) * .05 + dot(base.xz, uWind) * .021 - uTime * .7) * .5 + .5;
  float bend = (.05 + .22 * gust * (.5 + .5 * gust2)) * h * h * (1. - .6 * iB.z) + .012 * h * sin(uTime * 5. + aBlade.y * 40. + iB.w * 9.);
  p.xz += uWind * bend * iB.y * 1.6; p.y -= bend * bend * iB.y * .8;
  if(iB.z > 1.5 && h < .1) p.xz *= max(1., d * .0016 / (.006 * iB.x));   // a flower stalk stays a pixel and a half wide at its distance
  if(h < -.5){   // the bunch's shadow: a fan laid on the ground away from the sun, following the swell
    vec2 sd = -uSunDir.xz / max(length(uSunDir.xz), 1e-3), o = vec2(-sd.y, sd.x) * position.x * iB.x * 1.3 + sd * position.y * iB.y * uShLen;
    float w = max(uArc.z, 1.), q0 = length(base.xz - vec2(0., uArc.x)) - uArc.x, q1 = length(base.xz + o - vec2(0., uArc.x)) - uArc.x;
    p = vec3(o.x, uArc.y * (exp(-(q1 * q1) / (w * w)) - exp(-(q0 * q0) / (w * w))) + .06, o.y);
  }
  vec4 wp = modelMatrix * vec4(base + p * keep, 1.);
  vWorld = wp.xyz; vH = h; vKind = iB.z; vSh = vec2(position.x / .42, position.y); vCol = iTint * (iB.z > 1.5 ? 1. : .85 + .3 * fract(aBlade.y * 7.31));
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const TUFT_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uRoot, uTip, uSageC; uniform float uLow, uTime;
varying vec3 vWorld, vCol; varying float vH, vKind;
#include <fog_pars_fragment>
${CLOUD_GLSL}
void main(){
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float back = max(0., -dot(V, uSunDir)), h = clamp(vH, 0., 1.);
  vec3 fes = mix(uRoot, uTip, h * h) , sg = uSageC * (.45 + .65 * h);
  vec3 c = vKind > 1.5 ? mix(uRoot * .7, vCol * (.75 + .35 * h), smoothstep(.3, .6, h)) : mix(fes, sg, vKind) * vCol;
  vec2 p = vWorld.xz;
  float cs = cloudShade(p, uTime);
  float sun = (1. - .64 * cs) * (.1 * uLow + .62 * max(uSunDir.y, 0.) + h * (.22 + 1.5 * back * back * uLow));
  gl_FragColor = vec4(c * (uSkyCol * (.26 + .12 * h) + uSunCol * sun), 1.);
  #include <fog_fragment>
}
`;
// every bunch stands on its shadow: one soft fan per tuft, multiplied over the ground (same vertex shader, aBlade.x = -1)
const TUFT_SHADOW_FRAG = /* glsl */`
uniform vec3 uShadowCol; uniform float uShOp, uTime;
varying vec3 vWorld; varying vec2 vSh;
${CLOUD_GLSL}
void main(){
  float v = vSh.y, u = abs(vSh.x) / max(v, .04);
  float a = (1. - smoothstep(.35, 1., u)) * smoothstep(0., .1, v) * (1. - smoothstep(.45, 1., v)) * uShOp * (1. - .9 * cloudShade(vWorld.xz, uTime));
  gl_FragColor = vec4(mix(vec3(1.), uShadowCol, clamp(a, 0., 1.)), 1.);
}
`;
function tuftGeometry(blades = 6) {
  const pos = [], bl = [];
  for (let k = 0; k < blades; k++) {
    const th = (k / blades) * TAU + 0.9 * Math.sin(k * 12.9898), lean = 0.18 + 0.5 * Math.abs(Math.sin(k * 78.233 + 1)), L = 0.72 + 0.28 * Math.abs(Math.sin(k * 37.7 + 2));
    const cx = Math.cos(th), sz = Math.sin(th), r0 = 0.1, w = 0.085;
    pos.push(cx * r0 - sz * w, 0, sz * r0 + cx * w, cx * r0 + sz * w, 0, sz * r0 - cx * w, cx * (r0 + lean * L), L * Math.cos(lean), sz * (r0 + lean * L));
    const sd = (k + 0.5) / blades; bl.push(0, sd, 0, sd, 1, sd);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBlade', new THREE.Float32BufferAttribute(bl, 2));
  return g;
}
// a small bloom: a hairy stalk and a four-petalled bowl tilted toward local +Z (the instance turns it to face the sun)
function flowerGeometry() {
  const pos = [-0.006, 0, 0, 0.006, 0, 0, 0, 0.2, 0], bl = [0, 0.3, 0, 0.3, 0.25, 0.3], c = [0, 0.2, 0], R0 = 0.05;
  for (let k = 0; k < 4; k++) {
    const a0 = k * Math.PI / 2 + 0.12, a1 = (k + 1) * Math.PI / 2 - 0.12, am = (a0 + a1) / 2, sd = 0.2 + k * 0.2;
    const rim = (a, r, lift) => [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.7 + lift * 0.7, c[2] - Math.sin(a) * r * 0.7 + lift * 0.7];
    const p0 = rim(a0, R0 * 0.8, 0.022), p1 = rim(a1, R0 * 0.8, 0.022), pm = rim(am, R0 * 1.15, 0.034);
    pos.push(...c, ...p0, ...pm, ...c, ...pm, ...p1); bl.push(0.55, sd, 1, sd, 1, sd, 0.55, sd, 1, sd, 1, sd);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aBlade', new THREE.Float32BufferAttribute(bl, 2));
  return g;
}
// places `count` bunches along the path corridor (crowding toward it) wherever keep(x, z) > 0
async function makeTufts(o) {
  const { rng, path, land, keep, noise, pause } = o, n = o.count, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iT = new Float32Array(n * 3);
  const P = new THREE.Vector3(), T = new THREE.Vector3(); let m = 0;
  for (let i = 0; i < n; i++) {
    const u = rng.range(-0.03, 1), lat = o.radius * Math.pow(rng(), o.bias) * (rng() < 0.5 ? -1 : 1), yaw = rng() * TAU, r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
    path.pointAt(u, P); path.tangentAt(Math.min(1, Math.max(0, u)), T);
    const x = P.x - T.z * lat, z = P.z + T.x * lat, k = keep(x, z);
    if (k <= 0 || r4 > k) continue;
    const sage = noise.n2(x * 0.03 + 77, z * 0.03 + 5) > 0.25 && r3 < 0.5 ? 1 : 0, sc = 0.75 + 0.6 * r1;
    if (o.flowers) {
      const c = o.flowers[Math.min(o.flowers.length - 1, Math.floor(r3 * o.flowers.length))], f = 1.5 + 0.8 * r1;
      iA.set([x, land(x, z) - 0.01, z, o.yaw + (r2 - 0.5) * 0.5], m * 4); iB.set([f, f * (0.8 + 0.5 * r2), 2, r2], m * 4); iT.set([c.r, c.g, c.b], m * 3);
    } else {
      iA.set([x, land(x, z) - 0.02, z, yaw], m * 4);
      iB.set(sage ? [0.5 * sc, 0.22 * sc, 1, r2] : [0.42 * sc, 0.48 * sc * (0.8 + 0.4 * r3), 0, r2], m * 4);
      const t = 0.8 + 0.4 * r2; iT.set([t * (1 + 0.1 * (r3 - 0.5)), t, t * (1 - 0.15 * r3)], m * 3);
    }
    m++;
    if (i % 600 === 599) await pause();
  }
  const g = new THREE.InstancedBufferGeometry(), base = o.geometry || tuftGeometry(o.blades || 6);
  g.setAttribute('position', base.getAttribute('position')); g.setAttribute('aBlade', base.getAttribute('aBlade'));
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA.subarray(0, m * 4), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB.subarray(0, m * 4), 4));
  g.setAttribute('iTint', new THREE.InstancedBufferAttribute(iT.subarray(0, m * 3), 3));
  g.instanceCount = m; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 60), 420);
  const mat = new THREE.ShaderMaterial({ uniforms: o.flowers ? o.uniforms : { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...o.uniforms }, vertexShader: TUFT_VERT, fragmentShader: TUFT_FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  let shadow = null;
  if (o.shadow) {
    const sg = new THREE.InstancedBufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.42, 1, 0, 0.42, 1, 0], 3)); sg.setAttribute('aBlade', new THREE.Float32BufferAttribute([-1, 0, -1, 0, -1, 0], 2));
    for (const k of ['iA', 'iB', 'iTint']) sg.setAttribute(k, g.getAttribute(k));
    sg.instanceCount = m; sg.boundingSphere = g.boundingSphere;
    shadow = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { ...mat.uniforms, ...o.shadow }, vertexShader: TUFT_VERT, fragmentShader: TUFT_SHADOW_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    shadow.frustumCulled = false; shadow.renderOrder = 0.9;
  }
  return { object: mesh, count: m, material: mat, shadow };
}

// ---------------------------------------------------------------------------------------------------------
// THE GULLY'S TURF LIP and hanging roots. aCol = colour, aSway = (0 fixed .. 1 free root tip, how much sun it gets).
const LIP_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aSway;
uniform float uTime;
varying vec3 vCol, vWP; varying float vLit;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vWP = position;
  float sw = aSway.x * (.07 * sin(uTime * 1.6 + p.x * 2.3 + p.z * 1.7) + .04 * sin(uTime * 3.1 + p.x * 5.1));
  p.x += sw; p.z += sw * .7;
  vCol = aCol; vLit = aSway.y;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const LIP_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol; uniform float uLow, uGain;
varying vec3 vCol, vWP; varying float vLit;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float mt = gn(vWP.xz * 2.3) * .45 + gn(vWP.xz * 5.9 + 3.) * .33 + gn(vWP.xz * 13. + 9.) * .22;
  vec3 c = vCol * mix(1., .72 + .6 * smoothstep(.35, .65, mt), vLit) * (uSkyCol * (.34 + .5 * (1. - vLit)) + uSunCol * uGain * vLit * (.3 * uLow + .62 * max(uSunDir.y, 0.)));
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE CUT BANKS of the thaw gully. aW = (metres along the wall, metres below the rim, depth of the cut here), aWN = the
// way the wall faces. Frozen silt in level beds a hand to a forearm thick, clods and cracks, a brown thawed layer under
// the turf, and wedges of dull banded grey-blue ice, 2 to 3 m wide at the top, straight-edged, tapering to a point two
// thirds of the way down, with thin wet glints. The sun reaches only the top of the sunward wall; the rest is blue shade.
const WALL_VERT = /* glsl */`
attribute vec3 aW; attribute vec2 aWN; attribute vec4 aWf; attribute float aWx;
varying vec3 vW, vWorld; varying vec2 vWN; varying vec4 vWf; varying float vWx;
#include <fog_pars_vertex>
void main(){
  vW = aW; vWN = aWN; vWf = aWf; vWx = aWx; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const WALL_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uSilt, uIce, uLoess; uniform float uTime, uGain, uLow, uLitD;
varying vec3 vW, vWorld; varying vec2 vWN; varying vec4 vWf; varying float vWx;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float s = vW.x, h = max(vW.y, 0.), D = max(vW.z, .5), y = vWorld.y, dist = length(cameraPosition - vWorld), near = 1. - smoothstep(18., 60., dist);
  // (polish m3) ICE WEDGES are ground ice IN the wall, not something hanging in front of it: a V of solid banded grey-blue ice
  // 2 to 3 m wide under the thawed layer, tapering to a point; the silt beds beside it are dragged UP against its flanks
  // (as real wedges do), a dark thawed gap outlines it, the ice face stands a little proud and wet, so it carries a sheen of
  // sky down one side and dripping glints, and it is foliated in upright milky and clear bands with silt frozen into it.
  // (polish m4) where the wedges stand comes from the mesh (aWf: metres along the wall from the nearest wedge's middle, its top
  // half-width, its share of the wall's depth, its seed); the ice itself is a body standing proud of this wall ('ice-wedges'),
  // and what this shader draws under and round it is its shadowed socket, the upturned beds and the seepage
  float wf = max(vWf.x, 0.), wi = floor(clamp(vWf.w, 0., 1.) * 16. + .5), wtop = max(vWf.y, 0.), wdeep = D * clamp(vWf.z, .2, .7);
  float wt = clamp(1. - (h - .45) / max(wdeep, .5), 0., 1.), has = step(.5, wtop) * step(3., D);
  float whalf = wtop * pow(max(wt, 1e-4), .6) * 1.08 - .13 + (.22 * (gn(vec2(wi * 7.3, y * 1.3)) - .5) + .07 * (gn(vec2(s * 2.7, y * 5.)) - .5)) * step(.01, wt);
  float aa = .03 + dist * .0012, apron = smoothstep(.74, .9, h / (D + .35));
  float inW = step(0., whalf) * smoothstep(.4, .55, h) * has * (1. - apron);
  float wedge = (1. - smoothstep(whalf - aa, whalf + aa, abs(wf))) * inW;
  float flank = exp(-max(abs(wf) - max(whalf, 0.), 0.) / .9) * has * step(.01, wt) * (1. - apron);   // 1 at the ice, fading into the bank
  // level beds: each its own tone, a dark line under every ledge; they undulate, pinch, and turn up against a wedge
  float by = (y - .55 * flank * flank) * 3.1 + .5 * gn(vec2(s * .11, y * .3)) + .25 * gn(vec2(s * .6, 7.)), bi = floor(by), bf = fract(by);
  float tone = gh(vec2(bi, 3.)), tone2 = gh(vec2(bi, 11.));
  vec3 silt = uSilt * (2.8 + 1.5 * tone + 1.2 * gn(vec2(s * .9, y * 2.3)));
  silt = mix(silt, uLoess * .6, step(.84, tone2) * .4);                                   // a paler sandy bed now and then
  silt = mix(silt, uSilt * 1.5, step(tone2, .12) * .7);                                    // a peaty one
  silt *= 1. - .34 * (1. - smoothstep(.0, .16, bf)) * (.4 + .6 * near);
  // clods and cracks up close
  float cl = gn(vec2(s * 3.3, y * 3.7)) * .6 + gn(vec2(s * 8.1 + 5., y * 9.3)) * .4, crk = smoothstep(.47, .5, cl) * (1. - smoothstep(.5, .53, cl));
  silt *= (.82 + .36 * cl) * (1. - .5 * crk * near);
  // the thawed layer under the turf, and the apron of slumped silt at the foot
  float act = 1. - smoothstep(.35, .8, h + .25 * gn(vec2(s * 1.3, 2.)));
  silt = mix(silt, vec3(.4, .27, .16) * (.8 + .5 * cl), act * .85);
  silt = mix(silt, uSilt * (3.4 + 1.6 * cl) * vec3(1.06, 1., .92), apron);
  // the ice: upright foliation, a dark frost crack down its middle, silt streaks, darker and bluer with depth
  float xr = clamp(wf / max(whalf, .08), -1., 1.), edge = xr * xr;
  float fol = .5 + .5 * sin(wf * 17. + 2.2 * gn(vec2(wf * 3., y * .35)) + wi * 2.), fol2 = gn(vec2(wf * 31. + wi, y * .4));
  vec3 ice = mix(uIce, vec3(dot(uIce, vec3(.3333))) * vec3(1.02, 1., .98), .68) * (.86 + .22 * fol + .16 * (fol2 - .5));
  ice = mix(ice, silt * 1.1, .45 * smoothstep(.5, .72, gn(vec2(s * .4 + wi, y * 2.6))));               // the silt beds run on through it
  ice = mix(ice, vec3(.8, .86, .9) * .6, .35 * smoothstep(.6, .9, fol2) * near);                       // milky bubble bands
  ice = mix(ice, uSilt * 2.6, .5 * smoothstep(.62, .8, gn(vec2(wf * 11. + wi * 5., y * .22))));       // silt frozen into it in upright streaks
  ice = mix(ice, uSilt * 1.6, (1. - smoothstep(.02, .07 + dist * .001, abs(wf + .12 * (gn(vec2(wi, y * 1.1)) - .5)))) * .7);   // the frost crack
  ice *= (1. - .45 * edge * edge) * (.78 + .3 * wt);                                                     // rounded: darker toward its flanks and its point
  // (m7) the thawed gap round the ice is a hand to a forearm wide and black: the ice sits IN the bank, back from its face (the body's flanks sink behind this surface)
  float gap = (1. - smoothstep(.03, .2 + dist * .001, abs(abs(wf) - whalf + .05))) * inW;
  // (m7) WET ROCK behind the falls: the bank is soaked dark under and beside the falling water, widening downward, ragged at its edges
  float wetF = (1. - smoothstep(.45, 1.25 + .1 * h, abs(vWx) + .5 * (gn(vec2(s * 1.7, y * .55)) - .5))) * smoothstep(.25, .8, h) * step(3., D);
  silt *= mix(vec3(1.), vec3(.5, .53, .6), wetF);
  vec3 c = mix(silt * (1. - .82 * gap), ice * (1. - .5 * gap), wedge);
  c *= 1. - .3 * wedge * (1. - smoothstep(.45, 1.1, h));                                                 // the overhang of thawed soil shades its head
  // light: sun on the top of the sunward wall only, sky shade below, a little bounce off the floor
  vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float facing = smoothstep(.05, .45, dot(vWN, sh)), lit = facing * (1. - smoothstep(uLitD - .35, uLitD + .45, h + .3 * gn(vec2(s * .35, 5.))));
  vec3 fill = uSkyCol * (.52 + .4 * (1. - h / (D + .35))) + uSkyCol * uLoess * .16 + uSunCol * .035;
  vec3 col = c * (fill + uSunCol * uGain * lit * (.55 + .25 * uLow));
  // wet sheen: the ice face is a low rounded boss, so one side of it mirrors the open sky above the far rim; meltwater runs down it
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)), Nw = normalize(vec3(vWN.x, .25, vWN.y) + vec3(-vWN.y, 0., vWN.x) * xr * .8 + vec3(0., .5, 0.) * (fol - .5) * .5 + vec3(0., 1e-4, 0.));
  vec3 Rw = reflect(-V, Nw); float skyUp = smoothstep(.15, .7, Rw.y), fr = 1. - max(dot(V, Nw), 0.); fr = .08 + .92 * fr * fr * fr;
  vec3 sheenC = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .55);
  col += sheenC * wedge * (.04 * skyUp + .16 * fr * skyUp) * (.6 + .4 * smoothstep(.3, .7, gn(vec2(wf * 1.3 + wi, y * .8))));
  float gl = (1. - smoothstep(.0, .04 + dist * .0012, abs(fract(wf * 1.7 + gh(vec2(wi, 13.))) - .5))) * wedge;
  float dash = smoothstep(.55, .95, .5 + .5 * sin(y * 3.3 + uTime * 3. + 6.28 * gh(vec2(floor(wf * 1.7), wi))));
  col += (sheenC * .5 + uSunCol * .06) * gl * (.01 + .12 * dash) * step(.55, gh(vec2(floor(wf * 1.7), wi + 3.)));
  col = mix(col, col * vec3(.72, .78, .86), flank * (1. - wedge) * .35 * smoothstep(.4, .9, h));       // seepage darkens the bank beside it
  col += sheenC * wetF * (1. - wedge) * (.03 + .1 * fr) * skyUp * smoothstep(.45, .7, gn(vec2(s * 5., y * 1.4 - uTime * .6)));   // (m7) the wet bank glistens where the water runs over it
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// GROUND ICE (polish m4): the body of each ice wedge in the gully walls. aI = (metres across from its middle, metres below
// the rim, 1 at its head .. 0 at its point, seed). Dull grey-blue ice foliated upright in milky and clear bands, silt frozen
// into it in streaks and in a few level dirty partings, a frost crack down the middle; rounded and melt-fluted, so its
// flanks fall into shade; wet: it mirrors the sky above the far rim along its shoulders, and drips run down it.
const ICE_VERT = /* glsl */`
attribute vec4 aI;
varying vec4 vI; varying vec3 vWorld, vN;
#include <fog_pars_vertex>
void main(){
  vI = aI; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const ICE_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uSilt, uIce, uLoess; uniform float uTime, uGain, uLow, uLitD;
varying vec4 vI; varying vec3 vWorld, vN;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float x = vI.x, h = max(vI.y, 0.), t = clamp(vI.z, 0., 1.), seed = vI.w * 16., y = vWorld.y, dist = length(cameraPosition - vWorld), near = 1. - smoothstep(14., 50., dist);
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)), N = normalize(vN + vec3(0., 1e-4, 0.)); if(dot(N, V) < 0.) N = -N;
  // upright foliation: milky bubbly bands and clear dark ones a finger to a hand wide, wavering
  float wv = x + .1 * (gn(vec2(x * 2.3 + seed, y * .5)) - .5);
  float fol = .5 + .5 * sin(wv * 12. + 1.5 * gn(vec2(wv * 3., y * .3)) + seed * 5.), fol2 = gn(vec2(wv * 27. + seed * 3., y * .45)), flu = gn(vec2(wv * 5.5 + seed, y * .3));
  vec3 base = mix(uIce, vec3(dot(uIce, vec3(.3333))) * vec3(.99, 1., 1.02), .8) * 1.02;
  vec3 ice = mix(base * .86, base * 1.08, smoothstep(.3, .7, fol * .6 + fol2 * .4));
  float blk = fract(y * 1.3 + .8 * gh(vec2(floor(wv * 1.6 + seed), seed)) + .2 * gn(vec2(x * 2., y)));
  ice *= 1. - .3 * (1. - smoothstep(.0, .06 + dist * .0015, abs(blk - .5))) * step(.35, gh(vec2(floor(wv * 1.6 + seed), floor(y * 1.3))));   // it breaks in blocks: level fractures, offset from one column to the next
  ice = mix(ice, vec3(.74, .8, .84) * .55, .22 * smoothstep(.66, .9, fol2) * near);                              // milky bubble bands
  ice = mix(ice, uSilt * 2.4, .45 * smoothstep(.6, .78, gn(vec2(wv * 12. + seed * 5., y * .22))) * (.6 + .4 * near));     // silt frozen in, in upright streaks
  float part = fract(y * 1.9 + .35 * gn(vec2(x * 1.3 + seed, y * .7)));
  ice = mix(ice, uSilt * 2.9, .45 * smoothstep(.86, .93, part) * (1. - smoothstep(.95, 1., part)) * step(.4, gn(vec2(floor(y * 1.9), seed))));   // a level dirty parting now and then: the beds it grew through
  ice = mix(ice, uSilt * 1.4, (1. - smoothstep(.015, .05 + dist * .001, abs(x + .1 * (gn(vec2(seed, y * 1.1)) - .5)))) * .75);   // the frost crack
  ice *= (.7 + .36 * t) * (.8 + .4 * flu);                                                                               // darker toward its point; fluted
  ice *= 1. - .4 * (1. - smoothstep(.3, .95, h));                                                                         // under the overhang of thawed soil and sod
  // light: the sun reaches only the head of the sunward wall; the rest is open shade from the sky above, so the form reads
  // from what each facet sees of the sky
  vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float facing = smoothstep(.05, .45, dot(normalize(N.xz + vec2(1e-4, 0.)), sh)), lit = facing * (1. - smoothstep(uLitD - .35, uLitD + .45, h));
  vec3 fill = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .35) * (.26 + .42 * smoothstep(-.5, .8, N.y) + .2 * abs(dot(N, V))) + uSkyCol * uLoess * .14 + uSunCol * .03;
  vec3 col = ice * (fill + uSunCol * uGain * lit * .3);
  // wet sheen: the sky above the far rim mirrored on every shoulder that leans back; a tight glint where a bulge faces it
  vec3 Rw = reflect(-V, N); float fr = 1. - max(dot(V, N), 0.); fr = .06 + .94 * fr * fr * fr;
  vec3 sheenC = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))), .45);
  col += sheenC * fr * smoothstep(-.05, .55, Rw.y) * .42;
  float gl = max(dot(Rw, normalize(vec3(sh.x * .5, .85, sh.y * .5))), 0.); gl *= gl; gl *= gl; gl *= gl; gl *= gl;
  col += (sheenC * .55 + uSunCol * .1) * gl * (.5 + .5 * flu);
  // meltwater: thin bright runs slipping down the flutes, and a drop now and then
  float run = (1. - smoothstep(.0, .035 + dist * .0012, abs(fract(wv * 2.3 + seed * .37) - .5))) * step(.5, gh(vec2(floor(wv * 2.3 + seed * .37), seed)));
  float dash = smoothstep(.5, .95, .5 + .5 * sin(y * 3.1 + uTime * 3. + 6.28 * gh(vec2(floor(wv * 2.3 + seed * .37), 3.))));
  col += sheenC * run * (.015 + .1 * dash) * smoothstep(.3, .8, h);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE PLUME: the dust of thousands of hooves, standing BESIDE the slump on its downwind (east) side, never across it.
// iA = (across -1..1, start along the ramp 0..1, size m, seed), iB = (rate, three randoms). A puff is born at the foot of
// the ramp's east edge, climbs as it ages, swells and leans downwind; the firm lumpy sprites stack into a billowing
// outline of rounded heads, bright on the sun's side and rose-grey on the other.
const PLUME_VERT = /* glsl */`
attribute vec4 iA, iB;
uniform float uTime, uPlume, uSwellH, uSoft; uniform vec4 uArc, uRampP, uPl; uniform vec3 uSunDir;   // uPl: (1 = it stands on level ground, that ground's y, height scale, size scale)
varying vec2 vUV; varying float vAlpha, vBack, vSeed, vH, vSoft; varying vec2 vSunS;
#include <fog_pars_vertex>
void main(){
  float seed = iA.w, life = fract(uTime * iB.x + seed * 17.3), h = life * (2. - life);
  float q = uRampP.y + uRampP.z * (.3 + .8 * iA.y) + 5. * iA.x * (1. - h);
  float k = smoothstep(uRampP.y, uRampP.y + uRampP.z, q), sw = q / max(uArc.z, 1.);
  float gy = mix(-uSwellH * (1. - exp(-sw * sw)) - uRampP.w * k, uPl.y, uPl.x);
  float spr = mix(1., uPl.w * .6, uSoft);
  float a = uRampP.x + 27. + spr * (8. * iB.y + h * (8. + 16. * iB.w)) + 1.5 * sin(uTime * .11 + seed * 40.);
  float ph = a / uArc.x, rr = uArc.x + q;
  float top = 27. * (.4 + .6 * iB.z) * (1. - .35 * iA.y) * uPl.z;
  vec3 c = vec3(rr * sin(ph), gy + 2. + h * top, uArc.x - rr * cos(ph));
  float size = iA.z * (.55 + .6 * h) * (1. - .3 * h * iB.z) * uPl.w;
  float alpha = smoothstep(0., mix(.1, .035, uSoft), life) * (1. - smoothstep(.78, 1., life)) * uPlume;   // (the column on the bars stands on its own dust: its foot is as dense as its body)
  vec4 wp = modelMatrix * vec4(c, 1.), mvPosition = viewMatrix * wp;
  mvPosition.xy += position.xy * size;
  alpha *= smoothstep(12., 30., -mvPosition.z); vSoft = uSoft * (1. - smoothstep(150., 195., -mvPosition.z));   // from the file it is the far plume it always was; nearer, seen against the light, it softens
  vec3 V = normalize(cameraPosition - wp.xyz + vec3(0., 1e-4, 0.));
  vBack = -dot(V, uSunDir); vUV = position.xy; vAlpha = alpha; vSeed = seed; vH = h;
  vec3 sv = (viewMatrix * vec4(uSunDir, 0.)).xyz; vSunS = sv.xy / max(length(sv.xy), .35);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const PLUME_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uDust, uShade; uniform float uAlpha, uTime, uSoft;
varying vec2 vUV; varying float vAlpha, vBack, vSeed, vH, vSoft; varying vec2 vSunS;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float r = length(vUV); if(r > 1.) discard;
  float bil = gn(vUV * 2.3 + vSeed * 31. + vec2(0., -uTime * .04)) * .6 + gn(vUV * 5.3 + vSeed * 7.) * .4;   // billows
  // (polish m4) uSoft: the column on the bars is seen against the light from our wheel: every head melts into the air at its
  // edge (no outline), its shaded cells are filled by the light that passes through the dust (no dark holes), its rim glows
  float sf = clamp(vSoft, 0., 1.), rr = r + (bil - .5) * .5;
  float a = (1. - smoothstep(mix(.58, .44, sf), mix(.84, .93, sf), rr)) * clamp(vAlpha, 0., 1.) * uAlpha;
  if(a < .004) discard;
  float side = clamp(.5 + .62 * dot(vUV, vSunS) + .45 * (bil - .5), 0., 1.), back = clamp(vBack, 0., 1.), front = clamp(-vBack, 0., 1.);     // each puff has a lit and a shaded side
  vec3 lit = uDust * (uSkyCol * .12 + uSunCol * (.2 + .22 * back * back));
  vec3 shade = uShade * (uSkyCol * .26 + uSunCol * .05); shade = mix(shade, lit * vec3(.8, .72, .72), .55 * sf);
  vec3 c = mix(shade, lit, smoothstep(.2, .8, side * .8 + .2 * (.5 + .5 * vUV.y) + .4 * front * (.4 + .6 * bil))) * mix(.82, 1.06, clamp(vH, 0., 1.));
  c += uDust * uSunCol * .3 * back * back * smoothstep(.3, .75, rr) * (1. - .45 * sf);   // against the sun the rim of every head burns
  c += uDust * uSunCol * .07 * sf * (1. - smoothstep(.0, .5, a));                                // ... and its thin edge lets the light through
  gl_FragColor = vec4(min(c, vec3(.9)), a);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE FALLS (m7): meltwater off the shoulder of every ice wedge, down both walls of the gully. A ribbon 2.1 m across on
// the wall's own surface from under the turf to the apron; nothing of it is drawn but water. aF = (across -1..1, metres
// fallen, the fall's whole length, seed), aFN = (the wall's facing x, z, metres below the rim).
// Four THREADS, each wandering, swelling to a hand and pinching to a finger, breaking and re-forming; along each the water
// is in BEADS let go at the lip one after another, which lengthen as they fall (free fall at the earth's own rate: a bead
// is 0.452 * sqrt(metres fallen) seconds old; about eight leave the lip each second); between and round them fine SPRAY that widens downward; all of it fades out before the ribbon's edge.
const FALL_VERT = /* glsl */`
attribute vec4 aF; attribute vec3 aFN;
varying vec4 vF; varying vec3 vFN, vWorld;
#include <fog_pars_vertex>
void main(){
  vF = aF; vFN = aFN; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FALL_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol; uniform float uTime, uGain, uLow, uLitD;
varying vec4 vF; varying vec3 vFN, vWorld;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float x = clamp(vF.x, -1., 1.) * 1.05, y = max(vF.y, 0.), L = max(vF.z, 1.), seed = vF.w * 50., h = max(vFN.z, 0.);
  float dist = length(cameraPosition - vWorld), px = dist * .0012;                    // (Mend 2) the least breadth a bright thread is seen at: 1.2 mm for each metre of straight distance, four minutes of arc. White water against wet dark rock is seen by its glare, which an eye spreads over three to five minutes of arc however thin the thread is, so at 50 m a finger of water reads 6 cm wide
  float yn = clamp(y / L, 0., 1.), tau = sqrt(y + .3);                                // tau: time since the lip, by the law of falling (y is clamped above)
  float edge = 1. - x * x / 1.1025; edge = clamp(edge, 0., 1.); edge *= edge;         // nothing reaches the ribbon's edge
  float ends = smoothstep(0., .5, y) * (1. - smoothstep(L - 1.1, L - .1, y));
  float water = 0., halo = 0.;
  for(int i = 0; i < 4; i++){
    float fi = float(i), id = fi * 7.31 + seed;
    float cx = (fi - 1.5) * .34 + .16 * (gh(vec2(id, 1.)) - .5) + .07 * sin(y * 1.1 + id * 3.) + .1 * (gn(vec2(y * .5 - uTime * 3., id)) - .5) * (.4 + yn);
    float alive = smoothstep(.3, .5, gn(vec2(y * .16 - uTime * 1.1, id * 1.7 + 3.)) + .25 * (1. - yn));   // a thread gives out and takes up again
    float wd = .045 + .11 * gn(vec2(y * .55 - uTime * 3.4, id * 2.3)) + .03 * yn;                        // it swells to a hand and a half and pinches to two fingers
    float w = max(wd, px * .9), d = abs(x - cx);
    float ph = (tau * .452 - uTime) * 8.4 + gh(vec2(id, 5.)) * 9., bi = floor(ph), bf = ph - bi;             // beads, let go one after another
    float bead = smoothstep(.0, .3, bf) * (1. - smoothstep(.4, 1., bf)) * (.35 + .65 * step(.22, gh(vec2(bi, id))));   // (Mend 2) a bead swells and tails off (it began and ended at a step, and near the lens a thread's edge was stair-stepped)
    float strand = mix(1., .72 + .56 * gn(vec2((x - cx) * 70. + id, y * 1.3 - uTime * 6.)), 1. - smoothstep(8., 30., dist));   // near the lens a thread is strands of water, not a ribbon
    float line = (1. - smoothstep(w * .45, w, d)) * alive * (.42 + .58 * bead) * strand * min(1., wd / max(w, 1e-3) + .45);
    water = max(water, line);
    halo += exp(-d * d / ((.003 + .016 * yn + px * px))) * alive * (.25 + .75 * bead);
  }
  float mistN = gn(vec2(x * 3.4, y * .9 - uTime * 5.)) * .6 + gn(vec2(x * 9., y * 2.3 - uTime * 11. + 5.)) * .4;
  float spray = clamp(halo * .3, 0., .5) * (.4 + .9 * mistN) + .1 * yn * yn * yn * smoothstep(.4, .75, mistN);
  float a = clamp(water * .95 + spray * (.5 + .5 * yn), 0., .96) * edge * ends;
  if(a < .004) discard;
  // white water: the sky's light all down it, and the sun on the top of the sunward wall (the wall's own law: uLitD)
  vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float facing = smoothstep(.05, .45, dot(vFN.xy, sh)), lit = facing * (1. - smoothstep(uLitD - .35, uLitD + .45, h));
  vec3 col = vec3(.93, .96, 1.) * (uSkyCol * (.95 + .25 * water) + uSunCol * uGain * lit * (.75 + .3 * uLow) * (.6 + .4 * water)) + uSunCol * .04;
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}
`;
// the mist where each fall lands: soft tufts that rise off the foot, drift out from the wall and thin. iA = (x, y, z, size), iB = (seed, strength, the wall's facing x, z)
const MIST_VERT = /* glsl */`
attribute vec4 iA, iB;
uniform float uTime;
varying vec2 vUV; varying float vA, vSeed;
#include <fog_pars_vertex>
void main(){
  float life = fract(uTime * (.16 + .1 * fract(iB.x * 7.7)) + iB.x), sz = iA.w * (.55 + .8 * life);
  vec3 c = iA.xyz + vec3(iB.z, 0., iB.w) * life * .9 + vec3(0., 1.3 * life * (2. - life), 0.);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(c, 1.);
  mvPosition.xy += position.xy * sz * vec2(2.3, .8);   // (Mend 1) each tuft lies low and long, so the six of a fall run into one drift along the wall's foot
  vUV = position.xy; vSeed = iB.x; vA = iB.y * smoothstep(0., .2, life) * (1. - life);   // (it thins with its own life only: no term of the eye; it keeps off the route by where it is seated: verify-m7b/r2_mist.mjs)
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const MIST_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol; uniform float uTime;
varying vec2 vUV; varying float vA, vSeed;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  float r2 = dot(vUV, vUV); if(r2 >= 1.) discard;
  float n = gn(vUV * vec2(4.2, 2.2) + vSeed * 40. + vec2(0., -uTime * .3)), rr = sqrt(r2) + .55 * (n - .5);   // (Mend 1) torn at its rim: a drift, not a ball
  float a = (1. - smoothstep(.15, 1., rr)) * clamp(vA, 0., 1.) * (.6 + .8 * n);
  gl_FragColor = vec4(vec3(.92, .95, 1.) * uSkyCol * 1.05 + uSunCol * .03, a);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE FORDS: the head of the column, already across the river, as small upright cards on the hero's own streamlines
// (fanning out over the bars), each a saiga-shaped blot with a lit back. iA = (lane, phase, size, seed).
const FORD_VERT = /* glsl */`
attribute vec4 iA; attribute mat3 iF;   // (m7b) iF, nine numbers a card from the stream 'm7b-fords': (its turning number, the first animal's size draw, the second's), (the third's, the fourth's, the first gap), (the second gap, the third, whether a fourth runs with them)
uniform float uWalk, uTime, uRiverY, uNearQ[6]; uniform vec4 uArc; uniform vec3 uSunDir;
varying vec2 vUV; varying float vVis, vSeed, vKind; varying vec4 vW, vAx, vAs;
${SAIGA_FLOW_GLSL}
${RIVER_GLSL}
#include <fog_pars_vertex>
vec3 arcP(float a, float q){ float ph = a / uArc.x, rr = uArc.x + q; return vec3(rr * sin(ph), uRiverY, uArc.x - rr * cos(ph)); }
const float FORD_FOUR = .85;   // the share of the animal cards that carry a fourth animal (see below)
float sizeOf(float u){ return u < .17 ? .72 : .85 + .15 * (u - .17) / .83; }   // this year's young at the tiers' own share and size (the piece's SAIGA_VERT: .17, .72); a grown one .85 to 1, the spread live deals its cards; none larger than the one size m7 drew
void main(){
  float seed = iA.w, span = max(uQ.y - uQ.x, 1.), run = uFlow * (.94 + .12 * fract(seed * 7.7)) + iA.y * span, q = uQ.x + fract(run / span) * span;
  // (the fords' law itself, six loose drifts fanning out over the bars, is fordAt in the piece's SAIGA_FLOW_GLSL: live's lines, moved)
  float a1 = fordAt(iA.x, q, seed);
  vec3 P = arcP(a1, q), P2 = arcP(fordAt(iA.x, q + 1., seed), q + 1.);
  float vis = step(uQ.z, q) * smoothstep(0., 10., q - uQ.x) * smoothstep(0., 60., uQ.y - q);
  vec3 rt = normalize(vec3(cameraPosition.z - P.z, 0., P.x - cameraPosition.x) + vec3(1e-4, 0., 0.));
  float big = max(1., length(cameraPosition - P) * .0036);   // far off each card stands for a knot of animals, so the fords stay dotted lines
  // (m7b) ONE THING OR THE OTHER. A card is three or four whole animals (kind 1) or the knot, live's block (kind 0), and nothing
  // between. Over the 40 m of its ford's run round that line's own near reach (see FORD_NEAR in build) each card has a turning
  // place of its own, the stretch's start plus its number times the stretch's length: animals before it, a knot beyond. So the
  // share of animal cards falls evenly along the stretch and no line lies across the fords where one kind ends.
  float nq = uNearQ[int(clamp(floor(iA.x * 3.) + 3., 0., 5.))], kind = step(q, nq - 20. + 40. * iF[0].x);
  // (m7b) IT STANDS IN THE WATER BY WHERE IT STANDS, animals and knot alike: on the plain's true surface, sunk by the river's own
  // law under its own place and by nothing else (riverAt, the piece's): of a card one metre tall, to the hock (0.12) at the
  // waterline, to the belly (0.38) in mid channel; the land hides what is under water. Live's size law (big) scales the card
  // whole, the sink, the bob of its stride and so the waterline with it: the only term of the eye in the card. (The bob is
  // live's 3 cm for a whole card within 278 m, where big is 1; it grows and fades with the card.)
  vec3 rv = riverAt(P.xz); float sunk = (.12 + .26 * rv.y) * rv.x, bob = .03 * sin(run * 3. + seed * 20.), sc = iA.z * vis * big;
  P.y += rv.z - sunk * sc + bob * vis * big;
  float hd = dot(P2 - P, rt) < 0. ? -1. : 1.;
  vec3 wpos = P + (rt * position.x * 3.6 + vec3(0., position.y + .5, 0.) * 1.0) * sc;
  vUV = vec2(position.x * hd, position.y); vVis = vis; vSeed = seed; vKind = kind;
  // (m7b) NO TWO ALIKE IN A ROW: the row of a card's animals, nose to tail, by its own nine numbers. An animal of size s reaches
  // 0.79 s before its middle (the nose) and 0.545 s behind it (a hind hoof at full swing). Two middles lie from a third of the
  // two sizes' sum apart (the bodies overlapping by a third) to their whole sum apart (a body's length between them), as far
  // as the card lets them: the room left over is shared out by the gaps' own numbers, so every row lies inside the card and
  // is centred on it. The card is 3.6 m wide: four grown animals at their closest are 3.34 m, and in less than that a
  // fourth can only stand half hidden. A fourth runs with the three on FORD_FOUR of the cards, so that a seed's animal cards
  // carry no less dark than live's block (three alone: 1.27 m2 against 1.50; verify-m7b/cardlaw.mjs).
  vec4 s = vec4(sizeOf(iF[0].y), sizeOf(iF[0].z), sizeOf(iF[1].x), sizeOf(iF[1].y));
  vec3 dm = vec3(s.x + s.y, s.y + s.z, s.z + s.w) / 3.;
  float four = step(iF[2].z, FORD_FOUR);
  dm.z *= four;
  vec3 dx = dm * 2. * vec3(iF[1].z, iF[2].x, iF[2].y);
  float lmin = .79 * s.x + .545 * mix(s.z, s.w, four) + dm.x + dm.y + dm.z, ext = dx.x + dx.y + dx.z;
  vec3 dd = dm + dx * min(1., (3.58 - lmin) / max(ext, 1e-3));
  float o0 = .5 * (lmin + dd.x + dd.y + dd.z - dm.x - dm.y - dm.z) - .79 * s.x;
  vAx = vec4(o0, o0 - dd.x, o0 - dd.x - dd.y, o0 - dd.x - dd.y - dd.z); vAs = vec4(s.xyz, s.w * four);
  vec2 sh = -uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  vW = vec4(rv.x, sunk - bob / max(iA.z, .5), clamp(dot(sh, rt.xz) * hd, -1., 1.), run * 3.49 + seed * 20.);   // in water; how high the water stands on the card, in the card's own measure; which way its shadow lies across the card; stride phase
  vec4 mvPosition = viewMatrix * vec4(wpos, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FORD_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uCoat; uniform float uTime;
varying vec2 vUV; varying float vVis, vSeed, vKind; varying vec4 vW, vAx, vAs;
#include <fog_pars_fragment>
void main(){
  vec2 p = vec2(clamp(vUV.x, -.5, .5) * 3.6, clamp(vUV.y, -.5, .5) + .5);   // x -1.8 .. 1.8 m (the head toward +x), y 0 .. 1 m
  float wet = clamp(vW.x, 0., 1.), d = clamp(vW.y, -.1, 1.1), ph = vW.w;
  float kind = step(.5, vKind);   // (m7b) 1: whole animals; 0: the knot. One number for the whole card, and no weight between
  // THE KNOT: live's card as live drew it, the whole block 1.5 m by 1 m in the coat's dark tone with a lit back, standing for a
  // knot of animals (live's shader never cut its blot out of the card; that is the fullness the far fords have, kept)
  float animal = step(abs(p.x), .75) - .5, foot = step(abs(p.x), .75), shB = 0., xh = .75, xr = -.75, xt = -.75;
  if(kind > .5){
    // (m7, m7b) THE ANIMALS: the knot drawn as what it is, three or four whole animals nose to tail, each of its own size at
    // its own place in the row (vAs, vAx): body, the neck carried forward, the head up with its swollen nose, horns on some of
    // the grown, four legs, each pair scissoring with the stride
    animal = -1.; foot = 0.; xh = vAx.x + .5 * vAs.x; xr = vAx.x - .5 * vAs.x; xt = xr;
    for(int i = 0; i < 4; i++){
      float s = clamp(vAs[i], 0., 1.); if(s < .5) continue;   // (no fourth on this card)
      float fi = float(i), phi = ph + 2.1 * fi; vec2 pp = (p - vec2(vAx[i], 0.)) / max(s, .5);
      vec2 b = (pp - vec2(0., .58)) / vec2(.5, .2); float body = 1. - dot(b, b);
      vec2 nk = (pp - vec2(.44, .68)) / vec2(.16, .15); float neck = 1. - dot(nk, nk);
      vec2 h2 = (pp - vec2(.62, .8)) / vec2(.17, .1); float head2 = 1. - dot(h2, h2);
      float horn = step(abs(pp.x - .55 + .5 * (pp.y - .88)), .028) * step(.86, pp.y) * step(pp.y, 1.) * step(.5, fract(vSeed * 3.7 + fi * .37)) * step(.8, s);
      float k = clamp((.5 - pp.y) / .5, 0., 1.), sw = .2 * sin(phi) * k, sw2 = .2 * sin(phi + 1.3) * k;
      float legs4 = max(max(step(abs(pp.x - .3 - sw), .045), step(abs(pp.x - .3 + sw), .045)), max(step(abs(pp.x + .3 - sw2), .045), step(abs(pp.x + .3 + sw2), .045))) * step(pp.y, .5);
      animal = max(animal, max(max(max(body, neck), max(head2, horn - .5)), legs4 - .5));
      foot = max(foot, step(abs(pp.x - .12), .67));                                       // from its hind hooves to its nose
      shB = max(shB, step(pp.y, .075) * step(abs(pp.x - .12 - .5 * vW.z), .67));          // on a bar: its own shadow at its own feet, lying away from the sun
      xt = min(xt, vAx[i] - .5 * s);
    }
  }
  // (m7b) IN OPEN WATER, every card alike, by the river's law under its own place (vW.x, vW.y) and nothing else: a dark line
  // where it stands in its own reflection, along the whole foot of what is drawn; broken water thrown up at the leader's chest;
  // a pale streak trailing under and behind it, tapering out over 0.7 m behind the last tail (the knot's whole wake: under
  // half the knot's own 1.5 m, and inside the 1.05 m the card has behind the block)
  float wy = p.y - d, inW = step(.5, wet) * step(0., wy), tb = clamp((xt - p.x) / max(min(.7, xt + 1.78), .05), 0., 1.);
  float wake = inW * max(step(wy, .1 * (1. - tb)) * step(xt - .7, p.x) * step(p.x, xr) * step(.3, fract(p.x * 2.6 + ph * .16 + vSeed * 7.)),
    step(wy, .17) * step(xh - .13, p.x) * step(p.x, min(xh + .27, 1.78)) * step(.42, fract(p.x * 5. + ph * .31)));
  float dark = inW * step(wy, .07) * foot;
  float shadow = max((1. - step(.5, wet)) * kind * shB, dark);   // (a knot on a bar has no shadow, as in live)
  if(animal < 0. && wake < .5 && shadow < .5) discard;
  vec3 c = uCoat * (uSkyCol * .34 + uSunCol * (.2 + .5 * smoothstep(.55, .78, p.y))) * (.7 + .5 * fract(vSeed * 13.3)) * .19;
  if(animal < 0. || dark > .5) c = shadow > .5 ? uSkyCol * .045 + uSunCol * .012 : uSkyCol * .2 + uSunCol * .12;   // the shadow and the waterline: dark; the wake: pale, never brighter than the water's own glitter (live's splash colour)
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// RAVEN (Corvus corax): 0.65 m long, 1.3 m span. Heavy arched bill, shaggy throat, long wedge-shaped tail, five fingered
// primaries; black glossed violet. Bird space: +Z forward, +Y up, metres. One geometry serves the companion and the bird
// we ride. aWing = (side -1 | 0 | +1, span fraction 0 shoulder .. 1 tip, shoulder x, feather seed).
function ravenGeometry(wings = true) {
  const pos = [], nor = [], col = [], wing = [], idx = [];
  const base = C('#161517'), bill = C('#222123'), pale = C('#211f24');
  const v = (x, y, z, nx, ny, nz, c, w) => { pos.push(x, y, z); nor.push(nx, ny, nz); col.push(c.r, c.g, c.b); wing.push(w[0], w[1], w[2], w[3]); return pos.length / 3 - 1; };
  const W0 = [0, 0, 0, 0];
  // body: bill, head, shaggy throat, breast, rump
  const rings = [[-0.21, 0.03, 0.025, 0.0], [-0.13, 0.068, 0.058, 0.0], [-0.02, 0.095, 0.086, 0.0], [0.09, 0.09, 0.088, 0.008], [0.165, 0.068, 0.078, 0.022], [0.215, 0.058, 0.062, 0.05],
    [0.262, 0.046, 0.05, 0.055], [0.285, 0.021, 0.031, 0.048], [0.335, 0.016, 0.024, 0.04], [0.372, 0.004, 0.007, 0.022]];
  const S = 10, ring0 = [];
  rings.forEach((r, i) => {
    ring0.push(pos.length / 3);
    for (let k = 0; k < S; k++) { const th = (k / S) * TAU, cx = Math.sin(th), cy = Math.cos(th), belly = cy < 0 && i >= 3 && i <= 5 ? 1.25 : 1;   // the throat hangs shaggy
      v(cx * r[1], r[3] + cy * r[2] * belly, r[0], cx, cy, 0, i >= 7 ? bill : (cy > 0.3 ? pale : base), W0); }
  });
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < S; k++) { const a = ring0[i] + k, b = ring0[i] + (k + 1) % S, c = ring0[i + 1] + k, d = ring0[i + 1] + (k + 1) % S; idx.push(a, c, b, b, c, d); }
  const tri = (p0, p1, p2, n, c, w0, w1, w2) => { const a = v(p0[0], p0[1], p0[2], n[0], n[1], n[2], c, w0), b = v(p1[0], p1[1], p1[2], n[0], n[1], n[2], c, w1), d = v(p2[0], p2[1], p2[2], n[0], n[1], n[2], c, w2); idx.push(a, b, d); };
  for (let k = 0; k < 7; k++) { const z = 0.1 + k * 0.016, x = (k % 2 ? 1 : -1) * 0.02 * (1 + (k % 3)); tri([x - 0.02, -0.06, z + 0.03], [x + 0.02, -0.06, z + 0.03], [x, -0.125 - 0.012 * (k % 3), z - 0.02], [0, -0.3, 1], base, W0, W0, W0); }   // throat hackles
  for (let k = 0; k < 6; k++) { const x = (k - 2.5) * 0.02; tri([x - 0.016, 0.1, 0.2], [x + 0.016, 0.1, 0.2], [x, 0.12 + 0.01 * (k % 2), 0.13], [0, 1, 0.2], pale, [0, 0, 0, 0.3 + k], [0, 0, 0, 0.3 + k], [0, 0, 0, -1 - k]); }   // nape feathers (they ruffle)
  // tail: a wedge, the middle feathers longest
  for (let k = -3; k <= 3; k++) { const an = k * 0.085, L = 0.3 - 0.028 * Math.abs(k), wd = 0.024, dx = Math.sin(an), dz = -Math.cos(an), px = Math.cos(an) * wd, pz = Math.sin(an) * wd, x0 = k * 0.008, z0 = -0.17;
    const y = 0.006 * (3 - Math.abs(k));
    tri([x0 - px, y, z0 - pz], [x0 + px, y, z0 + pz], [x0 + dx * L + px * 0.7, y - 0.02, z0 + dz * L + pz * 0.7], [0, 1, 0], base, W0, W0, W0);
    tri([x0 - px, y, z0 - pz], [x0 + dx * L + px * 0.7, y - 0.02, z0 + dz * L + pz * 0.7], [x0 + dx * L - px * 0.7, y - 0.02, z0 + dz * L - pz * 0.7], [0, 1, 0], base, W0, W0, W0); }
  // wings: arm with scalloped secondaries, hand of five separated primaries
  const SPAN = 0.62;
  for (const sd of wings ? [-1, 1] : []) {
    const sx = 0.06, w = (x, f) => [sd, sat((x - sx) / (SPAN - sx)), sx, f], P = (x, z) => [sd * x, 0.03, z];
    const arm = [[0.06, 0.1, -0.11], [0.15, 0.115, -0.125], [0.24, 0.11, -0.13], [0.31, 0.09, -0.115]];   // x, leading z, trailing z
    for (let i = 0; i < 3; i++) { const a = arm[i], b = arm[i + 1];
      tri(P(a[0], a[1]), P(b[0], b[1]), P(a[0], a[2]), [0, 1, 0], pale, w(a[0], 0), w(b[0], 0), w(a[0], 0)); tri(P(b[0], b[1]), P(b[0], b[2]), P(a[0], a[2]), [0, 1, 0], base, w(b[0], 0), w(b[0], 0), w(a[0], 0));
      tri(P(a[0], a[2]), P(b[0], b[2]), P((a[0] + b[0]) / 2 + 0.01, a[2] - 0.05), [0, 1, 0], base, w(a[0], 0), w(b[0], 0), w(b[0], 0)); }
    for (let k = 0; k < 5; k++) {   // primaries: fingers fanned from the wrist
      const an = 0.38 - k * 0.27, L = (0.3 + 0.035 * (2 - Math.abs(k - 1.5))), wd = 0.021, x0 = 0.3 - k * 0.012, z0 = 0.075 - k * 0.04, dx = Math.cos(an), dz = Math.sin(an), px = -dz * wd, pz = dx * wd;
      const tip = [x0 + dx * L, z0 + dz * L], f = 0.2 + k * 0.17;
      tri(P(x0 - px, z0 - pz), P(x0 + px, z0 + pz), P(tip[0] + px * 0.55, tip[1] + pz * 0.55), [0, 1, 0], base, w(x0, f), w(x0, f), w(tip[0], f));
      tri(P(x0 - px, z0 - pz), P(tip[0] + px * 0.55, tip[1] + pz * 0.55), P(tip[0] - px * 0.55, tip[1] - pz * 0.55), [0, 1, 0], base, w(x0, f), w(tip[0], f), w(tip[0], f));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 4)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
  return g;
}
// the five fingered primaries of one wingtip of the bird we ride: a fan of pointed feathers, root at the origin, pointing down -Z
function wingtipGeometry(side) {
  const pos = [], nor = [], col = [], wing = [], base = C('#161517'), edge = C('#27252b');
  for (let k = 0; k < 5; k++) {
    const an = side * (k - 2) * 0.17 - side * 0.1, L = 0.62 - 0.05 * Math.abs(k - 1.6), wd = 0.05, dx = Math.sin(an), dz = -Math.cos(an), px = -dz * wd, pz = dx * wd, y = 0.012 * k;
    const b = [dx * 0.04, y, dz * 0.04], l = [dx * L * 0.55 - px, y, dz * L * 0.55 - pz], r = [dx * L * 0.55 + px, y, dz * L * 0.55 + pz], t = [dx * L, y - 0.02, dz * L];
    for (const [q, c] of [[b, base], [l, edge], [t, base], [b, base], [t, base], [r, base]]) { pos.push(q[0], q[1], q[2]); nor.push(0, 1, 0); col.push(c.r, c.g, c.b); wing.push(0, 0, 0, 0.2 + k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return g;
}
const RAVEN_VERT = /* glsl */`
attribute vec4 aWing; attribute vec3 color;
uniform float uFlap, uAmp, uTime, uBias, uSweep;
varying vec3 vN, vWorld, vCol;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; float side = aWing.x, s = aWing.y;
  if(abs(side) > .5){
    // flap from the shoulder; the hand lags and folds on the upstroke, sweeps forward on the downstroke; glide = a shallow dihedral
    float ph = uFlap - 1.0 * s, th = uAmp * (uBias + .85 * sin(ph)) * (.35 + .65 * s) + (1. - uAmp) * (.1 + .05 * sin(uTime * 1.3));
    th -= uAmp * .45 * s * s * max(0., cos(uFlap - .5));
    float r = abs(p.x) - aWing.z, c = cos(th), sn = sin(th), fold = 1. - .22 * uAmp * s * max(0., cos(uFlap));
    float sw = uAmp * uSweep * (.5 - .5 * cos(ph)) * (.4 + .6 * s), cw = cos(sw), sw2 = sin(sw), z0 = p.z;   // the whole wing sweeps forward on the downstroke
    p.z = z0 * cw + r * sw2; r = r * cw - z0 * sw2;
    p.x = side * (aWing.z + r * c * fold); p.y += r * sn;
    p.z += .012 * sin(uTime * 9. + aWing.w * 20.) * s;
    n = vec3(-side * sn, c, 0.);
  } else if(aWing.w < 0.){ p.y += .006 * sin(uTime * 7. + aWing.w * 3.); p.x += .004 * sin(uTime * 5.3 + aWing.w); }
  vec4 wp = modelMatrix * vec4(p, 1.); vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-4, 0.)); vCol = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const RAVEN_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol;
varying vec3 vN, vWorld, vCol;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)); if(dot(N, V) < 0.) N = -N;
  float fres = 1. - abs(dot(N, V)); fres *= fres;
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp;
  float lum = dot(uSkyCol, vec3(.3333));
  vec3 c = vCol * 3.2 * (vec3(lum) * (.6 + .35 * N.y) + uSunCol * (.4 * max(dot(N, uSunDir), 0.) + .12));
  c += uSkyCol * (.012 + .03 * max(N.y, 0.) + .04 * fres) + uSunCol * vec3(.5, .42, .7) * (sp * .3 + .02 * fres);   // glossed blue-violet: never a flat black cut-out
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// THE VARIATION CAST: cave lion (Panthera spelaea: long-legged, maneless, pale sand, tufted tail) and woolly rhino
// (Coelodonta: a low shaggy barrel on short legs, head hung below the shoulder, a flat blade of a front horn sweeping
// forward and a short second one). One builder: lofted body, jointed legs, a head with its own profile, ears, tail, fringe.
// aAnim = (gait phase, weight, part 0 body | 1 leg | 2 head | 3 tail | 4 ear, 0); aPivot = joint; aGlow < 0 = bare dark (nose, eye, horn).
function beastGeometry(sp) {
  const g = new F.Geo(), top = C(sp.top), belly = C(sp.belly), dark = C(sp.dark), S = sp.sides || 10;
  const rings = [{ z: sp.body[0][0] - 0.08, y: (sp.body[0][1] + sp.body[0][2]) / 2, rx: 0, ry: 0 }];
  for (const p of sp.body) rings.push({ z: p[0], y: (p[1] + p[2]) / 2, rx: p[3], ry: (p[1] - p[2]) / 2 });
  const body = g.loft(rings, { sides: S, top, belly, shade: [-0.4, 0.4] });
  g.paint(body, (x, y, z, c) => { const n = Math.sin(x * 9.1 + z * 5.3) * Math.sin(z * 7.7 - y * 6.1); c.multiplyScalar(1 + 0.1 * n); if (sp.saddle) c.lerp(dark, sp.saddle * sstep(0.2, 0.9, Math.sin(z * 2.2 + 1) * 0.5 + 0.5) * sstep(0.6, 1, y / sp.body[2][1])); });
  // head: its own loft along a pitched axis, then ears, nose, eye, horns
  const H = sp.head, cp = Math.cos(H.pitch), sn = Math.sin(H.pitch), put = (r) => g.move(r, (v) => { const y = v.y * cp - v.z * sn, z = v.z * cp + v.y * sn; v.y = y + H.at[1]; v.z = z + H.at[2]; });
  const hr = [{ z: H.rings[0][0] - 0.05, y: 0, rx: 0, ry: 0 }]; for (const r of H.rings) hr.push({ z: r[0], y: r[3] || 0, rx: r[1], ry: r[2] }); hr.push({ z: H.rings[H.rings.length - 1][0] + 0.03, y: H.rings[H.rings.length - 1][3] || 0, rx: 0, ry: 0 });
  const parts = [g.loft(hr, { sides: S, top, belly, shade: [-0.3, 0.5] })];
  const zN = H.rings[H.rings.length - 1][0];
  g.paint(parts[0], (x, y, z, c) => { if (z > zN - 0.035) c.copy(dark); });
  for (const sx of [-1, 1]) {
    const e = H.ear; parts.push(g.anim(g.fan([[sx * e[0], e[1], e[2]], [sx * (e[0] - e[3] * 0.6), e[1] + e[3] * 0.2, e[2] + 0.02], [sx * (e[0] + e[3] * 0.1), e[1] + e[3], e[2] - 0.02], [sx * (e[0] + e[3] * 0.7), e[1] + e[3] * 0.5, e[2]], [sx * (e[0] + e[3] * 0.6), e[1], e[2] + 0.02]], top, dark), () => [sx > 0 ? 0.2 : 0.7, 1, 2, 0]));
    const y = H.eye; parts.push(g.glow(g.blob(sx * y[0], y[1], y[2], 0.022, 0.022, 0.022, dark, dark, 5, 3), -1));
  }
  for (const h of H.horns || []) { const r = g.tube(h.pts, h.radii, 6, C(h.c0), C(h.c1)); g.move(r, (v) => { v.x *= h.flat; }); g.glow(r, -1); parts.push(r); }
  for (const r of parts) { put(r); g.anim(r, (x, y, z) => [0, 1, 2, 0]); g.pivot(r, 0, H.neck[1], H.neck[2]); }
  // legs: shoulder / hip, elbow / knee, wrist / hock, foot. Trot: diagonal pairs together.
  for (const L of sp.legs) for (const sx of [-1, 1]) {
    const pts = L.pts.map((p) => [sx * (L.x + (p[2] || 0)), p[0], p[1]]), r = g.tube(pts, L.radii, 7, top, belly), hipY = L.pts[0][0];
    g.anim(r, (x, y) => [L.phase + (sx > 0 ? 0 : 0.5), sat((hipY - y) / hipY), 1, 0]); g.pivot(r, sx * L.x, hipY, L.pts[0][1]);
    const f = g.blob(sx * L.x, 0.035, L.pts[L.pts.length - 1][1] + L.foot[1] * 0.35, L.foot[0], 0.04, L.foot[1], dark, dark, 6, 3);
    g.anim(f, () => [L.phase + (sx > 0 ? 0 : 0.5), 1, 1, 0]); g.pivot(f, sx * L.x, hipY, L.pts[0][1]);
  }
  const T = sp.tail, tr = g.tube(T.pts, T.radii, 5, top, T.tuft ? dark : top), t0 = T.pts[0], tl = T.pts.length - 1;
  g.anim(tr, (x, y, z) => [0, sat(Math.hypot(y - t0[1], z - t0[2]) / (Math.hypot(T.pts[tl][1] - t0[1], T.pts[tl][2] - t0[2]) + 0.3)), 3, 0]);
  if (T.tuft) g.anim(g.blob(T.pts[tl][0], T.pts[tl][1], T.pts[tl][2], T.tuft, T.tuft, T.tuft * 1.8, dark, dark, 5, 3), () => [0, 1, 3, 0]);
  // shag: a ragged fringe under belly and along the flanks (woolly rhino), each lock a single triangle
  if (sp.fringe) for (const sx of [-1, 1]) for (let i = 0; i < sp.fringe.n; i++) {
    const t = i / (sp.fringe.n - 1), z = lerp(sp.fringe.z[0], sp.fringe.z[1], t), k = Math.abs(Math.sin(i * 12.99 + sx)) , y = sp.fringe.y + 0.1 * k, x = sx * sp.fringe.x * (0.85 + 0.2 * Math.sin(t * Math.PI));
    const a = g.v(x, y, z - 0.07, top), b = g.v(x, y, z + 0.07, top), c = g.v(x * 1.04, y - sp.fringe.len * (0.6 + 0.8 * k), z - 0.03, belly); g.tri(a, b, c);
  }
  return g.build();
}
const LION = {
  top: '#C9A468', belly: '#E8D8B0', dark: '#3a2c22', sides: 10,
  body: [[-1.0, 1.06, 0.8, 0.13], [-0.86, 1.16, 0.66, 0.26], [-0.56, 1.18, 0.6, 0.31], [-0.16, 1.14, 0.64, 0.275], [0.24, 1.19, 0.52, 0.32], [0.54, 1.24, 0.53, 0.32], [0.76, 1.24, 0.62, 0.26], [0.92, 1.27, 0.76, 0.2]],
  head: { at: [0, 1.36, 1.13], pitch: 0.2, neck: [0, 1.14, 0.8], rings: [[-0.3, 0.17, 0.2, -0.05], [-0.12, 0.185, 0.19], [0.03, 0.185, 0.17], [0.14, 0.14, 0.135, -0.02], [0.28, 0.115, 0.105, -0.04], [0.35, 0.085, 0.075, -0.04]],
    ear: [0.115, 0.13, -0.08, 0.085], eye: [0.125, 0.065, 0.1] },
  legs: [{ x: 0.2, phase: 0, radii: [0.14, 0.1, 0.065, 0.07], foot: [0.09, 0.115], pts: [[0.98, 0.5], [0.62, 0.46], [0.3, 0.52], [0.05, 0.53]] },
    { x: 0.2, phase: 0.5, radii: [0.18, 0.115, 0.06, 0.065], foot: [0.085, 0.11], pts: [[1.0, -0.62], [0.6, -0.5], [0.33, -0.76], [0.05, -0.68]] }],
  tail: { pts: [[0, 1.04, -1.0], [0, 0.8, -1.28], [0, 0.5, -1.44], [0, 0.32, -1.6], [0, 0.36, -1.82]], radii: [0.05, 0.04, 0.032, 0.028, 0.026], tuft: 0.045 },
};
const RHINO = {
  top: '#6A4A30', belly: '#8a6846', dark: '#2e221a', sides: 12, saddle: 0.35,
  body: [[-1.62, 1.22, 0.86, 0.2], [-1.42, 1.42, 0.64, 0.45], [-0.92, 1.5, 0.5, 0.6], [-0.3, 1.47, 0.45, 0.66], [0.3, 1.58, 0.47, 0.64], [0.72, 1.67, 0.54, 0.56], [1.02, 1.56, 0.6, 0.45], [1.24, 1.38, 0.64, 0.36]],
  head: { at: [0, 0.98, 1.6], pitch: 0.55, neck: [0, 1.2, 1.1], rings: [[-0.4, 0.27, 0.27], [-0.18, 0.26, 0.25], [0.08, 0.21, 0.2], [0.34, 0.165, 0.17], [0.56, 0.15, 0.15], [0.68, 0.11, 0.1]],
    ear: [0.17, 0.2, -0.3, 0.11], eye: [0.2, 0.06, 0.02],
    horns: [{ flat: 0.38, c0: '#4a3a2a', c1: '#8a7658', radii: [0.14, 0.12, 0.085, 0.03], pts: [[0, 0.1, 0.5], [0, 0.42, 0.66], [0, 0.78, 0.7], [0, 1.08, 0.62]] },
      { flat: 0.5, c0: '#4a3a2a', c1: '#7a6648', radii: [0.1, 0.07, 0.02], pts: [[0, 0.14, 0.16], [0, 0.3, 0.2], [0, 0.42, 0.2]] }] },
  legs: [{ x: 0.37, phase: 0, radii: [0.21, 0.15, 0.11, 0.12], foot: [0.14, 0.15], pts: [[0.82, 0.86], [0.5, 0.83], [0.24, 0.87], [0.05, 0.87]] },
    { x: 0.36, phase: 0.5, radii: [0.25, 0.16, 0.11, 0.12], foot: [0.14, 0.15], pts: [[0.84, -1.06], [0.5, -0.98], [0.26, -1.12], [0.05, -1.08]] }],
  tail: { pts: [[0, 1.26, -1.62], [0, 1.0, -1.74], [0, 0.72, -1.76]], radii: [0.05, 0.035, 0.03], tuft: 0.04 },
  fringe: { n: 26, z: [-1.3, 1.15], y: 0.62, x: 0.6, len: 0.32 },
};
const BEAST_VERT = /* glsl */`
attribute vec4 aAnim; attribute vec3 aPivot, color; attribute float aGlow;
uniform float uGait, uMove, uTime, uRise, uSeed;
varying vec3 vN, vWorld, vObj, vCol; varying float vBare;
#include <fog_pars_vertex>
void rotX(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); }
void main(){
  vec3 p = position, n = normal; float part = aAnim.z, w = aAnim.y;
  if(part > .5 && part < 1.5){            // legs swing from shoulder and hip, the lower leg lifts as it comes forward
    float ph = uGait + aAnim.x * 6.2832, ang = uMove * .5 * sin(ph);
    vec3 d = p - aPivot; rotX(d, ang); rotX(n, ang); d.y += w * w * .11 * uMove * max(0., cos(ph)); p = aPivot + d;
  } else if(part > 1.5 && part < 2.5){    // head: nods with the stride; at rest it turns to watch
    vec3 d = p - aPivot; float yaw = .32 * sin(uTime * .45 + uSeed * 5.) * (1. - uMove), c = cos(yaw), s = sin(yaw);
    d.xz = vec2(d.x * c + d.z * s, d.z * c - d.x * s); n.xz = vec2(n.x * c + n.z * s, n.z * c - n.x * s);
    rotX(d, .05 * sin(2. * uGait) * uMove + .03 * sin(uTime * .7 + uSeed));
    p = aPivot + d;
  } else if(part > 2.5 && part < 3.5){    // tail: swishes, the tip flicks
    p.x += w * w * (.2 * sin(uTime * 1.7 + uSeed * 3.) + .1 * w * w * sin(uTime * 6.3 + uSeed));
  }
  p.y += uMove * .035 * sin(2. * uGait + .6);
  if(part < .5) p.x *= 1. + .014 * sin(uTime * 1.3 + uSeed * 4.);      // the flank breathes
  p.y *= mix(.46, 1., uRise);                                         // crouched in the grass until it rises
  vObj = position; vCol = color; vBare = aGlow;
  vec4 wp = modelMatrix * vec4(p, 1.); vWorld = wp.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-4, 0.));
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const BEAST_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; uniform float uExpo, uShag;
varying vec3 vN, vWorld, vObj, vCol; varying float vBare;
#include <fog_pars_fragment>
${GLSL_GN}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)); if(dot(N, V) < 0.) N = -N;
  float ndl = dot(N, uSunDir), wrap = max(0., (ndl + .5) / 1.5), back = max(0., -dot(V, uSunDir)), fres = 1. - abs(dot(N, V)); fres *= fres;
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * .5 + .5);
  float dist = length(cameraPosition - vWorld), fade = 1. - smoothstep(18., 60., dist);
  float st = gn(vec2((vObj.z + vObj.x * .7) * 24., vObj.y * 5.)), cl = gn(vObj.zy * 3.1 + vObj.x * 1.7);
  vec3 base = vCol * mix(1., (.72 + .42 * st) * (.86 + .28 * cl), uShag * fade);
  vec3 c = base * (uSunCol * wrap * wrap + hemi) + base * uSunCol * fres * fres * (.12 + 1.8 * back * back) + base * uSkyCol * fres * .3;
  if(vBare < -.5) c = vCol * (hemi * .5 + uSunCol * wrap * .5) + uSunCol * fres * fres * .05;
  gl_FragColor = vec4(c * uExpo, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// FIVE BARS OF HIGH CLOUD, level across the sky on the sun's side: strips on a far cylinder that follows the camera.
// uv.x runs along a bar (0..1), uv.y across it (-1 bottom .. 1 top); aSeed = bar seed.
function barsGeometry(rng, sunAz) {
  const pos = [], uv = [], seed = [], idx = [], RAD = 3300, SEG = 28;
  for (let b = 0; b < 5; b++) {
    const el = (4.5 + b * 3.1 + rng.range(-0.6, 0.6)) * Math.PI / 180, half = rng.range(34, 62) * Math.PI / 180, mid = (sunAz + rng.range(-34, 34)) * Math.PI / 180, th = rng.range(0.8, 1.5) * Math.PI / 180, sd = rng();
    const v0 = pos.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG, az = mid + (t * 2 - 1) * half, sag = -0.25 * Math.PI / 180 * Math.sin(t * 7 + sd * 9);
      for (const sy of [-1, 1]) { const e = el + sag + sy * th; pos.push(Math.sin(az) * RAD, Math.tan(e) * RAD, -Math.cos(az) * RAD); uv.push(t, sy); seed.push(sd); }
    }
    for (let i = 0; i < SEG; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1)); g.setIndex(idx);
  return g;
}
// (m7) live's five bars lay level and evenly one above the other, 3.1 degrees apart. Their geometry is live's, as dealt; here each
// WAVERS along its length, TILTS end to end (its own way), and SWELLS in stretches (aTh: its own half-thickness on the shell,
// taken from live's mesh): the strip only ever grows, and live's body is drawn in it at live's own size (vT).
// (Mend 2) the first m7's waver (under half a degree) and tilt (1.9 degrees end to end) did not show: the bars still read as
// ruled, level, evenly spaced stripes. Now a bar wavers by up to 1.6 degrees (two slow swings of 1.05 and 0.6 degrees: half the
// spacing of the bars, so the gaps between them open and close) and tilts by up to 5.2 degrees end to end (its ends are
// feathered out): no two lie parallel, some run together.
const BARS_VERT = /* glsl */`
attribute float aSeed, aTh; varying vec2 vUV; varying float vSeed, vT;
void main(){
  vUV = uv; vSeed = aSeed;
  float w = uv.x * 6.2832, sd = aSeed * 40.;
  vT = 1. + .34 * (.5 + .5 * sin(w * 2.3 + sd * 2.3)) + .2 * (.5 + .5 * sin(w * 5.9 + sd));
  vec3 p = position;
  p.y += uv.y * aTh * (vT - 1.) + 18. + 60. * sin(w * 1.3 + sd) + 34. * sin(w * 3.1 + sd * 1.7) + (uv.x - .5) * 300. * (fract(aSeed * 7.3) - .5) * 2.;   // (18: a third of a degree up. With Mend 2's wider swing the low end of the lowest bar can go down behind the far ridges, which stand before it as before any low cloud: the bars lie on the far shell behind all land)
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}
`;
const BARS_FRAG = /* glsl */`
uniform vec3 uLit, uShade; uniform float uAlpha, uTime;
varying vec2 vUV; varying float vSeed, vT;
${GLSL_GN}
void main(){
  float T = clamp(vT, 1., 1.6), x = vUV.x * 60. + vSeed * 40. + uTime * .02, y = vUV.y * T;   // y: live's own across coordinate (the strip is T times live's)
  float n = gn(vec2(x, y * 1.5 + vSeed * 9.)) * .6 + gn(vec2(x * 3.1, y * 3. + 4.)) * .4;
  float ends = smoothstep(0., .22, vUV.x) * (1. - smoothstep(.78, 1., vUV.x));
  float body = (1. - smoothstep(.25, 1., abs(y + .25 * (n - .5)))) * ends * smoothstep(.2, .6, n + .35 * ends);
  // (m7) a feathered edge: combed wisps trail off the body into the swollen strip; all fades before the strip's own edge. The body itself is live's or more: nothing thins it
  float n3 = gn(vec2(x * .55 + 9., y * 4.2 + vSeed * 17.)), yo = clamp(abs(vUV.y), 0., 1.);
  float wisp = smoothstep(.42, .72, n3) * (1. - smoothstep(.55, 1., yo)) * ends * .62;
  body = max(body, wisp) * (1. - smoothstep(.93, 1., yo));
  vec3 c = mix(uLit, uShade, smoothstep(-.5, .7, y + .5 * (n - .5)));   // lit from below
  gl_FragColor = vec4(c, clamp(body, 0., 1.) * uAlpha);
}
`;

// ---------------------------------------------------------------------------------------------------------
// (m7) THREE DOZEN HIGH BANDS ALL ROUND THE SKY. They lie in one level sheet far above (as the high wind lays cirrus: in
// streets, all roughly one way), so from below they are not rings about the zenith and not a ladder: each runs its own way
// across the sky at its own height, length and thickness, bent, swollen and pinched.
// (Mend 1) HOW BROAD A BAND IS SEEN GROWS WITH ITS HEIGHT ABOVE THE HORIZON, cross-section by cross-section (broadAt): near
// the horizon a level sheet is seen edge-on and a band is a thin streak, as live's bars are; from 8 degrees up it widens,
// and from 30 degrees up it is 4.2 times as broad (5 to 13 degrees to either side of its middle) and no longer than 2.4
// times that: a soft sheet or patch. So a band that runs up the sky flares as it climbs, and nothing thin stands high
// (a thin bright line high in the sky is a vapour trail, and nothing here is made).
// Every vertex carries the clear sky's own colour behind it (the kit's sky.colorAt), so a band away from the sun can be
// DARKER than the sky at its shaded edge and brighter at its lit one.
// uv = (along 0..1, across -1..1); aB = (seed, how squarely its +across edge faces the sun's quarter -1..1, how broad 0..1, noise cells along it)
function bandsGeometry(rng, sunDir, colorAt) {
  const pos = [], uv = [], ab = [], sk = [], idx = [], N = 36, SEG = 14, H = 330, RAD = 3300, DEG = Math.PI / 180;
  const sh = Math.hypot(sunDir.x, sunDir.z) || 1, wind = Math.atan2(sunDir.x, -sunDir.z) + Math.PI / 2 + rng.range(-0.3, 0.3),   // the high wind lies across the sun's bearing, within 17 degrees: toward the sun and away from it the streets lie level, as live's bars do
    sx = sunDir.x / sh, sz = sunDir.z / sh, d = new THREE.Vector3(), col = new THREE.Color();
  const broadAt = (el) => 1 + 3.2 * sstep(8 * DEG, 30 * DEG, el);
  for (let b = 0; b < N; b++) {
    const el = (5.5 + 50 * Math.pow(rng(), 1.6)) * DEG, az = rng() * Math.PI * 2, r = H / Math.tan(el), slant = H / Math.sin(el);
    const dir = wind + rng.range(-0.2, 0.2), half0 = slant * rng.range(0.16, 0.62), ang = rng.range(0.02, 0.055), bend = rng.range(-0.14, 0.14), sd = rng();
    const angC = ang * broadAt(el), lenA = half0 / slant, broad = sstep(12 * DEG, 26 * DEG, el), half = slant * lerp(lenA, Math.min(lenA, 2.4 * angC), broad);   // (a high patch is at most 2.4 times as long as it is broad)
    const ux = Math.sin(dir), uz = -Math.cos(dir), vx = Math.cos(dir), vz = Math.sin(dir), cx = r * Math.sin(az), cz = -r * Math.cos(az);
    const arC = Math.abs(vx * Math.sin(az) - vz * Math.cos(az)), litA = vx * sx + vz * sz, v0 = pos.length / 3, cells = Math.max(4, 1.75 * (half / slant) / (ang * Math.max(broadAt(el), 1 + 2.4 * (1 - arC * arC))));   // (its fibres run a little longer along it than across)
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG, e = t * 2 - 1, lat0 = bend * half * e * e, px = cx + ux * e * half + vx * lat0, pz = cz + uz * e * half + vz * lat0;
      // this cross-section's own distance and height above the horizon, and the width on the sheet that is seen `ang * broadAt` radians thick from below, however the band lies
      const hr = Math.hypot(px, pz) || 1, sl = Math.hypot(hr, H), eli = Math.asin(H / sl), ar = Math.abs(vx * px + vz * pz) / hr;
      const w = Math.min(0.7 * H, sl * ang * Math.max(broadAt(eli), 1 + 2.4 * (1 - ar * ar)) / Math.sqrt(ar * ar * Math.sin(eli) * Math.sin(eli) + (1 - ar * ar)));   // (a street that runs toward us or away is seen along its sheet, not edge-on: 3.4 times as broad, a fan and not a line)
      const lat = lat0 * (1 - 0.85 * broad) + (0.5 * w * Math.sin(t * 5 + sd * 20) + 0.15 * w * Math.sin(t * 13 + sd * 47)) * (1 - 0.8 * broad);   // (Mend 2) a broad short patch neither bends nor wobbles: it lay hooked, a chevron
      const wd = w * (0.55 + 0.45 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.6)) * (1 + 0.4 * Math.sin(t * 11 + sd * 31));
      for (const sy of [-1, 1]) {
        d.set(cx + ux * e * half + vx * (lat + sy * wd), H, cz + uz * e * half + vz * (lat + sy * wd)).normalize();
        pos.push(d.x * RAD, d.y * RAD, d.z * RAD); uv.push(t, sy); ab.push(sd, litA, broad, cells);
        colorAt(d, col); sk.push(col.r, col.g, col.b);
      }
    }
    for (let i = 0; i < SEG; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setAttribute('aSky', new THREE.Float32BufferAttribute(sk, 3)); g.setIndex(idx);
  return g;
}
const BANDS_VERT = /* glsl */`
attribute vec4 aB; attribute vec3 aSky; varying vec2 vUV; varying vec4 vB; varying vec3 vSky, vDir;
void main(){ vUV = uv; vB = aB; vSky = aSky; vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;
const BANDS_FRAG = /* glsl */`
uniform vec3 uLit, uShade, uSunDir; uniform float uAlpha, uTime;
varying vec2 vUV; varying vec4 vB; varying vec3 vSky, vDir;
${GLSL_GN}
void main(){
  vec3 dir = normalize(vDir + vec3(0., 1e-4, 0.));
  float seed = vB.x, x = vUV.x * vB.w + seed * 40. + uTime * .012, y = clamp(vUV.y, -1., 1.), yo = abs(y);
  float n = gn(vec2(x, y * 1.4 + seed * 9.)) * .6 + gn(vec2(x * 3.1, y * 3. + 4.)) * .4, n3 = gn(vec2(x * .7 + 2., y * 2.4 + seed * 3.));
  float broad = clamp(vB.z, 0., 1.), ends = smoothstep(0., mix(.2, .4, broad), vUV.x) * (1. - smoothstep(mix(.8, .6, broad), 1., vUV.x));   // (a broad patch feathers out over more of its length)
  float strch = smoothstep(.3, .62, gn(vec2(x * .16 + seed * 13., seed * 5.)) + .25 * ends);                          // it comes in stretches, with clear sky between
  float body = (1. - smoothstep(.12, .95, abs(y + .3 * (n - .5)))) * ends * smoothstep(.2, .6, n + .3 * ends) * (.25 + .75 * strch);   // soft rims; it breaks where the noise runs low
  float wisp = (1. - smoothstep(.4, 1., yo)) * ends * smoothstep(.44, .8, n3) * .45;                                // soft wisps beside and between
  float a = max(body, wisp) * (1. - smoothstep(.86, 1., yo));
  float sunward = smoothstep(-.15, .75, dot(dir, uSunDir));                    // 1 on the sun's side of the sky
  float litk = smoothstep(-.75, .8, y * clamp(vB.y, -1., 1.) * 1.4 + .7 * (n - .5));   // its edge toward the sun's quarter is lit, the other in its own shade
  vec3 warm = mix(uShade, uLit, litk);
  vec3 cool = mix(vSky * vec3(.66, .7, .79), mix(vSky, uLit, .45), litk);      // away from the sun: darker and cooler than the sky behind at the shaded edge, brighter at the lit one
  vec3 c = mix(cool, warm, sunward);
  a *= 1. - smoothstep(.9925, .9986, dot(dir, uSunDir));                       // the sun's disc stays clear (from 7 degrees off it to 3)
  a *= smoothstep(.05, .085, dir.y);                                           // nothing below 3 degrees: the far ridges stand there
  gl_FragColor = vec4(c, clamp(a, 0., 1.) * uAlpha);
}
`;
