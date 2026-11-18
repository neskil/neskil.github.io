// A Light in Every Dark Place: the hero set piece and the one fire every light of the world shares.
//
// buildHero builds the sea tower on its reef: a plain tapering tower of wet grey granite, 28 m tall, on a low black reef
// heaped with weed; a gallery and a small iron-framed lantern whose pale beam turns once in twelve seconds; one deep
// slit 14 m up the east face lit by the keepers' fire, its glitter broken on the sea below; surge that
// breaks on the weather side and climbs a third of the tower; dark sea birds lifting and dropping round it.
// Origin: the tower's axis at sea level. +X is east (the slit's face), +Z south, +Y up.
//
// FIRE_GLSL, makeFireGlows and makeBursts are shared with the world file: every window, lamp, lantern and the slit
// take their colour, their breathing and their halo from the one routine here, so the chain of lights reads as
// one fire; every burst of white water (tower, caves, skerries, bow) is one kind of thing.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';

export const FIRE = { hex: '#ffb45a', lin: [1.0, 0.456, 0.103] };

export const FIRE_GLSL = /* glsl */`
#ifndef ONE_FIRE_GLSL
#define ONE_FIRE_GLSL
const vec3 FIRE_GOLD = vec3(1., .456, .103);
const vec3 FIRE_EMBER = vec3(1., .15, .03);
// the breathing of one fire: the seed gives each its own rhythm; about 0.72 to 1.14
float fireBreath(float seed, float t){
  float a = sin(t*6.1 + seed*40.), b = sin(t*9.7 + seed*71.3), c = sin(t*1.7 + seed*13.1);
  return .92 + .07*a*b + .09*c + .04*sin(t*17.3 + seed*5.);
}
// colour of the fire at heat 0 (ember) .. 1 (gold) .. 2 (white-gold core)
vec3 fireColor(float heat){
  vec3 c = mix(FIRE_EMBER, FIRE_GOLD, clamp(heat, 0., 1.));
  return mix(c, vec3(1., .74, .42), clamp(heat - 1., 0., 1.));
}
// halo of one light on a sprite: r = 0 at the centre .. 1 at the edge
float fireHalo(float r){ r = clamp(r, 0., 1.); float e = 1. - r; return exp(-r*r*26.) + .2*e*e*e; }
#endif
`;

// How far alight a street lamp is (0..1), on the world's clock. A lamp's code c: under 0 it is on no lamplighter's round
// and burns always; else c = (its round*64 + its share of the round alight, in 63rds) + the share of the round at which
// its lighter reaches it. uRoundNow: where in its round each of the three rounds is now (0..1); uRoundT: their periods (s).
// It comes alight in under a second when he reaches it and gutters for its last four seconds before it goes out.
export const LAMP_GLSL = /* glsl */`
#ifndef LAMP_ROUNDS_GLSL
#define LAMP_ROUNDS_GLSL
uniform vec3 uRoundNow, uRoundT;
float lampAlight(float c, float t){
  if (c < 0.) return 1.;
  float k = floor(c), at = (c - k)/.99, rd = floor(k/64.), burn = (k - rd*64.)/63.;
  float now = rd < .5 ? uRoundNow.x : (rd < 1.5 ? uRoundNow.y : uRoundNow.z), per = rd < .5 ? uRoundT.x : (rd < 1.5 ? uRoundT.y : uRoundT.z);
  float age = fract(now - at + 1.), lit = age*per, left = (burn - age)*per;
  float gut = 1. - smoothstep(0., 4., left), flick = .55 + .45*sin(t*31. + at*90.)*sin(t*13. + at*40.);
  return smoothstep(0., .7, lit)*step(0., left)*mix(1., flick*smoothstep(0., 1.2, left), gut);
}
#endif
`;

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

