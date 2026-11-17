// A Harbour in the Aurora (the WORLD file: both skies, the curtain and its thin place, the sea ice and its ridges,
// the sea, the light, the route, the gaze and the ring). The city is the part file's (src/parts/harbour-in-the-aurora.js).
//
// THE PLACE. World metres; the route runs north (world -z). The upright plane z = ZC (-430) is the curtain plane.
// South of it lies the night side (sea ice to the horizon under an aurora), north of it the day side (a warm sea and
// the harbour city, whose mouth is at world (0, 0, CITY_Z), z = -530). Both sides are whole geometry at all times;
// nothing is switched on or off, and nothing reads the metres flown or the clock except the world's declared motion:
// the aurora (its rays, its far curtains' lit stretches, the thin place's breath), the stars' twinkle, the sea, the
// spindrift, the day's clouds in the sea wind, the floes' small bob, the gulls, and the city's own things (its palms
// in the same wind).
//
// This world's one lock, declared by the owner on 9 Nov 2026: the side of the curtain's plane on which the eye stands chooses which sky is drawn; a bare step at the plane; nothing sized, thinned, faded, placed or timed by the eye, the gaze or the lens beside it.
//
// HOW THE TWO SKIES ARE DRAWN IN ONE PASS. One sky dome paints, for each view direction d, the night's sky or the day
// side's sky, by the one lock above. THE THIN PLACE is the curtain grown thin, a thing of the curtain: by the point
// (x, y) on the plane (the design's size, over the great ridge's gap) the night behind the rays lets the day through,
// wholly about the gap and less and less over a long way, and the rays before it grow weaker and paler, never gone;
// the same for every eye. For an eye south of the plane a ray that goes north shows, by that weight where it meets the
// plane, the day side as it is; every other ray is night. For an eye north of the plane the sky is one function of
// direction: the day, THE WALL OF NIGHT in the south
// (the curtain's far face, sinking to nothing at due east and west) and the far haze. The route crosses the plane
// where the day shows whole, and has had it in sight since the first metre.
// THE VEIL is one upright sheet on the plane, drawn after the solid things with no depth write: it repaints the very
// same sky colour with strength 1 - T, so the other side's solid things show only where the curtain is thin. The
// visible curtain is a set of additive ray sheets hung near the plane, whole for every eye and thin by place (each by
// its own depth through the curtain and by the thin place at its own point). The ice is shaded by its own unlit materials by
// PLACE (night light south of the plane, the day's sun north of it), so the scene's sun never lights the night side.
// The world sets neither portal.drawWithin nor portal.drawIn: the ring stands whole at every metre.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as Water from '../kit/water.js';
import { buildHero } from '../parts/harbour-in-the-aurora.js';

const ZC = -430, CITY_Z = -530, ENTRY_Z = -130;   // the curtain plane, the harbour mouth, the entry (300 m of ice, 100 m of water)
const CROSS_Y = 13.5, RAYS_OVER = 3.5;            // the flown line's height where it crosses the plane (its highest through the curtain); the clear air the rays keep over that
const HEM = CROSS_Y + RAYS_OVER, HEM_DEAL = [2.5, 8], HEM_WAVE = 5;   // a ray sheet's hem hangs HEM m up at the least (or the ridge's crest, if higher), plus its deal, plus its wave: 19.5 m at the lowest
const RUNIN = 62, GREAT = 35;                     // the level entry straight's length; the great ridge's half depth (its feet stand at ZC + GREAT and ZC - GREAT)
const lin = (hex) => new THREE.Color(hex);

// ---------------------------------------------------------------- the two skies, the thin place and the wall of night
const SKY_GLSL = /* glsl */`
uniform vec3 uSunDir, uNZen, uNHor, uNGround, uDZen, uDMid, uDHor, uDGround, uSunCol, uAurA, uAurB, uAurV, uDusk1, uDusk2, uDusk3, uHazeD;
uniform float uTime, uAurK, uViolet, uGapX;
uniform vec4 uFold;
const float ZC = -430.;
// the thin place's size on the plane (m): half its width and half its height at half strength, and its middle's height
const vec2 WIN = vec2(130.,75.);
const float WINY = 70.;
// THE SEA WIND that the day's clouds, the spindrift and the city's palms go by. WDIR is its direction on plan (x, z),
// the direction the palms lean in (the part's wind, 0.85, 0.5); WIND is its speed in metres a second, the speed the
// spindrift runs at over the ice.
const vec2 WDIR = vec2(.862,.507);
const float WIND = 9.;
const float RIM = 3400.;     // the cloud banks stand over the rim of the sea (the sea's own radius, m)
const float HIGH = 6000.;    // the thin high cloud's height (m)
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn1(float x){ float i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(h11(i),h11(i+1.),f); }
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
// the fine upright rays of a curtain (x in metres along it) and the broad lit stretches they stand in
float raysFine(float x, float t){
  float b=vn1(x*.105-t*.33+17.), c=vn1(x*.36+t*.6+41.), e=vn1(x*1.07-t*1.3+5.);
  return (.35+.65*b)*(.4+.6*c)*(.7+.3*e);
}
float raysEnv(float x, float t){ return smoothstep(.22,.8,vn1(x*.019+t*.06)); }
float rays(float x, float t){ float env=raysEnv(x,t); return raysFine(x,t)*(.05+1.5*env*env); }
// THE THIN PLACE IS THE CURTAIN GROWN THIN, a thing of the curtain: functions of the point p = (x, y) on the plane
// z = ZC and of the clock's breath, of nothing else. No eye is in them. windowR is the point's measure from the foot
// of the gap's middle, in outlines: 1 on the design's outline (260 m wide at the ice and 150 m high, its middle 70 m
// up, over the middle of the great ridge's gap on this seed), 3 where the curtain is whole again, as far beyond the
// outline as the thin place is wide.
float windowR(vec2 p){
  float br=1.+.035*sin(uTime*.21+uFold.z);
  return length(vec2(p.x-uGapX,p.y-(WINY-WIN.y))/(vec2(WIN.x,2.*WIN.y)*br));
}
// the day's share behind the curtain's light at p (1 the day, 0 the night): whole within half the outline (the gap's
// floor and the sea beyond are seen there), half on the outline, and from there less and less over a long way, to
// nothing at three outlines. One smooth fall, with no streak, tooth or period in it: the night lies behind the rays
// and never in stripes over the day, and no line can be traced round it.
float windowAt(vec2 p){
  float r=windowR(p), q=max(2.*r-1.,0.);
  return (1.-smoothstep(1.,3.,r))/(1.+q*q);
}
// THE NIGHT SEEN FROM THE DAY is the curtain's far face (1 night, 0 day), one function of direction for every eye. The
// curtain stands along the east-west plane south of the day, so its wall is whole due south and its top sinks with the
// bearing as a straight wall's top does, by the cosine of the bearing from due south, to nothing at due east and due
// west; north of that the day has its own sky. Its height is not a wall's: it is one height in the sky for every eye
// on the day side, as the design gives the day side. Its arms come out of the day's far haze as that haze thins toward
// the south (the haze's own bearing law, below). The wall melts into the day by height, its top uneven by direction.
float ringN(vec3 d){
  float hl=max(length(d.xz),1e-4);
  float el=d.y/hl;
  vec2 h=d.xz/hl;
  float fr=vn2(h*2.6+uFold.xy*.13)*.55+vn2(h*9.+uFold.zw*.13+vec2(uTime*.012,0.))*.45;
  float top=(.57+.3*(fr-.5))*max(h.y,0.);
  return smoothstep(-.1,.3,h.y)*(1.-smoothstep(top*.3,top+1e-4,el));
}
// the point (x, y) at which the view ray from the eye along d meets the curtain plane
vec2 planeAt(vec3 d){
  float den=abs(d.z)>1e-4 ? d.z : (d.z<0. ? -1e-4 : 1e-4);
  return cameraPosition.xy+d.xy*((ZC-cameraPosition.z)/den);
}
float starLayer(vec3 d, float sc, float dens, float rad){
  vec3 q=d*sc, i=floor(q), f=fract(q)-.5;
  float h=h31(i);
  vec3 o=vec3(h31(i+11.3),h31(i+23.7),h31(i+37.1))-.5;
  float r=length(f-o*.5);
  float tw=.72+.28*sin(uTime*(1.2+5.*h)+h*40.);
  return step(1.-dens,h)*(1.-smoothstep(rad*.25,rad,r))*tw*(.35+.65*h31(i+3.1));
}
// one far curtain of the night: an upright sheet over the line dot(p.xz, n) = c, lower border y0, height hh
vec3 farCurtain(vec3 d, vec2 n, float c, float y0, float hh, float sd){
  float dn=dot(d.xz,n), en=dot(cameraPosition.xz,n);
  float den=abs(dn)>1e-3 ? dn : 1e-3;
  vec2 tn=vec2(-n.y,n.x);
  float t=(c-en)/den;
  float s=dot(cameraPosition.xz+d.xz*t,tn);
  float off=170.*sin(s*.0023+sd+uTime*.03)+60.*sin(s*.0067+sd*2.3-uTime*.05);
  t=(c+off-en)/den;
  vec3 P=cameraPosition+d*t;
  s=dot(P.xz,tn);
  float yb=y0+70.*vn1(s*.0035+sd);
  float v=(P.y-yb)/hh;
  // the lit stretches of a far curtain surge along it (about 110 m a second), dimmer between them and never dark: the
  // ring of night round the day is plainly alive, and no bundle of rays stands alone before dark sky
  float xr=s*.3+sd*97., ev=smoothstep(.22,.8,vn1(xr*.019+uTime*.6+sd));
  float ry=raysFine(xr,uTime)*(.14+1.4*ev*ev);
  float prof=smoothstep(0.,.03,v)*exp(-max(v,0.)*(3.4-2.4*min(ry,1.)));
  vec3 col=mix(uAurA,uAurB,smoothstep(0.,.3,v));
  col=mix(col,uAurV,smoothstep(.22,.85,v)*uViolet);
  float fold=clamp(.3/max(abs(dn)/max(length(d.xz),1e-3),.1),1.,2.6);
  return col*prof*ry*fold*step(1.,t)*(1.-smoothstep(3000.,7000.,t));
}
vec3 nightSky(vec3 d){
  float e=d.y;
  vec3 c=mix(uNHor,uNZen,pow(clamp(e,0.,1.),.5));
  c+=uAurA*.07*exp(-max(e,0.)*7.)*uAurK;
  float up=smoothstep(-.01,.05,e);
  c+=vec3(.86,.93,1.)*(starLayer(d,150.,.1,.2)*1.8+starLayer(d,280.,.17,.3)*.8)*up;
  vec3 a=farCurtain(d,vec2(0.,1.),900.,250.,700.,uFold.x)+farCurtain(d,vec2(0.,1.),2600.,300.,900.,uFold.y+3.)
    +farCurtain(d,vec2(.944,.33),1500.,240.,650.,uFold.z+7.)+farCurtain(d,vec2(-.97,.243),1900.,280.,800.,uFold.w+11.)
    +farCurtain(d,vec2(0.,-1.),2900.,90.,620.,uFold.x+17.);
  c+=a*uAurK*.8*up;
  return mix(c,uNGround,1.-smoothstep(-.03,0.,e));
}
// a cloud bank's body: noise by the direction's x and by its z, each with the height above the horizon
float cloudBody(vec2 hb, float e, float sc, float o){
  return .5*(vn2(vec2(hb.x*2.6,e*17.)*sc+o)+vn2(vec2(hb.y*2.6,e*17.)*sc+o+vec2(4.7,2.3)));
}
vec3 daySky(vec3 d){
  float e=d.y;
  vec3 c=mix(uDHor,uDMid,smoothstep(0.,.13,e));
  c=mix(c,uDZen,smoothstep(.06,.75,e));
  float sd=max(dot(d,uSunDir),0.);
  vec2 hd=d.xz/max(length(d.xz),1e-4), hs=uSunDir.xz/max(length(uSunDir.xz),1e-4);
  float toSun=dot(hd,hs);
  c+=uSunCol*vec3(1.,.66,.36)*.42*pow(max(toSun,0.),3.)*exp(-max(e,0.)*4.);
  // cloud banks low on the horizon, lit from the west. They are carried by the sea wind: a bank that stands RIM metres
  // off on the bearing az moves along the horizon by the wind's share across the line of sight, WIND / RIM radians a
  // second at most (0.15 degrees), nothing toward up wind and down wind; the same rate at every clock, body and all
  float az=(abs(d.x)+abs(d.z))>1e-5 ? atan(d.x,-d.z) : 0.;
  float azb=az-uTime*(WIND/RIM)*(WDIR.x*cos(az)+WDIR.y*sin(az));
  // the drifted bearing as a direction on plan: the banks' noise is read at its own x and z, so it is whole round the horizon
  vec2 hb=vec2(sin(azb),-cos(azb));
  float bank=vn2(hb*1.7+vec2(uFold.y,.3))*.6+vn2(hb*4.3+vec2(uFold.x,1.7))*.4;
  float body=cloudBody(hb,e,1.,0.)*.55+cloudBody(hb,e,2.3,5.)*.3+cloudBody(hb,e,5.1,9.)*.15;
  float e2=e-.15-.07*bank;
  float topE=.05+.16*bank*bank;
  float cl=(1.-smoothstep(topE*.35,topE,e2+(body-.5)*.07))*smoothstep(-.03,.03,e2+(body-.5)*.06)*smoothstep(.4,.7,bank+(body-.5)*.5);
  vec3 lit=mix(vec3(.6,.52,.66),vec3(1.,.84,.6),smoothstep(-.5,.7,toSun))*(.74+.5*body)*(.8+.5*smoothstep(0.,topE,e2));
  c=mix(c,lit,cl*.92);
  // thin high cloud: a level sheet HIGH metres up, carried by the same wind (WIND / HIGH of its own measure a second)
  vec2 cp=(d.xz/(max(e,0.)+.12)-WDIR*(uTime*WIND/HIGH))*1.4+vec2(0.,uFold.x);
  float ci=vn2(vec2(cp.x*.55+cp.y*.2,cp.y*1.9))*.6+vn2(vec2(cp.x*1.4,cp.y*5.2)+7.)*.4;
  c=mix(c,vec3(1.,.96,.9),smoothstep(.55,.88,ci)*.3*smoothstep(.04,.22,e));
  c+=uSunCol*(.25*pow(sd,6.)+.8*pow(sd,70.)+5.*smoothstep(.9993,.9998,sd));
  return mix(c,uDGround,1.-smoothstep(-.035,0.,e));
}
// the wall of night's melt into the day (w: 0 night, 1 day), through dusk colours in between
vec3 skyMix(vec3 night, vec3 day, vec3 d, float w){
  vec3 c=mix(night,day,w);
  vec3 dusk=w<.5 ? mix(uDusk3,uDusk2,w*2.) : mix(uDusk2,uDusk1,w*2.-1.);
  return mix(c,dusk*(1.-.45*clamp(d.y,0.,1.)),4.*w*(1.-w)*.62);
}
// what the eye sees of the sky along d, and the see-through weight T of the curtain plane along d (0 where the ray
// never crosses it); pc is the point (x, y) at which the ray meets the plane (the veil hands in its own point).
// THE ONE LOCK: the side of the plane on which the eye stands chooses the sky, a bare step. From the night side a ray
// that goes north shows, by the thin place's weight at pc, the day side as it is: the day side's own sky along d, the
// very function an eye on the day side sees (the day, the curtain's far face, the far haze), with no colour of the
// thin place's own between the night and it; every other ray is night. From the day side every ray shows that sky,
// and the night side's things show through the plane where that sky is night. Nothing here is sized, thinned or faded
// by the eye's distance from the plane.
vec3 skyAlong(vec3 d, vec2 pc, out float T){
  float dz=cameraPosition.z-ZC;
  float den=abs(d.z)>1e-4 ? d.z : 1e-4;
  float crossed=step(0.,-dz/den)*step(1e-4,abs(d.z));
  float nw=ringN(d);
  // the day side's far haze: at and under the horizon to the north, east and west the sky is the haze its land and sea fade to
  float hl=max(length(d.xz),1e-4);
  float hz=(1.-smoothstep(-.1,.3,d.z/hl))*(1.-smoothstep(0.,.045,d.y/hl));
  vec3 night=nightSky(d);
  vec3 within=mix(skyMix(night,daySky(d),d,1.-nw),uHazeD,hz);
  if(dz>0.){
    T=windowAt(pc)*crossed;
    return mix(night,within,T);
  }
  T=nw*crossed;
  return within;
}
`;

