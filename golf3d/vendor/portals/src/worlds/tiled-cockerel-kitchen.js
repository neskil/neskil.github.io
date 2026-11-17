// THE COCKEREL WALL (tiled-cockerel-kitchen)
// First light in a Portuguese palace kitchen five times life size on an L plan, tiled floor to vault in green, yellow
// and manganese on tin white. The hero (src/parts/tiled-cockerel-kitchen.js) is every wall, the floor and the two flocks
// of flying tiles; this file adds the vault, arches, chimney cones, hearth and cartouche (tiled with the hero's own
// material), the stone work table with its coppers, lemons and cat, the door, its linen curtain and the courtyard,
// the masons' scaffolds, the working kitchen (two plank tables of bread and bowls, a painted dresser of plates, hanging
// rails, water troughs, oil jars, baskets of lemons and oranges, flour sacks), steam, light columns, motes, swallows,
// and the flight.
// Space is the brief's: x east, z south, y up. Long arm x -32.5..32.5, z 40..-395; short arm z -330..-395, x 32.5..282.5.
// Flight: enter at (-6,16,2) heading at the cockerel on the mural wall (he fills half the frame, u 0-0.03), the prep
// table and the wall's foot full of jars, baskets, sacks and a running trough below -> close pass along the glaze as his
// sickle plumes slide by (u 0.09-0.14; the lemon-bough flock crosses overhead u 0.11-0.23) -> low over the prep table and
// along the stone work table under two rails of hanging coppers, garlic, peppers, hams and herbs: pot u 0.27, lemon bowl
// u 0.35, cat u 0.375 -> he stops at the wall's end, crows and flares while the sun's ray is brushed in (u 0.37-0.415)
// -> his own tiles lift off the wall as one picture (u 0.425-0.46), fold like wings and open mirrored (u 0.46-0.51) while
// the wall behind lets go from the corner back and slides up under the vault as one ribbon (u 0.44-0.50) -> he flies as
// a sheet turned to the eye 55 m ahead of the camera through one wide right turn and down the short arm, the hearth and
// its portal beyond him (u 0.50-0.685); the ribbon rounds the outside of the corner overhead and pours home onto the
// north wall from the far end back (u 0.63-0.75) -> he swings onto the north wall and presses home whole (u 0.685-0.75),
// shakes himself (u 0.745-0.775) and struts on ahead of the camera (u 0.754-0.905) -> swallows cross the path
// (u ~0.72-0.78) -> past the dresser and the laid tables, the cat on her rug and the kettle steaming by the hearth,
// straight into the hearth mouth.
// From the wall's end to the hearth the floor is furnished (dressHall): seven laid plank tables with benches, two
// braziers, the kettle, a second cat.
// First light is keyed in gold from the door round the inner corner (GLSL_KEY in the part): gold at the corner and the
// north end, pearl grey toward the entry, the vault a step darker.
// Looks by seed / ctx.vary.hour: 'cockerel' (first light, four pigments, gold door pool), 'owl' (dusk, manganese and
// yellow; a fire under the great pot, two braziers, the hearth alight and candles on every table: twelve analytic
// fire lights, GLSL_FIRE in the part), 'pheasant' (after rain, green and manganese, white high sun,
// blossom blowing). Rare: the walls wait in bud, every wall lets go at u 0.50-0.70 and comes home in full flower.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as INT from '../kit/interior.js';
import { buildHero, GLSL_KEY, GLSL_FIRE } from '../parts/tiled-cockerel-kitchen.js';

const HALF = 32.5, WALL_H = 42, VR = 47.125, VCY = 7.875;            // vault: segmental, crown at 55 m
const vaultY = (c) => VCY + Math.sqrt(Math.max(VR * VR - c * c, 0));
const vaultS = (c) => VR * Math.asin(Math.max(-1, Math.min(1, c / VR)));
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// finish = [gloss, metal | translucency, kind, sway bias]
const K = { MATTE: 0, COPPER: 1, LEMON: 2, FUR: 3, FAIENCE: 4, STONE: 5, WOOD: 6, LEAF: 7, LIQUID: 8, BRICK: 9, GLOW: 10, LINEN: 11, BREAD: 12 };
const finish = (kind, gloss = 0.1, metal = 0, bias = 0) => [gloss, metal, kind, bias];

// ------------------------------------------------------------------ prop geometry builder (one merged mesh per material)
function makePB() {
  const P = [], N = [], C = [], S = [], W = [], T = [], I = [];
  const m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), col = new THREE.Color(), cc = new THREE.Color();
  return {
    get triangles() { return I.length / 3; },
    add(g, o = {}) {
      const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s === undefined ? [1, 1, 1] : (typeof o.s === 'number' ? [o.s, o.s, o.s] : o.s);
      if (o.m) m4.copy(o.m); else m4.compose(v.set(p[0], p[1], p[2]), q.setFromEuler(e.set(r[0], r[1], r[2])), sc.set(s[0], s[1], s[2]));
      n3.getNormalMatrix(m4);
      const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, gc = g.attributes.color, gs = g.attributes.aFinish, gu = g.attributes.aUv, base = P.length / 3;
      const sf = o.finish || [0.1, 0, 0, 0], us = o.uv || [1, 1], swF = typeof o.sway === 'function' ? o.sway : null, sw = swF ? null : (o.sway || [0, 0, 0]);
      col.set(o.c || '#ffffff');
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i); const lx = v.x, ly = v.y, lz = v.z;
        v.applyMatrix4(m4); P.push(v.x, v.y, v.z); const x = v.x, y = v.y, z = v.z;
        v.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); N.push(v.x, v.y, v.z);
        cc.copy(col); if (gc) { cc.r *= gc.getX(i); cc.g *= gc.getY(i); cc.b *= gc.getZ(i); }
        if (o.tint) o.tint(x, y, z, cc, lx, ly, lz, v);
        C.push(cc.r, cc.g, cc.b); if (gs) S.push(gs.getX(i), gs.getY(i), gs.getZ(i), gs.getW(i)); else S.push(sf[0], sf[1], sf[2], sf[3]);
        if (swF) { const a = swF(x, y, z, lx, ly, lz); W.push(a[0], a[1], a[2]); } else W.push(sw[0], sw[1], sw[2]);
        if (gu) T.push(gu.getX(i), gu.getY(i)); else if (o.uvf) { const a = o.uvf(x, y, z, lx, ly, lz); T.push(a[0], a[1]); } else T.push(uv ? uv.getX(i) * us[0] : 0, uv ? uv.getY(i) * us[1] : 0);
      }
      if (g.index) { const ix = g.index; for (let i = 0; i < ix.count; i++) I.push(base + ix.getX(i)); } else for (let i = 0; i < pos.count; i++) I.push(base + i);
      g.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aFinish', new THREE.Float32BufferAttribute(S, 4));
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(W, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(T, 2));
      g.setIndex(I); g.computeBoundingSphere();
      return g;
    },
  };
}
// a box with rounded edges (no bare boxes near the camera)
function rbox(w, h, d, r = 0.12) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), pos = g.attributes.position, nor = g.attributes.normal;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, c = new THREE.Vector3(), n = new THREE.Vector3();
  const snap = (a, hh, full) => (Math.abs(a) > full / 6 + 1e-6 ? Math.sign(a) * (full / 2) : Math.sign(a) * hh);
  for (let i = 0; i < pos.count; i++) {
    const x = snap(pos.getX(i), hx, w), y = snap(pos.getY(i), hy, h), z = snap(pos.getZ(i), hz, d);
    c.set(Math.max(-hx, Math.min(hx, x)), Math.max(-hy, Math.min(hy, y)), Math.max(-hz, Math.min(hz, z)));
    n.set(x - c.x, y - c.y, z - c.z);
    if (n.lengthSq() < 1e-10) n.fromBufferAttribute(nor, i); else n.normalize();
    pos.setXYZ(i, c.x + n.x * r, c.y + n.y * r, c.z + n.z * r); nor.setXYZ(i, n.x, n.y, n.z);
  }
  return g;
}
const lathe = (prof, seg = 28) => new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), seg);
// profile length, to give lathe uvs in metres: uv = [2 pi r, length]
const profLen = (prof) => { let l = 0; for (let i = 1; i < prof.length; i++) l += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); return l; };
const tube = (pts, r, seg = 6, ts = 0) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))); return new THREE.TubeGeometry(c, ts || Math.max(4, pts.length * 4), r, seg, false); };

// ------------------------------------------------------------------ tile geometry builder (for hero.tile.material)
function makeTB() {
  const b = { pos: [], nor: [], tan: [], fz: [], band: [] };
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), n = new THREE.Vector3(), t = new THREE.Vector3();
  return {
    get triangles() { return b.pos.length / 9; },
    // a -> b is +frieze.x, a -> d is +frieze.y; hint: a direction the face should look toward; ns: optional per-corner normals
    quad(a, bb, c, d, sa, sb, sc2, sd, band, hint, ns, tg) {
      A.set(bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]); B.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      if (A.lengthSq() < 1e-8) A.set(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
      n.crossVectors(A, B); if (n.lengthSq() < 1e-10) { Cc.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); n.crossVectors(A, Cc); }
      n.normalize(); if (tg) t.set(tg[0], tg[1], tg[2]); else t.copy(A).normalize();
      let flip = false; if (hint && n.x * hint[0] + n.y * hint[1] + n.z * hint[2] < 0) { flip = true; n.negate(); }
      const V = [a, bb, c, d], Sx = [sa, sb, sc2, sd], order = flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
      for (const k of order) {
        b.pos.push(V[k][0], V[k][1], V[k][2]); const nn = ns ? ns[k] : null;
        if (nn) b.nor.push(nn[0], nn[1], nn[2]); else b.nor.push(n.x, n.y, n.z);
        b.tan.push(t.x, t.y, t.z); b.fz.push(Sx[k][0], Sx[k][1]); b.band.push(band);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute('aTan', new THREE.Float32BufferAttribute(b.tan, 3)); g.setAttribute('aFrieze', new THREE.Float32BufferAttribute(b.fz, 2));
      g.setAttribute('aBand', new THREE.Float32BufferAttribute(b.band, 1)); g.computeBoundingSphere();
      return g;
    },
  };
}

