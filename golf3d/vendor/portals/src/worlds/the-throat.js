// The Throat. One straight line at a ball hanging over a dusk sea. The ball is an Ellis wormhole drawn by following
// every pixel's light ray (src/parts/the-throat.js): the next world is inside it, a boat passing behind it is seen
// twice with its lamps swapped, and at the end the next world is the whole sky and this sea is one thread round it.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildThroat } from '../parts/the-throat.js';

export default {
  id: 'the-throat',
  name: 'The Throat',
  category: 'ocean',
  weirdness: 0.85,
  media: ['air', 'water'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {};
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02040a);

    // ---- variations, all from the seed ----
    // (1) hour and side: afterglow to starboard or port; 15, 25 or 40 minutes after sunset
    const side = rng.chance(0.5) ? 1 : -1;
    let hour = rng.int(0, 2);
    if (vary.hour === 'golden' || vary.hour === 'day' || vary.hour === 'dawn') hour = 0; else if (vary.hour === 'night') hour = 2;
    const HOURS = [
      { glow: [1.25, 1.0, 1.15], stars: 0.22 },    // 15 min: a broad ember, 20 stars
      { glow: [1.0, 0.55, 0.80], stars: 0.6 },     // 25 min: as written, 70 stars
      { glow: [0.42, 1.15, 0.60], stars: 1.0 },    // 40 min: a thin line going green, 160 stars
    ][hour];
    // (2) the throat: 48, 60 or 75 m; its lowest point always 10 m above the sea
    const a = rng.pick([48, 60, 75]);
    // (3) the boat's distance beyond the mouth and its course; the path's slope is set from it so that the flight's
    //     axis passes AXIS_OVER metres above the lamps where it meets the boat's track (see proto.md: dead on the
    //     lamps the red and green images fall on top of each other and the ring is yellow)
    const D = rng.pick([800, 1000, 1300]), boatSign = rng.chance(0.5) ? 1 : -1;
    const LAMP_Y = 4, AXIS_OVER = 14, LEN = 600;
    const HALF = 0.019 * (D + LEN);        // the booms: the lamps stand 13 px apart in the first frame at any distance (polish1: was 0.0155; at 640 px they fused into one two-coloured blob)
    const C = new THREE.Vector3(0, a + 10, -LEN);
    const slope = (C.y - LAMP_Y - AXIS_OVER) / D;
    const y0 = C.y + slope * LEN;
    const path = makePath([[0, y0, 0], [0, C.y + slope * 450, -150], [0, C.y + slope * 300, -300], [0, C.y + slope * 150, -450], [0, C.y, -LEN]]);
    const dir = new THREE.Vector3(0, -slope * LEN, -LEN).normalize();
    await ctx.yield();

    const portal = { shape: 'circle', radius: a, color: '#dce6ff', glow: 0, frame: 0, lens: 0, feed: true, feedScale: 1,   // (polish2) the ball shows the picture larger than the engine's own opening would (the window licence), and at the hold it fills the frame: a half-size picture was a smear there
     
      feedPose: null, feedFov: undefined, show: false, blendDistance: 25, revealDistance: 2 * LEN };
    const throat = await buildThroat(ctx, {
      C, a, dir, length: LEN, side, glow: HOURS.glow, stars: HOURS.stars * (0.8 + 0.2 * (vary.density || 1)),
      boat: { z: C.z - D, lampY: LAMP_Y, half: HALF, sweep: 0.45 * D, sign: boatSign, glare: 0.0046 },
      rare: !!vary.rare, portal, detail: ctx.quality ? ctx.quality.detail : 1,
    });
    scene.add(throat.object);
    await ctx.yield();

    // pace: slow in, quick across, then the hold (the gasp) where the ball is taller than the frame
    const ss = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const h0 = 1 - 1.9 * a / LEN, h1 = 1 - 0.9 * a / LEN;      // the hold: from 1.9 to 0.9 throat radii out (0.81 to 0.91 for the 60 m throat)
    const pace = (u) => {
      let p = 0.67;
      p += (1.4 - 0.67) * ss(0.08, 0.12, u);
      p += (0.47 - 1.4) * ss(h0 - 0.02, h0 + 0.02, u);
      p += (0.6 - 0.47) * ss(h1 - 0.02, h1 + 0.02, u);
      p += (0.47 - 0.6) * ss(0.96, 1.0, u);
      return p;
    };

    return {
      scene, path, duration: 40, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 20, sway: 0, bank: 0 },
      pois: [],
      portal,
      ride: 'none', style: 'none', companion: 'none',
      post: { exposure: 1.0, bloom: { strength: 0.35, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.0, contrast: 1.0, vignette: 0, grain: 0.015, aberration: 0 } },   // contrast 1 (the brief's 1.03 is taken about mid grey and cuts every dark of a dusk sea to nothing)
      update(dt, time, camera, u) { throat.update(dt, time, camera, u, ctx.renderer); },
      dispose() { throat.dispose(); },
    };
  },
};
