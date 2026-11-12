// THE CLOUD ARMADA: a sunset flight up a canyon of cumulus towers among a hundred hot-air balloons.
// Beats: skim the cloud sea toward the canyon mouth (sun half hidden behind a tower, god rays, balloons as bright
// dots) -> cranes cross in a V at 0.3 -> a thin veil of cloud whites the lens out -> emerge beside the Flagship as
// its burner fires and the envelope lights like a paper lantern -> climb a cloud saddle, the sun breaks free and the
// Honour Guard hexagon stands at the end of the canyon -> a straight avenue of back-lit balloons to the portal.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, makeRng, clamp, lerp, smoothstep, remap } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, buildFleet } from '../parts/cloud-armada.js';

const PALETTE = ['#2b3f8f', '#8a6fb5', '#ff9e6b', '#ffd9a8', '#f7efe6', '#5a4a78', '#ff4f3a'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// three evenings (the seed picks one): a golden-peach early sunset under a blue zenith, the rose dusk, and deep ember with the stars out
const MOODS = [
  { name: 'gold', el: 7.2, zenith: '#2b3f8f', mid: '#5672c6', horizon: '#ffc488', ground: '#d0a58c', scatter: '#ffa23c', sun: '#ffc070', hPow: 4.8,
    light: '#ffb26a', lit: '#ffb870', rim: '#ffac58', shade: '#8a78c0', haze: '#c9a0a8', tint: '#fff0d6', stars: 0.1, cirrusLit: '#ffcf98', cirrusShade: '#8076b8', fleet: 0 },
  { name: 'rose', el: 5.6, zenith: '#1f2f86', mid: '#5562b8', horizon: '#ff9f80', ground: '#aa82a6', scatter: '#ff884a', sun: '#ffa05c',
    light: '#ffa06a', lit: '#ffb07c', rim: '#ff9e5c', shade: '#8a6fb5', haze: '#c096ae', tint: '#fff1ea', stars: 0.26, cirrusLit: '#ffb890', cirrusShade: '#5c56a0', fleet: 1 },
  { name: 'ember', el: 3.7, zenith: '#171f6c', mid: '#3f46a0', horizon: '#f67862', ground: '#93688f', scatter: '#ff6230', sun: '#ff8046',
    light: '#ff8654', lit: '#ff9c6c', rim: '#ff8850', shade: '#90689e', haze: '#b47e98', tint: '#ffece6', stars: 0.6, cirrusLit: '#ff9c7c', cirrusShade: '#444088', fleet: 2 },
];

// ---------------------------------------------------------------- the land far below, seen through gaps in the sea
// Flat discs lying on the cloud deck. Each fragment follows its view ray down to a plane `ground` metres below and
// shades a dusk landscape there (fields, a silver river and its lakes, village lights), so the land slides with true
// parallax under the hole. The cloud field's `avoid` spheres open the matching gaps in the puffs.
function makeLandWindows(holes, y, opts) {
  const geos = [];
  for (const h of holes) {
    const g = new THREE.CircleGeometry(h.r * 1.85, 40); g.rotateX(-Math.PI / 2); g.translate(h.x, y, h.z);
    const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([h.x, h.z, h.r], i * 3);
    g.setAttribute('aHole', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('normal'); g.deleteAttribute('uv');
    geos.push(g);
  }
  const geo = mergeGeometries(geos); for (const g of geos) g.dispose();
  const uniforms = {
    uTime: { value: 0 }, uGround: { value: opts.ground }, uHaze: { value: new THREE.Color(opts.haze) }, uSilver: { value: new THREE.Color(opts.silver) },
    uLand: { value: new THREE.Color('#3a3f78') }, uLand2: { value: new THREE.Color('#6a5a90') }, uWarm: { value: new THREE.Color(opts.warm) },
    uWall: { value: new THREE.Color(opts.wall) }, uWallDeep: { value: new THREE.Color(opts.wall).lerp(new THREE.Color(opts.haze), 0.45).multiplyScalar(0.84) },
    uFogColor: { value: new THREE.Color(opts.haze) }, uFogDensity: { value: 0 },
    uSunXZ: { value: new THREE.Vector2(opts.sunDir.x, opts.sunDir.z).normalize() }, uSeed: { value: opts.seed },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 aHole; varying vec3 vW, vHole;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vHole = aHole; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime, uGround, uSeed, uFogDensity; uniform vec3 uHaze, uSilver, uLand, uLand2, uWarm, uWall, uWallDeep, uFogColor; uniform vec2 uSunXZ;
      varying vec3 vW, vHole;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}${fx.GLSL_FBM}
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        // the ray is bent downward a little, so a hole seen at a grazing angle still shows land a few km off, not the horizon
        float t = (uGround - cameraPosition.y)/(min(V.y, -0.02) - 0.22);
        vec2 g = cameraPosition.xz + V.xz*t;
        vec2 q = g*0.00021 + uSeed;
        float n1 = fbm(q), n2 = fbm(q*2.9 + 11.3);
        float air = 1.0 - exp(-t*0.00012);                          // three kilometres of dusk air
        // the shaft: land shows down the middle, ringed by the shaded inner wall of the cloud deck
        float r = length(vW.xz - vHole.xy);
        float m = vnoise(vW.xz*0.011 + uTime*0.012)*0.6 + vnoise(vW.xz*0.034 - uTime*0.01)*0.4;
        float rn = r/vHole.z + (m - 0.5)*0.55;
        float open = 1.0 - smoothstep(0.35, 1.0, rn);
        float a = 1.0 - smoothstep(1.05, 1.55, rn);
        vec3 col = mix(uLand, uLand2, smoothstep(0.32, 0.68, n2));
        vec2 cell = floor(g*0.0017 + n1*2.5);                       // a patchwork of fields
        col *= 0.74 + 0.52*hash12(cell);
        float sl = n1 - fbm(q + uSunXZ*0.03);                       // slopes that face the low sun catch its last light
        col += uWarm*smoothstep(0.0, 0.035, sl)*0.55;
        float rv = abs(n1 - 0.5), w = 0.03 + 0.02*n2;              // the river: a winding contour of the land
        float water = max(1.0 - smoothstep(w*0.5, w, rv), 0.7*smoothstep(0.76, 0.79, n1));
        float shimmer = 0.82 + 0.36*vnoise(g*0.0045 + vec2(uTime*0.4, -uTime*0.23));
        vec2 c2 = g*0.0042, id = floor(c2), f = fract(c2) - 0.5;    // villages along the banks, their lamps twinkling
        float h = hash12(id + 7.0);
        float lamp = step(0.8, h)*(1.0 - smoothstep(0.06, 0.2, length(f - (hash22(id) - 0.5)*0.6)))*(1.0 - water)*(1.0 - smoothstep(0.0, 0.07, rv - w));
        col = mix(col, uHaze, 0.6*clamp(0.3 + 0.7*air, 0.0, 1.0));
        col = mix(col, uSilver*0.8*shimmer, water*open*a*(0.75 - 0.4*air));
        col += vec3(1.0, 0.6, 0.26)*lamp*(1.9 + 0.7*sin(uTime*(2.0 + h*5.0) + h*40.0))*(1.0 - 0.5*air);
        vec3 wall = mix(uWallDeep, uWall, smoothstep(0.4, 1.3, rn))*(0.9 + 0.2*m);
        col = mix(wall, col, open);
        float fd = uFogDensity*length(vW - cameraPosition);
        col = mix(col, uFogColor, 1.0 - exp(-fd*fd));
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.renderOrder = 1.5; mesh.name = 'landWindows';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- the airship: a long envelope lit from within
function makeAirship(rng, pal) {
  const group = new THREE.Group(); group.name = 'airship';
  const L = 118, R = 13.5, N = 30, pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N, r = R * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.62); pts.push(new THREE.Vector2(Math.max(r, 0.05), (t - 0.5) * L)); }
  const hullGeo = new THREE.LatheGeometry(pts, 28); hullGeo.rotateZ(-Math.PI / 2);          // nose toward +X
  // ribs and ring frames in silhouette against the lamps inside
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
  const c = cv.getContext('2d');
  const grd = c.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, '#5a2a10'); grd.addColorStop(0.25, '#ffb060'); grd.addColorStop(0.75, '#ffc880'); grd.addColorStop(1, '#5a2a10');
  c.fillStyle = grd; c.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 14; k++) { const x = k / 14 * 256; const g2 = c.createLinearGradient(x - 9, 0, x + 9, 0); g2.addColorStop(0, 'rgba(40,14,6,0)'); g2.addColorStop(0.5, 'rgba(40,14,6,0.85)'); g2.addColorStop(1, 'rgba(40,14,6,0)'); c.fillStyle = g2; c.fillRect(x - 9, 0, 18, 256); }
  c.fillStyle = 'rgba(40,14,6,0.7)'; for (let k = 1; k < 11; k++) c.fillRect(0, k / 11 * 256 - 2, 256, 4);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(pal[4]).multiplyScalar(0.72), roughness: 0.85, metalness: 0,
    emissive: new THREE.Color('#ff9a4a'), emissiveMap: tex, emissiveIntensity: 0.85 }));
  group.add(hull);
  // fins, gondola and engine cars: one vertex-coloured mesh
  const parts = [], tint = (g, col) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([col.r, col.g, col.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); parts.push(g); };
  const finCol = new THREE.Color(rng.pick([pal[6], pal[0], pal[5]])).multiplyScalar(0.7), wood = new THREE.Color(0.2, 0.12, 0.07), brass = new THREE.Color(0.5, 0.36, 0.14);
  for (let k = 0; k < 4; k++) {
    const g = new THREE.BoxGeometry(24, 13, 0.7, 1, 1, 1); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getX(i) < 0 && p.getY(i) > 0) p.setY(i, p.getY(i) * 0.35);   // swept leading edge
    g.translate(-L / 2 + 15, 9.5, 0); g.rotateX(k * Math.PI / 2 + Math.PI / 4); tint(g, finCol);
  }
  { const g = new THREE.BoxGeometry(36, 4.6, 6.4); g.translate(6, -R - 1.6, 0); tint(g, wood); }
  for (const sz of [-1, 1]) { const g = new THREE.CylinderGeometry(1.6, 1.2, 7, 8); g.rotateZ(Math.PI / 2); g.translate(-14, -R * 0.55, sz * (R * 0.95)); tint(g, brass); }
  const body = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })); for (const g of parts) g.dispose();
  group.add(body);
  // the lit gallery: a band of windows along the gondola
  const wg = new THREE.BoxGeometry(32, 1.5, 6.6); wg.translate(6, -R - 1.0, 0);
  group.add(new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.0, 0.9) })));
  return { object: group, length: L, radius: R, lamps: [V3(L / 2 + 0.5, 0, 0), V3(-L / 2 + 4, 16, 0), V3(6, -R - 4.5, 0)] };
}