// ------------------------------------------------------------------ prop shader: the hero's analytic light on everything that is not tile
const PROP_VERT = /* glsl */`
attribute vec4 aFinish; attribute vec3 aSway; attribute vec2 aUv;
uniform float uTime, uGust; uniform vec4 uCat; uniform vec3 uTailRoot;
varying vec3 vP, vN, vL, vCol; varying vec4 vFinish; varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, nrm = normal;
#ifdef CAT
  // aSway: x breath weight, y ear weight, z metres along the tail (0 = body)
  p += normal * aSway.x * (.5 + .5 * sin(uTime * 1.9)) * .085;
  p.x += aSway.y * uCat.z; p.z += abs(aSway.y) * uCat.z * .5;
  if (aSway.z > 0.) {
    float s = aSway.z, k = max(uCat.x, .02), th = k * s, cs = cos(th), sn = sin(th);
    vec3 off = p - vec3(uTailRoot.x + s, uTailRoot.y, uTailRoot.z);
    vec3 c = uTailRoot + vec3(sn / k, uCat.y * s * s * s * .06, (1. - cs) / k);
    p = c + vec3(-sn * off.z, off.y, cs * off.z);
    nrm = vec3(normal.x * cs - normal.z * sn, normal.y, normal.x * sn + normal.z * cs);
  }
#else
  float ph = dot(position, vec3(.37, .23, .29));
  float sw = sin(uTime * 1.7 * uGust + ph) + .5 * sin(uTime * 2.9 * uGust + ph * 1.7);
  p += aSway * (sw * .5 + aFinish.w);
#endif
  vL = position; vCol = color; vFinish = aFinish; vUv = aUv;
  vec4 wp = modelMatrix * vec4(p, 1.); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * nrm);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PROP_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uAmb, uSky, uDoorCol, uTin, uPigLine, uPigLeaf, uGlare; uniform vec4 uDoor, uChim; uniform vec2 uBounce; uniform vec3 uKey; uniform float uTime, uSide, uWet;
varying vec3 vP, vN, vL, vCol; varying vec4 vFinish; varying vec2 vUv;
#include <fog_pars_fragment>
${GLSL_KEY}${GLSL_FIRE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float n3(vec3 p){ return vnoise(p.xy + p.z * vec2(.413, .271)) * .6 + vnoise(p.yz * 1.1 + p.x * vec2(.317, .593)) * .4; }
vec3 dimple(vec2 p){ vec2 i = floor(p), f = fract(p), id = i; float d1 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + vec2(h21(i + o), h21(i + o + 19.7)) - f; float d = dot(r, r); if (d < d1) { d1 = d; id = i + o; } }
  return vec3(h21(id + 3.1) - .5, h21(id + 7.7) - .5, sqrt(max(d1, 0.))); }
float outdoors(vec3 P){ return step(uDoor.w, P.z) * step(60., P.x); }      // the courtyard south of the door
float poolDoor(vec3 P){
  if (outdoors(P) > .5) return 1.;                               // open sun
  float t = (uDoor.w - P.z) / max(uSun.z, 1e-4);
  if (t < 0.) return 0.;
  vec3 h = P + uSun * t; float e = .3 + t * .02;
  return smoothstep(uDoor.x - e, uDoor.x + e, h.x) * (1. - smoothstep(uDoor.y - e, uDoor.y + e, h.x)) * (1. - smoothstep(uDoor.z - e, uDoor.z + e, h.y)) * step(0., h.y);
}
float poolChim(vec3 P){ return (.72 + .28 * vnoise(P.xz * .22 + uTime * vec2(.35, .5))) * max(1. - smoothstep(6., 10.5, length(P.xz - uChim.xy)), 1. - smoothstep(6., 10.5, length(P.xz - uChim.zw))) * (1. - outdoors(P)); }
vec3 envGloss(vec3 P, vec3 R){
  vec3 g = fireSpec(P, R);
  if (R.z > .02) { float t = (uDoor.w - P.z) / R.z;
    if (t > 0.) { vec3 h = P + R * t; float e = .2 + .012 * t;
      g += uDoorCol * smoothstep(uDoor.x - e, uDoor.x + e, h.x) * (1. - smoothstep(uDoor.y - e, uDoor.y + e, h.x)) * (1. - smoothstep(uDoor.z - e, uDoor.z + e, h.y)) * smoothstep(-e, e, h.y); } }
  if (R.y > .02) {
    vec3 h = P + R * ((95. - P.y) / R.y), h2 = P + R * ((55. - P.y) / R.y);
    float d1 = min(length(h.xz - uChim.xy), length(h.xz - uChim.zw)), d2 = min(length(h2.xz - uChim.xy), length(h2.xz - uChim.zw));
    float open = 1. - smoothstep(13.5, 15.5, d2), disc = 1. - smoothstep(6.3, 7.3, d1);
    g += open * (uGlare * 3.4 * disc + uSky * .5 * (1. - disc));
  }
  if (R.y < -.02) { vec3 h = P + R * (-P.y / R.y); g += (uSunCol * .55 * uKey.z + uGoldCol * .9 * min(uKey.x, 1.)) * poolDoor(h) * (1. - outdoors(h)) + uSky * .6 * poolChim(h); }
  return g;
}
void main(){
  vec2 fwv = fwidth(vUv); float pw = max(max(fwv.x, fwv.y), 1e-4);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 Vd = cameraPosition - vP; float dist = length(Vd); vec3 V = Vd / max(dist, 1e-4);
  float gloss = vFinish.x, metal = vFinish.y, kind = vFinish.z, lod = 1. - smoothstep(30., 90., dist);
  vec3 alb = vCol, q = vL; float trans = 0., rimF = 0.;
  if (kind > 9.5 && kind < 10.5) { gl_FragColor = vec4(vCol, 1.);
    #include <fog_fragment>
    return; }
  if (kind < .5) { alb *= .86 + .28 * mix(.5, n3(q * 1.1) * .6 + n3(q * 5.) * .4, lod); metal = 0.; }
  else if (kind < 1.5) { vec3 d = dimple(vUv * 2.6); N = normalize(N + vec3(d.x, d.y * .6, d.x * d.y * 2.) * .5 * lod);
    alb *= (.74 + .5 * n3(q * .7)) * (.9 + .2 * smoothstep(.1, .5, d.z)); }
  else if (kind < 2.5) { alb *= 1. - .16 * lod * smoothstep(.55, .9, n3(q * 22.)); alb *= .88 + .2 * n3(q * 2.3); metal = 0.; }
  else if (kind < 3.5) { float st = sin(q.z * 4.4 + q.x * 1.3 + 5. * n3(q * 1.05)) + .5 * n3(q * 4.) - .25;
    alb = mix(alb, alb * vec3(.58, .47, .4), smoothstep(.0, .7, st) * .7); alb = mix(alb, vec3(.8, .76, .68), metal * smoothstep(.2, .7, n3(q * .9 + 4.)));
    alb *= (.72 + .56 * vnoise(vec2(q.x * 26. + q.y * 9., q.z * 3. + q.y * 2.))) * (.85 + .3 * n3(q * 7.)); rimF = 1.; metal = 0.; }
  else if (kind < 4.5) {
    if (vUv.y > -50.) { float v = vUv.y, u = vUv.x;
      float d = min(abs(v - .45) - .07, abs(v - .72) - .03);
      d = min(d, abs(v - 1.5 - .32 * sin(u * 2.4)) - .08);
      d = min(d, length(vec2((fract(u * 2.4 / 6.2832 + .25) - .5) * 2.618, v - 1.5)) - .17);
      d = min(d, min(abs(v - 2.3) - .03, abs(v - 2.55) - .08));
      float m = 1. - smoothstep(-pw, pw, d);
      float D = m * (.7 + .4 * (1. - smoothstep(0., .06, -d))) * (.7 + .6 * vnoise(vec2(u * 1.3, v * 14.)));
      alb *= uTin * 1.18 * exp(-D * 1.5 * mix(uPigLeaf, uPigLine, step(1.2, v) * step(v, 1.9))); }
    alb *= .94 + .1 * n3(q * 1.7); metal = 0.; }
  else if (kind < 5.5) { vec2 cs = vec2(9., 5.4), sl = abs(fract(vUv / cs) - .5) * cs; float je = min(cs.x * .5 - sl.x, cs.y * .5 - sl.y);
    float vn = abs(vnoise(vUv * .3 + 3. * vnoise(vUv * .11)) - .5);
    alb *= (.84 + .22 * vnoise(vUv * .22 + floor(vUv / cs) * 7.)) * (.9 + .2 * vnoise(vUv * 6.)) * (1. - .22 * lod * (1. - smoothstep(0., .035, vn)));
    alb *= 1. - .45 * (1. - smoothstep(.03, .06 + pw, je)) * clamp(.08 / pw, 0., 1.);
    alb *= 1. - .18 * lod * smoothstep(.75, .8, vnoise(vec2(vUv.x * .4 + vUv.y * .7, (vUv.y - vUv.x * .6) * 9.)));
    gloss *= .6 + .8 * vnoise(vUv * .5 + 9.) + uWet; metal = 0.; }
  else if (kind < 6.5) { float g = vnoise(vec2(vUv.x * .7, vUv.y * 13.)); alb *= .7 + .55 * g; alb *= .9 + .2 * vnoise(vUv * vec2(.3, 40.)); metal = 0.; }
  else if (kind < 7.5) { alb *= .75 + .5 * n3(q * 2.); trans = metal; metal = 0.; }
  else if (kind < 8.5) { N = normalize(N + vec3(sin(q.x * 4. + uTime * 2.3) + sin(q.z * 9. - uTime * 3.1), 0., sin(q.z * 5. - uTime * 1.9) + sin(q.x * 11. + uTime * 2.7)) * .05); }
  else if (kind < 9.5) { float row = floor(vUv.y / .7), uu = vUv.x + .9 * mod(row, 2.); vec2 bl = abs(vec2(fract(uu / 1.8), fract(vUv.y / .7)) - .5) * vec2(1.8, .7);
    float je = min(.9 - bl.x, .35 - bl.y); alb *= .7 + .6 * h21(vec2(floor(uu / 1.8), row)); alb = mix(alb, alb * 1.7 + .02, (1. - smoothstep(.03, .06 + pw, je)) * clamp(.1 / pw, 0., 1.)); metal = 0.; }
  else if (kind < 11.5) { alb *= mix(1., .93 + .07 * sin(vUv.x * 42.) * sin(vUv.y * 42.), clamp(.04 / pw, 0., 1.));
    alb = mix(alb, uTin * exp(-1.1 * uPigLeaf), (1. - smoothstep(.08, .1 + pw, abs(vUv.y - 1.3))) + (1. - smoothstep(.03, .04 + pw, abs(vUv.y - 1.62))));
    trans = metal; metal = 0.; }
  else { float top = smoothstep(.2, .75, N.y), cut = (1. - smoothstep(.08, .14 + pw, abs(fract(vUv.x * .8 + vUv.y * .3) - .5))) * top;      // bread: crust, flour, slashes
    alb *= .72 + .5 * n3(q * 1.6); alb = mix(alb, vec3(.86, .8, .66), top * .5 * smoothstep(.35, .75, n3(q * 3.1 + 7.)));
    alb = mix(alb, vec3(.83, .66, .38), cut * .9); metal = 0.; }
  // light: door pool, chimney columns of skylight, the pool's bounce, a soft side light from the door, the fires
  float ld = poolDoor(vP), lc = poolChim(vP), reach = min(15. / max(uSun.y, .05), 44.);
  vec3 dc = vec3((uDoor.x + uDoor.y) * .5 - uSun.x * reach, 3., uDoor.w - uSun.z * reach) - vP; float d2 = dot(dc, dc); vec3 Ld = dc * inversesqrt(max(d2, 1e-4));
  vec3 c1 = vP - vec3(uChim.x, 0., uChim.y), c2 = vP - vec3(uChim.z, 0., uChim.w);
  float inside = 1. - outdoors(vP);
  float bounce = inside * uBounce.y * uBounce.x / (d2 + uBounce.x), wells = inside * (170. / (dot(c1, c1) + 170.) + 170. / (dot(c2, c2) + 170.));
  float side = inside * uSide * clamp(dot(N, Ld) * .7 + .3, 0., 1.) / (1. + d2 / 5000.);
  float ao = 1. - .3 * (1. - smoothstep(0., 3.5, vP.y)) * (1. - abs(N.y));
  vec3 light = uAmb * (.6 + .4 * N.y) * ao + uSunCol * (bounce + side + (1. - inside) * .12 * (1. - .5 * smoothstep(0., 30., vP.y)))
    + uDoorCol * inside * 150. / (dot(vP - vec3((uDoor.x + uDoor.y) * .5, 10., uDoor.w - 4.), vP - vec3((uDoor.x + uDoor.y) * .5, 10., uDoor.w - 4.)) + 1500.)
    + uSky * (.22 * wells + (1. - inside) * .3 + clamp(N.y * .75 + .25, 0., 1.) * lc * 1.5) + (fireAt(vP, N) + lampAt(vP)) * inside;
  light = keyLight(light, vP, N, ld, inside);          // first light: the same gold pool, fringe and bounce as on the tiled walls
  light += uSunCol * mix(1., uKey.z, inside) * clamp((dot(N, uSun) + .25) / 1.25, 0., 1.) * ld;
  vec3 R = reflect(-V, N); float ndv = clamp(dot(N, V), 0., 1.), fr = 1. - ndv; fr = fr * fr * fr * fr * fr;
  vec3 env = envGloss(vP, R);
  float sl = max(dot(R, uSun), 0.); sl *= sl; sl *= sl; sl *= sl; sl *= sl;
  vec3 col;
  if (metal > .5) {
    vec3 room = uAmb * (.42 + .3 * R.y) + uSunCol * (.5 * sl * ld + .1 * side) + uSky * .6 * clamp(R.y, 0., 1.) * clamp(R.y, 0., 1.) * lc + fireAt(vP, R) * .8;
    col = alb * light * .22 + min(alb * 2.1, vec3(1.)) * (env * .55 + room) * (.7 + .3 * gloss) + vec3(.9, .95, 1.) * fr * uAmb * .25;
  } else {
    col = alb * light;
    col += alb * uGlare * trans * (kind > 10.5 ? .5 : ld * clamp(-dot(N, uSun), 0., 1.) * 1.5);
    col += env * gloss * (.16 + .84 * fr) + uAmb * gloss * (.02 + .5 * fr) + uSunCol * gloss * sl * sl * ld * 1.5;
    col += alb * uAmb * rimF * .35 * (1. - ndv) * (1. - ndv);
  }
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ architecture in the hero's tile material
// Two barrel vaults (long arm along -z, short arm along +x), each pierced by a 30 m chimney hole, transverse arches whose
// soffits carry the dado scroll, a cornice, lunettes, the table's tiled sides and the hearth's architrave.
const CHIM = [{ axis: 0, t: 215 }, { axis: 1, t: 87.5 }];        // long arm: z = 40 - t; short arm: x = 32.5 + t
const vpt = (axis, t, c, y) => (axis === 0 ? [c, y === undefined ? vaultY(c) : y, 40 - t] : [HALF + t, y === undefined ? vaultY(c) : y, -362.5 + c]);
const vnr = (axis, c) => { const y = vaultY(c); return axis === 0 ? [-c / VR, -(y - VCY) / VR, 0] : [0, -(y - VCY) / VR, -c / VR]; };
const vtan = (axis) => (axis === 0 ? [0, 0, -1] : [1, 0, 0]);
function buildArchitecture(tb, OFF, tableY) {
  const NA = 16;
  for (const axis of [0, 1]) {
    const len = axis === 0 ? 435 : 250, off = OFF + axis * 600, ch = CHIM[axis], tg = vtan(axis);
    const fzAt = (t, c) => [off + t, 200 + vaultS(c)];
    const strip = (t0, t1) => {
      const n = Math.max(1, Math.ceil((t1 - t0) / 31));
      for (let k = 0; k < n; k++) for (let i = 0; i < NA; i++) {
        const ta = lerp(t0, t1, k / n), tb2 = lerp(t0, t1, (k + 1) / n), c0 = -HALF + (2 * HALF * i) / NA, c1 = -HALF + (2 * HALF * (i + 1)) / NA;
        tb.quad(vpt(axis, ta, c0), vpt(axis, tb2, c0), vpt(axis, tb2, c1), vpt(axis, ta, c1), fzAt(ta, c0), fzAt(tb2, c0), fzAt(tb2, c1), fzAt(ta, c1), 2, [0, -1, 0],
          [vnr(axis, c0), vnr(axis, c0), vnr(axis, c1), vnr(axis, c1)], tg);
      }
    };
    strip(0, ch.t - HALF); strip(ch.t + HALF, len);
    // the square round the chimney, tessellated in rings so the hole is a true circle
    const NT = 64, NR = 5, P = (th, r) => { const dt = Math.cos(th) * r, c = Math.sin(th) * r; return { p: vpt(axis, ch.t + dt, c), s: fzAt(ch.t + dt, c), n: vnr(axis, c) }; };
    for (let i = 0; i < NT; i++) {
      const th0 = (i / NT) * Math.PI * 2, th1 = ((i + 1) / NT) * Math.PI * 2;
      const m0 = HALF / Math.max(Math.abs(Math.cos(th0)), Math.abs(Math.sin(th0))), m1 = HALF / Math.max(Math.abs(Math.cos(th1)), Math.abs(Math.sin(th1)));
      for (let j = 0; j < NR; j++) {
        const a = P(th0, lerp(15, m0, j / NR)), b = P(th1, lerp(15, m1, j / NR)), c = P(th1, lerp(15, m1, (j + 1) / NR)), d = P(th0, lerp(15, m0, (j + 1) / NR));
        tb.quad(a.p, b.p, c.p, d.p, a.s, b.s, c.s, d.s, 2, [0, -1, 0], [a.n, b.n, c.n, d.n], tg);
      }
    }
    // transverse arches: soffit 4.5 m wide with the dado scroll, plain sides
    const RI = 51.5, RC = 1.3, ribs = axis === 0 ? [62, 124, 186, 248, 310, 372] : [2.3, 62, 124, 186, 247.7];
    const ys = (c) => RC + Math.sqrt(Math.max(RI * RI - c * c, 0)), ss = (c) => RI * Math.asin(c / RI);
    ribs.forEach((tr, ri) => {
      const o2 = OFF + 1300 + axis * 700 + ri * 97.5, ta = tr - 2.25, tb2 = tr + 2.25, ax = axis === 0 ? [0, 0, -1] : [1, 0, 0];
      for (let i = 0; i < NA; i++) {
        const c0 = -HALF + (2 * HALF * i) / NA, c1 = -HALF + (2 * HALF * (i + 1)) / NA, y0 = ys(c0), y1 = ys(c1);
        tb.quad(vpt(axis, ta, c0, y0), vpt(axis, ta, c1, y1), vpt(axis, tb2, c1, y1), vpt(axis, tb2, c0, y0), [o2 + ss(c0), 0], [o2 + ss(c1), 0], [o2 + ss(c1), 4.5], [o2 + ss(c0), 4.5], 0, [0, -1, 0]);
        for (const [tt, sg] of [[ta, -1], [tb2, 1]])
          tb.quad(vpt(axis, tt, c0, y0), vpt(axis, tt, c1, y1), vpt(axis, tt, c1), vpt(axis, tt, c0), [o2 + c0 + 40, y0], [o2 + c1 + 40, y1], [o2 + c1 + 40, vaultY(c1)], [o2 + c0 + 40, vaultY(c0)], 3, [ax[0] * sg, 0, ax[2] * sg]);
      }
    });
    // lunettes closing both ends of each barrel
    for (const [tt, sg] of [[0, 1], [len, -1]]) for (let i = 0; i < NA; i++) {
      const c0 = -HALF + (2 * HALF * i) / NA, c1 = -HALF + (2 * HALF * (i + 1)) / NA, ax = vtan(axis);
      tb.quad(vpt(axis, tt, c0, WALL_H), vpt(axis, tt, c1, WALL_H), vpt(axis, tt, c1), vpt(axis, tt, c0), [off + 500 + c0, 42], [off + 500 + c1, 42], [off + 500 + c1, vaultY(c1)], [off + 500 + c0, vaultY(c0)], 2, [ax[0] * sg, 0, ax[2] * sg]);
    }
  }
  // cornice along every wall head
  const runs = [[[HALF, 40], [HALF, -330], [-1, 0]], [[-HALF, 40], [-HALF, -395], [1, 0]], [[-HALF, -395], [282.5, -395], [0, 1]],
    [[-HALF, 40], [HALF, 40], [0, -1]], [[HALF, -330], [282.5, -330], [0, -1]], [[282.5, -330], [282.5, -395], [-1, 0]]];
  runs.forEach(([p0, p1, nr], ri) => {
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), n = Math.ceil(L / 31), o3 = OFF + 3000 + ri * 450, pr = 0.9;
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n, x0 = lerp(p0[0], p1[0], a), z0 = lerp(p0[1], p1[1], a), x1 = lerp(p0[0], p1[0], b), z1 = lerp(p0[1], p1[1], b);
      const fx0 = x0 + nr[0] * pr, fz0 = z0 + nr[1] * pr, fx1 = x1 + nr[0] * pr, fz1 = z1 + nr[1] * pr;
      tb.quad([fx0, 41.25, fz0], [fx1, 41.25, fz1], [fx1, 42.75, fz1], [fx0, 42.75, fz0], [o3 + a * L, 0.75], [o3 + b * L, 0.75], [o3 + b * L, 2.25], [o3 + a * L, 2.25], 3, [nr[0], 0, nr[1]]);
      tb.quad([x0, 41.25, z0], [x1, 41.25, z1], [fx1, 41.25, fz1], [fx0, 41.25, fz0], [o3 + a * L, 0], [o3 + b * L, 0], [o3 + b * L, 0.75], [o3 + a * L, 0.75], 3, [0, -1, 0]);
    }
  });
  // the work table's sides: four runs of dado
  {
    const x0 = -6, x1 = 10, z0 = -120, z1 = -230, o4 = OFF + 6000;
    const side = (a, b, nr, so) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 30);
      for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n, ax = lerp(a[0], b[0], u0), az = lerp(a[1], b[1], u0), bx = lerp(a[0], b[0], u1), bz = lerp(a[1], b[1], u1);
        tb.quad([ax, 0, az], [bx, 0, bz], [bx, tableY - 0.5, bz], [ax, tableY - 0.5, az], [o4 + so + u0 * L, 0], [o4 + so + u1 * L, 0], [o4 + so + u1 * L, 4.5], [o4 + so + u0 * L, 4.5], 0, nr); } };
    side([x1, z0], [x1, z1], [1, 0, 0], 0); side([x0, z1], [x0, z0], [-1, 0, 0], 120); side([x0, z0], [x1, z0], [0, 0, 1], 240); side([x1, z1], [x0, z1], [0, 0, -1], 270);
  }
  // the hearth architrave: the dado scroll runs up one jamb, round the arch and down the other, 0.9 m proud of the wall
  {
    const xf = 282.5 - 0.9, xw = 282.5, zc = -362.5, o5 = OFF + 7000, R0 = 13, R1 = 17.5, NS = 24, h = [-1, 0, 0];
    tb.quad([xf, 0, zc + R0], [xf, 11, zc + R0], [xf, 11, zc + R1], [xf, 0, zc + R1], [o5, 0], [o5 + 11, 0], [o5 + 11, 4.5], [o5, 4.5], 0, h);
    tb.quad([xf, 11, zc - R0], [xf, 0, zc - R0], [xf, 0, zc - R1], [xf, 11, zc - R1], [o5 + 59, 0], [o5 + 70, 0], [o5 + 70, 4.5], [o5 + 59, 4.5], 0, h);
    const ap = (r, f, x) => [x, 11 + r * Math.sin(f), zc + r * Math.cos(f)];
    for (let i = 0; i < NS; i++) {
      const f0 = (i / NS) * Math.PI, f1 = ((i + 1) / NS) * Math.PI, s0 = o5 + 11 + 15.28 * f0, s1 = o5 + 11 + 15.28 * f1;
      tb.quad(ap(R0, f0, xf), ap(R0, f1, xf), ap(R1, f1, xf), ap(R1, f0, xf), [s0, 0], [s1, 0], [s1, 4.5], [s0, 4.5], 0, h);
      tb.quad(ap(R0, f0, xf), ap(R0, f1, xf), ap(R0, f1, xw + 3), ap(R0, f0, xw + 3), [s0, 6], [s1, 6], [s1, 9.9], [s0, 9.9], 3, [0, -Math.sin((f0 + f1) / 2), -Math.cos((f0 + f1) / 2)]);
      tb.quad(ap(R1, f0, xf), ap(R1, f1, xf), ap(R1, f1, xw), ap(R1, f0, xw), [s0, 12], [s1, 12], [s1, 12.9], [s0, 12.9], 3, [0, Math.sin((f0 + f1) / 2), Math.cos((f0 + f1) / 2)]);
    }
    for (const sg of [1, -1]) {
      tb.quad([xf, 0, zc + sg * R0], [xf, 11, zc + sg * R0], [xw + 3, 11, zc + sg * R0], [xw + 3, 0, zc + sg * R0], [o5 + 90, 6], [o5 + 101, 6], [o5 + 101, 9.9], [o5 + 90, 9.9], 3, [0, 0, -sg]);
      tb.quad([xf, 0, zc + sg * R1], [xf, 11, zc + sg * R1], [xw, 11, zc + sg * R1], [xw, 0, zc + sg * R1], [o5 + 110, 12], [o5 + 121, 12], [o5 + 121, 12.9], [o5 + 110, 12.9], 3, [0, 0, sg]);
    }
  }
}

// ------------------------------------------------------------------ props
const COPPER = '#c9743c', TIN = '#b4b9c0', IRON = '#34322f', WOOD = '#9a7450', LEMON = '#EFC527', LEAFC = '#3d6b3a', TERRA = '#B96A3C';
const S_COPPER = finish(K.COPPER, 0.8, 1), S_TINM = finish(K.LIQUID, 0.9, 1), S_IRON = finish(K.MATTE, 0.3), S_WOOD = finish(K.WOOD, 0.12), S_LEMON = finish(K.LEMON, 0.55);
const sph = (r, a = 8, b = 6) => new THREE.SphereGeometry(r, a, b);
const cyl = (rt, rb, h, seg = 10, hs = 1, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, hs, open);
const sootTint = (y0, h) => (x, y, z, c) => { const k = 0.45 + 0.55 * sstep(y0, y0 + h, y); c.multiplyScalar(k); };

function lemonGeo(len) {
  const g = sph(len / 2, 10, 8); g.rotateZ(Math.PI / 2); const pos = g.attributes.position, R = len / 2;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), t = Math.abs(x) / R, k = 0.74 * (1 - 0.25 * t * t), nip = t > 0.82 ? (t - 0.82) * 0.9 * R : 0;
    pos.setXYZ(i, x + Math.sign(x) * nip, pos.getY(i) * k, pos.getZ(i) * k); }
  g.computeVertexNormals(); return g;
}
function leafGeo(len, wid) {
  const g = new THREE.PlaneGeometry(len, wid, 4, 2); const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / len, y = pos.getY(i); const w = Math.sqrt(Math.max(1 - 4 * x * x, 0)) * (1 - 0.35 * x);
    pos.setXYZ(i, pos.getX(i) + len / 2, y * w, Math.abs(y * w) * 0.5 - 1.2 * x * x * len * 0.25); uv.setXY(i, x + 0.5, y / wid + 0.5); }
  g.computeVertexNormals(); return g;
}
// a copper pan: hammered wall with rolled rim, tinned inside, iron handle with rivets and a hanging loop, rivet ring
function addPan(pb, o) {
  const R = o.r, H = o.h, M = new THREE.Matrix4().compose(new THREE.Vector3(...o.p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.e || [0, o.rot || 0, 0]))), new THREE.Vector3(1, 1, 1));
  const at = (g, loc, opt) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(...(loc.p || [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(loc.r || [0, 0, 0]))), new THREE.Vector3(...(loc.s || [1, 1, 1]))); pb.add(g, { ...opt, m: m.premultiply(M) }); };
  const outer = [[0, 0], [R * 0.86, 0], [R * 0.97, 0.07 * H], [R, 0.22 * H], [R * 1.02, H * 0.93], [R * 1.07, H * 0.97], [R * 1.075, H * 1.03], [R * 1.03, H * 1.06], [R * 0.985, H * 1.03]];
  const inner = [[R * 0.985, H * 1.03], [R * 0.965, H * 0.3], [R * 0.9, H * 0.16], [0, H * 0.13]];
  at(lathe(outer, 32), {}, { c: COPPER, finish: S_COPPER, uv: [6.283 * R, profLen(outer)], tint: (x, y, z, c, lx, ly) => c.multiplyScalar(0.5 + 0.5 * sstep(0, H * 0.5, ly)) });
  at(lathe(inner, 32), {}, { c: TIN, finish: finish(K.COPPER, 0.6, 1), uv: [6.283 * R, profLen(inner)] });
  if (o.liquid) at(new THREE.CircleGeometry(R * 0.955, 28).rotateX(-Math.PI / 2), { p: [0, H * 0.7, 0] }, { c: o.liquid, finish: S_TINM });
  const nRiv = Math.round(R * 9);
  for (let i = 0; i < nRiv; i++) { const a = (i / nRiv) * 6.283; at(sph(0.075, 6, 4), { p: [Math.cos(a) * R * 1.02, H * 0.82, Math.sin(a) * R * 1.02], s: [1, 1, 1] }, { c: '#e09a5c', finish: S_COPPER }); }
  const hl = o.handle || R * 1.5;
  at(rbox(hl, 0.13, 0.36, 0.05), { p: [R + hl / 2 - 0.15, H * 0.92 + hl * 0.11, 0], r: [0, 0, 0.22] }, { c: IRON, finish: S_IRON });
  at(new THREE.TorusGeometry(0.24, 0.07, 6, 12), { p: [R + hl - 0.05, H * 0.92 + hl * 0.22, 0], r: [Math.PI / 2, 0, 0] }, { c: IRON, finish: S_IRON });
  at(rbox(0.12, 0.55, 0.7, 0.04), { p: [R * 1.03, H * 0.78, 0] }, { c: IRON, finish: S_IRON });
  for (const dz of [-0.2, 0, 0.2]) at(sph(0.07, 6, 4), { p: [R * 1.07, H * 0.74 + Math.abs(dz) * 0.5, dz] }, { c: '#e09a5c', finish: S_COPPER });
}
// the great pot on its trivet: bellied, two riveted bands, loop handles on riveted plates, lid ajar
function addPot(pb, x, y, z, rot) {
  const P0 = [[0, 0], [1.9, 0], [2.25, 0.22], [2.46, 1.1], [2.52, 2.5], [2.44, 3.8], [2.34, 4.45], [2.44, 4.6], [2.47, 4.72], [2.38, 4.8], [2.24, 4.74]];
  const P1 = [[2.24, 4.74], [2.2, 4.3], [2.3, 3.7], [0, 3.6]];
  pb.add(lathe(P0, 40), { p: [x, y, z], c: COPPER, finish: S_COPPER, uv: [15.7, profLen(P0)], tint: (px, py, pz, c) => c.multiplyScalar(0.42 + 0.58 * sstep(y, y + 2.6, py)) });
  pb.add(lathe(P1, 40), { p: [x, y, z], c: TIN, finish: finish(K.COPPER, 0.6, 1), uv: [14, profLen(P1)] });
  pb.add(new THREE.CircleGeometry(2.25, 30).rotateX(-Math.PI / 2), { p: [x, y + 3.95, z], c: '#7d858e', finish: S_TINM });
  for (const [yy, rr, n] of [[1.05, 2.47, 30], [4.3, 2.38, 30]]) {
    pb.add(new THREE.TorusGeometry(rr + 0.01, 0.045, 5, 40).rotateX(Math.PI / 2), { p: [x, y + yy + 0.12, z], c: '#a85c30', finish: S_COPPER });
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; pb.add(sph(0.085, 6, 4), { p: [x + Math.cos(a) * rr, y + yy, z + Math.sin(a) * rr], c: '#e09a5c', finish: S_COPPER }); }
  }
  for (let i = 0; i < 9; i++) pb.add(sph(0.08, 6, 4), { p: [x + Math.cos(rot + 1.2) * 2.53, y + 1.3 + i * 0.33, z + Math.sin(rot + 1.2) * 2.53], c: '#e09a5c', finish: S_COPPER });
  for (const sg of [0, Math.PI]) {
    const a = rot + sg, cx = x + Math.cos(a) * 2.5, cz = z + Math.sin(a) * 2.5;
    pb.add(rbox(0.16, 0.9, 1.5, 0.05), { p: [cx, y + 3.55, cz], r: [0, -a, 0], c: '#a85c30', finish: S_COPPER });
    pb.add(new THREE.TorusGeometry(0.62, 0.13, 7, 14, Math.PI), { p: [cx + Math.cos(a) * 0.1, y + 3.5, cz + Math.sin(a) * 0.1], r: [0, -a + Math.PI / 2, 0], s: [1, 1, 1], c: IRON, finish: S_IRON,
      m: new THREE.Matrix4().compose(new THREE.Vector3(cx + Math.cos(a) * 0.1, y + 3.5, cz + Math.sin(a) * 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.5, -a + Math.PI / 2, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)) });
    for (const dz of [-0.5, 0.5]) for (const dy of [-0.25, 0.25]) pb.add(sph(0.075, 6, 4), { p: [cx + Math.cos(a) * 0.09 - Math.sin(a) * dz, y + 3.55 + dy, cz + Math.sin(a) * 0.09 + Math.cos(a) * dz], c: '#e09a5c', finish: S_COPPER });
  }
  const LID = [[0, 0.75], [0.25, 0.72], [0.5, 0.5], [1.6, 0.26], [2.3, 0.1], [2.5, 0.08], [2.52, 0], [2.3, -0.02], [0, 0.1]];
  const lm = new THREE.Matrix4().compose(new THREE.Vector3(x + Math.cos(rot + 2.2) * 0.7, y + 4.95, z + Math.sin(rot + 2.2) * 0.7), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.17, rot, 0.1)), new THREE.Vector3(1, 1, 1));
  pb.add(lathe(LID, 36), { m: lm, c: COPPER, finish: S_COPPER, uv: [15, 3] });
  pb.add(sph(0.3, 10, 8), { m: lm.clone().multiply(new THREE.Matrix4().makeTranslation(0, 1.0, 0)), c: IRON, finish: S_IRON });
  pb.add(cyl(0.12, 0.16, 0.3, 8), { m: lm.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.8, 0)), c: IRON, finish: S_IRON });
}
// the tin-glazed bowl heaped with lemons, and the bough beside it
async function addBowl(pb, rng, x, y, z, nLemons, tick) {
  const O = [[0, 0.0], [1.15, 0], [1.22, 0.22], [1.02, 0.42], [1.5, 0.85], [2.35, 1.6], [2.88, 2.3], [3.0, 2.5], [2.98, 2.6], [2.86, 2.56]];
  const I = [[2.86, 2.56], [2.2, 1.8], [1.2, 1.05], [0, 0.85]];
  pb.add(lathe(O, 44), { p: [x, y, z], c: '#ffffff', finish: finish(K.FAIENCE, 0.75), uv: [14, profLen(O)] });
  pb.add(lathe(I, 44), { p: [x, y, z], c: '#f1f3f0', finish: finish(K.FAIENCE, 0.75), uvf: () => [0, -100], tint: (px, py, pz, c) => c.multiplyScalar(0.5 + 0.5 * sstep(y + 1, y + 2.6, py)) });
  const mound = sph(2.62, 20, 8); mound.scale(1, 0.62, 1);
  pb.add(mound, { p: [x, y + 1.75, z], c: '#8d7a12', finish: S_LEMON });
  const lg = () => lemonGeo(0.6), cA = new THREE.Color(LEMON), cB = new THREE.Color('#cdd02a'), cC = new THREE.Color('#ffe04a'), tops = [];
  for (let i = 0; i < nLemons; i++) {
    const r = 2.5 * Math.sqrt((i + 0.5) / nLemons), a = i * 2.39996 + rng() * 0.3, hy = y + 1.95 + 1.45 * (1 - (r / 2.62) * (r / 2.62)) + rng() * 0.12;
    const c = cA.clone().lerp(rng() < 0.3 ? cB : cC, rng() * 0.6);
    pb.add(lg(), { p: [x + Math.cos(a) * r, hy, z + Math.sin(a) * r], r: [rng() * 6.28, rng() * 6.28, rng() * 1.2 - 0.6], c, finish: S_LEMON });
    if (i % 9 === 4) tops.push([x + Math.cos(a) * r, hy + 0.22, z + Math.sin(a) * r, a]);
    if (i % 12 === 11) await tick();
  }
  for (const t of tops) for (let k = 0; k < 2; k++) pb.add(leafGeo(0.95, 0.42), { p: [t[0], t[1], t[2]], r: [0.2 + rng() * 0.4, t[3] + k * 2.2, 0.5], c: LEAFC, finish: finish(K.LEAF, 0.35, 0.6), sway: [0, 0.02, 0] });
}
function addBough(pb, rng, x, y, z, rot, len) {
  const dir = [Math.cos(rot), Math.sin(rot)], pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([x + dir[0] * len * t - dir[1] * Math.sin(t * 3) * 0.5, y + 0.14 + 0.5 * Math.sin(t * Math.PI) * 0.6, z + dir[1] * len * t + dir[0] * Math.sin(t * 3) * 0.5]); }
  pb.add(tube(pts, 0.085, 6), { c: '#5a4630', finish: S_WOOD });
  for (let i = 0; i < 30; i++) {
    const t = 0.12 + 0.88 * rng(), k = Math.min(Math.floor(t * 5), 4), f = t * 5 - k, p = [lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f), lerp(pts[k][2], pts[k + 1][2], f)];
    const c = new THREE.Color('#2f5a30').lerp(new THREE.Color('#567f38'), rng() * 0.6);
    pb.add(leafGeo(0.95 + rng() * 0.4, 0.42), { p: [p[0], p[1] + 0.05 + rng() * 0.25, p[2]], r: [rng() * 0.8 - 0.4, rot + (rng() < 0.5 ? 1 : -1) * (0.5 + rng()), rng() * 0.3 - 0.05], c, finish: finish(K.LEAF, 0.4, 0.6), sway: [0, 0.035 * rng(), 0] });
  }
  for (let i = 0; i < 3; i++) { const t = 0.35 + i * 0.25, k = Math.floor(t * 5), p = pts[k]; pb.add(lemonGeo(0.6), { p: [p[0] + dir[1] * 0.4, y + 0.24, p[2] - dir[0] * 0.4 + i * 0.1], r: [0, rng() * 6, 0.2], c: LEMON, finish: S_LEMON }); }
}
// small things that keep the long table from being bare: plates, folded linen, a board with cut lemons and a knife, a spoon
function addTableSundries(pb, rng, Y, blobs) {
  const PL = [[0.82, 0.16], [0.8, 0.19], [0.55, 0.07], [0, 0.06]], PB = [[0, 0], [0.42, 0], [0.5, 0.05], [0.82, 0.16]];
  for (const [px, pz, n] of [[5.5, -126, 7], [2.6, -127.5, 4], [-3.5, -214, 6]]) {
    for (let i = 0; i < n; i++) { const yy = Y + i * 0.11, ox = (rng() - 0.5) * 0.08, oz = (rng() - 0.5) * 0.08;
      pb.add(lathe(PB, 20), { p: [px + ox, yy, pz + oz], c: '#eef0ec', finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] });
      pb.add(lathe(PL, 20), { p: [px + ox, yy, pz + oz], c: '#ffffff', finish: finish(K.FAIENCE, 0.7), uv: [5, 0.9] }); }
    blobs.push([px, Y + 0.03, pz, 1.5, 1.5, 0.5]);
  }
  const linen = (px, pz, rot) => { for (let k = 0; k < 3; k++) pb.add(rbox(2.6 - k * 0.1, 0.16, 1.9 - k * 0.06, 0.07), { p: [px + k * 0.05, Y + 0.08 + k * 0.16, pz], r: [0, rot + k * 0.06, 0], c: '#f2f1ea', finish: finish(K.LINEN, 0.02),
    uvf: (x, y, z, lx, ly, lz) => [lz, lx + 2.4] }); blobs.push([px, Y + 0.03, pz, 2.2, 1.8, 0.45]); };
  linen(0.5, -130.5, 0.3); linen(6.2, -197, -0.2);
  // chopping board
  const bx = 4.2, bz = -148;
  pb.add(rbox(4.4, 0.28, 2.8, 0.09), { p: [bx, Y + 0.14, bz], r: [0, 0.18, 0], c: WOOD, finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx, lz] });
  blobs.push([bx, Y + 0.03, bz, 3.2, 2.3, 0.5]);
  for (let i = 0; i < 4; i++) { const hx = bx - 1.2 + i * 0.75 + rng() * 0.2, hz = bz - 0.5 + rng() * 0.9, up = i % 2 === 0;
    const h = new THREE.SphereGeometry(0.3, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2); h.scale(1, 0.85, 1);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(hx, Y + 0.28 + (up ? 0.26 : 0), hz), new THREE.Quaternion().setFromEuler(new THREE.Euler(up ? Math.PI + 0.15 : 0, rng() * 6, 0)), new THREE.Vector3(1, 1, 1));
    pb.add(h, { m, c: LEMON, finish: S_LEMON });
    const face = new THREE.CircleGeometry(0.29, 12); face.rotateX(Math.PI / 2);
    pb.add(face, { m, c: '#f7f0a6', finish: finish(K.LEMON, 0.7), tint: (x, y, z, c, lx, ly, lz) => { if (lx * lx + lz * lz > 0.05) c.set('#efe07a'); } }); }
  const blade = new THREE.BoxGeometry(2.9, 0.04, 0.62, 6, 1, 1); { const p = blade.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getX(i) + 1.45) / 2.9; if (p.getZ(i) > 0) p.setZ(i, 0.31 - 0.5 * Math.pow(Math.max(t, 0), 2.4)); } blade.computeVertexNormals(); }
  const km = new THREE.Matrix4().compose(new THREE.Vector3(bx + 0.4, Y + 0.31, bz + 0.9), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.25, 0)), new THREE.Vector3(1, 1, 1));
  pb.add(blade, { m: km, c: '#aeb4bc', finish: S_TINM });
  pb.add(rbox(1.25, 0.2, 0.36, 0.08), { m: km.clone().multiply(new THREE.Matrix4().makeTranslation(-2.0, 0.02, -0.08)), c: '#4a3626', finish: S_WOOD });
  for (const dx of [-2.35, -2.0, -1.65]) pb.add(sph(0.05, 6, 4), { m: km.clone().multiply(new THREE.Matrix4().makeTranslation(dx, 0.12, -0.08)), c: '#e09a5c', finish: S_COPPER });
  // wooden spoon across the third pan's rim, stray lemons
  const sm = new THREE.Matrix4().compose(new THREE.Vector3(1.0, Y + 1.72, -190.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.9, -0.12)), new THREE.Vector3(1, 1, 1));
  pb.add(cyl(0.07, 0.09, 3.4, 7).rotateZ(Math.PI / 2), { m: sm, c: WOOD, finish: S_WOOD });
  const bowl = sph(0.42, 10, 6); bowl.scale(1.3, 0.35, 0.85);
  pb.add(bowl, { m: sm.clone().multiply(new THREE.Matrix4().makeTranslation(2.0, 0, 0)), c: WOOD, finish: S_WOOD });
  for (const [lx, lz] of [[8.2, -201.5], [7.6, -211.5], [8.6, -213], [1.2, -202], [6.9, -165], [8.3, -152.5], [3.0, -219], [8.9, -178], [8.4, -179.2], [9.0, -196], [8.0, -143], [8.8, -217.5], [9.1, -208.3]]) {
    pb.add(lemonGeo(0.6), { p: [lx, Y + 0.22, lz], r: [0, rng() * 6.28, 0], c: new THREE.Color(LEMON).lerp(new THREE.Color('#cdd02a'), rng() * 0.5), finish: S_LEMON });
    blobs.push([lx, Y + 0.03, lz, 0.55, 0.45, 0.6]);
  }
}

// the cat: a loaf seen from behind. Local space: head toward -z, tail root on the +x flank. aSway carries the animation weights.
function catGeometry(coat, patch) {
  const pb = makePB(), S = finish(K.FUR, 0.05, patch);
  const breath = (x, y, z, lx, ly, lz) => [Math.max(0, 1 - Math.abs(z + 0.1) / 1.6) * sstep(0.15, 0.9, y) * 1, 0, 0];
  const blob = (r, s, p, sw) => { const g = sph(r, 16, 12); g.scale(s[0], s[1], s[2]); pb.add(g, { p, c: coat, finish: S, sway: sw || breath, tint: (x, y, z, c) => c.multiplyScalar(0.62 + 0.38 * sstep(0, 0.9, y)) }); };
  blob(1, [1.06, 0.82, 1.5], [0, 0.78, 0]);                    // loaf
  blob(1, [0.9, 0.72, 0.85], [0, 0.98, -0.75]);                // shoulders
  blob(1, [0.52, 0.6, 0.8], [0.72, 0.56, 0.62]); blob(1, [0.52, 0.6, 0.8], [-0.72, 0.56, 0.62]);   // haunches
  blob(1, [0.34, 0.2, 0.5], [0.6, 0.2, -1.35], [0, 0, 0]); blob(1, [0.34, 0.2, 0.5], [-0.6, 0.2, -1.35], [0, 0, 0]);   // tucked paws
  blob(0.62, [1.08, 0.95, 1], [0, 1.32, -1.5], [0, 0, 0]);      // back of the head
  for (const sg of [-1, 1]) {
    const e = new THREE.ConeGeometry(0.3, 0.58, 4, 2); e.scale(1, 1, 0.45); e.translate(0, 0.29, 0);
    pb.add(e, { p: [sg * 0.36, 1.74, -1.5], r: [0.12, sg * 0.35, -sg * 0.28], c: coat, finish: S, sway: (x, y) => [0, sg * sstep(1.78, 2.3, y) * 1, 0],
      tint: (x, y, z, c, lx, ly, lz, n) => { if (n.z < -0.2) c.lerp(new THREE.Color('#e8b7a0'), 0.7); } });
  }
  const tail = cyl(0.11, 0.2, 2.7, 9, 16); tail.rotateZ(-Math.PI / 2); tail.translate(1.35, 0, 0);
  const tip = sph(0.115, 9, 5); tip.translate(2.7, 0, 0);
  const root = [0.62, 0.24, 1.05];
  for (const g of [tail, tip]) pb.add(g, { p: root, c: coat, finish: S, sway: (x) => [0, 0, Math.max(x - root[0], 0.001)], tint: (x, y, z, c) => { if (x - root[0] > 2.2) c.multiplyScalar(0.6); } });
  const g = pb.build(); g.userData.root = root; return g;
}

// a mason's plank scaffold against a wall. o: start [x, z], along [dx, dz], out [nx, nz] (from the wall), len, levels
async function addScaffold(pb, rng, o, blobs) {
  const { start, along, out, len, levels } = o, depth = 2.8, H = levels[levels.length - 1] + 2.6, nB = Math.round(len / 4.4);
  const P = (a, d, y) => [start[0] + along[0] * a + out[0] * d, y, start[1] + along[1] * a + out[1] * d], yaw = Math.atan2(-along[1], along[0]);
  const wc = () => new THREE.Color('#958672').lerp(new THREE.Color('#6a5d50'), rng());
  const stick = (a, b, r) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1));
    pb.add(cyl(r * 0.85, r, L, 7, 1), { m, c: wc(), finish: S_WOOD, uv: [1, L] }); };
  for (let i = 0; i <= nB; i++) {
    const a = (i / nB) * len;
    for (const d of [0.35, depth]) { const lean = (rng() - 0.5) * 0.25; stick(P(a, d, 0), P(a + lean, d, H + rng() * 1.2), 0.19); }
    for (const y of levels) { stick(P(a, 0.1, y - 0.25), P(a, depth + 0.5, y - 0.25 + (rng() - 0.5) * 0.1), 0.13);
      pb.add(new THREE.TorusGeometry(0.24, 0.07, 5, 8), { p: P(a, depth, y - 0.2), r: [Math.PI / 2, 0, 0], c: '#4a4034', finish: finish(K.MATTE, 0.05) }); }
    blobs.push([...P(a, depth, 0.04), 0.9, 0.9, 0.45]);
    if (i % 2 === 1) await o.tick();
  }
  for (const y of levels) {
    await o.tick();
    for (const d of [0.35, depth]) stick(P(-0.6, d, y - 0.45), P(len + 0.6, d, y - 0.45), 0.12);
    for (let i = 0; i < nB; i++) for (let k = 0; k < 3; k++) {
      if (rng() < 0.12) continue;
      const a = ((i + 0.5) / nB) * len + (rng() - 0.5) * 0.5, d = 0.55 + k * 0.85 + (rng() - 0.5) * 0.08;
      pb.add(rbox(len / nB + 0.7, 0.13, 0.74, 0.04), { p: P(a, d, y - 0.06 + k * 0.012), r: [0, yaw + (rng() - 0.5) * 0.05, 0], c: wc(), finish: S_WOOD, uvf: (x, yy, z, lx, ly, lz) => [lx + i * 7, lz + k] });
    }
  }
  for (let i = 0; i < nB; i += 2) stick(P((i / nB) * len, depth + 0.2, 0.3), P(((i + 2) / nB) * len, depth + 0.2, levels[Math.min(1, levels.length - 1)]), 0.1);
  // ladder, buckets, spare tiles
  const la = len * 0.2;
  for (const s of [-0.45, 0.45]) stick(P(la + s, depth + 3.4, 0), P(la + s, depth + 0.3, levels[0] + 1.6), 0.09);
  for (let k = 1; k < 12; k++) { const t = k / 12.5; stick(P(la - 0.5, lerp(depth + 3.4, depth + 0.3, t), (levels[0] + 1.6) * t), P(la + 0.5, lerp(depth + 3.4, depth + 0.3, t), (levels[0] + 1.6) * t), 0.06); }
  const bucket = (p) => { const B = [[0, 0], [0.5, 0], [0.62, 0.9], [0.66, 0.92], [0.6, 0.86], [0.5, 0.12], [0, 0.1]];
    pb.add(lathe(B, 14), { p, c: '#7d6f5e', finish: S_WOOD, uv: [3.6, 2] }); pb.add(new THREE.CircleGeometry(0.58, 12).rotateX(-Math.PI / 2), { p: [p[0], p[1] + 0.72, p[2]], c: '#d9d6cc', finish: finish(K.MATTE, 0.05) });
    pb.add(new THREE.TorusGeometry(0.6, 0.03, 4, 12, Math.PI), { p: [p[0], p[1] + 0.9, p[2]], c: IRON, finish: S_IRON }); };
  bucket(P(len * 0.45, 1.4, levels[0] + 0.02)); bucket(P(len * 0.8, depth + 2.2, 0)); bucket(P(len * 0.55, depth + 3.0, 0));
  blobs.push([...P(len * 0.8, depth + 2.2, 0.04), 1.1, 1.1, 0.5], [...P(len * 0.55, depth + 3.0, 0.04), 1.1, 1.1, 0.5]);
  const stack = (p, n, lean) => { for (let k = 0; k < n; k++) pb.add(rbox(0.75, 0.09, 0.75, 0.02), lean
    ? { p: [p[0] - out[0] * k * 0.1, p[1] + 0.36, p[2] - out[1] * k * 0.1], r: [along[0] * 0.25 * -1 + 1.32 * Math.abs(along[1]), yaw, 1.32 * Math.abs(along[0])], c: k % 2 ? '#CFC9BB' : '#f0f2ee', finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] }
    : { p: [p[0], p[1] + 0.05 + k * 0.095, p[2]], r: [0, yaw + (rng() - 0.5) * 0.3, 0], c: k === n - 1 ? o.pig.mid : (k % 3 ? '#f0f2ee' : o.pig.pale), finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] }); };
  for (let i = 0; i < 5; i++) { const p = P(len * (0.1 + 0.2 * i) + rng(), depth + 1.6 + rng() * 2.2, 0); stack(p, 4 + Math.floor(rng() * 6), false); blobs.push([p[0], 0.04, p[2], 0.8, 0.8, 0.5]); }
  stack(P(len * 0.62, 1.2, levels[0] + 0.01), 6, false); stack(P(len * 0.3, 1.5, levels[1] + 0.01), 4, false);
  // mortar trough
  const tp = P(len * 0.33, depth + 4.6, 0);
  pb.add(rbox(3.4, 0.6, 1.5, 0.08), { p: [tp[0], 0.3, tp[2]], r: [0, yaw + 0.2, 0], c: '#8d7556', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx, lz] });
  const mp = sph(1, 10, 6); mp.scale(1.4, 0.32, 0.55); pb.add(mp, { p: [tp[0], 0.55, tp[2]], r: [0, yaw + 0.2, 0], c: '#dedbd0', finish: finish(K.MATTE, 0.05) });
  blobs.push([tp[0], 0.04, tp[2], 2.4, 1.6, 0.5]);
}

// chimney cone (lit whitewash, baked) and its disc of sky
function addCone(pb, cx, cz, axis, L) {
  const NS = 48, NR = 5, sun = L.sun, base = new THREE.Color(...L.coneShade), lit = new THREE.Color(...L.coneSun), c = new THREE.Color();
  const g = new THREE.BufferGeometry(), pos = [], nor = [], col = [], idx = [];
  for (let j = 0; j <= NR; j++) for (let i = 0; i <= NS; i++) {
    const th = (i / NS) * Math.PI * 2, t = j / NR, cs = Math.cos(th), sn = Math.sin(th), cc = axis === 0 ? 15 * cs : 15 * sn;
    const y0 = vaultY(cc) - 0.3, r = lerp(15, 7, t), y = lerp(y0, 95, t), k = Math.max(0, -(cs * sun[0] + sn * sun[2])) * sstep(0.25, 1, t);
    pos.push(cx + cs * r, y, cz + sn * r); nor.push(-cs, 0, -sn);
    c.copy(base).multiplyScalar(0.55 + 0.6 * t * t).lerp(lit, k * 0.9).multiplyScalar(0.9 + 0.1 * Math.sin(th * 24) * Math.sin(y * 1.3)); col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i, b = a + 1, d = a + NS + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  pb.add(g, { finish: finish(K.GLOW) });
}

// an iron rack of hanging coppers under the first arch: the foreground of the opening view
async function addRack(pb, rng, z, x0, x1, y, tick) {
  const S_CH = finish(K.MATTE, 0.3), ys = (c) => 1.3 + Math.sqrt(51.5 * 51.5 - c * c);
  pb.add(cyl(0.16, 0.16, x1 - x0 + 2, 8).rotateZ(Math.PI / 2), { p: [(x0 + x1) / 2, y, z], c: IRON, finish: S_IRON });
  for (const x of [x0 + 1, x1 - 1]) { pb.add(cyl(0.09, 0.09, ys(x) - y, 6), { p: [x, (ys(x) + y) / 2, z], c: IRON, finish: S_CH });
    for (let yy = y + 0.8; yy < ys(x); yy += 1.6) pb.add(new THREE.TorusGeometry(0.22, 0.06, 5, 8), { p: [x, yy, z], r: [0, rng() * 3, 0], c: IRON, finish: S_CH }); }
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0 + 2.4, x1 - 2.4, i / (n - 1)), R = 1.5 + 0.6 * rng(), hl = R * 1.5, drop = 0.9;
    const sw = (px, py) => [0.022 * (y - py), 0, 0.05 * (y - py) * (0.6 + 0.4 * Math.sin(i * 2.1))];
    pb.add(new THREE.TorusGeometry(0.3, 0.05, 5, 10, Math.PI), { p: [x, y - 0.35, z], r: [0, Math.PI / 2, Math.PI], c: IRON, finish: S_CH });
    const sub = makePB(); addPan(sub, { p: [0, 0, 0], r: R, h: R * 0.55, handle: hl });
    const g = sub.build(), m = new THREE.Matrix4().compose(new THREE.Vector3(x, y - drop - hl - R + 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.15 + (rng() - 0.5) * 0.5, Math.PI / 2 - 0.2, 'YXZ')), new THREE.Vector3(1, 1, 1));
    pb.add(g, { m, sway: sw }); await tick();
  }
}

const JAR = [[0, 0], [1.0, 0], [1.2, 0.3], [2.2, 2.2], [2.5, 3.6], [2.2, 5.0], [1.5, 5.8], [1.35, 6.3], [1.6, 6.5], [1.62, 6.7], [1.3, 6.72], [1.2, 6.4], [0, 6.3]];
// the door in the short arm's south wall: stone frame, reveal, courtyard, far roofs, sky, the potted lemon tree
async function addDoorAndCourt(pb, rng, L, blobs, PIG, tick) {
  const X0 = 196, X1 = 216, ZD = -330, ZO = -326, WHITE = '#e9e6dc', plane = (w, h, sx = 1, sy = 1) => new THREE.PlaneGeometry(w, h, sx, sy);
  const stone = finish(K.STONE, 0.12);
  for (const [x, sg] of [[X0 - 0.75, 1], [X1 + 0.75, -1]]) { pb.add(rbox(1.7, 31, 1.1, 0.14), { p: [x, 15.5, ZD - 0.4], c: '#d8d2c2', finish: stone, uvf: (px, py, pz) => [py, pz * 3 + px] });
    pb.add(rbox(2.2, 1.6, 1.5, 0.2), { p: [x, 0.8, ZD - 0.5], c: '#cfc8b6', finish: stone, uvf: (px, py, pz) => [px, pz] }); }
  pb.add(rbox(24.4, 1.9, 1.3, 0.16), { p: [206, 31.2, ZD - 0.45], c: '#d8d2c2', finish: stone, uvf: (px, py, pz) => [px, py * 3] });
  pb.add(rbox(2.6, 2.9, 1.7, 0.2), { p: [206, 31.3, ZD - 0.5], c: '#e2ddd0', finish: stone, uvf: (px, py) => [px, py] });
  // reveal (4 m of wall), threshold
  pb.add(plane(4, 30).rotateY(Math.PI / 2), { p: [X0, 15, -328], c: WHITE, finish: finish(K.MATTE, 0.05) });
  pb.add(plane(4, 30).rotateY(-Math.PI / 2), { p: [X1, 15, -328], c: WHITE, finish: finish(K.MATTE, 0.05) });
  pb.add(plane(20, 4).rotateX(Math.PI / 2), { p: [206, 30, -328], c: WHITE, finish: finish(K.MATTE, 0.05) });
  // courtyard floor with the far wall's shadow baked in
  const WH = 12, shLen = (WH * L.sun[2]) / Math.max(L.sun[1], 0.2), ZB = -282;
  pb.add(plane(120, 48, 24, 24).rotateX(-Math.PI / 2), { p: [206, 0.0, -306], c: L.courtFloor, finish: finish(K.STONE, 0.1), uvf: (x, y, z) => [x * 0.7, z * 0.7],
    tint: (x, y, z, c) => { c.multiplyScalar(lerp(1, L.shade, sstep(ZB - shLen - 1.5, ZB - shLen + 1.5, z))); } });
  await tick();
  // far wall with coping, side walls, the houses beyond
  const wallC = new THREE.Color(L.courtWall);
  pb.add(plane(120, WH, 12, 2).rotateY(Math.PI), { p: [206, WH / 2, ZB], c: wallC, finish: finish(K.MATTE, 0.04), tint: (x, y, z, c) => { if (y < 2.6) c.copy(PIG.mid); } });
  pb.add(rbox(120, 0.9, 1.8, 0.25), { p: [206, WH + 0.3, ZB + 0.3], c: TERRA, finish: finish(K.MATTE, 0.1) });
  pb.add(plane(48, 34, 4, 2).rotateY(Math.PI / 2), { p: [150, 17, -306], c: wallC, finish: finish(K.MATTE, 0.04) });
  pb.add(plane(48, 34, 4, 2).rotateY(-Math.PI / 2), { p: [262, 17, -306], c: wallC, finish: finish(K.MATTE, 0.04) });
  for (const [x, z, w, h, d] of [[176, -258, 30, 30, 20], [214, -246, 26, 22, 22], [248, -262, 22, 40, 16], [150, -240, 30, 26, 20], [282, -244, 34, 24, 22]]) {
    pb.add(rbox(w, h, d, 0.3), { p: [x, h / 2, z], c: wallC, finish: finish(K.MATTE, 0.04) });
    const roof = new THREE.ConeGeometry(Math.max(w, d) * 0.78, 5.5, 4, 1); roof.rotateY(Math.PI / 4); roof.scale(w / Math.max(w, d), 1, d / Math.max(w, d));
    pb.add(roof, { p: [x, h + 2.75, z], c: TERRA, finish: finish(K.MATTE, 0.08) });
    for (let k = 0; k < 3; k++) pb.add(plane(2.4, 4.2).rotateY(Math.PI), { p: [x - w * 0.3 + k * w * 0.3, h * 0.62, z - d / 2 - 0.05], c: '#22304f', finish: finish(K.MATTE, 0.3) });
  }
  await tick();
  // sky: a tall backdrop that only the door can see
  const sky = (w, h, m) => { const g = plane(w, h, 1, 6); const c0 = new THREE.Color(...L.skyHor), c1 = new THREE.Color(...L.skyTop);
    pb.add(g, { m, finish: finish(K.GLOW), tint: (x, y, z, c) => { c.copy(c0).lerp(c1, sstep(0, 90, y)); } }); };
  sky(240, 220, new THREE.Matrix4().makeRotationY(Math.PI).setPosition(215, 100, -200));
  sky(128, 220, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(98, 100, -263));
  sky(128, 220, new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(332, 100, -263));
  // the lemon tree in its pot
  const tx = 221, tz = -313, POT = [[0, 0], [1.5, 0], [1.7, 0.25], [1.55, 0.5], [2.2, 2.6], [2.55, 3.7], [2.8, 3.9], [2.82, 4.2], [2.6, 4.3], [2.4, 4.1], [0, 4.0]];
  pb.add(lathe(POT, 24), { p: [tx, 0, tz], c: TERRA, finish: finish(K.MATTE, 0.12), tint: (x, y, z, c) => { if (Math.abs(y - 2.9) < 0.12 || Math.abs(y - 3.3) < 0.08) c.multiplyScalar(0.7); } });
  blobs.push([tx - L.sun[0] * 3, 0.05, tz - L.sun[2] * 3, 4.2, 4.2, 0.6], [tx - L.sun[0] / L.sun[1] * 13, 0.05, Math.min(tz - L.sun[2] / L.sun[1] * 13, -327), 7.5, 7.5, 0.55 * L.direct]);
  pb.add(tube([[tx, 4, tz], [tx + 0.3, 6.5, tz + 0.2], [tx - 0.2, 9, tz - 0.1], [tx + 0.1, 11, tz]], 0.42, 8), { c: '#6a5642', finish: S_WOOD });
  const clusters = [[0, 14, 0, 3.4], [3.2, 13, 1, 2.8], [-3, 13.4, -0.8, 2.9], [0.6, 12.6, 3, 2.6], [-0.4, 12.8, -3.1, 2.6], [1.6, 16.4, -0.6, 2.5], [-1.8, 16, 1.2, 2.4]];
  const cD = new THREE.Color('#2f5a30'), cL = new THREE.Color('#7da342'), v = new THREE.Vector3();
  for (const [cx, cy, cz, r] of clusters) {
    await tick();
    pb.add(tube([[tx, 10.6, tz], [tx + cx * 0.5, (cy + 10.6) / 2 - 0.4, tz + cz * 0.5], [tx + cx, cy, tz + cz]], 0.16, 5), { c: '#6a5642', finish: S_WOOD });
    pb.add(sph(r * 0.8, 10, 8), { p: [tx + cx, cy, tz + cz], c: '#234a27', finish: finish(K.LEAF, 0.1, 0.2) });
    for (let i = 0; i < 46; i++) {
      v.set(rng.gauss(), rng.gauss() * 0.8, rng.gauss()).normalize(); const rr = r * (0.82 + 0.3 * rng());
      const lit = 0.5 + 0.5 * (v.x * L.sun[0] + v.y * L.sun[1] + v.z * L.sun[2]);
      pb.add(leafGeo(1.5 + rng() * 0.7, 0.72), { p: [tx + cx + v.x * rr, cy + v.y * rr, tz + cz + v.z * rr], r: [rng() * 1.4 - 0.7, Math.atan2(-v.z, v.x) + rng() - 0.5, -0.5 + rng()],
        c: cD.clone().lerp(cL, lit * (0.4 + 0.6 * rng())), finish: finish(K.LEAF, 0.4, 0.7), sway: [0.07 * rng(), 0.1 + 0.08 * rng(), 0.05 * rng()] });
    }
    for (let i = 0; i < 3; i++) { v.set(rng.gauss(), -Math.abs(rng.gauss()) - 0.4, rng.gauss()).normalize();
      pb.add(lemonGeo(0.7), { p: [tx + cx + v.x * r, cy + v.y * r, tz + cz + v.z * r], r: [0, rng() * 6, 1.3], c: LEMON, finish: S_LEMON, sway: [0.04, 0, 0.03] }); }
  }
  await tick();
  // twelve linen strips on a copper rail, blowing inward
  pb.add(cyl(0.14, 0.14, 21.6, 8).rotateZ(Math.PI / 2), { p: [206, 29.45, ZD - 1.3], c: COPPER, finish: S_COPPER, uv: [1, 20] });
  for (let i = 0; i < 12; i++) {
    const len = 17.5 + 3.5 * rng(), x = X0 + 0.9 + i * 1.655, top = 29.3, ph = rng() * 6.28, amp = L.gust * (2.2 + rng() * 1.4);
    pb.add(new THREE.TorusGeometry(0.2, 0.04, 4, 8), { p: [x, 29.45, ZD - 1.3], r: [0, Math.PI / 2, 0], c: COPPER, finish: S_COPPER });
    pb.add(plane(1.56, len, 2, 22), { p: [x, top - len / 2, ZD - 1.3], c: '#f4f2ea', finish: finish(K.LINEN, 0.02, 0.9, 1),
      uvf: (px, py) => [px - x, py - (top - len)],
      sway: (px, py) => { const t = Math.pow((top - py) / len, 1.6); return [amp * 0.18 * Math.sin(ph) * t, amp * 0.22 * t, -amp * t]; },
      tint: (px, py, pz, c) => c.multiplyScalar(0.86 + 0.14 * Math.cos((px - x) * 6 + ph)) });
  }
  // storage jars along the south wall
  for (const [jx, s] of [[150, 1], [158, 0.82], [174, 1.05], [182.5, 0.9], [228, 1], [237, 0.85]]) {
    pb.add(lathe(JAR, 22), { p: [jx, 0, -334.2 + (1 - s) * 2], s, c: new THREE.Color('#b07a55').lerp(new THREE.Color('#86563a'), rng() * 0.6), finish: finish(K.MATTE, 0.14),
      tint: (x, y, z, c) => { if (Math.abs(y - 4.6 * s) < 0.16 * s || Math.abs(y - 2.0 * s) < 0.1) c.lerp(new THREE.Color('#e9e6dc'), 0.75); } });
    blobs.push([jx, 0.04, -334.2 + (1 - s) * 2, 3.3 * s, 3.3 * s, 0.6]);
  }
}

// a wicker basket heaped with lemons (or left empty), woven in bands
function addBasket(pb, rng, x, z, s, fill, blobs) {
  const B = [[0, 0], [1.5, 0], [1.75, 0.2], [2.25, 1.6], [2.5, 2.7], [2.62, 2.85], [2.5, 2.95], [2.3, 2.8], [2.05, 1.5], [0, 1.3]];
  const wc = new THREE.Color('#a8844e').lerp(new THREE.Color('#6f5330'), rng() * 0.5);
  pb.add(lathe(B, 20), { p: [x, 0, z], s, c: wc, finish: S_WOOD, uv: [3, 1.2],
    tint: (px, py, pz, c) => c.multiplyScalar(0.62 + 0.38 * Math.abs(Math.sin(py * 7 / s)) * (0.8 + 0.2 * Math.sin(Math.atan2(pz - z, px - x) * 22))) });
  for (const sg of [1, -1]) pb.add(new THREE.TorusGeometry(0.5, 0.09, 5, 10, Math.PI), { p: [x + sg * 2.45 * s, 2.55 * s, z], r: [0, Math.PI / 2, 0], s, c: '#5e4628', finish: S_WOOD });
  if (fill) {
    const m = sph(2.2, 14, 6); m.scale(1, 0.5, 1); pb.add(m, { p: [x, 2.45 * s, z], s, c: '#8d7a12', finish: S_LEMON });
    for (let i = 0; i < 16; i++) { const r = 1.9 * Math.sqrt((i + 0.5) / 16) * s, a = i * 2.39996 + rng();
      pb.add(lemonGeo(0.6), { p: [x + Math.cos(a) * r, (2.75 + 0.75 * (1 - (r / (2.2 * s)) * (r / (2.2 * s)))) * s, z + Math.sin(a) * r], r: [rng() * 6.28, rng() * 6.28, rng() - 0.5], s: 0.85 + 0.5 * s,
        c: new THREE.Color(LEMON).lerp(new THREE.Color(rng() < 0.3 ? '#cdd02a' : '#ffe04a'), rng() * 0.6), finish: S_LEMON }); }
  }
  blobs.push([x, 0.04, z, 3.4 * s, 3.4 * s, 0.6]);
}
// the masons' free-standing tower by the wall's end (the flock flies round it), and the jars and crate left under the crow
async function addTower(pb, rng, PIG, blobs, tick) {
  await addScaffold(pb, rng, { start: TOWER, along: [0, -1], out: [-1, 0], len: 8.8, levels: [4.5, 9], pig: PIG, tick }, blobs);
  for (const [jx, jz, js] of [[15, -246.5, 0.95], [19, -244, 0.8], [23.5, -247.5, 0.9]]) {
    pb.add(lathe(JAR, 22), { p: [jx, 0, jz], s: js, c: new THREE.Color('#b07a55').lerp(new THREE.Color('#8f6044'), rng() * 0.6), finish: finish(K.MATTE, 0.14),
      tint: (x, y, z, c) => { if (Math.abs(y - 4.6 * js) < 0.16 * js || Math.abs(y - 2.0 * js) < 0.1) c.lerp(new THREE.Color('#e9e6dc'), 0.6); } });
    blobs.push([jx, 0.04, jz, 3.3 * js, 3.3 * js, 0.6]);
    await tick();
  }
  pb.add(rbox(4.2, 2.2, 3.0, 0.1), { p: [4.6, 1.1, -255.5], r: [0, 0.35, 0], c: '#84735f', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx + lz, ly * 2.5] });
  for (let k = 0; k < 9; k++) pb.add(rbox(0.09, 0.75, 0.75, 0.02), { p: [3.3 + k * 0.33, 2.45, -255.2 + k * 0.12 + (rng() - 0.5) * 0.2], r: [0, 0.35, (rng() - 0.5) * 0.2], c: k % 3 === 0 ? PIG.mid : (k % 3 === 1 ? '#f0f2ee' : PIG.pale), finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] });
  blobs.push([4.6, 0.04, -255.5, 3.4, 2.8, -0.5]);
  await tick();
  addBasket(pb, rng, -0.5, -245.5, 0.8, true, blobs);
}
// the short arm's floor between the door pool and the hearth: baskets of lemons, a bench of coppers, stacked crates
async function addShortArmDressing(pb, rng, PIG, blobs, tick) {
  for (const [x, z, s, f] of [[226, -381, 1, true], [233.5, -385.5, 0.8, true], [219.5, -386.5, 0.7, false], [249, -344, 0.9, true], [256, -340.5, 0.75, false], [262, -383.5, 0.85, true]]) addBasket(pb, rng, x, z, s, f, blobs);
  await tick();
  // a low bench along the north wall with two coppers and a jug of the house faience
  pb.add(rbox(15, 0.5, 3.4, 0.12), { p: [243, 2.45, -388.8], c: '#7d6850', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx, lz + 3] });
  for (const dx of [-6.4, 0, 6.4]) { pb.add(rbox(0.5, 2.3, 3.0, 0.1), { p: [243 + dx, 1.15, -388.8], c: '#6b5843', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [ly, lz] }); }
  blobs.push([243, 0.04, -388.8, 9, 3.2, -0.5]);
  addPan(pb, { p: [239, 2.7, -388.8], r: 1.5, h: 0.9, rot: 2.2, handle: 2.0 });
  addPan(pb, { p: [246.4, 2.7, -388.6], r: 1.25, h: 1.6, rot: 0.9, handle: 1.6 });
  await tick();
  for (const [cx, cz, rot] of [[236, -343.5, 0.2], [240.6, -342.2, -0.3]]) {
    pb.add(rbox(4.2, 2.2, 3.0, 0.1), { p: [cx, 1.1, cz], r: [0, rot, 0], c: '#84735f', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx + lz, ly * 2.5] });
    for (let k = 0; k < 9; k++) pb.add(rbox(0.09, 0.75, 0.75, 0.02), { p: [cx - 1.4 + k * 0.33, 2.45, cz + (rng() - 0.5) * 0.3], r: [0, rot, (rng() - 0.5) * 0.2], c: k % 3 === 0 ? PIG.mid : (k % 3 === 1 ? '#f0f2ee' : PIG.pale), finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] });
    blobs.push([cx, 0.04, cz, 3.4, 2.8, -0.5]);
    await tick();
  }
}

// the hearth recess (sooted brick, firedogs, logs) and the baroque cartouche in relief round its mouth
async function addHearth(pb, rng, blobs, PIG, tick) {
  const XW = 282.5, ZC = -362.5, X0 = XW + 3, X1 = XW + 20, soot = (x, y, z, c) => c.multiplyScalar(lerp(1, 0.35, sstep(2, 20, y)) * lerp(1, 0.55, sstep(X0, X1, x)));
  const BR = finish(K.BRICK, 0.03), D = X1 - X0;
  for (const sg of [1, -1]) pb.add(new THREE.PlaneGeometry(D, 11, 4, 3).rotateY(sg > 0 ? Math.PI : 0), { p: [(X0 + X1) / 2, 5.5, ZC + sg * 13], c: '#5a4c44', finish: BR, uvf: (x, y) => [x, y], tint: soot });
  const brl = new THREE.CylinderGeometry(13, 13, D, 20, 3, true, 0, Math.PI); brl.rotateZ(Math.PI / 2);
  pb.add(brl, { p: [(X0 + X1) / 2, 11, ZC], c: '#4a3e38', finish: BR, uvf: (x, y, z) => [x, Math.atan2(y - 11, z - ZC) * 13], tint: soot });
  pb.add(new THREE.PlaneGeometry(26, 24, 4, 4).rotateY(-Math.PI / 2), { p: [X1, 12, ZC], c: '#3c322e', finish: BR, uvf: (x, y, z) => [z, y], tint: soot });
  pb.add(new THREE.PlaneGeometry(D + 3, 26, 4, 4).rotateX(-Math.PI / 2), { p: [(XW + X1) / 2, 0.03, ZC], c: '#4c4744', finish: finish(K.STONE, 0.05), uvf: (x, y, z) => [x, z] });
  // firedogs and logs
  for (const sg of [1, -1]) { const z = ZC + sg * 8.6;
    pb.add(rbox(0.7, 6.2, 0.7, 0.12), { p: [XW + 3.2, 3.1, z], c: IRON, finish: S_IRON }); pb.add(sph(0.75, 12, 8), { p: [XW + 3.2, 6.9, z], c: IRON, finish: finish(K.MATTE, 0.5) });
    pb.add(new THREE.TorusGeometry(0.5, 0.14, 6, 12), { p: [XW + 3.2, 5.6, z], r: [Math.PI / 2, 0, 0], c: IRON, finish: S_IRON });
    pb.add(rbox(9, 0.5, 0.6, 0.1), { p: [XW + 7.6, 1.9, z], c: IRON, finish: S_IRON }); pb.add(rbox(0.6, 1.9, 0.6, 0.1), { p: [XW + 11.6, 0.95, z], c: IRON, finish: S_IRON }); }
  const log = (x, y, z, len, r, rot, tilt = 0) => { const g = cyl(r, r * 1.08, len, 10, 1); g.rotateX(Math.PI / 2);
    pb.add(g, { p: [x, y, z], r: [tilt, rot, 0], c: new THREE.Color('#5c4a3a').lerp(new THREE.Color('#8a745c'), rng()), finish: S_WOOD, uv: [6, len],
      tint: (px, py, pz, c, lx, ly, lz, n) => { if (Math.abs(lz) > len / 2 - 0.01) c.set('#c9b08a').multiplyScalar(0.75 + 0.25 * Math.cos(Math.hypot(lx, ly) * 14)); } }); };
  log(XW + 6.5, 2.9, ZC, 21, 1.15, 0.03); log(XW + 9, 2.8, ZC + 1, 20, 0.95, -0.05); log(XW + 7.8, 4.6, ZC - 0.5, 18, 0.9, 0.08); log(XW + 5.2, 4.3, ZC + 2, 14, 0.7, 0.3, 0.05);
  const ash = sph(1, 12, 6); ash.scale(6, 0.5, 9); pb.add(ash, { p: [XW + 8, 0.1, ZC], c: '#7d7a78', finish: finish(K.MATTE, 0.02) });
  // firewood stacks either side of the cartouche, cut ends to the room
  for (const sg of [1, -1]) { const zc = ZC + sg * 28.2; await tick();
    for (let row = 0; row < 6; row++) for (let k = 0; k < 6 - Math.floor(row / 2); k++) { const r = 0.55 + 0.2 * rng();
      const g = cyl(r, r, 5.5, 9, 1); g.rotateZ(Math.PI / 2);
      pb.add(g, { p: [XW - 2.95 + rng() * 0.5, 0.65 + row * 1.12, zc + (k - (6 - Math.floor(row / 2)) / 2 + 0.5) * 1.3 + (rng() - 0.5) * 0.2], c: new THREE.Color('#4e4034').lerp(new THREE.Color('#77644f'), rng()), finish: S_WOOD, uv: [5, 5],
        tint: (px, py, pz, c, lx, ly, lz) => { if (lx < -2.74) c.set('#bfa783').multiplyScalar(0.7 + 0.3 * Math.cos(Math.hypot(ly, lz) * 16)); } }); }
    blobs.push([XW - 3.4, 0.04, zc, 5, 5.2, 0.55]);
  }
  // ---- cartouche: glazed relief, white with green edges and manganese hollows, one lemon-yellow fillet
  const XF = XW - 0.55, G = finish(K.FAIENCE, 0.75), noPat = () => [0, -100], cW = new THREE.Color('#f1f3ee'), cB = PIG.mid, cN = PIG.deep;
  const glaze = (x, y, z, c, lx, ly, lz, n) => { const f = -n.x; c.copy(cB).lerp(cW, sstep(0.66, 0.97, f)); if (f < 0.45) c.copy(cN); };
  const P = (y, dz) => [XF, y, ZC + dz];
  const spiral = (cy, dz, r0, turns, a0, dir, rad) => { const pts = []; const n = Math.round(turns * 14);
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + dir * t * turns * 6.283, r = r0 * (1 - 0.86 * t); pts.push(P(cy + Math.sin(a) * r, dz + Math.cos(a) * r)); }
    const g = tube(pts, rad, 10, n * 2); pb.add(g, { c: '#ffffff', finish: G, uvf: noPat, tint: glaze, s: [1, 1, 1] });
    pb.add(sph(rad * 1.5, 12, 8), { p: pts[n], s: [0.7, 1, 1], c: '#ffffff', finish: G, uvf: noPat, tint: glaze }); return pts[0]; };
  const bar = (pts, rad) => pb.add(tube(pts, rad, 10, pts.length * 5), { c: '#ffffff', finish: G, uvf: noPat, tint: glaze });
  for (const sg of [1, -1]) {
    await tick();
    const a = spiral(5.6, sg * 20.6, 3.5, 1.6, Math.PI / 2, sg, 0.62), b = spiral(29.2, sg * 19.2, 3.1, 1.5, -Math.PI / 2, sg, 0.56);
    bar([a, P(12, sg * 21.6), P(19, sg * 20.2), P(24.5, sg * 21.2), b], 0.6);
    const c = spiral(35.2, sg * 9.5, 2.6, 1.4, 0, -sg, 0.5), d = spiral(31.6, sg * 15.6, 2.0, 1.3, Math.PI, sg, 0.45);
    bar([c, P(37.6, sg * 6.5), P(38.3, sg * 3.2)], 0.48); bar([d, P(33.3, sg * 13.5), P(34.0, sg * 11.3)], 0.42);
    // panels behind the consoles: plain glazed pilaster strips with a painted edge
    pb.add(rbox(0.5, 26, 3.2, 0.12), { p: [XW - 0.2, 14.5, ZC + sg * 20.4], c: '#e4e9ee', finish: G, uvf: noPat, tint: (x, y, z, c2) => { if (Math.abs(Math.abs(z - (ZC + sg * 20.4)) - 1.3) < 0.12) c2.copy(cB); } });
    for (let k = 0; k < 6; k++) { const side = k % 2 ? 1 : -1, lf = sph(1, 10, 8); lf.scale(0.42, 1.7, 0.62); lf.translate(0, 1.5, 0);       // leaf lobes sprouting from the console
      pb.add(lf, { m: new THREE.Matrix4().compose(new THREE.Vector3(XF + 0.15, 9.2 + k * 2.9, ZC + sg * (20.9 + side * 0.5)), new THREE.Quaternion().setFromEuler(new THREE.Euler(side * sg * 0.95, 0, 0)), new THREE.Vector3(1, 1, 1)), c: '#ffffff', finish: G, uvf: noPat,
        tint: (x, y, z, c2, lx, ly, lz, n) => { const f = -n.x; c2.copy(cB).lerp(cW, sstep(0.5, 0.95, f)); if (ly > 2.6) c2.lerp(cN, 0.7); } }); }
  }
  await tick();
  // the palmette: nine lobes fanned from a boss, green in the grooves and at the lip
  const hy = 31.2;
  for (let i = 0; i < 9; i++) { const a = ((i - 4) / 4) * 1.32, len = 7.6 - 1.3 * Math.abs(i - 4) / 4, g = sph(1, 10, 10); g.scale(0.5, len / 2, 0.78); g.translate(0, len / 2, 0);
    pb.add(g, { m: new THREE.Matrix4().compose(new THREE.Vector3(XF + 0.1, hy, ZC), new THREE.Quaternion().setFromEuler(new THREE.Euler(-a, 0, 0)), new THREE.Vector3(1, 1, 1)), c: '#ffffff', finish: G, uvf: noPat,
      tint: (x, y, z, c, lx, ly, lz, n) => { const f = -n.x; c.copy(cB).lerp(cW, sstep(0.3, 0.8, f)); if (ly > len * 0.88) c.lerp(cB, 0.8); } }); }
  pb.add(sph(1.5, 14, 10), { p: [XF, hy, ZC], s: [0.6, 1, 1.25], c: '#ffffff', finish: G, uvf: noPat, tint: glaze });
  pb.add(sph(0.7, 10, 8), { p: [XF - 0.7, hy, ZC], s: [0.7, 1, 1], c: LEMON, finish: G, uvf: noPat });
  // keystone
  pb.add(rbox(1.5, 5.6, 3.4, 0.25), { p: [XW - 0.8, 26.4, ZC], c: '#ffffff', finish: G, uvf: noPat, tint: glaze });
  pb.add(sph(0.9, 10, 8), { p: [XW - 1.6, 26.6, ZC], s: [0.6, 1.4, 1], c: cB, finish: G, uvf: noPat });
  await tick();
  // the yellow fillet: round the architrave and round the whole cartouche
  const Y = { c: LEMON, finish: finish(K.FAIENCE, 0.8), uvf: noPat };
  const arc = []; for (let i = 0; i <= 28; i++) { const f = (i / 28) * Math.PI; arc.push([XW - 1.0, 11 + 17.9 * Math.sin(f), ZC + 17.9 * Math.cos(f)]); }
  pb.add(tube([[XW - 1.0, 0.3, ZC + 17.9], [XW - 1.0, 5.5, ZC + 17.9], ...arc, [XW - 1.0, 5.5, ZC - 17.9], [XW - 1.0, 0.3, ZC - 17.9]], 0.3, 7, 90), Y);
  const out = [[0.3, 22.6], [9, 23.4], [20, 22.4], [28.5, 23.2], [33, 20.5], [34.6, 15.5], [37.2, 11.8], [38.6, 7], [40.6, 3.4], [41.2, 0]];
  const ring = [...out.map(([y, dz]) => [XW - 0.3, y, ZC + dz]), ...out.slice(0, -1).reverse().map(([y, dz]) => [XW - 0.3, y, ZC - dz])];
  pb.add(tube(ring, 0.3, 7, 110), Y);
}

// the hanging cauldron under the second chimney (its own mesh: it swings). Local origin = the hook in the vault.
function cauldronGeometry(rng, drop) {
  const pb = makePB(), B = [[0, 0], [1.2, 0.05], [2.4, 0.6], [3.0, 1.7], [3.1, 2.9], [2.8, 3.9], [2.62, 4.3], [2.8, 4.45], [2.82, 4.6], [2.6, 4.62]], I = [[2.6, 4.62], [2.6, 4.0], [0, 3.9]];
  const y0 = -drop;
  pb.add(lathe(B, 40), { p: [0, y0, 0], c: COPPER, finish: S_COPPER, uv: [19, profLen(B)], tint: (x, y, z, c) => c.multiplyScalar(0.3 + 0.7 * sstep(y0 + 0.4, y0 + 3.2, y)) });
  pb.add(lathe(I, 40), { p: [0, y0, 0], c: TIN, finish: finish(K.COPPER, 0.6, 1), uv: [16, 1] });
  pb.add(new THREE.CircleGeometry(2.6, 30).rotateX(-Math.PI / 2), { p: [0, y0 + 4.05, 0], c: '#7d858e', finish: S_TINM });
  for (let i = 0; i < 34; i++) { const a = (i / 34) * 6.283; pb.add(sph(0.09, 6, 4), { p: [Math.cos(a) * 2.9, y0 + 3.75, Math.sin(a) * 2.9], c: '#e09a5c', finish: S_COPPER }); }
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4, px = Math.cos(a) * 2.75, pz = Math.sin(a) * 2.75;
    pb.add(rbox(0.5, 0.8, 0.2, 0.06), { p: [px, y0 + 4.3, pz], r: [0, -a + Math.PI / 2, 0], c: IRON, finish: S_IRON });
    pb.add(tube([[px, y0 + 4.5, pz], [px * 0.5, y0 + 7.2, pz * 0.5], [0, y0 + 9.6, 0]], 0.09, 5, 8), { c: IRON, finish: S_IRON }); }
  pb.add(new THREE.TorusGeometry(0.5, 0.12, 6, 12), { p: [0, y0 + 9.9, 0], c: IRON, finish: S_IRON });
  pb.add(cyl(0.11, 0.11, drop - 10.2, 6), { p: [0, (y0 + 10.2) / 2, 0], c: IRON, finish: S_IRON });
  for (let y = y0 + 10.8; y < -0.5; y += 1.25) pb.add(new THREE.TorusGeometry(0.26, 0.075, 5, 8), { p: [0, y, 0], r: [0, rng() * 3, 0], s: [1, 1.5, 1], c: IRON, finish: S_IRON });
  return pb.build();
}

// soft contact shadows: one mesh of dark discs lying on floor and table
function blobGeometry(list) {
  const g = new THREE.BufferGeometry(), pos = [], uv = [], al = [], idx = [];
  list.forEach(([x, y, z, rx, rz, a], i) => { const b = i * 4;
    pos.push(x - rx, y, z - rz, x + rx, y, z - rz, x + rx, y, z + rz, x - rx, y, z + rz); uv.push(-1, -1, 1, -1, 1, 1, -1, 1); al.push(a, a, a, a); idx.push(b, b + 2, b + 1, b, b + 3, b + 2); });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aA', new THREE.Float32BufferAttribute(al, 1)); g.setIndex(idx);
  return g;
}
const blobMaterial = (color) => new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(color) } }]), fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  vertexShader: /* glsl */`attribute float aA; varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
void main(){ vUv = uv; vA = aA; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
  fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vA;
#include <fog_pars_fragment>
void main(){ float r = vA < 0. ? max(abs(vUv.x), abs(vUv.y)) : length(vUv), a = abs(vA) * (1. - smoothstep(vA < 0. ? .82 : .25, 1., r)); gl_FragColor = vec4(uCol, a);
  #include <fog_fragment>
}` });

// rare visit: a blizzard of loose tiles round the clear tube while every wall lets go (u 0.50-0.70)
function makeBlizzard(HU, count, rng) {
  const q = new THREE.PlaneGeometry(0.75, 0.75), g = new THREE.InstancedBufferGeometry(), seeds = new Float32Array(count * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rng();
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(40, 20, -320), 140);
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uU: HU.uU, uTube: HU.uTube, uAmb: HU.uAmb, uSunCol: HU.uSunCol, uTin: HU.uTin, uPigLeaf: HU.uPigLeaf, uPigSun: HU.uPigSun, uPigDark: HU.uPigDark, uBiscuit: HU.uBiscuit };
  const material = new THREE.ShaderMaterial({ uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aSeed; uniform float uTime, uU; uniform vec4 uTube; varying vec3 vN, vP; varying float vS;
#include <fog_pars_vertex>
vec3 rotAx(vec3 v, vec3 ax, float a){ float c = cos(a), s = sin(a); return v * c + cross(ax, v) * s + ax * dot(ax, v) * (1. - c); }
void main(){
  float env = smoothstep(.50, .54, uU) * (1. - smoothstep(.63, .70, uU));
  vec3 f = fract(aSeed.xyz + vec3(.011, .017, -.013) * uTime * (.4 + aSeed.w));
  vec3 c = vec3(-30., 3., -393.) + f * vec3(140., 37., 140.);
  float inL = (c.x < 31. || c.z < -332.) ? 1. : 0.;
  vec3 e = smoothstep(0., .06, f) * (1. - smoothstep(.94, 1., f));
  float sc = env * inL * e.x * e.y * e.z;
  vec2 cc = vec2(uTube.x + uTube.z, uTube.y); vec3 cp;
  if (c.z > cc.y) cp = vec3(uTube.x, uTube.w, c.z);
  else if (c.x > cc.x) cp = vec3(c.x, uTube.w, cc.y - uTube.z);
  else { vec2 d = c.xz - cc; float l = max(length(d), 1e-3); cp = vec3(cc.x + d.x / l * uTube.z, uTube.w, cc.y + d.y / l * uTube.z); }
  vec3 dv = c - cp + vec3(.01, .03, .01); float l2 = max(length(dv), 1e-3);
  c += dv / l2 * max(8.5 - l2, 0.);
  vec3 ax = normalize(aSeed.xyz - .5 + vec3(1e-3, 2e-3, 0.));
  float ang = uTime * (1.5 + 3. * aSeed.w) + aSeed.x * 40.;
  vN = rotAx(vec3(0., 0., 1.), ax, ang); vP = c + rotAx(position * sc, ax, ang); vS = aSeed.w;
  vec4 mvPosition = viewMatrix * vec4(vP, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`uniform vec3 uAmb, uSunCol, uTin, uPigLeaf, uPigSun, uPigDark, uBiscuit; varying vec3 vN, vP; varying float vS;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), Vd = cameraPosition - vP, V = Vd / max(length(Vd), 1e-4);
  float face = gl_FrontFacing ? 1. : 0.; if (face < .5) N = -N;
  vec3 pg = vS < .66 ? uPigLeaf : (vS < .84 ? uPigSun : uPigDark);
  vec3 alb = mix(uBiscuit * .62, uTin * exp(-step(.45, vS) * (.3 + vS) * pg), face);
  vec3 col = alb * (uAmb * (.7 + .3 * N.y) + uSunCol * .05);
  vec3 dd = vec3(206., 15., -330.) - vP; float g = max(dot(reflect(-V, N), dd / max(length(dd), 1e-4)), 0.); g *= g; g *= g; g *= g; g *= g; g *= g;
  col += face * uSunCol * g * 1.2;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
  const object = new THREE.Mesh(g, material); object.frustumCulled = false; q.dispose();
  return { object, uniforms };
}

