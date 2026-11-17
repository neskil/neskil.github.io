// THE LONG NECKS' FORD: a Jurassic morning from the back of a crested pterosaur. A migrating herd of sauropods
// fords a braided river across a fern prairie; we skim the ferns, stoop into the mist behind the last animals,
// weave between legs like walking columns, climb the matriarch's neck into the sun and glide to a portal framed
// by two feeding brachiosaurs with their necks crossed.
// World space = the hero's local space: the herd walks toward +Z, the morning sun stands at -X (on our right),
// the river runs toward -X, y = 0 is the deepest riverbed.
// Looks by seed (ctx.vary honoured): hour morning | dawn | golden | night, season fresh | rain | dry | flood,
// cast mixed | all-brachiosaur, crest colour and shape of the mount and its flock, herd size by density.
// Rare event: a bull diplodocid beside the column rears out of the mist mid-slalom and comes down in a splash.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, MIST_GLSL } from '../parts/sauropod-ford.js';

const DURATION = 40, PERIOD = 4.4, HERD_SPEED = 1.1;
const NB = 128, BZ0 = -250, BZ1 = 390, NSPIT = 12;

const HOURS = {
  morning: {
    sky: { preset: 'day', zenith: '#3f879c', mid: '#8fc3c4', horizon: '#cfe0db', ground: '#8fa79a', sunElevation: 22, sunAzimuth: -90, sunColor: '#FFE8B5', sunIntensity: 11,
      scatterColor: '#ffe9bf', scatter: 0.4, lightColor: '#FFE3A8', lightIntensity: 3.5, ambientColor: '#a6ccc8', groundLight: '#6c8c78', ambientIntensity: 1.5,
      clouds: false, clouds2: { coverage: 0.34, stretch: 1, opacity: 0.5 } },
    pal: ['#DCE7E2', '#4F7C46', '#213F2C', '#5C8A96', '#736e67', '#FFE8B5'], mist: 0.8, mistH: 5.2, mistCol: [0.86, 0.905, 0.885], mistGain: 0.94,
    sunK: 1.2, ambK: 1.0, fog: 0.00058, exposure: 1.0, bloom: 0.36, tint: '#fffaf2', shadowTint: '#0a1410', sat: 1.06, moon: true, rays: 0.3,
  },
  dawn: {
    sky: { preset: 'dawn', zenith: '#5f7f9a', mid: '#b9aeb8', horizon: '#e8cfc8', ground: '#8b8f92', sunElevation: 5, sunAzimuth: -90, sunColor: '#ffb48c', sunIntensity: 10,
      scatterColor: '#ffb9a0', scatter: 0.55, lightColor: '#ffc09c', lightIntensity: 2.7, ambientColor: '#b0aec4', groundLight: '#6a7474', ambientIntensity: 1.55,
      lightElevationMin: 11, clouds: false, clouds2: { coverage: 0.5, stretch: 1, opacity: 0.7, lit: '#ffd2c4', shade: '#8f8aa4' } },
    pal: ['#DAD0D4', '#47704A', '#1E3A2D', '#6A8794', '#7A726C', '#FFC9B0'], mist: 0.9, mistH: 7.5, mistCol: [0.82, 0.76, 0.78], mistGain: 0.9,
    sunK: 1.0, ambK: 1.0, fog: 0.0008, exposure: 1.02, bloom: 0.4, tint: '#fff4f1', shadowTint: '#120f18', sat: 1.0, moon: true, rays: 0.24,
  },
  golden: {
    sky: { preset: 'goldenHour', zenith: '#4d7fa0', mid: '#c9c2a6', horizon: '#f2d6a6', ground: '#9a8f72', sunElevation: 13, sunAzimuth: 90, sunColor: '#ffbf6e', sunIntensity: 11,
      scatterColor: '#ffb65e', scatter: 0.6, lightColor: '#ffc98c', lightIntensity: 3.3, ambientColor: '#a4b6c6', groundLight: '#7c7658', ambientIntensity: 1.45,
      clouds: false, clouds2: { coverage: 0.46, stretch: 1, opacity: 0.7, lit: '#ffd9a8', shade: '#8a86a0' } },
    pal: ['#EBD9B8', '#5C7F3C', '#243C22', '#6E8A86', '#756f69', '#FFB663'], mist: 0.75, mistH: 4.8, mistCol: [0.93, 0.8, 0.6], mistGain: 0.86,
    sunK: 1.15, ambK: 0.95, fog: 0.00058, exposure: 1.0, bloom: 0.4, tint: '#fff3e2', shadowTint: '#0c1018', sat: 1.08, moon: false, rays: 0.3,
  },
  night: {
    sky: { preset: 'night', zenith: '#081428', mid: '#12284a', horizon: '#3a5878', ground: '#141e2a', stars: 0.9, milkyWay: 0.35,
      bodies: [{ elevation: 30, azimuth: -90, size: 2.6, phase: 1, color: '#eef3ff', color2: '#aab6cc', texture: 0.7, intensity: 3.2, glow: 0.7, glowColor: '#9fc0ff', glowSize: 7 }], key: 0,
      lightColor: '#b9d0ff', lightIntensity: 1.5, ambientColor: '#4a6a9c', groundLight: '#22344e', ambientIntensity: 1.9, lightElevationMin: 20,
      clouds: false, clouds2: { coverage: 0.4, stretch: 1, opacity: 0.5, lit: '#8fa6c8', shade: '#1a2438' } },
    pal: ['#A9BDD6', '#35594f', '#152c2e', '#3F5E7A', '#6c7686', '#BFD4FF'], mist: 0.85, mistH: 5.0, mistCol: [0.3, 0.4, 0.56], mistGain: 0.62,
    sunK: 0.55, ambK: 0.5, fog: 0.0007, exposure: 1.3, bloom: 0.5, tint: '#eaf2ff', shadowTint: '#04060e', sat: 0.92, moon: false, rays: 0.16,
  },
};
const CRESTS = [
  { color: '#D9652B', shape: 0 }, { color: '#D9652B', shape: 1 }, { color: '#C23A2A', shape: 1 }, { color: '#E3A32C', shape: 0 }, { color: '#D9652B', shape: 2 },
];

// add the hero's river mist to any built-in or kit material (after its own fog), so everything sits in one mist
function mistify(mat, U) {
  if (!mat || mat.userData.sfMist) return mat;
  mat.userData.sfMist = true;
  const prev = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    if (sh.fragmentShader.indexOf('#include <fog_fragment>') < 0 || sh.fragmentShader.indexOf('applyMist') >= 0) return;
    sh.uniforms.uMist = U.uMist; sh.uniforms.uMistCol = U.uMistCol; sh.uniforms.uSunDirW = U.uSunDirW;
    sh.fragmentShader = sh.fragmentShader
      .replace(/void\s+main\s*\(\s*\)\s*\{/, MIST_GLSL + '\nvoid main() {')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\n gl_FragColor.rgb = applyMist(gl_FragColor.rgb, cameraPosition - vViewPosition * mat3(viewMatrix));');
  };
  mat.customProgramCacheKey = function () { return (key ? key.call(mat) : '') + '|sfmist'; };
  mat.needsUpdate = true;
  return mat;
}

// soft analytic shadows of the walking adults on ground and water: every body, leg pair, neck and tail is a box
// projected along the sun (which stands square across the track), so long dark bars lie across the ford
const SHADOW_GLSL = /* glsl */`
uniform vec4 uAn[48]; uniform vec4 uShd; // uAn: x, z0, scale, kind (0 diplodocid, 1 brachiosaur); uShd: cot(elevation) signed, strength, herd advance
float sfBox(float v, float a, float b, float s){ return smoothstep(a - s, a + s, v) * (1. - smoothstep(b - s, b + s, v)); }
float sfShadow(vec3 wp){
  float sh = 0., ak = abs(uShd.x), sg = uShd.x < 0. ? -1. : 1.;
  for (int i = 0; i < 48; i++) {
    vec4 a = uAn[i];
    if (a.z <= 0.) continue;
    float dz = (wp.z - a.y - uShd.z) / a.z, dx = (wp.x - a.x) * sg / a.z;
    if (dz < -19. || dz > 14. || dx < -2.5 || dx > ak * 15. + 3.) continue;
    float s;
    if (a.w < 0.5) {
      s = sfBox(dz, -3.2, 3.6, 0.5) * sfBox(dx, ak * 4.4 - 2.4, ak * 4.4 + 2.4, 0.8);
      s += (sfBox(dz, -3.0, -2.0, 0.25) + sfBox(dz, 2.1, 3.1, 0.25)) * sfBox(dx, -0.8, ak * 4.0 + 0.8, 0.5);
      float cn = ak * (4.4 + (dz - 3.6) * 0.1), ct = ak * (4.3 + (dz + 3.2) * 0.09);
      s += sfBox(dz, 3.6, 12.6, 0.4) * sfBox(dx, cn - 0.9, cn + 0.9, 0.5) + sfBox(dz, -16., -3.2, 0.5) * sfBox(dx, ct - 0.6, ct + 0.6, 0.4);
    } else {
      s = sfBox(dz, -3.4, 3.8, 0.5) * sfBox(dx, ak * 7.0 - 3.2, ak * 7.0 + 3.2, 1.0);
      s += (sfBox(dz, -3.85, -2.65, 0.25) + sfBox(dz, 2.65, 3.85, 0.25)) * sfBox(dx, -1., ak * 6.4 + 1., 0.5);
      float cn = ak * (8.3 + 5.6 * clamp((dz - 4.4) / 4.4, 0., 1.)), ct = ak * (5.9 + (dz + 3.4) * 0.33);
      s += sfBox(dz, 4.2, 9.8, 0.4) * sfBox(dx, cn - 1.3, cn + 1.3, 0.6) + sfBox(dz, -10.6, -3.4, 0.5) * sfBox(dx, ct - 0.9, ct + 0.9, 0.5);
    }
    sh = max(sh, clamp(s, 0., 1.));
  }
  return sh * uShd.y;
}`;

function pickLook(ctx) {
  const r = ctx.rng.fork('look'), v = ctx.vary || {};
  const a = r(), b = r(), c = r(), d = r(), e = r();
  let hour = ({ day: 'morning', dawn: 'dawn', golden: 'golden', night: 'night' })[v.hour];
  if (!hour) hour = a < 0.4 ? 'morning' : a < 0.6 ? 'dawn' : a < 0.84 ? 'golden' : 'night';
  const season = b < 0.42 ? 'fresh' : b < 0.63 ? 'rain' : b < 0.82 ? 'dry' : 'flood';
  return { hour, season, cast: c < 0.16 ? 'brachio' : 'mixed', crest: CRESTS[Math.floor(d * CRESTS.length) % CRESTS.length], mood: v.mood ?? e,
    density: clamp(v.density ?? 1, 0.7, 1.3), rare: !!v.rare, hunters: e > 0.72 };
}

// the braided riverbed along the herd's track: [z0, z1, height]; channels, gravel bars, the two banks
function makeBed(look, rng, waterY, rs) {
  const j = () => rng.range(-5, 5);
  const b = [-172 + j(), -128 + j(), -104 + j(), -48 + j(), -22 + j(), 40 + j(), 62 + j(), 122, 150, 204, 288, 322];
  const dry = look.season === 'dry', fl = look.season === 'flood';
  // in flood three bars stay above the brown water as islands; the rest drown
  const h = [2.7, dry ? 0.95 : 0.5, 1.6, 0, fl ? 2.22 : 1.66, dry ? 0.9 : 0.15, 1.56, 0, fl ? 2.2 : 1.6, dry ? 0.85 : 0.45, fl ? 2.2 : 1.5, 0.2, 2.7];
  const raw = (z) => { let y = h[0]; for (let i = 0; i < b.length; i++) y += (h[i + 1] - h[i]) * smoothstep(b[i] - 6, b[i] + 6, z); return y; };
  const arr = new Float32Array(NB);
  for (let i = 0; i < NB; i++) arr[i] = raw(lerp(BZ0, BZ1, i / (NB - 1)));
  const lin = (z) => { const f = clamp((z - BZ0) / (BZ1 - BZ0) * (NB - 1), 0, NB - 1.001), i = Math.floor(f); return lerp(arr[i], arr[i + 1], f - i); };
  const ph = [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28)];
  const warp = (x) => smoothstep(30, 150, Math.abs(x)) * (26 * Math.sin(x * 0.0105 + ph[0]) + 15 * Math.sin(x * 0.0231 + ph[1]));
  // full 2D bed: the profile, bent by a slow meander away from the track, with bars that pinch out and shoal
  const at = (x, z) => {
    const zp = z + warp(x); let y = lin(zp);
    const mask = 1 - smoothstep(2.1, 2.5, y), r = smoothstep(30, 95, Math.abs(x));
    y += mask * r * 0.95 * Math.sin(x * 0.021 + zp * 0.045 + ph[2]) * Math.sin(x * 0.009 - zp * 0.02 + ph[3]);
    // shallow pools and rivulets left on the bars
    const bar = smoothstep(1.3, 1.5, y) * (1 - smoothstep(2.0, 2.3, y));
    y -= bar * 0.62 * smoothstep(0.3, 0.8, Math.sin(x * 0.29 + zp * 0.13 + ph[2]) * Math.sin(zp * 0.21 - x * 0.08 + ph[3]));
    return y;
  };
  // gravel spits standing just out of the channels beside the track (never under the herd): midground for the slalom and the glide
  const spits = [], top = waterY + 0.42;
  const zones = [[b[2] + 8, b[3] - 8], [b[4] + 8, b[5] - 8], [b[6] + 8, b[7] - 26], [b[6] + 30, b[7] - 6], [b[8] + 8, b[9] - 24], [b[8] + 26, b[9] - 6]];
  for (let i = 0; i < NSPIT; i++) {
    const zn = zones[Math.floor(i / 2) % zones.length], side = (i % 2 ? 1 : -1) * (i % 4 < 2 ? 1 : -1), rx = rs.range(9, 13.5), rz = rs.range(3.6, 6.2);
    spits.push({ x: side * (rx + rs.range(14.5, 30)), z: rs.range(zn[0], zn[1]), rx, rz });
  }
  const full = (x, z) => {
    let y = at(x, z);
    for (let i = 0; i < NSPIT; i++) { const s = spits[i], qx = (x - s.x) / s.rx, qz = (z - s.z) / s.rz, w = 1 - qx * qx - qz * qz; if (w > 0) y += w * w * Math.max(top - y, 0); }
    return y;
  };
  if (look.rare) for (const sp of spits) if (sp.x < 0 && Math.abs(sp.z + 72) < 24) sp.x = -sp.x;       // the bull stands there
  return { arr, lin, at, full, ph, bounds: b, spits, spitTop: top };
}

