// The Brick That Outgrew the Cloud. A world landscape in oil on oak panel, after Pieter Bruegel the Elder.
// A free flight over a brown gabled town, through a harbour's rigging, up beside the half-built spiral tower the size of
// a mountain (standing off its wall, then over the ramp past the near treadwheel crane), out over the roads and about,
// so that the whole flank stands in the frame with its cut side open (ring inside ring of red brick vault), back along
// the cut above its floor, through the cloud on the far shoulder, along the top ledge, out and round to see the whole
// summit standing above the cloud, and in along the top ring to the arch where the last stone is going in.
//
// Flat pigments (post.flat: no tone map, a hex written is the hex shown). One unlit material family from the hero's
// part file: two authored tones per surface and a third for cast shadow; distance changes the pigment (brown, green,
// blue in rings round the eye), never the sharpness. The land is a bowl whose rim lifts with the eye, so the horizon
// stays two thirds up the frame from 55 m and from 480 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import {
  buildHero, PALETTE, STYLE_UNIFORMS, STYLE_DECL, STYLE_GLSL, bruegelMaterial, contourMaterial, addHullNormals,
  ribbonMaterial, makeRibbons, makePaint, makeInstances, makePigments, mixHex, figureMaterial, makeFigures,
  cloudMaterial, cloudGeometry, cloudGeometrySteps,
} from '../parts/brick-outgrows-the-cloud.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;
const TOWER = V(0, 0, 1200);
const hx = (c) => (typeof c === 'string' ? c : '#' + c.getHexString());
const mix = (a, b, t) => mixHex(hx(a), hx(b), t);      // mixes two pigments (hex or Color) as paint
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// Where the land ends: the sea lies to starboard (world -X) of this line; the harbour basin bites in to the tower's foot.
// The same function is written in GLSL (COAST_GLSL) for the ground's material.
function coastX(z) {
  const dz = Math.abs(z - 1200);
  let x = -235 + 60 * Math.sin(z * 0.004) + 30 * Math.sin(z * 0.011 + 1.0);
  x += 330 * sstep(596, 620, z) + 520 * sstep(1420, 1800, z) * (1 - sstep(2500, 3100, z));
  x += sstep(1700, 4200, dz) * (900 * Math.sin(z * 0.00062 + 2.2) + 380 * Math.sin(z * 0.0017 + 0.4));
  return x;
}
const COAST_GLSL = /* glsl */`
float coastX(float z) {
  float dz = abs(z - 1200.0);
  float x = -235.0 + 60.0 * sin(z * 0.004) + 30.0 * sin(z * 0.011 + 1.0);
  x += 330.0 * smoothstep(596.0, 620.0, z) + 520.0 * smoothstep(1420.0, 1800.0, z) * (1.0 - smoothstep(2500.0, 3100.0, z));
  x += smoothstep(1700.0, 4200.0, dz) * (900.0 * sin(z * 0.00062 + 2.2) + 380.0 * sin(z * 0.0017 + 0.4));
  return x;
}`;
// A tongue of land across the roads to starboard (strip fields, a hamlet, mills): negative inside, in metres. Also in GLSL.
function spitSD(x, z) {
  const px = x + 1000, pz = z - 1500, qx = (0.96 * px + 0.28 * pz) / 190, qz = (-0.28 * px + 0.96 * pz) / 760;
  return (Math.hypot(qx, qz) * (1 + 0.13 * Math.sin(z * 0.013) + 0.08 * Math.sin(x * 0.021 + 1)) - 1) * 190;
}
const isLand = (x, z, margin = 0) => x > coastX(z) + margin || spitSD(x, z) < -margin;
// The tipped-up earth (the part's bowlLift, in JS): flat within 1.2 km of the tower, rising to rim at 9 km.
function bowlY(x, z, rim) {
  const s = Math.min(1.3, Math.max(0, (Math.hypot(x - TOWER.x, z - TOWER.z) - 1200) / 7800));
  return rim * (0.3 * s + 0.7 * s * s);
}