// ------------------------------------------------------------------ the working kitchen: things that stand, lie and hang everywhere
// Each kind is built once as a small merged geometry (a "proto") and placed many times with put(); o.c tints a placement.
const M4 = (x, y, z, ry = 0, s = 1, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
const put = (pb, proto, x, y, z, ry = 0, s = 1, o = {}) => pb.add(proto.clone(), { m: M4(x, y, z, ry, s, o.rx || 0, o.rz || 0), c: o.c, sway: o.sway });
const ORANGE = '#e2812a', CRUST = '#b3702f', GARLIC = '#ece6d6', PEPPER = '#a8391f', HAM = '#8a4f36';
const S_BREAD = finish(K.BREAD, 0.04), S_TERRA = finish(K.MATTE, 0.14);
async function makeProtos(rng, PIG, tick) {
  const P = {}, sub = (fn) => { const pb = makePB(); fn(pb); return pb.build(); };
  // oil jar: two ear handles, a rope round the neck, a wooden lid
  P.jar = sub((pb) => {
    pb.add(lathe(JAR, 14), { c: '#b07a55', finish: S_TERRA, uv: [12, 9], tint: (x, y, z, c) => { if (Math.abs(y - 4.6) < 0.16 || Math.abs(y - 2.0) < 0.1) c.lerp(new THREE.Color('#e9e6dc'), 0.75); c.multiplyScalar(0.72 + 0.28 * sstep(0, 2.5, y)); } });
    for (const sg of [1, -1]) pb.add(new THREE.TorusGeometry(0.72, 0.17, 4, 6, Math.PI).rotateZ(-sg * Math.PI / 2), { p: [sg * 1.62, 5.45, 0], c: '#9a6646', finish: S_TERRA });
    pb.add(new THREE.TorusGeometry(1.42, 0.09, 3, 12).rotateX(Math.PI / 2), { p: [0, 6.12, 0], c: '#c9b48a', finish: finish(K.MATTE, 0.05) });
    pb.add(cyl(1.5, 1.42, 0.26, 12), { p: [0, 6.84, 0], c: '#7d6850', finish: S_WOOD, uv: [3, 1] });
    pb.add(sph(0.28, 7, 5), { p: [0, 7.1, 0], c: '#5e4a38', finish: S_WOOD });
  });
  await tick();
  // a copper pan to hang by its handle
  P.pan = sub((pb) => addPan(pb, { p: [0, 0, 0], r: 1.6, h: 0.9, handle: 2.4 }));
  await tick();
  // loaves: a round boule and a long loaf, floured and slashed (uv = loaf-local metres for the bread finish)
  const loaf = (sx, sy, sz) => sub((pb) => { const g = sph(1, 12, 7); g.scale(sx, sy, sz); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, Math.max(p.getY(i), -sy * 0.45) + sy * 0.45); g.computeVertexNormals();
    pb.add(g, { c: CRUST, finish: S_BREAD, uvf: (x, y, z) => [x, z], tint: (x, y, z, c) => c.multiplyScalar(0.6 + 0.4 * sstep(0, sy * 0.8, y)) }); });
  P.boule = loaf(1.3, 0.72, 1.3); P.baton = loaf(2.3, 0.62, 0.9);
  P.board = sub((pb) => pb.add(rbox(4.6, 0.26, 2.9, 0.08), { p: [0, 0.13, 0], c: WOOD, finish: S_WOOD, uvf: (x, y, z) => [x, z] }));
  await tick();
  // five glazed bowls nested in a stack
  P.bowls = sub((pb) => { const O = [[0, 0], [0.55, 0], [0.62, 0.08], [1.35, 0.72], [1.5, 0.78]], I = [[1.5, 0.78], [1.42, 0.8], [0.6, 0.2], [0, 0.18]];
    for (let k = 0; k < 5; k++) pb.add(lathe(O, 14), { p: [(k % 2) * 0.05, k * 0.27, 0], c: '#ffffff', finish: finish(K.FAIENCE, 0.75), uv: [8, profLen(O)] });
    pb.add(lathe(I, 14), { p: [0, 4 * 0.27, 0], c: '#eef0ea', finish: finish(K.FAIENCE, 0.75), uvf: () => [0, -100], tint: (x, y, z, c) => c.multiplyScalar(0.6 + 0.4 * sstep(1.2, 1.9, y)) }); });
  // the same, rounder and four high, for the stacks that stand beside the flight
  P.bowlsHi = sub((pb) => { const O = [[0, 0], [0.55, 0], [0.62, 0.08], [1.0, 0.4], [1.35, 0.72], [1.5, 0.78]], I = [[1.5, 0.78], [1.42, 0.8], [1.0, 0.46], [0.6, 0.2], [0, 0.18]];
    for (let k = 0; k < 4; k++) pb.add(lathe(O, 30), { p: [(k % 2) * 0.05, k * 0.27, 0], c: '#ffffff', finish: finish(K.FAIENCE, 0.75), uv: [8, profLen(O)] });
    pb.add(lathe(I, 30), { p: [0, 3 * 0.27, 0], c: '#eef0ea', finish: finish(K.FAIENCE, 0.75), uvf: () => [0, -100], tint: (x, y, z, c) => c.multiplyScalar(0.6 + 0.4 * sstep(0.95, 1.6, y)) }); });
  await tick();
  // wicker baskets heaped with lemons or oranges
  const basket = (fruit) => sub((pb) => { const B = [[0, 0], [1.5, 0], [1.75, 0.2], [2.25, 1.6], [2.5, 2.7], [2.62, 2.85], [2.5, 2.95], [2.3, 2.8], [2.05, 1.5], [0, 1.3]];
    pb.add(lathe(B, 14), { c: '#9a7848', finish: S_WOOD, uv: [3, 1.2], tint: (x, y, z, c) => c.multiplyScalar(0.62 + 0.38 * Math.abs(Math.sin(y * 7)) * (0.8 + 0.2 * Math.sin(Math.atan2(z, x) * 22))) });
    for (const sg of [1, -1]) pb.add(new THREE.TorusGeometry(0.5, 0.09, 5, 8, Math.PI), { p: [sg * 2.45, 2.55, 0], r: [0, Math.PI / 2, 0], c: '#5e4628', finish: S_WOOD });
    const lem = fruit === 'lemon', m = sph(2.2, 10, 4); m.scale(1, 0.5, 1); pb.add(m, { p: [0, 2.45, 0], c: lem ? '#8d7a12' : '#8a4a12', finish: S_LEMON });
    for (let i = 0; i < 11; i++) { const r = 1.9 * Math.sqrt((i + 0.5) / 11), a = i * 2.39996 + rng(), g = sph(lem ? 0.4 : 0.48, 7, 5); if (lem) g.scale(1.3, 0.85, 0.85);
      pb.add(g, { p: [Math.cos(a) * r, 2.78 + 0.78 * (1 - (r / 2.2) * (r / 2.2)), Math.sin(a) * r], r: [rng() * 6.28, rng() * 6.28, rng() - 0.5],
        c: new THREE.Color(lem ? LEMON : ORANGE).lerp(new THREE.Color(lem ? '#ffe04a' : '#f2a03a'), rng() * 0.6), finish: S_LEMON }); } });
  P.basketL = basket('lemon'); await tick(); P.basketO = basket('orange');
  await tick();
  // a tied sack of flour with two printed bands
  P.sack = sub((pb) => { const S = [[0, 0], [1.6, 0], [2.0, 0.45], [2.12, 2.2], [1.75, 3.4], [0.9, 3.95], [0.68, 4.2], [1.1, 4.7], [0.92, 4.78], [0, 4.4]];
    pb.add(lathe(S, 12), { s: [1, 1, 0.82], c: '#d8cdb4', finish: finish(K.LINEN, 0.02), uv: [11, 2.2], tint: (x, y, z, c) => c.multiplyScalar(0.72 + 0.28 * sstep(0, 2, y) - 0.1 * Math.sin(Math.atan2(z, x) * 5 + y)) });
    pb.add(new THREE.TorusGeometry(0.72, 0.08, 4, 10).rotateX(Math.PI / 2), { p: [0, 4.2, 0], c: '#8a7350', finish: finish(K.MATTE, 0.05) }); });
  // a plate lying face up (the dresser stands them on edge): painted rim and boss
  P.plate = sub((pb) => pb.add(lathe([[0, 0], [1.1, 0.02], [1.7, 0.2], [1.76, 0.27], [1.66, 0.3], [1.1, 0.13], [0.45, 0.12], [0, 0.12]], 12), { c: '#f4f5f0', finish: finish(K.FAIENCE, 0.75), uvf: () => [0, -100],
    tint: (x, y, z, c) => { const r = Math.hypot(x, z); if (r > 1.6) c.copy(PIG.mid); else if (r < 0.2) c.copy(PIG.deep); else if (r > 1.0 && r < 1.2) c.copy(PIG.pale); } }));
  await tick();
  // hanging things; local origin = the hook, everything hangs below it
  P.ladle = sub((pb) => { pb.add(tube([[0, 0, 0], [0, -1.4, 0.05], [0, -2.9, 0], [0.15, -3.25, 0]], 0.075, 6, 10), { c: COPPER, finish: S_COPPER, uv: [0.5, 3] });
    pb.add(new THREE.SphereGeometry(0.5, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { p: [0.5, -3.1, 0], r: [0, 0, 0.5], c: COPPER, finish: S_COPPER, uv: [3, 1] });
    pb.add(new THREE.TorusGeometry(0.16, 0.05, 4, 8), { p: [0, 0.12, 0], c: IRON, finish: S_IRON }); });
  await tick();
  P.garlic = sub((pb) => { pb.add(tube([[0, 0.2, 0], [0.05, -1.8, 0], [0, -3.7, 0]], 0.1, 5, 6), { c: '#c9b98f', finish: finish(K.MATTE, 0.05) });
    for (let k = 0; k < 11; k++) { const g = sph(0.38, 6, 4); g.scale(1, 0.86, 1); const a = k * 2.2;
      pb.add(g, { p: [Math.cos(a) * 0.3, -0.5 - k * 0.3, Math.sin(a) * 0.3], c: new THREE.Color(GARLIC).lerp(new THREE.Color('#cdb9c9'), rng() * 0.5), finish: finish(K.LEMON, 0.2), tint: (x, y, z, c) => c.multiplyScalar(0.8 + 0.2 * rng()) }); } });
  P.peppers = sub((pb) => { pb.add(cyl(0.05, 0.05, 3.6, 5), { p: [0, -1.7, 0], c: '#c9b98f', finish: finish(K.MATTE, 0.05) });
    for (let k = 0; k < 15; k++) { const a = k * 2.4, g = new THREE.ConeGeometry(0.2, 0.95, 6, 1); g.rotateX(Math.PI); g.translate(0, -0.45, 0);
      pb.add(g, { p: [Math.cos(a) * 0.14, -0.3 - k * 0.22, Math.sin(a) * 0.14], r: [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6], c: new THREE.Color(PEPPER).lerp(new THREE.Color('#c85a2a'), rng() * 0.7), finish: finish(K.LEMON, 0.5) }); } });
  await tick();
  P.ham = sub((pb) => { const H = [[0, 0], [0.5, 0.1], [1.0, 0.9], [1.05, 1.8], [0.72, 2.8], [0.3, 3.5], [0.2, 4.0], [0, 4.05]];
    pb.add(lathe(H, 12), { p: [0, -4.4, 0], s: [1, 1, 0.72], c: HAM, finish: finish(K.MATTE, 0.2), uv: [5, 4], tint: (x, y, z, c) => c.multiplyScalar(0.7 + 0.3 * sstep(-4.4, -2.5, y)) });
    for (const [yy, rr] of [[-3.5, 1.02], [-2.6, 1.06], [-1.7, 0.78]]) pb.add(new THREE.TorusGeometry(rr, 0.05, 4, 12).rotateX(Math.PI / 2), { p: [0, yy, 0], s: [1, 1, 0.72], c: '#d6c7a0', finish: finish(K.MATTE, 0.05) });
    pb.add(cyl(0.05, 0.05, 0.6, 5), { p: [0, -0.2, 0], c: '#d6c7a0', finish: finish(K.MATTE, 0.05) }); });
  P.herbs = sub((pb) => { for (let k = 0; k < 13; k++) { const a = k * 2.4, t = 0.25 + 0.3 * rng();
      pb.add(leafGeo(1.5 + rng() * 0.9, 0.5), { p: [Math.cos(a) * 0.12, -0.5, Math.sin(a) * 0.12], r: [0, a, -Math.PI / 2 + t], c: new THREE.Color('#3d6b3a').lerp(new THREE.Color('#7d8f4a'), rng()), finish: finish(K.LEAF, 0.3, 0.5) }); }
    pb.add(cyl(0.12, 0.2, 0.7, 6), { p: [0, -0.3, 0], c: '#c9b98f', finish: finish(K.MATTE, 0.05) }); });
  await tick();
  P.bucket = sub((pb) => { const B = [[0, 0], [0.5, 0], [0.62, 0.9], [0.66, 0.92], [0.6, 0.86], [0.5, 0.12], [0, 0.1]];
    pb.add(lathe(B, 12), { s: 1.6, c: '#7d6f5e', finish: S_WOOD, uv: [3.6, 2], tint: (x, y, z, c) => { if (Math.abs(y - 0.4) < 0.07 || Math.abs(y - 1.15) < 0.07) c.set('#3a3836'); } });
    pb.add(new THREE.CircleGeometry(0.93, 12).rotateX(-Math.PI / 2), { p: [0, 1.15, 0], c: '#8aa0a2', finish: S_TINM });
    pb.add(new THREE.TorusGeometry(0.96, 0.045, 4, 12, Math.PI), { p: [0, 1.44, 0], r: [0.5, 0, 0], c: IRON, finish: S_IRON }); });
  P.dispose = () => { for (const k in P) if (P[k] && P[k].isBufferGeometry) P[k].dispose(); };
  return P;
}

// a long trestle table of planks. axis 'z' or 'x' is its long direction; h = top height
function addTrestle(pb, rng, cx, cz, len, wid, h, axis, blobs) {
  const W = (a, y, b) => (axis === 'z' ? [cx + b, y, cz + a] : [cx + a, y, cz + b]), box = (l, t, w, r) => (axis === 'z' ? rbox(w, t, l, r) : rbox(l, t, w, r));
  const wc = () => new THREE.Color('#9a7c58').lerp(new THREE.Color('#6f5a42'), rng());
  for (let k = 0; k < 3; k++) pb.add(box(len + (k - 1) * 0.5, 0.45, wid / 3 - 0.08, 0.07), { p: W((rng() - 0.5) * 0.6, h - 0.225, (k - 1) * wid / 3), c: wc(), finish: S_WOOD,
    uvf: (x, y, z) => (axis === 'z' ? [z + k * 7, x] : [x + k * 7, z]) });
  const n = Math.max(2, Math.round(len / 15) + 1);
  for (let i = 0; i < n; i++) { const a = -len / 2 + 2.2 + (i / (n - 1)) * (len - 4.4);
    for (const sg of [1, -1]) pb.add(rbox(0.62, h - 0.4, 0.62, 0.1), { p: W(a, (h - 0.45) / 2, sg * (wid / 2 - 1.1)), r: axis === 'z' ? [0, 0, sg * 0.1] : [-sg * 0.1, 0, 0], c: wc(), finish: S_WOOD, uvf: (x, y, z) => [y, x + z] });
    pb.add(box(0.5, 0.5, wid - 1.4, 0.08), { p: W(a, h * 0.42, 0), c: wc(), finish: S_WOOD, uvf: (x, y, z) => (axis === 'z' ? [x, z] : [z, x]) }); }
  pb.add(box(len - 4, 0.45, 0.42, 0.08), { p: W(0, h * 0.42 - 0.4, 0), c: wc(), finish: S_WOOD, uvf: (x, y, z) => (axis === 'z' ? [z, x] : [x, z]) });
  blobs.push(axis === 'z' ? [cx, 0.04, cz, wid / 2 + 1.6, len / 2 + 1.6, -0.4] : [cx, 0.04, cz, len / 2 + 1.6, wid / 2 + 1.6, -0.4]);
}
// a stone water trough against a wall, fed by a copper spout. o: x, z (centre), len, axis ('z' | 'x'), wall [nx, nz] = direction to the wall
function addTrough(pb, P, o, blobs) {
  const { x, z, len, axis, wall } = o, wd = 3.8, hh = 2.4, st = finish(K.STONE, 0.16);
  const W = (a, y, b) => (axis === 'z' ? [x + b, y, z + a] : [x + a, y, z + b]), box = (l, t, w, r) => (axis === 'z' ? rbox(w, t, l, r) : rbox(l, t, w, r));
  const suv = (px, py, pz) => [px + pz, py * 2 + 1];
  for (const sg of [1, -1]) { pb.add(box(len, hh, 0.55, 0.12), { p: W(0, hh / 2, sg * (wd / 2 - 0.27)), c: '#b9b3a4', finish: st, uvf: suv });
    pb.add(box(0.55, hh, wd - 0.9, 0.12), { p: W(sg * (len / 2 - 0.27), hh / 2, 0), c: '#b0aa9b', finish: st, uvf: suv }); }
  pb.add(new THREE.PlaneGeometry(axis === 'z' ? wd - 1 : len - 1, axis === 'z' ? len - 1 : wd - 1).rotateX(-Math.PI / 2), { p: W(0, hh - 0.42, 0), c: '#6f8c8c', finish: S_TINM });
  // the spout: a boss on the wall, a pipe arcing out, a thread of water
  const wx = x + wall[0] * 2.6, wz = z + wall[1] * 2.6, mx = x + wall[0] * 0.7, mz = z + wall[1] * 0.7;
  pb.add(sph(0.8, 12, 8), { p: [wx, 5.2, wz], s: [1 - 0.5 * Math.abs(wall[0]), 1, 1 - 0.5 * Math.abs(wall[1])], c: COPPER, finish: S_COPPER, uv: [3, 2] });
  pb.add(tube([[wx, 5.2, wz], [(wx + mx) / 2, 5.5, (wz + mz) / 2], [mx, 5.05, mz], [mx, 4.6, mz]], 0.2, 7, 12), { c: COPPER, finish: S_COPPER, uv: [1, 4] });
  pb.add(cyl(0.1, 0.14, 4.6 - hh + 0.42, 6), { p: [mx, (4.6 + hh - 0.42) / 2, mz], c: '#b9d0d4', finish: S_TINM, sway: [0.03, 0, 0.03] });
  blobs.push(axis === 'z' ? [x, 0.04, z, wd / 2 + 1, len / 2 + 1, -0.5] : [x, 0.04, z, len / 2 + 1, wd / 2 + 1, -0.5]);
}
// an iron rail hung from the vault by two rods, with coppers, ladles, garlic, peppers, hams and herbs on hooks.
// o: a0, a1 (extent along the axis), c (the other coordinate), y, axis, top (height the rods reach), kinds
async function addRail(pb, P, rng, o, tick) {
  const { a0, a1, c, y, axis, top } = o, W = (a, yy) => (axis === 'z' ? [c, yy, a] : [a, yy, c]), S_CH = finish(K.MATTE, 0.3);
  pb.add(cyl(0.2, 0.2, a1 - a0 + 1.6, 8)[axis === 'z' ? 'rotateX' : 'rotateZ'](Math.PI / 2), { p: W((a0 + a1) / 2, y), c: IRON, finish: S_IRON });
  for (const a of [a0 - 0.8, a1 + 0.8]) pb.add(sph(0.36, 8, 6), { p: W(a, y), c: IRON, finish: S_IRON });
  for (const a of [a0 + 2, a1 - 2]) { pb.add(cyl(0.11, 0.11, top - y, 6), { p: W(a, (top + y) / 2), c: IRON, finish: S_CH });
    pb.add(new THREE.TorusGeometry(0.34, 0.09, 5, 8), { p: W(a, y + 0.3), r: axis === 'z' ? [0, 0, 0] : [0, Math.PI / 2, 0], c: IRON, finish: S_CH }); }
  const kinds = o.kinds, n = Math.floor((a1 - a0 - 3) / 3.1) + 1;
  for (let i = 0; i < n; i++) {
    const a = a0 + 1.5 + i * 3.1, kind = kinds[i % kinds.length], p = W(a, y), sa = 0.03 * (rng() < 0.5 ? -1 : 1) * (0.6 + 0.6 * rng()), sb = 0.045 * (0.5 + rng());
    const sway = (px, py) => (axis === 'z' ? [sb * (y - py), 0, sa * (y - py)] : [sa * (y - py), 0, sb * (y - py)]);
    pb.add(new THREE.TorusGeometry(0.26, 0.05, 4, 8, Math.PI), { p: [p[0], y - 0.3, p[2]], r: [0, axis === 'z' ? Math.PI / 2 : 0, Math.PI], c: IRON, finish: S_CH });
    if (kind === 'pan') put(pb, P.pan, p[0], y - 0.55 - 4.2, p[2], (axis === 'z' ? 0 : Math.PI / 2) + 1.2 + (rng() - 0.5) * 0.6, 1, { rz: Math.PI / 2 - 0.2, sway });
    else { const drop = 0.5 + (kind === 'ladle' ? 0 : 0.5 + rng() * 0.9);
      pb.add(cyl(0.06, 0.06, drop, 5), { p: [p[0], y - 0.2 - drop / 2, p[2]], c: kind === 'ladle' ? IRON : '#c9b98f', finish: S_CH, sway });
      put(pb, P[kind], p[0], y - 0.2 - drop, p[2], rng() * 6.28, kind === 'ham' ? 1.15 : 1, { sway }); }
    if ((i & 3) === 3) await tick();
  }
}
// the dresser against the short arm's south wall: painted in the look's own wash, three bays of shelves with plates on edge
async function addDresser(pb, P, PIG, rng, x0, x1, zw, blobs, tick) {
  const W = x1 - x0, cx = (x0 + x1) / 2, body = PIG.mid.clone().multiplyScalar(0.72), pale = PIG.pale.clone().multiplyScalar(0.95), PAINT = finish(K.MATTE, 0.22), dark = PIG.deep.clone().multiplyScalar(0.8);
  pb.add(rbox(W + 0.8, 1.0, 5.8, 0.1), { p: [cx, 0.5, zw - 2.9], c: dark, finish: PAINT });
  pb.add(rbox(W, 8.4, 5.2, 0.15), { p: [cx, 5.2, zw - 2.6], c: body, finish: PAINT });
  for (let i = 0; i < 6; i++) { const px = x0 + (i + 0.5) * W / 6;
    pb.add(rbox(W / 6 - 1.0, 6.6, 0.3, 0.1), { p: [px, 5.2, zw - 5.25], c: pale, finish: PAINT });
    pb.add(rbox(W / 6 - 2.4, 5.0, 0.3, 0.12), { p: [px, 5.2, zw - 5.42], c: body, finish: PAINT });
    pb.add(sph(0.32, 8, 6), { p: [px + (i % 2 ? -1 : 1) * (W / 12 - 1.0), 5.6, zw - 5.6], c: COPPER, finish: S_COPPER }); }
  await tick();
  pb.add(rbox(W + 1.4, 0.6, 6.2, 0.14), { p: [cx, 9.7, zw - 2.9], c: '#8a7458', finish: S_WOOD, uvf: (x, y, z) => [x, z + 3] });
  pb.add(rbox(W, 17.6, 0.5, 0.1), { p: [cx, 18.8, zw - 0.3], c: body, finish: PAINT });
  for (const px of [x0 + 0.4, x0 + W / 3, x0 + 2 * W / 3, x1 - 0.4]) pb.add(rbox(0.8, 17.6, 3.3, 0.12), { p: [px, 18.8, zw - 1.65], c: pale, finish: PAINT });
  for (const sy of [14.6, 20.2]) { pb.add(rbox(W, 0.45, 3.3, 0.1), { p: [cx, sy, zw - 1.65], c: pale, finish: PAINT });
    pb.add(rbox(W, 0.5, 0.2, 0.06), { p: [cx, sy + 0.45, zw - 3.1], c: body, finish: PAINT }); }
  pb.add(rbox(W + 1.0, 0.9, 3.8, 0.12), { p: [cx, 27.9, zw - 1.9], c: pale, finish: PAINT });
  pb.add(rbox(W + 2.2, 1.2, 4.6, 0.2), { p: [cx, 28.9, zw - 2.3], c: body, finish: PAINT });
  for (let i = 0; i < 13; i++) pb.add(sph(1, 8, 5), { p: [x0 + 1.6 + i * (W - 3.2) / 12, 27.3, zw - 3.5], s: [1.1, 0.75, 0.25], c: i % 2 ? pale : body, finish: PAINT });      // a scalloped apron under the cornice
  await tick();
  // plates on edge, leaning back against the board
  for (const [sy, s, off] of [[10.0, 1.12, 0], [15.05, 1.0, 0.5], [20.65, 0.86, 0]]) { const n = sy < 11 ? 5 : 10;
    for (let i = 0; i < n; i++) { const px = sy < 11 ? x0 + 4 + i * (W - 8) / 4 : x0 + 2.6 + (i + off * 0.3) * (W - 5.2) / 9.3; if (sy > 11 && (Math.abs(px - x0 - W / 3) < 1.9 || Math.abs(px - x0 - 2 * W / 3) < 1.9)) continue;
      put(pb, P.plate, px, sy + 1.82 * s, zw - (sy < 11 ? 1.0 : 0.95), 0, s, { rx: -Math.PI / 2 + 0.16 }); }
    await tick(); }
  // on the worktop: crocks, stacked bowls, a basket of oranges, a board of loaves
  for (const [dx, kind, s] of [[3, 'jar', 0.5], [7.4, 'bowls', 1.5], [12.5, 'basketO', 0.62], [17, 'jar', 0.42], [23.5, 'bowls', 1.3], [28, 'jar', 0.5], [33, 'basketL', 0.62], [37, 'bowls', 1.5]]) {
    put(pb, P[kind], x0 + dx, 10.0, zw - 4.2 + (rng() - 0.5) * 0.6, rng() * 6.28, s); blobs.push([x0 + dx, 10.03, zw - 4.2, 1.9 * s + 0.6, 1.9 * s + 0.6, 0.5]); }
  put(pb, P.board, x0 + 20, 10.0, zw - 4.4, 0.1, 0.85); put(pb, P.boule, x0 + 19.4, 10.22, zw - 4.4, 0.7, 0.9); put(pb, P.boule, x0 + 21.2, 10.22, zw - 4.5, 2.2, 0.75);
  blobs.push([cx, 0.04, zw - 3.2, W / 2 + 2, 4.6, -0.5]);
}
// a ring of brick with glowing coals and logs under the hanging cauldron
function addFireRing(pb, rng, x, z, hot, blobs) {
  const ring = new THREE.TorusGeometry(4.3, 0.95, 6, 22).rotateX(Math.PI / 2); ring.scale(1, 0.85, 1);
  pb.add(ring, { p: [x, 0.7, z], c: '#8a5a44', finish: finish(K.BRICK, 0.03), uvf: (px, py, pz) => [Math.atan2(pz - z, px - x) * 4.3, py * 1.6 + Math.hypot(px - x, pz - z)] });
  const coal = sph(1, 14, 5); coal.scale(3.5, 0.5, 3.5);
  pb.add(coal, { p: [x, 0.35, z], c: '#ff6a22', finish: finish(K.GLOW), tint: (px, py, pz, c) => c.multiplyScalar((hot ? 1.1 : 0.55) * (0.25 + 1.6 * rng() * rng())) });
  for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.4, g = cyl(0.42, 0.5, 5.2, 8, 1); g.rotateZ(Math.PI / 2);
    pb.add(g, { p: [x + Math.cos(a) * 1.3, 1.0 + 0.25 * k, z + Math.sin(a) * 1.3], r: [0, -a, 0.12], c: new THREE.Color('#3a2e26').lerp(new THREE.Color('#6a5644'), rng()), finish: S_WOOD, uv: [5, 5] }); }
  blobs.push([x, 0.04, z, 6.4, 6.4, 0.5]);
}

