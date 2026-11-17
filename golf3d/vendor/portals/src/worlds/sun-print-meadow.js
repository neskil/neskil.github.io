// THE SUN PRINT (sun-print-meadow): a hedgerow flown through at moth scale, made as a cyanotype photogram.
// Two inks (Prussian blue coat, paper white) and nothing else: no accent, no green anywhere. Nothing is lit: every plant and
// creature is the one white density material of src/parts/sun-print-meadow.js, every shadow is white and lives in the
// exposure buffer E, which prints each wake back to blue. All of it comes from one makeStyle() instance.
// The floor is itself a photogram: specimens laid flat and printed white (one atlas, flat cards in the paper's white, see
// THE PRINTED FLOOR); the first rinse's lip is a broken white line with a breath of paler coat beyond it. In the fernery one
// great specimen (frond, umbel, thistle) stands whole at arm's length in each of the first pictures. Between the colonnade and the
// clock THE TALL VERGE brings great umbels, thistles, reed plumes and arching fronds within 9-14 m of the lens, with the
// same plants smaller across the meadow. Films pile up to milky blue; only veins, rims, threads and solid cores are white.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero } from '../parts/sun-print-meadow.js';

const TAU = Math.PI * 2;
const HERO_AT = [-26, 0, 290];        // set in build() from the route
// the print's exposure (the hour hint): palettes are [prussian, deep, first coat, paper, milk, sensitiser, exposed]
const PRINTS = {
  day:    { pal: ['#0B3C6F', '#06213F', '#1F5C97', '#F3F1E8', '#A9C4DE', '#C6CF6A', '#9DB0A0'], wake: 4, far: 220, ghost: 0.72, film: 1, title: 'The Sun Print' },
  dawn:   { pal: ['#2A66A0', '#1B4E86', '#3F7DB4', '#F3F1E8', '#B9D0E4', '#C6CF6A', '#A3B5A4'], wake: 6, far: 250, ghost: 0.8, film: 0.85, title: 'The Sun Print, Under-exposed' },
  golden: { pal: ['#1F3147', '#111C2C', '#3D5670', '#EFE3C8', '#B5B7AE', '#CBC56A', '#A9AA8E'], wake: 4, far: 220, ghost: 0.72, film: 1, title: 'The Sun Print, Tea-toned' },
  night:  { pal: ['#072C55', '#031730', '#0E3F73', '#EEF0EC', '#8FB0D2', '#B9C566', '#8FA59B'], wake: 5, far: 150, ghost: 0.6, film: 0.6, title: 'The Sun Print, Long Exposure' },
};
const SEASONS = ['spring', 'summer', 'autumn'];

