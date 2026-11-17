// HEADS ABOVE THE POPLARS · 28 million years ago (mid-Oligocene, Turgai plain of Kazakhstan).
// A windy autumn afternoon on a young flood bar grown with gold willow scrub and young poplar. A backwater of the braided
// river (the slough) cuts the bar, and we fly low up it: Paraceratherium, hornless rhinos 4.8 m at the shoulder, walk its
// sandy bank and drink in it, heads above the willow and the poplars. We pass the family one by one, rise once for the long
// view, come down beside the old cow as she strips a poplar bough, cross a pool where two more stand mirrored, go down a
// broad ride into a gold-roofed glade where the last cow lowers her head to her calf, then burst out over the river bars
// as cranes go up, to a portal standing between two leaning poplars on a gravel island.
//
// WORLD SPACE = the hero's local space (src/parts/treetop-giants.js): the leader stands at the origin facing +Z, the
// camera comes down -Z along her -X side, the low sun stands at -X (on our left for the whole flight).
// Everything is built in build(); update() only writes uniforms and instance attributes.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { buildHero, makeParaceratherium, prepareParaceratherium, instanced, pushTube, GLSL_NOISE } from '../parts/treetop-giants.js';

const PAL = ['#E3B23C', '#2E5FA8', '#8C8377', '#C9C2B2', '#4A3A2A', '#6FA79A', '#B5562B'];
const TAU = Math.PI * 2;
const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
// the route (x, y, z): level entry, down to 2-3 m over the slough's shallows, one rise for the long view, low round the leader at 10 m, the pool, the ride, the glade, the bars
const ROUTE = [
  [-2, 6.5, 196], [-2, 6.35, 181], [-2.4, 4.3, 164], [-3.2, 2.6, 147], [-4.6, 2.2, 129], [-6.6, 2.5, 112], [-9.6, 4.6, 94], [-12, 7.9, 75], [-13.5, 6.4, 48],   // down over the slough, low past two of the family, up for the long view
  [-9.4, 3.4, 4.6], [-10.4, 3.3, -2.6], [-7.8, 3.3, -9.2], [-2.0, 3.3, -12.4], [4.0, 3.4, -12.2], [10.0, 3.5, -14.0], [15.5, 3.6, -20.5], [20, 3.6, -31], [24.6, 3.5, -43.5],   // a third of a circle round the leader at 10 m, low over the sand of her bank, then over the pool
  [33.5, 3.0, -57], [44.5, 2.4, -70.5], [57, 2.15, -86], [70, 2.15, -102], [82, 2.5, -117], [96, 3.0, -137], [107, 2.8, -160], [113.5, 2.8, -186], [118, 3.3, -212], [123.1, 5.5, -241], [128.3, 7.5, -270.3],   // low over the braids, past two of the family, then up to the ring
  [131.8, 7.6, -290], [135.3, 7.6, -309.7],   // the last two points lengthen the run over the bars
];
const ROUTE_TAIL = 2;   // points added beyond the route every scripted u was written for
const DUR = 46, WALK = 1.5, HERO_YAW = 0.55, Y_AXIS = new THREE.Vector3(0, 1, 0);   // the leader stands turned, so that we come up on her quarter and see her neck slope
// speed against the average (the brief's pace): brisk entry, slowest round the leader, quick dive, over the bars fast
const pace = (u) => 1.15 - 0.33 * smoothstep(0.03, 0.09, u) + 0.05 * smoothstep(0.2, 0.26, u) - 0.2 * smoothstep(0.24, 0.36, u) + 0.48 * smoothstep(0.43, 0.52, u)
  - 0.28 * smoothstep(0.55, 0.6, u) - 0.36 * smoothstep(0.628, 0.644, u) * (1 - smoothstep(0.66, 0.685, u)) + 0.57 * smoothstep(0.69, 0.76, u) - 0.38 * smoothstep(0.93, 1.03, u);

export default {
  id: 'treetop-giants',
  name: 'Heads above the Poplars',
  category: 'prehistoric',
  weirdness: 0.2,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, Q = ctx.quality || { detail: 1 }, detail = clamp(Q.detail ?? 1, 0.5, 1);
    const tick = async () => { if (ctx.yield) await ctx.yield(); };
    // ---- the visit: season, wind, cast (every draw in a fixed order, before anything else)
    const rSeason = rng(), rWind = rng(), rExtra = rng(), rHy = rng(), rCrane = rng(), rSide = rng();
    let season = rSeason < 0.42 ? 'gold' : rSeason < 0.72 ? 'early' : 'frost';
    if (vary.hour === 'golden' && season === 'early') season = 'gold';
    const wind = vary.rare ? 'steady' : rWind < 0.5 ? 'steady' : rWind < 0.75 ? 'calm' : 'blow';
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const extras = rExtra < 0.5 ? 1 : 2, nHyaena = rHy < 0.6 ? 1 : 2, whiteCranes = rCrane < 0.3;
    const sunEl = (season === 'early' ? 24 : season === 'frost' ? 10 : 16) + (vary.hour === 'golden' ? -3 : vary.hour === 'day' ? 4 : 0);
    const scene = new THREE.Scene();
    // Every scripted u below was written for the route without its last two points. So the world keeps working in that
    // "script" u: `path` is the real path read in script u (script u 1 = the old end, KO = the real end), and the engine is
    // handed the real path, with u converted at the door (update, pois, pace).
    const pathR = makePath(ROUTE), LO = makePath(ROUTE.slice(0, ROUTE.length - ROUTE_TAIL)).length, KO = pathR.length / LO;
    const path = { length: LO, posAtDist: (d, o) => pathR.posAtDist(d, o), tangentAtDist: (d, o) => pathR.tangentAtDist(d, o),
      pointAt: (u, o = new THREE.Vector3()) => pathR.posAtDist(u * LO, o), tangentAt: (u, o = new THREE.Vector3()) => pathR.tangentAtDist(u * LO, o),
      nearestXZ: (x, z) => { const r = pathR.nearestXZ(x, z); return { ...r, u: r.u * KO }; }, y: pathR.y };
    const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Vector3();

    // ---- sky: hard cobalt, pale at the rim, combed cirrus sliding on the wind; the sun low on the left (-X)
    const frosty = season === 'frost';
    await tick();
    const sky = makeSky({ rng, preset: 'day', zenith: frosty ? '#2a5aa6' : '#23539f', mid: frosty ? '#5d8fce' : '#4c82c8', horizon: frosty ? '#b7cfe6' : '#9FC0E0', ground: '#8f9b8c',
      horizonPow: 5, sunElevation: sunEl, sunAzimuth: -92, sunColor: frosty ? '#ffe9c4' : '#ffdf9e', sunSize: 1.3, sunIntensity: 11, sunGlow: 0.5,
      scatterColor: frosty ? '#f3d9b8' : '#f1d59a', scatter: 0.22, clouds: false,
      clouds2: { coverage: frosty ? 0.3 : 0.42, stretch: 1, scale: 1.3, opacity: 0.8, wind: [0.03, 0.022], lit: '#ffeed2', shade: '#a2b4d4' } });
    scene.add(sky.object);
    await tick();
    const fogCol = col(frosty ? '#c6d5e6' : '#B9CCE0', 0.86);
    scene.fog = new THREE.FogExp2(fogCol, 0.00105);
    scene.background = fogCol.clone();
    // two lights for the kit's lit materials; every shader of this world takes the same values as uniforms
    const sunDir = new THREE.Vector3(-Math.cos(sunEl * Math.PI / 180), Math.sin(sunEl * Math.PI / 180), 0.06).normalize();
    const sunHex = frosty ? '#ffdcaa' : season === 'early' ? '#ffdfa2' : '#ffcb80', sunInt = frosty ? 2.7 : 3.1;
    const sunLight = new THREE.DirectionalLight(sunHex, sunInt); sunLight.position.copy(sunDir).multiplyScalar(300); scene.add(sunLight, sunLight.target);
    const hemi = new THREE.HemisphereLight('#7fa6de', '#8a7440', 1.05); scene.add(hemi);
    const sunCol = col(sunHex, sunInt / Math.PI), skyCol = col('#9ab2da', 1.1 / Math.PI), groundCol = col('#c9a040', 2.3 / Math.PI);
    if (frosty) skyCol.copy(col('#b6c8e6', 1.7 / Math.PI));
    const LIGHT = { sunDir, sunColor: sunCol, sky: skyCol, ground: groundCol };
    await tick();

    // ---- the hero: the leader at feed in her poplar clump (the world plants the willow and scripts the family itself)
    const hero = await buildHero(ctx, { palette: PAL, detail, season, wind, blizzard: rare, herd: false, willow: false, sunDir: [sunDir.x, sunDir.y, sunDir.z], adoptLight: false, progress: 0, yaw: HERO_YAW });
    await tick();
    hero.setLight(LIGHT); scene.add(hero.object);
    const heroClumps = (hero.anchors.clumps || [hero.anchors.clump]).map((c) => c.clone().applyAxisAngle(Y_AXIS, HERO_YAW));   // in world space
    const S = hero.uniforms.shared, K = hero.kit, leafU = hero.uniforms.leaf, airU = hero.uniforms.air, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const wd = S.uWindDir.value, windK = S.uWind.value;
    if (frosty) { leafU.uFrost.value.copy(col('#eef3f8', 0.92)); leafU.uFrostK.value = 0.8; }
    leafU.uSilver.value.copy(col(PAL[3], 0.95).lerp(col('#a3bda4', 0.95), 0.34));   // silver-sage: a cool sheen over the gold, never beige
    await tick();

    // ---- the lie of the land, as plain functions of (x, z)
    const N2 = ctx.noise, PL = [];
    for (let i = 0; i <= 300; i++) { const u = Math.min(i / 260, KO); path.pointAt(u, _v); PL.push([_v.x, _v.z, _v.y, u]); if (u >= KO) break; }
    const nearP = (x, z) => { let b = 1e18, bi = 0; const N = PL.length;   // nearest route point: every fourth, then its neighbours
      for (let i = 0; i < N; i += 4) { const dx = x - PL[i][0], dz = z - PL[i][1], d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } }
      for (let i = Math.max(0, bi - 3), hi = Math.min(N - 1, bi + 3); i <= hi; i++) { const dx = x - PL[i][0], dz = z - PL[i][1], d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } }
      return { d: Math.sqrt(b), u: PL[bi][3], y: PL[bi][2], i: bi }; };
    // at(u, side): the point `side` metres to the right of the route at script u. Thousands of plants are placed with it, so it
    // reads a table of the route laid down every half metre instead of asking the curve each time.
    const TBS = 0.5, TBN = Math.ceil(pathR.length / TBS) + 1, TB = new Float32Array(TBN * 3);
    for (let i = 0; i < TBN; i++) { pathR.posAtDist(Math.min(i * TBS, pathR.length), _v); TB[i * 3] = _v.x; TB[i * 3 + 1] = _v.y; TB[i * 3 + 2] = _v.z; if (i % 120 === 119) await tick(); }
    const at = (u, side = 0, out = new THREE.Vector3()) => {   // side > 0 = to the right of travel
      const f = clamp(u * LO / TBS, 0, TBN - 1.001), i = Math.floor(f), t = f - i, a = i * 3, i0 = Math.max(0, i - 1) * 3, i1 = Math.min(TBN - 1, i + 2) * 3;
      const tx = TB[i1] - TB[i0], ty = TB[i1 + 1] - TB[i0 + 1], tz = TB[i1 + 2] - TB[i0 + 2], l = Math.hypot(tx, ty, tz) || 1;
      return out.set(TB[a] + (TB[a + 3] - TB[a]) * t - tz / l * side, TB[a + 1] + (TB[a + 4] - TB[a + 1]) * t, TB[a + 2] + (TB[a + 5] - TB[a + 2]) * t + tx / l * side); };
    const segD = (x, z, a, b) => { const ex = b.x - a.x, ez = b.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez), 0, 1); return Math.hypot(x - a.x - ex * t, z - a.z - ez * t); };
    const U_LANE = 0.47, U_BAR = 0.708, gA = at(0.594, 6.5), gB = at(0.676, 6.0), barEdge = at(U_BAR), barDir = path.tangentAt(U_BAR).clone().setY(0).normalize();
    const endP = pathR.pointAt(1).clone(), endDir = pathR.tangentAt(1).clone().setY(0).normalize(), startP = path.pointAt(0).clone();
    // two more trampled lanes leaving the glade (the third is the one we fly down)
    const lane2 = [at(0.63, 14), at(0.6, 40), at(0.55, 62), at(0.5, 70)], lane3 = [at(0.6, -4), at(0.58, -30), at(0.6, -52), at(0.66, -72)];
    const eG = [{ x: 1.5, z: 173 }, { x: 0.3, z: 130 }, { x: -4, z: 93 }], egD = (x, z) => Math.min(segD(x, z, eG[0], eG[1]), segD(x, z, eG[1], eG[2]));   // the first glade: a trampled clearing we drop into straight after the entry
    const mC = at(0.498, 0), mouthD = (x, z) => Math.hypot(x - mC.x, z - mC.z);
    const boxOf = (pts, m) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of pts) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); } return [x0 - m, x1 + m, z0 - m, z1 + m]; }, laneBox = boxOf([...lane2, ...lane3], 14);
    const laneD = (x, z) => { let d = 1e9; if (x < laneBox[0] || x > laneBox[1] || z < laneBox[2] || z > laneBox[3]) return d; for (const L of [lane2, lane3]) for (let i = 0; i < L.length - 1; i++) d = Math.min(d, segD(x, z, L[i], L[i + 1])); return d; };
    // field(x, z) -> cover 0..1 (willow stands here), tramp 0..1 (lane or glade floor), h (ground height; water lies at 0), bar 0..1
    const hySg = rSide < 0.5 ? -1 : 1, hyC = nHyaena ? at(0.776, hySg * 2.6) : null;
    // THE SLOUGH: a backwater of the braided river that cuts the bar along our line from the entry to the lane's mouth. We fly
    // low over its right-hand shallows; the family walks its right bank and drinks in it; the willow stands in its far edge.
    // sideOf = metres to the right of the route; slough() = { dW: metres outside the water (negative in it), tr: open ground }
    const sideOf = (x, z, n) => { const a = PL[Math.max(0, n.i - 1)], b = PL[Math.min(PL.length - 1, n.i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1; return ((x - PL[n.i][0]) * -tz + (z - PL[n.i][1]) * tx) / l; };
    const U_SL = 0.5, POOL_R = 7.5;
    const slough = (x, z, n, e) => {
      const s = sideOf(x, z, n), c0 = lerp(-5.6, -1, smoothstep(0.42, U_SL, n.u)) + 2.0 * N2.n2(n.u * 9, 4.4), hw = 6.2 + 1.4 * N2.n2(n.u * 14, 9.1);
      const dPool = mouthD(x, z) - POOL_R + e * 0.12, dCh = n.u < U_SL ? Math.abs(s - c0) - hw + e * 0.1 : 1e9;
      const bw0 = 0;                                    // at the entry the bank is a narrow beach: the willow sea comes to the water there
      const tr = n.u < U_SL ? (1 - smoothstep(0, 1.6, (c0 - hw - 2.2) - s + e * 0.15)) * (1 - smoothstep(11.2, 13.6, s + bw0 + e * 0.15 - 3.6 * smoothstep(0.335, 0.365, n.u) * (1 - smoothstep(0.405, 0.435, n.u)))) : 0;   // wider where the leader stands
      return { dW: Math.min(dCh, dPool), tr, s, out: n.u < U_SL + 0.02 ? Math.max((c0 - hw - 2.2) - s, s + bw0 - 12.4 - 3.6 * smoothstep(0.335, 0.365, n.u) * (1 - smoothstep(0.405, 0.435, n.u))) : 1e9 };
    };
    const SL_NONE = { dW: 1e9, tr: 0, s: 0, out: 1e9 };
    const field = (x, z) => {
      const n = nearP(x, z), e = N2.n2(x * 0.021, z * 0.021) * 9 + N2.n2(x * 0.07, z * 0.07) * 3;
      const along = (x - barEdge.x) * barDir.x + (z - barEdge.z) * barDir.z;
      let bar = (1 - smoothstep(64, 72, n.d - e)) * (1 - smoothstep(-5, 3, along + e * 0.5)) * (1 - smoothstep(232, 240, z + e));
      let tramp = 0, sl = SL_NONE;
      if (bar > 0) {                                                            // lanes, glades and the slough exist only on the bar
        const glade = 1 - smoothstep(11.5, 14.5, segD(x, z, gA, gB) + e * 0.12);
        const onLane = n.u > U_LANE && n.u < U_BAR + 0.02 ? 1 - smoothstep(5.0, 6.8, n.d + (n.u < 0.5 ? (0.5 - n.u) * 150 : 0)) : 0;
        const side = 1 - smoothstep(2.0, 3.6, laneD(x, z) + e * 0.05);
        const clr = smoothstep(188, 192, z) * (1 - smoothstep(8, 11, Math.abs(x + 2) + e * 0.12));   // a trampled clearing round the entry, so the portal's opening never cuts through crowns
        const first = 1 - smoothstep(7.6, 10.2, egD(x, z) + e * 0.14);
        const mouth = 1 - smoothstep(10.5, 13.5, mouthD(x, z) + e * 0.14);
        sl = slough(x, z, n, e);
        tramp = Math.max(glade, onLane, side, clr, first, mouth, sl.tr) * bar;
      }
      // off the bar: braided channels running with the stream, bars of silt and gravel between them
      const fa = x * 0.34 - z * 0.94, fc = x * 0.94 + z * 0.34, br = N2.n2(fc * 0.03, fa * 0.0075) * 0.7 + N2.n2(fc * 0.075 + 9, fa * 0.02) * 0.3;
      let h = 0.52 - 1.3 * smoothstep(0.36, 0.88, 1 - Math.abs(br) * 2.1) + 0.12 * N2.n2(x * 0.11, z * 0.11);
      if (hyC) { const hp = Math.hypot(x - hyC.x, z - hyC.z); if (hp < 12) h = lerp(lerp(-0.5, 0.32, smoothstep(3.2, 6, hp)), h, smoothstep(8, 12, hp)); }
      const isle = 1 - smoothstep(14, 30, Math.hypot((x - endP.x) * 0.75, z - endP.z - 4));
      h = lerp(h, 1.15, isle);
      const bank = smoothstep(46, 62, (x - endP.x) * endDir.x + (z - endP.z) * endDir.z + e), terr = Math.max(smoothstep(225, 262, n.d + e * 2), smoothstep(262, 296, z + e * 2), bank);
      h = lerp(h, 1.0 + 0.12 * N2.n2(x * 0.03, z * 0.03) - 0.1 * tramp, bar);
      let dW = sl.dW; for (const c of heroClumps) dW = Math.max(dW, 4.6 - Math.hypot(x - c.x, z - c.z) + e * 0.1);   // an islet under any clump that stands in the stream
      if (bar > 0.3 && dW < 3.8) h = Math.min(h, dW >= 0 ? 1.02 * smoothstep(0, 3.8, dW) : -0.45 * smoothstep(0, 2.6, -dW));   // a silt beach down to the water, a shallow bed
      h = lerp(h, 6.4 + 0.5 * N2.n2(x * 0.02, z * 0.02), terr);
      return { cover: bar * (1 - tramp), tramp, h, bar, terr, d: n.d, u: n.u, py: n.y, dW, s: sl.s, out: sl.out };
    };
    await tick();
    // bake it into one small texture for the ground and water shaders: R cover, G trample (R + G = the bar), B height (-1.5..8), A height again, fine, -1..1 about the water line
    const MAPN = 320, MAPC = [58, -43], MAPW = 800, mapData = new Uint8Array(MAPN * MAPN * 4), hgt = new Float32Array(MAPN * MAPN);
    for (let j = 0; j < MAPN; j++) {
      for (let i = 0; i < MAPN; i++) {
        const f = field(MAPC[0] + ((i + 0.5) / MAPN - 0.5) * MAPW, MAPC[1] + ((j + 0.5) / MAPN - 0.5) * MAPW), k = (j * MAPN + i) * 4;
        mapData[k] = f.cover * 255; mapData[k + 1] = f.tramp * 255; mapData[k + 2] = clamp((f.h + 1.5) / 9.5, 0, 1) * 255; mapData[k + 3] = clamp(f.h * 0.5 + 0.5, 0, 1) * 255; hgt[j * MAPN + i] = f.h;
        if (i % 8 === 7) await tick();
      }
      await tick();
    }
    const mapTex = new THREE.DataTexture(mapData, MAPN, MAPN, THREE.RGBAFormat); mapTex.magFilter = mapTex.minFilter = THREE.LinearFilter; mapTex.wrapS = mapTex.wrapT = THREE.ClampToEdgeWrapping; mapTex.needsUpdate = true;
    const heightAt = (x, z) => {   // bilinear from the bake (cheap, for scattering)
      const fx = clamp(((x - MAPC[0]) / MAPW + 0.5) * MAPN - 0.5, 0, MAPN - 1.001), fz = clamp(((z - MAPC[1]) / MAPW + 0.5) * MAPN - 0.5, 0, MAPN - 1.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j;
      return lerp(lerp(hgt[j * MAPN + i], hgt[j * MAPN + i + 1], a), lerp(hgt[(j + 1) * MAPN + i], hgt[(j + 1) * MAPN + i + 1], a), b) - 1;   // world y: the bar lies at 0, the water at -1
    };
    const MAP_GLSL = `uniform sampler2D uMap; vec4 mapAt(vec2 xz){ return texture2D(uMap, (xz - vec2(${MAPC[0].toFixed(1)}, ${MAPC[1].toFixed(1)})) / ${MAPW.toFixed(1)} + 0.5); }`;

    // ---- the ground: leaf litter under the willow, trampled silt in the lanes and glade, silt and gravel bars beyond
    const frostK = frosty ? 1 : 0, cGold = K.cGold, cSilver = K.cSilver;
    await tick();
    const gg = new THREE.PlaneGeometry(MAPW, MAPW, 120, 120); await tick(); gg.rotateX(-Math.PI / 2); gg.translate(MAPC[0], 0, MAPC[1]); await tick();
    { const gp = gg.attributes.position; for (let i = 0; i < gp.count; i++) { const h = heightAt(gp.getX(i), gp.getZ(i)) + 1; gp.setY(i, h - 1 - 0.3 * (1 - smoothstep(0, 0.7, h))); } }
    await tick();
    // the slough's beaches and bed are finer than the big sheet's 6.7 m cells: a 2 m sheet lies over that part, and the big one is sunk under it
    const FP = { x0: -36, x1: 48, z0: -66, z1: 226 }, fpG = new THREE.PlaneGeometry(FP.x1 - FP.x0, FP.z1 - FP.z0, 42, 146); fpG.rotateX(-Math.PI / 2); fpG.translate((FP.x0 + FP.x1) / 2, 0, (FP.z0 + FP.z1) / 2);
    { const gp = gg.attributes.position; for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); if (x > FP.x0 + 7 && x < FP.x1 - 7 && z > FP.z0 + 7 && z < FP.z1 - 7) gp.setY(i, -6); } }
    { const gp = fpG.attributes.position; for (let i = 0; i < gp.count; i++) { const h = heightAt(gp.getX(i), gp.getZ(i)) + 1; gp.setY(i, h - 1 - 0.3 * (1 - smoothstep(0, 0.7, h))); if (i % 2000 === 1999) await tick(); } }
    fpG.computeVertexNormals();
    await tick();
    gg.computeVertexNormals();
    await tick();
    const gpos = gg.attributes.position, gY = (i, j) => gpos.getY(j * 121 + i);
    const groundY = (x, z) => { const fx = clamp((x - MAPC[0] + MAPW / 2) / (MAPW / 120), 0, 119.999), fz = clamp((z - MAPC[1] + MAPW / 2) / (MAPW / 120), 0, 119.999), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j;
      return a + b <= 1 ? gY(i, j) + (gY(i + 1, j) - gY(i, j)) * a + (gY(i, j + 1) - gY(i, j)) * b : gY(i + 1, j + 1) + (gY(i, j + 1) - gY(i + 1, j + 1)) * (1 - a) + (gY(i + 1, j) - gY(i + 1, j + 1)) * (1 - b); };
    const SUN_PARS = `uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; uniform float uTime;`;
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...S, uAnim: leafU.uAnim, uAnimS: leafU.uAnimS, uMap: { value: mapTex }, uShade: { value: null }, uGold: { value: cGold }, uFrostK: { value: frostK }, uGreenK: { value: season === 'early' ? 1 : 0 } }, fog: true,
      vertexShader: `varying vec3 vWorld, vN;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; vN = normal; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `${SUN_PARS} uniform vec3 uGold; uniform float uFrostK, uGreenK; uniform sampler2D uShade; uniform vec4 uAnim[8]; uniform vec4 uAnimS[8]; varying vec3 vWorld, vN;
