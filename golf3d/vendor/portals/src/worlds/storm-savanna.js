// STORM OVER THE SAVANNA
// Golden grassland under a wall of indigo thunderstorm. The low sun sits exactly behind the final heading,
// so everything ahead is gold on dark and the double rainbow stands over the Elder Baobab (src/parts/
// storm-savanna.js), which is placed at the world origin: final flight axis x = -30, heading -Z.
//
// Flight: entry low over rushing grass with the tree a small gold shape under the storm -> overtake the
// elephant file (never nearer than 20 m) -> lift over a kopje with giraffes on their rise and the first
// lightning fork -> settle onto the antisolar heading (rainbow centred, portal a bright point left of the
// trunk) -> pass the baobab level with its low limb as the queleas erupt -> straight level run to the portal.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as SKY from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as W from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/storm-savanna.js';

const PALETTE = ['#2a2f4f', '#5b5f86', '#f2b25c', '#c98f3a', '#7a5a2a', '#2e2416', '#fff2c0'];
const TAU = Math.PI * 2;

// ---------- acacia: the kit oak with its crown pressed into a flat umbrella ----------
function acaciaGeometry(rng, o) {
  const g = flora.oakGeometry({ rng, detail: o.detail ?? 1, height: o.height, fullness: 1.1, flex: 0.8,
    leaf: o.leaf, leafLight: o.leafLight, leafDark: o.leafDark, bark: '#6a5540', barkDark: '#33271c' });
  const P = g.attributes.position, H = (g.userData && g.userData.height) || o.height, y0 = H * 0.66;
  let rad = 0;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), t = smoothstep(H * 0.28, H * 0.6, y);
    const k = 1 + 0.8 * t, ny = lerp(y, y0 + (y - y0) * 0.3, t);
    P.setXYZ(i, x * k, ny, z * k); rad = Math.max(rad, Math.hypot(x * k, z * k));
  }
  P.needsUpdate = true; g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData = { ...g.userData, height: H * 0.78, radius: rad, kind: 'acacia' };
  return g;
}

