// The Growing Crescent, 66.04 million years ago: the last forty seconds of the Cretaceous over a calm shelf sea.
// World frame = the hero's frame: water level y = 0, the camera flies toward -Z (north-east), the stranger hangs
// over -Z, the Sun is 40 degrees to the right. See src/parts/crescent-over-yucatan.js for the sky and the mosasaur.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import { buildHero, buildMosasaur, strangerAt, mosasaurAt, STRANGER_UNIFORMS_GLSL, STRANGER_GLSL, S_NOISE_GLSL, SEA_GLSL, DEFAULT_PALETTE }
  from '../parts/crescent-over-yucatan.js';

const DEG = Math.PI / 180;
const C = (h) => new THREE.Color(h);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const dirFrom = (azRightDeg, elDeg) => V3(Math.sin(azRightDeg * DEG) * Math.cos(elDeg * DEG), Math.sin(elDeg * DEG), -Math.cos(azRightDeg * DEG) * Math.cos(elDeg * DEG));

// The seeded looks (brief, variations): hour and weather together, each with its own sky, light, haze and sea.
const LOOKS = {
  morning: {      // an hour after sunrise, glass calm: the brief's own picture
    sunEl: 13, zenith: '#2463BC', mid: '#4C92D8', horizon: '#DCEBEC', sunCol: '#FFE7B0', sunI: 2.3, hemiI: 0.95, hemiSky: '#9CCBEA',
    skyTop: '#5E9FD6', skyHor: '#DCEBEC', fog: '#D3E4E8', fogD: 0.00030, wind: 0.0, soft: 0.0, sBright: 1.95, sCover: 0.97, moonBright: 1.6, dusk: '#3D5E86',
    turq: '#3FC6C0', deep: '#0F7F93', sunDisc: 11, cloudLit: '#FFEFD8', cloudShade: '#7F97AD', exposure: 0.93, sunSea: '#FFDC9C', tide: 1.0, sunSky: '#FFD58C', scat: '#FFDDA8',
  },
  firstLight: {   // Sun still under the horizon: sea pewter and rose, the crescent brilliant
    sunEl: -2.2, zenith: '#3F5E96', mid: '#8C9CC4', horizon: '#F3C9B8', sunCol: '#FFB7A0', sunI: 1.0, hemiI: 1.15, hemiSky: '#93A6CE',
    skyTop: '#4A6BA6', skyHor: '#F1CDBE', fog: '#D9BFC0', fogD: 0.00034, wind: 0.0, soft: 0.0, sBright: 2.0, sCover: 0.97, moonBright: 1.7, dusk: '#4B5486',
    turq: '#63AFB2', deep: '#27647C', sunDisc: 0, cloudLit: '#FFC9B4', cloudShade: '#66739A', exposure: 1.06, sunSea: '#FFC2AE', tide: 1.0,
  },
  midMorning: {   // Sun 35 degrees up, a light trade wind, low cumulus streets, the crescent paper white
    sunEl: 35, zenith: '#215FBE', mid: '#488DD6', horizon: '#CFE6EE', sunCol: '#FFF0D2', sunI: 2.3, hemiI: 1.0, hemiSky: '#9CCBEA',
    skyTop: '#4B90D8', skyHor: '#D2E8EE', fog: '#C9E0EA', fogD: 0.00026, wind: 1.0, soft: 0.0, sBright: 1.85, sCover: 0.96, moonBright: 1.5, dusk: '#3A5C8C',
    turq: '#38C8C4', deep: '#0C7C98', sunDisc: 12, cloudLit: '#FFFDF6', cloudShade: '#8498B2', exposure: 0.92, sunSea: '#FFF3DA', tide: 0.5,
  },
  pearl: {        // thin high haze: milky light, the crescent a soft pearl
    sunEl: 13, zenith: '#7FA9CE', mid: '#B4CFE0', horizon: '#EAEDE6', sunCol: '#FFE9C4', sunI: 1.9, hemiI: 1.15, hemiSky: '#B9D3E2',
    skyTop: '#86AED2', skyHor: '#E9EDE8', fog: '#E2E8E4', fogD: 0.00050, wind: 0.0, soft: 0.10, sBright: 1.45, sCover: 0.93, moonBright: 1.3, dusk: '#5E7890',
    turq: '#4CC4BC', deep: '#1A8094', sunDisc: 7, cloudLit: '#FFF6E8', cloudShade: '#93A5B4', exposure: 1.0, sunSea: '#FFEBCB', tide: 0.9,
  },
};

// ---------------------------------------------------------------------------------------------
// GLSL shared by everything that lies under the water: the view path through clear water, and
// the two lights (the Sun with its caustic net, the stranger's rising tide).
// Needs the hero's SEA_GLSL uniforms (uCamL, uSea, uTurq, uDeep, uSunCol) and S_NOISE_GLSL (sCaus).
// ---------------------------------------------------------------------------------------------
const UNDER_GLSL = /* glsl */`
vec3 seaThrough(vec3 col, vec3 wp){
  float depth = max(-wp.y, 0.);
  vec3 toCam = uCamL - wp; float dist = length(toCam);
  float vy = abs(toCam.y) / max(dist, 1e-3);
  float path = depth / max(vy, 0.07) + depth * 0.6;
  vec3 T = exp(-path * vec3(0.145, 0.027, 0.029));
  vec3 scatter = mix(uTurq, uDeep * 0.74 + vec3(0., 0.004, 0.03), smoothstep(5., 46., path)) * (0.55 + 0.09 * uSea.y) * mix(vec3(1.), vec3(1.14, 1.05, 0.86), clamp(uSea.y * 0.4, 0., 0.85)) * (1. - 0.30 * cloudSh(wp.xz));   // (polish 3) the deep water is darker and bluer; cloud shade dulls the glow
  return col * T + scatter * (1. - exp(-path * 0.032));
}
vec3 keepWarm(vec3 wp){
  float depth = max(-wp.y, 0.);
  vec3 toCam = uCamL - wp;
  float vy = abs(toCam.y) / max(length(toCam), 1e-3);
  float path = min(depth / max(vy, 0.07) + depth * 0.6, 40.);
  return min(exp(path * vec3(0.074, 0.004, -0.016)), vec3(2.3, 1.1, 1.));
}
vec3 seaLight(vec3 wp, float sunShade, float strShade, float up){
  float depth = max(-wp.y, 0.);
  float wet = smoothstep(0.0, 0.25, depth);
  float dist = length(uCamL - wp);
  float ca = sCaus(wp.xz * 1.7, uSea.z) * min(2.4 / (1. + dist * 0.035), 1.) * wet * exp(-depth * 0.05);
  float cl = cloudSh(wp.xz);
  vec3 l = uSunCol * uLit.x * (0.20 + (0.62 + 0.62 * ca) * sunShade * (1. - 0.72 * cl) * mix(1., up, 1. - wet)) + uFill * uLit.y * (0.55 + 0.45 * up);
  l += uSHot * vec3(1.0, 0.90, 0.70) * uSea.y * (0.04 + (0.23 + 0.33 * ca) * strShade) * mix(1., 0.48, wet);      // (polish 4: gold on the sand, not white; and a light 10 degrees up mostly glances off the sea: the bed under water takes half of it, so the sea keeps its colour)      // (polish 4: gold on the sand, not white)
  l += uSkyHor * 0.62 * (1. - wet) * (1. - uLit.w);                 // before sunrise the dry sand takes the bright horizon sky
  return l;
}
`;
const LIT_UNIFORMS_GLSL = /* glsl */`uniform vec4 uLit; uniform vec3 uFill; uniform vec4 uShad[16]; uniform vec3 uStrL;
// (polish 3) the shadows of the horizon's cumulus: with the Sun 13 degrees up they lie kilometres from their clouds, in long soft
// bands drawn out down the light, and drift slowly; 1 in shade. No Sun, no shadows (uLit.w).
float cloudSh(vec2 p){
  vec2 sd = normalize(uSunDir.xz + vec2(1e-4, 0.));
  vec2 q = vec2(dot(p, sd) * 0.30, p.x * sd.y - p.y * sd.x);
  float c = sVN(q * 0.0105 + vec2(uSea.z * 0.004, uSea.w)) * 0.62 + sVN(q * 0.027 + vec2(3.1, uSea.z * 0.006)) * 0.38;
  return smoothstep(0.50, 0.66, c) * uLit.w;
}`;

// The mosasaur's part, keyed to u, in place of the hero's own demo script. She comes up out of the channel tongue ahead-left and
// swims across our bow, 60 degrees off our heading, so that we come down on her right flank from behind and above the shoulder:
// she crosses our line 14 m ahead at u 0.345 with her one breath, then straightens and sinks under our right wing, the tail's
// upper lobe last. Her wake is a V that opens back toward us. (Polish 1: laid out in the path's own frame at U_MO, since the
// line now weaves, and 0.045 u earlier, so that the breath is seen in the still at u 0.34.)
// (Polish 3: she crosses our bow BROADSIDE, from the channel on our left to our right and a little toward us, so that at u 0.34 she
// lies across the frame 8.5 m ahead, head in profile to the right, eye, lipped mouth and banded flank toward us, tail trailing off to
// the left; she breathes as we come up, we pass over her hips, and she swings away down-channel and sinks, tail lobe last.)
const U_MO = 0.34;
function makeMoScript(path) {
  const L = path.length, P0 = path.posAtDist(U_MO * L), T = path.tangentAtDist(U_MO * L).clone().setY(0).normalize(), Rx = -T.z, Rz = T.x;
  const CB = Math.cos(104 * DEG), SB = Math.sin(104 * DEG), V = 150;       // her course, degrees right of ours; metres per unit of u (about 3 m/s at this pace)
  const tr = (uu) => {
    const d = uu - U_MO, e = Math.max(d - 0.018, 0), bend = 2600 * e * e / (1 + 14 * e);       // after we have passed she bears away ahead of us
    const ahead = 6.7 + V * d * CB + bend, lat = -0.4 + V * d * SB - 0.25 * bend;
    return [P0.x + T.x * ahead + Rx * lat, P0.z + T.z * ahead + Rz * lat];
  };
  return function moScript(u, out = {}) {
    const a = tr(u - 0.004), b = tr(u + 0.004), c = tr(u), d = u - U_MO;
    out.x = c[0]; out.z = c[1]; out.heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
    out.surfaced = smoothstep(-0.095, -0.045, d) * (1 - smoothstep(0.022, 0.060, d));
    out.breath = clamp((d + 0.020) / 0.050, 0, 1);
    out.dive = smoothstep(0.018, 0.034, d) * (1 - smoothstep(0.060, 0.09, d));
    return out;
  };
}

// the legs of the journey: linger with the mosasaur, under the plunging pterosaurs and beside the one that flies with us (to u 0.72),
// hurry over the last quiet water, linger while the fire stands
function pace(u) {
  // (polish 2) slow beside the mosasaur and over the spit; brisk from u 0.64, so that the fire, which stands from u 0.70, belongs to
  // the last seconds of the flight; easy again for the crossing
  const s = smoothstep;
  // (polish 3) brisk from u 0.57: the limb's glow (u 0.54 on) and the fire (u 0.705 on) still fall in the last twelve and the last eight seconds
  return 1.05 + (0.68 - 1.05) * s(0.20, 0.27, u) + (0.84 - 0.68) * s(0.385, 0.44, u) + (1.42 - 0.84) * s(0.55, 0.62, u) + (1.0 - 1.42) * s(0.88, 0.97, u);
}

export default {
  id: 'crescent-over-yucatan',
  name: 'The Growing Crescent',
  category: 'prehistoric',
  media: ['air', 'water'],
  weirdness: 0.3,
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- which morning is it? ----
    const pick = rng.fork('variation');
    const hour = vary.hour || 'any';
    let lookName = pick.pick(['midMorning', 'morning', 'firstLight', 'pearl', 'morning']);
    if (hour === 'dawn' || hour === 'night') lookName = 'firstLight';
    else if (hour === 'day') lookName = pick.chance(0.6) ? 'midMorning' : 'pearl';
    else if (hour === 'golden') lookName = 'morning';
    const look = LOOKS[lookName];
    const rare = !!vary.rare;
    const cast = rng.fork('cast');
    const juvenile = cast.chance(0.45), nPtero = cast.int(4, 12), manyAmmonites = cast.chance(0.5);
    const pal = DEFAULT_PALETTE.slice(); pal[0] = look.turq; pal[1] = look.deep;
    const sunDir = dirFrom(40, look.sunEl);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(C(look.fog), look.fogD);

    // ---- the hero: the stranger, the Moon, the mosasaur ----
    const hero = await buildHero(ctx, {
      palette: pal, detail, stage: false, sunDir, rareEvent: rare, soft: look.soft, skyRadius: 6000,
      strangerBright: look.sBright, strangerCover: look.sCover, moonBright: look.moonBright, moonCover: 0.9, dusk: look.dusk,
      skyTop: look.skyTop, skyHorizon: look.skyHor, sunColor: look.sunSea, depth: 5,
    });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors;
    const path = makePath(A.flyThrough);
    const portalPos = A.portalSeat.position.clone();
    const endDir = path.endTangent.clone().setY(0).normalize();           // the way we leave: (-0.24, 0, -0.97)
    const endRight = V3(-endDir.z, 0, endDir.x);

    // ---- sky: the kit's dome under the hero's overlay ----
    const sky = makeSky({
      rng, preset: 'day', zenith: look.zenith, mid: look.mid, horizon: look.horizon, ground: C(look.turq).lerp(C(look.deep), 0.45),
      horizonPow: 7, midPow: 1.1, groundFalloff: 30, sunElevation: look.sunEl, sunAzimuth: 40, sunColor: look.sunSky || look.sunCol, sunSize: 0.9,
      sunIntensity: look.sunDisc, sunGlow: lookName === 'firstLight' ? 1.2 : 0.42, sunGlowTight: 0.8, scatter: lookName === 'firstLight' ? 0.75 : 0.34,
      scatterColor: lookName === 'firstLight' ? '#FF9E8A' : (look.scat || '#FFE9C0'), clouds: false, clouds2: false, fogColor: look.fog,
    });
    scene.add(sky.object);
    await ctx.yield();

    // ---- light: the Sun, the sky's fill, and the stranger's light, there from the start at zero ----
    const hemi = new THREE.HemisphereLight(C(look.hemiSky), C(look.turq).multiplyScalar(0.55), look.hemiI);
    const sun = new THREE.DirectionalLight(C(look.sunCol), look.sunI);
    sun.position.copy(dirFrom(40, Math.max(look.sunEl, 7))).multiplyScalar(400);
    const second = new THREE.DirectionalLight(C(pal[6]), 0);
    second.position.copy(A.strangerDir(0)).multiplyScalar(400);
    scene.add(hemi, sun, sun.target, second, second.target);

    // ---- the uniforms every sea shader shares (the hero's, plus ours) ----
    const U = hero.seaUniforms;
    U.uLit = { value: new THREE.Vector4(look.sunI / 2.3 * (look.sunEl < 0 ? 0.55 : 1), look.hemiI, look.wind, 0) };   // sun strength, fill strength, wind, spare
    U.uFill = { value: C(look.hemiSky).multiplyScalar(0.34) };
    U.uShad = { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, -999, 0, 0)) };   // x, y, z, half size of each flier that throws a shadow
    U.uStrL = { value: A.strangerDir(0) };
    const env = { ctx, rng, detail, density, look, lookName, pal, U, path, sunDir, portalPos, endDir, endRight, scene, hero, A };
    Object.assign(env, { sky, hemi, sun, second, rare, juvenile, nPtero, manyAmmonites });
    return assemble(env);
  },
};

// =============================================================================================
// THE GROUND UNDER THE SEA: bank, channel, tongue, rudist mounds, cay
// =============================================================================================
function makeGround(env) {
  const { rng, portalPos, endDir, endRight, ctx } = env;
  const n = ctx.noise, r = rng.fork('ground');
  // twelve rudist mounds, 6 to 10 m wide and about 3 m high, beside and under the line (never where the mosasaur swims)
  const mounds = [];
  const want = [[-1, 174, 4.8], [12.5, 150, 5.6], [5, 118, 3.6], [23, 84, 4.4], [16, 36, 3.8], [26, -32, 4.4], [-4, -18, 3.6], [34, -150, 4.2], [5, -172, 4.6], [19, -204, 4.0], [-20, -236, 3.6], [8, -268, 4.4], [0, -134, 3.8], [-9, -197, 4.2], [14, -176, 3.6], [-31, -258, 4.2], [-28, -286, 3.8], [25, -171, 5.4], [31, -181, 4.4], [7, -188, 5.0]];      // (polish 5: the last three are a patch reef under the climb at u 0.655; appended, so no other mound moves)
  for (const w of want) mounds.push({ x: w[0] + r.range(-2.5, 2.5), z: w[1] + r.range(-5, 5), r: w[2] * r.range(0.9, 1.15), h: r.range(2.7, 3.3), ph: r.range(0, 6.28) });
  const armC = [portalPos.clone().addScaledVector(endRight, 58).addScaledVector(endDir, 3), portalPos.clone().addScaledVector(endRight, -58).addScaledVector(endDir, 3)];
  const edgeAt = (z) => -34 - 175 * smoothstep(120, 290, -z) + 21 * smoothstep(-66, -30, z) * (1 - smoothstep(74, 104, z)) + 9 * Math.sin(z * 0.021 + 1.3) * (1 - smoothstep(-66, 104, z) * (1 - smoothstep(60, 104, z)) * 0.8);
  // (polish 2) a sand spit awash in the middle of the bank, lying across our line: we come over it 1.7 m up at u 0.53
  const sL = env.path.length, sP = env.path.posAtDist(0.53 * sL), sT = env.path.tangentAtDist(0.53 * sL).clone().setY(0).normalize();
  const sca = Math.cos(-32 * DEG), ssa = Math.sin(-32 * DEG);
  const spit = { x: sP.x, z: sP.z, ax: sT.x * sca - sT.z * ssa, az: sT.x * ssa + sT.z * sca, tx: sT.x, tz: sT.z };
  let duneOn = 1;
  function cayAt(x, z) {            // 0 in open water .. 1 on the crest of an arm
    let best = 0;
    {
      const dx = x - spit.x, dz = z - spit.z;
      if (dx * dx + dz * dz < 80 * 80) {
        const al = dx * spit.ax + dz * spit.az, ac = dx * spit.az - dz * spit.ax;
        const wig = 3.0 * Math.sin(al * 0.11 + 0.7) + 1.6 * Math.sin(al * 0.27 + 2.0);
        const e = Math.max(Math.abs(al - 4) - 27, 0), d = Math.sqrt(e * e * 2.4 + (ac - wig) * (ac - wig) * 5.0);
        best = 0.80 * (1 - smoothstep(4, 34, d));                                   // a lower bank than the cay: 0.9 m of dry sand
      }
    }
    if (z > portalPos.z + 92 || z < portalPos.z - 96) return best;
    for (let k = 0; k < 2; k++) {
      const dx = x - armC[k].x, dz = z - armC[k].z;
      const al = dx * endRight.x + dz * endRight.z, ac = dx * endDir.x + dz * endDir.z;
      const wig = 3.5 * Math.sin(al * 0.09 + k * 2.1) + 2 * Math.sin(al * 0.23 + k);
      const half = 45, e = Math.max(Math.abs(al) - half, 0);
      const d = Math.sqrt(e * e * 6.5 + (ac - wig) * (ac - wig) * 5.5);          // long along the arm, narrow across (about 16 m of dry sand)
      best = Math.max(best, 1 - smoothstep(4, 34, d));
    }
    return best;
  }
  // (polish 1) the bank has depth of its own: two tidal creeks 20 m wide and 12 m deep cut across it from the channel (we cross the
  // first at u 0.45 and the second at u 0.72), and pale shoals rise to within a metre of the surface beside the line
  const creeks = [{ ax: -78, az: 8, bx: 104, bz: -108, w: 10.5, d: -10.2 }, { ax: -150, az: -198, bx: 120, bz: -292, w: 9.5, d: -9.8 }, { ax: 62, az: 300, bx: 150, bz: 60, w: 12, d: -10.5 }];
  for (const c of creeks) { c.dx = c.bx - c.ax; c.dz = c.bz - c.az; c.il = 1 / (c.dx * c.dx + c.dz * c.dz); }
  const shoals = [{ x: 47, z: 168, rx: 20, rz: 46, top: -0.9 }, { x: 44, z: 18, rx: 17, rz: 34, top: -1.1 }, { x: -24, z: -118, rx: 13, rz: 26, top: -1.1 }, { x: 40, z: -176, rx: 17, rz: 36, top: -1.0 }, { x: -52, z: -206, rx: 16, rz: 30, top: -1.0 }, { x: 96, z: -40, rx: 26, rz: 50, top: -0.9 }];
  function reliefAt(x, z, h) {
    const wx = x + 7 * n.n2(x * 0.021 + 31, z * 0.021), wz = z + 7 * n.n2(x * 0.021, z * 0.021 + 17);
    for (const s of shoals) {
      const ex = (wx - s.x) / s.rx, ez = (wz - s.z) / s.rz, q = 1 - ex * ex - ez * ez;
      if (q > 0) h = lerp(h, Math.max(h, s.top - 0.5 * (1 - q)), smoothstep(0, 0.5, q));
    }
    for (const c of creeks) {
      const t = clamp(((wx - c.ax) * c.dx + (wz - c.az) * c.dz) * c.il, 0, 1), px = c.ax + c.dx * t - wx, pz = c.az + c.dz * t - wz;
      const sd = (px * c.dz - pz * c.dx) * Math.sqrt(c.il);                         // signed distance off its line: it meanders
      const d = t > 0 && t < 1 ? Math.abs(sd + 6 * Math.sin(t * 9.0 + c.w)) : Math.sqrt(px * px + pz * pz);
      if (d < c.w * 2.7) h = lerp(h, Math.min(h, c.d), 1 - smoothstep(c.w * 0.15, c.w * 2.6, d));
    }
    return h;
  }
  function heightAt(x, z) {
    let bank = -4.9 + 0.95 * n.fbm2(x * 0.018 + 3, z * 0.018, 3) + 0.10 * n.n2(x * 0.16, z * 0.16);
    bank = reliefAt(x, z, bank);
    // the bank's edge is ragged: tongues and bays 25, 9 and 4 m across, never a ruled line
    let ce = x - edgeAt(z) + 7 * n.n2(x * 0.028, z * 0.028 + 9);
    if (ce > -56 && ce < 14) ce += 5.0 * n.n2(x * 0.085 + 2, z * 0.085);   // (only where it can matter: build time; nothing finer than the 2 m grid can carry)
    const chan = 1 - smoothstep(-46, 4, ce);
    let h = lerp(bank, -30, Math.pow(chan, 1.7));
    const right = smoothstep(190, 250, x + 14 * n.n2(z * 0.012, 5.5));     // the bank's far side falls away too
    h = lerp(h, -22, right);
    for (const m of mounds) {
      const dx = x - m.x, dz = z - m.z, d2 = dx * dx + dz * dz, R = m.r * 1.5;
      if (d2 > R * R) continue;
      const lump = 1 + 0.22 * Math.sin(Math.atan2(dz, dx) * 3 + m.ph) + 0.12 * Math.sin(Math.atan2(dz, dx) * 7 + m.ph * 2);
      const t = Math.sqrt(d2) / (m.r * lump);
      const dome = Math.pow(Math.max(1 - t * t * 0.62, 0), 1.6);
      h = Math.max(h, Math.min(h + m.h * dome * (1 + 0.10 * n.n2(x * 0.9, z * 0.9)), -1.5));
    }
    const c = cayAt(x, z);
    if (c > 0) {
      const beach = c * c * (3 - 2 * c);
      let top = -3.4 + 4.75 * Math.pow(beach, 0.8) + 0.12 * n.n2(x * 0.12, z * 0.12) * beach;   // crest about 1.2 m above the sea
      // (polish 5) the dry sand is not a ruled plank: low dunes along the crest, half a metre of rise and fall with a steeper side,
      // so that from the water a bar has an outline and a shaded flank (kept flat where we cross the spit, 2.3 m up)
      const sLat = Math.abs((x - spit.x) * -spit.tz + (z - spit.z) * spit.tx), sNear = (x - spit.x) * (x - spit.x) + (z - spit.z) * (z - spit.z) < 6400 ? smoothstep(4.5, 13, sLat) : 1;
      const du = n.n2(x * 0.062 + 11, z * 0.062 - 4);
      top += 0.62 * beach * beach * smoothstep(-0.35, 0.55, du) * sNear * duneOn;
      h = lerp(h, Math.max(h, top), smoothstep(0.0, 0.30, c));
    }
    return h;
  }
  const grassAt = (x, z) => {       // leopard patches 8 to 30 m across over half the bank
    let g = n.fbm2(x * 0.021 + 40, z * 0.021 - 7, 2) * 0.75 + 0.35 * n.n2(x * 0.075 + 3, z * 0.075) + 0.07;
    // (polish 3) no meadow on the sand apron round the cay: a patch there lay half out of the last frames as a dark blot
    const ax = x - portalPos.x, az = z - portalPos.z, al = Math.abs(ax * endRight.x + az * endRight.z), ac = Math.abs(ax * endDir.x + az * endDir.z);
    if (al < 120 && ac < 56) g -= 0.5 * (1 - smoothstep(28, 56, ac)) * (1 - smoothstep(96, 120, al));
    return g;
  };
  // the meadow thickens on the lip of the channel and hangs down its slope in dark tongues
  const slopeGrass = (x, z, h) => smoothstep(-5.3, -9.0, h + 1.6 * n.n2(x * 0.05 + 3, z * 0.05)) * (1 - smoothstep(-12, -21, h)) * (0.62 + 0.55 * n.n2(x * 0.085 + 7, z * 0.085));
  const grassMask = (x, z, h) => Math.max(clamp((grassAt(x, z) - 0.5) * 3.2 + 0.5, 0, 1), slopeGrass(x, z, h));
  // (polish 3) the height of the sand as it is drawn: the bed is a grid (2 m by 2.5 m cells here, 4 m wide left of x -82), and a bird
  // put down at the true height of a rippled crest stood in the air or in the sand between the grid's corners
  function surfAt(x, z) {
    let x0, wx;
    if (x >= -82) { wx = 2; x0 = -82 + 2 * Math.floor((x + 82) / 2); } else { wx = 4; x0 = -82 - 4 * Math.ceil((-82 - x) / 4); }
    const z0 = -430 + 2.5 * Math.floor((z + 430) / 2.5), fx = (x - x0) / wx, fz = (z - z0) / 2.5;
    if (x > 46 || x < -178 || z < -430 || z > 262) return heightAt(x, z);
    const ha = heightAt(x0, z0), hb = heightAt(x0 + wx, z0), hc = heightAt(x0, z0 + 2.5), hd = heightAt(x0 + wx, z0 + 2.5);
    return fx + fz <= 1 ? ha + fx * (hb - ha) + fz * (hc - ha) : hd + (1 - fx) * (hc - hd) + (1 - fz) * (hb - hd);
  }
  // the sand's height without the dunes of polish 5: the casts that settle on the sand are chosen by it, so every bird stands where it stood
  const baseSurfAt = (x, z) => { duneOn = 0; const h = surfAt(x, z); duneOn = 1; return h; };
  return { mounds, armC, heightAt, surfAt, baseSurfAt, grassAt, grassMask, slopeGrass, cayAt, edgeAt, spit };
}

