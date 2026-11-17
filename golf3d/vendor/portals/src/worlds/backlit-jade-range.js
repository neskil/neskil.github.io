// THE JADE RANGE (backlit-jade-range): a late-April morning inside a skein of bar-headed geese crossing the
// Himalaya. Up a black-green gorge of red rhododendron, up the cascades of its headwall into a hanging valley where
// the stream braids over dark gravel, out along a tarn that mirrors the Lit Wall (src/parts/backlit-jade-range.js)
// on an alp standing in the cloud sea, up a scree spur under a great natural arch of jade (the Needle's Eye), past a
// snow leopard hunting bharal, and down an avenue of back-lit jade blades to a pierced jade arch on the col, the
// Gate Horn burning above it.
//
// WORLD AXES  north = -X, east = -Z (the hero's own frame, turned 25 degrees). The sun stands behind the Lit Wall on
// the right of the flight all the way. Everything is shaded by this file's own shaders: one jade material (rock
// thickness toward the sun and whether the sun reaches it, baked per vertex: a gorge wall is black-green mass and
// only what is a few metres thick -- flakes, fins, ledge lips, the arch's cut edges -- glows pale to apple), one
// matt "rind" material for plants and stones, own geese. It returns style 'none'. All bare stone is CARVED: a 3D
// cell pattern in world metres (so no face ever stretches it) in four sizes, 24 m planes down to half-metre chisel
// cuts, each fading out before it is finer than the pixels; every facet has its own tilt and a bevel round it, lit
// on the side that faces the backlight and shaded on the other, with dark veins and a wet sky sheen.
// BUILT HERE: the ground of the middle third, all in the jade shader on baked path coordinates (aS): the headwall as
// three steps with white cascades, the braided stream (three channels that part and join over a cobble bed, wet
// gravel, running glints), the tarn (flat water cut into the alp, wet beach and silt line, cat's-paws, and an analytic
// mirror of the Lit Wall: the reflected ray is met with the wall's plane and its crest profile, uCrest), red-mat and
// cobble mosaic on the alp, dwarf rhododendron clumps, cairns of carved jade (ringed blades, no flags); the cloud sea
// as vapour, BACKLIT (a grid of billows round the alp, two thin torn sheets, and the cloud-fall as a river of torn
// streamers running down the valley with the water and fraying over the red canopy, the gorge showing under it);
// the skein, laid out as a diagonal from the lower left corner and swung with the gaze; carved blades (pinnacles,
// wall flakes, gendarmes); the pierced arch; loose scree; snow as drift waves lying across the wind, each with a
// short blue lee face, small sastrugi on their backs, boulders half drifted in with snow caps; clusters of jade
// shards (thin translucent blades) by the notch and along the tarn; the west slope above the col as a mosaic of whole
// facets, each either snowed over or bare (cell2: never a stretched streak); a lammergeier (own geometry, the goose
// shader with a slow shallow beat). The bharal and the snow leopard are the kit's quadruped with this file's own
// horns and tail merged in; the terrace herd, the runners of the hunt and the three on the lookout rock are
// herds-of-one, so every animal stands whole, apart from the others.
// THE LAST THIRD (drawn from its own root of random numbers, 'jade-gate:' + seed, so nothing older moves): the
// Needle's Eye, a 50 m arch of dark jade standing across the spur at a = 600; a lookout rock left of the flight with
// three bharal on the skyline; the avenue, nineteen tall thin blades in two rows either side of the line, whose long
// green shadows the jade shader draws on the snow (uBl, uGate) with three trodden trails of prints leading to the
// gate; ribbons of spindrift streaming across the scree and off the brow, the gendarmes and both arches; the gate
// arch 33 m high between two gendarmes; and the Gate Horn, a fluted peak 540 m beyond the col on the line of the
// flight, black-green below and so thin along its summit crest that the light burns through it (aS.w, plus one
// soft additive card).
// MOMENTS by u: gorge 0-0.14 (the Lit Wall's horn burns white above the notch, hero.setLift, eased out 0.1-0.3);
// headwall cascades 0.15-0.24; hanging valley, braids, cairns and a band of bharal by the water 0.24-0.36; the tarn
// and the Lit Wall 0.38-0.50 (the skein changes its lead 0.455-0.585; the far skein, eleven geese in a chevron keyed
// to u, flies north along the wall's foot from 0.3 and swings over the col by 1.0); the fluted fins and shards of
// the notch at 0.34; the Needle's Eye in sight from 0.36, whole in the frame beside the herd at 0.52; the herd on
// its lit terrace right of the path 0.47-0.58; a lammergeier crossing the path, banked, underside to the lens,
// 0.56-0.64 (closest at 0.61, beside the Eye); under the Eye's crown at 0.69; the hunt at 0.70 (gaze 0.63-0.765);
// the lookout bharal and the first blades on the skyline 0.76-0.82; spindrift ribbons from 0.72; the avenue, its
// shadows and the trails 0.80-0.95, the Gate Horn above the arch all the way; geese in file from 0.84.
// pace(u) is 0.8 over the alp, tarn, herd and lammergeier (0.36-0.63) and 0.9 at the hunt (0.66-0.77).
// TERRAIN is a height function on a grid sheared along the path (a = metres along the start-end axis, p = metres
// right of the path), so the mesh is finest under the camera.
// VARIATIONS (seed / ctx.vary): hour = morning | sunrise | full-moon night; weather = clear | gale; season =
// spring (red rhododendron) | autumn (gold birch, fresh snow); cast and counts by density; the rare event is a
// sun shaft through a window in the fin, one defined beam sweeping in across the cloud sea at u 0.455-0.565 (a dim
// moonbeam on the full-moon night).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/backlit-jade-range.js';

