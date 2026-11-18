// Ten Times Faster Every Two Seconds.
// The place holds still and the route is the rate of time. With t = 45u seconds the world's clock runs at 10^(t/2 - 3)
// times real speed: you enter beside a kingfisher hung in the air at a thousandth of real speed, a wave breaks at the
// speed of a wave at second 6, and then every two seconds a slower layer of one unmoving beach starts to flow (surf, cloud
// shadow, tide, day, moon, year, dunes, river, ice, shoreline, the range itself) while everything faster is replaced by
// its own true time average: the sun becomes a gold band. At u = 0.9082, 7.5 billion years on, the law is switched off
// and the last four seconds pass at real speed under a still red sun. Only the ring and its black stack do not age.
// The device (clock, land, sea, sky, the first six seconds' cast) is ../parts/tenfold-every-two-seconds.js.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildTenfold, U_STOP } from '../parts/tenfold-every-two-seconds.js';

export default {
  id: 'tenfold-every-two-seconds',
  name: 'Ten Times Faster Every Two Seconds',
  category: 'wilderness',
  weirdness: 0.75,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {};
    // three looks by seed: (0) evening coast, sea on the left; (1) the mirrored coast, sea on the right, the band standing
    // out of the horizon on the right; (2) a desert coast at latitude 28: a steeper band, no forest, no ice sheet (its rung
    // is the sea going to the horizon). The rare visit builds a volcanic island in the shoreline's rung.
    const vr = ctx.rng.fork ? ctx.rng.fork('variation') : ctx.rng;
    const variant = Math.floor(vr() * 3) % 3;
    const mirror = variant === 1;
    const opts = { mirror, lat: variant === 2 ? 28 : 45, forest: variant !== 2, noIce: variant === 2, snowBase: variant === 2 ? 1900 : 1500, rare: !!vary.rare, detail: (ctx.quality && ctx.quality.detail) || 1 };
    const mz = mirror ? -1 : 1;
    const tall = !!(ctx.aspect && ctx.aspect < 1);      // an upright phone: keep the gaze nearer the heading, so the ring and the band's edge stay in a narrow frame

    // The route: straight in plan. It starts low beside the bird and the standing breaker (eye level with the crest), and
    // is at 37 m by x = 150, so that cloud shadow, tide, dunes, ice and the range are looked DOWN on and ACROSS at.
    const path = makePath([[0, 3.0, 0], [30, 3.0, 0], [58, 4.2, 0], [84, 10, 0], [112, 23, 0], [142, 34, 0], [178, 39.3, 0], [230, 40, 0], [300, 40, 0], [390, 40, 0], [450, 40, 0]]);
    await ctx.yield();

    const dev = await buildTenfold(ctx, opts);
    dev.group.scale.z = mz;                     // ordinary meshes are mirrored by the group; the device's own shaders mirror themselves
    scene.add(dev.group);
    await ctx.yield();

    // one directional key (the sun, then the band's high point, then the red disc) and one hemisphere fill; never switched
    const key = new THREE.DirectionalLight(0xffffff, 1);
    const hemi = new THREE.HemisphereLight(0x9db6d6, 0x6b5a45, 0.55);
    scene.add(key, key.target, hemi);
    scene.fog = new THREE.FogExp2(0xc9b89a, 0.0006);
    scene.background = new THREE.Color(0x000000);

    let lastU = -1, lastTime = 0, hold = 0;
    const tmp = new THREE.Vector3();
    const gazeAt = (az, alt) => (time, u) => {
      path.pointAt(u, tmp);
      const a = az * Math.PI / 180, e = alt * Math.PI / 180;
      return tmp.set(tmp.x + 600 * Math.cos(e) * Math.cos(a), tmp.y + 600 * Math.sin(e), tmp.z - mz * 600 * Math.cos(e) * Math.sin(a));
    };

    const update = (dt, time, camera, u) => {
      // The law is a function of u alone. Only when the camera is held perfectly still (a paused or test view) does the
      // world go on by itself, at whatever rate the law gives for that place on the path.
      // ("held" = moving at under a twentieth of the flight's speed; in the flight itself hold is always 0.)
      const dT = time - lastTime, du = Math.abs(u - lastU);
      if (u > 0 && dT > 0 && dT < 4 && du < 0.05 * dT / 45) hold = Math.min(hold + dT, 6);
      else if (du > 1e-9 || dT < 0 || dT >= 4) hold = 0;
      lastU = u; lastTime = time;
      const stopped = u >= U_STOP;
      const s = dev.update(stopped ? 45 * u : Math.min(45 * u + hold, 45 * U_STOP - 1e-4), stopped ? (u - U_STOP) * 45 + hold : 0, camera, ctx.renderer);
      key.position.set(s.keyDir.x * 1000, s.keyDir.y * 1000, s.keyDir.z * 1000 * mz); key.target.position.set(0, 0, 0);
      key.color.copy(s.keyColor); key.intensity = s.keyIntensity;
      hemi.color.copy(s.hemiSky); hemi.groundColor.copy(s.hemiGnd); hemi.intensity = s.hemiIntensity;
      scene.fog.color.copy(s.fog);
    };

    return {
      scene, path,
      duration: 45,
      pace: () => 1,
      title: 'Ten Times Faster Every Two Seconds',
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 30, sway: 0.3, bank: 0, nearThrough: 0.3 },
      pois: [
        // each rung's traveller is where the eye is sent while it travels; the ring stays in frame throughout
        { at: (time, u) => { path.pointAt(u, tmp); return tmp.set(tmp.x + 95, -4, mz * 30); }, from: 0.125, to: 0.33, weight: 0.62 },   // down at the beach: surf, cloud shadows, the tide's edge
        { at: gazeAt(15, 14), from: 0.36, to: 0.48, weight: 0.5 },        // the arcs, then the band
        { at: (time, u) => { path.pointAt(u, tmp); return tmp.set(tmp.x + 200, -6, mz * (tall ? 25 : 85)); }, from: 0.47, to: 0.63, weight: 0.55 },   // dunes marching, the river mouth
        { at: gazeAt(tall ? -14 : -56, 9), from: 0.63, to: 0.715, weight: 0.5, fade: 0.2 },   // the ice wall coming down on the land side: the eye well inland, the bared sea bed and the stack on the sea-side third
        // the rare visit: the island being built, out on the sea side in front of the band's foot
        ...(opts.rare ? [{ at: () => tmp.set(1000, 120, -390 * mz), from: 0.69, to: 0.765, weight: 0.5, fade: 0.2 }] : []),
        { at: gazeAt(tall ? -18 : -46, 13), from: opts.rare ? 0.765 : 0.72, to: 0.87, weight: 0.5, fade: 0.2 },    // the range across the bay: the eye well inland and up, the ring and the band's foot kept at the sea-side third
        // the sea falling away to salt: the eye goes out and down over the bared bed and its brine pools, under the band's foot
        { at: gazeAt(tall ? 12 : 30, -6), from: 0.868, to: 0.905, weight: 0.5, fade: 0.3 },
        { at: gazeAt(30, 10), from: 0.9, to: 0.97, weight: 0.5 },         // the disc
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffd9a0', glow: 0.7, revealDistance: 420 },
      post: { exposure: 1, bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, vignette: 0.25, grain: 0.012 } },
      update,
      dispose() {},
    };
  },
};
