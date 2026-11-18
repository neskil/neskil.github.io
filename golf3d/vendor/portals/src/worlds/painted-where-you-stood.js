// Painted Where You Stood (new-ideas crew).
// The most ordinary valley in the collection, flown into with working parallax, stops being solved at station S and is
// paint lying over the floor, wall and pier of a white hall, its exit ring included. The real way out is found in
// pieces through five cut walls that join into one disc at station L. The device is in ../parts/painted-where-you-stood.js.
import * as THREE from 'three';
import { makePath, smoothstep } from '../kit/core.js';
import { buildDevice, GEO } from '../parts/painted-where-you-stood.js';

// (1) the lie: always the most typical picture going
const LIES = {
  alpine: {
    title: 'Painted Where You Stood',
    meadow: '#4E8A4A', meadow2: '#6FA255', bank: '#8C8F6A', rock: '#6E7C8C', rockDark: '#4A5766', tree: '#2F4A36', tree2: '#38573C',
    river: '#9CC3CF', sky: '#8FB7D9', skyTop: '#4F86C2', haze: '#C7D9E4', cloud: '#FFFFFF', sunCol: '#FFF4E0', fill: '#8FB7D9', shadow: '#35544A',
    sunDir: [-0.36, 0.80, 0.48], sunPower: 2.25, fillPower: 0.40, hazeK: 0.00105, ring: '#BFE6DC', sea1: '#BFE6DC', sea2: '#8FB7D9', fall: '#F4FAFF', swift: '#1B2430',
    treeKind: 'fir', treeTip: '#5C8448', bark: '#4A3A2C', flower: '#F3E9B0', leafGlow: 0.05, treeScale: 1, snow: 150, treeDensity: 1, floorDark: 0.2, bounce: 0.10,
  },
  birch: {      // a birch gorge in October at four in the afternoon, the ring above a weir
    title: 'Painted Where You Stood',
    meadow: '#96883C', meadow2: '#B88430', bank: '#7C7458', rock: '#857C74', rockDark: '#5A534F', tree: '#B98A22', tree2: '#D2A838',
    river: '#8FB3C2', sky: '#9DBBD6', skyTop: '#5B87BE', haze: '#D9D6CC', cloud: '#FFF6E8', sunCol: '#FFDCA8', fill: '#9DB4D0', shadow: '#4A4660',
    sunDir: [-0.42, 0.68, 0.60], sunPower: 2.2, fillPower: 0.38, hazeK: 0.00115, ring: '#BFE6DC', sea1: '#BFE6DC', sea2: '#8FB7D9', fall: '#F6F4EC', swift: '#221E22',
    treeKind: 'birch', treeTip: '#F0DC7C', bark: '#E2DCCE', flower: '#C8562A', leafGlow: 0.14, treeScale: 0.95, treeDensity: 0.7,
    rust: '#B4552A', green: '#93A040', treeShadow: 0.35, leafFall: 620, boulders: 24, headRock: 0.7,
  },
  canyon: {     // a red canyon at sunrise with a dry fall of sand
    title: 'Painted Where You Stood',
    meadow: '#B98A5A', meadow2: '#A8774A', bank: '#C9A27A', rock: '#B5583A', rockDark: '#7E3626', tree: '#4E5A34', tree2: '#6A6E3C',
    river: '#A9C4C8', sky: '#C9B7C4', skyTop: '#6E8FC4', haze: '#EBCDB8', cloud: '#FFE3D0', sunCol: '#FFC79A', fill: '#A9A8CC', shadow: '#5A3A52',
    sunDir: [-0.36, 0.62, 0.70], sunPower: 2.5, fillPower: 0.30, hazeK: 0.0011, ring: '#BFE6DC', sea1: '#BFE6DC', sea2: '#8FB7D9', fall: '#F0D2A6', swift: '#2A1E1E',
    treeKind: 'juniper', treeTip: '#98A058', bark: '#6A4A3A', flower: '#E8D9A0', leafGlow: 0.08, treeScale: 0.55, treeDensity: 0.42,
    rust: '#6E6238', green: '#3C5236', sizeVar: 1, sage: 620, treeShadow: 0.62, boulders: 110, strata: 1, band: '#E6BE96', headRock: 1,
  },
};

