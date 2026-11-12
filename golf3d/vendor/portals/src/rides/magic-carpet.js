// Magic carpet: the rider sits near the back of a 2.2 x 3 m knotted carpet and sees its front
// third along the bottom of the frame: border, guard stripes, corner spandrels, a fringe of
// tassels, a brass oil lamp burning on the left and a glass of tea steaming on a tray on the right.
// The cloth is alive: a ripple travels from the front edge to the back, the edges flutter with
// speed, the carpet banks by curling (the high side's corner lifts), gold thread glints, the glass
// slides on its tray and gold motes shed from the edges stream past on both sides.
// Ride space: the eye is at the origin looking down -Z; the carpet lies 1 m below it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const HW = 1.1, ZF = -2.6, ZB = 0.4, DROP = -1.0;     // half width, front and back edge, carpet height
const ZC = (ZF + ZB) / 2, HL = (ZB - ZF) / 2;            // carpet centre and half length
const LAMP = [-0.78, -1.9], TRAY = [0.8, -1.95];         // where the lamp and the tea tray stand (x, z)

// The cloth's height field, in GLSL and (below) the same thing in JS so the lamp and tray ride it.
// uPh = (ripple phase, flutter phase), uMv = (bank: + lifts the right side, speed 0..1, surge)
const HEIGHT_GLSL = /* glsl */`
uniform vec2 uPh; uniform vec3 uMv;
float carpetH(vec2 p) {
  float fx = p.x / ${HW.toFixed(2)};
  float front = smoothstep(-0.9, ${ZF.toFixed(2)}, p.y);
  float back = smoothstep(0.1, ${ZB.toFixed(2)}, p.y);
  float seat = 1.0 - smoothstep(0.25, 1.1, length(p * vec2(1.0, 0.9)));
  float amp = (0.010 + 0.035 * front + 0.05 * back) * (1.0 - 0.8 * seat) * (0.8 + 0.5 * uMv.y);
  float h = amp * sin(p.y * 4.2 - uPh.x + 0.6 * fx * fx);
  float edge = smoothstep(0.5, 1.0, abs(fx));
  h += edge * (0.008 + 0.018 * uMv.y) * sin(p.y * 9.0 - uPh.y + sign(p.x) * 1.7);
  h += 0.035 * fx * fx * fx * fx;
  h += uMv.x * fx * abs(fx) * 0.16;
  float cr = front * front * smoothstep(0.35, 1.0, abs(fx));
  h += cr * (0.022 + 0.16 * max(0.0, uMv.x * sign(p.x)) + 0.012 * sin(uPh.y * 0.7 + p.x * 3.0));
  h -= front * front * 0.02 * uMv.z;
  return h;
}`;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function carpetH(x, z, ph, mv) {
  const fx = x / HW, front = sstep(-0.9, ZF, z), back = sstep(0.1, ZB, z);
  const seat = 1 - sstep(0.25, 1.1, Math.hypot(x, z * 0.9));
  const amp = (0.010 + 0.035 * front + 0.05 * back) * (1 - 0.8 * seat) * (0.8 + 0.5 * mv.y);
  let h = amp * Math.sin(z * 4.2 - ph.x + 0.6 * fx * fx);
  const edge = sstep(0.5, 1.0, Math.abs(fx)), sg = Math.sign(x);
  h += edge * (0.008 + 0.018 * mv.y) * Math.sin(z * 9.0 - ph.y + sg * 1.7);
  h += 0.035 * fx * fx * fx * fx;
  h += mv.x * fx * Math.abs(fx) * 0.16;
  const cr = front * front * sstep(0.35, 1.0, Math.abs(fx));
  h += cr * (0.022 + 0.16 * Math.max(0, mv.x * sg) + 0.012 * Math.sin(ph.y * 0.7 + x * 3.0));
  h -= front * front * 0.02 * mv.z;
  return h;
}

