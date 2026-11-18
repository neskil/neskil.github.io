// railway-under-the-sea (film worlds D). Card: INSPIRED BY Spirited Away (2001), film.
// Only the film's IDEA is taken: a railway whose track lies under a calm, shallow sea. Everything drawn is ours or
// a real kind: the tidal-flat railways of the North Frisian Wadden Sea, the Brighton seashore electric railway of
// 1896, a rural two-axle rail-bus, stake groynes, birch way marks (pricken), a refuge beacon, dwelling mounds with
// thatched houses, stilt houses, sea birds, an ice halo round a veiled low sun. No pole line, no wire, no figure,
// nothing lettered, no sound. The design: design/film/railway-under-the-sea.design.md.
//
// SAID AT THE HEAD (the laws of the build):
// - THE HOURS ARE PLACES: the day (two thirds of the flight), the late light (a pale silver sun behind a high veil
//   of ice cloud, with its halo), the short grey-blue dusk and the lamps' night value are read from the eye's z ON
//   THE ROUTE (path.pointAt(u).z -> hours() in the law file): by the place on the route only. The railcar's
//   windows stay unlit until the lens is past it.
// - TWO DECLARED PACINGS, both by metres flown. (1) The railcar's place on the line is noseZ(the eye's z on the
//   route): at the entry it is drawing past on the east (its body 8.6 m from the entry's axis, outside the entry's
//   tube), it takes a station 9 m ahead, draws away down the line and stands at the halt (the knots are places
//   of the law file). (2) The skein of geese is the kit's crossing flock, which the kit keys to u: it crosses
//   high over the line, 20 m before the ring, when the lens is 210 m from the ring. Every other bird is free on
//   the world clock inside its own bounds: two parties of oystercatchers wheel over the west stake field and
//   over the island's far shore (both well off the line and the railcar), and the herons stand.
// - WHAT READS THE EYE (all allowed kinds): the mirror sea's reflection and sheen (a reflection); footprint
//   filtering in its shaders; the kit's sky domes and the late sun's halo, drawn round the rendering camera's
//   world position (sky things); the kit birds' own culling.
// - LOOKS A SEED DEALS: only ctx.vary deals them. hour 'golden': the day stretch is a paler, later afternoon;
//   'night': the dusk ends with a few stars; every other hour: day (the place's hours run toward evening, so a
//   dawn deal takes the day look). rare: a great flock of small waders turning over the flats. density: birds,
//   stakes and far islands. The herons' stands are dealt by a rule of the place from a seeded stream.
// - THE WAY OUT: the last 100 m of the route lie on the ring's own axis, level, and its last three knots stand in
//   one line (a straight last span of 65 m). Neither portal.drawWithin nor portal.drawIn is set, so the engine
//   draws the ring at every metre of the flight; so a light of the ring lies on the water at every metre too, and
//   the mirror shows a plain hoop of light with a soft plain glow in the ring's place (no picture), the same at
//   every metre. portal.revealDistance is the engine's own law for when the next world shows inside the ring.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { ROUTE, RING, CAR, HALLIG, HALT, BEACON, WAY, PRICKEN, channelZ, lineX, beside, noseZ, noseRate, hours } from '../parts/railway-under-the-sea-line.js';
import { buildSea } from '../parts/railway-under-the-sea-sea.js';
import { buildTrack } from '../parts/railway-under-the-sea-track.js';
import { buildRailcar } from '../parts/railway-under-the-sea-railcar.js';
import { buildWorks } from '../parts/railway-under-the-sea-works.js';
import { buildIslands } from '../parts/railway-under-the-sea-islands.js';

const FOG = 0.00028;
const REVEAL = 380;                 // metres of route still to fly at which the engine begins to show the next world inside the ring
// 0: mirrored and seen; 1 (userData.noMirror): seen only; 2 (userData.mirrorOnly): in the mirror only
function mirrorLayers(o, flag = 0) {
  const f = o.userData.noMirror ? 1 : o.userData.mirrorOnly ? 2 : flag;
  if (f === 2) o.layers.set(1); else if (f === 0) o.layers.enable(1);
  for (const c of o.children) mirrorLayers(c, f);
}