// (polish 1) A small chart of the bed (depth, seagrass) for the water shader: far off, where the glass hides the bed itself, the
// sea still shows its pale shoals, its dark meadows and the blue of the creeks and the channel, out to the horizon.
async function makeChart(env, ground) {
  const X0 = -420, Z0 = -700, CELL = 6, W = 128, H = 176, data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = X0 + (i + 0.5) * CELL, z = Z0 + (j + 0.5) * CELL, h = ground.heightAt(x, z), k = (j * W + i) * 4;
      data[k] = Math.round(clamp(-h / 32, 0, 1) * 255);
      const wetK = 1 - smoothstep(-1.6, -0.2, h);
      data[k + 1] = Math.round(clamp((ground.grassAt(x, z) - 0.5) * 3.2 + 0.5, 0, 1) * wetK * 255);      // the leopard patches
      data[k + 2] = Math.round(clamp(ground.slopeGrass(x, z, h), 0, 1) * 255); data[k + 3] = 255;               // the meadow on the slopes of channel and creeks
    }
    if (j % 2 === 0) await env.ctx.yield();
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  env.U.uChart = { value: tex };
  env.U.uChartBox = { value: new THREE.Vector4(X0, Z0, 1 / (W * CELL), 1 / (H * CELL)) };
}

async function makeBed(env, ground) {
  const { ctx, U, sunDir } = env, { heightAt, mounds } = ground;
  // a grid that is fine under the line and coarse far off: 2 m cells within 46 m, growing to the horizon
  const xs = [], zs = [];
  for (let x = -82; x <= 46; x += 2) xs.push(x);
  for (let x = -86; x >= -178; x -= 4) xs.unshift(x);                    // the cay's left arm lies out here since the path turns 26 degrees
  for (let s = 2.5, x = 46 + s; x < 3200; s *= 1.28, x += s) xs.push(x);
  for (let s = 4.5, x = -178 - s; x > -3200; s *= 1.28, x -= s) xs.unshift(x);
  for (let z = -430; z <= 262; z += 2.5) zs.push(z);
  for (let s = 3, a = 3; a < 3200; s *= 1.3, a += s) { zs.push(262 + a); zs.unshift(-430 - a); }
  const NX = xs.length, NZ = zs.length, pos = new Float32Array(NX * NZ * 3), att = new Float32Array(NX * NZ * 4), nor = new Float32Array(NX * NZ * 3);
  // refracted light directions under water (Snell): the Sun's and the stranger's shadows there are short and steep
  const sunH = V3(sunDir.x, 0, sunDir.z).normalize();
  const sunElR = Math.asin(clamp(sunDir.y, 0.05, 1));
  const sunTan = Math.tan(Math.asin(Math.cos(sunElR) / 1.33)), sunDry = 1 / Math.tan(sunElR);   // metres run per metre of fall, under water and in air
  const shade = (x, z, h, hx, hz, run) => {            // 1 = lit; marches toward the light and looks for ground above the ray
    let s = 1;
    for (let k = 1; k <= 5; k++) {
      const t = k * 0.9, y = h + t / run;
      if (y > -1.2 && h < -0.3) break;
      const hh = heightAt(x + hx * t, z + hz * t);
      s = Math.min(s, clamp(1 - (hh - y) * 1.6, 0, 1));
    }
    return s;
  };
  const nearMound = (x, z) => { for (const m of mounds) { const dx = x - m.x, dz = z - m.z; if (dx * dx + dz * dz < (m.r * 1.5 + 6) * (m.r * 1.5 + 6)) return m; } return null; };
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x = xs[i], z = zs[j], k = j * NX + i, h = heightAt(x, z);
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      const m = Math.abs(x) < 60 ? nearMound(x, z) : null;
      let mound = 0, mf = 3;
      if (m) { const d = Math.hypot(x - m.x, z - m.z) / m.r; mound = 1 - smoothstep(0.75, 1.25, d); mf = Math.min(d, 3); }
      const deep = smoothstep(-15, -25, h), dry = smoothstep(-1.6, -0.2, h);
      att[k * 4] = clamp((ground.grassAt(x, z) - 0.5) * 3.2 + 0.5, 0, 1) * (1 - mound) * (1 - dry) * (1 - 0.75 * deep);   // the leopard patches; the slope's meadow is drawn per pixel
      att[k * 4 + 1] = mf;
      att[k * 4 + 2] = m || h > -3 ? shade(x, z, h, sunH.x, sunH.z, h > 0 ? sunDry : sunTan) : 1;
      att[k * 4 + 3] = m ? shade(x, z, h, 0, -1, 0.93) : 1;
    }
    await ctx.yield();
  }
  await ctx.yield();
  // normals from the grid's own heights (they only shade the dry sand of the cay; four fewer height look-ups a vertex)
  for (let j = 0; j < NZ; j++) {
    const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZ - 1);
    for (let i = 0; i < NX; i++) {
      const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, NX - 1), k = j * NX + i;
      const gx = (pos[(j * NX + i1) * 3 + 1] - pos[(j * NX + i0) * 3 + 1]) / (xs[i1] - xs[i0]), gz = (pos[(j1 * NX + i) * 3 + 1] - pos[(j0 * NX + i) * 3 + 1]) / (zs[j1] - zs[j0]);
      const il = 1 / Math.sqrt(gx * gx + gz * gz + 1);
      nor[k * 3] = -gx * il; nor[k * 3 + 1] = il; nor[k * 3 + 2] = -gz * il;
    }
    if (j % 60 === 0) await ctx.yield();
  }
  await ctx.yield();
  const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6);
  let q = 0;
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('aBed', new THREE.BufferAttribute(att, 4)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({ uniforms: U, fog: true, vertexShader: BED_VERT, fragmentShader: BED_FRAG });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'seabed'; mesh.frustumCulled = false;
  return mesh;
}

const BED_VERT = /* glsl */`
  attribute vec4 aBed;
  varying vec3 vPos; varying vec4 vBed; varying vec3 vNor;
  #include <fog_pars_vertex>
  void main(){
    vPos = position; vBed = aBed; vNor = normal;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
// the shadows of everything that flies, thrown on whatever lies below: soft down the Sun's light, hard down the stranger's
const SHADOW_GLSL = /* glsl */`
uniform vec4 uShadK;      // run per metre: Sun in air, Sun under water, stranger in air, stranger under water
vec2 flierShadows(vec3 wp){
  float depth = max(-wp.y, 0.), top = max(wp.y, 0.);
  vec2 sh = normalize(uSunDir.xz + vec2(1e-4, 0.));
  vec2 st = normalize(uStrL.xz + vec2(0., -1e-4));
  float a = 0., b = 0.;
  for (int i = 0; i < 16; i++) {
    vec4 f = uShad[i];
    float above = max(f.y - top, 0.);
    float w = max(f.w, 0.01);
    vec2 d1 = wp.xz - (f.xz - sh * (above * uShadK.x + depth * uShadK.y));
    float e1 = length(vec2(d1.x / (w * 1.5), d1.y / (w * 0.9)));
    a = max(a, (1. - smoothstep(0.25, 1.25, e1)) * step(-100., f.y));
    vec2 d2 = wp.xz - (f.xz - st * (above * uShadK.z + depth * uShadK.w));
    float al = dot(d2, st) / 1.5, ac = d2.x * st.y - d2.y * st.x;          // along the light (drawn out a little), and across it
    float sx = abs(ac) / w;
    float body = length(vec2(ac / (w * 0.15), (al - 0.05 * w) / (w * 0.46)));
    float wing = abs(al + w * (0.30 * sx * sx - 0.06)) / (w * 0.21 * max(1. - sx, 0.) * (0.55 + 0.45 * sx) * 2. + 1e-3) + step(1., sx) * 9.;
    b = max(b, (1. - smoothstep(0.80, 1.0, min(body, wing))) * step(-100., f.y));
  }
  return vec2(a, b);
}
uniform vec4 uSw[6];       // x, y (under the surface, negative), z, half length of each turtle
float swimShadows(vec3 wp){
  vec2 sh = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float a = 0.;
  for (int i = 0; i < 6; i++) {
    vec4 f = uSw[i];
    vec2 d1 = wp.xz - (f.xz - sh * max(f.y - wp.y, 0.) * uShadK.y);
    float e1 = length(d1) / max(f.w, 0.05);
    a = max(a, (1. - smoothstep(0.55, 1.25, e1)) * step(wp.y, f.y));
  }
  return a;
}
float mosaShadow(vec3 wp, vec2 lh, float run, float soft, float halfW){
  float depth = max(-wp.y - 1.6 + 1.2 * uMo.w, 0.);
  vec2 d = wp.xz - (uMo.xy - lh * depth * run);
  float ch = cos(uMo.z), sh = sin(uMo.z);
  vec2 l = vec2(ch * d.x - sh * d.y, sh * d.x + ch * d.y);
  float e = length(vec2(l.x / halfW, (l.y + 0.8) / 5.8));
  return 1. - smoothstep(1. - soft, 1. + soft * 0.4, e);
}
`;
const BED_FRAG = /* glsl */`
  precision highp float;
  varying vec3 vPos; varying vec4 vBed; varying vec3 vNor;
  ${STRANGER_UNIFORMS_GLSL}
  ${S_NOISE_GLSL}
  ${SEA_GLSL}
  ${LIT_UNIFORMS_GLSL}
  ${UNDER_GLSL}
  ${SHADOW_GLSL}
  uniform vec3 uRudist; uniform vec3 uWrack;
  uniform sampler2D uChart; uniform vec4 uChartBox;
  #include <fog_pars_fragment>
  void main(){
    vec2 p = vPos.xz; float h = vPos.y; float t = uSea.z;
    float dist = length(uCamL - vPos);
    float nearF = 1. - smoothstep(14., 60., dist);
    vec3 n = normalize(vNor + vec3(0., 1e-4, 0.));
    // white sand in ripple bars 0.4 m apart that bend and fork
    float wob = sFbm(p * 0.11 + uSea.w) * 9. + sFbm(p * 0.9) * 0.5;
    float barArg = (p.x * 0.78 + p.y * 0.62 + wob) * 15.7;
    float barFine = 1. - smoothstep(0.7, 2.0, fwidth(barArg));          // (no moire: the bars melt away where they are finer than a pixel)
    float bars = sin(barArg);
    float big = sFbm(p * 0.35 + 9.);
    float dry = smoothstep(-0.05, 0.25, h);
    float rip = mix(1., 0.74 + 0.26 * smoothstep(-0.6, 0.9, bars), nearF * (1. - dry) * barFine);
    vec3 col = uSand * rip * (0.90 + 0.18 * big);
    col *= 1. - 0.10 * (1. - dry) * smoothstep(0.55, 0.75, sFbm(p * 0.045 + 21.));                 // broad darker drifts of shell hash
    // seagrass in leopard patches with ragged edges
    vec2 cres = vec2(128., 176.);
    vec2 ct = (p - uChartBox.xy) * uChartBox.zw * cres + 0.5; vec2 cti = floor(ct), ctf = fract(ct);
    ct = (cti + ctf * ctf * (3. - 2. * ctf) - 0.5) / cres;
    vec4 chB = texture2D(uChart, clamp(ct, 0.002, 0.998));
    // (polish 4) a reef's outline is lobed and ragged, never the circle of a cone
    float mf = clamp(vBed.y + ((sFbm(p * 0.40 + 3.) - .5) * 0.62 + (sVN(p * 1.5 + 7.) - .5) * 0.22) * (1. - smoothstep(2.3, 2.9, vBed.y)), 0., 3.), moundK = 1. - smoothstep(0.75, 1.25, mf);
    float halo = smoothstep(0.95, 1.30, mf) * (1. - smoothstep(1.55 + 0.5 * sVN(p * 0.35 + 2.), 2.35, mf));    // the bare ring grazed clean round every reef
    float gm = max(chB.g, chB.b * 1.15) * (1. - moundK) * (1. - 0.75 * smoothstep(-15., -25., h)) + (sFbm(p * 0.33 + 4.) - .5) * 0.50 + (sVN(p * 1.9) - .5) * 0.26 + (sVN(p * 0.9 + 8.) - .5) * 0.22 + (sFbm(p * 0.13 + 1.) - .5) * 0.5;
    float grass = smoothstep(0.44, 0.60, gm) * (1. - 0.92 * halo) * (1. - smoothstep(-3.3, -2.2, h));           // (polish 3) none on the cay's apron or the shoal tops: there it was a dark stain with nothing casting it
    float blades = 0.50 + 0.65 * sVN(vec2(p.x * 2.6 + sin(t * .7 + p.y * .3) * .5, p.y * 8.)) * (0.7 + 0.6 * sVN(p * 0.8 + 3.));
    col = mix(col, uGrass * 0.40 * blades, grass * 0.93);
    col *= 1. - 0.22 * smoothstep(0.30, 0.46, gm) * (1. - grass) * (1. - halo);                    // a dusky fringe round each patch
    col *= 1. + halo * (0.10 - 0.30 * smoothstep(0.70, 0.86, sVN(p * 3.1 + 5.)) * nearF);           // the halo: paler sand strewn with broken shell
    // rudist mounds: packed tan horns seen end on, pale-green algal fuzz on top
    float mound = smoothstep(0.25, 0.7, moundK + (sVN(p * 1.3) - .5) * 0.3);
    vec3 rud = uRudist;
    if (mound > 0.001) {
      // horns seen end on, packed shoulder to shoulder: every cell is one round lid, pale and domed, with the dark slit under
      // its rim and deep shade between neighbours; lids of mixed sizes, each horn its own tone
      vec2 cp = p * 4.4 + (vec2(sVN(p * 1.3), sVN(p * 1.3 + 5.)) - .5) * 0.9; vec2 ci = floor(cp), cf = fract(cp);
      float d1 = 9., id = 0.; vec2 rv = vec2(0., 1.);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)); vec2 hh = vec2(sH21(ci + o), sH21(ci + o + 7.3));
        vec2 rr = o + 0.22 + 0.56 * hh - cf; float dd = dot(rr, rr);
        if (dd < d1) { d1 = dd; id = hh.x; rv = rr; }
      }
      float rd = sqrt(d1), RR = 0.30 + 0.17 * id;
      float lid = 1. - smoothstep(RR - 0.08, RR, rd);
      float slit = smoothstep(RR - 0.03, RR + 0.04, rd) * (1. - smoothstep(RR + 0.05, RR + 0.22, rd));
      float domeL = 0.86 + 0.30 * dot(-rv / max(rd, 1e-3), normalize(uSunDir.xz + vec2(1e-4, 0.))) * smoothstep(0., RR, rd);
      rud = uRudist * (0.30 + 0.42 * lid) * (0.78 + 0.40 * id) * domeL * (1. - 0.40 * slit) * (0.85 + 0.3 * sVN(p * 0.7 + 11.));
      rud = mix(rud, vec3(0.40, 0.55, 0.33) * (0.7 + 0.4 * sVN(p * 5.)), lid * smoothstep(0.56, 0.80, sFbm(p * 0.8 + 2.)) * 0.30);   // algal fuzz on some tops only
      // (polish 3) far off the lids melt into a mottled tan crust with green tops: never a dark net
      // (polish 4) far off the crust is bouquets a metre across: each a pale boss with a sunlit and a shaded side on a darker ground
      vec2 bq = p * 1.05 + (vec2(sVN(p * 0.5 + 3.), sVN(p * 0.5 + 9.)) - .5) * 0.9; vec2 bi = floor(bq), bf = fract(bq);
      float bd = 9., bid = 0.; vec2 br = vec2(0., 1.);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)); vec2 hh = vec2(sH21(bi + o + 3.1), sH21(bi + o + 11.7));
        vec2 rr = o + 0.2 + 0.6 * hh - bf; float dd = dot(rr, rr);
        if (dd < bd) { bd = dd; bid = hh.x; br = rr; }
      }
      float brd = sqrt(bd), boss = 1. - smoothstep(0.20, 0.66, brd);
      float bl = 0.80 + 0.42 * dot(-br / max(brd, 1e-3), normalize(uSunDir.xz + vec2(1e-4, 0.))) * smoothstep(0., 0.45, brd) * uLit.w;
      vec3 farRud = uRudist * (0.56 + 0.50 * boss) * bl * (0.82 + 0.36 * bid) * (0.86 + 0.28 * sFbm(p * 0.9 + 3.));
      farRud = mix(farRud, vec3(0.30, 0.46, 0.26) * (0.75 + 0.5 * boss), smoothstep(0.50, 0.75, sFbm(p * 0.55 + 7.)) * 0.55);
      rud = mix(farRud, rud, 1. - smoothstep(9., 30., dist));
      rud *= mix(vec3(1.), keepWarm(vPos), 0.45 * smoothstep(9., 30., dist));
    }
    col = mix(col, rud * mix(vec3(1.), keepWarm(vPos), 0.45), mound);
    // (polish 3) relief under water: every dome, shoal flank and creek wall has a side toward the Sun and a side away from it
    float ndl = clamp(dot(n, normalize(uSunDir + vec3(0., 0.55, 0.))), 0., 1.) / max(normalize(uSunDir + vec3(0., 0.55, 0.)).y, 0.2);
    col *= mix(1., clamp(0.42 + 0.62 * ndl, 0.35, 1.45), (1. - dry) * mix(0.55, 1., mound) * uLit.w);
    // the channel: the bank's edge is a seagrass slope going down into blue
    float hr = h + (sFbm(p * 0.30 + 13.) - .5) * 5.5 + (sVN(p * 1.3) - .5) * 1.4;                    // a ragged, scalloped lip, never a ruled line
    col = mix(col, uDeep * 0.30, (1. - smoothstep(-29., -7.5, hr)) * (1. - 0.45 * grass * smoothstep(-16., -8., h)));
    // the cay: wet sand at the water's edge, a dark wrack line above it, bleached dry sand on top
    float wl = h - 0.06 * sin(p.x * 0.31 + p.y * 0.17) - 0.05 * sin(t * 0.8 + p.x * 0.6 + p.y * 0.4);
    col *= mix(1., 0.72, smoothstep(-0.25, 0.02, wl) * (1. - smoothstep(0.10, 0.32, wl)));
    float wr = (1. - smoothstep(0.04, 0.20, abs(h - 0.46 - 0.22 * (sFbm(p * 0.21) - .5)))) * smoothstep(0.30, 0.62, sFbm(p * 1.1 + 3.) + 0.3 * sVN(p * 7.));
    col = mix(col, uWrack * (0.7 + 0.6 * sVN(p * 5.)) + uSand * 0.25, wr * 0.55);
    // (polish 2) dry sand close to: wind ripples lit on their Sun side, finer ripples across them, a scatter of shell hash, and bright
    float rA = (p.x * 0.5 - p.y * 0.86 + 2.5 * sFbm(p * 0.2)) * 7.;
    float rB = (p.x * 0.80 - p.y * 0.60 + 1.1 * sFbm(p * 0.7 + 4.)) * 27.;
    float fineK = (1. - smoothstep(0.5, 1.7, fwidth(rB))) * dry;
    float duneK = dry * (1. - smoothstep(20., 70., dist));
    col *= 1. + duneK * 0.22 * (smoothstep(-0.3, 0.9, sin(rA)) - 0.62) + fineK * 0.17 * (smoothstep(-0.4, 0.7, sin(rB)) - 0.5);
    float hash = smoothstep(0.80, 0.88, sVN(p * 27.)) * (1. - smoothstep(3., 14., dist));
    col *= mix(1., 1.36 - 0.10 * sVN(p * 6.) - 0.08 * smoothstep(0.5, 0.8, sVN(p * 0.9 + 5.)) - 0.30 * hash, dry);
    // (polish 3) the dry bank is not one slab: damp flats the tide has left, darker and with the sky in them; an older strand line
    // higher up; clots of cast-up seagrass
    float pool = smoothstep(0.56, 0.66, sFbm(p * 0.17 + 30.)) * smoothstep(0.22, 0.40, h) * (1. - smoothstep(0.74, 0.96, h));
    col = mix(col, col * 0.56 + uSkyTop * 0.08, pool * 0.85);
    float wr2 = (1. - smoothstep(0.03, 0.12, abs(h - 0.78 - 0.16 * (sFbm(p * 0.33 + 9.) - .5)))) * smoothstep(0.35, 0.65, sFbm(p * 1.6 + 13.) + 0.3 * sVN(p * 8.));
    col = mix(col, uWrack * (0.8 + 0.6 * sVN(p * 6.)) + uSand * 0.22, wr2 * 0.5 * dry);
    float clot = smoothstep(0.86, 0.92, sVN(p * 9. + 17.)) * smoothstep(0.45, 0.7, sFbm(p * 0.6 + 2.)) * dry * (1. - smoothstep(8., 30., dist));     // flecks of cast-up weed in drifts
    col = mix(col, uWrack * 1.3 + uSand * 0.15, clot * 0.6);
    // light: Sun, caustic net, the stranger's tide, and every shadow twice
    vec2 fs = flierShadows(vPos);
    vec2 shH = normalize(uSunDir.xz + vec2(1e-4, 0.));
    float s1 = mix(vBed.z, 0.45 + 0.55 * vBed.z, dry) * (1. - 0.55 * fs.x * uLit.w) * (1. - 0.62 * swimShadows(vPos) * uLit.w) * (1. - 0.5 * mosaShadow(vPos, shH, uShadK.y, 0.6, 1.9) * uLit.w);
    float s2 = mix(1., vBed.w, 0.4) * (1. - 0.9 * fs.y) * (1. - 0.85 * mosaShadow(vPos, vec2(0., -1.), uShadK.w, 0.10, 1.35));
    float up = clamp(dot(n, normalize(uSunDir + vec3(0., 0.25, 0.))) * 1.25, 0., 1.);
    up = mix(up, 0.56 + 0.44 * up, dry);                                         // dry sand turned from the Sun still takes the bright sky
    col *= seaLight(vPos, s1, s2, up);
    col *= 1. - (0.42 * fs.y + 0.08 * (1. - vBed.w)) * min(uSea.y, 1.);          // the second shadows, a little stronger than the light alone would draw them
    vec3 wet = seaThrough(col, vPos);
    // the lap of the sea on the sand: a thin bright thread that comes and goes
    float lap = (1. - smoothstep(0.0, 0.05, abs(wl))) * (0.5 + 0.5 * sVN(p * 1.7 + vec2(t * 0.3, 0.)));
    col = mix(wet, col, smoothstep(-0.12, 0.03, h)) + (uSunCol * 0.45 + uSHot * 0.3 * uSea.y) * lap * 0.6;
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