// The woven design: selvedge, dotted guard stripe, main border of rosettes on a vine, a gold-thread
// inner guard, then the field with a small all-over diaper, scalloped corner spandrels and a lobed
// centre medallion with pendants. p is in metres on the carpet; everything is anti-aliased with w.
const PATTERN_GLSL = /* glsl */`
uniform vec3 uField, uBorder, uAccent, uIvory, uGold, uLampCol, uEnv;
uniform vec4 uLampAt;      // xyz = flame position (ride space), w = strength of its pool of light
uniform vec3 uStyle;       // medallion lobes, border motif (0 rosette, 1 lozenge), abrash offset
uniform float uTime;
varying vec2 vCp; varying vec3 vRp;
float cHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cNoise(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(cHash(vec2(i, 3.0)), cHash(vec2(i + 1.0, 3.0)), f); }
vec4 carpetCol(vec2 p, float w) {           // rgb = dye colour, a = how much gold thread
  vec2 q = p - vec2(0.0, ${ZC.toFixed(3)});
  vec2 aq = abs(q), hs = vec2(${HW.toFixed(2)}, ${HL.toFixed(2)});
  vec2 de = hs - aq; float d = min(de.x, de.y);
  float s = de.x < de.y ? q.y : q.x;       // coordinate running along the nearest edge
  float gold = 0.0; vec3 c;
  // ---- field ----
  vec3 fieldC = uField * (0.86 + 0.24 * cNoise(q.y * 7.0 + uStyle.z) );   // abrash: dye lots change row by row
  c = fieldC;
  vec2 g = vec2(q.x + q.y, q.x - q.y) / 0.16; vec2 gi = floor(g), gf = fract(g) - 0.5;
  float fl = length(gf) * 0.16; float fa = atan(gf.y, gf.x);
  float petal = 1.0 - smoothstep(-w, w, fl - 0.021 * (0.55 + 0.45 * abs(cos(fa * 2.0))));
  c = mix(c, mix(uIvory, uAccent, step(0.5, cHash(gi))) * 0.9, petal * 0.8);
  c = mix(c, uGold, (1.0 - smoothstep(-w, w, fl - 0.006)) );
  // trellis joining the flowers
  c = mix(c, uBorder, (1.0 - smoothstep(0.002, 0.004 + w, 0.08 - max(abs(gf.x), abs(gf.y)) * 0.16)) * 0.55);
  // ---- centre medallion with pendants ----
  vec2 m = q * vec2(1.0, 0.86) / 1.24; float mr = length(m), ma = atan(m.y, m.x);
  float lobes = 0.5 + 0.5 * cos(ma * uStyle.x);
  float R = 0.50 * (0.82 + 0.18 * pow(lobes, 0.6));
  vec2 pq = vec2(aq.x, aq.y - 0.95); float pend = pq.x / 0.085 + abs(pq.y) / 0.17;   // pendant lozenges fore and aft
  float md = min((mr - R) * 1.24, (pend - 1.0) * 0.07);
  if (md < 0.03) {
    vec3 mc = uBorder;
    mc = mix(mc, uAccent, 1.0 - smoothstep(-w, w, mr - R * 0.74));
    mc = mix(mc, uIvory, 1.0 - smoothstep(-w, w, abs(mr - R * 0.74) - 0.006));
    float star = mr - 0.21 * (0.62 + 0.38 * abs(cos(ma * uStyle.x * 0.5)));
    mc = mix(mc, uField * 1.1, 1.0 - smoothstep(-w, w, star));
    float gl = 1.0 - smoothstep(-w, w, abs(star) - 0.005); mc = mix(mc, uGold, gl); gold = max(gold, gl);
    float eye = 1.0 - smoothstep(-w, w, mr - 0.05 * (0.7 + 0.3 * cos(ma * 8.0))); mc = mix(mc, uGold, eye); gold = max(gold, eye);
    mc = mix(mc, uIvory, (1.0 - smoothstep(-w, w, abs(pend - 0.55) * 0.07 - 0.004)) * step(mr, 10.0) * step(R, mr));
    c = mix(c, mc, 1.0 - smoothstep(-w, w, md));
    float ol = 1.0 - smoothstep(-w, w, abs(md) - 0.007); c = mix(c, uIvory, ol);
    float ol2 = 1.0 - smoothstep(-w, w, abs(md - 0.02) - 0.003); c = mix(c, uGold, ol2); gold = max(gold, ol2);
  }
  // ---- corner spandrels: quarter medallions with scalloped edges ----
  vec2 sc = aq - (hs - 0.30); float sr = length(sc), sa = atan(sc.y, sc.x);
  float SR = 0.40 + 0.028 * cos(sa * 14.0);
  float sd = sr - SR;
  if (sd < 0.03) {
    vec3 scol = mix(uBorder, uAccent * 0.9, 1.0 - smoothstep(-w, w, sr - 0.25 - 0.02 * cos(sa * 14.0)));
    scol = mix(scol, uIvory, 1.0 - smoothstep(-w, w, abs(sr - 0.25 - 0.02 * cos(sa * 14.0)) - 0.005));
    float sp = 1.0 - smoothstep(-w, w, sr - 0.13 * (0.6 + 0.4 * abs(cos(sa * 5.0)))); scol = mix(scol, uGold, sp); gold = max(gold, sp * 0.8);
    c = mix(c, scol, 1.0 - smoothstep(-w, w, sd));
    c = mix(c, uIvory, 1.0 - smoothstep(-w, w, abs(sd) - 0.006));
    float so = 1.0 - smoothstep(-w, w, abs(sd - 0.018) - 0.003); c = mix(c, uGold, so); gold = max(gold, so);
  }
  // ---- inner guard: a rope of gold thread between two dark lines ----
  if (d < 0.31) {
    float gd = d - 0.285;
    float rope = 0.5 + 0.5 * sin((s + gd * 1.2) * 190.0);
    vec3 gc = mix(uGold * 0.55, uGold * 1.15, rope);
    gc = mix(gc, uBorder * 0.35, smoothstep(0.014 - w, 0.014 + w, abs(gd)));
    c = mix(c, gc, 1.0 - smoothstep(-w, w, abs(gd) - 0.022)); gold = max(gold, (1.0 - smoothstep(-w, w, abs(gd) - 0.014)) * (0.5 + 0.5 * rope));
  }
  // ---- main border ----
  if (d < 0.263) {
    vec3 bc = uBorder * (0.9 + 0.2 * cNoise(s * 9.0 + 40.0));
    float cell = s / 0.2 + 0.5; float ci = floor(cell); vec2 uv = vec2((fract(cell) - 0.5) * 0.2, d - 0.162);
    float vine = uv.y - 0.05 * sin(cell * 6.2832 + 1.5708);                      // the vine winds between the flowers
    bc = mix(bc, uIvory * 0.9, (1.0 - smoothstep(-w, w, abs(vine) - 0.0045)) * 0.9);
    vec2 lf = vec2(abs(fract(cell + 0.5) - 0.5) * 0.2, uv.y); float leaf = lf.x / 0.028 + abs(lf.y) / 0.06;   // buds on the cell joints
    bc = mix(bc, uGold, 1.0 - smoothstep(-w * 20.0, w * 20.0, leaf - 1.0));
    float r = length(uv), a = atan(uv.y, uv.x); float alt = mod(ci, 2.0);
    float rr = uStyle.y < 0.5 ? 0.066 * (0.68 + 0.32 * cos(a * 8.0)) : 0.07 * (1.0 / (abs(cos(a)) + abs(sin(a)))) * (0.9 + 0.1 * cos(a * 4.0));
    float ro = r - rr;
    vec3 rc = mix(uAccent, uField * 1.15, alt);
    rc = mix(rc, uIvory, 1.0 - smoothstep(-w, w, r - 0.034 * (0.7 + 0.3 * cos(a * 8.0 + 3.1416))));
    rc = mix(rc, mix(uField, uAccent, alt), 1.0 - smoothstep(-w, w, r - 0.017));
    float pip = 1.0 - smoothstep(-w, w, r - 0.008); rc = mix(rc, uGold, pip);
    bc = mix(bc, rc, 1.0 - smoothstep(-w, w, ro));
    bc = mix(bc, uIvory, 1.0 - smoothstep(-w, w, abs(ro) - 0.004));
    c = mix(c, bc, 1.0 - smoothstep(-w, w, d - 0.26));
    gold = mix(max((1.0 - smoothstep(-w * 20.0, w * 20.0, leaf - 1.0)) * 0.7 * smoothstep(-w, w, ro), pip), gold, smoothstep(0.255, 0.265, d));
  }
  // ---- outer guard stripe: ivory with a running chain of little diamonds ----
  if (d < 0.066) {
    float gd = d - 0.044; float k = abs(fract(s * 20.0) - 0.5) / 20.0 + abs(gd);
    vec3 gc = mix(mix(uAccent, uBorder, step(0.5, fract(s * 10.0))), uIvory, smoothstep(0.012 - w, 0.012 + w, k));
    c = mix(c, gc, 1.0 - smoothstep(-w, w, abs(gd) - 0.019));
    c = mix(c, uBorder * 0.4, 1.0 - smoothstep(-w, w, abs(abs(gd) - 0.021) - 0.0025));
    gold *= smoothstep(0.06, 0.07, d);
  }
  // ---- selvedge: overcast binding ----
  if (d < 0.023) { c = mix(uBorder * 0.45, uAccent * 0.5, 0.5 + 0.5 * sin(s * 260.0)); gold = 0.0; }
  return vec4(c, gold);
}`;