// ---------- kopje: a pile of weathered granite boulders, origin at the base ----------
async function kopjeGeometry(rng, h, cols, hi = 2, pause = null) {
  const parts = [], m = () => new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const add = (r, d, y, a, detail, sq) => {
    const g = T.rockGeometry({ rng, kind: 'boulder', radius: r, detail, cuts: 6, roughness: 0.17, crease: 0.72, color: cols[0], colorB: cols[1] });
    e.set(rng.range(-0.35, 0.35), rng.range(0, TAU), rng.range(-0.35, 0.35)); q.setFromEuler(e);
    parts.push({ g, m: m().compose(new THREE.Vector3(Math.cos(a) * d, y, Math.sin(a) * d), q, new THREE.Vector3(1, sq, 1)) });
  };
  const a0 = rng.range(0, TAU), nb = rng.int(4, 6);
  for (let i = 0; i < nb; i++) { const r = h * rng.range(0.3, 0.43); add(r, h * rng.range(0.28, 0.55), r * 0.3, a0 + (i / nb) * TAU + rng.range(-0.3, 0.3), hi, rng.range(0.75, 1.05)); if (pause) await pause(); }
  for (let i = 0; i < 3; i++) { const r = h * rng.range(0.24, 0.33); add(r, h * rng.range(0.04, 0.24), h * rng.range(0.38, 0.5), a0 + i * 2.1 + rng.range(-0.4, 0.4), hi, rng.range(0.8, 1.1)); if (pause) await pause(); }
  { const r = h * rng.range(0.17, 0.24); add(r, h * rng.range(0, 0.1), h * 0.8, rng.range(0, TAU), hi, rng.range(0.85, 1.25)); }
  for (let i = 0; i < 4; i++) { const r = h * rng.range(0.07, 0.14); add(r, h * rng.range(0.7, 1.15), r * 0.35, rng.range(0, TAU), 1, rng.range(0.7, 1)); }
  if (pause) await pause();
  const g = T.mergeRocks(parts);
  for (const p of parts) p.g.dispose();
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---------- the storm wall: a cumulonimbus front painted at infinity ahead of the final heading ----------
// Indigo base, churning violet towers, a pale gold-lit anvil top, grey rain shafts hanging beneath, lightning
// glowing inside. It follows the camera (so it never gets nearer) and fades out toward the sun side.
function makeStormWall(o) {
  const SEG = 72, R = 3900, Y0 = -320, Y1 = 3100, A0 = -2.2, A1 = 2.2, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { const a = lerp(A0, A1, i / SEG); pos.push(Math.sin(a) * R, Y0, -Math.cos(a) * R, Math.sin(a) * R, Y1, -Math.cos(a) * R); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const U = { uTime: { value: 0 }, uFlash: { value: 0 }, uFlashAz: { value: 0 }, uSeed: { value: o.seed }, uLean: { value: o.lean },
    uDark: { value: new THREE.Color(o.dark) }, uMid: { value: new THREE.Color(o.mid) }, uPale: { value: new THREE.Color(o.pale) }, uGold: { value: new THREE.Color(o.gold) },
    uRain: { value: new THREE.Color(o.rain) }, uFog: { value: new THREE.Color(o.fog) }, uTop: { value: o.top ?? 1 } };
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: U,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: fx.GLSL_NOISE + /* glsl */`
      uniform float uTime, uFlash, uFlashAz, uSeed, uLean, uTop; uniform vec3 uDark, uMid, uPale, uGold, uRain, uFog; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float az = atan(d.x, -d.z), el = asin(d.y), t = uTime;
        float side = 1.0 - smoothstep(1.05, 1.95, abs(az));
        float azd = az + t*0.0012;                                   // the whole front creeps sideways
        float towers = fbm(vec2(azd*1.9 + uSeed, t*0.025));
        float topEl = (0.5 + 0.13*towers)*uTop*side + 0.03;
        float n1 = fbm(vec2(azd*4.6 + uSeed*3.0, el*6.4 - t*0.04));
        float n2 = fbm(vec2(azd*17.0 - uSeed, el*20.0 - t*0.07 + 4.0));
        float e = el + 0.05*(n1 - 0.5) + 0.016*(n2 - 0.5);
        float inside = 1.0 - smoothstep(topEl - 0.012, topEl + 0.012, e);
        float h = clamp(el/max(topEl, 0.02), 0.0, 1.0);
        float n1b = fbm(vec2(azd*4.6 + uSeed*3.0, (el - 0.03)*6.4 - t*0.04));
        float relief = clamp((n1 - n1b)*7.0 + 0.5, 0.0, 1.0), bill = smoothstep(0.3, 0.72, n1*0.68 + n2*0.32);
        // the body stays indigo to violet with relief only; gold and cream are kept for the anvil
        vec3 col = mix(uDark, uMid, 0.1 + 0.9*(0.25 + 0.75*relief)*(0.3 + 0.7*bill)*smoothstep(0.04, 0.5, h));
        col *= 0.74 + 0.38*smoothstep(0.08, 0.7, h);
        col += uGold*0.045*relief*bill*smoothstep(0.34, 0.74, h);
        vec3 lit = mix(uPale, uGold, smoothstep(0.8, 1.0, h));
        col = mix(col, lit, smoothstep(0.72, 0.98, h)*(0.2 + 0.8*relief)*(0.45 + 0.55*bill)*0.62);
        // the cloud base: a shelf-cloud roll with a paler slate underside, dark murk beneath it
        float baseEl = 0.105 + 0.05*(fbm(vec2(azd*2.6 + uSeed*2.0, t*0.02)) - 0.5);
        float sh = (e - baseEl)/0.075;
        float roll = smoothstep(-0.08, 0.22, sh)*(1.0 - smoothstep(0.3, 1.05, sh));
        col = mix(col, mix(uMid, uRain, 0.6)*(0.7 + 0.6*n2), roll*(0.3 + 0.5*n1));
        col = mix(col, uDark*(0.72 + 0.3*n1), (1.0 - smoothstep(-0.3, 0.02, sh))*0.8);
        // rain veils hanging from the base, leaning with the wind, streaks sliding down inside them
        float sx = azd + el*0.5*uLean;
        float colm = smoothstep(0.25, 0.9, vnoise(vec2(sx*6.5 + uSeed*5.0, 3.0 + t*0.012))*0.72 + 0.28*vnoise(vec2(sx*21.0, 7.0 + t*0.03)));
        float streak = vnoise(vec2(sx*170.0, el*9.0 + t*0.55))*0.6 + vnoise(vec2(sx*460.0, el*20.0 + t*0.95))*0.4;
        float rainTop = baseEl*1.3 + 0.05*vnoise(vec2(az*4.0 + uSeed, 9.0));
        float rain = colm*(1.0 - smoothstep(rainTop*0.2, rainTop*1.6, el))*(0.35 + 0.65*smoothstep(0.0, 0.06, el))*(0.5 + 0.5*streak);
        col = mix(col, uRain, min(rain*1.1, 0.5));
        // lightning inside the cloud
        float fz = az - uFlashAz, fe = (el - 0.26)*1.6, glow = exp(-(fz*fz + fe*fe)*7.0)*smoothstep(0.04, 0.16, el)*(1.0 - smoothstep(0.6, 1.05, h));
        col += vec3(0.55, 0.66, 1.0)*uFlash*glow*(0.06 + 1.6*n1*n1 + 0.6*relief*bill)*1.3;
        col = mix(col, uFog, exp(-max(el, 0.0)*22.0)*0.6);
        gl_FragColor = vec4(col, inside*(1.0 - smoothstep(1.75, 2.05, abs(az))));
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'storm-wall'; mesh.frustumCulled = false; mesh.renderOrder = 0.2;
  return { object: mesh, uniforms: U, update(camera) { mesh.position.setFromMatrixPosition(camera.matrixWorld); } };
}

// ---------- quelea burst: small birds that erupt from the crown and stream across the frame, keyed to u ----------
function makeQueleaBurst(rng, o) {
  const N = o.count, base = new Float32Array([
    // x (span), y, z (length), w = wing weight
    0, 0, 0.42, 0, 0.09, 0, -0.1, 0, -0.09, 0, -0.1, 0,          // body dart
    0, 0.02, 0.22, 0, 0, 0.02, -0.16, 0, 1, 0.02, -0.02, 1,      // right wing
    0, 0.02, 0.22, 0, -1, 0.02, -0.02, 1, 0, 0.02, -0.16, 0,     // left wing
    0, 0, -0.08, 0, 0.07, 0, -0.42, 0, -0.07, 0, -0.42, 0,       // tail
  ]);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(base, 4), 3, 0));
  g.setAttribute('aWing', new THREE.InterleavedBufferAttribute(g.attributes.position.data, 1, 3));
  const st = new Float32Array(N * 3), rd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const a = rng.range(0, TAU), r = Math.sqrt(rng()) * o.radius * 0.85, y = rng.range(-0.35, 0.5) * o.radius;
    st.set([o.center.x + Math.cos(a) * r, o.center.y + y, o.center.z + Math.sin(a) * r], i * 3);
    rd.set([rng(), rng(), rng(), rng()], i * 4);
  }
  g.setAttribute('aStart', new THREE.InstancedBufferAttribute(st, 3));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rd, 4));
  g.instanceCount = N;
  const U = { uTime: { value: 0 }, uBurst: { value: 0 }, uCenter: { value: o.center.clone() }, uSize: { value: o.size ?? 0.42 }, uSun: { value: o.sunDir.clone() },
    uLit: { value: new THREE.Color(o.lit ?? '#b98a44') }, uDark: { value: new THREE.Color(o.dark ?? '#1c150d') }, uFlash: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      attribute float aWing; attribute vec3 aStart; attribute vec4 aRnd;
      uniform float uTime, uBurst, uSize; uniform vec3 uSun, uCenter; varying float vShade; varying float vWing;
      vec3 track(float p){
        vec3 burst = normalize(vec3(aRnd.y - 0.5, 0.25 + aRnd.z*0.6, aRnd.w - 0.5));
        vec3 s0 = normalize(vec3(-0.6, -0.1 + 0.1*(aRnd.w - 0.5), -0.78)), s1 = normalize(vec3(-0.5, -0.04, -0.86));
        float l0 = 64.0*(1.0 - exp(-p*2.6))*(0.9 + 0.2*aRnd.y), l1 = 160.0*p*p/(p + 0.55)*(0.9 + 0.2*aRnd.z);
        // out of the whole crown, then drawn together into one stream
        vec3 q = uCenter + (aStart - uCenter)*mix(1.0, 0.24, smoothstep(0.0, 0.45, p)) + burst*(11.0*(1.0 - exp(-p*6.0))*exp(-p*2.4) + 3.0*min(p*3.0, 1.0)) + s0*l0 + s1*l1;
        // the flock breathes as one ribbon: a slow travelling wave plus each bird's own jitter
        float w = min(p*3.0, 1.0), ph = p*5.0 - uTime*0.55;
        q += vec3(sin(ph + aRnd.x*1.3), cos(ph*0.8 + aRnd.x*0.9)*0.7, sin(ph*0.6))*(5.0*w + 5.0*p);
        q += vec3(sin(uTime*1.9 + aRnd.y*40.0), cos(uTime*2.3 + aRnd.z*40.0), sin(uTime*1.6 + aRnd.w*40.0))*1.5*w;
        q.y = max(q.y, 21.0 + aRnd.x*6.0);
        return q;
      }
      void main(){
        float p = max(0.0, uBurst*1.7 - aRnd.x*0.35);
        vec3 c = track(p), f = normalize(track(p + 0.012) - c + vec3(0.0, 0.0, -1e-4));
        vec3 r = normalize(cross(f, vec3(0.0, 1.0, 0.0))), u = cross(r, f);
        float flap = sin(uTime*(19.0 + aRnd.z*7.0) + aRnd.w*40.0);
        vec3 l = position; l.y += aWing*flap*0.75; l.x *= 1.0 - 0.3*aWing*abs(flap);
        float s = uSize*(0.8 + 0.5*aRnd.y)*smoothstep(0.0, 0.035, p);
        vec3 wp = c + (r*l.x + u*l.y + f*l.z)*s;
        vec3 n = normalize(u + r*aWing*flap*sign(position.x)*0.8);
        vShade = 0.5 + 0.5*dot(n, uSun) + 0.25*aWing*max(flap, 0.0); vWing = aWing;
        gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLit, uDark; uniform float uFlash; varying float vShade; varying float vWing;
      void main(){ gl_FragColor = vec4(mix(uDark, uLit, clamp(vShade, 0.0, 1.0)*0.9)*(0.85 + 0.3*vWing) + vec3(0.3, 0.36, 0.6)*uFlash*0.3, 1.0); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'quelea-burst'; mesh.frustumCulled = false;
  return { object: mesh, uniforms: U, triangles: N * 4 };
}

export default {
  id: 'storm-savanna',
  name: 'Storm over the Savanna',
  category: 'wilderness',
  weirdness: 0.04,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, DURATION = 45;
    const scene = new THREE.Scene();
    const C = (h) => new THREE.Color(h);

    // ----- per-seed character -----
    const V = {
      side: rng.chance(0.6) ? -1 : 1,                 // which side the flight swings in from (elephants on that side)
      sunEl: rng.range(5, 14), warm: rng(),       // sun height and how amber the light is
      storm: rng.pick(['indigo', 'violet', 'slate']),
      elephants: rng.int(11, 16), giraffes: rng.int(3, 6),
      farHerd: rng.pick(['wildebeest', 'wildebeest', 'zebra']), farCount: rng.int(26, 42),
      impala: rng.chance(0.6), water: rng.chance(0.7), devil: rng.chance(0.65),
      kopjes: rng.int(5, 8), trees: rng.int(55, 85), wind: rng.range(0.95, 1.45),
      lightning: rng.range(0.5, 0.95), curtains: rng.int(5, 8), queleas: rng.int(420, 520),
    };
    const RB = 0.24 + 0.08 * ((V.sunEl * 7.13) % 1), hgc = { fn: null };   // the bow is fainter on some visits, vivid on others
    const s = V.side, AX = -30, HY = 5;               // final axis x, height of the hero's ground
    const elR = (V.sunEl * Math.PI) / 180;
    const sunDir = new THREE.Vector3(0, Math.sin(elR), Math.cos(elR));   // behind the final heading
    const windXZ = new THREE.Vector2(0.45 * -s * 0.6 + 0.12, -0.9).normalize();   // toward the storm

    // ----- sky: goldenHour light under a storm deck -----
    const ST = { indigo: ['#161a36', '#262b52', '#565c8c', '#8a8cb4', '#1b1f3e'], violet: ['#1b1638', '#2e2756', '#62588e', '#958ab6', '#201a40'],
      slate: ['#131c30', '#22304c', '#4c6286', '#8494b0', '#17223a'] }[V.storm].map((h) => { const c = C(h), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return c.lerp(new THREE.Color(l, l, l), V.storm === 'violet' ? 0.5 : V.storm === 'slate' ? 0.34 : 0.48).multiplyScalar(1.22); });
    const zen = C(ST[0]).multiplyScalar(1.4);                       // the deck overhead is dusk, not night
    const sunCol = C('#ffd9a6').lerp(C('#ffb97c'), V.warm);
    const sky = SKY.makeSky({
      rng, preset: 'storm', zenith: zen, mid: ST[1], horizon: ST[2], ground: '#3a3024', horizonPow: 3.2,
      scatterColor: C('#f7b765').lerp(C('#ff9a4e'), V.warm), scatter: 1.05, scatterPow: 2.2, scatterHigh: 0.1, scatterFall: 3.2,
      sunDirection: sunDir, sunColor: sunCol, sunSize: 1.7, sunIntensity: 12, sunGlow: 0.9,
      lightning: V.lightning, flashColor: '#b9c8ff',
      clouds: { coverage: 0.8, softness: 0.5, scale: 0.6, lit: C(ST[2]).lerp(C(ST[3]), 0.5).lerp(C('#e2b98a'), 0.4), shade: C(ST[4]).multiplyScalar(0.8), absorb: 2.4, silver: 0.85, wind: [0.022, -0.03], detail: 0.8 },
      clouds2: { coverage: 0.95, softness: 0.6, scale: 0.5, stretch: 0.3, opacity: 1, lit: C(ST[2]).lerp(C('#c9955a'), 0.2), shade: ST[0], wind: [0.008, -0.012] },
      lightElevationMin: 30, lightColor: sunCol, lightIntensity: 3.1 * lerp(0.85, 1.15, (V.sunEl - 5) / 9), ambientColor: C(ST[2]).lerp(C('#8fa0e0'), 0.35), groundLight: '#8a6a3a', ambientIntensity: 1.25,
      cloudLit: C('#ffe6b8').lerp(C('#ffc890'), V.warm), cloudShade: ST[1],
    });
    scene.add(sky.object);
    const ahead = sky.colorAt(new THREE.Vector3(0, 0.035, -1).normalize(), new THREE.Color());
    const fogColor = ahead.clone().lerp(C('#c9955a'), 0.2);
    scene.fog = new THREE.FogExp2(fogColor, 0.00072);
    const rig = SKY.makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.35, flash: 1.5 });   // the fork's flash reaches the rig too (see update): the land lifts with the cloud
    scene.add(rig.object);
    await ctx.yield();

    // ----- the colour of the plain (needed by the hero's rise, the terrain and every blade of grass) -----
    // straw-pale on cool seeds, amber on warm ones; pale seeded drifts combed across the line of flight, grazed and burnt patches
    const cG1 = C('#aa9a58').lerp(C('#b08a42'), V.warm), cG2 = C('#cbb66c').lerp(C('#d0a650'), V.warm), cRed = C('#a8884a'), cPale = C('#c6b07c'), cSand = C('#cdb994'),
      cEarth = C('#6f5330'), cRise = C('#c2913f'), cDrift = C('#d8c48c'), cBurnt = C('#7c6234');
    const plainColor = (x, z, out) => {
      const n = noise.fbm2(x * 0.0045, z * 0.0045, 3) * 0.5 + 0.5, m = noise.n2(x * 0.021 + 7, z * 0.021) * 0.5 + 0.5;
      out.copy(cG1).lerp(cG2, smoothstep(0.3, 0.75, n)).lerp(cRed, smoothstep(0.55, 0.88, m) * 0.55);
      out.lerp(cPale, smoothstep(0.62, 0.95, noise.n2(x * 0.0017 - 3, z * 0.0017) * 0.5 + 0.5) * 0.5);
      out.lerp(cDrift, smoothstep(0.52, 0.86, noise.n2(x * 0.0034 + 11, z * 0.019 - 5) * 0.5 + 0.5) * 0.34);
      out.lerp(cBurnt, smoothstep(0.56, 0.84, noise.fbm2(x * 0.0095 - 20, z * 0.0125 + 8, 2) * 0.5 + 0.5) * 0.36);
      { const dh = Math.hypot(x, z); if (dh < 160) out.lerp(cRise, 0.3 * (1 - smoothstep(30, 160, dh))); }
      return out;
    };
    hgc.fn = plainColor;

    // ----- the hero: the Elder Baobab at the origin -----
    const hero = await buildHero(ctx, { palette: PALETTE, rainbowStrength: RB, grass: false, groundColor: (x, z, out) => (hgc.fn ? hgc.fn(x, z, out) : out.set('#ad924c')), sunDir: sunDir.toArray(), windDir: [windXZ.x, windXZ.y], wind: V.wind });
    hero.object.position.set(0, HY, 0);
    scene.add(hero.object);
    const A = hero.anchors, toW = (v) => new THREE.Vector3(v.x, v.y + HY, v.z);
    await ctx.yield();

    // ----- the path -----
    const j = (a) => rng.range(-a, a), fly = A.flyThrough.map(toW), seat = toW(A.portalSeat.position);
    const path = makePath([
      [AX + s * (104 + j(14)), 9, 722],
      [AX + s * 97, 9, 650],
      [AX + s * (70 + j(5)), 6.5, 545],                 // a low pass over the grass beside the elephant file
      [AX + s * 22, 14, 432],
      [AX - s * 22, 25, 336],
      [AX - s * 9, 20.2, 255],
      [AX - s * 1.2, 18.4, 196],
      fly[1], fly[2], fly[3], fly[4], seat,
    ]);

    // ----- land -----
    const swell = T.hills({ noise, height: 7, scale: 310, octaves: 3 });
    const RZ = 478 + j(22), rph = rng.range(0, TAU);
    const riverZ = (x) => RZ + 58 * Math.sin(x * 0.0085 + rph) + 20 * Math.sin(x * 0.023 + rph * 2.3);
    const riverD = (x, z) => Math.abs(z - riverZ(x)) * 0.86;
    const pAt = (u) => { const p = path.pointAt(u), t = path.tangentAt(u); t.y = 0; t.normalize(); return { p, t, r: new THREE.Vector3(-t.z, 0, t.x) }; };
    const fG = pAt(0.455), G = fG.p.clone().addScaledVector(fG.r, 42); G.y = 0;      // the giraffes' rise
    const fK = pAt(0.47), K0 = fK.p.clone().addScaledVector(fK.r, -24); K0.y = 0;     // the kopje the flight lifts past: gold-lit profile on the left, giraffes on the right
    let pondX = 0; { let best = 1e9; for (let i = 0; i <= 80; i++) { const p = path.pointAt(0.2 + i * 0.003), d = Math.abs(riverD(p.x, p.z)); if (d < best) { best = d; pondX = p.x; } } }
    const pond = new THREE.Vector3(pondX - s * 44, 0, 0); pond.z = riverZ(pond.x);
    const baseH = (x, z) => {
      const d2 = x * x + z * z, dh = Math.sqrt(d2), flat = dh > 190 ? 1 : smoothstep(60, 190, dh);
      let h = swell(x, z) * flat;
      if (dh < 560) h += HY * Math.exp(-d2 / (170 * 170));
      const df = Math.hypot(x, z - 250); if (df > 1000) h += 30 * smoothstep(1000, 2300, df) * (0.55 + 0.45 * noise.n2(x * 0.0008, z * 0.0008));
      const rd = riverD(x, z); if (rd < 17) h -= 2.3 * (1 - smoothstep(4, 17, rd)) * flat;
      if (V.water) { const dx = x - pond.x, dz = z - pond.z, q = dx * dx + dz * dz; if (q < 8000) h -= 2.4 * Math.exp(-q / (21 * 21)); }
      { const dx = x - G.x, dz = z - G.z, q = dx * dx + dz * dz; if (q < 40000) h += 11 * Math.exp(-q / (44 * 44)); }
      { const dx = x - K0.x, dz = z - K0.z, q = dx * dx + dz * dz; if (q < 14000) h += 2.4 * Math.exp(-q / (30 * 30)); }
      if (dh < 52) h += Math.max(0, hero.groundHeight(x, z) - 0.3);
      return h;
    };
    const groundColor = (x, z, h, ny, out) => {
      plainColor(x, z, out);
      const rd = riverD(x, z);
      if (rd < 15) { const m = noise.n2(x * 0.021 + 7, z * 0.021) * 0.5 + 0.5, k = smoothstep(60, 190, Math.hypot(x, z)); out.lerp(cSand, (1 - smoothstep(4, 13, rd)) * k * (0.75 + 0.25 * m)).lerp(cEarth, (1 - smoothstep(0.5, 2.6, rd + m * 2.2)) * 0.3 * k); }
      if (ny !== undefined && ny < 0.9) out.lerp(cEarth, smoothstep(0.9, 0.7, ny) * 0.7);
      return out;
    };
    // the ground itself is a little darker where blades stand on it, so the gaps between tufts read as shade, not bare earth
    const pTab = []; for (let i = 0; i <= 110; i++) { const q = path.pointAt(i / 110); pTab.push(q.x, q.z); }
    let pX0 = 1e9, pX1 = -1e9; for (let i = 0; i < pTab.length; i += 2) { pX0 = Math.min(pX0, pTab[i]); pX1 = Math.max(pX1, pTab[i]); }
    const pathD = (x, z) => { if (x < pX0 - 112 || x > pX1 + 112 || z < -292 || z > 834) return 999; let m = 1e12; for (let i = 0; i < pTab.length; i += 2) { const dx = pTab[i] - x, dz = pTab[i + 1] - z, q = dx * dx + dz * dz; if (q < m) m = q; } return Math.sqrt(m); };
    const terrainColor = (x, z, h, ny, out) => {
      groundColor(x, z, h, ny, out);
      const k = Math.max(1 - smoothstep(60, 110, pathD(x, z)), 1 - smoothstep(70, 120, Math.hypot(x, z)));
      return k > 0 ? out.lerp(cEarth, 0.13 * k) : out;
    };
    await ctx.yield();
    const landOpts = { rng: rng.fork('land'), noise, path, height: baseH, bounds: [-1600, -2100, 1600, 1250],
      cell: 4, near: 46, levels: 4, refine: 1, maxTriangles: 32000, focus: [[0, 0, 1]],
      biome: 'meadow', palette: { tufts: 1, pebbles: 0.3, cracks: 0.1, clouds: 0.75, cloudSize: 520, cloudSpeed: 16, patchAmount: 0, rock: '#8a6f55', rockB: '#6a5544' },
      color: terrainColor, shadow: 0, ao: 0, skirt: 40, corridor: { clearance: 5.5, width: 12, slope: 0.3 } };
    const land = T.makeTerrainAsync ? await T.makeTerrainAsync(landOpts, () => ctx.yield()) : T.makeTerrain(landOpts);
    scene.add(land.object);
    const hAt = (x, z) => land.heightAt(x, z), sAt = (x, z) => (land.surfaceAt ? land.surfaceAt(x, z) : land.heightAt(x, z));
    await ctx.yield();

    // far ridges under the storm
    const ridges = T.makeHorizonRidges({ rng: rng.fork('ridges'), layers: 3, radius: [1900, 3500], height: [45, 170], base: -25, jagged: 0.22, coverage: 0.6,
      colorNear: C(ST[1]).lerp(C('#7a5a2a'), 0.25), fog: scene.fog, sunDir, sunColor: sunCol, sunIntensity: 0.8, rim: 0.15 });
    scene.add(ridges.object);
    await ctx.yield();

    // ----- water: a pool left in the dry riverbed -----
    let lake = null, pondLevel = 0;
    if (V.water) {
      pondLevel = hAt(pond.x, pond.z) + 1.25;
      lake = W.makeLake({ rng: rng.fork('lake'), light: W.waterLight(sky), level: pondLevel, center: [pond.x, pond.z], radius: 40, segments: 40,
        depthAt: (x, z) => pondLevel - hAt(x, z), deep: '#232a48', shallow: '#8c7a52', shoreFoam: 0.25, foamWidth: 1.2, clarity: 0.9, ripple: 1.2,
        band: { color: '#5a4a2a', top: '#b0914e', height: 0.05, softness: 0.03, amount: 0.8 } });
      scene.add(lake.object);
    }
    await ctx.yield();

    // ----- kopjes and boulders -----
    const rockCols = ['#b89468', '#7e6248'];
    const rockMat = T.makeRockMaterial({ terrain: land, top: null, contact: [4, 0.5, 0], strata: 0.25, cracks: 0.3, roughness: 0.97, bump: 1.3,
      cloudUniform: { value: new THREE.Vector4(0, 0, 1 / 520, 0) } });       // the kopjes are landmarks: they keep the gold light while cloud shadow crosses the grass
    const kopVar = [];
    for (const [i, hh, hi] of [[0, 12, 2], [1, 16, 1], [2, 19, 1]]) { kopVar.push(await kopjeGeometry(rng.fork('k' + i), hh, rockCols, hi, () => ctx.yield())); await ctx.yield(); }
    const kopM = [[], [], []], kopSites = [], qy = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
    const putKop = (v, x, z, sc) => { kopM[v].push(new THREE.Matrix4().compose(new THREE.Vector3(x, sAt(x, z) - 0.8 * sc, z), qy.setFromAxisAngle(UP, rng.range(0, TAU)), new THREE.Vector3(sc, sc, sc))); kopSites.push([x, z, [12, 16, 19][v] * sc]); };
    putKop(0, K0.x, K0.z, 1.4);
    { const gk = G.clone().addScaledVector(fG.r, 30).addScaledVector(fG.t, 34); putKop(1, gk.x, gk.z, 0.8); }
    for (let i = 0, tries = 0; i < V.kopjes && tries < 400; tries++) {
      const u = rng.range(0.03, 0.97), f = pAt(u), lat = rng.range(48, 300) * rng.sign(), p = f.p.clone().addScaledVector(f.r, lat);
      if (path.nearestXZ(p.x, p.z).dist < 46 || Math.hypot(p.x, p.z) < 150 || riverD(p.x, p.z) < 40 || Math.hypot(p.x - G.x, p.z - G.z) < 70) continue;
      if (p.z < 120 && Math.abs(p.x - AX) < 70) continue;                                       // keep the avenue to the portal open
      if (kopSites.some((k) => Math.hypot(k[0] - p.x, k[1] - p.z) < 110)) continue;
      putKop(rng.int(0, 2), p.x, p.z, rng.range(0.7, 1.12)); i++;
    }
    const kSd = rng.sign();
    { const sd = kSd, x = AX + sd * rng.range(50, 60), z = rng.range(-112, -90); putKop(rng.int(1, 2), x, z, rng.range(0.75, 0.95)); }   // one beside the last run, framing the portal
    const kopjes = new THREE.Group(); kopjes.name = 'kopjes';
    kopVar.forEach((g, v) => { if (kopM[v].length) kopjes.add(T.makeInstances(g, rockMat, kopM[v], { tints: ['#ffe9c8', '#f2c890'], brightness: 0.28, rng: rng.fork('kt' + v) }).object); else g.dispose(); });
    scene.add(kopjes);
    await ctx.yield();
    // the open ground the flight looks across to the giraffes carries no loose boulders: none within 60 m of their rise on the path's side of it
    const gPathD = path.nearestXZ(G.x, G.z).dist;
    const spots = T.scatter({ rng: rng.fork('rocks'), terrain: land, path, count: 90, band: [16, 190], scale: [0.5, 2.1], clearance: 10, attempts: 8,
      density: (x, z) => { if (Math.hypot(x - G.x, z - G.z) < 60 && path.nearestXZ(x, z).dist < gPathD) return 0; return (Math.hypot(x, z) < 60 ? 0 : 0.25 + 0.75 * (kopSites.some((k) => Math.hypot(k[0] - x, k[1] - z) < k[2] * 2.6) ? 1 : (riverD(x, z) < 16 ? 0.8 : 0.08))); } });
    await ctx.yield();
    const spotGeo = T.rockGeometry({ rng: rng.fork('rg'), kind: 'boulder', detail: 1, color: rockCols[0], colorB: rockCols[1] });
    await ctx.yield();
    scene.add(T.makeInstances(spotGeo, T.makeRockMaterial({ terrain: land, top: null, strata: 0.12 }), spots).object);
    await ctx.yield();
    land.addContact(spots);
    await ctx.yield();

    // ----- the elephants' line (needed before trees and grass so nothing is planted on it) -----
    // The file walks a straight line laid beside the low opening run, on the outside of the turn, so the camera comes up
    // behind it and overtakes it animal by animal: tail 30 m ahead and to the side at u = 0.2, the leader abeam at uE.
    // Every place an elephant stands during the flight is tested against the path: never nearer than 24 m.
    const uE = 0.32, fE = pAt(uE), E_SPEED = 1.1, eFile = 7.5 * V.elephants, E_SPAN = 330;
    let offE = 25, eOff = 0, eAng = 0, eSide = 1, eA = null, eB = null;
    for (let k = 0; k < 10; k++, offE += 2) {
      const a = pAt(0.14), b = pAt(0.33), A0 = a.p.clone().addScaledVector(a.r, s * offE).setY(0), B0 = b.p.clone().addScaledVector(b.r, s * offE).setY(0), d = B0.sub(A0).normalize();
      const P = fE.p.clone().setY(0), R = fE.r, den = d.x * R.z - d.z * R.x, tt = ((P.x - A0.x) * R.z - (P.z - A0.z) * R.x) / (Math.abs(den) > 1e-4 ? den : 1e-4);
      eOff = A0.addScaledVector(d, tt).sub(P).dot(R);
      const al = d.dot(fE.t), la = d.dot(fE.r);
      eAng = (Math.atan2(Math.abs(la), al) * 180) / Math.PI; eSide = la >= 0 ? 1 : -1;
      const pts = F.crossPoints(path, { u: uE, lead: 0, span: E_SPAN, angle: eAng, side: eSide, offset: eOff, height: 0, bow: 0 });
      eA = pts[0]; eB = pts[pts.length - 1];
      const L = eA.distanceTo(eB), win = L / (2 * E_SPEED * DURATION); let min = 1e9;
      for (let i = 0; i <= 40; i++) {
        const u = i / 40, sd = ((u - (uE - win)) / (2 * win)) * L;
        for (let lag = 0; lag <= eFile; lag += 6) { const q = clamp((sd - lag) / L, 0, 1); min = Math.min(min, path.nearestXZ(lerp(eA.x, eB.x, q), lerp(eA.z, eB.z, q)).dist); }
      }
      if (min >= 24) break;
    }
    const eDir = eB.clone().sub(eA).setY(0).normalize(), eLen = eA.distanceTo(eB);
    const eLineD = (x, z) => { const t = clamp(((x - eA.x) * eDir.x + (z - eA.z) * eDir.z), 0, eLen); return Math.hypot(x - (eA.x + eDir.x * t), z - (eA.z + eDir.z * t)); };

    // ----- trees: flat-topped acacias and a scatter of baobabs -----
    const wind = flora.makeWind({ direction: [windXZ.x, windXZ.y], strength: 1.15 * V.wind, speed: 1.1 });
    const treeMatOpts = { wind, backlight: 0.5, backlightTint: '#ffd884' };
    if (flora.prepareLeafTexture) await flora.prepareLeafTexture(treeMatOpts, () => ctx.yield());
    const treeMat = flora.windMaterial(treeMatOpts);
    await ctx.yield();
    const leaf = { leaf: '#7a853c', leafLight: '#bdb45c', leafDark: '#424c24' };
    const mkTrees = async (r, detail) => {
      const a = acaciaGeometry(r, { height: 10.5, detail, ...leaf }); await ctx.yield();
      const b = acaciaGeometry(r, { height: 8, detail, ...leaf }); await ctx.yield();
      const c = flora.baobabGeometry({ rng: r, height: 15, detail, foliage: false, bark: '#a08468', barkDark: '#5a4636', ...leaf }); await ctx.yield();
      return [a, b, c];
    };
    const nearVar = await mkTrees(rng.fork('tn'), 1), farVar = await mkTrees(rng.fork('tf'), 0);
    const treeOK = (x, z, dist, u) => {
      if (Math.hypot(x, z) < 135 || riverD(x, z) < 14 || eLineD(x, z) < 15) return 0;
      if (V.water && Math.hypot(x - pond.x, z - pond.z) < 48) return 0;
      if (Math.hypot(x - G.x, z - G.z) < 36) return 0;
      if (z < 150 && Math.abs(x - AX) < 30) return 0;                     // the avenue to the portal stays open
      if (u !== undefined && u < 0.32 && dist < 50) return 0;             // and so does the opening sightline
      for (const k of kopSites) if (Math.hypot(k[0] - x, k[1] - z) < k[2] * 1.15) return 0;
      return 0.3 + 0.7 * smoothstep(-0.2, 0.5, noise.n2(x * 0.004 + 40, z * 0.004));
    };
    const rt = rng.fork('treepts');
    const treePts = flora.scatterPoints({ rng: rt, path, count: V.trees, radius: 340, corridor: 30, spacing: 15, falloff: 0.25, heightAt: sAt, scale: [0.8, 1.45], density: treeOK })
      .concat(flora.scatterPoints({ rng: rt, bounds: [-420, -760, 420, -215], count: 16, spacing: 22, heightAt: sAt, scale: [0.85, 1.5], density: (x, z) => treeOK(x, z, 99, 1) }));
    await ctx.yield();
    for (const p of treePts) { p.v = rt.chance(0.13) ? 2 : rt.int(0, 1); if (p.v === 2) p.s *= rt.range(0.75, 1.1); }
    // placed by hand: foreground anchors beside the entry and the lift (the side away from the elephants), and a few that frame the last run
    const plant = (x, z, sc, v) => { if (riverD(x, z) < 10) return; const nn = path.nearestXZ(x, z); treePts.push({ x, y: sAt(x, z), z, s: sc, rot: rt() * TAU, d: nn.dist, u: nn.u, v }); };
    for (const [u, lat, sc, v] of [[0.05, 20, 1.6, 0], [0.11, 17, 1.45, 1], [0.17, 19, 1.6, 0], [0.5, 37, 1.45, 0], [0.56, 52, 1.2, 1]]) { const f = pAt(u); plant(f.p.x - s * f.r.x * lat, f.p.z - s * f.r.z * lat, sc * rt.range(0.94, 1.08), v); }
    { const sd = rt.sign();
      plant(AX - sd * rt.range(34, 40), rt.range(-74, -66), 1.5, 0); plant(AX + sd * rt.range(36, 42), rt.range(-136, -124), 1.5, 0);
      plant(AX + sd * 37, -71, 1.45, 1); plant(AX - sd * 39, -129, 1.5, 0);
      plant(AX - 23, -169, 1.45, 0); plant(AX + 24, -172, 1.4, 1);                                              // and a pair that stands either side of the portal, a gate under the bow
      plant(AX - sd * rt.range(72, 92), rt.range(-176, -140), 1.2, 1); plant(AX + sd * rt.range(95, 130), rt.range(-250, -215), 1.0, 2); }
    { const f = pAt(0.215); plant(f.p.x + s * f.r.x * 64, f.p.z + s * f.r.z * 64, 1.5, 0); }                       // one beyond the elephant file, behind it as the camera overtakes
    // Mid-ground for the approach: a belt of trees 35 to 60 m from the path on the side away from the giraffes' rise, from the entry
    // to the place abeam of the baobab. A seeded scatter of its own, drawn after every other tree so none of them is re-dealt; it
    // keeps every rule of treeOK (the opening sightline, the elephants' line, the river, the kopjes) and 15 m from the trees already standing.
    { const gSide = Math.sign((G.x - fG.p.x) * fG.r.x + (G.z - fG.p.z) * fG.r.z) || 1, had = treePts.slice();
      const belt = flora.scatterPoints({ rng: rt, path, count: rt.int(5, 8), attempts: 600, radius: 60, corridor: 35, falloff: 0, uRange: [0, path.nearestXZ(0, 0).u], spacing: 15, heightAt: sAt, scale: [1.0, 1.5],
        density: (x, z, dist, u) => { const f = pAt(u); if (((x - f.p.x) * f.r.x + (z - f.p.z) * f.r.z) * gSide > 0) return 0; if (had.some((q) => Math.hypot(q.x - x, q.z - z) < 15)) return 0; return treeOK(x, z, dist, u) > 0 ? 1 : 0; } });
      for (const p of belt) { p.v = rt.chance(0.13) ? 2 : rt.int(0, 1); if (p.v === 2) p.s *= rt.range(0.75, 1.1); treePts.push(p); } }
    await ctx.yield();
    const trees = flora.makeScatter({ rng: rng.fork('trees'), points: treePts, variants: nearVar, farVariants: farVar, farDistance: 84, path, material: treeMat,
      heightAt: sAt, tint: 0.12, hue: 0.03, sink: 0.04, groundShadow: { sunDir, strength: 0.5, stretch: 3, size: 1.25, color: '#1d1c3a' } });
    scene.add(trees.object);
    await ctx.yield();

    // ----- grass: a waist-high golden sea rolling in the wind, densest under the camera -----
    const tmpC = new THREE.Color(), gCol = (x, z, y) => groundColor(x, z, y, 1, tmpC);
    const gWind = flora.makeWind({ direction: [windXZ.x, windXZ.y], strength: 1.6 * V.wind, speed: 1.15, gustScale: 0.014, gustiness: 1.0 });   // 60-70 m bands of light travelling toward the storm
    const gLook = { root: '#6e5c2c', tip: '#' + C('#f0e4b0').lerp(C('#f0b050'), V.warm).getHexString(), rootGain: 1.04, tint: 0.35 };   // straw on cool visits, amber on warm ones
    const gMat = { ambient: 1.1, leafAmbient: 1.15, wrap: 0.45, backlight: 0.55, sheen: 1.15, detail: 0 };
    const gRnd = rng.fork('grass-edge');
    const mkGrass = (o) => (flora.makeGrassAsync ? flora.makeGrassAsync(o, () => ctx.yield()) : Promise.resolve(flora.makeGrass(o)));
    // Two things the kit's grass has no hook for, added once here to its shader (one extra program, made at build):
    // the land's own drifting cloud shadow, so dark and gold bands cross the plain, and a cool rim on the tips when a fork strikes.
    const gFlash = { value: 0 }, gCloud = { value: 0.7 }, gDetail = { value: land.detailTexture || null }, gCloudU = (land.uniforms && land.uniforms.uTCloud) || { value: new THREE.Vector4(0, 0, 1 / 520, 0) };
    // the kit's gust is 0.55 +- the wind's gustiness and the tip weight at most 1.5: the least and the most its sheen can make of a blade's colour
    const gustAmt = gWind.uniforms.uFloraGust.value.y, sheenLo = 1 + gMat.sheen * (Math.min(0, (0.55 - gustAmt) * 1.5) - 0.3), sheenHi = 1 + gMat.sheen * ((0.55 + gustAmt) * 1.5 - 0.3);
    const stormGrass = (mat) => {
      const kit = mat.onBeforeCompile;
      mat.onBeforeCompile = (shader, renderer) => {
        kit.call(mat, shader, renderer);
        shader.uniforms.uSSFlash = gFlash; shader.uniforms.uSSCloudAmt = gCloud; shader.uniforms.tSSDetail = gDetail; shader.uniforms.uSSCloud = gCloudU;
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform float uSSFlash, uSSCloudAmt; uniform sampler2D tSSDetail; uniform vec4 uSSCloud;')
          .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        // The blade colour and the gust weight are interpolated along the blade. On a far, thin clump a multisample can lie outside
        // the triangle, where both run on past their ends, below zero, and the kit's gust sheen (colour times 1 + sheen * (gust * tip
        // weight - 0.3)) multiplies the two negatives into a bright colour that no blade has, which the sun then lights. Each is held
        // to the range it has inside a blade: the colour here (never below zero), the sheened colour below (the colour times the sheen's own range).
        diffuseColor.rgb = clamp(diffuseColor.rgb, 0.0, 6.0);
        float ssShadow = smoothstep(0.46, 0.66, texture2D(tSSDetail, vFloraWorld.xz * uSSCloud.z + uSSCloud.xy).r) * min(uSSCloud.w, 1.0);
        diffuseColor.rgb *= mix(vec3(1.0), vec3(0.78, 0.72, 0.62), uSSCloudAmt * ssShadow);   // under a cloud the gold goes deep amber, never grey
        vec3 ssBlade = diffuseColor.rgb;`)
          .replace('#include <normal_fragment_begin>', /* glsl */`diffuseColor.rgb = clamp(diffuseColor.rgb, ssBlade * ${sheenLo.toFixed(3)}, ssBlade * ${sheenHi.toFixed(3)});
        #include <normal_fragment_begin>`)
          .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        totalEmissiveRadiance += mix(clamp(diffuseColor.rgb, 0.0, 1.0) * 1.6, vec3(0.5, 0.56, 0.8), 0.3) * (uSSFlash * 0.34 * (0.12 + 0.88 * clamp(vFlora.w, 0.0, 1.0) * clamp(vFlora.w, 0.0, 1.0)) * (0.3 + 0.7 * clamp(dot(diffuseColor.rgb, vec3(1.2)), 0.0, 1.0)));`);
      };
      mat.customProgramCacheKey = () => 'flora-wind-2l-storm-savanna';
    };
    const riseY = (x, z) => { const d2 = x * x + z * z, y = hAt(x, z); return d2 < 2700 ? Math.max(y, HY + hero.groundHeight(x, z)) : y; };   // tufts stand on the hero's rise, not under it
    const noGrass = (x, z) => riverD(x, z) < 5.5 || (V.water && Math.hypot(x - pond.x, z - pond.z) < 45 && pondLevel - hAt(x, z) > -0.25);
    const grass = await mkGrass({ rng: rng.fork('grass'), path, radius: 34, count: 31500, bias: 3.0, width: [0.7, 1.2], height: [1.25, 2.2], cards: 3, ...gLook,
      heightAt: riseY, heightStep: 4, groundColor: gCol, shade: [trees], wind: gWind, map: treeMat.map, flowers: 0, fade: [140, 195], chunks: 9,
      density: (x, z) => (noGrass(x, z) || Math.hypot(x, z) < 12.5 + 6.5 * gRnd() ? 0 : 1), materialOptions: gMat });
    stormGrass(grass.material);
    scene.add(grass.object);
    await ctx.yield();
    // broader tufts out to the sides, so the sea of grass runs unbroken to where the far clumps take over
    const midGrass = await mkGrass({ rng: rng.fork('mid'), path, radius: 118, count: 9500, bias: 1.0, width: [3.3, 5.4], height: [1.4, 2.4], cards: 2, ...gLook,
      heightAt: hAt, heightStep: 6, groundColor: gCol, shade: [trees], wind: gWind, map: treeMat.map, flowers: 0, fade: [230, 300], chunks: 6,
      density: (x, z, lat) => (noGrass(x, z) || Math.hypot(x, z) < 100 ? 0 : smoothstep(16, 32, lat)), materialOptions: gMat });
    stormGrass(midGrass.material);
    scene.add(midGrass.object);
    await ctx.yield();
    // the same grass carried over the hero's rise and out round it, so the rise is part of the plain and not a disc on it
    const ringGrass = await mkGrass({ rng: rng.fork('ring'), bounds: [-124, -124, 124, 124], count: 11000, width: [1.2, 2.0], height: [1.25, 2.2], cards: 2, ...gLook,
      heightAt: riseY, heightStep: 3, groundColor: gCol, wind: gWind, map: treeMat.map, flowers: 0, chunks: 1, fade: [400, 500],
      materialOptions: gMat,
      density: (x, z) => { const d = Math.hypot(x, z); return smoothstep(12.5, 19, d) * (1 - 0.9 * smoothstep(62, 122, d)); } });
    stormGrass(ringGrass.material);
    scene.add(ringGrass.object);
    await ctx.yield();
    // big clumps far out, so the plain beyond the blade ring still reads as grass, not sand
    const farD = (x, z) => (riverD(x, z) < 7 || Math.hypot(x, z) < 112 ? 0 : 0.4 + 0.6 * smoothstep(-0.3, 0.4, noise.n2(x * 0.007 - 9, z * 0.007)));
    const farGrass = await mkGrass({ rng: rng.fork('far'), path, radius: 400, count: 3000, bias: 1.2, width: [5.5, 9.5], height: [1.6, 2.9], cards: 2, ...gLook,
      heightAt: sAt, heightStep: 12, groundColor: gCol, material: ringGrass.material, wind: gWind, map: treeMat.map, flowers: 0, chunks: 5,
      density: (x, z, lat) => (lat < 100 ? 0 : farD(x, z)) });
    scene.add(farGrass.object);
    await ctx.yield();
    // and the land the flight never reaches: beyond and beside the portal, seen all through the last run
    const beyond = await mkGrass({ rng: rng.fork('beyond'), bounds: [AX - 125, -350, AX + 125, -178], count: 8500, width: [1.6, 2.8], height: [1.4, 2.5], cards: 2, ...gLook,
      heightAt: sAt, heightStep: 7, groundColor: gCol, material: ringGrass.material, wind: gWind, map: treeMat.map, flowers: 0, chunks: 1,
      density: (x, z) => (1 - 0.6 * smoothstep(40, 125, Math.abs(x - AX))) * (1 - 0.6 * smoothstep(-230, -350, z)) });
    await ctx.yield();
    const exitGrass = await mkGrass({ rng: rng.fork('exit'), bounds: [AX - 340, -640, AX + 340, -60], count: 2000, width: [5.5, 10], height: [1.7, 3.0], cards: 2, ...gLook,
      heightAt: sAt, heightStep: 12, groundColor: gCol, material: ringGrass.material, wind: gWind, map: treeMat.map, flowers: 0, chunks: 1,
      density: (x, z) => { const dx = Math.abs(x - AX); if (dx < 118 && z > -345) return 0; return farD(x, z) * (1 - 0.6 * smoothstep(120, 340, dx)) * (1 - 0.5 * smoothstep(-300, -640, z)); } });
    scene.add(beyond.object, exitGrass.object);
    await ctx.yield();

    // ----- creatures -----
    const light = F.lightFrom(scene);
    const fauna = F.makeFauna(scene, { light, rng: rng.fork('fauna') });
    const herd = fauna.add(F.makeHerd({ rng: rng.fork('eleph'), species: 'elephant', count: V.elephants, mode: 'migrate', heightAt: hAt, light,
      size: 1.55, sizes: [1, 0.9, 0.5, 0.96, 0.84, 0.44, 1.03, 0.88, 0.6], spread: [1.5, eFile], speed: E_SPEED, shadowOpacity: 0.5, shadowSize: [2.2, 14, 11], fill: 0.45,
      coat: '#57504a', belly: '#433d38', legs: '#4c4640',
      cross: { path, u: uE, lead: 0, span: E_SPAN, angle: eAng, side: eSide, offset: eOff, height: 0, bow: 0, duration: DURATION } }));
    await ctx.yield();
    const giraffes = fauna.add(F.makeHerd({ rng: rng.fork('giraffe'), species: 'giraffe', count: V.giraffes, heightAt: hAt, light, center: [G.x, 0, G.z], radius: 12, size: 1.75,
      path, clear: 30, shadowOpacity: 0.5, shadowSize: [0.9, 6, 4.6], fill: 0.3, coat: '#7a5630', belly: '#5a4428', legs: '#604a2c', sock: '#6a5434', accent: '#46351f', rim: 0.55 }));
    await ctx.yield();
    const farRoute = [0.06, 0.18, 0.3, 0.42, 0.54, 0.66].map((u, i) => { const f = pAt(u), p = f.p.clone().addScaledVector(f.r, -s * (215 + 45 * Math.sin(i * 1.7 + rph))); return [p.x, 0, p.z]; });
    const wildebeest = { ...F.HERD_PRESETS.bison, h: 1.35, coat: '#4e443c', belly: '#3e3630', legs: '#3a322c', sock: '#2e2824', accent: '#2a2420', horn: '#2a2420' };
    const farHerd = fauna.add(F.makeHerd(V.farHerd === 'zebra'
      ? { rng: rng.fork('far'), species: 'zebra', count: V.farCount, mode: 'migrate', route: farRoute, closed: false, heightAt: hAt, light, spread: [16, 150] }
      : { rng: rng.fork('far'), preset: wildebeest, count: V.farCount, mode: 'migrate', gait: 'run', route: farRoute, closed: false, heightAt: hAt, light, spread: [16, 170] }));
    await ctx.yield();
    if (V.impala) {
      const c = pond.clone().addScaledVector(new THREE.Vector3(-s, 0, 0.25).normalize(), 62); c.z = riverZ(c.x) + 26;
      fauna.add(F.makeHerd({ rng: rng.fork('impala'), species: 'antelope', count: rng.int(7, 12), heightAt: hAt, light, center: [c.x, 0, c.z], radius: 24, path, clear: 28 }));
    }
    await ctx.yield();
    if (V.water) fauna.add(F.makeWaders({ rng: rng.fork('stork'), species: rng.pick(['stork', 'egret', 'crane']), count: rng.int(4, 7), center: [pond.x, pondLevel, pond.z], radius: 11, level: pondLevel, heightAt: hAt, light }));
    fauna.add(F.makeFlock({ rng: rng.fork('vult'), species: 'eagles', count: rng.int(3, 5), center: [K0.x - s * 50, 66, K0.z - 110], radius: 70, light }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('swift'), species: 'swifts', count: rng.int(12, 20), light, along: { path, side: -s * 8, up: 0.5, lead: 28, from: -0.05, to: 0.38, drift: 8 } }));
    // (the clear air round the line, 14 Oct: this crossing's scatter dealt an egret 0.35 m from the flown line, and a crossing is keyed to the
    // camera, so that pass came on every visit. The crossing itself stays where it was laid; the kit holds off the few birds that come too near.)
    fauna.add(F.makeFlock({ rng: rng.fork('egret'), species: 'gulls', count: rng.int(8, 14), light, cross: { path, u: 0.34, lead: 70, angle: 75, side: -s, height: 4, span: 400, duration: DURATION },
      keepClear: { path, dist: 2, each: true } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('vee'), species: 'geese', count: rng.int(9, 15), light, cross: { path, u: 0.63, lead: 170, angle: 105, side: s, height: 34, span: 760, duration: DURATION } }));
    await ctx.yield();
    const crown = toW(A.crown.position);
    const burst = makeQueleaBurst(rng.fork('quelea'), { count: V.queleas, center: crown, radius: A.crown.radius, sunDir, size: 1.3 });
    scene.add(burst.object);
    await ctx.yield();

    // ----- atmosphere: dust, chaff, haze, the storm wall, rain, lightning -----
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const w3 = [windXZ.x, 0, windXZ.y];
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: 300, box: [64, 8, 64], follow: 'xz', center: [0, 6, 0], colors: ['#b8863c', '#a67a34'], additive: 0, opacity: 0.22, twinkle: 0.1,
      velocity: [w3[0] * 1.6, 0.05, w3[2] * 1.6], intensity: 0.22 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('chaff'), preset: 'leaves', time, count: 300, box: [56, 6, 56], follow: 'xz', center: [0, 4, 0], colors: ['#b8863c', '#a67a34'], size: [0.08, 0.19],
      velocity: [w3[0] * 7.5 * V.wind, 0.25, w3[2] * 7.5 * V.wind], velocityRandom: [1.6, 0.7, 1.6], lightDir: sunDir }));
    await ctx.yield();
    set.add(fx.makeGroundFog({ time, layers: 4, size: 900, y: 1.5, height: 10, color: '#e0ae6c', opacity: 0.1, coverage: 0.55, scale: 0.009,
      wind: [w3[0] * 3.2, w3[2] * 3.2], sunDir, sunColor: sunCol, scatter: 0.5 }));
    await ctx.yield();
    const dustOpts = (o) => ({ time, height: 6.5, radius: [2.5, 9], size: [3.5, 10], count: 30, color: '#cf9f5c', colorTop: '#e6bf80', shadowColor: '#8a6436', ambient: '#4a3620',
      opacity: 0.1, rate: 0.1, wind: [w3[0] * 2.4, 0, w3[2] * 2.4], bend: 1.2, rim: 0.5, scatter: 0.4, sunDir, sunColor: sunCol, ...o });
    const eDust = [0.07, 0.28, 0.5, 0.72, 0.93].map((k, i) => ({ lag: k * eFile, col: set.add(fx.makeSmokeColumn(dustOpts({ rng: rng.fork('ed' + i), opacity: 0.11, height: 5, position: [eA.x, hAt(eA.x, eA.z), eA.z] }))) }));
    const fDust = [20, 90].map((lag, i) => ({ lag, col: set.add(fx.makeSmokeColumn(dustOpts({ rng: rng.fork('fd' + i), height: 11, radius: [6, 22], size: [9, 24], count: 34, opacity: 0.22,
      position: farRoute[0] }))) }));
    await ctx.yield();
    let devil = null;
    if (V.devil) {
      const f = pAt(0.6), p = f.p.clone().addScaledVector(f.r, -rng.range(95, 150)).addScaledVector(f.t, rng.range(20, 90));
      devil = set.add(fx.makeDustDevil({ rng: rng.fork('devil'), time, position: [p.x, sAt(p.x, p.z), p.z], height: rng.range(34, 50), radius: [1, 8], color: '#d6aa6c', colorTop: '#f0d2a0',
        shadowColor: '#6a5238', sunDir, sunColor: sunCol, wander: 12 }));
    }

    await ctx.yield();
    const wall = makeStormWall({ seed: rng.range(0, 50), lean: (0.5 + rng.range(0, 0.6)) * Math.sign(windXZ.x || 1), top: rng.range(0.92, 1.12),
      dark: C(ST[0]).lerp(C(ST[1]), 0.85).multiplyScalar(1.75), mid: C(ST[1]).lerp(C(ST[2]), 0.4).multiplyScalar(1.25), pale: C(ST[3]).lerp(C('#e8c9a0'), 0.25), gold: C('#ffe2ac').lerp(C('#ffc88a'), V.warm).multiplyScalar(0.95),
      rain: C(ST[2]).lerp(C(ST[3]), 0.5).lerp(fogColor, 0.4).multiplyScalar(0.8), fog: fogColor });
    scene.add(wall.object);
    await ctx.yield();
    const bolt = set.add(fx.makeLightning({ rng: rng.fork('bolt'), from: [0, 350, 0], to: [26, HY - 4, 18], position: [18, 0, -560], area: 250,
      interval: lerp(3.8, 2.4, V.lightning), intensity: 7, color: '#b4c8ff', glow: 0.22, fogAmount: 0.3, lightIntensity: 800 }));   // a cool lift on the storm side that leaves the grass its gold
    // the bolt keeps the kit's schedule as its own seed deals it: periodic, with seeded jitter, and no stroke pinned to a clock value
    bolt.uniforms.uMinAngle.value = 0.004;                         // never a hair: the fork keeps a readable width at any distance
    // The great fork: a second, larger ribbon with the cloud lit behind it. It strikes on the storm's own clock: a seeded period
    // of 3 to 4.5 s with a seeded phase, each stroke the kit's own (return stroke, two fading restrikes). Each strike stands at one
    // of the storm's strike places: the hero's two lightning anchors and four seeded places in the rain beyond the tree. Which
    // place a strike takes is a seeded hash of its number. No light of its own: the periodic bolt's light stays the world's only
    // lightning light. Its rng is forked after the build's last draw, so the rest of the world is dealt as it was without it.
    const kr = rng.fork('kbolt'), kInt = kr.range(3, 4.5), kSeed = kr.range(0, 1000);
    const kSites = A.lightning.map((v) => toW(v).setY(0));
    for (let i = 0; i < 4; i++) kSites.push(new THREE.Vector3(AX + kr.range(-320, 320), 0, kr.range(-950, -650)));
    const kSite = (k) => { const x = Math.sin(k * 127.1 + kSeed) * 43758.5453; return kSites[Math.floor((x - Math.floor(x)) * kSites.length) % kSites.length]; };
    const kBolt = set.add(fx.makeLightning({ rng: kr, from: [-14, 370, 0], to: [10, -6, 12], position: kSites[0].toArray(), area: 0, variants: 3, branches: 6,
      interval: kInt, offset: kr.range(0, kInt), intensity: 12, color: '#b4c8ff', glow: 0.24, fogAmount: 0.3, light: false, width: 2.2 }));
    kBolt.uniforms.uMinAngle.value = 0.005;
    const flashDir = new THREE.Vector3(0.2, 0.35, -1).normalize();
    await ctx.yield();
    // a small group grazing in the mid-ground of the last run, on the side away from the framing kopje (its rng too is forked after the last draw)
    fauna.add(F.makeHerd({ rng: rng.fork('lastrun'), species: 'antelope', count: 8, heightAt: hAt, light, center: [AX - kSd * 35, 0, -142], radius: 10, path, clear: 22, size: 2.0,
      coat: '#7a4e28', shadowOpacity: 0.45 }));
    await ctx.yield();

    // ----- gaze -----
    const gE = new THREE.Vector3(), gG = new THREE.Vector3(G.x, hAt(G.x, G.z) + 5, G.z), gHero = toW(hero.center || new THREE.Vector3(0, 24, 0));
    const gLimb = A.lowLimb ? toW(A.lowLimb).lerp(crown, 0.35) : crown.clone();
    // the gaze is held a little above level for the whole flight (one pull, the same from entry to portal), so the storm stands tall and the horizon sits low
    const gUp = new THREE.Vector3(), upP = new THREE.Vector3(), upT = new THREE.Vector3();
    const pois = [
      // the elephants: look at the part of the file some 40 m ahead of the camera, so it is overtaken in three-quarter view, animal by animal
      { at: (t, u) => {
        herd.positionAt(t, u, gE); path.pointAt(u, upP);
        const lead = (gE.x - eA.x) * eDir.x + (gE.z - eA.z) * eDir.z, cam = (upP.x - eA.x) * eDir.x + (upP.z - eA.z) * eDir.z;
        const at = clamp(cam + 36, lead - eFile + 10, lead - 4);
        gE.set(eA.x + eDir.x * at, 0, eA.z + eDir.z * at); gE.y = hAt(gE.x, gE.z) + 4; return gE;
      }, from: 0.04, to: 0.36, fade: 0.2, weight: 0.9 },
      { at: gG, from: 0.34, to: 0.49, weight: 0.68 },
      { at: gHero, from: 0.47, to: 0.7, weight: 0.6 },
      { at: gLimb, from: 0.68, to: 0.86, weight: 0.42 },
      { at: (t, u) => { path.pointAt(u, upP); path.tangentAt(u, upT); upT.y = 0; upT.normalize(); return gUp.copy(upP).addScaledVector(upT, 300).setY(upP.y + 150); }, from: -0.2, to: 1.05, fade: 0.1, weight: 0.25 },
    ];

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(); let landFl = 0;
    const moveDust = (list, h, t, u, dir) => {
      h.positionAt(t, u, tmp);
      for (const d of list) {
        tmp2.copy(tmp).addScaledVector(dir, -d.lag); const b = d.col.uniforms.uBase.value;
        b.set(tmp2.x, hAt(tmp2.x, tmp2.z) + 0.3, tmp2.z);
      }
    };
    const fDir = new THREE.Vector3(farRoute[5][0] - farRoute[0][0], 0, farRoute[5][2] - farRoute[0][2]).normalize();

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    return {
      scene, path, duration: DURATION,
      pace: (u) => 1 - 0.2 * smoothstep(0.1, 0.16, u) * (1 - smoothstep(0.28, 0.34, u)),      // linger beside the elephants
      camera: { fov: 62, near: 0.4, far: 4400, lookAhead: 28, sway: 0.8, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius || 7, color: '#fff2c0', glow: 1.25, revealDistance: 400 },
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 0.95, contrast: 1.07, tint: '#fff6e8', shadowTint: '#0a0b17', vignette: 0.34, grain: 0.022, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        // lightning: flicker inside the cloud from the start, the first real fork once the flight has lifted past the kopje.
        // The fork's flash is folded into sky.flash before the rig reads it, so the land lifts with the cloud.
        const forks = u > 0.4;
        sky.update(dt, t, camera); set.update(dt, t, camera);
        // the great fork stands where its strike number puts it; before the lift past the kopje it stays dark like the periodic bolt
        const kAt = kBolt.object.position.copy(kSite(kBolt.strike)), ke = forks ? kBolt.flash || 0 : 0;
        if (!forks) { kBolt.uniforms.uFlash.value = 0; kBolt.glow.uniforms.uIntensity.value = 0; }
        const fb = Math.max(sky.flash || 0, forks ? (bolt.flash || 0) * 0.9 : 0), fl = Math.max(fb, ke), flL = Math.max(fb * 0.3, ke * 0.22);   // the cloud takes the whole flash, the land a lift that keeps its gold
        // eased for the land (0.1 s up, 0.3 s down); while the clock stands still (dt = 0) there is nothing to ease over and the value is taken as it is
        landFl = dt > 0 ? (flL > landFl ? Math.min(flL, landFl + dt * 10) : Math.max(flL, landFl - dt * 3.3)) : flL;
        sky.flash = landFl; gFlash.value = landFl;
        rig.update(dt, t, camera); wall.update(camera);
        land.update(dt, t); ridges.update(dt, t, camera);
        trees.update(dt, t, camera); grass.update(dt, t, camera); ringGrass.update(dt, t, camera); farGrass.update(dt, t, camera); exitGrass.update(dt, t, camera); midGrass.update(dt, t, camera); beyond.update(dt, t, camera);
        // the grass beyond the portal has sunk away entirely (fade end 500 m) while the camera is this far back: not drawn then
        tmp.setFromMatrixPosition(camera.matrixWorld); beyond.object.visible = tmp.z < 322; exitGrass.object.visible = tmp.z < 440;
        fauna.update(dt, t, camera, u);
        if (lake) lake.update(dt, t, camera);
        moveDust(eDust, herd, t, u, eDir); moveDust(fDust, farHerd, t, u, fDir);
        if (!forks) { bolt.bolt.visible = false; if (bolt.glow && bolt.glow.object) bolt.glow.object.visible = false; if (bolt.light) bolt.light.intensity = 0; }
        hero.setFlash(landFl * 2.0, flashDir);
        // the glow inside the wall sits behind the fork while one is striking, otherwise it wanders with the sheet lightning
        const wu = wall.uniforms; wu.uTime.value = t; wu.uFlash.value = fl;
        if (ke > 0.02) { tmp.setFromMatrixPosition(camera.matrixWorld); wu.uFlashAz.value = Math.atan2(kAt.x - tmp.x, -(kAt.z - tmp.z)); }
        else if (forks && (bolt.flash || 0) > 0.02) { const bp = bolt.object.position; tmp.setFromMatrixPosition(camera.matrixWorld); wu.uFlashAz.value = Math.atan2(bp.x - tmp.x, -(bp.z - tmp.z)); }
        else wu.uFlashAz.value = Math.sin(Math.floor(t * 0.38) * 91.7) * 0.85;
        hero.setProgress(u); hero.update(dt, t, camera);
        hero.uniforms.uRainbow.value = RB * (0.04 + 0.96 * smoothstep(0.42, 0.62, u));     // the bow is the reveal at 0.6, not part of the entry
        const bu = burst.uniforms; bu.uTime.value = t; bu.uFlash.value = landFl; bu.uBurst.value = clamp((u - 0.69) / 0.26, 0, 1);
      },
      dispose() { sky.dispose(); hero.dispose(); for (const g of nearVar.concat(farVar, kopVar)) g.dispose(); },
    };
  },
};
