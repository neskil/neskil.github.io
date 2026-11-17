// TEMPEST LIGHT hero set piece: a storm-battered rock lighthouse.
//
// WHAT IT IS
//   A black basalt skerry (~64 m across, crags to ~20 m) with outlying rocks, carrying a tapered
//   granite tower (base on a ledge at y=6, gallery deck at y=38, lantern/lens centre at y=41.1,
//   finial at ~49.5) with an oxide-red gallery, lantern room and cupola, lit windows and a door.
//   Inside the lantern a Fresnel optic turns; from it sweep two opposed 400 m beam cones (additive,
//   rain-streaked, fog aware) and a lantern flare that peaks when a beam points at the camera.
//   Water belongs to the piece too: wave-impact spray (jets of soft puffs plus crisp droplet streaks,
//   ballistic in the vertex shader) bursting on a 7 s cycle around the waterline, one giant "hero"
//   burst that climbs ~42 m up the tower, white water pouring back down the ledges
//   (surface ribbons + a foam wash in the rock shader) and a foam apron on the sea round the rock.
//
// SPACE   origin = centre of the rock at mean sea level (y=0), +Y up, front = +Z.
//   radius ~36 (rock; outliers reach ~95, beams 400), height ~50.
//   Weather (waves) arrives from anchors.weatherDir (default front-right, +X+Z); the lee is -X-Z.
//
// OPTS
//   palette        7 hex strings (brief order: night, slate, teal, granite shade, deep, white, lamp)
//   red            hex for gallery/lantern ironwork (default '#8a2a20')
//   weatherAngle   radians from +Z toward +X the waves come FROM (default ~0.52 +- seed jitter)
//   beamPeriod     seconds per turn (default 6), beamLength (400), beamIntensity (1)
//   beamReach      longest reach the world will ever set through uniforms.uBeamLen.value (default beamLength)
//   beamFogCut     0..1 how strongly scene fog eats the beams (default 0.8; they must pierce the squall);
//                  live as uniforms.uFogCut.value, uniforms.uBeamI.value is the live beam intensity
//   burstAt, burstSpan   u at which the hero burst starts (0.53) and the u-span of its life (0.13)
//   bursts         optional further hero bursts, [[u, span], ...] (they must not overlap)
//   apron          false to drop the foam apron if your ocean draws its own foam at the rock (default true)
//   ambient        hex: colour of unlit white water under the sky (default cold teal-grey)
//   sea            { uWA, uWB, uTime, uSpacing, uR0 (the uniforms of a kit/water makeOcean), disc: Vector4(x, z, radius, falloff)
//                  of the ocean's shoal disc at the rock, damp (ocean shoreDamp), lift }: the foam apron then rides the
//                  world's swell instead of lying flat at y = 0.45
//
// API (returned object, besides the contract fields)
//   setProgress(u)   world passes path u every frame: fires the hero burst at opts.burstAt. Until it
//                    is called the hero burst simply loops every 14 s (so the viewer shows it).
//   setFlash(v)      0..1+ lightning: lifts rock, tower and all white water for a few frames.
//   setBeamAngle(a)  radians, overrides the time-driven sweep (pass null to resume); beam A points
//                    along (sin a, 0, cos a) in local space. beamAngle() reads the current one.
//   setAmbient(hex|Color, k)  retint white water to your sky.   heightAt(x,z) local rock height.
//
// ANCHORS (local space)
//   lantern        lens centre (0,41.1,0): beam origin, flare, a good poi target
//   portalSeat     { position, facing, radius }: 14 m portal hovering 16 m up in the lee, 90 m from the
//                  tower; `facing` is the unit normal pointing back at the arriving camera
//   flyThrough     ordered points: approach from front-left, pass the tower on ITS LEFT (tower on the
//                  camera's right) 35 m out at gallery height, run out 160 m over the lee, loop left
//                  (radius 55 m) and come back in on a 110 m straight to the portal seat with the tower
//                  just left of the portal and beyond it. >= 14 m clear of every solid.
//   viewpoints     { reveal, impact, closePass } camera positions for the brief's beats
//   impact         where the hero wave detonates (foot of the weather face); calmPatch: sea point under portal
//   weatherDir, leeDir   unit vectors
//
// COST   ~64k triangles, 9 draw calls, no lights, no textures, build ~200 ms in the software harness.
//   The beams are ray-integrated in the fragment shader (20 taps) on a back-face hull: cheap unless a
//   beam fills the screen, which only happens for the instant it sweeps across the camera.
// LIGHT  made for night / late dusk: dim cold ambient plus (optionally) a low warm rim from the left.
//   Rock and tower are MeshStandardMaterial (they take the scene lights and fog); lamp spill, lit
//   windows and lightning are added in-shader. Spray, foam, beams, lens and flare are unlit linear HDR.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#070c14', '#14232e', '#1d4f5a', '#3b5a66', '#0a1a22', '#dfe9ee', '#ffd27a'];
const BASE_Y = 6, DECK_Y = 38, LENS_Y = 41.1;

const GLSL_NOISE = /* glsl */`
float tlHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float tlNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(tlHash(i), tlHash(i + vec2(1, 0)), f.x), mix(tlHash(i + vec2(0, 1)), tlHash(i + vec2(1, 1)), f.x), f.y); }
float tlFbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * tlNoise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
`;
// light falling on unlit white water: sky ambient + lamp spill + the beam cones + lightning
const GLSL_WATERLIGHT = /* glsl */`
uniform vec3 uLamp, uBeamDir, uLampCol, uAmb; uniform float uFlash, uBeamI;
vec3 tlWaterLight(vec3 wp){
  vec3 d = wp - uLamp; float dist = length(d); vec3 dir = d / max(dist, 1e-3);
  float cone = smoothstep(.991, .9994, abs(dot(dir, uBeamDir)));
  vec3 l = uAmb + uLampCol * (.3 / (1. + dist * dist / 500.));
  l += uLampCol * cone * uBeamI * 5.0 / (1. + dist / 70.);
  l += vec3(.75, .86, 1.) * uFlash * 1.6;
  return l;
}`;
const GLSL_FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float tlFf = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float tlFf = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  float tlFf = 0.;
#endif`;

