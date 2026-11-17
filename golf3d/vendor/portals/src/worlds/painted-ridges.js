// THE PAINTED RIDGES: at full gallop inside a herd of takhi along a knife crest of candy-striped badlands while
// an evening shower repaints the Ribbon (src/parts/painted-ridges.js) in front of us.
//
// Layout (world = the hero's local frame): the Ribbon strikes along X with its face toward +Z; the path comes up
// from the south (+Z) in a dry wash, climbs a spur onto the Knife, runs the crest, drops into the water gap and
// ends at the ring between the fins. Everything near the path is laid out in path coordinates (s along, lat to
// the right), from one table of ground heights that the strip mesh, the animals, their shadows and the plants share.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_COMMON, ROCK_VS, ROCK_FS } from '../parts/painted-ridges.js';

const PAL = ['#B5472F', '#D99A45', '#EFE2C4', '#9AAB8A', '#5C728C', '#B8935F', '#2B2624'];
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const bell4 = (x, a, b, c, d) => ss(a, b, x) * (1 - ss(c, d, x));
const EYE = 2.3, STRIDE = 6.1, VNOM = 16.5;

// ---------------------------------------------------------------- quadruped rig shared by coat and shadow passes
// model space: x across, y up, z forward, metres for an adult takhi (1.4 m at the withers). aRig = part
// (0 body, 1 neck and head, 2 leg, 3 tail), bend weight (neck / tail: 0..1 along; leg: 0 upper .. 1 lower), leg index,
// and for a leg how far it has left the body (0 at the haunch or shoulder, which stay with the barrel, 1 from mid-thigh down).
const GLSL_RIG = /* glsl */`
attribute vec4 aRig;
attribute vec4 iPos;      // x, y, z, yaw
attribute vec4 iPose;     // stride phase, ground pitch, gait 0..1, rear 0..1
attribute vec4 iAux;      // size, tint, kind, seed
vec2 rotX(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(v.x * c + v.y * s, -v.x * s + v.y * c); }
vec3 rigPose(vec3 p, inout vec3 n) {
  float part = aRig.x, ph = iPose.x, gait = iPose.z, rear = iPose.w;
  float bob = gait * (.02 + .055 * cos(6.28318 * (ph - .84)));
  float rock = gait * .055 * sin(6.28318 * (ph - .62));
  bool foreleg = false;
  if (part > 1.5 && part < 2.5) {
    float leg = aRig.z;
    bool front = leg < 1.5;
    foreleg = front;
    float off = leg < .5 ? .36 : leg < 1.5 ? .46 : leg < 2.5 ? 0. : .10;
    float lp = fract(ph + off);
    float hipY = front ? .95 : 1.02, hipZ = front ? .42 : -.50, Lu = front ? .45 : .47, Ll = front ? .44 : .49;
    float st = lp / .22, sw = clamp((lp - .22) / .78, 0., 1.);
    float e = sw * sw * (3. - 2. * sw);
    float zt = (lp < .22 ? 1.34 * (.5 - st) : 1.34 * (e - .5)) + (front ? .10 : .04);
    float yt = lp < .22 ? 0. : sin(3.14159 * sw) * (front ? .44 : .36) * (1. - .3 * sw);
    vec2 stand = vec2(-(hipY - .06), front ? 0. : -.05);
    vec2 tg = mix(stand, vec2(-(hipY - .06) - bob + yt, zt), gait);
    if (front) tg = mix(tg, vec2(-.50, .30 + .06 * sin(ph * 6.28318 + leg * 2.)), rear);
    else tg = mix(tg, vec2(-(hipY - .14), .10), rear);         // a rearing horse sits down on bent hocks
    float dl = clamp(length(tg), .24, (Lu + Ll) * .995);
    float th = atan(tg.y, -tg.x);
    float A = acos(clamp((Lu * Lu + dl * dl - Ll * Ll) / (2. * Lu * dl), -1., 1.));
    float B = acos(clamp((Lu * Lu + Ll * Ll - dl * dl) / (2. * Lu * Ll), -1., 1.));
    float au = front ? th + A : th - A;
    float al = front ? au - (3.14159 - B) : au + (3.14159 - B);
    vec2 hip = vec2(hipY, hipZ), q = p.yz - hip;
    vec2 pu = hip + rotX(q, au);
    vec2 knee = hip + rotX(vec2(-Lu, 0.), au);
    vec2 pl = knee + rotX(q - vec2(-Lu, 0.), al);
    p.yz = mix(p.yz, mix(pu, pl, aRig.y), aRig.w);
    n.yz = rotX(n.yz, mix(au, al, aRig.y) * aRig.w);
    p.y += bob;
  } else {
    if (part > .5 && part < 1.5) {
      float na = -gait * (.34 + .09 * sin(6.28318 * (ph - .30))) + rear * .30;
      na *= .35 + .65 * aRig.y;
      na += rear * (.25 - .8 * aRig.y * aRig.y);              // neck arched, chin tucked
      vec2 pv = vec2(1.20, .50);
      p.yz = pv + rotX(p.yz - pv, na); n.yz = rotX(n.yz, na);
    } else if (part > 2.5) {
      float t = aRig.y;
      float ta = -(gait * (1.0 + .22 * sin(12.566 * ph - t * 3.)) + iAux.z * .9) * smoothstep(0., .3, t);
      vec2 pv = vec2(1.30, -.76);
      p.yz = pv + rotX(p.yz - pv, ta); n.yz = rotX(n.yz, ta);
      p.x += .06 * t * sin(12.566 * ph + t * 4. + iAux.w * 6.) * gait;
    }
    vec2 bc = vec2(1.05, -.05);
    p.yz = bc + rotX(p.yz - bc, rock); n.yz = rotX(n.yz, rock);
    p.y += bob;
  }
  if (part < 1.5 || part > 2.5 || foreleg) {                 // a half rear: everything but the hind legs turns about the hips
    vec2 hp = vec2(1.02, -.50);
    float rr = rear * .62;
    p.yz = hp + rotX(p.yz - hp, rr); n.yz = rotX(n.yz, rr);
  }
  p.y -= .08 * rear;
  p *= iAux.x;
  p.yz = rotX(p.yz, iPose.y); n.yz = rotX(n.yz, iPose.y);
  float cy = cos(iPos.w), sy = sin(iPos.w);
  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
  n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  return p + iPos.xyz;
}
`;

const COAT_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_RIG}
attribute vec3 color;
varying vec3 vW, vN, vC, vM; varying vec4 vAx;
void main() {
  vec3 n = normal;
  vec3 w = rigPose(position, n);
  vM = position; vAx = iAux;
  vW = w; vN = n; vC = color * mix(vec3(1.), vec3(iAux.y, iAux.y * .97, iAux.y * .9), step(.12, color.r));
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// one lit fragment shader for everything alive or growing: weather from the hero (wet line, cloud and storm shadow)
const LIFE_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec4 uLife;        // rim strength, gloss, snow dusting, spring moult
varying vec3 vW, vN, vC;
#ifdef SHADE
varying float vSh;
#endif
#ifdef COAT
varying vec3 vM; varying vec4 vAx;
#endif
void main() {
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  vec2 wt = wetAt(vW);
  float key = keyAt(vW);
  #ifdef SHADE
  key *= vSh;
  #endif
  vec3 alb = vC;
  float sheen = 0.;
  #ifdef COAT
  {
    // a living coat, not one flat tone: hair grain along the body, a darker topline over a paler flank, smudges over
    // shoulder and haunch, faint bars on the forearm, moult patches in spring; the grain also roughens the normal
    float body = step(.115, vC.r) * (1. - step(.75, vC.g));         // dun hair (not mane, tail, stockings, hooves)
    vec2 hq = vec2(vM.z * 5. + vM.y * 2., vM.x * 9. + vM.y * 7.);
    float g1 = vnoise(hq * 3.1 + vAx.w * 17.), g2 = vnoise(vec2(vM.z * 2.3 + vAx.w * 9., vM.y * 3.3 + vM.x * 2.1)), g3 = vnoise(hq * 13.);
    float top = smoothstep(.95, 1.45, vM.y) * (1. - vAx.z);
    alb *= mix(1., (.86 + .30 * g1) * (.84 + .30 * g2) * (1.10 - .26 * top) * (.92 + .16 * g3), body);
    alb *= 1. - .22 * body * smoothstep(.5, .9, sin(vM.y * 62.)) * (1. - smoothstep(.62, .8, vM.y)) * (1. - vAx.z);
    alb = mix(alb, alb * 1.35 + .02, body * uLife.w * smoothstep(.52, .66, vnoise(vec2(vM.z * 3.7 + vAx.w * 31., vM.y * 4.3))));
    n = normalize(n + vec3(g1 - .5, (g3 - .5) * .6, g2 - .5) * (.42 * body));
    sheen = body * (.10 + .10 * g1);
    #ifndef MOUNT
    {
      // a goitered gazelle's flank: a dark band along the side between the sandy back and the white belly, and the back itself a
      // tone deeper toward the spine (vAx.z is 1 on a gazelle)
      float flank = smoothstep(.885, .92, vM.y) * (1. - smoothstep(1.03, 1.08, vM.y)) * smoothstep(-.47, -.36, vM.z) * (1. - smoothstep(.30, .40, vM.z));
      alb = mix(alb, vec3(.045, .030, .018), .92 * flank * vAx.z);
      alb *= 1. - .22 * vAx.z * body * smoothstep(1.05, 1.25, vM.y);
    }
    #endif
  }
  #endif
  alb *= mix(1., mix(.60, .82, uBed.w), wt.x);            // (at dawn everything has been wet all night: it is not darkened twice)
  #ifdef MOUNT
  // (close under the eye a soaked coat is the dry coat a tone darker, browner and glossy: still a dun neck clearly lighter than
  // the mane that stands on it, never an olive apron under a black block)
  alb *= mix(vec3(1.), vec3(1.52, 1.30, 1.04), wt.x * (1. - uBed.w));
  {
    // the mane is stiff hair standing side by side, and it is darker still when it is soaked
    float mane = 1. - step(.11, vC.r);
    alb *= mix(1., (.62 + .76 * vnoise(vec2(vM.z * 38. + vM.x * 7., vM.y * 2.5))) * (1. - .40 * wt.x), mane);
  }
  alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.80, .90, 1.12), .6 * uFinC.w);      // by moonlight our own animal is slate and silver like the rest
  #elif defined(COAT)
  alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.74, .86, 1.10), (.25 + .45 * vAx.z) * uFinC.w) * (1. - .30 * vAx.z * uFinC.w);      // and the gazelles' white is blue-grey, never cream
  #endif
  float skyGloss = .5;
  #ifdef COAT
  alb *= mix(1., .84, wt.x);            // a soaked coat is darker than a dry one
  skyGloss = .25;
  #endif
  alb = mix(alb, vec3(.78, .82, .88), uLife.z * uBed.z * smoothstep(-.7, .7, wt.y) * smoothstep(.45, .9, n.y));
  float d = dot(n, uSun);
  float ndl = max(d, 0.) * .8 + max(d * .5 + .5, 0.) * .2;
  #ifdef COAT
  ndl *= .82;                                                // a coat is matt hair: in the full low sun it is a deep dun, with a shadow side
  #endif
  vec3 irr = uSunCol * (ndl * key) + uSkyCol * (.42 + .58 * (n.y * .5 + .5)) + uBounce * (.8 * (1. - n.y) * (.3 + .7 * key));
  // a flank in deep shade stands in the glow of the land around it: dun, never black (a floor under the light, none where it is lit already)
  irr += (dot(uSkyCol, vec3(.3333)) * vec3(.62, .55, .47) + uSkyCol * .25 + uSunCol * vec3(.050, .040, .029)) * (max(1. - smoothstep(.12, .45, dot(irr, vec3(.3333))), wt.x * .8 * (1. - max(d, 0.) * key)) * (1. - .6 * uFinC.w));
  #ifdef MOUNT
  // the side of our own animal's neck that is turned from the sun stands in the light of the sky and of the land beside it: the mane
  // is a dark ridge on a dun neck from either side, never one dark edge
  irr += (uSkyCol * .36 + uSunCol * vec3(.080, .064, .048)) * ((1. - max(d, 0.) * key) * (1. - .5 * uFinC.w));
  #endif
  vec3 col = alb * irr;
  col *= .78 + .22 * smoothstep(-.9, .1, n.y);
  float fr = 1. - max(dot(n, V), 0.);
  float rim = fr * fr * sqrt(fr) * max(dot(n, uSun) + .35, 0.);
  #ifdef COAT
  // on a coat the low sun's rim is the coat's own colour, brighter and narrow: a line of gold along the sunward edge of a dun
  // animal with a shadow side, never an animal bleached to cream
  col += uSunCol * (alb * 3.0 + .015) * (rim * fr * fr * key * uLife.x * 1.15);
  #else
  col += uSunCol * (rim * key * uLife.x * (.12 + .95 * dot(alb, vec3(.33)) * 3.));
  #endif
  col += uSunCol * (fr * fr * max(n.y * .6 + .4, 0.) * uBed.w * (1. - key) * (.05 + .45 * dot(alb, vec3(.33))));      // before sunrise the rose of the sky lies along every back
  float wetG = 1.;
  #ifdef MOUNT
  {
    // wet, the coat is glossy: the sky lies along the top of the neck in soft streaks down the lie of the hair, and the soaked mane
    // carries a dull light on its blades
    float maneK = 1. - step(.11, vC.r);
    wetG = 1. - .88 * maneK;                 // (the wet gloss of sun and sky on the crest of the mane was a white thread down its ridge)
    float lie = vnoise(vec2(vM.x * 9., vM.z * 1.7 + 3.)) * .6 + vnoise(vec2(vM.x * 23. + 5., vM.z * 4.1)) * .4;
    col += uSkyCol * (wt.x * (1. - maneK) * (.04 + .22 * fr * fr) * smoothstep(.35, .75, lie) * smoothstep(-.2, .5, n.y));
    col += uSkyCol * (wt.x * maneK * .003 * smoothstep(.45, .8, vnoise(vec2(vM.z * 38. + vM.x * 7., vM.y * 2.5))));
    // rain beads in the mane and on the hair of the neck: a few soft glints, each several pixels across, of sky, and of sun when it
    // breaks (never single white specks: a bead's cell is a hand wide and its light falls off softly from its middle)
    vec2 bq = vec2(vM.x * 5.6 + vM.y * 2.3, vM.z * 1.7 + vM.y * .8), bi = floor(bq), bf = fract(bq) - .5;
    float bd = length(bf + (vec2(hash21(bi), hash21(bi + 7.7)) - .5) * .42);
    float bead = 1. - smoothstep(.04, .30, bd); bead *= bead * step(.66, hash21(bi + 3.1)) * wt.x * uShade2.z * (1. - .75 * maneK);
    col += (uSkyCol * .17 + uSunCol * (key * .34)) * bead;
  }
  #endif
  vec3 hv = normalize(uSun + V + vec3(0., 1e-3, 0.));
  col += (uSunCol * (pow(max(dot(n, hv), 1e-4), 28.) * key * wt.x * uLife.y) + uSkyCol * (fr * fr * wt.x * uLife.y * skyGloss)) * wetG;
  col += uSunCol * (pow(max(dot(n, hv), 1e-4), 20.) * key * sheen * .45 * step(0., d));      // (a narrow gloss along the back: broad, it washed a whole sunlit flank to one flat cream)
  {                                                          // the exit ring lights whatever runs toward it, and rims it in gold
    vec3 toR = uRing.xyz - vW; float dR = length(toR) + 1e-3; vec3 Lr = toR / dR;
    float attR = uRing.w / (1. + dR * dR / 520.);
    col += uRingB.rgb * (attR * (alb * (.2 + .8 * max(dot(n, Lr), 0.)) + .10 * fr * fr * max(dot(n, Lr) + .4, 0.)));
  }
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}`;
// the silhouette of each animal thrown along the sun onto the ground table and drawn as that ground with the key light off
const SHADOW_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_RIG}
attribute vec4 iPath;     // s, lat, tangent x, tangent z
uniform sampler2D uHT;
uniform vec4 uHTr;        // s0, 1 / s span, lat half range, row step
uniform vec3 uSun;
varying vec3 vP, vN; varying vec2 vBk;
float gh(float s, float lat) { return texture2D(uHT, vec2(lat / (2. * uHTr.z) + .5, (s - uHTr.x) * uHTr.y)).r; }
void main() {
  vec3 n = normal;
  vec3 w = rigPose(position, n);
  float h = max(w.y - iPos.y, 0.);
  vec2 tn = iPath.zw, rt = vec2(-tn.y, tn.x);
  // the ray of the sun through this point is followed down to the ground it really meets: thrown as if the land were level, the
  // shadow of an animal beside a wall climbs it as a black blade ten times its height
  vec2 dxz = uSun.xz / max(uSun.y, .1), om;
  float ta = 0., tb = h, tm, kk;
${`  tm = .5 * (ta + tb); om = w.xz - dxz * tm - iPos.xz;
  kk = step(gh(iPath.x + dot(om, tn), iPath.y + dot(om, rt)), w.y - tm); ta = mix(ta, tm, kk); tb = mix(tm, tb, kk);
