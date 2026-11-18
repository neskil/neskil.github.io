// THE FOREST BEFORE FLOWERS · 310 million years ago (late Carboniferous coal swamp, Euramerica).
// Flown as a griffinfly down a nave of Lepidodendron scale trees standing in black mirror water, while a river
// breaks its bank and a sheet of pale silt crosses the forest. The hero (the Colonnade and the flood) lives in
// ../parts/scale-tree-mire.js; this file supplies the sky, the light, the Calamites thicket, the outer forest
// (more scale trees, Sigillaria, Psaronius tree ferns), logs, litter, the amphibians, the hawking griffinflies,
// the palaeodictyopteran swarm, steam, spores, rain and the rare dry lightning with its fire line.
// World frame == hero frame: the nave runs along -Z, the river and the flood come from -X, the sun stands on +X.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeFoliageMaterial, makeBarkMaterial, tessellateTree, PERCH_Z, FALL_Z } from '../parts/scale-tree-mire.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const col = (hex) => new THREE.Color(hex);

// ---- the three hours / weathers of the brief
const MOODS = {
  noon: {
    elev: 68, az: 70, zenith: '#b9c6bd', horizon: '#d3d9bf', skyHor: '#BFD3DC', fog: '#b7c19c', fogD: 0.0078,
    sun: '#fff3d6', sunI: 3.9, hemiSky: '#cfd9c0', hemiGround: '#363d22', hemiI: 0.85, steam: '#C9D6A0', wall: '#46523a',
    sunColor: [1.06, 1.0, 0.86], skyFill: [0.285, 0.315, 0.255], shaftK: 1.7, exposure: 1.0, clouds: 0.34, tint: '#fbfff2', shadowTint: '#4b523f',
  },
  // polish 2: the low sun stays amber but the air, the shade and the far forest go cool (a blue-white tropical haze, teal shadows):
  // warm key against cool fill, so the flight is no longer one yellow-olive tone
  amber: {
    elev: 16, az: 80, zenith: '#8fb2c6', horizon: '#e6d2a6', skyHor: '#9fb6c2', fog: '#b6c0b2', fogD: 0.0078,
    sun: '#ffb463', sunI: 3.7, hemiSky: '#a9c0cc', hemiGround: '#26301f', hemiI: 0.82, steam: '#f0c988', wall: '#3a4b4a',
    sunColor: [1.2, 0.78, 0.4], skyFill: [0.25, 0.32, 0.36], shaftK: 1.3, exposure: 1.0, clouds: 0.3, tint: '#fff8ec', shadowTint: '#2c3c46',
  },
  // rain: a pewter sky with one pale warm break low over the far end of the nave (the light comes from there, so the trunks step
  // back as silhouettes against it and it lies down the black water as a silver lane)
  rain: {
    elev: 14, az: 3, zenith: '#7b8684', horizon: '#c3c7b9', skyHor: '#c9cbbb', fog: '#a2aa9b', fogD: 0.0098,
    sun: '#f1e8d2', sunI: 1.7, hemiSky: '#c2ccc4', hemiGround: '#2a3021', hemiI: 1.5, steam: '#c3cbb6', wall: '#262c22',
    sunColor: [0.42, 0.41, 0.37], skyFill: [0.5, 0.54, 0.51], shaftK: 0, exposure: 1.08, clouds: 0.8, tint: '#f4faf4', shadowTint: '#3a3f3c',
    bark: '#74766a', moss: '#5e6351', gap: [1.0, 0.95, 0.82],
  },
};
// ---- the three floods: cream silt, brick-red silt from another upland, or clear water that only sets the mirror sliding
const SILTS = {
  cream: { cream: '#E0D4AE', jade: '#BCD2BA', bounce: 1, ground: '#cfc49c' },
  brick: { cream: '#c98e62', jade: '#b9a184', bounce: 0.8, ground: '#b88860' },
  clear: { cream: '#6d7c58', jade: '#4f6a55', bounce: 0.4, ground: '#5d6c4c' },
};

