// ONE DROP (pond-drop)
// Following a blue dragonfly over a sunlit lily pond, the camera plunges through the film and keeps
// shrinking: lily stem, tadpole and water fleas, then a bright-field micrograph of Spirogyra, desmids,
// paramecia, rotifers and Stentors round a slowly rolling Volvox (the hero, flown pole to pole), and a
// last dive onto a diatom that swells from a boat into a honeycomb plain whose one shining pore holds
// the portal.
//
// The engine stays in metres; every stage is simply built bigger than the last along one 640 m path.
// Above water the kit does the work (sky, light rig, lake, lily pads, reeds, dragonflies, pollen/rain).
// Below it nothing is lit: organisms are "glass" that multiplies the luminous field (the hero's recipe:
// out = dst * a + rgb), with opaque stained-glass organelles, focus instead of fog, and a swell that
// grows every body as the camera nears it. The moonlit look turns the same shaders into dark field.
//
// Looks by seed (ctx.vary.hour is honoured): morning, golden evening, soft rain, moonlit dark field.
// Season by seed: spring (frogspawn, tadpoles), summer (bloom, extra Volvox), autumn (leaves afloat).
// Cast by seed: azure dragonfly or red damselfly pair, boat or disc diatoms. Rare: a water bear on the
// Spirogyra curtain that turns its head as we pass.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as Flora from '../kit/flora.js';
import * as Fauna from '../kit/fauna.js';
import * as Fx from '../kit/fx.js';
import { buildHero } from '../parts/pond-drop.js';

const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const bell = (x, c, w) => { const t = (x - c) / w; return Math.exp(-t * t); };
const LOOK_FORCE = null, SEASON_FORCE = null, RARE_FORCE = false;   // test aids: force a look / season / the rare event

const LOOKS = {
  morning: { sky: 'day', sunEl: 35, sunAz: 132, exposure: 1.0, fog: 0.0014,
    pal: ['#CBF3D7', '#F5FFF2', '#9FDDB6', '#1FA862', '#12402E', '#2A84E0', '#D9A93A'],
    skyOver: { zenith: '#7fb4e6', horizon: '#eef4f0', clouds: { coverage: 0.3, softness: 0.4 } },
    silver: '#d9ece4', window: '#8cc0f0', deep: '#12402E', shallow: '#86c79a', flora: 1, fieldFar: '#6FCBA6', fieldDeep: '#1F8E86' },
  golden: { sky: 'goldenHour', sunEl: 11, sunAz: 48, exposure: 1.0, fog: 0.0018,
    pal: ['#EEEFB8', '#FFFBE6', '#CFD288', '#3FA648', '#3A3812', '#2A84E0', '#E0932E'],
    skyOver: {}, silver: '#ecdcae', window: '#f2c68a', deep: '#1f3c2a', shallow: '#9aa860', flora: 0.9, trees: ['#2a4826', '#5e7c3a'], treeFog: 0.14, fieldFar: '#A8BC5C', fieldDeep: '#4C8242' },
  rain: { sky: 'overcast', sunEl: 40, sunAz: 132, exposure: 1.08, fog: 0.0026,
    pal: ['#D2EFE6', '#F1FFFA', '#98D0C2', '#1C9E6E', '#123E36', '#2A84E0', '#D9A93A'],
    skyOver: {}, silver: '#cfe2de', window: '#c2d2d8', deep: '#173a34', shallow: '#7fb0a0', flora: 0.85, fieldFar: '#70C2B2', fieldDeep: '#1F8488' },
  night: { sky: 'night', sunEl: 30, sunAz: 150, exposure: 1.15, fog: 0.0016, dark: true,
    pal: ['#E2F8E6', '#F7FFF4', '#A6E0BC', '#27C878', '#12402E', '#2A84E0', '#D9A93A'],
    skyOver: {}, silver: '#1e3854', window: '#5d7fb8', deep: '#061420', shallow: '#1c4a52', flora: 0.7 },
};

// ------------------------------------------------------------------ shared GLSL (bright-field kit)
const G_COMMON = /* glsl */`
  uniform float uTime;
  uniform vec3 uFocus;
  uniform vec3 uSwell;
  float focusF(float d) { return smoothstep(uFocus.x, uFocus.y, d) * uFocus.z; }
  vec3 jitv(float sd) { return vec3(sin(uTime * 1.3 + sd * 50.0), sin(uTime * 1.1 + sd * 91.0), sin(uTime * 1.7 + sd * 13.0)); }
  vec3 rotAx(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
`;
const G_GLASS = /* glsl */`
  uniform vec3 uField;
  uniform vec3 uRim;
  uniform vec3 uTint;
  uniform vec3 uLine;
  vec4 glassOut(vec3 T, vec3 add) {
    T = clamp(T, 0.0, 1.0);
    float a = min(T.r, min(T.g, T.b));
    return vec4((T - a) * uField + add, a);
  }
`;
const G_VARY = /* glsl */`
  varying vec3 vN; varying vec3 vV; varying vec3 vC; varying vec4 vP; varying vec3 vL; varying vec3 vW; varying float vFoc;
`;
// organisms: instanced meshes; aCol = transmittance tint (glass) or colour (organelle), aP = (edge 0..1,
// part phase, part kind, -), iD = per instance (seed, phase, param, -)
const orgVert = (deform) => /* glsl */`
  attribute vec3 aCol;
  attribute vec4 aP;
  attribute vec4 iD;
  uniform float uJit;
  ${G_VARY}
  ${G_COMMON}
  void main() {
    vec3 p = position; vec3 n = normal; float sd = iD.x;
    ${deform}
    vL = p;
    mat4 im = modelMatrix * instanceMatrix;
    vec3 org = im[3].xyz;
    vec3 wp = (im * vec4(p, 1.0)).xyz;
    float dc = distance(org, cameraPosition);
    float sw = mix(uSwell.x, 1.0, 1.0 - smoothstep(uSwell.y, uSwell.z, dc));
    wp = org + (wp - org) * sw + jitv(sd) * uJit;
    vec4 mv = viewMatrix * vec4(wp, 1.0);
    vN = normalize(mat3(viewMatrix) * (mat3(im) * n) + vec3(0.0, 0.0, 1e-6));
    vV = mv.xyz; vW = wp; vC = aCol;
    vP = vec4(aP.x, sd, iD.z, aP.z);
    vFoc = focusF(length(mv.xyz));
    gl_Position = projectionMatrix * mv;
  }
`;
const orgGlass = (pattern) => /* glsl */`
  uniform float uTime; uniform float uRimW; uniform float uLineK; uniform float uBody;
  ${G_VARY}
  ${G_GLASS}
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(-vV + vec3(0.0, 0.0, 1e-5));
    float mu = abs(dot(n, v));
    float e = min(mu, vP.x);
    float fw = max(fwidth(e), 1e-4);
    float w = clamp(max(uRimW, 1.8 * fw), 0.02, 0.85);
    float rim = 1.0 - smoothstep(0.4 * w, w, e);
    float line = smoothstep(w, 1.3 * w, e) * (1.0 - smoothstep(1.7 * w, 2.3 * w, e));
    float small = smoothstep(0.35, 0.8, 1.8 * fw);
    float dk = 0.0;
    vec3 tc = uTint * vC;
    float thick = uBody * (0.4 + 0.6 * mu);
    ${pattern}
    vec3 T = vec3(1.0) - (vec3(1.0) - tc) * thick;
    T = mix(T, uRim, clamp(max(rim * 0.8 * (1.0 - 0.5 * small), dk), 0.0, 1.0));
    float keep = 1.0 - vFoc;
    T = mix(vec3(1.0), T, keep);
    gl_FragColor = glassOut(T, uLine * line * keep * uLineK * (1.0 - small));
  }
`;
const orgCore = (pattern) => /* glsl */`
  uniform float uTime; uniform vec3 uHaze; uniform vec3 uLampW;
  ${G_VARY}
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(-vV + vec3(0.0, 0.0, 1e-5));
    float mu = abs(dot(n, v));
    vec3 col = vC;
    ${pattern}
    col *= 0.72 + 0.5 * mu;
    vec3 ray = normalize(vW - cameraPosition + vec3(0.0, 1e-5, 0.0));
    float g = max(dot(ray, uLampW), 0.0);
    col *= 1.0 + 0.7 * g * g * g;
    col = mix(col, uHaze, vFoc);
    gl_FragColor = vec4(col, 1.0);
  }
`;
const GLASS_BLEND = {
  transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
};

// ------------------------------------------------------------------ geometry helpers
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
// place a primitive and stamp it with aCol / aP so parts can be merged into one organism
function part(geo, o = {}) {
  const s = o.s ?? 1, sc = Array.isArray(s) ? s : [s, s, s], p = o.p || [0, 0, 0], r = o.r || [0, 0, 0];
  _m.compose(V3(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2])), V3(sc[0], sc[1], sc[2]));
  geo.applyMatrix4(_m);
  const n = geo.attributes.position.count, c = o.c && o.c.isColor ? o.c : new THREE.Color(o.c || '#ffffff');
  const col = new Float32Array(n * 3), ap = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    ap[i * 4] = o.e ?? 1; ap[i * 4 + 1] = o.ph ?? 0; ap[i * 4 + 2] = o.k ?? 0;
  }
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  if (!geo.attributes.aP) geo.setAttribute('aP', new THREE.BufferAttribute(ap, 4));
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  return geo;
}
const merge = (list) => mergeGeometries(list, false);
const ball = (r = 1, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
// surface of revolution about Z: radius fn(t), z from z0 to z1
function lathe(fn, z0, z1, n = 14, seg = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2(Math.max(fn(t), 1e-3), lerp(z0, z1, t))); }
  return new THREE.LatheGeometry(pts, seg).rotateX(Math.PI / 2);
}
// flat lobed plate in the XY plane; the outline carries edge = 0 so the glass shader draws its rim there
function plate(rOf, n = 96, inner = 0.8, kind = 0) {
  const pos = [0, 0, 0], ap = [1, 0, kind, 0], idx = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, r = rOf(a);
    pos.push(Math.cos(a) * r * inner, Math.sin(a) * r * inner, 0); ap.push(1, 0, kind, 0);
    pos.push(Math.cos(a) * r, Math.sin(a) * r, 0); ap.push(0, 0, kind, 0);
  }
  for (let i = 0; i < n; i++) {
    const a = 1 + i * 2, b = 1 + ((i + 1) % n) * 2;
    idx.push(0, a, b, a, a + 1, b + 1, a, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 2 ? 1 : 0)), 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(ap, 4));
  g.setIndex(idx);
  return g;
}
const stdGeo = (list) => { const g = merge(list); g.setAttribute('color', g.getAttribute('aCol')); return g; };

