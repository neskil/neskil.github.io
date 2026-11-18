// The Galleon Among the Flowers
// A wet forest many days from any sea. Under the trees it is green dusk: buttressed trunks, lianas, giant ferns, a pool
// that steams, red lilies, golden salamanders on a log, the glow of insects, and small yellow flowers falling without a
// sound. Then the green opens, and in the clearing stands a Spanish galleon, whole, white and powdery in the shafts of
// the sun, leaning a little to starboard on her bed of stones, orchids in her rigging. The flight passes her port bow,
// climbs her side, crosses the rail, goes down the main hatch into a nave of ribs filled with flowers, and leaves by the
// middle window of her stern.
//
// Everything is built at four times life size, so that the camera can fly inside the ship: the hull is 166 m long.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, SHIP, FLIGHT } from '../parts/galleon-in-the-flowers.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// geometry in the form the flora kit's wind material draws: position, normal, colour, atlas uv (the solid cell), wind
class WG {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.w = []; this.i = []; this.count = 0; }
  v(p, n, c, sway = 0, flutter = 0, leaf = 0) {
    this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.c.push(c[0], c[1], c[2]); this.uv.push(0.875, 0.75); this.w.push(sway, flutter, leaf, 0);
    return this.count++;
  }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  build(height, radius, kind) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('wind', new THREE.Float32BufferAttribute(this.w, 4)); g.setIndex(this.i);
    g.userData = { triangles: this.i.length / 3, height, radius, kind, glowColor: null };
    g.computeBoundingSphere();
    return g;
  }
}

// a forest giant's foot: a column that flares into thin plank buttresses, mossy on the sills
function trunkGeometry(rng) {
  const G = new WG(), H = rng.range(36, 46), r0 = rng.range(2.3, 3.3), nf = rng.int(4, 7), fins = [], a0 = rng() * TAU;
  for (let k = 0; k < nf; k++) fins.push({ a: a0 + (k + rng.range(-0.28, 0.28)) * TAU / nf, R: rng.range(4.5, 8.5), h: rng.range(9, 21), s: rng.range(0.11, 0.17), wob: rng.range(-0.25, 0.25) });
  const angs = []; for (let k = 0; k < 9; k++) angs.push(k * TAU / 9 + 0.11);
  for (const f of fins) for (const d of [-1.7, 0, 1.7]) angs.push(f.a + d * f.s);
  const A = angs.map((a) => ((a % TAU) + TAU) % TAU).sort((x, y) => x - y).filter((a, i, l) => i === 0 || a - l[i - 1] > 0.07);
  const Y = [-1.5, 0, 2, 4.5, 8, 12.5, 18, 26, H];
  const bark = lin('#8f7c62'), barkD = lin('#66584a'), moss = lin('#4f8234'), lichen = lin('#a4ae92');
  const rad = (a, y) => {
    let r = r0 * (1 - 0.3 * clamp(y / H, 0, 1)) * (1 + 0.05 * Math.sin(a * 3 + y * 0.21)), fin = 0;
    for (const f of fins) {
      const t = clamp(1 - Math.max(y, 0) / f.h, 0, 1); if (t <= 0) continue;
      let d = a - (f.a + f.wob * (1 - t)); d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
      const e = Math.exp(-(d * d) / (f.s * f.s)) * f.R * Math.pow(t, 1.7); r += e; fin += e;
    }
    return [r, fin];
  };
  const P = (a, y) => { const [r] = rad(a, y); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const rows = [];
  for (let j = 0; j < Y.length; j++) {
    const row = [];
    for (let i = 0; i <= A.length; i++) {
      const a = i === A.length ? A[0] + TAU : A[i], y = Y[j], [r, fin] = rad(a, y), p = [Math.cos(a) * r, y, Math.sin(a) * r];
      const e = 0.03, pa = P(a + e, y), pb = P(a - e, y), pu = P(a, y + 0.4), ta = [pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]], tu = [pu[0] - p[0], pu[1] - p[1], pu[2] - p[2]];
      let n = [tu[1] * ta[2] - tu[2] * ta[1], tu[2] * ta[0] - tu[0] * ta[2], tu[0] * ta[1] - tu[1] * ta[0]]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
      if (n[0] * Math.cos(a) + n[2] * Math.sin(a) < 0) n = [-n[0], -n[1], -n[2]];
      const crease = clamp(fin / 2.2, 0, 1), ao = (0.78 + 0.22 * crease) * (0.82 + 0.18 * smoothstep(0, 9, y)), hh = hash(i * 7.3 + j * 3.1 + r0);
      let c = mix3(barkD, bark, 0.45 + 0.55 * hh);
      c = mix3(c, moss, clamp((1 - y / 16) * (0.35 + 0.5 * hh) + 0.35 * crease * (1 - y / 22), 0, 0.85));
      if (hh > 0.8 && y > 6) c = mix3(c, lichen, 0.5);
      row.push(G.v(p, n, mul3(c, ao)));
    }
    rows.push(row);
  }
  for (let j = 0; j < Y.length - 1; j++) for (let i = 0; i < A.length; i++) G.quad(rows[j][i], rows[j + 1][i], rows[j + 1][i + 1], rows[j][i + 1]);
  return G.build(H, 9, 'trunk');
}

// a clump of very large leaves on arching stalks (the forest's lowest storey, close on both sides of the way)
function bigLeafGeometry(rng, o = {}) {
  const G = new WG(), n = o.leaves ?? rng.int(5, 8), dark = lin(o.dark || '#0f3a1c'), mid = lin(o.mid || '#2f7a30'), light = lin(o.light || '#86bd4a'), rib = lin('#a9cf6a');
  let az = rng() * TAU, top = 0;
  for (let k = 0; k < n; k++) {
    az += 2.4 + rng.range(-0.5, 0.5);
    const L = rng.range(6, 11) * (o.size || 1), W = L * rng.range(0.2, 0.3), el0 = rng.range(1.05, 1.45), el1 = rng.range(-0.55, 0.1), stalk = rng.range(0.22, 0.4), segs = 6;
    const dx = Math.cos(az), dz = Math.sin(az), side = [-dz, 0, dx], tone = rng.range(0.75, 1.15), idx = [];
    let p = [dx * 0.3, 0, dz * 0.3];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs, el = lerp(el0, el1, Math.pow(t, 1.3)), dir = [dx * Math.cos(el), Math.sin(el), dz * Math.cos(el)];
      if (s > 0) p = [p[0] + dir[0] * L / segs, p[1] + dir[1] * L / segs, p[2] + dir[2] * L / segs];
      const b = clamp((t - stalk) / (1 - stalk), 0, 1), w = t < stalk ? 0.14 : 0.14 + W * Math.pow(Math.sin(Math.PI * Math.pow(b, 0.62)), 0.75);
      const nrm = [-dir[1] * dx, Math.cos(el), -dir[1] * dz], lift = w * 0.22, sway = 0.08 + 0.75 * t * t, fl = t < stalk ? 0 : 0.35;
      const cm = mul3(t < stalk ? mix3(dark, mid, 0.5) : mix3(rib, mid, 0.35), tone), ce = mul3(mix3(dark, mix3(mid, light, b), 0.35 + 0.65 * b), tone);
      const l = G.v([p[0] + side[0] * w + nrm[0] * lift, p[1] + nrm[1] * lift, p[2] + side[2] * w + nrm[2] * lift], nrm, ce, sway, fl, 1);
      const m = G.v(p, nrm, cm, sway, fl, 1);
      const r = G.v([p[0] - side[0] * w + nrm[0] * lift, p[1] + nrm[1] * lift, p[2] - side[2] * w + nrm[2] * lift], nrm, ce, sway, fl, 1);
      idx.push([l, m, r]); top = Math.max(top, p[1]);
    }
    for (let s = 0; s < segs; s++) { G.quad(idx[s][0], idx[s + 1][0], idx[s + 1][1], idx[s][1]); G.quad(idx[s][1], idx[s + 1][1], idx[s + 1][2], idx[s][2]); }
  }
  return G.build(top, 7, 'bigleaf');
}

// a fallen trunk, half sunk, mossed over
function logGeometry(rng, len, r) {
  const G = new WG(), sides = 12, segs = 14, bark = lin('#5a4a3a'), dark = lin('#231d17'), moss = lin('#4a7a2c'), rows = [];
  for (let s = 0; s <= segs; s++) {
    const t = s / segs, z = (t - 0.5) * len, rr = r * (1 - 0.22 * t) * (1 + 0.06 * Math.sin(t * 17)), row = [], yc = 0.5 * Math.sin(t * 5 + 1) * 0.4;
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * TAU, n = [Math.cos(a), Math.sin(a), 0], hh = hash(s * 13.1 + k * 5.7), up = clamp(n[1] * 0.5 + 0.5, 0, 1);
      const c = mix3(mix3(dark, bark, 0.4 + 0.6 * hh), moss, clamp(up * up * (0.6 + 0.5 * hh), 0, 0.9));
      row.push(G.v([n[0] * rr, n[1] * rr + yc, z], n, mul3(c, 0.55 + 0.45 * up)));
    }
    rows.push(row);
  }
  for (let s = 0; s < segs; s++) for (let k = 0; k < sides; k++) G.quad(rows[s][k], rows[s][k + 1], rows[s + 1][k + 1], rows[s + 1][k]);
  for (const [s, zn] of [[0, -1], [segs, 1]]) {   // the sawn-off ends: pale heartwood, rings left to the bark shader
    const t = s / segs, z = (t - 0.5) * len, rr = r * (1 - 0.22 * t) * (1 + 0.06 * Math.sin(t * 17)), yc = 0.2 * Math.sin(t * 5 + 1), c = G.v([0, yc, z], [0, 0, zn], lin('#8a7a5a')), ring = [];
    for (let k = 0; k <= sides; k++) { const a = k / sides * TAU; ring.push(G.v([Math.cos(a) * rr, Math.sin(a) * rr + yc, z], [0, 0, zn], lin('#4a3e2c'))); }
    for (let k = 0; k < sides; k++) { if (zn > 0) G.i.push(c, ring[k], ring[k + 1]); else G.i.push(c, ring[k + 1], ring[k]); }
  }
  return G.build(r * 2, len / 2, 'log');
}

