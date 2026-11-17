// What the Frog's Eye Tells the Frog. A frog sees only what moves across its eye. We skim a pond (it streams by, so it
// is there), stop on a mud spit (so the whole pond drains to one pale field), learn the rule from a gust, a damselfly
// and a fly, are stalked by a heron seen only while it steps, and jump: the whole morning arrives at once with the
// bird standing over the spot we left. The rule lives in src/parts/what-the-frog-sees.js; this file is the flight.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildFrogEye, flightPoints } from '../parts/what-the-frog-sees.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// the flight's pace: fast over the pond, down to the engine's floor for the sit (the pond then rides with us), fast again
const pace = (u) => 0.35 + 1.35 * (1 - sstep(0.24, 0.272, u)) + 1.35 * sstep(0.467, 0.5, u);

export default {
  id: 'what-the-frog-sees',
  name: "What the Frog's Eye Tells the Frog",
  category: 'wilderness',
  weirdness: 0.6,
  media: ['tiny', 'water', 'open'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const seed = Math.abs(Math.floor(Number(ctx.seed) || 0));
    const vary = ctx.vary || {}, hour = vary.hour || 'any';
    // A grey heron in early gold, B great egret under thin overcast (mirrored), C purple heron at evening; the viewer's hour wins
    const variant = hour === 'golden' ? 2 : hour === 'dawn' ? 0 : [0, 0, 0, 1, 1, 2, 2, 2][seed % 8];
    const detail = ctx.quality ? (ctx.quality.detail || 1) : 1;   // phones: fewer reeds, far seeds and drops; never the heron or the lessons
    const mir = variant === 1 ? -1 : 1;
    const rare = !!vary.rare, density = vary.density || 1;

    // ---- the path (world space; the pond group rides -59.4 m along z during the sit)
    // the line itself (the swing in, the sit, the jump and its long falling hook) is set out in the part file: flightPoints()
    const pts = flightPoints();
    for (const q of pts) q[0] *= mir;
    const path = makePath(pts);
    const duration = 43;
    await ctx.yield();

    const eye = await buildFrogEye(ctx, { scene, path, pace, duration, variant, mir, rare, detail, density });

    return {
      scene, path, duration, pace,
      title: variant === 1 ? "What the Frog's Eye Tells the Frog: Egret" : variant === 2 ? "What the Frog's Eye Tells the Frog: Evening" : "What the Frog's Eye Tells the Frog",
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 3, sway: 0, bank: 0 },
      pois: [],
      portal: { shape: 'circle', radius: 5, tilt: true, style: 'ring', halo: false, color: '#1E3A34', glow: 1.5, revealDistance: 120 },
      post: { exposure: 1.0, bloom: { strength: 0.22, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.05, contrast: 1.03, vignette: 0.10, grain: 0.03 } },
      update(dt, time, camera, u) { eye.update(dt, time, camera, u); },
      dispose() { eye.dispose(); },
    };
  },
};
