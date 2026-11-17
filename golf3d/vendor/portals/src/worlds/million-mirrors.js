// HALL OF A MILLION MIRRORS
// A lamp-lit antechamber of brick and mirror work, two pierced cedar leaves that swing open, and a Persian mirror-work
// nave (src/parts/million-mirrors.js): five honeycomb domes of gilt stucco and mirror mosaic, stained glass in all ten
// windows, a long dark pool, one great chandelier whose reflection completes a globe of light. World space == the
// hero's local space: doors at z = -150, the globe at the origin, the apse niche and the portal at z = +180, floor at
// y = 0. The antechamber runs from z = -232 to -150; the flight enters it at z = -212.
// The antechamber (the first tenth of the flight): four pierced brass lanterns hang alternately left and right
// (passed at u 0.035, 0.063, 0.09), three bays a side hold tall pointed panels of mirror work, the vault carries
// mirror diamonds, the worn stone floor gives back the doorway and the lanterns as soft streaks. The leaves are
// pierced strapwork, so from the first frame the hall glitters through them with the blade of light between them.
// Its lantern colour and the light that follows the viewer in change with the look.
// Flight (u is the fraction of the 599 m path, 46.5 s): 0-0.10 the antechamber, the leaves swinging from u 0.012 to
// 0.073; 0.103 the threshold; 0.10-0.17 the skim over the pool with the globe dead ahead (doves leave the bank at
// u 0.11 and cross low, a white peacock walks the rim ahead); 0.17-0.25 the climb to the stained window of bay 2 on
// the sunward side, square on at u 0.25; 0.31-0.34 under the arch and out over the great bell, seen from above;
// 0.36-0.46 a rising half turn under dome 3, the gaze climbing the chain into the crown of the honeycomb (u 0.43,
// four doves wheel up round the chain from u 0.31); 0.46-0.52 down the far side to the rose alcove of the east pier
// (u 0.52: roses, a lantern, nightingales on the shelf and three more flitting before it); 0.53-0.59 the gaze runs
// along the mirror wall and its window and down to the water; u 0.59-0.63, level with the water, the whole globe
// stands on its own reflection with pale koi turning under it; 0.63-0.75 back along the other bank past a second
// alcove (u 0.70); 0.75-0.84 low over the far arm of the pool with its floating lamps and petals, the lesser
// chandelier overhead; then into the niche.
// Looks by seed (ctx.vary.hour is honoured): candle-lit dusk; noon (hard sun through the stained panes: shafts in
// the air, coloured quarries on marble and water, white peacocks); moonlight (candles out, sapphire glass, the alcove
// lanterns and the floating lamps the only warm lights, a lamp drifting on each arm of the pool); first snow (one
// tier of candles, the peacocks again). Koi are drawn over the water with a darker shape under each.
// Rare event: fireworks in the garden from u 0.07 to the end, a shell every 0.8 s in gold, ruby, emerald or sapphire
// opening behind a window the camera is looking at, taken up by every mirror, the vault, the gauze and the water.
// Everything the world adds in the nave (rugs, bolsters, vases of roses, sixteen rose alcoves, floating lamps, birds)
// is shaded by the hero's own hall shader (hero.makeMaterial) so it sits in the same light; the antechamber, the
// panes, the gauze and the small effects have their own shaders.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, MM_GLASS } from '../parts/million-mirrors.js';

const PALETTE = ['#070D14', '#1C3556', '#0E3B33', '#8FE3C0', '#C9D6E2', '#F2F8FF', '#4A4640'];
const WATER_Y = -0.4, DUR = 46.5, TAU = Math.PI * 2;
const DOOR_Z = -146.75, LEAF_W = 9.3, LEAF_H = 26, VEST_Z0 = -232, VEST_Z1 = -150, VEST_HW = 13, VEST_SPRING = 17;
const DOME_Z = [-120, -60, 0, 60, 120];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const WHITE = [1, 1, 1], _uv = [0, 0], _c = [0, 0, 0];