`.repeat(5)}  vec2 g = w.xz - dxz * tb;
  vec2 off = g - iPos.xz;
  float s = iPath.x + dot(off, tn), lat = iPath.y + dot(off, rt);
  float y0 = gh(s, lat), ys = gh(s + uHTr.w, lat), yl = gh(s, lat + 1.2);
  vec2 slope = vec2((ys - y0) / uHTr.w, (yl - y0) / 1.2);
  vN = normalize(vec3(-tn.x * slope.x - rt.x * slope.y, 1., -tn.y * slope.x - rt.y * slope.y));
  vBk = vec2(1., 1.);
  vP = vec3(g.x, y0 + .05, g.y);
  vec4 mvPosition = viewMatrix * vec4(vP, 1.);
  gl_Position = projectionMatrix * mvPosition;
  if (iAux.x < .01) gl_Position = vec4(0., 0., -3., 1.);
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------- geometry builder: tubes lofted in the sagittal plane
class Loft {
  constructor() { this.p = []; this.c = []; this.r = []; this.i = []; }
  get n() { return this.p.length / 3; }
  // rings: [{ y, z, w, d, x?, col, top?, bot?, rig }] ; w = half width across, d = half depth in the plane
  tube(rings, seg, sub = 1, cap = 3, pow = 1) {
    const R = [];
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < sub; j++) R.push(Loft.mix(rings, k, j / sub));
    R.push(Loft.mix(rings, rings.length - 2, 1));
    const base = this.n, m = R.length;
    for (let k = 0; k < m; k++) {
      const a = R[Math.max(0, k - 1)], b = R[Math.min(m - 1, k + 1)], r = R[k];
      let ty = b.y - a.y, tz = b.z - a.z; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
      const ny = tz, nz = -ty;
      for (let s = 0; s < seg; s++) {
        const an = (s / seg) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
        const ex = Math.sign(sn) * Math.pow(Math.abs(sn), pow), ed = Math.sign(cs) * Math.pow(Math.abs(cs), pow);
        this.p.push((r.x || 0) + ex * r.w, r.y + ny * ed * r.d, r.z + nz * ed * r.d);
        let col = r.col;
        if (r.top && cs > 0.86) col = r.top; else if (r.bot && cs < -0.25) col = Loft.mc(r.col, r.bot, Math.min(1, (-0.25 - cs) * 2.2));
        this.c.push(col[0], col[1], col[2]);
        this.r.push(r.rig[0], r.rig[1], r.rig[2], r.rig[3] || 0);
      }
    }
    for (let k = 0; k < m - 1; k++) for (let s = 0; s < seg; s++) {
      const a = base + k * seg + s, b = base + k * seg + (s + 1) % seg, c = a + seg, d = b + seg;
      this.i.push(a, c, b, b, c, d);
    }
    for (const end of [0, 1]) if (cap & (end + 1)) {
      const r = R[end ? m - 1 : 0], o = base + (end ? m - 1 : 0) * seg, ci = this.n;
      this.p.push(r.x || 0, r.y, r.z); this.c.push(r.col[0], r.col[1], r.col[2]); this.r.push(r.rig[0], r.rig[1], r.rig[2], r.rig[3] || 0);
      for (let s = 0; s < seg; s++) { if (end) this.i.push(o + s, ci, o + (s + 1) % seg); else this.i.push(o + s, o + (s + 1) % seg, ci); }
    }
  }
  static mc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  static mix(rings, k, t) {
    const a = rings[k], b = rings[k + 1], u = t * t * (3 - 2 * t) * 0.5 + t * 0.5;
    return { y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), w: lerp(a.w, b.w, u), d: lerp(a.d, b.d, u), x: lerp(a.x || 0, b.x || 0, t),
      col: Loft.mc(a.col, b.col, t), top: a.top && b.top ? Loft.mc(a.top, b.top, t) : null, bot: a.bot && b.bot ? Loft.mc(a.bot, b.bot, t) : null,
      rig: [a.rig[0], lerp(a.rig[1], b.rig[1], t), a.rig[2], lerp(a.rig[3] || 0, b.rig[3] || 0, t)] };
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aRig', new THREE.Float32BufferAttribute(this.r, 4));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------- the animals
const C3 = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
// lod 2: the twelve nearest (about 2,000 triangles), 1: the rest of the herd, 0: shadow silhouette
function quadrupedGeometry(lod, kind) {
  const L = new Loft();
  const gz = kind === 'gazelle';
  // a goitered gazelle is not a small horse: bright sandy back, a dark flank band over a white belly, white rump and
  // inner legs, a short black tail carried up, lyre horns, slim neck and legs
  const white = [0.76, 0.74, 0.68];
  const dun = gz ? C3('#9C6A36', 0.50) : C3('#B8935F', 0.56), pale = gz ? white : C3('#D8C6A0', 0.58), dark = gz ? [0.03, 0.025, 0.022] : [0.03, 0.026, 0.024];
  const stripe = gz ? Loft.mc(dun, [0.12, 0.07, 0.03], 0.5) : lod > 1 ? [0.07, 0.05, 0.035] : Loft.mc(dun, [0.05, 0.04, 0.03], 0.62), sock = gz ? white : [0.045, 0.036, 0.03], hoof = [0.03, 0.028, 0.026];
  const bw = gz ? 0.56 : 1, bd = gz ? 0.70 : 1, lw = gz ? 0.50 : lod > 1 ? 1.16 : 1.3, nw = gz ? 0.50 : 1;      // (a takhi's legs are short and stout; drawn true to a thoroughbred's they were sticks at any distance)
  const segB = [5, 8, 14][lod], segL = [3, 5, 8][lod], segN = [4, 6, 12][lod], sub = [1, 1, 2][lod];
  // barrel: haunch, waist, shoulder
  const B = (z, y, w, d) => ({ z, y, w: w * bw, d: d * bd, col: gz && z < -0.6 ? white : dun, top: gz && z < -0.6 ? white : stripe, bot: pale, rig: [0, 0, 0] });
  L.tube([B(-0.80, 1.12, 0.05, 0.09), B(-0.71, 1.10, 0.20, 0.25), B(-0.55, 1.085, 0.275, 0.305), B(-0.33, 1.065, 0.268, 0.295), B(-0.08, 1.05, 0.285, 0.30),
    B(0.16, 1.06, 0.29, 0.315), B(0.38, 1.09, 0.265, 0.325), B(0.55, 1.10, 0.215, 0.285), B(0.67, 1.11, 0.11, 0.17)], segB, sub, 3, 0.86);
  // neck (short and thick on a takhi) and head with a deep jaw and a pale mealy muzzle
  const ny0 = 1.20, nz0 = 0.50, ny1 = gz ? 1.90 : 1.67, nz1 = gz ? 0.80 : 0.95;
  const Nk = (t, w, d) => ({ y: lerp(ny0, ny1, t) + 0.03 * Math.sin(t * 3.1), z: lerp(nz0, nz1, t), w: w * nw, d: d * nw, col: dun, bot: pale, rig: [1, t, 0] });
  L.tube([Nk(-0.12, 0.205, 0.30), Nk(0.25, 0.17, 0.255), Nk(0.62, 0.128, 0.195), Nk(1.0, 0.10, 0.145)], segN, sub, 0, 0.9);
  const hs = gz ? 0.72 : 1.12, hy = -0.62 * 0.56 * hs, hz = 0.78 * 0.56 * hs;
  const Hd = (t, w, d, col) => ({ y: ny1 + 0.02 + hy * t, z: nz1 - 0.02 + hz * t, w: w * hs, d: d * hs, col, rig: [1, 1, 0] });
  L.tube([Hd(-0.14, 0.085, 0.10, dun), Hd(0.12, 0.10, 0.145, dun), Hd(0.45, 0.092, 0.135, dun), Hd(0.78, 0.066, 0.092, Loft.mc(dun, pale, 0.6)), Hd(1.0, 0.058, 0.07, pale)], segN, sub, 3, 0.9);
  if (lod > 0) {
    for (const sx of [-1, 1]) {
      const E = (t, w) => ({ x: sx * (0.065 + 0.03 * t) * hs, y: ny1 + 0.09 + 0.16 * t, z: nz1 - 0.06 - 0.02 * t, w, d: w * 0.6, col: t > 0.6 ? dark : dun, rig: [1, 1, 0] });
      L.tube([E(0, 0.035), E(0.45, 0.04), E(1, 0.006)], lod > 1 ? 5 : 3, 1, 0);
      if (gz) { const Hn = (t) => ({ x: sx * (0.045 + 0.13 * Math.sin(t * 2.6) * (1 - 0.25 * t)), y: ny1 + 0.07 + 0.50 * t, z: nz1 - 0.07 - 0.16 * t * t, w: 0.034 * (1.15 - t), d: 0.034 * (1.15 - t), col: dark, rig: [1, 1, 0] }); L.tube([Hn(0), Hn(0.3), Hn(0.65), Hn(1)], 4, 1, 0); }
    }
  }
  // upright dark mane without a forelock: clumped blades on the near horses, a ridge on the others
  if (!gz) {
    const crest = (t) => { const y = lerp(ny0, ny1, t) + 0.03 * Math.sin(t * 3.1), z = lerp(nz0, nz1, t), d = lerp(0.265, 0.145, t); return [y + 0.69 * d, z - 0.72 * d]; };
    if (lod > 1) {
      for (let k = 0; k < 13; k++) {
        const t0 = 0.02 + k * 0.074, t1 = t0 + 0.085, a = crest(t0), b = crest(t1), hgt = 0.10 + 0.03 * Math.sin(k * 2.3);
        const M = (y, z, w, t) => ({ y, z, w, d: 0.004, col: dark, rig: [1, t, 0] });
        L.tube([M(a[0] - 0.03, a[1] + 0.02, 0.03, t0), M((a[0] + b[0]) / 2 + hgt * 0.72, (a[1] + b[1]) / 2 - hgt * 0.69, 0.012, (t0 + t1) / 2), M(b[0] - 0.03, b[1] + 0.02, 0.03, t1)], 3, 1, 0);
      }
    } else {
      const M = (t) => { const c = crest(t); return { y: c[0] + 0.03, z: c[1] - 0.03, w: 0.022, d: 0.065, col: dark, rig: [1, t, 0] }; };
      L.tube([M(0.0), M(0.5), M(1.0)], 3, 1, 0);
    }
  }
  // legs: forearm and gaskin, knee and hock, cannon, fetlock, hoof; dark stockings
  const leg = (idx, x, hipY, hipZ, jointY, rows) => {
    const rings = rows.map(([y, w, d, dz]) => {
      const k = clamp((jointY + 0.07 - y) / 0.14, 0, 1);
      const col = y < 0.045 ? hoof : y > jointY + 0.12 ? dun : Loft.mc(dun, sock, clamp((jointY + 0.12 - y) / 0.2, 0, 1));
      return { x, y, z: hipZ + (dz || 0), w: w * lw, d: d * lw, col, rig: [2, k, idx, clamp((hipY + 0.10 - y) / 0.30, 0, 1)] };
    });
    L.tube(lod === 0 ? rings.filter((r, i) => i % 2 === 0 || i === rings.length - 1) : rings, segL, sub, 2);
  };
  const fore = [[1.0, 0.10, 0.155], [0.82, 0.078, 0.108], [0.60, 0.052, 0.064], [0.50, 0.054, 0.060], [0.43, 0.040, 0.043], [0.22, 0.034, 0.037], [0.12, 0.043, 0.050], [0.07, 0.040, 0.048, 0.01], [0.0, 0.056, 0.066, 0.015]];
  const hind = [[1.10, 0.125, 0.225], [0.86, 0.095, 0.155], [0.64, 0.056, 0.078], [0.55, 0.052, 0.072, -0.01], [0.47, 0.040, 0.050], [0.22, 0.035, 0.039], [0.12, 0.043, 0.050], [0.07, 0.040, 0.048, 0.01], [0.0, 0.056, 0.066, 0.015]];
  leg(0, 0.165 * bw, 0.95, 0.42, 0.50, fore); leg(1, -0.165 * bw, 0.95, 0.42, 0.50, fore);
  leg(2, 0.155 * bw, 1.02, -0.50, 0.55, hind); leg(3, -0.155 * bw, 1.02, -0.50, 0.55, hind);
  // tail: dun dock, long dark hair
  const tl = gz ? 0.44 : 1;
  const Tl = (t, w, d) => ({ y: 1.30 - 0.86 * t * tl, z: -0.76 - 0.05 * Math.sin(t * 3), w: w * (gz ? 1.5 : 1), d: d * (gz ? 1.5 : 1), col: t < 0.18 && !gz ? dun : dark, rig: [3, t, 0] });
  L.tube([Tl(0, 0.04, 0.04), Tl(0.2, 0.055, 0.06), Tl(0.5, 0.075, 0.085), Tl(0.8, 0.06, 0.07), Tl(1, 0.012, 0.012)], [3, 4, 6][lod], sub, 0);
  return L.build();
}

// golden eagle (or a saker), 2.1 m across: a deep body, a golden head on a neck that turns, broad wings with a paler bar of
// coverts and six spread primaries, a wedge tail. aRig = span fraction of a wing vertex (1 at the wrist, 1.3 at a finger tip),
// finger id, head (1) or tail (2), unused. +x is the bird's left wing, +z its beak
function raptorGeometry(saker) {
  const p = [], c = [], r = [], idx = [];
  const brown = saker ? C3('#574737') : C3('#4b3524'), brownD = saker ? C3('#30271f') : C3('#2b1e15'), gold = saker ? C3('#d9cdb8') : C3('#b48b4c'), covert = saker ? C3('#6f5d49') : C3('#735738');
  const tipc = saker ? C3('#2c2622') : [0.034, 0.028, 0.023], cere = C3('#d8b040', 0.75), belly = saker ? C3('#e6dccb') : C3('#3d2c1e');
  const v = (x, y, z, col, t = 0, f = 0, part = 0) => { p.push(x, y, z); c.push(col[0], col[1], col[2]); r.push(t, f, part, 0); return p.length / 3 - 1; };
  const quad = (a, b, cc, d) => idx.push(a, b, cc, a, cc, d);
  const loft = (rings, seg, colOf, part) => {
    const rows = rings.map(([z, hw, hh, y0], k) => { const row = []; for (let s = 0; s < seg; s++) { const a = s / seg * 6.2832; row.push(v(Math.sin(a) * hw, (y0 || 0) + Math.cos(a) * hh, z, colOf(k, Math.cos(a)), 0, 0, part)); } return row; });
    for (let k = 0; k < rows.length - 1; k++) for (let s = 0; s < seg; s++) quad(rows[k][s], rows[k][(s + 1) % seg], rows[k + 1][(s + 1) % seg], rows[k + 1][s]);
    return rows;
  };
  // body: breast, back, rump (z, half width, half height, centre y)
  loft([[0.30, 0.050, 0.052, 0.012], [0.21, 0.082, 0.086, 0], [0.07, 0.108, 0.112, -0.006], [-0.11, 0.100, 0.100, -0.004], [-0.28, 0.068, 0.062, 0.004], [-0.41, 0.030, 0.022, 0.012]], 8,
    (k, up) => k < 1 ? gold : up > 0.2 ? Loft.mc(gold, brown, Math.min(1, k * 0.7)) : belly, 0);
  // head and hooked beak, on a neck that turns
  const hr = loft([[0.29, 0.046, 0.048, 0.014], [0.345, 0.058, 0.056, 0.022], [0.405, 0.052, 0.048, 0.020], [0.452, 0.030, 0.030, 0.008]], 8, (k, up) => up > -0.3 ? gold : Loft.mc(gold, brown, 0.6), 1);
  { const row = hr[3], b0 = v(0, 0.018, 0.492, cere, 0, 0, 1), b1 = v(0, -0.030, 0.512, tipc, 0, 0, 1); for (let s = 0; s < 8; s++) { idx.push(row[s], row[(s + 1) % 8], b0); } idx.push(row[3], b0, b1, row[5], b1, b0, row[3], b1, row[4], row[4], b1, row[5]); }
  const SP = saker ? 0.56 : 1.0, CH = saker ? 0.62 : 1.0, nf = saker ? 3 : 6;
  for (const sx of [-1, 1]) {
    // the arm: leading edge, the line of the coverts, trailing edge at six stations out to the wrist
    const le = [], mid = [], te = [], NSt = 5, xw = 0.085 + 0.65 * SP;
    const LEz = (s) => 0.17 + (saker ? -0.16 * s * s : 0.055 * Math.sin(s * 2.6)), chord = (s) => (0.40 - 0.07 * s) * CH;
    for (let k = 0; k <= NSt; k++) {
      const s = k / NSt, x = sx * (0.085 + s * 0.65 * SP), z0 = LEz(s), ch = chord(s);
      le.push(v(x, 0.022, z0, brownD, s)); mid.push(v(x, 0.030, z0 - ch * 0.36, covert, s)); te.push(v(x, 0.004, z0 - ch * (1 + 0.05 * Math.sin(k * 2.2)), k === 0 ? brown : tipc, s));
    }
    for (let k = 0; k < NSt; k++) { quad(le[k], le[k + 1], mid[k + 1], mid[k]); quad(mid[k], mid[k + 1], te[k + 1], te[k]); }
    // the hand: separate primaries, each a tapered blade, spread like fingers and free to flex
    const z1 = LEz(1), ch1 = chord(1), lens = saker ? [0.36, 0.33, 0.25] : [0.27, 0.315, 0.33, 0.31, 0.27, 0.215];
    for (let f = 0; f < nf; f++) {
      const fa = (saker ? 6 + f * 9 : -9 + f * 12.5) * Math.PI / 180, zb = z1 - 0.012 - (f + 0.5) * ch1 * 0.95 / nf, len = lens[f] * (saker ? 0.8 : 1), wb = ch1 * (saker ? 0.5 : 0.74) / nf, dx = Math.cos(fa), dz = -Math.sin(fa);
      const a = v(sx * (xw - 0.02), 0.014, zb + wb, f < 1 ? brownD : tipc, 1, f + 1), b = v(sx * (xw - 0.02), 0.010, zb - wb, tipc, 1, f + 1);
      const m1 = v(sx * (xw + dx * len * 0.62) - 0 * dz, 0.012, zb + dz * len * 0.62 + wb * 0.72, tipc, 1.19, f + 1), m2 = v(sx * (xw + dx * len * 0.62), 0.010, zb + dz * len * 0.62 - wb * 0.72, tipc, 1.19, f + 1);
      const tip = v(sx * (xw + dx * len), 0.010, zb + dz * len, tipc, 1.3, f + 1);
      quad(a, m1, m2, b); idx.push(m1, tip, m2);
    }
  }
  // tail: a wedge of five feathers, darker toward the tip
  { const NT = 4, base = [], end = []; for (let k = 0; k <= NT; k++) { const q = k / NT * 2 - 1; base.push(v(q * 0.060, 0.006, -0.36, brown, 0, 0, 2)); end.push(v(q * 0.185 * (saker ? 0.7 : 1), 0, -0.70 + 0.05 * q * q, saker ? gold : tipc, 0, 0, 2)); } for (let k = 0; k < NT; k++) quad(base[k], base[k + 1], end[k + 1], end[k]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  g.setAttribute('aRig', new THREE.Float32BufferAttribute(r, 4)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const RAPTOR_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aRig; attribute vec3 color;
uniform float uTime; uniform vec4 uWing;     // dihedral, flap amount, flap rate, scale
uniform vec4 uHead;                          // head turn (radians, to its left positive), head pitch, tail twist, unused
varying vec3 vW, vN, vC;
void main() {
  vec3 p = position, n = normal;
  float t = aRig.x, fl = sin(uTime * uWing.z) * uWing.y;
  float lift = t * t * (uWing.x + fl + .03 * sin(uTime * 1.7 + t * 2.));
  p.y += lift * abs(p.x) * 1.1;
  p.y += step(.5, aRig.y) * (t - 1.) * (.42 + .22 * sin(uTime * 3.1 + aRig.y * 1.7));          // fingered primaries flex and trim
  p.z += step(.5, aRig.y) * (t - 1.) * .12 * sin(uTime * 2.3 + aRig.y * 2.9);
  n = normalize(n + vec3(-sign(p.x) * lift * 1.5, 0., 0.));
  if (aRig.z > .5 && aRig.z < 1.5) {                           // the head turns on the neck and tips down to look
    vec3 q = p - vec3(0., .012, .27);
    float ch = cos(uHead.x), sh = sin(uHead.x), cp = cos(uHead.y), sp = sin(uHead.y);
    q.yz = vec2(q.y * cp - q.z * sp, q.y * sp + q.z * cp); n.yz = vec2(n.y * cp - n.z * sp, n.y * sp + n.z * cp);
    q.xz = vec2(q.x * ch + q.z * sh, -q.x * sh + q.z * ch); n.xz = vec2(n.x * ch + n.z * sh, -n.x * sh + n.z * ch);
    p = q + vec3(0., .012, .27);
  } else if (aRig.z > 1.5) {                                   // the tail twists to steer
    float a = uHead.z * (1. - smoothstep(-.7, -.36, p.z)), ca = cos(a), sa = sin(a);      // none at the tail's root (z -.36), all of it at its tip (z -.7)
    p.xy = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca);
  }
  vec4 wp = modelMatrix * vec4(p * uWing.w, 1.);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the animal under us, seen from its back as a rider sees it at a gallop: a dun neck that comes up out of the lower edge of the
// frame about a fifth of the frame wide and narrows away from us to the poll, a broad dark brush of mane (a takhi's: stiff,
// upright, no forelock) up its midline, and at its far end two pointed, leaf-shaped ears on narrow roots. The crest runs away
// from us less steeply than the eye looks down on it, so its dun top is seen, not only the mane standing on it; the whole of it
// (ear tips, at the top of the stride) stays under a seventh of the frame's height. Built in camera space (-Z ahead, +Y up);
// aRig = part (0 neck, 1 mane, 2 left ear, 3 right ear), height in the part, seed
const MOUNT_POLL_Z = 1.90, MOUNT_POLL_Y = -0.968, MOUNT_SLOPE = 0.46, MOUNT_EAR_X = 0.078, MOUNT_EAR_Z = 1.905, MOUNT_EAR_H = 0.114, MOUNT_F0 = 0.58, MOUNT_HINGE = 0.92;
function mountGeometry(rng) {
  const p = [], c = [], r = [], idx = [];
  const dun = C3('#B8935F', 0.60), dunLo = C3('#dcc69c', 0.62), dunT = C3('#94784d', 0.60), dark = [0.030, 0.025, 0.022], maneB = [0.050, 0.038, 0.028], tipc = [0.120, 0.092, 0.064], earC = C3('#b39662', 0.58), earIn = C3('#dcc9a2', 0.56), earD = [0.045, 0.035, 0.028];
  const v = (x, y, z, col, part, h, sd = 0) => { p.push(x, y, z); c.push(col[0], col[1], col[2]); r.push(part, h, sd, 0); return p.length / 3 - 1; };
  // the crest line comes up out of the bottom edge of the frame under our hands and runs away to the poll, rising a little faster
  // than before and slightly arched (a neck, not a plank); then the forehead drops out of sight. The neck is a thick takhi's: a
  // hand and a half across at the poll, twice that where it leaves the frame, and flat enough across that its dun top is seen
  // on either side of the mane all the way
  const crestY = (f) => MOUNT_POLL_Y + MOUNT_SLOPE * (MOUNT_POLL_Z - Math.min(f, MOUNT_POLL_Z)) + 0.014 * Math.sin(Math.PI * clamp((f - MOUNT_F0) / (MOUNT_POLL_Z - MOUNT_F0), 0, 1)) - 2.2 * Math.pow(Math.max(0, f - MOUNT_POLL_Z), 2);
  const halfW = (f) => lerp(0.31, 0.108, ss(MOUNT_F0, MOUNT_POLL_Z, f)) * (1 - 0.4 * ss(MOUNT_POLL_Z, MOUNT_POLL_Z + 0.2, f));
  const NS = 34, NA = 14, rows = [], FN0 = MOUNT_F0, FN1 = MOUNT_POLL_Z + 0.18;
  for (let k = 0; k <= NS; k++) {
    const f = FN0 + (k / NS) * (FN1 - FN0), row = [];
    for (let a = 0; a <= NA; a++) {
      const an = (a / NA - 0.5) * Math.PI * 1.12, w = halfW(f), sn = Math.sin(an), cs = Math.cos(an);
      // a rounded crest: darker under the mane (the dorsal stripe), the full dun on the shoulder of the curve, paler low on the side
      const col = Loft.mc(Loft.mc(dunT, dun, ss(0.16, 0.42, Math.abs(sn))), dunLo, ss(0.80, 1.0, Math.abs(sn)));
      row.push(v(sn * w, crestY(f) - (1 - cs) * w * lerp(0.33, 0.30, ss(1.0, 1.8, f)), -f, col, 0, 0, 0.37));
    }
    rows.push(row);
  }
  for (let k = 0; k < NS; k++) for (let a = 0; a < NA; a++) idx.push(rows[k][a], rows[k][a + 1], rows[k + 1][a + 1], rows[k][a], rows[k + 1][a + 1], rows[k + 1][a]);
  // the mane: a takhi's stiff upright brush, a hand wide and nearly a hand high, dark, clumped in locks (never a blade, never
  // saw-toothed), standing the whole length of the crest from the bottom edge of the frame and running out low between the ears
  const NM = 72, F0 = MOUNT_F0 + 0.03, F1 = MOUNT_POLL_Z - 0.06;
  // (it is lower toward the poll, so that from our seat its top runs level a little above the ear roots and both ears stand clear of it)
  const maneH = (f, k) => lerp(0.036, 0.012, ss(0.7, MOUNT_POLL_Z - 0.04, f)) * ss(F0 - 0.05, F0 + 0.10, f) * (1 + 0.09 * Math.sin(k * 1.9) + 0.06 * Math.sin(k * 0.73 + 1) - (k % 5 === 2 ? 0.16 : 0));
  // (round 11: a narrow ridge, a quarter of the neck's width where it leaves the frame and under a third at the poll, and low
  // enough near us that it does not stand in front of the far neck: at its old height and width it hid the crest beyond it and
  // read, soaked, as a black brick with two ears on it)
  const maneW = (f) => lerp(0.029, 0.016, ss(0.7, MOUNT_POLL_Z, f));
  let pv = null;
  for (let k = 0; k <= NM; k++) {
    const f = F0 + (k / NM) * (F1 - F0), y = crestY(f) - 0.012, h = maneH(f, k), sd = ((k * 5) % 9) / 9, w = maneW(f), lean = 0.05 * h, jx = 0.005 * Math.sin(k * 1.7);
    const cur = [v(-w, y, -f, maneB, 1, 0, sd), v(-w * 0.84 + jx * 0.5, y + h * 0.8, -f - lean * 0.8, dark, 1, 0.8, sd), v(jx, y + h, -f - lean, tipc, 1, 1, sd), v(w * 0.84 + jx * 0.5, y + h * 0.8, -f - lean * 0.8, dark, 1, 0.8, sd), v(w, y, -f, maneB, 1, 0, sd)];
    if (pv) for (let q = 0; q < 4; q++) idx.push(pv[q], cur[q], cur[q + 1], pv[q], cur[q + 1], pv[q + 1]);
    pv = cur;
  }
  // ears seen from behind: a leaf 14 cm long on a narrow root, widest two fifths of the way up, drawn out to a point; cupped, its
  // back the pale dun of the poll with a dark rim and tip, paler still inside (the inside shows when an ear turns to a sound, and
  // lies uppermost when the ears are laid back in the rain)
  for (const sx of [-1, 1]) {
    const part = sx < 0 ? 2 : 3, bx = sx * MOUNT_EAR_X, by = MOUNT_POLL_Y + 0.004, bz = -MOUNT_EAR_Z, EH = MOUNT_EAR_H;
    const prof = [[0, 0.020], [0.12, 0.027], [0.28, 0.0335], [0.42, 0.036], [0.58, 0.0315], [0.74, 0.022], [0.88, 0.011]], NE = 7;
    const shell = (inner) => {
      const rws = [];
      for (const [t, w] of prof) {
        const row = [];
        for (let a = 0; a <= NE; a++) {
          const an = (a / NE - 0.5) * 3.5, rim = Math.abs(a / NE - 0.5) > 0.36;
          const col = inner ? Loft.mc(earIn, earD, rim ? 0.75 : 0.2 * t) : t > 0.82 ? earD : rim ? Loft.mc(earC, earD, 0.8) : Loft.mc(dun, earC, 0.4 + 0.6 * t);
          const rr = inner ? 0.80 : 1;
          row.push(v(bx + Math.sin(an) * w * rr + sx * 0.022 * t, by + t * EH, bz + (Math.cos(an) * 0.62 - 0.30) * w * rr - t * 0.030, col, part, t, 0.37));
        }
        rws.push(row);
      }
      const tip = v(bx + sx * 0.022, by + EH, bz - 0.030 - 0.003, earD, part, 1, 0.37);
      for (let k = 0; k < rws.length - 1; k++) for (let a = 0; a < NE; a++) idx.push(rws[k][a], rws[k][a + 1], rws[k + 1][a + 1], rws[k][a], rws[k + 1][a + 1], rws[k + 1][a]);
      for (let a = 0; a < NE; a++) idx.push(rws[rws.length - 1][a], rws[rws.length - 1][a + 1], tip);
    };
    shell(false); shell(true);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  g.setAttribute('aRig', new THREE.Float32BufferAttribute(r, 4)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const MOUNT_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aRig; attribute vec3 color;
uniform vec4 uRide;       // stride phase, ear turn left, ear turn right, both ears pinned (0..1)
uniform vec4 uRide2;      // how far the neck reaches down and out, how far the head is turned (radians, right positive), left ear laid back, right ear laid back
uniform float uTime;
varying vec3 vW, vN, vC, vM; varying vec4 vAx;
void main() {
  vec3 p = position, n = normal;
  float part = aRig.x, f = -p.z;
  if (part > 1.5) {                                          // ears swivel on their roots, splay as they turn, and pin flat in the rain
    float sg = part < 2.5 ? -1. : 1.;
    vec3 root = vec3(sg * ${MOUNT_EAR_X.toFixed(3)}, ${(MOUNT_POLL_Y + 0.004).toFixed(3)}, -${MOUNT_EAR_Z.toFixed(3)});
    vec3 q = p - root;
    float turn = (part < 2.5 ? uRide.y : uRide.z) + .07 * sin(uTime * 1.3 + part * 2.1);
    float c = cos(turn), s = sin(turn);
    q = vec3(q.x * c + q.z * s, q.y, -q.x * s + q.z * c);
    float roll = sg * .55 * min(abs(turn), 1.2), cr = cos(roll), sr = sin(roll);      // a turned ear leans out from the head
    q = vec3(q.x * cr + q.y * sr, -q.x * sr + q.y * cr, q.z);
    // pinned: laid back along the crest and a little out, one on either side of the mane, so that each still shows as a leaf
    // (laid back half way, not flat: from our seat an ear laid flat points straight back at the eye and is seen end on, as a stub
    // sticking out sideways)
    float pk = clamp(uRide.w + (part < 2.5 ? uRide2.z : uRide2.w), 0., 1.), pin = pk * .56, cp = cos(pin), sp = sin(pin);
    q = vec3(q.x, q.y * cp - q.z * sp, q.y * sp + q.z * cp);
    float so = sg * .20 * pk, co = cos(so), sno = sin(so);
    q = vec3(q.x * co + q.z * sno, q.y, -q.x * sno + q.z * co);
    p = root + q + vec3(sg * .008, .004, 0.) * pk;
  }
  if (part > .5 && part < 1.5) p.x += aRig.y * .007 * sin(uTime * 23. + aRig.z * 40.) + aRig.y * .009 * sin(uRide.x * 6.2832 + aRig.z * 9.);
  {                                                          // the neck bends as the head turns: nothing at the withers, all of it at the poll
    float bt = uRide2.y * smoothstep(${(MOUNT_HINGE + 0.04).toFixed(2)}, 1.9, f), cb = cos(bt), sb = sin(bt);
    p.xz = vec2(p.x * cb - p.z * sb, p.x * sb + p.z * cb);
    n.xz = vec2(n.x * cb - n.z * sb, n.x * sb + n.z * cb);
  }
  float pump = sin(uRide.x * 6.2832), fr = max(f - ${MOUNT_HINGE.toFixed(2)}, 0.);     // the neck pumps down and forward once a stride, hinged at the withers
  p.y += (-.024 * pump - uRide2.x) * fr - .004 * cos(uRide.x * 12.566);
  p.z -= (.050 * pump + 1.4 * uRide2.x) * fr;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vM = position * 2.4 + 1.; vAx = vec4(1., 1., 1., aRig.z);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------- plants, stones (instanced, one shader)
// Every plant is a few solid limbs plus cards on which the fragment shader draws the fine stuff, as the feather grass
// does: a fan of thin jointed twigs (saxaul sprays, wormwood sprigs) or a feathered plume (tamarisk). aKind says what a
// triangle is: 0 solid limb, 1 twig spray, 2 plume, 3 cushion dome, 4 contact shadow, 5 varnished pebble.
// aW = how far a vertex moves in the wind (0 at the root)
function plantGeo(build) {
  const p = [], c = [], w = [], uv = [], kd = [], idx = [];
  const v = (x, y, z, col, wd = 0, u = 0, vv = 0, kind = 0) => { p.push(x, y, z); c.push(col[0], col[1], col[2]); w.push(wd); uv.push(u, vv); kd.push(kind); return p.length / 3 - 1; };
  build(v, idx);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kd, 1)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function limb(v, idx, pts, r0, r1, sides, col0, col1, w0, w1) {      // a bent tapering tube through pts
  let prev = null;
  for (let k = 0; k < pts.length; k++) {
    const t = k / (pts.length - 1), a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    const u = new THREE.Vector3(1, 0, 0).cross(d); if (u.lengthSq() < 0.01) u.set(0, 0, 1).cross(d); u.normalize();
    const w = d.clone().cross(u), rad = lerp(r0, r1, t) * (1 + 0.22 * Math.sin(k * 2.7 + r0 * 40)), ring = [];      // gnarled: the girth swells and pinches
    for (let s = 0; s < sides; s++) { const an = s / sides * 6.2832 + k * 0.5, cs = Math.cos(an) * rad, sn = Math.sin(an) * rad; ring.push(v(pts[k][0] + u.x * cs + w.x * sn, pts[k][1] + u.y * cs + w.y * sn, pts[k][2] + u.z * cs + w.z * sn, Loft.mc(col0, col1, t * (0.7 + 0.3 * (s & 1))), lerp(w0, w1, t))); }
    if (prev) for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; idx.push(prev[s], ring[s], prev[s1], prev[s1], ring[s], ring[s1]); }
    prev = ring;
  }
}
// a card from a (root, uv.y = 0) to b (tip), hw wide each side of the line, turned by `roll` about it
function card(v, idx, a, b, hw, roll, col, kind, w0, w1, flare = 1) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1; d.multiplyScalar(1 / l);
  const s = new THREE.Vector3(0, 1, 0).cross(d); if (s.lengthSq() < 0.01) s.set(1, 0, 0); s.normalize().applyAxisAngle(d, roll);
  const i0 = v(a[0] - s.x * hw, a[1] - s.y * hw, a[2] - s.z * hw, col, w0, 0, 0, kind), i1 = v(a[0] + s.x * hw, a[1] + s.y * hw, a[2] + s.z * hw, col, w0, 1, 0, kind);
  const i2 = v(b[0] + s.x * hw * flare, b[1] + s.y * hw * flare, b[2] + s.z * hw * flare, col, w1, 1, 1, kind), i3 = v(b[0] - s.x * hw * flare, b[1] - s.y * hw * flare, b[2] - s.z * hw * flare, col, w1, 0, 1, kind);
  idx.push(i0, i1, i2, i0, i2, i3);
}
// saxaul: a pale gnarled trunk that forks low, crooked boughs, and from every bough end drooping sprays of fine green jointed twigs
function saxaulGeometry(rng) {
  return plantGeo((v, idx) => {
    const bark = C3('#c9bda6', 0.9), barkD = C3('#857865', 0.8), tw = [C3('#66774a'), C3('#7a8a5a'), C3('#909c72')];
    const lean = rng.range(-0.25, 0.25), tips = [];
    limb(v, idx, [[0, -0.12, 0], [0.09, 0.22, 0.05], [lean * 0.4 - 0.08, 0.5, -0.07], [lean * 0.8 + 0.05, 0.82, 0.03], [lean, 1.12, 0.05]], 0.115, 0.05, 5, barkD, bark, 0, 0.1);
    const nb = 6;
    for (let b = 0; b < nb; b++) {
      const an = b / nb * 6.2832 + rng.range(-0.4, 0.4), h0 = rng.range(0.3, 1.05), len = rng.range(0.55, 1.05), up = rng.range(0.3, 0.85), kink = rng.range(-0.25, 0.25);
      const x0 = lean * h0 / 1.12, dx = Math.cos(an), dz = Math.sin(an);
      const m1 = [x0 + dx * len * 0.35 - dz * kink * 0.3, h0 + up * 0.45, dz * len * 0.35 + dx * kink * 0.3], m2 = [x0 + dx * len * 0.7 + dz * kink * 0.3, h0 + up * 0.8 + rng.range(0, 0.12), dz * len * 0.7 - dx * kink * 0.3], end = [x0 + dx * len, h0 + up, dz * len];
      limb(v, idx, [[x0, h0, 0], m1, m2, end], 0.045, 0.012, 3, bark, bark, 0.1, 0.4);
      tips.push([end, dx, dz, 1], [m2, -dz, dx, 0.8]);
      if (b & 1) tips.push([m1, dz, -dx, 0.7]);
    }
    tips.push([[lean, 1.12, 0.05], Math.cos(lean * 9), Math.sin(lean * 9), 0.9]);
    for (const [tp, dx, dz, sz] of tips) for (let k = 0; k < 2; k++) {       // sprays: two crossed cards arching out and drooping
      const an = Math.atan2(dz, dx) + (k ? rng.range(0.9, 2.2) : rng.range(-0.4, 0.4)), len = rng.range(0.55, 0.85) * sz, cx = Math.cos(an), cz = Math.sin(an);
      const tipP = [tp[0] + cx * len * 0.75, tp[1] - len * rng.range(0.15, 0.6), tp[2] + cz * len * 0.75];
      card(v, idx, [tp[0] - cx * 0.03, tp[1] + 0.04, tp[2] - cz * 0.03], tipP, 0.2 * sz, rng.range(-0.5, 0.5) + k * 1.2, tw[(k + (tp[1] > 1 ? 1 : 0)) % 3], 1, 0.35, 1, 2.1);
    }
  });
}
// tamarisk: arching wine-dark stems carrying feathery grey-green plumes with rusty seed heads
function tamariskGeometry(rng) {
  return plantGeo((v, idx) => {
    const stem = C3('#b08a78'), gr = [C3('#7f927a'), C3('#93a48c'), C3('#6f8672')];
    for (let s = 0; s < 7; s++) {
      const an = s / 7 * 6.2832 + rng.range(-0.3, 0.3), reach = rng.range(0.45, 1.15), hgt = rng.range(1.15, 2.0), dx = Math.cos(an), dz = Math.sin(an);
      const P = (t) => [dx * reach * t * t, hgt * (1 - (1 - t) * (1 - t)) - 0.05, dz * reach * t * t];
      limb(v, idx, [P(0), P(0.35), P(0.7), P(1)], 0.028, 0.007, 3, stem, stem, 0, 0.5);
      for (let k = 0; k < 4; k++) {
        const t = k === 3 ? 0.97 : 0.42 + k * 0.2, c0 = P(t), fa = k === 3 ? an : an + (k & 1 ? 1 : -1) * rng.range(0.5, 1.3), fl = rng.range(0.6, 0.95) * (k === 3 ? 1.15 : 1), fx_ = Math.cos(fa), fz = Math.sin(fa), rise = k === 3 ? rng.range(0.25, 0.6) : rng.range(0.45, 0.8);
        const tipP = [c0[0] + fx_ * fl * (1 - rise * 0.5), c0[1] + fl * rise, c0[2] + fz * fl * (1 - rise * 0.5)];
        card(v, idx, c0, tipP, 0.17, rng.range(-0.6, 0.6), gr[(s + k) % 3], 2, t * 0.5, 1);
        if (k === 3 || k === 1) card(v, idx, c0, tipP, 0.17, 1.5708 + rng.range(-0.3, 0.3), gr[(s + k + 1) % 3], 2, t * 0.5, 1);
      }
    }
  });
}
// feather grass: three crossed cards per tussock; the fragment shader draws nine fine curved blades on each, every
// one ending in a pale feathered awn, so a tussock is 27 ribbons for 6 triangles
function grassGeometry() {
  const p = [], uv = [], w = [], idx = [];
  for (let k = 0; k < 3; k++) {
    const an = k * 1.0472 + 0.3, dx = Math.cos(an) * 0.5, dz = Math.sin(an) * 0.5, o = k * 4;
    p.push(-dx, 0, -dz, dx, 0, dz, dx * 1.25, 0.8, dz * 1.25, -dx * 1.25, 0.8, -dz * 1.25);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1); w.push(0, 0, 1, 1);
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1)); g.setIndex(idx);
  return g;
}
const GRASS_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute float aW; attribute float iShade;
varying vec3 vW; varying vec2 vUv; varying float vSh, vSeed, vBand;
void main() {
  vec4 wp = instanceMatrix * vec4(position, 1.);
  vec3 o = instanceMatrix[3].xyz;
  float d = uFront - dot(o.xz, uWetDir);
  float gust = 1. + 2.6 * exp(-abs(d + 40.) / 55.) * uShade2.z + 1.2 * uShade2.z;
  float band = sin(dot(o.xz, vec2(.11, .05)) - uTime * 2.3) * .5 + .5;        // ripples travelling over the wash floor
  float sway = (.30 + .70 * band) * gust;
  vec2 dir = normalize(uWind);
  wp.xz += dir * (aW * sway * (.16 + .05 * sin(uTime * 5.3 + o.x * 1.7 + o.z * 2.3)));
  wp.y -= aW * sway * .05;
  vW = wp.xyz; vUv = uv; vSh = iShade; vSeed = fract(o.x * 7.31 + o.z * 3.17); vBand = band;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GRASS_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec3 vW; varying vec2 vUv; varying float vSh, vSeed, vBand;
void main() {
  float v = vUv.y, x = vUv.x * 2. - 1.;
  float spread = .10 + .90 * pow(max(v, 1e-3), .8);              // the blades fan out from the root
  float fw = fwidth(x) / spread;                                  // one pixel, in blade coordinates
  float q = x / spread, qn = (q * .5 + .5) * 9.;
  if (qn < 0. || qn >= 9.) discard;
  float id = floor(qn), h1 = hash21(vec2(id, vSeed * 91.)), h2 = hash21(vec2(id + 3.7, vSeed * 57.));
  float top = .52 + .46 * h2;                                     // this blade's height
  float bend = (h1 - .5) * .9 * v * v;                            // and its own curve
  float f = fract(qn) - (.5 + (h1 - .5) * .5) - bend;
  float t = v / top;
  float awn = smoothstep(.55, .72, t);                            // the feathered awn above the leaf
  float wd = mix(.062 * (1. - .5 * t), .12, awn) * (1. - smoothstep(.93, 1., t));
  wd = max(wd, min(fw * 4.5 * .75, .5));                          // never under a pixel and a half
  if (t > 1. || abs(f) > wd) discard;
  vec3 alb = mix(vec3(.17, .16, .075), vec3(.47, .43, .23), smoothstep(0., .5, t));
  alb = mix(alb, vec3(.15, .30, .09), uLand.x * .55 * (1. - awn));
  alb = mix(alb, vec3(.63, .59, .47), awn * (.75 + .25 * h1));
  vec2 wt = wetAt(vW);
  alb *= mix(1., mix(.68, .92, uBed.w), wt.x);
  alb = mix(alb, vec3(.80, .84, .90), uBed.z * smoothstep(-.7, .7, wt.y) * .55 * t);
  // before sunrise the grass is slate-violet, its awn tips taking the rose of the sky
  float dawnK = uBed.w * (1. - keyAt(vW));
  alb = mix(alb, mix(vec3(.25, .245, .34), vec3(.80, .50, .52), awn * smoothstep(.7, 1., t)), .62 * dawnK);
  float key = keyAt(vW) * vSh;
  vec3 V = normalize(vW - uCam + vec3(0., 1e-4, 0.));
  float back = max(dot(V, uSun), 0.); back = back * back * back;  // awns glow against the light
  vec3 col = alb * (uSunCol * (key * (.52 + .22 * vBand + .7 * back * (.3 + .7 * awn))) + uSkyCol * (.50 + .26 * t) * (1. + .5 * dawnK));
  col *= (.55 + .45 * smoothstep(0., .22, v)) * (1. - .42 * uFinC.w);   // dark at the root: the tussock sits on the ground; dimmer by moonlight
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}`;
function cushionGeometry() {       // wormwood and saltwort: a low grey-sage mound 20 cm high, a tuft of fine sprigs over it, a soft shadow under it
  return plantGeo((v, idx) => {
    const wh = [1, 1, 1], sage = [C3('#8a8f7a', 0.9), C3('#9a9c84', 0.9), C3('#7b8470', 0.9)];
    const s0 = v(-0.52, 0.03, -0.52, wh, 0, 0, 0, 4), s1 = v(0.52, 0.03, -0.52, wh, 0, 1, 0, 4), s2 = v(0.52, 0.03, 0.52, wh, 0, 1, 1, 4), s3 = v(-0.52, 0.03, 0.52, wh, 0, 0, 1, 4);
    idx.push(s0, s2, s1, s0, s3, s2);
    const uvOf = (x) => x / 0.68 + 0.5, top = v(0.02, 0.2, -0.01, wh, 0.15, 0.5, 0.5, 3), ra = [], rb = [];
    for (let k = 0; k < 7; k++) {
      const an = k / 7 * 6.2832, r1 = 0.30 + 0.035 * Math.sin(k * 2.9), r2 = 0.19 + 0.03 * Math.sin(k * 1.7 + 1), x1 = Math.cos(an) * r1, z1 = Math.sin(an) * r1, x2 = Math.cos(an + 0.2) * r2, z2 = Math.sin(an + 0.2) * r2;
      ra.push(v(x1, -0.02, z1, wh, 0, uvOf(x1), uvOf(z1), 3)); rb.push(v(x2, 0.145 + 0.02 * Math.sin(k * 4.1), z2, wh, 0.1, uvOf(x2), uvOf(z2), 3));
    }
    for (let k = 0; k < 7; k++) { const k1 = (k + 1) % 7; idx.push(top, rb[k1], rb[k], ra[k], rb[k], rb[k1], ra[k], rb[k1], ra[k1]); }
    for (let k = 0; k < 3; k++) card(v, idx, [0, 0.03, 0], [0.004 * (k - 1), 0.32, 0], 0.33, k * 1.0472 + 0.4, sage[k], 1, 0, 0.8, 1.15);      // three crossed fans of sprigs
  });
}
function pebbleGeometry() {        // a dark varnished pebble of the lag: a rounded stone half sunk in the crust (unit radius)
  const g = plantGeo((v, idx) => {
    const hi = [0.105, 0.088, 0.075], mid = [0.07, 0.058, 0.05], lo = [0.022, 0.02, 0.019];
    const top = v(0.05, 0.56, 0.02, hi, 0, 0, 0, 5), ra = [], rb = [];
    for (let k = 0; k < 5; k++) {          // (five sides: a stone a hand across is never seen close enough to count them)
      const an = k / 5 * 6.2832, j = 1 + 0.12 * Math.sin(k * 2.3);
      ra.push(v(Math.cos(an) * 0.86 * j, 0.36, Math.sin(an) * 0.62 * j, mid, 0, 0, 0, 5)); rb.push(v(Math.cos(an + 0.15) * 1.22 * j, -0.06, Math.sin(an + 0.15) * 0.9 * j, lo, 0, 0, 0, 5));
    }
    for (let k = 0; k < 5; k++) { const k1 = (k + 1) % 5; idx.push(top, ra[k1], ra[k], rb[k], ra[k], ra[k1], rb[k], ra[k1], rb[k1]); }
  });
  const p = g.attributes.position, n = g.attributes.normal;          // shade it as the rounded stone it stands for
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) * 0.75, y = p.getY(i) * 1.6 + 0.25, z = p.getZ(i), l = Math.hypot(x, y, z) || 1; n.setXYZ(i, x / l, y / l, z / l); }
  return g;
}
function screeGeometry(rng, flat) {       // a flat chip of a broken bed lying half sunk in the clay, its edges broken and one of them bevelled (unit half-length)
  return plantGeo((v, idx) => {
    const c = [];
    for (let k = 0; k < 8; k++) { const sx = k & 1 ? 1 : -1, up = (k & 2) > 0, sz = k & 4 ? 1 : -1, inset = up ? (sx > 0 ? 0.5 : 0.82) * rng.range(0.9, 1.1) : 1; c.push([sx * rng.range(0.62, 1.1) * inset, up ? rng.range(0.10, 0.19) * flat : -0.16, sz * rng.range(0.4, 0.82) * (up ? 0.84 : 1)]); }
    for (const [a, b, cc, d] of [[2, 6, 7, 3], [4, 5, 7, 6], [0, 2, 3, 1], [1, 3, 7, 5], [0, 4, 6, 2]]) for (const t of [[a, b, cc], [a, cc, d]]) for (const q of t) idx.push(v(c[q][0], c[q][1], c[q][2], c[q][1] > 0 ? [1, 1, 1] : [0.38, 0.38, 0.4], 0, 0, 0, 6));
  });
}
const PLANT_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec3 color; attribute float aW; attribute float aKind; attribute float iShade;
varying vec3 vW, vN, vC; varying vec2 vUv; varying float vSh, vSeed, vKind;
void main() {
  vec4 wp = instanceMatrix * vec4(position, 1.);
  vec3 o = instanceMatrix[3].xyz;
  // wind: travelling ripple bands, and the gust front that runs ahead of the wet line
  float d = uFront - dot(o.xz, uWetDir);
  float gust = 1. + 2.6 * exp(-abs(d + 40.) / 55.) * uShade2.z + 1.2 * uShade2.z;
  float band = sin(dot(o.xz, vec2(.11, .05)) - uTime * 2.3) * .5 + .5;
  float sway = (.35 + .65 * band) * gust;
  vec2 dir = normalize(uWind);
  wp.xz += dir * (aW * sway * (.10 + .05 * sin(uTime * 5.3 + o.x * 1.7 + o.z * 2.3 + position.y * 2.)));
  wp.y -= aW * sway * .03;
  vW = wp.xyz; vC = color; vSh = iShade; vUv = uv; vKind = aKind; vSeed = fract(o.x * 7.31 + o.z * 3.17);
  if (aKind > 5.5) {
    // a chip is a piece of the bed it lies on: that bed's colour, quieter and a shade darker than the ground, clay-brown between the fins
    float kth = 1. - smoothstep(-90., -10., min(min(o.x + 520., 520. - o.x), min(o.z + 170., 350. - o.z)));
    vec3 bc = mix(textureLod(uStrata, vec2((dot(o, uNBed) - uBed.x) * uBed.y, .5), 0.).rgb, textureLod(uStrata, vec2((dot(o, uLandBed) * uLand.w - uBed.x) * uBed.y, .5), 0.).rgb, kth);
    vec2 gq = o.xz - uFinA.zw;
    float gT = dot(gq, uFinA.xy), gL = dot(gq, vec2(uFinA.y, -uFinA.x));
    float gapK = (1. - smoothstep(uFinC.y - 16., uFinC.y + 14., gT)) * (1. - smoothstep(uFinC.x + 4., uFinC.x + 9., abs(gL))) * step(-260., gT);
    bc = mix(bc, vec3(.30, .17, .11), gapK * .7);
    bc = mix(vec3(dot(bc, vec3(.2126, .7152, .0722))), bc, .62);
    vC = color * mix(bc, uCream, .20) * (.74 + .16 * vSeed);
  }
  vec3 nn = mat3(instanceMatrix) * normal;
  vN = normalize(mix(nn / max(length(nn), 1e-5), vec3(0., 1., 0.), aKind > .5 && aKind < 4.5 ? .45 : 0.) + vec3(0., 1e-3, 0.));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PLANT_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec3 vW, vN, vC; varying vec2 vUv; varying float vSh, vSeed, vKind;
void main() {
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 alb = vC;
  float alpha = 1., thin = 0., tipk = 0., gloss = 0.;
  float v = vUv.y, x = vUv.x * 2. - 1.;
  vec2 fwx = vec2(fwidth(x), fwidth(v));
  if (vKind > 5.5) {
    // scree: a broken piece of bed in that bed's own colour, grained and chipped
    alb *= .80 + .4 * vnoise(vW.xz * 17. + vW.y * 11. + vSeed * 9.);
    alb = capSat(alb, .46);
    gloss = .16;
  } else if (vKind > 4.5) {
    // a varnished pebble: near black with a brown cast and a dull sheen
    alb *= .8 + .5 * vnoise(vW.xz * 31. + vSeed * 9.);
    gloss = .5;
  } else if (vKind > 3.5) {
    // the soft shadow a cushion lays on the crust
    float r = length(vUv * 2. - 1.);
    alpha = .62 * (1. - smoothstep(.30, 1., r));
    alb = vec3(.012, .011, .013);
  } else if (vKind > 2.5) {
    // the mound: fine twigs radiating from its middle, pale tips over dark gaps
    vec2 p = vUv * 2. - 1.;
    float r = length(p), ang = r < 1e-4 ? 0. : atan(p.y, p.x);
    float tw = vnoise(vec2(ang * 11. + vSeed * 30., r * 6.)), sp = vnoise(p * 27. + vSeed * 17.), sp2 = vnoise(p * 61. + 3.);
    float st = clamp(smoothstep(.38, .62, tw) * .55 + smoothstep(.42, .66, sp) * .45 + (sp2 - .5) * .5, 0., 1.);
    alb = mix(vec3(.040, .045, .034), vec3(.27, .29, .215), st) * (.8 + .4 * vSeed) * (.55 + .45 * (1. - smoothstep(.45, 1., r)));
    n = normalize(n + vec3(sp - .5, 0., tw - .5) * .7);
  } else if (vKind > 1.5) {
    // a tamarisk plume: fine scale-leaved twigs sweeping up either side of a rachis, rusty seed heads toward the tip
    float ax = abs(x);
    float env = pow(max(sin(3.14159 * clamp(v * .93 + .05, 0., 1.)), 0.), .6) * (.78 + .22 * vnoise(vec2(v * 9., vSeed * 40.)));
    if (ax > env) discard;
    float wob = vnoise(vec2(x * 3., v * 5. + vSeed * 9.)) * 1.3;
    float sc = v * 21. - ax * 7. + wob + step(0., x) * .5;
    float fwb = fwx.y * 21. + fwx.x * 7.;
    float bar = abs(fract(sc) - .5);
    // near, the twigs are drawn one by one; where they fall under a pixel the plume is stippled to the same cover, never filled in
    float far = smoothstep(.16, .40, fwb);
    float keep = mix(step(bar, .19), step(hash21(floor(gl_FragCoord.xy) + floor(vSeed * 64.)), .68 - .34 * ax / max(env, .05)), far) + step(ax, max(.03, fwx.x * .8)) * (1. - far);
    if (keep < .5) discard;
    float rust = smoothstep(.70, .98, v + .16 * ax / max(env, .05) + .22 * (vnoise(vec2(v * 6., x * 4. + vSeed * 20.)) - .5));
    alb = mix(alb * (.80 + .45 * vnoise(vec2(sc * .7, x * 5.))), vec3(.40, .185, .10), rust * .8);
    alb *= .55 + .45 * smoothstep(0., .25, v);
    thin = 1.; tipk = rust;
  } else if (vKind > .5) {
    // a spray of fine jointed twigs fanning from the root of the card
    float spread = .12 + .88 * pow(max(v, 1e-3), .7);
    float fw = fwx.x / spread;
    float q = x / spread, qn = (q * .5 + .5) * 7.;
    if (qn < 0. || qn >= 7.) discard;
    float id = floor(qn), h1 = hash21(vec2(id, vSeed * 91.)), h2 = hash21(vec2(id + 3.7, vSeed * 57.));
    float top = .55 + .45 * h2, bend = (h1 - .5) * 1.1 * v * v;
    float f = fract(qn) - (.5 + (h1 - .5) * .5) - bend, t = v / top;
    float node = smoothstep(.70, .78, fract(t * 6. + h1 * 3.));
    float wd = (.075 + .06 * node) * (1. - .5 * t);
    wd = max(wd, min(fw * 3.5 * .75, .5));
    if (t > 1. || abs(f) > wd) discard;
    alb *= (.62 + .75 * t) * (1. - .28 * node) * (.85 + .3 * h1);
    thin = 1.; tipk = t;
  } else {
    alb *= .82 + .36 * vnoise(vW.xz * 23. + vW.y * 17.);          // bark
  }
  vec2 wt = wetAt(vW);
  float key = keyAt(vW) * vSh;
  alb *= mix(1., .62, wt.x);
  if (vKind > 4.5) alb = mix(alb, vec3(dot(alb, vec3(.3333))) * vec3(.80, .90, 1.12), .6 * uFinC.w);      // stones are slate and silver by moonlight
  alb = mix(alb, vec3(.78, .82, .88), uBed.z * smoothstep(-.7, .7, wt.y) * mix(smoothstep(.45, .9, n.y), .5 * tipk, thin) * ((vKind > 3.5 && vKind < 4.5) ? 0. : 1.));
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  float d = dot(n, uSun);
  float back = max(dot(-V, uSun), 0.); back = back * back * back;
  float ndl = mix(max(d, 0.) * .8 + max(d * .5 + .5, 0.) * .2, .50 + .75 * back * (.3 + .7 * tipk), thin);
  vec3 col = alb * (uSunCol * (ndl * key) + uSkyCol * (.42 + .58 * (n.y * .5 + .5)) + uBounce * (.8 * (1. - n.y) * (.3 + .7 * key)));
  vec3 hv = normalize(uSun + V + vec3(0., 1e-3, 0.));
  float fr = 1. - max(dot(n, V), 0.);
  col += (uSunCol * (pow(max(dot(n, hv), 1e-4), 30.) * key * step(0., d)) + uSkyCol * (fr * fr * .35)) * (gloss * (.35 + .65 * wt.x));
  col *= 1. - .3 * uFinC.w * thin;
  {
    vec3 toR = uRing.xyz - vW; float dR = length(toR) + 1e-3;
    col += alb * uRingB.rgb * (uRing.w / (1. + dR * dR / 520.) * (.25 + .75 * max(dot(n, toR / dR), 0.)));
  }
  gl_FragColor = vec4(max(col, vec3(0.)), alpha);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- dust at every footfall, mud clods after the rain
const DUST_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec4 iPos, iPose, iAux;
attribute vec3 aQ;        // corner x, corner y, puff index 0..1
uniform float uSpeed;
varying vec2 vUv; varying float vA, vKey, vMud, vSpray, vClod;
void main() {
  float k = aQ.z, seed = fract(iAux.w * 7.13 + k * 3.7);
  float life = fract(uTime * (.85 + .3 * seed) + k + iAux.w);
  float cy = cos(iPos.w), sy = sin(iPos.w);
  vec3 fwd = vec3(sy, 0., cy), side = vec3(cy, 0., -sy);
  float age = life * 1.25;
  float rearK = iPose.w * (1. - iPose.z);
  vec3 p = iPos.xyz - fwd * (age * uSpeed * iPose.z + .5 - (fract(seed * 7.7) - .3) * 2.2 * rearK) + side * ((seed - .5) * (.7 + 2.4 * rearK));
  float wet = wetAt(p).x;
  vMud = step(.5, wet);
  // dry: a pale puff that swells and lifts; wet: mud clods thrown up and back on short arcs, and a burst of spray at the hoof
  vSpray = vMud * (1. - step(.34, seed));
  // on dry ground two puffs in five are hard clods of crust thrown up and back with the dust
  vClod = (1. - vMud) * step(.60, seed);
  float arc = .12 + 2.7 * life * (1. - life) * (.5 + seed);
  float up = mix(mix(.25 + age * 1.5, arc * .8, vClod), mix(arc, .15 + 1.5 * sqrt(life), vSpray), vMud);
  p += fwd * (max(vMud, vClod) * age * uSpeed * iPose.z * mix(.55, .25, vSpray));
  // the trail lies on the slope the animal has just run up or down, not level behind it: on a climb a level trail hung in the sky
  // as strings of round puffs
  float grade = sin(iPose.y) / max(cos(iPose.y), .4);
  p.y -= clamp(grade, -.5, .5) * dot(iPos.xz - p.xz, fwd.xz);
  p.y += up * iAux.x;
  p.xz += normalize(uWind) * (age * 1.5 * (1. - vMud) * (1. - vClod));
  float size = mix(mix(.3 + 1.25 * life, .030 + .045 * fract(seed * 5.3), vClod), mix(.045 + .065 * seed, .30 + 1.1 * life, vSpray), vMud) * iAux.x;
  vA = mix(mix(sin(3.14159 * sqrt(life)) * (.25 + .2 * rearK), 1. - smoothstep(.75, 1., life), vClod), mix((1. - smoothstep(.75, 1., life)), .34 * (1. - life) * smoothstep(0., .08, life), vSpray), vMud) * max(iPose.z, rearK * 1.6) * step(.01, iAux.x);
  vKey = keyAt(p);
  vUv = aQ.xy * 2.;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  vA *= smoothstep(2., 7., -mvPosition.z) * (1. - smoothstep(.5, .85, abs(grade)));      // (on a bank too steep or broken to lay a trail along, no trail)
  mvPosition.xy += aQ.xy * size;
  gl_Position = projectionMatrix * mvPosition;
  if (vA < .004) gl_Position = vec4(0., 0., -3., 1.);
  #include <fog_vertex>
}`;
// the herd's dust hanging in the air: soft boiling puffs fixed in the land, lit by the low sun (gold where the eye looks toward it)
const HAZE_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
${GLSL_COMMON}
attribute vec4 iPuff, iPuffA;      // foot xyz, seed; size, strength
varying vec2 vUv; varying float vA, vKey, vSeed, vGlow;
void main() {
  float seed = iPuff.w, t = uTime * (.10 + .08 * seed) + seed * 17.;
  vec3 p = iPuff.xyz;
  float wet = wetAt(p).x;
  p.xz += uWind / max(length(uWind), 1e-3) * (sin(t) * 1.1);
  p.y += iPuffA.x * (.30 + .10 * sin(t * 1.7 + seed * 9.));
  vKey = keyAt(p); vSeed = seed; vUv = position.xy * 2.;
  vec3 toP = p - uCam;
  vGlow = pow(max(dot(toP / max(length(toP), 1e-3), uSun), 0.), 3.);
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  vA = iPuffA.y * (1. - wet) * smoothstep(1.4, 6., -mvPosition.z);
  mvPosition.xy += position.xy * (iPuffA.x * 2.);
  gl_Position = projectionMatrix * mvPosition;
  if (vA < .004) gl_Position = vec4(0., 0., -3., 1.);
  #include <fog_vertex>
}`;
const HAZE_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
varying vec2 vUv; varying float vA, vKey, vSeed, vGlow;
void main() {
  float r = dot(vUv, vUv);
  vec2 q = vUv * 1.6 + vSeed * 31.;
  float n = vnoise(q + vec2(uTime * .13, -uTime * .22)) * .6 + vnoise(q * 2.3 + vec2(-uTime * .21, uTime * .33) + 7.) * .4;
  float a = exp(-r * 2.4) * (1. - smoothstep(.55, 1., r)) * smoothstep(.20, .62, n + .34 * (1. - r)) * vA * .26;
  if (a < .004) discard;
  vec3 col = uCream * vec3(1., .88, .66) * (uSkyCol * .9 + uSunCol * (vKey * (.46 + 1.0 * vGlow)));
  gl_FragColor = vec4(max(col, vec3(0.)), a);
  #include <fog_fragment>
}`;
const DUST_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSunCol, uSkyCol, uCream, uMud;
varying vec2 vUv; varying float vA, vKey, vMud, vSpray, vClod;
void main() {
  float r = dot(vUv, vUv);
  float soft = exp(-r * 3.6) * (1. - smoothstep(.55, 1., r)), hard = 1. - smoothstep(.5, .9, r);
  float a = mix(mix(soft, hard, vClod), mix(hard, soft, vSpray), vMud) * vA;
  if (a < .004) discard;
  // wet clods are the red mud of the beds themselves, lit like any stone
  vec3 wetc = mix(vec3(.19, .058, .036) * (uSkyCol * .9 + uSunCol * (vKey * .5)), mix(uMud * 2.2, vec3(.80), .62) * (uSkyCol * 1.25 + uSunCol * (vKey * .6)), vSpray);
  vec3 col = mix(uCream * mix(1., .42, vClod) * (uSkyCol * 1.1 + uSunCol * (vKey * .62)), wetc, vMud);
  gl_FragColor = vec4(max(col, vec3(0.)), a);
  #include <fog_fragment>
}`;
// the flash flood (rare): a red-brown bore with a rolling foam front running down a wash cut into the Knife's left flank,
// and afterwards a shallow sheet of the same water along the left wall of the gap
const FLOOD_WAVE = /* glsl */`
// how far the front runs ahead here: a ragged bow, fastest in mid-channel, held back along the banks, its lobes shifting
float floodLobe(float a, float t) { return 3.2 * (1. - a * a) - 2.4 + 1.5 * sin(a * 4.3 + t * .7) + .8 * sin(a * 9.1 - t * 1.3 + 1.7); }
// the lumpy surface: standing waves that hold their place, a chop travelling down the current, swells across. x height, y d/ds, z d/da
// (two trains of standing waves at different angles, their phase bent by a slow warp and each fading in and out along and
// across the channel: no crest spans it, no two lie parallel)
vec3 floodWave(float s, float a, float t) {
  float w1 = 2.6 * sin(s * .043 + a * 1.7) + 1.4 * sin(s * .11 - a * 2.9 + 1.3);
  float m1 = (.65 + .35 * sin(s * .21 + 1.)) * (.5 + .5 * sin(s * .13 + a * 2.2 + 4.)), m4 = .5 + .5 * sin(s * .09 - a * 1.6 + t * .2);
  // every train lives in patches a few metres long and a third of the channel wide, and runs askew to the others: short broken crests
  float e1 = smoothstep(-.25, .45, sin(a * 5.3 + s * .17 + 1.) * sin(s * .29 - a * 2.1 + t * .15));
  float e2 = smoothstep(-.25, .45, sin(a * 7.1 - s * .23 + 4.) * sin(s * .19 + a * 3.3 - t * .1 + 2.));
  float p1 = s * .9 + a * 6.5 + w1, p2 = s * 1.7 - t * 3.1 - a * 9., p3 = a * 11. + s * .35 + t * .6, p4 = s * .61 - a * 8.4 + 2. - w1 * .6;
  return vec3(.34 * m1 * e1 * sin(p1) + .14 * e2 * sin(p2) + .16 * sin(p3) + .24 * m4 * e2 * sin(p4),
              .306 * m1 * e1 * cos(p1) + .238 * e2 * cos(p2) + .056 * cos(p3) + .146 * m4 * e2 * cos(p4),
              2.21 * m1 * e1 * cos(p1) - 1.26 * e2 * cos(p2) + 1.76 * cos(p3) - 2.02 * m4 * e2 * cos(p4));
}
`;
const FLOOD_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aSL;       // metres along the wash (minus 10000 for the gap sheet), -1..1 across, depth of the water here
attribute vec3 aTan;      // the wash's direction here (x, z), and how high the bed stands here above this row's datum
uniform vec4 uFlood;      // front position, time, bore gate, gap sheet gate
varying vec3 vSL, vW; varying float vB; varying vec2 vTan, vDF;
${FLOOD_WAVE}
void main() {
  vec3 p = position;
  float sheet = step(aSL.x, -5000.);
  float sx = aSL.x + sheet * 10000.;
  float b = mix(uFlood.x - sx + floodLobe(aSL.y, uFlood.y), 200., sheet);          // metres behind the front
  float body = smoothstep(0., 1.6, b);
  float roll = exp(-(b - 1.9) * (b - 1.9) / 3.2) * (.85 + .22 * sin(aSL.y * 5. + uFlood.y * 1.1) + .10 * sin(aSL.y * 11. - uFlood.y * 2.3));      // the front stands up as a lumpy rolling wall
  float h = body * (1. - .35 * smoothstep(8., 70., b)) + .5 * roll;
  float wav = floodWave(sx, aSL.y, uFlood.y).x * body * mix(1., .2, sheet);
  float upW = mix(uFlood.z, uFlood.w, sheet) * (aSL.z * h + wav * min(1., aSL.z * 3.));
  // ahead of the bore a shallow tongue of the same water runs out over the bed for thirty metres, its edge ragged
  float bt = uFlood.x + 30. + 8. * sin(aSL.y * 5. + uFlood.y * .5) + 4. * sin(aSL.y * 11. - uFlood.y * .9 + 2.) - sx;
  float film = smoothstep(0., 4., bt) * (1. - sheet) * step(aTan.z, 1.0) * step(.3, aSL.z) * smoothstep(.85, 1., uFlood.z);
  film *= 1. - smoothstep(-.07, .07, aSL.y - (.50 + .20 * sin(sx * .13) + .10 * sin(sx * .37 + 1.)));       // it leaves bars of the bed dry along its outer side
  float upF = film * (aTan.z + .07 + .03 * sin(sx * 2.3 - uFlood.y * 5. + aSL.y * 9.));
  float up = max(upW, upF);
  p.y += up - (1. - step(.012, up)) * .9;                                           // parked under the ground until the water comes
  vDF = vec2(mix(upW - aTan.z, 1., sheet), film);
  vSL = vec3(sx, aSL.y, sheet); vB = b; vW = p; vTan = aTan.xy;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLOOD_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec4 uFlood;
varying vec3 vSL, vW; varying float vB; varying vec2 vTan, vDF;
${FLOOD_WAVE}
void main() {
  float sheet = vSL.z, gate = mix(uFlood.z, uFlood.w, sheet);
  float wetb = smoothstep(0., .3, vDF.x);                               // 1 in the bore's own water, 0 on the shallow tongue ahead of it
  if (gate < .02 || (wetb < .01 && vDF.y < .04)) discard;
  float key = keyAt(vW);
  float t = uFlood.y, adv = vSL.x - t * 7.;                             // the surface travels with the water, faster than the front it feeds
  float flow = vnoise(vec2(vSL.y * 6., adv * .30)) * .6 + vnoise(vec2(vSL.y * 14., adv * .8)) * .4;
  vec3 wv = floodWave(vSL.x, vSL.y, t);
  float churn = vnoise(vec2(vSL.y * 22. + flow * 2., adv * 1.1)) * .5 + vnoise(vec2(vSL.y * 55., adv * 2.7)) * .3 + vnoise(vec2(vSL.y * 140., adv * 6.5)) * .2;
  float lines = smoothstep(.62, .80, vnoise(vec2(vSL.y * 20. + vnoise(vec2(adv * .12, vSL.y * 3.)) * 3., adv * .07)));      // foam drawn out in long lines down the current
  float edge = smoothstep(.66, .9, abs(vSL.y));
  float front = (1. - smoothstep(1.2, 7., vB)) * smoothstep(-.3, .5, vB) * wetb;
  // cream foam: the torn rolling front with the mud boiling up through it, the breaking crests of the standing waves, the banks, the streaks
  float foam = front * smoothstep(.27, .52, churn + .42 * (1. - smoothstep(0., 3.5, vB)))
             + smoothstep(.44, .60, wv.x) * smoothstep(.50, .70, churn + .25 * flow) * smoothstep(.38, .62, vnoise(vec2(vSL.y * 7. + 3., adv * .23))) * .75 * wetb * (1. - sheet)
             + edge * .4 * smoothstep(.45, .7, flow) * wetb + lines * .26 * smoothstep(.45, .7, churn) * wetb * (1. - smoothstep(20., 90., vB) * .6)
             + lines * .30 * (1. - wetb) * smoothstep(.3, .9, vDF.y);
  foam = clamp(foam * mix(1., .5, sheet), 0., 1.);
  vec3 V = normalize(uCam - vW + vec3(0., 1e-4, 0.));
  float rip = vnoise(vec2(vSL.y * 34., adv * 1.9));
  vec2 sl = vec2(wv.y, wv.z / 16.) * (mix(1., .2, sheet) * wetb) + vec2((flow - .5) * .5 + (churn - .5) * .8 * foam, (rip - .5) * .6);
  vec2 rt = vec2(-vTan.y, vTan.x);
  vec3 n = normalize(vec3(-vTan.x * sl.x - rt.x * sl.y, 1., -vTan.y * sl.x - rt.y * sl.y));
  float ndl = max(dot(n, uSun), 0.);
  vec3 mud = vec3(.24, .085, .045) * (.55 + .5 * flow) * mix(.66, 1., wetb);            // thick red-brown water, darker and redder than its banks
  vec3 col = mix(mud, vec3(.66, .53, .41) * (.52 + .46 * churn) * (.72 + .28 * smoothstep(.4, 2.6, vB)), foam) * (uSkyCol * (.55 + .40 * n.y) + uSunCol * (key * (ndl * .9 + .12 * foam)) + vec3(.04, .03, .02));
  float fr = 1. - max(dot(n, V), 0.); fr = fr * fr; fr = fr * fr;
  col = mix(col, uSkyCol, (fr * .46 + .10 * smoothstep(.55, .95, vSL.y)) * (1. - foam));      // the sky lies on it, most along the near bank
  vec3 hv = normalize(uSun + V + vec3(0., 1e-3, 0.));
  col += uSunCol * (key * pow(max(dot(n, hv), 1e-4), 46.) * 1.6 * (1. - .7 * foam));       // the wave faces catch the sun
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}`;

// rain as crisp slanting streaks that hang in a few leaning shafts with clear air between them, on every one of five shells
// round the eye (the nearest too). A streak is one thin bright line, a pixel and a half wide at any distance. It shows where
// it crosses the dark storm sky; over lit ground and over the animals it all but vanishes, and against the Ribbon's rock it thins
// to almost nothing (the eye's own ray is walked out over the Ribbon's height map: where it ends in rock the streak in front of
// it is all but put out), so every bed behind keeps its colour and no streak reads as passing through the face. When the sun
// breaks in, the drops catch it as short sparks: the light is in the drops and on the rock, never a pane standing in the air.
// aShell = radius, half height, 0 (nearest) .. 1 (farthest)
const VEIL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aShell;
uniform vec3 uEye;
varying vec3 vWp, vSh, vCyl;
void main() {
  vec3 p = uEye + vec3(position.x * aShell.x, position.y * aShell.y, position.z * aShell.x);
  vWp = p; vSh = aShell; vCyl = position;
  vec4 mvPosition = viewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VEIL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_COMMON}
uniform vec4 uVeilK;      // amount, how much sun reaches us, lean, unused
uniform vec3 uEye;
varying vec3 vWp, vSh, vCyl;
float pn(vec2 p, float per) {       // value noise that closes on itself round the shell
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float x0 = mod(i.x, per), x1 = mod(i.x + 1., per);
  return mix(mix(hash21(vec2(x0, i.y)), hash21(vec2(x1, i.y)), f.x), mix(hash21(vec2(x0, i.y + 1.)), hash21(vec2(x1, i.y + 1.)), f.x), f.y);
}
void main() {
  float R = vSh.x, k = vSh.z;
  float ang = atan(vCyl.z, vCyl.x + 1e-5) / 6.28318 + .5;
  float per = 8. * floor(mix(30., 52., k)), cellH = R * mix(.24, .15, k);
  float leanA = vWp.y * uVeilK.z / (6.28318 * R);              // the lean, in turns of the shell
  float qx = (ang + leanA) * per;
  float fwx = min(fwidth(qx), 1.);                              // (the seam of the shell is one bad pixel wide: clamp it)
  float col = floor(qx), fx = fract(qx);
  float hc = hash21(vec2(mod(col, per), k * 17. + 3.));
  float y = (vWp.y + uTime * mix(11., 34., k) * (.8 + .4 * hc)) / cellH + hc * 7.;
  float row = floor(y), fy = fract(y);
  float h1 = hash21(vec2(mod(col, per) + 31., row)), h2 = hash21(vec2(row + 5., mod(col, per)));
  // one streak a cell: where it stands in its column, how long it is, whether it is there at all
  float cx = .2 + .6 * h2, len = mix(.55, .95, h1);
  float dpx = abs(fx - cx) / max(fwx, 1e-4);
  float line = (1. - smoothstep(.55, 1.25, dpx)) * (1. - step(.6, fwx));
  float seg = smoothstep(0., .12, fy) * (1. - smoothstep(len - .25, len, fy));
  float there = step(mix(.60, .30, k), h1 * .5 + hc * .5);
  // shafts: thirteen places round the horizon where rain may hang, a third of them filled; they lean with the streaks and
  // stand in the same quarter of the sky on every shell, so the rain reads as three or four columns with clear air between
  float sa = (ang + leanA) * 13. + uTime * .004;
  float shaft = smoothstep(.50, .64, pn(vec2(sa + k * .23, 2.5), 13.) * .82 + pn(vec2(sa * 3. + k * 1.3, 7.5), 39.) * .18);
  // where a streak shows: against the sky, and most against the dark of the storm (down the wet line's own heading)
  vec3 d = normalize(vWp - uEye + vec3(0., 1e-4, 0.));
  float up = smoothstep(.015, .19, d.y);
  float side = .34 + .66 * smoothstep(-.4, .5, dot(d.xz / max(length(d.xz), 1e-3), uWetDir));
  float vis = mix(.09, 1., up * side);
  float edge = 1. - smoothstep(.55, 1., abs(vCyl.y));
  float sun = uVeilK.y * keyAt(vWp);
  float spark = line * there * smoothstep(0., .04, fy) * (1. - smoothstep(.07, .16, fy)) * step(.6, h2) * sun * mix(1., .55, k) * uVeilK.x;
  float body = line * seg * there * mix(.36, .26, k);
  if (uVeilK.x * edge * shaft * (body + .05 * k * up * side + .45 * spark) < .004) discard;
  // does the eye's ray through this streak end in the Ribbon's rock? (the hero walks it out over its own height map)
  float rock = rockBehind(uEye, d);
  spark *= mix(1., .15, rock * smoothstep(.15, .55, k));      // (a lit drop far off is a streak metres long: against the rock it would read as rain passing through the face)
  vis *= mix(1., .10, rock);
  float a = uVeilK.x * edge * shaft * (body * vis + .05 * k * up * side * (1. - rock) + .45 * spark);
  if (a < .004) discard;
  float key = keyAt(vWp) * (.35 + .65 * uVeilK.y);
  vec3 colr = uSkyCol * mix(1.15, .9, k) + uSunCol * (key * (.10 + .30 * line * seg) + 2.6 * spark);
  gl_FragColor = vec4(max(colr, vec3(0.)), min(a, .5));
  #include <fog_fragment>
}`;
// the break in the storm: a ragged bright tear in the cloud up-sun, on one far shell about the eye. It throws no shafts: after the
// break the light is on the soaked rock and in the lit drops
const BREAK_VS = /* glsl */`
uniform float uRad;
varying vec3 vD;
void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(position * uRad + cameraPosition, 1.); }`;
const BREAK_FS = /* glsl */`
uniform vec3 uBrkDir, uBrkCol;
uniform vec4 uBrk;        // unused, strength of the tear, time, unused
varying vec3 vD;
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
  vec3 hd = normalize(vec3(-uBrkDir.z, 0., uBrkDir.x)), vd = cross(hd, uBrkDir);
  vec3 dd = d - uBrkDir;
  float dh = dot(dd, hd), dv = dot(dd, vd);
  float rag = vnoise(vec2(dh, dv) * 14. + 2.) * .6 + vnoise(vec2(dh, dv) * 37. + vec2(uBrk.z * .01, 0.)) * .4;
  float shape = exp(-dh * dh / .05 - dv * dv / .006);
  float tear = smoothstep(.30, .62, shape * (.55 + .9 * rag)) * step(0., dot(d, uBrkDir));
  float halo = exp(-dh * dh / .16 - dv * dv / .03) * step(0., dot(d, uBrkDir));
  gl_FragColor = vec4(max(uBrkCol * (uBrk.y * (tear + .22 * halo)), vec3(0.)), 1.);
}`;
// after the cloud's edge has gone over us: where the eye looks down the storm's heading it finds the dark curtain leaving, and under
// the cloud base torn shreds of scud lit gold by the sun behind us (no shafts: none could be made to read as light). One shell about the
// eye, beyond the Ribbon and the fins (they hide it), written premultiplied: it darkens with its curtain and adds its light
const AFTER_VS = /* glsl */`
uniform float uRad;
varying vec3 vD;
void main() { vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(position * uRad + cameraPosition, 1.); }`;
const AFTER_FS = /* glsl */`
uniform vec3 uCur, uGold, uSlate, uDark, uAxis;
uniform vec4 uAft;        // unused, shreds, curtain, time
varying vec3 vD;
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float shredBody(vec2 q) { return vnoise(q) * .58 + vnoise(q * 2.1 + 7.) * .26; }
void main() {
  vec3 d = normalize(vD + vec3(0., 1e-5, 0.));
  float el = d.y, t = uAft.w;
  if (el < -.05 || uAft.y + uAft.z < .004) discard;
  vec2 hz = d.xz / max(length(d.xz), 1e-3);
  float ang = atan(hz.x * uCur.z - hz.y * uCur.x, dot(hz, uCur.xz) + 1e-5);        // bearing from the middle of the curtain
  // the curtain: a dark body hung from the cloud base, combed into leaning streaks; its feet are ragged virga that stop short of
  // the ground, so the lit basin shows pale under it
  float inC = 1. - smoothstep(.46, .86, abs(ang) + (vnoise(vec2(ang * 2.3 + 5., 1.5)) - .5) * .3);
  float sx = ang * 46. + el * 20.;
  float streak = vnoise(vec2(sx, el * 3. + t * .05)) * .6 + vnoise(vec2(sx * 2.9, el * 7. + t * .11)) * .4;
  float foot = -.012 + .06 * vnoise(vec2(ang * 9., 3.)) + .05 * streak;
  float topE = .42 + .16 * vnoise(vec2(ang * 3.1, 7.));
  float bodyC = inC * smoothstep(foot, foot + .06, el) * (1. - smoothstep(topE * .5, topE, el));
  float aC = bodyC * (.62 + .38 * smoothstep(.25, .7, streak)) * .88 * uAft.z;
  vec3 curC = uDark * (1. + .55 * smoothstep(.55, .85, streak));
  // the shreds: torn scud under the cloud base, small and soft, drifting. Laid out by bearing and height, not on a level sheet seen
  // in perspective (that drew every shred out ten to one toward the horizon and fanned them all from one point): a shred is a few
  // degrees across wherever it hangs. Its body is two broad octaves, so it is a soft mass and never a curl; two finer ones only fray
  // its edge. It is shaded across its whole body, gold on the side turned to the low sun and grey on the far side and beneath:
  // never a bright outline round a body the colour of the sky behind it
  vec2 q = vec2(ang * 5.4 + t * .010, el * 13.);
  q += (vec2(vnoise(q * .8 + 11.), vnoise(q * .8 + 37.)) - .5) * .5;
  vec2 sh2 = -uAxis.xz / max(length(uAxis.xz), 1e-3);                                // toward the sun, along the ground
  float sunA = sin(atan(sh2.x * uCur.z - sh2.y * uCur.x, dot(sh2, uCur.xz) + 1e-5) - ang);
  vec2 toS = vec2(sunA, .5) / max(length(vec2(sunA, .5)), 1e-3);                     // the low sun lights a shred from its sunward side and a little from above
  float clump = (vnoise(vec2(ang * 1.7 + 3., el * 3.1)) - .5) * .24;
  float body = shredBody(q), bodyS = shredBody(q + toS * .40);
  float n = body + vnoise(q * 4.9 + 3.) * .11 + vnoise(q * 10.3 + 1.) * .05 + clump;
  float mask = smoothstep(.035, .10, el) * (1. - smoothstep(.30, .56, el)) * smoothstep(-.6, .3, dot(hz, uCur.xz));
  float dens = smoothstep(.60, .86, n);
  float aS = dens * mask * uAft.y * .80;
  float lit = smoothstep(.30, .80, clamp((body - bodyS) * 2.4 + .46, 0., 1.));
  vec3 shred = mix(uSlate * (1.02 + .22 * dens), uGold * vec3(1.04, .86, .60) * .50, lit);
  vec3 rgb = shred * aS + curC * (aC * (1. - aS));
  gl_FragColor = vec4(max(rgb, vec3(0.)), clamp(aS + aC * (1. - aS), 0., 1.));
}`;
// the light of the exit ring in the wet air between the fins: a soft glow round it, never over the opening itself and never a fan of shafts
const HALO_VS = /* glsl */`
uniform vec4 uHalo;       // centre xyz, half size
varying vec2 vUv;
void main() {
  vUv = position.xy;
  vec4 mv = viewMatrix * vec4(uHalo.xyz, 1.);
  mv.xy += position.xy * uHalo.w;
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FS = /* glsl */`
uniform vec4 uHaloK;      // strength, size in ring radii, time, how far below the centre the floor lies (in ring radii)
uniform vec3 uHaloCol;
varying vec2 vUv;
float hash21(vec2 p) { p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  float r = length(vUv) * uHaloK.y;
  if (r < 1.02 || r > uHaloK.y) discard;
  vec2 dir = vUv / max(length(vUv), 1e-4);
  float x = r - 1.;
  float glow = exp(-x * 2.1) * .50 + exp(-x * .62) * .15;
  float rn = vnoise(dir * 2.1 + vec2(uHaloK.z * .07, 7.));
  glow *= .86 + .28 * rn;                                    // the wet air is not even: the glow breathes, it has no rays
  float fade = (1. - smoothstep(uHaloK.y * .72, uHaloK.y, r)) * smoothstep(1.02, 1.12, r);
  float below = mix(.35, 1., smoothstep(-uHaloK.w - .25, -uHaloK.w + .05, vUv.y * uHaloK.y));      // under the floor line only its sheen on the wet clay
  gl_FragColor = vec4(max(uHaloCol * (glow * fade * below * uHaloK.x), vec3(0.)), 1.);
}`;

const LOOKS = {
  evening: { elev: 16, fog: '#b7bdb9', fogStorm: '#6d7880', dens: 0.00058, sky: { preset: 'goldenHour', zenith: '#2c5f86', mid: '#6fa2aa', horizon: '#dfd3b8', ground: '#8f8672', scatterColor: '#ffcf96', scatter: 0.55, sunColor: '#ffd9a0', sunIntensity: 11, clouds: { coverage: 0.4, softness: 0.26, lit: '#f6e8cf', shade: '#566a86', wind: [0.034, 0.011], detail: 0.8 }, clouds2: { opacity: 0.25 } }, storm: { zenith: '#232d38', mid: '#36434e', horizon: '#8f918a', scatterColor: '#e9bf80', scatter: 0.9 }, exposure: 1.0 },
  golden: { elev: 8, fog: '#c9b4a2', fogStorm: '#6e6c82', dens: 0.00054, sky: { preset: 'sunset', zenith: '#24406e', mid: '#7a7fa6', horizon: '#f0b888', ground: '#7d6a66', scatterColor: '#ff9a4a', scatter: 0.8, sunColor: '#ffb468', sunIntensity: 11, clouds: { coverage: 0.42, softness: 0.26, lit: '#ffc890', shade: '#5a5488', wind: [0.03, 0.01] }, clouds2: { stretch: 0.2, softness: 0.62, detail: 0.05, scale: 0.34, opacity: 0.2, coverage: 0.42, silver: 0.2, absorb: 0.3, lit: '#e9b79c', shade: '#7c6690' } }, storm: { zenith: '#1c1d36', mid: '#35345a', horizon: '#a8848a', horizonPow: 6, scatterColor: '#ff9248', scatter: 1.1 }, exposure: 1.02 },
  day: { elev: 35, fog: '#bcc8cc', fogStorm: '#7a858c', dens: 0.0005, sky: { preset: 'day', zenith: '#2b68a8', mid: '#74a8cc', horizon: '#d3dcd6', sunColor: '#fff2da', clouds: { coverage: 0.36, softness: 0.22, scale: 1.5, lit: '#f8f4ea', shade: '#6f82a0', wind: [0.045, 0.014], detail: 0.9 }, clouds2: { opacity: 0.2 } }, storm: { zenith: '#2a343e', mid: '#44525c', horizon: '#8d979a', scatterColor: '#e8e2cc', scatter: 0.6 }, exposure: 0.95 },
  dawn: { elev: 9, fog: '#c9b4b4', fogStorm: '#c9b4b4', dens: 0.0009, sky: { preset: 'dawn', sunColor: '#ffb9a0', clouds: { coverage: 0.34, softness: 0.3, wind: [0.018, 0.006] } }, storm: null, exposure: 1.0 },
  night: { elev: 30, fog: '#2a3a5c', fogStorm: '#1c2840', dens: 0.0006, sky: { preset: 'night', clouds: { coverage: 0.38, softness: 0.3, lit: '#9fb2e0', shade: '#22305a', wind: [0.03, 0.01] } }, storm: { zenith: '#0e1626', mid: '#18243a', horizon: '#2e4060', scatterColor: '#8ea4d8', scatter: 0.6 }, exposure: 1.32 },
};

export default {
  id: 'painted-ridges', name: 'The Painted Ridges', category: 'wilderness', weirdness: 0.1, media: ['open'],
  async build(ctx) {
    const { rng, noise: N } = ctx;
    const detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const scene = new THREE.Scene();

    // ---------------- which evening is it
    const vr = rng.fork('look'), roll = vr(), castRoll = vr(), sakerRoll = vr();
    let hour = 'evening', snow = false, spring = false;
    if (vary.hour === 'dawn' || vary.hour === 'night' || vary.hour === 'golden') hour = vary.hour;
    else if (vary.hour === 'day') { hour = 'day'; spring = true; }
    else if (roll < 0.26 || (roll >= 0.44 && roll < 0.60)) hour = 'evening';
    else if (roll < 0.44) hour = 'golden';
    else if (roll < 0.80) { hour = 'day'; spring = true; }              // May: washes flushed green, newborn foals
    else { hour = 'evening'; snow = true; }                           // an October snow squall
    const cast = castRoll < 0.3 ? 'bachelors' : castRoll >= 0.6 && castRoll < 0.85 ? 'khulan' : 'none';
    const saker = sakerRoll > 0.7;
    const LK = LOOKS[hour];
    const el = LK.elev * Math.PI / 180, east = hour === 'dawn' ? -1 : 1;
    const sunDir = new THREE.Vector3(-Math.sin(1.222) * Math.cos(el) * east, Math.sin(el), Math.cos(1.222) * Math.cos(el)).normalize();

    // ---------------- the Ribbon
    const RING = 135;                                                   // the ring stands this far out from the crest line on the gap axis
    const hero = await buildHero(ctx, { palette: PAL, hour, weather: snow ? 'snow' : 'shower', sunDir, ringT: RING });
    scene.add(hero.object);
    const U = hero.uniforms;
    U.uLand.value.x = spring ? 1 : 0; U.uLand.value.y = 1;
    await ctx.yield();

    // ---------------- the path: wash, spur ramp, the Knife, the drop, the gap
    const A = hero.anchors, seat = A.portalSeat.position, ax = A.gap.axis;
    const onAxis = (t) => [seat.x + ax.x * t, seat.z + ax.z * t];
    const gapPt = (t, lat) => [seat.x + ax.x * t + ax.z * lat, seat.z + ax.z * t - ax.x * lat];      // along the gap axis toward its mouth, across it toward the east fin
    const A255 = onAxis(255);
    const bendA = rng.range(4, 7.5), bendB = rng.range(3.5, 6.5);
    // The wash and the Knife run straight at the Ribbon's high middle, so it stands dead ahead and grows over us; in the
    // saddle the crest swings right and runs east along the foot of the face, 100 m off it and with the sun square behind
    // (the storm leaves over the gap ahead), then turns in to the gap's mouth
    const DEG = Math.PI / 180, hG = Math.atan2(-ax.x, ax.z);            // the gap's heading, east of north
    const back = (p, len, th) => [p[0] - Math.sin(th) * len, p[1] + Math.cos(th) * len];
    const KE = gapPt(436 + bendA, -64 - bendB + 5), K3 = back(KE, 55, hG + 37 * DEG), K2 = back(K3, 55, hG + 43 * DEG), K1 = back(K2, 60, hG + 10 * DEG);
    const hK = hG - 22 * DEG, KM = back(K1, 36, hK + 7 * DEG);
    const TO = back(KM, 36, hK), R3 = back(TO, 42, hK + 12 * DEG), R2 = back(R3, 46, hK + 25 * DEG), R1 = back(R2, 44, hK + 14 * DEG);
    const H0 = hK - 8 * DEG, W1 = back(R1, 56, H0 + 3 * DEG), W0 = back(W1, 66, H0);
    const ctrl = [W0, W1, R1, R2, R3, TO, KM, K1, K2, K3, KE, gapPt(348, -17), gapPt(304, -3), A255, onAxis(210), onAxis(172), onAxis(RING)];
    const P0 = makePath(ctrl.map((c) => [c[0], 0, c[1]]));
    await ctx.yield();
    const L0 = P0.length, dM = L0 - (250 - RING), dTO = P0.nearestXZ(TO[0], TO[1]).u * L0, dR1 = dTO - 4, dR0 = dR1 - 146, dK1 = dM - 150, dSad = 0.47 * L0;
    const ease = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return 0.35 * t + 0.65 * t * t * (3 - 2 * t); };
    const groundProfile = (d) => {
      const top = 39.6 - 5 * ss(dR1 + 80, dK1, d) + 1.5 * Math.sin((d - dR1) / 48) * ss(dR1, dR1 + 30, d) * (1 - ss(dK1 - 30, dK1, d)) - 6.0 * bell4(d, dSad - 80, dSad - 20, dSad + 10, dSad + 74);      // the saddle: we swing down among the mares and climb out with the file on the skyline
      return 0.35 + top * ss(dR0, dR1, d) * (1 - ease(dK1, dM, d));
    };
    const pts = [], tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    const nP = Math.ceil(L0 / 12);
    for (let k = 0; k <= nP; k++) { const d = (k / nP) * L0; P0.posAtDist(d, tmp); pts.push([tmp.x, groundProfile(d) + EYE, tmp.z]); }
    await ctx.yield();
    const path = makePath(pts);
    const L = path.length;
    await ctx.yield();

    // ---------------- path table: one row every 1.5 m from 81 m before the entry to 60 m past the ring
    const DS = 1.5, S0 = -81, NR = Math.ceil((L + 141) / DS) + 1, I0 = 54;
    const PX = new Float32Array(NR), PY = new Float32Array(NR), PZ = new Float32Array(NR), TX = new Float32Array(NR), TZ = new Float32Array(NR), PD = new Float32Array(NR);
    for (let i = 0; i < NR; i++) {
      const s = S0 + i * DS;
      path.posAtDist(s, tmp); path.tangentAtDist(s, tmp2);
      const tl = Math.hypot(tmp2.x, tmp2.z) || 1;
      PX[i] = tmp.x; PY[i] = tmp.y - EYE; PZ[i] = tmp.z; TX[i] = tmp2.x / tl; TZ[i] = tmp2.z / tl;
      if ((i & 7) === 7) await ctx.yield();
    }
    PD[I0] = 0;
    for (let i = I0 + 1; i < NR; i++) PD[i] = PD[i - 1] + Math.hypot(PX[i] - PX[i - 1], PZ[i] - PZ[i - 1]);
    for (let i = I0 - 1; i >= 0; i--) PD[i] = PD[i + 1] - Math.hypot(PX[i] - PX[i + 1], PZ[i] - PZ[i + 1]);
    // rideable half width of the crest, left and right of the axis
    const hwBase = (d) => lerp(lerp(lerp(14, 8.4, ss(dR0 + 10, dR0 + 62, d)), 3.7, ss(dR1 - 58, dR1 - 12, d)), 9, ss(dM - 70, dM - 10, d));
    const WL = new Float32Array(NR), WR = new Float32Array(NR);
    for (let i = 0; i < NR; i++) {
      const d = PD[i], b = hwBase(d);
      const sRow = S0 + i * DS;
      WL[i] = b + Math.max(5.2 * bell4(d, dSad - 150, dSad - 105, dSad + 60, dSad + 94) * (1 - ss(dM - 70, dM - 10, d)), 7.5 * bell4(sRow, 0.25 * L - 14, 0.25 * L - 2, 0.25 * L + 14, 0.25 * L + 26));
      WR[i] = b + 4.6 * bell4(d, dSad - 14, dSad + 8, dM - 60, dM - 15);
    }
    const rowOf = (s) => clamp((s - S0) / DS, 0, NR - 1.001);

    // ---------------- the land as a function
    const o1 = rng.range(0, 500), o2 = rng.range(0, 500), lamF = rng.range(17, 23);
    let bFloor = 0, bCuesta = 0;
    const basin = (x, z) => {
      bFloor = 1.3 + 1.5 * N.fbm2(x / 190 + o1, z / 190, 2);
      const zc = z + 70 * N.n2(x / 520 + o2, z / 760);
      const q = zc / 210, k = Math.floor(q), t = q - k;
      const amp = Math.max(0, N.n2(x / 360 + k * 3.71, k * 1.37 + o1) * 1.3 + 0.4) * 26 * (1 + 2.4 * ss(900, 2300, Math.hypot(x - 150, z - 450)));
      const pr = t < 0.6 ? Math.pow(ss(0, 0.6, t), 1.2) : t < 0.78 ? 1 - ss(0.6, 0.78, t) : 0;
      const fl = 1 - Math.min(1, Math.abs(N.n2(x / 26 + o2, zc / 240)) * 2.3);
      bCuesta = amp * pr * (1 - 0.28 * fl * Math.sqrt(fl));
    };
    // bed hardness of the land at a point (the hero's strata table, read at the land's thinner bed scale)
    // (away from the Ribbon the land is another limb of the fold: its beds dip the other way, so that the west-facing wall of the
    // Wing, the spur we climb and the ground under the hooves all cut across them and are ruled in thin colour)
    const stD = hero.strata.texture.image.data, stN = hero.strata.texture.image.width, nbH = hero.strata.nBed, nbL = new THREE.Vector3(0.50, 0.42, -0.76).normalize(), LAND_BEDS = 3.1;
    U.uLandBed.value.copy(nbL);
    const hardOf = (nb, x, y, z) => {
      let fi = (((nb.x * x + nb.y * y + nb.z * z) * LAND_BEDS - hero.strata.b0) / hero.strata.span) * stN; fi -= Math.floor(fi / stN) * stN;
      const i0 = fi | 0;
      return (stD[i0 * 4 + 3] * 2 + stD[((i0 + 1) % stN) * 4 + 3] + stD[((i0 + stN - 1) % stN) * 4 + 3]) / 1020;
    };
    const hardLand = (x, y, z) => {
      const k = 1 - ss(-90, -10, Math.min(x + 520, 520 - x, z + 170, 350 - z));
      return k >= 1 ? hardOf(nbL, x, y, z) : k <= 0 ? hardOf(nbH, x, y, z) : lerp(hardOf(nbH, x, y, z), hardOf(nbL, x, y, z), k);
    };
    U.uLand.value.w = LAND_BEDS;
    // the hardness of the beds the Wing's wall shows (the table read at 1.9 times the land's own scale, as its shader reads it),
    // smoothed over a metre of section: the wall swells at every hard bed and falls back at every soft one without a step
    const softM = new Float32Array(stN);
    for (let i = 0; i < stN; i++) { let a = 0; for (let k = -5; k <= 5; k++) a += stD[((i + k + stN) % stN) * 4 + 3] * (6 - Math.abs(k)); softM[i] = a / (36 * 255); }
    const hardM = (x, y, z) => {
      let fi = (((nbL.x * x + nbL.y * y + nbL.z * z) * LAND_BEDS * 1.9 + 91 - hero.strata.b0) / hero.strata.span) * stN; fi -= Math.floor(fi / stN) * stN;
      const i0 = Math.min(stN - 1, fi | 0);
      return lerp(softM[i0], softM[(i0 + 1) % stN], fi - i0);
    };
    // THE WING: a painted hogback along the right of the wash and of the ramp, its sunlit wall of cut beds turned to us from the
    // first frame. Its toe keeps to the edge of the wash, comes down to the path as a buttress where the gazelles lie up, and the
    // ramp climbs along its foot; it ends in a shoulder just short of the top-out, so the Knife runs free.
    const pwl = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let k = 1; k < pts.length; k++) if (x < pts[k][0]) return lerp(pts[k - 1][1], pts[k][1], ss(pts[k - 1][0], pts[k][0], x)); return pts[pts.length - 1][1]; };
    const WING_CA = [[-70, 34], [30, 45], [96, 53], [170, 61], [dR1 - 42, 63], [dR1 + 4, 47], [dR1 + 30, 40]];
    const wingK = (d) => 1 - ss(dR1 + 2, dR1 + 30, d);
    const wingNose = (d) => bell4(d, 64, 84, 104, 124);
    const wingToe = (d, wr) => Math.min(lerp(15.5, 12.6, wingNose(d)), wr + 2.6);
    // the Wing's wall is cut rock: a plain face, every bed drawn on it as one band with its ledge, and a gully every 17 m that
    // runs down it a little aslant with a narrow shaded floor (a rill between each pair, on the upper wall only).
    // wingCut fills WGC with [how far a point lies in a main gully's floor 0..1, metres cut out of the wall there]
    const WGUL = 17, WGC = [0, 0];
    const wgSun = sunDir.x * TX[Math.min(NR - 1, 100)] + sunDir.z * TZ[Math.min(NR - 1, 100)] >= 0 ? 1 : -1;      // which wall of a gully looks away from the sun
    const wingCut = (d, t0, t) => {
      const env = ss(0.02, 0.15, t) * (1 - 0.5 * ss(0.84, 1, t));
      const q = (d + 0.15 * t0 + 4 * N.n2(d / 55, 3.3) + 2 * N.n2(t0 / 16, d / 90 + 5)) / WGUL, id = Math.floor(q), sg = (q - id - 0.5) * WGUL, s = Math.abs(sg);
      let hk = Math.sin(id * 127.1 + 3.7) * 43758.5453; hk -= Math.floor(hk);
      let hb = Math.sin(id * 269.5 + 1.3) * 43758.5453; hb -= Math.floor(hb);
      const big = hb > 0.3 ? 1 : 0.5;                       // one in three is a lesser gully
      const fl = 1 - ss(0.7 + 0.5 * hk, 3.6 + 1.2 * hk, s);
      // raking light: the wall that looks away from the sun lies in shade from the floor to its lip
      const shd = ss(-1.2, 0.3, sg * wgSun) * (1 - ss(2.4 + 1.0 * hk, 4.6 + 1.2 * hk, sg * wgSun));
      const q2 = q + 0.5, s2 = Math.abs(q2 - Math.floor(q2) - 0.5) * WGUL;
      const minor = (1 - ss(0.3, 2.0, s2)) * ss(0.3, 0.6, t) * (1 - 0.5 * ss(0.85, 1, t));
      WGC[0] = Math.max(fl, 0.85 * shd) * env * (0.5 + 0.5 * big); WGC[1] = (5.0 + 2.6 * hk) * big * env * fl + 1.2 * minor;
    };
    const wingGul = (d, g, a, wr) => {
      const wk = wingK(d), t0 = a - wingToe(d, wr);
      if (wk <= 0 || t0 <= 0) return 0;
      const ca = pwl(d, WING_CA) * (1 + 0.07 * N.n2(d / 70, 7.7)) + 2.4 * Math.abs(N.n2(d / 11, 3.1));
      const rise = Math.max(5, ca - g), t = t0 * (0.88 + 0.32 * wingNose(d)) / rise;
      if (t >= 1) return 0;
      wingCut(d, t0, t);
      return wk * WGC[0];
    };
    // height at path coordinates: d along (plan metres), g path ground there, lat to the right; (x, z) the same point
    // on a flash-flood visit a wash runs along the Knife's left flank where the first bench would be: 6 m under the crest,
    // 24 m wide behind a low outer rib, in plain view from the saddle
    const chan = !!vary.rare, chanW = (d) => chan ? ss(0.50 * L, 0.56 * L, d) * (1 - ss(0.775 * L, 0.82 * L, d)) : 0;
    const prof = (d, g, lat, x, z, wl, wr) => {
      const right = lat > 0, a = Math.abs(lat), e = a - (right ? wr : wl), wkR = right ? wingK(d) : 0;
      let kn, wc = 0;
      // (the rideable ground is bedrock: beyond a stride from our own line every harder bed stands a hand proud)
      if (e <= 0) kn = g + 0.07 * N.n2(x / 5, z / 5) * Math.min(1, a / 3) + (hardLand(x, g, z) - 0.5) * 0.38 * ss(1.7, 3.6, a) * ss(dR0 + 10, dR0 + 60, d) * (1 - ss(dM - 90, dM - 40, d));
      else {
        let drop;
        if (e < 7) drop = 6 * ss(0, 7, e); else if (e < 16) drop = 6 + 0.06 * (e - 7); else if (e < 24) drop = 6.54 + 0.9 * (e - 16);
        else if (e < 34) drop = 13.74 + 0.05 * (e - 24); else drop = 14.24 + 0.8 * (e - 34);
        const c = 1 - Math.min(1, Math.abs(N.n2(d / lamF + (right ? 40 : 0), e / 170)) * 2.3);
        const fl = 1.1 * ss(0.5, 3, e) * (1 - ss(5, 7, e)) + 2.0 * ss(16.5, 19, e) * (1 - ss(21.5, 24, e)) + 6 * ss(34, 56, e);
        kn = g - drop - fl * c * Math.sqrt(c) + 0.12 * N.n2(x / 6, z / 6);
        wc = right ? 0 : chanW(d);
        if (wc > 0) {
          const ew = e + 1.7 * Math.sin(d * 0.071) + 1.0 * Math.sin(d * 0.19 + 2);      // the far bank wanders by a metre or two
          const cd = e < 6 ? 6.4 * ss(0, 6, e) : ew < 30 ? 6.4 + 0.02 * (e - 6) : ew < 33 ? 6.88 - 2.0 * ss(30, 33, ew) : 4.88 + 1.1 * (ew - 33);
          const kc = g - Math.min(cd, drop + (ew > 33 ? 0 : 99)) + 0.05 * N.n2(x / 6, z / 6);
          kn = lerp(kn, ew > 33 ? Math.max(kn, kc) : kc, wc);
        }
        if (wkR > 0) kn = lerp(kn, g + 0.1 * N.n2(x / 6, z / 6), wkR);        // under the Wing the ground runs level to its toe
      }
      basin(x, z);
      const ww = 1 - ss(dR0 - 10, dR0 + 75, d);
      let wsh = 0.3 + 0.22 * N.n2(x / 37, z / 37);
      const eb = a - 14;
      if (eb > 0 && ww > 0) {
        // both banks step down ahead of us so that the Ribbon stands whole in the notch of the wash
        const bankH = right ? (16.5 + 5 * N.n2(d / 90 + 9, 3.3)) * (1 - 0.42 * ss(10, 80, d)) * (1 - wkR) : (6.5 + 2.5 * N.n2(d / 90, 3.3)) * (1 - 0.45 * ss(10, 80, d));      // (the sunward bank is the lower: the low sun reaches the floor of the wash)
        const cb = 1 - Math.min(1, Math.abs(N.n2(d / 13 + (right ? 70 : 0), eb / 90)) * 1.7);
        wsh += ww * bankH * ss(0, 22, eb) * (1 - 0.5 * cb * ss(0, 6, eb) * (1 - ss(15, 24, eb)));
      }
      let near = Math.max(wsh, kn);
      // hard beds stand out as ledges on the banks and on the risers between the benches (never where hooves run)
      const lm = Math.max(eb > 0 ? ww * ss(1, 5, eb) * 1.5 * (1 - wkR) : 0, e > 0 && kn > wsh ? 1.2 * (ss(1.5, 4, e) * (1 - ss(4.5, 6.5, e)) + ss(17, 19, e) * (1 - ss(22, 24, e)) + ss(35, 40, e)) : 0);
      if (lm > 0) near += (hardLand(x, near, z) - 0.5) * lm * (1 - wc * (1 - ss(33, 38, e)));
      let out = lerp(near, bFloor + bCuesta * ss(75, 165, a), ss(60, 130, a));
      if (wkR > 0) {
        const t0 = a - wingToe(d, wr);
        if (t0 > 0) {
          const ca = pwl(d, WING_CA) * (1 + 0.07 * N.n2(d / 70, 7.7)) + 2.4 * Math.abs(N.n2(d / 11, 3.1));
          const rise = Math.max(5, ca - g), W = rise / (0.88 + 0.32 * wingNose(d)), t = t0 / W;
          let yw;
          if (t < 1) {
            // (no bed is pushed out of the wall vertex by vertex any more: on a grid that stair-stepped every contact. The beds
            // and their ledges are drawn per pixel; the mesh carries the face, its swell and its gullies)
            wingCut(d, t0, t);
            yw = g + rise * Math.pow(t, 0.82) - WGC[1] + 0.9 * N.n2(d / 23, t0 / 19 + 3) * ss(0.05, 0.3, t);
            // (the wall is not one swell: broad folds 60 m apart run up it a little aslant, so its beds wave along its whole length)
            yw += 2.3 * Math.sin(d / 9.5 + 1.6 * N.n2(d / 70, 5.1) + t0 / 30) * ss(0.08, 0.36, t) * (1 - ss(0.78, 1, t));
            yw += (hardM(x, yw, z) - 0.5) * 1.7 * ss(0.03, 0.18, t) * (1 - ss(0.92, 1, t));
          } else yw = lerp(g + rise, out, ss(0, 80, (t - 1) * W));
          out = Math.max(out, lerp(out, yw, wkR));
        }
      }
      return out;
    };
    const HX0 = -520, HX1 = 520, HZ0 = -170, HZ1 = 350;
    // lay the land over the Ribbon's ragged rim, tuck it under the rest of it, and let the spur run onto its apron
    const withHero = (h, x, z, d, a, g, strip) => {
      const ein = Math.min(x - HX0, HX1 - x, z - HZ0, HZ1 - z);
      if (ein <= 0) return h;
      const spur = (1 - ss(62, 96, a)) * (1 - ss(dM - 25, dM + 5, d));        // (wide enough for the Knife's flank to run out onto the apron on its own slope)
      let out;
      // Away from our own line (far = 1) the basin is ONE floor: the land runs on over all of the Ribbon's low ground and dives under
      // its rock only where that stands up out of the floor, along the foot of the face and of the nose. (It used to dive along a
      // line 45 m inside the footprint's straight edge, whatever stood there: beside the east nose a panel of the hero's own smooth
      // floor showed with ruled edges.) Its own relief runs out into that floor over a ragged 70 m, not over 40 m along the edge.
      const far = strip ? 0 : 1 - ss(0, 0.5, spur);
      const H0 = hero.heightAt(x, z);
      if (far >= 1 && ein > 60 && H0 > 16) return -10;
      // cover the low ragged rim; tuck under everything that stands tall, eroded back from its walls so coarse cells never stand proud of them
      const tuck = lerp(Math.max(ss(38, 56, ein), ss(2, 8, H0 - h)), ss(5.5, 11, H0), far);
      let H = H0;
      if (tuck > 0 && (strip || a < 80 || far > 0)) H = Math.min(H0, hero.heightAt(x - 5, z), hero.heightAt(x + 5, z), hero.heightAt(x, z - 5), hero.heightAt(x, z + 5)) - 1.5;
      // (the strip keeps the run-in's own ground all the way into the mouth: it never sinks under the gap floor before it becomes it)
      const ownNear = h - 60 * ss(0, 40, ein) * (1 - (strip ? 1 - ss(45, 70, a) : spur));
      const own = far > 0 ? lerp(ownNear, h - 60 * ss(4, 74, ein + 20 * N.n2(x / 85 + 3.3, z / 85)), far) : ownNear;
      out = Math.max(lerp(H0 + 0.5 + 0.1 * far, H - 4.5, tuck), own);
      if (strip && H0 < 1.5) out = Math.max(out, H0 + 0.5);            // and never lies in the same plane as the hero's own gap floor
      if (strip) { const can = ss(dM - 25, dM + 5, d); if (can > 0) out = lerp(out, a < 17.6 ? g : lerp(g, Math.min(out, g - 2.5), ss(17.6, 20.5, a)), can); }      // the gap floor runs under the feet of the fins
      return out;
    };
    let nI = 0, nLat = 0;
    const nearest = (x, z) => {
      let best = 1e18, bi = 0;
      for (let i = 0; i < NR; i += 3) { const dx = PX[i] - x, dz = PZ[i] - z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
      const i0 = Math.max(0, bi - 2), i1 = Math.min(NR - 1, bi + 2);
      for (let i = i0; i <= i1; i++) { const dx = PX[i] - x, dz = PZ[i] - z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
      const dx = x - PX[bi], dz = z - PZ[bi], al = dx * TX[bi] + dz * TZ[bi];
      nI = clamp(bi + al / DS, 0, NR - 1.001); nLat = -dx * TZ[bi] + dz * TX[bi];
      return (bi === 0 && al < 0) || (bi === NR - 1 && al > 0) ? Math.sqrt(best) : Math.abs(nLat);
    };
    let lastA = 1e9;
    const landAt = (x, z) => {
      const a = nearest(x, z); lastA = a;
      if (a > 190) { basin(x, z); return withHero(bFloor + bCuesta, x, z, 1e9, 1e9, 0, false); }
      const i = nI | 0, f = nI - i, sg = Math.abs(nLat) < 1e-6 ? 1 : Math.sign(nLat);
      const d = lerp(PD[i], PD[i + 1], f), g = lerp(PY[i], PY[i + 1], f);
      return withHero(prof(d, g, a * sg, x, z, lerp(WL[i], WL[i + 1], f), lerp(WR[i], WR[i + 1], f)), x, z, d, a, g, false);
    };

    // ---------------- ground table in path coordinates (the strip mesh, hooves, shadows and plants all read it)
    const LC = [1.3, 3, 5.2, 6.6, 8.2, 10, 12, 14.5, 16, 17.5, 19.2, 21, 23, 25, 27.5, 30, 33, 36.5, 40], NH = LC.length, NC = NH * 2 + 1;
    const LAT = [...LC.slice().reverse().map((v) => -v), 0, ...LC];
    const HT = new Float32Array(NR * NC);
    for (let i = 0; i < NR; i++) {
      for (let c = 0; c < NC; c++) {
        const lat = LAT[c], x = PX[i] - TZ[i] * lat, z = PZ[i] + TX[i] * lat;
        HT[i * NC + c] = withHero(prof(PD[i], PY[i], lat, x, z, WL[i], WR[i]), x, z, PD[i], Math.abs(lat), PY[i], true);
      }
      await ctx.yield();
    }
    const colOf = (lat) => {
      const a = Math.abs(lat); let f;
      if (a <= LC[0]) f = a / LC[0];
      else { let k = 1; while (k < NH - 1 && a > LC[k]) k++; f = k + Math.min(1, (a - LC[k - 1]) / (LC[k] - LC[k - 1])); }
      return clamp(NH + (lat < 0 ? -f : f), 0, NC - 1.001);
    };
    const groundAt = (s, lat) => {
      const r = rowOf(s), i = r | 0, fr = r - i, c = colOf(lat), j = c | 0, fc = c - j, k = i * NC + j;
      const h0 = HT[k] + (HT[k + 1] - HT[k]) * fc, h1 = HT[k + NC] + (HT[k + NC + 1] - HT[k + NC]) * fc;
      return h0 + (h1 - h0) * fr;
    };
    const toWorld = (s, lat, out) => {
      const r = rowOf(s), i = r | 0, f = r - i;
      const tx = lerp(TX[i], TX[i + 1], f), tz = lerp(TZ[i], TZ[i + 1], f);
      out.x = lerp(PX[i], PX[i + 1], f) - tz * lat; out.z = lerp(PZ[i], PZ[i + 1], f) + tx * lat; out.tx = tx; out.tz = tz;
      return out;
    };

    // ---------------- height raster around the path (4 m): mid-distance land, baked sun shadow and occlusion
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (let i = 0; i < NR; i++) { bx0 = Math.min(bx0, PX[i]); bx1 = Math.max(bx1, PX[i]); bz0 = Math.min(bz0, PZ[i]); bz1 = Math.max(bz1, PZ[i]); }
    const RC = 4, RX0 = bx0 - 150, RZ0 = bz0 - 110, RW = Math.ceil((bx1 - bx0 + 300) / RC) + 1, RH = Math.ceil((bz1 - bz0 + 240) / RC) + 1;
    const RAS = new Float32Array(RW * RH), RDI = new Float32Array(RW * RH), RSH = new Float32Array(RW * RH), RAO = new Float32Array(RW * RH);
    for (let j = 0; j < RH; j++) {
      const z = RZ0 + j * RC;
      for (let i = 0; i < RW; i++) { RAS[j * RW + i] = landAt(RX0 + i * RC, z); RDI[j * RW + i] = lastA; }
      if ((j & 0) === 0) await ctx.yield();
    }
    const inRas = (x, z) => x >= RX0 && z >= RZ0 && x <= RX0 + (RW - 1) * RC && z <= RZ0 + (RH - 1) * RC;
    const sampR = (arr, x, z) => {
      const fi = clamp((x - RX0) / RC, 0, RW - 1.001), fj = clamp((z - RZ0) / RC, 0, RH - 1.001), i = fi | 0, j = fj | 0, a = fi - i, b = fj - j, k = j * RW + i;
      const h0 = arr[k] + (arr[k + 1] - arr[k]) * a, h1 = arr[k + RW] + (arr[k + RW + 1] - arr[k + RW]) * a;
      return h0 + (h1 - h0) * b;
    };
    {
      const lh = Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), sx = sunDir.x / lh / RC, sz = sunDir.z / lh / RC, rise = Math.max(sunDir.y / lh, 0.2126);
      for (let j = 0; j < RH; j++) {
        for (let i = 0; i < RW; i++) {
          const h0 = RAS[j * RW + i] + 0.6;
          let res = 1, d = 5;
          for (let k = 0; k < 14; k++) {
            const hr = h0 + d * rise;
            if (hr > 80) break;
            const fi = Math.round(i + sx * d), fj = Math.round(j + sz * d);
            if (fi < 0 || fj < 0 || fi >= RW || fj >= RH) break;
            const c = 5 * (hr - RAS[fj * RW + fi]) / d + 0.25;
            if (c < res) { res = c; if (res <= 0) { res = 0; break; } }
            d *= 1.32;
          }
          RSH[j * RW + i] = res;
        }
        if ((j & 1) === 1) await ctx.yield();
      }
      // occlusion: how far a cell sits below its surroundings
      const R = 3;
      for (let j = 0; j < RH; j++) {
        const j0 = Math.max(0, j - R), j1 = Math.min(RH - 1, j + R);
        for (let i = 0; i < RW; i++) {
          const i0 = Math.max(0, i - R), i1 = Math.min(RW - 1, i + R);
          const m = (RAS[j0 * RW + i0] + RAS[j0 * RW + i1] + RAS[j1 * RW + i0] + RAS[j1 * RW + i1] + RAS[j * RW + i0] + RAS[j * RW + i1] + RAS[j0 * RW + i] + RAS[j1 * RW + i]) / 8;
          RAO[j * RW + i] = clamp(0.88 + (RAS[j * RW + i] - m) * 0.07, 0.45, 1);
        }
        if ((j & 15) === 15) await ctx.yield();
      }
    }
    const landMat = (defs) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: ROCK_VS, fragmentShader: ROCK_FS, defines: defs, fog: true });
    const groundMat = landMat({ LAND: 1 }), stripMat = landMat({ LAND: 1, STRIP: 1 });
    groundMat.side = stripMat.side = THREE.DoubleSide;

    // ---------------- the strip: the ground at the lens, 1.5 m rows along the whole path
    {
      const nv = NR * NC, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), bake = new Float32Array(nv * 2), sl = new Float32Array(nv * 2);
      for (let i = 0; i < NR; i++) { if ((i & 31) === 31) await ctx.yield(); for (let c = 0; c < NC; c++) {
        const lat = LAT[c], k = i * NC + c, x = PX[i] - TZ[i] * lat, z = PZ[i] + TX[i] * lat;
        pos[k * 3] = x; pos[k * 3 + 1] = HT[k] - 0.9 * ss(34, 40, Math.abs(lat)); pos[k * 3 + 2] = z;
        if (lat > 6) { const wk = wingK(PD[i]), toe = wingToe(PD[i], WR[i]); if (wk > 0.3) pos[k * 3 + 1] -= 3 * ss(toe + 0.1, toe + 1.3, lat) * ss(0.3, 0.6, wk); }      // (the Wing's wall is a mesh of its own from its toe up: the strip passes under it)
        bake[k * 2] = sampR(RAO, x, z); bake[k * 2 + 1] = sampR(RSH, x, z) * (1 - ss(dM - 5, dM + 35, PD[i]));      // the gap floor lies in the fins' shadow
        if (lat > 12 && PD[i] < dR1 + 30) { const wg = wingGul(PD[i], PY[i], lat, WR[i]); bake[k * 2] *= 1 - 0.5 * wg; bake[k * 2 + 1] *= 1 - 0.6 * wg; }
        sl[k * 2] = S0 + i * DS; sl[k * 2 + 1] = lat;
      } }
      await ctx.yield();
      for (let i = 0; i < NR; i++) { if ((i & 31) === 31) await ctx.yield(); for (let c = 0; c < NC; c++) {
        const k = i * NC + c, ka = (i > 0 ? k - NC : k) * 3, kb = (i < NR - 1 ? k + NC : k) * 3, kc = (c > 0 ? k - 1 : k) * 3, kd = (c < NC - 1 ? k + 1 : k) * 3;
        const ax_ = pos[kb] - pos[ka], ay = pos[kb + 1] - pos[ka + 1], az = pos[kb + 2] - pos[ka + 2], bx = pos[kd] - pos[kc], by = pos[kd + 1] - pos[kc + 1], bz = pos[kd + 2] - pos[kc + 2];
        let nx = ay * bz - az * by, ny = az * bx - ax_ * bz, nz = ax_ * by - ay * bx;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nor[k * 3] = nx / nl; nor[k * 3 + 1] = ny / nl; nor[k * 3 + 2] = nz / nl;
      } }
      await ctx.yield();
      const aP = new THREE.BufferAttribute(pos, 3), aN = new THREE.BufferAttribute(nor, 3), aB = new THREE.BufferAttribute(bake, 2), aS = new THREE.BufferAttribute(sl, 2);
      const CH = 5, per = Math.ceil((NR - 1) / CH);
      for (let ch = 0; ch < CH; ch++) {
        const r0 = ch * per, r1 = Math.min(NR - 1, r0 + per), idx = new Uint32Array((r1 - r0) * (NC - 1) * 6);
        let o = 0;
        for (let i = r0; i < r1; i++) for (let c = 0; c < NC - 1; c++) { const a = i * NC + c, b = a + 1, cc = a + NC, d = cc + 1; idx[o++] = a; idx[o++] = cc; idx[o++] = b; idx[o++] = b; idx[o++] = cc; idx[o++] = d; }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', aP); g.setAttribute('normal', aN); g.setAttribute('aBake', aB); g.setAttribute('aSL', aS); g.setIndex(new THREE.BufferAttribute(idx, 1));
        const rm = (r0 + r1) >> 1;
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(PX[rm], PY[rm] - 5, PZ[rm]), (r1 - r0) * DS * 0.5 + 62);
        const m = new THREE.Mesh(g, stripMat); m.name = 'strip' + ch; scene.add(m);
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---------------- the Wing's wall, from its toe over its crest and down its back: the path's own rows (1.5 m), a column
    // every 2 m up the face
    const WG_I1 = Math.min(NR - 2, Math.ceil(rowOf(dR1 + 52))), WG_L1 = 146;
    const wingMat = landMat({ LAND: 1, WING: 1 }); wingMat.side = THREE.DoubleSide;
    let wingGeo = null, wingRowIdx = 0, wingRows = 0;
    {
      const T0 = [-0.9, 0, 0.8, 1.7, 2.7, 3.8, 5.0, 6.3, 7.7, 9.2, 10.8, 12.5, 14.3, 16.2, 18.2];
      while (T0[T0.length - 1] < 71.5) T0.push(T0[T0.length - 1] + 2.1);
      const nT = T0.length, TAIL = [0.1, 0.22, 0.37, 0.55, 0.76, 1], nw = nT + TAIL.length, nr = WG_I1 + 1;
      const pos = new Float32Array(nr * nw * 3), nor = new Float32Array(nr * nw * 3), bake = new Float32Array(nr * nw * 2), wl = new Float32Array(nr * nw * 2);
      for (let i = 0; i < nr; i++) {
        const endK = 1 - ss(WG_I1 - 6, WG_I1, i), toe = wingToe(PD[i], WR[i]), wk = wingK(PD[i]), latT = toe + T0[nT - 1];
        for (let c = 0; c < nw; c++) {
          const lat = c < nT ? toe + T0[c] : lerp(latT, WG_L1, TAIL[c - nT]), k = i * nw + c, x = PX[i] - TZ[i] * lat, z = PZ[i] + TX[i] * lat;
          pos[k * 3] = x; pos[k * 3 + 2] = z; wl[k * 2] = PD[i]; wl[k * 2 + 1] = lat - toe;
          pos[k * 3 + 1] = prof(PD[i], PY[i], lat, x, z, WL[i], WR[i]) - (c === 0 ? 0.5 : c === 1 ? 0.06 : 0) - 0.5 * (1 - ss(0.2, 0.5, wk)) - 3 * ss(132, WG_L1, lat) - 3 * (1 - endK);
          const wg = wingGul(PD[i], PY[i], lat, WR[i]);
          bake[k * 2] = sampR(RAO, x, z) * (1 - 0.6 * Math.sqrt(wg)); bake[k * 2 + 1] = sampR(RSH, x, z) * (1 - 0.95 * Math.sqrt(wg));
        }
        if ((i & 3) === 3) await ctx.yield();
      }
      for (let i = 0; i < nr; i++) { if ((i & 31) === 31) await ctx.yield(); for (let c = 0; c < nw; c++) {
        const k = i * nw + c, ka = (i > 0 ? k - nw : k) * 3, kb = (i < nr - 1 ? k + nw : k) * 3, kc = (c > 0 ? k - 1 : k) * 3, kd = (c < nw - 1 ? k + 1 : k) * 3;
        const ax_ = pos[kb] - pos[ka], ay = pos[kb + 1] - pos[ka + 1], az = pos[kb + 2] - pos[ka + 2], bx = pos[kd] - pos[kc], by = pos[kd + 1] - pos[kc + 1], bz = pos[kd + 2] - pos[kc + 2];
        let nx = ay * bz - az * by, ny = az * bx - ax_ * bz, nz = ax_ * by - ay * bx;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const nl = Math.hypot(nx, ny, nz) || 1;
        nor[k * 3] = nx / nl; nor[k * 3 + 1] = ny / nl; nor[k * 3 + 2] = nz / nl;
      } }
      await ctx.yield();
      const idx = new Uint32Array((nr - 1) * (nw - 1) * 6);
      let o = 0;
      for (let i = 0; i < nr - 1; i++) for (let c = 0; c < nw - 1; c++) { const a = i * nw + c, b = a + 1, cc = a + nw, d = cc + 1; idx[o++] = a; idx[o++] = cc; idx[o++] = b; idx[o++] = b; idx[o++] = cc; idx[o++] = d; }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aBake', new THREE.BufferAttribute(bake, 2)); g.setAttribute('aWL', new THREE.BufferAttribute(wl, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, wingMat); m.name = 'wing'; scene.add(m);
      wingGeo = g; wingRowIdx = (nw - 1) * 6; wingRows = nr - 1;
    }
    await ctx.yield();

    // ---------------- the entry apron. Seen through the previous world's portal the camera stands well back from the entry
    // at rider's height, so every ray through the lower half of the opening enters this world under the wash floor. Just
    // beyond the entry plane, under the real ground (which hides it from our own flight), the floor is therefore carried
    // down toward the viewer as a bank of the same sand, hoof prints and feather grass, so that the ground runs to the
    // bottom edge of the opening.
    const AP_S0 = -1.5, AP_S1 = 9.5, gEntry = PY[I0];
    const apronY = (sa) => gEntry - 0.14 - 0.95 * (AP_S1 - sa);
    let apron = null;
    {
      const ns = 23, nl = 29, pos = [], nor = [], bake = [], sl = [], idx = [];
      for (let i = 0; i < ns; i++) for (let c = 0; c < nl; c++) {
        const sa = lerp(AP_S0, AP_S1, i / (ns - 1)), lat = lerp(-21, 21, c / (nl - 1)), x = PX[I0] + TX[I0] * sa - TZ[I0] * lat, z = PZ[I0] + TZ[I0] * sa + TX[I0] * lat;
        pos.push(x, apronY(sa), z); nor.push(0, 1, 0); bake.push(0.95, sampR(RSH, x, z)); sl.push(sa * 1.4, lat);
      }
      for (let i = 0; i < ns - 1; i++) for (let c = 0; c < nl - 1; c++) { const a = i * nl + c, b = a + 1, cc = a + nl, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aBake', new THREE.Float32BufferAttribute(bake, 2)); g.setAttribute('aSL', new THREE.Float32BufferAttribute(sl, 2)); g.setIndex(idx);
      apron = new THREE.Mesh(g, stripMat); apron.name = 'entry-apron'; apron.frustumCulled = false; scene.add(apron);
    }
    await ctx.yield();

    // ---------------- the basin: a tensor grid, 6 m near the path, growing to the 4 km rim
    {
      const axisOf = (lo, hi, min, max) => {
        const a = []; for (let v = lo; v <= hi + 0.01; v += 6) a.push(v);
        const left = [], right = []; let st = 6, v = lo;
        while (v > min) { st *= 1.32; v = Math.max(min, v - st); left.push(v); }
        st = 6; v = a[a.length - 1];
        while (v < max) { st *= 1.32; v = Math.min(max, v + st); right.push(v); }
        return [...left.reverse(), ...a, ...right];
      };
      const xs = axisOf(bx0 - 108, Math.max(bx1 + 108, HX1 + 34), -2550, 2850), zs = axisOf(bz0 - 60, bz1 + 108, -2250, 3150), nx = xs.length, nz = zs.length;
      const pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), bake = new Float32Array(nx * nz * 2), BK2 = [1, 1];
      for (let j = 0; j < nz; j++) {
        const z = zs[j];
        for (let i = 0; i < nx; i++) {
          const x = xs[i], k = j * nx + i;
          let y, ao = 0.9, sh = 1;
          if (inRas(x, z)) {
            y = sampR(RAS, x, z) - 1.4 * (1 - ss(29, 37, sampR(RDI, x, z))); ao = sampR(RAO, x, z); sh = sampR(RSH, x, z);
            if (sampR(RDI, x, z) < 150) {                           // (and under the Wing's own mesh)
              nearest(x, z);
              if (nLat > 10) {                                // (from its toe: left 1.4 m under the true ground, this coarse grid filled the wall's gullies and stood out of its foot as a pale skirt)
                const ri = Math.min(NR - 1, nI | 0), toe = wingToe(PD[ri], WR[ri]);
                y -= 16 * ss(toe + 0.5, toe + 7, nLat) * (1 - ss(118, 131, nLat)) * (1 - ss(WG_I1 - 9, WG_I1 - 4, nI)) * ss(0, 2, nI) * ss(0.3, 0.6, wingK(PD[ri]));
              }
            }
            const dxe = x - PX[I0], dze = z - PZ[I0], sE = dxe * TX[I0] + dze * TZ[I0], lE = -dxe * TZ[I0] + dze * TX[I0];
            if (sE > -20 && sE < 26 && Math.abs(lE) < 31) y -= 14 * bell4(sE, -20, -8, 14, 26) * (1 - ss(23, 31, Math.abs(lE)));      // (under the entry apron)
          }
          else y = landAt(x, z);
          if (x > HX0 && x < HX1 && z > HZ0 && z < HZ1) {
            // where the land lies on the Ribbon's own floor it stands in the Ribbon's shadow and under its walls, as that floor does
            const on = (1 - ss(1.2, 4.5, y - hero.heightAt(x, z))) * ss(0, 30, Math.min(x - HX0, HX1 - x, z - HZ0, HZ1 - z));
            if (on > 0) { hero.bakeAt(x, z, BK2); sh = Math.min(sh, lerp(1, BK2[1], on)); ao = Math.min(ao, lerp(1, Math.max(0.6, BK2[0] + 0.1), on)); }
          }
          pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; bake[k * 2] = ao; bake[k * 2 + 1] = sh;
        }
        await ctx.yield();
      }
      for (let j = 0; j < nz; j++) {
        if ((j & 7) === 7) await ctx.yield();
        for (let i = 0; i < nx; i++) {
          const k = j * nx + i, il = i > 0 ? k - 1 : k, ir = i < nx - 1 ? k + 1 : k, ju = j > 0 ? k - nx : k, jd = j < nz - 1 ? k + nx : k;
          const gx = (pos[ir * 3 + 1] - pos[il * 3 + 1]) / Math.max(1e-3, pos[ir * 3] - pos[il * 3]), gz = (pos[jd * 3 + 1] - pos[ju * 3 + 1]) / Math.max(1e-3, pos[jd * 3 + 2] - pos[ju * 3 + 2]);
          const nl = Math.hypot(gx, 1, gz);
          nor[k * 3] = -gx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -gz / nl;
        }
      }
      await ctx.yield();
      const aP = new THREE.BufferAttribute(pos, 3), aN = new THREE.BufferAttribute(nor, 3), aB = new THREE.BufferAttribute(bake, 2);
      const BANDS = 1, per = Math.ceil((nz - 1) / BANDS);
      for (let b = 0; b < BANDS; b++) {
        const j0 = b * per, j1 = Math.min(nz - 1, j0 + per), idx = new Uint32Array((j1 - j0) * (nx - 1) * 6);
        let o = 0;
        for (let j = j0; j < j1; j++) { if ((j & 15) === 15) await ctx.yield(); for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, bb = a + 1, c = a + nx, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = bb; idx[o++] = bb; idx[o++] = c; idx[o++] = d; } }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', aP); g.setAttribute('normal', aN); g.setAttribute('aBake', aB); g.setIndex(new THREE.BufferAttribute(idx, 1));
        const zc = (zs[j0] + zs[j1]) / 2, zr = (zs[j1] - zs[j0]) / 2;
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(150, 20, zc), Math.hypot(2750, zr) + 100);
        const m = new THREE.Mesh(g, groundMat); m.name = 'basin' + b; scene.add(m);
      }
    }
    await ctx.yield();

    // ---------------- sky, haze, the shower cell, far ridges
    const skyOpts = { rng, ...LK.sky };
    if (hour === 'night') { skyOpts.bodyOverrides = { 0: { direction: sunDir.clone() } }; skyOpts.bake = true; skyOpts.renderer = ctx.renderer; }
    else skyOpts.sunDirection = sunDir.clone();
    const skyA = makeSky(skyOpts);
    scene.add(skyA.object);
    await ctx.yield();
    const stormCol = hour === 'golden' ? { lit: '#a391b4', shade: '#231e3a' } : hour === 'night' ? { lit: '#5a6a8c', shade: '#18223a' } : { lit: '#979fa2', shade: '#283039' };
    const skyB = LK.storm ? makeSky({ rng, preset: 'storm', lightning: 0, sunIntensity: 0, sunDirection: sunDir.clone(), ...LK.storm,
      clouds: { coverage: 0.8, softness: 0.4, scale: 0.75, lit: stormCol.lit, shade: stormCol.shade, absorb: 2, silver: 1, wind: [0.034, 0.011], detail: 0.75 } }) : null;
    if (skyB) { skyB.setOpacity(0); scene.add(skyB.object); }
    // the storm dome fades in over the fair one: both of its halves go to the blended pass, once, here, and are never touched again
    if (skyB) { skyB.material.transparent = true; if (skyB.materialLow) skyB.materialLow.transparent = true; }
    const fogA = new THREE.Color(LK.fog), fogB = new THREE.Color(LK.fogStorm);
    scene.fog = new THREE.FogExp2(fogA.clone(), LK.dens);
    await ctx.yield();
    let cell = null;
    if (skyB) {
      const cx = -east * 1, at = [[-900, 330, -700, 900], [-1500, 390, -250, 800], [-380, 430, -1150, 820], [-1250, 300, -1350, 1000], [-150, 520, -1750, 900], [-2000, 420, -900, 900]].map((c) => [c[0] * -cx, c[1], c[2], c[3]]);
      cell = makeCloudField({ rng, sky: skyB, at, puffs: Math.round(40 * (0.6 + 0.4 * detail)), wind: [7 * east, 0, -2.5], opacity: 0.9 });
      // the cell itself stands in the low sun: its lit side takes the sun's colour over a dark base, and it keeps its outline through the haze
      if (hour === 'golden') { cell.uniforms.uLit.value.set('#f7c79a'); cell.uniforms.uShade.value.set('#5a5488'); cell.uniforms.uBottom.value.set('#46426a'); }
      cell.uniforms.uFogFade.value = 0.6;
      scene.add(cell.object);
      await ctx.yield();
    }
    const ridges = T.makeHorizonRidges({ rng, layers: 3, radius: [2700, 3900], height: [110, 360], segments: 200, fog: scene.fog, sunDir, sunColor: LK.sky.sunColor || '#ffd9a0', colorNear: hour === 'night' ? '#26304a' : '#a48e80', rim: 0.3 });
    scene.add(ridges.object);
    await ctx.yield();

    // ---------------- ground table as a texture (silhouette shadows are thrown onto it)
    const HTW = 64, htData = new Uint16Array(HTW * NR);
    for (let i = 0; i < NR; i++) for (let k = 0; k < HTW; k++) {
      if (k === 0 && (i & 31) === 31) await ctx.yield();
      // between the fins the table is held to the floor: a shadow that reaches a wall goes under it, it is not smeared up the rock
      const l0 = -40 + (k + 0.5) * (80 / HTW), lm = lerp(40, 9.6, ss(dM - 85, dM - 50, PD[i])), lat = clamp(l0, -lm, lm), c = colOf(lat), j = c | 0;
      htData[i * HTW + k] = THREE.DataUtils.toHalfFloat(HT[i * NC + j] + (HT[i * NC + j + 1] - HT[i * NC + j]) * (c - j));
    }
    const htTex = new THREE.DataTexture(htData, HTW, NR, THREE.RedFormat, THREE.HalfFloatType);
    htTex.minFilter = htTex.magFilter = THREE.LinearFilter; htTex.wrapS = htTex.wrapT = THREE.ClampToEdgeWrapping; htTex.needsUpdate = true;
    await ctx.yield();

    // ---------------- the herd
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const nHerd = Math.round(lerp(44, 70, (dens - 0.7) / 0.6)), nExtra = cast === 'khulan' ? 14 : cast === 'bachelors' ? 8 : 0, nGaz = 8;
    const NHI = 12, NA = nHerd + nExtra + nGaz, G0 = nHerd + nExtra;
    const aPos = new Float32Array(NA * 4), aPose = new Float32Array(NA * 4), aAux = new Float32Array(NA * 4), aPath = new Float32Array(NA * 4);
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const lifeMat = (vs, life, extra = {}, defs = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uLife: { value: new THREE.Vector4(...life) }, ...extra }, vertexShader: vs, fragmentShader: LIFE_FS, defines: defs, fog: true, side: THREE.DoubleSide });
    const coatMat = lifeMat(COAT_VS, [hour === 'night' ? 1.9 : 1.3, 0.7, 0, spring ? 1 : 0], {}, { COAT: 1 });
    const shadowMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uHT: { value: htTex }, uHTr: { value: new THREE.Vector4(S0 - 0.5 * DS, 1 / (NR * DS), 40, DS) } },
      vertexShader: SHADOW_VS, fragmentShader: ROCK_FS, defines: { LAND: 1, SHADOWPASS: 1 }, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1.2, polygonOffsetUnits: -5 });
    await ctx.yield();
    const dyn = [];
    const instOf = (base, a, b, withPath) => {
      const g = new THREE.InstancedBufferGeometry();
      g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      const add = (name, arr) => { const at = new THREE.InstancedBufferAttribute(arr.subarray(a * 4, b * 4), 4); at.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, at); dyn.push(at); };
      add('iPos', aPos); add('iPose', aPose); add('iAux', aAux); if (withPath) add('iPath', aPath);
      g.instanceCount = b - a;
      return g;
    };
    const gHi = quadrupedGeometry(2, 'takhi'); await ctx.yield();
    const gLo = quadrupedGeometry(1, 'takhi'); await ctx.yield();
    const gSh = quadrupedGeometry(0, 'takhi'); await ctx.yield();
    const gGz = quadrupedGeometry(1, 'gazelle');
    await ctx.yield();
    const addMesh = (g, mat, name, order = 0) => { const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = name; m.renderOrder = order; scene.add(m); return m; };
    addMesh(instOf(gHi, 0, NHI), coatMat, 'takhi-near');
    addMesh(instOf(gLo, NHI, G0), coatMat, 'takhi');
    addMesh(instOf(gGz, G0, NA), coatMat, 'gazelles');
    addMesh(instOf(gSh, 0, NA, true), shadowMat, 'shadows', 1);
    const disposables = [gHi, gLo, gSh, gGz];
    await ctx.yield();
    // dust and mud at the hooves
    const dustU = { ...fogU(), ...U, uSpeed: { value: VNOM } };
    {
      const K = Math.max(8, Math.round(22 * detail)), q = [], qi = [];
      for (let k = 0; k < K; k++) { const o = k * 4; q.push(-0.5, -0.5, k / K, 0.5, -0.5, k / K, 0.5, 0.5, k / K, -0.5, 0.5, k / K); qi.push(o, o + 1, o + 2, o, o + 2, o + 3); }
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(K * 12), 3)); base.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3)); base.setIndex(qi);
      const m = addMesh(instOf(base, 0, NA), new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: DUST_VS, fragmentShader: DUST_FS, fog: true, transparent: true, depthWrite: false }), 'dust', 5);
      disposables.push(base); m.geometry.deleteAttribute('position'); m.geometry.setAttribute('position', base.attributes.position);
    }
    await ctx.yield();

    // ---------------- our own animal: neck crest, mane and ears at the bottom of the frame
    const rideU = { value: new THREE.Vector4(0, 0, 0, 0) }, ride2U = { value: new THREE.Vector4(0, 0, 0, 0) };
    const mount = new THREE.Mesh(mountGeometry(rng.fork('mount')), lifeMat(MOUNT_VS, [hour === 'night' ? 0.6 : 0.2, 0.22, 0, 0], { uRide: rideU, uRide2: ride2U }, { COAT: 1, MOUNT: 1 }));
    mount.matrixAutoUpdate = false; mount.frustumCulled = false; mount.name = 'mount'; scene.add(mount);
    await ctx.yield();
    // the eagle (or a saker) on the ridge lift
    const wingU = { value: new THREE.Vector4(saker ? 0.05 : 0.11, saker ? 0.16 : 0.012, saker ? 9 : 2.2, 1) }, headU = { value: new THREE.Vector4(0, 0, 0, 0) };
    const raptor = new THREE.Mesh(raptorGeometry(saker), lifeMat(RAPTOR_VS, [0.7, 0.2, 0, 0], { uWing: wingU, uHead: headU }));
    raptor.frustumCulled = false; raptor.name = 'raptor'; scene.add(raptor);
    await ctx.yield();
    // demoiselle cranes crossing overhead at u 0.30, heading south
    const DUR = 48;
    const faunaLight = { sunDir: sunDir.clone(), sunColor: LK.sky.sunColor || '#cfd8ff', sunIntensity: hour === 'night' ? 0.7 : 2.2, sky: hour === 'night' ? '#24345c' : '#7f9db8', skyIntensity: 0.9, ground: '#8a7458', groundIntensity: hour === 'night' ? 0.15 : 0.5 };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('cranes'), species: 'flamingos', form: 'vee', count: 36, size: 2.3, spacing: 1.45, speed: 14,
      body: '#aab1b9', belly: '#bcc2c8', wingC: '#8d96a0', trail: '#2c3036', tip: '#1e2126', beak: '#5a5a48', head: '#26292e', neckC: '#2a2d33', legC: '#2b2b2b',
      cross: { path, u: 0.30, lead: 125, height: 44, angle: 158, side: 1, span: 520, duration: DUR } }));
    await ctx.yield();
    // the squall's snow falls round the camera as kit flakes; rain is drawn as soft slanting veils of our own
    const timeU = { value: 0 };
    const rainRng = rng.fork('rain');
    const rain = snow ? fx.makeParticles({ rng: rainRng, preset: 'snow', count: Math.round(3000 * detail), time: timeU, opacity: 0 }) : null;
    if (rain) { rain.setOpacity(0); scene.add(rain.object); }
    await ctx.yield();
    const veilU = { uEye: { value: new THREE.Vector3() }, uVeilK: { value: new THREE.Vector4(0, 0, 0.2, 0) } };
    let veils = null;
    if (hour !== 'dawn' && !snow) {
      const SH = [[7, 5], [16, 11], [38, 24], [90, 50], [210, 100]], NSEG = 28, vp = [], vs = [], vi = [];
      SH.forEach(([R, H], k) => {
        const o = vp.length / 3;
        for (let i = 0; i <= NSEG; i++) { const an = i / NSEG * 6.2832, c = Math.cos(an), sn = Math.sin(an); for (const yy of [-1, 1]) { vp.push(c, yy, sn); vs.push(R, H, k / (SH.length - 1)); } }
        for (let i = 0; i < NSEG; i++) { const a = o + i * 2; vi.push(a, a + 1, a + 3, a, a + 3, a + 2); }
      });
      const vg = new THREE.BufferGeometry();
      vg.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); vg.setAttribute('aShell', new THREE.Float32BufferAttribute(vs, 3)); vg.setIndex(vi);
      veils = new THREE.Mesh(vg, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, ...veilU }, vertexShader: VEIL_VS, fragmentShader: VEIL_FS, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      veils.frustumCulled = false; veils.renderOrder = 6; veils.name = 'rain-veils'; scene.add(veils);
    }
    await ctx.yield();
    const antiTrue = new THREE.Vector3(-sunDir.x, -sunDir.y, -sunDir.z).normalize();      // the point opposite the sun (no rainbow and no shafts are drawn about it in this world)
    // the break: up-sun of the Ribbon's west end, where the storm's trailing edge stands when the line has passed over us
    const brkAz = hG - 52 * DEG, brkEl = 23 * DEG;
    const brkDir = new THREE.Vector3(Math.sin(brkAz) * Math.cos(brkEl), Math.sin(brkEl), -Math.cos(brkAz) * Math.cos(brkEl));
    const brkCol = new THREE.Color(LK.sky.sunColor || '#cfd8ff').lerp(new THREE.Color('#ffffff'), 0.25);
    const breaks = [];
    if (hour !== 'dawn') {
      const sg = new THREE.IcosahedronGeometry(1, 1);
      {
        const bu = { uRad: { value: 1450 }, uBrkDir: { value: brkDir }, uBrkCol: { value: new THREE.Vector3(brkCol.r, brkCol.g, brkCol.b) }, uBrk: { value: new THREE.Vector4(0, 0, 0, 0) } };
        const m = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: bu, vertexShader: BREAK_VS, fragmentShader: BREAK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide, fog: false }));
        m.frustumCulled = false; m.renderOrder = 1; m.name = 'sunbreak'; scene.add(m); breaks.push(bu);
      }
      disposables.push(sg);
    }
    await ctx.yield();
    // after the storm: the departing curtain down its own heading, gold-lit shreds of scud under the cloud base
    const aftU = { uRad: { value: 1500 }, uAxis: { value: antiTrue }, uCur: { value: new THREE.Vector3(hero.wet.dir.x, 0, hero.wet.dir.y - 0.75).normalize() },
      uGold: { value: new THREE.Vector3(brkCol.r, brkCol.g, brkCol.b).multiplyScalar(hour === 'night' ? 0.5 : 0.86) }, uSlate: { value: new THREE.Vector3() }, uDark: { value: new THREE.Vector3() },
      uAft: { value: new THREE.Vector4(0, 0, 0, 0) } };
    {
      const sl = new THREE.Color(stormCol.shade).lerp(new THREE.Color(stormCol.lit), 0.34), dk = new THREE.Color(stormCol.shade).multiplyScalar(0.50);
      aftU.uSlate.value.set(sl.r, sl.g, sl.b); aftU.uDark.value.set(dk.r, dk.g, dk.b);
      const ag = new THREE.IcosahedronGeometry(1, 1);
      const am = new THREE.ShaderMaterial({ uniforms: aftU, vertexShader: AFTER_VS, fragmentShader: AFTER_FS, transparent: true, depthWrite: false, depthTest: true, side: THREE.BackSide, fog: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
      const after = new THREE.Mesh(ag, am);
      after.frustumCulled = false; after.renderOrder = 1; after.name = 'after-storm'; after.visible = !!LK.storm; scene.add(after); disposables.push(ag, am);
    }
    await ctx.yield();
    // the exit ring's light in the air of the gap (the engine draws the ring itself)
    const RING_R = 7.5, ringCol = new THREE.Color(hour === 'night' ? '#bcd0ff' : '#ffd9a0');
    const ringPos = path.end.clone();
    U.uRing.value.set(ringPos.x, ringPos.y, ringPos.z, 0); U.uRingB.value.set(ringCol.r, ringCol.g, ringCol.b, RING_R);
    const haloU = { uHalo: { value: new THREE.Vector4(ringPos.x, ringPos.y, ringPos.z, RING_R * 5.2) }, uHaloK: { value: new THREE.Vector4(0, 5.2, 0, EYE / RING_R) }, uHaloCol: { value: new THREE.Vector3(ringCol.r, ringCol.g, ringCol.b) } };
    {
      const hg = new THREE.PlaneGeometry(2, 2);
      const halo = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: haloU, vertexShader: HALO_VS, fragmentShader: HALO_FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
      halo.frustumCulled = false; halo.renderOrder = 7; halo.name = 'ring-halo'; scene.add(halo); disposables.push(hg);
    }
    const mist = hour === 'dawn' ? fx.makeMist({ rng: rng.fork('mist'), count: 60, area: [300, 6, 420], center: [PX[I0 + 60], 3, PZ[I0 + 60]], size: [22, 46], color: '#e9d6d2', opacity: 0.16, time: timeU }) : null;
    if (mist) scene.add(mist.object);
    await ctx.yield();

    // ---------------- plants and stones, placed in path coordinates from the ground table
    const plantMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: PLANT_VS, fragmentShader: PLANT_FS, fog: true, side: THREE.DoubleSide });
    // the cushions lay a soft shadow on the crust, so theirs blends (drawn after the ground, before the dust)
    const cushionMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: PLANT_VS, fragmentShader: PLANT_FS, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3 });
    const pr = rng.fork('plants'), wp = { x: 0, z: 0, tx: 0, tz: 0 };
    const mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
    const rowIn = (d0, d1) => { for (let t = 0; t < 30; t++) { const i = pr.int(2, NR - 3); if (PD[i] >= d0 && PD[i] <= d1) return i; } return -1; };
    // pick(): [row, lat] or null; chunks: instanced meshes along the path so that the stretch behind us is culled
    const lodChunks = [];                       // small things are only drawn within sight: [mesh, first s, last s, how far ahead it shows]
    const scatterPlants = async (geo, count, chunks, pick, size, tilt, name, mat = plantMat, far = 0, yOf = null, rr = pr) => {
      const list = [];
      for (let k = 0; k < count; k++) {
        const pk = pick(); if (!pk) continue;
        const s = S0 + (pk[0] + rr()) * DS;
        let lat = pk[1];
        if (lat > 0 && PD[pk[0]] < dR1 + 34 && lat > wingToe(PD[pk[0]], WR[pk[0]]) - 1) { if (mat !== grassMat || lat > 36) continue; lat = -lat; }      // the Wing's wall stays bare rock
        if (chan && lat < 0) { const e = -lat - WL[pk[0]]; if (e > 4 && e < 32 && chanW(PD[pk[0]]) > 0.25) continue; }      // nothing grows in the flooded wash
        toWorld(s, lat, wp);
        list.push({ s, x: wp.x, y: yOf ? yOf(s) : groundAt(s, lat), z: wp.z, sz: size(), yaw: rr.range(0, 6.2832), tx: rr.range(-tilt, tilt), tz: rr.range(-tilt, tilt) });
        if ((k & 31) === 31) await ctx.yield();
      }
      await ctx.yield();
      list.sort((a, b) => a.s - b.s);
      await ctx.yield();
      const per = Math.ceil(list.length / chunks);
      for (let c = 0; c < chunks; c++) {
        const part = list.slice(c * per, (c + 1) * per); if (!part.length) continue;
        const g = new THREE.BufferGeometry(); g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
        const shade = new Float32Array(part.length), im = new THREE.InstancedMesh(g, mat, part.length);
        part.forEach((p, k) => {
          eu.set(p.tx, p.yaw, p.tz); qt.setFromEuler(eu); sc.setScalar(p.sz); pv.set(p.x, p.y, p.z);
          im.setMatrixAt(k, mtx.compose(pv, qt, sc)); shade[k] = sampR(RSH, p.x, p.z);
        });
        g.setAttribute('iShade', new THREE.InstancedBufferAttribute(shade, 1));
        im.instanceMatrix.needsUpdate = true; im.name = name + c; scene.add(im);
        if (far) lodChunks.push([im, part[0].s, part[part.length - 1].s, far]);
        if ((c & 0) === 0) await ctx.yield();
      }
      disposables.push(geo);
      await ctx.yield();
    };
    const sideLat = (i, e0, e1) => { const sg = pr.sign(); return sg * ((sg > 0 ? WR[i] : WL[i]) + pr.range(e0, e1)); };
    const lush = Math.min(1.0, dens) * detail;
    const grassMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: GRASS_VS, fragmentShader: GRASS_FS, fog: true, side: THREE.DoubleSide });
    await scatterPlants(grassGeometry(), Math.round(8200 * lush), 9, () => {
      const r = pr();
      if (r < 0.62) {                                   // the wash floor, thickest under the hooves
        const i = rowIn(-70, dR0 + 55); if (i < 0) return null;
        const wide = PD[i] > dR0 + 10 ? Math.min(WL[i], WR[i]) : 13.6, lt = pr.range(-wide, wide) * (pr() < 0.6 ? Math.sqrt(pr()) : 1);
        const sg = S0 + i * DS - (0.12 * L - 3);          // thin where the gazelles stand, so they show to the hoof
        if (sg > -4 && sg < 34 && lt > 4.6 && lt < 13 && pr() < 0.8) return null;
        return [i, lt];
      }
      if (r < 0.88) { const i = rowIn(dR1 - 40, dM - 20); return i < 0 ? null : [i, sideLat(i, 7.2, 16)]; }
      const i = rowIn(dR0 + 20, dM - 10); return i < 0 ? null : [i, sideLat(i, 24.5, 33.5)];
    }, () => pr.range(0.72, 1.3), 0.12, 'grass', grassMat, 250);
    // feather grass down the entry apron (only ever seen through the previous world's portal)
    await scatterPlants(grassGeometry(), Math.round(640 * lush), 1, () => [I0 - 1 + pr.int(0, 6), pr.range(-17, 17)], () => pr.range(0.9, 1.5), 0.1, 'apron-grass', grassMat, 250, (sv) => apronY(clamp(sv, AP_S0, AP_S1)));
    // on the crest only cushions and a lag of dark pebbles: thick within the rideable width, so the ground streaks past
    await scatterPlants(cushionGeometry(), Math.round(1500 * lush), 9, () => {
      const i = rowIn(dR0 + 30, dM + 10); if (i < 0) return null;
      const sg = pr.sign(); return [i, sg * (sg > 0 ? WR[i] : WL[i]) * Math.pow(pr(), 0.6) * 1.08];
    }, () => pr.range(0.55, 1.15), 0.1, 'cushion', cushionMat, 150);
    await scatterPlants(pebbleGeometry(), Math.round(5200 * detail), 14, () => {
      const i = rowIn(pr() < 0.12 ? -40 : dR0 + 15, L + 12); if (i < 0) return null;
      const sg = pr.sign(); return [i, sg * Math.min(9.5, (sg > 0 ? WR[i] : WL[i]) + 1.2) * Math.pow(pr(), 0.8)];
    }, () => 0.04 + 0.075 * Math.pow(pr(), 2.2), 0.3, 'pebble', plantMat, 64);
    await scatterPlants(screeGeometry(pr, 1), Math.round(1300 * detail), 8, () => {
      const i = rowIn(dR0 + 20, dM - 50); if (i < 0) return null;
      const sg = pr.sign(); return [i, sg * ((sg > 0 ? WR[i] : WL[i]) + 1.5) * Math.pow(pr(), 0.7)];
    }, () => 0.05 + 0.17 * Math.pow(pr(), 2.2), 0.25, 'scree', plantMat, 95);
    await scatterPlants(screeGeometry(pr, 0.6), Math.round(1100 * detail), 4, () => {
      const i = rowIn(dM - 70, L + 16); if (i < 0) return null;
      return [i, pr.sign() * (pr() < 0.6 ? pr.range(7.2, 10.9) : pr.range(0.7, 7.2))];
    }, () => 0.07 + 0.21 * Math.pow(pr(), 2), 0.3, 'gap-scree', plantMat, 110);
    const saxSizes = () => pr.range(0.9, 1.9);
    await scatterPlants(saxaulGeometry(pr), Math.round(138 * lush), 6, () => {
      const r = pr();
      if (r < 0.34) { const i = rowIn(-70, dR0 + 25); return i < 0 ? null : [i, pr.sign() * pr.range(11.4, 14.2)]; }
      if (r < 0.62) { const i = rowIn(dR1 - 30, dM - 30); return i < 0 ? null : [i, sideLat(i, pr() < 0.5 ? 7.3 : 14.4, pr() < 0.5 ? 8.4 : 15.6)]; }
      if (r < 0.84) { const i = rowIn(dR0 + 20, dM - 20); return i < 0 ? null : [i, sideLat(i, 24.5, 33)]; }
      const i = rowIn(dR0, dR1 - 30); return i < 0 ? null : [i, sideLat(i, 8, 15)];
    }, saxSizes, 0.1, 'saxaul', plantMat, 420);
    await scatterPlants(tamariskGeometry(pr), Math.round(80 * lush), 2, () => { const i = rowIn(-75, dR0 + 40); return i < 0 ? null : [i, pr.sign() * pr.range(12.6, 17.5)]; }, () => pr.range(1.1, 1.6), 0.08, 'tamarisk', plantMat, 420);
    // the ramp's last rise and the spur top (u 0.2 to 0.36): the ground under the hooves is strewn at the scale of a stride with
    // pebbles, broken crust and cushion plants, thickest on our own line
    await scatterPlants(pebbleGeometry(), Math.round(1500 * detail), 6, () => {
      const i = rowIn(0.19 * L0, 0.37 * L0); if (i < 0) return null;
      return [i, pr.sign() * Math.min(9, (WL[i] + WR[i]) * 0.5 + 1) * Math.pow(pr(), 0.75)];
    }, () => 0.045 + 0.085 * Math.pow(pr(), 2.2), 0.3, 'spur-pebble', plantMat, 64);
    await scatterPlants(screeGeometry(pr, 0.8), Math.round(800 * detail), 6, () => {
      const i = rowIn(0.19 * L0, 0.37 * L0); if (i < 0) return null;
      return [i, pr.sign() * Math.min(9.5, (WL[i] + WR[i]) * 0.5 + 1.5) * Math.pow(pr(), 0.7)];
    }, () => 0.05 + 0.13 * Math.pow(pr(), 2.0), 0.3, 'spur-scree', plantMat, 95);
    await scatterPlants(cushionGeometry(), Math.round(300 * lush), 3, () => {
      const i = rowIn(0.19 * L0, 0.37 * L0); if (i < 0) return null;
      const sg = pr.sign(); return [i, sg * Math.max(1.6, (sg > 0 ? WR[i] : WL[i]) * Math.pow(pr(), 0.6))];
    }, () => pr.range(0.5, 1.0), 0.1, 'spur-cushion', cushionMat, 150);

    // ---------------- the rare flash flood: a bore down the wash in the Knife's left flank, then a sheet of water in the gap
    let flood = null, brush = null;
    const floodU = { value: new THREE.Vector4(-1e4, 0, 0, 0) };
    const FL_S0 = 0.60 * L, FL_S1 = 0.83 * L, FL_DS = 1, FL_N = Math.floor((FL_S1 - FL_S0) / FL_DS) + 1, FL_HW = 16;
    const flY = new Float32Array(FL_N), flLat = new Float32Array(FL_N), flDep = new Float32Array(FL_N);
    const floodFront = (u) => (0.72 - (0.72 - u) * (u < 0.72 ? 0.25 : 0.33)) * L;            // 35 m ahead of us at u 0.66, level at 0.72, then it falls behind
    const borePos = new THREE.Vector3();
    const floodLobe = (a, t) => 3.2 * (1 - a * a) - 2.4 + 1.5 * Math.sin(a * 4.3 + t * 0.7) + 0.8 * Math.sin(a * 9.1 - t * 1.3 + 1.7);
    if (chan) {
      const fp = [], fs_ = [], ft = [], fi = [], NW = 40;
      for (let r = 0; r < FL_N; r++) {
        const s = FL_S0 + r * FL_DS, i = Math.round(rowOf(s)), latC = -(WL[i] + 18);
        let lo = 1e9; for (let e = 9; e <= 27; e += 3) lo = Math.min(lo, groundAt(s, -(WL[i] + e)));
        flY[r] = lo - 0.05; flLat[r] = latC; flDep[r] = 1.3 * ss(0, 14, s - FL_S0) * chanW(PD[i]);
        for (let k = 0; k <= NW; k++) { const a = (k / NW) * 2 - 1; toWorld(s, latC + a * FL_HW, wp); fp.push(wp.x, flY[r], wp.z); fs_.push(s, a, flDep[r] * (1 - 0.6 * ss(0.7, 1, Math.abs(a)))); ft.push(wp.tx, wp.tz, groundAt(s, latC + a * FL_HW) - flY[r]); }
        if ((r & 3) === 3) await ctx.yield();
      }
      await ctx.yield();
      for (let r = 0; r < FL_N - 1; r++) for (let k = 0; k < NW; k++) { const a = r * (NW + 1) + k, b = a + 1, c = a + NW + 1, d = c + 1; fi.push(a, c, b, b, c, d); }
      await ctx.yield();
      // the sheet in the gap: along the foot of the left wall, behind the lane the horses take
      const v0 = fp.length / 3, sG0 = dM - 22, nG = Math.floor((L + 24 - sG0) / 3) + 1;
      const yG = new Float32Array(nG);                       // the water lies level across the lane: it fills the hollows of the floor and the humps stand out of it
      for (let r = 0; r < nG; r++) { const s = sG0 + r * 3; yG[r] = Math.min(groundAt(s, -7.4), groundAt(s, -8.5), groundAt(s, -9.6)); }
      for (let r = 0; r < nG; r++) {
        const s = sG0 + r * 3, tap = ss(0, 18, s - sG0), y = (yG[Math.max(0, r - 1)] + 2 * yG[r] + yG[Math.min(nG - 1, r + 1)]) * 0.25 + 0.03;
        for (let k = 0; k <= 4; k++) { const a = (k / 4) * 2 - 1, lat = -10.4 + a * 3.2; toWorld(s, lat, wp); fp.push(wp.x, y, wp.z); fs_.push(s - 10000, a, 0.30 * tap); ft.push(wp.tx, wp.tz, 0); }
      }
      for (let r = 0; r < nG - 1; r++) for (let k = 0; k < 4; k++) { const a = v0 + r * 5 + k, b = a + 1, c = a + 5, d = c + 1; fi.push(a, c, b, b, c, d); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); g.setAttribute('aSL', new THREE.Float32BufferAttribute(fs_, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(ft, 3)); g.setIndex(fi);
      await ctx.yield();
      flood = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uFlood: floodU }, vertexShader: FLOOD_VS, fragmentShader: FLOOD_FS, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
      flood.frustumCulled = false; flood.name = 'flood'; scene.add(flood);
      await ctx.yield();
      // torn brush riding the front
      const bg = saxaulGeometry(pr), NB = 12;
      bg.setAttribute('iShade', new THREE.InstancedBufferAttribute(new Float32Array(NB).fill(1), 1));
      disposables.push(bg);
      brush = new THREE.InstancedMesh(bg, plantMat, NB); brush.frustumCulled = false; brush.name = 'torn-brush'; brush.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let k = 0; k < NB; k++) brush.setMatrixAt(k, mtx.makeScale(0, 0, 0));
      scene.add(brush);
      await ctx.yield();
    }

    // ---------------- herd slots: each animal holds a place (ahead, lane) relative to our own arc length
    const hr = rng.fork('herd'), SL = [];
    const slot = (o) => { SL.push({ ahead: 0, lam: 0, cls: 1, side: 1, stag: 0, ph: hr(), size: hr.range(0.95, 1.06), tint: hr.range(0.8, 1.0), wa: hr.range(0.8, 2.2), wf: hr.range(0.11, 0.24), wp: hr.range(0, 6.28), lane: hr(), bench: hr.range(9.6, 13.4), seed: hr(), foal: false, ...o }); };
    const foalSize = spring ? 0.56 : 0.71;
    slot({ ahead: 12.7, lam: 0.155, cls: 0, wa: 0.5, tint: 0.7 }); slot({ ahead: 13.5, lam: -0.155, cls: 0, side: -1, stag: 4.6, wa: 0.5, tint: 0.64 });   // the two mares of the first frame, darker duns than the rest
    slot({ ahead: 9, side: -1, lane: 0.25, bench: 10.5, wa: 0.4 });                    // 2 the lead mare
    slot({ ahead: 10.5, side: 1, lane: 0.35, bench: 10, wa: 0.3 });                     // 3 a dam ...
    slot({ ahead: 8.6, side: 1, lane: 0.2, bench: 8.8, wa: 0.3, size: foalSize, foal: true });   // 4 ... and her foal
    slot({ ahead: -12, side: -1, lane: 0.5, size: 1.1, tint: 0.8 });                   // 5 the stallion
    [[8, -1, 0.1], [11.5, 1, 0.3], [16.5, -1, 0.45], [19, 1, 0.1], [23.5, -1, 0.2], [27, 1, 0.5]].forEach(([a, sd, ln]) => slot({ ahead: a, side: sd, lane: ln }));
    [24, 29.5, 35.5, 41.5, 48, 55, 62.5, 70.5, 79].forEach((a, k) => slot({ ahead: a, cls: 0, lam: (k & 1 ? -1 : 1) * hr.range(0.1, 0.25), side: k & 1 ? -1 : 1, stag: 0 }));
    let nFoal = 1;
    while (SL.length < nHerd) {
      const k = SL.length, a = lerp(-24, 82, hr()), sd = k & 1 ? -1 : 1;
      slot({ ahead: a, side: sd });
      if (nFoal < 10 && SL.length < nHerd && hr() < 0.34) { const dam = SL[SL.length - 1]; slot({ ahead: a - (spring ? 0.9 : 1.5), side: sd, lane: Math.max(0, dam.lane - (spring ? 0.07 : 0.13)), bench: dam.bench - (spring ? 0.8 : 1.3), size: foalSize, foal: true, wa: dam.wa, wf: dam.wf, wp: dam.wp }); nFoal++; }
    }
    for (let k = 0; k < nExtra; k++) {
      if (cast === 'khulan') slot({ cls: 3, ahead: lerp(14, 96, (k + hr()) / nExtra), side: 1, bench: hr.range(26, 32), size: 0.9, tint: 1.0 });      // (sandy, not bleached: at 1.3 the nearest of them were cream-white under the evening sun)
      else slot({ cls: 4, ahead: lerp(12, 46, (k + hr()) / nExtra), side: 1, lane: hr(), size: 1.04, tint: 0.9 });
    }
    // gazelles lie up in the feather grass 7 to 11 m right of the axis and flush in a wave as we draw level at u 0.12
    for (let k = 0; k < nGaz; k++) slot({ cls: 5, ahead: 2.6 + k * 1.3 + hr.range(0, 0.5), bench: 6.9 + ((k * 3) % 4) * 0.95 + hr.range(0, 0.4), lane: 0.1045 + ((k * 3) % 8) * 0.0017, size: 0.57, tint: hr.range(0.92, 1.08) });
    // on a flood visit the left bench is the wash: the horses near us run the very edge above it, the rest cross to the right bench ahead of us
    SL.forEach((o, j) => { o.hug = o.foal && j > 0 ? SL[j - 1].hug : j === 2 || (o.ahead < 3.5 && o.ahead > -9); });
    for (let j = 0; j < NA; j++) { aAux[j * 4] = SL[j].size; aAux[j * 4 + 1] = SL[j].tint; aAux[j * 4 + 2] = SL[j].cls === 5 ? 1 : 0; aAux[j * 4 + 3] = SL[j].seed; }
    await ctx.yield();
    const laneLat = (o, i) => {
      const d = PD[i], wl = WL[i], wr = WR[i];
      if (o.cls === 0) return lerp(o.lam * ((o.lam < 0 ? wl : wr) - 0.9), o.side * (8.5 + 1.5 * o.lane), ss(dM - 40, dM + 20, d));
      const w = o.side < 0 ? wl : wr;
      if (o.cls === 3) return o.side * lerp(Math.min(9 + 2.5 * o.lane, w - 0.6), w + o.bench, ss(dR1 + 34, dR1 + 90, d));      // khulan keep the wash's edge under the Wing, then take the far bench
      const washLat = o.side * lerp(4.4, 10.2, o.lane) * (w - 0.9) / 13.1;
      const benchLat = o.side * (w + o.bench), cw = o.side < 0 ? chanW(d) : 0;
      const lat = lerp(washLat, cw > 0 ? lerp(benchLat, o.hug ? -(w - 1.7 + 0.5 * o.lane) : wr + o.bench + 1.8, cw) : benchLat, o.side > 0 ? bell4(d, dR1 + 34, dR1 + 84, dM - 110, dM - 45) : bell4(d, dR1 - 60, dR1 - 5, dM - 110, dM - 45));      // (the right bench begins where the Wing ends)
      return lerp(lat, o.side * (8.5 + 1.5 * o.lane), ss(dM - 110, dM - 30, d));
    };
    const sStal = 0.25 * L + 5, STAL_LAT = -5.4, sGaz = 0.12 * L - 3;
    const stalPos = new THREE.Vector3(); { toWorld(sStal, STAL_LAT, wp); stalPos.set(wp.x, groundAt(sStal, STAL_LAT) + 1.6, wp.z); }
    let stalShade = null;
    {
      // he stands on the rim until he wheels away: a soft shadow under him, laid on the slope, seats him on it
      const g = plantGeo((v, idx) => {
        const n = 6, wh = [1, 1, 1];
        for (let i = 0; i <= n; i++) for (let c = 0; c <= n; c++) { const sv = sStal + (i / n - 0.5) * 3.8, lt = STAL_LAT + (c / n - 0.5) * 3.2; toWorld(sv, lt, wp); v(wp.x, groundAt(sv, lt) + 0.045, wp.z, wh, 0, i / n, c / n, 4); }
        for (let i = 0; i < n; i++) for (let c = 0; c < n; c++) { const a = i * (n + 1) + c, b = a + 1, cc = a + n + 1, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
      });
      g.setAttribute('iShade', new THREE.InstancedBufferAttribute(new Float32Array([1]), 1));
      stalShade = new THREE.InstancedMesh(g, cushionMat, 1); stalShade.setMatrixAt(0, mtx.identity()); stalShade.instanceMatrix.needsUpdate = true;
      stalShade.frustumCulled = false; stalShade.name = 'stallion-shade'; scene.add(stalShade); disposables.push(g);
    }
    const ribbonPoi = new THREE.Vector3(-60, 86, 85), bandPoi = stalPos.clone(), wingPoi = new THREE.Vector3();
    // the band: the lead mare and three more run the Knife's broad left shoulder beside us from the saddle on, [ahead, lat]
    const GAPF = { 2: [6.4, -4.5], 6: [9.8, -5.7], 3: [7.6, 4.7], 4: [5.7, 4.0] };
    const BAND = { 2: [3.5, -3.75], 6: [7.0, -3.9], 8: [5.4, -6.6], 10: [9.8, -5.6] };

    // ---------------- the wash: brush close beside our own line, and the herd's dust hanging gold in the air over the sand
    // (new in round 10: both draw from a stream of their own, forked after every other this world takes)
    const wr = rng.fork('wash-brush');
    // (new in round 11: the eagle's own wander, from a stream of its own forked after every other this world takes)
    const egr = rng.fork('eagle');
    const BR_S = [], BR_L = [];                 // every bush's place in path coordinates: the herd parts round it (per frame, below)
    {
      // saxaul and tamarisk seven metres either side of the line we ride, one every six metres from the first strides to the foot of
      // the ramp; none on the right where the gazelles lie up (their own place in the land)
      const brushPick = (n) => { let k = 0; return () => {
        const d = 14 + (k + wr()) * ((dR0 + 26 - 14) / n); k++;
        const i = clamp(I0 + Math.round(d / DS), 2, NR - 3), sB = S0 + (i + 0.5) * DS;
        let lat = wr.sign() * wr.range(6.3, 7.9);
        if (lat > 0 && sB > sGaz - 8 && sB < sGaz + 46) lat = -lat;
        BR_S.push(sB); BR_L.push(lat);
        return [i, lat];
      }; };
      await scatterPlants(saxaulGeometry(wr), 14, 2, brushPick(14), () => wr.range(1.5, 2.2), 0.1, 'wash-saxaul', plantMat, 420, null, wr);
      await scatterPlants(tamariskGeometry(wr), 10, 2, brushPick(10), () => wr.range(1.25, 1.7), 0.08, 'wash-tamarisk', plantMat, 420, null, wr);
    }
    const NPUF = Math.round(150 * Math.max(0.6, detail)), PUF_SPAN = 62, PUF_BACK = 8;
    const pufS = new Float32Array(NPUF), pufL = new Float32Array(NPUF), pufK = new Float32Array(NPUF);
    const pufPos = new THREE.InstancedBufferAttribute(new Float32Array(NPUF * 4), 4), pufAux = new THREE.InstancedBufferAttribute(new Float32Array(NPUF * 4), 4);
    {
      for (let k = 0; k < NPUF; k++) {
        pufS[k] = wr.range(0, PUF_SPAN); pufL[k] = wr.range(-1, 1); pufK[k] = wr.range(0.6, 1);
        pufPos.array[k * 4 + 3] = wr(); pufAux.array[k * 4] = wr.range(1.5, 3.4);
      }
      pufPos.setUsage(THREE.DynamicDrawUsage); pufAux.setUsage(THREE.DynamicDrawUsage);
      const pg = new THREE.InstancedBufferGeometry();
      pg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
      pg.setAttribute('iPuff', pufPos); pg.setAttribute('iPuffA', pufAux); pg.instanceCount = NPUF;
      const pm = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: HAZE_VS, fragmentShader: HAZE_FS, fog: true, transparent: true, depthWrite: false }));
      pm.frustumCulled = false; pm.renderOrder = 5; pm.name = 'herd-dust'; scene.add(pm); disposables.push(pg);
    }
    await ctx.yield();

    // THE SHOWER'S CLOCK, written from the design's three places and nothing else. The hero keeps a clock of its own (uh) on which
    // the wet line stands at the Ribbon's west end at UH_W and at its east end at UH_E and runs straight between (hero.wet.frontAt).
    // The design: the line "enters the west end at u 0.38, passes under our own hooves at u 0.48 and leaves the east end at
    // u 0.72". So when we are at U_WEST the hero's clock reads UH_W, when we are at U_EAST it reads UH_E, and when we are at
    // U_UNDER it reads UH_UNDER: the reading at which the line lies over the route's own point of u 0.48 (that point's place
    // down the storm's heading, read back through the hero's straight law; about 0.51, a little different on every visit because
    // the route's bends are). Straight between those three, straight from the flight's start (0, 0) to the first and from the
    // last to the flight's end (1, 1). Every hour of the day keeps this one clock (before sunrise it times the sunrise line)
    const U_WEST = 0.38, U_UNDER = 0.48, U_EAST = 0.72, UH_W = 0.38, UH_E = 0.72;
    const wdx = hero.wet.dir.x, wdy = hero.wet.dir.y, shP = new THREE.Vector3();
    const fw0 = hero.wet.frontAt(UH_W), fw1 = hero.wet.frontAt(UH_E);
    const wqOf = (u) => { path.pointAt(u, shP); return shP.x * wdx + shP.z * wdy; };      // the route's own point of u, in metres down the storm's heading
    const UH_UNDER = UH_W + (UH_E - UH_W) * (wqOf(U_UNDER) - fw0) / Math.max(1e-3, fw1 - fw0);
    const showerU = (u) => u < U_WEST ? u * (UH_W / U_WEST) : u < U_UNDER ? lerp(UH_W, UH_UNDER, (u - U_WEST) / (U_UNDER - U_WEST)) : u < U_EAST ? lerp(UH_UNDER, UH_E, (u - U_UNDER) / (U_EAST - U_UNDER)) : lerp(UH_E, 1, (u - U_EAST) / (1 - U_EAST));
    // THE RAIN'S LEAD. The design has the first drops at u 0.46 and the line under us at u 0.48: the rain's leading edge runs a
    // fixed distance ahead of the wet line down the storm's heading, and that distance is how far the route's own point of u 0.46
    // lies ahead of where the clock has the line when we are there (some 55 m). Nothing else times the rain's coming
    const U_DROPS = 0.46;
    const RAIN_LEAD = Math.max(1, wqOf(U_DROPS) - hero.wet.frontAt(showerU(U_DROPS)));
    // THE CLOUD'S BREADTH. The cloud's shadow is one band that travels with the wet line: its leading edge at the line (the hero
    // sets that), its trailing edge CLOUD_BREADTH metres behind the line down the storm's heading, the same all flight. The design
    // has the sun break at u 0.60: the breadth is what brings the trailing edge over the route's own point of u 0.60 when we are
    // there, the line's place by the clock at that moment less that point's place (190 to 215 m, as the route's bends fall). The hero draws the band; nothing
    // here reads the camera's place for it (below it is only asked whether the edge has passed over us)
    const U_BREAK = 0.60;
    const CLOUD_BREADTH = Math.max(1, hero.wet.frontAt(showerU(U_BREAK)) - wqOf(U_BREAK));
    hero.setCloudBreadth(CLOUD_BREADTH);
    const stormOn = hour === 'dawn' ? 0 : 1;

    await ctx.yield();
    await skyA.prewarm(ctx.renderer, null, scene);
    if (skyB) await skyB.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // THE EAGLE'S STATION, by the ridge. A ridge-soaring eagle holds the band of rising air that the rim of a crest throws up, and
    // the design has him on our right ("ridge-soars 12 m to our right and 3 m up from u 0.40 to 0.68"). So he flies over the Knife's
    // right rim: EAGLE_MARGIN outside the crest's own right edge at his row (WR: the rim is where the ground begins to fall away;
    // a metre and a half outside it his 2.1 m span is clear of the horses that run the edge), never nearer the route's line than
    // EAGLE_MIN_RIGHT (two wingspans: clear of the file on the crest), EAGLE_UP above the eye's own height, and EAGLE_RANGE from
    // the eye: his place ahead of us along the route is what is left of that range once his distance to the right and his height
    // are taken from it. He is on that station from the design's first beat to its last. Before the first he slides in from the
    // right, off the open slope, over EAGLE_SLIDE of route (60 m: three and a half seconds at our pace, in which a gliding eagle
    // making some 16 m/s across his own line covers EAGLE_OFF, 60 m), coming down from EAGLE_HIGH above his station (8 m in
    // those 60: a glide of one in eight); after the last he peels away to the right the same way. He is in the world from the
    // start of the one slide to the end of the other, at his true size throughout
    const EAGLE_RANGE = 12, EAGLE_UP = 3.0, EAGLE_MARGIN = 1.5, EAGLE_MIN_RIGHT = 4.2, EAGLE_SLIDE = 60, EAGLE_OFF = 60, EAGLE_HIGH = 8;
    const U_EAGLE_IN = 0.40, U_EAGLE_OUT = 0.68;            // the design's two beats
    const EGW = [egr.range(0.17, 0.25), egr.range(0, 6.28), egr.range(0.27, 0.37), egr.range(0, 6.28), egr.range(0.21, 0.31), egr.range(0, 6.28), egr.range(0.11, 0.17), egr.range(0, 6.28)];
    const EGH = [egr.range(0, 6.28), egr.range(0, 6.28), egr.range(0, 6.28)];      // the phases of his head's turn, its dip and his tail's twist
    const egA = { a: 0, r: 0, h: 0, far: 0, out: 0 }, egB = { a: 0, r: 0, h: 0, far: 0, out: 0 };
    const rimAt = (s) => { const r = clamp(rowOf(s), 0, NR - 1.001), i = r | 0; return Math.max(EAGLE_MIN_RIGHT, lerp(WR[i], WR[i + 1], r - i) + EAGLE_MARGIN); };
    // his station when we are at s metres along the route: metres ahead of us (a), to the right of the route's line (r), above the eye (h)
    const eagleSlot = (s, o) => {
      const far = 1 - ss(U_EAGLE_IN * L - EAGLE_SLIDE, U_EAGLE_IN * L, s), out = ss(U_EAGLE_OUT * L, U_EAGLE_OUT * L + EAGLE_SLIDE, s);
      o.far = far; o.out = out;
      const lim = EAGLE_RANGE * EAGLE_RANGE - EAGLE_UP * EAGLE_UP;
      let r = rimAt(s), a = Math.sqrt(Math.max(4, lim - r * r));
      r = rimAt(s + a); a = Math.sqrt(Math.max(4, lim - r * r));      // (the rim at his own row, not at ours)
      o.a = a;
      o.r = r + EAGLE_OFF * (far * far + out * out);
      o.h = EAGLE_UP + EAGLE_HIGH * (far + out);
      return o;
    };

    // ---------------- per frame
    let G = 0, Gt = 0, lastS = -1, lastT = -1, TR = 0, speed = VNOM, hearW = 0, hearB = 0;
    const mtxS = new THREE.Matrix4();
    const skyBase = U.uSkyCol.value.clone(), bounceBase = U.uBounce.value.clone(), gazPos = new THREE.Vector3();
    // under the cloud the fill is the grey light of the cloud itself, brighter and nearly neutral, so that wet red and ochre keep their colour
    const stormFill = hour === 'night' ? skyBase.clone().multiplyScalar(1.12) : hour === 'golden' ? new THREE.Vector3(0.365, 0.36, 0.39) : new THREE.Vector3(0.345, 0.35, 0.37);
    const camP = new THREE.Vector3(), camD = new THREE.Vector3(), Y_AXIS = new THREE.Vector3(0, 1, 0), inv = { x: 0, z: 0, tx: 0, tz: 0 };
    const pace = (u) => 1.05 - 0.24 * bell4(u, 0.30, 0.38, 0.62, 0.70) + 0.07 * bell4(u, 0.70, 0.78, 0.85, 0.91) + 0.06 * (1 - ss(0.06, 0.2, u));
    const update = (dt, time, camera, u) => {
      const camS = u * L;
      if (lastT < 0) { lastT = time; lastS = camS; }
      const dS = camS - lastS, dT = Math.max(0, Math.min(2, time - lastT));
      if (dS > 1e-4 && dS < 4) { G += dS; if (dt > 1e-4) speed += (clamp(dS / dt, 8, 30) - speed) * Math.min(1, dt * 3); } else { G += VNOM * dT; Gt += VNOM * dT; }
      const GS = camS + Gt;                                  // every stride is counted from our own place on the path: a held frame still gallops, and no two places show the same footfall
      lastS = camS; lastT = time;
      if (u <= 0) TR = (time * VNOM) % 150;
      const kT = 1 - ss(0, 0.045, u);
      const uh = showerU(u);
      camera.getWorldPosition(camP);
      const wqCam = camP.x * wdx + camP.z * wdy;
      hero.setProgress(uh);                                  // (the hero sets the wet line and, CLOUD_BREADTH behind it, the cloud's trailing edge)
      // where the weather stands against our own place, in metres down the line's heading: everything the storm does round us
      // (the rain on us, the tear in the cloud, the curtain leaving, the pinned ears) is drawn from these two distances
      const stormHere = U.uShade.value.x > -8990 ? 1 : 0;
      const lineAhead = U.uFront.value - wqCam;              // the wet line ahead of us (negative: it is still behind us)
      const edgeBehind = wqCam - U.uShade.value.x;           // the cloud's trailing edge behind us (negative: it has gone over)
      hero.update(dt, time, camera);
      timeU.value = time;

      // weather over us. The storm's grey light and its thick air come over with its dome (the site's own keys) and go as the
      // cloud's trailing edge goes over our own place: clearK is how far it has gone over, across the same 75 m either side of
      // the edge that the edge of its shadow has on the land. Behind the edge the open sky is the fill again, and brighter by
      // the light the lit land throws back (on a morning with no shower that comes by the site's own key)
      const clearK = stormHere * (1 - ss(-75, 75, edgeBehind));
      const sB = stormOn * ss(0.20, 0.34, u) * (1 - 0.5 * clearK);
      const gapIn = ss(dM - 40, dM + 40, u * L0);
      U.uSkyCol.value.copy(skyBase).lerp(stormFill, 0.85 * ss(0.24, 0.36, u) * (1 - clearK) * stormOn).multiplyScalar(1 + 0.3 * (stormHere ? clearK : ss(0.50, 0.68, u)) + 0.1 * gapIn + (hour === 'dawn' ? 0.9 * (1 - ss(0.2, 0.6, u)) : 0));      // (before sunrise the whole sky is the lamp)
      U.uBounce.value.copy(bounceBase).multiplyScalar(1 + 1.6 * gapIn);
      // (the storm dome's fade: the site's own line, as the site has it)
      if (skyB) { skyB.setOpacity(hour === 'dawn' ? 0 : ss(0.20, 0.34, u)); skyB.update(dt, time, camera); }   // ends at full strength at u 0.34, where every view so far has shown the dome whole
      skyA.update(dt, time, camera);
      scene.fog.color.copy(fogA).lerp(fogB, sB * 0.7); scene.fog.density = LK.dens * (1 + 0.1 * sB) * (0.7 + 0.3 * ss(0.05, 0.22, u)) * (1 - 0.3 * ss(0.30, 0.42, u));      // the first air is clear: the Ribbon stands sharp in the notch of the wash
      if (cell) cell.update(dt, time, camera);
      ridges.update(dt, time, camera);
      // the rain on us: its first drops as the rain's leading edge reaches us (RAIN_LEAD ahead of the wet line), all of it as the
      // line itself comes under us; it thins out in the sun for a few hundred metres after the cloud's edge has gone over
      const rainAmt = stormHere * ss(-RAIN_LEAD, 0, lineAhead) * (1 - ss(100, 560, -edgeBehind));
      // how much of the low sun reaches us: none under the cloud band, all of it once its trailing edge has gone over
      const sunHere = U.uShade2.value.x * clearK;
      if (rain) { rain.setOpacity(rainAmt * 0.9); rain.update && rain.update(dt, time, camera); }
      if (veils) { veilU.uEye.value.copy(camP); veilU.uVeilK.value.set(0.9 * rainAmt, sunHere, 0.3, 0); }
      // the sun breaks through: the tear in the cloud up-sun shows while the cloud's trailing edge stands within a few hundred
      // metres of us, behind or ahead. It throws no shafts
      if (breaks.length) breaks[0].uBrk.value.set(0, 0.85 * (hour === 'night' ? 0.45 : 1) * stormHere * (1 - ss(230, 420, edgeBehind)) * (1 - ss(150, 600, -edgeBehind)), time, 0);
      // as the cloud's edge comes over us the storm is leaving: gold shreds under its base, then its curtain down the line's heading
      { const kA = LK.storm ? stormHere : 0; aftU.uAft.value.set(0, kA * (1 - ss(-150, 205, edgeBehind)), kA * ss(30, 370, -edgeBehind), time); }
      // the ring's own light: on the walls, the wet floor and the coats (uRing), and in the air round it
      // (by our distance from the ring in metres: it comes up over the last 240 m, and close to it its own glare is drawn in so the
      // walls beside it keep their beds)
      const dRing = camP.distanceTo(ringPos), ringK = 1 - ss(96, 240, dRing);
      U.uRing.value.w = 2.3 * ringK * (1 - 0.3 * (1 - ss(12, 80, dRing)));
      haloU.uHaloK.value.x = 0.64 * ringK * (1 - 0.55 * (1 - ss(28, 88, dRing))) * ss(1.6, 22.4, dRing);
      haloU.uHaloK.value.z = time;
      if (mist) mist.update && mist.update(dt, time, camera);

      // the herd. Through the portal (u = 0) it streams past on a 150 m treadmill, except the two mares of the first
      // frame, who hold 14 m ahead of the entry and close up with the arriving camera
      const wG = bell4(u, 0.07, 0.095, 0.16, 0.20), wS = bell4(u, 0.19, 0.21, 0.272, 0.298);
      const wGapF = ss(0.775, 0.85, u);
      const wBand = bell4(u, 0.30, 0.335, 0.57, 0.63), wDam = bell4(u, 0.48, 0.55, 0.75, 0.80), wFile = bell4(u, 0.30, 0.36, 0.60, 0.66), wFoal = bell4(u, 0.565, 0.60, 0.74, 0.79);
      const camSv = u > 0 ? camS : clamp((camP.x - PX[I0]) * TX[I0] + (camP.z - PZ[I0]) * TZ[I0], -60, 0);
      for (let j = 0; j < NA; j++) {
        const o = SL[j], k = j * 4;
        let s, lat, gait = 1, rear = 0, yawOff = 0, size = o.size, hop = 0, stride = STRIDE * (o.foal ? 0.75 : 1), phase;
        if (o.cls === 5) {                                   // goitered gazelles flush from the feather grass and bound away, black tails up
          const x = u - o.lane, run = x <= 0 ? 0 : (x - 0.012 * (1 - Math.exp(-x / 0.012))) * L * 1.45;
          s = sGaz + o.ahead + run; gait = ss(0, 0.004, x);
          { const rg = Math.round(rowOf(s)); lat = Math.min(o.bench + 30 * ss(0.03, 0.22, x), lerp(WR[rg] - 0.6, 99, ss(dR1 + 34, dR1 + 64, PD[rg]))); }      // up the ramp along the Wing's foot, then away over the bench
          phase = run / 3.6 + o.ph; phase -= Math.floor(phase);
          const hp = ((phase - 0.66 + 1) % 1) / 0.40; if (hp < 1) hop = 0.95 * Math.sin(Math.PI * hp) * gait;      // stotting
          size *= 1 - ss(0.25, 0.30, x); yawOff = -0.5 * ss(0.006, 0.05, x) * (1 - ss(0.16, 0.24, x));
        } else {
          let ah = o.ahead + (o.stag ? o.stag * (1 - Math.min(1, (WL[Math.round(rowOf(camS + o.ahead))] + WR[Math.round(rowOf(camS + o.ahead))]) / 18)) : 0);
          if (o.cls === 3) ah += 70 * (1 - ss(0.0, 0.14, u)) - 190 * ss(0.52, 0.76, u);
          const bd = BAND[j];
          if (bd) ah = lerp(ah, bd[0] + 6.5 * (1 - ss(0.345, 0.41, u)) + 4.5 * ss(0.48, 0.57, u), wBand);       // whole in view ahead of our shoulder at the top-out, alongside in the saddle, drawing ahead as we climb out of it
          if (j === 3 || j === 4) ah = lerp(lerp(ah, j === 3 ? 10.5 : 8.6, wDam), j === 3 ? 8.4 : 5.5, wFoal);      // in the sun patch the foal runs at our right knee, its dam a length ahead of it
          if (GAPF[j]) ah = lerp(ah, GAPF[j][0], wGapF);                       // four of them run the gap close beside us, into the ring's light
          if (j > 11 && j < 15) ah *= 1 - 0.45 * wFile;                        // the tail of the file runs close ahead of us on the crest
          // the right flank opens where the gazelles flush and the left where the stallion wheels: nothing between them and us
          if (j > 5 || j === 3 || j === 4 || j === 2) {
            if (o.side > 0 && o.cls !== 0 && o.cls !== 3 && ah > -5 && ah < 22) ah = lerp(ah, 22 + 0.5 * (ah + 5), wG);
            if (o.side < 0 && o.cls !== 0 && ah > -10 && ah < 20) ah = lerp(ah, 20 + 0.55 * (ah + 10), wS);
          }
          let rel;
          // seen through the portal the two mares stand just inside the entry plane (anything nearer the portal's camera is cut away),
          // drawn larger so that they hold a sixth of the opening; as the camera closes they shrink to their true size and draw ahead to their 14 m
          const kM = u > 0 ? 1 : ss(-14, 0, camSv);
          if (j < 2) { rel = u > 0 ? ah + 0.5 * Math.sin(time * o.wf + o.wp) : lerp(1.5 + 0.9 * j, ah, kM) - camSv; if (u <= 0) size *= 1 + 0.6 * (1 - ss(-26, -4, camSv)); }
          else {
            const wrap = ((TR + ah + 40) % 150 + 150) % 150 - 40;
            rel = ah + o.wa * (bd ? 1 - 0.75 * wBand : 1) * Math.sin(time * o.wf + o.wp) + kT * (wrap - ah);
            if (kT > 0) size *= lerp(1, ss(-40, -33, wrap) * (1 - ss(98, 110, wrap)), kT);
          }
          s = Math.max(S0 + 3, (j < 2 ? camSv : camS) + rel);
          const row = Math.round(rowOf(s));
          lat = laneLat(o, row);
          if (o.cls === 1) lat += 0.5 * Math.sin(time * o.wf * 1.4 + o.wp * 2);
          if (o.cls === 4) lat = lerp(Math.min(10.5 + 2 * o.lane, WR[row] - 0.6), lat, ss(0.10, 0.30, u));
          if (o.side > 0 && (o.cls === 1 || o.cls === 4) && j !== 5) lat = lerp(lat, 3.4 + 1.5 * o.lane, wG * (1 - ss(24, 40, s - camS)));
          if (bd) lat = lerp(lat, bd[1], wBand);
          if (j === 3) lat = lerp(lerp(lat, 3.9, wDam), 4.9, wFoal);
          if (j === 4) lat = lerp(lerp(lat, 2.9, wDam), 3.75, wFoal);
          if (GAPF[j]) lat = lerp(lat, GAPF[j][1], wGapF);
          if (j === 5) {                                     // the stallion half-rears on the ramp rim, side on against the sky, wheels and drives the rear
            const go = ss(0.278, 0.33, u);
            s = lerp(sStal, s, go); lat = lerp(STAL_LAT, lat, go); gait = ss(0.272, 0.296, u);
            rear = bell4(u, 0.204, 0.232, 0.259, 0.278);
            yawOff = lerp(Math.PI, 2.25, ss(0.20, 0.236, u)) * (1 - ss(0.262, 0.302, u));
            size = o.size;
          } else {
            const ds = Math.abs(s - camS);
            let need = (j < 2 ? kM : 1) * 3.7 * (1 - ss(6, 9, ds));
            // (on a flood visit the left of the crest is the bank of the wash: a horse that runs its edge beside us keeps a metre
            // of bank outside its hooves, and is let that much nearer our own line)
            if (o.hug && lat < 0) { const cwH = chanW(PD[row]); if (cwH > 0) need = Math.min(need, lerp(need, Math.max(2.4, WL[row] - 1.1), cwH)); }
            if (Math.abs(lat) < need) lat = (lat === 0 ? o.side : Math.sign(lat)) * need;
            if (o.cls === 0 && j > 1) lat += o.side * 3.6 * kT * (1 - ss(6, 16, s - camS));
          }
          phase = GS / stride + o.ph; phase -= Math.floor(phase);
        }
        // (the brush of the wash stands in the herd's lanes: every animal swings 2 m clear of a bush as it comes up to it)
        for (let b = 0; b < BR_S.length; b++) {
          const ds = Math.abs(s - BR_S[b]);
          if (ds < 9) { const dl = lat - BR_L[b], ad = Math.abs(dl); if (ad < 2.1) lat = BR_L[b] + (dl >= 0 ? 1 : -1) * lerp(ad, 2.1, 1 - ss(2.5, 9, ds)); }
        }
        toWorld(s, lat, inv);
        const ri = Math.round(rowOf(s)), inGap = PD[ri] > dM - 20;
        let y = groundAt(s, lat); if (inGap) y = Math.max(y, PY[ri]);
        const y1 = groundAt(s + 1, lat), y0 = groundAt(s - 1, lat);
        aPos[k] = inv.x; aPos[k + 1] = y + hop; aPos[k + 2] = inv.z; aPos[k + 3] = Math.atan2(inv.tx, inv.tz) + yawOff;
        aPose[k] = phase; aPose[k + 1] = inGap ? 0 : Math.atan2(y1 - y0, 2) * (1 - rear); aPose[k + 2] = gait; aPose[k + 3] = rear;
        aAux[k] = size; aAux[k + 1] = o.tint * (inGap ? (lat < 0 ? 0.8 : 0.84) : 1);
        aPath[k] = s; aPath[k + 1] = lat; aPath[k + 2] = inv.tx; aPath[k + 3] = inv.tz;
        if (j === 5) stalPos.set(inv.x, y + 1.5, inv.z);
        if (j === 2) bandPoi.set(inv.x + inv.tx * 3, y + 1.1, inv.z + inv.tz * 3);
        if (j === G0 + 3) gazPos.set(inv.x, y + 0.9, inv.z);
      }
      { const sw = Math.min(camS + 46, dR1 - 6), rw = Math.round(rowOf(sw)); toWorld(sw, 27, inv); wingPoi.set(inv.x, PY[rw] + 15, inv.z); }      // the Wing's wall, ahead on the right
      for (const at of dyn) at.needsUpdate = true;
      for (const lc of lodChunks) lc[0].visible = lc[2] > camSv - 25 && lc[1] < camSv + lc[3];
      // the Wing's wall is one mesh in the path's own rows: what lies more than 36 m behind our shoulder is not sent to be drawn
      // (a rule in path distance, the same all flight; seen through the portal before us, at u 0, all of it is drawn)
      { const w0 = clamp(Math.floor(rowOf(camSv - 36)), 0, wingRows - 1); wingGeo.setDrawRange(w0 * wingRowIdx, Infinity); }
      dustU.uSpeed.value = speed;
      // the herd's dust: puffs that stand where they were raised (fixed in the land, a window of them carried along with us from
      // 8 m behind to 54 m ahead), thick over the sand of the wash, thin on the clay of the crest, none on the entry apron; the
      // shader takes it off wet ground
      for (let k = 0; k < NPUF; k++) {
        const ah = (((pufS[k] - camSv + PUF_BACK) % PUF_SPAN) + PUF_SPAN) % PUF_SPAN - PUF_BACK, sp = camSv + ah, rw = Math.round(rowOf(sp));
        const lat = pufL[k] * (Math.min(13, pufL[k] < 0 ? WL[rw] : WR[rw]) - 0.4);
        toWorld(sp, lat, inv);
        const o4 = k * 4;
        pufPos.array[o4] = inv.x; pufPos.array[o4 + 1] = groundAt(sp, lat); pufPos.array[o4 + 2] = inv.z;
        pufAux.array[o4 + 1] = pufK[k] * (0.08 + 0.92 * (1 - ss(dR0 + 20, dR0 + 70, PD[rw]))) * (1 - ss(40, 54, ah)) * ss(-PUF_BACK, -3, ah) * ss(0, 6, sp);
      }
      pufPos.needsUpdate = true; pufAux.needsUpdate = true;

      // our own animal rides with the camera
      apron.visible = u < 0.05; stalShade.visible = u < 0.3;
      // the animal runs where the path goes while our eyes wander: it swings across the lower edge of the frame as the gaze
      // turns to the Ribbon or the herd and leans into every bend; its head turns to what it hears, its ears flick
      mount.visible = u > 0;
      camera.getWorldDirection(camD);
      const rowM = Math.round(rowOf(camS + 7));
      let yawM = Math.atan2(-TX[rowM], -TZ[rowM]) - Math.atan2(-camD.x, -camD.z);
      yawM -= Math.round(yawM / 6.2832) * 6.2832;
      yawM = clamp(0.24 * yawM, -0.075, 0.075) + 0.02 * Math.sin(time * 0.37 + 1.3) + 0.035 * Math.sin(u * 23 + 1);      // (never far: its crest must run away from us up the frame, not across it)      // it looks about as it runs: never square ahead for long
      // whatever the field of view (a phone held upright sees much further down) the animal keeps its place and its size in the frame
      const kf = Math.tan(0.5 * (camera.fov || 62) * Math.PI / 180) / 0.6009;
      mount.matrix.copy(camera.matrixWorld).multiply(mtx.makeRotationY(yawM)).multiply(mtxS.makeScale(kf, kf, 1)); mount.matrixWorldNeedsUpdate = true;
      const ph = GS / STRIDE, flick = (a) => { const q = Math.max(0, Math.sin(a)); return q * q * q * q * q * q; };
      // ears and head answer what is there, by its bearing off our own line and its distance from us: the right ear swivels to
      // the gazelles while they are within forty metres and not behind us, the left to the stallion; the head turns a little the
      // same way, and to the lead mare when she runs close. Both ears go back with the rain that falls on us (its first drops lay
      // them half back, the body of the shower flat) and come up together as the cloud's edge goes over
      const rowE = Math.round(rowOf(camS)), hx = TX[rowE], hz = TZ[rowE];
      const hear = (P, far) => {                             // [how much of it is heard, its bearing to the right of our line]
        const dx = P.x - camP.x, dz = P.z - camP.z, al = dx * hx + dz * hz, rt = dz * hx - dx * hz, d = Math.hypot(al, rt) + 1e-3;
        hearW = (1 - ss(0.6 * far, far, d)) * ss(-0.45, 0.15, al / d); hearB = clamp(Math.atan2(rt, al), -1.1, 1.1);
      };
      hear(gazPos, 40); const wGz = u > 0 ? hearW : 0, bGz = hearB;
      hear(stalPos, 44); const wSt = u > 0 ? hearW : 0, bSt = hearB;
      hear(bandPoi, 12); const wBd = u > 0 ? hearW : 0, bBd = hearB;
      const earL = -bSt * wSt + 0.10 * Math.sin(time * 0.7) + 0.35 * flick(time * 1.3 + 0.4);
      const earR = -bGz * wGz + 0.10 * Math.sin(time * 0.9 + 2) - 0.35 * flick(time * 1.05 + 2.6);
      const pinB = stormHere * ss(-60, 10, lineAhead) * (1 - ss(20, 200, -edgeBehind));
      rideU.value.set(ph - Math.floor(ph), earL, earR, pinB);
      ride2U.value.set(0.013 + 0.013 * Math.sin(u * 37 + 2), 0.35 * (0.16 * bGz * wGz + 0.16 * bSt * wSt + 0.10 * bBd * wBd + 0.05 * Math.sin(time * 0.23 + 0.6) + 0.03 * Math.sin(time * 0.61 + 2.1)), 0, 0);

      // THE EAGLE flies a station of the route, as the horses do: by our own arc length he holds the lift over the Knife's right rim
      // (see where his station is set), with a metre of slow wander of his own. He slides in from the right before the design's
      // first beat and peels away to the right after its last, and is in the world between the start of the one slide and the
      // end of the other
      {
        const EDS = 2;                                       // (his track's heading: where his station stands two metres further along the route)
        eagleSlot(camS, egA); eagleSlot(camS + EDS, egB);
        const sld = Math.max(egA.far, egA.out), wob = 1 - 0.7 * sld;      // (his wander, in metres: along, across, up)
        const sE = camS + egA.a + wob * (0.9 * Math.sin(time * EGW[0] + EGW[1]) + 0.4 * Math.sin(time * EGW[0] * 2.3 + EGW[3]));
        const latE = egA.r + wob * (0.42 * Math.sin(time * EGW[2] + EGW[3]) + 0.16 * Math.sin(time * EGW[2] * 2.7 + EGW[5]));
        const rC = clamp(rowOf(camS), 0, NR - 1.001), iC = rC | 0;
        toWorld(sE, latE, inv);
        let yE = lerp(PY[iC], PY[iC + 1], rC - iC) + EYE + egA.h + wob * 0.32 * Math.sin(time * EGW[4] + EGW[5]);
        yE = Math.max(yE, groundAt(sE, clamp(latE, -40, 40)) + 2.6);
        if (sld > 0.02) yE = Math.max(yE, landAt(inv.x, inv.z) + 6);      // (out over the open slope he clears whatever lies under him)
        raptor.position.set(inv.x, yE, inv.z);
        // he flies the way he is going (his station's own drift against the route), crabbed a little toward the Ribbon into the storm's
        // wind and with his right wing dropped: from our seat, behind and below him, that turns the underside of both wings, the
        // wedge of the tail and the fingers toward us, where a bird flown square away from the eye is one thin line. He banks to
        // the right through the turn that ends his slide in, as through the one that begins his slide out
        const trk = Math.atan2(egB.r - egA.r, EDS + egB.a - egA.a);
        const stn = 1 - sld;
        raptor.rotation.set(0.15 + 0.04 * Math.sin(time * 0.5) - 0.15 * egA.out, Math.atan2(inv.tx, inv.tz) - trk + stn * (0.52 + 0.07 * Math.sin(time * EGW[6] + EGW[7])),
          stn * (0.25 + 0.07 * Math.cos(time * EGW[6] * 1.6 + EGW[1])) + 0.5 * (Math.sin(Math.min(1, egA.far * 3) * Math.PI) + Math.sin(Math.min(1, egA.out * 3) * Math.PI)), 'YXZ');
        raptor.visible = u > 0 && egA.far < 1 && egA.out < 1;
        headU.value.set(0.30 + 0.50 * Math.sin(time * 0.7 + EGH[0]), 0.24 + 0.10 * Math.sin(time * 0.9 + EGH[1]), 0.30 * Math.sin(time * 0.5 + EGH[2]), 0);
      }

      fauna.update(dt, time, camera, u);
      if (flood) {
        const F = floodFront(u), gate = ss(0.585, 0.612, u);
        floodU.value.set(F, time, gate, ss(0.74, 0.80, u));
        { const fr = clamp((F - 1 - FL_S0) / FL_DS, 0, FL_N - 1.001), r0 = fr | 0; toWorld(F - 1, flLat[r0] - 2, inv); borePos.set(inv.x, flY[r0] + 1.2, inv.z); }
        for (let k = 0; k < 12; k++) {                       // brush torn out by the bore tumbles in its front: three whole saxauls, then smaller wreckage
          const big = k < 3, al = Math.sin(k * 2.4 + 0.3 * Math.sin(time * 0.5 + k)) * (big ? 0.5 : 0.62);
          const b = (big ? 1.4 + k * 1.3 : 3 + k * 1.5) + 0.7 * Math.sin(time * 0.7 + k * 1.9), sb = F + floodLobe(al, time) - b;
          const fr = clamp((sb - FL_S0) / FL_DS, 0, FL_N - 1.001), r0 = fr | 0, ff = fr - r0;
          const hgt = lerp(flDep[r0], flDep[r0 + 1], ff) * gate * (ss(0, 1.6, b) * (1 - 0.35 * ss(8, 70, b)) + 0.5 * Math.exp(-(b - 1.9) * (b - 1.9) / 3.2));
          const scl = sb > FL_S0 + 4 && gate > 0.3 && hgt > 0.25 ? (big ? 1.25 + 0.14 * k : 0.62 + 0.22 * Math.sin(k * 3.1)) : 0;
          toWorld(sb, lerp(flLat[r0], flLat[r0 + 1], ff) + al * FL_HW, inv);
          pv.set(inv.x, lerp(flY[r0], flY[r0 + 1], ff) + hgt - 0.30 * scl + 0.12 * Math.sin(time * 2.3 + k), inv.z);
          eu.set(1.3 + 0.5 * Math.sin(time * 1.1 + k * 2), k * 1.7 + time * 0.4, time * (0.7 + 0.08 * k) + k); qt.setFromEuler(eu);
          sc.setScalar(scl);
          brush.setMatrixAt(k, mtx.compose(pv, qt, sc));
        }
        brush.instanceMatrix.needsUpdate = true;
      }
    };
    { const c0 = new THREE.PerspectiveCamera(62, 1.78, 0.3, 5200); c0.position.copy(path.start); c0.updateMatrixWorld(true); update(0, 0, c0, 0); }     // every animal starts in its place
    lastT = -1; G = 0; Gt = 0;

    return {
      scene, path, duration: DUR, pace,
      title: snow ? 'The Painted Ridges, October' : spring ? 'The Painted Ridges in May' : 'The Painted Ridges',
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 30, sway: 0.55, bank: 0.5 },
      pois: [
        // the gaze slides east along the Ribbon with the wet line and the sun behind it, and swings down to the mares beside us in the saddle
        { at: (time, u) => ribbonPoi.set(lerp(TO[0] - 70, seat.x - 185, ss(0.34, 0.62, u)), lerp(84, 60, ss(0.34, 0.62, u)), lerp(95, 70, ss(0.34, 0.62, u))), from: 0.20, to: 0.70, weight: 0.5 },
        { at: () => bandPoi, from: 0.315, to: 0.56, weight: 0.32 },
        { at: () => ringPos, from: 0.66, to: 0.97, weight: 0.6 },                             // down the drop the gaze goes to the ring in the gap
        { at: () => gazPos, from: 0.075, to: 0.185, weight: 0.42 },
        { at: () => wingPoi, from: 0.045, to: 0.235, weight: 0.4 },                            // up the ramp the gaze rests on the Wing's striped wall beside us
        { at: () => stalPos, from: 0.18, to: 0.295, weight: 0.55 },
        ...(flood ? [{ at: () => borePos, from: 0.655, to: 0.765, weight: 0.42 }] : []),      // on a flood visit we look down at the bore as we overhaul it
      ],
      portal: { shape: 'circle', radius: RING_R, color: hour === 'night' ? '#bcd0ff' : '#ffd9a0', glow: 1.5, revealDistance: 240, dewash: 0.6 },
      post: { exposure: LK.exposure, bloom: { strength: 0.26, radius: 0.6, threshold: 0.93 },
        grade: { saturation: 1.08, contrast: 1.05, tint: hour === 'night' ? '#e6ecff' : '#fff7ec', shadowTint: '#060a14', vignette: 0.3, grain: 0.02 } },
      ride: 'none',
      update,
      dispose() { for (const g of disposables) g.dispose(); skyA.dispose(); if (skyB) skyB.dispose(); },
    };
  },
};