const PAL = ['#EEF5E4', '#8FCB86', '#3F8F5A', '#0B2318', '#D9DCCB', '#A4522A', '#C8372C'];
const C3 = (r, g, b) => new THREE.Color(r, g, b);
const LOOKS = {
  day: { zen: C3(0.014, 0.075, 0.115), mid: C3(0.085, 0.3, 0.37), hor: C3(0.6, 0.74, 0.6), sun: C3(1.72, 1.72, 1.6), fill: C3(0.085, 0.2, 0.24), lamp: C3(0.6, 0.8, 0.58), cloud: C3(0.5, 0.56, 0.47), cloudFar: C3(0.74, 0.82, 0.72), fog: C3(0.43, 0.59, 0.56), snow: C3(0.76, 0.78, 0.74), exposure: 1.0, stars: 0, glow: 1, portal: '#e4f6e0' },
  sunrise: { zen: C3(0.012, 0.06, 0.15), mid: C3(0.15, 0.27, 0.42), hor: C3(0.86, 0.58, 0.36), sun: C3(2.05, 1.6, 0.8), fill: C3(0.09, 0.15, 0.23), lamp: C3(0.95, 0.7, 0.4), cloud: C3(0.5, 0.435, 0.48), cloudFar: C3(0.94, 0.72, 0.56), fog: C3(0.55, 0.47, 0.49), snow: C3(0.8, 0.76, 0.76), exposure: 1.05, stars: 0, glow: 1.25, portal: '#ffe6b8' },
  night: { zen: C3(0.002, 0.006, 0.02), mid: C3(0.012, 0.03, 0.07), hor: C3(0.035, 0.065, 0.11), sun: C3(0.42, 0.56, 0.8), fill: C3(0.03, 0.06, 0.11), lamp: C3(0.26, 0.38, 0.52), cloud: C3(0.11, 0.16, 0.22), cloudFar: C3(0.22, 0.31, 0.42), fog: C3(0.035, 0.065, 0.1), snow: C3(0.6, 0.7, 0.8), exposure: 1.55, stars: 1, glow: 0.7, portal: '#cfe4ff' },
};
const NOISE = /* glsl */`
  float jh(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float jn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(jh(i), jh(i + vec3(1,0,0)), f.x), mix(jh(i + vec3(0,1,0)), jh(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(jh(i + vec3(0,0,1)), jh(i + vec3(1,0,1)), f.x), mix(jh(i + vec3(0,1,1)), jh(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
// every material sinks into the cloud sea with analytic height fog (basin = 1 where the sea lies) and takes the thin haze
const ATMOS = /* glsl */`
  uniform vec3 uFogCol, uCloudCol; uniform float uFogD, uCloudY;
  vec3 atmos(vec3 col, vec3 wp, float dist, float basin){
    col = mix(col, uCloudCol, basin * (1. - smoothstep(uCloudY - 6., uCloudY + 5., wp.y)));
    return mix(col, uFogCol, 1. - exp(-dist * uFogD));
  }`;

// cirrus veils crossing the hidden sun dim everything in slow sliding bands
const VEIL = /* glsl */`
  uniform vec3 uVeil;
  float veil(vec3 wp){ return 1. - uVeil.z * smoothstep(.4, .7, jn(vec3((wp.xz - uVeil.xy) / 120., 2.7))); }`;

export default {
  id: 'backlit-jade-range',
  name: 'The Jade Range',
  category: 'wilderness',
  weirdness: 0.4,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const vr = rng.fork('weather');
    // ---------------------------------------------------------------- which morning is this
    const hp = vr();
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' || vary.hour === 'golden' ? 'sunrise' : vary.hour === 'day' ? 'day' : hp < 0.46 ? 'day' : hp < 0.76 ? 'sunrise' : 'night';
    const gale = vr.chance(0.3), autumn = vr.chance(0.3), tahr = vr.chance(0.5);
    const rare = !!vary.rare;
    const xr = makeRng(hashSeed('jade-gate:' + ctx.seed));     // its own stream for what was added later, so the older layout keeps its draws
    const LK = LOOKS[hour], night = hour === 'night';
    const pal = PAL.map((h) => new THREE.Color(h));
    const DUR = 40, CLOUD_Y = 124, TARN_Y = 134.6, TER_Y = 142.5;      // the cloud sea's level; the tarn on the alp
    const scene = new THREE.Scene();
    scene.background = LK.fog.clone();
    scene.fog = new THREE.FogExp2(LK.fog.clone(), 0.0003);   // for the kit creatures; the hero clamps it for itself

    // ---------------------------------------------------------------- the flight
    const path = makePath([
      [-31.6, 100, 52.2], [-78.9, 100, 15.2], [-132.1, 101.5, -26.4], [-185.3, 116, -67.9], [-274.3, 143.5, -132.6], [-355.1, 143.4, -187.1],
      [-436, 149.5, -241.6], [-482.9, 165.5, -270.3], [-532.1, 183.8, -294.8], [-583.3, 202, -315], [-636, 220, -330.6],
      [-679.7, 231.5, -341.5], [-723.3, 236.8, -352.4], [-781.5, 237.5, -366.9],
    ]);
    const PL = path.length, S0 = path.start, E0 = path.end;
    const ax = new THREE.Vector2(E0.x - S0.x, E0.z - S0.z).normalize(), rx = new THREE.Vector2(-ax.y, ax.x);   // axis, and its right
    const toA = (x, z) => (x - S0.x) * ax.x + (z - S0.z) * ax.y, toL = (x, z) => (x - S0.x) * rx.x + (z - S0.z) * rx.y;
    // tables: lateral position and height of the path over the axis coordinate (extended straight beyond both ends)
    const AMIN = -700, AMAX = 3200, TN = AMAX - AMIN + 1, tPl = new Float32Array(TN), tPy = new Float32Array(TN);
    {
      const v = new THREE.Vector3(); let pa = -1e9, pl0 = 0, py0 = 0;
      for (let d = -800; d <= PL + 2600; d += 1.5) {
        path.posAtDist(d, v); const a = toA(v.x, v.z), l = toL(v.x, v.z);
        if (pa > -1e8) for (let k = Math.max(AMIN, Math.ceil(pa)); k <= Math.min(AMAX, Math.floor(a)); k++) { const t = (k - pa) / Math.max(a - pa, 1e-6); tPl[k - AMIN] = lerp(pl0, l, t); tPy[k - AMIN] = lerp(py0, v.y, t); }
        pa = a; pl0 = l; py0 = v.y;
      }
    }
    const tab = (T, a) => { const f = clamp(a - AMIN, 0, TN - 1.001), i = f | 0; return T[i] + (T[i + 1] - T[i]) * (f - i); };
    const plAt = (a) => tab(tPl, a), pyAt = (a) => tab(tPy, a);
    const worldOf = (a, p, out) => { const l = p + plAt(a); out.x = S0.x + ax.x * a + rx.x * l; out.z = S0.z + ax.y * a + rx.y * l; return out; };
    const A_END = toA(E0.x, E0.z);
    await ctx.yield();

    // ---------------------------------------------------------------- the hero: the Lit Wall, placed by the reveal
    const HS = 0.8, WALL_AIM = 1.2, TH = THREE.MathUtils.degToRad(25);
    const hero = await buildHero(ctx, { palette: PAL, hour, weather: gale ? 'gale' : 'clear', season: autumn ? 'autumn' : 'spring', cloudApron: false, sunElevation: hour === 'day' ? 22 : undefined, maxHaze: 0.00006 });
    const nW = new THREE.Vector3(-Math.cos(TH), 0, Math.sin(TH)), fW = new THREE.Vector3(Math.sin(TH), 0, Math.cos(TH));   // wall's north, wall's front
    const Rv = path.pointAt(0.42), DPERP = 2200;
    {
      // slide the wall along itself until its north horn stands on the gorge's axis (seen above the notch at the entry)
      const zMid = hero.anchors.viewpoints.reveal.lookAt.z, base = Rv.clone().addScaledVector(fW, -DPERP);
      const dS = path.startTangent, rel = base.clone().sub(S0);
      const t = clamp(-(rel.x * dS.z - rel.z * dS.x) / (nW.x * dS.z - nW.z * dS.x), 700, 1700);
      const fx = hero.anchors.hornTop.x * HS + t, fz = zMid * HS;
      hero.object.scale.setScalar(HS); hero.object.rotation.y = TH;
      hero.object.position.set(base.x + nW.x * fx - fW.x * fz, 131 - 60 * HS, base.z + nW.z * fx - fW.z * fz);
      hero.object.updateMatrixWorld(true);
      scene.add(hero.object);
    }
    const heroW = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const hornW = heroW(hero.anchors.hornTop), wallMid = heroW(hero.anchors.viewpoints.reveal.lookAt);
    const sunDir = hero.anchors.sunDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), TH).normalize();
    const sunEnd = hero.anchors.sunDirEnd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), TH).normalize();
    const lampDir = fW.clone().multiplyScalar(-1).setY(0.42).normalize();     // the wall is the lamp of everything in its lee
    const windW = hero.anchors.wind.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), TH).setY(0).normalize();
    // the far skein crosses the col ahead of us (the hero keeps its from/to vectors live in its uniforms)
    // Keyed to u (the lead's place on one curve): over the cloud sea it flies north along the wall's foot, pale chips
    // against the black-green buttresses (the scale cue of THE image); then it swings over the col ahead of us.
    const skP = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _sk = new THREE.Vector3(), _skT = new THREE.Vector3(), _skV = new THREE.Vector3();
    {
      const e = E0, r = new THREE.Vector3(-path.endTangent.z, 0, path.endTangent.x), t = path.endTangent;
      const c42 = path.pointAt(0.42), foot = heroW(hero.anchors.viewpoints.reveal.lookAt).setY(CLOUD_Y + 250), d = foot.clone().sub(c42).setY(0).normalize();
      const mid = c42.clone().addScaledVector(d, 430).addScaledVector(nW, -128); mid.y = CLOUD_Y + 86;
      skP[0].copy(mid).addScaledVector(nW, -100); skP[1].copy(mid).addScaledVector(nW, 180).setY(CLOUD_Y + 100);
      hero.anchors.skeinLine.spread.value = 2; hero.anchors.skeinLine.minPx.value = 11;
      skP[2].copy(e).addScaledVector(t, 330).addScaledVector(r, 300).setY(e.y + 95); skP[3].copy(e).addScaledVector(t, 500).addScaledVector(r, -420).setY(e.y + 150);
    }
    const skeinAt = (u) => {
      const k = clamp((u - 0.3) / 0.7, 0, 1), m = 1 - k;
      _sk.set(0, 0, 0).addScaledVector(skP[0], m * m * m).addScaledVector(skP[1], 3 * m * m * k).addScaledVector(skP[2], 3 * m * k * k).addScaledVector(skP[3], k * k * k);
      _skT.set(0, 0, 0).addScaledVector(skP[0], -m * m).addScaledVector(skP[1], m * m - 2 * m * k).addScaledVector(skP[2], 2 * m * k - k * k).addScaledVector(skP[3], k * k).normalize();
      hero.anchors.skeinLine.from.copy(hero.object.worldToLocal(_skV.copy(_sk).addScaledVector(_skT, -300)));
      hero.anchors.skeinLine.to.copy(hero.object.worldToLocal(_skV.copy(_sk).addScaledVector(_skT, 300)));
      hero.anchors.skeinLine.s.value = 300 / HS;
    };
    skeinAt(0);
    await ctx.yield();

    // ---------------------------------------------------------------- shared uniforms
    const G = {
      uTime: { value: 0 }, uProg: { value: 0 }, uSun: { value: sunDir.clone() }, uSunCol: { value: LK.sun.clone() }, uSkyCol: { value: LK.fill.clone() },
      uLamp: { value: lampDir }, uLampCol: { value: LK.lamp.clone() }, uPale: { value: pal[0] }, uApple: { value: pal[1] }, uDeep: { value: pal[2] }, uDark: { value: pal[3] },
      uRind: { value: pal[5] }, uAccent: { value: autumn ? new THREE.Color('#b4541f') : pal[6] }, uSnowCol: { value: LK.snow.clone() }, uWind: { value: windW },
      uFogCol: { value: LK.fog.clone() }, uCloudCol: { value: LK.cloud.clone().multiplyScalar(0.8) }, uFogD: { value: 0.00034 }, uCloudY: { value: CLOUD_Y },
      uZen: { value: LK.zen.clone() }, uMid: { value: LK.mid.clone() }, uHor: { value: LK.hor.clone() }, uWallC: { value: new THREE.Vector3() }, uWallN: { value: fW.clone() }, uWallT: { value: nW.clone() }, uCrestS: { value: new THREE.Vector2(0, 100) }, uCrest: { value: new Array(25).fill(1800) },
      uAxS: { value: new THREE.Vector4(S0.x, S0.z, ax.x, ax.y) }, uBl: { value: Array.from({ length: 20 }, () => new THREE.Vector4(1e6, 1e6, 0, 0)) }, uGate: { value: new THREE.Vector3(1, 0, 2.4) },
      uGale: { value: gale ? 1 : 0 }, uVH: { value: 900 }, uAsp: { value: 16 / 9 }, uShaft: { value: new THREE.Vector4(0, 0, 0, 0) }, uVeil: { value: new THREE.Vector3(0, 0, 0.26) }, uNight: { value: night ? 1 : 0 }, uFloor: { value: hour === 'sunrise' ? 1.45 : 1 },
    };
    { // the Lit Wall's crest line, for its picture in the tarn: 25 heights along the wall's own north axis, from a point on its plane
      const cw = hero.anchors.crest.map(heroW), C = cw[12].clone(); C.y = CLOUD_Y;
      G.uWallC.value.copy(C); const s0 = cw[0].clone().sub(C).dot(nW), s1 = cw[24].clone().sub(C).dot(nW);
      G.uCrestS.value.set(s0, (s1 - s0) / 24); G.uCrest.value = cw.map((v) => v.y); }
    const mkMat = (o) => { const { own, ...rest } = o; const m = new THREE.ShaderMaterial(rest); Object.assign(m.uniforms, G, own || {}); return m; };

    // ---------------------------------------------------------------- the land: one height function
    const ox = rng.range(-40, 40), oz = rng.range(-40, 40);
    const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
    const torrentP = (a) => -15 + 8 * Math.sin(a / 43 + 1 + ox * 0.1);
    // THE WATER'S COURSE. A jade-green tarn lies in the lap of the alp (the rock shoulder between the notch and the spur, standing
    // out of the cloud sea) and mirrors the Lit Wall. Its outflow braids over dark gravel down the hanging valley and through the
    // notch, drops down the gorge's headwall in cascades and is the torrent under the rhododendrons. The tarn and the braids are
    // drawn in the jade shader from these same formulas (so they lie exactly on the ground); the cascades are the torrent's mesh.
    const tarnT = (a, p) => {            // > 0 in the water (1 at its middle), 0 on the shore line, falling outward; an islet stands in it
      const da = (a - 414) / (a > 414 ? 38 : 48), dp = (p - 6 - 5 * Math.sin(a * 0.045 + 1)) / (30 * (1 + 0.16 * Math.sin(a * 0.13 + 2))), ia = a - 437, ip = p - 14;
      return 1 - da * da - dp * dp + 0.13 * Math.sin(a * 0.21 + p * 0.17) + 0.08 * Math.sin(p * 0.45 - a * 0.11 + 1.7) - 1.5 * Math.exp(-(ia * ia + ip * ip) / 13);
    };
    const streamP = (a) => lerp(lerp(torrentP(a), -3 + 5 * Math.sin(a / 37 + 2), smoothstep(150, 232, a)), 1.4, smoothstep(325, 368, a));
    const braidK = (a) => smoothstep(212, 240, a) * (1 - smoothstep(330, 368, a));
    // the gorge's floor under the flight: the forest gorge, the headwall (three risers the water falls down, a 150 to 212, 78 to 112 m),
    // the hanging valley rising evenly to the notch's sill, the alp
    const stairs = (t) => { const k = clamp(t, 0, 1) * 3, i = Math.min(Math.floor(k), 2), f = k - i; return (i + 0.2 * f + 0.8 * smoothstep(0.66, 0.95, f)) / 3; };
    const floorAt = (a) => (a < 150 ? 78 : a < 212 ? 78 + 34 * stairs((a - 150) / 62) : a < 320 ? 112 + 25.5 * (a - 212) / 108 : 137.5);
    const hwAt = (a) => lerp(38, 19, smoothstep(215, 300, a));
    const benchW = (a) => smoothstep(552, 584, a) * (1 - smoothstep(704, 736, a));
    const ribC = (a, l) => Math.cos(6.2832 * ((a + 5 * (0.6 * Math.sin(l / 61 + ox) + 0.4 * Math.sin(l / 27 + 2.1 + oz))) / 48 + oz * 0.07));
    const ribAt = (a, l) => smoothstep(0.76, 0.99, ribC(a, l));   // one every 48 m, wavering
    // the col's snowfield comes down the spur in ragged tongues (drifted gullies between scoured stone); 0 bare .. 1 deep
    const colSnowAt = (a, p, x, z) => { const as = a + 22 * noise.n2(p / 7.5 + 3.3 + ox, a / 70 + 1.7) + 9 * noise.n2(x / 17 + 3, z / 17 - 2) + 3.5 * noise.n2(x / 5.5 + 9, z / 5.5); return smoothstep(736, 772, as) * (0.5 + 0.5 * smoothstep(744, 800, as)); };
    const hRaw = (a, l) => {
      const p = l - plAt(a), ap = Math.abs(p), sg = p < 0 ? -1 : 1, py = pyAt(a);
      const n1 = noise.n2(a / 170 + 3.1 + ox, l / 170 + oz), n2 = noise.n2(a / 47 + 9.7, l / 47 - ox), n3 = noise.n2(a / 13 + oz, l / 13);
      // gorge floor rising to the notch lip, then the basin under the cloud
      const hwin = smoothstep(138, 158, a) * (1 - smoothstep(205, 222, a));        // the headwall's lips are cut back in the middle and ragged
      const floorG = floorAt(a + (0.2 * ap - 4 + 8 * noise.n2(l / 23 + ox, a / 61 + 2)) * hwin) + n2 * lerp(3, 0.9, smoothstep(185, 225, a));
      let h = lerp(floorG, 102 + 14 * n1 + 6 * n2, smoothstep(322, 372, a));
      // the massif the gorge is cut through: walls in two ledged steps, a north face falling into the basin
      const edge = 322 + 22 * noise.n2(l / 140 + ox, 4.4);
      if (a < edge + 2) {
        const hw = lerp(38, 19, smoothstep(215, 300, a)) + (sg > 0 ? 7 * smoothstep(262, 296, a) : 0);   // the right wall stands back at the notch
        const qin = ap - hw + 6 * noise.n2(a / 38 + 5, sg * 7.3 + ox) * (1 - 0.6 * smoothstep(262, 296, a)) + 2.2 * n3;
        if (qin > 0) {
          const M = 262 + 60 * n1 + 55 * noise.ridged2(a / 210 + 2 + ox, l / 210, 3) + 12 * n2;
          let w = 3.4 * qin - 22 * smoothstep(26, 36, qin) - 20 * smoothstep(57, 67, qin) + 5 * n3 * smoothstep(8, 30, qin);
          w = smin(w, M, 26);
          h += Math.max(0, w) * (1 - smoothstep(edge - 50, edge, a));
        } else {
          // the torrent's slot (shallow up the headwall, where the water shows as cascades), and the gravel bed of the braids above
          const up = smoothstep(136, 166, a), sd = lerp(17, 3.6, up) * (1 - smoothstep(196, 214, a)), dq = Math.abs(p - streamP(a));
          if (sd > 0.01) h -= sd * Math.exp(-Math.pow(dq / lerp(5.5, 3.4, up), 2)) * smoothstep(-3, -8, qin);
          h -= 0.9 * smoothstep(205, 225, a) * (1 - smoothstep(3, 6 + 7 * braidK(a), dq));
        }
      }
      // the notch's fins: two blades flanking the gap, thin toward the sun
      if (a > 282 && a < 358) {
        // hollow-ground flutes between thin aretes that stand on every third row of the grid (10.8 m apart), cut 2.6 m back;
        // the right fin stands 26 m off the flight, the left 20
        const fold = Math.abs((((a + 30) / 10.8) % 1) - 0.5) * 2, flute = 3.4 * (1 - Math.pow(fold, 1.5));
        const T = lerp(46, 15, smoothstep(292, 350, a)), qf = ap - (sg > 0 ? 26 : 20) - flute - 0.8 * n3;
        // (the right fin is the lower and shorter of the two: it is down by a = 336, so the view opens to the Lit Wall as we pass)
        const cap = (sg > 0 ? 66 * Math.pow(1 - smoothstep(298, 336, a), 0.7) : 124 * Math.pow(1 - smoothstep(318, 357, a), 0.7)) * smoothstep(282, 296, a) * (0.8 + 0.2 * fold);
        const fin = Math.min(6.5 * qf, 6.5 * (T + 2 - qf - 2 * flute), cap + 6 * n2);
        if (fin > 0) h = Math.max(h, floorG + fin);
      }
      // the alp: a broad rock shoulder from the notch's sill to the foot of the spur, 14 m above the cloud sea either side of it
      if (a > 296 && a < 524) {
        const tb = Math.exp(-Math.pow((a - 414) / 56, 2)), wide = smoothstep(318, 366, a);
        const base = a < 340 ? floorG : lerp(137.5, 139.8, smoothstep(340, 470, a)) + 0.9 * n2;
        const W = p > 0 ? lerp(19, 28, wide) + 27 * tb + 5 * n2 * wide : lerp(19, 25, wide) + 16 * tb + 5 * noise.n2(a / 31 + 7, ox) * wide;
        const over = Math.max(0, ap - W);
        const ha = base + 0.6 * n3 * smoothstep(3, 12, ap) + 1.5 * noise.n2(a / 19 + 3, l / 19) * smoothstep(8, 22, ap) * (1 - smoothstep(0, 4, over)) - 0.82 * over - 2.2 * smoothstep(0, 7, over) + 2.4 * n3 * smoothstep(2, 12, over);
        h = Math.max(h, ha - 80 * smoothstep(488, 524, a));
      }
      // the spur climbing from the alp, with a snow bench and a black rib on its right for the hunt, and at its foot a scree
      // balcony over the cloud where the blue sheep graze
      if (a > 440 && a < 850) {
        const wb = benchW(a), crest = py - 9, shelf = smoothstep(456, 468, a) * (1 - smoothstep(494, 512, a));
        let hs;
        if (p >= 0) hs = crest - 0.62 * Math.max(0, p - 12 - 10 * wb - 15 * shelf) - 1.1 * shelf * smoothstep(5, 12, p) + wb * (4.5 * smoothstep(4.2, 6.8, p) + 3.7 * smoothstep(14.0, 17.5, p));
        else hs = crest - 0.55 * Math.max(0, -p - 13) - 0.002 * Math.pow(Math.max(0, -p - 13), 2);
        hs += 0.9 * n3 * smoothstep(4, 14, ap) + 3 * n2 * smoothstep(14, 50, ap);
        h = Math.max(h, hs - 500 * (1 - smoothstep(440, 462, a) * (1 - smoothstep(796, 846, a))));   // the crest runs on up into the saddle
      }
      // the col: a snow saddle on the basin's north rim, rising to peaks either side
      if (a > 600) {
        const bell = 1 - smoothstep(45, 150, Math.abs(a - (A_END + 4)));
        const side = Math.pow(Math.max(0, ap - 56), 1.1) * (0.8 + 0.3 * n1);
        // the big west slope is broken by jade ribs: steep-sided buttresses running up the fall line, too steep to hold snow
        const rib = sg < 0 ? ribAt(a, l) * smoothstep(62, 92, ap) * (1 - smoothstep(210, 330, ap)) : 0;
        let hc = 230 + 1.4 * n2 - 3.5 * smoothstep(A_END - 62, A_END - 20, a) - 0.95 * Math.max(0, A_END - 70 - a) - 0.16 * Math.max(0, a - A_END - 20) + (sg > 0 ? Math.min(side * 0.2, 30) : smin(side, 240 + 90 * n1, 80) + rib * (10 + 4 * n2 + 2.5 * n3)) * bell;
        // east of the saddle the rim breaks off in a craggy face that falls into the cloud sea, so nothing lies across the
        // Lit Wall's foot: its buttresses rise straight out of the cloud
        if (sg > 0) { const k = smoothstep(92, 205, p + 24 * n2 + 7 * n3); hc = lerp(hc, 84 + 8 * n2, k) + 9 * n3 * k * (1 - k) * 4 * 0.5; }
        h = Math.max(h, hc);
      }
      // the basin's west rim
      if (l < -360) h = Math.max(h, 96 + smoothstep(-380, -760, l) * (250 + 170 * noise.ridged2(a / 300 + ox, l / 300 + 5, 3) + 40 * n2));
      // the tarn: dead level inside its shore line, the banks rising from it
      if (a > 360 && a < 506) {
        const T = tarnT(a, p); if (T > -1) h = T >= 0 ? TARN_Y : Math.min(h, TARN_Y + 0.2 + 6 * Math.pow(-T, 1.15));
      }
      // THE HERD'S TERRACE at the spur's foot, beyond the tarn's north-east shore: a level rock shelf 10 to 33 m right of the
      // flight and 2.7 m under its line, standing 8 m over the tarn on a chiselled crag. The blue sheep stand on its lip, whole,
      // on our skyline against the cloud sea and the foot of the Lit Wall.
      if (p > 7 && a > 451 && a < 526) {
        // (beyond a = 490 the shelf climbs with the flight, 4.6 m under it, to the foot of the snow bench: the rest of the herd stands there)
        const m = smoothstep(454, 459.5, a) * (1 - smoothstep(516, 525, a)) * smoothstep(8.2, 9.8, p) * (1 - smoothstep(lerp(30, 25, smoothstep(490, 510, a)), lerp(35, 29, smoothstep(490, 510, a)), p + 3 * n3));
        if (m > 0) h = lerp(h, Math.max(TER_Y + 0.045 * (a - 459), py - 4.6) + 0.22 * n3, m);
      }
      // THE LOOKOUT ROCK on the last of the spur, left of the flight: a block of dark stone with a level snow-capped top a metre and
      // a half under our line, where three blue sheep stand on the skyline as we come up to the col
      if (a > 700 && a < 729 && p < -7 && p > -24) {
        const m = smoothstep(703.5, 707.5, a) * (1 - smoothstep(721.5, 725.5, a)) * smoothstep(-8.9, -10.4, p) * (1 - smoothstep(-18.2, -21, p + 1.2 * n3));
        if (m > 0) h = lerp(h, py - 1.6 + 0.2 * n3, m);
      }
      // the camera's corridor
      return Math.min(h, py - 7.2 + Math.max(0, ap - 6) * 1.7);
    };

    // grid: rows along the axis, columns across the path; fine near the flight, growing geometrically outward
    const aArr = [], pArr = [];
    { let a = -30, st = 3.6; const lo = []; while (a > -230) { st *= 1.35; a -= st; lo.push(a); } lo.reverse(); aArr.push(...lo);
      for (a = -30; a <= 900; a += 3.6) aArr.push(a); st = 3.6; a = aArr[aArr.length - 1]; while (a < 2500) { st *= 1.22; a += st; aArr.push(a); } }
    { const side = (hold) => { const h = [0]; let p = 0, st = 3.5; while (p < 80) { p += 3.5; h.push(p); } while (p < hold) { p += 5; h.push(p); st = 5; } while (p < 1800) { st *= 1.165; p += st; h.push(p); } return h; };   // 5 m columns out to 200 m on the left: the col's west slope, its ribs and gullies
      const hl = side(196), hr = side(0); for (let i = hl.length - 1; i > 0; i--) pArr.push(-hl[i]); pArr.push(...hr); }
    const NI = aArr.length, NJ = pArr.length, HG = new Float32Array(NI * NJ);
    for (let i = 0; i < NI; i++) {
      const a = aArr[i], pl = plAt(a);
      for (let j = 0; j < NJ; j++) HG[i * NJ + j] = hRaw(a, pArr[j] + pl);
      if ((i & 3) === 3) await ctx.yield();
    }
    const findB = (arr, v) => { let lo = 0, hi = arr.length - 1; if (v <= arr[0]) return 0; if (v >= arr[hi]) return hi - 0.0001; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= v) lo = m; else hi = m; } return lo + (v - arr[lo]) / (arr[hi] - arr[lo]); };
    // (rows are 3.6 m apart from a = -30 to 900 and columns 3.5 m apart within 80 m of the flight: those are found without a search)
    const A0I = aArr.indexOf(-30), P0J = pArr.indexOf(0);
    const findA = (a) => (a >= -30 && a < 896 ? A0I + (a + 30) / 3.6 : findB(aArr, a)), findP = (q) => (q > -80 && q < 80 ? P0J + q / 3.5 : findB(pArr, q));
    const hAL = (a, l) => {
      const fi = findA(a), fj = findP(l - plAt(a)), i = fi | 0, j = fj | 0, tx = fi - i, ty = fj - j, k = i * NJ + j;
      return (HG[k] * (1 - ty) + HG[k + 1] * ty) * (1 - tx) + (HG[k + NJ] * (1 - ty) + HG[k + NJ + 1] * ty) * tx;
    };
    const heightAt = (x, z) => hAL(toA(x, z), toL(x, z));

    // ---------------------------------------------------------------- terrain mesh + bakes (thickness toward the sun, occlusion, cover)
    const nTV = NI * NJ, tPos = new Float32Array(nTV * 3), tD = new Float32Array(nTV * 4), tE = new Float32Array(nTV * 4), tS = new Float32Array(nTV * 4), tIdx = new Uint32Array((NI - 1) * (NJ - 1) * 6);
    { const w = new THREE.Vector3(); let q = 0;
      for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const k = i * NJ + j; worldOf(aArr[i], pArr[j], w); tPos[k * 3] = w.x; tPos[k * 3 + 1] = HG[k]; tPos[k * 3 + 2] = w.z; }
      for (let i = 0; i < NI - 1; i++) for (let j = 0; j < NJ - 1; j++) { const a = i * NJ + j, b = a + 1, c = a + NJ, d = c + 1; tIdx[q++] = a; tIdx[q++] = b; tIdx[q++] = c; tIdx[q++] = b; tIdx[q++] = d; tIdx[q++] = c; } }
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); tGeo.setIndex(new THREE.BufferAttribute(tIdx, 1));
    await ctx.yield();
    tGeo.computeVertexNormals();
    await ctx.yield();
    // metres of rock toward the sun: ten exponentially spaced stretches, each weighted by how deep its middle lies
    const thick = (x, y, z, S) => {
      let L = 0, t0 = 0;
      for (let k = 0; k < 10; k++) { const t1 = 3 * Math.pow(1.9, k), tm = (t0 + t1) * 0.5, seg = t1 - t0; const d = heightAt(x + S.x * tm, z + S.z * tm) - (y + S.y * tm); L += seg * clamp(d / (seg * 0.5) + 0.5, 0, 1); t0 = t1; }
      return L;
    };
    const snowLine = autumn ? 236 : 318, antiSun = sunDir.clone().negate();
    { const nrm = tGeo.attributes.normal.array;
      for (let i = 0; i < NI; i++) {
        const a = aArr[i];
        for (let j = 0; j < NJ; j++) {
          const k = i * NJ + j, p = pArr[j], x = tPos[k * 3], y = tPos[k * 3 + 1], z = tPos[k * 3 + 2], ny = nrm[k * 3 + 1];
          const near = Math.abs(p) < 420 && a > -120 && a < 1300;
          const slabW = benchW(a) * smoothstep(11.5, 12.3, p) * (1 - smoothstep(23, 29, p));     // the hunt's rib and the slab behind it: bare black-green stone
          let th = 60 + 500 * smoothstep(420, 150, y);
          let vis = 0;
          if (near) { th = thick(x, y, z, sunDir); vis = Math.exp(-th / 5); const nd = nrm[k * 3] * sunDir.x + ny * sunDir.y + nrm[k * 3 + 2] * sunDir.z; if (nd > -0.2) th += thick(x, y, z, antiSun) * smoothstep(-0.2, 0.15, nd); const r5 = 5, m5 = (heightAt(x + r5, z) + heightAt(x - r5, z) + heightAt(x, z + r5) + heightAt(x, z - r5)) * 0.25; th = lerp(th, Math.min(th, lerp(11, 2.2, smoothstep(300, 360, a))), clamp((y - m5 - 0.5) / 3.2, 0, 1)); th = Math.max(th, 420 * slabW); }
          tD[k * 4] = th;
          // occlusion: how far this point sits below its surroundings
          let ao = 1;
          if (near) { const r = 11, m = (heightAt(x + r, z) + heightAt(x - r, z) + heightAt(x, z + r) + heightAt(x, z - r)) * 0.25; ao = clamp(1 - (m - y) / 16, 0.3, 1); }
          tD[k * 4 + 1] = ao;
          const wb = benchW(a), flat = smoothstep(0.52, 0.72, ny);
          let snow = colSnowAt(a, p, x, z) * smoothstep(0.42, 0.6, ny) * (1 + 0.3 * noise.n2(x / 21 + 3, z / 21));                           // the col, its edge ragged
          snow = Math.max(snow, wb * smoothstep(4.6, 6.0, p) * (1 - smoothstep(11.0, 11.9, p)) * 0.97);     // the snow tongue
          snow = Math.max(snow, flat * smoothstep(snowLine - 30, snowLine + 30, y) * 0.9);
          if (a > 600 && p > 0) snow *= 1 - 0.8 * smoothstep(100, 135, p);              // the east face of the col is bare crag
          // the col's west slope holds snow on all but its steepest stone (which facets carry it is settled per pixel, in the jade shader)
          if (a > 700 && p < -52) snow = Math.max(snow, 0.8 * smoothstep(700, 745, a) * smoothstep(-52, -70, p) * smoothstep(0.25, 0.55, ny));
          const rockW = a > 702 && a < 727 && p < -8 && p > -22.5 ? 1 : 0;                  // the lookout rock: dark stone, a cap of snow
          if (rockW) { snow = Math.max(snow, 0.97 * smoothstep(0.6, 0.8, ny)); th = Math.max(th, 140); tD[k * 4] = th; }
          tD[k * 4 + 2] = snow;
          tD[k * 4 + 3] = smoothstep(448, 475, a) * (1 - smoothstep(A_END + 60, A_END + 120, a)) * (1 - smoothstep(90, 150, Math.abs(p))) * smoothstep(0.35, 0.6, ny) * (1 - slabW) * (a > 735 && p < 0 ? 1 - smoothstep(44, 66, -p) : 1);   // scree (the hunt's rib and the col's west slope stay bare black-green stone)
          // the water's course: the braids' bed of dark gravel up the hanging valley, the alp's stony ground with mats of dwarf
          // rhododendron and juniper lying on it in patches (none on the tarn's beach or in the stream's bed)
          const pcS = streamP(a), dqS = Math.abs(p - pcS), bk = braidK(a), Tt = a > 356 && a < 480 ? tarnT(a, p) : -9;
          const bedK = smoothstep(205, 222, a) * (1 - smoothstep(368, 376, a)) * (1 - smoothstep(4 + 7 * bk, 7.5 + 8 * bk, dqS));
          const alpK = smoothstep(326, 346, a) * (1 - smoothstep(470, 500, a));
          const matP = smoothstep(-0.08, 0.26, noise.n2(x / 12 + 5, z / 12 - 3) + 0.45 * noise.n2(x / 4.3, z / 4.3 + 2)) * (1 - smoothstep(-0.5, -0.16, Tt));
          tD[k * 4 + 3] = Math.max(tD[k * 4 + 3], Math.max(alpK, bedK) * (1 - smoothstep(60, 110, Math.abs(p))) * smoothstep(0.35, 0.6, ny));
          tE[k * 4] = smoothstep(305, 335, a); tE[k * 4 + 3] = vis;
          tE[k * 4 + 1] = Math.max((1 - smoothstep(318, 340, a)) * (y < snowLine ? 1 : 0.3), alpK * matP * (1 - smoothstep(444, 458, a) * smoothstep(1, 6, p))) * smoothstep(0.5, 0.7, ny) * (1 - bedK);  // rind mats: forest floor, ledges, rim, the alp
          tE[k * 4 + 2] = smoothstep(205, 300, a);                               // open to the Lit Wall's lamp light and the notch's sky (the deep gorge is not)
          tS[k * 4] = a; tS[k * 4 + 1] = p; tS[k * 4 + 2] = smoothstep(203, 211, a) * (1 - smoothstep(371, 377, a)) * (1 - smoothstep(14, 18, dqS)); tS[k * 4 + 3] = pcS;
        }
        if ((i & 1) === 1) await ctx.yield();
      } }
    // the thickness ladder is steep, so one thin vertex among thick ones shows as a hard pale triangle: soften the bake
    // (a 3 x 3 blur of log thickness) so the glow on crests and lips grades across the facets
    { const lg = new Float32Array(nTV); for (let k = 0; k < nTV; k++) lg[k] = Math.log(Math.max(tD[k * 4], 0.5));
      await ctx.yield();
      for (let i = 1; i < NI - 1; i++) { const a = aArr[i]; if (a < -120 || a > 1300) continue;
        for (let j = 1; j < NJ - 1; j++) { if (Math.abs(pArr[j]) > 400) continue; const k = i * NJ + j;
          tD[k * 4] = Math.exp((lg[k] * 4 + (lg[k - 1] + lg[k + 1] + lg[k - NJ] + lg[k + NJ]) * 2 + lg[k - NJ - 1] + lg[k - NJ + 1] + lg[k + NJ - 1] + lg[k + NJ + 1]) / 16); }
        if ((i & 63) === 63) await ctx.yield(); } }
    tGeo.setAttribute('aD', new THREE.BufferAttribute(tD, 4)); tGeo.setAttribute('aE', new THREE.BufferAttribute(tE, 4)); tGeo.setAttribute('aS', new THREE.BufferAttribute(tS, 4));
    tGeo.computeBoundingSphere();

    // ---------------------------------------------------------------- the jade material (all green stone)
    // colour = sun through the baked thickness (ladder: white-celadon, apple, deep, black-green) x forward phase,
    // shown on faces turned from the sun; + black-green floor, sky and wall-lamp fill, one waxy highlight, a rim.
    // Veins and tool marks live in world space (the stone never moves). Cover (scree, rind mats, snow) lies on top.
    const jadeMat = mkMat({
      vertexShader: /* glsl */`
        attribute vec4 aD, aE, aS;
        varying vec3 vW, vN; varying vec4 vD, vE, vS;
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * normal; vD = aD; vE = aE; vS = aS; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun, uSunCol, uSkyCol, uLamp, uLampCol, uPale, uApple, uDeep, uDark, uRind, uAccent, uSnowCol, uWind;
        uniform float uTime, uGale, uFloor; uniform vec4 uAxS; uniform vec4 uBl[20]; uniform vec3 uGate;
        uniform vec3 uZen, uMid, uHor, uWallC, uWallN, uWallT; uniform vec2 uCrestS; uniform float uCrest[25];
        varying vec3 vW, vN; varying vec4 vD, vE, vS;
        ${NOISE}
        ${ATMOS}
        ${VEIL}
        vec4 stones(vec2 p){                                   // xy: vector from the nearest stone centre, z: distance to its border, w: its id
          vec2 i = floor(p), f = fract(p), rb = vec2(0.); float d1 = 8., d2 = 8., id = 0.;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 g = vec2(float(x), float(y)); vec3 h3 = vec3(i + g, 7.);
            vec2 r = g + .12 + .76 * vec2(jh(h3), jh(h3 + 13.7)) - f; float q = dot(r, r);
            if (q < d1) { d2 = d1; d1 = q; id = jh(h3 + 31.1); rb = r; } else if (q < d2) d2 = q;
          }
          return vec4(-rb, sqrt(d2) - sqrt(d1), id);
        }
        // CARVED FACETS, fixed in world space: the stone is cut in flat planes a few metres across (standing flakes, taller than
        // wide). x: distance to the nearest edge between two facets (0 on the edge), yzw: the facet's own random triple;
        // dir: from the facet's middle toward this point (the way its bevelled edge leans).
        vec4 facet(vec3 p, out vec3 dir){
          vec3 i = floor(p), f = fract(p), id = vec3(.5), rb = vec3(0., 1., 0.); float d1 = 8., d2 = 8.;
          for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec3 g = vec3(float(x), float(y), float(z)); float h = jh(i + g + 3.7);
            vec3 o = fract(h * vec3(1., 57.31, 193.7) + vec3(0., .31, .67));
            vec3 r = g + .1 + .8 * o - f; float q = dot(r, r);
            if (q < d1) { d2 = d1; d1 = q; id = o; rb = r; } else if (q < d2) d2 = q;
          }
          dir = -rb * inversesqrt(max(d1, 1e-6));
          return vec4(sqrt(d2) - sqrt(d1), id);
        }
        // the same cells as facet(): x = distance to the nearest edge, y = this facet's own number, z = the number of the facet across that edge
        vec3 cell2(vec3 p){
          vec3 i = floor(p), f = fract(p); float d1 = 8., d2 = 8., r1 = .5, r2 = .5;
          for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec3 g = vec3(float(x), float(y), float(z)); float h = jh(i + g + 3.7);
            vec3 o = fract(h * vec3(1., 57.31, 193.7) + vec3(0., .31, .67));
            vec3 r = g + .1 + .8 * o - f; float q = dot(r, r);
            if (q < d1) { d2 = d1; r2 = r1; d1 = q; r1 = o.z; } else if (q < d2) { d2 = q; r2 = o.z; }
          }
          return vec3(sqrt(d2) - sqrt(d1), r1, r2);
        }
        // a trail trodden in the snow along the flight: xy = slope of each print's dimple (for its lit rim), z = its depth 0..1, w = the trough
        vec4 trail(float A, float P, float ph, float amp, float stp, float gate, float px){
          float c = (amp * sin(A * .043 + ph) + amp * .4 * sin(A * .117 + ph * 2.3)) * gate + (fract(ph * 3.7) - .5) * 5.;
          float q = P - c, i = floor(A / stp), fa = (fract(A / stp) - .5) * stp;
          float sd = mod(i, 2.) * 2. - 1.;
          vec2 d = vec2(fa, q - sd * .24); float r = length(d);
          float dim = (1. - smoothstep(.12, .3, r)) * (1. - smoothstep(.1, .28, px));
          float line = (1. - smoothstep(.3, .7 + px * 1.5, abs(q))) * (1. - smoothstep(.9, 2.6, px));
          return vec4(d / max(r, .05) * dim * smoothstep(.05, .2, r), dim, line);
        }
        // one size of loose stone: xyz = lit colour, w = how much of this pixel the stone covers
        vec4 stoneLayer(vec2 sp, float fq, float px, vec3 Lw, float keep){
          vec4 s = stones(sp * fq); float id = s.w, w = px * fq;
          float g = .03 + .2 * fract(id * 5.3), m = smoothstep(g - w, g + .05 + w, s.z) * step(1. - keep, fract(id * 3.7)) * (1. - smoothstep(.25, .6, w));
          float bev = smoothstep(g, g + .16, s.z);                                             // flat top, bevelled edge
          vec3 n = normalize(vec3(s.x * (1. - bev) * 2.4 + (fract(id * 17.) - .5) * .8, 1., s.y * (1. - bev) * 2.4 + (fract(id * 29.) - .5) * .8));
          vec3 tone = mix(vec3(.075, .105, .088), vec3(.38, .44, .36), id * id);
          tone = mix(tone, vec3(.5, .54, .42), step(.62, id) * step(id, .7) * .8);              // pale lichen crust
          tone = mix(tone, vec3(.34, .15, .06), step(.88, id) * .85);                         // rust lichen
          tone = mix(tone, vec3(.4, .33, .11), step(id, .06) * .8);                           // ochre lichen
          return vec4(tone * (.26 + 1.3 * max(dot(n, Lw), 0.) + .22 * n.y) * (.55 + .45 * bev), m);
        }
        void main(){
          vec3 N = vN * inversesqrt(max(dot(vN, vN), 1e-8));
          vec3 toCam = cameraPosition - vW; float dist = max(length(toCam), 1e-3); vec3 V = toCam / dist;
          float px = max(length(fwidth(vW)), 1e-3), ao = vD.y;
          vec3 dWx = dFdx(vW), dWy = dFdy(vW); float pxs = sqrt(max(min(length(dWx), length(dWy)), 1e-3) * px);   // for ground seen at a glancing angle
          vec3 q = vW * vec3(1., .6, 1.);
          vec3 wq = q + 28. * vec3(jn(q / 95. + 4.), jn(q / 95. + 19.), jn(q / 95. + 31.));
          float f1 = 1. - smoothstep(18., 36., px), f2 = 1. - smoothstep(4., 8., px), f3 = 1. - smoothstep(.5, 1., px), f4 = 1. - smoothstep(.05, .12, px);
          float n1 = jn(wq / 72.), n2 = jn(wq / 17. + 7.3), n3 = jn(wq / vec3(2.6, 8., 2.6) + 3.1), n4 = jn(vW * vec3(2.3, 1.1, 2.3));
          float vein = smoothstep(.56, .86, n1) * f1 * .7 + smoothstep(.62, .9, n2) * f2 * .4 + (1. - smoothstep(0., .05, abs(n2 - .47))) * f2 * .2 * smoothstep(.45, .7, n1) + (1. - smoothstep(0., .06, abs(n3 - .5))) * f3 * .22 * smoothstep(.4, .7, n2);
          float moss = smoothstep(.56, .8, jn(wq / 40. + 11.)) * f1 + smoothstep(.62, .85, n3) * f3 * .5;
          // carved blades (pinnacles, flakes, gendarmes) carry -(place across the face) in aD.w: 0 mid-face .. 1 on an arete
          float ar = max(-vD.w, 0.), bit = step(.005, ar);
          // strata: beds a few metres thick standing nearly on end, and broad tonal bands behind them (walls only)
          float fS = 1. - smoothstep(1.2, 3., px);
          float bed = jn(vec3(wq.x / 5.5, wq.y / 46., wq.z / 5.5) + 7.7), bed2 = jn(vec3(wq.x / 19., wq.y / 140., wq.z / 19.) + 2.2);
          float strata = ((bed - .5) * fS + (bed2 - .5) * f2 * 1.2) * (1. - bit);
          float tool = cos(dot(vW, vec3(5.1, 1.3, 3.7)) + 2.5 * jn(vW * .5));
          float k = 1. + .3 * ((n1 * 2. - 1.) * f1 * .7 + (n2 * 2. - 1.) * f2 * .5) + .55 * moss - .32 * vein + .9 * strata;
          k = max(mix(k, 1. + 1.15 * moss - .8 * vein + tool * .1 * f4, bit), .14);
          // THE COL'S WEST SLOPE (and the far side of the saddle): snow-plastered carved stone. Which facets hold snow is settled
          // further down, facet by facet in the stone's own world-space cells, so snow and stone meet along crisp cut edges
          // and nothing is drawn out along the fall line.
          float westK = step(690., vS.x) * smoothstep(52., 66., -vS.y);
          float snowV = vD.z, Ny0 = N.y;
          // facets: two sizes, each fading to its mean before its bevel is under two pixels. Every facet has its own tilt (so the
          // waxy highlight and the fill break into planes), a little more or less stone behind it, and a narrow bevel round its
          // edge that leans outward: the bevels that face the light carry a thin bright line, the others lie in shade.
          // (no cobbles on a steep face or on the crag under the herd's terrace: bare chiselled stone there, no stretched mosaic)
          float scrK = vD.w * smoothstep(.7, .84, N.y) * (1. - smoothstep(455., 460., vS.x) * (1. - smoothstep(514., 523., vS.x)) * smoothstep(5.6, 6.8, vS.y) * (1. - smoothstep(10., 11.5, vS.y)));
          scrK *= 1. - smoothstep(552., 584., vS.x) * (1. - smoothstep(704., 736., vS.x)) * smoothstep(3.3, 4.1, vS.y) * (1. - smoothstep(6.9, 7.8, vS.y));   // nor on the bank under the hunt's snow tongue
          float cov = clamp(max(scrK, max(snowV * 1.4 * (1. - westK), vE.y)), 0., 1.);
          float fw = (1. - smoothstep(.45, .9, cov)) * (1. - .5 * bit);
          float fA0 = 1. - smoothstep(1., 2.2, px), fA = fA0 * fw, fB = (1. - smoothstep(.26, .6, px)) * fw, fC = (1. - smoothstep(3.6, 8., px)) * fw * (1. - bit), eF = 0., crease = 0.; vec3 tiltF = vec3(0.);
          vec3 Lr = normalize(uLamp * (.25 + .75 * vE.z) + vec3(0., .8, 0.));
          vec3 fpc = vW + 7. * (vec3(jn(vW * .033 + 5.), jn(vW * .033 + 17.), jn(vW * .033 + 29.)) - .5);
          vec3 fp = vW + 1.8 * (vec3(jn(vW * .13 + 5.), jn(vW * .13 + 17.), jn(vW * .13 + 29.)) - .5);
          if (westK > .001) {
            vec3 cw = cell2(fp / vec3(6.5, 12., 6.5) + 3.3), cb = cell2(fpc / vec3(24., 44., 24.) + 7.1);
            float amt = clamp(vD.z * 1.05 + (Ny0 - .62) * .9, 0., .95);
            float e1 = .5 + .5 * smoothstep(0., max(.1, 2. * px / 6.5), cw.x), e2 = .5 + .5 * smoothstep(0., max(.06, 2. * px / 24.), cb.x);
            float s1 = mix(step(1. - amt, cw.z), step(1. - amt, cw.y), e1);                  // a facet holds snow, or is swept bare
            float bare = mix(step(cb.z, .34), step(cb.y, .34), e2), full = mix(step(.8, cb.z), step(.8, cb.y), e2);   // whole planes bare, whole planes drifted
            float sW = mix(amt, max(s1 * (1. - bare), full * step(.3, amt)), fA0) * step(.04, vD.z);
            snowV = mix(snowV, sW, westK);
          }
          if (fC > .01) {                                       // the big planes (24 x 44 m): what a wall shows from hundreds of metres
            vec3 dC;
            vec4 FC = facet(fpc / vec3(24., 44., 24.) + 7.1, dC); float wC = max(.07, 2.4 * px / 24.), bC = (1. - smoothstep(0., wC, FC.x)) * fC;
            dC = normalize(dC * vec3(1., .55, 1.));
            tiltF = (FC.yzw - .5) * vec3(1., .45, 1.) * (.5 * fC) + dC * (bC * .7);
            eF = bC * bC * max(dot(dC, Lr), 0.) * .8; crease = bC * bC * max(-dot(dC, Lr), 0.) * .8;
            k *= mix(1., .7 + .7 * FC.y, .8 * fC);
          }
          if (fA > .01) {
            vec3 dA, dB;
            vec4 FA = facet(fp / vec3(6.5, 12., 6.5) + 3.3, dA); float wA = max(.11, 2.4 * px / 6.5), bA = (1. - smoothstep(0., wA, FA.x)) * fA;
            dA = normalize(dA * vec3(1., .54, 1.));
            tiltF += (FA.yzw - .5) * vec3(1., .45, 1.) * (.45 * fA) + dA * (bA * .8);
            eF = max(eF, bA * bA * max(dot(dA, Lr), 0.)); crease = max(crease, bA * bA * max(-dot(dA, Lr), 0.));
            k *= mix(1., .74 + .6 * FA.y, .8 * fA);
            if (fB > .01) {
              vec4 FB = facet(fp / vec3(1.7, 3.2, 1.7) + 11.7, dB); float wB = max(.13, 2.4 * px / 1.7), bB = (1. - smoothstep(0., wB, FB.x)) * fB;
              dB = normalize(dB * vec3(1., .54, 1.));
              tiltF += (FB.yzw - .5) * vec3(1., .45, 1.) * (.28 * fB) + dB * (bB * .5);
              eF = max(eF, bB * bB * max(dot(dB, Lr), 0.) * .6); crease = max(crease, bB * bB * max(-dot(dB, Lr), 0.) * .6);
              k *= mix(1., .86 + .28 * FB.z, fB);
              float fD = (1. - smoothstep(.07, .18, px)) * fw;
              if (fD > .01) {                                   // chisel cuts half a metre across, for stone a few metres from the lens
                vec3 dD; vec4 FD = facet(fp / vec3(.5, .9, .5) + 5.3, dD); float wD = max(.14, 2.4 * px / .5), bD = (1. - smoothstep(0., wD, FD.x)) * fD;
                dD = normalize(dD * vec3(1., .55, 1.));
                tiltF += (FD.yzw - .5) * vec3(1., .45, 1.) * (.22 * fD) + dD * (bD * .4);
                eF = max(eF, bD * bD * max(dot(dD, Lr), 0.) * .45); crease = max(crease, bD * bD * max(-dot(dD, Lr), 0.) * .45);
                k *= mix(1., .9 + .2 * FD.z, fD);
              }
            }
          }
          k += .9 * (1. - smoothstep(0., .035, abs(jn(wq / 6.5 + 13.) - .5))) * f2 * fw;       // dark veins: thin seams of thicker stone
          vec3 Nb = N + vec3(.6, 0., -.8) * (tool * .06 * f4) + vec3(n4 - .5, 0., jn(vW * 2.1 + 9.) - .5) * (.35 * f4) + tiltF;
          N = Nb * inversesqrt(max(dot(Nb, Nb), 1e-8));
          // the ladder for near stone is far steeper than the Lit Wall's: a gorge wall is black-green mass, and only
          // what is a few metres thick toward the sun (flakes, fins, ledge lips, the arch's cut edges) glows
          float L = vD.x * k;
          float aw = fwidth(ar) * 1.5, edge = smoothstep(.87 - aw, .985, ar) * bit;      // the arete: a thin line, never under a pixel and a half
          L = mix(L, min(L, 1.3), edge);
          vec3 T = mix(uPale * 1.05, uApple * .8, smoothstep(1.2, 8., L));
          T = mix(T, uDeep * .36, smoothstep(7., 30., L));
          T = mix(T, uDark * .2, smoothstep(26., 95., L));
          float c = dot(-V, uSun), fwd = clamp(c * .5 + .5, 0., 1.), phase = .35 + .65 * fwd * fwd * fwd;
          float nds = dot(N, uSun), back = 1. - smoothstep(-.25, .35, nds);
          float shut = 1. - vE.w;                              // rock (its own or a wall across the gorge) between here and the sun
          vec3 col = min(uSunCol * T * phase * .7, vec3(1.25)) * mix(shut, 1., back) * mix(1., ao, .5);
          // bare to the sun: plain dark waxy stone, never pale
          col += mix(uDark * 2.4, uDeep * .62, .3 + .4 * n2 * f2) * uSunCol * max(nds, 0.) * (1. - shut) * .42 * ao * (1. + 1.3 * strata);
          float hemi = N.y * .5 + .5, lam = max(dot(N, uLamp), 0.) * vE.z;
          col += (uDark * (1.4 + 2. * hemi) * (1. + .9 * vein) * (1. + 1.1 * strata) * uFloor + uSkyCol * .045 * hemi * hemi) * mix(1., ao, .8);
          col += uDeep * (.45 + .5 * vein) * uLampCol * lam * (.2 + .06 * bit) * ao;
          col += uApple * vein * (.035 + .1 * bit * phase) * (.4 + .6 * ao);   // cloudy inclusions hanging inside the stone
          // the Gate Horn's crest (its vertices carry aS.x = -5000 and the glow in aS.w): the light burns through the thin stone
          col += min(uSunCol * mix(uApple, uPale, .8) * (step(vS.x, -4000.) * vS.w * 1.3), vec3(1.45));
          // one broad waxy highlight from the sky
          vec3 Ls = normalize(uLamp * vE.z + vec3(0., 1., 0.)), Hh = Ls + V; Hh *= inversesqrt(max(dot(Hh, Hh), 1e-6));
          float nh = max(dot(N, Hh), 0.), nh2 = nh * nh, nh8 = nh2 * nh2 * nh2 * nh2;
          float fres = .05 + .95 * pow(clamp(1. - max(dot(N, V), 0.), 0., 1.), 4.);
          float gl = mix(.1, 1., vE.z);                        // the gorge sees a slot of sky: a faint broad matt sheen, no glint
          col += uSkyCol * (nh8 * nh8 * .4 * gl + nh2 * nh2 * .07 + fres * .1 * hemi * gl) * ao;
          col += uSunCol * T * pow(clamp(1. - max(dot(N, V), 0.), 0., 1.), 3.) * smoothstep(-.2, .5, c) * .5 * mix(shut, 1., back);   // thin edges glow along the rim
          // every edge between two facets is thin stone: it catches a rim of the backlight (most where we look toward the sun and
          // where the place is open to the Lit Wall), and the cut beside it lies in shade; a wet sheen where a facet mirrors the sky
          col *= 1. - .34 * crease;
          col += uSunCol * mix(uApple, uPale, .35) * eF * (.035 + .3 * fwd * fwd * fwd) * mix(.3, 1., vE.z) * mix(.5, 1., ao);
          col += (uSkyCol * 1.6 + uLampCol * .5 * vE.z) * nh8 * nh8 * nh8 * nh8 * nh8 * nh8 * .55 * gl * ao * fA;

          // ---- cover: matt things lit by the sky from above and the wall from the side
          vec3 amb = uSkyCol * (.55 + .9 * hemi) + uLampCol * (.09 + 1.25 * lam);
          vec3 ambS = mix(amb, vec3(dot(amb, vec3(.3, .5, .2))), .62); amb = mix(amb, vec3(dot(amb, vec3(.3, .5, .2))), .5);
          float cob = .5;
          if (scrK > .01) {
            // scree: cobbles lying apart on smaller stones on gravel; each a crisp angular cell with its own tilt, lit from the wall
            vec2 sp = vW.xz + vW.y * vec2(.31, .23);
            vec3 Lw2 = normalize(uLamp * (.35 + .65 * vE.z) + vec3(0., .55, 0.));
            vec4 a1 = stoneLayer(sp + 3.1, 1.25, pxs, Lw2, .62), a2 = stoneLayer(sp + 7.3, 3.7, pxs, Lw2, .8), a3 = stoneLayer(sp, 10.5, pxs, Lw2, .9);
            vec3 alb = vec3(.05, .066, .055) * (.7 + .6 * n4);                                 // grit between the stones
            alb = mix(alb, a3.xyz, a3.w); alb = mix(alb, a2.xyz * (.9 + .2 * n4), a2.w); alb = mix(alb, a1.xyz * (.85 + .3 * n4), a1.w);
            cob = max(a1.w, a2.w * .7);
            col = mix(col, alb * amb * ao * 1.6, scrK * .96);
          }
          // the herd's terrace: a pale slab crusted with lichen, short dry sedge gold-green in its joints, lit by the wall
          float terK = smoothstep(455., 460., vS.x) * (1. - smoothstep(514., 523., vS.x)) * smoothstep(8.6, 10.2, vS.y) * (1. - smoothstep(mix(29., 24., smoothstep(490., 510., vS.x)), mix(34., 28., smoothstep(490., 510., vS.x)), vS.y)) * smoothstep(.7, .88, N.y);
          if (terK > .01) {
            float turf = smoothstep(.4, .62, jn(vec3(vW.xz * .8, 3.)) * .6 + n4 * .4), fleck = jn(vec3(vW.xz * 7., 1.));
            vec3 alb = mix(vec3(.3, .36, .27), vec3(.47, .41, .16), turf) * (.78 + .44 * mix(.5, fleck, f4));
            alb = mix(alb, vec3(.5, .2, .08), smoothstep(.72, .8, jn(vec3(vW.xz * .45 + 9., 7.))) * .6);
            col = mix(col, alb * amb * ao * 1.45, terK);
          }
          float rd = smoothstep(.4, .6, vE.y + (n2 - .5) * .6 + (n4 - .5) * .3 * f3) * (1. - terK);
          if (rd > .01) {
            vec3 alb = mix(uRind * .2, uRind * .62, n4 * .6 + jn(vW * .37) * .4);
            alb = mix(alb, uAccent, smoothstep(.7, .8, jn(vW * 1.3 + 7.)) * f3 * .8);
            col = mix(col, alb * amb * ao * 1.35, rd);
          }
          float sw = .05 + min(px * .12, .1);
          float sn = smoothstep(.5 - sw, .5 + sw, snowV + (n2 - .5) * .34 * f2 + (n4 - .5) * .3 * f3 + (.5 - cob) * .26 * f3 * smoothstep(0., .25, scrK));
            // wind-carved snow: on level snow sastrugi are terraces drawn out along the wind (2:1, they lead the eye to the arch),
            // each ending in a sharp step that is bump-lit from the wall and carries a thin line of shade at its foot; on steep
            // banks, where anything drawn out smears, only small even scallops show
          vec2 wd = normalize(uWind.xz + vec2(1e-4, 0.));
          float al = dot(vW.xz, wd), ac = dot(vW.xz, vec2(-wd.y, wd.x));
          float bank = smoothstep(.6, .84, N.y);
          // drift waves lying ACROSS the wind, as ripples lie in sand: the phase runs along the wind, warped so the crest lines waver,
          // fork and join; each wave a long gentle back (0 in the trough .. 1 on the crest line) and a short steep lee face
          float w0 = jn(vec3(ac * .11, al * .06, 9.)), wv = jn(vec3(ac * .19, al * .09, 3.)), wf = jn(vec3(ac * .6 + 4., al * .3, 5.));
          // (each pattern gives way to its mean where its phase runs more than a third of a turn per pixel: at a glancing angle it
          // would break into blocks)
          float ph1 = al / 3.6 + wv * 2.8 + wf * .5, fph = fwidth(ph1), kph = 1. - smoothstep(.05, .17, fph);
          float kw = (1. - smoothstep(.3, .9, px)) * bank * kph, pw = min(max(px * .6, fph * 1.7), .2), kb = (1. - smoothstep(.1, .34, px)) * kph;
          float f1s = fract(ph1), t1 = mix(.5, min(f1s / .78, (1. - f1s) / .22), kw);
          // and the small sharp-nosed sastrugi cut into their backs (even scallops on a steep bank)
          float w2 = mix(jn(vec3(ac * 1.1 + w0 * 2., al * 1.1, 5.)), jn(vec3(ac * 1.3 + wv * 2.6, al * .85 + w0 * 3., 7.)), bank), w3 = jn(vec3(ac * 4.2 + w2 * 1.7, al * 2.9, 11.));
          float fw2 = fwidth(w2), fw3 = fwidth(w3), k2 = 1. - smoothstep(.1, .3, fw2), k3 = 1. - smoothstep(.1, .3, fw3);
          float e2 = max(px * 5., fw2 * 2.), e3 = max(px * 9., fw3 * 1.6);          // (no edge thinner than four pixels: a thin near-level line would break into steps)
          float t2 = mix(.5, smoothstep(.5 - e2, .54 + e2, w2), k2), t3 = mix(.5, smoothstep(.5 - e3, .58 + e3, w3), k3);
          float hS = mix(.5, t1, kb) * .62 + t2 * .24 * mix(.45, 1., kb) + t3 * .1 * f4 + w0 * .1 + w2 * .06 * f3;
          float lee = smoothstep(.775 - pw, .81 + pw, f1s) * (1. - smoothstep(.9 - pw, 1., f1s)) * kw * 1.25 * (1. - smoothstep(.2, .7, px) * .5) + t2 * (1. - t2) * 2. * f3;         // the lee face of each wave, the foot of each step
          vec3 dpx = dWx, dpy = dWy; float dhx = dFdx(hS), dhy = dFdy(hS);
          // on the col: the long shadows the avenue's blades throw across the snow, away from the Lit Wall (green, the light
          // having come through them), and the trails the blue sheep have trodden to the gate
          float shB = 0.; vec4 trk = vec4(0.);
          if (vS.x > 640.) {
            vec2 sd = uGate.xy, sp2 = vec2(-uGate.y, uGate.x);
            for (int i = 0; i < 20; i++) {
              vec4 b = uBl[i]; vec2 d = vW.xz - b.xy; float t = dot(d, sd) / max(b.z * uGate.z, 1.), soft = .1 + .8 * t;
              shB = max(shB, (1. - smoothstep(b.w * (1. - .8 * t) + .15 - soft * .5, b.w * (1. - .8 * t) + .15 + soft, abs(dot(d, sp2)))) * smoothstep(-.02, .02, t) * (1. - smoothstep(.8, 1., t)) * (1. - .3 * t));
            }
            float gk = 1. - smoothstep(${(A_END - 50).toFixed(1)}, ${(A_END - 8).toFixed(1)}, vS.x);
            trk = (trail(vS.x, vS.y, 1.3, 4.4, 1.05, gk, px) + trail(vS.x, vS.y, 4.1, 5.4, 1.2, gk, px) + trail(vS.x, vS.y, 2.6, 3., 1.7, gk, px)) * smoothstep(664., 692., vS.x) * (1. - smoothstep(${(A_END + 4).toFixed(1)}, ${(A_END + 12).toFixed(1)}, vS.x));
          }
          if (sn > .01) {
            vec3 r1 = cross(dpy, vN), r2 = cross(vN, dpx); float det = dot(dpx, r1);
            vec3 grad = (r1 * dhx + r2 * dhy) * (sign(det) / max(abs(det), 1e-7)) * length(vN);
            float gl = length(grad); grad *= min(1., 2.2 / max(gl, 1e-4));
            vec3 Ns = N - grad * mix(.3, .55, bank) * mix(.5, 1., kb); Ns *= inversesqrt(max(dot(Ns, Ns), 1e-8));
            vec3 Lw = normalize(uLamp + vec3(0., .15, 0.));
            float lit = smoothstep(-.05, .55, dot(Ns, Lw)), up2 = Ns.y * .5 + .5;
            vec3 sc = uSnowCol * (uSkyCol * (.8 + 1.1 * up2) + (uLampCol * lit * .9 * mix(.3, 1., vE.z) + uLampCol * .1) * (1. - .92 * shB) + uApple * uLampCol * .34 * shB);
            sc = mix(sc, vec3(dot(sc, vec3(.3, .5, .2))), .35) * mix(.72, 1., ao);
            sc *= .76 + .2 * t1 + .09 * t2 + .1 * w0;                                        // wind-packed crests paler than the scoured troughs
            sc = mix(sc, sc * vec3(.74, .93, 1.06), (1. - t1) * .5);
            sc = mix(sc, sc * vec3(.6, .79, .98), min(lee, 1.) * .7);                         // lee faces in blue shade: crisp lines across the wind
            // spindrift snakes crossing the snow (short puffs: nothing drawn out along the line of sight)
            float snake = smoothstep(.45, .78, jn(vec3(ac * .22, al * .16 - uTime * .9, 1.7))) * jn(vec3(ac * .9, al * .55 - uTime * 2.6, 4.)) * smoothstep(.35, .7, jn(vec3(vW.xz * .03 - uTime * .12, 8.)));
            sc += uSnowCol * (uSkyCol + uLampCol * .8) * snake * (.5 + .9 * uGale) * f2;
            // the trodden trail: a shallow trough, a print every stride, each with its far wall lit by the Lit Wall
            vec2 lap = vec2(dot(uLamp.xz, uAxS.zw), dot(uLamp.xz, vec2(-uAxS.w, uAxS.z)));
            sc *= mix(vec3(1.), vec3(.4, .74, .6), shB);
            sc *= 1. - .3 * min(trk.w, 1.) - .3 * min(trk.z, 1.);
            sc += uSnowCol * uLampCol * (.36 * max(-dot(trk.xy, lap), 0.) - .2 * max(dot(trk.xy, lap), 0.));
            col = mix(col, max(sc, 0.), sn);
          }
          col *= mix(vec3(1.), vec3(.5, .78, .64), shB * (1. - sn));
          // ---- water, drawn on the ground it lies on: the braided outflow, then the tarn
          if (vS.z > .002) {
            float A = vS.x, qd = vS.y - vS.w, B = smoothstep(212., 240., A) * (1. - smoothstep(330., 368., A));
            float d1 = abs(qd - B * 5. * sin(A * .052 + 1.)) - (1.5 + .5 * sin(A * .11));
            float d2 = abs(qd - B * (1.5 - 4.4 * sin(A * .047 + 2.6))) - (1.05 + .4 * sin(A * .17 + 1.));
            float d3 = abs(qd - B * (7.5 * sin(A * .031 + 4.2) - 1.)) - (.85 + .3 * sin(A * .21 + 2.));
            float d = min(d1, min(d2, d3)) + (n4 - .5) * .7 * f3 + (n2 - .5) * .8 * f2;
            float wpx = px * 1.2, water = (1. - smoothstep(-wpx, wpx, d)) * vS.z;
            col *= 1. - .5 * (1. - smoothstep(0., 1.6, d)) * vS.z;                              // wet gravel along the channels
            // glacier milk: pale jade pools with slow flow lines in them, white water only where the bed steepens into a riffle
            float kf = 1. - smoothstep(.5, 1.8, px), kn = 1. - smoothstep(.12, .5, px);
            float rif = smoothstep(.48, .68, jn(vec3(A * .11, floor(qd * .2 + 9.), 7.))), fl = jn(vec3(A * .3 + uTime * 1.3, qd * 3.4, 2.));
            float fo = smoothstep(.5, .78, jn(vec3(A * .8 + uTime * 3.4, qd * 4.5, 4.)) * .65 + jn(vec3(A * 2.3 + uTime * 5., qd * 9., 6.)) * .35 * kn + .18 * rif);
            float white = clamp(mix(.1 + .2 * rif, fo * (.22 + .78 * rif), kf) + smoothstep(-.45, -.05, d) * .3, 0., 1.);
            vec3 pool = vec3(.15, .4, .33) * (uSkyCol * 1.5 + uLampCol * .8) * (.82 + .36 * mix(.5, fl, kf));
            vec3 wcol = mix(pool, uSkyCol * 2.4 + uLampCol * .9, white);
            col = mix(col, wcol * mix(1., ao, .5), water);
          }
          float Tn = -9.;
          if (vS.x > 356. && vS.x < 480.) {
            float A = vS.x, P = vS.y, da = (A - 414.) / (A > 414. ? 38. : 48.), dp = (P - 6. - 5. * sin(A * .045 + 1.)) / (30. * (1. + .16 * sin(A * .13 + 2.))), ia = A - 437., ip = P - 14.;
            Tn = 1. - da * da - dp * dp + .13 * sin(A * .21 + P * .17) + .08 * sin(P * .45 - A * .11 + 1.7) - 1.5 * exp(-(ia * ia + ip * ip) / 13.);
          }
          if (Tn > -.3) {
            float eT = Tn + (n4 - .5) * .035 * f3, wat = smoothstep(-px * .07, px * .07, eT), deep = smoothstep(0., .5, Tn);
            col *= 1. - .45 * smoothstep(-.3, -.02, Tn);                                        // the wet beach
            col = mix(col, uPale * amb * .55, (1. - smoothstep(0., .02 + px * .07, abs(eT + .012))) * .5);   // a pale line of silt at the water's edge
            // ripples, and cat's-paws of wind crossing the water
            vec2 rp = vW.xz * .5 + uWind.xz * uTime * .7;
            float gust = smoothstep(.42, .8, jn(vec3(vW.xz * .07 - uWind.xz * uTime * .4, 4.)));
            vec2 rn = (vec2(jn(vec3(rp, uTime * .3)), jn(vec3(rp + 31., uTime * .3))) - .5) * (.03 + .1 * gust) * (1. - smoothstep(.4, 2.5, px))
                    + (vec2(jn(vec3(rp * 3.3 + 7., uTime * .7)), jn(vec3(rp * 3.3 + 19., uTime * .7))) - .5) * (.02 + .06 * gust) * f3;
            vec3 Nw = normalize(vec3(rn.x, 1., rn.y)), R = reflect(-V, Nw); R.y = abs(R.y);
            // the mirror is drawn tall (the reflected ray steepened), so the whole Lit Wall stands in the tarn from where we fly
            vec3 Rm = normalize(vec3(R.x, R.y * 3. + .015, R.z));
            vec3 refl = mix(mix(uHor, uMid, smoothstep(-.01, .2, Rm.y)), uZen, smoothstep(.16, .8, Rm.y));
            float den = -dot(Rm, uWallN);
            if (den > .03) {
              vec3 Hp = vW + Rm * (dot(vW - uWallC, uWallN) / den);
              float sx = dot(Hp - uWallC, uWallT), cr = (sx - uCrestS.x) / uCrestS.y, cs = clamp(cr, 0., 23.999); int ci = int(cs);
              float cy = mix(uCrest[ci], uCrest[ci + 1], cs - float(ci)), fh = (Hp.y - uCloudY) / max(cy - uCloudY, 1.);
              float flute = .5 + .5 * sin(sx * .05 + 4. * jn(vec3(sx * .004, fh * 2., 1.)));
              vec3 wc = mix(uDark * 1.5, uDeep * .5, smoothstep(.04, .36, fh));
              wc = mix(wc, uApple * (uLampCol + .25) * 1.05, smoothstep(.3, .58, fh));
              wc = mix(wc * (.72 + .28 * flute), uPale * (uLampCol * .8 + .32) * (.7 + .3 * flute), smoothstep(.74, .95, fh));
              refl = mix(refl, wc, (1. - smoothstep(.97, 1.02, fh)) * smoothstep(-.02, .02, fh) * smoothstep(-.3, .3, cr) * (1. - smoothstep(23.7, 24.3, cr)));
            }
            float sg = max(dot(Rm, uSun), 0.), sg4 = sg * sg * sg * sg, sg16 = sg4 * sg4 * sg4 * sg4;
            refl += uSunCol * (sg16 * sg16 * sg16 * .5 + sg16 * .1);                             // the hidden sun's bloom, a glitter in the water
            float frW = mix(.6, 1., pow(1. - clamp(dot(V, Nw), 0., 1.), 2.));
            vec3 body = mix(vec3(.2, .46, .35), vec3(.025, .12, .095), deep) * (uSkyCol * 1.4 + uLampCol * .75);   // milky jade in the shallows, deep jade further out
            vec3 wc2 = mix(body, refl, frW * mix(.45, 1., deep)) + (uSkyCol * .5 + uLampCol * .2) * gust * .1;
            col = mix(col, wc2, wat);
          }
          // cloud laps round the foot of every blade that stands in the sea: the sink into it is taller and it moves
          vec3 wa = vW; wa.y -= bit * (5.5 + 5. * jn(vec3(vW.xz / 7., uTime * .22)));
          gl_FragColor = vec4(max(atmos(col * veil(vW), wa, dist, vE.x), 0.), 1.);
        }`,
    });
    const terrain = new THREE.Mesh(tGeo, jadeMat); terrain.name = 'land'; scene.add(terrain);
    await ctx.yield();

    // ---------------------------------------------------------------- more jade: pinnacles, gendarmes, far ranges (one merged mesh)
    let jP = [], jD = [], jE = [], jI = [];
    const sinkMain = [jP, jD, jE, jI], sinkGorge = [[], [], [], []], sinkGate = [[], [], [], []], useSink = (k) => { [jP, jD, jE, jI] = k; };
    // a carved blade: nf flat hollow-ground faces meeting at thin aretes (vertices are split there, and aD.w carries
    // -(the place across the face) so the fragment shader draws each arete as a thin white-celadon line whatever the
    // mesh), a chisel tip set off the axis, and undercut ledges: a groove cut part of the way round under an overhanging
    // lip (the groove is thick dark stone, the lip a few metres thin, so it glows; snow lies on its top).
    const FS = [[0, 0.5, 1], [0, 0.16, 0.5, 0.84, 1], [0, 0.08, 0.24, 0.5, 0.76, 0.92, 1]];
    const spire = (x, y0, z, hgt, r0, fine, rings, basin, lean, o = {}) => {
      const R = o.rng || rng, fs = FS[fine], cols = fs.length, nf = o.nf ?? R.int(3, 5), base = jP.length / 3, sd = R.range(0, 100), la = o.la ?? R.range(0, 6.28), sq = o.sq ?? R.range(0.5, 0.8);
      const qa = o.qa ?? R.range(0, 3.14), cq = Math.cos(qa), sn = Math.sin(qa), tw = o.tw ?? R.range(-0.4, 0.4), nL = o.ledges ?? 2, snowK = o.snow ?? 0.7, hollow = o.hollow ?? 0.14, thick0 = o.thick ?? 58;
      const kf = [], kt = []; for (let k = 0; k < nf; k++) { kf.push(R.range(0.74, 1.2)); kt.push(R.range(0.55, 1.6)); }
      const chA = R.range(0, 6.28), chR = (o.chisel ?? 0.34) * r0, shoulder = o.shoulder ?? R.range(0.62, 0.76), waist = o.waist ?? R.range(0.5, 0.64), lLo = o.ledgeLo ?? 0.1;
      // rows: [t, kind, ledge]  kind 0 plain, 1 groove, 2 under the lip, 3 the lip, 4 the shelf on top of it
      const rows = [], led = []; for (let r = 0; r <= rings; r++) rows.push([r / rings, 0, -1]);
      for (let k = 0; k < nL; k++) { const tk = lerp(lLo, shoulder * 1.04, (k + 0.5 + R.range(-0.22, 0.22)) / nL), g = R.range(0.02, 0.032) * (o.groove ?? 1); led.push(R.range(0, 6.28)); rows.push([tk - g * 1.7, 0, -1], [tk - g, 1, k], [tk - 0.004, 2, k], [tk, 3, k], [tk + 0.012, 4, k], [tk + g, 0, -1]); }
      rows.sort((a, b) => a[0] - b[0]);
      const NR = rows.length, sides = nf * cols;
      for (let r = 0; r < NR; r++) {
        const t = clamp(rows[r][0], 0, 1), kind = rows[r][1], li = rows[r][2], last = r === NR - 1;
        const prof = t < shoulder ? lerp(1, waist, Math.pow(t / shoulder, 0.8)) : waist * (1 - Math.pow((t - shoulder) / (1 - shoulder), 1.35));
        const rr0 = r0 * (prof * (0.9 + 0.1 * Math.cos(t * 7 + sd)) + 0.008), y = y0 + hgt * t, tipK = smoothstep(shoulder, 1, t), offL = lean * hgt * t * t;
        const cx = x + Math.cos(la) * offL + Math.cos(chA) * chR * tipK, cz = z + Math.sin(la) * offL + Math.sin(chA) * chR * tipK;
        const thT = o.grade ? o.grade[1] + o.grade[0] * Math.pow(1 - t, 2.2) : lerp(thick0, 8, smoothstep(0.74, 1, t));
        for (let s = 0; s < sides; s++) {
          const k0 = Math.floor(s / cols), f = fs[s % cols], an = ((k0 + f) / nf) * 6.2832 + tw * t, c = Math.abs(f - 0.5) * 2;     // c: 1 on an arete, 0 mid-face
          const poly = Math.cos(Math.PI / nf) / Math.cos((f - 0.5) * 2 * Math.PI / nf) * lerp(kf[k0], kf[(k0 + 1) % nf], f) * (1 - hollow * (1 - c * c));
          let lk = 1, mk = 0;
          if (li >= 0) { mk = o.ring ? 1 : smoothstep(-0.35, 0.3, Math.cos(an - led[li])); lk = kind === 1 ? 1 - 0.13 * mk : kind === 2 ? 1 - 0.17 * mk : kind === 3 ? 1 + 0.06 * mk : 1 + 0.01 * mk; }
          const rad = last ? 0.04 : rr0 * poly * lk * (1 + 0.05 * noise.n3(Math.cos(an) * 1.3 + sd, t * 4.2, Math.sin(an) * 1.3));
          const ex = Math.cos(an) * rad, ez = Math.sin(an) * rad * sq;
          jP.push(cx + ex * cq - ez * sn, y, cz + ex * sn + ez * cq);
          let th = 1.4 + thT * lerp(kt[k0], kt[(k0 + 1) % nf], f) * (1 - c * c * c), ao = (0.55 + 0.45 * smoothstep(0, 0.4, t)) * (0.78 + 0.22 * c), snow = t > 0.95 ? 0.75 * snowK : 0;
          if (kind === 1 || kind === 2) { th = lerp(th, Math.max(th, 40), mk); ao *= 1 - 0.4 * mk; }
          else if (kind === 3) th = lerp(th, Math.min(th, 3), mk);
          else if (kind === 4) { th = lerp(th, Math.min(th, 9), mk); snow = Math.max(snow, snowK * 0.98 * smoothstep(0.3, 0.7, mk) * (o.shelf ?? 1)); }
          jD.push(th, ao, snow, -(0.02 + 0.98 * c * (o.grade ? lerp(0.66, 1, smoothstep(0.3, 0.8, t)) : 1))); jE.push(basin, 0, o.lamp ?? 1, Math.exp(-th / 5));
        }
      }
      for (let r = 0; r < NR - 1; r++) for (let s = 0; s < sides; s++) { if (s % cols === cols - 1) continue; const a = base + r * sides + s, b = a + 1, c = a + sides, d = b + sides; jI.push(a, c, b, b, c, d); }
    };
    // secondary blades crowding the foot of a big one
    const satellites = (x, y0, z, hgt, r0, n, basin, away, o = {}, sub = 0) => {
      const R = o.rng || rng;
      for (let i = 0; i < n; i++) {
        const an = away === null ? R.range(0, 6.28) : away + R.range(-1.1, 1.1), d = r0 * R.range(0.75, 1.15), sx = x + Math.cos(an) * d, sz = z + Math.sin(an) * d, h2 = sub + (hgt - sub) * R.range(0.32, 0.6);
        if (path.distanceTo(sx, y0 + h2 * 0.6, sz) < 13) { R(); R(); continue; }
        spire(sx, y0, sz, h2, r0 * R.range(0.4, 0.56), 1, 8, basin, 0.16, { la: an, ledges: 1, nf: R.int(3, 4), ledgeLo: sub / h2 + 0.1, ...o });
      }
    };
    // 14 pinnacles beside the flight along the alp: on our left tall blades stand on the alp's flank and pass 25 to 40 m off; on
    // the right, toward the Lit Wall, lower ones stand out of the cloud sea off its shore; and a scatter further out for scale
    const pinn = [];
    { const w = new THREE.Vector3(), pr = rng.fork('pinnacles'), ps = rng.fork('pinnacle-shapes'); let side = pr.chance(0.5) ? 1 : -1;
      for (let i = 0; i < 14; i++) {
        const a = 350 + i * 11.5 + pr.range(-3, 3), tb = Math.exp(-Math.pow((a - 414) / 56, 2)), left = side < 0, near = i < 9; side = -side;
        const onAlp = near && left, sub = onAlp ? 6 : 34;
        const p = onAlp ? -pr.range(30, 40) - 12 * tb : (left ? -1 : 1) * ((left ? 56 + 14 * tb : 62 + 26 * tb) + pr.range(6, near ? 26 : 80));
        const r0 = onAlp ? pr.range(5, 7.5) : pr.range(8, 12.5), hgt = (onAlp ? pr.range(22, 42) : left ? pr.range(28, 56) : pr.range(11, 24)) + sub, lean = pr.range(0, 0.07), laJ = pr.range(-0.5, 0.5);
        worldOf(a, p, w); const base = onAlp ? heightAt(w.x, w.z) - sub : CLOUD_Y - sub;
        if (path.distanceTo(w.x, base + sub + 8, w.z) < 15 + r0 || (onAlp && tarnT(a, p) > -0.3)) continue;
        if (!onAlp) pinn.push({ x: w.x, z: w.z, top: base + hgt, r: r0, near: true });
        spire(w.x, base, w.z, hgt, r0, 2, 14, onAlp ? 0 : 1, lean, { rng: ps, snow: autumn ? 1 : 0, ledges: 3, ledgeLo: sub / hgt + 0.1, thick: onAlp ? 62 : 84, la: Math.atan2(rx.y * Math.sign(p), rx.x * Math.sign(p)) + laJ, chisel: 0.2 });
        satellites(w.x, base, w.z, hgt, r0, 2, onAlp ? 0 : 1, null, { rng: ps, snow: autumn ? 0.8 : 0, thick: onAlp ? 50 : 66 }, sub);
        await ctx.yield();
      }
      // cairns of carved jade: stout little finials a few metres tall, ringed with tool-cut bands and thin enough to glow, standing
      // in threes beside the braids, round the tarn's shore, on its islet and along the alp's rim over the cloud
      const cr = rng.fork('cairns');
      const spots = [[236, 0, 1], [262, 0, -1], [287, 0, 1], [312, 0, -1], [350, 24, 0], [372, 36, 0], [398, 43, 0], [423, 45, 0], [437, 14, 0], [448, 41, 0], [400, -31, 0], [432, -33, 0], [462, -22, 0], [492, 30, 0]];
      for (const [a0, p0, bs] of spots) {
        const a = a0 + (a0 === 437 ? 0 : cr.range(-3, 3)), p = bs ? streamP(a) + bs * (8 * braidK(a) + 5.5 + cr.range(0, 3)) : p0;
        worldOf(a, p, w); const y = heightAt(w.x, w.z), hgt = cr.range(3.4, 5.8), r0 = cr.range(0.95, 1.5);
        if (path.distanceTo(w.x, y + hgt, w.z) < 6.5 || (a0 !== 437 && tarnT(a, p) > -0.06)) continue;
        spire(w.x, y - 0.8, w.z, hgt + 0.8, r0, 0, 5, 0, cr.range(0, 0.05), { rng: cr, nf: cr.int(4, 5), ledges: 3, ledgeLo: 0.22, groove: 2.4, ring: 1, shoulder: 0.8, waist: 0.76, snow: 0, thick: 7, hollow: 0.1, chisel: 0.12, sq: cr.range(0.8, 0.95) });
        for (let k = 0; k < 2; k++) {
          const an = cr.range(0, 6.28), d = r0 * cr.range(1.5, 2.3), sx = w.x + Math.cos(an) * d, sz = w.z + Math.sin(an) * d, sa = toA(sx, sz), h2 = hgt * cr.range(0.4, 0.62), r2 = r0 * cr.range(0.5, 0.7);
          if (path.distanceTo(sx, y + 2, sz) < 6.5 || tarnT(sa, toL(sx, sz) - plAt(sa)) > -0.04) continue;
          spire(sx, heightAt(sx, sz) - 0.6, sz, h2 + 0.6, r2, 0, 4, 0, 0.04, { rng: cr, nf: 4, ledges: 1, ledgeLo: 0.25, groove: 2.4, ring: 1, shoulder: 0.78, waist: 0.76, snow: 0, thick: 6, chisel: 0.1 });
        }
      }
      await ctx.yield();
      // JADE SHARDS: thin blades in clusters, a root of deep green stone grading through apple to a white-celadon tip the light
      // comes through. Round the tarn they stand in the foreground of THE image, on its right shore between the lens and the
      // Lit Wall's dark foot and on its left bank; four more clusters lean against the fluted fins of the notch.
      { const sh = rng.fork('shards');
        const blade = (a, p2, hgt, r0, lean, la) => { worldOf(a, p2, w); const y = heightAt(w.x, w.z);
          if (y < CLOUD_Y + 4 || path.distanceTo(w.x, y + hgt * 0.55, w.z) < 11 + r0 || (a > 356 && a < 470 && tarnT(a, p2) > -0.1)) { sh(); sh(); return; }
          spire(w.x, y - 2.5, w.z, hgt + 2.5, r0, 1, 6, 0, lean, { rng: sh, nf: sh.int(3, 4), sq: sh.range(0.42, 0.6), tw: sh.range(-0.15, 0.15), la, ledges: 0, snow: 0, grade: [100 + 3 * hgt, 6.5], shoulder: 0.42, waist: 0.74, chisel: 0.26, hollow: 0.2 }); };
        const dirA = (an) => Math.atan2(ax.y * Math.cos(an) + rx.y * Math.sin(an), ax.x * Math.cos(an) + rx.x * Math.sin(an));
        for (const [a0, p0, H] of [[398, 41, 15], [415, 46.5, 12], [434, 45, 17], [452, 41, 11], [386, -19, 15], [405, -28, 12], [305, 23.2, 21], [318, 23.6, 15], [331, 23.4, 23], [344, 22.6, 14], [311, -17.6, 13]]) {
          const out = p0 > 0 ? Math.PI / 2 : -Math.PI / 2;
          blade(a0, p0, H * sh.range(0.9, 1.15), H * sh.range(0.1, 0.135), sh.range(0.03, 0.1), dirA(out + sh.range(-0.7, 0.7)));
          for (let k = 0; k < 3; k++) { const an = out + sh.range(-1.9, 1.9), d = sh.range(2.4, 4.8), h2 = H * sh.range(0.3, 0.66); blade(a0 + Math.cos(an) * d, p0 + Math.sin(an) * d, h2, h2 * sh.range(0.11, 0.16), sh.range(0.08, 0.2), dirA(an)); }
        }
      }
      await ctx.yield();
      for (let i = 0; i < 16; i++) { if ((i & 3) === 0) await ctx.yield(); worldOf(pr.range(380, 760), (pr.chance(0.7) ? 1 : -1) * pr.range(150, 700), w); if (heightAt(w.x, w.z) > CLOUD_Y - 8) continue; const hg = pr.range(60, 110); pinn.push({ x: w.x, z: w.z, top: CLOUD_Y - 40 + hg, r: 13 }); spire(w.x, CLOUD_Y - 40, w.z, hg, pr.range(10, 19), 0, 7, 1, pr.range(0, 0.1), { ledges: 1, ledgeLo: 40 / hg + 0.15, thick: 70 }); } }
    // flakes split off the gorge walls: thick blades standing on the ledges, the only stone in the gorge the sun comes
    // through; each grades from a black-green root through apple to a white-celadon tip
    { const w = new THREE.Vector3(), fk = rng.fork('flakes'), axAng = Math.atan2(ax.y, ax.x);
      useSink(sinkGorge);
      for (let i = 0; i < 52; i++) {
        const a = -34 + i * 6.2 + fk.range(-2.5, 2.5), sg = i & 1 ? 1 : -1, hw = lerp(38, 19, smoothstep(215, 300, a)), p = sg * (hw + fk.range(4, 24)), hgt = fk.range(10, 24), r0 = fk.range(3, 5.2);
        worldOf(a, p, w); const y = heightAt(w.x, w.z);
        if (a > 284 || path.distanceTo(w.x, y + hgt * 0.5, w.z) < 17 + r0) { fk(); continue; }
        spire(w.x + rx.x * sg * 1.5, y - 6, w.z + rx.y * sg * 1.5, hgt + 6, r0, 1, 7, 0, 0.12, { nf: 4, sq: fk.range(0.4, 0.55), qa: axAng + fk.range(-0.35, 0.35), tw: 0.12, la: Math.atan2(-rx.y * sg, -rx.x * sg), ledges: 0, snow: 0, lamp: 0, grade: [90, 1.5], shoulder: 0.5, waist: 0.72, chisel: 0.22 });
        if ((i & 7) === 7) await ctx.yield();
      }
      useSink(sinkMain); }
    // two gendarmes flank the arch on the col
    const gend = [];
    const eT = path.endTangent.clone().setY(0).normalize(), eR = new THREE.Vector3(-eT.z, 0, eT.x), COL_Y = E0.y - 11, AS = 1.35;   // the gate: the round-5 arch a third larger, standing where the col dips toward it
    for (const sx of [-1, 1]) { await ctx.yield(); const g = E0.clone().addScaledVector(eR, sx * 27.5).addScaledVector(eT, 4.5); const gy = heightAt(g.x, g.z) - 3, away = Math.atan2(eR.z * sx, eR.x * sx); spire(g.x, gy, g.z, sx < 0 ? 47 : 40, 9, 2, 16, 0, 0.05, { ledges: 3, snow: 1, sq: 0.74, thick: 48, hollow: 0.2, ledgeLo: 0.16, chisel: 0.2 }); satellites(g.x, gy, g.z, sx < 0 ? 47 : 40, 10, 3, 0, away, { snow: 1, thick: 40 }); gend.push([g.x, g.z, sx < 0 ? 44 : 37, 5.5]); }
    await ctx.yield();
    // three paler tiers of far ranges, all round (the Lit Wall hides the eastern arc)
    { const ctr = path.pointAt(0.6), fr = rng.fork('ranges');
      for (let tier = 0; tier < 3; tier++) {
        const R = [3300, 4500, 5900][tier], hb = [620, 800, 1000][tier], SEG = 150, base = jP.length / 3, so = fr.range(0, 50);
        for (let s = 0; s <= SEG; s++) {
          const an = (s / SEG) * 6.2832, cx = Math.cos(an), cz = Math.sin(an);
          const hh = CLOUD_Y + hb * (0.45 + 0.75 * noise.ridged2(cx * 2.6 + so, cz * 2.6 + tier * 9, 4) + 0.12 * noise.n2(cx * 9 + so, cz * 9));
          const rr = R * (1 + 0.05 * noise.n2(cx * 3 + 7, cz * 3 + so));
          for (let r = 0; r < 4; r++) { const t = r / 3; jP.push(ctr.x + cx * rr * (1 - 0.1 * t), lerp(CLOUD_Y - 60, hh, t), ctr.z + cz * rr * (1 - 0.1 * t)); jD.push(lerp(700, 6, Math.pow(t, 0.6)), 0.6 + 0.4 * t, smoothstep(0.75, 1, t) * (autumn ? 0.9 : 0.62), 0); jE.push(1, 0, 1, 0); }
        }
        for (let s = 0; s < SEG; s++) for (let r = 0; r < 3; r++) { const a = base + s * 4 + r, b = a + 4; jI.push(a, b, a + 1, b, b + 1, a + 1); }
        await ctx.yield();
      } }
    // ---------------------------------------------------------------- the gate's own stone (one mesh, drawn from u 0.3): the avenue of
    // blades, the Needle's Eye on the spur, the Gate Horn beyond the col
    useSink(sinkGate);
    const blades = [], gateBurn = [], HORN_Y = 585;
    { const w = new THREE.Vector3(), av = xr.fork('avenue'), qaE = Math.atan2(eR.z, eR.x);
      // THE AVENUE: tall thin blades of translucent jade lining the last of the flight, from the top of the spur over the col's
      // snow to the gate. An inner row 12 to 17 m either side of the line, 12 to 17 m tall, and an outer row 21 to 28 m off,
      // 18 to 24 m tall (so each still stands whole in the frame as it passes): a deep green root grading through apple to a
      // white-celadon tip the light comes through, thin white aretes, the broad face turned to the flight. Their shadows are
      // drawn on the snow by the jade shader (uBl).
      const put = (a, p2, hgt, sh) => {
        worldOf(a, p2, w); const y = heightAt(w.x, w.z), r0 = hgt * av.range(0.105, 0.135), lean = av.range(0.02, 0.07), la = Math.atan2(rx.y * Math.sign(p2), rx.x * Math.sign(p2)) + av.range(-0.6, 0.6), small = av.chance(0.65), an = av.range(0, 6.28), dk = av.range(1.4, 2.1), hk = av.range(0.28, 0.45);
        if (path.distanceTo(w.x, y + hgt * 0.5, w.z) < 8.5 + r0 * 0.6) return;
        spire(w.x, y - 2.5, w.z, hgt + 2.5, r0, 1, 7, 0, lean, { rng: av, nf: av.int(3, 4), sq: av.range(0.4, 0.52), qa: qaE + av.range(-0.45, 0.45), tw: av.range(-0.12, 0.12), la, ledges: 0, snow: 0, grade: [24 + 1.3 * hgt, 2.4], shoulder: 0.4, waist: 0.78, chisel: 0.24, hollow: 0.22 });
        if (sh) blades.push([w.x, w.z, hgt, r0]);
        const sx = w.x + Math.cos(an) * r0 * dk, sz = w.z + Math.sin(an) * r0 * dk;
        if (small && path.distanceTo(sx, y + 3, sz) > 10) spire(sx, heightAt(sx, sz) - 1.5, sz, hgt * hk + 1.5, r0 * 0.5, 1, 5, 0, 0.1, { rng: av, nf: 3, sq: 0.5, qa: qaE + av.range(-0.6, 0.6), tw: 0, la: an, ledges: 0, snow: 0, grade: [20, 2.4], shoulder: 0.4, waist: 0.78, chisel: 0.24, hollow: 0.2 });
      };
      // [a, p, tall?]: the stations are set so that no blade stands cut by the frame's edge in the stills at u 0.79, 0.84, 0.87, 0.90, 0.94, 0.95
      for (const [a, p2, big] of [[722, 12.5, 0], [746, 13, 0], [746, -12.5, 0], [770, 12.5, 0], [770, -13.5, 0], [796, 13.5, 0], [792, -12.5, 0], [841, 17, 0], [832, -17, 0],
        [713, 21, 2], [731, 22, 1], [760, 23, 1], [781, 22, 1], [812, 24, 1], [713, -28, 1], [731, -23, 1], [755, -22, 1], [781, -23.5, 1], [802, -22, 1]]) {
        put(a + av.range(-0.8, 0.8), p2 + av.range(-0.7, 0.7), big === 1 ? av.range(18, 24) : big ? av.range(11, 13) : av.range(12, 16.5), p2 > 0 || (a > 745 && !big)); }
      await ctx.yield();
      // THE NEEDLE'S EYE (in sight from the alp, u 0.36; we fly under its crown at u 0.69): a natural arch of jade standing across
      // the spur, 50 m high, one foot 20 m left of the flight and one 30 m right of it on the slab beyond the hunt's rib, so
      // the far side shows through it: the top of the spur, the col and the Gate Horn. Massive black-green legs, a crown
      // thin enough for the light to come through its edges, carved in planes like every wall (it is not a blade: aD.w = 0),
      // snow lying along its back. A five-sided tube swept along a half ellipse that is a little askew.
      { const ar = xr.fork('needles-eye'), A = worldOf(600, -20, new THREE.Vector3()), B = worldOf(600.5, 30, new THREE.Vector3());
        A.y = heightAt(A.x, A.z) - 4; B.y = heightAt(B.x, B.z) - 4;
        const span = new THREE.Vector3().subVectors(B, A).setY(0), out = new THREE.Vector3(-span.z, 0, span.x).normalize(), RISE = 50, NSEG = 36, pts = [], sd = ar.range(0, 50);
        for (let i = 0; i <= NSEG; i++) { const t = i / NSEG, sn = Math.sin(Math.PI * t), e = 0.5 - 0.5 * Math.cos(Math.PI * t) + 0.045 * Math.sin(2 * Math.PI * t), bow = 2.4 * Math.sin(Math.PI * t * 2 + 0.8) * sn;
          pts.push([A.x + span.x * e + out.x * bow, lerp(A.y, B.y, e) + RISE * Math.pow(sn, 0.6) * (1 + 0.04 * Math.sin(t * 9 + sd)), A.z + span.z * e + out.z * bow, lerp(8.5, 4.2, Math.pow(sn, 0.6)) * (1 + 0.24 * noise.n2(t * 6 + sd, 7.7) + 0.12 * noise.n2(t * 17 + sd, 2.2)), sn]); }
        const nf = 5, fs = FS[1], cols = fs.length, sides = nf * cols, base = jP.length / 3, T = new THREE.Vector3(), U = new THREE.Vector3(), kt = []; for (let k = 0; k < nf; k++) kt.push(ar.range(0.7, 1.3));
        for (let r = 0; r <= NSEG; r++) {
          const P = pts[r], P0 = pts[Math.max(r - 1, 0)], P1 = pts[Math.min(r + 1, NSEG)];
          T.set(P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]).normalize(); U.crossVectors(out, T).normalize();      // U: the arch's outer side (its back, up at the crown)
          for (let s2 = 0; s2 < sides; s2++) {
            const k0 = Math.floor(s2 / cols), f = fs[s2 % cols], an = ((k0 + f - 0.5) / nf) * 6.2832 + 0.3 * Math.sin(r * 0.19 + sd), c = Math.abs(f - 0.5) * 2;      // face 0 is the back
            const rad = P[3] * Math.cos(Math.PI / nf) / Math.cos((f - 0.5) * 2 * Math.PI / nf) * (1 - 0.13 * (1 - c * c)) * (1 + 0.1 * noise.n3(Math.cos(an) * 1.3 + sd, r * 0.3, Math.sin(an) * 1.3));
            const eu = Math.cos(an) * rad, eo = Math.sin(an) * rad * 0.72;
            jP.push(P[0] + U.x * eu + out.x * eo, P[1] + U.y * eu, P[2] + U.z * eu + out.z * eo);
            const th = 1.2 + (16 + P[3] * P[3] * 1.9 + 90 * Math.pow(1 - P[4], 2.5)) * lerp(kt[k0], kt[(k0 + 1) % nf], f) * (1 - c * c * c), back = k0 === 0 ? smoothstep(0.4, 0.8, U.y) * (1 - smoothstep(0.7, 0.95, c)) : 0;
            jD.push(th, (0.5 + 0.5 * smoothstep(0, 0.3, P[4])) * (0.8 + 0.2 * c) * (Math.cos(an) < -0.3 ? 0.78 : 1), 0.95 * back, 0); jE.push(0, 0, 1, Math.exp(-th / 5));
          }
        }
        for (let r = 0; r < NSEG; r++) for (let s2 = 0; s2 < sides; s2++) { if (s2 % cols === cols - 1) continue; const a = base + r * sides + s2, b = a + 1, c = a + sides, d = b + sides; jI.push(a, b, c, b, d, c); }
        // shards crowd both feet: beyond the left one, outside the right one
        for (const [F2, n, sg2] of [[A, 3, 0], [B, 3, 1]]) for (let k = 0; k < n; k++) { const an = (sg2 ? Math.atan2(rx.y, rx.x) : Math.atan2(ax.y, ax.x)) + ar.range(-1.1, 1.1), d = ar.range(8, 12), sx = F2.x + Math.cos(an) * d, sz = F2.z + Math.sin(an) * d, h2 = ar.range(8, 17);
          spire(sx, heightAt(sx, sz) - 2.5, sz, h2 + 2.5, h2 * ar.range(0.11, 0.15), 1, 6, 0, ar.range(0.08, 0.2), { rng: ar, nf: ar.int(3, 4), sq: ar.range(0.42, 0.6), qa: ar.range(0, 3.14), tw: ar.range(-0.15, 0.15), la: an, ledges: 0, snow: 0, grade: [100 + 3 * h2, 6.5], shoulder: 0.42, waist: 0.74, chisel: 0.26, hollow: 0.2 }); }
      }
      await ctx.yield();
      // THE GATE HORN: a thin fin of a peak 540 m beyond the col, straight down the last of the flight, so it stands right above
      // the gate from the top of the spur on (its summit 23 to 25 degrees up). A fluted sheet facing us: black-green at the foot,
      // apple up the flanks, and along the summit's crest stone so thin that the light burns through it white (aS.w).
      { const NXh = 60, NVh = 30, Wd = NXh + 1, base = jP.length / 3, G0 = E0.clone().addScaledVector(eT, 540), YB = 150, YT = HORN_Y, so = xr.range(0, 40);
        const flute = (xw, P) => { const q = 1 - Math.abs(Math.sin(Math.PI * xw / P)); return q * q * q; };
        for (let j = 0; j <= NVh; j++) for (let i = 0; i <= NXh; i++) {
          const x = -330 + (660 * i) / NXh, axx = Math.abs(x), endW = smoothstep(330, 215, axx);
          const sh = Math.exp(-Math.pow(axx / 125, 1.22)) + 0.34 * Math.exp(-Math.pow((x + 165) / 62, 2)) + 0.2 * Math.exp(-Math.pow((x - 185) / 56, 2)) + 0.05 * noise.ridged2(x / 46 + so, 3.3, 2);
          const H = YB + (YT - YB) * Math.min(sh, 1.03) * endW, y = (YB - 45) + (H - YB + 45) * (1 - Math.pow(1 - j / NVh, 1.6)), d = H - y;
          const n = noise.n2(x / 90 + so, y / 110), rib = flute(x + 0.06 * d + 9 * n, 38) * smoothstep(0, 30, d), but = Math.pow(1 - Math.abs(Math.sin(Math.PI * (x + 20) / 170)), 2) * smoothstep(60, 300, d);
          const zf = 1 + 0.4 * d * (0.85 + 0.3 * n) + rib * (2.5 + 0.035 * Math.min(d, 260)) + 24 * but + 3 * noise.n2(x / 17, y / 17 + so) * smoothstep(10, 80, d);
          jP.push(G0.x + eR.x * x - eT.x * zf, y, G0.z + eR.z * x - eT.z * zf);
          const th = 0.8 + 0.035 * d + 0.0011 * d * d * (0.75 + 0.5 * (n * 0.5 + 0.5)) + rib * 1.6 * smoothstep(20, 90, d) + 5 * but;
          jD.push(th, 0.6 + 0.4 * rib, smoothstep(0.1, 0.45, noise.n2(x / 55 + 3 + so, y / 70)) * smoothstep(110, 230, d) * 0.9, 0); jE.push(0, 0, 1, 0);
          gateBurn.push(Math.exp(-d / 30) * (0.3 + 0.7 * Math.exp(-Math.pow((x - 4) / 60, 2))) * endW);
        }
        for (let j = 0; j < NVh; j++) for (let i = 0; i < NXh; i++) { const a = base + j * Wd + i; jI.push(a, a + 1, a + Wd, a + 1, a + Wd + 1, a + Wd); }
        gateBurn.base = base;
      }
    }
    useSink(sinkMain);
    await ctx.yield();
    // the shadows the right-hand blades and the gendarmes throw across the col, away from the Lit Wall
    { const list = blades.concat(gend).slice(0, 20), sd = new THREE.Vector2(-lampDir.x, -lampDir.z).normalize();
      list.forEach((b, i) => G.uBl.value[i].set(b[0], b[1], b[2], b[3])); G.uGate.value.set(sd.x, sd.y, Math.hypot(lampDir.x, lampDir.z) / Math.max(lampDir.y, 0.1)); }
    const jadeMesh = async (k, name, burn) => {
      const g = new THREE.BufferGeometry(), n = k[0].length / 3, S = new Float32Array(n * 4);
      if (burn) for (let i = 0; i < burn.length; i++) { S[(burn.base + i) * 4] = -5000; S[(burn.base + i) * 4 + 3] = burn[i]; }
      g.setAttribute('position', new THREE.Float32BufferAttribute(k[0], 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(k[1], 4)); g.setAttribute('aE', new THREE.Float32BufferAttribute(k[2], 4));
      g.setAttribute('aS', new THREE.BufferAttribute(S, 4)); g.setIndex(k[3]);
      await ctx.yield();
      g.computeVertexNormals(); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, jadeMat); m.name = name; scene.add(m); return m;
    };
    jadeMat.side = THREE.DoubleSide;
    const jadeBits = await jadeMesh(sinkMain, 'pinnacles-ranges');
    await ctx.yield();
    const gorgeBits = await jadeMesh(sinkGorge, 'gorge-flakes');
    await ctx.yield();
    const gateBits = await jadeMesh(sinkGate, 'gate-stone', gateBurn);
    await ctx.yield();

    // ---------------------------------------------------------------- the arch on the col: pierced jade, 33 m tall (the shape below, times AS)
    {
      const sh = new THREE.Shape();
      sh.moveTo(-11, 0); sh.lineTo(-11.3, 12.5); sh.quadraticCurveTo(-13.4, 15.5, -12.2, 18.2); sh.quadraticCurveTo(-11.2, 20.8, -8.6, 21.9);
      sh.quadraticCurveTo(-4.5, 22.4, 0, 24.2); sh.quadraticCurveTo(4.5, 22.4, 8.6, 21.9); sh.quadraticCurveTo(11.2, 20.8, 12.2, 18.2); sh.quadraticCurveTo(13.4, 15.5, 11.3, 12.5);
      sh.lineTo(11, 0); sh.lineTo(8, 0); sh.lineTo(8, 9.5); sh.absarc(0, 9.5, 8, 0, Math.PI, false); sh.lineTo(-8, 0); sh.lineTo(-11, 0);
      // openwork: every cut-out is a tapering slot wound round a centre (commas, and a cloud-scroll in each spandrel)
      const scroll = (cx, cy, r0, r1, t0, t1, w0, w1, n) => {
        const o = [], inn = [];
        for (let i = 0; i <= n; i++) { const t = i / n, th = lerp(t0, t1, t), r = lerp(r0, r1, t), wd = lerp(w0, w1, Math.pow(t, 0.8)), ri = Math.max(r - wd, 0.03);
          o.push(new THREE.Vector2(cx + Math.cos(th) * (r + wd), cy + Math.sin(th) * (r + wd))); inn.push(new THREE.Vector2(cx + Math.cos(th) * ri, cy + Math.sin(th) * ri)); }
        sh.holes.push(new THREE.Path(o.concat(inn.reverse())));
      };
      const comma = (cx, cy, R, th, turn) => scroll(cx, cy, 0.37 * R, R, th, th + turn * 4.3, 0.34 * R, 0.05 * R, 12);
      for (const sx of [-1, 1]) {
        const m = (th) => (sx > 0 ? th : Math.PI - th);                              // mirror an angle for the left side
        scroll(sx * 8.9, 17.15, 0.52, 2.05, m(-1.9), m(-1.9) + sx * 8.4, 0.36, 0.23, 32);   // the cloud-scroll
        comma(sx * 1.95, 20.6, 1.25, m(0.4), -sx); comma(sx * 5.45, 20.25, 0.95, m(2.6), sx); comma(sx * 10.25, 13.35, 0.62, m(1.2), -sx);
        comma(sx * 9.75, 10.9, 0.66, m(-1.6), sx); comma(sx * 9.75, 7.3, 0.66, m(1.6), -sx); comma(sx * 9.75, 4.2, 0.66, m(-1.6), sx);
      }
      // raised mouldings: an archivolt round the opening, imposts at the springing, plinths at the feet
      const band = new THREE.Shape(); band.moveTo(8.95, 2.3); band.lineTo(8.95, 9.5); band.absarc(0, 9.5, 8.95, 0, Math.PI, false); band.lineTo(-8.95, 2.3); band.lineTo(-8.02, 2.3); band.lineTo(-8.02, 9.5); band.absarc(0, 9.5, 8.02, Math.PI, 0, true); band.lineTo(8.02, 2.3); band.lineTo(8.95, 2.3);
      const box = (x0, y0, x1, y1) => { const b = new THREE.Shape(); b.moveTo(x0, y0); b.lineTo(x1, y0); b.lineTo(x1, y1); b.lineTo(x0, y1); b.lineTo(x0, y0); return b; };
      const parts = [[sh, 2.4, 0.33, 1], [band, 3.3, 0.22, 1.9]];
      for (const sx of [-1, 1]) { parts.push([box(Math.min(sx * 7.55, sx * 11.6), 0, Math.max(sx * 7.55, sx * 11.6), 2.3), 3.8, 0.22, 2.2]); parts.push([box(Math.min(sx * 7.75, sx * 11.65), 9.0, Math.max(sx * 7.75, sx * 11.65), 9.9), 3.5, 0.18, 1.8]); }
      const aPos = [], aNor = [], aDd = [], aEe = [];
      await ctx.yield();
      for (const [shape, depth, bev, deep] of parts.reverse()) {                    // the small plain blocks first, the pierced slab last
        const eg = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelOffset: -bev * 0.9, bevelSegments: 2, curveSegments: 14, steps: 1 });   // chamfers cut inward: countersunk piercings
        eg.translate(0, 0, -depth / 2 + bev);
        await ctx.yield();
        const ap = eg.attributes.position, an = eg.attributes.normal, pa = ap.array, na = an.array;
        for (let i = 0; i < ap.count; i++) {
          if ((i & 2047) === 2047) await ctx.yield();
          const x = pa[i * 3], y = pa[i * 3 + 1], nz = na[i * 3 + 2], face = nz * nz;
          // faces are thick stone (apple at the crown, deep green down the limbs, black-green at the feet; thinner toward the sun on the
          // right, so the right limb carries a bright rim); every cut edge and bevel is a few metres thin and glows
          const base = (13 + 15 * smoothstep(21, 11, y) + 150 * Math.pow(smoothstep(13, 0, y), 1.5)) * lerp(0.5, 1.55, smoothstep(13, -13, x)) * deep;
          const rimR = shape === sh ? smoothstep(9.7, 11.2, x) : 0;                 // the right limb's outer edge: a few metres thin toward the sun
          aPos.push(x, y, pa[i * 3 + 2]); aNor.push(na[i * 3], na[i * 3 + 1], nz);
          const tA = lerp(1.5, lerp(base, Math.min(base, 2.6), rimR), face * face); aDd.push(tA, 0.62 + 0.38 * smoothstep(0, 6, y), 0, 0); aEe.push(0, 0, 1, Math.exp(-tA / 5));
        }
        eg.dispose(); await ctx.yield();
      }
      const ag = new THREE.BufferGeometry();
      ag.setAttribute('position', new THREE.Float32BufferAttribute(aPos, 3)); ag.setAttribute('normal', new THREE.Float32BufferAttribute(aNor, 3));
      ag.setAttribute('aD', new THREE.Float32BufferAttribute(aDd, 4)); ag.setAttribute('aE', new THREE.Float32BufferAttribute(aEe, 4)); ag.setAttribute('aS', new THREE.BufferAttribute(new Float32Array((aPos.length / 3) * 4), 4)); ag.computeBoundingSphere();
      const arch = new THREE.Mesh(ag, jadeMat); arch.name = 'arch';
      arch.matrixAutoUpdate = false;
      arch.matrix.makeBasis(eR, new THREE.Vector3(0, 1, 0), eT.clone().negate()).scale(new THREE.Vector3(AS, AS, AS)).setPosition(E0.x, COL_Y - 0.4, E0.z);
      scene.add(arch);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the cloud sea and the cloud-fall
    // VAPOUR, in three layers: (1) one opaque displaced grid of rounded billows shaded softly (wrapped light, hollows
    // never under about 0.45 of the crests, every billow's far edge thinning out pale, fibres streaming near the lens);
    // (2) two torn translucent sheets riding 1.5 m and 3.3 m above it over the flight's corridor, so no billow ends in a
    // hard line and everything standing in the sea is wrapped; (3) soft streamers: off the fall's nose, across the notch
    // between lens and lip, over the sea, and curling round the foot of every pinnacle (where the sea also swells in a collar).
    const flowW = new THREE.Vector2(-ax.x, -ax.y);     // the sea flows toward the gorge
    let cloud;
    {
      // rows along the axis (2.2 m where the flight skims it, growing outward), columns across the path
      const ca = [], cp = []; let a = 318, st = 2.2; for (; a <= 600; a += 2.2) ca.push(a); a = ca[ca.length - 1]; while (a < 6400) { st *= 1.26; a += st; ca.push(a); }
      { const h = [0]; let p = 0, s2 = 2.7; while (p < 84) { p += 2.7; h.push(p); } while (p < 5400) { s2 *= 1.25; p += s2; h.push(p); } for (let i = h.length - 1; i > 0; i--) cp.push(-h[i]); cp.push(...h); }
      const ni = ca.length, nj = cp.length, P = new Float32Array(ni * nj * 3), Cc = new Float32Array(ni * nj * 4), Cl = new Float32Array(ni * nj * 4), I = new Uint32Array((ni - 1) * (nj - 1) * 6), w = new THREE.Vector3(); let q = 0;
      // the fall: under the path from the notch lip down to A = 216, then a convex nose rolling onto the canopy and fraying out
      const fallW = (A) => 0 * A, A_TOP = 216;     // (the sea no longer pours down the gorge as one sheet: its fall is a river of streamers, below)
      const rampTop = Math.min(CLOUD_Y, pyAt(A_TOP) - 6.4);
      const sAl = new Float32Array(ni); { let s = 0; for (let i = 1; i < ni; i++) { s += (ca[i] - ca[i - 1]) * lerp(1, 0.85, fallW((ca[i] + ca[i - 1]) * 0.5)); sAl[i] = s; } }
      for (let i = 0; i < ni; i++) {
        const A = ca[i], fw = fallW(A), hwA = lerp(38, 19, smoothstep(215, 300, A));
        for (let j = 0; j < nj; j++) {
          const k = i * nj + j, p = cp[j]; worldOf(A, p, w);
          let y = CLOUD_Y, fade = 1, nose = 0, collar = 0;
          if (A < 322) {
            const pn = Math.min(Math.abs(p) / hwA, 1.4), aN = 158 + 20 * pn * pn + 11 * noise.n2(p / 15 + 3.3, 1.7);       // the foot of the nose: lobes, the middle furthest down-valley
            if (A >= A_TOP) y = Math.min(CLOUD_Y, pyAt(A) - 6.4);
            else { const tN = clamp((A - aN) / (A_TOP - aN), 0, 1), foot = 85.5 + 2 * noise.n2(p / 9, A / 9); y = lerp(foot, rampTop, Math.sqrt(1 - (1 - tN) * (1 - tN))); nose = Math.sin(Math.PI * Math.min(1, tN * 1.15)) * (1 - smoothstep(A_TOP - 8, A_TOP + 6, A)); }
            y -= 4.5 * pn * pn * fw;                                                                                  // a domed tongue, sinking into the walls
            fade = smoothstep(aN - 2, aN + 28, A);
          } else if (A < 800 && Math.abs(p) < 760) {
            for (const pk of pinn) { const dx = w.x - pk.x, dz = w.z - pk.z, d2 = dx * dx + dz * dz, rr = pk.r * 1.15 + 4; if (d2 < rr * rr * 6) collar = Math.max(collar, Math.exp(-d2 / (rr * rr))); }
          }
          P[k * 3] = w.x; P[k * 3 + 1] = y; P[k * 3 + 2] = w.z;
          Cc[k * 4] = fw; Cc[k * 4 + 1] = fade; Cc[k * 4 + 2] = sAl[i]; Cc[k * 4 + 3] = nose;
          Cl[k * 4] = p + plAt(A); Cl[k * 4 + 1] = collar; Cl[k * 4 + 2] = p; Cl[k * 4 + 3] = A;
        }
        if ((i & 15) === 15) await ctx.yield();
      }
      // drawn far rows first and, within a row, from the outside in, so the frayed foot blends over the cloud behind it
      { const jm = (nj - 1) >> 1, quad = (i, j) => { const a2 = i * nj + j, b = a2 + 1, c = a2 + nj, d = c + 1; I[q++] = a2; I[q++] = b; I[q++] = c; I[q++] = b; I[q++] = d; I[q++] = c; };
        for (let i = ni - 2; i >= 0; i--) { for (let j = 0; j < jm; j++) quad(i, j); for (let j = nj - 2; j >= jm; j--) quad(i, j); } }
      const cg = new THREE.BufferGeometry(), aPos = new THREE.BufferAttribute(P, 3), aCc = new THREE.BufferAttribute(Cc, 4), aGg = new THREE.BufferAttribute(Cl, 4);
      cg.setAttribute('position', aPos); cg.setAttribute('aC', aCc); cg.setAttribute('aG', aGg); cg.setIndex(new THREE.BufferAttribute(I, 1));
      await ctx.yield();
      cg.computeVertexNormals(); cg.computeBoundingSphere(); cg.boundingSphere.radius += 30;
      await ctx.yield();
      // the sheets: every second row and column of the same grid over the corridor (|p| < 90, A < 735), same draw order
      const sg = new THREE.BufferGeometry();
      { const I2 = [], jm = (nj - 1) >> 1, js = []; let iMax = 0; while (iMax + 2 < ni && ca[iMax + 2] < 735) iMax += 2;
        for (let j = jm % 2; j + 2 < nj; j += 2) if (Math.abs(cp[j]) < 150 && Math.abs(cp[j + 2]) < 150) js.push(j);
        const quad = (i, j) => { const a2 = i * nj + j, b = a2 + 2, c = a2 + 2 * nj, d = c + 2; I2.push(a2, b, c, b, d, c); };
        for (let i = iMax - 2; i >= 0; i -= 2) { for (const j of js) if (j < jm) quad(i, j); for (let k = js.length - 1; k >= 0; k--) if (js[k] >= jm) quad(i, js[k]); }
        sg.setAttribute('position', aPos); sg.setAttribute('aC', aCc); sg.setAttribute('aG', aGg); sg.setAttribute('normal', cg.attributes.normal); sg.setIndex(I2); sg.boundingSphere = cg.boundingSphere.clone(); }
      await ctx.yield();
      // q = (metres along the flow, stretched in the fall so its billows pull out into tongues; metres across)
      const CLOUD_H = /* glsl */`
        // x: height in metres (the shape the mesh takes), y: finer relief for the shading only, z: how high in its billow (.36 in a hollow, 1 on a dome)
        // The sea is broad cumulus: domes with rounded hollows between them. The fall pours in RANKS: rolls lying across the
        // flow, 12 m from crest to crest and 3 to 4 m high, round on top, each broken along its length into billows and riding
        // the bigger lobes under it, so from the lens (6 m up, looking along the flow) rank stands behind rank all the way to
        // the notch: a shaded flank under a pale crest, again and again.
        float dome(float n){ float a = min(sqrt(n * n + .03), 1.); return a * (2. - a); }
        vec3 cloudH(vec2 q, float t, float fall){
          vec2 f = q + vec2(t * 4., 0.);
          float big = jn(vec3(f / 170., t * .015)) - .5;
          float bm = dome(2. * jn(vec3(f / 34. + 7., t * .04)) - 1.), b2 = dome(2. * jn(vec3(f / 12.5 + 3., t * .09)) - 1.), bd = dome(2. * jn(vec3(f / 4.6 + 11., t * .16)) - 1.);
          float h = big * 5. + (bm - .62) * mix(9.5, 3.2, fall) + (b2 - .62) * mix(6., 2.4, fall);
          float be = dome(2. * jn(vec3(f / 1.9 + 4., t * .25)) - 1.);
          float hd = (bd - .62) * mix(1.25, 1.6, fall) + (be - .62) * .5, z = b2 * .5 + bd * .3 + bm * .2;   // cauliflower: two finer sizes of dome, for the shading
          if (fall > .001) {
            float ph = f.x / 10.2 + .9 * jn(vec3(f / 26. + 5., t * .05)), sr = sin(3.14159 * ph), ar = min(sqrt(sr * sr + .1), 1.);
            float rk = ar * (2. - ar) * (.8 + .34 * jn(vec3(f.x / 17., f.y / 9. + 2., t * .08)));     // .42 in the trough between two ranks .. 1.14 on a crest
            float bl = dome(2. * jn(vec3(f / 7.5 + 5., t * .12)) - 1.);
            h += fall * ((rk - .78) * 6.6 + (bl - .62) * 1.6); hd += fall * (rk - .78) * 1.4;
            z = mix(z, .36 + .64 * clamp((rk - .45) / .62, 0., 1.) * (.7 + .3 * bd), fall);
          }
          h -= max(0., h - mix(6.5, 4., fall)) * mix(.7, .8, fall);                           // under the flight line the billows never reach the lens
          return vec3(h, hd, z);
        }`;
      const CLOUD_VS = /* glsl */`
        attribute vec4 aC, aG; uniform float uTime, uOff; uniform vec2 uAx;
        varying vec3 vW, vNb; varying vec4 vC, vG; varying vec2 vQ;
        ${NOISE}
        ${CLOUD_H}
        void main(){
          vec3 p = position; vec2 q = vec2(aC.z, aG.x);
          float h = cloudH(q, uTime, aC.x).x * mix(.25, 1., aC.y);
          h += aG.y * (4.6 + 1.7 * sin(uTime * .55 + q.x * .21 + q.y * .17));     // the sea swells in a collar round every pinnacle, and laps
          p.y += h + uOff; p.xz -= uAx * h * aC.w * .8;                           // the nose of the fall bulges forward as well as up
          vW = p; vC = aC; vG = aG; vQ = q; vNb = normal; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
        }`;
      const cloudOwn = (off, al, seed) => ({ uAx: { value: new THREE.Vector2(ax.x, ax.y) }, uCloudShade: { value: LK.cloud.clone() }, uCloudFar: { value: LK.cloudFar.clone() }, uOff: { value: off }, uA: { value: al }, uSeed: { value: seed } });
      const cm = mkMat({
        transparent: true, own: cloudOwn(0, 1, 0), vertexShader: CLOUD_VS,
        fragmentShader: /* glsl */`
          uniform vec3 uLamp, uLampCol, uPale, uCloudShade, uCloudFar, uSkyCol; uniform float uTime; uniform vec4 uShaft; uniform vec2 uAx;
          varying vec3 vW, vNb; varying vec4 vC, vG; varying vec2 vQ;
          ${NOISE}
          ${ATMOS}
          ${VEIL}
          ${CLOUD_H}
          void main(){
            vec3 toCam = cameraPosition - vW; float dist = max(length(toCam), 1e-3), px = max(length(fwidth(vW.xz)), 1e-3); vec3 V = toCam / dist;
            float t = uTime, fall = vC.x, st = mix(1., .85, fall), e = max(.5, px), k = mix(.25, 1., vC.y);
            vec3 c0 = cloudH(vQ, t, fall), ca = cloudH(vQ + vec2(e * st, 0.), t, fall), cl = cloudH(vQ + vec2(0., e), t, fall);
            float nd = (1. - smoothstep(.3, 1.2, px)) * .6, h = c0.x + c0.y * nd, ha = ca.x + ca.y * nd, hl = cl.x + cl.y * nd;
            // fibres: vapour drawn out along the flow in three sizes, streaming toward the gorge, near the lens only
            float nearK = 1. - smoothstep(30., 85., dist);
            float fa = jn(vec3((vQ.x + t * 9.) / 12., vQ.y / 1.9, t * .12)), fb = jn(vec3((vQ.x + t * 13.) / 4.4, vQ.y / .72 + 3., t * .2)), fc = jn(vec3((vQ.x + t * 18.) / 1.6, vQ.y / .27, t * .35));
            float fine = ((smoothstep(.28, .72, fa) - .5) * .95 + (fb - .5) * .8 * (1. - smoothstep(.2, .6, px)) + (fc - .5) * .45 * (1. - smoothstep(.07, .22, px))) * nearK;   // -1..1
            vec3 Nb = vNb * inversesqrt(max(dot(vNb, vNb), 1e-8));
            vec2 lat = vec2(-uAx.y, uAx.x);
            vec3 N = Nb * (1. + vC.w) - vec3(uAx.x, 0., uAx.y) * ((ha - h) / e * k - fine * .14) - vec3(lat.x, 0., lat.y) * ((hl - h) / e * k) + vec3(lat.x, 0., lat.y) * fine * (.34 + .2 * fall);
            N *= inversesqrt(max(dot(N, N), 1e-8));
            float bl = clamp((c0.z - .36) / .6, 0., 1.);
            float nv = clamp(dot(N, V), 0., 1.), nv0 = max(dot(Nb, V), .02), turn = nv / nv0;     // turn: 1 on level cloud, more on a flank that faces the lens, 0 where a crest goes over
            // milk jade, BACKLIT: the light is ahead of the lens (the Lit Wall across the sea, the notch up the fall), so the
            // flank each billow turns to us is its shaded side: ranks of grey-green flanks under pale tops and frayed crests.
            // Hollows stay grey-green, never dark (not under about .4 of a crest).
            // (the brief: grey-green in the wall's shade so the pale geese read against it, white only on billow crests)
            vec3 Lk = normalize(mix(uLamp - vec3(0., .1, 0.), vec3(uAx.x + lat.x * .5, .45, uAx.y + lat.y * .5), fall));   // down the fall the light comes from the notch and a little from the right
            // (the fall as a whole slopes toward the lens, away from its light: it is in shade, and only what tips over a crest is pale)
            float lit = smoothstep(mix(-.3, -.04, fall), mix(.32, .34, fall), dot(N, Lk));
            lit = min(1., lit + fall * .6 * smoothstep(.55, .95, bl));                            // the top of each rank catches the light from the notch
            float top = mix(.3, smoothstep(mix(.3, .56, fall), .94, bl), 1. - smoothstep(3., 12., px));   // pale only high on a billow (in the fall only the top quarter of each rank, so crest stands against the shaded rank behind); its mean before the billows are under a pixel
            float flankV = smoothstep(1.15, 1.9, turn) * (1. - smoothstep(70., 220., dist)) * (1. - fall);   // over the sea, whatever flank is turned to the lens
            float w = clamp(lit * (.1 + .9 * top) * (1. - .55 * flankV) + fine * mix(.2, .3, fall) + vC.w * .6, 0., 1.);   // the nose of the fall, facing the sky, stays pale
            vec3 lo = uCloudShade * mix(.4, .43, fall) + uSkyCol * .34, hi = uCloudShade * .98 + uCloudFar * .16 + uLampCol * .09;
            vec3 col = mix(lo, hi, w) * (1. + fine * .4);
            float crest = (1. - smoothstep(.06, .5, turn)) * (1. - smoothstep(200., 700., dist));         // each billow's far edge thins out pale
            col = mix(col, uCloudFar * .95 + uLampCol * .08, crest * (.55 + .25 * fall));
            col = mix(col, uCloudFar, smoothstep(500., 2800., dist) * .7) * veil(vW);
            vec2 sd = vW.xz - uShaft.xy; col += (uPale * .9 + uCloudFar * .4) * uShaft.z * (.6 + .6 * w) * exp(-dot(sd, sd) / 900.);
            // the foot of the fall frays out softly over the canopy
            float wn = jn(vec3((vQ.x + t * 6.) / 9., vQ.y / 5., t * .2)) * .6 + jn(vec3((vQ.x + t * 9.) / 3.1, vQ.y / 2.2, t * .4)) * .4;
            float al = vC.y >= .999 ? 1. : smoothstep(0., 1., vC.y * 1.7 - (1. - vC.y) * wn * 1.3) * smoothstep(0., .25, vC.y);
            // near the lens every crest dissolves where it goes over, torn along the fibres, into the rank behind it (the grid is
            // drawn far rows first), so no billow ends in the straight edge of a mesh
            al *= mix(1., smoothstep(.04, .62, turn + fine * .3), (1. - smoothstep(55., 120., dist)) * (1. - vC.w) * (1. - smoothstep(60., 82., abs(vG.z))) * (1. - smoothstep(690., 725., vG.w)) * smoothstep(.9, 1., vC.y));
            if (al < .004) discard;
            col = mix(col, uFogCol, 1. - exp(-dist * uFogD));
            gl_FragColor = vec4(max(col, 0.), al);
          }`,
      });
      cloud = new THREE.Mesh(cg, cm); cloud.name = 'cloud-sea'; cloud.renderOrder = -1; scene.add(cloud);
      await ctx.yield();
      // (1b) the underlay: the same surface 2.2 m down over the flight's corridor, plain deep vapour, drawn first. Where a
      // crest of the grid above dissolves this is what shows through it (never the gorge floor or the basin under the sea).
      { const um = new THREE.Mesh(sg, mkMat({ transparent: true, own: cloudOwn(-2.2, 1, 0), vertexShader: CLOUD_VS,
          fragmentShader: /* glsl */`
            uniform vec3 uCloudShade, uCloudFar, uSkyCol; uniform float uTime;
            varying vec3 vW, vNb; varying vec4 vC, vG; varying vec2 vQ;
            ${NOISE}
            ${ATMOS}
            ${VEIL}
            void main(){
              float a = smoothstep(.8, 1., vC.y); if (a < .004) discard;
              float dist = length(cameraPosition - vW), n = jn(vec3((vQ.x + uTime * 5.) / 9., vQ.y / 5., uTime * .1));
              vec3 col = (uCloudShade * .64 + uSkyCol * .26 + uCloudFar * .07) * (.9 + .2 * n) * veil(vW);
              gl_FragColor = vec4(max(mix(col, uFogCol, 1. - exp(-dist * uFogD)), 0.), a);
            }` }));
        um.name = 'cloud-underlay'; um.renderOrder = -2; um.frustumCulled = false; scene.add(um); }
      await ctx.yield();
      // (2) the torn sheets
      const sheetFS = /* glsl */`
        uniform vec3 uLampCol, uPale, uCloudShade, uCloudFar; uniform float uTime, uA, uSeed; uniform vec4 uShaft;
        varying vec3 vW, vNb; varying vec4 vC, vG; varying vec2 vQ;
        ${NOISE}
        ${ATMOS}
        ${VEIL}
        void main(){
          vec3 toCam = cameraPosition - vW; float dist = max(length(toCam), 1e-3), px = max(length(fwidth(vW.xz)), 1e-3);
          float t = uTime, fall = vC.x, k2 = 1. - smoothstep(.4, 1.2, px), k3 = 1. - smoothstep(.12, .4, px);
          // vapour torn into fibres along the flow, holes between; each octave gives way to its mean before it is a pixel wide
          float f1 = jn(vec3((vQ.x + t * 7.) / 12., vQ.y / 4.4, t * .12 + uSeed)), f2 = jn(vec3((vQ.x + t * 11.) / 3.8, vQ.y / 1.4, t * .2 + uSeed * 2.)), f3 = jn(vec3((vQ.x + t * 16.) / 1.3, vQ.y / .5, t * .33));
          float n = f1 * .56 + mix(.15, f2 * .3, k2) + mix(.07, f3 * .14, k3);
          float torn = smoothstep(mix(.54, .47, fall), mix(.78, .73, fall), n);
          vec3 Nb = vNb * inversesqrt(max(dot(vNb, vNb), 1e-8)); float nv = abs(dot(Nb, toCam / dist));
          float a = torn * uA * mix(.6, .42, fall) * (1. + (1. - nv) * .4);
          a *= smoothstep(3., 12., dist) * mix(.3, 1., smoothstep(14., 50., dist)) * (1. - smoothstep(90., 220., dist) * (1. - .75 * fall)) * (1. - smoothstep(110., 150., abs(vG.z))) * (1. - smoothstep(680., 728., vG.w)) * smoothstep(.1, .5, vC.y);
          a = min(a, .85);
          if (a < .004) discard;
          vec3 col = (uCloudShade * 1.02 + uCloudFar * .19 + uLampCol * .09) * (.86 + .3 * n) * veil(vW);
          vec2 sd = vW.xz - uShaft.xy; col += (uPale * .9 + uCloudFar * .4) * uShaft.z * .8 * exp(-dot(sd, sd) / 900.);
          col = mix(col, uFogCol, 1. - exp(-dist * uFogD));
          gl_FragColor = vec4(max(col, 0.), a);
        }`;
      for (const [off, al, seed, ro] of [[1.5, 0.27, 3.1, 0], [3.3, 0.17, 8.7, 1]]) {
        const m = new THREE.Mesh(sg, mkMat({ transparent: true, depthWrite: false, own: cloudOwn(off, al, seed), vertexShader: CLOUD_VS, fragmentShader: sheetFS }));
        m.name = 'cloud-sheet'; m.renderOrder = ro; m.frustumCulled = false; scene.add(m);
      }
      await ctx.yield();
      // (3) torn streamers: soft streaks carried along the flow
      { const wr = rng.fork('wisps'), L = [], NK = (n) => Math.round(n * (0.6 + 0.4 * detail)), dirOf = (yaw) => [ax.x * Math.cos(yaw) - rx.x * Math.sin(yaw), ax.y * Math.cos(yaw) - rx.y * Math.sin(yaw)];
        // THE CLOUD-FALL: the sea spills over the alp and through the notch as a river of torn streamers that follows the water down
        // the hanging valley and over the headwall, and frays out above the red canopy (the gorge shows under it all the way)
        for (let i = NK(200); i > 0; i--) { const A = wr.range(118, 352), up = smoothstep(200, 225, A), p = streamP(A) + 2.5 * Math.sin(A / 29) + wr.range(-1, 1) * (4.5 + 5 * braidK(A) + 5 * (1 - up)), l = p + plAt(A);
          worldOf(A, p, w); const d = dirOf(wr.range(-0.2, 0.2)), slope = (hAL(A + 7, l) - hAL(A - 7, l)) / 14;
          L.push([w.x, hAL(A, l) + wr.range(1.6, 6) + 3 * (1 - up) * wr(), w.z, wr(), d[0], d[1], wr.range(8, 18), wr.range(1.5, 4.2) * lerp(1, 0.62, up), wr.range(7, 12), 36, wr.range(0.34, 0.6) * lerp(1, 0.42, up), clamp(slope, 0, 0.9)]); }
        for (let i = NK(26); i > 0; i--) { const A = wr.range(92, 150); worldOf(A, wr.range(-30, 30), w); const d = dirOf(wr.range(-0.7, 0.7));                        // fraying out over the canopy
          L.push([w.x, wr.range(84, 97) + Math.max(0, A - 120) * 0.3, w.z, wr(), d[0], d[1], wr.range(8, 18) * 1.3, wr.range(2.2, 5.5), wr.range(1.5, 4), 30, wr.range(0.35, 0.65), 0]); }
        for (let i = NK(26); i > 0; i--) { const A = wr.range(240, 340), p = (wr.chance(0.5) ? 1 : -1) * wr.range(9, 19); worldOf(A, p, w); const d = dirOf(Math.PI / 2 + wr.range(-0.7, 0.7));   // across the notch along both walls
          L.push([w.x, hAL(A, p + plAt(A)) + wr.range(3, 12), w.z, wr(), d[0], d[1], wr.range(10, 22), wr.range(1.6, 3.4), wr.range(6, 11), 70, wr.range(0.13, 0.24), 0.2]); }
        for (let i = NK(70); i > 0; i--) { worldOf(wr.range(330, 530), (wr.chance(0.5) ? 1 : -1) * wr.range(50, 112), w); const d = dirOf(Math.PI / 2 + wr.range(-0.7, 0.7));          // over the sea off both shores of the alp
          L.push([w.x, CLOUD_Y + wr.range(3.5, 9.5), w.z, wr(), d[0], d[1], wr.range(9, 20), wr.range(1.5, 3.4), wr.range(6, 11), 60, wr.range(0.22, 0.38), 0]); }
        for (const pk of pinn) { if (!pk.near) continue;                                                                                                               // curling round each pinnacle's foot
          for (let k = 0; k < 3; k++) { const th = wr.range(0, 6.28), rr = pk.r * 0.8 + 2.5;
            L.push([pk.x + Math.cos(th) * rr, CLOUD_Y + wr.range(3.5, 9), pk.z + Math.sin(th) * rr, wr(), -Math.sin(th), Math.cos(th), pk.r * wr.range(1.2, 1.8), wr.range(2.6, 4.6), wr.range(0.8, 1.6), 7, wr.range(0.4, 0.6), 0]); } }
        const NW = L.length, g = new THREE.InstancedBufferGeometry(), iA = new Float32Array(NW * 4), iB = new Float32Array(NW * 4), iC = new Float32Array(NW * 4);
        g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        L.forEach((o, i) => { iA.set([o[0], o[1], o[2], o[3]], i * 4); iB.set([o[4], o[5], o[6], o[7]], i * 4); iC.set([o[8], o[9], o[10], o[11]], i * 4); });
        g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
        g.instanceCount = NW;
        const wm = new THREE.Mesh(g, mkMat({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
          own: { uAx: { value: new THREE.Vector2(ax.x, ax.y) }, uCloudShade: { value: LK.cloud.clone() }, uCloudFar: { value: LK.cloudFar.clone() } },
          vertexShader: /* glsl */`
            attribute vec4 iA, iB, iC; uniform float uTime; uniform vec2 uAx;
            varying vec2 vUv; varying vec4 vK;
            void main(){
              float ph = fract(uTime * iC.x / iC.y + iA.w), run = (ph - .5) * iC.y;
              vec3 c = iA.xyz - vec3(uAx.x, iC.w, uAx.y) * run;                                 // carried down the flow, round and round
              vec3 axis = normalize(vec3(iB.x, 0., iB.y)), view = c - cameraPosition; float dist = max(length(view), 1e-3);
              vec3 side = cross(axis, view / dist); side = side * inversesqrt(max(dot(side, side), 1e-4));
              vec3 wp = c + axis * position.x * iB.z + side * position.y * iB.w * (.7 + .6 * ph);
              vUv = position.xy; vK = vec4(sin(ph * 3.1416) * iC.z * smoothstep(5., 16., dist) * (1. - smoothstep(260., 420., dist)), iA.w * 37., iB.z / iB.w, ph);
              gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
            }`,
          fragmentShader: /* glsl */`
            uniform vec3 uCloudShade, uCloudFar, uSkyCol, uLampCol, uFogCol; uniform float uTime;
            varying vec2 vUv; varying vec4 vK;
            ${NOISE}
            void main(){
              float n = jn(vec3(vUv.x * vK.z * .55 + vK.y, vUv.y * 1.3 + vK.y, uTime * .25)) * .6 + jn(vec3(vUv.x * vK.z * 1.6 - uTime * .3, vUv.y * 3.2, vK.y)) * .4;
              float ex = 1. - vUv.x * vUv.x, body = exp(-vUv.y * vUv.y * 3.2) * ex * ex;
              float a = body * smoothstep(.28, .8, n + body * .35) * vK.x * (1. - smoothstep(.75, 1., abs(vUv.y)));
              if (a < .003) discard;
              vec3 col = (uCloudShade * 1.1 + uCloudFar * .46 + uLampCol * .1) * (.66 + .3 * (vUv.y * .5 + .5) + .4 * n) + uSkyCol * .12;
              gl_FragColor = vec4(col, a);
            }` }));
        wm.frustumCulled = false; wm.renderOrder = 2; wm.name = 'cloud-wisps'; scene.add(wm); }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the sky: deep teal to ivory-celadon, a glow where the sun hides
    const sky = new THREE.Mesh(new THREE.SphereGeometry(7600, 32, 20), mkMat({
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      own: { uZen: { value: LK.zen.clone() }, uMid: { value: LK.mid.clone() }, uHor: { value: LK.hor.clone() }, uStars: { value: LK.stars }, uGlow: { value: LK.glow } },
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZen, uMid, uHor, uSun, uSunCol, uFogCol; uniform float uTime, uStars, uGlow;
        varying vec3 vDir;
        ${NOISE}
        void main(){
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 col = mix(mix(uHor, uMid, smoothstep(-.01, .2, h)), uZen, smoothstep(.16, .8, h));
          float cs = max(dot(d, uSun), 0.);
          col += uSunCol * uGlow * (pow(cs, 6.) * .06 + pow(cs, 40.) * .14 + pow(cs, 400.) * .4);
          // thin cirrus veils
          vec2 cp = d.xz / max(d.y + .3, .08);
          float ci = jn(vec3(cp * vec2(1.3, 3.6) + vec2(uTime * .006, 0.), 1.)) * .65 + jn(vec3(cp * vec2(4., 9.) + vec2(uTime * .01, 3.), 2.)) * .35;
          col += (uHor * .5 + uSunCol * .12 * pow(cs, 3.)) * smoothstep(.56, .9, ci) * smoothstep(.02, .3, h) * .4;
          if (uStars > .5) {
            vec3 g = d * 190., gi = floor(g); float r = jh(gi), tw = .6 + .4 * sin(uTime * 2.3 + r * 60.);
            float sdot = 1. - smoothstep(.1, .34, length(fract(g) - .5));
            col += vec3(.7, .82, 1.) * step(.992, r) * sdot * tw * smoothstep(.02, .25, h) * 1.3;
          }
          col = mix(col, uFogCol, 1. - smoothstep(-.06, .03, h));
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    sky.renderOrder = -10; sky.frustumCulled = false; sky.name = 'sky'; scene.add(sky);

    // ---------------------------------------------------------------- rind: one matt material for every plant and loose stone
    // (the boulder's brown skin: russet, umber and red; lit by the sky from above and the wall from the side, a thin rim toward the sun)
    const rindMat = mkMat({
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute float aF; attribute vec4 aS;
        uniform float uTime, uGale; uniform vec3 uWind;
        varying vec3 vW, vN, vC, vO; varying float vF, vB, vSd;
        void main(){
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
          // gust bands roll through the crowns; small things shiver
          float g = sin(uTime * 1.25 + dot(wp.xz, vec2(.05, .034))) * .6 + sin(uTime * 3.1 + aS.x * 6.28) * .25 + sin(uTime * 7.3 + aS.x * 40.) * .2 * step(3., aS.z);
          wp.xz += uWind.xz * (g + .4) * max(wp.y - instanceMatrix[3].y, 0.) * aS.z * .03 * (1. + uGale);
          vW = wp.xyz; vN = mat3(modelMatrix) * (mat3(instanceMatrix) * normal); vC = aCol * aS.y; vO = position; vSd = aS.x * 17.; vF = aF; vB = aS.w;   // aS.w: 1 sinks into the cloud sea, 2 stands half-drifted in snow
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun, uSunCol, uSkyCol, uLamp, uLampCol, uAccent, uSnowCol;
        varying vec3 vW, vN, vC, vO; varying float vF, vB, vSd;
        ${NOISE}
        ${ATMOS}
        ${VEIL}
        void main(){
          vec3 N = vN * inversesqrt(max(dot(vN, vN), 1e-8)); if (!gl_FrontFacing) N = -N;
          vec3 toCam = cameraPosition - vW; float dist = max(length(toCam), 1e-3); vec3 V = toCam / dist;
          float px = max(length(fwidth(vW)), 1e-3), fd = 1. - smoothstep(.25, .7, px);
          float sp = jn((vO + vSd) * 2.6), sp2 = jn((vO + vSd) * 7.1 + 4.);
          vec3 alb = vC * (.72 + .56 * mix(.5, sp * .6 + sp2 * .4, fd));
          // flower trusses: the one accent
          if (vF > .01) {
            // round trusses scattered over the dark leaf (a stereographic map of the dome keeps them round all over it)
            vec3 dn = vO - vec3(0., .3, 0.); dn *= inversesqrt(max(dot(dn, dn), 1e-6));
            vec2 st = dn.xz / (1.2 + dn.y) * 12.5 + vSd, ci = floor(st), cf = fract(st); float best = 4., bid = 0.;
            for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
              vec2 g = vec2(float(x), float(y)); vec3 h3 = vec3(ci + g, 3.);
              vec2 r = g + .22 + .56 * vec2(jh(h3), jh(h3 + 7.7)) - cf; float q = dot(r, r);
              if (q < best) { best = q; bid = jh(h3 + 19.3); }
            }
            float dsp = sqrt(best), wpx = px * 2.2, truss = (1. - smoothstep(.3 - wpx, .36 + wpx, dsp)) * step(.26, bid);
            alb *= 1. - .45 * fd * (1. - smoothstep(.36, .5, dsp)) * step(.26, bid);                 // the shadow each truss sits in
            alb = mix(alb, uAccent * (.8 + 1.2 * (1. - smoothstep(0., .34, dsp))) * (.8 + .5 * fract(bid * 7.3)), vF * mix(.42, truss, fd));
          }
          float hemi = N.y * .5 + .5, lam = max(dot(N, uLamp), 0.);
          vec3 light = uSkyCol * (.6 + .9 * hemi) + uLampCol * (.2 + .8 * lam) * .95; light = mix(light, vec3(dot(light, vec3(.3, .5, .2))), .55);
          vec3 col = alb * light * 1.6;
          float c = max(dot(-V, uSun), 0.);
          col += alb * uSunCol * pow(clamp(1. - max(dot(N, V), 0.), 0., 1.), 3.) * (.12 + .6 * c * c);
          if (vB > 1.5) {                                         // a boulder on the col: a cap of drift on its top and lee side, blue shade at its foot
            float cap = smoothstep(.2, .52, N.y + (sp - .5) * .5 - dot(N.xz, uLamp.xz) * .12);
            vec3 sc = uSnowCol * (uSkyCol * (.8 + 1.1 * hemi) + uLampCol * (.1 + .9 * lam));
            col = mix(col * (.55 + .45 * smoothstep(-.3, .25, vO.y)), mix(sc, vec3(dot(sc, vec3(.3, .5, .2))), .35), cap);
          }
          gl_FragColor = vec4(max(atmos(col * veil(vW), vW, dist, min(vB, 1.)), 0.), 1.);
        }`,
    });
    // tiny builder for rind geometry: position + aCol + aF (flower weight)
    const RB = () => ({ P: [], C: [], Fw: [], I: [] });
    const rbGeo = (b, indexed = true) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(b.C, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(b.Fw, 1));
      if (indexed) g.setIndex(b.I); g.computeVertexNormals(); return g;
    };
    const rbv = (b, x, y, z, c, f = 0) => { b.P.push(x, y, z); b.C.push(c[0], c[1], c[2]); b.Fw.push(f); return b.P.length / 3 - 1; };
    const mixc = (a, b2, t) => [lerp(a[0], b2[0], t), lerp(a[1], b2[1], t), lerp(a[2], b2[2], t)];
    const gr = rng.fork('rind');
    // rhododendron: a carved dome with flower bosses
    const domeGeo = (rings, sides, seed) => {
      const b = RB(), umber = [0.05, 0.028, 0.018], russet = [0.2, 0.085, 0.04];
      for (let r = 0; r <= rings; r++) {
        const phi = Math.max(0.02, (r / rings) * Math.PI * 0.63);
        for (let s = 0; s < sides; s++) {
          const th = (s / sides) * 6.2832 + (r & 1) * (3.1416 / sides), dx = Math.sin(phi) * Math.cos(th), dy = Math.cos(phi), dz = Math.sin(phi) * Math.sin(th);
          const boss = smoothstep(0.05, 0.5, noise.n3(dx * 3.1 + seed, dy * 3.1, dz * 3.1 + seed)), lump = 1 + 0.24 * noise.n3(dx * 1.9 + seed, dy * 1.9 + 3, dz * 1.9) + 0.11 * noise.n3(dx * 4.6, dy * 4.6 + seed, dz * 4.6) + 0.09 * boss;
          rbv(b, dx * lump, dy * lump * 0.74 + 0.3, dz * lump, mixc(umber, russet, 0.12 + 0.55 * boss * dy + 0.5 * (lump - 1)), (0.45 + 0.55 * boss) * smoothstep(-0.3, 0.25, dy));
        }
      }
      for (let r = 0; r < rings; r++) for (let s = 0; s < sides; s++) { const a = r * sides + s, c = r * sides + (s + 1) % sides, d = a + sides, e = c + sides; b.I.push(a, d, c, c, d, e); }
      return rbGeo(b);
    };
    const firGeo = () => {
      const b = RB(), dk = [0.03, 0.027, 0.02], tip = [0.13, 0.065, 0.032], S = 7;
      for (let t = 0; t < 6; t++) {
        const yb = 0.1 + t * 0.143, r = 0.17 * (1 - t / 6.6), base = b.P.length / 3;
        for (let s = 0; s < S; s++) { const th = (s / S) * 6.2832 + t * 0.6, k = 1 + 0.18 * Math.cos(s * 2.4 + t); rbv(b, Math.cos(th) * r * k, yb - 0.035 * k, Math.sin(th) * r * k, tip); }
        const apex = rbv(b, 0, yb + 0.3, 0, dk);
        for (let s = 0; s < S; s++) b.I.push(base + s, apex, base + (s + 1) % S);
      }
      const t0 = b.P.length / 3; for (let s = 0; s < 4; s++) { const th = s * 1.5708; rbv(b, Math.cos(th) * 0.022, 0, Math.sin(th) * 0.022, dk); rbv(b, Math.cos(th) * 0.014, 0.3, Math.sin(th) * 0.014, dk); }
      for (let s = 0; s < 4; s++) { const a = t0 + s * 2, c = t0 + ((s + 1) % 4) * 2; b.I.push(a, a + 1, c, c, a + 1, c + 1); }
      return rbGeo(b);
    };
    const birchGeo = () => {
      // pale crooked stem with dark bark bands, upswept limbs, and a fan of russet twigs at every limb end (gold leaf clumps in October)
      const b = RB(), bark = [0.62, 0.59, 0.5], band = [0.16, 0.14, 0.12], twig = autumn ? [0.42, 0.22, 0.05] : [0.3, 0.13, 0.09], bud = autumn ? [0.6, 0.33, 0.045] : [0.36, 0.17, 0.11], br = gr.fork('birch');
      const ring = (p, d, r, c, S) => { const u = new THREE.Vector3(1, 0, 0).cross(d); if (u.lengthSq() < 1e-4) u.set(0, 0, 1); u.normalize(); const w2 = new THREE.Vector3().crossVectors(d, u), base = b.P.length / 3;
        for (let s = 0; s < S; s++) { const th = (s / S) * 6.2832; rbv(b, p.x + (u.x * Math.cos(th) + w2.x * Math.sin(th)) * r, p.y + (u.y * Math.cos(th) + w2.y * Math.sin(th)) * r, p.z + (u.z * Math.cos(th) + w2.z * Math.sin(th)) * r, c); } return base; };
      const limb = (pts, rad, cols, S) => { let prev = -1; for (let i = 0; i < pts.length; i++) { const d = new THREE.Vector3().subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize(), cur = ring(pts[i], d, rad[i], cols[i % cols.length], S);
        if (prev >= 0) for (let s = 0; s < S; s++) { const a = prev + s, c = prev + (s + 1) % S; b.I.push(a, a + (cur - prev), c, c, a + (cur - prev), c + (cur - prev)); } prev = cur; } };
      const fan = (p, dir, len, n) => { const side = new THREE.Vector3(-dir.z, 0, dir.x); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize();
        for (let i = 0; i < n; i++) { const sp = (i / (n - 1) - 0.5) * 1.5, l = len * br.range(0.7, 1.15), up = br.range(0.25, 0.8), wdt = 0.0085;
          const tip = new THREE.Vector3(p.x + (dir.x * Math.cos(sp) + side.x * Math.sin(sp)) * l, p.y + up * l + Math.abs(sp) * -0.05, p.z + (dir.z * Math.cos(sp) + side.z * Math.sin(sp)) * l);
          for (const o of [[side.x, 0, side.z], [0, 1, 0]]) { const a = rbv(b, p.x - o[0] * wdt, p.y - o[1] * wdt, p.z - o[2] * wdt, twig), c = rbv(b, p.x + o[0] * wdt, p.y + o[1] * wdt, p.z + o[2] * wdt, twig), t = rbv(b, tip.x, tip.y, tip.z, bud, autumn ? 0 : 0.2); b.I.push(a, c, t); } } };
      const blob = (p, r) => { const base = b.P.length / 3, RR = 3, SS = 6, sd = br.range(0, 9), dkb = [bud[0] * 0.45, bud[1] * 0.4, bud[2] * 0.5];
        rbv(b, p.x, p.y + r * 0.85, p.z, bud);
        for (let i = 1; i <= RR; i++) for (let s2 = 0; s2 < SS; s2++) { const ph = (i / (RR + 0.6)) * Math.PI, th = (s2 / SS) * 6.2832 + i * 0.5, k = r * (0.8 + 0.4 * Math.abs(Math.sin(s2 * 2.3 + i * 1.7 + sd))); rbv(b, p.x + Math.sin(ph) * Math.cos(th) * k, p.y + Math.cos(ph) * k * 0.8, p.z + Math.sin(ph) * Math.sin(th) * k, mixc(bud, dkb, 0.2 + 0.7 * i / RR)); }
        for (let s2 = 0; s2 < SS; s2++) b.I.push(base, base + 1 + s2, base + 1 + (s2 + 1) % SS);
        for (let i = 0; i < RR - 1; i++) for (let s2 = 0; s2 < SS; s2++) { const a = base + 1 + i * SS + s2, c = base + 1 + i * SS + (s2 + 1) % SS; b.I.push(a, a + SS, c, c, a + SS, c + SS); } };
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      limb([V(0, 0, 0), V(0.012, 0.2, 0.005), V(-0.006, 0.42, 0.012), V(0.02, 0.62, -0.004), V(0.03, 0.82, 0.01), V(0.045, 1, 0.02)], [0.036, 0.03, 0.025, 0.019, 0.012, 0.004], [band, bark, bark, band, bark, bark], 6);
      fan(V(0.045, 1, 0.02), V(0.4, 0, 0.2).normalize(), 0.16, 4);
      for (let i = 0; i < 7; i++) { const y = 0.34 + i * 0.09, an = i * 2.4 + br.range(0, 1), len = br.range(0.2, 0.36) * (1 - i * 0.05), cx = Math.cos(an), cz = Math.sin(an), p0 = V(0.01, y, 0.005), p1 = V(cx * len * 0.55, y + len * 0.3, cz * len * 0.55), p2 = V(cx * len, y + len * 0.78, cz * len);
        limb([p0, p1, p2], [0.012, 0.008, 0.004], [bark, bark, twig], 4); fan(p2, V(cx, 0, cz), 0.2, 5); if (autumn) blob(p2.clone().add(V(cx * 0.04, 0.06, cz * 0.04)), br.range(0.09, 0.14)); }
      if (autumn) blob(V(0.05, 0.98, 0.02), 0.12);
      return rbGeo(b);
    };
    const instList = { d0: [], d1: [], d2: [], dw: [], dw2: [], fir: [], birch: [], stoneA: [], stoneB: [], tuft: [], cush: [] };
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
    const mkInst = (geo, list, name) => {
      if (!list.length) return null;
      const m = new THREE.InstancedMesh(geo, rindMat, list.length), aS = new Float32Array(list.length * 4);
      list.forEach((o, i) => { _q.setFromAxisAngle(UP, o.rot); if (o.tilt) _q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), o.tilt)); _m4.compose(_p.set(o.x, o.y, o.z), _q, _s.set(o.s, o.sy ?? o.s, o.s)); m.setMatrixAt(i, _m4); aS.set([o.ph, o.tint, o.sway, o.basin || 0], i * 4); });
      geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.name = name; scene.add(m); return m;
    };
    // ---- the gorge forest
    { const w = new THREE.Vector3(), fr = gr.fork('forest'), thin = detail * (0.75 + 0.25 * dens);
      for (let a = -70; a < 330; a += 5.8) for (let p = -104; p <= 104; p += 5.8) {
        const aa = a + fr.range(-2.7, 2.7), pp = p + fr.range(-2.7, 2.7), r1 = fr(), r2 = fr(), r3 = fr(), r4 = fr();
        const l = pp + plAt(aa), y = hAL(aa, l), slope = Math.hypot(hAL(aa + 2, l) - hAL(aa - 2, l), hAL(aa, l + 2) - hAL(aa, l - 2)) / 4;
        if (slope > 1.8 || y > 270 || Math.abs(pp - streamP(aa)) < (aa < 205 ? 5.5 : 4 + 9 * braidK(aa))) continue;
        const hw = lerp(38, 19, smoothstep(215, 300, aa)), onFloor = Math.abs(pp) < hw + 4, py = pyAt(aa), ap = Math.abs(pp);
        const hv = onFloor && aa > 214;                                     // the hanging valley: treeline scrub, thin and low, open to the water
        if (hv && r4 > 0.52) continue;
        worldOf(aa, pp, w);
        const o = { x: w.x, y, z: w.z, rot: r1 * 6.28, ph: r2, tint: 0.8 + 0.4 * r3, basin: 0 };
        if (slope > 1.0) { if (ap > (aa > 250 ? 34 : 24) && r4 < 0.7) instList.fir.push(Object.assign(o, { s: 12 + 12 * r3, sway: 0.5, y: y - 1.5 })); }   // firs cling to the steep ledges
        else if (hv ? r4 < 0.34 : onFloor ? r4 < 0.86 : r4 < 0.3) {         // rhododendron
          const R = hv ? 1.5 + 1.7 * r3 : 3.9 + 2.3 * r3; if (y + R * 1.1 > py - 8 && ap < 16) continue;
          Object.assign(o, { s: R, sy: R * (0.85 + 0.3 * r2), y: y - 0.4, sway: 1.1 });
          if (hv) instList.d1.push(o); else if (ap < 15) instList.d0.push(o); else if (ap < 36) { if (fr() < 0.55 + 0.45 * thin) instList.d1.push(o); } else if (fr() < thin) instList.d2.push(o);
        } else if (onFloor ? r4 < 0.95 : r4 < 0.55) { if (hv ? ap > 9 && y + 6.5 < py - 6 : ap > 25) instList.birch.push(Object.assign(o, { s: hv ? 4 + 2.5 * r3 : 8 + 5 * r3, sway: 1.6, tint: 0.85 + 0.3 * r3 })); }
        else if (ap > (aa > 250 ? 34 : 24) && fr() < 0.5 + 0.5 * thin) instList.fir.push(Object.assign(o, { s: 13 + 12 * r3, sway: 0.5, y: y - 0.6 }));
      } }
    await ctx.yield();
    // where the water is (the same formulas as the jade shader draws it with): nothing is planted in it
    const chanD = (a, p) => { const B = braidK(a), q = p - streamP(a);
      return Math.min(Math.abs(q - B * 5 * Math.sin(a * 0.052 + 1)) - (1.5 + 0.5 * Math.sin(a * 0.11)), Math.abs(q - B * (1.5 - 4.4 * Math.sin(a * 0.047 + 2.6))) - (1.05 + 0.4 * Math.sin(a * 0.17 + 1)), Math.abs(q - B * (7.5 * Math.sin(a * 0.031 + 4.2) - 1)) - (0.85 + 0.3 * Math.sin(a * 0.21 + 2))); };
    const wetAt = (a, p, m) => (a > 356 && a < 480 && tarnT(a, p) > -m * 0.05) || (a > 203 && a < 376 && chanD(a, p) < m);
    // ---- dwarf rhododendron: knee-high red-flowering domes in clumps along the braids' banks, round the tarn and over the alp
    { const w = new THREE.Vector3(), dr = gr.fork('dwarf'), n = Math.round(270 * detail * (0.75 + 0.25 * dens));
      for (let c = 0; c < n; c++) {
        const a = dr.range(216, 668), cp0 = (dr() < 0.5 ? -1 : 1) * (2 - Math.log(1 - dr() * 0.95) * 8.5), m = 2 + dr.int(0, 3);
        for (let k = 0; k < m; k++) {
          const aa = a + dr.range(-2.8, 2.8), pp = cp0 + dr.range(-2.8, 2.8), R = dr.range(0.55, 1.45) * (aa < 330 ? 1.3 : 1), r1 = dr(), r2 = dr(), r3 = dr();
          const y = hAL(aa, pp + plAt(aa));
          if ((aa < 322 ? Math.abs(pp) > hwAt(aa) - 5 : y < TARN_Y + 0.6) || wetAt(aa, pp, 1.2) || y + R > pyAt(aa) - 6.5 || (aa > 451 && aa < 527 && pp > 6 && pp < 37) || (benchW(aa) > 0.05 && pp > 3.6 && pp < 20) || (aa > 500 && (r3 > 0.62 || Math.abs(pp) > 26)) || (aa > 698 && aa < 731 && pp < -6)) continue;   // (not on the herd's terrace, not in the hunt's lane; thinner up the spur)
          worldOf(aa, pp, w); (aa < 430 ? instList.dw : instList.dw2).push({ x: w.x, y: y - 0.16 * R, z: w.z, rot: r1 * 6.28, ph: r2, tint: 0.85 + 0.45 * r3, s: R, sy: R * (0.7 + 0.35 * r2), sway: 2.6, basin: 0 });
        }
      } }
    const forest = [mkInst(domeGeo(7, 13, 3.3), instList.d0, 'rhodo-near'), mkInst(domeGeo(4, 8, 7.1), instList.d1, 'rhodo-mid'), mkInst(domeGeo(2, 6, 1.7), instList.d2, 'rhodo-far'), mkInst(domeGeo(4, 8, 5.3), instList.dw, 'rhodo-dwarf'), mkInst(firGeo(), instList.fir, 'firs'), mkInst(birchGeo(), instList.birch, 'birches'), mkInst(domeGeo(4, 8, 5.3), instList.dw2, 'rhodo-dwarf-spur')];
    await ctx.yield();
    // ---- the spur: scree stones, sedge tussocks, cushion plants
    const stoneGeo = (d, seed) => {
      const src = new THREE.IcosahedronGeometry(1, d), P = src.attributes.position, b = RB(), sr = gr.fork('stone' + seed);
      for (let f = 0; f < P.count; f += 3) {
        const cx = (P.getX(f) + P.getX(f + 1) + P.getX(f + 2)) / 3, cy = (P.getY(f) + P.getY(f + 1) + P.getY(f + 2)) / 3, cz = (P.getZ(f) + P.getZ(f + 1) + P.getZ(f + 2)) / 3, sh = 0.78 + 0.5 * sr();
        let c = [0.105 * sh, 0.15 * sh, 0.118 * sh];
        const li = Math.sin(cx * 2.3 + seed) * Math.cos(cz * 1.9 - seed) + 0.25 * cy;                       // lichen lies in a patch or two on the top
        if (cy > -0.05 && li > 0.42) c = mixc(c, seed === 2 ? [0.3, 0.17, 0.08] : [0.34, 0.29, 0.12], 0.75);
        for (let k = 0; k < 3; k++) { const x = P.getX(f + k), y = P.getY(f + k), z = P.getZ(f + k), j = 1 + 0.3 * noise.n3(x * 1.4 + seed, y * 1.4, z * 1.4) + 0.12 * noise.n3(x * 3.7, y * 3.7 + seed, z * 3.7); rbv(b, x * j * 1.15, y * j * 0.62, z * j, mixc(c, [0.02, 0.03, 0.025], y < -0.2 ? 0.7 : 0)); } }
      src.dispose(); return rbGeo(b, false);
    };
    const tuftGeo = () => { const b = RB(), tr = gr.fork('tuft'), c0 = [0.16, 0.09, 0.03], c1 = [0.6, 0.47, 0.2];
      for (let i = 0; i < 10; i++) { const an = (i / 10) * 6.2832 + tr.range(-0.3, 0.3), ln = tr.range(0.12, 0.5), h = tr.range(0.35, 0.62), cx = Math.cos(an), cz = Math.sin(an), a = rbv(b, cx * 0.05 - cz * 0.045, 0, cz * 0.05 + cx * 0.045, c0), c = rbv(b, cx * 0.05 + cz * 0.045, 0, cz * 0.05 - cx * 0.045, c0), t = rbv(b, cx * ln, h, cz * ln, c1); b.I.push(a, c, t); }
      return rbGeo(b); };
    const cushGeo = () => { const b = RB(), S = 7, c0 = [0.11, 0.06, 0.035], c1 = [0.26, 0.13, 0.06];
      for (let r = 0; r <= 3; r++) for (let s = 0; s < S; s++) { const phi = Math.max(0.03, (r / 3) * 1.45), th = (s / S) * 6.2832 + r * 0.3, k = 1 + 0.16 * Math.cos(s * 2.1 + r); rbv(b, Math.sin(phi) * Math.cos(th) * k, Math.cos(phi) * 0.5, Math.sin(phi) * Math.sin(th) * k, mixc(c1, c0, r / 3), r < 2 ? 0.8 : 0.15); }
      for (let r = 0; r < 3; r++) for (let s = 0; s < S; s++) { const a = r * S + s, c = r * S + (s + 1) % S; b.I.push(a, a + S, c, c, a + S, c + S); }
      return rbGeo(b); };
    { const w = new THREE.Vector3(), sr = gr.fork('spur'), nSt = Math.round(2300 * detail), nTu = Math.round(3600 * detail * dens), nCu = Math.round(440 * detail * dens);
      const place = (aLo, aHi, spread) => { const a = sr.range(aLo, aHi), p = (sr() < 0.5 ? -1 : 1) * (-Math.log(1 - sr() * 0.97) * spread), l = p + plAt(a); worldOf(a, p, w);
        return { a, p, x: w.x, z: w.z, y: hAL(a, l), steep: Math.hypot(hAL(a + 1.5, l) - hAL(a - 1.5, l), hAL(a, l + 1.5) - hAL(a, l - 1.5)) / 3, rot: sr() * 6.28, ph: sr(), basin: 1 }; };
      const onTer = (o) => (o.a > 452 && o.a < 526 && o.p > 7 && o.p < 37) || (o.a > 700 && o.a < 729 && o.p < -7 && o.p > -24);      // the herd's terrace and its crag, the lookout rock: nothing taller than a hoof
      // the hunt's lane (the snow tongue and the foot of the black rib the leopard runs along) is kept clear of everything but
      // pebbles, so nothing stands between the animals and the lens; on the col's snow only boulders and a few tussock clumps
      // at its ragged edge stand out of the drift
      const lane = (o) => benchW(o.a) > 0.05 && o.p > 4.4 && o.p < 19.5, colSn = (o) => colSnowAt(o.a, o.p, o.x, o.z);
      // (the same scatter runs back down the alp and the hanging valley to the headwall's lip: stones in the braids' gravel and on
      // the tarn's beach, tussocks and cushions on the banks; a boulder on the col's snow stands half-drifted, sunk and snow-capped)
      const offFloor = (o) => o.steep > 0.75 || (o.a < 322 && Math.abs(o.p) > hwAt(o.a) - 3);     // nothing lies on a wall
      for (let i = 0; i < nSt; i++) { const o = place(216, 812, 15), s = 0.16 + 1.25 * Math.pow(sr(), 2.6), r1 = sr(), cs = colSn(o), snowy = cs > 0.4;
        if (o.y < CLOUD_Y - 2 || Math.abs(o.p) > 70 || (lane(o) && (s > 0.3 || r1 < 0.6)) || (cs > 0.5 && s < 0.5 && r1 < 0.8) || offFloor(o) || (onTer(o) && s > 0.24) || wetAt(o.a, o.p, s > 0.45 ? 0 : -9)) continue;
        Object.assign(o, { s, y: o.y + s * (snowy ? 0.02 : 0.18), tint: 0.75 + 0.5 * sr(), sway: 0, tilt: sr.range(-0.4, 0.4), basin: snowy ? 2 : 1 }); ((Math.abs(o.p) < 10.5 && s > 0.44) || (snowy && s > 0.62) ? instList.stoneA : instList.stoneB).push(o); }
      for (let i = 0; i < nTu; i++) { const o = place(214, 792, 11), cs = colSn(o); if (o.y < CLOUD_Y || Math.abs(o.p) > 48 || lane(o) || offFloor(o) || (onTer(o) && o.p < 18) || wetAt(o.a, o.p, 0.5) || (cs > 0.5 && (cs > 0.95 || noise.n2(o.x / 3.4 + 1.5, o.z / 3.4) < 0.3))) continue; instList.tuft.push(Object.assign(o, { s: sr.range(0.8, 1.7), tint: 0.7 + 0.6 * sr(), sway: 14, y: o.y - 0.03 })); }
      for (let i = 0; i < nCu; i++) { const o = place(300, 780, 13); if (o.y < CLOUD_Y || Math.abs(o.p) > 50 || lane(o) || colSn(o) > 0.5 || offFloor(o) || onTer(o) || wetAt(o.a, o.p, 0.8)) continue; instList.cush.push(Object.assign(o, { s: sr.range(0.3, 0.9), tint: 0.8 + 0.5 * sr(), sway: 0, y: o.y - 0.05 })); } }
    // (each kind in two meshes, the hanging valley and alp, then the spur and col, so the far half is not drawn until we are near it)
    const cover = [], coverHi = [];
    for (const [geo, list, name] of [[stoneGeo(1, 2), instList.stoneA, 'stones-near'], [stoneGeo(0, 5), instList.stoneB, 'stones'], [tuftGeo(), instList.tuft, 'tussocks'], [cushGeo(), instList.cush, 'cushions']]) {
      cover.push(mkInst(geo, list.filter((o) => o.a < 545), name)); coverHi.push(mkInst(geo.clone(), list.filter((o) => o.a >= 545), name + '-col')); }
    await ctx.yield();

    // ---------------------------------------------------------------- the skein we fly in: bar-headed geese of pale mutton-fat jade
    // Thin plaques with incised feathers; shoulder and wrist hinges; 2.8 beats a second, each bird a fifth of a beat
    // behind the one ahead, the wings lighting on the downbeat so the glow runs down the line as a wave.
    const gooseGeo = (() => {
      const P = [], Cc = [], W = [], U = [], I = [];
      const v = (x, y, z, c, w, u) => { P.push(x, y, z); Cc.push(c[0], c[1], c[2]); W.push(w[0], w[1], w[2], w[3]); U.push(u[0], u[1]); return P.length / 3 - 1; };
      const pale = [0.8, 0.83, 0.72], white = [0.88, 0.9, 0.82], grey = [0.5, 0.54, 0.48], dark = [0.05, 0.04, 0.03], orange = [0.85, 0.36, 0.05];
      // body, neck, head, bill: z (forward is -z), y, rx, ry
      const rings = [[0.3, 0.012, 0.004, 0.003], [0.235, 0.012, 0.04, 0.018], [0.14, 0, 0.076, 0.06], [0.02, -0.005, 0.1, 0.086], [-0.1, -0.004, 0.096, 0.086], [-0.2, 0.002, 0.066, 0.06], [-0.27, 0.014, 0.037, 0.037],
        [-0.39, 0.03, 0.026, 0.026], [-0.49, 0.044, 0.024, 0.025], [-0.525, 0.052, 0.032, 0.033], [-0.556, 0.056, 0.036, 0.035], [-0.59, 0.05, 0.028, 0.026], [-0.612, 0.044, 0.016, 0.013], [-0.665, 0.038, 0.004, 0.003]];
      const SD = 10;
      rings.forEach((r, ri) => { for (let s = 0; s < SD; s++) {
        const an = (s / SD) * 6.2832, cx = Math.sin(an), cy = Math.cos(an), top = cy > 0.3;
        let c = ri <= 1 ? (top ? grey : white) : ri <= 5 ? (top ? mixc(grey, pale, 0.45) : pale) : ri <= 8 ? (top ? grey : white) : ri <= 11 ? white : orange;
        if ((ri === 9 || ri === 11) && cy > 0.1) c = dark;               // the two nape bars
        if (ri === 3 && cy < -0.5) c = mixc(pale, grey, 0.4);
        v(cx * r[2], r[1] + cy * r[3], r[0], c, [0, clamp((ri - 5) / 8, 0, 1), 0, ri >= 6 ? 2 : 0], [0, 0]);
      } });
      for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < SD; s++) { const a = ri * SD + s, b = ri * SD + (s + 1) % SD; I.push(a, b, a + SD, b, b + SD, a + SD); }
      // wings: 11 stations by 4 across the chord
      for (const side of [-1, 1]) {
        const base = P.length / 3, NT = 10, NV = 3;
        for (let i = 0; i <= NT; i++) for (let j = 0; j <= NV; j++) {
          const t = i / NT, cv = j / NV, le = -0.13 + 0.15 * Math.pow(t, 2.2), te = 0.115 - 0.09 * t * t * t + 0.02 * Math.sin(Math.PI * t);
          const prim = (cv > 0.5 && t > 0.2) || t > 0.7, c = prim ? dark : cv > 0.3 ? mixc(pale, grey, 0.4) : pale;
          v(side * (0.06 + 0.72 * t), 0.045 + 0.022 * Math.sin(Math.PI * cv) * (1 - t), lerp(le, te, cv), c, [side, 0.72 * t, smoothstep(0.42, 0.58, t), 1], [t, cv]);
        }
        for (let i = 0; i < NT; i++) for (let j = 0; j < NV; j++) { const a = base + i * (NV + 1) + j, b = a + NV + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(Cc, 3));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 2));
      g.setIndex(I); g.computeVertexNormals(); return g;
    })();
    const gooseShader = (flap) => ({
      side: THREE.DoubleSide, own: { uFlap: { value: flap } },
      vertexShader: /* glsl */`
        attribute vec3 aCol; attribute vec4 aW; attribute vec2 aU; attribute vec4 aI;
        uniform float uTime; uniform vec3 uFlap;      // beats a second, depth of the beat, dihedral the wings are held at
        varying vec3 vW, vN, vC; varying vec2 vU; varying float vGlow, vWing, vYoung;
        vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
        void main(){
          vec3 p = position, n = normal;
          float ph = 6.2832 * (uTime * uFlap.x - aI.x), side = aW.x;
          if (abs(side) > .5) {
            float th1 = (sin(ph) * .8 + .1) * uFlap.y + uFlap.z, th2 = (sin(ph - 1.1) * .5 - .12 - .3 * max(0., cos(ph))) * uFlap.y - uFlap.z * .7;
            vec2 wr = vec2(side * .42, .045), sh = vec2(side * .06, .045);
            float a2 = th2 * side * aW.z, a1 = th1 * side * smoothstep(0., .1, aW.y);
            p.xy = wr + rot(p.xy - wr, a2); n.xy = rot(n.xy, a2);
            p.xy = sh + rot(p.xy - sh, a1); n.xy = rot(n.xy, a1);
            p.z += aW.z * .05 * max(0., cos(ph)) * uFlap.y;
          } else {
            p.y -= sin(ph) * .018 * uFlap.y;
            if (aW.w > 1.5) { p.z -= sin(ph + .7) * .014 * aW.y; p.y += sin(ph + 1.4) * .008 * aW.y; }
          }
          vec4 wp = modelMatrix * instanceMatrix * vec4(p * aI.w, 1.);
          vW = wp.xyz; vN = mat3(modelMatrix) * (mat3(instanceMatrix) * n); vC = aCol; vU = aU; vWing = abs(side); vYoung = aI.y;
          vGlow = (.5 - .5 * cos(ph)) * uFlap.y + aI.z;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun, uSunCol, uSkyCol, uLamp, uLampCol, uPale; uniform vec4 uShaft;
        varying vec3 vW, vN, vC; varying vec2 vU; varying float vGlow, vWing, vYoung;
        ${ATMOS}
        void main(){
          vec3 N = vN * inversesqrt(max(dot(vN, vN), 1e-8)); if (!gl_FrontFacing) N = -N;
          vec3 toCam = cameraPosition - vW; float dist = max(length(toCam), 1e-3); vec3 V = toCam / dist;
          vec3 alb = vC;
          float paleK = smoothstep(.2, .6, alb.g);
          alb = mix(alb, alb * vec3(.62, .64, .62), vYoung * paleK * (1. - vWing));          // grey-necked young of the year
          // incised feathers: vanes across the chord, repeating along the span, faded before they alias
          float fx = vU.x * 19. + vU.y * .8, fw = fwidth(fx), f = fract(fx);
          float vane = smoothstep(0., .14, f) * (1. - smoothstep(.86, 1., f));
          float row = smoothstep(0., .1, abs(vU.y - .34)) * smoothstep(0., .1, abs(vU.y - .64));
          alb *= mix(1., (.7 + .3 * vane) * (.78 + .22 * row), vWing * (1. - smoothstep(.2, .6, fw)));
          float hemi = N.y * .5 + .5, lam = max(dot(N, uLamp), 0.);
          vec3 light = uSkyCol * (.7 + .9 * hemi) + uLampCol * (.25 + .75 * lam) * 1.05;
          light = mix(light, vec3(dot(light, vec3(.3, .5, .2))), .45) * mix(.6, 1., smoothstep(-.35, .45, N.y));   // the underside in its own shade
          vec3 col = alb * light * 1.38;
          float c = max(dot(-V, uLamp), 0.);
          col += alb * uLampCol * c * c * vWing * .4;                                         // the wall shining through the plaque
          col += uPale * paleK * (vWing * (vGlow * vGlow * .5 + uShaft.w * 1.3) + (1. - vWing) * (.05 + uShaft.w * .7));
          col += alb * uSunCol * pow(clamp(1. - max(dot(N, V), 0.), 0., 1.), 3.) * .12;
          gl_FragColor = vec4(max(atmos(col, vW, dist, 0.), 0.), 1.);
        }`,
    });
    const gooseMat = mkMat(gooseShader(new THREE.Vector3(2.8, 1, 0)));
    const birds = [];
    const NL = Math.round(lerp(9, 15, (dens - 0.7) / 0.6));
    // THE DIAGONAL. Eleven birds step away ahead and to the left, from 4.4 m off the lens to the point 35 m ahead: in the
    // frame a line from the lower left corner toward the centre, every bird whole and below the horizon. The slots are
    // laid out against the path, then the whole skein is swung with the gaze (below), so the line holds its place in the
    // picture when the head turns to the Lit Wall or the hunt, in the steady camera, and on a tall narrow screen.
    const armAh = (k) => 4.4 + 2.5 * (k - 1) + 0.07 * (k - 1) * (k - 1), armLa = (k) => -(2.55 + 0.315 * (k - 1)), LAP = -armLa(11);
    for (let k = 1; k <= 11; k++) birds.push({ role: k === 11 ? 'lead' : 'arm', k, ah: k === 11 ? 35.2 : armAh(k), la: armLa(k), ve: -1.42 - 0.03 * k, rank: 11 - k });
    for (let j = 1; j <= NL; j++) birds.push({ role: 'left', k: 11 + j, ah: 35.2 - 3.2 * j, la: -(LAP + 1.5 * j), ve: -1.6 + 0.05 * j, rank: j });
    birds.push({ role: 'out', k: 12, ah: 4.2, la: 2.7, ve: -1.25, rank: 12 }, { role: 'sub', k: 13, ah: -7, la: 4.6, ve: -1.1, rank: 13 });
    const NG = birds.length, geese = new THREE.InstancedMesh(gooseGeo, gooseMat, NG);
    { const aI = new Float32Array(NG * 4), br = rng.fork('skein');
      birds.forEach((b, i) => { b.seed = br.range(0, 6.28); aI.set([b.rank * 0.2 + br.range(-0.04, 0.04), autumn && br.chance(0.4) ? 1 : 0, 0, br.range(1.06, 1.18)], i * 4); });
      gooseGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); }
    geese.frustumCulled = false; geese.name = 'skein'; scene.add(geese);
    const _gp = new THREE.Vector3(), _gt = new THREE.Vector3(), _gr = new THREE.Vector3(), _gu = new THREE.Vector3(), _gf = new THREE.Vector3(), _gc = new THREE.Vector3(), _gz = new THREE.Vector3(), _gq = new THREE.Vector3();
    const poseGeese = (time, u, camera) => {
      const e1 = smoothstep(0.455, 0.585, u), e2 = smoothstep(0.84, 0.955, u), sub = smoothstep(0.8, 0.875, u), wob = gale ? 2.1 : 1, d0 = u * PL, sqz = smoothstep(0.55, 0.6, u) * (1 - smoothstep(0.71, 0.76, u));
      // a narrow frame (a phone held upright) draws the skein in toward the axis and a little closer
      const asp = G.uAsp.value, laK = clamp(asp / 1.35, 0.42, 1), nar = (1 - laK) / 0.58, ahK = 1 - 0.18 * nar;
      // how far the gaze is turned from the look of the path (the engine's own resting gaze: the chord to 30 m ahead)
      let dyaw = 0, dpit = 0; path.posAtDist(d0, _gc);
      if (camera && !ctx.through) {
        const m = camera.matrixWorld.elements; _gz.set(-m[8], -m[9], -m[10]).normalize(); path.posAtDist(d0 + 30, _gq).sub(_gc).normalize();
        dyaw = Math.atan2(_gz.x, _gz.z) - Math.atan2(_gq.x, _gq.z); dyaw = clamp(Math.atan2(Math.sin(dyaw), Math.cos(dyaw)), -0.8, 0.8);
        dpit = clamp(Math.asin(clamp(_gz.y, -1, 1)) - Math.asin(clamp(_gq.y, -1, 1)), -0.1, 0.45);
      }
      for (let i = 0; i < NG; i++) {
        const b = birds[i]; let ah = b.ah, la = b.la, ve = b.ve;
        if (b.role === 'lead') { ah = 35.2 - 3.2 * (NL + 1) * e1; la = -(LAP + 1.5 * (NL + 1) * e1 + 3 * Math.sin(Math.PI * e1)); ve += 0.8 * Math.sin(Math.PI * e1); }      // the leader drops back down the outside
        else if (b.role === 'out') { const s = Math.pow(e1, 0.8); ah = lerp(4.2 * ahK, 35.2, s); la = lerp(2.7, -LAP, e1); ve = -1.25 - 0.9 * Math.sin(Math.PI * e1); }      // and our outrider takes the point
        else if (b.role === 'sub') { ah = lerp(-7, 4.3 * ahK, sub); la = lerp(4.6, 2.8, sub); }
        else if (b.role === 'arm') ah *= ahK;
        la *= laK;
        if (sqz > 0 && la < -8) la = lerp(la, -8 - 0.12 * b.rank, sqz);                                                                                                   // the left arm draws in to pass under the Needle's Eye
        if (e2 > 0) {                                                                                                                                                       // closing into file, two abreast, for the arch
          const fa = 5 + 3 * b.k, fl = (b.k & 1 ? -0.95 : 0.95) - 0.25;
          if (b.role === 'sub') la = lerp(la, 1.9, e2); else { ah = lerp(ah, fa, e2); la = lerp(la, fl, e2); ve = lerp(ve, -1.5, e2); }
        }
        const sn = time * 0.45 - ah * 0.09;
        la += (0.3 * Math.sin(time * 0.37 + b.seed) + 0.5 * Math.sin(sn)) * wob * (1 - 0.6 * e2) * (0.5 + 0.5 * laK) * (0.35 + 0.65 * smoothstep(4, 16, ah));   // the birds beside the lens hold their slots
        ve += 0.2 * Math.sin(time * 0.53 + b.seed * 2.3) + 0.28 * Math.sin(time * 0.3 - ah * 0.07) * wob - (gale ? 0.5 : 0);
        ah += 0.3 * Math.sin(time * 0.29 + b.seed * 1.3);
        const d = d0 + ah;
        if (d > PL - 0.6) { _m4.makeScale(0, 0, 0); geese.setMatrixAt(i, _m4); continue; }                                                                                  // gone through the portal
        path.posAtDist(d, _gp); path.tangentAtDist(d, _gt);
        _gr.set(-_gt.z, 0, _gt.x).normalize();
        _gp.addScaledVector(_gr, la); _gp.y += ve;
        // swing with the gaze: the birds beside the lens nearly all the way, the far end of the line less (it stays over the route)
        const wg = (0.95 - 0.2 * smoothstep(12, 36, ah)) * (1 - e2);
        if (wg > 0.001 && (dyaw !== 0 || dpit !== 0)) {
          const ox2 = _gp.x - _gc.x, oz2 = _gp.z - _gc.z, cy = Math.cos(dyaw * wg), sy = Math.sin(dyaw * wg), rx2 = ox2 * cy + oz2 * sy, rz2 = -ox2 * sy + oz2 * cy;
          _gp.x = _gc.x + rx2; _gp.z = _gc.z + rz2; if (ah > 0) _gp.y += Math.hypot(rx2, rz2) * Math.tan(dpit * wg);
        }
        const roll = 0.22 * Math.cos(sn) * wob, yaw = gale ? -0.2 : 0;
        _gf.copy(_gt).addScaledVector(_gr, yaw).normalize();
        _gr.crossVectors(_gf, UP).normalize(); _gu.crossVectors(_gr, _gf);
        _gr.addScaledVector(_gu, roll).normalize(); _gu.crossVectors(_gr, _gf);
        _gt.copy(_gf).negate();
        _m4.makeBasis(_gr, _gu, _gt).setPosition(_gp); geese.setMatrixAt(i, _m4);
      }
      geese.instanceMatrix.needsUpdate = true;
    };
    poseGeese(0, 0);
    await ctx.yield();

    // ---------------------------------------------------------------- the lammergeier of the spur (u 0.55 to 0.76), built here
    // A bearded vulture 5.6 m across (as the blue sheep are, a size and a half over life), on the skein's own shader with the
    // beat turned down to a glide: long narrow wings held in a shallow V with six fingered primaries each, a long wedge tail,
    // slate back, rust-orange breast and a pale head with its black mask and beard. It comes over our left shoulder as we
    // start up the spur, hangs above the line of flight 15 m ahead at u 0.61 (its underside to the lens against the sky),
    // then slides away to the right over the snow tongue, where the hunt is about to break.
    const lamGeo = (() => {
      const P = [], Cc = [], W = [], U = [], I = [];
      const v = (x, y, z, c, w, u) => { P.push(x, y, z); Cc.push(c[0], c[1], c[2]); W.push(w[0], w[1], w[2], w[3]); U.push(u[0], u[1]); return P.length / 3 - 1; };
      const slate = [0.05, 0.052, 0.06], grey = [0.15, 0.16, 0.18], rust = [0.6, 0.27, 0.07], buff = [0.74, 0.56, 0.3], black = [0.02, 0.02, 0.022], horn = [0.3, 0.27, 0.2];
      // body: z (forward is -z), y, rx, ry, colour above, colour below
      const rings = [[0.27, 0.004, 0.012, 0.01, slate, slate], [0.2, 0.002, 0.05, 0.036, slate, rust], [0.08, -0.004, 0.085, 0.066, slate, rust], [-0.06, -0.006, 0.092, 0.074, slate, rust], [-0.19, 0, 0.074, 0.062, grey, rust],
        [-0.27, 0.012, 0.047, 0.045, buff, rust], [-0.33, 0.022, 0.04, 0.041, buff, buff], [-0.375, 0.024, 0.037, 0.036, black, buff], [-0.41, 0.016, 0.022, 0.024, horn, black], [-0.45, -0.004, 0.004, 0.006, horn, horn]];
      const SD = 9;
      rings.forEach((r, ri) => { for (let s = 0; s < SD; s++) { const an = (s / SD) * 6.2832, cx = Math.sin(an), cy = Math.cos(an);
        v(cx * r[2], r[1] + cy * r[3], r[0], cy > 0.25 ? r[4] : r[5], [0, clamp((ri - 4) / 5, 0, 1), 0, ri >= 5 ? 2 : 0], [0, 0]); } });
      for (let ri = 0; ri < rings.length - 1; ri++) for (let s = 0; s < SD; s++) { const a = ri * SD + s, b = ri * SD + (s + 1) % SD; I.push(a, b, a + SD, b, b + SD, a + SD); }
      // the beard: a black tuft under the bill
      { const a = v(-0.012, -0.004, -0.4, black, [0, 1, 0, 2], [0, 0]), b = v(0.012, -0.004, -0.4, black, [0, 1, 0, 2], [0, 0]), c = v(0, -0.05, -0.425, black, [0, 1, 0, 2], [0, 0]); I.push(a, b, c); }
      // the tail: a long wedge
      { const pts = [[0, 0.2], [0.085, 0.3], [0.115, 0.4], [0.07, 0.52], [0, 0.6], [-0.07, 0.52], [-0.115, 0.4], [-0.085, 0.3]], c0 = v(0, 0.004, 0.4, slate, [0, 0, 0, 0], [0.5, 0.5]);
        const ids = pts.map((q, k) => v(q[0], 0.004 - 0.012 * (q[1] - 0.2), q[1], k === 4 ? black : slate, [0, 0, 0, 0], [q[0] * 3 + 0.5, q[1]])); for (let k = 0; k < 8; k++) I.push(c0, ids[k], ids[(k + 1) % 8]); }
      // wings: the arm and hand as one plaque to the wrist line, then six fingers
      for (const side of [-1, 1]) {
        const base = P.length / 3, NT = 9, NV = 3, T1 = 0.74, xo = (t) => side * (0.06 + 0.94 * t), le = (t) => -0.125 + 0.06 * t * t, te = (t) => 0.15 - 0.045 * t;
        for (let i = 0; i <= NT; i++) for (let j = 0; j <= NV; j++) { const t = (i / NT) * T1, cv = j / NV;
          const c = cv < 0.34 ? (t < 0.5 ? black : slate) : cv > 0.7 ? grey : slate;
          v(xo(t), 0.045 + 0.02 * Math.sin(Math.PI * cv) * (1 - t), lerp(le(t), te(t), cv), c, [side, 0.94 * t, smoothstep(0.38, 0.52, t), 1], [t, cv]); }
        for (let i = 0; i < NT; i++) for (let j = 0; j < NV; j++) { const a = base + i * (NV + 1) + j, b = a + NV + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
        for (let f = 0; f < 6; f++) { const c0 = f / 6, c1 = (f + 0.86) / 6, z0 = lerp(le(T1), te(T1), c0), z1 = lerp(le(T1), te(T1), c1), len = 0.27 - 0.022 * f - (f === 0 ? 0.03 : 0), sw = (f - 1.6) * 0.17, zm = (z0 + z1) / 2, w0 = (z1 - z0) * 0.5;
          const tx = xo(T1) + side * len * Math.cos(sw), tz = zm + len * Math.sin(sw), col = f < 2 ? slate : grey, tt = T1 + len;
          const a = v(xo(T1), 0.045, z0, col, [side, 0.94 * T1, 1, 1], [T1, c0]), b = v(xo(T1), 0.045, z1, col, [side, 0.94 * T1, 1, 1], [T1, c1]);
          const c = v(tx, 0.05, tz - w0 * 0.3, black, [side, 0.94 * tt, 1, 1], [tt, c0]), d = v(tx, 0.05, tz + w0 * 0.3, black, [side, 0.94 * tt, 1, 1], [tt, c1]); I.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(Cc, 3));
      g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setAttribute('aU', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array([0.3, 0, 0, 2.8]), 4));
      g.setIndex(I); g.computeVertexNormals(); return g;
    })();
    const lam = new THREE.InstancedMesh(lamGeo, mkMat(gooseShader(new THREE.Vector3(0.21, 0.1, 0.16))), 1);
    lam.frustumCulled = false; lam.name = 'lammergeier'; scene.add(lam);
    // ITS LINE is fixed in the world: in from the left across the spur, over the line of flight 12 m ahead of the lens and 8 m
    // above it at u 0.604 (heading right, banked left in a climbing turn, so its whole underside is turned to us; at 0.61 it hangs in the Needle's Eye), then away
    // up the fan on our right as we pass under its wing. It flies at about six tenths of our speed. [a, p, y]
    const LAM_U = 0.604, LAM_V = 0.62, LAM_N = 96, lamTab = new Float32Array((LAM_N + 1) * 3); let lamLen = 1, lamS0 = 0;
    { const w = new THREE.Vector3(), pts = [[505, -108, 168], [533, -33, 166.3], [543.5, -1.5, 167.2], [553, 26, 171.6], [571, 45, 177], [612, 56, 188], [680, 62, 216]].map(([a, p2, y]) => { worldOf(a, p2, w); return new THREE.Vector3(w.x, y, w.z); });
      const cv = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); cv.arcLengthDivisions = 400; lamLen = cv.getLength();
      let best = 1e9; for (let i = 0; i <= LAM_N; i++) { cv.getPointAt(i / LAM_N, w); lamTab[i * 3] = w.x; lamTab[i * 3 + 1] = w.y; lamTab[i * 3 + 2] = w.z; const d = w.distanceTo(pts[2]); if (d < best) { best = d; lamS0 = (i / LAM_N) * lamLen; } } }
    const lamPos = new THREE.Vector3(), _lq = new THREE.Vector3(), _lt = new THREE.Vector3(), _lr = new THREE.Vector3(), _lu = new THREE.Vector3(), _lf = new THREE.Vector3();
    const lamS = (u) => lamS0 + LAM_V * (u - LAM_U) * PL;
    const lamAtS = (s, out) => { const f = clamp(s / lamLen, 0, 1) * LAM_N, i = Math.min(Math.floor(f), LAM_N - 1), t = f - i, k = i * 3;
      return out.set(lerp(lamTab[k], lamTab[k + 3], t), lerp(lamTab[k + 1], lamTab[k + 4], t), lerp(lamTab[k + 2], lamTab[k + 5], t)); };
    const lamAt = (u, out) => lamAtS(lamS(u), out);
    const poseLam = (time, u) => {
      const s = lamS(u);
      if (u < 0.5 || u > 0.705 || s < 3 || s > lamLen - 3) { _m4.makeScale(0, 0, 0); lam.setMatrixAt(0, _m4); lam.instanceMatrix.needsUpdate = true; return; }
      lamAtS(s, lamPos); lamAtS(s + 2.5, _lq); lamAtS(s - 2.5, _lf);
      _lt.subVectors(_lq, _lf);
      _lu.subVectors(_lq, lamPos); _lr.subVectors(lamPos, _lf); const bend = Math.atan2(_lu.x, _lu.z) - Math.atan2(_lr.x, _lr.z);     // how hard it is turning: it banks into the turn
      _lt.normalize();
      const roll = clamp(Math.atan2(Math.sin(bend), Math.cos(bend)) * 14, -0.65, 0.65) + 0.06 * Math.sin(time * 0.8);
      lamPos.y += 0.2 * Math.sin(time * 0.6);
      _lr.crossVectors(_lt, UP).normalize(); _lu.crossVectors(_lr, _lt);
      _lr.addScaledVector(_lu, roll).normalize(); _lu.crossVectors(_lr, _lt);
      _lf.copy(_lt).negate(); _m4.makeBasis(_lr, _lu, _lf).setPosition(lamPos); lam.setMatrixAt(0, _m4); lam.instanceMatrix.needsUpdate = true;
    };
    poseLam(0, 0);
    await ctx.yield();

    // ---------------------------------------------------------------- wildlife from the kit: bharal, the snow leopard, choughs, lammergeiers
    const hex = (c) => '#' + c.getHexString();
    const fLight = { sunDir: [lampDir.x, lampDir.y, lampDir.z], sunColor: hex(LK.lamp), sunIntensity: night ? 2.6 : 2.3, sky: hex(LK.fill), skyIntensity: night ? 3 : 2.3, ground: hex(LK.cloud), groundIntensity: 0.6 };
    const fauna = F.makeFauna(scene, { light: fLight });
    await ctx.yield();
    const fr = rng.fork('fauna'), dT = (dens - 0.7) / 0.6;
    // The kit's quadruped is the base; the parts that make these two animals are built here and merged in:
    // the bharal's thick out-and-back horns (the kit's 'curl' reads as antlers) and the leopard's long heavy tail.
    const headFrame = (S) => {   // where the kit puts the head and tail of preset S, so parts can be added in the same frame
      const H = S.h, bl = S.bodyLen * H, zs = bl / 2, zh = -bl / 2, ry = S.depth * H / 2, na = S.neckAng * Math.PI / 180, nl = S.neckLen * H, hp = S.headPitch * Math.PI / 180, hr = S.headR * H, hl = S.headLen * H;
      const nb = [0, H + ry * 0.25, zs + 0.02 * bl], top = [0, nb[1] + Math.sin(na) * nl, nb[2] + Math.cos(na) * nl];
      return { H, hr, hl, ry, bl, pivot: [0, nb[1] - ry * 0.2, nb[2]], tail: [0, H * S.hip - ry * 0.25, zh - 0.3 * ry],
        at: (x, y, z) => [x, y * Math.cos(hp) - z * Math.sin(hp) + top[1] + hr * 0.25, y * Math.sin(hp) + z * Math.cos(hp) + top[2] + hr * 0.1] };
    };
    const mergeGeo = (a, b) => {
      const g = new THREE.BufferGeometry(), na = a.attributes.position.count;
      for (const [name, n] of [['position', 3], ['normal', 3], ['color', 3], ['aAnim', 4], ['aPivot', 3], ['aGlow', 1]]) { const out = new Float32Array((na + b.attributes.position.count) * n); out.set(a.attributes[name].array, 0); out.set(b.attributes[name].array, na * n); g.setAttribute(name, new THREE.BufferAttribute(out, n)); }
      const ia = a.index.array, ib = b.index.array, idx = new Uint32Array(ia.length + ib.length); idx.set(ia, 0); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + na;
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere(); a.dispose(); b.dispose(); return g;
    };
    const BHARAL = { ...F.HERD_PRESETS.antelope, h: 0.9, bodyLen: 1.16, width: 0.44, depth: 0.54, hip: 1.0, chest: 1.12, leg: [0.078, 0.054, 0.038], neckLen: 0.3, neckAng: 40, neck: [0.21, 0.14], headLen: 0.29, headR: 0.1, headPitch: 24, ears: 0.09, horns: 0, antlers: 0, tail: 0.14, tailType: 'thin',
      coat: '#8f5c38', belly: '#e0cfae', legs: '#2c1e16', sock: '#cdb490', accent: '#2a1c14', horn: '#3a3226', pattern: 'band', speed: 1.3, stride: 0.9, varieties: 0 };
    const bharalGeoOf = (PRE) => {
      const hf = headFrame(PRE), g = new F.Geo(), a = 0.56 * hf.H, c0 = new THREE.Color('#2b261d'), c1 = new THREE.Color('#7a6c50');
      for (const sx of [-1, 1]) {
        const b = sx * hf.hr * 0.42, pts = [[b, hf.hr * 0.7, -0.04 * hf.hl], [b + sx * a * 0.2, hf.hr + a * 0.3, -0.1 * hf.hl], [b + sx * a * 0.52, hf.hr + a * 0.44, -0.1 * hf.hl - a * 0.1], [b + sx * a * 0.84, hf.hr + a * 0.4, -0.1 * hf.hl - a * 0.32], [b + sx * a * 1.02, hf.hr + a * 0.27, -0.1 * hf.hl - a * 0.56], [b + sx * a * 1.04, hf.hr + a * 0.2, -0.1 * hf.hl - a * 0.72]];
        g.tube(pts.map((p) => hf.at(p[0], p[1], p[2])), [0.066 * hf.H, 0.062 * hf.H, 0.054 * hf.H, 0.042 * hf.H, 0.026 * hf.H, 0], 6, c0, c1);
      }
      g.anim([0, g.n], () => [1, 0, 2, 0]); g.pivot([0, g.n], hf.pivot[0], hf.pivot[1], hf.pivot[2]); g.glow([0, g.n], 1);
      return mergeGeo(F.quadrupedGeometry(PRE), g.build());
    };
    const bharalGeo = bharalGeoOf(BHARAL);
    await ctx.yield();
    const LEO = { ...F.HERD_PRESETS.deer, h: 0.62, bodyLen: 1.95, width: 0.52, depth: 0.54, hip: 0.96, chest: 1.05, leg: [0.125, 0.092, 0.072], hoofFlare: 1.55, hoof: '#d8d8c8', neckLen: 0.24, neckAng: 14, neck: [0.26, 0.22], headLen: 0.42, headR: 0.2, headPitch: 8, ears: 0.07, tail: 0.02, tailType: 'thin', antlers: 0, horns: 0, graze: 0,
      coat: '#e9eadb', belly: '#f4f4ea', legs: '#e2e2d2', sock: '#ecece0', accent: '#7a4426', horn: '#000000', pattern: 'spots', speed: 2.2, stride: 1.3, count: 1, varieties: 0 };
    const leoGeo = (() => {
      const hf = headFrame(LEO), g = new F.Geo(), H = hf.H, L = 1.8 * H, [, ty, tz] = hf.tail, pale = new THREE.Color('#e6e8d8'), ring = new THREE.Color('#5e3520');
      // the tail: as thick as a foreleg and as long as the body, carried out behind as a counterweight, tip lifted
      const prof = [[0, 0, 0.07], [-0.07, 0.14, 0.085], [-0.15, 0.3, 0.092], [-0.2, 0.46, 0.095], [-0.21, 0.62, 0.095], [-0.17, 0.78, 0.09], [-0.09, 0.92, 0.08], [0, 1.02, 0.06], [0.03, 1.06, 0]];
      const r = g.tube(prof.map((p) => [0, ty + p[0] * L, tz - p[1] * L]), prof.map((p) => p[2] * H), 8, pale, pale);
      g.paint(r, (x, y, z, c) => { const t = (tz - z) / L; if (Math.sin(t * 26) > 0.45 || t > 0.9) c.copy(ring); });
      g.anim(r, (x, y, z) => [0, clamp((tz - z) / L, 0, 1), 3, 0]); g.pivot(r, 0, ty, tz); g.glow(r, 1);
      return mergeGeo(F.quadrupedGeometry(LEO), g.build());
    })();
    await ctx.yield();
    const HUNT_U = 0.7;
    // the running blue sheep, strung out along the snow tongue ahead of the leopard: each is a herd of one on the same line, 7 m
    // behind the next and a little to one side of it, so no two ever overlap (at any hour, whatever the seed)
    { const rr = fr.fork('run'), nR = Math.round(lerp(5, 7, dT));
      for (let i = 0; i < nR; i++) {
        fauna.add(F.makeHerd({ rng: rr.fork('r' + i), preset: BHARAL, geometry: i ? bharalGeo.clone() : bharalGeo, count: 1, size: 1.7 + 0.1 * ((i * 3) % 4 - 1.5), sizes: [1], mode: 'migrate', gait: 'run', speed: 2.0, heightAt, spread: [0.01, 0.01],
          cross: { path, u: HUNT_U, lead: 13.5 + 7.2 * i + rr.range(-1.2, 1.2), offset: 8.5 + (i & 1 ? 1.5 : -1.3) + rr.range(-0.4, 0.4), angle: 0, side: 1, span: 120, bow: 0, height: 0, duration: DUR }, light: fLight }));
        await ctx.yield(); } }
    fauna.add(F.makeHerd({ rng: fr.fork('leo'), preset: LEO, geometry: leoGeo, count: 1, size: 1.95, sizes: [1], mode: 'migrate', gait: 'run', speed: 2.2, heightAt, spread: [0.01, 0.01],
      cross: { path, u: HUNT_U, lead: 7.5, offset: 12.7, angle: 0, side: 1, span: 120, bow: 0, height: 0, duration: DUR }, light: fLight, fill: 0.55 }));
    await ctx.yield();
    // three blue sheep on the lookout rock (u 0.76 to 0.83): whole on the skyline, left of the gate, as we come up the last of the spur
    { const w = new THREE.Vector3(), lr = xr.fork('lookout');
      for (const [a, p2, sz] of [[709.6, -12.3, 2.15], [715.2, -15.8, 2.0], [720.6, -12.7, 2.1]]) { worldOf(a, p2, w);
        fauna.add(F.makeHerd({ rng: lr.fork('b' + a), preset: BHARAL, geometry: bharalGeo.clone(), count: 1, size: sz, sizes: [1], center: [w.x, 0, w.z], radius: 0.2, roam: 0.3, heightAt, light: fLight, fill: 0.55, rim: 0.9 }));
        await ctx.yield(); } }
    { const g = E0.clone().addScaledVector(eT, -62).addScaledVector(eR, fr.chance(0.5) ? -40 : -37);
      fauna.add(F.makeHerd({ rng: fr.fork('graze'), preset: BHARAL, geometry: bharalGeo.clone(), count: Math.round(lerp(4, 8, dT)), size: 1.5, center: [g.x, 0, g.z], radius: 10, heightAt, path, clear: 13, light: fLight })); }
    await ctx.yield();
    const ch = { body: '#15110e', belly: '#1c1613', wingC: '#100d0b', beak: '#e8c020' };
    fauna.add(F.makeFlock({ rng: fr.fork('choughs'), species: 'crows', count: Math.round(lerp(24, 36, dT)), center: [E0.x + eT.x * 16, COL_Y + 43, E0.z + eT.z * 16], radius: 24, height: 4, spread: [14, 5, 14], ...ch, light: fLight }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr.fork('escort'), species: 'crows', count: 6, spread: [3, 1.6, 6], along: { path, side: -4.6, up: 3.2, lead: 10, from: 0.83, to: 1.03 }, ...ch, light: fLight }));
    await ctx.yield();
    { const w = worldOf(296, 0, new THREE.Vector3());      // over the notch, in the gap of sky the gorge looks up at
      fauna.add(F.makeFlock({ rng: fr.fork('lammergeier'), species: 'eagles', count: tahr ? 3 : 2, size: 3.1, center: [w.x, 170, w.z], spread: [12, 9, 16], soarRadius: 15, radius: 9, height: 3, body: '#2a2018', belly: '#b06a30', light: fLight }), { always: true }); }
    await ctx.yield();
    // THE HERD ON THE TERRACE (u 0.47 to 0.58). Eight to eleven blue sheep, each placed (four where we look at u 0.52, three
    // further up the shelf for u 0.55): every one stands whole on the shelf's lit
    // slab, spread across the view from where we are at u 0.52 (the nearest 18 m off, a sixth of the frame tall; no two in
    // line), rimmed by the wall's light, against the cloud sea and the foot of the Lit Wall. Each is a herd of one that ambles
    // a loop a few metres across and stops to graze. And a small band by the braids at the head of the hanging valley:
    // Himalayan tahr, dark and shaggy-brown, on the mornings they are about.
    { const w = new THREE.Vector3(), hr = fr.fork('terrace');
      const spots = [[461.5, 12.3, 2.35], [470.5, 12.8, 2.3], [481, 12.4, 2.3], [477, 24, 2.4], [496, 12.6, 2.6], [506.5, 12.2, 2.4], [503, 22.5, 2.7], [467, 26, 2.5], [489, 20.5, 1.6], [514, 18.5, 2.3], [485, 28.5, 2.3]], nB = Math.round(lerp(8, 11, dT));
      for (let i = 0; i < nB; i++) { const [a, p2, sz] = spots[i]; worldOf(a, p2, w);
        fauna.add(F.makeHerd({ rng: hr.fork('b' + i), preset: BHARAL, geometry: bharalGeo.clone(), count: 1, size: sz, sizes: [1], center: [w.x, 0, w.z], radius: 0.25, roam: 0.42, heightAt, light: fLight, fill: 0.55, rim: 0.9 }));
        await ctx.yield(); }
      const TAHR = tahr ? { ...BHARAL, h: 1.0, coat: '#5a3a24', belly: '#8a6a48', legs: '#1e1410', sock: '#5e4630', neck: [0.26, 0.17] } : BHARAL;
      worldOf(246, streamP(246) + 10 + 8 * braidK(246), w);
      fauna.add(F.makeHerd({ rng: fr.fork('valley'), preset: TAHR, geometry: tahr ? bharalGeoOf(TAHR) : bharalGeo.clone(), count: Math.round(lerp(4, 6, dT)), size: 1.7, center: [w.x, 0, w.z], radius: 5.5, roam: 0.45, heightAt, path, clear: 5, light: fLight })); }
    await ctx.yield();

    // ---------------------------------------------------------------- petals (gold birch leaves in October) streaming down the gorge
    const dg = path.startTangent.clone().setY(0).normalize(), rg = new THREE.Vector3(-dg.z, 0, dg.x);
    const softPts = (n, fill, own, vs, fs, add) => {
      const g = new THREE.BufferGeometry(), P = new Float32Array(n * 3), R = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) fill(i, P, R);
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aR', new THREE.BufferAttribute(R, 3));
      const m = new THREE.Points(g, mkMat({ own, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, vertexShader: vs, fragmentShader: fs }));
      m.frustumCulled = false; m.renderOrder = 4; scene.add(m); return m;
    };
    { const pr = rng.fork('petals');
      softPts(Math.round(1500 * detail), (i, P, R) => { P[i * 3] = pr.range(0, 265); P[i * 3 + 1] = pr.range(-40, 40); P[i * 3 + 2] = pr.range(80, 127); R[i * 3] = pr(); R[i * 3 + 1] = pr.range(0.15, 0.34); R[i * 3 + 2] = pr(); },
        { uO: { value: S0.clone() }, uDg: { value: dg }, uRg: { value: rg }, uPetal: { value: autumn ? new THREE.Color(0.8, 0.5, 0.06) : new THREE.Color(0.86, 0.1, 0.06) } },
        /* glsl */`
          attribute vec3 aR; uniform float uTime, uVH, uGale; uniform vec3 uO, uDg, uRg;
          varying float vA, vS;
          void main(){
            float g = mod(position.x - uTime * (8. + 8. * aR.x) * (1. + .6 * uGale), 265.) - 15.;
            float lat = position.y + sin(uTime * .9 + aR.x * 30.) * 1.7 + sin(g * .05 + aR.z * 6.) * 3.;
            vec3 wp = uO + uDg * g + uRg * lat;
            wp.y = position.z + sin(uTime * 1.3 + aR.z * 50.) * 1.1 + max(0., g - 150.) * .36 - (250. - g) * .012;
            vec4 mv = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mv;
            float px = aR.y * uVH * projectionMatrix[1][1] / (2. * max(gl_Position.w, .05));
            gl_PointSize = clamp(px, 1.6, 26.);
            vA = smoothstep(-15., 0., g) * (1. - smoothstep(232., 250., g)) * clamp(px / 1.6, .25, 1.) * smoothstep(.7, 2.2, gl_Position.w);
            vS = aR.z * 6.283 + uTime * (2. + 3. * aR.x);
          }`,
        /* glsl */`
          uniform vec3 uPetal, uSkyCol, uLampCol; varying float vA, vS;
          void main(){
            vec2 q = gl_PointCoord - .5; float c = cos(vS), s = sin(vS); q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
            q.y *= 1.5 + 1.4 * abs(sin(vS * 1.7));                       // tumbling: the petal turns edge-on
            float a = (1. - smoothstep(.3, .5, length(q))) * vA;
            gl_FragColor = vec4(uPetal * (uSkyCol * 1.6 + uLampCol * .9 + .15) * (1.1 + .5 * sin(vS * 1.7)), a);
          }`, false); }
    // ---- spindrift blowing over the col's snow (and all down the spur in a gale)
    { const sr = rng.fork('spindrift'), w = new THREE.Vector3();
      softPts(Math.round((gale ? 1500 : 760) * detail), (i, P, R) => {
        const a = sr() < (gale ? 0.7 : 0.55) ? sr.range(gale ? 462 : 556, 760) : sr.range(748, A_END + 45), p = sr.range(-60, 60) * (a < 748 ? 0.5 : 1); worldOf(a, p, w);
        P[i * 3] = w.x; P[i * 3 + 1] = heightAt(w.x, w.z) + sr.range(0.25, 1.7); P[i * 3 + 2] = w.z; R[i * 3] = sr(); R[i * 3 + 1] = sr.range(1.6, 3.8) * (a < 640 ? 0.6 : 1); R[i * 3 + 2] = sr();
      }, {},
        /* glsl */`
          attribute vec3 aR; uniform float uTime, uVH, uGale, uAsp; uniform vec3 uWind;
          varying float vA; varying vec2 vDir;
          void main(){
            float life = fract(uTime * (.1 + .1 * aR.x) * (1. + uGale) + aR.z);
            vec3 wp = position + uWind * ((life - .5) * 18. * (1. + uGale)) + vec3(0., life * life * (1.2 + uGale), 0.);
            gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
            float px = aR.y * (.6 + life) * uVH * projectionMatrix[1][1] / (2. * max(gl_Position.w, .05));
            gl_PointSize = clamp(px * 1.7 * (1. + .5 * uGale), 2., 190.);
            vA = sin(life * 3.1416) * smoothstep(5., 14., gl_Position.w) * min(1., 150. / max(px, 1.)) * (.6 + .4 * aR.x);
            vec4 c2 = projectionMatrix * viewMatrix * vec4(wp + uWind, 1.); vec2 sd = c2.xy / max(c2.w, .05) - gl_Position.xy / max(gl_Position.w, .05); sd.x *= uAsp;
            vDir = sd * inversesqrt(max(dot(sd, sd), 1e-8));
          }`,
        /* glsl */`
          uniform vec3 uSnowCol, uSkyCol, uLampCol; uniform float uGale; varying float vA; varying vec2 vDir;
          void main(){ vec2 q = gl_PointCoord - .5; q.y = -q.y; q = vec2(dot(q, vDir), dot(q, vec2(-vDir.y, vDir.x)) * 5.2); float d = dot(q, q) * 4.; float a = exp(-d * 5.) * (1. - smoothstep(.7, 1., d)) * vA * .24 * (1. + 1.1 * uGale);
            gl_FragColor = vec4(uSnowCol * (uSkyCol * 1.2 + uLampCol * 1.1), a); }`, false); }
    // ---- SPINDRIFT RIBBONS over the top of the spur and the col (u 0.72 on): long torn streamers of blown snow, lit from behind.
    // Snakes run low over the stones and the snow from the left of the flight across it; plumes lift off the brow of the col,
    // off the gendarmes and the arch's crown, and one long banner streams from the Gate Horn's summit. One mesh of ribbons
    // turned to the eye, never thinner than two and a half pixels; the snow scrolls down each and tears.
    let ribbons = null;
    { const rr = xr.fork('ribbons'), SEG = 22, w = new THREE.Vector3(), P = [], A1 = [], A2 = [], A3 = [], I = [];
      const drift = windW.clone().multiplyScalar(0.55).addScaledVector(eR, 0.85).setY(0).normalize();
      const add = (x, y, z, dir, len, w0, w1, lift, alpha, speed, ground) => {
        const base = P.length / 3, seed = rr.range(0, 60);
        for (let s2 = 0; s2 <= SEG; s2++) { const t = s2 / SEG, px = x + dir.x * len * t, pz = z + dir.z * len * t, py = ground ? heightAt(px, pz) + 0.3 + 0.7 * t : y;
          for (const e of [-1, 1]) { P.push(px, py, pz); A1.push(t, e, len, seed); A2.push(w0, w1, lift, alpha); A3.push(dir.x, dir.z, speed); } }
        for (let s2 = 0; s2 < SEG; s2++) { const a = base + s2 * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      };
      const nS = Math.round((gale ? 26 : 18) * (0.6 + 0.4 * detail));
      for (let i = 0; i < nS; i++) { const a = 664 + (i + rr.range(-0.3, 0.3)) * (188 / nS), p = rr.range(-32, -12); worldOf(a, p, w);
        add(w.x, 0, w.z, drift, rr.range(32, 50), 0.3, rr.range(0.9, 1.6), 0, rr.range(0.42, 0.6), rr.range(1.6, 2.6), true); }
      await ctx.yield();
      for (let i = 0; i < 6; i++) { const p = (i & 1 ? 1 : -1) * rr.range(17, 50); worldOf(A_END - rr.range(56, 78), p, w);            // off the brow of the col
        add(w.x, heightAt(w.x, w.z) + 0.6, w.z, drift, rr.range(34, 52), 1, rr.range(5, 7.5), rr.range(0.16, 0.26), rr.range(0.3, 0.42), rr.range(0.8, 1.3), false); }
      for (const g of gend) add(g[0], heightAt(g[0], g[1]) + g[2] - 1, g[1], windW, rr.range(26, 34), 0.8, rr.range(4.5, 6.5), 0.12, 0.4, 1.1, false);
      add(E0.x, COL_Y + 24.2 * AS - 0.8, E0.z, windW, 30, 1, 6, 0.1, 0.36, 1.2, false);                                                 // off the arch's crown
      { const g0 = E0.clone().addScaledVector(eT, 540); add(g0.x + eR.x * 4, HORN_Y - 4, g0.z + eR.z * 4, windW, 260, 10, 70, 0.1, 0.6, 0.5, false); }   // the Gate Horn's banner
      { worldOf(600.2, 5, w); add(w.x, heightAt(w.x, w.z) + 49, w.z, windW, 28, 0.8, 5.5, 0.1, 0.36, 1.1, false); }            // off the crown of the Needle's Eye
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A1, 4)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(A2, 4)); g.setAttribute('aR', new THREE.Float32BufferAttribute(A3, 3)); g.setIndex(I);
      ribbons = new THREE.Mesh(g, mkMat({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aP, aQ; attribute vec3 aR; uniform float uTime, uVH, uGale;
          varying vec2 vUv; varying vec4 vK; varying float vDist;
          void main(){
            float t = aP.x, len = aP.z; vec3 dir = normalize(vec3(aR.x, 1e-4, aR.y)), lat = vec3(-dir.z, 0., dir.x);
            vec3 p = position;
            p.y += aQ.z * len * t * t + sin(t * 6. - uTime * 1.1 + aP.w) * (.2 + .012 * len * aQ.z * 4.) * t;
            p += lat * (sin(t * 4.3 - uTime * .8 + aP.w * 1.7) * (.5 + .04 * len) * t);
            vec3 view = cameraPosition - p, side = cross(dir, view); side *= inversesqrt(max(dot(side, side), 1e-8));
            vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.);
            float mpp = max(c.w, .1) * 2. / (projectionMatrix[1][1] * uVH);
            float wd = max(mix(aQ.x, aQ.y, sqrt(t)) * (1. + .4 * uGale), 2.5 * mpp);
            p += side * (aP.y * wd * .5);
            vUv = vec2(t, aP.y); vK = vec4(len, aP.w, aQ.w * (1. + .5 * uGale), aR.z); vDist = c.w;
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSnowCol, uSkyCol, uLampCol, uSunCol, uFogCol; uniform float uTime, uFogD;
          varying vec2 vUv; varying vec4 vK; varying float vDist;
          ${NOISE}
          void main(){
            float t = vUv.x, e = vUv.y, sc = max(3.2, vK.x / 13.);
            vec3 q = vec3(t * vK.x / sc - uTime * vK.w, e * 1.3 + vK.y, vK.y * 3. + uTime * .07);
            float n = jn(q) * .62 + jn(q * 2.6 + 5.) * .38;
            float edge = 1. - e * e; edge *= edge;
            float a = edge * smoothstep(0., .12, t) * pow(max(1. - t, 0.), .8) * smoothstep(.42, .82, n + .2 * (1. - t)) * vK.z * smoothstep(7., 24., vDist);
            if (a < .004) discard;
            vec3 col = uSnowCol * (uSkyCol * 1.3 + uLampCol * 1.45) + uSunCol * .06;
            col = mix(col, vec3(dot(col, vec3(.3, .5, .2))), .4) * (.8 + .35 * n);
            gl_FragColor = vec4(mix(col, uFogCol, 1. - exp(-vDist * uFogD)), min(a, .7));
          }` }));
      ribbons.frustumCulled = false; ribbons.renderOrder = 4; ribbons.name = 'spindrift-ribbons'; scene.add(ribbons); }
    // the light burning through the Gate Horn's summit: one soft additive card standing just before the crest (the arch and
    // the gendarmes hide it as they should; it is a glow in the stone, never a bare disc)
    let hornGlare = null;
    { const g0 = E0.clone().addScaledVector(eT, 512).addScaledVector(eR, 4), g = new THREE.PlaneGeometry(2, 2);
      hornGlare = new THREE.Mesh(g, mkMat({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, own: { uAt: { value: new THREE.Vector3(g0.x, HORN_Y - 14, g0.z) } },
        vertexShader: /* glsl */`
          uniform vec3 uAt; varying vec2 vQ;
          void main(){ vQ = position.xy; vec4 mv = viewMatrix * vec4(uAt, 1.); mv.xy += position.xy * vec2(150., 100.); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSunCol, uApple, uPale; uniform float uNight; varying vec2 vQ;
          void main(){
            vec2 q = vQ; q.y += .22 * q.x * q.x;
            float r = length(q * vec2(1., 1.5)), core = exp(-r * r * 26.), halo = exp(-r * 5.) * (1. - smoothstep(.6, 1., length(vQ)));
            float ray = exp(-abs(q.y) * 22.) * exp(-abs(q.x) * 3.2) * (1. - smoothstep(.6, 1., abs(vQ.x)));
            vec3 c = min(uSunCol * mix(uApple, uPale, .85), vec3(1.5));
            gl_FragColor = vec4(c * (core * .8 + halo * .34 + ray * .22) * mix(1., .55, uNight), 1.);
          }` }));
      hornGlare.frustumCulled = false; hornGlare.renderOrder = 3; hornGlare.name = 'horn-glare'; scene.add(hornGlare); }
    await ctx.yield();

    // ---------------------------------------------------------------- water: meltwater threads on the gorge walls, the torrent below
    { const wr = rng.fork('water'), NR = Math.round(24 * (0.5 + 0.5 * detail)), SEG = 22, P = [], Nx = [], At = [], I = [], w = new THREE.Vector3(), pts = [];
      for (let r = 0; r < NR; r++) {
        const a0 = wr.range(12, 288), sg = wr.chance(0.5) ? 1 : -1, hw = lerp(38, 19, smoothstep(215, 300, a0)), top = wr.range(34, 58), seed = wr.range(0, 10), base = P.length / 3;
        pts.length = 0;
        for (let k = 0; k <= SEG; k++) { const q = top * (1 - k / SEG) + 1, a = a0 + 1.2 * Math.sin(k * 0.9 + seed), p = sg * (hw + q); worldOf(a, p, w); pts.push(w.x - rx.x * sg * 0.3, hAL(a, p + plAt(a)) + 0.3, w.z - rx.y * sg * 0.3); }
        for (let k = 0; k <= SEG; k++) { const k2 = Math.min(k + 1, SEG), k1 = k2 - 1;
          for (const e of [-1, 1]) { P.push(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]); Nx.push(pts[k2 * 3] - pts[k1 * 3], pts[k2 * 3 + 1] - pts[k1 * 3 + 1], pts[k2 * 3 + 2] - pts[k1 * 3 + 2]); At.push(k / SEG, e, seed); } }
        for (let k = 0; k < SEG; k++) { const a = base + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(Nx, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(At, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, mkMat({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 aDir, aT; uniform float uVH; varying vec3 vT; varying float vDist;
          void main(){
            vec3 view = cameraPosition - position, side = cross(normalize(aDir + vec3(0., 1e-4, 0.)), view) + vec3(1e-5, 0., 0.);
            side *= inversesqrt(max(dot(side, side), 1e-8));
            vec4 c = projectionMatrix * viewMatrix * vec4(position, 1.);
            float mpp = max(c.w, .1) * 2. / (projectionMatrix[1][1] * uVH);          // metres per pixel here: never thinner than 1.7 px
            vec3 wp = position + side * aT.y * max(.3, 1.7 * mpp) * .5;
            vT = aT; vDist = c.w; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSkyCol, uLampCol, uFogCol; uniform float uTime, uFogD; varying vec3 vT; varying float vDist;
          void main(){
            float f = fract(vT.x * 4. - uTime * .45 + vT.z), g = smoothstep(.7, .92, f) * (1. - smoothstep(.92, 1., f));
            vec3 col = (uSkyCol * 2.2 + uLampCol * .6) * (.34 + 1.5 * g);
            float a = (1. - vT.y * vT.y) * (.36 + .5 * g) * smoothstep(0., .08, vT.x);
            gl_FragColor = vec4(mix(col, uFogCol, 1. - exp(-vDist * uFogD)), a);
          }` }));
      m.name = 'meltwater'; m.renderOrder = 3; m.frustumCulled = false; scene.add(m);
      // the torrent in its slot under the trees
      const TP = [], TU = [], TI = [];
      for (let a = -64, k = 0; a <= 215; a += a < 134 ? 4 : 2, k++) { const p = streamP(a), up = smoothstep(136, 166, a), l = p + plAt(a), y = hAL(a, l);
        const steep = clamp(Math.abs(hAL(a + 2, l) - hAL(a - 2, l)) / 4 * 1.3 - 0.2, 0, 1);                 // white where it falls
        for (const e of [-1, 1]) { worldOf(a, p + e * lerp(3.4, 2.5, up), w); TP.push(w.x, y + lerp(1.0, 0.75, up), w.z); TU.push(a, e, steep); }
        if (k) { const b = (k - 1) * 2; TI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(TP, 3)); tg.setAttribute('aU', new THREE.Float32BufferAttribute(TU, 3)); tg.setIndex(TI);
      const tm = new THREE.Mesh(tg, mkMat({ side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 aU; varying vec3 vU; varying vec3 vW; void main(){ vU = aU; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSkyCol, uLampCol; uniform float uTime; varying vec3 vU; varying vec3 vW;
          ${NOISE}
          ${ATMOS}
          void main(){
            float n = jn(vec3(vU.y * 2.4, vU.x * .3 + uTime * 2.4, 1.)) * .6 + jn(vec3(vU.y * 6., vU.x * .9 + uTime * 4.2, 5.)) * .4;
            float foam = max(smoothstep(.36, .7, n) * (1. - vU.y * vU.y * .7), vU.z * (.5 + .5 * n) * (1. - vU.y * vU.y * .45));
            vec3 col = mix(vec3(.02, .07, .07), (uSkyCol * 2.4 + uLampCol * .9), foam);
            gl_FragColor = vec4(atmos(col, vW, length(cameraPosition - vW), 0.), 1.);
          }` }));
      tm.name = 'torrent'; scene.add(tm); }
    await ctx.yield();

    // ---------------------------------------------------------------- the rare event: a shaft through a window in the fin
    let shaft = null; const shaftTo = new THREE.Vector3(), sMid = path.pointAt(0.5), sT = path.tangentAt(0.5).setY(0).normalize(), sR = new THREE.Vector3(-sT.z, 0, sT.x);
    if (rare) {
      // one ribbon turned to the eye about the beam's axis: a defined beam seen from outside, gone within 60 m of the lens
      // (when it crosses the skein only the wings and its pool on the cloud light up)
      const g = new THREE.BufferGeometry(), P = [], I = [];
      for (let i = 0; i <= 16; i++) { P.push(-1, i / 16, 0, 1, i / 16, 0); if (i) { const b2 = (i - 1) * 2; I.push(b2, b2 + 1, b2 + 2, b2 + 1, b2 + 3, b2 + 2); } }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      shaft = new THREE.Mesh(g, mkMat({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        own: { uFrom: { value: new THREE.Vector3() }, uTo: { value: new THREE.Vector3() } },
        vertexShader: /* glsl */`uniform vec3 uFrom, uTo; varying vec2 vUv; varying float vD;
          void main(){
            vec3 c = mix(uFrom, uTo, position.y), axis = normalize(uTo - uFrom), view = c - cameraPosition; float dist = max(length(view), 1e-3);
            vec3 side = cross(axis, view / dist); side *= inversesqrt(max(dot(side, side), 1e-4));
            vUv = position.xy; vD = dist; gl_Position = projectionMatrix * viewMatrix * vec4(c + side * position.x * 24., 1.);
          }`,
        fragmentShader: /* glsl */`uniform vec3 uSunCol; uniform vec4 uShaft; uniform float uTime; varying vec2 vUv; varying float vD;
          ${NOISE}
          void main(){
            float e = 1. - vUv.x * vUv.x, dust = .75 + .5 * jn(vec3(vUv.x * 3., vUv.y * 40. - uTime * .15, 2.));
            float a = e * e * smoothstep(0., .3, vUv.y) * (1. - smoothstep(.97, 1., vUv.y)) * smoothstep(40., 150., vD) * dust;
            gl_FragColor = vec4(uSunCol * .26 * a * uShaft.z, 1.);
          }` }));
      shaft.frustumCulled = false; shaft.renderOrder = 5; shaft.name = 'sun-shaft'; scene.add(shaft);
    }

    // ---------------------------------------------------------------- gaze, portal, grade
    const hornAim = hornW.clone().setY(lerp(CLOUD_Y, hornW.y, 0.62)), hornLow = hornW.clone().setY(lerp(CLOUD_Y, hornW.y, 0.42));
    const huntAim = (() => { const d = HUNT_U * PL + 13, p = path.posAtDist(d), t = path.tangentAtDist(d).setY(0).normalize(); p.addScaledVector(new THREE.Vector3(-t.z, 0, t.x), 10.5); p.y = heightAt(p.x, p.z) + 3.2; return p; })();
    const archAim = E0.clone().setY(COL_Y + 15);
    const _va = new THREE.Vector3(), valleyAim = (time, u) => { path.posAtDist(u * PL + 42, _va); _va.y -= 10; return _va; };   // the braids ahead, as we come over the headwall's lip
    // the herd on its terrace: the aim slides along the shelf ahead of us as we come abreast, then back to the line of flight
    const _ha = new THREE.Vector3(), herdAim = (time, u) => { path.posAtDist(u * PL, _ha); const a = Math.max(471, toA(_ha.x, _ha.z) + 18); worldOf(a, 16.5 - 4.5 * smoothstep(0.52, 0.55, u) - 12 * smoothstep(0.555, 0.6, u), _ha); _ha.y = lerp(TER_Y + 5.5, pyAt(a) - 2.5, smoothstep(0.53, 0.6, u)); return _ha; };
    const _la = new THREE.Vector3(), lamAim = (time, u) => lamAt(Math.min(u, 0.612), _la);   // (the gaze lets go of it before it passes over our right shoulder)
    const wallAim = wallMid.clone().setY(lerp(CLOUD_Y, wallMid.y, WALL_AIM));
    const win = (u, a, b, f) => smoothstep(a, a + f, u) * (1 - smoothstep(b - f, b, u));
    const buf = new THREE.Vector2();
    return {
      scene, path, duration: DUR, ride: 'none', style: 'none',
      // linger along the alp, over the tarn under the Lit Wall (the best place), and a little at the hunt
      pace: (u) => 1 - 0.2 * win(u, 0.36, 0.63, 0.08) - 0.1 * win(u, 0.66, 0.77, 0.04),
      title: hour === 'night' ? 'The Jade Range, Full Moon' : hour === 'sunrise' ? 'The Jade Range, Sunrise' : 'The Jade Range',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 30, sway: 0.6, bank: 0.8 },
      pois: [
        { at: hornAim, from: 0.03, to: 0.24, weight: 0.3 },
        { at: valleyAim, from: 0.17, to: 0.36, weight: 0.3 },
        { at: wallAim, from: 0.3, to: 0.535, weight: 0.62, fade: 0.25 },
        { at: herdAim, from: 0.445, to: 0.6, weight: 0.8 },
        { at: lamAim, from: 0.565, to: 0.632, weight: 0.55 },
        { at: hornLow, from: 0.655, to: 0.8, weight: 0.36 },
        { at: huntAim, from: 0.63, to: 0.765, weight: 0.8 },
        { at: archAim, from: 0.72, to: 1.0, weight: 0.6 },
      ],
      portal: { shape: 'circle', radius: 9.5, color: LK.portal, glow: 0.9, revealDistance: 420 },
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.55, threshold: 0.92 },
        grade: { saturation: 1.08, contrast: 1.05, tint: hour === 'sunrise' ? '#fff4e6' : hour === 'night' ? '#e8f0ff' : '#f4fbf2', shadowTint: hour === 'night' ? '#02060c' : '#04100c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        G.uTime.value = time; G.uProg.value = u; G.uVeil.value.set(windW.x * time * 15, windW.z * time * 15, 0.26);
        G.uSun.value.copy(sunDir).lerp(sunEnd, u).normalize();
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(buf); G.uVH.value = buf.y; G.uAsp.value = buf.x / Math.max(buf.y, 1); }
        hero.anchors.skeinLine.minPx.value = Math.max(11, 0.034 * G.uVH.value);     // the far skein's birds: a thirtieth of the frame across, whatever the resolution
        hero.setProgress(u); hero.setLift(1 - smoothstep(0.1, 0.3, u)); skeinAt(u); hero.update(dt, time, camera);
        sky.position.setFromMatrixPosition(camera.matrixWorld);
        poseGeese(time, u, camera); poseLam(time, u);
        fauna.update(dt, time, camera, u);
        // what cannot be seen is not drawn: the alp's and the spur's ground cover lies above and beyond the headwall until we near it,
        // and the gorge forest is all astern once we are over its lip (the camera never looks back)
        for (const m of cover) if (m) m.visible = u > 0.12;
        for (const m of coverHi) if (m) m.visible = u > 0.33;
        if (forest[3]) forest[3].visible = u > 0.12 && u < 0.6;
        if (forest[6]) forest[6].visible = u > 0.33;
        if (forest[0]) forest[0].visible = u < 0.245;
        for (const i of [1, 2, 4, 5]) if (forest[i]) forest[i].visible = u < 0.39;
        gorgeBits.visible = u < 0.39; gateBits.visible = u > 0.3; hornGlare.visible = u > 0.3; ribbons.visible = u > 0.5;
        if (shaft) {
          // eased in over a full second, three seconds across the sea and over the skein, eased out
          // eased in over a full second; the foot comes in over the sea from the wall's side, 160 m ahead, crosses the skein
          // (every wing white for three seconds) and leaves astern; the beam itself is parallel to the sun's rays
          const k = smoothstep(0.455, 0.48, u) * (1 - smoothstep(0.54, 0.565, u)), e = clamp((u - 0.455) / 0.11, 0, 1), d0 = u * PL, d = d0 + lerp(160, -35, e);
          path.posAtDist(d, shaftTo); path.tangentAtDist(d, sT); sR.set(-sT.z, 0, sT.x).normalize();
          shaftTo.addScaledVector(sR, lerp(190, -80, Math.pow(e, 0.9))).setY(CLOUD_Y);
          path.posAtDist(d0 + 14, sMid); const gap = Math.hypot(shaftTo.x - sMid.x, shaftTo.z - sMid.z);
          G.uShaft.value.set(shaftTo.x, shaftTo.z, k * (night ? 0.3 : 1), k * (1 - smoothstep(14, 50, gap)) * (night ? 0.45 : 1));     // at night a moonbeam, dimmer
          shaft.material.uniforms.uTo.value.copy(shaftTo); shaft.material.uniforms.uFrom.value.copy(shaftTo).addScaledVector(G.uSun.value, 1100);
        }
      },
      dispose() { if (hero.dispose) hero.dispose(); },
    };
  },
};
