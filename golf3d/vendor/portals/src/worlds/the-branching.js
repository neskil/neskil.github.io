// THE BRANCHING: one unbroken pull-out from a finger-high forest of reindeer lichen on an Arctic boulder,
// past bearberry, a lemming, a ptarmigan and a caribou file, to a ridge above a braided delta that forks as the
// lichen did. Four stages (A lichen x1200, B boulder x30, C tundra x1, D delta x0.12) are each modelled in engine
// metres as the camera meets them, and are scaled about the ground point under the start of each link so that
// rising and shrinking are one motion. Stage D is the hero set piece (src/parts/the-branching.js).
// Variations by seed (ctx.vary.hour honoured): evening after the shower | frost dawn | a slate deck breaking at the
// day's end over an amber band | half moon and aurora; season peak | late August | late September; cast swaps
// (ground squirrel, snowy owl, swans, wolf spider); rare event: a golden eagle comes up under our bows as we drop
// onto the river (nearest 0.52-0.57), every goose lifts and the herd runs.
// The walk-in (lichen to the crest) is the first three tenths; the rest is the flight over the delta.
// Scripted moments, keyed to progress u in the camera path's own frame: lichen garden 0.01, velvet mite 0.06-0.09,
// link 1 0.08-0.11, lemming on its run 0.12, ptarmigan flush 0.14-0.17 (across our bows, belly and both wings
// toward us, 0.155-0.165), link 2 0.17-0.20, the caribou file ten metres to our right 0.21-0.255 (we overtake it: at
// 0.25 its last animals walk just ahead of us, whole in the picture) with the geese across our bows at 0.25, link 3
// up the col 0.26-0.29, the crest and the reveal 0.30 (a skein across the mouth of the saddle), down the sunlit west
// flank of the spur with the whole fork ahead and the gate above on the right 0.30-0.53 (the slowest stretch: about
// fifteen seconds), low along the trunk 0.55-0.64 to the gravel bar by the first fork where a file of caribou wades
// out of the river across our line (0.60-0.64, snow geese level with us), a left turn into the low sun over the two
// arms 0.64-0.73, back east-south-east across the root of the delta with the gate ahead 0.73-0.86, round onto the
// gate's axis and up to it 0.86-0.97, the gate 0.97-1.
// Every pattern in the ground shaders fades to its mean by the size of a pixel on it (fwidth), not by distance, so
// that nothing sparkles while a stage is magnified or shrunk.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { makeHerd, HERD_PRESETS } from '../kit/fauna.js';
import { buildHero, branchGraph, BRANCH_GLSL, FOG_V, FOG_F, FINISH, caribouGeo, CARI_VS, CARI_FS } from '../parts/the-branching.js';

const PAL = ['#DDE3D2', '#A81F2B', '#D8922A', '#6B3A2E', '#C7D5DF', '#3A4350', '#F4DDB8'];
const KA = 40, KB = 30, KC = 1 / 0.12;      // scale steps: A->B, B->C, C->D

const DITHER = /* glsl */`
  float dth=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  if(uFade<=dth) discard;
`;
const ROT = /* glsl */`
vec3 rY(vec3 p,float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z); }
vec3 rX(vec3 p,float a){ float c=cos(a), s=sin(a); return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z); }
vec3 rZ(vec3 p,float a){ float c=cos(a), s=sin(a); return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z); }
`;

