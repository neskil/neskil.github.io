// hall-roofed-with-weather: THE AIR of the hall (the air builder's part). It puts together the candles on their
// tracks, the cloud that is the roof, the storm that crosses it and the hearth's sparks and smoke, and moves seven
// of the rig's eight lights with them (the hearth's stands where the world put it). Each piece is its own file
// beside this one.
//
// buildAir(ctx, o), o = { path, S (the world's named streams), dealt { hour, rare, density, detail }, weather (the
// storm's timetable: front(u), back(u), at(x, u)), haze (the air's colour), fogDensity (the room's), gold (the rig's
// sixteen places of candle light, filled here), leg { length, ring } (the last leg's length and the ring's radius:
// the cloud's hollow is cut to them), ground (the hall's object as built: what a drop of wax lands on), lights
// { high[3], low[3], cold } (the rig's, moved here) } ->
// { object, update(dt, time, camera, u), flash { k, x, z }, clear, counts, triangles, drawCalls, dispose() }
import * as THREE from 'three';
import { HEARTH } from './hall-roofed-with-weather-plan.js';
import { buildCandles, surveyGround, LOW } from './hall-roofed-with-weather-air-candles.js';
import { buildCloud } from './hall-roofed-with-weather-air-cloud.js';
import { makeLightning, makeRain, makeCrawlers } from './hall-roofed-with-weather-air-storm.js';
import * as fx from '../kit/fx.js';

const lerp = (a, b, t) => a + (b - a) * t, TAU = Math.PI * 2;