function paint(geo, col, glow = 0) {
  const p = geo.attributes.position, n = p.count;
  const c = new Float32Array(n * 3), g = new Float32Array(n).fill(glow);
  for (let i = 0; i < n; i++) {
    const k = typeof col === 'function' ? col(p.getX(i), p.getY(i), p.getZ(i), i) : col;
    c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  geo.setAttribute('aGlow', new THREE.BufferAttribute(g, 1));
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return geo;
}
const place = (geo, x, y, z, ry = 0) => { if (ry) geo.rotateY(ry); return geo.translate(x, y, z); };

// MeshStandardMaterial + lamp spill, per-vertex emissive (aGlow), lightning lift and (rock) foam wash.
function patchStandard(mat, U, rock) {
  mat.onBeforeCompile = (sh) => {
    for (const k of ['uLamp', 'uLampCol', 'uFlash', 'uTime', 'uAmb', 'uOrigin', 'uWeather', 'uBeamDir', 'uBeamI']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow; varying float vGlow, vNwY; varying vec3 vHW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vGlow = aGlow; vNwY = normalize(mat3(modelMatrix) * objectNormal).y; vHW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vGlow, vNwY; varying vec3 vHW; uniform float uTime; uniform vec3 uOrigin, uWeather;
        ${GLSL_NOISE}${GLSL_WATERLIGHT} float tlFoam = 0.;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${rock ? `{
          vec3 q = vHW - uOrigin; float ang = atan(q.x, q.z);
          float colm = tlHash(floor(q.xz * .8 + tlNoise(q.xz * .15) * 2.));
          diffuseColor.rgb *= mix(1., .5 + 1.0 * colm, smoothstep(.8, .4, vNwY) * .85) * (.8 + .4 * tlFbm(q.xz * 1.7 + q.y * .9));
          float ad = acos(clamp(dot(normalize(q.xz + 1e-4), uWeather.xz), -1., 1.)) / 3.14159;
          float ph = fract(uTime / 7. - .25 * ad);
          float pulse = smoothstep(0., .1, ph) * (1. - smoothstep(.1, .8, ph));
          float wl = .9 + (4.4 - 2.8 * ad) * pulse * vGlow;
          float hh = q.y + 1.6 * (tlNoise(q.xz * .22) - .5);
          float wet = smoothstep((9.5 - 5. * ad) * vGlow, 1., hh);
          diffuseColor.rgb *= mix(1., .55, wet) * (1. + .55 * smoothstep(.45, .9, vNwY));          // upward faces carry a wet sheen
          float wob = tlNoise(q.xz * .35) * 2.5;
          float streak = tlNoise(vec2(ang * 15. + wob, q.y * .5 + uTime * 2.4)) * .65 + tlNoise(vec2(ang * 44. + wob * 2., q.y * 1.4 + uTime * 4.3)) * .35;
          float run = smoothstep(wl + 4.5, wl, hh) * smoothstep(.6, .8, streak) * smoothstep(.35, .6, tlNoise(q.xz * .13 + 7.)) * (.2 + .8 * pulse);
          float lace = smoothstep(.35, .7, tlFbm(q.xz * .7 + uTime * .5));
          float outl = 1. - smoothstep(.4, .9, vGlow);                                   // outlying rocks: a broken, feathered wash, not a white skirt
          tlFoam = clamp(smoothstep(wl + .4 + 1.6 * outl, wl - 1.4, hh + 1.8 * outl * (lace - .5)) * mix(.2 + .8 * lace, lace * .42, outl) + run * vGlow, 0., 1.);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.72, .78, .8), tlFoam);
        }` : ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        ${rock ? `{ vec3 bq = vHW * .8; float b1 = tlFbm(bq.xz + bq.y * .37), b2 = tlFbm(bq.zx * 1.3 + bq.y * .61 + 9.);
          normal = normalize(normal + (viewMatrix * vec4(b1 - .5, 0., b2 - .5, 0.)).xyz * .45); }` : ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(roughnessFactor, .42, smoothstep(.45, .9, vNwY) * float(${rock ? 1 : 0})), .9, tlFoam);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 Lw = uLamp - vHW; float dl = length(Lw);
          vec3 Lv = normalize((viewMatrix * vec4(Lw, 0.)).xyz);
          float nl = max(dot(normal, Lv), 0.) * .85 + .15;
          totalEmissiveRadiance += diffuseColor.rgb * uLampCol * nl * (2.4 / (1. + dl * dl / 46.) + .1 / (1. + dl * dl / 2600.));
          totalEmissiveRadiance += diffuseColor.rgb * uAmb * (.35 + .65 * (dot((viewMatrix * vec4(0., 1., 0., 0.)).xyz, normal) * .5 + .5));   // cold sky fill so forms read
          float up = dot((viewMatrix * vec4(0., 1., 0., 0.)).xyz, normal) * .5 + .5;
          totalEmissiveRadiance += diffuseColor.rgb * vec3(.7, .84, 1.) * uFlash * (.9 + up);
          ${rock ? `{ vec2 bx = vHW.xz - uLamp.xz; float bd = length(bx);                    // the beam's foot rims the outlying rocks warm as it passes
            float bc = smoothstep(.975, .9992, abs(dot(bx / max(bd, 1.), uBeamDir.xz))) * smoothstep(34., 52., bd);
            totalEmissiveRadiance += (diffuseColor.rgb + .012) * uLampCol * bc * uBeamI * 9. / (1. + bd / 110.) * (.25 + .75 * max(dot(normal, Lv), 0.)); }` : 'totalEmissiveRadiance += vColor.rgb * vGlow;'}
          totalEmissiveRadiance += tlFoam * tlWaterLight(vHW) * .55; }`);
  };
  mat.customProgramCacheKey = () => 'tempest-light-' + (rock ? 'rock' : 'tower');
  return mat;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('tempest-light-hero') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cNight, cSlate, cTeal, cGranite, cDeep, cWhite, cLamp] = pal;
  const cRed = new THREE.Color(opts.red || '#8a2a20');
  const tmpC = new THREE.Color();
  const mixC = (a, b, t, k = 1) => tmpC.copy(a).lerp(b, t).multiplyScalar(k);

  // ---- per-seed character ----
  const weatherAngle = opts.weatherAngle ?? (0.52 + rng.range(-0.18, 0.18));
  const weatherDir = new THREE.Vector3(Math.sin(weatherAngle), 0, Math.cos(weatherAngle));
  const beamPeriod = opts.beamPeriod ?? 6, beamLen = opts.beamLength ?? 400;
  const beamSpin = rng.chance(0.5) ? 1 : -1, beamPhase = rng.range(0, TAU);
  const slender = rng.range(0.92, 1.08);                  // tower girth
  const rBase = 5.7 * slender, rTop = 3.05 * slender;
  const roofStyle = rng.pick(['ogee', 'ogee', 'cone']);
  const daymark = rng.pick(['none', 'band', 'none', 'cap']);
  const sOff = rng.range(0, 500);
  const stretch = rng.range(1.08, 1.25), stretchA = rng.range(0, Math.PI);
  const cragA = weatherAngle + rng.range(-0.5, 0.5), cragB = cragA + Math.PI * rng.range(0.6, 0.9) * rng.sign();

  const U = {
    uTime: { value: 0 }, uLamp: { value: new THREE.Vector3(0, LENS_Y, 0) }, uBeamDir: { value: new THREE.Vector3(0, 0, 1) },
    uLampCol: { value: cLamp.clone() }, uAmb: { value: new THREE.Color(opts.ambient || '#5d7684').multiplyScalar(0.55) },
    uFlash: { value: 0 }, uBeamI: { value: opts.beamIntensity ?? 1 }, uOrigin: { value: new THREE.Vector3() },
    uWeather: { value: weatherDir.clone() }, uHero: { value: -1 }, uFlare: { value: 0 }, uRot: { value: 0 },
    uFogCut: { value: opts.beamFogCut ?? 0.8 },          // shared: a world may animate uniforms.uFogCut.value (squall -> clear)
    uBeamLen: { value: beamLen },                         // live reach of the shafts: a world may animate it up to opts.beamReach
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group(); object.name = 'tempest-light-hero';

  // ---- the skerry: height function ----
  const csA = Math.cos(stretchA), snA = Math.sin(stretchA);
  const outlineR = (x, z) => {
    const l = Math.hypot(x, z) || 1, cx = x / l, cz = z / l;
    const e = cx * csA + cz * snA;
    return 27.5 * (1 + (stretch - 1) * e * e) * (1 + 0.15 * noise.n2(cx * 1.4 + sOff, cz * 1.4) + 0.07 * noise.n2(cx * 3.7, cz * 3.7 + sOff));
  };
  const dirA = [Math.sin(cragA), Math.cos(cragA)], dirB = [Math.sin(cragB), Math.cos(cragB)], cragC = rng.range(0, TAU), dirC = [Math.sin(cragC), Math.cos(cragC)];
  let lastLed = 0;
  const heightAt = (x, z) => {
    const r = Math.hypot(x, z), R = outlineR(x, z), d = r / R;
    if (d > 1) return -9 * smoothstep(1.0, 1.3, d) - 0.5 + 0.6 * noise.n2(x * 0.2, z * 0.2);
    const cx = x / (r || 1), cz = z / (r || 1);
    const bias = Math.max(Math.pow(Math.max(0, cx * dirA[0] + cz * dirA[1]), 1.5), 0.8 * Math.pow(Math.max(0, cx * dirB[0] + cz * dirB[1]), 2.5), 1.0 * Math.pow(Math.max(0, cx * dirC[0] + cz * dirC[1]), 6));
    const crag = noise.ridged2(x * 0.03 + sOff, z * 0.03, 4);
    const ring = Math.exp(-Math.pow((r - 17) / 7.5, 2));          // crags stand off from the tower foot
    let h = 3.6 + 2.2 * noise.fbm2(x * 0.06, z * 0.06 + sOff, 3) + (5 + 19 * smoothstep(0.08, 0.6, crag)) * ring * (0.14 + 0.95 * bias);
    h = Math.min(h, 20.5);
    const edge = 1 - Math.pow(d, 3.2);                              // steep sea cliffs
    h = h * smoothstep(0, 0.42, edge) * (0.55 + 0.45 * edge) + 0.5 * noise.n2(x * 0.3, z * 0.3);
    // ledges: basalt steps with broken edges
    const step = 2.6, t = (h + 0.7 * noise.n2(x * 0.11 + 9, z * 0.11)) / step, ft = Math.floor(t);
    const hs = (ft + smoothstep(0.52, 0.94, t - ft)) * step;
    lastLed = t - ft; h = lerp(h, hs, 0.88);
    // tower ledge
    h = lerp(BASE_Y - 0.15, h, smoothstep(rBase + 1.6, rBase + 7.5, r));
    return h - 1.2 * smoothstep(0.86, 1.0, d);
  };

  // ---- rock mesh: heightfield + columnar faceting, flat shaded ----
  const rockGeos = [];
  {
    const N = 116, S = 43, pos = new Float32Array((N + 1) * (N + 1) * 3), col = new Float32Array((N + 1) * (N + 1) * 3), idx = [];
    const cBasalt = new THREE.Color(cSlate).lerp(cNight, 0.45), cWeed = new THREE.Color(cTeal).lerp(cNight, 0.55), cTop = new THREE.Color(cGranite).lerp(cSlate, 0.35);
    let k = 0;
    for (let j = 0; j <= N; j++) { if ((j & 15) === 15) await ctx.yield(); for (let i = 0; i <= N; i++, k += 3) {
      let x = (i / N * 2 - 1) * S, z = (j / N * 2 - 1) * S;
      // snap risers into vertical joints (columnar basalt hint)
      const jx = noise.n2(x * 0.5 + 31, z * 0.5) * 0.28, jz = noise.n2(x * 0.5, z * 0.5 + 77) * 0.28;
      if (i > 0 && i < N && j > 0 && j < N) { x += jx; z += jz; }
      const h = heightAt(x, z);
      pos[k] = x; pos[k + 1] = h; pos[k + 2] = z;
      const v = 0.75 + 0.5 * noise.fbm2(x * 0.16, z * 0.16, 3) + 0.25 * noise.n2(x * 1.1, z * 1.1);
      const top = smoothstep(9, 19, h) * (0.5 + 0.5 * noise.n2(x * 0.09, z * 0.09));
      const c = mixC(cBasalt, cTop, top * 0.6, v * (h > 1 && lastLed > 0.5 && lastLed < 0.96 ? 0.62 : 1.18));
      const weed = smoothstep(4.5, 0.5, h) * 0.7; c.lerp(cWeed, weed);
      // a little guano / salt on the high ledges so forms read at night
      if (h > 7 && noise.n2(x * 0.7 + 5, z * 0.7) > 0.55) c.lerp(cWhite, 0.16);
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
    } }
    await ctx.yield();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      if (pos[a * 3 + 1] < -6 && pos[b * 3 + 1] < -6 && pos[c * 3 + 1] < -6 && pos[d * 3 + 1] < -6) continue;
      if ((i + j) & 1) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(idx); await ctx.yield(); g.computeVertexNormals();
    g.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array((N + 1) * (N + 1)).fill(1), 1));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((N + 1) * (N + 1) * 2), 2));
    rockGeos.push(g);
  }
  await ctx.yield();

  // ---- fly line (decided here so outlying rocks can keep clear of it) ----
  // Approach and close pass as before; then out over the lee, one long left-hand loop (radius 55 m) and back in on a
  // 110 m straight that looks at the tower from its lee side: the portal dead ahead, the tower 13 to 30 degrees to its
  // left and 90 m beyond it, the weather-side spray bursting behind it.
  const flyThrough = [[-150, 30, 215], [-108, 32.5, 142], [-70, 35.5, 78], [-43, 38, 27], [-35, 38, -6], [-41, 34, -48],
    [-67, 29, -97], [-102, 25, -146], [-128, 22, -167], [-161, 20, -170], [-189, 19, -153], [-203, 18, -123], [-197, 17.5, -90],
    [-180, 17, -71], [-151, 16.5, -51], [-90, 16, -8]]
    .map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const SEAT = flyThrough[flyThrough.length - 1];
  const distToFly = (x, z) => {
    let best = 1e9;
    for (let i = 0; i < flyThrough.length - 1; i++) {
      const a = flyThrough[i], b = flyThrough[i + 1], dx = b.x - a.x, dz = b.z - a.z;
      const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
      best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
    }
    return best;
  };

  // ---- outlying rocks and sea stacks ----
  const outliers = [];
  {
    const nOut = rng.int(6, 9), cA = new THREE.Color(cSlate).lerp(cNight, 0.4), cB = new THREE.Color(cTeal).lerp(cNight, 0.6);
    for (let n = 0, tries = 0; n < nOut && tries < 80; tries++) {
      const a = rng.range(0, TAU), r = rng.range(44, 92), x = Math.sin(a) * r, z = Math.cos(a) * r;
      const sz = rng.range(3.5, 9) * (r < 60 ? 1.15 : 0.9);
      if (distToFly(x, z) < 24 + sz) continue;
      if (Math.hypot(x - SEAT.x, z - SEAT.z) < 46) continue;
      if (outliers.some((o) => Math.hypot(o.x - x, o.z - z) < o.sz + sz + 6)) continue;
      const tall = rng.chance(0.3) ? rng.range(1.5, 2.3) : rng.range(0.6, 1.1);
      const g = new THREE.SphereGeometry(1, 14, 9), p = g.attributes.position, so = rng.range(0, 99);
      const ex = rng.range(0.8, 1.5), rot = rng.range(0, TAU);
      for (let i = 0; i < p.count; i++) {
        let vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
        const dsp = 1 + 0.38 * noise.fbm3(vx * 1.3 + so, vy * 1.3, vz * 1.3, 3) + 0.12 * noise.n3(vx * 4 + so, vy * 4, vz * 4);
        let y = vy * dsp; y = y > 0 ? Math.round(y * 3.2) / 3.2 * 0.7 + y * 0.3 : y;     // ledges
        p.setXYZ(i, vx * dsp * sz * ex, (y * tall + 0.25) * sz, vz * dsp * sz);
      }
      g.computeVertexNormals();
      paint(g, (px, py) => mixC(cB, cA, smoothstep(0.5, 4, py), 0.8 + 0.4 * noise.n2(px * 0.4 + so, py * 0.4)), 0.35);
      place(g, x, 0, z, rot);
      rockGeos.push(g); outliers.push({ x, z, sz, top: (tall * 0.75 + 0.25) * sz }); n++;
      await ctx.yield();
    }
  }
  await ctx.yield();
  const rockMat = patchStandard(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, metalness: 0, flatShading: true }), U, true);
  const rock = new THREE.Mesh(mergeGeometries(rockGeos), rockMat); rock.name = 'skerry';
  object.add(rock);
  rockGeos.forEach((g) => g.dispose());
  await ctx.yield();

  // ---- the tower ----
  const SHAFT_TOP = 36.4;
  const rAt = (y) => rTop + (rBase - rTop) * Math.pow(1 - clamp((y - BASE_Y) / (SHAFT_TOP - BASE_Y), 0, 1), 2.3);
  const tw = [];
  const ringPut = (g, a, r, y) => { g.translate(0, y, r); g.rotateY(a); return g; };
  const cStone = new THREE.Color(cWhite).lerp(cGranite, 0.42).multiplyScalar(0.62);
  const cStoneWet = new THREE.Color(cGranite).lerp(cSlate, 0.45).multiplyScalar(0.8);
  const cAlgae = new THREE.Color(cTeal).lerp(cSlate, 0.5).multiplyScalar(0.8);
  const cIron = new THREE.Color(cRed).multiplyScalar(0.85), cDark = new THREE.Color(cNight).lerp(cSlate, 0.5);
  const cWin = new THREE.Color(cLamp).lerp(new THREE.Color('#ff9a3c'), 0.35);
  await ctx.yield();
  {
    // masonry: every block is its own little bevelled pillow so courses and joints catch the light
    const courses = 38, blocks = 20, hC = (SHAFT_TOP - BASE_Y) / courses, gv = 0.05;
    const us = [0, 0.06, 0.5, 0.94, 1], vs = [0, 0.1, 0.9, 1];
    const nV = courses * blocks * 20, pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), col = new Float32Array(nV * 3), idx = [];
    let v = 0;
    const streakOff = rng.range(0, 50);
    for (let c = 0; c < courses; c++) {
      const off = (c % 2) * 0.5 + rng.range(-0.08, 0.08), sC = c / (courses - 1);
      const painted = (daymark === 'band' && sC > 0.42 && sC < 0.6) || (daymark === 'cap' && sC > 0.86);
      for (let b = 0; b < blocks; b++) {
        const a0 = (b + off) / blocks * TAU, a1 = (b + 1 + off) / blocks * TAU, am = (a0 + a1) / 2;
        const tint = 0.82 + 0.3 * rng() + (rng.chance(0.08) ? -0.18 : 0), proud = rng.range(-0.012, 0.02);
        const wSide = 0.5 + 0.5 * (Math.sin(am) * weatherDir.x + Math.cos(am) * weatherDir.z);
        const base = v;
        for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++, v++) {
          const a = lerp(a0, a1, us[i]), y = BASE_Y + (c + vs[j]) * hC;
          const eu = i === 0 || i === 4, ev = j === 0 || j === 3;
          const r = rAt(y) + proud - (eu || ev ? gv : 0);
          const sa = Math.sin(a), ca = Math.cos(a);
          pos[v * 3] = sa * r; pos[v * 3 + 1] = y; pos[v * 3 + 2] = ca * r;
          const slope = (rAt(y - 0.2) - rAt(y + 0.2)) / 0.4;
          let nx = sa, ny = slope, nz = ca;
          if (i === 0) { nx -= ca * 0.8; nz += sa * 0.8; } else if (i === 4) { nx += ca * 0.8; nz -= sa * 0.8; }
          if (j === 0) ny -= 0.8; else if (j === 3) ny += 0.8;
          const l = Math.hypot(nx, ny, nz); nor[v * 3] = nx / l; nor[v * 3 + 1] = ny / l; nor[v * 3 + 2] = nz / l;
          const hgt = (y - BASE_Y) / (SHAFT_TOP - BASE_Y);
          const wet = smoothstep(0.55 + 0.3 * wSide, 0.05, hgt) * (0.6 + 0.4 * wSide);
          const k = mixC(cStone, cStoneWet, wet, tint);
          k.lerp(cAlgae, smoothstep(0.16, 0.0, hgt) * 0.6);
          if (painted) k.lerp(daymark === 'band' ? cIron : cWhite, 0.7).multiplyScalar(daymark === 'band' ? 1 : 0.75);
          const streak = noise.n2(a * 7 + streakOff, y * 0.07);            // rain and rust runs
          k.multiplyScalar(1 - 0.3 * smoothstep(0.25, 0.75, streak) - (eu || ev ? 0.5 : 0));
          col[v * 3] = k.r; col[v * 3 + 1] = k.g; col[v * 3 + 2] = k.b;
        }
        for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
          const q = base + j * 5 + i; idx.push(q, q + 1, q + 6, q, q + 6, q + 5);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
    g.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(nV), 1));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(nV * 2), 2));
    tw.push(g);
  }
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  const speck = (c, amt = 0.2) => (x, y, z) => tmpC.copy(c).multiplyScalar(1 - amt / 2 + amt * (0.5 + 0.5 * noise.n3(x * 1.7, y * 1.7, z * 1.7)));
  await ctx.yield();
  {
    // plinth and steps
    const rb = rBase + 0.55;
    tw.push(paint(lathe([[rb + 0.55, BASE_Y - 2.2], [rb + 0.55, BASE_Y + 0.1], [rb + 0.4, BASE_Y + 0.25], [rb, BASE_Y + 0.3], [rb, BASE_Y + 0.95], [rb - 0.2, BASE_Y + 1.15], [rb - 0.62, BASE_Y + 1.2]], 44), speck(cStoneWet, 0.35)));
    // door (front, +Z) with hood, lamp and steps
    const rd = rAt(BASE_Y + 2.6);
    tw.push(paint(ringPut(new THREE.BoxGeometry(2.3, 3.5, 1.3), 0, rd - 0.1, BASE_Y + 2.95), speck(cStone, 0.3)));
    tw.push(paint(ringPut(new THREE.BoxGeometry(2.7, 0.35, 1.6), 0, rd - 0.05, BASE_Y + 4.85), speck(cStone, 0.3)));
    tw.push(paint(ringPut(new THREE.BoxGeometry(1.35, 2.6, 0.2), 0, rd + 0.5, BASE_Y + 2.55), speck(cIron, 0.3)));
    tw.push(paint(ringPut(new THREE.BoxGeometry(0.34, 0.42, 0.34), 0, rd + 0.75, BASE_Y + 4.4), cWin, 5));
    for (let s = 0; s < 3; s++) tw.push(paint(ringPut(new THREE.BoxGeometry(2.6 + s * 0.5, 0.42, 0.75), 0, rd + 0.95 + s * 0.7, BASE_Y + 1.0 - s * 0.42), speck(cStoneWet, 0.3)));
    // stair windows spiralling up the shaft, some lit
    const nWin = rng.int(4, 6), wa0 = rng.range(0.6, 1.4) * rng.sign();
    for (let i = 0; i < nWin; i++) {
      const y = BASE_Y + 6.5 + i * (22 / (nWin - 1)) * 0.98, a = wa0 + i * rng.range(1.5, 2.2), r = rAt(y);
      const lit = i === 0 || i === nWin - 1 || rng.chance(0.55);
      tw.push(paint(ringPut(new THREE.BoxGeometry(1.15, 1.9, 0.7), a, r - 0.17, y), speck(cStone, 0.25)));
      tw.push(paint(ringPut(new THREE.BoxGeometry(1.45, 0.24, 0.9), a, r - 0.17, y - 1.05), speck(cStone, 0.25)));
      tw.push(paint(ringPut(new THREE.BoxGeometry(0.62, 1.3, 0.1), a, r + 0.16, y), lit ? cWin : cDark, lit ? rng.range(2.2, 4) : 0));
      tw.push(paint(ringPut(new THREE.BoxGeometry(0.07, 1.3, 0.14), a, r + 0.17, y), cDark));
      tw.push(paint(ringPut(new THREE.BoxGeometry(0.62, 0.07, 0.14), a, r + 0.17, y + 0.15), cDark));
    }
    // service-room window band under the gallery
    const nS = 8, sa0 = rng.range(0, TAU);
    for (let i = 0; i < nS; i++) {
      const a = sa0 + i / nS * TAU, y = 34.6, r = rAt(y), lit = rng.chance(0.75);
      tw.push(paint(ringPut(new THREE.BoxGeometry(0.85, 1.15, 0.5), a, r - 0.12, y), speck(cStone, 0.25)));
      tw.push(paint(ringPut(new THREE.BoxGeometry(0.5, 0.8, 0.1), a, r + 0.12, y), lit ? cWin : cDark, lit ? rng.range(2.5, 4.5) : 0));
    }
  }
  await ctx.yield();
  {
    // gallery: corbelled cornice, deck, railing
    const rt = rAt(SHAFT_TOP), rr = rt + 1.5;
    tw.push(paint(lathe([[rt - 0.05, 36.15], [rt + 0.2, 36.4], [rt + 0.2, 36.7], [rt + 0.5, 37.1], [rt + 1.15, 37.5], [rr, 37.6]], 48), speck(cStone, 0.3)));
    tw.push(paint(lathe([[rr, 37.6], [rr + 0.06, 37.66], [rr + 0.06, 37.95], [rr - 0.04, 38.0], [2.2, 38.0]], 48), speck(cIron, 0.3)));
    for (let i = 0; i < 24; i++) tw.push(paint(ringPut(new THREE.BoxGeometry(0.26, 0.55, 1.0), (i + 0.5) / 24 * TAU, rt + 0.72, 37.08), speck(cStoneWet, 0.3)));
    const nPost = 32;
    for (let i = 0; i < nPost; i++) {
      const big = i % 4 === 0;
      tw.push(paint(ringPut(new THREE.CylinderGeometry(big ? 0.06 : 0.035, big ? 0.07 : 0.035, big ? 1.38 : 1.2, 5), i / nPost * TAU, rr - 0.1, 38 + (big ? 0.69 : 0.6)), cIron));
      if (big) tw.push(paint(ringPut(new THREE.SphereGeometry(0.11, 6, 4), i / nPost * TAU, rr - 0.1, 39.44), cIron));
    }
    for (const [y, t] of [[39.2, 0.05], [38.82, 0.03], [38.42, 0.03]]) tw.push(paint(new THREE.TorusGeometry(rr - 0.1, t, 5, 64).rotateX(Math.PI / 2).translate(0, y, 0), cIron));
    // fog horn on the weather side
    const ha = weatherAngle + 0.5;
    tw.push(paint(ringPut(new THREE.CylinderGeometry(0.42, 0.1, 1.3, 10, 1, true).rotateX(Math.PI / 2 - 0.15), ha, rr - 0.55, 39.0), speck(cIron, 0.3)));
    tw.push(paint(ringPut(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 5), ha, rr - 0.9, 38.5), cDark));
  }
  await ctx.yield();
  {
    // lantern room: murette, astragals, cornice, cupola, ventilator, lightning rod, vane
    tw.push(paint(lathe([[2.5, 38.0], [2.5, 38.16], [2.34, 38.26], [2.34, 39.12], [2.46, 39.22], [2.46, 39.4], [2.1, 39.4]], 36), speck(cIron, 0.3)));
    const nAst = 12;
    for (let i = 0; i < nAst; i++) tw.push(paint(ringPut(new THREE.BoxGeometry(0.11, 3.42, 0.13), i / nAst * TAU, 2.27, 41.1), cDark));
    for (const y of [40.52, 41.68]) tw.push(paint(new THREE.TorusGeometry(2.27, 0.045, 4, 48).rotateX(Math.PI / 2).translate(0, y, 0), cDark));
    tw.push(paint(lathe([[2.2, 42.78], [2.5, 42.86], [2.66, 43.02], [2.66, 43.22], [2.52, 43.3]], 36), speck(cIron, 0.3)));
    const roof = roofStyle === 'ogee'
      ? [[2.52, 43.3], [2.36, 43.8], [2.0, 44.4], [1.48, 44.98], [0.96, 45.42], [0.62, 45.74], [0.46, 46.0], [0.46, 46.34], [0.2, 46.4]]
      : [[2.52, 43.3], [1.9, 44.3], [1.2, 45.4], [0.52, 46.4], [0.46, 46.6], [0.2, 46.66]];
    tw.push(paint(lathe(roof, 24), (x, y, z) => tmpC.copy(cIron).multiplyScalar(0.8 + 0.3 * noise.n2(Math.atan2(x, z) * 5, y * 0.4))));
    const nRib = 12, ribTo = roofStyle === 'ogee' ? 5 : 3;
    for (let i = 0; i < nRib; i++) for (let s = 0; s < ribTo; s++) {
      const p0 = roof[s], p1 = roof[s + 1], dr = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dr, dy);
      const g = new THREE.BoxGeometry(0.09, L * 1.04, 0.09).rotateX(Math.atan2(dr, dy));
      tw.push(paint(ringPut(g, (i + 0.5) / nRib * TAU, (p0[0] + p1[0]) / 2 + 0.03, (p0[1] + p1[1]) / 2), cDark));
    }
    for (let i = 0; i < nRib; i++) tw.push(paint(ringPut(new THREE.SphereGeometry(0.1, 5, 4), (i + 0.5) / nRib * TAU, 2.64, 43.2), cDark));
    const top = roof[roof.length - 1][1];
    tw.push(paint(new THREE.SphereGeometry(0.56, 12, 8).scale(1, 0.85, 1).translate(0, top + 0.38, 0), speck(cIron, 0.3)));
    tw.push(paint(new THREE.CylinderGeometry(0.025, 0.06, 2.7, 5).translate(0, top + 2.1, 0), cDark));
    tw.push(paint(new THREE.SphereGeometry(0.1, 6, 4).translate(0, top + 3.45, 0), cDark));
    const va = rng.range(0, TAU);
    tw.push(paint(new THREE.BoxGeometry(1.5, 0.05, 0.05).translate(0.15, top + 1.9, 0).rotateY(va), cDark));
    tw.push(paint(new THREE.BoxGeometry(0.5, 0.36, 0.04).translate(-0.5, top + 1.9, 0).rotateY(va), cDark));
    // lens pedestal inside the lantern
    tw.push(paint(lathe([[0.2, 39.4], [0.75, 39.45], [0.75, 39.6], [0.35, 39.75], [0.35, 40.0]], 12), cDark));
  }
  const towerMat = patchStandard(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }), U, false);
  await ctx.yield();
  const tower = new THREE.Mesh(mergeGeometries(tw), towerMat); tower.name = 'tower';
  object.add(tower);
  tw.forEach((g) => g.dispose());
  await ctx.yield();

  // ---- lantern glass ----
  const lampLocal = new THREE.Vector3(0, LENS_Y, 0);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.22, 3.38, 36, 1, true).translate(0, LENS_Y, 0), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), uBeamDir: U.uBeamDir, uLampCol: U.uLampCol, uTime: U.uTime, uBeamI: U.uBeamI },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
    vertexShader: /* glsl */`
      varying vec3 vNw, vNv, vVv; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vNw = normalize(mat3(modelMatrix) * normal); vNv = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); vVv = -mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBeamDir, uLampCol; uniform float uTime, uBeamI; varying vec3 vNw, vNv, vVv; varying vec2 vUv;
      ${GLSL_NOISE}
      #include <fog_pars_fragment>
      void main(){
        float face = pow(abs(dot(normalize(vNw), uBeamDir)), 10.);
        float fres = pow(1. - abs(dot(normalize(vNv), normalize(vVv))), 2.);
        float drops = smoothstep(.72, .95, tlNoise(vec2(vUv.x * 140., vUv.y * 22. + uTime * .7)));
        float band = .6 + .4 * smoothstep(.0, .5, vUv.y) * smoothstep(1., .5, vUv.y);
        vec3 col = uLampCol * uBeamI * (0.1 * band + 1.5 * face + .3 * fres + .4 * drops * (.3 + face));
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(col * (1. - tlFf), 1.);
      }`,
  }));
  glass.renderOrder = 3; object.add(glass);

  await ctx.yield();
  // ---- rotating optic + beams ----
  const rotor = new THREE.Group(); rotor.position.copy(lampLocal); object.add(rotor);
  {
    const ls = [], brass = new THREE.Color('#6b5326').multiplyScalar(0.5), drum = [];
    for (let i = 0; i <= 14; i++) { const y = -1.15 + i * (2.3 / 14), bow = 0.86 - 0.16 * Math.pow(Math.abs(y) / 1.15, 2); drum.push([bow, y], [bow + 0.07, y + 0.08]); }
    ls.push(paint(lathe(drum, 20), cLamp, 1));
    for (const s of [1, -1]) {
      const c = new THREE.CircleGeometry(1.16, 36); if (s < 0) c.rotateY(Math.PI);
      ls.push(paint(c.translate(0, 0, s * 0.9), cLamp, 2));
      ls.push(paint(new THREE.TorusGeometry(1.18, 0.06, 5, 32).translate(0, 0, s * 0.9), brass, 0));
    }
    for (const y of [-1.24, 1.24]) ls.push(paint(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 20).translate(0, y, 0), brass, 0));
    for (let i = 0; i < 4; i++) ls.push(paint(ringPut(new THREE.BoxGeometry(0.07, 2.5, 0.07), Math.PI / 4 + i * Math.PI / 2, 1.0, 0), brass, 0));
    const lens = new THREE.Mesh(mergeGeometries(ls), new THREE.ShaderMaterial({
      uniforms: { ...fogU(), uBeamI: U.uBeamI }, vertexColors: true, fog: true,
      vertexShader: /* glsl */`
        attribute float aGlow; varying float vK; varying vec3 vC; varying vec2 vUv; varying vec3 vP;
        #include <fog_pars_vertex>
        void main(){ vK = aGlow; vC = color; vUv = uv; vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uBeamI; varying float vK; varying vec3 vC; varying vec2 vUv; varying vec3 vP;
        #include <fog_pars_fragment>
        void main(){
          vec3 col = vC * .55;
          if (vK > 1.5) { float r = length(vUv - .5) * 2.; col = vC * uBeamI * (1.4 + 1.1 * cos(r * 44.) + 9. * exp(-r * r * 7.)); }
          else if (vK > .5) { col = vC * uBeamI * (1.0 + .7 * sin(vP.y * 38.)); }
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    }));
    lens.name = 'optic'; rotor.add(lens); ls.forEach((g) => g.dispose());

    // beams: each cone is ray-integrated analytically in the fragment shader (true volumetric thickness,
    // so a beam pointing at the camera blooms instead of vanishing); the mesh is only a back-face hull.
    const TAN = 0.036, R0 = 0.95, bs = [], hullLen = Math.max(beamLen, opts.beamReach ?? beamLen);
    for (const side of [1, -1]) {
      const g = new THREE.CylinderGeometry((R0 + (hullLen + 0.3) * TAN) * 1.12, R0 * 1.12, hullLen, 24, 1, false).rotateX(Math.PI / 2).translate(0, 0, hullLen / 2 + 0.3);
      if (side < 0) g.rotateY(Math.PI);
      g.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(side), 1));
      bs.push(g);
    }
    const beams = new THREE.Mesh(mergeGeometries(bs), new THREE.ShaderMaterial({
      uniforms: { ...fogU(), uLamp: U.uLamp, uBeamDir: U.uBeamDir, uLampCol: U.uLampCol, uTime: U.uTime, uBeamI: U.uBeamI,
        uFogCut: U.uFogCut, uTan: { value: TAN }, uR0: { value: R0 }, uLen: U.uBeamLen },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: true,
      vertexShader: /* glsl */`
        attribute float aSide; varying float vSide; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vSide = aSide; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uLamp, uBeamDir, uLampCol; uniform float uTime, uBeamI, uFogCut, uTan, uR0, uLen; varying float vSide; varying vec3 vW;
        ${GLSL_NOISE}
        #include <fog_pars_fragment>
        void main(){
          vec3 Dn = uBeamDir * vSide; float back = uR0 / uTan;
          vec3 O = cameraPosition - (uLamp - Dn * back), V = normalize(vW - cameraPosition);
          float c2 = 1. / (1. + uTan * uTan), vd = dot(V, Dn), od = dot(O, Dn);
          float a = vd * vd - c2, b = 2. * (vd * od - c2 * dot(V, O)), c = od * od - c2 * dot(O, O), disc = b * b - 4. * a * c;
          float sum = 0., tm = 0.;
          if (disc > 0. && abs(a) > 1e-7) {
            float sq = sqrt(disc), t1 = (-b - sq) / (2. * a), t2 = (-b + sq) / (2. * a);
            if (t1 > t2) { float tt = t1; t1 = t2; t2 = tt; }
            float tA = t1, tB = t2;
            if (a > 0.) { if (vd > 0.) { tA = t2; tB = t2 + 2000.; } else { tA = t1 - 2000.; tB = t1; } }
            if (abs(vd) > 1e-5) { float s0 = (back + .4 - od) / vd, s1 = (back + uLen - od) / vd; tA = max(tA, min(s0, s1)); tB = min(tB, max(s0, s1)); }
            tA = max(tA, 0.);
            if (tB > tA) {
              float dt = (tB - tA) / 20., jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy + fract(uTime * 7.31) * 13., vec2(.06711056, .00583715))));
              for (int i = 0; i < 20; i++) {
                vec3 P = O + V * (tA + (float(i) + jit) * dt) - Dn * back;
                float s = dot(P, Dn), r = uR0 + max(s, 0.) * uTan, rr = length(P - Dn * s) / r;
                float fl = clamp(1. - s / (uLen * .92), 0., 1.); float w = smoothstep(.4, 2., s) * fl * sqrt(fl) * exp(-s / (uLen * .34)) * 1.3;   // rain extinction plus a long even fade: the shaft tapers away, no cap in mid-air
                float pr = clamp(1. - rr * rr, 0., 1.); sum += pr * pr * w * pow(uR0 / r, 1.9);
              }
              sum *= dt; tm = .5 * (tA + tB);
            }
          }
          vec3 Pm = cameraPosition + V * tm;
          float rain = tlNoise(vec2(Pm.x * 5.3 + Pm.z * 4.1, Pm.y * 1.1 + uTime * 16.)) * .6 + tlNoise(vec2(Pm.x * 13. - Pm.z * 9., Pm.y * 2.4 + uTime * 23.)) * .4;
          float nearK = smoothstep(25., 120., tm);                                   // close to the eye the shaft thins, so rain and the cone's edge read inside it
          vec3 col = uLampCol * uBeamI * sum * 2.3 * mix(.42, 1., nearK) * (.92 + mix(.6, .18, nearK) * (smoothstep(.5, .85, rain) - mix(.35, 0., nearK)));
          float ff = 0.;
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              ff = 1. - exp(-fogDensity * fogDensity * tm * tm);
            #else
              ff = smoothstep(fogNear, fogFar, tm);
            #endif
          #endif
          gl_FragColor = vec4(col * (1. - ff * uFogCut), 1.);
        }`,
    }));
    beams.name = 'beams'; beams.frustumCulled = false; beams.renderOrder = 6; rotor.add(beams);
    bs.forEach((g) => g.dispose());
  }

  // ---- lantern flare: a billboard that swells when a beam points at the camera ----
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { ...fogU(), uLamp: U.uLamp, uLampCol: U.uLampCol, uFlare: U.uFlare, uBeamI: U.uBeamI, uTime: U.uTime },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    vertexShader: /* glsl */`
      uniform vec3 uLamp; uniform float uFlare; varying vec2 vP; varying float vNear;
      #include <fog_pars_vertex>
      void main(){ vP = position.xy * 2.;
        vec4 mvPosition = viewMatrix * vec4(uLamp, 1.); float d = length(mvPosition.xyz);
        mvPosition.xyz *= max(d - 4.6, 0.5) / d;
        vNear = smoothstep(30., 180., d);                                        // close to the lantern the flare stays a lamp, not a white-out
        float sz = (9. + d * .085) * (1. + 1.6 * uFlare * vNear);
        mvPosition.xy += position.xy * sz; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLampCol; uniform float uFlare, uBeamI, uTime; varying vec2 vP; varying float vNear;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vP);
        float glow = exp(-r * r * 38.) * 1.6 + exp(-r * 9.) * .5 + exp(-r * 3.2) * .1;
        float streak = exp(-abs(vP.y) * 70.) * exp(-abs(vP.x) * 3.2) + .5 * exp(-abs(vP.x) * 90.) * exp(-abs(vP.y) * 6.);
        float pulse = .9 + .1 * sin(uTime * 13.);
        vec3 col = uLampCol * uBeamI * pulse * (glow * (.55 + 7.5 * uFlare * mix(.12, 1., vNear)) + streak * (.1 + 5. * uFlare * mix(.15, 1., vNear)));
        col *= smoothstep(1., .6, r);
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(col * (1. - tlFf * .6), 1.);
      }`,
  }));
  flare.frustumCulled = false; flare.renderOrder = 8; flare.name = 'flare'; object.add(flare);
  await ctx.yield();

  // ---- white water 1: spray bursts (instanced soft quads, ballistic in the vertex shader) ----
  const shorePoint = (a, k = 0.95) => { const x = Math.sin(a), z = Math.cos(a), R = outlineR(x, z) * k; return [x * R, z * R]; };
  const angDiff = (a) => Math.acos(clamp(Math.sin(a) * weatherDir.x + Math.cos(a) * weatherDir.z, -1, 1)) / Math.PI;
  const impactA = weatherAngle + rng.range(-0.15, 0.15), impactXZ = shorePoint(impactA, 0.9);
  const waterBlend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, fog: true };
  const waterU = () => ({ ...fogU(), uLamp: U.uLamp, uBeamDir: U.uBeamDir, uLampCol: U.uLampCol, uAmb: U.uAmb, uFlash: U.uFlash, uBeamI: U.uBeamI, uTime: U.uTime });
  {
    const P = [];   // ox,oy,oz, vx,vy,vz, delay,life,size,rnd, offset,mode,alpha
    // Water thrown by an impact leaves as a handful of JETS; particles strung along each jet's velocity
    // (q = 0 base .. 1 tip) read as fingers of spray instead of one round cloud.
    const mkJets = (n, a0, sa, upLo, upHi, towLo, towHi, toTower) => Array.from({ length: n }, () => {
      const a = a0 + rng.gauss() * sa, rx = Math.sin(a), rz = Math.cos(a), tow = rng.range(towLo, towHi), tang = rng.gauss() * 3.5;
      const tx = toTower ? -rx : -weatherDir.x, tz = toTower ? -rz : -weatherDir.z;
      return { a, k: rng.range(0.84, 1.0), vx: tx * tow + rz * tang, vy: rng.range(upLo, upHi), vz: tz * tow - rx * tang, d: rng.range(0, 1) };
    });
    const emit = (j, mode, off, drop, big) => {
      const q = Math.pow(rng(), 0.75), f = 0.28 + 0.72 * q, sp = (drop ? 2.4 : 1.5) * (1.25 - q);
      const [x, z] = shorePoint(j.a + rng.gauss() * 0.035, j.k);
      P.push(x, rng.range(0, 2.5), z, j.vx * f + rng.gauss() * sp, j.vy * f + rng.gauss() * sp, j.vz * f + rng.gauss() * sp,
        j.d * (mode === 1 ? 0.7 : 1.1) + rng.range(0, 0.3) + (1 - q) * 0.25, rng.range(3.2, 5.4) * (mode === 1 ? 1.25 : 1),
        drop ? -rng.range(0.1, 0.24) : rng.range(1.5, 3.3) * (1.3 - 0.65 * q) * big, rng(), off, mode, drop ? rng.range(0.2, 0.5) : rng.range(0.2, 0.4) * (1.15 - 0.4 * q));
    };
    const sites = [-2.0, -1.15, -0.5, 0.45, 1.2, 2.1, 3.2].map((o) => impactA + o + rng.range(-0.2, 0.2));
    for (const a of sites) {
      const ad = angDiff(a), s = 1 - 0.6 * ad, off = 0.25 * ad * 7, sk = 0.45 + 0.6 * s;
      const jets = mkJets(rng.int(4, 6), a, 0.11, 10 * sk, 27 * sk, 0, 6, false), n = Math.round(150 + 200 * s);
      for (let i = 0; i < n; i++) emit(rng.pick(jets), 0, off, false, 1);
      for (let i = 0; i < 34; i++) emit(rng.pick(jets), 0, off, true, 1);
    }
    {
      const jets = mkJets(17, impactA, 0.17, 20, 47, 2, 11, true);
      const fan = mkJets(9, impactA, 0.33, 7, 17, 0, 5, true);
      for (let i = 0; i < 1350; i++) emit(rng.pick(jets), 1, 0, false, 1.2);
      for (let i = 0; i < 300; i++) emit(rng.pick(fan), 1, 0, false, 1.6);
      for (let i = 0; i < 620; i++) emit(rng.pick(rng.chance(0.8) ? jets : fan), 1, 0, true, 1);
    }
    for (let i = 0; i < 260; i++) {          // standing mist along the weather shore
      const aa = impactA + rng.gauss() * 1.3, [x, z] = shorePoint(aa, rng.range(0.9, 1.25)), life = rng.range(4, 7.5);
      P.push(x, rng.range(0.5, 3), z, -weatherDir.x * rng.range(1, 4), rng.range(1.5, 5.5), -weatherDir.z * rng.range(1, 4),
        0, life, rng.range(4, 8), rng(), rng.range(0, life), 2, rng.range(0.035, 0.08));
    }
    const n = P.length / 13, ig = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(2, 2); ig.index = quad.index; ig.setAttribute('position', quad.attributes.position);
    const split = (o, w) => { const arr = new Float32Array(n * w); for (let i = 0; i < n; i++) for (let k = 0; k < w; k++) arr[i * w + k] = P[i * 13 + o + k]; return new THREE.InstancedBufferAttribute(arr, w); };
    ig.setAttribute('aOrigin', split(0, 3)); ig.setAttribute('aVel', split(3, 3)); ig.setAttribute('aParam', split(6, 4)); ig.setAttribute('aCycle', split(10, 3));
    ig.instanceCount = n;
    const spray = new THREE.Mesh(ig, new THREE.ShaderMaterial({
      ...waterBlend, uniforms: { ...waterU(), uHeroAge: U.uHero, uWind: { value: weatherDir.clone().multiplyScalar(-1.1) } },
      vertexShader: /* glsl */`
        attribute vec3 aOrigin, aVel; attribute vec4 aParam; attribute vec3 aCycle;
        uniform float uTime, uHeroAge; uniform vec3 uWind; varying vec2 vQ; varying float vA, vRnd, vDrop; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          float life = aParam.y, age;
          if (aCycle.y > 1.5) age = mod(uTime + aCycle.x, life);
          else if (aCycle.y > .5) age = uHeroAge - aParam.x;
          else age = mod(uTime - aCycle.x, 7.) - aParam.x;
          float alive = step(0., age) * step(age, life), t = clamp(age, 0., life), n = t / life, k = .62;
          vec3 p = aOrigin + aVel * (1. - exp(-k * t)) / k + vec3(0., -1.5 * t * t, 0.) + uWind * t * t * .3;
          p.y = max(p.y, .4 - aParam.w);
          vDrop = step(aParam.z, 0.); float size = mix(aParam.z * (.35 + .95 * sqrt(n)), -aParam.z, vDrop) * alive;
          vA = smoothstep(0., .07, n) * (1. - smoothstep(.4, 1., n)) * alive * aCycle.z; vRnd = aParam.w;
          vec2 q = position.xy; vQ = q; float stretch = 1. + 1.5 * (1. - smoothstep(.05, .7, n));
          vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz + vec3(0., q.y * size * .5, 0.);
          vec4 mvPosition = viewMatrix * wp;
          vec3 vel = aVel * exp(-k * t) + vec3(0., -3. * t, 0.) + uWind * .6 * t;
          vec2 dv = (viewMatrix * modelMatrix * vec4(vel, 0.)).xy; float sp = length(dv); dv /= max(sp, 1e-3);
          float el = mix(1. + (stretch - 1.) * min(sp * .11, 1.6), 1.5 + sp * .16, vDrop);
          if (aCycle.y > 1.5) dv = vec2(0., 1.);
          mvPosition.xy += (vec2(dv.y, -dv.x) * q.x + dv * q.y * el) * size;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec2 vQ; varying float vA, vRnd, vDrop; varying vec3 vW;
        ${GLSL_NOISE}${GLSL_WATERLIGHT}
        #include <fog_pars_fragment>
        void main(){
          float r = length(vQ); if (r > 1. || vA < .003) discard;
          float a = pow(1. - r, 1.25) * clamp(.25 + 1.5 * tlFbm(vQ * vec2(2.6, 1.2) + vRnd * 37.), 0., 1.6) * vA;
          a = mix(a, (1. - abs(vQ.x)) * (1. - vQ.y * vQ.y) * vA, vDrop);
          gl_FragColor = vec4(vec3(.86, .93, .97) * tlWaterLight(vW) * (.85 + .25 * vQ.y) * (1. + .6 * vDrop), 1.);
          #include <fog_fragment>
          a = clamp(a, 0., 1.); gl_FragColor = vec4(gl_FragColor.rgb * a, a);
        }`,
    }));
    spray.frustumCulled = false; spray.renderOrder = 5; spray.name = 'spray'; object.add(spray);
  }
  await ctx.yield();

  // ---- white water 2: runs pouring back down the ledges (ribbons hugging the rock) ----
  {
    const pos = [], uv = [], seed = [], idx = [];
    let made = 0;
    for (let tries = 0; tries < 400 && made < 20; tries++) {
      const a = impactA + rng.gauss() * 1.5, f = rng.range(0.4, 0.8);
      let [x, z] = shorePoint(a, f);
      const h0 = heightAt(x, z); if (h0 < 5.5 || h0 > 17 || Math.hypot(x, z) < rBase + 4) continue;
      const pts = [], w = rng.range(0.8, 1.9), rnd = rng(), ad = angDiff(a);
      for (let s = 0; s < 60; s++) {
        const h = heightAt(x, z); pts.push([x, h, z]); if (h < 0.2) break;
        const e = 0.5, gx = heightAt(x + e, z) - heightAt(x - e, z), gz = heightAt(x, z + e) - heightAt(x, z - e);
        const l = Math.hypot(x, z), gl = Math.hypot(gx, gz) || 1;
        let dx = -gx / gl * 0.75 + x / l * 0.4, dz = -gz / gl * 0.75 + z / l * 0.4; const dl = Math.hypot(dx, dz) || 1;
        x += dx / dl * 0.8; z += dz / dl * 0.8;
      }
      if (pts.length < 12) continue;
      const base = pos.length / 3; let dist = 0;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
        let tx = q[0] - o[0], tz = q[2] - o[2]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        if (i > 0) dist += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
        const ww = w * (0.6 + 0.9 * i / pts.length);
        for (const sgn of [-1, 1]) {
          const px = p[0] - tz * ww * sgn, pz = p[2] + tx * ww * sgn;
          pos.push(px, Math.max(heightAt(px, pz), p[1] - 0.6) + 0.42, pz); uv.push(sgn * 0.5 + 0.5, dist); seed.push(ad, rnd);
        }
        if (i > 0) { const k = base + i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
      }
      made++;
    }
    if (made > 0) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 2)); g.setIndex(idx);
      const runs = new THREE.Mesh(g, new THREE.ShaderMaterial({
        ...waterBlend, side: THREE.DoubleSide, uniforms: waterU(),
        vertexShader: /* glsl */`
          attribute vec2 aSeed; varying vec2 vUv, vS; varying vec3 vW;
          #include <fog_pars_vertex>
          void main(){ vUv = uv; vS = aSeed; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime; varying vec2 vUv, vS; varying vec3 vW;
          ${GLSL_NOISE}${GLSL_WATERLIGHT}
          #include <fog_pars_fragment>
          void main(){
            float ph = fract(uTime / 7. - .25 * vS.x - .06);
            float flow = .3 + .7 * smoothstep(0., .12, ph) * (1. - smoothstep(.3, .95, ph));
            float st = tlNoise(vec2(vUv.x * 5. + vS.y * 31., vUv.y * .5 - uTime * 3.4)) * .6 + tlNoise(vec2(vUv.x * 13., vUv.y * 1.2 - uTime * 5.6)) * .4;
            float a = smoothstep(0., .3, vUv.x) * smoothstep(1., .7, vUv.x) * smoothstep(.62 - .42 * flow, .9 - .25 * flow, st) * smoothstep(0., 2.5, vUv.y);
            gl_FragColor = vec4(vec3(.84, .92, .96) * tlWaterLight(vW), 1.);
            #include <fog_fragment>
            a = clamp(a * .9, 0., 1.); gl_FragColor = vec4(gl_FragColor.rgb * a, a);
          }`,
      }));
      runs.renderOrder = 2; runs.name = 'runs'; object.add(runs);
    }
  }

  await ctx.yield();
  // ---- white water 3: foam apron on the sea round the rock ----
  if (opts.apron !== false) {
    const sea = opts.sea && opts.sea.uWA && opts.sea.uWB && opts.sea.disc ? opts.sea : null;
    const g = new THREE.RingGeometry(15, 96, 112, 20).rotateX(-Math.PI / 2), p = g.attributes.position;
    const sh = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); sh[i * 2] = Math.hypot(x, z) - outlineR(x, z); sh[i * 2 + 1] = angDiff(Math.atan2(x, z)); }
    g.setAttribute('aShore', new THREE.BufferAttribute(sh, 2));
    const apron = new THREE.Mesh(g, new THREE.ShaderMaterial({
      ...waterBlend, uniforms: { ...waterU(), uWdir: { value: weatherDir.clone() }, ...(sea ? { uWA: sea.uWA, uWB: sea.uWB, uSeaTime: sea.uTime,
        uSeaSp: sea.uSpacing, uSeaR0: sea.uR0, uSeaDamp: { value: sea.damp ?? 0.35 }, uSeaLift: { value: sea.lift ?? 0.35 }, uSeaDisc: { value: sea.disc } } : {}) },
      vertexShader: /* glsl */`
        attribute vec2 aShore; uniform float uTime; uniform vec3 uWdir; varying vec2 vS; varying vec3 vW, vP;
        ${sea ? `uniform vec4 uWA[${sea.uWA.value.length}], uWB[${sea.uWB.value.length}], uSeaDisc; uniform float uSeaTime, uSeaSp, uSeaR0, uSeaDamp, uSeaLift;` : ''}
        #include <fog_pars_vertex>
        void main(){ vS = aShore; vec3 p = position;
          ${sea ? 'p.y = uSeaLift;' : 'p.y = .45 + .5 * sin(dot(p.xz, uWdir.xz) * .11 + uTime * 1.3) * smoothstep(0., 20., aShore.x);'}
          vP = p; vec4 wp = modelMatrix * vec4(p, 1.);
          ${sea ? `{ // ride the world's Gerstner sea: the same sum, LOD fade and shoal damping as kit/water makeOcean
            vec2 xz = wp.xz; float sp = (length(xz - cameraPosition.xz) + uSeaR0) * uSeaSp; vec3 d = vec3(0.);
            for (int i = 0; i < 8; i++){ vec4 a = uWA[i], b = uWB[i]; float f = smoothstep(2., 4.5, b.w / sp);
              float th = a.z * dot(a.xy, xz) - a.w * uSeaTime + b.z; d.xz += a.xy * (b.y * b.x * cos(th) * f); d.y += b.x * sin(th) * f; }
            d *= mix(uSeaDamp, 1., smoothstep(0., 1., (length(xz - uSeaDisc.xy) - uSeaDisc.z) / uSeaDisc.w));
            wp.xyz += d; }` : ''}
          vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uWdir; varying vec2 vS; varying vec3 vW, vP;
        ${GLSL_NOISE}${GLSL_WATERLIGHT}
        #include <fog_pars_fragment>
        void main(){
          float sh = vS.x, ph = fract(uTime / 7. - .25 * vS.y), rr = ph * 58.;
          float ring = exp(-pow((sh - rr) / (3.5 + rr * .16), 2.)) * (1. - ph) * (1. - .6 * vS.y);
          vec2 w = vP.xz * .05; float warp = tlFbm(w + vec2(uTime * .04, 0.));
          vec2 sp = vec2(dot(vP.xz, uWdir.xz) * .045, dot(vP.xz, vec2(-uWdir.z, uWdir.x)) * .16);
          float n = tlFbm(sp + 1.6 * warp + vec2(uTime * .09, 0.));
          float cell = abs(tlNoise(vP.xz * .33 + warp * 3. + uTime * .08) - .5) * 2.;
          float lace = smoothstep(.55, .76, n + .3 * exp(-max(sh, 0.) / 14.) + .4 * ring) * (.55 + .45 * smoothstep(.1, .5, cell));
          float near = exp(-max(sh, 0.) / 5.5) * (.75 + .25 * n);
          float a = clamp(lace * (.25 + .75 * exp(-max(sh, 0.) / 26.)) + near + ring * .3, 0., 1.);
          a *= smoothstep(62., 10., sh + 22. * (n - .45)) * smoothstep(-9., -2., sh);
          gl_FragColor = vec4(vec3(.8, .9, .94) * tlWaterLight(vW) * .68, 1.);
          #include <fog_fragment>
          gl_FragColor = vec4(gl_FragColor.rgb * a, a);
        }`,
    }));
    apron.renderOrder = 1; apron.name = 'apron'; object.add(apron);
  }
  await ctx.yield();

  // ---- anchors ----
  const seat = flyThrough[flyThrough.length - 1], prev = flyThrough[flyThrough.length - 2];
  const anchors = {
    lantern: lampLocal.clone(),
    portalSeat: { position: seat.clone(), facing: new THREE.Vector3(prev.x - seat.x, 0, prev.z - seat.z).normalize(), radius: 7 },
    flyThrough: flyThrough.map((p) => p.clone()),
    viewpoints: { reveal: flyThrough[1].clone(), impact: flyThrough[2].clone(), closePass: flyThrough[4].clone() },
    impact: new THREE.Vector3(impactXZ[0], 0, impactXZ[1]),
    calmPatch: new THREE.Vector3(seat.x, 0, seat.z),
    weatherDir: weatherDir.clone(), leeDir: weatherDir.clone().multiplyScalar(-1),
    galleryY: DECK_Y, towerTop: 49.8,
    outliers: outliers.map((o) => ({ position: new THREE.Vector3(o.x, 0, o.z), radius: o.sz * 1.5, top: o.top })),
  };

  // ---- runtime ----
  const burstAt = opts.burstAt ?? 0.53, burstSpan = opts.burstSpan ?? 0.13, HERO_LIFE = 7.8;
  const bursts = [[burstAt, burstSpan], ...(opts.bursts || [])];             // [u, span] of every hero burst along the flight
  let progress = null, beamOverride = null, angle = beamPhase;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), wLocal = weatherDir.clone();
  const api = {
    object, radius: 36, height: 50, center: new THREE.Vector3(0, 27, 0), anchors, ground: true, groundY: -0.4,
    heightAt,
    setProgress(u) { progress = u; },
    setFlash(v) { U.uFlash.value = Math.max(0, v); },
    setBeamAngle(a) { beamOverride = a; },
    beamAngle() { return angle; },
    setAmbient(c, k = 0.55) { U.uAmb.value.set(c).multiplyScalar(k); },
    uniforms: U,
    update(dt, time, camera) {
      U.uTime.value = time;
      angle = beamOverride ?? beamPhase + beamSpin * time * TAU / beamPeriod;
      rotor.rotation.y = angle;
      object.updateWorldMatrix(true, false);
      U.uOrigin.value.setFromMatrixPosition(object.matrixWorld);
      U.uLamp.value.copy(lampLocal).applyMatrix4(object.matrixWorld);
      U.uWeather.value.copy(wLocal).transformDirection(object.matrixWorld);
      U.uBeamDir.value.set(Math.sin(angle), 0, Math.cos(angle)).transformDirection(object.matrixWorld);
      if (progress === null) { const a = (time + 7.6) % 14; U.uHero.value = a < HERO_LIFE ? a : -1; }
      else {
        let hv = -1;
        for (const b of bursts) { const a = (progress - b[0]) / b[1]; if (a >= 0 && a <= 1) hv = a * HERO_LIFE; }
        U.uHero.value = hv;
      }
      if (camera) {
        vA.setFromMatrixPosition(camera.matrixWorld).sub(U.uLamp.value);
        const d = vA.length() || 1, al = Math.abs(vA.dot(U.uBeamDir.value)) / d;
        // the cones widen with distance, so the lens "catches" the camera over a slightly wider angle far away
        U.uFlare.value = Math.pow(smoothstep(0.955, 0.9985, al), 1.6);
      }
    },
    dispose() {},
  };
  api.update(0, 0, null);
  return api;
}