// ---- generic lit surface: vertex colour, speckle, wrap light, back light, wet glint, sky rim, cloud shadow
const SURF_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec3 color; attribute vec2 aW;
#ifdef INST
attribute vec4 iPos; attribute vec4 iRot; attribute vec4 iCol;
#endif
uniform vec4 uWind;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec3 vL; varying vec2 vW; varying vec3 vBup;
${FOG_V}
${ROT}
void main(){
  vec3 p=position, n=normal, tint=vec3(1.); float ph=0., sc=1.; vec3 off=vec3(0.);
  vL=position; vBup=vec3(0.,1.,0.);
#ifdef INST
  sc=iPos.w; ph=iRot.w; tint=iCol.rgb; off=iPos.xyz;
  float yaw=iRot.x, pit=iRot.y, bnk=iRot.z;
  #ifdef HOP
    float hp=fract(uTime/max(iCol.w,.5)+ph), j=smoothstep(.88,1.,hp);
    // (yaw and pit come in as the two values the build hands a hop that would have crossed our line: 1 for the
    // opposite heading, and the share of the rise taken off; both are 0 for a hop left as dealt, and then every
    // product below is by one and the sum by nothing. See ROUND 21 (F1) in build)
    off.xz+=vec2(cos(ph*40.),sin(ph*40.))*((j*30.+hp*3.)*(1.-2.*yaw)); off.y+=sin(j*3.1416)*13.*(1.-pit);
    sc*=smoothstep(0.,.07,hp)*(1.-smoothstep(.9,1.,j)); pit=-j*2.5; yaw=3.1416*yaw-ph*40.-1.5708;
  #endif
  #ifdef BIRD
    float side=sign(aW.x), sf=abs(aW.x), fl=sin(ph)*iCol.w;
    float wa=side*(fl*(.3+.9*sf)+.12*sf);
    if(sf>.001){ p=rZ(p,wa); n=rZ(n,wa); }
    p.y-=fl*.04;
    vBup=rY(rX(rZ(rZ(vec3(0.,1.,0.),wa*step(.001,sf)),bnk),pit),yaw);       // which way is up for this wing
  #endif
  p=rY(rX(rZ(p*sc,bnk),pit),yaw)+off;
  n=rY(rX(rZ(n,bnk),pit),yaw);
#endif
#ifndef BIRD
  float g=sin(uTime*uWind.z+ph*6.283+dot(p.xz,vec2(.13,.09))*uWind.y)+.5*sin(uTime*uWind.z*2.3+p.x*uWind.y*.7+ph*11.);
  float gust=vn(p.xz*uWind.w-uTime*vec2(.6,.15));
  p.xz+=vec2(1.,.3)*g*aW.x*uWind.x*sc*(.3+gust);
#endif
  vP=p; vN=n; vCol=color*tint; vW=aW;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const SURF_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform vec4 uMatA; uniform vec4 uMatB; uniform float uFade;
varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec3 vL; varying vec2 vW; varying vec3 vBup;
void main(){
  ${DITHER}
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  vec3 toC=uCamL-vP; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
  float f=uMatA.y;
  float s1=vn(vL.xy*f+vL.z*f*1.37), s2=vn(vL.zy*f*3.3+vL.x*f*2.1+9.);
  vec3 alb=vCol*(1.+uMatA.x*((s1*.65+s2*.35)*2.-1.));
  float bh=s1*.6+s2*.4;
  vec3 dpx=dFdx(vP), dpy=dFdy(vP); float bx=dFdx(bh), by=dFdy(bh);
  vec3 r1=cross(dpy,N), r2=cross(N,dpx); float det=dot(dpx,r1);
  vec3 pb=(bx*r1+by*r2)*(sign(det)/max(abs(det),1e-7))*(uMatA.x*1.2/max(f,.05)/(1.+dist*.04));
  pb*=min(1.,.8/max(length(pb),1e-4));
  N=N-pb; N/=max(length(N),1e-4);
#ifdef BIRD
  float tipw=0.;
#else
  float tipw=smoothstep(.3,.9,vW.x);
#endif
  alb=mix(alb,vec3(.78,.84,.92),uMatB.w*tipw);
#ifdef BIRD
  // seen from below a wing is grey (below in the bird's own frame: it may be banked), the body darkens underneath
  float wmk=smoothstep(.012,.03,abs(vW.x)), und=smoothstep(0.,.3,-dot(V,vBup/max(length(vBup),1e-4)));
  alb*=mix(vec3(mix(.6,1.,smoothstep(-.45,.15,N.y))),mix(vec3(1.),vec3(.5,.52,.58),und),wmk);
  if(uMatB.w>0.){                                             // rows of overlapping feathers across the wing
    float ff=uMatB.w, wm=smoothstep(.012,.03,abs(vW.x)), fz=vL.z*ff*.75, fx=abs(vL.x)*ff+.5*mod(floor(fz),2.);
    float lf=clamp(1.3-(fwidth(vL.x)+fwidth(vL.z))*ff*2.2,0.,1.), ge=min(fract(fx),1.-fract(fx));
    alb*=mix(1.,mix(.88,(.72+.28*smoothstep(0.,.4,fract(fz)))*(.8+.2*smoothstep(0.,.1,ge)),lf),wm);
  }
#endif
  float cs=cloudShadow(vP.xz), ao=vW.y;
  float ndl=dot(N,uSunL), w=uMatB.z;
  float diff=max((ndl+w)/(1.+w),0.);
  float back=pow(max(dot(-V,uSunL),0.),2.)*uMatB.x*(.4+.6*max(-ndl,0.));
  vec3 col=alb*(uSunCol*(diff+back)*cs*(.5+.5*ao)+uSkyCol*(.62+.62*N.y)*ao+(uPal[1]*.07+uPal[6]*.04)*(1.-N.y)*ao);
  vec3 Hh=uSunL+V; Hh/=max(length(Hh),1e-4);
  float sp=pow(max(dot(N,Hh),0.),uMatA.w)*uMatA.z*cs;
  col+=uSunCol*sp*(.3+.7*s2)*(1.+2.*uMatB.w*tipw);
  float rim=pow(1.-max(dot(N,V),0.),3.);
  col+=(uSkyCol*.8+uSunCol*.3*cs*max(dot(-V,uSunL)*.5+.5,0.))*rim*uMatB.y*ao;
#ifdef LEAF
  {
    // (round 10) a leaf in the shade carries the sky: slate-blue fill, strongest along its raised edges and at its tip
    float shd=max(.3*(1.-smoothstep(.08,.5,(diff+back)*cs*(.5+.5*ao))),1.-smoothstep(.02,.07,dot(col,vec3(.2126,.7152,.0722))));
    float edge=clamp(pow(1.-abs(dot(N,V)),2.)*.8+smoothstep(.7,1.,vW.y)*.5,0.,1.);
    col+=vec3(.32,.7,.9)*dot(uSkyCol,vec3(.3,.5,.2))*shd*(.8+.2*ao)*(.125+.07*edge);
  }
#endif
  float alpha=1.;
  ${FINISH}
}`;

// ---- dew, drops and still water: a mirror ball with a flipped sky inside, a bright rim and a sun spark
const DEW_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec4 iPos; attribute vec4 iRot;
uniform float uUT;
varying vec3 vP; varying vec3 vN; varying vec3 vL; varying float vVis;
${FOG_V}
void main(){
  vec3 p=position, n=normal; float sc=iPos.w, vis=1.; vec3 c=iPos.xyz; vL=position;
#ifdef DROP
  // iRot = (fall height, period, phase, keyed-to-progress flag); drops fall slowed, at 60 m/s
  float tf=iRot.x/60., tt=mix(fract(uTime/max(iRot.y,.1)+iRot.z)*iRot.y,uUT+tf,iRot.w);
  #ifdef CROWN
    // a ring of droplets thrown up where the drop lands: position.x carries nothing, aK the ring index
    float k=tt-tf, life=1.2;
    float r0=fract(sin(dot(c.xz,vec2(12.9,78.2)))*437.5);
    vec2 dir=vec2(cos(r0*6.283),sin(r0*6.283));
    vis=step(0.,k)*step(k,life);
    float kk=clamp(k,0.,life);
    c.xz+=dir*(2.+r0*3.)*kk*3.2; c.y+=kk*(17.+9.*r0)-kk*kk*22.;
    sc*=(1.-kk/life*.6);
  #else
    vis=step(tt,tf); c.y+=iRot.x-60.*min(tt,tf);
    p.y*=1.25; p.xz*=.9+.06*sin(uTime*9.+iRot.z*30.);
  #endif
#else
  p*=1.+.035*sin(uTime*(5.+3.*iRot.w)+iRot.w*30.+position.yxz*2.);       // trembling
#endif
  p=p*sc*vis+c;
  vP=p; vN=n; vVis=vis;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const DEW_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform float uFade; uniform vec3 uUnder;
varying vec3 vP; varying vec3 vN; varying vec3 vL; varying float vVis;
void main(){
  ${DITHER}
  if(vVis<.5) discard;
  vec3 N=vN/max(length(vN),1e-4);
  vec3 toC=uCamL-vP; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
#ifdef RIPPLE
  float rr=length(vL.xz), wv=sin(rr*9.-uTime*3.)*.5+sin(rr*17.-uTime*4.3+2.)*.3;
  vec2 rd=vL.xz/max(rr,1e-3); N=vec3(rd.x*wv*.16,1.,rd.y*wv*.16); N/=max(length(N),1e-4);
#endif
  float ndv=max(dot(N,V),0.);
  vec3 R=reflect(-V,N);
  vec3 up=R; up.y=abs(up.y)+.02; up/=max(length(up),1e-4);
  vec3 refl=skyMirror(up);
#ifdef RIPPLE
  vec3 col=refl*(.25+.75*pow(1.-ndv,2.))+uUnder*.35*ndv;
#else
  // the world upside-down inside the drop: sky below, the dark red ground above
  vec3 d=-R; float sk=smoothstep(-.15,.25,-d.y);
  vec3 dd=vec3(d.x,abs(d.y)+.05,d.z); dd/=max(length(dd),1e-4);
  vec3 inside=mix(uUnder,skyMirror(dd)*.9,sk);
  float fres=pow(1.-ndv,2.2);
  vec3 col=inside*(1.-fres*.7)+refl*(.12+fres*.95);
  col+=uHorizCol*.5*pow(max(dot(N,-uSunL),0.),6.)*(.3+ndv);      // light gathered on the far side
#endif
  float cs=cloudShadow(vP.xz);
  col+=uSunCol*5.*pow(max(dot(R,uSunL),0.),160.)*cs;
  col+=uSunCol*.5*pow(max(dot(R,uSunL),0.),12.)*cs;
  float alpha=1.;
  ${FINISH}
}`;

// ---- ground and rock: one fragment shader, four looks (MODE 0 lichen crust, 1 bearberry mat, 2 tundra bench, 3 granite)
const TERR_VS = /* glsl */`
attribute float aAO; varying vec3 vP; varying vec3 vN; varying float vAO;
${FOG_V}
void main(){
  vP=position; vN=normal; vAO=aAO;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const TERR_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform float uFade; uniform vec4 uPatch; uniform vec4 uRun; uniform vec4 uHeath; uniform vec3 uTint; uniform float uTexS;
varying vec3 vP; varying vec3 vN; varying float vAO;
vec2 vor(vec2 p){
  vec2 i=floor(p), f=fract(p); float d1=9., d2=9., id=0.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y)); vec2 r=g+vec2(h21(i+g),h21(i+g+57.3))*.8+.1-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=h21(i+g+11.7); } else if(d<d2){ d2=d; }
  }
  return vec2(sqrt(d2)-sqrt(d1),id);
}
// x = gap between the two nearest cells, y = the cell's id, zw = from the cell's centre to here
vec4 cells(vec2 p){
  vec2 i=floor(p), f=fract(p), rb=vec2(0.); float d1=9., d2=9., id=0.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y)); vec2 r=g+vec2(h21(i+g),h21(i+g+57.3))*.8+.1-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=h21(i+g+11.7); rb=r; } else if(d<d2){ d2=d; }
  }
  return vec4(sqrt(d2)-sqrt(d1),id,-rb);
}
#define LD(f) clamp(1.3-fw*(f)*2.6,0.,1.)
#if MODE == 2
#define AMB 1.45
#define GLOW .15
#define WRAP .22
#else
#define AMB 1.
#define GLOW .09
#define WRAP 0.
#endif
void main(){
  ${DITHER}
  vec3 P=vP; vec3 Ng=vN/max(length(vN),1e-4); if(!gl_FrontFacing) Ng=-Ng;
  vec3 toC=uCamL-P; float dist=length(toC); vec3 V=toC/max(dist,1e-3);
  vec3 alb; float hgt, wet, bumpK, flatK=0., poolK=0.;
  // every pattern fades to its mean where a pixel is too big for it (fw = stage metres per pixel), so nothing sparkles
  float fw=length(fwidth(P));
#if MODE == 0
  vec2 p=P.xz;
  float la=clamp(1.4-fw*4.5,0.,1.), lb=clamp(1.4-fw*5.5,0.,1.), lc=LD(.14);   // the squamule mosaic is for near: ten pixels a scale reads as brickwork
  flatK=smoothstep(.1,.38,min(length(dFdx(P)),length(dFdy(P))));
  Ng=normalize(mix(Ng,vec3(0.,1.,0.),.85*flatK));
  float n1=fbm(p*.012+3.), n2=mix(.5,vn(p*.05+3.),LD(.05));
  vec2 v=vor(p*.3+fbm(p*.05)*1.5);
  vec2 v2=vor(p*1.1+4.);
  vec3 sq=mix(uPal[0]*.5,vec3(.36,.44,.34),mix(.5,v.y,la)*.8);
  sq=mix(sq,uPal[0]*.62,mix(.4,smoothstep(.25,.5,v.x),la)*.5);
  sq*=.66+.34*mix(.78,smoothstep(0.,.22,v.x),la);
  sq*=.8+.3*mix(.72,smoothstep(0.,.3,v2.x),lb);
  float bare=smoothstep(.5,.62,n1+.25*n2);
  vec2 t=vor(p*.14+7.);
  vec3 gran=mix(vec3(.24,.24,.27),vec3(.46,.43,.4),mix(.5,vn(p*.6),la))*(.82+.25*mix(.5,vn(p*1.7),LD(1.7)));
  float tile=mix(.86,smoothstep(0.,.1,t.x),lc);
  vec3 mapl=mix(vec3(.4,.43,.12),vec3(.28,.35,.1),mix(.5,t.y,lc))*(.8+.3*mix(.5,vn(p*2.),LD(2.)))*tile+vec3(.015)*(1.-tile);
  vec3 rockc=mix(gran,mapl,smoothstep(.5,.66,vn(p*.025+11.)));
  alb=mix(sq,rockc,bare);
  hgt=mix(mix(.75,smoothstep(0.,.3,v.x),la)*1.6+mix(.5,v.y,la)*.6+mix(.3,v2.x,lb)*.5,mix(.3,t.x,lc)*.6+mix(.5,vn(p*3.),LD(3.))*.4,bare);
  wet=.35; bumpK=.4*clamp(1.15-fw*6.,0.,1.);     // the areoles' relief is for near: far off it lights each one like a brick
#elif MODE == 1
  // the bearberry mat: leaves near, and at any distance a patchwork that is not one plant: crimson bearberry, stands
  // gone claret, russet and gold where it has turned, green-black crowberry, grey lichened stones flush with the mat
  // and dark wet soil between. The patches fade by pixel size like everything else, the big ones last.
  vec2 p=P.xz;
  vec2 sdir=uSunL.xz/max(length(uSunL.xz),1e-3);
  float reg=vn(p*.05+2.);
  float ca=cos(reg*5.), sa=sin(reg*5.);
  vec2 q=vec2(ca*p.x+sa*p.y,-sa*p.x+ca*p.y);
  vec2 v=vor(vec2(q.x*1.5,q.y*.75)+fbm(p*.2)*.8);
  vec2 vb=vor(vec2(q.y*1.3,q.x*.7)+9.);
  float ll=LD(1.3);
  float lf=mix(.8,smoothstep(0.,.16,v.x),ll), ly=mix(.5,v.y,ll);
  float lpA=clamp(1.3-fw*.22,0.,1.), lpB=clamp(1.3-fw*.7,0.,1.);
  float a1=vn(p*.12+41.), a2=fbm(p*.03+5.), a3=vn(p*.36+13.), a3s=vn((p+sdir*1.1)*.36+13.), a4=vn(p*.17+77.);
  float pick=a1*.62+a3*.38;
  vec3 leaf=mix(uPal[1]*.42,uPal[1]*.95+vec3(.08,0.,0.),ly);
  leaf=mix(leaf,uPal[2]*.75,step(.93,v.y)*ll);
  leaf=mix(leaf,vec3(.28,.05,.07),step(v.y,.12)*ll);
  leaf=mix(leaf,leaf*vec3(.5,.42,.5),smoothstep(.42,.62,a2)*.7);
  leaf=mix(leaf,vec3(.4,.13,.045)*(.65+.7*ly),smoothstep(.5,.56,pick)*.85*lpA);
  leaf=mix(leaf,uPal[2]*.6*(.65+.7*ly),smoothstep(.62,.67,pick)*.85*lpA);
  leaf=mix(leaf,vec3(.035,.06,.03)*(.6+.9*ly),smoothstep(.6,.67,a4*.7+a3*.3)*.9*lpA);
  leaf=mix(leaf,vec3(.16,.26,.1)+leaf*.3,uGreen*.8*step(.35,fract(v.y*7.3)));
  float lee=clamp((a3s-a3)*4.,-1.,1.);
  leaf*=1.-(.34*max(lee,0.)-.2*max(-lee,0.))*lpB;
  vec3 under=mix(vec3(.05,.035,.03),uPal[3]*.3,mix(.5,vb.y,ll))*(.5+.5*mix(.8,smoothstep(0.,.2,vb.x),ll));
  float soil=max(smoothstep(.5,.6,a2*.75+.25*vn(p*.4)+.1*(.5-a1)),smoothstep(.66,.74,vn(p*.5+3.)*.7+a1*.3)*lpB);
  alb=mix(mix(under,leaf,lf),under*1.3+vec3(.02),soil*.85);
  vec2 sg=vor(p*.1+3.3+(a3-.5)*.25);
  float isP=step(.9,sg.y);                                   // some of the hollows hold rain: pools with the sky in them
  float stn=step(.78,sg.y)*(1.-isP)*smoothstep(.16,.26,sg.x)*lpA;
  float pool=isP*smoothstep(.17,.25,sg.x+(a3-.5)*.08)*lpA;
  vec3 stc=mix(vec3(.3,.3,.32),vec3(.4,.43,.2),smoothstep(.45,.65,vn(p*.8+5.)))*(.8+.35*mix(.5,vn(p*3.1),LD(3.1)))*(.75+.25*smoothstep(.16,.5,sg.x));
  alb=mix(alb,stc,stn);
  alb=mix(alb,vec3(.03,.028,.03),pool);
  alb*=1.-.45*step(.78,sg.y)*(1.-smoothstep(.1,.2,sg.x))*smoothstep(.02,.1,sg.x)*lpA;      // the dark seam where a stone meets the mat
  vec2 ra=uRun.xy, ab=uRun.zw-uRun.xy; float hh=clamp(dot(p-ra,ab)/max(dot(ab,ab),1e-3),0.,1.);
  float rd=length(p-ra-ab*hh)+(vn(p*.3)-.5)*1.5;
  float run=1.-smoothstep(1.2,2.8,rd);
  alb=mix(alb,mix(vec3(.3,.24,.14),uPal[6]*.42,mix(.5,vn(p*1.7),LD(1.7))),run*.9);
  float snw=uSnow*smoothstep(.56,.8,fbm(p*.08+70.)+.25*(1.-lf))*(.45+.4*(1.-lf));
  alb=mix(alb,vec3(.72,.76,.84),snw);
  float gu=vn(p*.045-uTime*vec2(.42,.12)); alb*=.86+.3*gu*lf;
  poolK=pool*(1.-snw)*(1.-run);
  hgt=(lf*(1.-run)*(1.-stn)+mix(.3,vb.x,ll)*.4)*(1.-pool); wet=(.9*lf*(1.-run)+.1)*(1.-snw)*(.6+.8*gu)*(1.-.7*stn)*(1.-.6*soil); bumpK=.16*(1.-.7*snw);
#elif MODE == 2
  // the tundra bench and the slope above it. Plants are separate clumps, never a wash: thickets a few metres across,
  // shrub mounds a metre and a half across and a ground of small cushions, each of one species and one colour (gold
  // willow, orange birch, crimson bearberry, russet cottongrass, pale lichen, green-black crowberry), each lit on its
  // sunward side, with dark soil in the gaps. On the slope: scree with boulders, grey outcrops that shade the ground
  // beside them, dark gullies down the fall line. Nothing here follows a contour.
  vec2 p=P.xz;
  vec2 sdir=uSunL.xz/max(length(uSunL.xz),1e-3);
  vec2 gd=Ng.xz/max(length(Ng.xz),1e-3); float cz=mix(p.x,p.y,gd.x*gd.x);
  vec3 t=mix(tundraCol(p*.7+vec2(40.,0.),fw*.7),tundraCol(p*4.5+vec2(11.,70.),fw*4.5),.55)*1.3;   // a patchwork at two sizes
  float c1=mix(.5,vn(p*1.3+3.),LD(1.3)), c2=mix(.5,vn(p*3.7+11.),LD(3.7)), c3=mix(.5,vn(p*9.+5.),LD(9.));
  vec3 gold=uPal[2]*.6, oran=vec3(.5,.19,.05), crim=uPal[1]*.66, rus=uPal[3]*.52, pale=mix(uPal[0],uPal[6],.35)*.45, dkg=vec3(.05,.07,.035);
  float com=vn(p*.045+31.), com2=vn(p*.11+17.);
  vec2 pwb=p+(vec2(vn(p*.9+3.),vn(p*.9+17.))-.5)*.7;                 // no clump is a circle
  vec4 kc=cells(p*.17+fbm(p*.05)*1.1), ka=cells(pwb*.6+fbm(p*.17)*.7), kb=cells(pwb*1.9+7.), kd=cells(p*.055+fbm(p*.02+9.)*1.3+23.);
  vec4 kl=cells(pwb*6.1+3.);                                    // sprays of leaves a hand across
  float fwg=sqrt(length(dFdx(P))*length(dFdy(P)));              // ground seen aslant: a pixel is long but narrow, and a mound still shows
  float lkC=clamp(1.6-fw*.5,0.,1.), lkA=clamp(1.5-fwg*3.2,0.,1.), lkB=clamp(1.5-fwg*5.,0.,1.), lkD=clamp(1.6-fw*.16,0.,1.);
  float lkL=clamp(1.5-fwg*15.,0.,1.), lkCr=clamp(1.5-fwg*1.9,0.,1.);
  // a thicket is whole shrubs: each crown belongs to the thicket its own middle stands in, so the outline of a thicket
  // is the outline of its outermost crowns (far off, where a crown is under a pixel, it is a soft blot)
  vec4 kcc=cells((p-ka.zw/.6)*.17+fbm(p*.05)*1.1);
  float qc=fract(mix(kc.y,kcc.y,lkCr)*2.31+com*1.2), qa=fract(ka.y*3.17+com*1.6+qc*.35), qb=fract(kb.y*5.71+com2*1.3);
  vec3 cC=mix(crim,gold,step(.3,qc)); cC=mix(cC,rus,step(.5,qc)); cC=mix(cC,oran,step(.66,qc)); cC=mix(cC,pale,step(.8,qc)); cC=mix(cC,dkg*2.,step(.93,qc));
  vec3 cA=mix(crim,gold,step(.3,qa)); cA=mix(cA,oran,step(.5,qa)); cA=mix(cA,rus,step(.68,qa)); cA=mix(cA,dkg,step(.84,qa)); cA=mix(cA,crim*1.2,step(.92,qa));
  vec3 cB=mix(pale,rus,step(.34,qb)); cB=mix(cB,crim*.8,step(.56,qb)); cB=mix(cB,gold*.8,step(.76,qb)); cB=mix(cB,dkg,step(.9,qb));
  cC*=.8+.4*fract(kc.y*4.3); cA*=.75+.5*fract(ka.y*7.7); cB*=.8+.4*fract(kb.y*9.1);
  cC=mix(cC,vec3(.14,.24,.09)+cC*.3,uGreen*.7*step(.3,fract(kc.y*6.1)));
  cA=mix(cA,vec3(.14,.24,.09)+cA*.3,uGreen*.7*step(.35,fract(ka.y*5.3))); cB=mix(cB,vec3(.12,.22,.08)+cB*.3,uGreen*.6*step(.4,fract(kb.y*3.3)));
  // the outline of a plant is leaves, not a compass line: every edge is broken at the size of a spray and of a leaf
  float rg1=vn(p*4.3+7.)-.5, rg2=(mix(.5,vn(p*11.+2.),lkB)-.5);
  float rC=length(kc.zw)+(vn(p*.45+5.)-.5)*.16+(vn(p*1.3+2.)-.5)*.1, rA=length(ka.zw), rB=length(kb.zw);
  float szB=.33+.15*fract(kb.y*6.7);
  float blobC=1.-smoothstep(.34,.44,rC);
  float blobA=smoothstep(.03,.13,ka.x+rg1*.1+rg2*.06)*(1.-smoothstep(.5,.66,rA+rg1*.16+rg2*.08));       // one shrub, a dark seam round it
  float blobB=smoothstep(.02,.1,kb.x+rg2*.05)*(1.-smoothstep(szB*.9,szB*1.25,rB+rg2*.1));               // one cushion
  float inT=1.-smoothstep(.34,.42,length(kcc.zw)+(fract(ka.y*13.3)-.5)*.16);
  float thk=mix(blobC,inT*blobA,lkCr);
  float domeC=1.-smoothstep(0.,.44,rC), domeB=1.-smoothstep(0.,szB,rB);
  float sideC=dot(kc.zw/max(length(kc.zw),1e-3),sdir), sideA=dot(ka.zw/max(rA,1e-3),sdir), sideB=dot(kb.zw/max(rB,1e-3),sdir);
  float litA=(1.+.3*sideA*smoothstep(.12,.5,rA))*(.95-.25*(1.-smoothstep(0.,.3,rA)));                  // lit on its sunward side, dark at the core
  vec3 soil=vec3(.06,.045,.035)+rus*.12;
  vec3 mB=(pale*.3+rus*.2+crim*.14+gold*.13+dkg*.08)*.8+soil*.25;
  vec3 grd=mix(mB,mix(soil,cB*(1.+.22*sideB*(1.-domeB*.6))*(.75+.25*domeB),blobB),lkB);                  // the cushions
  float has=step(.3,fract(ka.y*9.7+com*.5));                                                             // most cells hold a shrub, the rest are open cushion ground
  // a shrub of the mat: its own colour, a third of its sprays another plant grown through it, every spray of its own tone
  vec3 shr=mix(cA,cB,step(.68,fract(kb.y*4.7+ka.y*3.))*.7*lkB);
  shr*=mix(1.,(.72+.5*fract(kb.y*9.1))*(.7+.3*smoothstep(0.,.12,kb.x)),lkB)*litA;
  shr=mix(shr,(rus*.7+dkg)*.8,.2);                             // the mat is duller than the bushes that stand on it
  vec3 nearc=mix(grd,mix(soil*(.75+.5*kl.y),shr,blobA),has);
  float lfT=(.68+.6*kl.y)*(1.-.6*(1.-smoothstep(.03,.15,kl.x)));
  nearc*=mix(1.,lfT,lkL);
  nearc=mix(nearc,soil*.8,step(.88,fract(kl.y*5.3))*lkL*.7);  // a gap through to the litter here and there
  vec3 thick=mix(cC,cA,.3*lkCr)*(1.+.18*sideC*(1.-domeC*.5))*(.78+.22*domeC);
  thick*=mix(1.,(.8+.4*fract(ka.y*4.9))*litA,lkCr);
  // far off the ground is still plants, not a wash: stands of one species some tens of metres across with dark
  // ground between them, and on those the thickets, each with a lit and a shadowed side
  float qd=fract(kd.y*3.71+com*.9);
  vec3 cD=mix(crim,rus,step(.34,qd)); cD=mix(cD,gold*.9,step(.56,qd)); cD=mix(cD,crim*.62,step(.72,qd)); cD=mix(cD,pale,step(.88,qd));
  cD=mix(cD,vec3(.14,.24,.09)+cD*.3,uGreen*.7*step(.3,fract(kd.y*6.1)));
  float edD=smoothstep(.03,.16,kd.x+(c1-.5)*.1);
  vec3 stand=mix(t,mix(soil*1.6+t*.25,cD*(.74+.4*fract(kd.y*8.3)),edD),.8*lkD);
  // between the thickets: the low crowns of single shrubs, dark between them
  vec3 opn2=stand*.5*mix(1.,mix(.6,.82+.45*fract(ka.y*4.9),blobA),lkCr);
  vec3 farc=mix(stand,mix(opn2,mix(thick,stand,.25),thk),lkC);
  vec3 tc=mix(farc,mix(nearc,thick,.3*thk),lkA);
  tc*=.9+.16*c2*(.5+c3);
  float m1=mix(.5,vn(p*27.+9.),LD(27.)), m2=mix(.5,vn(p*80.+3.),LD(80.));        // leaf and litter grain, seen magnified or from a metre up
  tc*=.82+.22*m1+.14*m2;
  float hb=1.-smoothstep(uHeath.y*.6,uHeath.y,abs(p.x-uHeath.x)+(fbm(p*.03)-.5)*14.);
  hb=max(hb,smoothstep(.55,.67,fbm(p*.011+31.)+(fract(kc.y*7.3)-.5)*.12*lkC)*smoothstep(.87,.95,Ng.y));
  // lichen heath: reindeer lichen in cushions, each a little paler or greyer than the next with a dark seam of litter
  // between; grey-green patches among the cream; russet tufts and dark crowberry here and there
  vec3 heath=mix(uPal[0],uPal[6],.35)*(.35+.1*mix(.5,vn(p*2.3),LD(2.3)))*(.85+.2*vn(p*.4));
  heath*=mix(1.,(.8+.4*vn(pwb*2.3+5.))*(.88+.2*domeB)*(1.+.12*sideB*(1.-domeB))*(.86+.14*smoothstep(0.,.07,kb.x+rg2*.04)),lkB);   // soft mounds, lit on the sunward side (a cushion of one flat tone with a seam round it reads as a cobble)
  heath=mix(heath,heath*vec3(.74,.86,.74),smoothstep(.5,.62,vn(p*.7+41.))*.7);
  heath=mix(heath,soil*1.5+rus*.25,(1.-smoothstep(.0,.1,ka.x+rg1*.12))*.5*lkA*smoothstep(.45,.6,vn(p*.31+13.)));     // litter between the patches, here and there (all round every patch it reads as paving)
  heath=mix(heath,uPal[3]*.42,.5*mix(.2,smoothstep(.6,.8,vn(p*.9+7.)),LD(.9)));
  heath=mix(heath,mix(uPal[3]*.55,dkg*1.6,step(.93,fract(kb.y*3.7))),blobB*step(.76,fract(kb.y*3.7))*lkB*.85);
  heath*=mix(1.,.86+.3*kl.y,lkL)*(.88+.16*m1+.1*m2);
  tc=mix(tc,heath,hb*.9);
  // caribou trails: a few winding lines on the level ground, and the herd's own trodden line (two ruts that part and
  // join) along the heath lane
  float flatg=smoothstep(.955,.99,Ng.y);
  float trn=(fbm(p*.018+3.)*2.+vn(p*.05+9.)*.4)*2.4, trw=abs(fract(trn)-.5);
  float trm=trw/max(fwidth(trn),1e-5)*fw;
  float trail=(1.-smoothstep(.22,.42+fw,trm))*flatg*clamp(1.4-fw*1.6,0.,1.)*smoothstep(.3,.5,vn(p*.012+60.));
  float hxl=p.x-(uHeath.x-.4+1.1*sin(p.y*.03));
  float rut=max(1.-smoothstep(.14,.3+fw*.5,abs(hxl+(vn(p*.5)-.5)*.5)),(1.-smoothstep(.1,.24+fw*.5,abs(hxl-1.3-(vn(p*.19+4.)-.5)*2.)))*.8);
  trail=max(trail,rut*flatg*clamp(1.5-fw*1.1,0.,1.)*uHeath.z);
  tc=mix(tc,vec3(.11,.085,.065),trail*.7);
  // rain stands in the hollows of the level ground: pools with a dark wet rim, the sky in them
  float plN=vn(p*.085+77.)*.62+vn(p*.27+5.)*.38, plF=smoothstep(.972,.99,Ng.y)*(1.-hb*.8)*(1.-trail);
  float pool2=smoothstep(.655,.68,plN)*plF;
  tc=mix(tc,tc*.45,smoothstep(.6,.655,plN)*plF);
  tc=mix(tc,vec3(.03,.028,.03),pool2);
  vec2 rv=vor(p*.19+11.); vec2 st=vor(p*2.2); float ls=LD(2.2);
  float ring=(1.-smoothstep(.04,.12,rv.x))*smoothstep(.45,.6,vn(p*.012+8.))*LD(.7)*smoothstep(.975,.995,Ng.y)*smoothstep(.45,.6,vn(p*.13+31.));   // sorted stones on dead-level ground, in broken arcs: never a net
  vec3 stone=mix(vec3(.24,.24,.25),uPal[4]*.42,mix(.5,st.y,ls))*(.45+.55*mix(.75,smoothstep(0.,.2,st.x),ls));
  tc=mix(tc,stone,ring);
  // scree: stones near; at a distance boulders with a lit and a shadowed side, runs of older lichened stone, tongues of tundra
  vec2 sv=vor(p*1.5+5.+(vn(p*.8)-.5)*.7), sv2=vor(p*4.3+1.); float l15=clamp(1.4-fwg*4.5,0.,1.), l43=LD(4.3);
  float big=smoothstep(.35,.65,vn(p*.23+9.));               // blocks here, fine rubble there
  float old=fbm(p*.023+61.);
  float scr=1.-smoothstep(.82,.93,Ng.y+(vn(p*.08)-.5)*.08);
  scr*=smoothstep(.25,.6,vn(p*.11+3.)+.55*scr);
  // tongues of scree run down the fall line onto the gentler ground below, each with an edge
  scr=max(scr,smoothstep(.57,.65,vn(vec2(cz*.085+old*1.5,P.y*.03+7.))+(vn(p*.37+5.)-.5)*.16)*(1.-smoothstep(.93,.985,Ng.y))*.92);
  scr=max(scr,(1.-smoothstep(uPatch.x-50.,uPatch.x+10.,P.z))*smoothstep(.47,.6,fbm(p*.017+41.))*.92);   // boulder fields up the col
  vec3 scc=mix(vec3(.25,.245,.26),vec3(.44,.41,.385),mix(.5,sv.y,l15))*(1.-.15*big*mix(.25,1.-smoothstep(0.,.14,sv.x),l15))*(1.-.22*(1.-.6*big)*mix(.3,1.-smoothstep(0.,.22,sv2.x),l43))*(.85+.3*mix(.5,vn(p*7.),LD(7.)));
  scc=mix(scc,vec3(.36,.4,.13),step(.84,sv2.y)*.55*l43);
  float lbl=clamp(1.3-fw*1.3,0.,1.), bA=vn(p*.62+21.), bAs=vn((p+sdir*.7)*.62+21.), leeS=clamp((bAs-bA)*4.5,-1.,1.);
  scc*=1.-(.38*max(leeS,0.)-.22*max(-leeS,0.))*lbl;
  scc*=mix(vec3(.64,.66,.75),vec3(1.1,1.05,.96),smoothstep(.35,.65,old));
  scc*=mix(.8,1.08,smoothstep(.4,.6,vn(vec2(cz*.11+old*2.,P.y*.04+3.))+(vn(p*.5+9.)-.5)*.2));          // runs of fresh and of weathered stone down the fall line
  // stones a metre across, each with a lit side and a dark gap round it; far off, separate blocks the size of a hut,
  // each with a lit side and a shadow thrown down-sun
  float szS=.13+.3*fract(ka.y*5.9)*fract(ka.y*5.9), stA=(1.-smoothstep(szS*.75,szS,rA+rg1*.12))*step(.45,fract(ka.y*7.1));   // (of mixed size and not in every cell: evenly, they read as cobbles)
  scc*=mix(1.,mix(.68,(.8+.5*fract(ka.y*3.9))*(1.+.4*sideA),stA),lkA*.9);
  float rK=length(kc.zw), bz=.15+.15*fract(kc.y*5.7), isB=step(.4,fract(kc.y*13.1)), bl=(1.-smoothstep(bz*.8,bz,rK+rg1*.03))*isB;
  float blS=(1.-smoothstep(bz*.8,bz*1.7,length(kc.zw+sdir*bz*1.4)))*isB*(1.-bl);
  scc*=mix(1.,(.85+.45*fract(kc.y*3.3))*(1.+.45*sideC),bl*lkC*(1.-.5*lkA));
  scc*=1.-.45*blS*lkC*(1.-.5*lkA);
  float chute=smoothstep(.52,.74,vn(vec2(cz*.045+old*2.,P.y*.016+3.))+(vn(p*.21+3.)-.5)*.22);
  scc*=1.-.42*chute;
  scc=mix(scc,tc*.9,smoothstep(.52,.66,fbm(p*.021+17.)+.2*(Ng.y-.8))*.85);
  alb=mix(tc,scc,scr);
  // grey outcrops on the open slope, each shading the ground on its lee side; dark gullies
  float rocky=(1.-smoothstep(.95,.992,Ng.y))*(1.-hb)*(1.-scr);
  float lo=clamp(1.3-fw*.45,0.,1.);
  float on=vn(p*.075+50.)*.6+vn(p*.21+9.)*.4, ons=vn((p+sdir*2.2)*.075+50.)*.6+vn((p+sdir*2.2)*.21+9.)*.4;
  float oc=smoothstep(.6,.65,on)*rocky*lo, ocs=smoothstep(.6,.65,ons)*rocky*lo;
  vec3 ocol=mix(vec3(.19,.19,.215),vec3(.45,.41,.36),mix(.5,sv.y,l15)*.5+.5*vn(p*.35+2.))*(.8+.4*c2);
  alb=mix(alb,ocol,oc*.92);
  alb*=1.-.5*clamp(ocs-oc,0.,1.);
  alb*=1.-.34*chute*rocky*clamp(1.3-fw*.12,0.,1.);
  // old snow lies in drifts with an edge (a soft wash of it reads as a smear of one tone); more of them when it has snowed
  float sth=mix(.8,.63,uSnow), snf=fbm(vec2(p.x*.035,p.y*.08)+77.)+.06*(c1-.5);
  float sn=smoothstep(sth,sth+.035,snf)*step(.02,uSnow)*(.9-.4*scr*smoothstep(.35,.6,sv.y)*l15);
  alb=min(alb,vec3(.46));                                    // nothing here is paler than dry lichen: no white-out under a bright overcast
  alb=mix(alb,vec3(.74,.78,.86),sn);
  hgt=mix((blobA*has*.1+thk*.07)*lkA*(1.-hb)+blobB*.05*lkB+min(kl.x*4.,1.)*.03*lkL+c3*.04-trail*.1+ring*mix(.3,st.x,ls)*.6,mix(.3,sv.x,l15)*.2*big+mix(.3,sv2.x,l43)*.22+mix(.5,vn(p*2.6+3.),LD(2.6))*.25+stA*.3*lkA+bl*.8*lkC-chute*.8,scr)+oc*1.2; wet=(.03+.07*scr)*(1.-sn); bumpK=.4*(1.-.85*sn);
  poolK=pool2*(1.-scr)*(1.-sn)*(1.-oc)*.8; hgt*=1.-poolK; bumpK*=1.-poolK;
#elif MODE == 4
  // feldspar crystals standing out of the granite, as tall as a house at this scale: flat cleavage faces that flash
  // in the low sun, growth lamellae along their length, dark mica flecks, a skin of crust lichens toward the foot
  vec3 q=P*uTexS; float fq=fw*uTexS;
  float lam=dot(q,vec3(.31,.92,.24)), cro=dot(q,vec3(.8,-.2,.5));
  float lf=clamp(1.4-fq*4.,0.,1.), lf2=clamp(1.4-fq*14.,0.,1.);
  float l1=mix(.5,vn(vec2(lam*1.6,cro*.12)),lf), l2=mix(.5,vn(vec2(lam*5.5,cro*.3+3.)),lf2);
  vec3 g=mix(vec3(.2,.14,.15),vec3(.52,.4,.37),smoothstep(.2,.8,l1*.62+l2*.38))*uTint;
  vec2 fk=vor(vec2(cro,dot(q,vec3(.1,.3,-.9)))*1.3+lam*.7);
  g=mix(g,vec3(.03,.03,.035),step(.8,fk.y)*smoothstep(.1,.3,fk.x)*.8*clamp(1.4-fq*8.,0.,1.));       // mica
  g=mix(g,vec3(.62,.6,.56)*uTint*1.6,smoothstep(.72,.8,vn(vec2(cro*.5+lam*.2,lam*.06)))*.6*lf);     // a quartz vein
  float low=1.-smoothstep(.3,.8,vAO);
  float cf=fbm(q.xz*.5+q.y*.4+7.);
  g=mix(g,vec3(.3,.34,.27)*(.75+.5*l2),smoothstep(.5,.62,cf+low*.25)*.75);                           // grey-green crust
  g=mix(g,vec3(.5,.3,.05),smoothstep(.66,.72,fbm(q.xz*.9+q.y*.7+29.))*.7*clamp(1.4-fq*2.,0.,1.));  // orange crust
  g=mix(g,vec3(.04,.045,.04),smoothstep(.62,.7,fbm(q.zy*.7+q.x*.6+17.))*.6);
  g=mix(g,vec3(.1,.15,.04),low*low*.7);                                                             // moss at the foot
  alb=g; hgt=l1*.35+l2*.12+cf*.5; wet=1.1*(1.-.7*smoothstep(.5,.62,cf)); bumpK=.3;
#else
  vec3 q=P*uTexS; float fq=fw*uTexS;
  float k1=clamp(1.3-fq*9.,0.,1.), k2=clamp(1.3-fq*30.,0.,1.), k0=clamp(1.3-fq*.57,0.,1.);   // grain and joints are for near: ten pixels a cell reads as brickwork
  vec2 cq=mix(vec2(q.x+q.z*.6,q.y*1.4+q.z*.45),q.xz,step(.66,abs(Ng.y)));
  vec2 c1=vor(cq*.8), c2=vor(cq*2.9+5.);
  vec3 g=mix(vec3(.42,.4,.39),vec3(.6,.52,.47),mix(.5,c1.y,k1));
  g=mix(g,g*.6,smoothstep(.78,.86,c2.y)*smoothstep(0.,.12,c2.x)*k2);
  g=mix(g,g*1.22+.03,(1.-smoothstep(.1,.18,c2.y))*smoothstep(0.,.12,c2.x)*k2);
  g*=mix(.9,1.,k2)*(.86+.14*mix(.8,smoothstep(0.,.06,c1.x),k1));
  g*=uTint;
  // crustose lichens in blotches: grey-green, black, a little orange
  g=mix(g,vec3(.3,.34,.27)*(.8+.4*mix(.5,c1.y,k1)),smoothstep(.46,.58,fbm(cq*.035+7.))*.55);
  g=mix(g,vec3(.065,.065,.07),smoothstep(.6,.68,fbm(cq*.06+17.))*.6);
  g=mix(g,vec3(.55,.33,.05),smoothstep(.68,.74,fbm(cq*.11+29.))*.55*clamp(1.3-fq*.6,0.,1.));
  g=mix(vec3(.45,.42,.4)*uTint,g,.35+.65/(1.+dist*uTexS*.02));
  float upw=smoothstep(.3,.75,Ng.y);
  vec2 t=vor(cq*.22+2.); float tile=mix(.86,smoothstep(0.,.08,t.x),k0);
  float mp=smoothstep(.5,.66,fbm(cq*.05+4.))*upw*uPatch.w;
  vec3 mapl=mix(vec3(.5,.55,.08),vec3(.34,.44,.07),mix(.5,t.y,k0))*tile+vec3(.015)*(1.-tile);
  g=mix(g,mapl,mp);
  float pr=max(uPatch.z,.01);
  float cr=(1.-smoothstep(pr*.7,pr,length(P.xz-uPatch.xy)+(vn(P.xz*.8)-.5)*2.))*step(.02,uPatch.z);
  g=mix(g,uPal[0]*(.42+.2*mix(.5,vn(P.xz*3.),LD(3.))),cr*upw);
  float moss=(1.-smoothstep(.25,.55,vAO))*upw; g=mix(g,vec3(.12,.17,.05),moss*.6*uPatch.w);
  float stre=mix(.2,smoothstep(.5,.75,vn(vec2(dot(q.xz,vec2(.7,.7))*.9,q.y*.08))),clamp(1.3-fq*2.4,0.,1.))*(1.-upw);
  g*=1.-.45*stre;
  alb=g; hgt=mix(.25,c1.x,k1)*.4+mix(.5,vn(cq*2.9+3.),k2)*.3+t.x*mp*k0; wet=.35+.9*stre; bumpK=.6*min(1.,3.6/uTexS);
#endif
  vec3 dpx=dFdx(P), dpy=dFdy(P); float hx=dFdx(hgt), hy=dFdy(hgt);
  vec3 r1=cross(dpy,Ng), r2=cross(Ng,dpx); float det=dot(dpx,r1);
  vec3 nb=Ng-(hx*r1+hy*r2)*(sign(det)/max(abs(det),1e-7))*(bumpK/(1.+dist*.035)/(1.+length(fwidth(P))*8.));
  vec3 N=nb/max(length(nb),1e-4);
  float aoV=mix(vAO,.82,max(flatK,smoothstep(.45,2.,fw)));               // baked contact shadows are smaller than a pixel far off: use their mean
  float cs=cloudShadow(P.xz), ndl=max((dot(N,uSunL)+WRAP)/(1.+WRAP),0.), ao=mix(.4,1.,aoV);
  vec3 col=alb*(uSunCol*ndl*cs*(.3+.7*aoV)+uSkyCol*(.62+.62*N.y)*ao*AMB+uHorizCol*GLOW*ao+(uPal[1]*.05+uPal[6]*.05)*(1.-N.y)*ao);
#if MODE == 1
  {
    // (round 10) shade on the mat was a crimson so deep that it counted for black. The leaves are waxy: where the sun
    // does not reach they carry the sky, a slate-blue fill that comes up as the sun's share falls, and a brighter line
    // of it round each leaf's edge, so that the shade has leaves in it. It is added light, not haze.
    // (and wherever the mat comes out that dark for any reason: claret leaves under a red low sun have no green or
    // blue in them at all, lit or not)
    // (the amounts are what the film curve needs: under it a pure red throws green and blue below zero, and the
    // contrast step takes another 2.5% off, so a fill of less than about .04 is not seen at all, and a little more
    // than that is seen at once: the amount is set to come out a dusky plum-slate, about (60, 12, 22) of 255)
    float shd=max(.3*(1.-smoothstep(.08,.5,ndl*cs*(.3+.7*aoV))),1.-smoothstep(.02,.07,dot(col,vec3(.2126,.7152,.0722))));
    float edge=smoothstep(.06,.15,v.x)*(1.-smoothstep(.17,.34,v.x))*ll;
    col+=vec3(.32,.7,.9)*dot(uSkyCol,vec3(.3,.5,.2))*shd*(.85+.15*aoV)*(.125+.07*edge)*(1.-poolK);
  }
#endif
  vec3 Hh=uSunL+V; Hh/=max(length(Hh),1e-4);
  // the wet glint: where the bumped normal changes within a pixel the highlight is widened and dimmed, so that it is a
  // sheen and never a sparkle of single pixels
  float nv=length(fwidth(N)), pw=50./(1.+nv*40.);
  float sp=pow(max(dot(N,Hh),0.),pw)*cs*aoV*(pw+2.)/52.;
  col+=uSunCol*sp*wet*mix(.6,.3+.7*vn(P.xz*5.+P.y*3.),1./(1.+dist*.03))/(1.+length(fwidth(P))*3.);
  if(poolK>.001){
    vec3 Rp=reflect(-V,vec3(0.,1.,0.)); Rp.y=abs(Rp.y)+.02; Rp/=max(length(Rp),1e-4);
    col=mix(col,skyMirror(Rp)*(.75+.25*cs),poolK*mix(.6,1.,pow(1.-clamp(V.y,0.,1.),2.5)));
  }
  float alpha=1.;
  ${FINISH}
}`;

// ---- drifting specks: motes, gnats, falling leaves, snow. A box of points that wraps round the camera.
const SPR_VS = /* glsl */`
${BRANCH_GLSL}
attribute vec4 aS;
uniform vec3 uBox; uniform vec3 uVel; uniform vec4 uSpr;
varying float vA; varying float vB;
${FOG_V}
void main(){
  vec3 q=position*uBox+uVel*uTime;
  q+=vec3(sin(uTime*.7+aS.y*40.),sin(uTime*.5+aS.y*23.),cos(uTime*.6+aS.y*31.))*uSpr.z;
  q=mod(q-uCamL+.5*uBox,uBox)-.5*uBox+uCamL;
  vec4 mvPosition=modelViewMatrix*vec4(q,1.);
  float dist=max(-mvPosition.z,.1), S=max(length(modelMatrix[0].xyz),1e-6);
  float px=aS.x*S*uSpr.x/dist;
  gl_PointSize=clamp(px,1.5,uSpr.y);
  vec3 dl=abs(q-uCamL)/(.5*uBox); float edge=1.-smoothstep(.75,1.,max(dl.x,max(dl.y,dl.z)));
  vA=edge*smoothstep(uSpr.w*S,uSpr.w*S*3.,dist)*min(1.,px/1.5); vB=aS.z;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  vDepth=-mvPosition.z;
}`;
const SPR_FS = /* glsl */`
${FOG_F}
${BRANCH_GLSL}
uniform vec3 uColor; uniform vec3 uLit;
varying float vA; varying float vB;
void main(){
  vec2 c=gl_PointCoord-.5; float r=dot(c,c)*4.; if(r>1.) discard;
  float a=1.-r; a*=a;
  vec3 col=uColor*(uLit.x*(uSunCol*.6+uSkyCol)+uLit.y)*(.5+vB);
  float alpha=a*vA*uLit.z;
  if(alpha<.004) discard;
  ${FINISH}
}`;

// ---- the macro backdrop at lichen scale: out-of-focus scarlet leaf and soft sky, with discs of blurred light
const DOME_VS = /* glsl */`
varying vec3 vD;
void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const DOME_FS = /* glsl */`
${BRANCH_GLSL}
uniform float uOp; uniform float uLum; uniform vec3 uHi; uniform float uB; uniform vec3 uFogC;
varying vec3 vD;
float disc(vec2 g,float th){
  vec2 id=floor(g), f=fract(g)-.5; float r=h21(id);
  vec2 o=(vec2(h21(id+3.1),h21(id+7.7))-.5)*.3;
  return (1.-smoothstep(.26,.34,length(f+o)))*step(th,r)*(.4+.6*h21(id+1.3));
}
void main(){
  vec3 d=vD/max(length(vD),1e-4);
  float az=atan(d.x,-d.z+step(abs(d.x)+abs(d.z),1e-5));
  vec2 sp=vec2(az*2.2,d.y*3.2);
  float n=fbm(sp*1.1+uTime*.01);
  float hz=smoothstep(-.06,.72,d.y+(n-.5)*.5);
  vec2 hxz=d.xz/max(length(d.xz),1e-4), sxz=uSunL.xz/max(length(uSunL.xz),1e-4);
  float west=dot(hxz,sxz)*.5+.5;
  vec3 low=mix(uPal[1]*.42,uPal[3]*.4,fbm(sp*.8+5.));
  low=mix(low,uPal[1]*.75+uPal[2]*.08,smoothstep(.55,.8,fbm(sp*1.7+2.)));
  low*=.75+.5*west;
  vec3 high=mix(uHi,uHorizCol*.62,west*west*(1.-.5*smoothstep(.1,.7,d.y)));
  vec3 col=mix(low,high,hz);
  float b=disc(sp*2.3+vec2(uTime*.004,0.),.78)+disc(sp*4.1+7.,.84)*.7;
  col+=mix(uPal[1]*.6,uHorizCol*.4,hz)*b*.2;
  col*=uLum; float alpha=uOp;
  if(uB>.001){
    // at boulder scale: the country beyond the mat. Not a smear: two lines of low hills, each with an edge, the
    // nearer one in the mat's own dark red with gold willow along its foot, the farther one paled by the air, and
    // the mat's haze rising to meet them. Above their skyline the real sky and its clouds show through.
    float h1=.036+.06*vn(vec2(az*2.3+2.,3.))+.02*vn(vec2(az*7.+1.,9.))+.007*vn(vec2(az*23.,5.));
    float h2=.008+.04*vn(vec2(az*3.1+5.,1.))+.014*vn(vec2(az*11.,7.))+.005*vn(vec2(az*31.,2.));
    float hl=max(h1,h2);
    float below=1.-smoothstep(hl-.003,hl+.004,d.y);
    // their slopes: ribs and gullies that run down from each skyline, heath and scree in patches, willow gold in
    // drifts along the foot (t = 0 on the skyline, 1 at the foot)
    float t1=clamp((h1-d.y)/(h1+.05),0.,1.5), t2=clamp((h2-d.y)/(h2+.05),0.,1.5);
    float rib1=fbm(vec2(az*38.+t1*2.,t1*3.)+3.), rib2=fbm(vec2(az*52.-t2*2.5,t2*3.5)+17.), m=fbm(vec2(az*9.,t2*5.)+11.);
    vec3 farH=mix(uFogC,uHi*uLum,.34)*(.74+.5*rib1);
    vec3 nearH=mix(uFogC,mix(uPal[1]*.42,uPal[3]*.5,smoothstep(.3,.7,m))*uLum,.62)*(.66+.68*rib2);
    float wil=smoothstep(.5,.7,fbm(vec2(az*26.,t2*7.)+29.))*smoothstep(.4,.8,t2)*(1.-smoothstep(.95,1.3,t2));
    nearH=mix(nearH,uPal[2]*.55*uLum,wil*.5);
    vec3 sl=mix(farH,nearH,1.-smoothstep(h2-.003,h2+.004,d.y));
    sl*=1.+.3*west*smoothstep(hl-.03,hl,d.y);                                   // the crests take the low light
    // under the hills the mat goes on to their feet: its patches drawn smaller and smaller toward the horizon, in haze
    float dn=max(-d.y+.012,.012); vec2 gp=vec2(az*5.,1.)/dn;
    float gt=fbm(gp*.35+5.), gt2=fbm(gp*1.1+31.);
    vec3 flatc=mix(mix(uPal[1]*.3,uPal[3]*.6,smoothstep(.36,.6,gt)),uPal[2]*.62,smoothstep(.58,.74,gt2)*.6)*uLum*(.6+.7*gt2);
    flatc=mix(flatc,uFogC,.12+.5*smoothstep(.07,.014,dn));
    sl=mix(sl,flatc,1.-smoothstep(-.012,.006,d.y));
    sl=mix(sl,uFogC,(1.-smoothstep(-.02,.03,d.y))*.14);
    float ab=mix(.1*(1.-smoothstep(hl,hl+.22,d.y)),.97,below);
    col=mix(col,mix(uFogC,sl,below),uB); alpha=uOp*mix(1.,ab,uB);
  }
  gl_FragColor=vec4(col,alpha);
}`;

// =====================================================================================================
// geometry helpers
class Geo {
  constructor() { this.p = []; this.c = []; this.w = []; this.i = []; this.n = 0; }
  v(x, y, z, col, w = 0, ao = 1) { this.p.push(x, y, z); this.c.push(col[0], col[1], col[2]); this.w.push(w, ao); return this.n++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  get tris() { return this.i.length / 3; }
  build(flat = false) {
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 2));
    g.setIndex(this.i);
    if (flat) { const ng = g.toNonIndexed(); g.dispose(); g = ng; }
    g.computeVertexNormals();
    return g;
  }
}
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// a tube through pts ([x,y,z]...) with radii; colFn(k, t) and wFn(k, t) give colour and [wind, ao] per ring
function tube(g, pts, radii, sides, colFn, wFn, close = false) {
  const n = pts.length, rings = [];
  let ux = 0, uy = 0, uz = 0;
  for (let k = 0; k < n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    if (k === 0) { if (Math.abs(ty) < 0.9) { ux = 0; uy = 1; uz = 0; } else { ux = 1; uy = 0; uz = 0; } }
    // keep the frame from twisting: project the previous u onto the plane normal to t
    const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz;
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    const t = k / (n - 1), col = colFn(k, t), w = wFn(k, t), r = radii[k], ring = [];
    for (let s = 0; s < sides; s++) {
      const an = (s / sides) * 6.2832, c = Math.cos(an) * r, sn = Math.sin(an) * r;
      ring.push(g.v(pts[k][0] + ux * c + vx * sn, pts[k][1] + uy * c + vy * sn, pts[k][2] + uz * c + vz * sn, col, w[0], w[1]));
    }
    rings.push(ring);
  }
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; g.quad(rings[k][s], rings[k][s1], rings[k + 1][s1], rings[k + 1][s]); }
  if (close) { const k = n - 1, c = g.v(pts[k][0], pts[k][1], pts[k][2], colFn(k, 1), wFn(k, 1)[0], wFn(k, 1)[1]); for (let s = 0; s < sides; s++) g.tri(rings[k][s], rings[k][(s + 1) % sides], c); }
}
// a body lofted along z: stations {z, rx, ry, y, col, colB (belly)}; closed at both ends
function loftZ(g, st, sides, w = 0, aoB = 0.55) {
  const rings = [];
  for (let k = 0; k < st.length; k++) {
    const s = st[k], ring = [];
    for (let j = 0; j < sides; j++) {
      const an = (j / sides) * 6.2832, cx = Math.sin(an), cy = Math.cos(an);      // j = 0 is the back (top)
      const col = s.colB ? mixc(s.colB, s.col, smoothstep(-0.5, 0.25, cy)) : s.col;
      ring.push(g.v(cx * s.rx, (s.y || 0) + cy * s.ry, s.z, col, w, lerp(aoB, 1, cy * 0.5 + 0.5)));
    }
    rings.push(ring);
  }
  for (let k = 0; k < st.length - 1; k++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.quad(rings[k][j], rings[k + 1][j], rings[k + 1][j1], rings[k][j1]); }
  for (const e of [0, st.length - 1]) {
    const s = st[e], c = g.v(0, s.y || 0, s.z + (e ? 1 : -1) * Math.max(s.rx, s.ry) * 0.6, s.col, w, 0.9);
    for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; if (e) g.tri(rings[e][j], c, rings[e][j1]); else g.tri(rings[e][j], rings[e][j1], c); }
  }
}
// a lathe round the y axis at (cx, cz): prof [[r, y, col, ao]...]
function lathe(g, cx, cy, cz, prof, sides, w = 0) {
  const rings = [];
  for (const q of prof) { const ring = []; for (let j = 0; j < sides; j++) { const an = (j / sides) * 6.2832; ring.push(g.v(cx + Math.cos(an) * q[0], cy + q[1], cz + Math.sin(an) * q[0], q[2], w, q[3] ?? 1)); } rings.push(ring); }
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.quad(rings[k][j], rings[k + 1][j], rings[k + 1][j1], rings[k][j1]); }
}
// a ball (lat-long), optionally squashed
function ball(g, cx, cy, cz, rx, ry, rz, seg, col, w = 0, ao = 1) {
  const rows = Math.max(3, seg >> 1), rings = [];
  for (let a = 0; a <= rows; a++) {
    const th = (a / rows) * Math.PI, ring = [];
    for (let b = 0; b < seg; b++) { const ph = (b / seg) * 6.2832; ring.push(g.v(cx + Math.sin(th) * Math.cos(ph) * rx, cy + Math.cos(th) * ry, cz + Math.sin(th) * Math.sin(ph) * rz, col, w, ao * (0.6 + 0.4 * (Math.cos(th) * 0.5 + 0.5)))); }
    rings.push(ring);
  }
  for (let a = 0; a < rows; a++) for (let b = 0; b < seg; b++) { const b1 = (b + 1) % seg; g.quad(rings[a][b], rings[a + 1][b], rings[a + 1][b1], rings[a][b1]); }
}

// ---- lichen: fork segments in 3D. Each seg {a, b, ra, rb, order, h (0..1 height of its end)}
function growLichen(rng, o) {
  const segs = [], H = o.height;
  const grow = (p, d, len, r, order) => {
    const q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len];
    segs.push({ a: p, b: q, ra: r, rb: r * 0.7, order, h: clamp(q[1] / H, 0, 1) });
    if (order >= o.orders) return;
    const n = order === 0 ? 3 : rng.int(2, order < 3 ? 3 : 2), az0 = rng() * 6.283;
    // a frame round d
    let ux = d[1], uy = -d[0], uz = 0; let ul = Math.hypot(ux, uy, uz); if (ul < 0.2) { ux = 1; uy = 0; uz = 0; ul = 1; } ux /= ul; uy /= ul;
    const vx = d[1] * uz - d[2] * uy, vy = d[2] * ux - d[0] * uz, vz = d[0] * uy - d[1] * ux;
    for (let k = 0; k < n; k++) {
      const az = az0 + (k / n) * 6.283 + rng.range(-0.4, 0.4), sp = o.spread * rng.range(0.7, 1.25);
      const c = Math.cos(sp), s = Math.sin(sp), ca = Math.cos(az), sa = Math.sin(az);
      let nd = [d[0] * c + (ux * ca + vx * sa) * s, d[1] * c + (uy * ca + vy * sa) * s + o.lift, d[2] * c + (uz * ca + vz * sa) * s];
      const nl = Math.hypot(nd[0], nd[1], nd[2]) || 1; nd = [nd[0] / nl, nd[1] / nl, nd[2] / nl];
      grow(q, nd, len * o.ratio * rng.range(0.8, 1.2), r * 0.66, order + 1);
    }
  };
  const lean = o.lean ?? 0.12, la = rng() * 6.283;
  let d0 = [Math.cos(la) * lean, 1, Math.sin(la) * lean]; const l0 = Math.hypot(d0[0], 1, d0[2]); d0 = [d0[0] / l0, 1 / l0, d0[2] / l0];
  let tot = 0, l = 1; for (let k = 0; k <= o.orders; k++) { tot += l; l *= o.ratio; }
  grow([0, 0, 0], d0, (H / tot) * 1.15, o.radius, 0);
  return segs;
}
// loft lichen segments: pale mealy tubes, knobbly, open (hollow) at the tips
function loftLichen(g, segs, rng, o) {
  const base = o.base, tip = o.tip, maxO = o.orders;
  for (const s of segs) {
    const sides = s.order <= 1 ? o.sides : s.order <= 3 ? Math.max(3, o.sides - 2) : 3;
    const mid = s.order <= o.midTo, len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]);
    const pts = [s.a], rad = [s.ra];
    if (mid) { const j = len * 0.07; pts.push([(s.a[0] + s.b[0]) / 2 + rng.range(-j, j), (s.a[1] + s.b[1]) / 2 + rng.range(-j, j), (s.a[2] + s.b[2]) / 2 + rng.range(-j, j)]); rad.push((s.ra + s.rb) * 0.5 * rng.range(0.85, 1.12)); }
    pts.push(s.b); rad.push(s.rb * (s.order === maxO ? 0.55 : 1));
    const h0 = clamp(s.a[1] / o.height, 0, 1), h1 = s.h, last = s.order === maxO;
    tube(g, pts, rad, sides,
      (k, t) => { const h = lerp(h0, h1, t), c = mixc(base, tip, smoothstep(0.05, 0.75, h)); const d = last && t > 0.9 ? 0.55 : 1; return [c[0] * d, c[1] * d * 0.96, c[2] * d * 0.9]; },
      (k, t) => { const h = lerp(h0, h1, t); return [h * h * (0.4 + 0.6 * s.order / maxO), lerp(0.5, 1, smoothstep(0, 0.35, h))]; });
  }
}

// ---- creatures (all face -z; the instanced shader turns them with yaw, pitch, bank)
function birdGeo(o) {
  const g = new Geo(), L = o.len, hs = o.span / 2, nk = o.neck, sides = o.sides || 10, pl = o.plump || 1;
  const st = [
    { z: 0.5 * L, rx: 0.02 * L, ry: 0.015 * L, y: 0, col: o.tail },
    { z: 0.38 * L, rx: 0.07 * L * pl, ry: 0.05 * L * pl, y: 0, col: o.body, colB: o.belly },
    { z: 0.18 * L, rx: 0.13 * L * pl, ry: 0.11 * L * pl, y: 0, col: o.body, colB: o.belly },
    { z: -0.02 * L, rx: 0.15 * L * pl, ry: 0.14 * L * pl, y: 0, col: o.body, colB: o.belly },
    { z: -0.2 * L, rx: 0.12 * L * pl, ry: 0.12 * L * pl, y: 0.005 * L, col: o.neckCol, colB: o.belly },
    { z: -0.28 * L, rx: 0.065 * L, ry: 0.065 * L, y: 0.02 * L, col: o.neckCol },
    { z: (-0.28 - nk) * L, rx: 0.045 * L, ry: 0.045 * L, y: (0.04 + nk * 0.22) * L, col: o.neckCol },
    { z: (-0.33 - nk) * L, rx: 0.06 * L * o.head, ry: 0.058 * L * o.head, y: (0.05 + nk * 0.22 + (o.headUp || 0)) * L, col: o.headCol },
    { z: (-0.39 - nk) * L, rx: 0.028 * L, ry: 0.024 * L, y: (0.04 + nk * 0.22 + (o.headUp || 0)) * L, col: o.beak },
  ];
  loftZ(g, st, sides, 0, 0.6);
  const NS = o.ns || 10, NC = 4, c0 = 0.3 * L * (o.chord || 1), x0 = 0.09 * L, rowK = [1, 1.04, 0.92, 0.8, 0.62];
  for (const side of [-1, 1]) {
    const grid = [];
    for (let i = 0; i <= NS; i++) {
      const sf = i / NS, chord = c0 * (1 - (o.taperK || 0.72) * Math.pow(sf, o.taperP || 1.7)), lead = -0.19 * L + (o.sweep || 0.1) * L * sf * sf, row = [];
      for (let j = 0; j <= NC; j++) {
        let z = lead + chord * (j / NC); if (j === NC && i % 2) z += 0.07 * c0 * (1 + sf);
        const fk = rowK[j] * (j >= 2 && i % 2 ? 0.88 : 1);
        let col = sf > o.tipFrom && j > 0 ? o.tip : j === 0 ? mixc(o.wing, o.body, 0.35) : [o.wing[0] * fk, o.wing[1] * fk, o.wing[2] * fk];
        if (o.covert && j < 3) col = mixc(col, o.body, o.covert * (1 - smoothstep(0.12, 0.5, sf)) * (1 - j * 0.25));
        const cam = o.camber || 0.012, arch = o.arch || 0.02;
        row.push(g.v(side * (x0 + (hs - x0) * sf), 0.03 * L - arch * L * sf * sf + cam * L * Math.sin((j / NC) * 3.14), z, col, side * Math.max(sf, 0.02), 0.62 + 0.38 * sf));
      }
      grid.push(row);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) g.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  }
  const t0 = g.v(0, 0.01 * L, 0.36 * L, o.tailRoot || o.body, 0, 0.8), tw = 0.14 * L * (o.tailW || 1), tl = (0.5 + (o.tailL || 0.12)) * L, fan = [];
  for (let k = 0; k <= 4; k++) { const a = (k / 4 - 0.5) * 1.5; fan.push(g.v(Math.sin(a) * tw, 0, 0.36 * L + (tl - 0.36 * L) * Math.cos(a * 0.6), o.tail, 0, 1)); }
  for (let k = 0; k < 4; k++) g.tri(t0, fan[k], fan[k + 1]);
  return g.build();
}
// ---- the bird on the ground (round 10). The flight mesh stood on the mat with its wings turned down was a seal; the
// bird that stands has a geometry of its own, shown until the flush, when the flight mesh takes its place (setBird).
// Feet at y = 0, facing -z, about 4.4 high.
// A willow ptarmigan in autumn moult, side on: a plump egg of a body with the breast carried high, a short neck, a round
// head with a stout dark beak, a dark eye and the red comb over it, rufous on head, neck, breast and back, white
// belly, the white wing folded along the flank as rows of overlapping feathers (coverts over secondaries over the long
// primaries that run to its point), the black tail under the wing tips, white feathered legs and feet.
function grouseGeo(o) {
  const g = new Geo(), W = o.white, WW = [W[0] * 1.25, W[1] * 1.25, W[2] * 1.25], R = o.ruf, K = [0.03, 0.03, 0.04], SH = [0.2, 0.22, 0.28];
  const ST = [[2.55, 0.34, 0.3, 1.72], [1.95, 0.82, 0.76, 1.78], [1.05, 1.2, 1.14, 1.9], [0.05, 1.38, 1.34, 2.05], [-0.85, 1.3, 1.3, 2.22], [-1.55, 0.98, 1.06, 2.46]];
  {
    // (rufous over the back and all round the breast; white from under the wing down, and under the breast)
    const SD = 16, rings = [];
    for (let k = 0; k < ST.length; k++) {
      const [z, rx, ry, y] = ST[k], ring = [], br = smoothstep(0.2, -1.2, z);
      for (let j = 0; j < SD; j++) {
        const an = (j / SD) * 6.2832, cx = Math.sin(an), cy = Math.cos(an), wh = smoothstep(lerp(0.9, 2.2, br), lerp(1.3, 2.75, br), Math.acos(cy));
        ring.push(g.v(cx * rx, y + cy * ry, z, mixc(R, WW, k === 0 ? Math.max(wh, 0.4) : wh), 0, lerp(0.55, 1, cy * 0.5 + 0.5)));
      }
      rings.push(ring);
    }
    for (let k = 0; k < ST.length - 1; k++) for (let j = 0; j < SD; j++) { const j1 = (j + 1) % SD; g.quad(rings[k][j], rings[k + 1][j], rings[k + 1][j1], rings[k][j1]); }
    for (const e of [0, ST.length - 1]) {
      const q = ST[e], c = g.v(0, q[3], q[0] + (e ? -1 : 1) * Math.max(q[1], q[2]) * 0.6, e ? R : mixc(R, WW, 0.4), 0, 0.9);
      for (let j = 0; j < SD; j++) { const j1 = (j + 1) % SD; if (e) g.tri(rings[e][j], c, rings[e][j1]); else g.tri(rings[e][j], rings[e][j1], c); }
    }
  }
  const sec = (z) => { let k = 0; while (k < ST.length - 2 && z < ST[k + 1][0]) k++; const a = ST[k], b = ST[k + 1], t = clamp((z - a[0]) / (b[0] - a[0]), 0, 1); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; };
  // the tail: short, black, rounded at its end, under the wing tips
  loftZ(g, [{ z: 2.2, rx: 0.5, ry: 0.24, y: 1.8, col: mixc(R, K, 0.6) }, { z: 2.9, rx: 0.86, ry: 0.17, y: 1.74, col: K }, { z: 3.75, rx: 1.0, ry: 0.11, y: 1.66, col: K }], 8, 0, 0.6);
  // a point on the folded wing: s from the shoulder to the tip, t from its upper edge (on the back) to its lower edge
  // (on the flank); it lies on the body's own curve, a little proud of it
  const z0 = -1.25, z1 = 2.95;
  for (const side of [-1, 1]) {
    const wp = (s, t, lift) => {
      const z = lerp(z0, z1, s), q = sec(z), hw = 0.6 * smoothstep(0, 0.16, s) * Math.pow(1 - Math.pow(s, 2.4), 0.8) + 0.05;
      const a = lerp(1.0, 1.5, s) + (t - 0.5) * 2 * hw, off = 0.05 + lift + 0.1 * Math.sin(clamp(t, 0, 1) * 3.1416) * (1 - s);
      return [side * Math.sin(a) * (Math.max(q[0], 0.42) * 1.05 + off), q[2] + Math.cos(a) * (Math.max(q[1], 0.4) * 1.05 + off) - 0.22 * s * s, z];
    };
    const grid = [], ug = mixc(WW, SH, 0.45);
    for (let i = 0; i <= 10; i++) { const row = []; for (let j = 0; j <= 4; j++) { const p = wp(i / 10, j / 4, 0); row.push(g.v(p[0], p[1], p[2], ug, 0, 0.62)); } grid.push(row); }
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { if (side < 0) g.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]); else g.quad(grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]); }
    // a feather: a blade from its root to its rounded tip, a ridge down its middle, its lower edge in its own shade
    const feather = (s0, t0, s1, t1, w, lift, col) => {
      const PR = [0.6, 0.95, 1, 0.8, 0.14], rows = [];
      for (let q = 0; q < 5; q++) {
        const f = q / 4, s = lerp(s0, s1, f), t = lerp(t0, t1, f), ww = w * PR[q], ao = 0.5 + 0.5 * smoothstep(0, 0.6, f), row = [];
        for (let e = -1; e <= 1; e++) { const p = wp(s, t + e * ww, lift + (e === 0 ? 0.045 : 0) + 0.03 * f); row.push(g.v(p[0], p[1], p[2], e === 1 ? mixc(col, SH, 0.5) : col, 0, e === 1 ? ao * 0.75 : ao)); }
        rows.push(row);
      }
      for (let q = 0; q < 4; q++) for (let e = 0; e < 2; e++) { if (side < 0) g.quad(rows[q][e], rows[q + 1][e], rows[q + 1][e + 1], rows[q][e + 1]); else g.quad(rows[q][e], rows[q][e + 1], rows[q + 1][e + 1], rows[q + 1][e]); }
    };
    for (let i = 0; i < 5; i++) feather(0.46 + 0.03 * i, 0.22 + 0.16 * i, 0.84 + 0.04 * i, 0.5, 0.17, 0.02 + 0.012 * i, WW);                       // primaries
    for (let i = 5; i >= 0; i--) feather(0.16 + 0.075 * i, 0.34, 0.44 + 0.085 * i, 1.02 - 0.05 * i, 0.2, 0.07 + 0.012 * (5 - i), WW);              // secondaries
    for (let i = 5; i >= 0; i--) feather(0.08 + 0.085 * i, 0.12, 0.22 + 0.085 * i, 0.56, 0.2, 0.15, mixc(WW, R, i % 3 === 1 ? 0.3 : 0.06));     // coverts
    for (let i = 4; i >= 0; i--) feather(0.0 + 0.1 * i, -0.12, 0.15 + 0.1 * i, 0.26, 0.2, 0.2, mixc(R, WW, i % 2 ? 0.45 : 0.15));               // scapulars, half moulted
    // leg and foot, feathered white to the toes
    tube(g, [[side * 0.48, 1.0, 0.3], [side * 0.48, 0.5, 0.26], [side * 0.48, 0.1, 0.2]], [0.36, 0.27, 0.22], 7, () => W, (k) => [0, 0.55 + 0.15 * k]);
    ball(g, side * 0.48, 0.13, -0.08, 0.3, 0.14, 0.5, 6, W, 0, 0.8);
  }
  // neck and head; the head is turned a little toward us
  const RH = mixc([R[0] * 1.5, R[1] * 1.5, R[2] * 1.5], [0.42, 0.3, 0.18], 0.25);                      // (head and neck a paler, brighter rufous: they are what is read first)
  tube(g, [[0, 2.5, -1.15], [0, 3.05, -1.55], [0, 3.6, -1.85]], [0.98, 0.74, 0.58], 10, (k) => mixc(R, RH, k / 2), (k) => [0, 0.85 + 0.1 * k]);
  const h0 = g.n, hy = 3.9, hz = -1.95;
  ball(g, 0, hy, hz, 0.57, 0.55, 0.66, 10, RH, 0, 1.25);
  tube(g, [[0, hy - 0.03, hz - 0.5], [0, hy - 0.07, hz - 0.78], [0, hy - 0.16, hz - 1.0]], [0.2, 0.13, 0.02], 6, () => K, () => [0, 1], true);
  for (const s of [-1, 1]) {
    ball(g, s * 0.5, hy + 0.1, hz - 0.27, 0.115, 0.115, 0.115, 6, [0.006, 0.006, 0.008]);
    ball(g, s * 0.4, hy + 0.33, hz - 0.22, 0.09, 0.1, 0.22, 6, [0.55, 0.035, 0.03]);
    ball(g, s * 0.515, hy - 0.04, hz - 0.22, 0.05, 0.045, 0.2, 6, WW);                                   // the pale crescent under the eye
  }
  const c = Math.cos(o.turn), sn = Math.sin(o.turn);
  for (let i = h0; i < g.n; i++) { const x = g.p[i * 3], dz = g.p[i * 3 + 2] - (hz + 0.2); g.p[i * 3] = x * c + dz * sn; g.p[i * 3 + 2] = hz + 0.2 - x * sn + dz * c; }
  return g.build();
}
// A snowy owl sitting upright: a white egg barred with dark flecks on its back and wings, a big round head turned to
// look at us with yellow eyes, a dark beak sunk in the face, feathered feet. About 5.7 high.
function owlSitGeo(o) {
  const g = new Geo(), W = o.white, F = [0.16, 0.15, 0.145], D = [0.02, 0.02, 0.022];
  const ST = [[0.3, 0.7, 0.75, 0.5], [0.7, 1.08, 1.12, 0.4], [1.2, 1.36, 1.4, 0.3], [1.7, 1.5, 1.54, 0.22], [2.2, 1.56, 1.6, 0.15], [2.7, 1.52, 1.54, 0.08], [3.2, 1.42, 1.42, 0], [3.6, 1.28, 1.26, -0.06], [4.0, 1.1, 1.08, -0.12]];
  const rings = [], SD = 16;
  for (let k = 0; k < ST.length; k++) {
    const [y, rx, rz, zc] = ST[k], ring = [];
    for (let j = 0; j < SD; j++) {
      const an = (j / SD) * 6.2832, bk = smoothstep(-0.1, 0.5, -Math.cos(an)), fleck = (k + j) % 2 === 0 && k > 0 && k < 8;
      ring.push(g.v(Math.sin(an) * rx, y, zc - Math.cos(an) * rz, fleck ? mixc(W, F, 0.25 + 0.6 * bk) : W, 0, lerp(0.6, 1, smoothstep(0.3, 2.5, y))));
    }
    rings.push(ring);
  }
  for (let k = 0; k < ST.length - 1; k++) for (let j = 0; j < SD; j++) { const j1 = (j + 1) % SD; g.quad(rings[k][j], rings[k][j1], rings[k + 1][j1], rings[k + 1][j]); }
  { const cb = g.v(0, 0.12, 0.5, W, 0, 0.5); for (let j = 0; j < SD; j++) g.tri(rings[0][(j + 1) % SD], rings[0][j], cb); }
  const bars = (i0, seg, from, k) => { for (let i = i0; i < g.n; i++) { const row = ((i - i0) / seg) | 0; if (row >= from && row % 2 === 1) { const c = mixc(W, F, k * (0.55 + 0.45 * ((i - i0) % 2))); g.c[i * 3] = c[0]; g.c[i * 3 + 1] = c[1]; g.c[i * 3 + 2] = c[2]; } } };
  for (const s of [-1, 1]) {
    // the folded wing: a long drop on the flank, its point down and back, barred
    let i0 = g.n; ball(g, s * 1.34, 2.35, 0.55, 0.36, 1.6, 1.0, 12, W, 0, 0.95); bars(i0, 12, 1, 0.8);
    i0 = g.n; ball(g, s * 1.02, 1.3, 1.25, 0.3, 1.05, 0.62, 10, W, 0, 0.85); bars(i0, 10, 1, 0.8);
    ball(g, s * 0.52, 0.24, -0.3, 0.44, 0.3, 0.62, 8, W, 0, 0.8);
  }
  { const i0 = g.n; ball(g, 0, 0.62, 1.55, 0.72, 0.24, 0.95, 10, W, 0, 0.8); bars(i0, 10, 1, 0.7); }
  const h0 = g.n, hy = 4.72, hz = -0.1;
  ball(g, 0, hy, hz, 1.12, 1.0, 1.08, 14, W, 0, 1.2); bars(h0, 14, 0, 0.35);
  for (const s of [-1, 1]) {
    ball(g, s * 0.42, hy + 0.08, hz - 0.95, 0.21, 0.21, 0.12, 8, [0.85, 0.55, 0.03], 0, 1.6);
    ball(g, s * 0.43, hy + 0.08, hz - 1.04, 0.11, 0.11, 0.06, 6, D, 0, 1);
    ball(g, s * 0.45, hy + 0.3, hz - 0.93, 0.3, 0.07, 0.1, 6, mixc(W, F, 0.5), 0, 0.8);                // the brow over the eye
  }
  tube(g, [[0, hy - 0.14, hz - 1.04], [0, hy - 0.3, hz - 1.16], [0, hy - 0.46, hz - 1.08]], [0.15, 0.11, 0.02], 6, () => D, () => [0, 1], true);
  const c = Math.cos(o.turn), sn = Math.sin(o.turn);
  for (let i = h0; i < g.n; i++) { const x = g.p[i * 3], dz = g.p[i * 3 + 2] - hz; g.p[i * 3] = x * c + dz * sn; g.p[i * 3 + 2] = hz - x * sn + dz * c; }
  return g.build();
}
// a golden eagle as it is seen from above and behind: long plank wings ending in six slotted primaries, a pale tawny
// band across the upper coverts, the golden nape, a fanned tail pale at its root with a dark end (a young bird, with
// white at the base of the primaries: the marks that tell an eagle at a distance)
function eagleGeo() {
  const g = new Geo(), L = 2.7, hs = 3.25, arm = 0.7;
  const br = lin('#7a5632', 0.9), dk = lin('#33241a', 0.85), tawny = lin('#c49a5c', 0.9), gold = lin('#e2b055', 1), wht = [0.66, 0.64, 0.58], beak = lin('#e0b02a', 0.9);
  loftZ(g, [
    { z: 0.42 * L, rx: 0.05 * L, ry: 0.035 * L, y: 0, col: dk },
    { z: 0.28 * L, rx: 0.1 * L, ry: 0.07 * L, y: 0, col: br, colB: dk },
    { z: 0.05 * L, rx: 0.14 * L, ry: 0.11 * L, y: 0, col: br, colB: dk },
    { z: -0.15 * L, rx: 0.13 * L, ry: 0.11 * L, y: 0.005 * L, col: tawny, colB: br },
    { z: -0.27 * L, rx: 0.085 * L, ry: 0.085 * L, y: 0.02 * L, col: gold },
    { z: -0.35 * L, rx: 0.075 * L, ry: 0.07 * L, y: 0.03 * L, col: gold },
    { z: -0.41 * L, rx: 0.035 * L, ry: 0.035 * L, y: 0.022 * L, col: beak },
    { z: -0.455 * L, rx: 0.012 * L, ry: 0.014 * L, y: 0, col: [0.06, 0.05, 0.04] },
  ], 10, 0, 0.55);
  const NS = 9, NC = 4, x0 = 0.11 * L;
  const leadAt = (sf) => -0.2 * L + 0.05 * L * Math.sin(sf * 3), chordAt = (sf) => 0.37 * L * (1 - 0.1 * sf), yAt = (sf) => 0.03 * L - 0.03 * L * sf * sf;
  for (const side of [-1, 1]) {
    const grid = [];
    for (let i = 0; i <= NS; i++) {
      const sf = (i / NS) * arm, chord = chordAt(sf), lead = leadAt(sf), row = [];
      for (let j = 0; j <= NC; j++) {
        let z = lead + chord * (j / NC); if (j === NC && i % 2) z += 0.03 * L;
        let col = j === 0 ? br : j === 1 ? tawny : j === 2 ? mixc(br, tawny, 0.35) : dk;
        if (j >= 2) col = mixc(col, wht, 0.85 * smoothstep(0.46, 0.6, sf) * (j === 2 ? 0.7 : 1) * (j === NC ? 0.25 : 1));
        if (sf < 0.12) col = mixc(col, br, 0.6);
        row.push(g.v(side * (x0 + (hs - x0) * sf), yAt(sf) + 0.03 * L * Math.sin((j / NC) * 3.14), z, col, side * Math.max(sf, 0.02), 0.62 + 0.38 * sf));
      }
      grid.push(row);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) g.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
    // the hand: six primaries fanned and parted, each a tapering blade that lifts toward its tip
    const xa = x0 + (hs - x0) * arm, la = leadAt(arm), ca = chordAt(arm);
    for (let f = 0; f < 6; f++) {
      const t = f / 5, zb = la + ca * (0.03 + 0.15 * f), w0 = ca * 0.075, len = (hs - xa) * (1 - 0.13 * t * t) * (f === 0 ? 0.9 : 1), sw = (-0.1 + 0.55 * t) * len;
      const P0 = [xa - 0.02 * L, yAt(arm), zb], P1 = [xa + len * 0.55, yAt(arm) + 0.02 * L, zb + sw * 0.5], P2 = [xa + len, yAt(arm) + 0.06 * L, zb + sw];
      const c0 = mixc(dk, wht, 0.5 * (1 - t) * 0.6), ck = [0.035, 0.03, 0.028];
      const a = g.v(side * P0[0], P0[1], P0[2] - w0, c0, side * arm, 0.9), b = g.v(side * P0[0], P0[1], P0[2] + w0, c0, side * arm, 0.9);
      const c = g.v(side * P1[0], P1[1], P1[2] - w0 * 0.9, ck, side * 0.87, 1), d = g.v(side * P1[0], P1[1], P1[2] + w0 * 0.9, ck, side * 0.87, 1);
      const e = g.v(side * P2[0], P2[1], P2[2] - w0 * 0.3, ck, side, 1), h = g.v(side * P2[0], P2[1], P2[2] + w0 * 0.45, ck, side, 1);
      g.quad(a, c, d, b); g.quad(c, e, h, d);
    }
  }
  const t0 = g.v(0, 0.01 * L, 0.3 * L, br, 0, 0.8), tw = 0.3 * L, inn = [], out = [];
  for (let k = 0; k <= 6; k++) {
    const a = (k / 6 - 0.5) * 1.15;
    inn.push(g.v(Math.sin(a) * tw * 0.62, 0, 0.3 * L + 0.27 * L * Math.cos(a * 0.6), wht, 0, 0.95));
    out.push(g.v(Math.sin(a) * tw, 0, 0.3 * L + 0.44 * L * Math.cos(a * 0.6) + (k % 2 ? 0.012 * L : 0), dk, 0, 1));
  }
  for (let k = 0; k < 6; k++) { g.tri(t0, inn[k], inn[k + 1]); g.quad(inn[k], out[k], out[k + 1], inn[k + 1]); }
  return g.build();
}
function lemmingGeo(back, belly, tail = 0) {
  const g = new Geo();
  const P = [[1.95, 0.12, 0.1, 0.5], [1.6, 0.62, 0.55, 0.62], [0.9, 0.95, 0.8, 0.8], [0, 1.0, 0.85, 0.85], [-0.8, 0.85, 0.72, 0.8], [-1.3, 0.62, 0.55, 0.72], [-1.65, 0.42, 0.38, 0.62], [-1.92, 0.16, 0.14, 0.52]];
  loftZ(g, P.map((q, k) => ({ z: q[0], rx: q[1], ry: q[2], y: q[3], col: k > 5 ? mixc(back, belly, 0.4) : back, colB: belly })), 12, 0, 0.35);
  for (const s of [-1, 1]) ball(g, s * 0.42, 1.08, -1.2, 0.2, 0.22, 0.12, 6, mixc(back, [0.02, 0.015, 0.01], 0.5));
  if (tail) tube(g, [[0, 0.6, 1.8], [0, 0.9, 2.8], [0, 1.5, 3.6]], [0.3, 0.42, 0.2], 6, () => mixc(back, [0.03, 0.02, 0.02], 0.3), () => [0, 0.9], true);
  return g.build();
}
function miteBodyGeo(col) {
  const g = new Geo(), dk = mixc(col, [0.05, 0, 0], 0.55);
  const P = [[1.8, 0.3, 0.25], [1.3, 1.15, 0.8], [0.5, 1.4, 0.95], [-0.3, 1.3, 0.9], [-0.75, 0.98, 0.72], [-1.0, 1.02, 0.7], [-1.4, 0.6, 0.45], [-1.8, 0.2, 0.18]];
  loftZ(g, P.map((q) => ({ z: q[0], rx: q[1], ry: q[2], y: 0, col, colB: dk })), 14, 0, 0.3);
  for (const s of [-1, 1]) tube(g, [[s * 0.2, 0, -1.7], [s * 0.5, 0.1, -2.3], [s * 0.45, -0.2, -2.8]], [0.12, 0.09, 0.05], 4, () => dk, () => [0, 0.8], true);
  return g.build();
}
function springtailGeo(col) {
  const g = new Geo(), st = [], dk = mixc(col, [0.02, 0.02, 0.03], 0.6);
  for (let k = 0; k <= 9; k++) {
    const t = k / 9, z = 0.9 - t * 1.8, bulge = 0.8 + 0.2 * Math.cos(k * 3.1416), r = 0.33 * Math.sin(Math.min(1, 0.08 + t * 1.05) * 3.1416) * bulge + 0.05;
    st.push({ z, rx: r, ry: r * 0.85, y: 0.34, col: mixc(col, [0.5, 0.56, 0.7], 0.25 * (k % 2)), colB: dk });
  }
  loftZ(g, st, 8, 0, 0.4);
  for (const s of [-1, 1]) tube(g, [[s * 0.1, 0.4, -0.85], [s * 0.3, 0.55, -1.25], [s * 0.42, 0.42, -1.55]], [0.05, 0.04, 0.03], 3, () => dk, () => [0, 0.9], true);
  return g.build();
}

// ---- plants and stones
function cupGeo(rng) {
  const g = new Geo(), a = lin('#8f9c86', 0.62), b = lin('#b9c2ae', 0.7), d = lin('#4c5648', 0.5);
  lathe(g, 0, 0, 0, [[1.9, -0.5, d, 0.4], [1.25, 2.5, a, 0.6], [1.0, 11, a, 0.85], [1.35, 16.5, a, 0.95], [2.6, 20.5, b, 1], [3.45, 23.2, b, 1], [3.6, 24, b, 1], [3.3, 24.05, b, 1], [2.9, 22.4, a, 0.7], [1.6, 20.6, d, 0.45], [0.2, 19.8, d, 0.35]], 14, 0);
  // soredia: mealy granules on the outside
  for (let k = 0; k < 16; k++) { const an = rng() * 6.283, y = rng.range(13, 23.5), r = y < 16.5 ? 1.25 : 1.35 + ((y - 16.5) / 7.5) * 2.25; ball(g, Math.cos(an) * r, y, Math.sin(an) * r, 0.34, 0.3, 0.34, 4, b, 0, 1); }
  return g.build();
}
function mossGeo(rng, capsule) {
  const g = new Geo(), lo = lin('#3f5a1c', 0.6), hi = lin('#93a030', 0.7), H = 9;
  tube(g, [[0, 0, 0], [0.15, H * 0.5, 0.1], [0, H, 0]], [0.3, 0.24, 0.18], 3, (k, t) => mixc(lin('#5a4424', 0.5), lo, t), (k, t) => [0.4 * t * t, 0.5 + 0.5 * t]);
  const leaf = (y, an, len, up, w) => {
    const ca = Math.cos(an), sa = Math.sin(an), wd = 0.2 + 0.05 * len;
    const a = g.v(-sa * wd, y, ca * wd, lo, w, 0.6), b = g.v(sa * wd, y, -ca * wd, lo, w, 0.6), c = g.v(ca * len * Math.cos(up), y + len * Math.sin(up), sa * len * Math.cos(up), hi, w * 1.15, 1);
    g.tri(a, b, c);
  };
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) leaf(H * (0.3 + 0.16 * r), k * 1.2566 + r * 0.7 + rng() * 0.3, 1.5, 0.75, 0.25 + 0.1 * r);
  for (let k = 0; k < 11; k++) leaf(H, k * 0.571 + rng() * 0.15, rng.range(2.1, 2.7), 0.42 + 0.1 * (k % 2), 0.7);
  if (capsule) {
    const br = lin('#8a4a26', 0.6);
    tube(g, [[0, H, 0], [0.4, H + 3, 0.1], [1.0, H + 5.2, 0.2], [1.9, H + 5.9, 0.3]], [0.09, 0.08, 0.08, 0.1], 3, () => br, (k, t) => [0.7 + 0.5 * t, 1]);
    ball(g, 2.5, H + 5.7, 0.35, 0.95, 0.42, 0.42, 6, lin('#b58a3a', 0.7), 1.3, 1);
  }
  return g.build();
}
function redcapGeo(rng) {
  const g = new Geo(), a = lin('#93a08a', 0.6), red = lin('#c8201c', 0.85), H = 10;
  tube(g, [[0, -0.5, 0], [0.3, H * 0.5, 0.2], [0.1, H, 0]], [0.6, 0.48, 0.42], 5, (k, t) => mixc(lin('#6a745c', 0.5), a, t), (k, t) => [0.3 * t * t, 0.5 + 0.5 * t]);
  for (let k = 0; k < 3; k++) { const an = k * 2.1 + rng(), r = 0.55; ball(g, Math.cos(an) * r, H + 0.4 + 0.3 * k, Math.sin(an) * r, 0.85, 0.7, 0.85, 7, red, 0.3, 1); }
  return g.build();
}
function squamuleGeo() {
  const g = new Geo(), a = lin('#6f7c66', 0.6), b = lin('#c9d0bd', 0.7), N = 7, mid = [], rim = [];
  const c0 = g.v(0, 0, 0, mixc(a, [0.08, 0.08, 0.06], 0.45), 0, 0.45);
  for (let i = 0; i <= N; i++) {
    const an = (i / N - 0.5) * 2.6, lobe = 1 + 0.24 * Math.cos(i * 3.1416), sx = Math.sin(an), cz = Math.cos(an);
    mid.push(g.v(sx * 0.6, 0.1 + 0.1 * Math.abs(sx), cz * 0.6 + 0.1, a, 0, 0.7));
    rim.push(g.v(sx * 1.15 * lobe, 0.36 + 0.26 * lobe, cz * 1.15 * lobe + 0.15, b, 0, 1));
  }
  for (let i = 0; i < N; i++) { g.tri(c0, mid[i], mid[i + 1]); g.quad(mid[i], rim[i], rim[i + 1], mid[i + 1]); }
  return g.build();
}
// a bearberry clump: an outer whorl of leaves lying low and an inner one standing up, so that the leaves overlap and
// the clump reads as part of a mat (five spread leaves alone read as a flower)
function rosetteGeo(rng, outer = 6, inner = 4) {
  const g = new Geo();
  const leaf = (an, up, len, wk, sh0) => {
    const ca = Math.cos(an), sa = Math.sin(an), cu = Math.cos(up), su = Math.sin(up), rows = [];
    for (const [t, w] of [[0.05, 0.09], [0.58, 0.3]]) {
      const cx = ca * cu * len * t, cy = su * len * t + 0.12 - 0.12 * t * t, cz = sa * cu * len * t, sh = sh0 * (0.55 + 0.45 * t), ww = w * wk;
      rows.push([g.v(cx - sa * ww, cy + 0.06, cz + ca * ww, [sh, sh, sh], 0.3 * t, 0.4 + 0.6 * t), g.v(cx, cy, cz, [sh * 1.14, sh * 1.05, sh], 0.3 * t, 0.4 + 0.6 * t), g.v(cx + sa * ww, cy + 0.06, cz - ca * ww, [sh, sh, sh], 0.3 * t, 0.4 + 0.6 * t)]);
    }
    for (let i = 0; i < 2; i++) g.quad(rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]);
    const tip = g.v(ca * cu * len, su * len - 0.02, sa * cu * len, [sh0, sh0 * 0.95, sh0 * 0.9], 0.3, 1);
    g.tri(rows[1][0], tip, rows[1][1]); g.tri(rows[1][1], tip, rows[1][2]);
  };
  for (let k = 0; k < outer; k++) leaf((k / outer) * 6.283 + rng.range(-0.3, 0.3), rng.range(0.06, 0.3), rng.range(0.85, 1.12), 1.2, rng.range(0.85, 1.05));
  for (let k = 0; k < inner; k++) leaf((k / Math.max(inner, 1)) * 6.283 + 0.6 + rng.range(-0.3, 0.3), rng.range(0.5, 0.9), rng.range(0.5, 0.78), 1.0, rng.range(0.7, 0.9));
  return g.build();
}
// a tuft of bent blades: dwarf birch and willow sprays, cottongrass tussocks
function tuftGeo(rng, n, len, wid, splay, droop) {
  const g = new Geo();
  for (let k = 0; k < n; k++) {
    const an = (k / n) * 6.283 + rng.range(-0.4, 0.4), sp = splay * rng.range(0.4, 1.2), L = len * rng.range(0.7, 1.2), ca = Math.cos(an), sa = Math.sin(an), prev = [];
    for (let j = 0; j <= 2; j++) {
      const t = j / 2, out = Math.sin(sp) * L * t * (1 + droop * t), y = Math.cos(sp) * L * t - droop * L * t * t * 0.6, w = wid * (1 - 0.8 * t) * (j === 0 ? 0.6 : 1), sh = 0.5 + 0.5 * t;
      const cx = ca * out + ca * 0.05, cz = sa * out + sa * 0.05;
      const cur = j < 2 ? [g.v(cx - sa * w, y, cz + ca * w, [sh, sh, sh], t * t, 0.35 + 0.65 * t), g.v(cx + sa * w, y, cz - ca * w, [sh, sh, sh], t * t, 0.35 + 0.65 * t)] : [g.v(cx, y, cz, [1, 1, 1], 1, 1)];
      if (j === 1) g.quad(prev[0], prev[1], cur[1], cur[0]);
      if (j === 2) g.tri(prev[0], prev[1], cur[0]);
      prev.length = 0; prev.push(...cur);
    }
  }
  return g.build();
}
// a low bush: small sprays scattered over a dome with a dark core under them, so that it reads as a mound of foliage
// at any distance (a few broad blades read as one fallen leaf)
function bushGeo(rng, n, R, flat, leaf) {
  const g = new Geo(), top = g.v(0, R * flat * 0.8, 0, [0.36, 0.36, 0.36], 0.5, 0.55), ring = [];
  for (let k = 0; k < 4; k++) { const a = k * 1.5708 + rng() * 0.6; ring.push(g.v(Math.cos(a) * R * 0.85, 0, Math.sin(a) * R * 0.85, [0.26, 0.26, 0.26], 0, 0.3)); }
  for (let k = 0; k < 4; k++) g.tri(top, ring[(k + 1) % 4], ring[k]);
  // the sprays lie on the dome like shingles, tips up and a little out (standing out like spokes they read as a star)
  for (let k = 0; k < n; k++) {
    const th = Math.acos(1 - (0.12 + 0.88 * rng()) * 0.9), ph = (k / n) * 6.283 * 2.4 + rng.range(-0.5, 0.5), r = R * rng.range(0.8, 1.05);
    const dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph), tx = -Math.sin(ph), tz = Math.cos(ph);
    const ux = -dy * Math.cos(ph), uy = Math.sin(th), uz = -dy * Math.sin(ph);          // up the dome
    const px = dx * r, py = dy * r * flat + 0.03, pz = dz * r, l = leaf * rng.range(0.75, 1.25), sh = (0.5 + 0.5 * dy) * rng.range(0.8, 1.15), tw = rng.range(-0.35, 0.35);
    const a = g.v(px - tx * l * 0.6, py, pz - tz * l * 0.6, [sh * 0.7, sh * 0.7, sh * 0.7], 0.4 * dy, 0.45 + 0.55 * dy);
    const b = g.v(px + tx * l * 0.6, py, pz + tz * l * 0.6, [sh * 0.7, sh * 0.7, sh * 0.7], 0.4 * dy, 0.45 + 0.55 * dy);
    g.tri(a, b, g.v(px + (ux * 0.75 + dx * 0.3 + tx * tw) * l, py + (uy * 0.75 * flat + dy * 0.3) * l + 0.02, pz + (uz * 0.75 + dz * 0.3 + tz * tw) * l, [sh * 1.1, sh * 1.1, sh * 1.1], 0.4 * dy + 0.4, 1));
  }
  // every face turned outward, and lit as part of the mound it lies on (facet by facet a bush reads as a crystal)
  const P = g.p, I = g.i;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    if (nx * (P[a] + P[b] + P[c]) + ny * (P[a + 1] + P[b + 1] + P[c + 1] + 0.6 * R) + nz * (P[a + 2] + P[b + 2] + P[c + 2]) < 0) { const q = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = q; }
  }
  const geo = g.build(), Q = geo.attributes.position, N = geo.attributes.normal;
  for (let i = 0; i < Q.count; i++) {
    const x = Q.getX(i), y = Q.getY(i) / flat + 0.3 * R, z = Q.getZ(i), l = Math.hypot(x, y, z) || 1;
    N.setXYZ(i, lerp(N.getX(i), x / l, 0.75), lerp(N.getY(i), y / l, 0.75), lerp(N.getZ(i), z / l, 0.75));
  }
  return geo;
}
// the same bush for the closest pass: a twiggy mound of many small round leaves over a dark core. Bare stems fork out
// from the root, each carries a spray of leaves toward its end, and more leaves fill the shell between them; no leaf
// is bigger than a hand. `bare` (late September): the leaves are down and the forks show.
function nearBushGeo(rng, R, flat, leaf, bare) {
  const g = new Geo(), core = 0.74, seg = 7, lo = [], mid = [];
  const top = g.v(0, R * flat * core, 0, [0.24, 0.24, 0.24], 0.3, 0.5);
  for (let k = 0; k < seg; k++) {
    const a = (k / seg) * 6.283 + rng() * 0.4, c = Math.cos(a), s = Math.sin(a);
    mid.push(g.v(c * R * core * 0.72, R * flat * core * 0.66, s * R * core * 0.72, [0.18, 0.18, 0.18], 0.15, 0.36));
    lo.push(g.v(c * R * core * 1.02, 0, s * R * core * 1.02, [0.11, 0.11, 0.11], 0, 0.2));
  }
  for (let k = 0; k < seg; k++) { const k1 = (k + 1) % seg; g.tri(top, mid[k1], mid[k]); g.quad(mid[k], mid[k1], lo[k1], lo[k]); }
  const leafAt = (px, py, pz, sz) => {
    const pl = Math.hypot(px, py / flat, pz) || 1, dx = px / pl, dy = py / flat / pl, dz = pz / pl;
    let nx = dx * 0.7 + rng.range(-0.5, 0.5), ny = dy * 0.7 + 0.45 + rng.range(-0.3, 0.3), nz = dz * 0.7 + rng.range(-0.5, 0.5);
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let ax = -nz, ay = 0, az = nx; const al = Math.hypot(ax, az); if (al < 0.05) { ax = 1; az = 0; } else { ax /= al; az /= al; }
    const bx = ny * az - nz * ay, by = nz * ax - nx * az, bz = nx * ay - ny * ax;
    const th = rng() * 6.283, c = Math.cos(th), s = Math.sin(th), l = sz * 0.5, w = sz * 0.42;
    const ux = (ax * c + bx * s) * l, uy = (ay * c + by * s) * l, uz = (az * c + bz * s) * l, vx = (bx * c - ax * s) * w, vy = (by * c - ay * s) * w, vz = (bz * c - az * s) * w;
    const out = clamp(py / (R * flat) * 0.55 + 0.45, 0.3, 1), sh = (0.5 + 0.5 * out) * rng.range(0.8, 1.2), wv = 0.1 + 0.34 * out, ao = 0.45 + 0.55 * out;
    const a = g.v(px - ux, py - uy, pz - uz, [sh * 0.68, sh * 0.68, sh * 0.68], wv, ao * 0.8), b = g.v(px + vx, py + vy, pz + vz, [sh, sh, sh], wv, ao);
    const cc = g.v(px + ux, py + uy, pz + uz, [sh * 1.14, sh * 1.14, sh * 1.14], wv + 0.3, ao), d = g.v(px - vx, py - vy, pz - vz, [sh * 0.94, sh * 0.94, sh * 0.94], wv, ao);
    g.tri(a, b, cc); g.tri(a, cc, d);
  };
  const ribbon = (p, q, w0, w1, c0, c1, wv) => {
    let tx = q[2] - p[2], tz = -(q[0] - p[0]); const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    g.quad(g.v(p[0] - tx * w0, p[1], p[2] - tz * w0, c0, wv * 0.5, 0.5), g.v(p[0] + tx * w0, p[1], p[2] + tz * w0, c0, wv * 0.5, 0.5),
      g.v(q[0] + tx * w1, q[1], q[2] + tz * w1, c1, wv, 0.9), g.v(q[0] - tx * w1, q[1], q[2] - tz * w1, c1, wv, 0.9));
  };
  const nTw = bare ? 12 : 7, nLf = bare ? 2 : 7, nSh = bare ? 6 : 22, tw = bare ? 0.03 : 0.02;
  const bark = bare ? [0.5, 0.46, 0.42] : [0.22, 0.2, 0.19], bark2 = bare ? [0.72, 0.66, 0.6] : [0.34, 0.3, 0.27];
  for (let k = 0; k < nTw; k++) {
    const th = Math.acos(1 - rng.range(0.06, 0.82)), ph = (k / nTw) * 6.283 * 1.6 + rng.range(-0.4, 0.4), r = R * rng.range(0.86, 1.08);
    const e = [Math.sin(th) * Math.cos(ph) * r, Math.cos(th) * r * flat, Math.sin(th) * Math.sin(ph) * r], m = [e[0] * 0.5, e[1] * 0.5 + 0.1 * R, e[2] * 0.5];
    ribbon([0, 0.02, 0], m, R * tw * 1.6, R * tw, bark, bark, 0.2); ribbon(m, e, R * tw, R * tw * 0.4, bark, bark2, 0.6);
    if (bare) for (let q = 0; q < 2; q++) { const t = rng.range(0.3, 0.9), b = [lerp(m[0], e[0], t), lerp(m[1], e[1], t), lerp(m[2], e[2], t)]; ribbon(b, [b[0] + rng.range(-0.3, 0.3) * R, b[1] + rng.range(0.05, 0.3) * R, b[2] + rng.range(-0.3, 0.3) * R], R * tw * 0.6, R * tw * 0.25, bark, bark2, 0.8); }
    for (let j = 0; j < nLf; j++) {
      const t = rng.range(0.35, 1.06), o = 0.17 * R;
      leafAt(lerp(m[0], e[0], t) + rng.range(-o, o), Math.max(0.03, lerp(m[1], e[1], t) + rng.range(-o, o) * flat), lerp(m[2], e[2], t) + rng.range(-o, o), leaf * rng.range(0.8, 1.25));
    }
  }
  for (let k = 0; k < nSh; k++) {
    const th = Math.acos(1 - rng.range(0.02, 0.93)), ph = rng() * 6.283, r = R * rng.range(0.8, 1.04);
    leafAt(Math.sin(th) * Math.cos(ph) * r, Math.cos(th) * r * flat + 0.03, Math.sin(th) * Math.sin(ph) * r, leaf * rng.range(0.8, 1.3));
  }
  const P = g.p, I = g.i;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
    if (nx * (P[a] + P[b] + P[c]) + ny * (P[a + 1] + P[b + 1] + P[c + 1] + 0.6 * R) + nz * (P[a + 2] + P[b + 2] + P[c + 2]) < 0) { const q = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = q; }
  }
  const geo = g.build(true), Q = geo.attributes.position, N = geo.attributes.normal;
  for (let i = 0; i < Q.count; i++) {
    const x = Q.getX(i), y = Q.getY(i) / flat + 0.3 * R, z = Q.getZ(i), l = Math.hypot(x, y, z) || 1;
    N.setXYZ(i, lerp(N.getX(i), x / l, 0.62), lerp(N.getY(i), y / l, 0.62), lerp(N.getZ(i), z / l, 0.62));
  }
  return geo;
}
// a crystal: an irregular prism of five or six faces that narrows a little upward and ends in a wedge (two roof
// faces meeting in a ridge, the shoulders at uneven heights); the points of its convex hull, base at y = 0
function crystalPts(rng, r, h, sides) {
  const pts = [], a0 = rng() * 6.283, ra = rng() * 6.283, rl = r * rng.range(0.15, 0.45), sh = rng.range(0.66, 0.8);
  for (let i = 0; i < sides; i++) {
    const a = a0 + (i / sides) * 6.283 + rng.range(-0.28, 0.28), k = rng.range(0.82, 1.16), c = Math.cos(a) * r * k, s = Math.sin(a) * r * k;
    pts.push(new THREE.Vector3(c * 1.14, 0, s * 1.14));
    pts.push(new THREE.Vector3(c * 0.9, h * (sh + rng.range(-0.07, 0.1) + 0.08 * Math.cos(a - ra)), s * 0.9));
  }
  pts.push(new THREE.Vector3(Math.cos(ra) * rl, h, Math.sin(ra) * rl), new THREE.Vector3(-Math.cos(ra) * rl * 0.8, h * 0.985, -Math.sin(ra) * rl * 0.8));
  return pts;
}
// a frost-heaved stone: a ball pushed about by noise and chopped by a few planes, smooth-shaded, dark toward its base
function stoneGeo(rng, noise, seg, rows, amp = 0.2) {
  const g = new Geo(), rings = [], planes = [], sx = rng() * 40, sy = rng() * 40;
  for (let k = 0; k < 5; k++) { const a = rng() * 6.283, e = rng.range(-0.2, 0.9); planes.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), rng.range(0.7, 0.92)]); }
  for (let a = 0; a <= rows; a++) {
    const th = (a / rows) * Math.PI, ring = [];
    for (let b = 0; b < seg; b++) {
      const ph = (b / seg) * 6.2832 + a * 0.3;
      let x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
      const d = 1 + amp * (noise.n3(x * 1.5 + sx, y * 1.5 + sy, z * 1.5) + 0.4 * noise.n3(x * 4 + sx, y * 4, z * 4 + sy));
      x *= d; y *= d; z *= d;
      for (const q of planes) { const over = x * q[0] + y * q[1] + z * q[2] - q[3]; if (over > 0) { x -= q[0] * over; y -= q[1] * over; z -= q[2] * over; } }
      const sh = 0.82 + 0.3 * noise.n3(x * 2.2 + sy, y * 2.2, z * 2.2 + sx);
      ring.push(g.v(x, y * 0.72, z * 0.88, [sh, sh, sh * 1.02], 0, clamp(0.3 + 0.7 * (y * 0.5 + 0.5) + (d - 1) * 1.2, 0.2, 1)));
    }
    rings.push(ring);
  }
  for (let a = 0; a < rows; a++) for (let b = 0; b < seg; b++) { const b1 = (b + 1) % seg; g.quad(rings[a][b], rings[a + 1][b], rings[a + 1][b1], rings[a][b1]); }
  return g.build();
}

// a height-field grid with a dropped skirt; ao can be splatted (contact and long shadows) before finish()
async function gridTerrain(ctx, x0, x1, z0, z1, nx, nz, hFn, skirt) {
  const W = nx + 1, pos = new Float32Array(W * (nz + 1) * 3), ao = new Float32Array(W * (nz + 1)).fill(1);
  const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
  for (let j = 0, k = 0; j <= nz; j++) {
    const z = z0 + j * dz;
    for (let i = 0; i <= nx; i++, k++) {
      const x = x0 + i * dx, edge = i === 0 || i === nx || j === 0 || j === nz;
      pos[k * 3] = x; pos[k * 3 + 1] = hFn(x, z) - (edge ? skirt : 0); pos[k * 3 + 2] = z;
    }
    if ((j & 3) === 3) await ctx.yield();
  }
  return {
    pos, ao,
    splat(x, z, r, amt) {
      const i0 = Math.max(0, Math.floor((x - r - x0) / dx)), i1 = Math.min(nx, Math.ceil((x + r - x0) / dx));
      const j0 = Math.max(0, Math.floor((z - r - z0) / dz)), j1 = Math.min(nz, Math.ceil((z + r - z0) / dz));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const d = Math.hypot(x0 + i * dx - x, z0 + j * dz - z) / r; if (d < 1) ao[j * W + i] *= 1 - amt * (1 - d * d);
      }
    },
    async finish() {
      for (let j = 1, k; j < nz; j++) for (let i = 1; i < nx; i++) {
        k = j * W + i;
        const avg = (pos[(k - 1) * 3 + 1] + pos[(k + 1) * 3 + 1] + pos[(k - W) * 3 + 1] + pos[(k + W) * 3 + 1]) / 4;
        ao[k] *= clamp(0.85 + (pos[k * 3 + 1] - avg) * (0.5 / Math.min(dx, dz)), 0.45, 1);
      }
      const idx = new Uint32Array(nx * nz * 6);
      for (let j = 0, q = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
        idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aAO', new THREE.BufferAttribute(ao, 1));
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      geo.computeVertexNormals();
      return geo;
    },
  };
}
// instancing for the generic shaders: iPos (xyz, scale), iRot (yaw, pitch, bank, phase), iCol (rgb, extra)
function instGeo(base, n) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; for (const k in base.attributes) geo.setAttribute(k, base.attributes[k]);
  const iPos = new Float32Array(n * 4), iRot = new Float32Array(n * 4), iCol = new Float32Array(n * 4);
  const aP = new THREE.InstancedBufferAttribute(iPos, 4), aR = new THREE.InstancedBufferAttribute(iRot, 4), aC = new THREE.InstancedBufferAttribute(iCol, 4);
  geo.setAttribute('iPos', aP); geo.setAttribute('iRot', aR); geo.setAttribute('iCol', aC);
  const o = {
    geo, iPos, iRot, iCol, aP, aR, aC, count: 0, max: n, tris: (base.index ? base.index.count : base.attributes.position.count) / 3,
    add(x, y, z, s, yaw, pit, bnk, ph, col, e = 1) {
      if (o.count >= n) return -1;
      const k = o.count * 4; iPos[k] = x; iPos[k + 1] = y; iPos[k + 2] = z; iPos[k + 3] = s;
      iRot[k] = yaw; iRot[k + 1] = pit; iRot[k + 2] = bnk; iRot[k + 3] = ph;
      iCol[k] = col[0]; iCol[k + 1] = col[1]; iCol[k + 2] = col[2]; iCol[k + 3] = e;
      geo.instanceCount = ++o.count; return o.count - 1;
    },
  };
  geo.instanceCount = 0;
  return o;
}

// hours: where the light stands and the sky that goes with it (azimuth 0 = north, the way we fly; -90 = west)
const HOURS = {
  evening: { el: 9, az: -72, exposure: 1.0, lum: 1, fogK: 1, portal: '#ffe6bf', hi: '#6f86a8',
    sky: { preset: 'goldenHour', zenith: '#33598f', mid: '#8aa3c2', horizon: '#F4DDB8', ground: '#5d5560', scatterColor: '#ffc98a', scatter: 0.55, sunColor: '#ffe2b8',
      clouds: { coverage: 0.54, lit: '#f7e6c6', shade: '#3A4350', silver: 1.4, scale: 0.9, wind: [0.012, 0.002] }, clouds2: { lit: '#f4ddb8', shade: '#8f8a98', opacity: 0.3 } } },
  dawn: { el: 7, az: 75, exposure: 1.0, lum: 0.9, fogK: 1.25, portal: '#ffd9cc', hi: '#8090b4',
    sky: { preset: 'dawn', zenith: '#2c4a86', horizon: '#f6c4b4', clouds: { coverage: 0.3, lit: '#ffd6c6', shade: '#5a5f86', silver: 1.3 } } },
  // "overcast": a slate deck breaking at the day's end. The sun is under its western edge: an amber band burns along
  // the horizon, the undersides of the deck take the colour, and the light comes in windows over the plain.
  overcast: { el: 11, az: -70, exposure: 1.0, lum: 0.96, fogK: 1.1, portal: '#ffd9a6', hi: '#7a86a8',
    sky: { preset: 'goldenHour', zenith: '#34446e', mid: '#8a7c9a', horizon: '#f7b274', ground: '#5a4c52', scatterColor: '#ff9a4a', scatter: 0.95, sunColor: '#ffd3a0',
      clouds: { coverage: 0.66, softness: 0.42, lit: '#ffc592', shade: '#3c4058', absorb: 1.3, silver: 1.7, scale: 0.85, detail: 0.7, wind: [0.014, 0.003] },
      clouds2: { lit: '#ffbf8c', shade: '#6d6682', opacity: 0.45 } } },
  night: { el: 30, az: -60, exposure: 1.6, lum: 0.4, fogK: 0.9, portal: '#bfe8d8', hi: '#1c2a4c',
    sky: { preset: 'night', aurora: 0.6, auroraAzimuth: 0, auroraSpread: 0.5, milkyWay: 0.5,
      bodies: [{ elevation: 30, azimuth: -60, size: 2.2, phase: 0.5, intensity: 1, dark: 0.03, glow: 0.2, glowColor: '#9db8ff' }], key: 0,
      clouds: { coverage: 0.26, softness: 0.38, lit: '#8398cc', shade: '#182446', opacity: 0.85 } } },
};

export default {
  id: 'the-branching',
  name: 'The Branching',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['air', 'tiny'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();

    // ---------------- variations
    const vr = rng.fork('vary'), hv = vary.hour || 'any';
    let hourId;
    if (hv === 'golden') hourId = 'evening'; else if (hv === 'dawn') hourId = 'dawn'; else if (hv === 'day') hourId = 'overcast'; else if (hv === 'night') hourId = 'night';
    else { const r = vr(); hourId = r < 0.12 ? 'night' : r < 0.3 ? 'overcast' : r < 0.58 ? 'evening' : r < 0.86 ? 'dawn' : 'evening'; }
    const sr = vr(), season = sr < 0.5 ? 'peak' : sr < 0.75 ? 'august' : 'late';
    const cast = { squirrel: vr.chance(0.3), owl: vr.chance(0.3), swans: vr.chance(0.3), spider: vr.chance(0.25) };
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const HR = HOURS[hourId], night = hourId === 'night';
    const D2R = Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(HR.az * D2R) * Math.cos(HR.el * D2R), Math.sin(HR.el * D2R), -Math.cos(HR.az * D2R) * Math.cos(HR.el * D2R));

    // ---------------- sky
    const sky = makeSky({ rng, ...HR.sky, sunElevation: night ? -35 : HR.el, sunAzimuth: night ? 160 : HR.az, bake: night, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    const fogFar = sky.colorAt(new THREE.Vector3(-0.25, 0.05, -1).normalize(), new THREE.Color()).multiplyScalar(0.92);
    const fogNear = new THREE.Color(PAL[1]).multiplyScalar(0.3).lerp(new THREE.Color(PAL[3]).multiplyScalar(0.36), 0.45).multiplyScalar(HR.lum);
    scene.fog = new THREE.FogExp2(fogNear.clone(), 0.0042);

    // ---------------- stage D: the hero (also gives the shared light uniforms and the fork graph)
    const hero = await buildHero(ctx, { palette: PAL, hour: hourId, season, density: clamp((density - 0.7) / 0.6, 0, 1), rareEvent: rare, sunDir: [sunDir.x, sunDir.y, sunDir.z] });
    await ctx.yield();
    const U = hero.uniforms, H = hero.heightAt, AN = hero.anchors, fly = AN.flyThrough;
    const heroParts = {}; hero.object.traverse((o) => { if (o.name) heroParts[o.name] = o; });

    // ---------------- frames: each stage is modelled in world coordinates as the camera meets it
    const L3 = 50, X0 = fly[0].x, z3 = fly[0].z + L3;
    const P3 = new THREE.Vector3(X0, H(X0, z3), z3);
    const dS = (x, z) => P3.y + KC * (H(P3.x + (x - P3.x) / KC, P3.z + (z - P3.z) / KC) - P3.y);
    const bench0 = (x, z) => 1.3 * noise.n2(x * 0.012, z * 0.012) + 0.45 * noise.n2(x * 0.045 + 3, z * 0.045);
    const b0 = bench0(P3.x, P3.z);
    const hC = (x, z) => {
      const w = smoothstep(z3 - 40, z3 + 10, z) * (1 - smoothstep(170, 300, Math.abs(x - X0)));
      const bench = P3.y + bench0(x, z) - b0;
      return w > 0.999 ? bench : lerp(dS(x, z), bench, w);
    };
    const z2 = z3 + 185, P2 = new THREE.Vector3(X0 + 3, hC(X0 + 3, z2), z2);
    const hB = (x, z) => P2.y + KB * (hC(P2.x + (x - P2.x) / KB, P2.z + (z - P2.z) / KB) - P2.y) + 1.5
      + 1.2 * (noise.n2(x * 0.018, z * 0.018 + 20) + 1) + 0.5 * noise.n2(x * 0.06 + 9, z * 0.06);
    const z1 = z2 + 185, zP1 = z1 - 40, bCx = X0 + 3, bCz = zP1 - 1, bBase = hB(bCx, bCz);
    const P1 = new THREE.Vector3(X0 + 6, bBase + 22, zP1);
    const a0f = (x, z) => 4.5 * noise.n2(x * 0.007 + 9, z * 0.007) + 1.8 * noise.n2(x * 0.025, z * 0.025 + 4);
    const a00 = a0f(P1.x, P1.z);
    const hA = (x, z) => P1.y + a0f(x, z) - a00;
    const z0 = z1 + 165;
    const ease = (f) => { const t = clamp(f, 0, 1); return t * t * (3 - 2 * t); };
    const L1 = 65, L2 = 60;

    // ---------------- the path (north is -z)
    const pts = [];
    const pA = (dx, dy, dz) => pts.push([X0 + dx, hA(X0 + dx, z0 - dz) + dy, z0 - dz]);
    pA(0, 14, 0); pA(0.4, 14, 34); pA(3, 12.5, 68); pA(8.5, 10.2, 97); pA(10.2, 9, 116); pA(8.6, 10.5, 140);
    pts.push([P1.x, Math.max(P1.y, hA(P1.x, z1)) + 14, z1]);
    for (const [f, dy, dx] of [[0.3, 19.5, -0.6], [0.6, 25, -1.4], [1, 23.5, -2.4]]) pts.push([P1.x + dx, P1.y + dy, z1 - L1 * f]);
    const xB = (z) => lerp(P1.x - 2.4, P2.x, clamp((z1 - L1 - z) / (z1 - L1 - z2), 0, 1));
    for (const [dz, dy] of [[38, 24], [76, 15]]) { const z = z1 - L1 - dz, x = xB(z); pts.push([x, hB(x, z) + dy, z]); }
    pts.push([P2.x, hB(P2.x, z2) + 13, z2]);
    const yB2 = hB(P2.x, z2) + 13, xC1 = X0 + 1, yC2 = hC(xC1, z2 - L2) + 5;
    for (const f of [0.35, 0.7]) pts.push([lerp(P2.x, xC1, f), lerp(yB2, yC2, ease(f) * 0.9 + f * 0.1), z2 - L2 * f]);
    pts.push([xC1, yC2, z2 - L2]);
    const iBench = pts.length + 1;                 // the climb may start from the second bench point on
    for (const [dz, dx, dy] of [[40, -2.5, 7.2], [80, 0.6, 6.8]]) { const z = z2 - L2 - dz; pts.push([X0 + dx, hC(X0 + dx, z) + dy, z]); }   // (seven metres up, the file ten metres off to our right: whole animals, none cut by the frame)
    const yP3 = P3.y + 8.5;
    pts.push([X0 + 0.5, hC(X0 + 0.5, z3 + 22) + 7, z3 + 22]);
    pts.push([P3.x, yP3, z3]);
    // up the col while the valley shrinks to its true size (the scaled ground stays under us), then the hero's own line:
    // low over the saddle, out over the sunny side of the spur with the delta open ahead, and back to the gate
    {
      const nf = fly.length, st = fly[nf - 2], seat = fly[nf - 1];
      const hS = (x, z, s) => P3.y + s * (H(P3.x + (x - P3.x) / s, P3.z + (z - P3.z) / s) - P3.y);
      for (const dz of [L3 * 0.25, L3 * 0.5, L3 * 0.75]) {
        const z = z3 - dz, f = dz / L3, x = lerp(P3.x, fly[0].x, f), s = Math.pow(KC, 1 - Math.pow(ease(f), 1.4));       // (the last pull-out begins gently: the file beside us keeps its size as we lift)
        let g = -1e9; for (let ax = -6; ax <= 6; ax += 6) for (let az = -6; az <= 6; az += 6) g = Math.max(g, hS(x + ax, z + az, s));
        pts.push([x, Math.max(lerp(yP3, fly[0].y, f * f * (3 - 2 * f) * 0.6 + f * 0.4), g + (f < 0.4 ? 8 : 9)), z]);
      }
      for (let i = 0; i < nf - 2; i++) pts.push(fly[i].clone());
      // one even climb: no point may ask for a rise steeper than 33 degrees from the one before, nor a dip after it
      // (the climb is made early, so that the camera is level and high when the crest passes under it)
      const iTop = pts.length - nf + 3, hd = (a, b) => Math.hypot((b.x ?? b[0]) - (a.x ?? a[0]), (b.z ?? b[2]) - (a.z ?? a[2]));
      const gy = (q) => q.y ?? q[1], sy = (q, y) => { if (q.isVector3) q.y = y; else q[1] = y; };
      for (let i = iTop; i > iBench + 1; i--) sy(pts[i - 1], Math.max(gy(pts[i - 1]), gy(pts[i]) - 0.66 * hd(pts[i - 1], pts[i])));
      for (let i = iBench + 1; i <= iTop; i++) sy(pts[i], Math.max(gy(pts[i]), gy(pts[i - 1]) - 0.04 * hd(pts[i - 1], pts[i])));
      var iFly = pts.length - nf + 2;
      pts.push(st.clone(), st.clone().lerp(seat, 0.5), seat.clone());
    }
    const path = makePath(pts, { samples: 900 });
    const _pz = new THREE.Vector3();
    // (z falls monotonically along the path as far as the river's first fork: every stage mark lies before it)
    let uNorth = 0.5; { let zm = 1e9; for (let i = 0; i <= 240; i++) { const z = path.pointAt(i / 240, _pz).z; if (z < zm) { zm = z; uNorth = i / 240; } } }
    const uOfZ = (z) => { let a = 0, b = uNorth; for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (path.pointAt(m, _pz).z > z) a = m; else b = m; } return (a + b) / 2; };
    const UK = { l1a: uOfZ(z1), l1b: uOfZ(z1 - L1), l2a: uOfZ(z2), l2b: uOfZ(z2 - L2), l3a: uOfZ(z3), l3b: uOfZ(z3 - L3), crest: uOfZ(300) };
    await ctx.yield();

    // path lookup by z (z falls monotonically along the path up to uNorth)
    const PTN = 1400, PT = new Float32Array((PTN + 1) * 3), PTmax = Math.floor(uNorth * PTN);
    for (let i = 0; i <= PTN; i++) { path.pointAt(i / PTN, _pz); PT[i * 3] = _pz.x; PT[i * 3 + 1] = _pz.y; PT[i * 3 + 2] = _pz.z; }
    // marks of the finale: where the path passes the hero's own keys (found in space: the line crosses itself in plan)
    const uNear = (q) => { let bi = 0, bd = 1e18; for (let i = 0; i <= PTN; i++) { const d = (PT[i * 3] - q.x) ** 2 + (PT[i * 3 + 1] - q.y) ** 2 + (PT[i * 3 + 2] - q.z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi / PTN; };
    const FK = AN.flyKeys, UF = { root: uNear(pts[iFly + FK.root]), fork: uNear(pts[iFly + FK.fork]), turn: uNear(pts[iFly + FK.turn]), climb: uNear(pts[iFly + FK.climb]) };
    // the walk-in is a third of the journey now (it was six tenths): KU turns a span of the old progress into the new,
    // and uo() gives the new progress of a place the old path reached at uOld (the walk-in itself is unchanged in space)
    const LOLD = 1016, KU = LOLD / path.length, uo = (uOld) => uOld * KU;
    const atZ = (z) => {
      let a = 0, b = PTmax; while (b - a > 1) { const m = (a + b) >> 1; if (PT[m * 3 + 2] > z) a = m; else b = m; }
      const za = PT[a * 3 + 2], zb = PT[b * 3 + 2], t = clamp((za - z) / Math.max(za - zb, 1e-6), 0, 1);
      return { x: lerp(PT[a * 3], PT[b * 3], t), y: lerp(PT[a * 3 + 1], PT[b * 3 + 1], t) };
    };

    // a point given in the camera path's own frame at progress u: metres ahead, to the right and up
    const _tn = new THREE.Vector3();
    const railPoint = (u, a, b, c, out) => {
      const uu = clamp(u, 0, 1); path.pointAt(uu, out); path.tangentAt(uu, _tn);
      const hl = Math.hypot(_tn.x, _tn.z) || 1, fx = _tn.x / hl, fz = _tn.z / hl;
      out.x += fx * a - fz * b; out.y += c; out.z += fz * a + fx * b;
      return out;
    };
    // keys [u, ahead, right, up] read as a smooth curve in u
    const railKeys = (K, u, out) => {
      let i = 0; while (i < K.length - 2 && u > K[i + 1][0]) i++;
      const k0 = K[Math.max(0, i - 1)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(K.length - 1, i + 2)], du = k2[0] - k1[0], t = clamp((u - k1[0]) / du, 0, 1);
      const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2, v = [0, 0, 0];
      for (let c = 1; c <= 3; c++) {
        const m1 = (k2[c] - k0[c]) / Math.max(k2[0] - k0[0], 1e-6) * du, m2 = (k3[c] - k1[c]) / Math.max(k3[0] - k1[0], 1e-6) * du;
        v[c - 1] = h00 * k1[c] + h10 * m1 + h01 * k2[c] + h11 * m2;
      }
      return railPoint(u, v[0], v[1], v[2], out);
    };
    const toLocal = (g, v) => { v.x = (v.x - g.position.x) / g.scale.x; v.y = (v.y - g.position.y) / g.scale.x; v.z = (v.z - g.position.z) / g.scale.x; return v; };

    // ---------------- shared material plumbing
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const cover = hourId === 'overcast' ? 0.08 : 0;           // under the breaking deck the sun comes in windows
    const stageU = (cloud) => ({
      uTime: U.uTime, uSunL: U.uSunL, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uHorizCol: U.uHorizCol, uPal: U.uPal, uSnow: U.uSnow,
      uGreen: U.uGreen, uAurora: U.uAurora, uMist: U.uMist, uHazeCol: U.uHazeCol, uHaze: { value: 0 },
      uCamL: { value: new THREE.Vector3() }, uCloud: { value: new THREE.Vector4(cloud[0], cloud[1], cloud[2], cloud[3] + cover) }, uFade: { value: 1 },
    });
    const frost = hourId === 'dawn' ? 0.75 : season === 'late' ? 0.35 : 0;
    const surfMat = (SU, a, b, wind, defines = {}) => new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), SU, { uMatA: { value: new THREE.Vector4(a[0], a[1], a[2], a[3]) }, uMatB: { value: new THREE.Vector4(b[0], b[1], b[2], b[3] ?? 0) }, uWind: { value: new THREE.Vector4(wind[0], wind[1], wind[2], wind[3]) } }),
      vertexShader: SURF_VS, fragmentShader: SURF_FS, defines, fog: true, side: THREE.DoubleSide,
    });
    const terrMat = (SU, mode, extra = {}, side = THREE.FrontSide) => new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), SU, { uPatch: { value: new THREE.Vector4(0, 0, 0, 0) }, uRun: { value: new THREE.Vector4(0, 0, 1, 1) }, uHeath: { value: new THREE.Vector4(0, 1, 0, 0) }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uTexS: { value: 1 } }, extra),
      vertexShader: TERR_VS, fragmentShader: TERR_FS, defines: { MODE: mode }, fog: true, side,
    });
    const dewMat = (SU, defines = {}, under = null) => new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), SU, { uUT: UT, uUnder: { value: under || new THREE.Color(PAL[1]).multiplyScalar(0.16 * HR.lum + 0.02) } }),
      vertexShader: DEW_VS, fragmentShader: DEW_FS, defines, fog: true,
    });
    const UT = { value: -10 };
    const sprites = [];
    const spriteSys = (SU, group, n, box, vel, size, maxPx, wob, nearFade, color, lit, sr) => {
      n = Math.max(8, Math.round(n * detail));
      const pos = new Float32Array(n * 3), aS = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { pos[i * 3] = sr(); pos[i * 3 + 1] = sr(); pos[i * 3 + 2] = sr(); aS[i * 4] = size * sr.range(0.5, 1.4); aS[i * 4 + 1] = sr(); aS[i * 4 + 2] = sr(); aS[i * 4 + 3] = sr(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
      const spr = new THREE.Vector4(400, maxPx, wob, nearFade);
      const m = new THREE.ShaderMaterial({
        uniforms: Object.assign(fogU(), SU, { uBox: { value: new THREE.Vector3(box[0], box[1], box[2]) }, uVel: { value: new THREE.Vector3(vel[0], vel[1], vel[2]) }, uSpr: { value: spr }, uColor: { value: new THREE.Color(color) }, uLit: { value: new THREE.Vector3(lit[0], lit[1], lit[2]) } }),
        vertexShader: SPR_VS, fragmentShader: SPR_FS, fog: true, transparent: true, depthWrite: false,
      });
      const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 4; group.add(p); sprites.push({ spr, maxFrac: maxPx / 450 });
      return p;
    };
    const hl = Math.hypot(sunDir.x, sunDir.z) || 1, shx = -sunDir.x / hl, shz = -sunDir.z / hl, shLen = clamp(Math.cos(HR.el * D2R) / Math.max(Math.sin(HR.el * D2R), 0.05), 0.5, 4);
    const caster = (terr) => (x, z, r, h, amt = 0.5) => {
      terr.splat(x, z, r * 1.6, amt);
      const n = Math.min(24, Math.ceil((h * shLen) / (r * 1.5)));
      for (let i = 1; i <= n; i++) terr.splat(x + shx * i * r * 1.5, z + shz * i * r * 1.5, r * 1.35, amt * 0.62 * (1 - i / (n + 1)));
    };
    const stageMesh = (group, geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.name = name; group.add(m); return m; };
    // frost-shattered rock: a ball pushed about by noise and chopped by planes; flat-topped if top is given
    const rockBall = (cx, cy, cz, rx, ry, rz, seg, rows, rr, amp, top = 1e9, cuts = 7) => {
      const pos = [], ao = [], idx = [], W = seg + 1, planes = [];
      for (let k = 0; k < cuts; k++) { const a = rr() * 6.283, e = rr.range(-0.3, 0.9); planes.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), rr.range(0.72, 0.95)]); }
      const sx = rr() * 50, sy = rr() * 50;
      for (let a = 0; a <= rows; a++) for (let b = 0; b <= seg; b++) {
        const th = (a / rows) * Math.PI, ph = (b / seg) * 6.2832;
        let x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        const d = 1 + amp * (noise.n3(x * 1.6 + sx, y * 1.6 + sy, z * 1.6) + 0.45 * noise.n3(x * 4.2 + sx, y * 4.2, z * 4.2 + sy));
        x *= d; y *= d; z *= d;
        for (const p of planes) { const over = x * p[0] + y * p[1] + z * p[2] - p[3]; if (over > 0) { x -= p[0] * over; y -= p[1] * over; z -= p[2] * over; } }
        const wy = Math.min(cy + y * ry, top - 0.12 * Math.max(0, 1 - y) * ry * 0.1);
        pos.push(cx + x * rx, wy, cz + z * rz); ao.push(clamp(0.35 + 0.65 * (y * 0.5 + 0.5) + (d - 1) * 1.2, 0.2, 1));
      }
      for (let a = 0; a < rows; a++) for (let b = 0; b < seg; b++) { const i = a * W + b; idx.push(i, i + 1, i + W, i + 1, i + W + 1, i + W); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAO', new THREE.Float32BufferAttribute(ao, 1)); g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    await ctx.yield();

    // =================================================================================================
    // STAGE A: the lichen garden (x1200). A lane 36 m wide, the hero lichen on the entry axis.
    const gA = new THREE.Group(); gA.name = 'stage-A'; scene.add(gA);
    const SA = stageU([12, 2, 0.0045, 0.34]);
    const rA = rng.fork('stage-a');
    const crust = await gridTerrain(ctx, X0 - 240, X0 + 250, z1 - 320, z0 + 70, 98, 112, hA, 40);
    const castA = caster(crust);
    const hxA = X0, hzA = z0 - 110, hyA = hA(hxA, hzA) - 1;
    const lichBase = lin('#7d8072', 0.55), lichTip = lin(PAL[0], 0.86);
    const lichA = [0.42, 1.3, 0.22, 26], lichB = [0.55, 0.5, 0.4, frost], lichW = [0.7, 0.05, 4.2, 0.012];
    const beadSpots = [];
    {
      // the hero lichen, lofted from the delta's own fork graph
      const graph = hero.graph; let gy = 0; for (const n of graph) gy = Math.max(gy, n.y);
      const Lu = 61 / gy, RAD = [3.1, 2.1, 1.35, 0.85, 0.52, 0.3, 0.14], end = [], segs = [];
      for (const n of graph) {
        const pz = n.parent >= 0 ? end[n.parent][2] : 0, dz = n.parent >= 0 ? rA.gauss() * n.len * Lu * 0.2 : 0;
        const a = n.parent >= 0 ? end[n.parent] : [0, 0, 0], b = [n.x * Lu, n.y * Lu, pz + dz];
        end[n.id] = b;
        segs.push({ a, b, ra: RAD[n.order], rb: RAD[n.order] * 0.74, order: n.order, h: clamp(b[1] / 72, 0, 1) });
        if (n.kids.length === 0) {
          const dl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, d = [(b[0] - a[0]) / dl, (b[1] - a[1]) / dl, (b[2] - a[2]) / dl];
          const nt = rA.int(2, 3);
          for (let t = 0; t < nt; t++) {
            const d1 = [d[0] + rA.range(-0.7, 0.7), d[1] + rA.range(-0.2, 0.6), d[2] + rA.range(-0.7, 0.7)], l1 = Math.hypot(d1[0], d1[1], d1[2]) || 1, len = rA.range(3.5, 6);
            const c = [b[0] + (d1[0] / l1) * len, b[1] + (d1[1] / l1) * len, b[2] + (d1[2] / l1) * len];
            segs.push({ a: b, b: c, ra: RAD[5], rb: RAD[5] * 0.7, order: 5, h: clamp(c[1] / 72, 0, 1) });
            for (let q = 0; q < 2; q++) {
              const e = [c[0] + rA.range(-1.6, 1.6), c[1] + rA.range(0.6, 2.6), c[2] + rA.range(-1.6, 1.6)];
              segs.push({ a: c, b: e, ra: RAD[6], rb: RAD[6], order: 6, h: clamp(e[1] / 72, 0, 1) });
            }
          }
        }
        if (n.order >= 1 && n.order <= 3 && rA.chance(0.5)) beadSpots.push([hxA + b[0], hyA + b[1] - RAD[n.order] * 0.9, hzA + b[2], rA.range(0.5, 1.0)]);
      }
      const g = new Geo();
      loftLichen(g, segs, rA, { base: lichBase, tip: lichTip, orders: 6, sides: 9, midTo: 3, height: 72 });
      await ctx.yield();
      const geo = g.build(); geo.translate(hxA, hyA, hzA);
      stageMesh(gA, geo, surfMat(SA, lichA, lichB, lichW), 'hero-lichen');
      castA(hxA, hzA, 7, 60, 0.6);
      var heroFork = [hxA + end[0][0], hyA + end[0][1], hzA + end[0][2]], heroArm = [end[1], end[0]].map((e) => [hxA + e[0], hyA + e[1], hzA + e[2]]);
    }
    await ctx.yield();
    // the lichen forest: a few modelled trees instanced with tilt, turn, size and tint
    const laneOK = (x, z, clear) => Math.abs(x - atZ(clamp(z, z1 - L1, z0)).x) > clear;
    const lichMat = surfMat(SA, lichA, lichB, lichW, { INST: 1 });
    const nearVar = [], farVar = [];
    for (let v = 0; v < 3; v++) {
      const g = new Geo(), H0 = v === 2 ? 44 : 64, o = { height: H0, orders: 5, ratio: v === 2 ? 0.8 : 0.72, spread: v === 2 ? 0.72 : 0.5, lift: v === 2 ? 0.1 : 0.28, radius: 2.4, lean: 0.14 };
      loftLichen(g, growLichen(rA, o), rA, { base: lichBase, tip: lichTip, orders: 5, sides: 6, midTo: 1, height: H0 });
      nearVar.push({ geo: g.build(), h: H0 });
      await ctx.yield();
    }
    for (let v = 0; v < 2; v++) {
      const g = new Geo(), H0 = v ? 46 : 62, o = { height: H0, orders: 4, ratio: v ? 0.8 : 0.72, spread: v ? 0.7 : 0.5, lift: 0.22, radius: 2.6, lean: 0.14 };
      loftLichen(g, growLichen(rA, o), rA, { base: lichBase, tip: lichTip, orders: 4, sides: 5, midTo: -1, height: H0 });
      farVar.push({ geo: g.build(), h: H0 });
    }
    await ctx.yield();
    const tintL = () => { const t = rA(), k = rA.range(0.82, 1.08); return t < 0.6 ? [k, k, k] : t < 0.8 ? [k * 0.92, k, k * 0.86] : [k, k * 0.97, k * 0.82]; };
    const nearI = nearVar.map((v) => instGeo(v.geo, 20)), farI = farVar.map((v) => instGeo(v.geo, Math.round(64 * detail)));
    const lichSpots = [];
    for (let t = 0, placed = 0; t < 900 && placed < 34; t++) {
      const z = rA.range(z1 - 170, z0 + 30), x = X0 + rA.sign() * rA.range(24, 100);
      const cone = z < hzA + 115 && z > hzA - 100 ? 40 : 26;
      if (!laneOK(x, z, cone) || Math.hypot(x - hxA, z - hzA) < 46 || (Math.abs(x - hxA) < 38 && z < hzA - 10)) continue;
      if (lichSpots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 30)) continue;
      if (z < z0 - 40 && z > z1 - 52) { const dl = x - atZ(clamp(z, z1 - L1, z0)).x; if (dl > 0 && dl < 54) continue; }   // keep the mite's bough in the open
      const v = rA.int(0, 2), s = rA.range(0.72, 1.12), I = nearI[v];
      if (I.add(x, hA(x, z) - 1, z, s, rA() * 6.283, rA.range(-0.08, 0.08), rA.range(-0.08, 0.08), rA(), tintL()) < 0) continue;
      lichSpots.push([x, z]); castA(x, z, 7, nearVar[v].h * s * 0.8, 0.5); placed++;
    }
    for (let t = 0; t < 3000; t++) {
      const z = rA.range(z1 - 310, z0 + 60), x = X0 + rA.range(-235, 245), far = Math.abs(x - X0);
      if ((far < 105 && z > z1 - 175 && z < z0 + 35) || !laneOK(x, z, 30) || (Math.abs(x - hxA) < 44 && z < hzA)) continue;
      if (lichSpots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 24)) continue;
      const v = rA.int(0, 1), s = rA.range(0.7, 1.2);
      if (farI[v].add(x, hA(x, z) - 1, z, s, rA() * 6.283, rA.range(-0.1, 0.1), rA.range(-0.1, 0.1), rA(), tintL()) < 0) { if (farI[1 - v].count >= farI[1 - v].max) break; continue; }
      lichSpots.push([x, z]); castA(x, z, 7, farVar[v].h * s * 0.7, 0.4);
      if ((t & 255) === 0) await ctx.yield();
    }
    const farMeshes = [];
    nearI.forEach((I, k) => stageMesh(gA, I.geo, lichMat, 'lichen-near-' + k));
    farI.forEach((I, k) => farMeshes.push(stageMesh(gA, I.geo, lichMat, 'lichen-far-' + k)));
    await ctx.yield();

    // pixie cups holding rainwater, haircap moss, red-fruited stalks, leafy squamules
    const dewInst = (base, n) => {
      const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('normal', base.attributes.normal);
      const iPos = new Float32Array(n * 4), iRot = new Float32Array(n * 4), aP = new THREE.InstancedBufferAttribute(iPos, 4);
      geo.setAttribute('iPos', aP); geo.setAttribute('iRot', new THREE.InstancedBufferAttribute(iRot, 4)); geo.instanceCount = 0;
      const o = { geo, iPos, iRot, aP, count: 0, add(x, y, z, s, a = 0, b = 0, c = 0, d = 0) { if (o.count >= n) return -1; const k = o.count * 4; iPos[k] = x; iPos[k + 1] = y; iPos[k + 2] = z; iPos[k + 3] = s; iRot[k] = a; iRot[k + 1] = b; iRot[k + 2] = c; iRot[k + 3] = d; geo.instanceCount = ++o.count; return o.count - 1; } };
      return o;
    };
    await ctx.yield();
    const sphereG = new THREE.SphereGeometry(1, 14, 10);
    const discG = new THREE.CircleGeometry(2.95, 16); discG.rotateX(-Math.PI / 2); discG.translate(0, 22.7, 0);
    const cupI = instGeo(cupGeo(rA), 44), waterI = dewInst(discG, 44), cupSpots = [];
    const zSp = z0 - 88, spCup = [atZ(zSp).x - 20, 0, zSp];
    for (let t = 0; t < 1200 && cupI.count < 44; t++) {
      if ((t & 127) === 127) await ctx.yield();
      const first = cupI.count === 0, z = first ? spCup[2] : rA.range(z1 - 120, z0 + 10), lx = atZ(clamp(z, z1 - L1, z0)).x;
      const x = first ? spCup[0] : lx + rA.sign() * rA.range(15, 72), s = first ? 1 : rA.range(0.5, 1.15);
      if (!first && (lichSpots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 13) || cupSpots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 9) || Math.hypot(x - hxA, z - hzA) < 12)) continue;
      const y = hA(x, z) - 0.3, k = rA.range(0.85, 1.08);
      cupI.add(x, y, z, s, rA() * 6.283, rA.range(-0.07, 0.07), rA.range(-0.07, 0.07), rA(), [k, k, k * rA.range(0.9, 1)]);
      waterI.add(x, y, z, s);
      cupSpots.push([x, z, y, s]); castA(x, z, 5 * s + 2, 22 * s, 0.45);
      for (let b = 0; b < 2; b++) { const an = rA() * 6.283; beadSpots.push([x + Math.cos(an) * 3.5 * s, y + 24.2 * s, z + Math.sin(an) * 3.5 * s, rA.range(0.35, 0.7)]); }
    }
    await ctx.yield();
    spCup[1] = cupSpots[0][2];
    stageMesh(gA, cupI.geo, surfMat(SA, [0.26, 0.9, 0.3, 30], [0.25, 0.45, 0.35, frost * 0.5], [0.12, 0.05, 2.2, 0.012], { INST: 1 }), 'cups');
    stageMesh(gA, waterI.geo, dewMat(SA, { RIPPLE: 1 }), 'cup-water');
    await ctx.yield();
    const smallW = [0.9, 0.08, 3.4, 0.012];
    const mossMat = surfMat(SA, [0.3, 1.4, 0.25, 30], [0.7, 0.35, 0.45, frost * 0.6], smallW, { INST: 1 });
    const mossI = [instGeo(mossGeo(rA, false), Math.round(150 * detail)), instGeo(mossGeo(rA, true), Math.round(110 * detail))];
    for (let t = 0; t < 4000; t++) {
      if ((t & 511) === 511) await ctx.yield();
      const z = rA.range(z1 - 110, z0 + 20), lx = atZ(clamp(z, z1 - L1, z0)).x, dx = rA.range(7, 85), x = lx + rA.sign() * dx;
      if (noise.n2(x * 0.02 + 30, z * 0.02) < -0.05) continue;
      const v = rA.chance(0.42) ? 1 : 0, s = Math.min(rA.range(0.5, 1.3), dx < 14 ? 0.4 : 9), k = rA.range(0.8, 1.15);
      if (mossI[v].add(x, hA(x, z) - 0.2, z, s, rA() * 6.283, rA.range(-0.12, 0.12), rA.range(-0.12, 0.12), rA(), [k, k, k * 0.9]) < 0 && mossI[1 - v].count >= mossI[1 - v].max) break;
    }
    mossI.forEach((I, k) => stageMesh(gA, I.geo, mossMat, 'moss-' + k));
    const redI = instGeo(redcapGeo(rA), 80);
    for (let t = 0; t < 900 && redI.count < 80; t++) {
      const z = rA.range(z1 - 100, z0 + 10), lx = atZ(clamp(z, z1 - L1, z0)).x, dx = rA.range(9, 70), x = lx + rA.sign() * dx;
      if (noise.n2(x * 0.03 + 60, z * 0.03) < 0.1 || Math.hypot(x - hxA, z - hzA) < 8) continue;
      redI.add(x, hA(x, z) - 0.2, z, Math.min(rA.range(0.55, 1.2), dx < 14 ? 0.42 : 9), rA() * 6.283, rA.range(-0.15, 0.15), rA.range(-0.15, 0.15), rA(), [1, 1, 1]);
    }
    await ctx.yield();
    stageMesh(gA, redI.geo, surfMat(SA, [0.3, 1.2, 0.5, 40], [0.35, 0.45, 0.4, frost * 0.5], smallW, { INST: 1 }), 'redcaps');
    await ctx.yield();
    const sqI = instGeo(squamuleGeo(), Math.round(3400 * detail));
    for (let i = 0; i < sqI.max; i++) {
      const z = rA.range(z1 - 125, z0 + 22), x = atZ(clamp(z, z1 - L1, z0)).x + rA.gauss() * 24, k = rA.range(0.75, 1.15);
      sqI.add(x, hA(x, z) + 0.02, z, rA.range(0.8, 1.9), rA() * 6.283, rA.range(-0.25, 0.2), rA.range(-0.2, 0.2), rA(), rA.chance(0.25) ? [k * 0.78, k * 0.95, k * 0.66] : [k, k, k * 0.96]);
      if ((i & 511) === 0) await ctx.yield();
    }
    stageMesh(gA, sqI.geo, surfMat(SA, [0.4, 1.6, 0.35, 30], [0.3, 0.3, 0.4, frost * 0.4], [0, 0.05, 1, 0.01], { INST: 1 }), 'squamules');
    await ctx.yield();
    // two lichened stones flank the hero in the entry view, well off the lane: rounded granite cobbles (boulders at
    // this scale) with a smaller one leaning on each, pale and warm so that they take the low sun, map lichen on top
    {
      const kr = rA.fork('knobs'), gs = [];
      for (const s of [-1, 1]) {
        const x = X0 + s * 19.5 + 0.9, z = z0 - 52 + s * 2, y = hA(x, z), parts = [];
        parts.push(rockBall(x, y + 2.2, z, 5.4, 4.3, 4.9, 22, 14, kr, 0.13, 1e9, 4));
        parts.push(rockBall(x - s * 4.6, y + 0.9, z + 3.2, 2.9, 2.2, 3.2, 16, 10, kr, 0.15, 1e9, 3));
        parts.push(rockBall(x + s * 3.4, y + 0.5, z - 4.4, 2.2, 1.5, 2.0, 14, 8, kr, 0.15, 1e9, 3));
        gs.push(mergeGeometries(parts)); parts.forEach((q) => q.dispose()); castA(x, z, 7, 8, 0.55);
        await ctx.yield();
      }
      const m = stageMesh(gA, gs[0], terrMat(SA, 3, { uPatch: { value: new THREE.Vector4(0, 0, 0, 1) }, uTint: { value: new THREE.Vector3(0.78, 0.74, 0.7) }, uTexS: { value: 0.8 } }, THREE.DoubleSide), 'knob-w');
      stageMesh(gA, gs[1], m.material, 'knob-e');
    }
    await ctx.yield();
    // springtails grazing the crust and pinging away
    const spI = instGeo(springtailGeo(lin('#4a5a7c', 0.8)), 40);
    for (let i = 0; i < 40; i++) {
      const z = rA.range(z1 - 20, z0 - 12), x = atZ(z).x + rA.sign() * rA.range(4, 26), k = rA.range(0.8, 1.2);
      spI.add(x, hA(x, z) + 0.1, z, rA.range(0.85, 1.2), 0, 0, 0, rA(), [k, k, k], rA.range(4.5, 9));
    }
    // ROUND 21 (F1): no springtail hops through our line. Nothing held a hop against the route. Here each of the forty
    // dealt animals has its whole loop walked (the shader's own law, HOP in SURF_VS: 3 m of creep along its heading
    // over the whole loop, and from 0.88 of the loop 30 m more in a hop that tops 13 m) against the route as this stage
    // meets it (the lens flies the route; where it stands at the hand-over, up to 0.45 m before the route's start, is
    // not in the line): the route from its start to where the stage is put away (z1 - L1), a point every quarter of a
    // metre, each put into the stage's own
    // frame as place() scales the stage about P1 (by KA^-e1), where 2.0 m of the lens's air is 2.0 * KA^e1 of the
    // stage's metres. The skin is the body's furthest vertex from its own origin at the dealt size (the shader turns
    // the body about that origin). A hop that keeps 2.0 m, and the half steps of the two walks besides (a pair fails
    // where d^2 is under T^2 + e^2, T the air and the skin, e the half steps: some 5 mm more than 2.0 m is asked), is
    // left as dealt. One that does not is handed the opposite
    // heading (iRot.x = 1); if that fails too, the rise is taken down a thirty-second of itself at a time, each
    // heading tried (the dealt one first), to the first that clears and no further than half (iRot.y = the share
    // taken off); if nothing clears, the animal is not drawn (size 0). iRot.x and iRot.y are the instance's yaw and
    // pitch slots, dealt 0, which HOP never read. Nothing is drawn from the generator.
    {
      const LS = 0.25, ln = [];               // the line: x, y, z in the stage's frame, the need there, half its longer step to a neighbour
      for (let d = 0; ; d += LS) {
        path.posAtDist(Math.min(d, path.length), _pz);
        const f = Math.pow(KA, ease((z1 - _pz.z) / L1));
        ln.push(P1.x + (_pz.x - P1.x) * f, P1.y + (_pz.y - P1.y) * f, P1.z + (_pz.z - P1.z) * f, 2 * f, 0);
        if (_pz.z <= z1 - L1 || d >= path.length) break;
      }
      const nl = ln.length / 5, gap = (a, b) => Math.hypot(ln[a * 5] - ln[b * 5], ln[a * 5 + 1] - ln[b * 5 + 1], ln[a * 5 + 2] - ln[b * 5 + 2]);
      for (let m = 0; m < nl; m++) ln[m * 5 + 4] = Math.max(m > 0 ? gap(m, m - 1) : 0, m < nl - 1 ? gap(m, m + 1) : 0) / 2;
      // (the line in blocks of sixteen points: first, one past the last, the middle one, how far the others lie from it, their greatest need and half step)
      const bl = [];
      for (let b = 0; b < nl; b += 16) {
        const e = Math.min(nl, b + 16), c = Math.min(nl - 1, b + 8); let r = 0, nd = 0, hf = 0;
        for (let m = b; m < e; m++) { r = Math.max(r, gap(m, c)); nd = Math.max(nd, ln[m * 5 + 3]); hf = Math.max(hf, ln[m * 5 + 4]); }
        bl.push(b, e, c, r, nd, hf);
      }
      const pp = spI.geo.attributes.position; let far = 0;
      for (let v = 0; v < pp.count; v++) far = Math.max(far, Math.hypot(pp.getX(v), pp.getY(v), pp.getZ(v)));
      // the loop is walked in steps of an eighth of a metre at most: the creep over the first 0.88 of the loop (3 m a
      // whole loop, so 2.64 m), then the hop, whose fastest is 30 m, with the creep's 3 m a loop besides, and the 13 m
      // rise, the sine of 3.1416 times a smoothstep 0.12 long (slope 1.5 / 0.12 at its middle; the sine's 3.1416 with it)
      const HS = 0.125, NC = Math.ceil(3 * 0.88 / HS), NJ = Math.ceil(Math.hypot(30 * 1.5 / 0.12 + 3, 13 * 3.1416 * 1.5 / 0.12) * 0.12 / HS);
      // (two tested points, one of the line and one of the loop, stand off the true nearest pair by half a step each
      // along their own curves, at right angles to the gap between them: so the need is taken with the two half steps
      // added in the square)
      const clears = (i, turn, cut) => {
        const k = i * 4, ph = spI.iRot[k + 3], sg = 1 - 2 * turn, hx = Math.cos(ph * 40) * sg, hz = Math.sin(ph * 40) * sg, reach = far * spI.iPos[k + 3];
        for (let s = 0; s <= NC + NJ; s++) {
          const hp = s < NC ? 0.88 * s / NC : 0.88 + 0.12 * (s - NC) / NJ, j = smoothstep(0.88, 1, hp), r = j * 30 + hp * 3;
          const x = spI.iPos[k] + hx * r, y = spI.iPos[k + 1] + Math.sin(j * 3.1416) * 13 * (1 - cut), z = spI.iPos[k + 2] + hz * r;
          for (let b = 0; b < bl.length; b += 6) {
            const c = bl[b + 2] * 5, t = bl[b + 3] + bl[b + 4] + reach + bl[b + 5] + HS / 2;
            if ((x - ln[c]) ** 2 + (y - ln[c + 1]) ** 2 + (z - ln[c + 2]) ** 2 >= t * t) continue;
            for (let m = bl[b]; m < bl[b + 1]; m++) {
              const q = m * 5, T = ln[q + 3] + reach, e = ln[q + 4] + HS / 2;
              if ((x - ln[q]) ** 2 + (y - ln[q + 1]) ** 2 + (z - ln[q + 2]) ** 2 < T * T + e * e) return false;
            }
          }
        }
        return true;
      };
      for (let i = 0; i < spI.count; i++) {
        await ctx.yield();                    // (forty loops held against the line: the work is handed back between animals)
        if (clears(i, 0, 0)) continue;
        let turn = 1, cut = 0, ok = clears(i, 1, 0);
        for (let s = 1; s <= 16 && !ok; s++) { cut = s / 32; turn = 0; ok = clears(i, 0, cut); if (!ok) { turn = 1; ok = clears(i, 1, cut); } }
        if (ok) { spI.iRot[i * 4] = turn; spI.iRot[i * 4 + 1] = cut; } else spI.iPos[i * 4 + 3] = 0;
      }
    }
    stageMesh(gA, spI.geo, surfMat(SA, [0.25, 5, 0.6, 40], [0.1, 0.7, 0.3, 0], [0, 0.05, 1, 0.01], { INST: 1, HOP: 1 }), 'springtails');
    await ctx.yield();
    // the bough the mite walks: a fallen podetium lying along the lane, 13.5 m to the right of the path
    const zb0 = z0 - 96, zb1 = z1 - 34, BR = 2.3, boughAt = (z) => { const p = atZ(z); return [p.x + 13.5, atZ(Math.max(z, z1 + 2)).y - 4.8 - 0.05 * Math.max(z1 + 2 - z, 0), z]; };
    {
      const g = new Geo(), bp = [], br = [];
      const s0 = boughAt(zb0), s1 = boughAt(zb1);
      bp.push([s0[0] + 1.5, hA(s0[0], zb0 + 17) - 2, zb0 + 17], [s0[0] + 0.6, (s0[1] + hA(s0[0], zb0 + 8)) / 2 + 1, zb0 + 8]); br.push(2.9, 2.6);
      for (let z = zb0; z > zb1 - 0.01; z -= (zb0 - zb1) / 44) { bp.push(boughAt(z)); br.push(BR * (1 + 0.07 * Math.sin(z * 0.9) + 0.05 * Math.sin(z * 2.3))); }
      bp.push([s1[0] + 0.5, (s1[1] + hA(s1[0], zb1 - 8)) / 2 + 0.6, zb1 - 8], [s1[0] + 1.2, hA(s1[0], zb1 - 16) - 2, zb1 - 16]); br.push(2.1, 1.7);
      tube(g, bp, br, 12, (k, t) => mixc(mixc(lichBase, lichTip, 0.5 + 0.3 * Math.sin(k * 1.7)), [0.3, 0.36, 0.26], 0.25 + 0.25 * Math.sin(k * 0.77 + 1)), () => [0, 1]);
      for (let q = 0; q < 70; q++) { const z = rA.range(zb1, zb0), b = boughAt(z), an = rA.range(-1.9, 1.9), r = rA.range(0.22, 0.5); ball(g, b[0] + Math.sin(an) * BR * 0.97, b[1] + Math.cos(an) * BR * 0.97, z, r, r * 0.7, r, 5, mixc(lichTip, [0.5, 0.56, 0.42], rA()), 0, 1); }
      stageMesh(gA, g.build(), surfMat(SA, [0.5, 1.5, 0.22, 26], [0.3, 0.45, 0.4, frost * 0.5], [0, 0.05, 1, 0.01]), 'mite-bough');
      for (let z = zb0 - 6; z > zb1 + 6; z -= 23) { const b = boughAt(z); nearI[2].add(b[0] + 1.6, b[1] + 0.5, z, 0.36, rA() * 6.283, rA.range(-0.2, 0.2), -0.55, rA(), tintL()); castA(b[0], z, 6, 12, 0.4); }
      for (let z = zb0; z > zb1; z -= 12) castA(boughAt(z)[0], z, 5, 9, 0.45);
    }
    await ctx.yield();
    // the red velvet mite (or a wolf spider): body instanced once, eight legs solved on the CPU so the feet hold
    const miteCol = cast.spider ? lin('#5a4a3c', 0.7) : lin('#d21a14', 0.86), legR = cast.spider ? 1.25 : 1;
    const miteI = instGeo(miteBodyGeo(miteCol), 1); miteI.add(0, 0, 0, 1, 0, 0, 0, 0, [1, 1, 1]);
    const miteMatP = [[0.3, 6, 0.12, 14], [0.25, 1.0, 0.55, 0]];
    stageMesh(gA, miteI.geo, surfMat(SA, miteMatP[0], miteMatP[1], [0, 0.05, 1, 0.01], { INST: 1 }), 'mite');
    const legGeo = (() => {
      const g = new Geo(), dk = mixc(miteCol, [0.04, 0, 0], 0.35);
      for (let l = 0; l < 8; l++) tube(g, [[0, 0, l], [1, 1, l], [2, 0, l]], [0.22, 0.15, 0.07], 4, (k) => (k === 2 ? dk : miteCol), () => [0, 0.8]);
      return g.build();
    })();
    legGeo.attributes.position.setUsage(THREE.DynamicDrawUsage); legGeo.attributes.normal.setUsage(THREE.DynamicDrawUsage);
    stageMesh(gA, legGeo, surfMat(SA, miteMatP[0], miteMatP[1], [0, 0.05, 1, 0.01]), 'mite-legs');
    const mitePos = new THREE.Vector3(), miteW = new THREE.Vector3();
    const LEGR = [0.22, 0.15, 0.07];
    const setMite = (zm, time) => {
      const b = boughAt(zm), cx = b[0], cy = b[1] + BR + 1.25 + 0.05 * Math.sin(time * 9), d = zb0 - zm, DC = 2.6 * legR, ST = 0.6 * DC;
      mitePos.set(cx, cy, zm);
      miteI.iPos[0] = cx; miteI.iPos[1] = cy; miteI.iPos[2] = zm; miteI.iRot[2] = 0.03 * Math.sin(d * 2.4); miteI.aP.needsUpdate = true; miteI.aR.needsUpdate = true;
      const P = legGeo.attributes.position, N = legGeo.attributes.normal; let vi = 0;
      for (let l = 0; l < 8; l++) {
        const side = l < 4 ? -1 : 1, i = l & 3, c = (((d / DC + (i % 2 ? 0.5 : 0) + (side > 0 ? 0.5 : 0)) % 1) + 1) % 1;
        let fo, lift = 0;
        if (c < 0.6) fo = ST / 2 - c * DC; else { const q = (c - 0.6) / 0.4; fo = -ST / 2 + ST * q; lift = Math.sin(q * Math.PI) * 0.75; }
        const hz = zm - 1.0 + i * 0.72, hip = [cx + side * 0.95, cy - 0.3, hz];
        const fz = hz + (i - 1.5) * 0.85 * legR - fo, lat = 1.75 * legR, fb = boughAt(fz);
        const foot = [cx + side * lat, fb[1] + Math.sqrt(Math.max(BR * BR - Math.min(lat, BR - 0.2) ** 2, 0.2)) + lift - (lat > BR ? (lat - BR) * 1.2 : 0), fz];
        const knee = [(hip[0] + foot[0]) / 2 + side * 0.75 * legR, Math.max(hip[1], foot[1]) + 1.0 * legR + lift * 0.3, (hip[2] + foot[2]) / 2];
        const J = [hip, knee, foot];
        for (let k = 0; k < 3; k++) {
          const a = J[Math.max(0, k - 1)], e = J[Math.min(2, k + 1)]; let dx = e[0] - a[0], dy = e[1] - a[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          for (let s = 0; s < 4; s++, vi++) {
            const an = s * 1.5708, ca = Math.cos(an), sa = Math.sin(an), nx = -dy * ca, ny = dx * ca, nz = sa;
            P.setXYZ(vi, J[k][0] + nx * LEGR[k], J[k][1] + ny * LEGR[k], J[k][2] + nz * LEGR[k]); N.setXYZ(vi, nx, ny, nz);
          }
        }
      }
      P.needsUpdate = true; N.needsUpdate = true;
    };
    await ctx.yield();
    setMite(zb0 - 6, 0);
    // dew: the bead in the hero's first fork, beads on boughs and cup rims, one rolling down an arm
    const dewI = dewInst(sphereG, 2 + Math.min(beadSpots.length, 170));
    dewI.add(heroFork[0], heroFork[1] + 3.3, heroFork[2] + 2.4, 3.5, 0, 0, 0, 0.3);
    dewI.add(heroArm[0][0], heroArm[0][1], heroArm[0][2], 1.1, 0, 0, 0, 0.7);
    for (const b of beadSpots) dewI.add(b[0], b[1], b[2], b[3], 0, 0, 0, rA());
    dewI.aP.setUsage(THREE.DynamicDrawUsage);
    stageMesh(gA, dewI.geo, dewMat(SA), 'dew');
    // slowed raindrops and their splash crowns; the first one is keyed to the flight and lands in the cup on the left
    const NDROP = 11, dropI = dewInst(sphereG, NDROP), crownI = dewInst(new THREE.SphereGeometry(1, 8, 6), NDROP * 13);
    for (let i = 0; i < NDROP; i++) {
      let x, y, z;
      if (i === 0) { x = spCup[0]; z = spCup[2]; y = spCup[1] + 22.7; }
      else if (i < 6) { const c = cupSpots[1 + ((i * 7) % (cupSpots.length - 1))]; x = c[0]; z = c[1]; y = c[2] + 22.7 * c[3]; }
      else { z = rA.range(z1 - 60, z0 - 20); x = atZ(clamp(z, z1 - L1, z0)).x + rA.sign() * rA.range(10, 45); y = hA(x, z) + 0.5; }
      const fall = rA.range(80, 120), per = i === 0 ? 100 : rA.range(5.5, 10), ph = rA();
      dropI.add(x, y, z, 1.7, fall, per, ph, i === 0 ? 1 : 0);
      for (let k = 0; k < 13; k++) { const an = (k / 13) * 6.283; crownI.add(x + Math.cos(an) * 0.9, y, z + Math.sin(an) * 0.9, rA.range(0.3, 0.62), fall, per, ph, i === 0 ? 1 : 0); }
    }
    await ctx.yield();
    stageMesh(gA, dropI.geo, dewMat(SA, { DROP: 1 }), 'drops');
    stageMesh(gA, crownI.geo, dewMat(SA, { DROP: 1, CROWN: 1 }), 'crowns');
    spriteSys(SA, gA, 420, [150, 64, 150], [1.6, -0.25, 0.5], 0.5, 20, 1.2, 4, '#fff1d6', [0.85, 0.04, 0.7], rA.fork('motes'));
    await ctx.yield();
    { const cg = await crust.finish(); await ctx.yield(); stageMesh(gA, cg, terrMat(SA, 0), 'crust'); }
    await ctx.yield();
    // the macro backdrop: out-of-focus bearberry and sky. It thins away as we rise out of the garden.
    const domeU = { uOp: { value: 1 }, uLum: { value: HR.lum }, uHi: { value: new THREE.Color(HR.hi).multiplyScalar(0.42) }, uB: { value: 0 }, uFogC: { value: fogNear.clone() } };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 28, 18), new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SA, domeU), vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, depthTest: false, depthWrite: false,
    }));
    dome.renderOrder = -0.5; dome.frustumCulled = false; scene.add(dome);

    // =================================================================================================
    // STAGE B: the boulder and the bearberry mat (x30)
    const gB = new THREE.Group(); gB.name = 'stage-B'; gB.visible = false; scene.add(gB);
    const SB = stageU([9, 1.5, 0.006, 0.38]);
    const rB = rng.fork('stage-b');
    const mat = await gridTerrain(ctx, X0 - 300, X0 + 300, z2 - 270, z1 + 60, 104, 98, hB, 8);
    const castB = caster(mat);
    // the boulder that carries the garden (flat-topped under it), and the one the bird shelters behind
    // (the flush is written in the old path's progress v, shifted so that the crossing falls on u 0.16: vB(v) is its u now)
    const dB = clamp(0.16 / KU - 0.306, -0.01, 0.045), vB = (v) => (v + dB) * KU, uF = vB(0.268), Gv = railPoint(uF, 34, 9, 0, new THREE.Vector3()), Gp = [Gv.x, hB(Gv.x, Gv.z), Gv.z];
    const b2 = [Gp[0] + 15, hB(Gp[0] + 15, Gp[2] + 2) + 2.5, Gp[2] + 2];
    // The bird itself stands out on the mat, in the bearberry, where the picture at u 0.16 has it whole: 26 m ahead of
    // us, side on. It flushes just after (uF2), so it is a bird on the ground, with its shadow under
    // it and leaves against its belly, before it is a bird in the air.
    const uF2 = vB(0.3095), G2v = railPoint(uF2, 22.5, 1.2, 0, new THREE.Vector3()), G2 = [G2v.x, hB(G2v.x, G2v.z), G2v.z], PT_S = 1.85;
    castB(G2[0], G2[2], 6.5, 2.4, 0.62); castB(G2[0], G2[2], 3.6, 0.8, 0.4);
    const onRock = (x, z) => ((x - bCx) / 26) ** 2 + ((z - bCz) / 29) ** 2 < 1 || ((x - b2[0]) / 13.5) ** 2 + ((z - b2[2]) / 15.5) ** 2 < 1;
    {
      const rr = rB.fork('rocks');
      const g1 = rockBall(bCx, bBase + 3.5, bCz, 24, 21.5, 27, 56, 36, rr, 0.09, P1.y - 0.35, 9);
      stageMesh(gB, g1, terrMat(SB, 3, { uPatch: { value: new THREE.Vector4(P1.x, P1.z - 1, 7.6, 1) }, uTexS: { value: 3.6 }, uTint: { value: new THREE.Vector3(0.66, 0.64, 0.65) } }, THREE.DoubleSide), 'boulder');
      castB(bCx, bCz, 24, 20, 0.6);
      const m2 = terrMat(SB, 3, { uPatch: { value: new THREE.Vector4(0, 0, 0, 1) }, uTexS: { value: 3.6 }, uTint: { value: new THREE.Vector3(0.56, 0.53, 0.5) } }, THREE.DoubleSide);
      {
        // (wide and low, bedded in the mat with a skirt of smaller stones round its foot: nothing stands on a clean line)
        const sk = makeRng(hashSeed('b-skirt:' + ctx.seed)), parts = [rockBall(b2[0], b2[1] - 1.5, b2[2], 13, 9.5, 15, 36, 24, rr, 0.12, 1e9, 5)];
        await ctx.yield();
        for (let i = 0; i < 9; i++) {
          if (i === 4) await ctx.yield();
          const an = (i / 9) * 6.283 + sk.range(-0.25, 0.25), rd = sk.range(0.92, 1.12), x = b2[0] + Math.cos(an) * 13 * rd, z = b2[2] + Math.sin(an) * 15 * rd, r = sk.range(1.6, 4.2);
          parts.push(rockBall(x, hB(x, z) + r * 0.18, z, r * sk.range(1, 1.4), r * 0.62, r * sk.range(0.9, 1.3), 12, 8, sk, 0.14, 1e9, 3)); castB(x, z, r + 1, r * 0.8, 0.5);
        }
        await ctx.yield();
        stageMesh(gB, mergeGeometries(parts), m2, 'boulder-2'); parts.forEach((q) => q.dispose());
      }
      castB(b2[0], b2[2], 14, 9, 0.7); castB(b2[0], b2[2], 19, 4, 0.35);
      await ctx.yield();
      for (let i = 0; i < 5; i++) {
        const z = rr.range(z2 - 30, z1 - 70), x = atZ(z).x + rr.sign() * rr.range(22, 70), s = rr.range(2.5, 5.5);
        if (onRock(x, z)) continue;
        stageMesh(gB, rockBall(x, hB(x, z) + s * 0.3, z, s * 1.2, s * 0.8, s, 14, 10, rr, 0.14), m2, 'stone-b' + i); castB(x, z, s + 1, s, 0.5);
      }
      await ctx.yield();
      // grey lichened stones out across the mat, as far as it can be seen: they break the red and give it distance
      const fr = makeRng(hashSeed('b-stones:' + ctx.seed)), fg = [];
      for (let i = 0, t = 0; i < 20 && t < 400; t++) {
        const z = fr.range(z2 - 230, z1 - 60), x = atZ(clamp(z, z2, z1)).x + fr.sign() * fr.range(34, 230), s = fr.range(3, 9);
        if (onRock(x, z) || fg.some((q) => Math.hypot(q[0] - x, q[1] - z) < 40)) continue;
        const g = rockBall(x, hB(x, z) + s * 0.22, z, s * fr.range(1, 1.5), s * fr.range(0.55, 0.85), s * fr.range(0.9, 1.3), 14, 9, fr, 0.15); g.userData = null;
        fg.push([x, z, g]); castB(x, z, s + 1.5, s, 0.5); i++;
      }
      if (fg.length) { stageMesh(gB, mergeGeometries(fg.map((q) => q[2])), m2, 'stones-far'); fg.forEach((q) => q[2].dispose()); }
    }
    await ctx.yield();
    // the lemming's runway, on the left
    const zc0 = z1 - L1 + 6, zr0 = zc0 - 34, zr1 = zr0 - 70;
    const runA = [atZ(zr0).x - 11, zr0], runB = [atZ(zr1).x - 13.5, zr1];
    const runDist = (x, z) => { const ax = runB[0] - runA[0], az = runB[1] - runA[1], h = clamp(((x - runA[0]) * ax + (z - runA[1]) * az) / (ax * ax + az * az), 0, 1); return Math.hypot(x - runA[0] - ax * h, z - runA[1] - az * h); };
    const leafTint = () => {
      const t = rB(), k = rB.range(0.7, 1.2), red = lin(PAL[1]);
      if (season === 'august' && t < 0.5) return [0.1 * k, 0.24 * k, 0.07 * k];
      return t < 0.62 ? [red[0] * k * 1.3 + 0.03, red[1] * k * 1.3, red[2] * k * 1.3] : t < 0.74 ? [0.4 * k, 0.11 * k, 0.035 * k] : t < 0.8 ? lin(PAL[2], k * 0.75) : [0.17 * k, 0.02 * k, 0.03 * k];
    };
    await ctx.yield();
    for (let i = 0; i < 15; i++) rB();
    const lr = makeRng(hashSeed('b-leaves:' + ctx.seed));
    const PT_LEAVES = 16;
    const rosI = instGeo(rosetteGeo(lr), Math.round(1700 * detail) + PT_LEAVES), berI = instGeo((() => { const g = new Geo(); ball(g, 0, 0, 0, 1, 0.92, 1, 7, [1, 1, 1]); return g.build(); })(), 260);
    {
      // (most of them on our side of the bird and a little raised, so that they overlap its belly and hide its feet)
      const pr = makeRng(hashSeed('b-ptleaves:' + ctx.seed)), red = lin(PAL[1]), tq = path.tangentAt(vB(0.306), new THREE.Vector3());
      for (let i = 0; i < PT_LEAVES; i++) {
        const front = i < 11, an = front ? pr.range(-1.3, 1.3) : pr.range(1.6, 4.7), d = front ? pr.range(3.6, 8.5) : pr.range(4, 9), ca = Math.cos(an), sa = Math.sin(an);
        // (angle 0 points back along the path, toward where we come from)
        const x = G2[0] + (-tq.x * ca + tq.z * sa) * d, z = G2[2] + (-tq.z * ca - tq.x * sa) * d, k = pr.range(0.75, 1.25);
        rosI.add(x, hB(x, z) + (front ? pr.range(0.4, 1.3) : 0.2), z, pr.range(2.0, 3.0), pr() * 6.283, pr.range(-0.3, 0.3), pr.range(-0.3, 0.3), pr(), pr.chance(0.75) ? [red[0] * k * 1.3 + 0.03, red[1] * k * 1.3, red[2] * k * 1.3] : [0.4 * k, 0.11 * k, 0.035 * k]);
      }
    }
    for (let t = 0; t < 9000 && rosI.count < rosI.max; t++) {
      const z = rB.range(z2 - 45, z1 - 42), x = atZ(z).x + rB.gauss() * 26;
      if (onRock(x, z) || runDist(x, z) < 2.4) continue;
      const y = hB(x, z), s = rB.range(1.0, 1.75);
      rosI.add(x, y + 0.08, z, s, rB() * 6.283, rB.range(-0.15, 0.15), rB.range(-0.15, 0.15), rB(), leafTint());
      if (rB.chance(0.16)) berI.add(x + rB.range(-0.5, 0.5), y + 0.42 * s, z + rB.range(-0.5, 0.5), rB.range(0.26, 0.4), 0, 0, 0, 0, [0.02, 0.018, 0.03]);
      if ((t & 511) === 0) await ctx.yield();
    }
    const leafMat = surfMat(SB, [0.22, 3, 0.95, 70], [0.5, 0.3, 0.35, frost * 0.5], [0.3, 0.2, 5, 0.03], { INST: 1, LEAF: 1 });
    stageMesh(gB, rosI.geo, leafMat, 'bearberry');
    stageMesh(gB, berI.geo, surfMat(SB, [0.1, 3, 1.6, 90], [0, 0.6, 0.2, 0], [0, 0.1, 1, 0.01], { INST: 1 }), 'berries');
    // out to the edge of sight: bigger, coarser clumps in drifts (bearberry, russet and gold where it has turned,
    // green-black crowberry), so that the mat is leaves all the way and not a red sheet beyond the near field
    const rosFarI = instGeo(rosetteGeo(lr, 5, 2), Math.round(950 * detail));
    for (let t = 0; t < 12000 && rosFarI.count < rosFarI.max; t++) {
      const z = lr.range(z2 - 250, z1 - 46), lx = atZ(clamp(z, z2, z1)).x, dx = lr.sign() * lr.range(20, 240) * (lr.chance(0.5) ? 0.5 : 1), x = lx + dx;
      if (z > z2 - 30 && Math.abs(dx) < 34 && lr.chance(0.7)) continue;                 // the near field is already full
      if (onRock(x, z) || runDist(x, z) < 3.5 || noise.n2(x * 0.016 + 12, z * 0.016) + 0.4 * noise.n2(x * 0.06, z * 0.06 + 31) < -0.1) continue;
      const q = lr(), k = lr.range(0.75, 1.2), red = lin(PAL[1]), s = lr.range(2.2, 4.4);
      const col = q < 0.5 ? [red[0] * k * 1.35 + 0.03, red[1] * k * 1.3, red[2] * k * 1.3] : q < 0.66 ? [0.42 * k, 0.12 * k, 0.04 * k] : q < 0.76 ? lin(PAL[2], k * 0.75) : q < 0.9 ? [0.035 * k, 0.07 * k, 0.03 * k] : [0.2 * k, 0.03 * k, 0.04 * k];
      rosFarI.add(x, hB(x, z) + 0.05, z, s, lr() * 6.283, lr.range(-0.12, 0.12), lr.range(-0.12, 0.12), lr(), season === 'august' && q < 0.4 ? [0.1 * k, 0.24 * k, 0.07 * k] : col);
      if (s > 3.2) castB(x, z, s * 0.9, s * 0.5, 0.3);
      if ((t & 511) === 0) await ctx.yield();
    }
    stageMesh(gB, rosFarI.geo, leafMat, 'bearberry-far');
    await ctx.yield();
    const sprigI = instGeo(tuftGeo(rB, 12, 1.5, 0.11, 0.85, 0.15), Math.round(320 * detail));
    for (let t = 0; t < 2000 && sprigI.count < sprigI.max; t++) {
      const z = rB.range(z2 - 45, z1 - 42), x = atZ(z).x + rB.gauss() * 30;
      if (onRock(x, z) || runDist(x, z) < 2 || noise.n2(x * 0.05, z * 0.05 + 50) < 0.15) continue;
      const k = rB.range(0.7, 1.1);
      sprigI.add(x, hB(x, z), z, rB.range(0.8, 1.5), rB() * 6.283, 0, 0, rB(), [0.07 * k, 0.13 * k, 0.05 * k]);
      if ((t & 255) === 255) await ctx.yield();
    }
    await ctx.yield();
    stageMesh(gB, sprigI.geo, surfMat(SB, [0.25, 4, 0.4, 40], [0.4, 0.3, 0.4, frost * 0.6], [0.1, 0.2, 4, 0.03], { INST: 1 }), 'crowberry');
    await ctx.yield();
    // one dwarf birch twig, half shed, where the next pull-out begins
    {
      const g = new Geo(), bark = lin('#4a3628', 0.6), pale = lin('#8a7c6e', 0.6), tx = P2.x - 9.5, tz = z2 - 6, ty = hB(tx, tz) - 0.3;
      const segs = growLichen(rB, { height: 13, orders: 4, ratio: 0.76, spread: 0.55, lift: 0.12, radius: 0.5, lean: 0.35 });
      loftLichen(g, segs, rB, { base: bark, tip: pale, orders: 4, sides: 6, midTo: 2, height: 13 });
      await ctx.yield();
      const shed = season === 'late' ? 0.08 : 0.5;
      for (const s of segs) {
        if (s.order < 3) continue;
        for (let k = 0; k < 2; k++) {
          if (!rB.chance(shed)) continue;
          const t = rB.range(0.3, 1), c = [lerp(s.a[0], s.b[0], t), lerp(s.a[1], s.b[1], t), lerp(s.a[2], s.b[2], t)], col = mixc(lin(PAL[2], 0.95), lin('#c2571c', 0.9), rB());
          const nx = rB.range(-0.5, 0.5), nz = rB.range(-0.5, 0.5), ux = 1, uz = 0, r = rB.range(0.38, 0.55), ctr = g.v(c[0], c[1] + 0.1, c[2], col, 0.9, 1), rim = [];
          for (let q = 0; q < 12; q++) { const an = (q / 12) * 6.283, rr2 = r * (q % 2 ? 0.86 : 1), px = Math.cos(an) * rr2, pz = Math.sin(an) * rr2; rim.push(g.v(c[0] + px * ux, c[1] + 0.1 + px * nx + pz * nz, c[2] + pz + px * uz, mixc(col, [0.5, 0.2, 0.05], 0.25), 0.9, 1)); }
          for (let q = 0; q < 12; q++) g.tri(ctr, rim[q], rim[(q + 1) % 12]);
        }
      }
      const geo = g.build(); geo.translate(tx, ty, tz);
      stageMesh(gB, geo, surfMat(SB, [0.3, 3, 0.35, 40], [0.7, 0.3, 0.4, frost * 0.5], [0.16, 0.12, 3.2, 0.03]), 'birch-twig');
      castB(tx, tz, 3, 8, 0.4);
    }
    await ctx.yield();
    spriteSys(SB, gB, 130, [90, 34, 90], [3.2, -2.0, 0.9], 0.5, 16, 1.5, 3, PAL[2], [0.95, 0, 0.95], rB.fork('leaves'));
    spriteSys(SB, gB, 200, [70, 20, 70], [0.3, 0.05, 0.1], 0.16, 6, 2.6, 2.5, '#1a1612', [0.5, 0.02, 0.8], rB.fork('gnats'));
    await ctx.yield();
    stageMesh(gB, await mat.finish(), terrMat(SB, 1, { uRun: { value: new THREE.Vector4(runA[0], runA[1], runB[0], runB[1]) } }), 'mat');
    await ctx.yield();
    // the lemming (or an arctic ground squirrel standing sentinel first), seen from above and behind
    const lemI = instGeo(cast.squirrel ? lemmingGeo(lin('#8f7a56', 0.7), lin('#cdbf9c', 0.7), 1) : lemmingGeo(lin('#8a4a24', 0.75), lin('#b9a583', 0.7)), 1);
    lemI.add(runA[0], hB(runA[0], runA[1]), runA[1], 1.3, 0, 0, 0, 0, [1, 1, 1]);
    const lemPos = new THREE.Vector3(runA[0], hB(runA[0], runA[1]), runA[1]);
    stageMesh(gB, lemI.geo, surfMat(SB, [0.5, 5, 0.1, 12], [0.3, 0.75, 0.5, 0], [0, 0.1, 1, 0.01], { INST: 1 }), 'lemming');
    const runYaw = Math.atan2(-(runB[0] - runA[0]), -(runB[1] - runA[1]));
    const setLemming = (camZ, time) => {
      const s = clamp((0.8 * (zc0 - camZ)) / (zr0 - zr1), 0, 1), d = s * (zr0 - zr1), x = lerp(runA[0], runB[0], s), z = lerp(runA[1], runB[1], s);
      const hop = Math.abs(Math.sin(d * 0.9)), wait = s <= 0 ? 1 : 0, P = lemI.iPos, R = lemI.iRot, sz = cast.squirrel ? 1.45 : 1.3;
      P[0] = x + Math.sin(d * 0.35) * 0.5; P[1] = hB(x, z) + 0.1 + hop * 0.55 * (1 - wait); P[2] = z;
      P[3] = sz * (1 - smoothstep(0.93, 1, s));
      R[0] = runYaw + Math.sin(d * 0.35) * 0.12; R[1] = wait && cast.squirrel ? 1.25 + 0.04 * Math.sin(time * 2.1) : (0.5 - hop) * 0.3;
      if (wait && cast.squirrel) { P[1] += 1.6; R[0] = runYaw + 2.6 + 0.3 * Math.sin(time * 0.7); }
      lemPos.set(P[0], P[1], P[2]);
      lemI.aP.needsUpdate = true; lemI.aR.needsUpdate = true;
    };
    await ctx.yield();
    // the willow ptarmigan in autumn moult (or a snowy owl): crouched in the lee of the boulder, flushing as we come
    const white = [0.5, 0.5, 0.52], ruf = lin('#8c4a20', 0.8), late = season === 'late';
    const birdG = cast.owl
      ? birdGeo({ len: 12, span: 23, neck: 0, head: 1.9, body: white, belly: white, neckCol: white, headCol: white, wing: [0.5, 0.5, 0.52], tip: [0.3, 0.29, 0.28], tipFrom: 0.86, tail: [0.46, 0.46, 0.48], beak: [0.05, 0.05, 0.05], chord: 1.25, ns: 12, sides: 12, tailW: 1.2 })
      : birdGeo({ len: 11, span: 18, neck: 0.05, head: 2.0, tailRoot: [0.05, 0.05, 0.06], body: late ? mixc(ruf, white, 0.8) : ruf, belly: white, neckCol: late ? mixc(ruf, white, 0.6) : ruf, headCol: late ? mixc(ruf, white, 0.5) : ruf, wing: white, tip: white, tipFrom: 2, tail: [0.035, 0.035, 0.045], beak: [0.05, 0.05, 0.05], chord: 1.3, ns: 12, sides: 12, tailW: 2.3, tailL: 0.24, plump: 1.25, sweep: 0.06, taperK: 0.62, taperP: 2.6, headUp: 0.05, covert: 0.75, camber: 0.04, arch: 0.05 });
    const birdMatP = [[0.2, 2.5, 0.2, 24], [0.1, 0.35, 0.45, cast.owl ? 0.9 : 1.1]];
    const ptYaw = (() => { const t = path.tangentAt(vB(0.306), new THREE.Vector3()); return Math.atan2(-t.z, t.x) + 0.12; })();        // side on to us, head to the left
    const ptI = instGeo(birdG, 1); ptI.add(G2[0], G2[1] + 3.0, G2[2], PT_S, ptYaw, 0.2, 0, -1.5708, [1, 1, 1], 1.25);
    // (round 10: on the ground it is a standing bird, a geometry of its own; the flight mesh is shown from the flush on.
    // Both are built here, on one material, and setBird only says which of the two is visible)
    const ptS = instGeo(cast.owl ? owlSitGeo({ white, turn: 1.2 }) : grouseGeo({ white, ruf: late ? mixc(ruf, white, 0.55) : ruf, turn: 0.55 }), 1), ST_S = cast.owl ? 1.5 : PT_S;
    ptS.add(G2[0], G2[1] - 0.2, G2[2], ST_S, ptYaw, 0, 0, 0, [1, 1, 1], 0);
    const ptMat = surfMat(SB, birdMatP[0], birdMatP[1], [0, 0.1, 1, 0.01], { INST: 1, BIRD: 1 });
    const ptFlyM = stageMesh(gB, ptI.geo, ptMat, 'ptarmigan'), ptStandM = stageMesh(gB, ptS.geo, ptMat, 'ptarmigan-standing');
    ptFlyM.visible = false;
    // the flush is flown in the camera path's own frame: up and ahead from the lee of the boulder as we come, then left across our bows about
    // 25 m ahead and level with us through u 0.29-0.31 (wingspan a third of the frame), then away downslope to the left on set wings
    const ptPos = new THREE.Vector3(G2[0], G2[1] + 3.0, G2[2]), ptNext = new THREE.Vector3(), ptTan = new THREE.Vector3(), ptRt = new THREE.Vector3(), ptCam = new THREE.Vector3();
    const ptY0 = G2[1] + 3.0 - path.pointAt(uF2).y;
    const ptK = [[uF2, 22.5, 1.2, ptY0], [0.3125, 23.5, -0.2, ptY0 + 1.8], [0.318, 25, -6, ptY0 * 0.6], [0.328, 27, -19, ptY0 * 0.38], [0.34, 42, -38, -7], [0.352, 70, -52, -11], [0.38, 150, -90, -20]].map((k, i) => (i ? [vB(k[0]), k[1], k[2], k[3]] : k));
    const setBird = (u, time) => {
      const P = ptI.iPos, R = ptI.iRot, v = u / KU - dB, stand = v <= 0.3095;
      ptStandM.visible = stand; ptFlyM.visible = !stand;
      if (stand) {
        // standing: head up, watching us come; it shifts its weight, and crouches in the last moment before it goes
        const cr = smoothstep(0.3068, 0.3095, v);
        ptS.iPos[1] = G2[1] - 0.2 + 0.04 * Math.sin(time * 2.1) - 0.45 * cr; ptS.iRot[0] = ptYaw + 0.04 * Math.sin(time * 0.9); ptS.iRot[1] = 0.02 * Math.sin(time * 1.7) - 0.1 * cr;
        ptS.aP.needsUpdate = true; ptS.aR.needsUpdate = true;
        ptPos.set(G2[0], G2[1] + 3.0, G2[2]).multiplyScalar(gB.scale.x).add(gB.position);
      } else {
        railKeys(ptK, u, ptPos); railKeys(ptK, u + 0.004 * KU, ptNext); ptTan.subVectors(ptNext, ptPos).normalize();
        const glide = smoothstep(0.332, 0.35, v), rise = 1 - smoothstep(0.3095, 0.322, v), cross = smoothstep(0.312, 0.319, v) * (1 - smoothstep(0.324, 0.338, v));
        path.tangentAt(clamp(u, 0, 1), ptRt); ptTan.x += 0.35 * cross * ptRt.z; ptTan.z -= 0.35 * cross * ptRt.x; ptTan.normalize();   // turned across our bows
        R[0] = Math.atan2(-ptTan.x, -ptTan.z); R[1] = Math.asin(clamp(ptTan.y, -1, 1)) * 0.6 + 0.3 * rise + 0.4 * (1 - smoothstep(0.325, 0.35, v));
        // it climbs to eye level and crosses our bows banked away, so that its belly, its black tail and the grey
        // undersides of both spread wings face us (the roll that turns its belly toward the camera's place on the path,
        // taken part of the way)
        {
          const cy = Math.cos(R[0]), sy = Math.sin(R[0]), cp = Math.cos(R[1]), sp = Math.sin(R[1]);
          path.pointAt(clamp(u, 0, 1), ptCam).sub(ptPos);
          const rd = cy * ptCam.x - sy * ptCam.z, ud = sy * sp * ptCam.x + cp * ptCam.y + cy * sp * ptCam.z;
          R[2] = clamp(Math.atan2(rd, -ud), -1.2, 1.2) * 0.6 * cross + 0.1 * smoothstep(0.32, 0.335, v) * (1 - smoothstep(0.335, 0.36, v));
        }
        R[3] = lerp(time * 19 + 1.45, 0.4 + Math.sin(time * 5) * 0.5, glide); ptI.iCol[3] = lerp(0.6, 0.3, glide);
        toLocal(gB, ptNext.copy(ptPos));
        P[0] = ptNext.x; P[1] = ptNext.y; P[2] = ptNext.z; P[3] = lerp(1.0, 1.3, smoothstep(0.3095, 0.322, v));       // (it leaves the ground the size it stood)
      }
      ptI.aP.needsUpdate = true; ptI.aR.needsUpdate = true; ptI.aC.needsUpdate = true;
    };
    await ctx.yield();

    // =================================================================================================
    // STAGE C: the tundra bench at true size, under the scree slope of the ridge
    const gC = new THREE.Group(); gC.name = 'stage-C'; gC.visible = false; scene.add(gC);
    const SC = stageU([9.5, 1.6, 0.0042, 0.42]);
    const rC = rng.fork('stage-c');
    const CX = 330, CZ0 = z3 - 260, CZ1 = z3 + 300;
    const bench = await gridTerrain(ctx, X0 - CX, X0 + CX, CZ0, CZ1, 110, 100, hC, 14);
    const castC = caster(bench);
    const holeHalf = CX / KC - 0.7;
    U.uHole.value.set(X0, z3 + ((CZ0 + CZ1) / 2 - z3) / KC, holeHalf, (CZ1 - CZ0) / 2 / KC - 0.7);
    const herdX = (z) => X0 + 10.6 + 1.1 * Math.sin(z * 0.03);         // (the file walks ten metres to the right of our own line, on the pale heath lane)
    stageMesh(gC, rockBall(P2.x + (bCx - P2.x) / KB, P2.y + 0.25, P2.z + (bCz - P2.z) / KB, 0.8, 0.72, 0.9, 16, 10, rC.fork('rock'), 0.1), terrMat(SC, 3, { uPatch: { value: new THREE.Vector4(0, 0, 0, 1) }, uTexS: { value: 110 } }, THREE.DoubleSide), 'boulder-far');
    const shrubTint = () => {
      const t = rC(), k = rC.range(0.75, 1.2);
      if (season === 'late') return t < 0.5 ? lin('#7a4526', k) : t < 0.82 ? lin('#a07c38', k * 0.85) : lin(PAL[1], k * 0.6);
      if (season === 'august' && t < 0.55) return [0.14 * k, 0.26 * k, 0.07 * k];
      return t < 0.38 ? lin(PAL[2], k * 0.7) : t < 0.66 ? lin('#c65a1c', k * 0.66) : t < 0.86 ? lin(PAL[1], k * 0.85) : t < 0.93 ? [0.05 * k, 0.085 * k, 0.04 * k] : lin('#c9a23a', k * 0.72);
    };
    for (let i = 0; i < 21; i++) rC();
    // dwarf birch and willow: one cheap mound for the middle distance, and for the bushes beside our line the same
    // bush in leaf and twig, drawn only for the few stretches (12 m of path each) nearest the eye
    const farBush = bushGeo(makeRng(hashSeed('c-bush:' + ctx.seed)), 17, 0.42, 0.7, season === 'late' ? 0.22 : 0.3);
    const nearBush = nearBushGeo(makeRng(hashSeed('c-bush-near:' + ctx.seed)), 0.42, 0.7, 0.115, false);
    const shrubMax = Math.round(4700 * detail), shrubI = instGeo(farBush, shrubMax);
    const CH = 12, chunkOf = (z) => clamp(Math.floor((z2 + 20 - z) / CH), 0, 99), chList = [];
    let shrubTot = 0;
    const tusI = instGeo(tuftGeo(rC, 10, 0.46, 0.034, 1.1, 0.55), Math.round(1100 * detail)), cotI = instGeo((() => { const g = new Geo(); ball(g, 0, 0, 0, 1, 0.8, 1, 6, [1, 1, 1], 1, 1); return g.build(); })(), season === 'august' ? 700 : 240);
    const inPatch = (x, z) => Math.abs(x - P2.x) < 7.6 && z > z2 - 6.2 && z < z2 + 8.6;
    for (let t = 0; t < 26000 && (shrubTot < shrubMax || tusI.count < tusI.max); t++) {
      const z = rC.range(z3 - 40, z2 + 20), lx = atZ(z).x, x = lx + rC.gauss() * (rC.chance(0.7) ? 9 : 30), y = hC(x, z);
      if (inPatch(x, z) || (Math.abs(x - herdX(z)) < 4.5 && rC.chance(0.75))) continue;
      if (rC.chance(0.7)) {
        const q = [x, y - 0.03, z, rC.range(0.7, 1.6), rC() * 6.283, rC.range(-0.15, 0.15), rC.range(-0.15, 0.15), rC(), shrubTint()];
        if (shrubTot >= shrubMax) continue;
        shrubTot++;
        if (Math.abs(x - lx) < 8.5) { const c = chunkOf(z); (chList[c] = chList[c] || []).push(q); } else shrubI.add(...q);
      } else {
        const k = rC.range(0.8, 1.25), s = rC.range(0.8, 1.5);
        tusI.add(x, y - 0.03, z, s, rC() * 6.283, 0, 0, rC(), mixc(lin(PAL[3], 1.3 * k), lin('#b89a5a', 0.8 * k), rC() * 0.5));
        if (rC.chance(season === 'august' ? 0.7 : 0.22)) cotI.add(x + rC.range(-0.2, 0.2) * s, y + 0.42 * s, z + rC.range(-0.2, 0.2) * s, rC.range(0.035, 0.06), 0, 0, 0, rC(), [0.8, 0.8, 0.78]);
      }
      if ((t & 511) === 0) await ctx.yield();
    }
    const grassW = [0.09, 0.5, 2.6, 0.04];
    const shrubMat = surfMat(SC, [0.3, 9, 0.08, 30], [0.7, 0.3, 0.45, frost * 0.6], grassW, { INST: 1 });
    stageMesh(gC, shrubI.geo, shrubMat, 'dwarf-birch');
    const bushChunks = [];
    for (const L of chList) {
      if (!L || !L.length) continue;
      const I = instGeo(farBush, L.length); let cz = 0;
      for (const q of L) { I.add(...q); cz += q[2] / L.length; }
      const near = new THREE.InstancedBufferGeometry();
      for (const k in nearBush.attributes) near.setAttribute(k, nearBush.attributes[k]);
      near.setAttribute('iPos', I.aP); near.setAttribute('iRot', I.aR); near.setAttribute('iCol', I.aC); near.instanceCount = I.count;
      const mf = stageMesh(gC, I.geo, shrubMat, 'bush-far'), mn = stageMesh(gC, near, shrubMat, 'bush-near');
      mn.visible = false;
      bushChunks.push({ far: I.geo, near, mf, mn, n: I.count, x: atZ(cz).x, z: cz });
    }
    await ctx.yield();
    // coarse clumps of willow and birch out across the bench and up the slopes of the col, in drifts: what the hill
    // behind the herd is made of, as far as it can be seen
    {
      const cr = makeRng(hashSeed('c-clumps:' + ctx.seed)), clumpI = instGeo(bushGeo(cr, 13, 0.5, 0.7, season === 'late' ? 0.26 : 0.34), Math.round(1450 * detail));
      for (let t = 0; t < 30000 && clumpI.count < clumpI.max; t++) {
        const z = cr.range(z3 - 215, z2 + 30), x = X0 + cr.gauss() * 95, ax = Math.abs(x - atZ(clamp(z, z3, z2)).x);
        if ((z > z3 - 30 && ax < 22) || ax > 300 || inPatch(x, z)) continue;
        if (noise.n2(x * 0.022 + 40, z * 0.022) + 0.5 * noise.n2(x * 0.08, z * 0.08 + 9) < 0.05) continue;
        const q = cr(), k = cr.range(0.75, 1.2), s = cr.range(1.5, 3.3) * (1 + Math.min(ax, 160) * 0.004);
        const col = season === 'august' && q < 0.5 ? [0.13 * k, 0.25 * k, 0.07 * k] : q < 0.36 ? lin(PAL[2], k * 0.7) : q < 0.62 ? lin('#c65a1c', k * 0.66) : q < 0.82 ? lin(PAL[1], k * 0.85) : q < 0.92 ? [0.05 * k, 0.09 * k, 0.04 * k] : lin('#c9a23a', k * 0.72);
        clumpI.add(x, hC(x, z) - 0.04, z, s, cr() * 6.283, cr.range(-0.15, 0.15), cr.range(-0.15, 0.15), cr(), col);
        if (s > 2.6) castC(x, z, s * 0.8, s * 0.45, 0.28);
        if ((t & 511) === 0) await ctx.yield();
      }
      stageMesh(gC, clumpI.geo, shrubMat, 'clumps');
    }
    stageMesh(gC, tusI.geo, surfMat(SC, [0.3, 9, 0.2, 30], [0.6, 0.3, 0.5, frost * 0.6], [0.14, 0.5, 2.6, 0.04], { INST: 1 }), 'tussocks');
    stageMesh(gC, cotI.geo, surfMat(SC, [0.1, 9, 0.1, 10], [0.8, 0.6, 0.6, 0], [0.14, 0.5, 2.6, 0.04], { INST: 1 }), 'cottongrass');
    await ctx.yield();
    // frost-sorted stone rings on the bench, scree on the slope: small stones in one batch, boulders in another
    for (let i = 0; i < 56; i++) rC();
    const stRng = makeRng(hashSeed('c-stones:' + ctx.seed));
    const stI = instGeo(stoneGeo(stRng, noise, 6, 4, 0.18), 22 * 12 + Math.round(300 * detail)), bigI = instGeo(stoneGeo(stRng, noise, 12, 8, 0.24), Math.round(120 * detail));
    const stCol = () => { const k = rC.range(0.13, 0.25); return rC.chance(0.3) ? [k * 0.95, k, k * 1.08] : [k, k * 0.97, k * 0.93]; };
    for (let r = 0; r < 22; r++) {
      const z = rC.range(z3 + 5, z2 - 30), cx = atZ(z).x + rC.sign() * rC.range(3, 34), rad = rC.range(1.3, 2.3); if (inPatch(cx, z)) continue;
      for (let k = 0; k < 12; k++) { const an = (k / 12) * 6.283 + rC.range(-0.15, 0.15), x = cx + Math.cos(an) * rad, zz = z + Math.sin(an) * rad; stI.add(x, hC(x, zz) + 0.03, zz, rC.range(0.16, 0.3), rC() * 6.283, rC.range(-0.3, 0.3), rC.range(-0.3, 0.3), 0, stCol()); }
    }
    await ctx.yield();
    for (let t = 0; t < 4000 && (stI.count < stI.max || bigI.count < bigI.max); t++) {
      if ((t & 511) === 511) await ctx.yield();
      const z = rC.range(z3 - 210, z3 - 4), x = X0 + rC.gauss() * 34, s = 0.25 + Math.pow(rC(), 2.2) * 1.5, I = s > 0.62 ? bigI : stI;
      if (Math.abs(x - herdX(z)) < 2.2) continue;
      if (I.add(x, hC(x, z) + s * 0.16, z, s, rC() * 6.283, rC.range(-0.3, 0.3), rC.range(-0.3, 0.3), 0, stCol()) < 0) continue;
      if (s > 0.62) castC(x, z, s + 3, s * 1.5, 0.4);
    }
    await ctx.yield();
    const stoneMat = surfMat(SC, [0.5, 2.6, 0.2, 24], [0, 0.2, 0.3, frost * 0.3], [0, 0.1, 1, 0.01], { INST: 1 });
    stageMesh(gC, stI.geo, stoneMat, 'stones');
    stageMesh(gC, bigI.geo, stoneMat, 'boulders');
    await ctx.yield();
    // seventy caribou in a file, 7.5 m to our right, walking north (kit herd, our preset, hooves tied to distance)
    const herdRoute = [];
    for (let z = z2 + 70; z > z3 - 22; z -= 30) herdRoute.push([herdX(z), 0, z]);
    herdRoute.push([X0 + 11, 0, z3 - 34], [X0 + 11.5, 0, z3 - 62], [X0 + 13, 0, z3 - 100], [X0 + 17, 0, z3 - 150]);     // on up the col, to the right of our own line
    // (the kit bakes every animal's track on the ground, 96 soundings each: it is given a table of the bench along the
    // route, sounded here a few rows at a time, so that the baking is one short step)
    const hx0 = X0 - 2, hx1 = X0 + 30, hz0 = z3 - 166, hz1 = z2 + 78, HNX = 16, HNZ = Math.ceil((hz1 - hz0) / 3), hTab = new Float32Array((HNX + 1) * (HNZ + 1));
    for (let j = 0; j <= HNZ; j++) {
      for (let i = 0; i <= HNX; i++) hTab[j * (HNX + 1) + i] = hC(hx0 + ((hx1 - hx0) * i) / HNX, hz0 + ((hz1 - hz0) * j) / HNZ);
      if ((j & 15) === 15) await ctx.yield();
    }
    const hHerd = (x, z) => {
      const fx = clamp((x - hx0) / (hx1 - hx0), 0, 1) * HNX, fz = clamp((z - hz0) / (hz1 - hz0), 0, 1) * HNZ, i = Math.min(HNX - 1, Math.floor(fx)), j = Math.min(HNZ - 1, Math.floor(fz)), a = fx - i, b = fz - j, k = j * (HNX + 1) + i;
      return lerp(lerp(hTab[k], hTab[k + 1], a), lerp(hTab[k + HNX + 1], hTab[k + HNX + 2], a), b);
    };
    await ctx.yield();
    const herd = makeHerd({
      rng: rC.fork('herd'), preset: { ...HERD_PRESETS.deer, h: 1.5, width: 0.4, depth: 0.52, chest: 1.14, croup: 0.06, bodyLen: 1.06, leg: [0.074, 0.047, 0.033], joints: 1, neckLen: 0.46, neck: [0.215, 0.125], neckAng: 36, headLen: 0.35, headR: 0.1, headPitch: 34, ears: 0.1, antlers: 0.36,
        pattern: 'none', coat: '#392a20', belly: '#b9ae99', legs: '#211812', sock: '#d9d0bd', accent: '#e9e3d3', horn: '#c9b894', rump: '#f1ebdf', varieties: 0.62 },
      count: 70, mode: 'migrate', route: herdRoute, closed: false, heightAt: hHerd, speed: 1.35, spread: [2.3, 112], sizes: [1, 0.92, 1.06, 0.62, 0.96, 1.02, 0.9, 0.6],
      light: { sunDir: sunDir.clone(), sunColor: U.uSunCol.value.clone(), sunIntensity: 1, sky: U.uSkyCol.value.clone(), skyIntensity: 1.0, ground: new THREE.Color(PAL[3]), groundIntensity: 0.5 * HR.lum + 0.1 },
      fill: 0.2, rim: 0.5,
    });
    gC.add(herd.object);
    await ctx.yield();
    // The nearest of the file are this world's own caribou (the kit's deer stand in for the rest, further up the lane,
    // where they are a few pixels of dark animal): antlers above the head, the white neck and mane, the head carried
    // low, and the low sun along the side that is turned to it. They walk the lane on the same clock as the file.
    const uHerd = clamp(0.25, UK.l2b + 0.03, UK.l3a - 0.004), pHerd = path.pointAt(uHerd, new THREE.Vector3());
    const cariMat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), SC, { uNearT: { value: 0 }, uRim: { value: 0.7 } }), vertexShader: CARI_VS, fragmentShader: CARI_FS, defines: { BENCH: 1 }, fog: true });
    {
      const g0 = caribouGeo(), g = new THREE.InstancedBufferGeometry(); g.setIndex(g0.index);
      for (const nm of ['position', 'normal', 'color', 'aPart']) g.setAttribute(nm, g0.attributes[nm]);
      // (round 10: the three nearest walk the near side of the lane, the first of them a big bull fourteen metres ahead
      // of the picture's place: in the tall frame, which sees only 59 degrees across, the old places were at its right
      // edge and 6-7% of its height. [metres ahead, metres off the trail (minus = toward us), size])
      const spec = [[14, -4.0, 1.25], [17.5, -2.4, 0.96], [21, -0.8, 1.08], [25.6, -0.9, 0.92], [28.2, 1.6, 0.62], [31.2, -0.3, 1.17], [34.8, 1.1, 0.98]];
      const N = spec.length, iP = new Float32Array(N * 4), iR = new Float32Array(N * 4), iU = new Float32Array(N);
      spec.forEach(([a, lat, sz], i) => {
        const z = pHerd.z - a, x = herdX(z) + lat; let hx = herdX(z - 4) - herdX(z + 4), hz = -8; const hl = Math.hypot(hx, hz); hx /= hl; hz /= hl;
        iP.set([x, z, sz, 1], i * 4); iR.set([hx, hz, (i * 0.37 + 0.2) % 1, -hC(x, z)], i * 4); iU[i] = (hC(x + hx * 4, z + hz * 4) - hC(x, z)) / 4;
      });
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iRot', new THREE.InstancedBufferAttribute(iR, 4)); g.setAttribute('iUp', new THREE.InstancedBufferAttribute(iU, 1));
      g.instanceCount = N;
      stageMesh(gC, g, cariMat, 'file-near');
      // one large dark boulder, lichened on top, left of our own line: the file passes it, and the picture hangs on it
      const bz = pHerd.z - 29, bx = pHerd.x - 5.5, ar = makeRng(hashSeed('c-anchor:' + ctx.seed));
      stageMesh(gC, rockBall(bx, hC(bx, bz) + 0.8, bz, 3.5, 2.5, 3.0, 26, 18, ar, 0.13, 1e9, 6), terrMat(SC, 3, { uPatch: { value: new THREE.Vector4(bx, bz, 2.3, 1) }, uTexS: { value: 110 }, uTint: { value: new THREE.Vector3(0.27, 0.265, 0.285) } }, THREE.DoubleSide), 'anchor-boulder');
      castC(bx, bz, 3.8, 2.6, 0.62);
      for (let i = 0; i < 4; i++) { const an = ar() * 6.283, d = ar.range(3.6, 5.4), r = ar.range(0.5, 1.1), x = bx + Math.cos(an) * d, z = bz + Math.sin(an) * d;
        stageMesh(gC, rockBall(x, hC(x, z) + r * 0.2, z, r * 1.2, r * 0.7, r, 10, 7, ar, 0.14), terrMat(SC, 3, { uPatch: { value: new THREE.Vector4(0, 0, 0, 1) }, uTexS: { value: 110 }, uTint: { value: new THREE.Vector3(0.44, 0.43, 0.44) } }, THREE.DoubleSide), 'anchor-stone' + i); castC(x, z, r + 0.4, r * 0.7, 0.45); }
    }
    await ctx.yield();
    // forty snow geese (or tundra swans) crossing just ahead
    const NG = cast.swans ? 9 : 39, blk = [0.03, 0.03, 0.035], gwh = [0.5, 0.5, 0.52];
    const gooseBase = cast.swans
      ? birdGeo({ len: 1.5, span: 2.3, neck: 0.42, head: 0.9, body: gwh, belly: gwh, neckCol: gwh, headCol: gwh, wing: gwh, tip: gwh, tipFrom: 2, tail: gwh, beak: [0.05, 0.05, 0.05], ns: 8, sides: 8 })
      : birdGeo({ len: 0.75, span: 1.4, neck: 0.2, head: 1, body: gwh, belly: [0.42, 0.42, 0.45], neckCol: gwh, headCol: gwh, wing: gwh, tip: blk, tipFrom: 0.66, tail: gwh, beak: lin('#c8627a', 0.8), ns: 8, sides: 8 });
    const gooseI = instGeo(gooseBase, NG);
    for (let i = 0; i < NG; i++) gooseI.add(0, -1000, 0, 0, 0, 0, 0, 0, [1, 1, 1], 0.75);
    stageMesh(gC, gooseI.geo, surfMat(SC, [0.12, 4, 0.2, 20], [0.1, 0.35, 0.5, 0], [0, 0.1, 1, 0.01], { INST: 1, BIRD: 1 }), 'geese');
    // the skein is flown in the camera path's own frame: it comes in from the right about ten metres ahead, crosses our
    // bows through u 0.40-0.46 and leaves to the left, heading a little left of our own course
    const uG = clamp(0.2475, UK.l2b + 0.03 * KU, UK.l3a - 0.012 * KU), gHead = 0.3, gk = cast.swans ? 2.3 : 1.7, gSz = cast.swans ? 1.3 : 2, gOff = [];
    const gV = cast.swans ? [[0, 0, 0, 9, 1.35]] : [[0, 0, 0, 21, 1.35], [4.8, 5, 2.2, 18, 1.25]];
    for (const v of gV) for (let j = 0; j < v[3]; j++) {
      const r = Math.ceil(j / 2), sd = j % 2 ? 1 : -1;
      gOff.push([v[0] - r * 0.42 * gk + rC.range(-0.12, 0.12), v[1] + sd * r * v[4] * gk + rC.range(-0.12, 0.12), v[2] + rC.range(-0.2, 0.2), rC() * 6.283]);
    }
    const gPos = new THREE.Vector3(), gTan = new THREE.Vector3(), cgh = Math.cos(gHead), sgh = Math.sin(gHead);
    const setGeese = (u, time) => {
      const s = (u - uG) / (0.036 * KU), e2g = ease((z2 - path.pointAt(clamp(u, 0, 1), gPos).z) / L2);
      const vis = smoothstep(-2.7, -2.1, s) * (1 - smoothstep(2.1, 2.7, s)) * smoothstep(0.62, 0.88, e2g) / Math.max(1, gC.scale.x / 1.3), P = gooseI.iPos, R = gooseI.iRot;
      const lat = 2.5 - 6.5 * s - 1.6 * s * s * s, ahead = 15 + 1.2 * s * s;
      path.tangentAt(clamp(u, 0, 1), gTan); const yaw = Math.atan2(-gTan.x, -gTan.z) + gHead;
      for (let i = 0; i < NG; i++) {
        const o = gOff[i], k = i * 4, wob = Math.sin(time * 0.6 + o[3]);
        // formation offsets are along and across the skein's own heading (gHead to the left of the path)
        const fa = o[0] + wob * 0.2, fb = o[1] + Math.sin(time * 0.43 + o[3] * 2) * 0.15;
        railPoint(u, ahead + fa * cgh + fb * sgh, lat + fb * cgh - fa * sgh, 2.6 + o[2] + 0.15 * wob, gPos); toLocal(gC, gPos);
        P[k] = gPos.x; P[k + 1] = gPos.y; P[k + 2] = gPos.z;
        P[k + 3] = vis * gSz; R[k] = yaw; R[k + 1] = 0.04; R[k + 2] = 0.06 * Math.sin(time * 0.9 + o[3]); R[k + 3] = time * (cast.swans ? 16 : 23) + o[3];
      }
      gooseI.aP.needsUpdate = true; gooseI.aR.needsUpdate = true;
    };
    spriteSys(SC, gC, 110, [50, 12, 50], [2.6, -0.5, 0.7], 0.06, 7, 0.5, 1.2, season === 'late' ? '#e8ecf2' : PAL[2], [0.9, 0, 0.9], rC.fork('fluff'));
    stageMesh(gC, await bench.finish(), terrMat(SC, 2, { uHeath: { value: new THREE.Vector4(X0 + 11, 8.5, 1, 0) }, uPatch: { value: new THREE.Vector4(z3, P3.y, 0, 0) } }), 'bench');
    await ctx.yield();

    // =================================================================================================
    // STAGE D: the delta from the ridge (the hero set piece), magnified about P3 until the last pull-out
    const gD = new THREE.Group(); gD.name = 'stage-D'; gD.visible = false; scene.add(gD);
    gD.add(hero.object);
    const SD = Object.assign({}, U, { uFade: { value: 1 } });
    const rD = rng.fork('stage-d');
    if (hourId === 'dawn' || season === 'late') {
      // a flurry on the ridge (overcast, late September) or diamond dust in the frost dawn
      spriteSys(SD, gD, hourId === 'dawn' ? 260 : 520, [90, 50, 90], [5.5, -1.7, 1.3], 0.1, 5, 0.9, 1.5, '#eef2f8', [0.9, 0.05, 0.85], rD.fork('snow'));
    } else {
      // cottongrass fluff and leaf litter riding the wind over the saddle
      spriteSys(SD, gD, 240, [90, 50, 90], [6, -0.5, 1.6], 0.13, 6, 1.4, 2, '#f1e7d2', [0.9, 0.03, 0.85], rD.fork('blown'));
    }
    await ctx.yield();
    // a flock goes up the river with us: it lifts off a bar on our left as we come down onto the trunk, flies just
    // ahead of our bows along the channel to the first fork, level with the skyline, and peels away to the right as
    // we turn left into the sun. Flown in the camera path's own frame like the skein on the bench: keys are
    // [u, ahead, right, up].
    const gw2 = [0.94, 0.94, 0.96];                        // (seen against the bright sky and from behind, they must be whiter than white to read white)
    const riverGoose = cast.swans ? gooseBase
      : birdGeo({ len: 0.75, span: 1.4, neck: 0.2, head: 1, body: gw2, belly: [0.8, 0.8, 0.84], neckCol: gw2, headCol: gw2, wing: gw2, tip: blk, tipFrom: 0.66, tail: gw2, beak: lin('#c8627a', 0.8), ns: 8, sides: 8 });
    const DG = cast.swans ? 12 : 30, dgI = instGeo(riverGoose, DG), dgOff = [], dgSz = cast.swans ? 1.25 : 1.8;
    {
      const dr = makeRng(hashSeed('d-geese:' + ctx.seed));
      for (let i = 0; i < DG; i++) {
        const v = i < DG * 0.6 ? 0 : 1, j = v ? i - Math.ceil(DG * 0.6) : i, r = Math.ceil(j / 2), sd = j % 2 ? 1 : -1;
        dgOff.push([(v ? -9 : 0) - r * 1.5 + dr.range(-0.5, 0.5), (v ? -13 : 0) + sd * r * 2.5 + dr.range(-0.6, 0.6), (v ? 2.2 : 0) + r * 0.22 + dr.range(-0.5, 0.5), dr() * 6.283]);
        dgI.add(0, -1000, 0, 0, 0, 0, 0, 0, [1, 1, 1], 0.75);
      }
    }
    stageMesh(gD, dgI.geo, surfMat(SD, [0.12, 4, 0.2, 20], [0.1, 0.35, 0.5, 0], [0, 0.1, 1, 0.01], { INST: 1, BIRD: 1 }), 'river-geese');
    const dgK = [[UF.root - 0.05, 70, -34, -24], [UF.root - 0.012, 34, -9, -8], [UF.root + 0.022, 34, 1.5, -3], [UF.fork - 0.02, 33, 4, -2], [UF.fork + 0.012, 34, 8, -1], [UF.fork + 0.04, 40, 30, 4], [UF.turn - 0.012, 70, 84, 20], [UF.turn + 0.02, 120, 150, 36]];
    const dgPos = new THREE.Vector3(), dgNext = new THREE.Vector3(), dgC = new THREE.Vector3();
    const setRiverGeese = (u, time) => {
      const P = dgI.iPos, R = dgI.iRot, u0 = dgK[0][0], u1 = dgK[dgK.length - 1][0];
      const vis = smoothstep(u0, u0 + 0.012, u) * (1 - smoothstep(u1 - 0.02, u1, u));
      if (vis <= 0) { if (P[3] !== 0) { for (let i = 0; i < DG; i++) P[i * 4 + 3] = 0; dgI.aP.needsUpdate = true; } return; }
      railKeys(dgK, u, dgC); railKeys(dgK, u + 0.004, dgNext); dgNext.sub(dgC);
      const hl2 = Math.hypot(dgNext.x, dgNext.z) || 1, fx = dgNext.x / hl2, fz = dgNext.z / hl2, yaw = Math.atan2(-fx, -fz), pit = clamp(Math.atan2(dgNext.y, hl2), -0.3, 0.45) * 0.6;
      for (let i = 0; i < DG; i++) {
        const o = dgOff[i], k = i * 4, wob = Math.sin(time * 0.6 + o[3]), a = o[0] + wob * 0.3, b = o[1] + Math.sin(time * 0.43 + o[3] * 2) * 0.25;
        dgPos.set(dgC.x + fx * a - fz * b, dgC.y + o[2] + 0.2 * wob, dgC.z + fz * a + fx * b); toLocal(gD, dgPos);
        P[k] = dgPos.x; P[k + 1] = dgPos.y; P[k + 2] = dgPos.z; P[k + 3] = vis * dgSz;
        R[k] = yaw; R[k + 1] = pit + 0.04; R[k + 2] = 0.07 * Math.sin(time * 0.9 + o[3]); R[k + 3] = time * (cast.swans ? 16 : 22) + o[3];
      }
      dgI.aP.needsUpdate = true; dgI.aR.needsUpdate = true;
    };
    await ctx.yield();
    // rare event: a golden eagle comes up from behind on our left, crosses under our bows over the notch and slides
    // away to the right (the geese lift and the herd runs in the hero). It is flown in the frame of the gaze, from the
    // path toward the heart of the delta: keys are [u, ahead, right, up].
    let setEagle = null;
    if (rare) {
      const eI = instGeo(eagleGeo(), 1);
      eI.add(0, -1000, 0, 0, 0, 0, 0, 0, [1, 1, 1], 0.3);
      stageMesh(gD, eI.geo, surfMat(SD, [0.22, 3, 0.25, 20], [0.5, 0.9, 0.55, 2.4], [0, 0.1, 1, 0.01], { INST: 1, BIRD: 1 }), 'eagle');
      // keys [u, ahead, right, up] in metres from the eye, in the frame of the camera's own heading: it comes up from
      // behind on our left and below, hangs a wingspan and a half ahead of us and under the eye line over the pale trunk
      // channel through u 0.79-0.84, heading across our bows with its back and both upper wings turned to us, then
      // slides away to the right and down. A fifth of the frame wide at its nearest.
      const eK = [[0.74, 64, -44, -26], [0.765, 30, -18, -11], [0.785, 15, -7.5, -5.6], [0.8, 12.8, -4.2, -4.5], [0.82, 12.6, -2.4, -4.3], [0.84, 13.2, -0.4, -4.5], [0.86, 21, 9, -8], [0.892, 80, 56, -32]];
      const uE0 = UF.root - 0.072, eS = 0.75;        // v = 0.74 + (u - uE0) / eS: the hang (v 0.785-0.84) falls on u 0.53-0.58
      const eV = [0, 0, 0], eF = new THREE.Vector3(), eC = new THREE.Vector3();
      setEagle = (uw, time, camera, camPos) => {
        const P = eI.iPos, R = eI.iRot, u = 0.74 + (uw - uE0) / eS;
        let i = 0; while (i < eK.length - 2 && u > eK[i + 1][0]) i++;
        const k0 = eK[Math.max(0, i - 1)], k1 = eK[i], k2 = eK[i + 1], k3 = eK[Math.min(eK.length - 1, i + 2)], du = k2[0] - k1[0], t = clamp((u - k1[0]) / du, 0, 1);
        const t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        for (let c = 1; c <= 3; c++) {
          const m1 = (k2[c] - k0[c]) / Math.max(k2[0] - k0[0], 1e-6) * du, m2 = (k3[c] - k1[c]) / Math.max(k3[0] - k1[0], 1e-6) * du;
          eV[c - 1] = h00 * k1[c] + h10 * m1 + h01 * k2[c] + h11 * m2;
        }
        camera.getWorldDirection(eF); eF.y = 0; if (eF.lengthSq() < 1e-6) eF.set(0, 0, -1); eF.normalize();
        const px = camPos.x + eF.x * eV[0] - eF.z * eV[1], py = camPos.y + eV[2] + 0.25 * Math.sin(time * 0.8), pz = camPos.z + eF.z * eV[0] + eF.x * eV[1];
        P[0] = px; P[1] = py; P[2] = pz;
        P[3] = smoothstep(0.74, 0.755, u) * (1 - smoothstep(0.878, 0.892, u));
        // heading: across our bows, half a radian to the right of our own; the roll that turns its back toward the eye
        const hold = smoothstep(0.765, 0.79, u) * (1 - smoothstep(0.85, 0.875, u)), yaw = Math.atan2(-eF.x, -eF.z) - 0.5 * hold - 0.25, pit = 0.1 * hold;
        const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
        eC.set(camPos.x - px, camPos.y - py, camPos.z - pz);
        const rd = cy * eC.x - sy * eC.z, ud = sy * sp * eC.x + cp * eC.y + cy * sp * eC.z;
        R[0] = yaw; R[1] = pit; R[2] = clamp(Math.atan2(-rd, ud), -0.75, 0.75) * 0.85 * hold + 0.06 * Math.sin(time * 0.6);
        R[3] = Math.sin(time * 2.1) * 1.1;
        eI.aP.needsUpdate = true; eI.aR.needsUpdate = true;
      };
    }
    await ctx.yield();

    // =================================================================================================
    // the pull-out: every stage is scaled about the ground point under the start of its link
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ colorWrite: false, fog: false }));
    curtain.position.copy(AN.portalSeat.position); curtain.position.z += 14; curtain.renderOrder = 4.5; curtain.frustumCulled = false; scene.add(curtain);
    const bExtras = gB.children.filter((o) => o.name !== 'boulder');
    const cExtras = gC.children.filter((o) => o.name !== 'bench' && o.name !== 'bush-far' && o.name !== 'bush-near');
    const dExtras = hero.object.children.filter((o) => o.name !== 'ridge' && o.name !== 'plain');       // (with them the nose's fine mesh: it is on the ridge's far side until the crest is cleared)
    const rosN = rosI.count, sqN = sqI.count, shrN = shrubI.count, tusN = tusI.count, mossN = mossI.map((I) => I.count), redN = redI.count;
    heroParts.ridge.renderOrder = -0.8; heroParts.nose.renderOrder = -0.8; heroParts.plain.renderOrder = -0.85; gC.children.find((o) => o.name === 'bench').renderOrder = -0.8;
    // the file is 112 m long and we overtake it along the bench: at uHerd its last animal walks eight metres ahead of
    // us (the whole file is in front of us till then, and no animal is cut by the frame as the picture is taken)
    // (the kit's file begins 38 m ahead of us there: the seven nearest places in the lane are the modelled animals')
    const herdAt = z2 + 70 - (pHerd.z - 38) + 112;
    const herdPoi = new THREE.Vector3();
    const setT = (g, s, ox, oy, oz) => { g.scale.setScalar(s); g.position.set(ox, oy, oz); g.updateMatrixWorld(true); };
    const about = (g, P, s) => setT(g, s, P.x * (1 - s), P.y * (1 - s), P.z * (1 - s));
    // about2: first scale s1 about Q, then s2 about P
    const about2 = (g, Q, s1, P, s2) => setT(g, s1 * s2, P.x * (1 - s2) + s2 * Q.x * (1 - s1), P.y * (1 - s2) + s2 * Q.y * (1 - s1), P.z * (1 - s2) + s2 * Q.z * (1 - s1));
    const fogD = [0.0042, 0.0036, 0.00032, 0.00024].map((d) => d * HR.fogK);
    const fogC = fogFar.clone().lerp(new THREE.Color(PAL[5]).multiplyScalar(HR.lum), 0.6), fogMid = fogNear.clone().lerp(fogC, 0.5);
    const camW = new THREE.Vector3(), bufSize = new THREE.Vector2(), _pu = new THREE.Vector3();
    const stageCam = [[gA, SA], [gB, SB], [gC, SC]];
    const zSplash = z0 - 46, zMite = z0 - 162;
    const place = (u) => {
      const pz = path.pointAt(clamp(u, 0, 1), _pu).z;
      const e1 = ease((z1 - pz) / L1), e2 = ease((z2 - pz) / L2), e3 = Math.pow(ease((z3 - pz) / L3), 1.4);
      const inA = pz > z1 - L1 + 0.01, inB = pz > z2 - L2 * 0.72, inC = pz > z3 - L3 - 16;
      curtain.visible = inB;
      // the bench and the ridge wait until the far haze has paled, then dissolve in behind it (magnified and fogged they
      // would stand on the mat's skyline as one smooth dark cone)
      gA.visible = inA; gB.visible = inB; gC.visible = e2 > 0.15 && inC; gD.visible = e2 > 0.15;
      const bx = e1 > 0.45; for (const o of bExtras) o.visible = bx;
      const cx = e2 > 0.45; for (const o of cExtras) o.visible = cx;
      const dx = e3 > 0.3; for (const o of dExtras) o.visible = dx;
      // thinning: what is too small to see goes, what is still too far to see waits
      const thinA = 1 - smoothstep(0.25, 0.55, e1);
      sqI.geo.instanceCount = Math.round(sqN * thinA); redI.geo.instanceCount = Math.round(redN * thinA);
      mossI[0].geo.instanceCount = Math.round(mossN[0] * thinA); mossI[1].geo.instanceCount = Math.round(mossN[1] * thinA);
      rosI.geo.instanceCount = Math.round(rosN * smoothstep(0.4, 0.8, e1) * (1 - 0.85 * smoothstep(0.25, 0.7, e2)));
      const thinC = smoothstep(0.45, 0.9, e2) * (1 - 0.85 * smoothstep(0.04, 0.36, e3));
      shrubI.geo.instanceCount = Math.round(shrN * thinC); tusI.geo.instanceCount = Math.round(tusN * thinC);
      for (const b of bushChunks) { b.far.instanceCount = b.near.instanceCount = Math.round(b.n * thinC); if (!cx) b.mf.visible = b.mn.visible = false; }
      about(gA, P1, Math.pow(KA, -e1));
      if (pz > z2) about(gB, P1, Math.pow(KA, 1 - e1)); else about(gB, P2, Math.pow(KB, -e2));
      if (pz > z3) about(gC, P2, Math.pow(KB, 1 - e2)); else about(gC, P3, Math.pow(KC, -e3));
      if (pz > z3) about2(gD, P3, KC, P2, Math.pow(KB, 1 - e2)); else about(gD, P3, Math.pow(KC, 1 - e3));
      U.uHole.value.z = inC ? holeHalf : 0;
      SA.uFade.value = 1 - smoothstep(0.86, 1, e1);
      SB.uFade.value = 1 - smoothstep(0.7, 0.86, e2);
      SC.uFade.value = smoothstep(0.15, 0.4, e2); U.uFadeD.value = SC.uFade.value;
      return { pz, e1, e2, e3, cx };
    };
    place(0);
    hero.setFinale(UK.crest); hero.setEvent(0.25, 0.42);
    hero.setReveal(UK.crest - 0.03, 0.09);        // the skein is mid-crossing just after the crest
    // ROUND 21 (F2): the hero's loop skeins and streams are held against the route, now that there is one (the
    // law and the test are the hero part's: geeseAside). The line is handed over as the hero stands to it while its
    // geese are drawn (place() shows them once e3 passes 0.3, the hero still magnified KC^(1 - e3) about P3, and at
    // its true size from z3 - L3 to the gate): a point every quarter of a metre, in the hero's own frame, with 2.0 m
    // of our air in the hero's metres there, and the progress.
    {
      const ln = [];
      for (let d = UK.l3a * path.length; ; d += 0.25) {
        const dd = Math.min(d, path.length); path.posAtDist(dd, _pu);
        const e3 = Math.pow(ease((z3 - _pu.z) / L3), 1.4), s = Math.pow(KC, 1 - e3);
        if (e3 > 0.3) ln.push(P3.x + (_pu.x - P3.x) / s, P3.y + (_pu.y - P3.y) / s, P3.z + (_pu.z - P3.z) / s, 2 / s, dd / path.length);
        if (d >= path.length) break;
      }
      await hero.geeseAside(ln);
    }

    const FKp = FK.forkAt, sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize(), sunPoi = new THREE.Vector3();
    const filePoi = new THREE.Vector3(), gatePoi = new THREE.Vector3(), gatePoi2 = new THREE.Vector3(), seatP = AN.portalSeat.position.clone();
    const flankPoi = new THREE.Vector3(seatP.x - 215, seatP.y - 78, seatP.z + 110);
    hero.setNear((UF.root + UF.fork) * 0.5 + 0.012);
    const pois = [
      { at: () => mitePos, from: uOfZ(z0 - 112), to: uOfZ(z0 - 190), weight: 0.36 },
      { at: () => lemPos, from: UK.l1b - 0.012 * KU, to: UK.l1b + 0.055 * KU, weight: 0.45 },
      { at: () => ptPos, from: vB(0.27), to: vB(0.345), weight: 0.6 },
      // the file is ten metres to our right and seven below us: the gaze turns to the animals a little way ahead and
      // stays on them into the start of the climb
      { at: (time, u) => { const k = smoothstep(UK.l3a - 0.03 * KU, UK.l3a + 0.008 * KU, u), y = path.pointAt(clamp(u, 0, 1), herdPoi).y; path.pointAt(clamp(u + lerp(0.023, 0.025, k) * KU, 0, 1), herdPoi); herdPoi.x += lerp(8.6, 6.5, k); herdPoi.y = y - lerp(5.2, 7.5, k); return herdPoi; }, from: UK.l2b + 0.016 * KU, to: uHerd + 0.014, weight: 0.7, fade: 0.2 },
      // up the col the gaze rests on the saddle's own rock; from the crest on, on the heart of the delta, all the way
      // down the flank; along the trunk it drops to the caribou on the bank just ahead; in the turn it goes to the
      // water under the sun; from the turn's end to the gate, on the ground under the gate, so that the ring stands on
      // the upper third of the picture with the river and the plain below it
      { at: AN.saddle.clone().add(new THREE.Vector3(0, -22, 0)), from: UK.l3a + 0.022 * KU, to: UK.crest - 0.035 * KU, weight: 0.5 },
      { at: new THREE.Vector3(FKp[0], 0, FKp[1]), from: UK.l3a + 0.005, to: UF.root - 0.01, weight: 0.82, fade: 0.2 },
      // (down the flank the gate stands above us on the right: the gaze gives it a little, so that the ring and both towers stay in the picture)
      { at: seatP, from: UK.crest + 0.035, to: UK.crest + 0.135, weight: 0.24, fade: 0.35 },
      { at: (time, u) => { path.pointAt(clamp(u + 42 / path.length, 0, 1), filePoi); filePoi.x -= 5 * smoothstep(UF.fork - 0.03, UF.fork - 0.06, u); filePoi.y = 1.5; return filePoi; }, from: UF.root - 0.03, to: UF.fork + 0.012, weight: 0.6, fade: 0.3 },
      { at: (time, u) => path.pointAt(clamp(u, 0, 1), sunPoi).addScaledVector(sunH, 420).setY(8), from: UF.fork - 0.012, to: UF.turn + 0.015, weight: 0.45, fade: 0.3 },
      // (the last third is three pictures: the peak far off beyond the river with the herd in front; then the gaze swings
      // to the spur's sunlit flank as the geese stream past; then head-on at the ring)
      { at: (time, u) => { const D = path.pointAt(clamp(u, 0, 1), gatePoi).distanceTo(seatP); return gatePoi.copy(seatP).setY(seatP.y - clamp(0.42 * D, 5, 130)); }, from: UF.turn + 0.012, to: 0.85, weight: 0.74, fade: 0.22 },
      { at: flankPoi, from: 0.82, to: 0.912, weight: 0.7, fade: 0.3 },
      { at: (time, u) => { const D = path.pointAt(clamp(u, 0, 1), gatePoi2).distanceTo(seatP); return gatePoi2.copy(seatP).setY(seatP.y - clamp(0.2 * D, 3, 60)); }, from: 0.885, to: 0.99, weight: 0.78, fade: 0.25 },
    ];
    // pace: the walk-in is unhurried, with a little speed through the three pull-outs. The view from the crest down the
    // flank (the whole fork, the gate in front of it) is the best this world has and gets the most time: slowest of all
    // from the crest to the foot of the flank. Then twice as fast for the low run along the trunk, the turn into the sun
    // and the climb, easing a little as the gate fills the view.
    const bump = (u, a, b, w) => smoothstep(a - w, a + w, u) * (1 - smoothstep(b - w, b + w, u));
    const pace = (u) => {
      const walk = 0.62 + 0.2 * (bump(u, UK.l1a, UK.l1b, 0.012) + bump(u, UK.l2a, UK.l2b, 0.012) + bump(u, UK.l3a, UK.l3b - 0.01, 0.012));
      const high = smoothstep(UK.crest - 0.012, UK.crest + 0.012, u), low = smoothstep(UF.root - 0.06, UF.root - 0.02, u);
      return lerp(lerp(walk, 0.55, high), 1.1 - 0.1 * smoothstep(0.9, 0.97, u), low);
    };

    const update = (dt, time, camera, u) => {
      u = clamp(u ?? 0, 0, 1);
      camera.getWorldPosition(camW);
      const { pz, e1, e2, e3, cx } = place(u);
      for (const [g, S] of stageCam) if (g.visible) g.worldToLocal(S.uCamL.value.copy(camW));
      if (cx && gC.visible) {
        // the bushes nearest the eye are drawn leaf by leaf, the rest as mounds
        const cl = SC.uCamL.value;
        for (const b of bushChunks) { const dd = Math.hypot(b.x - cl.x, b.z - cl.z), nr = dd < 17; b.mn.visible = nr; b.mf.visible = !nr && dd < 150; }
      }
      hero.setProgress(u);
      hero.update(dt, time, camera);
      sky.update(dt, time, camera);
      dome.position.copy(camW);
      domeU.uOp.value = 1 - smoothstep(0.15, 0.6, e2); domeU.uB.value = smoothstep(0.3, 0.95, e1);
      dome.visible = domeU.uOp.value > 0.004;
      // air: a dark red macro blur at lichen scale, thinning to the sky's own horizon haze at delta scale
      const fog = scene.fog;
      if (pz > z2) { fog.color.copy(fogNear).lerp(fogMid, smoothstep(0.6, 1, e1)); fog.density = fogD[0] * Math.pow(fogD[1] / fogD[0], e1); }
      else if (pz > z3) { fog.color.copy(fogMid).lerp(fogC, smoothstep(0, 0.3, e2)); fog.density = fogD[1] * Math.pow(fogD[2] / fogD[1], e2); }
      else { fog.color.copy(fogC).lerp(fogFar, e3); fog.density = fogD[2] * Math.pow(fogD[3] / fogD[2], e3); }
      domeU.uFogC.value.copy(fog.color);
      // point sprites sized from the drawing buffer
      ctx.renderer.getDrawingBufferSize(bufSize);
      const kpx = bufSize.y * 0.5 * Math.abs(camera.projectionMatrix.elements[5]);
      for (const s of sprites) { s.spr.x = kpx; s.spr.y = s.maxFrac * bufSize.y; }
      // stage A: the keyed raindrop, the mite on its bough, a bead rolling down the hero's arm
      if (gA.visible) {
        UT.value = (zSplash - pz) / 22;
        setMite(clamp(zMite - 19.5 + 0.35 * (pz - zMite), zb1 + 6, zb0 - 6), time);
        const r = (time * 0.11) % 1, k = r * r * (3 - 2 * r), a = heroArm[0], b = heroArm[1], P = dewI.iPos;
        P[4] = lerp(a[0], b[0], k); P[5] = lerp(a[1], b[1], k) + 2.6; P[6] = lerp(a[2], b[2], k); P[7] = 1.15 * Math.min(1, r * 12, (1 - r) * 8);
        dewI.aP.needsUpdate = true;
      }
      if (gB.visible && e1 > 0.45) { setLemming(pz, time); setBird(u, time); }
      if (gC.visible && e2 > 0.45) {
        setGeese(u, time); herd.update(dt, time, camera, u);
        // the file walks while we fly past it (its place is keyed to u alone, so the close pass at 0.54-0.57 is the same
        // whatever the world clock says): its tail is level with us as the bench begins
        herd.uniforms.uTravel.value = herdAt + (u - uHerd) * path.length * 0.06;
        cariMat.uniforms.uNearT.value = (u - uHerd) * path.length * 0.06;
      }
      if (gD.visible) setRiverGeese(u, time);
      if (setEagle && gD.visible) setEagle(u, time, camera, camW);
    };

    return {
      scene, path, duration: 50, pace,
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 36, bank: 0.14 },
      pois,
      portal: { shape: 'circle', radius: AN.portalSeat.radius, color: HR.portal, glow: 1, tilt: true, revealDistance: 300 },
      post: {
        exposure: HR.exposure, bloom: { strength: night ? 0.5 : 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#fffaf3', shadowTint: night ? '#050916' : '#0b0d16', vignette: 0.3, grain: 0.02 },
      },
      ride: 'none',
      update,
      dispose() { sky.dispose(); hero.dispose(); sphereG.dispose(); discG.dispose(); },
    };
  },
};