// dynamic-programming slalom through the walking column, authored against the herd clock (herdTime = u x 40 s)
async function planLane(hero, zs, ys, tOfZ, rng, yieldFn) {
  const xs = [-6.5, -5, -3.5, -2.2, -1, 0, 1, 2.2, 3.5, 5, 6.5], K = zs.length, S = xs.length;
  const pen = (c) => (c < 1.6 ? 600 + (1.6 - c) * 300 : c < 3.2 ? (3.2 - c) * (3.2 - c) * 3 : 0);
  const phase = rng.range(0, 6.28), amp = 4.6;
  const cost = [], back = [];
  for (let k = 0; k < K; k++) {
    await yieldFn();
    cost.push(new Float32Array(S)); back.push(new Int8Array(S));
    const t = tOfZ(zs[k]), want = amp * Math.sin((zs[k] - zs[0]) * (6.2832 / 86) + phase) * smoothstep(0, 3, k) * smoothstep(0, 3, K - 1 - k);
    for (let s = 0; s < S; s++) {
      let node = pen(hero.clearance(xs[s], ys[k], zs[k], t)) + 0.07 * (xs[s] - want) * (xs[s] - want);
      if (k === K - 1) node += 4 * (xs[s] - 0.3) * (xs[s] - 0.3);
      if (k === 0) { cost[k][s] = node + 0.5 * xs[s] * xs[s]; continue; }
      let best = 1e9, bi = 0;
      for (let p = 0; p < S; p++) {
        const dx = xs[s] - xs[p]; if (Math.abs(dx) > 4.6) continue;
        let c = cost[k - 1][p] + 0.06 * dx * dx;
        if (c >= best) continue;
        for (let q = 1; q <= 2 && c < best; q++) {
          const f = q / 3, z = lerp(zs[k - 1], zs[k], f);
          c += pen(hero.clearance(lerp(xs[p], xs[s], f), lerp(ys[k - 1], ys[k], f), z, tOfZ(z)));
        }
        if (c < best) { best = c; bi = p; }
      }
      cost[k][s] = node + best; back[k][s] = bi;
    }
  }
  let s = 0; for (let i = 1; i < S; i++) if (cost[K - 1][i] < cost[K - 1][s]) s = i;
  const out = new Array(K);
  for (let k = K - 1; k >= 0; k--) { out[k] = xs[s]; s = back[k][s]; }
  return out;
}