// ---------------------------------------------------------------- crepuscular rays
// A fan of soft additive blades around the sun, placed at infinity around whichever camera renders it and drawn
// straight after the sky, so every cloud tower and the cloud sea cover it: the rays show only where the sky is open,
// fanning out from behind the tower that hides the sun. (The kit's god rays fade out when seen end-on, which is
// exactly this view.)
function makeSunFan(rng, sunDir, color) {
  const N = 15, P = [], B = [], S = [], I = [];
  for (let i = 0; i < N; i++) {
    const th = (-0.3 + (i + rng.range(-0.38, 0.38)) / (N - 1) * 3.75), len = rng.range(0.38, 1.05), w0 = rng.range(0.004, 0.011), w1 = rng.range(0.03, 0.1), seed = rng();
    const b = P.length / 3;
    for (const y of [0, 0.33, 0.66, 1]) for (const x of [-1, 1]) { P.push(x, y, 0); B.push(th, w0, w1, len); S.push(seed); }
    for (let k = 0; k < 3; k++) { const a = b + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aBlade', new THREE.Float32BufferAttribute(B, 4));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(S, 1)); geo.setIndex(I);
  const e1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), sunDir).normalize(), e2 = new THREE.Vector3().crossVectors(sunDir, e1).normalize();
  const uniforms = { uTime: { value: 0 }, uSun: { value: sunDir.clone() }, uE1: { value: e1 }, uE2: { value: e2 }, uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0.2 } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform vec3 uSun, uE1, uE2; uniform float uTime;
      attribute vec4 aBlade; attribute float aSeed;
      varying vec2 vUv; varying float vSeed;
      void main(){
        float th = aBlade.x + 0.07*sin(uTime*0.06 + aSeed*30.0);
        float s = position.y, r = mix(0.025, aBlade.w, s), hw = mix(aBlade.y, aBlade.z, s);
        vec2 dir = vec2(cos(th), sin(th)), q = dir*r + vec2(-dir.y, dir.x)*position.x*hw;
        vec3 d = normalize(uSun + uE1*q.x + uE2*q.y);
        vUv = vec2(position.x, s); vSeed = aSeed;
        gl_Position = projectionMatrix*viewMatrix*vec4(cameraPosition + d*3000.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uTime, uIntensity;
      varying vec2 vUv; varying float vSeed;
      void main(){
        float across = max(1.0 - vUv.x*vUv.x, 0.0); across *= across;
        float along = smoothstep(0.0, 0.14, vUv.y)*pow(max(1.0 - vUv.y, 0.0), 1.5);
        float breathe = 0.55 + 0.45*sin(uTime*(0.22 + vSeed*0.4) + vSeed*40.0);
        gl_FragColor = vec4(uColor*(across*along*breathe*uIntensity), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, material); mesh.frustumCulled = false; mesh.renderOrder = -0.5; mesh.name = 'sunFan';
  return { object: mesh, uniforms };
}

export default {
  id: 'cloud-armada', name: 'The Cloud Armada', category: 'sky', weirdness: 0.12,
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene();
    const moodPick = rng.int(0, MOODS.length - 1);     // consecutive seeds step through the three evenings
    const mood = MOODS[Number.isFinite(ctx.seed) ? Math.floor(Math.abs(ctx.seed)) % MOODS.length : moodPick];
    const hazy = rng();                                   // weather: a clear evening .. heavy golden haze
    const sunAz = rng.range(2, 3.5), sunEl = mood.el + rng.range(-0.5, 0.5), windSign = rng.sign();
    const SEA = -25;                                      // top of the cloud sea

    // ---------------- sky and light
    const sky = makeSky({ rng, preset: 'sunset', sunElevation: sunEl, sunAzimuth: sunAz, zenith: mood.zenith, mid: mood.mid, horizon: mood.horizon, ground: mood.ground,
      horizonPow: mood.hPow || 3.8, scatterColor: mood.scatter, scatter: mood.hPow ? 1.0 : 0.85, scatterPow: 3.2, scatterHigh: 0.04, sunColor: mood.sun, sunSize: 1.3, sunIntensity: 12, sunGlow: 0.9, sunGlowTight: 0.4, stars: mood.stars,
      clouds: { coverage: lerp(0.2, 0.34, rng()), lit: mood.cirrusLit, shade: mood.cirrusShade, silver: 2.0, absorb: 1.6 }, clouds2: { lit: mood.cirrusLit, shade: mood.cirrusShade, opacity: 0.36, coverage: lerp(0.2, 0.4, rng()) },
      cloudLit: mood.lit, cloudShade: mood.shade, lightColor: mood.light, lightIntensity: 3.2, ambientColor: '#7f8ad8', groundLight: '#a8808c', ambientIntensity: 0.6, cloudLightColor: mood.rim });
    scene.add(sky.object);
    const fogBase = sky.fogColor.clone().lerp(new THREE.Color(mood.horizon), 0.4), fogDensity = lerp(0.00034, 0.0006, hazy), cream = new THREE.Color(PALETTE[4]);
    scene.fog = new THREE.FogExp2(fogBase.clone(), fogDensity);
    const rig = makeLightRig(sky, { bounce: 0.45 }); scene.add(rig.object);
    const sunDir = sky.sunDirection.clone(), sunXZ = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
    await ctx.yield();

    // ---------------- the Flagship, and the path laid through its fly-by line
    const flagship = await buildHero(ctx, { piece: 'flagship', palette: PALETTE, autoFlare: false });
    await ctx.yield();
    const phi = Math.PI / 2 - (38 + rng.range(-4, 4)) * Math.PI / 180, cs = Math.cos(phi), sn = Math.sin(phi);
    const FL = flagship.anchors.flyThrough, yM = 88 + rng.range(-4, 4), M = V3(64 + rng.range(-8, 8), yM, -490);
    const Fpos = V3(M.x - FL[2].z * sn, yM - FL[2].y, M.z - FL[2].z * cs);
    const toWorld = (p) => V3(Fpos.x + p.x * cs + p.z * sn, Fpos.y + p.y, Fpos.z - p.x * sn + p.z * cs);
    flagship.object.position.copy(Fpos); flagship.object.rotation.y = phi; scene.add(flagship.object);
    const j = () => rng.range(-10, 10);
    const endX = 146 + rng.range(-6, 6), endY = 146 + rng.range(-5, 5), endZ = -1126;
    const path = makePath([
      [0, 44, 0], [-46 + j(), 44, -100], [-75 + j(), 50, -206], [-67 + j(), 62, -296], [-25 + j() * 0.5, 75, -375],
      toWorld(FL[1]), toWorld(FL[2]), toWorld(FL[3]),
      [endX - 8, 118, -645], [endX, endY + 4, -745], [endX, endY + 5, -820], [endX, endY + 2, -920], [endX, endY, -1040], [endX, endY, endZ]]);
    const uLevel = path.nearestXZ(M.x, M.z).u, uVeil = uLevel - 0.086;
    const flagC = toWorld(V3(0, 30, 0)), flagGaze = toWorld(V3(0, 25, 0)), guardC = V3(endX, endY, endZ);

    // ---------------- the Honour Guard around the portal seat
    const guard = await buildHero(ctx, { piece: 'guard', palette: PALETTE });
    guard.object.position.set(endX, endY - guard.anchors.portalSeat.position.y, endZ); scene.add(guard.object);
    await ctx.yield();

    // the airship's track, far off to the left: towers keep clear of it
    const shipA = V3(-640 + rng.range(-80, 80), 225 + rng.range(-20, 30), -650), shipB = V3(-470 + rng.range(-40, 40), 300 + rng.range(-20, 40), -1750);
    const nearTrack = (x, z) => { const ax = shipB.x - shipA.x, az = shipB.z - shipA.z, t = clamp(((x - shipA.x) * ax + (z - shipA.z) * az) / (ax * ax + az * az), -0.1, 1.15); return Math.hypot(x - shipA.x - ax * t, z - shipA.z - az * t); };

    // ---------------- cloud towers: the canyon walls
    const at = (u) => path.pointAt(clamp(u, 0, 1)), rightAt = (u) => { const t = path.tangentAt(clamp(u, 0, 1)); return new THREE.Vector2(-t.z, t.x).normalize(); };
    const towers = [];
    // would this tower stand between the sun and the camera on the final approach?
    const hidesSun = (x, z, W) => { for (let u = 0.58; u <= 1.001; u += 0.06) { const p = at(u), dx = x - p.x, dz = z - p.z; if (dx * sunXZ.x + dz * sunXZ.y > 0 && Math.abs(dx * sunXZ.y - dz * sunXZ.x) < 0.55 * W + 25) return true; } return false; };
    const behindPortal = (x, z, W) => z < endZ + 150 && Math.abs(x - endX) < 0.62 * W + 105;      // open sky behind the hexagon
    const towerOk = (x, z, W, gap, flagGap = 150, sep = 0.4) => path.nearestXZ(x, z).dist > 0.65 * W + gap && Math.hypot(x - flagC.x, z - flagC.z) > 0.65 * W + flagGap
      && !hidesSun(x, z, W) && !behindPortal(x, z, W) && nearTrack(x, z) > 0.65 * W + 50 && towers.every((t) => Math.hypot(t.x - x, t.z - z) > (t.W + W) * sep);
    // the tower that half hides the sun from the entry: its left flank sits on the line from the entry point to the sun.
    // The sun is almost dead ahead of the final straight, so the only room for it is inside the first bend of the path.
    let sunTower = null;
    for (const [gap, flagGap] of [[84, 150], [62, 120], [48, 100]]) for (let W = 300; W >= 180 && !sunTower; W -= 20) for (let d = 200; d <= 580 && !sunTower; d += 10) {
      const x = path.start.x + sunXZ.x * d - sunXZ.y * 0.56 * W, z = path.start.z + sunXZ.y * d + sunXZ.x * 0.56 * W;
      if (towerOk(x, z, W, gap, flagGap)) { sunTower = { x, z, W }; towers.push(sunTower); }
    }
    // [u, side, width, gap to the path]. The first half opens wide on the Flagship; after it the walls close in to a
    // canyon 200-300 m across that stands far above the camera (tall: true).
    const stations = [[0.13, -1, 340, 190], [0.2, 1, 300, 115], [0.27, -1, 320, 150], [0.5, 1, 330, 105], [0.46, -1, 420, 200],
      [0.63, -1, 340, 104, 1], [0.7, 1, 300, 108, 1], [0.8, -1, 370, 112, 1], [0.88, 1, 340, 108, 1], [0.97, -1, 320, 118, 1], [0.76, 1, 350, 110, 1], [0.92, -1, 350, 118, 1], [0.99, 1, 330, 125, 1]];
    for (const [u, side, W0, gap0, tall] of stations) {
      const W = W0 * rng.range(0.88, 1.12), p = at(u), r = rightAt(u);
      for (let k = 0, lat = 0.65 * W + gap0 * (tall ? rng.range(0.95, 1.1) : rng.range(0.9, 1.25)); k < 10; k++, lat += 35) {
        const x = p.x + r.x * side * lat, z = p.z + r.y * side * lat;
        if (towerOk(x, z, W, tall ? 92 : 82, 150, tall ? 0.34 : 0.4)) { towers.push({ x, z, W, tall: !!tall }); break; }
      }
    }
    for (const side of [1, -1]) for (let row = 0; row < 2; row++) {       // the canyon runs on beyond the portal: the hexagon hangs in the slot between its walls
      const W = (row ? 330 : 390) * rng.range(0.92, 1.08) * (side < 0 ? 0.86 : 1), z0 = endZ - (190 + row * 340 + rng.range(0, 70)), lat0 = 0.62 * W + 112 + row * 24 + rng.range(0, 24);
      for (let k = 0; k < 5; k++) { const x = endX + side * (lat0 + k * 28), z = z0 - k * 30; if (towerOk(x, z, W, 92, 150, 0.34)) { towers.push({ x, z, W, tall: true }); break; } }
    }
    for (const [dx, dz, W] of [[-rng.range(400, 520), -rng.range(450, 800), 440], [rng.range(640, 800), -rng.range(250, 650), 500]])   // frame the far end
      for (let k = 0; k < 6; k++) { const x = endX + dx * (1 + k * 0.18), z = endZ + dz; if (towerOk(x, z, W, 200)) { towers.push({ x, z, W }); break; } }
    for (let k = 0, n = 0; k < 50 && n < 9; k++) {                                                // the far ranges
      const a = rng.range(0, Math.PI * 2), d = rng.range(1250, 2300), W = rng.range(460, 720), x = 60 + Math.sin(a) * d, z = -620 - Math.cos(a) * d;
      if (towerOk(x, z, W, 300)) { towers.push({ x, z, W }); n++; }
    }

    // ---------------- gaps in the sea with the land far below
    const DECK = SEA - 92 * 0.7, holes = [];
    for (const [u, side] of [[0.08, 1], [0.24, -1], [0.38, 1], [0.57, -1], [0.78, rng.sign()], [0.93, 1]]) {
      const uu = u + rng.range(-0.02, 0.02), p = at(uu), r = rightAt(uu), R = rng.range(105, 150), lat = (u < 0.1 ? rng.range(150, 200) : rng.range(70, 140)) + R * 0.4;
      const x = p.x + r.x * side * lat, z = p.z + r.y * side * lat;
      if (towers.every((t) => Math.hypot(t.x - x, t.z - z) > 0.6 * t.W + R * 0.8)) holes.push({ x, z, r: R });
    }
    const underside = new THREE.Color(mood.shade).lerp(new THREE.Color(mood.haze), 0.6);   // cloud bases and deep folds catch the horizon's rose, never darker than the shade
    const land = holes.length ? makeLandWindows(holes, DECK + 1.5, { ground: -2600, haze: mood.haze, wall: underside, silver: new THREE.Color(mood.lit).lerp(new THREE.Color('#fff6ee'), 0.55).multiplyScalar(1.3), warm: new THREE.Color(mood.scatter).multiplyScalar(0.3), sunDir, seed: rng.range(0, 50) }) : null;
    if (land) scene.add(land.object);

    const sea = makeCloudField({ rng, mode: 'sea', sky, altitude: SEA, relief: lerp(65, 80, rng()), towers: 0, silver: 1.8, bottomColor: underside, wind: [2.2 * windSign, 0, 0.9],
      avoid: holes.map((h) => [h.x, DECK + 26, h.z, h.r]) });
    scene.add(sea.object);
    await ctx.yield();
    const towerAt = (t) => [t.x, SEA - 50, t.z, t.W];
    const towerField = makeCloudField({ rng, sky, at: towers.filter((t) => !t.tall).map(towerAt), height: 1.75, puffs: 56, silver: 4.4, bottomColor: underside, bump: 1.25, wind: [0.5 * windSign, 0, 0.15],
      noiseTexture: sea.noiseTexture, farFade: [3300, 4300] });
    scene.add(towerField.object);
    const wallAt = [];                                   // each wall tower is a broad base with a second mass stacked inside it, so it stays solid to its top
    for (const t of towers) if (t.tall) wallAt.push(towerAt(t), [t.x + rng.range(-0.1, 0.1) * t.W, SEA - 50 + 0.5 * t.W, t.z + rng.range(-0.1, 0.1) * t.W, 0.74 * t.W]);
    const wallField = makeCloudField({ rng, sky, at: wallAt, height: 2.4, puffs: 56, silver: 4.4, bottomColor: underside, bump: 1.25, wind: [0.5 * windSign, 0, 0.15],
      noiseTexture: sea.noiseTexture, farFade: [3300, 4300] });
    scene.add(wallField.object);
    await ctx.yield();
    // the saddle the camera climbs over, and low banks beside the final avenue
    const uS = path.nearestXZ(endX, -735).u, pS = at(uS), rS = rightAt(uS), low = [];
    for (let k = -3; k <= 3; k++) { const W = (Math.abs(k) < 2 ? 135 : 185) * rng.range(0.9, 1.1); low.push([pS.x + rS.x * k * 62 + rng.range(-12, 12), SEA + 10 + Math.abs(k) * 6, pS.z + rS.y * k * 62 + rng.range(-25, 25), W]); }
    for (let k = 0; k < 6; k++) { const p = at(0.72 + k * 0.045), side = k % 2 ? 1 : -1; low.push([p.x + side * rng.range(115, 190), SEA - 10, p.z + rng.range(-20, 20), rng.range(120, 170)]); }
    for (let k = 0; k < 14; k++) {                       // billows that break the sea's surface out to the horizon, either side of the second half
      const uu = 0.6 + 0.4 * (k + rng()) / 14, p = at(uu), r = rightAt(uu), side = k % 2 ? 1 : -1, lat = rng.range(150, 500);
      low.push([p.x + r.x * side * lat, SEA + rng.range(-5, 15), p.z + r.y * side * lat, rng.range(120, 200)]);
    }
    for (let k = 0; k < 7; k++) low.push([endX + rng.range(-420, 420), SEA + rng.range(-12, 4), endZ - rng.range(160, 1100), rng.range(130, 210)]);   // and beyond the portal, all below the horizon
    { // and either side of the first half, so the opening skims over a sea with crests, not a smooth floor (its own
      // random stream: the rest of the world stays where it was)
      const lr = makeRng(7919 + (Number.isFinite(ctx.seed) ? Math.floor(Math.abs(ctx.seed)) : 0) * 131);
      for (let k = 0; k < 14; k++) {
        const uu = 0.02 + 0.48 * (k + lr()) / 14, p = at(uu), r = rightAt(uu), side = k % 2 ? 1 : -1, W = lr.range(105, 165), lat = 0.5 * W + lr.range(90, 360);
        const x = p.x + r.x * side * lat, z = p.z + r.y * side * lat, y = SEA + lr.range(-8, 8);
        if (Math.hypot(x - flagC.x, z - flagC.z) > 135 + 0.5 * W && path.nearestXZ(x, z).dist > 0.5 * W + 80 && holes.every((h) => Math.hypot(x - h.x, z - h.z) > h.r + 0.4 * W)) low.push([x, y, z, W]);
      }
    }
    const lowField = makeCloudField({ rng, sky, at: low, height: 0.62, puffs: 34, silver: 1.8, bottomColor: underside, wind: [0.5 * windSign, 0, 0.15], noiseTexture: sea.noiseTexture, renderOrder: 3 });
    scene.add(lowField.object);
    await ctx.yield();

    // ---------------- the armada: about a hundred free balloons at every distance
    const balloons = [], risers = [], tmpV = new THREE.Vector3();
    { // three that lift out of the cloud sea beside the opening leg (raised with u in update)
      const p = at(0.17), r = rightAt(0.17);
      for (let k = 0; k < 3; k++) { const lat = 46 + k * 34 + rng.range(-8, 8), al = (k - 1) * 46 + rng.range(-10, 10); risers.push({ pos: V3(p.x + r.x * lat - r.y * al, SEA - 4 - k * 9, p.z + r.y * lat + r.x * al), s: rng.range(0.95, 1.25), near: true, bob: 1 }); }
    }
    const freeSpot = (x, y, z, s, minPath, avenue) => {
      const cy = y + 14 * s;
      if (y < SEA + 30 || path.distanceTo(x, cy, z) < minPath + 8 * s) return false;
      if (flagC.distanceTo(tmpV.set(x, cy, z)) < 135 || guardC.distanceTo(tmpV) < 96) return false;
      if (z < -700 && z > endZ - 140 && Math.abs(x - endX) < 46) return false;                 // the avenue to the portal stays open
      if (!avenue && z < endZ + 150 && Math.abs(x - endX) < 150 + 0.32 * Math.max(0, endZ - z)) return false;   // and the hexagon keeps a clean sky around it
      for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < 0.62 * t.W + 12) return false;
      for (const b of risers) if (Math.hypot(x - b.pos.x, z - b.pos.z) < 34) return false;
      for (const b of balloons) if (Math.hypot(x - b.pos.x, y - b.pos.y, z - b.pos.z) < (b.s + s) * 15) return false;
      return true;
    };
    const add = (x, y, z, s, minPath = 34, avenue = false, extra = null) => { if (!freeSpot(x, y, z, s, minPath, avenue)) return false; balloons.push({ pos: V3(x, y, z), s, near: path.distanceTo(x, y + 14 * s, z) < 150, ...extra }); return true; };
    // lat = metres to the side of the path, dy = height of the balloon's middle above the path
    const beside = (u, side, lat, dy, s, minPath, avenue, extra) => { const p = at(u), r = rightAt(u); return add(p.x + r.x * side * lat, p.y + dy - 14 * s, p.z + r.y * side * lat, s, minPath, avenue, extra); };
    // the opening third has its own big subjects: dressed balloons of the 35 m class passed at 32-36 m, hung with bunting.
    // The first stands on the entry axis, so it is also what the previous world's portal shows of this one.
    const gala = { hot: 0.6, dressed: true, bob: 1.4 };
    beside(0.102, -1, 33, 4, 1.7, 16, false, gala);     // a close pass as the flight opens
    beside(0.142, 1, 37, 12, 1.3, 16, false, { hot: 0.3, dressed: true, bob: 1.4 });
    beside(0.195, 1, 35, 9, 1.55, 16, false, gala);
    { // one stands on the entry axis itself, where the path first leaves it: the centre of the picture the previous portal shows
      const t0 = path.tangentAt(0), h = Math.hypot(t0.x, t0.z) || 1, s = 1.7;
      let placed = false;
      for (let d = 215; d <= 360 && !placed; d += 5) { const x = path.start.x + t0.x / h * d, z = path.start.z + t0.z / h * d; placed = add(x, path.nearestXZ(x, z).y + 3 - 14 * s, z, s, 16, false, gala); }
      if (!placed) beside(0.252, -1, 34, -3, 1.5, 16, false, gala);      // a cloud tower stands on the axis this evening
    }
    beside(0.312, 1, 35, 6, 1.6, 16, false, gala);      // at the canyon mouth
    beside(0.345, -1, 58, -10, 1.2, 30);
    beside(0.585, 1, 52, 18, 1.1, 30);                  // on the climb to the saddle
    for (let k = 0, n = rng.int(8, 9) * 2; k < n; k++)  // the avenue: back-lit balloons flanking the last straight
      beside(0.665 + (k / n) * 0.265 + rng.range(-0.006, 0.006), k % 2 ? 1 : -1, rng.range(50, 64) + 32 * Math.pow(k / n, 1.5), rng.range(-24, 28), rng.range(0.9, 1.35), 38, true);   // widening toward the hexagon, whose silhouette stays clear
    for (let k = 0, n = 0, want = rng.int(38, 50); k < 700 && n < want; k++) {                 // scattered through the canyon
      const u = rng.range(0.08, 0.98); if (beside(u, rng.sign(), rng.range(60, 300), rng.range(-45, 170) * (0.4 + u), rng.range(0.8, 1.45), 46)) n++;
    }
    for (let k = 0, n = 0, want = rng.int(30, 42); k < 900 && n < want; k++)                    // and far away in every direction
      if (add(rng.range(-1000, 1200), rng.range(40, 520), rng.range(-2500, -80), rng.range(1.0, 2.0), 260)) n++;
    const fleet = buildFleet(ctx, { palette: PALETTE, theme: mood.fleet, balloons, wind: V3(windSign, -0.25, 0.2) });
    scene.add(fleet.object);
    await ctx.yield();
    const riseFleet = buildFleet(ctx, { palette: PALETTE, theme: mood.fleet, balloons: risers, wind: V3(windSign * 0.4, -1, 0.1) });
    scene.add(riseFleet.object);

    // ---------------- the airship
    const ship = makeAirship(rng, PALETTE); scene.add(ship.object);
    const shipDir = shipB.clone().sub(shipA), shipLen = shipDir.length(); shipDir.normalize();
    ship.object.rotation.y = Math.atan2(-shipDir.z, shipDir.x);
    await ctx.yield();

    // ---------------- birds
    const light = F.lightFrom(scene), birds = [];
    const cranes = F.makeFlock({ rng, species: 'flamingos', form: 'vee', count: rng.int(24, 34), size: 3.3, spacing: 5.2, speed: 15, light,
      body: '#efeae2', belly: '#f6f2ea', wingC: '#d8d4d2', trail: '#2c2a32', tip: '#17161c', head: '#b8322a', neckC: '#e6e1da', beak: '#cdb680', legC: '#34323a', tailC: '#3a3840',
      cross: { path, u: 0.3, window: 0.2, lead: 85, span: 520, angle: 68, side: rng.sign(), height: 16 } });
    birds.push(cranes);
    birds.push(F.makeFlock({ rng, species: 'swifts', size: 2.6, count: rng.int(26, 44), light, center: [flagGaze.x, flagGaze.y - 8, flagGaze.z], radius: 40, height: 14, spread: [26, 16, 26] }));
    birds.push(F.makeFlock({ rng, species: 'swifts', size: 3, count: rng.int(24, 38), light, center: [endX, endY + 4, endZ + 40], radius: 38, height: 12, spread: [16, 12, 16] }));
    const escortSpecies = rng.pick(['geese', 'gulls', 'geese']);
    birds.push(F.makeFlock({ rng, species: escortSpecies, count: rng.int(5, 11), light, along: { path, side: -rng.range(11, 18), up: -rng.range(4, 9), lead: rng.range(48, 64), from: 0, to: 0.24 } }));
    for (const b of birds) scene.add(b.object);
    await ctx.yield();

    // ---------------- air: wisps past the lens, the veil, god rays, confetti
    const T = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const puffLight = { sunDir, sunColor: mood.sun, shadowColor: mood.shade, time: T };
    const wisps = set.add(fx.makeMist({ rng: rng.fork('wisps'), follow: true, count: Math.round(lerp(16, 28, hazy)), area: [520, 120, 520], center: [0, 60, 0], size: [24, 52],
      color: mood.lit, opacity: lerp(0.07, 0.11, hazy), drift: [3.5 * windSign, 0, 1.2], ...puffLight }));
    const pV = at(uVeil), rV = rightAt(uVeil), veilPts = [];
    for (let k = 0; k < 16; k++) { const lat = rng.range(-150, 150), al = rng.range(-16, 16); veilPts.push([pV.x + rV.x * lat - rV.y * al, pV.y + rng.range(-55, 80), pV.z + rV.y * lat + rV.x * al]); }
    set.add(fx.makeMist({ rng: rng.fork('veil'), positions: veilPts, size: [70, 120], color: PALETTE[4], opacity: 0.17, flatten: 0.8, ...puffLight }));
    const rush = set.add(fx.makeMist({ rng: rng.fork('rush'), follow: true, count: 40, area: [90, 50, 90], center: [0, 0, 0], size: [20, 60], color: '#efe4f0', opacity: 0,
      drift: [6 * windSign, 0, 2], renderOrder: 45, fog: false, ...puffLight }));
    rush.object.visible = false;
    const veilU = { uOpacity: { value: 0 }, uSun: { value: sunDir.clone() }, uColor: { value: cream.clone() }, uWarm: { value: new THREE.Color(mood.lit).multiplyScalar(1.25) } };
    const veil = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12), new THREE.ShaderMaterial({ uniforms: veilU, transparent: true, depthTest: false, depthWrite: false, side: THREE.BackSide,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uSun, uColor, uWarm; uniform float uOpacity; varying vec3 vD; void main(){ float s = max(dot(normalize(vD), uSun), 0.0); gl_FragColor = vec4(mix(uColor*(0.86 + 0.1*vD.y), uWarm, s*s*0.75), uOpacity); }' }));
    veil.renderOrder = 40; veil.frustumCulled = false; veil.visible = false; scene.add(veil);
    const fan = makeSunFan(rng.fork('rays'), sunDir, mood.sun); scene.add(fan.object);
    const fanGain = lerp(0.5, 0.7, hazy);
    set.add(fx.makeParticles({ rng: rng.fork('confetti'), preset: 'petals', time: T, follow: false, center: [endX, endY + 4, endZ + 150], box: [100, 84, 290], count: 2400,
      colors: [PALETTE[3], PALETTE[6], PALETTE[4]], size: [0.35, 0.8], lightDir: sunDir }));
    const lamps = set.add(fx.makeGlows({ rng, time: T, positions: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], colors: ['#fff0d0', '#ff5a40', '#ffc070'], size: 10, intensity: 2.4, flicker: 0.5, fogAmount: 0.4 }));

    const camPos = new THREE.Vector3(), lampP = new THREE.Vector3();
    return {
      scene, path, duration: 46, title: 'The Cloud Armada',
      camera: { fov: 62, near: 0.5, far: 6500, lookAhead: 34, sway: 1, bank: 0.9 },
      pois: [
        { at: flagGaze, from: 0.14, to: uLevel + 0.02, weight: 0.5, fade: 0.35 },
        { at: flagGaze, from: uLevel - 0.085, to: uLevel + 0.06, weight: 0.7, fade: 0.5 },     // turn to face it as it fires
        { at: (time, u) => cranes.positionAt(time, u), from: 0.22, to: 0.34, weight: 0.25 },
        { at: guardC, from: 0.56, to: 0.92, weight: 0.6 },
      ],
      portal: { shape: 'circle', radius: 10, color: '#ffe6bc', glow: 1.4, revealDistance: 440 },
      post: { exposure: 1.0, bloom: { strength: 0.47, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 1.13, contrast: 1.09, tint: mood.tint, shadowTint: '#1a1838', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        camPos.setFromMatrixPosition(camera.matrixWorld); T.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        sea.update(dt, time, camera); towerField.update(dt, time, camera); wallField.update(dt, time, camera); lowField.update(dt, time, camera);
        
        fan.uniforms.uTime.value = time; fan.uniforms.uIntensity.value = fanGain * (1.5 - 1.1 * smoothstep(0.25, 0.6, u));
        // the Flagship fires as the camera draws level
        flagship.setProgress(remap(u, uLevel - 0.075, uLevel + 0.12, 0, 1));
        flagship.update(dt, time, camera); guard.update(dt, time, camera); fleet.update(dt, time); riseFleet.update(dt, time);
        riseFleet.object.position.y = 88 * smoothstep(0, 0.5, u) + 2.5 * Math.sin(time * 0.2);
        for (const b of birds) b.update(dt, time, camera, u);
        // the veil: half a second of whiteout before the Flagship
        const w = 1 - smoothstep(0.006, 0.02, Math.abs(u - uVeil));
        scene.fog.density = lerp(fogDensity, 0.0035, w * w); scene.fog.color.copy(fogBase).lerp(cream, w * 0.8);
        veil.visible = w > 0.01; veil.position.copy(camPos); veilU.uOpacity.value = smoothstep(0.05, 1, w) * 0.96;
        rush.object.visible = w > 0.05; rush.uniforms.uOpacity.value = 0.35 * smoothstep(0.1, 0.6, w);
        if (land) { land.uniforms.uTime.value = time; land.uniforms.uFogDensity.value = scene.fog.density; land.uniforms.uFogColor.value.copy(scene.fog.color); }
        wisps.uniforms.uCenter.value.y = camPos.y - 4; rush.uniforms.uCenter.value.y = camPos.y;
        set.update(dt, time, camera);
        // the airship ploughs on toward the far end of the canyon
        const f = clamp(0.08 + u * 0.95 + Math.min(time, 150) * 0.0012, 0, 1.25);
        ship.object.position.copy(shipA).addScaledVector(shipDir, shipLen * f); ship.object.position.y += Math.sin(time * 0.17) * 2.5;
        ship.object.rotation.z = Math.sin(time * 0.13) * 0.02; ship.object.updateMatrixWorld();
        for (let i = 0; i < 3; i++) { lampP.copy(ship.lamps[i]).applyMatrix4(ship.object.matrixWorld); lamps.setPosition(i, lampP.x, lampP.y, lampP.z); }
      },
      dispose() { flagship.dispose(); guard.dispose(); fleet.dispose(); riseFleet.dispose(); },
    };
  },
};
