// THE EMBER MOON, 4.5 billion years ago. Night on an Earth with no ground: a magma ocean under a skin of black
// glass, the young Moon eight degrees wide and still glowing like a coal, and the tide it drags coming at us as a
// swell that tears the crust into rocking plates with thick burning edges.
//
// FRAME   the camera flies from z = 0 toward -Z (the Moon stands in -Z, centre 6 degrees up). "d" below is the
//         distance flown along -Z. The hero gate (src/parts/ember-moon-tide.js) is at d 770, the exit tent's mouth
//         at about d 1430, 12 degrees right of the Moon.
// FLIGHT  a shape in light and scale (polish 3): it opens low (9.5 m) over WHOLE crust, a black mirror carrying the Moon's red
//         road, the fire only a line of rims and fountains under the Moon (u 0 to 0.10); the tide comes in and the floor
//         breaks under us (u 0.14: a 46 m fountain at the right, the Moon at the left); a banked turn to the left and a
//         climb to 34 m (u 0.25 the tipper standing beside a fountain; u 0.34 the gate patch from above); down through the
//         gate (u 0.43); among the standing shards (u 0.52); then a second, higher rise to 50 m over the open sea (u 0.61
//         a 62 m fountain below at the left; u 0.70 the whole burning floor under the Moon, deep red to the horizon, the
//         tent on its black raft below), and down the last 280 m straight into the tent (u 0.79 on), whose cooled
//         undersides are broken rock with the melt's gold showing through the joints.
// POLISH 4 the glass MIRRORS (the Moon's road, a column of gold glitter under each fountain, the stars: uFire, uStars in the part);
//         plates are 6.5 m thick and their edges are walls of fracture blocks with light in the joints; at the top of the
//         second rise (u 0.59 to 0.65) the lens tips down twelve degrees: no sky, no Moon, the sea as a floor of filaments,
//         skin, leads and rafts; then it lifts and the Moon and the tent come in together (u 0.70).
// POLISH 5 (the midpoints): the look-down is one short nod about u 0.61 (the Moon whole in the frame until u 0.567 and again
//         from u 0.653, where the lens has swung to the tent: Moon left, tent right); a shut joint is never drawn thinner
//         than the pixel (no ruled red lines on the dark glass) and plates do not rear before their joints open; one lit
//         thing in the near field of the opening (uVent: a welling under the glass, its sheets outlined in orange); the
//         tent's undersides are rock with light through the joints (the streak lines are gone); meteors fall over the
//         whole sky ahead, slower, and dim before the frame's edge cuts them.
// TIDE    one swell function (SWELL_GLSL in the part): 14 m high, 625 m from foot to crest; its crest stands 580 m ahead at
//         the entry, runs in to 290 m by u 0.16 and creeps on (crestAt). The sea, every plate, the fountains and the
//         camera's height ride it, and how far each plate has opened, reared, flooded or sunk is a function of its
//         distance from the crest, so the breaking is keyed to u and never to the clock. Beyond the crest the sea is open.
// CROWN   beyond the gate, under the Moon, tall shards (crown plates and six scripted ones) stand 44 to 62 m out of the
//         open sea against the Moon's foot from the first frame; each lies down and founders when the camera comes
//         within about 600 m of it (uCamD), so none covers the Moon as we close. Those well to the side of the line
//         stand until we are beside them (u 0.52), and one more stands on the outside of the last turn (u 0.70).
// SEA     in zones: open yellow-white melt where the tide has just torn it, black glass skin cut by gold leads elsewhere,
//         deepening to red toward the horizon. The open melt heaves in four crossing wave trains and is shaded as a melt is: brightest along its own normal,
//         a dark mirror at a glancing angle (the Moon's red road and the horizon's garnet on the backs of the swell);
//         its skin froze in plates a few metres across with the melt in every seam.
// RAFTS   about sixty hand-laid broken rafts either side of (and under) the line over the open sea, each tilted with
//         one burning wall and a strip of glowing underside clear of the melt.
// CAST    the Moon (sky), 300 to 1,000 fitted plates in one mesh (finer within 120 m of the line), the hero's 19,
//         the tent, 14 fountains, meteor ribbons, embers carried with the camera. No lights: every surface is self-lit.
// SEEDS   Moon phase (crescent, half, unlit), crust (black glass, young thin skin in small plates, old ash-dusted
//         thick plates), the tide square on or raking in from the left, clear sky or garnet veils, sparse or steady
//         meteors. Rare (ctx.vary.rare): a body strikes the Moon at u 0.13 and its crust founders into an orange scar.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, buildTent, makeSlabMaterial, makeFountains, SWELL_GLSL, MOON_GLSL } from '../parts/ember-moon-tide.js';

const PALETTE = ['#08070A', '#2A1418', '#8E1F14', '#E8611C', '#FFC65A', '#FFF3D0', '#B9B4C8'];
const SWELL_AMP = 14, SWELL_HALF = 625, GATE_D = 770, TURN = 12 * Math.PI / 180, DEG = Math.PI / 180;
// the tide's crest: it stands 250 m ahead of the entry and creeps toward us, so the crust is already tearing in the first
// frame and the whole breaking (leads, rearing plates, gold) passes under the camera in the first third of the flight
// POLISH 3: the flight has a shape in light. For the first tenth the front still stands 570 m off: under us the crust is whole,
// a black mirror carrying the Moon's red road, the fire only a line of rims and fountains under the Moon; then the tide
// comes in fast (the crest runs 270 m toward us between u 0.03 and 0.15) and the floor breaks under the camera by u 0.12.
const crestAt = (u) => 250 - 80 * u + 330 * (1 - smoothstep(0.0, 0.16, u));
const CROWN_X = 105;                       // the crown under the Moon: half width of its strip (m)
const swellAt = (s) => SWELL_AMP * 0.5 * (1 + Math.cos(Math.PI * clamp(s / SWELL_HALF, -1, 1)));