// =============================================================================================
// THE WATER: glass with a long swell, the sky mirrored analytically (both glitter roads), the
// mosasaur's bow wave and V wake, and the rings the plunging pterosaurs leave.
// =============================================================================================
const WATER_FRAG = /* glsl */`
  precision highp float;
  varying vec3 vPos;
  ${STRANGER_UNIFORMS_GLSL}
  ${STRANGER_GLSL}
  ${SEA_GLSL}
  ${LIT_UNIFORMS_GLSL}
  uniform vec4 uSplash[6];     // x, z, age 0..1 (0 = none yet), size
  uniform vec4 uShadK;         // x: the Sun's shadow run per metre (4.3 at 13 degrees, 1.4 at 35)
  uniform sampler2D uChart; uniform vec4 uChartBox;
  #include <fog_pars_fragment>
  void main(){
    vec2 p = vPos.xz;
    vec3 toCam = uCamL - vec3(p.x, 0., p.y);
    float dist = length(toCam);
    vec3 V = toCam / max(dist, 1e-3);
    float nearF = 1. / (1. + dist * 0.03);
    float t = uSea.z, wind = uLit.z;
    vec2 g = vec2(0.);
    float sw = sFbm(p * 0.035 + 3.) * 7.;
    float swF = 0.25 + 0.75 * nearF;
    g += vec2(0.80, 0.60) * 0.024 * swF * cos(dot(p, vec2(0.80, 0.60)) * 0.35 - t * 0.9 + sw);
    g += vec2(-0.45, 0.89) * 0.017 * swF * cos(dot(p, vec2(-0.45, 0.89)) * 0.57 - t * 1.2 + 1.7 - sw * 1.3);
    vec2 rp = p * 1.6 + vec2(t * 0.25, t * 0.18);
    float r0 = sFbm(rp);
    g += vec2(sFbm(rp + vec2(.12, 0.)) - r0, sFbm(rp + vec2(0., .12)) - r0) * (0.10 + 0.5 * nearF) * (1. + 1.6 * wind);
    vec2 fp = p * 5.3 - vec2(t * 0.4, -t * 0.3);
    float f0 = sVN(fp);
    g += vec2(sVN(fp + vec2(.2, 0.)) - f0, sVN(fp + vec2(0., .2)) - f0) * (0.10 + 0.22 * wind) * nearF;
    // cat's-paws: where a breath of wind touches the glass it goes matt and darker
    float paw = smoothstep(0.52, 0.72, sFbm(p * 0.018 + vec2(t * 0.012, 0.) + uSea.w)) * (0.25 + 0.75 * wind);
    vec2 pp = p * 2.3 + vec2(t * 0.9, t * 0.5);
    float p0 = sVN(pp);
    g += vec2(sVN(pp + vec2(.15, 0.)) - p0, sVN(pp + vec2(0., .15)) - p0) * 0.32 * paw * (0.3 + 0.7 * nearF);
    // the animal's bow wave and V wake, in its own frame (x across, y ahead)
    vec2 d = p - uMo.xy;
    float ch = cos(uMo.z), sh = sin(uMo.z);
    vec2 l = vec2(ch * d.x - sh * d.y, sh * d.x + ch * d.y);
    float behind = 5.2 - l.y;
    float foam = 0., calm = 0., glint = 0.;
    {
      // (polish 4) she is IN the water: rings of small ripples run out from her awash back and snout, close round her and gone
      // within three metres, so the glass is broken where she breaks it
      float eh = length(vec2(l.x / 0.85, (l.y - 1.7) / 4.4));
      float out1 = max(eh - 0.95, 0.);
      vec2 rad = normalize(vec2(l.x / 0.72, (l.y - 1.7) / 19.4) + vec2(1e-4, 0.));
      float rp = cos(out1 * 8.5 - t * 3.0) * exp(-out1 * 1.5) * smoothstep(0.0, 0.12, out1) * 0.085 * uMo.w * step(eh, 5.);
      g += vec2(ch * rad.x + sh * rad.y, -sh * rad.x + ch * rad.y) * rp;
    }
    if (uMo.w > 0.001 && behind > -3. && behind < 46.) {
      // a true V: each arm a short train of wavelets inside a narrow envelope, broken along its length, gone within three body
      // lengths; calm water between the arms; a thread of foam only at the bow and where the tail's lobe cuts the surface
      float bb = max(behind, 0.);
      float a = abs(l.x) - bb * 0.33 - 0.35;
      float wd = 0.75 + bb * 0.050;
      float fade = smoothstep(2.5, 8.5, behind) * (1. - smoothstep(15., 31., bb)) * exp(-bb / 14.) * uMo.w;
      float brk = smoothstep(0.40, 0.62, sVN(vec2(bb * 0.55 - t * 0.9, sign(l.x) * 3.7 + a * 0.5)));       // patches a couple of metres long
      float envA = exp(-(a * a) / (wd * wd)) * fade * brk;
      float kx = 3.4, ph = a * kx + bb * 2.8 - t * 3.0;                                    // crests oblique to the arm, as in a real wake
      vec2 gl2 = -0.075 * sin(ph) * envA * vec2(kx * sign(l.x), 0.33 * kx - 2.8);
      calm = (1. - smoothstep(-1.4, 0.2, a)) * smoothstep(1., 6., behind) * (1. - smoothstep(16., 36., bb)) * uMo.w;
      float tw = cos(bb * 2.1 - t * 5.) * 0.05 * calm * exp(-bb / 9.);                      // the tail's own swirls down the middle
      gl2.y += tw;
      g *= 1. - 0.30 * calm;                                    // (polish 4: 0.30, was 0.75: the glassy lane behind her read as a pale wedge lying on the water)
      g += vec2(ch * gl2.x + sh * gl2.y, -sh * gl2.x + ch * gl2.y);
      glint = max(cos(ph), 0.); glint = 0.30 * glint * glint * glint * envA * smoothstep(0.42, 0.80, sVN(p * 6.5 + vec2(t * 1.3, -t * 0.9))) * (0.30 + 1.5 * (1. - nearF));   // broken sparks, never a band
      float churn = sVN(l * 2.2 + vec2(0., t * 1.5)) * sVN(l * 5.1 - vec2(t, 0.));
      float hull = 1. - smoothstep(0.04, 0.16, abs(length(vec2(l.x / 0.66, (l.y - 1.9) / 3.7)) - 1.));
      foam = hull * smoothstep(2.6, 4.6, l.y) * uMo.w * uMo.w * (0.10 + 0.8 * churn)
           + exp(-(l.x * l.x + (l.y + 5.7) * (l.y + 5.7)) / 0.30) * uMo.w * uMo.w * (0.03 + 0.4 * churn);
    }
    // plunge rings: two or three ripples running out from where a pterosaur went in, a patch of foam at the centre
    for (int i = 0; i < 6; i++) {
      vec4 s = uSplash[i];
      vec2 ds = p - s.xy; float r = length(ds);
      float age = s.z;
      float R = 0.6 + 9. * age;
      float env = exp(-(r - R) * (r - R) / (0.8 + 2.5 * age)) * (1. - age) * step(0.001, age) * step(r, 16.);
      g += ds / max(r, 0.05) * cos((r - R) * 4.5) * 0.22 * env;
      foam += (1. - smoothstep(0.3, 0.9 + 1.5 * age, r)) * (1. - smoothstep(0.0, 0.40, age)) * step(0.001, age) * smoothstep(0.35, 0.65, sVN(ds * 4.5 + t)) * 0.8;
    }
    vec3 n = normalize(vec3(-g.x, 1., -g.y));
    vec3 R = reflect(-V, n); R.y = abs(R.y) + 0.002; R = normalize(R);
    float c1 = 1. - clamp(dot(n, V), 0., 1.);
    float F = 0.02 + 0.98 * c1 * c1 * c1 * c1 * c1;
    float far = 1. - nearF;
    vec3 Rs = normalize(R + vec3(0., 0.22 * far, 0.));
    vec3 refl = seaSky(Rs);
    float cl = cloudSh(p);
    refl = mix(refl, min(refl, vec3(1.05)), 0.85 * cl);        // no Sun glitter in a cloud's shade
    vec4 st = strangerSky(R);
    refl = refl * (1. - st.a) + min(st.rgb, vec3(2.4));
    F = min(F, 0.60 - 0.27 * far);                          // (the far sea keeps its own blue under the pale horizon: a clear sea line)
    F *= 1. - 0.38 * exp(-dot(l * vec2(1., 0.55), l * vec2(1., 0.55)) / 30.);
    F *= 1. - 0.10 * calm;
    F *= 1. - 0.35 * paw;
    float k = mix(0.10, 0.95, far * far);
    vec3 scatter = mix(uTurq * 0.5, uTurq * 0.42 + uDeep * 0.55, far) * (1. + 0.07 * uSea.y) * (1. - 0.25 * paw);   // (polish 4: the sea keeps its depth under the fire, so the gold road stands on it; it used to go milky)
    {
      // the chart: pale over the shoals, turquoise over the bank, olive-dark over the meadows, blue over creek and channel
      vec2 cuv = (p - uChartBox.xy) * uChartBox.zw;
      vec2 ce = min(cuv, 1. - cuv);
      float inC = smoothstep(0., 0.05, min(ce.x, ce.y));
      vec4 ch = texture2D(uChart, clamp(cuv, 0.002, 0.998));
      float dep = ch.r * 32.;
      vec3 tone = mix(uTurq * 0.98 + uSand * 0.34, uTurq * 0.66, smoothstep(0.7, 4.6, dep));
      tone = mix(tone, uDeep * 0.60 + vec3(0., 0.01, 0.04), smoothstep(6.0, 15., dep));
      tone = mix(tone, uDeep * 0.34 + vec3(0., 0.012, 0.075), smoothstep(13., 30., dep));          // (polish 3) the channel itself: ink blue
      tone = mix(tone, uGrass * 0.20 + uDeep * 0.22, max(ch.g, ch.b) * 0.80 * (1. - smoothstep(9., 20., dep)));
      tone *= (0.92 + 0.07 * uSea.y) * (1. - 0.25 * paw);
      scatter = mix(scatter, tone, inC * smoothstep(0.15, 0.6, far));
    }
    scatter *= 1. - 0.40 * cl * (0.35 + 0.65 * far);
    scatter = mix(scatter, scatter * vec3(1.20, 1.08, 0.86), clamp(uSea.y * 0.40, 0., 0.85));       // (polish 5: a warm turquoise, not pale jade: the finale keeps the sea's own colour)       // (polish 4) gold light in turquoise water: the sea goes jade under the fire
    foam = clamp(foam, 0., 1.);
    vec3 col = refl * F + scatter * (1. - F) * k;
    float alpha = F + (1. - F) * k;
    // the second glitter road: the fire's light broken by every ripple between us and the horizon under it
    {
      float fireK = uSBody.z;
      vec2 sxz = normalize(uSDir.xz + vec2(0., -1e-4));
      vec2 vxz = -V.xz / max(length(V.xz), 1e-3);
      float sd = vxz.x * sxz.y - vxz.y * sxz.x + 0.02;                    // sine of the angle off the road's line (the bead hangs a touch left of centre)
      float wdt = (0.030 + 0.085 * nearF + 0.02 * wind) * (1. + 0.45 * uSFx.z);        // (polish 4) the road broadens as the fire comes down
      float dvn = max(clamp(V.y, 0., 1.) - uSDir.y, 0.) / 0.20;
      float nearCut = exp(-dvn * dvn);                                     // glitter lies round the mirror point and out to the horizon: none at our feet
      float lane = exp(-sd * sd / (wdt * wdt)) * step(0., dot(vxz, sxz)) * (0.25 + 0.75 * nearCut);
      float spark = sVN(p * 2.7 + vec2(t * 0.45, -t * 0.3)) * sVN(p * 6.1 - vec2(t * 0.55, t * 0.2));
      spark = smoothstep(0.14, 0.50, spark + 0.25 * far);
      col += uSHot * vec3(1.0, 0.84, 0.52) * (1. + 0.35 * uSFx.z) * lane * (0.30 + 1.9 * spark) * fireK * (0.30 + 0.9 * F) * (1. - 0.6 * foam) * (0.45 + 0.55 * uShadK.x / (uShadK.x + 1.2));   // (weaker under a high Sun)
      // (polish 3) the crescent has a road of its own from the start: a thin lane of chalk sparks that widens as it grows and turns
      // gold as its limb heats (sunlight thrown back by a thing three, then six Moons wide)
      float heatK = uSBody.y;
      float cK = (clamp((uSBody.x - 0.020) * 8., 0., 0.30) + 0.55 * heatK) * (1. - fireK);
      float w2 = wdt * (0.75 + 0.5 * sFbm(p * 0.03 + 5.));
      float lane2 = exp(-sd * sd / (w2 * w2)) * step(0., dot(vxz, sxz)) * smoothstep(0.10, 0.45, far) * nearCut;
      float spark2 = smoothstep(0.95 - 0.60 * lane2, 1.20 - 0.60 * lane2, sVN(p * 2.7 + vec2(t * 0.45, -t * 0.3)) * sVN(p * 6.1 - vec2(t * 0.55, t * 0.2)) * 2.4 + 0.3 * far);   // thick with sparks down its middle, a few at its edges: a road, never a ruled beam
      col += mix(uSChalk * 0.42, uSGold * vec3(1.25, 0.86, 0.46), smoothstep(0., 0.5, heatK)) * spark2 * smoothstep(0.02, 0.45, lane2) * cK * (1. - 0.6 * foam);
    }
    col += (uSunCol * uLit.x * 0.9 + uSkyHor * 0.7 + uSHot * 0.3 * uSea.y) * glint;
    // a long dark shape under the glass: the mirror of the sky must not hide her                // the wavelets' crests catch the Sun and the bright horizon
    // (kept while she is awash too: at 20 m we look at the water at 8 degrees and only her dark length under it says how long she is)
    vec2 lw = l + (vec2(sVN(p * 1.3 + vec2(t * 0.6, 0.)), sVN(p * 1.3 + vec2(7., -t * 0.5))) - .5) * 0.7;
    float shp = (1. - smoothstep(0.35, 1.12, length(vec2(lw.x / (0.55 + 0.60 * smoothstep(-6.5, -1., lw.y)), (lw.y + 0.7) / 6.4)))) * (0.75 + 0.25 * far);
    col = mix(col, uDeep * 0.46 + uTurq * 0.10, shp * 0.62 * smoothstep(0.12, 0.5, far)); alpha = mix(alpha, 1., shp * 0.5 * smoothstep(0.12, 0.5, far));   // (polish 3: only far off; close to, her own body shows through the glass, and this was a hard slab over it)
    vec3 foamCol = max(uSunCol * 0.62 * uLit.x + uSkyTop * 0.25, uSkyHor * 0.92) + uSHot * 0.35 * uSea.y;
    col = mix(col, foamCol, foam * 0.85); alpha = mix(alpha, 1., foam * 0.85);
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }`;
const PLAIN_VERT = /* glsl */`
  varying vec3 vPos;
  #include <fog_pars_vertex>
  void main(){
    vPos = (modelMatrix * vec4(position, 1.)).xyz;
    vec4 mvPosition = viewMatrix * vec4(vPos, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
function makeWater(env) {
  const geo = new THREE.CircleGeometry(8200, 64); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: env.U, fog: true, vertexShader: PLAIN_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'sea'; mesh.renderOrder = 1; mesh.frustumCulled = false;
  return mesh;
}

// =============================================================================================
// TOOTHED SEABIRDS (Ichthyornis kind), span 0.6 m: tern-shaped, big head, long straight bill, pointed
// wings, short fan tail; white below, pearl-grey above, dark cap, eye and bill. One mesh for the forty
// we fly with and the three hundred on the cay; every bird is posed from two per-instance vectors.
// aW = (side -1/0/+1, share of the span 0..1, 1 on the wing's trailing edge, part: 0 body, 1 wing)
// =============================================================================================
class Mini {
  constructor() { this.p = []; this.c = []; this.w = []; this.i = []; this.n = 0; }
  v(x, y, z, col, w = [0, 0, 0, 0]) { this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]); this.w.push(w[0], w[1], w[2], w[3]); return this.n++; }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.i.push(a, b, c); }
  // a lofted body: rows of [z, y centre, half height, half width, colour above, colour below]
  loft(rows, K, w = [0, 0, 0, 0]) {
    const rings = [];
    for (const r of rows) {
      const first = this.n;
      for (let j = 0; j < K; j++) {
        const th = (j / K) * Math.PI * 2, cx = Math.cos(th), sy = Math.sin(th);
        const t = smoothstep(-0.35, 0.25, sy), a = r[4], b = r[5];
        this.v(cx * r[3], r[1] + sy * r[2], r[0], [lerp(b[0], a[0], t), lerp(b[1], a[1], t), lerp(b[2], a[2], t)], w);
      }
      rings.push(first);
    }
    for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < K; j++) this.quad(rings[r] + j, rings[r] + (j + 1) % K, rings[r + 1] + (j + 1) % K, rings[r + 1] + j);
    return rings;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 4));
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
}
const lin = (h, k = 1) => { const c = C(h); return [c.r * k, c.g * k, c.b * k]; };

function seabirdGeometry() {
  const G = new Mini();
  const WHITE = lin('#F4EEDC', 0.86), GREY = lin('#AEB8BF', 0.92), DARK = lin('#2B3238', 0.8), TIP = lin('#59636B', 0.8);
  // body, nose toward -Z (the way it flies): bill, big capped head, deep chest, tapering to the tail
  G.loft([
    [-0.215, 0.012, 0.002, 0.002, DARK, DARK], [-0.150, 0.014, 0.007, 0.006, DARK, DARK], [-0.118, 0.018, 0.016, 0.013, DARK, DARK],
    [-0.100, 0.022, 0.026, 0.023, DARK, WHITE], [-0.075, 0.024, 0.030, 0.027, DARK, WHITE], [-0.050, 0.018, 0.029, 0.027, GREY, WHITE],
    [-0.015, 0.008, 0.036, 0.036, GREY, WHITE], [0.030, 0.004, 0.040, 0.040, GREY, WHITE], [0.080, 0.006, 0.032, 0.032, GREY, WHITE],
    [0.125, 0.012, 0.018, 0.022, GREY, WHITE], [0.150, 0.014, 0.006, 0.016, GREY, WHITE],
  ], 6);
  // the short fan tail
  const t0 = G.v(-0.014, 0.014, 0.140, GREY), t1 = G.v(0.014, 0.014, 0.140, GREY), t2 = G.v(0.040, 0.012, 0.215, WHITE), t3 = G.v(0, 0.014, 0.200, WHITE), t4 = G.v(-0.040, 0.012, 0.215, WHITE);
  G.tri(t0, t3, t4); G.tri(t0, t1, t3); G.tri(t1, t2, t3);
  // the eye: a dark bead with one highlight on each side of the head
  for (const sx of [-1, 1]) {
    const e = G.v(sx * 0.0275, 0.028, -0.088, [1.6, 1.6, 1.6]), f = G.v(sx * 0.0275, 0.032, -0.083, [1.6, 1.6, 1.6]), g = G.v(sx * 0.0275, 0.027, -0.081, [0.02, 0.02, 0.02]);
    if (sx > 0) G.tri(e, f, g); else G.tri(e, g, f);
  }
  // wings: pointed, the wrist a third of the way out and swept forward, the hand swept back to a point
  for (const side of [-1, 1]) {
    const N = 7, lead = [], mid = [], trail = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, x = side * (0.030 + 0.270 * s);
      const zl = -0.045 - 0.030 * Math.sin(Math.min(s / 0.36, 1) * Math.PI * 0.5) + 0.105 * Math.pow(Math.max(s - 0.36, 0) / 0.64, 1.3);
      const chord = 0.092 * (1 - 0.25 * s) * Math.sqrt(Math.max(1 - Math.pow(s, 3.2), 0)) + 0.004;
      const top = s > 0.72 ? TIP : GREY;
      lead.push(G.v(x, 0.020, zl, top, [side, s, 0, 1]));
      mid.push(G.v(x, 0.026 - 0.006 * s, zl + chord * 0.45, top, [side, s, 0.4, 1]));
      trail.push(G.v(x, 0.018, zl + chord, s > 0.72 ? TIP : WHITE, [side, s, 1, 1]));
    }
    for (let i = 0; i < N; i++) {
      if (side > 0) { G.quad(lead[i], mid[i], mid[i + 1], lead[i + 1]); G.quad(mid[i], trail[i], trail[i + 1], mid[i + 1]); }
      else { G.quad(lead[i], lead[i + 1], mid[i + 1], mid[i]); G.quad(mid[i], mid[i + 1], trail[i + 1], trail[i]); }
    }
  }
  return G.build();
}

// (polish 3) the same bird standing on sand: upright on two short legs, bill level, wings folded along the flanks with their dark
// tips crossed over the tail. aW = (part: 0 body, 1 head and neck, 2 legs; weight; 0; 0). It turns its head, and some sit.
function perchGeometry() {
  const G = new Mini();
  const WHITE = lin('#F4EEDC', 0.86), GREY = lin('#AEB8BF', 0.92), DARK = lin('#2B3238', 0.8), TIP = lin('#59636B', 0.8), LEG = lin('#3A3F45', 0.9);
  const H = (w) => [1, w, 0, 0];
  G.loft([[-0.172, 0.150, 0.003, 0.003, DARK, DARK], [-0.108, 0.153, 0.012, 0.010, DARK, DARK]], 6, H(1));
  G.loft([[-0.108, 0.153, 0.012, 0.010, DARK, DARK], [-0.086, 0.158, 0.026, 0.023, DARK, WHITE], [-0.052, 0.157, 0.029, 0.026, DARK, WHITE], [-0.030, 0.140, 0.027, 0.025, GREY, WHITE]], 8, H(1));
  G.loft([[-0.030, 0.140, 0.027, 0.025, GREY, WHITE], [-0.004, 0.112, 0.038, 0.035, GREY, WHITE], [0.045, 0.096, 0.045, 0.041, GREY, WHITE], [0.100, 0.088, 0.036, 0.034, GREY, WHITE],
    [0.150, 0.086, 0.019, 0.023, GREY, WHITE], [0.200, 0.090, 0.006, 0.018, WHITE, WHITE]], 8);
  for (let k = 0; k < 8; k++) { G.w[(44 + k) * 4] = 1; G.w[(44 + k) * 4 + 1] = 1; }                // the trunk's first ring is the neck's last: it turns with the head
  for (const sx of [-1, 1]) {
    // the folded wing: a long leaf on the flank, grey, its primaries dark and reaching past the tail
    const a = G.v(sx * 0.034, 0.128, -0.012, GREY), b = G.v(sx * 0.046, 0.112, 0.060, GREY), c = G.v(sx * 0.040, 0.080, 0.050, GREY), d = G.v(sx * 0.036, 0.104, 0.150, TIP), e = G.v(sx * 0.030, 0.082, 0.140, GREY), f = G.v(sx * 0.010, 0.100, 0.250, TIP);
    if (sx > 0) { G.tri(a, c, b); G.quad(b, c, e, d); G.tri(d, e, f); } else { G.tri(a, b, c); G.quad(b, d, e, c); G.tri(d, f, e); }
    // eye and its highlight
    const e0 = G.v(sx * 0.0265, 0.166, -0.080, [0.02, 0.02, 0.02], H(1)), e1 = G.v(sx * 0.0265, 0.158, -0.072, [0.02, 0.02, 0.02], H(1)), e2 = G.v(sx * 0.0265, 0.158, -0.088, [1.5, 1.5, 1.5], H(1));
    if (sx > 0) G.tri(e0, e1, e2); else G.tri(e0, e2, e1);
    // leg and foot
    const L = [2, 0, 0, 0], x = sx * 0.016;
    const p0 = G.v(x - 0.006, 0.066, 0.050, LEG, L), p1 = G.v(x + 0.006, 0.066, 0.050, LEG, L), p2 = G.v(x, 0.066, 0.062, LEG, L);
    const q0 = G.v(x - 0.006, 0.0, 0.046, LEG, L), q1 = G.v(x + 0.006, 0.0, 0.046, LEG, L), q2 = G.v(x, 0.0, 0.058, LEG, L);
    G.quad(p0, p1, q1, q0); G.quad(p1, p2, q2, q1); G.quad(p2, p0, q0, q2);
    const t0 = G.v(x - 0.016, 0.002, 0.012, LEG, L), t1 = G.v(x + 0.016, 0.002, 0.012, LEG, L);
    G.tri(q0, q1, t1); G.tri(q0, t1, t0);
  }
  return G.build();
}
const PERCH_DEFORM = /* glsl */`
  {
    float hd = iC.x, crouch = iC.y;
    if (aW.x > 0.5 && aW.x < 1.5) {
      vec3 q = p - vec3(0., 0.125, -0.020);
      float a = hd * aW.y, cs = cos(a), sn = sin(a);
      q = vec3(cs * q.x + sn * q.z, q.y - 0.030 * crouch * aW.y + 0.012 * iC.z * aW.y, -sn * q.x + cs * q.z + 0.022 * crouch * aW.y);
      p = q + vec3(0., 0.125, -0.020);
      n = vec3(cs * n.x + sn * n.z, n.y, -sn * n.x + cs * n.z);
    }
    if (aW.x > 1.5) p.y *= 1. - crouch; else p.y -= 0.060 * crouch;
  }`;

// the same bird for the roost, seen only from 30 m and more: 44 triangles
function roostGeometry() {
  const G = new Mini();
  const WHITE = lin('#F4EEDC', 0.86), GREY = lin('#AEB8BF', 0.92), DARK = lin('#2B3238', 0.8), TIP = lin('#59636B', 0.8);
  G.loft([[-0.205, 0.013, 0.004, 0.004, DARK, DARK], [-0.095, 0.022, 0.027, 0.024, DARK, WHITE], [0.005, 0.006, 0.039, 0.039, GREY, WHITE], [0.105, 0.009, 0.026, 0.028, GREY, WHITE], [0.205, 0.013, 0.004, 0.032, WHITE, WHITE]], 4);
  for (const side of [-1, 1]) {
    const N = 3, lead = [], trail = [];
    for (let i = 0; i <= N; i++) {
      const sp = i / N, x = side * (0.030 + 0.270 * sp);
      const zl = -0.045 - 0.030 * Math.sin(Math.min(sp / 0.36, 1) * Math.PI * 0.5) + 0.105 * Math.pow(Math.max(sp - 0.36, 0) / 0.64, 1.3);
      const chord = 0.092 * (1 - 0.25 * sp) * Math.sqrt(Math.max(1 - Math.pow(sp, 3.2), 0)) + 0.006;
      lead.push(G.v(x, 0.022, zl, sp > 0.72 ? TIP : GREY, [side, sp, 0, 1])); trail.push(G.v(x, 0.018, zl + chord, sp > 0.72 ? TIP : WHITE, [side, sp, 1, 1]));
    }
    for (let i = 0; i < N; i++) { if (side > 0) G.quad(lead[i], trail[i], trail[i + 1], lead[i + 1]); else G.quad(lead[i], lead[i + 1], trail[i + 1], trail[i]); }
  }
  return G.build();
}

// the shared lit shader for our own animals: per-instance pose (iA = x, y, z, heading; iB = pitch, bank, size, fade),
// a deform hook that works on 'p' (model space, metres, nose toward -Z) and may read iC, then both lights.
function animalMaterial(U, deform, extraFrag = '', opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide, vertexColors: true,
    vertexShader: /* glsl */`
      attribute vec4 aW; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
      varying vec3 vCol; varying vec3 vN; varying vec3 vWP; varying vec4 vW; varying vec3 vL; varying float vFade;
      uniform vec4 uSea;
      #include <fog_pars_vertex>
      vec3 rotX(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }
      vec3 rotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
      vec3 rotZ(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }
      void main(){
        vec3 p = position; vec3 n = normal; float t = uSea.z;
        ${deform}
        p *= iB.z;
        p = rotY(rotX(rotZ(p, iB.y), iB.x), -iA.w); n = rotY(rotX(rotZ(n, iB.y), iB.x), -iA.w);
        vWP = p + iA.xyz; vN = n; vCol = color; vW = aW; vL = position; vFade = iB.w;
        vec4 mvPosition = viewMatrix * vec4(vWP, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vCol; varying vec3 vN; varying vec3 vWP; varying vec4 vW; varying vec3 vL; varying float vFade;
      ${STRANGER_UNIFORMS_GLSL}
      ${S_NOISE_GLSL}
      ${SEA_GLSL}
      ${LIT_UNIFORMS_GLSL}
      ${UNDER_GLSL}
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 V = normalize(uCamL - vWP + vec3(0., 1e-4, 0.));
        ${opts.twoSided === false ? '' : 'if (dot(n, V) < 0.) n = -n;'}
        vec3 alb = vCol * vFade;
        float gloss = 0.; vec3 add = vec3(0.);
        ${extraFrag}
        float up = 0.5 + 0.5 * n.y;
        float sunL = clamp(dot(n, normalize(uSunDir + vec3(0., 0.12, 0.))) * 0.8 + 0.2, 0., 1.);
        float strL = clamp(dot(n, uStrL) * 0.85 + 0.15, 0., 1.);
        vec3 light = uSunCol * uLit.x * 1.5 * sunL + mix(uTurq * 0.34 + vec3(0.26) + uSunCol * uLit.x * 0.26, uFill * 3.0, up) * uLit.y + uSHot * uSea.y * 0.75 * strL;
        light += (uSunCol * uLit.x * 0.75 * (0.12 + 0.88 * clamp(-dot(n, normalize(uSunDir)), 0., 1.)) + uSHot * uSea.y * 0.3 * clamp(-dot(n, uStrL), 0., 1.)) * vW.w;   // light through the wing
        vec3 col = alb * light + add;
        vec3 H = normalize(normalize(uSunDir) + V);
        float sp = clamp(dot(n, H), 0., 1.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
        float fr = 1. - clamp(dot(n, V), 0., 1.);
        col += (uSunCol * uLit.x * sp * sp * 1.4 + uFill * 1.6 * fr * fr * fr) * gloss;
        if (vWP.y < 0.) col = seaThrough(col * (0.42 + 0.4 * sCaus(vWP.xz * 1.7, uSea.z) * up), vWP);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}
function instanced(geo, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  const a = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), b = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), c = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  a.setUsage(THREE.DynamicDrawUsage); b.setUsage(THREE.DynamicDrawUsage); c.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iA', a); g.setAttribute('iB', b); g.setAttribute('iC', c); g.instanceCount = count;
  return { geo: g, a, b, c };
}