// where everything goes. Four meshes by zone (so what is behind the camera is culled): a = long arm south of the stone
// table, b = long arm north, c = short arm west of the door pool, d = short arm east.
async function dressKitchen(PB, P, rng, PIG, L, blobs, tick, TY) {
  const jt = () => new THREE.Color('#ffffff').lerp(new THREE.Color('#b9a08c'), rng() * 0.7);
  const jar = (pb, x, z, s) => { put(pb, P.jar, x, 0, z, rng() * 6.28, s, { c: jt() }); blobs.push([x, 0.04, z, 3.2 * s, 3.2 * s, 0.6]); };
  const basket = (pb, k, x, z, s, y = 0) => { put(pb, k === 'O' ? P.basketO : P.basketL, x, y, z, rng() * 6.28, s); blobs.push([x, y + 0.04, z, 3.3 * s, 3.3 * s, 0.6]); };
  const sack = (pb, x, z, s, lean = 0) => { put(pb, P.sack, x, 0, z, rng() * 6.28, s, { rz: lean, c: jt() }); blobs.push([x, 0.04, z, 2.7 * s, 2.7 * s, 0.6]); };
  const bucket = (pb, x, z, s) => { put(pb, P.bucket, x, 0, z, rng() * 6.28, s); blobs.push([x, 0.04, z, 1.5 * s, 1.5 * s, 0.55]); };
  const bowls = (pb, x, y, z, s, hi = false) => { put(pb, hi ? P.bowlsHi : P.bowls, x, y, z, rng() * 6.28, s); blobs.push([x, y + 0.03, z, 1.9 * s, 1.9 * s, 0.55]); };
  // a board of loaves: kinds is a string of 'o' (boule) and 'l' (long loaf)
  const bread = (pb, x, y, z, ry, kinds, board = true) => { if (board) put(pb, P.board, x, y, z, ry, 1); const y0 = y + (board ? 0.26 : 0), n = kinds.length;
    for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 1.9, lx = x + Math.cos(ry) * a, lz = z - Math.sin(ry) * a + (rng() - 0.5) * 0.5;
      put(pb, kinds[i] === 'o' ? P.boule : P.baton, lx, y0, lz, kinds[i] === 'o' ? rng() * 6.28 : ry + 1.2 + rng() * 0.5, 0.62 + 0.16 * rng(), { c: new THREE.Color('#ffffff').lerp(new THREE.Color('#d9b890'), rng()) }); }
    blobs.push([x, y + 0.03, z, 3.2, 2.4, 0.5]); };
  const plates = (pb, x, y, z, n) => { for (let i = 0; i < n; i++) put(pb, P.plate, x + (rng() - 0.5) * 0.1, y + i * 0.17, z + (rng() - 0.5) * 0.1, rng() * 6.28, 0.62); blobs.push([x, y + 0.03, z, 1.5, 1.5, 0.5]); };
  const lying = (pb, proto, x, y, z, ry) => put(pb, proto, x, y + 0.4, z, ry, 1, { rx: Math.PI / 2 - 0.05 });

  // ---- a: the prep table under the crossing, the mural wall's foot, the delivery by the entry
  let pb = PB.a; const T2 = 4.4;
  addTrestle(pb, rng, 7.5, -84, 50, 9, T2, 'z', blobs);
  pb.add(new THREE.TorusGeometry(1.7, 0.13, 6, 20).rotateX(Math.PI / 2), { p: [7.2, T2 + 0.55, -62.5], c: IRON, finish: S_IRON });
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; pb.add(rbox(0.26, 0.6, 0.26, 0.06), { p: [7.2 + Math.cos(a) * 1.7, T2 + 0.3, -62.5 + Math.sin(a) * 1.7], c: IRON, finish: S_IRON }); }
  addPan(pb, { p: [7.2, T2 + 0.62, -62.5], r: 2.0, h: 1.25, rot: 2.5, liquid: '#8f8a80' }); blobs.push([7.2, T2 + 0.03, -62.5, 3, 3, 0.6]);
  await tick();
  bread(pb, 5.2, T2, -67.5, 0.2, 'oo'); bowls(pb, 10.2, T2, -67, 1.4, true); basket(pb, 'O', 9.6, -73.5, 0.6, T2); bread(pb, 5.6, T2, -75, -0.15, 'll');
  bowls(pb, 4.8, T2, -80.5, 1.2, true); lying(pb, P.garlic, 9.2, T2, -79.5, 0.4); bread(pb, 9, T2, -87, 0.3, 'ol'); basket(pb, 'L', 5, -94, 0.6, T2);
  await tick();
  plates(pb, 9.8, T2, -96.5, 6); bread(pb, 6, T2, -101.5, -0.2, 'oo'); bowls(pb, 10.2, T2, -104.5, 1.3, true); lying(pb, P.ladle, 5.4, T2, -90, 1.0);
  for (const [lx, lz] of [[4.2, -86.5], [5.2, -88.2], [3.8, -89.4], [10.6, -91], [4.4, -107], [10.4, -77.5]]) { pb.add(lemonGeo(0.6), { p: [lx, T2 + 0.22, lz], r: [0, rng() * 6.28, 0], c: LEMON, finish: S_LEMON }); blobs.push([lx, T2 + 0.03, lz, 0.55, 0.45, 0.6]); }
  await tick();
  for (const [z, s] of [[-6, 0.62], [-11, 0.55], [-76, 0.62], [-81.5, 0.52], [-109, 0.62], [-114.5, 0.56]]) jar(pb, 30.2, z, s);
  pb.add(rbox(2.8, 0.45, 13, 0.1), { p: [30.5, 2.2, -24], c: '#7d6850', finish: S_WOOD, uvf: (x, y, z) => [z, x] });
  for (const dz of [-5.6, 0, 5.6]) pb.add(rbox(2.4, 2.0, 0.5, 0.1), { p: [30.5, 1.0, -24 + dz], c: '#6b5843', finish: S_WOOD, uvf: (x, y, z) => [y, x] });
  blobs.push([30.5, 0.04, -24, 2.4, 7.4, -0.5]);
  put(pb, P.pan, 30.4, 2.45, -19.5, Math.PI * 0.55); put(pb, P.pan, 30.3, 2.45, -24.2, Math.PI * 1.02, 0.85); put(pb, P.pan, 30.4, 2.45, -28.4, Math.PI * 0.5, 0.95);
  await tick();
  basket(pb, 'L', 29.6, -36, 0.8); basket(pb, 'O', 29.4, -42, 0.7); basket(pb, 'O', 29.5, -90, 0.8); basket(pb, 'L', 29.3, -96, 0.66);
  sack(pb, 30.2, -47.5, 0.8); sack(pb, 29.9, -50.6, 0.72); sack(pb, 27.6, -49, 0.66, 0.5); sack(pb, 30.1, -100.5, 0.8); sack(pb, 29.8, -103.6, 0.7);
  addTrough(pb, P, { x: 29.9, z: -63, len: 13, axis: 'z', wall: [1, 0] }, blobs); bucket(pb, 26.6, -58, 0.9); bucket(pb, 27, -68.5, 1.0);
  await tick();
  jar(pb, 8, -45, 0.9); jar(pb, 11.6, -48.5, 0.72); basket(pb, 'L', 14, -43, 0.85); basket(pb, 'O', 3.5, -47, 0.7); sack(pb, 5.5, -51, 0.85); sack(pb, 8.2, -53.6, 0.75); sack(pb, 11, -52, 0.7, 0.45);
  await tick();

  // ---- b: over and on the stone table, between it and the mural wall, the west bench, the north end
  pb = PB.b;
  const KINDS = ['pan', 'garlic', 'ladle', 'ham', 'peppers', 'herbs', 'pan', 'ladle', 'garlic', 'peppers', 'ham'];
  await addRail(pb, P, rng, { a0: -152, a1: -124, c: 2, y: 19, axis: 'z', top: vaultY(2) - 0.4, kinds: KINDS }, tick);
  await addRail(pb, P, rng, { a0: -226, a1: -198, c: 2, y: 19, axis: 'z', top: vaultY(2) - 0.4, kinds: KINDS.slice(3).concat(KINDS) }, tick);
  bread(pb, -3.4, TY, -135.5, 1.4, 'oo'); bread(pb, -3.2, TY, -172.5, 1.5, 'lo'); bread(pb, 6.4, TY + 0.5, -197, 1.3, 'll', false); bread(pb, -2.6, TY, -220.5, 1.5, 'ol');
  await tick();
  bowls(pb, 8.2, TY, -139.5, 1.5, true); bowls(pb, -3.6, TY, -157, 1.4, true); bowls(pb, 7.6, TY, -163, 1.3, true); bowls(pb, -3.4, TY, -209, 1.5, true);
  basket(pb, 'O', -2.8, -145, 0.55, TY); lying(pb, P.garlic, 7.2, TY, -179.5, 0.3);
  await tick();
  for (const [z, s] of [[-123.5, 0.8], [-130, 0.66], [-136, 0.8], [-142.5, 0.6], [-235, 0.75], [-240.5, 0.62]]) jar(pb, 30, z, s);
  await tick();
  sack(pb, 29.8, -149, 0.85); sack(pb, 29.2, -152.6, 0.7); basket(pb, 'O', 16, -150, 0.8); basket(pb, 'L', 18.6, -153.4, 0.7); sack(pb, 15.4, -155, 0.7, 0.4);
  addTrough(pb, P, { x: 29.9, z: -213, len: 14, axis: 'z', wall: [1, 0] }, blobs); bucket(pb, 26.4, -207, 1.0); bucket(pb, 26.8, -219.5, 0.9);
  basket(pb, 'O', 25, -199, 0.9); basket(pb, 'L', 26, -228, 0.8); basket(pb, 'O', 22.5, -231, 0.65);
  await tick();
  addTrestle(pb, rng, -28.4, -215, 56, 5.4, 3.6, 'z', blobs);
  { const B = 3.6; let i = 0; for (const z of [-190, -197, -204, -212, -219, -226, -233, -240]) { const k = i++ % 4;
      if (k === 0) bread(pb, -28.4, B, z, 1.5, i % 3 ? 'oo' : 'lo'); else if (k === 1) bowls(pb, -28.6, B, z, 1.45); else if (k === 2) basket(pb, i % 3 ? 'L' : 'O', -28.5, z, 0.6, B); else { put(pb, P.jar, -28.8, B, z, 1, 0.48, { c: jt() }); blobs.push([-28.8, B + 0.03, z, 1.7, 1.7, 0.55]); }
      if (k === 1) await tick(); } }
  await tick();
  basket(pb, 'L', -29.5, -152, 0.9); basket(pb, 'O', -29.2, -158, 0.8); jar(pb, -29.6, -165, 1.0); jar(pb, -29.6, -172, 0.85); basket(pb, 'L', -29.3, -179, 0.8);
  await tick();
  for (const [z, s] of [[-252, 1], [-259, 0.8], [-266, 1.05], [-290, 0.9], [-297, 1.0], [-304, 0.8]]) jar(pb, -29.5, z, s);
  sack(pb, -29, -274, 0.9); sack(pb, -28.6, -278, 0.8); sack(pb, -29.4, -282, 0.85);
  await tick();
  for (const [x, s] of [[-26, 1.2], [-19.5, 1.0], [-13, 1.25], [14, 1.1], [21, 1.25], [27, 1.0]]) jar(pb, x, -391.3, s);
  basket(pb, 'L', -5, -390.5, 1.2); basket(pb, 'O', 3, -391, 1.1); basket(pb, 'L', 8.5, -389.5, 0.8); sack(pb, -9.5, -391.4, 1.0);
  sack(pb, -21, -344, 0.85); sack(pb, -18, -346.4, 0.7, 0.4); basket(pb, 'O', -22.4, -348.6, 0.8); basket(pb, 'L', 3, -366, 0.85); basket(pb, 'O', 6.6, -368.4, 0.7); jar(pb, 0.4, -369.6, 0.6); sack(pb, 21, -377, 0.8); bucket(pb, 23.6, -375, 1.0);
  await tick();

  // ---- c: the dresser, the fire under the cauldron, the trough and jars under the landing wall
  pb = PB.c;
  await addDresser(pb, P, PIG, rng, 58, 98, -330, blobs, tick);
  jar(pb, 38, -333.6, 0.95); jar(pb, 44, -333.9, 0.78); jar(pb, 50.5, -333.5, 1.0); sack(pb, 103, -333.8, 0.9); sack(pb, 106.6, -334.4, 0.8); basket(pb, 'O', 110.5, -333.8, 0.9);
  addFireRing(pb, rng, 124, -346, L.fire, blobs);
  await tick();
  addTrough(pb, P, { x: 50, z: -392.3, len: 16, axis: 'x', wall: [0, -1] }, blobs); bucket(pb, 40, -390, 1.0); bucket(pb, 60, -389.6, 0.9); bucket(pb, 62.5, -391, 0.8);
  for (const [x, s] of [[68, 0.95], [74, 0.8], [80, 1.0], [86.5, 0.85], [92, 0.7]]) jar(pb, x, -391.6, s);
  basket(pb, 'L', 66, -349, 0.9); basket(pb, 'O', 70.5, -351, 0.75); sack(pb, 63, -352, 0.8); jar(pb, 90, -347.5, 0.6); jar(pb, 93.6, -349, 0.5); bucket(pb, 88, -350, 1.0);
  basket(pb, 'O', 108, -350.5, 0.85); sack(pb, 111.6, -352.5, 0.7);
  sack(pb, 132, -377, 0.85); sack(pb, 135.2, -379, 0.7, 0.4); basket(pb, 'L', 137.5, -375.4, 0.75); jar(pb, 145, -349.5, 0.62); jar(pb, 148.4, -351, 0.5); bucket(pb, 143, -352.4, 1.0);
  await tick();

  // ---- d: the table in the door pool, the rail by the hearth
  pb = PB.d;
  addTrestle(pb, rng, 171, -380, 38, 9, T2, 'x', blobs);
  addPan(pb, { p: [160, T2 + 0.02, -380], r: 2.2, h: 1.5, rot: 0.8, liquid: '#8a8f96' }); blobs.push([160, T2 + 0.03, -380, 3.2, 3.2, 0.6]);
  await tick();
  bread(pb, 166, T2, -378.4, 0.2, 'ol'); bread(pb, 175.4, T2, -381.6, -0.15, 'oo'); bread(pb, 184, T2, -379, 0.1, 'll');
  bowls(pb, 170.2, T2, -382.2, 1.5); bowls(pb, 180, T2, -377.6, 1.3); bowls(pb, 187.6, T2, -382.2, 1.4); basket(pb, 'O', 155.4, -378.4, 0.6, T2); plates(pb, 172.4, T2, -377.4, 7); lying(pb, P.garlic, 164, T2, -382.6, 1.2);
  await tick();
  await addRail(pb, P, rng, { a0: 228, a1: 262, c: -340, y: 18, axis: 'x', top: vaultY(22.5) - 0.4, kinds: ['pan', 'peppers', 'ladle', 'garlic', 'ham', 'herbs'] }, tick);
  sack(pb, 190, -334, 0.9); sack(pb, 193.2, -336.4, 0.75, 0.4); basket(pb, 'O', 222, -350, 0.8); basket(pb, 'L', 225.6, -352.4, 0.65); sack(pb, 219.4, -353, 0.7); jar(pb, 222, -333.8, 0.9); jar(pb, 266, -334, 0.9); jar(pb, 271, -334.3, 0.75);
}