// ---------------------------------------------------------------------------------------------- geometry batch
// Merges three.js geometries into one buffer with the attributes both shader families read:
// position, normal, aUv (metres), aEdge (sway m, phase, bob), aMat (kind, size, ao, w), aCol (linear albedo).
function makeBatch() {
  const P = [], N = [], U = [], E = [], M = [], C = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), mt = new THREE.Matrix4();
  const q = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const attrs = [['position', P, 3], ['normal', N, 3], ['aUv', U, 2], ['aEdge', E, 3], ['aMat', M, 4], ['aCol', C, 3]];
  const api = {
    add(geo, o = {}) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      if (o.m) mt.copy(o.m);
      else {
        const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s === undefined ? [1, 1, 1] : (typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s);
        mt.compose(ps.set(p[0], p[1], p[2]), q.setFromEuler(eu.set(r[0], r[1], r[2], o.order || 'XYZ')), sc.set(s[0], s[1], s[2]));
      }
      nm.getNormalMatrix(mt);
      const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
      const kind = o.kind || 0, size = o.size || 0.6, w = o.w || 0, col = o.col || WHITE, us = o.us === undefined ? 1 : o.us, vs = o.vs === undefined ? 1 : o.vs;
      const phase = o.phase || 0, bob = o.bob || 99;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i); const lx = v.x, ly = v.y, lz = v.z;
        v.applyMatrix4(mt);
        if (nor) n.fromBufferAttribute(nor, i).applyMatrix3(nm); else n.set(0, 1, 0);
        const nl = n.length(); if (nl > 1e-9) n.multiplyScalar(1 / nl); else n.set(0, 1, 0);
        P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z);
        if (o.uvFn) { o.uvFn(v, _uv, lx, ly, lz); U.push(_uv[0], _uv[1]); } else U.push(uv ? uv.getX(i) * us : 0, uv ? uv.getY(i) * vs : 0);
        E.push(o.sway ? o.sway(lx, ly, lz) : 0, phase, bob);
        M.push(kind, size, o.ao === undefined ? 1 : (typeof o.ao === 'function' ? o.ao(lx, ly, lz, v) : o.ao), w);
        if (o.colFn) { o.colFn(lx, ly, lz, _c, v); C.push(_c[0], _c[1], _c[2]); } else C.push(col[0], col[1], col[2]);
      }
      if (g !== geo) g.dispose();
      geo.dispose();
      return api;
    },
    get triangles() { return P.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      for (const [name, data, n] of attrs) g.setAttribute(name, new THREE.Float32BufferAttribute(data, n));
      return g;
    },
    // the same geometry for a big batch, handing the page back between attributes
    async buildInSteps(tick) {
      const g = new THREE.BufferGeometry();
      for (const [name, data, n] of attrs) { g.setAttribute(name, new THREE.Float32BufferAttribute(data, n)); await tick(); }
      return g;
    },
  };
  return api;
}
// a grid surface f(s, t, out[x, y, z, u, v]) with computed normals
function surfGeo(nu, nv, f) {
  const W = nu + 1, H = nv + 1, pos = new Float32Array(W * H * 3), uv = new Float32Array(W * H * 2), idx = [], o = [0, 0, 0, 0, 0];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { f(i / nu, j / nv, o); const k = j * W + i; pos[k * 3] = o[0]; pos[k * 3 + 1] = o[1]; pos[k * 3 + 2] = o[2]; uv[k * 2] = o[3]; uv[k * 2 + 1] = o[4]; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const lathe = (prof, seg) => new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg);

// ---------------------------------------------------------------------------------------------- shared GLSL
const GLSL_H = /* glsl */`
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 h23(vec2 p){ return fract(sin(vec3(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)), dot(p, vec2(419.2, 371.9)))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
const GLSL_FOGF = /* glsl */`
float mmFog(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
`;
// the hall's light on a matt surface, from the hero's own uniforms (so every look carries over)
const GLSL_SOFT = /* glsl */`
uniform vec3 uAmb, uWinFill; uniform vec4 uFlame, uLit; uniform vec3 uGain; uniform vec2 uWinGain;
vec3 softLight(vec3 P, vec3 N){
  vec3 L = uAmb * (.75 + .25 * N.y);
  vec3 d = vec3(0., 6.7, 0.) - P; float d2 = dot(d, d);
  float lg = max(uLit.x, max(uLit.y, uLit.z));
  L += uFlame.rgb * (uGain.x * lg * (max(dot(N, d) * inversesqrt(d2 + 1e-3), 0.) * .75 + .25) / (1. + d2 / 900.));
  d = vec3(0., 35., -120.) - P; d2 = dot(d, d);
  L += uFlame.rgb * (uGain.x * .5 * uLit.w * (max(dot(N, d) * inversesqrt(d2 + 1e-3), 0.) * .75 + .25) / (1. + d2 / 420.));
  d = vec3(0., 35., 120.) - P; d2 = dot(d, d);
  L += uFlame.rgb * (uGain.x * .5 * uLit.w * (max(dot(N, d) * inversesqrt(d2 + 1e-3), 0.) * .75 + .25) / (1. + d2 / 420.));
  float bay = .6 + .4 * cos(P.z * .10472);
  L += uWinFill * (bay * (uWinGain.y * max((N.x + .3 * N.y) * .958, 0.) / (1. + (35. - P.x) * .03) + uWinGain.x * max((-N.x + .3 * N.y) * .958, 0.) / (1. + (35. + P.x) * .03)));
  return L; }
`;

// ---------------------------------------------------------------------------------------------- vestibule shader
// kinds (aMat.x): 0 herringbone brick wall with its panels of mirror work, 1 vault brick with mirror diamonds, 2 polished
// stone floor with a runner, 3 cedar with strapwork (aMat.y = 2: pierced), 4 metal, 5 cloth, 6 plain stone, 7 pierced
// lantern panel, 8 mirror work in stucco ribs
const VEST_VERT = /* glsl */`
attribute vec2 aUv; attribute vec4 aMat; attribute vec3 aCol;
varying vec3 vW, vN, vCol; varying vec2 vUv; varying vec4 vMat;
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * normal; vCol = aCol; vUv = aUv; vMat = aMat;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VEST_FRAG = /* glsl */`
uniform float uTime, uLampPhase; uniform vec3 uCamL; uniform vec4 uLamps[4]; uniform vec3 uLampCol;
uniform vec4 uBlade;        // half gap between the leaves (m), gain, z of the doors, glow on the hall side
uniform vec3 uBladeCol, uAmbV;
uniform vec4 uEntry;        // rgb of the cool light that follows the viewer in through the entry, w = its z
varying vec3 vW, vN, vCol; varying vec2 vUv; varying vec4 vMat;
#include <fog_pars_fragment>
${GLSL_H}
// 2:1 herringbone: x = distance to the brick's edge (cells), yz = brick id
vec3 herring(vec2 q){ vec2 c = floor(q), f = fract(q); float d = mod(c.x - c.y, 4.); vec2 lp, id;
  if (d < .5) { lp = f; id = c; } else if (d < 1.5) { lp = vec2(f.x + 1., f.y); id = c - vec2(1., 0.); }
  else if (d < 2.5) { lp = vec2(f.y + 1., f.x); id = c - vec2(0., 1.) + .5; } else { lp = vec2(f.y, f.x); id = c + .5; }
  return vec3(min(min(lp.x, 2. - lp.x), min(lp.y, 1. - lp.y)), id); }
// distance to the centre lines of the cedar strapwork (squares, diamonds and their diagonals on a 2.9 m repeat)
float strapD(vec2 u){
  vec2 p = (fract(u / 2.9) - .5) * 2.9; vec2 a = abs(p);
  float d = min(abs(max(a.x, a.y) - .95), abs((a.x + a.y) * .7071 - .95));
  return min(d, min(min(a.x, a.y) + step(max(a.x, a.y), .95) * 9., abs(a.x - a.y) * .7071 + step(max(a.x, a.y), .95) * 9.)); }
// The antechamber's mirror work: triangles of mirror, each a little out of true, near black until one lines the eye
// up with a lantern (a warm point) or with the hall beyond the doors (a cold one); a share of them carries the room's
// second reflections and blazes as the reflected ray sweeps by, so the sparks run along the walls with the eye.
// rgb = the facet's colour, a = 0 on the grout between facets.
vec4 mosaic(vec2 uv, vec3 P, vec3 N, vec3 V, float px, float hallK){
  float s = .5 * exp2(ceil(log2(max(2.4 * px / .5, 1.))));
  vec2 p = uv / s; vec2 q = vec2(p.x - p.y * .57735, p.y * 1.1547);
  vec2 ic = floor(q), f = fract(q); float up = step(1., f.x + f.y);
  vec2 id = ic + up * vec2(.37, .61); vec3 hs = h23(id + 11.1);
  float e = mix(min(min(f.x, f.y), 1. - f.x - f.y), min(min(1. - f.x, 1. - f.y), f.x + f.y - 1.), up) * s * .866;
  vec2 lq = f - mix(vec2(1. / 3.), vec2(2. / 3.), up); vec2 l = vec2(lq.x + lq.y * .5, lq.y * .866);
  float near = smoothstep(3.5, 8., s / px);
  vec3 hv = hs * 2. - 1.;
  vec3 n = N + (.32 * (.25 + 1.5 * hs.z * hs.z)) * (hv - N * dot(hv, N)); n /= max(length(n), 1e-3);
  vec3 r = reflect(V, n);
  vec2 sq = l - (hs.xy - .5) * .2;
  float spot = mix(.5, 2.6 * exp(-dot(sq, sq) * 24.), near);       // a wide plate holds its glint as a point
  vec3 c = vec3(.012, .024, .024) * (.4 + hs.y) * (.6 + .4 * r.y);
  float lampK = 0.;
  for (int i = 0; i < 4; i++) {
    vec3 Lv = uLamps[i].xyz - P; float d2 = dot(Lv, Lv);
    float g = max(dot(r, Lv) * inversesqrt(d2 + 1e-3), 0.); g *= g; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g; g *= g;
    float k = uLamps[i].w / (1. + d2 / 520.);
    c += uLampCol * (g * (.4 + k) * 2.2 * spot); lampK += k;
  }
  float pw = fract(hs.y * 31.7 + hs.x * 3.1);
  float ph = fract(hs.x * 9.73 + dot(r, vec3(1.31, .87, 1.13)) * 1.15 + uTime * (.012 + .03 * hs.z));
  float dph = abs(ph - .5) * 2.;
  float wH = .03 + .06 * min(lampK, 1.3);
  float hot = 1. - smoothstep(wH * .55, wH, dph);
  c += uLampCol * (hot * (.3 + 2.2 * pw * pw * pw) * spot * (.25 + .6 * min(lampK, 1.3)) + .006 * min(lampK, 1.5) * (.3 + hs.z));
  // the hall: cold silver and emerald points, more of them as the leaves swing
  float ph2 = fract(hs.z * 7.31 + dot(r, vec3(.9, 1.3, .7)) * 1.3 + uTime * .017);
  float wC = .012 + .14 * min(hallK, 1.);
  float cold = 1. - smoothstep(wC * .55, wC, abs(ph2 - .5) * 2.);
  vec3 cc = uBladeCol * mix(vec3(1.), vec3(.4, 1.25, .9), step(.66, fract(hs.x * 91.7)));
  c += cc * (cold * (.5 + 3. * fract(pw * 7.3)) * spot * (.3 + hallK));
  // a facet that throws the eye into the doorway holds a point of the hall's glitter, one in four of them
  float tz = (uBlade.z - P.z) / max(r.z, 1e-3); vec3 H = P + r * tz;
  float inD = step(1e-3, r.z) * (1. - smoothstep(8.3, 9.6, abs(H.x))) * smoothstep(0., 1.5, H.y) * (1. - smoothstep(24., 27., H.y)) * step(P.z, uBlade.z - 1.);
  c += cc * (inD * (step(.76, fract(hs.y * 17.3 + hs.z * 5.)) * (.4 + 2.4 * fract(pw * 3.7)) * spot * mix(.55, 1., near) + .014) * (.45 + .35 * clamp(uBlade.x / 9., 0., 1.)));
  float gw = max(.03 * sqrt(s), px * .6);
  return vec4(c, smoothstep(gw * .5, gw * 1.5, e)); }
void main(){
  vec3 N = vN / max(length(vN), 1e-4); vec3 Vd = vW - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  if (dot(N, V) > 0.) N = -N;
  float kind = vMat.x; vec2 u = vUv; vec2 fw = fwidth(u); float px = max(max(fw.x, fw.y), 1e-4);
  vec3 alb = vCol, emis = vec3(0.); float gloss = 0., tilt = 0., flank = 0., mir = 0., rib = 0., polish = 0., mao = 1.;
  vec3 STUCCO = vec3(.5, .52, .53);
  if (kind < .5) {
    float cs = .62; vec3 hb = herring(u / cs); float aa = px / cs;
    float hsh = h21(hb.yz); float mort = smoothstep(.05 - aa, .05 + aa, hb.x);
    alb *= mix(.42, .7 + .55 * hsh, mort) * (.85 + .3 * vnoise(u * 2.3));
    alb = mix(alb, alb * vec3(.8, .95, 1.15), step(.8, fract(hsh * 7.3)));
    tilt = (hsh - .5) * mort;
    // three bays a side hold a tall pointed panel of mirror work in a stucco frame
    float bz = vW.z + 220.; float bay = floor(bz / 20.); float zb = bz - bay * 20. - 10.; float az = abs(zb);
    float dA = min(min(8. - az, vW.y - 3.4), 16.1 - 4.6 * az * az / 64. - vW.y);
    dA = mix(-9., dA, step(-.5, bay) * step(bay, 2.5));
    if (dA > -.5) { alb = STUCCO * (.72 + .28 * sin(clamp((dA + .5) / .5, 0., 1.) * 3.1416)) * (.9 + .1 * vnoise(u * .9)); tilt = 0.; }
    if (dA > 0.) { mir = 1.; mao = .45 + .55 * smoothstep(0., 1.2, dA);
      vec2 dg = abs(fract(vec2(u.x + u.y, u.x - u.y) / 4.2) - .5) * 2.97;
      rib = 1. - smoothstep(.1 - px, .1 + px, min(dg.x, dg.y)); }
  } else if (kind < 1.5) {
    float row = floor(u.y / .5); vec2 bq = vec2(u.x / 1.3 + .5 * mod(row, 2.), u.y / .5); vec2 bf = fract(bq);
    float e = min(min(bf.x, 1. - bf.x) * 1.3, min(bf.y, 1. - bf.y) * .5); float hsh = h21(floor(bq));
    float mort = smoothstep(.03 - px, .03 + px, e);
    alb *= mix(.42, .68 + .5 * hsh, mort) * (.85 + .3 * vnoise(u * 2.3));
    tilt = (hsh - .5) * mort;
    // the vault: diamonds of mirror work let into the brick, each in a stucco fillet
    vec2 fc = abs(fract(vec2(u.x + u.y, u.x - u.y) / 6.8) - .5); float dc = (.5 - max(fc.x, fc.y)) * 4.8;
    if (dc > .5) { alb = STUCCO * (.72 + .28 * sin(clamp((dc - .5) / .34, 0., 1.) * 3.1416)); tilt = 0.; }
    if (dc > .84) { mir = 1.; mao = .5 + .5 * smoothstep(.84, 1.8, dc); }
  } else if (kind < 2.5) {
    float row = floor(u.y / 3.4); vec2 bq = vec2(u.x / 4.4 + .5 * mod(row, 2.) + .25, u.y / 3.4); vec2 bf = fract(bq);
    float e = min(min(bf.x, 1. - bf.x) * 4.4, min(bf.y, 1. - bf.y) * 3.4); float hsh = h21(floor(bq) + 3.);
    float joint = smoothstep(.05 - px, .08 + px, e);
    alb *= (.5 + .34 * hsh) * (.7 + .5 * vnoise(u * .9 + 7.)) * mix(.45, 1., joint);
    alb *= 1. - .35 * smoothstep(5.5, 1.5, abs(u.x)) * vnoise(u * .35);        // worn down the middle
    polish = joint * (.45 + .55 * hsh) * (.6 + .4 * vnoise(u * .6 + 3.)); tilt = (hsh - .5) * .12;
    float hw = 3.1; float bd = hw - abs(u.x);
    if (bd > 0.) {      // the runner
      float st = .4; vec2 c = vec2(u.x, mod(u.y, 6.4) - 3.2); vec2 cs = (floor(c / st) + .5) * st;
      float ring = fract((abs(cs.x) * .9 + abs(cs.y)) / 2.4);
      vec3 kc = ring < .25 ? vec3(.55, .5, .38) : (ring < .55 ? vec3(.36, .03, .05) : (ring < .78 ? vec3(.5, .34, .1) : vec3(.03, .05, .2)));
      kc = bd < .9 ? (bd < .22 ? vec3(.55, .5, .38) : (bd < .5 ? vec3(.03, .05, .2) : vec3(.42, .27, .08))) : kc;
      alb = kc * (.66 + .16 * mix(.5, vnoise(u * vec2(9., 26.)), clamp(.06 / px, 0., 1.))) * smoothstep(0., .05 + px, bd);
      alb = mix(vCol * .25, alb, smoothstep(0., .12 + px, bd));
      polish = 0.; tilt = 0.;
    }
  } else if (kind < 3.5) {
    float grain = vnoise(vec2(u.x * 7., u.y * .55)) * .6 + vnoise(vec2(u.x * 19., u.y * 1.3)) * .4;
    alb *= .6 + .6 * grain;
    float d = strapD(u);
    float aa = px * 1.2; float hwS = max(.13, px * .8); float strap = 1. - smoothstep(hwS - aa, hwS + aa, d);
    // the panels between stiles and rails are pierced: the hall shows through the strapwork before the leaves move
    if (vMat.y > 1.5 && strap < .5) discard;
    float edge = (1. - smoothstep(.13, .2 + aa, d)) - strap;
    alb *= mix(.55, 1.25, strap) * (1. - .5 * edge);
    alb *= .8 + .2 * smoothstep(0., 2.5, u.y);
    // the flank of each strap that is turned to the hall (aMat.w = which way that is along the leaf)
    float sh = max(.07, px * 1.5);
    flank = max(strap - (1. - smoothstep(.13 - aa, .13 + aa, strapD(u + vec2(vMat.w * sh, 0.)))), 0.) * abs(vMat.w);
  } else if (kind < 4.5) {
    gloss = 1.; alb *= .55 + .45 * vnoise(u * 5.);
  } else if (kind < 5.5) {
    alb *= .8 + .2 * mix(.5, vnoise(u * vec2(30., 9.)), clamp(.05 / px, 0., 1.));
    alb *= .75 + .25 * sin(u.y * 9. + sin(u.x * 3.) * 1.5);
  } else if (kind < 6.5) {
    float row = floor(u.y / 2.1); vec2 bq = vec2(u.x / 3.3 + .5 * mod(row, 2.), u.y / 2.1); vec2 bf = fract(bq);
    float e = min(min(bf.x, 1. - bf.x) * 3.3, min(bf.y, 1. - bf.y) * 2.1);
    alb *= (.72 + .3 * h21(floor(bq) + 11.)) * (.75 + .35 * vnoise(u * 1.4)) * mix(.5, 1., smoothstep(.03 - px, .06 + px, e));
  } else if (kind < 7.5) {
    vec2 c = vec2(fract(u.x) - .5, fract(u.y * 3.) - .5); vec2 a = abs(c);
    float star = min(max(a.x, a.y) - .23, (a.x + a.y) * .7071 - .23);
    float dots = length(vec2(fract(u.x + .5) - .5, fract(u.y * 3. + .5) - .5)) - .1;
    float aw = px * 1.5 + .015;
    float hole = 1. - smoothstep(-aw, aw, min(star, dots));
    float fk = .82 + .18 * sin(uTime * 13.) * sin(uTime * 7.3 + 1.);
    emis = uLampCol * (hole * 1.5 * fk);
    alb *= (1. - hole) * .7; gloss = 1.;
  } else {
    // the wall round the doors: mirror work from floor to vault, held in a net of stucco ribs
    mir = 1.; alb = STUCCO;
    vec2 dg = abs(fract(vec2(u.x + u.y, u.x - u.y) / 4.2) - .5) * 2.97;
    rib = 1. - smoothstep(.1 - px, .1 + px, min(dg.x, dg.y));
    rib = max(rib, 1. - smoothstep(.35 - px, .35 + px, min(abs(abs(u.x) - 9.9), abs(u.y - 26.6) + step(9.9, abs(u.x)) * 9.)));
  }
  N = normalize(N + tilt * .35 * vec3(.6, .3, .6));
  vec3 R = reflect(V, N);
  // the lanterns: a warm flame behind pierced brass, so each throws a soft lattice that fades with distance
  float fl = .9 + .1 * sin(uTime * 13.) * sin(uTime * 7.3 + 1.);
  float lampD = 0., lampS = 0.;
  for (int i = 0; i < 4; i++) {
    vec3 Lv = uLamps[i].xyz - vW; float d2 = dot(Lv, Lv); vec3 Ld = Lv * inversesqrt(d2 + 1e-3);
    float az = atan(-Ld.z, -Ld.x + 1e-5) + uLampPhase + float(i) * 1.7; float el = asin(clamp(-Ld.y, -1., 1.));
    float dap = 1. - (.6 / (1. + d2 / 70.)) * (.5 - .5 * sin(az * 11.) * sin(el * 11. + 1.));
    float k = uLamps[i].w * fl / (1. + d2 / 440.);
    lampD += max(dot(N, Ld), 0.) * dap * k;
    float sp = max(dot(R, Ld), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; lampS += sp * k;
  }
  float brick = (1. - step(1.5, kind)) * (1. - mir);          // dark brick needs more light than stone to read at all
  vec3 L = uAmbV * (.7 + .3 * N.y) * (.5 + .5 * vMat.z) + uLampCol * (lampD * .2 * (1. + .6 * brick));
  // cool light from the entry behind the viewer: the near walls and vault read, the far end stays dark
  vec3 Ev = vec3(0., 10., uEntry.w) - vW; float e2 = dot(Ev, Ev);
  L += uEntry.rgb * ((.3 + .7 * max(dot(N, Ev) * inversesqrt(e2 + 1e-3), 0.)) * (1. + 1.3 * brick) / (1. + e2 / 900.)) * step(vW.z, uBlade.z + .5);
  // the hall's light: through the pierced leaves and the gap between them, a tall slit on the axis that widens as they swing
  vec3 Bv = vec3(0., 13. + (clamp(vW.y, 0., 26.) - 13.) * .35, uBlade.z) - vW; float b2 = dot(Bv, Bv); vec3 Bd = Bv * inversesqrt(b2 + 1e-3);
  float D = max(uBlade.z - vW.z, 0.); float wdt = uBlade.x * 1.15 + D * .045 + .35;
  float inb = exp(-vW.x * vW.x / (wdt * wdt)); float open = clamp(uBlade.x / 9., 0., 1.);
  float glit = .6 + 1.1 * vnoise(vW.xz * 1.9 + vec2(0., uTime * .7)) * vnoise(vW.xz * .6 + vW.y * .5 - uTime * .2);
  float ndb = max(dot(N, Bd), 0.); float geo = mix(ndb, .35 + .65 * ndb, max(N.y, 0.));      // floors take the slit's light from its whole height
  float bl = uBlade.y * (inb * (.5 + .5 * open) * 1.5 + open * .25 + .1) * (1. - .55 * open) * geo / (1. + b2 / 3500.) * smoothstep(0., 7., D);
  L += uBladeCol * (bl * glit);
  // past the threshold the hall lights things from within: what is turned to it takes the light (the proud edges of
  // stiles and rails, the flanks of the strapwork, the bosses), the broad faces of the leaves stay dark silhouettes
  vec3 Hv = vec3(0., 16., uBlade.z + 62.) - vW; vec3 Hd = Hv * inversesqrt(dot(Hv, Hv) + 1e-3);
  float hn = max(dot(N, Hd), 0.); float inHall = step(uBlade.z + .5, vW.z) * uBlade.w;
  L += uBladeCol * (inHall * (.05 + 1.6 * hn * hn * hn * hn + 2.6 * flank));
  vec3 col = alb * L + emis;
  if (mir > .5) {
    float hallK = kind > 7.5 ? .75 + .25 * open : (.3 + .7 * open) * smoothstep(0., 6., D) / (1. + b2 / 2600.);
    vec4 m = mosaic(u, vW, N, V, px, hallK);
    col = mix(mix(STUCCO * L * .22, m.rgb * mao, m.a), STUCCO * L * (.7 + .3 * mao), rib);
  }
  if (polish > .001) {
    // worn stone polished by slippers: it gives back the doorway and the lanterns as long soft streaks
    vec3 nf = normalize(vec3((vnoise(u * 1.3) - .5) * .05, 1., (vnoise(u * 1.3 + 9.) - .5) * .05) + (N - vec3(0., 1., 0.)));
    vec3 Rf = reflect(V, nf); float fr = 1. - max(dot(-V, nf), 0.); float Fz = .2 + .8 * fr * fr * fr;
    float tz = (uBlade.z - vW.z) / max(Rf.z, 1e-3); vec3 H = vW + Rf * tz;
    float inD = (1. - smoothstep(8.3, 9.6, abs(H.x))) * smoothstep(0., 1.5, H.y) * (1. - smoothstep(23.5, 27., H.y)) * step(1e-3, Rf.z) * step(vW.z, uBlade.z);
    float gap = 1. - smoothstep(uBlade.x * .8, uBlade.x + .9, abs(H.x));
    float gl = .5 + 1.1 * vnoise(H.xy * 1.6 + vec2(0., uTime * .5)) * vnoise(H.xy * .5 - uTime * .15);
    vec3 rc = uBladeCol * (inD * (gap * 2.8 + (1. - gap) * 1.5) * gl);
    for (int i = 0; i < 4; i++) {
      vec3 Lv = uLamps[i].xyz - vW; float t = max(dot(Lv, Rf), 0.); vec3 mm = Lv - Rf * t; float rad = .8 + .07 * t;
      rc += uLampCol * (uLamps[i].w * 2.4 * exp(-dot(mm, mm) / (rad * rad)) * step(1e-3, t));
    }
    col += rc * (Fz * min(polish * 1.5, 1.));
  }
  col += gloss * vCol * (uLampCol * (lampS * 1.6) + uBladeCol * (bl * pow(max(dot(R, Bd), 0.), 10.) * 2. + inHall * pow(max(dot(R, Hd), 0.), 8.) * 5.));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- the blade of glitter
// An additive veil of the hall's glitter standing a leaf's width inside the doors, seen through the pierced strapwork
// and the gap between the leaves: hard sparks that come and go as the eye moves, fading out as the doors open and
// the real nave takes over.
const BLADE_VERT = /* glsl */`
varying vec3 vQ;
void main(){
  vQ = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;
const BLADE_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCamL, uBladeCol; uniform vec4 uBlade; varying vec3 vQ;
${GLSL_H}
void main(){
  float open = clamp(uBlade.x / 9., 0., 1.); float fade = 1. - smoothstep(.1, .5, open);
  vec2 g = vQ.xy * 2.3; vec2 c = floor(g), f = fract(g) - .5; float h = h21(c);
  float ph = fract(h * 13.7 + (uCamL.z * .05 + uCamL.x * .09) * (1. + h) + uTime * .11);
  float on = (1. - smoothstep(0., .2, abs(ph - .5))) * (1. - smoothstep(.1, .44, max(abs(f.x), abs(f.y))));
  float vy = smoothstep(0., 1.5, vQ.y) * (1. - smoothstep(26., 28., vQ.y)) * (1. - smoothstep(11., 13., abs(vQ.x)));
  float mid = exp(-vQ.x * vQ.x / 9.);
  vec3 col = uBladeCol * ((on * (1.6 + 6. * fract(h * 57.3)) + .3 + .2 * vnoise(vQ.xy * .35 + uTime * .1)) * (.8 + .9 * mid) * (vy * fade));
  col = mix(col, col * vec3(.45, 1.2, .9), step(.7, fract(h * 91.7)));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------------------------------------- window panes
// One quad per window at the outer face of the wall. Everything outside is drawn here from the eye ray: the dusk
// gradient, one star, sun or moon, two rows of swaying cypresses with parallax, snow, the firework bursts, and in
// front of it all the star-pattern sash lattice with clear, pale green or stained quarries.
const PANE_VERT = /* glsl */`
attribute vec3 aWin;        // side (+1 = the wall at x > 0), z of the window's centre, id
varying vec3 vP, vWin;
#include <fog_pars_vertex>
void main(){
  vP = position; vWin = aWin;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PANE_FRAG = /* glsl */`
uniform float uTime, uStain, uSnow, uStar; uniform vec3 uCamL;
uniform vec3 uSkyTop, uSkyBot, uTree, uLattice, uOrbCol; uniform vec4 uOrb;
uniform vec3 uFwPos[2]; uniform vec3 uFwCol[2]; uniform vec2 uFwAge, uFwRad;
varying vec3 vP, vWin;
#include <fog_pars_fragment>
${GLSL_H}
float cypress(vec2 q, float sp, float seed){
  float id = floor(q.x / sp); float fx = (fract(q.x / sp) - .5) * sp;
  float ha = h21(vec2(id, seed)), hb = h21(vec2(id + 31., seed));
  float h = mix(19., 37., ha), w = mix(1.5, 2.7, hb) * step(.14, hb);
  float yy = clamp(q.y / h, 0., 1.);
  float sway = sin(uTime * .7 + id * 1.7 + seed) * 1.1 * yy * yy;
  float hwd = w * pow(max(1. - yy, 0.), .6) * (.55 + .45 * smoothstep(0., .25, yy)) + .22 * sin(q.y * 1.9 + id * 5.) * (1. - yy);
  return (1. - smoothstep(hwd - .2, hwd + .25, abs(fx - sway))) * step(q.y, h); }
${MM_GLASS}
float flakes(vec2 q, float sc, float sp, float seed){
  q.y += uTime * sp; q.x += sin(q.y * .3 + seed) * .6;
  vec2 c = floor(q / sc), f = fract(q / sc) - .5; vec3 h = h23(c + seed * 17.);
  float r = .1 + .13 * h.z;
  return (1. - smoothstep(r * .5, r, length(f - (h.xy - .5) * .6))) * step(.2, h.z); }
// one shell of a chrysanthemum: n thin streaks from the middle out to a ring of bright heads (pu = one pixel, burst units)
float petals(vec2 pp, float n, float R, float seed, float age, float pu){
  float r = length(pp); float ang = atan(pp.y, pp.x + 1e-5) / 6.2832 + seed * .37;
  float si = floor(ang * n + .5); float sp = abs(ang * n - si); float hs = h21(vec2(si, seed));
  float Rs = R * (.72 + .28 * hs);
  float arc = sp * r * 6.2832 / n;                             // distance from the streak's axis
  float w = .2 + pu * .6;
  float streak = (1. - smoothstep(w * .5, w * 1.5, arc)) * clamp(.3 / w, .35, 1.);
  float along = smoothstep(Rs * .12, Rs * .8, r) * (1. - smoothstep(Rs, Rs * 1.03 + .3, r));
  float dr = r - Rs; float hw = .5 + pu * pu;
  float head = exp(-(dr * dr + arc * arc) / hw);
  float glit = .5 + .5 * sin(r * 4. - age * 20. + si * 2.4);
  return streak * along * (.6 + glit) * 2.2 + head * 6. * (.65 + .35 * sin(uTime * 30. + si * 7.)); }
vec4 burst(vec3 V, vec3 C, vec3 col, float age, float rad, float pu){
  if (age < 0. || age > 1.6) return vec4(0.);
  float sc = max(rad, 1.) / 17.;
  vec3 L = C - uCamL; float t = max(dot(L, V), 0.); vec3 m = V * t - L;
  vec3 ux = cross(V, vec3(0., 1., 0.)); ux /= max(length(ux), 1e-3); vec3 uy = cross(ux, V);
  vec2 pp = vec2(dot(m, ux), dot(m, uy)) / sc + vec2(0., age * age * 2.);
  float r = length(pp); float R = 17. * (1. - exp(-age * 5.)) + .5;
  float env = smoothstep(0., .2, age) * (1. - smoothstep(.35, 1.5, age));
  float core = exp(-r * r / 22.) * (1. - smoothstep(0., .4, age)) * 1.6;
  float f = petals(pp, 22., R, C.z * .13 + 1., age, pu) + .7 * petals(pp, 13., R * .56, C.z * .13 + 5., age, pu);
  // alpha: the dusk behind the shell goes dark for as long as it burns, so the streaks read against it
  return vec4(col * ((f + .1 * exp(-r * r / 150.)) * env + core) + vec3(1.) * (max(f - 3., 0.) * .5 * env), .62 * env * exp(-r * r / 260.)); }
void main(){
  vec3 Vd = vP - uCamL; vec3 V = Vd / max(length(Vd), 1e-3);
  float s = vWin.x, zb = vP.z - vWin.y; float ax = max(abs(V.x), .04);
  vec2 q = vec2(zb / 2.4 + .5, (vP.y - 9.) / 2.4); vec2 fwq = fwidth(q); float aa = max(max(fwq.x, fwq.y), 1e-4);
  vec3 sky = mix(uSkyBot, uSkyTop, smoothstep(-.06, .34, V.y));
  float ts = 400. / ax;
  vec2 qs = vec2(vP.z + V.z * ts, vP.y + V.y * ts) - vec2(vWin.y + (h21(vec2(vWin.z, 3.)) - .5) * 70., 150. + 70. * h21(vec2(vWin.z, 9.)));
  float ds = dot(qs, qs);
  sky += uStar * vec3(.9, 1., 1.1) * (exp(-ds / 12.) * 3. + exp(-ds / 220.) * .3) * (.8 + .2 * sin(uTime * 3. + vWin.z * 2.));
  float co = max(dot(V, uOrb.xyz), 0.); float c2 = co * co; c2 *= c2; c2 *= c2; c2 *= c2;
  sky += uOrbCol * (smoothstep(1. - uOrb.w, 1. - uOrb.w * .6, co) * 2.5 + c2 * c2 * .6 + c2 * .08);
  float t1 = 58. / ax; vec2 q1 = vec2(vP.z + V.z * t1, vP.y + V.y * t1 + 4.);
  vec3 col = mix(sky, mix(uTree, sky, .45), max(cypress(q1, 13., 5.), 1. - smoothstep(2., 5., q1.y)));
  float t2 = 26. / ax; vec2 q2 = vec2(vP.z + V.z * t2, vP.y + V.y * t2 + 2.);
  col = mix(col, uTree, max(cypress(q2, 9., 1.), 1. - smoothstep(3., 6., q2.y)));
  float pu = min(fwq.y * 7.8, 3.);
  vec4 b0 = burst(V, uFwPos[0], uFwCol[0], uFwAge.x, uFwRad.x, pu), b1 = burst(V, uFwPos[1], uFwCol[1], uFwAge.y, uFwRad.y, pu);
  col = col * ((1. - b0.a) * (1. - b1.a)) + b0.rgb + b1.rgb;
  if (uSnow > .001) {
    float ta = 7. / ax, tb = 15. / ax, tc = 30. / ax;
    float f = flakes(vec2(vP.z + V.z * ta, vP.y + V.y * ta), 1.1, 3.4, 1.) + .7 * flakes(vec2(vP.z + V.z * tb, vP.y + V.y * tb), 1.4, 2.6, 2.)
      + .5 * flakes(vec2(vP.z + V.z * tc, vP.y + V.y * tc), 1.9, 2., 3.);
    col = mix(col, uSkyBot * 1.2 + vec3(.02), .25 * uSnow) + uSnow * vec3(.5, .58, .7) * f;
  }
  // the sash: stars, crosses and diamonds of stained glass in leads (the hero's own pattern, so floor, water and
  // mirrors carry the same colours), two mullions, a transom and a frame
  vec4 gl = mmGlass(q, s, aa, uStain);
  float glass = gl.a * smoothstep(.06 - aa, .06 + aa, min(abs(q.x + 1.), abs(q.x - 2.))) * smoothstep(.06 - aa, .06 + aa, abs(q.y - 4.));
  glass *= smoothstep(.07 - aa, .07 + aa, (6. - abs(zb)) / 2.4) * smoothstep(.06 - aa, .06 + aa, q.y);
  vec3 tint = gl.rgb * (.9 + .1 * vnoise(q * 9.));
  col = mix(uLattice, col * tint, glass);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- gauze curtains
const CURT_VERT = /* glsl */`
attribute vec4 aC;          // side, phase, 0 at the rod .. 1 at the hem, 0..1 across the panel
uniform float uTime;
varying vec3 vP; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; float v = aC.z;
  float folds = sin(aC.w * 22. + aC.y * 5.) * .22 + sin(aC.w * 9. + 1.3) * .12;
  float breath = .5 + .5 * sin(uTime * .55 + aC.y * 6.283);
  float wave = sin(uTime * 1.3 + aC.y * 9. - v * 5. + aC.w * 3.);
  float push = v * v * (1.3 * breath + .4 * wave) + folds * (.4 + .6 * v);
  p.x -= aC.x * (push + .15);
  p.z += v * v * .3 * sin(uTime * .8 + aC.y * 4.);
  vP = p; vC = aC;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CURT_FRAG = /* glsl */`
uniform vec3 uWinTop, uWinBot, uGauze; uniform float uBack;
uniform vec3 uBurstPos[2]; uniform vec3 uBurstCol[2];
varying vec3 vP; varying vec4 vC;
#include <fog_pars_fragment>
${GLSL_SOFT}
void main(){
  vec3 N = cross(dFdx(vP), dFdy(vP)); N /= max(length(N), 1e-6);
  if (N.x * vC.x > 0.) N = -N;
  vec3 L = softLight(vP, N);
  float zb = mod(vP.z + 30., 60.) - 30.; float hd = 27.5 - 5.5 * (zb * zb / 36.);
  float inwin = (1. - smoothstep(5.2, 6.4, abs(zb))) * smoothstep(8.5, 10., vP.y) * (1. - smoothstep(hd - 1.5, hd + .5, vP.y));
  vec3 back = mix(uWinBot, uWinTop, clamp((vP.y - 9.) / 18., 0., 1.)) * ((vC.x > 0. ? uWinGain.y : uWinGain.x) * uBack);
  float fold = .6 + .4 * abs(N.x);
  vec3 b0 = uBurstPos[0] - vP, b1 = uBurstPos[1] - vP;
  vec3 fwg = uBurstCol[0] * (.2 / (1. + dot(b0, b0) / 700.)) + uBurstCol[1] * (.2 / (1. + dot(b1, b1) / 700.));
  vec3 col = uGauze * (L * 1.4 * fold + (back * inwin + fwg * mix(.3, 1., inwin)) * (.45 + .55 * fold));
  float a = mix(.82, .5, abs(N.x)) * smoothstep(0., .02, vC.z);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- rose petals
const PETAL_VERT = /* glsl */`
attribute vec4 iP, iQ;      // x, z, phase, size;  kind (0 afloat, 1 falling), drift, spin, tint
uniform float uTime; uniform vec3 uCamL;
varying vec2 vQ; varying vec3 vP, vN; varying float vT;
#include <fog_pars_vertex>
void main(){
  float ph = iP.z, size = iP.w; vec3 c, ax, ay;
  float ang = ph * 6.283 + uTime * iQ.z;
  if (iQ.x < .5) {
    c = vec3(iP.x, ${WATER_Y.toFixed(2)} + .04, iP.y);
    c.xz += iQ.y * vec2(sin(uTime * .09 + ph * 6.283), cos(uTime * .07 + ph * 4.1));
    vec2 d = c.xz - uCamL.xz; float dl = max(length(d), 1e-3);
    float push = (1. - smoothstep(2.5, 10., dl)) * (1. - smoothstep(5., 14., uCamL.y));
    c.xz += d / dl * (push * 3.5); ang += push * 2.5;
    float lim = clamp(35.355 - abs(c.z), 11., 25.) - .7;
    c.x = clamp(c.x, -lim, lim);
    c.y += .015 * sin(uTime * 1.3 + c.x * .8 + c.z * .5) + .1 * size * dot(position.xy, position.xy);
    ax = vec3(cos(ang), 0., sin(ang)); ay = vec3(-sin(ang), 0., cos(ang));
  } else {
    float f = fract(uTime * .03 * (.6 + .8 * fract(ph * 7.1)) + ph);
    c = vec3(iP.x + 1.6 * sin(uTime * .5 + ph * 30.), mix(46., ${WATER_Y.toFixed(2)} + .1, f), iP.y + 1.6 * cos(uTime * .43 + ph * 17.));
    // the kit's near law for petals (nothing at 0.6 m, whole from 2.5 m): a falling petal dwindles before the lens, never a flat shape across it
    size *= smoothstep(.6, 2.5, length(cameraPosition - (modelMatrix * vec4(c, 1.)).xyz));
    float tb = uTime * 1.7 + ph * 40.;
    ax = vec3(cos(ang), 0., sin(ang)); ay = vec3(-sin(ang) * cos(tb), sin(tb), cos(ang) * cos(tb));
  }
  vec3 wp = c + (ax * position.x + ay * position.y) * size;
  vN = cross(ay, ax); vQ = position.xy * 2.; vP = wp; vT = iQ.w;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PETAL_FRAG = /* glsl */`
uniform vec3 uCamL;
varying vec2 vQ; varying vec3 vP, vN; varying float vT;
#include <fog_pars_fragment>
${GLSL_SOFT}
void main(){
  float d = length(vec2(vQ.x, vQ.y * .85 + .14 * abs(vQ.x)));
  if (d > .95) discard;
  vec3 N = vN / max(length(vN), 1e-4); if (dot(N, vP - uCamL) > 0.) N = -N;
  vec3 alb = (vT < .42 ? vec3(.62, .045, .09) : (vT < .76 ? vec3(.86, .34, .44) : vec3(.86, .84, .78))) * (.7 + .3 * (1. - d)) * (.85 + .15 * smoothstep(-.9, .6, vQ.y));
  gl_FragColor = vec4(alb * (softLight(vP, N) * 1.7 + uAmb * .6), 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------- bubblers, ripples, steam
const WISP_VERT = /* glsl */`
attribute vec4 iW, iK;      // x, y, z, phase;  kind (0 jet, 1 ring on the water, 2 steam), size, rate, rise
uniform float uTime; uniform vec3 uCamL;
varying vec2 vQ; varying vec3 vP; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  float k = iK.x, ph = iW.w, size = iK.y; vec3 c = iW.xyz, wp; float t = fract(uTime * iK.z + ph);
  vec3 tc = uCamL - c; vec3 rt = cross(vec3(0., 1., 0.), tc); rt /= max(length(rt), 1e-3);
  if (k > .5 && k < 1.5) { wp = c + vec3(position.x, 0., position.y) * (size * (.6 + 4.4 * t)); }
  else if (k < .5) { wp = c + rt * (position.x * size) + vec3(0., (position.y + .5) * size * 1.25, 0.); }
  else {
    c += vec3(.35 * sin(ph * 40. + uTime * .7) * t, t * iK.w, .35 * cos(ph * 23. + uTime * .6) * t);
    vec3 up = cross(tc, rt); up /= max(length(up), 1e-3);
    wp = c + (rt * position.x + up * position.y) * (size * (.4 + 1.5 * t));
  }
  vQ = position.xy * 2.; vP = wp; vK = vec3(k, t, ph);
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WISP_FRAG = /* glsl */`
uniform float uTime;
varying vec2 vQ; varying vec3 vP; varying vec3 vK;
#include <fog_pars_fragment>
${GLSL_H}
${GLSL_FOGF}
${GLSL_SOFT}
void main(){
  float k = vK.x, t = vK.y, a; vec3 L = softLight(vP, vec3(0., 1., 0.)) + uAmb * .5;
  if (k < .5) {
    float y = vQ.y * .5 + .5; float pulse = .8 + .2 * sin(uTime * 7. + vK.z * 20.);
    float top = .62 * pulse; float w = .78 * sqrt(max(1. - (y / top) * (y / top), 0.)) * (.55 + .45 * smoothstep(.0, .5, y / top));
    float n = vnoise(vec2(vQ.x * 6., y * 7. - uTime * 4. + vK.z * 10.));
    a = (1. - smoothstep(w - .3, w, abs(vQ.x))) * (.45 + .55 * n) * smoothstep(0., .05, y) * (.35 + .5 * (1. - smoothstep(0., .5, abs(vQ.x)))) ;
    L = L * 2.4 + vec3(.012, .02, .022);
  } else if (k < 1.5) {
    float r = length(vQ); a = (1. - smoothstep(0., .07, abs(r - .86))) * (1. - t) * (1. - t) * .4; L *= 1.6;
  } else {
    float r = length(vQ); a = exp(-r * r * 3.2) * (1. - t) * smoothstep(0., .18, t) * .34; L *= 1.5;
    a *= .6 + .4 * vnoise(vQ * 2. + vK.z * 9. + uTime * .3);
  }
  a *= 1. - mmFog();
  gl_FragColor = vec4(L * vec3(.9, .97, 1.) * a, a);
}`;

// ---------------------------------------------------------------------------------------------- shafts through the dust
// Sheets of light standing in each window beam: some upright (seen from along the nave), some lying in the beam (seen
// from above and across). aS = 0..1 across the sheet, 0 at the pane .. 1 at the floor, sheet id.
const SHAFT_VERT = /* glsl */`
attribute vec3 aS; varying vec3 vS, vP;
#include <fog_pars_vertex>
void main(){
  vS = aS; vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
uniform float uTime, uStain; uniform vec3 uCamL, uShaftCol;
varying vec3 vS, vP;
#include <fog_pars_fragment>
${GLSL_H}
${GLSL_FOGF}
void main(){
  float edge = smoothstep(0., .1, vS.x) * smoothstep(0., .1, 1. - vS.x);
  float rays = .5 + .5 * sin(vS.x * 37. + vS.z * 5.) * sin(vS.x * 11. - vS.z * 3.);
  float dust = .55 + .45 * vnoise(vP.zy * .3 + vP.x * .2 + vec2(uTime * .09, -uTime * .06) + vS.z * 7.);
  float along = smoothstep(0., .05, vS.y) * (1. - .6 * vS.y) * (1. - smoothstep(.93, 1., vS.y));
  vec3 hs = h23(vec2(floor(vS.x * 8.), vS.z));
  vec3 st = hs.x < .34 ? vec3(1.5, .25, .32) : (hs.x < .67 ? vec3(.3, .5, 1.6) : vec3(.35, 1.3, .6));
  vec3 tint = mix(vec3(1.), st, uStain * .75 * step(.35, hs.y));
  float a = edge * (.35 + .65 * rays) * dust * along * smoothstep(1.5, 9., length(vP - uCamL)) * (1. - mmFog());
  gl_FragColor = vec4(uShaftCol * tint * a, 1.);
}`;

// ---------------------------------------------------------------------------------------------- the looks
// name -> hero look + what the world adds to it (outside the windows, fog, post, creature light)
const LOOKS = {
  dusk: { hero: 'dusk', over: { amb: [0.05, 0.07, 0.12], deep: lin('#0E3B33', 0.55) }, skyTop: lin('#1C3556', 2.6), skyBot: [0.36, 0.56, 0.5], tree: [0.004, 0.008, 0.012], lattice: [0.05, 0.045, 0.035], orb: [0, 1, 0, 1e-4], orbCol: [0, 0, 0],
    star: 1, snow: 0, stain: 0.85, fog: '#070D14', fogD: 0.0017, gauze: [0.76, 0.74, 0.7], back: 0.55, exposure: 1.14, bloom: 0.3, sat: 1.1, tint: '#f6f5f0', shadow: '#04101a',
    bird: 1, title: 'Hall of a Million Mirrors' },
  noon: { hero: 'noon', over: { deep: lin('#0E3B33', 0.7) }, skyTop: [0.3, 0.55, 1.15], skyBot: [1.1, 1.25, 1.3], tree: [0.012, 0.035, 0.03], lattice: [0.1, 0.085, 0.05], orb: [-1, 0.8, 0.22, 0.004], orbCol: [3, 2.9, 2.6],
    star: 0, snow: 0, stain: 1, fog: '#0b1216', fogD: 0.0015, gauze: [0.82, 0.8, 0.74], back: 0.5, exposure: 1.0, bloom: 0.28, sat: 1.12, tint: '#fbf8f0', shadow: '#081018', shaft: [0.085, 0.082, 0.07],
    bird: 1.5, title: 'Hall of a Million Mirrors, Noon' },
  moon: { hero: 'moon', over: { amb: [0.068, 0.092, 0.145], winFill: [0.11, 0.16, 0.27], spark: [1.3, 1.7, 2.5], beamCol: [[0.5, 0.66, 1.0], [0, 0, 0]], caus: [0.16, 0.27, 0.4], deep: [0.004, 0.013, 0.032] },
    skyTop: [0.035, 0.07, 0.17], skyBot: [0.14, 0.22, 0.36], tree: [0.002, 0.004, 0.008], lattice: [0.03, 0.04, 0.06], orb: [-1, 0.42, 0.3, 0.0012], orbCol: [1.3, 1.5, 1.9],
    star: 1.3, snow: 0, stain: 0.6, fog: '#060b16', fogD: 0.0016, gauze: [0.62, 0.7, 0.85], back: 0.9, exposure: 1.3, bloom: 0.34, sat: 1.04, tint: '#e6eeff', shadow: '#050a1c', shaft: [0.016, 0.024, 0.042],
    bird: 0.6, title: 'Hall of a Million Mirrors, Moonlight' },
  snow: { hero: 'snow', over: { amb: [0.064, 0.08, 0.105], winFill: [0.11, 0.14, 0.19], deep: [0.005, 0.016, 0.018] },
    skyTop: [0.1, 0.13, 0.19], skyBot: [0.3, 0.34, 0.4], tree: [0.01, 0.014, 0.02], lattice: [0.05, 0.05, 0.05], orb: [0, 1, 0, 1e-4], orbCol: [0, 0, 0],
    star: 0, snow: 1, stain: 0.85, fog: '#090d13', fogD: 0.0018, gauze: [0.76, 0.76, 0.76], back: 0.75, exposure: 1.26, bloom: 0.32, sat: 1.04, tint: '#f4f4f6', shadow: '#070c14',
    bird: 0.8, title: 'Hall of a Million Mirrors, First Snow' },
};
// The flight: the antechamber; the skim over the pool; up past the sunward window of the second bay; under the arch and
// down on the globe from above; round the third dome, rising, to look up the chain into its honeycomb; down its far side
// to the rose alcove; round to the waterline; back along the sunward bank and low over the pool to the niche.
const PATH_POINTS = [[0, 9, -212], [0, 9, -190], [0, 9, -168], [0, 8.6, -150],
  [-0.3, 6.6, -136], [-1.8, 5.6, -124], [-3.8, 5.3, -113],
  [-5.3, 7.2, -102], [-8.2, 10.6, -92.5], [-11, 14.5, -84], [-13, 19, -76.5],
  [-14.6, 22.8, -69], [-15.4, 24.6, -61], [-14.6, 24.8, -52], [-11.5, 23.6, -42.5], [-7.5, 21.4, -33.5], [-6, 20.5, -25],
  [-12, 23, -17], [-19, 27, -8], [-20.6, 30, 3], [-15.6, 32, 14.6], [0, 33, 20.2],
  [14, 30.5, 15.6], [21, 25.5, 8], [25, 19.5, 0.5], [27, 13.6, -7], [26, 10.2, -13.5], [20.5, 8.2, -24], [11, 6, -38.5], [0, 3.6, -45],
  [-13.5, 3.7, -39.5], [-22.5, 5, -24], [-25.5, 6.5, -4], [-22, 5.6, 16], [-14, 5, 36], [-5, 4.6, 54], [0, 4.8, 72], [0, 7.5, 94], [0, 10.6, 112], [0, 12, 130], [0, 12, 180]];
// ---------------------------------------------------------------------------------------------- vestibule
async function buildVestibule(b, rng, tick) {
  const BRICK = lin('#4A4640', 1.25), STONE = [0.2, 0.21, 0.22], DARK = [0.04, 0.045, 0.05];
  const len = VEST_Z1 - VEST_Z0, zc = (VEST_Z0 + VEST_Z1) / 2;
  // floor, walls, barrel vault
  b.add(surfGeo(2, 10, (s, t, o) => { o[0] = lerp(-VEST_HW, VEST_HW, s); o[1] = 0; o[2] = lerp(VEST_Z0, VEST_Z1, t); o[3] = o[0]; o[4] = o[2]; }), { kind: 2, col: [0.22, 0.23, 0.25] });
  for (const sx of [-1, 1]) b.add(surfGeo(10, 2, (s, t, o) => { o[0] = sx * VEST_HW; o[1] = t * VEST_SPRING; o[2] = lerp(VEST_Z0, VEST_Z1, s); o[3] = o[2] + sx * 3.1; o[4] = o[1]; }),
    { kind: 0, col: BRICK, ao: (x, y) => 0.55 + 0.45 * sstep(y, 0, 5) });
  b.add(surfGeo(20, 10, (s, t, o) => { const a = s * Math.PI; o[0] = VEST_HW * Math.cos(a); o[1] = VEST_SPRING + VEST_HW * Math.sin(a); o[2] = lerp(VEST_Z0, VEST_Z1, t); o[3] = o[2]; o[4] = a * VEST_HW; }),
    { kind: 1, col: BRICK });
  await tick();
  // the end wall round the door opening (18 x 26 m)
  const sh = new THREE.Shape(); sh.moveTo(-VEST_HW, 0); sh.lineTo(VEST_HW, 0); sh.lineTo(VEST_HW, VEST_SPRING);
  sh.absarc(0, VEST_SPRING, VEST_HW, 0, Math.PI, false); sh.lineTo(-VEST_HW, 0);
  const hole = new THREE.Path(); hole.moveTo(-9, 0); hole.lineTo(-9, 26); hole.lineTo(9, 26); hole.lineTo(9, 0); hole.lineTo(-9, 0); sh.holes.push(hole);
  b.add(new THREE.ShapeGeometry(sh, 20), { p: [0, 0, VEST_Z1 - 0.02], kind: 8, col: BRICK, uvFn: (v, uv) => { uv[0] = v.x; uv[1] = v.y; } });
  await tick();
  // stone architrave round the opening
  for (const sx of [-1, 1]) {
    b.add(new THREE.BoxGeometry(1.3, 26.2, 1.1), { p: [sx * 9.65, 13.1, VEST_Z1 - 0.55], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.x + v.z; uv[1] = v.y; } });
    b.add(new THREE.BoxGeometry(1.9, 1.1, 1.5), { p: [sx * 9.75, 0.55, VEST_Z1 - 0.75], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.x + v.z; uv[1] = v.y; } });
    b.add(new THREE.BoxGeometry(1.7, 0.8, 1.35), { p: [sx * 9.7, 22.4, VEST_Z1 - 0.68], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.x + v.z; uv[1] = v.y; } });
  }
  // transverse ribs on wall piers, a string course at the springing
  for (let z = VEST_Z0 + 12; z < VEST_Z1 - 8; z += 20) {
    await tick();                                              // one rib and its piers at a time
    const prof = [[13.02, -0.9], [12.25, -0.9], [12.05, -0.55], [12.05, 0.55], [12.25, 0.9], [13.02, 0.9]];
    b.add(surfGeo(22, prof.length - 1, (s, t, o) => { const a = s * Math.PI, q = prof[Math.round(t * (prof.length - 1))]; o[0] = q[0] * Math.cos(a); o[1] = VEST_SPRING + q[0] * Math.sin(a); o[2] = z + q[1]; o[3] = a * 13 ; o[4] = q[1] + t * 2; }),
      { kind: 6, col: STONE });
    for (const sx of [-1, 1]) {
      b.add(new THREE.BoxGeometry(0.95, VEST_SPRING, 1.8), { p: [sx * 12.53, VEST_SPRING / 2, z], kind: 6, col: STONE, ao: (x, y) => 0.5 + 0.5 * sstep(y, -8.5, -3), uvFn: (v, uv) => { uv[0] = v.z + v.x; uv[1] = v.y; } });
      b.add(new THREE.BoxGeometry(1.25, 0.8, 2.3), { p: [sx * 12.45, VEST_SPRING - 0.2, z], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z + v.x; uv[1] = v.y; } });
      b.add(new THREE.BoxGeometry(1.3, 1.1, 2.4), { p: [sx * 12.4, 0.55, z], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z + v.x; uv[1] = v.y; } });
    }
  }
  for (const sx of [-1, 1]) b.add(new THREE.BoxGeometry(0.35, 0.5, len), { p: [sx * 12.85, VEST_SPRING, zc], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
  await tick();
  // niches: a dark pointed recess in a stone frame, a shelf, and what the household left on it
  const niche = async (sx, z, what) => {
    const x = sx * (VEST_HW - 0.06), ry = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    const ns = new THREE.Shape(); ns.moveTo(-2.4, 0); ns.lineTo(2.4, 0); ns.lineTo(2.4, 5.2); ns.quadraticCurveTo(2.2, 7.6, 0, 9); ns.quadraticCurveTo(-2.2, 7.6, -2.4, 5.2); ns.lineTo(-2.4, 0);
    b.add(new THREE.ShapeGeometry(ns, 8), { p: [x, 3.2, z], r: [0, ry, 0], kind: 6, col: DARK, ao: (lx, ly) => 0.35 + 0.65 * sstep(ly, 9, 0), uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y; } });
    const pts = ns.getPoints(8).map((p) => new THREE.Vector3(p.x, p.y, 0));
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 40, 0.28, 5, false), { p: [x - sx * 0.1, 3.2, z], r: [0, ry, 0], kind: 6, col: STONE, us: 30, vs: 1 });
    await tick();
    b.add(new THREE.BoxGeometry(1.5, 0.45, 6), { p: [x - sx * 0.7, 3.0, z], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
    b.add(new THREE.BoxGeometry(0.9, 0.9, 0.7), { p: [x - sx * 0.5, 2.4, z - 2.2], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
    b.add(new THREE.BoxGeometry(0.9, 0.9, 0.7), { p: [x - sx * 0.5, 2.4, z + 2.2], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
    const px = x - sx * 0.85, py = 3.22;
    await tick();
    if (what === 'ewer') {
      const BRASS = [0.34, 0.33, 0.2];
      b.add(lathe([[0, 0], [0.55, 0], [0.6, 0.12], [0.3, 0.3], [0.42, 0.55], [0.85, 1.1], [0.95, 1.6], [0.78, 2.1], [0.36, 2.55], [0.24, 3.0], [0.3, 3.35], [0.5, 3.6], [0.44, 3.7], [0.2, 3.62]], 12),
        { p: [px, py, z], kind: 4, col: BRASS, us: 4, vs: 4 });
      const hc = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3, 3.3, 0), new THREE.Vector3(1.15, 3.2, 0), new THREE.Vector3(1.4, 2.3, 0), new THREE.Vector3(0.95, 1.5, 0)]);
      b.add(new THREE.TubeGeometry(hc, 10, 0.09, 5, false), { p: [px, py, z], r: [0, Math.PI / 2, 0], kind: 4, col: BRASS });
      const sc = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.8, 1.4, 0), new THREE.Vector3(-1.35, 2.2, 0), new THREE.Vector3(-1.45, 3.0, 0), new THREE.Vector3(-1.8, 3.45, 0)]);
      b.add(new THREE.TubeGeometry(sc, 10, 0.1, 5, false), { p: [px, py, z], r: [0, Math.PI / 2, 0], kind: 4, col: BRASS });
      b.add(lathe([[0, 0], [0.9, 0], [1.25, 0.25], [1.3, 0.34], [1.2, 0.34], [0.85, 0.1], [0, 0.1]], 12), { p: [px, py, z + 1.9], kind: 4, col: BRASS, us: 4, vs: 2 });
    } else {
      const CLOAK = lin('#0E3B33', 1.6), LINING = lin('#C9D6E2', 0.5);
      for (let i = 0; i < 4; i++) {
        const g = new THREE.SphereGeometry(1, 10, 6); const w = 1.9 - i * 0.12;
        b.add(g, { p: [px, py + 0.28 + i * 0.42, z + (rng() - 0.5) * 0.25], s: [0.62, 0.3, w], kind: 5, col: i === 3 ? LINING : CLOAK, us: 3, vs: 3 });
      }
      b.add(new THREE.SphereGeometry(1, 8, 5), { p: [px - sx * 0.1, py + 2.1, z + 0.5], s: [0.5, 0.34, 0.6], kind: 5, col: LINING, us: 3, vs: 3 });
    }
    await tick();
  };
  await niche(1, -190, 'ewer'); await niche(-1, -190, 'cloak'); await niche(-1, -170, 'ewer'); await niche(1, -170, 'cloak');
  // the panels of mirror work (drawn by the shader on the wall) stand in a raised stucco moulding over a stone sill
  const STUCCO = [0.5, 0.52, 0.53];
  for (const zc0 of [-210, -190, -170]) for (const sx of [-1, 1]) {
    await tick();
    const pts = [];
    for (let i = 0; i <= 4; i++) pts.push(new THREE.Vector3(-8.25, lerp(3.4, 11.3, i / 4), 0));
    for (let i = 1; i < 12; i++) { const zb = -8.25 + 16.5 * i / 12; pts.push(new THREE.Vector3(zb, 16.35 - 4.85 * zb * zb / 68, 0)); }
    for (let i = 0; i <= 4; i++) pts.push(new THREE.Vector3(8.25, lerp(11.3, 3.4, i / 4), 0));
    b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 44, 0.3, 5, false),
      { p: [sx * (VEST_HW - 0.08), 0, zc0], r: [0, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0], kind: 6, col: STUCCO, us: 40, vs: 1 });
    b.add(new THREE.BoxGeometry(0.75, 0.5, 17.6), { p: [sx * (VEST_HW - 0.37), 3.15, zc0], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
    b.add(new THREE.BoxGeometry(0.45, 0.3, 16.9), { p: [sx * (VEST_HW - 0.22), 2.78, zc0], kind: 6, col: STONE, uvFn: (v, uv) => { uv[0] = v.z; uv[1] = v.y + v.x; } });
  }
}
// one door leaf, hinge at the local origin, extending along +x (mirror with sx = -1), 0.7 thick towards +z
async function buildLeaf(b, sx, tick) {
  const CEDAR = [0.135, 0.108, 0.088], IRON = [0.1, 0.11, 0.13];
  const face = (v, uv, lx, ly) => { uv[0] = lx; uv[1] = ly + 13; };
  // the board is pierced strapwork: two skins of it, a hand apart, so the lattice has depth as the leaf turns
  for (const fz of [0.2, 0.5]) b.add(new THREE.PlaneGeometry(LEAF_W, LEAF_H), { p: [sx * LEAF_W / 2, LEAF_H / 2, fz], kind: 3, size: 2, col: CEDAR, uvFn: face, w: sx });
  // stiles and rails standing proud on both faces, iron bosses along them, strap hinges
  for (const fz of [0.05, 0.65]) {
    await tick();
    const stile = (x, w) => b.add(new THREE.BoxGeometry(w, LEAF_H, 0.22), { p: [sx * x, LEAF_H / 2, fz], kind: 3, col: [0.115, 0.092, 0.075], uvFn: (v, uv, lx, ly) => { uv[0] = lx * 0.37 + 50; uv[1] = ly; } });
    const rail = (y, h) => b.add(new THREE.BoxGeometry(LEAF_W, h, 0.22), { p: [sx * LEAF_W / 2, y, fz], kind: 3, col: [0.115, 0.092, 0.075], uvFn: (v, uv, lx, ly) => { uv[0] = ly * 0.37 + 80; uv[1] = lx; } });
    stile(0.45, 0.9); stile(LEAF_W - 0.45, 0.9); rail(0.6, 1.2); rail(LEAF_H - 0.5, 1.0); rail(8.9, 0.8); rail(17.6, 0.8);
    for (const y of [0.6, 8.9, 17.6, LEAF_H - 0.5]) for (let i = 0; i < 7; i++)
      b.add(new THREE.SphereGeometry(0.2, 6, 4, 0, TAU, 0, Math.PI / 2), { p: [sx * (0.9 + i * 1.25), y, fz + (fz < 0.3 ? -0.1 : 0.1)], r: [fz < 0.3 ? -Math.PI / 2 : Math.PI / 2, 0, 0], kind: 4, col: IRON });
    await tick();
    for (const x of [0.45, LEAF_W - 0.45]) for (let i = 0; i < 9; i++)
      b.add(new THREE.SphereGeometry(0.2, 6, 4, 0, TAU, 0, Math.PI / 2), { p: [sx * x, 2.2 + i * 2.75, fz + (fz < 0.3 ? -0.1 : 0.1)], r: [fz < 0.3 ? -Math.PI / 2 : Math.PI / 2, 0, 0], kind: 4, col: IRON });
  }
  for (const y of [3.2, 13, 22.8]) b.add(new THREE.BoxGeometry(4.2, 0.5, 0.12), { p: [sx * 2.1, y, -0.1], kind: 4, col: IRON, uvFn: face });
  // the ring pull near the meeting edge
  b.add(new THREE.TorusGeometry(0.55, 0.09, 5, 14), { p: [sx * (LEAF_W - 1.4), 6.2, -0.22], kind: 4, col: IRON });
}
// the pierced lantern, hanging from the local origin: a swelling brass body pierced in stars, banded rims, a finial
function buildLantern(b, drop) {
  const METAL = [0.2, 0.2, 0.15], SEG = 12;
  for (let i = 0, n = Math.floor((drop - 2.2) / 0.36); i < n; i++)
    b.add(new THREE.TorusGeometry(0.16, 0.045, 4, 8), { p: [0, -0.2 - i * 0.36, 0], r: [0, (i & 1) * Math.PI / 2, 0], s: [1, 1.35, 1], kind: 4, col: METAL });
  const y0 = -drop;                                           // centre of the body
  b.add(lathe([[0.1, 2.2], [0.24, 2.08], [0.16, 1.9], [0.3, 1.78], [0.2, 1.64], [0.62, 1.46], [0.98, 1.2], [1.04, 1.06], [0.96, 1.02]], SEG), { p: [0, y0, 0], kind: 4, col: METAL, us: 8, vs: 3 });
  b.add(lathe([[0.94, -1.02], [1.12, -0.62], [1.2, -0.2], [1.2, 0.2], [1.12, 0.62], [0.94, 1.02]], SEG), { p: [0, y0, 0], kind: 7, col: METAL, us: 12, vs: 2 });
  b.add(lathe([[0.96, -1.02], [1.04, -1.06], [0.98, -1.2], [0.66, -1.44], [0.28, -1.58], [0.34, -1.74], [0.16, -1.9], [0.2, -2.04], [0, -2.3]], SEG), { p: [0, y0, 0], kind: 4, col: METAL, us: 8, vs: 3 });
  for (const [y, r] of [[1.04, 1.0], [0, 1.23], [-1.04, 1.0]]) b.add(new THREE.TorusGeometry(r, 0.045, 5, 24), { p: [0, y0 + y, 0], r: [Math.PI / 2, 0, 0], kind: 4, col: METAL });
  for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU;      // drops hanging from the lower rim
    b.add(lathe([[0, 0], [0.07, -0.08], [0.09, -0.2], [0, -0.38]], 5), { p: [Math.cos(a) * 1.0, y0 - 1.1, Math.sin(a) * 1.0], kind: 4, col: METAL }); }
  b.add(new THREE.TorusGeometry(0.26, 0.05, 4, 10), { p: [0, y0 + 2.42, 0], kind: 4, col: METAL });
}

// ---------------------------------------------------------------------------------------------- nave furnishings
const SILVER = [0.68, 0.6, 0.42], MARBLE = [0.66, 0.63, 0.56], CREAM = [0.66, 0.6, 0.46], EMERALD = [0.03, 0.2, 0.12], LEAF = [0.06, 0.2, 0.09];
const RUBY = [0.42, 0.03, 0.06], GOLDC = [0.62, 0.44, 0.14], SAPPH = [0.04, 0.08, 0.3];
const VASE_PROF = [[0, 0], [1.0, 0], [1.1, 0.14], [0.62, 0.42], [0.5, 0.85], [0.8, 1.5], [1.4, 2.4], [1.62, 3.2], [1.45, 4.0], [0.9, 4.75], [0.52, 5.3], [0.5, 5.7], [0.78, 6.05], [0.86, 6.12], [0.7, 6.0]];
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _ax = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
function rodBetween(b, a, c, r, o) {
  _va.set(a[0], a[1], a[2]); _vb.set(c[0], c[1], c[2]); const len = _va.distanceTo(_vb);
  _ax.subVectors(_vb, _va).normalize(); _q1.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _ax);
  _m1.compose(_va.clone().add(_vb).multiplyScalar(0.5), _q1, _one);
  b.add(new THREE.CylinderGeometry(r, r, len, o.sides || 5, 1), { ...o, m: _m1 });
}
// a tall silver-gilt vase of tuberoses and roses on a marble plinth; the stems nod in the draught
async function addVase(b, rng, x, z, tick) {
  const ph = rng() * 6.283, lip = 6.45, spike = rng() < 0.5 ? [0.82, 0.8, 0.72] : [0.8, 0.36, 0.44];
  b.add(new THREE.CylinderGeometry(1.9, 2.15, 0.5, 8), { p: [x, 0.25, z], kind: 0, col: MARBLE, ao: (lx, ly) => (ly > 0 ? 0.8 : 0.45), us: 8, vs: 1 });
  b.add(lathe(VASE_PROF, 14), { p: [x, 0.5, z], kind: 4, col: SILVER, us: 9, vs: 7, ao: (lx, ly) => 0.6 + 0.4 * sstep(ly, 0, 2) });
  await tick();
  b.add(new THREE.TorusGeometry(1.6, 0.11, 5, 14), { p: [x, 3.72, z], r: [Math.PI / 2, 0, 0], kind: 4, col: SILVER });
  const n = 9;
  for (let i = 0; i < n; i++) {
    if (i % 3 === 0) await tick();                              // three stems at a time
    const a = (i + rng() * 0.6) / n * TAU, tilt = 0.1 + 0.3 * rng(), L = 3.0 + 2.3 * rng(), tuber = i % 2 === 0;
    _ax.set(Math.cos(a + Math.PI / 2), 0, Math.sin(a + Math.PI / 2));
    _m1.makeRotationAxis(_ax, -tilt).setPosition(x + Math.cos(a) * 0.25, lip, z + Math.sin(a) * 0.25);
    const sw = (ly) => 0.03 + 0.26 * (ly / L) * (ly / L);
    b.add(new THREE.CylinderGeometry(0.05, 0.085, L, 4, 3).translate(0, L / 2, 0), { m: _m1, kind: 0, col: LEAF, phase: ph + i, sway: (lx, ly) => sw(ly) });
    if (tuber) {
      for (let k = 0; k < 7; k++) {
        const ly = L * (0.52 + 0.5 * k / 6), ka = k * 2.4, w = sw(ly), s = 0.31 - k * 0.016;
        _m2.makeTranslation(Math.cos(ka) * 0.17, ly, Math.sin(ka) * 0.17).premultiply(_m1);
        b.add(new THREE.OctahedronGeometry(1).scale(s, s * 1.7, s), { m: _m2, kind: 0, col: spike, phase: ph + i, sway: () => w });
      }
    } else {
      const w = sw(L);
      _m2.makeTranslation(0, L + 0.3, 0).premultiply(_m1);
      addRose(b, _m2.clone(), 0.56, ROSE_COLS[(i + Math.floor(ph * 3)) % 4], ph + i, w);
    }
  }
  await tick();
  for (let i = 0; i < 5; i++) {
    const a = (i + 0.5 + rng() * 0.5) / 5 * TAU, tilt = 0.45 + 0.3 * rng(), L = 2.6 + rng();
    _ax.set(Math.cos(a + Math.PI / 2), 0, Math.sin(a + Math.PI / 2));
    _m2.makeRotationY(-a + Math.PI / 2); _m1.makeRotationAxis(_ax, -tilt).multiply(_m2).setPosition(x + Math.cos(a) * 0.3, lip - 0.1, z + Math.sin(a) * 0.3);
    b.add(new THREE.PlaneGeometry(0.42, L, 1, 3).translate(0, L / 2, 0), { m: _m1, kind: 0, col: LEAF, phase: ph + i * 2, sway: (lx, ly) => 0.2 * (ly / L) * (ly / L),
      colFn: (lx, ly, lz, c) => { const k = 0.7 + 0.6 * ly / L; c[0] = LEAF[0] * k; c[1] = LEAF[1] * k; c[2] = LEAF[2] * k; } });
  }
}
async function addFurnishings(b, rng, tick) {
  // kilim runners either side of the pool, one inside the doors and one before the niche
  const runner = (xc, hw, z0, z1) => {
    b.add(surfGeo(1, 10, (s, t, o) => { o[0] = xc + (s - 0.5) * 2 * hw; o[1] = 0.05; o[2] = lerp(z0, z1, t); o[3] = o[0] - xc; o[4] = o[2]; }), { kind: 8, size: hw, col: WHITE });
    for (const [za, zb] of [[z0 - 0.7, z0], [z1, z1 + 0.7]])
      b.add(surfGeo(1, 1, (s, t, o) => { o[0] = xc + (s - 0.5) * 2 * hw; o[1] = 0.04; o[2] = lerp(za, zb, t); o[3] = o[0] * 9; o[4] = o[2]; }), { kind: 0, col: CREAM });
  };
  for (const sx of [-1, 1]) { runner(sx * 19.6, 4.3, -123, -33); runner(sx * 19.6, 4.3, 33, 123); }
  runner(0, 6.2, 131.5, 145.5);
  await tick();
  // mattresses along the dado with silk bolsters, a tall vase either side of every window, a silver rod for the gauze
  const vases = [];
  for (const zc of DOME_Z) for (const sx of [-1, 1]) {
    for (const e of [-1, 1]) {
      const z0 = zc + e * 9.6, z1 = zc + e * 25.4, zm = (z0 + z1) / 2, xm = sx * 33.45;
      b.add(new THREE.BoxGeometry(2.7, 0.6, Math.abs(z1 - z0), 1, 1, 6), { p: [xm, 0.3, zm], kind: 8, size: 1.35, col: [0.9, 0.9, 0.9], ao: (lx, ly) => (ly > 0 ? 1 : 0.4),
        uvFn: (v, uv) => { uv[0] = v.x - xm; uv[1] = v.z; } });
      for (let k = 0; k < 3; k++) {
        await tick();                                            // a bolster at a time, then the vase
        const zb = zm + (k - 1) * 5.1, tone = rng();
        const body = [RUBY, SAPPH, EMERALD][(k + (e > 0 ? 1 : 0) + (sx > 0 ? 1 : 0)) % 3];
        const band = (ly, c) => { const t = Math.abs(ly); const q = t > 1.75 ? body : (t > 1.35 ? GOLDC : (t > 1.15 ? CREAM : body)); const g = 0.85 + 0.3 * tone; c[0] = q[0] * g; c[1] = q[1] * g; c[2] = q[2] * g; };
        b.add(new THREE.CylinderGeometry(0.78, 0.78, 4.2, 8, 6, true), { p: [sx * 33.95, 1.36, zb], r: [Math.PI / 2, 0, 0], kind: 0, us: 6, vs: 6, colFn: (lx, ly, lz, c) => band(ly, c),
          ao: (lx, ly, lz, v) => 0.45 + 0.55 * sstep(v.y, 0.6, 1.7) });
        await tick();                                            // its body, then its ends
        for (const en of [-1, 1]) {
          b.add(new THREE.SphereGeometry(0.78, 8, 3, 0, TAU, 0, Math.PI / 2), { p: [sx * 33.95, 1.36, zb + en * 2.1], r: [en * Math.PI / 2, 0, 0], s: [1, 0.45, 1], kind: 0, col: body, us: 3, vs: 3 });
          b.add(new THREE.SphereGeometry(0.17, 6, 4), { p: [sx * 33.95, 1.36, zb + en * 2.5], kind: 4, col: SILVER });
        }
      }
      vases.push([sx * 31.3, zc + e * 10.4]);
    }
    b.add(new THREE.CylinderGeometry(0.13, 0.13, 17, 6, 1), { p: [sx * 34.3, 28.35, zc], r: [Math.PI / 2, 0, 0], kind: 4, col: SILVER });
    for (const e of [-1, 1]) b.add(new THREE.SphereGeometry(0.3, 6, 5), { p: [sx * 34.3, 28.35, zc + e * 8.5], kind: 4, col: SILVER });
  }
  await tick();
  // a tray of tea glasses at the pool's edge
  const tx = 14.8, tz = -93, steam = [];
  b.add(new THREE.CylinderGeometry(1.25, 1.5, 0.95, 8, 1), { p: [tx, 0.475, tz], kind: 0, col: [0.07, 0.055, 0.045], ao: (lx, ly) => 0.5 + 0.5 * sstep(ly, -0.5, 0.4), us: 8, vs: 1 });
  b.add(lathe([[0, 0.02], [2.2, 0.02], [2.5, 0.3], [2.58, 0.3], [2.25, 0.1], [0, 0.1]], 20), { p: [tx, 0.95, tz], kind: 4, col: SILVER, us: 12, vs: 3 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * TAU + 0.3, gx = tx + Math.cos(a) * 1.5, gz = tz + Math.sin(a) * 1.5;
    b.add(lathe([[0.3, 0], [0.34, 0.03], [0.1, 0.05], [0.15, 0.08], [0.12, 0.3], [0.13, 0.4], [0.2, 0.62], [0.21, 0.68]], 8), { p: [gx, 1.05, gz], kind: 4, col: [0.55, 0.7, 0.66], us: 3, vs: 3 });
    steam.push([gx, 1.75, gz]);
  }
  b.add(lathe([[0, 0], [0.42, 0], [0.5, 0.1], [0.74, 0.55], [0.72, 0.95], [0.5, 1.25], [0.22, 1.36], [0.28, 1.5], [0.12, 1.66], [0, 1.7]], 12), { p: [tx, 1.05, tz], kind: 4, col: SILVER, us: 6, vs: 4 });
  b.add(new THREE.TorusGeometry(0.42, 0.06, 5, 10, Math.PI), { p: [tx - 0.72, 1.8, tz], r: [0, 0, Math.PI / 2], kind: 4, col: SILVER });
  rodBetween(b, [tx + 0.6, 1.6, tz], [tx + 1.2, 2.25, tz], 0.07, { kind: 4, col: SILVER });
  steam.push([tx + 1.25, 2.35, tz]);
  await tick();
  // the candle-lighter's pole leaning on the dado, its taper still smoking
  const poleA = [31.3, 0, -68.5], poleB = [34.5, 13.4, -67];
  rodBetween(b, poleA, poleB, 0.085, { kind: 0, col: [0.1, 0.075, 0.055] });
  rodBetween(b, poleB, [34.1, 14.1, -67], 0.045, { kind: 4, col: SILVER });
  b.add(new THREE.ConeGeometry(0.3, 0.5, 8, 1, true), { p: [33.75, 14.15, -67], r: [0, 0, Math.PI], kind: 4, col: SILVER });
  // slippers left inside the threshold
  for (let i = 0; i < 2; i++) {
    const sxp = 4.1 + i * 0.95, szp = -141.6 - i * 0.5, col = lin('#8FE3C0', 0.55);
    b.add(new THREE.SphereGeometry(1, 10, 6), { p: [sxp, 0.15, szp], r: [0, 0.35, 0], s: [0.3, 0.16, 0.62], kind: 0, col, us: 3, vs: 3 });
    b.add(new THREE.ConeGeometry(0.13, 0.42, 6), { p: [sxp + 0.2, 0.34, szp + 0.56], r: [0.9, 0.35, 0], kind: 0, col });
    b.add(new THREE.TorusGeometry(0.2, 0.05, 4, 10), { p: [sxp - 0.06, 0.24, szp - 0.14], r: [Math.PI / 2, 0, 0], s: [1, 1.5, 1], kind: 4, col: SILVER });
  }
  return { steam, vases, taper: [34.05, 14.15, -67] };
}
// a settled dove, about 1.3 m long, facing +z
function addPerched(b, x, y, z, yaw, ph) {
  const W1 = [0.82, 0.85, 0.86], W2 = [0.66, 0.7, 0.74];
  const R = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z), put = (g, px, py, pz, sx, sy, sz, rx, col, bob) => {
    _m2.makeRotationX(rx).scale(_va.set(sx, sy, sz)).setPosition(px, py, pz).premultiply(R); b.add(g, { m: _m2, kind: 0, col, phase: ph, bob, us: 2, vs: 2 }); };
  put(new THREE.SphereGeometry(1, 9, 6), 0, 0.42, 0, 0.36, 0.34, 0.58, -0.25, W1, 0.03);
  put(new THREE.SphereGeometry(1, 8, 5), 0, 0.86, 0.38, 0.19, 0.2, 0.21, 0, W1, 0.07);
  put(new THREE.ConeGeometry(1, 1, 5), 0, 0.84, 0.62, 0.05, 0.16, 0.05, Math.PI / 2, [0.5, 0.45, 0.45], 0.07);
  put(new THREE.ConeGeometry(1, 1, 6), 0, 0.3, -0.72, 0.26, 0.75, 0.06, -Math.PI / 2 - 0.2, W2, 0.03);
  for (const s of [-1, 1]) put(new THREE.SphereGeometry(1, 7, 4), s * 0.27, 0.46, -0.1, 0.1, 0.24, 0.5, -0.3, W2, 0.03);
}

// a white peacock, 4.5 m to the crest at this scale, facing +z with its train laid out behind; origin between its feet
function addPeacock(b, rng) {
  const W1 = [0.84, 0.87, 0.88], W2 = [0.7, 0.75, 0.8], HORN = [0.42, 0.4, 0.38];
  const part = (g, o) => b.add(g, { kind: 0, col: W1, us: 2, vs: 2, ...o });
  part(new THREE.SphereGeometry(1, 14, 9), { p: [0, 2.55, 0], s: [0.72, 0.68, 1.3], r: [-0.18, 0, 0], bob: 0.05, ao: (x, y) => 0.55 + 0.45 * sstep(y, -0.9, 0.2) });
  for (const sx of [-1, 1]) part(new THREE.SphereGeometry(1, 10, 6), { p: [sx * 0.6, 2.7, -0.15], s: [0.2, 0.46, 1.05], r: [-0.2, 0, 0], col: W2, bob: 0.05 });
  const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.75, 0.95), new THREE.Vector3(0, 3.5, 1.5), new THREE.Vector3(0, 4.35, 1.5), new THREE.Vector3(0, 4.85, 1.72)]);
  part(new THREE.TubeGeometry(neck, 10, 0.2, 7, false), { bob: 0.09, sway: (x, y) => 0.03 * sstep(y, 2.8, 4.8) });
  part(new THREE.SphereGeometry(0.27, 9, 7), { p: [0, 4.95, 1.82], s: [0.9, 0.95, 1.2], bob: 0.09, sway: () => 0.03 });
  part(new THREE.ConeGeometry(0.09, 0.4, 5), { p: [0, 4.9, 2.25], r: [Math.PI / 2, 0, 0], col: HORN, bob: 0.09, sway: () => 0.03 });
  for (let i = 0; i < 6; i++) { const a = (i - 2.5) * 0.2;      // the crest: a fan of fine stalks with a bead on each
    rodBetween(b, [0, 5.15, 1.75], [Math.sin(a) * 0.5, 5.75 + 0.08 * Math.cos(a * 3), 1.62], 0.016, { kind: 0, col: W2, bob: 0.09, sides: 3 });
    part(new THREE.SphereGeometry(0.07, 5, 4), { p: [Math.sin(a) * 0.5, 5.78 + 0.08 * Math.cos(a * 3), 1.62], bob: 0.09 }); }
  for (const sx of [-1, 1]) {
    rodBetween(b, [sx * 0.3, 2.05, 0.1], [sx * 0.32, 1.0, -0.05], 0.085, { kind: 0, col: HORN, sides: 5, phase: sx > 0 ? 0 : Math.PI, sway: () => 0.04 });
    rodBetween(b, [sx * 0.32, 1.0, -0.05], [sx * 0.34, 0.06, 0.15], 0.06, { kind: 0, col: HORN, sides: 5, phase: sx > 0 ? 0 : Math.PI, sway: (x, y) => 0.04 + 0.14 * sstep(y, -0.5, 0.5) });
    part(new THREE.SphereGeometry(1, 6, 4), { p: [sx * 0.34, 0.06, 0.32], s: [0.2, 0.05, 0.34], col: HORN, phase: sx > 0 ? 0 : Math.PI, sway: () => 0.18 });
  }
  // the train: long plumes that leave the back, arch a little and trail on the marble, each ending in a pale eye
  for (let i = 0; i < 17; i++) {
    const f = (i + 0.5) / 17 - 0.5, len = 6.2 + 1.8 * rng() - 2.2 * Math.abs(f), spread = f * 3.4, lift = 0.5 + 0.5 * rng(), ph = rng() * 6;
    const g = surfGeo(1, 7, (s, t, o) => { const w = (0.1 + 0.34 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.05, 1)), 0.6)) * (t > 0.82 ? 1.5 : 1);
      o[0] = spread * t * (0.4 + 0.6 * t) + (s - 0.5) * w; o[1] = 2.9 + lift * Math.sin(Math.PI * t) * 0.6 - (2.9 - 0.12) * Math.pow(t, 1.6); o[2] = -0.9 - len * t; o[3] = s; o[4] = t * 6; });
    b.add(g, { kind: 0, us: 1, vs: 1, phase: ph, sway: (x, y, z) => 0.05 * sstep(-z, 1, 6),
      colFn: (x, y, z, c) => { const t = clamp((-z - 0.9) / len, 0, 1), eye = t > 0.84 ? 1 : 0, k = 0.8 + 0.2 * Math.sin(t * 40);
        c[0] = (eye ? 0.4 : 0.8) * k; c[1] = (eye ? 0.78 : 0.84) * k; c[2] = (eye ? 0.62 : 0.86) * k; } });
  }
}

// ---------------------------------------------------------------------------------------------- the rose alcoves
// A taqcheh on either flank of every pier: a marble shelf under a kilim, a pointed niche lined with mirror work between
// gilt colonettes, a brass vase heaped with roses, a garland round the arch, a lantern hanging in the hood (the hall's
// shader lights the place round each from the same point). Local space: the pier's flank is the plane z = 0, the
// alcove stands out along +z, origin on the floor at its middle.
const GILT = [0.72, 0.52, 0.2], BRASS = [0.6, 0.46, 0.2];
const ROSE_COLS = [[0.55, 0.03, 0.06], [0.42, 0.02, 0.05], [0.62, 0.05, 0.1], [0.8, 0.22, 0.32], [0.84, 0.42, 0.5], [0.84, 0.8, 0.72]];
const alcArch = (x) => { const q = Math.min(Math.abs(x) / 2.25, 1); return 9.3 + 3.3 * (0.55 * Math.sqrt(1 - q * q) + 0.45 * (1 - q)); };
// one rose: a cup of petals round a darker heart on a green calyx, opening along the local +y of m
function addRose(b, m, r, col, ph, sw) {
  b.add(new THREE.SphereGeometry(r, 8, 5).scale(1, 0.8, 1), { m, kind: 0, phase: ph, sway: () => sw,
    colFn: (x, y, z, c) => { const h = y / (r * 0.8), k = (0.6 + 0.45 * h) * (0.8 + 0.2 * Math.sin(Math.atan2(z, x) * 5 + h * 5)) * (1 - 0.5 * sstep(h, 0.55, 0.95));
      c[0] = col[0] * k; c[1] = col[1] * k; c[2] = col[2] * k; } });
  _m2.makeTranslation(0, -r * 0.85, 0).premultiply(m);
  b.add(new THREE.ConeGeometry(r * 0.55, r * 0.6, 5), { m: _m2, kind: 0, col: LEAF, phase: ph, sway: () => sw });
}
const leafCol = (L) => (lx, ly, lz, c) => { const k = 0.7 + 0.7 * ly / L; c[0] = LEAF[0] * k; c[1] = LEAF[1] * k; c[2] = LEAF[2] * k; };
async function buildAlcove(b, rng, tick) {
  const STONE = [0.7, 0.67, 0.6], STU = [0.8, 0.66, 0.42];
  const face = (v, uv) => { uv[0] = v.x; uv[1] = v.y; };
  // plinth, base moulding and shelf
  b.add(new THREE.BoxGeometry(5.9, 3.25, 1.7), { p: [0, 1.625, 0.85], kind: 0, col: STONE, ao: (x, y) => 0.5 + 0.5 * sstep(y, -1.6, 0.5), uvFn: face });
  b.add(new THREE.BoxGeometry(6.2, 0.4, 1.95), { p: [0, 0.2, 0.97], kind: 0, col: STONE, uvFn: face });
  b.add(new THREE.BoxGeometry(6.25, 0.35, 2.0), { p: [0, 3.42, 1.0], kind: 0, col: STU, uvFn: face });
  // a kilim laid over the shelf, hanging down its front
  b.add(surfGeo(1, 6, (s, t, o) => { const d = t * 3.6, over = Math.max(d - 1.2, 0); o[0] = (s - 0.5) * 3.6; o[1] = 3.62 - over; o[2] = over > 0 ? 2.04 : 0.84 + d; o[3] = o[0]; o[4] = d; }),
    { kind: 8, size: 1.8, col: WHITE });
  await tick();
  // jambs with gilt colonettes
  for (const sx of [-1, 1]) {
    b.add(new THREE.BoxGeometry(0.7, 5.8, 1.45), { p: [sx * 2.62, 6.5, 0.725], kind: 0, col: STU, ao: (x, y) => 0.6 + 0.4 * sstep(y, -2.9, 0), uvFn: face });
    b.add(lathe([[0.3, 0], [0.34, 0.12], [0.22, 0.3], [0.17, 0.5], [0.17, 4.6], [0.22, 4.8], [0.3, 4.95], [0.2, 5.1], [0.34, 5.35], [0.36, 5.7], [0.3, 5.8]], 8), { p: [sx * 2.2, 3.6, 1.42], kind: 4, col: GILT, us: 4, vs: 8 });
  }
  await tick();
  // the niche: a shallow concave back of mirror work under a pointed head, the soffit of the hood in mirror too
  b.add(surfGeo(8, 8, (s, t, o) => { const x = (s - 0.5) * 4.5; o[0] = x; o[1] = lerp(3.6, alcArch(x) - 0.05, t); o[2] = 0.12 + 0.6 * (x / 2.25) * (x / 2.25); o[3] = x + 20; o[4] = o[1]; }),
    { kind: 1, size: 0.34, col: WHITE, ao: 0.9 });
  b.add(surfGeo(12, 1, (s, t, o) => { const x = (s - 0.5) * 4.5; o[0] = x; o[1] = alcArch(x); o[2] = lerp(0.1, 1.45, t); o[3] = s * 9 + 40; o[4] = o[2]; }), { kind: 1, size: 0.3, col: WHITE, ao: 0.8 });
  await tick();
  // the face of the hood: spandrels of mirror work, a gilt roll round the arch, a cornice with three finials
  const sp = new THREE.Shape(); sp.moveTo(-2.97, 9.2); sp.lineTo(-2.25, 9.2);
  for (let i = 0; i <= 16; i++) { const x = -2.25 + 4.5 * i / 16; sp.lineTo(x, alcArch(x)); }
  sp.lineTo(2.25, 9.2); sp.lineTo(2.97, 9.2); sp.lineTo(2.97, 13.3); sp.lineTo(-2.97, 13.3); sp.lineTo(-2.97, 9.2);
  b.add(new THREE.ShapeGeometry(sp, 1), { p: [0, 0, 1.45], kind: 1, size: 0.3, col: WHITE, uvFn: (v, uv) => { uv[0] = v.x + 60; uv[1] = v.y; } });
  const pts = []; for (let i = 0; i <= 16; i++) { const x = -2.25 + 4.5 * i / 16; pts.push(new THREE.Vector3(x, alcArch(x), 1.5)); }
  b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 32, 0.13, 5, false), { kind: 4, col: GILT, us: 20, vs: 1 });
  b.add(new THREE.BoxGeometry(6.3, 0.4, 1.75), { p: [0, 13.5, 0.87], kind: 0, col: STU, uvFn: face });
  b.add(new THREE.BoxGeometry(6.0, 0.25, 1.6), { p: [0, 13.82, 0.8], kind: 0, col: STU, uvFn: face });
  for (const x of [-2.6, 0, 2.6]) b.add(lathe([[0.22, 0], [0.3, 0.15], [0.12, 0.35], [0.26, 0.62], [0.2, 0.85], [0, 1.15]], 7), { p: [x, 13.94, 0.9], kind: 4, col: GILT });
  await tick();
  // the lantern: brass caps, a belly of lit glass (kind 9), on a chain from the crown of the hood
  b.add(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), { p: [0, 11.7, 0.85], kind: 4, col: BRASS });
  b.add(lathe([[0.05, 0.62], [0.3, 0.5], [0.4, 0.42]], 8), { p: [0, 10.4, 0.85], kind: 4, col: BRASS });
  b.add(lathe([[0.4, -0.42], [0.5, -0.15], [0.5, 0.15], [0.4, 0.42]], 8), { p: [0, 10.4, 0.85], kind: 9, col: WHITE });
  b.add(lathe([[0.4, -0.42], [0.3, -0.5], [0.08, -0.62], [0.02, -0.8]], 8), { p: [0, 10.4, 0.85], kind: 4, col: BRASS });
  // the vase and its roses
  const C = [0, 7.35, 0.98];
  b.add(lathe(VASE_PROF, 12), { p: [C[0], 3.6, C[2]], s: 0.5, kind: 4, col: BRASS, us: 9, vs: 7 });
  await tick();
  for (let i = 0; i < 26; i++) {
    const th = Math.acos(1 - 1.25 * (i + 0.5) / 26), ph = i * 2.39996 + 0.4, r = 0.3 + 0.11 * rng();
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph);
    _va.set(dx * 1.2, dy + 0.25, dz * 0.5 + 0.35).normalize(); _q1.setFromUnitVectors(_vb.set(0, 1, 0), _va);
    _m1.compose(_ax.set(C[0] + dx * 1.75, C[1] + dy * 1.55, C[2] + dz * (dz > 0 ? 0.55 : 0.3)), _q1, _one);
    addRose(b, _m1, r, ROSE_COLS[(i * 7 + (rng() < 0.3 ? 1 : 0)) % ROSE_COLS.length], rng() * 6.283, 0.02 + 0.03 * Math.max(dy, 0));
    if (i % 6 === 5) await tick();
  }
  for (let i = 0; i < 14; i++) {
    const a = (i + rng()) / 14 * TAU, tilt = 0.9 + 0.5 * rng(), L = 0.9 + 0.5 * rng();
    _ax.set(Math.cos(a + Math.PI / 2), 0, Math.sin(a + Math.PI / 2));
    _m2.makeRotationY(-a + Math.PI / 2); _m1.makeRotationAxis(_ax, -tilt).multiply(_m2).setPosition(C[0] + Math.cos(a) * 0.5, 6.7, C[2] + Math.sin(a) * 0.3);
    b.add(new THREE.PlaneGeometry(0.5, L, 1, 2).translate(0, L / 2, 0), { m: _m1, kind: 0, phase: i, sway: (lx, ly) => 0.05 * ly / L, colFn: leafCol(L) });
  }
  await tick();
  // the garland round the arch, and petals fallen on the shelf
  for (let i = 0; i < 13; i++) {
    const x = -2.25 + 4.5 * (i + 0.5) / 13, y = alcArch(x) + 0.1;
    for (const e of [-1, 1]) { _m1.makeRotationZ(e * (1.1 + 0.5 * rng()) + (x < 0 ? 0.5 : -0.5)).setPosition(x, y, 1.57);
      b.add(new THREE.PlaneGeometry(0.3, 0.75, 1, 1).translate(0, 0.5, 0), { m: _m1, kind: 0, phase: i, sway: (lx, ly) => 0.02 * ly, colFn: leafCol(0.9) }); }
    _m1.makeRotationX(Math.PI / 2).setPosition(x, y, 1.62);
    addRose(b, _m1, 0.25 + 0.05 * (i & 1), ROSE_COLS[(i * 5 + 2) % ROSE_COLS.length], i * 1.3, 0.012);
  }
  for (let i = 0; i < 8; i++) { const col = ROSE_COLS[(i * 3) % 5];
    b.add(new THREE.CircleGeometry(0.17, 5), { p: [(rng() - 0.5) * 4.6, 3.65, 1.15 + rng() * 0.8], r: [-Math.PI / 2, 0, rng() * 6], kind: 0, col }); }
}
// a nightingale, about 2 m from bill to tail at this scale, perched and facing +z (yaw turns it); origin between its feet
function addNightingale(b, x, y, z, yaw, ph, sing) {
  const BACK = [0.5, 0.33, 0.16], BREAST = [0.84, 0.74, 0.54], TAIL = [0.62, 0.24, 0.08], BILL = [0.7, 0.5, 0.16];
  const R = new THREE.Matrix4().makeRotationY(yaw).scale(_vb.set(1.5, 1.5, 1.5)).setPosition(x, y, z);
  const put = (g, px, py, pz, sx, sy, sz, rx, o) => { _m2.makeRotationX(rx).scale(_va.set(sx, sy, sz)).setPosition(px, py, pz).premultiply(R); b.add(g, { m: _m2, kind: 0, phase: ph, us: 2, vs: 2, ...o }); };
  const coat = (lx, ly, lz, c) => { const k = sstep(ly, 0.3, -0.45); c[0] = lerp(BACK[0], BREAST[0], k); c[1] = lerp(BACK[1], BREAST[1], k); c[2] = lerp(BACK[2], BREAST[2], k); };
  put(new THREE.SphereGeometry(1, 10, 7), 0, 0.56, 0, 0.31, 0.31, 0.47, -0.5, { colFn: coat, bob: 0.03 });
  put(new THREE.SphereGeometry(1, 8, 6), 0, 0.97, 0.31, 0.2, 0.2, 0.22, sing ? -0.5 : 0, { colFn: coat, bob: 0.05, sway: () => 0.012 });
  put(new THREE.ConeGeometry(1, 1, 5), 0, sing ? 1.13 : 0.98, sing ? 0.52 : 0.6, 0.045, 0.22, 0.045, sing ? 0.7 : Math.PI / 2, { col: BILL, bob: 0.05, sway: () => 0.012 });
  if (sing) put(new THREE.ConeGeometry(1, 1, 5), 0, 0.99, 0.58, 0.04, 0.18, 0.04, Math.PI / 2 + 0.2, { col: BILL, bob: 0.05, sway: () => 0.012 });
  put(new THREE.ConeGeometry(1, 1, 6), 0, 0.44, -0.64, 0.2, 0.72, 0.05, -Math.PI / 2 - 0.35, { col: TAIL, bob: 0.03, sway: () => 0.03 });
  for (const s of [-1, 1]) {
    put(new THREE.SphereGeometry(1, 7, 4), s * 0.25, 0.6, -0.08, 0.08, 0.21, 0.43, -0.5, { col: [0.38, 0.24, 0.12], bob: 0.03 });
    put(new THREE.CylinderGeometry(1, 1, 1, 4), s * 0.1, 0.14, 0.03, 0.028, 0.28, 0.028, 0, { col: BILL });
  }
}

// ---------------------------------------------------------------------------------------------- the world
export default {
  id: 'million-mirrors',
  name: 'Hall of a Million Mirrors',
  category: 'interior',
  weirdness: 0.15,
  media: ['interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = clamp(vary.density || 1, 0.7, 1.3);
    const tick = () => (ctx.yield ? ctx.yield() : Promise.resolve());
    // what the seed decides: the hour and weather, the birds, the koi
    const pickLook = rng.fork('look')(), pickCast = rng.fork('cast')(), pickKoi = rng.fork('koi')();
    let lookName = pickLook < 0.2 ? 'moon' : pickLook < 0.42 ? 'noon' : pickLook < 0.6 ? 'snow' : 'dusk';
    if (vary.hour === 'day') lookName = 'noon'; else if (vary.hour === 'night') lookName = 'moon'; else if (vary.hour === 'golden') lookName = 'dusk'; else if (vary.hour === 'dawn') lookName = 'snow';
    const rare = !!vary.rare;
    if (rare && lookName === 'noon') lookName = 'dusk';          // fireworks want a dark garden
    const LK = LOOKS[lookName], swallows = pickCast < 0.35;
    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(LK.fog);
    scene.fog = new THREE.FogExp2(LK.fog, LK.fogD);

    // ------------------------------------------------------------------ the hero: the mirror nave and the globe
    const hero = await buildHero(ctx, { palette: PALETTE, look: LK.hero });
    if (LK.over) hero.setLook(LK.over);
    hero.setPortalColor(PALETTE[3], 2.5);
    scene.add(hero.object);                                       // at the origin: world space is the hero's space
    const HU = hero.uniforms, A = hero.anchors;
    await tick();

    // ------------------------------------------------------------------ the path
    const path = makePath(PATH_POINTS);
    const _p = new THREE.Vector3();
    const samp = new Float32Array(601 * 3); for (let i = 0; i <= 600; i++) { path.pointAt(i / 600, _p); samp[i * 3] = _p.x; samp[i * 3 + 1] = _p.y; samp[i * 3 + 2] = _p.z; }
    const uOf = (x, y, z) => { let best = 1e9, bu = 0; for (let i = 0; i <= 600; i++) { const d = (samp[i * 3] - x) ** 2 + (samp[i * 3 + 1] - y) ** 2 + (samp[i * 3 + 2] - z) ** 2; if (d < best) { best = d; bu = i / 600; } } return bu; };
    const U_DOOR = uOf(0, 8.6, -150), U_OPEN0 = 0.012, U_OPEN1 = U_DOOR - 0.03;
    const U_WIN = uOf(-14.6, 22.8, -69), U_ABOVE = uOf(-12, 23, -17), U_CROWN = uOf(0, 33, 20.2), U_ALC = uOf(26, 10.2, -13.5), U_SOUTH = uOf(0, 3.6, -45);
    await tick();

    // ------------------------------------------------------------------ vestibule, doors, lantern
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const bladeCol = { dusk: [0.72, 0.95, 0.9], noon: [1.0, 1.0, 0.94], moon: [0.4, 0.56, 0.95], snow: [0.62, 0.72, 0.84] }[lookName];
    // four pierced lanterns down the antechamber, alternate sides; their flames are the one warm light of the place
    const LAMPS = [[-8.2, -204], [8.2, -190], [-8.2, -172], [8.2, -156]], LAMP_Y = 13.4, LAMP_GAIN = [0.8, 1, 1, 0.9];
    const lampCol = { dusk: [2.7, 1.6, 0.7], noon: [2.3, 2.05, 1.5], moon: [1.0, 1.5, 2.4], snow: [2.8, 1.15, 0.5] }[lookName];
    const lampHex = { dusk: '#FFC070', noon: '#FFE6B4', moon: '#9CC4FF', snow: '#FF9A50' }[lookName];
    const entryCol = { dusk: [0.3, 0.3, 0.42], noon: [0.8, 0.74, 0.58], moon: [0.16, 0.26, 0.6], snow: [0.5, 0.56, 0.66] }[lookName];
    const ambV = { dusk: [0.04, 0.036, 0.04], noon: [0.075, 0.07, 0.06], moon: [0.018, 0.028, 0.056], snow: [0.045, 0.05, 0.062] }[lookName];
    const VU = { uTime: HU.uTime, uCamL: HU.uCamL, uLampPhase: { value: 0 }, uLamps: { value: LAMPS.map((q, i) => new THREE.Vector4(q[0], LAMP_Y, q[1], LAMP_GAIN[i])) },
      uLampCol: { value: V3(lampCol) }, uBlade: { value: new THREE.Vector4(1, 5.4, VEST_Z1, 0.5) }, uBladeCol: { value: V3(bladeCol) },
      uAmbV: { value: V3(ambV) }, uEntry: { value: new THREE.Vector4(entryCol[0], entryCol[1], entryCol[2], PATH_POINTS[0][2] - 4) } };
    const vestMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...VU }, vertexShader: VEST_VERT, fragmentShader: VEST_FRAG, fog: true, side: THREE.DoubleSide });
    const meshOf = (batch, mat, order) => { const m = new THREE.Mesh(batch.build ? batch.build() : batch, mat); m.frustumCulled = false; m.renderOrder = order || 0; return m; };
    { const vb = makeBatch(); await buildVestibule(vb, rng.fork('vestibule'), tick); await tick(); scene.add(meshOf(vb, vestMat)); }
    await tick();
    const doorL = new THREE.Group(), doorR = new THREE.Group();
    doorL.position.set(-LEAF_W, 0, DOOR_Z); doorR.position.set(LEAF_W, 0, DOOR_Z);
    { const bl = makeBatch(); await buildLeaf(bl, 1, tick); doorL.add(meshOf(bl, vestMat)); await tick();
      const br = makeBatch(); await buildLeaf(br, -1, tick); doorR.add(meshOf(br, vestMat)); }
    scene.add(doorL, doorR);
    await tick();
    {
      const g = new THREE.PlaneGeometry(26, 28, 1, 1); g.translate(0, 14, 0);
      const mat = new THREE.ShaderMaterial({ uniforms: { uTime: HU.uTime, uCamL: HU.uCamL, uBlade: VU.uBlade, uBladeCol: VU.uBladeCol }, vertexShader: BLADE_VERT, fragmentShader: BLADE_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const m = meshOf(g, mat, 6); m.position.set(0, 0, DOOR_Z + 10.2); scene.add(m);
    }
    const lampPivotY = VEST_SPRING + Math.sqrt(VEST_HW * VEST_HW - 8.2 * 8.2) - 0.1, LAMP_DROP = lampPivotY - LAMP_Y;
    await tick();
    const lanterns = [];
    { const lb = makeBatch(); buildLantern(lb, LAMP_DROP); const lg = lb.build();
      for (const q of LAMPS) { const g = new THREE.Group(); g.position.set(q[0], lampPivotY, q[1]); const m = new THREE.Mesh(lg, vestMat); m.frustumCulled = false; g.add(m); scene.add(g); lanterns.push(g); } }
    await tick();

    // ------------------------------------------------------------------ windows: panes and gauze
    const PU = { uTime: HU.uTime, uCamL: HU.uCamL, uStain: { value: LK.stain }, uSnow: { value: LK.snow }, uStar: { value: LK.star },
      uSkyTop: { value: V3(LK.skyTop) }, uSkyBot: { value: V3(LK.skyBot) }, uTree: { value: V3(LK.tree) }, uLattice: { value: V3(LK.lattice) },
      uOrb: { value: new THREE.Vector4(...new THREE.Vector3(LK.orb[0], LK.orb[1], LK.orb[2]).normalize().toArray(), LK.orb[3]) }, uOrbCol: { value: V3(LK.orbCol) },
      uFwPos: { value: [new THREE.Vector3(80, 30, 0), new THREE.Vector3(-80, 30, 0)] }, uFwCol: { value: [new THREE.Vector3(), new THREE.Vector3()] }, uFwAge: { value: new THREE.Vector2(-1, -1) },
      uFwRad: { value: new THREE.Vector2(17, 17) } };
    {
      const pos = [], win = [], idx = [];
      A.windows.forEach((w, i) => {
        const sx = w.position.x > 0 ? 1 : -1, x = sx * (35 + 1.55), z = w.position.z, base = pos.length / 3;
        pos.push(x, 8.9, z - 6.1, x, 8.9, z + 6.1, x, 27.7, z + 6.1, x, 27.7, z - 6.1);
        for (let k = 0; k < 4; k++) win.push(sx, z, i);
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWin', new THREE.Float32BufferAttribute(win, 3)); g.setIndex(idx);
      scene.add(meshOf(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...PU }, vertexShader: PANE_VERT, fragmentShader: PANE_FRAG, fog: true, side: THREE.DoubleSide })));
    }
    const softU = { uAmb: HU.uAmb, uWinFill: HU.uWinFill, uFlame: HU.uFlame, uLit: HU.uLit, uGain: HU.uGain, uWinGain: HU.uWinGain };
    {
      const pos = [], ac = [], idx = [], NU = 8, NV = 12, crng = rng.fork('gauze');
      A.windows.forEach((w) => {
        const sx = w.position.x > 0 ? 1 : -1, zc = w.position.z;
        for (const e of [-1, 1]) {
          const ph = crng(), base = pos.length / 3;
          for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
            const s = i / NU, v = j / NV;
            pos.push(sx * 34.3, lerp(28.2, 0.2, v), zc + e * lerp(7.6, 4.3, s)); ac.push(sx, ph, v, s);
          }
          for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, c = a + NU + 1; idx.push(a, a + 1, c + 1, a, c + 1, c); }
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 4)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...softU, uTime: HU.uTime, uWinTop: HU.uWinTop, uWinBot: HU.uWinBot, uGauze: { value: V3(LK.gauze) }, uBack: { value: LK.back },
        uBurstPos: HU.uBurstPos, uBurstCol: HU.uBurstCol },
        vertexShader: CURT_VERT, fragmentShader: CURT_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });
      scene.add(meshOf(g, mat, 0.6));
    }
    // shafts through the dust where a hard light comes in (the sun at noon, the moon): only the west windows carry them
    {
      const D = HU.uBeamDir.value[0], pos = [], as = [], idx = [];
      const head = (zb) => 27.5 - 5.5 * (zb * zb / 36);
      const sheet = (w0, w1, id) => {              // two points of the pane; the sheet runs from them down the beam to the floor
        const base = pos.length / 3;
        for (const [k, w] of [[0, w0], [1, w1]]) { const t = (w[1] - 0.06) / D.y;
          pos.push(w[0], w[1], w[2], w[0] - D.x * t, 0.06, w[2] - D.z * t); as.push(k, 0, id, k, 1, id); }
        idx.push(base, base + 1, base + 3, base, base + 3, base + 2);
      };
      A.windows.forEach((w, wi) => {
        if (w.position.x > 0) return;
        const zc = w.position.z, x = -34.9;
        [-4.6, -2.3, 0, 2.3, 4.6].forEach((zb, i) => sheet([x, 9.3, zc + zb], [x, head(zb) - 0.4, zc + zb], wi * 9 + i));
        [12.5, 17.5, 22].forEach((y, i) => sheet([x, y, zc - 5.4], [x, y, zc + 5.4], wi * 9 + 5 + i));
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 3)); g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), uTime: HU.uTime, uCamL: HU.uCamL, uStain: { value: LK.stain }, uShaftCol: { value: V3(LK.shaft || [0, 0, 0]) } },
        vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const m = meshOf(g, mat, 5.5); m.visible = !!LK.shaft; scene.add(m);
    }
    await tick();

    // ------------------------------------------------------------------ furnishings, in the hall's own light
    const propMat = hero.makeMaterial({ MM_PROP: 1 });
    const pb = makeBatch();
    const spots = await addFurnishings(pb, rng.fork('furnish'), tick);
    await tick();
    // bubbler nozzles: twenty low jets in two lines, none in the basin
    const jets = [];
    for (const sx of [-1, 1]) for (const z of [-112, -94, -76, -58, -40, 40, 58, 76, 94, 112]) {
      jets.push([sx * 8.6, z]);
      pb.add(lathe([[0, 0.12], [0.2, 0.12], [0.34, 0.02], [0.62, -0.02], [0.7, -0.1]], 10), { p: [sx * 8.6, WATER_Y, z], kind: 4, col: SILVER, us: 4, vs: 2 });
    }
    await tick();
    // little brass lamps afloat on both arms of the pool (none in the basin: the water round the globe stays dark)
    const floats = [];
    { const frng = rng.fork('floats');
      for (let i = 0; i < 14; i++) {
        const arm = i < 5 ? -1 : 1, k = arm < 0 ? i / 5 : (i - 5) / 9;
        const z = arm < 0 ? lerp(-118, -52, k + 0.1 * frng()) : lerp(40, 121, k + 0.06 * frng()), x = (frng() - 0.5) * 13;
        floats.push([x, z]);
        pb.add(lathe([[0, 0.02], [0.34, 0.04], [0.56, 0.2], [0.6, 0.34], [0.5, 0.3], [0.3, 0.14], [0, 0.12]], 9), { p: [x, WATER_Y - 0.05, z], kind: 4, col: BRASS, us: 4, vs: 2, bob: 0.03, phase: i * 1.7 });
        pb.add(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 5), { p: [x, WATER_Y + 0.25, z], kind: 9, col: WHITE, bob: 0.03, phase: i * 1.7 });
      } }
    await tick();
    scene.add(meshOf(await pb.buildInSteps(tick), propMat));
    await tick();
    // the tall vases either side of every window: two are built and set out turned differently
    { const vg = [];
      for (let k = 0; k < 2; k++) { const vb = makeBatch(); await addVase(vb, rng.fork('vase' + k), 0, 0, tick); await tick(); vg.push(vb.build()); await tick(); }
      spots.vases.forEach(([x, z], i) => { const m = new THREE.Mesh(vg[(i + (i >> 2)) & 1], propMat); m.frustumCulled = false; m.position.set(x, 0, z); m.rotation.y = i * 2.1; scene.add(m); }); }
    await tick();
    // the rose alcoves: one geometry, set against both flanks of every pier; nightingales at four of them
    const ALCOVES = [];
    for (const zb of [-90, -30, 30, 90]) for (const sx of [-1, 1]) for (const e of [-1, 1]) ALCOVES.push([sx * 32, zb + e * 3, e]);
    { const ab = makeBatch(); await buildAlcove(ab, rng.fork('alcove'), tick); await tick();
      const ag = await ab.buildInSteps(tick);
      const nb = makeBatch();
      addNightingale(nb, -2.0, 3.62, 1.75, 0.8, 0.5, true); addNightingale(nb, 1.9, 3.62, 1.7, -1.1, 2.1, false); addNightingale(nb, -1.3, 13.95, 1.0, 0.3, 4.2, false);
      await tick();
      const ng = nb.build();
      for (const [x, z, e] of ALCOVES) {
        const m = new THREE.Mesh(ag, propMat); m.frustumCulled = false; m.position.set(x, 0, z); m.rotation.y = e > 0 ? 0 : Math.PI; scene.add(m);
        const hero2 = (x > 0 && z === -27) || (x < 0 && z === 27) || (x < 0 && z === -87) || (x > 0 && z === 87);
        if (hero2) { const n2 = new THREE.Mesh(ng, propMat); n2.frustumCulled = false; n2.position.copy(m.position); n2.rotation.y = m.rotation.y; scene.add(n2); }
      }
    }
    await tick();
    // settled doves on the chain collar and the cornice (they arrive with the flock, see update)
    const perched = new THREE.Group(), perchedB = new THREE.Group();
    {
      const b1 = makeBatch(), b2 = makeBatch(), prng = rng.fork('perch');
      for (let i = 0; i < 8; i++) { await tick(); const a = i / 8 * TAU + 0.2; addPerched(i < 4 ? b2 : b1, Math.cos(a) * 1.25, A.perchY, Math.sin(a) * 1.25, -a + Math.PI / 2 + (prng() - 0.5), prng() * 6); }
      for (const [x, z] of [[28.4, -29], [28.4, -31.2], [-28.4, 29.4], [-28.4, 31], [28.4, 30.2], [-28.4, -30.4]]) { await tick(); addPerched(b1, x, 16.6, z, x > 0 ? -Math.PI / 2 : Math.PI / 2, prng() * 6); }
      await tick();
      perched.add(meshOf(b1, propMat)); perchedB.add(meshOf(b2, propMat));
      perched.visible = perchedB.visible = false;
      scene.add(perched, perchedB);
    }

    await tick();

    // ------------------------------------------------------------------ petals on the pool, a few falling
    const nPetals = Math.round(430 * detail * density), nFall = Math.round(70 * detail);
    {
      const prng = rng.fork('petals'), iP = new Float32Array((nPetals + nFall) * 4), iQ = new Float32Array((nPetals + nFall) * 4);
      for (let i = 0; i < nPetals + nFall; i++) {
        const fall = i >= nPetals; let x = 0, z = 0;
        for (let k = 0; k < 8; k++) {
          z = prng.range(-124, 124); const lim = clamp(35.355 - Math.abs(z), 11, 25) - 1;
          x = prng.range(-lim, lim);
          if (fall || Math.hypot(x, z) > 16 || prng() < 0.1) break;         // keep the water round the globe dark and calm
        }
        if (!fall && prng() < 0.5) { const cl = prng.range(0, 1); x *= 0.6 + 0.4 * cl; }
        iP.set([x, z, prng(), prng.range(0.42, 0.78) * (fall ? 0.8 : 1)], i * 4);
        iQ.set([fall ? 1 : 0, prng.range(0.2, 0.9), prng.range(-0.25, 0.25) * (fall ? 6 : 1), prng()], i * 4);
      }
      const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4));
      g.instanceCount = nPetals + nFall;
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...softU, uTime: HU.uTime, uCamL: HU.uCamL }, vertexShader: PETAL_VERT, fragmentShader: PETAL_FRAG, fog: true, side: THREE.DoubleSide });
      scene.add(meshOf(g, mat));
    }
    await tick();
    // bubbler jets with their rings, steam off the tea, the taper's thread of smoke
    {
      const wrng = rng.fork('wisps'), W = [], K = [];
      for (const [x, z] of jets) { const ph = wrng(); W.push(x, WATER_Y + 0.05, z, ph); K.push(0, 1.5, 0, 0);
        for (let k = 0; k < 2; k++) { W.push(x, WATER_Y + 0.03, z, ph + k * 0.5); K.push(1, 0.9, 0.22, 0); } }
      for (const sp of spots.steam) for (let k = 0; k < 5; k++) { W.push(sp[0], sp[1], sp[2], wrng()); K.push(2, 0.75, 0.16 + 0.06 * wrng(), 3.4); }
      for (let k = 0; k < 9; k++) { W.push(spots.taper[0], spots.taper[1] + 0.15, spots.taper[2], k / 9 + 0.03 * wrng()); K.push(2, 0.55, 0.11, 8.5); }
      const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
      g.setAttribute('iW', new THREE.InstancedBufferAttribute(new Float32Array(W), 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(new Float32Array(K), 4));
      g.instanceCount = W.length / 4;
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...softU, uTime: HU.uTime, uCamL: HU.uCamL }, vertexShader: WISP_VERT, fragmentShader: WISP_FRAG, fog: true,
        side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
      scene.add(meshOf(g, mat, 5));
    }
    await tick();

    // ------------------------------------------------------------------ creatures
    const time = { value: 0 };
    const birdLight = { sunDir: [0.1, 0.9, -0.2], sunColor: '#F2F8FF', sunIntensity: 1.5 * LK.bird, sky: '#9fb6d6', skyIntensity: 0.8 * LK.bird, ground: '#8FE3C0', groundIntensity: 0.5 * LK.bird };
    const plumage = swallows
      ? { species: 'swifts', size: 4, body: '#7f9ab8', belly: '#f2f6f8', wingC: '#58728f', trail: '#7d97b3', tip: '#33465c', head: '#5d7896', glide: 0.35, flap: 5.5 }
      : { species: 'gulls', size: 2.3, body: '#f1f3f4', belly: '#ffffff', wingC: '#e9edf0', trail: '#f4f6f8', tip: '#cfd6dc', beak: '#c9a9a0', head: '#f8fafb', glide: 0.14, flap: 4.2 };
    // the first flight: off the left rim, across the pool ahead of the camera, round the east side and up into dome 3,
    // then down onto the chain collar. Keyed to u (the route's clock is (u - DOVE_U) x duration).
    const DOVE_V = 15, DOVE_U = U_DOOR + 0.008;
    const flockA = F.makeFlock({ rng: rng.fork('doves'), ...plumage, count: swallows ? 12 : 16, speed: DOVE_V, form: 'loose', spread: [2.6, 1.5, 9], wander: [1.0, 0.6, 1.0, 0.5], amp: 0.78,
      route: [[-21, 1.7, -109], [-12, 2.1, -101], [-1, 2.6, -95.5], [10, 4.5, -89], [20, 10, -78], [24.5, 16, -62], [22, 19, -45], [14, 21, -30], [8, 26, -16], [-6, 28.5, -10],
        [-13, 28.5, 3], [-6, 27, 13], [6, 25, 10], [8, 22.5, 2], [3, A.perchY + 1.2, -1]], closed: false, start: 0, light: birdLight });
    flockA.object.visible = false; scene.add(flockA.object);
    await tick();
    const TA = (flockA.route ? flockA.route.length : 205) / DOVE_V;
    // the second: four leave the collar as the orbit passes and wheel round the chain
    const U_B = U_CROWN - 0.125;
    const flockB = F.makeFlock({ rng: rng.fork('doves-b'), ...plumage, count: 4, speed: 11.5, form: 'loose', spread: [1.6, 1.0, 5], wander: [0.8, 0.5, 0.8, 0.5], amp: 0.8,
      route: [[1, A.perchY + 0.9, 1], [-2.5, 24, 5], [-7, 29, 7], [-10, 34, 1], [-8, 37, -7], [-1, 39, -10], [7, 40, -6], [9, 41, 2], [4, 42, 8], [-4, 42.5, 8], [-8, 43, 1], [-5, 43.5, -6], [2, 44, -8]],
      closed: false, start: 0, light: birdLight });
    flockB.object.visible = false; scene.add(flockB.object);
    await tick();
    const TB = (flockB.route ? flockB.route.length : 150) / 11.5;
    const flit = F.makeFlock({ rng: rng.fork('flit'), species: 'gulls', size: 1.5, body: '#8a6c44', belly: '#e0cca4', wingC: '#70583a', trail: '#84683e', tip: '#3c2c1a', beak: '#b08a40', head: '#806240', glide: 0.05, flap: 7.5,
      count: 3, speed: 6.5, form: 'loose', spread: [0.8, 0.6, 5], wander: [0.5, 0.5, 0.5, 0.9], amp: 0.95,
      route: [[28.6, 8.2, -24.2], [30, 10.8, -21.2], [32.6, 11.6, -21.8], [33.3, 9, -24.4], [31, 6.4, -23.4], [29.2, 6.6, -21.6], [28.2, 8.6, -20.8], [27.8, 9.6, -22.6]], closed: true, start: 0,
      light: { sunDir: [-0.5, 0.6, 0.6], sunColor: '#FFD9A0', sunIntensity: 2.2, sky: '#E8D0A0', skyIntensity: 1.0, ground: '#A06030', groundIntensity: 0.7 } });
    scene.add(flit.object);
    await tick();
    const koiVar = pickKoi < 0.3 ? [['#f4f7f9', '#eef2f4']] : pickKoi < 0.65 ? [['#b4bfca', '#e4eaf0']] : [['#f2f4f4', '#14171c'], ['#f4f6f6', '#eef0f0']];
    const koiSeed = Math.floor(rng.fork('koi-school')() * 1e9) + 1;
    const KOI_Y = -0.7;        // just under the surface: their backs break it, so they read from the waterline too
    const koiOpts = (shadow) => ({ rng: ctx.core.makeRng(koiSeed), species: 'koi', count: 14, size: 4.1, center: [0, KOI_Y, 0], spread: [17, 0.1], speed: 0.9,
      varieties: shadow ? [['#000000', '#000000']] : koiVar, caustics: shadow ? 0 : 0.15,
      light: shadow ? { sunDir: [0, 1, 0], sunColor: '#000000', sunIntensity: 0, sky: '#000000', skyIntensity: 0, ground: '#000000', groundIntensity: 0 }
        : { sunDir: [0, 1, 0], sunColor: '#F2F8FF', sunIntensity: 3.2 * LK.bird, sky: '#8FE3C0', skyIntensity: 1.3 * LK.bird, ground: '#1C3556', groundIntensity: 0.7 } });
    const koi = F.makeFishSchool(koiOpts(false));
    await tick();
    const koiShade = F.makeFishSchool(koiOpts(true));
    koiShade.object.scale.set(1.08, 0.03, 1.08); koiShade.object.position.set(0.5, A.pool.floorY + 0.08 - KOI_Y * 0.03, 0.35);
    scene.add(koiShade.object);
    // both are drawn over the water (set here, before anything is compiled): the pale fish read from every height, and
    // each drags a darker shape over the basin floor beneath it
    koi.material.transparent = true; koi.object.renderOrder = 1.5;
    { const sm = koiShade.material; sm.transparent = true; sm.depthWrite = false; sm.blending = THREE.CustomBlending;
      sm.blendSrc = THREE.ConstantAlphaFactor; sm.blendDst = THREE.OneMinusConstantAlphaFactor; sm.blendAlpha = 0.5; koiShade.object.renderOrder = 1.2; }
    // by day and in the snow a white peacock walks the pool's -x rim ahead of the skim, in the middle of the frame as the
    // doors are cleared; its mate paces the same rim of the far arm, to the right of the low run to the niche
    const peacock = new THREE.Group(), peahen = new THREE.Group(); peacock.visible = peahen.visible = lookName === 'noon' || lookName === 'snow';
    // their own copy of the hall material with a stronger ambient (the same program), so they read ghost-white in the dim
    // parts of the hall as the doves do
    const fowlMat = hero.makeMaterial({ MM_PROP: 1 });
    fowlMat.uniforms.uAmb = { value: V3(lookName === 'noon' ? [0.5, 0.56, 0.6] : [0.4, 0.48, 0.6]) };
    { const kb = makeBatch(); addPeacock(kb, rng.fork('peacock')); const pm = meshOf(kb, fowlMat); peacock.add(pm);
      const pm2 = new THREE.Mesh(pm.geometry, fowlMat); pm2.frustumCulled = false; peahen.add(pm2); }
    peacock.position.set(-11.7, 0.38, -91); peacock.scale.setScalar(1.15); peahen.position.set(-11.7, 0.38, 85); peahen.rotation.y = Math.PI; peahen.scale.setScalar(0.9);
    scene.add(peacock, peahen);
    await tick();
    scene.add(koi.object);
    await tick();
    const moths = F.makeMoths({ rng: rng.fork('moths'), count: 10, size: 3.6, positions: [[LAMPS[1][0], LAMP_Y, LAMPS[1][1]], [LAMPS[2][0], LAMP_Y, LAMPS[2][1]]], jitter: 1.5, roam: [2.3, 1.5, 1.3, 0.07], selfLit: 0.9,
      light: { sunDir: [0, 1, 0], sunColor: '#FFE2B8', sunIntensity: 1.3, sky: '#C9D6E2', skyIntensity: 0.8, ground: '#4A4640', groundIntensity: 0.4 } });
    scene.add(moths.object);
    await tick();

    // ------------------------------------------------------------------ motes, lamp glows, the moonlit tray
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(1500 * detail), box: [46, 28, 46], colors: ['#C9D6E2', '#8FE3C0', '#F2F8FF'] });
    scene.add(dust.object);
    await tick();
    const moon = lookName === 'moon', lampPos = new THREE.Vector3(), GLOW_OF = [0, 6, 7, 8];
    const lp = (i) => [LAMPS[i][0], LAMP_Y, LAMPS[i][1]];
    const glows = fx.makeGlows({ rng: rng.fork('glows'), time, positions: [lp(0), [spots.taper[0], spots.taper[1] + 0.05, spots.taper[2]], [3.6, 0.4, -100], [3.6, -1.5, -100], [-3.6, 0.4, 60], [-3.6, -1.5, 60], lp(1), lp(2), lp(3)],
      colors: [lampHex, '#dff4ff', '#F2F8FF', '#cfe4ff', '#F2F8FF', '#cfe4ff', lampHex, lampHex, lampHex],
      sizes: [5.5, 0.9, moon ? 5 : 0.001, moon ? 3.4 : 0.001, moon ? 5 : 0.001, moon ? 3.4 : 0.001, 5.5, 5.5, 5.5], size: 1, intensity: 1.5, flicker: 0.25 });
    scene.add(glows.object);
    await tick();
    { const gp = [], gs = [], gc = [];
      for (const [x, z, e] of ALCOVES) { gp.push([x, 10.4, z + e * 0.85]); gs.push(3.4); gc.push('#FFB45E'); }
      for (const [x, z] of floats) { gp.push([x, WATER_Y + 0.62, z], [x, WATER_Y - 0.7, z]); gs.push(1.7, 1.15); gc.push('#FFC878', '#E89A48'); }
      const lamps2 = fx.makeGlows({ rng: rng.fork('glows2'), time, positions: gp, colors: gc, sizes: gs, size: 1, intensity: 1.25, flicker: 0.18 });
      scene.add(lamps2.object); }
    await tick();
    const trays = [];
    if (moon) {
      const tb = makeBatch();
      tb.add(lathe([[0, 0.02], [0.95, 0.02], [1.15, 0.24], [1.2, 0.24], [1.0, 0.08], [0, 0.08]], 14), { p: [0, 0, 0], kind: 4, col: SILVER, us: 6, vs: 2 });
      tb.add(new THREE.CylinderGeometry(0.11, 0.13, 0.55, 6), { p: [0, 0.36, 0], kind: 6, col: [0.8, 0.82, 0.8] });
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; tb.add(new THREE.SphereGeometry(1, 6, 4), { p: [Math.cos(a) * 0.6, 0.14, Math.sin(a) * 0.6], s: [0.22, 0.07, 0.3], r: [0, -a, 0], kind: 0, col: [0.8, 0.84, 0.82] }); }
      const t0 = meshOf(tb, propMat), t1 = new THREE.Mesh(t0.geometry, propMat); t1.frustumCulled = false;
      trays.push(t0, t1); scene.add(t0, t1);
    }

    // ------------------------------------------------------------------ the rare event: fireworks in the garden
    // Two shells are always in the air, 0.8 s apart (each rises over 0.2 s and fades over 1.2 s, so one is near its
    // peak at any moment). Each opens behind a pane the camera is looking at: the ten windows are scored by how near the
    // middle of the view they are and how squarely they are seen, and the burst is sized to fill most of that pane.
    const FW_PERIOD = 0.8, fwCols = ['#FFC45C', '#FF4E62', '#5CE8A0', '#6C9CFF', '#FFE9C4'].map((h) => new THREE.Color(h));
    const fwSlot = [{ idx: -1e9, win: -1 }, { idx: -1e9, win: -1 }], fwSeed = rng.fork('fireworks')() * 100;
    const fh = (n, k) => { const s = Math.sin((n + fwSeed) * (127.1 + k * 31.7) + k * 11.3) * 43758.5453; return s - Math.floor(s); };
    const camP = new THREE.Vector3(), camD = new THREE.Vector3(), fwV = new THREE.Vector3(), fwE = new THREE.Vector3(), fwA = new THREE.Vector3();
    const winPts = A.windows.map((w) => [w.position.x > 0 ? 1 : -1, w.position.z]);
    const fireworks = (t, u, camera) => {
      const tt = t + 0.35, n = Math.floor(tt / FW_PERIOD), on = rare && u > U_DOOR - 0.03;
      camera.getWorldDirection(camD);
      for (let k = 0; k < 2; k++) {
        const idx = n - k, slot = ((idx % 2) + 2) % 2, st = fwSlot[slot], age = tt - idx * FW_PERIOD;
        if (st.idx !== idx || st.cx === undefined || Math.abs(camP.z - st.cz) + Math.abs(camP.x - st.cx) + Math.abs(camP.y - st.cy) > 32) {
          st.idx = idx; st.cx = camP.x; st.cy = camP.y; st.cz = camP.z;
          let best = -1e9, bw = 0;
          for (let i = 0; i < winPts.length; i++) {
            fwV.set(winPts[i][0] * 36.5, 18, winPts[i][1]).sub(camP); const d = fwV.length(); fwV.multiplyScalar(1 / Math.max(d, 1e-3));
            const cosA = fwV.dot(camD);
            let sc = cosA * 2.2 + Math.abs(fwV.x) * 1.3 - d * 0.004 + 0.3 * fh(idx, i + 5);
            if (cosA < 0.6) sc -= 3; if (d < 16) sc -= 3; if (i === fwSlot[1 - slot].win) sc -= 0.7;
            if (sc > best) { best = sc; bw = i; }
          }
          st.win = bw;
          // where the eye will be when the shell is at its peak, so the burst sits in the pane then
          path.pointAt(Math.min(1, u + 0.35 / DUR), fwE); path.pointAt(u, fwA); fwE.sub(fwA).add(camP);
          fwV.set(winPts[bw][0] * 36.6, 16 + 4 * fh(idx, 2), winPts[bw][1] + (fh(idx, 3) - 0.5) * 2).sub(fwE);
          const d = Math.max(fwV.length(), 1), k2 = (d + 26) / d;
          PU.uFwPos.value[slot].copy(fwE).addScaledVector(fwV, k2);
          PU.uFwRad.value.setComponent(slot, 5.3 * k2);
          HU.uBurstPos.value[slot].copy(PU.uFwPos.value[slot]);
          st.col = fwCols[Math.floor(fh(idx, 4) * fwCols.length) % fwCols.length];
        }
        const env = on ? sstep(age, 0, 0.2) * (1 - sstep(age, 0.3, 1.5)) : 0, c = st.col;
        PU.uFwAge.value.setComponent(slot, on ? age : -1);
        PU.uFwCol.value[slot].set(c.r * 3, c.g * 3, c.b * 3);
        HU.uBurstCol.value[slot].set(c.r * env * 2.5, c.g * env * 2.5, c.b * env * 2.5);
      }
    };

    // ------------------------------------------------------------------ frame
    const bell = new THREE.Vector3(0, 5, 0), ball = new THREE.Vector3(0, 0.5, 0), seat = A.portalSeat.position.clone();
    const glass = new THREE.Vector3(-36.3, 18.2, -60), lesser = new THREE.Vector3(0, 35, 120);
    // one moving target for the middle of the journey: the bell from above, up the chain into the crown of the dome,
    // across to the rose alcove of the east pier, along the wall to the next window, down to the globe at the waterline
    const tour = (tt, uu) => {
      const a = sstep(uu, U_ABOVE + 0.02, U_CROWN - 0.022), c = sstep(uu, U_CROWN + 0.02, U_ALC - 0.03), w = sstep(uu, U_ALC + 0.006, U_ALC + 0.04), d = sstep(uu, U_ALC + 0.034, U_SOUTH - 0.004);
      bell.set(0, lerp(5, 44, a), 0);
      bell.x = lerp(bell.x, 32, c); bell.y = lerp(bell.y, 8, c); bell.z = lerp(bell.z, -25.6, c);
      bell.x = lerp(bell.x, 36, w); bell.y = lerp(bell.y, 16, w); bell.z = lerp(bell.z, -1, w);
      bell.x = lerp(bell.x, 0, d); bell.y = lerp(bell.y, WATER_Y + 1, d); bell.z = lerp(bell.z, 0, d);
      return bell;
    };
    const eul = new THREE.Euler();
    const bellW = (x, a, b, f) => { const w = (b - a) * f; return sstep(x, a, a + w) * (1 - sstep(x, b - w, b)); };
    return {
      scene, path, duration: DUR, title: LK.title,
      // linger a little in the dark, at the threshold, before the stained window, at the alcove and at the waterline;
      // quicker on the climbs between; the last tenth runs at the even pace
      pace: (uu) => (0.8 + 0.2 * sstep(uu, 0.02, U_DOOR)) * (1 - 0.16 * bellW(uu, U_DOOR - 0.01, U_DOOR + 0.06, 0.3)) * (1 - 0.2 * bellW(uu, U_WIN - 0.04, U_WIN + 0.045, 0.35))
        * (1 + 0.14 * bellW(uu, U_WIN + 0.04, U_CROWN - 0.03, 0.35)) * (1 - 0.22 * bellW(uu, U_ALC - 0.04, U_ALC + 0.035, 0.35)) * (1 - 0.2 * bellW(uu, U_SOUTH - 0.04, U_SOUTH + 0.04, 0.3)),
      camera: { fov: 56, near: 0.3, far: 900, lookAhead: 20, sway: 0.6, bank: 0.25 },     // a low bank keeps the waterline frame level
      pois: [
        { at: ball, from: U_DOOR - 0.05, to: U_DOOR + 0.085, weight: 0.85 },         // the doors open on the globe, dead centre
        { at: glass, from: U_WIN - 0.07, to: U_WIN + 0.062, weight: 0.8 },          // the sunward stained window, square on
        { at: tour, from: U_WIN + 0.032, to: U_SOUTH + 0.07, weight: 0.92, fade: 0.1 },   // bell, crown, alcove, waterline
        { at: seat, from: U_SOUTH + 0.045, to: 0.92, weight: 0.6, fade: 0.12 },     // then the niche, which never leaves the frame
        { at: lesser, from: 0.73, to: 0.86, weight: 0.42 },                         // the lesser chandelier over the far arm
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: PALETTE[3], glow: 0.55, revealDistance: 210 },
      post: { exposure: LK.exposure, bloom: { strength: LK.bloom, radius: 0.6, threshold: 1.1 },
        grade: { saturation: LK.sat, contrast: 1.05, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.38, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        camP.setFromMatrixPosition(camera.matrixWorld);
        // the leaves swing inward: ajar while the world is only a view in the last portal (u = 0), wide by the threshold
        const th = lerp(0.44, 1.75, sstep(u, U_OPEN0, U_OPEN1));
        doorL.rotation.y = -th; doorR.rotation.y = th;
        VU.uBlade.value.x = Math.min(9, LEAF_W * (1 - Math.cos(th)));
        hero.setProgress(0.055 + (u - U_OPEN0) * 0.065 / (U_OPEN1 - U_OPEN0));
        fireworks(t, u, camera);
        hero.update(dt, t, camera);
        // the lanterns swing on their chains, out of step; their light and their glows go with them
        for (let i = 0; i < lanterns.length; i++) {
          eul.set(0.04 * Math.sin(t * 0.61 + 1 + i * 1.9), 0, 0.055 * Math.sin(t * 0.83 + i * 2.3));
          lanterns[i].rotation.copy(eul);
          lampPos.set(0, -LAMP_DROP, 0).applyEuler(eul).add(lanterns[i].position);
          VU.uLamps.value[i].set(lampPos.x, lampPos.y, lampPos.z, LAMP_GAIN[i]);
          glows.setPosition(GLOW_OF[i], lampPos.x, lampPos.y, lampPos.z);
        }
        VU.uLampPhase.value = 0.22 * Math.sin(t * 0.83) + t * 0.04;
        for (let i = 0; i < trays.length; i++) {      // moonlight: a small lamp on a tray drifts down each arm of the pool
          const tx = (i ? -3.6 : 3.6) + 1.2 * Math.sin(t * 0.21 + i * 2), zz = (i ? 44 : -112) + 66 * clamp(u * 1.05 + 0.04 * Math.sin(t * 0.13 + i), 0, 1);
          const bobY = 0.02 * Math.sin(t * 1.3 + i);
          trays[i].position.set(tx, WATER_Y - 0.04 + bobY, zz); trays[i].rotation.y = t * 0.12 + i;
          glows.setPosition(2 + i * 2, tx, WATER_Y + 0.85 + bobY, zz); glows.setPosition(3 + i * 2, tx + 0.1 * Math.sin(t * 1.7), WATER_Y - 0.95, zz);
        }
        // doves: both flights are keyed to the journey
        const tA = (u - DOVE_U) * DUR, tB = (u - U_B) * DUR;
        flockA.object.visible = tA > 0 && tA < TA * 1.1;
        flockA.update(dt, clamp(tA, 0, TA * 1.1), camera);
        flockB.object.visible = tB > 0 && tB < TB * 1.1;
        flockB.update(dt, clamp(tB, 0, TB * 1.1), camera);
        perched.visible = !swallows && tA > TA - 0.5;
        perchedB.visible = perched.visible && tB < 0.25;
        koi.update(dt, t, camera, u); koiShade.update(dt, t, camera, u); moths.update(dt, t, camera, u); flit.update(dt, t, camera, u);
        peacock.position.z = -91 + 40 * (u - 0.16); peacock.position.x = -11.7 + 0.1 * Math.sin(u * 30); peacock.rotation.y = 0.05 * Math.cos(u * 30);
        peahen.position.z = 86 - 22 * (u - 0.79); peahen.position.x = -11.7 + 0.1 * Math.sin(u * 30 + 2);
        dust.update(dt, t, camera); glows.update(dt, t, camera);
      },
      dispose() {},
    };
  },
};