#include <fog_pars_fragment>
${GLSL_NOISE}
${MAP_GLSL}
float ell(vec3 o, vec3 d, vec3 c, vec3 r){ vec3 q = (o - c) / r, e = d / r; float t = max(-dot(q, e) / max(dot(e, e), 1e-4), 0.); vec3 m = q + e * t; return 1. - smoothstep(0.8, 1.1, length(m)); }
float leafLayer(vec2 g, float k, out float hs){ vec2 id = floor(g), f = fract(g) - 0.5; hs = h11(id.x * 17.3 + id.y * 91.7);
  float a = hs * 6.283, c = cos(a), s = sin(a); f = vec2(f.x * c - f.y * s, f.x * s + f.y * c) + (vec2(h11(hs * 7.), h11(hs * 13.)) - 0.5) * 0.62;
  return step(1. - k * 0.78, h11(hs * 31.)) * (1. - smoothstep(0.325, 0.365, length(f * vec2(1., 1.9)) * (0.85 + 0.5 * h11(hs * 3.)))); }
void main(){
  vec4 m = mapAt(vWorld.xz); float cover = m.r, tramp = m.g, h = m.b * 9.5 - 1.5, bar = clamp(m.r + m.g, 0., 1.), hf = m.a * 2. - 1.;
  vec2 xz = vWorld.xz; float dist = length(cameraPosition - vWorld), det = 1. - smoothstep(40., 170., dist), fine = 1. - smoothstep(8., 40., dist);
  float n1 = vn3(vec3(xz * 0.33, 1.)), n2 = vn3(vec3(xz * 2.1, 3.)), n3 = vn3(vec3(xz * 8., 5.)), n4 = vn3(vec3(xz * 23., 9.));
  float open0 = 1. - texture2D(uShade, (xz - vec2(${MAPC[0].toFixed(1)}, ${MAPC[1].toFixed(1)})) / ${MAPW.toFixed(1)} + 0.5).a;
  float gravel = max(smoothstep(0.42, 0.66, vn3(vec3(xz * 0.07, 7.)) * 0.7 + n1 * 0.3), 0.85 * smoothstep(0.86, 1.05, h) * (1. - smoothstep(1.5, 2., h)) * smoothstep(0.3, 0.55, n1 * 0.5 + n2 * 0.5 + 0.12)) * (1. - bar);
  vec3 silt = mix(vec3(0.27, 0.26, 0.245), vec3(0.47, 0.455, 0.43), n1 * 0.6 + n2 * 0.4);
  float damp = smoothstep(0.42, 0.68, vn3(vec3(xz * 0.045, 15.)) * 0.75 + n1 * 0.25) * (1. - bar); silt *= mix(1., 0.6, damp);
  // gravel: pebbles as dark-rimmed cells; silt: wind ripples across the stream
  float cob = vn3(vec3(xz * 2.6, 13.)), peb = smoothstep(0.35, 0.6, n3) * 0.4 + smoothstep(0.4, 0.7, n4) * 0.3 * fine + smoothstep(0.38, 0.62, cob) * 0.4;
  silt = mix(silt, mix(vec3(0.13, 0.125, 0.12), vec3(0.62, 0.6, 0.57), peb) * (0.7 + 0.6 * h11(floor(xz.x * 3.) * 7.1 + floor(xz.y * 3.) * 3.3)), gravel * det * 0.9);
  float rip = sin(dot(xz, vec2(0.94, 0.34)) * 5.5 + n2 * 5. + n1 * 9.) * 0.5 + 0.5; float ripK = max(smoothstep(0.25, 0.55, vn3(vec3(xz * 0.13, 21.))), 0.45) * (1. - gravel) * det * (1. - bar * (1. - 0.8 * open0)); silt *= 1. - 0.36 * rip * ripK;
  // the trampled floor: three-toed prints as big as a tray, pressed into the silt
  vec2 pg = xz * 0.55, pid = floor(pg), pf = fract(pg) - 0.5; float ph = h11(pid.x * 5.3 + pid.y * 17.9); pf += (vec2(ph, h11(ph * 9.)) - 0.5) * 0.5;
  float pd = min(length(pf * vec2(1., 0.9)) - 0.105, min(length(pf - vec2(0., 0.13)) - 0.05, min(length(pf - vec2(0.09, 0.085)) - 0.045, length(pf - vec2(-0.09, 0.085)) - 0.045)));
  float trail = max(tramp, (1. - bar) * (1. - smoothstep(0.035, 0.075, abs(vn3(vec3(xz * 0.035, 31.)) - 0.5))) * step(-0.02, hf));
  float print = step(0.4, ph) * (1. - smoothstep(-0.035, 0.05, pd)) * trail, prim = step(0.4, ph) * smoothstep(0.07, 0.02, abs(pd - 0.035)) * trail;
  silt *= (1. - 0.46 * print * det) * (1. + 0.26 * prim * det);
  float wet = 1. - smoothstep(-0.05, 0.2 + 0.34 * n1, hf); silt *= mix(1., 0.68, wet); silt = mix(silt, silt * vec3(0.84, 0.97, 0.94), wet);
  { vec2 g = xz * 2.2 + (vec2(n2, n1) - 0.5) * 0.7, gi = floor(g), gf = fract(g); float d1 = 9., d2 = 9.;   // dried mud above the water line: polygons a foot or two across
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)), pp = o + vec2(h11(dot(gi + o, vec2(7.1, 31.7))), h11(dot(gi + o, vec2(17.3, 5.9)))) - gf; float d = dot(pp, pp); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; } }
    float band = smoothstep(0.03, 0.14, hf) * (1. - smoothstep(0.34, 0.66, hf + (n1 - 0.5) * 0.4)) * (1. - tramp * (1. - open0)), ck = (1. - smoothstep(0.03, 0.1, sqrt(d2) - sqrt(d1))) * band * (1. - smoothstep(16., 46., dist));
    silt *= (1. - 0.5 * ck) * (1. + 0.1 * band * (h11(dot(gi, vec2(3.3, 9.1))) - 0.4) * det); }
  float terr = smoothstep(2.5, 5., h); silt = mix(silt, vec3(0.16, 0.13, 0.08) * (0.7 + 0.6 * n2), terr);        // the cut bank and the old terrace under the big wood
  float bank = smoothstep(1.3, 2.2, h) * (1. - smoothstep(4.6, 5.8, h)); silt = mix(silt, vec3(0.34, 0.29, 0.23) * (0.55 + 0.7 * vn3(vec3(xz * 0.6, vWorld.y * 5.))), bank);
  // fallen leaves: thick under the willow and in the glade, lying in drifts on the bars
  vec2 wxz = vec2(dot(xz, vec2(-0.62, 0.78)), dot(xz, vec2(0.78, 0.62)));
  float drift = smoothstep(0.46, 0.7, vn3(vec3(wxz * vec2(0.32, 0.05), 11.)) * 0.65 + n1 * 0.35) * (1. - wet) * (1. - terr) * 0.9;
  float lk = clamp(max(max(cover * 0.95, tramp * (0.42 + 0.4 * n1) * (1. - print)), drift), 0., 1.) * (0.45 + 1.1 * n2), ha, hb, hc; lk = clamp(lk, 0., 1.);
  float la = leafLayer(mat2(0.8, 0.6, -0.6, 0.8) * xz * 5.5, lk, ha), lb = leafLayer(mat2(0.28, 0.96, -0.96, 0.28) * xz * 7.3 + 3.7, lk * 0.9, hb), lc = leafLayer(mat2(-0.53, 0.85, -0.85, -0.53) * xz * 3.9 + 1.3, lk * 0.5 * (1. - bar * 0.5), hc);
  vec3 lcol = mix(uGold * vec3(1.22, 1.28, 1.5), vec3(0.4, 0.2, 0.06), smoothstep(0.3, 0.8, ha)); vec3 lcol2 = mix(uGold * vec3(1.15, 1.2, 1.4), vec3(0.22, 0.13, 0.06), smoothstep(0.2, 0.9, hb)); lcol = mix(lcol, vec3(0.32, 0.42, 0.13), uGreenK * step(0.7, ha));
  vec3 avg = mix(silt, uGold * vec3(0.78, 0.76, 0.9), lk * 0.72);
  vec3 alb = silt * (1. - 0.36 * lk); alb = mix(alb, lcol2 * 0.8, lb); alb = mix(alb, lcol, la); alb = mix(alb, mix(uGold, vec3(0.5, 0.3, 0.1), hc) * 0.9, lc * 0.8);
  float hp0 = vn3(vec3(xz * 0.8, 3.)) * 0.65 + n2 * 0.35, hp1 = vn3(vec3((xz + uSunDir.xz * 0.16) * 0.8, 3.)) * 0.65 + vn3(vec3((xz + uSunDir.xz * 0.16) * 2.1, 3.)) * 0.35;
  float heap = smoothstep(0.42, 0.56, hp0), relief = clamp((hp0 - hp1) * 7., -1., 1.) * lk, tone = vn3(vec3(xz * 0.21, 9.)) * 0.7 + n1 * 0.3;
  vec3 toneC = mix(vec3(0.36, 0.21, 0.07), mix(uGold * vec3(0.95, 0.9, 0.8), uGold * vec3(1.2, 1.24, 1.5), smoothstep(0.55, 0.8, tone)), smoothstep(0.26, 0.5, tone));
  alb = mix(alb, alb * (0.68 + 0.6 * heap) * mix(vec3(1.), toneC / max(uGold, vec3(0.05)), 0.5), lk);
  avg = mix(silt * (1. - 0.3 * lk), toneC * (0.5 + 0.55 * heap), clamp(lk * (0.3 + 0.7 * heap), 0., 1.));
  alb = mix(avg, alb, 1. - smoothstep(8., 26., dist));
  // light: under the leaves only coins of sun reach the floor, sliding as the crowns roll; the ceiling fills it gold
  vec3 N = normalize(vN + vec3(n3 - 0.5, 0., n4 - 0.5) * 0.5 * fine + vec3(0., 1e-4, 0.));
  vec4 shm = texture2D(uShade, (xz - vec2(${MAPC[0].toFixed(1)}, ${MAPC[1].toFixed(1)})) / ${MAPW.toFixed(1)} + 0.5); float open = 1. - shm.a;   // open: the slough's sunny bank
  alb = mix(alb, mix(silt, alb, 0.3 + 0.7 * drift), open * 0.75);                 // out there the wind has cleared the silt: leaves lie in drifts only
  float shade = clamp(max(cover, tramp * 0.82), 0., 1.) * bar * (1. - open);
  vec2 dp = xz * 2.3 + uSunDir.xz * 3. + vec2(sin(uTime * 0.7 + xz.y * 0.3), cos(uTime * 0.6 + xz.x * 0.3)) * 0.22;
  float cBig = vn3(vec3(dp * 0.8, uTime * 0.1)), cFine = vn3(vec3(dp * 2.9 + 7.3, uTime * 0.16));
  float coin = mix(smoothstep(0.54, 0.63, vn3(vec3(dp, uTime * 0.12)) * 0.7 + vn3(vec3(dp * 2.7, 4.)) * 0.3), smoothstep(0.6, 0.635, cFine * 0.72 + cBig * 0.32), fine);   // near: hard-edged coins a hand wide
  float pool = smoothstep(0.4, 0.64, vn3(vec3(xz * 0.3 + uSunDir.xz * 2., uTime * 0.05)) * 0.75 + cBig * 0.25);   // under the leaves the sun lies in pools a stride or two across, with coins inside them
  float sunVis = mix(1., (coin * mix(0.35, 1., tramp) * 0.55 + 0.6 * pool) * mix(0.45, 1.3, pool), shade) * mix(texture2D(uShade, (xz - vec2(${MAPC[0].toFixed(1)}, ${MAPC[1].toFixed(1)})) / ${MAPW.toFixed(1)} + 0.5).r, 1., shade * 0.5);
  { float sh = 0.;                                                            // each animal throws its own long shadow: body, neck and legs
    for (int i = 0; i < 8; i++) { vec4 a = uAnim[i], q = uAnimS[i]; vec2 rel = xz - a.xy;
      if (q.y > 0.01 && dot(rel, rel) < 1600.) { float sc = max(q.z / 3.3, 0.3); vec2 rt = vec2(a.w, -a.z);
        vec3 o = vec3(dot(rel, rt), vWorld.y - q.w, dot(rel, a.zw)) / sc, d = vec3(dot(uSunDir.xz, rt), uSunDir.y, dot(uSunDir.xz, a.zw));
        sh = max(sh, max(max(ell(o, d, vec3(0., 3.5, 0.), vec3(1.15, 1.2, 2.5)), ell(o, d, vec3(0., 5.2, 2.9), vec3(0.5, 1.4, 0.8))), max(ell(o, d, vec3(0., 1.3, 1.25), vec3(0.75, 1.4, 0.36)), ell(o, d, vec3(0., 1.3, -1.3), vec3(0.75, 1.4, 0.42))))); } }
    sunVis *= 1. - 0.88 * sh; }
  float ndl = clamp(dot(N, uSunDir) * 1.5 + 0.3 + (rip - 0.5) * 0.5 * ripK + relief * 0.45 * (1. - smoothstep(30., 90., dist)), 0., 1.);
  vec3 amb = mix(uSkyCol * 0.95, uGold * uSunCol * 0.5 + uSkyCol * 0.45, shade);
  alb = mix(alb, vec3(0.75, 0.8, 0.86), uFrostK * 0.4 * (1. - sunVis * ndl) * smoothstep(0.35, 0.75, n2 * 0.6 + n3 * 0.4) * (1. - wet));
  vec3 colr = alb * (uSunCol * ndl * sunVis * mix(1.25, 1.5, shade) + amb * (1. + 0.3 * relief));
  { vec3 Vg = normalize(cameraPosition - vWorld + vec3(0., 1e-3, 0.)); float fz = 1. - clamp(Vg.y, 0., 1.); colr += uSkyCol * wet * (0.1 + 0.5 * fz * fz * fz) * (1. - terr); }   // wet silt shines with the sky
  gl_FragColor = vec4(colr, 1.);
