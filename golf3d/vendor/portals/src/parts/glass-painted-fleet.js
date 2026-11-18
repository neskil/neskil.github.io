// THE FLEET UNDER GLASS: hero set piece and the souwer (reverse-glass painting) material system for the
// world "glass-painted-fleet" (Saint-Louis, Senegal, painted on the back of a pane).
//
// COORDINATES (hero local space == the world's space, no rotation needed)
//   +Z = west, out to sea; -Z = east, inland. -X = north, +X = south. Mean water y = 0, waterline z = 0.
//   The beach climbs to y = 1 at z = -60. Hulls lie bows-to-sea with their bows at z ~ -22, 4 m apart
//   along X from x = -900 (north) to x = +300, with launch lanes around x = 0, -100, -200 ... +200.
//   Surf: a wave train of wavelength SEA.L rolling toward -Z, tall between z = 50 and z = 150.
//   The anchored pair and the portal seat are at anchors.portal (x = -100, z = 215).
//
// THE LOOK (one draw per batch)
//   makeSouwerMaterials(opts) returns { mat(defs), sea, sky, uniforms, P, update(time, camera) }.
//   mat({ hull, flag, instanced, side }) is an unlit ShaderMaterial for geometry made with the SB builder
//   below (attributes position, normal, aCol, aCol2, e, pt, mv):
//     ink    = the true surface: face borders and pattern edges, width wavering, >= 1.5 px, fwidth antialiased
//     enamel = flat colour looked up uGap metres behind the surface along the view ray (the visible gap);
//              where that lookup falls off the face the cream backing shows as a sliver
//     bronze = dull gold dashes twice as deep, on faces turned up or to the sun, brightening with the view
//   All colours are passed through enc(): the inverse of the engine's ACES curve, so flat enamel comes out
//   of post-processing at exactly the palette value. Use enc() for any colour you hand to these shaders.
//   SB: geometry accumulator. col(a,b) pat(id, scale, flags, seed) wave(freq, amp, phase) then quad / rect /
//   box / strip / disc. Pattern ids are in PAT, flags in FLG.
//
// buildHero(ctx, opts) opts: { mats, look: { wind, night, dom:[i,j] }, density, rare, portalAt:[x,z],
//   meet: { x, D, u1, z1, c }, moored: [...], anchored: [{ x, z, yaw, sc, sail }], mul }
//   -> { object, anchors, heightAt(x,z), setSurf(u, dt), update(dt,time,camera,u), ... }
//   anchored: big hulls at anchor on the sea that ride the swell; sail 0..2 gives one a mast, a painted sail and pennants
//   (sailGeometry). The convoy's boats carry the same rigs. mul: [r,g,b] folded into every colour before enc() (night).
import * as THREE from 'three';

export const PALETTE = ['#0B0B0E', '#1B49B5', '#12B5B0', '#E0322B', '#F5B81F', '#F4A3B5', '#FBF6E6', '#1F8A4C', '#7A1F1A'];
export const BRONZE = '#C08A2E';