// ------------------------------------------------------------------ the hall beyond the stone table, furnished
// Everything here stands 10 m and more from the eye, so it is built light: its own cheap protos, plank tables on turned legs.
const hallRng = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
async function makeHallProtos(rng, PIG, tick) {
  const P = {}, sub = (fn) => { const pb = makePB(); fn(pb); return pb.build(); }, FA = finish(K.FAIENCE, 0.75), noPat = () => [0, -100];
  P.bowls = sub((pb) => { const O = [[0, 0], [0.55, 0], [0.62, 0.08], [1.35, 0.72], [1.5, 0.78]], I = [[1.5, 0.78], [1.42, 0.8], [0.6, 0.2], [0, 0.18]];
    for (let k = 0; k < 3; k++) pb.add(lathe(O, 16), { p: [(k % 2) * 0.05, k * 0.27, 0], c: '#ffffff', finish: FA, uv: [8, profLen(O)] });
    pb.add(lathe(I, 16), { p: [0, 2 * 0.27, 0], c: '#eef0ea', finish: FA, uvf: noPat, tint: (x, y, z, c) => c.multiplyScalar(0.6 + 0.4 * sstep(0.7, 1.35, y)) }); });
  const basket = (lem) => sub((pb) => { const B = [[0, 0], [1.5, 0], [1.75, 0.2], [2.25, 1.6], [2.5, 2.7], [2.62, 2.85], [2.5, 2.95], [2.3, 2.8], [0, 2.4]];
    pb.add(lathe(B, 12), { c: '#9a7848', finish: S_WOOD, uv: [3, 1.2], tint: (x, y, z, c) => c.multiplyScalar(0.62 + 0.38 * Math.abs(Math.sin(y * 7)) * (0.8 + 0.2 * Math.sin(Math.atan2(z, x) * 22))) });
    const m = sph(2.2, 8, 3); m.scale(1, 0.5, 1); pb.add(m, { p: [0, 2.45, 0], c: lem ? '#8d7a12' : '#8a4a12', finish: S_LEMON });
    for (let i = 0; i < 9; i++) { const r = 1.85 * Math.sqrt((i + 0.5) / 9), a = i * 2.39996 + rng(), g = sph(lem ? 0.42 : 0.5, 6, 4); if (lem) g.scale(1.3, 0.85, 0.85);
      pb.add(g, { p: [Math.cos(a) * r, 2.78 + 0.78 * (1 - (r / 2.2) * (r / 2.2)), Math.sin(a) * r], r: [rng() * 6.28, rng() * 6.28, rng() - 0.5],
        c: new THREE.Color(lem ? LEMON : ORANGE).lerp(new THREE.Color(lem ? '#ffe04a' : '#f2a03a'), rng() * 0.6), finish: S_LEMON }); } });
  await tick(); P.basketL = basket(true); await tick(); P.basketO = basket(false); await tick();
  const loaf = (sx, sy, sz) => sub((pb) => { const g = sph(1, 10, 6); g.scale(sx, sy, sz); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, Math.max(p.getY(i), -sy * 0.45) + sy * 0.45); g.computeVertexNormals();
    pb.add(g, { c: CRUST, finish: S_BREAD, uvf: (x, y, z) => [x, z], tint: (x, y, z, c) => c.multiplyScalar(0.6 + 0.4 * sstep(0, sy * 0.8, y)) }); });
  P.boule = loaf(1.3, 0.72, 1.3); P.baton = loaf(2.3, 0.62, 0.9);
  P.board = sub((pb) => pb.add(new THREE.BoxGeometry(4.6, 0.26, 2.9), { p: [0, 0.13, 0], c: WOOD, finish: S_WOOD, uvf: (x, y, z) => [x, z] }));
  await tick();
  // four plates in a stack, turned as one piece
  P.plates = sub((pb) => { const S = [[0, 0], [1.1, 0.02], [1.72, 0.22], [1.76, 0.27], [1.2, 0.19], [1.72, 0.39], [1.76, 0.44], [1.2, 0.36], [1.72, 0.56], [1.76, 0.61], [1.2, 0.53], [1.72, 0.73], [1.76, 0.78], [1.66, 0.81], [1.1, 0.64], [0.45, 0.63], [0, 0.63]];
    pb.add(lathe(S, 14), { c: '#f4f5f0', finish: FA, uvf: noPat, tint: (x, y, z, c) => { const r = Math.hypot(x, z); if (r > 1.6) c.copy(PIG.mid); else if (r < 0.2) c.copy(PIG.deep); else if (r > 1.0 && r < 1.16 && y > 0.6) c.copy(PIG.pale); } }); });
  await tick();
  P.jar = sub((pb) => { pb.add(lathe(JAR, 12), { c: '#b07a55', finish: S_TERRA, uv: [12, 9], tint: (x, y, z, c) => { if (Math.abs(y - 4.6) < 0.2 || Math.abs(y - 2.0) < 0.12) c.lerp(new THREE.Color('#e9e6dc'), 0.75); c.multiplyScalar(0.72 + 0.28 * sstep(0, 2.5, y)); } });
    pb.add(cyl(1.5, 1.42, 0.26, 10), { p: [0, 6.84, 0], c: '#7d6850', finish: S_WOOD, uv: [3, 1] }); });
  P.sack = sub((pb) => { const S = [[0, 0], [1.6, 0], [2.0, 0.45], [2.12, 2.2], [1.75, 3.4], [0.9, 3.95], [0.68, 4.2], [1.1, 4.7], [0.92, 4.78], [0, 4.4]];
    pb.add(lathe(S, 10), { s: [1, 1, 0.82], c: '#d8cdb4', finish: finish(K.LINEN, 0.02), uv: [11, 2.2], tint: (x, y, z, c) => c.multiplyScalar(0.72 + 0.28 * sstep(0, 2, y) - 0.1 * Math.sin(Math.atan2(z, x) * 5 + y)) }); });
  await tick();
  P.pan = sub((pb) => { const R = 1.6, H = 0.9, O = [[0, 0], [R * 0.86, 0], [R, 0.2 * H], [R * 1.04, H], [R * 0.97, H]], I = [[R * 0.97, H], [R * 0.9, 0.2 * H], [0, 0.14 * H]];
    pb.add(lathe(O, 18), { c: COPPER, finish: S_COPPER, uv: [10, profLen(O)], tint: (x, y, z, c) => c.multiplyScalar(0.5 + 0.5 * sstep(0, H * 0.5, y)) });
    pb.add(lathe(I, 18), { c: TIN, finish: finish(K.COPPER, 0.6, 1), uv: [10, profLen(I)] });
    pb.add(new THREE.BoxGeometry(2.4, 0.13, 0.36), { p: [R + 1.05, H * 0.92 + 0.26, 0], r: [0, 0, 0.22], c: IRON, finish: S_IRON }); });
  P.candle = sub((pb) => { const DISH = [[0, 0], [0.75, 0], [0.95, 0.16], [0.9, 0.22], [0.45, 0.14], [0.36, 0.5], [0.3, 0.52], [0, 0.5]];
    pb.add(lathe(DISH, 10), { c: COPPER, finish: S_COPPER, uv: [4, 1.5] });
    pb.add(cyl(0.2, 0.24, 2.6, 7), { p: [0, 1.8, 0], c: '#f3ead2', finish: finish(K.LEMON, 0.35), tint: (x, y, z, c) => c.multiplyScalar(0.75 + 0.5 * sstep(0.5, 3.1, y)) }); });
  const pile = (lem) => sub((pb) => { for (let i = 0; i < 6; i++) { const a = i * 2.4 + rng(), r = 0.3 + 0.8 * Math.sqrt(i / 6), g = sph(0.44, 7, 5); if (lem) g.scale(1.3, 0.85, 0.85);
      pb.add(g, { p: [Math.cos(a) * r, 0.4, Math.sin(a) * r], r: [0, rng() * 6.28, 0], c: new THREE.Color(lem ? LEMON : ORANGE).lerp(new THREE.Color(lem ? '#ffe04a' : '#f2a03a'), rng() * 0.6), finish: S_LEMON }); } });
  await tick(); P.lemons = pile(true); P.oranges = pile(false); await tick();
  P.dispose = () => { for (const k in P) if (P[k] && P[k].isBufferGeometry) P[k].dispose(); };
  return P;
}
// a plank table (or, low and narrow, a bench) on turned legs
function addBoard(pb, rng, cx, cz, len, wid, h, axis, blobs) {
  const W = (a, y, b) => (axis === 'z' ? [cx + b, y, cz + a] : [cx + a, y, cz + b]), np = wid > 4 ? 2 : 1;
  const wc = () => new THREE.Color('#9a7c58').lerp(new THREE.Color('#6f5a42'), rng());
  for (let k = 0; k < np; k++) { const l = len + (k - 0.5) * 0.5, w = wid / np - 0.08;
    pb.add(axis === 'z' ? rbox(w, 0.45, l, 0.07) : rbox(l, 0.45, w, 0.07), { p: W((rng() - 0.5) * 0.5, h - 0.225, np > 1 ? (k - 0.5) * wid / 2 : 0), c: wc(), finish: S_WOOD, uvf: (x, y, z) => (axis === 'z' ? [z + k * 7, x] : [x + k * 7, z]) }); }
  const n = Math.max(2, Math.round(len / 15) + 1);
  for (let i = 0; i < n; i++) { const a = -len / 2 + 2.2 + (i / (n - 1)) * (len - 4.4);
    for (const sg of [1, -1]) pb.add(cyl(0.34, 0.26, h - 0.4, 6), { p: W(a, (h - 0.45) / 2, sg * (wid / 2 - 0.8)), c: wc(), finish: S_WOOD, uv: [2, 3] });
    const st = axis === 'z' ? new THREE.BoxGeometry(wid - 1.6, 0.4, 0.4) : new THREE.BoxGeometry(0.4, 0.4, wid - 1.6);
    pb.add(st, { p: W(a, h * 0.42, 0), c: wc(), finish: S_WOOD, uvf: (x, y, z) => [x + z, y] }); }
  blobs.push(axis === 'z' ? [cx, 0.04, cz, wid / 2 + 1.4, len / 2 + 1.4, -0.4] : [cx, 0.04, cz, len / 2 + 1.4, wid / 2 + 1.4, -0.4]);
}
// an iron fire basket on three legs heaped with charcoal (alight at dusk), a poker leaning on it
function addBrazier(pb, rng, x, z, hot, blobs) {
  const Y = 3.0, B = [[0, 0], [1.0, 0.06], [1.9, 0.5], [2.3, 1.3], [2.42, 1.5], [2.28, 1.56], [1.8, 0.78], [0.9, 0.32], [0, 0.26]];
  pb.add(lathe(B, 16), { p: [x, Y, z], c: IRON, finish: S_IRON, uv: [7, 2] });
  for (const [yy, rr] of [[1.55, 2.36], [2.5, 2.55]]) pb.add(new THREE.TorusGeometry(rr, 0.11, 4, 18).rotateX(Math.PI / 2), { p: [x, Y + yy, z], c: IRON, finish: S_IRON });
  for (let k = 0; k < 12; k++) { const a = (k / 12) * 6.283; pb.add(cyl(0.09, 0.09, 1.1, 4), { p: [x + Math.cos(a) * 2.45, Y + 2.0, z + Math.sin(a) * 2.45], c: IRON, finish: S_IRON }); }
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5, dx = Math.cos(a), dz = Math.sin(a);
    pb.add(cyl(0.2, 0.16, Y + 0.8, 5), { m: new THREE.Matrix4().compose(new THREE.Vector3(x + dx * 2.0, (Y + 0.5) / 2, z + dz * 2.0), new THREE.Quaternion().setFromEuler(new THREE.Euler(dz * 0.24, 0, -dx * 0.24)), new THREE.Vector3(1, 1, 1)), c: IRON, finish: S_IRON }); }
  const coal = sph(1, 12, 5); coal.scale(2.1, 0.8, 2.1);
  pb.add(coal, { p: [x, Y + 1.35, z], c: hot ? '#ff6a22' : '#2e2a29', finish: hot ? finish(K.GLOW) : finish(K.MATTE, 0.05), tint: (px, py, pz, c) => c.multiplyScalar(hot ? 0.35 + 2.6 * rng() * rng() : 0.6 + 0.8 * rng()) });
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + 1, g = cyl(0.3, 0.36, 3.6, 6, 1); g.rotateZ(Math.PI / 2);
    pb.add(g, { p: [x + Math.cos(a) * 0.5, Y + 1.9 + 0.2 * k, z + Math.sin(a) * 0.5], r: [0, -a, 0.2], c: new THREE.Color('#2e2622').lerp(new THREE.Color('#5a4838'), rng()), finish: S_WOOD, uv: [4, 4] }); }
  pb.add(cyl(0.07, 0.07, 6.4, 5), { p: [x + 2.9, 3.0, z + 0.8], r: [0.1, 0, 0.32], c: IRON, finish: S_IRON });
  blobs.push([x, 0.04, z, 4.2, 4.2, 0.55]);
}
// Laid tables and benches under and beside the flight from the wall's end to the hearth, two braziers, a great kettle
// steaming by the hearth, a rug for the second cat. Three meshes by zone: e = the long arm's north end and the crossing,
// f = the short arm to the door, g = from the door to the hearth. Returns the candle flames (dusk) as [x, y, z, size].
async function dressHall(PB, P, rng, PIG, L, blobs, tick) {
  const T = 4.4, flames = [], jt = () => new THREE.Color('#ffffff').lerp(new THREE.Color('#b9a08c'), rng() * 0.7), bt = () => new THREE.Color('#ffffff').lerp(new THREE.Color('#d9b890'), rng());
  const item = {
    b: (pb, x, z, ry) => { put(pb, P.board, x, T, z, ry, 0.9); const two = rng() < 0.6;
      put(pb, rng() < 0.5 ? P.boule : P.baton, x - (two ? 0.9 : 0), T + 0.24, z, ry + 1.2 + rng(), 0.62 + 0.14 * rng(), { c: bt() });
      if (two) put(pb, P.boule, x + 1.0, T + 0.24, z + 0.2, rng() * 6.28, 0.58, { c: bt() });
      blobs.push([x, T + 0.03, z, 2.9, 2.2, 0.5]); },
    w: (pb, x, z) => { const s = 1.2 + 0.3 * rng(); put(pb, P.bowls, x, T, z, rng() * 6.28, s); blobs.push([x, T + 0.03, z, 1.9 * s, 1.9 * s, 0.55]); },
    L: (pb, x, z) => { put(pb, P.basketL, x, T, z, rng() * 6.28, 0.56); blobs.push([x, T + 0.03, z, 1.9, 1.9, 0.6]); },
    O: (pb, x, z) => { put(pb, P.basketO, x, T, z, rng() * 6.28, 0.56); blobs.push([x, T + 0.03, z, 1.9, 1.9, 0.6]); },
    p: (pb, x, z) => { put(pb, P.plates, x, T, z, rng() * 6.28, 0.66); blobs.push([x, T + 0.03, z, 1.5, 1.5, 0.5]); },
    j: (pb, x, z) => { put(pb, P.jar, x, T, z, rng() * 6.28, 0.4 + 0.08 * rng(), { c: jt() }); blobs.push([x, T + 0.03, z, 1.5, 1.5, 0.55]); },
    k: (pb, x, z, ry) => { put(pb, P.pan, x, T + 0.02, z, ry + rng() * 3, 0.85); blobs.push([x, T + 0.03, z, 1.7, 1.7, 0.55]); },
    f: (pb, x, z) => { put(pb, rng() < 0.5 ? P.lemons : P.oranges, x, T, z, rng() * 6.28, 1); blobs.push([x, T + 0.03, z, 1.5, 1.5, 0.45]); },
    c: (pb, x, z) => { if (!L.fire) return item.f(pb, x, z); put(pb, P.candle, x, T, z, rng() * 6.28, 1); blobs.push([x, T + 0.03, z, 1.2, 1.2, 0.5]); flames.push([x, T + 3.1, z, 1.0]); },
  };
  // a laid table: seq is one letter per place, set alternately either side of the middle; a bench on the side away from the flight
  const table = async (pb, cx, cz, len, wid, axis, seq, bench) => {
    addBoard(pb, rng, cx, cz, len, wid, T, axis, blobs);
    const n = seq.length;
    for (let i = 0; i < n; i++) { const a = -len / 2 + 2.6 + (i / Math.max(n - 1, 1)) * (len - 5.2), side = (i % 2 ? 1 : -1) * (wid / 2 - 2.2) * (0.55 + 0.45 * rng());
      const x = axis === 'x' ? cx + a : cx + side, z = axis === 'x' ? cz + side : cz + a;
      item[seq[i]](pb, x, z, axis === 'x' ? 0.1 : 1.5);
      if ((i & 3) === 3) await tick(); }
    if (bench) addBoard(pb, rng, axis === 'x' ? cx : cx + bench, axis === 'x' ? cz + bench : cz, len - 8, 2.4, 2.3, axis, blobs);
    await tick();
  };
  const jar = (pb, x, z, s) => { put(pb, P.jar, x, 0, z, rng() * 6.28, s, { c: jt() }); blobs.push([x, 0.04, z, 3.2 * s, 3.2 * s, 0.6]); };
  const sack = (pb, x, z, s, lean = 0) => { put(pb, P.sack, x, 0, z, rng() * 6.28, s, { rz: lean, c: jt() }); blobs.push([x, 0.04, z, 2.7 * s, 2.7 * s, 0.6]); };

  // ---- e: under the crow and round the corner
  let pb = PB.e;
  await table(pb, 22, -268, 30, 8, 'z', 'bwcOpkbjcwf', -6.4);
  addBrazier(pb, rng, 15, -305, L.fire, blobs);
  await tick();
  await table(pb, -22.5, -300, 34, 5.4, 'z', 'wbcLpjbwcf', 0);
  await table(pb, 2, -382, 32, 8, 'x', 'bOcwkpbLcwj', 6.2);
  addBrazier(pb, rng, -19, -366, L.fire, blobs);
  sack(pb, -24.6, -372, 0.85); sack(pb, -26, -376, 0.75, 0.4); jar(pb, 24, -362, 0.7); jar(pb, 27.2, -364.5, 0.55);
  await tick();

  // ---- f: the short arm from the corner to the door
  pb = PB.f;
  await table(pb, 96, -373, 44, 9, 'x', 'bwcLpkbfcwOjbcw', -7.2);
  await table(pb, 170, -350, 34, 9, 'x', 'kbwOfpbjwLk', 7.2);
  sack(pb, 126, -372.5, 0.8); sack(pb, 123.4, -375.4, 0.7, 0.45); jar(pb, 66, -372, 0.7);
  await tick();

  // ---- g: from the door to the hearth
  pb = PB.g;
  await table(pb, 216, -373, 36, 9, 'x', 'wbcOkpbfcwLj', -7.2);
  await table(pb, 246, -352.5, 28, 8, 'x', 'bcwLkpfcb', 6.6);
  // the great kettle by the hearth: a copper kettle on a brick ring of coals, steaming (the world adds the steam)
  const KX = 278.4, KZ = -346.5, ring = new THREE.TorusGeometry(3.0, 0.8, 5, 16).rotateX(Math.PI / 2); ring.scale(1, 0.8, 1);
  pb.add(ring, { p: [KX, 0.6, KZ], c: '#8a5a44', finish: finish(K.BRICK, 0.03), uvf: (px, py, pz) => [Math.atan2(pz - KZ, px - KX) * 3, py * 1.6 + Math.hypot(px - KX, pz - KZ)] });
  const coal = sph(1, 12, 4); coal.scale(2.3, 0.4, 2.3);
  pb.add(coal, { p: [KX, 0.4, KZ], c: '#ff6a22', finish: finish(K.GLOW), tint: (px, py, pz, c) => c.multiplyScalar((L.fire ? 1.1 : 0.5) * (0.25 + 1.8 * rng() * rng())) });
  const KB = [[0, 0], [1.7, 0], [2.3, 0.4], [2.7, 1.6], [2.6, 2.9], [2.0, 3.9], [1.3, 4.3], [1.25, 4.6], [1.45, 4.7], [1.45, 4.85], [0.5, 5.05], [0.3, 5.5], [0, 5.55]];
  pb.add(lathe(KB, 24), { p: [KX, 1.3, KZ], c: COPPER, finish: S_COPPER, uv: [15, profLen(KB)], tint: (px, py, pz, c) => c.multiplyScalar(0.42 + 0.58 * sstep(1.3, 4, py)) });
  pb.add(tube([[2.4, 2.4, 0], [3.4, 3.0, 0], [3.9, 4.3, 0], [4.5, 4.9, 0]], 0.3, 6, 8), { p: [KX, 1.3, KZ], r: [0, 2.4, 0], c: COPPER, finish: S_COPPER, uv: [1, 4] });
  pb.add(new THREE.TorusGeometry(1.9, 0.12, 5, 14, Math.PI), { p: [KX, 5.5, KZ], r: [0, 2.4, 0], c: IRON, finish: S_IRON });
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; pb.add(cyl(0.16, 0.16, 1.4, 5), { p: [KX + Math.cos(a) * 2.0, 0.7, KZ + Math.sin(a) * 2.0], c: IRON, finish: S_IRON }); }
  blobs.push([KX, 0.04, KZ, 4.6, 4.6, 0.55]);
  if (L.fire) for (const sg of [1, -1]) {      // dusk: the hearth is alight either side of the portal
    const bed = sph(1, 14, 5); bed.scale(4.2, 0.9, 3.4);
    pb.add(bed, { p: [288.5, 0.5, -362.5 + sg * 9.6], c: '#ff6a22', finish: finish(K.GLOW), tint: (px, py, pz, c) => c.multiplyScalar(0.3 + 2.4 * rng() * rng()) });
  }
  await tick();
  // a folded rug before the fire for the second cat (the world adds her)
  pb.add(rbox(6.4, 0.34, 4.6, 0.14), { p: [273, 0.17, -374.5], r: [0, 0.25, 0], c: PIG.mid.clone().multiplyScalar(0.8), finish: finish(K.LINEN, 0.02), uvf: (x, y, z, lx, ly, lz) => [lz, lx + 3.2] });
  pb.add(rbox(5.6, 0.3, 4.0, 0.14), { p: [273.2, 0.48, -374.6], r: [0, 0.3, 0], c: '#d8cdb4', finish: finish(K.LINEN, 0.02), uvf: (x, y, z, lx, ly, lz) => [lz, lx + 2.8] });
  blobs.push([273, 0.04, -374.5, 4.2, 3.4, -0.5]);
  sack(pb, 278.4, -378.8, 0.85); sack(pb, 279.2, -382.2, 0.7, 0.4); jar(pb, 258, -380.5, 0.6);
  await tick();
  return flames;
}