#include <fog_fragment>
}` });
    const ground = new THREE.Mesh(gg, groundMat); ground.name = 'ground'; scene.add(ground);
    const groundFine = new THREE.Mesh(fpG, groundMat); groundFine.name = 'ground-slough'; scene.add(groundFine);
    await tick();

    // ---- the braids: shallow teal water running with the stream, sky on it, small glints, leaves rafting down
    const wg0 = new THREE.PlaneGeometry(MAPW, MAPW, 1, 1); wg0.rotateX(-Math.PI / 2); wg0.translate(MAPC[0], -1, MAPC[1]);
    const waterMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...S, uAnim: leafU.uAnim, uAnimS: leafU.uAnimS, uMap: { value: mapTex }, uGold: { value: cGold }, uTeal: { value: col(PAL[5], 0.8) }, uHorizon: { value: col('#9FC0E0', 0.9) }, uZenith: { value: col('#2E5FA8', 0.8) } }, fog: true,
      vertexShader: `varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `${SUN_PARS} uniform vec3 uGold, uTeal, uHorizon, uZenith; uniform vec4 uAnim[8]; uniform vec4 uAnimS[8]; varying vec3 vWorld;
#include <fog_pars_fragment>
${GLSL_NOISE}
${MAP_GLSL}
// how much of a reflected ray (o, d: in an animal's own frame, metres) passes through an ellipsoid (centre c, radii r)
float ell(vec3 o, vec3 d, vec3 c, vec3 r){ vec3 q = (o - c) / r, e = d / r; float t = max(-dot(q, e) / max(dot(e, e), 1e-4), 0.); vec3 m = q + e * t; return 1. - smoothstep(0.78, 1.12, length(m)); }
// the bank and the willow on it, met by a reflected ray d metres out: rgb its colour, a whether it is met (hgt = the ray's height there)
vec4 bankAt(vec2 xz, float hgt, float lit){ vec4 m = mapAt(xz); float gh = max(m.a * 2. - 1., 0.), wil = smoothstep(0.3, 0.65, m.r), top = gh + 4.4 * wil;
  float k = smoothstep(top + 0.35, top - 0.35, hgt) * step(0.02, gh), up = clamp((hgt - gh) / 4.4, 0., 1.);
  vec3 leaf = uGold * (uSunCol * lit * (0.25 + 0.9 * up) + uSkyCol * 0.75 + uGroundCol * 0.3) * mix(0.5, 1.05, up);
  vec3 mud = vec3(0.3, 0.27, 0.22) * (uSunCol * (0.2 + 0.5 * lit) + uSkyCol);
  return vec4(mix(mud, leaf, wil * smoothstep(gh - 0.1, gh + 0.5, hgt)), k); }
void main(){
  vec2 xz = vWorld.xz; vec2 jit = (vec2(vn3(vec3(xz * 0.45, 3.)), vn3(vec3(xz * 0.45, 8.))) - 0.5) * 1.6; float h = mapAt(xz + jit).a * 2. - 1.; if (h > 0.02) discard;
  float depth = clamp(-h / 0.9, 0., 1.); vec3 toC = cameraPosition - vWorld; float dist = max(length(toC), 1e-3); vec3 V = toC / dist;
  vec2 fl = vec2(0.34, -0.94), q = xz - fl * uTime * 0.9; float near = 1. - smoothstep(30., 160., dist);
  float r1 = vn3(vec3(q * 1.7, uTime * 0.4)), r2 = vn3(vec3(q.yx * 4.3 + 7., uTime * 0.9)), r3 = vn3(vec3(q * 0.35, 2.));
  vec3 N = normalize(vec3((r1 - 0.5) * 0.22 + (r2 - 0.5) * 0.14 * near, 1., (r3 - 0.5) * 0.2 + (r2 - 0.5) * 0.14 * near));
  float fres = 0.04 + 0.96 * pow(1. - clamp(dot(N, V), 0., 1.), 3.);
  vec3 R = reflect(-V, N); vec3 skyc = mix(uHorizon, uZenith, clamp(R.y * 1.6, 0., 1.));
  { float ry = R.y + (r1 - 0.5) * 0.06 + (r3 - 0.5) * 0.05, col1 = vn3(vec3(R.x / (abs(R.z) + 0.35) * 14., 3., 1.)), wk = (1. - smoothstep(0.035, 0.13 + 0.07 * col1, ry));
    vec3 wood = mix(vec3(0.2, 0.13, 0.05), uGold * vec3(0.72, 0.62, 0.5), col1) * (uSunCol * 0.7 + uSkyCol * 0.6); skyc = mix(skyc, wood, wk * 0.9); }
  { // the banks mirrored: the willow wall and the silt under it, by walking the reflected ray out over the map
    float rl = max(length(R.xz), 1e-3); vec2 rd = R.xz / rl; float sl = max(R.y, 0.) / rl, lit = max(clamp(dot(-rd, uSunDir.xz) * 0.8 + 0.45, 0., 1.), 0.85 * smoothstep(0.1, 0.8, dot(rd, uSunDir.xz))), got = 0.; vec4 b;
    b = bankAt(xz + rd * 2.2, 2.2 * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    b = bankAt(xz + rd * 4.5, 4.5 * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    b = bankAt(xz + rd * 7.5, 7.5 * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    b = bankAt(xz + rd * 11.5, 11.5 * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    b = bankAt(xz + rd * 17., 17. * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    b = bankAt(xz + rd * 25., 25. * sl, lit); skyc = mix(skyc, b.rgb, b.a * (1. - got)); got = max(got, b.a);
    // the family mirrored: body, neck and legs of each animal as soft grey shapes
    float an = 0.;
    for (int i = 0; i < 8; i++) { vec4 a = uAnim[i], q = uAnimS[i]; vec2 rel = xz - a.xy;
      if (q.y > 0.01 && dot(rel, rel) < 1600.) { float sc = max(q.z / 3.3, 0.3); vec2 rt = vec2(a.w, -a.z);
        vec3 o = vec3(dot(rel, rt), -(q.w + 1.), dot(rel, a.zw)) / sc, d = vec3(dot(R.xz, rt), R.y, dot(R.xz, a.zw));
        an = max(an, max(max(ell(o, d, vec3(0., 3.5, 0.), vec3(1.15, 1.2, 2.5)), ell(o, d, vec3(0., 5.2, 2.9), vec3(0.5, 1.4, 0.8))), max(ell(o, d, vec3(0., 1.3, 1.25), vec3(0.75, 1.4, 0.36)), ell(o, d, vec3(0., 1.3, -1.3), vec3(0.75, 1.4, 0.42))))); } }
    skyc = mix(skyc, vec3(0.2, 0.2, 0.215) * (uSunCol * 0.55 + uSkyCol * 1.1), an * 0.9); }
  vec3 bed = mix(vec3(0.36, 0.34, 0.28), uTeal * 0.55, smoothstep(0., 0.6, depth)) * (0.7 + 0.5 * vn3(vec3(xz * 2.5, 1.)));
  vec3 body = bed * (uSunCol * 0.55 + uSkyCol * 0.9) + uTeal * (0.1 + 0.3 * depth);
  float film = smoothstep(0., 0.14, depth);                                   // the last hand's depth is clear over wet silt: no hard rim
  body = mix(vec3(0.31, 0.295, 0.26) * (uSunCol * 0.75 + uSkyCol), body, film);
  vec3 c = mix(body, skyc * vec3(0.8, 0.96, 0.94), clamp(fres * 0.9 + 0.1, 0., 1.) * mix(0.3, 1., film));
  float gl = pow(clamp(dot(R, uSunDir), 0., 1.), 60.) + smoothstep(0.76, 0.9, r2) * smoothstep(0.5, 0.78, r1) * near * 0.6 * clamp(dot(R, uSunDir) + 0.62, 0., 1.);
  c += uSunCol * gl * 1.6;
  // leaves rafting on the surface
  vec2 g = (xz - fl * uTime * 0.55) * 1.6, id = floor(g), f = fract(g) - 0.5; float hs = h11(id.x * 13.1 + id.y * 71.3);
  float lf = step(0.9, hs) * (1. - smoothstep(0.1, 0.16, length((f + (vec2(h11(hs * 5.), h11(hs * 9.)) - 0.5) * 0.5) * vec2(1., 1.8)))) * near;
  c = mix(c, uGold * (uSunCol * 0.9 + uSkyCol), lf);
  c = mix(c, c * 0.9 + uHorizon * 0.12, smoothstep(-0.12, 0.03, h) * 0.6);   // the wet rim takes the sky
  gl_FragColor = vec4(c, 1.);
#include <fog_fragment>
}` });
    const water = new THREE.Mesh(wg0, waterMat); water.name = 'braids'; scene.add(water);
    await tick();

    // ---- the cast's tracks (needed before planting, so no clump stands in a walker's way). All are functions of u.
    const TRAVEL = WALK * DUR;                                   // metres an animal walks while we cross the world
    const mAbeam = 0.657, mLine = path.tangentAt(mAbeam).clone().setY(0).normalize().multiplyScalar(-1), mAt = at(mAbeam, 11.2);
    const TRACKS = {
      a1: { p: [at(0.105, 7.8).x, at(0.105, 7.8).z], dir: [-0.02, 1], u0: 0.105 },   // the first of the family, whole, walking up the first glade on our right
      a2: { p: [at(0.192, 10.2).x, at(0.192, 10.2).z], dir: [0.05, 0.999], u0: 0.192 },   // the second, at the glade's far end as we climb out over the leaves
      h1: { p: [at(0.3, 6.6).x, at(0.3, 6.6).z], dir: [0.06, 0.998], u0: 0.3 },
      h2: { p: [at(0.318, 8.8).x, at(0.318, 8.8).z], dir: [-0.02, 1], u0: 0.318 },
      mo: { p: [mAt.x, mAt.z], dir: [mLine.x, mLine.z], u0: mAbeam },
    };
    // shoreSide(u, level): metres to the right of the route at which the slough's right beach falls to that height (one path lookup, then a walk across)
    const shoreSide = (u, level) => { const p0 = at(u, 0, new THREE.Vector3()), t = path.tangentAt(u, _w), rx = -t.z, rz = t.x; let sd = 9; for (; sd > -6; sd -= 0.2) if (heightAt(p0.x + rx * sd, p0.z + rz * sd) < level) break; return sd; };
    const DRINK = (() => { const u = 0.212, sd = shoreSide(u, -1.12);   // the second of the family: forefeet in the shallows, drinking; it lifts its head as we come
      const q = at(u, sd + 1.7, new THREE.Vector3()), t = path.tangentAt(u, _w); return { x: q.x, z: q.z, heading: Math.atan2(0.8 * t.z + 0.6 * t.x, -0.8 * t.x + 0.6 * t.z) }; })();   // facing the water and a little away from us, so its sunlit flank is ours
    const trackPos = (T, u, out) => { const s = TRAVEL * (u - T.u0); return out.set(T.p[0] + T.dir[0] * s, 0, T.p[1] + T.dir[1] * s); };
    // The heads beyond the leader. Once the first two adults have passed behind us they are not seen again, so the same two
    // animals stand for two more of the family feeding beyond her (the herd stays at the brief's eight or nine): AFTER[i] =
    // where adult i is from u = from on (head down among the leaves at first, then lifted).
    // AFTER[slot] = where that walker is from u = from on: head down under the leaves at first, lifted over `rise`.
    const AFTER = { 1: { from: 0.215, p: [at(0.506, -9.6).x, at(0.506, -9.6).z], heading: -0.75, rise: [0.215, 0.24] }, 2: { from: 0.272, p: [at(0.494, 9.4).x, at(0.494, 9.4).z], heading: -0.1, rise: [0.272, 0.3] },
      3: { from: 0.345, p: [31, 9.5], heading: 2.7, rise: [0.352, 0.372] }, 4: (() => { const q = at(0.548, -4.4, new THREE.Vector3()), t = path.tangentAt(0.548, _w); return { from: 0.358, p: [q.x, q.z], heading: Math.atan2(-t.x * 0.45 - t.z * 0.89, -t.z * 0.45 + t.x * 0.89), rise: [0.455, 0.49] }; })() };
    // The same two adults a third time: once the lane's mouth is behind us they are out on the bars (the herd never shows more
    // than nine at once). One wades up the braids toward us on our right, in full sun; one drinks on our left by the island.
    const BARS = { from: 0.62, walk: { u0: 0.888, p: at(0.888, 9.6).clone(), dir: path.tangentAt(0.888).clone().setY(0).normalize().multiplyScalar(-1) }, drink: { p: at(0.978, -10.5).clone(), heading: Math.atan2(path.tangentAt(0.978).x * -0.5 - path.tangentAt(0.978).z * 0.86, path.tangentAt(0.978).z * -0.5 + path.tangentAt(0.978).x * 0.86) } };
    const ENTRY = { p: [7.9, 165.5], heading: -0.6, until: 0.09 };   // the mother, long before her glade: the first head, standing at feed in the willow 26 m ahead of the entry and 8 m right of the axis
    // ... then, once she is behind us, she is the head on the left: standing in the willow of the far bank, the sun behind her (until the glade)
    const LEFT = (() => { let sd = -14; for (; sd > -26; sd -= 0.5) { const q = at(0.335, sd, _c); if (field(q.x, q.z).cover > 0.85) break; } const q = at(0.335, sd - 2.2, new THREE.Vector3()), t = path.tangentAt(0.335, _w); return { p: [q.x, q.z], heading: Math.atan2(-t.x * 0.75 - t.z * 0.66, -t.z * 0.75 + t.x * 0.66), until: 0.318 }; })();   // the mother, long before her glade: the first head, standing at feed where the first glade's edge meets the willow
    const standers = [[-1.9, 23.5], [at(0.532, 17).x, at(0.532, 17).z]];   // one feeds 9 m right of our line in to the leader; on seeds with nine animals another stands by the mouth of the lane
    const onBars = (x, z, r) => Math.hypot(x - BARS.drink.p.x, z - BARS.drink.p.z) < r || segD(x, z, { x: BARS.walk.p.x - BARS.walk.dir.x * 22, z: BARS.walk.p.z - BARS.walk.dir.z * 22 }, { x: BARS.walk.p.x + BARS.walk.dir.x * 12, z: BARS.walk.p.z + BARS.walk.dir.z * 12 }) < r;
    const keepOff = (x, z, r) => {
      for (const k of ['a1', 'a2', 'h1', 'h2']) { const T = TRACKS[k], a = trackPos(T, 0, _v), b = trackPos(T, 1, _c); if (segD(x, z, a, b) < r) return true; }
      for (const s of standers) if (Math.hypot(x - s[0], z - s[1]) < r + 3) return true;
      if (Math.hypot(x - ENTRY.p[0], z - ENTRY.p[1]) < r + 3 || Math.hypot(x - LEFT.p[0], z - LEFT.p[1]) < r + 3) return true;
      for (const k of [1, 2, 3, 4]) if (Math.hypot(x - AFTER[k].p[0], z - AFTER[k].p[1]) < r + 3) return true;
      return Math.hypot(x, z - 2) < 13;
    };

    // ---- poplar, elm and alder regrowth: 40-odd clumps of gold spires standing out of the willow
    const W = { p: [], n: [], c: [], w: [], i: [] }, WH = [0, 1, 2, 3].map(() => ({ p: [], n: [], c: [], w: [], i: [] })), zBand = (z) => (z > 120 ? 0 : z > 40 ? 1 : z > -40 ? 2 : 3), cards = [], clumps = [], bare = K.seasonDef.bare;
    const cBough = col('#7a6a52', 0.5), cPole = col(PAL[3], 0.62), cTwig = col('#8a7a52', 0.6), cWhip = col('#7c6a46', 0.5);
    const addSpire = (bx, bz, H, lean, kind, rich, fat = 1, R = rng, bend = 0) => {
      const ph = R.range(0, 6.28), elm = kind === 1, top = [bx + lean[0] * H, H, bz + lean[1] * H], pts = [], n = 6;
      const cv = elm ? 0.5 : bend, atf = (f) => [lerp(bx, top[0], f) + lean[0] * H * cv * f * f, H * f, lerp(bz, top[2], f) + lean[1] * H * cv * f * f];
      for (let j = 0; j <= n; j++) pts.push(atf(j / n));
      pushTube(W, pts, 0.06 + H * 0.004, 0.014, rich ? 5 : 4, cPole, cTwig, (p, f) => [f, ph, 0]);
      const tint = (elm ? -0.55 : 0.1) + R.range(-0.25, 0.25), green = kind === 2 ? R.range(0.75, 1) : (season === 'early' && R() < 0.25 ? 0.5 : 0), nc = rich ? Math.round(34 * Math.max(1, H / 11.5)) : 15, wide = elm ? 1.5 : 1;
      for (let k = 0; k < nc; k++) {
        const f = lerp(0.34, 0.99, (k + R()) / nc), o = atf(f), sp = ((1 - f) * 0.95 * wide + 0.12) * fat, a = k * 2.4 + ph;
        if (R() < bare) continue;
        cards.push({ p: [o[0] + Math.cos(a) * sp * R.range(0.3, 1), o[1] + R.range(-0.2, 0.2), o[2] + Math.sin(a) * sp * R.range(0.3, 1), (rich ? 1.15 : 1.75) * fat * lerp(1.15, 0.7, f) * R.range(0.85, 1.2)], q: [R.range(0, 6.28), R.range(-0.4, 0.4), ph, tint + R.range(-0.3, 0.3)], r: [green, 0, 1, f] });
      }
      if (rich) for (let b = 0; b < 7; b++) { const f = lerp(0.3, 0.85, b / 7), o = atf(f), a = b * 2.4 + ph, len = 1.6 * (1 - f) + 0.5; pushTube(W, [o, [o[0] + Math.cos(a) * len * 0.4, o[1] + len * 0.75, o[2] + Math.sin(a) * len * 0.4]], 0.022, 0.008, 3, cPole, cTwig, () => [f, ph, 0]); }
    };
    const addClump = (cx, cz, n, hk, kind, rich) => {
      clumps.push([cx, cz, kind, hk]);
      for (let s = 0; s < n; s++) {
        const a = (s / n) * TAU + rng.range(-0.3, 0.3), r = Math.sqrt(rng()) * 2.1 + 0.3, H = rng.range(9, 12.2) * hk, k = kind === 1 ? 0.07 : 0.018;
        addSpire(cx + Math.cos(a) * r, cz + Math.sin(a) * r, H, [Math.cos(a) * r * k + rng.range(-0.02, 0.02), Math.sin(a) * r * k + rng.range(-0.02, 0.02)], kind, rich);
      }
    };
    for (const c of heroClumps) clumps.push([c.x, c.z, 0, 1]);          // the hero's own three
    { const a = at(0.118, -13.5), b = at(0.15, 17.5), c = at(0.214, 15.5); addClump(a.x, a.z, 8, 0.98, 0, true); addClump(b.x, b.z, 7, 1.02, 0, true); addClump(c.x, c.z, 8, 1.0, 0, true); }     // the pair we drift between
    { const a = at(0.612, 17.5), b = at(0.682, 21); addClump(a.x, a.z, 9, 1.05, 0, true); addClump(b.x, b.z, 8, 1.0, 1, true); const c = at(0.634, -17.5); addClump(c.x, c.z, 8, 1.03, 0, true); }      // the two whose boughs roof the glade
    { const r = new THREE.Vector3(-endDir.z, 0, endDir.x);                                                                             // the two leaning poplars the portal stands between
      for (const sd of [-1, 1]) for (let k = 0; k < 8; k++) { const la = 9.7 + k * 0.72 + (k & 1) * 0.5, al = (k - 3.5) * 0.85 + (k % 3) * 0.5, ln = -0.105 + 0.05 * k; addSpire(endP.x + r.x * sd * la + endDir.x * al, endP.z + r.z * sd * la + endDir.z * al, 16.6 - k * 1.25 + (k & 1) * 0.8, [r.x * sd * ln + endDir.x * 0.01 * (k - 3), r.z * sd * ln + endDir.z * 0.01 * (k - 3)], 0, true, 1.55); } }
    await tick();
    { const xr = ctx.core.makeRng((ctx.seed | 0) + 3319), r = new THREE.Vector3(-endDir.z, 0, endDir.x);   // ... and four more on each side, just beyond the ring, bowing in over it until their tops meet: a gold arch
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { if (k === 0 || k === 2) await tick(); const la = 10.6 + k * 0.55, al = 1.6 + k * 0.9, H = 17.4 + (k & 1) * 1.1, ln = 0.142 + 0.006 * k;
        addSpire(endP.x + r.x * sd * la + endDir.x * al, endP.z + r.z * sd * la + endDir.z * al, H, [-r.x * sd * ln, -r.z * sd * ln], 0, true, 1.5, xr, 2); } }
    await tick();
    for (let tries = 0, made = 0; tries < 900 && made < Math.round(38 * lerp(0.85, 1.1, (density - 0.7) / 0.6)); tries++) {
      await tick();
      const u = rng.range(-0.04, 0.72), side = rng.range(-66, 66), kindR = rng(), n = rng.int(6, 13), hk = rng.range(0.86, 1.08);
      const q = at(clamp(u, 0, 1), side, _c), x = q.x, z = q.z + (u < 0 ? -u * 520 : 0);
      if (Math.abs(side) < 14 + (u > 0.44 ? 6 : 0)) continue;
      if (clumps.some((c) => Math.hypot(c[0] - x, c[1] - z) < 17) || keepOff(x, z, 6.5) || (x > 0 && x < 19 && z > 40 && z < 172)) continue;
      const f = field(x, z); if (f.cover < 0.7 || f.d < 13) continue;
      const nearLane = laneD(x, z) < 9 || segD(x, z, gA, gB) < 22;
      addClump(x, z, n, hk, nearLane ? 2 : kindR < 0.62 ? 0 : kindR < 0.88 ? 1 : 2, false); made++;
    }
    await tick();

    // ---- long shadows: every clump throws a tapering streak across the canopy, away from the low sun (baked top-down)
    const SHN = 384, shData = new Uint8Array(SHN * SHN * 4).fill(255), sxz = Math.hypot(sunDir.x, sunDir.z), sdx = -sunDir.x / sxz, sdz = -sunDir.z / sxz, tanEl = sunDir.y / sxz;
    const stamp = (x, z, r, dark) => {
      const tx = ((x - MAPC[0]) / MAPW + 0.5) * SHN, tz = ((z - MAPC[1]) / MAPW + 0.5) * SHN, tr = r / MAPW * SHN + 1;
      for (let j = Math.max(0, Math.floor(tz - tr)); j <= Math.min(SHN - 1, Math.ceil(tz + tr)); j++) for (let i = Math.max(0, Math.floor(tx - tr)); i <= Math.min(SHN - 1, Math.ceil(tx + tr)); i++) {
        const d = Math.hypot(i + 0.5 - tx, j + 0.5 - tz) * MAPW / SHN, v = 255 * (1 - dark * (1 - smoothstep(r * 0.45, r + 0.8, d))), k = (j * SHN + i) * 4; if (v < shData[k]) shData[k] = shData[k + 1] = shData[k + 2] = v;
      }
    };
    const castShade = (x, z, H, r, base, dark = 0.78) => { const L = Math.max(0, H - base) / tanEl; for (let t = base > 1 ? 1.5 : 0; t <= L; t += 1.1) stamp(x + sdx * t, z + sdz * t, r * (1 - 0.55 * t / L) + 0.7, dark * (1 - 0.3 * t / L)); };
    for (const c of clumps) castShade(c[0], c[1], 11.2 * c[3], 3.9, 4.3, 0.92);
    for (let j = 0; j < SHN; j++) { const z = MAPC[1] + ((j + 0.5) / SHN - 0.5) * MAPW; if (z < FP.z0 || z > FP.z1 + 16) continue;
      for (let i = 0; i < SHN; i++) { const x = MAPC[0] + ((i + 0.5) / SHN - 0.5) * MAPW; if (x < FP.x0 || x > FP.x1) continue; const f = field(x, z); if (f.out < -0.6 && f.dW > -0.4 && f.s > -5.5) shData[(j * SHN + i) * 4 + 3] = 0; }
      if (j % 2 === 1) await tick(); }
    for (let j = 0; j < SHN; j++) { const z = MAPC[1] + ((j + 0.5) / SHN - 0.5) * MAPW; if (Math.abs(z - barEdge.z) > 22) continue;   // where the lane leaves the willow the floor is open to the sun: sand and prints, not a patch of shade
      for (let i = 0; i < SHN; i++) { const x = MAPC[0] + ((i + 0.5) / SHN - 0.5) * MAPW; if (Math.abs(x - barEdge.x) > 22) continue; const fd = field(x, z), k = (j * SHN + i) * 4 + 3; if (fd.tramp > 0.2 && fd.u > 0.688) shData[k] = Math.min(shData[k], 255 * (1 - smoothstep(0.688, 0.704, fd.u))); } }
    await tick();
    { const r = new THREE.Vector3(-endDir.z, 0, endDir.x); for (const sd of [-1, 1]) castShade(endP.x + r.x * sd * 11.5, endP.z + r.z * sd * 11.5, 15, 2.6, 0, 0.85); }
    await tick();

    // ---- the glade's roof: boughs arching in from the three clumps round it, and a ceiling of leaf sprays lying flat between
    // them at 5.6-7.6 m: small leaves, sky in the gaps, lit from above so that from below it is stained glass
    const xb = ctx.core.makeRng((ctx.seed | 0) + 1213);
    for (let b = 0; b < 30; b++) {
      if (b % 2 === 1) await tick();
      const left = b % 5 >= 3, c = clumps[left ? 8 : 6 + (b & 1)], u = lerp(0.582, 0.69, (b + rng()) / 30), tip = at(u, left ? rng.range(-11, 1.5) : rng.range(-0.5, 12.5), new THREE.Vector3()), ph = rng.range(0, 6.28), H = rng.range(5.9, 7.3);
      const base = [c[0] + rng.range(-1.5, 1.5), 0, c[1] + rng.range(-1.5, 1.5)], pts = [];
      const dx0 = tip.x - base[0], dz0 = tip.z - base[2], reach0 = Math.hypot(dx0, dz0) || 1, reach = Math.min(reach0, 15.5), ux = dx0 / reach0, uz = dz0 / reach0, bw = Math.sin(ph * 3) * 2.3, s2 = Math.cos(ph * 5) * 1.5, dr = 0.5 + 0.5 * Math.sin(ph * 7);
      const P = (f) => { const e = 1 - Math.pow(1 - f, 2.4), lat = Math.sin(f * Math.PI) * bw + Math.sin(f * 6.3 + ph) * s2 * f, al = reach * (f * f * 0.45 + f * 0.55); return [base[0] + ux * al - uz * lat, H * e + Math.sin(f * 7 + ph * 2) * 0.3 * f - 1.5 * dr * smoothstep(0.6, 1, f), base[2] + uz * al + ux * lat]; };
      for (let j = 0; j <= 6; j++) pts.push(P(j / 6));
      pushTube(W, pts, 0.21, 0.035, 5, cBough, cTwig, (p, f) => [f * 0.7, ph, 0]);
      for (const [f0, sg] of [[0.42, 1], [0.6, -1]]) {                                                  // two limbs leave it, swing off to either side and droop at the tip
        const o = P(f0), L = xb.range(3.2, 5.6), an = sg * xb.range(0.45, 0.9), ca = Math.cos(an), sa = Math.sin(an), fx = ux * ca - uz * sa, fz = uz * ca + ux * sa, q = [];
        for (let j = 0; j <= 4; j++) { const t = j / 4, wob = Math.sin(t * 4 + ph + f0 * 9) * 0.4 * t; q.push([o[0] + fx * L * t - fz * wob, o[1] + 0.9 * Math.sin(t * 2.2) - 1.1 * t * t, o[2] + fz * L * t + fx * wob]); }
        pushTube(W, q, 0.09, 0.022, 4, cBough, cTwig, (p, t) => [0.5 + t * 0.3, ph, 0]);
        for (let k = 0; k < 7; k++) { const t = xb.range(0.3, 1), j = Math.min(3, Math.floor(t * 4)), tt = t * 4 - j;
          cards.push({ p: [lerp(q[j][0], q[j + 1][0], tt) + xb.range(-1.2, 1.2), lerp(q[j][1], q[j + 1][1], tt) + xb.range(-0.3, 0.9), lerp(q[j][2], q[j + 1][2], tt) + xb.range(-1.2, 1.2), xb.range(1.3, 2.0)], q: [xb.range(0, 6.28), xb.range(-1.2, 1.2), ph, xb.range(-0.5, 0.3)], r: [0, 0, 1, 0.7] }); } }
      for (let k = 0; k < 30; k++) { const f = rng.range(0.3, 1), j = Math.min(5, Math.floor(f * 6)), t = f * 6 - j, o = [lerp(pts[j][0], pts[j + 1][0], t), lerp(pts[j][1], pts[j + 1][1], t), lerp(pts[j][2], pts[j + 1][2], t)];
        cards.push({ p: [o[0] + rng.range(-1.6, 1.6), o[1] + rng.range(-0.3, 1.1), o[2] + rng.range(-1.6, 1.6), rng.range(1.3, 2.1)], q: [rng.range(0, 6.28), rng.range(-1.2, 1.2), ph, rng.range(-0.5, 0.3)], r: [0, 0, 1, f] }); }
    }
    for (let k = 0; k < 1500; k++) {
      if (k % 150 === 149) await tick();
      const q = at(rng.range(0.574, 0.696), rng.range(-14.5, 15), _c), hgt = rng.range(5.7, 7.7), yaw = rng.range(0, 6.28), tl = (rng() < 0.5 ? 1 : -1) * rng.range(0.95, 2.1), sz = rng.range(1.3, 2.3), tn = rng.range(-0.5, 0.35), ph = rng.range(0, 6.28);
      if (segD(q.x, q.z, gA, gB) > 16.5 || k % 4 === 3) continue;
      cards.push({ p: [q.x, hgt, q.z, sz], q: [yaw, tl, ph, tn], r: [0, 0, 1, 0.8] });
    }
    await tick();

    // ---- shafts of the low sun slanting in through gaps of the roof, over the ride and the glade (soft additive ribbons that
    // turn about their own axis to face us; they fade out near the lens and when we are above the leaves)
    let shaftMesh = null;
    { const xr = ctx.core.makeRng((ctx.seed | 0) + 2909), NSH = Math.round(34 * lerp(0.7, 1, (detail - 0.5) / 0.5)), aS = new Float32Array(NSH * 4), aT = new Float32Array(NSH * 3);
      for (let i = 0; i < NSH; i++) { const u = lerp(0.488, 0.7, (i + xr()) / NSH), q = at(u, xr.range(-15, 7), _c), top = xr.range(5.9, 7.4);
        aS.set([q.x, top, q.z, xr.range(0.45, 1)], i * 4); aT.set([(top + 0.6) / Math.max(sunDir.y, 0.12), xr.range(0.5, 1.5), xr.range(0, 6.28)], i * 3); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 3)); g.instanceCount = NSH;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uSunDir: S.uSunDir, uSunCol: S.uSunCol, uTime: S.uTime, uUnder: leafU.uUnder }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: `attribute vec4 aS; attribute vec3 aT; uniform vec3 uSunDir; uniform float uTime; varying vec2 vQ; varying float vK; varying vec3 vW;
void main(){ vec3 ax = -normalize(uSunDir + vec3(0., 1e-4, 0.)), c = aS.xyz + ax * aT.x * position.y, toC = cameraPosition - c, sd = cross(ax, toC); sd = sd / max(length(sd), 1e-3);
  vec3 w = c + sd * position.x * aT.y * (0.55 + 0.45 * position.y); float d = length(toC);
  vQ = position.xy; vW = w; vK = aS.w * (0.75 + 0.25 * sin(uTime * 0.7 + aT.z)) * (1. - smoothstep(60., 110., d));
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
        fragmentShader: `uniform vec3 uSunCol; uniform float uUnder; varying vec2 vQ; varying float vK; varying vec3 vW;