export default {
  id: 'brick-outgrows-the-cloud',
  name: 'The Brick That Outgrew the Cloud',
  category: 'artists',
  placeKind: 'city',
  after: 'Pieter Bruegel the Elder, about 1525 to 1569',
  weirdness: 0.5,
  media: ['air', 'open'],

  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = vary.density ?? 1, U = STYLE_UNIFORMS, pal = PALETTE;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(pal[4]);

    // ---- the edition (seeded): clear afternoon, harvest evening, the dark panel; a squall; the cast ----
    const vr = rng.fork('edition');
    const pick = vr();
    let edition = 'clear';
    if (vary.hour === 'night') edition = 'dark';
    else if (vary.hour === 'golden' || vary.hour === 'dawn') edition = 'harvest';
    else if (vary.hour === 'day') edition = pick < 0.2 ? 'dark' : 'clear';
    else edition = pick < 0.2 ? 'dark' : pick < 0.55 ? 'harvest' : 'clear';
    const squall = edition === 'dark' ? vr() < 0.7 : vr() < 0.3;
    const cast = { oxen: vr() < 0.5, hulks: vr() < 0.6 };
    const rare = !!vary.rare;
    const dark = edition === 'dark', harvest = edition === 'harvest';
    const pig = makePigments(pal);
    const tick = [];      // per-frame jobs: (dt, time, camera, u, eye)

    // ---- the hero: the tower, placed with its front down the entry course ----
    const hero = await buildHero(ctx, { palette: pal, detail, stoneTo: dark ? 2.1 : harvest ? 5.3 + 0.5 * vr() : 3.5 + 0.9 * vr(), keepLight: true });
    hero.object.position.copy(TOWER); hero.object.rotation.y = Math.PI;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const A = hero.anchors, fly = A.flyThrough.map(toWorld);
    // the light: from starboard and behind at entry, 40 degrees up; harvest evening: low, from port
    const lightDir = harvest ? V(0.80, 0.34, -0.50).normalize() : V(-0.55, 0.64, -0.53).normalize();
    U.uLight.value.copy(lightDir);

    // the cloud's course (world xz of its centre, by u): on the shoulder at entry, out over the roads, then it sweeps
    // up the starboard flank so that its shadow overtakes us on the ramp, and settles on the far shoulder where we cross it
    const cloudKeys = [[0, -330, 392, 1140], [0.3, -300, 392, 900], [0.53, -247, 392, 578], [0.62, -469, 392, 963], [0.6295, -420, 385, 1640], [0.80, -310, 340, 1800], [0.92, -330, 312, 1830], [1, -350, 306, 1860]];
    const _ck = new THREE.Vector3(), cloudSway = new THREE.Vector2();      // the sway is idle drift on the clock, set in update()
    hero.cloud.scale.set(1, 1.5, 1);
    hero.cloud.material.uniforms.uUnder.value.copy(mix(pal[6], pal[4], 0.6));
    hero.cloudAt = (u, out) => {
      let i = 0; while (i < cloudKeys.length - 2 && u > cloudKeys[i + 1][0]) i++;
      const a = cloudKeys[i], b = cloudKeys[i + 1], t = sstep(0, 1, (u - a[0]) / (b[0] - a[0]));
      _ck.set(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t);
      return out.set(-(_ck.x + cloudSway.x - TOWER.x), _ck.y, -(_ck.z + cloudSway.y - TOWER.z));      // world -> the hero's local frame (turned by PI)
    };

    // ---- the flight ----
    const pts = [
      [0, 55, 0], [0, 55, 65], [0, 54, 130], [0, 50, 250], [0, 40, 380], [0, 25, 520], [0, 15, 610], [-7, 15, 672],
      [-30, 28, 728], [-82, 58, 792], [-150, 96, 858], [-212, 132, 928], [-262, 156, 1000],      // the climb stands 40 to 80 m off the wall, so the arcades run away in rows beside us
    ].map((p) => V(p[0], p[1], p[2]));
    for (let i = 5; i <= 7; i++) pts.push(fly[i]);      // the ramp, as far as the near crane
    // THE SWING OUT. The course does not climb the cut from its mouth with the eye on the sky: past the crane it leaves the
    // ledge to starboard, runs out over the roads, comes about and returns with the whole flank standing in the frame (the
    // tiers, the cut side ring inside ring, the cloud on the shoulder, the fleet under it), then passes along the cut above
    // its floor, the sliced rings to port and under the eye, and climbs round the far shoulder into the cloud. Points are
    // world metres, kept clear of the tier faces and of the standing piers.
    const swing = [[-290, 168, 1218], [-335, 174, 1245], [-395, 184, 1250], [-450, 198, 1240], [-492, 214, 1256], [-502, 230, 1296], [-475, 246, 1332], [-420, 260, 1343], [-350, 277, 1336], [-280, 295, 1322], [-195, 316, 1322], [-140, 334, 1352], [-95, 356, 1408], [-45, 385, 1418], [10, 404, 1398], [55, 413, 1384]].map((q) => V(q[0], q[1], q[2]));
    pts.push(...swing);
    const seat = toWorld(A.portalSeat.position), mouth = toWorld(A.archMouth), appr = toWorld(A.approach);
    // Out of the cloud the course runs close along the top ledge (the rising arcade, huts and men near), then leaves it,
    // turns over the cloud deck and comes back with the summit standing whole above the cloud (crag, the top ring, the
    // arch and its crane), then down the ring to the arch. World metres.
    const exc = [[105, 420, 1405], [150, 428, 1455], [205, 434, 1505], [270, 435, 1502], [300, 428, 1445], [255, 418, 1360], [200, 412, 1310]].map((o) => V(o[0], o[1], o[2]));
    pts.push(...exc, appr, appr.clone().lerp(mouth, 0.5), mouth, seat);
    await ctx.yield();
    const path = makePath(pts, { samples: 480 });
    await ctx.yield();
    // The brief's clock: scripted moments (and the hero's own births) are written in the brief's u; this path is a little
    // shorter before the ramp and in the bite, so real u is mapped onto it at the landmarks (quay, climb, ramp, bite, cloud).
    // The landmarks are found on the path itself, so the clock stays true if the course is redrawn.
    const _np = new THREE.Vector3(), uNear = (pt, lo, hi) => { let bu = lo, bd = 1e9; for (let i = 0; i <= 400; i++) { const uu = lo + (hi - lo) * i / 400, d = path.pointAt(uu, _np).distanceTo(pt); if (d < bd) { bd = d; bu = uu; } } return bu; };
    const uQuay = uNear(pts[6], 0.15, 0.45), uClimb = uNear(pts[7], uQuay, 0.5), uRamp = uNear(fly[2], uClimb, 0.7), uBite = uNear(toWorld(A.biteMouth), uRamp, 0.8) - 14 / path.length, uHead = uNear(swing[14], uBite + 0.1, 0.95);      // the cloud is crossed on the far shoulder, so that from the turn beyond it lies beside the summit, not across it
    await ctx.yield();
    const uSw = (i) => uNear(swing[i], uRamp, uHead + 0.02);      // real u at the swing's i-th point
    const uTurn = uNear(exc[4], uHead, 0.98);      // where the long leg back toward the summit begins
    const KR = [0, uQuay, uClimb, uRamp, uBite, uSw(5), uHead, uHead + 62 / path.length, 1], KB = [0, 0.29, 0.40, 0.49, 0.62, 0.63, 0.84, 0.89, 1];      // the brief's bite (0.63 to 0.84) is the leg back toward the flank and along the cut: the pallet races up its rope while we look at it
    const remap = (x, from, to) => { let i = 0; while (i < from.length - 2 && x > from[i + 1]) i++; return to[i] + (to[i + 1] - to[i]) * Math.min(1, Math.max(0, (x - from[i]) / (from[i + 1] - from[i]))); };
    const toBrief = (u) => remap(u, KR, KB), toReal = (ub) => remap(ub, KB, KR);
    await ctx.yield();

    // ---- the sky: five flat steps from lead white at the high horizon to thin blue-grey; no sun, ever ----
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color(pal[4]) }, uLow: { value: new THREE.Color(pal[6]) }, uDark: { value: dark ? 1 : 0 } },
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`
        varying vec3 vD;
        void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uLow; uniform float uDark; varying vec3 vD;
        void main() {
          vec3 d = vD / max(length(vD), 1e-4);
          float az = atan(d.z, abs(d.x) + abs(d.z) < 1e-5 ? 1.0 : d.x);
          float wob = 0.0025 * sin(az * 7.0 + 1.3) + 0.0015 * sin(az * 17.0);
          float t = clamp((d.y - 0.2 + wob) / 0.52, 0.0, 0.999);
          // five tones from lead white up to thin blue-grey, each melting into the next (a pale graded sky, no poster steps)
          float bi = floor(t * 5.0), bf = smoothstep(0.3, 1.0, fract(t * 5.0));
          float b0 = bi < 0.5 ? 0.0 : (bi < 1.5 ? 0.1 : (bi < 2.5 ? 0.27 : (bi < 3.5 ? 0.55 : 1.0)));
          float b1 = bi < 0.5 ? 0.1 : (bi < 1.5 ? 0.27 : (bi < 2.5 ? 0.55 : 1.0));
          float band = mix(b0, b1, bf);
          vec3 c = mix(uLow, uTop, band);
          c = mix(c, mix(uTop, uLow, 0.25 + 0.5 * (1.0 - band)), uDark * 0.55);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), skyMat);
    sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    // ---- the land: a bowl of strip fields, hedges and sea, drawn in one material from world position ----
    const gp = [], gi = [], RINGS = [0, 120, 240, 360, 480, 600, 760, 940, 1200, 1500, 1900, 2400, 3000, 3700, 4500, 5400, 6400, 7500, 8700, 10000, 11400], SECT = 96;
    for (let r = 0; r < RINGS.length; r++) for (let k = 0; k <= SECT; k++) {
      const a = k / SECT * Math.PI * 2; gp.push(TOWER.x + Math.sin(a) * RINGS[r], -0.06, TOWER.z + Math.cos(a) * RINGS[r]);
    }
    for (let r = 0; r < RINGS.length - 1; r++) for (let k = 0; k < SECT; k++) {
      const a = r * (SECT + 1) + k, b = a + 1, c = a + SECT + 1, d = c + 1; gi.push(a, d, b, a, c, d);
    }
    await ctx.yield();
    const groundGeo = new THREE.BufferGeometry();
    groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); groundGeo.setIndex(gi);
    const fieldTones = [mix(pal[0], pal[2], harvest ? 0.12 : 0.3), new THREE.Color(pal[2]), mix(pal[3], pal[2], 0.4), mix(pal[3], pal[0], 0.4), mix(pal[2], '#3B2A14', 0.45)];
    const groundMat = new THREE.ShaderMaterial({
      uniforms: {
        ...U, uT0: { value: fieldTones[0] }, uT1: { value: fieldTones[1] }, uT2: { value: fieldTones[2] }, uT3: { value: fieldTones[3] }, uT4: { value: fieldTones[4] },
        uSea: { value: new THREE.Color(pal[5]) }, uSeaL: { value: mix(pal[5], pal[4], 0.55) }, uWhite: { value: new THREE.Color(pal[6]) },
        uHarvest: { value: harvest ? 1 : 0 }, uCaps: { value: dark ? 1 : 0 },
      },
      defines: { TOWER_SHADOW: 1 },
      vertexShader: STYLE_DECL + /* glsl */`
        varying vec3 vW;
        void main() { vec4 wp = modelMatrix * vec4(position, 1.0); wp.y += bowlLift(wp.xz); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: STYLE_GLSL + COAST_GLSL + /* glsl */`
        uniform vec3 uT0, uT1, uT2, uT3, uT4, uSea, uSeaL, uWhite; uniform float uHarvest, uCaps;
        varying vec3 vW;
        void main() {
          vec2 p = vW.xz;
          float fwp = max(fwidth(p.x) + fwidth(p.y), 1e-4);
          // strip fields: blocks 260 m square, each ruled one way or the other into strips, a hedge on every bound
          vec2 q0 = vec2(0.94 * p.x + 0.34 * p.y, -0.34 * p.x + 0.94 * p.y) + 40.0 * sin(p.yx * 0.0031);
          vec2 blk = floor(q0 / 260.0);
          float turn = step(0.5, bHash(blk + 3.0));
          vec2 q = mix(q0, q0.yx, turn);
          float sw = 22.0 + 18.0 * bHash(blk + 9.0);
          float strip = floor(q.x / sw);
          float h = bHash(vec2(strip, blk.x * 7.0 + blk.y * 13.0));
          float town = 1.0 - smoothstep(520.0, 560.0, length((p - vec2(150.0, 290.0)) * vec2(0.85, 1.0)));
          vec3 c = h < 0.34 ? uT0 : (h < 0.48 ? uT1 : (h < 0.72 ? uT2 : uT3));
          c = mix(c, uT0, uHarvest * step(0.45, h) * step(h, 0.7));
          vec2 tq = q0 / vec2(17.0, 23.0), tc = floor(tq);
          float th = bHash(tc + 21.0);
          vec3 earth = th < 0.4 ? mix(uT1, uT0, 0.14) : (th < 0.7 ? uT1 : (th < 0.88 ? mix(uT1, uT4, 0.3) : mix(uT2, uT1, 0.55)));
          float plot = max(ruled(q0.x, 17.0, 1.1), ruled(q0.y, 23.0, 1.1));
          float bed = ruled(th < 0.5 ? q0.x : q0.y, 1.9, 0.35) * step(0.55, th);
          earth = mix(earth, uUmber2, max(0.55 * plot, 0.3 * bed));
          c = mix(c, earth, town);
          float fur = ruled(q.y, 1.6, 0.3) * step(0.34, h) * step(h, 0.48) * (1.0 - town);
          c = mix(c, uUmber2, 0.3 * fur);
          float stook = ruled(q.y, 7.0, 1.6) * ruled(q.x + 3.5 * mod(floor(q.y / 7.0), 2.0), 7.0, 1.6) * step(h, 0.34) * (1.0 - town);
          c = mix(c, uT4, 0.9 * stook * (0.35 + 0.65 * uHarvest));
          float hedge = max(ruled(q.x, sw, 2.2), max(ruled(q0.x, 260.0, 4.0), ruled(q0.y, 260.0, 4.0))) * (1.0 - town);
          c = mix(c, mix(uT4, uT2, 0.35), 0.85 * hedge);
          // the sea: deep azurite with small exact wave marks; a pale band of shallows along the shore
          float cx = coastX(p.y);
          float sd = cx - p.x;
          float isl = sin(p.x * 0.0011 + 1.7) * sin(p.y * 0.0013 + 0.4) + 0.5 * sin(p.x * 0.0031) * sin(p.y * 0.0027 + 2.0) + 0.12 * sin(p.x * 0.011 + p.y * 0.007);
          sd = min(sd, (1.02 - isl) * 420.0 + 3000.0 * (1.0 - smoothstep(1700.0, 2600.0, length(p - uTowerPos.xz))));
          vec2 sp0 = p - vec2(-1000.0, 1500.0), sp1 = vec2(0.96 * sp0.x + 0.28 * sp0.y, -0.28 * sp0.x + 0.96 * sp0.y) / vec2(190.0, 760.0);
          float spit = (length(sp1) * (1.0 + 0.13 * sin(p.y * 0.013) + 0.08 * sin(p.x * 0.021 + 1.0)) - 1.0) * 190.0;      // the tongue of land across the roads
          float shoal = step(min(sd, spit), 14.0 + 5.0 * sin(p.y * 0.07)) * step(spit, sd);
          sd = min(sd, spit);
          vec3 s = mix(uSea, uSeaL, 0.1);
          s = mix(s, mix(uSea, uSeaL, 0.5), max(shoal, step(sd, 14.0 + 5.0 * sin(p.y * 0.07)) * step(1200.0, length(p - uTowerPos.xz) + 900.0)));
          float shs = max(max(cloudShadow(vW), towerShadow(vW)), driftShadow(vec3(p.x, 0.0, p.y)));      // the sea takes the same drifting shadows as the land
          s = mix(s, s * 0.74, shs);
          vec3 seaC = pigmentDistance(s, vW, 0.6);
          float mk = 0.0, cap = 0.0;
          for (int i = 0; i < 5; i++) {
            float fi = float(i);
            vec2 cell = vec2(9.0, 4.2) * (i == 0 ? 1.0 : (i == 1 ? 2.2 : (i == 2 ? 4.8 : (i == 3 ? 10.5 : 23.0))));
            float sp = 2.6 + 2.4 * fi;
            vec2 wq = vec2(p.x * 0.5 + p.y * (0.12 - 0.09 * fi) + uTime * sp, p.y + 0.12 * cell.y * sin(uTime * 0.9 + p.x * 0.4 / cell.x)) / cell;
            vec2 wc = floor(wq), wf = fract(wq);
            float wh = bHash(wc + 17.0 * fi);
            float vis = smoothstep(2.0, 3.0, cell.y / fwp) * (i == 0 ? 1.0 : 1.0 - smoothstep(4.6, 6.6, cell.y / fwp));
            float d = step(0.45, wh) * step(abs(wf.y - 0.5), 0.15 + 0.05 * sin(uTime * 1.3 + wh * 40.0)) * step(abs(wf.x - 0.5), 0.26 + 0.14 * fract(wh * 7.0)) * vis;
            mk = max(mk, d); cap = max(cap, d * step(0.88, wh));
          }
          seaC = mix(seaC, mix(mix(seaC, uWhite, 0.3), uWhite, uCaps * cap), mk);
          vec3 land = bruegel(c, c, vec3(0.0, 1.0, 0.0), vW, vec2(0.0), 0.0, 1.0);
          float isSea = smoothstep(-0.5 * fwp, 0.5 * fwp, sd);
          gl_FragColor = vec4(mix(land, seaC, isSea), 1.0);
        }`,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat); ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- the town: stepped gables in brown brick under red tile, in rows along lanes ----
    const brown = (k) => [mix(pal[2], pal[1], k), mix(mix(pal[2], pal[1], k), '#3B2A14', 0.5)];
    const wallPigs = [brown(0.35), brown(0.15), brown(0.55), pig.thatch, [mix(pal[0], pal[2], 0.25), mix(pal[2], '#3B2A14', 0.35)], pig.lime];
    const tile = [mix(pal[1], pal[2], 0.72), mix(mix(pal[1], pal[2], 0.72), '#3B2A14', 0.5)], redTile = [mix(pal[1], pal[0], 0.1), mix(pal[1], '#3B2A14', 0.45)], slate = [mix(pal[2], pal[4], 0.35), mix(pal[2], '#3B2A14', 0.6)];
    const gableGeo = (roof) => {
      const g = makePaint(), W = 3.5, L = 5.5, E = 6, R = 11, dk = pig.dark;
      g.poly([V(W, 0, L), V(W, 0, -L), V(W, E, -L), V(W, E, L)], pig.stone, 1, 1);
      g.poly([V(-W, 0, -L), V(-W, 0, L), V(-W, E, L), V(-W, E, -L)], pig.stone, 1, 1);
      g.poly([V(W + 0.3, E - 0.2, L - 0.3), V(W + 0.3, E - 0.2, -L + 0.3), V(0, R, -L + 0.3), V(0, R, L - 0.3)], roof, 0, 0);
      g.poly([V(-W - 0.3, E - 0.2, -L + 0.3), V(-W - 0.3, E - 0.2, L - 0.3), V(0, R, L - 0.3), V(0, R, -L + 0.3)], roof, 0, 0);
      for (const s of [1, -1]) {
        const z = s * L, steps = [[W, 0, 6.8], [2.6, 6.8, 8.2], [1.7, 8.2, 9.6], [0.8, 9.6, 11.5]];
        for (const [w, y0, y1] of steps) {
          const q = [V(-w, y0, z), V(w, y0, z), V(w, y1, z), V(-w, y1, z)];
          g.poly(s > 0 ? q : q.reverse(), pig.stone, 1, 1);
        }
        const zz = z + s * 0.06, mk = (x0, y0, x1, y1) => { const q = [V(x0, y0, zz), V(x1, y0, zz), V(x1, y1, zz), V(x0, y1, zz)]; g.poly(s > 0 ? q : q.reverse(), dk, 0, 0); };
        mk(-0.7, 0, 0.7, 2.3); mk(-2.5, 3.4, -1.3, 5.0); mk(1.3, 3.4, 2.5, 5.0); mk(-0.5, 7.2, 0.5, 8.6);
      }
      return g.build();
    };
    const hullGeo = (() => {      // the contour's hull: body and roof as one closed lump
      const g = makePaint(), W = 3.5, L = 5.5, E = 6, R = 11.5, d = pig.dark;
      g.box(-W, 0, -L, W, E, L, d, 0, 0, null, 'bt');
      g.poly([V(W, E, L), V(W, E, -L), V(0, R, -L), V(0, R, L)], d); g.poly([V(-W, E, -L), V(-W, E, L), V(0, R, L), V(0, R, -L)], d);
      g.poly([V(-W, E, L), V(W, E, L), V(0, R, L)], d); g.poly([V(W, E, -L), V(-W, E, -L), V(0, R, -L)], d);
      return addHullNormals(g.build());
    })();
    const townAt = (x, z) => Math.hypot((x - 150) * 0.85, z - 290);
    const gabT = makeInstances(), gabS = makeInstances(), gabR = makeInstances(), gabH = makeInstances(), occ = new Set(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
    const YAX = V(0, 1, 0), key = (x, z) => Math.round(x / 6) + ':' + Math.round(z / 6);
    const churchAt = [], pc = path.pointAt(0.115);
    churchAt.push([pc.x + 21, pc.z, 70, 0.1], [290, 470, 52, 1.2], [430, 120, 46, -0.4]);
    const freeAt = (x, z, ridge) => {
      if (x < coastX(z) + 14 || Math.hypot(x - TOWER.x, z - TOWER.z) < 372) return false;
      for (const c of churchAt) if (Math.hypot(x - c[0], z - c[1]) < 34) return false;
      const n = path.nearestXZ(x, z);
      return !(n.dist < 13 && n.y - ridge < 9);
    };
    const tr = rng.fork('town'), nGable = Math.round(1920 * Math.min(1.15, 0.75 + 0.25 * density) * (0.6 + 0.4 * detail));
    let laid = 0, tries = 0;
    const mainA = 0.22 + tr.range(-0.1, 0.1);
    while (laid < nGable && tries < 1500) {
      tries++;
      // a lane: houses stand side by side along it, gable ends to the street
      const ox = 150 + tr.gauss() * 250, oz = 290 + tr.gauss() * 230, far = townAt(ox, oz);
      if (far > 500) continue;
      const ang = mainA + (tr() < 0.5 ? 0 : Math.PI / 2) + tr.range(-0.12, 0.12), dx = Math.cos(ang), dz = Math.sin(ang), len = tr.range(90, 320), hw = tr.range(2.6, 4.0);
      for (const side of [1, -1]) {
        let t = -len / 2;
        while (t < len / 2 && laid < nGable) {
          const sc = tr.range(0.8, 1.3), w = 7.4 * sc * tr.range(0.85, 1.1), sy = sc * tr.range(0.8, 1.35), L = 5.5 * sc * tr.range(0.9, 1.5);
          t += w / 2;
          const x = ox + dx * t - dz * side * (hw + L), z = oz + dz * t + dx * side * (hw + L);
          t += w / 2 + (tr() < 0.12 ? tr.range(3, 9) : 0.3);
          const k0 = key(x, z), k1 = key(x - dz * L * 0.7, z + dx * L * 0.7), k2 = key(x + dz * L * 0.7, z - dx * L * 0.7);
          if (occ.has(k0) || occ.has(k1) || occ.has(k2) || !freeAt(x, z, 11.5 * sy) || townAt(x, z) > 520) continue;
          occ.add(k0); occ.add(k1); occ.add(k2);
          // local z (the ridge) lies across the street: rotate so that +z points away from the lane
          q4.setFromAxisAngle(YAX, Math.atan2(-dz * side, dx * side) + tr.range(-0.05, 0.05));
          m4.compose(p4.set(x, 0, z), q4, s4.set(w / 7, sy, L / 5.5));
          const wp = tr() < 0.72 ? wallPigs[tr.int(0, 2)] : tr.pick(wallPigs);
          { const rr = tr(); (rr < 0.74 ? gabT : rr < 0.9 ? gabS : gabR).add(m4, wp, 1, -1, tr()); }
          gabH.add(m4, pig.dark, 0, -1, 0);
          laid++;
        }
      }
      if (tries % 3 === 0) await ctx.yield();
    }
    // ---- two hamlets, their gables twice life size so that they are counted from far off: one on the tongue of land across
    // the roads (seen from the ramp), one east of the tower's foot (seen from the top ring) ----
    const hr = rng.fork('hamlets'), hamlets = [];
    const layLane = (ox, oz, ang, len, scK) => {
      const dx = Math.cos(ang), dz = Math.sin(ang), hw = hr.range(3, 4.5) * scK;
      for (const side of [1, -1]) {
        let t = -len / 2;
        while (t < len / 2) {
          const sc = hr.range(0.8, 1.25) * scK, w = 7.4 * sc * hr.range(0.85, 1.1), sy = sc * hr.range(0.8, 1.3), L = 5.5 * sc * hr.range(0.9, 1.4);
          t += w / 2;
          const x = ox + dx * t - dz * side * (hw + L), z = oz + dz * t + dx * side * (hw + L);
          t += w / 2 + (hr() < 0.15 ? hr.range(4, 12) : 0.4);
          const k0 = key(x, z), rT = Math.hypot(x - TOWER.x, z - TOWER.z);
          if (occ.has(k0) || !isLand(x, z, 16) || rT < 385 || rT > (x > 0 ? 1500 : 1190) || churchAt.some((c) => Math.hypot(x - c[0], z - c[1]) < 30)) continue;
          occ.add(k0); occ.add(key(x - dz * L * 0.7, z + dx * L * 0.7)); occ.add(key(x + dz * L * 0.7, z - dx * L * 0.7));
          q4.setFromAxisAngle(YAX, Math.atan2(-dz * side, dx * side) + hr.range(-0.06, 0.06));
          m4.compose(p4.set(x, 0, z), q4, s4.set(w / 7, sy, L / 5.5));
          const wp = hr() < 0.7 ? wallPigs[hr.int(0, 2)] : hr.pick(wallPigs), rr = hr();
          (rr < 0.6 ? gabT : rr < 0.75 ? gabS : gabR).add(m4, wp, 1, -1, hr());
          gabH.add(m4, pig.dark, 0, -1, 0);
        }
      }
    };
    churchAt.push([-962, 1392, 44, 0.5], [1215, 715, 96, -1.2]);
    for (let i = 0; i < 5; i++) { layLane(-985 + hr.range(-50, 50), 1290 + 62 * i + hr.range(-12, 12), 0.3 + (i % 2 ? Math.PI / 2 : 0) + hr.range(-0.15, 0.15), hr.range(120, 230), 2.1); if (i % 2) await ctx.yield(); }
    await ctx.yield();
    for (let i = 0; i < 12; i++) {
      const ox = 1230 + hr.gauss() * 135, oz = 700 + hr.gauss() * 100;
      layLane(ox, oz, 0.35 + (i % 3 ? 0 : Math.PI / 2) + hr.range(-0.2, 0.2), hr.range(170, 330), 3.0);
      if (i % 2 === 1) await ctx.yield();
    }
    await ctx.yield();
    const townMat = bruegelMaterial({ instanced: true, distK: 1, towerShadow: true, bowl: true, side: THREE.DoubleSide });
    const lineMat = contourMaterial({ width: 1.5, distK: 1, bowl: true });
    scene.add(gabT.mesh(gableGeo(tile), townMat), gabS.mesh(gableGeo(slate), townMat), gabR.mesh(gableGeo(redTile), townMat));
    await ctx.yield();
    scene.add(gabH.mesh(hullGeo, lineMat));
    await ctx.yield();

    // ---- churches, the quay, kilns, lime pits, the town wall: one painted mesh and its contour hull ----
    const st = makePaint(), frame = (x, z, yaw) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0, z);
    const wallB = brown(0.3), stoneP = pig.stone, darkP = pig.dark;
    const slit = (m, x, y0, y1, z, w = 0.6) => {       // a dark window on a face looking along local +z or -z (z sign gives the side)
      const s = Math.sign(z), q = [V(x - w, y0, z + s * 0.08), V(x + w, y0, z + s * 0.08), V(x + w, y1, z + s * 0.08), V(x - w, y1, z + s * 0.08)].map((v) => v.applyMatrix4(m));
      st.poly(s > 0 ? q : q.reverse(), darkP, 0);
    };
    const pyramid = (m, hw, y0, y1, pg) => {
      const c = [V(-hw, y0, -hw), V(hw, y0, -hw), V(hw, y0, hw), V(-hw, y0, hw)].map((v) => v.applyMatrix4(m)), top = V(0, y1, 0).applyMatrix4(m);
      for (let i = 0; i < 4; i++) st.poly([c[(i + 1) % 4], c[i], top], pg, 0);
    };
    for (const [cx, cz, h, yaw] of churchAt) {
      const m = frame(cx, cz, yaw), tw = h * 0.065 + 1.2, th = h * 0.56, nl = h * 0.5, nw = h * 0.11 + 3, nh = h * 0.2 + 4;
      st.box(-tw, 0, -tw, tw, th, tw, wallB, 1, 0, m, 'b');
      st.box(-tw - 0.5, th, -tw - 0.5, tw + 0.5, th + 1.2, tw + 0.5, stoneP, 0, 0, m, 'b');
      pyramid(m, tw * 0.92, th + 1.2, h, slate);
      for (const s of [1, -1]) { slit(m, 0, th * 0.62, th * 0.9, s * tw, tw * 0.28); slit(m, 0, th * 0.3, th * 0.45, s * tw, tw * 0.2); }
      st.box(-nw, 0, tw, nw, nh, tw + nl, wallB, 1, 0, m, 'bt');
      const e = [V(-nw - 0.4, nh, tw), V(nw + 0.4, nh, tw), V(0, nh + nw * 1.15, tw), V(-nw - 0.4, nh, tw + nl), V(nw + 0.4, nh, tw + nl), V(0, nh + nw * 1.15, tw + nl)].map((v) => v.applyMatrix4(m));
      st.poly([e[1], e[4], e[5], e[2]], tile, 0); st.poly([e[3], e[0], e[2], e[5]], tile, 0); st.poly([e[4], e[3], e[5]], wallB, 1);
      for (let i = 0; i < 5; i++) st.box(nw, 0, tw + nl * (0.1 + 0.2 * i), nw + 1.2, nh * 0.8, tw + nl * (0.1 + 0.2 * i) + 1.2, stoneP, 2, 0, m, 'b', [0.4, 0]);
    }
    await ctx.yield();
    // the quay: a dressed stone wall along the basin, stepped at the water
    for (let x = -236; x < 96; x += 16) {
      if (Math.abs(x + 8) < 14) continue;
      st.box(x, 0, 600 + 3 * Math.sin(x * 0.05), x + 16.4, 2.6, 611, stoneP, 2, 0, null, 'b');
    }
    // brick kilns (their smoke comes later) and white lime pits
    const kilns = [[-128, 318], [-158, 432], [-92, 512], [-176, 236], [-128, 572]];
    for (const [kx, kz] of kilns) {
      const m = frame(kx, kz, 0.3 + kx * 0.01);
      st.box(-6, 0, -6, 6, 8.5, 6, pig.brick, 1, 0, m, 'b', [1.6, 1.6]);
      st.box(-3.6, 8.5, -3.6, 3.6, 9.4, 3.6, darkP, 0, 0, m, 'b');
      slit(m, 0, 0, 2.6, 6.0, 1.3);
    }
    const disc = (x, z, r, pg, y = 0.12) => { const q = []; for (let i = 0; i < 9; i++) q.push(V(x + Math.sin(i / 9 * 6.283) * r * (0.8 + 0.3 * ((i * 7) % 3) / 2), y, z + Math.cos(i / 9 * 6.283) * r)); st.poly(q, pg, 0); };
    for (const [lx, lz, r] of [[-105, 350, 9], [-140, 462, 11], [-70, 535, 8], [-196, 300, 10], [105, 760, 12], [150, 800, 9], [-40, 590, 6]]) disc(lx, lz, r, pig.lime);
    await ctx.yield();
    // the town wall: curtain, towers and gates on the landward side
    let prev = null, wi = 0;
    for (let a = -1.25; a < 3.2; a += 0.03) {
      const x = 150 + 548 / 0.85 * Math.cos(a), z = 290 + 548 * Math.sin(a), ok = x > coastX(z) + 30 && Math.hypot(x, z - 1200) > 400;
      const cur = ok ? V(x, 0, z) : null;
      if (prev && cur) {
        const yaw = Math.atan2(cur.x - prev.x, cur.z - prev.z), len = prev.distanceTo(cur), m = frame(prev.x, prev.z, yaw);
        if (wi % 14 === 7) {      // a gate: two drum-like towers and a dark arch
          st.box(-4, 0, 0, 4, 15, 6, wallB, 1, 0, m, 'b'); st.box(-4, 0, len - 6, 4, 15, len, wallB, 1, 0, m, 'b');
          st.box(-2, 7, 6, 2, 11, len - 6, wallB, 1, 0, m, 'b'); pyramid(new THREE.Matrix4().copy(m).multiply(new THREE.Matrix4().makeTranslation(0, 0, 3)), 4.6, 15, 22, tile);
          pyramid(new THREE.Matrix4().copy(m).multiply(new THREE.Matrix4().makeTranslation(0, 0, len - 3)), 4.6, 15, 22, tile);
        } else {
          st.box(-1.2, 0, 0, 1.2, 7.5, len + 0.2, wallB, 1, 0, m, 'b');
          if (wi % 5 === 2) { st.box(-3, 0, 0, 3, 12, 6, wallB, 1, 0, m, 'b'); pyramid(new THREE.Matrix4().copy(m).multiply(new THREE.Matrix4().makeTranslation(0, 0, 3)), 3.5, 12, 17, slate); }
        }
        wi++;
      }
      prev = cur;
    }
    await ctx.yield();
    const landMat = bruegelMaterial({ distK: 1, towerShadow: true, side: THREE.DoubleSide });
    const siteBuilt = st.build();
    await ctx.yield();
    const siteGeo = addHullNormals(siteBuilt);
    await ctx.yield();
    const siteMesh = new THREE.Mesh(siteGeo, landMat), siteLine = new THREE.Mesh(siteGeo, lineMat);
    siteMesh.frustumCulled = false; siteLine.frustumCulled = false; scene.add(siteMesh, siteLine);
    await ctx.yield();

    // ---- the harbour: round-hulled ships at anchor, a little too big for their sea; their rigging is ribbons ----
    const hullGeoOf = (barge) => {
      const g = makePaint(), tim = pig.timber, wale = [mix(pal[2], '#3B2A14', 0.45), mix(pal[2], '#3B2A14', 0.75)], deck = [mix(pal[2], pal[0], 0.45), mix(pal[2], '#3B2A14', 0.3)];
      const X = barge ? [-9, -7, -3, 3, 7, 9] : [-11, -8.5, -3.5, 3, 8, 11], B = barge ? [2.2, 3.2, 3.4, 3.4, 3.2, 2.0] : [0.9, 2.9, 3.6, 3.6, 2.7, 0.5], H = barge ? [2, 1.8, 1.7, 1.7, 1.8, 2.1] : [6.0, 4.4, 3.5, 3.6, 4.7, 6.4];
      for (let i = 0; i < 5; i++) for (const s of [1, -1]) {
        const a0 = V(X[i], -0.8, 0), a1 = V(X[i + 1], -0.8, 0), b0 = V(X[i], 0.7, s * B[i] * 0.86), b1 = V(X[i + 1], 0.7, s * B[i + 1] * 0.86);
        const c0 = V(X[i], H[i] - 1.1, s * B[i]), c1 = V(X[i + 1], H[i + 1] - 1.1, s * B[i + 1]), d0 = V(X[i], H[i], s * B[i] * 0.96), d1 = V(X[i + 1], H[i + 1], s * B[i + 1] * 0.96);
        const quad = (p, q, r, t, pg) => g.poly(s > 0 ? [p, q, r, t] : [q, p, t, r], pg, 0);
        quad(a1, a0, b0, b1, wale); quad(b1, b0, c0, c1, tim); quad(c1, c0, d0, d1, wale);
        g.poly(s > 0 ? [V(X[i], H[i] - 0.5, 0), V(X[i + 1], H[i + 1] - 0.5, 0), V(X[i + 1], H[i + 1] - 0.5, s * B[i + 1] * 0.96), V(X[i], H[i] - 0.5, s * B[i] * 0.96)].reverse() : [V(X[i], H[i] - 0.5, 0), V(X[i + 1], H[i + 1] - 0.5, 0), V(X[i + 1], H[i + 1] - 0.5, s * B[i + 1] * 0.96), V(X[i], H[i] - 0.5, s * B[i] * 0.96)], deck, 0);
      }
      if (barge) { g.box(-6, 1.3, -2.4, 5.5, 3.3, 2.4, pig.brick, 1, 0, null, 'b'); }
      else { g.box(-10.6, 5.4, -2.5, -5.5, 7.6, 2.5, tim, 3, 0, null, 'b', [0.3, 0.4]); g.box(6.6, 4.6, -2.0, 10.2, 6.4, 2.0, tim, 3, 0, null, 'b', [0.5, 0.5]); }
      return addHullNormals(g.build());
    };
    const sr = rng.fork('fleet'), ships = [], rib = makeRibbons(), limeC = pig.lime[0], sailC = mix(pal[6], pal[2], 0.18), timC = pig.timber[1], ropeC = pig.umber2, redC = pig.red[0];
    const big = cast.hulks ? 1 : 0.72;
    const addShip = (x, z, yaw, sc, masts, near, barge = false) => {
      const sh = { x, z, yaw, sc, ph: sr.range(0, 6.28), amp: sr.range(0.02, 0.045) * (dark ? 1.8 : 1) * (squall ? 1.5 : 1), barge, sail: null };
      ships.push(sh);
      if (barge) return sh;
      const c = Math.cos(yaw), s = Math.sin(yaw), fw = V(c, 0, -s), pp = V(s, 0, c);      // keel direction and beam direction in the world
      const at = (lx, ly, lz) => V(x + (fw.x * lx + pp.x * lz) * sc, ly * sc - 0.3, z + (fw.z * lx + pp.z * lz) * sc);
      const sw = (h) => pp.clone().multiplyScalar(h * sc * sh.amp);
      const xs = masts === 3 ? [-6.5, 0.5, 6.5] : masts === 2 ? [-4.5, 3] : [0.5];
      xs.forEach((mx, k) => {
        const Hm = (masts === 3 && k !== 1 ? 17 : 24) * (0.9 + 0.2 * sr()), top = at(mx, Hm, 0), yh = Hm * 0.7, yl = at(mx, yh, -Hm * 0.22), yr = at(mx, yh, Hm * 0.22);
        rib.seg(at(mx, 3, 0), top, 0.4 * sc, timC, -1, sw(3), sw(Hm), sh.ph);
        rib.seg(yl, yr, 0.26 * sc, timC, -1, sw(yh), sw(yh), sh.ph);
        const fl = at(mx + 0.3, yh - 0.55, -Hm * 0.2), fr = at(mx + 0.3, yh - 0.55, Hm * 0.2);
        rib.seg(fl, fr, (near ? 0.62 : 1.1) * sc, sailC, -1, sw(yh), sw(yh), sh.ph);
        for (const side of [1, -1]) {
          const ns = near ? 4 : 2;
          for (let j = 0; j < ns; j++) rib.seg(at(mx - 1.6 + 3.2 * j / Math.max(1, ns - 1), 4, side * 3.2), at(mx, Hm * 0.86, 0), 0.07, ropeC, -1, sw(4), sw(Hm * 0.86), sh.ph);
          if (near) for (let j = 1; j < 9; j++) { const t = j / 9.5; rib.seg(at(mx - 1.6 * (1 - t), 4 + (Hm * 0.86 - 4) * t, side * 3.2 * (1 - t)), at(mx + 1.6 * (1 - t), 4 + (Hm * 0.86 - 4) * t, side * 3.2 * (1 - t)), 0.05, ropeC, -1, sw(Hm * t), sw(Hm * t), sh.ph); }
        }
        rib.seg(at(mx, Hm, 0), at(mx - 11, Hm * 0.25 + 6, 0), 0.06, ropeC, -1, sw(Hm), sw(6), sh.ph);
        const pd = at(mx - 5.5, Hm + 0.6, 1.2);
        rib.seg(top, pd, (near ? 0.26 : 0.55) * sc, k % 2 ? limeC : redC, -1, sw(Hm), sw(Hm).add(V(0.5, 0.5, 0.9)), sh.ph + 1.3);
      });
      return sh;
    };
    // six near ones either side of the course, a brick barge under it
    const fleetLine = [[-5, 660, 13], [-15, 700, -13], [-27, 742, 13], [-41, 778, -13.5], [-2, 632, -14], [-51, 800, 14]];
    for (const [fx, fz, off] of fleetLine) addShip(fx + off, fz + sr.range(-6, 6), Math.PI / 2 + 0.25 + sr.range(-0.2, 0.2), 1.25 * big + 0.1, sr() < 0.5 ? 3 : 2, true);
    addShip(-14, 716, Math.PI / 2 + 0.3, 1.2, 0, false, true);
    for (const [fx, fz] of [[-22, 836], [-104, 842], [-150, 800], [22, 800]]) addShip(fx, fz, sr.range(0, 6.28), 1.5 * big + 0.1, 3, true);      // tall ones under the tower's foot: rigging along the bottom of the climb
    const nShips = Math.round(54 * (0.8 + 0.2 * density));
    for (let i = 0, guard = 0; i < nShips && guard < 4000; guard++) {
      if (guard % 60 === 59) await ctx.yield();
      const farSide = i > nShips * 0.4, x = farSide ? sr.range(-650, 480) : sr.range(-760, 70), z = farSide ? sr.range(1480, 2300) : sr.range(630, 1130);
      if (x > coastX(z) - 30 || Math.hypot(x, z - 1200) < 392 || Math.hypot(x, z - 1200) > 1230 || path.nearestXZ(x, z).dist < 34) continue;
      if (ships.some((o) => Math.hypot(o.x - x, o.z - z) < (farSide ? 80 : 46))) continue;
      const isBarge = sr() < 0.14;
      addShip(x, z, sr.range(0, 6.28), (1.25 + 0.5 * sr()) * big * (farSide ? 1.9 : 1.15), sr() < 0.3 ? 3 : sr() < 0.6 ? 2 : 1, false, isBarge);
      i++;
    }
    await ctx.yield();
    // a second anchorage round the tower's seaward foot, under the ramp, the bite and the top ring: big round hulls, counted from above
    const sb = rng.fork('fleetB'), nB = Math.round(52 * (0.8 + 0.2 * density));
    for (let i = 0, guard = 0; i < nB && guard < 3000; guard++) {
      if (guard % 40 === 39) await ctx.yield();
      const b = sb.range(46, 206) * DEG, r = 428 + 500 * Math.pow(sb(), 1.4), x = TOWER.x - Math.sin(b) * r, z = TOWER.z - Math.cos(b) * r;
      if (isLand(x, z, 36) || spitSD(x, z) < 60 || ships.some((o) => Math.hypot(o.x - x, o.z - z) < 58)) continue;
      addShip(x, z, sb.range(0, 6.28), (1.75 + 0.6 * sb()) * big, sb() < 0.35 ? 3 : sb() < 0.6 ? 2 : 1, false, sb() < 0.1);
      i++;
    }
    await ctx.yield();
    // a third, in the roads off the far shore: the water the bite looks out over (0.7 to 1.4 km from the eye, so the hulls are large)
    const sc3 = rng.fork('fleetC'), nC = Math.round(15 * (0.8 + 0.2 * density));
    for (let i = 0, guard = 0; i < nC && guard < 1500; guard++) {
      const x = sc3.range(-20, 300), z = sc3.range(1960, 2700);
      if (isLand(x, z, 40) || ships.some((o) => Math.hypot(o.x - x, o.z - z) < 74)) continue;
      addShip(x, z, sc3.range(0, 6.28), (1.9 + 0.6 * sc3()) * big * (1 + (z - 1960) / 1600), sc3() < 0.4 ? 3 : 2, false, false);
      i++;
    }
    await ctx.yield();
    const shipInst = makeInstances(), bargeInst = makeInstances(), I4 = new THREE.Matrix4();
    for (const sh of ships) (sh.barge ? bargeInst : shipInst).add(I4, pig.timber, 0, -1, sr());
    const shipMat = bruegelMaterial({ instanced: true, distK: 0.22, towerShadow: true, side: THREE.DoubleSide }), shipLineMat = contourMaterial({ width: 1.5, distK: 0.22 });      // ships stay umber with pale sails however far: they are the counted things of the sea
    const hullA = hullGeoOf(false), hullB = hullGeoOf(true);
    const shipMesh = shipInst.mesh(hullA, shipMat), bargeMesh = bargeInst.mesh(hullB, shipMat);
    const shipLine = new THREE.InstancedMesh(hullA, shipLineMat, shipMesh.count), bargeLine = new THREE.InstancedMesh(hullB, shipLineMat, bargeMesh.count);
    shipLine.instanceMatrix = shipMesh.instanceMatrix; bargeLine.instanceMatrix = bargeMesh.instanceMatrix; shipLine.frustumCulled = false; bargeLine.frustumCulled = false;
    const rigMat = ribbonMaterial({ distK: 0.22 });
    await ctx.yield();
    const rig = new THREE.Mesh(rib.build(), rigMat); rig.frustumCulled = false;
    await ctx.yield();
    scene.add(shipMesh, bargeMesh, shipLine, bargeLine, rig);
    const eul = new THREE.Euler(), shipQ = new THREE.Quaternion(), shipS = new THREE.Vector3(), shipP = new THREE.Vector3();
    tick.push((dt, time) => {      // the ships rock at anchor (the same sine the rigging sways on)
      let a = 0, b = 0;
      for (const sh of ships) {
        const roll = sh.amp * Math.sin(time * 0.9 + sh.ph);
        eul.set(roll, sh.yaw, 0.4 * sh.amp * Math.sin(time * 0.7 + sh.ph * 2), 'YXZ'); shipQ.setFromEuler(eul);
        I4.compose(shipP.set(sh.x, -0.3 + 0.15 * Math.sin(time * 0.8 + sh.ph), sh.z), shipQ, shipS.setScalar(sh.sc));
        if (sh.barge) bargeMesh.setMatrixAt(b++, I4); else shipMesh.setMatrixAt(a++, I4);
      }
      shipMesh.instanceMatrix.needsUpdate = true; bargeMesh.instanceMatrix.needsUpdate = true;
    });
    await ctx.yield();

    // ---- trees: pollard willows and round oaks, lobed blobs of two greens, in rows along dykes and lanes ----
    const treeGeoOf = (farOne) => {
      const g = makePaint(), lobe = (cx, cy, cz, rx, ry, N = 5) => {
        const t = V(cx, cy + ry, cz), b = V(cx, cy - ry * 0.8, cz), e = [], f = [];
        for (let i = 0; i < N; i++) {
          e.push(V(cx + Math.sin(i / N * 6.283) * rx * 0.72, cy + 0.55 * ry, cz + Math.cos(i / N * 6.283) * rx * 0.72));
          f.push(V(cx + Math.sin((i + 0.5) / N * 6.283) * rx, cy - 0.2 * ry, cz + Math.cos((i + 0.5) / N * 6.283) * rx));
        }
        for (let i = 0; i < N; i++) {
          const j = (i + 1) % N;
          g.poly([e[i], e[j], t], pig.turf, 0, 1); g.poly([f[j], f[i], b], pig.turf, 0, 1);
          g.poly([e[i], f[i], e[j]], pig.turf, 0, 1); g.poly([f[i], f[j], e[j]], pig.turf, 0, 1);
        }
      };
      if (!farOne) lobe(0, 5.4, 0, 3.1, 2.7); else lobe(0.3, 5.2, 0, 3.3, 2.8, 4);
      if (!farOne) lobe(1.9, 3.8, 0.9, 1.9, 1.6, 3);
      g.poly([V(-0.4, 0, 0.2), V(0.4, 0, 0.2), V(0.3, 3.4, 0.2), V(-0.3, 3.4, 0.2)], pig.timber, 0, 0); g.poly([V(0.2, 0, -0.4), V(0.2, 0, 0.4), V(0.2, 3.4, 0.3), V(0.2, 3.4, -0.3)], pig.timber, 0, 0);
      return addHullNormals(g.build());
    };
    const treeGeo = treeGeoOf(false), treeGeoFar = treeGeoOf(true);
    const greens = [[mix(pal[3], pal[2], 0.18), mix(pal[3], '#3B2A14', 0.62)], [mix(pal[3], pal[0], 0.22), mix(pal[3], '#3B2A14', 0.5)], [mix(pal[3], pal[2], 0.45), mix(pal[2], '#3B2A14', 0.6)], [mix(pal[3], pal[5], 0.3), mix(pal[3], '#3B2A14', 0.7)]];
    await ctx.yield();
    const trees = makeInstances(), treesFar = makeInstances(), treeNear = makeInstances(), gr = rng.fork('trees'), nTrees = Math.round(900 * detail * Math.min(1.15, density));
    let nT = 0;
    for (let row = 0; row < 1400 && nT < nTrees; row++) {
      const far = gr() < 0.45, rad = far ? gr.range(1300, 5200) : gr.range(380, 1500), ang = gr.range(0, 6.283);
      let x = TOWER.x + Math.sin(ang) * rad, z = TOWER.z + Math.cos(ang) * rad;
      if (!far && gr() < 0.5) { x = 150 + gr.gauss() * 330; z = 290 + gr.gauss() * 300; }
      const along = gr() < 0.5 ? [0.94, 0.34] : [-0.34, 0.94], n = gr.int(6, 26), gap = gr.range(8, 15), big = 1 + Math.max(0, Math.hypot(x, z - 1200) - 1400) / 1300;
      for (let i = 0; i < n && nT < nTrees; i++) {
        const tx = x + along[0] * i * gap * big + gr.range(-2, 2), tz = z + along[1] * i * gap * big + gr.range(-2, 2);
        const inTown = townAt(tx, tz) < 530, rT = Math.hypot(tx, tz - 1200);
        if (tx < coastX(tz) + 12 || rT < 380 || (inTown && (gr() < 0.75 || occ.has(key(tx, tz))))) continue;
        if (churchAt.some((c) => Math.hypot(tx - c[0], tz - c[1]) < 22)) continue;
        const sc = gr.range(0.8, 1.5) * big, np = path.nearestXZ(tx, tz);
        if (np.dist < 12 && np.y - 8 * sc < 8) continue;
        q4.setFromAxisAngle(YAX, gr.range(0, 6.283));
        m4.compose(p4.set(tx, 0, tz), q4, s4.set(sc * gr.range(0.85, 1.2), sc, sc * gr.range(0.85, 1.2)));
        const gp2 = gr.pick(greens);
        (far ? treesFar : trees).add(m4, gp2, 0, -1, gr());
        if (np.dist < 420) treeNear.add(m4, pig.dark, 0, -1, 0);
        nT++;
      }
      if (row % 30 === 0) await ctx.yield();
    }
    // tree rows, twice life size, on the tongue of land and east of the tower's foot
    const gr2 = rng.fork('trees2');
    for (let row = 0; row < Math.round(32 * detail); row++) {
      let x, z;
      if (row % 3 === 0) { x = -1000 + gr2.range(-110, 110); z = 1500 + gr2.range(-560, 560); }
      else { x = gr2.range(880, 1650); z = gr2.range(470, 960); }
      const along = gr2() < 0.5 ? [0.94, 0.34] : [-0.34, 0.94], n = gr2.int(6, 13), gap = gr2.range(17, 26);
      for (let i = 0; i < n; i++) {
        const tx = x + along[0] * i * gap + gr2.range(-2, 2), tz = z + along[1] * i * gap + gr2.range(-2, 2), sc = gr2.range(1.8, 2.6) * (1 + Math.max(0, tx - 700) / 600);
        if (!isLand(tx, tz, 12) || Math.hypot(tx - TOWER.x, tz - TOWER.z) < 385 || occ.has(key(tx, tz))) continue;
        q4.setFromAxisAngle(YAX, gr2.range(0, 6.283));
        m4.compose(p4.set(tx, 0, tz), q4, s4.set(sc * gr2.range(0.85, 1.2), sc, sc * gr2.range(0.85, 1.2)));
        trees.add(m4, gr2.pick(greens), 0, -1, gr2());
      }
    }
    await ctx.yield();
    const farMat = bruegelMaterial({ instanced: true, distK: 1, towerShadow: true, bowl: true });
    scene.add(trees.mesh(treeGeo, farMat), treesFar.mesh(treeGeoFar, farMat));
    await ctx.yield();
    scene.add(treeNear.mesh(treeGeo.clone(), lineMat));
    await ctx.yield();

    // ---- post windmills on the dykes, sails turning ----
    const millGeo = (() => {
      const g = makePaint(), tim = pig.timber;
      g.box(-1.6, 0, -1.6, 1.6, 4.4, 1.6, tim, 0, 0, null, 'b', [1.1, 1.1]);
      g.box(-2.3, 4.4, -2.3, 2.3, 11, 2.3, pig.thatch, 3, 0, null, 'b');
      g.poly([V(2.5, 11, 2.5), V(2.5, 11, -2.5), V(0, 14, -2.5), V(0, 14, 2.5)], tim, 0); g.poly([V(-2.5, 11, -2.5), V(-2.5, 11, 2.5), V(0, 14, 2.5), V(0, 14, -2.5)], tim, 0);
      g.poly([V(-2.3, 11, 2.3), V(2.3, 11, 2.3), V(0, 14, 2.3)], pig.thatch, 3); g.poly([V(2.3, 11, -2.3), V(-2.3, 11, -2.3), V(0, 14, -2.3)], pig.thatch, 3);
      g.box(-0.2, 0.4, 2.3, 0.2, 5, 9, tim, 0, 0, null, '', [0, 0]);
      return addHullNormals(g.build());
    })();
    const sailGeo = (() => {
      const g = makePaint();
      for (let k = 0; k < 4; k++) {
        const m = new THREE.Matrix4().makeRotationX(k * Math.PI / 2);
        g.box(-0.12, 0, -0.22, 0.12, 10, 0.22, pig.timber, 0, 0, m, '');
        g.poly([V(0, 2, 0.22), V(0, 2, 2.0), V(0, 9.8, 2.0), V(0, 9.8, 0.22)].map((v) => v.applyMatrix4(m)), pig.lime, 0);
      }
      return g.build();
    })();
    const mills = makeInstances(), sails = makeInstances(), mr = rng.fork('mills');
    const millAt = [[-200, 150], [640, 520], [520, 880], [700, 190], [330, 1620], [-120, 1760], [820, 1250]];
    for (let i = 0; i < 12; i++) { const a = mr.range(0.3, 4.2), r = mr.range(1500, 5200); millAt.push([Math.sin(a) * r, 1200 + Math.cos(a) * r]); }
    millAt.push([-1015, 1262, 1.2], [-1040, 1830, 1.2], [1010, 720, 1.9], [1050, 530, 2.0], [1480, 700, 2.2], [1420, 490, 2.3]);      // on the tongue of land and east of the tower: the ones the ramp and the top ring look down on
    for (const [mx, mz, mk = 1] of millAt) {
      if (!isLand(mx, mz, 20)) continue;
      const sc = (1.1 + Math.hypot(mx, mz - 1200) / 1300) * mr.range(0.9, 1.2) * mk, yaw = -0.6 + mr.range(-0.4, 0.4);
      q4.setFromAxisAngle(YAX, yaw); m4.compose(p4.set(mx, 0, mz), q4, s4.setScalar(sc));
      mills.add(m4, pig.thatch, 0, -1, mr());
      sails.add(m4.clone().multiply(new THREE.Matrix4().makeTranslation(2.7, 10, 0)), pig.lime, 0, -1, mr(), mr.range(0.5, 0.9));
    }
    scene.add(mills.mesh(millGeo, farMat));
    scene.add(sails.mesh(sailGeo, bruegelMaterial({ instanced: true, distK: 1, towerShadow: true, bowl: true, spin: true, side: THREE.DoubleSide })));
    await ctx.yield();

    await ctx.yield();
    // ---- weather: five smaller clouds over the sea, kiln smoke, the squall, the dark panel's bank ----
    const cr = rng.fork('weather'), drifters = [];
    const whiteC = pal[6], underC = pal[4];
    for (let i = 0; i < 5; i++) {
      const len = cr.range(260, 520), c = new THREE.Mesh(cloudGeometry(cr.fork('c' + i), len, len * 0.22, len * 0.13, cr.int(5, 8), 1), cloudMaterial(whiteC, underC, 2.0, 22));
      c.position.set(cr.range(-5200, -1300), cr.range(560, 1050), -900 + i * 1050 + cr.range(-300, 300)); c.rotation.y = cr.range(-0.5, 0.5) + Math.PI / 2; c.frustumCulled = false;
      scene.add(c); drifters.push({ o: c, x: c.position.x, z: c.position.z, v: cr.range(3, 7) });
      await ctx.yield();
      await ctx.yield();
    }
    await ctx.yield();
    const smokeMat = cloudMaterial(hx(mix(pal[6], pal[2], 0.22)), hx(mix(pal[6], pal[2], 0.6)), 0.5, 3.4), smokes = [];      // kiln smoke: a plume of many small round puffs, thin at the kiln and wider as it climbs, each puff with its scallop of shade
    for (let i = 0; i < kilns.length; i++) {
      const [kx, kz] = kilns[i];
      const sg = cloudGeometry(cr.fork('s' + i), 34, 3.4, 4.4, 11, 1), sp = sg.attributes.position;
      for (let k = 0; k < sp.count; k++) { const x = sp.getX(k), t = Math.min(1, Math.max(0, x / 30 + 0.5)), f = 0.4 + 1.25 * t * t; sp.setXYZ(k, x, sp.getY(k) * f + 1.6 * Math.sin(x * 0.42 + i), sp.getZ(k) * f + 2.2 * Math.sin(x * 0.27 + i * 2.1) * t); }
      const sm = new THREE.Mesh(sg, smokeMat);
      sm.position.set(kx - 3, 23, kz + 4); sm.rotation.set(0, 0.5, Math.PI / 2 - 0.28); sm.frustumCulled = false; scene.add(sm); smokes.push(sm);
      await ctx.yield();
    }
    // the dark panel: a bank of blue-grey cloud across four tiers, on the port and near flanks (clear of the course)
    const bankMat = cloudMaterial(hx(mix(pal[4], pal[6], 0.6)), hx(mix(pal[4], pal[5], 0.5)), 2.4, 19);      // a pile of round lobes, pale on top, each with its scallop of shade: never a flat grey slab
    const bankAt = [[330, 268, 1010, 0.7], [395, 330, 1330, 1.5], [150, 218, 842, 0.25]];
    await ctx.yield();
    for (let i = 0; i < bankAt.length; i++) {
      const [bx, by, bz, yaw] = bankAt[i];
      const b = new THREE.Mesh(await cloudGeometrySteps(cr.fork('b' + i), 520, 105, 66, 12, 2, ctx.yield), bankMat);
      b.position.set(bx, dark ? by : -900, bz); b.rotation.y = yaw; b.frustumCulled = false; b.scale.setScalar(dark ? 1 : 0.01);
      scene.add(b); if (dark) drifters.push({ o: b, x: bx, z: bz, v: 1.5 });
      await ctx.yield();
    }
    await ctx.yield();
    // the squall: a slanted flat curtain of far blue crossing the roads, under its own grey cloud
    const sq = makePaint(), sqA = [new THREE.Color(pal[4]), new THREE.Color(pal[4])], sqB = [mix(pal[4], pal[5], 0.32), mix(pal[4], pal[5], 0.32)];
    // rain: thin slanted shafts with the country showing between them, in two ranks one behind the other, hung under a
    // lobed cloud; never one pane
    for (let i = 0; i < 46; i++) {
      const rank = i % 2, x0 = -540 + i * 23.5, w = 5 + 9 * ((i * 7) % 5) / 4, lo = 26 * ((i * 5) % 9), z = rank ? 70 : -20, top = 652;
      sq.poly([V(x0 - 250 + lo * 0.39, lo, z), V(x0 - 250 + lo * 0.39 + w, lo, z), V(x0 + w, top, z), V(x0, top, z)], i % 3 ? sqA : sqB, 0);
    }
    await ctx.yield();
    const squallG = new THREE.Group(), curtain = new THREE.Mesh(sq.build(), bruegelMaterial({ distK: 0, side: THREE.DoubleSide }));
    const sqCloud = new THREE.Mesh(await cloudGeometrySteps(cr.fork('sq'), 1150, 250, 150, 13, 2, ctx.yield), bankMat);
    sqCloud.position.set(0, 620, 0); curtain.frustumCulled = false; sqCloud.frustumCulled = false; squallG.add(curtain, sqCloud);
    await ctx.yield();
    squallG.rotation.y = 0.5; squallG.position.set(-2300, squall ? 0 : -3000, 1500); scene.add(squallG);
    tick.push((dt, time, camera, u) => {
      for (const d of drifters) d.o.position.set(d.x + d.v * time * 0.6, d.o.position.y, d.z + d.v * time);
      smokes.forEach((sm, i) => { sm.rotation.z = Math.PI / 2 - 0.5 - 0.12 * Math.sin(time * 0.35 + i * 1.7) - 0.25 * sstep(0, 0.08, u); });
      if (squall) squallG.position.set(-2300 + 500 * u + 6 * time, 0, 1500 - 300 * u);
    });
    await ctx.yield();

    // ---- jackdaws: dark ticks wheeling round the upper tiers, and a flock that crosses overhead at the entry ----
    const jr = rng.fork('daws'), nDaw = Math.round(620 * (0.6 + 0.4 * detail)), nClimb = Math.round(nDaw * 0.64), jo = new Float32Array(nDaw * 4), jm = new Float32Array(nDaw * 4);
    for (let i = 0; i < nDaw; i++) {
      const lead = i < 60, flock = jr.int(0, 5);
      if (lead) jo.set([jr.range(-18, 26), 63 + jr.range(-2, 9), 62 + jr.range(-30, 70), jr.range(9, 46)], i * 4);
      else if (i < 100) jo.set([seat.x + jr.range(-12, 10), 432 + jr.range(0, 18), seat.z + 30 + jr.range(-25, 25), jr.range(18, 48)], i * 4);      // round the exit arch
      else if (i < nClimb && i % 5 < 3) jo.set([-120 + jr.range(-75, 55), 115 + jr.range(-50, 90), 890 + jr.range(-60, 60), jr.range(25, 95)], i * 4);
      else if (i < nClimb) jo.set([-175 + jr.range(-20, 20), 205 + jr.range(-40, 45), 930 + jr.range(-25, 25), jr.range(18, 52)], i * 4);      // and higher, ahead of the climb      // by the face we climb
      else if (i >= nDaw - 112 && i < nDaw - 56) jo.set([appr.x + 30 + jr.range(-30, 30), appr.y - 22 + jr.range(-16, 14), appr.z + 110 + jr.range(-30, 30), jr.range(14, 44)], i * 4);      // wheeling over the east country, under the eye as it comes out of the cloud
      else if (i >= nDaw - 56) jo.set([-272 + jr.range(-14, 14), 236 + jr.range(-16, 26), 1352 + jr.range(-16, 16), jr.range(10, 30)], i * 4);      // out over the water off the mouth of the bite
      else if (i < nClimb + 70) jo.set([-60 + jr.range(-25, 25), 362 + jr.range(-18, 22), 1402 + jr.range(-10, 14), jr.range(12, 36)], i * 4);      // off the head of the bite, before the cloud
      else jo.set([TOWER.x + 40 * Math.sin(flock * 1.3) + jr.range(-30, 30), 250 + flock * 42 + jr.range(-25, 25), TOWER.z + 40 * Math.cos(flock * 2.1) + jr.range(-30, 30), 300 - flock * 26 + jr.range(-40, 50)], i * 4);
      jm.set([jr.range(0, 6.283), (i < nClimb + 70 || i >= nDaw - 112 ? jr.range(0.25, 0.5) : jr.range(0.04, 0.09)) * (jr() < 0.5 ? 1 : -1), jr.range(0, 6.283), i >= 100 && i < nClimb ? jr.range(1.5, 2.2) : (i >= nClimb && i < nClimb + 70) || i >= nDaw - 112 ? jr.range(1.8, 2.5) : jr.range(0.7, 1.2)], i * 4);
    }
    await ctx.yield();
    const dawGeo = new THREE.InstancedBufferGeometry();
    dawGeo.setAttribute('position', new THREE.Float32BufferAttribute([0.3, 0, 0, -0.3, 0, 0, 0.05, -0.5, 1, 0.05, 0.5, 1], 3));
    dawGeo.setIndex([0, 1, 2, 0, 3, 1]);
    dawGeo.setAttribute('iOrb', new THREE.InstancedBufferAttribute(jo, 4)); dawGeo.setAttribute('iMot', new THREE.InstancedBufferAttribute(jm, 4));
    dawGeo.instanceCount = nDaw;
    const dawMat = new THREE.ShaderMaterial({
      uniforms: { ...U }, side: THREE.DoubleSide,
      vertexShader: STYLE_DECL + /* glsl */`
        attribute vec4 iOrb, iMot;
        void main() {
          float a = iMot.x + uTime * iMot.y;
          vec3 c = iOrb.xyz + vec3(cos(a) * iOrb.w, 5.0 * sin(a * 2.3 + iMot.z), sin(a) * iOrb.w * 0.8);
          vec3 d = vec3(-sin(a), 0.0, cos(a) * 0.8) * sign(iMot.y);
          d /= max(length(d), 1e-4);
          vec3 sd = vec3(d.z, 0.0, -d.x);
          vec4 cc = projectionMatrix * viewMatrix * vec4(c, 1.0);
          float pxPerM = uView.y * projectionMatrix[1][1] * 0.5 / max(abs(cc.w), 1e-3);
          float size = max(0.8 * iMot.w, (5.0 + 2.3 * iMot.w) / max(pxPerM, 1e-4));
          float flap = sin(uTime * 8.0 + iMot.z * 3.0) * step(-0.3, sin(uTime * 0.6 + iMot.z));
          vec3 p = c + (d * position.x + sd * position.y) * size + vec3(0.0, 1.0, 0.0) * (position.z * (0.12 + 0.4 * flap) * size);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: STYLE_DECL + /* glsl */`void main() { gl_FragColor = vec4(uUmber2, 1.0); }`,
    });
    const daws = new THREE.Mesh(dawGeo, dawMat); daws.frustumCulled = false; scene.add(daws);

    // ---- three magpies in our wake up the ramp: black, white flanks, a long wedge tail; they flap and glide ----
    const mp = [], mc = [], mw = [], mb = [], BK = pig.umber2, WH = new THREE.Color(pal[6]);
    const mtri = (b, a1, a2, a3, c) => { for (const v of [a1, a2, a3]) { mp.push(v[0], v[1], v[2]); mc.push(c.r, c.g, c.b); mw.push(Math.abs(v[0]) / 0.36); mb.push(b); } };
    for (let b = 0; b < 3; b++) {
      mtri(b, [0, 0.01, 0.22], [0.06, 0, 0.02], [-0.06, 0, 0.02], BK); mtri(b, [0.06, 0, 0.02], [0, 0, -0.14], [-0.06, 0, 0.02], BK);
      mtri(b, [0.035, 0, -0.1], [-0.035, 0, -0.1], [0, 0, -0.5], BK);
      for (const s of [1, -1]) {
        mtri(b, [s * 0.05, 0, 0.1], [s * 0.2, 0, 0.09], [s * 0.05, 0, -0.07], BK); mtri(b, [s * 0.2, 0, 0.09], [s * 0.2, 0, -0.08], [s * 0.05, 0, -0.07], BK);
        mtri(b, [s * 0.2, 0, 0.085], [s * 0.36, 0, 0.0], [s * 0.2, 0, -0.075], WH); mtri(b, [s * 0.2, 0, 0.09], [s * 0.37, 0, 0.02], [s * 0.36, 0, 0.0], BK);
        mtri(b, [s * 0.05, 0.004, 0.04], [s * 0.15, 0.004, 0.0], [s * 0.05, 0.004, -0.07], WH);
      }
    }
    await ctx.yield();
    const pieGeo = new THREE.BufferGeometry();
    pieGeo.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); pieGeo.setAttribute('aC', new THREE.Float32BufferAttribute(mc, 3));
    pieGeo.setAttribute('aW', new THREE.Float32BufferAttribute(mw, 1)); pieGeo.setAttribute('aB', new THREE.Float32BufferAttribute(mb, 1));
    const pieU = { uB0: { value: new THREE.Vector4(0, -500, 0, 0) }, uB1: { value: new THREE.Vector4(0, -500, 0, 2.1) }, uB2: { value: new THREE.Vector4(0, -500, 0, 4.4) }, uFwd: { value: new THREE.Vector3(0, 0, 1) }, uSize: { value: 1.9 } };
    const pieMat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...pieU }, side: THREE.DoubleSide,
      vertexShader: STYLE_DECL + /* glsl */`
        attribute vec3 aC; attribute float aW, aB;
        uniform vec4 uB0, uB1, uB2; uniform vec3 uFwd; uniform float uSize;
        varying vec3 vC;
        void main() {
          vec4 b = aB < 0.5 ? uB0 : (aB < 1.5 ? uB1 : uB2);
          vec3 f = uFwd / max(length(uFwd), 1e-4);
          vec3 r = cross(f, vec3(0.0, 1.0, 0.0)); r /= max(length(r), 1e-4);
          vec3 up = cross(r, f);
          { vec3 f0 = f; f = f0 * 0.8 + up * 0.6; up = up * 0.8 - f0 * 0.6; }      // they climb ahead of us, backs to the eye: the white flanks show
          float gate = smoothstep(-0.35, 0.35, sin(uTime * 1.3 + b.w));
          float flap = sin(uTime * 13.0 + b.w * 5.0) * gate + 0.35 * (1.0 - gate);
          vec3 p = position * uSize;
          p.y += aW * aW * 0.2 * flap * uSize;
          p.x *= 1.0 - 0.25 * aW * abs(flap) * gate;
          vC = aC;
          gl_Position = projectionMatrix * viewMatrix * vec4(b.xyz + r * p.x + up * p.y + f * p.z, 1.0);
        }`,
      fragmentShader: /* glsl */`varying vec3 vC; void main() { gl_FragColor = vec4(vC, 1.0); }`,
    });
    const pies = new THREE.Mesh(pieGeo, pieMat); pies.frustumCulled = false; scene.add(pies);
    const _pp = new THREE.Vector3(), _pt = new THREE.Vector3(), _pr = new THREE.Vector3(), pieOff = [[-2.6, -0.5, 0], [-0.2, -1.5, 2.6], [2.2, -0.9, -1.2]];
    tick.push((dt, time, camera, u, eye, ur) => {
      // lead in metres along the course: from behind us, through centre frame at u 0.52, then away up the ramp
      const lead = -14 + 21 * sstep(0.495, 0.52, u) + 4 * sstep(0.52, 0.56, u) + 120 * sstep(0.56, 0.62, u);
      const on = u > 0.47 && u < 0.625;
      path.pointAt(ur, _pp); path.tangentAt(ur, _pt); _pr.set(-_pt.z, 0, _pt.x).normalize();
      pieU.uFwd.value.copy(_pt);
      [pieU.uB0, pieU.uB1, pieU.uB2].forEach((b, i) => {
        const o = pieOff[i], l = lead + o[2] + 0.5 * Math.sin(time * 0.8 + i * 2);
        if (on) b.value.set(_pp.x + _pt.x * l + _pr.x * o[0], _pp.y + _pt.y * l + o[1] + 0.25 * Math.sin(time * 1.1 + i), _pp.z + _pt.z * l + _pr.z * o[0], b.value.w);
        else b.value.set(0, -500, 0, b.value.w);
      });
    });
    await ctx.yield();

    // ---- his people in the lanes and on the quay: cap and smock, one cap in ten red, never near ----
    const fig = makeFigures(), fr = rng.fork('folk'), caps = [pig.timber[0], pig.timber[1], pig.umber2, pig.smock[1], pig.lime[0]];
    const nFolk = Math.round(2200 * detail * Math.min(1.2, density));
    for (let i = 0, guard = 0; i < nFolk && guard < 20000; guard++) {
      if (guard % 150 === 149) await ctx.yield();
      const onQuay = i < 150, uu = fr.range(0, 0.32);
      path.pointAt(uu, _pp);
      const x = onQuay ? fr.range(-232, 92) : _pp.x + fr.gauss() * 85, z = onQuay ? fr.range(601.5, 610) : _pp.z + 60 + fr.gauss() * 70;
      if (!onQuay && (x < coastX(z) + 6 || z > 598 || occ.has(key(x, z)))) continue;
      const np = path.nearestXZ(x, z);
      if (Math.hypot(np.dist, np.y - (onQuay ? 2.6 : 0)) < 25) continue;
      const ang = mainA + (fr() < 0.5 ? 0 : Math.PI / 2), wl = onQuay ? fr.range(1, 5) : fr.range(2, 9), still = fr() < 0.3 ? 0.1 : 1;
      fig.add(V(x, onQuay ? 2.6 : 0, z), V(Math.cos(ang) * wl * still, 0, (onQuay ? 0 : Math.sin(ang)) * wl * still), fr() < 0.1 ? pig.red[0] : fr.pick(caps), fr.range(1.4, 2.8), fr() < 0.15, fr.range(0, 6.283));
      i++;
    }
    await ctx.yield();
    scene.add(fig.mesh(figureMaterial(pig, { distK: 0.8 })));
    await ctx.yield();

    // ---- oxen drag stone sledges up the lower ramp ----
    const oxGeo = (() => {
      const g = makePaint(), hide = [mix(mix(pal[2], pal[1], 0.45), pal[0], 0.25), mix(pal[2], '#3B2A14', 0.55)];
      for (const z of [-0.8, 0.8]) for (const x of [4.2, 7.2]) {
        const pg = (x + z > 5) ? hide : [mix(pal[0], pal[2], 0.3), mix(pal[2], '#3B2A14', 0.4)];
        g.box(x - 1.2, 0.55, z - 0.42, x + 1.2, 1.6, z + 0.42, pg, 0, 0, null, '', [0.25, 0.16]); g.box(x + 1.1, 0.8, z - 0.24, x + 1.85, 1.45, z + 0.24, pg, 0, 0, null, '', [0.2, 0.08]);
        g.box(x + 1.5, 1.45, z - 0.5, x + 1.62, 1.55, z + 0.5, pig.lime, 0, 0, null, '');
        g.box(x - 1.1, 0, z - 0.3, x - 0.8, 0.55, z + 0.3, pig.dark, 0, 0, null, 'bt'); g.box(x + 0.8, 0, z - 0.3, x + 1.1, 0.55, z + 0.3, pig.dark, 0, 0, null, 'bt');
      }
      g.box(-2.2, 0, -1.2, 2.2, 0.35, 1.2, pig.timber, 3, 0, null, 'b'); g.box(-1.6, 0.35, -0.9, 1.6, 1.75, 0.9, pig.stone, 2, 0, null, 'b');
      return addHullNormals(g.build());
    })();
    const nOx = cast.oxen ? 9 : 4, oxInst = makeInstances(), F = hero.frame, oxen = [], or = rng.fork('oxen');
    for (let i = 0; i < nOx; i++) { oxInst.add(I4, pig.timber, 0, -1, 0); oxen.push({ k: i % 2, ph: or(), rate: or.range(0.0011, 0.0016) }); }
    for (const ph of [0.3, 0.72]) { oxInst.add(I4, pig.timber, 0, -1, 0); oxen.push({ k: 2, ramp: true, ph, rate: 0.004 }); }      // two teams on the stretch of ramp we fly, by the inner wall
    const oxS0 = 2 + F.frac(82), oxS1 = 2 + F.frac(97);
    const oxMesh = oxInst.mesh(oxGeo, shipMat), oxLine = new THREE.InstancedMesh(oxGeo, shipLineMat, oxen.length);
    oxLine.instanceMatrix = oxMesh.instanceMatrix; oxLine.frustumCulled = false; scene.add(oxMesh, oxLine);
    const oxM = new THREE.Matrix4(), oxX = new THREE.Vector3(), oxZ = new THREE.Vector3(), oxP = new THREE.Vector3(), oxS = new THREE.Matrix4();
    tick.push((dt, time) => {
      oxen.forEach((o, i) => {
        const f = (o.ph + time * o.rate) % 1, s = o.ramp ? oxS0 + (oxS1 - oxS0) * f : o.k + 0.03 + 0.3 * f, b = F.bearing(s) * DEG, r = 350 - 28 * s - (o.ramp ? 21.5 : 13 + 4 * (i % 3));
        const sc = 1.5 * sstep(0, 0.04, f) * (1 - sstep(0.96, 1, f));
        oxX.set(Math.cos(b), 0.027, -Math.sin(b)); oxZ.set(Math.sin(b), 0, Math.cos(b)); oxP.set(Math.sin(b) * r, 60 * s + 0.1, Math.cos(b) * r);
        oxM.makeBasis(oxX, YAX, oxZ).setPosition(oxP).multiply(oxS.makeScale(sc, sc, sc)).premultiply(hero.lean.matrixWorld);
        oxMesh.setMatrixAt(i, oxM);
      });
      oxMesh.instanceMatrix.needsUpdate = true;
    });

    // ---- three ships under sail cross the roads ----
    const sailG = (() => {
      const g = makePaint(), lime = pig.lime, k = dark ? 0.55 : 1;
      g.box(-0.3, 3, -0.3, 0.3, 27, 0.3, pig.timber, 0, 0, null, ''); g.box(-7.3, 3, -0.25, -6.8, 19, 0.25, pig.timber, 0, 0, null, '');
      const sail = (x, y0, y1, w) => { const yb = y1 - (y1 - y0) * k; g.poly([V(x, yb, -w), V(x + 1.8, yb + 1, 0), V(x + 1.8, y1 - 1, 0), V(x, y1, -w)], lime, 0); g.poly([V(x + 1.8, yb + 1, 0), V(x, yb, w), V(x, y1, w), V(x + 1.8, y1 - 1, 0)], lime, 0); };
      sail(0.4, 8, 24, 7.5); sail(-6.6, 7, 17.5, 4.5);
      g.poly([V(0, 27, 0), V(-5, 27.6, 0.8), V(0, 28.2, 0)], pig.red, 0);
      return g.build();
    })();
    const sailers = [], sailMat = bruegelMaterial({ distK: 0.22, towerShadow: true, side: THREE.DoubleSide });
    [[-1150, 760, -420, 2250], [380, 2250, -1100, 1250], [-250, 640, -1150, 1500]].forEach(([x0, z0, x1, z1], i) => {
      const grp = new THREE.Group(), hm = new THREE.Mesh(hullA, sailMat), hl = new THREE.Mesh(hullA, shipLineMat), sm = new THREE.Mesh(sailG, sailMat);
      for (const o of [hm, hl, sm]) { o.frustumCulled = false; grp.add(o); }
      grp.rotation.order = 'YXZ'; grp.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); scene.add(grp);
      sailers.push({ grp, x0, z0, x1, z1, ph: sr(), len: Math.hypot(x1 - x0, z1 - z0) });
    });
    tick.push((dt, time) => {
      for (const s of sailers) {
        const f = (s.ph + time * 7 / s.len) % 1, sc = 2.0 * big * sstep(0, 0.03, f) * (1 - sstep(0.97, 1, f));
        s.grp.position.set(s.x0 + (s.x1 - s.x0) * f, -0.3, s.z0 + (s.z1 - s.z0) * f); s.grp.scale.setScalar(Math.max(sc, 1e-3));
        s.grp.rotation.x = (dark || squall ? 0.2 : 0.09) + 0.03 * Math.sin(time * 0.8 + s.ph * 9);
      }
    });
    await ctx.yield();

    // ---- the rare event, the drop: the hoist rope parts, the pallet falls back past us, bricks tumble into a red cloud ----
    const brickGeo = (() => { const g = makePaint(); g.box(-0.3, -0.12, -0.14, 0.3, 0.12, 0.14, pig.brick, 0, 0, null, ''); return g.build(); })();
    const nBrick = 56, brInst = makeInstances(), br = rng.fork('drop'), bricks = [];
    for (let i = 0; i < nBrick; i++) { brInst.add(I4, pig.brick, 0, -1, 0); bricks.push({ v: V(br.range(-5, 5), br.range(-2, 5), br.range(-5, 5)), ax: V(br.range(-1, 1), br.range(-1, 1), br.range(-1, 1)).normalize(), w: br.range(3, 9), d: br.range(0, 0.25) }); }
    const brMesh = brInst.mesh(brickGeo, townMat); scene.add(brMesh);
    const redCloudMat = cloudMaterial(pal[1], hx(pig.brick[1]), 0.6), redClouds = [];
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(cloudGeometry(br.fork('r' + i), 20, 2.6, 2.8, 12, 1), redCloudMat); c.frustumCulled = false; c.scale.setScalar(1e-3); c.position.set(0, -400, 0); scene.add(c); redClouds.push(c); }
    hero.palletHeld = rare;
    for (const c of hero.pallet.children) if (c.material && c.material.uniforms && c.material.uniforms.uBreath) c.scale.setScalar(1e-3);      // the pallet's dust is the falling flecks, not a lobe (a lobe 7 m from the eye is a red finger)
    const DROP = 0.695, dropEye = path.pointAt(toReal(DROP)), _bp = new THREE.Vector3(), _bq = new THREE.Quaternion(), _bs = new THREE.Vector3(), _bm = new THREE.Matrix4(), [hLo, hHi] = hero.hoistRange;
    let yPart = null;
    tick.push((dt, time, camera, u) => {
      if (!rare) return;
      if (yPart === null) { hero.pallet.getWorldPosition(_bp); yPart = hero.lean.worldToLocal(_bs.set(_bp.x, dropEye.y + 18, _bp.z)).y; }
      const rise = Math.min(1, Math.max(0, (Math.min(u, DROP) - (DROP - 0.03)) / 0.03)), t = Math.max(0, (u - DROP) * 70), yTop = hLo + (yPart - hLo) * rise;
      hero.pallet.position.y = Math.max(hLo - 60, yTop - 4.9 * t * t);
      hero.pallet.rotation.z = Math.min(1.1, 0.9 * t);      // it tips as it goes
      hero.wheelsHeld = u > DROP && u < DROP + 0.04;
      hero.pallet.getWorldPosition(_bp);
      const y0 = dropEye.y + 18, px = _bp.x, pz = _bp.z;
      bricks.forEach((b, i) => {
        const tb = Math.max(0, t - b.d), live = t > 0 && u < DROP + 0.06 ? 1 : 0;
        _bq.setFromAxisAngle(b.ax, tb * b.w);
        _bm.compose(_bp.set(px + b.v.x * tb, y0 + 1.5 + b.v.y * tb - 4.9 * tb * tb, pz + b.v.z * tb), _bq, _bs.setScalar(live ? 2.2 : 1e-3));
        brMesh.setMatrixAt(i, _bm);
      });
      brMesh.instanceMatrix.needsUpdate = true;
      const grow = sstep(DROP + 0.003, DROP + 0.012, u) * (1 - sstep(DROP + 0.03, DROP + 0.06, u));
      redClouds.forEach((c, i) => { c.position.set(px + (i - 1) * 2.5, y0 - 10 - 7 * i - 12 * sstep(DROP + 0.02, DROP + 0.06, u), pz + (1 - i) * 2); c.rotation.set(0, i * 1.1, 0.5 + 0.5 * i); c.scale.setScalar(Math.max(1e-3, grow * (1.3 + 0.3 * i))); });      // under the hoist, where the bricks land: 9 m and more from the eye
    });
    // ---- the cloud we cross. It hangs on the path, not on the clock: a shell the eye is inside from real u 0.858 to 0.883
    // (now 0.836 to 0.860: the course is longer; its walls met flat-on, its inside lead white), lobes inside it whose flat undersides stay drawn, a pile round it,
    // and a floor of lobes outboard of the top ledge that we come out above. The great cloud keeps clear of all of it. ----
    {
      const ir = rng.fork('inner'), U_IN = uHead - 20 / path.length, U_OUT = uHead + 30 / path.length, pIn = path.pointAt(U_IN), pOut = path.pointAt(U_OUT);
      const mid = pIn.clone().lerp(pOut, 0.5), fw = pOut.clone().sub(pIn), half = fw.length() / 2;
      fw.y = 0; fw.normalize();
      const rt = V(-fw.z, 0, fw.x), yawC = Math.atan2(-fw.z, fw.x);      // rt: outboard (starboard) of the course here
      const at = (f, h, r) => V(mid.x + fw.x * f + rt.x * r, mid.y + h, mid.z + fw.z * f + rt.z * r);
      const ico2 = new THREE.IcosahedronGeometry(1, 2), ico3 = new THREE.IcosahedronGeometry(1, 3);
      const lobe = (c, rx, ry, rz, yaw, flat, src = ico2, hole = 2, holeB = 2) => {
        let g = src.clone();
        if (hole < 1) {      // leave out the cap of faces beyond 'hole' along local +x: the way out
          const sp = src.attributes.position, sn = src.attributes.normal, P = [], N = [];
          for (let t = 0; t < sp.count; t += 3) {
            const fx = (sp.getX(t) + sp.getX(t + 1) + sp.getX(t + 2)) / 3;
            if (fx > hole || fx < -holeB) continue;      // and the cap beyond 'holeB' along -x: the way in
            for (let k = t; k < t + 3; k++) { P.push(sp.getX(k), sp.getY(k), sp.getZ(k)); N.push(sn.getX(k), sn.getY(k), sn.getZ(k)); }
          }
          g.dispose(); g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        }
        const p = g.attributes.position, n = g.attributes.normal, ph = new Float32Array(p.count).fill(ir.range(0, 6.28)), hh = new Float32Array(p.count), cs = Math.cos(yaw), sn = Math.sin(yaw);
        for (let k = 0; k < p.count; k++) {
          let x = p.getX(k) * rx, y = p.getY(k), z = p.getZ(k) * rz, nx = n.getX(k) / rx, ny = n.getY(k) / ry, nz = n.getZ(k) / rz;
          hh[k] = flat ? Math.max(0, y + 0.3) : y + 0.42;
          if (flat && y < -0.3) { y = -0.3; nx = 0; ny = -1; nz = 0; }
          const nl = Math.hypot(nx, ny, nz) || 1;
          p.setXYZ(k, c.x + cs * x + sn * z, c.y + (flat ? y + 0.3 : y) * ry, c.z - sn * x + cs * z);
          n.setXYZ(k, (cs * nx + sn * nz) / nl, ny / nl, (-sn * nx + cs * nz) / nl);
        }
        g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
        g.setAttribute('aH', new THREE.BufferAttribute(hh, 1));
        return g;
      };
      // the shell: a full ellipsoid, its short axis along the course, so both walls are crossed square-on
      const shellC = at(0, 2, 0), shellR = [half, 31, 46], HOLE = 0.93, hr0 = Math.sqrt(1 - HOLE * HOLE), HOLE_IN = 0.9, hrB = Math.sqrt(1 - HOLE_IN * HOLE_IN);
      const shellMat = cloudMaterial(whiteC, hx(mix(pal[6], pal[4], 0.3)), 0);
      const shell = new THREE.Mesh(lobe(shellC, shellR[0], shellR[1], shellR[2], yawC, false, ico3, HOLE, HOLE_IN), shellMat);
      shell.frustumCulled = false; scene.add(shell);
      await ctx.yield();
      // samples of the course outside the shell: nothing else of the cloud may come within 11 m of them
      const samp = []; for (let i = 0; i <= 240; i++) { const uu = U_IN - 0.07 + (0.985 - U_IN + 0.07) * i / 240; if (uu < U_IN - 0.002 || uu > U_OUT + 0.002) samp.push(path.pointAt(uu)); }
      const hits = (c, rx, ry, rz, yaw, flat) => {
        const cs = Math.cos(yaw), sn = Math.sin(yaw), m = 11;
        for (const q of samp) {
          const dx = q.x - c.x, dz = q.z - c.z, lx = cs * dx - sn * dz, lz = sn * dx + cs * dz, ly = q.y - c.y - (flat ? 0.3 * ry : 0);
          if (flat && ly < -0.3 * ry - m) continue;
          if ((lx / (rx + m)) ** 2 + (ly / (ry + m)) ** 2 + (lz / (rz + m)) ** 2 < 1) return true;
        }
        return false;
      };
      const parts = [], innerParts = [];
      // the window on the east country: as we come out and look east, no lobe of the floor or the deck stands in that view
      const winP = path.pointAt(U_OUT + 55 / path.length), winD = V(900 - winP.x, 0, 800 - winP.z).normalize();
      const inWindow = (c) => { const dx = c.x - winP.x, dz = c.z - winP.z, d = Math.hypot(dx, dz); return d < 300 && (dx * winD.x + dz * winD.z) / Math.max(d, 1) > 0.74; };
      // inside the shell: four lobes above and beside the eye line, their flat blue-grey undersides in view all the way through
      for (const [f, h, r, rx, ry, rz] of [[-2, 7.5, -15, 12, 9, 12], [5, 10.5, 15, 10, 8, 13], [-11, 13, 5, 11, 8, 10]]) innerParts.push(lobe(at(f, h, r), rx, ry, rz, yawC, true));
      await ctx.yield();
      // the way out is not a wall but a mouth in the far side, its rim a ring of small lobes: the country, the top ring and
      // the arch grow in it as we come, so no frame of the crossing is a blank
      for (let i = 0; i < 13; i++) {
        const a = (i + 0.5) / 13 * 6.283, sa = Math.sin(a), ca = Math.cos(a), rr = ir.range(5.2, 6.6) * (sa > 0.3 ? 0.9 : 1), k = 0.22;
        const c = V(shellC.x + fw.x * half * (HOLE - 0.02) + rt.x * ca * (hr0 * shellR[2] + rr * k), shellC.y + sa * (hr0 * shellR[1] + rr * k), shellC.z + fw.z * half * (HOLE - 0.02) + rt.z * ca * (hr0 * shellR[2] + rr * k));
        innerParts.push(lobe(c, rr * 0.75, rr, rr * 1.2, yawC, false, ico3));
        await ctx.yield();
      }
      await ctx.yield();
      // the way in is a mouth too, wider, with its own wreath of lobes: coming up to the cloud we look into it (the lobes inside,
      // the far mouth and the country in it) instead of at a white wall. The wreath is left open where the eye crosses its rim.
      const inPts = []; for (let i = 0; i <= 12; i++) inPts.push(path.pointAt(U_IN - 0.012 + 0.018 * i / 12));
      for (let i = 0; i < 15; i++) {
        const a = (i + 0.5) / 15 * 6.283, sa = Math.sin(a), ca = Math.cos(a), rr = ir.range(4.6, 6.2) * (sa < -0.3 ? 0.8 : 1), k = 0.25;
        const c = V(shellC.x - fw.x * half * (HOLE_IN - 0.02) + rt.x * ca * (hrB * shellR[2] + rr * k), shellC.y + sa * (hrB * shellR[1] + rr * k), shellC.z - fw.z * half * (HOLE_IN - 0.02) + rt.z * ca * (hrB * shellR[2] + rr * k));
        if (inPts.some((q) => q.distanceTo(c) < rr * 1.2 + 3.2)) continue;
        innerParts.push(lobe(c, rr * 0.75, rr, rr * 1.2, yawC, false));
        await ctx.yield();
      }
      await ctx.yield();
      // the pile round the shell (seen from the bite as piled lobes with flat undersides)
      const pile = [[-4, 15, -34, 36, 34, 30], [6, 19, 36, 40, 36, 36], [10, 30, 0, 42, 32, 46], [-30, -52, 50, 32, 26, 36], [-22, 4, 62, 30, 26, 30], [4, -44, 78, 40, 30, 38], [-14, 38, -52, 34, 26, 30], [24, 34, 46, 30, 24, 34]];
      for (const [f, h, r, rx, ry, rz] of pile) {
        const c = at(f, h, r); let guard = 0;
        while (hits(c, rx, ry, rz, yawC, true) && guard++ < 40) { c.y += h >= 0 ? 4 : -4; c.x += rt.x * 3 * Math.sign(r || 1); c.z += rt.z * 3 * Math.sign(r || 1); }
        if (guard < 40) parts.push(lobe(c, rx, ry, rz, yawC + ir.range(-0.3, 0.3), true, ico3));
        await ctx.yield();
      }
      await ctx.yield();
      // the floor we come out above: lobes outboard of the top ledge, tops a few metres under the eye
      const axis = (y) => V(TOWER.x + 0.0524 * y, y, TOWER.z), ax0 = axis(mid.y), b0 = Math.atan2(-(pOut.x - ax0.x), -(pOut.z - ax0.z));
      for (let i = 0; i < 11; i++) {
        const b = b0 + (2 + 4.6 * i) * DEG, rad = 204 + 34 * (i % 3) + ir.range(-6, 6), rx = ir.range(30, 42), ry = ir.range(20, 27), rz = ir.range(30, 40);
        const c = V(ax0.x - Math.sin(b) * rad, pOut.y - 50 - 1.3 * ry - 6 * (i % 3) - Math.max(0, i - 7) * 4, ax0.z - Math.cos(b) * rad); let guard = 0;
        while (hits(c, rx, ry, rz, -b, true) && guard++ < 40) { c.x -= Math.sin(b) * 5; c.z -= Math.cos(b) * 5; c.y -= 1.5; }
        if (guard < 40 && !inWindow(c)) parts.push(lobe(c, rx, ry, rz, -b, true, ico3));
        await ctx.yield();
      }
      await ctx.yield();
      // and the deck the long leg flies over: broad lobes well under the eye, with gaps to the sea
      const deckC = V(appr.x + 30, 0, appr.z + 150);
      for (let i = 0; i < 13; i++) {
        const a = i * 2.4 + ir.range(-0.3, 0.3), rad = i === 0 ? 0 : 55 + 135 * Math.sqrt(i / 13), rx = ir.range(48, 74), ry = ir.range(20, 28), rz = ir.range(44, 70);
        const c = V(deckC.x + Math.cos(a) * rad, appr.y - ir.range(38, 70) - 1.3 * ry, deckC.z + Math.sin(a) * rad * 0.8); let guard = 0;
        if (Math.hypot(c.x - TOWER.x, c.z - TOWER.z) < 215) continue;      // not on the tower: the top ring stays clear
        while (hits(c, rx, ry, rz, a, true) && guard++ < 30) c.y -= 3;
        if (guard < 30 && !inWindow(c)) parts.push(lobe(c, rx, ry, rz, a, true));
        if (i % 2) await ctx.yield();
      }
      await ctx.yield();
      const pileMat = cloudMaterial(whiteC, hx(mix(pal[6], pal[4], 0.6)), 2.2, 17), innerMat = cloudMaterial(whiteC, hx(mix(pal[6], pal[4], 0.75)), 0, 9);
      const pileGeo = mergeGeometries(parts);
      await ctx.yield();
      const pileMesh = new THREE.Mesh(pileGeo, pileMat), innerMesh = new THREE.Mesh(mergeGeometries(innerParts), innerMat);
      pileMesh.frustumCulled = false; innerMesh.frustumCulled = false; scene.add(pileMesh, innerMesh);
      for (const g of parts.concat(innerParts)) g.dispose(); ico2.dispose(); ico3.dispose();
      await ctx.yield();
    }

    // ---- falling red brick dust in the bite: flecks that drift down past the cut vaults ----
    const nDust = Math.round(900 * detail), dr = rng.fork('dust'), dpos = new Float32Array(nDust * 4);
    // (round p3) A fleck is kept when ur, the real u of the point of the course it is laid by, is not greater than uOut, the u
    // uNear finds nearest exc[0] (the first point of exc above) between uHead and 0.98, and dropped otherwise; live kept
    // them all, laid by points up to toReal(0.97). Every random number is drawn from dr for every fleck, kept or not, so a
    // kept fleck has the same four numbers as before; nKept counts the kept, which fill the buffer's first places in their
    // old order.
    const uOut = uNear(exc[0], uHead, 0.98); let nKept = 0;
    for (let i = 0; i < nDust; i++) { if (i % 200 === 199) await ctx.yield(); const ur = toReal(i % 9 ? 0.775 + 0.125 * (dr.range(0.6, 0.9) - 0.6) / 0.3 : dr.range(0.88, 0.97)), p = path.pointAt(ur); dpos.set([p.x + dr.gauss() * 13, p.y + dr.range(-26, 34), p.z + dr.gauss() * 13, dr.range(0, 1)], nKept * 4); if (ur <= uOut) nKept++; }
    const dustGeo = new THREE.InstancedBufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); dustGeo.setIndex([0, 1, 2, 0, 2, 3]);
    dustGeo.setAttribute('iP', new THREE.InstancedBufferAttribute(dpos, 4)); dustGeo.instanceCount = nKept;
    const dustMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uRed: { value: new THREE.Color(pal[1]) }, uRedS: { value: pig.brick[1] } },
      vertexShader: STYLE_DECL + /* glsl */`
        attribute vec4 iP; uniform vec3 uRed, uRedS; varying vec3 vC;
        void main() {
          float fall = mod(iP.w * 60.0 + uTime * (3.0 + 4.0 * fract(iP.w * 7.3)), 60.0);
          vec3 c = iP.xyz + vec3(1.5 * sin(uTime * 0.7 + iP.w * 40.0), 30.0 - fall, 1.5 * cos(uTime * 0.6 + iP.w * 31.0));
          vec4 cp = projectionMatrix * viewMatrix * vec4(c, 1.0);
          float pxPerM = uView.y * projectionMatrix[1][1] * 0.5 / max(abs(cp.w), 1e-3);
          float size = min(max((0.16 + 0.2 * fract(iP.w * 13.7)) * pxPerM, 4.0), 7.0 * uView.y / 450.0) * step(5.5, pxPerM);      // flecks are near things: past about 130 m they are not drawn, so no red confetti hangs in the far air
          // (round p4) a fleck was a screen square of side size, and the lower bound above was 3.2 inside a clamp; it is now a chip,
          // size pixels long and half as wide, turned in the picture's plane about its centre by ang, which starts at the fleck's
          // own angle and grows with the clock at the fleck's own rate (from 1.5 to just under 4.5 radians a second). The bounds
          // are applied as min(max(x, 4.0), upper), so the upper bound wins where it is the smaller.
          float ang = iP.w * 97.0 + uTime * (1.5 + 3.0 * fract(iP.w * 3.1));
          vec2 q = vec2(position.x, position.y * 0.5); q = vec2(cos(ang) * q.x - sin(ang) * q.y, sin(ang) * q.x + cos(ang) * q.y);
          cp.xy += q * size * 2.0 / uView * cp.w;
          vC = fract(iP.w * 5.1) < 0.5 ? uRed : uRedS;
          gl_Position = cp;
        }`,
      fragmentShader: /* glsl */`varying vec3 vC; void main() { gl_FragColor = vec4(vC, 1.0); }`,
    });
    const dust = new THREE.Mesh(dustGeo, dustMat); dust.frustumCulled = false; scene.add(dust);
    await ctx.yield();

    // ==== MORE ABOVE ====

    // The style's uniforms are one shared object (the part's STYLE_UNIFORMS). Two instances of this world can be alive at
    // once (this world seen through its own exit), so each keeps its own values and puts them back just before its scene is
    // drawn: the sky dome is the first thing drawn, and its onBeforeRender does it.
    const snapKeys = Object.keys(U), snap = {};
    for (const k of snapKeys) { const v = U[k].value; snap[k] = v && v.clone ? v.clone() : v; }
    const saveU = () => { for (const k of snapKeys) { const v = U[k].value; if (v && v.copy) snap[k].copy(v); else snap[k] = v; } };
    const restoreU = () => { for (const k of snapKeys) { const v = U[k].value; if (v && v.copy) v.copy(snap[k]); else U[k].value = snap[k]; } };
    sky.onBeforeRender = restoreU;

    // ---- the journey's frame ----
    const crownPoi = toWorld(A.crown), fleetPoi = V(170, 0, 1880);
    const _eye = new THREE.Vector3(), _sz = new THREE.Vector2();
    const pace = (u) => 1.45 - 0.45 * sstep(uQuay - 0.02, uQuay + 0.04, u) - 0.3 * sstep(uBite - 0.005, uBite + 0.06, u) + 0.3 * sstep(uHead - 0.01, uHead + 0.04, u);      // hurries the town, lingers on the swing out and along the cut, 1 from the cloud on
    const made = {
      scene, path, duration: 50, pace,      // the course is 2.9 km since the swing out was added; 50 s keeps the speeds of the 46 s brief
      camera: { fov: 62, near: 0.8, far: 12500, lookAhead: 24, sway: 0.5, bank: 0.3 },
      pois: [
        { at: crownPoi, from: 0.05, to: uClimb + 0.03, weight: 0.4 },
        { at: V(-640, 0, 1150), from: uClimb + 0.02, to: uNear(fly[5], uClimb, 0.7) + 0.01, weight: 0.4 },      // the top of the climb: down to the anchorage under the ramp, not up into the sky
        { at: V(-620, 0, 1420), from: uSw(1) - 0.012, to: uSw(4), weight: 0.42 },      // leaving the ledge: down on the roads and the fleet, not into the sky
        { at: V(-40, 228, 1262), from: uSw(3), to: uSw(10), weight: 0.82, fade: 0.28 },      // the swing: the whole flank, the cut side and the anchorage under it
        { at: V(-62, 318, 1352), from: uSw(9), to: uSw(13), weight: 0.6 },      // along the cut: the sliced rings, level and a little down
        { at: V(138, 403, 1317), from: uHead - 0.006, to: uNear(exc[1], uHead, 0.98) + 0.012, weight: 0.8 },      // close along the top ledge: the rising arcade, huts and men near, the crag behind, the arch far up the ring
        { at: crownPoi.clone().add(V(10, -42, 0)), from: uNear(exc[1], uHead, 0.98) - 0.006, to: 0.935, weight: 0.8, fade: 0.2 },      // out of the cloud and round: the summit whole above it (crag, top ring, huts, the arch and its crane)
        { at: toWorld(A.keystoneSlot).add(V(0, -8, 0)), from: 0.9, to: 0.985, weight: 0.8 },      // from the moment we are out of the cloud: the summit and its arch, to port of the wide swing
      ],
      portal: { shape: 'arch', width: 14, height: 15, color: pal[0], glow: 0.25, tilt: true, revealDistance: 420, blendDistance: 40 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      edition: { look: edition, squall, oxen: cast.oxen, hulks: cast.hulks, rare },
      marks: { uQuay, uClimb, uRamp, uBite, uHead, drop: toReal(0.695), magpies: toReal(0.52), crane: toReal(0.55), pallet: toReal(0.66) },      // real u of the landmarks (for reviewers and beats.json)      // which seeded edition this visit is (for reviewers)
      update(dt, time, camera, ur) {
        const u = toBrief(ur);      // everything scripted below runs on the brief's clock
        restoreU();
        camera.getWorldPosition(_eye);
        U.uRim.value = 1640 + _eye.y;
        { const h = Math.max(0, _eye.y - 60), b0 = 500 + 1.15 * h + 6.5 * Math.max(0, h - 270); U.uDist.value.set(b0, b0 + 200, 2500 + 0.8 * h, 3000 + 0.8 * h); }      // the three distances are told from where the eye stands: higher, the brown ring reaches further
        U.uLight.value.copy(lightDir);
        { const k = 1 - sstep(0.64, 0.76, u); cloudSway.set(60 * k * Math.sin(time * 0.17), 45 * k * Math.sin(time * 0.13 + 1)); }      // idle drift, gone before the crossing: there the cloud is placed by u alone
        hero.setProgress(u);
        hero.update(dt, time, camera);
        sky.position.copy(_eye);
        for (const f of tick) f(dt, time, camera, u, _eye, ur);
        saveU();
      },
      dispose() { hero.dispose(); },
    };
    // ONE MORE LOOK, between the top ledge's look and the summit's (round p1). Without this look the ledge's look lets go
    // before the summit's has taken hold: where the two cross, with the usual camera, the route's own heading keeps about
    // half of the weight, it points far off the tower there, and that camera flicks off the tower and back. This look is
    // spliced into the table between those two and is made from their fields; no number of theirs is written again (the
    // 0.2 below is this look's own fade and only happens to equal the summit look's). Read once, here at build: the ledge
    // look's from, to and fade, and the summit look's from, to, fade and weight. Read again each time this look is asked
    // for its place: the two looks' places, both fixed points. It begins where the ledge's look begins to let go, has
    // risen whole a fifth of the way through its own span, stays whole until the summit's look is whole and falls over its
    // last fifth; its weight is the summit look's; its place slides, eased in u, in a straight line from the ledge look's
    // place to the summit look's. The two looks are taken by their places in the list before the splice (the sixth and the
    // seventh, counted from one), so a later edit of the table has to answer it here. A later edit also has to keep these.
    // Both looks give from and to as numbers: the engine's defaults for a look that leaves one out (0 and 1) are not
    // supplied here; with a from or to left out, this look's own from or to would not be a number, the weight the engine
    // works out for it would not be a number at any u, and the engine does not skip such a weight. Both give their place
    // as a vector (fixed, if the slide is to stay a straight line): the engine also takes a place given as a list of three
    // numbers or as a function, which these lines do not. And the ledge's look begins to let go before the summit's is
    // whole: otherwise this look's to is not after its from. The engine's 0.3 for a look without a fade is written here
    // twice, once for each of the two, and has to follow the engine's; the ledge's look gives no fade, so its 0.3 is used,
    // and the summit's gives its own, so the second 0.3 is not used as the table stands.
    { const pois = made.pois, lg = pois[5], sm = pois[6], fd = 0.2, _fa = new THREE.Vector3(), _fb = new THREE.Vector3();
      const hold = lg.to - (lg.fade ?? 0.3) * (lg.to - lg.from), whole = sm.from + (sm.fade ?? 0.3) * (sm.to - sm.from);
      pois.splice(6, 0, { at: (t, u) => _fa.copy(lg.at).lerp(_fb.copy(sm.at), sstep(hold, whole, u)), from: hold, to: (whole - fd * hold) / (1 - fd), weight: sm.weight, fade: fd }); }
    // THE STEADY CAMERA KEEPS THE LAST FOUR LOOKS WHOLE (round p2). From the top ledge the course leaves the tower, turns over
    // the cloud deck and comes back to it. The viewer's steady camera gives a look 0.35 of its weight unless the look sets
    // steady: true, the engine's key. With 0.35 of the ledge's, the slide's and the summit's looks it followed the course's
    // own heading away from the tower and then, round the turn, lagged the gaze asked under its turn's ceiling: it
    // showed no part of the tower for some seconds (as the film flies it on seed 7, from u 0.79 to 0.88). The arch's
    // look has no weight before u 0.9 and no part in that; it sets the key so that the summit's
    // look hands the gaze over to it with the weights the usual camera has. The four are taken by their places in the list
    // as it stands after the splice above (the sixth to the ninth, counted from one: the top ledge's, the slide between,
    // the summit's, the arch's), so a later edit of the table has to answer it here too. With the key the steady camera
    // weighs these four as the usual camera does. Its turn is still the engine's slower one under the engine's ceiling,
    // its horizon level and its sway stilled; its longer reach ahead and its damped pitch act, as before, on the course's
    // own direction and not on a look's. With the usual camera the key changes nothing.
    for (let k = 5; k <= 8; k++) made.pois[k].steady = true;
    return made;
  },
};
