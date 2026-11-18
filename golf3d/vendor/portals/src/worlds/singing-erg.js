// THE SINGING ERG. Noon under a black sky on a thin-aired world: a sleigh run behind a heliograph caravan along a
// knife crest, down an avalanching slip face, across a lavender hardpan among silica blooms and prism-back
// walkers, up a saddle in the arm of a star dune and headlong down into the bowl of the Choir, to the portal on
// the white point of its rose window.
// Style rule (the brief's): everything is authored in black, white and pale lavender; saturation exists only as
// spectral light (prism fans, grain glints). All world materials are self-lit ShaderMaterials sharing the
// hero's sun uniforms; the two three.js lights exist only for the ride.
// Looks by seed / ctx.vary.hour: noon | low afternoon sun (long shadows) | double-moon night. Weather by seed:
// grain wind | glitter devils | meteor shower. Cast by seed: caravan length, herd size and calves, glass-skaters
// or crystal tumbleweeds. Rare (ctx.vary.rare): a moon crosses the sun on the climb, every fan snuffs out, and
// the rose window re-ignites petal by petal during the run into the bowl.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, WINDOW_GLSL, COMMON_GLSL } from '../parts/singing-erg.js';

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const V3 = THREE.Vector3;
const EU = [0.6, 0.8], EV = [0.8, -0.6], GC = [250, 665];      // terrain grid frame: u runs up the route, v across it
const NX = 248, NZ = 296;
const gridV = (s) => 260 * s + 2700 * s * s * s, gridU = (t) => 900 * t + 2200 * t * t * t;
const WIND = EU;                                               // sand moves this way: slip faces look back at the camera

// ---------------------------------------------------------------- polyline helpers
// nearest point on a polyline of [x, z, a, b]: distance, signed side (+ = right of travel), interpolated a and b
function nearPoly(pts, x, z, out) {
  let best = 1e18, bs = 1, ba = 0, bb = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1], ex = q[0] - p[0], ez = q[1] - p[1];
    let t = ((x - p[0]) * ex + (z - p[1]) * ez) / (ex * ex + ez * ez); t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = x - (p[0] + ex * t), dz = z - (p[1] + ez * t), d = dx * dx + dz * dz;
    if (d < best) { best = d; bs = (-ez * dx + ex * dz) >= 0 ? 1 : -1; ba = p[2] + (q[2] - p[2]) * t; bb = p[3] + (q[3] - p[3]) * t; }
  }
  out.d = Math.sqrt(best); out.side = bs; out.a = ba; out.b = bb; return out;
}
function spline2(pts, step) {                                  // dense XZ samples through way-points
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new V3(p[0], 0, p[1])), false, 'centripetal');
  const n = Math.ceil(c.getLength() / step), out = [];
  for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n); out.push([p.x, p.z]); }
  return out;
}

// ---------------------------------------------------------------- the land: height function, route, masks
export function planLand(ctx, hero, rng) {
  const noise = ctx.noise, H0 = hero.anchors.heightAt, o1 = rng.range(0, 50), o2 = rng.range(0, 50);
  const P = (th, r, h) => [r * Math.sin(th * D2R), r * Math.cos(th * D2R), h, 0];
  const j = () => rng.range(0.9, 1.1);
  // the star dune: a massif wrapped round the near side of the bowl; summit ahead-left, a 36 m saddle in its right arm
  const massif = [P(-100, 480, 50), P(-70, 460, 105 * j()), P(-45, 452, 160 * j()), P(-28, 455, 215), P(-18, 450, 190), P(-8, 444, 100),
    P(5, 438, 36), P(18, 444, 100), P(28, 450, 150), P(40, 458, 178 * j()), P(56, 462, 150 * j()), P(76, 468, 115 * j()), P(98, 475, 80), P(122, 485, 50)];
  const summit = new V3(massif[3][0], massif[3][2], massif[3][1]);
  // the opening barchan: we ride its crest, then drop off its concave slip face
  const d0 = [[640, 1210, 30, 0], [560, 1095, 50, 0], [470, 960, 56, 0], [425, 890, 56, 0], [372, 858, 54, 0], [300, 852, 50, 0], [225, 876, 42, 0], [150, 925, 28, 0]];
  const spur = [[60, 462, 36, 0], [38, 436, 38, 0], [20, 388, 42, 0], [4, 340, 47, 0]];   // the hanging valley floor between the arm's saddle and the rim
  const way = [[503, 1010], [470, 960], [425, 890], [392, 800], [340, 728], [272, 650], [185, 560], [100, 482], [38, 436], [9, 372], [0, 331]];
  const route2 = spline2(way, 20);                             // outside the bowl, [x, z, s, groundY]
  let s = 0; route2.forEach((p, i) => { if (i) s += Math.hypot(p[0] - route2[i - 1][0], p[1] - route2[i - 1][1]); p[2] = s; p[3] = 0; });
  const flatC = [338, 742], np = { d: 0, side: 1, a: 0, b: 0 };
  const flatMask = (x, z) => {
    const dx = x - flatC[0], dz = z - flatC[1], a = (dx * EU[0] + dz * EU[1]) / 120, b = (dx * EV[0] + dz * EV[1]) / 215;
    return 1 - smoothstep(0.55, 1.15, Math.sqrt(a * a + b * b) + 0.12 * noise.n2(x * 0.006 + o1, z * 0.006));
  };
  const saw = (p, dn) => { const f = p - Math.floor(p), up = 1 - dn; return f < up ? 0.5 - 0.5 * Math.cos(Math.PI * f / up) : 1 - (f - up) / dn; };
  const dunes = (x, z) => {
    const u = x * WIND[0] + z * WIND[1], v = x * EV[0] + z * EV[1];
    const amp = 0.3 + 0.7 * smoothstep(-0.5, 0.6, noise.n2(u * 0.0011 + o1, v * 0.0008 + o2));
    const h1 = saw(u / 470 + 0.5 * noise.n2(v * 0.0016 + o2, u * 0.0006) + 0.2, 0.3 * amp) * amp, a2 = 0.35 + 0.65 * amp;
    const h2 = saw((u * 0.94 + v * 0.34) / 97 + 0.6 * noise.n2(v * 0.006, u * 0.003 + o1), 0.2 * a2);
    return 92 * h1 + 11 * h2 * a2;
  };
  const tent = (pts, x, z, sr, sl) => { nearPoly(pts, x, z, np); return np.a - np.d * (np.side > 0 ? sr : sl); };
  const smax = (a, b, k) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k));
  const inBox = (x, z) => { const dx = x - GC[0], dz = z - GC[1], u = dx * EU[0] + dz * EU[1], v = dx * EV[0] + dz * EV[1]; return Math.abs(v) < 330 && u > -520 && u < 560; };
  const rn = { d: 0, side: 1, a: 0, b: 0 }; let rnx = NaN, rnz = NaN;
  const routeNear = (x, z) => { if (x !== rnx || z !== rnz) { nearPoly(route2, x, z, rn); rnx = x; rnz = z; } return rn; };
  const natural = (x, z) => {
    const r = Math.hypot(x, z);
    if (r < 331) return H0(x, z) - 0.35;
    let dp = 400; if (inBox(x, z)) dp = routeNear(x, z).d;
    const wf = smoothstep(40, 220, dp);
    const wx = x + 26 * wf * noise.n2(x * 0.0035 + o2, z * 0.0035), wz = z + 26 * wf * noise.n2(x * 0.0035, z * 0.0035 + o1 + 9);
    const fm = flatMask(x, z);
    let g = dunes(x, z) * smoothstep(50, 260, dp) * (1 - fm) * smoothstep(380, 620, r);
    g = smax(g, tent(massif, wx, wz, 0.5, 0.56), 30);
    g = smax(g, tent(d0, wx, wz, 0.6, 0.2), 14);
    g = smax(g, tent(spur, x, z, 0.3, 0.3), 20);
    g = lerp(g, 0, fm * (1 - smoothstep(4, 40, g)));
    return r < 372 ? lerp(H0(x, z) - 0.35, g, smoothstep(331, 372, r)) : g;
  };
  // the route hugs the sand: ground under it = the natural ground, smoothed along the way
  const raw = route2.map((p) => natural(p[0], p[1]));
  route2.forEach((p, i) => { let a = 0, n = 0; for (let k = -1; k <= 1; k++) { const q = raw[clamp(i + k, 0, raw.length - 1)]; a += q; n++; } p[3] = a / n; });
  const sLen = route2[route2.length - 1][2];
  rnx = NaN;                                                  // the cached search above saw the route before its ground heights were set
  const height = (x, z) => {
    const g = natural(x, z);
    if (!inBox(x, z) || Math.hypot(x, z) < 331) return g;
    const near = routeNear(x, z);
    return lerp(near.b, g, Math.max(smoothstep(5, 46, near.d), 1 - smoothstep(334, 352, Math.hypot(x, z))));
  };
  // track coordinates for the trampled trail: lateral metres (signed), metres along
  const track = (x, z, out) => { if (!inBox(x, z)) { out.d = 999; return out; } const q = routeNear(x, z); out.d = q.d * q.side; out.a = q.a; return out; };
  return { height, natural, flatMask, track, route2, sLen, massif, d0, summit, flatC };
}

// The sleigh does not ride in the caravan's wake: it runs 11 to 15 m to the right of their trail, on the sun's side,
// from the first crest to the foot of the saddle, and draws level with the file on the flat and the climb. So the
// beasts are seen in echelon and three-quarter, their sunlit flanks and mirrors beside the camera and their shadows
// thrown away from us, never the whole file from dead astern. Metres to the right of the trail at s metres along it.
const hump = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const BEND = [[0, 14], [110, 11], [250, 15], [655, 15], [745, 0]];
export const bendAt = (s) => {
  if (s <= BEND[0][0]) return BEND[0][1];
  for (let i = 0; i < BEND.length - 1; i++) { const a = BEND[i], b = BEND[i + 1]; if (s <= b[0]) return lerp(a[1], b[1], hump((s - a[0]) / (b[0] - a[0]))); }
  return 0;
};
// the leap off the saddle lip: [z, metres above the sand]. The whole rose window is seen from the air before the drop.
const LEAP = [[330, 4.2], [314, 7.5], [298, 17], [280, 22.5], [262, 19.5], [244, 16.5], [226, 13], [208, 10], [190, 7.6]];
export function planPath(land, hero) {
  const pts = [], R = land.route2, H0 = hero.anchors.heightAt;
  for (let i = 0; i < R.length; i++) {
    const p = R[i]; if (p[1] <= 345) continue;
    const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, bd = bendAt(p[2]);
    if (Math.abs(bd) < 0.01) { pts.push(new V3(p[0], p[3] + 2.7, p[1])); continue; }
    const x = p[0] - (b[1] - a[1]) / tl * bd, z = p[1] + (b[0] - a[0]) / tl * bd;
    let g = land.height(x, z); for (const e of [-9, 9]) g = Math.max(g, land.height(x + (b[0] - a[0]) / tl * e, z + (b[1] - a[1]) / tl * e) - 0.6);
    pts.push(new V3(x, g + 2.7, z));
  }
  for (const q of LEAP) pts.push(new V3(0, H0(0, q[0]) + q[1], q[0]));
  for (const f of hero.anchors.flyThrough) if (f.z < 180) { const q = f.clone(); q.y += 2.6 * smoothstep(40, 96, f.z); pts.push(q); }     // the run in stays a little above the sand, so the rose window reads as a figure
  return makePath(pts, { samples: 420 });
}
// ----- BUILD

// ---------------------------------------------------------------- GLSL
const SPARKLE_GLSL = /* glsl */`
vec3 sparkle(vec3 P, vec3 V, float dist){
  float lvl=log2(max(dist,2.)*.011); float fl=floor(lvl), fr=lvl-fl; vec3 acc=vec3(0.);
  vec3 Hh=normalize(uSun+V);
  for(int k=0;k<2;k++){
    float cs=exp2(fl+float(k)); vec2 g=P.xz/cs; vec2 id=floor(g); vec2 f=fract(g)-.5;
    vec3 h=h23(id+cs*17.31);
    float d=length(f-(h.xy-.5)*.6);
    vec3 fn=normalize(vec3((h.x-.5)*1.5+.28*sin(uTime*(1.+h.z*3.)+h.x*40.),1.,(h.z-.5)*1.5+.28*cos(uTime*(1.3+h.x*3.)+h.z*40.)));
    float g1=pow(max(dot(fn,Hh),0.),48.);
    float w=(k==0)?1.-fr:fr;
    vec3 hue=mix(vec3(1.),spectral(fract(h.z*5.+dot(V,fn)*3.)),.75);
    acc+=hue*g1*smoothstep(.2,.04,d)*w;
  }
  // looking up-sun the whole sand is the sun's glitter path: there the grains are thinned, so the ground keeps its form and colour
  return acc*7.*uSparkle*mix(1.,.26,smoothstep(.74,.9,Hh.y));
}`;
// the song: rings racing outward from the white point every 3.5 s, plus one scripted ring (the slip face letting go)
const RINGS_GLSL = /* glsl */`
uniform float uSongT, uBandK; uniform vec4 uRing;
float songPer(vec2 p, float w){
  float r=length(p), a=0.;
  for(int k=0;k<3;k++){ float rr=(uSongT+3.5*float(k))*150.; float x=(r-rr)/w; a+=exp(-x*x)*max(0.,1.-rr/1500.)*smoothstep(0.,60.,rr); }
  return a;
}
float songRings(vec2 p, float w){
  float r2=length(p-uRing.xy); float x2=(r2-uRing.z)/w, x3=(r2-uRing.z*.62)/w;
  return songPer(p,w)+(exp(-x2*x2)+.6*exp(-x3*x3))*uRing.w;
}
// the scripted ring seen on the sand: the song made visible, three bands of the whole spectrum racing outward.
// Returns (coverage, hue 0..1 from the leading red edge to the trailing violet one)
vec2 songBand(vec2 p, float w){
  float r2=length(p-uRing.xy);
  float x1=(r2-uRing.z)/w, x2=(r2-uRing.z*.62)/w, x3=(r2-uRing.z*.36)/w;
  float c1=1.-smoothstep(1.,2.,abs(x1)), c2=(1.-smoothstep(1.,2.,abs(x2)))*.8, c3=(1.-smoothstep(1.,2.,abs(x3)))*.6;
  float c=max(c1,max(c2,c3)); float x=(c1>=c2&&c1>=c3)?x1:((c2>=c3)?x2:x3);
  return vec2(c*min(uRing.w,1.)*uBandK*smoothstep(4.,30.,r2),clamp(.5-x*.25,0.,1.));
}`;