const WING_DEFORM = (r0, flex) => /* glsl */`
  if (aW.w > 0.5) {
    float s = aW.y, side = aW.x, ph = iC.x, amp = iC.y, fold = iC.z;
    float xr = max(abs(p.x) - ${r0}, 0.);
    float a = amp * (sin(ph) * (0.45 + 0.55 * s) + ${flex} * s * sin(ph - 1.1)) + 0.10 * (1. - min(amp, 1.)) * (1. - fold);
    xr *= (1. - 0.30 * s * max(cos(ph), 0.) * min(amp, 1.)) * mix(1., 0.10, fold);
    p.z += fold * s * 0.16;
    float y0 = p.y;
    p.y = y0 + sin(a) * xr - fold * 0.004;
    p.x = side * (${r0} + cos(a) * xr);
    n = rotZ(n, a * side);
  }`;

async function makeBirds(env) {
  const { ctx, rng, U, path, detail, ground, portalPos, endDir, endRight } = env;
  const r = rng.fork('birds');
  const NF = 40, NR = Math.round(330 * (detail < 1 ? 0.5 : 1)), NS = Math.round(54 * (detail < 1 ? 0.7 : 1)), N = NF + NS;
  const I = instanced(seabirdGeometry(), N), RI = instanced(roostGeometry(), NR);
  const mesh = new THREE.Mesh(I.geo, animalMaterial(U, WING_DEFORM('0.030', '0.30')));
  mesh.name = 'seabirds'; mesh.frustumCulled = false;
  const PI = instanced(perchGeometry(), NS);
  const pmesh = new THREE.Mesh(PI.geo, animalMaterial(U, PERCH_DEFORM)); pmesh.name = 'spitParty'; pmesh.frustumCulled = false;
  const rmesh = new THREE.Mesh(RI.geo, mesh.material); rmesh.name = 'roost'; rmesh.frustumCulled = false;   // the roost: the same bird in 44 triangles (never nearer than 30 m)
  // the forty: six strung just ahead of us, the rest loose in front and to both sides
  const fl = [[2.7, -1.15, -0.45], [3.6, 1.5, -0.15], [4.6, -2.3, 0.35], [5.4, 0.7, -0.75], [6.6, 2.7, 0.05], [7.6, -1.6, 0.85]].map((f) => ({ lead: f[0], side: f[1], up: f[2] }));
  // ten outriders well ahead and near the line: late in the flight it is their hard second shadows that comb back over the bed in front of us
  for (let k = 0; k < 16; k++) fl.push({ lead: 49 + k * 2.1 + r.range(-1, 1), side: (k % 2 ? 1 : -1) * r.range(1.5, 13), up: r.range(-0.6, 1.4), out: 1 });
  while (fl.length < NF) { const lead = r.range(9, 86), sd = (r.chance(0.5) ? -1 : 1) * r.range(1.8, 4 + lead * 0.42); fl.push({ lead, side: sd, up: r.range(-1.0, 2.6) }); }
  for (const f of fl) { f.off = r(); f.wp = r.range(0, 6.28); f.size = r.range(1.25, 1.45); }
  const slot = new Int8Array(NF).fill(-1);
  for (let i = 6; i < 22; i++) slot[i] = i - 6;
  // the roost on the cay: two dense rafts on the crests either side of the gap, thinning outward along both arms
  const roost = [];
  let guard = 0;
  while (roost.length < NR && guard++ < 9000) {
    if (guard % 30 === 0) await ctx.yield();
    const k = r.chance(0.5) ? 0 : 1, c = ground.armC[k];
    const out = 34 * Math.pow(r(), 1.5), al = (k ? 1 : -1) * (44 - out), ac = r.gauss() * 2.4;
    const x = c.x + endRight.x * al + endDir.x * ac, z = c.z + endRight.z * al + endDir.z * ac, h = ground.surfAt(x, z);
    if (ground.baseSurfAt(x, z) < 0.45) continue;
    // they go up as one sheet: a wave that starts at the gap and runs outward along each arm in under a second
    roost.push({ x, y: h + 0.035, z, head: r.range(-0.9, 0.9) + 0.7, delay: r.range(0, 0.45) + out * 0.022, rise: 1.2 + 10.0 * Math.pow(r(), 1.1), sp: r.range(2.6, 4.6), ph: r.range(0, 6.28), size: r.range(3.0, 4.0), dr: r.range(-0.3, 0.3) });
  }
  const Lx = -endRight.x * 0.86 + endDir.x * 0.5, Lz = -endRight.z * 0.86 + endDir.z * 0.5, Lh = Math.atan2(Lx, -Lz);
  // (polish 2) a party resting on the spit, heads to the Sun: as we come over the sand they go up round us, each when we are a
  // dozen metres short of it, and scatter low to both sides (keyed to u)
  const sp = ground.spit, spitBirds = [], sunHd = Math.atan2(env.sunDir.x, -env.sunDir.z), pathHd = Math.atan2(sp.tx, -sp.tz);
  guard = 0;
  while (spitBirds.length < NS - 6 && guard++ < 4000) {
    if (guard % 30 === 0) await ctx.yield();
    const al = clamp(r.gauss() * 10, -24, 26) + 3, ac = r.gauss() * 2.6 + 3.0 * Math.sin(al * 0.11 + 0.7) + 1.6 * Math.sin(al * 0.27 + 2.0);
    const x = sp.x + sp.ax * al + sp.az * ac, z = sp.z + sp.az * al - sp.ax * ac, h = ground.surfAt(x, z);
    if (ground.baseSurfAt(x, z) < 0.30) continue;
    const near = path.nearestXZ(x, z), lat = (x - sp.x) * -sp.tz + (z - sp.z) * sp.tx;            // metres to the right of our line
    if (near.dist < 0.9) continue;
    const bold = r.chance(0.3);
    spitBirds.push({ x, y: h, z, head: sunHd + r.range(-0.5, 0.5) + (r.chance(0.2) ? r.range(-1.6, 1.6) : 0), sit: r.chance(0.3) ? 1 : 0, look: r.range(0.3, 1.1), u0: near.u - ((bold ? r.range(1.5, 4) : r.range(7, 13)) + 0.3 * near.dist) / path.length,
      out: pathHd + (lat > 0 ? 1 : -1) * r.range(0.12, 0.85), rise: 0.8 + 3.6 * Math.pow(r(), 0.8), sp: r.range(7.5, 11.5), ph: r.range(0, 6.28), size: r.range(1.5, 1.8) });
  }
  for (let k = 0; k < 6 && spitBirds.length < NS; k++) {
    const uS = 0.527 + 0.0045 * k, Pk = path.posAtDist(uS * path.length), Tk = path.tangentAtDist(uS * path.length), lat = (k % 2 ? 1 : -1) * (1.0 + 0.55 * (k % 3));
    const x = Pk.x - Tk.z * lat, z = Pk.z + Tk.x * lat, h = ground.surfAt(x, z);
    if (ground.baseSurfAt(x, z) < 0.25) continue;
    spitBirds.push({ x, y: h, z, head: sunHd + r.range(-0.6, 0.6), sit: 0, look: r.range(0.5, 1.1), u0: uS - r.range(1.6, 3.0) / path.length,
      out: pathHd + (lat > 0 ? 1 : -1) * r.range(0.3, 0.8), rise: 0.8 + 2.4 * r(), sp: r.range(7.5, 10), ph: r.range(0, 6.28), size: r.range(1.7, 1.9) });
  }
  env.spitBirds = spitBirds;
  // (polish 4) the near edge of the roost's sheet comes OUR way: once the party on the spit is behind us its birds (the full mesh) are
  // the first of the roost off the inner ends of both arms, and they stream past us on both sides, wingtip to wingtip, the fire's
  // light coming through their wings. Each is keyed to u: it reaches its place beside our line as we do.
  const wave = [];
  await ctx.yield();
  for (let j = 0; j < NS; j++) {
    if (j % 20 === 19) await ctx.yield();
    const k = j % 2, c = ground.armC[k], al = (k ? 1 : -1) * (44 - 26 * Math.pow(r(), 1.4)), ac = r.gauss() * 2.0;
    const sx = c.x + endRight.x * al + endDir.x * ac, sz = c.z + endRight.z * al + endDir.z * ac;
    let uP = r.range(0.905, 0.995), lat = (j % 4 < 2 ? -1 : 1) * r.range(1.5, 7.5), dy = r.range(-2.4, 1.8);
    if (j < 10) { uP = 0.9415 + 0.0017 * j + 0.0006 * r(); lat = (j % 2 ? 1 : -1) * (2.7 + 0.5 * j); dy = [1.1, 0.9, 1.5, 1.8, 0.8, 1.6, 2.2, 1.1, 2.0, 1.4][j]; }   // ten in a string close past us on either hand
    const Pp = path.posAtDist(uP * path.length), delay = r.range(0, 0.7);
    wave.push({ sx, sy: Math.max(ground.surfAt(sx, sz), 0.3) + 0.2, sz, px: Pp.x + endRight.x * lat, py: Pp.y + dy - 0.12 * Math.abs(lat), pz: Pp.z + endRight.z * lat,
      T: Math.max((uP - 0.866) * 40 - delay, 0.6), delay, ph: r.range(0, 6.28), size: r.range(1.5, 1.85) });
  }
  const P = new THREE.Vector3(), T = new THREE.Vector3();
  const TC = 10 / 3;                                    // four beats at three a second, then a two second glide
  const roostK = env.look.sunEl > 20 ? 0.76 : 0.9;       // under a high Sun the white sheet would clip: separate pale birds, not a smear
  function update(dt, time, camera, u, camPos) {
    const a = I.a.array, b = I.b.array, c = I.c.array, d0 = u * path.length;
    const peel = smoothstep(0.84, 0.97, u), clearMo = smoothstep(0.26, 0.31, u) * (1 - smoothstep(0.38, 0.43, u));   // the six nearest draw aside while she crosses our bow
    const closeK = smoothstep(0.095, 0.145, u) * (1 - smoothstep(0.205, 0.25, u)), lowK = smoothstep(0.575, 0.635, u) * (1 - smoothstep(0.83, 0.92, u));
    for (let i = 0; i < NF; i++) {
      const f = fl[i], cyc = (time / TC + f.off) % 1, beat = clamp(cyc / 0.4, 0, 1);
      const amp = smoothstep(0, 0.08, beat) * (1 - smoothstep(0.9, 1, beat));
      let lead = f.lead + 1.2 * Math.sin(time * 0.31 + f.wp) * Math.min(f.lead * 0.2, 1);
      if (i < 2) lead = lerp(lead, i ? 2.3 : 1.4, closeK);
      path.posAtDist(d0 + lead, P); path.tangentAtDist(d0 + lead, T);
      const hx = T.x, hz = T.z, il = 1 / Math.max(Math.hypot(hx, hz), 1e-4);
      let side = f.side * (1 + (i < 6 ? 3.2 : f.out ? 0 : 0.25) * peel + (i < 6 ? 2.6 : 0) * clearMo) + 0.5 * Math.sin(time * 0.43 + f.wp * 1.7);
      if (i < 2) side = lerp(side, i ? -0.2 : 0.85, closeK);
      const base = i < 3 ? P.y : lerp(P.y, Math.min(P.y, 2.6 + 0.9 * f.off), lowK);                 // (polish 3) the rest skim on below us while we climb
      const y = Math.max(base + (i < 2 ? lerp(f.up, i ? -0.45 : -0.18, closeK) : f.up) + 0.22 * Math.sin(time * 0.6 + f.wp) * (i < 2 ? 1 - 0.7 * closeK : 1) + 0.10 * (amp - 0.4), 0.55);
      a[i * 4] = P.x - hz * il * side; a[i * 4 + 1] = y; a[i * 4 + 2] = P.z + hx * il * side; a[i * 4 + 3] = Math.atan2(hx, -hz) + 0.05 * Math.sin(time * 0.43 + f.wp * 1.7 + 1.57);
      b[i * 4] = T.y * 0.9 + 0.06 * amp; b[i * 4 + 1] = -0.25 * Math.cos(time * 0.43 + f.wp * 1.7); b[i * 4 + 2] = f.size; b[i * 4 + 3] = 1;
      c[i * 4] = beat * 4 * 6.2832; c[i * 4 + 1] = 0.95 * amp; c[i * 4 + 2] = 0; c[i * 4 + 3] = 0;
      if (i < 2 && closeK > 0) { b[i * 4 + 1] = lerp(b[i * 4 + 1], i ? -0.35 : -0.6, closeK); c[i * 4] = lerp(c[i * 4], (time * 3 * 6.2832 + i * 2.2) % 62.832, closeK > 0.5 ? 1 : 0); c[i * 4 + 1] = lerp(c[i * 4 + 1], 0.85, closeK); }
      if (slot[i] >= 0 && (slot[i] < 10 || u >= 0.75)) U.uShad.value[slot[i]].set(a[i * 4], y, a[i * 4 + 2], 0.6);   // slots 10 to 15 are the pterosaurs' until we have left them behind
    }
    for (let j = 0; j < NS; j++) {
      const q = spitBirds[j], i = NF + j;
      if (u > 0.84) {
        const w = wave[j], tau = (u - 0.866) * 40 - w.delay, f = tau / w.T;
        if (tau <= 0 || f > 1.5) { b[i * 4 + 2] = 0; continue; }
        const up = smoothstep(0, 0.5, f), vx = (w.px - w.sx) / w.T, vz = (w.pz - w.sz) / w.T, k = smoothstep(0, 0.35, tau);
        a[i * 4] = w.sx + vx * tau + 0.5 * Math.sin(tau * 1.1 + w.ph); a[i * 4 + 1] = lerp(w.sy, w.py, up) + 0.25 * Math.sin(tau * 1.7 + w.ph) * k; a[i * 4 + 2] = w.sz + vz * tau; a[i * 4 + 3] = Math.atan2(vx, -vz);
        b[i * 4] = 0.30 * (1 - up) + 0.05 * Math.sin(tau * 2.1 + w.ph); b[i * 4 + 1] = 0.30 * Math.sin(tau * 0.9 + w.ph) * k; b[i * 4 + 2] = w.size * k; b[i * 4 + 3] = 0.82;
        c[i * 4] = (tau * 3.3 * 6.2832 + w.ph) % 6283.2; c[i * 4 + 1] = 1.0 * k; c[i * 4 + 2] = 1 - k; c[i * 4 + 3] = 0;
        continue;
      }
      if (!q || u < 0.30 || u > 0.80) { b[i * 4 + 2] = 0; continue; }
      const tau = (u - q.u0) * 40;
      {
        // standing (or sitting) on the sand until its moment: it looks round, and stretches up just before it goes
        const pa = PI.a.array, pb = PI.b.array, pc = PI.c.array, alert = smoothstep(-1.4, -0.2, tau);
        pa[j * 4] = q.x; pa[j * 4 + 1] = q.y; pa[j * 4 + 2] = q.z; pa[j * 4 + 3] = q.head;
        pb[j * 4] = 0.06 * alert; pb[j * 4 + 1] = 0; pb[j * 4 + 2] = tau <= 0 ? q.size * smoothstep(0.30, 0.345, u) : 0; pb[j * 4 + 3] = 1;
        pc[j * 4] = q.look * Math.sin(time * 0.6 + q.ph) * Math.sin(time * 0.23 + q.ph * 3) * (1 - 0.6 * alert); pc[j * 4 + 1] = q.sit * (1 - alert); pc[j * 4 + 2] = alert; pc[j * 4 + 3] = 0;
      }
      if (tau <= 0) {
        b[i * 4 + 2] = 0;
      } else {
        const k = smoothstep(0, 0.4, tau), run = q.sp * (tau - 0.5 * (1 - Math.exp(-tau * 2.0)));
        const hd = q.head + Math.atan2(Math.sin(q.out - q.head), Math.cos(q.out - q.head)) * smoothstep(0, 0.8, tau);
        a[i * 4] = q.x + Math.sin(q.out) * run; a[i * 4 + 1] = q.y + 0.12 + 0.25 * k + q.rise * (1 - Math.exp(-tau * 1.0)) + 0.2 * Math.sin(tau * 1.3 + q.ph) * k;
        a[i * 4 + 2] = q.z - Math.cos(q.out) * run; a[i * 4 + 3] = hd;
        b[i * 4] = 0.16 * (1 - k) + 0.34 * Math.exp(-tau * 1.1) * k; b[i * 4 + 1] = 0.35 * Math.sin(tau * 0.9 + q.ph) * k; b[i * 4 + 2] = q.size * (1 - smoothstep(7, 9, tau)); b[i * 4 + 3] = 1;
        c[i * 4] = (tau * 3.4 * 6.2832 + q.ph) % 6283.2; c[i * 4 + 1] = 1.05 * k; c[i * 4 + 2] = 1 - k; c[i * 4 + 3] = 0;
      }
    }
    const lit2 = Math.min(U.uSea.value.y, 2.2);                       // the second light through their wings: the sheet is pale against the far sea
    const ra = RI.a.array, rb = RI.b.array, rc = RI.c.array;
    for (let j = 0; j < roost.length; j++) {
      const q = roost[j], i = j, tau = (u - 0.858) * 40 - q.delay;
      if (tau <= 0) {
        ra[i * 4] = q.x; ra[i * 4 + 1] = q.y; ra[i * 4 + 2] = q.z; ra[i * 4 + 3] = q.head + 0.25 * Math.sin(time * 0.7 + q.ph) * Math.sin(time * 0.23 + q.ph * 3);
        rb[i * 4] = 0.42; rb[i * 4 + 1] = 0; rb[i * 4 + 2] = q.size * 0.68; rb[i * 4 + 3] = 1;
        rc[i * 4] = 0; rc[i * 4 + 1] = 0; rc[i * 4 + 2] = 1; rc[i * 4 + 3] = 0;
      } else {
        const k = smoothstep(0, 0.45, tau), run = q.sp * (tau - 0.5 * (1 - Math.exp(-tau * 2.0))) + 1.6 * Math.max(tau - 2.6, 0) * Math.max(tau - 2.6, 0);
        const hd = q.head + (Lh + q.dr - q.head) * smoothstep(0, 0.9, tau);
        ra[i * 4] = q.x + (Lx + q.dr * Lz * 0.6) * run; ra[i * 4 + 1] = q.y + 0.3 * k + q.rise * (1 - Math.exp(-tau * 1.15)) + 0.25 * Math.sin(tau * 1.3 + q.ph);
        ra[i * 4 + 2] = q.z + (Lz - q.dr * Lx * 0.6) * run; ra[i * 4 + 3] = hd;
        rb[i * 4] = 0.42 * (1 - k) + 0.30 * Math.exp(-tau * 1.1); rb[i * 4 + 1] = 0.3 * Math.sin(tau * 0.9 + q.ph) * k; rb[i * 4 + 2] = q.size * (0.68 + 0.32 * k); rb[i * 4 + 3] = roostK * (1 + 0.16 * k * lit2);
        rc[i * 4] = (tau * 3.6 * 6.2832 + q.ph) % 6283.2; rc[i * 4 + 1] = 1.05 * k; rc[i * 4 + 2] = 1 - k; rc[i * 4 + 3] = 0;
      }
    }
    RI.a.needsUpdate = true; RI.b.needsUpdate = true; RI.c.needsUpdate = true; PI.a.needsUpdate = true; PI.b.needsUpdate = true; PI.c.needsUpdate = true;
    I.a.needsUpdate = true; I.b.needsUpdate = true; I.c.needsUpdate = true;
  }
  return { mesh, roost: rmesh, party: pmesh, update };
}

// (Our own wingtips are gone: nothing is carried with the camera. The flock beside us says what we are.)

// =============================================================================================
// PTEROSAURS (nyctosaurid kind), span 3 m. Side silhouette as shares of the 0.95 m head-to-ankle length:
// a straight toothless bill and low-keeled skull 0.42 (as long as the whole trunk), a short furred neck,
// a gull-sized trunk, short legs trailing together, no tail. Top silhouette: wings very long and narrow,
// the wrist the foremost point a third of the way out (a sharp kink, no claws), the one long finger
// sweeping back to a point, the membrane running from it back to the ankle.
// =============================================================================================
function pterosaurGeometry() {
  const G = new Mini();
  const FUR = lin('#F4EEDC', 0.82), FURS = lin('#CFC9B8', 0.7), BILL = lin('#F2C879', 0.85), BILLD = lin('#B98A3C', 0.8), MEM = lin('#8D9AA3', 0.95), TIP = lin('#3B444B', 0.9), ARM = lin('#8C8474', 0.62), DARK = [0.02, 0.02, 0.022];        // (the arm and the long finger show darker inside the membrane)
  // head: bill tip at -0.66, eye at -0.30, occiput at -0.24; then neck and trunk
  G.loft([
    [-0.660, 0.060, 0.003, 0.002, BILL, BILL], [-0.560, 0.066, 0.013, 0.009, BILL, BILL], [-0.450, 0.073, 0.023, 0.015, BILL, BILLD], [-0.360, 0.080, 0.034, 0.023, BILL, BILL],
    [-0.315, 0.086, 0.044, 0.034, FUR, FUR], [-0.280, 0.092, 0.051, 0.041, FUR, FUR], [-0.245, 0.092, 0.046, 0.039, FUR, FURS], [-0.210, 0.080, 0.037, 0.034, FUR, FURS],
    [-0.150, 0.056, 0.041, 0.042, FUR, FURS], [-0.090, 0.036, 0.066, 0.088, FUR, FURS], [-0.010, 0.022, 0.088, 0.108, FUR, FURS], [0.090, 0.020, 0.080, 0.094, FUR, FURS],
    [0.180, 0.022, 0.058, 0.070, FUR, FURS], [0.250, 0.026, 0.034, 0.048, FURS, FURS], [0.290, 0.028, 0.010, 0.026, FURS, FURS],
  ], 10);
  // the low keel-crest: a thin blade along the top of the skull
  for (const sx of [-1, 1]) {
    const a = G.v(sx * 0.012, 0.118, -0.390, BILL), e = G.v(0, 0.166, -0.330, BILL), b = G.v(0, 0.214, -0.250, BILLD), c = G.v(0, 0.226, -0.105, BILLD), f = G.v(sx * 0.006, 0.184, -0.150, BILLD), d = G.v(sx * 0.016, 0.124, -0.215, FUR);
    if (sx > 0) { G.tri(a, e, d); G.tri(e, b, d); G.tri(b, f, d); G.tri(b, c, f); } else { G.tri(a, d, e); G.tri(e, d, b); G.tri(b, d, f); G.tri(b, f, c); }
  }
  // the dark line of the closed bill, eye and highlight on each side
  for (const sx of [-1, 1]) {
    const m0 = G.v(sx * 0.0155, 0.069, -0.450, DARK), m1 = G.v(sx * 0.0155, 0.075, -0.450, DARK), m2 = G.v(sx * 0.0355, 0.083, -0.300, DARK), m3 = G.v(sx * 0.0355, 0.076, -0.300, DARK);
    if (sx > 0) G.quad(m0, m3, m2, m1); else G.quad(m0, m1, m2, m3);
    const ex = sx * 0.0415, e = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; e.push(G.v(ex, 0.100 + 0.021 * Math.sin(a), -0.287 + 0.023 * Math.cos(a), DARK)); }
    const ec = G.v(ex + sx * 0.004, 0.100, -0.287, DARK);
    for (let k = 0; k < 6; k++) { if (sx > 0) G.tri(ec, e[(k + 1) % 6], e[k]); else G.tri(ec, e[k], e[(k + 1) % 6]); }
    const h0 = G.v(ex + sx * 0.006, 0.103, -0.297, [2.4, 2.4, 2.4]), h1 = G.v(ex + sx * 0.006, 0.114, -0.290, [2.4, 2.4, 2.4]), h2 = G.v(ex + sx * 0.006, 0.103, -0.283, [2.4, 2.4, 2.4]);
    if (sx > 0) G.tri(h0, h2, h1); else G.tri(h0, h1, h2);
    // short hind legs trailing together, feet as small paddles
    G.loft([[0.24, 0.024, 0.016, 0.014, FURS, FURS], [0.40, 0.020, 0.011, 0.010, ARM, ARM], [0.56, 0.018, 0.008, 0.008, ARM, ARM], [0.66, 0.016, 0.004, 0.016, MEM, MEM]].map((r) => { r = r.slice(); r.push(0); return r; }), 4).forEach(() => {});
    const base = G.n - 16; for (let k = 0; k < 16; k++) G.p[(base + k) * 3] += sx * (0.034 + 0.045 * Math.floor(k / 4) / 3);
  }
  // ragged fur along the nape, back and belly: the outline must not be smooth
  for (let k = 0; k < 9; k++) {
    const z = -0.23 + k * 0.055, top = k < 2 ? 0.130 - k * 0.012 : (k < 4 ? 0.100 : 0.106) - Math.abs(k - 5) * 0.004, yb = -0.062 + Math.abs(k - 5) * 0.010;
    const a = G.v(0, top - 0.012, z, FUR), b = G.v(0, top + 0.022, z + 0.034, FUR), c = G.v(0, top - 0.014, z + 0.050, FURS); G.tri(a, b, c);
    if (k > 2) { const d = G.v(0, yb + 0.010, z, FURS), e = G.v(0, yb - 0.022, z + 0.036, FURS), f = G.v(0, yb + 0.010, z + 0.05, FURS); G.tri(d, f, e); }
  }
  // wings
  const WR = 0.38;
  const leadZ = (s) => s < WR ? lerp(-0.045, -0.215, Math.pow(s / WR, 1.25)) : -0.215 + 0.47 * Math.pow((s - WR) / (1 - WR), 1.18);
  const chord = (s) => s < WR ? lerp(0.62, 0.27, Math.pow(s / WR, 0.55)) : 0.27 * Math.pow(1 - (s - WR) / (1 - WR), 1.45) + 0.012;
  for (const side of [-1, 1]) {
    const N = 22, cols = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, x = side * (0.060 + 1.44 * s), zl = leadZ(s), ch = chord(s), bone = lerp(0.045, 0.020, Math.min(s / WR, 1)) * (s > WR ? lerp(1, 0.35, (s - WR) / (1 - WR)) : 1);
      const dark = smoothstep(0.62, 0.95, s), m = [lerp(MEM[0], TIP[0], dark), lerp(MEM[1], TIP[1], dark), lerp(MEM[2], TIP[2], dark)];
      const sag = 0.030 * Math.sin(Math.PI * Math.min(s * 1.1, 1));
      cols.push([
        G.v(x, 0.034, zl, ARM, [side, s, 0, 1]), G.v(x, 0.046, zl + bone, ARM, [side, s, 0.08, 1]), G.v(x, 0.034, zl + bone * 2, m, [side, s, 0.16, 1]),
        G.v(x, 0.030 + sag, zl + ch * 0.55, m, [side, s, 0.55, 1]), G.v(x, 0.030, zl + ch, [m[0] * 0.96, m[1] * 0.96, m[2] * 0.96], [side, s, 1, 1]),
      ]);
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) {
      if (side > 0) G.quad(cols[i][j], cols[i][j + 1], cols[i + 1][j + 1], cols[i + 1][j]); else G.quad(cols[i][j], cols[i + 1][j], cols[i + 1][j + 1], cols[i][j + 1]);
    }
  }
  return G.build();
}
// wing poses: glide (flat, a little dihedral), row (deep beats from the shoulder, the hand lagging and folding on the
// upstroke), tuck (iC.z: wrists forward, hands swept back along the body: the W of a plunge)
const PTERO_DEFORM = /* glsl */`
  if (aW.w > 0.5) {
    float s = aW.y, side = aW.x, ph = iC.x, amp = iC.y, tuck = iC.z;
    float xr = max(abs(p.x) - 0.060, 0.);
    float outer = max(s - 0.38, 0.) / 0.62;
    // where the leading edge is at this share of the span (as built), and how far behind it this vertex sits in the membrane
    float zl = s < 0.38 ? mix(-0.045, -0.215, pow(clamp(s / 0.38, 0., 1.), 1.25)) : -0.215 + 0.47 * pow(clamp(outer, 0., 1.), 1.18);
    float cz = p.z - zl;
    float a = amp * (sin(ph) * (0.40 + 0.60 * s) + 0.34 * s * sin(ph - 1.2)) + (0.07 + 0.05 * sin(t * 0.7 + iC.w)) * (1. - min(amp, 1.)) * (1. - tuck) + 0.22 * tuck * (1. - outer);
    float fold = clamp(max(cos(ph), 0.) * min(amp, 1.) * 0.34 + tuck * 0.90, 0., 0.93);
    float wx = 0.547;                                                   // where the wrist is
    float xo = max(xr - wx, 0.), xi = min(xr, wx);
    // the fold of a plunge: the arm swings forward about the shoulder (wrist beside the head), the membrane closes up against the
    // body, and the long finger lies back along the flank: a dart with its wrists leading
    float chordK = 1. - tuck * mix(0.45, 0.58, outer);                   // (the dart keeps a narrow delta of membrane: a solid W, never a line)
    p.z = zl + cz * chordK - tuck * 0.20 * (xi / wx) + xo * fold * 1.12 + tuck * 0.05;
    xr = xi * (1. - 0.74 * tuck) + xo * (1. - fold);
    p.y += sin(a) * xr - outer * 0.05 * (1. - tuck) * (1. - min(amp, 1.));
    p.x = side * (0.060 + cos(a) * xr);
    n = rotZ(n, a * side);
  }`;