// ---------- small modelling helpers ----------
const V3 = THREE.Vector3;
// a tube through points with a radius per point (spouts, handles, tassel skirts, spoon)
function tube(pts, radii, radial, capped) {
  const pos = [], idx = [], n = pts.length, t = new V3(), up = new V3(), a = new V3(), b = new V3();
  for (let i = 0; i < n; i++) {
    t.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    up.set(0, 1, 0); if (Math.abs(t.y) > 0.9) up.set(1, 0, 0);
    a.crossVectors(t, up).normalize(); b.crossVectors(a, t).normalize();
    for (let j = 0; j < radial; j++) { const an = j / radial * Math.PI * 2, c = Math.cos(an) * radii[i], s = Math.sin(an) * radii[i]; pos.push(pts[i].x + a.x * c + b.x * s, pts[i].y + a.y * c + b.y * s, pts[i].z + a.z * c + b.z * s); }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) { const p = i * radial + j, q = i * radial + (j + 1) % radial; idx.push(p, q, p + radial, q, q + radial, p + radial); }
  if (capped) for (const e of [0, n - 1]) { const c = pos.length / 3; pos.push(pts[e].x, pts[e].y, pts[e].z); for (let j = 0; j < radial; j++) { const p = e * radial + j, q = e * radial + (j + 1) % radial; if (e) idx.push(p, q, c); else idx.push(q, p, c); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a turned shape from a profile of [radius, height] pairs
function lathe(profile, seg) { const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg); g.deleteAttribute('uv'); return g; }
// give a geometry the vertex colour and glow attributes the props material wants
function paint(g, fn) {
  if (g.attributes.uv) g.deleteAttribute('uv');
  const p = g.attributes.position, col = new Float32Array(p.count * 3), glow = new Float32Array(p.count), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const r = fn(p.getX(i), p.getY(i), p.getZ(i), c) || 0; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; glow[i] = r; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1)); return g;
}
const place = (g, x, y, z, ry = 0, s = 1) => g.applyMatrix4(new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(s, s, s)));

const PALETTES = [
  { field: '#96202a', border: '#22357a', accent: '#c9862b' },   // madder red and indigo
  { field: '#3152ac', border: '#7c1f2a', accent: '#c7a24a' },   // indigo and madder
  { field: '#1c7462', border: '#5c2850', accent: '#d0733a' },   // emerald and plum
  { field: '#742c72', border: '#1c5266', accent: '#d9a441' },   // plum and deep teal
  { field: '#a84e1c', border: '#2a5a5c', accent: '#e2c27a' },   // rust and teal
];
const METALS = ['#c9952e', '#c08350', '#d09a5c'];               // brass, copper, rose gold