const NOISE_GLSL = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1.,0.)), f.x), mix(hash21(i+vec2(0.,1.)), hash21(i+vec2(1.,1.)), f.x), f.y); }
float fbm3(vec2 p){ float a = .5, s = 0.; s += a*vnoise(p); p = p*2.03+17.1; a *= .5; s += a*vnoise(p); p = p*2.01+9.7; a *= .5; s += a*vnoise(p); return s / .875; }
`;
// how far the crust has come apart at a place, from its distance s behind (-) or beyond (+) the crest
const STATE_GLSL = /* glsl */`
float crustOpen(float s){ return smoothstep(-330., -200., s); }
float crustGold(float s){ return smoothstep(-200., -60., s); }
`;

export default {
  id: 'ember-moon-tide',
  name: 'The Ember Moon',
  category: 'prehistoric',
  media: ['air', 'open'],
  weirdness: 0.6,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- the seeded look: Moon phase, crust age, the tide's heading, the sky, the fall of debris
    const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng();
    let phase = r1 < 0.5 ? 'crescent' : r1 < 0.78 ? 'half' : 'unlit';
    if (vary.hour === 'golden') phase = 'half'; else if (vary.hour === 'night') phase = 'unlit'; else if (vary.hour === 'dawn') phase = 'crescent';   // the sun never rises here: the hour chooses how much of the Moon it lights
    const crust = r2 < 0.5 ? 'glass' : r2 < 0.76 ? 'young' : 'ash';
    const rake = r3 < 0.42 ? -(0.30 + 0.14 * rng()) : 0;          // the tide rakes in from the left: a diagonal crest
    const veils = r4 < 0.45 ? 0.55 + 0.45 * rng() : 0;
    const meteorGap = (r5 < 0.36 ? 0.5 : 1.45) / density;      // (polish 5) they fall over the whole sky ahead (52 degrees, the frame is 38), so the sparse fall starts one in the frame about every two seconds          // seconds between meteors: a steady fall or a sparse one
    const rare = !!vary.rare;
    const SKY = new THREE.Color(0.008, 0.0065, 0.012);      // violet-black; the grade's shadow tint keeps it from falling to zero
    scene.background = SKY.clone();
    scene.fog = new THREE.FogExp2(col(PALETTE[1], veils > 0 ? 1.35 : 1.15), veils > 0 ? 0.00052 : 0.00044);

    // ---- the hero (the Moon and the gate) and the exit tent
    const hero = await buildHero(ctx, { palette: PALETTE, detail, moonPhase: phase, crust, seaRadius: 0 });      // its plates float on this world's own sea
    hero.object.position.set(0, 0, -GATE_D);
    scene.add(hero.object);
    await ctx.yield();
    const tent = await buildTent(ctx, { hero, palette: PALETTE, detail });
    await ctx.yield();
    const shared = hero.uniforms.shared, moonU = hero.uniforms.moon, SHEEN = 0.8;
    hero.slabMaterial.uniforms.uSheen.value = SHEEN;
    for (const m of [tent.raft.material, tent.slabs[0].material]) m.uniforms.uSheen.value = SHEEN * 0.4;
    tent.raft.material.uniforms.uMirror.value = 0.3;      // the Moon cannot see into the tent
    shared.uSwell.value.set(crestAt(0), SWELL_AMP, SWELL_HALF, rake);

    // ---- the route: straight at the Moon, through the gate on the hero's own line, then 12 degrees right to the tent
    const fly = hero.anchors.flyThrough;
    const lineX = (d) => {                       // the hero's fly-through line, in world x, by distance flown
      const lz = GATE_D - d;                     // hero-local z
      if (lz >= fly[0].z) return 0;
      for (let i = 0; i < fly.length - 1; i++) if (lz <= fly[i].z && lz >= fly[i + 1].z) {
        const f = (fly[i].z - lz) / (fly[i].z - fly[i + 1].z); return 0.6 * lerp(fly[i].x, fly[i + 1].x, f) * smoothstep(240, 200, Math.abs(lz));   // the hero's jog, eased: never more than 4 degrees off the Moon
      }
      return 0;
    };
    // THE FLIGHT LINE, by arc length. It opens low (9.5 m) heading 9 degrees right of the Moon and holds that heading past a
    // 46 m fountain at the right (u 0.16, the Moon at the left of the frame); a banked turn to the left carries the Moon
    // across the frame while we climb (u 0.25, a fountain and the standing tipper at the left); then the hero's own line
    // through the gate; beyond it an S: left toward the standing shards of the crown, a hard banked right across the open
    // sea, and the last 280 m dead straight into the tent, 12 degrees right of the Moon.
    const keyed = (K) => (a) => { if (a <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (a <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], smoothstep(K[i][0], K[i + 1][0], a)); return K[K.length - 1][1]; };
    const h1 = keyed([[0, 9], [100, 9], [200, 12], [262, 8], [335, -10], [430, -12], [500, -3], [545, 0]]);
    const h3 = keyed([[0, 0], [60, -9], [175, -9], [305, 25], [350, 25], [435, 12]]);
    const head1 = (a) => h1(a) * DEG, head3 = (a) => h3(a) * DEG;
    const STEP = 4, D_LINE = GATE_D - 240, D_TURN = GATE_D + 55, L3 = 716;
    let x0 = 0; { let x = 0, d = 0, a = 0; while (d < D_LINE) { const th = head1(a + STEP * 0.5); x += Math.sin(th) * STEP; d += Math.cos(th) * STEP; a += STEP; } x0 = -x; }
    const raw = [];                                  // [x, z, arc]
    let A3 = 0;                                      // arc length at which the last leg (the S over the open sea) begins
    { let x = x0, d = 0, a = 0;
      while (d < D_LINE) { raw.push([x, -d, a]); const th = head1(a + STEP * 0.5); x += Math.sin(th) * STEP; d += Math.cos(th) * STEP; a += STEP; }
      x = lineX(d);
      while (d < D_TURN) { raw.push([x, -d, a]); const nx = lineX(d + STEP); a += Math.hypot(nx - x, STEP); x = nx; d += STEP; }
      A3 = a; let z = -d;
      while (a - A3 < L3) { raw.push([x, z, a]); const th = head3(a - A3 + STEP * 0.5); x += Math.sin(th) * STEP; z -= Math.cos(th) * STEP; a += STEP; }
      raw.push([x, z, a]);
    }
    const ROUTE = raw[raw.length - 1][2], D_END = -raw[raw.length - 1][1];
    // height above the local sea: low over the tearing crust, a climb through the turn to 34 m (the floor's pattern opens
    // out below and the gate stands in it), down to 16 m through the gate, low again among the rafts and into the tent
    const clr = keyed([[0, 9.5], [250, 9.5], [385, 20], [470, 34], [530, 34], [645, 16], [A3 - 20, 16], [A3 + 115, 54], [A3 + 270, 52], [A3 + 440, 13], [A3 + 530, 9.2]]);      // (polish 3) and a second, higher rise over the open sea: the whole burning floor under the Moon, the tent on its raft below
    const clearance = (a) => clr(a);
    const pts = [];
    for (let i = 0; i < raw.length; i++) {
      if (i % 7 !== 0 && i !== raw.length - 1) continue;
      const r = raw[i], u = r[2] / ROUTE;
      pts.push([r[0], clearance(r[2]) + swellAt(-r[1] - crestAt(u) + rake * r[0]), r[1]]);
    }
    // the line's x at a distance d flown along -Z (for "is this near the line" tests while the crust is laid)
    const lineAt = (d) => { let i = clamp(Math.floor(d / STEP), 0, raw.length - 2); while (i < raw.length - 2 && -raw[i + 1][1] < d) i++; while (i > 0 && -raw[i][1] > d) i--;
      const A = raw[i], B = raw[i + 1], f = clamp((d + A[1]) / Math.max(A[1] - B[1], 1e-3), 0, 1); return lerp(A[0], B[0], f); };
    const path = makePath(pts);
    // seat the tent so its portal seat is the end of the path, its mouth toward the arriving camera
    tent.object.rotation.y = -TURN;
    tent.object.updateMatrixWorld(true);
    const seat = tent.anchors.portalSeat.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -TURN);
    tent.object.position.set(path.end.x - seat.x, 0, path.end.z - seat.z);
    scene.add(tent.object);
    const tentC = tent.object.position.clone();
    tent.slabs[0].material.uniforms.uLamp.value.set(path.end.x, path.end.y, path.end.z, 0.08);      // the ring's cool light on the rock round it
    tent.raft.material.uniforms.uLamp.value.set(path.end.x, path.end.y, path.end.z, 0.55);          // and its road of cool glitter on the raft's glass floor
    await ctx.yield();

    // ---- the crust: fitted plates on a jittered grid, some merged into bigger ones, all in one mesh
    const prng = rng.fork('plates'), nz2 = ctx.noise;
    const brng = makeRng(((ctx.seed | 0) * 7919 + 4513) >>> 0);      // the last shard's own dice (not a fork: nothing else's draws move)
    const cell = crust === 'young' ? 33 : crust === 'ash' ? 66 : 54;
    const thick = crust === 'ash' ? 8 : crust === 'young' ? 4.5 : 6.5, TOP = 1.2, BOT = TOP - thick;
    const XW = 297, D0 = -110, D1 = D0 + 36 * (1800 / 33);      // (the rows of the first 1,690 m are laid as they always were)
    const NX = Math.round(2 * XW / cell), NZ = Math.round((D1 - D0) / cell), cw = 2 * XW / NX, cd = (D1 - D0) / NZ;
    const patchC = hero.anchors.patchCentre, PRX = hero.anchors.patchRadiusX, PRZ = hero.anchors.patchRadiusZ;
    const inPatch = (x, z, k) => { const ex = (x - patchC.x) / (PRX * k), ez = (z + GATE_D - patchC.z) / (PRZ * k); return ex * ex + ez * ez; };
    const corners = new Float32Array((NX + 1) * (NZ + 1) * 2), cornerIn = new Uint8Array((NX + 1) * (NZ + 1));
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i, edge = i === 0 || i === NX || j === 0 || j === NZ;
      let x = -XW + i * cw + (edge ? 0 : prng.range(-0.3, 0.3) * cw), z = -(D0 + j * cd) + (edge ? 0 : prng.range(-0.3, 0.3) * cd);
      const e = inPatch(x, z, 0.90);
      if (e < 1) { // inside the hero's patch: pull the corner out onto its rim so our plates close up against the hero's
        cornerIn[k] = 1; const ex = x - patchC.x, ez = z + GATE_D - patchC.z, f = 1 / Math.max(Math.sqrt(e), 0.05);
        x = patchC.x + ex * f; z = -GATE_D + patchC.z + ez * f;
      }
      corners[k * 2] = x; corners[k * 2 + 1] = z;
    }
    // blocks of cells -> plates
    const taken = new Uint8Array(NX * NZ), blocks = [];
    const free = (i, j, w, h) => { if (i + w > NX || j + h > NZ) return false; for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) if (taken[(j + b) * NX + i + a]) return false; return true; };
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      if (taken[j * NX + i]) continue;
      const r = prng(); let w = 1, h = 1;
      if (crust !== 'young') { if (r < 0.15) { w = 2; h = 2; } else if (r < 0.30) w = 2; else if (r < 0.45) h = 2; } else if (r < 0.12) w = 2; else if (r < 0.24) h = 2;
      if (!free(i, j, w, h)) { w = 1; h = 1; }
      for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) taken[(j + b) * NX + i + a] = 1;
      blocks.push([i, j, w, h]);
    }
    const jag = (x, z, out) => {
      out[0] = x + nz2.n2(x * 0.045, z * 0.045) * 4.2 + nz2.n2(x * 0.33 + 40, z * 0.33) * 0.55 + nz2.n2(x * 0.13 + 7, z * 0.13 + 55) * 1.5;      // (polish 4) a middle scale of breakage: a joint lying flat across the frame is a broken line, not a ruled one
      out[1] = z + nz2.n2(x * 0.045 + 90, z * 0.045 + 20) * 4.2 + nz2.n2(x * 0.33, z * 0.33 + 70) * 0.55 + nz2.n2(x * 0.13 + 31, z * 0.13 + 3) * 2.2;
    };
    const tentYawC = Math.cos(TURN), tentYawS = Math.sin(TURN);
    const inTentRaft = (x, z) => { const dx = x - tentC.x, dz = z - tentC.z, lx = dx * tentYawC + dz * tentYawS, lz = -dx * tentYawS + dz * tentYawC + 8; const rz = lz > 0 ? 184 : 138; return (lx / 100) * (lx / 100) + (lz / rz) * (lz / rz) < 1; };      // (polish 3: the raft reaches 46 m further toward the arriving camera)
    const P = [], A = [], N3 = [], C4 = [], K4 = [], IDX = [];
    const tmp = [0, 0];
    let nPlates = 0;
    const cornerOf = (i, j) => (j * (NX + 1) + i);
    for (let bi = 0; bi < blocks.length; bi++) {
      if (bi % 2 === 0) await ctx.yield();
      const [bi0, bj0, bw, bh] = blocks[bi];
      // walk the block's rim corner by corner
      const ring = [];
      for (let a = 0; a < bw; a++) ring.push(cornerOf(bi0 + a, bj0));
      for (let b = 0; b < bh; b++) ring.push(cornerOf(bi0 + bw, bj0 + b));
      for (let a = 0; a < bw; a++) ring.push(cornerOf(bi0 + bw - a, bj0 + bh));
      for (let b = 0; b < bh; b++) ring.push(cornerOf(bi0, bj0 + bh - b));
      let nIn = 0, ccx = 0, ccz = 0;
      for (const c of ring) { nIn += cornerIn[c]; ccx += corners[c * 2]; ccz += corners[c * 2 + 1]; }
      ccx /= ring.length; ccz /= ring.length;
      const kr = prng(), ka = prng(), kb = prng(), kc = prng(), kd = prng(), ke = prng();   // always drawn, so dropping a plate shifts nothing
      if (nIn === ring.length || inTentRaft(ccx, ccz)) continue;
      const pts2 = [];
      for (let e = 0; e < ring.length; e++) {
        const a = ring[e], b = ring[(e + 1) % ring.length];
        const ax = corners[a * 2], az = corners[a * 2 + 1], bx = corners[b * 2], bz = corners[b * 2 + 1], L = Math.hypot(bx - ax, bz - az);
        if (L < 0.5) continue;
        const mx = (ax + bx) * 0.5, md = -(az + bz) * 0.5, near = Math.abs(mx - lineAt(md)) < 120;
        const n = Math.max(1, Math.round(L / (near ? (crust === 'young' ? 3.6 : 3.0) : 9 / detail)));
        const lo = Math.min(a, b) === a;      // walk every shared edge from the same end so both neighbours get the same points
        for (let t = 0; t < n; t++) { const f = lo ? t / n : 1 - (n - t) / n; jag(lo ? ax + (bx - ax) * f : bx + (ax - bx) * (1 - f), lo ? az + (bz - az) * f : bz + (az - bz) * (1 - f), tmp); pts2.push([tmp[0], tmp[1], near ? 1 : 0]); }
      }
      if (pts2.length < 4) continue;
      const cleared = -ccz > GATE_D + 150 && Math.abs(ccx - lineAt(-ccz)) < 190;      // beside the line over the open sea every big plate has gone down: the rafts there are laid by hand below
      addPlate(pts2, ccx, ccz, [kr, ka, kb, kc, cleared ? 0 : kd, ke], nIn > 0 ? 0.12 : 0);   // rim plates sit a little low, so the hero's plates win the overlap
      nPlates++;
    }
    // six scripted shards of the crown, whatever the crust's grain: they lie hidden just under the skin beyond the gate,
    // spaced across the Moon's width, and rear with the crown plates so that three or four always bite the disc's foot
    for (let ci = 0; ci < 6; ci++) {
      const k1 = ci % 2 ? 0.58 + 0.3 * prng() : 0.08 + 0.3 * prng(), a0 = k1 < 0.5 ? -(0.22 + 1.7 * k1) : Math.PI + 0.22 + 1.7 * (k1 - 0.5);
      const sj = prng.range(-6, 6), sd = GATE_D + 215 + ((ci * 3) % 5) * 26 + prng.range(-8, 8), sx = lineAt(sd) + (ci % 2 ? 1 : -1) * (54 + 13 * (ci >> 1)) + sj;      // either side of the line, well clear of it
      const hl = prng.range(24, 30), hw = prng.range(15, 20), ca = Math.cos(a0), sa = Math.sin(a0), cor = [];
      for (let i = 0; i < 6; i++) { const t = (i + prng.range(-0.3, 0.3)) / 6 * 6.2832, rr = prng.range(0.78, 1.15), lx = Math.cos(t) * hl * rr, lz = Math.sin(t) * hw * rr; cor.push([sx + lx * ca - lz * sa, -sd + lx * sa + lz * ca]); }
      const pts3 = [];
      for (let e = 0; e < 6; e++) { const a = cor[e], b = cor[(e + 1) % 6], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
        for (let t = 0; t < n; t++) { jag(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n, tmp); pts3.push([tmp[0], tmp[1], 1]); } }
      addPlate(pts3, sx, -sd, [prng(), k1, 0.5, 0.75 + 0.25 * prng(), 0, prng()], 0.3);
      nPlates++;
      if (ci % 2) await ctx.yield();
    }
    // THE LAST SHARD: one tall plate standing on the outside of the final right-hand turn, leaning toward the line so its
    // burning cracked underside faces us as we bank past (u 0.70: the Moon has swung out of the frame; the tent ahead)
    { const sA = A3 + 462, sP = raw[Math.min(raw.length - 1, Math.round(sA / STEP))], sx = sP[0] + 66, sz = sP[1], cor = [], pts4 = [];
      const a0 = Math.atan2(0.78, -0.63);
      for (let i = 0; i < 7; i++) { const t = (i + brng.range(-0.3, 0.3)) / 7 * 6.2832, rr2 = brng.range(0.8, 1.15), lx = Math.cos(t) * 30 * rr2, lz = Math.sin(t) * 24 * rr2; cor.push([sx + lx * Math.cos(a0) - lz * Math.sin(a0), sz + lx * Math.sin(a0) + lz * Math.cos(a0)]); }
      for (let e = 0; e < 7; e++) { const a = cor[e], b = cor[(e + 1) % 7], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.6));
        for (let t = 0; t < n; t++) { jag(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n, tmp); pts4.push([tmp[0], tmp[1], 1]); } }
      addPlate(pts4, sx, sz, [brng(), 0.5, 0.5, 1, 0, brng(), 0, a0, 40], 0.3); nPlates++; }
    await ctx.yield();
    // THE RAFTS of the open sea: about sixty broken pieces 16 to 50 m across, each riding tilted with one burning wall and a
    // strip of its glowing underside lifted clear of the melt, laid either side of the line from the gate to the tent
    {
      const rr = rng.fork('rafts'), laid = [], nR = Math.round(60 * (0.7 + 0.3 * detail));
      for (let i = 0, tries = 0; i < nR && tries < 700; tries++) {
        const d = lerp(GATE_D + 190, D_END - 95, (i + rr()) / nR) + rr.range(-30, 30), sd = rr() < 0.5 ? -1 : 1, rad = rr.range(17, 38) * (rr() < 0.25 ? 1.35 : 1);
        const under = rr() < 0.3;                       // three in ten lie across the line itself, nearly level (the corridor rule in addPlate), and slide under us
        const cx = lineAt(d) + sd * (under ? rr() * 18 : 22 + rad * 0.8 + rr() * rr() * 125), cz = -d;
        if (inTentRaft(cx, cz) || (!under && path.nearestXZ(cx, cz).dist < 20 + rad * 0.8)) continue;
        if (laid.some((q) => Math.hypot(q[0] - cx, q[1] - cz) < (q[2] + rad) * 0.72 + 6)) continue;      // (the shader shrinks each to about 0.6 of its outline)
        laid.push([cx, cz, rad]); i++;
        const nc = 5 + Math.floor(rr() * 4), a0 = rr() * 6.2832, el = rr.range(0.6, 1), cor = [];
        for (let c = 0; c < nc; c++) { const t = a0 + (c + rr.range(-0.3, 0.3)) / nc * 6.2832, r2 = rad * rr.range(0.62, 1.12); cor.push([cx + Math.cos(t) * r2, cz + Math.sin(t) * r2 * el]); }
        const pr = [];
        for (let e = 0; e < nc; e++) { const a = cor[e], b = cor[(e + 1) % nc], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.6));
          for (let t = 0; t < n; t++) { jag(a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n, tmp); pr.push([tmp[0], tmp[1], 1]); } }
        addPlate(pr, cx, cz, [rr(), rr(), 0.9, rr(), 0.9, rr(), 1], 0);
        nPlates++;
        await ctx.yield();
      }
    }
    await ctx.yield();
    // one plate: a thick slab (top skin with its glow-bleed rim, overhanging lip, banded wall, ribbed underside)
    // written in the part's aSlab convention, plus where it pivots and how it will move (aCtr, aKin)
    function addPlate(pts, ccx, ccz, k, low) {
      const N = pts.length;
      let area = 0; for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) pts.reverse();
      let cx = 0, cz = 0, nearN = 0; for (const p of pts) { cx += p[0]; cz += p[1]; nearN += p[2]; } cx /= N; cz /= N;
      const near = nearN > 0;
      const nx = new Float32Array(N), nzv = new Float32Array(N), arc = new Float32Array(N + 1); let per = 0, rad = 0;
      for (let i = 0; i < N; i++) {
        const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N], c = pts[i]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        nx[i] = tz; nzv[i] = -tx; arc[i] = per; per += Math.hypot(b[0] - c[0], b[1] - c[1]); rad = Math.max(rad, Math.hypot(c[0] - cx, c[1] - cz));
      }
      arc[N] = per;
      // how it moves
      const pn = path.nearestXZ(cx, cz), lineP = path.pointAt(pn.u), side = cx >= lineP.x ? 1 : -1;
      const corridor = pn.dist - rad * 0.75 < 17;
      // THE CROWN: plates under the Moon beyond the gate rear tall on the swell's face while it is still far ahead,
      // far edge up so their black tops stand against the ember disc, and lie down and founder as the crest passes
      // (long before the camera reaches them). How tall each stands is set by how far off it is when it stands highest,
      // so the skyline climbs into the Moon's lowest tenth and no further.
      const dA = -cz, crown = k[7] !== undefined || (dA > GATE_D + 190 && dA < D_END + 260 && Math.abs(cx) < CROWN_X && k[2] < 0.62 && !k[6]);      // the others stay as rafts on the open sea
      const farSide = !crown && dA > GATE_D + 105 && pn.dist > 60;
      let ang0 = crown ? (k[1] < 0.5 ? -(0.22 + 1.7 * k[1]) : Math.PI + 0.22 + 1.7 * (k[1] - 0.5)) :      // high edge far-right or far-left: the black top and one burning side wall turn to us
         pn.dist < 140 ? (k[1] > 0.5 && pn.dist - rad * 0.6 > 26 ? Math.PI / 2 - side * (0.25 + (k[1] - 0.5) * 1.4)      // half rear the end that faces the arriving camera: their burning underside is what we see
          : (side > 0 ? 0 : Math.PI) + ((k[1] > 0.5 ? k[1] - 0.5 : k[1]) - 0.25) * 3) : k[1] * 6.2832;      // (polish 3) a plate right under the line never rears the end that faces us: from 9 m its underside was a pane across the bottom of the frame
      if (k[7] !== undefined) ang0 = k[7];
      let along = 0; for (const p of pts) along = Math.max(along, Math.abs((p[0] - cx) * Math.cos(ang0) + (p[1] - cz) * Math.sin(ang0)));
      let angMax = corridor ? Math.min(0.03 + 0.05 * k[2], Math.asin(clamp(4.2 / (1.8 * along), 0, 0.5))) : k[6] ? 0.22 + 0.30 * k[3] : k[2] < (farSide ? 0.56 : 0.36) ? 0.34 + 0.24 * k[3] : 0.11 + 0.16 * k[3];
      angMax = Math.min(angMax, Math.asin(clamp((farSide ? 38 : 31) / (2 * along), 0, farSide ? 0.70 : 0.62)));
      let sink = (k[4] < 0.40) ? 9 + 5 * k[5] + thick : 0, shrink = 0.04 + 0.06 * k[5];
      if (crown) {
        // each stands until the camera is within about 400 m of it, then lies down and founders (uCamD in the shader): the far
        // ones are taller, so from the first frame three or four black shards stand against the Moon's foot
        const ht = k[8] !== undefined ? k[8] : clamp(44 + 0.05 * (dA - GATE_D - 190), 44, 62) * (0.80 + 0.20 * k[3]);
        // stand steep (about 37 degrees) whatever the plate's size: a big plate pivots deeper, half of it under the melt
        const lift = clamp(ht / (0.6 * along) - 1, 0.05, 0.95);
        angMax = Math.asin(clamp(ht / ((1 + lift) * along), 0, 0.82)); sink = 20 + thick + ((cx - lineAt(dA) > 58 || (cx - lineAt(dA) < -58 && dA < GATE_D + 290)) && pn.dist - rad * 0.75 > 24 ? 100 : 0); shrink = -lift;      // 100 more marks a shard well clear of the line: it stands until we are beside it   // a negative w marks a crown plate for the shader and carries its lift
      }
      const nRib = Math.max(3, Math.round(per / (thick / 4)));
      const v0 = P.length / 3;
      const put = (x, y, z, part, e, s, a, b, c) => { P.push(x, y, z); A.push(part, e, s); N3.push(a, b, c); C4.push(cx, cz, along, k[0]); K4.push(ang0, angMax, sink, shrink); };
      const chip = new Float32Array(N); let ci = 0, cdp = 0;
      for (let i = 0; i < N; i++) { if (ci <= 0 && prng() < 0.06) { ci = 1 + Math.floor(prng() * 3); cdp = 0.2 + prng() * 0.5; } chip[i] = ci > 0 ? cdp : 0; ci--; }
      const off = (i, d, o) => { o[0] = pts[i][0] - nx[i] * d; o[1] = pts[i][1] - nzv[i] * d; };
      const inset = (i, d, o) => { const p = pts[i], dx = cx - p[0], dz = cz - p[1], l = Math.hypot(dx, dz) || 1, kk = Math.min(d, l * 0.9) / l; o[0] = p[0] + dx * kk; o[1] = p[1] + dz * kk; };
      const q = [0, 0];
      const stitch = (a, b, n, wrap) => { for (let i = 0; i < n; i++) { const j = wrap ? (i + 1) % n : i + 1; IDX.push(a + i, a + j, b + i, a + j, b + j, b + i); } };
      const fan = (a, c, n) => { for (let i = 0; i < n; i++) IDX.push(a + i, a + (i + 1) % n, c); };
      const orient = (i0, kind) => {      // flip the part if, summed over its triangles, it faces the wrong way
        let s = 0;
        for (let t = i0; t < IDX.length; t += 3) {
          const Aa = IDX[t] * 3, B = IDX[t + 1] * 3, C = IDX[t + 2] * 3;
          const ux = P[B] - P[Aa], uy = P[B + 1] - P[Aa + 1], uz = P[B + 2] - P[Aa + 2], vx = P[C] - P[Aa], vy = P[C + 1] - P[Aa + 1], vz = P[C + 2] - P[Aa + 2];
          const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
          s += kind === 0 ? fy : kind === 2 ? -fy : fx * (P[Aa] - cx) + fz * (P[Aa + 2] - cz);
        }
        if (s < 0) for (let t = i0; t < IDX.length; t += 3) { const w = IDX[t + 1]; IDX[t + 1] = IDX[t + 2]; IDX[t + 2] = w; }
      };
      // top
      let i0 = IDX.length, s0 = P.length / 3;
      for (let i = 0; i < N; i++) { off(i, chip[i], q); put(q[0], TOP - 0.05 - low, q[1], 0, 0, 0, 0, 1, 0); }
      for (let i = 0; i < N; i++) { inset(i, 2.4 + chip[i], q); put(q[0], TOP - low, q[1], 0, 2.4, 0, 0, 1, 0); }
      put(cx, TOP - low, cz, 0, 30, 0, 0, 1, 0);
      stitch(s0, s0 + N, N, true); fan(s0 + N, s0 + 2 * N, N); orient(i0, 0);
      // lip and wall
      i0 = IDX.length;
      const rows = near ? [[TOP - 0.05, 0, 1.0, 0.7], [TOP - 0.30, -0.05, 0.93, 0.1], [TOP - 0.36, 0.30, 0.90, -0.5], [TOP - thick * 0.5, 0.16, 0.45, 0.05], [BOT, 0.85, 0.0, -0.2]]
        : [[TOP - 0.05, 0, 1.0, 0.6], [TOP - 0.36, 0.26, 0.90, 0], [BOT, 0.8, 0.0, -0.2]];
      let prev = -1;
      for (let r = 0; r < rows.length; r++) {
        const R = rows[r], s1 = P.length / 3;
        for (let ii = 0; ii <= N; ii++) { const i = ii % N; off(i, R[1] + (r < 2 ? chip[i] : chip[i] * 0.3), q); const l = Math.hypot(1, R[3]); put(q[0], R[0], q[1], 1, R[2], -1 - arc[ii] / per * nRib, nx[i] / l, R[3] / l, nzv[i] / l); }
        if (prev >= 0) stitch(prev, s1, N, false);
        prev = s1;
      }
      orient(i0, 1);
      // underside
      i0 = IDX.length; s0 = P.length / 3;
      for (let i = 0; i < N; i++) { off(i, 0.85, q); put(q[0], BOT, q[1], 2, 0.85, ang0, 0, -1, 0); }
      if (near) { for (let i = 0; i < N; i++) { inset(i, 6, q); put(q[0], BOT - 0.15, q[1], 2, 6, ang0, 0, -1, 0); } stitch(s0, s0 + N, N, true); }
      const last = P.length / 3 - N;
      put(cx, BOT - 0.3, cz, 2, 30, ang0, 0, -1, 0);
      fan(last, last + N, N); orient(i0, 2);
      return v0;
    }
    await ctx.yield();
    // the big arrays go into typed arrays a slice at a time, a breath between slices: no step of this holds the page
    const typed = async (src, T) => { const out = new T(src.length); for (let i = 0; i < src.length;) { const e = Math.min(src.length, i + 90000); for (; i < e; i++) out[i] = src[i]; await ctx.yield(); } return out; };
    const plateGeo = new THREE.BufferGeometry();
    plateGeo.setAttribute('position', new THREE.BufferAttribute(await typed(P, Float32Array), 3));
    plateGeo.setAttribute('aSlab', new THREE.BufferAttribute(await typed(A, Float32Array), 3));
    plateGeo.setAttribute('normal', new THREE.BufferAttribute(await typed(N3, Float32Array), 3));
    plateGeo.setAttribute('aCtr', new THREE.BufferAttribute(await typed(C4, Float32Array), 4));
    plateGeo.setAttribute('aKin', new THREE.BufferAttribute(await typed(K4, Float32Array), 4));
    plateGeo.setIndex(new THREE.BufferAttribute(await typed(IDX, Uint32Array), 1));
    plateGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -800), 1400);
    await ctx.yield();
    // the plates' motion, all in the vertex shader and all from s, the plate's distance from the crest:
    // shrink apart, rear on the low edge, bob, then either founder (two in three) or settle as a sliding raft
    const camD = { value: 0 };      // metres flown along -Z, from the path at u (never from the camera: the portal's camera stands elsewhere)
    const plateMat = makeSlabMaterial(moonU, shared, PALETTE, {
      heat: 1, ash: crust === 'ash' ? 0.8 : 0, rough: crust === 'young' ? 0.10 : 0.08, ribW: thick / 4, sheen: SHEEN, stars: 1,
      uniforms: { uCamD: camD }, xformPars: /* glsl */`attribute vec4 aCtr, aKin; uniform float uCamD; ${STATE_GLSL}`,
      xformMain: /* glsl */`{
        vec2 ctr = aCtr.xy; float ph = aCtr.w, s = swellS(ctr);
        open = crustOpen(s);
        vec3 q = vec3(position.x - ctr.x, position.y, position.z - ctr.y);
        lpos = q + vec3(ph * 197., 0., ph * 61.);
        float up = smoothstep(-430., -150., s + ph * 70.) * smoothstep(0., 0.3, open), aft = smoothstep(0., 380., s + ph * 60.);
        float sinker = step(0.5, aKin.z), bobA = open * (1. - 0.5 * aft * sinker);
        float crown = step(aKin.w, -1e-4), sc = s + ph * 60.;
        float stay = step(90., aKin.z), snk = aKin.z - 100. * stay;
        float gap = -ctr.y - uCamD + ph * 50. + 700. * stay; float upC = 1., dnC = smoothstep(760., 520., gap);
        float ang = mix(aKin.y * up * mix(1. - 0.2 * aft, 1. + 0.8 * aft, sinker), aKin.y * upC * (1. - 0.78 * dnC), crown) + sin(uTime * (0.75 + 0.4 * ph) + ph * 40.) * 0.012 * bobA;
        float shr = 1. - mix(aKin.w, 0.06, crown) * open - (0.26 + 0.22 * ph) * aft * (1. - sinker);      // the survivors break down to rafts half their size
        q.xz *= shr;
        vec2 r = vec2(cos(aKin.x), sin(aKin.x)); float al = dot(q.xz, r); vec2 pp = q.xz - r * al;
        float ca = cos(ang), sa = sin(ang);
        float al2 = al * ca - q.y * sa, y2 = al * sa + q.y * ca;
        y2 += abs(sa) * aCtr.z * shr * mix(0.8 * (1. - aft * sinker), -aKin.w, crown);
        y2 += sin(uTime * (0.8 + 0.45 * ph) + ph * 23.) * 0.3 * bobA;
        y2 -= snk * mix(smoothstep(40., 420., s + ph * 110.), smoothstep(680., 480., gap), crown);
        vec2 dr = r * 0.025 * max(s, 0.) * (1. - sinker);
        lp.xyz = vec3(ctr.x + pp.x + r.x * al2 + dr.x, y2, ctr.y + pp.y + r.y * al2 + dr.y);
        float na = dot(n.xz, r); vec2 np = n.xz - r * na;
        n = vec3(np.x + r.x * (na * ca - n.y * sa), na * sa + n.y * ca, np.y + r.y * (na * ca - n.y * sa));
      }`,
    });
    { const vp = path.pointAt(0.094); plateMat.uniforms.uVent.value.set(vp.x + 9, vp.z, 30, 1); }      // (polish 5) one lit thing in the near field of the dark opening: a welling under the glass 110 m ahead of the entry, under us by u 0.09
    const plates = new THREE.Mesh(plateGeo, plateMat); plates.name = 'crust'; plates.frustumCulled = false;
    scene.add(plates);
    await ctx.yield();

    // ---- twelve more fountains along the leads beyond the gate (the hero has two): none nearer than 70 m to the line
    // scripted first: one playing at the right of the first frames (it leaves the frame whole before we pass it), a tall pair beside the arc
    const frng = rng.fork('fountains'), fList = [{ x: 92, y: 0, z: -400, height: 46 }, { x: -104, y: 0, z: -618, height: 55 }, { x: -95, y: 0, z: -(GATE_D + 460), height: 62 }, { x: 215, y: 0, z: -(D_END + 185), height: 60 }, { x: 88, y: 0, z: -(D_END + 215), height: 44 }];
    for (let tries = 0; tries < 400 && fList.length < 12; tries++) {
      const x = (frng() < 0.5 ? -1 : 1) * frng.range(82, 285), z = -frng.range(GATE_D + 60, D_END + 260), height = frng.range(20, 60);
      if (path.nearestXZ(x, z).dist < 78 || Math.hypot(x - tentC.x, z - tentC.z) < 135 || inPatch(x, z, 1.25) < 1) continue;
      if (fList.some((f) => Math.hypot(f.x - x, f.z - z) < 95)) continue;
      fList.push({ x, y: 0, z, height });
    }
    const fShared = { uTime: shared.uTime, uResY: shared.uResY, uFount: { value: 1 }, uSwell: shared.uSwell };
    // (polish 4) the glass mirrors the fountains: a column of gold glitter under each (the first four for the crust, the pair behind the tent for its raft)
    [0, 1, 2, 3].forEach((i) => { const f = fList[i]; for (const m of [plateMat, hero.slabMaterial]) m.uniforms.uFire.value[i].set(f.x, f.z, f.height * 1.15, 1); });
    [3, 4].forEach((j, i) => { const f = fList[j]; tent.raft.material.uniforms.uFire.value[i].set(f.x, f.z, f.height * 1.15, 0.8); });
    hero.slabMaterial.uniforms.uStars.value = 1; tent.raft.material.uniforms.uStars.value = 0.6;
    const fGlow = [0, 1, 2, 3].map((i) => { const f = fList[Math.min(i, fList.length - 1)]; return new THREE.Vector3(f.x, f.z, 14 + f.height * 0.5); });
    // ---- the sea: one grid that bends over the swell. Closed crust (drawn, beyond the plates), leads, open melt
    const SX = 64, SZ = 128, spos = new Float32Array((SX + 1) * (SZ + 1) * 3), sidx = [];
    for (let j = 0; j <= SZ; j++) for (let i = 0; i <= SX; i++) {
      const t = i / SX * 2 - 1, k = (j * (SX + 1) + i) * 3;
      spos[k] = Math.sign(t) * 3800 * Math.pow(Math.abs(t), 1.9); spos[k + 1] = -0.15; spos[k + 2] = 420 - 6500 * Math.pow(j / SZ, 1.45);
    }
    for (let j = 0; j < SZ; j++) for (let i = 0; i < SX; i++) { const a = j * (SX + 1) + i, b = a + 1, c = a + SX + 1, d = c + 1; sidx.push(a, b, c, b, d, c); }
    const seaGeo = new THREE.BufferGeometry();
    seaGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3)); seaGeo.setIndex(sidx);
    const cu = (h, k = 1) => ({ value: col(h, k) });
    const seaMat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: { ...THREE.UniformsLib.fog, ...moonU, uTime: shared.uTime, uSwell: shared.uSwell, uCell: { value: cell * 1.25 }, uAsh: { value: crust === 'ash' ? 0.8 : 0 },
        uField: { value: new THREE.Vector4(XW - 5, D0 + 5, D1 - 5, 0) }, uHeroZ: { value: -GATE_D }, uFnt: { value: fGlow }, uFount: fShared.uFount,
        uBlack: cu(PALETTE[0]), uGarnet: cu(PALETTE[1]), uRed: cu(PALETTE[2]), uOrange: cu(PALETTE[3]), uGold: cu(PALETTE[4]), uCream: cu(PALETTE[5]), uCool: cu(PALETTE[6]) },
      vertexShader: /* glsl */`
        varying vec3 vWorld;
        #include <fog_pars_vertex>
        ${SWELL_GLSL}
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.); wp.y += swellH(wp.xz); vWorld = wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uCell, uAsh, uHeroZ, uFount; uniform vec4 uField; uniform vec3 uFnt[4]; uniform vec3 uMoonDir, uMoonRight, uMoonUp;
        uniform vec3 uBlack, uGarnet, uRed, uOrange, uGold, uCream, uCool;
        varying vec3 vWorld;
        #include <fog_pars_fragment>
        ${NOISE_GLSL}
        ${SWELL_GLSL}
        ${STATE_GLSL}
        ${MOON_GLSL}
        void main(){
          vec2 pw = vWorld.xz, p = vec2(pw.x, pw.y - uHeroZ);
          float s = swellS(pw), open = crustOpen(s), gold = crustGold(s);
          vec3 Vv = cameraPosition - vWorld; float dist = max(length(Vv), 1e-3); vec3 V = Vv / dist;
          // open melt: slow bright streams running through the orange, the hottest threads white-gold. Everything finer than
          // a few pixels is faded into its mean with distance (far, far2), so the far sea is a smooth graded band, not speckle
          float far = smoothstep(200., 650., dist), near = 1. - far, far2 = smoothstep(450., 1300., dist);
          float fw0 = max(length(dFdx(pw)), length(dFdy(pw)));
          vec2 fl = p * 0.045 + uTime * vec2(0.035, 0.012);
          float m1 = mix(fbm3(fl), 0.5, far2), m2 = mix(fbm3(fl * 2.7 - uTime * vec2(0.02, 0.05) + 4.), 0.5, far);
          vec2 sq = vec2(p.x * 0.016 + m1 * 1.3, p.y * 0.05 + m2 * 0.5) + uTime * vec2(0.012, 0.02);
          float st = 1. - abs(2. * fbm3(sq) - 1.); st *= st;
          vec3 melt = mix(uRed * 0.55 + uOrange * 0.16, uOrange * 0.72 + uGold * 0.14, smoothstep(0.3, 0.85, m1 * 0.55 + m2 * 0.55));
          melt += (uOrange * 0.22 + uGold * 0.32) * smoothstep(0.55, 0.95, st) * (1. - 0.9 * smoothstep(1.2, 5.0, fw0)) + uCream * 0.28 * smoothstep(0.90, 1.0, st) * near;
          // THE SWELL ON THE MELT. It is a runny liquid and it heaves: four crossing wave trains tilt the surface. A melt gives
          // off its light best along its own normal and turns to a dark mirror at a glancing angle (emissivity = 1 - Fresnel),
          // so the faces of a swell that lean toward us burn gold and their backs go dark and carry the Moon's red road and
          // the horizon's garnet. Each train fades into its mean before its wavelength falls under a few pixels.
          float fw = max(length(dFdx(pw)), length(dFdy(pw)));
          float wob = 2.6 * vnoise(p * 0.013 + 5.) + 1.3 * vnoise(p * 0.047 + 21.);
          vec2 wg = vec2(0.); float kAvg = 0.;
          { vec2 d = vec2(0.42, 0.91); float lam = 37., kp = 1. - smoothstep(0.16, 0.45, fw / lam), a = dot(p, d) * 6.2832 / lam + uTime * 0.9 + wob; wg += d * 0.125 * kp * (cos(a) + 0.35 * cos(2. * a + 1.)); kAvg += kp * 0.4; }
          { vec2 d = vec2(-0.64, 0.77); float lam = 23., kp = 1. - smoothstep(0.16, 0.45, fw / lam), a = dot(p, d) * 6.2832 / lam + uTime * 1.15 + wob * 1.7 + 2.; wg += d * 0.10 * kp * (cos(a) + 0.35 * cos(2. * a + 1.)); kAvg += kp * 0.3; }
          { vec2 d = vec2(0.94, 0.34); float lam = 14., kp = 1. - smoothstep(0.16, 0.45, fw / lam), a = dot(p, d) * 6.2832 / lam + uTime * 1.5 - wob * 1.3 + 4.; wg += d * 0.075 * kp * cos(a); kAvg += kp * 0.2; }
          { vec2 d = vec2(-0.17, 0.985); float lam = 8.5, kp = 1. - smoothstep(0.16, 0.45, fw / lam), a = dot(p, d) * 6.2832 / lam + uTime * 1.9 + wob * 2.3 + 1.; wg += d * 0.06 * kp * cos(a); kAvg += kp * 0.1; }
          vec3 wn = normalize(vec3(-wg.x, 1., -wg.y));
          float wci = clamp(dot(wn, V), 0., 1.) + 0.11 * (1. - kAvg) + 0.02, wR = 1. - min(wci, 1.); wR = wR * wR * wR * wR * wR; wR = 0.04 + 0.96 * wR;
          float wE = mix(1. - wR, 0.40, far2);      // (polish 3) far off we see the melt at a glancing angle: it gives little light and mirrors the night, so the sea deepens to red toward the horizon
          vec3 wRf = reflect(-V, wn); wRf.y = abs(wRf.y);
          vec2 wuv = vec2(dot(wRf, uMoonRight), dot(wRf, uMoonUp)) / 0.06976;
          vec3 wMir = (dot(wRf, uMoonDir) > 0. && dot(wuv, wuv) < 1.) ? moonShade(wuv, 3.).rgb : vec3(0.);
          wMir = mix(wMir, min(wMir, uRed * 1.1), smoothstep(450., 1100., dist));
          vec3 wSky = uGarnet * (0.30 + 0.9 * exp(-wRf.y / 0.16)) + wMir * 0.9;
          melt = mix(melt, uRed * 0.80 + uOrange * 0.10, 0.55 * far2) * (0.20 + 1.08 * wE) + wSky * (1. - wE) * 0.8;
          // (polish 3) THE SKIN ON THE MELT. The sea is not one orange sheet: it lies in zones a few hundred metres across. Where the
          // tide has just torn it the melt stands open and runs yellow-white; elsewhere it has skinned over in black glass (the
          // Moon's road and the sky's violet on it) cut by long leads and short rifts of white-gold. Edges soften by the pixel's
          // own footprint (fw), not by distance, so from high up the pattern holds to the horizon and never breaks into speckle.
          vec2 sp = p * 0.030 + uTime * vec2(0.018, 0.007);
          float sk = fbm3(sp) * 0.72 + fbm3(sp * 2.6 + 7. - uTime * 0.012) * 0.28;
          float feather = ((vnoise(p * vec2(0.16, 0.5) + sk * 5.) - 0.5) * 0.10 + (vnoise(p * 1.7) - 0.5) * 0.03) * near;
          float zone = vnoise(p * 0.0075 + vec2(3.7, 1.9)) * 0.60 + vnoise(p * 0.019 + 8.3) * 0.40, zs = smoothstep(0.30, 0.64, zone);
          float th = mix(0.38, 0.66, zs) - 0.05 * gold + 0.03 * sin(uTime * 0.23 + m1 * 9.);
          float sd = sk + feather - th, ew = 0.012 + 0.020 * fw;
          float skin = 1. - smoothstep(-ew, ew, sd);
          // (polish 4) the hottest melt, where it stands open, runs in FILAMENTS: a net of yellow-white threads drawn out along the flow
          // over deep orange, so an open reach is a moving surface and not one soft bright patch
          vec2 fq = vec2(p.x * 0.021 + m1 * 0.9, p.y * 0.034 - m2 * 0.6) + uTime * vec2(0.016, 0.024);
          float fil = 1. - abs(2. * fbm3(fq) - 1.), filK = 1. - smoothstep(2.0, 8.0, fw);
          float filL = mix(0.30, smoothstep(0.62, 0.97, fil) + 0.25 * smoothstep(0.30, 0.62, fil), filK);
          melt = mix(melt, melt * (0.62 + 0.25 * m2) + uRed * 0.10, (1. - zs) * filK * (1. - smoothstep(0.30, 0.75, fil)) * 0.8);
          melt += (uGold * 0.80 + uCream * 0.50) * (1. - zs) * smoothstep(0.25, 0.75, m1) * filL * (0.35 + 0.65 * wE);
          float seam = 0.;
          float tw = max(0.0067, ew * 0.8), tear = exp(-min(abs(sd), 1.) / tw) * min(1., 0.0085 / tw);      // (a line spread over a wider pixel is dimmer by as much: no floor, or the far skin fills with glow)
          float rw = 0.022 + 0.085 * fw, rift = (1. - smoothstep(rw * 0.4, rw, abs(fbm3(p * 0.11 + 9.) - 0.5))) * min(1., 0.022 / rw) * skin;
          float rw2 = 0.010 + 0.022 * fw, lead2 = (1. - smoothstep(rw2 * 0.4, rw2, abs(fbm3(p * 0.027 + 31.) - 0.5 + 0.06 * (m2 - 0.5)))) * min(1., 0.014 / rw2) * skin;
          vec3 skinC = uBlack * 1.5 + uGarnet * (0.20 + 0.25 * m2) + uCool * 0.03 + uRed * 0.22 * smoothstep(0.06, 0.0, -sd);
          skinC += wSky * (0.25 + 0.5 * (1. - wE));      // the skin is glass: it mirrors the sky's glow and the Moon
          vec3 sea = mix(melt, skinC, skin * 0.95) + (uOrange * 1.0 + uGold * 0.9) * (tear + rift * 0.6) + (uOrange * 0.7 + uGold * 1.0 + uCream * 0.3) * lead2;
          // inside the plate field the melt shows only in leads: red hairlines while shut, white-gold as they open
          float inField = (1. - smoothstep(uField.x - 4., uField.x + 4., abs(pw.x))) * smoothstep(uField.y - 4., uField.y + 4., -pw.y) * (1. - smoothstep(uField.z - 4., uField.z + 4., -pw.y));
          vec3 lead = mix(uRed * 1.1 + uOrange * 0.25, melt * 1.5 + uGold * (0.45 + 0.5 * smoothstep(0.5, 0.95, st)) + uCream * 0.25 * m2, open * (0.75 + 0.25 * m2));
          // beyond the field the closed crust is drawn: black glass in plates, a net of joints, the Moon's road on it
          vec2 cq = pw / uCell + (vnoise(pw * 0.011) - 0.5) * 0.5, ci = floor(cq), cf = fract(cq);
          float f1 = 9., f2 = 9.;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash21(ci + g), hash21(ci + g + 17.3)); float d = length(g + 0.15 + 0.7 * o - cf); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
          float jd = (f2 - f1) * uCell;                                     // metres from the nearest joint, roughly
          float jw = max(0.5 + 16. * open, dist * 0.0016);                  // never thinner than about a pixel and a half
          float joint = (1. - smoothstep(jw * 0.4, jw, jd)) * min(1., (0.5 + 16. * open) / jw + 0.25);
          vec3 n = normalize(vec3(vnoise(pw * 1.3 + 3.1) - .5 + (vnoise(pw * 6.1) - .5) * .6, 14., vnoise(pw * 1.3 + 11.7) - .5 + (vnoise(pw * 6.1 + 5.) - .5) * .6));
          vec3 R = reflect(-V, n);
          float fres = 0.22 + 0.78 * pow(1. - clamp(dot(n, V), 0., 1.), 3.);
          vec2 muv = vec2(dot(R, uMoonRight), dot(R, uMoonUp)) / 0.06976;
          vec3 mir = (dot(R, uMoonDir) > 0. && dot(muv, muv) < 1.) ? moonShade(muv, 3.).rgb : vec3(0.);
          mir = mix(mir, min(mir, uRed * 1.1), smoothstep(450., 1100., dist));
          float gn = fbm3(pw * 0.33), gst = vnoise(pw * vec2(0.07, 0.45) + 31.);
          vec3 crustC = uBlack * 1.1 + uGarnet * 0.05 + (uBlack * 0.6 + (uGarnet * 0.85 + uRed * 0.07) * (0.15 + 0.85 * exp(-max(V.y, 0.) / 0.22))) * (0.22 + 0.78 * pow(1. - clamp(V.y, 0., 1.), 3.)) * 0.8 * (0.22 + 1.0 * gn * gn + 0.45 * gst * gst) * (1. - 0.6 * uAsh) + (mir * 1.15 + uMoonCol[0] * 0.30 * pow(max(dot(R, uMoonDir), 0.), 160.)) * fres * (1. - 0.8 * uAsh);
          crustC = mix(crustC, uCool * 0.16 * (0.5 + fbm3(pw * 0.33)), uAsh * 0.8);
          crustC = mix(crustC, lead, joint);
          vec3 outC = mix(crustC, sea, gold);
          vec3 inC = mix(lead, sea, gold);
          vec3 c = mix(outC, inC, inField);
          // the sea round a fountain's foot runs brighter: the falling melt stirs the skin off it
          float fg = 0.;
          for (int i = 0; i < 4; i++) { vec2 fd = pw - uFnt[i].xy; fg += exp(-dot(fd, fd) / max(uFnt[i].z * uFnt[i].z, 1.)); }
          c += (uOrange * 0.35 + uGold * 0.60 + uCream * 0.20) * min(fg, 1.) * uFount * gold * (0.55 + 0.45 * m2) * (1. - 0.5 * skin);
          gl_FragColor = vec4(c, 1.);
          #include <fog_fragment>
        }`,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat); sea.name = 'tideSea'; sea.frustumCulled = false;
    scene.add(sea);
    await ctx.yield();
    // ---- the fountains themselves (their list is drawn above, before the sea, which glows round their feet)
    const fountains = makeFountains(fList, fShared, PALETTE, frng, detail);
    scene.add(fountains);
    await ctx.yield();

    // ---- the sky: violet-black, hard stars creeping right (a five-hour day), the planet's own garnet glow on the horizon
    const fogCol = scene.fog.color;
    const skyU = { uTime: { value: 0 }, uTop: { value: SKY.clone() }, uBand: { value: fogCol.clone() }, uGarnet: cu(PALETTE[1]), uCool: cu(PALETTE[6]), uRedS: cu(PALETTE[2]), uOrangeS: cu(PALETTE[3]), uWarm: { value: 0.2 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(5200, 48, 24), new THREE.ShaderMaterial({
      uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uWarm; uniform vec3 uTop, uBand, uGarnet, uCool, uRedS, uOrangeS; varying vec3 vDir;
        ${NOISE_GLSL}
        void main(){
          vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
          float el = asin(clamp(d.y, -1., 1.)), az = atan(d.x, -d.z + 1e-5);
          float breathe = 1. + 0.10 * sin(uTime * 0.37 + az * 5.) + 0.06 * sin(uTime * 0.23 - az * 11.);
          float band = exp(-max(el, 0.) / 0.030) * breathe;
          vec3 c = uTop + uGarnet * 0.10 * exp(-max(el, 0.) / 0.22);
          c = mix(c, uBand * (el > 0. ? 1.5 : 1.0), clamp(band, 0., 1.));
          // (polish 5) the planet's own light in the thin rock vapour over the horizon: as the crust opens and the floor turns gold (uWarm, by u)
          // the band warms from garnet to a dull red glow a few degrees high, so the sky over the open sea is not an empty black band
          c += (uRedS * 0.23 + uOrangeS * 0.035) * uWarm * exp(-max(el, 0.) / 0.048) * (0.85 + 0.15 * breathe);
          // stars: two layers of cells in (azimuth, elevation), turning with the sky
          float turn = uTime * 0.00036; vec3 acc = vec3(0.);
          for (int L = 0; L < 2; L++) {
            float sc = L == 0 ? 70. : 150.;
            vec2 uv = vec2((az + turn) * cos(clamp(el, -1.4, 1.4)), el) * sc + float(L) * 13.7, id = floor(uv), f = fract(uv) - 0.5;
            float h = hash21(id + 3.1), b = h * h; b = b * b; b = b * b * (L == 0 ? 2.6 : 1.0) * step(L == 0 ? 0.62 : 0.74, h);
            vec2 o = (vec2(hash21(id + 7.7), hash21(id + 19.3)) - 0.5) * 0.7;
            float r = L == 0 ? 0.075 : 0.13, tw = 0.8 + 0.2 * sin(uTime * (1.5 + 3. * h) + h * 60.);
            acc += mix(vec3(1., 0.86, 0.74), vec3(0.80, 0.84, 1.0), hash21(id + 5.)) * b * tw * (1. - smoothstep(r * 0.3, r, length(f - o)));
          }
          c += acc * 1.5 * smoothstep(0.012, 0.09, el);
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
    sky.frustumCulled = false; sky.renderOrder = -1; sky.name = 'sky';
    scene.add(sky);
    // thin veils of rock vapour, lit garnet from below, drifting across the Moon's foot (a seeded sky)
    const veilU = { uTime: skyU.uTime, uVeil: { value: veils }, uGarnet: cu(PALETTE[1]), uRed: cu(PALETTE[2]) };
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 1, 24, 6), new THREE.ShaderMaterial({
      uniforms: veilU, transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`varying vec2 vA; void main(){ float az = position.x * 0.75, el = (position.y + 0.5) * 0.26 - 0.01; vA = vec2(az, el);
        vec3 d = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el)); gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + d * 4300., 1.); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uVeil; uniform vec3 uGarnet, uRed; varying vec2 vA;
        ${NOISE_GLSL}
        void main(){
          vec2 q = vec2(vA.x * 9. + uTime * 0.012, vA.y * 70.);
          float n = fbm3(q) * 0.65 + fbm3(q * vec2(2.3, 1.7) + 5. - uTime * 0.02) * 0.35;
          float v = smoothstep(0.42, 0.78, n) * exp(-pow(abs(vA.y - 0.050) / 0.045, 2.)) * (1. - smoothstep(0.55, 0.75, abs(vA.x)));
          float a = v * 0.5 * uVeil;
          gl_FragColor = vec4((uGarnet * 1.5 + uRed * 0.30) * (0.6 + 0.6 * n), a);
        }`,
    }));
    veil.frustumCulled = false; veil.renderOrder = -0.4; veil.name = 'veils';
    scene.add(veil);
    await ctx.yield();
    // ---- meteors: debris of the impact still falling, slow gold ribbons across the Moon's part of the sky
    const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const nSlots = meteorGap < 1 ? 8 : 6, mg = quad(), slots = new Float32Array(nSlots); for (let i = 0; i < nSlots; i++) slots[i] = i;
    mg.setAttribute('aSlot', new THREE.InstancedBufferAttribute(slots, 1)); mg.instanceCount = nSlots;
    const meteors = new THREE.Mesh(mg, new THREE.ShaderMaterial({
      uniforms: { uTime: skyU.uTime, uResY: shared.uResY, uGap: { value: meteorGap }, uSlots: { value: nSlots }, uGold: cu(PALETTE[4]), uCream: cu(PALETTE[5]), uOrange: cu(PALETTE[3]) },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute float aSlot; uniform float uTime, uGap, uSlots, uResY; varying vec4 vM;
        float h2(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
        vec3 dirOf(vec2 ae){ return vec3(sin(ae.x) * cos(ae.y), sin(ae.y), -cos(ae.x) * cos(ae.y)); }
        void main(){
          float T = uGap * uSlots, tt = uTime + aSlot * uGap + 41.3, cyc = floor(tt / T), t = tt - cyc * T;
          float r1 = h2(vec2(aSlot + 1.3, cyc)), r2 = h2(vec2(cyc + 5.1, aSlot + 9.)), r3 = h2(vec2(aSlot + 21., cyc + 2.7)), r4 = h2(vec2(cyc, aSlot + 31.7));
          float life = min(2.6 + 1.0 * r3, T * 0.95), tau = t / life;      // slow gold ribbons
          vec2 a0 = vec2((r1 - 0.5) * 0.90, 0.10 + 0.07 * r2), da = vec2(sin((r4 - 0.5) * 1.7), -cos((r4 - 0.5) * 1.7));
          float len = (0.060 + 0.030 * r1) * smoothstep(0., 0.3, tau);      // 3.4 to 5.2 degrees long (the brief's 3 to 5)
          vec2 ae = a0 + da * (tau * (0.075 + 0.04 * r3) - position.x * len);
          mat4 PV = projectionMatrix * viewMatrix;
          vec4 c1 = PV * vec4(cameraPosition + dirOf(ae) * 4200., 1.), c2 = PV * vec4(cameraPosition + dirOf(ae + da * 0.004) * 4200., 1.);
          float asp = projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4);
          vec2 sd = (c2.xy / max(c2.w, 1e-3) - c1.xy / max(c1.w, 1e-3)) * vec2(asp, 1.); float sl = length(sd); sd = sl > 1e-6 ? sd / sl : vec2(0., 1.);
          float w = (2.0 + 1.0 * r2) * mix(1., 0.3, position.x) * 2. / max(uResY, 100.) * (tau < 1. ? 1. : 0.);
          c1.xy += vec2(-sd.y / asp, sd.x) * position.y * w * c1.w;
          // (polish 5) a ribbon is never cut by the frame: it dims as either end of it nears the edge of the picture
          vec2 trv = da * (tau * (0.075 + 0.04 * r3));
          vec4 eH = PV * vec4(cameraPosition + dirOf(a0 + trv) * 4200., 1.), eT = PV * vec4(cameraPosition + dirOf(a0 + trv - da * len) * 4200., 1.);
          vec2 nH = abs(eH.xy) / max(eH.w, 1e-3), nT = abs(eT.xy) / max(eT.w, 1e-3);
          float inF = (eH.w > 0. && eT.w > 0.) ? (1. - smoothstep(0.80, 0.96, max(max(nH.x, nH.y), max(nT.x, nT.y)))) : 0.;
          vM = vec4(position.x, position.y, tau, inF);
          gl_Position = c1;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uGold, uCream, uOrange; varying vec4 vM;
        void main(){
          float k = pow(max(1. - vM.x, 0.), 2.2);
          float a = k * (1. - vM.y * vM.y) * smoothstep(0., 0.12, vM.z) * (1. - smoothstep(0.6, 1., vM.z)) * clamp(vM.w, 0., 1.);
          vec3 c = mix(uOrange * 0.9, uGold * 1.6 + uCream * 1.2, k);
          gl_FragColor = vec4(c * a, 1.);
        }`,
    }));
    meteors.frustumCulled = false; meteors.renderOrder = 4; meteors.name = 'meteors';
    scene.add(meteors);

    // ---- embers lifting past the lens: the only thing carried with the camera, so it lives in one group
    const carried = new THREE.Group(); carried.name = 'carried';
    const nEmb = Math.max(60, Math.round(400 * detail * density)), eg = quad(), es = new Float32Array(nEmb * 4), erng = rng.fork('embers');
    for (let i = 0; i < nEmb * 4; i++) es[i] = erng();
    eg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(es, 4)); eg.instanceCount = nEmb;
    const embers = new THREE.Mesh(eg, new THREE.ShaderMaterial({
      uniforms: { uTime: skyU.uTime, uResY: shared.uResY, uGold: cu(PALETTE[4]), uOrange: cu(PALETTE[3]) },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aSeed; uniform float uTime, uResY; varying vec3 vE;
        void main(){
          vec3 box = vec3(64., 26., 64.);
          vec3 fwd = -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]), ctr = cameraPosition + fwd * 48.;
          vec3 b = aSeed.xyz * box + vec3(sin(uTime * 0.5 + aSeed.w * 30.) * 1.4, uTime * (0.8 + 1.5 * aSeed.w), cos(uTime * 0.4 + aSeed.w * 17.) * 1.4);
          vec3 wv = mod(b - ctr, box), p = ctr + wv - 0.5 * box, e = wv / box;
          float fade = smoothstep(0., 0.14, e.x) * (1. - smoothstep(0.86, 1., e.x)) * smoothstep(0., 0.14, e.y) * (1. - smoothstep(0.86, 1., e.y)) * smoothstep(0., 0.14, e.z) * (1. - smoothstep(0.86, 1., e.z));
          vec4 mv = viewMatrix * vec4(p, 1.);
          float px = -mv.z * 2. / (projectionMatrix[1][1] * max(uResY, 100.));
          float sz = max(0.035 + 0.06 * aSeed.w * aSeed.x, px * 0.9);
          mv.xy += vec2(position.x * 2. - 1., position.y) * sz;
          vE = vec3(position.x * 2. - 1., position.y, fade * (0.65 + 0.35 * sin(uTime * (1. + 2. * aSeed.y) + aSeed.z * 50.)) * min(1., (0.035 + 0.06 * aSeed.w * aSeed.x) / sz + 0.3));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uGold, uOrange; varying vec3 vE;
        void main(){ float d = max(1. - dot(vE.xy, vE.xy), 0.); gl_FragColor = vec4(mix(uOrange, uGold * 1.6, d) * d * d * vE.z * 1.6, 1.); }`,
    }));
    embers.frustumCulled = false; embers.renderOrder = 5;
    carried.add(embers); scene.add(carried);
    await ctx.yield();

    // ---- the flight
    const pA = new THREE.Vector3(), pB = new THREE.Vector3(), camP = new THREE.Vector3();
    // THE GAZE: level always (the long lens must not nod as the route climbs and falls), and turned by a programme of its
    // own so that the Moon crosses the frame: degrees right of the Moon, by u
    const gazeAz = keyed([[0, 5], [0.08, -4], [0.16, 10.5], [0.25, -12.5], [0.34, 0], [0.46, 0], [0.52, -5], [0.565, -9], [0.61, -15], [0.655, 6], [0.70, 13], [0.79, 12.5], [0.86, 12], [1, 12]]);      // (polish 5) out of the look-down the lens swings to the tent as it lifts: the Moon at the left, the tent at the right, both whole (u 0.655)
    const gazeUp = keyed([[0, 0], [0.10, 0], [0.16, 2.4], [0.22, 0], [0.525, 0], [0.567, -0.5], [0.603, -12], [0.617, -12], [0.653, -0.7], [0.70, -0.3], [1, 0]]);      // (polish 5) the dive is one short nod about u 0.61: the Moon is whole in the frame until u 0.567 and again from u 0.653      // (polish 4) and at the top of the second rise the lens tips DOWN twelve degrees: no sky, no Moon, the burning sea as a floor with the Moon's road on it; then it lifts and the Moon and the tent come in together      // a degree or two up through the banked turns, so the Moon stays whole in the corner of the frame
    const levelGaze = (time, u) => { const az = gazeAz(u) * DEG; path.pointAt(u, pA); pA.x += Math.sin(az) * 3000; pA.z -= Math.cos(az) * 3000; pA.y += Math.tan(gazeUp(u) * DEG) * 3000; return pA; };
    const pace = (u) => 0.93 + 0.17 * smoothstep(0.50, 0.60, u) - 0.10 * smoothstep(0.82, 0.90, u);      // a little slower through the breaking and the gate, a little faster over the open sea
    // the hero's own clock, by metres from the gate: the tipper stands as we come within 250 m of it, the gate is up by
    // 150 m out, and its plates open, flood and turn gold as we pass
    const uAt = (d) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (-path.pointAt(m, pA).z < d) lo = m; else hi = m; } return (lo + hi) / 2; };
    const HP = [[uAt(GATE_D - 540), 0], [uAt(GATE_D - 384), 0.22], [uAt(GATE_D - 240), 0.6], [uAt(GATE_D + 35), 1]];
    const heroP = (u) => { if (u <= HP[0][0]) return 0; for (let i = 0; i < 3; i++) if (u <= HP[i + 1][0]) return lerp(HP[i][1], HP[i + 1][1], (u - HP[i][0]) / (HP[i + 1][0] - HP[i][0])); return 1; };
    const scar = moonU.uMoonScar.value;
    scar.set(0.24 + 0.2 * rng(), 0.10 + 0.3 * rng(), 0, 0);
    const update = (dt, time, camera, u) => {
      shared.uSwell.value.x = crestAt(u);
      camD.value = -path.pointAt(u, pA).z;
      hero.setProgress(heroP(u));
      hero.setEarthGlow(smoothstep(0.05, 0.55, u));
      hero.update(dt, time, camera);
      tent.update(dt, time);
      skyU.uTime.value = time; skyU.uWarm.value = 0.2 + 0.8 * smoothstep(0.30, 0.68, u);
      camP.setFromMatrixPosition(camera.matrixWorld);
      sky.position.copy(camP);
      if (rare) { scar.z = 0.25 * smoothstep(0.13, 0.275, u); scar.w = smoothstep(0.127, 0.132, u) * (1 - smoothstep(0.132, 0.152, u)); }
      carried.visible = u > 0 && !ctx.through;
    };
    return {
      scene, path, duration: 46, pace,
      title: 'The Ember Moon · 4.5 billion years ago',
      camera: { fov: 22, near: 1, far: 6000, lookAhead: 120, sway: 0, bank: 0.6 },
      pois: [{ at: levelGaze, from: 0, to: 1, fade: 0.04, weight: 1 }],     // a level gaze: the long lens must not nod as the route climbs and falls
      portal: { shape: 'circle', radius: 7, color: '#D9D4EC', glow: 0.7, revealDistance: 520 },      // (polish 4: glow 0.7; at 1 the ring's halo clipped to flat white inside the tent)
      // the grade's contrast pivots on mid grey and takes 0.03 off every dark: this shadow tint gives it back, so blacks hold at violet
      post: { exposure: 1.0, bloom: { strength: 0.45, radius: 0.34, threshold: 1.4 },
        grade: { saturation: 1.05, contrast: 1.06, tint: '#ffffff', shadowTint: '#48474b', vignette: 0.3, grain: 0.03 } },
      ride: 'none', companion: 'none', style: 'none',
      update,
      dispose() {},
    };
  },
};