// ---------------------------------------------------------------------------------------------------------------
// Fire glows: one instanced mesh of sprites, each a halo that turns about its own place to face the eye. Place and
// size (metres) are the world's. items: [{ p: [x,y,z], size, level, seed, lamp, heat }]
//   size   radius of the halo in metres          level  HDR strength at the core
//   lamp   a street lamp's code (see LAMP_GLSL; omit: always alight); o.rounds: { uRoundNow, uRoundT } of the world
//   heat   0 ember .. 1 gold .. 2 white-gold      fog    0..1 how much the scene's fog dims it (per mesh)
export function makeFireGlows(items, o = {}) {
  const n = items.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(Math.max(1, n) * 3), aPar = new Float32Array(Math.max(1, n) * 4), aHeat = new Float32Array(Math.max(1, n));
  for (let i = 0; i < n; i++) {
    const it = items[i];
    aPos.set(it.p, i * 3);
    aPar.set([it.size ?? 1, it.level ?? 2, it.seed ?? ((i * 0.6180339) % 1), it.lamp ?? -1e6], i * 4);
    aHeat[i] = it.heat ?? 1;
  }
  const posAttr = new THREE.InstancedBufferAttribute(aPos, 3), parAttr = new THREE.InstancedBufferAttribute(aPar, 4);
  g.setAttribute('aPos', posAttr); g.setAttribute('aPar', parAttr); g.setAttribute('aHeat', new THREE.InstancedBufferAttribute(aHeat, 1));
  g.instanceCount = n;
  const uniforms = { ...fx.fogUniforms(), uTime: { value: 0 }, uRoundNow: o.rounds?.uRoundNow ?? { value: new THREE.Vector3() }, uRoundT: o.rounds?.uRoundT ?? { value: new THREE.Vector3(1, 1, 1) }, 
    uBias: { value: o.bias ?? 0.3 }, uFog: { value: o.fog ?? 0.7 }, uGain: { value: o.gain ?? 1 } };
  const material = new THREE.ShaderMaterial({
    // (o.over: a halo shows only where it is brighter than what stands behind it, channel by channel: over the dark it
    // is the same halo; before a lit front or lit snow it adds nothing to them, so it never burns them out)
    uniforms, fog: true, transparent: true, depthWrite: false, depthTest: o.depthTest !== false, blending: o.over ? THREE.CustomBlending : THREE.AdditiveBlending,
    ...(o.over ? { blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } : {}),
    vertexShader: FIRE_GLSL + LAMP_GLSL + fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aPos; attribute vec4 aPar; attribute float aHeat;
uniform float uTime, uBias;
varying vec2 vUv; varying float vK, vHeat;
void main(){
  vec4 mvPosition = modelViewMatrix*vec4(aPos, 1.);
  float dist = max(-mvPosition.z, .01);
  // a halo is aPar.x metres across the world at every distance: it never grows as the eye draws off
  float s = aPar.x;
  float on = lampAlight(aPar.w, uTime);
  vK = aPar.y*on*fireBreath(aPar.z, uTime);
  vHeat = aHeat; vUv = position.xy;
  mvPosition.xy += position.xy*s;
  mvPosition.z += min(uBias*aPar.x, dist*.4);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform float uFog, uGain; varying vec2 vUv; varying float vK, vHeat;
void main(){
  float r = length(vUv);
  float h = fireHalo(r)*(1. - smoothstep(.82, 1., r));
  vec3 col = fireColor(vHeat + .9*exp(-r*r*40.))*h*vK*uGain;
  gl_FragColor = vec4(col*(1. - uFog*fxFog()), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = o.renderOrder ?? 5;
  return {
    mesh, uniforms, count: n,
    setPosition(i, x, y, z) { aPos[i * 3] = x; aPos[i * 3 + 1] = y; aPos[i * 3 + 2] = z; posAttr.needsUpdate = true; },
    setLevel(i, v) { aPar[i * 4 + 1] = v; parAttr.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Bursts of white water: one instanced mesh of soft puffs. Each burst throws `puffs` puffs from its origin along its
// direction on its own schedule (period and offset in seconds of the world clock, drawn by the caller from a seeded
// fork), so with several bursts some are always rising, hanging or falling: it reads at every phase of the clock.
// list: [{ p: [x,y,z], dir: [x,y,z], across: [x,y,z], speed, spread, size, period, offset, life, puffs, warm }]
//   across  the fan's width direction (unit); spread = share of the speed thrown sideways along it
//   warm    0..1 how much of the fire's colour lies on this spray (the slit's ray, a lantern)
export function makeBursts(list, o = {}) {
  const rng = o.rng, rows = [];
  for (const b of list) {
    const n = b.puffs ?? 14, d = new THREE.Vector3(...b.dir).normalize(), a = new THREE.Vector3(...(b.across ?? [d.z, 0, -d.x]));
    if (a.lengthSq() < 1e-6) a.set(1, 0, 0);
    a.normalize();
    const c = new THREE.Vector3().crossVectors(d, a).normalize();
    for (let i = 0; i < n; i++) {
      const sp = b.speed * rng.range(0.5, 1), sa = (rng() * 2 - 1) * (b.spread ?? 0.4) * b.speed, sc = (rng() * 2 - 1) * (b.spread ?? 0.4) * b.speed * 0.3;
      rows.push({
        org: [b.p[0] + a.x * sa * 0.12, b.p[1], b.p[2] + a.z * sa * 0.12],
        vel: [d.x * sp + a.x * sa + c.x * sc, d.y * sp + a.y * sa + c.y * sc, d.z * sp + a.z * sa + c.z * sc],
        par: [b.period, (b.offset ?? 0) - rng.range(0, b.stagger ?? 0.4), b.life ?? 2.4, (b.size ?? 3) * rng.range(0.6, 1.25)],
        seed: [rng(), b.warm ?? 0],
      });
    }
  }
  const n = rows.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const A = (k, size) => { const arr = new Float32Array(Math.max(1, n) * size); rows.forEach((r, i) => arr.set(r[k], i * size)); return new THREE.InstancedBufferAttribute(arr, size); };
  g.setAttribute('aOrg', A('org', 3)); g.setAttribute('aVel', A('vel', 3)); g.setAttribute('aPar', A('par', 4)); g.setAttribute('aSeed', A('seed', 2));
  g.instanceCount = n;
  const uniforms = { ...fx.fogUniforms(), uTime: { value: 0 }, uLit: { value: new THREE.Color(o.lit ?? '#dde5f2') }, uShade: { value: new THREE.Color(o.shade ?? '#6f7f9e') },
    uOpacity: { value: o.opacity ?? 0.85 }, uGravity: { value: o.gravity ?? 7.5 }, uWind: { value: new THREE.Vector3(...(o.wind ?? [0, 0, 0])) }, uWarm: { value: o.warm ?? 1 }, uStretch: { value: o.stretch ?? 0.9 } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aOrg, aVel; attribute vec4 aPar; attribute vec2 aSeed;
uniform float uTime, uGravity, uStretch; uniform vec3 uWind;
varying vec2 vUv; varying vec4 vInfo;
void main(){
  float period = max(aPar.x, .01), life = max(aPar.z, .01);
  float age = fract((uTime + aPar.y)/period)*period;
  float k = age/life;
  float alive = step(k, 1.);
  vec3 p = aOrg + aVel*age + vec3(0., -.5*uGravity*age*age, 0.) + uWind*age*age*.5;
  float s = aPar.w*(.3 + .7*sqrt(clamp(k, 0., 1.)))*alive;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  float lens = smoothstep(.6, 2.5, length(mvPosition.xyz));
  vec2 vd = (modelViewMatrix*vec4(aVel + vec3(0., -uGravity*age, 0.) + uWind*age, 0.)).xy;
  float vl = length(vd);
  vec2 along = mix(vec2(0., 1.), vd/max(vl, 1e-3), step(1e-3, vl));
  float st = 1. + uStretch*clamp(vl*.09, 0., 1.5);
  mvPosition.xy += (vec2(along.y, -along.x)*position.x + along*(position.y*st))*s;
  vUv = position.xy;
  // (a puff is a medium, so the one lens law: none of it is drawn large in the lens)
  vInfo = vec4(smoothstep(0., .1, k)*(1. - smoothstep(.45, 1., k))*alive*lens, aSeed.x, aSeed.y, age);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform vec3 uLit, uShade; uniform float uOpacity, uWarm;
varying vec2 vUv; varying vec4 vInfo;
void main(){
  float r = length(vUv);
  vec2 q = vUv*vec2(2.6, 1.7) + vInfo.y*37. + vec2(0., -vInfo.w*.7);
  float n = vnoise(q)*.5 + vnoise(q*2.9 + 5.)*.3 + vnoise(q*7.1 + 11.)*.2;
  float a = (1. - smoothstep(.1, 1., r + (n - .5)*1.25))*smoothstep(.22, .62, n + .25*(1. - r))*vInfo.x*uOpacity;
  float up = clamp(vUv.y*.5 + .5 + (n - .5)*.5, 0., 1.);
  vec3 col = mix(uShade, uLit, up*.8 + .2*n);
  col += fireColor(1.)*vInfo.z*uWarm*(.35 + .4*n);
  col = fxApplyFog(col);
  gl_FragColor = vec4(col*a, a);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = o.renderOrder ?? 3;
  return { mesh, uniforms, count: n };
}

// ---------------------------------------------------------------------------------------------------------------
// A small mesh builder shared with the world file: flat quads, boxes, lathes and tubes into one merged geometry with
// position, normal, colour (linear) and one free vec4 per vertex (aux) whose meaning each material states.
export function makeGeo() {
  // typed stores that double when full (m vertices held, room for cap), and the box of all positions
  let cap = 4096, m = 0, pos = new Float32Array(cap * 3), nor = new Float32Array(cap * 3), col = new Float32Array(cap * 3), aux = new Float32Array(cap * 4);
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  const more = (a, k) => { const b = new Float32Array(cap * k); b.set(a); return b; };
  const grow = () => { cap *= 2; pos = more(pos, 3); nor = more(nor, 3); col = more(col, 3); aux = more(aux, 4); };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3();
  const G = {
    count: () => m / 3,
    vert(p, n, c, x) {
      if (m === cap) grow();
      const i = m * 3, j = m * 4, px = p[0], py = p[1], pz = p[2];
      pos[i] = px; pos[i + 1] = py; pos[i + 2] = pz; nor[i] = n[0]; nor[i + 1] = n[1]; nor[i + 2] = n[2]; col[i] = c[0]; col[i + 1] = c[1]; col[i + 2] = c[2];
      aux[j] = x[0]; aux[j + 1] = x[1]; aux[j + 2] = x[2]; aux[j + 3] = x[3];
      if (px < lo[0]) lo[0] = px; if (py < lo[1]) lo[1] = py; if (pz < lo[2]) lo[2] = pz; if (px > hi[0]) hi[0] = px; if (py > hi[1]) hi[1] = py; if (pz > hi[2]) hi[2] = pz;
      m++;
    },
    // triangle with a flat normal (or the normals given)
    tri(a, b, c, color, x = [0, 0, 0, 0], na, nb, nc) {
      if (!na) { _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _b.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); _n.crossVectors(_a, _b).normalize(); na = nb = nc = [_n.x, _n.y, _n.z]; }
      G.vert(a, na, color, x); G.vert(b, nb, color, x); G.vert(c, nc, color, x);
    },
    // quad a,b,c,d counter-clockwise seen from its front
    quad(a, b, c, d, color, x = [0, 0, 0, 0]) { G.tri(a, b, c, color, x); G.tri(a, c, d, color, x); },
    // quad with a colour and aux per corner (for gradients)
    quad4(P, C, X) {
      _a.set(P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]); _b.set(P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]); _n.crossVectors(_a, _b).normalize();
      const n = [_n.x, _n.y, _n.z];
      for (const i of [0, 1, 2, 0, 2, 3]) G.vert(P[i], n, C[i], X ? X[i] : [0, 0, 0, 0]);
    },
    // box centred on (cx, cz) from y0 to y1, half sizes hx, hz, turned by yaw; o.top / o.sides colours, o.skip: 'top' | 'bottom'
    box(cx, y0, cz, hx, y1, hz, color, o = {}) {
      const cy = Math.cos(o.yaw ?? 0), sy = Math.sin(o.yaw ?? 0), x = o.aux ?? [0, 0, 0, 0];
      const P = (lx, y, lz) => [cx + lx * cy + lz * sy, y, cz - lx * sy + lz * cy];
      const A = P(-hx, y0, hz), B = P(hx, y0, hz), C = P(hx, y0, -hz), D = P(-hx, y0, -hz), E = P(-hx, y1, hz), F = P(hx, y1, hz), H = P(hx, y1, -hz), I = P(-hx, y1, -hz);
      G.quad(A, B, F, E, color, x); G.quad(B, C, H, F, color, x); G.quad(C, D, I, H, color, x); G.quad(D, A, E, I, color, x);
      if (o.skip !== 'top') G.quad(E, F, H, I, o.top ?? color, o.auxTop ?? x);
      if (o.bottom) G.quad(D, C, B, A, color, x);
    },
    // surface of revolution about the y axis through (cx, cz): profile [[r, y], ...] from bottom to top, smooth round, creased along
    lathe(cx, cz, profile, segs, colorAt, auxAt) {
      for (let j = 0; j < profile.length - 1; j++) {
        const [r0, y0] = profile[j], [r1, y1] = profile[j + 1], dy = y1 - y0, dr = r1 - r0, l = Math.hypot(dy, dr) || 1, ny = -dr / l, nr = dy / l;
        for (let i = 0; i < segs; i++) {
          const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          const p00 = [cx + c0 * r0, y0, cz + s0 * r0], p10 = [cx + c1 * r0, y0, cz + s1 * r0], p01 = [cx + c0 * r1, y1, cz + s0 * r1], p11 = [cx + c1 * r1, y1, cz + s1 * r1];
          const n0 = [c0 * nr, ny, s0 * nr], n1 = [c1 * nr, ny, s1 * nr];
          const ca = colorAt(j, i, 0), cb = colorAt(j, i, 1), xa = auxAt ? auxAt(j, i, 0) : [0, 0, 0, 0], xb = auxAt ? auxAt(j, i, 1) : xa;
          G.vert(p00, n0, ca, xa); G.vert(p01, n0, cb, xb); G.vert(p11, n1, cb, xb);
          G.vert(p00, n0, ca, xa); G.vert(p11, n1, cb, xb); G.vert(p10, n1, ca, xa);
        }
      }
    },
    // straight tube from a to b, radius r0 at a and r1 at b
    tube(a, b, r0, r1, sides, color, x = [0, 0, 0, 0]) {
      _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      _b.set(Math.abs(_a.y) > 0.9 ? 1 : 0, Math.abs(_a.y) > 0.9 ? 0 : 1, 0); _n.crossVectors(_a, _b).normalize(); _b.crossVectors(_n, _a).normalize();
      const u = [_n.x, _n.y, _n.z], v = [_b.x, _b.y, _b.z];
      for (let i = 0; i < sides; i++) {
        const a0 = i / sides * Math.PI * 2, a1 = (i + 1) / sides * Math.PI * 2;
        const d0 = [u[0] * Math.cos(a0) + v[0] * Math.sin(a0), u[1] * Math.cos(a0) + v[1] * Math.sin(a0), u[2] * Math.cos(a0) + v[2] * Math.sin(a0)];
        const d1 = [u[0] * Math.cos(a1) + v[0] * Math.sin(a1), u[1] * Math.cos(a1) + v[1] * Math.sin(a1), u[2] * Math.cos(a1) + v[2] * Math.sin(a1)];
        const pa0 = [a[0] + d0[0] * r0, a[1] + d0[1] * r0, a[2] + d0[2] * r0], pa1 = [a[0] + d1[0] * r0, a[1] + d1[1] * r0, a[2] + d1[2] * r0];
        const pb0 = [b[0] + d0[0] * r1, b[1] + d0[1] * r1, b[2] + d0[2] * r1], pb1 = [b[0] + d1[0] * r1, b[1] + d1[1] * r1, b[2] + d1[2] * r1];
        G.vert(pa0, d0, color, x); G.vert(pa1, d1, color, x); G.vert(pb1, d1, color, x);
        G.vert(pa0, d0, color, x); G.vert(pb1, d1, color, x); G.vert(pb0, d0, color, x);
      }
    },
    // another geometry (non-indexed position, normal, color) moved by a matrix; its aux is constant
    add(geo, matrix, x = [0, 0, 0, 0], tint = 1) {
      const p = geo.getAttribute('position'), n = geo.getAttribute('normal'), c = geo.getAttribute('color'), idx = geo.index;
      const nm = new THREE.Matrix3().getNormalMatrix(matrix), cnt = idx ? idx.count : p.count, _c = [0, 0, 0], _p = [0, 0, 0], _q = [0, 0, 0];
      for (let k = 0; k < cnt; k++) {
        const i = idx ? idx.getX(k) : k;
        _a.fromBufferAttribute(p, i).applyMatrix4(matrix); _b.fromBufferAttribute(n, i).applyMatrix3(nm).normalize();
        _p[0] = _a.x; _p[1] = _a.y; _p[2] = _a.z; _q[0] = _b.x; _q[1] = _b.y; _q[2] = _b.z;
        if (c) { _c[0] = c.getX(i) * tint; _c[1] = c.getY(i) * tint; _c[2] = c.getZ(i) * tint; } else _c[0] = _c[1] = _c[2] = tint;
        G.vert(_p, _q, _c, x);
      }
    },
    toGeometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, m * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor.slice(0, m * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(col.slice(0, m * 3), 3)); g.setAttribute('aux', new THREE.BufferAttribute(aux.slice(0, m * 4), 4));
      // the sphere round the box of all its points (kept as they were added)
      if (m) g.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2);
      else g.computeBoundingSphere();
      return g;
    },
  };
  return G;
}

// ---------------------------------------------------------------------------------------------------------------
// The keepers' slit (metres): w, h at the wall's outer face; deep through the stone; back, backH where the cheeks, sill
// and head have splayed to; y: its middle over the sea (14 m up the east face from the tower's foot).
const SLIT = { w: 0.45, h: 1.4, deep: 1.7, back: 1.1, backH: 1.7, y: 15.5 };
// The keepers' two shadows on the slit's back: `wide`, each shadow's half width in half widths of the back; `deep`, how
// dark each is at its middle; `share`, the most of the slit's glow the two may put out together.
const KEEPERS = { wide: [0.42, 0.5], deep: [0.82, 0.7], share: 0.4 };
// the share of the glow put out when both stand mid-slit, their depths scaled by k; and the depths that keep it to
// KEEPERS.share at the worst clock (so the slit reads at every clock)
function keeperShades() {
  const out = (k) => { let m = 0; for (let i = 0; i < 64; i++) { const x = (i + 0.5) / 32 - 1; m += (1 - k * KEEPERS.deep[0] * Math.exp(-((x / KEEPERS.wide[0]) ** 2))) * (1 - k * KEEPERS.deep[1] * Math.exp(-((x / KEEPERS.wide[1]) ** 2))); } return 1 - m / 64; };
  let lo = 0, hi = 1;
  if (out(1) > KEEPERS.share) for (let i = 0; i < 24; i++) { const k = (lo + hi) / 2; if (out(k) > KEEPERS.share) hi = k; else lo = k; } else lo = 1;
  return [KEEPERS.deep[0] * lo, KEEPERS.deep[1] * lo];
}
// Granite, iron and glass of the tower: a lit standard material whose colour, wetness and light come from the
// vertex aux: x 1 = coursed granite; y 1 = the fire (w = heat), 2 = the lantern's pale light (w = level).
function towerMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aux; varying vec4 vAux; varying vec3 vObj, vRay;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAux = aux; vObj = position; vRay = position - (inverse(modelMatrix)*vec4(cameraPosition, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
varying vec4 vAux; varying vec3 vObj, vRay; uniform float uTime, uSlit, uBeamAng, uFireSeed; uniform vec4 uKeep; uniform vec3 uBeamCol; float towerWet = 0.;
// THE KEEPERS' SLIT, painted in depth on the one face that closes its mouth (SLIT: the opening's half width and half
// height at the wall's outer face, how deep it runs through the stone, its half width and half height at the back).
// A ray from the eye through a point of the mouth meets a cheek, the sill, the head, or the back; the back is the
// fire's glow, crossed now and then by the shadow of one keeper or the other on clocks of their own (uKeep: x, y where
// in his to and fro each stands at the clock's zero, dealt; z, w how deep each shadow is, set so that both standing
// mid-slit together put out no more than KEEPERS.share of the glow: see keeperShades); the keepers themselves are
// never seen; cheeks, sill and head are stone lit by that fire, brighter the deeper they lie.
vec3 slitLight(vec2 o, vec3 rd) {
  const float W0 = ${(SLIT.w / 2).toFixed(3)}, H0 = ${(SLIT.h / 2).toFixed(3)}, D = ${SLIT.deep.toFixed(2)}, KW = ${((SLIT.back / 2 - SLIT.w / 2) / SLIT.deep).toFixed(4)}, KH = ${((SLIT.backH / 2 - SLIT.h / 2) / SLIT.deep).toFixed(4)};
  vec2 sl = rd.zy/max(-rd.x, 1e-3);
  float sz = sl.x > KW ? (W0 - o.x)/max(sl.x - KW, 1e-4) : (sl.x < -KW ? (-W0 - o.x)/min(sl.x + KW, -1e-4) : 1e3);
  float sy = sl.y > KH ? (H0 - o.y)/max(sl.y - KH, 1e-4) : (sl.y < -KH ? (-H0 - o.y)/min(sl.y + KH, -1e-4) : 1e3);
  float sd = min(sz, sy), breath = fireBreath(uFireSeed, uTime);
  if (sd >= D) {
    vec2 b = (o + sl*D)/vec2(W0 + KW*D, H0 + KH*D);
    float k1 = (b.x - 1.9*sin(uTime*.19 + uKeep.x))/${KEEPERS.wide[0].toFixed(2)}, k2 = (b.x - 2.3*sin(uTime*.13 + uKeep.y))/${KEEPERS.wide[1].toFixed(2)};
    float shade = (1. - uKeep.z*exp(-k1*k1))*(1. - uKeep.w*exp(-k2*k2));
    return fireColor(1.25 + .5*(1. - dot(b, b)*.5))*uSlit*breath*shade*(1. - .35*smoothstep(-.2, 1., -b.y));
  }
  float k = clamp(sd/D, 0., 1.), course = hash11(floor((o.y + sl.y*sd)/.31) + floor(sd/.55)*7.);
  return fireColor(.75)*uSlit*breath*.3*k*k*(.7 + .5*course)*(1. - .5*smoothstep(.0, .03, abs(fract((o.y + sl.y*sd)/.31) - .5) - .46));
}`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
if (vAux.x > .5) {
  vec2 rd = vObj.xz; rd.x += step(dot(rd, rd), 1e-6)*1e-2; rd = normalize(rd);
  float ang = atan(rd.y, rd.x);
  float row = vObj.y/.62, ri = floor(row), rf = fract(row);
  float cu = fract(ang/6.2831853 + .5*mod(ri, 2.)/22. + hash11(ri*.37 + 3.)*.02)*22., ci = floor(cu), cf = fract(cu);
  float joint = max(1. - smoothstep(0., .07, min(rf, 1. - rf)), 1. - smoothstep(0., .045, min(cf, 1. - cf)));
  float tone = hash12(vec2(ri, ci) + 7.);
  diffuseColor.rgb *= (.8 + .34*tone)*(1. - .5*joint);
  float streak = vnoise(vec3(rd.x*3.5, vObj.y*.3, rd.y*3.5)) + .5*vnoise(vec3(rd.x*11., vObj.y*.9, rd.y*11.));
  towerWet = clamp(1.05 - (vObj.y - 4.)/15. + (streak - .75)*.7, 0., 1.);
  diffuseColor.rgb *= mix(1., .5, towerWet);
  float slime = clamp(1. - (vObj.y - 1.4)/3.4 + (streak - .9)*.9, 0., 1.);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.028, .04, .03), slime*.75);
}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .3, towerWet);')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
if (vAux.y > 2.5) totalEmissiveRadiance += slitLight(vec2(vObj.z, vObj.y - ${SLIT.y.toFixed(2)}), normalize(vRay));
else if (vAux.y > .5 && vAux.y < 1.5) totalEmissiveRadiance += fireColor(vAux.w)*uSlit*fireBreath(uFireSeed, uTime);
else if (vAux.y > 1.5) {
  vec2 d = normalize(vObj.xz + vec2(1e-4, 0.));
  float f = abs(d.x*cos(uBeamAng) + d.y*sin(uBeamAng)), f2 = f*f;
  totalEmissiveRadiance += uBeamCol*vAux.w*(.35 + 2.6*f2*f2*f2*f2);
}`);
  };
  mat.customProgramCacheKey = () => 'lidp-tower-3';
  return mat;
}

// The tower itself into a builder. Returns the places the rest needs.
function towerInto(G, rng, rSlots) {
  const granite = lin('#8a9098'), granDark = lin('#5d636c'), iron = lin('#15181d'), pale = lin('#cdd7e6'), dark = lin('#06070a');
  const MAS = [1, 0, 0, 0], PLAIN = [0, 0, 0, 0];
  const FOOT = 1.1, SHAFT0 = 7.0, SHAFT1 = 25.2, R0 = 4.25, R1 = 2.75;
  const rAt = (y) => (y < SHAFT0 ? R0 + 0.62 * Math.pow(1 - (y - FOOT) / (SHAFT0 - FOOT), 2.2) : R0 + (R1 - R0) * (y - SHAFT0) / (SHAFT1 - SHAFT0));
  const prof = [];
  for (let i = 0; i <= 5; i++) { const y = FOOT + (SHAFT0 - FOOT) * i / 5; prof.push([rAt(y), y]); }
  for (let i = 1; i <= 22; i++) { const y = SHAFT0 + (SHAFT1 - SHAFT0) * i / 22; prof.push([rAt(y), y]); }
  const shade = prof.map(() => rng.range(0.94, 1.06));
  G.lathe(0, 0, prof, 40, (j, i, e) => granite.map((c) => c * shade[j + e]), () => MAS);
  // corbelled gallery, its slab and floor, the low wall under the lantern
  G.lathe(0, 0, [[R1, SHAFT1], [3.0, 25.62], [3.6, 26.0], [3.6, 26.25], [1.95, 26.25], [1.95, 27.3], [1.8, 27.36]], 40, () => granDark, () => MAS);
  // the lantern: glazing (the pale light), cornice, roof, ball and finial
  G.lathe(0, 0, [[1.8, 27.36], [1.8, 29.7]], 16, () => pale, () => [0, 2, 0, 1]);
  G.lathe(0, 0, [[1.8, 29.7], [2.18, 29.82], [2.18, 29.98], [0.3, 31.3], [0.44, 31.52], [0.3, 31.76], [0.04, 32.0]], 16, () => iron, () => PLAIN);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    G.box(Math.cos(a) * 1.82, 27.36, Math.sin(a) * 1.82, 0.045, 29.7, 0.045, iron, { yaw: -a, skip: 'top' });
  }
  G.lathe(0, 0, [[1.83, 28.5], [1.83, 28.58]], 16, () => iron, () => PLAIN);
  // gallery rail: posts and two rings
  for (let i = 0; i < 24; i++) {
    const a = (i + 0.5) / 24 * Math.PI * 2;
    G.box(Math.cos(a) * 3.48, 26.25, Math.sin(a) * 3.48, 0.04, 27.32, 0.04, iron, { yaw: -a, skip: 'top' });
  }
  for (const y of [26.8, 27.3]) { G.lathe(0, 0, [[3.5, y], [3.5, y + 0.07]], 24, () => iron, () => PLAIN); G.lathe(0, 0, [[3.46, y + 0.07], [3.46, y]], 24, () => iron, () => PLAIN); }
  // the keepers' slit in the east face: a dressed surround standing a hand proud of the wall, and ONE face across
  // its mouth, painted in depth by the material (see slitLight)
  const LY = SLIT.y, lr = rAt(LY), fx0 = lr + 0.16, hw = SLIT.w / 2, hh = SLIT.h / 2;
  G.box(lr - 0.2, LY - hh - 0.34, 0, 0.36, LY + hh + 0.34, hw + 0.3, granite.map((c) => c * 1.12), { aux: MAS });
  G.quad([fx0 + 0.006, LY - hh, hw], [fx0 + 0.006, LY - hh, -hw], [fx0 + 0.006, LY + hh, -hw], [fx0 + 0.006, LY + hh, hw], [0.004, 0.004, 0.004], [0, 3, 0, 1]);
  // the door on the lee side and two blind slots
  const dr = rAt(5.4);
  G.box(0, 4.1, -dr + 0.12, 0.8, 6.6, 0.3, granite.map((c) => c * 1.1), { aux: MAS });
  G.box(0, 4.2, -dr - 0.2, 0.5, 6.2, 0.03, dark, {});
  // THE STAIR'S TWO BLIND SLOTS, all from the slots' own stream. A slot may stand at ANY bearing outside the keepers'
  // face: SLOTS.margin radians are kept clear on each side of the slit (which looks east: bearing 0), and the two
  // stand SLOTS.step radians or more apart. Each one's height is a dealt share of the stair's rise (SLOTS.rise: from
  // above the door's head to under the gallery). Every value is drawn before any is used.
  const SLOTS = { margin: 0.7, step: 1.2, rise: [SHAFT0 + 1, SHAFT1 - 2.5] }, ARC = Math.PI * 2 - 2 * SLOTS.margin;
  const sa = SLOTS.margin + rSlots() * ARC, st = rSlots(), sh = [rSlots(), rSlots()];
  // (the second: anywhere in what is left of that arc once SLOTS.step either side of the first is taken out)
  const lo = Math.max(sa - SLOTS.step - SLOTS.margin, 0), hi = Math.max(SLOTS.margin + ARC - sa - SLOTS.step, 0), sp = st * (lo + hi), sb = sp < lo ? SLOTS.margin + sp : sa + SLOTS.step + (sp - lo);
  for (const [a, y] of [[sa, SLOTS.rise[0] + (SLOTS.rise[1] - SLOTS.rise[0]) * sh[0]], [sb, SLOTS.rise[0] + (SLOTS.rise[1] - SLOTS.rise[0]) * sh[1]]]) {
    const r = rAt(y);
    G.box(Math.cos(a) * (r - 0.1), y - 0.6, Math.sin(a) * (r - 0.1), 0.2, y + 0.6, 0.3, granite.map((c) => c * 1.1), { yaw: -a, aux: MAS });
    G.box(Math.cos(a) * (r + 0.105), y - 0.42, Math.sin(a) * (r + 0.105), 0.01, y + 0.42, 0.14, dark, { yaw: -a });
  }
  return { slit: [fx0 + 0.3, LY, 0], lantern: [0, 28.5, 0], rAt, top: 32, foot: FOOT };
}

// The reef: a LOW reef, awash: a low black back of rock 30 m long (x) and 15 m wide (z), drowned at its edges, under
// a metre over the still sea everywhere but the one ledge the tower stands on (REEF.ledge), which the seas wash round.
// It lies in beds (REEF.bed m thick): flat ledges with short risers, never one smooth hump.
const REEF = { ledge: 1.75, back: 0.6, bed: 0.3 };
function makeReefHeight(noise) {
  return (x, z) => {
    const e = Math.hypot(x / 15.5, z / 7.8) + 0.16 * noise.n2(x * 0.13 + 4.1, z * 0.13 - 2.7), r = Math.hypot(x, z);
    let h = REEF.back * (1 - smooth(0.2, 1.02, e)) + 0.3 * (1 - smooth(0.0, 0.5, e));
    h += (0.36 * Math.abs(noise.n2(x * 0.33, z * 0.33)) + 0.14 * noise.n2(x * 0.9 + 9, z * 0.9)) * (0.35 + 0.65 * smooth(0.25, 0.7, e));
    h -= 2.6 * smooth(0.82, 1.2, e);
    h += (REEF.ledge - h) * (1 - smooth(4.6, 7.4, r + 0.9 * noise.n2(x * 0.5 - 3, z * 0.5 + 6)));
    // beds: each level a flat ledge, its riser short and steep
    const t = h / REEF.bed, f = t - Math.floor(t);
    return REEF.bed * (Math.floor(t) + smooth(0.62, 0.96, f));
  };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function reefInto(G, hAt, noise) {
  const rock = lin('#30353e'), rockB = lin('#1c2027'), weedC = lin('#3a2c16'), X0 = -18.9, Z0 = -10.5, ST = 0.63, NX = 60, NZ = 34;
  const P = (i, j) => { const x = X0 + i * ST, z = Z0 + j * ST; return [x, hAt(x, z), z]; };
  const N = (p) => { const d = 0.35, hx = hAt(p[0] + d, p[2]) - hAt(p[0] - d, p[2]), hz = hAt(p[0], p[2] + d) - hAt(p[0], p[2] - d), l = Math.hypot(hx, 2 * d, hz); return [-hx / l, 2 * d / l, -hz / l]; };
  const C = (p) => {
    const n = 0.5 + 0.5 * noise.n2(p[0] * 0.45 + 31, p[2] * 0.45 + 17), w = smooth(1.5, 0.3, p[1]) * smooth(0.25, 0.7, 0.5 + 0.5 * noise.n2(p[0] * 0.22 - 8, p[2] * 0.22 + 5));
    const c = [0, 1, 2].map((k) => rockB[k] + (rock[k] - rockB[k]) * n);
    return [0, 1, 2].map((k) => c[k] + (weedC[k] - c[k]) * w * 0.8);
  };
  const WET = (p) => [0, 0, smooth(2.4, 0.9, p[1]) * 0.9 + 0.1, 0];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if (Math.max(a[1], b[1], c[1], d[1]) < -1.4) continue;
    const na = N(a), nb = N(b), nc = N(c), nd = N(d), ca = C(a), cb = C(b), cc = C(c), cd = C(d);
    G.vert(a, na, ca, WET(a)); G.vert(c, nc, cc, WET(c)); G.vert(b, nb, cb, WET(b));
    G.vert(a, na, ca, WET(a)); G.vert(d, nd, cd, WET(d)); G.vert(c, nc, cc, WET(c));
  }
}

// Weed heaped on the reef: fronds that lift and settle with each surge (the sea's own slow beat, by the world clock).
function makeWeed(rng, hAt, time) {
  const g = new THREE.BufferGeometry(), pos = [], nor = [], S = 6;
  for (let i = 0; i < S; i++) {
    const x0 = i / S, x1 = (i + 1) / S, w0 = 0.085 * (1 - 0.6 * x0), w1 = 0.085 * (1 - 0.6 * x1);
    pos.push(x0, 0, -w0, x1, 0, w1, x1, 0, -w1, x0, 0, -w0, x0, 0, w0, x1, 0, w1);
    for (let k = 0; k < 6; k++) nor.push(0, 1, 0);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = time;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
#ifdef USE_INSTANCING
float wph = instanceMatrix[3].x*.37 + instanceMatrix[3].z*.53;
float wk = position.x*position.x, surge = .5 + .5*sin(uTime*.55 + wph);
transformed.y += wk*(.08 + .5*surge*surge) + .04*sin(position.x*9. + uTime*1.9 + wph*3.)*position.x;
transformed.z += wk*.22*sin(uTime*1.1 + wph*5.);
#endif`);
  };
  mat.customProgramCacheKey = () => 'lidp-weed-1';
  const spots = [];
  for (let tries = 0; spots.length < 420 && tries < 6000; tries++) {
    // (every value of a clump is drawn before its test, so that a clump refused costs the next one nothing)
    const heap = rng.chance(0.55), a = rng.range(0, Math.PI * 2), r = rng.range(4.9, 8.5), fx = rng.range(-16, 16), fz = rng.range(-8, 8);
    const yaw = rng.range(0, Math.PI * 2), len = rng.range(1.3, 3.0), tone = rng();
    const fr = [0, 1, 2].map(() => [rng.range(-0.3, 0.3), rng.range(-0.3, 0.3), rng.range(-0.7, 0.7), rng.range(0.6, 1.1), rng.range(-0.25, 0.1)]);
    const x = heap ? Math.cos(a) * r : fx, z = heap ? Math.sin(a) * r * 0.8 : fz, y = hAt(x, z);
    if (y < 0.1 || y > (heap ? 2.0 : 1.2)) continue;
    for (const f of fr) spots.push([x + f[0], y, z + f[1], yaw + f[2], len * f[3], tone, f[4]]);
  }
  const mesh = new THREE.InstancedMesh(g, mat, spots.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  const cA = new THREE.Color('#3d2e15'), cB = new THREE.Color('#1f1d0d');
  spots.forEach((s, i) => {
    e.set(0, s[3], s[6], 'YXZ'); q.setFromEuler(e);
    m.compose(new THREE.Vector3(s[0], s[1] + 0.06, s[2]), q, new THREE.Vector3(s[4], s[4], s[4] * 1.6));
    mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.copy(cA).lerp(cB, s[5]));
  });
  mesh.frustumCulled = false;
  return mesh;
}

// Shafts of lit air: crossed sheets about an axis, soft across, fading along; uv.x = 0..1 along, uv.y = -1..1 across,
// aK 1 marks a light lying on the sea, a broken glitter (it rides at uPoolY).
function shaftMaterial(time, color, level, o = {}) {
  const uniforms = { ...fx.fogUniforms(), uTime: time, uColor: { value: new THREE.Color(color) }, uLevel: { value: level }, uFall: { value: o.fall ?? 3 },
    uStreak: { value: o.streak ?? 0.5 }, uPoolY: { value: 0 }, uFire: { value: o.fire ?? 0 }, uEnd0: { value: o.end0 ?? 0.45 }, uFireSeed: { value: o.fireSeed ?? 0 }, uSoft: { value: o.soft ?? 0 } };
  return new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute float aK; uniform float uPoolY, uSoft; varying vec2 vUv; varying float vK, vFace; varying vec3 vMv;
void main(){
  vec3 p = position; p.y += aK*uPoolY;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  vUv = uv; vK = aK;
  // a shaft is a round of air, not a sheet: each of its crossed sheets shows only as far as it faces the eye, so
  // that none is ever seen as a line from its edge (a broad soft cone, uSoft, lets go of a sheet sooner still:
  // what is seen of it is always the sheets that lie broad to the eye)
  vec3 nv = normalize(normalMatrix*normal), ev = normalize(mvPosition.xyz);
  float face = abs(dot(nv, ev));
  vFace = mix(smoothstep(mix(.12, .4, uSoft), mix(.7, .92, uSoft), face), 1., aK); vMv = mvPosition.xyz;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform vec3 uColor; uniform float uTime, uLevel, uFall, uStreak, uFire, uEnd0, uFireSeed; varying vec2 vUv; varying float vK, vFace; varying vec3 vMv;
void main(){
  float ac = clamp(abs(vUv.y), 0., 1.), e = 1. - ac*ac;
  float along = clamp(vUv.x, 0., 1.);
  float a = e*e*e*exp(-along*uFall)*smoothstep(0., .012, along)*(1. - smoothstep(uEnd0, 1., along));
  a *= 1. - uStreak + uStreak*(.4 + 1.2*vnoise(vec2(along*90. - uTime*1.4, vUv.y*2.5 + uTime*.6)));
  float r2 = dot(vUv, vUv);
  // a light lying on the sea is a broken glitter, chopped by the waves: bright flecks that come and go
  float fleck = smoothstep(.56, .78, vnoise(vUv*vec2(6., 13.) + vec2(uTime*.8, -uTime*1.9)))*smoothstep(.3, .6, vnoise(vUv*vec2(2.2, 4.) - vec2(uTime*.4, uTime*.7)));
  float pool = exp(-clamp(r2, 0., 4.)*2.6)*(.1 + 2.4*fleck)*(1. - smoothstep(.7, 1., max(abs(vUv.x), abs(vUv.y))));
  a = mix(a, pool, step(.5, vK));
  // a shaft's strength is the world's own (it falls along its length and across its width, above); lit air is a
  // medium, so the one lens law: none of it is drawn large in the lens
  float lens = mix(smoothstep(.6, 2.5, length(vMv)), 1., step(.5, vK));
  vec3 col = uColor*uLevel*a*vFace*lens*mix(1., fireBreath(uFireSeed, uTime), uFire);
  gl_FragColor = vec4(col*(1. - .8*fxFog()), 1.);
}`,
  });
}
// crossed sheets from a to b (half-widths w0, w1), `planes` of them about the axis
function shaftGeometry(list) {
  const pos = [], uv = [], k = [], nr = [], g = new THREE.BufferGeometry(), N = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(), W = new THREE.Vector3();
  for (const s of list) {
    if (s.pool) {
      const [x, y, z] = s.pool, hx = s.size[0], hz = s.size[1];
      pos.push(x - hx, y, z - hz, x + hx, y, z - hz, x + hx, y, z + hz, x - hx, y, z - hz, x + hx, y, z + hz, x - hx, y, z + hz);
      uv.push(-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1); k.push(1, 1, 1, 1, 1, 1);
      for (let j = 0; j < 6; j++) nr.push(0, 1, 0);
      continue;
    }
    A.set(...s.a); B.set(...s.b); D.subVectors(B, A).normalize();
    U.set(0, 1, 0); if (Math.abs(D.y) > 0.95) U.set(1, 0, 0);
    V.crossVectors(D, U).normalize(); U.crossVectors(V, D).normalize();
    for (let i = 0; i < s.planes; i++) {
      const an = i / s.planes * Math.PI; W.copy(U).multiplyScalar(Math.cos(an)).addScaledVector(V, Math.sin(an));
      const q = (P, w, sg) => [P.x + W.x * w * sg, P.y + W.y * w * sg, P.z + W.z * w * sg];
      const a0 = q(A, s.w0, -1), a1 = q(A, s.w0, 1), b0 = q(B, s.w1, -1), b1 = q(B, s.w1, 1);
      pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1); uv.push(0, -1, 1, -1, 1, 1, 0, -1, 1, 1, 0, 1); k.push(0, 0, 0, 0, 0, 0);
      N.crossVectors(D, W).normalize();
      for (let j = 0; j < 6; j++) nr.push(N.x, N.y, N.z);
    }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
  return g;
}

// Sea birds: each wheels on a ring of its own (centre o.centre(i) => [x, z, r, y, bob] where given, else about the
// part's axis between o.rMin and o.rMax), lifting and dropping as the swell does under it. One instanced mesh; every
// bird's ring, height, beat and start phase come from the stream handed in. A bird's ring breathes by BIRD_SWAY of its
// radius and its height by BIRD_LIFT times its bob, so its whole reach is known without the clock (see birdReach).
export const BIRD_SWAY = 0.22, BIRD_LIFT = 1.6, BIRD_SPAN = 1.75;
export const birdReach = (r, y, bob, size = 1) => ({ r0: r * (1 - BIRD_SWAY) - BIRD_SPAN * size, r1: r * (1 + BIRD_SWAY) + BIRD_SPAN * size, y0: y - BIRD_LIFT * bob - 0.6 * size, y1: y + BIRD_LIFT * bob + 0.6 * size });
export function makeSeaBirds(rng, count, time, o = {}) {
  const base = new THREE.BufferGeometry();
  // x = span, z = length (head at -z), aW = 0 at the body .. 1 at the wing tip
  const P = [0, 0, -0.34, 0.07, 0, 0, 0, 0.05, 0.05, 0, 0, -0.34, 0, 0.05, 0.05, -0.07, 0, 0, 0.07, 0, 0, 0, 0, 0.3, 0, 0.05, 0.05, -0.07, 0, 0, 0, 0.05, 0.05, 0, 0, 0.3,
    0.05, 0.02, -0.12, 0.5, 0.02, -0.06, 0.05, 0.02, 0.12, 0.5, 0.02, -0.06, 1.0, 0.02, 0.1, 0.05, 0.02, 0.12,
    -0.05, 0.02, -0.12, -0.05, 0.02, 0.12, -0.5, 0.02, -0.06, -0.5, 0.02, -0.06, -0.05, 0.02, 0.12, -1.0, 0.02, 0.1];
  const Wt = new Array(12).fill(0).concat([0, 0.5, 0, 0.5, 1, 0, 0, 0, 0.5, 0.5, 0, 1]);
  base.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); base.setAttribute('aW', new THREE.Float32BufferAttribute(Wt, 1));
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes = base.attributes;
  const orb = new Float32Array(count * 4), bob = new Float32Array(count * 4), cen = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const c = o.centre ? o.centre(i) : null, dir = rng.chance(0.7) ? 1 : -1;
    const r = c ? c[2] : rng.range(o.rMin ?? 8, o.rMax ?? 36), y = c ? c[3] : rng.range(o.yMin ?? 3.5, o.yMax ?? 27), b = c ? c[4] : rng.range(o.bob?.[0] ?? 2.2, o.bob?.[1] ?? 6.5);
    if (c) cen.set([c[0], c[1]], i * 2);
    orb.set([r, y, dir * rng.range(o.speed?.[0] ?? 7, o.speed?.[1] ?? 11) / r, rng.range(0, Math.PI * 2)], i * 4);
    bob.set([b, rng.range(0.45, 0.8), rng.range(0, Math.PI * 2), rng.range(0.65, 0.95) * (o.size ?? 1)], i * 4);
  }
  g.setAttribute('aOrb', new THREE.InstancedBufferAttribute(orb, 4)); g.setAttribute('aBob', new THREE.InstancedBufferAttribute(bob, 4)); g.setAttribute('aCen', new THREE.InstancedBufferAttribute(cen, 2));
  g.instanceCount = count;
  const uniforms = { ...fx.fogUniforms(), uTime: time, uDark: { value: new THREE.Color(o.dark ?? '#0c0e13') }, uPale: { value: new THREE.Color(o.pale ?? '#566078') }, uFloor: { value: o.floor ?? 2.5 }, uCeil: { value: o.ceil ?? 1e3 }, uGain: { value: o.gain ?? 0.55 } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute float aW; attribute vec4 aOrb, aBob; attribute vec2 aCen; uniform float uTime, uFloor, uCeil; varying float vShade;
void main(){
  float th = aOrb.w + uTime*aOrb.z, rr = aOrb.x*(1. + ${BIRD_SWAY.toFixed(2)}*sin(th*2. + aBob.z));
  float wv = uTime*aBob.y + aBob.z, y = clamp(aOrb.y + aBob.x*sin(wv) + ${(BIRD_LIFT - 1).toFixed(2)}*aBob.x*sin(wv*.53 + 1.7), uFloor, uCeil);
  vec3 c = vec3(aCen.x + cos(th)*rr, y, aCen.y + sin(th)*rr);
  float sp = aOrb.z*rr, vy = aBob.x*aBob.y*cos(wv);
  vec3 fwd = normalize(vec3(-sin(th)*sp, vy*.6, cos(th)*sp));
  vec3 right = normalize(cross(fwd, vec3(0., 1., 0.))), up = cross(right, fwd);
  float beat = sin(uTime*(7.5 + 3.*fract(aBob.z*3.7)) + aOrb.w*9.), glide = smoothstep(-.2, .5, sin(uTime*.9 + aBob.z*5.));
  float lift = aW*(.1 + .55*beat*glide + .12*aW);
  vec3 lp = position; lp.y += lift*abs(lp.x); lp.x *= 1. - .18*abs(lift);
  vec3 wp = c + (right*lp.x*1.15 - fwd*lp.z + up*lp.y)*aBob.w*1.5;
  vShade = clamp(.35 + .65*up.y*sign(lp.y - .01) + aW*.3, 0., 1.);
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform vec3 uDark, uPale; uniform float uGain; varying float vShade;
void main(){ gl_FragColor = vec4(fxApplyFog(mix(uDark, uPale, vShade*uGain)), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------------------------------------------------------
// opts: time ({ value }, shared world clock uniform), windFrom ([x, z] unit, where the weather comes from),
//       seaAt ((x, z, time) => sea height at a LOCAL place; the glitter of the slit's fire rides it), birds (count),
//       lit / shade (colours of white water), beamLength (m)
export async function buildHero(ctx, opts = {}) {
  const NEW = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
  // every stream of the tower, by name, before anything is drawn from any of them
  const rTower = NEW('sea-tower-stone'), rWeed = NEW('sea-tower-weed'), rSurge = NEW('sea-tower-surge'), rPuff = NEW('sea-tower-puffs'), rBirds = NEW('sea-tower-birds'), rBeam = NEW('sea-tower-beam'), rKeep = NEW('sea-tower-keepers'), rSlots = NEW('sea-tower-slots');
  const time = opts.time ?? { value: 0 }, noise = ctx.noise, group = new THREE.Group();
  const wf = new THREE.Vector2(...(opts.windFrom ?? [-0.6, 0.8])).normalize();
  // the keepers (their own stream): where in his to and fro each stands at the clock's zero, and where in its
  // breathing their fire stands (every light of that fire takes this one seed: slit, ray, glow, its gold on the sea)
  const KEEP = { ph: [rKeep.range(0, Math.PI * 2), rKeep.range(0, Math.PI * 2)], seed: rKeep(), deep: keeperShades() };
  const U = { uTime: time, uSlit: { value: 5.5 }, uBeamAng: { value: 0 }, uBeamCol: { value: new THREE.Color('#cdd7e6') }, uFireSeed: { value: KEEP.seed },
    uKeep: { value: new THREE.Vector4(KEEP.ph[0], KEEP.ph[1], KEEP.deep[0], KEEP.deep[1]) } };

  const G = makeGeo(), hAt = makeReefHeight(noise);
  const tw = towerInto(G, rTower, rSlots);
  await ctx.yield();
  reefInto(G, hAt, noise);
  await ctx.yield();
  const body = new THREE.Mesh(G.toGeometry(), towerMaterial(U));
  group.add(body);
  const weed = makeWeed(rWeed, hAt, time);
  group.add(weed);
  await ctx.yield();

  // the beam: two opposite soft cones of lit sleet from the lantern, LOST IN THE SLEET: each is strongest at the
  // lantern, begins to fail at BEAM.fade metres and is gone, with no end to be seen, at BEAM.end (the ship lies
  // further off than that: the beam never reaches her), turning once in BEAM.turn seconds; start angle from its own
  // stream. Six crossed sheets to a cone, of which only those lying broad to the eye are seen (no sheet as a line).
  // And the lantern's own halo in the sleet, 22 m across.
  const BEAM = { end: opts.beamLength ?? 96, fade: 36, turn: 12 }, BL = BEAM.end, ly = tw.lantern[1];
  const beam = new THREE.Mesh(shaftGeometry([{ a: [1.9, ly, 0], b: [BL, ly, 0], w0: 1.2, w1: 1.2 + BL * 0.075, planes: 6 }, { a: [-1.9, ly, 0], b: [-BL, ly, 0], w0: 1.2, w1: 1.2 + BL * 0.075, planes: 6 }]),
    shaftMaterial(time, '#cdd7e6', opts.beamLevel ?? 0.3, { fall: 2.0, streak: 0.35, end0: BEAM.fade / BEAM.end, soft: 1 }));
  beam.frustumCulled = false; beam.renderOrder = 4; group.add(beam);
  const beamPhase = rBeam.range(0, Math.PI * 2), BEAM_TURN = Math.PI * 2 / BEAM.turn;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), uAt: { value: new THREE.Vector3(0, ly, 0) }, uColor: { value: new THREE.Color('#cdd7e6') } }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
uniform vec3 uAt; varying vec2 vUv;
void main(){
  vec4 mvPosition = modelViewMatrix*vec4(uAt, 1.); mvPosition.xy += position.xy*11.; vUv = position.xy;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform vec3 uColor; varying vec2 vUv;
void main(){ float r = length(vUv), a = exp(-r*r*5.)*.5 + exp(-r*r*40.)*.9; gl_FragColor = vec4(uColor*a*(1. - smoothstep(.75, 1., r))*(1. - .6*fxFog()), 1.); }`,
  }));
  halo.frustumCulled = false; halo.renderOrder = 4; group.add(halo);
  // the keepers' fire lies on the sea under the slit as a short broken glitter: where the steepest ray the slit lets
  // out (from the back's top over the mouth's sill) meets the sea
  const poolAt = [tw.slit[0] + SLIT.y * SLIT.deep / (SLIT.backH / 2 + SLIT.h / 2), 0.4, 0];
  // (and the ray itself: lit sleet from the slit slanting down to the sea east of the reef)
  const ray = new THREE.Mesh(shaftGeometry([{ pool: poolAt, size: [4.4, 2.8] }]), shaftMaterial(time, FIRE.hex, opts.rayLevel ?? 0.8, { fall: 1.2, streak: 0.4, fire: 1, fireSeed: KEEP.seed }));
  ray.frustumCulled = false; ray.renderOrder = 4; group.add(ray);
  // (its length is the air's, not the route's: opts.rayReach metres from the slit, where the sleet has put out a
  // stated share of the fire's light: the world works it out from its own air)
  const RAY = { reach: opts.rayReach ?? 66, y: 1.2 }, rayDrop = tw.slit[1] - RAY.y;
  const rayAir = new THREE.Mesh(shaftGeometry([{ a: [tw.slit[0] + 0.4, tw.slit[1], 0], b: [tw.slit[0] + Math.sqrt(Math.max(RAY.reach * RAY.reach - rayDrop * rayDrop, 1)), RAY.y, 0], w0: 0.5, w1: 6.5, planes: 4 }]),
    shaftMaterial(time, FIRE.hex, opts.rayAir ?? 0.16, { fall: 1.6, streak: 0.6, fire: 1, end0: 0.3, fireSeed: KEEP.seed }));
  rayAir.frustumCulled = false; rayAir.renderOrder = 4; group.add(rayAir);
  const glows = makeFireGlows([{ p: tw.slit, size: 3.0, level: 1.5, seed: KEEP.seed, heat: 1 }, { p: [tw.slit[0] + 0.2, tw.slit[1], 0], size: 0.7, level: 2.4, seed: KEEP.seed, heat: 1.6 }], { fog: 0.35 });
  glows.uniforms.uTime = time; glows.mesh.material.uniforms.uTime = time;
  group.add(glows.mesh);

  // white water: surges that climb the weather side, a boil round the reef's edge, spray in the slit's ray
  const list = [], ax = [wf.y, 0, -wf.x];
  // (the weather side's SURGES share ONE dealt period and stand evenly round it, as the caves' and the skerries' do:
  // six lives of 2.9 s laid end to end outlast it, so white water is climbing the tower at every clock)
  const SURGES = 6, surgeT = rSurge.range(5.5, 9.5), surge0 = rSurge.range(0, surgeT);
  for (let i = 0; i < SURGES; i++) {
    const off = (i - 2.5) * 2.4 + rSurge.range(-0.8, 0.8), d = rSurge.range(4.6, 8.5), x = wf.x * d + ax[0] * off, z = wf.y * d + ax[2] * off;
    list.push({ p: [x, Math.max(0.4, hAt(x, z)), z], dir: [-wf.x * 0.22, 1, -wf.y * 0.22], across: ax, speed: rSurge.range(11.5, 14.5), spread: 0.24, size: rSurge.range(2.3, 3.4),
      period: surgeT, offset: surge0 + surgeT * i / SURGES, life: 2.9, stagger: 0.7, puffs: 30 });
  }
  for (let i = 0; i < 14; i++) {
    const a = (i + rSurge.range(0, 0.8)) / 14 * Math.PI * 2, x = Math.cos(a) * 14.6, z = Math.sin(a) * 7.2, per = rSurge.range(2.0, 3.2);
    list.push({ p: [x, 0.3, z], dir: [Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3], across: [-Math.sin(a), 0, Math.cos(a)], speed: rSurge.range(3.0, 5.0), spread: 0.75, size: rSurge.range(1.5, 2.4),
      period: per, offset: rSurge.range(0, 10), stagger: per, life: per * 0.95, puffs: 9 });
  }
  // (the two sprays under the keepers' slit: one dealt period for both, half a period apart, so that one or the other
  // is up at every moment of a visit)
  const slitT = rSurge.range(4.5, 7), slit0 = rSurge.range(0, 10);
  [-3.2, 2.6].forEach((zz, i) => list.push({ p: [13.5, 0.5, zz], dir: [0.25, 1, 0], across: [0, 0, 1], speed: rSurge.range(8, 10), spread: 0.3, size: 2.2, period: slitT, offset: slit0 + slitT * i / 2, life: 2.3, stagger: 0.6, puffs: 18, warm: 0.7 }));
  const surge = makeBursts(list, { rng: rPuff, lit: opts.lit, shade: opts.shade });
  surge.mesh.material.uniforms.uTime = time;
  group.add(surge.mesh);

  // forty small dark sea birds are the birds nearest the tower: BIRDS.near to BIRDS.far metres from its axis at
  // every phase, BIRDS.low to BIRDS.high over the water, each bobbing on a beat of its own
  const BIRDS = { near: 12, far: 45, low: 1, high: 12 }, bSize = 0.8;
  const birds = makeSeaBirds(rBirds, opts.birds ?? 40, time, { rMin: (BIRDS.near + BIRD_SPAN * bSize) / (1 - BIRD_SWAY), rMax: (BIRDS.far - BIRD_SPAN * bSize) / (1 + BIRD_SWAY), yMin: 3.6, yMax: 9.4,
    bob: [0.9, 1.6], floor: BIRDS.low, ceil: BIRDS.high, size: bSize });
  group.add(birds.mesh);

  const seaAt = opts.seaAt;
  return {
    object: group, radius: 20, height: 32, center: new THREE.Vector3(0, 15, 0),
    anchors: { slit: new THREE.Vector3(...tw.slit), lantern: new THREE.Vector3(...tw.lantern), pool: new THREE.Vector3(...poolAt) },
    uniforms: U, surge, birds, glows, beam, ray, reefHeight: hAt, beamAngle: (t) => beamPhase + t * BEAM_TURN, BEAM, keepers: KEEP,
    update(dt, t) {
      time.value = t;
      const ang = beamPhase + t * BEAM_TURN;
      beam.rotation.y = ang; U.uBeamAng.value = -ang;
      if (seaAt) ray.material.uniforms.uPoolY.value = seaAt(poolAt[0], poolAt[2], t);
    },
    ground: true, groundY: 0,
  };
}