void main(){ float x = clamp(1. - vQ.x * vQ.x, 0., 1.), y = clamp(vQ.y, 0., 1.), a = x * x * smoothstep(0., 0.1, y) * (1. - 0.7 * y) * clamp(vK, 0., 1.) * smoothstep(5., 14., length(cameraPosition - vW));
  gl_FragColor = vec4(uSunCol * vec3(1., 0.84, 0.48) * a * 0.42 * clamp(uUnder, 0., 1.), 1.); }` }));
      m.name = 'sun-shafts'; m.frustumCulled = false; m.renderOrder = 2; scene.add(m); shaftMesh = m; }
    await tick();

    // ---- the willow sea: a closed lumpy top at 3.6-4.5 m. Full crowns near the route, plain domes beyond, coarse far off
    const srcA = K.crownBase, cutDome = (keepBelow) => {
      const P = [], Nn = [], U = [], sp = srcA.attributes.position.array, sn = srcA.attributes.normal.array;
      for (let t = 0; t < 80; t++) { const o = t * 9; if (Math.max(sp[o + 1], sp[o + 4], sp[o + 7]) < keepBelow) continue; for (let k = 0; k < 9; k++) { P.push(sp[o + k]); Nn.push(sn[o + k]); } U.push(0, 0, 0, 0, 0, 0, 0, 0, 0); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); return g;
    };
    const baseB = cutDome(-0.1), baseSolid = (() => {   // the crown of the willow sea: the top of the dome and fifteen of its sprays, standing a little proud of it
      const g = cutDome(-0.1), P = Array.from(g.attributes.position.array), Nn = Array.from(g.attributes.normal.array), U = Array.from(g.attributes.aUv.array), sp = srcA.attributes.position.array, sn = srcA.attributes.normal.array, su = srcA.attributes.aUv.array;
      for (let k = 0; k < 22; k++) { if (k % 3 === 2) continue; for (let o = (240 + k * 6) * 3; o < (240 + k * 6 + 6) * 3; o += 3) { P.push(sp[o] * 1.16, sp[o + 1] * 1.16 + 0.03, sp[o + 2] * 1.16); Nn.push(sn[o], sn[o + 1], sn[o + 2]); U.push(su[o], su[o + 1], su[o + 2]); } }
      g.dispose(); const o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); o.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); return o; })(), baseC = (() => {
      const ico = new THREE.IcosahedronGeometry(1, 0), s = ico.attributes.position, P = [], Nn = [], U = [];
      for (let t = 0; t < s.count / 3; t++) { let top = -9; const tri = []; for (let k = 0; k < 3; k++) { let x = s.getX(t * 3 + k), y = s.getY(t * 3 + k), z = s.getZ(t * 3 + k); const l = 1.12 + 0.18 * Math.sin(x * 3.1 + 1.3) * Math.sin(z * 2.7 + 0.4); x *= l; z *= l; y *= l; top = Math.max(top, y); if (y < -0.2) y = -0.2 + (y + 0.2) * 0.25; tri.push([x, y, z]); }
        if (top < -0.1) continue; for (const [x, y, z] of tri) { const nl = Math.hypot(x, y * 1.5 + 0.25, z) || 1; P.push(x, y, z); Nn.push(x / nl, (y * 1.5 + 0.25) / nl, z / nl); U.push(0, 0, 0); } }
      ico.dispose(); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); return g;
    })();
    const baseS = (() => { const P = [], Nn = [], U = [], sp = srcA.attributes.position.array, sn = srcA.attributes.normal.array, su = srcA.attributes.aUv.array;
      for (let o = 240 * 3; o < sp.length; o += 3) { P.push(sp[o] * 0.72, sp[o + 1] * 1.2 - 0.5, sp[o + 2] * 0.72); Nn.push(sn[o], sn[o + 1], sn[o + 2]); U.push(su[o], su[o + 1], su[o + 2]); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); return g; })();
    const listS = [[], [], [], []];
    const NCH = 6, listA = Array.from({ length: NCH }, () => []), listB = Array.from({ length: NCH }, () => []), listA2 = Array.from({ length: NCH }, () => []), listC = Array.from({ length: 3 }, () => []);
    const step = 3.0, greenShare = K.seasonDef.green; let row = 0, whipCrowns = 0;
    for (let gz = -175; gz <= 246; gz += step * 0.866, row++) {
      let colI = 0;
      for (let gx = -92; gx <= 172; gx += step, colI++) {
        if (colI % 8 === 7) await tick();
        const x = gx + (row & 1) * step * 0.5 + rng.range(-0.8, 0.8), z = gz + rng.range(-0.8, 0.8);
        const sz = rng.range(1.75, 2.4), sq = rng.range(0.6, 0.85), top0 = rng.range(3.6, 4.5), ph = rng.range(0, 6.28), tint = rng.range(-1, 1), gr = rng(), yaw = rng.range(0, 6.28), keep = rng();
        const n = nearP(x, z); if (n.d > 86) continue;
        const top = n.d < 7 && n.y > 5 ? Math.min(top0, 3.95 + 0.07 * n.d) : top0;                 // we skim the leaves: no crown reaches the lens
        const f = field(x, z); if (f.cover < 0.5 + 0.3 * keep) continue;
        if (clumps.some((c) => Math.hypot(c[0] - x, c[1] - z) < 0.9)) continue;
        if (n.y < 5.5 && n.u > 0.45 && n.d < 6.0) continue;                                   // nothing in the lane we fly down
        const gd = segD(x, z, gA, gB), ld = laneD(x, z), ed = egD(x, z), near0 = Math.hypot(x, z), green = gr < 0.035 && n.d > 10 ? 1 : gr < 0.035 + greenShare ? lerp(0.5, 0.9, keep) : 0;
        const y0 = f.h - 1.0, ch = Math.min(NCH - 1, Math.floor(n.u / 0.72 * NCH));
        const tierA = f.out < 9 || n.d < (n.u < 0.44 ? 10.5 : 7.5) || gd < 16.5 || ed < 11 || mouthD(x, z) < 18 || near0 < 16.5 || (n.u > 0.44 && n.d < 11), tierB = !tierA && n.d < (n.u < 0.44 ? 14.5 : 16);
        if (!tierA && !tierB) { if ((row & 1) || (colI & 1) || keep > lerp(0.75, 1.01, detail) || (keep > 0.74 && n.d > 42)) continue; listC[Math.min(2, Math.floor(n.u * 3 / 0.72))].push({ p: [x, y0 + top - sz * 1.85 * 0.52, z, sz * 1.85], q: [yaw, 0, ph, tint], r: [green, 0, 0.52, 0] }); continue; }
        const underV = f.out < 4.6 || gd < 17 || ld < 7 || ed < 10.4 || mouthD(x, z) < 15.6 || (n.u > 0.47 && n.d < 10);                               // crowns we see from below or beside: sprays, whips and a skirt
        (tierA ? (underV ? listA : listA2) : listB)[ch].push({ p: [x, y0 + top - sz * sq, z, sz], q: [yaw, 0, ph, tint], r: [green, 0, sq, tierA ? 0.3 : 0] });
        if (tierA && underV && whipCrowns < 1500) {                     // whip stems fanning from the stool where we see under the leaves
          whipCrowns++; listS[zBand(z)].push({ p: [x, y0 + 1.55, z, sz * 0.95], q: [yaw + 1.7, 0, ph + 1, tint * 0.8 - 0.2], r: [green, 0, 1, 0] });
          for (let k = 0; k < 5; k++) { const a = k * 1.257 + ph, r = sz * (0.4 + 0.3 * ((k * 0.37 + keep) % 1)), ty = top - sz * sq * (0.3 + 0.5 * ((k * 0.61 + gr) % 1));
            pushTube(WH[zBand(z)], [[x + Math.cos(a) * 0.15, y0 + 0.9, z + Math.sin(a) * 0.15], [x + Math.cos(a) * r * 0.45, y0 + ty * 0.55, z + Math.sin(a) * r * 0.45], [x + Math.cos(a) * r, y0 + ty, z + Math.sin(a) * r]], 0.045, 0.016, 3, cWhip, cTwig, (p, t) => [t * 0.6, ph, 0]); }
        }
      }
      await tick();
    }
    const leafMeshes = [];
    const addLeaves = (base, list, name) => {
      if (!list.length) return; const g = instanced(base, list), bb = new THREE.Box3();
      for (const o of list) { bb.expandByPoint(_v.set(o.p[0] - 6, o.p[1] - 5, o.p[2] - 6)); bb.expandByPoint(_v.set(o.p[0] + 6, o.p[1] + 9, o.p[2] + 6)); }
      g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(g, K.leafMat); m.name = name; scene.add(m); leafMeshes.push(m);
    };
    for (let i = 0; i < NCH; i++) { addLeaves(srcA, listA[i], 'willow-near-' + i); await tick(); addLeaves(baseSolid, listA2[i], 'willow-top-' + i); await tick(); addLeaves(baseB, listB[i], 'willow-mid-' + i); await tick(); }
    for (let i = 0; i < 3; i++) { addLeaves(baseC, listC[i], 'willow-far-' + i); await tick(); }
    const skirtMeshes = []; for (let k = 0; k < 4; k++) if (listS[k].length) { addLeaves(baseS, listS[k], 'willow-skirts-' + k); skirtMeshes.push(leafMeshes[leafMeshes.length - 1]); await tick(); }   // under the leaves of the lanes and glade: drawn only when we are near them
    K.crownMesh.visible = false;                                               // the hero's own (empty) willow patch
    const cardChunks = [[], [], []]; for (const c of cards) cardChunks[c.p[2] > 70 ? 0 : c.p[2] > -60 ? 1 : 2].push(c);
    await tick();
    for (let i = 0; i < 3; i++) { addLeaves(K.cardBase, cardChunks[i], 'spire-leaves-' + i); await tick(); }
    await tick();

    // ---- the old wood on the terrace, 25 m tall, a dark-gold wall on three sides and behind the cut bank
    const cDrift0 = col('#5c4f3e', 0.5), listT = [], listTl = [], listTf = [], listTc = [], rEnd = new THREE.Vector3(-endDir.z, 0, endDir.x);
    const cBole = col('#8d8372', 0.3), cBoleD = col('#6d6558', 0.26);
    const oldTree = (x, z, dark, nearWall, back = false) => {
      const ph = rng.range(0, 6.28), kind = rng(), k1 = rng(), k2 = rng(), tn = rng.range(-1.3, 0.5) - dark * 1.2 - (nearWall ? 0.2 : 0), yaw = rng.range(0, 6.28);
      const pop = kind < 0.55, hF = nearWall ? 0.74 + 0.56 * ((k1 * 7.3 + k2 * 3.1) % 1) : 1, sz = (pop ? lerp(5.0, 6.6, k1) * (nearWall ? 0.8 : 1) : lerp(6.6, 8.8, k1)) * hF, sq = pop ? lerp(2.0, 2.5, k2) * (nearWall ? 1.35 : 1) : lerp(1.5, 1.95, k2), g0 = Math.max(heightAt(x, z), 4), lift = ((pop ? 8.5 : 8) - (nearWall ? 1.2 + 2.6 * ((k1 * 13.7) % 1) : 0)) * hF;
      (nearWall ? listT : listTc).push({ p: [x, g0 + lift + sz * sq * 0.42, z, sz], q: [yaw, 0, ph, tn], r: [(season === 'early' ? 0.4 : 0.1) + 0.5 * k2 * k2, 0, sq, 1] });
      if (nearWall) for (let b = 0; b < 3; b++) { const a = ph + b * 2.1, rr = sz * (0.5 + 0.25 * ((k1 * 7 + b * 0.37) % 1)), s2 = sz * (0.5 + 0.2 * ((k2 * 5 + b * 0.61) % 1));   // lobes: lower shoulders and one high head
        listTl.push({ p: [x + Math.cos(a) * rr * (b === 2 ? 0.4 : 1), g0 + lift + sz * sq * (b === 2 ? 0.8 : 0.2 + 0.3 * ((k1 * 3 + b * 0.5) % 1)), z + Math.sin(a) * rr * 0.7, s2 * 1.1], q: [yaw + b, 0, ph + b * 1.7, tn + (b === 2 ? 0.4 : -0.35)], r: [(season === 'early' ? 0.4 : 0.1) + 0.3 * k2, 0, b === 2 ? sq * 0.95 : 1.1, 1] }); }
      if (nearWall && !back) for (let b = 0; b < (((k1 * 11.3) % 1) < 0.5 ? 2 : 1); b++) { const a = ph * 2 + b * 2.6, s3 = sz * (0.3 + 0.14 * ((k2 * 9 + b * 0.43) % 1)); listTl.push({ p: [x + Math.cos(a) * sz * 0.42, g0 + lift + sz * sq * (1.0 + 0.3 * ((k1 * 5 + b * 0.7) % 1)), z + Math.sin(a) * sz * 0.3, s3], q: [yaw + b * 2, 0, ph + b * 3.1, tn + 0.5], r: [(season === 'early' ? 0.4 : 0.1), 0, 1.5, 1] }); }
      listTf.push({ p: [x + (k2 - 0.5) * 3, g0 + 0.8, z + (k1 - 0.5) * 3, back ? sz * 1.2 + 2.4 : sz * 0.62 + 1.9], q: [yaw + 2, 0, ph + 1, -1.9 - 0.4 * k1], r: [0.55, 0, back ? (pop ? 1.5 : 1.1) : 1.0, 0] });
      if (nearWall && !back && ((k2 * 7.7) % 1) < 0.6) listTf.push({ p: [x + 3.1 * Math.cos(ph * 3) + (k1 - 0.5) * 2, g0 + 0.5 + 2.2 * k2, z + (k2 - 0.5) * 3, sz * 0.45 + 1.6], q: [yaw + 4, 0, ph + 2, -1.2 - 0.9 * k2], r: [0.45 * k1, 0, 0.9 + 0.5 * k1, 0] });   // young growth between the boles: bronze and dull green   // the understorey: no sky between the boles
      pushTube(W, [[x, g0 - 0.5, z], [x + (k1 - 0.5), g0 + lift + sz * sq * 0.5, z + (k2 - 0.5)]], pop ? 0.62 : 0.85, 0.3, 4, back ? cBoleD : cBole, back ? cBoleD : cBole, () => [0, ph, 0]);
    };
    for (let row = 0; row < 4; row++) for (let k = -34; k <= 34; k++) { if (k % 12 === 0) await tick(); const al = 61 + row * 7.5 + rng.range(-2.5, 2.5), la = k * 6.2 + rng.range(-2.2, 2.2) + row * 2.3; oldTree(endP.x + endDir.x * al + rEnd.x * la, endP.z + endDir.z * al + rEnd.z * la, row === 0 ? 0.35 : 0.6, true, row >= 2); }
    await tick();
    for (let i = 0; i < PL.length; i += 2) { await tick(); for (const sd of [-1, 1]) for (let row = 0; row < 2; row++) { const q = at(PL[i][3], sd * (272 + row * 13 + rng.range(-4, 4)), _c), x = q.x, z = q.z; const keep = rng(); if (field(x, z).terr < 0.85 || listTc.some((o) => Math.hypot(o.p[0] - x, o.p[2] - z) < 5) || keep > lerp(0.6, 1.01, detail)) continue; oldTree(x, z, 0, false, row === 1); } }
    await tick();
    for (let row = 0; row < 2; row++) for (let k = -36; k <= 36; k++) { if (k % 12 === 0) await tick(); oldTree(startP.x + k * 7.6 + rng.range(-2.5, 2.5), 300 + row * 12 + rng.range(-3, 3), 0, false, row === 1); }
    await tick();
    addLeaves(baseC, listTf, 'terrace-wood-under'); addLeaves(baseC, listTc.map((o) => ({ p: [o.p[0], o.p[1], o.p[2], o.p[3] * 0.94], q: o.q, r: o.r })), 'terrace-wood-far');   // 270 m off and more: the coarse dome
    addLeaves(baseB, listT, 'terrace-wood'); addLeaves(baseC, listTl, 'terrace-wood-lobes');
    await tick();

    let cypMesh = null;
    // ---- swamp cypresses on the cut bank and the island: rust feathered cones on fluted, buttressed boles
    { const P = [], Nn = [], C = [], rust = col('#a8703c', 0.7), rustD = col('#5e4126', 0.58), bark = col('#5c4a3c', 0.6), c = new THREE.Color();
      const tri = (a, b, d, ca, cb, cd) => { const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize(); for (const [v, k] of [[a, ca], [b, cb], [d, cd]]) { P.push(v.x, v.y, v.z); Nn.push(n.x * 0.5, n.y * 0.5 + 0.5, n.z * 0.5); C.push(k.r, k.g, k.b); } };
      const cyp = (x, y, z, H) => {
        const ring = (yy, r, wob, ph, n) => { const o = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + ph; const rr = r * (1 + wob * Math.sin(a * 5 + ph * 3) + wob * 0.5 * Math.sin(a * 9 + ph)); o.push(new THREE.Vector3(x + Math.cos(a) * rr, y + yy, z + Math.sin(a) * rr)); } return o; };
        const band = (A, B, ca, cb) => { const n = A.length; for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; tri(A[k], B[k], A[k1], ca, cb, ca); tri(A[k1], B[k], B[k1], ca, cb, cb); } };
        // a flared, fluted, buttressed bole standing in the shallows, then a straight shaft into the cone
        const ph = rng.range(0, 6.28), barkD = bark.clone().multiplyScalar(0.6), R1 = ring(-0.8, H * 0.125, 0.4, ph, 10), R2 = ring(H * 0.05, H * 0.07, 0.34, ph, 10), R3 = ring(H * 0.15, H * 0.034, 0.12, ph, 10);
        band(R1, R2, barkD, bark); band(R2, R3, bark, bark); band(R3, ring(H * 0.6, H * 0.016, 0, ph, 10), bark, barkD);
        // the crown: eighteen whorls of drooping feathered sprays, long and short by turns, so the outline is ragged
        const NT = 18;
        for (let t = 0; t < NT; t++) { const f = t / (NT - 1), y0 = H * (0.2 + 0.74 * f), r = H * (0.215 * Math.pow(1 - f, 0.8) + 0.02) * rng.range(0.85, 1.12), hh = H * 0.13, p2 = ph + t * 2.1, A = [], n = f > 0.7 ? 7 : 10;
          for (let k = 0; k < n; k++) { const a = k / n * TAU + p2 + rng.range(-0.12, 0.12), long = k & 1, rr = r * (long ? rng.range(0.85, 1.3) : rng.range(0.4, 0.62)); A.push(new THREE.Vector3(x + Math.cos(a) * rr, y + y0 - (long ? r * rng.range(0.3, 0.6) : -r * 0.1), z + Math.sin(a) * rr)); }
          const tip = new THREE.Vector3(x + rng.range(-0.2, 0.2), y + y0 + hh, z + rng.range(-0.2, 0.2));
          c.copy(rust).lerp(rustD, rng.range(0.35, 0.95)); const cc = c.clone(), ct = rust.clone().multiplyScalar(rng.range(0.85, 1.2)), ce = rust.clone().lerp(col('#d08a3a', 0.62), rng.range(0.1, 0.7));
          const hub = new THREE.Vector3(x, y + y0 + hh * 0.5, z), I = A.map((a) => new THREE.Vector3(x + (a.x - x) * 0.36, y + y0 - r * 0.05, z + (a.z - z) * 0.36)), cd = rustD.clone().multiplyScalar(0.7);
          for (let k = 0; k < n; k++) { const a = A[k], dx = a.x - x, dz = a.z - z, m1 = new THREE.Vector3(x + dx * 0.55 - dz * 0.21, a.y + (hub.y - a.y) * 0.4, z + dz * 0.55 + dx * 0.21), m2 = new THREE.Vector3(x + dx * 0.55 + dz * 0.21, m1.y, z + dz * 0.55 - dx * 0.21);
            tri(hub, m1, a, cc, k & 1 ? ce : ct, ce); tri(hub, a, m2, cc, ce, k & 1 ? ct : cc); tri(I[k], tip, I[(k + 1) % n], cd, cc, cd); } }
      };
      const r = new THREE.Vector3(-endDir.z, 0, endDir.x), spots = [];
      for (let k = -12; k <= 12; k++) { const al = 41 + rng.range(-4, 7), la = k * 11.5 + rng.range(-4, 4); if (Math.abs(la) < 9) continue; spots.push([endP.x + endDir.x * al + r.x * la, endP.z + endDir.z * al + r.z * la, rng.range(12.5, 15.5)]); }   // a rank of them at the foot of the cut bank
      for (let k = -3; k <= 3; k++) spots.push([endP.x + endDir.x * (24 + Math.abs(k) * 2.5 + rng.range(-2, 2)) + r.x * (k * 5.6 + rng.range(-1.5, 1.5)), endP.z + endDir.z * (24 + Math.abs(k) * 2.5 + rng.range(-2, 2)) + r.z * (k * 5.6 + rng.range(-1.5, 1.5)), rng.range(14.5, 17.5)]);   // a dark stand right behind the portal
      spots.push([endP.x + endDir.x * 14 + r.x * 20, endP.z + endDir.z * 14 + r.z * 20, 13.5], [endP.x + endDir.x * 17 - r.x * 23, endP.z + endDir.z * 17 - r.z * 23, 12.5], [endP.x + endDir.x * 8 + r.x * 31, endP.z + endDir.z * 8 + r.z * 31, 11.5]);
      for (const [x, z, H] of spots) { cyp(x, heightAt(x, z), z, H); castShade(x, z, H * 0.9, H * 0.14, 0, 0.6); await tick(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.name = 'cypresses'; scene.add(m); cypMesh = m; }
    await tick();

    // ---- driftwood on the bars, snapped and stripped willow stems along the lanes (all into the one wood mesh)
    const cDrift = col('#c2b496', 0.66), cDriftD = col('#8c7c62', 0.58), driftSpots = [], shadows = [];   // shadows: [ax, az, bx, bz, height] of things lying or standing on the bars
    for (let i = 0; i < 400 && driftSpots.length < 13; i++) {
      if (i % 8 === 7) await tick();
      const u = rng.range(0.72, 0.99 * KO), q = at(u, rng.range(-34, 34), new THREE.Vector3()), y = heightAt(q.x, q.z), L = rng.range(4, 11), a = rng.range(0, 6.28), r0 = rng.range(0.3, 0.52);
      if (y < -0.75 || y > 1 || driftSpots.some((d) => d.distanceTo(q) < 9) || Math.hypot(q.x - endP.x, q.z - endP.z) < 12 || onBars(q.x, q.z, 8) || (hyC && Math.hypot(q.x - hyC.x, q.z - hyC.z) < 16)) continue;
      driftSpots.push(q); const pts = [], dx = Math.cos(a), dz = Math.sin(a);
      for (let j = 0; j <= 5; j++) { const f = j / 5; pts.push([q.x + dx * L * (f - 0.5) + Math.sin(f * 3 + a) * 0.3, y + r0 * 0.7 + f * rng.range(0, 0.5), q.z + dz * L * (f - 0.5) + Math.cos(f * 3 + a) * 0.3]); }
      pushTube(W, pts, r0, r0 * 0.45, 6, cDriftD, cDrift, () => [0, a, 0]);
      { const p0 = pts[0], sx = -dz, sz = dx;                                   // the root plate, torn out of some bank upstream
        for (let k = 0; k < 7; k++) { const ra = k / 7 * TAU + rng.range(-0.3, 0.3), cs = Math.cos(ra), sn = Math.max(-0.25, Math.sin(ra)), rl = rng.range(0.7, 1.5) * (0.6 + r0 * 2);
          pushTube(W, [p0, [p0[0] + sx * cs * rl * 0.5 - dx * 0.25, p0[1] + sn * rl * 0.5, p0[2] + sz * cs * rl * 0.5 - dz * 0.25], [p0[0] + sx * cs * rl - dx * 0.2, p0[1] + sn * rl + 0.1, p0[2] + sz * cs * rl - dz * 0.2]], r0 * 0.42, 0.03, 4, cDriftD, cDrift, () => [0, a, 0]); }
        shadows.push([pts[0][0], pts[0][2], pts[5][0], pts[5][2], r0 * 1.5 + 0.1], [p0[0] - sx * 0.9, p0[2] - sz * 0.9, p0[0] + sx * 0.9, p0[2] + sz * 0.9, 1.1]); }
      for (let b = 0; b < 4; b++) { const f = rng.range(0.25, 0.95), j = Math.floor(f * 5), o = pts[Math.min(5, j)], bl = rng.range(0.6, 1.8), ba = a + rng.range(1, 2.2) * (b & 1 ? 1 : -1);
        pushTube(W, [o, [o[0] + Math.cos(ba) * bl * 0.6, o[1] + bl * 0.5, o[2] + Math.sin(ba) * bl * 0.6], [o[0] + Math.cos(ba) * bl, o[1] + bl * 0.95, o[2] + Math.sin(ba) * bl]], r0 * 0.3, 0.02, 4, cDrift, cDrift, () => [0, a, 0]); }
    }
    { const q = at(KO - 0.02, -8.4, new THREE.Vector3()), a = Math.atan2(endDir.x, -endDir.z) + 0.3, dx = Math.cos(a), dz = Math.sin(a), L = 8.5, r0 = 0.36, y = Math.max(heightAt(q.x, q.z), -1.02), pts = [];   // the stranded trunk by our line (no random draws)
      for (let j = 0; j <= 5; j++) { const f = j / 5; pts.push([q.x + dx * L * (f - 0.5) + Math.sin(f * 3 + a) * 0.3, y + r0 * 0.75 + f * 0.35, q.z + dz * L * (f - 0.5) + Math.cos(f * 3 + a) * 0.3]); }
      const cBl = col('#c4b698', 0.66), cBlD = col('#9a8a6c', 0.6);
      pushTube(W, pts, r0, r0 * 0.5, 6, cBlD, cBl, () => [0, a, 0]); const p0 = pts[0], sx = -dz, sz = dx;
      for (let k = 0; k < 9; k++) { const ra = k / 9 * TAU + 0.2 * Math.sin(k * 5.1), cs = Math.cos(ra), sn = Math.max(-0.25, Math.sin(ra)), rl = (0.9 + 0.7 * ((k * 0.618) % 1)) * 1.3;
        pushTube(W, [p0, [p0[0] + sx * cs * rl * 0.5 - dx * 0.25, p0[1] + sn * rl * 0.5, p0[2] + sz * cs * rl * 0.5 - dz * 0.25], [p0[0] + sx * cs * rl - dx * 0.2, p0[1] + sn * rl + 0.1, p0[2] + sz * cs * rl - dz * 0.2]], r0 * 0.42, 0.03, 4, cBlD, cBl, () => [0, a, 0]); }
      for (let b = 0; b < 3; b++) { const o = pts[2 + b], bl = 1.1 + 0.4 * b, ba = a + (b & 1 ? 1.4 : -1.6); pushTube(W, [o, [o[0] + Math.cos(ba) * bl * 0.6, o[1] + bl * 0.5, o[2] + Math.sin(ba) * bl * 0.6], [o[0] + Math.cos(ba) * bl, o[1] + bl * 0.95, o[2] + Math.sin(ba) * bl]], r0 * 0.3, 0.025, 4, cDrift, cDrift, () => [0, a, 0]); }
      shadows.push([pts[0][0], pts[0][2], pts[5][0], pts[5][2], r0 * 2.3 + 0.3], [p0[0] - sx * 1.1, p0[2] - sz * 1.1, p0[0] + sx * 1.1, p0[2] + sz * 1.1, 1.7]); }
    for (let i = 0; i < 260; i++) {
      if (i % 16 === 15) await tick();
      const u = rng.range(0.49, 0.72), q = at(u, rng.range(-16, 22), _c), x = q.x, z = q.z, a = rng.range(0, 6.28), L = rng.range(0.7, 2.4), tl = rng.range(0.1, 0.9);
      const f = field(x, z); if (f.tramp < 0.25 || f.tramp > 0.97 || f.d < 3.5) continue;
      const y = heightAt(x, z);
      pushTube(W, [[x, y - 0.1, z], [x + Math.cos(a) * L * tl * 0.5, y + L * 0.55, z + Math.sin(a) * L * tl * 0.5], [x + Math.cos(a) * L * tl, y + L * (1 - tl * 0.4), z + Math.sin(a) * L * tl]], 0.035, 0.018, 3, cWhip, col('#b9ab86', 0.5), () => [0.1, a, 0]);
    }
    await tick();
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute('position', new THREE.Float32BufferAttribute(W.p, 3)); wgeo.setAttribute('normal', new THREE.Float32BufferAttribute(W.n, 3));
    wgeo.setAttribute('color', new THREE.Float32BufferAttribute(W.c, 3)); wgeo.setAttribute('aW', new THREE.Float32BufferAttribute(W.w, 3)); wgeo.setIndex(W.i);
    const woodMesh = new THREE.Mesh(wgeo, K.woodMat); woodMesh.name = 'spire-wood'; woodMesh.frustumCulled = false; scene.add(woodMesh);
    const whipMeshes = [];
    for (let k = 0; k < 4; k++) { const w = WH[k]; if (!w.i.length) continue; const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(w.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(w.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(w.c, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(w.w, 3)); g.setIndex(w.i);
      g.computeBoundingSphere(); g.boundingSphere.radius += 2; const m = new THREE.Mesh(g, K.woodMat); m.name = 'willow-whips-' + k; scene.add(m); whipMeshes.push(m); await tick(); }
    await tick();

    const shTex = new THREE.DataTexture(shData, SHN, SHN, THREE.RGBAFormat); shTex.magFilter = shTex.minFilter = THREE.LinearFilter; shTex.needsUpdate = true;
    leafU.uShade.value = shTex; leafU.uShadeST.value.set(1 / MAPW, 1 / MAPW, 0.5 - MAPC[0] / MAPW, 0.5 - MAPC[1] / MAPW); groundMat.uniforms.uShade.value = shTex;
    await tick();

    // ---- the floor where we can see it: dying bronze fern in the glade and lanes, horsetail stands on the wet silt
    const floorMat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...S, uFrostK: { value: frostK } }, fog: true, side: THREE.DoubleSide,
      vertexShader: `attribute vec3 aUv; attribute vec4 iP, iQ; uniform float uTime, uWind; uniform vec2 uWindDir; varying vec3 vUv, vWorld; varying float vTint;