const LAND_VS = /* glsl */`
attribute vec4 aD; attribute vec2 aT; varying vec3 vP; varying vec3 vN; varying vec4 vD; varying vec2 vT;
#include <fog_pars_vertex>
void main(){
  vP=position; vN=normal; vD=aD; vT=aT;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LAND_FS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec4 vD; varying vec2 vT;
uniform vec3 uSun, uSunCol, uAmb, uSand, uLav, uHaze;
uniform float uSparkle, uTime, uAval, uDrift, uTrailEnd, uFill;
uniform vec2 uWind;
uniform sampler2D uShadow; uniform vec4 uShA; uniform vec3 uShC;
uniform vec4 uMono[7]; uniform vec4 uMonoB[7]; uniform vec3 uBeast[16];
uniform vec4 uSpire[8]; uniform vec4 uSpireB[8]; uniform float uFanOn;          // crystal spires beside the climb: (x, z, fan dir) and (reach, tan half angle, -, strength)
#include <fog_pars_fragment>
${COMMON_GLSL}
${SPARKLE_GLSL}
${RINGS_GLSL}
float monoShadow(vec3 P){
  float sh=1.; float lxz=max(length(uSun.xz),1e-4); vec2 u=uSun.xz/lxz; float tanE=uSun.y/lxz;
  float fw=fwidth(dot(P.xz,vec2(-u.y,u.x)));
  for(int i=0;i<7;i++){
    vec2 e=P.xz-uMono[i].xy; float tt=dot(e,u); float perp=dot(e,vec2(-u.y,u.x));
    float hg=P.y-tt*tanE-uMonoB[i].x; float H=uMono[i].z;
    float rad=(hg<uMonoB[i].y?uMonoB[i].z:uMono[i].w)*(1.-.94*smoothstep(H*.86,H,hg));
    float d=max(abs(perp)-rad,(hg-H)*.6); d=max(d,tt+rad*.3);
    float w=.3+fw*1.2; sh=min(sh,smoothstep(-w,w,d));
  }
  return sh;
}
// cracked hardpan: jittered polygon plates. Returns (distance to the nearest edge, cell id, edge id)
vec3 plates(vec2 p){
  vec2 id=floor(p), f=fract(p); float d1=9., d2=9.; float c1=0., c2=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){
    vec2 o=vec2(float(i),float(j)); vec3 h=h23(id+o); float d=length(o+h.xy*.86+.07-f);
    if(d<d1){ d2=d1; c2=c1; d1=d; c1=h.z; } else if(d<d2){ d2=d; c2=h.z; }
  }
  return vec3(d2-d1,c1,fract((c1+c2)*7.13));
}
void main(){
  vec3 P=vP; float dist=length(cameraPosition-P); vec3 V=(cameraPosition-P)/max(dist,1e-3);
  vec3 Ng=normalize(vN); vec3 N=Ng; float fm=vD.z;
  // the dune shadow field: a signed texture over the patch near the route (re-thresholded here for a razor edge),
  // the per-vertex field beyond it. All derivatives are taken here, before any loop.
  vec2 sq=P.xz-uShC.xy; vec2 suv=vec2(dot(sq,uShA.xy),dot(sq,uShA.zw))*uShC.z+.5;
  vec2 sb=abs(suv-.5); float inT=1.-smoothstep(.45,.495,max(sb.x,sb.y));
  float sfar=smoothstep(60.,300.,dist);
  float rimK=1.-smoothstep(335.,420.,length(P.xz));          // the hanging valley and the rim stay in the sun: only deep shadow survives there, as a clean shape
  // read two to three mips down, and ask for a deeper shadow the further away it is: shallow shadow islands dissolve
  // (no mottled faces on the far dunes), only the big slip-face shapes stay
  float se=(texture2D(uShadow,suv,1.9+1.3*sfar).r-.5)*2.-.03-.3*sfar-1.4*rimK;
  float sfw=fwidth(se)*.9+.003; float shT=1.-smoothstep(-sfw,sfw,se);
  float vw=fwidth(vD.y)*1.1+.012; float shV=1.-smoothstep(-vw,vw,vD.y);
  float sh=mix(mix(shV,1.,rimK),shT,inT);
  vec2 wp=vec2(dot(P.xz,uWind),dot(P.xz,vec2(uWind.y,-uWind.x)));
  // wind ripples: in patches, and gone before their wavelength reaches a few pixels (no moire stripes on far slopes)
  float ra=wp.x*1.9+vn(wp*.07)*9.+vn(wp*.4)*2., rb=wp.x*.42+vn(wp*.021)*8.;
  float fa=1.-smoothstep(.5,1.5,fwidth(ra)), fb=1.-smoothstep(.5,1.5,fwidth(rb));
  float rpat=smoothstep(.34,.62,vn(P.xz*.013+3.7));
  float rc=wp.x*12.+vn(wp*.55)*5.+vn(wp*.1)*8.; float fc=(1.-smoothstep(.3,1.1,fwidth(rc)))*(.3+.7*rpat)*(1.-fm);          // hand-width ripples, only near the eye
  N=normalize(N+(vec3(uWind.x,0.,uWind.y)*(sin(rc)*.2*fc+sin(ra)*.12*fa*rpat+sin(rb)*.05*fb*(.35+.65*rpat))+vec3(vn(P.xz*.045)-.5,0.,vn(P.xz*.045+7.3)-.5)*.08)*(1.-fm*.85));
  sh=min(sh,monoShadow(P));
  sh=min(sh,smoothstep(.0,.09,dot(Ng,uSun)));               // a face turned from the sun is in shade, whatever the bake says
  // the caravan's shadows: each beast throws a long blue-black shape (legs, barrel, neck, mirror) down-sun
  { float lxz=max(length(uSun.xz),1e-4); vec2 sd=-uSun.xz/lxz; float sl=9.6*lxz/max(uSun.y,.2); float bs=0.;
    float bw=fwidth(P.x)+fwidth(P.z);
    for(int i=0;i<16;i++){
      vec2 e=P.xz-uBeast[i].xy; float tt=clamp(dot(e,sd)/sl,0.,1.); float d=length(e-sd*(tt*sl));
      float x1=(tt-.52)/.17, x2=(tt-.97)/.07;
      float rad=.4+1.25*exp(-x1*x1)+1.1*exp(-x2*x2);
      bs=max(bs,(1.-smoothstep(rad-.12-bw,rad+.12+bw,d))*uBeast[i].z);
    }
    sh*=1.-.92*bs; }
  float ndl=min(pow(max(dot(N,uSun),0.),1.15)*.86,1.);
  vec3 alb=mix(uSand,uLav,clamp(vn(P.xz*.011)*.5+(1.-N.y)*1.6-.2,0.,1.)*.7);
  if(fm>.01){
    float nf=1.-smoothstep(60.,260.,dist);
    vec2 hq=P.xz+vec2(vn(P.xz*.09),vn(P.xz*.09+5.3))*3.2+vec2(vn(P.xz*.41+1.7),vn(P.xz*.41+9.1))*1.3;
    vec2 su=normalize(uSun.xz+vec2(1e-4));
    // three scales: master cracks ~4.5 m apart, plates ~1.5 m (four in ten of their edges healed), hairlines near the eye
    vec3 p1=plates(hq*.22), p1s=plates((hq+su*.3)*.22), pm=plates(hq*.66+4.3), p2=plates(hq*2.1+11.);
    float nz=vn(P.xz*.31+2.), lw=dist*.0011;
    float w1=(.01+.05*nz*nz+lw)*.6;
    float keep=mix(.3,1.,step(.25,p1.z))*(.5+.5*vn(P.xz*.8));
    float crack=(1.-smoothstep(0.,w1,p1.x))*keep;
    float wm=.012+.03*nz+lw*1.6;
    crack=max(crack,(1.-smoothstep(0.,wm,pm.x))*step(.4,pm.z)*(.3+.5*vn(P.xz*1.3+3.))*(1.-smoothstep(70.,200.,dist)));
    float fine=(1.-smoothstep(0.,.03+lw*3.,p2.x))*.38*step(.3,p2.z)*(1.-smoothstep(18.,80.,dist));
    float rim=smoothstep(w1*5.+.08,w1,p1.x)*keep*nf;                        // curled plate edges
    float side=clamp((p1s.x-p1.x)*9.,-1.,1.);                              // +: this lip faces the sun
    vec3 hp=uLav*(.7+.13*p1.y+.1*pm.y+.12*vn(P.xz*.6)-.1*vn(P.xz*.02));
    hp*=1.+rim*max(side,0.)*.55;
    hp=mix(hp,uSand*1.15,rim*max(-side,0.)*(.35+.65*vn(P.xz*7.))*.7);       // frost fur on the shaded lip
    hp*=1.-(.78*crack+fine)*nf;
    alb=mix(alb,hp,fm);
  }
  // the caravan's trampled trail and an older pair of runner grooves, up to the rim
  float lat=abs(vT.x), tr=step(vT.y,uTrailEnd)*(1.-smoothstep(60.,220.,dist));
  float row=smoothstep(2.1,.5,abs(lat-7.2));
  float pr=smoothstep(.55,.32,length(vec2((fract(vT.y/2.7+step(0.,vT.x)*.5+h11(floor(vT.y/2.7))*.2)-.5)*2.7,(lat-7.2)+(h11(floor(vT.y/2.7)+7.)-.5)*2.4)));
  float gro=smoothstep(.22,.05,abs(lat-1.25));
  alb*=1.-tr*(.5*row*pr+.22*gro+.06*smoothstep(10.,5.,lat));
  // blue-black shadow: sky fill from above, a breath of light bounced off the lit sand on steep faces
  vec3 Bd=normalize(vec3(-uSun.x,.4,-uSun.z)+vec3(0.,1e-4,0.));
  float bnc=max(dot(N,Bd),0.);
  vec3 fill=(mix(uAmb,vec3(dot(uAmb,vec3(.3333))),.22)*(1.2+.9*N.y)+uHaze*.012)*uFill+uSand*uSunCol*(.05*clamp(1.-Ng.y,0.,.3)*3.3+vec3(.6,.68,1.)*(.05*bnc*bnc+.035*bnc));
  fill*=1.+(sin(ra)*.1*fa*rpat+sin(rb)*.07*fb)*(1.-fm)*(1.-smoothstep(40.,170.,dist));          // wind ripples stay readable in the near shade, and are gone before they can band
  // the spires' fans: wedges of spectral light that replace the sunlight, each leaving a blade of shadow at its root
  vec3 spf=vec3(0.); float spc=0., sps=1.;
  for(int i=0;i<8;i++){
    vec2 e=P.xz-uSpire[i].xy, d=uSpire[i].zw; float s=dot(e,d), w=dot(e,vec2(d.y,-d.x)); float rch=uSpireB[i].x, sn=s/rch;
    float t=w/(max(s,1.)*uSpireB[i].y);
    float c=smoothstep(1.,.78,abs(t))*smoothstep(.06,.2,sn)*(1.-smoothstep(.5,1.,sn))*uSpireB[i].w;
    spf+=spectral(t*.5+.5)*c; spc+=c;
    sps=min(sps,smoothstep(.8,2.2,length(e-d*clamp(s,0.,rch*.15)))+1.-uSpireB[i].w);
  }
  spf/=max(spc,1.); float cv=min(spc,1.)*uFanOn*.94;
  ndl*=1.+.16*sin(ra)*fa*rpat*(1.-fm)*(1.-smoothstep(30.,110.,dist));          // the near ripples read in full sun too
  vec3 light=(uSunCol*ndl*sh*min(sps,1.)*(1.-cv)+fill)*(1.-.2*fc*(.5-.5*sin(rc)));          // their troughs hold a little shade
  light+=spf*cv*length(uSunCol)*.56*(.45+.55*sh);
  vec3 col=alb*light;
  float ring=songPer(P.xz,9.);
  col+=alb*ring*.42*(.6+ndl*sh)*length(uSunCol+uAmb);
  vec2 bnd=songBand(P.xz,11.);
  col=mix(col,alb*spectral(bnd.y)*(.5+.75*ndl*sh)*max(length(uSunCol)*.62,.8),bnd.x*.82);
  ring+=bnd.x*.3;
  // grains saltating down the wind
  float st=vn(vec2(wp.y*.11,wp.x*.016-uTime*.6))*vn(vec2(wp.y*.023+3.,wp.x*.006-uTime*.23));
  st=smoothstep(.3,.66,st)*(1.-fm*.4)*(1.-smoothstep(260.,900.,dist));
  // near the eye the drifting sheet breaks into streamers of grains (a flat sheet only whites the sand out), and it
  // thins where the song's colours lie
  float snear=1.-smoothstep(12.,75.,dist);
  st*=mix(1.,smoothstep(.34,.8,vn(vec2(wp.y*1.9,wp.x*.13-uTime*1.9)))*1.1,snear)*(1.-.75*bnd.x);
  col+=alb*st*mix(uDrift,min(uDrift,.5),snear)*(.2+ndl*sh)*uSunCol;
  // the slip face letting go in sheets
  float av=vD.w*uAval;
  float a1=vn(vec2(dot(P.xz,vec2(.86,-.5))*.16,P.y*.3+uTime*2.6))*vn(vec2(dot(P.xz,vec2(.86,-.5))*.05,P.y*.08+uTime*1.1));
  float sheet=smoothstep(.2,.5,a1)*av;
  col+=alb*sheet*(.15+ndl*sh*.45)*uSunCol;
  col+=sparkle(P,V,dist)*mix(1.,.3,smoothstep(250.,900.,dist))*uSunCol*(sh*.6+.4)*(1.+ring*4.+sheet*3.+st*uDrift*1.5);
  col=mix(col,fogColor,vD.x);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// props: creatures, crystals, mirrors. aK = (kind 0 matte / 1 crystal / 2 mirror / 3 emissive / 4 prism glass, part, pivot y, pivot z)
// prism glass takes its hue offset from the vertex colour's red channel and rings (flashes) when a song ring passes
const PROP_VS = /* glsl */`
attribute vec3 color; attribute vec4 aK;
#ifdef USE_INSTANCING
attribute vec4 aI;
#endif
uniform float uTime;
varying vec3 vWP; varying vec3 vWN; varying vec3 vCol; varying vec3 vK; varying float vG;
#include <fog_pars_vertex>
${RINGS_GLSL}
void main(){
  vec3 p=position, n=normal; vec4 inst=vec4(0.); mat4 M=modelMatrix; float flash=0.; vG=9.;
  #ifdef USE_INSTANCING
    inst=aI; M=modelMatrix*instanceMatrix;
  #endif
  #if MODE == 1
    if(aK.y>.5&&aK.y<4.5){                       // legs swing from the hip; the shank folds at the knee on the forward swing
      float lp=inst.x+aK.y*1.5708+step(2.5,aK.y)*.8;
      float a=sin(lp)*.5*inst.z;
      float kn=aK.z*.53, kb=max(sin(lp+1.1),0.)*.8*inst.z*smoothstep(kn+.1,kn-.5,p.y);
      vec2 qk=vec2(p.y-kn,p.z-aK.w); float ck=cos(kb), sk=sin(kb);
      p.y=kn+qk.x*ck+qk.y*sk; p.z=aK.w-qk.x*sk+qk.y*ck;
      vec2 q=vec2(p.y-aK.z,p.z-aK.w); float c=cos(a), s=sin(a);
      p.y=aK.z+q.x*c-q.y*s; p.z=aK.w+q.x*s+q.y*c; n.yz=vec2(n.y*c-n.z*s,n.y*s+n.z*c);
    } else if(aK.y<5.5&&aK.y>4.5){               // neck and head nod
      float k=max(p.y-aK.z,0.); p.y+=sin(inst.x*2.+.6)*.07*k*inst.z; p.z+=cos(inst.x*2.)*.06*k*inst.z;
    } else if(aK.y<6.5&&aK.y>5.5){               // the mirror rocks about its centre once per bound: the horizon slides across it
      float a=sin(inst.x)*.2*inst.z+.05*sin(uTime*1.3+inst.w*9.);
      vG=(p.y-aK.z)/1.6-sin(inst.x)*1.25*inst.z-sin(uTime*1.3+inst.w*9.)*1.4*(1.-inst.z);               // where the sun's glint lies on the glass: it sweeps the panel as the mirror rocks
      vec2 q=vec2(p.y-aK.z,p.z-aK.w); float c=cos(a), s=sin(a);
      p.y=aK.z+q.x*c-q.y*s; p.z=aK.w+q.x*s+q.y*c; n.yz=vec2(n.y*c-n.z*s,n.y*s+n.z*c);
    } else if(aK.y>6.5){                          // fringe and tail swing
      float k=max(aK.z-p.y,0.); p.x+=sin(inst.x*2.+p.z*2.3)*.13*k; p.z+=(.22+.2*cos(inst.x*2.+p.z*3.))*k*inst.z;
    }
    flash=inst.y;
  #endif
  #if MODE == 0
    if(aK.x>3.5) flash=clamp(songRings(M[3].xz,18.),0.,1.)*.4;          // spires ring like struck glass as the song passes
  #endif
  #if MODE == 2
    vec3 ip=M[3].xyz;                             // blades track the sun and flash in a wave across the flat
    float ph=uTime*1.5708-dot(ip.xz,vec2(.6,.8))*.035-aK.y*.37;
    flash=pow(max(sin(ph),0.),24.)+songRings(ip.xz,16.)*.5;
    float a=.1*sin(ph-.6); float c=cos(a), s=sin(a);
    p.xz=vec2(p.x*c-p.z*s,p.x*s+p.z*c); n.xz=vec2(n.x*c-n.z*s,n.x*s+n.z*c);
  #endif
  vec4 wp=M*vec4(p,1.); vWP=wp.xyz; vWN=normalize(mat3(M)*n); vCol=color; vK=vec3(aK.x,flash,inst.w+aK.y*.13);
  vec4 mvPosition=viewMatrix*wp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PROP_FS = /* glsl */`
varying vec3 vWP; varying vec3 vWN; varying vec3 vCol; varying vec3 vK; varying float vG;
uniform vec3 uSun, uSunCol, uAmb, uSand, uSky, uHaze; uniform float uEcl, uFlash, uPrism;
#include <fog_pars_fragment>
${COMMON_GLSL}
void main(){
  vec3 N=normalize(vWN); if(!gl_FrontFacing) N=-N;
  vec3 V=normalize(cameraPosition-vWP);
  float ndl=max(dot(N,uSun),0.);
  vec3 bounce=uSand*uSunCol*.2*clamp(.5-N.y*.5,0.,1.);
  float wr=max(dot(N,uSun)*.5+.5,0.);
  vec3 col=vCol*(uSunCol*(ndl*.85+wr*wr*.2)+mix(uAmb,vec3(dot(uAmb,vec3(.3333))),.4)*(.9+.5*N.y)+bounce*1.9);
  float nv=max(dot(N,V),0.);
  // back-lit rim: a white edge on every silhouette that stands between us and the sun
  col+=(vCol*.6+.25)*uSunCol*pow(1.-nv,2.5)*(.2+1.1*pow(max(dot(-V,uSun)*.5+.5,0.),2.))*step(vK.x,.5);
  if(vK.x>.5){
    float F=.06+.94*pow(max(1.-nv,0.),4.);
    vec3 R=reflect(-V,N); float rs=max(dot(R,uSun),0.);
    vec3 env=mix(uSand*uSunCol*.5,uSky+uHaze*.3*(1.-abs(R.y)),smoothstep(-.05,.08,R.y));
    if(vK.x<1.5){
      float back=pow(max(dot(-V,uSun),0.),3.);
      // white and lavender glass; hue only as a narrow glint near the mirror angle
      col=vCol*(uAmb*.7+uSunCol*(ndl*.42+back*.3))*(1.-F)+env*F;
      col+=uSunCol*(pow(rs,260.)*10.+pow(rs,26.)*.2+back*.16*(1.-nv));
      col+=spectral(fract(vK.z*7.+rs*2.2))*uSunCol*pow(rs,9.)*.55*(1.-pow(rs,60.));
      col+=uSunCol*vK.y*1.7; col=min(col,vec3(3.));
    } else if(vK.x<2.5){
      // a true mirror: black sky above, the haze band on the horizon, sunlit sand and dune shadows below, and the sun itself
      vec3 gnd=uSand*uSunCol*(.5+.25*smoothstep(0.,-.5,R.y))+uAmb*.3;
      vec3 skyc=uSky+uHaze*exp(-abs(R.y)*9.)*1.5;
      col=mix(gnd,skyc,smoothstep(-.012,.012,R.y))*.5*vCol+uSunCol*(smoothstep(.992,.999,rs)*9.+pow(rs,60.)*.6+pow(rs,7.)*.12+vK.y*uFlash+exp(-vG*vG*30.)*(2.8+2.*vn(vWP.xy*3.)));
    } else if(vK.x<3.5) col=vCol*(uSunCol*1.5+uAmb);
    else {
      // prism glass: every facet sends a different part of the spectrum to the eye, brightest against the sun
      float back=max(dot(-V,uSun),0.); back*=back;
      vec3 sp=spectral(fract(vCol.r+vK.z*3.1+dot(N,V)*1.9+dot(N,uSun)*1.3+vWP.y*.03));
      sp=mix(sp,vec3(1.),.22+.7*smoothstep(110.,380.,length(cameraPosition-vWP)));          // far off they are white glints, not confetti
      float lum=length(uSunCol)*.58, f1=1.-nv;
      col=uSky*.6+env*F*.5+sp*lum*(.16+.5*ndl+.75*back*(1.-.5*nv))+uSunCol*(pow(rs,90.)*5.+f1*f1*f1*.8+back*.14);
      col+=(sp*.65+.35)*lum*vK.y*uPrism;
    }
  }
  col+=uHaze*uEcl*(.05+.55*pow(1.-max(dot(N,V),0.),2.5));          // totality: a cold rim so silhouettes read
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// prism-back fans: flat wedges of spectral light that replace the sunlight on the hardpan
const FAN_VS = /* glsl */`
attribute vec4 aF; attribute vec2 aG; varying vec2 vF; varying float vS; varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  float s=position.y, w=position.x; vec2 d=vec2(sin(aF.z),cos(aF.z));
  vec2 q=aF.xy+d*(s*aF.w)+vec2(d.y,-d.x)*(w*s*aF.w*aG.x);
  vF=vec2(w,s); vS=aG.y; vP=vec3(q.x,.16,q.y);
  vec4 mvPosition=viewMatrix*vec4(vP,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FAN_FS = /* glsl */`
varying vec2 vF; varying float vS; varying vec3 vP; uniform vec3 uLav, uSunCol; uniform float uFanOn, uTime;
#include <fog_pars_fragment>
${COMMON_GLSL}
void main(){
  float t=vF.x+.05*sin(vF.y*9.-uTime*.7);
  float edge=smoothstep(1.,.86,abs(t)), along=smoothstep(.04,.16,vF.y)*(1.-smoothstep(.55,1.,vF.y));
  float a=edge*along*vS*uFanOn;
  vec3 col=uLav*(.75+.25*vn(vP.xz*.6))*spectral(t*.5+.5)*1.25*max(length(uSunCol)*.6,.35);
  gl_FragColor=vec4(col,a*.93);
  #include <fog_fragment>
}`;

// glass-reeds: hair-fine stems that blur whenever a song ripple passes through them
const REED_VS = /* glsl */`
attribute vec4 aR; uniform float uTime; varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
${RINGS_GLSL}
void main(){
  vec3 base=vec3(aR.x,0.,aR.y); float dist=length(cameraPosition-base);
  float amp=clamp(songRings(base.xz,22.),0.,1.);
  float wid=max(.022,dist*.0014)*(1.+amp*5.);
  vec2 side=normalize(vec2(cameraPosition.z-base.z,-(cameraPosition.x-base.x))+1e-5);
  float y=position.y;
  vec3 p=base+vec3(side.x,0.,side.y)*(position.x*wid+sin(uTime*63.+aR.w*40.)*.07*amp*y)+vec3(0.,y*aR.z,0.);
  p.xz+=vec2(.6,.8)*sin(uTime*.9+aR.w*6.283)*.012*y*y;
  vUv=vec2(position.x*2.,y); vA=(1./(1.+amp*4.))*min(1.,90./dist+.15)*(.022/max(.022,dist*.0014)*.8+.12);
  vec4 mvPosition=viewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const REED_FS = /* glsl */`
varying vec2 vUv; varying float vA; uniform vec3 uSunCol, uAmb;
#include <fog_pars_fragment>
void main(){
  float a=(1.-vUv.x*vUv.x)*smoothstep(1.,.8,vUv.y)*vA;
  vec3 col=(uSunCol*.85+uAmb)*(.55+.6*vUv.y);
  gl_FragColor=vec4(col,clamp(a,0.,1.)*.85);
  #include <fog_fragment>
}`;

// the fierce little sun's six-point glare, and the moon that crosses it in the rare eclipse
const GLARE_VS = /* glsl */`
uniform vec3 uDir; uniform float uSize; varying vec2 vUv;
void main(){
  vUv=position.xy*2.;
  vec4 c=viewMatrix*vec4(cameraPosition+uDir*900.,1.); c.xy+=position.xy*uSize*900.;
  gl_Position=projectionMatrix*c;
}`;
const GLARE_FS = /* glsl */`
varying vec2 vUv; uniform float uI, uMoon; uniform vec2 uMoonAt; uniform vec3 uCol;
void main(){
  float d=length(vUv); float g=exp(-d*d*420.)*5.+exp(-d*9.)*.14;
  for(int k=0;k<3;k++){ float a=float(k)*1.0472+.5236; vec2 n=vec2(-sin(a),cos(a)); g+=exp(-abs(dot(vUv,n))*150.)*exp(-d*5.5)*1.6; }
  g*=smoothstep(1.,.5,d)*uI;
  float md=length(vUv-uMoonAt); float disc=smoothstep(.06,.052,md);
  vec2 mq=vUv-uMoonAt; float an=atan(mq.y,mq.x+1e-5);
  float streams=.62+.38*cos(an*2.-.6)+.22*cos(an*5.+1.);          // totality: a pearl corona with long equatorial streamers
  float corona=(exp(-max(md-.055,0.)*14.)*2.4+exp(-max(md-.055,0.)*5.5)*1.5*streams+exp(-md*3.2)*.35)*uMoon*(1.-uI);
  gl_FragColor=vec4(uCol*(g*(1.-disc*uMoon)+corona*(1.-disc)),1.);
}`;

// spindrift: veils of grains blown off the knife crests, back-lit against the black sky
const STREAM_VS = /* glsl */`
attribute vec4 aS; attribute vec2 aW; uniform vec3 uSun; uniform vec2 uWind; varying vec2 vUv; varying float vSeed; varying float vFwd;
void main(){
  vec3 base=aS.xyz; vec3 toC=cameraPosition-base;
  vec2 side=normalize(vec2(toC.z,-toC.x)+vec2(1e-5));
  vec3 p=base+vec3(side.x,0.,side.y)*(position.x*aW.x)+vec3(0.,position.y*aW.y-2.,0.);
  p.xz+=uWind*(position.y*aW.y*1.6);
  vUv=vec2(position.x*2.,position.y); vSeed=aS.w;
  vec3 V=normalize(p-cameraPosition); float f=max(dot(V,uSun),0.); vFwd=.22+1.5*f*f*f;
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
}`;
const STREAM_FS = /* glsl */`
varying vec2 vUv; varying float vSeed; varying float vFwd; uniform vec3 uSunCol, uAmb; uniform float uTime, uStream;
${COMMON_GLSL}
void main(){
  float n=vn(vec2(vUv.x*1.3+vSeed*37.,vUv.y*1.6-uTime*.7+vSeed*11.)), n2=vn(vec2(vUv.x*9.+vSeed*5.+vUv.y*3.,vUv.y*5.-uTime*2.2));
  float e=max(1.-vUv.x*vUv.x,0.), up=max(1.-vUv.y,0.);
  float a=e*e*smoothstep(0.,.07,vUv.y)*up*up*up*(.3+.7*n)*(.55+.6*n2)*.75;
  gl_FragColor=vec4((uSunCol*vFwd+uAmb*.5)*a*uStream,1.);
}`;
// runner spray: a sheet of glitter flung up and out beside the prow, streaming back toward the eye
const SPRAY_VS = /* glsl */`
attribute vec3 aUv; varying vec3 vUv; varying vec3 vWP;
void main(){ vUv=aUv; vWP=position; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.); }`;
const SPRAY_FS = /* glsl */`
varying vec3 vUv; varying vec3 vWP; uniform vec3 uSunCol, uAmb; uniform float uTime, uSpray;
${COMMON_GLSL}
void main(){
  float x=vUv.x, y=vUv.y, sd=vUv.z*17.;
  float env=smoothstep(0.,.3,x)*smoothstep(0.,.06,y)*(1.-y)*(1.-smoothstep(.8,1.,x)*.7);
  vec3 acc=vec3(0.);
  for(int k=0;k<2;k++){
    float fk=float(k); vec2 g=vec2(x*(70.+50.*fk)+uTime*(16.+9.*fk)+sd,y*(22.+14.*fk)-x*(9.+6.*fk)+fk*3.7); vec2 id=floor(g); vec2 f=fract(g)-.5; vec3 h=h23(id+sd+fk*31.);
    float pt=smoothstep(.3,.06,length(f-(h.xy-.5)*.5))*step(.62,h.z);
    float tw=.35+.65*sin(uTime*(9.+h.x*13.)+h.y*40.);
    acc+=mix(vec3(1.),spectral(h.x),.6*step(.82,h.z))*pt*max(tw,0.);
  }
  float mist=vn(vec2(x*7.+uTime*4.+sd,y*4.));
  vec3 col=(uSunCol+uAmb)*(acc*2.6+mist*mist*.07)*env*uSpray;
  gl_FragColor=vec4(col,1.);
}`;
// a thin shaft of white light standing on the white point: the destination, marked from the moment we top the rim
const SHAFT_VS = /* glsl */`
varying vec2 vUv;
void main(){
  vec3 base=vec3(0.,15.5,-1.5); vec3 toC=cameraPosition-base; float dist=length(toC);
  vec2 side=normalize(vec2(toC.z,-toC.x)+vec2(1e-5));
  vec3 p=base+vec3(side.x,0.,side.y)*(position.x*max(9.,dist*.03))+vec3(0.,position.y*125.,0.);
  vUv=vec2(position.x*2.,position.y);
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
}`;
const SHAFT_FS = /* glsl */`
varying vec2 vUv; uniform float uTime, uReveal, uFanOn;
void main(){
  float x=vUv.x, up=max(1.-vUv.y,0.);
  float a=(exp(-x*x*90.)*1.3+exp(-x*x*9.)*.2)*smoothstep(0.,.05,vUv.y)*up*sqrt(up)*(.86+.14*sin(uTime*2.3-vUv.y*26.));
  gl_FragColor=vec4(vec3(.93,.92,1.)*a*1.4*smoothstep(.5,1.,uReveal)*uFanOn,1.);
}`;

// ---------------------------------------------------------------- prop geometry (merged primitives, black / white / lavender only)
const WHT = '#efece4', BLK = '#0c0c16', LAV = '#b9b3c9', DLAV = '#6f6b88';
const UP = new V3(0, 1, 0);
const TR = (px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new V3(px, py, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new V3(sx, sy, sz));
const ALONG = (base, dir, h) => { const d = dir.clone().normalize(); return new THREE.Matrix4().compose(base.clone().addScaledVector(d, h / 2), new THREE.Quaternion().setFromUnitVectors(UP, d), new V3(1, 1, 1)); };
const acc = () => ({ p: [], n: [], c: [], k: [] });
function put(A, geo, m, col, kind = 0, part = 0, py = 0, pz = 0, flat = false) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.applyMatrix4(m);
  if (flat) g.computeVertexNormals();
  const P = g.attributes.position.array, N = g.attributes.normal.array, c = new THREE.Color(col);
  for (let i = 0; i < P.length; i += 3) { A.p.push(P[i], P[i + 1], P[i + 2]); A.n.push(N[i], N[i + 1], N[i + 2]); A.c.push(c.r, c.g, c.b); A.k.push(kind, part, py, pz); }
  g.dispose(); if (g !== geo) geo.dispose();
}
function fin(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(A.k, 4));
  return g;
}
const sph = (a = 10, b = 7) => new THREE.SphereGeometry(1, a, b);
const hex = (rt, rb, h) => new THREE.CylinderGeometry(rt, rb, h, 6);

// pack beast of the heliograph caravan: 9 m tall, long-necked, striped saddle cloth with a fringe, pack frame and
// panniers, a 3 m signal mirror on a mast. Faces -Z. Parts: 1-4 legs (hip pivot, knee at 53%), 5 neck and head,
// 6 the mirror (rocks about its centre with the lope), 7 hanging things (fringe, tail).
async function beastGeo(pause) {
  const A = acc(), cyl = (rt, rb, h, n = 6, hs = 1) => new THREE.CylinderGeometry(rt, rb, h, n, hs, true);
  // barrel: a deep shoulder, a tucked waist and a rounded rump, so the animal has masses and not one egg
  const prof = [[0.02, 3.15], [0.34, 3.02], [0.8, 2.62], [1.14, 2.05], [1.33, 1.4], [1.27, 0.7], [1.1, 0.1], [1.12, -0.5], [1.3, -1.1], [1.46, -1.7], [1.3, -2.3], [0.95, -2.75], [0.5, -3.02], [0.02, -3.15]];
  put(A, new THREE.LatheGeometry(prof.map((q) => new THREE.Vector2(q[0], q[1])), 20), TR(0, 5.1, 0, Math.PI / 2, 0, 0, 1, 1, 1.12), LAV);
  const rAt = (z) => { for (let i = 0; i < prof.length - 1; i++) if (z <= prof[i][1] && z >= prof[i + 1][1]) return lerp(prof[i][0], prof[i + 1][0], (prof[i][1] - z) / (prof[i][1] - prof[i + 1][1])); return 1; };
  for (let i = 0; i < 5; i++) {                                 // saddle cloth: black and white bands draped well down the flanks
    const z = -0.75 + i * 0.44;
    put(A, new THREE.CylinderGeometry(rAt(z + 0.22) + 0.07, rAt(z - 0.22) + 0.07, 0.44, 10, 1, true, Math.PI - 2.5, 5.0), TR(0, 5.1, z, Math.PI / 2, 0, 0, 1, 1, 1.12), i % 2 ? BLK : WHT);
  }
  await pause();
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 12; i++) put(A, new THREE.PlaneGeometry(0.13, 0.7 + 0.28 * (i % 2)), TR(sx * 0.82, 3.72 - 0.14 * (i % 2), -0.92 + i * 0.2, 0, Math.PI / 2, 0), i % 2 ? WHT : BLK, 0, 7, 4.1, 0);     // the fringe
    // panniers: a slung barrel with two dark hoops
    put(A, new THREE.CylinderGeometry(0.46, 0.46, 1.5, 8), TR(sx * 1.52, 5.3, 0.45, Math.PI / 2, 0, 0), sx > 0 ? WHT : DLAV);
    for (const dz of [-0.42, 0.42]) put(A, cyl(0.49, 0.49, 0.13, 8), TR(sx * 1.52, 5.3, 0.45 + dz, Math.PI / 2, 0, 0), BLK);
    put(A, cyl(0.05, 0.06, 2.0, 4), ALONG(new V3(sx * 0.95, 6.0, -0.2), new V3(-sx * 0.95, 1.5, 1.0), 2.0), BLK);          // pack frame
    put(A, cyl(0.05, 0.06, 2.0, 4), ALONG(new V3(sx * 0.95, 6.0, 1.6), new V3(-sx * 0.95, 1.5, -0.8), 2.0), BLK);
    put(A, new THREE.ConeGeometry(0.07, 0.6, 4), TR(sx * 0.2, 9.98, -4.55, 0.5, 0, sx * -0.3), WHT, 0, 5, 5.9, 0);        // ears
  }
  // crystal pendants: prism glass hung from a yard under the mirror and from the pack frame, swinging with the lope.
  // Every animal carries its own small spectrum up the climb.
  put(A, cyl(0.04, 0.04, 2.9, 4), TR(0, 7.45, 0.95, 0, 0, Math.PI / 2), BLK);
  const pend = (x, y, z, l, hue) => put(A, new THREE.CylinderGeometry(0.17, 0.02, l, 6, 1, true), TR(x, y - l / 2, z), new THREE.Color(hue, 1, 1), 4, 7, y, 0, true);
  [-1.35, -0.85, -0.38, 0.38, 0.85, 1.35].forEach((x, i) => pend(x, 7.45, 0.95, 0.75 + 0.3 * ((i * 3) % 2) + 0.12 * (i % 3), i * 0.17));
  pend(-1.02, 6.05, 1.75, 0.95, 0.55); pend(1.02, 6.05, 1.75, 0.95, 0.08);
  await pause();
  // neck: six tapering segments along a swan curve, then a long head
  const nk = [[5.9, -2.1], [6.75, -2.95], [7.6, -3.42], [8.4, -3.62], [9.05, -3.78], [9.5, -4.12], [9.66, -4.5]];
  for (let i = 0; i < 6; i++) {
    const a = new V3(0, nk[i][0], nk[i][1]), b = new V3(0, nk[i + 1][0], nk[i + 1][1]), d = b.clone().sub(a), l = d.length() + 0.12;
    put(A, cyl(lerp(0.66, 0.27, (i + 1) / 6), lerp(0.66, 0.27, i / 6) * (i ? 1 : 1.25), l, 7), ALONG(a, d, l), LAV, 0, 5, 5.9, 0);
  }
  put(A, sph(8, 6), TR(0, 9.6, -4.95, 0.22, 0, 0, 0.36, 0.34, 0.82), LAV, 0, 5, 5.9, 0);
  put(A, sph(6, 4), TR(0, 9.44, -5.62, 0, 0, 0, 0.2, 0.17, 0.2), BLK, 0, 5, 5.9, 0);
  await pause();
  for (const [sx, sz, id] of [[-1, -1, 1], [1, -1, 2], [-1, 1, 4], [1, 1, 3]]) {
    const hz = sz * 1.62, hip = new V3(sx * 0.82, 4.75, hz), knee = new V3(sx * 0.86, 2.5, hz - 0.22 * sz), hoof = new V3(sx * 0.86, 0.22, hz + 0.05);
    put(A, sph(8, 6), TR(sx * 0.74, 4.95, hz, 0, 0, 0, 0.62, 1.0, 0.86), LAV);                                               // haunch / shoulder
    put(A, sph(6, 5), TR(sx * 0.84, 4.15, hz - 0.05 * sz, 0, 0, 0, 0.44, 0.95, 0.58), LAV, 0, id, 4.75, hz);                 // thigh: the muscle the leg swings from
    put(A, cyl(0.2, 0.42, 2.3, 8), ALONG(hip, knee.clone().sub(hip), 2.3), DLAV, 0, id, 4.75, hz);
    put(A, sph(6, 4), TR(sx * 0.86, 2.5, hz - 0.22 * sz, 0, 0, 0, 0.26, 0.3, 0.3), DLAV, 0, id, 4.75, hz);                    // hock
    put(A, cyl(0.12, 0.2, 2.34, 8, 2), ALONG(knee, hoof.clone().sub(knee), 2.34), DLAV, 0, id, 4.75, hz);
    put(A, cyl(0.17, 0.27, 0.42, 6), TR(sx * 0.86, 0.52, hz + 0.03), WHT, 0, id, 4.75, hz);                                   // a white feather above the hoof
    put(A, sph(6, 4), TR(sx * 0.86, 0.17, hz - 0.08, 0, 0, 0, 0.32, 0.18, 0.42), BLK, 0, id, 4.75, hz);
  }
  await pause();
  put(A, new THREE.ConeGeometry(0.13, 2.3, 5), TR(0, 4.35, 3.25, -0.35, 0, 0), DLAV, 0, 7, 5.4, 0);                        // tail
  put(A, cyl(0.07, 0.08, 2.6, 5), TR(0, 8.1, 0.95), BLK);                                                                 // mast
  const mirror = (r, z, col) => {
    const mg = new THREE.CircleGeometry(r, 6), mn = mg.attributes.normal, mp = mg.attributes.position;
    for (let i = 0; i < mn.count; i++) { const v = new V3(mp.getX(i) * 0.1, mp.getY(i) * 0.17, 1).normalize(); mn.setXYZ(i, v.x, v.y, v.z); }
    put(A, mg, TR(0, 9.6, z, 0.1, 0.42, 0), col, 2, 6, 9.6, 1.0);
  };
  mirror(1.55, 1.08, WHT); mirror(1.74, 1.04, '#55536a');                                                                   // glass, and a dimmer bevel round it
  put(A, new THREE.CylinderGeometry(1.96, 1.96, 0.1, 6, 1, false, Math.PI / 6), TR(-0.02, 9.6, 0.94, 0.1, 0.42, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)), BLK, 0, 6, 9.6, 1.0);   // the dark frame
  return fin(A);
}
// prism-back: a slow 8 m walker under a 10 m faceted crystal shell. Faces -Z.
function prismBackGeo(rng) {
  const A = acc();
  put(A, sph(12, 8), TR(0, 1.9, 0, 0, 0, 0, 2.3, 1.15, 3.5), DLAV);
  put(A, sph(8, 6), TR(0, 2.1, -4.1, 0, 0, 0, 0.7, 0.6, 1.05), LAV, 0, 5, 1.4, 0);
  for (const [sx, sz, id] of [[-1, -1, 1], [1, -1, 2], [-1, 1, 4], [1, 1, 3]]) put(A, new THREE.CylinderGeometry(0.62, 0.5, 2, 7), TR(sx * 1.75, 1, sz * 2.1), BLK, 0, id, 2, sz * 2.1);
  put(A, hex(0.3, 1.55, 8), ALONG(new V3(0, 2.4, 0.2), new V3(0.05, 1, 0.08), 8), WHT, 1, 0, 0, 0, true);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU + rng.range(-0.25, 0.25), h = rng.range(3, 6.2), ln = rng.range(0.3, 0.75);
    put(A, hex(h * 0.04, h / rng.range(4.2, 5.5), h), ALONG(new V3(Math.cos(a) * 1.0, 2.3, Math.sin(a) * 1.7 + 0.2), new V3(Math.cos(a) * Math.sin(ln), Math.cos(ln), Math.sin(a) * Math.sin(ln)), h), i % 3 ? WHT : LAV, 1, i + 1, 0, 0, true);
  }
  return fin(A);
}
// glass-skater (a 1.5 m gliding disc with a sparkling wake) or a rolling crystal tumbleweed
function skaterGeo(weed) {
  const A = acc();
  if (weed) {
    put(A, new THREE.IcosahedronGeometry(0.95, 0), TR(0, 0.95, 0), WHT, 1, 0, 0, 0, true);
    put(A, new THREE.OctahedronGeometry(1.25, 0), TR(0, 0.95, 0, 0.5, 0.3, 0, 0.5, 1, 0.5), LAV, 1, 3, 0, 0, true);
    put(A, new THREE.OctahedronGeometry(1.25, 0), TR(0, 0.95, 0, 0.3, 0.2, 1.57, 0.5, 1, 0.5), WHT, 1, 5, 0, 0, true);
  } else {
    put(A, new THREE.CylinderGeometry(0.55, 0.78, 0.12, 12), TR(0, 0.14, 0), WHT, 2, 0, 0, 0, true);
    put(A, sph(8, 5), TR(0, 0.2, -0.1, 0, 0, 0, 0.36, 0.2, 0.42), LAV, 1, 2);
    const w = new THREE.BufferGeometry();
    w.setAttribute('position', new THREE.Float32BufferAttribute([-0.32, 0.04, 0.7, 0.32, 0.04, 0.7, 0, 0.04, 8], 3));
    w.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    put(A, w, TR(0, 0, 0), WHT, 3);
  }
  return fin(A);
}
// silica bloom: flat crystal blades arranged like a desert rose
function bloomGeo(rng) {
  const A = acc(), n = 11;
  for (let i = 0; i < n; i++) {
    const L = rng.range(2, 5) * (i < 3 ? 1 : 0.75), wd = L * rng.range(0.2, 0.32), az = i / n * TAU * 1.9 + rng.range(-0.3, 0.3), tilt = i < 3 ? rng.range(0.9, 1.3) : rng.range(0.25, 0.8);
    const m = new THREE.Matrix4().makeRotationY(az).multiply(new THREE.Matrix4().makeRotationX(-tilt)).multiply(TR(0, 0, L * 0.42, 0, rng.range(-0.2, 0.2), rng.range(-0.5, 0.5), wd, 1, L / 2));
    const slab = hex(1, 1, 0.1); slab.setIndex(Array.from(slab.index.array).slice(36));          // the two faces of the blade only: its 10 cm edge is never seen
    put(A, slab, m, i % 3 ? WHT : LAV, 1, i, 0, 0, true);
  }
  return fin(A);
}
function cairnGeo(rng) {
  const A = acc(); let y = -0.4;
  for (let i = 0; i < 7; i++) {
    const r = lerp(1.7, 0.45, i / 6) * rng.range(0.85, 1.15), h = rng.range(0.8, 1.25);
    put(A, hex(r * 0.82, r, h), TR(rng.range(-0.2, 0.2), y + h / 2, rng.range(-0.2, 0.2), rng.range(-0.08, 0.08), rng.range(0, 3), rng.range(-0.08, 0.08)), i % 2 ? LAV : WHT, 1, i, 0, 0, true);
    y += h * 0.93;
  }
  put(A, hex(0.02, 0.4, 1.6), TR(0, y + 0.7, 0), WHT, 1, 9, 0, 0, true);
  return fin(A);
}
// the other caravan's sand-barge: glass runners, deck, crates and a black-and-white striped awning. Faces -Z.
function bargeGeo() {
  const A = acc();
  for (const sx of [-1, 1]) {
    put(A, new THREE.BoxGeometry(0.3, 0.4, 22), TR(sx * 2.3, 0.2, 0), WHT, 1, 0, 0, 0, true);
    put(A, new THREE.BoxGeometry(0.3, 0.4, 4), TR(sx * 2.3, 1.0, -12.4, 0.5, 0, 0), WHT, 1, 1, 0, 0, true);
    for (const z of [-7, 0, 7]) put(A, new THREE.BoxGeometry(0.2, 1.1, 0.2), TR(sx * 2.3, 0.9, z), BLK);
    for (const z of [-8, 8]) put(A, new THREE.CylinderGeometry(0.08, 0.08, 3.4, 5), TR(sx * 2.2, 3.1, z), BLK);
  }
  put(A, new THREE.BoxGeometry(5, 0.3, 19), TR(0, 1.5, 0), LAV);
  put(A, new THREE.BoxGeometry(2.4, 1.6, 3), TR(-0.8, 2.4, 3), DLAV); put(A, new THREE.BoxGeometry(2, 1.2, 2.4), TR(0.9, 2.2, -1), WHT); put(A, new THREE.BoxGeometry(1.6, 2, 2), TR(0.6, 2.6, 6.5), BLK);
  for (let i = 0; i < 9; i++) put(A, new THREE.BoxGeometry(5.4, 0.08, 2), TR(0, 4.85 - 0.02 * (i - 4) * (i - 4), -8 + i * 2), i % 2 ? BLK : WHT);
  put(A, new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5), TR(0, 6.1, -8.6), BLK);
  put(A, new THREE.BoxGeometry(1.5, 1.5, 0.06), TR(0, 7.6, -8.6, -0.3, 0.5, 0), WHT, 2);
  return fin(A);
}
// spectral(t) on the CPU (for the frame tint when a fan swings over the sleigh)
const SPEC = [[1, 0.03, 0.05], [1, 0.36, 0], [1, 0.84, 0.05], [0.08, 0.9, 0.2], [0, 0.6, 1], [0.12, 0.12, 1], [0.62, 0.05, 1]];
function spectralJS(t, out) { t = clamp(t, 0, 1) * 6; const i = Math.min(5, Math.floor(t)), f = t - i, a = SPEC[i], b = SPEC[i + 1]; return out.setRGB(lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)); }

const LOOKS = {
  noon: { elev: 55, az: 25, sunI: 1.05, white: '#FFFFFF', amb: '#1A2244', zenith: '#05060F', haze: '#5A7DB0', fog: '#1a2850', fogD: 0.00021, hPow: 10, exposure: 0.92, gain: 1.1, sparkle: 1, stars: 1.0, disc: 12, key: 2.6 },
  low: { elev: 23, az: 36, sunI: 1.4, white: '#FFF9F2', amb: '#1C2552', zenith: '#05060F', haze: '#6C8CC0', fog: '#1e2f5c', fogD: 0.00024, hPow: 6, exposure: 0.95, gain: 1.15, sparkle: 1.2, stars: 0.9, disc: 12, key: 2.4 },
  night: { elev: 27, az: -31, sunI: 0.5, white: '#CDD5FF', amb: '#161D44', zenith: '#02030A', haze: '#2C3D6C', fog: '#0c1430', fogD: 0.00019, hPow: 8, exposure: 1.6, gain: 0.82, sparkle: 2.4, stars: 1.9, disc: 0, key: 1.1 },
};

export default {
  id: 'singing-erg',
  name: 'The Singing Erg',
  category: 'alien',
  weirdness: 0.6,
  media: ['open', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---- the visit: hour, weather, cast
    let lookId = rng.pick(['noon', 'noon', 'low', 'low', 'night', 'noon']);
    if (vary.hour === 'day') lookId = 'noon'; else if (vary.hour === 'golden' || vary.hour === 'dawn') lookId = 'low'; else if (vary.hour === 'night') lookId = 'night';
    const rare = !!vary.rare; if (rare && lookId === 'night') lookId = 'noon';        // the eclipse needs a sun
    let weather = rng.pick(['wind', 'devils', 'meteors']); if (lookId === 'night' && rng.chance(0.5)) weather = 'meteors';
    const cast = { caravan: 2 * Math.round(rng.int(6, 10) * density), herd: Math.round(rng.int(8, 14) * density), calves: rng.chance(0.5), weeds: rng.chance(0.35), other: rng.int(5, 8) };
    const L = LOOKS[lookId];
    const sunDir = skyDirection(L.elev, L.az);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(L.fog, L.fogD);

    // ---- the Choir (hero), at the origin; we arrive from +Z
    const hero = await buildHero(ctx, { skirt: false, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunIntensity: L.sunI, gain: L.gain, sparkle: L.sparkle,
      palette: [L.zenith, L.amb, L.haze, '#C9C3D6', '#F6F3EA', L.white, '#FF4FA3'], jets: Math.round(10000 * detail), flyers: 40, floor: 0.56 });
    scene.add(hero.object);
    const U = hero.uniforms, H0 = hero.anchors.heightAt;
    const coreI = 0.3;                                        // the white point, a little under the hero's default so the portal ring reads against it
    U.uCore.value = coreI;
    await ctx.yield();
    const land = planLand(ctx, hero, rng.fork('land'));
    await ctx.yield();
    const path = planPath(land, hero);
    await ctx.yield();
    const ground = (x, z) => (Math.hypot(x, z) < 331 ? H0(x, z) : land.height(x, z));
    const X = { uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) }, uRing: { value: new THREE.Vector4(0, 0, 0, 0) }, uAval: { value: 0.3 },
      uDrift: { value: weather === 'wind' ? 1.2 : 0.4 }, uShadow: { value: null }, uShA: { value: new THREE.Vector4(1, 0, 0, 1) }, uShC: { value: new THREE.Vector3(0, 0, 1) }, uEcl: { value: 0 }, uFill: { value: lookId === 'night' ? 0.62 : 1 }, uTrailEnd: { value: land.sLen - 8 }, uFanOn: { value: 1 }, uSpray: { value: 0 }, uBeast: { value: Array.from({ length: 16 }, () => new THREE.Vector3(1e5, 1e5, 0)) }, uFlash: { value: lookId === 'night' ? 2.6 : 7 }, uPrism: { value: lookId === 'night' ? 1.5 : 2.2 }, uBandK: { value: 0.5 },
      uSpire: { value: Array.from({ length: 8 }, () => new THREE.Vector4(1e5, 1e5, 0, 1)) }, uSpireB: { value: Array.from({ length: 8 }, () => new THREE.Vector4(50, 0.2, 0, 0)) }, uStream: { value: (weather === 'wind' ? 1 : 0.62) * (lookId === 'night' ? 1.5 : 1) } };
    const mat = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
    await ctx.yield();

    // ---- the dune sea: one warped grid, fine along the route, coarse toward the haze
    {
      const nvx = NX + 1, nvz = NZ + 1, nV = nvx * nvz;
      const us = new Float32Array(nvz), vs = new Float32Array(nvx);
      for (let j = 0; j < nvz; j++) us[j] = gridU(j / NZ * 2 - 1);
      for (let i = 0; i < nvx; i++) vs[i] = gridV(i / NX * 2 - 1);
      const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), aD = new Float32Array(nV * 4), aT = new Float32Array(nV * 2), hs = new Float32Array(nV);
      const tk = { d: 0, side: 1, a: 0, b: 0 };
      for (let j = 0; j < nvz; j++) {
        for (let i = 0; i < nvx; i++) {
          const k = j * nvx + i, x = GC[0] + EU[0] * us[j] + EV[0] * vs[i], z = GC[1] + EU[1] * us[j] + EV[1] * vs[i];
          const h = land.height(x, z); hs[k] = h;
          pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
          aD[k * 4] = smoothstep(0.84, 1, Math.max(Math.abs(j / NZ * 2 - 1), Math.abs(i / NX * 2 - 1)));
          aD[k * 4 + 2] = land.flatMask(x, z) * (1 - smoothstep(0.4, 3, h));
          aD[k * 4 + 3] = 1 - smoothstep(60, 125, Math.hypot(x - 408, z - 846));
          land.track(x, z, tk); aT[k * 2] = tk.d; aT[k * 2 + 1] = tk.a;
          if ((i & 63) === 63) await ctx.yield();
        }
        await ctx.yield();
      }
      for (let j = 0; j < nvz; j++) for (let i = 0; i < nvx; i++) {
        const k = j * nvx + i, j0 = Math.max(0, j - 1), j1 = Math.min(NZ, j + 1), i0 = Math.max(0, i - 1), i1 = Math.min(NX, i + 1);
        const du = (hs[j1 * nvx + i] - hs[j0 * nvx + i]) / (us[j1] - us[j0]), dv = (hs[j * nvx + i1] - hs[j * nvx + i0]) / (vs[i1] - vs[i0]);
        const nx = -(du * EU[0] + dv * EV[0]), nz = -(du * EU[1] + dv * EV[1]), l = Math.sqrt(nx * nx + 1 + nz * nz);
        nor[k * 3] = nx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = nz / l;
        aD[k * 4 + 3] *= smoothstep(0.1, 0.2, 1 - 1 / l);
        if (i === 0 && (j & 7) === 7) await ctx.yield();
      }
      await ctx.yield();
      // baked sun shadow of the dunes, as a signed "horizon excess" per vertex; the shader re-thresholds it with fwidth
      const mkInv = (arr) => {
        const lo = arr[0], hi = arr[arr.length - 1], N = 2048, t = new Float32Array(N + 1); let a = 0;
        for (let k = 0; k <= N; k++) { const v = lo + (hi - lo) * k / N; while (a < arr.length - 2 && arr[a + 1] < v) a++; t[k] = a + clamp((v - arr[a]) / (arr[a + 1] - arr[a]), 0, 1); }
        return (v) => { const f = clamp((v - lo) / (hi - lo), 0, 1) * N, i0 = Math.min(N - 1, f | 0); return t[i0] + (t[i0 + 1] - t[i0]) * (f - i0); };
      };
      const invU = mkInv(us), invV = mkInv(vs);
      const sample = (x, z) => {
        const dx = x - GC[0], dz = z - GC[1], fj = invU(dx * EU[0] + dz * EU[1]), fi = invV(dx * EV[0] + dz * EV[1]);
        const j = Math.min(NZ - 1, fj | 0), i = Math.min(NX - 1, fi | 0), a = fj - j, b = fi - i, k = j * nvx + i;
        return (hs[k] * (1 - b) + hs[k + 1] * b) * (1 - a) + (hs[k + nvx] * (1 - b) + hs[k + nvx + 1] * b) * a;
      };
      const sl = Math.hypot(sunDir.x, sunDir.z) || 1, sx = sunDir.x / sl, sz = sunDir.z / sl, tanE = sunDir.y / sl;
      const NS = 16, steps = []; for (let k = 0; k < NS; k++) steps.push(5 * Math.pow(1.38, k));
      const TC = [235, 520], TS = 1840;                           // centre and size of the shadow texture
      const tanS = Math.min(tanE, 0.36);                         // dune shadows are cast as by a sun no higher than 20 degrees: every slip face is a clean dark shape under a white crest
      for (let j = 0; j < nvz; j++) {
        for (let i = 0; i < nvx; i++) {
          const k = j * nvx + i, x = pos[k * 3], h = hs[k] + 0.25, z = pos[k * 3 + 2]; let m = -1;
          const tx = x - TC[0], tz = z - TC[1];
          if (Math.max(Math.abs(tx * sx + tz * sz), Math.abs(tx * -sz + tz * sx)) < TS * 0.43) continue;          // inside the shadow texture: the per-vertex field is never read there
          for (let q = 0; q < NS; q++) { const d = steps[q], e = (sample(x + sx * d, z + sz * d) - h) / d - tanS; if (e > m) m = e; }
          aD[k * 4 + 1] = clamp(m, -0.5, 0.5);
        }
        await ctx.yield();
      }
      // the same field near the route as a texture, swept along the sun's azimuth (one pass per row): e > 0 = metres of
      // shadow above the sand. Stored signed in R8 (+-8 m) and re-thresholded in the shader.
      {
        await ctx.yield();
        const W = 768, S = TS, dx = S / W, cx = TC[0], cz = TC[1], px = -sz, pz = sx, data = new Uint8Array(W * W), row = new Float32Array(W + 2);
        // on the climb to the saddle the sun is taken at its true height (up to 42 degrees), so the star dune's arm does not
        // bury the whole approach in its shadow: we climb in light with the shadow as a shape beside us
        const tanHi = Math.min(tanE, 1.35), hi = tanHi > tanS + 0.05, cl = [], cv = new V3();
        for (let d = 395; d <= 800; d += 81) { path.posAtDist(d, cv); cl.push(cv.x, cv.z); }
        const climbMask = (x, z) => {
          let best = 1e12;
          for (let q = 0; q < cl.length - 2; q += 2) {
            const ex = cl[q + 2] - cl[q], ez = cl[q + 3] - cl[q + 1]; let t = ((x - cl[q]) * ex + (z - cl[q + 1]) * ez) / (ex * ex + ez * ez); t = t < 0 ? 0 : t > 1 ? 1 : t;
            const ddx = x - cl[q] - ex * t, ddz = z - cl[q + 1] - ez * t, d2 = ddx * ddx + ddz * ddz; if (d2 < best) best = d2;
          }
          return 1 - smoothstep(45, 250, Math.sqrt(best));
        };
        await ctx.yield();
        for (let j = 0; j < W; j++) {
          const ox = cx + px * (j + 0.5 - W / 2) * dx - sx * (W / 2 + 0.5) * dx, oz = cz + pz * (j + 0.5 - W / 2) * dx - sz * (W / 2 + 0.5) * dx;
          for (let i = 0; i < W + 2; i++) row[i] = sample(ox + sx * i * dx, oz + sz * i * dx);     // row[i + 1] is texel i
          let Lr = -1e9, Lh = -1e9, mk = 0;
          for (let i = W - 1; i >= 0; i--) {
            const h = row[i + 1], ray = Lr - tanS * dx; let e = ray - h - 0.1;
            Lr = ray > h ? ray : h;
            if (hi) {
              const rayH = Lh - tanHi * dx; Lh = rayH > h ? rayH : h;
              if ((i & 3) === 0 || i === W - 1) mk = climbMask(ox + sx * (i + 1) * dx, oz + sz * (i + 1) * dx);
              if (mk > 0) e = e + (rayH - h - 0.1 - e) * mk;
            }
            data[j * W + i] = Math.max(0, Math.min(255, Math.round(127.5 + 127.5 * e / 8)));
          }
          if (j & 1) await ctx.yield();
        }
        await ctx.yield();
        const tex = new THREE.DataTexture(data, W, W, THREE.RedFormat, THREE.UnsignedByteType);
        tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.unpackAlignment = 1; tex.needsUpdate = true;
        X.uShadow.value = tex; X.uShA.value.set(sx, sz, px, pz); X.uShC.value.set(cx, cz, 1 / S);
      }
      await ctx.yield();
      const idx = new Uint32Array(NX * NZ * 6); let q = 0;
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
        if (i === 0 && (j & 7) === 7) await ctx.yield();
        const a = j * nvx + i, b = a + nvx, c = a + 1, d = b + 1;
        if (Math.max(Math.hypot(pos[a * 3], pos[a * 3 + 2]), Math.hypot(pos[b * 3], pos[b * 3 + 2]), Math.hypot(pos[c * 3], pos[c * 3 + 2]), Math.hypot(pos[d * 3], pos[d * 3 + 2])) < 329) continue;
        idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = c; idx[q++] = b; idx[q++] = d;
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('aD', new THREE.BufferAttribute(aD, 4)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 2));
      g.setIndex(new THREE.BufferAttribute(idx.subarray(0, q), 1));
      const dunes = new THREE.Mesh(g, mat(LAND_VS, LAND_FS));
      dunes.name = 'erg-dunes'; dunes.frustumCulled = false; scene.add(dunes);
    }
    await ctx.yield();

    // ---- sky: black zenith, steady stars, a thin blue haze band, the small fierce sun, two moons at upper left
    const night = lookId === 'night';
    await ctx.yield();
    const sky = makeSky({ rng, preset: 'night', zenith: L.zenith, mid: L.zenith, horizon: L.haze, ground: L.fog, horizonPow: L.hPow, midPow: 2.5,
      scatter: 0.04, scatterColor: L.haze, sunDirection: night ? skyDirection(-20, 25) : sunDir, sunColor: '#ffffff', sunSize: 0.3, sunIntensity: L.disc, sunGlow: 0.22, sunGlowTight: 0.92,
      stars: L.stars, twinkle: 0.12, starDensity: 1, milkyWay: night ? 0.55 : 0.12, milkyColor: '#7f93c8', milkyCore: '#c9c3d6', clouds: false, clouds2: false, aurora: 0, lightning: 0,
      bodies: night
        ? [{ elevation: L.elev, azimuth: L.az, size: 2.3, color: '#f1f0ff', color2: '#b9b3c9', texture: 0.5, phase: 0.92, phaseAngle: 30, intensity: 2.2, glow: 0.3, glowColor: '#aab4ff', seed: 3 },
          { elevation: L.elev - 9, azimuth: L.az - 8, size: 1.2, color: '#dcd8ee', color2: '#8f8aa6', texture: 0.4, phase: 0.3, phaseAngle: 200, intensity: 1.8, glow: 0.2, glowColor: '#aab4ff', seed: 8 }]
        : [{ elevation: 41, azimuth: -37, size: 0.95, color: '#e9e6f4', color2: '#a9a4be', texture: 0.5, phase: 0.72, phaseAngle: 40, intensity: 1.1, seed: 3 },
          { elevation: 45.5, azimuth: -31.5, size: 0.55, color: '#dcd8ee', color2: '#8f8aa6', texture: 0.4, phase: 0.22, phaseAngle: 215, intensity: 1.3, seed: 8 }],
      fogColor: L.fog, bake: true, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    // the ride (and only the ride) is lit by real lights
    const key = new THREE.DirectionalLight(L.white, L.key); key.position.copy(sunDir).multiplyScalar(600); scene.add(key);
    const hemi = new THREE.HemisphereLight(night ? '#39468f' : '#465aa0', '#8f8aa8', night ? 0.75 : 0.9); scene.add(hemi);
    const glare = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader: GLARE_VS, fragmentShader: GLARE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uDir: { value: sunDir.clone() }, uSize: { value: night ? 0.3 : 0.34 }, uI: { value: night ? 0.12 : 1 }, uMoon: { value: rare ? 1 : 0 }, uMoonAt: { value: new THREE.Vector2(9, 9) }, uCol: { value: new THREE.Color(L.white) } } }));
    glare.frustumCulled = false; glare.renderOrder = 1; scene.add(glare);
    await ctx.yield();

    // ---- route landmarks
    const PL = path.length, P = new V3(), T = new V3(), P2 = new V3(), T2 = new V3();
    const dCrest = path.nearestXZ(0, 327).u * PL;
    const uBrink = path.nearestXZ(425, 890).u, uFoot = path.nearestXZ(392, 800).u, uFlat = path.nearestXZ(land.flatC[0], land.flatC[1]).u;
    const brink = path.pointAt(uBrink).clone();
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const propMat = (mode) => mat(PROP_VS, PROP_FS, { defines: { MODE: mode }, side: THREE.DoubleSide });
    const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
    const setInst = (mesh, i, x, y, z, yaw, s = 1, pitch = 0) => { dummy.position.set(x, y, z); dummy.rotation.set(pitch, yaw, 0); dummy.scale.setScalar(s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); };
    const inst = (geo, material, n) => {
      const m = new THREE.InstancedMesh(geo, material, n), aI = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      aI.setUsage(THREE.DynamicDrawUsage); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aI', aI); m.frustumCulled = false; scene.add(m); return { m, aI };
    };
    const wrapPi = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);

    // ---- the heliograph caravan ahead of us (double file), another caravan with its barge across the flat
    await ctx.yield();
    const beastG = await beastGeo(() => ctx.yield());
    await ctx.yield();
    const nCar = cast.caravan, nOther = cast.other * 2, beasts = inst(beastG, propMat(1), nCar + nOther);
    await ctx.yield();
    const barge = new THREE.Mesh(bargeGeo(), propMat(0)); barge.frustumCulled = false; scene.add(barge);
    await ctx.yield();
    const gBarge = nCar + nOther + 2, gSpire = nCar + nOther + 3, nGlow = gSpire + 4;
    const glows = set.add(fx.makeGlows({ rng: rng.fork('glow'), positions: new Float32Array(nGlow * 3), color: '#ffffff', size: 5, intensity: 2.6, spikes: 1.5, halo: night ? 0.22 : 0.55, time, fogAmount: 0.4 }));
    glows.object.frustumCulled = false;

    // ---- prism-backs on the hardpan: a herd to the left, and one straggler whose fan swings over the sleigh
    await ctx.yield();
    const nHerd = cast.herd, nCalf = cast.calves ? Math.max(2, Math.round(nHerd * 0.4)) : 0, nPB = 2 + nHerd + nCalf;
    const herd = inst(prismBackGeo(rng.fork('pb')), propMat(1), nPB), hr = rng.fork('herd'), herdData = [];
    await ctx.yield();
    path.pointAt(uFlat, P); path.tangentAt(uFlat, T); { const l = Math.hypot(T.x, T.z) || 1; T.set(T.x / l, 0, T.z / l); }
    // everything that throws a fan stands on the sun's side of us (the right), so the fans are thrown across our way:
    // the straggler 36 m off, the herd's lane 58 to 98 m off, the other caravan and its barge beyond them
    const flatR = [-T.z, T.x], stragX = P.x + flatR[0] * 36 - T.x * 15, stragZ = P.z + flatR[1] * 36 - T.z * 15;
    const q0 = [500 + flatR[0] * 58, 820 + flatR[1] * 58], q1 = [330 + flatR[0] * 58, 600 + flatR[1] * 58], qd = [(q1[0] - q0[0]) / 278, (q1[1] - q0[1]) / 278];
    const dirH = [-T.x, -T.z], antiSun = Math.atan2(-sunDir.x, -sunDir.z), restAng = Math.atan2(P.x + T.x * 45 - stragX, P.z + T.z * 45 - stragZ);     // at rest its fan lies across our way 45 m past the middle of the flat: we meet it only in the scripted sweep
    herdData.push({ x: stragX, z: stragZ, s: 1, v: 0.04, seed: hr(), yaw: hr.range(0, TAU) }, { x: stragX + 7, z: stragZ - 6, s: 0.34, v: 0.04, seed: hr(), yaw: hr.range(0, TAU) });
    const hc = [P.x + flatR[0] * 78 + T.x * 40, P.z + flatR[1] * 78 + T.z * 40], herdPoi = [P.x + flatR[0] * 46 + T.x * 80, 4, P.z + flatR[1] * 46 + T.z * 80];
    for (let i = 0; i < nHerd; i++) { const a = hr.range(-100, 80), b = hr.range(-48, 48) * 0.42; herdData.push({ a, b, x: 0, z: 0, s: hr.range(0.85, 1.15), v: hr.range(0.8, 1.1), seed: hr() }); }
    for (let i = 0; i < nCalf; i++) { const m = herdData[2 + hr.int(0, nHerd - 1)]; herdData.push({ a: m.a - hr.range(6, 11), b: m.b + hr.range(-9, 9), x: 0, z: 0, s: hr.range(0.3, 0.4), v: m.v, seed: hr() }); }
    const fanGeo = new THREE.InstancedBufferGeometry();
    { const fp = [], fi = []; for (let k = 0; k <= 8; k++) { fp.push(-1, k / 8, 0, 1, k / 8, 0); if (k < 8) fi.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2); }
      fanGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fanGeo.setIndex(fi); }
    const aF = new THREE.InstancedBufferAttribute(new Float32Array(nPB * 4), 4), aG = new THREE.InstancedBufferAttribute(new Float32Array(nPB * 2), 2);
    aF.setUsage(THREE.DynamicDrawUsage); fanGeo.setAttribute('aF', aF); fanGeo.setAttribute('aG', aG); fanGeo.instanceCount = nPB;
    herdData.forEach((h, i) => aG.setXY(i, i < 2 ? 0.17 : 0.125, (night ? 0.6 : 0.92) * (h.s < 0.5 ? 0.8 : 1)));
    const fans = new THREE.Mesh(fanGeo, mat(FAN_VS, FAN_FS, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    fans.frustumCulled = false; fans.renderOrder = 2; scene.add(fans);
    // the fan's colour over the whole frame while we are inside it
    const tint = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(1, 1, 1) } }, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendEquation: THREE.AddEquation,
      vertexShader: 'void main(){ gl_Position=vec4(position.xy,0.,1.); }', fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor=vec4(uC,1.); }' }));
    tint.frustumCulled = false; tint.renderOrder = 60; scene.add(tint);
    const tintC = new THREE.Color();
    await ctx.yield();

    // ---- glass-skaters (or crystal tumbleweeds) sliding beside the route in packs of a dozen
    const lanes = [], dB = uBrink * PL + 8, dF = uFoot * PL + 45;
    for (const lat of [-27, 19, 40]) {
      path.posAtDist(dB, P); path.tangentAtDist(dB, T); path.posAtDist(dF, P2); path.tangentAtDist(dF, T2);
      const l1 = Math.hypot(T.x, T.z) || 1, l2 = Math.hypot(T2.x, T2.z) || 1;
      lanes.push({ ax: P.x - T.z / l1 * lat, az: P.z + T.x / l1 * lat, bx: P2.x - T2.z / l2 * lat * 1.3, bz: P2.z + T2.x / l2 * lat * 1.3 });
    }
    lanes.push({ ax: -17, az: 314, bx: -27, bz: 140 }, { ax: 21, az: 314, bx: 33, bz: 140 });
    for (const [u0, l0, u1, l1] of [[0.6, 62, 0.385, 27], [0.575, 104, 0.4, 50], [0.57, 36, 0.43, 19]]) {     // two packs come down the shadowed face beside the climb
      path.pointAt(u0, P); path.tangentAt(u0, T); path.pointAt(u1, P2); path.tangentAt(u1, T2);
      const l1n = Math.hypot(T.x, T.z) || 1, l2n = Math.hypot(T2.x, T2.z) || 1;
      lanes.push({ ax: P.x - T.z / l1n * l0, az: P.z + T.x / l1n * l0, bx: P2.x - T2.z / l2n * l1, bz: P2.z + T2.x / l2n * l1, slow: 0.8 });
    }
    lanes.forEach((ln, i) => { ln.len = Math.hypot(ln.bx - ln.ax, ln.bz - ln.az); ln.dx = (ln.bx - ln.ax) / ln.len; ln.dz = (ln.bz - ln.az) / ln.len; ln.v = (cast.weeds ? 9 : 15) * rng.range(0.85, 1.15) * (ln.slow || 1); ln.ph = rng(); });
    await ctx.yield();
    const nSk = 96, skaters = inst(skaterGeo(cast.weeds), propMat(0), nSk), skData = [], sr = rng.fork('sk');
    for (let i = 0; i < nSk; i++) skData.push({ lane: lanes[Math.floor(i / 12)], ph: (i % 12) * 0.028 + sr.range(0, 0.02) + (i % 12 > 7 ? 0.5 : 0), lat: sr.range(-7, 7), wob: sr.range(0, TAU) });

    // ---- silica blooms and glass-reeds on the hardpan, crystal cairns on the star dune
    {
      const br = rng.fork('bloom'), np = { d: 0, side: 1, a: 0, b: 0 }, nB = Math.round(300 * density * detail), spots = [];
      await ctx.yield();
      for (let t = 0; t < nB * 12 && spots.length < nB; t++) {
        if ((t & 127) === 127) await ctx.yield();
        const flatOne = t % 3 !== 0, a = br.range(-1, 1), b = br.range(-1, 1);
        let x, z;
        if (flatOne) { x = land.flatC[0] + EU[0] * a * 150 + EV[0] * b * 250; z = land.flatC[1] + EU[1] * a * 150 + EV[1] * b * 250; if (land.flatMask(x, z) < 0.5) continue; }
        else { const p = land.route2[br.int(8, land.route2.length - 2)], r = br.range(11, 75) * br.sign(); x = p[0] + EV[0] * r + EU[0] * br.range(-10, 10); z = p[1] + EV[1] * r + EU[1] * br.range(-10, 10); if (Math.hypot(x, z) < 345) continue; }
        if (nearPoly(land.route2, x, z, np).d < 14 || path.nearestXZ(x, z).dist < 11) continue;
        if (Math.abs(land.height(x + 3, z) - land.height(x - 3, z)) + Math.abs(land.height(x, z + 3) - land.height(x, z - 3)) > 1.6) continue;
        spots.push([x, z, flatOne ? br.range(0.55, 1.5) : br.range(0.6, 1.5)]);
      }
      // small blooms close beside the runners on the flat (the caravan's side stays clear)
      for (let i = 0; i < 18; i++) {
        const d = lerp(uFoot * PL + 25, uFlat * PL + 105, (i + br()) / 18), lat = br.range(9, 17);
        path.posAtDist(d, P); path.tangentAtDist(d, T); const tl = Math.hypot(T.x, T.z) || 1, x = P.x - T.z / tl * lat, z = P.z + T.x / tl * lat;
        if (land.flatMask(x, z) > 0.6) spots.push([x, z, br.range(0.32, 0.55)]);
      }
      await ctx.yield();
      const blooms = new THREE.InstancedMesh(bloomGeo(br), propMat(2), spots.length);
      spots.forEach((s, i) => setInst(blooms, i, s[0], land.height(s[0], s[1]) - 0.1, s[1], br.range(0, TAU), s[2]));
      blooms.instanceMatrix.needsUpdate = true; blooms.frustumCulled = false; scene.add(blooms);
      const nR = Math.min(Math.round(9000 * detail), Math.round(9000 * density * detail)), aR = new Float32Array(nR * 4); let k = 0;
      await ctx.yield();
      for (let t = 0; t < nR * 6 && k < nR; t++) {
        if ((t & 255) === 255) await ctx.yield();
        const a = br.range(-1, 1), b = br.range(-1, 1), x = land.flatC[0] + EU[0] * a * 135 + EV[0] * b * 150, z = land.flatC[1] + EU[1] * a * 135 + EV[1] * b * 150;
        if (land.flatMask(x, z) < 0.93 || ctx.noise.n2(x * 0.035, z * 0.035) < -0.05 || nearPoly(land.route2, x, z, np).d < 3.5 || path.nearestXZ(x, z).dist < 4) continue;
        aR[k * 4] = x; aR[k * 4 + 1] = z; aR[k * 4 + 2] = br.range(0.5, 1.15); aR[k * 4 + 3] = br(); k++;
      }
      await ctx.yield();
      const rg = new THREE.InstancedBufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); rg.setIndex([0, 1, 2, 0, 2, 3]);
      rg.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 4)); rg.instanceCount = k;
      const reeds = new THREE.Mesh(rg, mat(REED_VS, REED_FS, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      reeds.frustumCulled = false; reeds.renderOrder = 3; scene.add(reeds);
      await ctx.yield();
      const cg = cairnGeo(br), cm = propMat(0);
      path.pointAt(path.nearestXZ(60, 462).u, P); const c1 = [P.x + 15, P.z - 12];
      const places = [[land.summit.x, land.height(land.summit.x, land.summit.z), land.summit.z, 2.6], [c1[0], land.height(c1[0], c1[1]), c1[1], 1]];
      places.forEach((c, i) => { const m = new THREE.Mesh(cg, cm); m.position.set(c[0], c[1], c[2]); m.scale.setScalar(c[3]); scene.add(m); glows.setPosition(nCar + nOther + i, c[0], c[1] + 7.2 * c[3], c[2]); });
    }
    await ctx.yield();

    // ---- crystal spires beside the climb: clusters of prism glass on the star dune arm's face, 8 to 30 m tall. The
    // nearest eight throw fans of spectral light across our way (wedges in the land shader); four tips carry a glint.
    const spireFans = [], spireTips = [];
    {
      const sp3 = rng.fork('spire'), A = acc(), up = new V3();
      const blade = (bx, bz, lean, la, h, r, hue) => {         // a quartz shaft with a pointed termination
        up.set(Math.sin(lean) * Math.cos(la), Math.cos(lean), Math.sin(lean) * Math.sin(la));
        const b0 = new V3(bx, -0.16, bz), hs = h * 0.76 + 0.16, c = new THREE.Color(hue, 1, 1);
        put(A, new THREE.CylinderGeometry(r * 0.8, r, hs, 6, 1, true), ALONG(b0, up, hs), c, 4, 0, 0, 0, true);
        put(A, new THREE.CylinderGeometry(0.003, r * 0.8, h - hs + 0.16, 6, 1, true), ALONG(b0.clone().addScaledVector(up, hs), up, h - hs + 0.16), c, 4, 0, 0, 0, true);
      };
      const mainLean = 0.07, mainLa = 0.8;
      blade(0, 0, mainLean, mainLa, 1, 0.075, 0);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * TAU + sp3.range(-0.4, 0.4), h = sp3.range(0.28, 0.68) * (i === 1 ? 1.15 : 1), d = sp3.range(0.07, 0.15);
        blade(Math.cos(a) * d, Math.sin(a) * d, sp3.range(0.16, 0.55), a + sp3.range(-0.5, 0.5), h, h * sp3.range(0.085, 0.12), sp3());
      }
      await ctx.yield();
      const spots = [], antiL = [-sunDir.x, -sunDir.z], al = Math.hypot(antiL[0], antiL[1]) || 1; antiL[0] /= al; antiL[1] /= al;
      path.tangentAt(0.5, T); const fanFromRight = antiL[0] * -T.z + antiL[1] * T.x < 0;       // which side throws its fans across our way
      const laneD = (x, z) => { let m = 1e9; for (let q = 5; q < lanes.length; q++) { const ln = lanes[q], t = clamp((x - ln.ax) * ln.dx + (z - ln.az) * ln.dz, 0, ln.len); m = Math.min(m, Math.hypot(x - ln.ax - ln.dx * t, z - ln.az - ln.dz * t)); } return m; };
      const nS = Math.round(34 * Math.max(detail, 0.8));
      for (let t = 0; t < 700 && spots.length < nS; t++) {
        if ((t & 31) === 31) await ctx.yield();
        const far = t % 6 === 5, near = t % 3 === 1, u = far ? sp3.range(0.4, 0.68) : sp3.range(0.355, 0.63), right = far || sp3.chance(fanFromRight ? 0.7 : 0.45);
        // three kinds: small stands close beside the runners, the main ones up the face and on its crest, giants far up the arm
        const lat = far ? sp3.range(75, 135) : near ? sp3.range(15.5, 25) * (right ? 1 : -2.2) : right ? sp3.range(24, 70) : -sp3.range(34, 62), h = far ? sp3.range(19, 30) : near ? sp3.range(5, 9.5) : sp3.range(8, 18), yaw = sp3.range(0, TAU);
        path.pointAt(u, P); path.tangentAt(u, T); const tl = Math.hypot(T.x, T.z) || 1, x = P.x - T.z / tl * lat, z = P.z + T.x / tl * lat;
        if (Math.hypot(x, z) < 348 || path.nearestXZ(x, z).dist < (right ? 14.5 : 30) || laneD(x, z) < 9) continue;
        let ok = true; for (const q of spots) if (Math.hypot(q.x - x, q.z - z) < (far ? 30 : 13)) { ok = false; break; }
        if (ok) spots.push({ x, z, h, yaw, far, y: land.height(x, z), seed: sp3() });
      }
      await ctx.yield();
      const sg = fin(A), spires = new THREE.InstancedMesh(sg, propMat(0), spots.length), aI = new Float32Array(spots.length * 4);
      spots.forEach((q, i) => { setInst(spires, i, q.x, q.y - 0.02 * q.h, q.z, q.yaw, q.h); aI[i * 4 + 3] = q.seed * 5; });
      sg.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
      spires.instanceMatrix.needsUpdate = true; spires.frustumCulled = false; spires.name = 'erg-spires'; scene.add(spires);
      await ctx.yield();
      // the fans: the eight whose light lands nearest the route, no two from the same stand
      const antiA = Math.atan2(antiL[0], antiL[1]);
      // (a prism turns the light it splits: each fan is swung up to 40 degrees from the anti-solar line toward the way we
      // come from, so it lies along the route and we see it lengthwise before we ride through it)
      const cands = spots.filter((q) => !q.far).map((q) => { path.tangentAt(path.nearestXZ(q.x, q.z).u, T); const reach = 55 + 45 * q.seed, ang = antiA + clamp(wrapPi(Math.atan2(-T.x, -T.z) - antiA), -0.7, 0.7) + (q.seed - 0.5) * 0.2; return { q, reach, ang, d: path.nearestXZ(q.x + Math.sin(ang) * reach * 0.42, q.z + Math.cos(ang) * reach * 0.42).dist }; }).sort((a, b) => a.d - b.d);
      for (const c of cands) {
        if (spireFans.length >= 8 || c.d > 30) break;
        if (spireFans.some((f) => Math.hypot(f.x - c.q.x, f.z - c.q.z) < 24)) continue;
        const i = spireFans.length; spireFans.push({ x: c.q.x, z: c.q.z, ang: c.ang });
        X.uSpire.value[i].set(c.q.x, c.q.z, Math.sin(c.ang), Math.cos(c.ang)); X.uSpireB.value[i].set(c.reach, 0.27 + 0.09 * c.q.seed, 0, night ? 0.6 : 1);
        if (spireTips.length < 4 && (i & 1) === 0) {
          const lx = Math.sin(mainLean) * Math.cos(mainLa) * 0.98, lz = Math.sin(mainLean) * Math.sin(mainLa) * 0.98, cy = Math.cos(c.q.yaw), sy = Math.sin(c.q.yaw);
          spireTips.push(new V3(c.q.x + (lx * cy + lz * sy) * c.q.h, c.q.y + c.q.h * 0.95, c.q.z + (-lx * sy + lz * cy) * c.q.h));
        }
      }
      spireTips.forEach((p, i) => glows.setPosition(gSpire + i, p.x, p.y, p.z));
    }
    await ctx.yield();

    // ---- air: glitter in the wind, and the visit's weather
    const windy = weather === 'wind';
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round((windy ? 4200 : 2400) * detail), box: [70, 18, 70], velocity: [WIND[0] * (windy ? 9 : 3), -0.15, WIND[1] * (windy ? 9 : 3)],
      velocityRandom: [1.2, 0.3, 1.2], colors: ['#ffffff', '#d9d4ea', '#ffffff'], size: [0.025, 0.075], intensity: night ? 1.4 : 2.2, twinkle: 1, time }));
    await ctx.yield();
    if (weather === 'devils') for (let i = 0; i < 3; i++) {
      await ctx.yield();
      const a = [[60, -70], [-30, 95], [150, 20]][i]; let x = land.flatC[0] + EU[0] * a[0] + EV[0] * a[1], z = land.flatC[1] + EU[1] * a[0] + EV[1] * a[1];
      for (let q = 0; q < 4 && path.nearestXZ(x, z).dist < 55; q++) { x += EV[0] * 28; z += EV[1] * 28; }          // never a veil across the route
      set.add(fx.makeDustDevil({ rng: rng.fork('devil' + i), time, position: [x, 0, z], height: rng.range(30, 48), radius: [0.9, 7.5], color: '#f4f1ff', colorTop: '#ffffff', shadowColor: '#8a8fc4',
        opacity: 0.3, wander: 10, debris: 220, sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: L.white }));
    }
    await ctx.yield();
    if (weather === 'meteors' || night) set.add(fx.makeShootingStars({ rng: rng.fork('met'), time, count: weather === 'meteors' ? 30 : 8, period: weather === 'meteors' ? [2.2, 6.5] : [6, 14], color: '#ffffff', tailColor: '#aab8e6', intensity: 5, radius: 3200 }));

    await ctx.yield();
    // ---- spindrift off the star dune's knife crest (found by climbing to the ridge from its plan line), and the white shaft
    {
      const sr2 = rng.fork('spin'), aS = [], aW = [], M = land.massif, quad = [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0];
      for (let i = 0; i < M.length - 1; i++) {
        const a = M[i], b = M[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 13)), nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
        for (let k = 0; k < n; k++) {
          const f = (k + 0.5) / n, x0 = lerp(a[0], b[0], f), z0 = lerp(a[1], b[1], f); let bh = -1e9, bo = 0;
          for (let o = -36; o <= 36; o += 6) { const h = land.height(x0 + nx * o, z0 + nz * o); if (h > bh) { bh = h; bo = o; } }
          const x = x0 + nx * bo, z = z0 + nz * bo, tall = sr2.range(0.6, 1.4), sd = sr2();
          if (bh < 60 || path.nearestXZ(x, z).dist < 70 || ctx.noise.n2(x * 0.006 + 31, z * 0.006) < -0.25) continue;
          aS.push(x, bh, z, sd); aW.push(sr2.range(26, 40), (14 + bh * 0.07) * tall);
        }
        await ctx.yield();
      }
      for (const x of [-46, -35, -25, -16, 16, 25, 35, 46]) { const z = Math.sqrt(327 * 327 - x * x); aS.push(x, ground(x, z) + 1.2, z, sr2()); aW.push(sr2.range(13, 19), sr2.range(5, 8.5)); }     // and off the saddle lip, either side of the leap
      // and off the opening barchan's own crest, ahead of the first frame: low veils that smoke against the black sky
      for (let i = 2; i < 6; i++) {
        const a = land.d0[i], b = land.d0[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 24)), nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
        for (let k = 0; k < n; k++) {
          const f = (k + 0.5) / n, x0 = lerp(a[0], b[0], f), z0 = lerp(a[1], b[1], f); let bh = -1e9, bo = 0;
          for (let o = -18; o <= 18; o += 6) { const h = land.height(x0 + nx * o, z0 + nz * o); if (h > bh) { bh = h; bo = o; } }
          const x = x0 + nx * bo, z = z0 + nz * bo, pd = path.nearestXZ(x, z).dist, sd = sr2(), w = sr2.range(0.8, 1.25);
          if (pd < 12) continue;
          const near = 1 - smoothstep(14, 45, pd); aS.push(x, bh + 0.9, z, sd); aW.push(lerp(24, 16, near) * w, lerp(12, 8, near) * w);
        }
        await ctx.yield();
      }
      const sg = new THREE.InstancedBufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(quad, 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(aS), 4)); sg.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(aW), 2)); sg.instanceCount = aS.length / 4;
      const add = { fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
      const spin = new THREE.Mesh(sg, mat(STREAM_VS, STREAM_FS, add)); spin.name = 'erg-spindrift'; spin.frustumCulled = false; spin.renderOrder = 3; scene.add(spin);
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(quad, 3)); hg.setIndex([0, 1, 2, 0, 2, 3]);
      const shaft = new THREE.Mesh(hg, mat(SHAFT_VS, SHAFT_FS, add)); shaft.name = 'erg-shaft'; shaft.frustumCulled = false; shaft.renderOrder = 5; scene.add(shaft);
    }
    await ctx.yield();

    // ---- the tow: a bridle of two short lines from the prow to a ring, and one striped hawser from the ring to the
    // rearmost pair of beasts. Camera-facing ribbons, hung in the air; cast off at the crest, where the hawser whips away.
    const NL = 4, NT = 24, HAW0 = 4 * (NL + 1) * 2, towPos = new Float32Array((HAW0 + (NT + 1) * 2) * 3), towEnd = [new V3(), new V3()], uC = dCrest / PL;
    {
      // white and lavender bands; the upper edge of the ribbon is the lit one, so the line reads as a rope catching the sun
      const col = [], idx = [], lk = night ? 0.3 : 1, cw = new THREE.Color(WHT).multiplyScalar(0.95 * lk), cb = new THREE.Color('#3f4474').multiplyScalar(lk);
      const strip = (v0, n, band) => { for (let k = 0; k <= n; k++) {
        const c = band && (k >> 1) & 1 ? cb : cw, v = v0 + k * 2; col.push(c.r * 0.5, c.g * 0.5, c.b * 0.56, c.r * 1.05, c.g * 1.05, c.b * 1.05);
        if (k < n) idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
      } };
      for (let r = 0; r < 4; r++) strip(r * (NL + 1) * 2, NL, true); strip(HAW0, NT, true);
      const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(towPos, 3); pa.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', pa); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      const tow = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
      tow.frustumCulled = false; tow.name = 'erg-tow'; scene.add(tow);
      var towAttr = pa;
    }
    const A0 = new V3(), B0 = new V3(), R0 = new V3(), Q = new V3(), Dv = new V3(), Sv = new V3(), CP = new V3(), S0 = new V3();
    const towStation = (o, cp, wk) => {                         // one ribbon station at Q, facing the camera; +Sv is the upper, sunlit edge
      const dc = Q.distanceTo(cp), w = clamp(dc * 0.0034, 0.02, 0.3) * wk;
      Sv.subVectors(Q, cp).cross(Dv); const sl = (Sv.length() || 1) * (Sv.y < 0 ? -1 : 1); Sv.multiplyScalar(w / sl);
      towPos[o] = Q.x - Sv.x; towPos[o + 1] = Q.y - Sv.y; towPos[o + 2] = Q.z - Sv.z; towPos[o + 3] = Q.x + Sv.x; towPos[o + 4] = Q.y + Sv.y; towPos[o + 5] = Q.z + Sv.z;
    };
    function towUpdate(t, u, cp) {
      const k = smoothstep(uC - 0.012, uC + 0.03, u), kc = Math.pow(k, 1.4) * 0.85, wk = 1 - smoothstep(uC + 0.03, uC + 0.075, u), d0 = Math.min(u * PL + 1.6, PL - 1);
      path.posAtDist(d0, P); path.tangentAtDist(d0, T); const tl = Math.hypot(T.x, T.z) || 1, rx = -T.z / tl, rz = T.x / tl;
      // the hawser ends at a yoke 5 m behind the rear pair, a short line to each; once cast off it trails from one beast
      B0.addVectors(towEnd[0], towEnd[1]).multiplyScalar(0.5); B0.x -= T.x / tl * 5; B0.z -= T.z / tl * 5; B0.y = Math.max(B0.y - 1.6, ground(B0.x, B0.z) + 1.2); B0.lerp(towEnd[0], k);
      for (let r = 0; r < 2; r++) {
        Dv.subVectors(towEnd[r], B0); if (Dv.lengthSq() < 1e-6) Dv.set(0, 1, 0); Dv.normalize();
        for (let i = 0; i <= NL; i++) { const f = i / NL; Q.lerpVectors(B0, towEnd[r], f); Q.y -= 0.25 * 4 * f * (1 - f); towStation(((2 + r) * (NL + 1) + i) * 6, cp, wk * (1 - k)); }
      }
      A0.set(P.x, P.y - 1.9, P.z);
      Dv.subVectors(B0, A0); const len = Dv.length() || 1; Dv.multiplyScalar(1 / len);
      Sv.set(T.x / tl, 0, T.z / tl).lerp(Dv, 0.55).normalize();
      R0.copy(A0).addScaledVector(Sv, Math.min(6, len * 0.4)); R0.y += 0.55; R0.lerp(B0, kc);          // the ring; cast off, it flies toward the beasts
      for (let r = 0; r < 2; r++) {
        const side = r ? 1 : -1; S0.set(A0.x + rx * side * 1.2, A0.y, A0.z + rz * side * 1.2).lerp(R0, kc);
        Dv.subVectors(R0, S0).normalize();
        for (let i = 0; i <= NL; i++) { const f = i / NL; Q.lerpVectors(S0, R0, f); Q.y -= 0.12 * 4 * f * (1 - f); towStation((r * (NL + 1) + i) * 6, cp, wk); }
      }
      Dv.subVectors(B0, R0).normalize();
      const hl = R0.distanceTo(B0), sag = 0.9 * Math.min(1, hl / 30) + 5 * k, whip = Math.sin(Math.PI * k) * 2.6 + 1.2 * k;
      for (let i = 0; i <= NT; i++) {
        const f = i / NT, bow = 4 * f * (1 - f), sw = Math.sin(t * 1.7 + f * 3) * 0.3 * bow * Math.min(1, hl / 30) + Math.sin(t * 9 + f * 8) * whip * (1 - f);
        Q.lerpVectors(R0, B0, f); Q.x += rx * sw; Q.z += rz * sw;
        Q.y = Math.max(Q.y - sag * bow - k * (1 - f) * 3 + Math.cos(t * 7 + f * 6) * whip * 0.5 * (1 - f), ground(Q.x, Q.z) + 0.3);     // a catenary in the air, never on the sand until the cast-off
        towStation(HAW0 * 3 + i * 6, cp, wk);
      }
      towAttr.needsUpdate = true;
    }
    await ctx.yield();
    // ---- twin plumes of glitter thrown off the runners: two ribbons carried beside the prow, strongest on the slip face and the run in
    const NP = 7, sprayPos = new Float32Array(2 * NP * 2 * 3), uLand = path.nearestXZ(0, 205).u;
    {
      const uv = [], idx = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < NP; i++) { const v = (r * NP + i) * 2; uv.push(i / (NP - 1), 0, r, i / (NP - 1), 1, r); if (i < NP - 1) idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
      const g = new THREE.BufferGeometry(), pa = new THREE.BufferAttribute(sprayPos, 3); pa.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', pa); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 3)); g.setIndex(idx);
      const spray = new THREE.Mesh(g, mat(SPRAY_VS, SPRAY_FS, { fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      spray.frustumCulled = false; spray.name = 'erg-spray'; spray.renderOrder = 6; scene.add(spray);
      var sprayAttr = pa;
    }
    function sprayUpdate(u) {
      const slide = smoothstep(uBrink - 0.005, uBrink + 0.02, u) * (1 - smoothstep(uFoot + 0.03, uFoot + 0.09, u));
      const air = smoothstep(uC - 0.004, uC + 0.012, u) * (1 - smoothstep(uLand - 0.01, uLand + 0.025, u));
      X.uSpray.value = ctx.through ? 0 : (0.3 + 0.7 * Math.max(slide, smoothstep(uLand, uLand + 0.04, u))) * (1 - air);
      path.posAtDist(u * PL, P); path.tangentAtDist(u * PL, T); const tl = Math.hypot(T.x, T.z) || 1, tx = T.x / tl, tz = T.z / tl;
      for (let r = 0; r < 2; r++) for (let i = 0; i < NP; i++) {
        const side = r ? 1 : -1, f = i / (NP - 1), a = lerp(12, 2.4, f), l0 = side * (2.3 + 2.4 * f * f), l1 = l0 + side * (0.5 + 1.7 * f), o = (r * NP + i) * 6;
        const x0 = P.x + tx * a - tz * l0, z0 = P.z + tz * a + tx * l0, x1 = P.x + tx * a - tz * l1, z1 = P.z + tz * a + tx * l1, yc = ground(P.x + tx * a, P.z + tz * a), y = clamp(ground(x0, z0), yc - 0.8, yc + 0.5);
        sprayPos[o] = x0; sprayPos[o + 1] = y + 0.03; sprayPos[o + 2] = z0; sprayPos[o + 3] = x1; sprayPos[o + 4] = y + 0.2 + 1.7 * Math.pow(f, 0.7); sprayPos[o + 5] = z1;
      }
      sprayAttr.needsUpdate = true;
    }
    await ctx.yield();
    // ---- a crown of black crystal stubs round the portal, so the ring reads against the white point
    {
      const A = acc(), cr = rng.fork('crown');
      for (let i = 0; i < 18; i++) {
        const a = (i + cr.range(-0.3, 0.3)) / 18 * TAU, len = cr.range(2.4, 5.1) * (1 + 0.9 * Math.pow(Math.abs(Math.sin(a)), 3));
        const dir = new V3(Math.sin(a), Math.cos(a), cr.range(-0.5, -0.05)), base = new V3(Math.sin(a) * 8.3, 7.6 + Math.cos(a) * 8.3, -0.6);
        put(A, hex(0.03, cr.range(0.62, 1.0), len), ALONG(base, dir, len), BLK, 1, i, 0, 0, true);
      }
      const crown = new THREE.Mesh(fin(A), propMat(0)); crown.frustumCulled = false; crown.name = 'erg-crown'; scene.add(crown);
    }

    // ---- animation
    const baseSun = U.uSunCol.value.clone(), baseAmb = U.uAmb.value.clone(), baseSpark = U.uSparkle.value, discI = sky.uniforms.uSun.value.y, keyI = key.intensity;
    const GU = glare.material.uniforms;
    let stragAng = restAng;
    const C0 = [0, 0], C1 = [0, 0];
    const carAt = (d, row, side, latA, out) => {
      path.posAtDist(d, P); path.tangentAtDist(d, T); const tl = Math.hypot(T.x, T.z) || 1;
      const lat = lerp(-bendAt(d) + side * 4.6 + Math.min(2.5 + 1.2 * row, 5) * Math.sin(d * 0.02 + row * 0.7), side * latA, smoothstep(dCrest - 100, dCrest - 20, d));
      out[0] = P.x - T.z / tl * lat; out[1] = P.z + T.x / tl * lat;
    };
    const saddleXZ = [38, 436];
    function animate(t, u) {
      const camD = u * PL;
      // we draw level with the rear of the file on the flat and the first half of the climb, then they pull ahead for the rim
      const lead = lerp(28, 8, smoothstep(0.16, 0.26, u) * (1 - smoothstep(0.54, 0.63, u)));
      // the heliograph caravan: lopes ahead in double file, peels off along the rim at the crest and halts, flashing
      for (let i = 0; i < nCar; i++) {
        const row = i >> 1, side = i & 1 ? 1 : -1, latA = 8.5 - 3.5 * row / (nCar / 2), slot = 4 + row * 14;     // the rear pair halt 12 m either side of the lip: we leap between them
        const d = Math.min(camD + lead + row * 13 + (i & 1) * 6, dCrest + slot);
        let x, z, yaw, amp = 1;
        if (d <= dCrest) {
          // the line keeps to its own trail while the sleigh swings wide of it, and it snakes: each beast is seen
          // three-quarter, neck and head against the sky, never the whole file from dead astern
          carAt(d, row, side, latA, C0); carAt(d + 3, row, side, latA, C1);
          x = C0[0]; z = C0[1]; yaw = Math.atan2(-(C1[0] - x), -(C1[1] - z));
        } else {
          const e = d - dCrest, ang = side * (latA + e) / 326, halt = smoothstep(Math.max(slot - 9, 0), slot, e);
          x = 326 * Math.sin(ang); z = 326 * Math.cos(ang);
          const yw = Math.atan2(-Math.cos(ang) * side, Math.sin(ang) * side);
          yaw = yw + wrapPi(Math.atan2(x, z) - yw) * halt; amp = 1 - 0.88 * halt;
        }
        const ph = d * 0.42 + i * 1.7 + (1 - amp) * t * 0.6, y = ground(x, z) + Math.abs(Math.sin(ph * 0.5)) * 1.1 * amp;
        setInst(beasts.m, i, x, y, z, yaw, 1);
        if (i < 2) towEnd[i].set(x + Math.sin(yaw) * 2.6, y + 4.3, z + Math.cos(yaw) * 2.6);
        if (i < 16) X.uBeast.value[i].set(x, z, 1);
        const fl = Math.pow(Math.max(0, Math.sin(t * 1.6 - row * 0.6)), 10);     // a row flashes together, rows 0.37 s apart
        beasts.aI.setXYZW(i, ph, fl, amp, i * 0.37);
        glows.setPosition(i, x, y + 9.6, z); glows.setSize(i, 0.12 + (night ? 1.3 : 3.1) * fl);
      }
      // the other caravan: same heading, slower; we overtake it on the flat
      const L2 = 330, base2 = 150 * clamp(u / 0.5, 0, 1.3) + t * 0.5, yaw2 = Math.atan2(-qd[0], -qd[1]);
      const wrap2 = (d) => ((d % L2) + L2) % L2, fade2 = (d) => Math.max(0.001, smoothstep(0, 14, d) * (1 - smoothstep(L2 - 14, L2, d)));
      for (let i = 0; i < nOther; i++) {
        const k = nCar + i, d = wrap2(base2 + 38 + (i >> 1) * 12.5), side = i & 1 ? 1 : -1, x = q0[0] + qd[0] * d - qd[1] * side * 4.2, z = q0[1] + qd[1] * d + qd[0] * side * 4.2;
        const ph = d * 0.42 + i * 2.3, y = ground(x, z) + Math.abs(Math.sin(ph * 0.5)) * 1.1;
        setInst(beasts.m, k, x, y, z, yaw2, 0.92 * fade2(d));
        const fl = Math.pow(Math.max(0, Math.sin(t * 1.7 + (i >> 1) * 0.6 + 2)), 24);
        beasts.aI.setXYZW(k, ph, fl, 1, k * 0.37);
        glows.setPosition(k, x, y + 8.8, z); glows.setSize(k, (0.12 + (night ? 1.3 : 2.8) * fl) * fade2(d));
      }
      { const db = wrap2(base2 + 14), x = q0[0] + qd[0] * db, z = q0[1] + qd[1] * db, y = ground(x, z), y1 = ground(x + qd[0] * 8, z + qd[1] * 8);
        barge.position.set(x, y + 0.05, z); barge.scale.setScalar(fade2(db)); barge.rotation.set(Math.atan2(y1 - y, 8), yaw2, 0, 'YXZ');
        const fl = Math.pow(Math.max(0, Math.sin(t * 1.3)), 16); glows.setPosition(gBarge, x - qd[0] * 8.6, y + 7.6, z - qd[1] * 8.6); glows.setSize(gBarge, 0.1 + 1.6 * fl); }
      glows.setSize(nCar + nOther, 0.9 + 0.5 * Math.sin(t * 2.3)); glows.setSize(nCar + nOther + 1, 0.5 + 0.45 * Math.sin(t * 3.1 + 1));
      // prism-backs and their fans
      const walk = t * 1.1, moving = 0.55, LANE = 250;          // the herd never stops: each walker wraps along its lane, fading at the ends
      path.pointAt(u, P);
      const k = smoothstep(uFlat - 0.15, uFlat - 0.05, u) * (1 - smoothstep(uFlat + 0.05, uFlat + 0.15, u));
      const sweep = Math.atan2(P.x - stragX, P.z - stragZ) + 0.17 * lerp(1.6, -1.6, smoothstep(uFlat - 0.035, uFlat + 0.035, u));
      stragAng = restAng + wrapPi(sweep - restAng) * k;
      for (let i = 0; i < nPB; i++) {
        const h = herdData[i]; let x = h.x, z = h.z, fade = 1;
        if (i >= 2) {
          const q = ((h.a + 110 + walk * h.v) % LANE + LANE) % LANE, a = q - 110;
          fade = smoothstep(0, 14, q) * (1 - smoothstep(LANE - 14, LANE, q));
          x = hc[0] + dirH[0] * a - dirH[1] * h.b; z = hc[1] + dirH[1] * a + dirH[0] * h.b;
        }
        const y = ground(x, z);
        setInst(herd.m, i, x, y - 0.05 - (1 - fade) * 3, z, i < 2 ? h.yaw : Math.atan2(-dirH[0], -dirH[1]) + (h.seed - 0.5) * 0.3, h.s * Math.max(fade, 0.001));
        herd.aI.setXYZW(i, walk * h.v * 0.8 / h.s + h.seed * 6, 0.2 + 0.13 * Math.sin(t * 1.7 + h.seed * 20), i < 2 ? 0.08 : moving, h.seed);     // the shells hold a slow white glow: they are the lamps of their own fans
        const ang = i === 0 ? stragAng : (i === 1 ? stragAng + 0.5 : antiSun) + 0.3 * Math.sin(t * 0.45 + h.seed * 9) * (i ? 1 : 0);
        aF.setXYZW(i, x, z, ang, (h.s < 0.5 ? 22 : (i < 2 ? 150 : 100 + 60 * h.seed) * h.s) * fade);     // herd fans differ in reach: only some lie across our way
      }
      // skaters
      for (let i = 0; i < nSk; i++) {
        const s = skData[i], ln = s.lane, q = (t * ln.v / ln.len + ln.ph + s.ph) % 1, dist = q * ln.len, wob = s.lat + Math.sin(dist * 0.045 + s.wob) * 3;
        const x = ln.ax + ln.dx * dist - ln.dz * wob, z = ln.az + ln.dz * dist + ln.dx * wob, y = ground(x, z), y1 = ground(x + ln.dx * 2, z + ln.dz * 2);
        const fade = smoothstep(0, 0.06, q) * (1 - smoothstep(0.9, 1, q));
        if (cast.weeds) setInst(skaters.m, i, x, y + Math.abs(Math.sin(dist * 0.3 + s.wob)) * 0.9, z, Math.atan2(-ln.dx, -ln.dz), fade * 1.1, -dist / 0.95);
        else setInst(skaters.m, i, x, y + 0.05, z, Math.atan2(-ln.dx, -ln.dz) + Math.cos(dist * 0.045 + s.wob) * 0.12, fade * 1.15, Math.atan2(y1 - y, 2));
      }
      beasts.m.instanceMatrix.needsUpdate = true; beasts.aI.needsUpdate = true; herd.m.instanceMatrix.needsUpdate = true; herd.aI.needsUpdate = true;
      skaters.m.instanceMatrix.needsUpdate = true; aF.needsUpdate = true;
      // the slip face lets go as we tip over it, and a song ring races out across the dunes
      X.uAval.value = 0.3 + 0.7 * smoothstep(uBrink - 0.012, uBrink + 0.015, u) * (1 - smoothstep(uFoot + 0.04, uFoot + 0.12, u));
      X.uBandK.value = u < 0.33 ? 0.45 : u < 0.668 ? 1 : 0.8;     // the ring off the slip face is a faint spectrum (the herd's fans own the flat); the three from the saddle are full
      if (u < 0.33) X.uRing.value.set(brink.x, brink.z, Math.max(0, u - uBrink) * PL * 3.4, smoothstep(uBrink, uBrink + 0.008, u) * (1 - smoothstep(uBrink + 0.1, uBrink + 0.17, u)) * (0.35 + 0.65 * smoothstep(uBrink + 0.004, uBrink + 0.03, u)));     // the ring is faint while it is still under the runners: no white-out
      else if (u >= 0.668) { const f = clamp((u - 0.668) / (uC + 0.03 - 0.668), 0, 1); X.uRing.value.set(0, 0, 318 + f * 95, smoothstep(0, 0.1, f) * (1 - smoothstep(0.8, 1, f)) * 1.5); }     // and one out of the bowl itself, over the rim: the hanging valley is a band of colour under the beasts as the Choir comes up
      else { const q = clamp((u - 0.35) / 0.105, 0, 2.999), f = q - Math.floor(q); X.uRing.value.set(saddleXZ[0], saddleXZ[1], f * 0.105 * PL * 3.4, smoothstep(0, 0.06, f) * (1 - smoothstep(0.7, 1, f)) * 1.5 * (1 - smoothstep(0.64, 0.665, u))); }
      // rare: a moon crosses the sun on the climb; everything snuffs out, then the window re-ignites petal by petal
      // the Choir is black glass on a black sky until we top the rim; then it blazes
      U.uReveal.value = smoothstep(uC - 0.09, uC - 0.02, u);
      // the last sixty metres glow: the white point and the petals round it come up as we run in
      const apr = smoothstep(0.86, 0.97, u), core = lerp(coreI, 0.62, apr);
      U.uApproach.value = apr; if (!rare) U.uCore.value = core;
      // the spires: their fans sway a little, and the tips of the nearest blaze as a ring goes through them
      const RV = X.uRing.value;
      for (let i = 0; i < spireFans.length; i++) { const f = spireFans[i], a = f.ang + 0.07 * Math.sin(t * 0.5 + i * 1.9); X.uSpire.value[i].set(f.x, f.z, Math.sin(a), Math.cos(a)); }
      for (let i = 0; i < 4; i++) {
        const p = spireTips[i]; if (!p) { glows.setSize(gSpire + i, 0.001); continue; }
        const r2 = Math.hypot(p.x - RV.x, p.z - RV.y), x2 = (r2 - RV.z) / 18, x3 = (r2 - RV.z * 0.62) / 18; let fl = (Math.exp(-x2 * x2) + 0.6 * Math.exp(-x3 * x3)) * RV.w;
        const r = Math.hypot(p.x, p.z); for (let k = 0; k < 3; k++) { const rr = (U.uSongT.value + 3.5 * k) * 150, x = (r - rr) / 18; fl += Math.exp(-x * x) * Math.max(0, 1 - rr / 1500); }
        glows.setSize(gSpire + i, (0.22 + 0.06 * Math.sin(t * 2.1 + i * 2.3) + 0.7 * Math.min(fl, 1.2)) * (night ? 0.6 : 1));
      }
      if (rare) {
        const a = smoothstep(0.555, 0.58, u), b = smoothstep(0.645, 0.67, u), tot = a * (1 - b), sunK = 1 - tot;
        hero.setProgress(u < 0.62 ? 1 - a : lerp(0.2, 1, smoothstep(0.66, 0.8, u))); U.uCore.value *= core / 1.7;
        U.uSunCol.value.copy(baseSun).multiplyScalar(lerp(0.14, 1, sunK)); U.uSparkle.value = baseSpark * lerp(7, 1, sunK);
        U.uAmb.value.copy(baseAmb).addScaledVector(U.uHaze.value, 0.1 * tot); X.uEcl.value = tot;
        sky.uniforms.uSun.value.y = discI * sunK; key.intensity = keyI * lerp(0.14, 1, sunK); X.uFanOn.value = sunK; GU.uI.value = sunK;
        const mx = (u - 0.6125) * 0.9; GU.uMoonAt.value.set(mx, -0.3 * mx);
      }
    }
    await ctx.yield();
    animate(0, 0);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    const tallest = hero.anchors.tallest, sunPoi = new V3(), winPoi = new V3();
    return {
      scene, path, duration: 50,
      // the leap off the saddle lip is held: the whole rose window lies below for a few seconds before the drop
      pace: (u) => 1 - 0.55 * smoothstep(uC - 0.015, uC + 0.02, u) * (1 - smoothstep(uC + 0.05, uC + 0.1, u)),
      title: rare ? 'The Singing Erg, Eclipsed' : night ? 'The Singing Erg under Two Moons' : lookId === 'low' ? 'The Singing Erg, Long Shadows' : 'The Singing Erg',
      ride: 'sleigh', style: 'none',
      camera: { fov: 62, near: 0.3, far: 7500, lookAhead: 26, sway: 0.8, bank: 0.8 },
      pois: [
        { at: herdPoi, from: 0.16, to: 0.31, weight: 0.3 },                                  // the prism-back herd and its fans
        { at: [land.summit.x, land.summit.y * 0.45, land.summit.z], from: 0.34, to: 0.54, weight: 0.35 },   // the cairn and the sunlit crest line
        { at: (t, u) => { const k = smoothstep(uC - 0.03, uC + 0.012, u); return winPoi.set(0, lerp(120, 22, k), lerp(-120, -60, k)); }, from: 0.55, to: uC + 0.1, weight: 0.5 },
        { at: [0, tallest.height * 0.3, tallest.position.z], from: uC + 0.075, to: 0.93, weight: 0.45 },
        ...(rare ? [{ at: (t, u) => path.pointAt(clamp(u, 0, 1), sunPoi).addScaledVector(sunDir, 900), from: 0.555, to: 0.645, weight: 0.35 }] : []),
      ],
      portal: { shape: 'circle', radius: 7, color: '#ECE8FF', glow: 1.1, revealDistance: 340 },
      post: { exposure: L.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.09, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        animate(t, u);
        towUpdate(t, u, CP.setFromMatrixPosition(camera.matrixWorld));
        sprayUpdate(u);
        hero.update(dt, t, camera);
        // inside the straggler's fan the whole frame takes its colour
        const dx = CP.x - herdData[0].x, dz = CP.z - herdData[0].z, sa = Math.sin(stragAng), ca = Math.cos(stragAng);
        const al = dx * sa + dz * ca, tt = (dx * ca - dz * sa) / (Math.max(al, 1) * 0.17);
        const str = al > 8 && al < 140 ? smoothstep(1, 0.8, Math.abs(tt)) * X.uFanOn.value * (night ? 0.6 : 1) * smoothstep(uFlat - 0.05, uFlat - 0.035, u) * (1 - smoothstep(uFlat + 0.035, uFlat + 0.05, u)) : 0;
        if (str <= 0.004) tint.material.uniforms.uC.value.setRGB(1, 1, 1);          // always drawn: a multiply by white changes nothing
        else {          // coloured light, not paint: the hue's strongest channel is lifted above white, the others only half dimmed
          spectralJS(tt * 0.5 + 0.5, tintC); const mx = 1.2 / Math.max(tintC.r, tintC.g, tintC.b, 0.2), a = 0.36 * str;
          tint.material.uniforms.uC.value.setRGB(lerp(1, tintC.r * mx + 0.1, a), lerp(1, tintC.g * mx + 0.1, a), lerp(1, tintC.b * mx + 0.1, a));
        }
        sky.update(dt, t, camera); set.update(dt, t, camera);
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
