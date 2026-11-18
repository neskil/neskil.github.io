// The Line Along the River of Stars: a night flight along the bank of the Milky Way, which here is a real river of
// clear glowing water over a bed of burning sand. A small old train with yellow windows (the hero,
// src/parts/line-along-the-river-of-stars.js) runs on a single track beside it, through silver pampas grass and gentians,
// past glowing surveyors' pyramids, an island with a white cross, a station with a great clock where herons come down
// like snow, an observatory with two circling spheres, a red fire on the far bank, and at the end a hole in the river
// of heaven: the track runs out over the dark on a bridge of light and the portal stands where the rails end.
//
// Everything is laid out in river coordinates: s = metres downstream, d = metres from the near water's edge toward the
// train's bank (the river is d < 0). World x = side * (d + meander(s)), z = -s; `side` mirrors the whole world by seed.
// There is no sun or moon and no three.js light: every shader takes its light from worldLight() below: the river from
// one side, the train's windows, the spheres, the fire, the cross.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as T from '../kit/terrain.js';
import { buildHero, makeG, litMaterial, makeShared, makeSignposts, makeCross, trackGeometry, CROSS_GLSL, lin, mulc, mixc, CAR } from '../parts/line-along-the-river-of-stars.js';

const TAU = Math.PI * 2;
const RAIL = 3.0, TRACK_D = 30;                                   // rail top height, the track's distance from the water's edge
const S_BACK = -260, S_ISLE = 262, S_ST = 392, S_OB = 700, S_FIRE = 840, S_X2 = 884, S_RIM = 950, S_END = S_RIM + 80, S_STRAIGHT = 900;
// the hole: a round well in the river of heaven. In river coordinates its centre lies 60 m riverward of the track and its lip
// crosses the track's line at S_RIM; the river widens into a basin round it and pours over its near and left rim.
const WELL_R = 190, WELL_D = TRACK_D - 60, WELL_S = S_RIM + Math.sqrt(WELL_R * WELL_R - 60 * 60), BASIN = 260;

// ---------------------------------------------------------------- GLSL shared by ground, grass, flowers, river
const FRAME_GLSL = /* glsl */`
uniform float uTime, uSide, uMA, uMK, uMP, uMS, uW0, uW1, uWK, uWP, uBright, uRimS, uBasin; uniform vec3 uWell;
float meander(float s){ float sm = min(s, uMS); return uMA * sin(sm * uMK + uMP) + uMA * uMK * cos(uMS * uMK + uMP) * max(s - uMS, 0.); }
float riverD(vec2 xz){ return uSide * xz.x - meander(-xz.y); }
float riverW(float s){ return uW0 + uW1 * sin(s * uWK + uWP) + uBasin * smoothstep(uRimS - 110., uRimS + 150., s); }
float shoreOff(float s){ return 2.4 * sin(s * .067 + 1.3) + 1.4 * sin(s * .171 + 4.); }
float wellOver(float s, float d){ return uWell.z - length(vec2(d - uWell.x, s - uWell.y)); }
float gust(vec2 p, float t){
  vec2 q = vec2(p.x * uSide, p.y) * .021 + vec2(.07, .19) * t;
  float a = sin(q.x * 2.9 + 1.5 * sin(q.y * 2.1 + t * .23)), b = sin(dot(q, vec2(1.3, 2.7)) * 1.7 + 1.9);
  return clamp(.5 + .36 * a + .22 * a * b, 0., 1.2);
}`;
const LIGHT_GLSL = /* glsl */`
uniform vec3 uRiverCol, uTrA, uTrB, uTrCol; uniform vec4 uSphA, uSphB, uObs, uFire, uCrossL, uCross2L, uStation;
// the warm light of the train's windows on whatever lies beside it
float trainSpill(vec3 p){
  vec3 ab = uTrB - uTrA, ap = p - uTrA; float t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0., 1.); vec3 q = ap - ab * t; q.y *= .4;
  return clamp(1.1 / (1. + dot(q, q) * .007), 0., .8);
}
// the coloured lights of the place: every stretch has its own
vec3 localLight(vec3 p){
  vec3 L = vec3(0.);
  // the observatory: under each sphere a pool of its colour; further out the sapphire lights one side of the land and the
  // topaz the other, turning with them, green where the two cross
  vec2 da = p.xz - uSphA.xy, db = p.xz - uSphB.xy, dc0 = p.xz - uObs.xy; float dl = length(dc0);
  float a = exp(-dot(da, da) / (uSphA.z * uSphA.z)), b = exp(-dot(db, db) / (uSphB.z * uSphB.z));
  float ca = dot(dc0, uSphA.xy - uObs.xy) / max(dl * max(length(uSphA.xy - uObs.xy), 1e-3), 1e-3);
  float fall = exp(-dl / uObs.z) * smoothstep(6., 34., dl) * uObs.w;
  a += smoothstep(-.25, .35, ca) * fall; b += smoothstep(-.25, .35, -ca) * fall;
  L += (vec3(.06, .36, 1.) * a + vec3(1., .6, .08) * b) * uSphA.w + vec3(.05, 1., .3) * min(a, b) * 2.2 * uSphA.w;
  vec2 df = (p.xz - uFire.xy) / uFire.z; L += vec3(1., .1, .06) * uFire.w / (1. + dot(df, df));
  vec2 dc = (p.xz - uCrossL.xy) / uCrossL.z; L += vec3(1., .95, .8) * uCrossL.w / (1. + dot(dc, dc) * dot(dc, dc));
  vec2 d2 = (p.xz - uCross2L.xy) / uCross2L.z; L += vec3(.55, .6, 1.) * uCross2L.w / (1. + dot(d2, d2) * dot(d2, d2));
  vec2 dt = (p.xz - uStation.xy) / uStation.z; L += vec3(1., .66, .3) * uStation.w * exp(-dot(dt, dt));
  L += uTrCol * trainSpill(p) * (1. - smoothstep(uTrA.y - 2., uTrA.y - 1.1, p.y)) * 1.1;    // on the ballast and the platform under the windows
  return L;
}
vec3 worldLight(vec3 p){
  float s = -p.z, d = riverD(p.xz), wr = riverW(s);
  float dw = max(d > -wr * .5 ? d - shoreOff(s) : -(d + wr), 0.);
  vec3 L = uRiverCol * uBright * (.2 + .8 * exp(-dw / 95.));
  L = mix(L, uTrCol * 1.45, trainSpill(p));
  L += localLight(p) - uTrCol * trainSpill(p) * (1. - smoothstep(uTrA.y - 2., uTrA.y - 1.1, p.y)) * 1.1;
  L *= 1. - .35 * smoothstep(-20., 6., wellOver(s, d));
  return L;
}`;
const SPARK_GLSL = /* glsl */`
float spark(vec2 p, float sc, float rad, float t, out float hsh){
  vec2 q = p * sc, id = floor(q), f = fract(q) - .5; float h = hash12(id); hsh = h;
  vec2 o = (vec2(hash12(id + 7.1), hash12(id + 13.7)) - .5) * .56; float r = length(f - o);
  float tw = .5 + .5 * sin(t * (1.2 + 4. * h) + h * 50.);
  return step(.5, h) * (1. - smoothstep(rad * .25, rad, r)) * tw * tw;
}`;
const FOG_GLSL = /* glsl */`
uniform vec3 uFogCol; uniform float uFogDen;
vec3 applyFog(vec3 c, vec3 w){ float d = length(cameraPosition - w); return mix(c, uFogCol, clamp(1. - exp(-d * d * uFogDen * uFogDen), 0., 1.)); }`;