function makePterosaurs(env) {
  const { rng, U, path, nPtero, detail } = env;
  const r = rng.fork('ptero'), N = nPtero, L = path.length;
  const I = instanced(pterosaurGeometry(), N + 2);                  // the cast's four to twelve, the one that flies with us, and (polish 5) the skimmer
  const mesh = new THREE.Mesh(I.geo, animalMaterial(U, PTERO_DEFORM, /* glsl */`
    float fur = sVN(vL.xz * 90.) * sVN(vL.zy * 37. + 3.);
    // (polish 2) the membrane is thin living skin, not a grey card: fibres fan back from the arm, it billows between them, the arm and
    // the long finger show as a pale rounded spar with a shade behind it, and a low Sun behind it shines through, warm
    float mS = vW.y, mC = clamp(vW.z, 0., 1.);
    float spar = 1. - smoothstep(0.10, 0.19, mC);
    float fib = sVN(vec2(mS * 52. + mC * 10., mC * 2.6 + 1.7));
    float bil = 0.5 + 0.5 * sin(mS * 30. + mC * 5. + 2.5 * sVN(vec2(mS * 6., mC * 2.)));
    float camber = 0.74 + 0.36 * sin(3.1416 * clamp(mC * 0.9 + 0.08, 0., 1.));                  // lit along the crown of the wing, shaded at the edges
    // (polish 5) seen close it was a flat tan sheet. Now: stiffening fibres as fine dark lines that fan back from the arm and the long
    // finger, the skin thick and dusky beside the body and along the arm and thinning to the trailing edge, darker mottles, a dark
    // welt along the trailing edge, a pale knuckle at the wrist; and the Sun comes through only where the skin is thin, between fibres
    float line = abs(fract(mS * 46. + mC * 7.5 + 0.8 * sVN(vec2(mS * 9., mC * 3.))) - 0.5);
    float fibre = (1. - smoothstep(0.05, 0.16, line)) * smoothstep(0.16, 0.34, mC) * (1. - smoothstep(1.0, 3.0, length(fwidth(vec2(mS * 46., mC * 7.5)))));
    float thin = smoothstep(0.18, 0.95, mC) * (0.45 + 0.55 * smoothstep(0.06, 0.5, mS));
    float mott = sVN(vec2(mS * 13. + 3., mC * 5.)) * 0.6 + sVN(vec2(mS * 31., mC * 11. + 7.)) * 0.4;
    float welt = smoothstep(0.90, 0.985, mC);
    vec3 memb = vCol * (0.66 + 0.44 * fib) * (0.74 + 0.40 * bil * smoothstep(0.18, 0.7, mC)) * camber;
    memb *= (1. - 0.24 * fibre) * (0.80 + 0.36 * mott) * mix(0.80, 1.08, thin) * (1. - 0.40 * welt);
    memb = mix(memb, vCol * 1.5 + vec3(0.10, 0.085, 0.06), spar * (0.55 + 0.45 * smoothstep(0.0, 0.07, mC)));       // the spar
    memb = mix(memb, vec3(0.80, 0.76, 0.66), spar * (1. - smoothstep(0.012, 0.035, abs(mS - 0.38))) * 0.7);          // the wrist's knuckle
    memb *= 1. - 0.38 * smoothstep(0.17, 0.21, mC) * (1. - smoothstep(0.21, 0.40, mC));          // its shade on the skin behind it
    memb = mix(memb, memb * vec3(1.16, 1.0, 0.92), (1. - smoothstep(0.0, 0.35, mS)));           // flushed near the body
    alb *= mix(0.86 + 0.5 * fur, 1., vW.w);
    alb = mix(alb, memb * vFade * 0.80, vW.w);
    float back = clamp(-dot(n, normalize(uSunDir)) * 1.3 + 0.10, 0., 1.);
    add = uSunCol * uLit.x * vec3(0.34, 0.24, 0.16) * back * (1. - 0.85 * spar) * (0.30 + 0.70 * thin) * (1. - 0.40 * fibre) * (0.62 + 0.5 * fib) * (0.75 + 0.4 * mott) * (1. - 0.5 * welt) * (1. - 0.6 * smoothstep(0.6, 0.98, mS)) * vW.w * vFade * vFade;
    add += uSHot * uSea.y * vec3(0.30, 0.20, 0.10) * clamp(-dot(n, uStrL) * 1.2 + 0.15, 0., 1.) * (0.35 + 0.65 * thin) * (1. - 0.60 * fibre) * (1. - 0.85 * spar) * vW.w * vFade;   // the fire's light through the skin
    gloss = 0.25 * vW.w;`));
  mesh.name = 'pterosaurs'; mesh.frustumCulled = false;
  const camAt = (u, out) => path.posAtDist(u * L, out);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  // the scripted four. One wheels across the crescent at u 0.55, steeply banked toward us so its whole plan shows dark against
  // it, and comes back to cross in front of the fire at u 0.895. Three plunge 10 to 12 m ahead, near our line: each glides in
  // toward us, half folds, darts, goes under, pushes off and rows up ahead of us.
  const script = [{ cross: true }, { uP: 0.452, ahead: 15, side: 3.4 }, { uP: 0.404, ahead: 14, side: -4.5 }, { uP: 0.565, ahead: 30, side: -6, near: 9 }];   // (polish 3: one has just gone in on our left as we bank right round the second, which folds 5 m ahead on the inside of our turn at u 0.43)   // (polish 2: two go into the creek short of the spit, the third beyond it)
  const ps = [], Tn = new THREE.Vector3(), Rt = new THREE.Vector3();
  const frame = (u) => { camAt(u, tmp); path.tangentAtDist(u * L, Tn); Tn.setY(0).normalize(); Rt.set(-Tn.z, 0, Tn.x); return tmp; };
  for (let i = 0; i < N; i++) {
    const sc = script[i] ? { ...script[i] } : null, q = { sc, ph: r.range(0, 6.28), w: r.range(0.42, 0.6) * (r.chance(0.5) ? 1 : -1), R: r.range(11, 17), size: r.range(1.08, 1.22), seed: r.range(0, 6.28) };
    const lowK = !sc && i < 6;
    const uc = sc ? (sc.cross ? 0.50 : sc.uP + 0.02) : lowK ? 0.765 + 0.03 * (i - 4) : r.range(0.40, 0.66), sd = sc ? (sc.cross ? -14 : sc.side * 4) : lowK ? (i === 4 ? 9 : -12) : (r.chance(0.5) ? -1 : 1) * r.range(12, 30);
    frame(uc);
    q.cx = tmp.x + Rt.x * sd + (sc ? Tn.x * 24 : 0); q.cz = tmp.z + Rt.z * sd + (sc ? Tn.z * 24 : 0); q.cy = r.range(11, 15) + (sc ? 0 : r.range(0, 5));
    if (lowK) { q.cy = 6.5 + 1.6 * (i - 4); q.R = 9 + 3 * (i - 4); q.w = 0.5 * (i === 4 ? 1 : -1); q.ph = i === 4 ? 5.0 : 0.82; }
    if (sc && sc.cross) {
      // two passes, each a point on our line of sight to the stranger: [u, metres off, which way it flies (+1 = to our right), bank]
      sc.pass = [[0.55, 11, 1]].map((ps0) => {     // (polish 5: its second pass, in front of the fire, is crossAt() below)
        frame(ps0[0]); const el = strangerAt(ps0[0]).elevDeg * DEG + (ps0[0] > 0.8 ? 0.13 : 0.0);
        return { u: ps0[0], X: V3(tmp.x, tmp.y + ps0[1] * Math.tan(el), tmp.z - ps0[1]), dir: ps0[2] };
      });
    } else if (sc) setupPlunge(sc);
    ps.push(q);
  }
  function setupPlunge(sc) {
    {
      // S: where it goes in, 14 m ahead of where we are at that moment. A1: where it tips over, 6.4 m ahead of us and a little
      // above the eye, 0.016 u (0.7 s) earlier. E: where its row up ends, across our bow.
      sc.dir = sc.side < 0 ? 1 : -1; sc.uF = sc.uP - 0.016;
      frame(sc.uP);
      sc.S = V3(tmp.x + Tn.x * sc.ahead - Rt.x * sc.side * 0.8, 0, tmp.z + Tn.z * sc.ahead - Rt.z * sc.side * 0.8);
      sc.E = V3(sc.S.x + Tn.x * 54 - Rt.x * sc.side * 3.4, 9.0, sc.S.z + Tn.z * 54 - Rt.z * sc.side * 3.4); sc.uE = sc.uP + 0.078;
      sc.hOut = Math.atan2(sc.E.x - sc.S.x, -(sc.E.z - sc.S.z));
      frame(sc.uF);
      sc.near = sc.near || 4.6;
      sc.A1 = V3(tmp.x + Tn.x * sc.near + Rt.x * sc.side * 0.62, tmp.y + 0.25, tmp.z + Tn.z * sc.near + Rt.z * sc.side * 0.62);     // (beside the crescent, never across it)
      sc.hFly = Math.atan2(Tn.x, -Tn.z); sc.sgn = Math.sign(sc.side);
      sc.hDive = Math.atan2(sc.S.x - sc.A1.x, -(sc.S.z - sc.A1.z));
    }
  }
  // (polish 5) THE SKIMMER: one more animal, outside the seeded cast (no random draw). Twice it comes close. At u 0.26 to 0.335 it
  // slides in from behind on our right and skims the glass 7 m ahead of us, a wing's length over its own shadow, while the mosasaur's
  // back shows ahead; then it peels away right and we leave it behind. At u 0.60 it is the fourth to plunge, 24 m ahead and a
  // little right of our line, so that its crown and rings stand in front of us through u 0.61 to 0.66. Between, it wheels far ahead.
  const xq = { sc: { uP: 0.596, ahead: 38, side: -5.0, near: 8 }, ph: 1.3, w: 0.5, R: 13, size: 1.2, seed: 4.2, cy: 12.5 };
  frame(xq.sc.uP + 0.02); xq.cx = tmp.x + Rt.x * xq.sc.side * 4 + Tn.x * 24; xq.cz = tmp.z + Rt.z * xq.sc.side * 4 + Tn.z * 24;
  setupPlunge(xq.sc);
  // (repair wr1) NO WHEELER THROUGH THE LENS. Between their scripted passes the animals wheel on level circles (wheel() below), and the
  // lens flies the route and nothing else, so a wheeler is kept off it by where its WHOLE RING lies against the WHOLE ROUTE: every angle
  // of the circle and the whole range of its bob at once, whatever the clock. Every ring is laid by here (the cast's, the two low ones,
  // the skimmer's) and none has been used yet; the block reads them as laid, draws nothing from any stream, and treats all rings alike.
  // CLEAR: 2.0 m of clear air between the lens's track and the nearest a wing tip can come (the lead's figure, the same as for the
  // standing sail-backs of red-sails-dawn, an animal of the same size).
  // HALF_SPAN: the furthest any vertex is drawn from the centre its pose gives, as a factor of the animal's size: the wing's tip, from
  // pterosaurGeometry's own line x = side * (0.060 + 1.44 * s) at s = 1 with its chord and the beat (1.524 at rest, 1.526 at the deepest
  // wheeling beat, 1.538 in any pose the scripts give), rounded up.
  // The measure: the ring's least distance in three dimensions to the route's line (a point of it every STEP metres, first metre to
  // last: between two of them a ring this far off is nearer by under a tenth of a millimetre), less the half span. A ring under CLEAR
  // keeps its radius, height, bob, turning speed, phase and animal; its CENTRE moves level, straight away from the route's nearest
  // point, by the shortfall, and is measured again: three passes at most. The shortfall is taken level, as the move is: where the
  // ring passes over or under that point (rise), the level gap it lacks for the slant distance to come right. A ring that clears is
  // not touched. (A ring that fails lies within 4 m of the route and its radius is 9 m or more, so that point is never its centre.)
  {
    const CLEAR = 2.0, HALF_SPAN = 1.54, BOB = 0.8, STEP = 0.05;     // BOB: wheel()'s own rise and fall about q.cy
    const rt = [], n = Math.ceil(L / STEP);
    for (let k = 0; k <= n; k++) { path.posAtDist(Math.min(k * STEP, L), tmp2); rt.push(tmp2.x, tmp2.y, tmp2.z); }
    for (const q of [...ps, xq]) {
      const reach = CLEAR + HALF_SPAN * q.size;                      // how far from the route's line the ring must stand
      for (let pass = 0; pass < 3; pass++) {
        let least = Infinity, nx = 0, nz = 0, gap = 0, rise = 0;
        for (let k = 0; k < rt.length; k += 3) {
          const dx = rt[k] - q.cx, dz = rt[k + 2] - q.cz, g = Math.sqrt(dx * dx + dz * dz) - q.R, v = Math.max(Math.abs(rt[k + 1] - q.cy) - BOB, 0), d = Math.sqrt(g * g + v * v);
          if (d < least) { least = d; nx = rt[k]; nz = rt[k + 2]; gap = g; rise = v; }
        }
        if (!(least < reach)) break;
        const shortfall = Math.sqrt(reach * reach - rise * rise) - gap, h = Math.hypot(q.cx - nx, q.cz - nz);
        q.cx += (q.cx - nx) / h * shortfall; q.cz += (q.cz - nz) / h * shortfall;
      }
    }
  }
  function skim(time, u, o) {
    const kin = smoothstep(0.255, 0.283, u), kout = smoothstep(0.312, 0.338, u), lazy = smoothstep(0.0, 0.8, Math.sin(time * 0.9 + 1.7));
    frame(u);
    const lead = lerp(-7, 5.6, kin) - 19 * kout + 0.25 * Math.sin(time * 0.41), side = lerp(7, 1.9, kin) + 12 * kout + 0.2 * Math.sin(time * 0.53 + 1);
    o.x = tmp.x + Tn.x * lead + Rt.x * side; o.z = tmp.z + Tn.z * lead + Rt.z * side; o.y = lerp(2.6, 1.55, kin) + 1.6 * kout + 0.07 * Math.sin(time * 1.3);
    o.head = Math.atan2(Tn.x, -Tn.z) - 0.16 * kin * (1 - kout) + 0.5 * kout; o.pitch = 0.03 + 0.08 * kout; o.bank = -0.20 * kin * (1 - kout) - 0.45 * kout + 0.04 * Math.sin(time * 0.6);
    o.phase = time * 6.2832 * 1.1 + 0.6; o.amp = 0.14 + 0.34 * lazy; o.tuck = 0; o.dark = 1;
  }
  // (polish 5) THE ONE IN FRONT OF THE FIRE (u 0.80 to 0.93). It was a dark shape sitting on the fire's head at u 0.87 ("both
  // silhouettes merge") and gone again by u 0.9. Now it rows along ahead of us, 12 m off and well up, sliding slowly from the fire's
  // right to its left: at u 0.83 it is whole in the frame right of the fire, at u 0.87 beside it, at u 0.905 its body is just left
  // of the train with one wing across it, the fire's gold coming through the membranes; then it draws away ahead toward the roost.
  // Laid out on our line of sight (the stranger hangs over -Z); a pure function of u.
  const cAt = new THREE.Vector3();
  const crossAt = (u, out) => {
    const t = clamp((u - 0.835) / 0.085, 0, 2), t1 = Math.min(t, 1), t2 = Math.max(t - 1, 0), kIn = smoothstep(0.775, 0.825, u);
    const az = 14 - 23 * smoothstep(0.34, 0.76, t1) - 26 * t2 + 52 * (1 - kIn), el = strangerAt(u).elevDeg + 3.0 + 4.5 * t1 - 3 * t2, dist = 6.5 + 7.0 * t1 + 150 * t2 * t2 + 18 * (1 - kIn);
    camAt(u, cAt);
    const ce = Math.cos(el * DEG) * dist;
    return out.set(cAt.x + Math.sin(az * DEG) * ce, cAt.y + Math.sin(el * DEG) * dist, cAt.z - Math.cos(az * DEG) * ce);
  };
  const cA = new THREE.Vector3(), cB = new THREE.Vector3();
  const wheel = (q, time, out) => { const a = q.ph + time * q.w; out.set(q.cx + Math.cos(a) * q.R, q.cy + 0.8 * Math.sin(time * 0.37 + q.seed), q.cz + Math.sin(a) * q.R); return a; };
  const P = new THREE.Vector3(), W = new THREE.Vector3(), Q = new THREE.Vector3();
  const turnTo = (from, to, k) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * k;
  function pose(q, time, u, o) {
    const a = wheel(q, time, W), sc = q.sc;
    // wheeling: a banked glide round its own circle with a lazy beat now and then
    o.head = Math.atan2(-Math.sin(a) * q.w, -Math.cos(a) * q.w); o.pitch = 0.03; o.bank = -0.42 * Math.sign(q.w);
    const lazy = smoothstep(0.55, 0.9, Math.sin(time * 0.5 + q.seed * 3));
    o.phase = time * 2 * 6.2832 * 0.55 + q.seed; o.amp = 0.5 * lazy; o.tuck = 0; o.dark = 1; P.copy(W);
    if (sc && sc.cross) {
      for (const ps0 of sc.pass) {
        const du = u - ps0.u;
        if (du < -0.05 || du > 0.045) continue;
        // a wheeling turn across our line of sight: 9 m/s across, curving toward us, banked so that its back faces us
        const m = du * 400 * 0.5, k = smoothstep(-0.05, -0.026, du) * (1 - smoothstep(0.03, 0.045, du));
        Q.set(ps0.X.x + ps0.dir * m, ps0.X.y + 0.01 * m * m - 0.10 * m, ps0.X.z + 0.03 * m * m);
        P.lerpVectors(W, Q, k);
        o.head = turnTo(o.head, Math.atan2(ps0.dir, -0.06 * m), k); o.pitch = lerp(o.pitch, 0.02, k); o.bank = lerp(o.bank, -1.15 * ps0.dir, k);
        o.amp = lerp(o.amp, 0.10, k); o.dark = 1 - 0.45 * k;
      }
      if (u > 0.775) {
        crossAt(u - 0.003, cA); crossAt(u + 0.003, cB); crossAt(u, P);
        // a wheeling turn to the left across our bow, banked so that its back and both wings are toward us (the pose of its pass
        // across the crescent at u 0.55), gliding; near and large right of the fire at u 0.83, smaller across the train at u 0.905
        const kT = smoothstep(0.795, 0.825, u) * (1 - smoothstep(0.915, 0.94, u));
        const hp = Math.atan2(cB.x - cA.x, -(cB.z - cA.z));
        o.head = hp - 1.0 * kT; o.pitch = clamp((cB.y - cA.y) / Math.max(Math.hypot(cB.x - cA.x, cB.z - cA.z), 1e-3), -0.3, 0.3) * (1 - kT) + 0.04;
        o.bank = 0.20 + 0.85 * kT + 0.05 * Math.sin(time * 0.7 + q.seed); o.amp = lerp(0.45, 0.10, kT); o.phase = time * 6.2832 * 1.2 + q.seed; o.dark = 1 - 0.30 * kT;
      }
    } else if (sc) {
      const uA = sc.uP - 0.115, uD = sc.uP - 0.066, uF = sc.uF, uU = sc.uP + 0.012;
      if (u > uA && u <= uF) {
        // comes down off its wheel to fly just ahead of us on our own line, a little above the eye, and we close on it; then the
        // wing-over: it stalls, tips its bill at the water and shows us its whole back, wings spread
        const j = smoothstep(uA, uD, u), k = smoothstep(uD, uF - 0.012, u), over = smoothstep(uF - 0.026, uF - 0.006, u);
        frame(u);
        const ah = lerp(17, sc.near, k), sd = sc.side * lerp(3.0, 0.62, k);
        Q.set(tmp.x + Tn.x * ah + Rt.x * sd, tmp.y + lerp(5.5, 0.25, k), tmp.z + Tn.z * ah + Rt.z * sd);
        P.lerpVectors(W, Q, j);
        // (polish 1: a banked wing-over, turned outward and rolled, not a flat plan view dead ahead)
        o.head = turnTo(o.head, Math.atan2(Tn.x, -Tn.z) + sc.dir * 0.22 * (1 - k), j) - sc.sgn * 0.62 * over;
        o.pitch = lerp(0.03, 0.12 * k, j) + 0.62 * over; o.bank = lerp(o.bank, -sc.dir * 0.22 * (1 - k), j) + sc.sgn * 0.42 * over;      // (polish 3: it stalls nose up, its whole back toward us)
        o.amp = lerp(o.amp, 0.5 * (1 - k) + 0.08, j) * (1 - over); o.phase = time * 2 * 6.2832 * 0.6 + q.seed;
      } else if (u > uF && u <= sc.uP) {                            // folds to a W, wrists forward, and darts in bill first
        const t = (u - uF) / (sc.uP - uF);
        P.lerpVectors(sc.A1, sc.S, t * (0.55 + 0.45 * t)); P.y = sc.A1.y * (1 - t * t) + 0.25 * (1 - t);
        const e2 = smoothstep(0, 0.35, t);
        o.head = turnTo(sc.hFly - sc.sgn * 0.62, sc.hDive, e2); o.pitch = lerp(0.62, lerp(-1.26, -0.80, smoothstep(0.1, 0.8, t)), e2); o.bank = sc.sgn * 0.42 * (1 - e2);
        o.tuck = 0.70 * smoothstep(0, 0.4, t); o.amp = 0; o.phase = 0;
      } else if (u > sc.uP && u <= uU) {                            // under: it goes in to its shoulders and comes round
        const t = (u - sc.uP) / 0.012;
        P.copy(sc.S); P.y = -0.8 * Math.sin(Math.PI * t); P.x += (sc.E.x - sc.S.x) * 0.04 * t; P.z += (sc.E.z - sc.S.z) * 0.04 * t;
        o.head = turnTo(sc.hDive, sc.hOut, smoothstep(0.1, 0.9, t)); o.pitch = lerp(-0.80, 0.55, t); o.bank = 0; o.tuck = 0.70 - 0.45 * t; o.amp = 0.7 * t; o.phase = time * 2 * 6.2832;
      } else if (u > uU && u <= sc.uE + 0.06) {                     // pushes off and rows up ahead of us, two deep beats a second
        const t = clamp((u - uU) / (sc.uE - uU), 0, 1.6), e = Math.min(t, 1);
        Q.lerpVectors(sc.S, sc.E, 0.04);
        P.lerpVectors(Q, sc.E, t); P.y = sc.E.y * Math.sin(e * Math.PI * 0.5) * (0.25 + 0.75 * e) + Math.max(t - 1, 0) * 6;
        o.head = sc.hOut; o.pitch = lerp(0.55, 0.14, e); o.bank = 0.12 * Math.sin(t * 5 + q.seed); o.tuck = 0.25 * (1 - smoothstep(0, 0.12, t)); o.amp = 1.25; o.phase = time * 2 * 6.2832 + q.seed;
        const back = smoothstep(1.0, 1.6, t);                       // then it settles back into its wheel
        if (back > 0) { P.lerp(W, back); o.amp = lerp(1.25, 0.4 * lazy, back); o.pitch *= 1 - back; }
      }
    }
    o.x = P.x; o.y = P.y; o.z = P.z;
  }
  // THE ONE THAT FLIES WITH US (u 0.56 to 0.74): it slides in from behind on our right, 4 to 5 m off and level with the eye, turned a
  // little across our bow and banked toward us so that head, crest, eye, furred back and the membrane from finger to ankle are all
  // plain against the sky; then it lifts away ahead to the right. Keyed to u; before and after, it is behind us or far ahead.
  function beside(time, u, o) {
    // (polish 1: at u 0.635 to 0.69 it slips across our bow and flies on our left, a little below the eye, banked into a right turn so
    // that its sunlit back is toward us: two different pictures of the same animal, at u 0.61 and 0.70)
    // (polish 4: it stays with us down the stoop, crosses back to our right and at u 0.77 to 0.82 skims the water 9 m ahead between us
    // and the fire, a little below the eye, its back toward us and the fire's light coming through its wings; then it lifts away)
    const kin = smoothstep(0.512, 0.560, u), kx = smoothstep(0.635, 0.69, u), kd = smoothstep(0.715, 0.775, u), kout = smoothstep(0.815, 0.875, u), on = kin * (1 - kout);
    const lead = lerp(-9, 4.3, kin) + 3.2 * kx - 1.0 * kd + 60 * kout + 0.2 * Math.sin(time * 0.37), side = lerp(lerp(lerp(8, 2.3, kin), -3.6, kx), 1.5, kd) - 26 * kout * kout + 0.2 * Math.sin(time * 0.5 + 1);   // (polish 3: at arm's length, 5 m off)
    frame(u);
    o.x = tmp.x + Tn.x * lead + Rt.x * side; o.z = tmp.z + Tn.z * lead + Rt.z * side;
    o.y = tmp.y + lerp(lerp(lerp(3.2, 0.75, kin), -1.6, kx), 0.95, kd) + 6 * kout + 0.12 * Math.sin(time * 0.8 + 2);
    const lazy = smoothstep(0.1, 0.9, Math.sin(time * 0.62 + 0.8));
    o.head = Math.atan2(Tn.x, -Tn.z) - 0.38 * on * (1 - kx) + 0.36 * kx * (1 - kd) * (1 - kout) - 0.34 * kd * (1 - kout) - 0.5 * kout * kout; o.pitch = 0.05 + 0.10 * kout;
    o.bank = -0.62 * on * (1 - kx) - 0.60 * kx * (1 - kd) * (1 - kout) - 0.52 * kd * (1 - kout) + 0.05 * Math.sin(time * 0.6);
    o.phase = time * 6.2832 * 1.05; o.amp = 0.10 + 0.30 * lazy; o.tuck = 0; o.dark = 1;
    if (u < 0.30) {
      // (polish 1) the same animal meets us at the entry: 8 m ahead on our right and a little above the eye, turned across our bow
      // and banked into its turn so that its sunlit back is toward us; it draws ahead and lifts away to the left by u 0.2
      // (polish 3: it slips down ahead of us over the reef, inside the frame and below the eye, where it used to hang cut by the top corner)
      const k = smoothstep(0.0, 0.10, u), g = smoothstep(0.105, 0.24, u);
      const ld = lerp(6.2, 11.5, k) + 70 * g, sd2 = lerp(-2.9, -3.4, k) - 30 * g * g;
      o.x = tmp.x + Tn.x * ld + Rt.x * sd2; o.z = tmp.z + Tn.z * ld + Rt.z * sd2; o.y = tmp.y + lerp(0.2, -1.5, k) + 9 * g + 0.15 * Math.sin(time * 0.8 + 2);
      o.head = Math.atan2(Tn.x, -Tn.z) + 0.34 - 0.30 * k - 0.5 * g; o.pitch = 0.04 + 0.12 * k + 0.10 * g; o.bank = lerp(-0.55, -0.12, k) + 0.05 * Math.sin(time * 0.6);
      o.amp = 0.12 + 0.30 * lazy + 0.35 * k;
    }
    return o;
  }
  const o = {}, o2 = {};
  function update(dt, time, camera, u) {
    const a = I.a.array, b = I.b.array, c = I.c.array;
    {
      const i = N; beside(time, u, o);
      a[i * 4] = o.x; a[i * 4 + 1] = o.y; a[i * 4 + 2] = o.z; a[i * 4 + 3] = o.head;
      b[i * 4] = o.pitch; b[i * 4 + 1] = o.bank; b[i * 4 + 2] = (u > 0.505 || u < 0.27) ? 1.26 : 0; b[i * 4 + 3] = 1;      // (polish 5: it is beside us from u 0.55, against the Sun at u 0.565)
      c[i * 4] = o.phase % 6283.2; c[i * 4 + 1] = o.amp; c[i * 4 + 2] = 0; c[i * 4 + 3] = 2.1;
    }
    for (let i = 0; i < N; i++) {
      const q = ps[i]; pose(q, time, u, o);
      a[i * 4] = o.x; a[i * 4 + 1] = o.y; a[i * 4 + 2] = o.z; a[i * 4 + 3] = o.head;
      b[i * 4] = o.pitch; b[i * 4 + 1] = o.bank; b[i * 4 + 2] = q.size; b[i * 4 + 3] = o.dark;   // the one that crosses the crescent, and later the fire, goes by as a dark shape
      c[i * 4] = o.phase % 6283.2; c[i * 4 + 1] = o.amp; c[i * 4 + 2] = o.tuck; c[i * 4 + 3] = q.seed;
      if (i < 5 && u < 0.75) U.uShad.value[10 + i].set(o.x, Math.max(o.y, 0.2), o.z, 1.5);
      if (q.sc && q.sc.S && i < 6) { const age = clamp((u - q.sc.uP) * 40 / 2.6, 0, 1); U.uSplash.value[i].set(q.sc.S.x, q.sc.S.z, age >= 1 ? 0 : age, 1); }
    }
    if (u < 0.75) { if (u > 0.53 || u < 0.27) U.uShad.value[15].set(a[N * 4], a[N * 4 + 1], a[N * 4 + 2], 1.7); else if (N < 6) U.uShad.value[15].set(0, -999, 0, 0); }
    {
      const i = N + 1, q = xq, sk = u > 0.255 && u < 0.34;
      if (sk) skim(time, u, o); else pose(q, time, u, o);
      a[i * 4] = o.x; a[i * 4 + 1] = o.y; a[i * 4 + 2] = o.z; a[i * 4 + 3] = o.head;
      b[i * 4] = o.pitch; b[i * 4 + 1] = o.bank; b[i * 4 + 2] = q.size; b[i * 4 + 3] = 1;
      c[i * 4] = o.phase % 6283.2; c[i * 4 + 1] = o.amp; c[i * 4 + 2] = o.tuck; c[i * 4 + 3] = q.seed;
      if (sk && u > 0.27) U.uShad.value[15].set(o.x, Math.max(o.y, 0.2), o.z, 1.6);
      const age = clamp((u - q.sc.uP) * 40 / 2.6, 0, 1); U.uSplash.value[5].set(q.sc.S.x, q.sc.S.z, age >= 1 ? 0 : age, 1);
    }
    I.a.needsUpdate = true; I.b.needsUpdate = true; I.c.needsUpdate = true;
  }
  return { mesh, update, besideAt(time, u, out) { beside(time, u, o2); return out.set(o2.x, o2.y, o2.z); }, fireAt(u, out) { return crossAt(u, out); } };
}