export default {
  id: 'painted-where-you-stood',
  name: 'Painted Where You Stood',
  category: 'interior',
  weirdness: 0.8,
  media: ['interior'],
  async build(ctx) {
    const vary = ctx.vary || {}, rng = ctx.rng, detail = ctx.quality?.detail ?? 1;      // detail thins the pines; never the device
    // every seeded choice is drawn here, first, in a fixed order
    const pick = rng(), mirror = rng() < 0.4, slantJ = [rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng()];
    const lieId = vary.hour === 'day' ? 'alpine' : vary.hour === 'golden' ? 'birch' : vary.hour === 'dawn' ? 'canyon' : pick < 0.4 ? 'alpine' : pick < 0.7 ? 'birch' : 'canyon';
    const P = LIES[lieId], mx = mirror ? -1 : 1;
    // (3) the five slants, reseeded; wall 5 is always square
    const sg = (r) => (r < 0.5 ? -1 : 1), jit = (r) => (r - 0.5) * 10;
    const slants = [[8 * sg(slantJ[0]) + jit(slantJ[1]) * 0.3, 0], [0, -10 * sg(slantJ[2]) + jit(slantJ[3]) * 0.3], [-8 * sg(slantJ[0]) + jit(slantJ[4]) * 0.3, 0], [3 * sg(slantJ[5]) + jit(slantJ[6]) * 0.1, 9 * sg(slantJ[2])], [0, 0]];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F2EFE8').multiplyScalar(0.7);

    // arm one as before; then round the corner straight into the room of the cut walls, which now begins at the corner:
    // the row of slabs stands 90 m off, ahead on the right, the moment we are round it. A short low leg along it, closing
    // to 55 m, and one late arc (radius 26 m) onto the cone's axis at L.
    const LX = GEO.L[0];
    // the entry is high over the valley (the river and the whole trough laid out below) and comes down to skim the pines; level from 14 m before S
    // (it begins 2.5 m further on, which takes up the length the descent adds: the stop and station L keep their u exactly)
    const pts = [[0, 30, -2.5], [0, 24, -42], [0, 15.5, -90], [0, 10.4, -124], GEO.S, [3, 10, -158], [12, 10.5, -198], [30, 11.5, -258], [48, 13, -294], [78, 16, -314], [104, 16.4, -312.6], [130, 14.6, -310.6], [150, 13, -309.2],
      [LX - 13, 12.5, -305.5], [LX - 3.5, 12.8, -296], [LX - 0.4, 13.5, -287.5], GEO.L, [LX, 14, -276], [LX, 14, -258], GEO.E];
    const path = makePath(pts.map((p) => [p[0] * mx, p[1], p[2]]));
    // Act one's moments were laid out on a route of 649.8 m; K turns a u of that route into a u of this one (same place in the hall).
    const K = path.length / 649.8, N = (uo) => uo / K;
    const uS = path.nearestXZ(GEO.S[0] * mx, GEO.S[2]).u, uL = path.nearestXZ(GEO.L[0] * mx, GEO.L[2]).u;

    await ctx.yield();
    const device = await buildDevice(ctx, { P, scene, path, mirror, stopU: uS, uL, uK: K, slants, rare: !!vary.rare, density: vary.density ?? 1, detail });
    scene.add(device.root);
    await ctx.yield();

    const H = new THREE.Vector3(GEO.H[0] * mx, GEO.H[1], GEO.H[2]), E = new THREE.Vector3(GEO.E[0] * mx, GEO.E[1], GEO.E[2]);
    // pace: unhurried in the valley, slow through the turn, a held look at the bent ring, quick round the bare corner,
    // then slow all along the row of cut walls and through the swing onto the axis; even down the cone
    const pace = (u) => {
      let p = 1.05;
      p = p + (0.78 - p) * smoothstep(uS - 0.02, uS + 0.005, u);
      p = p + (1.0 - p) * smoothstep(uS + 0.03, uS + 0.07, u);
      p = p - 0.15 * smoothstep(N(0.33), N(0.40), u) * (1 - smoothstep(N(0.42), N(0.48), u));
      p = p + 0.45 * smoothstep(N(0.455), N(0.495), u) * (1 - smoothstep(0.545, 0.60, u));
      p = p + (0.70 - p) * smoothstep(0.565, 0.625, u);
      p = p + (0.95 - p) * smoothstep(uL + 0.005, uL + 0.06, u);
      return p;
    };
    const HOLE = new THREE.Vector3(GEO.E[0] * mx, 15, -251);      // the first hole: on the cone's axis, so at L it is also the way out

    return {
      scene, path, duration: 42, pace,
      title: P.title,
      ride: 'none', style: 'none', companion: 'none',
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 20, sway: 0.4, bank: 0.3 },
      pois: [{ at: H, from: uS + 0.005, to: N(0.375), weight: 0.55 }, { at: new THREE.Vector3(34 * mx, 15, -306), from: N(0.355), to: N(0.475), weight: 0.6 },
        { at: HOLE, from: 0.525, to: uL + 0.03, weight: 1, fade: 0.2 },      // one pull to the first hole, all along the row of cut walls
        { at: E, from: uL - 0.03, to: uL + 0.04, weight: 0.8 }],
      portal: { shape: 'circle', radius: GEO.portalR, style: 'ring', halo: false, glow: 0.05, color: '#BFE6DC', revealDistance: 330, blendDistance: 30 },
      post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.04, contrast: 1.03, vignette: 0.2, grain: 0.015 } },
      update(dt, time, camera, u) { device.update(dt, time, camera, u, ctx.renderer); },
      dispose() { device.dispose(); },
      _device: device, _uS: uS, _uL: uL, _lie: lieId, _mirror: mirror,
    };
  },
};