export default {
  id: 'pond-drop', name: 'One Drop', category: 'wilderness', weirdness: 0.4,
  media: ['air', 'underwater', 'tiny'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, lush = clamp(vary.density ?? 1, 0.7, 1.3);
    const vr = rng.fork('look'), hour = vary.hour || 'any';
    let lookId = hour === 'night' ? 'night' : hour === 'golden' ? 'golden'
      : (hour === 'day' || hour === 'dawn') ? vr.pick(['morning', 'morning', 'rain']) : vr.pick(['morning', 'morning', 'golden', 'rain', 'night']);
    if (LOOK_FORCE) lookId = LOOK_FORCE;
    const LK = LOOKS[lookId], dark = !!LK.dark, rain = lookId === 'rain';
    const season = SEASON_FORCE || vr.pick(['spring', 'summer', 'autumn']);
    const damsel = vr.chance(0.35), discDiatoms = vr.chance(0.4), rare = !!vary.rare || RARE_FORCE;
    const D2R = Math.PI / 180;

    // ---------------------------------------------------------------- hero first: the path is laid through it
    const lampW = V3(0.55, -0.75, 0.36).normalize();
    const qH = new THREE.Quaternion().setFromEuler(new THREE.Euler(10 * D2R, Math.PI, 0, 'XYZ'));
    const lampL = lampW.clone().applyQuaternion(qH.clone().invert());
    const hero = await buildHero(ctx, { palette: LK.pal, lampDir: [lampL.x, lampL.y, lampL.z], progress: 0, backdrop: false });
    const NP = V3(-70, -57, -10);                                   // near pole (the mouth) in world space
    hero.object.quaternion.copy(qH);
    hero.object.position.copy(NP).sub(hero.anchors.nearPole.position.clone().applyQuaternion(qH));
    hero.object.updateMatrixWorld(true);
    const toW = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const fly = hero.anchors.flyThrough.slice(3, 11).map(toW);      // across the interior to the tear
    const VC = toW(hero.anchors.center), FP = fly[fly.length - 1];
    const axisW = V3(0, -Math.sin(10 * D2R), Math.cos(10 * D2R));
    await ctx.yield();

    // ---------------------------------------------------------------- path (640 m at 16 m/s)
    const SC = V3(-35, 0, -146), SR = 35, T22 = Math.tan(22 * D2R);  // lily stem = centre of the half-turn
    const pp = [[0, 1.8, 0], [2.4, 1.8, -28], [-2.8, 1.8, -58], [1.8, 1.8, -86], [0, 1.7, -110], [0, 1.05, -128], [0, 0, -144]];
    for (const deg of [12, 36, 60, 84, 108, 132, 156, 180]) {
      const a = deg * D2R;
      pp.push([SC.x + SR * Math.cos(a), -(SR * a) * T22 - 0.6, SC.z - SR * Math.sin(a)]);
    }
    const CURT = V3(-71.5, -50.4, -84);                             // the gap in the Spirogyra curtain
    pp.push([-70, -47.6, -116], [CURT.x, CURT.y, CURT.z], [-70, -53.6, -48], [NP.x, NP.y, NP.z]);
    for (const p of fly) pp.push([p.x, p.y, p.z]);
    const RB = 68.75, s10 = Math.sin(10 * D2R), c10 = Math.cos(10 * D2R);
    let BEND = FP;
    for (const deg of [22, 35, 48, 60]) {
      const a = deg * D2R;
      BEND = V3(FP.x, FP.y - RB * (c10 - Math.cos(a)), FP.z + RB * (Math.sin(a) - s10));
      pp.push([BEND.x, BEND.y, BEND.z]);
    }
    const tEnd = V3(0, -Math.sin(60 * D2R), Math.cos(60 * D2R));
    for (const k of [20, 40, 60]) pp.push([BEND.x + tEnd.x * k, BEND.y + tEnd.y * k, BEND.z + tEnd.z * k]);
    const path = makePath(pp);
    const PORT = path.end.clone(), LEN = path.length, nDeck = tEnd.clone().negate();
    const samples = []; for (let i = 0; i <= 640; i++) samples.push(path.pointAt(i / 640));
    const uOf = (v) => { let b = 1e12, bi = 0; for (let i = 0; i <= 640; i++) { const d = samples[i].distanceToSquared(v); if (d < b) { b = d; bi = i; } } return bi / 640; };
    await ctx.yield();
    const uPl = uOf(V3(0, 0, -144)), uTurn = uOf(V3(-70, -45, -146)), uCurt = uOf(CURT), uN = uOf(NP), uF = uOf(FP), uB = uOf(BEND);

    // ---------------------------------------------------------------- shared uniforms and colours
    const HU = hero.uniforms, pal = LK.pal.map((h) => new THREE.Color(h));
    const backCol = pal[0].clone(), lampCol = pal[1].clone().lerp(pal[0], 0.4).multiplyScalar(0.985), backFar = pal[2].clone();
    if (dark) {
      backCol.setRGB(0.034, 0.07, 0.13); lampCol.setRGB(0.07, 0.17, 0.27); backFar.setRGB(0.03, 0.055, 0.105);
      HU.uField.value.setRGB(0.36, 0.72, 0.56); HU.uHaze.value.copy(backCol); HU.uRim.value.setRGB(0.22, 1.0, 0.72);
      HU.uTint.value.setRGB(0.95, 1.0, 0.975); HU.uLine.value.setRGB(0.3, 0.42, 0.36); HU.uEmerald.value.multiplyScalar(1.15);
    }
    // the graded field: pale by the lamp, jade round it, deep blue-green away from it. uGrade.x ramps the grading in below the
    // plunge (0 = the even pale field of the first metres, 1 = the micro world); the dark field keeps its own colours.
    const fieldFar = dark ? backFar.clone() : new THREE.Color(LK.fieldFar), fieldDeep = dark ? backFar.clone() : new THREE.Color(LK.fieldDeep);
    const fieldMid = dark ? backCol.clone() : backCol.clone().lerp(fieldFar, 0.6);
    const uGrade = { value: new THREE.Vector2(0, 0) };
    const lampE1 = V3().crossVectors(lampW, V3(0, 0, 1)).normalize(), lampE2 = V3().crossVectors(lampW, lampE1).normalize();
    const field0 = HU.uField.value.clone(), haze0 = HU.uHaze.value.clone(), line0 = HU.uLine.value.clone(), fTmp = new THREE.Color(), fDir = V3();
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    // the dome's colour in direction d (without the shafts), for the glass and the focus haze to match what lies behind them
    const fieldAt = (d, k, out) => {
      const l = d.dot(lampW);
      out.copy(backCol).lerp(fieldMid, 0.9 * k).lerp(lampCol, 0.9 * ss(lerp(0.45, 0.8, k), 0.995, l));
      out.lerp(dark ? backFar : fieldFar, lerp(0.42 * ss(0.3, -1, l), 0.85 * ss(0.7, -0.15, l), k));
      return out.lerp(fieldDeep, 0.8 * k * ss(0.05, -0.95, l));
    };
    const U = {
      uTime: HU.uTime, uFocus: HU.uFocus, uField: HU.uField, uRim: HU.uRim, uTint: HU.uTint, uLine: HU.uLine, uHaze: HU.uHaze,
      uLampW: { value: lampW }, uSwell: { value: V3(0.5, 70, 260) }, uResY: HU.uResY,
    };
    const NOSWELL = { value: V3(1, 1e5, 2e5) };
    const EM = HU.uEmerald.value.clone(), GOLD = pal[6].clone(), AZ = pal[5].clone(), OLIVE = pal[4].clone().lerp(pal[3], 0.35);
    const BLACK = new THREE.Color(dark ? '#123a40' : '#0c1c14'), ORANGE = new THREE.Color('#f07a1c'), CLEAR = new THREE.Color(1, 1, 1);
    const AZT = new THREE.Color().setRGB(0.5, 0.74, 1.0), OLT = new THREE.Color().setRGB(0.84, 0.9, 0.62), BRT = new THREE.Color().setRGB(0.9, 0.76, 0.5);
    hero.setFocus(110, 460, 0.6);

    function orgMats(o = {}) {
      const un = { ...U, uJit: { value: o.jit ?? 0.2 }, uRimW: { value: o.rimW ?? 0.3 }, uLineK: { value: o.lineK ?? 1 }, uBody: { value: o.body ?? 1 },
        uSwell: o.swell === false ? NOSWELL : o.swell && o.swell.isVector3 ? { value: o.swell } : U.uSwell };
      const vs = orgVert(o.deform || '');
      return {
        glass: new THREE.ShaderMaterial({ uniforms: un, vertexShader: vs, fragmentShader: orgGlass(o.pattern || ''), side: THREE.DoubleSide, forceSinglePass: true, ...GLASS_BLEND }),
        core: new THREE.ShaderMaterial({ uniforms: un, vertexShader: vs, fragmentShader: orgCore(o.corePattern || ''), side: THREE.DoubleSide }),
      };
    }
    function makeOrg(parent, o) {
      const n = o.count, iD = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      const bs = new THREE.Sphere(o.center.clone(), o.radius);
      const mk = (geo, mat, ro) => {
        if (!geo) return null;
        geo.setAttribute('iD', iD);
        const m = new THREE.InstancedMesh(geo, mat, n);
        m.renderOrder = ro; m.boundingSphere = bs; parent.add(m);
        return m;
      };
      const body = mk(o.body, o.mats.glass, o.order ?? 2), core = mk(o.core, o.mats.core, 0);
      for (let i = 0; i < n; i++) iD.setXYZW(i, rng(), rng() * TAU, 0, 0);
      return {
        n, iD, body, core,
        set(i, m) { if (body) body.setMatrixAt(i, m); if (core) core.setMatrixAt(i, m); },
        commit() { if (body) body.instanceMatrix.needsUpdate = true; if (core) core.instanceMatrix.needsUpdate = true; },
      };
    }
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), P = V3(), P2 = V3(), P3 = V3(), S = V3(1, 1, 1);
    const UPV = V3(0, 1, 0), ZV = V3(0, 0, 1), LM = new THREE.Matrix4();
    // orientation whose +Z looks along dir
    const aim = (dir, q = Q) => { LM.lookAt(dir, P3.set(0, 0, 0), Math.abs(dir.y) > 0.98 ? ZV : UPV); return q.setFromRotationMatrix(LM); };
    const put = (org, i, pos, q, s) => { M4.compose(pos, q, typeof s === 'number' ? S.set(s, s, s) : s); org.set(i, M4); };
    const randDir = (r, out = V3()) => { const u = r.range(-1, 1), a = r() * TAU, k = Math.sqrt(1 - u * u); return out.set(k * Math.cos(a), u, k * Math.sin(a)); };

    const scene = new THREE.Scene();
    const aboveG = new THREE.Group(), macroG = new THREE.Group(), microG = new THREE.Group(), finalG = new THREE.Group();
    scene.add(aboveG, macroG, microG, finalG);
    microG.add(hero.object);
    const anims = [];           // (time, u, dt, camera) scripted and CPU-driven motion
    const tick = [];            // kit things: update(dt, time, camera, u)
    const extraDispose = [];

    // ---------------------------------------------------------------- the bright field (or dark field) backdrop
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uBack: { value: backCol }, uLampC: { value: lampCol }, uFar: { value: dark ? backFar : fieldFar }, uMid: { value: fieldMid }, uDeep: { value: fieldDeep },
        uLampW: U.uLampW, uE1: { value: lampE1 }, uE2: { value: lampE2 }, uGrade, uTime: U.uTime, uShaft: { value: dark ? 0.5 : 1 } },
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uBack; uniform vec3 uLampC; uniform vec3 uFar; uniform vec3 uMid; uniform vec3 uDeep; uniform vec3 uLampW; uniform vec3 uE1; uniform vec3 uE2;
        uniform vec2 uGrade; uniform float uTime; uniform float uShaft; varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir + vec3(0.0, 1e-5, 0.0));
          float l = dot(d, uLampW), k = uGrade.x;
          vec3 c = mix(mix(uBack, uMid, 0.9 * k), uLampC, 0.9 * smoothstep(mix(0.45, 0.8, k), 0.995, l));
          c = mix(c, uFar, mix(0.42 * smoothstep(0.3, -1.0, l), 0.85 * smoothstep(0.7, -0.15, l), k));
          c = mix(c, uDeep, 0.8 * k * smoothstep(0.05, -0.95, l));
          // soft shafts fanning out from the lamp, slowly turning
          float a = dot(d, uE1), b = dot(d, uE2);
          float ang = atan(a, abs(b) < 1e-5 ? 1e-5 : b);
          float sh = 0.5 + 0.5 * sin(ang * 7.0 + uTime * 0.15 + 2.0 * sin(ang * 3.0 - uTime * 0.06));
          float sh2 = 0.5 + 0.5 * sin(ang * 17.0 - uTime * 0.11 + 1.7 * sin(ang * 5.0));
          float env = smoothstep(0.05, 0.92, l) * (1.0 - smoothstep(0.93, 0.998, l));
          c += uLampC * (0.17 * sh * sh * sh + 0.04 * sh2 * sh2) * env * k * uShaft;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ---------------------------------------------------------------- above water: sky, light, pond
    const sky = makeSky({ rng, preset: LK.sky, ...(dark ? { bake: true, renderer: ctx.renderer } : { sunElevation: LK.sunEl, sunAzimuth: LK.sunAz }), ...LK.skyOver });
    scene.add(sky.object);
    await ctx.yield();
    const fog = new THREE.FogExp2(sky.fogColor.clone(), LK.fog); scene.fog = fog;
    const rig = makeLightRig(sky, { bounce: 0.45, ambient: dark ? 1.6 : 1.1 }); scene.add(rig.object);
    const PCX = -20, PCZ = -95;
    const rOf = (x, z) => Math.hypot(x - PCX, z - PCZ);
    const RbAt = (x, z) => { const r = rOf(x, z) || 1; return 150 + 12 * noise.n2((x - PCX) / r * 1.5, (z - PCZ) / r * 1.5); };
    const depthAt = (x, z) => clamp((RbAt(x, z) - rOf(x, z)) * 0.07, -2, 3.6);
    const groundAt = (x, z) => clamp((rOf(x, z) - RbAt(x, z)) * 0.07, -3.6, 9) + 0.5 * noise.n2(x * 0.03, z * 0.03);
    // the alder line: one crown profile shared by the treeline shader and the lake's mirror of it
    const lump = (x) => { const v = Math.abs(Math.sin(x)); return v * (2 - v); };
    const crownTop = (a) => 0.37 + 0.05 * Math.sin(a * 3 + 1) + 0.04 * Math.sin(a * 7 + 2.2) + 0.085 * lump(a * 8.5 + 0.8 * Math.sin(a * 5)) + 0.055 * lump(a * 23 + 1.3 + Math.sin(a * 13));
    const treeLow = new THREE.Color(LK.trees ? LK.trees[0] : dark ? '#0c1c22' : '#3c683a').multiplyScalar(dark ? 1 : LK.flora), treeHigh = new THREE.Color(LK.trees ? LK.trees[1] : dark ? '#1c3440' : '#7aa462').multiplyScalar(dark ? 1 : LK.flora);
    const treeFogK = LK.treeFog ?? (dark ? 0.26 : rain ? 0.17 : 0.1);
    const lake = Water.makeLake({ rng: rng.fork('lake'), light: Water.waterLight(sky), level: 0, center: [PCX, PCZ], radius: 240, depthAt, segments: 80,
      skyline: (az) => ({ elevation: Math.atan((crownTop(Math.PI / 2 - az) * 210 - 6) / 340), distance: 340 }),
      band: dark ? { color: '#0a1a1c', top: '#1c3038', softness: 0.04 } : { color: treeLow.clone().multiplyScalar(0.8), top: treeLow.clone().lerp(treeHigh, 0.5).lerp(sky.fogColor, 0.08), softness: 0.02, amount: 1 },
      deep: LK.deep, shallow: LK.shallow, ripple: rain ? 0.9 : 0.28, shoreFoam: 0.1, foamWidth: 1.5, glitter: dark ? 1 : 0.7 });
    aboveG.add(lake.object); tick.push(lake);
    await ctx.yield();
    if (dark) {   // the moon's path on the water, laid along the entry axis so the pond is lit when seen through the portal
      const mp = new THREE.Mesh(new THREE.PlaneGeometry(64, 290).rotateX(-Math.PI / 2).translate(0, 0.045, -55), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: U.uTime },
        vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`
          uniform float uTime; varying vec2 vQ;
          void main() {
            float w = vQ.x / (9.0 + 0.09 * abs(vQ.y)), env = exp(-w * w) * smoothstep(-200.0, -150.0, vQ.y) * (1.0 - smoothstep(60.0, 90.0, vQ.y));
            float a = abs(sin(vQ.y * 2.6 + 2.2 * sin(vQ.x * 0.9 + vQ.y * 0.23 + uTime * 0.8) + uTime * 0.6)), b = abs(sin(vQ.x * 2.3 + 1.3 * sin(vQ.y * 0.5 - uTime * 0.7)));
            float a2 = abs(sin(vQ.y * 1.3 - vQ.x * 0.8 - 1.9 * sin(vQ.x * 0.45 - uTime * 0.5)));
            a = a * a; a = a * a; b = b * b; a2 = a2 * a2; a2 = a2 * a2;
            gl_FragColor = vec4(vec3(0.34, 0.46, 0.8) * env * (0.08 + 0.5 * a * (0.2 + 0.8 * b) + 0.4 * a2 * (1.0 - 0.8 * b)), 1.0);
          }`,
      }));
      mp.renderOrder = 6; mp.frustumCulled = false; aboveG.add(mp);
    }
    const fl = LK.flora;
    const bed = new THREE.Mesh(new THREE.CircleGeometry(175, 40).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: LK.deep }));
    bed.position.set(PCX, -3.7, PCZ); aboveG.add(bed);
    {
      const g = new THREE.RingGeometry(118, 640, 96, 18).rotateX(-Math.PI / 2).translate(PCX, 0, PCZ), pos = g.attributes.position, col = new Float32Array(pos.count * 3);
      const ca = new THREE.Color('#4f7f3a').multiplyScalar(fl), cb = new THREE.Color('#86a84e').multiplyScalar(fl), cc = new THREE.Color('#3a5a34').multiplyScalar(fl), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), h = groundAt(x, z);
        pos.setY(i, h);
        c.copy(ca).lerp(cb, clamp(0.5 + 0.5 * noise.n2(x * 0.02, z * 0.02), 0, 1)).lerp(cc, smoothstep(0.5, -2.5, h));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
      aboveG.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
    }
    await ctx.yield();
    // alders: one soft silhouette band round the bay, its crowns stirring
    const trees = new THREE.Mesh(new THREE.CylinderGeometry(340, 340, 210, 96, 1, true).translate(PCX, 99, PCZ), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, fog: false,
      uniforms: { uTime: U.uTime, uLow: { value: treeLow }, uHigh: { value: treeHigh }, uFogK: { value: treeFogK },
        uFogC: { value: sky.fogColor.clone() }, uC: { value: new THREE.Vector2(PCX, PCZ) } },
      vertexShader: /* glsl */`varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uLow; uniform vec3 uHigh; uniform vec3 uFogC; uniform vec2 uC; uniform float uFogK; varying vec3 vP;
        float lump(float x) { float v = abs(sin(x)); return v * (2.0 - v); }
        void main() {
          float a = atan(vP.x - uC.x, vP.z - uC.y + 1e-4), h = (vP.y + 6.0) / 210.0;
          float sway = 0.05 * sin(uTime * 0.5 + a * 9.0);
          float l1 = lump(a * 8.5 + 0.8 * sin(a * 5.0)), l2 = lump(a * 23.0 + 1.3 + sin(a * 13.0) + sway), l3 = lump(a * 61.5 + 0.6 * sin(a * 31.0) + 2.0 * sway);
          float top = 0.37 + 0.05 * sin(a * 3.0 + 1.0) + 0.04 * sin(a * 7.0 + 2.2) + 0.085 * l1 + 0.055 * l2 + 0.022 * l3 + 0.004 * sin(a * 331.0 + uTime * 0.9);
          float al = 1.0 - smoothstep(top - 0.03, top + 0.008, h);
          // rounded crowns: each lump is lit on top and shaded underneath, no stripes
          float q1 = lump(a * 23.0 + 1.3 + sin(a * 13.0) + sway + h * 4.0), q2 = lump(a * 61.5 + 0.6 * sin(a * 31.0) + h * 13.0);
          float lit = smoothstep(0.0, top, h) * (0.62 + 0.38 * q1 * (0.88 + 0.12 * q2));
          vec3 c = mix(uLow, uHigh, lit);
          gl_FragColor = vec4(mix(c, uFogC, uFogK), al * 0.98);
        }`,
    }));
    trees.renderOrder = -0.5; aboveG.add(trees);
    await ctx.yield();

    // lily pads, lilies, reeds (kit flora, one shared wind material)
    const wind = Flora.makeWind({ strength: rain ? 0.9 : 0.5, speed: 0.8 });
    await Flora.prepareLeafTexture({ wind }, ctx.yield);
    const fmat = Flora.windMaterial({ wind });
    await ctx.yield();
    const onWater = (x, z) => (RbAt(x, z) - rOf(x, z) > 16 ? 1 : 0);
    // our own pads in the kit's vertex format: a smooth notched outline, radial veins, a raised rim and beads of water.
    // With flower: true the kit's lily is carried over onto the new pad.
    const padGeo = (r, flower) => {
      const R = 0.7, kit = Flora.lilyPadGeometry({ rng: r, size: R, flower, petal: '#fbfbf2', petalTip: '#ffffff', heart: '#f2c22e', glow: dark ? 2.4 : 0 });
      const kp = kit.attributes.position, kn = kit.attributes.normal, kc = kit.attributes.color, ku = kit.attributes.uv, kw = kit.attributes.wind, ki = kit.index;
      const pos = [], nor = [], col = [], uv = [], wnd = [], idx = [], SEG = 36, notch = r() * TAU, ph = r() * 9;
      const cL = new THREE.Color('#8ab850'), cP = new THREE.Color('#3f7a3a'), cR = new THREE.Color('#62682e'), cB = new THREE.Color(dark ? '#86b4bc' : '#e4f4ee'), c = new THREE.Color();
      const v = (x, y, z, nx, ny, nz, cc, fl) => { const l = Math.hypot(nx, ny, nz) || 1; pos.push(x, y, z); nor.push(nx / l, ny / l, nz / l); col.push(cc.r, cc.g, cc.b); uv.push(ku.getX(0), ku.getY(0)); wnd.push(0.01, fl, 1, 0); return pos.length / 3 - 1; };
      const rings = [[0.16, 0.022, 0.8], [0.6, 0.016, 0.2], [0.95, 0.03, 0.0], [1.0, 0.07, -1]];
      const c0 = v(0, 0.024, 0, 0, 1, 0, cL, 0);
      for (let k = 0; k <= SEG; k++) {
        const a = notch + 0.17 + (k / SEG) * (TAU - 0.34), rr = R * (1 + 0.03 * Math.sin(k * 0.9 + ph) + 0.018 * Math.sin(k * 2.3 + ph)), ca = Math.cos(a), sa = Math.sin(a);
        const vein = k % 4 === 0 ? 1 : k % 4 === 2 ? 0.25 : 0;
        rings.forEach(([f, y, lt], j) => {
          if (lt < 0) c.copy(cP).lerp(cR, 0.7); else c.copy(cP).lerp(cL, Math.min(1, lt + vein * (0.62 - 0.15 * j)));
          v(ca * rr * f, y, sa * rr * f, lt < 0 ? -ca * 0.6 : 0, 1, lt < 0 ? -sa * 0.6 : 0, c, lt < 0 ? 0.15 : 0);
          if (k) { const b = c0 + 1 + k * rings.length + j, a0 = b - rings.length; if (j === 0) idx.push(c0, b, a0); else idx.push(a0 - 1, b - 1, b, a0 - 1, b, a0); }
        });
      }
      for (let i = 0; i < 6; i++) {   // beads of water
        const a = r() * TAU, d = R * (0.22 + 0.6 * r()), br = R * (0.022 + 0.03 * r()), x = Math.cos(a) * d, z = Math.sin(a) * d, top = v(x, 0.022 + br * 0.55, z, 0, 1, 0, cB, 0), b0 = pos.length / 3;
        for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; v(x + Math.cos(b) * br, 0.02, z + Math.sin(b) * br, Math.cos(b), 0.5, Math.sin(b), c.copy(cP).lerp(cB, 0.45), 0); }
        for (let k = 0; k < 6; k++) idx.push(top, b0 + (k + 1) % 6, b0 + k);
      }
      if (flower && ki && kp.count > 31) {   // the kit pad is its first 31 vertices and 126 indices; everything after is the flower
        const base = pos.length / 3 - 31;
        for (let i = 31; i < kp.count; i++) { pos.push(kp.getX(i), kp.getY(i), kp.getZ(i)); nor.push(kn.getX(i), kn.getY(i), kn.getZ(i)); col.push(kc.getX(i), kc.getY(i), kc.getZ(i)); uv.push(ku.getX(i), ku.getY(i)); wnd.push(kw.getX(i), kw.getY(i), kw.getZ(i), kw.getW(i)); }
        for (let i = 126; i < ki.count; i++) idx.push(ki.getX(i) + base);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('wind', new THREE.Float32BufferAttribute(wnd, 4)); g.setIndex(idx);
      g.userData = { ...kit.userData, triangles: idx.length / 3 }; kit.dispose();
      return g;
    };
    const padRng = rng.fork('padgeo'), padVars = [padGeo(padRng, false), padGeo(padRng, false), padGeo(padRng, false)];
    await ctx.yield();
    const pads = Flora.makeLilyPads({ rng: rng.fork('pads'), variants: padVars, path, uRange: [0, uPl + 0.06], radius: 62, corridor: 0, count: Math.round(300 * lush * detail),
      spacing: 1.2, scale: [2.3, 3.9], flowers: false, density: onWater, material: fmat, falloff: 0.7 });
    aboveG.add(pads.object); tick.push(pads);
    await ctx.yield();
    const lilyRng = rng.fork('lilies');
    const lilies = Flora.makeLilyPads({ rng: lilyRng, path, uRange: [0.015, uPl - 0.012], radius: 36, corridor: 5, count: rng.int(14, 18), spacing: 2.2, scale: [5.5, 7.5],
      variants: [padGeo(lilyRng, true)], density: onWater, material: fmat, falloff: 0.2 });
    aboveG.add(lilies.object); tick.push(lilies);
    await ctx.yield();
    const reeds = Flora.makeReeds({ rng: rng.fork('reeds'), bounds: [PCX - 195, PCZ - 195, PCX + 195, PCZ + 195], count: Math.round(340 * lush * detail), heightAt: groundAt,
      density: (x, z) => { const d = rOf(x, z) - RbAt(x, z); return d > -16 && d < 26 ? 1 : 0; }, scale: [7, 12], spacing: 0.5, material: fmat });
    aboveG.add(reeds.object); tick.push(reeds);
    await ctx.yield();

    // ---------------------------------------------------------------- above water: the guide and the pond's small life
    const flyPos = V3(0, 2.6, -9);
    {
      const bodyCol = damsel ? new THREE.Color('#d8322a') : AZ.clone(), rr = damsel ? 0.036 : 0.055;
      const bodyGeo = (thorax) => {
        const parts = [];
        // one smooth tapered abdomen, clubbed at the tip, its fine segment joints and dark dorsal line in vertex colour
        const NA = 56, ab = part(lathe((t) => rr * (0.5 + 0.7 * Math.pow(t, 0.7)) * (1 + 0.3 * Math.exp(-(((t - 0.07) / 0.06) ** 2))), -1.22, -0.1, NA, 10), { c: bodyCol });
        const ac = ab.attributes.aCol, an = ab.attributes.normal;
        for (let i = 0; i < ac.count; i++) {
          const j = i % (NA + 1), ny = an.getY(i), k = (j % 8 === 0 && j > 0) ? 0.1 : ny > 0.93 ? 0.16 : (j % 8 === 1 ? 1.2 : 1) * (0.78 + 0.22 * Math.max(ny, -0.2));
          ac.setXYZ(i, bodyCol.r * k, bodyCol.g * k, bodyCol.b * k);
        }
        parts.push(ab);
        parts.push(part(ball(1, 12, 9), { s: [0.115, 0.125, 0.22], p: [0, 0.01, 0.02], c: thorax }));
        parts.push(part(ball(1, 8, 6), { s: [0.05, 0.03, 0.17], p: [0, 0.115, 0.02], c: '#1a1210' }));       // dark saddle on the thorax
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(part(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 4), { r: [0.5 - i * 0.3, 0, sx * 0.9], p: [sx * 0.11, -0.12, 0.1 - i * 0.07], c: '#0a0d10' }));
        parts.push(part(ball(0.085, 8, 6), { p: [0, 0, 0.27], c: '#15202a' }));
        for (const sx of [-1, 1]) parts.push(part(ball(0.068, 8, 6), { p: [sx * 0.066, 0.03, 0.29], c: damsel ? '#b8402a' : '#2aa4c8' }));
        return stdGeo(parts);
      };
      const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.1, emissive: bodyCol, emissiveIntensity: dark ? 0.5 : 0.06 });
      const body = new THREE.Mesh(bodyGeo(damsel ? '#8a2a20' : '#2f8f7a'), bodyMat);
      const wp = [], wuv = [], waw = [], widx = [];
      for (const side of [-1, 1]) for (const fore of [1, -1]) {
        const b = wp.length / 3, zc = fore > 0 ? 0.13 : -0.04, L = fore > 0 ? 0.86 : 0.76;
        wp.push(side * 0.04, 0.06, zc); wuv.push(0, 0.5); waw.push(side, 0, fore);
        for (let j = 0; j <= 8; j++) {
          const a = lerp(-0.32, 0.62, j / 8);
          wp.push(side * (0.04 + Math.cos(a) * L), 0.06 + Math.sin(a) * L, zc + (j % 2) * 0.1); wuv.push(1, j / 8); waw.push(side, 0, fore);
          if (j) widx.push(b, b + j, b + j + 1);
        }
      }
      const wg = new THREE.BufferGeometry();
      wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(wuv, 2));
      wg.setAttribute('aW', new THREE.Float32BufferAttribute(waw, 3)); wg.setIndex(widx);
      const wings = new THREE.Mesh(wg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
        uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color(0.8, 0.95, 1.0).multiplyScalar(dark ? 0.8 : 1.6) } },
        vertexShader: /* glsl */`
          attribute vec3 aW; uniform float uTime; varying vec2 vUv; varying float vG;
          void main() {
            vUv = uv; vG = aW.z + aW.x * 0.7;
            vec3 p = position; p.y += uv.x * 0.05 * sin(uTime * 23.0 + vG);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; uniform float uTime; varying vec2 vUv; varying float vG;
          void main() {
            float sh = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x)) * smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
            float s = max(sin(vUv.y * 8.0 + uTime * 47.0 + vG * 2.0), 0.0);
            float gl = max(sin(vUv.x * 21.0 - uTime * 29.0 + vG), 0.0); gl = gl * gl; gl = gl * gl;
            vec3 iri = 0.5 + 0.5 * cos(6.2831853 * (vUv.x * 1.3 + vUv.y * 0.7 + vG * 0.21 + 0.05 * uTime + vec3(0.0, 0.33, 0.67)));
            float fy = vUv.y * 9.0, fx = vUv.x * 13.0 + floor(fy) * 0.37;
            float vein = max(1.0 - smoothstep(0.03, 0.06 + fwidth(fy), abs(fract(fy) - 0.5)), 0.6 * (1.0 - smoothstep(0.03, 0.06 + fwidth(fx), abs(fract(fx) - 0.5))));
            gl_FragColor = vec4(uCol * mix(vec3(1.0), iri * 1.7, 0.4) * (0.26 + 0.45 * s * s + 1.8 * gl * s + 0.4 * vein) * sh * 0.24, 1.0);
          }`,
      }));
      wings.frustumCulled = false;
      const one = new THREE.Group(); one.add(body, wings);
      const flies = [one];
      if (damsel) { const two = new THREE.Group(); two.add(new THREE.Mesh(bodyGeo(AZ.clone().multiplyScalar(0.42)), bodyMat), wings.clone()); flies.push(two); }   // its mate wears the one azure accent
      const dir = V3();
      flies.forEach((g, k) => {
        g.scale.setScalar(damsel ? 2.25 : 2.55); aboveG.add(g);
        anims.push((time, u) => {
          const d = u * LEN + 6.5 - k * 1.5;
          path.posAtDist(d, P); path.posAtDist(d + 1.5, P2);
          const snatch = bell(u, 0.1, 0.012), dip = bell(u, 0.2, 0.012), leave = smoothstep(uPl - 0.03, uPl + 0.02, u);
          dir.subVectors(P2, P); dir.y = 0; dir.normalize();
          P.y = Math.max(P.y, 1.0) + 0.95 + 0.22 * Math.sin(time * 1.7 + k * 2) + k * 0.25;
          P.x += 0.5 * Math.sin(time * 0.9 + k * 2.1) - 2.2 * snatch + leave * 9;
          P.y = lerp(P.y + 1.6 * snatch, 0.75, dip) + leave * 13;
          dir.y = 0.55 * dip + 0.5 * leave - 0.25 * snatch; dir.x += 0.42 + 0.5 * leave - 0.6 * snatch * Math.sign(0.1 - u);
          g.position.copy(P); g.quaternion.copy(aim(dir.normalize()));
          if (k === 0) flyPos.copy(P);
        });
      });
    }
    // the frog: a green hump on its own pad, throat pulsing
    {
      path.posAtDist(70, P);
      const fm = new THREE.MeshStandardMaterial({ color: new THREE.Color('#4f9a3a').multiplyScalar(fl), roughness: 0.45 });
      const frog = new THREE.Group(); frog.position.set(P.x + 4.7, 0.12, P.z); frog.rotation.y = -1.9; frog.scale.setScalar(0.8);
      frog.add(new THREE.Mesh(merge([part(ball(1, 14, 10), { s: [1.0, 0.62, 1.25] }), part(ball(0.22, 8, 6), { p: [0.42, 0.56, 0.62] }), part(ball(0.22, 8, 6), { p: [-0.42, 0.56, 0.62] }),
        part(ball(0.5, 8, 6), { s: [1, 0.5, 1.3], p: [0.8, -0.1, -0.5] }), part(ball(0.5, 8, 6), { s: [1, 0.5, 1.3], p: [-0.8, -0.1, -0.5] })]), fm));
      const throat = new THREE.Mesh(ball(0.42, 10, 8), new THREE.MeshStandardMaterial({ color: new THREE.Color('#b8d67a').multiplyScalar(fl), roughness: 0.4 }));
      throat.position.set(0, 0.12, 0.98); frog.add(throat);
      const pad = new THREE.Mesh(padVars[0], fmat); pad.scale.setScalar(4.8);
      pad.position.set(P.x + 4.9, 0.03, P.z - 0.4);
      aboveG.add(frog, pad);
      anims.push((time) => { const s = 1 + 0.32 * Math.max(0, Math.sin(time * 4.2)) * (0.6 + 0.4 * Math.sin(time * 0.7)); throat.scale.set(s, s, s); frog.position.y = 0.12 + 0.02 * Math.sin(time * 1.1); });
    }
    // pond skaters
    {
      const sp = [part(ball(1, 8, 6), { s: [0.06, 0.05, 0.34], p: [0, 0.11, 0], c: '#4a3c26' }), part(ball(1, 6, 5), { s: [0.045, 0.04, 0.1], p: [0, 0.12, 0.36], c: '#2e2416' })];
      for (const [ry, z] of [[0.55, 0.12], [-0.55, -0.12], [0.15, 0]]) {
        sp.push(part(new THREE.BoxGeometry(1.5, 0.022, 0.024), { r: [0, ry, 0], p: [0, 0.05, z], c: '#2a2418' }));
        // each foot stands in a dimple of the film: a pale ring of sky caught round it
        for (const e of [-1, 1]) sp.push(part(new THREE.RingGeometry(0.055, 0.115, 10).rotateX(-Math.PI / 2), { p: [e * 0.75 * Math.cos(ry), 0.006, z - e * 0.75 * Math.sin(ry)], c: dark ? '#5a7890' : '#e6f4ee' }));
      }
      const g = stdGeo(sp);
      const sk = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }), 8); sk.frustumCulled = false; aboveG.add(sk);
      const sr = rng.fork('skaters'), data = [];
      for (let i = 0; i < 8; i++) {
        const d = sr.range(18, 132), side = sr.sign(), lat = sr.range(2.2, 11);
        path.posAtDist(d, P); data.push({ x: P.x + side * lat, z: P.z, a: sr() * TAU, ph: sr() * 9, side, u: d / LEN, rate: sr.range(0.5, 0.9) });
      }
      anims.push((time, u) => {
        for (let i = 0; i < 8; i++) {
          const s = data[i], k = time * s.rate + s.ph, f = k - Math.floor(k), st = Math.floor(k) + smoothstep(0, 0.16, f);
          const tr = Math.abs((st % 6) - 3) * 1.3, away = 3.5 * smoothstep(s.u - 0.035, s.u - 0.005, u);
          P.set(s.x + Math.cos(s.a) * tr + s.side * away, 0.02, s.z + Math.sin(s.a) * tr);
          Q.setFromAxisAngle(UPV, -s.a + Math.PI / 2 + ((Math.floor(k) % 6) >= 3 ? Math.PI : 0));
          M4.compose(P, Q, S.set(1.5, 1.5, 1.5)); sk.setMatrixAt(i, M4);
        }
        sk.instanceMatrix.needsUpdate = true;
      });
    }
    // midges in the sun (mayflies dancing on a golden evening)
    {
      // by moonlight they are fireflies, strung along the first hundred metres so the pond is lit from the entry
      const golden = lookId === 'golden', n = Math.round((golden ? 320 : dark ? 240 : 170) * detail), pos = new Float32Array(n * 3), sd = new Float32Array(n * 3), mr = rng.fork('midges');
      path.posAtDist(73, P);
      for (let i = 0; i < n; i++) {
        randDir(mr, P2).multiplyScalar((golden ? 9 : 3.4) * Math.cbrt(mr()));
        if (dark) { path.posAtDist(8 + 120 * mr(), P); P2.set(mr.range(-26, 26), mr.range(-4, 5), mr.range(-4, 4)); }
        pos[i * 3] = P.x - 2.2 + P2.x; pos[i * 3 + 1] = 4.4 + P2.y * 0.6 + (golden ? 2 : 0); pos[i * 3 + 2] = P.z + P2.z;
        sd[i * 3] = mr(); sd[i * 3 + 1] = mr(); sd[i * 3 + 2] = mr();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sd, 3));
      const midges = new THREE.Points(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: false,
        uniforms: { uTime: U.uTime, uResY: U.uResY, uBob: { value: golden ? 2.6 : dark ? 1.2 : 0.5 }, uSize: { value: golden ? 0.2 : dark ? 0.3 : 0.12 }, uBlink: { value: dark ? 1 : 0 },
          uCol: { value: dark ? new THREE.Color(2.2, 3.4, 1.0) : golden ? new THREE.Color(1.6, 1.15, 0.55) : new THREE.Color(1.25, 1.15, 0.85) } },
        vertexShader: /* glsl */`
          attribute vec3 aS; uniform float uTime; uniform float uResY; uniform float uBob; uniform float uSize; uniform float uBlink; varying float vB;
          void main() {
            vB = mix(1.0, 0.12 + 0.88 * smoothstep(0.1, 0.8, sin(uTime * (0.9 + aS.z) + aS.x * 40.0)), uBlink);
            vec3 p = position + vec3(sin(uTime * 2.1 + aS.x * 40.0) * 0.5, sin(uTime * (1.3 + aS.y) + aS.y * 40.0) * uBob, sin(uTime * 1.9 + aS.z * 40.0) * 0.5);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(uResY * projectionMatrix[1][1] * 0.5 * uSize / max(-mv.z, 0.1), 1.6, 9.0);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying float vB; void main() { float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol * vB, (1.0 - smoothstep(0.25, 0.5, r)) * 0.85 * (0.3 + 0.7 * vB)); }`,
      }));
      midges.frustumCulled = false; aboveG.add(midges);
    }
    // someone comes here: a fishing float to port, a mooring post in the reeds
    {
      const fg = stdGeo([part(new THREE.SphereGeometry(1.1, 14, 6, 0, TAU, 0, Math.PI / 2), { c: '#d8261c' }), part(new THREE.SphereGeometry(1.1, 14, 6, 0, TAU, Math.PI / 2, Math.PI / 2), { c: '#f0ece0' }),
        part(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6), { p: [0, 1.9, 0], c: '#d8261c' })]);
      const float = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 }));
      float.position.set(-30, 0.2, -62); aboveG.add(float);
      anims.push((time) => { float.position.y = 0.2 + 0.13 * Math.sin(time * 1.3); float.rotation.set(0.12 * Math.sin(time * 0.9), 0, 0.1 * Math.sin(time * 1.15 + 1)); });
      const px = PCX - 82, pz = PCZ - 116, top = V3(px, 19, pz);
      const rope = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(top, V3(px + 9, 1, pz + 12), V3(px + 22, -0.5, pz + 30)), 14, 0.22, 5);
      const pg = stdGeo([part(new THREE.CylinderGeometry(1.2, 1.5, 28, 8), { p: [px, 7, pz], c: '#4a3d30' }), part(rope, { c: '#b0a080' })]);
      aboveG.add(new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ vertexColors: true })));
    }
    // kit life: dragonflies hawking over the pads, pollen or rain in the air
    const kitFlies = Fauna.makeDragonflies({ rng: rng.fork('flies'), light: Fauna.lightFrom(scene), count: Math.round(7 * lush), path, uFrom: 0.02, uTo: uPl, clear: 9, spread: 46, lift: [0.5, 7], size: 9 });
    aboveG.add(kitFlies.object); tick.push(kitFlies);
    const air = Fx.makeParticles({ rng: rng.fork('air'), preset: rain ? 'rain' : 'pollen', count: Math.round((rain ? 2600 : 600) * detail) });
    aboveG.add(air.object); tick.push(air);
    if (season === 'autumn') {
      // an alder leaf: toothed oval, darker midrib, edges curled up off the water
      const n = 70, lg = new THREE.BufferGeometry(), lp = [], lc = [], li = [], NL = 10;
      for (let i = 0; i <= NL; i++) {
        const t = i / NL, x = -1 + 2 * t, w = 0.8 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7) * (1 + 0.09 * (i % 2)) + 0.02;
        for (const sg of [-1, 0, 1]) { lp.push(x * 1.5, 0.12 * x * x + (sg ? 0.22 * w * w + 0.05 : 0), sg * w * 1.15); const k = sg ? 1 : 0.5; lc.push(k, k, k); }
        if (i < NL) { const a = i * 3; li.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
      }
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3)); lg.setIndex(li); lg.computeVertexNormals();
      const leaves = new THREE.InstancedMesh(lg, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true }), n), lr = rng.fork('leaves'), data = [], c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        path.posAtDist(lr.range(5, 150), P);
        data.push({ x: P.x + lr.sign() * lr.range(2, 42), z: P.z + lr.range(-6, 6), a: lr() * TAU, ph: lr() * 9, s: lr.range(0.7, 1.5) });
        leaves.setColorAt(i, c.set(lr.pick(['#c8782a', '#a8521e', '#d9a93a', '#8a4a22'])));
      }
      leaves.frustumCulled = false; aboveG.add(leaves);
      anims.push((time) => {
        for (let i = 0; i < n; i++) {
          const s = data[i];
          P.set(s.x + 0.6 * Math.sin(time * 0.21 + s.ph), 0.08, s.z + 0.6 * Math.cos(time * 0.17 + s.ph));
          M4.compose(P, Q.setFromAxisAngle(UPV, s.a + time * 0.1 * Math.sin(s.ph)), S.set(s.s, s.s, s.s)); leaves.setMatrixAt(i, M4);
        }
        leaves.instanceMatrix.needsUpdate = true;
      });
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the film: rain rings, the meniscus flash, the silver ceiling
    const filmG = new THREE.Group(); scene.add(filmG);
    const quad = () => new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    if (rain) {
      const n = 90, g = new THREE.InstancedBufferGeometry().copy(quad()), ir = new Float32Array(n * 4), rr = rng.fork('rings');
      for (let i = 0; i < n; i++) { path.posAtDist(rr.range(0, 210), P); ir[i * 4] = P.x + rr.range(-45, 45); ir[i * 4 + 1] = P.z + rr.range(-12, 12); ir[i * 4 + 2] = rr(); ir[i * 4 + 3] = rr.range(2.5, 6); }
      g.setAttribute('iR', new THREE.InstancedBufferAttribute(ir, 4)); g.instanceCount = n;
      const rings = new THREE.Mesh(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: U.uTime },
        vertexShader: /* glsl */`
          attribute vec4 iR; uniform float uTime; varying vec3 vQ;
          void main() {
            float age = fract(uTime * 0.6 + iR.z);
            vQ = vec3(position.xz, age);
            gl_Position = projectionMatrix * viewMatrix * vec4(iR.x + position.x * iR.w * (0.15 + age), 0.05, iR.y + position.z * iR.w * (0.15 + age), 1.0);
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vQ;
          void main() {
            float r = length(vQ.xy), a = (1.0 - vQ.z) * (1.0 - vQ.z);
            float g1 = (r - 0.86) / 0.07, g2 = (r - 0.5) / 0.06;
            float band = exp(-g1 * g1) + 0.5 * exp(-g2 * g2);
            gl_FragColor = vec4(vec3(0.75, 0.85, 0.85) * band * a * 0.55, 1.0);
          }`,
      }));
      rings.frustumCulled = false; rings.renderOrder = -0.7; filmG.add(rings);
    }
    const PLG = V3(0, 0.03, -144);
    const flash = new THREE.Mesh(quad().scale(16, 1, 16), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uR: { value: 0.5 }, uI: { value: 0 }, uCol: { value: dark ? new THREE.Color(0.6, 0.8, 1.0) : new THREE.Color(1.0, 1.0, 0.94) } },
      vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uR; uniform float uI; uniform vec3 uCol; varying vec2 vQ;
        void main() {
          float r = length(vQ), w = 0.12 + uR * 0.14;
          float g1 = (r - uR) / w, g2 = (r - uR * 0.6) / w;
          float band = exp(-g1 * g1) + 0.25 * exp(-g2 * g2);
          gl_FragColor = vec4(uCol * band * uI, 1.0);
        }`,
    }));
    flash.position.copy(PLG); flash.renderOrder = -0.6; flash.frustumCulled = false; filmG.add(flash);
    const ceilU = { uTime: U.uTime, uSilver: { value: new THREE.Color(LK.silver) }, uWindow: { value: new THREE.Color(LK.window) }, uPad: { value: new THREE.Color(dark ? '#0a1c18' : '#2f6a3a') },
      uPadLit: { value: dark ? new THREE.Color(0.1, 0.3, 0.26) : new THREE.Color('#8fc24e') }, uDeep: { value: dark ? backCol : pal[2].clone().lerp(pal[3], 0.2) }, uXPadA: { value: new THREE.Vector4(0, 0, 3.4, 1.2) }, uXPadB: { value: new THREE.Vector4(0, 0, 2.7, 4.0) }, uXPadC: { value: new THREE.Vector4(0, 0, 2.3, 2.6) },
      uSun: { value: V3(0, 0, 1) }, uSunC: { value: (dark ? new THREE.Color(0.55, 0.7, 1.0) : lookId === 'golden' ? new THREE.Color(1.0, 0.72, 0.4) : new THREE.Color(1.0, 0.97, 0.86)).multiplyScalar(rain ? 0.35 : dark ? 0.7 : 1) }, uBank: { value: treeLow.clone().lerp(new THREE.Color(LK.window), 0.25) },
      uFade: { value: 0 }, uFly: { value: V3(0, 0, 0) }, uAz: { value: (damsel ? new THREE.Color('#d8322a') : AZ.clone()).multiplyScalar(dark ? 0.5 : 1) }, uRain: { value: rain ? 1 : 0 }, uWin: { value: V3(0, 0, 11) } };
    // pad cells of the ceiling: an exact small-integer hash, so build() can hang a stem under the very pads the shader draws
    const hcell = (ix, iz, k) => { const n = ix * ix * 3 + iz * iz * 5 + ix * iz * 7 + ix * (11 + 6 * k) + iz * (17 + 4 * k) + 0.5; return (((n % 23) + 23) % 23) / 23; };
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(1400, 48).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: ceilU,
      vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uSilver; uniform vec3 uWindow; uniform vec3 uPad; uniform vec3 uPadLit; uniform vec3 uDeep; uniform vec3 uBank;
        uniform float uFade; uniform vec3 uFly; uniform vec3 uAz; uniform float uRain; uniform vec3 uWin; uniform vec4 uXPadA; uniform vec4 uXPadB; uniform vec4 uXPadC; uniform vec3 uSun; uniform vec3 uSunC;
        varying vec3 vW;
        float hc(vec2 id, float k) { return mod(id.x * id.x * 3.0 + id.y * id.y * 5.0 + id.x * id.y * 7.0 + id.x * (11.0 + 6.0 * k) + id.y * (17.0 + 4.0 * k) + 0.5, 23.0) / 23.0; }
        float p8(float x) { x = x * x; x = x * x; return x * x; }
        // a lily pad from below (cell units): notched, veined, pale where the stem joins, lit through where the sky is behind it
        vec4 padAt(vec2 pv, float pr, float pa0, float aa, float fine, float win, float rp) {
          float pl = length(pv), pa = atan(pv.y, pv.x + 1e-5) - pa0, rr = pl / pr;
          float dn = abs(mod(pa + 3.14159265, 6.2831853) - 3.14159265);
          float m = (1.0 - smoothstep(pr - aa, pr + aa, pl)) * smoothstep(0.1, 0.1 + aa / max(pl, 0.02), dn);
          float vein = (1.0 - smoothstep(0.0, 0.16 + 0.1 * rr, abs(sin(pa * 6.5)))) * smoothstep(0.08, 0.2, rr) * (1.0 - 0.6 * rr) * fine;
          float vein2 = (1.0 - smoothstep(0.0, 0.25, abs(sin(pa * 19.5 + 3.0 * rr)))) * smoothstep(0.45, 0.8, rr) * fine * 0.45;
          vec3 pc = mix(uPad * 0.9, uPadLit, win * 0.85);
          pc *= 1.0 - 0.42 * max(vein, vein2);
          pc *= 1.0 - 0.45 * smoothstep(0.8, 1.0, rr);
          pc = mix(pc, uPadLit * 1.25, (1.0 - smoothstep(0.04, 0.2, rr)) * 0.6);
          return vec4(pc * (0.92 + 0.12 * rp), m);
        }
        void main() {
          vec3 dv = vW - cameraPosition + vec3(0.0, 1e-4, 0.0);
          float dist = length(dv.xz);
          vec3 d = dv / max(length(dv), 1e-4);
          float far = 1.0 - smoothstep(120.0, 420.0, dist), near = 1.0 - smoothstep(30.0, 150.0, dist);
          vec2 wv = vW.xz - uWin.xy; float wr = length(wv) / uWin.z, az = atan(wv.x, wv.y + 1e-5);
          float wob = 0.06 * sin(az * 5.0 + uTime * 1.7) + 0.036 * sin(az * 9.0 - uTime * 2.3) + 0.024 * sin(az * 17.0 + uTime * 3.1);
          float win = 1.0 - smoothstep(0.955 + wob, 1.0 + wob, wr);
          float e1 = (wr - 0.985 - wob) / 0.02;
          float edge = exp(-e1 * e1) * (0.5 + 0.5 * abs(d.y));                                       // the crisp Snell rim
          float tir = smoothstep(1.0 + wob, 1.035 + wob, wr) * (1.0 - smoothstep(1.06 + wob, 1.5 + wob, wr));   // dark ring of total reflection
          vec2 p = vW.xz * 0.33;
          float rp = sin(p.x * 1.3 + uTime * 1.1) * sin(p.y * 1.7 - uTime * 0.9) + 0.5 * sin((p.x + p.y) * 2.9 + uTime * 1.6);
          rp += uRain * 0.8 * sin(length(fract(vW.xz * 0.11) - 0.5) * 40.0 - uTime * 7.0);
          rp += 0.6 * sin(p.x * 4.1 - uTime * 1.9) * sin(p.y * 3.7 + uTime * 1.4);
          // moving caustic lines at two scales
          vec2 cw = vW.xz * 0.5 + 1.4 * vec2(sin(vW.z * 0.21 + uTime * 0.7), cos(vW.x * 0.17 - uTime * 0.6));
          float ca = p8(abs(sin(cw.x + 1.2 * sin(cw.y * 1.3 + uTime * 0.9)))) + p8(abs(sin(cw.y * 1.1 + 1.3 * sin(cw.x * 0.9 - uTime * 1.1))))
            + 0.6 * p8(abs(sin(cw.x * 2.7 + cw.y * 1.9 + 1.5 * sin(cw.y * 2.3 - uTime * 1.3))));
          ca *= near;
          vec3 silver = mix(uSilver, uDeep, 0.66) * (0.72 + 0.09 * rp) + uSilver * ca * 0.5;
          // the window: sky overhead, the bank's trees bent round its rim
          float bank = smoothstep(0.74, 0.9, wr + 0.035 * sin(az * 7.0 + 1.0) + 0.02 * sin(az * 19.0)) * (0.75 + 0.25 * sin(az * 31.0 + 2.0 * sin(az * 5.0)));
          vec3 skyc = uWindow * (1.0 + 0.1 * rp + 0.45 * max(1.0 - wr, 0.0)) + vec3(0.1) * ca;
          skyc = mix(skyc, uBank * (0.9 + 0.2 * rp), bank * 0.7);
          // the sun (or the moon) seen through the window: a soft disc, slow rays, wobbling with the film
          vec2 sv = vW.xz - uSun.xy + 1.2 * vec2(sin(uTime * 1.3 + vW.z * 0.4), cos(uTime * 1.1 + vW.x * 0.4)) * 0.3; float s2 = dot(sv, sv);
          float rays = p8(abs(sin(atan(sv.y, sv.x + 1e-5) * 5.0 + uTime * 0.25))) * exp(-s2 / 70.0) * 0.3;
          skyc += uSunC * (exp(-s2 / 2.2) * 2.4 + exp(-s2 / 30.0) * 0.4 + rays) * uSun.z;
          vec3 col = mix(silver, skyc, win);
          col *= 1.0 - 0.42 * tir;
          col += vec3(0.75) * edge;
          // lily pads from below: notched, veined, pale where the stem joins, lit through where the sky is behind them
          vec2 g = vW.xz / 10.0; float fwg = fwidth(g.x) + fwidth(g.y);
          vec2 id = floor(g), f = fract(g) - 0.5;
          vec2 o = (vec2(hc(id, 1.0), hc(id, 2.0)) - 0.5) * 0.34;
          float pr = 0.17 + 0.15 * hc(id, 3.0);
          float aa = max(fwg, 0.003), fine = 1.0 - smoothstep(0.01, 0.05, fwg), pk = (1.0 - smoothstep(0.12, 0.45, fwg)) * far * 0.94 * (1.0 - smoothstep(90.0, 260.0, dist));
          vec4 pd = padAt(f - o, pr, hc(id, 4.0) * 6.2831853, aa, fine, win, rp);
          col = mix(col, pd.rgb, pd.a * step(0.42, hc(id, 0.0)) * pk);
          pd = padAt((vW.xz - uXPadA.xy) / 10.0, uXPadA.z / 10.0, uXPadA.w, aa, fine, win, rp); col = mix(col, pd.rgb, pd.a * pk);
          pd = padAt((vW.xz - uXPadB.xy) / 10.0, uXPadB.z / 10.0, uXPadB.w, aa, fine, win, rp); col = mix(col, pd.rgb, pd.a * pk);
          pd = padAt((vW.xz - uXPadC.xy) / 10.0, uXPadC.z / 10.0, uXPadC.w, aa, fine, win, rp); col = mix(col, pd.rgb, pd.a * pk);
          // the guide leaving: a long blur with a bright core, crossing the window
          vec2 fd = vW.xz - uFly.xy;
          float blur = exp(-(fd.x * fd.x * 0.3 + fd.y * fd.y) / 7.0), core = exp(-(fd.x * fd.x * 0.25 + fd.y * fd.y * 3.0) / 1.6);
          float wing = exp(-(fd.x * fd.x * 2.0 + fd.y * fd.y * 0.12) / 2.2) * (0.6 + 0.4 * sin(uTime * 47.0));
          col = mix(col, uAz, blur * uFly.z * 0.55);
          col += (uAz * 1.2 * core + vec3(0.4) * wing) * uFly.z;
          gl_FragColor = vec4(col, (1.0 - uFade) * smoothstep(0.06 + 0.3 * uFade, 0.25 + 0.5 * uFade, abs(d.y)) * far);
        }`,
    }));
    // the sky window lies over the path 17 m past the plunge; uUnderWin is where on the path the camera passes under its centre
    const dWin = uPl * LEN + 17, uUnderWin = dWin / LEN, WINP = path.posAtDist(dWin, V3()); WINP.y = 0; ceilU.uWin.value.set(WINP.x, WINP.z, 11);
    ceil.position.set(SC.x, 0, SC.z); ceil.renderOrder = -0.8; ceil.frustumCulled = false; scene.add(ceil);
    {   // lily stems hanging under the pads round the plunge; children of the ceiling, so they lift away and fade with it
      const sr = rng.fork('stems'), d0 = uPl * LEN, cand = [], gs = [], filmPads = [];
      // how far a pad lies, on the film, from the path's first 46 m under it
      const beside = (x, z) => { let best = 1e9; for (let k = 2; k <= 46; k += 2) { path.posAtDist(d0 + k, P); best = Math.min(best, Math.hypot(P.x - x, P.z - z)); } return best; };
      for (let ix = -6; ix <= 5; ix++) for (let iz = -21; iz <= -12; iz++) {
        if (hcell(ix, iz, 0) < 0.42) continue;
        const x = (ix + 0.5 + (hcell(ix, iz, 1) - 0.5) * 0.34) * 10, z = (iz + 0.5 + (hcell(ix, iz, 2) - 0.5) * 0.34) * 10;
        const best = beside(x, z);
        filmPads.push({ x, z, r: (0.17 + 0.15 * hcell(ix, iz, 3)) * 10 });
        if (best > 4.5 && best < 27 && Math.hypot(x - WINP.x, z - WINP.z) > 3) cand.push({ x, z, best });
      }
      cand.sort((a, b) => a.best - b.best);
      // two pads placed by hand where the camera looks as it goes under: one against the sky window to port, one to starboard
      [[ceilU.uXPadA.value, 23, -5.6], [ceilU.uXPadB.value, 31, 7.2]].forEach(([v, dd, lat]) => {
        path.posAtDist(d0 + dd, P); path.tangentAtDist(d0 + dd, P2); P2.y = 0; P2.normalize().cross(UPV);
        v.x = P.x + P2.x * lat; v.y = P.z + P2.z * lat;
        cand.unshift({ x: v.x, z: v.y, best: 0, hand: true });
        filmPads.push({ x: v.x, z: v.y, r: v.z });
      });
      ceilU.uSun.value.set(WINP.x + 3.2, WINP.z - 4.6, rain ? 0.5 : 1);
      // one stem under the pad c, dealt from the stream r; a stem that would pass within 4.5 m of the path is not hung (the two hand pads keep theirs)
      const hang = (c, r) => {
        const a = r() * TAU, dr = c.hand ? 1.5 : r.range(3, 9), L = r.range(55, 80), pts = [];
        let clear = true;
        for (let j = 0; j <= 6; j++) {
          const t = j / 6, x = c.x + Math.cos(a) * dr * t * t + 0.5 * Math.sin(t * 9 + a), y = -L * t, z = c.z + Math.sin(a) * dr * t * t;
          if (j && path.distanceTo(x, y, z) < 4.5) clear = false;
          pts.push(V3(x - SC.x, y, z - SC.z));
        }
        if (clear || c.hand) gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, c.hand ? 0.3 : 0.24, 6));
      };
      for (const c of cand) {
        if (gs.length >= 11) break;
        hang(c, sr);
      }
      // a third pad lies across the rim of the sky window, wherever its seeded draw puts it: an angle all the way round the window
      // point and a distance of 0.6 to 1.4 window radii from it, drawn again only while it would lie on another pad. Its stream is
      // forked once the stems above are dealt, so none of them is re-dealt. Its stem hangs by the rule of the field's stems: only
      // under a pad more than 4.5 m beside the path, and only if the whole stem keeps 4.5 m from the path
      {
        const tr = sr.fork('rimpad'), v = ceilU.uXPadC.value;
        for (let k = 0; k < 12; k++) {
          const a = tr() * TAU, rr = ceilU.uWin.value.z * tr.range(0.6, 1.4);
          v.x = WINP.x + Math.cos(a) * rr; v.y = WINP.z + Math.sin(a) * rr;
          if (filmPads.every((q) => Math.hypot(q.x - v.x, q.z - v.y) > q.r + v.z)) break;
        }
        if (beside(v.x, v.y) > 4.5) hang({ x: v.x, z: v.y }, tr);
      }
      if (!gs.length) gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(60, 0, 0), V3(61, -30, 0), V3(63, -60, 0)]), 8, 0.24, 6));
      const stems = new THREE.Mesh(mergeGeometries(gs, false), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, fog: false,
        uniforms: { uFade: ceilU.uFade, uTime: U.uTime, uHaze: U.uHaze, uGreen: { value: dark ? new THREE.Color(0.03, 0.16, 0.12) : new THREE.Color('#4f9a50') },
          uRimC: { value: dark ? new THREE.Color(0.2, 0.8, 0.55) : pal[4].clone().lerp(pal[3], 0.3) }, uCaust: { value: dark ? new THREE.Color(0.1, 0.25, 0.3) : new THREE.Color(0.8, 1.0, 0.7) } },
        vertexShader: /* glsl */`varying vec3 vN; varying vec3 vV; varying vec3 vL;
          void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = mv.xyz; vL = position; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`
          uniform float uFade; uniform float uTime; uniform vec3 uGreen; uniform vec3 uRimC; uniform vec3 uHaze; uniform vec3 uCaust;
          varying vec3 vN; varying vec3 vV; varying vec3 vL;
          void main() {
            float mu = abs(dot(normalize(vN + vec3(0.0, 0.0, 1e-5)), normalize(vV - vec3(0.0, 0.0, 1e-4))));
            vec3 col = mix(uGreen * (0.7 + 0.55 * mu), uRimC, (1.0 - smoothstep(0.0, 0.4, mu)) * 0.7);
            float ca = abs(sin(vL.y * 1.9 + uTime * 2.1 + vL.x)); ca = ca * ca; ca = ca * ca;
            col += uCaust * ca * 0.3 * smoothstep(-25.0, -1.0, vL.y);
            float foc = smoothstep(40.0, 200.0, length(vV)) * 0.8;
            gl_FragColor = vec4(mix(col, uHaze, foc), (1.0 - uFade) * smoothstep(-75.0, -30.0, vL.y));
          }`,
      }));
      stems.renderOrder = 0.4; stems.frustumCulled = false; ceil.add(stems);
    }

    // ---------------------------------------------------------------- under the film (M 20 -> 2,000): stem, hydra, tadpole, fleas
    const stemR = (y) => Math.min(0.25 * Math.exp(-y * 0.0866), 11);
    {
      const pts = [];
      for (let i = 0; i <= 64; i++) { const y = -300 * Math.pow(i / 64, 1.6); pts.push(new THREE.Vector2(stemR(y), y)); }
      const stem = new THREE.Mesh(new THREE.LatheGeometry(pts, 28).translate(SC.x, 0, SC.z), new THREE.ShaderMaterial({
        side: THREE.DoubleSide, fog: false,
        uniforms: { uTime: U.uTime, uFocus: U.uFocus, uHaze: U.uHaze, uC: { value: new THREE.Vector2(SC.x, SC.z) },
          uGreen: { value: dark ? new THREE.Color(0.02, 0.12, 0.09) : new THREE.Color('#3f9a56') }, uWall: { value: dark ? new THREE.Color(0.25, 0.9, 0.6) : new THREE.Color('#c9f0c0') },
          uRimC: { value: dark ? new THREE.Color(0.2, 0.8, 0.55) : pal[4].clone().lerp(pal[3], 0.25) }, uCaust: { value: dark ? new THREE.Color(0.2, 0.5, 0.6) : new THREE.Color(0.9, 1.0, 0.8) } },
        vertexShader: /* glsl */`
          uniform vec3 uFocus; varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vFoc;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0); vec4 mv = viewMatrix * w;
            vN = normalMatrix * normal; vV = mv.xyz; vW = w.xyz;
            vFoc = smoothstep(uFocus.x, uFocus.y, length(mv.xyz)) * uFocus.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime; uniform vec3 uHaze; uniform vec2 uC; uniform vec3 uGreen; uniform vec3 uWall; uniform vec3 uRimC; uniform vec3 uCaust;
          varying vec3 vN; varying vec3 vV; varying vec3 vW; varying float vFoc;
          void main() {
            float mu = abs(dot(normalize(vN + vec3(0.0, 0.0, 1e-5)), normalize(vV - vec3(0.0, 0.0, 1e-4))));
            vec2 l = vW.xz - uC; float rad = length(l), ang = atan(l.y, l.x + 1e-5);
            float nA = exp2(floor(log2(max(rad, 0.05) * 3.7) + 0.5));          // cells round the stem: doubles as it flares
            vec2 c0 = vec2(ang / 6.2831853 * nA, vW.y / 4.4);
            float fwc = min(max(fwidth(ang) * nA / 6.2831853, fwidth(c0.y)), 2.0);
            vec2 cell = vec2(c0.x + 0.5 * floor(c0.y), c0.y);
            vec2 f = abs(fract(cell) - 0.5);
            float wall = smoothstep(0.42 - fwc, 0.49, max(f.x, f.y));
            float res = smoothstep(1.0, 4.5, rad) * (1.0 - smoothstep(0.25, 0.7, fwc));
            float dots = smoothstep(0.25, 0.1, length(f - vec2(0.18, 0.12))) + smoothstep(0.2, 0.08, length(f + vec2(0.2, 0.05)));
            vec3 col = uGreen * (0.72 + 0.5 * mu) * (1.0 - 0.22 * dots * res);
            col = mix(col, uWall, wall * res * 0.2);
            col *= 1.0 + 0.1 * res * sin(floor(cell.x) * 12.9 + floor(cell.y) * 7.3);          // cell to cell variation
            col = mix(col, uRimC, (1.0 - smoothstep(0.0, 0.34, mu)) * 0.75);
            float ca = abs(sin(vW.y * 1.6 + 2.2 * sin(ang * 3.0 + uTime * 1.3) + uTime * 2.1));
            ca = ca * ca; ca = ca * ca; ca = ca * ca;
            col += uCaust * ca * 0.4 * smoothstep(-30.0, -1.0, vW.y);
            gl_FragColor = vec4(mix(col, uHaze, vFoc), 1.0);
          }`,
      }));
      macroG.add(stem);
    }
    {   // glass bubbles rising through the first metres under the film
      const br = rng.fork('bubbles'), n = Math.round(44 * detail);
      const bu = makeOrg(macroG, { count: n, body: part(ball(1, 14, 10), { c: CLEAR }), center: V3(-8, -8, -162), radius: 70,
        mats: orgMats({ swell: false, jit: 0.03, rimW: 0.34, lineK: 0.7, body: 0.3,
          deform: /* glsl */`p.y *= 1.0 + 0.08 * sin(uTime * 5.0 + sd * 20.0); float isc = 1.0 / max(iD.z, 0.05);
            p.y += (mod(uTime * (1.3 + 1.5 * fract(sd * 13.0)) + sd * 60.0, 16.0) - 8.0) * isc; p.x += 0.4 * sin(uTime * 2.3 + sd * 30.0) * isc;` }) });
      for (let i = 0; i < n; i++) {
        path.posAtDist(uPl * LEN + br.range(5, 52), P);
        const a = br() * TAU, r = br.range(3, 15), sz = br.range(0.18, 0.6) * (br.chance(0.15) ? 1.8 : 1);
        P.x += Math.cos(a) * r; P.z += Math.sin(a) * r; P.y = Math.min(P.y + br.range(-3, 5), -8.6 - sz);
        bu.iD.setZ(i, sz); put(bu, i, P, Q.identity(), sz);
      }
      bu.commit();
    }
    {   // hydra on the stem, waving six tentacles
      const a = 122 * D2R, out = V3(Math.cos(a), -0.25, -Math.sin(a)).normalize(), y = -29, parts = [part(lathe((t) => 0.45 + 0.28 * Math.sin(t * Math.PI), 0, 7, 10, 10), { c: OLT })];
      for (let i = 0; i < 6; i++) {
        const b = i / 6 * TAU;
        parts.push(part(new THREE.CylinderGeometry(0.05, 0.17, 6, 5, 8).rotateX(Math.PI / 2).translate(0, 0, 3), { r: [0.55 * Math.cos(b), 0.55 * Math.sin(b), 0], p: [0, 0, 6.8], c: OLT, ph: i }));
      }
      const hy = makeOrg(macroG, { count: 1, body: merge(parts), core: part(lathe((t) => 0.12 + 0.2 * Math.sin(t * Math.PI), 0.6, 6.4, 8, 8), { c: OLIVE }), center: V3(SC.x, y, SC.z), radius: 30,
        mats: orgMats({ swell: false, jit: 0.04, rimW: 0.36,
          deform: /* glsl */`float h = max(p.z - 1.0, 0.0); float hh = h * h * 0.012; p.x += sin(uTime * 0.9 + aP.y * 1.9 + h * 0.35) * hh; p.y += cos(uTime * 0.7 + aP.y * 2.7 + h * 0.3) * hh;` }) });
      put(hy, 0, P.set(SC.x + out.x * stemR(y) * 0.9, y, SC.z + out.z * stemR(y) * 0.9), aim(out), 1.25); hy.commit();
    }
    const thetaOf = (u) => clamp((u - uPl) / (uTurn - uPl), -0.3, 1.4) * Math.PI;
    {   // the tadpole: olive glass, coiled gut, sculling tail; it rounds the stem against us and passes to port
      const n = season === 'spring' ? 4 : 1, sp = [];
      for (let i = 0; i <= 44; i++) { const a = i * 0.5, r = 0.3 + 0.05 * i; sp.push(V3(0.2 * Math.sin(a * 0.5), -0.5 + Math.sin(a) * r, 4.6 + Math.cos(a) * r)); }
      const TADT = new THREE.Color().setRGB(0.7, 0.8, 0.5);
      const body = merge([part(ball(1, 18, 12), { s: [4.0, 3.4, 6.2], p: [0, 0, 5], c: TADT }),
        part(lathe((t) => 0.08 + 2.3 * Math.pow(t, 0.8) * (1 - 0.74 * smoothstep(0.62, 1, t)), -19, 0.6, 16, 10), { s: [0.32, 1.7, 1], c: TADT })]);
      const core = merge([part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 70, 0.34, 5), { c: OLIVE.clone().lerp(GOLD, 0.35) }),
        part(lathe((t) => 0.05 + 0.8 * t, -17.5, 0.4, 8, 8), { s: [0.55, 1, 1], c: OLIVE.clone().lerp(pal[2], 0.45) }),
        part(ball(0.8, 10, 8), { p: [2.9, 1.3, 8.4], c: BLACK }), part(ball(0.8, 10, 8), { p: [-2.9, 1.3, 8.4], c: BLACK }),
        part(ball(0.5, 8, 6), { s: [1, 0.6, 1], p: [0, -1.2, 10.6], c: OLIVE })]);
      const tp = makeOrg(macroG, { count: n, body, core, center: V3(SC.x, -30, SC.z), radius: 70, mats: orgMats({ swell: false, jit: 0.05, rimW: 0.3, body: 1.3, lineK: 0.25,
        deform: /* glsl */`float sc = sin(uTime * 5.5 + sd * 10.0); if (p.z < 0.0) { float t = -p.z; p.x += sin(t * 0.3 - uTime * 5.5 - sd * 10.0) * 0.011 * t * t; } else { p.x -= sc * 0.03 * p.z; }` }) });
      const u0 = lerp(uPl, uTurn, 0.78), y0 = path.pointAt(u0, P).y - 2.5, tr = rng.fork('tad'), others = [];
      for (let i = 1; i < n; i++) others.push({ y: [-9, -17, -41][i - 1], r: tr.range(17, 21), ph: tr() * TAU, w: tr.range(0.05, 0.09) * tr.sign(), s: tr.range(0.42, 0.6) });
      const dir = V3();
      anims.push((time, u) => {
        // it swims the way we go, slower, so we overtake it broadside, 10 m to port
        const phi = thetaOf(u0) + (u - u0) * 2.5 + 0.02 * Math.sin(time * 0.5);
        put(tp, 0, P.set(SC.x + Math.cos(phi) * 24, y0 + Math.sin(time * 0.6), SC.z - Math.sin(phi) * 24), aim(dir.set(-Math.sin(phi), 0.04 * Math.sin(time * 0.6), -Math.cos(phi)).normalize()), 1);
        others.forEach((o, i) => {
          const f = o.ph + time * o.w, sg = Math.sign(o.w);
          put(tp, i + 1, P.set(SC.x + Math.cos(f) * o.r, o.y, SC.z - Math.sin(f) * o.r), aim(dir.set(-Math.sin(f) * sg, 0, -Math.cos(f) * sg)), o.s);
        });
        tp.commit();
      });
    }
    {   // water fleas hopping on feathered arms; one black eye, a heart beating three times a second; one leads us down
      const n = 12, fr = rng.fork('fleas');
      const body = merge([part(ball(1, 14, 10), { s: [1.15, 1.7, 0.75], c: CLEAR }), part(ball(0.62, 10, 8), { s: [1, 0.9, 0.8], p: [0.25, 1.75, 0], c: CLEAR }),
        part(new THREE.CircleGeometry(1.9, 6, -0.25, 1.1), { p: [0.5, 1.7, 0.1], e: 0.2, k: 1 }), part(new THREE.CircleGeometry(1.9, 6, Math.PI - 0.85, 1.1), { p: [-0.1, 1.7, -0.1], e: 0.2, k: 1 })]);
      const core = merge([part(ball(0.22, 8, 6), { p: [0.5, 1.82, 0], c: BLACK }), part(new THREE.TorusGeometry(0.75, 0.15, 5, 12, Math.PI), { r: [0, 0, 1.2], p: [-0.05, 0.25, 0], c: EM }),
        part(ball(0.2, 8, 6), { p: [-0.35, 0.95, 0], c: '#c85a3a', k: 2 }), part(ball(0.26, 6, 5), { p: [-0.55, 0.1, 0.1], c: OLIVE }), part(ball(0.26, 6, 5), { p: [-0.6, -0.45, -0.1], c: OLIVE })]);
      const fleas = makeOrg(macroG, { count: n, body, core, center: V3(SC.x, -30, SC.z), radius: 120, mats: orgMats({ swell: false, jit: 0.1, rimW: 0.3,
        pattern: /* glsl */`if (vP.w > 0.5 && vP.w < 1.5) {
            vec2 aq = vL.xy - vec2(vL.x > 0.2 ? 0.5 : -0.1, 1.7); float ar = length(aq) / 1.9, aa = atan(aq.y, abs(aq.x) + 1e-4);
            float sx = aa * 7.0 + 0.6 * ar, fs = max(fwidth(sx), 1e-3);
            float seta = 1.0 - smoothstep(0.1 + 0.1 * ar, 0.24 + 0.1 * ar + fs, abs(sin(sx)));
            float br2 = 1.0 - smoothstep(0.03, 0.07 + fwidth(ar) * 2.0, abs(ar - 0.42));
            rim = max(seta * smoothstep(0.38, 0.46, ar), max(br2 * 0.8, (1.0 - smoothstep(0.1, 0.2, abs(sin(aa * 2.0 + 0.5)))) * (1.0 - smoothstep(0.36, 0.44, ar))));
            rim *= (1.0 - smoothstep(0.82, 0.99, ar)) * 0.75; line = 0.0; thick = 0.0;
          }`,
        deform: /* glsl */`if (aP.z > 0.5 && aP.z < 1.5) { p.y += (sin(uTime * 7.0 + sd * 30.0) * 0.45 - 0.15) * abs(p.x); }
          if (aP.z > 1.5) { vec3 hc = vec3(-0.35, 0.95, 0.0); p = hc + (p - hc) * (1.0 + 0.4 * sin(uTime * 18.85)); }` }) });
      const data = [];
      for (let i = 0; i < n; i++) {
        let ok = false;
        for (let k = 0; k < 30 && !ok; k++) {
          const nearFilm = i >= 1 && i <= 3;      // three small ones meet us just under the film
          path.posAtDist(nearFilm ? fr.range(uPl * LEN + 14, uPl * LEN + 44) : fr.range(uPl * LEN + 30, uTurn * LEN + 30), P); randDir(fr, P2).multiplyScalar(nearFilm ? fr.range(6.5, 12) : fr.range(7.5, 24)); P.add(P2);
          ok = P.y < (nearFilm ? -3.5 : -4) && path.distanceTo(P.x, P.y, P.z) > (nearFilm ? 5.5 : 7.5) && Math.hypot(P.x - SC.x, P.z - SC.z) > stemR(P.y) + 4;
        }
        data.push({ p: P.clone(), yaw: fr() * TAU, ph: fr(), rate: fr.range(0.5, 0.9), s: fr.range(0.95, 1.3) * (i >= 1 && i <= 3 ? 0.42 : 1) });
      }
      const uL0 = lerp(uPl, uTurn, 0.6), uL1 = uTurn + 0.045, hop = (k) => { const f = k - Math.floor(k); return f < 0.25 ? Math.sin(f * TAU) : 1 - (f - 0.25) / 0.75; };
      anims.push((time, u) => {
        for (let i = 0; i < n; i++) {
          const s = data[i];
          if (i === 0) {
            const uu = clamp(u, uL0, uL1), d = uu * LEN + 14;
            path.posAtDist(d, P); path.tangentAtDist(d, P2); P2.cross(UPV).normalize();
            P.addScaledVector(P2, lerp(3.4, 9, smoothstep(uL0, uL1, u))); P.y += 0.8;
          } else P.copy(s.p);
          P.y += 2.2 * Math.min(s.s, 1) * hop(time * s.rate + s.ph);
          put(fleas, i, P, Q.setFromAxisAngle(UPV, s.yaw + 0.3 * Math.sin(time * 0.4 + i)), s.s);
        }
        fleas.commit();
      });
    }
    if (season === 'spring') {   // frogspawn: a cloud of clear eggs, each with its dark comma
      const n = 40, sr = rng.fork('spawn'), u0 = uPl + 0.04, c = path.pointAt(u0, V3());
      path.tangentAt(u0, P2); P2.cross(UPV).normalize(); c.addScaledVector(P2, 17); c.y = -7;
      const sp = makeOrg(macroG, { count: n, body: part(ball(2.2, 14, 10), { c: CLEAR }), core: part(ball(0.8, 8, 6), { s: [1, 0.7, 1.5], p: [0.3, -0.2, 0], c: BLACK }), center: c, radius: 16,
        mats: orgMats({ swell: false, jit: 0.07, rimW: 0.22 }) });
      for (let i = 0; i < n; i++) { randDir(sr, P).multiplyScalar(9 * Math.cbrt(sr())); P.y *= 0.55; put(sp, i, P.add(c), Q.setFromAxisAngle(randDir(sr, P2), sr() * 3), sr.range(0.8, 1.1)); }
      sp.commit();
    }
    await ctx.yield();

    // motes: out-of-focus discs that drift everywhere below the film and sharpen as they near
    const underG = new THREE.Group(); scene.add(underG);
    {
      const n = Math.round(2400 * detail * lush), pos = new Float32Array(n * 3), am = new Float32Array(n * 4), mr = rng.fork('motes');
      for (let i = 0; i < n; i++) {
        path.posAtDist(mr.range(150, LEN + 20), P); randDir(mr, P2).multiplyScalar(8 + 150 * Math.pow(mr(), 0.7)); P.add(P2);
        if (P.y > -2) P.y = -2 - mr() * 20;
        pos[i * 3] = P.x; pos[i * 3 + 1] = P.y; pos[i * 3 + 2] = P.z;
        am[i * 4] = mr.range(0.35, 1.0) * (mr.chance(0.12) ? 2.6 : 1); am[i * 4 + 1] = mr(); am[i * 4 + 2] = mr(); am[i * 4 + 3] = mr();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aM', new THREE.BufferAttribute(am, 4));
      const motes = new THREE.Points(g, new THREE.ShaderMaterial({
        ...GLASS_BLEND, fog: false, uniforms: { ...U },
        vertexShader: /* glsl */`
          attribute vec4 aM; uniform float uResY; varying vec3 vA;
          ${G_COMMON}
          void main() {
            vec3 p = position + jitv(aM.y) * 1.6 + vec3(sin(uTime * 0.11 + aM.y * 30.0) * 3.0, sin(uTime * 0.07 + aM.w * 30.0) * 2.0, 0.0);
            vec4 mv = viewMatrix * vec4(p, 1.0); float d = max(-mv.z, 0.1);
            float blur = smoothstep(30.0, 240.0, d);
            float px = uResY * projectionMatrix[1][1] * 0.5 * aM.x * (1.0 + blur * 3.5) / d;
            gl_PointSize = clamp(px, 2.0, 64.0);
            vA = vec3((1.0 - 0.72 * blur) * smoothstep(3.0, 12.0, d) * (1.0 - smoothstep(380.0, 520.0, d)) * min(1.0, px / 2.0), blur, aM.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vA;
          ${G_GLASS}
          void main() {
            float r = length(gl_PointCoord - 0.5) * 2.0, soft = mix(0.14, 0.9, vA.y);
            float disc = 1.0 - smoothstep(1.0 - soft, 1.0, r);
            float ring = (1.0 - vA.y) * smoothstep(0.5, 0.8, r) * disc;
            vec3 tc = mix(vec3(0.78, 0.94, 0.80), vec3(0.72, 0.92, 0.58), vA.z);
            vec3 T = mix(vec3(1.0), tc, disc * vA.x * 0.6);
            T = mix(T, uRim, ring * vA.x * 0.45);
            gl_FragColor = glassOut(T, vec3(0.0));
          }`,
      }));
      motes.frustumCulled = false; motes.renderOrder = 1; underG.add(motes);
    }

    // ---------------------------------------------------------------- the micro world (M 60,000 -> 150,000)
    const spot = (r, d0, d1, lat0, lat1, rad, test) => {
      for (let k = 0; k < 40; k++) {
        path.posAtDist(r.range(d0, d1), P); randDir(r, P2).multiplyScalar(r.range(lat0, lat1)); P.add(P2);
        if (P.y < -10 && path.distanceTo(P.x, P.y, P.z) > rad + 7 && P.distanceTo(VC) > 82 + rad && (!test || test(P))) break;
      }
      return P.clone();
    };
    const dTurn = uTurn * LEN, dCurt = uCurt * LEN, dN = uN * LEN, dF = uF * LEN, dB = uB * LEN;
    const deckSide = (p) => P3.subVectors(p, PORT).dot(nDeck) > 26;      // on our side of the plain the target diatom becomes
    const prof = (list) => (t) => { let i = 1; while (i < list.length - 1 && list[i][0] < t) i++; const a = list[i - 1], b = list[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], t)); };
    {   // Spirogyra: a curtain of glass tubes, two emerald ribbons wound in each, with a 16 m gap for us
      const sr = rng.fork('spiro'), fil = [];
      for (let x = -215; x <= 215; x += sr.range(5.5, 8.5)) {
        if (Math.abs(x) < 9.6) continue;
        const near = Math.abs(x) < 34, tilt = sr.range(-1, 1) * (near ? 0.05 : 0.24), ta = sr() * TAU;
        fil.push({ x: CURT.x + x, y: CURT.y + sr.range(-30, 30), z: CURT.z + sr.range(-1, 1) * (near ? 4 : 15), d: V3(Math.sin(ta) * tilt, 1, Math.cos(ta) * tilt).normalize(), L: sr.range(170, 300) });
      }
      if (rare) fil.push({ x: CURT.x + 10.8, y: CURT.y, z: CURT.z - 6, d: V3(0, 1, 0), L: 260 });
      const sp = makeOrg(microG, { count: fil.length, body: part(new THREE.CylinderGeometry(1, 1, 1, 12, 1, true), { c: CLEAR }), core: part(new THREE.CylinderGeometry(0.84, 0.84, 1, 12, 1, true), { c: EM }),
        center: CURT, radius: 400, mats: orgMats({ swell: false, jit: 0.05, rimW: 0.3,
          pattern: /* glsl */`float cy = vL.y * vP.z / 6.0; float cw = abs(fract(cy) - 0.5); dk = max(dk, 0.5 * (1.0 - smoothstep(0.0, 0.025 + fwidth(cy), cw)));`,
          corePattern: /* glsl */`float sa = atan(vL.z, vL.x + 1e-5) / 6.2831853; float yy = vL.y * vP.z;
            float hx = abs(fract((sa + yy * 0.085 + uTime * 0.035 + vP.y) * 2.0) - 0.5);
            if (hx > 0.2 + 0.035 * sin(yy * 7.0)) discard;
            col *= (1.0 - 0.45 * smoothstep(0.08, 0.2, hx)) * (1.0 + 0.35 * (1.0 - smoothstep(0.0, 0.05, hx)));` }) });
      fil.forEach((f, i) => { sp.iD.setZ(i, f.L); put(sp, i, P.set(f.x, f.y, f.z), Q.setFromUnitVectors(UPV, f.d), S.set(1.2, f.L, 1.2)); });
      sp.commit();
    }
    if (rare) {   // the rare event: a water bear clambers along the curtain and turns its blunt head as we pass
      const TBT = new THREE.Color().setRGB(0.93, 0.9, 0.74), parts = [], cores = [];
      [[-5, 2.1], [-2.5, 2.5], [0, 2.6], [2.5, 2.3]].forEach(([z, r]) => parts.push(part(ball(r, 14, 10), { s: [1, 0.9, 1.25], p: [0, 0, z], c: TBT })));
      parts.push(part(ball(1.75, 12, 10), { p: [0, -0.1, 5.2], c: TBT }), part(ball(0.75, 8, 6), { p: [0, -0.4, 6.9], c: TBT }));
      [-4.6, -1.6, 1.4, 3.9].forEach((z, i) => [-1, 1].forEach((sx) => {
        parts.push(part(new THREE.CylinderGeometry(0.8, 0.55, 2.4, 8, 2), { r: [0, 0, sx * 0.5], p: [sx * 2.0, -2.4, z], c: TBT, k: 1, ph: i + (sx > 0 ? 0.5 : 0) }));
        cores.push(part(new THREE.ConeGeometry(0.22, 0.8, 5), { r: [Math.PI, 0, sx * 0.5], p: [sx * 2.6, -3.7, z], c: OLIVE, k: 1, ph: i + (sx > 0 ? 0.5 : 0) }));
      }));
      cores.push(part(ball(0.28, 6, 5), { p: [0.8, 0.9, 6.1], c: BLACK }), part(ball(0.28, 6, 5), { p: [-0.8, 0.9, 6.1], c: BLACK }),
        part(lathe((t) => 0.2 + 1.2 * Math.sin(t * Math.PI), -4.5, 3.2, 10, 8), { c: OLIVE.clone().lerp(EM, 0.45) }));
      const tb = makeOrg(microG, { count: 1, body: merge(parts), core: merge(cores), center: CURT, radius: 60, mats: orgMats({ swell: false, jit: 0.03, rimW: 0.3, body: dark ? 0.7 : 1.2,
        deform: /* glsl */`if (aP.z > 0.5 && aP.z < 1.5) { float w = uTime * 1.6 + aP.y * 2.4; p.z += sin(w) * 0.55; p.y += max(cos(w), 0.0) * 0.4; }
          p.xy *= 1.0 + 0.035 * sin(uTime * 1.6 + p.z * 0.6);
          float hk = smoothstep(3.6, 6.2, p.z); p = mix(p, vec3(0.0, 0.0, 4.2) + rotAx(p - vec3(0.0, 0.0, 4.2), vec3(0.0, 1.0, 0.0), iD.z), hk);` }) });
      const qb = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(1, 0, 0), V3(0, 0, -1), V3(0, 1, 0)));
      anims.push((time, u) => {
        tb.iD.setZ(0, -0.95 * smoothstep(uCurt - 0.09, uCurt - 0.015, u) + 0.12 * Math.sin(time * 0.8)); tb.iD.needsUpdate = true;
        put(tb, 0, P.set(CURT.x + 10.8, CURT.y + 1 + (u - uCurt) * 90 + 0.8 * Math.sin(time * 0.5), CURT.z - 10.3), qb, 1); tb.commit();
      });
    }
    await ctx.yield();
    {   // desmids: crescent Closterium and star Micrasterias, turning slowly
      const dr = rng.fork('desmids'), bendG = (g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + 0.036 * p.getZ(i) * p.getZ(i)); return g; };
      const nc = Math.round(9 * lush) + 3, ns = Math.round(8 * lush) + 2;      // the last three and two turn in the bend of the last dive
      const clo = makeOrg(microG, { count: nc, center: CURT, radius: 460, mats: orgMats({ jit: 0.25, rimW: 0.3 }),
        body: bendG(part(lathe((t) => 0.05 + 1.15 * Math.pow(Math.sin(t * Math.PI), 0.6), -7, 7, 16, 10), { c: CLEAR })),
        core: bendG(merge([part(lathe((t) => 0.03 + 0.85 * Math.pow(Math.sin(t * Math.PI), 0.7), 0.45, 6.3, 8, 8), { c: EM }), part(lathe((t) => 0.03 + 0.85 * Math.pow(Math.sin(t * Math.PI), 0.7), -6.3, -0.45, 8, 8), { c: EM })])) });
      const starR = (a) => 6 * (0.6 + 0.4 * Math.pow(Math.abs(Math.cos(a * 4)), 0.5)) * (0.28 + 0.72 * Math.pow(Math.abs(Math.sin(a)), 0.35));
      const mic = makeOrg(microG, { count: ns, center: CURT, radius: 460, mats: orgMats({ jit: 0.25, rimW: 0.4 }),
        body: part(plate(starR, 128, 0.84), { c: CLEAR }), core: part(plate((a) => starR(a) * 0.8, 128, 0.5), { c: EM }) });
      const data = [];
      for (let i = 0; i < nc + ns; i++) {
        const bend = i < nc ? i >= nc - 3 : i >= nc + ns - 2;
        data.push({ p: bend ? spot(dr, dB - 20, LEN - 45, 16, 58, 12, deckSide) : spot(dr, dTurn + 15, dN + 30, 9, 80, 8), ax: randDir(dr), q0: new THREE.Quaternion().setFromAxisAngle(randDir(dr), dr() * 3), w: dr.range(0.08, 0.22) * dr.sign(), s: dr.range(0.8, 1.35) * (bend ? 1.7 : 1) });
      }
      anims.push((time) => {
        for (let i = 0; i < nc + ns; i++) { const d = data[i]; Q.setFromAxisAngle(d.ax, time * d.w).multiply(d.q0); put(i < nc ? clo : mic, i < nc ? i : i - nc, d.p, Q, d.s); }
        clo.commit(); mic.commit();
      });
    }
    {   // Euglena: sixty flexing spindles, one orange eyespot each
      const er = rng.fork('euglena'), n = Math.round(60 * lush * (season === 'summer' ? 1.5 : 1) * detail);
      const eu = makeOrg(microG, { count: n, center: VC, radius: 340, mats: orgMats({ jit: 0.3, rimW: 0.3,
          deform: /* glsl */`p.xy *= 1.0 + 0.2 * sin(position.z * 1.3 - uTime * 2.2 + sd * 40.0); p.x += 0.35 * sin(position.z * 0.6 + uTime * 1.4 + sd * 9.0); p.z += sin(uTime * 0.25 + sd * 77.0) * 5.0;` }),
        body: part(lathe((t) => 0.04 + 0.95 * Math.pow(Math.sin(t * Math.PI), 0.75) * (0.75 + 0.4 * t), -4, 4, 10, 8), { c: CLEAR }),
        core: merge([part(lathe((t) => 0.03 + 0.6 * Math.pow(Math.sin(t * Math.PI), 0.7) * (0.75 + 0.4 * t), -2.9, 2.5, 6, 7), { c: EM }), part(ball(0.25, 6, 5), { p: [0.32, 0.25, 3.0], c: ORANGE })]) });
      for (let i = 0; i < n; i++) put(eu, i, spot(er, dTurn + 10, dF + 60, 8, 90, 5), aim(randDir(er, P2)), er.range(0.8, 1.3));
      eu.commit();
    }
    {   // diatoms: glass boats (or discs) with two gold plates, gliding in straight lines and reversing
      const dr = rng.fork('diatoms'), n0 = Math.round(14 * lush), n = n0 + 14;      // fourteen more fill the bend of the last dive
      const body = discDiatoms ? part(lathe(prof([[0, 0], [0.12, 0.5], [0.88, 0.5], [1, 0]]), -0.1, 0.1, 10, 28), { c: CLEAR })
        : part(lathe((t) => 0.004 + 0.17 * Math.pow(Math.max(1 - (2 * t - 1) * (2 * t - 1), 0), 0.6), -0.5, 0.5, 14, 12), { s: [1, 0.42, 1], c: CLEAR });
      const cores = [];
      if (discDiatoms) for (let i = 0; i < 8; i++) cores.push(part(ball(0.08, 6, 5), { s: [1, 1, 0.5], p: [0.3 * Math.cos(i / 8 * TAU), 0.3 * Math.sin(i / 8 * TAU), 0], c: GOLD }));
      else cores.push(part(ball(1, 8, 6), { s: [0.085, 0.03, 0.19], p: [0, 0, 0.21], c: GOLD }), part(ball(1, 8, 6), { s: [0.085, 0.03, 0.19], p: [0, 0, -0.21], c: GOLD }));
      const di = makeOrg(microG, { count: n, center: VC, radius: 360, body, core: merge(cores), mats: orgMats({ jit: 0.12, rimW: 0.3, lineK: 0.45,
        pattern: discDiatoms
          ? /* glsl */`float sa = atan(vL.y, vL.x + 1e-5) * 36.0; float rr = length(vL.xy); dk = max(dk, 0.26 * smoothstep(0.3, 0.8, abs(sin(sa))) * smoothstep(0.1, 0.16, rr) * (1.0 - smoothstep(0.5, 1.5, fwidth(rr * 220.0))));
              dk = max(dk, 0.3 * (1.0 - smoothstep(0.0, 0.012, abs(rr - 0.2))));`
          : /* glsl */`float sa = vL.z * 150.0; dk = max(dk, 0.3 * smoothstep(0.4, 0.8, abs(sin(sa))) * (1.0 - smoothstep(0.7, 2.0, fwidth(sa))) * smoothstep(0.012, 0.03, abs(vL.x)));
              dk = max(dk, 0.45 * (1.0 - smoothstep(0.003, 0.008 + fwidth(vL.x), abs(vL.x))));` }) });
      const data = [];
      for (let i = 0; i < n0; i++) data.push({ p: spot(dr, dCurt - 20, LEN - 90, 14, 100, 18), d: randDir(dr), ph: dr(), sp: dr.range(0.035, 0.07), s: dr.range(16, 30), roll: dr() * TAU, A: dr.range(10, 18) });
      for (let i = n0; i < n; i++) {
        const k = i - n0;
        if (k < 3) {   // three glide beside the path as foreground, parallel to it so they never cross it
          const dd = lerp(0.825, 0.885, k / 2) * LEN, side = k === 1 ? -1 : 1, tg = path.tangentAtDist(dd, V3());
          path.posAtDist(dd, P); P.x += side * dr.range(15, 20); P.y += dr.range(-5, 3);
          data.push({ p: P.clone(), d: tg, ph: dr(), sp: dr.range(0.03, 0.05), s: dr.range(19, 25), roll: dr.range(0.5, 1.1) * side, A: dr.range(4, 7) });
        } else data.push({ p: spot(dr, dB - 20, LEN - 40, 16, 62, 16, deckSide), d: randDir(dr), ph: dr(), sp: dr.range(0.035, 0.07), s: dr.range(16, 30), roll: dr() * TAU, A: dr.range(6, 12) });
      }
      anims.push((time) => {
        for (let i = 0; i < n; i++) {
          const d = data[i], k = time * d.sp + d.ph, tri = 2 * Math.abs(k - Math.floor(k) - 0.5) - 0.5;
          aim(d.d).multiply(Q2.setFromAxisAngle(ZV, d.roll + 0.1 * Math.sin(time * 0.3 + i)));
          put(di, i, P.copy(d.p).addScaledVector(d.d, tri * 2 * d.A), Q, d.s);
        }
        di.commit();
      });
    }
    await ctx.yield();
    {   // paramecia corkscrewing on wide loops; the first one leads us into the Volvox
      const pr = rng.fork('param'), n = 14;
      const cores = [part(ball(1, 10, 8), { s: [2.1, 1.5, 3.3], p: [0.4, 0, 1], c: OLIVE.clone().lerp(pal[2], 0.45) })];
      for (let i = 0; i < 6; i++) cores.push(part(ball(pr.range(0.6, 1.1), 7, 6), { p: [pr.range(-1.6, 1.6), pr.range(-1.2, 1.2), pr.range(-8, 8)], c: i % 3 ? EM : GOLD }));
      const pa = makeOrg(microG, { count: n, center: VC, radius: 380, core: merge(cores),
        body: part(lathe((t) => 0.1 + 4.2 * Math.pow(Math.sin(t * Math.PI), 0.55) * (0.8 + 0.25 * t), -12.5, 12.5, 16, 14), { s: [1, 0.8, 1], c: CLEAR }),
        mats: orgMats({ jit: 0.15, rimW: 0.3, lineK: 1.3,
          pattern: /* glsl */`float ca = atan(vL.y, vL.x + 1e-5); float cil = sin(vL.z * 4.0 - uTime * 8.0 + ca * 2.0);
            rim *= 0.72 + 0.28 * cil; line *= 0.6 + 0.9 * max(cil, 0.0);
            dk = max(dk, 0.09 * smoothstep(0.6, 0.95, sin(ca * 16.0 + vL.z * 0.5)) * (1.0 - small));` }) });
      const data = [];
      for (let i = 1; i < n; i++) {
        const R = pr.range(22, 40), nrm = randDir(pr), e1 = V3().crossVectors(nrm, Math.abs(nrm.y) > 0.9 ? ZV : UPV).normalize();
        data.push({ c: spot(pr, dCurt + 10, dF + 40, 32, 125, R + 6), R, nrm, e1, e2: V3().crossVectors(nrm, e1), ph: pr() * TAU, w: pr.range(7, 11) / R * pr.sign(), s: pr.range(0.75, 1.1) });
      }
      const e1 = V3(), e2 = V3(), tg = V3();
      anims.push((time, u) => {
        const lead = lerp(24, 46, smoothstep(uN - 0.02, uN + 0.06, u)), s = Math.max(u, uCurt + 0.01) * LEN + lead, a0 = time * 2.2;
        if (s <= dF) { path.posAtDist(s, P); path.tangentAtDist(s, tg); } else { P.copy(FP).addScaledVector(axisW, s - dF); tg.copy(axisW); }
        e1.crossVectors(tg, UPV).normalize(); e2.crossVectors(tg, e1);
        P.addScaledVector(e1, Math.cos(a0) * 2.2).addScaledVector(e2, Math.sin(a0) * 2.2);
        aim(tg).multiply(Q2.setFromAxisAngle(ZV, a0)); put(pa, 0, P, Q, 0.8);
        for (let i = 1; i < n; i++) {
          const d = data[i - 1], a = d.ph + time * d.w, ca = Math.cos(a), sa = Math.sin(a), hl = time * 2.4 + d.ph;
          P.copy(d.c).addScaledVector(d.e1, ca * d.R).addScaledVector(d.e2, sa * d.R).addScaledVector(d.nrm, Math.cos(hl) * 2.5);
          tg.copy(d.e1).multiplyScalar(-sa).addScaledVector(d.e2, ca).multiplyScalar(Math.sign(d.w));
          aim(tg).multiply(Q2.setFromAxisAngle(ZV, hl)); put(pa, i, P, Q, d.s);
        }
        pa.commit();
      });
    }
    {   // rotifers: glass vases wheeling round the colony, twin crowns of cilia running like wheels
      const rr = rng.fork('rotifers'), n = 6;
      const body = merge([part(lathe(prof([[0, 0.3], [0.1, 0.8], [0.25, 1.4], [0.36, 4.2], [0.5, 6.0], [0.66, 5.6], [0.79, 4.0], [0.87, 3.6], [0.95, 5.2], [1, 6.2]]), -15, 15, 22, 16), { c: CLEAR }),
        part(plate(() => 3.4, 32, 0.8, 3), { p: [3.3, 0, 15.3] }), part(plate(() => 3.4, 32, 0.8, 3), { p: [-3.3, 0, 15.3] })]);
      const core = merge([part(ball(1, 12, 9), { s: [3.3, 3.3, 4.6], p: [0, 0, 1.5], c: GOLD.clone().lerp(EM, 0.5) }), part(ball(1.3, 8, 6), { p: [0, 0.3, 9.8], c: OLIVE }),
        part(ball(0.38, 6, 5), { p: [0, 2.4, 12.3], c: '#c8321e' }), part(ball(1.8, 8, 6), { p: [1.6, -1.2, -3.4], c: OLIVE.clone().lerp(pal[2], 0.5) })]);
      const ro = makeOrg(microG, { count: n, center: VC, radius: 190, body, core, mats: orgMats({ jit: 0.12, rimW: 0.3, lineK: 1.2,
        pattern: /* glsl */`if (vP.w > 2.5) { vec2 cq = vec2(abs(vL.x) - 3.3, vL.y); float wa = atan(cq.y, cq.x + 1e-5);
            dk = max(dk, 0.62 * smoothstep(0.1, 0.7, sin(wa * 12.0 - uTime * 9.0 * sign(vL.x))) * smoothstep(0.5, 0.78, length(cq) / 3.4)); }` }) });
      const data = [], tg = V3();
      for (let i = 0; i < n; i++) {
        const nrm = axisW.clone().addScaledVector(randDir(rr, P2), 0.42).normalize(), e1 = V3().crossVectors(nrm, UPV).normalize();
        data.push({ R: rr.range(100, 128), nrm, e1, e2: V3().crossVectors(nrm, e1), ph: i / n * TAU + rr.range(-0.3, 0.3), w: rr.range(0.035, 0.06) * rr.sign(), s: rr.range(0.85, 1.15) });
      }
      anims.push((time) => {
        for (let i = 0; i < n; i++) {
          const d = data[i], a = d.ph + time * d.w, ca = Math.cos(a), sa = Math.sin(a);
          P.copy(VC).addScaledVector(d.e1, ca * d.R).addScaledVector(d.e2, sa * d.R);
          tg.copy(d.e1).multiplyScalar(-sa).addScaledVector(d.e2, ca).multiplyScalar(Math.sign(d.w));
          aim(tg).multiply(Q2.setFromAxisAngle(ZV, time * 0.3 + i)); put(ro, i, P, Q, d.s);
        }
        ro.commit();
      });
    }
    {   // Stentors: azure trumpets swaying on a raft of leaf litter to the right of the colony; one snaps back into a ball
      const sr = rng.fork('stentor'), n = 5, RC = VC.clone().add(V3(-150, -54, 14));
      const body = merge([part(lathe((t) => 1.0 + 12 * Math.pow(t, 2.4), 0, 70, 22, 20), { c: AZT }), part(plate(() => 13, 40, 0.86, 4), { p: [0, 0, 69.5], c: AZT })]);
      const cores = [];
      for (let i = 0; i < 9; i++) cores.push(part(ball(1.5, 7, 6), { p: [2 + i * 0.5, 0.6 * Math.sin(i), 30 + i * 4], c: AZ.clone().multiplyScalar(0.85) }));
      for (let i = 0; i < 5; i++) cores.push(part(ball(sr.range(1.1, 1.9), 7, 6), { p: [sr.range(-6, 6), sr.range(-6, 6), sr.range(52, 64)], c: EM }));
      const st = makeOrg(microG, { count: n, center: RC.clone().add(V3(0, 35, 0)), radius: 90, body, core: merge(cores), mats: orgMats({ jit: 0.05, rimW: 0.32, swell: false, lineK: 1.2,
        deform: /* glsl */`float h = p.z / 70.0; p.x += sin(uTime * 0.5 + sd * 30.0) * 8.0 * h * h; p.y += cos(uTime * 0.37 + sd * 17.0) * 6.0 * h * h;`,
        pattern: /* glsl */`float sa = atan(vL.y, vL.x + 1e-5); dk = max(dk, 0.2 * smoothstep(0.2, 0.9, sin(sa * 22.0)) * (1.0 - small));
          if (vP.w > 3.5) { float cl = sin(sa * 30.0 - uTime * 7.0); rim *= 0.6 + 0.4 * cl; line *= 0.5 + max(cl, 0.0); }` }) });
      const data = [], qz = new THREE.Quaternion().setFromUnitVectors(ZV, UPV);
      for (let i = 0; i < n; i++) data.push({ p: RC.clone().add(V3(sr.range(-24, 24), 2, sr.range(-17, 17))), q: new THREE.Quaternion().setFromAxisAngle(randDir(sr, P2).setY(0).normalize(), sr.range(0.05, 0.3)).multiply(qz), s: sr.range(0.8, 1.1) });
      for (let i = 1; i < n; i++) put(st, i, data[i].p, data[i].q, data[i].s);
      anims.push((time, u) => {
        const k = smoothstep(uN - 0.075, uN - 0.066, u) * (1 - smoothstep(uN - 0.05, uN + 0.1, u)), d = data[0];
        put(st, 0, d.p, d.q, S.set(d.s * (1 + 0.9 * k), d.s * (1 + 0.9 * k), d.s * (1 - 0.72 * k))); st.commit();
      });
      const slabs = [];
      for (let i = 0; i < 5; i++) slabs.push(part(ball(1, 16, 8), { s: [sr.range(22, 40), sr.range(2, 3.5), sr.range(16, 28)], r: [sr.range(-0.2, 0.2), sr() * 3, sr.range(-0.2, 0.2)], p: [sr.range(-14, 14), sr.range(-4, 0), sr.range(-9, 9)], c: BRT }));
      const raft = makeOrg(microG, { count: 1, center: RC, radius: 70, body: merge(slabs), mats: orgMats({ jit: 0, rimW: 0.3, swell: false, body: 1.5, lineK: 0.12,
        pattern: /* glsl */`dk = max(dk, 0.2 * smoothstep(0.75, 0.98, sin(vL.x * 0.9 + sin(vL.z * 0.6) * 2.0)));` }) });
      put(raft, 0, RC, Q.identity(), 1); raft.commit();
    }
    // high summer: a bloom, with two more colonies rolling in the distance
    const moreHeroes = [];
    if (season === 'summer') {
      for (let k = 0; k < 2; k++) {
        const h2 = await buildHero({ ...ctx, rng: rng.fork('colony' + k) }, { palette: LK.pal, beads: 520, lampDir: [lampL.x, lampL.y, lampL.z], progress: 0.2, rollPeriod: 17 + 8 * k, backdrop: false });
        const sc = k ? 0.42 : 0.56, at = VC.clone().add(k ? V3(-55, 122, 80) : V3(152, 30, -34));
        h2.object.quaternion.copy(qH); h2.object.scale.setScalar(sc);
        h2.object.position.copy(at).sub(V3(0, 72, 0).applyQuaternion(qH).multiplyScalar(sc));
        for (const key of ['uField', 'uHaze', 'uRim', 'uTint', 'uLine', 'uEmerald']) h2.uniforms[key].value.copy(HU[key].value);
        h2.setFocus(140, 520, 0.6);
        microG.add(h2.object); moreHeroes.push(h2);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the last dive (M -> 16,000,000): the diatom that becomes a plain
    const frame = path.frameAt(1, new THREE.Matrix4(), true), qEnd = new THREE.Quaternion().setFromRotationMatrix(frame);
    const deckU = { ...U, uGoldT: { value: GOLD.clone().multiplyScalar(dark ? 0.45 : 0.85) }, uPlate: { value: dark ? new THREE.Color().setRGB(0.9, 1.0, 0.95) : new THREE.Color().setRGB(0.7, 0.92, 0.79) }, uShine: { value: 1 }, uShineCol: { value: dark ? new THREE.Color(0.7, 1.0, 1.0) : new THREE.Color(1.0, 1.0, 0.92) },
      uWell: { value: dark ? new THREE.Color().setRGB(0.1, 0.24, 0.26) : new THREE.Color().setRGB(0.1, 0.3, 0.2) }, uRibT: { value: dark ? new THREE.Color().setRGB(0.5, 0.42, 0.2) : new THREE.Color().setRGB(0.5, 0.3, 0.1) },
      uFloorT: { value: dark ? new THREE.Color().setRGB(0.5, 0.64, 0.56) : new THREE.Color().setRGB(0.36, 0.7, 0.5) },
      uCamL: { value: V3(0, 0, 1e6) }, uLampL: { value: (() => { const l = lampW.clone().applyQuaternion(qEnd.clone().invert()); return new THREE.Vector2(l.x, l.y + 1e-4).normalize(); })() } };
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(1500, 330), new THREE.ShaderMaterial({
      ...GLASS_BLEND, side: THREE.DoubleSide, fog: false, uniforms: deckU,
      vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uGoldT; uniform float uShine; uniform vec3 uShineCol; uniform vec3 uPlate; uniform vec3 uCamL; uniform vec2 uLampL; uniform vec3 uWell; uniform vec3 uRibT; uniform vec3 uFloorT; varying vec2 vQ;
        ${G_GLASS}
        vec2 hexC(vec2 p, float s) { vec2 r = vec2(s, s * 1.7320508); vec2 h = r * 0.5; vec2 a = mod(p, r) - h; vec2 b = mod(p - h, r) - h; return dot(a, a) < dot(b, b) ? p - a : p - b; }
        float hexE(vec2 v) { v = abs(v); return 12.0 - max(v.x, 0.5 * v.x + 0.8660254 * v.y); }
        void main() {
          vec2 q = vQ;
          float fwq = max(length(vec2(dFdx(q.x), dFdy(q.x))), length(vec2(dFdx(q.y), dFdy(q.y)))) + 1e-4;
          float ex = clamp(1.0 - q.x * q.x / 562500.0, 0.0, 1.0);
          float halfW = 165.0 * pow(ex, 0.62);
          float ed = halfW - abs(q.y);
          if (ed < -fwq) discard;
          float cover = smoothstep(-fwq, fwq, ed);
          vec2 c = hexC(q, 24.0), v = q - c;
          float d = length(v), dq = length(q), lc = length(c);
          float lod = 1.0 - smoothstep(3.0, 9.0, fwq), lod2 = 1.0 - smoothstep(12.0, 40.0, fwq), fine = 1.0 - smoothstep(0.3, 0.8, fwq);
          float centre = 1.0 - step(1.0, lc), ring1 = step(1.0, lc) * (1.0 - step(30.0, lc));
          // each pore is a well: its floor, a sieve of sub-pores, lies 5 m down and slides behind the lip by parallax
          vec2 par = (q - uCamL.xy) * (5.0 / max(abs(uCamL.z), 5.0));
          par *= min(1.0, 8.0 / max(length(par), 1e-3));
          float df = length(v + par);
          float pore = 1.0 - smoothstep(7.5 - fwq, 7.5 + fwq, d);
          float flr = 1.0 - smoothstep(6.7 - fwq, 6.7 + fwq, df);
          float wall = pore * (1.0 - flr);
          float fline = smoothstep(6.7, 6.9 + fwq, df) * (1.0 - smoothstep(7.15, 7.5 + fwq, df)) * pore;
          vec2 qs = q + par, s2 = hexC(qs, 2.4);
          float sieve = (1.0 - smoothstep(0.66, 0.74 + 2.0 * fwq, length(qs - s2))) * fine;
          float collar = smoothstep(7.5 - fwq, 7.5 + fwq, d) * (1.0 - smoothstep(8.8, 9.6 + 2.0 * fwq, d));
          float pline = smoothstep(9.3, 9.8 + fwq, d) * (1.0 - smoothstep(10.3, 10.9 + fwq, d));
          // raised ribs along the cell walls, a bright line on their lamp side
          float rib = (1.0 - smoothstep(0.5, 0.95 + fwq, hexE(v))) * lod;
          vec2 ql = q + uLampL * 1.1;
          float ribHi = (1.0 - smoothstep(0.5, 0.95 + fwq, hexE(ql - hexC(ql, 24.0)))) * (1.0 - rib) * lod;
          vec2 s3 = hexC(q, 1.5);
          float stip = (1.0 - smoothstep(0.3, 0.4 + 2.0 * fwq, length(q - s3))) * fine * smoothstep(10.9, 11.5, d) * (1.0 - rib);
          vec3 T = uPlate;
          float gx = abs(q.x);
          float gold = max(0.92 * smoothstep(60.0, 110.0, gx), 0.66 * smoothstep(13.0, 36.0, dq)) * (1.0 - smoothstep(520.0, 640.0, gx)) * (1.0 - smoothstep(0.5, 0.8, abs(q.y) / max(halfW, 1.0)));
          T = mix(T, T * vec3(0.52, 0.3, 0.15), gold);
          vec3 amber = uGoldT * gold * (1.0 - pore * lod) * 0.62;
          T *= 1.0 - 0.14 * (0.5 + 0.5 * sin(q.x * 0.30236)) * lod2 * (1.0 - lod);
          T *= 1.0 - 0.18 * lod * smoothstep(20.0, 120.0, dq);
          // three values on the plain: pale plate, gold-brown ribs, deep green pore floors (the six round the portal darkest)
          vec3 mem = mix(uFloorT, uFloorT * vec3(0.62, 0.7, 0.72), ring1);
          vec3 flo = mix(mem * 1.08, mix(mem, vec3(0.97, 1.0, 0.95), sieve * 0.85), fine);
          vec3 wl = mix(uRim, T * 0.7, 0.3);
          // the shining pore is a well: its wall falls away dark under the lip and is lit again where the portal's light reaches it
          float wk = clamp((dq - 6.3) / 1.2, 0.0, 1.0);
          vec3 wellT = mix(mix(uWell * 2.6, uWell, smoothstep(0.0, 0.35, wk)), uWell * 0.8, smoothstep(0.75, 1.0, wk));
          wellT = mix(vec3(1.0), wellT, smoothstep(6.3 - fwq, 6.3 + fwq, dq));          // the mouth itself is open: nothing dims the portal
          vec3 pT = mix(mix(wl, flo, flr), wellT, centre);
          T = mix(T, pT, pore * lod);
          T = mix(T, uRim, collar * lod * 0.86);
          T = mix(T, uRibT, rib * 0.62);
          T = mix(T, vec3(1.0), stip * 0.55);
          amber *= clamp(1.0 - max(collar * lod, rib) * 0.9, 0.0, 1.0);          // gold light only through clear plate, so collars and ribs stay dark
          float raphe = (1.0 - smoothstep(1.5, 2.5 + fwq, abs(q.y))) * smoothstep(40.0, 60.0, gx) * (1.0 - smoothstep(10.0, 30.0, fwq)) * smoothstep(0.25, 1.5, fwq);
          T = mix(T, uRim, raphe * 0.5);
          float rimw = max(6.0, 2.0 * fwq);
          T = mix(T, uRim, (1.0 - smoothstep(0.4 * rimw, rimw, ed)) * 0.85);
          float oline = smoothstep(rimw, 1.3 * rimw, ed) * (1.0 - smoothstep(1.7 * rimw, 2.3 * rimw, ed));
          float pulse = 0.82 + 0.18 * sin(uTime * 2.1);
          // the shine is a thin ring on the lip of the well (under 8% of its radius), with a faint line where the wall meets the portal
          float sw = 0.3 + 1.5 * fwq, sg = (dq - 7.75) / sw, sg2 = (dq - 6.35) / (0.12 + fwq);
          float shine = (exp(-sg * sg) * 3.0 + 0.05 * exp(-max(dq - 7.5, 0.0) / 3.0) * step(7.5, dq) + 0.5 * exp(-sg2 * sg2) * lod) * pulse * uShine;
          float twk = 0.45 + 0.3 * sin(uTime * 1.7 + c.x * 0.13 + c.y * 0.07);
          T = mix(vec3(1.0), T, cover);
          gl_FragColor = glassOut(T, (uLine * (oline * 0.8 + (pline * twk * 0.5 + ribHi * 0.3 + fline * (1.0 - centre) * 0.5) * lod) + uShineCol * shine + amber) * cover);
        }`,
    }));
    deck.quaternion.copy(qEnd); deck.renderOrder = 3; deck.frustumCulled = false; finalG.add(deck);
    const deckFar = FP.clone().addScaledVector(axisW, 118).add(V3(0, -17, 0));        // where it glides while we are inside the colony
    // from there it glides to its seat at the portal: it sets off before the camera leaves the colony by the tear and is seated before the last bend ends
    const glide = (u) => smoothstep(uF - 0.05, uB - 0.045, u);
    const deckAt = (u, out) => out.copy(deckFar).lerp(PORT, glide(u)).addScaledVector(tEnd, -0.6);
    // depth-only shutter: the portal shows only through the mouth of the shining pore
    const shutter = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.ShaderMaterial({
      colorWrite: false, side: THREE.DoubleSide, fog: false, uniforms: { uHole: { value: 0.05 } },
      vertexShader: /* glsl */`varying vec2 vQ; void main() { vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform float uHole; varying vec2 vQ; void main() { float r = length(vQ); if (r < uHole || r > 30.0) discard; gl_FragColor = vec4(0.0); }`,
    }));
    shutter.quaternion.copy(qEnd); shutter.position.copy(PORT).addScaledVector(tEnd, -0.3); shutter.renderOrder = 4; shutter.frustumCulled = false; scene.add(shutter);
    // the one white spark on its deck
    const sparkU = { uResY: U.uResY, uK: { value: 1 }, uTime: U.uTime };
    const spark = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false, uniforms: sparkU,
      vertexShader: /* glsl */`uniform float uResY; void main() { gl_PointSize = max(uResY * 0.05, 8.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform float uK; uniform float uTime; void main() { vec2 pc = abs(gl_PointCoord - 0.5); float r = length(pc) * 2.0;
          float star = exp(-pc.x * 46.0) * exp(-pc.y * 7.0) + exp(-pc.y * 46.0) * exp(-pc.x * 7.0);
          float g = exp(-r * r * 22.0) * 3.2 + star * 1.5 + exp(-r * r * 3.0) * 0.3; gl_FragColor = vec4(vec3(1.0, 1.0, 0.94) * g * uK * (0.85 + 0.15 * sin(uTime * 3.0)) * (1.0 - smoothstep(0.8, 1.0, r)), 1.0); }`,
    }));
    spark.frustumCulled = false; spark.renderOrder = 6; finalG.add(spark);
    {   // bacteria: two hundred and fifty glass rods and seven big ones tumbling past like logs, each with a nucleoid and one whip
      const br = rng.fork('bacteria'), nBig = 7, n = Math.round(250 * detail) + nBig, fp = [];
      for (let k = 0; k <= 8; k++) fp.push(V3(0.3 * Math.sin(k * 0.8), 0.12 * Math.sin(k * 0.5), -3.3 - k * 0.55));
      const rodT = new THREE.Color().setRGB(0.86, 0.97, 0.76);
      const ba = makeOrg(finalG, { count: n, center: BEND, radius: 190, mats: orgMats({ jit: 0.7, rimW: 0.34, body: 1.6, swell: V3(0.04, 45, 170), pattern: /* glsl */`rim = min(rim * 1.3, 1.0); dk = max(dk, 0.1 * (1.0 - small));`,
          deform: /* glsl */`vec3 ax = normalize(vec3(sin(sd * 91.0), cos(sd * 57.0), sin(sd * 33.0)) + vec3(0.0, 0.0, 1e-3)); float an = uTime * (0.5 + fract(sd * 7.0)) + sd * 40.0;
            if (p.z < -3.4) { float w = (-3.4 - p.z) * 0.2; p.x += w * sin(uTime * 5.0 + p.z * 0.9 + sd * 20.0) * 0.5; }
            p = rotAx(p, ax, an); n = rotAx(n, ax, an);` }),
        body: merge([part(lathe((t) => { const a = Math.max(Math.abs(t * 7 - 3.5) - 2.5, 0); return Math.sqrt(Math.max(1 - a * a, 0.0004)); }, -3.5, 3.5, 10, 8), { c: rodT }),
          part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fp), 12, 0.06, 3), { c: CLEAR, e: 0.22 })]),
        core: merge([part(ball(1, 7, 5), { s: [0.36, 0.36, 2.0], p: [0.08, 0, 0.5], c: OLIVE.clone().lerp(pal[2], 0.18) }), part(ball(0.3, 5, 4), { p: [-0.2, 0.1, -2.3], c: EM.clone().lerp(pal[2], 0.15) }),
          part(ball(0.22, 5, 4), { p: [0.25, -0.1, 2.9], c: GOLD.clone().lerp(OLIVE, 0.3) })]) });
      // the water between the camera and the diatom is kept clear for the whole last dive. From the tear exit to the end of the path,
      // every 6 m or so, a line runs from the camera's place there to where the diatom is at that moment (still gliding at first, then
      // on its seat at the portal); no rod of the crowd tumbles within 17 m of any of those lines, and no big rod within 11 m
      const gaze = [], gb = V3(), nGaze = Math.max(1, Math.round((LEN - dF) / 6));
      for (let j = 0; j <= nGaze; j++) {
        const d = lerp(dF, LEN, j / nGaze), c = path.posAtDist(d, V3());
        gaze.push([c, deckAt(d / LEN, V3()).sub(c)]);
      }
      const offGaze = (p, rad) => {
        for (const [c, ga] of gaze) {
          gb.subVectors(p, c);
          const t = clamp(gb.dot(ga) / Math.max(ga.lengthSq(), 1e-6), 0, 1);
          if (gb.addScaledVector(ga, -t).length() < rad) return false;
        }
        return true;
      };
      const onSide = (p) => P3.subVectors(p, PORT).dot(nDeck) > 4;
      // the seven big rods tumble close beside the bend of the last dive: one to each seventh of the way from the tear exit to the
      // end of the last bend, at a seeded place in its seventh, 12 to 25 m off the path
      for (let i = 0; i < nBig; i++) {
        let ok = false;
        for (let k = 0; k < 30 && !ok; k++) {
          const dd = lerp(dF, dB, (i + br()) / nBig);
          path.posAtDist(dd, P); path.tangentAtDist(dd, P2); randDir(br, gb).cross(P2).normalize().multiplyScalar(br.range(12, 25)); P.add(gb);
          ok = onSide(P) && offGaze(P, 11) && path.distanceTo(P.x, P.y, P.z) > 11;
        }
        put(ba, i, P, aim(randDir(br, P2)), br.range(1.4, 1.6));
      }
      for (let i = nBig; i < n; i++) {
        const r = br(); put(ba, i, spot(br, dB - 20, LEN - 3, 8, 72, 7, (p) => onSide(p) && offGaze(p, 17)), aim(randDir(br, P2)), 0.35 + 1.25 * r * r);
        if ((i & 63) === 0) await ctx.yield();
      }
      ba.commit();
    }
    await ctx.yield();

    // ---------------------------------------------------------------- per-frame
    const uS0 = uF - 0.0125, uS1 = 0.93, heroW = V3(), stemPoi = V3(), camXZ = V3(), camP = V3();
    function update(dt, time, camera, u) {
      camera.getWorldPosition(camP);          // a portal camera may have only its world matrix set
      const cy = camP.y, under = cy < 0;
      U.uTime.value = time;
      aboveG.visible = !under; sky.object.visible = !under; dome.visible = under; underG.visible = under;
      ceil.visible = under && u < uTurn + 0.07; filmG.visible = cy > -40;
      macroG.visible = under && u < uCurt + 0.03; microG.visible = u > uPl + 0.04; finalG.visible = u > uN - 0.06;
      fog.density = under ? 0 : LK.fog;
      if (under) dome.position.copy(camP);
      else { sky.update(dt, time, camera); rig.update(dt, time, camera); wind.update(time); for (const t of tick) t.update(dt, time, camera, u); }
      hero.update(dt, time, camera); hero.setProgress(smoothstep(uN - 0.04, uF + 0.01, u));
      for (const h of moreHeroes) h.update(dt, time, camera);
      const k = smoothstep(uTurn - 0.06, uCurt, u);
      U.uFocus.value.set(lerp(45, 110, k), lerp(230, 460, k), dark ? 0.94 : lerp(0.8, 0.6, k));
      // the field deepens and grades as we shrink; glass and haze follow the field the camera is looking into
      if (!dark) {
        const gk = smoothstep(uPl + 0.04, uTurn, u);
        uGrade.value.x = gk;
        fieldAt(camera.getWorldDirection(fDir), gk, fTmp);
        HU.uField.value.copy(field0).lerp(fTmp, gk); HU.uHaze.value.copy(haze0).lerp(fTmp, gk);
        HU.uLine.value.copy(line0).multiplyScalar(1 + 0.35 * gk);
      }
      // the film: ceiling lifts away and fades, the meniscus ring passes over the lens, the blue blur leaves
      const cl = smoothstep(uPl, uTurn + 0.06, u);
      ceil.position.y = 320 * cl * cl * cl; ceilU.uFade.value = smoothstep(uPl + 0.03, uTurn + 0.05, u);
      // the guide's blur crosses the sky window as the camera passes under the window's centre, and is strongest at that moment
      ceilU.uFly.value.set(WINP.x + (u - uUnderWin) * 240, WINP.z - 6, bell(u, uUnderWin, 0.03));
      WINP.y = Math.min(ceil.position.y, 60);
      flash.material.uniforms.uR.value = lerp(0.35, 12, smoothstep(uPl - 0.006, uPl + 0.024, u));
      flash.material.uniforms.uI.value = 2.4 * smoothstep(uPl - 0.012, uPl - 0.002, u) * (1 - smoothstep(uPl + 0.004, uPl + 0.026, u));
      // the target diatom: glides into place, then swells about the portal centre, exponentially in time
      const sc = Math.pow(0.02, 1 - clamp((u - uS0) / (uS1 - uS0), 0, 1)), gl = glide(u);
      deckAt(u, deck.position);
      deck.position.x += (1 - gl) * 3 * Math.sin(time * 0.3);
      deck.scale.setScalar(sc);
      shutter.material.uniforms.uHole.value = 6.3 * sc;
      deck.updateMatrixWorld(); deck.worldToLocal(deckU.uCamL.value.copy(camP));
      spark.position.copy(deck.position).addScaledVector(tEnd, -0.5);
      sparkU.uK.value = 1 - smoothstep(0.1, 0.3, sc);
      deckU.uShine.value = smoothstep(0.02, 0.12, sc) * lerp(1, 0.22, smoothstep(0.3, 0.9, sc)) * lerp(0.22, 1, smoothstep(6, 40, camP.distanceTo(PORT)));
      for (const a of anims) a(time, u, dt, camera);
    }
    for (const a of anims) a(0, 0, 0, null);
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: LEN / 16,
      title: { morning: 'One Drop', golden: 'One Drop at Evening', rain: 'One Drop in the Rain', night: 'One Drop by Moonlight' }[lookId],
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 18, sway: 0.6, bank: 0.8, nearThrough: 0.3 },   // nearThrough: the water in front of the entry is in the opening
      pois: [
        { at: () => flyPos, from: 0.01, to: uPl - 0.03, weight: 0.3 },
        { at: WINP, from: uPl + 0.003, to: uPl + 0.05, weight: 0.55 },
        { at: (time, u) => stemPoi.set(SC.x, path.pointAt(u, camXZ).y - 7, SC.z), from: uPl + 0.055, to: uTurn - 0.035, weight: 0.4 },
        { at: VC, from: uCurt - 0.07, to: uN - 0.01, weight: 0.5 },
        { at: () => hero.daughterPosition(0, heroW).applyMatrix4(hero.object.matrixWorld), from: uN + 0.02, to: lerp(uN, uF, 0.5), weight: 0.4 },
        { at: () => deck.position, from: lerp(uN, uF, 0.45), to: 0.95, weight: 0.55 },
      ],
      portal: dark ? { shape: 'circle', radius: 7, color: '#a8ecff', glow: 1.1, tilt: true, revealDistance: 220 }
        : { shape: 'circle', radius: 7, color: '#8fd0ff', glow: 0.55, veil: '#2A84E0', tilt: true, revealDistance: 220 },
      post: { exposure: LK.exposure, bloom: { strength: 0.38, radius: 0.6, threshold: 1.03 },
        grade: { saturation: 1.14, contrast: 1.06, tint: '#ffffff', shadowTint: dark ? '#04101c' : '#0c2a1c', vignette: 0.18, grain: 0.012, aberration: 0 } },
      update,
      dispose() { sky.dispose(); hero.dispose(); for (const h of moreHeroes) h.dispose(); for (const d of extraDispose) d(); },
    };
  },
};