// the white crown a plunge throws up, 2 m high: ballistic droplets round each of the six ring centres in uSplash
function makeCrowns(env) {
  const { rng, U, detail } = env, r = rng.fork('crowns'), per = Math.round(300 * detail), count = 6 * per;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const sd = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { sd[i * 4] = Math.floor(i / per) + 0.5; sd[i * 4 + 1] = r.range(0, 6.2832); sd[i * 4 + 2] = r(); sd[i * 4 + 3] = r(); }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform vec4 uSplash[6];
      varying vec2 vUv; varying float vA; varying float vK; varying float vS;
      #include <fog_pars_vertex>
      void main(){
        vec4 s = uSplash[0];
        if (aSeed.x > 1.) s = uSplash[1]; if (aSeed.x > 2.) s = uSplash[2]; if (aSeed.x > 3.) s = uSplash[3]; if (aSeed.x > 4.) s = uSplash[4]; if (aSeed.x > 5.) s = uSplash[5];
        float tau = s.z * 2.6;                                        // seconds since it went in
        float late = aSeed.w * 0.25;
        float tt = max(tau - late, 0.);
        // (polish 1: spray, not blobs) two fifths of them are soft ragged veils of mist that make the plume's core and its foot;
        // the rest are fine bright drops thrown up in a coronet (the outer ones low and wide, the inner ones a jet 2 m high)
        float mist = step(aSeed.z, 0.4), zz = clamp((aSeed.z - 0.4) / 0.6, 0., 1.), mz = clamp(aSeed.z / 0.4, 0., 1.);
        float vr = mix(0.5 + 2.6 * zz * zz, 0.25 + 1.2 * mz, mist);
        float vy = mix(7.4 * (0.35 + 0.65 * (1. - zz)) * (0.70 + 0.30 * aSeed.w), 5.6 * (1. - mz) * (0.6 + 0.4 * aSeed.w) + 0.8, mist);
        float gr = mix(4.9, 3.6, mist);
        vec3 c = vec3(s.x + cos(aSeed.y) * (0.15 + vr * tt), max(vy * tt - gr * tt * tt, 0.02), s.y + sin(aSeed.y) * (0.15 + vr * tt));
        float size = mix((0.030 + 0.040 * aSeed.w) * (1. + 0.3 * tt), (0.11 + 0.15 * aSeed.w) * (1. + 0.9 * min(tt, 1.2)), mist);
        vK = mist; vS = aSeed.y * 7.3 + aSeed.w * 31.;
        vec4 mvPosition = viewMatrix * vec4(c, 1.);
        size = max(size, -mvPosition.z * 0.0016 * (1. - mist));           // a drop never smaller than about a pixel: it thins instead
        mvPosition.xy += position.xy * size * vec2(1., 1. + 0.8 * (1. - mist));   // drops drawn out a little along their fall
        gl_Position = projectionMatrix * mvPosition;
        vUv = position.xy;
        vA = step(0.0005, s.z) * smoothstep(0., 0.05, tt) * (1. - smoothstep(0.55, 1.0 + 0.5 * mist, tt)) * smoothstep(5.0, 10.0, -mvPosition.z);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uSunCol; uniform vec3 uSHot; uniform vec3 uFill; uniform vec3 uSkyHor; uniform vec4 uSea; uniform vec4 uLit;
      varying vec2 vUv; varying float vA; varying float vK; varying float vS;
      ${S_NOISE_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv);
        float mk = clamp(vK, 0., 1.);
        float veil = exp(-r2 * 2.6) * (1. - smoothstep(0.6, 1., r2)) * smoothstep(0.25, 0.75, sVN(vUv * 2.1 + vS) + 0.35 * sVN(vUv * 5.3 - vS)) * 0.34;
        float a = mix(exp(-r2 * 3.0) * (1. - smoothstep(0.7, 1., r2)) * 0.80, veil, mk) * clamp(vA, 0., 1.);
        // white water: never dimmer than the bright horizon sky it scatters (before sunrise the Sun term alone would leave it dull)
        vec3 col = max(uSunCol * uLit.x * 0.70 + uFill * 1.5, uSkyHor * 1.02) + uSHot * 0.4 * uSea.y;
        col *= mix(vec3(1.), mix(vec3(0.50, 0.62, 0.70), vec3(1.04, 1.0, 0.94), fract(vS * 0.37)), mk);      // the veils are shaded: sunlit and blue-grey by turns
        gl_FragColor = vec4(col * a, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'crowns'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, update() {} };
}

// =============================================================================================
// THINGS THAT GROW ON THE BED: seagrass (ribbon blades in tufts, all leaning one way and rippling) and
// the rudists (clams shaped like upright horns with lids, packed like organ pipes on the mounds).
// Per instance iA = x, y, z, turn; iB = height, width, lean, seed.
// =============================================================================================
function bedMaterial(U, deform, shade) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB;
      varying vec3 vWP; varying vec3 vN; varying vec3 vL; varying float vSeed;
      uniform vec4 uSea;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; vec3 n = normal; float t = uSea.z;
        float c = cos(iA.w), s = sin(iA.w);
        ${deform}
        p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
        vWP = p + iA.xyz; vN = n; vL = position; vSeed = iB.w;
        vec4 mvPosition = viewMatrix * vec4(vWP, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vWP; varying vec3 vN; varying vec3 vL; varying float vSeed;
      ${STRANGER_UNIFORMS_GLSL}
      ${S_NOISE_GLSL}
      ${SEA_GLSL}
      ${LIT_UNIFORMS_GLSL}
      ${UNDER_GLSL}
      uniform vec3 uRudist;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 col; float up = 0.5 + 0.5 * n.y;
        ${shade}
        col *= seaLight(vWP, 1., 1., 1.) * (0.55 + 0.45 * up);
        gl_FragColor = vec4(seaThrough(col, vWP), 1.);
        #include <fog_fragment>
      }`,
  });
}
function bedInstances(geo, list) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  const n = list.length / 8, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { a[i * 4 + k] = list[i * 8 + k]; b[i * 4 + k] = list[i * 8 + 4 + k]; }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  return g;
}
async function makeSeagrass(env) {
  const { ctx, rng, U, path, detail, density, ground } = env, r = rng.fork('seagrass');
  // one tuft: two ribbon blades crossing, three joints each; uv.y = share of the height
  const pos = [], nor = [], idx = [];
  for (let b = 0; b < 2; b++) {
    const ca = Math.cos(b * 1.9), sa = Math.sin(b * 1.9), base = pos.length / 3, ox = b * 0.07 - 0.03;
    for (let i = 0; i <= 3; i++) { const y = i / 3, w = 0.5 * (1 - 0.6 * y * y); pos.push(ox - ca * w, y, -sa * w + b * 0.05, ox + ca * w, y, sa * w + b * 0.05); nor.push(-sa, 0.3, ca, -sa, 0.3, ca); }
    for (let i = 0; i < 3; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  const want = Math.round(4600 * detail * Math.min(density, 1.1)), list = [];
  let tries = 0;
  while (list.length / 8 < want && tries++ < want * 9) {
    const d = r.range(-20, path.length + 30), sd = r.range(-1, 1), side = Math.sign(sd) * Math.pow(Math.abs(sd), 1.4) * 38;
    const P = path.posAtDist(d), T = path.tangentAtDist(d);
    const x = P.x - T.z * side, z = P.z + T.x * side;
    if (tries % 40 === 0) await ctx.yield();
    const flat = x - ground.edgeAt(z) > 34;                    // well inside the bank: only the leopard patches grow there
    if (flat && clamp((ground.grassAt(x, z) - 0.5) * 3.2 + 0.5, 0, 1) < 0.62) continue;
    const h = ground.heightAt(x, z);
    if (h > -2.2 || h < -10.5) continue;
    if (!flat && ground.grassMask(x, z, h) < 0.62) continue;
    list.push(x, h - 0.02, z, r.range(0, 6.28), r.range(0.55, 1.0), r.range(0.045, 0.075), r.range(0.7, 1.2), r());
    if (tries % 150 === 0) await ctx.yield();
  }
  const mat = bedMaterial(U, /* glsl */`
      float y = p.y, w = iA.x * 0.31 + iA.z * 0.23;
      float bend = y * y * (0.42 * iB.z + 0.20 * sin(t * 0.8 + w) + 0.07 * sin(t * 1.7 + w * 2.3 + iB.w * 6.));
      p.x *= iB.y; p.z *= iB.y; p.y = y * iB.x * (1. - 0.25 * bend * bend);
      vec2 ld = vec2(c, -s);                                   // undo the tuft's own turn so every blade leans the same way
      p.x += ld.x * bend * iB.x; p.z += ld.y * bend * iB.x;`, /* glsl */`
      float y = vL.y;
      col = mix(uGrass * 0.34, uGrass * 0.95 + vec3(0.10, 0.12, 0.02), y * y) * (0.75 + 0.5 * vSeed);
      col = mix(col, vec3(0.62, 0.66, 0.40), smoothstep(0.82, 1.0, y) * 0.55);     // pale tips
      up = 1.;`);
  const mesh = new THREE.Mesh(bedInstances(geo, list), mat); mesh.name = 'seagrass'; mesh.frustumCulled = false;
  return mesh;
}
async function makeRudists(env) {
  const { ctx, rng, U, detail, ground } = env, r = rng.fork('rudists');
  // one horn: a slim ribbed cone standing on its point, flaring a little to the rim, with a low domed lid; six sides
  const pos = [], nor = [], idx = [], K = 6;
  for (let k = 0; k < K; k++) { const a = k / K * 6.2832; pos.push(Math.cos(a), 1, Math.sin(a)); nor.push(Math.cos(a), -0.25, Math.sin(a)); }          // rim, for the sides
  for (let k = 0; k < K; k++) { const a = k / K * 6.2832; pos.push(Math.cos(a) * 1.04, 1.001, Math.sin(a) * 1.04); nor.push(Math.cos(a) * 0.35, 0.9, Math.sin(a) * 0.35); }   // rim, for the lid
  pos.push(0, 0, 0); nor.push(0, -1, 0); pos.push(0, 1.075, 0); nor.push(0, 1, 0);
  for (let k = 0; k < K; k++) { const k1 = (k + 1) % K; idx.push(k, k1, 2 * K, K + k, 2 * K + 1, K + k1); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  // two lists: the mounds of the first half of the flight and those of the second (each mesh is shown only while its mounds are near)
  const lists = [[], []];
  for (const m of ground.mounds) {
    // organ pipes: clumps of five to nine horns standing shoulder to shoulder, each clump with its own height. The mounds we pass
    // close to are packed over the whole dome; on the far ones a few clumps stand over the bed's own pattern of lids
    const dPath = env.path.nearestXZ(m.x, m.z).dist, per = Math.round((dPath < 7.5 ? 1500 : dPath < 13 ? 700 : dPath < 21 ? 220 : 80) * detail);
    const list = lists[m.z > -40 ? 0 : 1];
    let nH = 0, guard = 0;
    while (nH < per && guard++ < 600) {
      const a = r.range(0, 6.2832), d = Math.sqrt(r()) * m.r * 1.02, cx = m.x + Math.cos(a) * d, cz = m.z + Math.sin(a) * d;
      const kH = r.range(0.55, 1.0) * (1 - 0.3 * d / m.r), nC = r.int(5, 9), w0 = r.range(0.060, 0.095);
      if (guard % 6 === 0) await ctx.yield();
      for (let c = 0; c < nC && nH < per; c++, nH++) {
        const ca = c * 2.4 + r.range(-0.3, 0.3), cd = c === 0 ? 0 : w0 * 1.9 * Math.sqrt(c) * 0.74, x = cx + Math.cos(ca) * cd, z = cz + Math.sin(ca) * cd, h = ground.heightAt(x, z);
        const tall = r.range(0.55, 0.95) * kH, top = Math.min(h + tall * 0.45, -1.25);
        list.push(x, top - tall, z, r.range(0, 6.28), tall, w0 * r.range(0.85, 1.2), r.range(-0.55, 0.55), r());
      }
    }
    await ctx.yield();
  }
  const mat = bedMaterial(U, /* glsl */`
      p.xz *= iB.y; p.y *= iB.x;
      p.x += p.y * p.y * iB.z * 0.9;                          // each horn curves its own way a little, like a cow's horn
      n = normalize(n);`, /* glsl */`
      float ring = (0.82 + 0.18 * sin(vL.y * 34. + vSeed * 9.)) * (0.84 + 0.16 * sin(atan(vL.z, vL.x + step(abs(vL.x) + abs(vL.z), 1e-5) * 1e-3) * 11. + vSeed * 20.));   // growth rings round the horn, ribs down it
      col = uRudist * 1.08 * ring * (0.75 + 0.5 * vSeed) * (0.50 + 0.50 * smoothstep(0.30, 1.0, vL.y)) * mix(vec3(1.), keepWarm(vWP), 0.45);   // shade between the pipes
      float lid = smoothstep(0.995, 1.02, vL.y);
      col = mix(col, uRudist * 1.25, lid * 0.6);
      col = mix(col, vec3(0.36, 0.52, 0.30) * 0.8, smoothstep(0.38, 0.7, sVN(vWP.xz * 2.1 + vSeed * 5.)) * 0.75 * smoothstep(0.55, 1.02, vL.y));   // algal fuzz, on the tops only
      col *= 1. - 0.35 * smoothstep(0.90, 0.985, vL.y) * (1. - lid);                      // the dark slit under the lid's rim
      col *= 1. + 0.25 * lid * up;
      float fd = smoothstep(12., 34., length(uCamL - vWP));                                 // (polish 3) far off: one warm crust, sunlit side and shaded side, no net of dark gaps
      col = mix(col, uRudist * (0.92 + 0.2 * vSeed) * mix(vec3(1.), vec3(0.72, 0.95, 0.66), step(0.72, vSeed)) * keepWarm(vWP), fd);`)
  env.hornGeo = geo; env.hornMat = mat;
  return lists.map((list, k) => { const mesh = new THREE.Mesh(bedInstances(geo, list), mat); mesh.name = 'rudists' + k; mesh.frustumCulled = false; return mesh; });
}

// (polish 4) The reefs' big shapes. A rudist mound is not a smooth cone: it is bouquets, thickets of horns grown into lumpy heads one
// to two metres across with shade between them. The bed's 2 m grid cannot carry that, so each mound gets eight to twelve heads of its
// own (one draw call, about 13k triangles), with a sunlit side, a shaded side, pale lids close to and green fuzz on the crowns.
async function makeReefHeads(env) {
  const { ctx, U, ground } = env, r = ctx.core.makeRng('reefheads:' + ctx.seed);     // its own stream: a fork here would move every cast after it
  const pos = [], nor = [], idx = [], NR = 7, NS = 14;      // (polish 5: finer, and knobbed: a head is a thicket, not a bowl)
  for (let i = 0; i <= NR; i++) {
    const lat = (i / NR) * Math.PI * 0.5, cr = Math.pow(Math.cos(lat), 0.7), y = Math.pow(Math.sin(lat), 0.85);
    for (let j = 0; j < NS; j++) {
      const a = (j / NS) * 6.2832, k = 1 + 0.16 * Math.sin(a * 3 + i * 1.3) + 0.09 * Math.sin(a * 5 + 2 + i * 2.1) + (i > 0 && i < NR ? 0.11 * Math.sin(a * 7 + i * 2.9) * Math.sin(i * 1.7 + a * 2) : 0);
      pos.push(Math.cos(a) * cr * k, y, Math.sin(a) * cr * k); nor.push(Math.cos(a) * Math.cos(lat), Math.sin(lat) + 0.15, Math.sin(a) * Math.cos(lat));
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  const list = [], heads = [];
  for (const m of ground.mounds) {
    const n = r.int(8, 12), dPath = env.path.nearestXZ(m.x, m.z).dist;
    for (let k = 0; k < n; k++) {
      const out = k >= n - 2, a = r.range(0, 6.2832), d = out ? m.r * r.range(1.15, 1.6) : Math.sqrt(r()) * m.r * 0.95;
      const x = m.x + Math.cos(a) * d, z = m.z + Math.sin(a) * d, h = ground.heightAt(x, z);
      const wide = (out ? r.range(0.45, 0.8) : r.range(0.8, 1.7)) * (1 - 0.25 * d / (m.r * 1.6));
      const tall = Math.min(wide * r.range(0.55, 0.95), -1.15 - (h - 0.25));          // the crown stays a metre under the surface
      if (tall < 0.2 || env.path.nearestXZ(x, z).dist < 1.2 && h + tall > -1.6) continue;
      const tn = r.range(0, 6.28), st = r.range(-0.3, 0.5), sd = r();
      list.push(x, h - 0.25, z, tn, tall + 0.25, wide, st, sd);
      heads.push({ x, y0: h - 0.25, z, turn: tn, H: tall + 0.25, wide, st, dPath, first: m.z > -40 });
    }
    await ctx.yield();
  }
  const mat = bedMaterial(U, /* glsl */`
      p.xz *= iB.y; p.x *= 1. + 0.4 * iB.z; p.y *= iB.x;
      n = normalize(vec3(n.x / max(iB.y * (1. + 0.4 * iB.z), 0.05), n.y / max(iB.x, 0.05), n.z / max(iB.y, 0.05)));`, /* glsl */`
      float bump = sFbm(vWP.xz * 1.7 + vSeed * 9.);
      float nearK = 1. - smoothstep(10., 30., length(uCamL - vWP));
      // (polish 5) a head is a bouquet of horns seen end on: every cell one round lid, domed and pale, with the dark slit under its
      // rim and deep shade between neighbours; lids of mixed sizes, each its own tone. The cells are laid on the dome itself (the
      // look-up slides outward down its flanks), so they stay round there: the old lattice ran into stripes on every steep side.
      vec2 cp = (vWP.xz + n.xz * (vWP.y + 3.) * 0.85) * 5.4 + (vec2(sVN(vWP.xz * 1.9), sVN(vWP.xz * 1.9 + 5.)) - .5) * 0.8;
      vec2 ci = floor(cp), cf = fract(cp);
      float d1 = 9., id = 0.; vec2 rv = vec2(0., 1.);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)); vec2 hh = vec2(sH21(ci + o), sH21(ci + o + 7.3));
        vec2 rr = o + 0.22 + 0.56 * hh - cf; float dd = dot(rr, rr);
        if (dd < d1) { d1 = dd; id = hh.x; rv = rr; }
      }
      float rd = sqrt(d1), RR = 0.28 + 0.18 * id;
      float lid = 1. - smoothstep(RR - 0.07, RR, rd);
      float slit = smoothstep(RR - 0.04, RR + 0.03, rd) * (1. - smoothstep(RR + 0.04, RR + 0.20, rd));
      float gap = smoothstep(RR + 0.02, RR + 0.26, rd);
      vec2 sdir = normalize(uSunDir.xz + vec2(1e-4, 0.));
      float domeL = 0.84 + 0.42 * dot(-rv / max(rd, 1e-3), sdir) * smoothstep(0., RR, rd) * uLit.w;
      vec3 fine = uRudist * (0.34 + 0.78 * lid) * (0.74 + 0.50 * id) * domeL * (1. - 0.45 * slit) * (1. - 0.50 * gap);
      fine = mix(fine, fine * vec3(1.10, 0.86, 0.70), step(0.62, fract(id * 7.3)) * 0.6);                    // some horns are redder, some paler
      fine = mix(fine, vec3(0.36, 0.52, 0.30) * (0.65 + 0.5 * lid), lid * smoothstep(0.50, 0.72, sFbm(vWP.xz * 1.1 + vSeed * 31.)) * 0.55);   // algal fuzz on some lids
      vec3 coarse = uRudist * (0.66 + 0.46 * bump) * (0.82 + 0.36 * vSeed);
      coarse = mix(coarse, vec3(0.32, 0.49, 0.27) * (0.7 + 0.5 * bump), smoothstep(0.42, 0.68, sVN(vWP.xz * 0.9 + vSeed * 31.)) * smoothstep(0.25, 0.85, vL.y) * 0.62);
      col = mix(coarse, fine * (0.86 + 0.30 * vSeed), nearK);
      col *= mix(vec3(1.), keepWarm(vWP), 0.45);
      vec3 nb = normalize(n + vec3(-rv.x, 0., -rv.y) * 0.9 * smoothstep(0.05, RR, rd) * lid * nearK);          // every lid is a small dome of its own
      float sl = clamp(dot(nb, normalize(uSunDir + vec3(0., 0.6, 0.))), 0., 1.);
      col *= mix(1., 0.42 + 0.98 * sl, uLit.w) * (0.50 + 0.50 * smoothstep(0.0, 0.45, vL.y));   // a sunlit side, a shaded side, a dark foot
      up = 1.;`);
  const mesh = new THREE.Mesh(bedInstances(geo, list), mat); mesh.name = 'reefheads'; mesh.frustumCulled = false;
  // (polish 5) the horns themselves stand out of every head we pass close to, shoulder to shoulder and leaning outward like the
  // pipes of a bouquet, so a head has a bristling outline and shade between its horns (it was a smooth dome with a pattern on it).
  // The same horn and material as the crust's; their own random stream, so nothing else moves.
  const hr = ctx.core.makeRng('headhorns:' + ctx.seed), hl = [[], []];
  let nh = 0;
  for (const hd of heads) {
    const per = Math.round((hd.dPath < 9 ? 12 + 17 * hd.wide * hd.wide : hd.dPath < 17 ? 4 + 6 * hd.wide * hd.wide : 0) * env.detail);
    const c = Math.cos(hd.turn), s = Math.sin(hd.turn), L = hl[hd.first ? 0 : 1];
    for (let k = 0; k < per; k++) {
      const a = hr.range(0, 6.2832), lat = Math.asin(0.12 + 0.88 * hr()), cr = Math.pow(Math.cos(lat), 0.7), y = Math.pow(Math.sin(lat), 0.85);
      const px = Math.cos(a) * cr * hd.wide * (1 + 0.4 * hd.st), pz = Math.sin(a) * cr * hd.wide;
      const wx = hd.x + c * px + s * pz, wz = hd.z - s * px + c * pz, wy = hd.y0 + y * hd.H;
      const tall = hr.range(0.30, 0.58) * (0.72 + 0.28 * Math.min(hd.wide / 1.5, 1)), top = Math.min(wy + 0.52 * tall, -1.02);
      L.push(wx, top - tall, wz, -Math.atan2(wz - hd.z, wx - hd.x), tall, hr.range(0.055, 0.10), (1 - y) * hr.range(0.6, 1.5) + hr.range(-0.2, 0.2), hr());
    }
    if (++nh % 5 === 0) await ctx.yield();
  }
  const horns = hl.map((L, k) => {
    if (!L.length) L.push(0, -999, 0, 0, 0.1, 0.05, 0, 0);
    const hm = new THREE.Mesh(bedInstances(env.hornGeo, L), env.hornMat); hm.name = 'headHorns' + k; hm.frustumCulled = false; return hm;
  });
  return { mesh, horns };
}

// =============================================================================================
// AMMONITES (Sphenodiscus): a flat, sharp-keeled disc carried upright, smooth, amber with cream flames;
// it swims backwards, shell first, in pulses, ten short arms trailing from the opening. Nose (-Z) is the
// way it travels: the shell leads, the arms come last.
// =============================================================================================
function ammoniteGeometry() {
  const G = new Mini(), AMB = lin('#C98A3C', 0.9), CRM = lin('#F1E3C0', 0.85), ARMC = lin('#D9A27A', 0.8), DARK = [0.03, 0.03, 0.03];
  const R = 0.5, K = 18, rim = [], mid = [[], []];
  for (let k = 0; k < K; k++) {
    const a = k / K * 6.2832, grow = 1 - 0.16 * (((a / 6.2832) + 0.30) % 1);            // the spiral: the last whorl is the widest, at the opening
    const y = Math.sin(a) * R * grow, z = -Math.cos(a) * R * grow - 0.05;
    const flame = (k % 6 === 0) ? CRM : AMB;
    rim.push(G.v(0, y, z, flame, [0, 0, 0, 0]));
    for (let sd = 0; sd < 2; sd++) mid[sd].push(G.v((sd ? -1 : 1) * 0.085, y * 0.55, (z + 0.05) * 0.55 - 0.05, AMB, [0, 0, 0, 0]));
  }
  for (let sd = 0; sd < 2; sd++) {
    const c = G.v((sd ? -1 : 1) * 0.05, 0, -0.05, lin('#8E5A24', 0.8));
    for (let k = 0; k < K; k++) {
      const k1 = (k + 1) % K;
      if (sd) { G.quad(rim[k], rim[k1], mid[sd][k1], mid[sd][k]); G.tri(mid[sd][k], mid[sd][k1], c); }
      else { G.quad(rim[k], mid[sd][k], mid[sd][k1], rim[k1]); G.tri(mid[sd][k], c, mid[sd][k1]); }
    }
  }
  // the head at the opening (low at the back), an eye each side, and ten arms trailing
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * 6.2832, ox = Math.cos(a) * 0.045, oy = -0.26 + Math.sin(a) * 0.06;
    const b0 = G.v(ox * 1.3, oy + 0.02, 0.36, ARMC, [0, 0.2, i, 1]), b1 = G.v(ox * 1.3, oy - 0.02, 0.36, ARMC, [0, 0.2, i, 1]);
    const m0 = G.v(ox * 1.6, oy + 0.012, 0.62, ARMC, [0, 0.6, i, 1]), m1 = G.v(ox * 1.6, oy - 0.012, 0.62, ARMC, [0, 0.6, i, 1]);
    const t = G.v(ox * 1.2, oy, 0.92, CRM, [0, 1, i, 1]);
    G.quad(b0, b1, m1, m0); G.tri(m0, m1, t);
  }
  for (const sx of [-1, 1]) { const e = G.v(sx * 0.075, -0.20, 0.33, DARK), f = G.v(sx * 0.075, -0.25, 0.37, DARK), g = G.v(sx * 0.075, -0.25, 0.29, DARK); G.tri(e, f, g); }
  return G.build();
}
function makeAmmonites(env) {
  const { rng, U, path, detail, density, manyAmmonites } = env, r = rng.fork('ammonites');
  const N0 = Math.round((manyAmmonites ? 430 : 300) * (detail < 1 ? 0.5 : 1) * Math.min(density, 1.15));
  const N = N0 + Math.round((manyAmmonites ? 190 : 180) * (detail < 1 ? 0.5 : 1));      // (polish 5) and a swarm of their own over the reef we skim at u 0.21
  const I = instanced(ammoniteGeometry(), N);
  const mesh = new THREE.Mesh(I.geo, animalMaterial(U, /* glsl */`
    if (aW.w > 0.5) {                                              // the arms: they close together on each jet and trail open between
      float pulse = sin(iC.x), s = aW.y;
      p.x *= 1. + 0.9 * s * (0.5 - 0.5 * pulse); p.y += s * s * 0.10 * sin(iC.x * 0.5 + aW.z * 1.3) - s * 0.05 * pulse;
      p.z += s * 0.10 * pulse;
    }`, /* glsl */`
    float rr = length(vL.yz + vec2(0., 0.05)), an = atan(vL.y, -vL.z - 0.05 + step(abs(vL.y) + abs(vL.z + 0.05), 1e-5) * 1e-3);
    float flame = smoothstep(0.62, 0.92, sin(an * 7. + rr * 16. + sin(rr * 30.) * 0.8) * 0.5 + 0.5) * smoothstep(0.08, 0.3, rr) * (1. - vW.w);
    alb = mix(alb * vec3(1.0, 0.80, 0.50), vec3(0.80, 0.68, 0.42) * vFade, flame * 0.9);          // amber, with cream flames
    gloss = 0.6 * (1. - vW.w);`));
  mesh.name = 'ammonites'; mesh.frustumCulled = false;
  // a carpet 66 m long under our own line where we fly lowest (u 0.125 to 0.245), thickest within 5 m of it, every animal
  // jetting from left to right across it just under the glass; they lean, so the flamed flank faces up toward us
  const mid = path.posAtDist(0.185 * path.length), D = V3(0.94, 0, -0.34), Sd = V3(0, 0, 1), LEN = 26;
  const am = [];
  for (let i = 0; i < N; i++) {
    const g = r.gauss();
    if (i >= N0) {
      // the reef's swarm: thick over and round the mound under our line, strung out along the line either side of it
      const m = env.ground.mounds[3], onLine = r.chance(0.45), uu = r.range(0.188, 0.238), Pl = path.posAtDist(uu * path.length);
      const tx = onLine ? Pl.x + r.gauss() * 3.2 : m.x + r.gauss() * 6.5, tz = onLine ? Pl.z + r.gauss() * 3.2 : m.z + r.gauss() * 8.5, al2 = (tx - mid.x) / D.x;
      am.push({ al: al2 + LEN * 0.5, ac: tz - mid.z - D.z * al2, y: -0.42 - r.range(0, 0.46), ph: r.range(0, 6.28), sp: r.range(0.25, 0.5), size: r.range(0.36, 0.50), yaw: r.range(-0.5, 0.5), f: r.range(0.75, 1.1) });
      continue;
    }
    am.push({ al: LEN * 0.5 + clamp(g * 4.4, -LEN * 0.5, LEN * 0.5), ac: r.range(-34, 34), y: -0.50 - r.range(0, 0.50) - (r.chance(0.40) ? r.range(0.4, 1.7) : 0), ph: r.range(0, 6.28), sp: r.range(0.35, 0.6), size: r.range(0.38, 0.52), yaw: r.range(-0.3, 0.3), f: r.range(0.75, 1.1) });
  }
  // (polish 3) each one's shadow on the sand below it, carried down the Sun's light through the water: they hang in mid-water over
  // the bed, they do not lie on the surface. One quad an animal, placed in the vertex shader from the animal's own instance data and
  // the chart's depth.
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); sg.setIndex([0, 2, 1, 0, 3, 2]);
  sg.setAttribute('iA', I.a); sg.setAttribute('iB', I.b); sg.instanceCount = N;
  const shadows = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB; uniform sampler2D uChart; uniform vec4 uChartBox; uniform vec3 uSunDir; uniform vec4 uShadK;
      varying vec2 vUv; varying float vK;
      void main(){
        vec2 sh = normalize(uSunDir.xz + vec2(1e-4, 0.));
        float dep = textureLod(uChart, clamp((iA.xz - uChartBox.xy) * uChartBox.zw, 0.002, 0.998), 0.).r * 32.;
        float fall = clamp(dep + iA.y, 0., 12.);
        vec2 c = iA.xz - sh * fall * uShadK.y;
        dep = textureLod(uChart, clamp((c - uChartBox.xy) * uChartBox.zw, 0.002, 0.998), 0.).r * 32.;
        float rad = iB.z * (0.50 + 0.05 * fall);
        vec3 wp = vec3(c.x + position.x * rad, -dep + 0.16, c.y + position.z * rad);
        vUv = position.xz; vK = 1. / (1. + 0.22 * fall);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec4 uLit; varying vec2 vUv; varying float vK;
      void main(){
        float a = (1. - smoothstep(0.15, 1., length(vUv))) * 0.62 * clamp(vK, 0., 1.) * uLit.w;
        gl_FragColor = vec4(vec3(0.0, 0.035, 0.05) * a, a);
      }`,
  }));
  shadows.name = 'ammoniteShadows'; shadows.frustumCulled = false; shadows.renderOrder = 0.4;
  const head = Math.atan2(D.x, -D.z);
  function update(dt, time, camera, u) {
    const a = I.a.array, b = I.b.array, c = I.c.array;
    for (let i = 0; i < N; i++) {
      const q = am[i], ph = time * 6.2832 * q.f * 0.8 + q.ph;
      const al = q.al - LEN * 0.5 + q.sp * 40 * (u - 0.185) + 0.12 * Math.sin(ph);   // keyed to u (the carpet stays under our line); jerks forward on each jet
      const edge = 1;
      a[i * 4] = mid.x + D.x * al + Sd.x * q.ac; a[i * 4 + 1] = q.y + 0.05 * Math.sin(ph * 0.5); a[i * 4 + 2] = mid.z + D.z * al + Sd.z * q.ac; a[i * 4 + 3] = head + q.yaw + 0.08 * Math.sin(ph * 0.5);
      b[i * 4] = 0.10 * Math.cos(ph); b[i * 4 + 1] = 0.50 + 0.12 * Math.sin(ph * 0.5 + q.ph); b[i * 4 + 2] = q.size * edge; b[i * 4 + 3] = 1.25;   // (fade 2: lit amber under the glass)
      c[i * 4] = ph % 6283.2; c[i * 4 + 1] = 0; c[i * 4 + 2] = 0; c[i * 4 + 3] = 0;
    }
    I.a.needsUpdate = true; I.b.needsUpdate = true; I.c.needsUpdate = true;
  }
  return { mesh, shadows, update };
}