const LOOK = {
  cockerel: { sun: [0.62, 0.24, 0.74], fog: '#e4ded2', fogD: 0.0016, skyTop: [0.42, 0.62, 1.05], skyHor: [1.25, 0.88, 0.5], glare: [0.6, 0.78, 1.08], courtFloor: '#cdbfa6', shade: 0.42, courtWall: '#ece2cf',
    direct: 1, gust: 0.8, coneShade: [0.62, 0.7, 0.86], coneSun: [1.3, 0.95, 0.55], side: 0.16, rays: 0.9, rayCol: '#ffd9a0', wellRays: '#dfeaff', exposure: 1.06, tint: '#fff8ee', shadowTint: '#2a1326', sat: 1.08, portal: '#fff0c0',
    steam: '#f6efe2', steamShade: '#a89a9a', steamAmb: '#8a7f88', dust: ['#fff0cf', '#ffd890', '#ffe9b8'], blob: '#24142a', wet: 0, fire: 0 },
  owl: { sun: [0.62, 0.24, 0.74], fog: '#232a44', fogD: 0.0019, skyTop: [0.03, 0.05, 0.16], skyHor: [0.16, 0.2, 0.42], glare: [0.1, 0.17, 0.42], courtFloor: '#6f6a70', shade: 0.9, courtWall: '#8f8a98',
    direct: 0.1, gust: 0.6, coneShade: [0.09, 0.11, 0.2], coneSun: [0.13, 0.16, 0.3], side: 0, rays: 0.25, rayCol: '#7f95d8', wellRays: '#7f95d8', exposure: 1.1, tint: '#fff4e6', shadowTint: '#141030', sat: 1.08, portal: '#ffd98a',
    steam: '#cfc2c4', steamShade: '#4a4660', steamAmb: '#34344e', dust: ['#ffd9a0', '#ffb060', '#8fa0d0'], blob: '#0c0a18', wet: 0, fire: 1 },
  pheasant: { sun: [0.15, 0.8, 0.58], fog: '#d5dcda', fogD: 0.0016, skyTop: [0.35, 0.6, 1.2], skyHor: [0.9, 1.0, 1.2], glare: [0.7, 0.9, 1.3], courtFloor: '#b9b4a6', shade: 0.4, courtWall: '#ece8dc',
    direct: 1, gust: 1.2, coneShade: [0.5, 0.58, 0.72], coneSun: [1.45, 1.38, 1.22], side: 0.13, rays: 1, rayCol: '#f2f6ff', wellRays: '#eef4ff', exposure: 0.95, tint: '#ffffff', shadowTint: '#1c1a30', sat: 1.06, portal: '#ffe48a',
    steam: '#eef3f4', steamShade: '#93a4b0', steamAmb: '#7b8c9e', dust: ['#ffffff', '#eef2ee', '#dfe8e0'], blob: '#16182c', wet: 0.6, fire: 0 },
};
// nine table candles for the dusk look: x, z, height
const TOWER = [9.5, -284];       // the masons' free-standing tower near the wall's end: the dark foreground of the crow
const CANDLES = [[-2, -128, 2.6], [7.6, -146, 3], [-3.6, -150, 2.4], [8, -168.5, 2.8], [-3.5, -181, 3], [8.2, -190, 2.5], [-2.6, -199, 2.8], [1.4, -217, 2.4], [8.5, -217.5, 3]];