export default {
  id: 'scale-tree-mire',
  name: 'The Forest before Flowers',
  category: 'prehistoric',
  media: ['air', 'water'],
  weirdness: 0.2,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- every seeded choice is drawn here, first, so nothing later can reshuffle it
    const vr = ctx.rng.fork('stm-vary');
    const mRoll = vr(), sRoll = vr(), young = vr() < 0.3, nHawk = vr.int(3, 7), nAmph = vr.int(3, 5), rare = !!vary.rare;
    // noon 45%, amber 35% (the low raking light is the look strangers keep), rain 20%
    let moodId = mRoll < 0.45 ? 'noon' : mRoll < 0.6 || mRoll >= 0.8 ? 'amber' : 'rain';
    if (vary.hour === 'day') moodId = 'noon'; else if (vary.hour === 'golden') moodId = 'amber'; else if (vary.hour === 'dawn' && mRoll > 0.5) moodId = 'rain';
    if (rare && moodId === 'rain') moodId = 'noon';                                   // the lightning of the rare event is DRY lightning
    const siltId = sRoll < 0.55 || (sRoll >= 0.7 && sRoll < 0.85) ? 'cream' : sRoll < 0.7 ? 'brick' : 'clear';
    const mood = MOODS[moodId], silt = SILTS[siltId];
    const pal = ['#2a2113', mood.bark || '#5F6B4C', mood.moss || '#3E6A2F', mood.steam, silt.cream, silt.jade, '#E8A23A'];
    const rngLay = ctx.rng.fork('stm-layout'), rngCal = ctx.rng.fork('stm-calamites'), rngFern = ctx.rng.fork('stm-ferns'),
      rngLife = ctx.rng.fork('stm-life'), rngFx = ctx.rng.fork('stm-fx');

    const scene = new THREE.Scene();
    const sunDir = skyDirection(mood.elev, mood.az).clone().normalize();
    const sky = makeSky({
      rng: ctx.rng, preset: moodId === 'rain' ? 'overcast' : 'day', zenith: mood.zenith, horizon: mood.horizon, ground: mood.fog,
      sunElevation: mood.elev, sunAzimuth: mood.az, sunColor: mood.sun, sunSize: 2.2, sunIntensity: moodId === 'rain' ? 3 : 5, sunGlow: moodId === 'rain' ? 1.2 : 0.9, sunGlowTight: 0.3, ...(moodId === 'rain' ? { veil: 1.5 } : {}),
      scatterColor: moodId === 'amber' ? '#ffd9a0' : moodId === 'rain' ? '#efe6cf' : '#f4f1d8', scatter: moodId === 'rain' ? 0.6 : 0.4,
      clouds: { coverage: mood.clouds, softness: 0.4, scale: 0.7, lit: moodId === 'rain' ? '#b4bcb6' : '#f3efe0', shade: moodId === 'rain' ? '#7b8582' : '#9aa7a6', haze: 0.35, wind: [0.006, 0.002] },
      clouds2: false, fogColor: mood.fog,
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(col(mood.fog), mood.fogD);
    const sun = new THREE.DirectionalLight(col(mood.sun), mood.sunI); sun.position.copy(sunDir).multiplyScalar(200); scene.add(sun, sun.target);
    const hemiGround0 = col(mood.hemiGround), hemiGround1 = col(silt.ground);
    const hemi = new THREE.HemisphereLight(col(mood.hemiSky), hemiGround0.clone(), mood.hemiI); scene.add(hemi);
    await ctx.yield();

    // ---- the outer forest joins the hero's own instanced meshes: more scale trees, Sigillaria (flood splits round them all)
    const extraTrees = [], extraSigillaria = [], taken = [];                        // taken: [x, z, r] of everything that stands in the water
    const free = (x, z, r) => { for (const t of taken) { const dx = t[0] - x, dz = t[1] - z, rr = t[2] + r; if (dx * dx + dz * dz < rr * rr) return false; } return true; };
    const nOuter = 24, nSig = 30;
    // the rows run on past the Colonnade to the fallen tree and flank the ring
    for (const [x0, z0] of [[-8.5, -167], [8.2, -170], [-9.5, -184], [9.4, -187], [-8, -201], [8.8, -204], [-10.5, -213], [11, -211], [-15, -252], [14, -250], [-11.5, -275], [12, -277]]) {
      const x = x0 + rngLay.range(-1, 1), z = z0 + rngLay.range(-2.5, 2.5); taken.push([x, z, 2.6]); extraTrees.push({ x, z, s: rngLay.range(0.9, 1.06), juvenile: false });
    }
    for (let k = 0, tries = 0; k < nOuter && tries < 900; tries++) {
      const side = tries % 2 ? 1 : -1, near = rngLay() < 0.62;
      const x = side * (near ? rngLay.range(17.5, 30) : rngLay.range(30, 52)), z = rngLay() < 0.42 ? rngLay.range(-300, -140) : rngLay.range(-140, 150);
      if (side < 0 && Math.abs(z - 10) < 22 && Math.abs(x) > 24) continue;          // the breach: a gap in the left wall
      if (!free(x, z, 7)) continue;
      taken.push([x, z, 2.6]); extraTrees.push({ x, z, s: rngLay.range(0.86, 1.06), juvenile: young ? rngLay() < 0.55 : rngLay() < 0.12 }); k++;
    }
    if (young) for (let k = 0; k < 9; k++) {                                           // a younger stand: shaggy unforked poles between the columns
      const side = k % 2 ? 1 : -1, x = side * rngLay.range(10.5, 16), z = 140 - k * 31 + rngLay.range(-8, 8);
      if (free(x, z, 4)) { taken.push([x, z, 1.5]); extraTrees.push({ x, z, s: rngLay.range(0.9, 1.25), juvenile: true }); }
    }
    for (const [x, z] of [[-19, -246], [20, -259], [-25, -271], [26, -244], [-17, -290], [16, -292]]) { taken.push([x, z, 2.1]); extraSigillaria.push({ x, z, s: rngLay.range(0.85, 1.1) }); }
    for (let k = 0, tries = 0; k < nSig && tries < 900; tries++) {
      const side = tries % 2 ? 1 : -1, x = side * rngLay.range(15, 46), z = rngLay() < 0.4 ? rngLay.range(-300, -150) : rngLay.range(-150, 158);
      if (side < 0 && Math.abs(z - 10) < 20 && Math.abs(x) > 24) continue;
      if (Math.abs(z - FALL_Z) < 14 && Math.abs(x) < 26) continue;                      // the doorway keeps its own Sigillaria only
      if (!free(x, z, 5.5)) continue;
      taken.push([x, z, 2.1]); extraSigillaria.push({ x, z, s: rngLay.range(0.8, 1.12) }); k++;
    }
    await ctx.yield();
    const hero = await buildHero(ctx, {
      palette: pal, detail, sunDir: sunDir.toArray(), sunColor: mood.sunColor, skyFill: mood.skyFill,
      sky: { zenith: mood.zenith, horizon: mood.skyHor, wall: mood.wall }, shafts: true, creatures: true,
      extraTrees, extraSigillaria, spareGriffinflies: nHawk + 2, bounce: silt.bounce, rain: moodId === 'rain' ? 1 : 0, gap: mood.gap ? { dir: [0.05, 0.2, -1], color: mood.gap } : null, shaftMod: moodId === 'noon' ? 1 : moodId === 'amber' ? 0.3 : 0,
    });
    scene.add(hero.object);
    hero.uniforms.uShaftK.value = mood.shaftK;
    if (moodId === 'rain') { hero.uniforms.uWetSheen.value.set(0.3, 0.33, 0.32); hero.uniforms.uWetDir.value.set(0, 0.35, -1).normalize(); }
    const A = hero.anchors, HU = hero.uniforms;
    for (const t of A.trunks) taken.push([t[0], t[1], 2.6]);
    await ctx.yield();

    // ---- the flight: the artist's line, entry level, the climb into the crowns, low over the marble, 67 m straight and rising
    // u 0.18: we swing left past the griffinfly perched on a trunk of the left row, wings out flat
    const perchTree = A.trunks.filter((t) => t[0] < 0 && t[0] > -11 && t[3] > 25).reduce((b, t) => (Math.abs(t[1] - PERCH_Z) < Math.abs(b[1] - PERCH_Z) ? t : b), [-7, 1e6, 0.75, 35]);
    const perchN = V3(0.9, 0, 0.44).normalize(), perchPos = V3(perchTree[0] + perchN.x * (perchTree[2] * 0.93 + 0.1), 3.25, perchTree[1] + perchN.z * (perchTree[2] * 0.93 + 0.1));
    // The line is the artist's, re-laid so that the three close passes are made by the PATH (the steady camera gives a point of
    // interest only a third of its pull): down early from the crowns to pass the basking log low on our right, in along the right
    // of the nave so the Arthropleura's mound lies ahead and a little right for 25 m, then a dart that leans toward three mounds.
    const AT = A.arthropleuraMound, arthLook = V3(...A.arthropleura.center).add(V3(0, 0.4, 0)), UA = A.arthropleura.progress, UB = 0.34;
    const BASK = { x: 2.9, z: 55.1, ax: V3(0.81, 0, 0.58) };                              // the log lies across our view; its nave end is the far one
    // Entry 7.2 m up (the portal's whole opening then stands clear of the water: no blank band under it), sinking to 3 m past the
    // lone tree. At the mound we come in high and pass OVER the Arthropleura: 2.6 m up and 3 m short of it at UA, looking down.
    // Polish 1: the same line re-timed so that each close pass falls on a frame a visitor keeps (perch u 0.16, the look up u 0.25,
    // the basking log u 0.34, the lip u 0.52, the Arthropleura u 0.61), and a second climb at u 0.70: up to 9.5 m over the flooded
    // nave, looking down on the marble and the standing wakes, then down past the stumps to the doorway.
    const BZ = 13.6;
    const fly = [[0, 7.2, 218.6], [0, 7.0, 206], [0.2, 5.4, 191], [0.6, 3.7, 177], [0.2, 3.1, 163], [perchPos.x + 1.95, 3.15, perchPos.z + 1.3], [perchPos.x + 3.6, 4.6, perchPos.z - 14], [-0.8, 7.5, 110.8], [0.3, 12, 89.8],
      [1.4, 5.2, 57.5 + BZ], [2.2, 1.9, 48.5 + BZ], [2.1, 1.3, 43.8 + BZ], [1.2, 1.35, 39 + BZ], [0.9, 1.7, 30 + BZ], [-0.2, 1.45, 21], [0.4, 2.7, -8], [1.2, 3.3, -36], [AT[0] - 4.1, 3.6, AT[2] + 17.1], [AT[0] - 4.4, 2.1, AT[2] + 1.9], [AT[0] - 4.6, 1.8, AT[2] - 7.9],
      [1.5, 2.6, -90], [0.4, 6, -101], [0.4, 9.5, -113], [-0.5, 9.3, -127], [-1.4, 5.5, -150], [-0.6, 2.2, -168], [0, 1.25, -182], [0, 1.2, -193], [0, 5.46, -235], [0, 8, -260]];
    const path = makePath(fly);
    const zOfU = (u) => path.pointAt(clamp(u, 0, 1)).z, uOfZ = (z) => path.nearestXZ(0, z).u;
    await ctx.yield();

    // ---- one lit plant material for everything of ours that is opaque and vertex-coloured (Calamites, fern trunks, logs):
    // sway by height in world space (iSw: phase, amount), blade tremble (aBl), the light thrown up by the silt.
    const plantMat = new THREE.MeshLambertMaterial({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide });
    plantMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = HU.uTime; sh.uniforms.uBounce = HU.uBounce; sh.uniforms.uBounceCol = HU.uBounceCol; sh.uniforms.uFill = HU.uFill; sh.uniforms.uKeyBar = HU.uKeyBar;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 iSw; attribute float aBl; attribute vec2 aNd; uniform float uTime; varying float vBl; varying vec2 vNd; varying vec3 vPW; varying vec3 vTn;')
        .replace('#include <project_vertex>', `
          vec4 mvPosition = vec4(transformed, 1.);
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
          #endif
          { float hh = max(mvPosition.y, 0.) * .1, sw = hh * hh * iSw.y;
            mvPosition.x += (sin(uTime * .7 + iSw.x) * .22 + sin(uTime * 1.9 + iSw.x * 3.) * .05) * sw;
            mvPosition.z += cos(uTime * .55 + iSw.x * 1.7) * .16 * sw;
            mvPosition.y += aBl * iSw.y * .05 * sin(uTime * 4.3 + iSw.x * 5. + mvPosition.y * 2.);
            vBl = aBl; vNd = aNd; vPW = mvPosition.xyz;
            float tk = step(.5, iSw.y), t1 = fract(iSw.x * 3.7), t2 = fract(iSw.x * 7.3);          // every stem its own green: yellower, bluer, darker
            vTn = mix(vec3(1.), vec3(.74 + .3 * t1, .7 + .42 * t2, .62 + .5 * t1 * t2), tk); }
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBounceCol, uFill; uniform float uBounce; uniform vec4 uKeyBar; varying float vBl; varying vec2 vNd; varying vec3 vPW; varying vec3 vTn;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb *= vTn;
          if (vNd.y > -1.4 && vNd.y < -1.1) {                                   // a Calamites stem: fine ribs running up it, a dark sheath under each joint
            float rb = abs(fract(vNd.x) - .5), rk = 1. - smoothstep(.3, .9, fwidth(vNd.x));
            diffuseColor.rgb *= mix(1., .72 + .5 * smoothstep(.08, .4, rb), rk);
          } else if (vNd.y > -.5) {                                                    // a whorl: a cone of leaf cut into needles; solid when too far to resolve them
            float nw = fwidth(vNd.x), lv = max(exp2(-floor(log2(max(nw * 7., 1.)))), .25), nx = vNd.x * lv;
            float nd = abs(fract(nx) - .5), open = mix(.25, .1, vNd.y) * (1. + .35 * (1. - lv));
            if (nd > open) discard;
            diffuseColor.rgb *= (.82 + .36 * fract(floor(nx) * .37)) * mix(.8, 1.12, vNd.y);
          } else if (vNd.y < -1.5) {                                            // a tree-fern trunk: a mantle of hanging roots
            float tt = clamp(-vNd.y - 2., 0., 1.), fw = fwidth(vNd.x);
            float sx = vNd.x + .22 * sin(vPW.y * 2.3 + vNd.x * .7), si = floor(sx), sf = abs(fract(sx) - .5);
            float ridge = mix(1. - smoothstep(.1, .42, sf), .5, smoothstep(.3, .9, fw));
            float knot = .85 + .3 * sin(vPW.y * 9. + si * 4.1) * sin(vPW.y * 3.7 + si * 1.3);
            vec3 rootC = diffuseColor.rgb * (.8 + .4 * fract(si * .618)) * knot * mix(.55, 1.3, ridge) * (.8 + .4 * sin(vPW.y * 1.1 + vPW.x) * sin(vPW.y * .47 + vPW.z));
            vec2 fb = vec2(vNd.x * .5 + floor(vPW.y * 3.) * .5, vPW.y * 3.);         // old frond bases under the crown: rows of pale stubs
            float stub = mix(1. - smoothstep(.2, .45, length(fract(fb) - .5)), .4, smoothstep(.3, .9, fw));
            diffuseColor.rgb = mix(rootC, diffuseColor.rgb * (.8 + .4 * stub), smoothstep(.8, .9, tt));
          }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { vec3 pV = normalize(vViewPosition); float back = 0.; vec3 lcol = vec3(0.);
            #if NUM_DIR_LIGHTS > 0
              back = max(dot(-pV, directionalLights[0].direction), 0.); lcol = directionalLights[0].color;
            #endif
            float kb = uKeyBar.w * (1. - smoothstep(.35, 1., length((vPW.xz - uKeyBar.xy) / max(uKeyBar.z, .1))));
            totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * uBounce * .8 + uFill * .55 + lcol * (back * back * .35 * vBl + kb * .22)); }`);
    };
    plantMat.customProgramCacheKey = () => 'stm-plant';
    const geoFrom = (pos, colr, bl, idx, nd) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('aBl', new THREE.Float32BufferAttribute(bl, 1));
      const ndA = new Float32Array(bl.length * 2); for (let i = 0; i < bl.length; i++) { ndA[i * 2] = nd ? nd[i * 2] : 0; ndA[i * 2 + 1] = nd ? nd[i * 2 + 1] : -1; }
      g.setAttribute('aNd', new THREE.Float32BufferAttribute(ndA, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S3 = V3(), P3 = V3(), E3 = new THREE.Euler();
    await ctx.yield();

    // ---- CALAMITES, the giant horsetail: one bamboo joint with its whorl of thin upswept leafy branches, instanced up every stem.
    // Two cuts of the joint: the full one for the thicket beside the lane, a light one for the walls and the far thicket.
    const calGeo = (lod) => {
      const pos = [], cl = [], bl = [], nd = [], idx = [], pale = col('#8f9f6c'), mid = col('#71844f'), node = col('#2c3820'), leaf = col('#4d6a3a'), tip = col('#7c9460');
      const NSD = lod ? 3 : 5, NC = 5, NEED = 16;
      const ring = (y, r, c) => { const i0 = pos.length / 3; for (let j = 0; j < NSD; j++) { const a = j / NSD * TAU; pos.push(Math.cos(a) * r, y, Math.sin(a) * r); cl.push(c.r, c.g, c.b); bl.push(0); nd.push(j / NSD * 18, -1.25); } return i0; };
      const rings = lod ? [ring(0, 1.0, pale), ring(1.0, 1.0, node)] : [ring(0, 1.0, mid), ring(0.9, 0.9, pale), ring(1.0, 1.28, node)];
      for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < NSD; j++) { const j1 = (j + 1) % NSD, a = rings[k], b = rings[k + 1]; idx.push(a + j, b + j, a + j1, a + j1, b + j, b + j1); }
      // the whorl: a shallow upswept cone the shader cuts into sixteen needles
      const prof = lod ? [[1.0, -0.02, node, 0], [4.3, 0.46, tip, 1]] : [[1.0, -0.03, node, 0], [2.7, 0.17, leaf, 0.5], [4.5, 0.5, tip, 1]], c0 = pos.length / 3;
      prof.forEach(([out, up, c, b]) => { for (let j = 0; j <= NC; j++) { const a = j / NC * TAU; pos.push(Math.cos(a) * out, 1.0 + up, Math.sin(a) * out); cl.push(c.r, c.g, c.b); bl.push(b); nd.push(j / NC * NEED, b); } });
      for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < NC; j++) { const a = c0 + k * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      return geoFrom(pos, cl, bl, idx, nd);
    };
    const stems = [];                                                                     // [x, z, height, radius, lod]
    const nThick = Math.round(250 * (0.5 + 0.5 * detail) * (0.85 + 0.15 * density));
    for (let k = 0, tries = 0; k < nThick && tries < 6000; tries++) {                     // the thicket of the first 58 m, a 5 m lane through it
      const side = rngCal() < 0.5 ? -1 : 1, band = rngCal(), ax = band < 0.6 ? rngCal.range(3.6, 9.5) : band < 0.88 ? rngCal.range(9.5, 20) : rngCal.range(20, 42);
      const x = side * ax, z = rngCal.range(ax < 8 ? 179 : 158, 238);
      if (!free(x, z, 1.5) || (z > 203 && ax < 7.6)) continue;
      taken.push([x, z, ax < 9.5 ? 0.25 : 0.6]); stems.push([x, z, rngCal.range(8, 12) * (ax < 5 ? 0.9 : 1), rngCal.range(0.13, 0.17), ax > 9.5 ? 1 : 0]); k++;
    }
    const nWall = Math.round(215 * (0.5 + 0.5 * detail));
    for (let k = 0, tries = 0; k < nWall && tries < 5000; tries++) {                      // clumps along the walls and a dense dark bank behind the ring
      const behind = k < 120, cxz = behind ? [rngCal.range(-40, 40), rngCal.range(-304, -281)] : [rngCal.sign() * rngCal.range(13, 40), rngCal.range(-280, 140)];
      const n = rngCal.int(2, 5);
      for (let j = 0; j < n && k < nWall; j++) {
        const x = cxz[0] + rngCal.range(-2.5, 2.5), z = cxz[1] + rngCal.range(-2.5, 2.5);
        if (Math.abs(x) < 11.5 && z > -270) continue;
        if (!free(x, z, 1.2)) continue;
        taken.push([x, z, 0.25]); stems.push([x, z, rngCal.range(8, 13) * (behind ? 1.15 : 1), rngCal.range(0.13, 0.18), 1]); k++;
      }
    }
    await ctx.yield();
    for (const lod of [0, 1]) {
      const mats = [], sws = [];
      for (let s = 0; s < stems.length; s++) {
        if (stems[s][4] !== lod) continue;
        const [x, z, H0, r0] = stems[s], ph = rngCal() * TAU, lean = rngCal.range(-0.03, 0.03) * 2.6, lean2 = rngCal.range(-0.03, 0.03) * 2.6, rot = rngCal() * TAU;
        // no two alike: young short stems among the tall, thick and thin, close-jointed and long-jointed, leaning every way
        const v1 = (ph * 1.618) % 1, v2 = (ph * 2.718) % 1, H = H0 * (lod ? 1 : 0.55 + 0.75 * v1), r = r0 * (0.72 + 0.6 * v2);
        let y = -0.5, jl = H / (lod ? 6.5 : 4.9 + 3.0 * v2);
        for (let j = 0; y < H; j++) {
          const t = clamp(y / H, 0, 1), rr = r * (1 - 0.72 * t * t) * (j === 0 ? 1.1 : 1), len = jl * (1 - 0.42 * t);
          Q4.setFromEuler(E3.set(lean, rot + j * 0.52, lean2));
          M4.compose(P3.set(x - lean2 * y, y, z + lean * y), Q4, S3.set(rr, len, rr)); mats.push(M4.clone()); sws.push(ph, 1);
          y += len;
        }
        if (s % 60 === 59) await ctx.yield();
      }
      const im = new THREE.InstancedMesh(calGeo(lod), plantMat, Math.max(1, mats.length));
      for (let i = 0; i < mats.length; i++) im.setMatrixAt(i, mats[i]);
      im.count = mats.length;
      im.geometry.setAttribute('iSw', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(2, sws.length)).fill(0).map((v, i) => sws[i] ?? 0), 2));
      im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // ---- PSARONIUS tree ferns: a trunk wrapped in a skirt of black roots, a crown of ten arching fronds 3 m long
    const leafMat = makeFoliageMaterial(HU, pal);
    const frondGeo = (list, croz = 4) => {                 // list of { p: base, a: azimuth, up: start elevation, droop, L, W } -> pinnate strips for the leaf shader
      const pos = [], nor = [], card = [], piv = [], idx = [], NS = 6;
      for (const f of list) {
        const cx = Math.cos(f.a), sz = Math.sin(f.a), i0 = pos.length / 3, ph = f.ph;
        let x = 0, y = 0;
        for (let i = 0; i <= NS; i++) {
          const t = i / NS, el = f.up - f.droop * t, w = f.W;
          if (i > 0) { const e0 = f.up - f.droop * (t - 0.5 / NS); x += Math.cos(e0) * f.L / NS; y += Math.sin(e0) * f.L / NS; }
          for (const s of [-1, 1]) {
            pos.push(f.p.x + cx * x - sz * s * w, f.p.y + y - 0.12 * w * (1 - t), f.p.z + sz * x + cx * s * w);
            nor.push(-cx * Math.sin(el) * 0.6 + -sz * s * 0.25, 0.75 + 0.25 * Math.cos(el), -sz * Math.sin(el) * 0.6 + cx * s * 0.25);
            card.push(s, t, 2); piv.push(f.p.x, f.p.y, f.p.z, ph);
          }
          if (i < NS) { const a = i0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      }
      for (let k = 0; k < croz; k++) {                                           // young fronds still rolled up at the heart of the crown: croziers
        const a = k * 1.7 + 0.4, out = V3(Math.cos(a), 0, Math.sin(a)), sd = V3(-out.z, 0, out.x), c0 = list[0].p, i0 = pos.length / 3, NC = 7;
        const stalk = c0.clone().addScaledVector(out, 0.22).add(V3(0, 0.75 + 0.12 * k, 0)), cen = stalk.clone().addScaledVector(out, 0.2);
        for (let i = 0; i <= NC; i++) {
          const t = i / NC, q = V3();
          if (t < 0.35) q.copy(c0).lerp(stalk, t / 0.35); else { const tt = (t - 0.35) / 0.65, ang = tt * TAU * 1.15, rr = 0.2 * (1 - 0.62 * tt); q.copy(cen).addScaledVector(out, -Math.cos(ang) * rr).add(V3(0, Math.sin(ang) * rr, 0)); }
          for (const sg of [-1, 1]) { pos.push(q.x + sd.x * sg * 0.06, q.y, q.z + sd.z * sg * 0.06); nor.push(out.x * 0.5, 0.8, out.z * 0.5); card.push(sg, t, 1); piv.push(c0.x, c0.y, c0.z, k); }
          if (i < NC) { const b = i0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aCard', new THREE.Float32BufferAttribute(card, 3)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(piv, 4)); g.setIndex(idx);
      return g;
    };
    // the trunk is stout and flares to 1.3 m at the water inside a shaggy mantle of black roots; old frond bases thicken its top
    const fernTrunkGeo = (() => {
      // aNd on this mesh: x = strand coordinate round the trunk (30 hanging roots), y = -2 - height (0 at the water, 1 under the
      // crown): the plant shader draws the root mantle as ochre-ridged brown strands and the old frond bases as rows of stubs
      const pos = [], cl = [], bl = [], nd = [], idx = [], rows = [[-0.5, 0.86], [0.0, 0.76], [0.6, 0.66], [1.4, 0.56], [2.6, 0.48], [4.2, 0.42], [5.6, 0.39], [6.4, 0.41], [6.82, 0.47], [7.02, 0.16]], NSD = 10, RW = NSD + 1;
      const ca = col('#352e24'), cb = col('#50473a'), cc = col('#6f6c44');
      rows.forEach(([y, r], i) => { const rid = 0.16 * Math.exp(-Math.max(y, 0) / 2.2) + 0.04; for (let j = 0; j <= NSD; j++) { const jj = j % NSD, a = jj / NSD * TAU + i * 0.11, rr = r * (jj % 2 ? 1 + rid : 1 - rid); pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
        const c = (jj % 2 ? cb : ca).clone().lerp(cc, i > 6 ? 0.55 : 0); cl.push(c.r, c.g, c.b); bl.push(0); nd.push(j / NSD * 30, -2 - clamp(y / 7, 0, 1)); } });
      for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < NSD; j++) { const a = i * RW, b = a + RW; idx.push(a + j, b + j, a + j + 1, a + j + 1, b + j, b + j + 1); }
      for (let k = 0; k < 14; k++) {                                              // loose roots hanging out of the mantle
        const a = k / 14 * TAU + 0.2 * Math.sin(k * 2.7), y0 = 0.7 + 0.9 * ((k * 7) % 5) / 5, r0 = 0.66 - 0.07 * y0, r1 = 0.98 + 0.22 * ((k * 3) % 4) / 4, i0 = pos.length / 3, c = k % 2 ? cb : ca;
        pos.push(Math.cos(a - 0.13) * r0, y0, Math.sin(a - 0.13) * r0, Math.cos(a + 0.13) * r0, y0, Math.sin(a + 0.13) * r0, Math.cos(a) * r1, -0.15, Math.sin(a) * r1);
        for (let q = 0; q < 3; q++) { cl.push(c.r, c.g, c.b); bl.push(0); nd.push(0, -1); } idx.push(i0, i0 + 1, i0 + 2);
      }
      return geoFrom(pos, cl, bl, idx, nd);
    })();
    // the crown: a shuttlecock of broad lacy fronds arching up and out, their tips bowing; shorter young fronds stand inside them
    const crownFronds = [];
    for (let k = 0; k < 14; k++) crownFronds.push({ p: V3(0, 6.9, 0), a: k / 14 * TAU + rngFern.range(-0.16, 0.16), up: rngFern.range(0.85, 1.2), droop: rngFern.range(1.3, 1.75), L: rngFern.range(3.0, 3.8), W: 0.9, ph: rngFern() * TAU });
    for (let k = 0; k < 5; k++) crownFronds.push({ p: V3(0, 6.95, 0), a: k / 5 * TAU + rngFern.range(-0.3, 0.3), up: rngFern.range(1.28, 1.45), droop: rngFern.range(0.6, 0.95), L: rngFern.range(1.7, 2.4), W: 0.6, ph: rngFern() * TAU });
    const fernCrownGeo = frondGeo(crownFronds);
    {
      const nTF = Math.round(44 * (0.5 + 0.5 * detail)), tf = [];
      for (let k = 0, tries = 0; k < nTF && tries < 3000; tries++) {
        const set = [[-6.6, -243.5], [7.0, -246.5], [-17, -268], [18, -241], [-8.5, -283], [8, -286], [-23, -284], [24, -273]][k];
        const behind = !set && k < 15, near = !set && !behind && k < 26;
        const x = set ? set[0] + rngFern.range(-1, 1) : behind ? rngFern.range(-34, 34) : rngFern.sign() * (near ? rngFern.range(11.5, 15.5) : rngFern.range(16, 42));
        const z = set ? set[1] + rngFern.range(-1, 1) : behind ? rngFern.range(-306, -288) : rngFern.range(-270, 150);
        if (!set && (!free(x, z, near ? 3.2 : 2.4) || (Math.abs(z - FALL_Z) < 13 && Math.abs(x) < 22))) continue;
        taken.push([x, z, 0.9]); tf.push([x, z, rngFern.range(0.8, 1.2), rngFern() * TAU, rngFern() * TAU]); k++;
      }
      const tr = new THREE.InstancedMesh(fernTrunkGeo, plantMat, tf.length), cr = new THREE.InstancedMesh(fernCrownGeo, leafMat, tf.length), sw = new Float32Array(tf.length * 2);
      tf.forEach(([x, z, s, rot, ph], i) => { M4.compose(P3.set(x, 0, z), Q4.setFromEuler(E3.set(0, rot, 0)), S3.set(s, s, s)); tr.setMatrixAt(i, M4); cr.setMatrixAt(i, M4); sw[i * 2] = ph; sw[i * 2 + 1] = 0.25; });
      tr.geometry.setAttribute('iSw', new THREE.InstancedBufferAttribute(sw, 2));
      tr.frustumCulled = cr.frustumCulled = false; scene.add(tr, cr);
    }
    await ctx.yield();

    // ---- fallen logs, half sunk beside the lane every 20-30 m (the first one found near u 0.34 on the right is the basking log)
    // Each log is a fallen scale-tree trunk: the hero's own tube and diamond bark (a material of its own whose water line sits
    // lower, so the top of the log is dry olive bark and only the foot is stained and wet), both ends broken off ragged round a
    // rotted-out core (the splintered rim and the dark hollow are a second small mesh in the plant material).
    const LOG_R = 0.32, logJag = (j, e) => 0.05 + 0.24 * Math.abs(Math.sin(j * 2.4 + e * 1.9) * Math.sin(j * 0.9 + 1.3 + e));
    const logParts = (len) => {
      const P = [], R = [], NP = 8;
      for (let i = 0; i < NP; i++) { const t = i / (NP - 1); P.push(V3(0.15 * Math.sin(t * 3.4 + len), (t - 0.5) * len, 0.085 * Math.sin(t * 3.1 + 1) + 0.03 * Math.sin(t * 8.3)));
        R.push(LOG_R * (0.98 - 0.12 * t + 0.07 * Math.sin(t * 7.3 + len) + 0.04 * Math.sin(t * 15 + 2) + 0.2 * Math.exp(-(1 - t) * 4.5))); }
      const g = tessellateTree({ tubes: [{ P, R, kind: 0, level: 0 }], spokes: [0.4], cell: 0.125 }, 0), pa = g.attributes.position, W = 17;
      for (const [i, sg, e] of [[0, -1, 0], [NP - 1, 1, 1]]) for (let j = 0; j < W; j++) pa.setY(i * W + j, pa.getY(i * W + j) + sg * logJag(j % 16, e) * 1.3 + 0.22 * pa.getX(i * W + j));   // broken off on the slant: the break shows its face
      g.computeVertexNormals();
      const pos = [], cl = [], bl = [], idx = [], wood = col('#7d6f55'), punk = col('#3d3122'), hole = col('#0e0a06');
      for (const [i, sg, e] of [[0, -1, 0], [NP - 1, 1, 1]]) {
        const b0 = pos.length / 3;
        for (let j = 0; j < 16; j++) {
          const k = (i * W + j) * 3, x = pa.array[k], y = pa.array[k + 1], z = pa.array[k + 2], c = wood.clone().lerp(punk, 0.25 + 0.5 * ((j * 7) % 5) / 5);
          pos.push(x * 0.99, y, z * 0.99, x * 0.6, y - sg * (0.06 + 0.3 * logJag(j, e)), z * 0.6); cl.push(c.r, c.g, c.b, punk.r, punk.g, punk.b); bl.push(0, 0);
        }
        const cen = pos.length / 3; pos.push(P[i].x, P[i].y - sg * 0.75, P[i].z); cl.push(hole.r, hole.g, hole.b); bl.push(0);
        for (let j = 0; j < 16; j++) { const a = b0 + j * 2, b = b0 + ((j + 1) % 16) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, cen); }
      }
      return { bark: g, ends: geoFrom(pos, cl, bl, idx) };
    };
    const logKinds = [logParts(4.2), logParts(6.6)];
    const logMat = makeBarkMaterial({ ...HU, uWaterY: { value: -0.12 }, uLog: { value: 1 } }, pal);    // sodden: stained and wet all over, moss along the top
    const logs = [];                                                                          // { x, z, rot, len, r }
    const tryLog = (x, z, rot, len, r, clear = 1.0) => {
      for (const sg of [-0.45, 0, 0.45]) if (!free(x + Math.sin(rot) * len * sg, z + Math.cos(rot) * len * sg, clear)) return false;
      logs.push({ x, z, rot, len, r }); for (const sg of [-0.4, 0, 0.4]) taken.push([x + Math.sin(rot) * len * sg, z + Math.cos(rot) * len * sg, 0.8]); return true;
    };
    // the basking log: always there, between two pinned trunks, lying across our view from under our line out to the right;
    // the animal lies 1.3 m right of the line with its head toward us
    // (its broken near end lies a metre beyond the animal's snout, in frame on our right; the far end runs out under our line)
    logs.push({ x: BASK.x - BASK.ax.x * 1.3, z: BASK.z - BASK.ax.z * 1.3, rot: Math.atan2(BASK.ax.x, BASK.ax.z), len: 4.7, r: 0.36, tilt: 0.1, y: -0.05 });
    for (const sg of [-0.4, 0, 0.4]) taken.push([logs[0].x + BASK.ax.x * 4.7 * sg, logs[0].z + BASK.ax.z * 4.7 * sg, 0.8]);
    for (let z = 150, tries = 0; z > -78 && tries < 400; tries++) {
      const side = rngLay.sign(), x = side * rngLay.range(3.6, 9.5), rot = rngLay.range(-0.5, 0.5) + (rngLay() < 0.25 ? 1.2 : 0), zz = z + rngLay.range(-4, 4), len = rngLay.range(4.5, 9), r = rngLay.range(0.26, 0.34);
      if (Math.abs(z - BASK.z) < 14 || (side > 0 && zz > AT[2] - 8 && zz < AT[2] + 26) || path.nearestXZ(x, zz).dist < 2.2 || !tryLog(x, zz, rot, len, r)) { z -= 3; continue; }
      z -= rngLay.range(17, 27);
    }
    // Broken stumps standing in the dart (at Joggins the trunks were snapped off and buried upright): each splits the sheet into a
    // standing V close beside our line, where it can be read from 1.4 m up.
    const stumps = [];
    // (a wake runs to our right, so a stump on our LEFT lays its V across our line: those are the ones that read; z -169.8 is 4.5 m ahead at u 0.8)
    for (const [z, side0] of [[-102, -1], [-121, 1], [-146, -1], [-168.5, 1], [-169.8, -1], [-199, -1]]) {
      const px = path.pointAt(uOfZ(z)).x, side = free(px + side0 * 3.1, z, 1.2) ? side0 : -side0, x = px + side * 3.1, f = Math.abs(z * 0.37) % 1;
      if (!free(x, z, 0.9)) continue;
      taken.push([x, z, 1.0]); stumps.push({ x, z, s: 1.0 + 0.25 * f, top: 0.85 + 0.6 * ((f * 7) % 1), rot: f * 9 });
    }
    // the dart: something half sunk within three metres of our line every second (a log; the mounds we lean toward do the rest)
    for (let z = -92, k = 0, tries = 0; z > -205 && tries < 200; tries++) {
      const pp = path.pointAt(uOfZ(z)), side = (k + tries) % 2 ? 1 : -1, rot = rngLay.range(-0.35, 0.35) + (rngLay() < 0.3 ? 1.0 : 0), len = rngLay.range(3.2, 5.6);
      if (!tryLog(pp.x + side * rngLay.range(2.0, 2.9), z + rngLay.range(-2, 2), rot, len, rngLay.range(0.28, 0.36), 0.2)) { z -= 2.5; continue; }
      z -= rngLay.range(15, 20); k++;
    }
    for (let kind = 0; kind < 2; kind++) {
      const list = logs.filter((l) => (l.len > 5.4 ? 1 : 0) === kind); if (!list.length) continue;
      const im = new THREE.InstancedMesh(logKinds[kind].bark, logMat, list.length), ie = new THREE.InstancedMesh(logKinds[kind].ends, plantMat, list.length), sw = new Float32Array(list.length * 2);
      list.forEach((l, i) => {
        const sc = l.r / LOG_R; l.len = (kind ? 6.6 : 4.2) * sc;
        const li = logs.indexOf(l), tilt = l.tilt ?? 0.07 * Math.sin(li * 2.3 + 1);
        Q4.setFromEuler(new THREE.Euler(Math.PI / 2 - tilt, l.rot, 0, 'YXZ')).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), li * 1.3));
        M4.compose(P3.set(l.x, l.y ?? l.r * 0.06, l.z), Q4, S3.set(sc, sc, sc)); im.setMatrixAt(i, M4); ie.setMatrixAt(i, M4);
      });
      ie.geometry.setAttribute('iSw', new THREE.InstancedBufferAttribute(sw, 2)); im.frustumCulled = ie.frustumCulled = false; scene.add(im, ie);
    }
    const baskLog = logs[0];
    {
      // ferns rooted in the rotten bark of the basking log, on the half the animal does not lie on: they break its top line
      const fl = [], fr2 = makeRng(5521);
      for (const [sA, n, sz] of [[-1.2, 7, 0.95], [-1.95, 5, 0.7], [-0.5, 4, 0.5]]) {
        const c = V3(baskLog.x + BASK.ax.x * sA, -0.05 + sA * Math.sin(0.1) + 0.3, baskLog.z + BASK.ax.z * sA);
        for (let k = 0; k < n; k++) fl.push({ p: c, a: k / n * TAU + fr2.range(-0.3, 0.3), up: fr2.range(0.75, 1.25), droop: fr2.range(1.1, 1.8), L: sz * fr2.range(0.75, 1.1), W: sz * 0.21, ph: fr2() * TAU });
      }
      const fm = new THREE.Mesh(frondGeo(fl, 0), leafMat); fm.frustumCulled = false; scene.add(fm);
    }
    if (stumps.length) {
      const eg = logKinds[0].ends.clone(), sIm = new THREE.InstancedMesh(logKinds[0].bark, makeBarkMaterial({ ...HU, uWaterY: { value: -2.6 }, uLog: { value: 0 } }, pal), stumps.length), sIe = new THREE.InstancedMesh(eg, plantMat, stumps.length);
      stumps.forEach((st, i) => { M4.compose(P3.set(st.x, st.top - 2.1 * st.s, st.z), Q4.setFromEuler(E3.set(0.07 * Math.sin(st.rot), st.rot, 0.06 * Math.cos(st.rot * 1.7))), S3.set(st.s, st.s, st.s)); sIm.setMatrixAt(i, M4); sIe.setMatrixAt(i, M4); });
      eg.setAttribute('iSw', new THREE.InstancedBufferAttribute(new Float32Array(stumps.length * 2), 2)); sIm.frustumCulled = sIe.frustumCulled = false; scene.add(sIm, sIe);
    }
    await ctx.yield();
    HU.uKeyBar.value.set(BASK.x - BASK.ax.x * 0.6, BASK.z - BASK.ax.z * 0.6, 4.6, moodId === 'noon' ? 0.5 : moodId === 'amber' ? 0.55 : 1.6);
    hero.setWakes([...stumps.map((st) => [st.x, st.z, 0.5 * st.s]), ...logs.filter((l) => l.z < -88 && l.z > -210).sort((a, b) => path.nearestXZ(a.x, a.z).dist - path.nearestXZ(b.x, b.z).dist).map((l) => [l.x, l.z, Math.min(l.len * 0.36, 2.2)])].slice(0, 7));
    await ctx.yield();

    // ---- TEMNOSPONDYL AMPHIBIANS (after Cochleosaurus): 1.5 m, flat triangular skull a fifth of the length with the eyes on top,
    // no neck, barrel body, four short limbs sprawled sideways, a deep newt's tail a third of the length. Head +Z, belly on y = 0.
    // Attributes: color, aAn (x = throat, y = tail-wave weight, z = flank), so the shader can pulse, swim and breathe.
    const amphGeo = (swim) => {
      const pos = [], cl = [], an = [], sk = [], idx = [], c = new THREE.Color(), hr = makeRng(7717);
      // slick olive-black above (lifted far enough to hold a tone apart from the wet log), a paler olive flank, cream only on the
      // throat, the belly and one broken line along the flank; the ochre blotches are drawn in the fragment shader (aSk = how much)
      const back = col('#30361f'), flank = col('#535636'), cream = col('#d8cda2'), lipC = col('#0f100a'), toeC = col('#4a4c2c');
      const SEC = [[0.75, 0.034, 0.026, 0.0], [0.725, 0.076, 0.04, 0.006], [0.67, 0.116, 0.052, 0.013], [0.6, 0.15, 0.064, 0.02], [0.53, 0.172, 0.076, 0.03], [0.47, 0.176, 0.09, 0.042],
        [0.4, 0.166, 0.122, 0.06], [0.31, 0.162, 0.152, 0.076], [0.2, 0.174, 0.167, 0.084], [0.08, 0.177, 0.17, 0.086], [-0.04, 0.168, 0.166, 0.082], [-0.14, 0.148, 0.156, 0.07],
        [-0.22, 0.112, 0.15, 0.056], [-0.3, 0.078, 0.155, 0.05], [-0.39, 0.052, 0.15, 0.046], [-0.48, 0.036, 0.135, 0.04], [-0.57, 0.024, 0.11, 0.032], [-0.65, 0.014, 0.078, 0.02], [-0.71, 0.007, 0.045, 0.008], [-0.75, 0.002, 0.02, 0.0]];
      const NSD = 20, lift = 0.086;
      SEC.forEach(([z, w, top, bot], i) => {
        const head = z > 0.46, tail = z < -0.2, tw = clamp((0.45 - z) / 1.2, 0, 1);
        for (let j = 0; j < NSD; j++) {
          const a = j / NSD * TAU, ca = Math.cos(a), sa = Math.sin(a), up = sa >= 0;
          const ex = tail ? 1.25 : 0.8, ey = head ? 0.55 : tail ? 1.0 : 0.78;
          // the skull is a flat shield with a faint ridge over each eye and a dished middle; the back carries a low spine line
          const brow = head ? 0.012 * Math.exp(-((Math.abs(ca) - 0.5) ** 2) / 0.03) * clamp((0.68 - z) / 0.1, 0, 1) : 0;
          const x = w * Math.sign(ca) * Math.pow(Math.abs(ca), ex), y = up ? top * Math.pow(sa, ey) + brow * sa : -bot * Math.pow(-sa, 0.6);
          pos.push(x, y + lift, z);
          const n = hr();
          if (sa > 0.3) c.copy(back).multiplyScalar(0.86 + 0.28 * n);
          else if (sa > -0.25) c.copy(flank).lerp(back, clamp(sa * 2.4 + 0.3, 0, 1)).lerp(cream, !tail && !head && Math.abs(sa + 0.08) < 0.12 ? 0.3 + 0.3 * n : 0.04).multiplyScalar(0.9 + 0.2 * n);
          else c.copy(cream).multiplyScalar(0.8 + 0.2 * n);
          if (head && (j === 0 || j === NSD / 2) && z < 0.74) c.copy(lipC);                              // the mouth line along the skull's edge
          if (head && (j === 1 || j === NSD / 2 - 1) && z < 0.72) c.lerp(lipC, 0.45);
          if (tail && (j === NSD / 4)) c.lerp(flank, 0.5);                                                 // the tail crest catches the light
          cl.push(c.r, c.g, c.b); sk.push(sa > 0.55 ? 0.75 : sa > -0.2 ? 1 : 0);
          an.push(!up && z > 0.36 && z < 0.66 ? Math.sin((z - 0.36) / 0.3 * Math.PI) * Math.min(1, -sa * 1.6) : 0, tw * tw, z < 0.4 && z > -0.2 ? Math.abs(ca) : 0);
        }
      });
      for (let i = 0; i < SEC.length - 1; i++) for (let j = 0; j < NSD; j++) { const j1 = (j + 1) % NSD, a = i * NSD, b = a + NSD; idx.push(a + j, a + j1, b + j, a + j1, b + j1, b + j); }
      const vtx = (x, y, z, cc, tw = 0, s = 0) => { pos.push(x, y, z); cl.push(cc.r, cc.g, cc.b); an.push(0, tw, 0); sk.push(s); return pos.length / 3 - 1; };
      // eyes on top of the skull: a raised dark dome in a lidded socket, a thin amber ring, one bright highlight
      const eyeD = col('#070705'), eyeA = col('#8a6a2a'), lid = col('#2a2e1a'), hi = new THREE.Color(2.6, 2.6, 2.3);
      for (const s of [-1, 1]) {
        const ex = s * 0.082, ey = lift + 0.064, ez = 0.535, top = vtx(ex, ey + 0.042, ez, eyeD), ring = [], mid = [], out = [];
        for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; out.push(vtx(ex + Math.cos(a) * 0.062, ey - 0.012, ez + Math.sin(a) * 0.068, lid)); ring.push(vtx(ex + Math.cos(a) * 0.046, ey + 0.012, ez + Math.sin(a) * 0.05, eyeA)); mid.push(vtx(ex + Math.cos(a) * 0.032, ey + 0.03, ez + Math.sin(a) * 0.035, eyeD)); }
        for (let j = 0; j < 10; j++) { const j1 = (j + 1) % 10; idx.push(top, mid[j1], mid[j], mid[j], mid[j1], ring[j1], mid[j], ring[j1], ring[j], ring[j], ring[j1], out[j1], ring[j], out[j1], out[j]); }
        const h0 = vtx(ex + s * 0.004, ey + 0.046, ez + 0.004, hi), h1 = vtx(ex + s * 0.026, ey + 0.035, ez + 0.012, hi), h2 = vtx(ex + s * 0.006, ey + 0.035, ez + 0.026, hi); idx.push(h0, h1, h2, h0, h2, h1);
        const n0 = vtx(s * 0.03, lift + 0.05, 0.722, eyeD), n1 = vtx(s * 0.043, lift + 0.049, 0.712, eyeD), n2 = vtx(s * 0.032, lift + 0.054, 0.705, eyeD); idx.push(n0, n1, n2);   // nostril
      }
      // limbs: a thick upper segment out sideways from a shoulder bulge, a raised elbow or knee, a thinner lower segment, a flat
      // hand, and four (fore) or five (hind) separate tapering toes spread on the bark: no web, no paddle
      const tubeP = (pts, NS, tw, skv) => {
        const P = pts.map((p) => V3(p[0], p[1], p[2])), rows = [], tg = V3(), uu = V3(), vv = V3(), ref = V3(0, 1, 0);
        P.forEach((p, k) => {
          tg.copy(P[Math.min(k + 1, P.length - 1)]).sub(P[Math.max(k - 1, 0)]).normalize();
          uu.crossVectors(tg, Math.abs(tg.y) > 0.9 ? ref.set(1, 0, 0) : ref.set(0, 1, 0)).normalize(); vv.crossVectors(tg, uu);
          const r = pts[k][3], fl = pts[k][5] ?? 1, row = [];                                 // fl: flattening of the section against the bark
          for (let j = 0; j < NS; j++) { const a = j / NS * TAU, cu = Math.cos(a) * r, cv = Math.sin(a) * r * fl; row.push(vtx(p.x + uu.x * cu + vv.x * cv, p.y + uu.y * cu + vv.y * cv, p.z + uu.z * cu + vv.z * cv, pts[k][4], tw, skv)); }
          rows.push(row);
        });
        for (let k = 0; k < rows.length - 1; k++) for (let j = 0; j < NS; j++) { const j1 = (j + 1) % NS; idx.push(rows[k][j], rows[k + 1][j], rows[k][j1], rows[k][j1], rows[k + 1][j], rows[k + 1][j1]); }
      };
      const mid3 = (a, b, t, dy = 0) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + dy, a[2] + (b[2] - a[2]) * t];
      const limb = (s, hind) => {
        const z0 = hind ? -0.13 : 0.36, tw = hind ? 0.2 : 0.02, toes = hind ? 5 : 4, dk = back.clone().multiplyScalar(0.92), lo = back.clone().lerp(flank, 0.55);
        if (!swim) {
          // the log under the belly is a cylinder of radius RL about (0, -RL): a point at angle f from its top, d above the bark
          const RL = 0.3, on = (f, d, z) => [s * (RL + d) * Math.sin(f), -RL + (RL + d) * Math.cos(f), z], zs = hind ? 1 : -1;
          const sh = [s * 0.12, lift + 0.0, z0], el = on(0.8, 0.085, z0 + zs * 0.14), wr = on(1.03, 0.045, z0 - zs * 0.015), hd = on(1.16, 0.026, z0 - zs * 0.085);
          tubeP([[...sh, 0.058, dk], [...mid3(sh, el, 0.3, 0.012), 0.078, dk], [...mid3(sh, el, 0.7, 0.012), 0.07, dk], [...el, 0.064, dk], [...mid3(el, wr, 0.5), 0.05, lo], [...wr, 0.04, lo], [...hd, 0.044, lo, 0.45]], 7, tw, 0.4);
          for (let k = 0; k < toes; k++) {
            const q = (k + 0.5) / toes - 0.5, th = (hind ? 0.25 : 0.75) + q * 1.9, L = (hind ? 0.135 : 0.115) * (1 - 0.5 * q * q);
            const at = (t, d) => on(1.16 + t * L * Math.cos(th) / RL, d, hd[2] + t * L * Math.sin(th));
            tubeP([[...at(-0.15, 0.022), 0.02, lo, 0.6], [...at(0.45, 0.02), 0.016, toeC, 0.7], [...at(0.85, 0.014), 0.011, toeC, 0.7], [...at(1.0, 0.008), 0.003, toeC, 0.7]], 4, tw, 0.2);
          }
          return;
        }
        // swimming: limbs laid back along the body, toes trailing
        const J = [[s * 0.11, lift + 0.0, z0], [s * 0.205, lift - 0.02, z0 - 0.1], [s * 0.19, lift - 0.045, z0 - 0.235]];
        tubeP([[...J[0], 0.05, dk], [...mid3(J[0], J[1], 0.5, 0.008), 0.05, dk], [...J[1], 0.04, dk], [...mid3(J[1], J[2], 0.5), 0.032, lo], [...J[2], 0.026, lo, 0.6]], 6, tw, 0.8);
        for (let k = 0; k < toes; k++) {
          const q = (k + 0.5) / toes - 0.5, a = Math.PI + q * 0.9, L = 0.1 * (1 - 0.5 * q * q), w = J[2];
          tubeP([[w[0], w[1], w[2], 0.014, lo], [w[0] + Math.sin(a) * L * 0.55, w[1] - 0.006, w[2] + Math.cos(a) * L * 0.55, 0.011, toeC], [w[0] + Math.sin(a) * L, w[1] - 0.01, w[2] + Math.cos(a) * L, 0.003, toeC]], 4, tw, 0.2);
        }
      };
      for (const s of [-1, 1]) { limb(s, false); limb(s, true); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      g.setAttribute('aAn', new THREE.Float32BufferAttribute(an, 3)); g.setAttribute('aSk', new THREE.Float32BufferAttribute(sk, 1)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const amphBask = amphGeo(false), amphSwim = amphGeo(true);
    await ctx.yield();
    const keyColU = { value: col(mood.sun).multiplyScalar(moodId === 'noon' ? 0.8 : moodId === 'amber' ? 1.25 : 0.4) };
    const sheenU = { value: col(mood.skyHor).multiplyScalar(moodId === 'rain' ? 0.34 : moodId === 'amber' ? 0.36 : 0.45) };
    const makeAmph = (geo, phase) => {
      const U = { uSwim: { value: 0 }, uPh: { value: phase } };
      const m = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: moodId === 'amber' ? 0.42 : 0.3, metalness: 0, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U, { uTime: HU.uTime, uBounce: HU.uBounce, uBounceCol: HU.uBounceCol, uFill: HU.uFill, uSheen: sheenU, uKeyBar: HU.uKeyBar, uKeyCol: keyColU });
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aAn; attribute float aSk; uniform float uTime, uSwim, uPh; varying vec3 vAW; varying float vSpine; varying vec3 vOP; varying float vSk;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            { float pulse = max(sin(uTime * 3.1416 + uPh), 0.); pulse *= pulse;
              transformed.y -= aAn.x * .022 * pulse;                                        // the cream throat pumps every two seconds
              transformed.x *= 1. + aAn.z * .035 * sin(uTime * 1.4 + uPh * 2.);                // flanks breathe
              float wv = sin(position.z * 6.5 + uTime * 6. + uPh);
              transformed.x += uSwim * (aAn.y * .2 * wv - .025 * sin(uTime * 6. + uPh + 4.6));  // an eel's S wave that grows toward the tail
              transformed.x += (1. - uSwim) * aAn.y * aAn.y * .1 * sin(uTime * .5 + uPh);
              vAW = (modelMatrix * vec4(transformed, 1.)).xyz; vSpine = position.x; vOP = position; vSk = aSk; }`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
            uniform vec3 uBounceCol, uFill, uSheen, uKeyCol; uniform float uBounce; uniform vec4 uKeyBar; varying vec3 vAW; varying float vSpine; varying vec3 vOP; varying float vSk;
            float aH3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
            float aN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
              return mix(mix(mix(aH3(i), aH3(i + vec3(1,0,0)), f.x), mix(aH3(i + vec3(0,1,0)), aH3(i + vec3(1,1,0)), f.x), f.y),
                         mix(mix(aH3(i + vec3(0,0,1)), aH3(i + vec3(1,0,1)), f.x), mix(aH3(i + vec3(0,1,1)), aH3(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
          .replace('#include <color_fragment>', `#include <color_fragment>
            // small soft-edged ochre blotches (each under a twentieth of the body), thicker on the flanks, and a fine wet speckle
            { vec3 q = vOP * 30.; float n1 = aN3(q), n2 = aN3(q * 2.3 + 7.), n3 = aN3(vOP * 8. + 3.);
              float bl = smoothstep(.63, .74, n1 * .68 + n2 * .32 + (n3 - .5) * .3) * clamp(vSk, 0., 1.);
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.27, .2, .09) * (.75 + .5 * n2), bl * .8);
              diffuseColor.rgb *= .82 + .36 * aN3(vOP * 110.); }`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            { vec3 upV = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz); float topK = max(dot(normal, upV), 0.), fres = 1. - abs(dot(normal, normalize(vViewPosition)));
              // the staged pool of sun on the basking log (uKeyBar, shared with the bark): light from above on the wet back, and a
              // highlight that runs down the spine and the tail crest
              float kb = step(.01, uKeyBar.w) * (1. - smoothstep(.35, 1., length((vAW.xz - uKeyBar.xy) / max(uKeyBar.z, .1))));
              float spine = (1. - smoothstep(.0, .05, abs(vSpine))) * topK;
              float shK = clamp(1. - 2.3 * uBounce, .22, 1.);
              totalEmissiveRadiance += diffuseColor.rgb * (uBounceCol * uBounce * .45 + uFill * .9 * (.55 + .45 * shK) + uKeyCol * kb * (.2 + .62 * topK))
                + uSheen * shK * (topK * topK * .42 + fres * fres * fres * .8 + spine * (.5 + .7 * kb)) + uKeyCol * kb * spine * .16; }`);
      };
      m.customProgramCacheKey = () => 'stm-amph';
      const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; scene.add(mesh);
      return { mesh, U };
    };
    // cast: 0 = the basker that slides off its log at u 0.34 (two meshes: sprawled, then swimming), 1 and 2 surface on the left
    // at u 0.72, 3 basks on a later log, 4 crosses the lane early in the black water
    const USURF = 0.79, zSwim = zOfU(USURF) - 6.8, amph = [];
    const baskHead = BASK.ax.clone(), baskYaw = Math.atan2(baskHead.x, baskHead.z), logTop = -0.05 + 1.3 * Math.sin(0.1) + logs[0].r * 0.97, BASK_TILT = 0.1;
    amph.push({ kind: 'bask0', a: makeAmph(amphBask, 0.3), b: makeAmph(amphSwim, 0.3) });
    amph[0].a.mesh.scale.setScalar(1.2); amph[0].b.mesh.scale.setScalar(1.2);
    // its mate is already in the water: it surfaces ahead of us and crosses the lane as the first one slips off its log
    const ULANE = 0.43, laneDir = V3(-0.9, 0, -0.44).normalize(), laneAt = path.pointAt(ULANE).add(V3(0.7, 0, -3.9)).setY(-0.03), laneNow = laneAt.clone();
    amph.push({ kind: 'lane', b: makeAmph(amphSwim, 3.3), s: 1.7, yaw: Math.atan2(laneDir.x, laneDir.z) });
    const sw1 = [-2.7, zSwim], sw2 = [-3.3, zSwim - 5.5], surfYaw = Math.atan2(0.8, -0.6);
    amph.push({ kind: 'surf', b: makeAmph(amphSwim, 2.1), x: sw1[0], z: sw1[1], s: 1.6, yaw: surfYaw });
    if (nAmph >= 4) amph.push({ kind: 'surf', b: makeAmph(amphSwim, 4.4), x: sw2[0], z: sw2[1], s: 1.3, yaw: surfYaw + 0.25 });
    if (nAmph >= 5) {
      const l2 = logs.slice(1).reduce((best, l) => (Math.abs(l.z - zOfU(0.49)) < Math.abs(best.z - zOfU(0.49)) ? l : best), logs[Math.min(1, logs.length - 1)]);
      const a = makeAmph(amphBask, 5.2); a.mesh.position.set(l2.x, l2.r * 1.08, l2.z); a.mesh.rotation.set(0, l2.rot + Math.PI, 0); amph.push({ kind: 'still', a });
    }
    // wakes: one card per swimmer on the water, V arms and splash rings (iK: x = V strength, y = ring strength)
    const wakeK = new Float32Array(amph.length * 2), wakeAttr = new THREE.InstancedBufferAttribute(wakeK, 2);
    const wakeCol = { value: col(mood.skyHor).multiplyScalar(0.8) }, wakeCol0 = wakeCol.value.clone(), wakeCol1 = col(silt.cream).multiplyScalar(0.55).lerp(col('#1A1208'), 0.35);
    const wakeGeo = new THREE.BufferGeometry();
    wakeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-2.6, 0, 1.6, 2.6, 0, 1.6, 2.6, 0, -7, -2.6, 0, -7], 3)); wakeGeo.setIndex([0, 1, 2, 0, 2, 3]);
    wakeGeo.setAttribute('iK', wakeAttr);
    const wakeMat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uCol: wakeCol }, transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        attribute vec2 iK; varying vec2 vP; varying vec2 vK;
        void main(){ vP = vec2(position.x, -position.z); vK = iK;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform float uTime; uniform vec3 uCol; varying vec2 vP; varying vec2 vK;
        void main(){
          float al = max(vP.y, 0.), arm = .16 + al * .34, ax = abs(vP.x);
          float l1 = 1. - smoothstep(0., .05 + al * .035, abs(ax - arm)), l2 = 1. - smoothstep(0., .04 + al * .03, abs(ax - arm * .5));
          float chev = .55 + .45 * sin(al * 7. - uTime * 6. + ax * 3.);
          float v = (l1 + l2 * .5) * chev * exp(-al / 2.6) * smoothstep(-.1, .5, vP.y);
          float r = length(vP), ring = max(sin(r * 8. - uTime * 5.), 0.) * exp(-r * .75);
          float edge = (1. - smoothstep(1.9, 2.6, ax)) * (1. - smoothstep(5.5, 7., al));
          float a = clamp(v * vK.x + ring * ring * vK.y, 0., 1.) * edge * .85;
          gl_FragColor = vec4(uCol, a);
          #include <fog_fragment>
        }`,
    });
    const wakes = new THREE.InstancedMesh(wakeGeo, wakeMat, amph.length); wakes.frustumCulled = false; wakes.renderOrder = -10; scene.add(wakes);
    await ctx.yield();

    // ---- the far forest: three depth rows of simple trees on each side and behind the ring (scale-tree poles with crowns forking
    // in twos, ribbed Sigillaria with mops, Calamites with their whorls), each one a four-sided pole with one lit edge and two
    // crossed cards whose crown is drawn in the shader; behind them a low, level bank of haze as a backstop. The breach stays open.
    {
      const fr = rngLay.fork('far'), list = [];                                           // [x, z, H, r, crownW, crownH, kind, seed]
      const addFar = (x, z, depth) => {
        if (x < 0 && Math.abs(z - 10) < 19) return;                                       // the breach in the left wall
        const k = fr(), kind = k < 0.58 ? 0 : k < 0.78 ? 1 : 2, big = 1 + 0.12 * depth;
        if (kind === 0) { const H = fr.range(27, 36) * big; list.push([x, z, H * 0.8, 0.55, fr.range(5.2, 6.6), H * 0.26, 0, fr()]); }
        else if (kind === 1) { const H = fr.range(14, 19) * big; list.push([x, z, H, 0.6, fr.range(1.6, 2.2), fr.range(2.6, 3.4), 1, fr()]); }
        else { const H = fr.range(9, 14) * big; list.push([x, z, 0.6, 0.16, fr.range(1.5, 2.1), H, 2, fr()]); }
      };
      const nSide = Math.round(62 * (0.6 + 0.4 * detail)), nBack = Math.round(24 * (0.6 + 0.4 * detail));
      for (let row = 0; row < 3; row++) {
        for (const side of [-1, 1]) for (let i = 0; i < nSide; i++) addFar(side * (36 + row * 11 + fr.range(-4, 4)), 236 - (i + fr()) * (566 / nSide), row);
        for (let i = 0; i < nBack; i++) addFar(-52 + (i + fr()) * (104 / nBack), -297 - row * 12 + fr.range(-4, 4), row);
      }
      const pos = [], prt = [], idx = [];
      for (let i = 0; i <= 1; i++) for (let j = 0; j < 4; j++) { const a = j / 4 * TAU; pos.push(Math.cos(a), i, Math.sin(a)); prt.push(0, Math.cos(a), Math.sin(a)); }
      for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; idx.push(j, 4 + j, j1, j1, 4 + j, 4 + j1); }
      for (let c = 0; c < 2; c++) { const i0 = pos.length / 3; for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(c ? 0 : u, v, c ? u : 0); prt.push(1, u, v); } idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(prt, 3)); g.setIndex(idx);
      const iDim = new Float32Array(list.length * 4), iK = new Float32Array(list.length * 2);
      const farU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uWall: { value: col(mood.wall) }, uBack: { value: col(moodId === 'noon' ? '#2C3320' : moodId === 'amber' ? '#232c26' : '#1f261d') }, uLit: { value: col(mood.sun).multiplyScalar(moodId === 'rain' ? 0.1 : 0.22) }, uSunX: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() } };
      const m = new THREE.ShaderMaterial({
        uniforms: farU, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec3 aPart; attribute vec4 iDim; attribute vec2 iK; uniform float uTime; uniform vec2 uSunX;
          varying vec3 vP; varying vec2 vK; varying float vLit; varying float vBack;
          void main(){
            vec3 p = position; float crown = aPart.x; vBack = 1. - smoothstep(-292., -272., instanceMatrix[3].z);
            if (crown < .5) { float tp = 1. - .42 * p.y; p.xz *= iDim.y * tp * (1. + .9 * exp(-p.y * iDim.x / 1.2)); p.y *= iDim.x; vec3 nw = mat3(instanceMatrix) * vec3(aPart.y, 0., aPart.z); vLit = max(dot(nw.xz, uSunX), 0.); }
            else { p.xz *= iDim.z; p.y = iDim.x - .35 + p.y * iDim.w; float sw = aPart.z * aPart.z * (.16 * sin(uTime * .8 + iK.y * 40.) + .06 * sin(uTime * 1.9 + iK.y * 90.)); p.x += sw; p.z += sw * .6; vLit = 0.; }
            vP = aPart; vK = iK;
            vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uWall, uLit, uBack; varying vec3 vP; varying vec2 vK; varying float vLit; varying float vBack;
          void main(){
            vec3 c = mix(uWall, uBack, vBack) * (.62 + .3 * vK.y);
            if (vP.x < .5) c += uLit * vLit * vLit;                                        // the pole: one lit edge
            else {
              float x = vP.y, y = vP.z, ax = abs(x);
              if (vK.x < .5) {                                                             // scale tree: fork in two, four times, a brush on every tip
                vec2 p = vec2(x * 6., y * 7.2); float d = 1e3, len = 2.5;
                for (int i = 0; i < 4; i++) {
                  p.x = abs(p.x); vec2 dir = i == 0 ? vec2(.42, .907) : vec2(.6, .8);
                  float t = clamp(dot(p, dir), 0., len); d = min(d, length(p - dir * t) - (.26 - .05 * float(i)));
                  p -= dir * len; p = vec2(p.x * .9 - p.y * .436, p.x * .436 + p.y * .9); len *= .7;
                }
                d = min(d, length(p * vec2(1.7, .62) - vec2(0., .5)) - .62);
                if (d > 0.) discard;
                c *= 1. + .5 * smoothstep(.2, 1., y);
              } else if (vK.x < 1.5) {                                                     // Sigillaria: one or two mops of drooping leaves
                float fork = step(.5, vK.y), cx = ax - fork * .55 * min(y * 3., 1.), top = .62;
                float stem = step(abs(cx), .16) * step(y, top), mop = length(vec2(cx, (y - top) * .9)) - (.34 + .05 * sin(cx * 31.) * sin(y * 23.));
                if (stem < .5 && mop > 0.) discard;
                c *= 1. + .35 * smoothstep(.5, 1., y);
              } else {                                                                     // Calamites: a jointed stem, a whorl of upswept branches at every joint
                float n = 7., j = fract(y * n), tier = (1. - .8 * y) * (.35 + .65 * smoothstep(0., .25, y)) * .85;
                float whorl = step(ax, tier * (j - .06) * 1.9) * step(.06, j) * step(j, .56) * step(abs(fract(ax * 7. / max(tier, .05)) - .5), .36);
                if (ax > .07 * (1.15 - y) + .02 && whorl < .5) discard;
                c *= 1.15 + .5 * y;
              }
            }
            gl_FragColor = vec4(c, 1.);
            #include <fog_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, c, vBack * .6);                       // the bank behind the ring stands in cloud shadow, clear of the haze
          }`,
      });
      const im = new THREE.InstancedMesh(g, m, list.length);
      list.forEach((t, i) => { M4.compose(P3.set(t[0], -0.4, t[1]), Q4.setFromEuler(E3.set(0, t[7] * TAU, 0)), S3.set(1, 1, 1)); im.setMatrixAt(i, M4); iDim.set([t[2], t[3], t[4], t[5]], i * 4); iK[i * 2] = t[6]; iK[i * 2 + 1] = t[7]; });
      g.setAttribute('iDim', new THREE.InstancedBufferAttribute(iDim, 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(iK, 2));
      im.frustumCulled = false; scene.add(im);
      await ctx.yield();
      // the backstop: a level bank of haze behind the last row, soft at the top, never an edge
      const bg = new THREE.BufferGeometry(), X = 78, Z0 = 262, Z1 = -342, H = 30;
      bg.setAttribute('position', new THREE.Float32BufferAttribute([-X, -1, Z0, -X, -1, Z1, -X, H, Z1, -X, H, Z0, X, -1, Z1, X, -1, Z0, X, H, Z0, X, H, Z1, -X, -1, Z1, X, -1, Z1, X, H, Z1, -X, H, Z1], 3));
      bg.setAttribute('aW', new THREE.Float32BufferAttribute([Z0, 0, 0, Z1, 0, 0, Z1, 1, 0, Z0, 1, 0, 700 + Z1, 0, 1, 700 + Z0, 0, 1, 700 + Z0, 1, 1, 700 + Z1, 1, 1, 1400 - X, 0, 2, 1400 + X, 0, 2, 1400 + X, 1, 2, 1400 - X, 1, 2], 3));
      bg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]);
      const bm = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uWall: farU.uWall, uBack: farU.uBack }, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec3 aW; varying vec3 vW;
          void main(){ vW = aW; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uWall, uBack; varying vec3 vW;
          float wh(float n){ return fract(sin(n * 127.1) * 43758.5453); }
          float wn(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(wh(i), wh(i + 1.), f); }
          void main(){
            float x = vW.x, h = vW.y, gap = (1. - step(.5, vW.z)) * (1. - smoothstep(12., 24., abs(x - 10.)));
            float top = .56 + .05 * wn(x * .045) + .03 * wn(x * .13 + 9.);
            float a = (1. - smoothstep(top - .3, top, h)) * (1. - .9 * gap);
            float back = step(1.5, vW.z); vec3 c = mix(uWall, uBack, back) * (.55 + .12 * wn(x * .21 + 3.));
            gl_FragColor = vec4(c, a * .92);
            #include <fog_fragment>
            gl_FragColor.rgb = mix(gl_FragColor.rgb, c, back * .55);
          }`,
      });
      const bank = new THREE.Mesh(bg, bm); bank.frustumCulled = false; bank.renderOrder = -18; scene.add(bank);
    }
    await ctx.yield();

    // ---- the blazing shaft of the entry frame: a soft sheet of lit steam standing behind the lone tree, so the pole reads dark
    // against it from the mouth of the lane (and through the previous portal); it thins away as we reach the tree
    const blazeU = { uTime: HU.uTime, uK: { value: 1 }, uCol: { value: col(mood.steam).multiplyScalar(moodId === 'rain' ? 0.28 : moodId === 'amber' ? 1.0 : 0.9) } };
    {
      const g = new THREE.PlaneGeometry(22, 52); g.translate(0, 24, 0);
      const m = new THREE.ShaderMaterial({
        uniforms: blazeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uK; uniform vec3 uCol; varying vec2 vUv;
          float bh(float n){ return fract(sin(n * 91.7) * 43758.5453); }
          float bn(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(bh(i), bh(i + 1.), f); }
          void main(){
            float x = vUv.x - .5 - (vUv.y - .5) * .16, ax = abs(x) * 2.;
            float core = exp(-ax * ax * 5.) + .35 * exp(-ax * ax * 1.4);
            float ray = .7 + .3 * bn(x * 26. + uTime * .05) * bn(x * 9. - uTime * .03 + 4.);
            float v = smoothstep(0., .1, vUv.y) * (1. - smoothstep(.55, 1., vUv.y)) * (.75 + .25 * bn(vUv.y * 5. - uTime * .12));
            gl_FragColor = vec4(uCol * core * ray * v * uK, 1.);
          }`,
      });
      const blaze = new THREE.Mesh(g, m); blaze.position.set(A.loneTree[0] + 0.8, 0, A.loneTree[2] - 10); blaze.frustumCulled = false; blaze.renderOrder = 2; scene.add(blaze);
    }

    // ---- floating litter: mats of cone scales, leaf cushions and twigs on the water, resting on the black mirror and carried
    // across the nave once the sheet arrives (detail for the lower third of every frame, before and after the flood)
    const litterU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: HU.uTime, uDrift: { value: 0 }, uSpin: { value: 0 }, uL: { value: (() => { const c = col(mood.sun).multiplyScalar(0.34).add(new THREE.Color(...mood.skyFill).multiplyScalar(0.9)), l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; return c.lerp(new THREE.Color(l, l, l), 0.55); })() } };
    {
      // laid as rafts: mats of eight or nine cards that keep together, drift with the sheet and turn slowly on it; a few loose pieces between
      const lr = rngLay.fork('litter'), cards = [], dk = detail * (0.8 + 0.2 * density);
      const raft = (cx, cz, k, rad) => { const sp = lr(); for (let j = 0; j < k; j++) { const a = lr() * TAU, r = rad * Math.sqrt(lr()) * (0.55 + 0.75 * lr()); cards.push([cx, cz, Math.cos(a) * r, Math.sin(a) * r, sp, 0]); } return sp; };
      const things = [];                                                     // whole cones and twigs riding the rafts of the dart: [cx, cz, ox, oz, spin, kind]
      for (let i = Math.round(150 * dk); i > 0; i--) raft(lr.range(-16, 16), lr.range(-60, 216), 8, lr.range(0.7, 1.3));
      for (let i = Math.round(150 * dk); i > 0; i--) { const cx = lr.range(-8, 8), cz = lr.range(-262, -60), rad = lr.range(0.5, 1.5), sp = raft(cx, cz, rad > 1 ? 8 : 5, rad), hx = makeRng(i * 7 + 3);
        for (let q = hx.int(1, 3); q > 0; q--) things.push([cx, cz, hx.range(-0.5, 0.5) * rad, hx.range(-0.5, 0.5) * rad, sp, 1]);
        if (hx() < 0.5) things.push([cx, cz, hx.range(-0.3, 0.3) * rad, hx.range(-0.3, 0.3) * rad, sp, 2]); }   // the dart: carried across the nave only (see the wrap in the shader)
      for (let i = Math.round(380 * dk); i > 0; i--) raft(clamp(lr.gauss() * 6, -16, 16), lr.range(-252, 216), 1, 0);
      const nCards = cards.length; for (const t of things) cards.push(t);
      await ctx.yield();
      const n = cards.length;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 2, 1, 0, 3, 2]);
      const iL = new Float32Array(n * 3), im = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({
        uniforms: litterU, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec3 iL; attribute vec2 iO; attribute float iT; uniform float uTime, uDrift, uSpin; varying vec2 vUv; varying float vSeed; varying float vRaft; varying float vKind;
          void main(){
            vec4 wp = instanceMatrix * vec4(position, 1.); float cx = instanceMatrix[3].x, cz = instanceMatrix[3].z, dx = uDrift * (.7 + .6 * iL.x);
            float hw = cz < -60. ? 8. : 16., xw = mod(cx + dx + hw, 2. * hw) - hw;                                        // carried along the flow, wrapped out beyond the rows
            float ang = uSpin * (iL.x - .5) * 2.4, cs = cos(ang), sn = sin(ang);
            vec2 rel = wp.xz - vec2(cx, cz) + iO; rel = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) * smoothstep(0., 2.5, hw - abs(xw));
            wp.x = xw + rel.x; wp.z = cz - .176 * (xw - cx) + rel.y;
            wp.y = .022 + .008 * sin(uTime * 1.3 + iL.z * 40.) + iL.y * .01;
            vUv = uv; vSeed = iL.z; vRaft = step(1e-4, dot(iO, iO)); vKind = iT;
            vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uL; varying vec2 vUv; varying float vSeed; varying float vRaft; varying float vKind;
          float lh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float ln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(lh(i), lh(i + vec2(1., 0.)), f.x), mix(lh(i + vec2(0., 1.)), lh(i + 1.), f.x), f.y); }
          void main(){
            if (vKind > .5) {                                                    // things with a shape, lying on the raft
              vec2 q = (vUv - .5) * 2.; vec3 tc; float ok;
              if (vKind < 1.5) {                                                 // a whole cone, 0.3 m: a spindle of overlapping scales
                float w = .36 * sqrt(max(1. - q.x * q.x, 0.)) * (1. - .22 * q.x), ay = abs(q.y) / max(w, .02);
                ok = step(ay, 1.); float sc = fract(q.x * 5.5 + ay * ay * .9 + .5 * step(0., q.y));
                tc = mix(vec3(.085, .05, .022), vec3(.3, .2, .09), smoothstep(.45, .95, sc)) * (1.15 - .65 * ay * ay) * (.8 + .4 * vSeed);
              } else {                                                           // a bottlebrush twig: a stem and a comb of stiff needles
                float ax = abs(q.x), ay = abs(q.y), stem = step(ay, .035) * step(ax, .96);
                float nd = fract(q.x * 17. - ay * 4.), needle = step(nd, .34) * step(ay, .62 * (1. - .35 * smoothstep(-.9, .95, q.x))) * step(ax, .93);
                ok = max(stem, needle); tc = mix(vec3(.1, .13, .045), vec3(.27, .26, .11), lh(vec2(floor(q.x * 17. - ay * 4.), vSeed * 9.))) * (stem > .5 ? .5 : 1.);
              }
              if (ok < .5) discard;
              gl_FragColor = vec4(tc * uL * 2.4, 1.);
              #include <fog_fragment>
              return;
            }
            vec2 p = vUv * 7., c = floor(p), f = fract(p) - .5; float h = lh(c + vSeed * 17.), h2 = lh(c + vSeed * 31. + 7.);
            float ang = h2 * 6.283, cs = cos(ang), sn = sin(ang); vec2 r = vec2(f.x * cs + f.y * sn, f.y * cs - f.x * sn);
            float d = length(r * vec2(1., 2. + 2.5 * h)), m = (1. - smoothstep(.26, .34, d)) * step(.38, h);
            m *= 1. - smoothstep(.28, .5, length(vUv - .5) + (h2 - .5) * .2);
            // a raft has a matted heart: sodden leaf cushions and cone scales packed solid, its rim ragged (smooth noise, no squares)
            float rimN = (ln(vUv * 4. + vSeed * 9.) - .5) * .3 + (ln(vUv * 11. + vSeed * 5.) - .5) * .17 + (ln(vUv * 29. + vSeed * 2.) - .5) * .1;
            float rimD = length(vUv - .5) + rimN, core = vRaft * (1. - smoothstep(.27, .3, rimD));
            if (m < .5 && core < .5) discard;
            vec3 a = mix(vec3(.11, .075, .035), vec3(.17, .19, .075), h2);
            a = mix(a, vec3(.36, .33, .2), step(.86, h)) * (.75 + .5 * lh(c + 3.));
            // the mat itself: fine flecks (cone scales, needles) lying every way on dark sodden litter
            vec2 p2 = vUv * 19. + (vec2(ln(vUv * 6.3 + vSeed), ln(vUv * 6.3 + vSeed + 5.)) - .5) * 1.6, c2 = floor(p2); float g = lh(c2 + vSeed * 13.), g2 = lh(c2 + vSeed * 3. + 2.), a2 = g2 * 6.283; vec2 f2 = fract(p2) - .5 + (vec2(g2, g) - .5) * .4;
            vec2 r2 = vec2(f2.x * cos(a2) + f2.y * sin(a2), f2.y * cos(a2) - f2.x * sin(a2));
            float lfw = fwidth(vUv.x) + fwidth(vUv.y), lFine = 1. - smoothstep(.012, .035, lfw);      // flecks go out before they fall under a pixel (they were a grid of dots)
            float fl2 = (1. - smoothstep(.22, .34, length(r2 * vec2(1., 2. + 2. * g)))) * step(.58, g) * lFine;
            vec3 mat = vec3(.07, .05, .027) * (.45 + 1.1 * ln(vUv * 9. + vSeed * 3.)) * (.7 + .6 * ln(vUv * 2.7 + vSeed * 11.));
            mat = mix(mat, mix(vec3(.1, .07, .035), vec3(.16, .15, .07), g2) * (.6 + .7 * g), fl2);
            mat = mix(mat, vec3(.24, .2, .11), fl2 * step(.94, g));
            // a second, coarser and sparser scatter: needles and cone scales of other sizes, tones and directions
            vec2 p3 = vUv * 8.3 + 3.7, c3 = floor(p3), f3 = fract(p3) - .5; float k3 = lh(c3 + vSeed * 23.), k4 = lh(c3 + vSeed * 5. + 4.), a3 = k4 * 6.283;
            vec2 r3 = vec2(f3.x * cos(a3) + f3.y * sin(a3), f3.y * cos(a3) - f3.x * sin(a3)) + (vec2(k3, k4) - .5) * .3;
            float fl3 = (1. - smoothstep(.3, .4, length(r3 * vec2(1., 2.2 + 7. * k4)))) * step(.66, k3) * (1. - smoothstep(.03, .08, lfw));
            mat = mix(mat, mix(vec3(.2, .11, .045), vec3(.3, .28, .14), k4 * k4) * (.6 + .5 * k3), fl3);
            mat *= 1. - .6 * smoothstep(.17, .29, rimD);                               // a darker, wetter rim
            a = mix(a, mat, step(.5, core));
            gl_FragColor = vec4(a * uL * 2.4, 1.);
            #include <fog_fragment>
          }`,
      }), n);
      const iO = new Float32Array(n * 2), iT = new Float32Array(n), tr = makeRng(4141);
      for (let i = 0; i < n; i++) {
        if (i % 400 === 399) await ctx.yield();                               // lr and tr are drawn only here: a yield cannot reorder them
        const [cx, cz, ox, oz, sp, kind] = cards[i], thing = i >= nCards, sc = thing ? (kind === 1 ? tr.range(0.3, 0.38) : tr.range(0.9, 1.3)) : lr.range(0.8, 2.1) * (lr() < 0.3 ? 1.5 : 1);
        M4.compose(P3.set(cx, 0.02, cz), Q4.setFromEuler(E3.set(0, (thing ? tr() : lr()) * TAU, 0)), S3.set(sc, 1, thing ? sc * (kind === 1 ? 0.5 : 0.42) : sc * lr.range(0.6, 1))); im.setMatrixAt(i, M4);
        iL[i * 3] = sp; iL[i * 3 + 1] = thing ? 1.6 + kind : lr(); iL[i * 3 + 2] = thing ? tr() : lr(); iO[i * 2] = ox; iO[i * 2 + 1] = oz; iT[i] = kind;
      }
      g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 1));
      g.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 2));
      g.setAttribute('iL', new THREE.InstancedBufferAttribute(iL, 3)); im.frustumCulled = false; scene.add(im);
    }
    await ctx.yield();

    // ---- GRIFFINFLIES of our own (the hero perches four): one perched beside our line at u 0.18, one that lifts off the leaning
    // trunk at u 0.92, one crossing the entry shaft, two that hawk ahead of us down the nave, the rest on beats of their own
    const GF = hero.griffinflies, g0 = A.perches.length, L = path.length, lifterSeat = V3(-1.2, 8.78, FALL_Z + 0.58);
    GF.place(g0, perchPos.toArray(), perchN.toArray(), 0.15, 1.3);
    GF.place(g0 + 1, lifterSeat.toArray(), [0, 0, 1], -0.9, 1.25);
    const hawks = [];
    for (let k = 0; k < nHawk; k++) {
      const us = [0, 0.3, 0.3, 0.66, 0.8, 0.42, 0.72][k], side = k % 2 ? 1 : -1;
      hawks.push({ i: g0 + 2 + k, role: k === 0 ? 'entry' : k < 3 ? 'escort' : 'beat', side, ph: rngLife() * TAU, f: [rngLife.range(0.55, 0.8), rngLife.range(0.9, 1.3), rngLife.range(0.4, 0.6)],
        c: k === 0 ? V3(0.2, 7.3, 212.4) : path.pointAt(us).add(V3(side * rngLife.range(3, 4.5), rngLife.range(1.5, 3.5), 0)), r: k === 0 ? V3(2.1, 0.3, 0.45) : k < 3 ? V3(1.1, 0.45, 1.3) : V3(2.6, 1.0, 4.2) });
    }
    const gP = V3(), gD = V3(), gX = V3(), gY = V3(), gT = V3(), gM = new THREE.Matrix4(), UPV = V3(0, 1, 0);
    const setFly = (i, p, d, bank, sc) => {
      gD.copy(d).normalize(); gX.crossVectors(UPV, gD).normalize(); gY.crossVectors(gD, gX);
      gX.applyAxisAngle(gD, bank); gY.applyAxisAngle(gD, bank);
      gM.makeBasis(gX, gY, gD).scale(S3.set(sc, sc, sc)).setPosition(p); GF.setMatrix(i, gM);
    };

    // ---- the swarm: 600 palaeodictyopterans (mayfly-like, banded wings, two tail threads) that lift off the water at u 0.64.
    // Polish 2: each is a small BODY IN SPACE, not a card facing the lens (cards read as scattered X marks): a slim body, two pairs
    // of banded wings held out and beating about the body's own axis, two long tail threads, flying nose-up on its own heading.
    const swarmU = { uTime: HU.uTime, uProg: { value: 0 }, uRes: { value: 450 }, uSun: { value: col(mood.sun) }, uAmber: { value: col('#E8A23A') } };
    {
      const n = Math.round(600 * detail), VPI = 28, pos = new Float32Array(n * VPI * 3), base = new Float32Array(n * VPI * 4), loc = new Float32Array(n * VPI * 3), knd = new Float32Array(n * VPI * 2), idx = [];
      const zA = zOfU(0.665), zB = zOfU(0.755), sr = rngLife.fork('swarm');
      // one insect in its own space (x across, y up, z along the body, half span = 1): [x, y, z, kind (0 body, 1 wing, 2 tail), band]
      const quad = (a, b, c, d, k) => [[...a, k, 0], [...b, k, 1], [...c, k, 1], [...d, k, 0]];
      const proto = [
        ...quad([-0.1, 0, 0.52], [0.1, 0, 0.52], [0.05, 0, -0.55], [-0.05, 0, -0.55], 0),                 // body
        ...quad([0.04, 0.02, 0.36], [1.0, 0.02, 0.4], [1.0, 0.02, 0.18], [0.04, 0.02, 0.2], 1),             // fore wings
        ...quad([-0.04, 0.02, 0.36], [-1.0, 0.02, 0.4], [-1.0, 0.02, 0.18], [-0.04, 0.02, 0.2], 1),
        ...quad([0.04, 0.01, 0.1], [0.8, 0.01, 0.04], [0.76, 0.01, -0.2], [0.04, 0.01, -0.08], 1),          // hind wings, shorter and broader
        ...quad([-0.04, 0.01, 0.1], [-0.8, 0.01, 0.04], [-0.76, 0.01, -0.2], [-0.04, 0.01, -0.08], 1),
        ...quad([0.0, 0, -0.5], [0.05, 0, -0.5], [0.4, 0, -1.7], [0.34, 0, -1.7], 2),                        // two tail threads
        ...quad([0.0, 0, -0.5], [-0.05, 0, -0.5], [-0.4, 0, -1.7], [-0.34, 0, -1.7], 2),
      ];
      // THE CLEAR TUBE (the owner, 2026-10-08 11:31 UTC). We fly THROUGH the swarm, and an insect a third of a metre across that
      // wanders onto the lens is cut piecemeal by the near plane: a flicker of the picture, not an insect. So every insect is laid
      // where its whole wander plus its half span stays CLEAR of the route's own line, at every clock and in every state of its
      // rise off the water. A rule of place only: nothing here asks the eye, the clock, the share flown or the seed.
      const CLEAR = 0.5;                                   // m between the route's line and the nearest a wing can be drawn (the lens rides that line: 0.2 m of air beyond its near distance of 0.3 m)
      // The figures of the shader below that the rule stands on, each written once (change the shader and these are the place to look).
      // near counts as 1 for the fifth laid beside our line: it is the position.y the loop writes.
      const wandOf = (near) => 1.3 - 0.75 * near;          // 'float wand = 1.3 - .75 * position.y': how far the centre wanders to either side and along the nave, m
      const WATER = 0.04, RISE = 0.35, CLIMB = 5.2;        // 'vec3 c = vec3(aBase.x, .04 + lift * (.35 + aBase.y * 5.2), aBase.z)': it rises from WATER to WATER + RISE + CLIMB * h, m
      const BOB = 0.22;                                    // 'c.y += sin(uTime * 1.9 + ph * 113.) * .22 * lift': up and down about that height, m
      const sizeOf = (near, f = 1) => (0.085 + 0.05 * f) * (1 + 0.5 * near);   // 'float sz = (.085 + .05 * fract(ph * 7.3)) * (1. + .5 * position.y)': its size near the lens, m; f is that fract, under 1, so f = 1 is the largest of its kind
      const fractOf = (ph) => { const v = Math.fround(Math.fround(ph) * Math.fround(7.3)); return v - Math.floor(v); };   // the same line's fract(ph * 7.3), in the single precision the shader works in (aBase holds ph as a single)
      const SPAN = 1.0923;                                 // the furthest a wing or body vertex is drawn from the centre, in sizes: the fore wing's tip [1, 0.02, 0.4] of proto at the top of the beat, 'ang = isW * (.25 + .7 * sin(uTime * 21. + ph * 50.))', sqrt(1.1604 + 0.04 * sin(0.95))
      // the route's own line (it jinks), a point every fifth of a metre from its first metre to its last (between two such points
      // the line bends by half a millimetre at most): of the whole of it, the points that can matter to an insect.
      // WHICH THOSE ARE (a first build stalled on asking every insect against all 2,428 points: the reader, 2026-10-08). The rule
      // below counts a point only where r2 > 0, and that needs the point's z nearer the insect's z than the insect's wander plus
      // its room. An insect's z lies within ALONG of the span zA to zB (the line that lays z, below: its lerp and its
      // sr.range(-2, 2), the same 2), and the rule moves an insect sideways only, never along the nave. So a point further beyond
      // that span than ALONG plus the largest wander plus room of either kind gives r2 <= 0 for every insect, before and after any
      // move: leaving it out changes no insect. One more STEP is kept at either end, so that no rounding stands on the edge.
      const line = [], lp = V3(), STEP = 0.2, ALONG = 2;
      const REACH = ALONG + Math.max(wandOf(0) + Math.hypot(SPAN * sizeOf(0) + CLEAR, STEP / 2), wandOf(1) + Math.hypot(SPAN * sizeOf(1) + CLEAR, STEP / 2)) + STEP;   // 2 + 1.955 + 0.2 = 4.155 m
      const zLo = Math.min(zA, zB) - REACH, zHi = Math.max(zA, zB) + REACH;
      for (let k = 0, K = Math.ceil(path.length / STEP); k <= K; k++) { path.posAtDist(Math.min(k * STEP, path.length), lp); if (lp.z >= zLo && lp.z <= zHi) line.push(lp.x, lp.y, lp.z); }
      for (let i = 0; i < n; i++) {
        if (i % 25 === 0) await ctx.yield();                 // before the first insect (the line above is a piece of work of its own) and often after: an insect's rule is a few hundred tests and a first build runs them slowly; ctx.yield is free to ask
        const t = sr(), near = i % 5 === 0, z = lerp(zA, zB, near ? t * 0.62 : t) + sr.range(-2, 2), ph = sr();   // one in five flies beside our own line (most of them in its first 27 m), near enough to show its banded wings
        // the laid fifth: from the nearest its wander, the largest half span of its kind and CLEAR allow, out to 1.7 m as before (the same draw)
        const pz = path.pointAt(uOfZ(z)); let x = near ? pz.x + sr.range(wandOf(1) + SPAN * sizeOf(1) + CLEAR, 1.7) * sr.sign() : sr.gauss() * 4.2 + (sr() < 0.3 ? sr.range(-9, 9) : 0);
        // those beside our line rise to our own height (we climb to 9.5 m here); the rest fill the air from the water to the lower crowns
        const h = near ? (pz.y - RISE + (sr.range(0.1, 0.3) - 0.2) * 9) / CLIMB : sr() * sr() * 2.3;
        // THE RULE, for every insect alike. Its wander is the column over its place: wandOf to either side and along, from the
        // water up to its flying height and BOB above. Wherever a point of the route's line comes nearer that column than its own
        // half span plus CLEAR, the insect is short of room; it moves sideways, to the side of the line it already lies on, by the
        // most it is short anywhere (once: the column's height and its place along the nave do not move, so one move clears every point).
        // The room is asked of points STEP apart, so it is grown by the most the straight piece between two of them can cut inside it.
        // The move is TWICE that shortfall (the lead's ruling, 2026-10-08 13:25 UTC), so an insect the rule moves ends as far outside its
        // least distance as it lay inside it and the moved do not stand in a row on the wall: still a rule of place only (nothing from
        // the eye, the clock, the share flown or the seed; no draw added, removed or reordered).
        {
          const wand = wandOf(near), room = Math.hypot(SPAN * sizeOf(near, fractOf(ph)) + CLEAR, STEP / 2), low = WATER + Math.min(RISE + CLIMB * h - BOB, 0), top = WATER + Math.max(RISE + CLIMB * h + BOB, 0), side = x < pz.x ? -1 : 1;
          let short = 0;
          for (let q = 0; q < line.length; q += 3) {
            const dz = Math.max(Math.abs(line[q + 2] - z) - wand, 0), dy = Math.max(low - line[q + 1], line[q + 1] - top, 0), r2 = room * room - dz * dz - dy * dy;
            if (r2 > 0) short = Math.max(short, wand + Math.sqrt(r2) - side * (x - line[q]));
          }
          x += side * 2 * short;
        }
        for (let k = 0; k < VPI; k++) {
          const v = i * VPI + k, pv = proto[k];
          base.set([x, h, z, ph], v * 4); pos.set([x, near ? 1 : 0, z], v * 3); loc.set([pv[0], pv[1], pv[2]], v * 3); knd.set([pv[3], pv[4]], v * 2);
        }
        for (let q = 0; q < 7; q++) { const a = i * VPI + q * 4; idx.push(a, a + 1, a + 2, a, a + 2, a + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.BufferAttribute(base, 4));
      g.setAttribute('aLoc', new THREE.BufferAttribute(loc, 3)); g.setAttribute('aKind', new THREE.BufferAttribute(knd, 2)); g.setIndex(idx);
      const m = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...swarmU, uZ: { value: new THREE.Vector2(zA, zB) } }, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute vec4 aBase; attribute vec3 aLoc; attribute vec2 aKind; uniform float uTime, uProg, uRes; uniform vec2 uZ;
          varying vec2 vK; varying float vA; varying float vPh; varying float vNear; varying float vAcross;
          void main(){
            float ph = aBase.w, zt = clamp((aBase.z - uZ.x) / min(uZ.y - uZ.x, -1.), 0., 1.), start = .606 + zt * .07 + ph * .012;
            float lift = smoothstep(start, start + .05, uProg);
            vec3 c = vec3(aBase.x, .04 + lift * (.35 + aBase.y * 5.2), aBase.z);
            float wand = 1.3 - .75 * position.y; c.x += sin(uTime * (.5 + ph * .5) + ph * 37.) * wand * lift; c.z += cos(uTime * (.4 + ph * .4) + ph * 61.) * wand * lift;
            c.y += sin(uTime * 1.9 + ph * 113.) * .22 * lift;
            // its own heading and a nose-up attitude; wings beat about the body's axis
            float yaw = ph * 47. + 1.1 * sin(uTime * (.35 + ph * .3) + ph * 23.), pit = .35 + .25 * sin(uTime * 1.7 + ph * 31.);
            vec3 fw = vec3(sin(yaw) * cos(pit), sin(pit), cos(yaw) * cos(pit)), rt = vec3(cos(yaw), 0., -sin(yaw)), up = cross(fw, rt);
            float isW = step(.5, aKind.x) * step(aKind.x, 1.5), ang = isW * (.25 + .7 * sin(uTime * 21. + ph * 50.));
            vec3 l = aLoc; float ax = abs(l.x); l.y += ax * sin(ang); l.x = sign(l.x) * ax * cos(ang);
            vec4 mv0 = viewMatrix * vec4(c, 1.);
            float d = max(-mv0.z, .05), px = d * 2. / max(projectionMatrix[1][1] * uRes, 1.);
            float sz = (.085 + .05 * fract(ph * 7.3)) * (1. + .5 * position.y), szc = max(sz, 2.4 * px);
            vA = clamp((sz / szc) * 1.6, 0., 1.) * step(.002, lift);
            vec3 wp = c + (rt * l.x + up * l.y + fw * l.z) * szc * step(.002, lift);
            vec4 mvPosition = viewMatrix * vec4(wp, 1.);
            vK = aKind; vPh = ph; vNear = position.y; vAcross = aLoc.x;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uSun, uAmber; varying vec2 vK; varying float vA; varying float vPh; varying float vNear; varying float vAcross;
          void main(){
            vec3 dark = vec3(.045, .035, .02); vec3 c = dark; float a = .95;
            if (vK.x > .5 && vK.x < 1.5) {                                         // a wing: clear amber membrane crossed by dark bands, a dark tip
              float w = clamp(vK.y, 0., 1.), band = max(1. - smoothstep(.1, .3, w), smoothstep(.72, .9, w));
              band = max(band, .55 * (1. - smoothstep(.04, .1, abs(w - .5))));
              c = mix(uAmber * uSun * (.8 + .5 * vNear) + .06, dark * 1.6, band); a = mix(.5 + .2 * vNear, .85, band);
            } else if (vK.x > 1.5) a = .8;
            gl_FragColor = vec4(c, a * vA);
            if (gl_FragColor.a < .02) discard;
            #include <fog_fragment>
          }`,
      });
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5; scene.add(mesh);
    }
    await ctx.yield();

    // ---- what is carried with the camera: nothing. (The crew lead's rule: no carried body in view. The griffinfly we are is
    // told by the camera's own motion and by the escorts hawking beside us.) The group stays, empty, with its visibility line.
    const rideGroup = new THREE.Group(); scene.add(rideGroup);

    // ---- air: spores and cone scales sifting down through the shafts, steam sliding low over the water, rain in the rain mood
    const set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rngFx.fork('spores'), preset: 'pollen', time: HU.uTime, count: Math.round(1500 * detail), box: [46, 26, 46], velocity: [0.12, -0.32, 0.05],
      size: [0.02, 0.055], colors: ['#f2f0c4', mood.steam, '#d9c58a'], intensity: moodId === 'rain' ? 0.5 : 1.1 }));
    const mist = set.add(fx.makeMist({ rng: rngFx.fork('mist'), time: HU.uTime, count: Math.round(70 * detail), area: [200, 4, 200], center: [0, 2.2, 0], size: [14, 30], color: mood.steam,
      opacity: moodId === 'rain' ? 0.2 : 0.13, drift: [0.5, 0, 0.18], follow: true }));
    if (moodId === 'rain') set.add(fx.makeParticles({ rng: rngFx.fork('rain'), preset: 'rain', time: HU.uTime, count: Math.round(5200 * detail), colors: ['#dfe8e2', '#c2cec8', '#eef4ee'], intensity: 0.75 }));
    await ctx.yield();

    // ---- rain: the break in the cloud. A soft pale glow standing 150 m down the nave from wherever we are (so nearer trunks are
    // dark against it and farther ones are veiled by it), ragged with cloud, crossed by falling streaks of rain.
    const gapU = { uTime: HU.uTime, uK: { value: mood.gap ? 1 : 0 }, uCol: { value: V3(...(mood.gap || [0, 0, 0])).multiplyScalar(0.5) } };
    const gapCard = new THREE.Mesh(new THREE.PlaneGeometry(300, 120), new THREE.ShaderMaterial({
      uniforms: gapU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uK; uniform vec3 uCol; varying vec2 vUv;
        float gh(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); float n = i.x + i.y * 57.;
          return mix(mix(gh(n), gh(n + 1.), f.x), mix(gh(n + 57.), gh(n + 58.), f.x), f.y); }
        void main(){
          vec2 uv = clamp(vUv, 0., 1.), q = (uv - vec2(.5, .2)) * vec2(1., 1.7); float r2 = dot(q, q);
          float cloud = gn(uv * vec2(7., 4.) + vec2(uTime * .012, 0.)) * .6 + gn(uv * vec2(17., 9.) - vec2(uTime * .02, 0.)) * .4;
          float g = (exp(-r2 * 30.) + exp(-r2 * 7.) * .42) * (.62 + .7 * cloud);
          g *= smoothstep(0., .1, uv.y) * (1. - smoothstep(.3, .5, abs(uv.x - .5))) * (1. - smoothstep(.6, 1., uv.y));
          float sx = uv.x * 150. + uv.y * 9., col = floor(sx), fall = fract(uv.y * 2.2 + uTime * (.9 + .5 * gh(col)) + gh(col + 3.) * 9.);
          float streak = step(.55, gh(col + 11.)) * (1. - smoothstep(.1, .3, abs(fract(sx) - .5))) * smoothstep(0., .25, fall) * (1. - smoothstep(.45, .7, fall));
          gl_FragColor = vec4(clamp(uCol * g * uK * (1. - .3 * streak), 0., 4.), 1.);
        }`,
    }));
    gapCard.frustumCulled = false; gapCard.visible = !!mood.gap; gapCard.renderOrder = -17; gapCard.position.set(0, 60, 60); scene.add(gapCard);

    // ---- RARE: dry lightning far behind the left wall (two flickers, eight seconds apart) and a thin line of fire running along
    // a distant fern bank under white smoke: 30% oxygen. Everything is built now; the glow is dark and the fire unlit until its u.
    let flashGlow = null, fire = null; const fireU = { uTime: HU.uTime, uRun: { value: 0 } }, flashAt = [0.36, 0.36 + 8 / 45], fireZ = [-70, -175], fireX = -47;
    if (rare) {
      flashGlow = fx.makeGlow({ position: [-330, 95, -110], color: '#e9eeff', size: 300, intensity: 0, halo: 1, core: 0.25, fogAmount: 0, depthTest: true, time: HU.uTime });
      set.add(flashGlow);
      const g = new THREE.PlaneGeometry(1, 1, 60, 1); g.translate(0.5, 0.5, 0);
      const m = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...fireU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uRun; varying vec2 vUv;
          float fh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float fn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(fh(i), fh(i + vec2(1., 0.)), f.x), mix(fh(i + vec2(0., 1.)), fh(i + 1.), f.x), f.y); }
          void main(){
            float x = vUv.x * 105., y = vUv.y;
            float lit = smoothstep(uRun, uRun - .06, vUv.x) * smoothstep(0., .03, vUv.x);         // the line has run this far
            float head = 1. - smoothstep(0., .05, abs(vUv.x - uRun + .02));
            float tong = fn(vec2(x * .9, y * 3. - uTime * 2.6)) * .6 + fn(vec2(x * 2.3, y * 6. - uTime * 4.2)) * .4;
            float hgt = (.3 + .5 * fn(vec2(x * .35, uTime * .7)) + .35 * head) * lit;
            float f = smoothstep(hgt, hgt * .25, y + tong * .22 - .08) * lit;
            vec3 c = mix(vec3(1.6, .32, .04), vec3(3.2, 1.9, .55), smoothstep(.5, 1., f) * (1. - y));
            gl_FragColor = vec4(c * f * (.8 + .2 * sin(uTime * 9. + x)), 1.);
          }`,
      });
      fire = new THREE.Mesh(g, m); fire.position.set(fireX, 0.1, fireZ[0]); fire.rotation.y = Math.PI / 2; fire.scale.set(fireZ[0] - fireZ[1], 4.2, 1); fire.frustumCulled = false; fire.renderOrder = 6; scene.add(fire);
      for (const k of [0.3, 0.75]) set.add(fx.makeSmokeColumn({ rng: rngFx.fork('smoke' + k), time: HU.uTime, position: [fireX - 2, 2, lerp(fireZ[0], fireZ[1], k)], height: 46, radius: [3, 15], size: [7, 24], count: 60,
        color: '#e9ebe2', colorTop: '#f4f4ec', shadowColor: '#9aa39a', ambient: '#5d665c', opacity: 0.55, wind: [0.5, 0, -0.9], sunDir: sunDir.toArray(), hot: '#ff7a1c', hotFalloff: 8 }));
    }
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);
    const perchLook = perchPos.clone().add(V3(0.8, -0.1, -0.85)), crownLook = path.pointAt(0.27).add(V3(0, 22, -24)), baskNow = V3(BASK.x, 0.4, BASK.z), surfLook = V3(sw1[0] + 0.8, 0, sw1[1] - 2);
    const legs = [[0.11, 1.2, 0.8], [0.44, 0.8, 0.75], [0.655, 0.75, 1.45], [0.86, 1.45, 1.0]];
    const pace = (u) => { let p = 1.2; for (const [at, a, b] of legs) p += (b - a) * smoothstep(at - 0.035, at + 0.035, u);
      return p * (1 - 0.4 * smoothstep(UA - 0.03, UA - 0.008, u) * (1 - smoothstep(UA + 0.004, UA + 0.02, u))) * (1 - 0.3 * smoothstep(UB - 0.03, UB - 0.01, u) * (1 - smoothstep(UB + 0.002, UB + 0.02, u))); };
    const arthNow = V3(), arthAhead = V3(), arthAt = (time, u) => { path.pointAt(clamp(u + 16 / path.length, 0, 1), arthAhead); return arthNow.copy(arthLook).lerp(arthAhead, smoothstep(UA + 0.0015, UA + 0.014, u)); };
    const size = new THREE.Vector2(), tan = V3(), q1 = new THREE.Quaternion(), tmp = V3(), seatT = V3(), flashT = [-100, -100];
    let prevU = 0, lifterFlying = false;
    let litterDrift = 0, litterSpin = 0;   // how far the sheet has carried the litter (m) and turned its rafts (rad) so far: sums kept by update(), this built world's own
    const baskPos = V3(BASK.x, logTop, BASK.z), baskIn = baskPos.clone().addScaledVector(baskHead, 2.55).setY(-0.1), swimDir = V3(-0.45, 0, -0.89).normalize(), US = UB + 0.012;
    const setWake = (i, p, yaw, kv, kr) => { M4.compose(P3.set(p.x, 0.025, p.z), Q4.setFromEuler(E3.set(0, yaw, 0)), S3.set(1, 1, 1)); wakes.setMatrixAt(i, M4); wakeK[i * 2] = kv; wakeK[i * 2 + 1] = kr; };
    const env = (d) => (d < 0 ? 0 : d < 0.1 ? d / 0.1 : Math.exp(-(d - 0.1) / 0.3));

    return {
      scene, path, duration: 45, pace,
      title: 'The Forest before Flowers · 310 million years ago',
      ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 600, lookAhead: 16, sway: 0.5, bank: 0.6 },
      pois: [
        { at: perchLook, from: 0.137, to: 0.187, weight: 0.7, fade: 0.25 },
        { at: perchLook, from: 0.15, to: 0.185, weight: 0.5, fade: 0.3 },
        { at: crownLook, from: 0.2, to: 0.325, weight: 0.7 },
        { at: () => baskNow, from: UB - 0.04, to: UB + 0.009, weight: 0.5, fade: 0.2 },
        { at: () => baskNow, from: UB - 0.03, to: UB + 0.009, weight: 0.45, fade: 0.25 },
        { at: () => laneNow, from: ULANE - 0.045, to: ULANE + 0.012, weight: 0.55, fade: 0.25 },
        // two holds on the same point: the gaze locks on the animal as we come over it (and the steady camera, which gives a
        // point of interest a third of its pull, still tips down to it); past UA the point slides away up the path so we never look back
        { at: arthAt, from: UA - 0.08, to: UA + 0.03, weight: 0.9, fade: 0.25 },
        { at: arthAt, from: UA - 0.045, to: UA + 0.03, weight: 0.6, fade: 0.3 },
        { at: arthAt, from: UA - 0.03, to: UA + 0.03, weight: 0.5, fade: 0.3 },
        { at: surfLook, from: USURF - 0.05, to: USURF + 0.012, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#D6F0C2', glow: 1, revealDistance: 190, tilt: true },
      post: { exposure: mood.exposure, bloom: { strength: 0.4, radius: 0.6, threshold: 0.9 },
        // the grade's contrast pushes everything under about 0.05 to pure black; the shadow tint carries the upper half of those
        // darks back to olive (the brief: shadows are olive, never black) and leaves the mirror its depth
        grade: { saturation: moodId === 'amber' ? 1.12 : 1.05, contrast: moodId === 'noon' ? 1.13 : 1.08, tint: mood.tint, shadowTint: mood.shadowTint, vignette: 0.2, grain: 0 } },
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time, camera);
        sky.update(dt, time, camera); set.update(dt, time, camera);
        const bnc = smoothstep(0.45, 0.62, u);
        hemi.groundColor.copy(hemiGround0).lerp(hemiGround1, bnc * 0.85);                 // the silt becomes a bounce card: light from below
        wakeCol.value.copy(wakeCol0).lerp(wakeCol1, bnc);
        ctx.renderer.getDrawingBufferSize(size); swarmU.uProg.value = u; swarmU.uRes.value = size.y;
        rideGroup.visible = u > 0 && !ctx.through;
        blazeU.uK.value = 1 - smoothstep(0.06, 0.135, u);
        camera.getWorldPosition(tmp); gapCard.position.set(tmp.x * 0.4, 60, tmp.z - 150); gapU.uK.value = mood.gap ? 1 - 0.55 * smoothstep(0.78, 0.94, u) : 0;
        // the litter's drift and spin are SUMS of rate times the step (the owner, 2026-10-08): the rate rises with u as the sheet arrives,
        // and the clock times a rising rate threw the litter along at the clock's whole length times the rate's rise (9 to 29 m/s and
        // more); summed, its speed in every frame is the rate itself, 0.12 rising to 1.57 m/s and 0.04 to 0.44 rad/s. A step of 0 adds nothing.
        litterDrift += dt * (0.12 + 1.45 * smoothstep(0.46, 0.58, u)); litterSpin += dt * (0.04 + 0.4 * smoothstep(0.46, 0.58, u));
        litterU.uDrift.value = litterDrift; litterU.uSpin.value = litterSpin;
        // amphibians
        for (let i = 0; i < amph.length; i++) {
          const am = amph[i];
          if (am.kind === 'bask0') {                                    // sprawled on the log until we are almost abreast, then forward off its end
            const s1 = smoothstep(UB + 0.001, US, u), inWater = u >= US;
            am.a.mesh.visible = !inWater; am.b.mesh.visible = inWater;
            if (!inWater) {
              const e = s1 * s1; tmp.copy(baskPos).lerp(baskIn, e); tmp.y += Math.sin(e * Math.PI) * 0.1;
              am.a.mesh.position.copy(tmp); baskNow.copy(tmp); am.a.mesh.rotation.set(-BASK_TILT * (1 - e) + 0.5 * Math.sin(Math.min(e * 1.3, 1) * Math.PI), baskYaw, 0, 'YXZ'); am.a.U.uSwim.value = s1 * 0.5;
            } else {
              const d = (u - US) * L * 0.3, d1 = Math.min(d, 1.6), turn = smoothstep(0.3, 3, d);
              tmp.copy(baskIn).addScaledVector(baskHead, d1).addScaledVector(swimDir, Math.max(d - 1.6, 0)); tmp.y = -0.03; baskNow.copy(tmp);
              am.b.mesh.position.copy(tmp); am.b.mesh.rotation.set(0, lerp(baskYaw, Math.atan2(swimDir.x, swimDir.z), turn), 0); am.b.U.uSwim.value = 1;
            }
            setWake(i, inWater ? tmp : baskIn, inWater ? am.b.mesh.rotation.y : baskYaw, smoothstep(US, US + 0.012, u), smoothstep(US - 0.006, US + 0.001, u) * (1 - smoothstep(US + 0.025, US + 0.085, u)));
          } else if (am.kind === 'lane') {
            const k = (u - ULANE) * L * 0.3, rise = smoothstep(ULANE - 0.05, ULANE - 0.025, u);
            am.b.mesh.position.copy(laneAt).addScaledVector(laneDir, k); am.b.mesh.position.y = -0.4 + 0.39 * rise; am.b.mesh.rotation.set(0, am.yaw, 0); am.b.mesh.scale.setScalar(am.s);
            am.b.U.uSwim.value = 1; setWake(i, am.b.mesh.position, am.yaw, rise, 0.55 * rise); laneNow.copy(am.b.mesh.position);
          } else if (am.kind === 'surf') {
            const lift = smoothstep(USURF - 0.075, USURF - 0.03, u);
            am.b.mesh.position.set(am.x + (u - USURF) * L * 0.1, -0.45 + 0.47 * lift, am.z - (u - USURF) * L * 0.07); am.b.mesh.rotation.set(0, am.yaw, 0); am.b.mesh.scale.setScalar(am.s);
            am.b.U.uSwim.value = 1; setWake(i, am.b.mesh.position, am.yaw, lift * 0.9, lift * (1 - smoothstep(USURF, USURF + 0.06, u)));
          } else setWake(i, am.a.mesh.position, 0, 0, 0);
        }
        wakes.instanceMatrix.needsUpdate = true; wakeAttr.needsUpdate = true;
        // griffinflies on the wing
        for (const h of hawks) {
          const a0 = h.f[0] * time + h.ph, a1 = h.f[1] * time + h.ph * 2, a2 = h.f[2] * time + h.ph * 3;
          gP.copy(h.c); gT.set(h.r.x * h.f[0] * Math.cos(a0), h.r.y * h.f[1] * Math.cos(a1), h.r.z * h.f[2] * Math.cos(a2));
          let sc = 1;
          if (h.role === 'entry') {
            // it leads us down the lane, carried on our own line 6 to 7 m ahead (never nearer than 4 m), crossing the bright column
            // from one side of the lone trunk to the other; as we sink past the tree it peels away to the right and is left behind
            const uE = Math.min(u, 0.125), peel = smoothstep(0.085, 0.125, u);
            path.pointAt(uE + (5.5 + 6 * peel) / L, gP); path.tangentAt(uE, tan);
            gP.x += 0.35 + 7.5 * peel; gP.y += -0.45 + 2.9 * peel; gT.multiplyScalar(2.2).addScaledVector(tan, 2.6); gT.x += 3 * peel * (1 - peel) * 4; sc = 1.7;
          }
          else if (h.role === 'escort') {
            // two spells beside us: down the black nave (u 0.3 to 0.47), and again for the run in to the doorway (u 0.79 to 0.92)
            const late = u > 0.64, uE = late ? clamp(u, 0.76, 0.925) : clamp(u, 0.3, 0.47);
            const peel = late ? Math.max(1 - smoothstep(0.765, 0.81, u), smoothstep(0.905, 0.95, u)) : smoothstep(0.452, 0.5, u), lead = late ? (u > 0.76 && u < 0.925 ? 1 : 0) : u > 0.3 && u < 0.47 ? 1 : 0;
            path.pointAt(uE + (late ? 3.9 : 4.2) / L, gP); gP.x += h.side * (1.25 + 6 * peel); gP.y += 0.15 + (h.side > 0 ? 0.55 : 0) + 3 * peel;
            path.tangentAt(uE, tan); gT.addScaledVector(tan, 6 * lead + 1.5); sc = late ? 1.5 : 1.4;
          }
          gP.x += h.r.x * Math.sin(a0); gP.y += h.r.y * Math.sin(a1); gP.z += h.r.z * Math.sin(a2);
          if (gT.lengthSq() < 1e-4) gT.set(0, 0, -1);
          gT.y += 0.55 * gT.length();                                                         // hawking attitude: nose up, so the wings show from behind
          setFly(h.i, gP, gT, 0.7 * Math.sin(a0 + 1.57) * h.side, sc);
          GF.setFlap(h.i, 1 - smoothstep(0.45, 0.7, Math.sin(time * 1.9 + h.ph)));
        }
        if (u >= 0.878) {                                                                    // the one on the leaning trunk lifts off ahead of us
          const w = smoothstep(0.878, 0.905, u), w2 = smoothstep(0.955, 0.99, u);
          path.pointAt(u, gP); path.tangentAt(u, tan); gP.addScaledVector(tan, 3.7); gP.x += 0.75 + 7 * w2 + 0.25 * Math.sin(time * 2.3); gP.y += 0.55 + 3 * w2 + 0.15 * Math.sin(time * 3.1);
          seatT.copy(lifterSeat).lerp(gP, w); gT.copy(tan); gT.x += w2 * 1.0; gT.y += 0.75;
          setFly(g0 + 1, seatT, gT, -0.35 - 0.3 * w2, 1.5); GF.setFlap(g0 + 1, 1); lifterFlying = true;
        } else if (lifterFlying) { GF.place(g0 + 1, lifterSeat.toArray(), [0, 0, 1], -0.9, 1.25); GF.setFlap(g0 + 1, 0); lifterFlying = false; }
        // the rare event
        if (rare) {
          for (let k = 0; k < 2; k++) if (prevU < flashAt[k] && u >= flashAt[k] && u - prevU < 0.05) flashT[k] = time;
          let fl = 0; for (let k = 0; k < 2; k++) { const d = time - flashT[k]; fl = Math.max(fl, env(d), 0.65 * env(d - 0.55)); }
          flashGlow.uniforms.uIntensity.value = fl * 1.6; hemi.intensity = mood.hemiI * (1 + 0.14 * fl);
          fireU.uRun.value = 0.16 + 0.84 * smoothstep(0.42, 0.85, u);
        }
        prevU = u;
      },
      dispose() { hero.dispose(); sky.dispose?.(); },
    };
  },
};