export default {
  id: 'line-along-the-river-of-stars',
  name: 'The Line Along the River of Stars',
  category: 'books',
  placeKind: 'sky',
  book: 'Night on the Galactic Railroad',
  author: 'Kenji Miyazawa, 1896 to 1933',
  media: ['air', 'rail', 'space'],
  weirdness: 0.65,
  async build(ctx) {
    const { rng, noise } = ctx;
    const scene = new THREE.Scene(), ups = [];                         // ups: things that only need their update called
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), mood = vary.mood ?? 0.5, rare = !!vary.rare;
    const lush = lerp(0.82, 1.12, (density - 0.7) / 0.6);                // density, as a multiplier for everything that is counted

    // ------------------------------------------------------------ what this visit is like
    // every stream of chance is taken here, once, in one list, before anything is built (the order of this list is the deal)
    const fk = {};
    for (const name of ['vary', 'sky', 'ridges', 'posts', 'grass', 'gentianGeo', 'gentians', 'crystals', 'spray', 'dust', 'smoke', 'herons', 'geese', 'flies', 'shoot', 'impacts',
      'postsFar', 'wayside', 'grassField', 'grassFar', 'isleCrystals', 'dolphins', 'well', 'fireSparks', 'cloudRing', 'headland', 'spheres', 'walkers']) fk[name] = rng.fork(name);
    const rv = fk.vary;
    const side = rv.chance(0.5) ? 1 : -1;                           // which bank the train runs on
    const MA = rv.range(20, 34), ML = rv.range(900, 1250), MK = TAU / ML, MP = rv.range(0, TAU);
    const W0 = rv.range(172, 190), W1 = rv.range(10, 20), WK = TAU / rv.range(500, 800), WP = rv.range(0, TAU);
    const bright = lerp(0.85, 1.2, mood);                             // how bright the river runs
    const leadFirst = rv.chance(0.5);                               // a fast night (the train runs in at 28 m/s, nearer ahead of us at the start) or a slow one (25 m/s, further ahead)
    const postMix = rv.pick([[0.5, 0.25, 0.25], [0.3, 0.45, 0.25], [0.3, 0.25, 0.45], [0.34, 0.33, 0.33]]);
    const nHerons = Math.round(rv.range(230, 380) * lush * (detail < 1 ? 0.7 : 1));
    const skyTint = rv.pick(['indigo', 'violet', 'indigo']);

    const mRaw = (s) => { const sm = Math.min(s, S_STRAIGHT); return MA * Math.sin(sm * MK + MP) + MA * MK * Math.cos(S_STRAIGHT * MK + MP) * Math.max(s - S_STRAIGHT, 0); };
    const mAt = mRaw, mSlope = (s) => (mRaw(s + 0.5) - mRaw(s - 0.5));
    const Wr = (s) => W0 + W1 * Math.sin(s * WK + WP) + BASIN * smoothstep(S_RIM - 110, S_RIM + 150, s);
    const shoreOff = (s) => 2.4 * Math.sin(s * 0.067 + 1.3) + 1.4 * Math.sin(s * 0.171 + 4.0);
    const wellOver = (s, d) => WELL_R - Math.hypot(d - WELL_D, s - WELL_S);       // metres inside the well's lip (negative outside)
    const X = (s, d) => side * (d + mAt(s)), Z = (s) => -s;
    const V3 = (s, d, y) => new THREE.Vector3(X(s, d), y, Z(s));
    const toSD = (x, z) => { const s = -z; return [s, side * x - mAt(s)]; };
    // yaw that turns an object's local +Z toward the river (decreasing d) at s; its local +X then lies along the line
    const faceRiver = (s) => Math.atan2(-side, -mSlope(s));
    const trackFrame = (s) => { const sl = side * mSlope(s), l = Math.hypot(sl, 1); return { x: X(s, TRACK_D), y: RAIL, z: -s, tx: sl / l, tz: -1 / l }; };

    // the beach: narrow everywhere, a wide shore of crystal sand by the station
    const beachW = (s) => 6 + 3 * noise.n2(s * 0.011, 3.3) + 17 * Math.exp(-(((s - (S_ST + 46)) / 85) ** 2));
    const fieldY = (s, d) => 1.3 + 0.55 * noise.n2(s * 0.012, d * 0.016) + 0.25 * noise.n2(s * 0.05 + 9, d * 0.05);
    const groundY = (s, d) => {
      const wr = Wr(s); let y, sand;
      if (d > -wr * 0.5) {
        const dn = d - shoreOff(s), bw = beachW(s);
        y = -2.4 + 2.4 * smoothstep(-15, 0, dn) + 0.75 * smoothstep(0, bw, dn);
        const fk = smoothstep(bw - 1, bw + 7, dn); y = lerp(y, fieldY(s, d), fk); sand = 1 - smoothstep(bw - 2.5, bw + 2.5, dn);
        const e = Math.abs(d - TRACK_D); y = lerp(y, RAIL - 1.02, 1 - smoothstep(3.3, 7.5, e));
        y += 26 * smoothstep(230, 640, d) * (0.6 + 0.4 * noise.n2(s * 0.004, d * 0.004));
      } else {
        const df = -(d + wr), bw = 7 + 3 * noise.n2(s * 0.013, 8.1);
        y = -2.4 + 2.4 * smoothstep(-15, 0, df) + 0.8 * smoothstep(0, bw, df);
        const fk = smoothstep(bw - 1, bw + 8, df); y = lerp(y, 1.5 + 0.7 * noise.n2(s * 0.011, d * 0.014) + 30 * smoothstep(120, 620, df) * (0.6 + 0.4 * noise.n2(s * 0.004 + 4, d * 0.004)), fk); sand = 1 - smoothstep(bw - 2.5, bw + 2.5, df);
      }
      return [y, sand];
    };

    // ------------------------------------------------------------ shared uniforms
    const keyDir = new THREE.Vector3(-side, 0.34, 0.12).normalize();
    const shared = makeShared({ keyDir, keyCol: [0.6, 0.7, 1.0], skyCol: [0.2, 0.17, 0.44], gndCol: [0.1, 0.11, 0.22], fogCol: [0.045, 0.04, 0.13], fogDen: 0.0012 });
    shared.uKeyCol.value.multiplyScalar(bright);
    const U = {
      uTime: shared.uTime, uSide: { value: side }, uMA: { value: MA }, uMK: { value: MK }, uMP: { value: MP }, uMS: { value: S_STRAIGHT },
      uW0: { value: W0 }, uW1: { value: W1 }, uWK: { value: WK }, uWP: { value: WP }, uBright: { value: bright }, uRimS: { value: S_RIM }, uBasin: { value: BASIN }, uWell: { value: new THREE.Vector3(WELL_D, WELL_S, WELL_R) },
      uRiverCol: { value: new THREE.Color().setRGB(0.5, 0.6, 0.92) }, uTrA: { value: new THREE.Vector3() }, uTrB: { value: new THREE.Vector3(0, 0, 1) }, uTrCol: { value: new THREE.Color().setRGB(1.0, 0.55, 0.17) },
      uSphA: { value: new THREE.Vector4(0, 1e5, 16, 0) }, uSphB: { value: new THREE.Vector4(0, 1e5, 16, 0) }, uObs: { value: new THREE.Vector4(0, 1e5, 150, 0) }, uFire: { value: new THREE.Vector4(0, 1e5, 60, 0) },
      uCross2L: { value: new THREE.Vector4(0, 1e5, 40, 0) },
      uCrossL: { value: new THREE.Vector4(0, 1e5, 40, 0) }, uStation: { value: new THREE.Vector4(0, 1e5, 30, 0) },
      uFogCol: shared.uFogCol, uFogDen: shared.uFogDen,
    };

    const hero = await buildHero(ctx, { world: true, shared, lampSide: side, rng: fk.dust, light: { glsl: FRAME_GLSL + LIGHT_GLSL, uniforms: U } });
    await ctx.yield();

    // ------------------------------------------------------------ sky: indigo and violet, close and full of stars; the Milky Way is on the ground
    const SK = skyTint === 'violet'
      ? { zenith: '#0f0a38', mid: '#20155a', horizon: '#402a84' } : { zenith: '#090e38', mid: '#151a60', horizon: '#33308a' };
    await ctx.yield();
    const sky = makeSky({
      rng: fk.sky, preset: 'night', ...SK, ground: '#05040f', horizonPow: 2.6, bodies: [], key: 'sun', sunElevation: -30,
      stars: 1.5, starDensity: 1, twinkle: 0.5, starColor: 0.8, milkyWay: 0, nebula: 0.48, nebulaColors: ['#3a2a9a', '#6a3fd1', '#1b4fd0'], nebulaScale: 1.3, nebulaCoverage: 0.55,
      clouds: false, clouds2: false, bake: true, renderer: ctx.renderer, quality: 0.5,
    });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(shared.uFogCol.value.clone(), 0.0012);
    await ctx.yield();

    // ------------------------------------------------------------ the land: two strips (the train's bank, the far bank), one shader
    const groundMat = new THREE.ShaderMaterial({
      uniforms: { ...U },
      vertexShader: /* glsl */`attribute float aSand; varying vec3 vW; varying vec3 vN; varying float vSand;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vSand = aSand; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: fx.GLSL_NOISE + FRAME_GLSL + LIGHT_GLSL + SPARK_GLSL + FOG_GLSL + /* glsl */`
        varying vec3 vW; varying vec3 vN; varying float vSand;
        void main(){
          vec3 n = normalize(vN); if (n.y < 0.) n = -n;
          vec2 p = vW.xz; float dist = length(cameraPosition - vW);
          vec3 L = worldLight(vW) * (.72 + .28 * n.y);
          float g = gust(p, uTime), clump = fbm(p * .11), fine = fbm(p * vec2(1.9, 2.3) + clump * 2.);
          float near = 1. - smoothstep(30., 140., dist);
          float tex = mix(clump * .7 + .15, fine * .65 + clump * .45, near);
          vec3 field = mix(vec3(.028, .038, .1), vec3(.2, .25, .4), smoothstep(.28, .8, tex));
          field += vec3(.24, .29, .42) * g * g * smoothstep(.3, .65, clump) * .4;
          field = mix(field, vec3(.2, .11, .5), .35 * smoothstep(.62, .78, fbm(p * .035 + 7.)) * (1. - near * .6));
          float sd = clamp(vSand, 0., 1.);
          float rip = sin(dot(p, vec2(.8, 2.6)) + 2.5 * fbm(p * .22)) * .5 + .5;
          vec3 sand = vec3(.082, .09, .17) * (.6 + .5 * fbm(p * .6) + .38 * rip * near);
          float h1, h2, h3;
          float s1 = spark(p, 7., .2, uTime, h1) * (1. - smoothstep(10., 34., dist));
          float s2 = spark(p + 3.3, 2.2, .16, uTime, h2) * smoothstep(12., 26., dist) * (1. - smoothstep(60., 130., dist));
          float s3 = spark(p + 9.1, .6, .12, uTime, h3) * smoothstep(80., 130., dist) * (1. - smoothstep(200., 440., dist));
          vec3 fire = mix(vec3(.8, .9, 1.), vec3(1., .6, .28), step(.82, h1 + h2 * .3)) * (s1 * 2.4 + s2 * 2.2 + s3 * 1.8) + vec3(.05, .06, .1) * smoothstep(20., 200., dist);
          vec3 col = mix(field, sand, sd) * L + fire * sd * (.3 + .7 * uBright);
          float s = -vW.z, over = wellOver(s, riverD(p));
          if (over > 0.) discard;
          col += vec3(.07, .12, .34) * smoothstep(-5., 0., over);
          col = applyFog(col, vW);
          col *= 1. - smoothstep(uWell.y + 40., uWell.y + 250., s);
          gl_FragColor = vec4(col, 1.);
        }`,
      side: THREE.DoubleSide,
    });
    const makeStrip = async (ss, cols, at, every = 0) => {
      const nr = cols.length, pos = new Float32Array(ss.length * nr * 3), sand = new Float32Array(ss.length * nr), idx = [];
      for (let i = 0; i < ss.length; i++) {
        for (let j = 0; j < nr; j++) { const q = at(ss[i], cols[j]), k = i * nr + j; pos[k * 3] = q[0]; pos[k * 3 + 1] = q[1]; pos[k * 3 + 2] = q[2]; sand[k] = q[3]; }
        if (every && i % every === every - 1) await ctx.yield();
      }
      for (let i = 0; i < ss.length - 1; i++) for (let j = 0; j < nr - 1; j++) { const a = i * nr + j, b = a + nr; idx.push(a, b, b + 1, a, b + 1, a + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSand', new THREE.BufferAttribute(sand, 1)); g.setIndex(idx);
      if (every) await ctx.yield();
      // vertex normals as computeVertexNormals makes them (face normals summed, then normalised), on the plain arrays
      const nor = new Float32Array(pos.length);
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
      }
      for (let k = 0; k < nor.length; k += 3) { const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1; nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l; }
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      return g;
    };
    const ssG = []; for (let s = S_BACK; s <= WELL_S + WELL_R + 70; s += 5) ssG.push(s);
    const colsNear = [-17, -11, -6, -3, -1, 0.5, 2, 4, 6.5, 9, 12, 15, 18, 21, 23.2, 25, 26.6, 27.6, 32.4, 33.4, 35, 36.8, 39, 42, 46, 52, 60, 72, 88, 110, 140, 180, 230, 300, 390, 500, 640];
    const colsFar = [-17, -10, -5, -2, 0, 2, 4.5, 8, 12, 17, 24, 34, 48, 66, 90, 120, 160, 210, 280, 370, 480, 620];
    const landNear = new THREE.Mesh(await makeStrip(ssG, colsNear, (s, d) => { const q = groundY(s, d); return [X(s, d), q[0], Z(s), q[1]]; }, 16), groundMat);
    await ctx.yield();
    const landFar = new THREE.Mesh(await makeStrip(ssG, colsFar, (s, o) => { const d = -Wr(s) - o, q = groundY(s, d); return [X(s, d), q[0], Z(s), q[1]]; }, 24), groundMat);
    landNear.frustumCulled = false; landFar.frustumCulled = false; scene.add(landNear, landFar);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: fk.ridges, layers: 3, radius: [1500, 3000], height: [70, 240], base: -30, colorNear: '#0d0b2c', haze: '#2a2166', sunDir: [keyDir.x, 0.3, keyDir.z], sunColor: '#8fa0ff', sunIntensity: 0.35, snow: null, rim: 0.3 });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ the flight
    const P = (s, d, y) => [X(s, d), y, Z(s)];
    const ISLE_D = -78, X2_D = -72;
    const path = makePath([
      P(0, 17, 5.4), P(55, 16.5, 5.0), P(115, 13, 4.9),
      // out over the river and close past the island of the white cross, on its bank side
      P(165, -6, 5.6), P(215, -30, 5.4), P(S_ISLE - 6, ISLE_D + 36, 4.8), P(S_ISLE + 44, -34, 5.4), P(S_ISLE + 84, -12, 5.6),
      // in low over the crystal shore beside the platform, the train drawing up on our right
      P(S_ST - 22, 13, 4.3), P(S_ST + 20, 15.5, 4.2), P(S_ST + 62, 14, 4.4),
      // back along the line at the train's side
      P(S_ST + 108, 13.5, 4.6), P(S_ST + 160, 19.5, 5.0), P(S_OB - 100, 22, 5.3), P(S_OB - 60, 12, 5.6),
      // out over the water: the route leaves the bank some 60 m of river before the observatory and passes it out over the river, toward the
      // red road of the fire, then round to the second cross
      P(S_OB - 18, -8, 6.4), P(S_OB + 25, -36, 7.2), P(S_FIRE - 70, -74, 7.0), P(S_FIRE - 28, -92, 6.4), P(S_X2 - 34, X2_D - 2, 6.0), P(S_X2 + 1, X2_D + 32, 6.4),
      // and back to the bank where the rails run out over the well
      P(S_RIM - 28, -8, 7.2), P(S_RIM, 16, 7.6), P(S_RIM + 20, TRACK_D, RAIL + 4.8), P(S_RIM + 50, TRACK_D, RAIL + 4.8), P(S_END, TRACK_D, RAIL + 4.8),
    ]);
    // the route at every metre flown, in river coordinates (s, d) and height: every clearance test and every window along the
    // flight is taken from this table (nothing is placed by it: things stand by rules of the river, the bank and the line)
    const RL = path.length, RN = Math.ceil(RL), rS = new Float32Array(RN + 1), rD = new Float32Array(RN + 1), rX = new Float32Array(RN + 1), rY = new Float32Array(RN + 1), rZ = new Float32Array(RN + 1), _pv = new THREE.Vector3();
    for (let i = 0; i <= RN; i++) { path.posAtDist(Math.min(i, RL), _pv); const sd = toSD(_pv.x, _pv.z); rS[i] = sd[0]; rD[i] = sd[1]; rX[i] = _pv.x; rY[i] = _pv.y; rZ[i] = _pv.z; }
    const idxAtS = (s) => { let a = 0, b = RN; while (b - a > 1) { const m = (a + b) >> 1; if (rS[m] <= s) a = m; else b = m; } return a; };
    const mAtS = (s) => { const i = idxAtS(s), f = clamp((s - rS[i]) / Math.max(rS[i + 1] - rS[i], 1e-4), 0, 1); return Math.min(i + f, RL); };   // metres flown when the camera is level with s
    const uAtS = (s) => clamp(mAtS(s) / RL, 0, 1);
    const camSAt = (u) => { const f = clamp(u, 0, 1) * RL, i = Math.min(Math.floor(f), RN - 1); return lerp(rS[i], rS[i + 1], Math.min(f - i, 1)); };
    // distance in space from a point to the route (the lane round the route is kept with this: height counts)
    const routeDist = (x, y, z) => {
      const i0 = idxAtS(-z); let best = 1e9;
      for (let i = Math.max(i0 - 60, 0); i <= Math.min(i0 + 60, RN); i++) { const dx = rX[i] - x, dy = rY[i] - y, dz = rZ[i] - z, q = dx * dx + dy * dy + dz * dz; if (q < best) best = q; }
      return Math.sqrt(best);
    };

    await ctx.yield();
    // ------------------------------------------------------------ signposts: surveyors' pyramids of light, near and far, on both banks
    const sr = fk.posts, postCols = ['#7fe7ff', '#ffb057', '#9dff9a'].map(lin), posts = [];
    const pickCol = (rg = sr) => { const r = rg(); return postCols[r < postMix[0] ? 0 : r < postMix[0] + postMix[1] ? 1 : 2]; };
    const postOK = (s, d, size) => {
      if (Math.abs(d - TRACK_D) < 5 + size || wellOver(s, d) > -14) return false;
      if (Math.abs(s - S_ST) < 48 && d > 4 && d < 48) return false;
      if (Math.hypot(s - S_OB, d - 66) < 30) return false;
      const x = X(s, d), z = Z(s); return path.nearestXZ(x, z).dist > 7 + size * 1.3;
    };
    for (let i = 0, tries = 0; i < 150 && tries < 3000; tries++) {       // the train's bank: near ones small, far ones tall
      const s = sr.range(S_BACK + 40, S_RIM - 5), t = Math.pow(sr(), 1.7), d = 9 + t * 430, size = sr.range(2.0, 3.6) + t * sr.range(6, 22), q = groundY(s, d);
      if (q[1] > 0.4 || !postOK(s, d, size)) continue;
      posts.push({ x: X(s, d), y: q[0] - 0.05, z: Z(s), size, color: pickCol(), yaw: sr.range(0, TAU), seed: sr() }); i++;
    }
    await ctx.yield();
    for (let i = 0, tries = 0, fr2 = fk.postsFar; i < 70 && tries < 2000; tries++) {        // the far bank
      const s = fr2.range(S_BACK + 40, S_RIM + 10), t = Math.pow(fr2(), 1.3), o = 12 + t * 420, d = -Wr(s) - o, size = fr2.range(5, 9) + t * fr2.range(8, 26), q = groundY(s, d);
      if (wellOver(s, d) > -14 || Math.hypot(s - S_FIRE, o - 45) < 60) continue;
      posts.push({ x: X(s, d), y: q[0] - 0.05, z: Z(s), size, color: pickCol(fr2), yaw: fr2.range(0, TAU), seed: fr2() }); i++;
    }
    // a string of small ones along the near water's edge, one at every 34 to 58 m of river: standing in the shallows, or on the sand
    for (let s = fk.wayside.range(12, 40), wr = fk.wayside; s < S_RIM - 30; s += wr.range(34, 58)) {
      const sgn = wr.chance(0.5) ? 1 : -1, out = wr.range(2, 9), up = wr.range(2, 9), size = wr.range(2.3, 3.7), col = pickCol(wr), yaw = wr.range(0, TAU), seed = wr();
      for (const k of [sgn, -sgn]) {                                    // the drawn side of the water's edge, or the other one if that spot is taken
        const d = shoreOff(s) + (k > 0 ? up : -out), q = groundY(s, d);
        if (q[0] < -1.7 || !postOK(s, d, size)) continue;
        posts.push({ x: X(s, d), y: Math.max(q[0], 0.02) - 0.05, z: Z(s), size, color: col, yaw, seed }); break;
      }
    }
    for (let i = 0, hp = fk.headland; i < 18; i++) {                     // and on the headland that runs on beside the well
      const s = hp.range(S_RIM - 10, WELL_S + 130), d = hp.range(TRACK_D + 12, WELL_D + WELL_R + 260), size = hp.range(3, 11), col = pickCol(hp), yaw = hp.range(0, TAU), seed = hp();
      if (wellOver(s, d) > -16) continue;
      posts.push({ x: X(s, d), y: groundY(s, d)[0] - 0.05, z: Z(s), size, color: col, yaw, seed });
    }
    await ctx.yield();
    const signposts = makeSignposts(shared, posts);
    scene.add(signposts.object);
    await ctx.yield();

    // ------------------------------------------------------------ silver pampas grass bowing in waves, and gentians
    // where the camera's line lies in river coordinates, by s (only for the lane kept clear under it)
    const pathDAt = (s) => { if (s <= rS[0]) return rD[0]; if (s >= rS[RN]) return TRACK_D; const m = mAtS(s), i = Math.min(Math.floor(m), RN - 1); return lerp(rD[i], rD[i + 1], m - i); };
    const pathYAt = (s) => { if (s <= rS[0]) return rY[0]; if (s >= rS[RN]) return RAIL + 4.8; const m = mAtS(s), i = Math.min(Math.floor(m), RN - 1); return lerp(rY[i], rY[i + 1], m - i); };
    const built = (s, d, m = 0) => (Math.abs(d - TRACK_D) < 3.7 + m) || (Math.abs(s - S_ST) < 37 + m && d > TRACK_D - 8.6 - m && d < TRACK_D + 11.4 + m) || Math.hypot(s - S_OB, d - 66) < 17 + m || wellOver(s, d) > -3 - m;
    const gentianPatch = (s, d) => Math.max(smoothstep(0.15, 0.55, noise.n2(s * 0.03 + 40, d * 0.045)), 0.9 * (1 - smoothstep(60, 150, s)) * (1 - smoothstep(4, 9, Math.abs(d - TRACK_D * 0.5))));

    const stalkGeo = (r, nStalk, nBlade) => {
      const P = [], A = [], idx = [];
      const ribbon = (az, lean, hgt, pts) => {                         // pts: [t, halfWidth, plume]
        const ca = Math.cos(az), sa = Math.sin(az), base = P.length / 3, tw = r.range(-0.9, 0.9);
        const wx = -Math.sin(az + tw), wz = Math.cos(az + tw);
        for (const [t, hw, pl] of pts) {
          const out = lean * Math.pow(t, 2.4) * hgt, y = hgt * (t - 0.3 * Math.pow(t, 3) * Math.abs(lean));
          if (hw > 0) { P.push(ca * out - wx * hw, y, sa * out - wz * hw, ca * out + wx * hw, y, sa * out + wz * hw); A.push(t * hgt / 2, pl, -1, t * hgt / 2, pl, 1); }
          else { P.push(ca * out, y, sa * out); A.push(t * hgt / 2, pl, 0); }
        }
        let k = base;
        for (let i = 0; i < pts.length - 1; i++) { if (pts[i + 1][1] > 0) { idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); k += 2; } else idx.push(k, k + 1, k + 2); }
      };
      for (let i = 0; i < nStalk; i++) {
        // a thin stem, then the tassel: a fan that the fragment shader cuts into fine drooping strands
        const az = i / nStalk * TAU + r.range(-0.5, 0.5), hgt = r.range(1.5, 2.3), fw = r.range(0.2, 0.33);
        ribbon(az, r.range(0.25, 0.75), hgt, [[0, 0.013, 0], [0.36, 0.011, 0], [0.5, 0.014, 1], [0.68, fw * 0.8, 1.4], [0.86, fw, 1.75], [1, fw * 0.55, 2]]);
      }
      for (let i = 0; i < nBlade; i++) ribbon(r.range(0, TAU), r.range(0.7, 1.3), r.range(0.6, 1.15), [[0, 0.02, 0], [1, 0, 0]]);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(idx);
      return g;
    };
    const plantVert = (body) => /* glsl */`
      attribute vec3 aP; attribute vec4 aRand; ${body.pars || ''}
      uniform vec2 uFade;
      varying vec3 vW; varying vec3 vL; varying vec3 vA; varying float vG;
      void main(){
        vec4 base = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
        float sc = length(instanceMatrix[1].xyz), cd = distance(cameraPosition, base.xyz);
        float fade = 1. - smoothstep(uFade.x, uFade.y, cd);
        vec3 lp = position; ${body.local || ''}
        vec4 w = modelMatrix * instanceMatrix * vec4(lp * fade, 1.);
        float g = gust(base.xz, uTime), h = aP.x;
        float bend = h * h * (.16 + .8 * g) * (.6 + .6 * aRand.z) * ${body.flex || '1.'};
        w.xz += vec2(-.35 * uSide, -.94) * bend * sc + vec2(sin(uTime * 2.7 + aRand.x * 40. + h * 3.), cos(uTime * 2.1 + aRand.x * 23.)) * .05 * h * sc;
        w.y -= bend * bend * .3 * sc;
        float tw = trainSpill(base.xyz);                                // the wind of the passing train lays the plumes over along the line
        w.xz += (vec2(0., -1.) + normalize(base.xz - uTrB.xz + vec2(1e-3)) * .4) * h * h * tw * 1.5 * sc * (.75 + .25 * sin(uTime * 9. + aRand.x * 30.));
        vW = w.xyz; vG = g; vA = aP; vL = worldLight(base.xyz + vec3(0., 1., 0.));
        ${body.vary || ''}
        gl_Position = projectionMatrix * viewMatrix * w;
      }`;
    const grassMat = (fade) => new THREE.ShaderMaterial({
      uniforms: { ...U, uFade: { value: new THREE.Vector2(fade[0], fade[1]) } },
      vertexShader: FRAME_GLSL + LIGHT_GLSL + plantVert({ vary: 'vTint = aRand.y;', pars: 'varying float vTint;' }),
      fragmentShader: FOG_GLSL + /* glsl */`
        varying vec3 vW; varying vec3 vL; varying vec3 vA; varying float vG; varying float vTint;
        void main(){
          float pl = clamp(vA.y, 0., 1.), tt = clamp(vA.y - 1., 0., 1.), e = clamp(vA.z, -1., 1.);
          float far = smoothstep(30., 85., length(cameraPosition - vW));
          float sid = floor(e * 2.5 + 3.5), gq = abs(fract(e * 2.5 + .5) - .5) * 2.;
          float hsh = fract(sin((sid + vTint * 37.) * 12.9898) * 43758.5453);
          float th = mix(1.1, .66 + .2 * sin(tt * 44. + sid * 2.1 + vTint * 20.), smoothstep(0., .28, tt));
          float cut = max(step(mix(th, 1.1, far), gq), step(.7 + .3 * hsh, tt) * (1. - far));
          if (vA.y > 1.02 && cut > .5) discard;
          vec3 blade = vec3(.07, .17, .16) * (.35 + .9 * clamp(vA.x, 0., 1.));
          vec3 plume = vec3(.6, .55, .47) * (.6 + .4 * vTint) * (.5 + .6 * tt) * (1. - .3 * far);
          vec3 col = mix(blade, plume, pl) * vL * (.8 + .7 * vG * pl) + plume * pl * vec3(.03, .035, .06);
          gl_FragColor = vec4(applyFog(col, vW), 1.);
        }`,
      side: THREE.DoubleSide,
    });
    const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
    const chunked = [], templates = new Set();                         // { mesh, s0, s1, reach }; the geometries the chunks were cloned from
    const instanced = (geo, mat, list, s0, s1, reach) => {
      if (!list.length) return null;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length), rand = new Float32Array(list.length * 4);
      for (let i = 0; i < list.length; i++) { const it = list[i]; _m4.compose(_p.set(it.x, it.y, it.z), _q.setFromEuler(_e.set(it.tilt || 0, it.yaw, 0)), _s.set(it.sc, it.sc * (it.sy || 1), it.sc)); mesh.setMatrixAt(i, _m4); rand.set(it.r, i * 4); }
      templates.add(geo); mesh.geometry = geo.clone(); mesh.geometry.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
      mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4;
      scene.add(mesh); chunked.push({ mesh, s0, s1, reach });
      return mesh;
    };
    const gr = fk.grass, CH = 90, nCh = Math.ceil((S_RIM - S_BACK) / CH);
    const nearGeo = stalkGeo(gr, 6, 8), fieldGeo = stalkGeo(gr, 5, 3), matNear = grassMat([125, 172]), matField = grassMat([290, 370]);
    const nearLists = Array.from({ length: nCh }, () => []), fieldLists = Array.from({ length: nCh }, () => []);
    const nNear = Math.round(6200 * lush * detail), nField = Math.round(3600 * lush * detail);
    for (let i = 0, tries = 0; i < nNear && tries < nNear * 6; tries++) {
      const s = gr.range(S_BACK + 150, S_RIM - 2), d = TRACK_D * 0.5 + gr.range(-27, 27) * (0.35 + 0.65 * gr()), q = groundY(s, d);     // thickest midway between the water and the rails
      if (q[1] > 0.25 || built(s, d) || gr() < 0.8 * gentianPatch(s, d)) continue;
      let sc = gr.range(0.85, 1.4); const lat = Math.abs(d - pathDAt(s));
      if (lat < 5) sc = Math.min(sc, (pathYAt(s) - q[0] - 0.9 - 0.25 * lat) / 2.1 + lat * 0.12);
      if (sc < 0.45) continue;
      nearLists[clamp(Math.floor((s - S_BACK) / CH), 0, nCh - 1)].push({ x: X(s, d), y: q[0] - 0.05, z: Z(s), yaw: gr.range(0, TAU), sc, r: [gr(), gr(), gr(), gr()] }); i++;
      if (i % 300 === 0) await ctx.yield();
    }
    for (let i = 0, tries = 0, gf = fk.grassField; i < nField && tries < nField * 6; tries++) {
      const s = gf.range(S_BACK + 40, S_RIM - 2), d = gf.range(4, 150) * (0.4 + 0.6 * gf()), q = groundY(s, d), sc0 = gf.range(1.25, 2.1), yaw = gf.range(0, TAU), r4 = [gf(), gf(), gf(), gf()];
      if (q[1] > 0.25 || built(s, d, 1)) continue;
      const lat = Math.abs(d - pathDAt(s)); let sc = sc0;
      if (lat < 7) sc = Math.min(sc, (pathYAt(s) - q[0] - 0.9 - 0.25 * lat) / 2.1 + lat * 0.12);
      if (sc < 0.5) continue;
      fieldLists[clamp(Math.floor((s - S_BACK) / CH), 0, nCh - 1)].push({ x: X(s, d), y: q[0] - 0.05, z: Z(s), yaw, sc, r: r4 }); i++;
      if (i % 300 === 0) await ctx.yield();
    }
    {
      const fg = fk.grassFar, lists = Array.from({ length: nCh }, () => []), matFar = grassMat([340, 430]), nF = Math.round(1000 * lush * detail);
      for (let i = 0; i < nF; i++) {
        const byFire = fg.chance(0.4), s = byFire ? S_FIRE + fg.range(-120, 120) : fg.range(S_BACK + 150, S_RIM + 40), o = 9 + fg.range(0, 44) * (0.3 + 0.7 * fg()), d = -Wr(s) - o, sc = fg.range(1.6, 2.6), yaw = fg.range(0, TAU), r4 = [fg(), fg(), fg(), fg()], q = groundY(s, d);
        if (q[1] > 0.3 || wellOver(s, d) > -4 || Math.hypot(s - S_FIRE, o - 46) < 13) continue;
        lists[clamp(Math.floor((s - S_BACK) / CH), 0, nCh - 1)].push({ x: X(s, d), y: q[0] - 0.05, z: Z(s), yaw, sc, r: r4 });
      }
      for (let c = 0; c < nCh; c++) instanced(fieldGeo, matFar, lists[c], S_BACK + c * CH, S_BACK + (c + 1) * CH, 430);
      await ctx.yield();
      const hl = fk.headland, list = [], nH = Math.round(520 * lush * detail);
      for (let i = 0; i < nH; i++) {
        const s = hl.range(S_RIM - 30, WELL_S + 90), d = hl.range(TRACK_D + 4, WELL_D + WELL_R + 120), sc = hl.range(1.3, 2.2), yaw = hl.range(0, TAU), r4 = [hl(), hl(), hl(), hl()];
        if (wellOver(s, d) > -3.5 || built(s, d, 1)) continue;
        list.push({ x: X(s, d), y: groundY(s, d)[0] - 0.05, z: Z(s), yaw, sc, r: r4 });
      }
      instanced(fieldGeo, matField, list, S_RIM - 30, WELL_S + 90, 400);
    }
    await ctx.yield();
    for (let c = 0; c < nCh; c++) { instanced(nearGeo, matNear, nearLists[c], S_BACK + c * CH, S_BACK + (c + 1) * CH, 180); instanced(fieldGeo, matField, fieldLists[c], S_BACK + c * CH, S_BACK + (c + 1) * CH, 380); if (c % 2 === 1) await ctx.yield(); }
    await ctx.yield();

    // gentians: purple cups on leafy stems, opening as we come near
    const gentianGeo = (() => {
      const r = fk.gentianGeo, P = [], C = [], A = [], R = [], idx = [];
      const v = (p, c, a, rad = [0, 0, 0]) => { P.push(p[0], p[1], p[2]); C.push(c[0], c[1], c[2], c[3] ?? 0); A.push(a[0], a[1], a[2]); R.push(rad[0], rad[1], rad[2]); return P.length / 3 - 1; };
      const stem = [0.1, 0.22, 0.17], leaf = [0.11, 0.3, 0.22], throat = [0.5, 0.56, 1.0, 1.0], cup = [0.17, 0.065, 0.62, 0.22], tip = [0.1, 0.03, 0.44, 0.1];
      for (let k = 0; k < 3; k++) {
        const az = k / 3 * TAU + r.range(-0.5, 0.5), hgt = r.range(0.42, 0.7), lean = r.range(0.1, 0.28), top = [Math.cos(az) * lean, hgt, Math.sin(az) * lean];
        const sx = -Math.sin(az) * 0.012, sz = Math.cos(az) * 0.012;
        const a = v([-sx, 0, -sz], stem, [0, 0, 0]), b = v([sx, 0, sz], stem, [0, 0, 0]), c = v(top, stem, [hgt, 0, 0]); idx.push(a, b, c);
        for (const t of [0.35, 0.62]) for (const sg of [-1, 1]) {                  // leaves in pairs
          const m = [top[0] * t, hgt * t, top[2] * t], la = az + sg * 1.5, lx = Math.cos(la), lz = Math.sin(la);
          const i0 = v(m, leaf, [hgt * t, 0, 0]), i1 = v([m[0] + lx * 0.09 - sx * 3, m[1] + 0.05, m[2] + lz * 0.09 - sz * 3], leaf, [hgt * t, 0, 0]), i2 = v([m[0] + lx * 0.2, m[1] + 0.1, m[2] + lz * 0.2], leaf, [hgt * t, 0, 0]), i3 = v([m[0] + lx * 0.09 + sx * 3, m[1] + 0.05, m[2] + lz * 0.09 + sz * 3], leaf, [hgt * t, 0, 0]);
          idx.push(i0, i1, i2, i0, i2, i3);
        }
        // the cup: five petals round an axis that leans out with the stem
        const ax = new THREE.Vector3(Math.cos(az) * 0.3, 1, Math.sin(az) * 0.3).normalize(), ux = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az)), uy = new THREE.Vector3().crossVectors(ax, ux);
        const pt = (ang, rad, hh) => [top[0] + ax.x * hh + (ux.x * Math.cos(ang) + uy.x * Math.sin(ang)) * rad, top[1] + ax.y * hh + (ux.y * Math.cos(ang) + uy.y * Math.sin(ang)) * rad, top[2] + ax.z * hh + (ux.z * Math.cos(ang) + uy.z * Math.sin(ang)) * rad];
        const rd = (ang, k2) => [(ux.x * Math.cos(ang) + uy.x * Math.sin(ang)) * k2, (ux.y * Math.cos(ang) + uy.y * Math.sin(ang)) * k2, (ux.z * Math.cos(ang) + uy.z * Math.sin(ang)) * k2];
        const bs = r.range(0.9, 1.2);
        for (let j = 0; j < 5; j++) {
          const a0 = j / 5 * TAU, a1 = (j + 1) / 5 * TAU, am = (a0 + a1) / 2;
          const i0 = v(pt(a0, 0.022 * bs, 0), throat, [hgt, 1, 0]), i1 = v(pt(a1, 0.022 * bs, 0), throat, [hgt, 1, 0]);
          const i2 = v(pt(a1, 0.07 * bs, 0.17 * bs), cup, [hgt, 1, 0.5], rd(a1, 0.03 * bs)), i3 = v(pt(a0, 0.07 * bs, 0.17 * bs), cup, [hgt, 1, 0.5], rd(a0, 0.03 * bs));
          const i4 = v(pt(am, 0.1 * bs, 0.27 * bs), tip, [hgt, 1, 1], rd(am, 0.11 * bs));
          idx.push(i0, i1, i2, i0, i2, i3, i3, i2, i4);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(C, 4)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aRad', new THREE.Float32BufferAttribute(R, 3)); g.setIndex(idx);
      return g;
    })();
    const gentianMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uFade: { value: new THREE.Vector2(110, 150) } },
      vertexShader: FRAME_GLSL + LIGHT_GLSL + plantVert({
        pars: 'attribute vec4 aC; attribute vec3 aRad; varying vec4 vC; varying float vOpen;', flex: '.35',
        local: 'float open = clamp(max(1. - smoothstep(16., 70., cd), .5 + .5 * sin(uTime * .35 + aRand.x * 30.)) * .85 + .15, 0., 1.); lp += aRad * (open * 1.9 - .75);',
        vary: 'vC = aC; vOpen = open;',
      }),
      fragmentShader: FOG_GLSL + /* glsl */`
        varying vec3 vW; varying vec3 vL; varying vec3 vA; varying float vG; varying vec4 vC; varying float vOpen;
        void main(){
          vec3 col = vC.rgb * vL * 1.2 + vC.rgb * vC.a * (.3 + .7 * vOpen) + vC.rgb * vA.y * vec3(.1, .06, .26);
          gl_FragColor = vec4(applyFog(col, vW), 1.);
        }`,
      side: THREE.DoubleSide,
    });
    {
      const fr = fk.gentians, lists = Array.from({ length: nCh }, () => []), nG = Math.round(1900 * lush * detail);
      for (let i = 0, tries = 0; i < nG && tries < nG * 12; tries++) {
        const s = fr.range(-60, S_RIM - 6), d = fr.chance(0.25) ? TRACK_D + fr.pick([-1, 1]) * fr.range(4.6, 7) : TRACK_D * 0.5 + fr.range(-22, 22) * (0.3 + 0.7 * fr()), q = groundY(s, d);
        if (q[1] > 0.5 || built(s, d, 0.2) || fr() > 0.08 + gentianPatch(s, d)) continue;
        lists[clamp(Math.floor((s - S_BACK) / CH), 0, nCh - 1)].push({ x: X(s, d), y: q[0] - 0.03, z: Z(s), yaw: fr.range(0, TAU), sc: fr.range(0.8, 1.3), r: [fr(), fr(), fr(), fr()] }); i++;
      }
      for (let c = 0; c < nCh; c++) instanced(gentianGeo, gentianMat, lists[c], S_BACK + c * CH, S_BACK + (c + 1) * CH, 158);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the river of heaven: clear water of light over a bed of burning sand
    const NPIL = 4, NEDDY = 2;
    const uPil = { value: Array.from({ length: NPIL }, () => new THREE.Vector4(0, 0, 1e6, 1)) }, uPilCol = { value: Array.from({ length: NPIL }, () => new THREE.Vector4(0, 0, 0, 3)) };
    const uEddy = { value: [new THREE.Vector4(ISLE_D, S_ISLE, 27, 1), new THREE.Vector4(X2_D, S_X2, 8, 1)] };       // d, s, radius, strength: the island, the foot of the second cross
    // two rows of warm lamps that the water doubles: the train's windows, the lamps of the platform (a.xyz, b.xyz; colour, half height)
    const uSegA = { value: [new THREE.Vector3(), new THREE.Vector3()] }, uSegB = { value: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1)] };
    const uSegCol = { value: [new THREE.Vector4(1.0, 0.62, 0.22, 0.8), new THREE.Vector4(1.0, 0.66, 0.3, 0.7)] };
    const riverMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uPil, uPilCol, uEddy, uSegA, uSegB, uSegCol },
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: fx.GLSL_NOISE + FRAME_GLSL + SPARK_GLSL + FOG_GLSL + CROSS_GLSL + /* glsl */`
        uniform vec4 uPil[${NPIL}]; uniform vec4 uPilCol[${NPIL}]; uniform vec4 uEddy[${NEDDY}];
        uniform vec3 uSegA[2]; uniform vec3 uSegB[2]; uniform vec4 uSegCol[2];
        varying vec3 vW;
        vec3 hue(float h){ return clamp(abs(fract(h + vec3(0., .333, .667)) * 6. - 3.) - 1., 0., 1.); }
        void main(){
          float s = -vW.z, d = riverD(vW.xz), wr = riverW(s), over = wellOver(s, d);
          if (over > 0.) discard;
          float edge = min(shoreOff(s) - d, d + wr), depth = clamp(edge / 15., 0., 1.), clear = exp(-depth * 2.2);
          vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
          float nearK = 1. - smoothstep(25., 170., dist), flow = uTime * 2.6;
          // the current's own coordinates (across, along): downstream, bending round to the well's lip as it nears it,
          // parting round the island and the foot of the second cross and curling in their lee
          float pull = smoothstep(-170., -6., over), ang = atan(d - uWell.x, uWell.y - s);
          float al = mix(s, uWell.y - uWell.z + over, pull), ac = mix(d, uWell.x + ang * uWell.z, pull);
          for (int i = 0; i < ${NEDDY}; i++) {
            vec4 e = uEddy[i]; float ds = s - e.y, dd = d - e.x, r = e.z;
            float lee = smoothstep(0., r, ds) * exp(-max(ds, 0.) / (r * 6.)) * exp(-dd * dd / (r * r * 1.6));
            ac += e.w * (r * .3 * sin(ds * (2.4 / r) - uTime * 1.4) * lee + dd / sqrt(dd * dd + r * r * .09) * r * .32 * exp(-(dd * dd + ds * ds) / (r * r * 1.1)));
          }
          vec2 fc = vec2(ac, al);
          vec3 n0 = vnoised(fc * vec2(.09, .035) + vec2(0., -flow * .035));
          vec3 n1 = vnoised(fc * vec2(.5, .19) + vec2(0., -flow * .19)), n2 = vnoised(fc * vec2(1.6, .66) + vec2(uTime * .2, -flow * .66));
          vec2 sl = n0.yz * vec2(.09, .035) * 1.6 + n1.yz * vec2(.5, .19) * .24 + n2.yz * vec2(1.6, .66) * .05 * (.3 + .7 * nearK);
          vec3 N = normalize(vec3(-uSide * sl.x, 1., sl.y));
          float ndv = clamp(dot(N, V), 0., 1.), F = .02 + .98 * pow(1. - ndv, 5.);
          // the bed through the clear water: sand in ripple marks, every grain a small fire; plain to see in the shallows
          vec2 bp = vW.xz - V.xz / max(V.y, .22) * (.3 + 2.1 * depth) + N.xz * 1.6;
          vec2 bc = vec2(riverD(bp), -bp.y);
          float rip = .5 + .5 * sin(bc.y * 1.3 + 3. * fbm(bc * .13));
          vec3 sandC = vec3(.15, .16, .27) * (.5 + .55 * fbm(bc * .45) + .3 * rip * nearK), deepC = vec3(.012, .03, .125);
          vec3 bed = mix(deepC, sandC, clear);
          // light rising from the bed in long lanes that drift with the current
          float milk = fbm(fc * vec2(.024, .0058) + vec2(0., -uTime * .012)), lane = fbm(fc * vec2(.05, .011) + vec2(4.3, -uTime * .02));
          float glow = smoothstep(.36, .8, milk) * (1. - .8 * smoothstep(.46, .76, lane));
          float mid = clamp(1. - abs((d + wr * .5) / max(wr * .5, 1.)), 0., 1.);
          bed += vec3(.3, .42, .98) * (.012 + .24 * glow + .03 * mid) * (1. - .55 * clear);
          bed = mix(bed, deepC + vec3(.46, .3, .98) * (.06 + .36 * glow), .45 * smoothstep(.45, .85, lane) * (1. - clear));
          // long gliding streaks of the current
          vec2 sc = vec2(ac + 3.4 * sin(al * .043 + 2.6 * n0.x) + 1.2 * sin(al * .13 + ac * .05), al);
          float st1 = vnoise(sc * vec2(.5, .06) + vec2(0., -flow * .06)), st2 = vnoise(sc * vec2(1.5, .13) + vec2(7., -flow * .13));
          float streak = (pow(clamp(1. - abs(st1 * 2. - 1.), 0., 1.), 6.) * .6 + pow(clamp(1. - abs(st2 * 2. - 1.), 0., 1.), 8.) * .5 * nearK) * smoothstep(.3, .62, n1.x);
          bed += vec3(.45, .58, 1.) * streak * (.05 + .2 * glow + .16 * pull) * (1. - .7 * smoothstep(120., 420., dist));
          // wavelets riding down the current, their crests across it
          float wv = sin(al * .85 + 4. * n0.x + 2.4 * n1.x - flow * 1.1), wv2 = sin(al * 2.3 + ac * .4 + 3. * n1.x - flow * 2.4);
          bed += vec3(.4, .52, 1.) * (pow(clamp(.5 + .5 * wv, 0., 1.), 5.) * .13 * (1. - smoothstep(70., 300., dist)) + pow(clamp(.5 + .5 * wv2, 0., 1.), 6.) * .1 * nearK) * (.35 + .65 * smoothstep(.35, .7, n1.x));
          bed *= 1. + (n1.z * .3 + n2.z * .22 * nearK);
          float h1, h2, h3, h4, h5;
          float g1 = spark(bc, 6., .2, uTime, h1) * (1. - smoothstep(9., 30., dist));
          float g2 = spark(bc + 5.7, 1.9, .16, uTime, h2) * smoothstep(10., 24., dist) * (1. - smoothstep(55., 120., dist));
          float g3 = spark(bc + 1.3, .55, .12, uTime, h3) * smoothstep(70., 120., dist) * (1. - smoothstep(200., 420., dist));
          float g4 = spark(vec2(ac, al - flow), .23, .06, uTime, h4) * (1. - smoothstep(120., 260., dist)), g5 = spark(vec2(ac, al - flow * .6) + 31., .075, .045, uTime, h5) * smoothstep(90., 200., dist);
          vec3 grainCol = mix(vec3(.85, .92, 1.), vec3(1., .5, .2), step(.72, h1 * .5 + h2 * .5));
          vec3 col = bed + grainCol * (g1 * 2.6 + g2 * 2.4 + g3 * 2.) * (.3 + .7 * clear) + vec3(.9, .95, 1.) * (g4 * 3.2 + g5 * 3.) + vec3(.04, .05, .1) * smoothstep(30., 300., dist);
          // waves lapping the sand as light
          float e = max(edge, 0.), lapPh = e * 1.5 + uTime * 1.3 + 2.5 * vnoise(vec2(al * .11, uTime * .1));
          col += vec3(.6, .72, 1.) * (pow(clamp(.5 + .5 * sin(lapPh), 0., 1.), 10.) * exp(-e * .4) * .5 + exp(-e * e * 5.) * .45);
          // what the water mirrors: the sky, the crosses, the fire, the rows of warm lamps
          vec3 R = reflect(-V, N);
          vec3 refl = mix(vec3(.12, .1, .36), vec3(.025, .035, .14), clamp(R.y * 1.6, 0., 1.));
          col = mix(col, refl, F * .8);
          col += vec3(.7, .8, 1.) * smoothstep(.7, .95, n2.x) * smoothstep(.5, .85, n1.x) * .22 * nearK;
          for (int i = 0; i < ${NPIL}; i++) {
            vec4 pl = uPil[i], pc = uPilCol[i];
            vec2 to = pl.xz - vW.xz; float dl = length(to); vec2 hd = to / max(dl, 1e-3);
            float den = dot(R.xz, hd), t = dl / max(den, .04);
            vec3 hit = vW + R * t;
            vec2 q = vec2(dot(hit.xz - pl.xz, vec2(-hd.y, hd.x)), hit.y - pl.y) / pl.w;
            float on = smoothstep(.02, .14, den) * (.4 + .6 * F), up = step(0., q.y);
            vec3 img = vec3(0.);
            if (pc.w < .5) { vec2 cs = crossShape(q); img = vec3(.9, .95, 1.) * cs.x * 2.6 + vec3(1., .85, .5) * cs.y * 1.3 + vec3(1., .9, .62) * exp(-q.x * q.x * 14.) * exp(-max(q.y - .9, 0.) * .9) * .22; }
            else if (pc.w < 1.5) {                                        // the fire: its shape, and a long red road beyond it toward the eye
              float w = .2 * (1. - .6 * clamp(q.y, 0., 1.));
              img = pc.rgb * exp(-q.x * q.x / (w * w)) * smoothstep(0., .08, q.y) * (1. - smoothstep(.6, 1.3, q.y)) * 3.2 + pc.rgb * exp(-q.x * q.x * 13.) * exp(-max(q.y - .7, 0.) * .42) * (.55 + .9 * smoothstep(.45, .8, n1.x));
            }
            else if (pc.w < 2.5) { vec2 cs = crossShape(q); img = (hue(hash12(floor(q * 16.))) * .9 + .3) * cs.x * 2.2 + vec3(.7, .76, 1.) * exp(-(q.y - .62) * (q.y - .62) * 60.) * (1. - smoothstep(.2, .6, abs(q.x))) * .35; }
            col += img * on * up;
          }
          for (int i = 0; i < 2; i++) {
            vec3 A = uSegA[i], B = uSegB[i]; vec2 ab = B.xz - A.xz; float l2 = max(dot(ab, ab), 1e-3); vec2 nn = normalize(vec2(-ab.y, ab.x) + vec2(1e-5, 0.));
            float den = dot(R.xz, nn), num = dot(A.xz - vW.xz, nn); if (num < 0.) { den = -den; num = -num; }
            float t = num / max(den, .03); vec3 hit = vW + R * t;
            float u = dot(hit.xz - A.xz, ab) / l2, hy = hit.y - A.y, sg = uSegCol[i].w + .03 * t;
            col += uSegCol[i].rgb * smoothstep(0., .06, den) * smoothstep(-.03, .03, u) * (1. - smoothstep(.97, 1.03, u)) * exp(-hy * hy / (sg * sg)) * (.35 + .65 * F) * min(1., 2.4 * uSegCol[i].w / sg) * 1.6;
          }
          // small ripples that flash violet, blue or rainbow: crescents riding the current
          vec3 flash = vec3(0.);
          {
            vec2 q = vec2(ac * .5, (al - flow * .8) * .9), id = floor(q), f = fract(q) - .5;
            float h = hash12(id), ph = fract(uTime * (.2 + .4 * h) + h * 17.);
            float on = smoothstep(0., .1, ph) * (1. - smoothstep(.15, .6, ph)) * step(.86, hash12(id + 3.1));
            float cy = f.y + 1.6 * f.x * f.x - .12, shp = exp(-cy * cy * 260.) * (1. - smoothstep(.2, .42, abs(f.x)));
            vec3 fc2 = h < .45 ? vec3(.74, .58, 1.) : (h < .8 ? vec3(.56, .8, 1.) : hue(h * 9.));
            flash = fc2 * shp * on * (1. - smoothstep(30., 100., dist));
          }
          col += flash * 1.8;
          // the lip of the well: the light quickens and gathers before it goes over
          col += vec3(.4, .55, 1.) * smoothstep(-18., 0., over) * (.07 + .8 * streak);
          col *= uBright;
          col *= 1. - .9 * smoothstep(uWell.y + 60., uWell.y + 190., s);
          col = applyFog(col, vW);
          gl_FragColor = vec4(col, 1.);
        }`,
      side: THREE.DoubleSide,
    });
    {
      const ss = []; for (let s = S_BACK; s <= WELL_S + 200; s += 12) ss.push(s);
      const cols = []; for (let j = 0; j <= 16; j++) cols.push(j / 16);
      const g = await makeStrip(ss, cols, (s, t) => { const d = lerp(22, -Wr(s) - 22, t); return [X(s, d), 0, Z(s), 0]; }, 60);
      const river = new THREE.Mesh(g, riverMat); river.frustumCulled = false; river.renderOrder = -0.5; scene.add(river);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the island and the cross of frozen cloud with its ring of gold
    const isleP = V3(S_ISLE, ISLE_D, 0);
    {
      const nr = 7, na = 28, pos = [], sand = [], idx = [];
      for (let i = 0; i <= nr; i++) for (let j = 0; j < na; j++) {
        const r = i / nr * 27 * (1 + 0.12 * Math.sin(j / na * TAU * 3 + 1)), a = j / na * TAU, t = i / nr;
        pos.push(isleP.x + Math.cos(a) * r, 1.9 * (1 - t * t) - 0.5, isleP.z + Math.sin(a) * r * 1.25); sand.push(1);
      }
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = i * na + j, b = i * na + (j + 1) % na; idx.push(a, b, a + na, b, b + na, a + na); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSand', new THREE.Float32BufferAttribute(sand, 1)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, groundMat));
    }
    const cross = makeCross(shared, { kind: 'white', height: 46 });
    const faceUpRiver = (s) => Math.atan2(-side * mSlope(s), 1);       // both crosses stand square to the current and look up the river
    cross.object.position.set(isleP.x, 1.2, isleP.z); cross.object.rotation.y = faceUpRiver(S_ISLE);
    scene.add(cross.object);
    uPil.value[0].set(isleP.x, 1.2, isleP.z, 46); uPilCol.value[0].set(1, 1, 1, 0);
    U.uCrossL.value.set(isleP.x, isleP.z, 80, 0.7);
    const crossGaze = new THREE.Vector3(isleP.x, 27, isleP.z);
    // the second cross, far down the river: it stands in the water like a tree, set with lights of every colour, a pale cloud for a halo
    const X2_H = 74, x2P = V3(S_X2, X2_D, 0);
    const cross2 = makeCross(shared, { kind: 'jewel', height: X2_H });
    cross2.object.position.set(x2P.x, -0.4, x2P.z); cross2.object.rotation.y = faceUpRiver(S_X2);
    scene.add(cross2.object);
    uPil.value[2].set(x2P.x, -0.4, x2P.z, X2_H); uPilCol.value[2].set(0.5, 0.6, 1, 2);
    const cross2Gaze = new THREE.Vector3(x2P.x, X2_H * 0.56, x2P.z);
    U.uCross2L.value.set(x2P.x, x2P.z, 60, 0.6);
    // its halo: a ring of pale cloud with depth, many soft lights turning slowly round the arms
    const NRING = 96, ringSeed = [], cloudRing = (() => {
      const cr2 = fk.cloudRing, sizes = [], cols = [];
      for (let i = 0; i < NRING; i++) { ringSeed.push([i / NRING * TAU + cr2.range(-0.08, 0.08), cr2.range(0.38, 0.62) * X2_H, cr2.range(-3.4, 3.4), cr2.range(0.6, 1.4)]); sizes.push(cr2.range(30, 46)); cols.push(mixc([0.45, 0.58, 1.0], [0.8, 0.8, 1.0], cr2())); }
      return fx.makeGlows({ time: shared.uTime, positions: new Float32Array(NRING * 3), colors: cols, sizes, size: 1, intensity: 0.03, core: 0, halo: 1, flicker: 0.04, renderOrder: 3, fogAmount: 0.4, near: [0.5, 2.5] });
    })();
    cloudRing.object.frustumCulled = false; scene.add(cloudRing.object); ups.push(cloudRing);
    const placeRing = (time) => {
      for (let i = 0; i < NRING; i++) { const q = ringSeed[i], a = q[0] + time * 0.035 * q[3], r = q[1];
        cloudRing.setPosition(i, x2P.x + Math.cos(a) * r, X2_H * 0.62 + q[2] + 1.6 * Math.sin(a * 3 + time * 0.2), x2P.z + Math.sin(a) * r); }
    };
    placeRing(0);
    await ctx.yield();

    // crystals standing in the sand of the shore, thickest by the station; a few round the foot of the cross. Each face takes
    // the river's light at its own angle and a small fire burns inside. A lane is kept clear round the route, height included.
    const laneFree = (x, y, z, r, margin) => routeDist(x, y, z) > margin + r;
    {
      const cr = fk.crystals, lists = Array.from({ length: nCh }, () => []);
      const crGeo = fx.crystalGeometry({ rng: cr, count: 5, sides: 5, height: [0.5, 1.9], radius: [0.1, 0.26], spread: 0.55, tilt: 0.6, lean: 0.3, colors: ['#ffffff', '#cfe0ff', '#dcc8ff', '#bfe8ff'] });
      const crMat = new THREE.ShaderMaterial({
        uniforms: { ...U, uKeyDir: shared.uKeyDir, uFade: { value: new THREE.Vector2(280, 340) } },
        vertexShader: FRAME_GLSL + LIGHT_GLSL + /* glsl */`attribute vec3 color; attribute vec4 aRand; uniform vec2 uFade;
          varying vec3 vW; varying vec3 vC; varying vec3 vL; varying float vH; varying float vR;
          void main(){
            vec4 base = modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
            float fade = 1. - smoothstep(uFade.x, uFade.y, distance(cameraPosition, base.xyz));
            vec4 w = modelMatrix * instanceMatrix * vec4(position * fade, 1.);
            vW = w.xyz; vC = color; vH = position.y; vR = aRand.x; vL = worldLight(base.xyz + vec3(0., 1., 0.));
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: FOG_GLSL + /* glsl */`uniform vec3 uKeyDir; uniform float uTime;
          varying vec3 vW; varying vec3 vC; varying vec3 vL; varying float vH; varying float vR;
          void main(){
            vec3 n = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0., 1e-6, 0.)), v = normalize(cameraPosition - vW); if (dot(n, v) < 0.) n = -n;
            float ndv = clamp(dot(n, v), 0., 1.), fr = pow(1. - ndv, 3.);
            float facet = clamp(dot(n, uKeyDir) * .5 + .5, 0., 1.); facet *= facet;
            float sp = pow(clamp(dot(reflect(-v, n), uKeyDir), 0., 1.), 24.);
            vec3 fire = mix(vec3(.5, .7, 1.), vec3(1., .5, .16), step(.62, vR));
            float burn = .55 + .45 * sin(uTime * (1. + 2. * vR) + vR * 60.);
            vec3 col = vC * vL * (.12 + 1.25 * facet) + (vec3(.6, .72, 1.) * fr * .9 + vec3(.9, .95, 1.) * sp * 1.6) * (.25 + length(vL) * .6);
            col += fire * pow(ndv, 2.5) * burn * .55 * smoothstep(0., .5, clamp(vH, 0., 1.));
            gl_FragColor = vec4(applyFog(col, vW), 1.);
          }`,
        side: THREE.DoubleSide,
      });
      const put = (s, d, sc, r4) => {
        const x = X(s, d), z = Z(s), y = Math.max(groundY(s, d)[0], -0.7) - 0.05;
        if (built(s, d, 0.5) || wellOver(s, d) > -4 || !laneFree(x, y + sc, z, sc * 1.2, 6.5)) return;
        lists[clamp(Math.floor((s - S_BACK) / CH), 0, nCh - 1)].push({ x, y, z, yaw: r4[0] * TAU, sc, r: [r4[1], r4[2], r4[3], 0] });
      };
      const nC = Math.round(900 * lush * (detail < 1 ? 0.7 : 1));
      for (let i = 0; i < nC; i++) {
        const s = cr.range(S_BACK + 120, S_RIM - 12), keep = 0.3 + 0.7 * Math.exp(-(((s - (S_ST + 46)) / 120) ** 2)), sc = cr.range(0.5, 1.6) * (cr.chance(0.14) ? 1.5 : 1), far = cr.chance(0.22), t = cr(), k = cr(), r4 = [cr(), cr(), cr(), cr()];
        if (k > keep) continue;
        if (far) put(s, -Wr(s) - (-3 + t * 11), sc * 1.3, r4); else put(s, shoreOff(s) - 4 + t * (beachW(s) + 4), sc, r4);
      }
      for (let i = 0, ic = fk.isleCrystals; i < 16; i++) { const a = ic.range(0, TAU), rr = ic.range(7, 21), sc = ic.range(0.8, 2.0), x = isleP.x + Math.cos(a) * rr, z = isleP.z + Math.sin(a) * rr * 1.2, y = 1.3 * (1 - (rr / 27) ** 2) - 0.5, r4 = [ic(), ic(), ic(), ic()];
        if (!laneFree(x, y + sc, z, sc * 1.2, 6.5)) continue;
        lists[clamp(Math.floor((-z - S_BACK) / CH), 0, nCh - 1)].push({ x, y, z, yaw: r4[0] * TAU, sc, r: [r4[1], r4[2], r4[3], 0] }); }
      for (let c = 0; c < nCh; c++) instanced(crGeo, crMat, lists[c], S_BACK + c * CH, S_BACK + (c + 1) * CH, 340);
    }
    await ctx.yield();

    // where the river goes over the lip of the well a spray of light stands, lit from within
    const lipAt = (th) => [WELL_S - WELL_R * Math.cos(th), WELL_D + WELL_R * Math.sin(th)];                 // [s, d] on the lip; th = 0 is the point straight upstream of the centre
    const lipWater = (th) => { const q = lipAt(th); return (q[1] < shoreOff(q[0]) - 1 && q[1] > -Wr(q[0]) + 1 ? 1 : 0) * (1 - smoothstep(WELL_S + 60, WELL_S + 190, q[0])); };
    const sprayPos = [], wl = fk.well;
    for (let th = -2.6; th < 0.3; th += 0.1) { if (lipWater(th) < 0.15) continue; const q = lipAt(th + wl.range(-0.03, 0.03)), o = wl.range(4, 13); sprayPos.push([X(q[0], q[1]) , wl.range(-9, 5), Z(q[0] + o * Math.cos(th))]); }
    const spray = fx.makeGlows({ time: shared.uTime, positions: sprayPos, color: [0.42, 0.56, 1.0], size: 38, sizeJitter: 0.3, rng: wl, intensity: 0.1, core: 0, halo: 1, flicker: 0.05, renderOrder: 2, fogAmount: 0.4, near: [0.6, 2.5] });
    scene.add(spray.object);
    const sparkC = lipAt(-0.7);
    const sparks = fx.makeParticles({ rng: fk.spray, preset: 'magic', time: shared.uTime, follow: false, center: [X(sparkC[0], sparkC[1]), 4, Z(sparkC[0])], box: [300, 46, 200],
      count: Math.round(2400 * detail), colors: ['#cfe0ff', '#ffffff', '#b9a0ff'], size: [0.12, 0.34], intensity: 1.6 });
    scene.add(sparks.object);
    await ctx.yield();

    // ------------------------------------------------------------ the line: a single track on a low bank, telegraph poles with glass insulators
    const propMat = litMaterial(shared, { light: { glsl: FRAME_GLSL + LIGHT_GLSL, uniforms: U } });
    for (let a = S_BACK + 6; a < S_RIM - 1e-3; a += 108) {
      const b = Math.min(a + 108, S_RIM);
      scene.add(new THREE.Mesh(trackGeometry(trackFrame, { s0: a, s1: b, bed: 1.1, ballast: [0.085, 0.09, 0.15], step: 4 }), propMat));
      await ctx.yield();
    }
    {
      const g = makeG(), wood = [0.2, 0.15, 0.13], PD = TRACK_D + 6.6, tops = [];
      for (let s = S_BACK + 30; s < S_RIM - 12; s += 44) {
        const x = X(s, PD), z = Z(s), y0 = groundY(s, PD)[0] - 0.4, y1 = RAIL + 7.4;
        g.off(x, 0, z).col(wood, 0.15).em(null).cyl('y', y0, y1, 0, 0, 0.17, 0.11, 7, false, true);
        const row = [];
        for (const [ya, hw] of [[y1 - 0.5, 1.15], [y1 - 1.25, 0.85]]) {
          g.col(wood, 0.15).em(null).box(0, ya, 0, hw * 2, 0.11, 0.11);
          for (const lx of [-hw + 0.08, -hw * 0.4, hw * 0.4, hw - 0.08]) {
            g.col([0.5, 0.7, 0.8], 1).em([0.8, 1.35, 1.7]).cyl('y', ya + 0.05, ya + 0.2, lx, 0, 0.05, 0.07, 6).cyl('y', ya + 0.2, ya + 0.27, lx, 0, 0.07, 0.02, 6, false, true);
            if (Math.abs(lx) > hw * 0.5) row.push([x + lx, ya + 0.24, z]);
          }
        }
        tops.push(row);
        if (tops.length % 9 === 0) await ctx.yield();
      }
      g.off();
      scene.add(new THREE.Mesh(g.build(), propMat));
      await ctx.yield();
      // the wires: ribbons that keep a width on screen
      const P = [], Nx = [], Sd = [], idx = [], SEG = 7;
      for (let i = 0; i < tops.length - 1; i++) for (let w = 0; w < 4; w++) {
        const a = tops[i][w], b = tops[i + 1][w], pt = (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - 0.9 * 4 * t * (1 - t), lerp(a[2], b[2], t)];
        for (let k = 0; k < SEG; k++) {
          const p0 = pt(k / SEG), p1 = pt((k + 1) / SEG), base = P.length / 3;
          P.push(...p0, ...p0, ...p1, ...p1); Nx.push(...p1, ...p1, ...p0, ...p0); Sd.push(-1, 1, 1, -1); idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
        }
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('aNext', new THREE.Float32BufferAttribute(Nx, 3)); wg.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 1)); wg.setIndex(idx);
      const wm = new THREE.ShaderMaterial({
        uniforms: { uFogDen: shared.uFogDen },
        vertexShader: /* glsl */`attribute vec3 aNext; attribute float aSide; uniform float uFogDen; varying float vA;
          void main(){ vec3 t = normalize(aNext - position), toC = cameraPosition - position; float dist = length(toC); vec3 nrm = normalize(cross(t, toC) + vec3(0., 1e-4, 0.));
            float wd = max(.014, dist * .0011); vA = clamp(.02 / wd, 0., 1.) * exp(-dist * dist * uFogDen * uFogDen * 2.);
            gl_Position = projectionMatrix * viewMatrix * vec4(position + nrm * wd * aSide, 1.); }`,
        fragmentShader: /* glsl */`varying float vA; void main(){ gl_FragColor = vec4(vec3(.42, .5, .72) * vA, vA); }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      const wires = new THREE.Mesh(wg, wm); wires.frustumCulled = false; wires.renderOrder = 1; scene.add(wires);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the hero: the train, and its timetable written against the camera's own progress
    const train = hero.train; scene.add(hero.object);
    const STOP = S_ST + 27, PLAT = 35, DUR = 50;                         // where the engine's head stands; half the platform's length; seconds of flight
    const win = (cs, a, b, c, d) => smoothstep(a, b, cs) * (1 - smoothstep(c, d, cs));
    // how fast we fly, by where we are: slower past the island of the white cross, the length of the platform, slowest over the
    // shore beyond it (the herons come down, the train gets away and comes past us), at the carriages' side, under the spheres
    // and out by the fire, and from the second cross on, out over the bridge behind the train's tail lamp
    const paceAt = (cs) => 1 - 0.32 * win(cs, S_ISLE - 120, S_ISLE - 60, S_ISLE + 10, S_ISLE + 50)
      - 0.38 * win(cs, S_ST - PLAT - 60, S_ST - PLAT - 20, S_ST + PLAT - 5, S_ST + PLAT + 25) - 0.62 * win(cs, S_ST + PLAT - 5, S_ST + PLAT + 25, S_ST + PLAT + 90, S_ST + PLAT + 125)
      - 0.32 * win(cs, S_ST + PLAT + 90, S_ST + PLAT + 125, S_OB - 75, S_OB - 40) - 0.1 * win(cs, S_OB - 75, S_OB - 40, S_FIRE - 60, S_FIRE - 20)
      - 0.2 * win(cs, S_X2 - 70, S_X2 - 35, S_END + 50, S_END + 60);
    // seconds of flight at u when flown at that pace (the engine's own table of it: 64 steps, clamped, scaled to the duration).
    // A function of u alone, no clock: the train's run is written in it so that its speed is a train's wherever we slow or hurry.
    const tauAt = (() => {
      const NP = 64, pv = [], M = 1024, cum = new Float32Array(M + 1); let acc = 0;
      for (let i = 0; i <= NP; i++) pv.push(clamp(paceAt(camSAt(i / NP)), 0.35, 2.5));
      for (let j = 0; j < M; j++) { const x = (j + 0.5) / M * NP, i = Math.min(NP - 1, Math.floor(x)); acc += 1 / (pv[i] + (pv[i + 1] - pv[i]) * (x - i)) / M; cum[j + 1] = acc; }
      return (u) => { const f = clamp(u, 0, 1) * M, j = Math.min(M - 1, Math.floor(f)); return DUR * lerp(cum[j], cum[j + 1], f - j) / acc; };
    })();
    const tauS = (s) => tauAt(uAtS(s));
    // The train's run. To the station: a steady speed, then one even brake, so that it comes to a stand as we come level with the
    // near end of the platform (where it is at the start follows from that: far enough ahead to do it). It stands until we have
    // flown its whole length and are level with the engine, then gets away at one even pull up to its line speed, which it holds
    // as it comes up from behind us over the shore, past us and along our
    // side, and on down the straight while we are out over the water by the fire (so the close pass beside the carriages comes
    // of the two speeds, ours and its own). After that, a few places with their reasons: [we are level with this place, the engine's head
    // is at that place]; between them its speed changes smoothly.
    const BRAKE = 3.6, PULL = 3.4, LINE_V = 28, v1 = leadFirst ? 28 : 25;   // m/s2, m/s2, m/s; its speed on the way in: a fast night or a slow one
    const tA = tauS(S_ST - PLAT), tB = tauS(STOP), tC = tB + LINE_V / PULL, sC = STOP + LINE_V * LINE_V / (2 * PULL);
    const sT0 = STOP - (v1 * tA - v1 * v1 / (2 * BRAKE));
    const tD = Math.max(tauS(S_FIRE - 70), tC + 0.1), sD = sC + LINE_V * (tD - tC);
    const leads = [
      [S_X2 + 1, S_RIM + 14],                                         // it eases down for the bridge as we come round from the fire, and is out on it as we pass the second cross
      [S_END, S_END + 63],                                            // it crosses slowly, we close up on its tail lamp, which is a carriage's length ahead of us at the gate
    ];
    const keys = [[tD, sD], ...leads.map(([cs, sf]) => [tauS(cs), Math.max(sf, sD)])];
    const timetable = (() => {
      const n = keys.length, xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]), dl = [], m = new Array(n).fill(0);
      for (let i = 0; i < n - 1; i++) dl.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      m[0] = LINE_V; m[n - 1] = dl[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : 2 / (1 / dl[i - 1] + 1 / dl[i]);
      return (u, out) => {
        const x = tauAt(u);
        if (x <= tA) { const tb = tA - v1 / BRAKE; if (x < tb) { out.s = sT0 + v1 * x; out.v = v1; } else { out.s = STOP - BRAKE * (tA - x) * (tA - x) / 2; out.v = BRAKE * (tA - x); } return out; }
        if (x <= tB) { out.s = STOP; out.v = 0; return out; }
        if (x <= tC) { out.s = STOP + PULL * (x - tB) * (x - tB) / 2; out.v = PULL * (x - tB); return out; }
        if (x <= tD) { out.s = sC + LINE_V * (x - tC); out.v = LINE_V; return out; }
        let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
        const h = xs[i + 1] - xs[i], t = clamp((x - xs[i]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
        out.s = (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
        out.v = ((6 * t2 - 6 * t) * ys[i] + (3 * t2 - 4 * t + 1) * h * m[i] + (-6 * t2 + 6 * t) * ys[i + 1] + (3 * t2 - 2 * t) * h * m[i + 1]) / h;
        return out;
      };
    })();
    const tt = { s: 0, v: 0 };
    const placeTrain = (u) => {
      timetable(u, tt); train.place(trackFrame, tt.s, tt.s);
      const fa = trackFrame(tt.s - train.length + 2), fb = trackFrame(tt.s - 10);
      U.uTrA.value.set(fa.x, RAIL + 2.3, fa.z); U.uTrB.value.set(fb.x, RAIL + 2.3, fb.z);
      uSegA.value[0].set(fa.x, RAIL + 2.4, fa.z); uSegB.value[0].set(fb.x, RAIL + 2.4, fb.z);
    };
    placeTrain(0);
    { const t = path.endTangent, e = path.end; shared.uClip.value.set(t.x, t.y, t.z, t.x * e.x + t.y * e.y + t.z * e.z - 0.05); }
    await ctx.yield();

    // ------------------------------------------------------------ the station with its great clock, by a shore of crystal sand
    const stationRoot = new THREE.Group(), lampPts = [], lampCols = [], lampSizes = [];
    { const f = trackFrame(S_ST); stationRoot.position.set(f.x, RAIL, f.z); stationRoot.rotation.y = faceRiver(S_ST); stationRoot.updateMatrixWorld(true); }
    const stW = (x, y, z) => stationRoot.localToWorld(new THREE.Vector3(x, y, z));
    {
      const g = makeG(), stone = [0.2, 0.2, 0.29], timber = [0.26, 0.18, 0.14], slate = [0.2, 0.23, 0.38], warm = [1.0, 0.72, 0.34], brass = lin('#d8a548');
      const lampAt = (x, y, z, size = 2.6, c = warm) => { const w = stW(x, y, z); lampPts.push([w.x, w.y, w.z]); lampCols.push(c); lampSizes.push(size); };
      // a low open platform on the river side (the train stands between it and the building), a deeper one on the land side
      g.col(stone, 0.2).box(0, -0.72, 3.95, 70, 3.0, 4.5, 'y').box(0, -0.72, -6.4, 70, 3.0, 9.4, 'y');
      for (let i = -11; i <= 11; i++) { if (Math.abs(i) < 4) continue; g.col(mulc(stone, 1.25), 0.25).box(i * 3.1, -0.4, 6.28, 0.5, 2.3, 0.2).col(mulc(stone, 0.45), 0.1).box(i * 3.1 + 1.55, -0.5, 6.215, 2.2, 1.7, 0.04); }
      g.col(mulc(stone, 1.3), 0.3).box(0, 0.7, 6.26, 70.4, 0.16, 0.3);
      for (const sx of [-1, 1]) {                                      // the ramps
        const x0 = sx * 35, x1 = sx * 44, yb = -2.2;
        g.col(stone, 0.2).quad([x0, 0.78, 1.7], [x0, 0.78, 6.2], [x1, yb, 6.2], [x1, yb, 1.7], [sx * 0.3, 0.95, 0]).tri([x0, 0.78, 6.2], [x0, yb, 6.2], [x1, yb, 6.2], [0, 0, 1]).tri([x0, 0.78, 1.7], [x0, yb, 1.7], [x1, yb, 1.7], [0, 0, -1]);
      }
      for (const z of [1.95, -1.95]) g.col([0.7, 0.72, 0.8], 0.3).em([0.1, 0.11, 0.15]).box(0, 0.785, z, 70, 0.02, 0.34, 'y').em(null);
      for (let i = -17; i < 17; i++) g.col([0.2, 0.2, 0.3], 0.3).box(i * 2 + 1, 0.782, 4.1, 0.05, 0.02, 3.9, 'y');
      for (let i = 0; i < 4; i++) g.col(stone, 0.2).box(0, 0.5 - i * 0.42, 6.5 + i * 0.6, 24, 0.42, 0.62, 'y');
      // the building
      const bx = 8.4, z0 = -8.7, z1 = -4.5, y0 = 0.78, y1 = 4.3;
      g.col(timber, 0.2).box(0, (y0 + y1) / 2, (z0 + z1) / 2, bx * 2, y1 - y0, z1 - z0, 'y');
      for (const [zf, sgn] of [[z1, 1], [z0, -1]]) for (let i = -3; i <= 3; i++) {
        const cx = i * 2.3, z = zf + sgn * 0.02, door = i === 0;
        const ya = door ? y0 + 0.05 : y0 + 1.15, yb = y0 + 2.75, hw = door ? 0.62 : 0.8;
        g.col([0.1, 0.08, 0.06], 0.3).em(mulc(warm, door ? 1.5 : 2.3)).quad([cx - hw, ya, z], [cx + hw, ya, z], [cx + hw, yb, z], [cx - hw, yb, z], [0, 0, sgn]);
        g.col(timber, 0.2).em(null).box(cx, (ya + yb) / 2, z + sgn * 0.02, 0.07, yb - ya, 0.04).box(cx, ya + (yb - ya) * 0.6, z + sgn * 0.02, hw * 2, 0.07, 0.04);
      }
      const ov = 1.3, ry = 6.4, e0 = [-bx - ov, y1 - 0.15, z0 - ov], e1 = [bx + ov, y1 - 0.15, z0 - ov], e2 = [bx + ov, y1 - 0.15, z1 + ov], e3 = [-bx - ov, y1 - 0.15, z1 + ov], r0 = [-bx + 2.2, ry, (z0 + z1) / 2], r1 = [bx - 2.2, ry, (z0 + z1) / 2];
      g.col(slate, 0.55).quad(e0, e1, r1, r0).quad(e2, e3, r0, r1).tri(e1, e2, r1).tri(e3, e0, r0);
      // a canopy over the platform edge on posts, a lamp under every bay
      g.col(slate, 0.5).quad([-14, 4.25, -4.5], [14, 4.25, -4.5], [14, 3.85, -2.1], [-14, 3.85, -2.1]).col(timber, 0.2).box(0, 3.82, -2.15, 28, 0.12, 0.12);
      for (let i = -3; i <= 3; i++) { const x = i * 4.5; g.col(timber, 0.3).box(x, 2.3, -2.35, 0.14, 3.05, 0.14); if (i < 3) { g.col(warm, 0).em(mulc(warm, 5)).box(x + 2.25, 3.5, -3.2, 0.22, 0.26, 0.22); g.em(null); lampAt(x + 2.25, 3.45, -3.2, 3.2); } }
      // the clock tower: a shaft through the roof, a square head with a face on every side, a pointed cap
      const tz = (z0 + z1) / 2;
      g.col(timber, 0.25).box(0, 7.4, tz, 3.2, 6.4, 3.2, 'y').col([0.34, 0.25, 0.2], 0.3).box(0, 12.4, tz, 6.2, 6.0, 6.2).col(brass, 1).box(0, 9.45, tz, 6.4, 0.14, 6.4).box(0, 15.4, tz, 6.5, 0.16, 6.5);
      const ap = [0, 19.6, tz], c = [[-3.4, 15.45, tz - 3.4], [3.4, 15.45, tz - 3.4], [3.4, 15.45, tz + 3.4], [-3.4, 15.45, tz + 3.4]];
      for (let i = 0; i < 4; i++) g.col(slate, 0.6).tri(c[i], c[(i + 1) % 4], ap);
      g.col(brass, 1).cyl('y', 19.4, 20.8, 0, tz, 0.07, 0.03, 6).col([1, 1, 1], 0).em([2.4, 2.6, 3.2]).box(0, 21.0, tz, 0.3, 0.3, 0.3).em(null);
      lampAt(0, 21.0, tz, 3.2, [0.7, 0.8, 1.0]);
      // lamps along the river edge of the platform, benches, luggage
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue; const x = i * 9.4;
        g.col([0.2, 0.2, 0.28], 0.6).cyl('y', 0.78, 4.3, x, 5.8, 0.09, 0.06, 6).box(x, 4.3, 5.8, 0.5, 0.05, 0.05);
        g.col(warm, 0).em(mulc(warm, 5.5)).cyl('y', 4.32, 4.62, x, 5.8, 0.16, 0.2, 8).cyl('y', 4.62, 4.74, x, 5.8, 0.2, 0.03, 8).em(null);
        lampAt(x, 4.5, 5.8, 3.6);
        g.col(timber, 0.3).box(x + 2.4, 1.2, 5.5, 2.0, 0.08, 0.5).box(x + 2.4, 1.55, 5.72, 2.0, 0.5, 0.06).box(x + 1.5, 1.0, 5.5, 0.08, 0.42, 0.5).box(x + 3.3, 1.0, 5.5, 0.08, 0.42, 0.5);
      }
      for (const [x, z, sx, sy, sz] of [[11.5, 4.0, 0.9, 0.6, 0.6], [12.3, 3.9, 0.6, 1.0, 0.5], [-11.8, 3.9, 1.2, 0.7, 0.7], [-11.6, 3.95, 0.7, 0.4, 0.5]]) g.col([0.36, 0.24, 0.16], 0.3).box(x, 0.78 + sy / 2 + (sy === 0.4 ? 0.7 : 0), z, sx, sy, sz);
      // a signal at each end of the platform
      for (const sx of [-1, 1]) {
        const x = sx * 37.5, z = 3.3, col = sx > 0 ? [0.5, 1.0, 0.55] : [1.0, 0.2, 0.14];
        g.col([0.75, 0.75, 0.8], 0.4).cyl('y', -0.6, 7.6, x, z, 0.1, 0.07, 6).col([0.8, 0.15, 0.1], 0.3).box(x - sx * 0.75, 7.0 - 0.35, z, 1.5, 0.26, 0.05).col([0.9, 0.9, 0.9], 0.3).box(x - sx * 1.3, 7.0 - 0.35, z + 0.03, 0.22, 0.26, 0.02);
        g.col(col, 0).em(mulc(col, 5)).box(x, 6.2, z + 0.12, 0.2, 0.2, 0.1).em(null); lampAt(x, 6.2, z + 0.2, 2.0, col);
      }
      const mesh = new THREE.Mesh(g.build(), propMat); stationRoot.add(mesh);
      // the four faces of the clock: marks and hands only
      const cg = new THREE.BufferGeometry(), cp = [], cu = [], ci = [], R = 2.75;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, nx = Math.sin(a), nz = Math.cos(a), txx = Math.cos(a), tzz = -Math.sin(a), cxx = nx * 3.13, czz = tz + nz * 3.13, base = cp.length / 3;
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { cp.push(cxx + txx * u * R, 12.4 + v * R, czz + tzz * u * R); cu.push(u, v); }
        ci.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setAttribute('aUv', new THREE.Float32BufferAttribute(cu, 2)); cg.setIndex(ci);
      const clockMat = new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime, uFogCol: shared.uFogCol, uFogDen: shared.uFogDen, uT0: { value: rv.range(0, 43200) } },
        vertexShader: /* glsl */`attribute vec2 aUv; varying vec2 vUv; varying vec3 vW; void main(){ vUv = aUv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: FOG_GLSL + /* glsl */`uniform float uTime, uT0; varying vec2 vUv; varying vec3 vW;
          float hand(vec2 p, float ang, float len, float wd){ vec2 dir = vec2(sin(ang), cos(ang)); float t = clamp(dot(p, dir), -.08, len); return 1. - smoothstep(wd, wd + .012, length(p - dir * t)); }
          void main(){
            vec2 p = vUv; float r = length(p), a = atan(p.x, p.y + 1e-6);
            float tsec = uT0 + uTime, sec = floor(tsec) + smoothstep(0., .18, fract(tsec));
            vec3 dial = vec3(1., .93, .74) * (1.7 - .5 * r * r);
            float k = fract(a / 6.2831853 * 12. + .5) - .5, q = fract(a / 6.2831853 * 4. + .5) - .5;
            float marks = (1. - smoothstep(.035, .05, abs(k) * r * .5236)) * step(.76, r) * step(r, .9) + (1. - smoothstep(.05, .065, abs(q) * r * 1.5708)) * step(.66, r) * step(r, .9);
            float ink = clamp(max(marks, max(hand(p, tsec / 43200. * 6.2831853, .5, .045), hand(p, tsec / 3600. * 6.2831853, .78, .03))), 0., 1.);
            ink = max(ink, 1. - smoothstep(.06, .075, r));
            vec3 col = mix(dial, vec3(.05, .04, .08), ink);
            col = mix(col, vec3(1.6, .3, .2), hand(p, sec / 60. * 6.2831853, .84, .012));
            col = mix(col, vec3(.5, .36, .14), smoothstep(.93, .95, r));
            if (r > 1.) discard;
            gl_FragColor = vec4(applyFog(col, vW), 1.);
          }`,
      });
      stationRoot.add(new THREE.Mesh(cg, clockMat));
    }
    scene.add(stationRoot);
    { const w = stW(0, 0, 2); U.uStation.value.set(w.x, w.z, 52, 1.15); uSegA.value[1].copy(stW(-29, 4.5, 5.8)); uSegB.value[1].copy(stW(29, 4.5, 5.8)); }
    const clockGaze = stW(0, 9, -4);
    await ctx.yield();

    // ------------------------------------------------------------ the observatory: a sapphire and a topaz sphere circling each other over a dark tower
    const OB_D = 66, obY = groundY(S_OB, OB_D)[0], obP = V3(S_OB, OB_D, obY), sphC = new THREE.Vector3(obP.x, obY + 33, obP.z), SPH_R = 6.4, ORB_R = 9.2;
    const uSA = { value: new THREE.Vector3() }, uSB = { value: new THREE.Vector3() };
    {
      const g = makeG(), stone = [0.17, 0.18, 0.3], brass = lin('#d8a548'), metal = [0.4, 0.45, 0.62];
      g.off(obP.x, obY, obP.z);
      g.col(stone, 0.25).cyl('y', -1.5, 11, 0, 0, 13.2, 12.4, 32).col(brass, 1).cyl('y', 11, 11.5, 0, 0, 13.0, 13.0, 32, false, true).col(stone, 0.25).cyl('y', 11.5, 13.2, 0, 0, 9.6, 9.2, 28);
      for (let i = 0; i < 14; i++) {                                    // a ring of lit windows
        const a = i / 14 * TAU, r = 12.86, c = Math.cos(a), s = Math.sin(a), hw = 0.75, tx = -s, tz = c;
        const pt = (u, y) => [c * r + tx * u, y, s * r + tz * u];
        g.col([0.08, 0.07, 0.1], 0.3).em([1.5, 1.0, 0.45]).quad(pt(-hw, 4.6), pt(hw, 4.6), pt(hw, 7.2), pt(-hw, 7.2), [c, 0, s]).tri(pt(-hw, 7.2), pt(hw, 7.2), pt(0, 8.1), [c, 0, s]);
        g.col(stone, 0.2).em(null).quad(pt(-0.05, 4.6), pt(0.05, 4.6), pt(0.05, 8.0), pt(-0.05, 8.0), [c, 0, s]);
      }
      const DR = 8.6, NL = 7, NS = 24;                                   // the dome, with its slit
      for (let i = 0; i < NL; i++) for (let j = 0; j < NS; j++) {
        const p0 = i / NL * Math.PI / 2, p1 = (i + 1) / NL * Math.PI / 2, a0 = j / NS * TAU, a1 = (j + 1) / NS * TAU;
        const pt = (p, a) => [Math.cos(p) * Math.cos(a) * DR, 13.2 + Math.sin(p) * DR, Math.cos(p) * Math.sin(a) * DR], nn = (p, a) => [Math.cos(p) * Math.cos(a), Math.sin(p), Math.cos(p) * Math.sin(a)];
        const slit = j === (side > 0 ? 3 : NS / 2 - 4);
        g.col(slit ? [0.03, 0.03, 0.06] : metal, slit ? 0.2 : 0.85).em(slit ? [0.12, 0.2, 0.5] : null).quadN(pt(p0, a0), pt(p0, a1), pt(p1, a1), pt(p1, a0), nn(p0, a0), nn(p0, a1), nn(p1, a1), nn(p1, a0));
      }
      // the spindle and the tilted brass ring the spheres ride
      g.em(null).col(brass, 1).cyl('y', 21.6, 33, 0, 0, 0.3, 0.2, 8);
      const tilt = 0.26, ct = Math.cos(tilt), st = Math.sin(tilt), ringPt = (a, rr, dy) => { const x = Math.cos(a) * rr, z = Math.sin(a) * rr; return [x, 33 + z * st + dy * ct, z * ct - dy * st]; };
      for (let j = 0; j < 56; j++) { const a0 = j / 56 * TAU, a1 = (j + 1) / 56 * TAU;
        g.col(brass, 1).em([0.25, 0.18, 0.06]).quad(ringPt(a0, ORB_R - 0.16, 0), ringPt(a1, ORB_R - 0.16, 0), ringPt(a1, ORB_R + 0.16, 0), ringPt(a0, ORB_R + 0.16, 0)).quad(ringPt(a0, ORB_R, -0.16), ringPt(a1, ORB_R, -0.16), ringPt(a1, ORB_R, 0.16), ringPt(a0, ORB_R, 0.16)); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, e = ringPt(a, ORB_R, 0); g.col(brass, 1).em(null).quad([0.12, 27, 0], [-0.12, 27, 0], [e[0] - 0.1, e[1], e[2]], [e[0] + 0.1, e[1], e[2]]); }
      g.off();
      scene.add(new THREE.Mesh(g.build(), propMat));
      const sm = new THREE.ShaderMaterial({
        uniforms: { uA: uSA, uB: uSB, uR: { value: SPH_R }, uTime: shared.uTime },
        vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`uniform vec3 uA, uB; uniform float uR, uTime; varying vec3 vW;
          vec2 hit(vec3 ro, vec3 rd, vec3 c, float r){ vec3 oc = ro - c; float b = dot(oc, rd), q = dot(oc, oc) - r * r, h = b * b - q; if (h < 0.) return vec2(-1.); h = sqrt(max(h, 0.)); return vec2(-b - h, -b + h); }
          vec4 ball(vec3 ro, vec3 rd, vec3 c, vec2 t, vec3 base){
            vec3 n = normalize(ro + rd * t.x - c); float ndv = clamp(-dot(n, rd), 0., 1.), fr = pow(1. - ndv, 2.2), th = clamp((t.y - t.x) / (2. * uR), 0., 1.);
            vec3 q = ro + rd * (t.x + t.y) * .5 - c; float heart = exp(-dot(q, q) / (uR * uR * .09));
            float fac = pow(clamp(dot(reflect(rd, n), normalize(vec3(.3, .8, .2))), 0., 1.), 40.);
            vec3 col = base * (.5 + 1.3 * th * th) + base * fr * 1.6 + vec3(1.) * (pow(fr, 5.) * .9 + fac * 1.2) + mix(base, vec3(1.), .6) * heart * 1.6;
            return vec4(col, .5 + .45 * fr + .3 * heart);
          }
          void main(){
            vec3 ro = cameraPosition, rd = normalize(vW - cameraPosition);
            vec2 ta = hit(ro, rd, uA, uR), tb = hit(ro, rd, uB, uR);
            if (ta.y < 0. && tb.y < 0.) discard;
            vec4 a = ta.y > 0. ? ball(ro, rd, uA, ta, vec3(.03, .2, 1.)) : vec4(0.), b = tb.y > 0. ? ball(ro, rd, uB, tb, vec3(1., .48, .04)) : vec4(0.);
            vec3 col; float al;
            if (ta.y > 0. && tb.y > 0.) {
              float tha = clamp((ta.y - ta.x) / (2. * uR), 0., 1.), thb = clamp((tb.y - tb.x) / (2. * uR), 0., 1.), lens = min(tha, thb);
              col = vec3(.06, 1., .28) * (.9 + 1.8 * lens) + (a.rgb + b.rgb) * .22; al = clamp(max(a.a, b.a) + .2, 0., 1.);
            } else { col = a.rgb + b.rgb; al = clamp(a.a + b.a, 0., 1.); }
            gl_FragColor = vec4(col * al, al);
          }`,
        transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      });
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(ORB_R + SPH_R + 0.6, 24, 16), sm); proxy.position.copy(sphC); proxy.renderOrder = 2; scene.add(proxy);
    }
    const sphGlow = fx.makeGlows({ time: shared.uTime, positions: [[0, -999, 0], [0, -999, 0]], colors: [[0.1, 0.35, 1.0], [1.0, 0.55, 0.1]], size: 34, intensity: 0.5, core: 0.05, renderOrder: 3, fogAmount: 0.4 });
    sphGlow.object.frustumCulled = false; scene.add(sphGlow.object);
    U.uObs.value.set(obP.x, obP.z, 150, 0.85);
    const sphPhase = fk.spheres.range(0, TAU);
    const placeSpheres = (time) => {
      const a = sphPhase + time * 0.21, tilt = 0.26, x = Math.cos(a) * ORB_R, z = Math.sin(a) * ORB_R, y = z * Math.sin(tilt), zz = z * Math.cos(tilt);
      uSA.value.set(sphC.x + x, sphC.y + y, sphC.z + zz); uSB.value.set(sphC.x - x, sphC.y - y, sphC.z - zz);
      sphGlow.setPosition(0, uSA.value.x, uSA.value.y, uSA.value.z); sphGlow.setPosition(1, uSB.value.x, uSB.value.y, uSB.value.z);
      U.uSphA.value.set(sphC.x + x * 2.4, sphC.z + zz * 2.4, 17, 1.15); U.uSphB.value.set(sphC.x - x * 2.4, sphC.z - zz * 2.4, 17, 1.15);
    };
    placeSpheres(0);
    const sphGaze = sphC.clone().setY(obY + 21);
    await ctx.yield();

    // ------------------------------------------------------------ the scorpion's fire on the far bank, its smoke leaning up, its red on the water
    const FIRE_D = -Wr(S_FIRE) - 46, fireY = groundY(S_FIRE, FIRE_D)[0], fireP = V3(S_FIRE, FIRE_D, fireY), FIRE_H = 118;
    {
      // three upright sheets of tongues crossed on the fire's own axis, the first broadside to the river: a flame with a body from
      // every side, which stands as it stands whoever looks
      const fP = [], fA = [], fI = [], fYaw = faceRiver(S_FIRE);
      for (let k = 0; k < 3; k++) {
        const a = fYaw + k * Math.PI / 3, ax = Math.cos(a), az = -Math.sin(a);
        for (const [u, v] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { fP.push(ax * u * 48, v * FIRE_H, az * u * 48); fA.push(u, v, k); }
        fI.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4 + 2, k * 4 + 1, k * 4 + 3);
      }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fP, 3)); fg.setAttribute('aUv', new THREE.Float32BufferAttribute(fA, 3)); fg.setIndex(fI);
      const fm = new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime },
        vertexShader: /* glsl */`attribute vec3 aUv; varying vec3 vUv; void main(){ vUv = aUv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
        fragmentShader: fx.GLSL_NOISE + /* glsl */`uniform float uTime; varying vec3 vUv;
          // one still tongue of flame: widest low down, a fine point at its tip, leaning a little as it rises
          float tongue(vec2 p, float cx, float h, float w, float ph){
            float y = clamp(p.y / h, 0., 1.);
            float sway = (vnoise(vec2(ph * 7.3, p.y * 3. - uTime * .3)) - .5) * .2 * y + .025 * sin(uTime * .55 + ph * 20.) * y;
            float wd = w * pow(1. - y, .8) * (.55 + .45 * smoothstep(0., .18, y)) + .003;
            return (1. - smoothstep(wd * .5, wd, abs(p.x - cx - sway))) * step(p.y, h) * smoothstep(0., .03, p.y);
          }
          void main(){
            vec2 p = vec2(clamp(vUv.x, -1., 1.), clamp(vUv.y, 0., 1.));
            float body = 0., core = 0., sum = 0., card = floor(clamp(vUv.z, 0., 2.) + .5);
            for (int i = 0; i < 9; i++) {
              float fi = float(i), h = hash11(fi * 3.7 + 1. + card * 13.1), cx = (fi - 4.) * .082 + (h - .5) * .05, hh = (.42 + .58 * (1. - abs(fi - 4.) / 4.6)) * (.78 + .22 * h), w = .09 + .06 * h;
              float t = tongue(p, cx, hh, w, h), tc = tongue(p, cx, hh * .74, w * .42, h + .3);
              body = max(body, t * (.5 + .5 * h)); core = max(core, tc); sum += t;
            }
            vec3 col = vec3(1., .02, .05) * body * (.75 + .2 * min(sum, 3.)) + vec3(1., .14, .05) * core * .9 + vec3(1., .7, .5) * core * core * (1. - smoothstep(0., .4, p.y)) * 1.3;
            col += vec3(1., .05, .05) * exp(-p.x * p.x * 6.) * exp(-p.y * 2.6) * .22;
            gl_FragColor = vec4(col * .62, 1.);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const flame = new THREE.Mesh(fg, fm); flame.position.set(fireP.x, fireY - 1, fireP.z); flame.frustumCulled = false; flame.renderOrder = 3; scene.add(flame);
    }
    // its smoke: a thin column lit red from beneath, leaning and thinning, the stars seen through it
    const smoke = fx.makeSmokeColumn({ rng: fk.smoke, time: shared.uTime, position: [fireP.x, fireY + FIRE_H * 0.62, fireP.z], height: 250, radius: [3, 19], size: [11, 44], count: 70,
      color: '#5a2c62', colorTop: '#3c3a86', shadowColor: '#1f1240', ambient: '#1c1232', hot: '#ff3b2f', hotFalloff: 150, opacity: 0.3, rate: 0.03, wind: [side * 1.6, 0, -0.8], bend: 0.6, rim: 0.25, scatter: 0.3,
      sunDir: [0.1, -1, 0.1], sunColor: '#ff5040' });
    smoke.object.renderOrder = 2; scene.add(smoke.object);
    const fireSparks = fx.makeParticles({ rng: fk.fireSparks, preset: 'embers', time: shared.uTime, follow: false, center: [fireP.x, fireY + 80, fireP.z], box: [80, 170, 80], count: Math.round(420 * detail),
      colors: ['#ff4a32', '#ffa070', '#ff2030'], size: [0.5, 1.5], intensity: 2.2 });
    scene.add(fireSparks.object); ups.push(fireSparks);
    const fireGlow = fx.makeGlows({ time: shared.uTime, positions: [[fireP.x, fireY + 30, fireP.z]], colors: [[1.0, 0.12, 0.08]], size: 170, intensity: 0.1, core: 0, flicker: 0.05, renderOrder: 2, fogAmount: 0.3 });
    scene.add(fireGlow.object);
    U.uFire.value.set(fireP.x, fireP.z, 95, 2.6);
    uPil.value[1].set(fireP.x, fireY, fireP.z, FIRE_H); uPilCol.value[1].set(1.0, 0.1, 0.07, 1);
    const fireGaze = new THREE.Vector3(fireP.x, fireY + 46, fireP.z);
    await ctx.yield();

    // ------------------------------------------------------------ the hole in the river of heaven, and the bridge of light that carries the rails out over it
    {
      const wC = V3(WELL_S, WELL_D, 0);
      // The hole in the stars, standing over the far side of the well: a soft dark into which the stars stream, a rim of faint
      // blue, a few cold sparks deep inside. The haze over the river hides it from far up the river (by distance, in the shader).
      const hm = new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime, uC: { value: wC } },
        vertexShader: /* glsl */`uniform vec3 uC; varying vec2 vUv; varying float vShow;
          void main(){ vUv = uv * 2. - 1.; vShow = 1. - smoothstep(380., 900., distance(cameraPosition.xz, uC.xz)); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
        fragmentShader: fx.GLSL_NOISE + /* glsl */`uniform float uTime; varying vec2 vUv; varying float vShow;
          void main(){
            vec2 p = clamp(vUv, -1., 1.); float r0 = length(p), ang = atan(p.y, p.x + 1e-5);
            float r = r0 + (fbm(p * 2.2 + vec2(0., uTime * .004)) - .5) * .16;
            float a = 1. - smoothstep(.3, .8, r); a = a * a * (3. - 2. * a);
            vec3 col = vec3(.07, .14, .5) * exp(-(r - .74) * (r - .74) * 26.) * .4;
            for (int k = 0; k < 3; k++) {                                // stars drawn out into fine streaks as they fall in to the rim
              float n = k == 0 ? 520. : (k == 1 ? 340. : 210.), c = ang / 6.2831853 * n, id = floor(c), f = fract(c) - .5, h = hash11(id + float(k) * 77.3);
              float tt = fract(h * 9.7 + uTime * (.012 + .016 * h)), rp = mix(1., .66, tt), len = .012 + .05 * tt;
              float al = smoothstep(rp, rp + len * .15, r0) * (1. - smoothstep(rp + len * .15, rp + len, r0));
              col += vec3(.8, .88, 1.) * exp(-f * f * 30.) * al * step(.4, h) * smoothstep(.66, .72, rp) * (1. - smoothstep(.92, 1., rp)) * .9;
            }
            vec2 g = p * 9., gi = floor(g), gf = fract(g) - .5; float gh = hash12(gi + 5.);
            vec2 go = (vec2(hash12(gi + 1.3), hash12(gi + 8.7)) - .5) * .6;
            float sp = (1. - smoothstep(.02, .07, length(gf - go))) * step(.82, gh) * (.3 + .7 * abs(sin(uTime * (.3 + gh) + gh * 40.)));
            col += vec3(.45, .6, 1.) * sp * smoothstep(.05, .5, r0) * (1. - smoothstep(.5, .66, r0)) * .9 * a;
            vec2 g2 = p * 21. + 3.7, gi2 = floor(g2), gf2 = fract(g2) - .5; float gh2 = hash12(gi2 + 2.);
            col += vec3(.35, .5, 1.) * (1. - smoothstep(.03, .09, length(gf2 - (vec2(hash12(gi2 + 4.1), hash12(gi2 + 6.3)) - .5) * .6))) * step(.86, gh2) * (.4 + .6 * abs(sin(uTime * (.2 + gh2) + gh2 * 31.))) * (1. - smoothstep(.2, .46, r0)) * .5 * a;
            gl_FragColor = vec4(col * vShow, a * vShow);
          }`,
        transparent: false, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
      });
      const sack = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1000), hm); sack.position.copy(V3(WELL_S + 1000, WELL_D - 30, 150)); sack.frustumCulled = false; sack.renderOrder = -0.8; scene.add(sack);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(3200, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
      floor.position.set(wC.x, -760, wC.z); floor.frustumCulled = false; scene.add(floor);
      // depth in the well: cold sparks deeper and deeper, smaller and fainter as they go
      const wl2 = fk.well, deepPos = [], deepSize = [], deepCol = [];
      for (let i = 0; i < 18; i++) { const a = wl2.range(0, TAU), rr = wl2.range(0, 150), t = (i + wl2()) / 18, y = -50 - 640 * t * t; deepPos.push([wC.x + Math.cos(a) * rr, y, wC.z + Math.sin(a) * rr]); deepSize.push(lerp(9, 3, t)); deepCol.push(mulc([0.5, 0.66, 1.0], lerp(1, 0.35, t))); }
      const deep = fx.makeGlows({ time: shared.uTime, positions: deepPos, colors: deepCol, sizes: deepSize, size: 1, intensity: 1.1, core: 0.7, halo: 0.6, flicker: 0.2, renderOrder: 2, fogAmount: 0 });
      deep.object.frustumCulled = false; scene.add(deep.object); ups.push(deep);
      // The falls: all round the well a wall goes down from its lip. Where the river reaches the lip its light breaks over into
      // threads and veils of falling starlight that fade as they go down; where land reaches it there is dim rock and a faint blue rim.
      {
        const NA = 168, NV = 12, P = [], A = [], idx = [], wRaw = [], wSm = [];
        for (let i = 0; i <= NA; i++) wRaw.push(lipWater(-Math.PI + i / NA * TAU));
        for (let i = 0; i <= NA; i++) { let a = 0; for (let k = -2; k <= 2; k++) a += wRaw[(i + k + NA) % NA]; wSm.push(a / 5); }
        for (let i = 0; i <= NA; i++) {
          const th = -Math.PI + i / NA * TAU, q0 = lipAt(th), y0 = lerp(groundY(q0[0], q0[1])[0], 0, smoothstep(0, 0.5, wSm[i]));
          for (let j = 0; j <= NV; j++) {
            const v = j / NV, r = WELL_R - 15 * (1 - Math.exp(-v * 6)) - 5 * v, sq = WELL_S - r * Math.cos(th), dq = WELL_D + r * Math.sin(th), dp = 150 * Math.pow(v, 1.7);
            P.push(X(sq, dq), y0 - dp, Z(sq)); A.push(th * WELL_R, dp, wSm[i]);
          }
        }
        for (let i = 0; i < NA; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
        const fg2 = new THREE.BufferGeometry(); fg2.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg2.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); fg2.setIndex(idx);
        const fallMat = new THREE.ShaderMaterial({
          uniforms: { uTime: shared.uTime, uBright: U.uBright, uFogDen: shared.uFogDen },
          vertexShader: /* glsl */`attribute vec3 aA; varying vec3 vA; varying float vFog; uniform float uFogDen;
            void main(){ vA = aA; vec4 w = modelMatrix * vec4(position, 1.); float d = length(cameraPosition - w.xyz); vFog = exp(-d * d * uFogDen * uFogDen * .5); gl_Position = projectionMatrix * viewMatrix * w; }`,
          fragmentShader: fx.GLSL_NOISE + SPARK_GLSL + /* glsl */`uniform float uTime, uBright; varying vec3 vA; varying float vFog;
            void main(){
              float x = vA.x, dp = max(vA.y, 0.), w = clamp(vA.z, 0., 1.), wf = max(w, .28);
              float yy = sqrt(dp + 1.) * 2.2 - uTime * 1.5;
              float t1 = vnoise(vec2(x * 1.1, yy * .5)), t2 = vnoise(vec2(x * 3.1 + 9., yy * .9 + 4.));
              float threads = pow(clamp(1. - abs(t1 * 2. - 1.), 0., 1.), 5.) + .6 * pow(clamp(1. - abs(t2 * 2. - 1.), 0., 1.), 7.);
              float veil = fbm(vec2(x * .06, yy * .22)), fade = exp(-dp / 42.), h1;
              float stars = spark(vec2(x * .7, dp * .25 - uTime * 3.), 1., .12, uTime, h1);
              vec3 col = (vec3(.26, .4, 1.) * (.1 + .8 * veil * veil) + vec3(.7, .82, 1.) * threads * (.25 + .75 * veil) + vec3(.9, .95, 1.) * stars * 2.) * fade * wf;
              col += vec3(.5, .66, 1.) * exp(-dp / 3.) * (.5 * w + .1);
              col += vec3(.02, .035, .09) * (.4 + .6 * fbm(vec2(x * .08, dp * .12))) * exp(-dp / 30.) * (1. - w);
              gl_FragColor = vec4(col * uBright * vFog, 1.);
            }`,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        });
        const falls = new THREE.Mesh(fg2, fallMat); falls.frustumCulled = false; falls.renderOrder = 1; scene.add(falls);
      }
      // the bridge
      const g = makeG(), glow = [0.5, 0.62, 1.0], at = (s, lat, y) => { const f = trackFrame(s); return [f.x - f.tz * lat, RAIL + y, f.z + f.tx * lat]; };
      const B0 = S_RIM - 5, B1 = S_END + 1.5;
      for (let s = B0; s < B1 - 0.01; s += 2.5) {
        const s1 = Math.min(s + 2.5, B1), hw = 2.4;
        g.col([0.1, 0.13, 0.26], 0.3).em(mulc(glow, 0.09)).quad(at(s, -hw, -0.26), at(s, hw, -0.26), at(s1, hw, -0.26), at(s1, -hw, -0.26), [0, 1, 0]);
        g.col([0.1, 0.12, 0.2], 0.3).em(mulc(glow, 0.22)).quad(at(s, -hw, -0.75), at(s, hw, -0.75), at(s1, hw, -0.75), at(s1, -hw, -0.75), [0, -1, 0]);
        for (const sx of [-1, 1]) {
          g.col([0.5, 0.6, 0.9], 0.5).em(mulc(glow, 1.2)).quad(at(s, sx * hw, -0.75), at(s1, sx * hw, -0.75), at(s1, sx * hw, -0.14), at(s, sx * hw, -0.14), [sx, 0, 0]);
          g.em(mulc(glow, 1.6)).quad(at(s, sx * (hw - 0.07), 0.98), at(s1, sx * (hw - 0.07), 0.98), at(s1, sx * (hw + 0.07), 0.98), at(s, sx * (hw + 0.07), 0.98), [0, 1, 0]).quad(at(s, sx * hw, 0.86), at(s1, sx * hw, 0.86), at(s1, sx * hw, 1.0), at(s, sx * hw, 1.0), [sx, 0, 0]);
        }
      }
      for (let s = B0 + 2.5; s < B1; s += 5) for (const sx of [-1, 1]) { const a = at(s, sx * 2.4, 0), b = at(s + 0.12, sx * 2.4, 0);
        g.col([0.4, 0.5, 0.8], 0.5).em(mulc(glow, 1.2)).quad([a[0], RAIL - 0.2, a[2]], [b[0], RAIL - 0.2, b[2]], [b[0], RAIL + 0.9, b[2]], [a[0], RAIL + 0.9, a[2]], [sx, 0, 0]); }
      // piers and arches of light going down into the dark, fainter with depth
      const SPAN = 21;
      for (let s = B0 + 8; s < B1 + 2; s += SPAN) {
        for (const sx of [-1, 1]) for (const tw of [0, 1.1]) for (let k = 0; k < 10; k++) { const y0 = -0.75 - k * 6, y1 = y0 - 6, f = Math.pow(0.74, k) * (tw ? 0.5 : 1), a = at(s + tw, sx * 1.9, 0), b = at(s + tw + 0.3, sx * 1.9, 0);
          g.col([0.2, 0.26, 0.45], 0.4, f).em(mulc(glow, 1.3 * f)).quad([a[0], RAIL + y0, a[2]], [b[0], RAIL + y0, b[2]], [b[0], RAIL + y1, b[2]], [a[0], RAIL + y1, a[2]], [sx, 0, 0]); }
        if (s + SPAN < B1 + 2) for (const sx of [-1, 1]) for (let k = 0; k < 10; k++) {
          const t0 = k / 10, t1 = (k + 1) / 10, y = (t) => -0.75 - 7.5 * (1 - Math.sin(Math.PI * t)), a = at(s + SPAN * t0, sx * 1.9, y(t0)), b = at(s + SPAN * t1, sx * 1.9, y(t1));
          g.col([0.3, 0.4, 0.7], 0.4).em(mulc(glow, 1.0)).quad([a[0], a[1] - 0.35, a[2]], [b[0], b[1] - 0.35, b[2]], b, a, [sx, 0, 0]);
        }
      }
      // the gate of light the rails end in: an arch just before the portal
      const fe = trackFrame(S_END - 0.45), cy = RAIL + 4.8 - 0.7, RR = 5.95, post = (lat, y) => [fe.x - fe.tz * lat, y, fe.z + fe.tx * lat];
      for (let k = 0; k < 24; k++) { const a0 = k / 24 * Math.PI, a1 = (k + 1) / 24 * Math.PI, p = (a, r) => post(Math.cos(a) * r, cy + Math.sin(a) * r);
        g.col([0.6, 0.7, 1.0], 0.6).em(mulc(glow, 1.9)).quad(p(a0, RR), p(a1, RR), p(a1, RR + 0.5), p(a0, RR + 0.5), [fe.tx * -1, 0, fe.tz * -1]); }
      for (const sx of [-1, 1]) g.quad(post(sx * RR, RAIL - 0.75), post(sx * (RR + 0.5), RAIL - 0.75), post(sx * (RR + 0.5), cy), post(sx * RR, cy), [-fe.tx, 0, -fe.tz]);
      g.col([0.1, 0.13, 0.26], 0.3).em(mulc(glow, 0.09)).quad(post(-RR - 0.5, RAIL - 0.26), post(RR + 0.5, RAIL - 0.26), [post(RR + 0.5, 0)[0] - fe.tx * 9, RAIL - 0.26, post(RR + 0.5, 0)[2] - fe.tz * 9], [post(-RR - 0.5, 0)[0] - fe.tx * 9, RAIL - 0.26, post(-RR - 0.5, 0)[2] - fe.tz * 9], [0, 1, 0]);
      scene.add(new THREE.Mesh(g.build(), propMat));
      scene.add(new THREE.Mesh(trackGeometry(trackFrame, { s0: S_RIM, s1: S_END + 1.5, bed: 0, railGlow: [0.5, 0.62, 1.0], sleeper: [0.1, 0.13, 0.28], step: 2.5 }), propMat));
    }
    await ctx.yield();

    // ------------------------------------------------------------ herons: white birds coming down like snow onto the crystal sand, melting into it with a glow
    const heronU = { uTime: shared.uTime, uFogCol: shared.uFogCol, uFogDen: shared.uFogDen };
    const HERON_PARS = /* glsl */`attribute vec4 aLand; attribute vec4 aSched; uniform float uTime;`;
    {
      const hr = fk.herons, P = [], Wg = [], idx = [];
      const v = (x, y, z, w = 0, leg = 0) => { P.push(x, y, z); Wg.push(w, leg); return P.length / 3 - 1; };
      const tri = (a, b, c) => idx.push(a, b, c);
      { const n = v(0, 0.02, 0.5), t = v(0, 0.03, -0.55), up = v(0, 0.13, 0), dn = v(0, -0.12, 0), l = v(-0.11, 0, 0), r = v(0.11, 0, 0);
        tri(n, up, r); tri(n, r, dn); tri(n, dn, l); tri(n, l, up); tri(t, r, up); tri(t, dn, r); tri(t, l, dn); tri(t, up, l);
        const k0 = v(-0.03, 0.03, 0.45), k1 = v(0.03, 0.03, 0.45), k2 = v(0.028, 0.2, 0.86), k3 = v(-0.028, 0.2, 0.86), bk = v(0, 0.17, 1.2); tri(k0, k1, k2); tri(k0, k2, k3); tri(k3, k2, bk);
        for (const sx of [-1, 1]) { const a = v(sx * 0.05, -0.06, -0.3), b = v(sx * 0.05, -0.1, -0.36), c = v(sx * 0.05, -0.2, -1.15, 0, 1); tri(a, b, c); } }
      for (const sx of [-1, 1]) {
        const a0 = v(sx * 0.1, 0.03, 0.2, sx * 0.1), a1 = v(sx * 0.1, 0.03, -0.26, sx * 0.1), b0 = v(sx * 0.55, 0.03, 0.22, sx * 0.55), b1 = v(sx * 0.55, 0.03, -0.24, sx * 0.55), c0 = v(sx * 1.0, 0.03, 0.08, sx * 1.0), c1 = v(sx * 0.95, 0.03, -0.2, sx * 0.95);
        tri(a0, b0, b1); tri(a0, b1, a1); tri(b0, c0, c1); tri(b0, c1, b1);
      }
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); hg.setAttribute('aW', new THREE.Float32BufferAttribute(Wg, 2)); hg.setIndex(idx);
      const land = new Float32Array(nHerons * 4), sched = new Float32Array(nHerons * 4);
      let n = 0;
      for (let tries = 0; n < nHerons && tries < nHerons * 20; tries++) {
        const s = hr.range(S_ST - 80, S_ST + 190), dn = hr.range(-2.5, beachW(s) - 0.5), d = dn + shoreOff(s), x = X(s, d), z = Z(s), y = Math.max(groundY(s, d)[0], 0.02);
        const per = hr.range(9, 14), off = hr.range(0, 40), yaw = Math.atan2(side, hr.range(-0.7, 0.7)), rnd = hr(), w0 = hr();
        if (built(s, d, 1)) continue;
        // the whole way down keeps clear of the route in space (height counts), a little more room where the bird still swings from side to side
        let ok = true; const fx0 = Math.sin(yaw), fz0 = Math.cos(yaw);
        for (let k = 0; k <= 14 && ok; k++) { const rem = k / 14; ok = routeDist(x - fx0 * 30 * Math.pow(rem, 1.15), y + 36 * Math.pow(rem, 0.95) + 1.2, z - fz0 * 30 * Math.pow(rem, 1.15)) > 7.5 + 3 * rem; }
        if (!ok) continue;
        land.set([x, y, z, rnd], n * 4);
        sched.set([per, off, yaw, w0], n * 4); n++;
      }
      hg.setAttribute('aLand', new THREE.InstancedBufferAttribute(land, 4)); hg.setAttribute('aSched', new THREE.InstancedBufferAttribute(sched, 4));
      const hm = new THREE.ShaderMaterial({
        uniforms: heronU,
        vertexShader: HERON_PARS + /* glsl */`attribute vec2 aW; varying vec3 vW; varying float vGlow; varying float vY; varying float vR;
          void main(){
            float ph = fract((uTime + aSched.y) / aSched.x), rem = 1. - clamp(ph / .5, 0., 1.);
            float brake = smoothstep(.38, .5, ph), fold = smoothstep(.5, .56, ph), flat_ = smoothstep(.74, .82, ph), gone = smoothstep(.88, .97, ph);
            float flap = uTime * (4.4 + aLand.w * 1.6) + aLand.w * 40.;
            float th1 = (mix(.08, .7, brake) + mix(.6, .28, brake) * sin(flap)) * (1. - fold) - 1.3 * fold * (1. - flat_), th2 = th1 + .5 * sin(flap - 1.) * (1. - fold) - .5 * fold * (1. - flat_);
            vec3 p = position; float r = abs(aW.x);
            if (r > .05) { float ri = min(r, .55) - .1, ro = max(r - .55, 0.); p.x = sign(aW.x) * (.1 + cos(th1) * ri + cos(th2) * ro); p.y += sin(th1) * ri + sin(th2) * ro; }
            // it rears up as it brakes and stands upright on the sand, neck high, legs under it
            float pitch = (.5 * brake + .55 * fold) * (1. - flat_), cpi = cos(pitch), spi = sin(pitch);
            p.yz = vec2(cpi * p.y + spi * p.z, -spi * p.y + cpi * p.z);
            p = mix(p, vec3(p.x, -.78, -.1), clamp(aW.y, 0., 1.) * brake * (1. - flat_));
            vY = p.y; vR = r;
            p *= 1.6 * smoothstep(0., .05, ph); p.y *= 1. - .93 * flat_; p.xz *= max(1. + .25 * flat_ - 1.25 * gone, 0.);
            float c = cos(aSched.z), s = sin(aSched.z); p.xz = vec2(c * p.x + s * p.z, -s * p.x + c * p.z);
            vec3 f = vec3(s, 0., c), sd = vec3(c, 0., -s);
            vec3 pos = aLand.xyz - f * 30. * pow(rem, 1.15) + vec3(0., 36. * pow(rem, .95) + mix(.85, 1.27, brake) * (1. - .93 * flat_), 0.) + sd * sin(uTime * .7 + aLand.w * 30.) * 3. * rem;
            vW = pos + p; vGlow = flat_ * (1. - gone);
            gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
          }`,
        fragmentShader: FOG_GLSL + /* glsl */`varying vec3 vW; varying float vGlow; varying float vY; varying float vR;
          void main(){ vec3 col = mix(vec3(.78, .84, .98), vec3(.36, .44, .78), clamp(vR, 0., 1.) * .75) * (.55 + .5 * clamp(vY * 2. + .5, 0., 1.)) + vec3(.7, .85, 1.) * vGlow * 1.8; gl_FragColor = vec4(applyFog(col, vW), 1.); }`,
        side: THREE.DoubleSide,
      });
      const herons = new THREE.InstancedMesh(hg, hm, Math.max(n, 1)); herons.count = n; herons.frustumCulled = false; scene.add(herons);
      const pg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); pg.setAttribute('aLand', hg.getAttribute('aLand')); pg.setAttribute('aSched', hg.getAttribute('aSched'));
      const pm = new THREE.ShaderMaterial({
        uniforms: heronU,
        vertexShader: HERON_PARS + /* glsl */`varying vec2 vUv; varying float vA;
          void main(){ float ph = fract((uTime + aSched.y) / aSched.x); vA = smoothstep(.72, .82, ph) * (1. - smoothstep(.88, 1., ph)); vUv = uv * 2. - 1.;
            vec3 w = aLand.xyz + vec3(position.x * 3.6, .12, position.z * 3.6) * (.6 + .5 * smoothstep(.82, 1., ph)); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
        fragmentShader: /* glsl */`varying vec2 vUv; varying float vA;
          void main(){ float r = clamp(length(vUv), 0., 1.), a = (1. - r); a = a * a * (1. + 3. * a * a); gl_FragColor = vec4(vec3(.7, .84, 1.) * a * vA * .4, 1.); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const pools = new THREE.InstancedMesh(pg, pm, Math.max(n, 1)); pools.count = n; pools.frustumCulled = false; pools.renderOrder = 1; scene.add(pools);
    }
    await ctx.yield();

    // ------------------------------------------------------------ dolphins of light: pods along the river, leaping in arcs and falling back with rings
    {
      const dr = fk.dolphins, P = [], idx = [], NSD = 7, LEAP = 0.32;
      const prof = [[-1.25, 0.02], [-1.0, 0.07], [-0.6, 0.17], [-0.1, 0.25], [0.4, 0.24], [0.8, 0.17], [1.08, 0.085], [1.3, 0.02]];
      for (let i = 0; i < prof.length; i++) for (let j = 0; j < NSD; j++) { const a = j / NSD * TAU; P.push(Math.cos(a) * prof[i][1] * 0.8, Math.sin(a) * prof[i][1], prof[i][0]); }
      for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < NSD; j++) { const a = i * NSD + j, b = i * NSD + (j + 1) % NSD; idx.push(a, b, a + NSD, b, b + NSD, a + NSD); }
      const fin = (p0, p1, p2) => { const k = P.length / 3; P.push(...p0, ...p1, ...p2); idx.push(k, k + 1, k + 2); };
      fin([0, 0.22, 0.25], [0, 0.22, -0.3], [0, 0.6, -0.28]);
      for (const sx of [-1, 1]) { fin([0, 0, -1.18], [sx * 0.44, 0.02, -1.58], [0, 0, -1.4]); fin([sx * 0.18, -0.1, 0.45], [sx * 0.52, -0.3, 0.15], [sx * 0.16, -0.12, 0.2]); }
      const homes = [], leaps = [];
      const wet = (s, d) => d < shoreOff(s) - 7 && d > -Wr(s) + 7 && wellOver(s, d) < -20 && Math.hypot(s - S_ISLE, d - ISLE_D) > 36 && Math.hypot(s - S_X2, d - X2_D) > 14;
      // a pod at every 26 to 48 m of river, more of them in the deeper water under the railway bank than toward the far side; each
      // pod has its own period and its own start in it
      for (let s0 = dr.range(30, 70); s0 < S_RIM - 60; s0 += dr.range(26, 48)) {
        const r = dr(), dC = -(14 + (Wr(s0) - 28) * r * r), n = 3 + Math.floor(dr() * 3), per = dr.range(4.2, 6.6), ph0 = dr.range(0, per), turn = dr.range(-0.25, 0.25);
        for (let j = 0; j < n; j++) {
          const ds = dr.range(-10, 10), dd = dr.range(-5, 5), len = dr.range(8, 12.5), hgt = dr.range(2.6, 4.4), jit = dr.range(-0.3, 0.3), tw = turn + dr.range(-0.12, 0.12);
          if (!wet(s0 + ds, dC + dd)) continue;
          const x = X(s0 + ds, dC + dd), z = Z(s0 + ds), x1 = X(s0 + ds + Math.cos(tw), dC + dd + Math.sin(tw)), z1 = Z(s0 + ds + Math.cos(tw)), l = Math.hypot(x1 - x, z1 - z) || 1, fx1 = (x1 - x) / l, fz1 = (z1 - z) / l;
          let ok = true; for (let q = 0; q <= 10 && ok; q++) { const t = q / 10; ok = routeDist(x + fx1 * (t - 0.5) * len, hgt * 4 * t * (1 - t), z + fz1 * (t - 0.5) * len) > 16; }       // the whole arc keeps clear of the route
          if (!ok) continue;
          homes.push(x, z, fx1, fz1); leaps.push(per, ph0 + per * (j / n) + jit, len, hgt);
        }
      }
      const nD = homes.length / 4;
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dg.setIndex(idx);
      const aHome = new THREE.InstancedBufferAttribute(new Float32Array(homes), 4), aLeap = new THREE.InstancedBufferAttribute(new Float32Array(leaps), 4);
      dg.setAttribute('aHome', aHome); dg.setAttribute('aLeap', aLeap);
      const DOLPHIN_PARS = /* glsl */`attribute vec4 aHome; attribute vec4 aLeap; uniform float uTime;`;
      const dm = new THREE.ShaderMaterial({
        uniforms: heronU,
        vertexShader: DOLPHIN_PARS + /* glsl */`varying vec3 vW; varying vec3 vP;
          void main(){
            float ph = fract((uTime + aLeap.y) / aLeap.x), t = clamp(ph / ${LEAP}, 0., 1.), on = step(ph, ${LEAP});
            float slope = aLeap.w * 4. * (1. - 2. * t) / max(aLeap.z, 1.), cp = inversesqrt(1. + slope * slope), sp = slope * cp;
            vec3 p = position * 2. * on; vP = position;
            p.yz = vec2(cp * p.y + sp * p.z, -sp * p.y + cp * p.z);
            p.z += (t - .5) * aLeap.z; p.y += aLeap.w * 4. * t * (1. - t) - .45;
            vW = vec3(aHome.x, 0., aHome.y) + vec3(aHome.w, 0., -aHome.z) * p.x + vec3(0., p.y, 0.) + vec3(aHome.z, 0., aHome.w) * p.z;
            gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
          }`,
        fragmentShader: fx.GLSL_NOISE + FOG_GLSL + /* glsl */`uniform float uTime; varying vec3 vW; varying vec3 vP;
          void main(){
            vec3 n = normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0., 1e-6, 0.)), v = normalize(cameraPosition - vW);
            float fr = pow(1. - clamp(abs(dot(n, v)), 0., 1.), 2.);
            vec2 q = vP.xz * 9. + vP.y * 5.; float tw = step(.8, hash12(floor(q))) * (.5 + .5 * sin(uTime * 6. + hash12(floor(q) + 3.) * 40.));
            vec3 col = mix(vec3(.2, .46, 1.), vec3(.75, .9, 1.), smoothstep(-.2, .22, vP.y)) * 1.05 + vec3(.9, .95, 1.) * (fr * 1.1 + tw * .9);
            gl_FragColor = vec4(applyFog(col, vW), 1.);
          }`,
        side: THREE.DoubleSide,
      });
      const dolphins = new THREE.InstancedMesh(dg, dm, Math.max(nD, 1)); dolphins.count = nD; dolphins.frustumCulled = false; scene.add(dolphins);
      // the rings: one where each breaks the water, one where it falls back
      const rg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), kinds = new Float32Array(nD * 2), h2 = new Float32Array(nD * 8), l2 = new Float32Array(nD * 8);
      for (let i = 0; i < nD; i++) for (let k = 0; k < 2; k++) { kinds[i * 2 + k] = k; for (let c = 0; c < 4; c++) { h2[(i * 2 + k) * 4 + c] = homes[i * 4 + c]; l2[(i * 2 + k) * 4 + c] = leaps[i * 4 + c]; } }
      rg.setAttribute('aHome', new THREE.InstancedBufferAttribute(h2, 4)); rg.setAttribute('aLeap', new THREE.InstancedBufferAttribute(l2, 4)); rg.setAttribute('aKind', new THREE.InstancedBufferAttribute(kinds, 1));
      const rm = new THREE.ShaderMaterial({
        uniforms: heronU,
        vertexShader: DOLPHIN_PARS + /* glsl */`attribute float aKind; varying vec2 vUv; varying float vA; varying float vR; varying float vAge;
          void main(){
            float ph = fract((uTime + aLeap.y) / aLeap.x), age = (aKind < .5 ? ph : ph - ${LEAP}) * aLeap.x;
            vA = step(0., age) * (1. - smoothstep(1.1, 2.6, age)); vR = 1.6 + max(age, 0.) * 2.8; vAge = age; vUv = position.xz * 2.;
            vec2 c = aHome.xy + aHome.zw * (aKind - .5) * aLeap.z;
            gl_Position = projectionMatrix * viewMatrix * vec4(c.x + position.x * vR * 2., .07, c.y + position.z * vR * 2., 1.);
          }`,
        fragmentShader: /* glsl */`varying vec2 vUv; varying float vA; varying float vR; varying float vAge;
          void main(){
            float r = clamp(length(vUv), 0., 1.), R = clamp(vR, 1., 9.), x = (r - .84) * R, x2 = x + 1.3;
            float ring = (exp(-x * x * 5.) + .5 * exp(-x2 * x2 * 6.) * smoothstep(2.2, 3.4, R)) * (1. - smoothstep(.92, 1., r));
            float splash = exp(-r * r * R * R * 1.4) * (1. - smoothstep(.1, .6, clamp(vAge, 0., 1.))) * 2.2;
            gl_FragColor = vec4(vec3(.66, .82, 1.) * (ring * .85 + splash) * vA, 1.);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const rings = new THREE.InstancedMesh(rg, rm, Math.max(nD * 2, 1)); rings.count = nD * 2; rings.frustumCulled = false; rings.renderOrder = 1; scene.add(rings);
    }
    await ctx.yield();

    // ------------------------------------------------------------ wild geese crossing high, crystal fireflies in the grass, falling stars
    const birdLight = { sunDir: [keyDir.x, -0.5, keyDir.z], sunColor: '#aebcff', sunIntensity: 1.5, sky: '#5a50b0', skyIntensity: 1.3, ground: '#9fb0f0', groundIntensity: 1.3 };
    const geese = F.makeFlock({ rng: fk.geese, species: 'geese', count: Math.round(rv.range(13, 21)), size: 1.5, light: birdLight,
      cross: { path, u: uAtS(S_ST + 46), lead: 48, height: 12, angle: 62, side: -side, span: 520, duration: DUR } });     // they cross over the widest sand of the crystal shore (where beachW has its top)
    scene.add(geese.object);
    // crystal fireflies: most of them over the pampas and the sand of the railway bank, the rest low over the river; none inside the lane
    const flyPts = [];
    for (let i = 0, tries = 0, fl = fk.flies, nFly = Math.round(460 * detail * lush); i < nFly && tries < nFly * 8; tries++) {
      const s = fl.range(0, S_RIM - 25), d = fl.chance(0.7) ? fl.range(-20, 50) : -fl.range(0, Wr(s) - 5), y = Math.max(groundY(s, d)[0], 0) + fl.range(0.6, 3.6), x = X(s, d), z = Z(s);
      if (built(s, d, 1) || routeDist(x, y, z) < 5.5) continue;
      flyPts.push([x, y, z]); i++;
    }
    const fireflies = F.makeFireflies({ rng: fk.flies, positions: flyPts, count: flyPts.length, color: '#bfe2ff', color2: '#ffffff', size: 0.2, blink: 0.5 });
    scene.add(fireflies.object);
    const shooting = fx.makeShootingStars({ rng: fk.shoot, time: shared.uTime, count: 12, period: [3, 9], color: '#eef3ff', tailColor: '#8fa8ff', intensity: 4 });
    scene.add(shooting.object);
    // stars that fall into the river: each has its own place on the water and its own period on the world clock; a streak down,
    // then rings of light spreading where it went in. All of them run always, wherever we are.
    {
      const ir = fk.impacts, hits = [], froms = [], FALL = 1.0;
      for (let s0 = 40; s0 < S_RIM - 40; s0 += 26) {
        const s = s0 + ir.range(0, 22), d = -(8 + ir() * (Wr(s) - 16)), per = ir.range(4.5, 8.5), off = ir.range(0, 9), ox = ir.range(-30, 30), oz = ir.range(20, 60), x = X(s, d), z = Z(s);
        let ok = true; for (let k = 0; k <= 10 && ok; k++) ok = routeDist(x + ox * k / 10, 95 * k / 10, z + oz * k / 10) > 10;       // the streak's whole line keeps clear of the route
        if (ok) { hits.push(x, z, per, off); froms.push(ox, oz); }
      }
      const nHit = hits.length / 4, aHit = new THREE.InstancedBufferAttribute(new Float32Array(hits), 4);
      const STRIKE_PARS = /* glsl */`attribute vec4 aHit; uniform float uTime;
        float strikeAge(){ float per = max(aHit.z, 1.), t = uTime + aHit.w; return t - floor(t / per) * per - ${FALL.toFixed(1)}; }`;
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3)); sg.setIndex([0, 1, 2, 2, 1, 3]);
      sg.setAttribute('aHit', aHit); sg.setAttribute('aFrom', new THREE.InstancedBufferAttribute(new Float32Array(froms), 2));
      const streaks = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime },
        vertexShader: STRIKE_PARS + /* glsl */`attribute vec2 aFrom; varying vec2 vUv;
          void main(){
            float age = strikeAge(), f = clamp(1. + age / ${FALL.toFixed(1)}, 0., 1.), k = 1. - f + min(f, .22) * position.y;
            vec3 p = vec3(aHit.x + aFrom.x * k, 95. * k, aHit.y + aFrom.y * k), t = normalize(vec3(aFrom.x, 95., aFrom.y)), toC = cameraPosition - p;
            vec3 nrm = normalize(cross(t, toC) + vec3(1e-5, 0., 0.));
            float wd = max(.35, length(toC) * .0022) * (1. - .8 * position.y); vUv = position.xy;
            gl_Position = projectionMatrix * viewMatrix * vec4(p + nrm * wd * position.x, 1.);
            if (age > .06) gl_Position = vec4(2., 2., 2., 1.);
          }`,
        fragmentShader: /* glsl */`varying vec2 vUv; void main(){ float x = clamp(abs(vUv.x), 0., 1.), a = (1. - x) * (1. - x) * (1. - clamp(vUv.y, 0., 1.)); gl_FragColor = vec4(vec3(.85, .92, 1.) * a * 3.2, 1.); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }), Math.max(nHit, 1));
      streaks.count = nHit; streaks.frustumCulled = false; streaks.renderOrder = 3; scene.add(streaks);
      const hg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); hg.setAttribute('aHit', aHit);
      const hitRings = new THREE.InstancedMesh(hg, new THREE.ShaderMaterial({
        uniforms: { uTime: shared.uTime, uBright: U.uBright },
        vertexShader: STRIKE_PARS + /* glsl */`varying vec2 vUv; varying float vAge;
          void main(){
            vAge = strikeAge(); vUv = position.xz * 2.;
            gl_Position = projectionMatrix * viewMatrix * vec4(aHit.x + position.x * 34., .07, aHit.y + position.z * 34., 1.);
            if (vAge < 0. || vAge > 3.) gl_Position = vec4(2., 2., 2., 1.);
          }`,
        fragmentShader: /* glsl */`uniform float uBright; varying vec2 vUv; varying float vAge;
          void main(){
            float age = clamp(vAge, 0., 3.), r = clamp(length(vUv), 0., 1.) * 17., R0 = 1.4 + age * 4.4, wd = .14 + age * .3;
            float a1 = r - R0, a2 = a1 + 2.4, a3 = a1 + 4.6;
            float ring = (exp(-a1 * a1 / wd) + .55 * exp(-a2 * a2 / wd) * smoothstep(2.4, 4., R0) + .3 * exp(-a3 * a3 / wd) * smoothstep(4.6, 6.5, R0)) * clamp(1. - age / 3., 0., 1.) + exp(-r * r / 5.) * clamp(1. - age * 1.6, 0., 1.) * 1.6;
            gl_FragColor = vec4(vec3(.8, .9, 1.) * ring * 1.5 * uBright * (1. - smoothstep(15.5, 17., r)), 1.);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }), Math.max(nHit, 1));
      hitRings.count = nHit; hitRings.frustumCulled = false; hitRings.renderOrder = 1; scene.add(hitRings);
    }
    // lamps of the station; on a rare night the passengers, as small lamps only, cross the sand and the water toward the white cross
    const lamps = fx.makeGlows({ time: shared.uTime, positions: lampPts, colors: lampCols, sizes: lampSizes, size: 1, intensity: 1.3, flicker: 0.05, renderOrder: 4 });
    scene.add(lamps.object);
    let walkers = null; const walkLine = [], walkPh = [];
    if (rare) {
      const a = stW(0, 0.3, 9), b = V3(S_ST - 30, shoreOff(S_ST - 30) - 1, 1.3), c = new THREE.Vector3(isleP.x, 1.6, isleP.z);
      a.y = groundY(S_ST, TRACK_D - 9)[0] + 1.2; walkLine.push(a, b, c);
      for (let i = 0; i < 22; i++) walkPh.push(fk.walkers.range(0, TAU));
      walkers = fx.makeGlows({ time: shared.uTime, count: 22, positions: new Float32Array(22 * 3), color: [1.0, 0.76, 0.4], size: 2.3, intensity: 2.0, flicker: 0.2, renderOrder: 4 });
      walkers.object.frustumCulled = false; scene.add(walkers.object);
    }
    const placeWalkers = (time, cs) => {
      const l1 = walkLine[0].distanceTo(walkLine[1]), l2 = walkLine[1].distanceTo(walkLine[2]), L = l1 + l2;
      for (let i = 0; i < 22; i++) {
        const f = (cs - (S_ST - PLAT)) / 110 - i * 0.035, dd = f * L, bob = 0.12 * Math.sin(time * 5 + walkPh[i]);       // the first lamp steps down as the train comes to a stand
        if (f <= 0.01 || f >= 0.99) { walkers.setPosition(i, 0, -999, 0); continue; }
        if (dd < l1) _p.lerpVectors(walkLine[0], walkLine[1], dd / l1); else _p.lerpVectors(walkLine[1], walkLine[2], (dd - l1) / l2);
        walkers.setPosition(i, _p.x, _p.y + bob, _p.z);
      }
    };
    await ctx.yield();

    ridges.object.renderOrder = -0.9;
    await sky.prewarm(ctx.renderer, null, scene);

    const _cp = new THREE.Vector3(), _gz = new THREE.Vector3(), endS = S_END;
    // the doors stand open while the train stands and we fly its length
    const doorAt = (u) => win(camSAt(u), S_ST - PLAT, S_ST - PLAT + 14, STOP - 14, STOP);
    const tg = { s: 0, v: 0 }, carOff = train.vehicles[2].off;
    const setChunks = (cs) => { for (const c of chunked) c.mesh.visible = c.s1 > cs - 40 && c.s0 < cs + c.reach; };
    setChunks(0);
    // where we pass a thing: the metre of the route nearest to it in plan; its gaze runs over the GAZE_RUN metres flown before that
    const GAZE_RUN = 150;
    const gazeOn = (p, weight) => {
      let bi = 0, best = 1e18;
      for (let i = 0; i <= RN; i++) { const dx = rX[i] - p.x, dz = rZ[i] - p.z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
      return { at: p, from: clamp((bi - GAZE_RUN) / RL, 0, 1), to: clamp(bi / RL, 0, 1), weight, fade: 0.3 };
    };
    return {
      scene, path, duration: DUR,
      pace: (u) => paceAt(camSAt(u)),
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 30, sway: 0.8, bank: 0.7, nearThrough: 0.3 },
      pois: [
        // one rule for the five standing things: each is looked at over the last GAZE_RUN metres we fly before we pass it (the
        // place on the route nearest to it); the carriage between the station and the observatory is the one moving subject
        gazeOn(crossGaze, 0.5),
        gazeOn(clockGaze, 0.45),
        { at: (time, u) => { timetable(u, tg); const f = trackFrame(tg.s - carOff); return _gz.set(f.x, RAIL + 2.4, f.z); }, from: uAtS(S_ST + 150), to: uAtS(S_OB - 55), weight: 0.45, fade: 0.3 },
        gazeOn(sphGaze, 0.3),
        gazeOn(fireGaze, 0.5),
        gazeOn(cross2Gaze, 0.5),
      ],
      portal: { shape: 'arch', width: 11, height: 9.6, color: '#dfe6ff', glow: 1.1, revealDistance: 330 },
      post: {
        exposure: 1.0, bloom: { strength: 0.42, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#f6f6ff', shadowTint: '#0a0828', vignette: 0.26, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        shared.uTime.value = time;
        camera.getWorldPosition(_cp);
        const cs = -_cp.z;
        sky.update(dt, time, camera); ridges.update(dt, time, camera);
        placeTrain(u); train.speed.value = tt.v; train.door.value = doorAt(u);
        train.update(dt, time, camera);
        placeSpheres(time); placeRing(time);
        for (const o of ups) o.update(dt, time, camera);
        signposts.update(dt, time, camera); sphGlow.update(dt, time, camera); fireGlow.update(dt, time, camera); lamps.update(dt, time, camera);
        spray.update(dt, time, camera); sparks.update(dt, time, camera); smoke.update(dt, time, camera); shooting.update(dt, time, camera);
        geese.update(dt, time, camera, u); fireflies.update(dt, time, camera, u);
        if (walkers) { placeWalkers(time, camSAt(u)); walkers.update(dt, time, camera); }
        setChunks(cs);
      },
      dispose() { hero.dispose?.(); sky.dispose?.(); for (const g of templates) g.dispose(); },
    };
  },
};