export default {
  id: 'magic-carpet', name: 'Magic Carpet',
  media: ['air', 'open', 'interior', 'tiny'],
  near: 0.8,
  gaze: 0.8,
  stow: [0, -2.6, 1.4],
  async build(ctx) {
    const { rng, lit, fill } = ctx;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const pal = rng.pick(PALETTES), metalHex = rng.pick(METALS);
    const seedAccent = new THREE.Color(pal.accent), fieldC = new THREE.Color(pal.field), accentTarget = seedAccent.clone();
    const U = {                                                   // shared by the cloth, the fringe and the sprites
      uPh: { value: new THREE.Vector2() }, uMv: { value: new V3() }, uTime: { value: 0 },
      uField: { value: fieldC }, uBorder: { value: new THREE.Color(pal.border) }, uAccent: { value: seedAccent.clone() },
      uIvory: { value: new THREE.Color('#d2c5a6') }, uGold: { value: new THREE.Color('#d6a136') },
      uLampCol: { value: new THREE.Color(1.0, 0.55, 0.2) }, uLampAt: { value: new THREE.Vector4(0, 0, 0, 0.5) },
      uStyle: { value: new V3(rng.pick([8, 12, 16]), rng.chance(0.5) ? 0 : 1, rng.range(0, 50)) },
      uGlowK: { value: 1 }, uEnv: { value: new THREE.Color(0.2, 0.2, 0.2) },
    };
    const share = (sh, names) => { for (const n of names) sh.uniforms[n] = U[n]; };

    // ---------- the carpet ----------
    const cg = new THREE.PlaneGeometry(HW * 2, HL * 2, 36, 50); cg.rotateX(-Math.PI / 2); cg.translate(0, 0, ZC);
    const cloth = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.93, metalness: 0, side: THREE.DoubleSide });
    cloth.onBeforeCompile = (sh) => {
      share(sh, ['uPh', 'uMv', 'uTime', 'uField', 'uBorder', 'uAccent', 'uIvory', 'uGold', 'uLampCol', 'uLampAt', 'uStyle', 'uEnv']);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vCp; varying vec3 vRp;\n' + HEIGHT_GLSL)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          { vec2 cp = position.xz; float h0 = carpetH(cp);
            objectNormal = normalize(vec3(h0 - carpetH(cp + vec2(0.03, 0.0)), 0.03, h0 - carpetH(cp + vec2(0.0, 0.03)))); }`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          transformed.y += carpetH(position.xz); vCp = position.xz; vRp = transformed + vec3(0.0, ${DROP.toFixed(2)}, 0.0);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + PATTERN_GLSL)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float cw = length(fwidth(vCp)) * 0.75;
          vec4 cc = carpetCol(vCp, cw);
          float knotFade = clamp(1.0 - cw * 190.0, 0.0, 1.0);
          float knots = sin(vCp.x * 520.0) * sin(vCp.y * 520.0);
          cc.rgb *= 1.0 + 0.16 * knots * knotFade;
          cc.rgb *= 0.93 + 0.14 * cHash(floor(vCp * 55.0));                       // tufts take the dye unevenly
          if (!gl_FrontFacing) {                                                  // the back: the same design, ghostly, on jute
            float warp = 0.5 + 0.5 * sin(vCp.x * 300.0) * knotFade;
            cc = vec4(mix(vec3(0.42, 0.34, 0.24) * (0.8 + 0.3 * warp), cc.rgb, 0.35), 0.0);
          }
          diffuseColor.rgb = cc.rgb;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { float glint = pow(0.5 + 0.5 * sin(vCp.y * 5.0 + vCp.x * 2.0 + uTime * 1.7), 8.0);
            float spark = step(0.86, cHash(floor(vCp * 140.0))) * (0.5 + 0.5 * sin(uTime * 5.0 + cHash(floor(vCp * 140.0) + 7.0) * 40.0));
            totalEmissiveRadiance += uGold * cc.a * (0.10 + 1.1 * glint + 0.9 * spark * glint);      // gold thread catching the light
            vec3 dl = uLampAt.xyz - vRp; float d2 = dot(dl, dl);
            float lam = clamp(dl.y / sqrt(d2) + 0.35, 0.0, 1.0);
            totalEmissiveRadiance += cc.rgb * uLampCol * (uLampAt.w * lam / (1.0 + d2 * 16.0));
            float graze = 1.0 - abs(dot(normal, normalize(vViewPosition)));                            // the pile catches the sky at grazing angles
            vec3 skyL = mix(uEnv, vec3(dot(uEnv, vec3(0.333))), 0.55);
            totalEmissiveRadiance += cc.rgb * skyL * (0.24 + 0.40 * graze * graze); }       // the lamp's pool of light`);
    };
    cloth.customProgramCacheKey = () => 'magic-carpet-cloth';
    lit(cloth);
    const carpet = new THREE.Mesh(cg, cloth); carpet.position.y = DROP; body.add(carpet);

    // ---------- the fringe: knotted tassels along both ends, big gold ones on the corners ----------
    const TL = 0.25;
    const skirtPts = [], skirtR = [];
    for (let i = 0; i <= 4; i++) { const l = i / 4; skirtPts.push(new V3(0, 0, -0.014 - l * (TL - 0.014))); skirtR.push([0.005, 0.014, 0.019, 0.021, 0.017][i]); }
    const knot = new THREE.OctahedronGeometry(0.017, 0); knot.scale(1, 0.9, 1.3); knot.translate(0, 0, -0.008); knot.deleteAttribute('uv');
    const skirt = tube(skirtPts, skirtR, 5, true).toNonIndexed();
    const tg = mergeGeometries([knot, skirt]);
    const NT = 40, NB = 8, total = NT + NB + 4;
    const tasselMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    tasselMat.onBeforeCompile = (sh) => {
      share(sh, ['uPh', 'uMv', 'uEnv']);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uEnv;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uEnv * 0.34;   // light comes through loose threads\n');
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSeed;\n' + HEIGHT_GLSL)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec3 ip = instanceMatrix[3].xyz; float sc = length(instanceMatrix[0].xyz);
            float dirz = sign(instanceMatrix[2].z);                                // +1 front edge, -1 back edge
            float l = clamp(-position.z / ${TL.toFixed(3)}, 0.0, 1.0);
            float hh = carpetH(ip.xz);
            float slope = clamp((hh - carpetH(ip.xz + vec2(0.0, 0.07 * dirz))) / 0.07, -0.35, 0.35);   // carry on along the cloth's own slope
            float ph = uPh.y * 1.7 + ip.x * 5.3 + aSeed * 1.3;
            float whip = 0.3 + 0.7 * uMv.y;
            transformed.y += hh / sc + l * ${TL.toFixed(3)} * slope + l * l * (-0.062 - 0.022 * aSeed + 0.04 * uMv.y + whip * 0.045 * sin(ph - l * 2.6));
            transformed.x += l * l * (whip * 0.04 * sin(ph * 0.83 + 1.3 - l * 2.0) - uMv.x * 0.05 * dirz); }`);
    };
    tasselMat.customProgramCacheKey = () => 'magic-carpet-fringe';
    lit(tasselMat);
    const seeds = new Float32Array(total); for (let i = 0; i < total; i++) seeds[i] = rng();
    tg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    const fringe = new THREE.InstancedMesh(tg, tasselMat, total);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), YA = new V3(0, 1, 0), tc = new THREE.Color();
    const ivory = new THREE.Color('#dccfae'), tGold = new THREE.Color('#d9a52f'), tAlt = new THREE.Color(rng.chance(0.5) ? pal.accent : pal.field).lerp(ivory, 0.2);
    const altEvery = rng.pick([2, 3, 4]);
    let k = 0;
    for (const end of [0, 1]) {
      Q.setFromAxisAngle(YA, end ? Math.PI : 0);
      const cnt = end ? NB : NT;
      for (let i = 0; i < cnt; i++) {
        const x = -HW + 0.04 + (i + 0.5) * (HW * 2 - 0.08) / cnt, sc = 0.92 + 0.2 * rng();
        M.compose(new V3(x, DROP, end ? ZB : ZF), Q, new V3(sc, sc, sc)); fringe.setMatrixAt(k, M);
        fringe.setColorAt(k, tc.copy(i % altEvery === 0 ? tAlt : ivory).multiplyScalar(0.85 + 0.25 * rng())); k++;
      }
      for (const sx of [-1, 1]) { M.compose(new V3(sx * (HW - 0.005), DROP, end ? ZB : ZF), Q, new V3(2.4, 2.4, 1.45)); fringe.setMatrixAt(k, M); fringe.setColorAt(k, tGold); k++; }
    }
    fringe.instanceMatrix.needsUpdate = true; fringe.instanceColor.needsUpdate = true; body.add(fringe);

    // ---------- brass and glass: one material, vertex colours, aFx = (own glow, metal shine, glass) ----------
    const metal = new THREE.Color(metalHex), dark = metal.clone().multiplyScalar(0.32);
    const props = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.36, metalness: 0.3 });
    props.onBeforeCompile = (sh) => {
      share(sh, ['uGlowK', 'uEnv']);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aFx; varying vec3 vFx;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFx = aFx;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlowK; uniform vec3 uEnv; varying vec3 vFx;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { vec3 rf = reflect(-normalize(vViewPosition), normal);
            float sky = smoothstep(-0.35, 0.9, rf.y); float band = 0.3 * sky + 0.9 * pow(max(0.0, 1.0 - abs(rf.y - 0.2) * 2.6), 3.0) + 0.5 * pow(max(0.0, 1.0 - abs(rf.x - 0.35) * 4.0), 3.0);
            totalEmissiveRadiance += diffuseColor.rgb * (mix(uEnv, vec3(dot(uEnv, vec3(0.333))) * vec3(1.0, 0.82, 0.55), 0.6) * 0.6 + vec3(0.14, 0.09, 0.03)) * (0.10 + 0.95 * band) * vFx.y;      // a polished thing mirrors the sky it flies under
            float fr = 1.0 - abs(dot(normal, normalize(vViewPosition)));                   // glass: tea is deep in the middle and bright
            float thin = mix(1.0, 0.45 + 2.2 * fr * fr, vFx.z);                              // where the light gets round it at the sides
            totalEmissiveRadiance += diffuseColor.rgb * vFx.x * uGlowK * thin;
            float stripe = pow(max(0.0, 1.0 - abs(normal.x + 0.50) * 6.0), 2.0) + 0.35 * pow(max(0.0, 1.0 - abs(normal.x - 0.66) * 7.0), 2.0);
            totalEmissiveRadiance += (uEnv * 1.3 + vec3(0.30, 0.24, 0.16) * uGlowK) * (stripe * 0.85 + 0.5 * pow(fr, 4.0)) * vFx.z; }`);
    };
    props.customProgramCacheKey = () => 'magic-carpet-props';
    lit(props);
    const fx = (g, fn) => { paint(g, fn); const a = g.attributes.aGlow, o = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { const v = a.getX(i); o[i * 3] = v % 10; o[i * 3 + 1] = v >= 10 && v < 20 ? 1 : 0; o[i * 3 + 2] = v >= 20 ? 1 : 0; } g.deleteAttribute('aGlow'); g.setAttribute('aFx', new THREE.BufferAttribute(o, 3)); return g; };
    // paint functions return their own glow (0..9), plus 10 for polished metal or 20 for glass
    const engr = (y, f) => 0.80 + 0.20 * Math.sin(y * f) ;

    // --- the lamp: turned foot and body, hinged lid with a finial, long spout, looped handle, studs ---
    const lampParts = [];
    const flameAt = new V3(0.262, 0.150, 0);                       // spout mouth, lamp space
    const warm = (x, y, z) => { const d = Math.hypot(x - flameAt.x, y - flameAt.y, z - flameAt.z); return 0.9 / (1 + d * d * 900) + 0.8 / (1 + d * d * 30); };
    const lampPaint = (x, y, z, c) => { c.copy(metal).multiplyScalar(engr(y, 520) * (0.62 + 0.38 * Math.min(1, y / 0.05))); if (Math.abs(y - 0.078) < 0.004 || Math.abs(y - 0.046) < 0.003) c.copy(dark); return 10 + warm(x, y, z); };
    const bodyG = lathe([[0, 0], [0.040, 0], [0.045, 0.004], [0.041, 0.010], [0.025, 0.018], [0.020, 0.028], [0.030, 0.036], [0.058, 0.046], [0.078, 0.062], [0.085, 0.074], [0.085, 0.082], [0.078, 0.092], [0.060, 0.104], [0.041, 0.110], [0.037, 0.114], [0.038, 0.117], [0.031, 0.124], [0.016, 0.132], [0.007, 0.137], [0.011, 0.142], [0.013, 0.148], [0.007, 0.154], [0, 0.158]], 22);
    bodyG.scale(1.12, 1, 0.86); lampParts.push(fx(bodyG, lampPaint));
    const sp = [], sr = []; for (let i = 0; i <= 8; i++) { const t = i / 8; sp.push(new V3(0.06 + 0.2 * t, 0.068 + 0.012 * t + 0.07 * t * t * t + 0.004 * Math.sin(t * 3.1), 0)); sr.push(i === 8 ? 0.0125 : 0.031 - 0.021 * Math.pow(t, 0.8)); }
    lampParts.push(fx(tube(sp, sr, 10, false), lampPaint));
    const wick = new THREE.CylinderGeometry(0.004, 0.005, 0.016, 5); wick.translate(flameAt.x - 0.002, flameAt.y - 0.004, 0); lampParts.push(fx(wick, (x, y, z, c) => { c.set('#2a1608'); return 1.6; }));
    const hp = [], hr = []; for (let i = 0; i <= 12; i++) { const a = (-110 + 290 * i / 12) * Math.PI / 180, R = 0.04 + (i > 10 ? (i - 10) * 0.012 : 0); hp.push(new V3(-0.108 - Math.cos(a) * R * 0.85 + 0.03, 0.082 + Math.sin(a) * R, 0)); hr.push(0.0075 - 0.003 * (i / 12)); }
    lampParts.push(fx(tube(hp, hr, 7, true), lampPaint));
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, st = new THREE.OctahedronGeometry(0.0055, 1); st.translate(Math.cos(a) * 0.085 * 1.12, 0.078, Math.sin(a) * 0.085 * 0.86); lampParts.push(fx(st, (x, y, z, c) => { c.copy(metal).multiplyScalar(1.15); return 10 + warm(x, y, z); })); }
    const mat0 = lathe([[0, 0.0], [0.05, 0.001], [0.09, 0.0015], [0.105, 0.002], [0.11, 0.0]], 24);                      // a little felt mat under it
    lampParts.push(fx(mat0, (x, y, z, c) => { const r = Math.hypot(x, z); c.set(r > 0.085 ? pal.accent : pal.border).multiplyScalar(0.8); return 0.25 / (1 + r * r * 150); }));
    const lampG = mergeGeometries(lampParts.map((g) => g.index ? g.toNonIndexed() : g));
    const lampYaw = Math.PI / 2 + 0.85, lampS = 1.1;
    place(lampG, 0, 0, 0, lampYaw, lampS);
    const lamp = new THREE.Mesh(lampG, props); body.add(lamp);
    const flameLocal = flameAt.clone().applyAxisAngle(YA, lampYaw).multiplyScalar(lampS);

    // --- the tea things: chased tray, a small pot, and (separately, because it slides) glass and saucer ---
    const trayParts = [];
    const trayG = lathe([[0, 0.006], [0.03, 0.006], [0.06, 0.0065], [0.09, 0.006], [0.12, 0.0065], [0.15, 0.006], [0.172, 0.007], [0.182, 0.013], [0.188, 0.026], [0.193, 0.027], [0.187, 0.011], [0.172, 0.0], [0, 0]], 28);
    trayParts.push(fx(trayG, (x, y, z, c) => { const r = Math.hypot(x, z), a = Math.atan2(z, x); let k = 0.92; if (r > 0.05 && r < 0.16) k = 0.74 + 0.22 * Math.abs(Math.sin(a * 9 + r * 60)); if (Math.abs(r - 0.15) < 0.012) k = 0.5; c.copy(metal).multiplyScalar(k); return 10.14; }));
    const potAt = [0.075, 0.045];
    const pot = lathe([[0, 0.006], [0.034, 0.006], [0.037, 0.012], [0.03, 0.02], [0.046, 0.04], [0.054, 0.06], [0.05, 0.08], [0.036, 0.096], [0.027, 0.104], [0.03, 0.108], [0.022, 0.116], [0.01, 0.122], [0.006, 0.128], [0.01, 0.134], [0.006, 0.14], [0, 0.142]], 20);
    const potPaint = (x, y, z, c) => { c.copy(metal).multiplyScalar(engr(y, 430) * 0.95); if (Math.abs(y - 0.06) < 0.004) c.copy(dark); return 10.22; };
    const potParts = [fx(pot, potPaint)];
    const pp = [], pr = []; for (let i = 0; i <= 7; i++) { const t = i / 7; pp.push(new V3(-0.04 - 0.055 * t - 0.012 * Math.sin(t * 3.14), 0.045 + 0.07 * t * t + 0.015 * t, 0)); pr.push(0.012 - 0.0075 * t); }
    potParts.push(fx(tube(pp, pr, 7, false), potPaint));
    const ph2 = [], phr = []; for (let i = 0; i <= 9; i++) { const a = (-80 + 160 * i / 9) * Math.PI / 180; ph2.push(new V3(0.045 + Math.cos(a) * 0.036, 0.066 + Math.sin(a) * 0.034, 0)); phr.push(0.0052); }
    potParts.push(fx(tube(ph2, phr, 6, true), (x, y, z, c) => { c.set('#2b1a12'); return 0; }));
    const potG = mergeGeometries(potParts); place(potG, potAt[0], 0, potAt[1], 2.3, 1.0); trayParts.push(potG);
    for (let i = 0; i < 3; i++) { const cube = new THREE.BoxGeometry(0.016, 0.014, 0.016); cube.rotateY(i * 1.1); cube.translate(-0.02 + i * 0.021, 0.014 + (i === 1 ? 0.013 : 0), 0.105 - (i === 1 ? 0.004 : 0)); trayParts.push(fx(cube, (x, y, z, c) => { c.set('#e9e4d8'); return 0.06; })); }
    const trayAll = mergeGeometries(trayParts.map((g) => { if (g.attributes.uv) g.deleteAttribute('uv'); return g; }));
    const tray = new THREE.Mesh(trayAll, props); body.add(tray);

    const teaC = new THREE.Color(rng.pick(['#a8380f', '#b5561a', '#8f2a14', '#b0421c']));    // black tea, amber, hibiscus
    const glassParts = [];
    const saucer = lathe([[0, 0.002], [0.022, 0.002], [0.03, 0.003], [0.045, 0.008], [0.052, 0.011], [0.05, 0.007], [0.03, 0.0], [0, 0]], 20);
    glassParts.push(fx(saucer, (x, y, z, c) => { const r = Math.hypot(x, z); c.set(r > 0.046 ? '#c9982f' : '#e6dfd0'); return r > 0.046 ? 10 : 0.05; }));
    // a waisted tea glass: thick clear foot, tea to 85%, a clear band, a pale gilt rim; the tea's surface has a bright meniscus
    const glass = lathe([[0, 0.006], [0.021, 0.006], [0.024, 0.011], [0.0195, 0.03], [0.0185, 0.046], [0.0235, 0.066], [0.0282, 0.083], [0.0290, 0.0865], [0.0304, 0.095], [0.031, 0.099], [0.0295, 0.0985], [0.0282, 0.0875], [0.0268, 0.0845], [0.020, 0.0838], [0, 0.0838]], 18);
    const teaHi = teaC.clone().lerp(new THREE.Color('#ffb04a'), 0.55), clearC = new THREE.Color('#aebfb9');
    glassParts.push(fx(glass, (x, y, z, c) => {
      const r = Math.hypot(x, z);
      if (y > 0.097) { c.set('#ecd9a0'); return 10.35; }                                     // pale gilt rim
      if (y > 0.0855) { c.copy(clearC).multiplyScalar(0.55); return 20.16; }                 // clear glass above the tea
      if (y > 0.0835 && r < 0.0275) {                                                        // the tea's surface
        if (r > 0.024) { c.copy(teaHi); return 1.5; }                                        // meniscus ring
        c.copy(teaC).multiplyScalar(r > 0.01 ? 0.7 : 0.4); return r > 0.01 ? 0.5 : 0.25;
      }
      if (y < 0.012) { c.copy(clearC).multiplyScalar(0.5).lerp(teaC, 0.25); return 20.14; }  // thick foot
      const t = (y - 0.012) / 0.072; c.copy(teaC).multiplyScalar(0.5 + 0.4 * t).lerp(teaHi, 0.3 * t * t); return 20.34 + 0.6 * t * t;   // tea seen through the glass, lighter toward the top
    }));
    const spoonP = [new V3(0.036, 0.011, -0.03), new V3(0.04, 0.012, 0.0), new V3(0.041, 0.013, 0.025), new V3(0.04, 0.012, 0.036), new V3(0.039, 0.011, 0.044)];
    glassParts.push(fx(tube(spoonP, [0.0018, 0.002, 0.003, 0.007, 0.002], 6, true), (x, y, z, c) => { c.set('#d8d2c4'); return 10; }));
    const glassG = mergeGeometries(glassParts); glassG.scale(1.22, 1.22, 1.22);
    const cup = new THREE.Mesh(glassG, props); body.add(cup);
    const cupHome = new V3(-0.062, 0.0075, -0.04), cupTop = 0.1 * 1.22;

    // ---------- flame, halo, steam and gold motes: one instanced billboard draw ----------
    const NF = 3, NS = 14, NM = 72, NSP = NF + 1 + NS + NM;
    const aA = new Float32Array(NSP * 4), aB = new Float32Array(NSP * 3);
    let n = 0;
    const put = (kind, size, x = 0, y = 0, z = 0) => { aA.set([kind, rng(), size, rng()], n * 4); aB.set([x, y, z], n * 3); n++; };
    for (let i = 0; i < NF; i++) put(0, 1 - i * 0.28);
    put(1, 0.36);
    for (let i = 0; i < NS; i++) put(2, 1);
    for (let i = 0; i < NM; i++) {
      const side = i % 2 ? 1 : -1, wide = rng();
      put(3, rng.range(0.010, 0.026) * (rng.chance(0.12) ? 1.8 : 1), side * (HW - 0.05 + wide * wide * 0.6), DROP + rng.range(-0.16, 0.12) + wide * 0.1, ZF - 0.15);
    }
    const sg = new THREE.InstancedBufferGeometry(); const quad = new THREE.PlaneGeometry(1, 1);
    sg.setAttribute('position', quad.attributes.position); sg.setIndex(quad.index);
    sg.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); sg.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 3));
    sg.instanceCount = NSP;
    const SU = {
      uPh: U.uPh, uMv: U.uMv, uTime: U.uTime, uLampCol: U.uLampCol, uGold: U.uGold,
      uFlame: { value: new V3() }, uCup: { value: new V3() }, uMote: { value: 0 }, uPres: { value: 1 },
      uHalo: { value: 0.5 }, uSteam: { value: new THREE.Color(0.6, 0.6, 0.6) }, uSpark: { value: 1 },
    };
    const sprites = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      uniforms: SU, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`
        attribute vec4 aA; attribute vec3 aB;
        uniform vec2 uPh; uniform vec3 uMv, uFlame, uCup; uniform float uTime, uMote;
        varying vec2 vQ; varying vec4 vK;                 // vK = kind, seed, alpha, seed2
        void main() {
          float kind = aA.x, sd = aA.y, sd2 = aA.w; vec2 q = position.xy; vQ = q;
          vec3 c = uFlame; vec2 off = vec2(0.0); float alpha = 1.0;
          float flick = sin(uTime * 23.0 + sd * 9.0) * sin(uTime * 17.3 + sd2 * 5.0);
          if (kind < 0.5) {                               // flame tongues, leaning with the turn and guttering at speed
            float h = (0.058 + 0.010 * flick) * aA.z * (1.0 - 0.25 * uMv.y), w = 0.026 * (0.6 + 0.4 * aA.z);
            float y = q.y + 0.5;
            off = vec2(q.x * w + y * y * (0.012 * sin(uTime * 9.0 + sd * 6.0) * (0.4 + uMv.y) + uMv.x * 0.02), y * h - 0.004);
          } else if (kind < 1.5) {                        // halo
            c += vec3(0.0, 0.02, 0.0); off = q * aA.z * (1.0 + 0.05 * flick);
          } else if (kind < 2.5) {                        // steam off the tea, laid back by the wind of flight
            float a = fract(uTime * (0.26 + 0.1 * sd2) + sd);
            c = uCup + vec3(0.016 * a * sin(a * 7.0 + sd * 1.5 - uTime * 1.6) - uMv.x * 0.05 * a, a * (0.24 - 0.10 * uMv.y), a * a * (0.03 + 0.4 * uMv.y) + 0.01 * cos(a * 7.0 + sd * 11.0));
            off = q * (0.030 + 0.09 * a) * vec2(1.0, 1.7); alpha = sin(3.1416 * a) * sin(3.1416 * sqrt(a)) * 0.5;
          } else {                                        // gold motes shed from the edges, streaming back past the rider
            float a = fract(uMote * (0.7 + 0.6 * sd2) + sd);
            float wob = sd * 40.0 + a * 9.0;
            c = aB + vec3(sign(aB.x) * (0.05 + 0.25 * a * a) + 0.05 * sin(wob), 0.06 * sin(wob * 1.3 + 2.0) + 0.14 * a * a - 0.05 * a, a * 3.4);
            float tw = 0.45 + 0.55 * sin(uTime * (5.0 + 7.0 * sd2) + sd * 50.0);
            off = q * aA.z * (0.8 + 0.5 * tw) * 4.0; alpha = smoothstep(0.0, 0.08, a) * (1.0 - smoothstep(0.6, 1.0, a)) * (0.35 + 0.65 * tw * tw);
          }
          vK = vec4(kind, sd, alpha, sd2);
          vec4 mv = modelViewMatrix * vec4(c, 1.0); mv.xy += off;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uLampCol, uGold, uSteam; uniform float uPres, uHalo, uSpark;
        varying vec2 vQ; varying vec4 vK;
        void main() {
          float kind = vK.x; vec2 p = vQ * 2.0; float r = length(p); vec3 col = vec3(0.0); float a = 0.0;
          if (kind < 0.5) {
            float y = vQ.y + 0.5; float wd = 0.95 * sqrt(max(0.0, y)) * (1.0 - y) * 2.2 + 0.02;
            float sh = 1.0 - smoothstep(0.35, 1.0, abs(p.x) / wd); sh *= smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.75, 1.0, y));
            vec3 hot = mix(vec3(0.25, 0.4, 1.4), vec3(5.5, 2.6, 0.7), smoothstep(0.02, 0.3, y)); hot = mix(hot, vec3(4.0, 1.2, 0.2), smoothstep(0.55, 1.0, y));
            col = hot * sh * sh * 0.75;
          } else if (kind < 1.5) {
            col = uLampCol * (exp(-r * r * 9.0) * 1.1 + exp(-r * r * 2.6) * 0.22) * (1.0 - smoothstep(0.7, 1.0, r)) * uHalo;
          } else if (kind < 2.5) {
            float s = (1.0 - smoothstep(0.1, 1.0, r)) * vK.z; col = (uSteam + uLampCol * 0.15) * s; a = s;
          } else {
            col = uGold * (exp(-r * r * 60.0) * 6.0 + exp(-r * r * 7.0) * 0.5) * (1.0 - smoothstep(0.7, 1.0, r)) * vK.z * uSpark;
          }
          gl_FragColor = vec4(col * uPres, a * uPres);
        }`,
    }));
    sprites.renderOrder = 5; body.add(sprites);

    // ---------- life ----------
    const mv = U.uMv.value, ph = U.uPh.value, portalDye = new THREE.Color(), hsl = { h: 0, s: 0, l: 0 }, fhsl = { h: 0, s: 0, l: 0 }, tmp = new THREE.Color();
    fieldC.getHSL(fhsl);
    let first = true, lastPortal = '', refSlow = 0, refFast = 0, phX = 0, phY = 0, mote = rng() * 10, cupX = 0, cupZ = 0, cvX = 0, cvZ = 0;
    const ride = (obj, x, z, lift) => {                  // stand something on the moving cloth
      const h = carpetH(x, z, ph, mv), hx = (carpetH(x + 0.05, z, ph, mv) - h) / 0.05, hz = (carpetH(x, z + 0.05, ph, mv) - h) / 0.05;
      obj.position.set(x, DROP + h + lift, z); obj.rotation.set(-hz, 0, hx); return obj;
    };
    return {
      object: root,
      update(dt, time, s) {
        const d = Math.min(Math.max(dt || 0, 0), 0.1), snap = first || d === 0, ease = (r) => (snap ? 1 : 1 - Math.exp(-d * r));
        // how fast, relative to this journey's usual pace (worlds differ hugely in scale)
        const sp = Math.max(s.speed || 0, 1e-3);
        if (first || refSlow < 2e-3) { refSlow = sp; refFast = sp; }
        refSlow += (sp - refSlow) * ease(0.05); refFast += (sp - refFast) * ease(1.2);
        const cross = s.crossing || 0;
        const spdT = Math.min(1, Math.max(0.5 * sp / refSlow, cross * 0.9)), surgeT = Math.min(1, Math.max(-1, (sp / refFast - 1) * 4)) + cross * 0.5;
        const bankT = Math.min(0.6, Math.max(-0.6, -(s.turn || 0) * 1.8));
        mv.x += (bankT - mv.x) * ease(2.2); mv.y += (spdT - mv.y) * ease(1.5); mv.z += (surgeT - mv.z) * ease(2.0);
        phX += d * mv.y * 2.4; phY += d * mv.y * 9.0; mote += d * (0.16 + 0.34 * mv.y);
        ph.set(time * 1.885 + phX, time * 5.2 + phY); U.uTime.value = time; SU.uMote.value = mote + time * 0.02;
        // buoyant heave at 0.3 Hz, a little yaw and pitch of its own, nose down into a surge
        body.position.set(0.012 * Math.sin(time * 0.71 + 1.3), 0.032 * Math.sin(time * 1.885) + 0.010 * Math.sin(time * 0.83 + 1.0), 0.03 * mv.z);
        body.rotation.set(0.010 * Math.sin(time * 0.47) - 0.012 * mv.z, 0.008 * Math.sin(time * 0.39 + 2.0), 0.010 * Math.sin(time * 0.6 + 2.0));
        // the lamp and the tray ride the ripples; the glass slides outward in turns and back on a surge
        ride(lamp, LAMP[0], LAMP[1], 0.004); ride(tray, TRAY[0], TRAY[1], 0.003);
        const tx = Math.min(0.04, Math.max(-0.04, -(s.turn || 0) * 0.16 - tray.rotation.z * 0.25)), tz = Math.min(0.03, Math.max(-0.03, mv.z * 0.03 + tray.rotation.x * 0.25)) + 0.004 * Math.sin(time * 0.9);
        if (snap) { cupX = tx; cupZ = tz; cvX = cvZ = 0; } else { cvX += ((tx - cupX) * 26 - cvX * 4.5) * d; cvZ += ((tz - cupZ) * 26 - cvZ * 4.5) * d; cupX += cvX * d; cupZ += cvZ * d; }
        const ox = cupHome.x + cupX, oz = cupHome.z + cupZ;
        cup.position.set(tray.position.x + ox, tray.position.y + cupHome.y + tray.rotation.z * ox - tray.rotation.x * oz, tray.position.z + oz); cup.rotation.copy(tray.rotation);
        SU.uCup.value.set(cup.position.x, cup.position.y + cupTop, cup.position.z);
        // lamp light: stronger where the world is dark
        const L = s.light, level = L && L.has ? L.level : 0.6, dim = Math.min(1.1, Math.max(0.22, 1.2 - level * 1.0));
        const flick = 0.86 + 0.09 * Math.sin(time * 11.3) * Math.sin(time * 7.1) + 0.05 * Math.sin(time * 23.0);
        const fl = SU.uFlame.value.copy(flameLocal).applyEuler(lamp.rotation).add(lamp.position);
        U.uLampAt.value.set(fl.x, fl.y + 0.03, fl.z, 1.5 * dim * flick); U.uGlowK.value = (0.45 + 0.75 * dim) * flick; SU.uHalo.value = (0.3 + 0.5 * dim) * flick;
        if (L && L.has) tmp.copy(L.key).multiplyScalar(Math.min(L.keyIntensity, 4) * 0.2).add(portalDye.copy(L.ambient).multiplyScalar(0.4));
        else tmp.copy(s.fill ? s.fill.value : fill.value).multiplyScalar(1.5).addScalar(0.12);
        const mx = Math.max(tmp.r, tmp.g, tmp.b, 1e-3); if (mx > 0.85) tmp.multiplyScalar(0.85 / mx);
        U.uEnv.value.lerp(tmp, ease(1.5));
        SU.uSteam.value.lerp(tmp.multiplyScalar(0.9).addScalar(0.1), ease(1.5));
        SU.uSpark.value = (0.45 + 0.55 * dim) * (1 + 1.5 * cross); SU.uPres.value = s.presence ?? 1;
        // the pattern's accent is re-dyed toward each world's portal colour
        const pc = s.portalColor || '#9fd0ff';
        if (pc !== lastPortal) {
          lastPortal = pc; portalDye.set(pc).getHSL(hsl);
          let dh = Math.abs(hsl.h - fhsl.h); dh = Math.min(dh, 1 - dh);
          accentTarget.setHSL(hsl.h, Math.min(0.78, Math.max(0.45, hsl.s)), dh < 0.09 ? 0.62 : Math.min(0.52, Math.max(0.36, hsl.l))).lerp(seedAccent, 0.3);
        }
        U.uAccent.value.lerp(accentTarget, ease(0.5));
        first = false;
      },
      dispose() { quad.dispose(); },
    };
  },
};