// ---------- colour: inverse of post.js (x/0.6 -> ACES fit -> sRGB) so flat colours survive ----------
const INM = new THREE.Matrix3().set(0.59719, 0.35458, 0.04823, 0.07600, 0.90834, 0.01566, 0.02840, 0.13383, 0.83777);
const OUTM = new THREE.Matrix3().set(1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602);
const INMI = INM.clone().invert(), OUTMI = OUTM.clone().invert();
const _cv = new THREE.Vector3();
function unfit(y) {
  y = Math.min(0.93, Math.max(0.0005, y));
  const A = 1 - 0.983729 * y, B = 0.0245786 - 0.432951 * y, C = -(0.000090537 + 0.238081 * y);
  return (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
}
// mul: optional [r,g,b] applied to the linear display colour BEFORE the curve is inverted (a night tint that really darkens light enamels)
export function enc(c, gain = 1, mul = null) {
  const k = c.isColor ? c : new THREE.Color(c);
  _cv.set(k.r * gain, k.g * gain, k.b * gain); if (mul) _cv.set(_cv.x * mul[0], _cv.y * mul[1], _cv.z * mul[2]);
  _cv.applyMatrix3(OUTMI);
  _cv.set(unfit(_cv.x), unfit(_cv.y), unfit(_cv.z)).applyMatrix3(INMI);
  return new THREE.Color(Math.max(0, _cv.x) * 0.6, Math.max(0, _cv.y) * 0.6, Math.max(0, _cv.z) * 0.6);
}

export const PAT = { PLAIN: 0, STRIPE_V: 1, STRIPE_U: 2, DIAMOND: 3, CHEVRON: 4, CHECK: 5, COMB: 6, DOTS: 7, CRESCENT: 8, STAR: 9, EYE: 10,
  TILES: 11, BALUSTER: 12, LATTICE: 13, HATCH: 14, PLANKS: 15, STUDS: 16, BRACT: 17, LEAF: 18, DISC: 19, DROP: 20, DABS: 21, FROND: 22, FAN: 24,
  TRI: 25, CLOUD: 26, CURL: 27, ARCH: 28, DECK: 30 };
export const FLG = { NOBORDER: 1, GLOW: 2, NOBRONZE: 8, KEEP: 16, INKONLY: 32, FINE: 64 };

const GLSL_COMMON = /* glsl */`
float h11(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+1.),f.x), f.y); }
vec2 gFace;
// returns (sel, d): sel 0 colour A, 1 colour B, 2 hole, 3 ink fill, 4 bronze; d = metres to the nearest painted edge
vec2 pat(float id, vec2 p, float sc, float seed){
  vec2 q = p / max(sc, 1e-3); float sel = 0., d = 1e3;
  if (id < .5) { }
  else if (id < 1.5) { float f = fract(q.y); sel = step(.5, f); d = min(min(f, 1.-f), abs(f-.5)) * sc; }
  else if (id < 2.5) { float f = fract(q.x); sel = step(.5, f); d = min(min(f, 1.-f), abs(f-.5)) * sc; }
  else if (id < 3.5) { vec2 f = abs(fract(q)-.5); float m = f.x+f.y; sel = step(m, .33); d = abs(m-.33)*sc*.7; }
  else if (id < 4.5) { float f = fract(q.y + abs(fract(q.x)-.5)); sel = step(.5, f); d = min(min(f, 1.-f), abs(f-.5))*sc*.7; }
  else if (id < 5.5) { vec2 c = floor(q), f = fract(q); sel = mod(c.x+c.y, 2.); d = min(min(f.x,1.-f.x), min(f.y,1.-f.y))*sc; }
  else if (id < 6.5) { float fy = fract(q.y), fx = fract(q.x*2.5); float tooth = step(.5, fx);
    sel = fy > .62 ? 1. : (fy > .12 ? tooth : 0.);
    d = min(abs(fy-.62), abs(fy-.12)) * sc; if (fy > .12 && fy < .62) d = min(d, min(min(fx,1.-fx), abs(fx-.5))*sc*.4); }
  else if (id < 7.5) { float r = length(fract(q)-.5); sel = step(r, .27); d = abs(r-.27)*sc; }
  else if (id < 8.5) { vec2 f = fract(q)-.5; float dc = max(length(f)-.38, .31-length(f-vec2(.15,.07))); sel = step(dc, 0.); d = abs(dc)*sc; }
  else if (id < 9.5) { vec2 f = fract(q)-.5; float r = length(f); float a = atan(f.y, f.x + 1e-5);
    float c5 = cos(a*2.5); float ds = r - (.13 + .25*c5*c5*c5*c5); sel = step(ds, 0.); d = abs(ds)*sc*.6; }
  else if (id < 10.5) { vec2 f = (fract(q*vec2(.5,1.))-.5)*vec2(2.,1.);
    float de = max(length(f-vec2(0.,.42))-.74, length(f+vec2(0.,.42))-.74); float r = length(f);
    sel = de < 0. ? (r < .17 ? 3. : (r < .27 ? 0. : 1.)) : 0.; d = min(abs(de), abs(r-.27) + step(0., de))*sc; }
  else if (id < 11.5) { float row = floor(q.y); vec2 f = vec2(fract(q.x + .5*mod(row,2.)), fract(q.y));
    float r = length(f - vec2(.5, .62)); sel = step(.72, h21(vec2(floor(q.x + .5*mod(row,2.)), row) + seed*9.));
    d = (f.y < .62 ? abs(r-.5) : min(abs(r-.5), min(f.x, 1.-f.x)))*sc; }
  else if (id < 12.5) { float f = abs(fract(q.x)-.5); float vy = p.y/max(gFace.y,1e-3);
    float w = .2 + .1*sin(vy*12.566) ; float rail = step(vy, .1) + step(.86, vy);
    sel = (rail > .5 || f < w) ? 0. : 2.; d = min(abs(f-w)*sc, min(abs(vy-.1), abs(vy-.86))*gFace.y); }
  else if (id < 13.5) { float a = fract(q.x+q.y), b = fract(q.x-q.y); float bar = step(a,.2) + step(b,.2);
    float vy = p.y/max(gFace.y,1e-3); float ch = step(gFace.y - .5, p.y) + step(p.y, .35);
    sel = (bar + ch) > .5 ? 0. : 2.; d = min(min(abs(a-.2), a), min(abs(b-.2), b))*sc*.7; d = min(d, min(abs(p.y-.35), abs(gFace.y-.5-p.y))); }
  else if (id < 14.5) { d = min(abs(fract(q.x+q.y)-.5), abs(fract(q.x-q.y)-.5))*sc*.7; }
  else if (id < 15.5) { d = abs(fract(q.y)-.5)*sc; }
  else if (id < 16.5) { float r = length(fract(q)-.5); sel = r < .2 ? 4. : 0.; d = abs(r-.2)*sc; }
  else if (id < 18.5) { vec2 f = p/max(gFace,vec2(1e-3)) - .5; float dl = max(length(f-vec2(.38,0.)), length(f+vec2(.38,0.))) - .62;
    sel = dl < 0. ? 0. : 2.; d = id < 17.5 ? abs(f.x)*gFace.x + step(.3, abs(f.y)) : min(abs(dl)*gFace.x, abs(f.x)*gFace.x + step(0., dl)); }
  else if (id < 19.5) { vec2 f = p/max(gFace,vec2(1e-3)) - .5; float r = length(f); float a = atan(f.y, f.x + 1e-5);
    float n = floor(sc + .5); float sa = fract(a/6.2832*n);
    sel = r > .5 ? 2. : (n > .5 ? step(.5, sa) : 0.); d = abs(r-.5)*gFace.x; if (n > .5) d = min(d, min(min(sa,1.-sa),abs(sa-.5))*6.2832*r*gFace.x/n);
    if (seed > .5) { d = min(d, abs(r-.16)*gFace.x); if (r < .16) sel = 1.; } }
  else if (id < 20.5) { vec2 f = vec2(p.x/max(gFace.x,1e-3) - .5, p.y/max(gFace.y,1e-3));
    float dd = f.y < .3 ? length(vec2(f.x, (f.y-.3))) - .3 : abs(f.x) - .3*(1.-smoothstep(.3, 1., f.y));
    float hd = length(vec2(f.x, f.y-.86)*vec2(1., gFace.y/max(gFace.x,1e-3))) - .16;
    sel = min(dd, hd) < 0. ? (hd < 0. ? 3. : 0.) : 2.; d = abs(min(dd,hd))*gFace.x; }
  else if (id < 21.5) { vec2 c = floor(q); vec2 f = fract(q)-.5; float hh = h21(c + seed*3.); float a = hh*6.2832;
    vec2 r = vec2(cos(a)*f.x + sin(a)*f.y, -sin(a)*f.x + cos(a)*f.y);
    float dd = max(abs(r.x)-.3, abs(r.y + r.x*r.x*.9)-.055); sel = (hh > .45 && dd < 0.) ? 1. : 0.; }
  else if (id < 22.5) { float t = p.x/max(gFace.x,1e-3); float fy = abs(p.y/max(gFace.y,1e-3) - .5);
    float tooth = step(fract(q.x), .6); float w = .5*(1.-t*t)*(.25+.75*smoothstep(0.,.15,t));
    sel = (fy < .07 || (tooth > .5 && fy < w)) ? 0. : 2.; d = abs(fy-.07)*gFace.y; }
  else if (id < 24.5) { vec2 f = vec2((p.x/max(gFace.x,1e-3) - .5)*2., p.y/max(gFace.y,1e-3)); float r = length(f);
    float n = max(floor(sc+.5), 1.); float sa = fract(atan(f.y, f.x + 1e-5)/3.1416*n);
    sel = r > 1. ? 2. : (r < .25 ? 1. : step(.5, sa)); d = min(abs(r-1.), abs(r-.25))*gFace.y; d = min(d, min(min(sa,1.-sa),abs(sa-.5))*3.1416*r*gFace.y/n); }
  else if (id < 25.5) { vec2 f = p/max(gFace,vec2(1e-3)); float dd = abs(f.x-.5)*2. - f.y; sel = dd > 0. ? 2. : 0.; d = abs(dd)*gFace.x*.45; }
  else if (id < 26.5) { vec2 f = (p/max(gFace,vec2(1e-3)) - vec2(.5,.36))*vec2(gFace.x/max(gFace.y,1e-3), 1.);
    float dd = length(f)-.34; dd = min(dd, length(f-vec2(.42,-.06))-.27); dd = min(dd, length(f+vec2(.44,.08))-.25);
    dd = min(dd, length(f-vec2(.8,-.16))-.18); dd = min(dd, length(f+vec2(.82,.17))-.17); dd = min(dd, length(f-vec2(.16,.2))-.3);
    dd = max(dd, -.34 - f.y);
    float cu = abs(length(f-vec2(.1,.02))-.15) + step(f.x, .1)*step(f.y, .02);
    sel = dd < 0. ? 1. : 2.; d = min(abs(dd), dd < -.03 ? cu : 1.)*gFace.y; }
  else if (id < 27.5) { vec2 f = p/max(gFace,vec2(1e-3)); float r = length(f - vec2(.0, 1.));
    float c1 = abs(r - .82); float c2 = abs(length(f-vec2(.62,.4))-.2);
    sel = (c1 < .065 || (c2 < .055 && f.x > .4)) ? 3. : 2.; d = 1e3; }
  else if (id < 28.5) { vec2 f = vec2(abs(p.x/max(gFace.x,1e-3) - .5)*2., p.y/max(gFace.y,1e-3));
    float top = f.y - .62; float dd = top > 0. ? length(vec2(f.x, top/.38)) - 1. : f.x - 1.; sel = dd > 0. ? 2. : 0.; d = abs(dd)*gFace.x*.5;
    d = min(d, abs(fract(q.y)-.5)*sc); }
  return vec2(sel, d);
}
`;
export { GLSL_COMMON };

// ---------- the universal souwer material ----------
const VERT = /* glsl */`
attribute vec3 aCol; attribute vec3 aCol2; attribute vec4 e; attribute vec4 pt; attribute vec4 mv;
uniform float uTime; uniform vec4 uWind; uniform float uFlap;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vCol2; varying vec4 vE; varying vec4 vPt; flat varying float vSeed;
void main(){
  vec3 p = position; float iph = 0.; vSeed = 0.;
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
    mm = modelMatrix * instanceMatrix; iph = instanceMatrix[3].x*.37 + instanceMatrix[3].z*.23;
  #endif
  vCol = aCol; vCol2 = aCol2;
  #ifdef USE_INSTANCING_COLOR
    vSeed = instanceColor.r;
    #if !defined(HULL) && !defined(FLAG)
      vCol = aCol * instanceColor; 
    #endif
  #endif
  #ifdef FLAG
    float dc = length(cameraPosition - mm[3].xyz);
    if (mod(floor((pt.w + .5)/16.), 2.) > .5) p.xz *= max(1., dc/45.); else p.xy *= vec2(min(1. + dc/260., 2.6), min(1. + dc/400., 2.));
    iph += vSeed*40.;
  #endif
  float fr = abs(mv.x), am = mv.y, sway = 0.;
  if (am != 0.) {
    float ph = uTime*fr + mv.z + iph + (fr > 3. ? e.x*1.9 + e.y*.8 : 0.);
    float s = sin(ph) + (fr > 3. ? .45*sin(ph*2.3 + 1.) : 0.);
    if (am > 0.) p += normal * (am*mv.w*s*(fr > 3. ? uFlap : 1.)); else sway = -am*mv.w*s;
  }
  vec4 w = mm * vec4(p, 1.);
  w.xyz += uWind.xyz * sway;
  vW = w.xyz; vN = normalize(mat3(mm) * normal + vec3(0., 1e-6, 0.)); vE = e; vPt = pt;
  gl_Position = projectionMatrix * viewMatrix * w;
  #ifdef PROW
    gl_Position.z = (gl_Position.z + gl_Position.w) * .02 - gl_Position.w;      // our own prow is drawn in front of the sea
  #endif
}`;

const FRAG = /* glsl */`
uniform float uTime, uGap, uInk, uBronzeAmt, uFlagBronze; uniform vec3 uSun, uInkCol, uBack, uBronze, uTint; uniform vec3 uPal[9]; uniform vec2 uDom;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vCol2; varying vec4 vE; varying vec4 vPt; flat varying float vSeed;
${GLSL_COMMON}
float gHole, gSd, gSc; vec3 gMean;
vec3 pal(float i){ return uPal[int(clamp(i, 0., 8.) + .5)]; }
// per-boat choices: gSd is the boat's seed as a small integer (never the raw interpolated varying), hashed without sin
float hs(float k){ return h21(vec2(gSd, k)); }
#ifdef HULL
vec3 hullPaint(vec2 p, out float d){
  float L = gFace.x, v = p.y / gFace.y;
  float band = v < .34 ? 0. : (v < .7 ? 1. : 2.);
  float bowp = step(.34, v) * step(L*.79, p.x) * step(p.x, L*.985);
  float k = bowp > .5 ? 3. : band;
  float v0 = k > 2.5 ? .34 : (band < .5 ? 0. : (band < 1.5 ? .34 : .7)), v1 = k > 2.5 ? 1. : (band < .5 ? .34 : (band < 1.5 ? .7 : 1.));
  float h1 = hs(k*7. + 1.), h2 = hs(k*7. + 2.), h3 = hs(k*7. + 3.);
  float id = k > 2.5 ? (h1 < .42 ? 10. : (h1 < .72 ? 9. : 8.)) : floor(1. + h1*8.999);
  float ca = 1. + floor(h2*4.999), cb = 1. + floor(h3*4.999);
  if (hs(k*7. + 4.) < .55) ca = uDom.x;
  if (hs(k*7. + 5.) < .4) cb = uDom.y;
  if (abs(cb - ca) < .5) cb = 6.;
  if (id > 9.5) cb = 6.;
  float hb = (v1 - v0) * gFace.y;
  vec2 pl = vec2(p.x - (k > 2.5 ? L*.79 : 0.), (v - v0) * gFace.y);
  float sc = id < 1.5 ? hb : (id < 2.5 ? hb*1.6 : hb);
  if (id > 4.5 && id < 5.5) sc = hb*.5;
  if (id > 9.5) pl.x += .08*L - hb*2.;
  vec2 r = pat(id, pl, sc, 0.);
  d = min(r.y, min(abs(v-.34), abs(v-.7)) * gFace.y);
  if (v > .34) d = min(d, min(abs(p.x - L*.79), abs(p.x - L*.985)));
  // far away the pattern is replaced by the band's mean colour instead of turning to moire
  float fb = id < 2.5 ? .5 : (id < 3.5 ? .22 : (id < 6.5 ? .5 : (id < 7.5 ? .23 : (id < 9.5 ? .18 : .4))));
  gSc = (id > 4.5 && id < 5.5) ? sc : sc*.5; gMean = mix(pal(ca), pal(cb), fb);
  return r.x < .5 ? pal(ca) : (r.x < 1.5 ? pal(cb) : uInkCol);
}
#endif
#ifdef FLAG
vec3 flagPaint(vec2 p, out float d){
  vec2 f = p / max(gFace, vec2(1e-3)); float hz = step(.5, hs(3.)); float t = hz > .5 ? f.y : f.x;
  float n = 2. + floor(hs(5.)*1.99); float k = min(floor(t*n), n-1.), ft = fract(t*n);
  float blk = (hz > .5 ? gFace.y : gFace.x) / n;
  d = min(k > .5 ? ft : 1., k < n-1.5 ? 1.-ft : 1.) * blk;
  vec3 c = pal(1. + floor(hs(11. + k*3.)*5.999));
  gSc = blk; gMean = c;                 // the ink between blocks fades by the block's own size
  return c;
}
#endif
vec3 paint(vec2 p, out float d){
  gHole = 0.; gSc = -1.;
  float flags = floor(vPt.w + .5), seed = vPt.y;
  #ifdef HULL
    if (vPt.x < 29.5) return hullPaint(p, d);
    if (vPt.x > 30.5) { vec2 rb = pat(2., p, vPt.z, seed); d = rb.y; return rb.x < .5 ? pal(1. + floor(hs(77.)*4.999)) : pal(6.); }
  #endif
  #ifdef FLAG
    if (mod(floor(flags/16.), 2.) < .5) return flagPaint(p, d);
  #endif
  float id = vPt.x > 29.5 ? 2. : vPt.x;
  vec2 r = pat(id, p, vPt.z, seed); d = r.y;
  if (r.x > 1.5 && r.x < 2.5) gHole = 1.;
  // far away every repeating pattern settles to its mean colour instead of breaking into confetti
  if ((id > .5 && id < 7.5) || (id > 10.5 && id < 16.5)) {
    float fb = id < 2.5 ? .5 : (id < 3.5 ? .22 : (id < 5.5 ? .5 : (id < 6.5 ? .6 : (id < 7.5 ? .23 : (id < 11.5 ? .28 : 0.)))));
    float ks = (id > 5.5 && id < 6.5) ? .4 : ((id > 12.5 && id < 13.5) ? .6 : ((id > 6.5 && id < 7.5) || id > 15.5 ? .5 : 1.));
    gSc = vPt.z * ks; gMean = mix(vCol, vCol2, fb);
  }
  return r.x < .5 ? vCol : (r.x < 1.5 ? vCol2 : (r.x < 3.5 ? uInkCol : uBronze));
}
void main(){
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  vec3 N = normalize(vN); float nv = dot(N, V); if (nv < 0.) { N = -N; nv = -nv; }
  float ndv = max(nv, .3);
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); vec2 dux = dFdx(vE.xy), duy = dFdy(vE.xy);
  float px = max(max(length(dux), length(duy)), 1e-5);
  vec3 T = (N*nv - V) * (uGap / ndv);
  float a11 = dot(dpx,dpx), a12 = dot(dpx,dpy), a22 = dot(dpy,dpy), det = a11*a22 - a12*a12;
  vec2 sh = vec2(0.);
  if (det > 1e-14) { vec2 ab = vec2(a22*dot(T,dpx) - a12*dot(T,dpy), a11*dot(T,dpy) - a12*dot(T,dpx)) / det; sh = ab.x*dux + ab.y*duy; }
  float sl = length(sh); if (sl > .28) sh *= .28 / sl;
  gFace = vE.zw; gSd = floor(vSeed*4095. + .5);
  float flags = floor(vPt.w + .5);
  sh *= mix(1., .3, mod(floor(flags/64.), 2.));
  float noBorder = mod(flags, 2.), glow = mod(floor(flags/2.), 2.), noBronze = mod(floor(flags/8.), 2.), inkOnly = mod(floor(flags/32.), 2.);
  float dT, dE; 
  vec3 cT = paint(vE.xy, dT); float holeT = gHole;
  vec2 pe = vE.xy + sh;
  vec3 col = paint(pe, dE); float holeE = gHole;
  float sc = max(vPt.z, .05);
  float fLo = 1., fHi = 3., iLo = 1.2, iHi = 3.;
  #ifdef HULL
    fLo = 2.2; fHi = 6.; iLo = 2.6; iHi = 6.;      // far hulls settle to their band colours instead of shimmering
  #endif
  if (gSc > 0.) { sc = gSc; col = mix(gMean, col, smoothstep(fLo, fHi, gSc/px)); }
  float wob = .78 + .44*vn(vE.xy*1.7 + vPt.y*31. + vSeed*57.);
  float lw = max(uInk*wob*mix(1., .42, mod(floor(flags/64.), 2.)), .75*px);
  float bd = min(min(vE.x, vE.z - vE.x), min(vE.y, vE.w - vE.y));
  float inkB = (1. - noBorder) * (1. - smoothstep(lw*1.25 - px*.5, lw*1.25 + px*.5, bd)) * smoothstep(2.5, 6., min(vE.z, vE.w)/px) * (1. - holeT);
  float inkP = (1. - smoothstep(lw - px*.5, lw + px*.5, dT)) * (1. - smoothstep(120., 190., dist)) * smoothstep(iLo, iHi, sc/px);
  if (vPt.x > 16.5 && vPt.x < 25.5) inkP *= smoothstep(3., 8., min(vE.z, vE.w)/px);
  float ink = max(inkB, inkP);
  if ((holeE > .5 || inkOnly > .5) && ink < .5) discard;
  if (noBorder < .5 && holeE < .5 && (pe.x < 0. || pe.y < 0. || pe.x > vE.z || pe.y > vE.w)) col = uBack;
  // bronze: a third, deeper layer on what faces up and toward the sun
  vec2 bq = (vE.xy + sh*2.) * vec2(2.1, 6.5); float brow = floor(bq.y); bq.x += brow*.37;
  float dash = step(.6, h21(vec2(floor(bq.x), brow))) * step(abs(fract(bq.y)-.5), .24) * step(abs(fract(bq.x)-.5), .4);
  float sp = max(dot(N, normalize(uSun + V + vec3(0., 1e-4, 0.))), 0.); sp *= sp; sp *= sp; sp *= sp;
  float bm = smoothstep(.3, .8, dot(N, uSun)) * (1. - noBronze) * (1. - smoothstep(70., 150., dist)) * uBronzeAmt;
  col = mix(col, uBronze * (.72 + 1.2*sp), min(dash*bm, 1.));
  vec3 ic = uInkCol;
  #ifdef FLAG
    ic = mix(ic, uBronze*1.1, uFlagBronze * step(inkP, inkB));
  #endif
  col = mix(col, ic, ink);
  col *= mix(uTint, vec3(1.), glow);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- sky: one flat coat, a ruled horizon, optional sun disc / stars / crescent / squall ----------
const SKY_FRAG = /* glsl */`
uniform vec3 uSky, uSea, uInkCol, uBronze, uSunDisc, uSquall; uniform float uStars, uSquallAmt, uTime, uDisc;
uniform vec4 uCloud[8]; uniform vec2 uShear; uniform float uDrift; uniform vec3 uCloudCol;
varying vec3 vD;
${GLSL_COMMON}
float cloudSd(vec2 f){ float dd = length(f)-.34; dd = min(dd, length(f-vec2(.42,-.06))-.27); dd = min(dd, length(f+vec2(.44,.08))-.25);
  dd = min(dd, length(f-vec2(.8,-.16))-.18); dd = min(dd, length(f+vec2(.82,.17))-.17); dd = min(dd, length(f-vec2(.16,.2))-.3); return max(dd, -.3 - f.y); }
// the low cloud bank in the west: a flat base and a scalloped top that swells and thins, open over the portal
float bankTop(float az){ float ab = abs(az);
  float env = smoothstep(.13, .24, ab) * (1. - smoothstep(.78, 1.03, ab));
  float hump = .5 + .5*sin(az*5.3 + 1.1) * sin(az*2.1 + .4);
  float sc = abs(sin(az*23. + 1.6*sin(az*5.)));
  return .036 + env * (.006 + .058*hump) * (.4 + .6*sc); }
void main(){
  vec3 d = normalize(vD); float fy = max(fwidth(d.y), 1e-5);
  vec3 col = d.y > 0. ? uSky : uSea;
  // five small scalloped clouds: white behind, ink outline and one inner curl in front, the two layers shearing as the eye moves
  if (d.y > .03) {
    float az = atan(-d.x, d.z + 1e-5); float cink = 0.;
    if (abs(az) < 1.06 && d.y < .14) {
      float tp = bankTop(az), sl = (bankTop(az + .004) - bankTop(az - .004)) / .008;
      float tF = bankTop(az + uShear.x*4.), yF = d.y + uShear.y;
      float thick = smoothstep(.003, .008, tp - .036), wb = max(.0026, fy*1.1);
      col = mix(col, uCloudCol, step(.036, yF) * step(yF, tF) * step(.0035, tF - .036));
      float ed = min(abs(d.y - tp) / sqrt(1. + sl*sl), abs(d.y - .036));
      cink = (1. - smoothstep(wb, wb + fy, ed)) * step(.036 - wb - fy, d.y) * step(d.y, tp + wb + fy) * thick;
    }
    for (int i = 0; i < 8; i++) {
      vec4 c = uCloud[i]; float da = mod(az - c.x - uDrift + 3.14159, 6.28318) - 3.14159;
      vec2 p = vec2(da, d.y - c.y) / c.z * vec2(c.w, 1.);
      if (abs(p.x) < 1.3 && abs(p.y) < 1.) {
        float sI = cloudSd(p) * c.z, sF = cloudSd(p + uShear / c.z) * c.z; float w = max(.0032, fy*1.1);
        col = mix(col, uCloudCol, step(sF, 0.));
        cink = max(cink, 1. - smoothstep(w, w + fy, abs(sI)));
        float cu = abs(length(p - vec2(.1, .02)) - .15) * c.z + (p.x < .1 && p.y < .02 ? 1. : 0.);
        cink = max(cink, (1. - smoothstep(w*.8, w*.8 + fy, cu)) * step(sI, -w));
      }
    }
    col = mix(col, uInkCol, cink);
  }
  if (uStars > .01 && d.y > .02) {
    vec2 sp = vec2(atan(d.z, d.x + 1e-5)*14., d.y*26.); vec2 c = floor(sp), f = fract(sp)-.5; float hh = h21(c);
    vec2 o = (vec2(h21(c+3.1), h21(c+7.7))-.5)*.6; float r = length((f-o)*vec2(1., 1.));
    float tw = .75 + .25*sin(uTime*(1.+hh*2.) + hh*40.);
    col = mix(col, uBronze*(1.1*tw), uStars*step(.78, hh)*(1.-smoothstep(.07, .1, r)));
  }
  if (uDisc > .01) {
    float c = dot(d, normalize(uSunDisc)); float r = acos(clamp(c, -1., 1.));
    float rd = uDisc; float w = fwidth(r) + 1e-5;
    float disc = 1. - smoothstep(rd - w, rd + w, r);
    if (uStars > .01) { vec3 d2 = normalize(uSunDisc + vec3(.012, .008, 0.)*8.*rd); float r2 = acos(clamp(dot(d, d2), -1., 1.)); disc *= smoothstep(rd*.9 - w, rd*.9 + w, r2); }
    col = mix(col, uBronze*1.25, disc * step(0., d.y));
    float ring = 1. - smoothstep(w*1.2, w*2.4, abs(r - rd)); if (uStars < .01) col = mix(col, uInkCol, ring*step(0., d.y));
  }
  if (uSquallAmt > .01) {
    float az = atan(-d.x, d.z + 1e-5);            // 0 = west, +pi/2 = north
    float a = (az - 1.25) / .55; float top = .34*(1. - a*a) + .02*sin(a*23.) + .015*sin(a*51.+2.);
    if (abs(a) < 1. && d.y > 0.) {
      float inC = step(d.y, top) * step(.11 + .03*sin(a*9.), d.y);
      float edge = min(abs(d.y - top), abs(d.y - .11 - .03*sin(a*9.)));
      float rain = step(d.y, .12) * step(abs(fract((az*38. + d.y*60.) + uTime*.0)-.5), .09) * step(.3, fract(d.y*31. - uTime*1.2 + floor(az*38. + d.y*60.)*.37));
      col = mix(col, uSquall, inC*uSquallAmt);
      col = mix(col, uInkCol, max((1. - smoothstep(fy*1.5, fy*3., edge)) * step(d.y, top + fy*3.), rain) * uSquallAmt);
    }
  }
  col = mix(col, uInkCol, 1. - smoothstep(fy*.9, fy*1.9, abs(d.y)));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- sea: analytic surf shared by shader, boats and the path ----------
export const SEA = { L: 58, C: 5 };
const GLSL_WAVE = /* glsl */`
uniform float uTau, uTime, uL, uC;
float envz(float z){ return (.6 + .0185*z) * smoothstep(8., 50., z) * (1. - smoothstep(150., 185., z)); }
float wave(vec2 xz, out float dOut, out float aOut){
  float zc = xz.y + uC*uTau + 3.*sin(xz.x*.021 + 1.3) + 1.5*sin(xz.x*.057);
  float k = floor(zc/uL + .5); float d = zc - k*uL;
  float a = envz(xz.y) * (.85 + .15*sin(xz.x*.013 + k*2.1));
  float w = d < 0. ? 3.2 : 7.5;
  dOut = d; aOut = a;
  return a*exp(-(d*d)/(w*w)) + .1*sin(xz.x*.21 + uTime*1.1)*sin(xz.y*.17 - uTime*.8)*smoothstep(-2., 12., xz.y);
}`;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function seaHeight(x, z, tau, time) {
  const L = SEA.L, zc = z + SEA.C * tau + 3 * Math.sin(x * 0.021 + 1.3) + 1.5 * Math.sin(x * 0.057);
  const k = Math.floor(zc / L + 0.5), d = zc - k * L;
  const a = (0.6 + 0.0185 * z) * sstep(8, 50, z) * (1 - sstep(150, 185, z)) * (0.85 + 0.15 * Math.sin(x * 0.013 + k * 2.1));
  const w = d < 0 ? 3.2 : 7.5;
  return a * Math.exp(-(d * d) / (w * w)) + 0.1 * Math.sin(x * 0.21 + time * 1.1) * Math.sin(z * 0.17 - time * 0.8) * sstep(-2, 12, z);
}
const SEA_VERT = /* glsl */`
${GLSL_WAVE}
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  float d, a; float h = wave(w.xz, d, a);
  if (w.z < 4. && w.z > -14.) h = max(h, -w.z/60. + .09);
  w.y += h; vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SEA_FRAG = /* glsl */`
uniform float uGap, uBronzeAmt, uLamp; uniform vec3 uSea, uRiver, uFoam, uInkCol, uBronze, uTint, uSun;
varying vec3 vW;
${GLSL_COMMON}
${GLSL_WAVE}
// one layer of comma strokes; returns signed distance (metres * s) to the stroke, cell hash in hh
float comma(vec2 xz, float s, float scroll, float river, float thk, float arc, out float hh){
  vec2 q = vec2(xz.x/(3.4*s), (xz.y + scroll)/(4.6*s)); float row = floor(q.y);
  q.x += row*.37 + river*.12*sin(uTime*.9 + row*1.7);
  vec2 c = vec2(floor(q.x), row); hh = h21(c);
  vec2 m = (fract(q) - .5) * vec2(3.4, 4.6);
  m.y += .25*sin(uTime*1.3 + hh*30.);
  float r = length(m - vec2(0., -.95)); float ang = atan(m.x, m.y + .95 + 1e-5);
  float th = thk * (1. - clamp((ang + arc)/(2.*arc), 0., 1.)*.85);
  return (abs(ang) < arc ? abs(r - .95) - th : 1.) * s;
}
void main(){
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float river = step(vW.z, -150.);
  float vD, vA; wave(vW.xz, vD, vA);            // the crest phase per fragment: interpolating it across the crest-index jump drew a stray line
  float swE = -3.6 + 3.1*sin(uTime*.55 + vW.x*.021) - 1.4*abs(sin(vW.x*.41 + .6*sin(uTime*.3)));
  float swT = vW.z - swE, swF = max(fwidth(swT), 1e-4);      // the footprint across the swash line, taken outside any branch
  if (river < .5 && vW.z < swE) discard;
  float px = max(max(length(dFdx(vW.xz)), length(dFdy(vW.xz))), 1e-4);
  vec2 sh = -V.xz * (uGap / max(V.y, .22)); float sl = length(sh); if (sl > .35) sh *= .35/sl;
  vec3 col = mix(uSea, uRiver, river);
  // comma rows at three scales, cross-faded with distance so the rows stay ruled to the horizon
  float w0 = 1. - smoothstep(45., 90., dist), w2 = smoothstep(170., 320., dist), w1 = 1. - w0 - w2;
  float scroll = (1. - river) * uTime * 1.7;
  float wh = 0., ik = 0., hh;
  for (int i = 0; i < 3; i++) {
    float s = i == 0 ? 1. : (i == 1 ? 2.6 : 7.); float wgt = i == 0 ? w0 : (i == 1 ? w1 : w2);
    if (wgt > .01) {
      float lw = max(.05*s, .75*px);
      float nearK = i == 0 ? (1. - smoothstep(22., 40., dist)) * (1. - .6*river) : 0.; float thk = mix(.2, .31, nearK), arc = mix(.75, 1.2, nearK);
      float dT = comma(vW.xz, s, scroll, river, thk, arc, hh); float on = step(.34, hh);
      float dE = comma(vW.xz + sh*s, s, scroll, river, thk, arc, hh);
      wh = max(wh, wgt * on * (1. - smoothstep(-px*.5, px*.5, dE)));
      ik = max(ik, wgt * on * (1. - smoothstep(lw - px*.5, lw + px*.5, abs(dT))) * step(0., dT) * smoothstep(.8, 2., .2*s/px));
    }
  }
  col = mix(col, uFoam, wh);
  // bronze on the wave backs
  vec2 bq = (vW.xz + sh*2.) * vec2(1.3, .45); float brow = floor(bq.y); bq.x += brow*.41;
  float dash = step(.5, h21(vec2(floor(bq.x), brow))) * step(abs(fract(bq.y)-.5), .2) * step(abs(fract(bq.x)-.5), .36);
  float sp = max(dot(vec3(0., 1., 0.), normalize(uSun + V + vec3(0., 1e-4, 0.))), 0.); sp *= sp; sp *= sp;
  col = mix(col, uBronze*(.7 + 1.2*sp), min(1., dash * smoothstep(.5, 1.2, vA) * smoothstep(1., 3., vD) * (1. - smoothstep(8., 13., vD)) * uBronzeAmt * (1. - smoothstep(90., 200., dist))));
  // the breaker: a scalloped white band down the front of the crest, outlined in ink, with curls
  float lwb = max(.07, .8*px);
  if (vA > .25) {
    float sc = abs(sin(vW.x*.52 + sin(vW.x*.13)*1.5));
    float lo = -(1.1 + 1.5*vA) + (.5 + .5*vA)*sc, hi = .45;
    float inB = step(lo, vD) * step(vD, hi);
    float ed = min(abs(vD - lo), abs(vD - hi));
    vec2 cc = vec2(fract(vW.x*.52/3.1416 + .5) - .5, (vD - lo)*.3 - .28);
    float cu = abs(length(cc) - .17) + step(cc.x, 0.)*step(cc.y, 0.);      // an open curl, not a closed loop
    float g = smoothstep(.25, .5, vA);
    // lace, near the eye: round holes where the sea shows through the foam, each ringed in ink, and a second scalloped line inside the band
    float lace = (1. - smoothstep(45., 85., dist)) * smoothstep(2.5, 6., .3/px);
    vec2 q = vec2(vW.x*.8, (vD - lo)*1.1); float hr = length(fract(q) - .5);
    float hOn = step(.6, h21(floor(q) + 3.7)) * step(.5, q.y) * step(q.y + .7, (hi - lo)*1.1) * inB * lace;
    float hole = hOn * (1. - smoothstep(.3 - px*.5, .3 + px*.5, hr));
    float ed2 = abs(vD - lo - .45*(hi - lo)) + 4.*hole;
    col = mix(col, uFoam, inB*g);
    col = mix(col, uSea, hole*g);
    float cth = mix(.012, .035, smoothstep(10., 45., dist));      // the curl is a thin stroke close to, and holds its width far off
    float ikb = (1. - smoothstep(lwb, lwb + px, ed)) * step(lo - lwb*2., vD) * step(vD, hi + lwb*2.) * smoothstep(2.5, 6., (hi - lo)/px);
    ikb = max(ikb, inB*(1. - hole)*(1. - smoothstep(cth, cth + px*.3, cu)) * (1. - smoothstep(60., 120., dist)));
    ikb = max(ikb, inB*(1. - smoothstep(lwb, lwb + px, ed2)) * (1. - smoothstep(60., 110., dist)) * smoothstep(3., 7., (hi - lo)/px));
    ikb = max(ikb, hOn*(1. - smoothstep(lwb, lwb + px, abs(hr - .3))));
    ik = max(ik, g*ikb);
  }
  // swash: foam scallops sliding up the sand and back
  if (river < .5 && vW.z < swE + 9.) {
    float band = 1.3 + .5*sin(vW.x*.9 + uTime); float lws = max(.07, .8*swF);
    col = mix(col, uFoam, step(swT, band));
    ik = max(ik, (1. - smoothstep(lws, lws + swF, min(swT, abs(swT - band)))) * smoothstep(1.5, 4., band/swF));
  }
  col = mix(col, uInkCol, ik);
  gl_FragColor = vec4(col * uTint, 1.);
}`;

// ---------- the pane: a faint glare streak that slides, two bubbles and a hairline that stay put ----------
const PANE_FRAG = /* glsl */`
uniform float uSlide, uAmt; varying vec2 vUv;
void main(){
  vec2 p = vUv; float t = p.x*.8 + p.y*.6 - uSlide;
  float f = fract(t*.55); float streak = smoothstep(.0, .06, f) * (1. - smoothstep(.1, .34, f));
  float s2 = fract(t*.55 + .43); streak += .45 * smoothstep(.0, .02, s2) * (1. - smoothstep(.03, .08, s2));
  float a = .05 * streak;
  gl_FragColor = vec4(vec3(min(a, .08) * uAmt), 1.);
}`;

export function makeSouwerMaterials(opts = {}) {
  const mul = opts.mul || null, en = (h) => enc(h, 1, mul);
  const P = PALETTE.map((h) => en(h));
  const uniforms = {
    uTime: { value: 0 }, uTau: { value: 0 }, uL: { value: SEA.L }, uC: { value: SEA.C },
    uWind: { value: new THREE.Vector4(0.64, 0, 0.77, 1) }, uFlap: { value: 1 },
    uGap: { value: opts.gap ?? 0.075 }, uInk: { value: opts.ink ?? 0.034 },
    uInkCol: { value: en(PALETTE[0]) }, uBack: { value: en('#F3EBD2') }, uBronze: { value: en(BRONZE) }, uBronzeAmt: { value: 1 },
    uTint: { value: new THREE.Color(1, 1, 1) }, uSun: { value: new THREE.Vector3(0.24, 0.97, 0.0).normalize() },
    uPal: { value: P }, uDom: { value: new THREE.Vector2(3, 4) }, uFlagBronze: { value: 0 },
    uSea: { value: en(PALETTE[2]) }, uRiver: { value: en('#14AAA8') }, uFoam: { value: en(PALETTE[6]) }, uLamp: { value: 0 },
  };
  const made = [];
  function mat(o = {}) {
    const defines = {}; if (o.hull) defines.HULL = 1; if (o.flag) defines.FLAG = 1; if (o.prow) defines.PROW = 1;
    const m = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, defines, side: o.side ?? THREE.DoubleSide });
    made.push(m); return m;
  }
  const sea = new THREE.ShaderMaterial({ uniforms, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide });
  const skyU = { uSky: { value: enc(PALETTE[1]) }, uSea: uniforms.uSea, uInkCol: uniforms.uInkCol, uBronze: { value: enc(BRONZE) }, uTime: uniforms.uTime,
    uCloud: { value: [[0.44, 0.17, 0.19, -1], [1.35, 0.27, 0.18, 1], [2.4, 0.34, 0.11, -1], [1.78, 0.4, 0.16, 1], [4.5, 0.27, 0.11, -1], [5.55, 0.34, 0.11, 1], [0.08, 0.43, 0.23, 1], [-0.34, 0.25, 0.16, -1]].map((c) => new THREE.Vector4(c[0], c[1], c[2], c[3])) }, uShear: { value: new THREE.Vector2() }, uDrift: { value: 0 }, uCloudCol: { value: en(PALETTE[6]) },
    uSunDisc: { value: new THREE.Vector3(0, 0.1, 1) }, uDisc: { value: 0 }, uStars: { value: 0 }, uSquall: { value: enc('#5B3F9E') }, uSquallAmt: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 20), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: SKY_FRAG }));
  sky.renderOrder = -1; sky.frustumCulled = false;
  const paneU = { uSlide: { value: 0 }, uAmt: { value: 1 } };
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: paneU, depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.AdditiveBlending, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: PANE_FRAG }));
  pane.renderOrder = 50; pane.frustumCulled = false;
  const _f = new THREE.Vector3(), camPos = new THREE.Vector3(), camQuat = new THREE.Quaternion(), _cs = new THREE.Vector3();
  return {
    P, uniforms, skyU, paneU, mat, sea, sky, pane, enc, camPos, camQuat,
    // call every frame with the camera passed to the world's update()
    update(time, camera, u = 0) {
      uniforms.uTime.value = time;
      camera.matrixWorld.decompose(camPos, camQuat, _cs);      // never camera.position: behind a portal the world matrix is set directly
      sky.position.copy(camPos);
      _f.set(0, 0, -1).applyQuaternion(camQuat);
      const t = Math.tan((camera.fov || 62) * Math.PI / 360) * 1.02, asp = camera.aspect || 1.78;
      pane.position.copy(camPos).addScaledVector(_f, 1.0); pane.quaternion.copy(camQuat); pane.scale.set(t * asp, t, 1);
      paneU.uSlide.value = Math.atan2(_f.x, _f.z) * 0.9 + u * 3.0;
      skyU.uDrift.value = time * 0.0035; skyU.uShear.value.set((camPos.x * 0.6 + camPos.z * 0.8) * 0.00005, camPos.y * 0.0004);
    },
  };
}

// ---------- SB: geometry accumulator for the souwer material ----------
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3();
const WHITE = new THREE.Color(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
export class SB {
  constructor(cap = 6000) {
    this.n = 0; this.cap = cap; this.M = null;
    this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3); this.C2 = new Float32Array(cap * 3);
    this.E = new Float32Array(cap * 4); this.T = new Float32Array(cap * 4); this.V = new Float32Array(cap * 4);
    this.c = WHITE; this.c2 = WHITE; this.pid = 0; this.sc = 1; this.fl = 0; this.seed = 0; this.wf = 0; this.wa = 0; this.wp = 0;
  }
  _grow() {
    const cap = this.cap * 2;
    for (const [k, s] of [['P', 3], ['N', 3], ['C', 3], ['C2', 3], ['E', 4], ['T', 4], ['V', 4]]) { const a = new Float32Array(cap * s); a.set(this[k]); this[k] = a; }
    this.cap = cap;
  }
  col(a, b) { this.c = a; this.c2 = b || a; return this; }
  pat(id = 0, sc = 1, flags = 0, seed = 0) { this.pid = id; this.sc = sc; this.fl = flags; this.seed = Math.min(0.999, Math.max(0, seed)); return this; }
  wave(freq = 0, amp = 0, phase = 0) { this.wf = freq; this.wa = amp; this.wp = phase; return this; }
  tr(m) { this.M = m || null; return this; }
  _v(p, eu, ev, W, H, wt) {
    if (this.n >= this.cap) this._grow();
    const i = this.n++, i3 = i * 3, i4 = i * 4;
    this.P[i3] = p.x; this.P[i3 + 1] = p.y; this.P[i3 + 2] = p.z; this.N[i3] = _n.x; this.N[i3 + 1] = _n.y; this.N[i3 + 2] = _n.z;
    this.C[i3] = this.c.r; this.C[i3 + 1] = this.c.g; this.C[i3 + 2] = this.c.b; this.C2[i3] = this.c2.r; this.C2[i3 + 1] = this.c2.g; this.C2[i3 + 2] = this.c2.b;
    this.E[i4] = eu; this.E[i4 + 1] = ev; this.E[i4 + 2] = W; this.E[i4 + 3] = H;
    this.T[i4] = this.pid; this.T[i4 + 1] = this.seed; this.T[i4 + 2] = this.sc; this.T[i4 + 3] = this.fl;
    this.V[i4] = this.wf; this.V[i4 + 1] = this.wa; this.V[i4 + 2] = this.wp; this.V[i4 + 3] = wt;
  }
  // corners a (0,0) b (W,0) c (W,H) d (0,H) as [x,y,z]; ea..ed optional [u,v]; wts optional motion weights per corner
  quadE(a, b, c, d, ea, eb, ec, ed, W, H, wts) {
    _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]); _c.set(c[0], c[1], c[2]); _d.set(d[0], d[1], d[2]);
    if (this.M) { _a.applyMatrix4(this.M); _b.applyMatrix4(this.M); _c.applyMatrix4(this.M); _d.applyMatrix4(this.M); }
    _n.subVectors(_b, _a); _t.subVectors(_d, _a); _n.cross(_t);
    if (_n.lengthSq() < 1e-12) { _n.subVectors(_c, _b); _t.subVectors(_d, _b); _n.cross(_t); }
    if (_n.lengthSq() < 1e-12) _n.set(0, 1, 0); else _n.normalize();
    const w = wts || (this.wa !== 0 ? [1, 1, 1, 1] : [0, 0, 0, 0]);
    this._v(_a, ea[0], ea[1], W, H, w[0]); this._v(_b, eb[0], eb[1], W, H, w[1]); this._v(_c, ec[0], ec[1], W, H, w[2]);
    this._v(_a, ea[0], ea[1], W, H, w[0]); this._v(_c, ec[0], ec[1], W, H, w[2]); this._v(_d, ed[0], ed[1], W, H, w[3]);
    return this;
  }
  quad(a, b, c, d, wts) {
    const W = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), H = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    return this.quadE(a, b, c, d, [0, 0], [W, 0], [W, H], [0, H], W, H, wts);
  }
  // o = corner, ux / uy = unit directions
  rect(o, ux, uy, w, h, wts) {
    return this.quadE(o, [o[0] + ux[0] * w, o[1] + ux[1] * w, o[2] + ux[2] * w], [o[0] + ux[0] * w + uy[0] * h, o[1] + ux[1] * w + uy[1] * h, o[2] + ux[2] * w + uy[2] * h],
      [o[0] + uy[0] * h, o[1] + uy[1] * h, o[2] + uy[2] * h], [0, 0], [w, 0], [w, h], [0, h], w, h, wts);
  }
  box(cx, cy, cz, sx, sy, sz, skip = '') {
    const x = sx / 2, y = sy / 2, z = sz / 2, q = (a, b, c, d) => this.quad([cx + a[0], cy + a[1], cz + a[2]], [cx + b[0], cy + b[1], cz + b[2]], [cx + c[0], cy + c[1], cz + c[2]], [cx + d[0], cy + d[1], cz + d[2]]);
    if (!skip.includes('E')) q([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]);
    if (!skip.includes('W')) q([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]);
    if (!skip.includes('S')) q([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]);
    if (!skip.includes('N')) q([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]);
    if (!skip.includes('T')) q([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]);
    if (!skip.includes('B')) q([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]);
    return this;
  }
  // ribbon between two polylines A (v = 0) and B (v = H); u runs continuously so joints carry no ink. wA / wB: motion weights
  strip(A, B, wA, wB) {
    let L = 0, H = 0; const us = [0];
    for (let i = 1; i < A.length; i++) { L += Math.hypot(A[i][0] - A[i - 1][0], A[i][1] - A[i - 1][1], A[i][2] - A[i - 1][2]); us.push(L); }
    for (let i = 0; i < A.length; i++) H += Math.hypot(B[i][0] - A[i][0], B[i][1] - A[i][1], B[i][2] - A[i][2]) / A.length;
    for (let i = 0; i < A.length - 1; i++) {
      const w = wA ? [wA[i], wA[i + 1], wB[i + 1], wB[i]] : undefined;
      this.quadE(A[i], A[i + 1], B[i + 1], B[i], [us[i], 0], [us[i + 1], 0], [us[i + 1], H], [us[i], H], L, H, w);
    }
    return this;
  }
  get triangles() { return this.n / 3; }
  build() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3));
    g.setAttribute('aCol2', new THREE.BufferAttribute(this.C2.slice(0, n * 3), 3));
    g.setAttribute('e', new THREE.BufferAttribute(this.E.slice(0, n * 4), 4));
    g.setAttribute('pt', new THREE.BufferAttribute(this.T.slice(0, n * 4), 4));
    g.setAttribute('mv', new THREE.BufferAttribute(this.V.slice(0, n * 4), 4));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// ---------- the pirogue: 20 m, bow toward +Z, keel on y = 0 ----------
export const HULL = { L: 20, beam: 1.15 };
export function hullProfile(t) {
  const s = Math.abs(2 * t - 1);
  return { b: HULL.beam * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, t)))), 0.62), g: 1.15 + 1.75 * Math.pow(s, 2.6) + 0.55 * sstep(0.68, 1, t), k: 1.25 * Math.pow(s, 3.6) };
}
export function hullGeometry(P, stations = 18) {
  const sb = new SB(1400), L = HULL.L, VH = 1.5;
  const st = [];
  for (let i = 0; i <= stations; i++) { const t = i / stations, pr = hullProfile(t); st.push({ z: (t - 0.5) * L, u: t * L, ...pr }); }
  sb.pat(0, 1, FLG.NOBORDER);
  for (let i = 0; i < stations; i++) {
    const a = st[i], b = st[i + 1];
    for (const sx of [1, -1]) {
      const Ka = [0, a.k, a.z], Kb = [0, b.k, b.z];
      const Ca = [sx * a.b * 0.74, a.k + 0.42 * (a.g - a.k), a.z], Cb = [sx * b.b * 0.74, b.k + 0.42 * (b.g - b.k), b.z];
      const Ga = [sx * a.b, a.g, a.z], Gb = [sx * b.b, b.g, b.z];
      sb.quadE(Ka, Kb, Cb, Ca, [a.u, 0], [b.u, 0], [b.u, 0.45 * VH], [a.u, 0.45 * VH], L, VH);
      sb.quadE(Ca, Cb, Gb, Ga, [a.u, 0.45 * VH], [b.u, 0.45 * VH], [b.u, VH], [a.u, VH], L, VH);
    }
    // inside: a deck of thwarts a little below the gunwales
    if (i > 0 && i < stations - 1) {
      sb.pat(PAT.DECK, 1.7, FLG.NOBORDER | FLG.NOBRONZE).col(P.deck, P.deck2);
      sb.quadE([-a.b * 0.9, a.g - 0.42, a.z], [-b.b * 0.9, b.g - 0.42, b.z], [b.b * 0.9, b.g - 0.42, b.z], [a.b * 0.9, a.g - 0.42, a.z], [a.u, 0], [b.u, 0], [b.u, 2], [a.u, 2], L, 2);
      sb.pat(0, 1, FLG.NOBORDER);
    }
  }
  // the upswept prow spar and the shorter stern spar
  const bw = st[stations], sn = st[0];
  sb.pat(31, 0.5, 0);
  sb.quad([0, bw.k + 0.9, bw.z - 0.25], [0, bw.g + 1.5, bw.z + 2.7], [0, bw.g + 1.85, bw.z + 2.55], [0, bw.g + 0.05, bw.z - 0.25]);
  sb.quad([0, sn.k + 1.0, sn.z + 0.25], [0, sn.g + 0.75, sn.z - 1.5], [0, sn.g + 1.05, sn.z - 1.35], [0, sn.g + 0.05, sn.z + 0.25]);
  return sb.build();
}
export function flagGeometry(P) {
  const sb = new SB(200);
  sb.col(P.bamboo, P.bamboo).pat(PAT.PLANKS, 0.45, FLG.KEEP | FLG.NOBRONZE | FLG.NOBORDER).box(0, 1.65, 0, 0.07, 3.3, 0.07, 'B');
  sb.pat(0, 1, 0).wave(7.5, 0.275, 0);
  const W = 1.5, H = 0.95, y0 = 2.3, nx = 6;
  for (let i = 0; i < nx; i++) for (let j = 0; j < 2; j++) {
    const x0 = (i / nx) * W, x1 = ((i + 1) / nx) * W, ya = (j / 2) * H, yb = ((j + 1) / 2) * H;
    sb.quadE([x0 + 0.04, y0 + ya, 0], [x1 + 0.04, y0 + ya, 0], [x1 + 0.04, y0 + yb, 0], [x0 + 0.04, y0 + yb, 0], [x0, ya], [x1, ya], [x1, yb], [x0, yb], W, H, [x0 / W, x1 / W, x1 / W, x0 / W]);
  }
  return sb.build();
}

// what an outbound boat carries, in hull space: shipped oars along the gunwales, crates, floats and a net heap on deck, a lantern staff
export function dressGeometry(Pm, night, en = enc) {
  const sb = new SB(700), L = HULL.L, pr = (z) => hullProfile(z / L + 0.5), dk = (z) => pr(z).g - 0.42, ink = Pm[0], cream = Pm[6], bam = en('#D8B25A'), brown = en('#7B4A22');
  for (const sx of [1, -1]) {
    const A = [], B = [];
    for (let i = 0; i <= 6; i++) { const z = -6.2 + i * 1.5, q = pr(z), x = sx * (q.b + 0.09); A.push([x, q.g + 0.03, z]); B.push([x, q.g + 0.2, z]); }
    sb.col(sx > 0 ? Pm[4] : cream, Pm[3]).pat(PAT.STRIPE_U, 0.9, FLG.NOBRONZE, 0.2).strip(A, B);
    const q = pr(-7.2), x = sx * (q.b + 0.09);
    sb.col(Pm[sx > 0 ? 1 : 3], cream).pat(PAT.PLAIN, 1, 0, 0.1).quad([x, q.g - 0.12, -7.5], [x, q.g - 0.12, -6.2], [x, q.g + 0.34, -6.2], [x, q.g + 0.34, -7.5]);
  }
  for (const [z, x, w, c, pt] of [[-4.4, -0.3, 0.8, Pm[2], PAT.PLANKS], [-3.3, 0.36, 0.65, Pm[3], PAT.PLANKS], [-3.4, -0.42, 0.5, Pm[4], PAT.CHECK], [2.2, 0.3, 0.75, en('#B9793A'), PAT.PLANKS], [3.3, -0.3, 0.6, Pm[5], PAT.PLANKS]])
    sb.col(c, brown).pat(pt, 0.2, 0, 0.3).box(x, dk(z) + w * 0.4, z, w * 1.2, w * 0.8, w, 'B');
  for (const [z, x, c] of [[-1.9, 0.5, Pm[3]], [-2.1, -0.45, Pm[4]], [0.9, 0.5, cream], [1.0, -0.4, Pm[3]], [4.6, 0.2, Pm[4]], [6.6, 0.25, Pm[3]], [6.9, -0.2, cream]])
    sb.col(c, ink).pat(PAT.DISC, 0, 0, 0.9).box(x, dk(z) + 0.2, z, 0.4, 0.4, 0.4, 'B');
  { const z = 5.6, y = dk(z), r = 0.8, T2 = Math.PI * 2;
    for (let k = 0; k < 6; k++) { const a0 = (k / 6) * T2, a1 = ((k + 1) / 6) * T2; sb.col(k % 2 ? Pm[1] : en('#2F6FD0'), Pm[2]).pat(PAT.HATCH, 0.26, FLG.NOBRONZE, 0.4)
      .quad([Math.cos(a0) * r, y, z + Math.sin(a0) * r], [Math.cos(a1) * r, y, z + Math.sin(a1) * r], [Math.cos(a1) * r * 0.2, y + 0.75, z + Math.sin(a1) * r * 0.2], [Math.cos(a0) * r * 0.2, y + 0.75, z + Math.sin(a0) * r * 0.2]); } }
  const sy = dk(-0.6);
  sb.col(bam, bam).pat(PAT.PLANKS, 0.45, FLG.NOBRONZE | FLG.NOBORDER).box(0, sy + 1.5, -0.6, 0.08, 3.0, 0.08, 'B');
  if (!night) {
    sb.col(Pm[4], Pm[4]).pat(PAT.PLAIN, 1, FLG.NOBRONZE, 0.2).box(0, sy + 3.3, -0.6, 0.5, 0.6, 0.5);
    sb.col(Pm[3], Pm[3]).pat(PAT.PLAIN, 1, FLG.NOBRONZE).box(0, sy + 3.66, -0.6, 0.3, 0.12, 0.3).box(0, sy + 2.94, -0.6, 0.3, 0.12, 0.3);
  }
  sb.wave();
  return sb.build();
}
// rows of specks low behind the gunwales: only ever shown on boats far from the eye
export function crewGeometry(Pm) {
  const sb = new SB(200), L = HULL.L;
  for (let i = 0; i < 8; i++) {
    const z = -6.6 + i * 1.75, q = hullProfile(z / L + 0.5), x = i % 2 ? 0.34 : -0.34, y = q.g - 0.42, h = 1.25;
    sb.col(Pm[1 + (i * 2) % 5], Pm[0]).pat(PAT.DROP, 1, FLG.NOBRONZE | FLG.NOBORDER, 0).wave(-0.6, -0.05, i * 1.3);
    sb.quad([x - 0.3, y, z - 0.3], [x + 0.3, y, z + 0.3], [x + 0.3, y + h, z + 0.3], [x - 0.3, y + h, z - 0.3]).quad([x + 0.3, y, z - 0.3], [x - 0.3, y, z + 0.3], [x - 0.3, y + h, z + 0.3], [x + 0.3, y + h, z - 0.3]);
  }
  sb.wave();
  return sb.build();
}
// one puff of wake: a scalloped foam shape with an ink edge and a curl, lying on the water, its flat side to the stern
export function wakeGeometry(Pm) {
  const sb = new SB(12);
  sb.col(Pm[6], Pm[6]).pat(PAT.CLOUD, 0.1, FLG.NOBRONZE | FLG.NOBORDER, 0.3).wave(1.4, 0.05, 0).quad([-1.1, 0, 0.36], [1.1, 0, 0.36], [1.1, 0, -0.64], [-1.1, 0, -0.64]);
  return sb.build();
}

// a mast, a painted sail and a string of pennants from prow to masthead to stern, in hull space; the sail stands across the wind.
// Three cuts so that no two neighbours match: 0 and 2 are tall four-panel sails on a slanted yard, 1 is a lateen on a long raked yard.
export function sailGeometry(Pm, v = 0, ca = Pm[3], cb = Pm[6]) {
  const sb = new SB(420), ink = Pm[0], NBR = FLG.NOBRONZE, mz = 1.6, top = 12.2, ax = [0.77, 0, -0.64], nn = [0.64, 0, 0.77];
  const at = (s, y, b) => [ax[0] * s + nn[0] * b, y, mz + ax[2] * s + nn[2] * b];
  sb.wave().col(ink, ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | NBR).box(0, top / 2 + 0.3, mz, 0.2, top - 0.6, 0.2, 'TB');
  if (v !== 1) {
    const Y = [3.7, 5.6, 7.5, 9.4, 11.2], Wd = v ? [2.5, 2.75, 2.6, 2.2, 1.7] : [2.9, 2.6, 2.25, 1.85, 1.4], S = [-1, -0.5, 0, 0.5, 1], sl = v ? -0.3 : 0.35;
    const row = (j) => S.map((q) => at(q * Wd[j], Y[j] + sl * q * (j / 4), 0.85 * (1 - q * q) * Math.pow(1 - j / 4, 0.7)));
    const wts = (j) => S.map((q) => (1 - q * q) * (1 - j / 4));
    const pats = v ? [[PAT.STRIPE_U, 1.2], [PAT.PLAIN, 1], [PAT.CHEVRON, 0.95], [PAT.STRIPE_U, 0.8]] : [[PAT.CHECK, 0.95], [PAT.STRIPE_U, 1.3], [PAT.DIAMOND, 1.9], [PAT.STRIPE_V, 1.8]];
    for (let j = 0; j < 4; j++) sb.col(j % 2 ? cb : ca, j % 2 ? ca : cb).pat(pats[j][0], pats[j][1], NBR, 0.2 + j * 0.2).wave(1.1, 0.3, j * 0.5).strip(row(j), row(j + 1), wts(j), wts(j + 1));
    const w = Wd[4] + 0.45, y0 = Y[4] - sl * (w / Wd[4]) + 0.06, y1 = Y[4] + sl * (w / Wd[4]) + 0.06;
    sb.wave().col(ink, ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | NBR).quad(at(-w, y0 - 0.1, 0.05), at(w, y1 - 0.1, 0.05), at(w, y1 + 0.1, 0.05), at(-w, y0 + 0.1, 0.05));
  } else {
    const P0 = [-3.4, 4.3], P1 = [2.4, 13.4], P2 = [3.3, 3.7], ts = [0.05, 0.3, 0.55, 0.78, 1], lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const A = [], Md = [], B = [], wA = [], wM = [], w0 = [];
    for (const t of ts) { const a = lp(P0, P2, t), b = lp(P0, P1, t), be = Math.sin(Math.PI * Math.min(1, t * 1.15)) * t;
      A.push(at(a[0], a[1], 1.4 * be)); Md.push(at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1.8 * be)); B.push(at(b[0], b[1], 0)); wA.push(0.7 * be); wM.push(be); w0.push(0); }
    sb.col(ca, cb).pat(PAT.STRIPE_U, 1.5, NBR, 0.3).wave(1.1, 0.3, 0.4).strip(A, Md, wA, wM);
    sb.col(cb, ca).pat(PAT.STRIPE_V, 1.5, NBR, 0.5).wave(1.1, 0.3, 0.4).strip(Md, B, wM, w0);
    const e0 = lp(P0, P1, -0.07), e1 = lp(P0, P1, 1.06);
    sb.wave().col(ink, ink).pat(PAT.PLAIN, 1, FLG.NOBORDER | NBR).quad(at(e0[0] + 0.09, e0[1] - 0.06, 0.05), at(e1[0] + 0.09, e1[1] - 0.06, 0.05), at(e1[0] - 0.09, e1[1] + 0.06, 0.05), at(e0[0] - 0.09, e0[1] + 0.06, 0.05));
  }
  // dressed overall: pennants edge to edge from the prow spar to the masthead and down to the stern spar, streaming a little downwind
  const bun = (a, b, n, k0) => {
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, sg = (t) => -0.9 * 4 * t * (1 - t);
      const p0 = [0, a[1] + (b[1] - a[1]) * t0 + sg(t0), a[2] + (b[2] - a[2]) * t0], p1 = [0, a[1] + (b[1] - a[1]) * t1 + sg(t1), a[2] + (b[2] - a[2]) * t1];
      sb.col(Pm[[3, 4, 1, 6, 2, 5][(i + k0) % 6]], Pm[6]).pat(PAT.TRI, 1, NBR, 0).wave(6, 0.08, i * 1.7).quad([0.4, p0[1] - 0.85, p0[2] + 0.15], [0.4, p1[1] - 0.85, p1[2] + 0.15], p1, p0, [1, 1, 0, 0]);
    }
  };
  bun([0, 5.2, 12.5], [0, top - 0.1, mz], 11, 0); bun([0, top - 0.1, mz], [0, 3.9, -11.3], 13, 3);
  sb.wave();
  return sb.build();
}

// ---------- comma spray along the breaking crests, and the sardinella run (rare) ----------
const SPRITE_VERT = /* glsl */`
${GLSL_WAVE}
attribute vec4 aS; uniform vec2 uAnchor; uniform float uMode; uniform vec3 uCam;
varying vec2 vUv; varying float vK;
void main(){
  vec3 p; float sz; float ang = 0.; vK = aS.z;
  float d, a;
  if (uMode < .5) {
    float x = uAnchor.x + (aS.x - .5)*2.*uAnchor.y;
    float base = uC*uTau + 3.*sin(x*.021 + 1.3) + 1.5*sin(x*.057);
    float z = (floor(base/uL) + 1. + floor(aS.y*3.999))*uL - base;
    wave(vec2(x, z), d, a);
    float t = fract(uTime*.85 + aS.z*7.);
    p = vec3(x + (aS.z - .5)*1.6*t, a*.9 + a*(.5 + aS.w)*2.2*t*(1. - t) + .15, z - .5 - t*(1.6 + 2.2*aS.w));
    sz = (.65 + .85*aS.w) * smoothstep(.5, 1.1, a) * (1. - t*.55) * smoothstep(0., .12, t);
    ang = aS.z*6.28 + t*2.;
    vec4 mvp = viewMatrix * vec4(p, 1.);
    float c = cos(ang), s = sin(ang);
    mvp.xy += vec2(c*position.x - s*position.y, s*position.x + c*position.y) * sz;
    gl_Position = projectionMatrix * mvp;
  } else if (uMode > 1.5) {
    float x = uCam.x + mod(aS.x*170. + uTime*15.*(.6 + aS.w) - uCam.x, 170.) - 85.;
    float z = -60. + aS.y*62.; float y = max(-z/60., 0.) + .12 + aS.z*aS.z*1.3 + .1*sin(uTime*3. + aS.z*40.);
    vec4 mvp = viewMatrix * vec4(x, y, z + (x - uCam.x)*.5, 1.);
    vec4 mv2 = viewMatrix * vec4(x + 1., y, z + (x + 1. - uCam.x)*.5, 1.);
    vec2 dir = normalize(mv2.xy - mvp.xy + vec2(1e-5, 0.));
    // long thin strokes that hold about 1.5 px far off; none right at the lens
    mvp.xy += (dir*position.x*(2.2 + 2.8*aS.w) + vec2(-dir.y, dir.x)*position.y*max(.055, -mvp.z*.0042)) * smoothstep(2.5, 7., -mvp.z);
    gl_Position = projectionMatrix * mvp;
  } else {
    float zr = aS.y*70.; float z = zr + 70.*floor((uCam.z - zr)/70. + 1.);
    float x = uCam.x + (aS.x - .5)*64.;
    float t = fract(uTime*(.7 + .5*aS.w) + aS.z*9.); float dir = aS.z > .5 ? 1. : -1.;
    float hgt = 1.1 + 1.6*aS.w;
    float h = wave(vec2(x, z), d, a);
    p = vec3(x + dir*(t - .5)*4.5, h + hgt*4.*t*(1. - t) - .1, z);
    ang = atan(hgt*4.*(1. - 2.*t), 4.5) * dir;
    sz = (.55 + .5*aS.w) * smoothstep(96., 108., z) * (1. - smoothstep(196., 208., z));
    float c = cos(ang), s = sin(ang);
    p.xy += vec2(c*position.x*dir - s*position.y, s*position.x*dir + c*position.y) * sz;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  }
  vUv = position.xy;
}`;
const SPRITE_FRAG = /* glsl */`
uniform float uMode; uniform vec3 uFoam, uInkCol, uBronze, uTint; varying vec2 vUv; varying float vK;
void main(){
  vec2 m = vUv * 2.; float px = max(fwidth(m.x), 1e-4);
  vec3 col;
  if (uMode > 1.5) { col = uFoam; if (abs(m.x) > .9 - abs(m.y)*.9) discard; }
  else if (uMode < .5) {
    float r = length(m - vec2(0., -.55)), ang = atan(m.x, m.y + .55 + 1e-5);
    float th = .26 * (1. - clamp((ang + .9)/1.8, 0., 1.)*.8);
    float dd = abs(ang) < .9 ? abs(r - .75) - th : 1.;
    if (dd > 0.) discard;
    col = mix(uInkCol, uFoam, step(dd, -.07 - px*.5));
  } else {
    float dd = max(length(m - vec2(.55, 0.)), length(m + vec2(.55, 0.))*1. ) ; dd = max(length(m*vec2(1., 2.6)) - .8, -1.);
    float tail = max(abs(m.y) - (-m.x - .55)*.9, -m.x - .98); 
    dd = min(dd, m.x < -.55 ? tail : 1.);
    if (dd > 0.) discard;
    col = dd > -.09 - px ? uInkCol : (m.y > .02 ? uBronze*1.15 : uFoam);
  }
  gl_FragColor = vec4(col * uTint, 1.);
}`;
export function spriteMesh(uniforms, n, mode, rng) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  const s = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) s[i] = rng();
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = n;
  const u = { ...uniforms, uMode: { value: mode }, uAnchor: { value: new THREE.Vector2(-100, 110) }, uCam: { value: new THREE.Vector3() } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, side: THREE.DoubleSide }));
  m.frustumCulled = false; return m;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = (ctx.rng.fork ? ctx.rng.fork('fleet') : ctx.rng), det = ctx.quality?.detail ?? 1;
  const mats = opts.mats || makeSouwerMaterials(opts);
  const U = mats.uniforms, look = opts.look || {};
  const en = (h) => enc(h, 1, opts.mul || null);
  const P = { deck: en(opts.rare ? '#E9EEF2' : '#D9A441'), deck2: en(opts.rare ? '#AEB9C6' : '#8A4B1E'), bamboo: en('#D8B25A') };
  const object = new THREE.Group(); object.name = 'painted-fleet';
  const portalAt = opts.portalAt || [-100, 215], meet = opts.meet || { x: -100, D: 48, u1: 0.78, z1: 55 };
  const sandY = (z) => (z < -60 ? 1 : -z / 60);
  if (look.dom) U.uDom.value.set(look.dom[0], look.dom[1]);

  // sea: one grid, fine where the surf stands and along the shore
  {
    const xs = [], zs = [];
    for (let x = -1500; x < -330; x += 45) xs.push(x);
    for (let x = -330; x <= 130; x += 5) xs.push(x);
    for (let x = 175; x <= 1400; x += 45) xs.push(x);
    for (let z = -12; z < 196; z += 1.6) zs.push(z);
    for (let z = 196, s = 4; z < 2400; z += s, s *= 1.5) zs.push(z);
    const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), idx = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = (j * nx + i) * 3; pos[k] = xs[i]; pos[k + 1] = 0; pos[k + 2] = zs[j]; }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    const sea = new THREE.Mesh(g, mats.sea); sea.frustumCulled = false; sea.name = 'sea'; object.add(sea);
  }
  await ctx.yield?.();

  // the fleet: hulls side by side, bows to the sea, launch lanes every 100 m
  const hullGeo = hullGeometry(P), flagGeo = flagGeometry(P);
  await ctx.yield?.();
  const hullMat = mats.mat({ hull: true }), flagMat = mats.mat({ flag: true });
  const slots = [];
  for (let x = -900; x <= 300; x += 4) { const lane = Math.abs(((x % 100) + 150) % 100 - 50); if (lane < 8.5) continue; slots.push(x); }
  const fleet = new THREE.InstancedMesh(hullGeo, hullMat, slots.length), flags = new THREE.InstancedMesh(flagGeo, flagMat, slots.length * 2);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), T = new THREE.Vector3(), C = new THREE.Color(), FM = new THREE.Matrix4(), FQ = new THREE.Quaternion();
  const wind = U.uWind.value, windYaw = Math.atan2(-wind.z, wind.x);
  let nf = 0; const rockers = [];
  const qs = (r) => Math.min(4095, Math.floor(r * 4096)) / 4095, usedSeeds = new Set();      // seeds are exact multiples of 1/4095
  const uniq = (r) => { let k = Math.min(4095, Math.floor(r * 4096)); while (usedSeeds.has(k)) k = (k + 611) % 4096; usedSeeds.add(k); return k / 4095; };
  const putFlag = (mesh, i, hullM, lx, ly, lz, sc, seed) => {
    T.set(lx, ly, lz).applyMatrix4(hullM); FQ.setFromAxisAngle(_up, windYaw); S.set(sc, sc, sc);
    FM.compose(T, FQ, S); mesh.setMatrixAt(i, FM); if (seed !== undefined) mesh.setColorAt(i, C.setRGB(qs(seed), 0, 0));
  };
  slots.forEach((x, i) => {
    const sc = rng.range(0.9, 1.1), zc = -22 - 12.6 * sc + rng.range(-1.2, 0.6);
    E.set(-0.017 + rng.range(-0.01, 0.01), Math.PI * 0 + rng.range(-0.035, 0.035), rng.range(-0.13, 0.13));
    T.set(x + rng.range(-0.5, 0.5), sandY(zc) - 0.12, zc); S.set(1, 1, sc);
    if (i % 3 === 1 && x > -340 && x < 60) rockers.push({ i, x: T.x, y: T.y, z: T.z, ex: E.x, ey: E.y, ez: E.z, sc });
    M.compose(T, Q.setFromEuler(E), S); fleet.setMatrixAt(i, M); const seed = rng(); fleet.setColorAt(i, C.setRGB(uniq(seed), 0, 0));
    putFlag(flags, nf++, M, 0, 2.55, -8.9, rng.range(1.2, 1.7), rng());
    if (rng() < 0.66) putFlag(flags, nf++, M, 0, 3.3, 9.6, rng.range(1.0, 1.4), rng());
  });
  await ctx.yield?.();
  flags.count = nf; fleet.instanceMatrix.needsUpdate = true; flags.instanceMatrix.needsUpdate = true;
  fleet.computeBoundingSphere(); flags.computeBoundingSphere();
  fleet.name = 'fleet'; flags.name = 'fleet-flags'; object.add(fleet, flags);
  await ctx.yield?.();

  await ctx.yield?.();
  // boats that move: 8 returning on the surf, 4 going down the rollers, moored river boats, the anchored pair (twice life size)
  // (opts.anchored: big hulls at anchor on the open sea, { x, z, yaw, sc, sail }, riding the swell; sail 0..2 picks a rig, undefined = bare)
  const moored = opts.moored || [], anchored = opts.anchored || [];
  const NRET = 18, NE = 5, ND = NRET + 4 + moored.length + 2 + (NE - 1) + 1 + anchored.length, dyn = new THREE.InstancedMesh(hullGeo, hullMat, ND), dflags = new THREE.InstancedMesh(flagGeo, flagMat, ND * 2);
  dyn.frustumCulled = false; dflags.frustumCulled = false; dyn.name = 'boats'; dflags.name = 'boat-flags';
  for (let i = 0; i < ND; i++) { dyn.setColorAt(i, C.setRGB(uniq(rng()), 0, 0)); dflags.setColorAt(i * 2, C.setRGB(qs(rng()), 0, 0)); dflags.setColorAt(i * 2 + 1, C.setRGB(qs(rng()), 0, 0)); }
  object.add(dyn, dflags);
  const L = SEA.L, Cw = SEA.C, wig = (x) => 3 * Math.sin(x * 0.021 + 1.3) + 1.5 * Math.sin(x * 0.057);
  const T0 = -(meet.z1 + wig(meet.x)) / Cw - meet.u1 * meet.D, period = L / Cw;
  const keyTau = (u) => T0 + u * meet.D;
  // returning boats: lanes beside the path are matched to the crest the camera meets
  // (the lanes nearest the path belong to the outbound convoy: -7, +9, -27, +32, -52)
  const lanes = [meet.x + 15, meet.x - 16, meet.x + 24, meet.x + 19, meet.x - 22, meet.x - 62, meet.x + 58, meet.x + 128, meet.x - 38, meet.x + 42, meet.x - 46, meet.x + 48, meet.x - 120, meet.x + 84, meet.x - 12, meet.x + 28, meet.x - 32, meet.x + 37], NR = lanes.length;
  const meetZ = [55, 98, 98, 141, 141], uStep = (L - 43) / (Cw * meet.D);
  const ret = lanes.map((x, i) => {
    let j = rng.int(0, 3);
    if (i < 5) { const tau = keyTau(meet.u1 + uStep * (i === 0 ? 0 : i < 3 ? 1 : 2)); let best = 1e9; for (let k = 0; k < 4; k++) { const z = 4 * L - (((Cw * tau + wig(x) + k * L) % (4 * L)) + 4 * L) % (4 * L); if (Math.abs(z - meetZ[i]) < best) { best = Math.abs(z - meetZ[i]); j = k; } } }
    // four run in between the crests, half a wavelength from the keyed ones, and pass the bow at z = 76 and 119
    if (i >= 14) { const n = i < 16 ? 0.5 : 1.5, tau = keyTau(meet.u1 + uStep * n), zt = 55 + 43 * n; let best = 1e9; for (let k = 0; k < 4; k++) { const z = 4 * L - (((Cw * tau + wig(x) + (k + 0.5) * L) % (4 * L)) + 4 * L) % (4 * L); if (Math.abs(z - zt) < best) { best = Math.abs(z - zt); j = k; } } }
    const rs = rng.range(0.92, 1.08);
    return { x, j, fo: i >= 14 ? 0.5 : 0, sc: i < 5 ? 1.3 : rs };      // the five keyed to our crests are drawn larger: each pass is an event
  });
  const launch = [{ x: meet.x - 7, keyed: true }, { x: 100.5, ph: 0.1 }, { x: -200.5, ph: 0.45 }, { x: -299.5, ph: 0.8 }];
  const state = { tau: 0, time: 0, init: false }, retPos = new Float32Array(NRET * 3);
  // the outbound convoy: five boats that put to sea with the camera and hold station ahead of it, each on its own lane, then heave to
  // short of the anchored pair so the camera slides past them and the last run to the portal is clear. The first is the keyed launch boat.
  const zOf = meet.zOf || ((u) => -284 + u * 500);
  // All but the first (which the camera flies over on the rollers) carry a mast, a sail and pennants.
  const ESC = [{ x: meet.x - 7, lead: 19, sc: 1.25, wait: 0, cap: 154, ph: 0.3 }, { x: meet.x + 9, lead: 31, sc: 1.15, wait: 33, cap: 162, ph: 1.9, sail: 0 },
    { x: meet.x - 27, lead: 56, sc: 1.0, wait: 63, cap: 185, ph: 3.4, sail: 2 }, { x: meet.x + 32, lead: 79, sc: 1.0, wait: 86, cap: 190, ph: 4.6, sail: 1 }, { x: meet.x - 52, lead: 105, sc: 1.05, wait: 110, cap: 179, ph: 5.5, sail: 0 }];
  const escPos = new Float32Array(NE * 4), cross = opts.cross || null;
  const smax = (a, b, k) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k)), smin = (a, b, k) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));
  const sat = (x) => Math.min(1, Math.max(0, x));
  await ctx.yield?.();
  const plainMat = mats.mat();
  const dress = new THREE.InstancedMesh(dressGeometry(mats.P, !!look.night, en), plainMat, NE); dress.frustumCulled = false; dress.name = 'convoy-gear';
  const crew = new THREE.InstancedMesh(crewGeometry(mats.P), plainMat, NRET + 3); crew.frustumCulled = false; crew.name = 'boat-specks';
  const NWK = NE * 3 + 3, wake = new THREE.InstancedMesh(wakeGeometry(mats.P), plainMat, NWK); wake.frustumCulled = false; wake.name = 'wakes';
  object.add(dress, crew, wake);
  await ctx.yield?.();
  // the rigs: three cuts of sail, one instanced draw each, set on the convoy and on the boats at anchor
  const sailN = [0, 0, 0], rigged = [];
  for (const b of ESC) if (b.sail !== undefined) rigged.push(b);
  for (const b of anchored) if (b.sail !== undefined) rigged.push(b);
  for (const b of rigged) b.si = sailN[b.sail]++;
  const d0 = look.dom ? look.dom[0] : 3, d1 = look.dom ? look.dom[1] : 4, PP = mats.P;
  const sailC = [[PP[d0], PP[6]], [PP[d1 === 6 ? 4 : d1], PP[6]], [PP[5], PP[1]]];
  const sailM = sailN.map((n, v) => { const m = new THREE.InstancedMesh(sailGeometry(PP, v, sailC[v][0], sailC[v][1]), plainMat, Math.max(1, n)); m.frustumCulled = false; m.name = 'sails-' + v; m.count = n; object.add(m); return m; });
  await ctx.yield?.();
  const camP = mats.camPos;
  const putWake = (i, x, z, yaw, s) => {
    const y = heightAt(x, z) + 0.13, sl = z > 0 ? Math.atan2(heightAt(x, z + 1) - heightAt(x, z - 1), 2) : 0;
    E.set(yaw ? sl : -sl, yaw, 0, 'YXZ'); T.set(x, y, z); s = Math.max(0.001, s); S.set(s, s, s); FM.compose(T, FQ.setFromEuler(E), S); wake.setMatrixAt(i, FM);
  };
  const putCrew = (i, x, z) => { const k = Math.max(0.001, sstep(42, 54, Math.hypot(x - camP.x, z - camP.z))); FM.copy(M).scale(S.set(k, k, k)); crew.setMatrixAt(i, FM); };
  const heightAt = (x, z) => seaHeight(x, z, state.tau, state.time);
  const groundY = (x, zz) => Math.max(sandY(zz) + 0.12, heightAt(x, zz) - 0.42);
  function setBoat(i, x, y, z, yaw, pitch, roll, sc, flagsOn = true) {
    E.set(pitch, yaw, roll, 'YXZ'); T.set(x, y, z); S.set(sc, sc, sc); M.compose(T, Q.setFromEuler(E), S); dyn.setMatrixAt(i, M);
    const fs = flagsOn ? sc * 1.1 : 0;
    putFlag(dflags, i * 2, M, 0, 2.55, -8.9, fs); putFlag(dflags, i * 2 + 1, M, 0, 3.3, 9.6, fs * 0.85);
  }

  await ctx.yield?.();
  // the anchored pair's crossed prow spars over the portal
  const px0 = portalAt[0], pz0 = portalAt[1] - 1.5, gate = new THREE.Group();
  {
    const sb = new SB(300), red = mats.P[3], cream = mats.P[6], yel = mats.P[4];
    for (const s of [1, -1]) {
      sb.col(s > 0 ? red : yel, cream).pat(PAT.STRIPE_U, 1.3, 0);
      const ax = s * 6.4, ay = 9.3, bx = -s * 3.4, by = 14.6, nx = -(by - ay), ny = (bx - ax), nl = Math.hypot(nx, ny), w = 0.34;
      const ox = (nx / nl) * w, oy = (ny / nl) * w, zz = s * 0.25;
      sb.quad([ax - ox, ay - oy, zz], [bx - ox * 0.4, by - oy * 0.4, zz], [bx + ox * 0.4, by + oy * 0.4, zz], [ax + ox, ay + oy, zz]);
    }
    const m = new THREE.Mesh(sb.build(), mats.mat()); m.frustumCulled = false; gate.add(m);
    gate.position.set(px0, 0, pz0); object.add(gate);
  }
  const gflags = new THREE.InstancedMesh(flagGeo, flagMat, 2); gflags.frustumCulled = false; object.add(gflags);
  gflags.setColorAt(0, C.setRGB(qs(rng()), 0, 0)); gflags.setColorAt(1, C.setRGB(qs(rng()), 0, 0));

  // on lantern nights every boat on the sea carries one yellow lamp with a comma of reflection
  let lamps = null;
  if (look.night) {
    const sb = new SB(60), lc = enc('#FFD23F');
    sb.col(lc, enc('#FF9A3A')).pat(PAT.DISC, 0, FLG.GLOW | FLG.NOBRONZE, 0.9).quad([-0.38, 0, 0], [0.38, 0, 0], [0.38, 0.76, 0], [-0.38, 0.76, 0]).quad([0, 0, -0.38], [0, 0, 0.38], [0, 0.76, 0.38], [0, 0.76, -0.38]);
    sb.col(lc, lc).pat(PAT.DISC, 0, FLG.GLOW | FLG.NOBRONZE | FLG.NOBORDER, 0).quad([-0.3, -3.25, -3.6], [0.3, -3.25, -3.6], [0.3, -3.25, -6.4], [-0.3, -3.25, -6.4]);
    lamps = new THREE.InstancedMesh(sb.build(), plainMat, NRET + NE + anchored.length); lamps.frustumCulled = false; lamps.name = 'boat-lamps'; object.add(lamps);
  }
  await ctx.yield?.();
  const spray = spriteMesh(U, Math.round(640 * det), 0, rng); spray.name = 'spray'; object.add(spray);
  spray.material.uniforms.uAnchor.value.set(meet.x, 105);
  let fish = null;
  if (opts.rare) { fish = spriteMesh(U, Math.round(1500 * det), 1, rng); fish.name = 'sardinella'; object.add(fish); }
  const sm = (a, b, x) => sstep(a, b, x);

  function update(dt, time, camera, u = 0) {
    state.time = time;
    const kt = keyTau(u);
    if (!state.init || Math.abs(u - state.u) > 0.02) { state.tau = kt; state.init = true; } else {
      let diff = kt - state.tau; diff -= period * Math.round(diff / period);
      state.tau += dt * (1 + Math.min(0.6, Math.max(-0.6, diff * 0.6)));
    }
    state.u = u; U.uTau.value = state.tau;
    const tau = state.tau, L4 = 4 * L;
    // returning boats ride their crest shoreward, bows down
    for (let i = 0; i < NR; i++) {
      const b = ret[i], zr = L4 - (((Cw * tau + wig(b.x) + (b.j + b.fo) * L) % L4) + L4) % L4, z = zr - 2.2;
      const hb = heightAt(b.x, z - 7), hs = heightAt(b.x, z + 7), hm = heightAt(b.x, z);
      const sc = b.sc * sm(L4, L4 - 40, zr) * sm(2, 20, zr);
      retPos[i * 3] = b.x; retPos[i * 3 + 1] = hm; retPos[i * 3 + 2] = z;
      if (lamps) { T.set(b.x, hm + 3.3 * sc, z); FQ.identity(); S.set(sc, sc, sc); FM.compose(T, FQ, S); lamps.setMatrixAt(i, FM); }
      setBoat(i, b.x + 0.6 * Math.sin(time * 0.7 + i), (hb + hs + 2 * hm) / 4 - 0.4, z, Math.PI + 0.05 * Math.sin(time * 0.5 + i * 2), Math.atan2(hs - hb, 14) * 0.9 + 0.03, 0.06 * Math.sin(time * 1.3 + i * 1.7), sc);
      putCrew(i, b.x, z);
    }
    // boats going down the rollers into the sea
    for (let i = 1; i < 4; i++) {
      const b = launch[i]; let z, sc = 1;
      { const p = (time / 30 + b.ph) % 1; z = -32 + sm(0, 0.85, p) * 52; sc = sm(0, 0.05, p) * (1 - sm(0.92, 1, p)); }
      const hb = groundY(b.x, z + 7), hs = groundY(b.x, z - 7);
      setBoat(NR + i, b.x, (hb + hs + 2 * groundY(b.x, z)) / 4, z, 0, Math.atan2(hs - hb, 14), z < 2 ? 0.04 * Math.sin(time * 5 + i) : 0.06 * Math.sin(time * 1.2 + i), sc);
    }
    for (let i = 0; i < moored.length; i++) {
      const b = moored[i];
      const rock = b.still ? 0 : 1, bx = b.ux ? b.x + b.ux * u : b.vx ? ((((b.x + b.vx * time + 520) % 1040) + 1040) % 1040) - 520 : b.x, fade = b.vx && !b.ux ? sm(520, 480, Math.abs(bx)) : 1;
      setBoat(NR + 4 + i, bx, (b.y ?? -0.38) + 0.05 * rock * Math.sin(time * 1.3 + i * 1.9), b.z, b.yaw, 0.012 * rock * Math.sin(time * 0.9 + i), b.still ? (b.roll ?? 0.2) : 0.075 * Math.sin(time * 1.1 + i * 2.1), (b.sc ?? 0.8) * fade);
    }
    const bob = 0.2 * Math.sin(time * 0.8), i0 = NR + 4 + moored.length;
    setBoat(i0, px0 + 31.2, -0.8 + bob, pz0, -Math.PI / 2, 0, 0.02 * Math.sin(time * 0.7), 2);
    setBoat(i0 + 1, px0 - 31.2, -0.8 + bob, pz0, Math.PI / 2, 0, 0.02 * Math.sin(time * 0.7 + 1), 2);
    gate.position.y = bob;
    // the convoy
    const zc = zOf(u), wph = time * 0.55;
    for (let k = 0; k < NE; k++) {
      // the two nearest change places as we go: one drops back alongside while the other pulls ahead, so no two moments of the run are the same view
      // (the sailing one comes close alongside on the left between the first two breakers while the launch boat runs ahead on the right, then they change over)
      const b = ESC[k], gt = sm(0.69, 0.72, u), cs = Math.cos((u - 0.7) * 34.9), swing = k === 0 ? (2 - 7 * cs) * gt : k === 1 ? (11 * cs - 6) * gt : 0, free = zc + b.lead + swing; let z, go;
      if (k === 0) {
        const zl = -31 + sm(meet.uLa ?? 0.5, meet.uLb ?? 0.72, u) * 60, fg = free - 40 * (1 - sm(0.6, 0.72, u));
        go = sat((fg - zl) / 8) * sat((b.cap - free) / 10); z = smin(smax(zl, fg + 2.2 * Math.sin(time * 0.33 + b.ph) * go, 5), b.cap, 8);
      } else { go = sat((free - b.wait) / 8) * sat((b.cap - free) / 10); z = smin(smax(b.wait, free + 3 * Math.sin(time * 0.3 + b.ph) * go, 6), b.cap, 8); }
      const L7 = 7 * b.sc, bx = b.x + 0.45 * go * Math.sin(time * 0.23 + b.ph * 2), hb = groundY(bx, z + L7), hs = groundY(bx, z - L7), hm = groundY(bx, z);
      setBoat(k === 0 ? NR : i0 + 1 + k, bx, (hb + hs + 2 * hm) / 4, z, 0, Math.atan2(hs - hb, 2 * L7), z < 2 ? 0.04 * Math.sin(time * 5 + k) : 0.06 * Math.sin(time * 1.2 + k * 1.9), b.sc);
      dress.setMatrixAt(k, M); if (b.sail !== undefined) sailM[b.sail].setMatrixAt(b.si, M);
      if (k === 0) putFlag(dflags, NR * 2, M, 0, 2.3, 2.6, b.sc * 1.05);      // its stern flag flies amidships, where the eye can hold it whole
      if (k >= 2) putCrew(NRET + k - 2, bx, z);
      if (lamps) { T.set(0, 3.7, -0.6).applyMatrix4(M); T.y = hm + 0.42 + 3.3 * b.sc; FQ.identity(); S.set(b.sc, b.sc, b.sc); FM.compose(T, FQ, S); lamps.setMatrixAt(NRET + k, FM); }
      escPos[k * 4] = bx; escPos[k * 4 + 1] = hm; escPos[k * 4 + 2] = z; escPos[k * 4 + 3] = go;
      for (let j = 0; j < 3; j++) { const o = ((j + ((wph + k * 0.37) % 1)) / 3) * 12; putWake(k * 3 + j, bx, z - 10.3 * b.sc - o, 0, (1.1 + 0.17 * o) * b.sc * sm(0, 1.2, o) * sm(12, 9.5, o) * go); }
    }
    // a river pirogue that crosses the bow just beyond the bridge, keyed to u
    if (cross) {
      const z = cross.z - 600 * (Math.min(u, 0.16) - 0.094) - Math.max(0, u - 0.16) * 60, cs = cross.sc ?? 0.9;
      setBoat(i0 + NE + 1, cross.x, -0.38 + 0.05 * Math.sin(time * 1.3), z, Math.PI, 0.012 * Math.sin(time * 0.9), 0.06 * Math.sin(time * 1.1), cs);
      for (let j = 0; j < 3; j++) { const o = ((j + (wph % 1)) / 3) * 11; putWake(NE * 3 + j, cross.x, z + 10.3 * cs + o, Math.PI, (1.0 + 0.16 * o) * cs * sm(0, 1.2, o) * sm(11, 8.5, o)); }
    } else { setBoat(i0 + NE + 1, 0, -40, 0, 0, 0, 0, 0.001, false); for (let j = 0; j < 3; j++) putWake(NE * 3 + j, 0, -40, 0, 0); }
    // the boats at anchor ride the swell, bows as they were laid
    for (let j = 0; j < anchored.length; j++) {
      const b = anchored[j], L7 = 7 * b.sc, sy = Math.sin(b.yaw) * L7, cy = Math.cos(b.yaw) * L7, hb = heightAt(b.x + sy, b.z + cy), hs = heightAt(b.x - sy, b.z - cy), hm = heightAt(b.x, b.z);
      setBoat(i0 + NE + 2 + j, b.x, (hb + hs + 2 * hm) / 4 - 0.42 * b.sc, b.z, b.yaw, Math.atan2(hs - hb, 2 * L7), 0.02 * Math.sin(time * 0.8 + j * 2.1), b.sc);
      if (b.sail !== undefined) sailM[b.sail].setMatrixAt(b.si, M);
      if (lamps) { T.set(0, 0, -3).applyMatrix4(M); T.y = hm + 3.3 * b.sc; FQ.identity(); S.set(b.sc, b.sc, b.sc); FM.compose(T, FQ, S); lamps.setMatrixAt(NRET + NE + j, FM); }
    }
    for (let v = 0; v < 3; v++) sailM[v].instanceMatrix.needsUpdate = true;
    // every fifth beached hull rocks a degree on its keel
    for (let k = 0; k < rockers.length; k++) { const r = rockers[k]; E.set(r.ex, r.ey, r.ez + 0.026 * Math.sin(time * 0.9 + r.i * 1.7), 'XYZ'); T.set(r.x, r.y, r.z); S.set(1, 1, r.sc); M.compose(T, Q.setFromEuler(E), S); fleet.setMatrixAt(r.i, M); }
    fleet.instanceMatrix.needsUpdate = true; dress.instanceMatrix.needsUpdate = true; crew.instanceMatrix.needsUpdate = true; wake.instanceMatrix.needsUpdate = true;
    for (let s = 0; s < 2; s++) { T.set(px0 + (s ? 3.4 : -3.4), 14.4 + bob - 2.3 * 1.5, pz0 + (s ? -0.25 : 0.25)); FQ.setFromAxisAngle(_up, windYaw); S.set(1.5, 1.5, 1.5); FM.compose(T, FQ, S); gflags.setMatrixAt(s, FM); }
    dyn.instanceMatrix.needsUpdate = true; dflags.instanceMatrix.needsUpdate = true; gflags.instanceMatrix.needsUpdate = true;
    if (lamps) lamps.instanceMatrix.needsUpdate = true;
    if (fish) fish.material.uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);
  }

  return {
    object, radius: 320, height: 16, center: new THREE.Vector3(meet.x, 3, 60), ground: false, mats,
    anchors: {
      portal: new THREE.Vector3(portalAt[0], 2.6, portalAt[1]), fleetVanish: new THREE.Vector3(-880, 2.2, -23), fleetNear: new THREE.Vector3(-60, 2.5, -23),
      bowsZ: -22, sternsZ: -47, lanes: [0, -100, -200, 100, 200], launchX: meet.x - 7, breakers: [55, 98, 141],
    },
    heightAt, sandY, keyTau, state, period, slots, retPos, escPos,
    update,
    dispose() {},
  };
}