export default {
  id: 'railway-under-the-sea', name: 'Rails at High Water', category: 'screen', placeKind: 'ocean',
  screen: 'Spirited Away', screenYear: '2001', screenKind: 'film', weirdness: 0.3, media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, hour = vary.hour || 'any';
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('railway-under-the-sea:' + name + ':' + ctx.seed));
    const path = makePath(ROUTE);
    const eye = new THREE.Vector3(), eyeW = new THREE.Vector3();
    const uAtZ = (z) => { let a = 0, b = 1; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (path.pointAt(m, eye).z > z) a = m; else b = m; } return (a + b) / 2; };

    // ---- three skies, one cloud pattern (the same layer seeds), cross-faded by place: a North Sea summer day; the
    // late light (a pale silver sun behind a high veil of ice cloud: no orange sky, no burning disc); a short
    // grey-blue dusk with one thin straw-pale band where the sun went down (no pink cloud)
    const cloudSheet = { coverage: 0.45, scale: 0.72, softness: 0.64, detail: 0.3, haze: 0.14, seed: 23 };     // a few broad, soft banks of fair-weather cloud (little edge erosion: no stray flecks)
    const cirrus = { stretch: 1, coverage: 0.42, opacity: 0.22, seed: 12 };
    const common = { bake: true, renderer: ctx.renderer, clouds: cloudSheet, clouds2: cirrus };
    const LATE = { elevation: 10.5, azimuth: 0 };                                                         // the late sun stands over the end of the line
    const dayOpts = hour === 'golden' ? { preset: 'day', sunElevation: 21, sunAzimuth: -52, zenith: '#27589c', mid: '#6c99c6', horizon: '#d6ddd6' }
      : { preset: 'day', sunElevation: 34, sunAzimuth: -70, zenith: '#184da6', mid: '#4d8cd6', horizon: '#b3d1ea' };
    const skyA = makeSky(Object.assign({ rng: stream('sky a') }, common, dayOpts));
    await ctx.yield();
    const skyB = makeSky(Object.assign({ rng: stream('sky b') }, common, { preset: 'day', sunElevation: LATE.elevation, sunAzimuth: LATE.azimuth, transparent: true,
      zenith: '#3b4d63', mid: '#6f8296', horizon: '#bcc7ca', ground: '#76828a', horizonPow: 3.2,
      scatterColor: '#fff5e4', scatter: 0.36, scatterPow: 10, scatterHigh: 0.05,
      sunColor: '#fff6e6', sunSize: 1.6, sunIntensity: 9, sunGlow: 0.6, sunGlowTight: 0.45, veil: 0.7,
      clouds: Object.assign({}, cloudSheet, { lit: '#e3e4e0', shade: '#566270', silver: 1.9 }),
      clouds2: { stretch: 0.45, coverage: 0.78, softness: 0.5, opacity: 0.38, lit: '#e2e6e9', shade: '#8492a0', seed: 12 },   // the high veil
      lightColor: '#fff1dc', lightIntensity: 2.0, ambientColor: '#aab8c8', groundLight: '#7a8284', ambientIntensity: 1.5 }));
    await ctx.yield();
    const skyC = makeSky(Object.assign({ rng: stream('sky c') }, common, { preset: 'blueHour', sunAzimuth: LATE.azimuth, transparent: true, bodies: [], milkyWay: 0, stars: hour === 'night' ? 0.4 : 0,
      zenith: '#1e2c40', mid: '#435b74', horizon: '#8ea2ac', ground: '#18222e', horizonPow: 3.2,
      scatterColor: '#e8e2bc', scatter: 0.6, scatterPow: 5, scatterHigh: 0, scatterFall: 12, sunColor: '#efe6c8', sunGlow: 0.15,
      clouds: Object.assign({}, cloudSheet, { lit: '#7c8c9c', shade: '#28333f', silver: 0.4 }),
      clouds2: Object.assign({}, cirrus, { opacity: 0.07 }),                                              // the high streaks all but gone in the dusk
      lightColor: '#a3b4c8', lightIntensity: 1.1, ambientColor: '#607a92', groundLight: '#2a3440', ambientIntensity: 2.2 }));
    await ctx.yield();
    for (const s of [skyA, skyB, skyC]) { scene.add(s.object); s.object.traverse((o) => o.layers.enable(1)); }
    skyB.setOpacity(1); const lateSun = skyB.uniforms.uSun.value.y;                                       // the late sun's disc at full strength, read once
    skyB.setOpacity(0); skyC.setOpacity(0);
    scene.fog = new THREE.FogExp2(skyA.fogColor.clone(), FOG);
    const rig = makeLightRig(skyA, { ambient: 1.1, bounce: 0.5 }); scene.add(rig.object); rig.object.traverse((o) => o.layers.enable(1));
    // ---- the late sun's halo (a real ice halo in the high veil: a ring 22 degrees from the sun, a mock sun on either
    // side, a faint pillar of light). A sky thing: drawn round the rendering camera like the domes. It is NOT on the
    // mirror's layer: the sea doubles the veiled sun and its glitter only, no halo (the owner's stand-clear: no sky
    // spectacle in the mirror). Its strength is the late light's share by place.
    const HALO_D = 3000, haloU = { uSunDir: { value: skyB.sunDirection.clone().normalize() }, uStrength: { value: 0 } };
    const haloMat = new THREE.ShaderMaterial({
      uniforms: haloU, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunDir; uniform float uStrength; varying vec3 vW;
        void main(){
          vec3 d = normalize(vW - cameraPosition);
          float th = degrees(acos(clamp(dot(d, uSunDir), -1., 1.)));
          float el = degrees(asin(clamp(d.y, -1., 1.))), elS = degrees(asin(clamp(uSunDir.y, -1., 1.)));
          vec2 sh = normalize(uSunDir.xz), dh = normalize(d.xz + vec2(1e-5));
          float az = degrees(atan(dh.x*sh.y - dh.y*sh.x, dot(dh, sh)));                 // degrees round the horizon from the sun's place
          float ring = smoothstep(21.0, 22.0, th) * exp(-max(th - 22.0, 0.) / 2.4);
          vec3 ringC = mix(vec3(1.0, 0.80, 0.66), vec3(0.90, 0.95, 1.0), smoothstep(21.6, 23.6, th));
          float de = (el - elS) / 1.1, daz = abs(az) - 22.7;
          float dog = exp(-daz*daz / (daz < 0. ? 0.6 : 9.0)) * exp(-de*de);              // the two mock suns, each with a tail away from the sun
          vec3 dogC = mix(vec3(1.0, 0.78, 0.6), vec3(0.95, 0.97, 1.0), smoothstep(-0.6, 2.5, daz));
          float pillar = exp(-az*az / 1.6) * exp(-abs(el - elS) / 6.5);
          float dt = (th - 22.2) / 1.3, top = exp(-dt*dt) * exp(-az*az / 40.) * step(elS, el);
          vec3 c = ringC*ring*0.26 + dogC*dog*0.8 + vec3(1.0, 0.98, 0.94)*(pillar*0.14 + top*0.24);
          gl_FragColor = vec4(c * uStrength * smoothstep(0.0, 2.5, el), 1.0);             // lost in the haze at the horizon
        }`,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), haloMat);
    halo.frustumCulled = false; halo.renderOrder = -0.4; halo.scale.setScalar(HALO_D * 0.68); scene.add(halo);
    // ---- the sea, the bed and the parts
    const sea = await buildSea(ctx, { fogDensity: FOG, ringColor: '#ffe2b0' });
    const track = await buildTrack(ctx, { path }); await ctx.yield();
    const car = await buildRailcar(ctx, { path }); await ctx.yield();
    const works = await buildWorks(ctx, { path }); await ctx.yield();
    const isles = await buildIslands(ctx, { path }); await ctx.yield();
    const parts = [sea, track, car, works, isles];
    for (const p of parts) { scene.add(p.object); mirrorLayers(p.object); }

    // ---- light on the water by sky: the bed's light, the water's body, the riffle's tint (blended by place)
    const tone = (sky, body) => ({ body: new THREE.Color(body), riffle: sky.horizonColor.clone().lerp(sky.zenithColor, 0.35), fog: sky.fogColor.clone() });
    const toneA = tone(skyA, '#2a8a8a'), toneB = tone(skyB, '#5d6f72'), toneC = tone(skyC, '#16303c');
    const lit = { bed: new THREE.Color(), body: new THREE.Color(), riffle: new THREE.Color(), fog: new THREE.Color(), calm: 1, ring: 0.55 }, hemiC = new THREE.Color();
    const blend = (a, b, t) => {
      lit.body.lerpColors(a.body, b.body, t); lit.riffle.lerpColors(a.riffle, b.riffle, t); lit.fog.lerpColors(a.fog, b.fog, t);
      // the bed takes the rig's light as a level surface of a standard material does (sun by its height, sky light, over pi)
      lit.bed.copy(rig.sun.color).multiplyScalar(rig.sun.intensity * Math.max(rig.direction.y, 0)).add(hemiC.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity)).multiplyScalar(1 / Math.PI);
    };

    // ---- looks (gaze pulls), opened and closed by places of the law; each target is computed from u in its own function
    const carAt = new THREE.Vector3(), tmp = new THREE.Vector3();
    const mound = beside(HALLIG.warft.z, HALLIG.warft.off), bake = beside(BEACON.z, BEACON.off), zStand = CAR.noseStop + CAR.length / 2;
    const pois = [
      // the railcar while it draws past and settles ahead: from the entry to where the lens swings onto the line
      { at: (time, u) => { const zc = noseZ(path.pointAt(u, tmp).z) + CAR.length / 2; return carAt.set(lineX(zc), 1.9, zc); }, from: 0, to: uAtZ(WAY.join), weight: 0.6, fade: 0.004 },
      // the refuge beacon: from where the lens leaves the rails until it is abeam
      { at: [bake[0], 6, bake[1]], from: uAtZ(WAY.leave), to: uAtZ(BEACON.z), weight: 0.4 },
      // the dwelling mound of the marsh island: from the island's near end until the mound's far edge is abeam
      { at: [mound[0], 5, mound[1]], from: uAtZ(HALLIG.z0), to: uAtZ(HALLIG.warft.z - HALLIG.warft.radius), weight: 0.55 },
      // the railcar standing at the halt (its middle): from the last way mark to the halt's near end
      { at: [lineX(zStand), 1.9, zStand], from: uAtZ(PRICKEN.z1), to: uAtZ(HALT.z0), weight: 0.45 },
    ];

    // ---- birds (real sea birds of the flats); on the mirror's layer too
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1)) * Math.min(1, Math.max(0.5, (ctx.quality && ctx.quality.detail) || 1));   // fewer birds on a phone
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    // oystercatchers of the flats (black above, white below, an orange bill): two parties wheel low, free on the
    // world clock, each inside its own bounds and well off the line and the railcar: one over the first stake field
    // west of the line, one over the island's far shore. Their courses, spreads and wander are bounded here:
    // the farthest bird of a party is 57 m from its centre, the centres stand 75 m and 84 m west of the line.
    const pied = { species: 'gulls', maxSigma: 2.5, size: 0.8, radius: 34, height: 0.8, wobble: 0.15, spread: [12, 2, 16], wander: [3, 0.8, 3, 0.35],
      body: '#1d2024', belly: '#ecebe6', wingC: '#23262b', tip: '#101214', head: '#16181b', tailC: '#e6e5e0', beak: '#e8632a', legC: '#d88a78', keepClear: { path, dist: 5 } };
    const fieldAt = beside(WAY.close - 35, -75), shoreAt = beside(HALLIG.z1 + 60, HALLIG.shoreOff - 60);
    fauna.add(F.makeFlock(Object.assign({ rng: stream('pied'), count: Math.round(24 * dens), center: [fieldAt[0], 5, fieldAt[1]] }, pied)));
    fauna.add(F.makeFlock(Object.assign({ rng: stream('pied b'), count: Math.round(16 * dens), center: [shoreAt[0], 6.5, shoreAt[1]] }, pied)));
    // a skein of geese: the kit's crossing flock (keyed to u by the kit; declared at the head). By place: they cross
    // 36 m over the line, GEESE_AHEAD metres ahead of the lens, when the lens is 20 m more than that from the ring.
    const GEESE_AHEAD = 190;
    fauna.add(F.makeFlock({ rng: stream('geese'), species: 'geese', count: Math.round(13 * dens), maxSigma: 2.5, keepClear: { path, dist: 8 },
      cross: { path, u: uAtZ(RING.z + GEESE_AHEAD + 20), lead: GEESE_AHEAD, span: 720, angle: 52, side: 1, height: 36, duration: 50 } }));
    // grey herons standing in the shallows beside the line (dark against the bright water). A RULE OF THE PLACE,
    // dealt from one seeded stream: parties of one to three every 55 to 115 m along the line, from past the entry
    // to 60 m before the ring; each party on one side of the line (west more often), in the clear strip between
    // the ballast bank and the stake fields (7 to 17 m west of the line; 9.5 to 12.5 m east of it, beyond the way
    // marks). A stand is left empty where it would be nearer than 6.5 m to the route, by the halt and its walk, or
    // in the tidal channel. Every die is thrown before any test.
    const heron = { species: 'heron', level: 0, depth: 0.42, blobShadow: false, size: 1.35,
      body: '#5a6672', belly: '#aab2b8', wing: '#3d4650', neckC: '#c3c9cd', cap: '#17191d', beakC: '#d9a53c', legC: '#3b3a33' };
    const stands = [];
    { const r = stream('herons');
      for (let z = -15 - 30 * r(), guard = 0; z > RING.z + 60 && guard < 40; guard++) {
        const n = 1 + Math.floor(r() * 2.6), west = r() < 0.7, base = r(), gap = 55 + 60 * r();
        for (let k = 0; k < 3; k++) {
          const dz = k * (5 + 4 * r()), jit = r() - 0.5;
          if (k >= n) continue;
          const zz = z - dz, off = west ? -(7 + 8 * base + 2 * (jit + 0.5)) : 9.5 + 2 * base + (jit + 0.5);
          const [x, zq] = beside(zz, off);
          const byHalt = !west && zz < HALT.z0 + 15 && zz > HALT.z1 - 15;
          const inChannel = Math.abs(zz - channelZ(off)) < 6;
          if (byHalt || inChannel || path.nearestXZ(x, zq).dist < 6.5) continue;
          stands.push([x, 0, zq]);
        }
        z -= gap;
      }
    }
    if (stands.length) fauna.add(F.makeWaders(Object.assign({ rng: stream('herons a'), positions: stands }, heron)));
    if (vary.rare) { const [mx, mz] = beside(WAY.leave, -280);                       // far out over the west flats, where the channel runs
      fauna.add(F.makeFlock({ rng: stream('waders'), species: 'starlings', count: Math.round(1800 * dens), center: [mx, 30, mz], radius: 150, maxSigma: 2.5, keepClear: { path, dist: 10 },
        body: '#8a8073', belly: '#ece8e0', wingC: '#6c645a' })); }
    for (const it of fauna.items) it.f.object.traverse((o) => o.layers.enable(1));
    await ctx.yield();

    for (const s of [skyA, skyB, skyC]) await s.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: 50, pois,
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 34, nearThrough: 0.3 },
      portal: { shape: 'circle', radius: RING.radius, color: '#ffe2b0', glow: 1, revealDistance: REVEAL },
      post: { exposure: 0.95, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.18, contrast: 1.1, vignette: 0.28, grain: 0.02 } },
      update(dt, time, camera, u) {
        const ez = path.pointAt(u, eye).z, h = hours(ez);
        skyB.setOpacity(h.gold); skyC.setOpacity(h.dusk);
        const sunOut = Math.max(0, 1 - 2.4 * h.dusk);                              // the late sun is gone early in the dusk
        skyB.uniforms.uSun.value.y = lateSun * h.gold * h.gold * sunOut * sunOut;  // SET from the place (the kit's fade times the dusk's share), never carried from frame to frame
        haloU.uStrength.value = h.gold * sunOut * sunOut;
        camera.getWorldPosition(eyeW); halo.position.copy(eyeW).addScaledVector(haloU.uSunDir.value, HALO_D); halo.lookAt(eyeW);
        if (h.dusk > 0) { rig.match(skyB, skyC, h.dusk); blend(toneB, toneC, h.dusk); }
        else { rig.match(skyA, skyB, h.gold); blend(toneA, toneB, h.gold); }
        scene.fog.color.copy(lit.fog);
        skyA.update(dt, time, camera); skyB.update(dt, time, camera); skyC.update(dt, time, camera);
        rig.update(dt, time, camera);
        const nz = noseZ(ez);
        car.place(nz);
        sea.setLight(lit); sea.update(time, nz, noseRate(ez));
        track.setNight(h.lamps); car.setNight(h.lamps); works.setNight(h.lamps); isles.setNight(h.lamps);
        fauna.setLight(F.lightFrom(scene)); fauna.update(dt, time, camera, u);
      },
      dispose() {
        skyA.dispose(); skyB.dispose(); skyC.dispose(); halo.geometry.dispose(); haloMat.dispose(); for (const p of parts) if (p.dispose) p.dispose();
        for (const it of fauna.items) { const f = it.f || it; if (f.geometry) f.geometry.dispose(); if (f.material && f.material.dispose) f.material.dispose(); }
      },
    };
  },
};