export default {
  id: 'sauropod-ford',
  name: "The Long Necks' Ford",
  category: 'prehistoric',
  weirdness: 0.15,
  media: ['air', 'water'],
  async build(ctx) {
    const { rng } = ctx;
    const look = pickLook(ctx), H = HOURS[look.hour], detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    const waterY = look.season === 'dry' ? 0.62 : look.season === 'flood' ? 1.9 : 1.2;
    const bed = makeBed(look, rng.fork('bed'), waterY, ctx.core.makeRng('sf-spits:' + ctx.seed));

    // ---------------------------------------------------------------- sky, light, fog
    const rainy = look.season === 'rain';
    const skyOpts = { ...H.sky };
    if (rainy) skyOpts.clouds2 = { ...(H.sky.clouds2 || {}), coverage: 0.68, opacity: 0.85 };
    if (H.moon) skyOpts.bodies = [{ elevation: 54, azimuth: 122, size: 1.5, color: '#e9efe9', color2: '#b8c4c2', texture: 0.6, phase: 0.5, phaseAngle: -70, intensity: 0.8, glow: 0 }];
    const sky = makeSky({ rng, renderer: ctx.renderer, bake: true, ...skyOpts });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { bounce: 0.3 });
    scene.add(rig.object);
    const sunDir = sky.lightDirection.clone().normalize();
    const pearl = new THREE.Color(H.pal[0]);
    const fogCol = sky.fogColor.clone().lerp(pearl, look.hour === 'night' ? 0.15 : 0.45);
    if (look.hour === 'night') fogCol.multiplyScalar(0.55);
    scene.fog = new THREE.FogExp2(fogCol, H.fog * (rainy ? 1.25 : 1));
    await ctx.yield();

    // ---------------------------------------------------------------- the herd
    const palette = H.pal.concat([look.crest.color]);
    if (look.season === 'dry') { palette[1] = '#7d8a48'; palette[4] = '#857a68'; }
    if (look.season === 'flood') palette[3] = look.hour === 'night' ? '#4a5a66' : '#6e7868';
    if (rainy) palette[1] = '#3f7f4a';
    const bullAt = look.rare ? { x: -18, z: -72, scale: 1.1 } : null;
    const hero = await buildHero(ctx, {
      palette, waterY, water: false, heightAt: (z) => bed.lin(z), duration: DURATION, cast: look.cast, headZ: 77.5,
      count: clamp(Math.round(38 * look.density + rng.range(-2, 2)), 28, 46), juveniles: look.density > 1.1 ? 14 : 12,
      mist: H.mist * (look.season === 'dry' ? 0.55 : rainy ? 1.15 : 1), sunDir: sunDir.toArray(), ...(bullAt ? { bull: bullAt } : {}),
    });
    scene.add(hero.object);
    const U = hero.uniforms;
    U.uMist.value.y = H.mistH;
    U.uMistCol.value.setRGB(H.mistCol[0], H.mistCol[1], H.mistCol[2]).multiplyScalar(H.mistGain);
    U.uSunCol.value.copy(sky.lightColor).multiplyScalar(H.sunK);
    U.uAmbCol.value.copy(pearl).lerp(new THREE.Color(H.pal[3]), 0.55).multiplyScalar(H.ambK);
    if (look.hour === 'night') U.uPearl.value.multiplyScalar(0.8);
    hero.setLight({ sunDir, sunColor: U.uSunCol.value });
    const shadowU = { uAn: { value: [] }, uShd: { value: new THREE.Vector4(-sunDir.x / Math.max(sunDir.y, 0.12), look.hour === 'night' ? 0.6 : look.hour === 'dawn' ? 0.6 : 0.9, 0, 0) } };
    {
      const ad = hero.animals.filter((a) => a.walking && !a.juvenile);
      for (let i = 0; i < 48; i++) { const a = ad[i]; shadowU.uAn.value.push(a ? new THREE.Vector4(a.x, a.z0, a.scale, a.species === 'brachio' ? 1 : 0) : new THREE.Vector4(0, 0, 0, 0)); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the route
    const A = hero.anchors, archZ = A.arch.position[2], endZ = A.portalSeat.position[2];
    const barY = bed.lin(endZ), endY = barY + 7.1, startZ = -297, skimY = 2.7 + 1.2 + 2.5;
    const laneY = (z) => { let m = 0; for (let i = -2; i <= 2; i++) m += Math.max(waterY + 2.75, bed.lin(z + i * 7) + 3.3); return m / 5; };
    const Lguess = 564;
    let uHead = 0.74, mh = hero.matriarchHead(uHead * DURATION);
    const zs = [], ys = [];
    for (let z = -236; z <= mh.z - 44; z += 12) { zs.push(z); ys.push(laneY(z)); }
    const laneRng = rng.fork('lane'), xsLane = await planLane(hero, zs, ys, (z) => DURATION * (z - startZ) / Lguess, laneRng, ctx.yield);
    await ctx.yield();
    // the climb swings out on her west (+X) side and comes back in toward the head, so that she stands ahead of us and a
    // little above all the way up; `wide` 1..0 pulls that swing in when another animal's neck is in the way
    const routePoints = (k, wide) => {
      const p = [[0, skimY, startZ], [0, skimY, startZ + 30], [xsLane[0] * 0.4 * k, lerp(skimY, ys[0], 0.6), -256]];
      for (let i = 0; i < zs.length; i++) p.push([xsLane[i] * k, ys[i], zs[i]]);
      const yl = ys[ys.length - 1], hx = mh.x, hy = mh.y, hz = mh.z;
      p.push([lerp(0.4, 1.6, wide), lerp(yl, hy, 0.24), hz - 35], [lerp(0.3, hx + 10.4, wide), lerp(yl, hy, 0.62), hz - 23.5],
        [hx + lerp(4.7, 9.3, wide), hy - 1.7, hz - 13], [hx + lerp(4.5, 5.3, wide), hy - 0.45, hz - 3.2], [hx + 4.5, hy + 0.1, hz + 8]);
      p.push([1.2, lerp(hy, endY, 0.45), lerp(hz + 9, endZ - 62, 0.5)], [0, endY + 0.5, endZ - 74], [0, endY, endZ - 62], [0, endY, archZ - 8], [0, endY, endZ]);
      return p;
    };
    let path = null, laneK = 1, wide = 1;
    const tmpP = new THREE.Vector3();
    const settle = (k, w) => {
      let pth = makePath(routePoints(k, w));
      for (let i = 0; i < 2; i++) { uHead = pth.nearestXZ(mh.x + 4.5, mh.z).u; hero.matriarchHead(uHead * DURATION, mh); pth = makePath(routePoints(k, w)); }
      return pth;
    };
    const worstOf = (pth, u0, u1) => { let w = 1e9; for (let u = u0; u < u1; u += 0.004) { pth.pointAt(u, tmpP); w = Math.min(w, hero.clearance(tmpP.x, tmpP.y, tmpP.z, u * DURATION)); } return w; };
    for (const w of [1, 0.66, 0.33, 0]) {
      wide = w; path = settle(laneK, w);
      const ok = worstOf(path, uHead - 0.13, uHead + 0.06) >= 1.7;
      await ctx.yield();
      if (ok) break;
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) path = settle(laneK, wide);
      if (worstOf(path, 0.1, 0.8) >= 1.25 || laneK === 0) break;
      laneK = Math.max(0, laneK - 0.4);
      await ctx.yield();
    }
    uHead = path.nearestXZ(mh.x + 4.5, mh.z).u;
    await ctx.yield();

    // ---------------------------------------------------------------- ground: prairie, banks, gravel bars, riverbed
    const noise = ctx.noise, time = { value: 0 };
    const fernC = new THREE.Color(palette[1]), deepC = new THREE.Color(palette[2]), hideC = new THREE.Color(palette[4]);
    const gravelC = hideC.clone().lerp(pearl, look.hour === 'night' ? 0.2 : look.hour === 'dawn' ? 0.62 : 0.5).multiplyScalar(look.hour === 'night' ? 0.62 : look.hour === 'dawn' ? 0.98 : 0.8);
    const groundOf = (bedFn) => (x, z) => {
      let y = bedFn(x, z);
      const bank = smoothstep(2.3, 2.68, y);
      if (bank > 0) {
        const far = smoothstep(20, 130, Math.abs(x));
        y += bank * (0.5 + 0.5 * noise.fbm2(x * 0.006, z * 0.006, 3)) * (0.45 + 0.75 * far);
        const d = Math.hypot(x * 0.8, z - 40);
        if (d > 800) y += bank * (smoothstep(900, 1250, d) * 34 + smoothstep(1400, 1750, d) * 52 + smoothstep(1850, 2300, d) * 80) * (0.7 + 0.5 * noise.n2(x * 0.0012, z * 0.0012));
      }
      return y;
    };
    const groundAt = groundOf(bed.full), ground0 = groundOf(bed.at);
    const groundColor = (x, z, y) => {
      if (y === undefined) y = groundAt(x, z);
      const n = 0.5 + 0.5 * noise.fbm2(x * 0.021, z * 0.021, 2), g = smoothstep(2.25, 2.6, y);
      const wet = 1 - 0.45 * smoothstep(waterY + 0.35, waterY - 0.1, y);
      const gr = (0.62 + 0.5 * n) * wet, k = 0.5 + 0.4 * n, m = n * n;
      return [lerp(gravelC.r * gr, lerp(deepC.r, fernC.r, m) * k, g), lerp(gravelC.g * gr, lerp(deepC.g, fernC.g, m) * k, g), lerp(gravelC.b * gr, lerp(deepC.b, fernC.b, m) * k, g)];
    };
    {
      const NX = 84, zRows = [];
      for (let i = 0; i < 20; i++) zRows.push(-2400 + (2400 - 236) * (1 - Math.pow(1 - i / 20, 2.6)));
      for (let z = -236; z <= 384; z += 3.1) zRows.push(z);
      for (let i = 1; i <= 20; i++) zRows.push(384 + (2500 - 384) * Math.pow(i / 20, 2.6));
      const NZ = zRows.length - 1, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), col = new Float32Array(pos.length), idx = new Uint32Array(NX * NZ * 6);
      for (let j = 0, k = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++, k += 3) {
          const s = i / NX * 2 - 1, x = Math.sign(s) * (95 * Math.abs(s) + 2405 * Math.pow(Math.abs(s), 3)), z = zRows[j], y = ground0(x, z);
          pos[k] = x; pos[k + 1] = y - 0.16 * (1 - smoothstep(waterY + 0.04, waterY + 0.45, y)); pos[k + 2] = z;
          const c = groundColor(x, z, y); col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2];
        }
        if (j % 4 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0, q = 0; j < NZ; j++) for (let i = 0; i < NX; i++, q += 6) { const a = j * (NX + 1) + i, b = a + NX + 1; idx[q] = a; idx[q + 1] = b; idx[q + 2] = a + 1; idx[q + 3] = a + 1; idx[q + 4] = b; idx[q + 5] = b + 1; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uSfT = time; sh.uniforms.uAn = shadowU.uAn; sh.uniforms.uShd = shadowU.uShd; sh.uniforms.uSfMud = { value: new THREE.Vector3(waterY, 0, 0) };
        sh.fragmentShader = sh.fragmentShader
          .replace(/void\s+main\s*\(\s*\)\s*\{/, SHADOW_GLSL + /* glsl */`uniform float uSfT; uniform vec3 uSfMud;
            float sfH(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
            float sfN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
              return mix(mix(sfH(i), sfH(i + vec2(1., 0.)), f.x), mix(sfH(i + vec2(0., 1.)), sfH(i + vec2(1., 1.)), f.x), f.y); }
            void main() {`)
          .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
            {
              vec3 wpT = cameraPosition - vViewPosition * mat3(viewMatrix);
              float dT = length(vViewPosition), nearK = smoothstep(140., 8., dT);
              float n1 = sfN(wpT.xz * 0.9), n2 = sfN(wpT.xz * 4.7), n3 = sfN(wpT.xz * 0.11);
              float green = smoothstep(0.0, 0.05, vColor.g - vColor.r * 1.06);
              float peb = smoothstep(0.3, 0.7, sfN(wpT.xz * 1.7)) * 0.45 + smoothstep(0.45, 0.6, sfN(wpT.xz * 0.45 + 3.)) * 0.3 + n2 * 0.25;
              diffuseColor.rgb *= mix(1., mix(0.52 + 0.9 * peb, 0.8 + 0.4 * n1, green), nearK) * (0.86 + 0.28 * n3);
              // the herd's track: churned wet gravel pocked with footprints
              float track = (1. - green) * (1. - smoothstep(9., 15., abs(wpT.x))) * smoothstep(-260., -180., wpT.z);
              float fpn = sfN(wpT.xz * vec2(1.1, 0.8) + 11.);
              float fprint = smoothstep(0.6, 0.72, fpn) * (1. - 0.6 * smoothstep(0.78, 0.9, fpn));
              diffuseColor.rgb *= mix(1., 0.88 - 0.22 * fprint * nearK, track);
              float wetG = (1. - green) * (1. - smoothstep(uSfMud.x + 0.02, uSfMud.x + 0.32, wpT.y));
              diffuseColor.rgb *= 1. - 0.35 * wetG;
              diffuseColor.rgb *= mix(vec3(1.), vec3(0.5, 0.6, 0.66), sfShadow(wpT));
              float gust = sfN(wpT.xz * 0.013 + vec2(uSfT * 0.16, uSfT * 0.07)) - 0.5;
              diffuseColor.rgb *= 1. + green * 0.55 * gust * smoothstep(30., 160., dT);
            }`);
      };
      mat.customProgramCacheKey = () => 'sf-ground';
      mistify(mat, U);
      const ground = new THREE.Mesh(g, mat); ground.frustumCulled = false;
      scene.add(ground);
      await ctx.yield();
      // the gravel spits, as fine patches over the coarse sheet
      const SX = 16, SZ = 10, n = bed.spits.length, sp = new Float32Array(n * (SX + 1) * (SZ + 1) * 3), sc = new Float32Array(sp.length), si = [];
      for (let q = 0, k = 0; q < n; q++) {
        const s = bed.spits[q], base = q * (SX + 1) * (SZ + 1);
        for (let j = 0; j <= SZ; j++) for (let i = 0; i <= SX; i++, k += 3) {
          const x = s.x + (i / SX * 2 - 1) * s.rx, z = s.z + (j / SZ * 2 - 1) * s.rz, y = groundAt(x, z), y0 = ground0(x, z);
          sp[k] = x; sp[k + 1] = y - 0.16 * (1 - smoothstep(waterY + 0.04, waterY + 0.45, y)) - 0.12 * (1 - smoothstep(0, 0.12, y - y0)); sp[k + 2] = z;
          const c = groundColor(x, z, y); sc[k] = c[0]; sc[k + 1] = c[1]; sc[k + 2] = c[2];
        }
        for (let j = 0; j < SZ; j++) for (let i = 0; i < SX; i++) { const a = base + j * (SX + 1) + i, b = a + SX + 1; si.push(a, b, a + 1, a + 1, b, b + 1); }
        if (q % 3 === 2) await ctx.yield();
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3)); sg.setIndex(si);
      sg.computeVertexNormals();
      const spitMesh = new THREE.Mesh(sg, mat); spitMesh.frustumCulled = false; scene.add(spitMesh);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the river: one sheet, depth from the analytic bed
    const skyH = sky.horizonColor.clone(), skyZ = sky.zenithColor.clone();
    const foamCol = U.uPearl.value.clone().multiply(U.uAmbCol.value.clone().multiplyScalar(0.8).add(U.uSunCol.value.clone().multiplyScalar(0.45)));
    const waterMat = new THREE.ShaderMaterial({
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uMist: U.uMist, uMistCol: U.uMistCol, uSunDirW: U.uSunDirW, uSunCol: U.uSunCol, uWaterY: U.uWaterY, uT: time,
        uBedA: { value: bed.arr }, uBedR: { value: new THREE.Vector2(BZ0, (NB - 1) / (BZ1 - BZ0)) }, uPh: { value: new THREE.Vector4(bed.ph[0], bed.ph[1], bed.ph[2], bed.ph[3]) },
        uRiver: { value: new THREE.Color(palette[3]) }, uSkyH: { value: skyH }, uSkyZ: { value: skyZ }, uGravel: { value: gravelC }, uFoam: { value: foamCol },
        uTurb: { value: look.season === 'flood' ? 4.2 : 1.5 }, uFlood: { value: look.season === 'flood' ? 1 : 0 }, uDebris: { value: deepC.clone().lerp(hideC, 0.35).multiplyScalar(0.55) },
        uSpit: { value: bed.spits.map((q) => new THREE.Vector4(q.x, q.z, 1 / q.rx, 1 / q.rz)) }, uSpitTop: { value: bed.spitTop }, uAn: shadowU.uAn, uShd: shadowU.uShd, uKeyDir: { value: (sky.keyDirection || sunDir).clone().normalize() },
      },
      transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`
        varying vec3 vWPos; uniform float uWaterY;
        #include <fog_pars_vertex>
        void main(){
          vec4 wp = modelMatrix * vec4(position.x * 4700., uWaterY, position.z * 640. + 72., 1.); vWPos = wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vWPos;
        uniform float uT, uWaterY, uTurb; uniform float uBedA[${NB}]; uniform vec2 uBedR; uniform vec4 uPh;
        uniform vec3 uRiver, uSkyH, uSkyZ, uGravel, uSunCol, uFoam, uKeyDir, uDebris; uniform float uFlood, uSpitTop; uniform vec4 uSpit[${NSPIT}];
        float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
        float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
        ${MIST_GLSL}
        ${SHADOW_GLSL}
        #include <fog_pars_fragment>
        float bedLin(float z){ float f = clamp((z - uBedR.x) * uBedR.y, 0., ${NB - 1.001}); int i = int(f); return mix(uBedA[i], uBedA[i + 1], f - float(i)); }
        float bedXZ(vec2 p){
          float ax = abs(p.x);
          float zp = p.y + smoothstep(30., 150., ax) * (26. * sin(p.x * 0.0105 + uPh.x) + 15. * sin(p.x * 0.0231 + uPh.y));
          float y = bedLin(zp);
          y += (1. - smoothstep(2.1, 2.5, y)) * smoothstep(30., 95., ax) * 0.95 * sin(p.x * 0.021 + zp * 0.045 + uPh.z) * sin(p.x * 0.009 - zp * 0.02 + uPh.w);
          float bar = smoothstep(1.3, 1.5, y) * (1. - smoothstep(2.0, 2.3, y));
          y -= bar * 0.62 * smoothstep(0.3, 0.8, sin(p.x * 0.29 + zp * 0.13 + uPh.z) * sin(zp * 0.21 - p.x * 0.08 + uPh.w));
          for (int i = 0; i < ${NSPIT}; i++) { vec2 q = (p - uSpit[i].xy) * uSpit[i].zw; float w = max(1. - dot(q, q), 0.); y += w * w * max(uSpitTop - y, 0.); }
          return y;
        }
        void main(){
          vec2 p = vWPos.xz;
          float depth = uWaterY - bedXZ(p);
          if (depth < 0.) discard;
          vec3 dv = vWPos - cameraPosition; float dist = length(dv); vec3 vd = dv / max(dist, 1e-3);
          float t = uT, lod = smoothstep(190., 14., dist), flow = 0.55 + 0.9 * clamp(depth, 0., 1.2);
          // ripples drawn out along the current (the river runs toward -X) over a slower, larger swell
          vec3 q = vec3(p.x * 0.34 + t * 0.85 * flow, p.y * 2.1 + 0.6 * sin(p.x * 0.05 + t * 0.1), t * 0.2);
          float n1 = vnoise(q), n1x = vnoise(q + vec3(0.14, 0., 0.)), n1z = vnoise(q + vec3(0., 0.5, 0.));
          vec3 q2 = vec3(p.x * 0.085 + t * 0.2, p.y * 0.42, 5. + t * 0.07);
          float s1 = vnoise(q2), s1x = vnoise(q2 + vec3(0.1, 0., 0.)), s1z = vnoise(q2 + vec3(0., 0.2, 0.));
          float n2 = vnoise(vec3(p.x * 1.1 + t * 2.0 * flow, p.y * 4.2, 3. + t * 0.4));
          float lod2 = smoothstep(420., 40., dist);
          vec3 N = normalize(vec3(-(n1x - n1) * 0.75 * lod - (s1x - s1) * 0.7 * lod2, 1., -(n1z - n1) * 0.8 * lod - (s1z - s1) * 0.9 * lod2 - (n2 - 0.5) * 0.1 * lod));
          float fres = 0.04 + 0.96 * pow(1. - clamp(dot(-vd, N), 0., 1.), 5.);
          vec3 R = reflect(vd, N); R.y = abs(R.y);
          vec3 sky = mix(uSkyH * 0.7, uSkyZ * 0.62, smoothstep(0., 0.4, R.y));
          float shd = sfShadow(vWPos);
          float sd = max(dot(R, uKeyDir), 0.);
          float glint = pow(sd, 260.) * 7. + pow(sd, 24.) * 0.4;
          float g = vnoise(vec3(p * 2.2, 1.)) * 0.6 + vnoise(vec3(p * 7., 4.)) * 0.4;
          float turb = 1. - exp(-depth * uTurb);
          vec3 body = mix(uGravel * (0.45 + 0.55 * g) * mix(vec3(1.), uRiver * 1.8, 0.5), uRiver * 0.42, turb) * (1. - 0.78 * shd);
          float sunP = smoothstep(0.5, 0.8, vnoise(vec3(p.x * 0.06 + t * 0.05, p.y * 0.1, 9.)));
          body *= 0.85 + 0.45 * sunP;
          // flood: mats of torn fern and weed riding the brown water downstream
          float mats = uFlood * smoothstep(0.73, 0.8, vnoise(vec3(p.x * 0.11 + t * 0.2, p.y * 0.34, 21.)) * (0.75 + 0.25 * vnoise(vec3(p.x * 0.9 + t * 1.63, p.y * 1.7, 2.)))) * smoothstep(0.25, 0.6, depth) * smoothstep(260., 60., dist);
          body = mix(body, uDebris * (0.7 + 0.6 * n2) * (1. - 0.6 * shd), mats);
          float shore = smoothstep(0.16, 0.02, depth) * smoothstep(0.35, 0.7, vnoise(vec3(p.x * 0.5 + t * 0.9, p.y * 1.6, 5.)));
          float lines = smoothstep(0.8, 0.94, vnoise(vec3(p.x * 0.13 + t * 0.3 * flow, p.y * 1.1, 7.)) * (0.6 + 0.4 * n2)) * (0.22 + 0.2 * uFlood) * lod2 * smoothstep(0.1, 0.5, depth);
          float riffle = smoothstep(0.5, 0.15, depth) * smoothstep(0.02, 0.12, depth) * smoothstep(0.6, 0.9, n2) * lod;
          float refl = mix(fres * 0.74, max(fres, 0.24) * 0.95, uFlood) * (1. - mats * 0.8);
          vec3 col = mix(body, sky * (1. - 0.62 * shd), refl) + uSunCol * glint * lod * (0.5 + 0.9 * sunP) * (1. - shd) * (1. - mats) + (shore * 0.8 + lines + riffle * 0.45) * uFoam * (1. - 0.5 * shd);
          gl_FragColor = vec4(col, smoothstep(0., 0.07, depth) * mix(0.8, 1., max(fres, turb)));
          #include <fog_fragment>
          gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, vWPos), mix(0.48, 0.85, smoothstep(8., 110., dist)));
        }`,
    });
    {
      const g = new THREE.PlaneGeometry(1, 1, 1, 1); g.rotateX(-Math.PI / 2);
      const river = new THREE.Mesh(g, waterMat); river.frustumCulled = false; river.renderOrder = 2;
      scene.add(river);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- flora
    const live = [];                                             // everything with update(dt, time, camera)
    const wind = flora.makeWind({ direction: [1, 0.3], strength: 1.15 });
    const treeMat = mistify(flora.windMaterial({ wind, backlight: 0.8, backlightTint: look.hour === 'night' ? '#9fc0d8' : '#d6e58c' }), U);
    await ctx.yield();
    const leafCol = { leaf: deepC.clone().lerp(fernC, 0.35), leafLight: fernC.clone().lerp(pearl, 0.15), leafDark: deepC.clone().multiplyScalar(0.7), bark: '#6d5d4e', barkDark: '#3c332b' };
    const shadeOpt = { sunDir, strength: look.hour === 'night' ? 0.3 : 0.5 };
    {
      const fr = rng.fork('trees'), pts = [];
      const add = (x, z, s, far) => {
        const y = groundAt(x, z); if (y < 2.5) return;
        const n = path.nearestXZ(x, z); if (n.dist < 17) return;
        pts.push({ x, y: y - 0.3, z, s, rot: fr() * 6.2832, d: n.dist, u: n.u, v: fr.int(0, 5) });
      };
      for (let i = 0; i < 9; i++) { const sd = i % 2 ? 1 : -1; add(sd * fr.range(22, 75), fr.range(-300, -182), fr.range(0.85, 1.15)); }
      for (let gI = 0; gI < 21; gI++) {
        const sd = fr() < 0.5 ? -1 : 1, cx = sd * (50 + 1100 * Math.pow(fr(), 1.5)), cz = fr() < 0.4 ? fr.range(-900, -200) : fr.range(340, 1500), n = fr.int(4, 8);
        for (let k = 0; k < n; k++) { const a = fr() * 6.2832, r = fr.range(4, 30); add(cx + Math.cos(a) * r, cz + Math.sin(a) * r, fr.range(0.8, 1.2)); }
      }
      for (let i = 0; i < 26; i++) add(fr.range(-1300, 1300), fr() < 0.35 ? fr.range(-1000, -190) : fr.range(335, 1700), fr.range(0.8, 1.25));
      const mk = (h, d) => flora.pineGeometry({ rng: fr.fork('p' + h + d), height: h, detail: d, ...leafCol });
      await ctx.yield();
      const near = [], far = [];
      for (const h of [27, 31, 34]) { near.push(mk(h, 1)); await ctx.yield(); }
      for (const h of [28, 33]) { far.push(mk(h, 0)); await ctx.yield(); }
      const trees = flora.makeScatter({ rng: fr.fork('sc'), points: pts, path, heightAt: groundAt, material: treeMat, variants: near, farVariants: far, farDistance: 108, tint: 0.12, hue: 0.03, stretch: 0.1, tilt: 0.02,
        groundShadow: { ...shadeOpt, size: 1.4, stretch: 2.2 } });
      scene.add(trees.object); live.push(trees);
      await ctx.yield();
      // the two araucaria the feeding pair reach into, flanking the last gravel bar just behind the crossed necks
      for (let s = -1; s <= 1; s += 2) {
        const head = A.arch.heads[s < 0 ? 0 : 1] || [0, 17, archZ], gx = s * 9.6, gz = archZ + 7.5, gy = groundAt(gx, gz);
        const m = new THREE.Mesh(flora.pineGeometry({ rng: fr.fork('arch' + s), height: Math.max(24, head[1] + 9 - gy), detail: 2, ...leafCol }), treeMat);
        m.position.set(gx, gy - 0.3, gz); m.rotation.y = fr() * 6.28; scene.add(m);
        await ctx.yield();
      }
    }
    await ctx.yield();
    {
      // fern prairie: rosettes over a carpet of fronds, both rippling in the gusts (only where the camera skims it)
      const fr = rng.fork('ferns'), onPrairie = (x, z) => smoothstep(2.35, 2.62, groundAt(x, z));
      const fv = [];
      for (let i = 0; i < 3; i++) { fv.push(flora.fernGeometry({ rng: fr.fork('f' + i), size: 1.35 + 0.25 * i, detail: 0, fronds: 8, leaf: fernC, leafLight: fernC.clone().lerp(pearl, 0.25), leafDark: deepC })); await ctx.yield(); }
      const ferns = flora.makeScatter({ rng: fr.fork('sc'), path, uRange: [0, 0.27], heightAt: groundAt, count: Math.round(730 * detail), radius: 44, corridor: 0, clear: 0, falloff: 0.9, scale: [0.8, 1.35],
        sink: 0.02, tilt: 0.1, chunks: 3, wind, map: treeMat.map, materialOptions: { fade: [105, 140], detail: 0 }, variants: fv, density: onPrairie, tint: 0.2 });
      mistify(ferns.material, U); scene.add(ferns.object); live.push(ferns);
      await ctx.yield();
      const carpet = flora.makeGrass({ rng: fr.fork('carpet'), path, uRange: [0, 0.27], heightAt: groundAt, wind, map: treeMat.map, count: Math.round(5700 * detail), radius: 70, bias: 1.7,
        width: [1.5, 2.5], height: [0.75, 1.25], groundColor, rootGain: 1.15, flowers: 0, fade: [105, 140], chunks: 3, density: onPrairie });
      mistify(carpet.material, U); scene.add(carpet.object); live.push(carpet);
      await ctx.yield();
      // horsetails on the bars and channel edges, a dense bed on the left for the flock to flush from
      const hp = [], hv = [0, 1, 2].map((i) => flora.reedGeometry({ rng: fr.fork('h' + i), height: 2.3 + 0.35 * i, blades: 8, cattails: 0, leaf: fernC.clone().lerp(deepC, 0.3), tip: fernC.clone().lerp(pearl, 0.3), root: deepC }));
      await ctx.yield();
      const tryReed = (x, z, s, rr = fr) => {
        const y = groundAt(x, z); if (y < waterY - (look.season === 'flood' ? 0.7 : 0.15) || y > 2.62) return;
        if (Math.abs(x) < (z > 196 ? 9.5 : 13.5)) return;
        const n = path.nearestXZ(x, z); if (n.dist < 9) return; hp.push({ x, y, z, s, rot: rr() * 6.2832, d: n.dist, u: n.u, v: rr.int(0, 2) });
      };
      for (let i = 0; i < 2600 && hp.length < Math.round(150 * detail); i++) tryReed((fr() < 0.5 ? -1 : 1) * (16 + 120 * Math.pow(fr(), 1.6)), fr.range(-195, 300), fr.range(0.8, 1.3));
      for (let i = 0; i < 500 && hp.length < Math.round(195 * detail); i++) tryReed(fr.range(16, 48), fr.range(-192, -160), fr.range(0.9, 1.4));
      for (let i = 0; i < 300 && hp.length < Math.round(235 * detail); i++) tryReed((fr() < 0.5 ? -1 : 1) * fr.range(9.5, 34), fr.range(198, 290), fr.range(0.8, 1.3));
      {
        // horsetails crowding every spit, so the channels beside the track are never bare water
        const sr = ctx.core.makeRng('sf-spitreeds:' + ctx.seed);
        for (const sp of bed.spits) for (let i = 0, got = 0; i < 30 && got < 5; i++) {
          const a = sr() * 6.2832, r = Math.sqrt(sr()) * 0.8, n0 = hp.length;
          tryReed(sp.x + Math.cos(a) * r * sp.rx, sp.z + Math.sin(a) * r * sp.rz, sr.range(0.75, 1.25), sr); if (hp.length > n0) got++;
        }
      }
      const reeds = flora.makeScatter({ rng: fr.fork('hs'), points: hp, path, heightAt: groundAt, material: treeMat, variants: hv, tint: 0.15, sink: 0.04, tilt: 0.06 });
      scene.add(reeds.object); live.push(reeds);
      await ctx.yield();
      // cycads on bars and banks, tree ferns in the wet margins
      const cp = [], cv = [0, 1].map((i) => flora.palmGeometry({ rng: fr.fork('c' + i), height: 1.5 + 0.5 * i, detail: 0, fronds: 11, curve: 0.05, coconuts: false, leaf: fernC.clone().lerp(deepC, 0.45), leafLight: fernC, leafDark: deepC, bark: '#5a4e40' }))
        .concat([0, 1].map((i) => flora.palmGeometry({ rng: fr.fork('t' + i), height: 4.6 + 0.9 * i, detail: 0, fronds: 12, curve: 0.2, coconuts: false, leaf: fernC, leafLight: fernC.clone().lerp(pearl, 0.2), leafDark: deepC, bark: '#4a4034' })));
      await ctx.yield();
      for (let i = 0; i < 1500 && cp.length < 66; i++) {
        const tf = cp.length % 3 === 2, av = cp.length < 26, x = (fr() < 0.5 ? -1 : 1) * (av ? fr.range(10, 40) : 15 + 150 * Math.pow(fr(), 1.4)), z = av ? fr.range(150, 292) : fr.range(-296, 330), y = groundAt(x, z);
        if (y < waterY + 0.25) continue;
        const n = path.nearestXZ(x, z); if (n.dist < (tf ? 13 : 9) || Math.abs(x) < (av ? 9.5 : 16)) continue;
        cp.push({ x, y: y - 0.1, z, s: fr.range(0.8, 1.25), rot: fr() * 6.2832, d: n.dist, u: n.u, v: tf ? 2 + fr.int(0, 1) : fr.int(0, 1) });
      }
      const cyc = flora.makeScatter({ rng: fr.fork('cy'), points: cp, path, heightAt: groundAt, material: treeMat, variants: cv, tint: 0.15 });
      scene.add(cyc.object); live.push(cyc);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the reach between the herd and the exit island
    // The fifth channel of the bed (bounds[8]..bounds[9]) with the bar south of it and the island north of it:
    // one long-neck of the herd's kind standing apart in it, drinking; a margin of horsetails and quillworts rooted along
    // the river's usual waterline on both shores and round its spits, keeping off the animal; rafts of floating fern
    // drifting down it with the current. Each of the three is dealt from a stream of its own (the margin's lean and tint from
    // two more) and placed by the bed's own function and the water's own level; what lies on the water takes the mist as the
    // water sheet does.
    {
      const t0 = performance.now(), rr = ctx.core.makeRng('sf-reach:' + ctx.seed);
      const rW = rr.fork('long-neck'), rM = rr.fork('margin'), rF = rr.fork('rafts');      // the reach's streams, taken before any loop: how many of one thing are dealt moves nothing of another
      const rH = rr.fork('stands'), rQ = rr.fork('rosettes');                              // and one each for the lean, stretch and tint the kit gives the margin's stands and its rosettes, so that these do not hang on how many throws the margin's loops made
      const fernH = rainy ? new THREE.Color(H.pal[1]) : fernC;                             // the hour's own fern for all this block adds: where the rain has put its day green over the shared colour, the tone is read from the hour's own table by name, so stands, rosettes and mats are in rain as they are at that hour without it
      const zS = bed.bounds[8], zN = bed.bounds[9], shoreY = 1.2, LOOP = 140, KEEP = 1;    // shoreY: the usual waterline on the bed (the level of the fresh season); KEEP: metres between the long-neck's outline and the reach's own plants; live's spit reeds are kept off by a band (see its pick)
      const warp = (x) => smoothstep(30, 150, Math.abs(x)) * (26 * Math.sin(x * 0.0105 + bed.ph[0]) + 15 * Math.sin(x * 0.0231 + bed.ph[1]));   // the bed's own meander
      const spitsHere = bed.spits.filter((s) => s.z > zS - 4 && s.z < zN + 4);
      // --- the long-neck, placed first: it has waded out from the island's shore; of the sixteen places its stream deals there,
      // the one with the deepest water over a level bed that is clear of the reeds live stands on the spits. Where none of the
      // sixteen is such a place under 0.3 m of water, the same stream deals on to sixty-four in all and the best of those is taken
      const spitReeds = [];                                                              // live's own, read back as live dealt them: its spit-reed stream run again by name, a throw kept where live's plants hold a reed at that very spot
      {
        const stood = new Map();
        for (const l of live) if (l.points && l.meshes) { let r = 0; for (const m of l.meshes) r = Math.max(r, m.geometry.userData.radius || 0); for (const p of l.points) stood.set(p.x + ',' + p.z, p.s * r); }
        const sr = ctx.core.makeRng('sf-spitreeds:' + ctx.seed);
        for (const sp of bed.spits) for (let i = 0, got = 0; i < 30 && got < 5; i++) {
          const a = sr() * 6.2832, r = Math.sqrt(sr()) * 0.8, x = sp.x + Math.cos(a) * r * sp.rx, z = sp.z + Math.sin(a) * r * sp.rz; sr();
          const rad = stood.get(x + ',' + z); if (rad === undefined) continue;
          sr(); sr(); got++; spitReeds.push({ x, z, r: rad });
        }
      }
      let wader = null, best = null;
      for (let i = 0; i < 64; i++) {
        if (i === 16 && best && best.depth >= 0.3) break;                                   // the sixteen have found it a place: that place stands, and no further throw is drawn
        const side = rW() < 0.5 ? -1 : 1, off = rW.range(14, 20), z = rW.range(zN - 24, zN - 9), yaw = Math.PI / 2 + rW.range(-0.45, 0.45), sc = rW.range(0.8, 0.95);   // it faces upstream, more or less
        const x = side * (off + (side < 0 ? 13 : 17.7) * sc);                              // snout or tail tip, whichever points at the herd's track, stays `off` metres short of it
        const c = Math.cos(yaw), s = Math.sin(yaw); let lo = 1e9, hi = -1e9;
        for (const h of [[1, 2.6], [-1, 2.6], [1, -2.5], [-1, -2.5], [0, 0]]) { const y = bed.full(x + (h[0] * c + h[1] * s) * sc, z + (-h[0] * s + h[1] * c) * sc); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        if (hi - lo > 0.15 || (best && waterY - hi <= best.depth + 1e-6)) continue;
        // a live reed within KEEP of it: the place is measured as the band the animal can fill (tail tip to snout along its
        // axis, 2.6 m either side at full size: its tail's widest swing), since its true outline exists only once it is made
        let reed = false;
        for (const q of spitReeds) { const t = clamp(((q.x - x) * s + (q.z - z) * c) / sc, -17.7, 13) * sc; if (Math.hypot(q.x - x - s * t, q.z - z - c * t) < 2.6 * sc + KEEP + q.r) { reed = true; break; } }
        if (!reed) best = { x, z, yaw, sc, depth: waterY - hi, bedY: (lo + hi) / 2 };
      }
      const wSpec = { phase: 0.05, neckPhase: rW(), tailPhase: rW(), tint: rW.range(-0.1, 0.08), neckSway: rW.range(0.05, 0.09), neckLean: rW.range(-0.12, 0.12), tailAmp: rW.range(0.7, 1.1) };
      if (best && best.depth >= 0.3) wader = hero.addWader({ x: best.x, z: best.z, bedY: best.bedY, yaw: best.yaw, scale: best.sc, muzzleY: waterY + 0.04, ...wSpec });
      // its outline in the plan: the least distance from a spot of the ground to its capsules (body, legs, neck, head, tail),
      // whatever the height, at any moment of a minute of its slow sway (its tail's swing, its neck's sway and its nod each come round at least twice)
      // (with `under`, only whether it comes under lim is asked: a height that the height measured below it at that moment already shows to be clear of lim is not measured)
      const neckOff = (x, z, lim, dt, dy, under) => { let d = 1e9; for (let t = 0; t < 60 && d >= lim; t += dt) for (let y = best.bedY, clear = -1e9; y <= best.bedY + 5.5 * best.sc; y += dy) { if (y < clear) continue; const c = wader.clearance(x, y, z, t); d = Math.min(d, c); if (under) clear = y + c - lim - 1e-6; } return d; };
      const known = [];                                                                  // spots already measured and found clear: [x, z, what the look that cleared it measured, less that look's own allowance]
      const byNeck = (x, z, r) => {                                                      // does a stand of radius r rooted at (x, z) come within KEEP of it?
        const lim = KEEP + r + 0.06;                                                     // 0.06: what steps of 0.8 s and 0.5 m can miss
        if (!wader) return false;
        // first, without measuring: no distance to the outline changes by more than the spot moves, so at a spot d metres from a
        // known one the look that cleared the known one measures no less than it did there, less d; where that is still beyond
        // this spot's own bound, that look clears this spot too and the answer is the same as measuring would give (1e-6: rounding)
        for (let i = known.length - 1; i >= 0; i--) if (known[i][2] - Math.hypot(x - known[i][0], z - known[i][1]) > lim + 1e-6) return false;
        const c = wader.clearance(x, best.bedY + 2.75 * best.sc, z, 0);
        if (c > lim + 8 * best.sc) { known.push([x, z, c - 8 * best.sc]); return false; }                     // nowhere near: half its height and its tail's whole swing are allowed for
        const g = neckOff(x, z, lim, 60, 1.5);
        if (g > lim + 5.6 * best.sc) { known.push([x, z, g - 5.6 * best.sc]); return false; }                 // nor at any height, as it stands at one moment
        const d = neckOff(x, z, lim, 2.3, 1.5);
        if (d >= lim) known.push([x, z, d - 0.6]);                                       // the whole coarse look was made (it stops early only under lim)
        return d < lim || (d < lim + 0.6 && neckOff(x, z, lim, 0.8, 0.5, true) < lim);   // looked at closely only where the coarse look cannot tell
      };
      await ctx.yield();
      // --- the margin: beds of horsetail on the damp shore and in the shallows, quillwort tufts among and beside them
      const solid = flora.reedGeometry({ rng: rM, height: 1, blades: 1, cattails: 0 }).attributes.uv.array;      // the kit atlas's solid cell
      const hg = stemBedGeometry(rM, { stems: 14, height: 2.6, radius: 0.8, width: 0.24, lean: 0.13, sway: 0.1, uv: solid,
        colors: [deepC.clone().multiplyScalar(0.75), fernH.clone().lerp(deepC, 0.62), fernH.clone().lerp(deepC, 0.34), fernH.clone().lerp(deepC, 0.08)] });
      const qg = stemBedGeometry(rM, { quill: true, stems: 14, height: 0.85, radius: 0.1, width: 0.09, sway: 0.04, uv: solid,
        colors: [deepC.clone().multiplyScalar(0.7), fernH.clone().lerp(deepC, 0.5), fernH.clone().lerp(deepC, 0.3), fernH.clone().lerp(deepC, 0.15)] });
      await ctx.yield();
      const hs = [], qs = [], nH = Math.round(250 * detail), nQ = Math.round(380 * detail);
      const plant = (x, z, quill, cap) => {
        const list = quill ? qs : hs, s = quill ? rM.range(0.7, 1.25) : rM.range(0.8, 1.2), rot = rM() * 6.2832;       // every throw's size and turn are drawn, whether it is admitted or not
        if (list.length >= cap || Math.abs(x) < (quill ? 10 : 12)) return;               // the herd's track stays bare gravel, as it is everywhere else
        const y = groundAt(x, z);
        if (quill ? (y < shoreY - 0.45 || y > shoreY - 0.05) : (y < shoreY - 0.5 || y > shoreY + 0.1)) return;         // rooted in the shallows of the usual waterline
        if (byNeck(x, z, (quill ? qg : hg).userData.radius * s)) return;                 // and KEEP metres, and its own radius, clear of the long-neck
        list.push({ x, y, z, s, rot, d: 0, u: 0, v: 0 });
      };
      for (const sp of spitsHere) {
        for (let i = 0, n0 = hs.length; i < 60 && hs.length < n0 + 8; i++) { const a = rM() * 6.2832, q = rM.range(0.25, 0.78); plant(sp.x + Math.cos(a) * q * sp.rx, sp.z + Math.sin(a) * q * sp.rz, false, n0 + 8); }
        await ctx.yield();
        for (let i = 0, n0 = qs.length; i < 80 && qs.length < n0 + 10; i++) { const a = rM() * 6.2832, q = rM.range(0.3, 0.85); plant(sp.x + Math.cos(a) * q * sp.rx, sp.z + Math.sin(a) * q * sp.rz, true, n0 + 10); }
        await ctx.yield();
      }
      for (let i = 0, cx = 0, half = 1, line = zN; i < 9000 && (hs.length < nH || qs.length < nQ); i++) {
        if (i % 16 === 0) { await ctx.yield(); cx = (rM() < 0.5 ? -1 : 1) * (12 + 88 * Math.pow(rM(), 1.3)); half = rM.range(4, 10); line = rM() < 0.56 ? zN : zS; }   // a new bed, on the island's shore or the bar's; the build is handed back, if it is due, once every bed of sixteen throws
        const quill = i % 16 >= 7, x = cx + rM.range(-half, half) * (quill ? 1.25 : 1), zp = line + rM.range(-4, 5);
        plant(x, zp - warp(x), quill, quill ? nQ : nH);                                  // a throw is dealt even when its kind is full, so a smaller count has the same places, sizes and turns, with its last plants left out
      }
      for (const [pts, g, sink, rS] of [[hs, hg, 0.04, rH], [qs, qg, 0.1, rQ]]) {
        if (!pts.length) continue;
        await ctx.yield();
        const sc = flora.makeScatter({ rng: rS, points: pts, heightAt: groundAt, material: treeMat, variants: [g], tint: 0.15, sink, tilt: 0.06 });
        scene.add(sc.object); live.push(sc);
      }
      await ctx.yield();
      // --- on the water: the rafts, a darker foot under every horsetail bed that stands in it, the long-neck's wakes and rings
      const dec = [];                                                                    // 12 numbers each: x, z (rafts: channel line), half length, half width | kind, seed, tone, drift m/s | turn, phase, leg scale, -
      for (let i = 0, n = 0, nR = Math.round(260 * detail); i < nR * 8 && n < nR; i++) {
        const zp = rF.range(zS - 3, zN + 3), big = rF(), keep = rF(), x0 = rF.range(-LOOP, LOOP), tone = rF(), sd = rF(), turn = rF.range(-0.3, 0.3), slim = rF.range(0.42, 0.75), sp = rF.range(0.8, 1.2);
        const d = waterY - bed.lin(zp), main = smoothstep(0.3, 0.95, d / Math.max(waterY, 0.1));     // 0 in the slack shallows, 1 in a main channel
        if (d < 0.06 || keep > 1 - 0.7 * main) continue;                                             // none where the bed stands dry; fewer and smaller toward a main channel
        const a = (1.2 + 6.6 * big * big) * (1 - 0.35 * main);
        dec.push(x0, zp, a, a * slim, 0, sd, tone, (0.3 + 0.45 * main) * sp, turn, 0, 0, 0); n++;
      }
      const nRaft = dec.length / 12;
      for (const p of hs) if (p.y < waterY - 0.03) dec.push(p.x - 0.5 * p.s, p.z, 2.7 * p.s, 1.5 * p.s, 1, p.rot / 6.2832, 0, 0, 0, 0, 0, 0);   // its foot's pattern from the stand's own turn
      if (wader) {
        const k = Math.max(wader.scale, 0.45);
        for (const f of wader.feet) dec.push(f[0] - 2.5 * k, f[1], 5 * k, 3.2 * k, 2, rW(), 0, 0, 0, 0, k, 0);
        dec.push(wader.muzzle[0], wader.muzzle[2], 3.4, 3.4, 3, 0, 0, 0, 0, rW(), 0, 0);
      }
      if (dec.length) {
        const n = dec.length / 12, iP = new Float32Array(n * 4), iQ = new Float32Array(n * 4), iR = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { iP[i * 4 + j] = dec[i * 12 + j]; iQ[i * 4 + j] = dec[i * 12 + 4 + j]; iR[i * 4 + j] = dec[i * 12 + 8 + j]; }
        const pos = [0, 0, 0], idx = [];
        for (let r = 0; r < 2; r++) for (let a = 0; a < 8; a++) { const an = (a + 0.5 * r) / 8 * 6.2832, q = r ? 1 : 0.55; pos.push(Math.cos(an) * q, 0, Math.sin(an) * q); }
        for (let a = 0; a < 8; a++) { const b = (a + 1) % 8; idx.push(0, 1 + b, 1 + a, 1 + a, 1 + b, 9 + a, 1 + b, 9 + b, 9 + a); }
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3)); g.setIndex(idx);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 4));
        g.instanceCount = n;
        const mat = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false });
        const hG = {}; fernH.getHSL(hG);
        const green = new THREE.Color().setHSL(hG.h - 0.022, hG.s, hG.l * 1.08), rust = new THREE.Color().setHSL(0.042, 0.42, hG.l).lerp(fernH, 0.15);    // a living fern green from the hour's own fern, slightly olive; rust-brown old fronds at the hour's own depth with a little of its fern in them (the numbers are taken in the linear working space: #73614d by morning, #6a5949 at dawn, #73614b in the golden hour, #53463c by night; soft enough in saturation that by night they keep some blue and do not sink under the water's)
        const lightC = U.uAmbCol.value.clone().multiplyScalar(0.8).add(U.uSunCol.value.clone().multiplyScalar(0.45));                       // the light the world's foam takes (foamCol without its pearl)
        lightC.multiplyScalar(0.8 / Math.max((lightC.r + lightC.g + lightC.b) / 3, 1e-3));                                                  // its colour, not its level (evened over the three channels, so a blue night light is not scaled up by its low luminance): the hour's level is already in the palette's fern, as it is in the sheet's own colours
        const own = {
          uRLight: { value: lightC },
          uRWater: { value: new THREE.Color(palette[3]).multiplyScalar(0.42) }, uRSky: { value: skyH.clone().multiplyScalar(0.7) }, uAn: shadowU.uAn, uShd: shadowU.uShd,           // the water sheet's own body colour and the herd's shadows on it
          uRT: time, uRWaterY: U.uWaterY, uRLoop: { value: LOOP }, uRSpitTop: { value: bed.spitTop }, uRBed: { value: bed.arr }, uRBedR: { value: new THREE.Vector2(BZ0, (NB - 1) / (BZ1 - BZ0)) },
          uRPh: { value: new THREE.Vector4(bed.ph[0], bed.ph[1], bed.ph[2], bed.ph[3]) }, uRSpit: { value: bed.spits.map((q) => new THREE.Vector4(q.x, q.z, 1 / q.rx, 1 / q.rz)) },
          uRGreen: { value: green }, uRPale: { value: green.clone().lerp(pearl, 0.18) }, uRRust: { value: rust }, uRDark: { value: deepC.clone().multiplyScalar(0.22) }, uRFoam: { value: foamCol },
        };
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, own, { uMist: U.uMist, uMistCol: U.uMistCol, uSunDirW: U.uSunDirW });
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', /* glsl */`#include <common>
              attribute vec4 iP; attribute vec4 iQ; attribute vec4 iR;
              uniform float uRT, uRWaterY, uRLoop, uRSpitTop; uniform float uRBed[${NB}]; uniform vec2 uRBedR; uniform vec4 uRPh; uniform vec4 uRSpit[${NSPIT}];
              varying vec2 vRL; varying vec2 vRM; varying vec4 vRI; varying vec3 vRD; varying vec2 vRW;
              float rfLin(float z){ float f = clamp((z - uRBedR.x) * uRBedR.y, 0., ${NB - 1.001}); int i = int(f); return mix(uRBed[i], uRBed[i + 1], f - float(i)); }
              float rfWarp(float x){ return smoothstep(30., 150., abs(x)) * (26. * sin(x * 0.0105 + uRPh.x) + 15. * sin(x * 0.0231 + uRPh.y)); }
              float rfBed(vec2 p){                                   // the river's bed, as the water sheet reads it
                float ax = abs(p.x), zp = p.y + rfWarp(p.x), y = rfLin(zp);
                y += (1. - smoothstep(2.1, 2.5, y)) * smoothstep(30., 95., ax) * 0.95 * sin(p.x * 0.021 + zp * 0.045 + uRPh.z) * sin(p.x * 0.009 - zp * 0.02 + uRPh.w);
                float bar = smoothstep(1.3, 1.5, y) * (1. - smoothstep(2.0, 2.3, y));
                y -= bar * 0.62 * smoothstep(0.3, 0.8, sin(p.x * 0.29 + zp * 0.13 + uRPh.z) * sin(zp * 0.21 - p.x * 0.08 + uRPh.w));
                for (int i = 0; i < ${NSPIT}; i++) { vec2 q = (p - uRSpit[i].xy) * uRSpit[i].zw; float w = max(1. - dot(q, q), 0.); y += w * w * max(uRSpitTop - y, 0.); }
                return y;
              }`)
            .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0., 1., 0.);')
            .replace('#include <begin_vertex>', /* glsl */`
              float rKind = iQ.x, rFade = 1.; vec2 rc = iP.xy;
              if (rKind < 0.5) {
                // a raft rides its own line of the channel downstream (the river runs toward -X), follows the meander, and is
                // pushed out round every spit; it comes round again far upstream, faded in and out at the ends of the reach
                float rx = mod(iP.x - uRT * iQ.w + uRLoop, 2. * uRLoop) - uRLoop, rz = iP.y - rfWarp(rx);
                for (int i = 0; i < ${NSPIT}; i++) {
                  vec2 q = (vec2(rx, rz) - uRSpit[i].xy) * uRSpit[i].zw; float k = max(1.5 - q.x * q.x, 0.);
                  rz += (iP.y < uRSpit[i].y ? -1. : 1.) * (sqrt(q.y * q.y + k) - abs(q.y)) / uRSpit[i].w;
                }
                rc = vec2(rx, rz); rFade = smoothstep(uRLoop, uRLoop - 30., abs(rx));
              }
              float rRad = length(position.xz);
              vec2 rl = position.xz * (rKind < 0.5 ? 1.9 : 1.);     // a raft's disc is cut wide: its own lobed outline, its ragged edge and the pieces beside it are drawn per pixel
              vec2 rm = rl * iP.zw; float rca = cos(iR.x), rsa = sin(iR.x);
              vec3 transformed = vec3(rc.x + rm.x * rca - rm.y * rsa, uRWaterY + 0.035, rc.y + rm.x * rsa + rm.y * rca);
              if (rKind < 0.5) transformed.y += 0.06 * max(1. - rRad * rRad * 3.6, 0.) + 0.025 * sin(uRT * 0.8 + rc.x * 0.31 + iQ.y * 30.);   // domed in its middle, its rim in the surface
              vRL = rl; vRM = rm; vRI = vec4(rKind, iQ.y, iQ.z, rFade); vRD = vec3(uRWaterY - rfBed(transformed.xz), iR.y, iR.z); vRW = transformed.xz;`);
          sh.fragmentShader = sh.fragmentShader
            .replace('#include <common>', /* glsl */`#include <common>
              varying vec2 vRL; varying vec2 vRM; varying vec4 vRI; varying vec3 vRD; varying vec2 vRW;
              uniform float uRT; uniform vec3 uRGreen, uRPale, uRRust, uRDark, uRFoam, uRLight, uRWater, uRSky;
              vec3 rEmis;
              ${MIST_GLSL}
              ${SHADOW_GLSL}
              float rfH3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
              float rfV(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);                 // the water sheet's own noise, so its ripple and sun patches can be met
                return mix(mix(mix(rfH3(i), rfH3(i + vec3(1,0,0)), f.x), mix(rfH3(i + vec3(0,1,0)), rfH3(i + vec3(1,1,0)), f.x), f.y),
                           mix(mix(rfH3(i + vec3(0,0,1)), rfH3(i + vec3(1,0,1)), f.x), mix(rfH3(i + vec3(0,1,1)), rfH3(i + vec3(1,1,1)), f.x), f.y), f.z); }
              float rfW(float fp, float s){ return 1. - smoothstep(0.35, 1.1, fp * s); }                     // how much of a pattern of s cells a metre a pixel of footprint fp still resolves
              float rfH(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
              float rfN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
                return mix(mix(rfH(i), rfH(i + vec2(1., 0.)), f.x), mix(rfH(i + vec2(0., 1.)), rfH(i + vec2(1., 1.)), f.x), f.y); }`)
            .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
              {
                float e = 1. - length(vRL), wetK = smoothstep(0.03, 0.2, vRD.x), sd = vRI.y * 61.;
                float rl1 = length(dFdx(vRM)), rl2 = length(dFdy(vRM)), fp = max(sqrt(rl1 * rl2), 0.35 * max(rl1, rl2));   // metres of the decal under this pixel (taken before any branch)
                vec3 c = uRDark; float a = 0.; rEmis = vec3(0.);
                if (vRI.x < 0.5) {
                  // a mat of small floating fern lying IN the surface: a lobed outline broken into a ragged edge with pieces
                  // beside it, gaps of open water in it, clumps light and dark, a living fern green going to rust-brown in
                  // its older fronds, a waterlogged darker rim, the river's own ripple washing a little way over its edge.
                  // Every pattern is filtered by the footprint of the pixel on the mat (screen-space derivatives): what a
                  // pixel can no longer resolve goes to its mean, and every threshold laid on it widens by the spread of
                  // what went (0.37 = 1.73 x the noise's own spread of 0.214), so it goes toward its mean coverage:
                  // a mat keeps nearly its share of open water, of loose pieces and of edge as the pixel on it grows.
                  float ang = atan(vRL.y, vRL.x);
                  float er = 1. - length(vRL) / (1. + 0.2 * sin(ang * 3. + vRI.y * 40.) + 0.11 * sin(ang * 5. + vRI.y * 17.));   // the mat's own lobed outline (as dealt), per pixel
                  if (er < -0.3) discard;
                  float w0 = rfW(fp, 0.45), w1 = rfW(fp, 0.8), wc = rfW(fp, 1.7), wf = rfW(fp, 1.9), w26 = rfW(fp, 2.6), w5 = rfW(fp, 5.3), w9 = rfW(fp, 9.), w21 = rfW(fp, 21.), wr = rfW(fp, 2.1);
                  float n0 = mix(0.5, rfN(vRM * 0.45 + sd * 2.3), w0), n1 = mix(0.5, rfN(vRM * 0.8 + sd), w1);
                  float nc = mix(0.5, rfN(vRM * 1.7 + sd * 4.1), wc), n2 = mix(0.5, rfN(vRM * 2.6 + sd * 1.7), w26);
                  float n5 = mix(0.5, rfN(vRM * 5.3 + sd * 3.1), w5), n9 = mix(0.5, rfN(vRM * 9. + sd), w9), n21 = mix(0.5, rfN(vRM * 21. + sd), w21);
                  float q0 = 1. - w0 * w0, q1 = 1. - w1 * w1, qc = 1. - wc * wc, qf = 1. - wf * wf, q26 = 1. - w26 * w26, q5 = 1. - w5 * w5, q9 = 1. - w9 * w9, q21 = 1. - w21 * w21;   // the share of each pattern's spread the pixel no longer resolves
                  float uE = 0.37 * sqrt(0.16 * q1 + 0.09 * q26 + 0.0196 * q5), uG = 0.37 * sqrt(0.4225 * q26 + 0.16 * q1 + 0.09 * qc), uF = 0.37 * sqrt(0.49 * qf + 0.09 * q5);   // for the edge, the gaps, the pieces
                  float uC = 0.37 * sqrt(0.3025 * qc + 0.2025 * q1), uL = 0.37 * sqrt(0.1764 * q5 + 0.0784 * q9 + 0.09 * q21), uT = 0.37 * sqrt(0.16 * q0 + 0.09 * qc), uR = 0.32 * sqrt(1. - wr * wr);   // for the clumps, the leaflets, the tone, the sheet's ripple (its noise spreads 0.184)
                  float ee = er + 0.4 * (n1 - 0.5) + 0.3 * (n2 - 0.5) + 0.14 * (n5 - 0.5);
                  float body = smoothstep(0.08 - uE, 0.2 + uE, ee);
                  float gap = 0.5 + 0.65 * (n2 - 0.5) + 0.4 * (n1 - 0.5) + 0.3 * (nc - 0.5) + 0.2 * smoothstep(0.1 - uE, 0.6 + uE, ee);
                  float fr = 0.7 * mix(0.5, rfN(vRM * 1.9 + sd * 5.), wf) + 0.3 * n5;
                  float frag = smoothstep(0.6 - uF, 0.68 + uF, fr) * smoothstep(-0.24, -0.1, er) * (1. - body);       // small pieces broken off, close by
                  float flow = 0.55 + 0.9 * clamp(vRD.x, 0., 1.2);
                  float rip = mix(0.5, rfV(vec3(vRW.x * 0.34 + uRT * 0.85 * flow, vRW.y * 2.1 + 0.6 * sin(vRW.x * 0.05 + uRT * 0.1), uRT * 0.2)), wr);   // the sheet's ripple here
                  float wash = smoothstep(0.5 - uR, 0.68 + uR, rip) * (1. - smoothstep(0.2 - uE, 0.42 + uE, ee));    // it runs a little way over the mat's edge
                  float cover = max(body * smoothstep(0.27 - uG, 0.38 + uG, gap) * (1. - 0.6 * wash), frag);
                  float halo = 0.22 * smoothstep(-0.02 - uE, 0.1 + uE, ee) * smoothstep(-0.3, -0.2, er);               // a thin calm dark margin of water round it
                  a = cover + halo * (1. - cover);
                  if (a * wetK * vRI.w < 0.004) discard;
                  float wet = max(max(1. - smoothstep(0.2 - uE, 0.27 + uE, ee), 1. - smoothstep(0.38 - uG, 0.46 + uG, gap)), 0.4 * frag);  // waterlogged at the rim and round every gap, a little in every piece
                  float tone = vRI.z + 0.4 * (n0 - 0.5) + 0.3 * (1. - smoothstep(0.05 - uE, 0.5 + uE, ee)) + 0.3 * (nc - 0.5);
                  vec3 fern = mix(uRGreen, uRRust, smoothstep(0.3 - uT, 0.85 + uT, tone));
                  float leaf = 0.7 * (0.6 * n5 + 0.4 * n9) + 0.3 * n21;                                                                           // the leaflets: three patterns in fixed shares (0.42, 0.28, 0.3); each goes to its mean by its own weight and none takes over another's share
                  float val = 0.85 + 0.7 * (leaf - 0.5) + 0.62 * (0.55 * nc + 0.45 * n1 - 0.5) + 0.25 * (n0 - 0.5);                              // light and dark: leaflets, then clumps
                  fern = mix(fern, uRPale, 0.15 * smoothstep(0.55 - uL, 0.8 + uL, leaf)) * val;
                  fern *= 1. + 0.2 * dot(normalize(vRL + 1e-4), normalize(uSunDirW.xz + 1e-4)) * (1. - smoothstep(0.08 - uE, 0.45 + uE, ee));   // the edge toward the sun lit, the edge away from it shaded (taken in the mat's own frame: its turn, up to 0.3 rad, is not counted)
                  // lit as the sheet beside it is: the world's own light, the sheet's slow sun patches and the herd's shadows; drawn toward the water's body colour, most where it is wet
                  float sunP = 0.85 + 0.45 * smoothstep(0.5, 0.8, rfV(vec3(vRW.x * 0.06 + uRT * 0.05, vRW.y * 0.1, 9.))), shd = sfShadow(vec3(vRW.x, 0., vRW.y));
                  vec3 wat = uRWater * sunP * (1. - 0.78 * shd);
                  vec3 fc = mix(fern * uRLight * sunP * (1. - 0.7 * shd) * (1. - 0.35 * wet), wat, 0.12 + 0.3 * wet) + uRSky * 0.06 * smoothstep(0.45 - uC, 0.8 + uC, 0.55 * nc + 0.45 * n1) * (1. - 0.7 * shd);   // and a soft wet sheen of the sky the sheet reflects, on its lighter clumps (no bright specks: nothing here flowers)
                  c = vec3(0.); rEmis = mix(wat * 0.6, fc, cover / max(a, 1e-3));
                } else if (vRI.x < 1.5) {
                  a = 0.62 * smoothstep(0., 0.7, e) * (0.65 + 0.35 * rfN(vRM * 1.3 + sd));          // the dark foot of a horsetail bed
                } else if (vRI.x < 2.5) {
                  // the current parting round one standing leg, as it does round the herd's: a bow ring and a V trailing downstream
                  float k = vRD.z, u = 2.5 - vRM.x / k, v = vRM.y / k, r = length(vec2(u, v));
                  float n = rfN(vec2(u * 1.6 + uRT * 1.6, v * 2.2 + sd));
                  float bow = smoothstep(0.22, 0., abs(r - 0.92)) * smoothstep(0.6, -0.4, u) * 0.9, arm = abs(v) - (0.75 + 0.36 * max(u, 0.));
                  float vee = smoothstep(0.3, 0., abs(arm)) * smoothstep(-0.3, 0.6, u) * (0.35 + 0.65 * n);
                  float rip = (0.5 + 0.5 * sin((arm + 0.3) * 7. + uRT * 3.)) * smoothstep(0., -0.4, arm) * smoothstep(-1.6, -0.5, arm) * smoothstep(0.4, 1.5, u) * 0.25;
                  float trail = smoothstep(0.75, 0.2, abs(v) / (0.5 + 0.12 * max(u, 0.))) * smoothstep(0.5, 1.2, u) * smoothstep(0.45, 0.8, n) * 0.7;
                  a = clamp((bow + vee + rip + trail) * smoothstep(7.5, 4.5, u) * smoothstep(0., 0.12, e), 0., 1.) * 0.8; c = vec3(0.); rEmis = uRFoam;
                } else {
                  // rings spreading from the muzzle as it dips
                  float r = length(vRM), ring = 0.;
                  for (int j = 0; j < 3; j++) { float tau = fract(uRT / 3.6 + vRD.y + float(j) / 3.); ring += smoothstep(0.15, 0., abs(r - (0.3 + 2.7 * tau))) * (1. - tau) * (1. - tau); }
                  a = clamp(ring, 0., 1.) * 0.6 * smoothstep(0., 0.15, e); c = vec3(0.); rEmis = uRFoam;
                }
                a *= wetK * vRI.w;
                if (a < 0.004) discard;
                diffuseColor = vec4(c, a);
              }`)
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += rEmis;')
            // what lies on the water takes the mist as the water sheet under it does
            .replace('#include <fog_fragment>', '#include <fog_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, cameraPosition - vViewPosition * mat3(viewMatrix)), mix(0.48, 0.85, smoothstep(8., 110., length(vViewPosition))));');
        };
        mat.customProgramCacheKey = () => 'sf-reach';
        const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2.5; mesh.name = 'sf-reach-water';
        scene.add(mesh);
      }
      scene.userData.sfReach = { channel: [zS, zN], loop: LOOP, waterY, rafts: nRaft, horsetails: hs, quillworts: qs, decals: dec.length / 12, wader, wadeDepth: best ? best.depth : null, ms: performance.now() - t0 };
    }
    await ctx.yield();

    // ---------------------------------------------------------------- fauna
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const pteroCol = { body: '#6f665c', belly: '#b7ab98', wingC: '#5b5046', trail: '#40372f', tip: '#2c2620', head: look.crest.color, beak: '#d9c48e' };
    // (the clear air round the line, 14 Oct: all three of these wide scatters dealt a flier within a metre of the flown line, the
    // crossing at 0.12 m and the two rings at 0.24 and 0.84 m. Each flock keeps its course and the few too near are held off by
    // their own offsets, which in a cloud this wide moves nothing a frame can see.)
    fauna.add(F.makeFlock({ rng: rng.fork('flockA'), species: 'gulls', count: Math.round(58 * look.density), size: 0.95, center: [8, 17, -30], radius: 80, glide: 0.5, ...pteroCol, keepClear: { path, dist: 2, each: true } }));
    fauna.add(F.makeFlock({ rng: rng.fork('flockB'), species: 'gulls', count: Math.round(56 * look.density), size: 0.9, glide: 0.25, ...pteroCol,
      keepClear: { path, dist: 2, each: true },
      cross: { path, u: 0.13, lead: 36, angle: 52, side: -1, height: 6, rise: 13, span: 230, duration: DURATION } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('flockC'), species: 'gulls', count: 26, size: 0.95, center: [-10, 19, archZ - 40], radius: 46, glide: 0.6, ...pteroCol, keepClear: { path, dist: 2, each: true } }));
    fauna.add(F.makeDragonflies({ rng: rng.fork('dfA'), count: Math.round(85 * detail), path, uFrom: 0, uTo: 0.24, clear: 1.6, spread: 26, lift: [-2.3, 0.7], size: 2.4 }));
    fauna.add(F.makeDragonflies({ rng: rng.fork('dfB'), count: Math.round(55 * detail), path, uFrom: 0.26, uTo: 0.66, clear: 3.2, spread: 30, lift: [-2.2, 0.4], size: 2.4 }));
    await ctx.yield();

    // ---------------------------------------------------------------- atmosphere
    const set = fx.fxGroup(); scene.add(set.object);
    const mistColor = U.uMistCol.value.clone(), sunCol = sky.lightColor.clone();
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(1500 * detail), colors: [pearl.clone(), sunCol.clone().lerp(pearl, 0.4), pearl.clone().lerp(fernC, 0.3)],
      intensity: look.hour === 'night' ? 0.5 : 1 }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: rng.fork('mist'), time, count: 64, area: [300, 4, 520], center: [0, waterY + H.mistH * 0.8, 50], size: [18, 42], color: mistColor, opacity: look.season === 'dry' ? 0.07 : 0.15,
      drift: [1.0, 0, 0.2], sunDir, sunColor: sunCol }));
    if (look.season === 'dry') set.add(fx.makeMist({ rng: rng.fork('dust'), time, count: 60, area: [70, 3, 330], center: [0, 3.2, -60], size: [7, 16], color: gravelC.clone().lerp(pearl, 0.4), opacity: 0.32,
      drift: [0.7, 0.05, 0.5], sunDir, sunColor: sunCol }));
    await ctx.yield();
    const rayDir = [-sunDir.x, -sunDir.y, -sunDir.z];
    for (const z of [-150, -64, 14, 84]) {
      set.add(fx.makeGodRays({ rng: rng.fork('rays' + z), time, position: [sunDir.x * 24, 5 + sunDir.y * 24, z], direction: rayDir, radius: 30, count: 11, length: 50, width: [1.1, 3.2],
        color: sunCol, intensity: 2 * H.rays * (look.season === 'dry' ? 0.6 : 1), speed: 0.6 }));
    }
    // sun shafts standing in the mist between the animals: slanted sheets of beams that walk with the herd, bright bars
    // between the dark ones the legs and necks throw (one additive draw, intensity keyed to the path in update)
    const shaftU = { uT: time, uShd: shadowU.uShd, uShaft: { value: 0 }, uGeo: { value: new THREE.Vector4(waterY, H.mistH * 1.35, sunDir.x / Math.max(sunDir.y, 0.12), sunDir.z / Math.max(sunDir.y, 0.12)) },
      uCol: { value: sunCol.clone().multiply(U.uMistCol.value).multiplyScalar(0.21 * H.sunK * (look.season === 'dry' ? 0.6 : 1)) } };
    {
      const ad = hero.animals.filter((a) => a.walking && !a.juvenile), n = ad.length, arr = new Float32Array(n * 4), sr = ctx.core.makeRng('sf-shafts:' + ctx.seed);
      const sg = Math.sign(-sunDir.x) || 1;
      for (let i = 0; i < n; i++) { const a = ad[i]; arr.set([a.x + sg * sr.range(3, 8), a.z0 + (i % 2 ? 7.6 : -8.6) * a.scale + sr.range(-0.8, 0.8), sr.range(5, 8), sr()], i * 4); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
      const shafts = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: shaftU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aS; uniform vec4 uShd, uGeo; varying vec2 vQ; varying float vSeed; varying vec3 vD;
          void main(){
            float b = position.y * 0.5 + 0.5;
            vec3 wp = vec3(aS.x + position.x * aS.z + uGeo.z * uGeo.y * b, uGeo.x + uGeo.y * b, aS.y + uShd.z + uGeo.w * uGeo.y * b);
            vQ = vec2(position.x, b); vSeed = aS.w; vD = wp - cameraPosition;
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform float uT, uShaft; uniform vec3 uCol; varying vec2 vQ; varying float vSeed; varying vec3 vD;
          float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
          void main(){
            float a = vQ.x, b = vQ.y, dist = length(vD);
            float bands = smoothstep(0.52, 0.9, n(vec2(a * 4.2 + vSeed * 31., vSeed * 7. + uT * 0.05)));
            bands *= 0.55 + 0.45 * n(vec2(a * 9. + vSeed * 3., b * 2.2 - uT * 0.12));
            float e = 1. - a * a; e *= e;
            float I = bands * e * smoothstep(1., 0.4, b) * smoothstep(0., 0.05, b) * smoothstep(2., 13., abs(vD.z)) * exp(-dist * 0.016) * smoothstep(150., 90., dist) * uShaft;
            gl_FragColor = vec4(uCol * I, 1.);
          }`,
      }));
      shafts.frustumCulled = false; shafts.renderOrder = 5; scene.add(shafts);
    }
    set.add(fx.makeParticles({ rng: rng.fork('needles'), preset: 'leaves', time, follow: false, center: [0, barY + 13, archZ + 6], box: [36, 15, 18], count: 240, size: [0.07, 0.16],
      colors: [deepC.clone(), fernC.clone().lerp(deepC, 0.5), '#6b5a34'], lightDir: sunDir }));
    await ctx.yield();

    // ---------------------------------------------------------------- far marks: volcano and plume, shower curtain, hunters
    const farGroup = new THREE.Group(); scene.add(farGroup);
    const volDir = new THREE.Vector3(Math.sin(35 * Math.PI / 180), 0, Math.cos(35 * Math.PI / 180)), volLeft = new THREE.Vector3(volDir.z, 0, -volDir.x);
    const hazeCol = sky.colorAt(new THREE.Vector3(volDir.x, 0.04, volDir.z).normalize(), new THREE.Color());
    {
      const prof = [[0, 250], [26, 252], [60, 205], [130, 138], [250, 70], [430, 26], [700, 0]].map((p) => new THREE.Vector2(p[0], p[1]));
      const cone = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), new THREE.ShaderMaterial({
        uniforms: { uHaze: { value: hazeCol }, uRock: { value: new THREE.Color(look.hour === 'night' ? '#1a2434' : '#5f6f78') }, uSun: { value: sunDir }, uLit: { value: sky.lightColor.clone().multiplyScalar(look.hour === 'night' ? 0.12 : 0.3) } },
        vertexShader: 'varying vec3 vN; varying float vH; void main(){ vN = normal; vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uHaze, uRock, uSun, uLit; varying vec3 vN; varying float vH; void main(){ vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); float l = max(dot(n, uSun), 0.); vec3 c = uRock * 0.55 + uLit * l; gl_FragColor = vec4(mix(uHaze, c, 0.2 + 0.14 * smoothstep(20., 250., vH)), 1.); }',
      }));
      cone.position.copy(volDir).multiplyScalar(3300); cone.position.y = -6; cone.frustumCulled = false; farGroup.add(cone);
      const pg = new THREE.PlaneGeometry(1, 1, 24, 1);
      const plume = new THREE.Mesh(pg, new THREE.ShaderMaterial({
        uniforms: { uT: time, uHaze: { value: hazeCol }, uCol: { value: new THREE.Color(look.hour === 'night' ? '#2a3446' : look.hour === 'morning' ? '#8f979c' : '#9a8f90') } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: /* glsl */`uniform float uT; uniform vec3 uHaze, uCol; varying vec2 vUv;
          float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
          void main(){
            float x = vUv.x, y = vUv.y - 0.5;
            float w = 0.06 + 0.4 * sqrt(x) * (1. - 0.4 * x);
            float f = n(vec2(x * 9. - uT * 0.035, y * 5.)) * 0.6 + n(vec2(x * 23. - uT * 0.07, y * 11. + 3.)) * 0.4;
            float a = smoothstep(w, w * 0.25, abs(y + 0.08 * (f - 0.5))) * smoothstep(0., 0.03, x) * (1. - smoothstep(0.55, 1., x)) * (0.45 + 0.55 * f);
            gl_FragColor = vec4(mix(uHaze, uCol * (0.75 + 0.5 * f + 0.4 * y), 0.5), a * 0.8);
          }`,
      }));
      plume.scale.set(2300, 300, 1); plume.frustumCulled = false; plume.renderOrder = 0;
      plume.position.copy(volDir).multiplyScalar(3300).addScaledVector(volLeft, 1130); plume.position.y = 262;
      plume.lookAt(plume.position.x - volDir.x, 262, plume.position.z - volDir.z);
      farGroup.add(plume);
      if (new THREE.Vector3(1, 0, 0).applyQuaternion(plume.quaternion).dot(volLeft) < 0) plume.scale.x = -2300;   // the vent end sits on the summit
      if (rainy) {
        // a grey shower curtain crossing the far plain
        const sg = new THREE.PlaneGeometry(1, 1, 1, 1);
        const smat = new THREE.ShaderMaterial({
          uniforms: { uT: time, uCol: { value: hazeCol.clone().multiplyScalar(0.55) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
          fragmentShader: /* glsl */`uniform float uT; uniform vec3 uCol; varying vec2 vUv;
            float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
            void main(){
              float sx = vUv.x + 0.22 * (1. - vUv.y);
              float st = n(vec2(sx * 46., vUv.y * 2.2 + uT * 0.5)) * 0.6 + n(vec2(sx * 9. + uT * 0.01, 1.)) * 0.6;
              float a = smoothstep(0., 0.2, vUv.x) * smoothstep(1., 0.75, vUv.x) * smoothstep(1., 0.5, vUv.y) * smoothstep(0., 0.12, vUv.y) * (0.25 + 0.6 * st);
              gl_FragColor = vec4(uCol, a * 0.7);
            }`,
        });
        for (let i = 0; i < 3; i++) {
          const m = new THREE.Mesh(sg, smat), a = (0.15 + i * 0.42) + rng.range(-0.1, 0.1), d = 1900 + i * 260;
          m.scale.set(1300 + i * 300, 620, 1); m.position.set(Math.sin(a) * d, 300, Math.cos(a) * d); m.lookAt(0, 300, 0); m.frustumCulled = false; m.userData.drift = 3 + i;
          farGroup.add(m);
        }
      }
    }
    // rarely: three two-legged hunters far out on the left bank, watching the juveniles
    const hunters = [];
    if (look.hunters) {
      const hg = hunterGeometry(), hm = mistify(new THREE.MeshLambertMaterial({ color: look.hour === 'night' ? '#0c1016' : '#22261f' }), U);
      let placed = 0; const hr = rng.fork('hunters');
      for (let i = 0; i < 200 && placed < 3; i++) {
        const x = hr.range(62, 110), z = hr.range(-230, -176), y = groundAt(x, z); if (y < 2.6) continue;
        const m = new THREE.Mesh(hg, hm); m.position.set(x + placed * 5, y, z + placed * hr.range(-6, 6)); m.rotation.y = Math.atan2(-m.position.x, -60 - m.position.z) + hr.range(-0.3, 0.3);
        m.scale.setScalar(hr.range(1.0, 1.25)); scene.add(m); hunters.push(m); placed++;
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the mount, and the rare bull's splash
    const mount = makeMount(look.crest, look.hour === 'night');
    scene.add(mount.object);
    let splash = null, uBull = 0;
    if (bullAt) {
      uBull = path.nearestXZ(0, bullAt.z).u;
      splash = makeSplash(rng.fork('splash'), U, time, [bullAt.x, waterY, bullAt.z], Math.round(300 * detail));
      scene.add(splash.object);
    }

    const tmpHead = new THREE.Vector3(), camPos = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3();
    const pois = [
      { at: (time_, u) => hero.matriarchHead(u * DURATION, tmpHead), from: uHead - 0.18, to: uHead + 0.026, weight: 0.9 },
      { at: [0, endY + 3, archZ], from: 0.84, to: 0.97, weight: 0.3 },
    ];
    if (bullAt) pois.unshift({ at: [bullAt.x, 10, bullAt.z + 4], from: uBull - 0.15, to: uBull - 0.012, weight: 0.55 });

    let tPrev = 0, tQ = 0, flying = false, wingPhase = 0;
    const mistBase = U.uMist.value.z;
    function update(dt, t, camera, u) {
      time.value = t;
      // the herd clock: path position while we fly; free-walking while the world is only seen through a portal,
      // then eased onto the path clock over the first tenth of the flight (whole gait periods, so phases match)
      let ht, zoff = 0;
      if (!(u > 0)) { if (flying) { flying = false; tPrev = 0; } tPrev = Math.min(tPrev + dt, 44); ht = tPrev; }
      else {
        if (!flying) { flying = true; tQ = Math.round(tPrev / PERIOD) * PERIOD; }
        const s = smoothstep(0, 0.1, u); ht = u * DURATION + tPrev + (tQ - tPrev) * s; zoff = -HERD_SPEED * tQ * s;
      }
      // the mist hall: thin over the prairie, dense through the slalom, torn open as we climb her neck into the sun
      const hall = smoothstep(0.14, 0.29, u) * (1 - smoothstep(uHead - 0.125, uHead - 0.03, u));
      U.uMist.value.z = mistBase * (0.8 + 1.85 * hall);
      shaftU.uShaft.value = 0.22 + 0.78 * hall;
      hero.setBlink(smoothstep(uHead + 0.004, uHead + 0.012, u) * (1 - smoothstep(uHead + 0.022, uHead + 0.032, u)));
      hero.setProgress(u); hero.setHerdTime(ht); hero.setZOffset(zoff);
      shadowU.uShd.value.z = HERD_SPEED * ht + zoff;
      if (bullAt) {
        const rear = smoothstep(uBull - 0.135, uBull - 0.075, u) * (1 - Math.pow(smoothstep(uBull - 0.035, uBull - 0.008, u), 2.2));
        hero.setRear(rear + 0.02 * Math.sin(t * 1.7) * rear);
        splash.set((u - (uBull - 0.011)) * DURATION, rear);
      }
      hero.update(dt, t, camera);
      sky.update(dt, t, camera); rig.update(dt, t, camera);
      fauna.update(dt, t, camera, u); set.update(dt, t, camera);
      for (const o of live) o.update(dt, t, camera);
      camPos.setFromMatrixPosition(camera.matrixWorld);
      farGroup.position.set(camPos.x, 0, camPos.z);
      for (const m of farGroup.children) if (m.userData.drift) m.position.x += dt * m.userData.drift;
      for (let i = 0; i < hunters.length; i++) hunters[i].rotation.z = 0.03 * Math.sin(t * 0.6 + i * 2.1);
      // the mount: beats over the prairie, folds for the stoop, glides the slalom, four hard beats up the neck, glides in
      path.tangentAt(clamp(u + 0.012, 0, 1), tA); path.tangentAt(clamp(u - 0.012, 0, 1), tB);
      let turn = Math.atan2(tA.x, tA.z) - Math.atan2(tB.x, tB.z); if (turn > Math.PI) turn -= 2 * Math.PI; if (turn < -Math.PI) turn += 2 * Math.PI;
      const fold = smoothstep(0.17, 0.215, u) * (1 - smoothstep(0.24, 0.3, u)) * 0.85 + 0.12 * smoothstep(0.27, 0.32, u) * (1 - smoothstep(0.58, 0.61, u));
      const climb = smoothstep(0.59, 0.615, u) * (1 - smoothstep(0.7, 0.735, u));
      const amp = (1 - smoothstep(0.16, 0.2, u)) * 1 + climb * 1.05 + smoothstep(0.76, 0.84, u) * 0.45 + 0.1;
      wingPhase += dt * 6.2832 * (1.5 + 1.2 * climb);
      mount.update(dt, t, camera, { presence: smoothstep(0.0, 0.022, u), turn, fold, amp, phase: wingPhase, pitch: tA.y });
    }

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: DURATION,
      // linger beside the matriarch's head: the brief's two-second hold
      pace: (u) => 1 - 0.52 * Math.exp(-Math.pow((u - uHead) / 0.04, 2)),
      ride: 'none',
      camera: { fov: 62, near: 0.2, far: 5200, lookAhead: 18, sway: 0.35, bank: 1 },
      pois,
      portal: { shape: 'circle', radius: 7, color: look.hour === 'night' ? '#bcd6ff' : look.hour === 'golden' ? '#ffd9a0' : look.hour === 'dawn' ? '#ffd8cc' : '#fff0c8', glow: 1, revealDistance: 260 },
      post: { exposure: H.exposure, bloom: { strength: H.bloom, radius: 0.62, threshold: 0.92 },
        grade: { saturation: H.sat * (rainy ? 1.06 : look.season === 'dry' ? 0.95 : 1), contrast: 1.1, tint: H.tint, shadowTint: H.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};

// ------------------------------------------------------------------------------------------------ small builders
// A stand of stiff upright horsetail stems (each a bottle-brush outline of bare triangles, dark at the root), or with
// o.quill a rosette of quillwort quills, for the flora kit's wind material; o.uv is the kit atlas's solid cell.
function stemBedGeometry(rng, o) {
  const P = [], N = [], C = [], Wd = [], T = [], I = [];
  const v = (x, y, z, nx, nz, c, sway, fl) => { P.push(x, y, z); const l = Math.hypot(nx, 0.85, nz); N.push(nx / l, 0.85 / l, nz / l); C.push(c.r, c.g, c.b); Wd.push(sway, fl, 1, 0); T.push(o.uv[0], o.uv[1]); return P.length / 3 - 1; };
  const rows = o.quill ? [[0, 1, 1], [1, 0, 3]] : [[0, 0.35, 0], [0.33, 1, 1], [0.68, 0.6, 2], [1, 0, 3]];       // [place along the stem, width, colour]
  for (let k = 0; k < o.stems; k++) {
    const a = rng() * 6.2832, r = o.radius * Math.sqrt(rng()), bx = Math.cos(a) * r, bz = Math.sin(a) * r, h = o.height * rng.range(0.6, 1);
    const f = o.quill ? a + 1.5708 : rng() * 6.2832, fx = Math.cos(f), fz = Math.sin(f), el = o.quill ? rng.range(0.6, 1.3) : 1.5708 - rng.range(0, o.lean);
    const dx = Math.cos(a) * Math.cos(el), dz = Math.sin(a) * Math.cos(el), dy = Math.sin(el), nx = Math.cos(a) * 0.5, nz = Math.sin(a) * 0.5;
    let prev = null;
    for (const [t, w, ci] of rows) {
      const cx = bx + dx * h * t, cy = dy * h * t, cz = bz + dz * h * t, hw = 0.5 * o.width * w, sway = t * t * h * o.sway, c = o.colors[ci];
      const cur = hw > 0 ? [v(cx - fx * hw, cy, cz - fz * hw, nx, nz, c, sway, 0.3 * t), v(cx + fx * hw, cy, cz + fz * hw, nx, nz, c, sway, 0.3 * t)] : [v(cx, cy, cz, nx, nz, c, sway, 0.3 * t)];
      if (prev) { if (cur.length === 2) I.push(prev[0], prev[1], cur[1], prev[0], cur[1], cur[0]); else I.push(prev[0], prev[1], cur[0]); }
      prev = cur;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2)); g.setIndex(I);
  g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData = { triangles: I.length / 3, height: g.boundingBox.max.y, radius: Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z), glowColor: null, kind: 'stems' };
  return g;
}
function makeGeo() {
  const P = [], C = [], I = [];
  const v = (p, c) => { P.push(p[0], p[1], p[2]); C.push(c[0], c[1], c[2]); return P.length / 3 - 1; };
  const up0 = new THREE.Vector3(0, 1, 0), tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  // pts: [{ p: [x,y,z], rx, ry, c: [r,g,b] }] swept into a tube with elliptical rings
  function spine(pts, sides = 8) {
    const base = P.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)].p, b = pts[Math.min(i + 1, n - 1)].p, q = pts[i];
      tan.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      side.crossVectors(Math.abs(tan.y) > 0.9 ? up.set(1, 0, 0) : up0, tan).normalize(); up.crossVectors(tan, side);
      for (let s = 0; s < sides; s++) {
        const an = s / sides * 6.2832, ca = Math.cos(an) * q.rx, sa = Math.sin(an) * q.ry, sh = 0.82 + 0.18 * Math.sin(an);
        v([q.p[0] + side.x * ca + up.x * sa, q.p[1] + side.y * ca + up.y * sa, q.p[2] + side.z * ca + up.z * sa], [q.c[0] * sh, q.c[1] * sh, q.c[2] * sh]);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) {
      const a = base + i * sides + s, b = base + i * sides + (s + 1) % sides, c = a + sides, d = b + sides;
      I.push(a, c, b, b, c, d);
    }
    const c0 = v(pts[0].p, pts[0].c), c1 = v(pts[n - 1].p, pts[n - 1].c);
    for (let s = 0; s < sides; s++) { I.push(c0, base + s, base + (s + 1) % sides); I.push(c1, base + (n - 1) * sides + (s + 1) % sides, base + (n - 1) * sides + s); }
  }
  const tri = (a, b, c, ca, cb, cc) => { I.push(v(a, ca), v(b, cb), v(c, cc)); };
  function build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
    g.computeVertexNormals(); return g;
  }
  return { spine, tri, build };
}
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// The crested pterosaur we ride, in the camera's own frame (eye at the origin, looking down -Z): the long-beaked head
// with its crest low in the centre, the wrists and finger struts of the wings rising into the lower corners on each beat.
function makeMount(crest, night) {
  const object = new THREE.Group(); object.matrixAutoUpdate = false;
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, metalness: 0, side: THREE.DoubleSide, fog: false });
  if (night) { mat.emissive = new THREE.Color('#1a2433'); mat.emissiveIntensity = 0.35; }
  const hide = lin('#6a5f55'), dark = lin('#3a322c'), pale = lin('#857968'), horn = lin('#9c8a66'), tipC = lin('#33291f');
  const rust = lin(crest.color, 1.05), rustD = lin(crest.color, 0.5), memb = lin('#6e6257'), membD = lin('#40372f');
  const hb = makeGeo();
  hb.spine([
    { p: [0, -0.2, 0.8], rx: 0.2, ry: 0.15, c: dark }, { p: [0, -0.12, 0.3], rx: 0.15, ry: 0.13, c: hide }, { p: [0, -0.04, -0.3], rx: 0.105, ry: 0.1, c: hide }, { p: [0, 0, -0.76], rx: 0.1, ry: 0.095, c: hide },
    { p: [0, 0.01, -0.95], rx: 0.13, ry: 0.11, c: hide }, { p: [0, 0, -1.18], rx: 0.125, ry: 0.1, c: pale }, { p: [0, -0.02, -1.42], rx: 0.088, ry: 0.075, c: horn },
    { p: [0, -0.07, -1.86], rx: 0.052, ry: 0.046, c: horn }, { p: [0, -0.12, -2.2], rx: 0.024, ry: 0.024, c: tipC }, { p: [0, -0.14, -2.34], rx: 0.004, ry: 0.004, c: tipC }], 10);
  const cr = crest.shape === 1
    ? [[-1.3, 0.09, 0.025, 0.016], [-1.1, 0.14, 0.07, 0.028], [-0.86, 0.2, 0.06, 0.024], [-0.62, 0.26, 0.03, 0.014], [-0.46, 0.3, 0.004, 0.004]]
    : crest.shape === 2
      ? [[-1.62, 0.03, 0.02, 0.012], [-1.45, 0.1, 0.09, 0.024], [-1.24, 0.16, 0.14, 0.03], [-1.05, 0.17, 0.12, 0.026], [-0.94, 0.14, 0.04, 0.014]]
      : [[-1.42, 0.07, 0.02, 0.012], [-1.26, 0.12, 0.07, 0.026], [-1.05, 0.18, 0.12, 0.032], [-0.86, 0.23, 0.1, 0.026], [-0.72, 0.27, 0.04, 0.014], [-0.66, 0.285, 0.004, 0.004]];
  hb.spine(cr.map((k, i) => ({ p: [0, k[1], k[0]], rx: k[3], ry: k[2], c: i === 0 ? rustD : rust })), 8);
  hb.spine([{ p: [0.1, 0.03, -1.12], rx: 0.03, ry: 0.03, c: tipC }, { p: [0.135, 0.03, -1.12], rx: 0.02, ry: 0.02, c: dark }], 6);
  hb.spine([{ p: [-0.1, 0.03, -1.12], rx: 0.03, ry: 0.03, c: tipC }, { p: [-0.135, 0.03, -1.12], rx: 0.02, ry: 0.02, c: dark }], 6);
  const head = new THREE.Mesh(hb.build(), mat); head.position.set(0, -0.6, -0.1); head.scale.setScalar(0.92); head.frustumCulled = false; object.add(head);
  const wb = makeGeo();
  const S = [0, 0, 0], E = [0.55, 0.03, -0.52], W = [1.42, 0, -1.52], Tp = [2.26, 0.03, -1.12], R1 = [1.78, -0.03, -0.22], R2 = [0.98, -0.04, 0.42], R3 = [0.05, -0.02, 0.6], M1 = [1.9, 0, -1.0];
  wb.spine([{ p: S, rx: 0.05, ry: 0.045, c: dark }, { p: E, rx: 0.04, ry: 0.036, c: dark }, { p: W, rx: 0.03, ry: 0.026, c: hide }, { p: M1, rx: 0.016, ry: 0.014, c: dark }, { p: Tp, rx: 0.005, ry: 0.005, c: dark }], 6);
  wb.spine([{ p: W, rx: 0.016, ry: 0.014, c: dark }, { p: R1, rx: 0.006, ry: 0.006, c: dark }], 5);
  wb.spine([{ p: W, rx: 0.016, ry: 0.014, c: dark }, { p: R2, rx: 0.006, ry: 0.006, c: dark }], 5);
  wb.spine([{ p: [W[0] - 0.02, 0.03, W[2] - 0.02], rx: 0.02, ry: 0.02, c: pale }, { p: [W[0] - 0.12, 0.05, W[2] - 0.3], rx: 0.004, ry: 0.004, c: dark }], 5);
  // the membrane: leather panels stretched between the finger struts, thin and warm where the light comes through,
  // dark along each strut, with a trailing edge scalloped between the strut tips
  const membL = lin('#a58768'), mix3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const panel = (a, b, c, d) => {         // a, b: strut roots; c, d: their tips (trailing edge runs c -> d)
    const root = mix3(a, b, 0.5), edge = mix3(mix3(c, d, 0.5), root, 0.2), mid = mix3(root, edge, 0.55);
    const e1 = mix3(mix3(c, edge, 0.5), root, 0.06), e2 = mix3(mix3(edge, d, 0.5), root, 0.06);
    wb.tri(a, c, mid, membD, membD, membL); wb.tri(c, e1, mid, membD, memb, membL); wb.tri(e1, edge, mid, memb, memb, membL);
    wb.tri(edge, e2, mid, memb, memb, membL); wb.tri(e2, d, mid, memb, membD, membL); wb.tri(d, b, mid, membD, membD, membL);
    if (a !== b) wb.tri(b, a, mid, membD, membD, membL);
  };
  panel(W, W, Tp, R1); panel(W, W, R1, R2); panel(E, W, R3, R2); wb.tri(S, E, R3, membD, membD, membD);
  wb.spine([{ p: E, rx: 0.014, ry: 0.012, c: dark }, { p: R3, rx: 0.005, ry: 0.005, c: dark }], 5);
  const wg = wb.build();
  const wingR = new THREE.Mesh(wg, mat), wingL = new THREE.Mesh(wg, mat);
  wingR.position.set(0.22, -0.8, -0.12); wingL.position.set(-0.22, -0.8, -0.12); wingL.scale.x = -1;
  wingR.frustumCulled = false; wingL.frustumCulled = false; object.add(wingR, wingL);
  const m4 = new THREE.Matrix4();
  let turnS = 0;
  function update(dt, t, camera, s) {
    object.visible = s.presence > 0.002;
    turnS += (s.turn - turnS) * Math.min(1, dt * 3);
    const beat = Math.sin(s.phase), th = 0.04 + s.amp * 0.23 * beat - s.fold * 0.1;
    object.matrix.copy(camera.matrixWorld).multiply(m4.makeTranslation(0, -(1 - s.presence) * 1.7 - 0.03 * s.amp * beat, 0));
    object.matrixWorldNeedsUpdate = true;
    const sx = 1 - 0.34 * s.fold;
    wingR.rotation.set(0.1 * s.amp * Math.cos(s.phase), -s.fold * 0.85, th + turnS * 0.5); wingR.scale.x = sx;
    wingL.rotation.set(0.1 * s.amp * Math.cos(s.phase), s.fold * 0.85, -th + turnS * 0.5); wingL.scale.x = -sx;
    head.rotation.set(-s.pitch * 0.15 + 0.012 * beat * s.amp, turnS * 0.55 + 0.06 * Math.sin(t * 0.43) + 0.03 * Math.sin(t * 1.1), turnS * 0.7);
  }
  return { object, update };
}

// a two-legged hunter, built only to be a silhouette in the ferns
function hunterGeometry() {
  const g = makeGeo(), c = [1, 1, 1];
  g.spine([{ p: [0, 1.5, -2.7], rx: 0.03, ry: 0.03, c }, { p: [0, 1.62, -1.5], rx: 0.16, ry: 0.16, c }, { p: [0, 1.78, -0.4], rx: 0.36, ry: 0.4, c }, { p: [0, 1.98, 0.6], rx: 0.3, ry: 0.36, c },
    { p: [0, 2.45, 1.1], rx: 0.15, ry: 0.17, c }, { p: [0, 2.78, 1.45], rx: 0.16, ry: 0.17, c }, { p: [0, 2.72, 1.9], rx: 0.09, ry: 0.1, c }, { p: [0, 2.68, 2.1], rx: 0.03, ry: 0.04, c }], 7);
  for (let s = -1; s <= 1; s += 2) {
    g.spine([{ p: [s * 0.24, 1.7, -0.35], rx: 0.2, ry: 0.2, c }, { p: [s * 0.26, 0.95, 0.12], rx: 0.11, ry: 0.11, c }, { p: [s * 0.24, 0.42, -0.26], rx: 0.06, ry: 0.06, c }, { p: [s * 0.24, 0.02, 0.1], rx: 0.07, ry: 0.04, c }], 6);
    g.spine([{ p: [s * 0.2, 1.75, 0.75], rx: 0.07, ry: 0.07, c }, { p: [s * 0.22, 1.4, 1.0], rx: 0.03, ry: 0.03, c }], 5);
  }
  return g.build();
}

// the rare bull: water streaming off the chest while it stands, and the crown of spray when it comes down
function makeSplash(rng, U, time, c, n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set([rng(), rng() * 6.2832, rng.range(2.5, 9), i < n * 0.62 ? 0 : 1], i * 4);
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const uni = { uS: { value: -1 }, uRear: { value: 0 }, uC: { value: new THREE.Vector3(c[0], c[1], c[2]) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uMist: U.uMist, uMistCol: U.uMistCol, uSunDirW: U.uSunDirW, uSunCol: U.uSunCol, uAmbCol: U.uAmbCol, uPearl: U.uPearl, uT: time, ...uni },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`
      attribute vec4 aS; uniform float uS, uRear, uT; uniform vec3 uC;
      varying vec2 vUv; varying float vA; varying vec3 vWPos;
      #include <fog_pars_vertex>
      void main(){
        float s1 = aS.x, th = aS.y, s2 = fract(s1 * 7.13), s3 = fract(s1 * 13.7); vec3 p; vec2 size; float alpha, streak = 0.;
        if (aS.w < 0.5) {
          float tau = uS - s1 * 0.3, life = 2.6 + 1.6 * s2, vy = 6. + 11. * s3, r = 1.6 + aS.z * 1.9 * max(tau, 0.);
          p = uC + vec3(cos(th) * r, max(vy * tau - 4.9 * tau * tau, -0.3), 8. + sin(th) * r * 1.2);
          size = vec2(0.9 + 3.4 * clamp(tau / life, 0., 1.)) * vec2(1., 1.7) * (0.7 + 0.6 * s2);
          alpha = step(0., tau) * step(tau, life) * (1. - tau / life) * 0.95;
        } else {
          float f = 0.25 + 0.75 * s2, ang = 0.98 * uRear, q = fract(uT * (0.6 + 0.5 * s3) + th);
          float y0 = 3.2 + f * 8. * sin(ang), z0 = -2.7 + f * 8. * cos(ang);
          p = uC + vec3((s3 - 0.5) * 2.6, mix(y0, 0., q * q), z0 + 0.4 * q);
          size = vec2(0.2, 0.7 + 2.2 * q) * (0.7 + 0.6 * s1); streak = 1.;
          alpha = smoothstep(0.15, 0.6, uRear) * (1. - 0.5 * q) * 0.7;
        }
        vec3 toCam = normalize(cameraPosition - p + vec3(0., 1e-3, 0.));
        vec3 right = normalize(cross(vec3(0., 1., 0.), toCam) + vec3(1e-5, 0., 0.));
        vec3 up = mix(cross(toCam, right), vec3(0., 1., 0.), streak);
        vec3 wp = p + right * position.x * size.x + up * position.y * size.y;
        vWPos = wp; vUv = position.xy; vA = alpha;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        gl_Position = alpha > 0.003 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vA; varying vec3 vWPos; uniform vec3 uSunCol, uAmbCol, uPearl;
      ${MIST_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv); if (r2 > 1.) discard;
        float soft = (1. - r2); soft *= soft;
        vec3 vd = normalize(vWPos - cameraPosition); float fw = max(dot(vd, uSunDirW), 0.);
        gl_FragColor = vec4(uPearl * (uAmbCol * 0.75 + uSunCol * (0.35 + 1.2 * fw * fw * fw)), vA * soft);
        #include <fog_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, applyMist(gl_FragColor.rgb, vWPos), 0.5);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { object: mesh, set(sec, rear) { uni.uS.value = sec; uni.uRear.value = rear; } };
}