// =============================================================================================
// SEA TURTLES (hard-shelled, Euclastes kind), 1.1 m: a low heart-shaped scuted shell, a broad beaked head,
// long front flippers rowing together every two seconds, short hind paddles trailing.
// =============================================================================================
function turtleGeometry() {
  // (polish 4) rebuilt: the old shell was a ten-sided loft with a checker of squares. Now a low heart-shaped carapace with a flared
  // rim, a faint keel and a flat pale plastron (K = 22), a broad beaked head with brows, flippers with a thick rounded leading edge
  // and a thin trailing one, hind paddles with two faces, a stub of tail. Scutes, head plates and flipper scales are in the shader.
  const G = new Mini(), SH = lin('#6E6A45', 0.95), SHD = lin('#4A4630', 0.9), CR = lin('#E0D8B8', 0.8), SK = lin('#6F7052', 0.85), SKD = lin('#3E4232', 0.85), DARK = [0.02, 0.02, 0.02];
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  // shell rows: [z, y of the rim, dome height, plastron depth, half width]
  const rows = [[-0.375, 0.030, 0.010, 0.008, 0.035], [-0.36, 0.032, 0.040, 0.020, 0.135], [-0.31, 0.036, 0.085, 0.032, 0.255], [-0.22, 0.040, 0.124, 0.040, 0.345], [-0.10, 0.042, 0.148, 0.045, 0.395],
    [0.02, 0.042, 0.153, 0.046, 0.405], [0.14, 0.040, 0.143, 0.044, 0.375], [0.26, 0.038, 0.118, 0.040, 0.305], [0.36, 0.036, 0.088, 0.033, 0.215], [0.45, 0.034, 0.052, 0.025, 0.120], [0.52, 0.032, 0.010, 0.008, 0.020]];
  const K = 22, rings = [];
  for (const r of rows) {
    const first = G.n;
    for (let j = 0; j < K; j++) {
      const th = (j / K) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      const x = r[4] * Math.sign(c) * Math.pow(Math.abs(c), 0.82);
      const y = s > 0 ? r[1] + r[2] * (Math.pow(s, 1.3) + 0.07 * Math.exp(-c * c * 40)) : r[1] + r[3] * s * (1 - 0.35 * c * c);   // the dome leaves the rim at a shallow angle: a flared edge
      G.v(x, y, r[0], mixc(CR, mixc(SHD, SH, smoothstep(0.05, 0.5, s)), smoothstep(-0.30, -0.02, s)));
    }
    rings.push(first);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < K; j++) G.quad(rings[r] + j, rings[r] + (j + 1) % K, rings[r + 1] + (j + 1) % K, rings[r + 1] + j);
  // head: broad and flat-topped, brows over the eyes, a hooked beak, on a short thick neck
  const HW = [0, 0, 0, 2];
  G.loft([[-0.685, 0.030, 0.010, 0.012, SKD, CR], [-0.665, 0.040, 0.034, 0.042, SKD, CR], [-0.62, 0.052, 0.058, 0.078, SK, CR], [-0.56, 0.060, 0.070, 0.098, SK, CR], [-0.50, 0.060, 0.068, 0.094, SK, CR],
    [-0.44, 0.054, 0.058, 0.078, SK, CR], [-0.36, 0.045, 0.050, 0.070, SK, CR], [-0.30, 0.040, 0.040, 0.060, SK, CR]], 12, HW);
  for (const sx of [-1, 1]) {
    // the eye: a dark bead under the brow with one highlight
    const ex = sx * 0.092, ey = 0.078, ez = -0.585, er = 0.017;
    const e0 = G.v(ex + sx * 0.006, ey, ez, DARK, HW), ring = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; ring.push(G.v(ex - sx * 0.004, ey + Math.sin(a) * er, ez + Math.cos(a) * er * 1.25, DARK, HW)); }
    for (let k = 0; k < 6; k++) { if (sx > 0) G.tri(e0, ring[(k + 1) % 6], ring[k]); else G.tri(e0, ring[k], ring[(k + 1) % 6]); }
    const hl = G.v(ex + sx * 0.008, ey + 0.009, ez - 0.004, [2, 2, 2], HW), h2 = G.v(ex + sx * 0.008, ey + 0.002, ez + 0.003, [2, 2, 2], HW), h3 = G.v(ex + sx * 0.008, ey + 0.002, ez - 0.011, [2, 2, 2], HW);
    if (sx > 0) G.tri(hl, h2, h3); else G.tri(hl, h3, h2);
    // front flipper: a long blade swept back from a thick shoulder, widest two thirds out, rounded tip (aW: side, share of the span, share of the chord, part 1)
    const N = 9, M = 4, top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = sx * (0.27 + 0.62 * t), zl = -0.24 + 0.08 * t + 0.34 * t * t;
      const ch = (0.085 + 0.14 * Math.sin(Math.PI * Math.pow(t, 0.8) * 0.82)) * Math.sqrt(Math.max(1 - Math.pow(t, 6), 0.02)), th = 0.034 * (1 - 0.72 * t) + 0.005, y0 = 0.035 - 0.035 * t;
      const rt = [], rb = [];
      for (let j = 0; j <= M; j++) {
        const cj = j / M, lens = Math.sin(Math.PI * Math.pow(cj, 0.6)) * th, w = [sx, t, cj, 1];
        rt.push(G.v(x, y0 + lens, zl + ch * cj, mixc(SK, SKD, cj * 0.6), w)); rb.push(G.v(x, y0 - lens * 0.7, zl + ch * cj, mixc(CR, SK, 0.25 + 0.3 * cj), w));
      }
      top.push(rt); bot.push(rb);
    }
    const Q = (a, b, c, d) => { if (sx > 0) G.quad(a, b, c, d); else G.quad(a, d, c, b); };
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { Q(top[i][j], top[i][j + 1], top[i + 1][j + 1], top[i + 1][j]); Q(bot[i][j], bot[i + 1][j], bot[i + 1][j + 1], bot[i][j + 1]); }
    // hind paddle: a short rounded blade trailing behind the shell, two faces
    const hp = [[0.13, 0.36, 0.05], [0.21, 0.44, 0.085], [0.25, 0.54, 0.10], [0.25, 0.63, 0.085], [0.22, 0.70, 0.03]], ha = [], hb = [], hc = [];
    for (let i = 0; i < hp.length; i++) { const p = hp[i], w = [sx, i / (hp.length - 1), 0, 3]; ha.push(G.v(sx * (p[0] - p[2]), 0.03, p[1] + p[2] * 0.3, SKD, w)); hb.push(G.v(sx * (p[0] + p[2]), 0.026, p[1] - p[2] * 0.3, SK, w)); hc.push(G.v(sx * p[0], 0.044, p[1], SK, w)); }
    for (let i = 0; i < hp.length - 1; i++) { Q(ha[i], ha[i + 1], hc[i + 1], hc[i]); Q(hc[i], hc[i + 1], hb[i + 1], hb[i]); Q(ha[i], hb[i], hb[i + 1], ha[i + 1]); }
  }
  G.loft([[0.50, 0.030, 0.016, 0.022, SKD, CR], [0.56, 0.028, 0.012, 0.014, SKD, CR], [0.61, 0.026, 0.004, 0.004, SKD, CR]], 6, [0, 0, 0, 3]);   // tail stub
  return G.build();
}
function makeTurtles(env) {
  const { rng, U, path } = env, r = rng.fork('turtles'), N = 6, L = path.length;
  const I = instanced(turtleGeometry(), N);
  const mesh = new THREE.Mesh(I.geo, animalMaterial(U, /* glsl */`
    if (aW.w > 0.5 && aW.w < 1.5) {                                 // front flippers row together: down and back, then feathered forward
      float s = aW.y, st = iC.x;
      p.y += s * (0.24 * sin(st) - 0.05); p.z += s * 0.20 * cos(st) + 0.05 * s;
      p.y += (aW.z - 0.5) * 0.08 * cos(st) * s;
    } else if (aW.w > 2.5) { p.y += aW.y * 0.04 * sin(iC.x + 1.6); }
    else if (aW.w > 1.5) { float k = clamp((-p.z - 0.36) / 0.3, 0., 1.); p.y += k * iC.y * 0.16; p.z += k * iC.y * 0.02; }   // the head lifts to breathe`, /* glsl */`
    if (vW.w < 0.5 && vL.y > 0.030) {
      // (polish 4) real scutes: five vertebrals down the midline, four costals a side, a ring of marginals on the flared rim; each
      // plate has streaks that radiate from its own centre and growth rings round it; dark grooves between plates, never a checker
      vec2 q = vec2(abs(vL.x), vL.z);
      float d1 = 9., d2 = 9., id = 0.; vec2 dv1 = vec2(1., 0.);
      for (int i = 0; i < 5; i++) {
        vec2 dv = (q - vec2(0., -0.27 + 0.16 * float(i))) * vec2(1.3, 1.);
        float d = dot(dv, dv); if (d < d1) { d2 = d1; d1 = d; dv1 = dv; id = float(i); } else if (d < d2) d2 = d;
      }
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 dv = (q - vec2(0.235 - 0.022 * abs(fi - 1.) - 0.022 * fi, -0.19 + 0.16 * fi)) * vec2(0.85, 1.);
        float d = dot(dv, dv); if (d < d1) { d2 = d1; d1 = d; dv1 = dv; id = 5. + fi; } else if (d < d2) d2 = d;
      }
      float r1 = sqrt(d1), e = sqrt(d2) - r1;
      float rim = 1. - smoothstep(0.052, 0.072, vL.y);                          // the marginals: low on the dome, all the way round
      float ang = atan(vL.z - 0.05, vL.x + step(abs(vL.x) + abs(vL.z - 0.05), 1e-5) * 1e-3);
      float mseg = abs(fract(ang * 3.6) - 0.5);
      float groove = mix(1. - smoothstep(0.006, 0.020, e), max(smoothstep(0.40, 0.47, mseg), 1. - smoothstep(0.004, 0.012, abs(vL.y - 0.064))), rim);
      float a2 = atan(dv1.y, dv1.x + step(abs(dv1.x) + abs(dv1.y), 1e-5) * 1e-3);
      float streak = sVN(vec2(a2 * 4.5 + id * 7.1, r1 * 9. + id)) * (1. - rim) + sVN(vec2(ang * 9., 3.)) * rim;
      float rings = 0.90 + 0.10 * sin(r1 * 150.) * (1. - rim);
      vec3 plate = mix(alb * 0.50, alb * 1.25 + vec3(0.10, 0.065, 0.0), smoothstep(0.25, 0.75, streak)) * rings * (0.85 + 0.3 * sVN(vec2(id * 3.7, 1.)));
      plate *= 1. - 0.25 * smoothstep(0.02, 0.10, r1) * (1. - rim);                // each plate is palest at its boss
      alb = mix(plate, alb * 0.22, groove * 0.85);
      gloss = 0.9;
    } else if (vW.w > 0.5 && vCol.g > 0.05 && vCol.g < 1.2) {
      // head plates and flipper scales: dark plates edged with pale skin, large on the head and the leading edge, small toward the trailing edge
      float big = vW.w > 1.5 && vW.w < 2.5 ? 26. : mix(30., 46., vW.z);
      vec2 sq = vL.xz * big; sq.x += 0.5 * floor(sq.y);
      vec2 sf = abs(fract(sq) - 0.5);
      float seam = smoothstep(0.30, 0.46, max(sf.x, sf.y)) * (1. - smoothstep(0.6, 2.2, length(fwidth(sq))));
      float top = smoothstep(-0.1, 0.25, vN.y);
      alb = mix(alb, mix(alb * (0.55 + 0.35 * sVN(floor(sq) * 1.7)), vec3(0.62, 0.60, 0.44), seam * 0.75), top);
      gloss = 0.7;
    }`));
  mesh.name = 'turtles'; mesh.frustumCulled = false;
  // one lifts its head 5 m to the right as we pass at u 0.2; the others keep the quiet water of u 0.6 to 0.72
  const spots = [[0.2536, 1.0, 1], [0.272, -3.0, 1], [0.655, 3.2, 1], [0.715, -2.8, 1], [0.799, 1.9, 1], [0.813, -2.9, 1]];
  const ts = spots.map((sp) => {
    const P = path.posAtDist(sp[0] * L), T = path.tangentAtDist(sp[0] * L);
    return { u: sp[0], x: P.x - T.z * sp[1], z: P.z + T.x * sp[1], head: Math.atan2(T.x, -T.z) + r.range(-0.12, 0.12) + (sp[1] > 0 ? -0.10 : 0.10), up: sp[2], ph: r.range(0, 6.28), size: r.range(1.0, 1.15) };
  });
  ts[0].head += 2.2; ts[0].size = 1.25;                           // (polish 4) the lead turtle comes toward us across our bow, three-quarter on: head, beak, eye and both flippers in view
  ts[0].ph = 2.75;                                                // (the one we look down on has its flippers reached forward and wide as we come over it)
  function update(dt, time, camera, u) {
    const a = I.a.array, b = I.b.array, c = I.c.array;
    for (let i = 0; i < N; i++) {
      const q = ts[i], st = time * Math.PI + q.ph;                   // one stroke every two seconds
      const near = Math.exp(-Math.pow((u - q.u + 0.014) / 0.024, 2)), lift = q.up ? near : 0.25 * near;   // head up when it is 6 m ahead of us
      const adv = 9 + 110 * (u - q.u) + 0.10 * Math.sin(st);       // keyed to u: it rows our way at 3 m/s, is at its spot as we pass, and never jumps
      a[i * 4] = q.x + Math.sin(q.head) * (adv - 9); a[i * 4 + 1] = lerp(-0.42, -0.06, lift) + 0.03 * Math.sin(st); a[i * 4 + 2] = q.z - Math.cos(q.head) * (adv - 9); a[i * 4 + 3] = q.head;
      b[i * 4] = 0.05 * Math.sin(st) + 0.22 * lift; b[i * 4 + 1] = 0.05 * Math.sin(st * 0.5); b[i * 4 + 2] = q.size; b[i * 4 + 3] = 1.5;
      c[i * 4] = st % 6283.2; c[i * 4 + 1] = lift; c[i * 4 + 2] = 0; c[i * 4 + 3] = 0;
      U.uSw.value[i].set(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], 0.74 * q.size);
    }
    I.a.needsUpdate = true; I.b.needsUpdate = true; I.c.needsUpdate = true;
  }
  return { mesh, update, firstAt(out) { const a = I.a.array; return out.set(a[0], 0.1, a[2]); } };
}

