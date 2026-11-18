// THE SILENT ENGINE
// An airless canyon on a dead world. A funnel of 60 m standing slabs opens toward a glare at the far
// end; the canyon mouth reveals the Engine (src/parts/silent-engine.js) hanging in a terraced pit.
// World space: canyon floor y = 0, canyon axis = +Z (the camera flies toward -Z), the star at
// (0, STAR_Y, 0). Everything is lit analytically from the star: there are no scene lights.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/silent-engine.js';

const TAU = Math.PI * 2;
const PAL = ['#020206', '#1b1c2a', '#5d5a66', '#d9d2c4', '#b08a4a', '#ffd27a', '#7af0ff'];
const STAR_Y = 30, PIT_R = 700, CAN_W = 150, LVL_H = 80, LVL_STEP = 12, Z_END = 1400, MOUTH_Z = 700;

// ---------- geometry writer: quads with colour, uv (metres), mask and two extra floats ----------
// mask aM: 0 wall stone, 1 glyph strip (uv.x cells, uv.y 0..1), 2 floor, 3 conduit, 4 light line
// aE: stone -> (key light multiplier, extra cold fill); glyph / line -> (ignite u, seed); conduit -> (-, phase)
const E1 = [1, 0];
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.uv = []; this.m = []; this.e = []; this.ix = []; this.nv = 0; }
  quad(a, b, c, d, hint, col, m = 0, uvs = null, e = E1, ns = null, es = null) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const flip = nx * hint[0] + ny * hint[1] + nz * hint[2] < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const v = [a, b, c, d], ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    for (let i = 0; i < 4; i++) {
      const q = v[i];
      this.p.push(q[0], q[1], q[2]);
      if (ns) this.n.push(ns[i][0], ns[i][1], ns[i][2]); else this.n.push(nx, ny, nz);
      this.c.push(col[0], col[1], col[2]); this.m.push(m);
      const ee = es ? es[i] : e; this.e.push(ee[0], ee[1]);
      if (uvs) this.uv.push(uvs[i][0], uvs[i][1]);
      else if (ay > 0.7) this.uv.push(q[0], q[2]); else if (ax > az) this.uv.push(q[2], q[1]); else this.uv.push(q[0], q[1]);
    }
    const o = this.nv; this.nv += 4;
    if (flip) this.ix.push(o, o + 2, o + 1, o, o + 3, o + 2); else this.ix.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 1));
    g.setAttribute('aE', new THREE.Float32BufferAttribute(this.e, 2));
    g.setIndex(new THREE.Uint32BufferAttribute(this.ix, 1));
    return g;
  }
  get tris() { return this.ix.length / 3; }
}
const ID = { p: (x, y, z) => [x, y, z], d: (x, y, z) => [x, y, z] };
const makeT = (m4) => {
  const e = m4.elements;
  return {
    p: (x, y, z) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]],
    d: (x, y, z) => [e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z],
  };
};
const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// box in the local frame of T; o.skip = string of faces to omit out of 'x0 x1 z0 z1 top bot'
function box(G, T, x0, x1, y0, y1, z0, z1, col, o = {}) {
  const P = T.p, H = T.d, m = o.m ?? 0, e = o.e ?? E1, sk = o.skip ?? 'bot';
  if (!sk.includes('x0')) G.quad(P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0), H(-1, 0, 0), col, m, null, e);
  if (!sk.includes('x1')) G.quad(P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), H(1, 0, 0), col, m, null, e);
  if (!sk.includes('z0')) G.quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), H(0, 0, -1), col, m, null, e);
  if (!sk.includes('z1')) G.quad(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1), H(0, 0, 1), col, m, null, e);
  if (!sk.includes('top')) G.quad(P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1), H(0, 1, 0), col, m, null, e);
  if (!sk.includes('bot')) G.quad(P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1), H(0, -1, 0), col, m, null, e);
}
// a face (corners bl, br, tl, tr) with vertical glyph strips inlaid: strips = [[s0, s1], ...] across (0..1),
// running from t0 to t1 up the face. The strips ignite bottom-up from ign over `rise` of path progress.
function panel(G, bl, br, tl, tr, hint, col, strips, t0, t1, cell, ign, seed, rise = 0.035) {
  const pt = (s, t) => { const a = [0, 0, 0]; for (let i = 0; i < 3; i++) a[i] = lerp(lerp(bl[i], br[i], s), lerp(tl[i], tr[i], s), t); return a; };
  const cols = [0]; for (const s of strips) cols.push(s[0], s[1]); cols.push(1);
  const rows = strips.length ? [0, t0, t1, 1] : [0, 1];
  const len = Math.hypot(tl[0] - bl[0], tl[1] - bl[1], tl[2] - bl[2]) * (t1 - t0), n = Math.max(2, Math.round(len / cell));
  for (let ci = 0; ci < cols.length - 1; ci++) for (let ri = 0; ri < rows.length - 1; ri++) {
    const a = pt(cols[ci], rows[ri]), b = pt(cols[ci + 1], rows[ri]), c = pt(cols[ci + 1], rows[ri + 1]), d = pt(cols[ci], rows[ri + 1]);
    if (ci % 2 === 1 && ri === 1) {
      const sd = (((Math.floor(seed * 61) + ci * 7) % 61) + 0.5) / 61;
      G.quad(a, b, c, d, hint, tint(col, 0.5), 1, [[0, 0], [0, 1], [n, 1], [n, 0]], null, null, [[ign, sd], [ign, sd], [ign + rise, sd], [ign + rise, sd]]);
    } else G.quad(a, b, c, d, hint, col, 0);
  }
}
// vertical cylinder with smooth normals; jag > 0 breaks the top
function column(G, cx, cz, r, y0, y1, col, sides, rng, jag = 0) {
  const top = [];
  for (let j = 0; j <= sides; j++) top.push(j === sides ? top[0] : y1 - (jag ? rng() * jag : 0));
  for (let j = 0; j < sides; j++) {
    const a0 = j / sides * TAU, a1 = (j + 1) / sides * TAU, n0 = [Math.cos(a0), 0, Math.sin(a0)], n1 = [Math.cos(a1), 0, Math.sin(a1)];
    const A = [cx + n0[0] * r, y0, cz + n0[2] * r], B = [cx + n1[0] * r, y0, cz + n1[2] * r], C = [cx + n1[0] * r, top[j + 1], cz + n1[2] * r], D = [cx + n0[0] * r, top[j], cz + n0[2] * r];
    G.quad(A, B, C, D, n0, col, 0, [[a0 * r, y0], [a1 * r, y0], [a1 * r, top[j + 1]], [a0 * r, top[j]]], E1, [n0, n1, n1, n0]);
    G.quad(D, C, [cx, y1 - jag * 0.5, cz], [cx, y1 - jag * 0.5, cz], [0, 1, 0], tint(col, 0.9), 0);
  }
}

// a broken slab piece lying in the dust: a tapered block with one end sheared off; the big ones carry a dead glyph strip
function shard(G, T, sx, sy, sz, col, rng, strip) {
  const P = T.p, H = T.d, k = 0.84, sh = rng.range(0.3, 0.6) * sz, lo = rng.range(0.3, 0.75);
  const b = [P(-sx, -sy, -sz), P(sx, -sy, -sz), P(sx, -sy, sz), P(-sx, -sy, sz)];
  const t = [P(-sx * k, sy, -sz * k), P(sx * k, sy, -sz * k), P(sx * k, sy * lo, sz - sh), P(-sx * k, sy, sz - sh * rng.range(1.3, 2))];
  G.quad(b[0], b[1], t[1], t[0], H(0, 0, -1), col);
  G.quad(b[1], b[2], t[2], t[1], H(1, 0, 0), tint(col, 0.94));
  G.quad(b[2], b[3], t[3], t[2], H(0, 0.4, 1), tint(col, 1.08));          // the fresh break is paler
  G.quad(b[3], b[0], t[0], t[3], H(-1, 0, 0), tint(col, 0.94));
  G.quad(b[0], b[1], b[2], b[3], H(0, -1, 0), tint(col, 0.8));
  if (strip) panel(G, t[0], t[1], t[3], t[2], H(0, 1, 0), col, [[0.36, 0.64]], 0.1, 0.9, 2.3, 9, rng());
  else G.quad(t[0], t[1], t[2], t[3], H(0, 1, 0), col);
}