#include <fog_pars_vertex>
void main(){ float c = cos(iQ.x), s = sin(iQ.x); vec3 p = position * iP.w; p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  float sw = sin(uTime * 2.3 + iQ.y + position.y * 3.) + 0.5 * sin(uTime * 5.1 + iQ.y * 2.3 + position.x * 5.);
  vec3 w = iP.xyz + p; w.xz += uWindDir * sw * 0.07 * uWind * aUv.y * aUv.y * iP.w * (aUv.z > 0.5 ? 1.6 : 1.);
  vec4 world = modelMatrix * vec4(w, 1.); vWorld = world.xyz; vUv = aUv; vTint = iQ.z;
  vec4 mvPosition = viewMatrix * world; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `${SUN_PARS} uniform float uFrostK; varying vec3 vUv, vWorld; varying float vTint;
#include <fog_pars_fragment>
void main(){ float u = abs(vUv.x), v = vUv.y; vec3 alb; float a;
  if (vUv.z < 0.5) { float pin = abs(fract(v * 11.) - 0.5) * 2.; a = step(u, (0.16 + 0.84 * pin) * (1. - v * 0.75) + 0.05);
    alb = mix(vec3(0.16, 0.09, 0.03), mix(vec3(0.5, 0.3, 0.09), vec3(0.34, 0.36, 0.1), clamp(vTint, 0., 1.)), 0.35 + 0.65 * v) * (0.75 + 0.35 * pin); }
  else if (vUv.z < 1.5) { float j = fract(v * 8.); a = max(step(u, 0.3 * (1. - 0.5 * smoothstep(0.9, 1., v))), step(j, 0.16) * step(u, 0.95 * (1. - 0.5 * v)) * step(0.1, v) * step(v, 0.9) * step(0.45, fract(u * 4. + j * 3.)));
    alb = mix(vec3(0.07, 0.13, 0.07), vec3(0.14, 0.24, 0.12), v) * (1. - 0.6 * step(0.86, j)) * (0.85 + 0.3 * vTint); alb = mix(alb, vec3(0.34, 0.26, 0.12), step(0.93, v)); }
  else { float sd = step(0., vUv.x), j = fract(v * 5.5 + sd * 0.5), lu = clamp(u / 0.85, 0., 1.), lw = 0.2 * sin(3.14159 * lu) * step(0.1, v) * step(v, 0.97);   // willow seedling: a whip with narrow leaves angled up it, by turns
    a = max(step(u, 0.045), step(abs(j - 0.25 - lu * 0.38), lw) * step(u, 0.85));
    alb = mix(vec3(0.3, 0.2, 0.06), mix(vec3(0.62, 0.42, 0.08), vec3(0.4, 0.42, 0.12), clamp(vTint, 0., 1.) * 0.7), smoothstep(0.03, 0.1, u)) * (0.7 + 0.45 * v); }
  if (a < 0.5) discard;
  alb = mix(alb, vec3(0.7, 0.75, 0.8), uFrostK * 0.14 * v);
  vec3 col = alb * (uSunCol * (0.35 + 0.5 * v) + mix(uGroundCol, uSkyCol, 0.7) * 1.1);
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}` });
    const plantBase = (kind) => { const P = [], U = [];
      if (kind === 0) for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + (k % 2) * 0.3, L = 0.75 + 0.35 * ((k * 0.37) % 1), dx = Math.cos(a), dz = Math.sin(a), sx = -dz, sz = dx;
        for (let j = 0; j < 2; j++) { const q = (t, s) => { const r = L * t, y = 0.8 * Math.sin(t * 2.3) * L, w = 0.22 * (1 - t * 0.6) * s; return [dx * r + sx * w, y, dz * r + sz * w, s, t]; };
          const A = q(j / 2, -1), B = q(j / 2, 1), C2 = q((j + 1) / 2, 1), D = q((j + 1) / 2, -1); for (const v of [A, B, C2, A, C2, D]) { P.push(v[0], v[1], v[2]); U.push(v[3], v[4], 0); } } }
      else for (let k = 0; k < 8; k++) { const a = k * 2.4, r = 0.08 + 0.42 * ((k * 0.618) % 1), H = 0.75 + 0.5 * ((k * 0.37) % 1), x = Math.cos(a) * r, z = Math.sin(a) * r, lx = Math.cos(a) * 0.02, lz = Math.sin(a) * 0.02;
        for (const [sx, sz] of [[0.075, 0], [0, 0.075]]) for (const v of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]]) { P.push(x + sx * v[0] + lx * v[1], H * v[1], z + sz * v[0] + lz * v[1]); U.push(v[0], v[1], 1); } }
      if (kind === 2) { P.length = 0; U.length = 0; for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, cx = Math.cos(a), cz = Math.sin(a), ox = cx * 0.12 * k, oz = cz * 0.12 * k, H = 1.5 - 0.3 * k, lx = cx * 0.2 * k, lz = cz * 0.16 * k;
        for (const v of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]]) { P.push(ox - cz * 0.26 * v[0] + lx * v[1], H * v[1], oz + cx * 0.26 * v[0] + lz * v[1]); U.push(v[0], v[1], 2); } } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3)); return g; };
    const ferns = [], tails = [];
    for (let i = 0; i < 9000 && ferns.length < Math.round(600 * detail * density); i++) {
      if (i % 6 === 5) await tick();
      const u = rng.range(0.47, 0.76), q = at(u, rng.gauss() * 11 + 3, _c), x = q.x, z = q.z, sz = rng.range(0.6, 1.15), yaw = rng.range(0, 6.28), tn = rng.range(-0.4, 0.9), keep = rng();
      const f = field(x, z); if (f.d < 3.4 || !((f.tramp > 0.05 && keep < 0.12 + 0.88 * (1 - f.tramp)) || (f.bar > 0.15 && f.bar < 0.95)) || heightAt(x, z) < -0.7 || vnClump(x * 2.3, z * 2.3) < 0.55) continue;
      ferns.push({ p: [x, heightAt(x, z) - 0.03, z, sz], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] });
    }
    for (let i = 0; i < 9000 && tails.length < Math.round(430 * detail * density); i++) {
      if (i % 8 === 7) await tick();
      const u = rng.range(0.69, KO), q = at(u, rng.gauss() * 16, _c), x = q.x + rng.range(-2, 2), z = q.z + rng.range(-2, 2), sz = rng.range(0.8, 1.25), yaw = rng.range(0, 6.28), tn = rng.range(-0.3, 0.6);
      const y = heightAt(x, z); if (y < -1.12 || y > -0.45 || Math.hypot(x - endP.x, z - endP.z) < 6) continue;
      const cl = vnClump(x, z); if (cl < 0.5) continue;
      tails.push({ p: [x, y - 0.02, z, sz], q: [yaw, yaw * 5, tn, 0], r: [0, 0, 0, 0] });
      shadows.push([x + sdz * 0.42 * sz, z - sdx * 0.42 * sz, x - sdz * 0.42 * sz, z + sdx * 0.42 * sz, 0.95 * sz]);
    }
    { const xr = ctx.core.makeRng((ctx.seed | 0) + 4411);                                  // the first glade: bronze fern along its edges and in drifts on its floor
      for (let i = 0; i < 2600 && ferns.length < Math.round(820 * detail * density); i++) {
        if (i % 8 === 7) await tick();
        const t = xr(), k = t < 0.55 ? 0 : 1, f = k ? (t - 0.55) / 0.45 : t / 0.55, cx = lerp(eG[k].x, eG[k + 1].x, f), cz = lerp(eG[k].z, eG[k + 1].z, f), sd = (xr() < 0.5 ? -1 : 1) * (3 + 7 * Math.sqrt(xr())), x = cx + sd, z = cz + xr.range(-2, 2), sz = xr.range(0.65, 1.3), yaw = xr.range(0, 6.28), tn = xr.range(-0.4, 0.9);
        const fd = field(x, z); if (fd.d < 3.2 || fd.tramp < 0.05 || (Math.abs(x - TRACKS.a1.p[0]) < 1.9 && z > 112) || vnClump(x * 2.3, z * 2.3) < 0.42 + 0.22 * fd.tramp) continue;
        if (heightAt(x, z) < -0.55) continue;
        ferns.push({ p: [x, heightAt(x, z) - 0.03, z, sz], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] });
      } }
    const seedl = [];
    for (let i = 0; i < 7000 && seedl.length < Math.round(420 * detail * density); i++) {
      if (i % 8 === 7) await tick();
      const u = rng.range(0.7, KO), q = at(u, rng.gauss() * 14, _c), x = q.x + rng.range(-2, 2), z = q.z + rng.range(-2, 2), sz = rng.range(0.45, 1.05), yaw = rng.range(0, 6.28), tn = rng.range(-0.2, 1), keep = rng();
      const y = heightAt(x, z); if (y < -0.74 || y > 0.7 || Math.hypot(x - endP.x, z - endP.z) < 7.5 || vnClump(x * 1.7 + 40, z * 1.7) < 0.5 + 0.12 * keep) continue;
      seedl.push({ p: [x, groundY(x, z) - 0.03, z, sz], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] });
      shadows.push([x + sdz * 0.4 * sz, z - sdx * 0.4 * sz, x - sdz * 0.4 * sz, z + sdx * 0.4 * sz, 0.6 * sz]);
    }
    // the island in front of the ring, the last ground we see: fern rosettes and willow seedlings in drifts (its own random stream)
    const isleF = [];
    { const xr = ctx.core.makeRng((ctx.seed | 0) + 7717);
      for (let i = 0; i < 400; i++) { if (i % 80 === 79) await tick(); const u = xr.range(KO - 0.055, KO - 0.002), sd = (xr() < 0.5 ? -1 : 1) * xr.range(2.2, 17), q = at(u, sd, _c), x = q.x, z = q.z, kind = xr(), sz = xr.range(0.85, 1.5), yaw = xr.range(0, 6.28), tn = xr.range(-0.2, 1);
        const y = heightAt(x, z); if (y < -0.7 || Math.hypot(x - endP.x, z - endP.z) < 8.2 || vnClump(x * 2.1 + 17, z * 2.1) < 0.47) continue;
        if (kind < 0.42) isleF.push({ p: [x, groundY(x, z) - 0.03, z, sz * 0.85], q: [yaw, yaw * 3, tn - 0.3, 0], r: [0, 0, 0, 0] }); else seedl.push({ p: [x, groundY(x, z) - 0.03, z, sz], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] });
        shadows.push([x + sdz * 0.4 * sz, z - sdx * 0.4 * sz, x - sdz * 0.4 * sz, z + sdx * 0.4 * sz, 0.7 * sz]); } }
    const slTails = [], slFerns = [], slSeed = [];
    { const xr = ctx.core.makeRng((ctx.seed | 0) + 9917), nT = Math.round(330 * detail * density), nF = Math.round(300 * detail * density), nS = Math.round(170 * detail * density);
      // the slough's margins: horsetail stands on the wet silt of both shores, bronze fern and willow seedlings up the beach
      for (let i = 0; i < 12000 && (slTails.length < nT || slFerns.length < nF); i++) {
        if (i % 6 === 5) await tick();
        const u = xr.range(0, 0.515), sd = xr.range(-17, 13.5), q = at(u, sd, _c), x = q.x + xr.range(-1.5, 1.5), z = q.z + xr.range(-1.5, 1.5) + (u < 0.03 ? xr.range(0, 30) : 0), sz = xr.range(0.8, 1.3), yaw = xr.range(0, 6.28), tn = xr.range(-0.4, 0.9), kind = xr();
        const y = heightAt(x, z), n = nearP(x, z); if (n.d < 1.7 || y < -1.16 || y > 0.3) continue;
        const lands = heightAt(x + sdx * 2.5, z + sdz * 2.5) > -0.97;
        if (y < -0.55) { if (slTails.length >= nT || vnClump(x * 1.4, z * 1.4) < 0.5) continue; slTails.push({ p: [x, y - 0.02, z, sz], q: [yaw, yaw * 5, tn, 0], r: [0, 0, 0, 0] }); if (lands) shadows.push([x + sdz * 0.42 * sz, z - sdx * 0.42 * sz, x - sdz * 0.42 * sz, z + sdx * 0.42 * sz, 0.95 * sz]); }
        else { if (keepOff(x, z, 1.7) || Math.hypot(x - DRINK.x, z - DRINK.z) < 5 || field(x, z).tramp < 0.4 || vnClump(x * 2.1 + 9, z * 2.1) < 0.52) continue;
          if (kind < 0.62) { if (slFerns.length < nF) slFerns.push({ p: [x, y - 0.03, z, sz * 0.85], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] }); } else if (slSeed.length < nS) slSeed.push({ p: [x, y - 0.03, z, sz * 0.9], q: [yaw, yaw * 3, tn, 0], r: [0, 0, 0, 0] });
          if (lands) shadows.push([x + sdz * 0.4 * sz, z - sdx * 0.4 * sz, x - sdz * 0.4 * sz, z + sdx * 0.4 * sz, 0.6 * sz]); }
      } }
    { const P = [], Q = [], I = [], inFP = (x, z) => x > FP.x0 + 7 && x < FP.x1 - 7 && z > FP.z0 + 7 && z < FP.z1 - 7, gy = (x, z) => Math.max(inFP(x, z) ? heightAt(x, z) : groundY(x, z), -1) + 0.045;
      for (const [ax, az, bx, bz, h] of shadows) { const L = Math.min(11, h / tanEl), b0 = P.length / 3;
        for (const [x, z, u, v] of [[ax, az, -1, 0], [bx, bz, 1, 0], [bx + sdx * L, bz + sdz * L, 1, 1], [ax + sdx * L, az + sdz * L, -1, 1], [(ax + bx) / 2 + sdx * L * 0.5, (az + bz) / 2 + sdz * L * 0.5, 0, 0.5]]) { P.push(x, gy(x, z), z); Q.push(u, v); }
        I.push(b0, b0 + 1, b0 + 4, b0 + 1, b0 + 2, b0 + 4, b0 + 2, b0 + 3, b0 + 4, b0 + 3, b0, b0 + 4); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); g.setIndex(I);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: 'attribute vec2 aQ; varying vec2 vQ; void main(){ vQ = aQ; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'varying vec2 vQ; void main(){ float a = (1. - vQ.x * vQ.x) * (1. - smoothstep(0.5, 1., vQ.y)) * smoothstep(0., 0.05, vQ.y); gl_FragColor = vec4(0.02, 0.025, 0.05, 0.52 * a); }' }));
      m.name = 'bar-shadows'; m.renderOrder = 1; scene.add(m); }
    function vnClump(x, z) { return N2.n2(x * 0.09 + 31, z * 0.09) * 0.5 + 0.5 + 0.25 * N2.n2(x * 0.3, z * 0.3); }
    const addFloor = (base, list, name) => { if (!list.length) return; const g = instanced(base, list), bb = new THREE.Box3(); for (const o of list) bb.expandByPoint(_v.set(o.p[0], o.p[1], o.p[2])); bb.expandByScalar(3); g.boundingSphere = bb.getBoundingSphere(new THREE.Sphere()); const m = new THREE.Mesh(g, floorMat); m.name = name; scene.add(m); return m; };
    await tick();
    const farHide = [addFloor(plantBase(0), ferns, 'ferns')]; await tick(); farHide.push(addFloor(plantBase(1), tails, 'horsetails')); await tick(); farHide.push(addFloor(plantBase(2), seedl, 'bar-seedlings')); farHide.push(addFloor(plantBase(0), isleF, 'island-ferns')); farHide.push(addFloor(plantBase(1), slTails, 'slough-horsetails')); await tick(); farHide.push(addFloor(plantBase(0), slFerns, 'slough-ferns')); farHide.push(addFloor(plantBase(2), slSeed, 'slough-seedlings')); for (let i = farHide.length - 1; i >= 0; i--) if (!farHide[i]) farHide.splice(i, 1);
    await tick();

    // ---- leaves in the air. Mode 0: the stream going downwind, a box of leaves that wraps round the camera but is fixed
    // in the world (nothing rides with us). Mode 1: the rare gust that strips the leader's clump. Mode 2: the fall of leaves
    // when the mother's head comes down through the glade's ceiling.
    const nStream = Math.round(2600 * detail * (rare ? 1.25 : 1)), nBliz = rare ? 1700 : 0, nFall = 170, nAir = nStream + nBliz + nFall;
    const aS = new Float32Array(nAir * 4), aV = new Float32Array(nAir * 4), clumpP = heroClumps[0];
    for (let i = 0; i < nAir; i++) {
      if (i < nStream) { aS.set([rng.range(-34, 34), rng.range(-6, 6), rng.range(-34, 34), rng()], i * 4); aV.set([0, 0, 0, 0], i * 4); }
      else if (i < nStream + nBliz) { const a = rng.range(0, 6.28), r = Math.sqrt(rng()) * 3.4; aS.set([clumpP.x + Math.cos(a) * r, rng.range(4.2, 12), clumpP.z + Math.sin(a) * r, rng()], i * 4); aV.set([rng.range(-1.5, 1.5), rng.range(-0.6, 1.6), rng.range(-1.5, 1.5), 1], i * 4); }
      else { aS.set([rng.range(-1.6, 1.6), rng.range(-0.6, 1.4), rng.range(-1.6, 1.6), rng()], i * 4); aV.set([rng.range(-0.8, 0.8), rng.range(-0.4, 0.5), rng.range(-0.8, 0.8), 2], i * 4); }
    }
    const airG = new THREE.InstancedBufferGeometry();
    airG.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    airG.setAttribute('iS', new THREE.InstancedBufferAttribute(aS, 4)); airG.setAttribute('iV', new THREE.InstancedBufferAttribute(aV, 4)); airG.instanceCount = nAir;
    const airW = { ...fogU(), ...S, uCam: { value: new THREE.Vector3(0, 6.5, 196) }, uB1: { value: -1 }, uB2: { value: -1 }, uB2Pos: { value: new THREE.Vector3() }, uGold: { value: cGold }, uPoplar: { value: K.cPoplar }, uShow: { value: wind === 'calm' ? 0.55 : 1 } };
    const airMat = new THREE.ShaderMaterial({ uniforms: airW, fog: true, side: THREE.DoubleSide,
      vertexShader: `attribute vec4 iS, iV; uniform float uTime, uWind, uB1, uB2, uShow; uniform vec2 uWindDir; uniform vec3 uCam, uB2Pos;
varying vec2 vQ; varying vec3 vN, vWorld; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float seed = iS.w, mode = iV.w, size = 0.12 + 0.07 * fract(seed * 13.7), show = 1.; vec3 c;
  vec3 wind = vec3(uWindDir.x, 0., uWindDir.y) * 4.2 * max(uWind, 0.45), B = vec3(34., 6., 34.);
  if (mode < 0.5) {
    vec3 q = iS.xyz + (wind * (0.7 + 0.6 * fract(seed * 5.1)) + vec3(0., -0.5, 0.)) * uTime;
    q += vec3(sin(uTime * 1.3 + seed * 40.), 0.6 * sin(uTime * 2.1 + seed * 17.), cos(uTime * 1.1 + seed * 29.)) * 0.5;
    vec3 f = fract((q - uCam) / (2. * B) + 0.5); c = uCam + (f - 0.5) * 2. * B;
    vec3 e = min(f, 1. - f); show = smoothstep(0., 0.08, min(e.x, min(e.y * 2., e.z))) * step(fract(seed * 7.13), uShow);
  } else if (mode < 1.5) {
    float a = uB1 - fract(seed * 3.3) * 2.6, t = max(a, 0.), k = 1. - exp(-t * 1.2);
    c = iS.xyz + iV.xyz * k + wind * (0.9 + 0.9 * fract(seed * 5.1)) * (t - k * 0.5) + vec3(0., -0.9 * t, 0.);
    c += vec3(sin(t * 3.1 + seed * 40.), 0.6 * sin(t * 4.3 + seed * 17.), cos(t * 2.7 + seed * 29.)) * 0.45 * k;
    c.y = max(c.y, 4.6 + 2. * fract(seed * 9.1) - 0.2 * t); show = step(0., a) * (1. - smoothstep(4.2, 6., t)) * step(0., uB1);
  } else {
    float a = uB2 - fract(seed * 3.3) * 0.9, t = max(a, 0.), k = 1. - exp(-t * 1.5);
    c = uB2Pos + iS.xyz * vec3(1.5, 1., 1.5) + iV.xyz * k + wind * 0.2 * t + vec3(0., -2.3 * t, 0.); size *= 1.3;
    c += vec3(sin(t * 3.1 + seed * 40.), 0., cos(t * 2.7 + seed * 29.)) * 0.35 * k;
    show = step(0., a) * (1. - smoothstep(2.05, 2.55, t)) * step(0., uB2);
  }
  vec4 wc = modelMatrix * vec4(c, 1.);
  float dist = length(cameraPosition - wc.xyz); size = max(size, dist / 420.) * show * (mode > 0.5 && mode < 1.5 ? smoothstep(2.5, 7.5, dist) : smoothstep(1.3, 3.6, dist));
  float A = uTime * (2.5 + 4. * fract(seed * 9.7)) + seed * 60.;
  vec3 e1 = normalize(vec3(cos(A), 0.55 * sin(A), sin(A) * 0.8) + vec3(1e-4, 0., 0.));
  vec3 e2 = normalize(cross(e1, vec3(sin(seed * 9.) * 0.6, 0.9, cos(seed * 9.) * 0.6)) + vec3(0., 1e-4, 0.));
  vec3 w = wc.xyz + (e1 * position.x + e2 * position.y) * size;
  vQ = position.xy * 2.; vN = normalize(cross(e1, e2) + vec3(0., 1e-4, 0.)); vWorld = w; vSeed = seed;
  vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `${SUN_PARS} uniform vec3 uGold, uPoplar; varying vec2 vQ; varying vec3 vN, vWorld; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  float r = vQ.x * vQ.x + vQ.y * vQ.y * (1.6 + 1.2 * step(0.5, fract(vSeed * 3.7))); if (r > 1.) discard;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float ndl = abs(dot(vN, uSunDir)), back = clamp(dot(-V, uSunDir), 0., 1.);
  vec3 alb = mix(uGold, uPoplar, fract(vSeed * 11.3)) * (0.8 + 0.4 * fract(vSeed * 23.1));
  vec3 col = alb * (uSunCol * (0.25 + 0.75 * ndl) + mix(uGroundCol, uSkyCol, 0.6)) + alb * vec3(1.15, 0.92, 0.5) * uSunCol * back * back * 0.7;
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}` });
    const airMesh = new THREE.Mesh(airG, airMat); airMesh.name = 'leaves-in-air'; airMesh.frustumCulled = false; scene.add(airMesh);
    K.air.visible = true; airU.uDensity.value = rare ? 0.55 : 0.3;
    await tick();

    // ---- the family. The leader is the hero's; the world walks the rest: adults (the first head, the rim-lit one, the
    // mother, 0-2 feeders beyond the leader), the two half-grown and the calf. Each walker's place is a function of u.
    await prepareParaceratherium(ctx, 'adult', PAL); await prepareParaceratherium(ctx, 'half', PAL); await prepareParaceratherium(ctx, 'calf', PAL);
    const nAd = 3 + extras, adults = makeParaceratherium(ctx, { age: 'adult', count: nAd, palette: PAL }); await tick();
    const halves = makeParaceratherium(ctx, { age: 'half', count: 2, palette: PAL }); await tick();
    const calf = makeParaceratherium(ctx, { age: 'calf', count: 1, palette: PAL }); await tick();
    const casts = [adults, halves, calf];
    for (const h of casts) { Object.assign(h.uniforms, { uTime: S.uTime, uSunDir: S.uSunDir, uSunCol: S.uSunCol, uSkyCol: S.uSkyCol, uGroundCol: S.uGroundCol }); h.mesh.name = 'family-' + h.mesh.name; scene.add(h.mesh); }
    adults.set(0, { seed: 2.3, size: 1.0 }).set(1, { seed: 5.1, size: 0.97 }).set(2, { seed: 7.7, size: 0.98, dapple: 1 });
    for (let i = 0; i < extras; i++) adults.set(3 + i, { x: standers[i][0], z: standers[i][1], y: heightAt(standers[i][0], standers[i][1]), heading: i ? -2.2 : -1.9, seed: 3.1 + i * 4.4, size: 0.95 + 0.06 * i, walk: 0, chew: 1 });
    halves.set(0, { seed: 1.9 }).set(1, { seed: 6.2, size: 0.93 }); calf.set(0, { seed: 4.4, dapple: 1, chew: 0.1 });
    const WALKERS = [[adults, 0, TRACKS.a1, 1, 3.3], [adults, 1, TRACKS.a2, 2, 3.3], [halves, 0, TRACKS.h1, 3, 2.3], [halves, 1, TRACKS.h2, 4, 2.3]];
    const setAnim = (i, x, z, h, sp, k, len, y = 0) => { leafU.uAnim.value[i].set(x, z, Math.sin(h), Math.cos(h)); leafU.uAnimS.value[i].set(sp, k, len, y); };
    const motherHead = new THREE.Vector3(), leaderHead = new THREE.Vector3(), _poiA = new THREE.Vector3(), _poiB = new THREE.Vector3(), _poiC = new THREE.Vector3(), _poiD = new THREE.Vector3(), _poiE = new THREE.Vector3(), hyPos = new THREE.Vector3();
    await tick();

    // ---- cranes: a skein crossing overhead, waders stalking the braids, two waves going up as we come out over the bars
    const fLight = { sunDir: sunDir.clone(), sunColor: sunHex, sunIntensity: sunInt, sky: '#7fa6de', skyIntensity: 1.05, ground: '#a09066', groundIntensity: 0.7 };
    const cBody = whiteCranes ? '#eceae4' : '#9AA0A6', cWing = whiteCranes ? '#e2e0da' : '#8d9399';
    const craneLook = { species: 'flamingos', body: cBody, belly: whiteCranes ? '#f4f2ec' : '#aab0b6', wingC: cWing, trail: '#1c1c20', tip: '#141416', beak: '#c9b98a', head: whiteCranes ? '#d8d4cc' : '#70767c', neckC: cBody, tailC: cWing, legC: '#2c2c2e', flap: 2, glide: 0.3, size: 1.5, light: fLight };
    const fauna = F.makeFauna(scene, { light: fLight });
    const skein = fauna.add(F.makeFlock({ rng, ...craneLook, count: 30, form: 'vee', speed: 13, cross: { path, u: 0.262, lead: 15, height: 5.5, angle: 62, side: 1, span: 130, rise: 5, bow: 0, window: 0.105 } }));
    // three cranes crossing behind her head, each on its own line so they never stack: one ahead, one level, one trailing higher
    for (const [du, off, hgt] of [[0.0075, -6.5, -0.9], [0, -9, -0.3], [-0.0085, -11.5, -0.7]]) fauna.add(F.makeFlock({ rng, ...craneLook, count: 1, form: 'vee', speed: 13, cross: { path, u: 0.366 + du, lead: 17, height: hgt, angle: 172, side: -1, offset: off, span: 110, rise: 0.6, bow: 0, window: 0.092 } }));
    await tick();
    fauna.add(F.makeFlock({ rng, ...craneLook, count: Math.round(40 * detail), form: 'stream', spread: [3.4, 2.4, 30], wander: [0.6, 0.6, 0.8, 0.5], speed: 14, cross: { path, u: 0.772, lead: 58, height: 7.5, angle: 0, side: -1, offset: -10, span: 85, rise: 11, bow: 5, window: 0.065 } }), { range: 280 });
    fauna.add(F.makeFlock({ rng, ...craneLook, count: Math.round(40 * detail), form: 'stream', spread: [3.4, 2.4, 30], wander: [0.6, 0.6, 0.8, 0.5], speed: 14, cross: { path, u: 0.86, lead: 38, height: 7, angle: 0, side: 1, offset: 16, span: 77, rise: 11, bow: 0, window: 0.06 } }), { range: 280 });
    await tick();
    const wadeSpots = [];
    for (let i = 0; i < 3000 && wadeSpots.length < Math.round(52 * detail); i++) {
      if (i % 60 === 59) await tick();
      const u = rng.range(0.72, 0.99 * KO), sd = (i % 2 ? rng.range(5.5, 13) : rng.range(7, 42)) * (rng() < 0.5 ? -1 : 1), q = at(u, sd, _c), y = heightAt(q.x, q.z);
      if (y > -0.86 || y < -1.3 || Math.hypot(q.x - endP.x, q.z - endP.z) < 11 || onBars(q.x, q.z, 3.2) || wadeSpots.some((w) => Math.hypot(w[0] - q.x, w[2] - q.z) < 2.2)) continue;
      wadeSpots.push([q.x, -1, q.z]);
    }
    if (wadeSpots.length) fauna.add(F.makeWaders({ rng, species: 'crane', positions: wadeSpots, count: wadeSpots.length, level: -1, depth: 0.14, size: 0.82, body: cBody, belly: cBody, wing: whiteCranes ? '#d8d6d0' : '#7d8389', neckC: whiteCranes ? '#eceae4' : '#8a9096', cap: '#b03a2c', beakC: '#c9b98a', legC: '#2c2c2e', light: fLight }), { range: 260 });
    await tick();

    { const ms = TRAVEL * -0.028, mx = mAt.x + mLine.x * ms, mz = mAt.z + mLine.z * ms, pc = path.pointAt(mAbeam, _v), tl = Math.hypot(pc.x - mAt.x, pc.z - mAt.z), tx = (pc.x - mAt.x) / tl, tz = (pc.z - mAt.z) / tl, gl = []; let gy = 0;
      for (const [f, sd] of [[5.2, 1.3], [8.0, -1.4], [-5.6, 0.5], [2.8, -2.9]]) { const x = mx + mLine.x * f + tx * sd, z = mz + mLine.z * f + tz * sd, y = heightAt(x, z); gl.push([x, y, z]); gy += y / 4; }
      fauna.add(F.makeWaders({ rng, species: 'crane', positions: gl, count: gl.length, level: gy + 0.03, depth: 0, size: 0.82, body: cBody, belly: cBody, wing: whiteCranes ? '#d8d6d0' : '#7d8389', neckC: whiteCranes ? '#eceae4' : '#8a9096', cap: '#b03a2c', beakC: '#c9b98a', legC: '#2c2c2e', shadowOpacity: 0.22, light: fLight }), { range: 200 }); }
    await tick();

    { const gl = [], wd = [], xr = ctx.core.makeRng((ctx.seed | 0) + 5521), wLook = { species: 'crane', size: 0.82, body: cBody, belly: cBody, wing: whiteCranes ? '#d8d6d0' : '#7d8389', neckC: whiteCranes ? '#eceae4' : '#8a9096', cap: '#b03a2c', beakC: '#c9b98a', legC: '#2c2c2e', light: fLight }; let gy = 0;
      // cranes along the slough, between our line and the walkers: some on the wet beach, some wading the shallows. The measure.
      for (const [u, k] of [[0.066, 0], [0.08, 1], [0.097, 0], [0.115, 1], [0.137, 0], [0.16, 1], [0.182, 0], [0.245, 1], [0.262, 0], [0.3, 1], [0.335, 0], [0.42, 1]]) {
        const sd = shoreSide(u, k ? -1.14 : -0.84), q = at(u, sd, _c); await tick(); if (k) wd.push([q.x, -1, q.z]); else { const y = heightAt(q.x, q.z); gl.push([q.x, y, q.z]); gy += y; } }
      if (gl.length) fauna.add(F.makeWaders({ rng: xr, ...wLook, positions: gl, count: gl.length, level: gy / gl.length + 0.03, depth: 0, shadowOpacity: 0.22 }), { range: 200 });
      if (wd.length) fauna.add(F.makeWaders({ rng: xr, ...wLook, positions: wd, count: wd.length, level: -1, depth: 0.14 }), { range: 200 }); }
    await tick();

    // ---- the neighbours: entelodonts rooting in the glade, Hyaenodon drinking on the bar. One small rig for both:
    // a lofted body and head, four jointed legs that trot in diagonal pairs, a head that lowers and swings, a tail.
    // Model space: nose +Z, up +Y. aB = (part 0 body 1 head 2 leg 3 tail, param, weight, knee height), aPv = pivot.
    const beastGeo = (sp) => {
      const P = [], C = [], B = [], PV = [], I = [], c = new THREE.Color(); let bone = [0, 0, 0, 0], piv = [0, 0, 0];
      const v = (x, y, z, k) => { P.push(x, y, z); C.push(k.r, k.g, k.b); B.push(...bone); PV.push(...piv); return P.length / 3 - 1; };
      const rings = [], NS = 10;
      sp.rows.forEach(([z, top, bot, hw, hd], ri) => { const row = []; bone = [hd > 0 ? 1 : 0, 0, hd, 0]; piv = sp.neck;
        for (let k = 0; k < NS; k++) { const a = (k / NS) * TAU, sn = Math.sin(a), cs = Math.cos(a), up = sn * 0.5 + 0.5;
          c.copy(sp.belly).lerp(sp.flank, smoothstep(0.1, 0.45, up)).lerp(sp.back, smoothstep(0.6, 0.95, up)); if (sp.shade) c.multiplyScalar(sp.shade(z, up, ri));
          row.push(v(hw * cs * (0.8 + 0.2 * Math.abs(cs)), (top + bot) / 2 + (top - bot) / 2 * sn, z, c)); } rings.push(row); });
      for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < NS; k++) { const k1 = (k + 1) % NS; I.push(rings[i][k], rings[i + 1][k], rings[i][k1], rings[i][k1], rings[i + 1][k], rings[i + 1][k1]); }
      for (const [row, flip] of [[rings[0], 0], [rings[rings.length - 1], 1]]) { const r0 = sp.rows[flip ? sp.rows.length - 1 : 0]; bone = [r0[4] > 0 ? 1 : 0, 0, r0[4], 0]; const m = v(0, (r0[1] + r0[2]) / 2, r0[0] + (flip ? 0.03 : -0.03), sp.flank); for (let k = 0; k < NS; k++) { const k1 = (k + 1) % NS; if (flip) I.push(m, row[k1], row[k]); else I.push(m, row[k], row[k1]); } }
      // legs: hip, knee or hock (bent the way the joint bends), cannon, hoof
      sp.legs.forEach(([x, z, hipY, r0, fore], li) => { const kneeY = hipY * 0.52, kz = fore ? 0.03 : -0.09, pts = [[x, hipY + 0.12, z, r0 * 1.5], [x, hipY * 0.8, z + kz * 0.5, r0 * 1.15], [x, kneeY, z + kz, r0 * 0.8], [x, hipY * 0.2, z + kz * 0.4 + 0.02, r0 * 0.5], [x, 0.07, z + 0.03, r0 * 0.55], [x, 0, z + 0.06, r0 * 0.8]];
        piv = [x, hipY, z]; const rows = [];
        pts.forEach(([px, py, pz, r], j) => { const row = []; bone = [2, li, clamp(1 - py / hipY, 0, 1), kneeY]; const k = j >= 4 ? sp.hoof : c.copy(sp.flank).lerp(sp.leg, clamp(1 - py / hipY, 0, 1)).clone();
          for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; row.push(v(px + Math.cos(a) * r, py, pz + Math.sin(a) * r * 1.25, k)); } rows.push(row); });
        for (let j = 0; j < rows.length - 1; j++) for (let q = 0; q < 5; q++) { const q1 = (q + 1) % 5; I.push(rows[j][q], rows[j][q1], rows[j + 1][q], rows[j][q1], rows[j + 1][q1], rows[j + 1][q]); } });
      // tail
      { const [tz, ty, len, r, droop] = sp.tail, rows = []; piv = [0, ty, tz];
        for (let j = 0; j <= 4; j++) { const f = j / 4, row = []; bone = [3, f, f, 0]; for (let q = 0; q < 4; q++) { const a = q / 4 * TAU, rr = r * (1 - f * 0.7); row.push(v(Math.cos(a) * rr, ty - droop * len * f * f + Math.sin(a) * rr, tz - len * f * (1 - 0.3 * droop), j === 4 ? sp.back : sp.flank)); } rows.push(row); }
        for (let j = 0; j < 4; j++) for (let q = 0; q < 4; q++) { const q1 = (q + 1) % 4; I.push(rows[j][q], rows[j + 1][q], rows[j][q1], rows[j][q1], rows[j + 1][q], rows[j + 1][q1]); } }
      // small solid bits on the head or back: [x, y, z] corners of a triangle fan, mirrored; head weight hd
      for (const [pts, k, hd] of sp.bits) for (const sx of [1, -1]) { bone = [hd > 0 ? 1 : 0, 0, hd, 0]; piv = sp.neck; const ids = pts.map((p) => v(p[0] * sx, p[1], p[2], k)); for (let j = 1; j < ids.length - 1; j++) { I.push(ids[0], ids[j], ids[j + 1]); I.push(ids[0], ids[j + 1], ids[j]); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4)); g.setAttribute('aPv', new THREE.Float32BufferAttribute(PV, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
    };
    const beastMat = (sp) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...S, uSwing: { value: sp.swing }, uNeck: { value: new THREE.Vector3(...sp.neck) }, uMap: { value: mapTex } }, vertexColors: true, fog: true, side: THREE.DoubleSide,
      vertexShader: `attribute vec4 aB, iA, iB; attribute vec3 aPv; uniform float uTime, uSwing; uniform vec3 uNeck; varying vec3 vCol, vN, vWorld, vRest;
#include <fog_pars_vertex>
void rx(inout vec3 p, vec3 c, float a){ float s = sin(a), k = cos(a); p -= c; p = vec3(p.x, p.y * k - p.z * s, p.z * k + p.y * s); p += c; }
void ry(inout vec3 p, vec3 c, float a){ float s = sin(a), k = cos(a); p -= c; p = vec3(p.x * k + p.z * s, p.y, p.z * k - p.x * s); p += c; }
void main(){
  vec3 p = position, n = normal; float part = aB.x, gait = iB.y, down = iB.z, seed = iB.w, ph = iB.x * 6.2832;
  if (part > 1.5 && part < 2.5) {                       // legs trot in diagonal pairs; the lower leg folds as it comes forward
    float off = (aB.y < 0.5 || aB.y > 2.5) ? 0. : 3.14159, a = ph + off, sw = sin(a) * uSwing * gait, lift = max(cos(a), 0.) * gait;
    vec3 knee = vec3(aPv.x, aB.w, aPv.z); float low = smoothstep(0.42, 0.56, aB.z);
    rx(p, knee, -lift * 0.9 * low * (aPv.z > 0. ? -1. : 1.)); rx(p, aPv, -sw); p.y += lift * 0.05 * low;
  } else {
    p.y += 0.025 * sin(ph * 2.) * gait;
    if (part > 0.5 && part < 1.5) { float w = aB.z; rx(p, uNeck, (down * 0.75 + 0.06 * sin(uTime * 3.1 + seed) * down - 0.05 * sin(ph * 2.) * gait) * w); rx(n, vec3(0.), down * 0.75 * w); ry(p, uNeck, 0.3 * sin(uTime * 1.7 + seed * 3.) * down * w); }
    if (part > 2.5) ry(p, aPv, (0.35 * sin(uTime * 2.3 + seed) + 0.2 * sin(ph)) * aB.z);
  }
  vRest = position; float c = cos(iA.w), s = sin(iA.w);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s) + iA.xyz; n = vec3(n.x * c + n.z * s, n.y, n.z * c - n.x * s);
  vec4 world = modelMatrix * vec4(p, 1.); vWorld = world.xyz; vN = normalize(n + vec3(0., 1e-5, 0.)); vCol = color;
  vec4 mvPosition = viewMatrix * world; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `${SUN_PARS} varying vec3 vCol, vN, vWorld, vRest;
#include <fog_pars_fragment>
${GLSL_NOISE}
${MAP_GLSL}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 alb = vCol * (0.82 + 0.36 * vn3(vRest * 23.)) * (0.9 + 0.2 * vn3(vRest * vec3(60., 9., 9.)));          // bristly coat
  vec4 m = mapAt(vWorld.xz); float shade = clamp(max(m.r, m.g * 0.8), 0., 1.);
  float coin = smoothstep(0.5, 0.62, vn3(vec3(vWorld.xz * 0.9 + uSunDir.xz * 3., uTime * 0.12)) * 0.7 + vn3(vec3(vWorld.zx * 2.4, vWorld.y)) * 0.3);
  float lit = clamp(dot(N, uSunDir) * 0.75 + 0.35, 0., 1.) * mix(1., coin, shade);
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)); float rim = pow(1. - clamp(dot(N, V), 0., 1.), 3.) * clamp(dot(N, uSunDir) + 0.6, 0., 1.);
  vec3 col = alb * (uSunCol * lit * 1.25 + mix(uGroundCol * 1.3, uSkyCol, N.y * 0.5 + 0.5) * 1.1) + uSunCol * rim * 0.12 * mix(1., coin, shade);
  gl_FragColor = vec4(col, 1.);
#include <fog_fragment>
}` });
    const makeBeasts = (sp, count, name) => { const g = new THREE.InstancedBufferGeometry(), base = beastGeo(sp); g.index = base.index; for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
      const iA = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), iB = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); iA.setUsage(THREE.DynamicDrawUsage); iB.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iA', iA); g.setAttribute('iB', iB); g.instanceCount = count; const mesh = new THREE.Mesh(g, beastMat(sp)); mesh.frustumCulled = false; mesh.name = name; scene.add(mesh);
      return { mesh, iA, iB, count, stride: sp.stride, set(i, x, y, z, hd, phase, gait, down, seed) { iA.setXYZW(i, x, y, z, hd); iB.setXYZW(i, phase, gait, down, seed); }, commit() { iA.needsUpdate = iB.needsUpdate = true; } }; };
    const K0 = col('#0c0a09'), entSpec = { back: col(PAL[4], 0.8), flank: col('#A88A62', 0.72), belly: col('#b89c74', 0.62), leg: col('#3c3024', 0.8), hoof: col('#17130f'), neck: [0, 1.05, 0.6], swing: 0.5, stride: 1.38,
      shade: (z, up, ri) => (ri >= 7 && up > 0.3 && up < 0.42 ? 0.45 : 1) * (z > 1.3 ? 0.75 : 1),
      rows: [[-0.82, 1.05, 0.74, 0.09, 0], [-0.7, 1.15, 0.62, 0.2, 0], [-0.4, 1.18, 0.57, 0.25, 0], [0.0, 1.22, 0.55, 0.265, 0], [0.3, 1.37, 0.56, 0.25, 0], [0.5, 1.39, 0.6, 0.22, 0], [0.68, 1.3, 0.7, 0.17, 0.3], [0.85, 1.24, 0.72, 0.165, 0.8], [1.0, 1.17, 0.72, 0.15, 1], [1.2, 1.08, 0.75, 0.115, 1], [1.4, 1.0, 0.78, 0.085, 1], [1.52, 0.95, 0.81, 0.062, 1]],
      legs: [[0.17, 0.4, 0.72, 0.05, 1], [-0.17, 0.4, 0.72, 0.05, 1], [0.17, -0.55, 0.74, 0.055, 0], [-0.17, -0.55, 0.74, 0.055, 0]], tail: [-0.82, 0.98, 0.42, 0.022, 0.9],
      bits: [[[[0.14, 0.9, 0.93], [0.27, 0.68, 0.97], [0.15, 0.74, 1.1]], col('#8a7050', 0.7), 1], [[[0.07, 0.8, 1.24], [0.12, 0.69, 1.27], [0.07, 0.77, 1.34]], col('#8a7050', 0.7), 1], [[[0.1, 1.23, 0.87], [0.18, 1.36, 0.82], [0.13, 1.21, 0.78]], col(PAL[4], 0.7), 0.8],
        [[[0.153, 1.1, 1.0], [0.158, 1.07, 1.05], [0.155, 1.12, 1.06]], K0, 1], [[[0.012, 1.34, 0.2], [0.012, 1.49, 0.3], [0.012, 1.42, 0.38], [0.012, 1.52, 0.46], [0.012, 1.4, 0.56], [0.012, 1.32, 0.72]], col('#1e1712'), 0]] };
    const hySpec = { back: col('#9c8052', 0.75), flank: col('#B59A6A', 0.78), belly: col('#d2c09a', 0.7), leg: col('#8e7850', 0.75), hoof: col('#2a2018'), neck: [0, 0.62, 0.48], swing: 0.55, stride: 0.88,
      shade: (z, up, ri) => (ri >= 7 && up > 0.3 && up < 0.42 ? 0.5 : 1) * (z > 0.98 ? 0.5 : 1),
      rows: [[-0.6, 0.62, 0.44, 0.06, 0], [-0.5, 0.7, 0.36, 0.12, 0], [-0.2, 0.72, 0.34, 0.15, 0], [0.15, 0.72, 0.33, 0.16, 0], [0.38, 0.74, 0.36, 0.14, 0], [0.52, 0.76, 0.46, 0.11, 0.3], [0.66, 0.78, 0.52, 0.1, 0.9], [0.8, 0.74, 0.54, 0.085, 1], [0.95, 0.68, 0.56, 0.06, 1], [1.05, 0.65, 0.575, 0.045, 1]],
      legs: [[0.11, 0.32, 0.42, 0.04, 1], [-0.11, 0.32, 0.42, 0.04, 1], [0.11, -0.42, 0.44, 0.045, 0], [-0.11, -0.42, 0.44, 0.045, 0]], tail: [-0.6, 0.6, 0.78, 0.06, 0.45],
      bits: [[[[0.07, 0.78, 0.67], [0.115, 0.88, 0.63], [0.09, 0.77, 0.59]], col('#8e7850', 0.7), 0.9], [[[0.092, 0.7, 0.8], [0.094, 0.68, 0.84], [0.09, 0.715, 0.84]], K0, 1]] };
    const ents = makeBeasts(entSpec, 5, 'entelodonts'), entPlan = [];
    for (let i = 0; i < 5; i++) entPlan.push({ u0: i < 2 ? 0.586 + 0.007 * i : 0.628 + 0.0075 * i + rng.range(-0.002, 0.002), side: i < 2 ? (i ? 4.6 : -4.2) : -5.6 - (i % 3) * 1.15 + rng.range(-0.3, 0.3), wheel: i < 2 ? 0.553 + 0.006 * i : 0.606 + 0.0045 * i, hd0: rng.range(0, 6.28), seed: rng.range(0, 9), sp: i < 2 ? rng.range(6.6, 7.2) * 0.62 : rng.range(4.2, 5.0) });
    await tick();
    // Hyaenodon (by seed: none, one or two) drinking at the water's edge 6-8 m from the route, loping off as we come
    const hyPlan = []; let hyenas = null;
    if (nHyaena) {
      const best = { u: 0.776, sd: hySg * 7.3 };
      hyenas = makeBeasts(hySpec, nHyaena, 'hyaenodon');
      for (let i = 0; i < nHyaena; i++) hyPlan.push({ u0: best.u + i * 0.007, side: best.sd - (i ? hySg * 0.5 : 0), wheel: best.u - 0.021 + i * 0.004, seed: 2.2 + i * 3.1, sp: 7 + i * 0.6 });
    }
    await tick();

    // ---- nothing rides with the camera in this world; the group exists so that anything added later is hidden with one line
    const rig = new THREE.Group(); rig.name = 'rig'; scene.add(rig);
    await sky.prewarm(ctx.renderer, null, scene);
    await tick();

    const _cam = new THREE.Vector3(), _p = new THREE.Vector3(), moPos = new THREE.Vector3(), toPath = new THREE.Vector3(-mLine.z, 0, mLine.x);
    { const q = path.pointAt(mAbeam, _v); if ((q.x - mAt.x) * toPath.x + (q.z - mAt.z) * toPath.z < 0) toPath.multiplyScalar(-1); }
    // The touch: with both standing where they stop, find the neck and head angles that bring her lip to the calf's lifted muzzle
    // (a coarse search over the same chain the shader uses), so the two heads meet whatever the seed.
    const CALF_UP = { neckPitch: 0.5, headPitch: 0.3, headYaw: 0, neckYaw: 0 }, TOUCH = { np: -0.86, ny: 0.34, hp: -0.28, hy: 0.2 }, downRef = { k: 0 };
    { const mo = adults.state[2], cf = calf.state[0], md = TRAVEL * -0.028, sx = mAt.x + mLine.x * md, sz = mAt.z + mLine.z * md, hd = Math.atan2(mLine.x, mLine.z), tgt = new THREE.Vector3(), lp = new THREE.Vector3();
      Object.assign(cf, { x: mAt.x + mLine.x * (md + 0.9) + toPath.x * 1.55, z: mAt.z + mLine.z * (md + 0.9) + toPath.z * 1.55, heading: hd, ...CALF_UP }); cf.y = heightAt(cf.x, cf.z);
      const side = Math.sign((cf.x - sx) * Math.cos(hd) - (cf.z - sz) * Math.sin(hd)) || 1;                    // which of her sides the calf is on (her local +X or -X)
      cf.headYaw = CALF_UP.headYaw = -0.55 * side; calf.lipPoint(0, tgt); tgt.y += 0.12;
      Object.assign(mo, { x: sx, z: sz, y: heightAt(sx, sz), heading: hd, size: 0.98 }); let best = 1e9;
      for (let np = -1.5; np <= -0.5; np += 0.05) { await tick(); for (let ny = 0.2; ny <= 1.5; ny += 0.065) for (let hp = -0.7; hp <= 0.9; hp += 0.1) {
        mo.neckPitch = np; mo.neckYaw = ny * side; mo.headPitch = hp; mo.headYaw = 0.35 * side; adults.lipPoint(2, lp);
        const e = lp.distanceTo(tgt) + 0.12 * Math.abs(hp - 0.1) + 0.1 * ny; if (e < best) { best = e; TOUCH.np = np; TOUCH.ny = ny * side; TOUCH.hp = hp; TOUCH.hy = 0.35 * side; } } }
    }
    await tick();
    const feedOf = (u0) => { const u = u0 + 0.02; return u < 0.371 ? clamp((u - 0.305) / 0.066, 0, 1) * 0.58 : u < 0.38 ? 0.58 + (u - 0.371) / 0.009 * 0.15 : 0.73 + clamp((u - 0.38) / 0.06, 0, 1) * 0.17; };
    const uRate = (u) => pace(u) / DUR;
    const M0 = mAbeam - 0.038, ML = 0.02, walkedM = (u) => { const t = clamp((u - M0) / ML, 0, 1); return u <= M0 ? u : M0 + (t - t * t * t + 0.5 * t * t * t * t) * ML; };

    const POIS = [
      { at: () => _poiE.set(adults.state[0].x, 3.6, adults.state[0].z), from: 0.035, to: 0.112, weight: 0.5 },                                   // the first of the family, whole in the first glade
      { at: () => _poiC.set(adults.state[1].x, 2.6, adults.state[1].z), from: 0.118, to: 0.2, weight: 0.5 },                                    // the second, at the glade's end
      { at: () => _poiD.set((halves.state[0].x + halves.state[1].x) / 2, 4.4, (halves.state[0].z + halves.state[1].z) / 2), from: 0.24, to: 0.296, weight: 0.42 },   // the two half-grown
      { at: () => hyPos, from: 0.722, to: 0.786, weight: hyenas ? 0.5 : 0 },
      { at: (t, u) => { hero.headPosition(leaderHead).applyAxisAngle(Y_AXIS, HERO_YAW); leaderHead.lerp(_poiA.set(0, 3.3, 0), 0.42); const k = smoothstep(0.392, 0.424, u); return k > 0 ? leaderHead.lerp(path.pointAt(Math.min(1, u + 0.07), _poiA), k) : leaderHead; }, from: 0.3, to: 0.445, weight: 0.85 },
      // the mother and calf; once her head is down the gaze goes almost wholly to the two heads (we are nearly abeam of them by then)
      { at: (t, u) => { const dn = downRef.k, k = smoothstep(0.668, 0.705, u); _poiB.set(moPos.x + toPath.x * 0.8, 3.7, moPos.z + toPath.z * 0.8); _poiB.lerp(motherHead, 0.8 * dn); _poiB.y += 0.5 * dn;
        path.pointAt(Math.min(1, u + 0.07), _poiA); return _poiA.lerp(_poiB, lerp(0.76, 1, dn) * (1 - k)); }, from: 0.58, to: 0.725, weight: 0.92 },
    ];
    function update(dt, time, camera, u) {                                       // u as the engine gives it
      rig.visible = u > 0 && !ctx.through;
      updateScript(dt, time, camera, u * KO);
    }
    function updateScript(dt, time, camera, u) {                                 // u in script u (see the note at the path)
      hero.setProgress(feedOf(u));
      hero.update(dt, time, camera); leafU.uAnim.value[0].set(0, 0, Math.sin(HERO_YAW), Math.cos(HERO_YAW));
      sky.update(dt, time, camera);
      camera.getWorldPosition(_cam); airW.uCam.value.copy(_cam);
      for (const m of farHide) m.visible = m.geometry.boundingSphere.distanceToPoint(_cam) < 190;
      if (cypMesh) cypMesh.visible = Math.hypot(_cam.x - endP.x, _cam.z - endP.z) < 372;                            // a finger's width on the horizon beyond that
      for (const m of whipMeshes) m.visible = m.geometry.boundingSphere.distanceToPoint(_cam) < 55;
      for (const m of skirtMeshes) m.visible = m.geometry.boundingSphere.distanceToPoint(_cam) < 45;                  // sub-pixel beyond that
      leafU.uUnder.value = 1 - smoothstep(3.4, 5.4, _cam.y);
      // the rare gust: the clump's leaves go at once, the canopy lies over silver
      const gust = rare ? smoothstep(0.356, 0.37, u) * (1 - smoothstep(0.415, 0.45, u)) : 0;
      S.uWind.value = windK * (1 + 0.9 * gust); airW.uB1.value = rare && u > 0.362 ? (u - 0.362) / uRate(0.39) : -1;
      // walkers: the place is a function of u, the stride of the distance, so no foot slides
      for (const [herd, i, T, slot, len] of WALKERS) {
        const s = herd.state[i], d = TRAVEL * (u - T.u0), A = AFTER[slot]; trackPos(T, u, _p);
        if (herd === adults && u >= BARS.from) {                                  // out on the bars
          if (slot === 1) { const W = BARS.walk, dd = TRAVEL * (u - W.u0); s.x = W.p.x + W.dir.x * dd; s.z = W.p.z + W.dir.z * dd; s.heading = Math.atan2(W.dir.x, W.dir.z); s.walk = 1; s.phase = dd / herd.stride + 0.4;
            s.neckPitch = 0.1 + 0.05 * Math.sin(time * 0.31); s.headPitch = 0; s.neckYaw = 0.1 * Math.sin(time * 0.17); s.headYaw = 0.25 * Math.sin(time * 0.23) - 0.25; s.lip = 0; s.chew = 0.4; }
          else { const up = smoothstep(0.895, 0.925, u) * (0.8 + 0.2 * Math.sin(time * 0.33 + 1.2)); /* it drinks, and lifts its head as we come */ s.x = BARS.drink.p.x; s.z = BARS.drink.p.z; s.heading = BARS.drink.heading; s.walk = 0; s.phase = 0.9;
            s.neckPitch = lerp(-1.02, 0.3, up); s.headPitch = lerp(-0.3, 0.05, up); s.neckYaw = 0.12 * Math.sin(time * 0.11); s.headYaw = 0.3 * up * Math.sin(time * 0.19); s.lip = 0; s.chew = 0.3 + 0.7 * up; }
          s.y = Math.max(groundY(s.x, s.z), -1.32); s.ears = 0.3 + 0.3 * Math.sin(time * 0.5 + slot); setAnim(slot, s.x, s.z, s.heading, 0.05, 0.02, len, s.y); continue;
        }
        if (u >= A.from) {                                                       // one of the heads beyond the leader, standing at feed
          const up = smoothstep(A.rise[0], A.rise[1], u), nod = smoothstep(0.1, 0.8, Math.sin(time * 0.21 + slot * 2.4 + 2)), ad = herd === adults;
          s.x = A.p[0]; s.z = A.p[1]; s.y = heightAt(s.x, s.z); s.heading = A.heading; s.walk = 0; s.phase = slot * 0.37;
          s.neckPitch = lerp(-0.85, (ad ? 0.2 : 0.2) + 0.22 * nod, up); s.headPitch = lerp(-0.25, 0.2 * nod, up); s.neckYaw = 0.2 * Math.sin(time * 0.09 + slot * 3) * up; s.headYaw = 0.3 * Math.sin(time * 0.13 + slot * 5) * up;
          s.lip = nod * up; s.chew = up; s.ears = 0.3 + 0.3 * Math.sin(time * 0.5 + slot);
          setAnim(slot, s.x, s.z, s.heading, 0.05, (slot === 4 ? 0.35 : 0.9) * (ad ? 1 : up), len); continue;
        }
        if (slot === 2) { const up = smoothstep(0.158, 0.19, u) * (0.85 + 0.15 * Math.sin(time * 0.33)); s.x = DRINK.x; s.z = DRINK.z; s.y = heightAt(s.x, s.z); s.heading = DRINK.heading; s.walk = 0; s.phase = 0.9;
          s.neckPitch = lerp(-1.02, 0.25, up); s.headPitch = lerp(-0.3, 0.05, up); s.neckYaw = 0.1 * Math.sin(time * 0.11) + 0.25 * up; s.headYaw = 0.6 * up; s.lip = 0; s.chew = 0.3 + 0.7 * up; s.ears = 0.3 + 0.3 * Math.sin(time * 0.5 + slot);
          setAnim(slot, s.x, s.z, s.heading, 0.05, 0.02, len, s.y); continue; }
        s.x = _p.x; s.z = _p.z; s.y = heightAt(_p.x, _p.z); s.heading = Math.atan2(T.dir[0], T.dir[1]); s.phase = d / herd.stride + slot * 0.37; s.walk = 1;
        s.neckPitch = 0.05 + 0.05 * Math.sin(time * 0.31 + slot * 2.1) + (slot === 1 ? 0.2 * (1 - smoothstep(0.03, 0.07, u)) : slot > 2 ? 0.14 : 0); s.headYaw = 0.28 * Math.sin(time * 0.23 + slot * 1.7); s.neckYaw = 0.1 * Math.sin(time * 0.17 + slot); s.chew = 0.3; s.ears = 0.3 + 0.3 * Math.sin(time * 0.5 + slot);
        setAnim(slot, s.x, s.z, s.heading, WALK, 1, len, s.y);
      }
      for (let i = 0; i < 2; i++) {
        if (i >= extras) { leafU.uAnimS.value[5 + i].y = 0; continue; }
        const s = adults.state[3 + i], up = smoothstep(0.1, 0.8, Math.sin(time * 0.21 + i * 2.4 + 1));
        s.neckPitch = 0.1 + 0.3 * up; s.headPitch = 0.2 * up; s.neckYaw = 0.2 * Math.sin(time * 0.09 + i * 3); s.headYaw = 0.3 * Math.sin(time * 0.13 + i * 5); s.lip = up;
        setAnim(5 + i, s.x, s.z, s.heading, 0.05, 0.9, 3.3);
      }
      // the mother and the calf in the glade: she walks toward us with her head in the boughs, stops, and lowers it to the calf
      const mo = adults.state[2], cf = calf.state[0], g = walkedM(u), md = TRAVEL * (g - mAbeam), wk = 1 - smoothstep(M0, M0 + ML, u), down = smoothstep(0.644, 0.653, u) * (1 - smoothstep(0.7, 0.73, u)); downRef.k = down;
      moPos.set(mAt.x + mLine.x * md, 0, mAt.z + mLine.z * md);
      mo.x = moPos.x; mo.z = moPos.z; mo.y = heightAt(mo.x, mo.z); mo.heading = Math.atan2(mLine.x, mLine.z); mo.phase = md / adults.stride + 0.2; mo.walk = wk;
      mo.neckPitch = lerp(0.32 + 0.04 * Math.sin(time * 0.6), TOUCH.np, down); mo.headPitch = lerp(0.16, TOUCH.hp, down); mo.neckYaw = lerp(0.08 * Math.sin(time * 0.3), TOUCH.ny, down); mo.headYaw = lerp(0.2 * Math.sin(time * 0.21), TOUCH.hy, down);
      mo.lip = (1 - down) * (0.5 + 0.5 * Math.sin(time * 0.8)); mo.chew = 1 - 0.7 * down; mo.ears = 0.4 * down;
      const cw = Math.sin(time * 0.37) * 0.5, cd = md + 0.9 + cw * 0.3 * wk;
      cf.x = mAt.x + mLine.x * cd + toPath.x * 1.55; cf.z = mAt.z + mLine.z * cd + toPath.z * 1.55; cf.y = heightAt(cf.x, cf.z); cf.heading = mo.heading + 0.1 * Math.sin(time * 0.5) * wk;
      cf.phase = cd / calf.stride; cf.walk = wk; cf.neckPitch = lerp(0.1, CALF_UP.neckPitch, down); cf.headPitch = CALF_UP.headPitch * down; cf.headYaw = lerp(0.5 * Math.sin(time * 0.7) * (1 - wk), CALF_UP.headYaw, down); cf.ears = 0.5 + 0.5 * Math.sin(time * 1.3);
      mo.dapple = u < LEFT.until ? 0 : 1;
      if (u < ENTRY.until) {                                                    // ... and before that she is the head at the entry
        const nod = smoothstep(0.1, 0.8, Math.sin(time * 0.24 + 0.6)); mo.x = ENTRY.p[0]; mo.z = ENTRY.p[1]; mo.y = heightAt(mo.x, mo.z); mo.heading = ENTRY.heading; mo.walk = 0; mo.phase = 0.3;
        mo.neckPitch = 0.3 + 0.16 * nod; mo.headPitch = 0.05 + 0.15 * nod; mo.neckYaw = 0.12 * Math.sin(time * 0.1 + 1); mo.headYaw = 0.22 * Math.sin(time * 0.14 + 2); mo.lip = nod; mo.chew = 1; mo.ears = 0.3 + 0.3 * Math.sin(time * 0.5);
      }
      else if (u < LEFT.until) {                                                // ... and the rim-lit head on the left, lifted out of the leaves as we climb
        const up = smoothstep(0.17, 0.2, u), nod = smoothstep(0.1, 0.8, Math.sin(time * 0.24 + 2.1)); mo.x = LEFT.p[0]; mo.z = LEFT.p[1]; mo.y = heightAt(mo.x, mo.z); mo.heading = LEFT.heading; mo.walk = 0; mo.phase = 0.6;
        mo.neckPitch = lerp(-0.85, 0.12 + 0.2 * nod, up); mo.headPitch = lerp(-0.25, 0.15 * nod, up); mo.neckYaw = 0.2 * Math.sin(time * 0.1 + 1) * up; mo.headYaw = (0.25 + 0.25 * Math.sin(time * 0.14 + 2)) * up; mo.lip = nod * up; mo.chew = up; mo.ears = 0.3 + 0.3 * Math.sin(time * 0.5);
      }
      setAnim(7, mo.x, mo.z, mo.heading, u < LEFT.until ? 0.05 : WALK, u < LEFT.until ? 0.3 : 0.6, 3.3);   // standing in the willow she only parts it: the crowns stay up round her, so that head, neck and withers ride above them
      adults.lipPoint(2, motherHead);
      airW.uB2.value = u > 0.628 ? (u - 0.628) / uRate(0.648) : -1; if (u < 0.645) airW.uB2Pos.value.set(motherHead.x, Math.max(motherHead.y, 5.7), motherHead.z);
      for (const h of casts) h.commit();
      // entelodonts: rooting with heads swinging, then they wheel and trot off along the glade's edge and out through the fringe
      for (let i = 0; i < 5; i++) {
        const e = entPlan[i], go = smoothstep(e.wheel, e.wheel + 0.012, u), since = Math.max(0, u - e.wheel - 0.004), dist = e.sp * since * DUR / 0.87;
        at(clamp(e.u0 + dist / path.length, 0, 1), e.side + Math.sign(e.side) * (3.2 * smoothstep(0.685, 0.72, e.u0 + dist / path.length) + (i < 2 ? 5 * smoothstep(7, 20, dist) : 0)), _p); path.tangentAt(clamp(e.u0 + dist / path.length, 0, 1), _v);
        const hdT = Math.atan2(_v.x, _v.z), hd = e.hd0 + Math.atan2(Math.sin(hdT - e.hd0), Math.cos(hdT - e.hd0)) * go + 0.25 * Math.sin(time * 0.4 + e.seed) * (1 - go);
        ents.set(i, _p.x, heightAt(_p.x, _p.z), _p.z, hd, dist / ents.stride + e.seed, go, (1 - go) * (0.75 + 0.25 * Math.sin(time * 0.9 + e.seed * 2)), e.seed);
      }
      ents.commit();
      if (hyenas) { for (let i = 0; i < hyPlan.length; i++) {
        const e = hyPlan[i], go = smoothstep(e.wheel, e.wheel + 0.01, u), since = Math.max(0, u - e.wheel - 0.003), dist = e.sp * since * DUR / 1.4, sg = Math.sign(e.side);
        at(Math.min(KO, e.u0 + dist * 0.95 / path.length), e.side + sg * dist * 0.22, _p); path.tangentAt(e.u0, _v);
        const inward = Math.atan2(_v.z * sg, -_v.x * sg), outward = Math.atan2(_v.x * 0.95 - _v.z * sg * 0.22, _v.z * 0.95 + _v.x * sg * 0.22), hd = inward + Math.atan2(Math.sin(outward - inward), Math.cos(outward - inward)) * go;
        if (i === 0) hyPos.set(_p.x, -0.6, _p.z);
        hyenas.set(i, _p.x, Math.max(heightAt(_p.x, _p.z), -1.08), _p.z, hd, dist / hyenas.stride + e.seed, go, (1 - go) * (0.8 + 0.2 * Math.sin(time * 1.3 + e.seed)), e.seed);
      } hyenas.commit(); }
      fauna.update(dt, time, camera, u);
    }
    update(0, 0, ctx.camera || new THREE.PerspectiveCamera(), 0);

    return {
      scene, path: pathR, duration: DUR * KO, pace: (u) => pace(u * KO),
      title: 'Heads above the Poplars · 28 million years ago',
      camera: { fov: 54, near: 0.3, far: 3000, lookAhead: 30, sway: 0.2, bank: 0.5 },
      pois: POIS.map((p) => ({ at: typeof p.at === 'function' ? (t, u) => p.at(t, u * KO) : p.at, from: p.from / KO, to: p.to / KO, weight: p.weight })),
      portal: { shape: 'circle', radius: 7, color: '#DCEBFF', glow: 1, revealDistance: 260 },
      post: { exposure: 1, bloom: { strength: 0.25, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.1, contrast: 1.07, tint: '#fff2de', shadowTint: '#0a1430', vignette: 0.15, grain: 0.02 } },
      ride: 'none', companion: 'none', style: 'none',
      update,
      dispose() { sky.dispose(); hero.dispose(); mapTex.dispose(); shTex.dispose(); baseB.dispose(); baseSolid.dispose(); baseC.dispose(); baseS.dispose(); },
    };
  },
};