// =============================================================================================
// THE FAR SKY: cumulus only along the horizon, one tall tower behind the exit and the slate shade under
// it, so the ring is never white on white. The sky ahead, where the stranger hangs, is kept clear.
// =============================================================================================
async function makeFarSky(env) {
  const { rng, sky, look, lookName, portalPos, detail } = env, r = rng.fork('clouds');
  const az = (deg, dist, o = portalPos) => [o.x + Math.sin(deg * DEG) * dist, o.z - Math.cos(deg * DEG) * dist];
  const group = new THREE.Group(); group.name = 'farSky';
  const [tx, tz] = az(-36, 3600);                 // left of the ring (whose axis is 26 degrees left of north-east), leaving clean sky between ring and stranger
  const tower = makeCloudField({
    rng: r, sky, at: [[tx, 430, tz, 1050], [tx - 640, 400, tz + 120, 620]], height: 1.2, puffs: Math.round(62 * detail),
    litColor: look.cloudLit, shadeColor: look.cloudShade, bottomColor: '#5F7C93', wind: [0.6, 0, 0.2], fogFade: 0.25, farFade: [7000, 8600], opacity: 0.92,
  });
  group.add(tower.object);
  await env.ctx.yield();
  // the horizon: low puffs all round, none where the stranger sinks (within 16 degrees of dead ahead they stay under 4 degrees)
  const at = [], streets = look.wind > 0.5;
  const n = Math.round((streets ? 30 : 20) * (detail < 1 ? 0.6 : 1));
  for (let i = 0; i < n; i++) {
    let a = r.range(-178, 178);
    if (a > -60 && a < -16) a += 78;                                   // the tower has that part of the sky
    const ahead = Math.abs(a) < 16, dist = r.range(3400, 5200) * (streets && !ahead ? r.range(0.5, 1) : 1);
    const w = ahead ? r.range(240, 380) : r.range(380, streets ? 620 : 760);
    const [x, z] = az(a, dist, V3(0, 0, 0));
    at.push([x, ahead ? 70 : r.range(110, 190), z, w]);
  }
  const low = makeCloudField({
    rng: r, sky, at, height: 0.42, puffs: Math.round(26 * detail), litColor: look.cloudLit, shadeColor: look.cloudShade, wind: [0.8, 0, 0.3],
    fogFade: 0.3, farFade: [7200, 8600], opacity: 0.9, noiseTexture: tower.noiseTexture,
  });
  group.add(low.object);
  await env.ctx.yield();
  // the shade under the tower: rain-dark air from its base to the horizon
  const cg = new THREE.PlaneGeometry(1, 1, 1, 1);
  const cm = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: C('#5F7C93').multiplyScalar(lookName === 'firstLight' ? 0.75 : 0.95) }, uHor: { value: C(look.fog) }, uA: { value: lookName === 'pearl' ? 0.55 : 0.72 } },
    transparent: true, depthWrite: false, depthTest: true, fog: false,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      precision highp float; varying vec2 vUv; uniform vec3 uCol; uniform vec3 uHor; uniform float uA;
      void main(){
        float x = abs(vUv.x - 0.5) * 2.;
        float hx = 1. - smoothstep(0.0, 1.0, x); hx *= hx;
        float a = hx * (1. - smoothstep(0.30, 1.0, vUv.y)) * smoothstep(0.0, 0.05, vUv.y) * uA;
        vec3 col = mix(uHor * 0.8, uCol, smoothstep(0.0, 0.30, vUv.y));
        gl_FragColor = vec4(col, a);
      }`,
  });
  const curtain = new THREE.Mesh(cg, cm); curtain.name = 'shade';
  { const [vx, vz] = az(-28, 3000); curtain.scale.set(4600, 1500, 1); curtain.position.set(vx, 745, vz); } curtain.lookAt(portalPos.x, 300, portalPos.z);
  curtain.renderOrder = 2.2; curtain.frustumCulled = false;
  group.add(curtain);
  return { group, update(dt, time, camera) { tower.update(dt, time, camera); low.update(dt, time, camera); } };
}

// silver fish, finger-long, in four milling shoals whose glints never synchronise. (Polish 3: our own fish, lit and tinted by the
// water they swim in like everything else under the glass. The kit's bait ball drew pale and unfiltered, and against the Sun's road
// it read as a translucent sheet lying on the sea.)
async function makeFish(env) {
  const { rng, detail, density, path, U } = env, r = rng.fork('fish'), L = path.length;
  const per = Math.round(640 * (detail < 1 ? 0.5 : 1) * Math.min(density, 1.1)), NS = 4, count = per * NS;
  const at = (u, side, ahead) => { const P = path.posAtDist(u * L), T = path.tangentAtDist(u * L).clone().setY(0).normalize(); return [P.x - T.z * side + T.x * ahead, P.z + T.x * side + T.z * ahead]; };
  const spots = [[...at(0.455, -1, 6), 9.5], [...at(0.085, 7.5, 4), 6.5], [...at(0.295, 2.2, 10.5), 5.2], [...at(0.775, 7, 2), 7.5]];      // (polish 5: the third mills under our bow at u 0.295 first)
  U.uShoal = { value: spots.map((c, i) => new THREE.Vector4(c[0], c[1], c[2], i % 2 ? -1 : 1)) };
  // one fish: a lozenge with a forked tail, nose toward -z, 1 unit long; it stands on edge and rolls, so its flank flashes
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.5, 0, 0.20, -0.12, 0, -0.20, -0.12, 0, 0.045, 0.30, 0, -0.045, 0.30, 0, 0.19, 0.5, 0, -0.19, 0.5], 3));
  g.setIndex([0, 1, 2, 1, 3, 4, 1, 4, 2, 3, 5, 4, 4, 5, 6]);
  const iF = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    iF[i * 4] = Math.floor(i / per) + 0.5; iF[i * 4 + 1] = Math.pow(r(), 0.8); iF[i * 4 + 2] = r.range(0, 6.2832); iF[i * 4 + 3] = r();
    if (i % 600 === 0) await env.ctx.yield();
  }
  g.setAttribute('iF', new THREE.InstancedBufferAttribute(iF, 4)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 iF; uniform vec4 uShoal[4]; uniform vec4 uSea; uniform vec3 uCamL;
      varying vec3 vWP; varying float vGl; varying float vB;
      #include <fog_pars_vertex>
      void main(){
        vec4 s = uShoal[0];
        if (iF.x > 1.) s = uShoal[1]; if (iF.x > 2.) s = uShoal[2]; if (iF.x > 3.) s = uShoal[3];
        float t = uSea.z, sd = iF.w, R = s.z;
        // a mill: every fish circles the same way, the inner ones faster; the whole shoal breathes in and out and leans as it turns
        float rr = R * (0.16 + 0.84 * iF.y) * (0.88 + 0.12 * sin(t * 0.35 + sd * 19.));
        float ang = iF.z + s.w * t * (0.10 + 0.50 * R / (rr + 0.5 * R)) * 0.55;
        vec2 e = vec2(cos(ang), sin(ang));
        vec3 c = vec3(s.x + e.x * rr, -1.15 - 1.5 * fract(sd * 7.31) - 0.5 * iF.y + 0.12 * sin(t * 0.9 + sd * 40.), s.y + e.y * rr * 0.78);
        vec2 hd = normalize(vec2(-e.y, e.x * 0.78)) * s.w;
        float dist = length(uCamL - c);
        float len = (0.15 + 0.09 * fract(sd * 3.7)) * max(1., dist * 0.022);          // never thinner than a pixel and a half: it grows a little with distance
        float roll = 0.95 * sin(t * (0.9 + 1.3 * fract(sd * 5.3)) + sd * 60.);         // rolling on its long axis: now the dark back, now the bright flank
        vec3 fw = vec3(hd.x, 0., hd.y), sdw = vec3(-hd.y, 0., hd.x);
        vec3 upv = vec3(0., cos(roll), 0.) + sdw * sin(roll);
        float wag = 0.10 * sin(t * 9. + sd * 31.) * (position.z + 0.5);
        vWP = c - fw * position.z * len + upv * position.y * len * 1.15 + sdw * wag * len;
        float fl = max(sin(t * (0.55 + 0.9 * fract(sd * 9.1)) + sd * 90.), 0.); fl *= fl; fl *= fl; fl *= fl;
        vGl = fl * abs(sin(roll)); vB = 0.75 + 0.5 * fract(sd * 13.3);
        vec4 mvPosition = viewMatrix * vec4(vWP, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec3 vWP; varying float vGl; varying float vB;
      ${STRANGER_UNIFORMS_GLSL}
      ${S_NOISE_GLSL}
      ${SEA_GLSL}
      ${LIT_UNIFORMS_GLSL}
      ${UNDER_GLSL}
      #include <fog_pars_fragment>
      void main(){
        float gl = clamp(vGl, 0., 1.);
        vec3 col = mix(vec3(0.050, 0.085, 0.10) * clamp(vB, 0.5, 1.3), vec3(0.80, 0.90, 0.92), gl);     // slate-blue backs; a flank turned to the light is silver
        col *= seaLight(vWP, 1., 1., 1.) * (1. + 1.6 * gl);
        gl_FragColor = vec4(seaThrough(col, vWP), 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'fish'; mesh.frustumCulled = false;
  const group = new THREE.Group(); group.name = 'fishShoals'; group.add(mesh);
  // (polish 4) the shoals keep up with us: once one is well behind, it is the next one ahead (moved while out of sight, keyed to u).
  // So there are fish in the foreground beside the mosasaur, under the fire's road at the low pass, and below us on the last climb.
  const later = [[[0.60, ...at(0.872, -6.5, 12), 7.0]], [[0.20, ...at(0.34, 4.8, 3.3), 2.3], [0.50, ...at(0.80, 4.5, 7), 6.0]], [[0.40, ...at(0.748, -10, 0), 8.5], [0.778, ...at(0.848, -3.5, 8), 6.0]], []];
  return { group, spots, update(dt, time, camera, u) {
    for (let i = 0; i < 4; i++) {
      let c = spots[i];
      for (const m of later[i]) if (u > m[0]) c = [m[1], m[2], m[3]];
      const v = U.uShoal.value[i]; v.x = c[0]; v.y = c[1]; v.z = c[2];
    }
  } };
}

// four bleached conifer drift logs on the cay, 6 to 9 m: a tapering trunk with a root flare and broken branch stubs
function makeLogs(env) {
  const { rng, U, ground, endDir, endRight } = env, r = rng.fork('logs');
  const G = new Mini(), W = lin('#D8D0BE', 0.78), Wd = lin('#A79E8C', 0.7);
  const rows = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, rad = 0.5 * (1 - 0.45 * t) * (1 + 1.1 * Math.exp(-t * 14)) * (1 + 0.06 * Math.sin(t * 40));
    rows.push([(t - 0.5), 0.5 * 0.5 + 0.03 * Math.sin(t * 9), rad * 0.5, rad * 0.5, i % 2 ? W : [W[0] * 0.9, W[1] * 0.9, W[2] * 0.9], Wd]);
  }
  G.loft(rows, 8);
  for (const st of [[-0.22, 0.6, 0.20], [0.02, -0.7, 0.24], [0.2, 0.4, 0.16], [-0.38, -0.3, 0.3]]) {          // stubs
    const z = st[0], a = st[1], len = st[2], cx = Math.sin(a) * 0.2, cy = 0.25 + Math.cos(a) * 0.2;
    const b0 = G.v(cx - 0.05, cy, z - 0.035, Wd), b1 = G.v(cx + 0.05, cy, z + 0.035, Wd), b2 = G.v(cx, cy + 0.03, z + 0.05, W), tp = G.v(cx + Math.sin(a) * len, cy + Math.cos(a) * len * 0.9 + 0.05, z - 0.04, W);
    G.tri(b0, b1, tp); G.tri(b1, b2, tp); G.tri(b2, b0, tp);
  }
  const N = 5, I = instanced(G.build(), N);                   // (polish 2: the fifth lies on the spit)
  // the log's local z is its length (1 unit), y its thickness: stretch per instance through iB.z (size) and a deform
  const mesh = new THREE.Mesh(I.geo, animalMaterial(U, /* glsl */`p.z *= iC.x; p.xy *= iC.y;`, /* glsl */`
    float gr = sVN(vec2(vL.x * 40. + vL.y * 30., vL.z * 3.)) * 0.5 + sVN(vec2(vL.x * 9., vL.z * 1.2)) * 0.5;
    alb *= 0.72 + 0.5 * gr; alb *= 1. - 0.35 * smoothstep(0.62, 0.7, sVN(vL.zx * vec2(2.2, 31.)));           // weathered grain and checks`));
  mesh.name = 'driftLogs'; mesh.frustumCulled = false;
  const a = I.a.array, b = I.b.array, c = I.c.array;
  const spots = [[0, -22, 1.2], [0, 38, -1.4], [1, 20, 1.6], [1, -30, -1.0]];
  for (let i = 0; i < N; i++) {
    const S = ground.spit, sp = spots[i] || [0, 0, 0], cc = ground.armC[sp[0]];
    let x = cc.x + endRight.x * sp[1] + endDir.x * sp[2] * -3.2, z = cc.z + endRight.z * sp[1] + endDir.z * sp[2] * -3.2, turn = Math.atan2(endRight.x, -endRight.z);
    if (i === 4) { x = S.x + S.ax * 17 + S.az * 1.5; z = S.z + S.az * 17 - S.ax * 1.5; turn = Math.atan2(S.ax, -S.az) + 0.25; }
    const len = r.range(6, 9);
    a[i * 4] = x; a[i * 4 + 1] = ground.heightAt(x, z) - 0.10; a[i * 4 + 2] = z; a[i * 4 + 3] = turn + r.range(-0.35, 0.35);
    b[i * 4] = r.range(-0.02, 0.03); b[i * 4 + 1] = r.range(-0.3, 0.3); b[i * 4 + 2] = 1; b[i * 4 + 3] = 1;
    c[i * 4] = len; c[i * 4 + 1] = r.range(0.9, 1.2); c[i * 4 + 2] = 0; c[i * 4 + 3] = 0;
  }
  return { mesh, update() {} };
}

// (polish 2) the long morning shadows of the party resting on the spit: one soft dark streak a bird, lying down-Sun on the sand,
// gone the moment its bird goes up (uProg against the bird's own u0)
function makeSpitShadows(env) {
  const { U, sunDir } = env, list = env.spitBirds || [], n = Math.max(list.length, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 0, 1, -1, 0, 1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
  const iS = new Float32Array(n * 4);
  for (let i = 0; i < list.length; i++) { iS[i * 4] = list[i].x; iS[i * 4 + 1] = list[i].y + 0.045; iS[i * 4 + 2] = list[i].z; iS[i * 4 + 3] = list[i].u0; }
  g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.instanceCount = list.length;
  const el = Math.asin(clamp(sunDir.y, 0.12, 1)), len = clamp(0.42 / Math.tan(el), 0.3, 2.2), hl = Math.max(Math.hypot(sunDir.x, sunDir.z), 1e-3);
  U.uProg = { value: 0 };
  U.uSpitSh = { value: new THREE.Vector4(-sunDir.x / hl, -sunDir.z / hl, len, 0.20) };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`
      attribute vec4 iS; uniform vec4 uSpitSh; uniform float uProg;
      varying vec2 vUv; varying float vOn;
      void main(){
        vec2 d = uSpitSh.xy, c = vec2(-d.y, d.x);
        vec3 wp = iS.xyz + vec3(d.x, 0., d.y) * (position.z * uSpitSh.z - 0.10) + vec3(c.x, 0., c.y) * position.x * uSpitSh.w;
        wp.y -= 0.02 + 0.03 * position.z;
        vUv = vec2(position.x, position.z); vOn = 1. - smoothstep(iS.w - 0.001, iS.w + 0.004, uProg);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec4 uLit; varying vec2 vUv; varying float vOn;
      void main(){
        float x = clamp(abs(vUv.x), 0., 1.), y = clamp(vUv.y, 0., 1.);
        float a = (1. - smoothstep(0.35 + 0.4 * y, 1., x)) * smoothstep(0., 0.06, y) * (1. - smoothstep(0.55, 1., y)) * 0.50 * clamp(vOn, 0., 1.) * uLit.w;
        gl_FragColor = vec4(vec3(0.05, 0.08, 0.12) * a, a);
      }`,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'spitShadows'; mesh.frustumCulled = false; mesh.renderOrder = 0.5;
  return mesh;
}

// =============================================================================================
// ASSEMBLY
// =============================================================================================
async function assemble(env) {
  const { ctx, scene, hero, U, look, lookName, path, sky, second, A, portalPos, pal, detail } = env;
  const moScript = makeMoScript(path);
  const sunElR = Math.asin(clamp(env.sunDir.y, 0.05, 1));
  U.uShadK = { value: new THREE.Vector4(1 / Math.tan(sunElR), Math.tan(Math.asin(Math.cos(sunElR) / 1.33)), 3.7, 0.93) };
  U.uLit.value.w = look.sunEl > 2 ? 1 : 0;                                  // no Sun shadows before the Sun is up
  U.uSplash = { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 1)) };
  U.uSw = { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, -999, 0, 0.6)) };
  U.uRudist = { value: C('#D9A06B').multiplyScalar(0.9) };                                    // warmer than the brief's tan #C9B48A in air: 1.5 to 4 m of sea takes the red back out
  U.uWrack = { value: C('#3A3226').multiplyScalar(0.6) };
  const ground = makeGround(env); env.ground = ground;
  await makeChart(env, ground);
  await ctx.yield();
  const bed = await makeBed(env, ground); scene.add(bed);
  await ctx.yield();
  scene.add(makeWater(env));
  await ctx.yield();
  const parts = [];           // { update(dt, time, camera, u, st) }
  const birds = await makeBirds(env); scene.add(birds.mesh, birds.roost, birds.party); parts.push(birds);
  const spitSh = makeSpitShadows(env); scene.add(spitSh);
  await ctx.yield();
  const pteros = makePterosaurs(env); scene.add(pteros.mesh); parts.push(pteros);
  await ctx.yield();
  scene.add(makeCrowns(env).mesh);
  await ctx.yield();
  scene.add(await makeSeagrass(env));
  await ctx.yield();
  const rud = await makeRudists(env); scene.add(rud[0], rud[1]);
  await ctx.yield();
  const reefHeads = await makeReefHeads(env); scene.add(reefHeads.mesh, reefHeads.horns[0], reefHeads.horns[1]);
  await ctx.yield();
  await ctx.yield();
  const ammo = makeAmmonites(env); scene.add(ammo.mesh, ammo.shadows); parts.push(ammo);
  await ctx.yield();
  const turtles = makeTurtles(env); scene.add(turtles.mesh); parts.push(turtles);
  await ctx.yield();
  const far = await makeFarSky(env); scene.add(far.group); parts.push(far);
  await ctx.yield();
  const fish = await makeFish(env); scene.add(fish.group); parts.push(fish);
  await ctx.yield();
  scene.add(makeLogs(env).mesh);
  await ctx.yield();
  if (env.juvenile) {                                                // the cast: some mornings a 5 m youngster swims at her far flank
    const juv = await buildMosasaur(ctx, { palette: pal, rng: env.rng.fork('juvenile'), detail: 0.6, length: 5, sunColor: look.sunSea, tailSweep: 1.25 });
    scene.add(juv.object);
    const jm = {};
    parts.push({ update(dt, time, camera, u) {
      moScript(clamp(u - 0.004, 0, 1), jm);
      const h = jm.heading;
      juv.setPose(jm.x + 3.8 * Math.cos(h) + 1.5 * Math.sin(h), jm.z - 3.8 * Math.sin(h) + 1.5 * Math.cos(h), h + 0.06 * Math.sin(time * 0.7), 0.78 * jm.surfaced, clamp((u - U_MO - 0.012) / 0.04, 0, 1), jm.dive);   // beyond her, level with her shoulder
      juv.update(dt, time + 1.3, st.light);
    } });
    await ctx.yield();
  }
  await ctx.yield();
  await ctx.yield();

  const camPos = new THREE.Vector3(), gaze = new THREE.Vector3(), gaze2 = new THREE.Vector3(), gaze3 = new THREE.Vector3(), gaze4 = new THREE.Vector3(), gaze5 = new THREE.Vector3(), gaze6 = new THREE.Vector3(), gaze7 = new THREE.Vector3(), gaze8 = new THREE.Vector3(), sunH = V3(env.sunDir.x, 0, env.sunDir.z).normalize(), mo = {}, ms = {};
  const st = hero.state, hotTrue = U.uSHot.value.clone().lerp(C('#FFC97F'), 0.5), hotWarm = C('#FFBE6E');   // (polish 4) the fire's light stays gold: white-gold, not white
  const reefAt = V3(ground.mounds[1].x, -2.0, ground.mounds[1].z), spitAt = V3(ground.spit.x + ground.spit.tx * 4, 0.4, ground.spit.z + ground.spit.tz * 4);
  function update(dt, time, camera, u) {
    hero.setProgress(u); U.uProg.value = u; spitSh.visible = u > 0.36 && u < 0.62;
    moScript(u, ms); hero.setMosasaur(ms.x, ms.z, ms.heading, ms.surfaced, ms.breath, ms.dive);
    hero.update(dt, time, camera);
    sky.update(dt, time, camera);
    second.position.copy(st.dir).multiplyScalar(400);
    U.uSHot.value.copy(hotWarm).lerp(hotTrue, smoothstep(0.05, 0.8, st.fire));
    const tide = st.light * look.tide;                               // the second daylight is a colour, not a wash: weaker where the Sun is already high
    second.intensity = tide; U.uSea.value.y = tide;
    U.uStrL.value.copy(st.dir);
    const elR = Math.max(st.elevDeg, 4) * DEG;
    U.uShadK.value.z = 1 / Math.tan(elR); U.uShadK.value.w = Math.tan(Math.asin(Math.cos(elR) / 1.33));
    camera.getWorldPosition(camPos);
    for (let i = 0; i < parts.length; i++) parts[i].update(dt, time, camera, u, camPos);
    // plentiful things are drawn only while they can be seen (meshes only; nothing is made or compiled here)
    rud[0].visible = u < 0.445; rud[1].visible = u > 0.44; reefHeads.horns[0].visible = u < 0.445; reefHeads.horns[1].visible = u > 0.44;      // (polish 5: never both sets at once; the second set's nearest reef is 90 m ahead when it comes on)
    ammo.mesh.visible = u < 0.32; ammo.shadows.visible = u < 0.32; birds.roost.visible = u > 0.42; birds.party.visible = u > 0.29 && u < 0.62;
  }
  update(0, 0, new THREE.PerspectiveCamera(), 0);
  return {
    scene, path, duration: 40, pace,
    title: 'The Growing Crescent · 66 million years ago',
    camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 30, sway: 0.4, bank: 0.5 },      // (polish 5: 0.5, was 1.0: about 8 degrees in the S-turn; tilted further, the far sandbar read as a plank lying across the frame)   // (polish 4: 1.0, was 1.6: at 30 degrees the S-turn read as a lurch)
    pois: [
      // (polish 2) the eye goes down to the first reef as we stoop over it, and down to the spit as we come in over its sand
      { at: reefAt, from: 0.035, to: 0.135, weight: 0.7 },
      // (polish 3) over the ammonites the eye swings toward the Sun and its road: amber shells and flock-mates against the glitter
      { at: (time, u) => { path.posAtDist(u * path.length, gaze6); return gaze6.set(gaze6.x + sunH.x * 26, -0.6, gaze6.z + sunH.z * 26); }, from: 0.115, to: 0.215, weight: 0.55 },
      { at: (time, u) => turtles.firstAt(gaze4), from: 0.205, to: 0.268, weight: 0.64 },      // (polish 5: a little less, so that horizon, flock and sky stay in the picture over it)                         // the turtle that lifts its head beside us
      { at: spitAt, from: 0.40, to: 0.545, weight: 0.5 },
      { at: (time, u) => pteros.besideAt(time, u, gaze3), from: 0.545, to: 0.655, weight: 0.42 },                // the one that flies with us
      // (polish 3) from the top of the climb the eye goes down: bank, creek, shoals, reefs and cay as a chart
      { at: (time, u) => { path.posAtDist((u + 0.078) * path.length, gaze5); gaze5.y = -4; return gaze5; }, from: 0.645, to: 0.752, weight: 0.72 },
      { at: (time, u) => { moScript(u, mo); return gaze.set(mo.x + Math.sin(mo.heading) * 2.2, 0.2, mo.z + Math.cos(mo.heading) * 2.2); }, from: 0.275, to: 0.385, weight: 0.54 },   // her shoulder, a little toward the head
      // the fire: the gaze leans toward it (a third of the way) while it stands clear, and comes back to the ring for the crossing
      { at: (time, u) => { path.posAtDist(u * path.length, gaze2); return gaze2.addScaledVector(st.dir, 300).setY(gaze2.y - 22); }, from: 0.755, to: 0.955, weight: 0.5 },
      // (polish 5) as we level out over the creek the eye goes up to the animal wheeling beside the fire: low horizon, fire and wings
      { at: (time, u) => pteros.fireAt(u, gaze8), from: 0.795, to: 0.862, weight: 0.42, fade: 0.4 },
      // (polish 5) in the stoop the eye comes up a little as the fire first stands, so that head and train are inside the frame
      { at: (time, u) => { path.posAtDist(u * path.length, gaze7); return gaze7.addScaledVector(st.dir, 300); }, from: 0.712, to: 0.778, weight: 0.36, fade: 0.42 },
    ],
    portal: { shape: 'circle', radius: 7, color: '#D8FBF4', glow: 0.5, revealDistance: 215, blendDistance: 30 },
    post: {
      exposure: look.exposure, bloom: { strength: 0.48, radius: 0.6, threshold: 0.92 },
      grade: { saturation: 1.12, contrast: 1.09, tint: '#ffffff', shadowTint: '#04201f', vignette: 0.18, grain: 0.02, aberration: 0 },
    },
    ride: 'none', companion: 'none', style: 'none',
    update,
    dispose() { sky.dispose?.(); hero.dispose?.(); },
  };
}