export default {
  id: 'tiled-cockerel-kitchen',
  name: 'The Cockerel Wall',
  category: 'interior',
  weirdness: 0.4,
  media: ['interior', 'air'],
  async build(ctx) {
    const { rng } = ctx, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = vary.density || 1;
    const bell = ctx.core.bell, tick = () => ctx.yield();
    // ------------------------------------------------------------------ per-seed look and cast
    const V = rng.fork('variety');
    const pick = V.pick(['cockerel', 'cockerel', 'owl', 'pheasant', 'owl', 'pheasant']);
    const lookName = vary.hour === 'night' ? 'owl' : vary.hour === 'day' ? 'pheasant' : (vary.hour === 'dawn' || vary.hour === 'golden') ? 'cockerel' : pick;
    const catR = V(), catKind = catR < 0.7 ? 'ginger' : catR < 0.93 ? 'white' : 'none', secR = V(), second = secR > 0.29 && secR < 0.62 ? 'finches' : 'lemons';
    const L = LOOK[lookName];
    const scene = new THREE.Scene(), fogCol = new THREE.Color(L.fog);
    scene.background = fogCol.clone(); scene.fog = new THREE.FogExp2(fogCol, L.fogD);

    // ------------------------------------------------------------------ the hero: walls, floor, flocks
    const hero = await buildHero(ctx, { look: lookName, rare: !!vary.rare, second });
    scene.add(hero.object);
    const HU = hero.tile.uniforms, A = hero.anchors;
    await ctx.yield();

    const PU = { uTime: { value: 0 }, uGust: { value: L.gust }, uCat: { value: new THREE.Vector4(0.6, 0, 0, 0) }, uTailRoot: { value: new THREE.Vector3() },
      uSun: HU.uSun, uSunCol: HU.uSunCol, uAmb: HU.uAmb, uSky: HU.uSky, uDoorCol: HU.uDoorCol, uFireCol: HU.uFireCol, uFires: HU.uFires, uFireR: HU.uFireR, uLamp: HU.uLamp, uBounce: HU.uBounce, uKey: HU.uKey, uGoldCol: HU.uGoldCol,
      uTin: HU.uTin, uPigLine: HU.uPigLine, uPigLeaf: HU.uPigLeaf, uDoor: HU.uDoor, uChim: HU.uChim,
      uGlare: { value: new THREE.Vector3(...L.glare) }, uSide: { value: L.side }, uWet: { value: L.wet } };
    const propMat = (defines = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...PU }, vertexShader: PROP_VERT, fragmentShader: PROP_FRAG,
      fog: true, vertexColors: true, side: THREE.DoubleSide, defines });
    const pm = propMat();
    // the look's own pigments (leaf wash and dark wash) for everything painted that is not tile
    const pig = (d, a) => { const t = HU.uTin.value; return new THREE.Color(1.18 * t.x * Math.exp(-d * a.x), 1.18 * t.y * Math.exp(-d * a.y), 1.18 * t.z * Math.exp(-d * a.z)); };
    const PIG = { pale: pig(0.25, HU.uPigLeaf.value), mid: pig(0.8, HU.uPigLeaf.value), deep: pig(1.5, HU.uPigDark.value) };

    // ------------------------------------------------------------------ vault, arches, cornice, table sides, architrave (hero tile material)
    const TABLE_Y = 5.0, blobs = [];
    const tb = makeTB(); buildArchitecture(tb, hero.tile.offsets.free, TABLE_Y);
    await ctx.yield();
    const arch = new THREE.Mesh(tb.build(), hero.tile.material()); arch.name = 'vault-arches'; arch.frustumCulled = false; scene.add(arch);
    await ctx.yield();

    // ------------------------------------------------------------------ long arm props: table, coppers, lemons, rack, scaffold, cone
    const RA = rng.fork('props-a'), pbA = makePB();
    pbA.add(rbox(17, 0.5, 111, 0.14), { p: [2, TABLE_Y - 0.25, -175], c: '#9a958a', finish: finish(K.STONE, 0.2), uvf: (x, y, z) => [z, x + 20] });
    {   // a linen runner with woven stripes down the middle of the table
      const rn = new THREE.PlaneGeometry(7, 100, 7, 50).rotateX(-Math.PI / 2), rp = rn.attributes.position;
      for (let i = 0; i < rp.count; i++) rp.setY(i, 0.035 + 0.03 * Math.sin(rp.getX(i) * 2.3 + rp.getZ(i) * 0.7) * Math.sin(rp.getZ(i) * 1.1));
      rn.computeVertexNormals();
      pbA.add(rn, { p: [3.2, TABLE_Y, -175.5], c: '#d6d4cc', finish: finish(K.LINEN, 0.02), uvf: (x, y, z) => [z, Math.min(x + 0.3, 6.7 - x) + 0.92],
        tint: (x, y, z, c) => c.multiplyScalar(0.88 + 0.12 * Math.sin(z * 0.9 + x)) });
    }
    await ctx.yield();
    const JUG = [[0, 0], [0.95, 0], [1.05, 0.15], [0.85, 0.35], [1.4, 1.2], [1.55, 2.0], [1.35, 2.9], [0.82, 3.6], [0.72, 4.0], [0.98, 4.5], [1.03, 4.6], [0.9, 4.6], [0.66, 4.0], [0, 3.9]];
    for (const [jx, jz, js, jr] of [[7.4, -133, 1, 0.5], [7.6, -172.5, 1.1, 2.2], [7.5, -185.5, 0.9, -0.4]]) {
      pbA.add(lathe(JUG, 26), { p: [jx, TABLE_Y, jz], s: js, c: '#ffffff', finish: finish(K.FAIENCE, 0.75), uv: [9.4, profLen(JUG)] });
      pbA.add(tube([[1.0, 4.35, 0], [1.75, 4.3, 0], [2.1, 3.3, 0], [1.9, 2.2, 0], [1.5, 1.75, 0]], 0.16, 7, 14), { m: new THREE.Matrix4().compose(new THREE.Vector3(jx, TABLE_Y, jz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, jr, 0)), new THREE.Vector3(js, js, js)),
        c: '#f1f3ee', finish: finish(K.FAIENCE, 0.75), uvf: () => [0, -100], tint: (x, y, z, c, lx, ly, lz, n) => { if (Math.abs(n.y) < 0.35) c.copy(PIG.mid); } });
      blobs.push([jx, TABLE_Y + 0.03, jz, 2.0 * js, 2.0 * js, 0.6]);
    }
    blobs.push([2, 0.04, -175, 10.6, 58.5, -0.4]);
    addPan(pbA, { p: [0.6, TABLE_Y, -140], r: 2.4, h: 1.4, rot: 0.6, liquid: '#8a8f96' });
    await ctx.yield();
    {   // the great pot stands on an iron trivet over a bed of charcoal (alight at dusk)
      pbA.add(new THREE.TorusGeometry(2.05, 0.14, 6, 28).rotateX(Math.PI / 2), { p: [5, TABLE_Y + 0.82, -158], c: IRON, finish: S_IRON });
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; pbA.add(rbox(0.3, 0.9, 0.3, 0.07), { p: [5 + Math.cos(a) * 2.05, TABLE_Y + 0.45, -158 + Math.sin(a) * 2.05], r: [0, -a, 0], c: IRON, finish: S_IRON }); }
      const coal = sph(1, 14, 6); coal.scale(2.5, 0.28, 2.5);
      pbA.add(coal, { p: [5, TABLE_Y + 0.08, -158], c: L.fire ? '#ff7a2a' : '#3a3432', finish: L.fire ? finish(K.GLOW) : finish(K.MATTE, 0.05), tint: (x, y, z, c) => c.multiplyScalar(L.fire ? 1.2 + 2.2 * RA() : 0.7 + 0.6 * RA()) });
    }
    await ctx.yield();
    addPot(pbA, 5, TABLE_Y + 0.9, -158, 0.3);
    if (L.fire) for (const [cx, cz, ch] of CANDLES) {
      const DISH = [[0, 0], [0.75, 0], [0.95, 0.16], [0.9, 0.22], [0.45, 0.14], [0.36, 0.5], [0.3, 0.52], [0, 0.5]];
      pbA.add(lathe(DISH, 16), { p: [cx, TABLE_Y, cz], c: COPPER, finish: S_COPPER, uv: [4, 1.5] });
      pbA.add(cyl(0.2, 0.24, ch, 10), { p: [cx, TABLE_Y + 0.5 + ch / 2, cz], c: '#f3ead2', finish: finish(K.LEMON, 0.35), tint: (x, y, z, c) => c.multiplyScalar(0.75 + 0.5 * sstep(TABLE_Y + 0.5, TABLE_Y + 0.5 + ch, y)) });
      blobs.push([cx, TABLE_Y + 0.03, cz, 1.2, 1.2, 0.5]);
    }
    await ctx.yield();
    addPan(pbA, { p: [3.0, TABLE_Y, -176.5], r: 2.4, h: 1.35, rot: -0.8, liquid: '#8f8a80' });
    addPan(pbA, { p: [-0.6, TABLE_Y, -191], r: 2.4, h: 1.45, rot: 2.4, liquid: '#8a8f96' });
    for (const [x, z, r] of [[0.6, -140, 3.4], [5, -158, 3.6], [3.0, -176.5, 3.4], [-0.6, -191, 3.4], [4.6, -206, 2.7]]) blobs.push([x, TABLE_Y + 0.03, z, r, r, 0.6]);
    await ctx.yield();
    await addBowl(pbA, RA, 4.6, TABLE_Y, -206, 60, tick);
    addBough(pbA, RA, 1.2, TABLE_Y, -213.5, 0.45, 5.5);
    await ctx.yield();
    addTableSundries(pbA, RA, TABLE_Y, blobs);
    await ctx.yield();
    await addRack(pbA, RA, -84, -26, -3, 29, tick);
    // storage jars and crates of spare tiles along the west wall by the entry
    for (const [jz, js] of [[-34, 1], [-41.5, 0.8], [-58, 1.1], [-66, 0.86], [-97, 1], [-104, 0.9]]) {
      pbA.add(lathe(JAR, 22), { p: [-28.6 + (1 - js) * 2, 0, jz], s: js, c: new THREE.Color('#b07a55').lerp(new THREE.Color('#86563a'), RA() * 0.6), finish: finish(K.MATTE, 0.14),
        tint: (x, y, z, c) => { if (Math.abs(y - 4.6 * js) < 0.16 * js || Math.abs(y - 2.0 * js) < 0.1) c.lerp(new THREE.Color('#e9e6dc'), 0.75); } });
      blobs.push([-28.6 + (1 - js) * 2, 0.04, jz, 3.3 * js, 3.3 * js, 0.6]);
      await ctx.yield();
    }
    for (const [cz, rot] of [[-49, 0.2], [-75, -0.15]]) {
      pbA.add(rbox(4.2, 2.2, 3.0, 0.1), { p: [-28.8, 1.1, cz], r: [0, rot, 0], c: '#84735f', finish: S_WOOD, uvf: (x, y, z, lx, ly, lz) => [lx + lz, ly * 2.5] });
      for (let k = 0; k < 9; k++) pbA.add(rbox(0.09, 0.75, 0.75, 0.02), { p: [-30.2 + k * 0.33, 2.45, cz + (RA() - 0.5) * 0.3], r: [0, rot, (RA() - 0.5) * 0.2], c: k % 3 === 0 ? PIG.mid : (k % 3 === 1 ? '#f0f2ee' : PIG.pale), finish: finish(K.FAIENCE, 0.7), uvf: () => [0, -100] });
      blobs.push([-28.8, 0.04, cz, 3.4, 2.8, -0.5]);
      await ctx.yield();
    }
    const propsA = new THREE.Mesh(pbA.build(), pm); propsA.name = 'props-long-arm'; scene.add(propsA);
    await ctx.yield();
    const pbA2 = makePB();          // the masons' scaffolds and the chimney cone: a second mesh, so that no one upload stalls the page
    await addScaffold(pbA2, RA, { start: [32.5, -170], along: [0, -1], out: [-1, 0], len: 17.6, levels: [6, 12], pig: PIG, tick }, blobs);
    await addTower(pbA2, RA, PIG, blobs, tick);
    await ctx.yield();
    addCone(pbA2, 0, -175, 0, L);
    const skyC = new THREE.Color(L.glare[0] * 1.15, L.glare[1] * 1.15, L.glare[2] * 1.15);
    pbA2.add(new THREE.CircleGeometry(7.4, 24).rotateX(Math.PI / 2), { p: [0, 95, -175], c: skyC, finish: finish(K.GLOW) });
    await ctx.yield();
    const propsA2 = new THREE.Mesh(pbA2.build(), pm); propsA2.name = 'props-long-arm-works'; scene.add(propsA2);
    await ctx.yield();

    // ------------------------------------------------------------------ the cat on the table end
    const whiteCat = catKind === 'white', catGeo = catGeometry(whiteCat ? '#d9d5cb' : '#b56a30', whiteCat ? 0 : 0.3), cat = new THREE.Mesh(catGeo, propMat({ CAT: 1 }));
    cat.position.set(7.0, TABLE_Y - 0.02, -223.5); cat.rotation.y = 0.3; cat.scale.setScalar(1.3); cat.name = 'cat'; cat.visible = catKind !== 'none'; scene.add(cat);
    PU.uTailRoot.value.fromArray(catGeo.userData.root);
    if (catKind !== 'none') blobs.push([7.2, TABLE_Y + 0.03, -223.2, 2.7, 3.2, 0.62]);

    // ------------------------------------------------------------------ short arm props: door, courtyard, hearth, cartouche, scaffold, cone
    const RB = rng.fork('props-b'), pbB = makePB();
    await addDoorAndCourt(pbB, RB, L, blobs, PIG, tick);
    await ctx.yield();
    const propsB0 = new THREE.Mesh(pbB.build(), pm); propsB0.name = 'props-door-court'; scene.add(propsB0);
    await ctx.yield();
    const pbB2 = makePB();
    await addHearth(pbB2, RB, blobs, PIG, tick);
    await ctx.yield();
    await addShortArmDressing(pbB2, RB, PIG, blobs, tick);
    await ctx.yield();
    await addScaffold(pbB2, RB, { start: [206, -395], along: [1, 0], out: [0, 1], len: 26.4, levels: [6, 12, 18], pig: PIG, tick }, blobs);
    await ctx.yield();
    addCone(pbB2, 120, -362.5, 1, L);
    pbB2.add(new THREE.CircleGeometry(7.4, 24).rotateX(Math.PI / 2), { p: [120, 95, -362.5], c: skyC, finish: finish(K.GLOW) });
    await ctx.yield();
    const propsB = new THREE.Mesh(pbB2.build(), pm); propsB.name = 'props-short-arm'; scene.add(propsB);
    await ctx.yield();

    // ------------------------------------------------------------------ the working kitchen: tables, rails, dresser, troughs, jars, bread, fruit
    {
      const RK = rng.fork('kitchen'), protos = await makeProtos(RK, PIG, tick), PBK = { a: makePB(), b: makePB(), c: makePB(), d: makePB() };
      await ctx.yield();
      await dressKitchen(PBK, protos, RK, PIG, L, blobs, tick, TABLE_Y);
      for (const k of ['a', 'b', 'c', 'd']) { await ctx.yield(); const m = new THREE.Mesh(PBK[k].build(), pm); m.name = 'kitchen-' + k; scene.add(m); }
      protos.dispose();
      await ctx.yield();
    }
    // the hall from the wall's end to the hearth: laid tables, benches, braziers, the kettle
    let hallFlames = [];
    {
      const RH = hallRng(0x51ed + lookName.length), hp = await makeHallProtos(RH, PIG, tick), PBH = { e: makePB(), f: makePB(), g: makePB() };
      await ctx.yield();
      hallFlames = await dressHall(PBH, hp, RH, PIG, L, blobs, tick);
      for (const k of ['e', 'f', 'g']) { await ctx.yield(); const m = new THREE.Mesh(PBH[k].build(), pm); m.name = 'hall-' + k; scene.add(m); }
      hp.dispose();
      await ctx.yield();
    }
    // the second cat, on her rug before the hearth
    const cat2Geo = catGeometry(whiteCat ? '#b56a30' : '#4a4642', whiteCat ? 0.3 : 0), cat2 = new THREE.Mesh(cat2Geo, cat.material);
    cat2.position.set(273.1, 0.62, -374.5); cat2.rotation.y = -Math.PI / 2 + 0.35; cat2.scale.setScalar(1.5); cat2.name = 'cat-hearth'; scene.add(cat2);
    blobs.push([273.1, 0.66, -374.5, 3.0, 3.4, 0.62]);
    await ctx.yield();
    // the hanging cauldron, 16 m south of the path under the second chimney
    const HOOK = new THREE.Vector3(124, vaultY(16.5) - 0.2, -346), DROP = 43.5;
    const cauldron = new THREE.Mesh(cauldronGeometry(RB, DROP), pm); cauldron.position.copy(HOOK); cauldron.name = 'cauldron'; scene.add(cauldron);
    blobs.push([124, 0.04, -346, 4.6, 4.6, 0.42]);
    const blobMesh = new THREE.Mesh(blobGeometry(blobs), blobMaterial(L.blob)); blobMesh.renderOrder = 1; blobMesh.name = 'contact-shadows'; scene.add(blobMesh);
    // a swallow's shadow crossing the first chimney's pool of skylight on the table now and then
    const swallowShadow = new THREE.Mesh(blobGeometry([[0, 0, 0, 2.6, 0.9, 0.5]]), blobMesh.material); swallowShadow.renderOrder = 1; swallowShadow.position.set(0, TABLE_Y + 0.05, -175); scene.add(swallowShadow);
    await ctx.yield();

    // ------------------------------------------------------------------ steam, columns of light, motes, flames
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const sun = new THREE.Vector3(...L.sun).normalize(), reach = Math.min(15 / sun.y, 44);
    const steam = (name, pos, h, rad, size, count, op, wind) => set.add(fx.makeSmokeColumn({ rng: rng.fork('steam-' + name), time, position: pos, height: h, radius: rad, size, count: Math.max(12, Math.round(count * detail)),
      color: L.steam, colorTop: '#ffffff', shadowColor: L.steamShade, ambient: L.steamAmb, opacity: op, rate: 0.05, wind, bend: 0.3, sunDir: [0.1, 1, 0.25], sunColor: '#ffffff', scatter: 0.5, rim: 0.35 }));
    steam('pot', [5.4, TABLE_Y + 5.8, -158.4], 36, [1.4, 6.5], [2.6, 11], 56, 0.34, [-0.28, 0, -0.96]);
    await ctx.yield();
    steam('pan1', [0.6, TABLE_Y + 1.2, -140], 15, [1.2, 3.4], [1.8, 5.5], 26, 0.24, [0.1, 0, -1]);
    steam('pan2', [3.0, TABLE_Y + 1.2, -176.5], 26, [1.2, 4.2], [1.8, 7.5], 34, 0.3, [-0.6, 0, 0.3]);
    await ctx.yield();
    steam('pan3', [-0.6, TABLE_Y + 1.2, -191], 15, [1.2, 3.4], [1.8, 5.5], 26, 0.24, [0.2, 0, 1]);
    steam('prep', [7.2, 6.3, -62.5], 13, [1.1, 3.2], [1.6, 5], 22, 0.26, [0.3, 0, 0.95]);
    await ctx.yield();
    steam('doorpot', [160, 6.2, -380], 8, [0.9, 2.2], [1.3, 3.4], 16, 0.2, [0.6, 0, 0.5]);
    const cSteam = steam('cauldron', [124, HOOK.y - DROP + 4.2, -346], 38, [1.8, 7], [3, 12], 56, 0.36, [-0.24, 0, -0.97]);
    await ctx.yield();
    const rays = (pos, dir, radius, len, w, n, k, color) => set.add(fx.makeGodRays({ rng: rng.fork('rays' + pos[0]), time, position: pos, direction: dir, radius, count: n, length: len, width: w, color,
      intensity: 0.2 * L.rays * k, falloff: 0.55, speed: 0.6 }));
    rays([0, 96, -175], [0, -1, 0], 5.2, 92, [1.6, 3.6], 9, 1, L.wellRays);
    await ctx.yield();
    rays([120, 96, -362.5], [0, -1, 0], 5.2, 96, [1.6, 3.6], 9, 1, L.wellRays);
    rays([206 + sun.x * 4, 17 + sun.y * 4, -330 + sun.z * 4], [-sun.x, -sun.y, -sun.z], 8, Math.min(16 / sun.y + 10, 84), [2, 4.5], 10, 0.55, L.rayCol);
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(1800 * detail * density), box: [40, 26, 40], colors: L.dust, intensity: 0.9 }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, follow: false, center: [206 - sun.x * reach * 0.7, 11, -330 - sun.z * reach * 0.7], box: [44, 22, 40], count: Math.round(520 * detail),
      colors: [L.rayCol, '#ffffff', L.rayCol], intensity: 0.4 + 0.5 * L.direct }));
    // dusk: a fire under the great pot, two braziers, the cauldron's ring, the kettle, the hearth itself and candles on
    // every table; their glow is twelve analytic point lights in every shader (position, strength, reach in square metres)
    await ctx.yield();
    let flames = null;
    const FIRES = [[5, TABLE_Y + 2.5, -158, 1.0, 560], [2.5, TABLE_Y + 4.5, -200, 0.7, 500], [22, 9, -268, 0.85, 520], [15, 6.5, -305, 1.0, 640], [-19, 6.5, -366, 0.95, 640], [96, 9, -373, 0.8, 480],
      [124, 3.5, -346, 0.9, 520], [171, 9, -380, 0.75, 460], [216, 9, -373, 0.8, 480], [262, 7, -351, 0.85, 480], [286, 6, -362.5, 1.1, 1100], [-22.5, 9, -300, 0.6, 420]];
    if (L.fire) {
      const fires = [[2.7, 0], [-2.7, 0], [0, 2.7], [0, -2.7]].map(([dx, dz]) => ({ position: [5 + dx, TABLE_Y + 0.15, -158 + dz], width: 2.6, height: 2.3, tongues: 6, embers: 8 }));
      fires.push({ position: [15, 4.7, -305], width: 3.6, height: 3.6, tongues: 7, embers: 10 }, { position: [-19, 4.7, -366], width: 3.6, height: 3.6, tongues: 7, embers: 10 },
        { position: [124, 0.7, -346], width: 5.6, height: 2.6, tongues: 7, embers: 8 }, { position: [278.4, 0.6, -346.5], width: 5.2, height: 1.5, tongues: 6, embers: 6 },
        { position: [288.5, 1.0, -353], width: 7, height: 6.5, tongues: 8, embers: 16 }, { position: [288.5, 1.0, -372], width: 7, height: 6.5, tongues: 8, embers: 16 });
      flames = INT.makeFlames({ flames: CANDLES.map(([x, z, h]) => [x, TABLE_Y + 0.5 + h, z, 1.0]).concat(hallFlames), fires, rng: rng.fork('flames'), gain: 1.4 });
      scene.add(flames.object);
      FIRES.forEach((f, i) => hero.setFire(i, f[0], f[1], f[2], f[3], f[4]));
    }
    hero.setPortalLight(281, 12, -362.5, L.fire ? 1.2 : 0.8, new THREE.Color(L.portal));
    await ctx.yield();
    const blizzard = hero.rare ? makeBlizzard(HU, Math.round(4200 * detail), rng.fork('blizzard')) : null;
    if (blizzard) scene.add(blizzard.object);

    // ------------------------------------------------------------------ the flight
    // In at 42 degrees to the mural wall with the bird square on the axis, a close pass along the glaze, across the
    // hall under the bough flock to the table's west side (coppers, lemons and cat against the wall he strides), on up
    // the hall as he crows at the wall's end, then one wide right turn (70 m radius) through the flock into the short arm.
    const PX = -10, PR = 70, PZ = -362.5 + PR;
    const pts = [[-6, 16, 2], [4.3, 16, -9.4], [13, 16, -21.5], [18.3, 15.8, -36], [19.5, 15, -52], [19.2, 14.2, -66], [17, 13.6, -79], [10.5, 13.2, -91], [-1, 12.7, -106], [-8.6, 12.2, -122],
      [PX, 11.6, -142], [PX, 11.1, -165], [PX, 11, -190], [PX, 11.2, -215], [PX, 11.8, -240], [PX, 12.6, -265], [PX, 13.4, -280], [PX, 14, PZ]];
    for (const d of [22.5, 45, 67.5]) { const a = (d * Math.PI) / 180; pts.push([PX + PR - PR * Math.cos(a), 14, PZ - PR * Math.sin(a)]); }
    pts.push([PX + PR, 14, -362.5], [90, 14, -362.5], [120, 14, -362.5], [170, 14, -362.5], [222.5, 14, -362.5], [252.5, 14, -362.5], [282.5, 14, -362.5]);
    const path = makePath(pts), DUR = 43, uAt = (x, z) => path.nearestXZ(x, z).u;
    hero.setRoute(null, null, new THREE.Vector4(PX, PZ, PR, 14));
    hero.setFlock({ post: new THREE.Vector4(TOWER[0] - 2.2, TOWER[1] - 4.4, 7.5, 12.5) });
    hero.setPath((uu, out) => path.pointAt(uu, out));           // the great bird flies ahead of the camera along its own route
    await ctx.yield();

    // ------------------------------------------------------------------ swallows: in at the door, twice round the second column of light,
    // across the path ahead of the camera, then away down the hall to the hearth
    const route = [[207, 8, -316], [204, 9, -333], [186, 14, -346], [160, 20, -352], [138, 24, -352], [124, 26, -356], [113, 25, -362], [118, 23, -371], [128, 21, -369], [131, 19, -360],
      [124, 17.5, -353], [114, 17, -357], [112, 17, -366], [118, 17.5, -374], [134, 18, -377], [160, 20, -372], [190, 24, -366], [230, 30, -368], [262, 37, -378]];
    const BIRD_V = 22, birdLight = { sunDir: [0.5, 0.6, 0.6], sunColor: L.rayCol, sunIntensity: 1.1 * (0.3 + 0.7 * L.direct), sky: L.wellRays, skyIntensity: 1.0 * (0.4 + 0.6 * L.direct), ground: L.steam, groundIntensity: 0.8 * (0.4 + 0.6 * L.direct) };
    const birds = F.makeFlock({ rng: rng.fork('swallows'), species: 'swifts', count: 6, size: 3.6, speed: BIRD_V, form: 'loose', spread: [3.2, 2, 8], wander: [1.3, 0.8, 1.3, 0.7], route, closed: false, start: 0, glide: 0.35, light: birdLight,
      body: '#16265c', belly: '#f4f4ee', wingC: '#1a2a66', trail: '#22347a', tip: '#0c1434', head: '#1c2c6a' });
    birds.object.visible = false; scene.add(birds.object);
    await ctx.yield();
    const loopBirds = F.makeFlock({ rng: rng.fork('hall-birds'), species: 'swifts', count: 5, size: 3.6, speed: 15, form: 'loose', spread: [3, 2, 9], wander: [1.5, 1, 1.5, 0.6], closed: true, start: V(), glide: 0.4, light: birdLight,
      route: [[-16, 30, -28], [4, 33, -58], [15, 29, -96], [-2, 27, -126], [-20, 31, -92], [-23, 34, -52]],
      body: '#16265c', belly: '#f4f4ee', wingC: '#1a2a66', trail: '#22347a', tip: '#0c1434', head: '#1c2c6a' });
    scene.add(loopBirds.object);
    await ctx.yield();
    // time the birds so that they cross the path (route point 12) when the camera is 17 m short of it
    let crossD = 0; for (let i = 1; i <= 12; i++) crossD += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1], route[i][2] - route[i - 1][2]);
    const SEC_PER_U = path.length / 15, BIRD_U0 = uAt(95, -362.5) - (crossD / BIRD_V) / SEC_PER_U;
    const BIRD_T = (birds.route ? birds.route.length : 330) / BIRD_V;
    // by the hearth: the kettle steams on its ring (every look); at dusk the hearth throws sparks into the room
    steam('kettle', [278.6, 7.4, -346.5], 24, [0.9, 4.6], [1.5, 7.5], 30, 0.32, [-0.5, 0, 0.6]);
    if (L.fire) set.add(fx.makeParticles({ rng: rng.fork('hearth-sparks'), preset: 'embers', time, follow: false, center: [270, 13, -362.5], box: [34, 26, 40], count: Math.round(340 * detail), intensity: 1.3 }));
    await ctx.yield();

    // ------------------------------------------------------------------ gaze
    const gz = new THREE.Vector3(), gz2 = new THREE.Vector3(), uPot = uAt(PX, -158), uBowl = uAt(PX, -206), uCat = uAt(PX, -224);
    const pois = [
      { at: (t, u) => hero.figureAt(u, gz), from: 0.0, to: 0.165, weight: 0.55 },                         // the entry and the close pass
      { at: (t, u) => hero.secondCentre(u, gz2), from: 0.122, to: 0.225, weight: 0.45 },                  // the bough flock crossing overhead
      { at: new THREE.Vector3(5, TABLE_Y + 3.5, -158), from: uPot - 0.085, to: uPot + 0.012, weight: 0.62 },
      { at: new THREE.Vector3(4.6, TABLE_Y + 2.4, -206), from: uBowl - 0.075, to: uBowl + 0.008, weight: 0.66 },
      { at: new THREE.Vector3(7.0, TABLE_Y + 1.2, -223.5), from: uCat - 0.05, to: uCat - 0.004, weight: 0.6, fade: 0.4 },
      { at: new THREE.Vector3(32.5, 22, -283), from: 0.34, to: 0.475, weight: 0.88 },                    // the crow, whole and square in the frame
      { at: (t, u) => hero.figureAt(u, gz), from: 0.44, to: 0.62, weight: 0.75 },                         // he lifts off the wall as one picture, folds and flies ahead of us
      { at: (t, u) => hero.figureAt(u, gz), from: 0.56, to: 0.76, weight: 0.7 },                          // round the corner and down the short arm, the hearth beyond him
      { at: (t, u) => hero.figureAt(u, gz), from: 0.72, to: 0.9, weight: 0.55 },                          // he lands whole on the north wall and struts on ahead
    ];
    const sm = ctx.core.smoothstep, camP = new THREE.Vector3();
    return {
      scene, path, duration: DUR,
      pace: (u) => 1 + 0.1 * bell(u, 0.05, 0.2, 0.3) - 0.22 * bell(u, 0.23, 0.54, 0.25) - 0.18 * bell(u, 0.585, 0.69, 0.3) + 0.14 * bell(u, 0.7, 0.88, 0.3),
      camera: { fov: 54, near: 0.3, far: 900, lookAhead: 20, sway: 0.6, bank: 0.7 },
      pois,
      portal: { shape: 'arch', width: 14, height: 15, color: L.portal, glow: 0.45, revealDistance: 250 },
      post: { exposure: L.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 1.05 },
        grade: { saturation: L.sat, contrast: 1.05, tint: L.tint, shadowTint: L.shadowTint, vignette: 0.25, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, t, camera, u) {
        time.value = t; PU.uTime.value = t;
        hero.setProgress(u); hero.update(dt, t, camera);
        // the cat: slow tail curl, an ear flick now and then, both stirred as the camera comes by
        const near = bell(u, uCat - 0.05, uCat + 0.03, 0.4), flick = Math.pow(Math.max(Math.sin(t * 0.83 + 1.1), 0), 24) + near * Math.max(Math.sin(t * 2.1), 0);
        PU.uCat.value.set(0.85 + 0.15 * Math.sin(t * 0.55) + 0.2 * near * Math.sin(t * 1.3), 0.5 + 0.5 * Math.sin(t * 1.7), 0.2 * flick * Math.sin(t * 17), 0);
        // the cauldron swings on its chain; its steam follows
        const sw = 0.016 * Math.sin(t * 0.52) + 0.006 * Math.sin(t * 1.31);
        cauldron.rotation.z = sw; cauldron.rotation.x = 0.008 * Math.sin(t * 0.47 + 1);
        cSteam.uniforms.uBase.value.set(HOOK.x + Math.sin(sw) * (DROP - 4.2), HOOK.y - DROP + 4.2, HOOK.z);
        // a swallow crosses the first chimney's disc of sky about every nine seconds: its shadow sweeps the table
        const gp = (t % 9.2) / 1.3; swallowShadow.visible = gp < 1 && !L.fire;
        swallowShadow.position.set(-9 + 18 * gp, TABLE_Y + 0.05, -177 + 4 * gp); swallowShadow.scale.set(0.8 + 0.4 * Math.abs(Math.sin(t * 9)), 1, 1);
        set.update(dt, t, camera);
        birds.object.visible = u > BIRD_U0;
        birds.update(dt, Math.min(Math.max(0, u - BIRD_U0) * SEC_PER_U, BIRD_T), camera);
        loopBirds.update(dt, t, camera);
        if (blizzard) blizzard.uniforms.uTime.value = t;
        if (flames) {      // the fires breathe: every glow flickers a little, never flashes
          flames.update(dt, t, camera);
          const fv = HU.uFires.value;
          for (let i = 0; i < 12; i++) fv[i].w = FIRES[i][3] * (0.93 + 0.06 * Math.sin(t * (6.3 + i * 0.9) + i * 1.7) + 0.04 * Math.sin(t * (11.7 + i * 1.3) + i));
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