// ---------- shaders ----------
const STONE_VS = /* glsl */`
attribute vec3 aCol; attribute float aM; attribute vec2 aE;
varying vec3 vWp, vN, vCol; varying vec2 vUv, vE; varying float vM, vFogDepth;
void main(){
  vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vN=normalize(mat3(modelMatrix)*normal);
  vCol=aCol; vUv=uv; vM=aM; vE=aE;
  vec4 mv=viewMatrix*wp; vFogDepth=-mv.z; gl_Position=projectionMatrix*mv;
}`;
// shared: noise + the analytic shadows (boxes standing in the canyon, and the Engine's rings)
const SH_W = 2048, SH_R = 0.23;
const commonGLSL = (shadowGLSL) => /* glsl */`
uniform sampler2D uShTex;
${shadowGLSL}
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fbm(vec2 p){ return .5*vn(p)+.25*vn(p*2.03+17.1)+.125*vn(p*4.12+31.7); }
float fbm2(vec2 p){ return .6*vn(p)+.3*vn(p*2.07+11.3); }
// uShTex: per azimuth seen from the star (x/z), the entry depth and top height of up to four standing boxes.
// Three taps across azimuth and a penumbra that widens behind the box: the star is 40 m across.
float casterRow(float tu,float row,float k,float dz){
  vec4 c=texture2D(uShTex,vec2(tu,row));
  float zc=dz-4., p1=.7+.03*max(dz-c.x,0.), p2=.7+.03*max(dz-c.z,0.);
  return (1.-step(c.x,zc)*smoothstep(c.y+p1,c.y-p1,uStar.y+k*c.x))*(1.-step(c.z,zc)*smoothstep(c.w+p2,c.w-p2,uStar.y+k*c.z));
}
float casterShadow(vec3 p){
  if(p.z<${(MOUTH_Z + 5).toFixed(1)}) return 1.;
  vec3 d=p-uStar; float tu=(d.x/d.z+${SH_R})/${(2 * SH_R).toFixed(2)};
  if(tu<=0.||tu>=1.) return 1.;
  float k=d.y/d.z, du=mix(.5,5.,clamp((abs(d.x)-55.)/90.,0.,1.))/(d.z*${(2 * SH_R).toFixed(2)});
  return .5*casterRow(tu,.25,k,d.z)*casterRow(tu,.75,k,d.z)+.25*(casterRow(tu-du,.25,k,d.z)+casterRow(tu+du,.25,k,d.z));
}`;
const stoneFS = (shadowGLSL) => /* glsl */`
precision highp float;
uniform vec3 uKey, uFill, uGlyph, uHaze, fogColor; uniform float fogDensity, uProg, uTime, uKeyI, uLineK;
varying vec3 vWp, vN, vCol; varying vec2 vUv, vE; varying float vM, vFogDepth;
${commonGLSL(shadowGLSL)}
float glyph(vec2 uv){
  float c=floor(uv.x); vec2 g=vec2(fract(uv.x),uv.y); float id=h21(vec2(c,17.));
  if(id<.14) return 0.;
  g=(g-.5)*vec2(1.3,1.45)+.5; if(g.x<0.||g.x>1.||g.y<0.||g.y>1.) return 0.;
  vec2 q=floor(g*vec2(3.,5.)), qf=fract(g*vec2(3.,5.));
  float on=step(.42,h21(q+vec2(c*7.31,3.)));
  float bar=step(.14,qf.x)*step(qf.x,.86)*step(.16,qf.y)*step(qf.y,.84);
  float joinH=step(.5,h21(q+vec2(c*3.7,9.)))*step(.3,qf.y)*step(qf.y,.7);
  float spine=step(abs(g.x-.5),.07)*step(.45,id);
  return max(on*max(bar,joinH),spine);
}
// fossils in the wall: ammonite spirals and branching radial fans, one per 64 m cell at most
float fossil(vec2 uv){
  vec2 g=uv/64., id=floor(g), f=fract(g); float r0=h21(id+3.7);
  if(r0>.5) return 0.;
  vec2 c=vec2(.32)+.36*vec2(h21(id+11.3),h21(id+29.1)); vec2 q=(f-c)*64.;
  float R=9.+12.*h21(id+5.1), r=length(q); if(r>R||r<.6) return 0.;
  float a=atan(q.y,q.x)+6.2832*h21(id+1.9), edge=smoothstep(R,R*.86,r);
  if(r0<.27){
    float t=log(r/R)*1.7+a/6.2832, s=abs(fract(t)-.5);
    float line=smoothstep(.36,.46,s), ribs=smoothstep(.5,.92,cos(a*26.+floor(t)*2.4))*.6;
    return edge*max(line,ribs*smoothstep(.08,.3,r/R));
  }
  float n=5.*exp2(floor(log2(r/R*14.+1.)));
  float b=abs(fract(a/6.2832*n+.18*sin(r*.9))-.5)*6.2832*r/n;
  float ringl=1.-smoothstep(.0,.35,abs(fract(log2(r/R*14.+1.))-.5)*r*.5);
  return edge*max(1.-smoothstep(.25,.6,b),ringl*.7);
}
void main(){
  // no branches on the mask: a software rasteriser runs every branch anyway, so the noise is shared instead
  vec3 Ng=normalize(vN), V=normalize(cameraPosition-vWp), L=normalize(uStar-vWp);
  float fw=fwidth(vUv.x)+fwidth(vUv.y);
  float det=1.-smoothstep(.25,1.6,fw), det2=1.-smoothstep(.6,3.5,fw);
  float isWall=step(vM,.5), isGlyph=step(.5,vM)*step(vM,1.5), isFloor=step(1.5,vM)*step(vM,2.5), isCond=step(2.5,vM)*step(vM,3.5), isLine=step(3.5,vM);
  float stone=isWall+isFloor;
  float c1=fbm(vUv*mix(.045,.03,isWall)), c2=fbm2(vUv*mix(.3,.37,isWall)+9.)*det;
  // wall: strata, masonry blocks and courses, fossils
  float strata=vn(vec2(vUv.y*.5+c1*4.,7.3))*det2;
  vec2 pw=vUv/vec2(38.,19.); pw.x+=.5*step(.5,fract(floor(pw.y)*.5)); vec2 pf=fract(pw);
  float jw=(1.-smoothstep(.15,.8,min(min(pf.x,1.-pf.x)*38.,min(pf.y,1.-pf.y)*19.)))*det2;
  float fo=fossil(vUv)*det2*isWall;
  float blk=h21(floor(pw)+3.), course=smoothstep(.42,.5,abs(fract(vUv.y/80.+.31)-.5));
  float hW=2.2*c1+.6*strata+.3*c2-.7*jw-.7*fo;
  float stain=fbm2(vUv*vec2(.0052,.0085)+3.7), streak=vn(vec2(vUv.x*.03+2.*c1,vUv.y*.004+5.));
  float aW=(.7+.36*c1+.14*strata)*(.74+.34*blk)*(1.-.3*course)*(1.-.35*jw)*mix(1.,.55,fo)*mix(.7,1.14,stain)*(.88+.2*streak);
  // floor: paved processional strip down the middle, rippled regolith either side
  float av=1.-smoothstep(20.,23.,abs(vUv.x));
  vec2 pu=vUv/11.; vec2 pg=fract(pu);
  float jf=(1.-smoothstep(.1,.5,min(min(pg.x,1.-pg.x),min(pg.y,1.-pg.y))*11.))*av*det2;
  float rip=(sin(vUv.y*.8+9.*c1)*.5+.5)*det;
  float hF=mix(3.2*c1+1.1*c2+.6*rip,.3*c2,av)-.5*jf;
  float aF=mix(.45+.85*c1,.74+.24*h21(floor(pu)),av)*(1.-.45*jf);
  // glyph strip (ignites at vE.x), conduit (travelling pulses), light line
  float g=glyph(vec2(vUv.x+floor(vE.y*61.)*7.,vUv.y)); g=mix(g,.33,smoothstep(.3,1.1,fw));
  float on=smoothstep(vE.x,vE.x+.012,uProg), flash=on*(1.-smoothstep(vE.x+.012,vE.x+.08,uProg));
  vec3 eG=uGlyph*g*(.1+on*(2.5*(.78+.22*sin(uTime*1.4+vE.y*40.+vUv.x*.5))+3.*flash));
  float cp=fract(-vUv.x/150.+uTime*.15+vE.y), cpulse=smoothstep(0.,.025,cp)*(1.-smoothstep(.025,.3,cp));
  float collar=step(fract(vUv.x/14.),.08);
  vec3 eC=uGlyph*smoothstep(.84,.93,vUv.y)*(.3+3.2*cpulse)*(1.-collar);
  float lon=smoothstep(vE.x,vE.x+.02,uProg);
  vec3 eL=uGlyph*step(.12,fract(vUv.x/7.+vE.y*3.))*(.1+lon*(1.7+.5*sin(uTime*1.1+vUv.x*.05+vE.y*20.)))*vCol.g*uLineK;
  float h=hW*isWall+hF*isFloor, keyMul=mix(1.,vE.x,stone), graze=.05*isFloor;
  vec3 alb=vCol*(aW*isWall+aF*isFloor+.6*isGlyph+(.55+.6*collar)*isCond+.4*isLine);
  vec3 emi=eG*isGlyph+eC*isCond+eL*isLine;
  vec3 dpx=dFdx(vWp), dpy=dFdy(vWp); float hx=dFdx(h), hy=dFdy(h);
  vec3 r1=cross(dpy,Ng), r2=cross(Ng,dpx); float dt=dot(dpx,r1);
  vec3 Np=abs(dt)*Ng-(dt<0.?-1.:1.)*(hx*r1+hy*r2)/(1.+fw*.7); float nl=dot(Np,Np);
  vec3 N=(stone>.5&&nl>1e-16&&nl<1e16)?Np*inversesqrt(nl):Ng;
  float lit=max(dot(N,L),0.)+graze*smoothstep(-.02,.03,dot(Ng,L)); lit=lit/(lit+.14)*1.14*smoothstep(-.03,.06,dot(Ng,L));
  float sh=keyMul*casterShadow(vWp)*engineShadow(vWp,-1.);
  vec3 col=alb*(uKey*uKeyI*lit*sh+uFill*(.6+.4*N.y)*(1.+vE.y*stone))+emi;
  float ff=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  float ph=pow(max(dot(-V,normalize(uStar-cameraPosition)),0.),5.);
  gl_FragColor=vec4(mix(col,fogColor+uHaze*ph*.28,ff),1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
}`;
// gold dust sheets over the canyon floor: additive, cut by the same shadows, so the slabs throw shafts
const HAZE_VS = /* glsl */`
attribute float aL; varying vec3 vWp; varying float vL, vFogDepth;
void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vL=aL; vec4 mv=viewMatrix*wp; vFogDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const hazeFS = (shadowGLSL) => /* glsl */`
precision highp float;
uniform vec3 uHaze; uniform float fogDensity, uTime, uAmt;
varying vec3 vWp; varying float vL, vFogDepth;
${commonGLSL(shadowGLSL)}
void main(){
  vec3 Vv=vWp-cameraPosition; float dv=length(Vv); vec3 V=Vv/dv;
  vec2 q=vWp.xz*.011+vec2(.013,.05)*uTime*(1.+vL*.3)+vL*7.3;
  float n=fbm(q+.6*vn(q*2.3-uTime*.02)); float dens=smoothstep(.3,.75,n)*.85+.15;
  float sh=casterShadow(vWp);
  float ph=.35+1.9*pow(max(dot(V,normalize(uStar-vWp)),0.),6.);
  float edge=smoothstep(${CAN_W.toFixed(1)},${(CAN_W - 40).toFixed(1)},abs(vWp.x))*smoothstep(${(MOUTH_Z - 22).toFixed(1)},${(MOUTH_Z + 30).toFixed(1)},vWp.z)*smoothstep(${Z_END.toFixed(1)},${(Z_END - 80).toFixed(1)},vWp.z);
  float near=smoothstep(6.,45.,dv)*smoothstep(0.,6.,abs(cameraPosition.y-vWp.y));
  float ff=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor=vec4(uHaze*dens*sh*ph*edge*near*uAmt*(1.-ff),1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
}`;
const WARDEN_VS = /* glsl */`
varying vec3 vWp; varying float vFogDepth;
void main(){ vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.); vWp=wp.xyz; vec4 mv=viewMatrix*wp; vFogDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const WARDEN_FS = /* glsl */`
precision highp float;
uniform vec3 uStar, uKey, uFill, uBrass, uGlyph, fogColor; uniform float fogDensity, uTime;
varying vec3 vWp; varying float vFogDepth;
void main(){
  vec3 N=normalize(cross(dFdx(vWp),dFdy(vWp))); vec3 V=normalize(cameraPosition-vWp); if(dot(N,V)<0.) N=-N;
  vec3 L=normalize(uStar-vWp); float lit=max(dot(N,L),0.);
  vec3 H=normalize(L+V); float sp=pow(max(dot(N,H),0.),24.);
  vec3 col=uBrass*(uKey*(1.6*lit+2.*sp)+uFill*1.4)+uGlyph*.12*pow(1.-max(dot(N,V),0.),3.);
  float ff=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  gl_FragColor=vec4(mix(col,fogColor,ff),1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
}`;
// the portal's beacon: rings and guide lines that never get thinner than about a pixel and a half
const BEACON_VS = /* glsl */`
uniform float uViewH, uTube; varying vec2 vUv;
void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.);
  vec3 p=position+normal*max(-mv.z*uPxK/uViewH-uTube,0.); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`.replace('uPxK', '1.0');
const BEACON_FS = /* glsl */`
precision highp float;
uniform vec3 uCol; uniform float uTime, uGain, uN, uSpd, uBase, uFade; varying vec2 vUv;
void main(){
  float p=fract(vUv.x*uN-uTime*uSpd), pulse=smoothstep(0.,.06,p)*(1.-smoothstep(.06,.5,p));
  gl_FragColor=vec4(uCol*uGain*(uBase+pulse)*mix(1.,smoothstep(0.,.8,vUv.x),uFade),1.);
  if(!(abs(gl_FragColor.r+gl_FragColor.g+gl_FragColor.b)<1e5)) gl_FragColor=vec4(0.,0.,0.,1.);
}`;
const DECAL_VS = /* glsl */`attribute float aA; varying float vA; void main(){ vA=aA; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const DECAL_FS = /* glsl */`precision highp float; varying float vA; void main(){ gl_FragColor=vec4(0.,0.,.004,vA); }`;

export default {
  id: 'silent-engine', name: 'The Silent Engine', category: 'alien', weirdness: 0.65,
  async build(ctx) {
    const rng = ctx.rng, V3 = THREE.Vector3;
    const scene = new THREE.Scene();
    const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };

    // ---- per-seed character ----
    const hazeAmt = rng.range(0.4, 1.6);                 // thin clear vacuum <-> thick levitated dust
    // glyph light: cyan drifting toward teal or ice blue; now and then a violet-blue or a pale amber-white Engine
    const glyphRoll = rng.fork('glyph')(), violet = glyphRoll < 0.11, glyphHue = rng.range(-0.045, 0.1) + (violet ? 0.11 : 0);
    const glyphCol = glyphRoll > 0.94 ? new THREE.Color('#ffe2ae') : new THREE.Color(PAL[6]).offsetHSL(glyphHue, 0, violet ? 0.04 : 0);
    const ashWarm = rng.range(0, 1);                      // pale grey ash <-> warmer bone
    const ash = tint(lin(PAL[3]), 0.72); ash[2] *= lerp(1.04, 0.9, ashWarm); ash[0] *= lerp(0.97, 1.03, ashWarm);
    const dark = tint(lin(PAL[2]), 0.5);
    const starTemp = rng.range(-1, 1);                    // the captive star: deeper amber <-> paler white-gold
    const starCol = new THREE.Color(PAL[5]).offsetHSL(0.05 * starTemp, 0, 0.07 * starTemp);
    const pal = PAL.slice(); pal[6] = '#' + glyphCol.getHexString(); pal[5] = '#' + starCol.getHexString();

    // ---- sky: airless black, hard stars, faint band ----
    // the band's pole is kept square to the canyon axis with +x up front, so its bright core sits at +Z, behind
    // the camera, and only the thin cool far arm crosses the sky over the Engine
    const mwA = rng.range(-0.5, 1.0);
    const sky = makeSky({ rng: rng.fork('sky'), preset: 'space', nebula: 0, sunIntensity: 0, sunGlow: 0, stars: 1.25, starDensity: 1,
      twinkle: 0.12, milkyWay: rng.range(0.03, 0.07), milkyAxis: [Math.cos(mwA), Math.sin(mwA), rng.range(-0.12, 0.12)], milkyAngle: rng.range(-22, 22),
      milkyColor: '#8f9cc0', milkyCore: '#cfd6ea', clouds: false, clouds2: false, quality: 0.5, renderOrder: 1000, bake: true, renderer: ctx.renderer });
    scene.add(sky.object);
    const fogCol = new THREE.Color('#0d0906');
    scene.fog = new THREE.FogExp2(fogCol, 0.00036 * (0.75 + 0.35 * hazeAmt));

    // ---- the Engine ----
    const hero = await buildHero({ ...ctx, rng: rng.fork('engine') }, { palette: pal, starHeight: 420, progress: 0, veilDrop: rng.range(205, 310) });
    const off = new V3(0, STAR_Y - 420, 0);
    hero.object.position.copy(off); scene.add(hero.object);
    const A = hero.anchors, W = (v) => v.clone().add(off);
    const rim = W(A.rimPass), rimPt = W(A.rimPoint), seat = W(A.portalSeat.position), starW = new V3(0, STAR_Y, 0);
    const HU = hero.uniforms;
    await ctx.yield();

    // ---- the flight ----
    const ENTRY_Z = 1270, wv = rng.sign() * rng.range(3, 7), swing = rng.sign() * rng.range(8, 38), LEVEL = 125;
    let path = null, drop = 24;
    for (let it = 0; it < 8; it++) {
      const ry = rim.y - drop, zL = seat.z + LEVEL;
      const pts = [[wv, 44, ENTRY_Z], [wv * 0.6, 47, ENTRY_Z - 70], [-wv, 50, 1080], [swing, 62, 960], [swing * 0.55 + rim.x * 0.3, 84, 850], [rim.x * 0.7, 108, 745],
        [rim.x, ry + 15, 640], [rim.x, ry + 13, 555], [rim.x, ry, rim.z]];
      // the rim is only 190 m short of the portal, so the camera passes a little lower under the teeth and dives at
      // one steady slope (about 55 degrees at most) straight after: the last 125 m and more are level on the axis
      for (const [s, k] of [[0.2, 0.84], [0.5, 0.5], [0.8, 0.16]]) pts.push([rim.x * k, STAR_Y + (ry - STAR_Y) * k, lerp(rim.z, zL, s)]);
      pts.push([0, STAR_Y, zL], [0, STAR_Y, seat.z + LEVEL * 0.5], [seat.x, seat.y, seat.z]);
      path = makePath(pts);
      let minC = 1e9; const q = new V3();
      for (let i = 0; i <= 240; i++) { path.pointAt(i / 240, q); if (q.z < MOUTH_Z + 40 && q.z > seat.z + 55) minC = Math.min(minC, A.clearance(q.sub(off))); }
      if (minC >= 30) break;
      drop += 6;
    }
    const uMouth = path.nearestXZ(rim.x * 0.8, MOUTH_Z).u, uRim = path.nearestXZ(rim.x, rim.z).u;

    // ---- layout: the funnel of slabs, gate pylons, colonnades ----
    // The star is a point at the far end, so every shadow runs radially away from it. A funnel that narrows toward
    // the camera hides its own shadows behind the nearer slabs, so the avenue is laid out as a lens instead: near the
    // mouth a FAN of slabs that widens toward the camera (each stands at a larger bearing from the star than the one
    // before, so its shadow lane falls inside the avenue, on the floor the camera looks down), then a FUNNEL that
    // closes in again on the entry. All are turned partly broadside to the star, dark glyph faces toward the camera.
    const casters = [], slabs = [], lanes = { '-1': [], 1: [] };
    const SHX = 3.4, SHZ = 13, halfW = (E) => SHZ * Math.sin(E) + SHX * Math.cos(E), turnFor = (h) => Math.asin(clamp(h / Math.hypot(SHX, SHZ), 0.26, 0.95)) - Math.atan2(SHX, SHZ);
    const nPairs = rng.int(6, 9), nM = nPairs >= 8 ? 4 : 3, nE = nPairs - nM, stagSide = rng.sign(), faceMix = rng.chance(0.4);
    const azIn = rng.range(0.044, 0.05), dAz = nM === 4 ? rng.range(0.02, 0.023) : rng.range(0.026, 0.031), zStep = rng.range(58, 66);
    const sq = new V3();
    // does a box of half-width hw and height H at (x, z) hide the star from any point of the canyon flight, or crowd the path?
    const blocks = (x, z, hw, H) => {
      for (let i = 0; i <= 90; i++) {
        path.pointAt(i / 200, sq);
        if (sq.z < z + 20) break;
        const k = z / sq.z;
        if (Math.abs(sq.x * k - x) < hw + 5 && STAR_Y + (sq.y - STAR_Y) * k < H + 4) return true;
      }
      const n = path.nearestXZ(x, z);
      return n.dist < hw + 9 && n.y < H + 10;
    };
    const overlap = (side, a, h) => { let o = 0; for (const l of lanes[side]) o += Math.max(0, Math.min(a + h, l[1]) - Math.max(a - h, l[0])); return o; };
    const addSlab = (s, z, az, E, o = {}) => {
      const H = o.broken ? rng.range(22, 40) : 60 * rng.range(0.95, 1.07), hw = halfW(E);
      for (let i = 0; i < 14 && blocks(s * az * z, z, hw, H); i++) az += 0.004;
      const x = s * az * z, face = o.lit ? -1 : 1;
      slabs.push({ x, z, s, H, broken: !!o.broken, near: !!o.near, fan: !!o.fan, hx: SHX, hz: SHZ, yaw: Math.atan2(x, z) + s * face * E, u: path.nearestXZ(x, z).u, seed: rng() });
      if (H > STAR_Y + 8) lanes[s].push([az - hw / z, az + hw / z]);
    };
    for (const s of [-1, 1]) {
      const st = s === stagSide ? 0.5 : 0;
      let zLast = 0;
      for (let j = 0; j < nM; j++) {                       // the fan: unbroken, the shadow casters of the opening image
        const z = 778 + (j + st) * zStep + rng.range(-5, 5), az = Math.min(azIn + (j + st * 0.5) * dAz, 97 / z);
        addSlab(s, z, az, turnFor(clamp(0.31 * dAz * z, 4.9, 9.6)), { fan: true });
        zLast = z;
      }
      const zE0 = zLast + rng.range(62, 80), azE0 = Math.min(0.1, 99 / zE0), rB = rng.range(0.0245, 0.027);
      for (let i = 0; i < nE; i++) {                       // the funnel: placed in the lit gaps between the fan's lanes where it can be
        const t = i / (nE - 1), last = i === nE - 1, z = lerp(zE0, ENTRY_Z - 34, t) + (last ? 0 : rng.range(-7, 7));
        const E = last ? 0.3 : rng.range(0.3, 0.52), h = halfW(E) / z;
        let az = lerp(azE0, rB, t), best = 1e9;
        if (!last) { const a = az; for (const d of [0, 0.005, -0.005, 0.01, -0.01, 0.015, -0.015]) { const c = a + d, o = overlap(s, c, h) + Math.abs(d) * 0.05; if (c * z > 31 && c * z < 100 && o < best) { best = o; az = c; } } }
        addSlab(s, z, az, E, { broken: !last && i > 0 && rng.chance(0.2), near: i >= nE - 2, lit: faceMix && !last && i % 2 === 0 });
      }
    }
    // gate pylons at the mouth: a pair, or one of them long since broken off short
    const gateRoll = rng(), gateShort = gateRoll < 0.22 ? rng.sign() : 0;
    for (const s of [-1, 1]) slabs.push({ x: s * 123, z: 727, s, H: s === gateShort ? rng.range(38, 62) : rng.range(100, 126), broken: s === gateShort, hx: 8, hz: 8, yaw: 0, u: uMouth - 0.03, seed: rng(), gate: true });
    for (const b of slabs) casters.push([b.x, b.z, b.hx, b.hz, b.H, b.yaw]);
    // colonnades: one side collapsed to stumps, both standing, a full double colonnade down the whole canyon, both in
    // ruin, or (rarely) a single one
    const colSide = rng.sign(), colMode = rng(), colonnades = [], colFull = colMode >= 0.4 && colMode < 0.58;
    for (const s of [-1, 1]) {
      if (colMode > 0.93 && s !== colSide) continue;
      const fallen = colMode < 0.4 ? s === colSide : colMode > 0.84 && colMode <= 0.93;
      const z0 = colFull ? rng.range(840, 856) : (s === colSide ? rng.range(846, 870) : rng.range(1020, 1060)), n = colFull ? 10 : rng.int(4, 6);
      const ruin = fallen ? rng.range(0.75, 0.95) : colFull ? rng.range(0, 0.12) : rng.range(0.05, 0.3), cols = [];
      for (let i = 0; i < n; i++) {
        const brk = rng.chance(ruin), H = brk ? rng.range(30, 78) : 106;
        cols.push({ x: s * 127, z: z0 + i * 38, H, brk });
        casters.push([s * 127, z0 + i * 38, 6.4, 6.4, H, 0]);
      }
      colonnades.push({ s, z0, z1: z0 + (n - 1) * 38, cols });
    }
    // star-view shadow table: for each azimuth, the nearest four boxes a ray from the star meets
    const shData = new Float32Array(SH_W * 2 * 4).fill(1e9);
    for (let i = 0; i < SH_W; i++) {
      const uu = lerp(-SH_R, SH_R, (i + 0.5) / SH_W), hits = [];
      for (const c of casters) {
        if (Math.abs(uu - c[0] / c[1]) > (c[2] + c[3]) * 1.5 / c[1]) continue;
        const cs = Math.cos(c[5]), sn = Math.sin(c[5]);
        const ox = -c[0] * cs + c[1] * sn, oz = -c[0] * sn - c[1] * cs, dx = uu * cs - sn, dz = uu * sn + cs;
        const ax = (-c[2] - ox) / dx, bx = (c[2] - ox) / dx, az = (-c[3] - oz) / dz, bz = (c[3] - oz) / dz;
        const t0 = Math.max(Math.min(ax, bx), Math.min(az, bz)), t1 = Math.min(Math.max(ax, bx), Math.max(az, bz));
        if (t1 > t0 && t0 > 0) hits.push([t0, c[4]]);
      }
      hits.sort((p, q) => p[0] - q[0]);
      for (let h = 0; h < Math.min(hits.length, 4); h++) { const o = ((h >> 1) * SH_W + i) * 4 + (h & 1) * 2; shData[o] = hits[h][0]; shData[o + 1] = hits[h][1]; }
    }
    const shTex = new THREE.DataTexture(shData, SH_W, 2, THREE.RGBAFormat, THREE.FloatType);
    shTex.minFilter = shTex.magFilter = THREE.NearestFilter; shTex.generateMipmaps = false; shTex.needsUpdate = true;

    // ---- stone: everything built, in two meshes (canyon, pit) ----
    const GC = new Geo(), GP = new Geo(), decal = { p: [], a: [], ix: [], nv: 0 };
    const addShadowDecal = (x, z, r, h) => {            // long soft shadow on the floor, radially away from the star
      const D = Math.hypot(x, z), dx = x / D, dz = z / D, px = dz, pz = -dx;
      const L = Math.min(h * D / Math.max(STAR_Y - h, 5), 150), w1 = r * (1 + L / D) + L * 0.012, y = 0.06;
      const b = [x + dx * r * 0.5, z + dz * r * 0.5], e = [x + dx * (L + r), z + dz * (L + r)], m = [(b[0] + e[0]) / 2, (b[1] + e[1]) / 2];
      const rows = [[b, r, 0.7], [m, (r + w1) / 2, 0.42], [e, w1, 0]];
      for (const [c, w, a] of rows) { decal.p.push(c[0] - px * w, y, c[1] - pz * w, c[0] + px * w, y, c[1] + pz * w); decal.a.push(a, a); }
      const o = decal.nv; decal.nv += 6; decal.ix.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4, o + 3, o + 5, o + 4);
    };

    // slabs
    for (const b of slabs) {
      const T = makeT(new THREE.Matrix4().makeRotationY(b.yaw).setPosition(b.x, 0, b.z)), P = T.p, Hn = T.d;
      const col = tint(ash, 0.82 + 0.25 * b.seed), ign = b.u - 0.11, hx = b.hx, hz = b.hz, k = b.gate ? 0.8 : 0.9;
      box(GC, T, -hx - 2, hx + 2, 0, 3, -hz - 2.5, hz + 2.5, tint(col, 0.85));
      const th = [0, 1, 2, 3].map(() => b.broken ? b.H * rng.range(b.gate ? 0.78 : 0.62, 1) : b.H);   // top corner heights: (-x,-z) (x,-z) (x,z) (-x,z)
      const tx = hx * k, tz = hz * k;
      const big = b.gate ? [[0.2, 0.32], [0.68, 0.8]] : [[0.12, 0.22], [0.45, 0.55], [0.78, 0.88]], small = b.gate ? big : [[0.34, 0.66]];
      panel(GC, P(-hx, 3, -hz), P(-hx, 3, hz), P(-tx, th[0], -tz), P(-tx, th[3], tz), Hn(-1, 0, 0), col, big, 0.06, 0.93, 2.3, ign, b.seed);
      panel(GC, P(hx, 3, -hz), P(hx, 3, hz), P(tx, th[1], -tz), P(tx, th[2], tz), Hn(1, 0, 0), col, big, 0.06, 0.93, 2.3, ign, b.seed + 0.3);
      panel(GC, P(-hx, 3, hz), P(hx, 3, hz), P(-tx, th[3], tz), P(tx, th[2], tz), Hn(0, 0, 1), b.near ? tint(col, 0.45) : col, small, 0.06, 0.93, 2.3, ign, b.seed + 0.6);
      panel(GC, P(-hx, 3, -hz), P(hx, 3, -hz), P(-tx, th[0], -tz), P(tx, th[1], -tz), Hn(0, 0, -1), col, [], 0, 1, 2.3, ign, b.seed);
      GC.quad(P(-tx, th[0], -tz), P(tx, th[1], -tz), P(tx, th[2], tz), P(-tx, th[3], tz), [0, 1, 0], tint(col, 0.9), 0);
      if (b.broken) {                                    // the fallen top lies in the dust beside it
        const L = (b.gate ? 34 : (60 - b.H) * 0.8), ang = rng.range(-0.5, 0.5) + Math.PI / 2;
        const m4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rng.range(-0.05, 0.05), ang, rng.range(0.03, 0.12)));
        const fx0 = b.x + b.s * (b.gate ? -rng.range(30, 40) : rng.range(22, 30)), fz0 = b.z + rng.range(-6, 14);
        m4.setPosition(fx0, 1.2, fz0);
        box(GC, makeT(m4), -L / 2, L / 2, -1, 5.6, -11, 11, tint(col, 0.9));
        addShadowDecal(fx0, fz0, 12, 5);
      }
    }
    await ctx.yield();

    // colossal broken colonnades on two 5 m steps against the walls
    for (const cn of colonnades) {
      const s = cn.s, col = tint(ash, 0.92), za = cn.z0 - 18, zb = cn.z1 + 18, wallSide = s > 0 ? 'x1' : 'x0';
      box(GC, ID, Math.min(s * 103, s * CAN_W), Math.max(s * 103, s * CAN_W), 0, 5, za - 7, zb + 7, col, { skip: 'bot' + wallSide });
      box(GC, ID, Math.min(s * 111, s * CAN_W), Math.max(s * 111, s * CAN_W), 5, 10, za, zb, col, { skip: 'bot' + wallSide });
      cn.cols.forEach((c, i) => {
        box(GC, ID, c.x - 8.6, c.x + 8.6, 10, 13.5, c.z - 8.6, c.z + 8.6, tint(col, 0.95));
        column(GC, c.x, c.z, 7, 13.5, c.H, col, 14, rng, c.brk ? 10 : 0);
        if (!c.brk) {
          box(GC, ID, c.x - 9, c.x + 9, c.H, c.H + 5, c.z - 9, c.z + 9, tint(col, 1.03), { skip: '' });
          const nx = cn.cols[i + 1];
          if (nx && !nx.brk) box(GC, ID, c.x - 8, c.x + 8, c.H + 5, c.H + 18, c.z - 9, nx.z + 9, tint(col, 0.97), { skip: '' });
        }
      });
    }
    // fallen fragments with long shadows: most lie where they fell, at the feet of broken slabs and columns
    const fallAt = [];
    for (const b of slabs) if (b.broken) fallAt.push({ x: b.x, z: b.z, s: b.s, slab: true });
    for (const cn of colonnades) for (const c of cn.cols) if (c.brk) fallAt.push({ x: c.x, z: c.z, s: cn.s });
    if (!fallAt.length) for (const cn of colonnades) for (const c of cn.cols) fallAt.push({ x: c.x, z: c.z, s: cn.s });
    if (!fallAt.length) for (const b of slabs) if (!b.gate) fallAt.push({ x: b.x, z: b.z, s: b.s, slab: true });
    const nFrag = rng.int(50, 80);
    for (let i = 0, placed = 0; i < 900 && placed < nFrag; i++) {
      let x, z; const near = rng.chance(0.6);
      if (near) {
        const a = rng.pick(fallAt);
        if (a.slab) { const an = rng.range(0, TAU), r = rng.range(21, 42); x = a.x + Math.cos(an) * r; z = a.z + Math.sin(an) * r; }
        else { x = a.s * rng.range(70, 97); z = a.z + rng.range(-18, 18); }
      } else { x = rng.sign() * rng.range(27, 144); z = rng.range(708, Z_END - 30); }
      if (Math.abs(x) < 27 || Math.abs(x) > 144 || z > Z_END - 30 || Math.hypot(x, z) < PIT_R + 14) continue;
      let ok = true;
      for (const b of slabs) if (Math.hypot(x - b.x, z - b.z) < 21) { ok = false; break; }
      for (const cn of colonnades) if (x * cn.s > 98 && z > cn.z0 - 30 && z < cn.z1 + 30) ok = false;
      if (!ok) continue;
      const big = rng.chance(near ? 0.4 : 0.18), sx = big ? rng.range(2.6, 5.5) : rng.range(1, 2.6), sy = big ? rng.range(1.6, 3.4) : rng.range(0.7, 1.8), sz = big ? rng.range(5, 11) : rng.range(1.6, 4.5);
      const m4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rng.range(-0.22, 0.22), rng.range(0, TAU), rng.range(-0.3, 0.3))).setPosition(x, sy * 0.55, z);
      shard(GC, makeT(m4), sx, sy, sz, tint(ash, rng.range(0.72, 1)), rng, big);
      addShadowDecal(x, z, Math.max(sx, sz) * 0.8, sy * 1.5);
      placed++;
    }

    // canyon walls: five terraces per side, shallow pilasters with their raking shadows cut into the mesh,
    // cornices, and dark niches framed with light at floor level
    const lvlX = (L) => CAN_W + LVL_STEP * L, lvlR = (L) => PIT_R + LVL_STEP * L;
    const lineQ = (G, a, b, c, d, hint, len, e, col = dark) => G.quad(a, b, c, d, hint, col, 4, [[0, 0], [len, 0], [len, 1], [0, 1]], e);
    for (const s of [-1, 1]) for (let L = 0; L < 5; L++) {
      const xa = lvlX(L), x = s * xa, y0 = L * LVL_H, y1 = y0 + LVL_H, zJ = Math.sqrt(lvlR(L) ** 2 - xa * xa);
      const wcol = tint(ash, 1 - 0.04 * L), wallSide = s > 0 ? 'x1' : 'x0', dp = 3;
      let feats = [];
      const sp = rng.range(84, 108);
      for (let z = zJ + 26 + rng.range(0, sp); z < Z_END - 12; z += sp) feats.push({ z0: z - 5, z1: z + 5, pil: true });
      if (L === 0) {
        const base = feats.slice();
        for (let i = 0; i < base.length - 1; i++) if (rng.chance(0.65)) { const zc = (base[i].z1 + base[i + 1].z0) / 2 + rng.range(-9, 9); feats.push({ z0: zc - 7, z1: zc + 7, pil: false }); }
        feats.sort((a, b) => a.z0 - b.z0);
      }
      const riser = (zA, zB, ya, yb, key) => GC.quad([x, ya, zA], [x, ya, zB], [x, yb, zB], [x, yb, zA], [-s, 0, 0], wcol, 0, null, [key, 0]);
      const seg = (zA, zB, shLen) => {
        if (zB <= zA) return; let z = zA;
        if (shLen > 0) { const ze = Math.min(zA + shLen, zB); riser(z, ze, y0, y1, 0); z = ze; }
        while (z < zB - 0.01) { const ze = Math.min(z + 70, zB); riser(z, ze, y0, y1, 1); z = ze; }
      };
      let cur = zJ, sh = 0;
      for (const f of feats) {
        seg(cur, f.z0, sh);
        if (f.pil) {
          const xi = x - s * dp;
          box(GC, ID, Math.min(x, xi), Math.max(x, xi), y0, y1, f.z0, f.z1, tint(wcol, 1.04), { skip: 'bot' + wallSide });
          sh = dp * f.z1 / xa;
        } else {
          const hN = 46, xb = x + s * 9, xl = x + s * 2.4, zc = (f.z0 + f.z1) / 2, ncol = tint(wcol, 0.8);
          const e = [path.nearestXZ(x, zc).u - 0.13, rng()];
          GC.quad([xb, 0, f.z0], [xb, 0, f.z1], [xb, hN, f.z1], [xb, hN, f.z0], [-s, 0, 0], ncol, 0, null, [0, 0]);
          GC.quad([x, 0, f.z0], [xb, 0, f.z0], [xb, hN, f.z0], [x, hN, f.z0], [0, 0, 1], ncol, 0, null, [0, 0]);
          GC.quad([x, 0, f.z1], [xl, 0, f.z1], [xl, hN, f.z1], [x, hN, f.z1], [0, 0, -1], ncol, 0, null, [1, 0]);
          GC.quad([xl, 0, f.z1], [xb, 0, f.z1], [xb, hN, f.z1], [xl, hN, f.z1], [0, 0, -1], ncol, 0, null, [0, 0]);
          GC.quad([x, hN, f.z0], [xb, hN, f.z0], [xb, hN, f.z1], [x, hN, f.z1], [0, -1, 0], ncol, 0, null, [0, 0]);
          riser(f.z0, f.z1, hN, y1, 1);
          const xf = x - s * 0.25, hint = [-s, 0, 0];
          lineQ(GC, [xf, 0, f.z0 - 1.8], [xf, hN + 1.8, f.z0 - 1.8], [xf, hN + 1.8, f.z0 - 0.7], [xf, 0, f.z0 - 0.7], hint, hN, e);
          lineQ(GC, [xf, 0, f.z1 + 0.7], [xf, hN + 1.8, f.z1 + 0.7], [xf, hN + 1.8, f.z1 + 1.8], [xf, 0, f.z1 + 1.8], hint, hN, e);
          lineQ(GC, [xf, hN + 0.7, f.z0 - 1.8], [xf, hN + 0.7, f.z1 + 1.8], [xf, hN + 1.8, f.z1 + 1.8], [xf, hN + 1.8, f.z0 - 1.8], hint, 18, e);
          sh = 0;
        }
        cur = f.z1;
      }
      seg(cur, Z_END, sh);
      const xc = x - s * 2.4;
      box(GC, ID, Math.min(x, xc), Math.max(x, xc), y1 - 6, y1, zJ, Z_END, tint(wcol, 1.05), { skip: wallSide });
      if (L < 4) { const xn = s * lvlX(L + 1); GC.quad([x, y1, zJ], [xn, y1, zJ], [xn, y1, Z_END], [x, y1, Z_END], [0, 1, 0], wcol, 0); }
    }
    // canyon floor, ending on the pit's rim arc
    {
      const fcol = tint(ash, 0.82), lip = [];
      for (let i = -4; i <= 4; i++) { const th = i * TAU / 120; lip.push([PIT_R * Math.sin(th), PIT_R * Math.cos(th)]); }
      const c0 = lip[lip.length - 1], th5 = 5 * TAU / 120, c1 = [PIT_R * Math.sin(th5), PIT_R * Math.cos(th5)], zc = lerp(c0[1], c1[1], (CAN_W - c0[0]) / (c1[0] - c0[0]));
      lip.unshift([-CAN_W, zc]); lip.push([CAN_W, zc]);
      for (let i = 0; i < lip.length - 1; i++) {
        const xa = lip[i][0], xb = lip[i + 1][0]; let za = lip[i][1], zb = lip[i + 1][1];
        for (let z = 760; z <= Z_END; z += 80) { GC.quad([xa, 0, za], [xb, 0, zb], [xb, 0, z], [xa, 0, z], [0, 1, 0], fcol, 2); za = zb = z; }
      }
    }
    // conduits: cables down the avenue that drop over the rim, pulses racing toward the Engine
    const tube = (G, pts, r, col, phase) => {
      const sides = 8, rings = []; let len = 0;
      pts.forEach((p, i) => {
        const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
        let ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
        if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
        const ring = [];
        for (let j = 0; j <= sides; j++) {
          const an = j / sides * TAU, c = Math.cos(an), sn = Math.sin(an), n = [c, -tz * sn, ty * sn];
          ring.push({ p: [p[0] + n[0] * r, p[1] + n[1] * r, p[2] + n[2] * r], n, uv: [len, 0.5 + 0.5 * sn] });
        }
        rings.push(ring);
      });
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) {
        const q0 = rings[i][j], q1 = rings[i][j + 1], q2 = rings[i + 1][j + 1], q3 = rings[i + 1][j];
        G.quad(q0.p, q1.p, q2.p, q3.p, q0.n, col, 3, [q0.uv, q1.uv, q2.uv, q3.uv], [0, phase], [q0.n, q1.n, q2.n, q3.n]);
      }
    };
    for (const [cx, r] of [[-17.5, 1.2], [-12, 1.8], [12, 1.8], [17.5, 1.2]]) {
      const zl = Math.sqrt(PIT_R * PIT_R - cx * cx), ph = rng() * 6, pts = [];
      for (let z = Z_END; z > zl + 12; z -= 24) pts.push([cx + 1.3 * Math.sin(z * 0.017 + ph), r * 0.75, z]);
      pts.push([cx, r * 0.75, zl + 5], [cx, -1.5, zl + 0.4], [cx, -7, zl - r - 0.3], [cx, -32, zl - r - 0.3], [cx, -63, zl - r - 0.3]);
      tube(GC, pts, r, dark, rng());
    }
    await ctx.yield();

    // ---- the pit: an amphitheatre of terraces around the Engine ----
    // The star's light is strongest at its own height and falls away into the depths and up the top terraces
    // (aE.x on stone), and the pit's shadows take extra cold fill (aE.y) so the ring shadows read blue-black.
    {
      const pcol = tint(ash, 0.62), PF = 0.8, uSweep = (th) => uMouth - 0.07 + 0.3 * Math.min(th, TAU - th) / Math.PI;
      const keyY = (y) => lerp(0.15, 1, smoothstep(-470, -40, y)) * lerp(1, 0.5, smoothstep(130, 400, y));
      const dimLine = tint(dark, 0.65);
      const P = (R, y, th) => [R * Math.sin(th), y, R * Math.cos(th)], Nn = (th) => [-Math.sin(th), 0, -Math.cos(th)];
      // band = [y0, y1, cell]: a glyph band; frieze = [y0, y1]: a recessed course of small fossils
      const ringWall = (R, y0, y1, th0, th1, N, col, band, frieze, bayShift = -1) => {
        const cuts = [[y0, 0]], seed = (rng.int(0, 60) + 0.5) / 61;
        if (band) cuts.push([band[0], 1], [band[1], 0]);
        if (frieze) cuts.push([frieze[0], 2], [frieze[1], 0]);
        cuts.sort((p, q) => p[0] - q[0]);
        for (let i = 0; i < N; i++) {
          const ta = lerp(th0, th1, i / N), tb = lerp(th0, th1, (i + 1) / N), na = Nn(ta), nb = Nn(tb);
          for (let r = 0; r < cuts.length; r++) {
            const ya = cuts[r][0], yb = r + 1 < cuts.length ? cuts[r + 1][0] : y1, kind = cuts[r][1];
            const a = P(R, ya, ta), b = P(R, ya, tb), c = P(R, yb, tb), d = P(R, yb, ta), ka = [keyY(ya), PF], kb = [keyY(yb), PF];
            if (kind === 1) {
              const ca = ta * R / band[2], cb = tb * R / band[2], ea = [uSweep(ta), seed], eb = [uSweep(tb), seed];
              GP.quad(a, b, c, d, na, tint(col, 0.5), 1, [[ca, 0], [cb, 0], [cb, 1], [ca, 1]], null, [na, nb, nb, na], [ea, eb, eb, ea]);
            } else if (kind === 2) {
              const sc = 63 / (yb - ya), ua = ta * R * sc, ub = tb * R * sc, v0 = 448.5 + 64 * Math.floor(seed * 9);
              GP.quad(a, b, c, d, na, tint(col, 0.8), 0, [[ua, v0], [ub, v0], [ub, v0 + 63], [ua, v0 + 63]], null, [na, nb, nb, na], [ka, ka, kb, kb]);
            } else {                                      // bays between the buttresses differ a little in tone
              const bay = 0.78 + 0.09 * ((Math.floor((ta + tb) / 2 / TAU * NB + (bayShift < 0 ? 0.5 : bayShift)) * 7 + 3 + Math.round(R / 12) * 3) % 5);
              GP.quad(a, b, c, d, na, tint(col, bay), 0, [[ta * R, ya], [tb * R, ya], [tb * R, yb], [ta * R, yb]], null, [na, nb, nb, na], [ka, ka, kb, kb]);
            }
          }
        }
      };
      const annulus = (R0, R1, y, th0, th1, N, col) => {
        const e = [keyY(y), PF];
        for (let i = 0; i < N; i++) { const ta = lerp(th0, th1, i / N), tb = lerp(th0, th1, (i + 1) / N); GP.quad(P(R0, y, ta), P(R1, y, ta), P(R1, y, tb), P(R0, y, tb), [0, 1, 0], col, 2, null, e); }
      };
      // buttress standing proud of the wall, and a dark doorway framed with light
      const pil = (R, y0, y1, tc, hw, dp, col) => box(GP, makeT(new THREE.Matrix4().makeRotationY(tc)), -hw, hw, y0, y1, R - dp, R + 0.5, col, { skip: 'bot z1', e: [keyY((y0 + y1) / 2), PF] });
      const door = (R, y0, h, tc, hw, e) => {
        const Rd = R - 0.3, da = hw / R, db = (hw + 2.6) / R, n = Nn(tc);
        GP.quad(P(Rd, y0, tc - da), P(Rd, y0, tc + da), P(Rd, y0 + h, tc + da), P(Rd, y0 + h, tc - da), n, tint(pcol, 0.3), 0, null, [0.12, 0.3]);
        lineQ(GP, P(Rd, y0, tc - db), P(Rd, y0 + h + 2.6, tc - db), P(Rd, y0 + h + 2.6, tc - da), P(Rd, y0, tc - da), n, h, e, dark);
        lineQ(GP, P(Rd, y0, tc + da), P(Rd, y0 + h + 2.6, tc + da), P(Rd, y0 + h + 2.6, tc + db), P(Rd, y0, tc + db), n, h, e, dark);
        lineQ(GP, P(Rd, y0 + h, tc - da), P(Rd, y0 + h, tc + da), P(Rd, y0 + h + 2.6, tc + da), P(Rd, y0 + h + 2.6, tc - da), n, 2 * hw, e, dark);
      };
      const NB = 18, below = [[-460, -380, 580], [-380, -300, 605], [-300, -220, 630], [-220, -140, 655], [-140, -60, 680], [-60, 0, PIT_R]];
      below.forEach(([y0, y1, R], i) => {
        const col = tint(pcol, 0.8 + 0.04 * i);
        ringWall(R, y0, y1, 0, TAU, 144, col, i === 5 ? [-42, -27, 15] : null, i === 4 || i === 2 ? [y0 + 26, y0 + 56] : null, i % 2 ? 0 : 0.5);
        if (i < 5) annulus(R, below[i + 1][2], y1, 0, TAU, 120, tint(pcol, 0.85));
        for (let k = 0; k < NB; k++) pil(R, y0, y1, (k + 0.5 + 0.5 * (i % 2)) / NB * TAU, 9, 8, tint(col, 1.24));
        if (i === 3) for (let k = 0; k < NB; k++) door(R, y0 + 3, 40, (k + 0.5) / NB * TAU, 8, [uMouth + 0.04, (k * 5 % NB) / NB]);
      });
      annulus(1, 580, -460, 0, TAU, 48, tint(pcol, 0.6));
      for (const [R, hw] of [[140, 2.2], [290, 2.6], [440, 3]]) for (let i = 0; i < 96; i++) {   // inlaid light rings and spokes on the pit floor
        const ta = i / 96 * TAU, tb = (i + 1) / 96 * TAU, e = [uMouth - 0.02 + 0.0002 * R, 0.37];
        GP.quad(P(R - hw, -459.5, ta), P(R - hw, -459.5, tb), P(R + hw, -459.5, tb), P(R + hw, -459.5, ta), [0, 1, 0], tint(dark, 0.45), 4, [[ta * R, 0], [tb * R, 0], [tb * R, 1], [ta * R, 1]], e);
      }
      for (let k = 0; k < 12; k++) {
        const tc = (k + 0.5) / 12 * TAU, e = [uMouth + 0.02, (k * 5 % 12) / 12];
        for (const [r0, r1] of [[150, 280], [300, 430], [450, 570]]) { const h0 = 2 / r0, h1 = 2 / r1; lineQ(GP, P(r0, -459.5, tc - h0), P(r1, -459.5, tc - h1), P(r1, -459.5, tc + h1), P(r0, -459.5, tc + h0), [0, 1, 0], r1 - r0, e, tint(dark, 0.5)); }
      }
      for (let L = 0; L < 5; L++) {
        const R = lvlR(L), th = Math.asin(lvlX(L) / R), y0 = L * LVL_H, col = tint(pcol, 1 - 0.03 * L);
        ringWall(R, y0, y0 + LVL_H, th, TAU - th, 116, col, L === 1 ? [106, 123, 15] : L === 3 ? [272, 286, 15] : null, L === 0 || L === 2 ? [y0 + 44, y0 + 72] : null);
        if (L < 4) { const Rn = lvlR(L + 1), tn = Math.asin(lvlX(L + 1) / Rn); annulus(R, Rn, y0 + LVL_H, tn, TAU - tn, 116, pcol); }
        for (let k = 0; k < NB; k++) {
          const tp = (k + 0.5) / NB * TAU, tc = k / NB * TAU, e = [uSweep(tc) + 0.02 * L, (k * 7 % NB) / NB];
          if (L < 3 && Math.min(tp, TAU - tp) > th + 0.05) pil(R, y0, y0 + LVL_H, tp, 7, 5, tint(col, 1.22));
          if (k === 0) continue;
          if (k % 2 === 0) {                              // vertical light lines down the terraces
            const hw = 1.8 / R, Rr = R - 0.5;
            lineQ(GP, P(Rr, y0, tc - hw), P(Rr, y0 + LVL_H, tc - hw), P(Rr, y0 + LVL_H, tc + hw), P(Rr, y0, tc + hw), Nn(tc), LVL_H, e, dimLine);
          } else if (L === 0 || L === 2) door(R, y0 + 4, 34, tc, 8, e);
        }
      }
    }
    await ctx.yield();

    // ---- materials and meshes ----
    const time = { value: 0 };
    const keyCol = new THREE.Color(A.keyLight.color).lerp(new THREE.Color(pal[5]), 0.3), hazeCol = new THREE.Color(pal[5]).multiplyScalar(0.55);
    const fillCol = new THREE.Color(PAL[1]).multiplyScalar(9.5); fillCol.b *= 1.4; fillCol.r *= 0.85;
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const SU = {
      ...fogU(), uStar: HU.uStar, uRingN: HU.uRingN, uRingW: HU.uRingW, uShTex: { value: shTex },
      uKey: { value: keyCol }, uFill: { value: fillCol }, uGlyph: { value: glyphCol }, uHaze: { value: hazeCol },
      uProg: { value: 0 }, uTime: time, uKeyI: { value: 1.5 }, uLineK: { value: 1 / dark[1] },
    };
    const stoneMat = new THREE.ShaderMaterial({ uniforms: SU, vertexShader: STONE_VS, fragmentShader: stoneFS(hero.shadowGLSL), fog: true });
    const canyon = new THREE.Mesh(GC.build(), stoneMat), pit = new THREE.Mesh(GP.build(), stoneMat);
    canyon.frustumCulled = pit.frustumCulled = false; scene.add(canyon, pit);

    // shadow decals of the fragments
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(decal.p, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(decal.a, 1)); g.setIndex(decal.ix);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: DECAL_VS, fragmentShader: DECAL_FS, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.renderOrder = 1; m.frustumCulled = false; scene.add(m);
    }
    // dust sheets over the canyon floor
    const hazeU = { ...fogU(), uStar: HU.uStar, uRingN: HU.uRingN, uRingW: HU.uRingW, uShTex: { value: shTex }, uHaze: { value: hazeCol }, uTime: time, uAmt: { value: 0.08 * hazeAmt } };
    {
      const ys = [4, 14, 27], p = [], l = [], ix = [];
      ys.forEach((y, i) => {
        p.push(-CAN_W, y, MOUTH_Z - 25, CAN_W, y, MOUTH_Z - 25, CAN_W, y, Z_END, -CAN_W, y, Z_END); l.push(i, i, i, i);
        ix.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(l, 1)); g.setIndex(ix);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: hazeU, vertexShader: HAZE_VS, fragmentShader: hazeFS(hero.shadowGLSL), fog: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      m.renderOrder = 2; m.frustumCulled = false; scene.add(m);
    }

    // ---- the Wardens: hovering polyhedral drones, one cyan eye each ----
    const nW = rng.int(8, 14), ringForm = rng.chance(0.45);
    let homes = slabs.filter((b) => !b.gate && !b.broken && b.u > 0.05 && b.u < uMouth - 0.04).sort((a, b) => a.u - b.u);
    if (!homes.length) homes = slabs.filter((b) => !b.gate);
    const wardenMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), uStar: HU.uStar, uKey: { value: keyCol }, uFill: { value: fillCol }, uGlyph: { value: glyphCol },
      uBrass: { value: new THREE.Color(PAL[4]).multiplyScalar(0.7) }, uTime: time }, vertexShader: WARDEN_VS, fragmentShader: WARDEN_FS, fog: true });
    const wBody = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), wardenMat, nW);
    // each carries its own small gimbal ring, a pocket echo of the Engine it tends
    const wShell = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.045, 5, 30), wardenMat, nW);
    wBody.frustumCulled = wShell.frustumCulled = false; scene.add(wBody, wShell);
    const set = fx.fxGroup(); scene.add(set.object);
    const eyes = set.add(fx.makeGlows({ time, positions: new Float32Array(nW * 3), color: glyphCol, size: 1.6, intensity: 2.2, flicker: 0.2, spikes: 0.25, halo: 1 }));
    const wardens = [];
    for (let i = 0; i < nW; i++) {
      const side = i % 2 ? 1 : -1, rank = i >> 1, home = homes[Math.min(homes.length - 1, Math.floor(i * homes.length / nW))];
      const an = i / nW * TAU + 0.4;
      wardens.push({ home, ph: rng() * TAU, uj: Math.max(0.03, home.u - 0.13) + rng.range(0, 0.02),
        lat: ringForm ? Math.sign(Math.cos(an) || 1) * Math.max(Math.abs(Math.cos(an)) * 26, 14) : side * (20 + 6 * (rank % 3)), up: ringForm ? Math.sin(an) * 13 - 2 : -6 + 4 * (rank % 3),
        ahead: ringForm ? 40 + 7 * (i % 4) : 34 + 5 * rank, size: rng.range(1.25, 1.75) });
    }

    // ---- air: drifting dust, the star's rays, lens flare ----
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: Math.round(1800 + 1500 * hazeAmt), box: [120, 70, 120],
      size: [0.1, 0.34], colors: ['#ffd27a', '#ffe9c2', '#ffb860'], intensity: 1.3, opacity: 0.6 }));
    const flare = set.add(fx.makeFlare({ position: [0, STAR_Y, 0], color: pal[5], intensity: 0.45, size: 0.3, ghosts: 5 }));

    // ---- the portal's seat: a brass hoop, a gold beacon ring, a slowly turning outer ring of dashes and four
    //      guide lines on the star's axis with pulses running in to the portal ----
    const beaconCol = new THREE.Color(pal[5]).lerp(new THREE.Color('#fff3d8'), 0.4);
    const beaconMat = (o, add) => new THREE.ShaderMaterial({ vertexShader: BEACON_VS, fragmentShader: BEACON_FS, side: THREE.DoubleSide,
      uniforms: { uCol: { value: beaconCol }, uTime: time, uViewH: HU.uViewH, uTube: { value: o.tube }, uGain: { value: o.gain }, uN: { value: o.n }, uSpd: { value: o.spd }, uBase: { value: o.base }, uFade: { value: add ? 1 : 0 } },
      ...(add ? { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } : {}) });
    const seatG = new THREE.Group(); seatG.position.copy(seat); scene.add(seatG);
    const PORTAL_R = 8;
    {
      const hoop = new THREE.InstancedMesh(new THREE.TorusGeometry(PORTAL_R + 2.5, 1.0, 8, 72), wardenMat, 1);
      hoop.setMatrixAt(0, new THREE.Matrix4().setPosition(seat)); hoop.frustumCulled = false; scene.add(hoop);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(PORTAL_R + 4, 0.26, 6, 96), beaconMat({ tube: 0.26, gain: 4, n: 6, spd: 0.22, base: 0.8 }));
      ring.frustumCulled = false; seatG.add(ring);
    }
    let outerR = 23; const tq = new V3();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; if (A.clearance(tq.set(seat.x + Math.cos(a) * outerR, seat.y + Math.sin(a) * outerR, seat.z).sub(off)) < 8) { outerR = 16.5; break; } }
    const outer = new THREE.Mesh(new THREE.TorusGeometry(outerR, 0.2, 6, 120), beaconMat({ tube: 0.2, gain: 3.2, n: 12, spd: 0, base: 0.1 }));
    outer.frustumCulled = false; seatG.add(outer);
    {
      const p = [], n = [], uv = [], ix = [], LEN = 105, r = 0.14, lr = PORTAL_R + 2.5;
      for (let k = 0; k < 4; k++) {
        const a = (k + 0.5) / 4 * TAU, cx = Math.cos(a) * lr, cy = Math.sin(a) * lr, o = p.length / 3;
        for (let e = 0; e < 2; e++) for (let j = 0; j < 4; j++) {
          const b = j / 4 * TAU, nx = Math.cos(b), ny = Math.sin(b);
          p.push(cx + nx * r, cy + ny * r, e ? 0.5 : LEN); n.push(nx, ny, 0); uv.push(e, j / 4);
        }
        for (let j = 0; j < 4; j++) { const j1 = (j + 1) % 4; ix.push(o + j, o + j1, o + 4 + j1, o + j, o + 4 + j1, o + 4 + j); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix);
      const lines = new THREE.Mesh(g, beaconMat({ tube: r, gain: 2.2, n: 3, spd: 0.55, base: 0.3 }, true));
      lines.frustumCulled = false; lines.renderOrder = 3; seatG.add(lines);
    }
    const beacon = set.add(fx.makeGlow({ time, position: [seat.x, seat.y, seat.z], color: beaconCol, size: 30, intensity: 1.2, minAngle: 0.012, flicker: 0.12, spikes: 0.5, halo: 1 }));

    // ---- frame update ----
    const Y = new V3(0, 1, 0), pA = new V3(), pB = new V3(), tg = new V3(), right = new V3(), m4 = new THREE.Matrix4(), mr = new THREE.Matrix4(), sc = new V3();
    const progA = uMouth - 0.3, progB = uRim, hazeK = lerp(hazeAmt, 1, 0.35);
    function update(dt, t, camera, u = 0) {
      time.value = t; SU.uProg.value = u;
      sky.update(dt, t, camera);
      hero.setProgress(clamp((u - progA) / (progB - progA), 0, 1));
      hero.update(dt, t, camera);
      if (!camera) return;
      const d = u * path.length, cone = smoothstep(0.44, 0.54, u);
      // while the Engine is revealed the Wardens keep to the wings: a wide cone around the star is theirs to avoid
      const coneS = smoothstep(uMouth - 0.3, uMouth - 0.2, u) * (1 - smoothstep(uRim - 0.02, uRim + 0.05, u));
      for (let i = 0; i < nW; i++) {
        const w = wardens[i], j = smoothstep(w.uj, w.uj + 0.08, u), leave = smoothstep(0.6, 0.9, u), wide = 1 + 1.5 * smoothstep(uMouth - 0.02, uMouth + 0.12, u), h = w.home;
        const oa = t * 0.35 + w.ph;
        pA.set(h.x + Math.cos(oa) * 10 - h.s * 6, h.H + 7 + 2.2 * Math.sin(t * 0.8 + w.ph), h.z + Math.sin(oa) * 15);
        if (j > 0) {
          const dd = d + w.ahead * (1 - 1.7 * leave);
          path.posAtDist(dd, pB); path.tangentAtDist(dd, tg); right.crossVectors(tg, Y).normalize();
          pB.addScaledVector(right, w.lat * wide * (1 + 1.4 * leave)).y += w.up + 1.6 * Math.sin(t * 0.9 + w.ph * 3);
          pB.x += 1.5 * Math.sin(t * 0.5 + w.ph);
          pA.lerp(pB, j).y += Math.sin(Math.PI * j) * 9;
        }
        if (coneS > 0) {
          tg.subVectors(starW, camera.position).normalize(); right.subVectors(pA, camera.position);
          const al = right.dot(tg);
          if (al > 0) {
            right.addScaledVector(tg, -al); right.y *= 0.35;   // pushed out sideways, not up over the rings
            const pl = right.length(), need = al * 0.42;
            if (pl < 0.01) pA.addScaledVector(right.set(i % 2 ? 1 : -1, 0, 0), coneS * need); else if (pl < need) pA.addScaledVector(right, coneS * (need / pl - 1));
            pA.y -= coneS * 0.1 * al;                          // and a little below the sightline
          }
        }
        if (cone > 0) {                                  // never between the camera and the portal
          tg.subVectors(seat, camera.position).normalize(); right.subVectors(pA, camera.position);
          const al = right.dot(tg);
          if (al > 0) {
            right.addScaledVector(tg, -al); const pl = right.length(), need = al * 0.25;
            if (pl < 0.01) pA.addScaledVector(right.set(i % 2 ? 1 : -1, 0.3, 0), cone * need); else if (pl < need) pA.addScaledVector(right, cone * (need / pl - 1));
          }
        }
        m4.lookAt(pA, camera.position, Y); mr.makeRotationZ(t * 0.5 + w.ph); m4.multiply(mr);
        m4.scale(sc.setScalar(w.size)).setPosition(pA); wBody.setMatrixAt(i, m4);
        m4.makeRotationY(t * 0.7 + w.ph * 2); mr.makeRotationX(1.0 + 0.5 * Math.sin(t * 0.45 + w.ph)); m4.multiply(mr);
        m4.scale(sc.setScalar(w.size * 1.5)).setPosition(pA); wShell.setMatrixAt(i, m4);
        tg.subVectors(camera.position, pA).normalize();
        eyes.setPosition(i, pA.x + tg.x * w.size * 1.05, pA.y + tg.y * w.size * 1.05, pA.z + tg.z * w.size * 1.05);
      }
      wBody.instanceMatrix.needsUpdate = true; wShell.instanceMatrix.needsUpdate = true;
      flare.uniforms.uVisibility.value = 1 - 0.9 * smoothstep(0.56, 0.86, u);
      flare.uniforms.uIntensity.value = lerp(0.15, 0.45, smoothstep(0, 0.07, u));
      // thicker dust down the avenue, so the slabs cut shafts in it; thinner again by the mouth
      hazeU.uAmt.value = hazeK * lerp(0.21, 0.13, smoothstep(0.3, 0.42, u)) * lerp(0.4, 1, smoothstep(0, 0.05, u));
      outer.rotation.z = t * 0.11;
      beacon.uniforms.uIntensity.value = 1.2 * smoothstep(110, 360, camera.position.distanceTo(seat));
      set.update(dt, t, camera);
    }

    return {
      scene, path, duration: 46,
      camera: { fov: 62, near: 0.5, far: 3600, lookAhead: 26, sway: 0.7, bank: 0.8 },
      pois: [
        { at: starW, from: uMouth - 0.14, to: uRim + 0.12, weight: 0.5 },
        { at: rimPt, from: uRim - 0.15, to: uRim + 0.02, weight: 0.3 },
        // over the pit the gaze rests on the star, level and far, with the portal riding below it; only the last
        // run turns fully onto the portal
        { at: starW, from: uRim - 0.17, to: 1.25, weight: 0.72, fade: 0.2 },
        { at: seat, from: uRim - 0.03, to: 1.2, weight: 0.4, fade: 0.1 },
        { at: seat, from: uRim + 0.04, to: 1.3, weight: 0.6, fade: 0.12 },
      ],
      portal: { shape: 'circle', radius: PORTAL_R, color: '#' + beaconCol.getHexString(), glow: 1.6, revealDistance: 340 },
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.55, threshold: 0.9 },
        grade: { saturation: 1.06, contrast: 1.06, tint: '#fff5e4', shadowTint: '#04061a', vignette: 0.42, grain: 0.03, aberration: 0 } },
      update,
      dispose() { hero.dispose?.(); sky.dispose?.(); shTex.dispose(); },
    };
  },
};