export default {
  id: 'sun-print-meadow',
  name: 'The Sun Print',
  category: 'domestic',
  after: 'Anna Atkins, 1799 to 1871',
  weirdness: 0.5,
  media: ['air', 'tiny'],
  async build(ctx) {
    const rng = ctx.rng, core = ctx.core, { clamp, lerp, smoothstep } = core;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1 };
    const detail = ctx.quality?.detail ?? 1, lush = detail * clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the seeded look: which print (hour) and which hedgerow (season)
    const lookRoll = rng(), seasonRoll = rng();
    const hour = PRINTS[vary.hour] ? vary.hour : (lookRoll < 0.52 ? 'day' : lookRoll < 0.68 ? 'dawn' : lookRoll < 0.84 ? 'golden' : 'night');
    const P = PRINTS[hour], season = SEASONS[seasonRoll < 0.46 ? 0 : seasonRoll < 0.73 ? 1 : 2];
    const rare = !!vary.rare;
    const scene = new THREE.Scene();
    // the exposure buffer at 2048 (8 cm of paper to a texel) wherever the machine is not a phone: the near floor is the thing we nearly touch
    const style = makeStyle(ctx, { palette: P.pal, wake: P.wake, far: P.far, ghost: P.ghost, band: 1.8, bufferSize: detail >= 1 ? 2048 : 1024 });
    const U = style.uniforms;
    await ctx.yield();
    scene.background = new THREE.Color(P.pal[0]);
    const disposables = [];

    // ---- sky and sheet: the same coat, one stood up behind the world, one lying under it
    const sky = style.makeSky(); scene.add(sky);
    const sheet = new THREE.Mesh(new THREE.CircleGeometry(4000, 64), style.paper());
    sheet.rotation.x = -Math.PI / 2; sheet.renderOrder = -5; sheet.frustumCulled = false; scene.add(sheet);
    U.uSheet.value.set(-10, 200, 1400);
    U.uSensAt.value.set(rng.range(4, 12) - 8, rng.range(77, 80) - 10, rng.range(47, 50) + 12);   // where the water has not yet been: one band across the course beyond the lip (see drive)
    style.rinse(1, 0, 1, -1e4); style.rinse(2, 0.5, -0.86, -1e4);
    U.uSkyRinse.value = 0; U.uExpose.value = 0.3;
    await ctx.yield();

    // ---- the route and the hero beside it. After the colonnade the course swings 35 degrees (radius 60 m) onto ONE long
    // straight: 78 m up to the point abeam of the clock, which stands 26 m off its side, and 62 m on to the way out. So the
    // globe sits near the direction of travel, growing, for the whole shed, and the ring is dead ahead from the reveal on.
    const PSI = 0.611, RT = 60, Z0 = 212, PRE = 78, PASS = 26, RUN = 62;
    const Wx = -Math.sin(PSI), Wz = Math.cos(PSI), Ax = -RT * (1 - Math.cos(PSI)), Az = Z0 + RT * Math.sin(PSI);
    const Bx = Ax + Wx * PRE, Bz = Az + Wz * PRE;                                  // abeam of the heart
    HERO_AT[0] = Bx - Wz * PASS; HERO_AT[2] = Bz + Wx * PASS;
    const hero = await buildHero(ctx, { style, palette: P.pal, detail, passRadius: PASS, shedCount: 92, exit: [Bx + Wx * RUN - HERO_AT[0], 20, Bz + Wz * RUN - HERO_AT[2]] });
    hero.object.position.set(HERO_AT[0], HERO_AT[1], HERO_AT[2]); scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    await ctx.yield();
    const heartW = hero.anchors.heart.clone().add(hero.object.position);
    // THE FERNERY'S COURSE MEANDERS (round 5): the lane is no longer one straight avenue seen down its axis three times over.
    // It runs straight for the first 22 m, bends left round a great umbel that stands on the entry axis (so that plant is
    // dead ahead from the entry, for either camera), then right round a thistle, and is back on x 0 before the colonnade.
    // fernX(z) is the lane's centre; everything planted in the fernery is placed from it.
    const hc = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1)), FA = 7.5, FB = -6.5;
    const fernX = (z) => z < 22 ? 0 : z < 56 ? FA * hc((z - 22) / 34) : z < 90 ? FA + (FB - FA) * hc((z - 56) / 34) : z < 116 ? FB * (1 - hc((z - 90) / 26)) : 0;
    const pts = [], OLD_FERN = [[0, 3, 0], [0, 3, 30], [0, 3, 62], [0, 3.2, 96], [0, 5.2, 126], [0, 9.6, 156], [0, 15, 186], [0, 19, 204]];
    for (const z of [0, 11, 22, 30.5, 39, 47.5, 56, 64.5, 73, 81.5, 90, 98.5, 107, 116]) pts.push([fernX(z), 3 + (z > 70 ? 2.2 * Math.pow((z - 70) / 56, 2) : 0), z]);
    pts.push([0, 5.2, 126], [0, 9.6, 156], [0, 15, 186], [0, 19, 204]);
    for (let i = 0; i <= 4; i++) { const th = PSI * i / 4; pts.push([-RT * (1 - Math.cos(th)), 20 - 0.5 * (1 - i / 4), Z0 + RT * Math.sin(th)]); }
    for (const s of [20, 40, 60, PRE, PRE + RUN * 0.35, PRE + RUN * 0.7, PRE + RUN]) pts.push([Ax + Wx * s, 20, Az + Wz * s]);
    const path = makePath(pts), OLD_LEN = makePath(OLD_FERN.concat(pts.slice(18))).length;      // (the same course with a straight fernery: for what is keyed to metres up the course)
    // courseX(z): where the course is at this z (the fernery and colonnade run up x 0, the long straight slants off)
    const courseX = (z) => z < Z0 ? fernX(z) : z < Az ? -RT * (1 - Math.cos(Math.asin(Math.min(1, (z - Z0) / RT)))) : Ax + (z - Az) * Wx / Wz;
    const exitW = path.end.clone(), exitDir = path.endTangent.clone();
    const EXTRA = path.length - OLD_LEN;        // the metres the meander adds: what stands beyond the fernery is placed that much further up the course
    const sAt = (z) => path.nearestXZ(0, z).u;                  // u when the camera is abeam of z on the straight course

    // ---- shared helpers ----------------------------------------------------------------------------------
    const meshes = [];
    // add(geo, densityOpts): one mesh of the one material; returns it
    const add = (geo, o, parent = scene) => { const m = new THREE.Mesh(geo, style.density({ tone: 1, ...o })); m.frustumCulled = false; parent.add(m); meshes.push(m); return m; };
    // a light air from the south-east: everything rooted sways by height (object space == world space for scattered plants)
    const SWAY = /* glsl */`{ float sw_h = max(pos.y, 0.); float sw_p = pos.x * 0.07 + pos.z * 0.05;
      vec2 sw = vec2(-0.6, 0.8) * (sin(uTime * 0.8 + sw_p) + 0.5 * sin(uTime * 1.9 + sw_p * 2.3)) * 0.012 * sw_h * (1. + 0.04 * sw_h);
      pos.xz += sw; }`;
    const SWAY_SH = SWAY.replace('0.012', '0.003');   // a rooted plant's shadow hardly stirs: its bar on the paper stays a bar
    // shadowOf(mesh, { den, pre, move, soft }): the same geometry sheared onto the paper as a white shadow in E
    const THREAD_SH_PRE = 'attribute vec3 aTan; attribute vec3 aSW;';
    const THREAD_SH_DIR = '\n dir = aTan;\n#ifdef USE_INSTANCING\n dir = mat3(instanceMatrix) * aTan;\n#endif\n';
    const LEAF_SH = '{ float lx = abs(vUv.x - .5) * 2.; den = DEN * (1. - smoothstep(.6, 1., lx / max(sin(vUv.y * 3.14159), .05))); }';
    const THREAD_SH = /* glsl */`{ vec3 sd = cross(dir, uLight); sd = sd / max(length(sd), 1e-3); pos += sd * aSW.x * max(aSW.y * WK, ${(style.exposure.texel * 2.7).toFixed(3)}) * 0.5; alp *= aSW.z; }`;   // never under 2.7 texels; WK: the bar's width against the stem's
    const shadowOf = (mesh, o = {}) => {
      const thread = !!mesh.geometry.getAttribute('aSW');
      const mat = style.shadow({ pattern: o.pattern || `{ den = ${(o.den ?? 0.8).toFixed(2)}${thread ? ' * (1. - smoothstep(0.6, 1., abs(vUv.x - .5) * 2.))' : ''}; }`, soft: o.soft, uniforms: o.uniforms,
        pre: (thread ? THREAD_SH_PRE : '') + (o.pre || ''), move: (thread ? THREAD_SH_DIR : '') + (o.move || '') + (thread ? THREAD_SH.replace('WK', (o.wk ?? 1.15).toFixed(2)) : '') });
      const sm = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, mat, mesh.count) : new THREE.Mesh(mesh.geometry, mat);
      if (mesh.isInstancedMesh) sm.instanceMatrix = mesh.instanceMatrix;
      sm.matrixAutoUpdate = false; sm.userData.src = mesh; style.exposure.add(sm); shadows.push(sm); return sm;
    };
    const shadows = [];
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const bez = (a, m, b, n = 6) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, k = 1 - t; o.push([k * k * a[0] + 2 * k * t * m[0] + t * t * b[0], k * k * a[1] + 2 * k * t * m[1] + t * t * b[1], k * k * a[2] + 2 * k * t * m[2] + t * t * b[2]]); } return o; };
    const scripted = [];        // functions (dt, time, u, camera) run each frame
    const goU = { uGoZ: { value: 0 } };          // how far up the course the camera is (from u, never the clock)
    scripted.push((dt, time, u) => { goU.uGoZ.value = u * path.length - EXTRA * clamp((u * path.length - 22) / (94 + EXTRA), 0, 1); });      // (metres up the course as z, so croziers and umbels open as we reach them)
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    const clearOf = (x, y, z, r) => path.distanceTo(x, y, z) > r;
    // instanced(geo, opts, list of {p:[x,y,z], ry, rx, rz, s}) -> InstancedMesh of the one material
    const instanced = (geo, o, list) => {
      const im = new THREE.InstancedMesh(geo, style.density({ tone: 1, ...o }), list.length);
      list.forEach((it, i) => { e3.set(it.rx || 0, it.ry || 0, it.rz || 0, 'YXZ'); q4.setFromEuler(e3);
        const s = it.s ?? 1; s3.set(s * (it.sx ?? 1), s * (it.sy ?? 1), s * (it.sz ?? 1)); m4.compose(p3.fromArray(it.p), q4, s3); im.setMatrixAt(i, m4); });
      im.frustumCulled = false; scene.add(im); meshes.push(im); return im;
    };

    // own(name): a stream of its own for a thing added after live, made from the world seed and a name (never a fork of rng,
    // which would draw from it): every one of live's dice falls as it did
    const own = (name) => core.makeRng('sun-print-meadow:' + ctx.seed + ':' + name);
    const pinRng = own('pinnae');
    // the course's ground track at even steps of 2 m of route: what a clearance in the plan is measured from
    const TRACK = []; { const tp = new THREE.Vector3(); for (let d = 0; d <= path.length; d += 2) { path.posAtDist(d, tp); TRACK.push([tp.x, tp.z, d]); } }
    const trackNear = (x, z) => { let b = TRACK[0], bd = 1e9; for (const q of TRACK) { const d = Math.hypot(x - q[0], z - q[1]); if (d < bd) { bd = d; b = q; } } return { dist: bd, x: b[0], z: b[1], d: b[2] }; };
    await ctx.yield();
    // ======================================= THE FERNERY (z 0-110) ========================================
    // -- an open frond in a unit frame: rachis arching up +Y and over toward +Z, sixty paired pinnae, each one card
    function frondGeo(pairs, droop) {
      const cardsL = [], rach = [], N = 30; let x = 0, y = 0, z = 0;
      const R = [];
      for (let i = 0; i <= N; i++) { const t = i / N, th = 0.22 + droop * Math.pow(t, 1.6); R.push([0, y, z, th]); y += Math.cos(th) / N; z += Math.sin(th) / N; }
      const at = (t) => { const f = t * N, i = Math.min(N - 1, Math.floor(f)), k = f - i, a = R[i], b = R[i + 1]; return [0, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k]; };
      for (let i = 0; i <= N; i += 2) rach.push([R[i][0], R[i][1], R[i][2]]);
      // NO TWO NEIGHBOURING PINNAE ALIKE (for every frond of the world): each pinna has its own seat on the rachis, its own
      // length, breadth, rake toward the tip, droop and a small turn about its own axis, from a stream of its own (pinRng);
      // the alternating part of length and rake (alt) keeps any two neighbours apart whatever the dice say. A frond is a
      // hand-grown thing, never a ladder of equal rungs.
      for (let j = 0; j < pairs; j++) {
        for (const sd of [-1, 1]) {
          const alt = (j + (sd > 0 ? 1 : 0)) % 2 ? 1 : -1;
          const t = clamp(0.1 + 0.89 * (j + 0.5 + pinRng.range(-0.24, 0.24)) / pairs, 0.1, 0.992), c = at(t), th = c[3];
          const lf = 1 + alt * pinRng.range(0.04, 0.11) + pinRng.range(-0.05, 0.05);
          const len = 0.5 * (0.03 + 0.24 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.85)) * lf, w = (0.44 * 0.89 / pairs + 0.003) * pinRng.range(0.86, 1.14);
          const rake = 0.34 + alt * 0.05 + pinRng.range(-0.13, 0.13), dr = -0.12 + pinRng.range(-0.1, 0.05), tw = pinRng.range(-0.32, 0.32);
          // pinna axis: sideways, raked toward the tip, drooping a little
          const ax = [sd * 0.9, -0.16 * Math.cos(th) + rake * Math.cos(th) + dr, rake * Math.sin(th)], al = Math.hypot(...ax), h = ax.map((k) => k / al);
          const v = h.map((k) => k * len), t0 = [0, Math.cos(th) * w, Math.sin(th) * w], cx = [h[1] * t0[2] - h[2] * t0[1], h[2] * t0[0] - h[0] * t0[2], h[0] * t0[1] - h[1] * t0[0]];
          const tu = t0.map((k, i) => k * Math.cos(tw) + cx[i] * Math.sin(tw));
          cardsL.push({ c: [c[0] + v[0], c[1] + v[1], c[2] + v[2]], u: tu, v });
        }
      }
      return { leaf: style.cards(cardsL), rachis: style.threads([{ pts: rach, w: 0.34, w1: 0.07, a: 0.92, a1: 0.7 }]), tip: R[N] };
    }
    const BREATHE = /* glsl */`{ vec3 org = instanceMatrix[3].xyz; float rr = length(pos - org);
      pos.y += sin(uTime * 0.7 + org.x * 0.31 + org.z * 0.17) * 0.022 * rr; }`;
    const frondFilm = (season === 'autumn' ? 0.04 : 0.19) * P.film;
    const FAR_RANK = '{ float fr_d = abs(instanceMatrix[3].x); alp *= mix(1., 0.22, smoothstep(19., 40., fr_d)); }';     // the ranks behind keep rachis and midrib and lose their film
    const PINNA = /* glsl */`{ float x = abs(vUv.x - .5) * 2.; float fx = fwidth(x) + 1e-4; float lens = max(sin(vUv.y * 3.14159), 0.02);
      float outl = 1. - smoothstep(0.78, 1., x / lens); pat = (1. - smoothstep(0.06, 0.06 + fx * 1.5, x)) * ${(season === 'autumn' ? 0.8 : 0.42).toFixed(2)} * outl; a *= outl; }`;
    const frondKinds = [frondGeo(30, 1.5)]; await ctx.yield(); frondKinds.push(frondGeo(26, 1.95)); await ctx.yield(); frondKinds.push(frondGeo(22, 1.1));
    const frondLists = [[], [], []], crozList = [];
    await ctx.yield();
    // plants: rosettes of fronds standing back from the course, croziers nearest to it
    const fernRng = rng.fork('ferns');
    const nPlants = Math.round(26 * clamp(lush, 0.6, 1.3));
    for (let i = 0; i < nPlants; i++) {
      const side = i % 2 ? 1 : -1, z = 6 + (i / nPlants) * 112 + fernRng.range(-4, 4);
      const x = side * (i < 6 ? fernRng.range(15, 24) : fernRng.range(15, 52)) + fernX(z), L = fernRng.range(14, 30), nF = fernRng.int(4, 7), a0 = fernRng.range(0, TAU);
      for (let k = 0; k < nF; k++) {
        const ry = a0 + (k / nF) * TAU + fernRng.range(-0.25, 0.25), kind = fernRng.int(0, 2), s = L * fernRng.range(0.7, 1.05), rx = fernRng.range(0.05, 0.5);
        const tip = frondKinds[kind].tip, reach = (tip[2] * Math.cos(rx) + tip[1] * Math.sin(rx)) * s, hgt = (tip[1] * Math.cos(rx) - tip[2] * Math.sin(rx)) * s;
        const tx = x + Math.sin(ry) * reach, tz = z + Math.cos(ry) * reach;
        let ok = true;
        for (let q = 0.3; q <= 1.001; q += 0.175) if (!clearOf(x + (tx - x) * q, Math.max(3, hgt * q), z + (tz - z) * q, 8.5 + s * 0.13)) ok = false;
        // (does its shadow fall across the lane we skim? Then it stands, but writes nothing: a frond's long soft bar across the
        //  lane read as a stray mark, and the lane's paper belongs to the specimens' own shadows)
        let lane = false;
        for (let q = 0.25; q <= 1.001; q += 0.25) { const hq = Math.max(0, hgt * q), n = path.nearestXZ(x + (tx - x) * q + 0.34 * hq, z + (tz - z) * q + 0.41 * hq); if (n.dist < 8 && n.y < 9) lane = true; }
        if (ok) frondLists[kind].push({ p: [x, 0, z], ry, rx, s, lane });
      }
      if (i % 6 === 5) await ctx.yield();
    }
    const frondMeshes = [];
    frondKinds.forEach((fk, k) => {
      if (!frondLists[k].length || season === 'summer') return;
      frondLists[k].sort((a, b) => (a.lane ? 1 : 0) - (b.lane ? 1 : 0)); const nWrite = frondLists[k].filter((f) => !f.lane).length;      // (a stable sort: those that write come first)
      const leaf = instanced(fk.leaf, { kind: 'card', alpha: frondFilm, pattern: PINNA, small: true, move: SWAY + BREATHE + FAR_RANK }, frondLists[k]);
      const rach = instanced(fk.rachis, { kind: 'thread', move: SWAY + BREATHE }, frondLists[k]);
      frondMeshes.push(leaf, rach);
      shadowOf(leaf, { pattern: LEAF_SH.replace('DEN', '0.28'), move: SWAY_SH + BREATHE }).count = nWrite; shadowOf(rach, { den: 0.9, move: SWAY_SH + BREATHE }).count = nWrite;
    });
    await ctx.yield();
    // -- croziers: a stalk whose tip is wound up; the winding is integrated in the vertex shader, so it can let go
    const CZ_PRE = 'uniform float uGoZ;';
    const CZ_MOVE = /* glsl */`{
      float cz_s = position.y, cz_off = position.x; vec3 cz_o = instanceMatrix[3].xyz;
      float cz_c = mix(1., 0.15, smoothstep(-52., 16., uGoZ - cz_o.z)) + 0.03 * sin(uTime * 0.9 + cz_o.x * 2.3 + cz_o.z);
      float cz_h = cz_s / 32.; vec2 cz_q = vec2(0.);
      for (int i = 0; i < 32; i++) { float sm = (float(i) + .5) * cz_h; float th = cz_c * 11.5 * sm * sm * sqrt(sm) + 0.25 * sm - 0.1; cz_q += vec2(sin(th), cos(th)) * cz_h; }
      float cz_th = cz_c * 11.5 * cz_s * cz_s * sqrt(cz_s) + 0.25 * cz_s - 0.1;
      vec2 cz_t = vec2(sin(cz_th), cos(cz_th)), cz_n = vec2(-cz_t.y, cz_t.x);
      vec2 cz_p = cz_q + cz_n * cz_off * mix(1.7, 1., cz_c);
      pos = (instanceMatrix * vec4(cz_p, 0., 1.)).xyz;
      dir = mat3(instanceMatrix) * vec3(mix(cz_t, cz_n, step(0.5, abs(aTan.x))), 0.);
    }`;
    {
      const lines = [], st = [];
      for (let i = 0; i <= 44; i++) st.push([0, i / 44, 0]);
      lines.push({ pts: st, w: 0.62, w1: 0.18, a: 0.96, a1: 0.9 });
      for (let i = 0; i < 74; i++) { const s = 0.3 + 0.7 * (i + 0.5) / 74, len = 0.012 + 0.05 * Math.pow(Math.sin(Math.PI * (s - 0.3) / 0.7), 0.7);
        lines.push({ pts: [[0, s, 0], [len, s, 0]], w: 0.09, w1: 0.03, a: 0.62, a1: 0.3 }, { pts: [[0, s, 0], [-len * 0.6, s, 0]], w: 0.08, w1: 0.03, a: 0.55, a1: 0.25 }); }
      // how tall one of them is: a crozier is as tall as its stalk is long (it stands that high once it has let go); the other
      // seasons' heads stand a little above the top of a straight stalk
      const CZ_TALL = season === 'spring' ? 1 : 1.03;
      const czGeo = style.threads(lines), czRng = rng.fork('croziers');
      const nC = Math.round(30 * clamp(lush, 0.7, 1.2));
      for (let i = 0; i < nC; i++) {
        const side = i % 2 ? 1 : -1, z = 5 + (i / nC) * 104 + czRng.range(-2.5, 2.5), x = side * (i % 5 === 4 ? czRng.range(17, 30) : czRng.range(7.2, 13.5)) + fernX(z);
        const it = { p: [x, 0, z], ry: (side > 0 ? 0 : Math.PI) + czRng.range(-0.45, 0.45), s: czRng.range(11, 23) * (i % 5 === 4 ? 1.25 : 1) };
        // ONE CLEARANCE IN THE PLAN, for every one of them: its foot stands no nearer the course's ground track (TRACK: every
        // 2 m of route, first metre to last) than half its own height. One that would is moved straight away from the
        // course until it does; none is removed and every draw above is kept.
        const need = it.s * CZ_TALL * 0.5;
        for (let pass = 0; pass < 6; pass++) { const n = trackNear(it.p[0], it.p[2]); if (n.dist >= need) break;
          const dx = it.p[0] - n.x, dz = it.p[2] - n.z, dl = Math.hypot(dx, dz); it.p[0] = n.x + (dl > 1e-3 ? dx / dl : side) * need * 1.002; it.p[2] = n.z + (dl > 1e-3 ? dz / dl : 0) * need * 1.002; }
        crozList.push(it);
      }
      if (season === 'spring') { const croz = instanced(czGeo, { kind: 'thread', pre: CZ_PRE, move: CZ_MOVE + SWAY, uniforms: goU }, crozList);
        // (the standing stalk writes a firm bar; the coil, which travels as it lets go, writes nothing: its wake was a long soft band of hairs across the lane)
        shadowOf(croz, { den: 0.95, wk: 0.6, pre: CZ_PRE, move: CZ_MOVE.replace(/\}\s*$/, ' alp *= 1. - smoothstep(0.2, 0.34, cz_s); }') + SWAY_SH, uniforms: goU }); } else czGeo.dispose();
    }
    await ctx.yield();
    // ======================================= GRASSES (the whole sheet) ====================================
    {
      const gRng = rng.fork('grass'), lines = [];
      for (let b = 0; b < 7; b++) {
        const az = (b / 7) * TAU + gRng.range(-0.7, 0.7), lean = gRng.range(0.05, 0.75), h = gRng.range(0.35, 1), pts = [];
        for (let i = 0; i <= 4; i++) { const t = i / 4, r = lean * t * t * h; pts.push([Math.cos(az) * r, t * h * (1 - 0.18 * t * lean), Math.sin(az) * r]); }
        lines.push({ pts, w: 0.05, w1: 0.018, a: 0.7, a1: 0.4 });
        if (b < 3) { const e = pts[4], d = [e[0] - pts[3][0], e[1] - pts[3][1], e[2] - pts[3][2]];          // a nodding seed head
          lines.push({ pts: [e, [e[0] + d[0] * 0.5, e[1] + d[1] * 0.2 - 0.02, e[2] + d[2] * 0.5], [e[0] + d[0] * 0.9, e[1] - 0.07, e[2] + d[2] * 0.9]], w: 0.04, w1: 0.1, a: 0.6, a1: 0.4 }); }
      }
      const gGeo = style.threads(lines), list = [], nG = Math.round(1150 * clamp(lush, 0.55, 1.3) * (season === 'summer' ? 1.25 : 1));
      for (let i = 0; i < nG; i++) {
        const z = gRng.range(-30, 400), near = gRng() < 0.6, x = (gRng() < 0.5 ? -1 : 1) * (near ? gRng.range(4.2, 30) : gRng.range(30, 95)) + courseX(z);
        const clump = ctx.noise.fbm2(x * 0.035, z * 0.035, 2), s = gRng.range(1.2, 3.4) * (near ? 1 : 1.5) * (1 + 1.1 * Math.max(0, clump)), ry = gRng.range(0, TAU);
        if (clump < -0.28) continue;
        const n = path.nearestXZ(x, z);
        if (n.dist < 4.2 || (n.dist < 7 && n.y - s < 2.2) || Math.hypot(x - HERO_AT[0], z - HERO_AT[2]) < 2.5) continue;
        list.push({ p: [x, 0, z], ry, s, sy: gRng.range(0.8, 1.25) });
        if (i % 250 === 249) await ctx.yield();
      }
      // the near verge: small tufts 4.6-11 m either side of the course through the fernery and the colonnade. They are the
      // foreground we nearly touch, and what they write on the quiet paper is fine lines.
      const nN = Math.round(150 * clamp(lush, 0.55, 1.3));
      for (let i = 0; i < nN; i++) {
        const z = -4 + (i / nN) * 222 + gRng.range(-2, 2), x = (i % 2 ? -1 : 1) * (4.6 + 6.4 * Math.pow(gRng(), 1.5)) + courseX(z), s = gRng.range(1.0, 2.3), ry = gRng.range(0, TAU), sy = gRng.range(0.8, 1.2);
        const n = path.nearestXZ(x, z);
        if (n.dist < 4.4 || n.y - s * 1.3 < 0.9) continue;
        list.push({ p: [x, 0, z], ry, s, sy });
      }
      const GSWAY = /* glsl */`{ float gh = max(pos.y, 0.); float gp = pos.x * 0.21 + pos.z * 0.17;
        pos.xz += vec2(-0.6, 0.8) * (sin(uTime * 1.3 + gp) + 0.6 * sin(uTime * 2.7 + gp * 1.9)) * 0.035 * gh * gh; }`;
      await ctx.yield();
      const grass = instanced(gGeo, { kind: 'thread', small: true, move: GSWAY }, list);
      await ctx.yield();
      shadowOf(grass, { den: 0.78, move: GSWAY });
    }
    await ctx.yield();

    // ======================================= OUR OWN THISTLEDOWN ==========================================
    // 120 filaments from a point just above the lens; placed from camera.matrixWorld every frame, never parented
    const plumeU = { uFlex: { value: new THREE.Vector3() }, uPl: { value: 0 } };
    const hedgeU = { uHedge: { value: 0 } };
    let plume, plumeStar; const PL_UP = 0.0;
    // our star's shadow on the paper: 8-12 m ahead while we skim the sheet, wandering from our left to our right and back; as we climb it runs out ahead and to the left
    // (the light is behind us on the right), so from 20 m up it still lies in the lower third of the picture
    const _sp = new THREE.Vector3(), _st = new THREE.Vector3();
    const starG = [1e6, 1e6];
    const placeStar = (x, y, z, fx, fz, sd = 0) => { const fl = Math.hypot(fx, fz) || 1, k = smoothstep(4, 19, y);
      const a = lerp(13.5, 68, k) + lerp(3, 0, k) * Math.sin(z * 0.047 + 0.6), l = lerp(0, -5, k) + lerp(3.4, 0, k) * Math.sin(z * 0.045 + 0.9);
      let gx = x + (fx * a - fz * l) / fl, gz = z + (fz * a + fx * l) / fl;
      if (k < 1) { path.posAtDist(Math.min(sd + a, path.length), _sp); path.tangentAtDist(Math.min(sd + a, path.length), _st); const tl = Math.hypot(_st.x, _st.z) || 1;      // down on the sheet it runs up the lane's own line, so its wake draws the meander
        gx = lerp(_sp.x - _st.z * l / tl, gx, k); gz = lerp(_sp.z + _st.x * l / tl, gz, k); }
      { const dx = gx - starG[0], dz = gz - starG[1], d = Math.hypot(dx, dz), joined = d < 5 && d > 1e-4;       // the stroke spans from where the star was at the last stamp to where it is now
        e3.set(0, joined ? Math.atan2(dx, dz) : Math.atan2(fx, fz), 0); q4.setFromEuler(e3); s3.set(1, 1, ((joined ? d * 0.5 : 0) + 0.16) / 1.5);
        plumeStar.matrix.compose(p3.set(joined ? gx - dx * 0.5 : gx, 0.02, joined ? gz - dz * 0.5 : gz), q4, s3); starG[0] = gx; starG[1] = gz; }
      plumeStar.matrixWorld.copy(plumeStar.matrix);       // (the eye is a short stroke laid along our travel, so its wake is one unbroken hair in a still as in the flight: never a row of dots)
      plumeStar.material.uniforms.uDen.value = lerp(0.36, 0.5, k);          // (its wake is a milky hair, not a white bar)
      U.uStar.value.set(gx, gz, lerp(1.5, 4.4, k), U.uTime.value * 0.02); };
    {
      // The underside of a parachute of down that we hang from: its hub, a small white knot, sits at top centre just inside the
      // picture (29 degrees above the view axis; the top edge is at 31), the filaments arc out from it and droop, each thinning
      // to nothing over its outer third, and the hair-thin stalk leaves the knot over our head. Milky, fainter than any plant.
      const pRng = rng.fork('plume'), lines = [], AP = [0, 0.5, -0.885];
      for (let i = 0; i < 120; i++) {
        const az = (i / 120) * TAU + pRng.range(-0.03, 0.03), el = pRng.range(0.16, 0.5), fwd = Math.max(0, Math.cos(az)), len = pRng.range(0.48, 0.66) * (1 - 0.36 * fwd), droop = pRng.range(0.36, 0.6);
        const ch = Math.cos(el) * len, sh = Math.sin(el) * len, at = (t) => [AP[0] + Math.sin(az) * ch * t, AP[1] + sh * t - droop * len * t * t, AP[2] - Math.cos(az) * ch * t];
        const a0 = pRng.range(0.3, 0.46);
        lines.push({ pts: [0, 0.165, 0.33, 0.495, 0.66].map(at), w: 0.0062, w1: 0.0046, a: a0, a1: a0 * 0.9 }, { pts: [0.66, 0.775, 0.89, 1].map(at), w: 0.0046, w1: 0.0028, a: a0 * 0.9, a1: 0 });
      }
      lines.push({ pts: [[AP[0], AP[1] - 0.009, AP[2]], [AP[0], AP[1] + 0.011, AP[2]]], w: 0.024, a: 1 });                            // the knot
      lines.push({ pts: [[AP[0], AP[1], AP[2]], [0.004, 0.42, -0.5], [0.0, 0.3, -0.1], [-0.01, 0.2, 0.3]], w: 0.0075, w1: 0.006, a: 0.8 });   // the stalk, away over our head
      plume = add(style.threads(lines), { kind: 'thread', uniforms: plumeU, pre: 'uniform vec3 uFlex; uniform float uPl;', move: /* glsl */`{ alp *= uPl;
        vec3 pl = position - vec3(0., 0.5, -0.885); float pt = dot(pl, pl) * 1.1;
        pos.xy += uFlex.xy * pt; pos.y += 0.07 * pt * sin(uTime * 1.7 + position.x * 9. + position.z * 5.) + 0.05 * pt * sin(uTime * 0.6);
        pos.xz += pl.xz * 0.06 * sin(uTime * 0.45) * smoothstep(0., 0.3, pt);
        pos = vec3(0., 0.5, -0.885) + (pos - vec3(0., 0.5, -0.885)) * 0.58; }` });       // (a small parachute: a little over half the size it was)
      plume.matrixAutoUpdate = false; plume.renderOrder = 5;
      const sg = style.cards([{ c: [0, 0, 0], u: [1.9, 0, 0], v: [0, 0, 1.9] }]);
      // our own star: only its small dense eye is written into E, so the wake is ONE tapering line; the spokes are drawn by
      // the paper itself where the star is now (style.uniforms.uStar) and leave no streaks behind them
      plumeStar = new THREE.Mesh(sg, style.shadow({ soft: 0.3, alpha: 0.95, pattern: '{ vec2 q = (vUv - .5) * 3.8; q.y = max(abs(q.y) - 1.5, 0.); float r = length(q); den = 1. - smoothstep(0.06, 0.12, r); }' }));
      plumeStar.matrixAutoUpdate = false; style.exposure.add(plumeStar);
      const FAN = [[0, -0.42, 0], [0.03, -0.5, 0], [0.05, -0.62, 0.35], [0.066, -0.7, 1], [0.285, -0.3, 1], [0.32, -0.46, 0], [0.37, -0.6, 0], [0.4, -0.66, 1], [0.545, -0.3, 1], [0.575, -0.2, 0], [0.64, 0.2, 0], [0.668, 0.3, 1], [1, 0.3, 1]];     // (out of the picture from the reveal on: nothing radiates there but the clock)
      const liftX = new THREE.Matrix4();
      const fw = new THREE.Vector3(), prevF = new THREE.Vector3(0, 0, 1), rt = new THREE.Vector3(), flex = new THREE.Vector3(), lift = new THREE.Matrix4();
      scripted.push((dt, time, u, camera) => {
        // it rides a little against the frame, and as the ring comes up it lifts away over the top of the picture
        // It is small and it wanders: it drifts across the top of the picture from one side to the other, and for long stretches
        // it rides up out of the picture altogether (FAN: u, how far round to the left (-) or right (+) of the axis, 0 in / 1 out).
        let fy = 0, fo = 1;
        for (let i = 0; i < FAN.length - 1; i++) if (u >= FAN[i][0] && u <= FAN[i + 1][0]) { const k = smoothstep(FAN[i][0], FAN[i + 1][0], u); fy = lerp(FAN[i][1], FAN[i + 1][1], k); fo = lerp(FAN[i][2], FAN[i + 1][2], k); }
        lift.makeRotationY(-fy - 0.03 * Math.sin(time * 0.31)); liftX.makeRotationX(Math.atan(0.43 * Math.cos(fy)) - 0.514 + 0.012 * Math.sin(time * 0.7) + 0.03 * Math.sin(time * 0.23 + 1.) + 0.66 * fo); lift.multiply(liftX);     // (the knot rides a quarter of the way down from the top edge wherever it is, so no ray is cut by the frame)
        plume.matrix.multiplyMatrices(camera.matrixWorld, lift); plume.matrixWorld.copy(plume.matrix);
        camera.getWorldDirection(fw); camera.getWorldPosition(_c);
        rt.set(-fw.z, 0, fw.x).normalize();
        if (dt > 0) { const yaw = clamp(prevF.dot(rt) / Math.max(dt, 1e-3), -0.6, 0.6), k = 1 - Math.exp(-dt * 2.5);
          flex.x += (-yaw * 0.9 - flex.x) * k; flex.y += ((fw.y - prevF.y) / Math.max(dt, 1e-3) * -0.6 - flex.y) * k; prevF.copy(fw); }
        plumeU.uFlex.value.copy(flex); plumeU.uPl.value = smoothstep(0.0, 0.035, u);
        path.tangentAt(u, _t); placeStar(_c.x, _c.y, _c.z, _t.x, _t.z, u * path.length);       // ahead along the course (not the gaze), so its wake is one line
      });
    }
    await ctx.yield();
    // ======================================= THE HEDGE: a wall of thinning stems round the whole course ====
    // Three kinds of clump: canes fanning from a thicket at the foot (where the wall is whitest), thinning to twigs,
    // a few carrying an umbel or a seed head. The first rank stands 112 m from the course; distance thins the rest.
    {
      const hRng = rng.fork('hedge'), kinds = [];
      for (let k = 0; k < 3; k++) {
        const lines = [], rest = [];          // lines: the canes and what they carry; rest: twigs and the thicket at the foot
        for (let m = 0; m < 3; m++) {
          const az = hRng.range(0, TAU), ca = Math.cos(az), sa = Math.sin(az), fan = hRng.range(0.03, 0.11), top = m === 0 ? 1 : hRng.range(0.5, 0.88), main = [];
          for (let i = 0; i <= 6; i++) { const t = i / 6, r = fan * t * (0.4 + t); main.push([ca * r + Math.sin(t * 2.2 + k + m) * 0.02, t * top, sa * r + Math.cos(t * 1.7 + k) * 0.015]); }
          lines.push({ pts: main, w: 2.1, w1: 0.28, a: 0.8, a1: 0.42 });
          for (let b = 0; b < 3; b++) { const t = hRng.range(0.45, 0.9), o = main[Math.round(t * 6)], a2 = hRng.range(0, TAU), l = hRng.range(0.1, 0.22) * top, c2 = Math.cos(a2) * l, s2 = Math.sin(a2) * l;
            rest.push({ pts: [o, [o[0] + c2 * 0.5, o[1] + l * 0.6, o[2] + s2 * 0.5], [o[0] + c2, o[1] + l * 0.85, o[2] + s2]], w: 0.5, w1: 0.16, a: 0.55, a1: 0.28 }); }
          const tip = main[6], head = (k + m) % 3;
          if (head === 0) for (let j = 0; j < 7; j++) {                       // an umbel: rays and a dab at the end of each
            const a3 = j * 0.9 + k, e = [tip[0] + Math.cos(a3) * 0.045, tip[1] + 0.035 + 0.01 * (j % 2), tip[2] + Math.sin(a3) * 0.045];
            lines.push({ pts: [tip, e], w: 0.3, w1: 0.2, a: 0.6 }, { pts: [e, [e[0], e[1] + 0.012, e[2]]], w: 1.5, w1: 0.9, a: 0.5 }); }
          else if (head === 1) lines.push({ pts: [tip, [tip[0], tip[1] + 0.03, tip[2]], [tip[0], tip[1] + 0.058, tip[2]]], w: 0.8, w1: 0.5, a: 0.8 },
            { pts: [[tip[0], tip[1] + 0.012, tip[2]], [tip[0], tip[1] + 0.05, tip[2]]], w: 2.6, w1: 1.4, a: 0.55 });   // a seed head
        }
        for (let b = 0; b < 8; b++) { const az = hRng.range(0, TAU), ca = Math.cos(az), sa = Math.sin(az), r0 = hRng.range(0, 0.1), h = hRng.range(0.06, 0.4), lean = hRng.range(0.02, 0.12);
          rest.push({ pts: [[ca * r0, 0, sa * r0], [ca * (r0 + lean * 0.4), h * 0.55, sa * (r0 + lean * 0.4)], [ca * (r0 + lean), h, sa * (r0 + lean)]], w: 1.7, w1: 0.3, a: 0.75, a1: 0.4 }); }
        kinds.push({ geo: style.threads(lines), rest: style.threads(rest), list: [] });
      }
      await ctx.yield();
      const nH = Math.round(760 * clamp(detail, 0.6, 1));
      for (let tries = 0, placed = 0; placed < nH && tries < nH * 14; tries++) {
        const x = hRng.range(-400, 300), z = hRng.range(-170, 640), keep = hRng(), d = path.nearestXZ(x, z).dist;
        if (tries % 250 === 249) await ctx.yield();
        if (d < 112 || keep > Math.exp(-(d - 112) / 62)) continue;
        kinds[placed % 3].list.push({ p: [x, 0, z], ry: hRng.range(0, TAU), s: hRng.range(42, 66) * (d < 150 ? 1 : 1.12) }); placed++;
      }
      // (fainter than anything on the course: it is the far layer, and the clock must blaze against it)
      // (and in the sector behind the clock, the seed stream and the ring, U.uBand, it drops to milky threads with no foot band)
      // In that sector distance does not fade the wall, it thins it: one clump in four keeps its canes, each drawn as a crisp
      // hair (never under 1.7 px, never wider), and the twigs, umbels' neighbours and the thicket at the foot are gone.
      const HGAP = /* glsl */` vec2 hw = pos.xz - cameraPosition.xz; float haz = (abs(hw.x) + abs(hw.y) < 1e-4) ? 0. : atan(hw.x, hw.y);
          float hgd = abs(haz - uBand.y); hgd = min(hgd, 6.28318 - hgd);
          float hgap = (1. - smoothstep(uBand.z * 0.8, uBand.z * 1.2 + 1e-3, hgd)) * uHedge;`;
      const hsw = SWAY.replace('0.012', '0.004'), hpre = 'uniform vec3 uBand; uniform float uHedge;';
      for (const k of kinds) {
        instanced(k.geo, { kind: 'thread', uniforms: hedgeU, pre: hpre, move: hsw + '{' + HGAP + /* glsl */`
          vec3 ho = instanceMatrix[3].xyz; float hk = step(0.74, fract(sin(dot(ho.xz, vec2(12.9898, 78.233))) * 43758.5453));
          float hpx = uViewH * 0.5 * projectionMatrix[1][1] / max(length(cameraPosition - pos), 1.);
          wid = mix(wid, min(wid, 1.7 / max(hpx, 1e-4)), hgap);
          alp *= mix(0.5, hk * 1.2 * smoothstep(0., 24., pos.y), hgap); }` }, k.list);
        instanced(k.rest, { kind: 'thread', uniforms: hedgeU, pre: hpre, move: hsw + '{' + HGAP + ' alp *= 0.5 * (1. - hgap); }' }, k.list);
      }
    }
    await ctx.yield();

    // ======================================= THE COLONNADE (z 110-215) ====================================
    // eight plants in four pairs; every umbel opens ahead of us, driven by how far up the course we are
    const UMB_PRE = 'uniform float uGoZ;';
    const UMB_MOVE = /* glsl */`{ vec3 uo = instanceMatrix[3].xyz; float op = smoothstep(-64., -14., uGoZ - uo.z);
      op = op * op * (3. - 2. * op); float sq = mix(0.1, 1., op);
      vec3 lp = position; float lr = length(lp.xz); lp.xz *= sq; lp.y = lp.y * mix(0.8, 1., op) + (1. - op) * 0.75 * lr;
      lp.xz += lp.xz * 0.02 * sin(uTime * 0.9 + uo.x + lr * 9.);
      pos = (instanceMatrix * vec4(lp, 1.)).xyz;
      #ifdef SP_THREAD
      dir = mat3(instanceMatrix) * vec3(aTan.xz * sq, aTan.y + (1. - op) * 0.75 * length(aTan.xz)).xzy;
      #endif
      alp *= mix(1., smoothstep(0.25, 0.9, op), UFL); }`;
    const umbList = [], stemGeos = [], ribLines = [], stemPaths = [];
    {
      const cRng = rng.fork('colonnade');
      const plate = season === 'summer', bare = season === 'autumn';
      const nRay = plate ? 20 : 14, nFl = plate ? 16 : 12, rise = plate ? 0.34 : 0.62;
      // one umbel in a unit frame (radius 1): rays, then an umbellule of florets on each
      const rays = [], peds = [], fl = [];
      for (let r = 0; r < nRay; r++) {
        const ring = r < nRay * 0.3 ? 0.45 : 1, az = r * 2.399 + cRng.range(-0.15, 0.15), R = ring * cRng.range(0.82, 1), H = rise * (1.1 - 0.35 * ring * ring) + cRng.range(-0.03, 0.03);
        const tip = [Math.cos(az) * R, H, Math.sin(az) * R];
        rays.push({ pts: [[0, 0, 0], [tip[0] * 0.45, H * 0.62, tip[2] * 0.45], tip], w: 0.34, w1: 0.16, a: 0.86, a1: 0.7 });
        for (let f = 0; f < nFl; f++) {
          const fa = f * 2.399 + r, fr = 0.27 * Math.sqrt((f + 0.6) / nFl), fx = tip[0] + Math.cos(fa) * fr, fz = tip[2] + Math.sin(fa) * fr, fy = H + 0.11 - fr * fr * 1.2;
          peds.push({ pts: [tip, [fx, fy, fz]], w: 0.07, w1: 0.05, a: 0.6 });
          const h = bare ? 0.024 : (plate ? 0.062 : 0.058), tl = cRng.range(-0.4, 0.4);
          fl.push({ c: [fx, fy + 0.004, fz], u: [h, h * tl, 0], v: [0, h * tl, h] });
        }
      }
      await ctx.yield();
      const rayGeo = style.threads(rays.concat(peds)), flGeo = style.cards(fl);
      await ctx.yield();
      // a five-petalled floret, milky, with a dense eye
      const FLORET = /* glsl */`{ vec2 q = (vUv - .5) * 2.; float r = length(q); float an = (r < 1e-4) ? 0. : atan(q.y, q.x);
        float pet = 0.62 + 0.38 * abs(cos(an * 2.5)); a *= 1. - smoothstep(pet - 0.12, pet, r); pat = (1. - smoothstep(0.1, 0.24, r)) * 0.8; }`;
      const PAIRS = [125, 155, 180, 210];      // (the third pair stands 5 m nearer than the brief's: the hawk-moth passes while its two stems are wide apart)
      for (let pi = 0; pi < PAIRS.length; pi++) { const pz = PAIRS[pi]; for (const side of [-1, 1]) {
        const x = side * (8.2 + cRng.range(0, 1.2)), z = pz + cRng.range(-2.5, 2.5), topY = 23.5 + pi * 1.2 + cRng.range(0, 3), lean = cRng.range(-0.04, 0.04);
        const sp = [], sr = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12; sp.push([x + side * (t * t * 2.2) + Math.sin(t * 5 + pi) * 0.25, topY * t, z + lean * topY * t]); sr.push(1.0 - 0.45 * t + 0.16 * Math.exp(-Math.pow((t - 0.55) * 14, 2))); }
        stemGeos.push(style.tube(sp, sr, 12)); stemPaths.push({ sp, sr, side });
        for (let j = 0; j < 7; j++) { const an = (j / 7) * TAU; ribLines.push({ pts: sp.filter((_, i) => i % 2 === 0).map((q, i) => [q[0] + Math.cos(an) * sr[i * 2] * 0.98, q[1], q[2] + Math.sin(an) * sr[i * 2] * 0.98]), w: 0.07, a: 0.55 }); }
        const top = sp[12];
        umbList.push({ p: top, ry: cRng.range(0, TAU), rx: side * -0.1, rz: side * 0.12, s: 9 * cRng.range(0.92, 1.08) * (plate ? 1.2 : 1) });
        // two side umbels on branches leaving the node at mid height, away from the course
        for (let b = 0; b < 2; b++) {
          const o = sp[7], bz = (b ? 1 : -1) * cRng.range(5, 9), bx = side * cRng.range(9, 15), by = cRng.range(9, 15), e = [o[0] + bx, o[1] + by, o[2] + bz];
          const bp = [o, [o[0] + bx * 0.35, o[1] + by * 0.2, o[2] + bz * 0.35], [o[0] + bx * 0.8, o[1] + by * 0.65, o[2] + bz * 0.8], e];
          stemGeos.push(style.tube(bp, [0.5, 0.42, 0.34, 0.28], 8));
          umbList.push({ p: e, ry: cRng.range(0, TAU), rx: cRng.range(-0.2, 0.2), rz: side * -0.3, s: 5.6 * cRng.range(0.85, 1.15) });
        }
      } await ctx.yield(); }
      await ctx.yield();
      const stems = add(mergeGeometries(stemGeos), { kind: 'solid', k: 2.3, hollow: 0.72, move: SWAY.replace('0.012', '0.006') });
      stemGeos.forEach((g) => g.dispose());
      const ribs = add(style.threads(ribLines), { kind: 'thread', move: SWAY.replace('0.012', '0.006') });
      shadowOf(stems, { den: 0.92, move: '{ pos -= normal * 0.3; }' + SWAY.replace('0.012', '0.0015') });
      const mv = (fl) => UMB_MOVE.replace('UFL', fl) + SWAY.replace('0.012', '0.006');
      const umbRays = instanced(rayGeo, { kind: 'thread', pre: UMB_PRE, move: mv('0.'), uniforms: goU }, umbList);
      const umbFl = instanced(flGeo, { kind: 'card', alpha: 0.3 * P.film, pattern: FLORET, small: true, pre: UMB_PRE, move: mv('1.'), uniforms: goU }, umbList);
      // their shadows open on the paper at the same time. An umbel is not a disc: its shadow is a wheel of soft dabs, one to
      // an umbellule, on thin spokes, with the paper blue between them (so a pile of them stays lace and never a wash)
      const dq = style.cards(rays.map((r) => ({ c: r.pts[2], u: [0.14, 0, 0], v: [0, 0, 0.14] })));
      const UMB_SH = /* glsl */`{ vec3 uo = instanceMatrix[3].xyz; float op = smoothstep(-64., -14., uGoZ - uo.z); op = op * op * (3. - 2. * op);
          pos = uo + (pos - uo) * mix(0.14, 1., op); alp *= mix(0.55, 1., op) * step(7., length(instanceMatrix[0].xyz)); }`;     // (the side umbels write nothing: one wheel to a plant)
      const dsh = new THREE.InstancedMesh(dq, style.shadow({ pre: UMB_PRE, uniforms: goU, soft: 0.3,
        pattern: '{ float r = length(vUv - .5) * 2.; den = 0.85 * (1. - smoothstep(0.6, 1., r)); }', move: UMB_SH }), umbList.length);
      const spk = new THREE.InstancedMesh(style.threads(rays.map((r) => ({ pts: r.pts, w: 0.3, a: 1 }))), style.shadow({ pre: THREAD_SH_PRE + UMB_PRE, uniforms: goU,
        pattern: '{ den = 0.4 * (1. - smoothstep(0.25, 1., abs(vUv.x - .5) * 2.)); }', move: THREAD_SH_DIR + UMB_SH + THREAD_SH.replace('WK', '1.5') }), umbList.length);
      spk.instanceMatrix = umbFl.instanceMatrix; spk.matrixAutoUpdate = false; style.exposure.add(spk);
      dsh.instanceMatrix = umbFl.instanceMatrix; dsh.matrixAutoUpdate = false; style.exposure.add(dsh);
    }
    await ctx.yield();
    // ======================================= THE WAY OUT: the honesty plant and its empty pod =============
    // (summer: a poppy capsule's crown; autumn: a hole eaten in a leaf). The eleventh pod is the portal's rim.
    {
      const oRng = rng.fork('exit'), up = V(0, 1, 0), dir = exitDir.clone().setY(0).normalize(), side = new THREE.Vector3().crossVectors(up, dir).normalize();
      const at = (a, h, f) => [exitW.x + side.x * a + dir.x * f, exitW.y + h, exitW.z + side.z * a + dir.z * f];
      const POD = {
        spring: /* glsl */`{ vec2 q = (vUv - .5) * 2.; float r = length(q), fr = fwidth(r) + 1e-4;
          float rim = 1. - smoothstep(0.035, 0.035 + fr * 1.5, abs(r - 0.92));
          float sd = min(min(length((q - vec2(0., .42)) * vec2(1., 1.25)), length((q - vec2(-.3, -.12)) * vec2(1., 1.25))), length((q - vec2(.27, -.3)) * vec2(1., 1.25)));
          float mid = (1. - smoothstep(0.012, 0.012 + fwidth(q.x) * 1.5, abs(q.x + 0.05 * sin(q.y * 3.)))) * 0.35;
          a *= (1. - smoothstep(0.92, 0.94 + fr, r)) * (0.75 + 0.5 * sp_vn(q * vec2(3., 14.))) * HOLE;
          pat = max(max(rim, (1. - smoothstep(0.12, 0.17, sd)) * 0.95 * HOLE), mid * HOLE * step(r, 0.92)); }`,
        summer: /* glsl */`{ vec2 q = (vUv - .5) * 2.; float r = length(q), fr = fwidth(r) + 1e-4; float an = (r < 1e-4) ? 0. : atan(q.y, q.x);
          float lob = 0.86 + 0.08 * cos(an * 13.); float ray = 1. - smoothstep(0.1, 0.3, abs(fract(an * 13. / 6.2832) - .5) * 2. * max(r, .2));
          a *= (1. - smoothstep(lob - 0.03, lob, r)) * 1.5 * HOLE; pat = max(1. - smoothstep(0.03, 0.03 + fr * 1.5, abs(r - lob + 0.04)), ray * 0.8 * step(r, lob) * HOLE); }`,
        autumn: /* glsl */`{ vec2 q = (vUv - .5) * 2.; float x = abs(q.x); float lens = max(sin(vUv.y * 3.14159), 0.02) * (0.9 + 0.08 * sin(vUv.y * 40.));
          float outl = 1. - smoothstep(0.9, 1., x / lens); float fy = fwidth(q.y) + 1e-4;
          float rib = 1. - smoothstep(0.012, 0.012 + fwidth(x) * 1.5, x); float sv = abs(fract(vUv.y * 7. - x * 1.3) - .5) * 2.;
          float net = 1. - smoothstep(0.02, 0.1, abs(sp_vn(q * 9.) - 0.5) * 2.);
          a *= outl * 0.5 * HOLE; pat = max(max(rib, (1. - smoothstep(0.05, 0.05 + fy * 20., sv)) * 0.8), net * 0.5) * outl * HOLE; }`,
      }[season];
      // the hole where the membrane used to be: nothing inside 7.4 m of the portal's centre, a torn white lip round it
      const HOLE = `(smoothstep(7.4, 7.9, length((vUv - .5) * vec2(HX, HY)) + 0.5 * sp_vn(vUv * 23.)))`;
      const big = season === 'autumn' ? [26, 34] : season === 'summer' ? [21, 21] : [17.5, 21];
      const rimGeo = style.cards([{ c: at(0, season === 'autumn' ? 4 : 0, 0.05), u: [side.x * big[0] / 2, 0, side.z * big[0] / 2], v: [0, big[1] / 2, 0] }]);
      const rimCard = add(rimGeo, { kind: 'card', alpha: 0.24, pattern: POD.split('HOLE').join(HOLE.replace('HX', big[0].toFixed(1)).replace('HY', big[1].toFixed(1))) +
        `{ float hr = length((vUv - .5) * vec2(${big[0].toFixed(1)}, ${big[1].toFixed(1)})) + 0.5 * sp_vn(vUv * 23.); pat = max(pat, (1. - smoothstep(0.0, 0.25, abs(hr - 7.75))) * 0.85); }` });
      rimCard.renderOrder = 2;
      // the plant: one stem 40 m tall, ten more pods on pedicels
      const sgn = (oRng(), 1), base = at(sgn * 17, -exitW.y, 5), stem = [], rad = [], lines = [], pods = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10; stem.push([base[0] + Math.sin(t * 3) * 1.2 - side.x * sgn * t * t * 5, 41 * t, base[2] + Math.cos(t * 2.3) * 1.0 - side.z * sgn * t * t * 5]); rad.push(0.85 - 0.55 * t); }
      const stemM = add(style.tube(stem, rad, 10), { kind: 'solid', k: 2.4, hollow: 0.6, move: SWAY.replace('0.012', '0.005') });
      shadowOf(stemM, { den: 0.9 });
      const top = at(0, big[1] / 2, 0.05); lines.push({ pts: bez(stem[6], [(stem[6][0] + top[0]) / 2, top[1] + 7, (stem[6][2] + top[2]) / 2], top), w: 0.3, w1: 0.14, a: 0.85 });
      for (let i = 0; i < 10; i++) {
        const over = i === 6 || i === 9, a0 = i < 4 ? oRng.range(22, 40) : oRng.range(15, 38), h = -12 + (i / 9) * 30 + oRng.range(-2, 2), f = oRng.range(-4, 26);
        const c = over ? at(-(a0 - 15) * 0.35 - 3, 22 + (i - 6) * 2.4, 8 + f * 0.7) : at(a0 * 0.92 + 3, h, 5 + f * 1.8);        // two hang over the ring; none on the clock's side
        if (!over && path.distanceTo(c[0], c[1], c[2]) < 17) c[1] += 12;
        const sc = oRng.range(0.55, 1.0) * 0.52, yaw = oRng.range(-0.7, 0.7), pit = oRng.range(-0.3, 0.3);
        const u = side.clone().applyAxisAngle(up, yaw), n = dir.clone().applyAxisAngle(up, yaw), v = up.clone().applyAxisAngle(u, pit); n.applyAxisAngle(u, pit);
        pods.push({ c, u: u.multiplyScalar(big[0] / 2 * sc).toArray(), v: v.multiplyScalar(big[1] / 2 * sc).toArray() });
        const o = stem[2 + Math.round((i / 9) * 7)], tp = [c[0] + v.x, c[1] + v.y, c[2] + v.z];
        lines.push({ pts: bez(o, [(o[0] + tp[0]) / 2, Math.max(o[1], tp[1]) + 6, (o[2] + tp[2]) / 2], tp), w: 0.26, w1: 0.12, a: 0.8 });
      }
      const podM = add(style.cards(pods), { kind: 'card', alpha: 0.24, pattern: POD.split('HOLE').join('1.'), move: SWAY.replace('0.012', '0.005') });
      add(style.threads(lines), { kind: 'thread', move: SWAY.replace('0.012', '0.005') });
      shadowOf(podM, { pattern: '{ float r = length(vUv - .5) * 2.; den = 0.22 * (1. - smoothstep(0.75, 0.95, r)) + 0.5 * (1. - smoothstep(0.03, 0.12, abs(r - 0.84))); }' });
    }
    await ctx.yield();
    // ======================================= THE FLYERS ====================================================
    // one winged shape (body along +Z, wings along X), flapped in the vertex shader. Every one has its white shadow.
    const wingGeo = (o) => {
      const L = [];
      for (const sd of [-1, 1]) {
        L.push({ c: [sd * 0.54, 0, 0.1 * o.sweep], u: [0, 0, 0.5 * o.chord], v: [sd * 0.46, 0, 0.12 * o.sweep] });
        L.push({ c: [sd * 0.36 * o.hind, 0, -0.28], u: [0, 0, 0.42 * o.chord], v: [sd * 0.32 * o.hind, 0, -0.14] });
      }
      for (let k = 0; k < 3; k++) L.push({ c: [0, 0.01 * k, -0.02], u: [0.055 * o.body, 0, 0], v: [0, 0, 0.36 * o.body] });
      return style.cards(L);
    };
    const FLAP = (rate, amp, off = '0.25') => /* glsl */`float fl_a = sin(uTime * ${rate} * (1. + 0.3 * FPH) + FPH * 40.) * ${amp} + ${off};
      vec3 lp = position; lp.xy = vec2(lp.x * cos(fl_a), lp.y + abs(lp.x) * sin(fl_a));`;
    const FLY_PRE = 'attribute vec4 aFly; uniform vec3 uEye;', flyU = { uEye: { value: new THREE.Vector3(0, -1e3, 0) } };
    const FLY_MOVE = (rate, amp) => /* glsl */`{ float ft = uTime * aFly.y + aFly.x * 6.283;
      ${FLAP(rate, amp).split('FPH').join('aFly.x')}
      vec3 fc = instanceMatrix[3].xyz; lp *= length(instanceMatrix[0].xyz);
      vec2 fe = vec2(cos(ft) * aFly.z, sin(ft) * aFly.w), fv = vec2(-sin(ft) * aFly.z, cos(ft) * aFly.w) * sign(aFly.y);
      float hd = atan(fv.x, fv.y + 1e-4), ch = cos(hd), sh = sin(hd);
      vec3 fcen = fc + vec3(fe.x, 0.7 * sin(ft * 2.3 + aFly.x * 9.), fe.y);
      // none of them comes near the lens: inside 9 m of the eye a flyer is carried out and up round us, and it thins to nothing by 4 m
      vec3 fd = fcen - uEye; float fdl = length(fd);
      fcen += (fd + vec3(0., 0.6, 0.)) / max(fdl, 0.5) * max(0., 9. - fdl) * 0.9;
      alp *= smoothstep(3.5, 6.5, length(fcen - uEye));
      pos = fcen + vec3(lp.x * ch + lp.z * sh, lp.y, -lp.x * sh + lp.z * ch); }`;
    const WING_SH = ' alp *= mix(1., WF, smoothstep(0.03, 0.1, abs(position.x)));';
    const flock = (geo, n, alpha, rate, amp, place) => {
      const list = [], fly = new Float32Array(n * 4), fRng = rng.fork('fly' + n);
      for (let i = 0; i < n; i++) { const f = place(fRng, i); list.push({ p: f.p, s: f.s }); fly.set([fRng(), f.w * (fRng() < 0.5 ? -1 : 1), f.a, f.b], i * 4); }
      geo.setAttribute('aFly', new THREE.InstancedBufferAttribute(fly, 4));
      const m = instanced(geo, { kind: 'card', alpha: alpha * P.film, pattern: style.patterns.vein + ' a = min(a, 0.3);', pre: FLY_PRE, move: FLY_MOVE(rate, amp), uniforms: flyU }, list);
      // (the shadow beats its wings less than the flyer, so a wake is a line and not a row of dots)
      // (and it is the body that writes the lasting line: the wings' wide shadow is fainter, so it prints back within a second and
      //  a half and the wake tapers from a pale fringe at the head to one fine white line, instead of lying as a broad bar)
      shadowOf(m, { pattern: LEAF_SH.replace('DEN', '0.9'), pre: FLY_PRE, move: FLY_MOVE(rate, (parseFloat(amp) * 0.35).toFixed(2)) + WING_SH.replace('WF', '0.16'), uniforms: flyU }).userData.mover = true;
      return m;
    };
    const cast = { spring: ['moth', 'lacewing'], summer: ['moth', 'mayfly'], autumn: ['moth', 'cranefly'] }[season];
    const mothShape = { sweep: 1, chord: 1, hind: 1, body: 1 };
    const fineShape = cast[1] === 'lacewing' ? { sweep: 0.4, chord: 0.62, hind: 1.25, body: 0.8 } : cast[1] === 'mayfly' ? { sweep: 2.2, chord: 0.7, hind: 0.5, body: 1.9 } : { sweep: -0.6, chord: 0.36, hind: 0.3, body: 2.2 };
    // thirty moths, wingspans 1 to 3 m, looping low across the course in ones and twos
    flock(wingGeo(mothShape), Math.max(18, Math.round(30 * clamp(lush, 0.7, 1.2))), 0.34, '11.', '0.95', (r, i) => {
      const z = 14 + (i / 30) * 350 + r.range(-8, 8), n = path.nearestXZ(courseX(z), z), yc = clamp(n.y + r.range(-3, 5), 2.5, 26);
      const f = { p: [courseX(z) + r.range(-12, 12), yc, z], s: r.range(0.5, 1.5) * 1.15, w: r.range(0.35, 0.7), a: r.range(9, 24), b: r.range(5, 13) };
      // (where we skim the sheet they loop over the ferns to either side, 8 m and more from our line: seen from 3 m up a wake
      //  laid across the lane is a white bar as broad as a hand, and a wing passing the lens is a stripe of milk)
      if (z < 120) { const off = f.p[0] - courseX(z); f.p[0] = courseX(z) + (off < 0 ? -1 : 1) * (16.5 + Math.abs(off) * 0.45); f.a = 5 + (f.a - 9) * 0.2; f.b = Math.min(f.b, 8); }
      return f;
    });
    // fourteen fine-winged ones, all vein, rowing slowly at umbel height
    flock(wingGeo(fineShape), 14, 0.1, '3.2', '0.6', (r, i) => {
      const z = 70 + (i / 14) * 250 + r.range(-10, 10);
      const f = { p: [r.range(-30, 22) + courseX(z), r.range(19, 33), z], s: r.range(1.3, 2.4), w: r.range(0.12, 0.25), a: r.range(10, 26), b: r.range(8, 18) };
      // (the last four keep small loops in the sky round the clock, to its left, right and above, never across the globe:
      //  seen from the long straight they are the middle depth of the air while it blazes)
      if (i >= 10) { const [lf, up, bk] = [[22, 10, 0], [38, 5, 18], [-24, 11, 0], [6, 19, 4]][i - 10];
        f.p = [heartW.x + 0.545 * lf + 0.839 * bk, heartW.y + up, heartW.z + 0.839 * lf - 0.545 * bk]; f.s = 2.3 + 0.2 * (i - 10); f.a = 4.5; f.b = 3.5; }
      return f;
    });
    // the two with appointments: one crosses 7 m ahead at 9 s, the hawk-moth passes overhead at 17 s
    const solo = (geo, alpha, rate, amp, scale, off, wf = '0.3', pattern = 'vein') => {
      const mv = '{ ' + FLAP(rate, amp, off).split('FPH').join('0.37') + ' pos = lp; }';
      const m = add(geo, { kind: 'card', alpha: alpha * P.film, pattern, move: mv }); m.scale.setScalar(scale);
      const shU = { uShA: { value: 1 } };
      const sh = shadowOf(m, { pattern: LEAF_SH.replace('DEN', '0.85'), pre: 'uniform float uShA;', move: mv + ' alp *= uShA;' + WING_SH.replace('WF', wf), uniforms: shU }); sh.userData.mover = true; m.userData.shadow = sh; m.userData.shU = shU.uShA; return m;
    };
    // (the hawk-moth's wings are a moth's, not a leaf's: broad from a narrow base, veins fanning from the base to a scalloped margin, one cross-vein)
    const MOTH = /* glsl */`{ vec2 q = vec2((vUv.x - .5) * 2., clamp(vUv.y, 0., 1.)); float lim = (0.14 + 0.86 * pow(q.y, 0.6)) * sqrt(max(1. - q.y * q.y * q.y * q.y, 0.)) * (1. - 0.05 * cos(q.x * 21.) * q.y);
      float sx = q.x / max(lim, 0.03), ax = abs(sx); float outl = 1. - smoothstep(0.9, 1., ax);
      float vn = abs(fract(sx * 3.2 + .5) - .5) * 2., fv = fwidth(sx * 3.2) * 2. + 1e-4;
      float veins = (1. - smoothstep(0.05, 0.05 + fv, vn)) * smoothstep(0.03, 0.12, q.y);
      float cross = (1. - smoothstep(0.012, 0.012 + fwidth(q.y) * 1.5, abs(q.y - 0.5 - 0.07 * sx * sx))) * step(ax, 0.82) * 0.7;
      pat = max(max(veins * 0.92, cross), smoothstep(0.74, 0.9, ax) * 0.7) * outl; a *= outl; }`;
    const crosser = solo(wingGeo(fineShape), 0.16, '4.5', '0.5', 1.7, '0.75'), hawk = solo(wingGeo({ sweep: 1, chord: 0.92, hind: 1, body: 0.01 }), 0.42, '7.', '0.36', 4.8, '0.1', '0.22', MOTH);
    { const body = new THREE.SphereGeometry(1, 16, 10); body.scale(0.062, 0.055, 0.3); body.translate(0, 0, -0.03);
      const head = new THREE.SphereGeometry(0.05, 12, 8); head.translate(0, 0.005, 0.27);
      const bg = mergeGeometries([body, head]); body.dispose(); head.dispose();
      add(bg, { kind: 'solid', k: 3.2, tone: 0 }, hawk);
      const ant = []; for (const sd of [-1, 1]) { const A = bez([0.02 * sd, 0.02, 0.3], [0.1 * sd, 0.05, 0.46], [0.24 * sd, 0.03, 0.56], 6); ant.push({ pts: A, w: 0.1, w1: 0.05, a: 0.95, a1: 0.8 });
        for (let j = 1; j < 6; j++) ant.push({ pts: [A[j], [A[j][0] + 0.03 * sd, A[j][1], A[j][2] - 0.035]], w: 0.05, a: 0.7 }); }
      add(style.threads(ant), { kind: 'thread', tone: 0 }, hawk); }
    const verger = solo(wingGeo(mothShape), 0.3, '8.', '0.7', 2.6, '0.2');       // a moth that crosses the open air ahead of us between the colonnade and the clock
    {
      const pA = path.pointAt(0.225), tA = path.tangentAt(0.225), pH = new THREE.Vector3(), tH = new THREE.Vector3();
      scripted.push((dt, time, u) => {
        const k = (u - 0.225) / 0.06;                                        // -1..1 while it crosses in front of us
        crosser.position.set(pA.x + k * 15, pA.y + 1.3 + 0.4 * Math.sin(time * 1.3) + Math.abs(k) * 1.5, pA.z + tA.z * 7 + k * 3);
        crosser.rotation.y = 1.25; crosser.updateMatrixWorld();
        const s = u * path.length + 11.2 + (u - 0.43) * (u < 0.43 ? 700 : 260);   // overtakes us from behind, high over the lens (it comes down into the picture from the top between u 0.415 and 0.43), and holds 11-14 m ahead on our own line, in the open sky between the stems, through u 0.43-0.44
        const over = 7 * (1 - smoothstep(0.405, 0.43, u));                     // (while it is nearer than 9 m it is above the top of the frame: never a wing across the lens)
        const away = Math.max(0, u - 0.452);                                 // then it climbs away over the top of the picture (the skeleton leaf has the sky to itself)
        path.posAtDist(clamp(s, 0, path.length), pH); path.tangentAtDist(clamp(s, 0, path.length), tH);
        const off = s < 0 ? s : s > path.length ? s - path.length : 0;
        hawk.position.set(pH.x + tH.x * off + 0.5 * Math.sin(time * 0.8) + away * 240, pH.y + 1.5 + over + 0.35 * Math.sin(time * 1.9) + away * 620, pH.z + tH.z * off);
        hawk.rotation.set(-1.12, Math.atan2(tH.x, tH.z) + 0.08 * Math.sin(time * 0.7), 0, 'YXZ'); hawk.updateMatrixWorld();
        hawk.userData.shU.value = 1 - smoothstep(0.49, 0.55, u);            // once it has passed, it stops writing on the paper: no slab laid across the reveal
        const hawkOn = u > 0.3 && u < 0.62;                                  // it waits out of the picture (and out of the portal's view of us)
        hawk.visible = hawkOn; hawk.userData.shadow.visible = hawkOn;
        let crossOn = u > 0.08 && u < 0.34;
        if (u > 0.5) {       // its second appointment: it rows along with us in the upper left of the sky while the clock blazes (u 0.60-0.76), 12 m off
          const e = 1 - smoothstep(0.585, 0.63, u) * (1 - smoothstep(0.735, 0.77, u)), lat = 4.6 - (u - 0.685) * 26 + e * 7;
          path.posAtDist(u * path.length, pH); path.tangentAtDist(u * path.length, tH); const hl = Math.hypot(tH.x, tH.z) || 1;
          crosser.position.set(pH.x + (tH.x * 11 + tH.z * lat) / hl, pH.y + 4.2 + 0.4 * Math.sin(time * 1.1) + e * 9, pH.z + (tH.z * 11 - tH.x * lat) / hl);
          crosser.rotation.set(-0.95, Math.atan2(tH.x, tH.z) + 0.45 + 0.12 * Math.sin(time * 0.6), 0.2, 'YXZ'); crosser.updateMatrixWorld();
          crossOn = u > 0.585 && u < 0.77;
        }
        crosser.visible = crossOn; crosser.userData.shadow.visible = crossOn;
        { const kv = (u - 0.6) / 0.06, sv = clamp(u * path.length + 15 - kv * 3, 0, path.length);      // left to right, 15 m ahead, above our line (it passes well over the clock, never across it) and away up to the right
          path.posAtDist(sv, pH); path.tangentAtDist(sv, tH); const hl = Math.hypot(tH.x, tH.z) || 1;
          verger.position.set(pH.x - tH.z / hl * kv * 17, pH.y + 3.4 + 1.1 * Math.sin(time * 1.1) - kv * kv * 0.8 + Math.max(0, kv - 0.8) * 10, pH.z + tH.x / hl * kv * 17);
          verger.rotation.set(-0.5, Math.atan2(tH.x, tH.z) - 1.0 + 0.15 * Math.sin(time * 0.9), 0.25 * Math.sin(time * 1.3), 'YXZ'); verger.updateMatrixWorld();
          const vOn = u > 0.535 && u < 0.7; verger.visible = vOn; verger.userData.shadow.visible = vOn; }
      });
    }
    await ctx.yield();
    // ======================================= THE DRIFT: loose seeds on the air, each with its star shadow ==
    {
      const dRng = rng.fork('drift'), lines = [[0, -0.9, 0], [0, 0, 0]], L = [{ pts: lines, w: 0.035, w1: 0.03, a: 0.8 }];
      for (let i = 0; i < 11; i++) { const az = (i / 11) * TAU + dRng.range(-0.2, 0.2), el = dRng.range(0.2, 0.6); L.push({ pts: [[0, 0, 0], [Math.cos(az) * Math.cos(el) * 0.5, Math.sin(el) * 0.5, Math.sin(az) * Math.cos(el) * 0.5]], w: 0.028, w1: 0.014, a: 0.72, a1: 0.5 }); }
      const nD = Math.round(400 * clamp(lush, 0.55, 1.3)), list = [];
      const wind = hero.anchors.wind.clone().normalize();
      for (let i = 0; i < nD; i++) list.push({ p: [dRng.range(-160, 70), dRng.range(1.5, 34) * (dRng() < 0.5 ? 0.45 : 1), dRng.range(-30, 410)], s: dRng.range(1.3, 2.6), ry: dRng.range(0, TAU) });
      const DR_PRE = 'uniform vec3 uWindD; uniform vec3 uEye; uniform vec4 uClk;';
      const DR_MOVE = /* glsl */`{ vec3 dh = instanceMatrix[3].xyz; float dph = fract(dh.x * 0.713 + dh.z * 0.291);
        vec3 dw = dh + uWindD * uTime * (2.2 + 2.6 * dph);
        dw.x = mod(dw.x + 160., 230.) - 160.; dw.z = mod(dw.z + 30., 440.) - 30.;
        dw.y += 1.1 * sin(uTime * 0.5 + dph * 40.) + 0.4 * sin(uTime * 1.3 + dph * 17.);
        float da = uTime * (0.4 + dph) + dph * 9., dc = cos(da), ds = sin(da); vec3 dl = pos - dh;
        float dfade = smoothstep(0., 12., min(min(dw.x + 160., 70. - dw.x), min(dw.z + 30., 410. - dw.z)));
        pos = dw + vec3(dl.x * dc - dl.z * ds, dl.y, dl.x * ds + dl.z * dc) * DSC; alp *= dfade;
        dir = vec3(dir.x * dc - dir.z * ds, dir.y, dir.x * ds + dir.z * dc); wid *= 2.4;
        // (none of them comes near the lens either: a loose seed thins whole with the true distance from the eye to its centre, to nothing at 2 m plus its own reach, the stalk's length, from 3 m further out)
        { float dnr = 2. + 0.9 * length(instanceMatrix[0].xyz); alp *= smoothstep(dnr, dnr + 3., length(dw - uEye)); }
        // (while the clock blazes no loose seed drifts across it: none within two globe-widths of our line of sight to its heart)
        { vec3 dv = dw - uEye, hd = uClk.xyz - uEye; float hl = max(length(hd), 1.), al = dot(dv, hd) / hl;
          float ang = length(dv - hd / hl * al) / max(al, 1.), need = 17. / hl;
          alp *= mix(1., smoothstep(need, need * 1.35, ang + step(al, 0.) * 9.), uClk.w); } DEX }`;
      const dU = { uWindD: { value: wind }, uEye: flyU.uEye, uClk: { value: new THREE.Vector4(heartW.x, heartW.y, heartW.z, 0) } };
      scripted.push((dt, time, u) => { dU.uClk.value.w = smoothstep(0.5, 0.58, u) * (1 - smoothstep(0.69, 0.74, u)); });
      instanced(style.threads(L), { kind: 'thread', small: true, pre: DR_PRE, move: DR_MOVE.replace('DSC', '1.').replace('DEX', ''), uniforms: dU }, list);
      // (round 5: the loose seeds write nothing on the paper. Each one's eye used to leave a metre of wake and no visible star, and
      //  a row of them down the wind read as a dashed line beside the clock's stalk.)
    }
    await ctx.yield();

    // ======================================= SKELETON LEAVES: nets of veins, one spiralling down at 20 s ==
    {
      // a skeleton leaf is all line: midrib, seven pairs of raked side veins, one coarse net between them, a rim; hardly any film
      const SKEL = /* glsl */`{ vec2 q = (vUv - .5) * 2.; float x = abs(q.x); float lens = max(sin(vUv.y * 3.14159), 0.02) * (0.92 + 0.07 * sin(vUv.y * 46.));
        float xl = x / lens; float outl = 1. - smoothstep(0.92, 1., xl); float edge = smoothstep(0.84, 0.95, xl) * outl;
        float fx = fwidth(x) + 1e-4, fy = fwidth(vUv.y) + 1e-4;
        float rib = 1. - smoothstep(0.022, 0.022 + fx * 1.5, x); float sv = abs(fract(vUv.y * 7. - x * 1.3) - .5) * 2.;
        float side = 1. - smoothstep(0.06, 0.06 + fy * 28., sv);
        float n1 = abs(sp_vn(q * vec2(7., 15.)) - 0.5) * 2.; float fn = fwidth(n1) + 1e-4;
        float net = (1. - smoothstep(0.045, 0.045 + fn * 1.5, n1)) * 0.62;
        a *= outl * 0.22; pat = max(max(max(rib, side * 0.92), net), edge * 0.6) * outl; }`;
      const lRng = rng.fork('leaves'), nL = season === 'autumn' ? 16 : 7, L = [];
      for (let i = 0; i < nL; i++) {            // lying caught in the grass beside the course
        const z = 40 + (i / nL) * 300 + lRng.range(-12, 12), n = path.nearestXZ(0, z), x = (lRng() < 0.5 ? -1 : 1) * lRng.range(10, 34) + courseX(z);
        const a = lRng.range(0, TAU), len = lRng.range(5, 9), tilt = lRng.range(0.15, 0.5);
        L.push({ c: [x, 1.2 + len * 0.5 * Math.sin(tilt), z], u: [Math.sin(a) * len * 0.3, 0, -Math.cos(a) * len * 0.3], v: [Math.cos(a) * Math.cos(tilt) * len * 0.5, Math.sin(tilt) * len * 0.5, Math.sin(a) * Math.cos(tilt) * len * 0.5] });
      }
      const lying = add(style.cards(L), { kind: 'card', alpha: 0.2 * P.film, pattern: SKEL, small: true, move: SWAY.replace('0.012', '0.03') });
      shadowOf(lying, { pattern: LEAF_SH.replace('DEN', '0.4'), move: SWAY.replace('0.012', '0.03') });
      // (the one that falls is drawn with firmer veins: it is the subject of its picture, white line on blue)
      const SKEL_HERO = SKEL.replace('0.022, 0.022 + fx', '0.04, 0.04 + fx').replace('0.06, 0.06 + fy', '0.1, 0.1 + fy').replace('0.045, 0.045 + fn * 1.5, n1)) * 0.62', '0.075, 0.075 + fn * 1.5, n1)) * 0.86').replace('edge * 0.6', 'edge');
      const faller = add(style.cards([{ c: [0, 0, 0], u: [1.95, 0, 0], v: [0, 0.3, 2.9] }]), { kind: 'card', alpha: 0.2 * P.film, pattern: SKEL_HERO });
      const fallSh = shadowOf(faller, { pattern: LEAF_SH.replace('DEN', '0.6') }); fallSh.userData.mover = true;
      // THE FALLING LEAF (round 5): at u 0.5 it hangs 12 m ahead, a little right of our line and just above eye height, turned to
      // face us, so its whole net is read against the sky under the arching frond; it rocks as it sinks, drifts on with the
      // air (so it is still ahead of us at u 0.52) and passes under our right side at u 0.55.
      const pF = path.pointAt(0.5), tF = path.tangentAt(0.5), fl = Math.hypot(tF.x, tF.z) || 1, _lc = new THREE.Vector3();
      const qF = [pF.x + tF.x / fl * 12 - tF.z / fl * 1.2, pF.y + 2.2, pF.z + tF.z / fl * 12 + tF.x / fl * 1.2];
      scripted.push((dt, time, u, camera) => {
        const k = (u - 0.5) * 40, a = k * 1.1 + 1;                               // seconds from the beat
        faller.position.set(qF[0] + tF.x / fl * k * 8 + 0.9 * Math.cos(a), Math.max(0.4, qF[1] - k * 2.2 + 0.5 * Math.sin(a * 1.7) + Math.max(0, 0.475 - u) * 500), qF[2] + tF.z / fl * k * 8 + 0.9 * Math.sin(a));
        camera.getWorldPosition(_lc);
        faller.rotation.set(-1.2 + 0.22 * Math.sin(a * 1.3), Math.atan2(_lc.x - faller.position.x, _lc.z - faller.position.z) + 0.45 * Math.sin(a * 0.9), 0.3 * Math.cos(a * 0.8), 'YXZ'); faller.updateMatrixWorld();
        faller.visible = fallSh.visible = u > 0.36 && u < 0.7;
      });
    }
    await ctx.yield();
    // ======================================= FIVE LESSER CLOCKS, small and far ============================
    {
      const cRng = rng.fork('clocks'), L = [{ pts: bez([0, 0, 0], [0.05, 0.5, 0.02], [0, 1, 0], 6), w: 1.1, w1: 0.7, a: 0.9 }];
      for (let i = 0; i < 72; i++) {
        const y = 1 - ((i + 0.5) / 72) * 1.75, r = Math.sqrt(Math.max(0, 1 - y * y)), an = i * 2.399, d = [Math.cos(an) * r, y, Math.sin(an) * r], R = 0.36;
        const tip = [d[0] * R * 0.72, 1 + d[1] * R * 0.72, d[2] * R * 0.72];
        L.push({ pts: [[d[0] * 0.05, 1 + d[1] * 0.05, d[2] * 0.05], tip], w: 0.1, w1: 0.06, a: 0.6 });
        for (let k = 0; k < 5; k++) { const a2 = k * 1.2566 + i, e = [Math.cos(a2), Math.sin(a2)], tx = [-d[2], 0, d[0]], ty = [d[1] * d[0], -(d[0] * d[0] + d[2] * d[2]), d[1] * d[2]];
          L.push({ pts: [tip, [tip[0] + d[0] * R * 0.2 + (tx[0] * e[0] + ty[0] * e[1]) * 0.075, tip[1] + d[1] * R * 0.2 + (tx[1] * e[0] + ty[1] * e[1]) * 0.075, tip[2] + d[2] * R * 0.2 + (tx[2] * e[0] + ty[2] * e[1]) * 0.075]], w: 0.09, w1: 0.05, a: 0.55, a1: 0.35 }); }
      }
      const spots = [[14, 44], [-52, 96], [118, -74], [-96, -86], [96, 84]].map(([al, lf], i) => ({ p: [Bx + Wx * al + Wz * lf + cRng.range(-8, 8) * (i ? 1 : 0.4), 0, Bz + Wz * al - Wx * lf + cRng.range(-8, 8) * (i ? 1 : 0.4)], ry: cRng.range(0, TAU), s: cRng.range(15, 25) * (i ? 1 : 0.78), rz: cRng.range(-0.05, 0.05) }));
      instanced(style.threads(L), { kind: 'thread', move: SWAY.replace('0.012', '0.006') }, spots);
      const ball = new THREE.SphereGeometry(0.33, 18, 12); ball.translate(0, 1, 0);
      instanced(ball, { kind: 'solid', k: 0.5, move: SWAY.replace('0.012', '0.006') }, spots);
    }
    // ======================================= THE GARNISH: cold-press grain, fixed to the screen ===========
    {
      const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
      const grain = new THREE.Mesh(tri, new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, transparent: true,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
        vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: /* glsl */`float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
          void main(){ vec2 q = gl_FragCoord.xy; float g = vn(q * 0.55) * 0.5 + vn(q * 0.17 + 9.) * 0.3 + h21(floor(q)) * 0.2;
            gl_FragColor = vec4(vec3(1.04 - 0.085 * g), 1.); }` }));
      grain.frustumCulled = false; grain.renderOrder = 30; scene.add(grain);
    }
    await ctx.yield();
    // ======================================= THE OTHER SEASONS' FOREGROUND ================================
    // high summer: poppy seed heads and tall grass tussocks; autumn: teasels (the bracken above is then all vein)
    if (season !== 'spring') {
      const hRng = rng.fork('heads'), L = [], solids = [];
      const stemTop = season === 'summer' ? 0.86 : 0.8, hy = season === 'summer' ? 0.93 : 0.9, rx = season === 'summer' ? 0.085 : 0.06, ry = season === 'summer' ? 0.1 : 0.125;
      L.push({ pts: bez([0, 0, 0], [0.07, 0.55, 0.02], [0, stemTop, 0], 8), w: 0.5, w1: 0.3, a: 0.95 });
      const ball = new THREE.SphereGeometry(1, 20, 14); ball.scale(rx, ry, rx); ball.translate(0, hy, 0);
      if (season === 'summer') {
        for (let j = 0; j < 11; j++) { const an = (j / 11) * TAU, pts = []; for (let i = 0; i <= 6; i++) { const t = -1 + (i / 6) * 1.9, r = Math.sqrt(Math.max(0, 1 - t * t)); pts.push([Math.cos(an) * r * rx * 1.01, hy + t * ry, Math.sin(an) * r * rx * 1.01]); } L.push({ pts, w: 0.07, a: 0.6 }); }
        for (let j = 0; j < 13; j++) { const an = (j / 13) * TAU; L.push({ pts: [[0, hy + ry * 1.06, 0], [Math.cos(an) * rx * 0.7, hy + ry * 1.04, Math.sin(an) * rx * 0.7], [Math.cos(an) * rx * 1.25, hy + ry * 0.9, Math.sin(an) * rx * 1.25]], w: 0.2, w1: 0.26, a: 0.85, a1: 0.6 }); }
      } else {
        for (let j = 0; j < 110; j++) { const y = 1 - ((j + 0.5) / 110) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), an = j * 2.399, d = [Math.cos(an) * r, y, Math.sin(an) * r];
          L.push({ pts: [[d[0] * rx, hy + d[1] * ry, d[2] * rx], [d[0] * (rx + 0.03), hy + d[1] * (ry + 0.03) + 0.012, d[2] * (rx + 0.03)]], w: 0.09, w1: 0.03, a: 0.7, a1: 0.4 }); }
        for (let j = 0; j < 8; j++) { const an = (j / 8) * TAU + 0.2, l = hRng.range(0.2, 0.34), c = Math.cos(an), sn = Math.sin(an);
          L.push({ pts: bez([c * 0.02, hy - ry, sn * 0.02], [c * l * 0.75, hy - ry - 0.03, sn * l * 0.75], [c * l * 0.55, hy - ry + l * 0.95, sn * l * 0.55], 7), w: 0.2, w1: 0.05, a: 0.8, a1: 0.5 }); }
      }
      const heads = instanced(style.threads(L), { kind: 'thread', move: SWAY }, crozList);
      const caps = instanced(ball, { kind: 'solid', k: season === 'summer' ? 1.5 : 1.1, move: SWAY }, crozList);
      { const stalks = new THREE.InstancedMesh(style.threads([L[0]]), heads.material, crozList.length); stalks.instanceMatrix = heads.instanceMatrix;
        shadowOf(stalks, { den: 0.85, wk: 0.7, move: SWAY_SH }).userData.src = heads; }        // (the stalk writes its line; the crown and the ribs write nothing: a line and a ring, no spiked halo)
      // (a head's shadow is a small crisp ring at the end of its stalk's line, not a blot: drawn at half its size)
      shadowOf(caps, { den: 0.92, move: `{ vec3 hc = (instanceMatrix * vec4(0., ${hy.toFixed(3)}, 0., 1.)).xyz; pos = hc + (pos - hc) * 0.55;
        vec3 hn = mat3(instanceMatrix) * normal; hn = hn / max(length(hn), 1e-4); alp *= 1. - smoothstep(0.26, 0.5, abs(dot(hn, uLight))); }` + SWAY_SH });      // (only the rim of the capsule writes: a ring, like the pods', never a blot)
    }
    if (season === 'summer') {
      const tRng = rng.fork('tussock'), L = [];
      for (let b = 0; b < 10; b++) {
        const az = (b / 10) * TAU + tRng.range(-0.3, 0.3), c = Math.cos(az), sn = Math.sin(az), reach = tRng.range(0.25, 0.6), h = tRng.range(0.65, 1);
        const pts = bez([c * 0.02, 0, sn * 0.02], [c * reach * 0.25, h * 0.95, sn * reach * 0.25], [c * reach, h * tRng.range(0.75, 0.95), sn * reach], 7);
        L.push({ pts, w: 0.42, w1: 0.1, a: 0.85, a1: 0.6 });
        for (let k = 0; k < 7; k++) { const o = pts[4 + (k % 4)], sd = k % 2 ? 1 : -1, l = 0.05 + 0.03 * tRng();
          const e = [o[0] - sn * sd * l, o[1] - l * 0.5, o[2] + c * sd * l];
          L.push({ pts: [o, e], w: 0.06, a: 0.6 }, { pts: [e, [e[0], e[1] - 0.014, e[2]]], w: 0.05, w1: 0.3, a: 0.6, a1: 0.55 }, { pts: [[e[0], e[1] - 0.014, e[2]], [e[0], e[1] - 0.04, e[2]]], w: 0.3, w1: 0.04, a: 0.55, a1: 0.4 }); }
      }
      const list = []; frondLists.forEach((fl) => fl.forEach((it, i) => { if (i % 2 === 0) list.push({ p: it.p.map((v, k) => v + (k === 1 ? 0 : tRng.range(-5, 5))), ry: it.ry, s: it.s * 0.9 }); }));
      const GS2 = SWAY.replace('0.012', '0.02');
      const tus = instanced(style.threads(L), { kind: 'thread', move: GS2 }, list);
      shadowOf(tus, { den: 0.8, move: GS2 });
    }
    await ctx.yield();
    // ======================================= BINDWEED up two of the colonnade's stems =====================
    {
      const bRng = rng.fork('bindweed'), L = [], fun = [], leaves = [];
      const prof = []; for (let i = 0; i <= 8; i++) { const v = i / 8; prof.push(new THREE.Vector2(0.07 + 1.25 * Math.pow(v, 2.4), v * 2.3)); }
      const lathe = new THREE.LatheGeometry(prof, 20);
      for (const si of [2, 5]) {
        const st = stemPaths[si]; if (!st) continue;
        const at = (t) => { const f = t * 12, i = Math.min(11, Math.floor(f)), k = f - i, a = st.sp[i], b = st.sp[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, st.sr[i] + (st.sr[i + 1] - st.sr[i]) * k]; };
        const vine = [], turns = bRng.range(4.5, 6), ph = bRng.range(0, TAU);
        for (let i = 0; i <= 90; i++) { const t = 0.02 + 0.74 * i / 90, c = at(t), an = ph + t * turns * TAU, r = c[3] + 0.16; vine.push([c[0] + Math.cos(an) * r, c[1], c[2] + Math.sin(an) * r]); }
        L.push({ pts: vine, w: 0.2, w1: 0.1, a: 0.85 });
        for (let k = 0; k < 6; k++) {
          const o = vine[10 + k * 14], c = at(0.02 + 0.74 * (10 + k * 14) / 90), out = new THREE.Vector3(o[0] - c[0], 0, o[2] - c[2]).normalize();
          const dirF = out.clone().multiplyScalar(0.8).add(V(0, 0.6, 0)).normalize(), g = lathe.clone();
          g.applyQuaternion(q4.setFromUnitVectors(V(0, 1, 0), dirF)); g.translate(o[0] + out.x * 0.3, o[1], o[2] + out.z * 0.3); fun.push(g);
          L.push({ pts: [o, [o[0] + out.x * 0.3, o[1], o[2] + out.z * 0.3]], w: 0.14, a: 0.8 });
          const lo = vine[4 + k * 14], lc = at(0.02 + 0.74 * (4 + k * 14) / 90), lout = [lo[0] - lc[0], 0, lo[2] - lc[2]], ll = Math.hypot(lout[0], lout[2]) || 1;
          leaves.push({ c: [lo[0] + lout[0] / ll * 1.0, lo[1] - 0.5, lo[2] + lout[2] / ll * 1.0], u: [-lout[2] / ll * 0.75, 0, lout[0] / ll * 0.75], v: [lout[0] / ll * 0.8, -0.75, lout[2] / ll * 0.8] });
        }
      }
      await ctx.yield();
      // BINDWEED UP ONE STEM OF EVERY PAIR: live climbs a stem of the second and third pairs; the first and the fourth get
      // theirs here, from a stream of their own (which stem of the pair, how many turns, where it starts), with more and larger
      // funnels low on the stem, where we pass them at eye height 8 m off. Same vine, funnel and leaf, in the same three meshes.
      { const wRng = own('bindweed-more'), lathe12 = new THREE.LatheGeometry(prof, 12);
        for (const pi of [0, 3]) {
          const st = stemPaths[pi * 2 + (wRng() < 0.5 ? 0 : 1)]; if (!st) continue;
          const at = (t) => { const f = t * 12, i = Math.min(11, Math.floor(f)), k = f - i, a = st.sp[i], b = st.sp[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, st.sr[i] + (st.sr[i + 1] - st.sr[i]) * k]; };
          const vine = [], turns = wRng.range(4.5, 6.5), ph = wRng.range(0, TAU), nFun = 7;
          for (let i = 0; i <= 96; i++) { const t = 0.02 + 0.78 * i / 96, c = at(t), an = ph + t * turns * TAU, r = c[3] + 0.16; vine.push([c[0] + Math.cos(an) * r, c[1], c[2] + Math.sin(an) * r]); }
          L.push({ pts: vine, w: 0.2, w1: 0.1, a: 0.85 });
          for (let k = 0; k < nFun; k++) {
            const vi = 6 + k * 12 + wRng.int(0, 5), o = vine[vi], c = at(0.02 + 0.78 * vi / 96), out = new THREE.Vector3(o[0] - c[0], 0, o[2] - c[2]).normalize();
            const dirF = out.clone().multiplyScalar(0.8).add(V(0, wRng.range(0.35, 0.8), 0)).normalize(), g = lathe12.clone(), gs = wRng.range(0.95, 1.3);
            g.scale(gs, gs, gs); g.applyQuaternion(q4.setFromUnitVectors(V(0, 1, 0), dirF)); g.translate(o[0] + out.x * 0.3, o[1], o[2] + out.z * 0.3); fun.push(g);
            L.push({ pts: [o, [o[0] + out.x * 0.3, o[1], o[2] + out.z * 0.3]], w: 0.14, a: 0.8 });
            const li = Math.max(0, vi - 5), lo = vine[li], lc = at(0.02 + 0.78 * li / 96), lout = [lo[0] - lc[0], 0, lo[2] - lc[2]], ll = Math.hypot(lout[0], lout[2]) || 1;
            leaves.push({ c: [lo[0] + lout[0] / ll * 1.0, lo[1] - 0.5, lo[2] + lout[2] / ll * 1.0], u: [-lout[2] / ll * 0.75, 0, lout[0] / ll * 0.75], v: [lout[0] / ll * 0.8, -0.75, lout[2] / ll * 0.8] });
          }
        }
        lathe12.dispose();
      }
      await ctx.yield();
      lathe.dispose();
      if (fun.length) {
        const sw = SWAY.replace('0.012', '0.006');
        const funnels = add(mergeGeometries(fun), { kind: 'card', alpha: 0.33 * P.film, move: sw, pattern: /* glsl */`{ float st = abs(fract(vUv.x * 5. + uTime * 0.03) - .5) * 2.;
          pat = (1. - smoothstep(0., 0.16, st)) * 0.45 * vUv.y + (1. - smoothstep(0., 0.06, 1. - vUv.y)) * 0.5; }` });
        fun.forEach((g) => g.dispose());
        await ctx.yield();
        add(style.threads(L), { kind: 'thread', move: sw });
        add(style.cards(leaves), { kind: 'card', alpha: 0.24 * P.film, pattern: 'vein', move: sw });
        shadowOf(funnels, { den: 0.5, move: sw });
      }
    }
    await ctx.yield();
    // ======================================= QUAKING GRASS: clumps hung with small lanterns of lace ========
    // For the whole colonnade: one clump in every 10 m of course on each side, 4 to 7 m high, 9 to 14 m from the course, so
    // there is a near thing beside us between the pairs of stems. A clump is a few arching culms; from the upper part of each
    // hang hair-thin branches, each bowed by one lantern (a spikelet: an ovate film with its scales drawn across it in white,
    // a rim and a midline). The lanterns quake; each clump writes its culms and its lanterns on the paper in white.
    {
      const qRng = own('quaking'), culmL = [], fineL = [], lant = [], QREF = 5.5;
      for (let b = 0; b < 7; b++) {
        const az = (b / 7) * TAU + qRng.range(-0.35, 0.35), ca = Math.cos(az), sa = Math.sin(az), reach = qRng.range(0.16, 0.42), h = qRng.range(0.7, 1);
        const culm = bez([ca * 0.02, 0, sa * 0.02], [ca * reach * 0.3, h * 0.8, sa * reach * 0.3], [ca * reach, h, sa * reach], 6);
        culmL.push({ pts: culm, w: 0.2, w1: 0.07, a: 0.95, a1: 0.8 });          // (widths in metres for a 5.5 m clump; scaled with the instance)
        for (let k = 0; k < 5; k++) {
          const o = culm[3 + (k % 4)], a2 = az + qRng.range(-1.5, 1.5), l = qRng.range(0.1, 0.2), e = [o[0] + Math.cos(a2) * l, o[1] + l * qRng.range(-0.1, 0.35), o[2] + Math.sin(a2) * l];
          fineL.push({ pts: bez(o, [(o[0] + e[0]) / 2, Math.max(o[1], e[1]) + l * 0.45, (o[2] + e[2]) / 2], e, 3), w: 0.05, w1: 0.035, a: 0.78, a1: 0.62 });
          const lh = qRng.range(0.05, 0.075), lw = lh * 0.74, ya = qRng.range(0, Math.PI);
          lant.push({ c: [e[0], e[1] - lh, e[2]], u: [Math.cos(ya) * lw, 0, Math.sin(ya) * lw], v: [0, lh, 0] });      // (it hangs from its top edge)
        }
      }
      const list = [], tp = new THREE.Vector3(), tt = new THREE.Vector3();
      const d0 = (TRACK.find((q) => q[1] >= 112) || TRACK[0])[2], d1 = (TRACK.find((q) => q[1] >= Z0) || TRACK[TRACK.length - 1])[2];
      for (let d = d0 + 4; d <= d1; d += 10) for (const sd of [-1, 1]) {
        const dd = d + qRng.range(-3.5, 3.5), lat = qRng.range(9, 14), hgt = qRng.range(4, 7), ry = qRng.range(0, TAU);
        path.posAtDist(dd, tp); path.tangentAtDist(dd, tt); const tl = Math.hypot(tt.x, tt.z) || 1;
        let x = tp.x + sd * tt.z / tl * lat, z = tp.z - sd * tt.x / tl * lat;
        for (const s of stemPaths) { const f = s.sp[0]; if (Math.hypot(x - f[0], z - f[2]) < 3.5) z = f[2] + (z >= f[2] ? 3.5 : -3.5); }      // (none grows out of a stem's foot: it stands 3.5 m along the course from it)
        list.push({ p: [x, 0, z], ry, s: hgt });
      }
      await ctx.yield();
      const QUAKE = /* glsl */`{ float qh = max(pos.y, 0.); float qp = pos.x * 0.9 + pos.z * 0.7;
        pos.xz += vec2(-0.6, 0.8) * sin(uTime * 1.1 + qp * 0.2) * 0.02 * qh;
        pos.x += sin(uTime * 6.3 + qp * 2.6) * 0.028 * qh; pos.z += cos(uTime * 5.1 + qp * 2.1) * 0.028 * qh; }`;
      const QW = `{ wid *= length(instanceMatrix[1].xyz) / ${QREF.toFixed(1)}; }`;
      const LANTERN = /* glsl */`{ float y = clamp(vUv.y, 0., 1.); float x = abs(vUv.x - .5) * 2.;
        float prof = sqrt(max(sin(3.14159 * y * sqrt(y)), 0.)); float xl = x / max(prof, 0.04);
        float outl = 1. - smoothstep(0.84, 1., xl); float fy = fwidth(y) * 6. + 1e-4, fx = fwidth(x) + 1e-4;
        float sv = abs(fract(y * 6. + x * 0.8) - .5) * 2.; float bars = (1. - smoothstep(0.16, 0.16 + fy * 2., sv)) * 0.85;
        float rib = 1. - smoothstep(0.05, 0.05 + fx * 1.5, x); float rim = smoothstep(0.62, 0.8, xl) * 0.8;
        pat = max(max(bars, rim), rib) * outl; a *= outl; }`;
      const culmGeo = style.threads(culmL);
      const qThreads = instanced(style.threads(culmL.concat(fineL)), { kind: 'thread', move: QW + QUAKE }, list);
      const qLant = instanced(style.cards(lant), { kind: 'card', alpha: 0.3 * P.film, pattern: LANTERN, move: QUAKE }, list);
      await ctx.yield();
      { const culms = new THREE.InstancedMesh(culmGeo, qThreads.material, list.length); culms.instanceMatrix = qThreads.instanceMatrix;
        shadowOf(culms, { den: 0.8, wk: 1.3, move: QUAKE.replace(/0\.028/g, '0.006') }).userData.src = qThreads; }       // (a culm's line on the paper hardly stirs; the lanterns' dabs quake and print back)
      shadowOf(qLant, { pattern: '{ float r = length(vUv - .5) * 2.; den = 0.74 * (1. - smoothstep(0.45, 0.95, r)); }', move: QUAKE });
    }
    await ctx.yield();
    // ======================================= THE PRINTED FLOOR: plants laid flat on the sheet and printed ==
    // The paper we skim is a photogram in its own right: fern fronds, grasses, leaves, feathers, seed heads and a moth were
    // laid on it and printed white, large under the lens and smaller beyond. One atlas of sixteen specimens (a film at
    // part density, every rachis, midrib, vein and barb at full), drawn here cell by cell; each print is a flat card on
    // the sheet in the paper's own white, a little faint ahead of the first rinse's lip and full once the water has passed.
    {
      const pRng = rng.fork('prints'), AS = 2048, CS = AS / 4;
      const cv = document.createElement('canvas'); cv.width = cv.height = AS;
      const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, AS, AS); g.lineCap = 'round'; g.lineJoin = 'round';
      await ctx.yield();
      let ox = 0, oy = 0;
      const X = (x) => ox + (0.05 + 0.9 * x) * CS, Y = (y) => oy + (0.05 + 0.9 * y) * CS;
      const ink = (a) => { const v = Math.round(255 * a); g.strokeStyle = g.fillStyle = `rgb(${v},${v},${v})`; };
      // pen(points, w0, w1, a): a tapering stroke (widths in pixels of a 512 cell); only ever brightens what is under it
      const pen = (pts, w0, w1, a) => { ink(a); g.globalCompositeOperation = 'lighten';
        for (let i = 0; i < pts.length - 1; i++) { g.lineWidth = 2.2 * (w0 + (w1 - w0) * (i / Math.max(1, pts.length - 2))); g.beginPath(); g.moveTo(X(pts[i][0]), Y(pts[i][1])); g.lineTo(X(pts[i + 1][0]), Y(pts[i + 1][1])); g.stroke(); } };
      const q2 = (a, m, b, n = 10) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, k = 1 - t; o.push([k * k * a[0] + 2 * k * t * m[0] + t * t * b[0], k * k * a[1] + 2 * k * t * m[1] + t * t * b[1]]); } return o; };
      // lens(a, b, halfWidth, film, rib): a blade from a to b: milky film, white midrib
      const lens = (a, b, hw, film, rib = 0.95, ribW = 1.3) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * hw, ny = dx / l * hw, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        ink(film); g.globalCompositeOperation = 'lighten'; g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.quadraticCurveTo(X(mx + nx * 2), Y(my + ny * 2), X(b[0]), Y(b[1])); g.quadraticCurveTo(X(mx - nx * 2), Y(my - ny * 2), X(a[0]), Y(a[1])); g.fill();
        if (rib > 0) pen([a, b], ribW, ribW * 0.5, rib); };
      const dot = (x, y, r, a) => { ink(a); g.globalCompositeOperation = 'lighten'; g.beginPath(); g.arc(X(x), Y(y), r, 0, TAU); g.fill(); };
      const frond = (pairs, bend, wide) => { const R = q2([0.5 - bend * 0.5, 0.99], [0.5 - bend, 0.5], [0.5 + bend, 0.02], 40), at = (t) => R[Math.min(40, Math.round(t * 40))];
        for (let j = 0; j < pairs; j++) { const t = 0.12 + 0.86 * (j + 0.5) / pairs, c = at(t), c2 = at(Math.min(1, t + 0.05)), tx = c2[0] - c[0], ty = c2[1] - c[1], tl = Math.hypot(tx, ty) || 1;
          const len = wide * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.8) + 0.012;
          for (const sd of [-1, 1]) { const px = -ty / tl * sd, py = tx / tl * sd, e = [c[0] + (px * 0.92 + tx / tl * 0.38) * len, c[1] + (py * 0.92 + ty / tl * 0.38) * len];
            lens(c, e, 0.4 / pairs, 0.22, 0.9, 1.1); } }
        pen(R, 4.5, 1.2, 1); };
      const grass = (n, heads) => { for (let b = 0; b < n; b++) { const a = (b + 0.5) / n - 0.5 + pRng.range(-0.04, 0.04), h = pRng.range(0.55, 0.95), tip = [0.5 + a * 1.5, 0.98 - h], pts = q2([0.5 + a * 0.08, 0.99], [0.5 + a * 0.5, 0.99 - h * 0.75], tip, 12);
          pen(pts, 3, 0.9, 0.95);
          if (b % 2 === heads) for (let k = 0; k < 14; k++) { const o = pts[7 + (k % 5)], sd = k % 2 ? 1 : -1; lens(o, [o[0] + sd * 0.028 + a * 0.03, o[1] - 0.03], 0.007, 0.75, 0); } } };
      const leaf = (hw, veins, film, net) => { const a = [0.5, 0.97], b = [0.52, 0.04];
        lens(a, b, hw, film, 0); const dx = b[0] - a[0], dy = b[1] - a[1];
        for (let j = 0; j < veins; j++) { const t = 0.14 + 0.78 * (j + 0.5) / veins, w = hw * 1.9 * Math.sin(Math.PI * t) * 0.92, c = [a[0] + dx * t, a[1] + dy * t];
          for (const sd of [-1, 1]) { const rise = 0.15 * (1 - 0.6 * t) + 0.02, e = [c[0] + sd * w, c[1] - rise], vn = q2(c, [c[0] + sd * w * 0.62, c[1] - rise * 0.25], e, 8); pen(vn, 1.5, 0.6, 0.85);
            // (the veinlets between two side veins wander: no two alike, so they make a net and never a ladder)
            if (net) for (let k = 0; k < 4; k++) { const o = vn[1 + pRng.int(0, 5)], l = (0.78 / veins) * pRng.range(0.5, 1.1), a2 = pRng.range(-0.9, 0.9);
              pen(q2(o, [o[0] + sd * l * 0.3 * Math.sin(a2), o[1] + l * 0.5], [o[0] + sd * l * 0.5 * Math.sin(a2 + 0.6), o[1] + l], 4), 0.8, 0.6, 0.5); } } }
        pen([a, b], 3.2, 1, 1);
        ink(0.8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(a[0]), Y(a[1])); g.quadraticCurveTo(X(0.51 + hw * 2), Y(0.5), X(b[0]), Y(b[1])); g.quadraticCurveTo(X(0.51 - hw * 2), Y(0.5), X(a[0]), Y(a[1])); g.stroke(); };
      const feather = (bend) => { const S = q2([0.5 - bend, 0.99], [0.5 + bend * 0.4, 0.5], [0.5 + bend, 0.03], 60), gap1 = pRng.int(18, 30), gap2 = pRng.int(36, 48);
        for (let i = 9; i < 60; i++) { if (i === gap1 || i === gap2) continue; const c = S[i], n = S[Math.min(60, i + 1)], tx = n[0] - c[0], ty = n[1] - c[1], tl = Math.hypot(tx, ty) || 1, t = i / 60, len = 0.17 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.55) + 0.01;
          for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const o = [c[0] + tx * k / 3, c[1] + ty * k / 3], l2 = len * (sd > 0 ? 1 : 0.72);
            pen([o, [o[0] + (-ty / tl * sd * 0.8 + tx / tl * 0.62) * l2, o[1] + (tx / tl * sd * 0.8 + ty / tl * 0.62) * l2]], 1.1, 0.6, 0.62); } }
        pen(S, 3.4, 0.8, 1); };
      const umbel = (rays, spread) => { const hub = [0.5, 0.56]; pen(q2([0.46, 0.99], [0.47, 0.75], hub, 8), 4.5, 3, 1);
        for (let r = 0; r < rays; r++) { const an = (r / (rays - 1) - 0.5) * spread, L = 0.34 * (0.85 + 0.15 * Math.cos(an * 2.2)), tip = [hub[0] + Math.sin(an) * L, hub[1] - Math.cos(an) * L];
          pen([hub, tip], 2, 1.2, 0.95);
          for (let k = 0; k < 9; k++) { const a2 = an + (k / 8 - 0.5) * 2.6, e = [tip[0] + Math.sin(a2) * 0.05, tip[1] - Math.cos(a2) * 0.05]; pen([tip, e], 0.9, 0.7, 0.8); dot(e[0], e[1], 2.6, 0.9); } } };
      const seeds = () => { for (let k = 0; k < 4; k++) { const c = [0.24 + 0.52 * (k % 2) + pRng.range(-0.05, 0.05), 0.27 + 0.48 * (k >> 1) + pRng.range(-0.05, 0.05)], an = pRng.range(0, TAU), L = pRng.range(0.2, 0.26);
          const b = [c[0] - Math.sin(an) * L, c[1] + Math.cos(an) * L]; pen([c, b], 1.3, 1.3, 0.95); lens(b, [b[0] - Math.sin(an) * 0.06, b[1] + Math.cos(an) * 0.06], 0.012, 0.95, 0);
          for (let j = 0; j < 20; j++) { const a2 = an + Math.PI + (j / 19 - 0.5) * 3.7, l2 = 0.15 * pRng.range(0.85, 1.05); pen([c, [c[0] - Math.sin(a2) * l2, c[1] + Math.cos(a2) * l2]], 1, 0.6, 0.85); } } };
      const quaking = () => { for (let s = 0; s < 4; s++) { const bx = 0.3 + s * 0.13, top = [0.2 + s * 0.2 + pRng.range(-0.05, 0.05), pRng.range(0.05, 0.2)], st = q2([bx, 0.99], [bx - 0.04, 0.5], top, 14); pen(st, 2.2, 0.8, 0.95);
          for (let k = 0; k < 7; k++) { const o = st[6 + k], sd = k % 2 ? 1 : -1, e = [o[0] + sd * pRng.range(0.06, 0.13), o[1] + pRng.range(0.02, 0.07)]; pen(q2(o, [e[0], o[1] - 0.02], e, 5), 0.8, 0.6, 0.8);
            lens(e, [e[0] + sd * 0.01, e[1] + 0.06], 0.018, 0.5, 0); for (let r = 1; r < 5; r++) pen([[e[0] - 0.02, e[1] + r * 0.012], [e[0] + 0.02 + sd * 0.004, e[1] + r * 0.012 + 0.004]], 0.9, 0.9, 0.9); } } };
      const honesty = () => { const st = q2([0.5, 0.99], [0.44, 0.55], [0.52, 0.08], 12); pen(st, 3.2, 1.2, 1);
        for (let k = 0; k < 7; k++) { const o = st[3 + k], sd = k % 2 ? 1 : -1, c = [o[0] + sd * pRng.range(0.2, 0.3), o[1] - pRng.range(0.02, 0.1)], r = pRng.range(0.085, 0.12);
          pen(q2(o, [(o[0] + c[0]) / 2, o[1] - 0.05], [c[0] - sd * r * 0.9, c[1]], 6), 1.2, 0.8, 0.9);
          ink(0.3); g.globalCompositeOperation = 'lighten'; g.beginPath(); g.ellipse(X(c[0]), Y(c[1]), r * 0.9 * CS, r * 0.72 * 0.9 * CS, sd * 0.4, 0, TAU); g.fill();
          ink(0.95); g.lineWidth = 1.8; g.beginPath(); g.ellipse(X(c[0]), Y(c[1]), r * 0.9 * CS, r * 0.72 * 0.9 * CS, sd * 0.4, 0, TAU); g.stroke();
          for (let j = 0; j < 3; j++) dot(c[0] + Math.cos(j * 2.1 + k) * r * 0.42, c[1] + Math.sin(j * 2.1 + k) * r * 0.3, 4.5, 0.95); } };
      const moth = () => { const c = [0.5, 0.52];
        for (const sd of [-1, 1]) { const f = [c[0] + sd * 0.44, c[1] - 0.2], h = [c[0] + sd * 0.3, c[1] + 0.3];
          lens([c[0], c[1] - 0.06], f, 0.1, 0.28, 0); lens([c[0], c[1] + 0.03], h, 0.085, 0.24, 0);
          for (let k = 0; k < 7; k++) { const t = k / 6; pen(q2([c[0], c[1] - 0.05], [c[0] + sd * 0.2, c[1] - 0.2 + t * 0.2], [f[0] - sd * 0.02 * k, f[1] + t * 0.2 - 0.02], 6), 1.1, 0.6, 0.85);
            if (k < 5) pen(q2([c[0], c[1] + 0.04], [c[0] + sd * 0.12, c[1] + 0.1 + t * 0.1], [h[0] - sd * 0.05 * k, h[1] - 0.04 * k], 6), 1, 0.6, 0.8); }
          pen(q2([c[0], c[1] - 0.14], [c[0] + sd * 0.05, c[1] - 0.3], [c[0] + sd * 0.14, c[1] - 0.4], 6), 1, 0.7, 0.9); }
        pen([[c[0], c[1] - 0.15], [c[0], c[1] + 0.2]], 9, 5, 1); };
      const CELLS = [() => frond(24, 0.05, 0.2), () => frond(30, -0.1, 0.16), () => frond(18, 0.16, 0.24), () => grass(9, 0), () => grass(6, 1),
        () => leaf(0.17, 9, 0.1, true), () => leaf(0.085, 12, 0.13, false), () => feather(0.07), () => feather(-0.12), () => umbel(13, 2.7), () => umbel(9, 2.0),
        seeds, quaking, () => leaf(0.2, 11, 0.07, true), honesty, moth];
      for (let i = 0; i < 16; i++) { ox = (i % 4) * CS; oy = (i >> 2) * CS; CELLS[i](); await ctx.yield(); }
      g.globalCompositeOperation = 'source-over';
      const atlas = new THREE.CanvasTexture(cv); atlas.colorSpace = THREE.NoColorSpace; atlas.generateMipmaps = true; atlas.minFilter = THREE.LinearMipmapLinearFilter;
      atlas.flipY = false;      // (no anisotropy: asking the machine for its limit is a synchronous call, a pause; the lookup is biased a little sharper instead)
      await ctx.yield();
      // where they lie: thick under and beside the first fifth of the course (we fly 3 m above them), larger and sparser where
      // we look down from 20 m, and only out in the meadow once the clock's own shadow and the seeds' wakes own the paper
      const WEIGHT = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 7, 8, 9, 9, 10, 11, 12, 12, 13, 14, 15, 1, 2, 4, 8, 10], spots = [];
      // (a specimen we skim over lies so that its fine parts run along our course, never across it: fronds, feathers and leaves
      //  athwart, so their pinnae, barbs and veins point up the course; grasses and umbels with their stems along it)
      const ATHWART = [1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 2, 0, 1, 0, 2];
      // A print is a drawing on quiet blue: no two overlap, the lane under the lens is left clear (only a seed head or a moth,
      // small enough to pass whole), the fernery's prints lie beside the course where they are seen whole, and where the
      // colonnade's shadows own the paper there are hardly any. LINE: the cells that are all line and no film.
      const LINE = [0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 14, 15], SMALL = [11, 15, 11, 12];
      const put = (x, z, size, skim, cells) => { const ryAny = pRng.range(0, TAU), pick = cells || WEIGHT, cell = pick[pRng.int(0, pick.length - 1)], a = pRng.range(0.86, 1), flip = pRng() < 0.5 ? Math.PI : 0, j = pRng.range(-0.38, 0.38);
        for (const o of spots) if (Math.hypot(o.x - x, o.z - z) < (o.s + size) * 0.56) return;
        spots.push({ x, z, s: size, cell, a, ry: !skim || ATHWART[cell] === 2 ? ryAny : ATHWART[cell] === 1 ? Math.PI / 2 + flip + j : flip + j }); };
      const pk = clamp(lush, 0.6, 1.2);
      // the fernery (we skim 3 m above the sheet): rows 12 m apart, one print 7-13 m off the course and one further out on each side
      for (let z = -6; z < 112; z += 12) for (const sd of [-1, 1]) {
        if (pRng() < 0.8 * pk) put(sd * pRng.range(9.5, 13.5) + fernX(z), z + pRng.range(-3.5, 3.5), pRng.range(6.4, 8.4), true, LINE);
        if (pRng() < 0.7 * pk) put(sd * pRng.range(20, 31) + fernX(z), z + pRng.range(-4, 4), pRng.range(8, 11), false, LINE);
        if (pRng() < 0.4 * pk) put(sd * pRng.range(36, 54), z + pRng.range(-4, 4), pRng.range(9, 12)); }
      for (let z = 9, k = 0; z < 112; z += 14, k++) put((k % 2 ? -1 : 1) * pRng.range(3, 4.6) + fernX(z), z + pRng.range(-4, 4), pRng.range(1.7, 2.3), true, SMALL);
      await ctx.yield();
      // the colonnade: a few, well out to the side
      for (let z = 122; z < 204; z += 21) for (const sd of [-1, 1]) if (pRng() < 0.9 * pk) put(sd < 0 ? -pRng.range(13, 24) : pRng.range(30, 44), z + pRng.range(-6, 6), pRng.range(8.5, 12), false, LINE);     // (clear of where the wheels fall)
      // from 20 m up: large and sparse on the open paper beside the long straight
      const nB = Math.round(64 * pk), nC = Math.round(56 * pk);
      for (let i = 0; i < nB; i++) { const z = 206 + (i / nB) * 112 + pRng.range(-5, 5), sd = pRng() < 0.5 ? -1 : 1, dx = 6 + 78 * Math.pow(pRng(), 1.2), x = courseX(z) + sd * dx;
        const size = pRng.range(10, 20); if (i % 40 === 39) await ctx.yield(); if (Math.hypot(x - HERO_AT[0], z - HERO_AT[2]) < 30 || (z > 262 && path.nearestXZ(x, z).dist < 34)) continue; put(x, z, size); }
      await ctx.yield();
      for (let i = 0; i < nC; i++) { const z = pRng.range(250, 430), x = courseX(Math.min(z, exitW.z)) + pRng.range(-120, 120), size = pRng.range(12, 24);
        if (i % 30 === 29) await ctx.yield(); if (path.nearestXZ(x, z).dist < 36 || Math.hypot(x - HERO_AT[0], z - HERO_AT[2]) < 34) continue; put(x, z, size); }
      await ctx.yield();
      // THE SECOND LAYING. More specimens were laid on the paper after the first: small ones close beside the lane all the way
      // up the fernery and the colonnade (one in every 6 m of course on each side, 2 to 5 m across, its centre 4 to 9 m from
      // the lane's centre, its fine parts along the course), and large ones beside the long straight and on past the way out,
      // none nearer the course's ground track than 22 m and none within 30 m of the clock's foot (the comb's and the globe's
      // own paper). By live's rule no two prints overlap, and these are laid last from a stream of their own, so no old one moves.
      { const p2 = own('prints-second'), tp = new THREE.Vector3(), tt = new THREE.Vector3();
        const put2 = (x, z, size, yaw, cells) => { const ryAny = p2.range(0, TAU), pick = cells || WEIGHT, cell = pick[p2.int(0, pick.length - 1)], a = p2.range(0.86, 1) * (yaw == null ? 1 : 2.1),      // (a small print's strokes are a fraction of a pixel wide from where we see it: it is laid down twice as heavy, so it reads)
          flip = p2() < 0.5 ? Math.PI : 0, j = p2.range(-0.38, 0.38);
          for (const o of spots) if (Math.hypot(o.x - x, o.z - z) < (o.s + size) * 0.56) return false;
          spots.push({ x, z, s: size, cell, a, ry: yaw == null || ATHWART[cell] === 2 ? ryAny : yaw + (ATHWART[cell] === 1 ? Math.PI / 2 : 0) + flip + j }); return true; };
        const dEnd = (TRACK.find((q) => q[1] >= Z0) || TRACK[TRACK.length - 1])[2];
        for (let d = 1; d < dEnd; d += 6) for (const sd of [-1, 1]) for (let tr = 0; tr < 4; tr++) {      // (where an old print lies in the way it is laid elsewhere in its own 6 m: up to four goes)
          const dd = d + p2.range(0, 6), r1 = p2(), r2 = p2(), size = 5 - 3 * r1 * r1, lo = Math.max(4, size * 0.5 + 2.4), lat = lo + (9 - lo) * r2 * r2;      // (2 to 5 m across, more of them large; 4 to 9 m out, more of them near)
          path.posAtDist(dd, tp); path.tangentAtDist(dd, tt); const tl = Math.hypot(tt.x, tt.z) || 1;
          if (put2(tp.x + sd * tt.z / tl * lat, tp.z - sd * tt.x / tl * lat, size, Math.atan2(tt.x, tt.z), LINE)) break;      // (line specimens only: a film this small and this heavy would be a blot)
        }
        await ctx.yield();
        for (let d = dEnd; d < path.length + 90; d += 8) for (const sd of [-1, 1]) for (const hi of [48, 98]) {
          const dd = d + p2.range(0, 8), size = p2.range(9, 13) + (hi - 48) * 0.1, lat = p2.range(hi === 48 ? 22 + size * 0.5 : 48, hi);
          const dc = Math.min(dd, path.length), over = dd - dc; path.posAtDist(dc, tp); path.tangentAtDist(dc, tt); const tl = Math.hypot(tt.x, tt.z) || 1;
          const x = tp.x + tt.x / tl * over + sd * tt.z / tl * lat, z = tp.z + tt.z / tl * over - sd * tt.x / tl * lat;
          if (Math.hypot(x - HERO_AT[0], z - HERO_AT[2]) - size * 0.5 < 30 || trackNear(x, z).dist - size * 0.5 < 22) continue;
          put2(x, z, size, null);
        }
      }
      await ctx.yield();
      const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
      const cellA = new Float32Array(spots.length * 3);
      spots.forEach((sp, i) => cellA.set([sp.cell % 4, sp.cell >> 2, sp.a], i * 3));
      pg.setAttribute('aCell', new THREE.InstancedBufferAttribute(cellA, 3));
      const printMat = new THREE.ShaderMaterial({ uniforms: { uAtlas: { value: atlas }, uPaper: U.uPaper, uMilk: U.uMilk, uR1: U.uR1, uR2: U.uR2 }, transparent: true, depthWrite: false, depthTest: false,
        vertexShader: /* glsl */`attribute vec3 aCell; varying vec2 vUv; varying vec3 vWp; varying float vA;
          void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.); vWp = wp.xyz; vA = aCell.z;
            vUv = (aCell.xy + mix(vec2(0.012), vec2(0.988), uv)) * 0.25; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform sampler2D uAtlas; uniform vec3 uPaper, uMilk; varying vec2 vUv; varying vec3 vWp; varying float vA;
          ${style.glsl.noise}${style.glsl.front}
          void main(){ float t = texture2D(uAtlas, vUv, -1.1).r; float d = length(cameraPosition - vWp);
            float dev = mix(0.72, 1., smoothstep(-1., 2.5, sp_front(uR1, vWp.xz)));       // it comes up in the water
            float a = min(t * vA * dev, 1.) * (1. - smoothstep(190., 300., d));
            gl_FragColor = vec4(mix(uMilk, uPaper * (1. + 0.6 * smoothstep(0.8, 1., a)), smoothstep(0.12, 0.5, a)), a); }` });
      const prints = new THREE.InstancedMesh(pg, printMat, spots.length);
      spots.forEach((sp, i) => { e3.set(0, sp.ry, 0); q4.setFromEuler(e3); s3.set(sp.s, 1, sp.s); m4.compose(p3.set(sp.x, 0.01, sp.z), q4, s3); prints.setMatrixAt(i, m4); });
      prints.frustumCulled = false; prints.renderOrder = -4; scene.add(prints);
    }
    await ctx.yield();
    // ======================================= THE TALL VERGE: great specimens close to the lens, u 0.50-0.72 =
    // Between the colonnade and the clock we cross open air 20 m up. The verge reaches up to us there: a giant umbel, a
    // thistle, a reed plume and an arching frond pass within 9-14 m on both sides (tall ones only where they cannot stand
    // between us and the clock), the same three plants stand smaller across the meadow as the middle distance, and the hedge
    // is the far line. All of it is thread and film of the one density, with its white shadow on the paper below.
    {
      const vRng = rng.fork('verge'), REF = 26;
      const umb = [], thi = [], plu = [], balls = [], flo = [];
      // -- the umbel (unit height; widths in metres for a 26 m plant, scaled with the instance in the vertex shader)
      const mainTips = [];
      const umbelAt = (hub, R, rise, nR, wS, rec) => { for (let j = 0; j < nR; j++) { const az = j * 2.399 + vRng.range(-0.2, 0.2), rr = R * (j < nR * 0.3 ? 0.5 : 1) * vRng.range(0.82, 1), h = rise * (1.1 - 0.4 * (rr / R) * (rr / R));
          const tip = [hub[0] + Math.cos(az) * rr, hub[1] + h, hub[2] + Math.sin(az) * rr]; if (rec) rec.push(tip);
          umb.push({ pts: bez(hub, [hub[0] + Math.cos(az) * rr * 0.42, hub[1] + h * 0.66, hub[2] + Math.sin(az) * rr * 0.42], tip, 4), w: 0.24 * wS, w1: 0.13 * wS, a: 0.92, a1: 0.8 });
          for (let k = 0; k < 8; k++) { const a2 = k * 0.785 + j, l = R * 0.17, e = [tip[0] + Math.cos(a2) * l, tip[1] + l * 0.55, tip[2] + Math.sin(a2) * l];
            umb.push({ pts: [tip, e], w: 0.07 * wS, a: 0.72 }); const fh = R * 0.062, tl = ((j * 7 + k * 3) % 5 - 2) * 0.16; flo.push({ c: [e[0], e[1] + 0.002, e[2]], u: [fh, fh * tl, 0], v: [0, fh * tl, fh] }); } } };
      umb.push({ pts: bez([0, 0, 0], [0.085, 0.42, 0.05], [0, 0.8, 0], 8), w: 0.8, w1: 0.42, a: 0.96 });
      umbelAt([0, 0.8, 0], 0.27, 0.2, 14, 1, mainTips);
      for (const sd of [-1, 1]) { const o = [0.012 * sd, 0.42, 0], e = [0.21 * sd, 0.66, 0.07 * sd]; umb.push({ pts: bez(o, [0.12 * sd, 0.5, 0.03 * sd], e, 5), w: 0.36, w1: 0.2, a: 0.9 }); umbelAt(e, 0.12, 0.09, 8, 0.7); }
      await ctx.yield();
      // -- the thistle: a spined stem, a head with its brush of down, two side heads
      const thistleHead = (c, r, wS) => { balls.push({ c, r });
        for (let j = 0; j < 46; j++) { const az = j * 2.399, el = 0.5 + 1.0 * ((j * 0.618) % 1), l = r * vRng.range(1.5, 2.1), d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
          thi.push({ pts: [[c[0] + d[0] * r * 0.5, c[1] + r * 0.6, c[2] + d[2] * r * 0.5], [c[0] + d[0] * l, c[1] + r * 0.6 + d[1] * l, c[2] + d[2] * l]], w: 0.07 * wS, w1: 0.04 * wS, a: 0.75, a1: 0.4 }); }
        for (let j = 0; j < 34; j++) { const y = 0.7 - (j / 34) * 1.6, rr = Math.sqrt(Math.max(0, 1 - y * y)), az = j * 2.399, d = [Math.cos(az) * rr, y, Math.sin(az) * rr];
          thi.push({ pts: [[c[0] + d[0] * r * 0.9, c[1] + d[1] * r * 0.9, c[2] + d[2] * r * 0.9], [c[0] + d[0] * r * 1.55, c[1] + d[1] * r * 1.55 + r * 0.2, c[2] + d[2] * r * 1.55]], w: 0.16 * wS, w1: 0.03 * wS, a: 0.85, a1: 0.5 }); } };
      const stemT = bez([0, 0, 0], [-0.09, 0.5, 0.06], [0, 0.86, 0], 10); thi.push({ pts: stemT, w: 0.62, w1: 0.34, a: 0.96 });
      thistleHead([0, 0.9, 0], 0.045, 1);
      for (let k = 0; k < 6; k++) { const o = stemT[1 + k], az = k * 2.2, l = 0.2 - k * 0.02, c = Math.cos(az), sn = Math.sin(az), mid = bez(o, [o[0] + c * l * 0.6, o[1] + l * 0.3, o[2] + sn * l * 0.6], [o[0] + c * l, o[1] - l * 0.12, o[2] + sn * l], 6);
        thi.push({ pts: mid, w: 0.3, w1: 0.05, a: 0.85, a1: 0.6 });
        for (let j = 1; j < 6; j++) for (const sd of [-1, 1]) { const q = mid[j], sl = l * 0.2 * (1 - j / 8); thi.push({ pts: [q, [q[0] - sn * sd * sl + c * sl * 0.4, q[1] + sl * 0.25, q[2] + c * sd * sl + sn * sl * 0.4]], w: 0.16, w1: 0.02, a: 0.75, a1: 0.4 }); } }
      for (const sd of [-1, 1]) { const o = stemT[6], e = [0.13 * sd, 0.74, -0.05 * sd]; thi.push({ pts: bez(o, [0.08 * sd, 0.6, 0], e, 5), w: 0.3, w1: 0.2, a: 0.9 }); thistleHead([e[0], e[1] + 0.03, e[2]], 0.03, 0.8); }
      await ctx.yield();
      // -- the reed plume: an arching culm, a drooping panicle of dabs, two long blades
      { const culm = bez([0, 0, 0], [-0.12, 0.62, 0.06], [0.2, 0.96, 0.03], 14); plu.push({ pts: culm, w: 0.4, w1: 0.1, a: 0.95, a1: 0.8 });
        for (let j = 0; j < 44; j++) { const o = culm[8 + (j % 7)], az = j * 2.399, l = 0.05 + 0.07 * (1 - (j % 7) / 7), e = [o[0] + Math.cos(az) * l, o[1] - l * vRng.range(0.2, 0.9), o[2] + Math.sin(az) * l];
          plu.push({ pts: bez(o, [(o[0] + e[0]) / 2, o[1] + l * 0.3, (o[2] + e[2]) / 2], e, 3), w: 0.07, a: 0.7 }, { pts: [e, [e[0], e[1] - 0.011, e[2]]], w: 0.06, w1: 0.3, a: 0.7, a1: 0.6 }, { pts: [[e[0], e[1] - 0.011, e[2]], [e[0], e[1] - 0.034, e[2]]], w: 0.3, w1: 0.04, a: 0.6, a1: 0.5 }); }
        for (let k = 0; k < 3; k++) { const o = culm[2 + k * 2], az = k * 2.3 + 1, l = 0.34; plu.push({ pts: bez(o, [o[0] + Math.cos(az) * l * 0.5, o[1] + l * 0.75, o[2] + Math.sin(az) * l * 0.5], [o[0] + Math.cos(az) * l, o[1] + l * 0.2, o[2] + Math.sin(az) * l], 8), w: 0.5, w1: 0.05, a: 0.62, a1: 0.5 }); } }
      await ctx.yield();
      // -- where they stand. spot(s, lat): s metres up the course, lat metres to its left (+) or right (-)
      const _vp = new THREE.Vector3(), _vt = new THREE.Vector3();
      const spot = (s, lat) => { if (s > 122) s += EXTRA; path.posAtDist(s, _vp); path.tangentAtDist(s, _vt); const l = Math.hypot(_vt.x, _vt.z) || 1; return [_vp.x + _vt.z / l * lat, 0, _vp.z - _vt.x / l * lat, Math.atan2(_vt.x, _vt.z)]; };
      const L = { u: [], t: [], p: [], f: [] };
      const stand = (kind, s, lat, h, ry) => { const q = spot(s, lat); L[kind].push({ p: [q[0], 0, q[2]], ry: ry ?? vRng.range(0, TAU), s: h, rz: vRng.range(-0.09, 0.09) }); return q; };
      // left of the course (the ring is ahead, the pods beyond it): tall all the way to where the shed begins
      stand('u', 236, 19, 30); stand('t', 254, 9.5, 28.5); stand('p', 266, 12, 25); stand('u', 281, 11.5, 26); stand('t', 293, 13, 24); stand('p', 224, 13, 27);
      stand('u', 303, 14.5, 27); stand('p', 314, 17, 24); stand('t', 325, 15.5, 26);     // (ahead on the left through the reveal; all are out of the picture before the shed)
      // right of it: tall only through the swing (they are behind us before the clock stands clear), then low plumes under the globe
      stand('t', 210, -10.5, 29); stand('u', 226, -19.5, 31); stand('p', 244, -10, 26); stand('p', 259, -9.5, 13.5); stand('p', 274, -11, 12.5); stand('t', 287, -12, 12); stand('u', 266, -8.5, 14.5); stand('p', 281, -9, 15);
      // THE FIRST QUARTER'S SPECIMENS (round 5). Each of the first pictures has ONE great plant standing whole in the lane itself,
      // where the meander puts it near our line of travel, with nothing between it and us and its white shadow written large on
      // the lane beside it: a wide umbel on the entry axis (we bend left round it), then a thistle on the outside of the next
      // bend (we bend right round it). The gaze rests on each as we come up to it (pois, see the return). Lesser plants stand
      // back among the croziers; the great frond on the left is seen face-on from the entry and is behind us by the umbel.
      const near = (kind, s, lat, h, yaw) => { const q = spot(s, lat); L[kind].push({ p: [q[0], 0, q[2]], ry: q[3] + yaw, s: h, rz: (lat > 0 ? -1 : 1) * 0.05 }); };       // (no draw from the rng here: the meadow beyond keeps its layout)
      const SPEC_U = { p: [-1.5, 0, 52.5], ry: 0.15, s: 16.3, sx: 1.3, sz: 1.3, rz: 0.03 }, SPEC_T = { p: [6.8, 0, 77], ry: -0.25, s: 13.5, sx: 1.12, sz: 1.12, rz: -0.03 };
      L.u.push(SPEC_U); L.t.push(SPEC_T);
      near('p', 43, 9.4, 8.5, 2.2); near('p', 93, -9, 13, -0.9); near('u', 70, 15, 9, 1.2);
      near('u', 112, 6.8, 10.8, -0.3); near('t', 106, -13, 9, 2.0);
      const nearF = [[115, -9.8, 15, Math.PI - 0.4, -0.1]];
      L.n = nearF.map(([s, lat, sz, yaw, rx]) => { const q = spot(s, lat); return { p: [q[0], 0, q[2]], ry: q[3] + yaw, rx, s: sz }; });
      L.n.push({ p: [-18, 0, 70], ry: Math.PI - 0.5, rx: 0.2, s: 16 }, { p: [25, 0, 63], ry: Math.PI + 0.43, rx: 0.1, s: 19 });       // (both stand back among the ferns and lean toward the entry: seen whole and face-on from afar, never cut by an edge)
      // arching fronds: rooted beside the course, bowed over it (the nearest pinnae hang a few metres above the lens)
      for (const [s, lat, sz] of [[216, 12, 38], [247, -12.5, 36], [271, 12.5, 40]]) { const q = spot(s, lat); L.f.push({ p: [q[0], 0, q[2]], ry: q[3] + (lat > 0 ? -1 : 1) * 1.25, rx: -0.3, s: sz }); }
      // the middle distance: the same plants, a third to two thirds the size, 24-110 m out, on both sides from the colonnade on
      const nM = Math.round(66 * clamp(lush, 0.6, 1.2));
      for (let i = 0; i < nM; i++) { const s = 175 + (i / nM) * 200 + vRng.range(-6, 6), lat = (i % 2 ? 1 : -1) * (24 + 86 * Math.pow(vRng(), 1.4)), h = vRng.range(8, 17), kind = 'utp'[i % 3], q = spot(Math.min(s, path.length - 1), lat);
        if (Math.hypot(q[0] - HERO_AT[0], q[2] - HERO_AT[2]) < 34 || Math.hypot(q[0] - exitW.x, q[2] - exitW.z) < 44 || path.nearestXZ(q[0], q[2]).dist < 22) continue;
        L[kind].push({ p: [q[0], 0, q[2]], ry: vRng.range(0, TAU), s: h, rz: vRng.range(-0.05, 0.05) }); }
      // (distance thins: beyond `uThin` metres a plant drops its rays, pedicels, spines and florets and keeps its main stems. While we are
      //  in the colonnade (u 0.42-0.535) that is 34-56 m, so the view out through the last stems is blue with a few hairs; it is 150 m before and by the reveal)
      const thinU = { uThin: { value: 150 } };
      scripted.push((dt, time, u) => { thinU.uThin.value = lerp(150, 34, smoothstep(0.3, 0.42, u) * (1 - smoothstep(0.535, 0.63, u))); });
      const THIN = `{ float th_d = length(cameraPosition - pos); alp *= mix(1., 1. - smoothstep(uThin, uThin * 1.65, th_d), TFINE); }`;
      const VW = `{ float th_w = wid; wid *= max(length(instanceMatrix[1].xyz) / ${REF}., 0.8 * step(instanceMatrix[3].z, 118.)); ` + THIN.replace('TFINE', '(1. - smoothstep(0.22, 0.32, th_w))') + ' }', sw = SWAY.replace('0.012', '0.007'), swS = SWAY.replace('0.012', '0.002');
      const NOD = /* glsl */`{ vec3 vo = instanceMatrix[3].xyz; float vh = length(instanceMatrix[1].xyz); float vy = clamp((pos.y - vo.y) / vh, 0., 1.);
        pos.xz += (pos.xz - vo.xz) * 0.035 * vy * sin(uTime * 0.8 + vo.x * 0.4 + vo.z * 0.3); }`;
      for (const [lines, list] of [[umb, L.u], [thi, L.t], [plu, L.p]]) { const m = instanced(style.threads(lines), { kind: 'thread', pre: 'uniform float uThin;', uniforms: thinU, move: VW + NOD + sw }, list); shadowOf(m, { den: 0.55, wk: 1.6, move: NOD + swS }); await ctx.yield(); }
      const VFLORET = /* glsl */`{ vec2 q = (vUv - .5) * 2.; float r = length(q); float an = (r < 1e-4) ? 0. : atan(q.y, q.x);
        float pet = 0.62 + 0.38 * abs(cos(an * 2.5)); a *= 1. - smoothstep(pet - 0.12, pet, r); pat = (1. - smoothstep(0.1, 0.26, r)) * 0.85; }`;
      await ctx.yield();
      instanced(style.cards(flo), { kind: 'card', alpha: 0.3 * P.film, pattern: VFLORET, small: true, pre: 'uniform float uThin;', uniforms: thinU, move: NOD + sw + THIN.replace('TFINE', '1.') }, L.u);
      // a pinna seen this close has its drawing: midrib, oblique veinlets, a rim
      const PINNA_BIG = /* glsl */`{ float x = abs(vUv.x - .5) * 2.; float fx = fwidth(x) + 1e-4; float lens = max(sin(vUv.y * 3.14159), 0.02);
        float outl = 1. - smoothstep(0.8, 1., x / lens); float rib = 1. - smoothstep(0.04, 0.04 + fx * 1.5, x);
        float xl = x / lens; float fl = fwidth(xl) + 1e-4;                       // (its veins run with the blade, like the rim: nothing crosses it)
        float veins = (1. - smoothstep(0.03, 0.03 + fl * 1.5, abs(xl - 0.4))) * 0.55 * smoothstep(0.1, 0.3, lens);
        float rim = smoothstep(0.6, 0.78, xl) * 0.55;
        pat = max(max(rib, veins), rim) * outl; a *= outl; }`;
      await ctx.yield();
      const bg = mergeGeometries(balls.map((b) => { const sg = new THREE.SphereGeometry(b.r, 14, 10); sg.translate(b.c[0], b.c[1], b.c[2]); return sg; }));
      shadowOf(instanced(bg, { kind: 'solid', k: 1.4, move: NOD + sw }, L.t), { den: 0.85, move: NOD + swS });
      await ctx.yield();
      // The two specimens' own writing on the lane: ONE firm bar from the foot and, where the head's shadow falls, a wheel of
      // separate round dabs on thin spokes (the umbel) or three spiky burrs (the thistle). Crisp and whole: these are near things
      // standing on the paper we skim. Built in world space from the same unit plants, two draws into E.
      {
        const SL = [], SC = [], mat = new THREE.Matrix4(), w3 = new THREE.Vector3();
        const tf = (q) => { w3.set(q[0], q[1], q[2]).applyMatrix4(mat); return [w3.x, w3.y, w3.z]; };
        const setM = (sp) => { e3.set(0, sp.ry, sp.rz, 'YXZ'); q4.setFromEuler(e3); s3.set(sp.s * sp.sx, sp.s, sp.s * sp.sz); mat.compose(p3.fromArray(sp.p), q4, s3); };
        setM(SPEC_U);
        SL.push({ pts: bez([0, 0, 0], [0.085, 0.42, 0.05], [0, 0.8, 0], 8).map(tf), w: 0.85, a: 1 });
        const hub = tf([0, 0.8, 0]);
        for (const t of mainTips) { const e = tf(t); for (let k = 0; k < 3; k++) e[k] = hub[k] + (e[k] - hub[k]) * (k === 1 ? 1 : 1.45); SL.push({ pts: [hub, e], w: 0.22, a: 0.62 }); SC.push({ c: e, u: [1.35, 0, 0], v: [0, 0, 1.35] }); }
        setM(SPEC_T);
        SL.push({ pts: stemT.map(tf), w: 0.7, a: 1 });
        for (const [c, r] of [[[0, 0.9, 0], 0.045], [[0.13, 0.77, -0.05], 0.03], [[-0.13, 0.77, 0.05], 0.03]]) { const e = tf(c), R = r * SPEC_T.s;
          SC.push({ c: e, u: [R * 1.7, 0, 0], v: [0, 0, R * 1.7] });
          for (let j = 0; j < 15; j++) { const a = (j / 15) * TAU + 0.2, l = R * (j % 2 ? 4.2 : 3.1), ca = Math.cos(a), sa = Math.sin(a);
            SL.push({ pts: [[e[0] + ca * R * 0.8, e[1], e[2] + sa * R * 0.8], [e[0] + ca * l, e[1], e[2] + sa * l]], w: 0.24, w1: 0.06, a: 0.95, a1: 0.8 }); } }
        shadowOf(new THREE.Mesh(style.threads(SL)), { den: 1, wk: 1 });
        const dab = new THREE.Mesh(style.cards(SC), style.shadow({ soft: 0.2, pattern: '{ float r = length(vUv - .5) * 2.; den = 0.97 * (1. - smoothstep(0.72, 0.92, r)); }' }));
        dab.matrixAutoUpdate = false; style.exposure.add(dab);
      }
      const fk = frondKinds[0], fmv = SWAY.replace('0.012', '0.005') + BREATHE;
      const archLeaf = instanced(fk.leaf, { kind: 'card', alpha: (season === 'autumn' ? 0.04 : 0.13) * P.film, pattern: PINNA_BIG, pre: 'uniform float uThin;', uniforms: thinU, move: fmv + THIN.replace('TFINE', '1.') }, L.f), archRach = instanced(fk.rachis, { kind: 'thread', move: fmv + '{ wid *= 1.6; }' }, L.f);
      shadowOf(archLeaf, { pattern: LEAF_SH.replace('DEN', '0.3'), move: BREATHE }); shadowOf(archRach, { den: 0.9, move: BREATHE });
      await ctx.yield();
      // the fernery's own great fronds face us, so each pinna is seen whole: a broad milky blade (seventeen pairs, not thirty
      // slivers) with its midrib, veins and rim printed white
      const nk = frondGeo(17, 1.35); await ctx.yield();
      const nearLeaf = instanced(nk.leaf, { kind: 'card', alpha: (season === 'autumn' ? 0.07 : 0.27) * P.film, pattern: PINNA_BIG, move: fmv }, L.n), nearRach = instanced(nk.rachis, { kind: 'thread', move: fmv + '{ wid *= 1.25; }' }, L.n);
      await ctx.yield();
      shadowOf(nearLeaf, { pattern: LEAF_SH.replace('DEN', '0.34'), move: BREATHE }); shadowOf(nearRach, { den: 0.9, move: BREATHE });
    }
    await ctx.yield();
    //@@NEXT
    // ---- the frame loop ---------------------------------------------------------------------------------------
    const _c = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3();
    const baseWake = P.wake, R2K = (0.5 * heartW.x - 0.86 * heartW.z + 520) / (0.175 * 1506);   // the front reaches the clock at u 0.625
    let lastU = 0, lastTime = 0, primed = false, cloudOut = 0;
    function drive(u, time) {
      // (uExpose, uSensW and uSensAt are still driven, but the paper no longer draws any sensitiser: see sp_paper)
      U.uExpose.value = lerp(0.72, 1, smoothstep(0, 0.1, u));
      U.uSensW.value.set(lerp(10.5, 3.5, smoothstep(0.07, 0.2, u)), lerp(9, 3, smoothstep(0.1, 0.22, u)));     // the band shrinks as the lip runs on
      // rinse one is under us at the entry and runs on ahead
      // (it runs a little ahead of us for the first eight seconds, so the water's edge is in the picture: a broken white line,
      //  the coat a breath paler beyond it; then it pulls away, as before from u 0.2)
      style.rinse(1, 0, 1, u < 0.02 ? 22 + u * 100 : u < 0.08 ? 24 + (u - 0.02) * 383 : u < 0.16 ? 47 + (u - 0.08) * 425 : u < 0.2 ? 81 + (u - 0.16) * 475 : 100 + (u - 0.2) * 1143);
      // rinse two comes in from the left front and crosses the clock at 25 s; the sky's arc goes with it
      style.rinse(2, 0.5, -0.86, -520 + Math.max(0, u - 0.45) * 1506 * R2K);
      U.uSkyRinse.value = hour === 'dawn' ? 0 : 0.44 * smoothstep(0.47, 0.63, u) + 0.05 * smoothstep(0.63, 0.72, u) + 0.51 * smoothstep(0.725, 0.81, u);       // (it climbs from our right; from u 0.63 to 0.72 its edge stands across the upper left of the sky, first blue above it)
      hero.setShed((u - 0.67) * 40);           // first seed lets go at u 0.67, sixty are loose by 0.775 and all by 0.805: all of it ahead of us, in frame
      // the comb: each seed's line sinks in `wake` seconds; what is written under the cloud (rare) stays whole, from the globe's
      // shadow to under the ring, until the light returns at u 0.78, and then all of it sinks together in a second and a third
      { const cb = hero.comb, shed = (u - 0.67) * 40, held = rare && u > 0.645 ? 1 - smoothstep(0.78, 0.8125, u) : 0;
        cb.uWake.value = baseWake; cb.uCloud.value.set(rare && u > 0.78 ? 4.4 : 1e4, held); cb.uSpan.value = held > 0 ? Math.max(baseWake, shed + 0.6) : baseWake; }
    }
    function update(dt, time, camera, u) {
      u = clamp(u ?? 0, 0, 1);
      drive(u, time);
      camera.getWorldPosition(_c); flyU.uEye.value.copy(_c);
      // the bare margin of the sky must not pass behind the white globe: open a gap in it there
      const hx = heartW.x - _c.x, hz = heartW.z - _c.z, hd = Math.hypot(hx, hz);
      // (a globe-width clear either side of the heart; from the reveal on the gap runs on from the heart to the ring, so the
      //  globe, the seed stream and the ring have nothing at their own value behind them. The hedge thins in the same sector.)
      { const azH = Math.atan2(hx, hz), halfH = clamp(Math.atan2(24, Math.max(hd, 1)), 0.1, 0.9), azR = Math.atan2(exitW.x - _c.x, exitW.z - _c.z);
        let dH = azH - azR; dH -= Math.round(dH / TAU) * TAU;
        const k = smoothstep(0.5, 0.6, u), lo = Math.min(dH - halfH, -0.16), hi = Math.max(dH + halfH, 0.16);
        const cen = lerp(dH, (lo + hi) / 2, k), half = lerp(halfH, (hi - lo) / 2, k);
        U.uBand.value.y = Math.atan2(Math.sin(azR + cen), Math.cos(azR + cen)); U.uBand.value.z = clamp(half / 0.75, 0.1, 1.5); hedgeU.uHedge.value = k; }
      for (const f of scripted) f(dt, time, u, camera);
      // the rare event, the cloud: the unseen light is covered from 26 s for five seconds; nothing prints back
      if (rare) {
        const cl = smoothstep(0.645, 0.655, u) * (1 - smoothstep(0.775, 0.78, u));
        style.exposure.hold = cl;
        if (cl > 0.5) cloudOut = 1.3; else if (cloudOut > 0) cloudOut -= dt;
        style.exposure.wake = cloudOut > 0 && cl < 0.5 ? 1 : baseWake;       // the light returns: every ribbon sinks back together
      }
      hero.update(dt, time, camera);
      for (const s of shadows) { const src = s.userData.src; s.matrix.copy(src.matrixWorld); s.matrixWorld.copy(src.matrixWorld); }
      if (!primed || Math.abs(u - lastU) > 0.08 || Math.abs(time - lastTime) > 2.5) {
        // first frame, or a jump along the path: write the last few seconds of wakes in one go
        primed = true;
        // (only the movers are drawn into the history: the rooted plants join on the last step, so this stays cheap)
        for (const m of shadows) if (!m.userData.mover) m.visible = false;
        const clouded = rare && style.exposure.hold > 0.5, keepWake = style.exposure.wake;
        if (clouded) style.exposure.wake = Math.max(keepWake, (u - 0.645) * 40 + 1);       // under the cloud the history is as long as the cloud
        style.exposure.preroll(camera, (o) => { const uu = clamp(u + o / 40, 0, 1); drive(uu, time + o); U.uTime.value = time + o;
          if (o === 0) for (const m of shadows) m.visible = true;
          const sg0 = o <= -style.exposure.wake + 1e-3 ? 1e6 : starG[0], sg1 = starG[1];
          for (const f of scripted) f(0, time + o, uu, camera);
          if (o < 0) { starG[0] = sg0; starG[1] = sg1;       // (the star's stroke joins one stamp of its history to the next)
            path.posAtDist(uu * path.length, _d); path.tangentAtDist(uu * path.length, _t); placeStar(_d.x, _d.y, _d.z, _t.x, _t.z, uu * path.length); }   // our own star, where we were then
          for (const m of shadows) if (m.userData.mover) { const src = m.userData.src; m.matrix.copy(src.matrixWorld); m.matrixWorld.copy(src.matrixWorld); } }, u < 0.004 ? 16 : clouded ? 40 : 30, 6);       // (u 0 is the far view through the portal: fewer copy passes; the stamps between are cheap)
        style.exposure.wake = keepWake;
        drive(u, time);
      }
      lastU = u; lastTime = time;
      style.update(dt, time, camera);
    }
    // the density is see-through and unsorted; draw it after the portal's own glow so a globe in front of the ring stays in front
    hero.object.traverse((o) => { if (o.isMesh) o.renderOrder = o.userData.onPaper ? -3 : 8; });
    for (const m of meshes) if (m.renderOrder === 0) m.renderOrder = 8;
    plume.renderOrder = 9;
    scene.updateMatrixWorld(true);
    await ctx.yield();
    // compile the shadow proxies (they are not in the scene, so the engine cannot do it), a few at a time
    if (ctx.renderer && ctx.renderer.compile) {
      const cc = new THREE.Camera(), kids = style.exposure.scene.children.slice();
      for (const k of kids) { style.exposure.compileInto(() => ctx.renderer.compile(k, cc, style.exposure.scene)); await ctx.yield(); }
      style.exposure.compileCopy(); await ctx.yield();
    }
    await ctx.yield();

    return {
      scene, path, duration: 40, title: P.title,
      camera: { fov: 62, near: 0.25, far: 4200, lookAhead: 24, sway: 0.5, bank: 0.3 },
      pois: [{ at: heartW.clone(), from: 0.52, to: 0.89, weight: 0.6, fade: 0.25 },
        // the first pictures' specimens: the gaze rests on the umbel, then swings the other way onto the thistle (each stands near our line, so the steady camera has them too)
        { at: new THREE.Vector3(-1.5, 9.0, 52.5), from: 0.03, to: 0.125, weight: 0.6, fade: 0.3 },
        { at: new THREE.Vector3(6.8, 7.2, 77), from: 0.12, to: 0.195, weight: 0.6, fade: 0.35 }],
      portal: { shape: 'circle', radius: 7, color: P.pal[3], glow: 0, halo: false, style: 'ring', revealDistance: 300 },   // paper does not glow
      post: { exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 4 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.06, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); style.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