// ---------------------------------------------------------------- the ice's own light, by PLACE (never the scene's sun)
const ICE_GLSL = /* glsl */`
uniform vec3 uSnowLit, uSnowShade, uIceCore, uWarm, uFogN, uFogD, uLead, uSkin;
// 0 on the night side of the curtain plane, 1 on the day side
float dayAt(vec3 P){ return 1.-smoothstep(ZC-9., ZC+9., P.z); }
vec3 iceLight(vec3 P, vec3 N, vec3 V, float glass){
  float dayK=dayAt(P);
  float up=clamp(N.y*.5+.5,0.,1.);
  float rim=pow(clamp(1.-abs(dot(N,V)),0.,1.),2.);
  // night: the sky's light from above, the great curtain's green from the north, deep blue shade
  float ka=max(dot(N,normalize(vec3(0.,.5,-1.))),0.);
  float kw=max(dot(N,normalize(vec3(-.85,.3,-.2))),0.);
  vec3 night=uSnowShade*(.36+.28*up)+uSnowLit*(pow(up,2.4)*.07+ka*.2+kw*.05)+uAurA*(ka*.12+kw*.08+pow(up,3.)*.03)*uAurK;
  // the day's warm light that comes through the thin place, and the light that comes through a slab from behind
  vec3 tl=vec3(uGapX,14.,ZC-30.)-P;
  float dl=max(length(tl),1.);
  tl/=dl;
  float reach=exp(-dl/150.);
  night+=uWarm*(max(dot(N,tl),0.)*reach*1.1+.12*exp(-dl/85.));
  vec3 core=uSnowShade*(.16+.3*up)+uIceCore*(.012+.03*up+.16*kw+.1*rim*up+(.9*max(dot(-N,tl),0.)+.15)*reach)+uAurA*uAurK*(.06*kw+.03*rim);
  night=mix(night, core, glass*.8);
  // day: the low sun in the west and the blue of the sky
  float kd=max(dot(N,uSunDir),0.);
  vec3 day=uSunCol*kd*.9+vec3(.3,.46,.7)*(.4+.6*up);
  day=mix(day, uIceCore*(.5+.5*kd+.5*rim)+uSunCol*kd*.3, glass*.6);
  return mix(night,day,dayK);
}
vec3 iceFog(vec3 c, vec3 P){
  float dayK=dayAt(P);
  float f=1.-exp(-length(P-cameraPosition)*mix(.0004,.00055,dayK));
  return mix(c,mix(uFogN,uFogD,dayK),f);
}
`;
const ICE_VERT = /* glsl */`
uniform float uTime;
attribute vec2 aTint;
varying vec3 vW; varying vec2 vTint; varying vec3 vN0;
void main(){ vec4 w=modelMatrix*vec4(position,1.); w.y+=step(w.z,-467.)*.12*sin(uTime*.9+aTint.y*40.); vW=w.xyz; vTint=aTint; vN0=normal; gl_Position=projectionMatrix*viewMatrix*w; }`;
// slabs, blocks and the ridges' bodies: faceted, glassy where aTint.x says so, snow on what looks up
const SLAB_FRAG = /* glsl */`
//@SKY
varying vec3 vW; varying vec2 vTint;
void main(){
  vec3 fn=cross(dFdx(vW),dFdy(vW));
  vec3 N=dot(fn,fn)>1e-20 ? normalize(fn) : vec3(0.,1.,0.);
  vec3 V=normalize(cameraPosition-vW);
  float n1=vn2(vW.xz*.8+vW.y*.6), n2v=vn2(vec2((vW.x+vW.z*.7)*.35,vW.y*4.2+(vW.x-vW.z)*.22)+vTint.y*9.);
  float shelf=step(1.5,vTint.x), dk=dayAt(vW);
  float snow=smoothstep(.34,.66,N.y+(n1-.5)*.4);
  float g=min(vTint.x,1.)*(1.-snow)*(.55+.6*n1);
  float vein=smoothstep(.44,.5,n2v)*(1.-smoothstep(.5,.56,n2v));
  vec3 c=iceLight(vW,N,V,g)*mix(.64+.56*vTint.y+.25*n1,.7+.22*vTint.y+.2*n1,dk)+uIceCore*g*(vein*.09+.05*smoothstep(.35,.8,n1)*(1.-dk));
  vec3 R=reflect(-V,N);
  float gn=pow(max(dot(R,normalize(vec3(.15,.55,-1.))),0.),14.), gd=pow(max(dot(R,uSunDir),0.),36.);
  c+=(uAurA*gn*.55*uAurK*(1.-dk)+uSunCol*gd*1.2*dk)*(.25+.75*g);
  float pond=smoothstep(.6,.72,vn2(vW.xz*.31+vTint.y*23.))*smoothstep(.96,.995,N.y)*dk*(1.-shelf);
  c=mix(c,vec3(.3,.72,.8)*(.6+.4*n1),pond*.7);
  c=mix(c,(vec3(.2,.6,.68)+uSunCol*.08)*(.75+.35*n1),shelf*dk);
  gl_FragColor=vec4(iceFog(c,vW),1.);
}`;
// the ice plain: big floes, dark narrow leads with skin ice, wind-packed snow dunes
const PLAIN_FRAG = /* glsl */`
//@SKY
uniform float uFloe;
varying vec3 vW; varying vec3 vN0;
vec3 floes(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float d1=9., d2=9., id=0.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));
    vec2 r=g+h22(i+g)*.8+.1-f;
    float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=h21(i+g+3.7); } else if(d<d2){ d2=d; }
  }
  return vec3(sqrt(d2)-sqrt(d1),id,sqrt(d1));
}
float dune(vec2 p, float fineK){
  vec2 q=vec2(p.y*.045+p.x*.011,p.x*.016-p.y*.004);
  float sast=1.-abs(2.*vn2(vec2(p.y*.3+p.x*.06,p.x*.055)+11.)-1.);
  return vn2(q)+.5*vn2(q*2.3+7.)+.22*vn2(q*5.6+3.)+.13*sast*sast*fineK;
}
void main(){
  vec2 p=vW.xz;
  float dist=length(vW-cameraPosition);
  float foot=max(fwidth(p.x),fwidth(p.y));
  vec2 pw=p+7.*vec2(vn2(p*.05),vn2(p*.05+13.))+2.4*vec2(vn2(p*.23+3.),vn2(p*.23+31.));
  vec3 fl=floes(pw/uFloe+.3*vec2(vn2(p*.011),vn2(p*.011+9.)));
  float lw=(.005+.022*vn2(p*.007+21.))*smoothstep(.28,.5,vn2(p*.0045+5.));
  float aa=fwidth(fl.x)*1.5+.004;
  float lead=(1.-smoothstep(lw-aa,lw+aa,fl.x))*step(1e-3,lw);
  float rimIce=(1.-smoothstep(lw,lw+.035,fl.x))*step(1e-3,lw);
  float fineK=1.-smoothstep(.6,3.,foot), broadK=1.-smoothstep(4.,16.,foot);
  float e=.6, k=5.*broadK;
  float h0=dune(p,fineK), hx=dune(p+vec2(e,0.),fineK), hz=dune(p+vec2(0.,e),fineK);
  vec3 N=normalize(normalize(vN0)+vec3(-(hx-h0)/e*k,0.,-(hz-h0)/e*k));
  vec3 V=normalize(cameraPosition-vW);
  vec3 c=iceLight(vW,N,V,.1*rimIce)*(.93+.1*fl.y);
  c*=mix(1.,.66+.44*smoothstep(.45,1.25,h0),broadK);
  c*=.92+.16*vn2(p*.9)*fineK;
  c=mix(c,c*1.2+uSnowLit*.05,rimIce*(1.-lead));
  vec2 wa=vec2(dot(p,WDIR),dot(p,vec2(-WDIR.y,WDIR.x)));   // metres along the sea wind and across it
  vec2 sq=vec2((wa.x-uTime*WIND)*.028+wa.y*.004,wa.y*.2+vn2(p*.02)*2.);
  float drift=vn2(sq)*vn2(sq*vec2(2.3,1.7)+vec2(uTime*.4,3.));
  c+=(uSnowLit*.22+uAurA*.04)*smoothstep(.16,.5,drift)*(1.-smoothstep(120.,420.,dist))*(1.-lead);
  float skin=smoothstep(.2,.62,vn2(p*.33)*.6+vn2(p*1.4)*.4);
  vec3 lc=mix(uLead,uSkin,.22+.7*skin)+uAurA*.02*uAurK;
  c=mix(c,lc,lead*.92);
  gl_FragColor=vec4(iceFog(c,vW),1.);
}`;
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir=position; vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.); if(abs(p.w)<1e-4) p.w=1e-4; gl_Position=p.xyww; }`;
const DOME_FRAG = /* glsl */`
//@SKY
varying vec3 vDir;
void main(){ vec3 d=normalize(vDir); float T; gl_FragColor=vec4(skyAlong(d,planeAt(d),T),1.); }`;
const VEIL_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const VEIL_FRAG = /* glsl */`
//@SKY
varying vec3 vW;
void main(){
  vec3 d=normalize(vW-cameraPosition);
  float T;
  vec3 c=skyAlong(d,vW.xy,T);
  gl_FragColor=vec4(c,1.-T);
}`;
// the visible curtain: additive sheets of fine upright rays, sharp below, fading upward, pink-violet above green
const SHEET_VERT = /* glsl */`
uniform float uTime; uniform vec4 uSheet; uniform vec2 uWave;
attribute float aBase;
varying vec3 vW; varying float vV;
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float vn1(float x){ float i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(h11(i),h11(i+1.),f); }
void main(){
  float x=position.x, v=position.y;
  float yb=aBase;
  float z=-430.+uSheet.x+uWave.x*sin(x*.0041+uSheet.y+uTime*.09)+uWave.y*sin(x*.0127+uSheet.y*1.7-uTime*.14);
  vW=vec3(x,yb+v*uSheet.w,z); vV=v;
  gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);
}`;
const SHEET_FRAG = /* glsl */`
//@SKY
uniform vec4 uSheet; uniform float uGain; uniform vec2 uDepth;
varying vec3 vW; varying float vV;
void main(){
  float v=clamp(vV,0.,1.);
  float xx=vW.x+uSheet.y*31.;
  float fine=raysFine(xx,uTime), env=raysEnv(xx,uTime);
  // how much of the curtain's light is left at this sheet's own point (x, y), the same for every eye: at the foot of
  // the gap's middle the floor the far curtains keep between their lit stretches (.14: dimmer, never dark), more by
  // degrees sideways and upward, whole at three outlines. The rays hang across all of the thin place, weakest at
  // the crossing, and the eye flies under their hems (RAYS_OVER m over the line at the least).
  float h=smoothstep(0.,3.,windowR(vW.xy));
  float left=.14+.86*h;
  // the curtain stands in long lit stretches of fine rays with dimmer stretches between. The thin place is its
  // brightest fold: there every stretch is lit, so its rays are the curtain's own fine rays (unlike in width, spacing
  // and height, by the sheets' own noise) standing many together, none alone against the day. By degrees outward the
  // lit stretches and the dimmer ones between them return.
  float big=smoothstep(.34,.72,vn1(vW.x*.0037+uSheet.y*3.+uTime*.004));
  float own=fine*mix(.05+1.5,big*(.05+1.5*env*env),h);
  float ry=own*left;
  float prof=smoothstep(0.,.03,v)*exp(-v*(3.3-2.3*min(own,1.)))*(1.-smoothstep(.8,1.,v));
  vec3 col=mix(uAurA,uAurB,smoothstep(0.,.28,v));
  col=mix(col,uAurV,smoothstep(.2,.85,v)*uViolet);
  // toward the thin place's middle the rays turn from the curtain's colours to pale light
  col=mix(col,vec3(.55,1.,.78),1.-h);
  // the rays are whole for every eye and thin by place: a sheet's strength is its own depth through the curtain, from
  // nothing at the curtain's day face (uDepth.x) to the most at its night face (uDepth.y), one in the mean; an eye that
  // flies through has the stronger rays behind it and the thinner ahead. No eye, gaze or lens is read here.
  float kz=2.*clamp((vW.z-uDepth.x)/(uDepth.y-uDepth.x),0.,1.);
  // light over what lies behind: where a ray is bright it also veils (so that green stays green before the day's sky)
  float I=prof*ry*kz*uAurK*uGain;
  gl_FragColor=vec4(col*I,clamp(I*.6,0.,.62));
}`;
const withSky = (src) => src.replace('//@SKY', SKY_GLSL + ICE_GLSL);

// ---------------------------------------------------------------- geometry helpers (everything in world metres)
// gulls: a body and two wings each (an inner panel rising to the wrist, an outer one hanging from it: a bird's M from
// ahead), wheeling on a level circle of radius aP.x about its centre (position), banked into the turn by aL.y (radians:
// the outer wing up), gliding and beating by turns
const GULL_VERT = /* glsl */`
uniform float uTime;
attribute vec4 aP; attribute vec3 aL;
varying float vK; varying vec3 vW;
void main(){
  float a=aP.y+uTime*aP.z/aP.x;
  vec3 rt=vec3(cos(a),0.,sin(a)), fw=vec3(-sin(a),0.,cos(a))*sign(aP.z);
  vec3 c=position+rt*aP.x+vec3(0.,.8*sin(uTime*.35+aP.w),0.);
  float th=uTime*(5.+.3*sin(aP.w))+aP.w*7.;
  float flap=smoothstep(-.3,.5,sin(uTime*.45+aP.w*3.));
  float beat=sin(th)*flap, lag=sin(th-.7)*flap;
  float bk=aL.y, cb=cos(bk), ax=abs(aL.x);
  float hw=min(ax,.42)*(.45+.45*beat)+max(ax-.42,0.)*(-.45+.7*lag);
  vec3 w=c+rt*(aL.x*cb)+fw*aL.z+vec3(0.,aL.x*sin(bk)+hw*cb,0.);
  vK=abs(aL.x); vW=w;
  gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
}`;
// a bird in daylight, lit and shaded as everything else of the day side is: by the low sun on the face that is seen and
// by the sky from above and the sea and roofs from below. Pale grey back and upper wing, a white underside that stands
// in shade, dark wing tips, white only where the sun strikes. Nothing of it glows: every channel is held to 0.72, well
// under the picture's bloom threshold, at every distance; the day's haze lies over it by the true length of air to it.
const GULL_FRAG = /* glsl */`
uniform vec3 uSunCol, uSunDir, uFogD;
varying float vK; varying vec3 vW;
void main(){
  vec3 fn=cross(dFdx(vW),dFdy(vW));
  vec3 N=dot(fn,fn)>1e-20 ? normalize(fn) : vec3(0.,1.,0.);
  vec3 V=normalize(cameraPosition-vW);
  if(dot(N,V)<0.) N=-N;
  float upper=smoothstep(-.15,.15,N.y);
  vec3 alb=mix(vec3(.8,.8,.78),vec3(.6,.62,.66),upper);
  alb=mix(alb,vec3(.1,.1,.12),smoothstep(.5,.78,vK));
  vec3 amb=mix(vec3(.2,.19,.17),vec3(.24,.31,.45),N.y*.5+.5);
  vec3 c=alb*(uSunCol*max(dot(N,uSunDir),0.)*.95+amb);
  float fd=length(vW-cameraPosition)*.00055;
  c=mix(c,uFogD,1.-exp(-fd*fd));
  gl_FragColor=vec4(min(c,vec3(.72)),1.);
}`;
// a soup of boxes merged into one geometry: position and aTint (x: glassy 0..1, y: a random number of the box)
const CUBE = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const QUADS = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3]];
function makeSoup() {
  const pos = [], tint = [], idx = [], v = new THREE.Vector3();
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const soup = {
    pos, boxes: 0,
    // a box of half sizes (hx, hy, hz) at (x, y, z), turned by yaw and leaned by tilt about its own long axis; taper narrows its top
    box(x, y, z, hx, hy, hz, yaw, tiltX, tiltZ, glass, rnd, taper = 1, jit = 0.5) {
      e.set(tiltX, yaw, tiltZ, 'YXZ'); q.setFromEuler(e); p.set(x, y, z); s.set(hx, hy, hz); m.compose(p, q, s);
      const base = pos.length / 3;
      for (let ci = 0; ci < 8; ci++) {
        const c = CUBE[ci], k = c[1] > 0 ? taper : 1;
        const j = (n) => { const f = Math.sin((rnd * 91.7 + ci * 7.13 + n * 3.31) * 43.37) * 4375.85; return (f - Math.floor(f)) - 0.5; };
        v.set(c[0] * k * (1 + jit * j(1)), c[1] * (1 + jit * 0.6 * j(2)), c[2] * k * (1 + jit * j(3))).applyMatrix4(m);
        pos.push(v.x, v.y, v.z); tint.push(glass, rnd);
      }
      for (const f of QUADS) idx.push(base + f[0], base + f[1], base + f[2], base + f[0], base + f[2], base + f[3]);
      soup.boxes++;
      return base;
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 2));
      g.setIndex(idx);
      g.computeBoundingSphere();
      return g;
    },
  };
  return soup;
}
// a height field over the grid lines xs by zs: position, normal, aTint
function gridGeometry(xs, zs, hAt, tintAt) {
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3), tint = new Float32Array(nx * nz * 2), idx = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, x = xs[i], z = zs[j], h = hAt(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const t = tintAt ? tintAt(x, z, h) : [0, 0.5]; tint[k * 2] = t[0]; tint[k * 2 + 1] = t[1];
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1);
    const dx = (pos[(j * nx + i1) * 3 + 1] - pos[(j * nx + i0) * 3 + 1]) / (xs[i1] - xs[i0]);
    const dz = (pos[(j1 * nx + i) * 3 + 1] - pos[(j0 * nx + i) * 3 + 1]) / (zs[j1] - zs[j0]);
    const l = Math.hypot(dx, 1, dz); nor[k * 3] = -dx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = -dz / l;
  }
  // zs run toward +z: the two triangles of a cell wound so that they face up
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aTint', new THREE.BufferAttribute(tint, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
const span = (a, b, step) => { const out = []; const n = Math.max(1, Math.round((b - a) / step)); for (let i = 0; i <= n; i++) out.push(a + (b - a) * i / n); return out; };

export default {
  id: 'harbour-in-the-aurora',
  name: 'A Harbour in the Aurora',
  category: 'books',
  placeKind: 'ocean',
  book: 'His Dark Materials',
  author: 'Philip Pullman, born 1946',
  media: ['air'],
  weirdness: 0.7,
  async build(ctx) {
    const { noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // every stream of this world, in one fixed list (each made from the seed and a name: none draws from a parent)
    const mk = (name) => ctx.core.makeRng(ctx.core.hashSeed('harbour-aurora/' + name + ':' + ctx.seed));
    const rLook = mk('look'), rRoute = mk('route'), rRidge = mk('ridges'), rGreat = mk('great-ridge'), rBits = mk('bits'), rFloe = mk('floes'), rSea = mk('sea'), rFar = mk('far'), rWay = mk('wayside'), rWall = mk('walls'), rField = mk('field'), rGull = mk('gulls'), rTowerG = mk('tower-flocks'), rPartyG = mk('line-parties'), rBasinG = mk('basin-flock');
    // ---------- the look the seed deals
    // a low golden afternoon: the sun 16 to 20 degrees up in the west-south-west, over the low end of the wall of night
    const hourEl = { day: 20, golden: 16, dawn: 17, night: 16 }[vary.hour];
    const sunDeal = rLook.range(16, 20), sunEl = (hourEl ?? sunDeal) * Math.PI / 180, sunAz = 18 * Math.PI / 180;
    const sun = new THREE.Vector3(-Math.cos(sunEl) * Math.cos(sunAz), Math.sin(sunEl), Math.cos(sunEl) * Math.sin(sunAz));
    const greenBlue = rLook.range(0, 0.65), pink = rLook.range(0, 1), violet = rLook.range(0.55, 1);
    const moodDeal = rLook(), auroraK = 0.92 + 0.4 * (vary.mood ?? moodDeal);
    const fold = new THREE.Vector4(rLook.range(0, 60), rLook.range(0, 60), rLook.range(0, 6.28), rLook.range(0, 60));
    const dayHaze = lin('#b0849e'), nightHaze = lin('#17344e');   // the day's far haze is the dusk at its horizon
    const U = {
      uTime: { value: 0 }, uSunDir: { value: sun }, uAurK: { value: auroraK }, uViolet: { value: violet }, uFold: { value: fold },
      uNZen: { value: lin('#050b1c') }, uNHor: { value: lin('#0e2233') }, uNGround: { value: nightHaze },
      uDZen: { value: lin('#2a66c2') }, uDMid: { value: lin('#79b0e6') }, uDHor: { value: lin('#edc6a6') }, uDGround: { value: dayHaze }, uHazeD: { value: dayHaze }, uSunCol: { value: lin('#ffd9a0') },
      uAurA: { value: lin('#4dffa0').lerp(lin('#2fe3c0'), greenBlue) }, uAurB: { value: lin('#2fe3c0').lerp(lin('#36c4ee'), greenBlue) },
      uAurV: { value: lin('#c05cff').lerp(lin('#ff5f8a'), pink * 0.7) },
      uDusk1: { value: lin('#ff9a6a') }, uDusk2: { value: lin('#b06aa8') }, uDusk3: { value: lin('#3a3f7a') },
      uSnowLit: { value: lin('#cfe6f2') }, uSnowShade: { value: lin('#3d5f8a') }, uIceCore: { value: lin('#49c7d8') }, uWarm: { value: lin('#ffd9a0') },
      uFogN: { value: nightHaze }, uFogD: { value: dayHaze }, uLead: { value: lin('#06131f') }, uSkin: { value: lin('#62798a') },
      uFloe: { value: rLook.range(54, 76) }, uGapX: { value: 0 },
    };
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(dayHaze.clone(), 0.00055);
    // ---------- the scene's lights are the day side's alone: the low sun in the west (the one shadow light) and the sky's fill
    const sunLight = new THREE.DirectionalLight('#ffcf8f', 3.3);
    sunLight.castShadow = true; sunLight.shadow.mapSize.set(2048, 2048);
    const SR = 210, sc = sunLight.shadow.camera;
    sc.left = -SR; sc.right = SR; sc.top = SR; sc.bottom = -SR; sc.near = 1; sc.far = 1200; sc.updateProjectionMatrix();
    sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = (SR * 2 / 2048) * 2.5;
    const hemi = new THREE.HemisphereLight('#9dbcf0', '#b3906e', 0.86);
    const fill = new THREE.DirectionalLight('#c9d6ff', 0.4);   // the sky's cool light on what faces north and east, away from the sun
    fill.position.set(0.6, 0.45, -0.65).multiplyScalar(400);
    scene.add(sunLight, sunLight.target, hemi, fill);
    // ---------- the sky dome, the veil on the curtain plane and the ray sheets
    const mats = [];
    const shader = (o) => { const m = new THREE.ShaderMaterial({ uniforms: U, ...o }); mats.push(m); return m; };
    const dome = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), shader({ vertexShader: DOME_VERT, fragmentShader: withSky(DOME_FRAG), side: THREE.BackSide, depthTest: false, depthWrite: false }));
    dome.frustumCulled = false; dome.renderOrder = -1000; scene.add(dome);
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(7000, 1100), shader({ vertexShader: VEIL_VERT, fragmentShader: withSky(VEIL_FRAG), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    veil.position.set(0, 450, ZC); veil.frustumCulled = false; veil.renderOrder = 20; scene.add(veil);
    const sheetOff = [46, 27, 9, -9, -26, -44], sheetDeal = sheetOff.map(() => [rLook.range(0, 40), rLook.range(HEM_DEAL[0], HEM_DEAL[1]), rLook.range(300, 430)]);
    // each sheet waves about its own line by 20 m and 8 m; so the curtain's day face and night face stand at the
    // outermost sheets' lines and that reach beyond them
    const WAVE = [20, 8], zDay = ZC + Math.min(...sheetOff) - WAVE[0] - WAVE[1], zNight = ZC + Math.max(...sheetOff) + WAVE[0] + WAVE[1];
    // (the sheets' geometry is made below, once the ridge's crest is known: each hem hangs just above the crest)
    const sheetMeshes = sheetOff.map((off, i) => {
      const us = { ...U, uSheet: { value: new THREE.Vector4(off, sheetDeal[i][0], 0, sheetDeal[i][2]) }, uGain: { value: 0.42 }, uWave: { value: new THREE.Vector2(WAVE[0], WAVE[1]) }, uDepth: { value: new THREE.Vector2(zDay, zNight) } };
      const m = new THREE.ShaderMaterial({ uniforms: us, vertexShader: SHEET_VERT, fragmentShader: withSky(SHEET_FRAG), side: THREE.DoubleSide, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), m); mesh.frustumCulled = false; mesh.renderOrder = 21 + i; scene.add(mesh);
      return mesh;
    });
    await ctx.yield();
    // ---------- the warm sea of the day side (it lies under the ice too, where the ice hides it)
    const wl = Water.waterLight('noon', { sunDir: sun, sunColor: '#ffd9a0', sunIntensity: 3.0, zenith: '#2a66c2', mid: '#79b0e6', horizon: '#edc6a6', fogColor: dayHaze });
    const ocean = Water.makeOcean({ rng: rSea, light: wl, preset: 'calm', height: 0.22, radius: 3400, rings: 80, segments: 104, deep: '#0d6f8f', scatter: '#1fa3a8', shallowColor: '#3fd6c2', horizonColor: dayHaze, windAngle: 2.2, reflectivity: 0.85, glitter: 1.7 });
    scene.add(ocean.object);
    await ctx.yield();
    // ---------- the city (the part), its origin at the harbour mouth
    const hero = await buildHero(ctx, { sun: sun.clone(), seedKey: ctx.seed });
    hero.object.position.set(0, 0, CITY_Z); scene.add(hero.object);
    // the palms stand plainly in the sea wind: the part's own wind (its strength is the part's, 2.6), reached once through
    // the kit's handle on its materials (material.userData.wind) and set half as quick again here, not in the part's file
    hero.object.traverse((m) => { const w = m.material && m.material.userData && m.material.userData.wind; if (w && w.set) w.set({ speed: 1.5 }); });
    const anchors = hero.anchors;
    const ringLight = new THREE.PointLight('#c8ffe6', 900, 130, 2);
    ringLight.position.set(anchors.ring[0], anchors.ring[1], anchors.ring[2] + CITY_Z); scene.add(ringLight);
    await ctx.yield();
    // ---------- THE ROUTE. Its rules, in metres of the place:
    //  the entry (17, 9, -130) heading north, 62 m straight and level over a field of low floes; then a strong S low over
    //  the ice (8.4 to 10.8 m): a right bend into a lane between two tall ice walls (heading about 30 degrees east of
    //  north, the city hidden behind the left wall), a left bend round the wall's end (the city comes out again, larger),
    //  then one straight diagonal (about 25 degrees west of north) through the great ridge's wide gap, through the
    //  curtain at 13.5 m and low over the warm water (10.8 to 11.6 m) into the harbour mouth; then the city's corridor
    //  (the part's anchors, its first point taken lower) to the ring, the last leg flown due south.
    const cor = anchors.corridor.map((p) => [p[0], p[1], p[2] + CITY_Z]);
    const amp = rRoute.range(0.88, 1.08), sz = rRoute.range(-6, 6), EX = 17;
    const sx = (x) => EX + (x - EX) * amp;
    const x10 = sx(74), dg = (z) => cor[0][0] + (x10 - cor[0][0]) * (z - cor[0][2]) / (-371.4 - cor[0][2]);   // the straight diagonal to the mouth
    const gapC = dg(ZC);
    U.uGapX.value = gapC;
    const path = makePath([[EX, 9, ENTRY_Z], [EX, 9, ENTRY_Z - RUNIN / 2], [EX, 9, ENTRY_Z - RUNIN], [sx(18.4), 8.8, -211], [sx(24.3), 8.6, -228], [sx(48.5), 8.4, -266 + sz * 0.5],
      [sx(71), 8.6, -305 + sz], [sx(79), 8.9, -323 + sz], [sx(80.7), 9.3, -341 + sz], [sx(77.6), 10, -359 + sz * 0.5], [x10, 10.8, -371.4],
      [dg(-400), 12.4, -400], [gapC, CROSS_Y, ZC], [dg(-470), 11.6, -470], [dg(-503), 10.8, -503], [cor[0][0], 11, cor[0][2]], ...cor.slice(1)]);
    // the flown line at every metre, for every count of clear air
    const RN = Math.ceil(path.length), route = new Float32Array((RN + 1) * 3), tv = new THREE.Vector3();
    for (let i = 0; i <= RN; i++) { path.posAtDist(Math.min(i, path.length), tv); route[i * 3] = tv.x; route[i * 3 + 1] = tv.y; route[i * 3 + 2] = tv.z; }
    const routeDist = (x, y, z, reach = 60) => {
      let best = 1e9;
      for (let i = 0; i <= RN; i++) {
        const dz = route[i * 3 + 2] - z; if (dz > reach || dz < -reach) continue;
        const dx = route[i * 3] - x, dy = route[i * 3 + 1] - y, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
    const metreAtZ = (z) => { for (let i = 0; i <= RN; i++) if (route[i * 3 + 2] <= z) return i; return RN; };   // first metre at which the line has come to z (the ice run goes north)
    const routeX = (z) => route[metreAtZ(z) * 3];
    // three lesser ridges far to either side of the line (none nearer than 30 m to it): the middle distance
    const ridgeZ = [-168, -252, -334].map((z) => z + rRoute.range(-7, 7));
    const gapX = ridgeZ.map((z) => routeX(z));
    const CLEAR = 2.6;
    // ---------- the ice: where it stands and how high (pure functions of the place)
    const dune = (x, z) => 0.5 + 0.5 * noise.fbm2(x * 0.021 + 3.1, z * 0.0075 - 1.7, 3);
    const ridgeLine = (i, x) => ridgeZ[i] + 13 * noise.n2(x * 0.0065, i * 7.3 + 1.2);
    const ridgeTall = (i, x) => (0.9 + 2.7 * Math.max(0, 0.55 + 0.45 * noise.n2(x * 0.021 + i * 31.7, 4.4))) * smoothstep(30, 62, Math.abs(x - gapX[i]));
    const lesser = (x, z) => {
      let h = 0;
      for (let i = 0; i < 3; i++) { const dz = (z - ridgeLine(i, x)) / 6.5; if (Math.abs(dz) < 3) h = Math.max(h, ridgeTall(i, x) * Math.exp(-dz * dz)); }
      return h;
    };
    const plainH = (x, z) => 0.55 + 1.1 * dune(x, z) + 0.55 * lesser(x, z);
    const crestH = (x) => lerp(4, 25 + 5.5 * noise.n2(x * 0.0043, 9.9), smoothstep(44, 64, Math.abs(x - gapC)));
    const greatH = (x, z) => {
      const t = (z - ZC) / GREAT; if (Math.abs(t) >= 1) return -3;
      const p = Math.pow(1 - t * t, 0.75);
      const body = -3 + (crestH(x) + 3) * p * (0.86 + 0.14 * noise.n2(x * 0.03, z * 0.03)) + 1.6 * noise.n2(x * 0.09, z * 0.09) * p;
      // beside the gap (by the crest's own rise) the ridge's body at the plane never stands lower than the flown line there
      // and the lens's clear air over it: what lies under the eye's horizon behind the ridge is hidden on every seed
      return Math.max(body, -3 + (CROSS_Y + CLEAR + 3) * p * smoothstep(44, 64, Math.abs(x - gapC)));
    };
    // the curtain's sheets: each hem hangs a few metres over the ridge's crest, from far left to far right
    sheetMeshes.forEach((mesh, i) => {
      const g = new THREE.PlaneGeometry(3400, 1, 220, 1); g.translate(0, 0.5, 0);
      const pa = g.attributes.position, base = new Float32Array(pa.count);
      for (let k = 0; k < pa.count; k++) { const x = pa.getX(k); base[k] = Math.max(crestH(x), HEM) + sheetDeal[i][1] + HEM_WAVE * (0.5 + 0.5 * noise.n2(x * 0.011, i * 3.3 + 20)); }
      g.setAttribute('aBase', new THREE.BufferAttribute(base, 1));
      mesh.geometry = g;
    });
    const iceMat = (frag) => shader({ vertexShader: ICE_VERT, fragmentShader: withSky(frag) });
    const slabMat = iceMat(SLAB_FRAG), plainMat = iceMat(PLAIN_FRAG);
    const addMesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; scene.add(m); return m; };
    // the plain: fine round the route, coarse to the horizon; it ends under the great ridge and lies behind the entry too
    const xsP = [-5200, -3200, -1900, -1100, -700, -480, -360, ...span(-238, 322, 7), 360, 480, 700, 1100, 1900, 3200, 5200];
    const zsP = [...span(-446, -61, 7), -20, 60, 200, 400, 700, 1200, 2200, 3600, 5200];
    addMesh(gridGeometry(xsP, zsP, plainH), plainMat, 'ice-plain');
    await ctx.yield();
    // the great ridge's body: fine near the gap, coarse far along the curtain plane
    const xsG = [...span(-4600, -520, 80), ...span(-455, 455, 7), ...span(520, 4600, 80)];
    addMesh(gridGeometry(xsG, span(ZC - GREAT, ZC + GREAT, 5), greatH, (x, z) => [0.35 + 0.3 * noise.n2(x * 0.05, z * 0.05), 0.5 + 0.5 * noise.n2(x * 0.2, z * 0.2)]), slabMat, 'great-ridge');
    await ctx.yield();
    // ---------- THE LANE: two tall grounded ice walls beside the line between the S's bends (the left one, on the city's
    // side, the taller: it hides the city until the line rounds its end). A pure function of the place: the wall stands
    // from 7.5 m to about 37 m to either side of the line, steep toward it.
    const mL0 = metreAtZ(-222), mL1 = metreAtZ(-340 + sz), W_IN = 7.5;
    let lx0 = 1e9, lx1 = -1e9, lz0 = 1e9, lz1 = -1e9;
    for (let i = mL0; i <= mL1; i++) { lx0 = Math.min(lx0, route[i * 3]); lx1 = Math.max(lx1, route[i * 3]); lz0 = Math.min(lz0, route[i * 3 + 2]); lz1 = Math.max(lz1, route[i * 3 + 2]); }
    const lane = (x, z) => {   // [metres to the right of the line (left negative), metre of the route] at the nearest point of the lane's stretch
      let best = 1e18, bi = mL0;
      for (let i = mL0 - 10; i <= mL1 + 10; i++) { const dx = x - route[i * 3], dz = z - route[i * 3 + 2], d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      const tx = route[(bi + 1) * 3] - route[(bi - 1) * 3], tz = route[(bi + 1) * 3 + 2] - route[(bi - 1) * 3 + 2], l = Math.hypot(tx, tz) || 1;
      return [((x - route[bi * 3]) * -tz + (z - route[bi * 3 + 2]) * tx) / l, bi];
    };
    const wallH = (x, z) => {
      if (x < lx0 - 40 || x > lx1 + 40 || z < lz0 - 40 || z > lz1 + 40) return 0;
      const [sd, m] = lane(x, z), a = Math.abs(sd);
      if (a <= W_IN || a >= W_IN + 30) return 0;
      const ends = smoothstep(mL0, mL0 + 22, m) * (1 - smoothstep(mL1 - 22, mL1, m));
      const tall = (sd < 0 ? 15.5 : 9.5) * ends * (0.72 + 0.28 * noise.n2(m * 0.06 + (sd < 0 ? 3 : 40), 5.5));
      return tall * smoothstep(W_IN, W_IN + 5.5, a) * (1 - smoothstep(W_IN + 9, W_IN + 30, a)) * (0.85 + 0.15 * noise.n2(x * 0.12, z * 0.12));
    };
    const ground = (x, z) => plainH(x, z) + wallH(x, z);
    addMesh(gridGeometry(span(lx0 - 42, lx1 + 42, 3), span(lz0 - 42, lz1 + 42, 3), (x, z) => { const w = wallH(x, z); return w > 0.02 ? plainH(x, z) + w : plainH(x, z) - 0.8; },
      (x, z) => [0.3 + 0.45 * (0.5 + 0.5 * noise.n2(x * 0.07, z * 0.07)), 0.5 + 0.5 * noise.n2(x * 0.2, z * 0.2)]), slabMat, 'lane-walls');
    await ctx.yield();
    // ---------- slabs. Every candidate's dice are drawn first; then it is kept only if (1) its whole ball of reach stands
    // CLEAR (2.6 m) and a margin from the flown line, by place, (2) it is not behind the entry, and (3) it does not stand
    // in a slab kept before it (none through another). Snow beds and drift tails lie under and beside the slabs.
    const counts = { kept: {}, least: {} };
    const cells = new Map(), CELL = 7;
    const crowded = (x, y, z, r, add) => {
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let i = cx - 2; i <= cx + 2; i++) for (let j = cz - 2; j <= cz + 2; j++) {
        const list = cells.get(i * 4096 + j); if (!list) continue;
        for (let k = 0; k < list.length; k += 4) { const dx = list[k] - x, dy = list[k + 1] - y, dz = list[k + 2] - z, rr = (list[k + 3] + r) * 0.66; if (dx * dx + dy * dy + dz * dz < rr * rr) return true; }
      }
      if (add) { const key = cx * 4096 + cz; let l = cells.get(key); if (!l) cells.set(key, l = []); l.push(x, y, z, r); }
      return false;
    };
    const tryBox = (soup, kind, x, y, z, hx, hy, hz, yaw, tx, tz, glass, rnd, taper, jit, soft) => {
      const jt = jit ?? 0.5, reach = Math.hypot(hx * (1 + jt * 0.5), hy * (1 + jt * 0.3), hz * (1 + jt * 0.5)), d = routeDist(x, y, z) - reach;
      if (d < CLEAR + 0.5) return false;
      // behind the entry: 62 m back and 15 m to either side of the entry frame's level axis stay clear of every solid
      if (z + reach > ENTRY_Z - 1 && z - reach < ENTRY_Z + 62 && Math.abs(x - EX) - reach < 15) return false;
      if (!soft && Math.max(hx, hz) <= 12 && crowded(x, y, z, Math.max(hx, hz), true)) return false;
      soup.box(x, y, z, hx, hy, hz, yaw, tx, tz, glass, rnd, taper, jit);
      counts.kept[kind] = (counts.kept[kind] || 0) + 1; counts.least[kind] = Math.min(counts.least[kind] ?? 1e9, d);
      return true;
    };
    // an upturned plate: leaning 11 to 46 degrees, its foot buried, bedded in a low pad of snow; its edges broken (a
    // taper and a push of each corner from its own number)
    const plate = (soup, kind, x, z, hx, hy, hz, yaw, tilt, tz, g, rnd, gy = ground(x, z)) => {
      if (!tryBox(soup, kind, x, gy + Math.abs(Math.sin(tilt)) * hz * 0.6 - 0.15, z, hx, hy, hz, yaw, tilt, tz, g, rnd, 0.62 + 0.38 * ((rnd * 13.7) % 1), 0.7)) return false;
      tryBox(soup, 'bed', x, gy + 0.1, z, hx * 0.9 + 0.7, 0.42, hz * 0.7 + 0.7, yaw, 0, 0, 0, rnd, 0.5, 0.35, true);
      return true;
    };
    const dens = (0.8 + (clamp(vary.density ?? 1, 0.7, 1.3) - 0.7) * (0.4 / 0.6)) * (0.6 + 0.4 * detail);
    const bergSide = rFar.sign(), bergX = gapC + bergSide * rFar.range(170, 230), bergZ = rFar.range(-372, -300), bergH = rFar.range(22, 30), bergYaw = rFar.range(-0.4, 0.4), bergR = [rFar(), rFar(), rFar()];
    const inBerg = (x, z) => vary.rare && Math.abs(x - bergX) < 100 && Math.abs(z - bergZ) < 52;
    const nightSoup = makeSoup();
    // the three lesser ridges, far to either side of the line: jumbled plates on a low snow body
    for (let i = 0; i < 3; i++) {
      const n = Math.round(230 * dens);
      for (let k = 0; k < n; k++) {
        const x = gapX[i] + rRidge.gauss() * 150, off = rRidge.gauss() * 4.2, hx = rRidge.range(1.3, 4.4), hy = rRidge.range(0.18, 0.5), hz = rRidge.range(0.9, 2.8);
        const yaw = rRidge.range(0, 6.283), tilt = rRidge.range(0.2, 0.8) * rRidge.sign(), tz = rRidge.range(-0.3, 0.3), g = rRidge.range(0.45, 1), rnd = rRidge();
        const z = ridgeLine(i, x) + off, tall = ridgeTall(i, x) / 3.6, sc = 0.45 + 0.75 * tall;
        if (Math.abs(x - gapX[i]) > 420 || tall < 0.08 || inBerg(x, z)) continue;
        plate(nightSoup, 'lesser', x, z, hx * sc, hy, hz * sc, yaw, tilt, tz, g, rnd);
      }
      await ctx.yield();
    }
    // scattered upturned plates and small blue bergy bits on the plain, each with its drift tail down the wind
    const nBits = Math.round(200 * dens);
    for (let k = 0; k < nBits; k++) {
      const x = 40 + rBits.gauss() * 120, z = rBits.range(-392, -70), berg = rBits.chance(0.16), hx = rBits.range(1.2, 3.8), hy = rBits.range(0.16, 0.48), hz = rBits.range(0.9, 2.8);
      const yaw = rBits.range(0, 6.283), tilt = rBits.range(0.2, 0.8) * rBits.sign(), tz = rBits.range(-0.3, 0.3), rnd = rBits(), bh = rBits.range(0.9, 2.7), tp = rBits.range(0.4, 0.7), g = rBits.range(0.5, 1);
      if (inBerg(x, z)) continue;
      const gy = ground(x, z);
      const ok = berg ? tryBox(nightSoup, 'bergy', x, gy + bh * 0.72, z, hx, bh, hz * 1.2, yaw, tz * 0.5, tz * 0.5, 1, rnd, tp, 0.7) && (tryBox(nightSoup, 'bed', x, gy + 0.1, z, hx + 0.9, 0.45, hz * 1.2 + 0.9, yaw, 0, 0, 0, rnd, 0.5, 0.35, true), true)
        : plate(nightSoup, 'upturned', x, z, hx, hy, hz, yaw, tilt, tz, g, rnd, gy);
      if (ok) tryBox(nightSoup, 'drift', x + 2.4 + hx, plainH(x + 3 + hx, z) + 0.1, z, 2.6 + hx * 1.3, 0.5, 0.8 + hz * 0.5, 0, 0, -0.1, 0, rnd, 0.3, 0.3, true);
    }
    // wayside ice: small groups of upturned plates beside the flown line through the whole ice run, one group every 8 m
    // of route, 6.5 to 26 m to one side of it (near things in every view), with a drift tail and rubble about it
    const mGap = metreAtZ(ZC + GREAT - 1);   // the wayside ice ends a metre inside the great ridge's south foot
    for (let m = 14; m < mGap; m += 8) {
      const side = rWay.sign(), off = rWay.range(6.5, 26), n = 2 + Math.floor(rWay() * 3), cx = route[m * 3] + side * off, cz = route[m * 3 + 2] + rWay.range(-3, 3), tr = rWay();
      for (let k = 0; k < 5; k++) {
        const dx = rWay.range(-3.6, 3.6), dz = rWay.range(-3.6, 3.6), hx = rWay.range(0.8, 2.8), hy = rWay.range(0.14, 0.42), hz = rWay.range(0.7, 2.2);
        const yaw = rWay.range(0, 6.283), tilt = rWay.range(0.2, 0.8) * rWay.sign(), g = rWay.range(0.6, 1), rnd = rWay();
        if (k < n) plate(nightSoup, 'wayside', cx + dx, cz + dz, hx, hy, hz, yaw, tilt, 0.2, g, rnd);
      }
      tryBox(nightSoup, 'drift', cx + 5.5, plainH(cx + 5.5, cz) + 0.1, cz, 5.5, 0.5, 1.7, 0, 0, -0.1, 0, tr, 0.3, 0.3, true);
      // rubble about each group: small broken pieces half sunk in the snow
      for (let k = 0; k < 6; k++) {
        const dx = rWay.range(-9, 9), dz = rWay.range(-9, 9), hx = rWay.range(0.35, 1.1), hy = rWay.range(0.1, 0.3), hz = rWay.range(0.3, 0.9), yaw = rWay.range(0, 6.283), tilt = rWay.range(-0.5, 0.5), g = rWay.range(0.3, 1), rnd = rWay();
        const x = cx + dx, z = cz + dz;
        tryBox(nightSoup, 'rubble', x, ground(x, z) + hy * 0.3 + Math.abs(Math.sin(tilt)) * hz * 0.4, z, hx, hy, hz, yaw, tilt, 0.15, g, rnd, 0.8, 0.7);
      }
    }
    // the lane's walls: plates and blocks piled on both walls, feet in the wall's own snow
    const nWall = Math.round(400 * dens);
    for (let k = 0; k < nWall; k++) {
      const m = mL0 + rWall() * (mL1 - mL0), side = rWall.sign(), a = W_IN + 1.5 + rWall() * 24, block = rWall.chance(0.22), hx = rWall.range(1.5, 4.6), hy = rWall.range(0.22, 0.6), hz = rWall.range(1.3, 3.4);
      const yaw = rWall.range(0, 6.283), tilt = rWall.range(0.2, 0.8) * rWall.sign(), tz = rWall.range(-0.3, 0.3), g = rWall.range(0.5, 1), rnd = rWall(), bh = rWall.range(1.2, 3.2);
      const i = Math.floor(m), tx = route[(i + 1) * 3] - route[(i - 1) * 3], tzz = route[(i + 1) * 3 + 2] - route[(i - 1) * 3 + 2], l = Math.hypot(tx, tzz) || 1;
      const x = route[i * 3] + (-tzz / l) * side * a, z = route[i * 3 + 2] + (tx / l) * side * a, gy = ground(x, z);
      if (block) tryBox(nightSoup, 'wall', x, gy + bh * 0.6, z, hx * 0.8, bh, hz, yaw, tz * 0.4, tz * 0.4, 0.9, rnd, 0.55, 0.7);
      else plate(nightSoup, 'wall', x, z, hx, hy, hz, yaw, tilt, tz, g, rnd, gy);
    }
    await ctx.yield();
    // the field of low floes about the entry stretch: flat plates a step above the snow, apart from one another
    const nField = Math.round(190 * dens);
    for (let k = 0; k < nField; k++) {
      const x = EX + rField.gauss() * 95, z = rField.range(-240, -92), hx = rField.range(2.5, 7.5), hy = rField.range(0.22, 0.38), hz = rField.range(2, 5.5);
      const yaw = rField.range(0, 6.283), tx = rField.range(-0.05, 0.05), tz = rField.range(-0.05, 0.05), g = rField.range(0.35, 0.7), rnd = rField();
      tryBox(nightSoup, 'lowfloe', x, ground(x, z) + hy * 0.55, z, hx, hy, hz, yaw, tx, tz, g, rnd, 0.9, 0.6);
    }
    if (vary.rare) {
      tryBox(nightSoup, 'berg', bergX, bergH * 0.42, bergZ, 78, bergH * 0.6, 36, bergYaw, 0.03, -0.04 * bergSide, 0.85, bergR[0], 0.8, 0.35);
      tryBox(nightSoup, 'berg', bergX - bergSide * 52, bergH * 0.3, bergZ + 22, 26, bergH * 0.42, 20, bergYaw + 0.5, -0.06, 0.05, 0.9, bergR[1], 0.7, 0.4);
      tryBox(nightSoup, 'berg', bergX + bergSide * 20, bergH * 0.95, bergZ - 6, 30, bergH * 0.3, 18, bergYaw - 0.2, 0.05, 0.02, 0.8, bergR[2], 0.6, 0.4);
    }
    addMesh(nightSoup.geometry(), slabMat, 'ice-slabs');
    await ctx.yield();
    // the great ridge's piled plates (about the gap; far along the plane the body alone carries it), feet in its body
    const greatSoup = makeSoup(), nGreat = Math.round(2300 * dens);
    for (let k = 0; k < nGreat; k++) {
      const x = gapC + rGreat.range(-640, 640), z = ZC + clamp(rGreat.gauss() * 15, -31, 31), big = rGreat.chance(0.16);
      const hx = rGreat.range(2.2, 6.2) * (big ? 1.5 : 1), hy = rGreat.range(0.35, 1.05) * (big ? 1.7 : 1), hz = rGreat.range(1.6, 4.4) * (big ? 1.3 : 1);
      const yaw = rGreat.range(0, 6.283), tilt = rGreat.range(0.2, 0.85) * rGreat.sign(), tz = rGreat.range(-0.4, 0.4), g = rGreat.range(0.5, 1), rnd = rGreat();
      // in the gap the plates are small and lie nearly flat, so that the eye of the ice run sees through it
      const sg = smoothstep(5, 20, crestH(x)), sc = 0.42 + 0.58 * sg, tl = tilt * (0.3 + 0.7 * sg);
      tryBox(greatSoup, 'great', x, greatH(x, z) + Math.abs(Math.sin(tl)) * hz * sc * 0.6 - 0.3, z, hx * sc, hy * sc, hz * sc, yaw, tl, tz * (0.3 + 0.7 * sg), g, rnd, 0.62 + 0.38 * ((rnd * 13.7) % 1), 0.7);
      if (k % 400 === 399) await ctx.yield();
    }
    addMesh(greatSoup.geometry(), slabMat, 'great-slabs');
    await ctx.yield();
    // the last floes on the warm water between the ridge and the harbour front (it lies only some 50 m beyond the
    // ridge's foot): thick, a pale shelf awash round each (aTint.x = 2 marks the shelf)
    const floeSoup = makeSoup(), nFloe = Math.round(300 * dens);
    for (let k = 0; k < nFloe; k++) {
      const t = Math.pow(rFloe(), 1.7), x = gapC + rFloe.gauss() * 190, hx = rFloe.range(2.5, 9) * (1 - 0.4 * t), hz = rFloe.range(2, 7) * (1 - 0.4 * t), yaw = rFloe.range(0, 6.283), rnd = rFloe();
      const z = ZC - 38 - t * 46;
      if (tryBox(floeSoup, 'floe', x, 0.2, z, hx, 0.55, hz, yaw, 0, 0, 0.75, rnd, 0.93, 0.5)) tryBox(floeSoup, 'shelf', x, -0.03, z, hx + 1.5, 0.1, hz + 1.5, yaw, 0, 0, 2, rnd, 1, 0.5, true);
    }
    addMesh(floeSoup.geometry(), slabMat, 'day-floes');
    await ctx.yield();
    // ---------- gulls over the warm water between the ridge and the harbour front: each wheels on its own level circle
    // by the clock (a body in motion: its whole circle, its bob and its wings stand CLEAR of the flown line)
    const gullList = [], gC = [], gP = [], gL = [];
    // one bird in its own frame (x across, z ahead), as triangles: body, then for each side the inner panel (two) and the outer (one)
    const WING = [[0, 0, 0.33], [-0.07, 0, 0.04], [0.07, 0, 0.04], [-0.07, 0, 0.04], [0, 0, -0.3], [0.07, 0, 0.04]];
    for (const sd of [-1, 1]) WING.push([0.04 * sd, 0, 0.2], [0.04 * sd, 0, -0.17], [0.42 * sd, 0, 0.17], [0.04 * sd, 0, -0.17], [0.42 * sd, 0, -0.1], [0.42 * sd, 0, 0.17], [0.42 * sd, 0, 0.17], [0.42 * sd, 0, -0.1], [0.8 * sd, 0, -0.13]);
    const addGull = (x, y, z, r, ph, sp, bob) => {
      gullList.push({ x, y, z, r });
      const bank = Math.min(Math.atan(sp * sp / (9.8 * r)), 0.6);   // the bank of a level turn at that speed and radius, held to 34 degrees
      for (const w of WING) { gC.push(x, y, z); gP.push(r, ph, sp, bob); gL.push(w[0], bank, w[2]); }
    };
    for (let k = 0; k < 54; k++) {
      const x = gapC + rGull.gauss() * 150, y = rGull.range(5, 24), z = rGull.range(-498, -482), r = rGull.range(5, 14), ph = rGull.range(0, 6.283), sp = rGull.range(7, 11) * rGull.sign(), bob = rGull.range(0, 6.283);
      if (routeDist(x, y, z, 80) - r - 1.9 < CLEAR + 1.5) continue;   // 1.9 m: what a gull reaches from its circle's line with its wings, their beat, its bank and its bob
      addGull(x, y, z, r, ph, sp, bob);
    }
    // ---------- the birds carried on into the town, so that the day side lives all the way to the ring: loose flocks by
    // rule. (a) Every tower of the town has its flock by its own height: one gull to every TOWER_M metres of tower, the
    // same for every tower; of every three, two wheel close round it at every height from just over the roofs to above
    // the lens and one soars wide of it; (b) two parties of 3 to 5 to every 10 m of the line that has roof or quay under
    // it, from the mouth to the ring: one beside or over the line, one low over the roofs under it (none over the
    // basin's water, which has its own flock); (c) a flock low over the basin's water. Every circle keeps 7 m from the
    // flown line over its whole course (its bob, bank and wings reach 1.9 m of that), stands clear of every tower and
    // domed hall by the part's anchors, and flies 3.5 m or more over the highest roof or palm under its course (the
    // town's bodies as built, read once here by place: every triangle of the part but its towers, laid by its bounds
    // into cells of 4 m, each read with its eight neighbours).
    const NEARG = 7, mMouth = metreAtZ(CITY_Z), nMouthG = gullList.length;
    const HC = 4, HX0 = -150, HZ0 = CITY_Z - 380, HNX = 128, HNZ = 110, roofMap = new Float32Array(HNX * HNZ);
    {
      const v = new THREE.Vector3(), m4 = new THREE.Matrix4(), box = new THREE.Box3(), meshes = [];
      scene.updateMatrixWorld(true);
      hero.object.traverse((m) => { if (m.isMesh && m.geometry && m.name !== 'towers') meshes.push(m); });
      const mark = (x0, x1, z0, z1, y) => {
        if (x1 < HX0 || z1 < HZ0 || x0 > HX0 + HNX * HC || z0 > HZ0 + HNZ * HC) return;
        const a0 = Math.max(Math.floor((x0 - HX0) / HC), 0), a1 = Math.min(Math.floor((x1 - HX0) / HC), HNX - 1), b0 = Math.max(Math.floor((z0 - HZ0) / HC), 0), b1 = Math.min(Math.floor((z1 - HZ0) / HC), HNZ - 1);
        for (let i = a0; i <= a1; i++) for (let j = b0; j <= b1; j++) if (y > roofMap[i + j * HNX]) roofMap[i + j * HNX] = y;
      };
      for (const m of meshes) {
        if (m.isInstancedMesh) {   // each instance by its box (a palm with its whole crown)
          if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          for (let k = 0; k < m.count; k++) { m.getMatrixAt(k, m4); m4.premultiply(m.matrixWorld); box.copy(m.geometry.boundingBox).applyMatrix4(m4); mark(box.min.x, box.max.x, box.min.z, box.max.z, box.max.y); }
        } else {
          const pos = m.geometry.attributes.position, ix = m.geometry.index, wp = new Float32Array(pos.count * 3);
          for (let k = 0; k < pos.count; k++) { v.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld); wp[k * 3] = v.x; wp[k * 3 + 1] = v.y; wp[k * 3 + 2] = v.z; }
          const nt = (ix ? ix.count : pos.count) / 3;
          for (let k = 0; k < nt; k++) {
            const a = (ix ? ix.getX(k * 3) : k * 3) * 3, b = (ix ? ix.getX(k * 3 + 1) : k * 3 + 1) * 3, c = (ix ? ix.getX(k * 3 + 2) : k * 3 + 2) * 3;
            mark(Math.min(wp[a], wp[b], wp[c]), Math.max(wp[a], wp[b], wp[c]), Math.min(wp[a + 2], wp[b + 2], wp[c + 2]), Math.max(wp[a + 2], wp[b + 2], wp[c + 2]), Math.max(wp[a + 1], wp[b + 1], wp[c + 1]));
            if (k % 40000 === 39999) await ctx.yield();
          }
        }
        await ctx.yield();
      }
    }
    // the highest roof under a level circle (every 3 m of it, with the cells round each place); outside the read ground: 31 m
    const roofAt = (x, z) => {
      const i = Math.floor((x - HX0) / HC), j = Math.floor((z - HZ0) / HC); if (i < 1 || j < 1 || i > HNX - 2 || j > HNZ - 2) return 31;
      let h = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) h = Math.max(h, roofMap[i + a + (j + b) * HNX]); return h;
    };
    const roofUnder = (x, z, r) => { const n = Math.max(8, Math.ceil(6.283 * r / 3)); let h = 0; for (let k = 0; k < n; k++) { const a = k / n * 6.283; h = Math.max(h, roofAt(x + Math.cos(a) * r, z + Math.sin(a) * r)); } return h; };
    const ringDist = (x, y, z, r) => {
      let best = 1e9;
      for (let i = 0; i <= RN; i++) {
        const dz = route[i * 3 + 2] - z; if (dz > r + 40 || dz < -r - 40) continue;
        const dx = route[i * 3] - x, q = Math.sqrt(dx * dx + dz * dz) - r, dy = route[i * 3 + 1] - y, d = q * q + dy * dy; if (d < best) best = d;
      }
      return Math.sqrt(best);
    };
    const lineNear = (x, z) => { let best = 1e9, at = mMouth; for (let i = Math.max(mMouth - 40, 0); i <= RN; i++) { const dx = route[i * 3] - x, dz = route[i * 3 + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; at = i; } } return [Math.sqrt(best), at]; };
    const freeOf = (x, y, z, r) => {
      for (const t of anchors.towers) if (y - 3 < t.h && Math.abs(Math.hypot(x - t.x, z - t.z - CITY_Z) - r) < t.r + 2.6) return false;
      for (const t of anchors.domes) if (y - 3 < t.h && Math.abs(Math.hypot(x - t.x, z - t.z - CITY_Z) - r) < Math.max(t.r, (t.half ?? t.r) * 1.45) + 2.6) return false;
      return true;
    };
    let nTowerG = 0, nOverG = 0, nLowG = 0, nBasinG = 0, nT = 0;
    const TOWER_M = 1, towerDice = Math.ceil(hero.height / TOWER_M);   // metres of tower to a gull; the dice of the tallest thing the part can hold
    for (const t of anchors.towers) {
      const tx = t.x, tz = t.z + CITY_Z, at = lineNear(tx, tz)[1], turn = rTowerG.sign(), ly = route[at * 3 + 1];
      const n = Math.round(t.h / TOWER_M);
      for (let k = 0; k < towerDice; k++) {   // every tower draws the same dice, tall or short
        // two of every three: wheeling close round the tower at any height; the third: soaring wide of it, 9.5 m or more over the line's own height there
        const wide = k % 3 === 2, u1 = rTowerG(), u2 = rTowerG(), ph = rTowerG.range(0, 6.283), sp = rTowerG.range(7, 11) * (rTowerG.chance(0.8) ? turn : -turn), bob = rTowerG.range(0, 6.283);
        const R = wide ? t.r + 12 + u1 * 18 : t.r + 2.6 + Math.pow(u1, 1.3) * 13, lift = wide ? 9.5 + u2 * 14 : -9 + u2 * 24;
        if (k >= n) continue;
        const y = Math.max(ly + lift, roofUnder(tx, tz, R) + 3.5);
        if (y > t.h + 6 || ringDist(tx, y, tz, R) < NEARG || !freeOf(tx, y, tz, R)) continue;
        addGull(tx, y, tz, R, ph, sp, bob); nTowerG++;
      }
      if (++nT % 8 === 0) await ctx.yield();
    }
    await ctx.yield();
    // the basin is the part's oval of 120 m by 85 m about its centre: the line has roof or quay under it where it is not over that water
    const overBasin = (x, z) => { const bx = (x - anchors.basinCentre[0]) / 120, bz = (z - CITY_Z - anchors.basinCentre[2]) / 85; return bx * bx + bz * bz < 1; };
    let landM = 0;
    for (let m = mMouth + 12; m < RN - 30; m++) {
      if (overBasin(route[m * 3], route[m * 3 + 2]) || ++landM % 10 !== 0) continue;
      const side = rPartyG.sign(), over = rPartyG.chance(0.5), r = rPartyG.range(5, 10), o1 = rPartyG.range(0, 8), up = rPartyG.range(7.5, 14), dy0 = rPartyG.range(-5, 6), turn = rPartyG.sign(), many = 3 + Math.floor(rPartyG() * 3);
      const ax = route[(m + 1) * 3] - route[(m - 1) * 3], az = route[(m + 1) * 3 + 2] - route[(m - 1) * 3 + 2], al = Math.hypot(ax, az) || 1;
      const off = (over ? o1 : r + NEARG + o1) * side, x = route[m * 3] - az / al * off, z = route[m * 3 + 2] + ax / al * off;
      const y = Math.max(route[m * 3 + 1] + (over ? up : dy0), roofUnder(x, z, r + 1) + 3.5);
      for (let k = 0; k < 5; k++) {
        const ph = rPartyG.range(0, 6.283), sp = rPartyG.range(7, 11) * turn, bob = rPartyG.range(0, 6.283), dy = rPartyG.range(0, 2.4), dr = rPartyG.range(-1, 1);
        if (k >= many || ringDist(x, y + dy, z, r + dr) < NEARG || !freeOf(x, y + dy, z, r + dr)) continue;
        addGull(x, y + dy, z, r + dr, ph, sp, bob); nOverG++;
      }
      // the low party: its circle under the line, no higher than 7 m below it
      const r2 = rPartyG.range(5, 10), o2 = rPartyG.range(-6, 6), down = rPartyG.range(7.5, 15), turn2 = rPartyG.sign(), many2 = 3 + Math.floor(rPartyG() * 3);
      const x2 = route[m * 3] - az / al * o2, z2 = route[m * 3 + 2] + ax / al * o2, y2 = Math.max(route[m * 3 + 1] - down, roofUnder(x2, z2, r2 + 1) + 3.5);
      for (let k = 0; k < 5; k++) {
        const ph = rPartyG.range(0, 6.283), sp = rPartyG.range(7, 11) * turn2, bob = rPartyG.range(0, 6.283), dy = rPartyG.range(0, 2), dr = rPartyG.range(-1, 1);
        if (k >= many2 || y2 + dy > route[m * 3 + 1] - NEARG || ringDist(x2, y2 + dy, z2, r2 + dr) < NEARG || !freeOf(x2, y2 + dy, z2, r2 + dr)) continue;
        addGull(x2, y2 + dy, z2, r2 + dr, ph, sp, bob); nLowG++;
      }
    }
    // a circle of radius r is over the basin's water when it lies 12 m inside the oval
    const inBasin = (x, z, r) => { const bx = (x - anchors.basinCentre[0]) / Math.max(120 - r - 12, 1), bz = (z - CITY_Z - anchors.basinCentre[2]) / Math.max(85 - r - 12, 1); return bx * bx + bz * bz < 1; };
    for (let k = 0; k < 36; k++) {
      const a = rBasinG.range(0, 6.283), q = Math.sqrt(rBasinG()), r = rBasinG.range(6, 15), y = rBasinG.range(6, 26), ph = rBasinG.range(0, 6.283), sp = rBasinG.range(7, 11) * rBasinG.sign(), bob = rBasinG.range(0, 6.283);
      const x = anchors.basinCentre[0] + Math.cos(a) * q * 100, z = CITY_Z + anchors.basinCentre[2] + Math.sin(a) * q * 68;
      if (!inBasin(x, z, r) || y < roofUnder(x, z, r) + 3.5 || ringDist(x, y, z, r) < NEARG) continue;
      addGull(x, y, z, r, ph, sp, bob); nBasinG++;
    }
    counts.gulls = { mouth: nMouthG, towers: nTowerG, overhead: nOverG, low: nLowG, basin: nBasinG };
    const gullGeo = new THREE.BufferGeometry();
    gullGeo.setAttribute('position', new THREE.Float32BufferAttribute(gC, 3)); gullGeo.setAttribute('aP', new THREE.Float32BufferAttribute(gP, 4)); gullGeo.setAttribute('aL', new THREE.Float32BufferAttribute(gL, 3));
    const gulls = new THREE.Mesh(gullGeo, shader({ vertexShader: GULL_VERT, fragmentShader: GULL_FRAG, side: THREE.DoubleSide }));
    gulls.frustumCulled = false; gulls.name = 'gulls'; scene.add(gulls);
    // ---------- the gaze: the city in the thin place during the ice run (the route's own line heads there too). One
    // look, at the city's own centre as the part gives it (hero.center: a point in the air 30 m over the basin's water,
    // 10 m short of the north quay's edge). Four of its edges stand at places of the world. It comes in through the bend into
    // the lane: from the end of the level entry straight to the lane's mouth, where the ice walls begin. It lets go
    // through the great ridge: from the ridge's south foot to its north foot the look point slides from the city to the
    // flown line's own point AHEAD metres beyond the north foot, and at the north foot the look ends. The fifth edge
    // stands at no place: the engine gives a look one ramp for both its ends, so the weight begins to fall the bend's
    // length before the north foot, inside the slide.
    const L = path.length, uAt = (m) => clamp(m / L, 0, 1), AHEAD = 30;   // AHEAD: how far along the line the eye looks (m)
    const mLook = metreAtZ(ENTRY_Z - RUNIN), mFootS = metreAtZ(ZC + GREAT), mFootN = metreAtZ(ZC - GREAT);
    const cityLook = hero.center.clone().add(hero.object.position), lineLook = path.posAtDist(Math.min(mFootN + AHEAD, L), new THREE.Vector3()), lookPoint = new THREE.Vector3();
    const eye = new THREE.Vector3(), fwd = new THREE.Vector3();
    const world = {
      scene, path, duration: 42,
      camera: { fov: 62, near: 0.3, far: 5600, lookAhead: AHEAD, sway: 0.6, bank: 0.5 },
      pois: [{ at: (time, u) => lookPoint.lerpVectors(cityLook, lineLook, smoothstep(uAt(mFootS), uAt(mFootN), u)), from: uAt(mLook), to: uAt(mFootN), weight: 0.45, fade: (mL0 - mLook) / (mFootN - mLook) }],
      portal: { shape: 'circle', radius: 9, color: '#c8ffe6', glow: 1.8, revealDistance: 200 },
      post: { exposure: 1.0, bloom: { strength: 0.45, radius: 0.7, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#040a18', vignette: 0.3, grain: 0.02, aberration: 0 } },
      counts,
      // for the crew's counts in node (no picture): the flown line at every metre and what stands where
      probe: { route, RN, plainH, greatH, crestH, ridgeZ, gapX, gapC, entry: [EX, 9, ENTRY_Z], soups: { night: nightSoup.pos, great: greatSoup.pos, floes: floeSoup.pos }, anchors, ground, wallH, lane: [mL0, mL1], cityZ: CITY_Z, gulls: gullList,
        look: { sunDeg: +(sunEl * 180 / Math.PI).toFixed(1), greenBlue: +greenBlue.toFixed(2), pink: +pink.toFixed(2), violet: +violet.toFixed(2), auroraK: +auroraK.toFixed(2), rare: !!vary.rare, dens: +dens.toFixed(2) } },
      update(dt, time, camera) {
        U.uTime.value = time;
        ocean.update(dt, time, camera);
        hero.update(dt, time, camera);
        // the one shadow map lies over the town, nearest the eye (a level of detail by where the eye is)
        eye.setFromMatrixPosition(camera.matrixWorld); fwd.set(0, 0, -1).transformDirection(camera.matrixWorld);
        const t = sunLight.target.position.copy(eye).addScaledVector(fwd, SR * 0.6), q = (SR * 2 / 2048) * 8;
        t.set(Math.round(clamp(t.x, -300, 380) / q) * q, 10, Math.round(clamp(t.z, CITY_Z - 300, CITY_Z + 30) / q) * q);
        sunLight.position.copy(t).addScaledVector(sun, 520);
      },
      dispose() { hero.dispose?.(); },
    };
    return world;
  },
};