// a golden salamander, nose toward +Z, one unit long (the shader gives it its walk)
function salamanderGeometry() {
  const pos = [], nor = [], part = [], idx = [];
  const ring = (z, w, h, y) => { const o = pos.length / 3; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, c = Math.cos(a), s = Math.sin(a); pos.push(c * w, y + s * h, z); nor.push(c, s, 0); part.push(z, 0); } return o; };
  const prof = [[-0.5, 0.004, 0.004, 0.02], [-0.36, 0.022, 0.02, 0.026], [-0.2, 0.04, 0.034, 0.036], [-0.06, 0.062, 0.046, 0.05], [0.1, 0.07, 0.05, 0.054], [0.24, 0.06, 0.046, 0.054], [0.32, 0.046, 0.04, 0.056], [0.4, 0.062, 0.04, 0.06], [0.47, 0.05, 0.03, 0.058], [0.5, 0.012, 0.01, 0.054]];
  let prev = -1;
  for (const [z, w, h, y] of prof) { const o = ring(z, w, h, y); if (prev >= 0) for (let k = 0; k < 8; k++) { const a = prev + k, b = prev + (k + 1) % 8, c = o + (k + 1) % 8, d = o + k; idx.push(a, b, c, a, c, d); } prev = o; }
  // four legs: upper limb out and down, a splayed foot; part.y = 1 front pair, 2 hind pair, sign = side
  for (const [z, id] of [[0.25, 1], [-0.08, 2]]) for (const sg of [1, -1]) {
    const o = pos.length / 3, x0 = sg * 0.05, x1 = sg * 0.13, x2 = sg * 0.17, w = 0.016;
    const pts = [[x0, 0.05, z - w], [x0, 0.05, z + w], [x1, 0.045, z + w * 1.2], [x1, 0.045, z - w * 1.2], [x2, 0.004, z + 0.035], [x2, 0.004, z - 0.02]];
    for (const p of pts) { pos.push(p[0], p[1], p[2]); nor.push(0, 1, 0); part.push(z, id * sg); }
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3, o + 3, o + 2, o + 4, o + 3, o + 4, o + 5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- shaders of the forest floor, the pools, the salamanders and the far wall of trees
const NOISE_GLSL = /* glsl */`
float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),f.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ return .5*n2(p)+.28*n2(p*2.07+7.1)+.14*n2(p*4.3+3.3)+.08*n2(p*8.9+1.7); }
`;
const GROUND_VERT = /* glsl */`
varying vec3 vP, vN;
#include <fog_pars_vertex>
void main(){
  vec4 wp=modelMatrix*vec4(position,1.); vP=wp.xyz; vN=normal;
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uYellow, uSunL;
uniform vec4 uPools[3]; uniform vec4 uClear; uniform vec2 uShipRot;
uniform float uTime, uDrift, uNight;
varying vec3 vP, vN;
#include <fog_pars_fragment>
${NOISE_GLSL}
float fallen(vec2 q, float dens){
  float a=0.;
  for(int k=0;k<2;k++){ vec2 g=k==0?q*2.1:mat2(.8,-.6,.6,.8)*q*3.4+17.; vec2 c=floor(g), f=fract(g)-.5; float fk=float(k)*31.;
    vec2 o=(vec2(h12(c+3.+fk),h12(c+5.+fk))-.5)*.5; float r=.13+.11*h12(c+9.+fk);
    a=max(a,smoothstep(r,r*.55,length(f-o))*step(1.-dens,h12(c+fk))); }
  return a; }
float canopy(vec2 q){ vec2 d=(q-uClear.xy)/uClear.zw; float a=atan(d.y,d.x+1e-5);
  return smoothstep(.92,1.22,length(d)+.07*sin(a*3.+1.3)+.045*sin(a*7.+.4)); }
void main(){
  vec3 p=vP, N=normalize(vN), V=normalize(cameraPosition-p);
  float can=canopy(p.xz), px=length(fwidth(p.xz)), fine=clamp(1.3-px*3.2,0.,1.), mid=clamp(1.3-px*.8,0.,1.);
  vec2 q=vec2(uShipRot.x*p.x-uShipRot.y*p.z, uShipRot.y*p.x+uShipRot.x*p.z);
  float e=length(vec2(q.x/17.,(q.y+17.)/81.));
  // pools: still black water in the hollows
  float water=0., shore=0.;
  for(int i=0;i<3;i++){ vec4 pl=uPools[i]; vec2 d=p.xz-pl.xy; float a=atan(d.y,d.x+1e-5);
    float rr=pl.z*(1.+.13*sin(a*3.+pl.x)+.08*sin(a*5.+pl.y)), dd=length(d)/max(rr,1e-3);
    water=max(water,1.-smoothstep(.95,1.,dd)); shore=max(shore,1.-smoothstep(1.,1.4,dd)); }
  // humus, leaf litter, moss; greener and lighter where the sky is open
  float n1=fbm(p.xz*.06), nb=fbm(p.xz*.31+7.), nc=n2(p.xz*1.7);
  vec3 alb=mix(vec3(.075,.062,.036),vec3(.24,.17,.07),smoothstep(.35,.7,nb)*.6);
  alb=mix(alb,mix(vec3(.07,.2,.05),vec3(.22,.4,.09),nc),smoothstep(.36,.58,n1+.3*(1.-can)));
  float lt=n2(p.xz*2.3)*.55+n2(p.xz*5.3+9.)*.45;
  alb*=mix(1.,.6+.8*lt,mid); alb=mix(alb,vec3(.3,.2,.05),smoothstep(.62,.72,lt)*.5*mid);
  alb*=mix(1.,.8+.4*n2(p.xz*6.1),fine);
  // in the open the turf goes in tussocks: dark hollows, pale sunlit crowns
  float tus=n2(p.xz*.42+3.)*.6+n2(p.xz*1.1+11.)*.4;
  alb=mix(alb,alb*mix(vec3(.5,.62,.5),vec3(1.25,1.3,.85),smoothstep(.3,.7,tus)),(1.-can)*mid*.8);
  alb=mix(alb,alb*vec3(.5,.48,.42),shore);
  // the bed of stones she is fastened into
  float st=smoothstep(1.62,1.18,e+.25*(n1-.5));
  if(st>0.){ vec2 sc=p.xz*.55, si=floor(sc), sf=fract(sc)-.5; float sd=length(sf+(vec2(h12(si),h12(si+5.))-.5)*.5), peb=smoothstep(.52,.34,sd);
    alb=mix(alb,mix(vec3(.05,.05,.045),vec3(.5,.5,.46)*(.6+.6*h12(si+9.)),mix(.6,peb,mid)),st*.9); }
  // the yellow flowers that have fallen: a few at first, a cushion by the end
  float pch=n2(p.xz*.09)*.6+n2(p.xz*.4+5.)*.4, dens=clamp((.14+uDrift*.5+(1.-can)*.2)*(.3+1.4*pch),0.,1.);
  vec2 fc=p.xz*2.1, fi=floor(fc), ff=fract(fc)-.5;
  float carpet=smoothstep(.55,.95,dens)*(.5+.5*smoothstep(.25,.7,n2(p.xz*2.7)));
  float fl=mix(dens*.42,max(fallen(p.xz,dens*.8),carpet),fine);
  // light: green dusk under the canopy with wandering flecks of sun, broad shafts in the clearing, her shadow on the stones
  vec2 sq=p.xz+uSunDir.xz*24.;
  float fleck=smoothstep(.5,.7,n2(sq*.06+vec2(uTime*.008,0.))*.6+n2(sq*.17-vec2(0.,uTime*.011))*.4);
  float dap=.5+.5*smoothstep(.28,.62,n2(p.xz*.021+vec2(uTime*.012,0.))*.65+n2(p.xz*.055+vec2(3.1,uTime*.02))*.35);
  vec2 qh=q+uSunL.xz*(20./max(uSunL.y,.2));
  float hull=1.-smoothstep(.82,1.25,length(vec2(qh.x/19.,(qh.y+17.)/86.))), under=1.-smoothstep(.7,1.12,e);
  float open=mix(dap,.1+.9*fleck,can)*(1.-.92*max(hull,under));
  vec3 amb=mix(uGndCol,uSkyCol,.5+.5*N.y)*mix(vec3(1.),vec3(.7,1.,.6),can)*(1.-.55*under);
  alb=mix(alb,uYellow*(.75+.5*h12(fi+1.)),fl*(1.-water));
  vec3 col=alb*(uSunCol*max(dot(N,uSunDir),0.)*open+amb);
  if(water>0.){
    // rings where flowers land, a slow swell, floating flowers
    vec2 rq=p.xz/6., rc=floor(rq), rf=rq-rc; vec2 nw=vec2(0.);
    for(int k=0;k<2;k++){ vec2 cc=rc+float(k)*17.; float T=3.+3.*h12(cc+2.), t=fract(uTime/T+h12(cc)); vec2 c0=vec2(h12(cc+4.),h12(cc+6.))*.5+.25, dv=rf-c0; float dl=length(dv), x=(dl-t*.42)*30.;
      nw+=dv/max(dl,1e-3)*sin(x*3.)*exp(-x*x)*(1.-t)*.5; }
    nw+=.03*vec2(n2(p.xz*.8+uTime*.2)-.5,n2(p.xz*.8+9.-uTime*.17)-.5);
    vec3 Nw=normalize(vec3(nw.x,1.,nw.y)); float fres=.03+.97*pow(1.-clamp(dot(Nw,V),0.,1.),5.);
    vec3 R=reflect(-V,Nw); float skyv=smoothstep(-.1,.5,n2(R.xz/max(R.y,.15)*.35+p.xz*.02));
    vec3 refl=mix(uSkyCol*2.6,vec3(.03,.1,.035)+uSkyCol*.35*skyv,can);
    float spec=pow(clamp(dot(reflect(-uSunDir,Nw),V),0.,1.),160.);
    vec3 wcol=mix(vec3(.012,.03,.018)*(uSkyCol.g*4.+.2),refl,fres)+uSunCol*spec*3.*open;
    float wf=step(.9-uDrift*.3,h12(fi+12.))*smoothstep(.4,.22,length(ff));
    wcol=mix(wcol,uYellow*(uSunCol*open+amb*1.4),mix(.05,wf,fine)*.9);
    col=mix(col,wcol,water);
  }
  col+=alb*uNight*vec3(.03,.045,.06);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

const SAL_VERT = /* glsl */`
attribute vec2 aPart; attribute vec4 aS;
uniform vec3 uA, uB; uniform float uR, uTime;
varying vec3 vN, vL; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float ph=aS.z*6.2832, w=.1+.06*fract(aS.z*7.3), beat=uTime*w+ph;
  float s=clamp(aS.x+.1*sin(beat),.04,.96), vel=cos(beat), turn=smoothstep(-.25,.25,vel);
  float size=aS.w, len=length(uB-uA), g=(aS.x+.1*sin(beat))*len/size*9.;
  vec3 p=position; float z=aPart.x, leg=abs(aPart.y);
  // the body bends in a travelling wave as it walks; the feet reach in turn
  p.x+=sin(g+z*5.5)*.05*(1.-smoothstep(.15,.5,z))*(1.-step(.5,leg));
  if(leg>.5){ float sd=sign(aPart.y), pair=leg>1.5?3.1416:0.; float lw=1.-clamp(p.y/.05,0.,1.); p.z+=sin(g+pair+(sd>0.?0.:3.1416))*.045*lw; p.y+=max(cos(g+pair+(sd>0.?0.:3.1416)),0.)*.012*lw; }
  vL=p; vSeed=aS.z; p.xy*=1.35;
  float yaw=(1.-turn)*3.14159, cy=cos(yaw), sy=sin(yaw);
  p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z)*size; vec3 n=vec3(cy*normal.x+sy*normal.z,normal.y,-sy*normal.x+cy*normal.z);
  vec3 d=(uB-uA)/max(len,1e-3), sv=normalize(cross(vec3(0.,1.,0.),d)), up=cross(d,sv);
  vec3 nr=up*cos(aS.y)+sv*sin(aS.y), tg=cross(nr,d);
  float rr=uR*(1.-.22*s)*(1.+.06*sin(s*17.));
  vec3 c=mix(uA,uB,s)+up*(.2*sin(s*5.+1.))+nr*(rr-.03*size);
  vec3 wp=c+tg*p.x+nr*p.y+d*p.z; vN=tg*n.x+nr*n.y+d*n.z;
  vec4 mvPosition=viewMatrix*vec4(wp,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SAL_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGold; uniform float uShade;
varying vec3 vN, vL; varying float vSeed;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  vec3 N=normalize(vN);
  float spots=smoothstep(.55,.7,n2(vec2(vL.z*16.+vSeed*40.,vL.x*22.)))*smoothstep(.02,.05,vL.y);
  vec3 alb=mix(uGold,uGold*vec3(.25,.16,.1),spots*.8);
  vec3 col=alb*(uSunCol*max(dot(N,uSunDir),0.)*uShade+uSkyCol*(.7+.5*N.y)+.2)+uGold*.07*pow(clamp(1.-abs(N.y),0.,1.),2.);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

const WALL_VERT = /* glsl */`
varying vec2 vU; varying vec3 vW;
#include <fog_pars_vertex>
void main(){ vU=uv; vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
uniform vec3 uDark, uLit; uniform float uTime;
varying vec2 vU; varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float a=vU.x*220., top=.52+.3*fbm(vec2(a*.35,1.3))+.12*n2(vec2(a*1.9,7.))+.012*sin(uTime*.6+a*3.);
  if(vU.y>top) discard;
  float crown=smoothstep(.25,1.,vU.y/max(top,1e-3)), tr=smoothstep(.62,.8,n2(vec2(a*2.6,3.)))*(1.-crown);
  vec3 col=mix(uDark,uLit,crown*(.35+.65*n2(vec2(a*1.3,vU.y*9.))))*(1.-.45*tr);
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

export default {
  id: 'galleon-in-the-flowers',
  name: 'The Galleon Among the Flowers',
  category: 'books',
  placeKind: 'wilderness',
  book: 'One Hundred Years of Solitude',
  author: 'Gabriel García Márquez, 1927 to 2014',
  media: ['air'],
  weirdness: 0.4,
  async build(ctx) {
    const noise = ctx.noise, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene(), tU = { value: 0 };
    // Every drawn thing has a stream of its own, made from the world's seed and the thing's name: none draws from
    // another, so a thing added or changed later deals nothing else anew. All of them are made here, once.
    const R = {};
    for (const name of ['visit', 'sky', 'ship', 'way', 'pools', 'trees', 'treeshapes', 'crowns', 'trunks', 'palms', 'palmshapes', 'palmset', 'under', 'wayside', 'clearingfloor',
      'fernshapes', 'fernset', 'leafset', 'lianas', 'vines', 'boughs', 'boughset', 'poollife', 'padshapes', 'padset', 'log', 'salamanders', 'rain', 'hatchfall', 'drips',
      'shafts', 'shafts2', 'mist', 'steam', 'insects', 'insects2', 'birds']) R[name] = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // ------------------------------------------------------------ this visit: the hour, the rare storm, how lush, how hazy
    const rv = R.visit, drawnHour = rv.pick(['day', 'day', 'day', 'golden', 'dawn', 'night']);
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : drawnHour, rare = !!vary.rare, lush = clamp(vary.density ?? 1, 0.7, 1.3), haze = lerp(0.8, 1.25, clamp(vary.mood ?? 0.5, 0, 1));
    // plants and flowers follow the visit's lushness up to the triangle budget (above 1 they gain slowly); insects, rain and drips follow it all the way
    const geo = Math.min(lush, 1 + (lush - 1) * 0.1), many = geo * detail, swarm = lush * detail;
    const HOURS = {
      day: { preset: 'day', el: rv.range(52, 60), zenith: '#4f93c8', mid: '#a9d0d8', horizon: '#e4eecb', fog: '#a3c57e', fogK: 0.0030, sun: 1.25, amb: 0.8, shaft: '#cfe7a0', exposure: 1.0, rain: ['#f4d21f', '#ffe45a', '#e8b910'], shadow: '#0c2a1c' },
      dawn: { preset: 'dawn', el: rv.range(22, 28), fog: '#c9b48e', fogK: 0.0034, sun: 1.2, amb: 1.25, shaft: '#ffc4a8', exposure: 1.04, rain: ['#f4d21f', '#ffd76a', '#f0b040'], shadow: '#1c2238' },
      golden: { preset: 'goldenHour', el: rv.range(19, 26), fog: '#c9a45e', fogK: 0.0030, sun: 1.25, amb: 1.25, shaft: '#ffd27a', exposure: 1.0, rain: ['#f4d21f', '#ffc83a', '#f0a020'], shadow: '#1a2416' },
      night: { preset: 'night', el: rv.range(44, 54), fog: '#26485c', fogK: 0.0030, sun: 2.8, amb: 2.5, shaft: '#b9d2e6', exposure: 1.22, rain: ['#e9dc7a', '#d8dccb', '#f4d21f'], shadow: '#060e1c' },
    };
    const HR = HOURS[hour] || HOURS.day, night = hour === 'night' ? 1 : 0;
    const sunAz = rv.range(100, 118);
    const sky = makeSky({
      rng: R.sky, preset: HR.preset, sunElevation: night ? -20 : HR.el, sunAzimuth: sunAz,
      ...(HR.zenith ? { zenith: HR.zenith, mid: HR.mid, horizon: HR.horizon } : {}),
      ...(night ? { bodyOverrides: { 0: { elevation: HR.el, azimuth: sunAz } }, key: 0, lightElevationMin: 30 } : { lightElevationMin: 18 }),
      clouds: night ? false : { coverage: rv.range(0.3, 0.5), softness: 0.5, opacity: 0.8 }, clouds2: false, quality: 0.5, renderOrder: 1000,
    });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: HR.sun, ambient: HR.amb });
    scene.add(rig.object);
    const fogCol = new THREE.Color(HR.fog);
    scene.fog = new THREE.FogExp2(fogCol, HR.fogK * (rare ? 1.12 : 1));
    const SUN = sky.lightDirection.clone().normalize();
    const sunCol = rig.sun.color.clone().multiplyScalar(rig.sun.intensity / Math.PI);
    const skyAmb = rig.hemi.color.clone().multiplyScalar(rig.hemi.intensity / Math.PI), gndAmb = rig.hemi.groundColor.clone().multiplyScalar(rig.hemi.intensity / Math.PI);
    const YELLOW = new THREE.Color(night ? '#e6d870' : '#f4d21f');
    await ctx.yield();

    // ------------------------------------------------------------ where she sits: her lean to starboard and her heading
    const rs = R.ship, lean = rs.range(0.05, 0.085), yaw = rs.range(-0.07, 0.07);
    const shipQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, lean));
    const shipM = new THREE.Matrix4().compose(new THREE.Vector3(0, 0.35 - SHIP.GROUND, 0), shipQ, new THREE.Vector3(1, 1, 1)), shipInv = shipM.clone().invert();
    const W = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(shipM);

    // ------------------------------------------------------------ the way: in under the trees from the north-east, round her port bow, through her
    const fl = FLIGHT.map((q) => W(q[0], q[1], q[2]));
    // The steaming pool lies where it lies: in the hollow north-east of her bow, some fifty metres off, by its own draw.
    // The way is then laid over it: in from the trees beyond, across the pool a little to one side of its middle, on to her bow.
    const rpl = R.pools, pools = [], poolBearing = 0.6 + yaw + rpl.range(-0.09, 0.09), poolFar = rpl.range(48, 56);
    pools.push([fl[0].x + Math.sin(poolBearing) * poolFar, fl[0].z + Math.cos(poolBearing) * poolFar, rpl.range(13, 16)]);
    const rp = R.way, back = [];
    { const turn = (p, d, a) => { const ang = a + rp.range(-0.07, 0.07) + yaw; return new THREE.Vector3(p.x + Math.sin(ang) * d, 0, p.z + Math.cos(ang) * d); };
      const across = new THREE.Vector3(Math.cos(poolBearing), 0, -Math.sin(poolBearing)), off = rp.range(1, 5);
      back.push(turn(fl[0], 24, 0.5));
      back.push(new THREE.Vector3(pools[0][0] + across.x * off, 0, pools[0][1] + across.z * off));
      back.push(turn(back[1], 27, 0.76)); back.push(turn(back[2], 26, 0.8));
      const ys = [8.8, 7.6, 8.6, 9.4]; back.forEach((q, i) => { q.y = ys[i]; }); }
    const path = makePath([...back.slice().reverse(), ...fl].map((v) => [v.x, v.y, v.z]));
    // Everything along the route is reckoned in metres from the start. The lane to keep clear is the route as it is
    // flown on this visit, a point every two metres; every scattered kind of thing is tested against it below.
    const LEN = path.length, route = [], lane = [];
    for (let m = 0; m <= LEN; m += 1) { route.push(path.posAtDist(m)); if (m % 60 === 59) await ctx.yield(); }
    for (let m = 0; m < route.length; m += 2) lane.push(route[m]);
    lane.push(path.posAtDist(LEN));
    const metresAt = (target) => { let best = 0, bd = 1e9; for (let m = 0; m < route.length; m++) { const d = route[m].distanceTo(target); if (d < bd) { bd = d; best = m; } } return best; };
    // places on the route: abeam of her stem, over her rail, in the mouth of the hatch, at the bulkhead of the great cabin
    const mBow = metresAt(fl[2]), mRail = metresAt(fl[5]), mHatch = metresAt(fl[8]), mCabin = metresAt(W(0, SHIP.WIN.y, SHIP.Z_POOP));
    await ctx.yield();

    // ------------------------------------------------------------ the galleon, fastened into her stones, leaning to starboard
    const hero = await buildHero(ctx, { density: geo, rare, sunLocal: SUN.clone().applyQuaternion(shipQ.clone().invert()), beam: night ? 0.3 : 0.15,
      lane: lane.map((v) => { const q = v.clone().applyMatrix4(shipInv); return [q.x, q.y, q.z]; }) });
    hero.object.quaternion.copy(shipQ); hero.object.position.set(0, 0.35 - SHIP.GROUND, 0);
    hero.object.updateMatrixWorld(true); scene.add(hero.object);
    hero.setLight({
      sunDir: SUN, sun: sunCol, sky: skyAmb, ground: gndAmb.clone().lerp(new THREE.Color('#3a3046').multiplyScalar(skyAmb.g + 0.05), 0.5),
      hold: skyAmb.clone().multiplyScalar(0.36).add(sunCol.clone().multiply(new THREE.Color('#cdbd8c')).multiplyScalar(hour === 'night' ? 0.32 : hour === 'dawn' ? 0.3 : hour === 'golden' ? 0.27 : 0.21)),
      portal: sunCol.clone().multiplyScalar(0.3).add(skyAmb.clone().multiplyScalar(0.6)), yellow: YELLOW, night, lantern: night,
    });
    await ctx.yield();

    // ------------------------------------------------------------ the lie of the land: the clearing, the pools, the ground
    const CLEAR = { x: 4, z: -14, rx: 86 + rs.range(-6, 8), rz: 174 + rs.range(-8, 8) };
    const canopy = (x, z) => { const dx = (x - CLEAR.x) / CLEAR.rx, dz = (z - CLEAR.z) / CLEAR.rz, a = Math.atan2(dz, dx + 1e-5); return smoothstep(0.92, 1.22, Math.hypot(dx, dz) + 0.07 * Math.sin(a * 3 + 1.3) + 0.045 * Math.sin(a * 7 + 0.4)); };
    // where the route comes out from under the trees
    let mEdge = mBow; for (let m = 0; m < route.length; m++) if (canopy(route[m].x, route[m].z) < 0.5) { mEdge = m; break; }
    // The lane test. A plant is described by the widest reach of its shape in bands of height (over all its variants);
    // it fouls the lane when a point of the route comes nearer its axis than that reach plus the margin, at that height.
    const reachOf = (geos, bands = 14) => {
      let y0 = 1e9, y1 = -1e9;
      for (const g of geos) { g.computeBoundingBox(); y0 = Math.min(y0, g.boundingBox.min.y); y1 = Math.max(y1, g.boundingBox.max.y); }
      const h = Math.max(y1 - y0, 1e-3), r = new Float32Array(bands);
      for (const g of geos) { const pa = g.getAttribute('position'); for (let i = 0; i < pa.count; i++) { const b = Math.min(bands - 1, Math.floor((pa.getY(i) - y0) / h * bands)), d = Math.hypot(pa.getX(i), pa.getZ(i)); if (d > r[b]) r[b] = d; } }
      let rmax = 0; for (let b = 0; b < bands; b++) rmax = Math.max(rmax, r[b]);
      return { y0, h, r, bands, rmax };
    };
    const fouls = (pt, reach, margin, grow = 1.25) => {
      const s = pt.s * grow, far = reach.rmax * s + margin;
      for (const q of lane) {
        const dx = q.x - pt.x, dz = q.z - pt.z, d2 = dx * dx + dz * dz; if (d2 > far * far) continue;
        const dy = (q.y - pt.y) / s - reach.y0, mg = margin / s; if (dy < -mg || dy > reach.h + mg) continue;
        const b = clamp(Math.floor(dy / reach.h * reach.bands), 0, reach.bands - 1), rr = Math.max(reach.r[b], reach.r[Math.max(b - 1, 0)], reach.r[Math.min(b + 1, reach.bands - 1)]) * s + margin;
        if (d2 < rr * rr) return true;
      }
      return false;
    };
    const laneDist = (x, y, z) => { let best = 1e18; for (const q of lane) { const dx = q.x - x, dy = q.y - y, dz = q.z - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const shipLocal = (x, z) => [cy * x - sy * z, sy * x + cy * z];
    const hullE = (x, z) => { const q = shipLocal(x, z); return Math.hypot(q[0] / 17, (q[1] + 17) / 81); };
    for (let k = 0; k < 40 && pools.length < 3; k++) {
      const a = rpl() * TAU, e = rpl.range(1.02, 1.5), x = CLEAR.x + Math.cos(a) * CLEAR.rx * e, z = CLEAR.z + Math.sin(a) * CLEAR.rz * e, r = rpl.range(9, 15);
      if (path.nearestXZ(x, z).dist < r + 16 || pools.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r + 30)) continue;
      pools.push([x, z, r]);
    }
    while (pools.length < 3) pools.push([9999, 9999, 1]);
    const poolD = (x, z) => { let best = 9; for (const pl of pools) { const dx = x - pl[0], dz = z - pl[1], a = Math.atan2(dz, dx + 1e-5), rr = pl[2] * (1 + 0.13 * Math.sin(a * 3 + pl[0]) + 0.08 * Math.sin(a * 5 + pl[1])); best = Math.min(best, Math.hypot(dx, dz) / rr); } return best; };
    const groundY = (x, z) => {
      const flat = smoothstep(0.9, 1.9, hullE(x, z)) * smoothstep(1.0, 1.9, poolD(x, z));
      return (noise.fbm2(x * 0.011, z * 0.011, 3) * 2.4 + noise.n2(x * 0.05, z * 0.05) * 0.5) * flat - 0.02;
    };
    const GX0 = -300, GX1 = 380, GZ0 = -360, GZ1 = 480, NX = 96, NZ = 118;
    const gpos = new Float32Array((NX + 1) * (NZ + 1) * 3), gidx = [];
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) { const x = lerp(GX0, GX1, i / NX), z = lerp(GZ0, GZ1, j / NZ), o = (j * (NX + 1) + i) * 3; gpos[o] = x; gpos[o + 1] = groundY(x, z); gpos[o + 2] = z; }
      if (j % 4 === 0) await ctx.yield();
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; gidx.push(a, c, b, b, c, d); }
    await ctx.yield();
    const gnor = new Float32Array(gpos.length), GDX = (GX1 - GX0) / NX, GDZ = (GZ1 - GZ0) / NZ, gh = (i, j) => gpos[(clamp(j, 0, NZ) * (NX + 1) + clamp(i, 0, NX)) * 3 + 1];
    for (let j = 0; j <= NZ; j++) {
      for (let i = 0; i <= NX; i++) { const nx = -(gh(i + 1, j) - gh(i - 1, j)) / (2 * GDX), nz = -(gh(i, j + 1) - gh(i, j - 1)) / (2 * GDZ), l = Math.hypot(nx, 1, nz), o = (j * (NX + 1) + i) * 3; gnor[o] = nx / l; gnor[o + 1] = 1 / l; gnor[o + 2] = nz / l; }
      if (j % 16 === 15) await ctx.yield();
    }
    const ggeo = new THREE.BufferGeometry(); ggeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3)); ggeo.setAttribute('normal', new THREE.BufferAttribute(gnor, 3)); ggeo.setIndex(gidx);
    await ctx.yield();
    const groundMat = new THREE.ShaderMaterial({
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uSkyCol: { value: skyAmb }, uGndCol: { value: gndAmb }, uYellow: { value: YELLOW },
        uSunL: hero.uniforms.uSunL, uPools: { value: pools.map((q) => new THREE.Vector4(q[0], q[1], q[2], 0)) }, uClear: { value: new THREE.Vector4(CLEAR.x, CLEAR.z, CLEAR.rx, CLEAR.rz) },
        uShipRot: { value: new THREE.Vector2(cy, sy) }, uTime: tU, uDrift: { value: 0 }, uNight: { value: night },
      }, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true,
    });
    const ground = new THREE.Mesh(ggeo, groundMat); ground.name = 'forest-floor'; scene.add(ground);
    await ctx.yield();

    // ------------------------------------------------------------ the forest: giants on plank buttresses, palms and tree ferns round the clearing, ferns, great leaves, lianas
    const wind = flora.makeWind({ direction: [0.6, 0.8], strength: 0.6, speed: 0.6, gustiness: 0.45 });
    const matOpts = { wind, backlight: 1.15, backlightTint: '#cfe87a', ambient: 1.5, leafAmbient: 1.45, detail: 0.5, detailScale: 0.3, sheen: 0.3 };
    await flora.prepareLeafTexture(matOpts, ctx.yield);
    const fmat = flora.windMaterial(matOpts);
    await ctx.yield();
    const GREEN = { leaf: '#2f7030', leafLight: '#7fb640', leafDark: '#0c2a1c', bark: '#8c7a62', barkDark: '#5e5040' };
    // what the canopy lets through: green dusk, with here and there a plant standing in a fleck of sun
    const dusk = night ? [0.6, 0.72, 0.8] : [0.36, 0.5, 0.34];
    const shadeAt = (x, z) => { const c = canopy(x, z), fleck = smoothstep(0.3, 0.75, noise.n2(x * 0.045 + 31, z * 0.045 - 17)); const k = 1 - c * (1 - fleck); return [lerp(dusk[0], 1.05, k), lerp(dusk[1], 1.05, k), lerp(dusk[2], 1.0, k)]; };
    const rt = R.trees, trees = [];
    for (let k = 0; k < 3200 && trees.length < 190; k++) {
      if (k % 40 === 39) await ctx.yield();
      const x = rt.range(GX0 + 60, GX1 - 110), z = rt.range(GZ0 + 30, GZ1 - 60), s = rt.range(5.4, 7.6), rot = rt() * TAU, pick = rt.int(0, 5);
      const e = Math.hypot((x - CLEAR.x) / CLEAR.rx, (z - CLEAR.z) / CLEAR.rz);
      if (canopy(x, z) < 0.6 || e > 2.0 || poolD(x, z) < 1.3) continue;
      const np = path.nearestXZ(x, z); if (np.dist < 22) continue;
      let ok = true; for (const t of trees) if (Math.hypot(t.x - x, t.z - z) < 27) { ok = false; break; }
      if (!ok) continue;
      trees.push({ x, y: groundY(x, z), z, s, rot, d: np.dist, u: np.u, v: pick, e });
    }
    const tg = R.treeshapes;
    const crowns = [flora.oakGeometry({ rng: tg, detail: 1, height: 13, fullness: 1.15, ...GREEN })];
    await ctx.yield();
    crowns.push(flora.oakGeometry({ rng: tg, detail: 1, height: 13.5, fullness: 1.3, ...GREEN, leaf: '#2a6a34' }));
    await ctx.yield();
    crowns.push(flora.pineGeometry({ rng: tg, detail: 1, height: 15, ...GREEN, leaf: '#2c6a2a' }));
    await ctx.yield();
    const crownsFar = [flora.oakGeometry({ rng: tg, detail: 0, height: 13, fullness: 1.2, ...GREEN })];
    await ctx.yield();
    crownsFar.push(flora.oakGeometry({ rng: tg, detail: 0, height: 13.5, fullness: 1.3, ...GREEN, leaf: '#2a6a34' }));
    await ctx.yield();
    crownsFar.push(flora.pineGeometry({ rng: tg, detail: 0, height: 15, ...GREEN }));
    await ctx.yield();
    const trunks = [trunkGeometry(tg)]; await ctx.yield(); trunks.push(trunkGeometry(tg)); await ctx.yield(); trunks.push(trunkGeometry(tg));
    await ctx.yield();
    // the lane test for the giants: crown and buttressed foot, on this visit's own route
    { const crownReach = reachOf([...crowns, ...crownsFar]), footReach = reachOf(trunks);
      const standing = trees.filter((t) => !fouls(t, crownReach, 3) && !fouls({ x: t.x, y: t.y - 0.3, z: t.z, s: t.s / 6.5 * 1.05 }, footReach, 3));
      trees.length = 0; for (const t of standing) trees.push(t); }
    await ctx.yield();
    const floraSets = [];
    floraSets.push(flora.makeScatter({ rng: R.crowns, points: trees, variants: crowns, farVariants: crownsFar, farDistance: 78, material: fmat, sink: 0.01, tilt: 0.03, stretch: 0.15, tint: 0.14, hue: 0.04 }));
    await ctx.yield();
    const footed = trees.filter((t) => t.d < 115 || t.e < 1.27).map((t) => ({ ...t, s: t.s / 6.5 * 1.05, y: t.y - 0.3 }));
    floraSets.push(flora.makeScatter({ rng: R.trunks, points: footed, variants: trunks, material: fmat, sink: 0, tilt: 0.02, stretch: 0.1, tint: 0.12, hue: 0.03, shade: (x, z) => { const s = shadeAt(x, z); return [0.42 + 0.58 * s[0], 0.42 + 0.58 * s[1], 0.42 + 0.58 * s[2]]; } }));
    await ctx.yield();

    // palms and tree ferns stand round her in the open, thickest toward the edge of the trees
    const rpm = R.palms, palms = [], inClear = (x, z) => Math.hypot((x - CLEAR.x) / CLEAR.rx, (z - CLEAR.z) / CLEAR.rz);
    for (let k = 0; k < 2400 && palms.length < Math.round(86 * many); k++) {
      if (k % 40 === 39) await ctx.yield();
      const x = rpm.range(CLEAR.x - CLEAR.rx * 1.2, CLEAR.x + CLEAR.rx * 1.2), z = rpm.range(CLEAR.z - CLEAR.rz * 1.15, CLEAR.z + CLEAR.rz * 1.15), kind = rpm() < 0.42 ? 0 : 1, sv = rpm(), rot = rpm() * TAU, keep = rpm();
      const e = inClear(x, z), he = hullE(x, z);
      if (e > 1.16 || he < 1.75 || poolD(x, z) < 1.25 || keep > 0.25 + 0.75 * smoothstep(0.35, 0.95, e)) continue;
      const np = path.nearestXZ(x, z); if (np.dist < (kind === 0 ? 25 : 15)) continue;
      let ok = true; for (const t of palms) if (Math.hypot(t.x - x, t.z - z) < 13) { ok = false; break; }
      if (!ok) continue;
      palms.push({ x, y: groundY(x, z), z, s: kind === 0 ? lerp(2.5, 3.7, sv) : lerp(1.5, 2.3, sv), rot, d: np.dist, u: np.u, v: kind * 2 + (sv > 0.5 ? 1 : 0) });
    }
    await ctx.yield();
    const pg = R.palmshapes;
    const PALM_A = { coconuts: false, ...GREEN, leaf: '#3f8a34', leafLight: '#a9d45a' }, PALM_B = { coconuts: false, ...GREEN, leaf: '#2f8038', leafLight: '#8fc850', bark: '#5c4c3a', barkDark: '#3c3228' };
    const palmV = [], palmFar = [];
    for (const o of [{ height: 12, fronds: 12, ...PALM_A }, { height: 13, fronds: 13, curve: 0.5, ...PALM_A }, { height: 9, fronds: 16, curve: 0.08, ...PALM_B }, { height: 10, fronds: 15, curve: 0.2, ...PALM_B }]) { palmV.push(flora.palmGeometry({ rng: pg, ...o })); await ctx.yield(); }
    for (const o of [{ height: 12, ...PALM_A }, { height: 13, curve: 0.5, ...PALM_A }, { height: 9, curve: 0.08, ...PALM_B }, { height: 10, curve: 0.2, ...PALM_B }]) { palmFar.push(flora.palmGeometry({ rng: pg, detail: 0, ...o })); await ctx.yield(); }
    { const reach = reachOf([...palmV, ...palmFar]), standing = palms.filter((t) => !fouls(t, reach, 2.5)); palms.length = 0; for (const t of standing) palms.push(t); }
    await ctx.yield();
    floraSets.push(flora.makeScatter({ rng: R.palmset, points: palms, variants: palmV, farVariants: palmFar, farDistance: 62, material: fmat, sink: 0.01, tilt: 0.05, stretch: 0.2, tint: 0.14, hue: 0.04, shade: shadeAt }));
    await ctx.yield();

    // the lowest storey: giant ferns and great leaves, close on both sides of the way and all round the ship
    const ru = R.under, rw = R.wayside, ferns = [], leaves = [], entry = path.posAtDist(0);
    for (let k = 0; k < 9000 && ferns.length + leaves.length < Math.round(560 * many); k++) {
      if (k % 40 === 39) await ctx.yield();
      const x = ru.range(-150, 230), z = ru.range(-250, 300), sv = ru(), rot = ru() * TAU, kind = ru(), keep = ru();
      const np = path.nearestXZ(x, z), he = hullE(x, z), c = canopy(x, z);
      const nearWay = np.u * LEN < mBow ? 1 - smoothstep(30, 95, np.dist) : 0, nearShip = 1 - smoothstep(1.9, 3.4, he);
      if (keep > Math.max(nearWay, nearShip * 0.8) || he < 1.5 || poolD(x, z) < 1.12 || Math.hypot(x - entry.x, z - entry.z) < 17) continue;
      const big = kind < 0.2 + 0.25 * c, s = big ? lerp(0.75, 1.3, sv) : lerp(4.2, 8.8, sv) * (0.75 + 0.25 * smoothstep(12, 40, np.dist));
      if (np.dist < (big ? 15 + 5 * sv : 9.5 + s * 0.85)) continue;
      const list = big ? leaves : ferns; list.push({ x, y: groundY(x, z) - 0.1, z, s, rot, d: np.dist, u: np.u, v: ru.int(0, 2) });
    }
    // small ferns beside the way, from the start as far as her bow
    for (let k = 0; k < 2600 && ferns.length < Math.round(640 * many); k++) {
      if (k % 40 === 39) await ctx.yield();
      const mm = rw.range(0, mBow), side = rw.chance(0.5) ? 1 : -1, off = rw.range(6.5, 38), sv = rw(), rot = rw() * TAU;
      const c = path.posAtDist(mm), t = path.tangentAtDist(mm), x = c.x - t.z * side * off, z = c.z + t.x * side * off, s = lerp(1.6, 3.4, sv) * (0.7 + 0.3 * smoothstep(8, 30, off));
      const np = path.nearestXZ(x, z);
      if (np.dist < 6 + s * 0.9 || hullE(x, z) < 1.45 || poolD(x, z) < 1.1 || Math.hypot(x - entry.x, z - entry.z) < 15) continue;
      ferns.push({ x, y: groundY(x, z) - 0.05, z, s, rot, d: np.dist, u: np.u, v: rw.int(0, 2) });
    }
    // the floor of the clearing: low ferns in clumps, so that the open ground round her is never bare
    const rc = R.clearingfloor;
    for (let k = 0, n0 = ferns.length; k < 400 && ferns.length - n0 < Math.round(300 * many); k++) {
      if (k % 60 === 59) await ctx.yield();
      const a = rc() * TAU, r = Math.sqrt(rc()) * 1.05, cx = CLEAR.x + Math.cos(a) * CLEAR.rx * r, cz = CLEAR.z + Math.sin(a) * CLEAR.rz * r, n = rc.int(3, 6), big = rc.range(1.5, 3.3);
      for (let j = 0; j < n; j++) {
        const b2 = rc() * TAU, d = rc.range(0.8, 7.5), sv = rc(), rot = rc() * TAU, x = cx + Math.cos(b2) * d, z = cz + Math.sin(b2) * d, s = big * lerp(0.55, 1, sv);
        const np = path.nearestXZ(x, z);
        if (np.dist < 5.5 + s * 0.9 || hullE(x, z) < 1.5 || poolD(x, z) < 1.1) continue;
        ferns.push({ x, y: groundY(x, z) - 0.05, z, s, rot, d: np.dist, u: np.u, v: (j + k) % 3 });
      }
    }
    const fg = R.fernshapes;
    const fernV = [flora.fernGeometry({ rng: fg, size: 1.2, fronds: 9, detail: 1, leaf: '#3c8a3a', leafLight: '#a8d060', leafDark: '#12401e' }), flora.fernGeometry({ rng: fg, size: 1.35, fronds: 10, detail: 1, leaf: '#2f7a34', leafLight: '#8fc850', leafDark: '#0c2a1c' }), flora.fernGeometry({ rng: fg, size: 1.0, fronds: 8, detail: 2, leaf: '#4a9a3a', leafLight: '#bfe070', leafDark: '#1c4a2a' })];
    await ctx.yield();
    const leafV = [bigLeafGeometry(fg), bigLeafGeometry(fg, { mid: '#2a7038', light: '#6fb04a' }), bigLeafGeometry(fg, { size: 0.8, leaves: 7, dark: '#123c16', mid: '#3a8a2c', light: '#a2cf58' })];
    await ctx.yield();
    { const reach = reachOf(fernV), kept = []; for (let i = 0; i < ferns.length; i++) { if (!fouls(ferns[i], reach, 2.5)) kept.push(ferns[i]); if (i % 200 === 199) await ctx.yield(); } ferns.length = 0; for (const t of kept) ferns.push(t); }
    await ctx.yield();
    { const reach = reachOf(leafV), kept = leaves.filter((t) => !fouls(t, reach, 2.5)); leaves.length = 0; for (const t of kept) leaves.push(t); }
    await ctx.yield();
    floraSets.push(flora.makeScatter({ rng: R.fernset, points: ferns, variants: fernV, material: fmat, sink: 0.02, tilt: 0.08, stretch: 0.25, tint: 0.2, hue: 0.06, shade: shadeAt, chunks: 2 }));
    await ctx.yield();
    floraSets.push(flora.makeScatter({ rng: R.leafset, points: leaves, variants: leafV, material: fmat, sink: 0.01, tilt: 0.06, stretch: 0.2, tint: 0.2, hue: 0.05, shade: shadeAt }));
    await ctx.yield();

    // lianas: slung from giant to giant high over the way, and hanging down from the crowns
    const rl = R.lianas, spans = [], near = trees.filter((t) => t.d < 110 && t.u * LEN < mBow);
    for (let i = 0; i < near.length && spans.length < 13; i++) for (let j = i + 1; j < near.length && spans.length < 13; j++) {
      const a = near[i], b = near[j], d = Math.hypot(a.x - b.x, a.z - b.z); if (d < 30 || d > 62) continue;
      if (rl() < 0.55) spans.push([[a.x, rl.range(34, 46), a.z], [b.x, rl.range(34, 46), b.z]]);
    }
    // a liana with all that hangs from it keeps off the lane: its sagging line is walked in sixteen steps and tested
    const lianaClear = (sp, sag) => { const [a, b2] = sp, L = Math.hypot(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]); for (let i = 0; i <= 16; i++) { const t = i / 16, x = lerp(a[0], b2[0], t), z = lerp(a[2], b2[2], t), y = lerp(a[1], b2[1], t) - sag * L * 4 * t * (1 - t); for (const q of lane) { const dx = q.x - x, dz = q.z - z; if (dx * dx + dz * dz < 36 && q.y > y - 12 && q.y < y + 4) return false; } } return true; };
    { const kept = spans.filter((sp) => lianaClear(sp, 0.15)); spans.length = 0; for (const sp of kept) spans.push(sp); }
    const slung = spans.length;
    for (const t of near) for (let k = 0; k < 2; k++) {
      const a = rl() * TAU, top = rl.range(34, 44), r1 = rl.range(9, 17), keep = rl();
      const x = t.x + Math.cos(a) * r1, z = t.z + Math.sin(a) * r1;
      if (keep < 0.3 || path.nearestXZ(x, z).dist < 15 || poolD(x, z) < 1.1) continue;
      spans.push([[t.x + Math.cos(a) * 3.2, top, t.z + Math.sin(a) * 3.2], [x, groundY(x, z) + 0.3, z]]);
    }
    { const kept = spans.filter((sp, i) => i < slung || lianaClear(sp, 0.035)); spans.length = 0; for (const sp of kept) spans.push(sp); }
    await ctx.yield();
    if (spans.length) {
      const vines = flora.makeVines({ rng: R.vines, material: fmat, spans: spans.slice(0, slung), sag: 0.15, thickness: 0.34, leaves: 0.9, hangers: 1, detail: 0, ...GREEN, stem: '#6e5c42' });
      scene.add(vines.object);
      await ctx.yield();
      if (spans.length > slung) { const hang = flora.makeVines({ rng: R.vines, material: fmat, spans: spans.slice(slung), sag: 0.035, thickness: 0.3, leaves: 0.5, hangers: 0.5, detail: 0, ...GREEN, stem: '#6e5c42' }); scene.add(hang.object); }
    }
    const rmk = R.boughs, boughs = [];
    for (const t of near) { const a = rmk() * TAU, yb = rmk.range(20, 33), s = rmk.range(1.0, 1.5), keep = rmk(); if (keep < 0.45 && boughs.length < 7) boughs.push({ x: t.x + Math.cos(a) * 5, y: yb, z: t.z + Math.sin(a) * 5, s, rot: a, d: t.d, u: t.u, v: 0 }); }
    const shakeWind = flora.makeWind({ direction: [0.3, -0.9], strength: 0.6, speed: 2.4, gustiness: 1 }), shakeMat = flora.windMaterial({ ...matOpts, wind: shakeWind, map: fmat.map });
    const shakeT = rmk.range(7, 11), shakePh = rmk() * TAU;
    { const reach = reachOf([crownsFar[0]]), kept = boughs.filter((t) => !fouls(t, reach, 4, 1.4)); boughs.length = 0; for (const t of kept) boughs.push(t); }
    if (boughs.length) { const set = flora.makeScatter({ rng: R.boughset, points: boughs, variants: [crownsFar[0]], material: shakeMat, sink: 0.3, tilt: 0.3, stretch: 0.2, tint: 0.15, hue: 0.04, shade: shadeAt }); scene.add(set.object); }
    for (const f of floraSets) scene.add(f.object);
    await ctx.yield();

    // ------------------------------------------------------------ the pool under the way: red lilies, a fallen trunk, golden salamanders
    const rq = R.poollife, pads = [], lilies = [], RED = lin('#b3122a');
    for (const pl of pools) {
      if (pl[0] > 9000) continue;
      for (let k = 0; k < Math.round(24 * many); k++) {
        const a = rq() * TAU, r = pl[2] * Math.sqrt(rq()) * 0.9, x = pl[0] + Math.cos(a) * r, z = pl[1] + Math.sin(a) * r, s = rq.range(2.2, 4.2), fl = rq() < 0.42;
        if (poolD(x, z) < 0.86) pads.push({ x, y: 0.06, z, s, rot: a * 3, d: 20, u: 0, v: fl ? 2 : k % 2 });
      }
      for (let k = 0; k < Math.round(34 * many); k++) {
        const a = rq() * TAU, r = pl[2] * rq.range(1.0, 1.5), x = pl[0] + Math.cos(a) * r, z = pl[1] + Math.sin(a) * r, s = rq.range(0.6, 1.05), g = rq.range(1.2, 1.9), d = poolD(x, z);
        if (d < 1.03 || d > 1.5 || path.nearestXZ(x, z).dist < 9) continue;
        const sh = shadeAt(x, z); lilies.push({ x, y: groundY(x, z), z, s, type: 3, color: [RED[0] * g * (0.5 + 0.5 * sh[0]), RED[1] * g * (0.5 + 0.5 * sh[1]), RED[2] * g * (0.5 + 0.5 * sh[2])] });
      }
    }
    await ctx.yield();
    const lg = R.padshapes;
    const padV = [flora.lilyPadGeometry({ rng: lg, size: 0.8, pad: '#2f6a34', padLight: '#7ab048' }), flora.lilyPadGeometry({ rng: lg, size: 0.65, pad: '#3a7a30', padLight: '#8fbd50' }),
      flora.lilyPadGeometry({ rng: lg, size: 0.75, flower: true, pad: '#2f6a34', padLight: '#7ab048', petal: '#b3122a', petalTip: '#e02c3c', heart: '#f4d21f' })];
    { const reach = reachOf(padV), kept = pads.filter((t) => !fouls(t, reach, 2.5)); pads.length = 0; for (const t of kept) pads.push(t); }
    if (pads.length) { const set = flora.makeScatter({ rng: R.padset, points: pads, variants: padV, material: fmat, sink: 0, tilt: 0, stretch: 0, lift: 0.02, tint: 0.12, hue: 0.03, shade: (x, z) => { const s = shadeAt(x, z); return [0.4 + 0.6 * s[0], 0.4 + 0.6 * s[1], 0.4 + 0.6 * s[2]]; } }); floraSets.push(set); scene.add(set.object); }
    await ctx.yield();
    // a red lily stands up to 9.5 m at full size, its flowers reaching 1.6 m from the stem
    { const kept = lilies.filter((t) => { for (const q of lane) { const dx = q.x - t.x, dz = q.z - t.z, r = 1.6 * t.s + 2.5; if (dx * dx + dz * dz < r * r && q.y < t.y + 9.5 * t.s + 2.5) return false; } return true; }); lilies.length = 0; for (const t of kept) lilies.push(t); }
    if (lilies.length) { const redLilies = hero.kit.flowers(lilies); redLilies.name = 'red-lilies'; scene.add(redLilies); }
    await ctx.yield();
    // The fallen trunk lies as it fell: its middle on the bank of the pool at a bearing of its own, its length slanting
    // across the bank toward the water. It is tested against the lane like everything else and, if it ever stood too
    // near, would lie deeper in the pool.
    const logLen = 36, logR = 1.7, P0 = pools[0], rlog = R.log;
    const bankA = rlog() * TAU, bankR = P0[2] * rlog.range(0.55, 0.9), la = bankA + Math.PI + (rlog.chance(0.5) ? 1 : -1) * rlog.range(0.35, 1.0), ld = new THREE.Vector3(Math.sin(la), 0, Math.cos(la));
    const lc = new THREE.Vector3(P0[0] + Math.sin(bankA) * bankR, 1.1, P0[1] + Math.cos(bankA) * bankR);
    { const logClear = () => { for (let i = -8; i <= 8; i++) if (laneDist(lc.x + ld.x * logLen * i / 16, lc.y, lc.z + ld.z * logLen * i / 16) < logR * 1.35 + 3) return false; return true; };
      for (let k = 0; k < 6 && !logClear(); k++) lc.y -= 0.5; }
    const logMesh = new THREE.Mesh(logGeometry(rlog, logLen, logR), fmat); logMesh.position.copy(lc); logMesh.rotation.y = la; logMesh.name = 'fallen-trunk'; scene.add(logMesh);
    const rsal = R.salamanders, nSal = rsal.int(6, 8), salS = new Float32Array(nSal * 4), salGeo = salamanderGeometry();
    for (let i = 0; i < nSal; i++) { salS[i * 4] = 0.14 + 0.72 * (i + rsal()) / nSal; salS[i * 4 + 1] = rsal.range(-0.5, 0.5); salS[i * 4 + 2] = rsal(); salS[i * 4 + 3] = rsal.range(4.2, 6.2); }
    salGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(salS, 4));
    const salShade = shadeAt(lc.x, lc.z);
    const salMat = new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uA: { value: lc.clone().addScaledVector(ld, -logLen / 2) }, uB: { value: lc.clone().addScaledVector(ld, logLen / 2) }, uR: { value: logR }, uTime: tU,
        uSunDir: { value: SUN }, uSunCol: { value: sunCol }, uSkyCol: { value: skyAmb }, uGold: { value: new THREE.Color('#e2a93a').multiplyScalar(1.5) }, uShade: { value: 0.3 + 0.7 * salShade[1] } },
      vertexShader: SAL_VERT, fragmentShader: SAL_FRAG, fog: true, side: THREE.DoubleSide });
    const salamanders = new THREE.InstancedMesh(salGeo, salMat, nSal); salamanders.frustumCulled = false; salamanders.name = 'salamanders'; scene.add(salamanders);
    await ctx.yield();

    // the far wall of the forest, so that the trees never end
    const leafLit = new THREE.Color('#2f6a2c'), leafDark = new THREE.Color('#0c2a1c');
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(335, 335, 130, 96, 1, true), new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: tU, uDark: { value: leafDark.clone().multiply(skyAmb).multiplyScalar(2.2) }, uLit: { value: leafLit.clone().multiply(sunCol.clone().multiplyScalar(0.7).add(skyAmb)) } },
      vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.BackSide }));
    wall.position.set(40, 62, 60); wall.name = 'forest-wall'; scene.add(wall);

    // ------------------------------------------------------------ air: the yellow rain, shafts, mist round her keel, steam, drips
    const sets = fx.fxGroup(); scene.add(sets.object);
    const rainN = Math.round((rare ? 5600 : 1900) * swarm);
    const rain = sets.add(fx.makeParticles({ rng: R.rain, preset: 'petals', time: tU, count: rainN, box: [58, 42, 58], velocity: [0.25, rare ? -2.1 : -1.5, 0.15], velocityRandom: [0.35, 0.45, 0.35], turbulence: [0.7, 0.2, 0.6],
      size: rare ? [0.2, 0.44] : [0.17, 0.36], colors: HR.rain, intensity: night ? 0.75 : 0.95, lightDir: [SUN.x, SUN.y, SUN.z] }));
    await ctx.yield();
    const hatchAt = W(0, 23, -12);
    const hatchFall = sets.add(fx.makeParticles({ rng: R.hatchfall, preset: 'petals', time: tU, count: Math.round((rare ? 520 : 240) * swarm), follow: false, center: [hatchAt.x, hatchAt.y, hatchAt.z], box: [14, 32, 22],
      velocity: [0.05, -1.4, 0.05], velocityRandom: [0.2, 0.4, 0.2], turbulence: [0.4, 0.15, 0.4], size: [0.17, 0.34], colors: HR.rain, intensity: 1.0, lightDir: [SUN.x, SUN.y, SUN.z] }));
    await ctx.yield();
    const drips = sets.add(fx.makeParticles({ rng: R.drips, preset: 'rain', time: tU, count: Math.round(260 * swarm), box: [54, 36, 54], velocity: [0, -11, 0], velocityRandom: [0.1, 3, 0.1], size: [0.035, 0.06], stretch: 0.045,
      colors: ['#dff2d0', '#ffffff', '#cfe7a0'], intensity: 1.2, opacity: 0.6 }));
    await ctx.yield();
    const shaftCol = new THREE.Color(HR.shaft), down = [-SUN.x, -SUN.y, -SUN.z];
    const wood = new THREE.Vector3(pools[0][0], 7.6, pools[0][1]), shipMid = W(0, 30, 6);
    sets.add(fx.makeGodRays({ rng: R.shafts, time: tU, position: [wood.x + SUN.x * 78, wood.y + SUN.y * 78, wood.z + SUN.z * 78], direction: down, radius: 62, count: 18, length: 118, width: [1.4, 5.5], color: shaftCol, intensity: (night ? 0.16 : 0.34) * haze, falloff: 1.1, speed: 0.5, fogAmount: 0.4 }));
    await ctx.yield();
    sets.add(fx.makeGodRays({ rng: R.shafts2, time: tU, position: [shipMid.x + SUN.x * 190, shipMid.y + SUN.y * 190, shipMid.z + SUN.z * 190], direction: down, radius: 96, count: 18, length: 250, width: [5, 17], color: shaftCol, intensity: (night ? 0.16 : 0.3) * haze, falloff: 1.0, speed: 0.4, fogAmount: 0.4 }));
    await ctx.yield();
    const rm = R.mist, mistPos = [];
    for (let k = 0; k < 22; k++) { const a = rm() * TAU, e = rm.range(1.05, 1.9), q = [Math.cos(a) * 17 * e, Math.sin(a) * 81 * e - 17]; mistPos.push([cy * q[0] + sy * q[1], rm.range(2.5, 7), -sy * q[0] + cy * q[1]]); }
    const mistCol = fogCol.clone().lerp(new THREE.Color('#ffffff'), night ? 0.15 : 0.45);
    const mist = sets.add(fx.makeMist({ rng: rm, time: tU, positions: mistPos, count: mistPos.length, size: [26, 48], color: mistCol, opacity: (night ? 0.1 : 0.15) * haze, drift: [0.35, 0, 0.2] }));
    for (const pl of pools) {
      if (pl[0] > 9000) continue;
      sets.add(fx.makeSmokeColumn({ rng: R.steam, time: tU, position: [pl[0], 0.4, pl[1]], height: 20, radius: [pl[2] * 0.5, pl[2] * 1.0], size: [9, 22], count: 30, color: mistCol.clone().multiplyScalar(0.9), colorTop: mistCol, shadowColor: mistCol.clone().multiplyScalar(0.55),
        ambient: mistCol.clone().multiplyScalar(0.3), opacity: 0.085, rate: 0.03, wind: [0.25, 0, 0.15], bend: 0.3, sunDir: [SUN.x, SUN.y, SUN.z], sunColor: sunCol }));
    }
    await ctx.yield();

    // ------------------------------------------------------------ creatures: luminous insects under the trees, macaws crossing far off
    const DUR = 46;
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    fauna.add(F.makeFireflies({ rng: R.insects, path, uFrom: 0, uTo: mBow / LEN, count: Math.round((night ? 950 : 640) * swarm), clear: 2.5, spread: 44, lift: [-6.5, 15],
      color: '#ffd45a', color2: '#d8f07a', mix: 0.35, size: 0.46, blink: 0.45, sync: 0.15 }));
    await ctx.yield();
    if (night) fauna.add(F.makeFireflies({ rng: R.insects2, path, uFrom: mEdge / LEN, uTo: mHatch / LEN, count: Math.round(420 * swarm), clear: 4, spread: 60, lift: [-8, 30], color: '#ffe07a', color2: '#bfe8ff', mix: 0.3, size: 0.5, blink: 0.4 }));
    await ctx.yield();
    const rb = R.birds;
    fauna.add(F.makeFlock({ rng: rb, species: 'parrots', count: rb.int(2, 3), size: 4.2, speed: 15, spread: [10, 4, 14],
      cross: { path, u: lerp(mEdge, mRail, rb()) / LEN, lead: rb.range(95, 130), height: rb.range(34, 62), span: 460, angle: rb.range(55, 80), side: rb.chance(0.5) ? 1 : -1, duration: DUR },
      body: '#c8201a', belly: '#e0261c', wingC: '#1f4fb0', tailC: '#d02a1a', tip: '#f4d21f', head: '#d0241c' }));
    await ctx.yield();

    // ------------------------------------------------------------ where the eye is drawn
    // Each pull lasts between two places of the world: it begins where the thing before it has gone by and ends where
    // the route is abeam of the thing itself (the nearest metre of route to it), so no thing is looked at over the shoulder.
    const U = (m) => clamp(m / LEN, 0, 1);
    const logAt = new THREE.Vector3(lc.x, 3.2, lc.z), anchorAt = hero.anchors.anchor.clone().applyMatrix4(hero.object.matrixWorld), portsAt = W(19, 25, 32);
    const mLog = metresAt(logAt), mSprit = metresAt(hero.anchors.sprit.clone().applyMatrix4(hero.object.matrixWorld)), mAnchor = metresAt(anchorAt), mPorts = metresAt(portsAt);
    const pois = [
      // the trunk with its salamanders: from the way in until we are abeam of it
      { at: logAt, from: 0, to: U(mLog), weight: 0.42, fade: 0.3 },
      // her masts, standing over the trees and then over us: from the trunk until we pass the end of her bowsprit
      { at: W(2, 74, 12), from: U(mLog), to: U(Math.max(mSprit, mLog)), weight: 0.5, fade: 0.3 },
      // the grown-over anchor on her port bow: from the end of her bowsprit until we are abeam of it
      { at: anchorAt, from: U(Math.max(mSprit, mLog)), to: U(mAnchor), weight: 0.5, fade: 0.3 },
      // the gunports with their ferns: from the anchor until we are abeam of them
      { at: portsAt, from: U(mAnchor), to: U(mPorts), weight: 0.42, fade: 0.3 },
      // the open hatch: from her rail until we are in its mouth
      { at: W(0, 27, -12), from: U(mRail), to: U(mHatch), weight: 0.5, fade: 0.3 },
    ];
    // What the air does at each metre of the route, read off the route itself: how open the sky is overhead (the rain
    // is thin under the trees and steady in the clearing) and how far below her decks the route runs (there only what
    // the hatches let in still falls).
    const openAt = new Float32Array(route.length), belowAt = new Float32Array(route.length);
    { const q = new THREE.Vector3(); for (let m = 0; m < route.length; m++) { openAt[m] = 1 - canopy(route[m].x, route[m].z); q.copy(route[m]).applyMatrix4(shipInv); belowAt[m] = hero.inHull(q.x, q.z) ? 1 - smoothstep(SHIP.D_WAIST - 5, SHIP.D_WAIST + 1, q.y) : 0; } }
    const along = (tab, m) => { const i = clamp(Math.floor(m), 0, tab.length - 2); return lerp(tab[i], tab[i + 1], clamp(m - i, 0, 1)); };
    // the fallen flowers lie thicker the further we have come: from the start to the stern window
    const drift = (m) => (rare ? 0.72 + 0.28 * m / LEN : 0.1 + 0.8 * smoothstep(0, LEN, m));
    // the portal's ring stands upright while her window leans with her: the ring is tried in the window's bay on this
    // visit's lean, a point every fifteen degrees round it, and made smaller until it stands inside with a hand's room
    const endP = path.posAtDist(LEN), endT = path.tangentAtDist(LEN), ringR = new THREE.Vector3(-endT.z, 0, endT.x).normalize();
    const ringFits = (k) => {
      const w = SHIP.WIN.w * k * 0.5, h = SHIP.WIN.h * k * 0.5, q = new THREE.Vector3();
      for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24, ca = Math.cos(a), sa = Math.sin(a), y = sa >= 0 ? (h - w) + w * sa : -h * Math.min(1, -sa * 1.6), x = sa >= 0 ? w * ca : w * Math.sign(ca) * Math.min(1, Math.abs(ca) * 1.6);
        q.copy(endP).addScaledVector(ringR, x); q.y += y; q.applyMatrix4(shipInv);
        if (!hero.inBay(q.x, q.y, 0.2)) return false;
      }
      return true;
    };
    let ringK = 1; while (ringK > 0.7 && !ringFits(ringK)) ringK -= 0.02;
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      title: rare ? 'The Galleon Among the Flowers, in the Yellow Storm' : night ? 'The Galleon Among the Flowers, by Moonlight' : 'The Galleon Among the Flowers',
      // unhurried from the rail on, over the deck and down the nave, where there is most to look at; back to full pace through the great cabin
      pace: (u) => 1.1 - 0.3 * smoothstep(mRail, mHatch, u * LEN) * (1 - smoothstep(mCabin, LEN, u * LEN)),
      camera: { fov: 62, near: 0.3, far: 1700, lookAhead: 17, sway: 0.7, bank: 0.5 },
      pois,
      portal: { shape: 'arch', width: SHIP.WIN.w * ringK, height: SHIP.WIN.h * ringK, color: night ? '#dfe6c0' : '#fff0b0', glow: 1, revealDistance: 210 },
      post: {
        exposure: HR.exposure, bloom: { strength: 0.42, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#fbfff4', shadowTint: HR.shadow, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        const flown = clamp(u, 0, 1) * LEN;
        hero.setFlown(flown); hero.update(dt, time, camera);
        for (const f of floraSets) f.update(dt, time, camera);
        shakeWind.uniforms.uFloraWind.value.z = 0.5 + 4.5 * smoothstep(0.55, 0.95, Math.sin(time * TAU / shakeT + shakePh)); shakeWind.update(time);
        const k = drift(flown); groundMat.uniforms.uDrift.value = k; hero.setDrift(k);
        // the rain: a few flowers under the trees, steady in the open, only what the hatches let in below her decks
        const open = along(openAt, flown), below = along(belowAt, flown);
        rain.setOpacity((rare ? 1 : 0.45 + 0.55 * open) * (1 - 0.8 * below));
        drips.setOpacity((1 - open) * 0.9);
        sets.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
      },
      dispose() { hero.dispose?.(); sky.dispose?.(); },
    };
  },
};