export async function buildAir(ctx, o) {
  const object = new THREE.Group(); object.name = 'hall-air';
  const L = o.lights, W = o.weather, fogDensity = o.fogDensity;
  const flash = { k: 0, x: 0, z: -60 };

  // ---- the candles (the subject); first, what stands under them, for their falling wax
  const ground = await surveyGround(ctx, o.ground);
  const candles = await buildCandles(ctx, { path: o.path, S: o.S, dealt: o.dealt, haze: o.haze, fogDensity, bandAt: W.at, landAt: ground.at });
  object.add(candles.object);
  await ctx.yield();

  // ---- the cloud that is the roof
  const cloud = await buildCloud(ctx, { S: o.S, dealt: o.dealt, leg: o.leg });
  object.add(cloud.object);
  const CU = cloud.uniforms;
  await ctx.yield();

  // ---- the storm: the sheet lightning's patches (their cold light on the room is the rig's eighth light, the last made)
  const bolts = makeLightning(o.S.bolts, W);
  const COLD = 3.8;
  // its rain that never lands: shafts and curtains of the hour's cloud colour, gold where the candle streams are
  // thick: sixteen of their clumps. Two of the sixteen are the low stream's; the other fourteen are taken evenly
  // from the oval tracks' clumps, the lowest tracks first. (The same sixteen are handed to the hall through the
  // rig, as rig.gold, for the floor's pools of candle light.) The rain takes the room's own air.
  const uGold = o.gold;
  const lowG = candles.lows, restG = candles.glows.slice().reverse();
  const golds = lowG.concat(Array.from({ length: 16 - lowG.length }, (_, i) => restG[Math.floor(i * restG.length / (16 - lowG.length))]));
  const rain = makeRain({ rng: o.S.rain, detail: o.dealt.detail, air: { color: o.haze, density: fogDensity }, tN: CU.tN, uTime: CU.uTime, uMargin: CU.uMargin, uBand: CU.uBand, uVault: CU.uVault,
    uFlash: CU.uFlash, uSlate: CU.uSlate, uPx: candles.uniforms.uPx, uGold });
  object.add(rain.veil, rain.mesh);
  await ctx.yield();
  // and its crawlers under the cloud's skin, from a stream of their own (the great one only in the rare look)
  const crawl = makeCrawlers({ rng: o.S.crawlers, rare: o.dealt.rare, weather: W, air: { density: fogDensity }, tN: CU.tN, uTime: CU.uTime, uMargin: CU.uMargin, uBand: CU.uBand, uVault: CU.uVault });
  object.add(crawl.mesh);
  await ctx.yield();

  // ---- the hearth's sparks and its thin smoke: straight up from the fire, leaning a little toward +x with the
  // room's draught (so the smoke stands clear of the last leg, which climbs over the fire), into the hollow
  const sparks = fx.makeParticles({ rng: o.S.sparks, preset: 'embers', time: CU.uTime, follow: false, center: [HEARTH.x + 1, 29.5, HEARTH.z + 0.3], box: [7, 46, 7], count: Math.round(380 * Math.min(1, o.dealt.detail)) });
  await ctx.yield();
  const smoke = fx.makeSmokeColumn({ rng: o.S.smoke, time: CU.uTime, position: [HEARTH.x + 0.4, 5.5, HEARTH.z], height: 52, radius: [0.7, 4.2], size: [2.2, 8], count: 70,
    color: '#3d3a4a', colorTop: '#5a586e', shadowColor: '#1c1a26', ambient: '#0d0c14', hot: '#ff6a1c', hotFalloff: 16, opacity: 0.34, rate: 0.05, wind: [1, 0, 0.12], bend: 0.36 });
  object.add(sparks.object, smoke.object);
  await ctx.yield();

  // the warm lights' strength: the three that go round with the leading stream's clumps, and the three that stand
  // along the low stream's middle and drift a little with it
  const HIGH = 3.6, LOWS = 3.4, lowZ = [LOW.z + LOW.az * 0.66, LOW.z, LOW.z - LOW.az * 0.66];
  // each low light's slow drift: a phase and a rate for each of its three ways (across, up, along), dealt once from
  // the stream named 'lights' (the rates a little either side of 0.21, 0.17 and 0.13 a second)
  const R = o.S.lights, drift = [0, 1, 2].map(() => ({ px: R() * TAU, py: R() * TAU, pz: R() * TAU, rx: 0.21 * R.range(0.85, 1.15), ry: 0.17 * R.range(0.85, 1.15), rz: 0.13 * R.range(0.85, 1.15) }));
  function update(dt, time, camera, u) {
    candles.uniforms.uBand.value.set(W.front(u), W.back(u));
    candles.update(dt, time, u, camera, ctx.renderer);
    CU.uBand.value.set(W.front(u), W.back(u)); cloud.update(dt, time, u, camera);
    for (let i = 0; i < 12; i++) { const g = candles.glows[i]; if (g) CU.uGlow.value[i].set(g.x, g.y, g.z, 1); else CU.uGlow.value[i].w = 0; }
    bolts.update(time, u); crawl.update(time, u);
    for (let i = 0; i < 16; i++) { const g = golds[i]; if (g) uGold.value[i].set(g.x, g.y, g.z, 1); }
    if (sparks.update) sparks.update(dt, time, camera); if (smoke.update) smoke.update(dt, time, camera);
    for (let i = 0; i < 3; i++) { const fl = bolts.flashes[i]; CU.uFlash.value[i].set(fl.x, fl.z, 1 / (fl.r * fl.r), fl.k); }
    const all = bolts.sum + 0.8 * crawl.sum, wc = 0.8 * crawl.sum / Math.max(1e-4, all);
    flash.k = Math.min(0.3, all * 0.2); flash.x = lerp(bolts.x, crawl.x, wc); flash.z = lerp(bolts.z, crawl.z, wc);
    L.cold.position.set(flash.x, 40, flash.z); L.cold.intensity = COLD * Math.min(1.6, all);
    candles.uniforms.uFlash.value = Math.min(1.5, all);
    // the rig's warm lights go with the streams: the glow on stone, table and floor goes round with the candles
    for (let i = 0; i < 3; i++) {
      const g = candles.riders[i]; L.high[i].position.set(g.x * 0.9, lerp(g.y, 25, 0.5), g.z); L.high[i].intensity = HIGH;
      const d = drift[i];
      L.low[i].position.set(LOW.x + 1.3 * Math.sin(time * d.rx + d.px), LOW.floor + 0.8 + 0.4 * Math.sin(time * d.ry + d.py), lowZ[i] + 5 * Math.sin(time * d.rz + d.pz)); L.low[i].intensity = LOWS;
    }
  }
  return {
    object, flash, clear: candles.clear, counts: { candles: candles.n, tracks: candles.tracks.length },
    triangles: candles.triangles + cloud.triangles + rain.triangles + crawl.triangles + 380 * 2 + 70 * 2, drawCalls: candles.drawCalls + cloud.drawCalls + rain.drawCalls + crawl.drawCalls + 2,
    update,
    // (the candles' three meshes are freed here; the kit's sparks and smoke have no dispose of their own)
    dispose() { cloud.dispose(); rain.dispose(); crawl.dispose(); candles.object.traverse((x) => { if (x.isMesh) { x.geometry.dispose(); x.material.dispose(); } }); },
  };
}
