// THE STUDY AT MOUSE HEIGHT: the hero set piece (the oil lamp and the empty green bottle on the chart) and the
// room's own light law, which every surface of the world shades with (the world imports it from here).
// One room, two flames and the night, each a standing thing written from where it stands:
//   the LAMP (a point light; the table top shades everything below it; its own font shades a ring round its foot),
//   the FIRE (a point light low in the hearth; the pierced fender and the legs of the furniture shade the floor),
//   the NIGHT at the two windows (a blue light on what faces a window, falling off with the distance from it, and a
//   deep blue share on the whole room), and the MOON's bar through the east light (soft-edged, parted by the light's
//   stone and bars, shaded by the table top and the standing things).
// Nothing here reads the eye's place except for the gloss on a surface and the depth of the bottle's glass seen through.
import * as THREE from 'three';

const TAU = Math.PI * 2;
export const NOCC = 20;

// ---------------------------------------------------------------- GLSL: noise
export const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x),mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x),mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.3); a*=.5; } return s; }
float fbm3(vec3 p){ float a=.5, s=0.; for(int i=0;i<3;i++){ s+=a*vn3(p); p=p*2.03+vec3(17.1,9.3,4.7); a*=.5; } return s; }
`;

// ---------------------------------------------------------------- GLSL: the light law
// fret(q): the fender's pierced pattern, q = (metres along the fender, metres up); negative inside a hole.
export const GLSL_LIGHT = /* glsl */`
uniform float uTime, uTableY, uLampR, uFireR, uBounce, uNightAll, uNightR, uGreenR; uniform vec4 uBounceK; uniform vec2 uWinX; uniform vec3 uWinS, uWinE;
uniform vec3 uGreenA, uGreenB, uGreenCol, uBase, uAxisH; uniform vec4 uFan;
uniform vec3 uLampPos, uLampCol, uFirePos, uFireCol, uHemiSky, uHemiGnd, uNight, uMoonDir, uMoonCol;
uniform vec4 uTable, uFender, uWin, uSheet, uFont;
uniform float uRain, uLampFar, uFireFar; uniform vec2 uFarR; uniform vec4 uMantel;
uniform vec3 uAir;
uniform vec4 uSkyWin, uGlobe, uGlobePost, uFireLow; uniform vec3 uSkyCol; uniform vec2 uSkyZ; uniform float uSkyR;
uniform vec4 uOccF[${NOCC}];
uniform vec4 uOccL[${NOCC}];
uniform vec4 uMoth[3];
float fret(vec2 q){
  float cz=(fract(q.x/3.2)-.5)*3.2, cz2=(fract(q.x/3.2+.5)-.5)*3.2;
  float dy=q.y-clamp(q.y,3.,7.);
  float d=length(vec2(cz,dy))-.8;
  d=min(d,length(vec2(cz2,q.y-5.))-.5);
  d=min(d,length(vec2(cz2,q.y-7.4))-.3);
  d=min(d,length(vec2(cz2,q.y-2.6))-.3);
  return d;
}
// a standing post (centre o.xy in x,z; radius o.z; top o.w) between the point P and the light L: 1 = clear
float post(vec3 P, vec3 L, vec4 o){
  vec2 a=P.xz, b=L.xz-P.xz; float bb=max(dot(b,b),1e-4);
  float t=clamp(dot(o.xy-a,b)/bb,0.,1.);
  float d=length(a+b*t-o.xy), along=t*sqrt(bb);
  float y=mix(P.y,L.y,t);
  float pen=.25*o.z+.03*along;
  float s=smoothstep(o.z-pen,o.z+pen,d);
  s=max(s,smoothstep(o.w-.6,o.w+.6,y));
  return mix(1.,s,smoothstep(o.z*.6,o.z*1.2,along));
}
float lampVis(vec3 P){
  float v=1.;
  if(P.y<uTableY-.2){
    float t=clamp((uTableY-uLampPos.y)/min(P.y-uLampPos.y,-1e-3),0.,1.);
    vec2 x=uLampPos.xz+t*(P.xz-uLampPos.xz);
    vec2 q=max(vec2(uTable.x-x.x,uTable.z-x.y),vec2(x.x-uTable.y,x.y-uTable.w));
    float sd=max(q.x,q.y), w=max(3.*t,.2);
    v=smoothstep(-w,w,sd);
  }
  // the lamp's own font shades a ring round its foot (uFont: axis x,z; the shade's radius on the table; soft width)
  if(P.y<uLampPos.y-4.){
    float k=(uLampPos.y-P.y)/max(uLampPos.y-uTableY,1.);
    float r=length(P.xz-uFont.xy);
    v*=smoothstep(uFont.z*k-uFont.w*k,uFont.z*k+uFont.w*k,r);
  }
  #ifdef OCC_LAMP
  for(int i=0;i<${NOCC};i++){ vec4 o=uOccL[i]; if(o.z>0.) v*=post(P,uLampPos,o); }
  #endif
  // what flies round the flame (uMoth: place and radius) throws its shadow away from the flame, growing with distance
  vec3 la=P-uLampPos; float laa=max(dot(la,la),1e-3);
  for(int i=0;i<3;i++){ vec4 m=uMoth[i]; if(m.w>0.){ vec3 mb=m.xyz-uLampPos; float s=clamp(dot(mb,la)/laa,0.,1.);
    v*=1.-.8*(1.-smoothstep(m.w*.45,m.w*1.5,length(mb-la*s)))*step(.01,s); } }
  return v;
}
float fenderT(vec3 P, vec3 F){
  float dx=P.x-F.x; if(dx<uFender.x-F.x+.4) return 1.;
  float t=(uFender.x-F.x)/max(dx,1e-3);
  vec3 c=F+(P-F)*t;
  if(c.z<uFender.y||c.z>uFender.z||c.y>uFender.w+.5||c.y<0.) return 1.;
  float open=smoothstep(-.12,.3,-fret(vec2(c.z-uFender.y,c.y)));
  open=mix(open,.3,clamp((P.x-uFender.x)/70.,0.,1.));
  return max(open,smoothstep(uFender.w-.4,uFender.w+.5,c.y));
}
float fireVis(vec3 P){
  float v=.6*fenderT(P,uFirePos)+.4*fenderT(P,uFirePos+vec3(0.,16.,0.));
  // under the hanging sheet (uSheet: x of its foot, x of the table's edge, z0, z1) the fire does not reach
  float s=clamp((P.x-uSheet.x)/max(uSheet.y-uSheet.x,1.),0.,1.);
  float hs=uTableY*(.7*s+.3*s*s);
  float under=step(uSheet.x,P.x)*step(uSheet.z,P.z)*step(P.z,uSheet.w)*(1.-smoothstep(hs-1.2,hs-.2,P.y));
  under=max(under,step(uSheet.y,P.x)*step(uTable.z,P.z)*step(P.z,uTable.w)*step(P.x,uTable.y)*(1.-smoothstep(uTableY-4.,uTableY-3.,P.y))*.8);
  v*=1.-.92*under;
  // THE MANTEL'S SHADE (uMantel: the shelf's front edge in x, its height, its two ends in z): the fire burns under the
  // shelf, so whatever lies above it on the wall's side of that edge stands in the shelf's shade (3 m of half shade at
  // its front edge; 30 m of it to either side of the shelf's two ends, for the fire is 40 m long)
  if(P.y>uMantel.y){ vec3 c=uFirePos+(P-uFirePos)*((uMantel.y-uFirePos.y)/(P.y-uFirePos.y));
    v*=1.-.95*(1.-smoothstep(uMantel.x-3.,uMantel.x+3.,c.x))*smoothstep(uMantel.z-30.,uMantel.z+30.,c.z)*(1.-smoothstep(uMantel.w-30.,uMantel.w+30.,c.z)); }
  #ifdef OCC_FIRE
  for(int i=0;i<${NOCC};i++){ vec4 o=uOccF[i]; if(o.z>0.) v*=post(P,uFirePos,o); }
  #endif
  return v;
}
// THE MOON'S LIGHT at P: what comes in at the east light, through the wall's whole thickness (the opening at the wall's
// inner face uWinX.x and at its outer face uWinX.y; uWin: its two jambs in z, its sill and its head), less the shade of its
// two stone mullions and its glazing bars (soft, and softer the further the light has come: no hard edge lies in the room),
// of the table top on what lies under it, and of the room's standing things (the same posts the flames' light knows)
float moonVis(vec3 P){
  float t=(uWinX.x-P.x)/max(uMoonDir.x,1e-3), t2=(uWinX.y-P.x)/max(uMoonDir.x,1e-3);
  vec3 c=P+uMoonDir*t, c2=P+uMoonDir*t2;
  vec2 e=vec2(2.5+.03*t);
  vec2 m=smoothstep(uWin.xz-e,uWin.xz+e,c.zy)*(1.-smoothstep(uWin.yw-e,uWin.yw+e,c.zy));
  vec2 m2=smoothstep(uWin.xz-e,uWin.xz+e,c2.zy)*(1.-smoothstep(uWin.yw-e,uWin.yw+e,c2.zy));
  float v=m.x*m.y*m2.x*m2.y*step(0.,t);
  if(v<.002) return 0.;
  float ww=uWin.y-uWin.x, hh=uWin.w-uWin.z, w=.6+.02*t;
  float mul=abs(abs(c.z-(uWin.x+uWin.y)*.5)-ww/6.)-4.;
  float bars=min(abs(fract((c.z-uWin.x)/(ww/9.)+.5)-.5)*ww/9.-.5,abs(fract((c.y-uWin.z)/(hh/6.)+.5)-.5)*hh/6.-.5);
  v*=mix(.12,1.,smoothstep(-w,w,mul))*mix(.5,1.,smoothstep(-w,w,bars));
  if(P.y<uTableY-.2){ float s=(uTableY-P.y)/max(uMoonDir.y,1e-3); vec2 x=P.xz+uMoonDir.xz*s;
    vec2 q=max(vec2(uTable.x-x.x,uTable.z-x.y),vec2(x.x-uTable.y,x.y-uTable.w)); float ws=1.+.03*s; v*=smoothstep(-ws,ws,max(q.x,q.y)); }
  vec3 Lm=P+uMoonDir*400.;
  #ifdef OCC_FIRE
  for(int i=0;i<${NOCC};i++){ vec4 o=uOccF[i]; if(o.z>0.) v*=post(P,Lm,o); }
  #endif
  #ifdef OCC_LAMP
  for(int i=0;i<${NOCC};i++){ vec4 o=uOccL[i]; if(o.z>0.) v*=post(P,Lm,o); }
  #endif
  // rain outside: the shade of its falling threads crawls in the moon's bar (written in the window's own plane)
  float col=floor(c.z/2.2), hc=h21(vec2(col,4.1));
  float run=fract(c.y*.021+uTime*(.11+.16*hc)+hc*9.);
  float thread=(1.-smoothstep(.15,.5,abs(fract(c.z/2.2)-.5)))*smoothstep(0.,.08,run)*(1.-smoothstep(.12,.6,run));
  return v*(1.-uRain*.5*thread);
}
// THE SKY AT THE OPEN SOUTH LIGHT (uSkyWin: its two jambs in x, its sill and its head; uSkyZ: the wall's inner and outer
// face). The open light has no glass: the night sky's own cold light comes in at it and lies on what stands before it, the
// stone seat, the boards, the globe and the wall beside it. skyAim: the place of the opening a point takes it from (the
// nearest place of the opening's middle third: a tall soft light, not a point). skyAt: how much comes to P: it falls with the
// distance from the opening's nearest place, a light of that corner and not of the room (the square of the room's own
// fall-off, half of its half at uSkyR, the light's own breadth; nearer than half that breadth nothing has more of it, for
// the opening is as broad as that itself), and it leaves the opening into the room, so what hangs or
// stands along the window wall beside it has little of it and what stands out before it has much; what stands in the wall's own depth
// stands in the open night; THE GLOBE (uGlobe: its ball's middle and radius; uGlobePost: its stand) THROWS ITS SHADE away
// from the light, a long soft one, on the boards and the wall behind it.
vec3 skyAim(vec3 P){ vec2 th=vec2(uSkyWin.y-uSkyWin.x,uSkyWin.w-uSkyWin.z)/3.;
  return vec3(clamp(P.x,uSkyWin.x+th.x,uSkyWin.y-th.x),clamp(P.y,uSkyWin.z+th.y,uSkyWin.w-th.y),uSkyZ.x); }
float skyAt(vec3 P, vec3 A){
  vec3 nq=vec3(clamp(P.x,uSkyWin.x,uSkyWin.y),clamp(P.y,uSkyWin.z,uSkyWin.w),uSkyZ.x)-P;
  float fall=1./(1.+max(dot(nq,nq)/(uSkyR*uSkyR),.25)), v=fall*fall*clamp((uSkyZ.x-P.z)/max(length(A-P),1e-3),0.,1.);
  if(v<.002) return 0.;
  vec3 d=A-P; float dd=max(dot(d,d),1e-3), t=clamp(dot(uGlobe.xyz-P,d)/dd,0.,1.), along=t*sqrt(dd);
  float miss=length(P+d*t-uGlobe.xyz), pen=.1*uGlobe.w+.05*along;
  v*=mix(1.,smoothstep(uGlobe.w-pen,uGlobe.w+pen,miss),smoothstep(uGlobe.w*.4,uGlobe.w*1.3,along));
  return v*post(P,A,uGlobePost);
}
vec3 roomEnv(vec3 R, vec3 P){
  float up=smoothstep(-.25,.6,R.y);
  vec3 c=mix(uHemiGnd*.9+uFireCol*.01, uHemiSky*.9+uLampCol*.03, up);
  return c*vec3(1.12,.94,.72)*min(uBounce,.7)*(.5+.5*vn(R.xz*3.+R.y*2.));
}
// THE BOTTLE'S GREEN IS THE LAMP'S LIGHT COME THROUGH THE GLASS, by three laws of place (all green there is in the room):
//  (1) the glass's own glow on what stands close by it: a long light on the body's axis (uGreenA to uGreenB), half at the
//      body's radius (uGreenR) from the axis and gone by twice that (it falls by the fourth power: the wall behind the
//      bottle, two radii and more off, stays dark wood);
//  (2) THE BOTTLE'S SHADE IS GREEN: where the straight from the flame to a place goes through the body, the place is lit by
//      the lamp's own fall-off, green (so it lies on the chart and on what stands beyond the bottle from the lamp, and
//      never on the wall behind the lamp and the bottle);
//  (3) THE GREEN FAN: the thick base is a lens and throws the light out before it, along the axis toward the room: half
//      strength uFan.x metres before the base, as wide as the ring (uFan.z) at the base and opening by uFan.y to either
//      hand, lying near the table (it is a beam: as high as it is wide), with a net of bright lines that move on the
//      world's clock (two nets of cells whose middles wander; a line is where two cells meet). uFan.w: its strength.
//      It is spent between twice and four times that half distance: it lies on the table and what stands before it, and
//      never reaches the room's far walls.
float fanNet(vec2 p, float t){ vec2 i=floor(p), f=fract(p); float d1=9., d2=9.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h21(i+g),h21(i+g+7.7)); o=.5+.4*sin(t+6.2832*o);
    float d=length(g+o-f); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
  return d2-d1; }
vec3 greenAt(vec3 P, vec3 N, float dl){
  vec3 ga=uGreenB-uGreenA; float gl=max(length(ga),1e-3); vec3 gd=ga/gl;
  float tg=clamp(dot(P-uGreenA,gd),0.,gl); vec3 Lg=uGreenA+gd*tg-P; float dg=length(Lg); Lg/=max(dg,1e-3);
  float gq=dg*dg/(uGreenR*uGreenR), g=(1./(1.+gq*gq))*clamp((dot(N,Lg)+.5)/1.5,0.,1.)*.5;
  // (2) the nearest approach of the straight flame-to-place to the body's axis
  vec3 rd=(P-uLampPos)/max(dl,1e-3), w0=uLampPos-uGreenA; float b=dot(rd,gd), d0=dot(rd,w0), e0=dot(gd,w0);
  float sc=clamp((b*e0-d0)/max(1.-b*b,1e-3),0.,dl), tc=clamp(e0+b*sc,0.,gl); sc=clamp(dot(uGreenA+gd*tc-uLampPos,rd),0.,dl);
  float miss=length(uLampPos+rd*sc-(uGreenA+gd*tc));
  float thru=(1.-smoothstep(uGreenR*.65,uGreenR*1.1,miss))*smoothstep(uGreenR*.6,uGreenR*1.6,dl-sc);
  g+=thru*clamp((dot(N,-rd)+.35)/1.35,0.,1.)*1.6/(1.+dl*dl/(uLampR*uLampR*6.));
  // (3) the fan before the base
  vec3 q=P-uBase; float s=-dot(q,uAxisH), y=q.x*uAxisH.z-q.z*uAxisH.x, w=uFan.z+uFan.y*max(s,0.);
  float along=smoothstep(0.,5.,s)/(1.+s*s/(uFan.x*uFan.x))*(1.-smoothstep(2.*uFan.x,4.*uFan.x,s)), lat=1.-smoothstep(.5,1.,abs(y)/w), high=1.-smoothstep(.2,.5,abs(q.y)/w);
  float fan=along*lat*high, fg=0.;
  if(fan>.004){ vec3 Lb=normalize(uBase-P); float fl=length(uLampCol)/3.2, t=uTime*1.1+(fl-1.)*8.;
    vec2 pn=vec2(s*.085+.2*sin(y*.21+uTime*.7),y/w*4.2+.25*sin(s*.17-uTime*.5));
    float n1=1.-smoothstep(.02,.17,fanNet(pn,t)), n2=1.-smoothstep(.02,.22,fanNet(pn*1.9+3.1,t*1.3+1.));
    fg=uFan.w*fan*(.3+1.7*n1+.7*n2)*clamp((dot(N,Lb)+.75)/1.75,0.,1.); }
  // (the thrown light keeps the glass's green: less red and blue than the glow)
  return uGreenCol*(g+fg*vec3(.42,1.,.6));
}
// THE TABLE STANDS IN THE LOW GLOW'S WAY: the fire's low glow skims the boards, and the great table with the sheet that
// hangs from its edge to the floor stands across it; lowVis: how much of the glow comes to P past the table (the length of
// the straight way from the fire to P that lies under the table's top, in plan: none of it, all the glow; forty metres of
// it, none)
float lowVis(vec3 P){
  vec2 o=uFirePos.xz, d=P.xz-o; d+=step(abs(d),vec2(1e-4))*2e-4;
  vec2 ta=(uTable.xz-o)/d, tb=(uTable.yw-o)/d;
  float tn=max(min(ta.x,tb.x),min(ta.y,tb.y)), tf=min(max(ta.x,tb.x),max(ta.y,tb.y));
  return 1.-smoothstep(0.,40.,max(min(tf,1.)-max(tn,0.),0.)*length(d));
}
vec3 shade(vec3 P, vec3 N, vec3 V, vec3 alb, float gloss, float metal, float wrap){
  vec3 Ll=uLampPos-P; float dl=length(Ll); Ll/=max(dl,1e-3);
  // the lamp: a pool that falls off by the square of the distance (half at uLampR), and round it a wider, fainter glow
  // (uLampFar of it, half at uFarR.x); the fire the same
  float al=1./(1.+dl*dl/(uLampR*uLampR))+uLampFar/(1.+dl*dl/(uFarR.x*uFarR.x));
  float vl=lampVis(P);
  // the chimney's open top throws a brighter, wavering cone straight up: on the wall behind, the shelves and across the beams
  float upc=dot(-Ll,vec3(0.,1.,0.));
  al*=1.+1.1*smoothstep(.8+.01*sin(uTime*5.3),.96,upc);
  vec3 Lf=uFirePos+vec3(0.,6.,0.)-P; float df=length(Lf); Lf/=max(df,1e-3);
  float af=1./(1.+df*df/(uFireR*uFireR))+uFireFar/(1.+df*df/(uFarR.y*uFarR.y));
  // THE FAR FIRE ALONG THE BOARDS (uFireLow: its strength; the distance at which it has grown to half; its reach; its height):
  // the fire burns low, and what it throws out under its lintel skims the floor: far from the hearth, where the pool has
  // died, a long low warm glow lies on the boards and on what stands low (it is nothing near the hearth, where the pool is,
// and grows fast as the light comes to skim, half of it at uFireLow.y; it falls slowly
  // with the distance, is half at uFireLow.w above the boards and little higher, and the table stands in its way)
  float ql=df*df/(uFireLow.y*uFireLow.y);
  af+=uFireLow.x*(ql*ql/(1.+ql*ql))/(1.+df/uFireLow.z)/(1.+P.y*P.y/(uFireLow.w*uFireLow.w))*lowVis(P);
  float vf=fireVis(P);
  float nl=clamp((dot(N,Ll)+wrap)/(1.+wrap),0.,1.);
  float nf=clamp((dot(N,Lf)+wrap+.15)/(1.15+wrap),0.,1.);
  // away from the flames: deep warm umber, a little more of it near what the flames light (their bounce), never nothing
  float nearL=1./(1.+dl*dl/(uBounceK.y*uBounceK.y)), nearF=1./(1.+df*df/(uBounceK.w*uBounceK.w));
  // (the shade between the pools: a deep brown that no place is without, uBounceK.x; and the lamp's bounce off the table top)
  vec3 amb=mix(uHemiGnd,uHemiSky,N.y*.5+.5)*(uBounceK.x+uBounce*.3*nearL)+uFireCol*uBounceK.z*nearF;
  // the dark under the table and under the hanging sheet
  vec2 qt=max(vec2(uTable.x-P.x,uTable.z-P.z),vec2(P.x-uTable.y,P.z-uTable.w));
  amb*=1.-.6*(1.-smoothstep(-8.,4.,max(qt.x,qt.y)))*(1.-smoothstep(uTableY-6.,uTableY-2.,P.y));
  // THE NIGHT, the room's second colour: each of the two windows (uWinS: the south light's middle, uWinE: the east light's)
  // is a soft blue light on what faces it, half at uNightR metres from it; and everywhere a deep blue that the night lays on
  // the whole room, least where the lamp's pool is (uNightAll)
  vec3 vs=uWinS-P, ve=uWinE-P; float ds=length(vs), de=length(ve); vs/=max(ds,1e-3); ve/=max(de,1e-3);
  float wS=1./(1.+ds*ds/(uNightR*uNightR)), wE=1./(1.+de*de/(uNightR*uNightR));
  vec3 night=uNight*(wS*clamp(dot(N,vs)*.75+.25,0.,1.)+wE*clamp(dot(N,ve)*.75+.25,0.,1.)+uNightAll*(.6+.4*N.y)*(1.-.9*nearL));
  // (the blue rim: what an edge turned toward a window catches of it)
  float rimN=wS*clamp(dot(N,vs)+.5,0.,1.)+wE*clamp(dot(N,ve)+.5,0.,1.);
  float nm=clamp(dot(N,uMoonDir),0.,1.);
  vec3 moon=uMoonCol*nm*moonVis(P);
  vec3 lamp=uLampCol*al*vl, fire=uFireCol*af*vf;
  vec3 green=greenAt(P,N,dl);
  // the open south light's sky: on what is turned to it; in the wall's own depth the open night on every face
  vec3 As=skyAim(P), Ls=normalize(As-P);
  vec3 sky=uSkyCol*skyAt(P,As);
  float nsk=clamp((dot(N,Ls)+wrap)/(1.+wrap),0.,1.);
  vec3 open=uSkyCol*(1.-smoothstep(-2.,8.,uSkyZ.x-P.z))*step(uSkyWin.x-8.,P.x)*step(P.x,uSkyWin.y+8.)*step(uSkyWin.z-6.,P.y)*step(P.y,uSkyWin.w+3.)*(.33+.3*clamp(N.z,0.,1.)+.17*N.y);
  vec3 col=alb*(1.-metal)*(amb+lamp*nl+fire*nf+night+moon+green+sky*nsk+open);
  vec3 F0=mix(vec3(.04),alb,metal);
  float sh=mix(6.,220.,gloss*gloss), sk=(.04+gloss*gloss*2.6);
  float ndv=clamp(dot(N,V),0.,1.), fr=pow(1.-ndv,5.);
  // every edge turned toward a light catches a rim of it
  float rimv=(1.-ndv)*(1.-ndv)*(1.-ndv);
  col+=mix(alb,vec3(1.),.35)*rimv*(.3*(lamp*clamp(dot(N,Ll)+.45,0.,1.)+fire*1.3*clamp(dot(N,Lf)+.45,0.,1.)+moon*.5)+uNight*rimN*1.5);
  vec3 Hl=normalize(Ll+V+vec3(0.,1e-4,0.)), Hf=normalize(Lf+V+vec3(0.,1e-4,0.));
  float sl=pow(clamp(dot(N,Hl),0.,1.),sh)*sk*step(0.,dot(N,Ll)), sf=pow(clamp(dot(N,Hf),0.,1.),sh*.55)*sk*step(0.,dot(N,Lf));
  vec3 R=reflect(-V,N);
  // (the sky's own gleam on what is glossy: brass, wax, glass)
  vec3 Hs=normalize(Ls+V+vec3(0.,1e-4,0.)); float ssk=pow(clamp(dot(N,Hs),0.,1.),sh*.3)*sk*step(0.,dot(N,Ls));
  col+=mix(F0,vec3(1.),fr*.6*gloss)*(lamp*sl+fire*sf*1.4+(night+moon)*gloss*.6+green*(.3+.4*metal)+sky*(ssk+.25*metal)+open*.3*metal);
  vec3 env=roomEnv(R,P)+lamp*.7*pow(clamp(dot(R,Ll),0.,1.),10.)+fire*.9*pow(clamp(dot(R,Lf),0.,1.),5.);
  col+=mix(F0,vec3(1.),fr*gloss)*env*(metal*.9+.25*gloss+fr*gloss*.5);
  return col;
}
// the lamp's smoke in the air: what the two flames light of the haze between the eye E and the point P (each flame's light
// summed along the sight by its fall-off; uAir: the lamp's and the fire's strength, and the softening radius in metres)
vec3 airlight(vec3 E, vec3 P){
  vec3 d=P-E; float T=length(d); d/=max(T,1e-3);
  vec3 ql=uLampPos-E; float bl=dot(ql,d), hl=sqrt(max(dot(ql,ql)-bl*bl,0.)+uAir.z*uAir.z);
  vec3 qf=uFirePos+vec3(0.,8.,0.)-E; float bf=dot(qf,d), hf=sqrt(max(dot(qf,qf)-bf*bf,0.)+4.*uAir.z*uAir.z);
  float il=(atan((T-bl)/hl)-atan(-bl/hl))/hl, jf=(atan((T-bf)/hf)-atan(-bf/hf))/hf;
  return uLampCol*uAir.x*il+uFireCol*uAir.y*jf;
}
`;

// ---------------------------------------------------------------- the library every material of the room is made with
const VERT = (o) => /* glsl */`
#ifdef HAS_G
attribute vec3 aG;
#endif
varying vec3 vW, vN, vC, vG; varying vec2 vUv;
uniform float uTime;
#include <fog_pars_vertex>
${o.vpars || ''}
void main(){
  vec3 p=position, n=normal;
  vUv=uv;
  #ifdef USE_COLOR
  vC=color;
  #else
  vC=vec3(1.);
  #endif
  #ifdef HAS_G
  vG=aG;
  #else
  vG=position;
  #endif
  ${o.vert || ''}
  #ifdef USE_INSTANCING
  vec4 w=modelMatrix*instanceMatrix*vec4(p,1.); vec3 wn=mat3(modelMatrix)*mat3(instanceMatrix)*n;
  #ifdef USE_INSTANCING_COLOR
  vC*=instanceColor;
  #endif
  #else
  vec4 w=modelMatrix*vec4(p,1.); vec3 wn=mat3(modelMatrix)*n;
  #endif
  ${o.vworld || ''}
  vW=w.xyz; vN=wn/max(length(wn),1e-5);
  vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG = (o) => /* glsl */`
varying vec3 vW, vN, vC, vG; varying vec2 vUv;
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
${o.pars || ''}
void main(){
  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
  vec3 V=normalize(cameraPosition-vW);
  vec3 alb=vC, emis=vec3(0.); float gloss=.15, metal=0., alpha=1., wrap=.25;
  ${o.surface || ''}
  vec3 col=shade(vW,N,V,alb,gloss,metal,wrap)+emis;
  ${o.post || ''}
  gl_FragColor=vec4(col,alpha);
  #include <fog_fragment>
  gl_FragColor.rgb+=airlight(cameraPosition,vW);
}`;

export function flickerAt(time) {
  const lamp = 1 + 0.018 * Math.sin(TAU * 7.1 * time) + 0.012 * Math.sin(TAU * 9.7 * time + 2.1) + 0.055 * Math.sin(TAU * 0.4 * time);
  const fire = 1 + 0.11 * Math.sin(TAU * 0.71 * time) + 0.07 * Math.sin(TAU * 1.93 * time + 1.2) + 0.05 * Math.sin(TAU * 3.37 * time + 4.0);
  return { lamp, fire };
}

// makeLib(o): the shared uniforms of the light law and a factory for materials that shade with it.
// o: { lamp:[x,y,z], lampColor, lampGain, fire:[x,y,z], fireColor, fireGain, table:[x0,x1,z0,z1], tableY, ... } in world metres.
export function makeLib(o = {}) {
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]), lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
  const lampAt = v3(o.lamp || [0, 13, 0]), fireAt = v3(o.fire || [-400, 14, 300]);
  const lampCol = lin(o.lampColor || '#F2B24C', o.lampGain ?? 3.2), fireCol = lin(o.fireColor || '#D9541E', o.fireGain ?? 0);
  const occ = () => Array.from({ length: NOCC }, () => new THREE.Vector4(0, 0, 0, 0));
  const u = {
    uTime: { value: 0 },
    uLampPos: { value: lampAt.clone() }, uLampCol: { value: lampCol.clone() }, uLampR: { value: o.lampReach ?? 95 },
    uFirePos: { value: fireAt.clone() }, uFireCol: { value: fireCol.clone() }, uFireR: { value: o.fireReach ?? 75 },
    uTable: { value: new THREE.Vector4(...(o.table || [0, 0, 0, 0])) }, uTableY: { value: o.tableY ?? -1e4 },
    uFender: { value: new THREE.Vector4(...(o.fender || [-1e4, 0, 0, 0])) },
    uSheet: { value: new THREE.Vector4(...(o.sheet || [1e4, 1e4 + 1, 0, 0])) },
    uFont: { value: new THREE.Vector4(lampAt.x, lampAt.z, o.fontShade ?? 9.8, 2.2) },
    uWin: { value: new THREE.Vector4(...(o.win || [0, 0, 0, 0])) }, uWinX: { value: new THREE.Vector2(...(o.winX || [1e4, 1e4])) }, uWinS: { value: v3(o.winS || [0, 1e4, 0]) }, uWinE: { value: v3(o.winE || [0, 1e4, 0]) }, uNightR: { value: o.nightReach ?? 100 },
    uNightAll: { value: o.nightAll ?? 0 },
    uGreenA: { value: v3(o.greenA || [0, -1e4, 0]) }, uGreenB: { value: v3(o.greenB || [1, -1e4, 0]) }, uGreenCol: { value: new THREE.Vector3(0, 0, 0) }, uGreenR: { value: o.greenReach ?? 12 }, uBase: { value: v3(o.greenBase || [0, -1e4, 0]) }, uAxisH: { value: v3(o.greenAxis || [1, 0, 0]) }, uFan: { value: new THREE.Vector4(...(o.greenFan || [60, 0.6, 8, 0])) },
    uHemiSky: { value: lin(o.hemiSky || '#6A4526') }, uHemiGnd: { value: lin(o.hemiGround || '#24160E') }, uBounce: { value: o.bounce ?? 0.9 }, uBounceK: { value: new THREE.Vector4(o.bounceFloor ?? 0.12, o.bounceNear ?? 90, o.fireBounce ?? 0.045, o.fireNear ?? 70) },
    uNight: { value: lin(o.night || '#2B3A5E', o.nightGain ?? 0) },
    uMoonDir: { value: v3(o.moonDir || [0, 0.6, 0.8]).normalize() }, uMoonCol: { value: lin(o.moonColor || '#AEB9D6', o.moonGain ?? 0) }, uRain: { value: o.rain ? 1 : 0 },
    uMantel: { value: new THREE.Vector4(...(o.mantel || [-1e5, 1e5, 0, 0])) }, uLampFar: { value: o.lampFar ?? 0.06 }, uFireFar: { value: o.fireFar ?? 0.1 }, uFarR: { value: new THREE.Vector2(o.lampFarReach ?? 260, o.fireFarReach ?? 220) }, uAir: { value: new THREE.Vector3(o.airLamp ?? 0, o.airFire ?? 0, o.airSoft ?? 6) },
    uSkyWin: { value: new THREE.Vector4(...(o.sky || [0, 1, 1e4, 1e4 + 1])) }, uSkyZ: { value: new THREE.Vector2(...(o.skyZ || [1e4, 1e4 + 1])) }, uSkyCol: { value: lin(o.skyColor || '#9DB8F0', o.skyGain ?? 0) }, uSkyR: { value: o.skyReach ?? 70 },
    uGlobe: { value: new THREE.Vector4(...(o.globe || [0, -1e4, 0, 1])) }, uGlobePost: { value: new THREE.Vector4(...(o.globePost || [0, 0, 0, 0])) }, uFireLow: { value: new THREE.Vector4(...(o.fireLow || [0, 100, 100, 80])) },
    uOccF: { value: occ() }, uOccL: { value: occ() }, uMoth: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
  };
  const base = { lampAt, fireAt, lampCol, fireCol };
  let nF = 0, nL = 0;
  const lib = {
    u, base,
    addOccF(x, z, r, top) { if (nF < NOCC) u.uOccF.value[nF++].set(x, z, r, top); },
    addOccL(x, z, r, top) { if (nL < NOCC) u.uOccL.value[nL++].set(x, z, r, top); },
    // one material: s.surface is GLSL that may set alb, gloss, metal, emis, alpha, wrap and N
    mat(s = {}) {
      const defines = { ...(s.defines || {}) };
      if (s.occF) defines.OCC_FIRE = 1;
      if (s.occL) defines.OCC_LAMP = 1;
      if (s.grain) defines.HAS_G = 1;
      const m = new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...u, ...(s.uniforms || {}) },
        defines, fog: true, vertexShader: VERT(s), fragmentShader: FRAG(s),
        side: s.side ?? THREE.FrontSide, vertexColors: s.vertexColors === true,
        transparent: s.transparent === true, depthWrite: s.depthWrite !== false,
      });
      if (s.blending !== undefined) m.blending = s.blending;
      if (s.name) m.name = s.name;
      return m;
    },
    // the flames' waver for this clock: the lights' strength and a small sway of their places (so shadows sway)
    setTime(time) {
      const f = flickerAt(time);
      // on ember nights the bed breathes with the draught: its light swells and sinks by a fifth, slowly
      f.fire += (o.fireBreath ?? 0) * Math.sin(TAU * 0.27 * time + 0.8);
      u.uTime.value = time;
      u.uLampCol.value.copy(base.lampCol).multiplyScalar(f.lamp);
      u.uFireCol.value.copy(base.fireCol).multiplyScalar(f.fire);
      u.uLampPos.value.set(base.lampAt.x + 0.22 * Math.sin(time * 2.3) + 0.1 * Math.sin(time * 7.9), base.lampAt.y + 0.3 * (f.lamp - 1) * 8, base.lampAt.z + 0.18 * Math.sin(time * 1.7 + 1));
      u.uFirePos.value.set(base.fireAt.x, base.fireAt.y + 2.2 * (f.fire - 1) * 6, base.fireAt.z + 3.0 * Math.sin(time * 0.83) + 1.4 * Math.sin(time * 2.1 + 0.7));
      return f;
    },
  };
  return lib;
}

// ---------------------------------------------------------------- surfaces every wooden, brass and stone thing shares
export const SURF = {
  // wood: grain runs along the piece's own y (aG holds the piece's own metres); uGrain scales it, uWoodGloss its polish
  wood: /* glsl */`{ vec3 q=vG*uGrain; float w=fbm(vec2(q.x+q.z*1.7,q.y*.11));
    float lines=vn(vec2((q.x+q.z*1.3)*5.+w*6.,q.y*.22)); float pore=vn(vec2((q.x-q.z)*21.,q.y*1.1));
    float knot=smoothstep(.78,.9,vn(vec2(q.x*.45+3.,q.y*.07+q.z*.4)));
    alb=mix(alb,vec3(dot(alb,vec3(.4,.4,.2))),.3)*mix(.72,1.08,lines)*(.9+.2*pore)*(.82+.36*w)*(1.-.45*knot); gloss=uWoodGloss*(.6+.6*lines); }`,
  brass: /* glsl */`{ float w=fbm(vG.xy*.9+vG.z*.7); float sc=vn(vec2(vG.y*14.,vG.x*.6+vG.z*.6));
    metal=1.; gloss=.5+.32*w; alb*=(.78+.4*w)*(.94+.12*sc); }`,
  iron: /* glsl */`{ float w=fbm(vG.xy*1.7+vG.z); metal=.85; gloss=.25+.2*w; alb*=.7+.5*w; }`,
  stone: /* glsl */`{
    // the fine part of the stone (its speckle, the mason's pits, the drag of the chisel) is faded by its own width in the
    // picture: where one picture point covers a sixth of a metre of stone and more it is gone, and the face is calm
    float px=length(fwidth(vW)), fine=1.-smoothstep(.04,.16,px);
    float w=fbm(vW.xz*.11+vW.y*.13), sp=mix(.5,vn3(vW*1.9),fine); alb*=(.74+.45*w)*(.86+.28*sp); gloss=.08;
    // the mason's tooling: shallow pits and a faint drag of the chisel, so that raking light models the face
    float pit=smoothstep(.62,.8,vn3(vW*.9+3.))*fine; alb*=1.-.3*pit;
    N=normalize(N+((vec3(vn3(vW*1.3),vn3(vW*1.3+5.),vn3(vW*1.3+9.))-.5)*.3+vec3(.08*sin((vW.x+vW.z*.3)*5.),0.,0.))*fine); }`,
  plaster: /* glsl */`{ float w=fbm(vW.xy*.035+vW.z*.03), sp=vn3(vW*.9); alb*=(.82+.3*w)*(.95+.1*sp); gloss=.04; }`,
};
export const WOOD_PARS = 'uniform float uGrain, uWoodGloss;';

// ---------------------------------------------------------------- geometry helpers
export const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
export const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 1e-4), p[1])), seg);
export const tube = (pts, r, seg = 24, rad = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), seg, r, rad, false);

// Merges pieces into one geometry with position, normal, uv, color (a tint, linear) and aG (the piece's own metres,
// for wood grain: the grain runs along the piece's own y unless o.g names another axis).
export function makeBuilder() {
  const P = [], Nn = [], U = [], C = [], G = [], I = [];
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(), col = new THREE.Color(), sc = new THREE.Vector3(), q = new THREE.Quaternion(), tr = new THREE.Vector3();
  const b = {
    add(geo, m = null, c = '#ffffff', o = {}) {
      const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, n0 = P.length / 3;
      if (typeof c === 'string') col.set(c); else col.setRGB(c[0], c[1], c[2]);
      if (m) { nm.getNormalMatrix(m); m.decompose(tr, q, sc); } else sc.set(1, 1, 1);
      const gs = o.gs ?? 1, ax = o.g || 'y';
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i) * sc.x * gs, ly = pos.getY(i) * sc.y * gs, lz = pos.getZ(i) * sc.z * gs;
        if (ax === 'x') G.push(ly, lx, lz); else if (ax === 'z') G.push(lx, lz, ly); else G.push(lx, ly, lz);
        v.fromBufferAttribute(pos, i); if (m) v.applyMatrix4(m); P.push(v.x, v.y, v.z);
        v.fromBufferAttribute(nor, i); if (m) v.applyMatrix3(nm).normalize(); Nn.push(v.x, v.y, v.z);
        U.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
        const k = o.shade ? o.shade(pos.getX(i), pos.getY(i), pos.getZ(i)) : 1;
        C.push(col.r * k, col.g * k, col.b * k);
      }
      if (geo.index) { const ix = geo.index; for (let i = 0; i < ix.count; i++) I.push(n0 + ix.getX(i)); } else for (let i = 0; i < pos.count; i++) I.push(n0 + i);
      geo.dispose();
      return b;
    },
    get triangles() { return I.length / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aG', new THREE.Float32BufferAttribute(G, 3)); g.setIndex(I);
      g.computeBoundingSphere();
      return g;
    },
  };
  return b;
}

// ---------------------------------------------------------------- the hero: THE LAMP AND THE BOTTLE ON THE CHART
// Origin: on the table top under the centre of the bottle's base ring. +Z points out of the base, back along the
// coming route; the bottle lies along -Z. The bottle lies aslant on the table, so the lamp stands before the base plane and
// to one side: opts.lampAt = [x, z] in this frame (the world gives it from the room's measures; alone, the part has it
// 28.5 m to the -X side and 7.8 m before the base plane). opts.length: the glass from base plane to lip, 26 to 28 m.
// opts.paper = [x0, x1, z0, z1]: the sheet the bottle lies on, in the world's metres (the bottle's light is paint on it).
const FLAME_Y = 13, BOTTLE_Y = 8, GREEN = '#6FA98A';
export async function buildHero(ctx, opts = {}) {
  const object = new THREE.Group(); object.name = 'lamp-and-bottle';
  const LAMP_AT = [opts.lampAt ? opts.lampAt[0] : -28.5, 0, opts.lampAt ? opts.lampAt[1] : 7.8], BL = opts.length ?? 27.5, GROW = opts.grow ?? 1;
  // THE BOTTLE, ITS RING, ITS CORK, ITS CRADLE AND ITS LIGHT ON THE CHART are built at their first size in a frame of their own
  // (big), which stands on the table under the base's centre and is GROW times life: so they grow in one measure about the
  // base, the cradle's feet stay on the table and the axis stands GROW * BOTTLE_Y over it. The lamp is not in that frame;
  // where the bottle's surfaces ask where the flame is, they are told in their own frame's metres (the flame's place over GROW)
  const big = new THREE.Group(); big.name = 'bottle-in-cradle'; big.scale.setScalar(GROW); object.add(big);
  const lib = opts.lib || makeLib({ lamp: [LAMP_AT[0], FLAME_Y, LAMP_AT[2]], lampGain: 3.2, bounce: 1.6 });
  const pal = opts.palette || {};
  const brassHex = pal.brass || '#C9A04A';
  const [lx, , lz] = LAMP_AT;

  // ---- the lamp: font, collar, wick wheel (brass, one mesh)
  const bb = makeBuilder();
  bb.add(lathe([[0, 0], [5.3, 0], [5.7, 0.25], [5.7, 0.8], [5.1, 1.1], [4.3, 1.5], [4.2, 1.9], [4.7, 2.4], [5.7, 3.3], [6.0, 4.2], [5.9, 5.0], [5.3, 6.0], [4.0, 6.9], [2.9, 7.5], [2.5, 8.0]], 64), M4(lx, 0, lz), brassHex);
  bb.add(lathe([[2.5, 8.0], [2.9, 8.15], [2.95, 8.5], [2.7, 8.7], [2.7, 9.6], [3.05, 9.8], [3.05, 10.1], [2.6, 10.3], [1.2, 10.4], [0.0, 10.4]], 48), M4(lx, 0, lz), brassHex, { shade: () => 0.92 });
  bb.add(new THREE.BoxGeometry(1.9, 1.2, 0.5), M4(lx, 10.9, lz), brassHex, { shade: () => 0.8 });
  bb.add(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 10), M4(lx + 4.0, 9.2, lz, 0, 0, Math.PI / 2), brassHex);
  bb.add(lathe([[0, -0.25], [1.0, -0.25], [1.1, -0.1], [1.1, 0.1], [1.0, 0.25], [0, 0.25]], 20), M4(lx + 5.6, 9.2, lz, 0, 0, Math.PI / 2), brassHex);
  const brassMat = lib.mat({ name: 'hero-brass', vertexColors: true, grain: true, surface: SURF.brass + /* glsl */`
    { float a=atan(vG.z,vG.x); float pierce=(1.-smoothstep(.2,.3,length(vec2(fract(a*14./6.2832)-.5,(vG.y-9.15)*.9))))*step(8.7,vG.y)*step(vG.y,9.6);
      alb*=1.-.85*pierce; emis+=uLampCol*.35*pierce;
      // the font stands in its own burner's shade (the collar, 3 m in radius 3 m under the flame, shades out to 8.9 m at the
      // font's widest): the flame does not reach it; it shows by the lit table's light from below and by the fire
      float inShade=1.-smoothstep(7.4,8.6,vG.y); emis+=alb*uLampCol*.12*inShade*clamp(.55-.45*N.y,0.,1.); alb*=1.-.5*inShade; }` });
  const lampMesh = new THREE.Mesh(bb.build(), brassMat); lampMesh.name = 'lamp-brass'; object.add(lampMesh);
  await ctx.yield();

  // ---- the chimney: clear glass, sooted at the top, glowing where the flame is
  const chim = lathe([[2.5, 8.2], [2.85, 9.6], [3.15, 11.4], [3.0, 13.4], [2.45, 15.6], [1.9, 18.2], [1.6, 21.5], [1.5, 26]], 48);
  chim.translate(lx, 0, lz);
  const chimMat = lib.mat({ name: 'hero-chimney', transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uFlameY: { value: FLAME_Y } }, pars: 'uniform float uFlameY;',
    surface: /* glsl */`{ float ndv=clamp(abs(dot(N,V)),0.,1.), fr=pow(1.-ndv,2.2);
      float dyf=(vG.y-uFlameY)/3.2; float gy=exp(-dyf*dyf);
      float soot=smoothstep(21.,26.,vG.y)*(.5+.5*vn(vec2(atan(vN.z,vN.x)*3.,vG.y*.8)));
      vec3 R=reflect(-V,N); float streak=pow(clamp(dot(normalize(R*vec3(1.,.15,1.)),normalize(vec3(.3,0.,1.))),0.,1.),24.);
      alb=mix(vec3(.9,.85,.7),vec3(.05,.035,.02),soot); gloss=.9; wrap=.6;
      emis=uLampCol*(.16*gy+.5*gy*fr)+vec3(.8,.75,.6)*streak*.35;
      alpha=clamp(.05+.5*fr+.55*soot+.3*streak+.12*gy,0.,.9); }` });
  const chimMesh = new THREE.Mesh(chim, chimMat); chimMesh.name = 'lamp-chimney'; chimMesh.renderOrder = 4; object.add(chimMesh);

  // ---- the flame (a flat-wick flame 3 m tall, a sheet that turns about its own place) and its soft glow
  const flameU = { uC: { value: new THREE.Vector3(lx, FLAME_Y - 1.5, lz) }, uSz: { value: new THREE.Vector2(2.0, 3.0) }, uKind: { value: 0 }, uTime: lib.u.uTime, uLampCol: lib.u.uLampCol };
  const flameVS = /* glsl */`uniform vec3 uC; uniform vec2 uSz; uniform float uTime, uKind; varying vec2 vP;
    void main(){ vec4 wc=modelMatrix*vec4(uC,1.); vec3 up=normalize(mat3(modelMatrix)*vec3(0.,1.,0.)); vec3 toCam=normalize(cameraPosition-wc.xyz);
      vec3 right=normalize(cross(up,toCam)+vec3(1e-5,0.,0.)); vec3 upv=mix(up,normalize(cross(toCam,right)),uKind);
      float lean=(.16*sin(uTime*2.3)+.07*sin(uTime*7.9))*(1.-uKind);
      float tall=1.+(.09*sin(uTime*3.1+.6)+.06*sin(uTime*11.3))*(1.-uKind);
      vec2 q=position.xy; vP=vec2(q.x*2.,q.y);
      float yy=q.y-.5*uKind;
      vec3 wp=wc.xyz+right*(q.x*uSz.x+lean*q.y*q.y*uSz.y)+upv*yy*uSz.y*tall;
      gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.); }`;
  const flameFS = /* glsl */`uniform float uTime, uKind; uniform vec3 uLampCol; varying vec2 vP;
    void main(){ vec3 col; 
      if(uKind<.5){ float y=clamp(vP.y,0.,1.); float w=1.75*pow(y,.38)*pow(1.-y,.7)+.02; float d=abs(vP.x+.22*y*y*sin(uTime*9.1+y*7.))/w;
        float body=1.-smoothstep(.45,1.,d); float core=(1.-smoothstep(0.,.7,d))*smoothstep(.04,.3,y)*(1.-smoothstep(.55,.95,y));
        col=mix(vec3(1.,.42,.06)*2.2,vec3(1.,.86,.52)*6.,core)*body;
        col=mix(col,vec3(.12,.25,1.)*1.6*body,(1.-smoothstep(.03,.2,y))*.9); }
      else { float r=length(vec2(vP.x,(vP.y-.5)*2.)); float g=1.-smoothstep(0.,1.,r); col=uLampCol*(.055*g*g+.03*g); }
      gl_FragColor=vec4(col,1.); }`;
  const quad = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(lx, FLAME_Y, lz), 16); return g; };
  const flameMat = new THREE.ShaderMaterial({ uniforms: flameU, vertexShader: flameVS, fragmentShader: flameFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const flame = new THREE.Mesh(quad(), flameMat); flame.name = 'lamp-flame'; flame.renderOrder = 2; object.add(flame);
  const glowMat = new THREE.ShaderMaterial({ uniforms: { ...flameU, uC: { value: new THREE.Vector3(lx, FLAME_Y, lz) }, uSz: { value: new THREE.Vector2(22, 22) }, uKind: { value: 1 } }, vertexShader: flameVS, fragmentShader: flameFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const glow = new THREE.Mesh(quad(), glowMat); glow.name = 'lamp-glow'; glow.renderOrder = 5; object.add(glow);
  await ctx.yield();

  // ---- THE BOTTLE: a thick base ring with a bright rolled edge at the base plane (z 0), the body, the shoulder, a long neck and
  // the lip behind it, BL metres of glass. Thick green glass WITH LIGHT IN IT: the lamp lights the wall turned to it and, through
  // the glass, the wall turned from it; the outline is darker (glass seen edge-on); seeds and a few striae; a soft clouded green
  // within that hides its depth. NOTHING is built inside it and nothing at or before z 0: one skin, drawn opaque.
  const sh0 = BL - 14.3, nk = BL - 8.2;
  const prof = [[5.0, 1.4], [5.0, 0.4], [5.07, 0.16], [5.26, 0.03], [5.5, 0.05], [5.72, 0.2], [5.84, 0.48], [5.8, 0.8], [5.7, 1.05], [5.7, sh0], [5.62, sh0 + 1], [5.3, sh0 + 2.1], [4.6, sh0 + 3.3], [3.6, sh0 + 4.4], [2.7, sh0 + 5.3],
    [2.1, nk], [1.82, nk + 0.9], [1.68, nk + 1.9], [1.62, nk + 3.2], [1.6, BL - 1.9], [1.75, BL - 1.75], [2.2, BL - 1.55], [2.34, BL - 1.2], [2.34, BL - 0.7], [2.2, BL - 0.3], [1.8, BL - 0.08], [1.6, BL]];
  const bottleG = lathe(prof, 72); bottleG.rotateX(-Math.PI / 2); bottleG.translate(0, BOTTLE_Y, 0);
  const gcol = new THREE.Color(GREEN), flameL = new THREE.Vector3(lx / GROW, FLAME_Y / GROW, lz / GROW);
  const bottleMat = lib.mat({ name: 'hero-bottle', side: THREE.DoubleSide,
    uniforms: { uFlameL: { value: flameL }, uGreen: { value: new THREE.Vector3(gcol.r, gcol.g, gcol.b) }, uAxisY: { value: BOTTLE_Y }, uBL: { value: BL } },
    vpars: 'varying vec3 vNo, vVo;', vert: 'vNo=n; vVo=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz-p;',
    pars: 'uniform vec3 uFlameL, uGreen; uniform float uAxisY, uBL; varying vec3 vNo, vVo;',
    surface: /* glsl */`{ vec3 pl=vG; float a=-pl.z; vec3 axp=vec3(0.,uAxisY,pl.z);
      // all in the part's own space: rad across the axis, Vo to the eye, Lf to the flame, dv the eye's direction across the axis
      vec3 rad=pl-axp; float rr=length(rad); rad/=max(rr,1e-3);
      vec3 No=normalize(vNo); if(!gl_FrontFacing) No=-No;
      vec3 Vo=normalize(vVo), Lf=normalize(uFlameL-pl);
      vec3 dv=Vo-vec3(0.,0.,Vo.z); dv/=max(length(dv),1e-3);
      float fl=length(uLampCol)/3.2;
      float ndv=clamp(dot(No,Vo),0.,1.), edge=1.-ndv;
      float glass=smoothstep(.9,1.5,a);
      // the wall behind this one, seen through it: its outward normal
      vec3 Nf=rad-2.*dot(rad,dv)*dv;
      // the lamp on the near wall (it soaks in and wraps), on the far wall (showing through), and straight through the bottle
      float nearL=clamp(dot(No,Lf)*.6+.4,0.,1.), farL=clamp(dot(Nf,Lf),0.,1.), back=clamp(dot(-Vo,Lf),0.,1.);
      float lit=.16+.6*nearL*nearL+.5*farL+.9*back*back*back;
      // A SLOW TURNING GREEN MIST within, laid a few metres behind the wall along the sight so that it gives no depth to read:
      // it turns about the bottle's axis once in two minutes and drifts along it; no shape is in it. It has a soft sea light
      // of its own that swells and sinks on the world's clock (two slow swells, 11 and 13.7 s, never a flash)
      float ta=uTime*.052; vec3 pc=pl-Vo*3.5; pc.y-=uAxisY; pc.xy=mat2(cos(ta),-sin(ta),sin(ta),cos(ta))*pc.xy;
      float cloud=fbm3(pc*.21+vec3(3.1,7.7,1.3+uTime*.02)), mist=fbm3(pc*.1+vec3(9.3,2.1,-uTime*.03));
      float swell=.5+.3*sin(uTime*.5712)+.2*sin(uTime*.4586+1.3);
      // seeds (small bubbles) and a few striae drawn round the body
      float seed=smoothstep(.84,.9,vn3(pl*1.9)), ang=atan(rad.y,rad.x);
      float stria=(1.-smoothstep(.0,.035,abs(vn(vec2(ang*1.3+a*.22,a*.55))-.5)))*.5;
      // glass seen edge-on is deeper: the outline darker and thicker
      float thin=1.-smoothstep(.3,.95,edge), outline=smoothstep(.3,.9,edge);
      vec3 clear=vec3(.02,.4,.085), deep=vec3(.003,.05,.016);
      // (the mist's billows are lighter, the lanes between them deeper)
      vec3 body=mix(deep,clear,smoothstep(.1,1.5,lit*(.55+.6*thin)*(.72+.5*cloud)))*(1.-.85*outline)*(.4+.9*smoothstep(.4,.6,mist));
      alb=vec3(.01,.035,.02); gloss=.45; wrap=.1;
      // (a lantern of green glass: the lamp's light in the wall, and the mist's own soft light behind it)
      emis=body*fl*(1.+.3*lit)*glass*(1.+.8*seed-.3*stria);
      emis+=vec3(.0,.3,.17)*(.3+.7*swell)*smoothstep(.3,.8,mist)*glass*(1.-.75*outline)*1.3;
      // WHAT STANDS BEHIND THE GLASS IS SEEN THROUGH IT, BENT BY THE ROUND WALL: the sight is turned toward the axis by the
      // wall's slant where it enters; where the bent sight goes by the lamp's flame, the flame shows, and where it goes by the
      // chimney's upright, a paler column
      { vec3 sd=normalize(-Vo-.12*(No-dot(No,Vo)*Vo)); vec3 fo=uFlameL-pl; float tf=max(dot(fo,sd),0.); vec3 off=fo-sd*tf;
        float fx=length(off.xz), up=-off.y, far=smoothstep(8.,16.,tf)*step(0.,dot(No,Vo));
        float flameI=exp(-fx*fx/20.-up*up/30.), chimI=exp(-fx*fx/40.)*smoothstep(-7.,-3.5,up)*(1.-smoothstep(9.,14.,up));
        // (a green gold lantern: the flame itself a small gold heart, its glow through the glass green gold round it)
        float heart=exp(-fx*fx/2.5-up*up/5.);
        emis+=(vec3(.5,.95,.2)*.95*flameI+vec3(1.,.9,.36)*1.1*heart+vec3(.6,.72,.28)*.4*chimI)*fl*glass*far*(1.-.7*outline); }
      // the lamp's second long highlight: its light thrown back by the inside of the far wall
      vec3 H=normalize(Lf+Vo), Hp=H-vec3(0.,0.,H.z); Hp/=max(length(Hp),1e-3);
      float h2=pow(clamp(dot(-Nf,Hp),0.,1.),420.)*smoothstep(1.2,2.4,a)*(1.-smoothstep(uBL-15.2,uBL-13.6,a));
      emis+=vec3(.95,1.,.55)*fl*.9*h2*(1.-.6*outline);
      // and its first: the flame itself mirrored in the near wall, a long thin line down the body and the neck
      float h1=pow(clamp(dot(No,Hp),0.,1.),700.)*smoothstep(1.2,2.4,a)*step(0.,dot(No,Lf));
      emis+=vec3(1.,.93,.66)*fl*1.2*h1;
      // the lamp come THROUGH the glass: a long gold-green line on the flank turned from the flame, where the ray from the flame
      // through the bottle's axis leaves the glass (placed by the flame and the glass, never by the eye); it slides with the flame
      vec3 ex=vec3(axp.xy-uFlameL.xy,0.); ex/=max(length(ex),1e-3);
      float slide=.25*sin(uTime*2.3)+.1*sin(uTime*7.9);
      float d=acos(clamp(dot(rad,ex),-1.,1.))*5.7+slide*.4;
      float core=(1.-smoothstep(.3,.8,abs(d)))*smoothstep(1.4,2.6,a)*(1.-smoothstep(uBL-15.4,uBL-14.2,a));
      float halo=exp(-abs(d)/3.2)*smoothstep(.9,1.6,a)*(1.-smoothstep(uBL-14.6,uBL-13.2,a));
      emis+=vec3(.7,.85,.25)*.5*fl*core+vec3(.12,.5,.2)*fl*.2*halo;
      // a thin line of it along the neck
      emis+=vec3(1.1,.98,.5)*fl*.7*(1.-smoothstep(.1,.36,abs(d)*rr/5.7))*smoothstep(uBL-8.,uBL-7.,a)*(1.-smoothstep(uBL-2.2,uBL-1.8,a));
      // the base ring's rolled edge is bright all round, with the lamp as a crescent on its arc toward the flame
      vec3 Hc=normalize(Lf+vec3(0.,0.,1.));
      float ring=1.-smoothstep(.55,1.1,a);
      emis+=uGreen*fl*ring*(2.2*pow(clamp(dot(No,Hc),0.,1.),18.)+.5+.34*clamp(dot(rad,-ex),0.,1.)); }` });
  const bottle = new THREE.Mesh(bottleG, bottleMat); bottle.name = 'bottle'; big.add(bottle);
  await ctx.yield();
  // ---- a PALE cork standing out of the lip under a cap of DARK RED sealing wax (plain: no mark), with three runs of the wax
  // down over the cork and the lip onto the neck, as it ran when the bottle stood upright
  const pb = makeBuilder(), wax = '#7a1210', RX = M4(0, BOTTLE_Y, 0, -Math.PI / 2, 0, 0);
  pb.add(new THREE.CylinderGeometry(1.5, 1.5, 4.4, 24), M4(0, BOTTLE_Y, -(BL + 1.2), Math.PI / 2, 0, 0), '#e3cfa2');
  pb.add(lathe([[1.52, BL + 2.5], [1.74, BL + 2.62], [1.76, BL + 3.1], [1.55, BL + 3.5], [0.9, BL + 3.7], [0, BL + 3.75]], 28), RX, wax);
  for (const [ang, len] of [[0.5, 2.6], [2.4, 1.2], [4.3, 3.6]]) {
    const at = (r, a) => [Math.cos(ang) * r, BOTTLE_Y + Math.sin(ang) * r, -a];
    pb.add(tube([at(1.72, BL + 2.75), at(1.62, BL + 1.4), at(1.86, BL + 0.08), at(2.42, BL - 0.6), at(2.36, BL - 1.3), at(1.82, BL - 1.95), at(1.7, BL - 2.2 - len * 0.5), at(1.68, BL - 2.2 - len)], 0.27, 28, 7), null, wax);
    pb.add(new THREE.SphereGeometry(0.4, 10, 8), M4(...at(1.72, BL - 2.2 - len), 0, 0, 0, 1, 1, 1.5), wax);
    await ctx.yield();
  }
  const plainMat = lib.mat({ name: 'hero-plain', vertexColors: true, surface: '{ float sp=vn3(vG*2.3); float wx=step(vC.g,.2); alb*=mix(.8+.35*sp*vn3(vG*9.),.85+.3*sp,wx); gloss=mix(.12,.75,wx); emis=alb*uLampCol*.06; }' });
  const cork = new THREE.Mesh(pb.build(), plainMat); cork.name = 'cork'; big.add(cork);
  await ctx.yield();
  // ---- the walnut cradle: a board with a moulded rail along each side and four bun feet, and two saddles the body lies in,
  // their horns rolled into plain volutes; the wood plain and rounded, all behind the base plane
  const wb = makeBuilder(), s2 = sh0 - 1.4, blen = s2 + 5;
  wb.add(new THREE.BoxGeometry(9, 0.8, blen), M4(0, 0.4, -(1 + blen / 2)), '#4a2a17', { g: 'z' });
  const sh = new THREE.Shape(); sh.moveTo(-6.2, 0); sh.lineTo(6.2, 0); sh.lineTo(6.2, 5.6); sh.lineTo(5.9, 6.0); sh.lineTo(5.41, 6.0);
  sh.absarc(0, BOTTLE_Y, 5.76, -0.354, Math.PI + 0.354, true); sh.lineTo(-5.9, 6.0); sh.lineTo(-6.2, 5.6); sh.lineTo(-6.2, 0);
  await ctx.yield();
  const saddle = new THREE.ExtrudeGeometry(sh, { depth: 1.1, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 3, curveSegments: 28 });
  await ctx.yield();
  wb.add(saddle.clone(), M4(0, 0.6, -4 - 0.55), '#56311b', { g: 'x' });
  await ctx.yield();
  wb.add(saddle, M4(0, 0.6, -s2 - 0.55), '#56311b', { g: 'x' });
  await ctx.yield();
  for (const za of [-4, -s2]) for (const sx of [-1, 1]) wb.add(new THREE.CylinderGeometry(0.95, 0.95, 1.9, 18), M4(sx * 6.05, 6.75, za, Math.PI / 2, 0, 0), '#5c351d');
  for (const sx of [-1, 1]) { wb.add(new THREE.BoxGeometry(0.7, 0.5, blen + 0.6), M4(sx * 4.75, 0.95, -(1 + blen / 2)), '#56311b', { g: 'z' }); for (const zf of [-2.2, -(blen - 0.2)]) wb.add(lathe([[0, 0], [0.9, 0], [1.05, 0.25], [0.8, 0.5], [0, 0.5]], 14), M4(sx * 3.6, 0, zf), '#3e2413'); }
  await ctx.yield();
  const woodMat = lib.mat({ name: 'hero-walnut', vertexColors: true, grain: true, pars: WOOD_PARS, uniforms: { uGrain: { value: 0.55 }, uWoodGloss: { value: 0.5 } }, surface: SURF.wood });
  const cradle = new THREE.Mesh(wb.build(), woodMat); cradle.name = 'cradle'; big.add(cradle);
  await ctx.yield();

  // ---- THE BOTTLE'S OWN LIGHT ON THE CHART (paint on the paper), on the side AWAY from the lamp (+X), and the wash under the
  // glass. It is the bottle's outline as the lamp sees it, thrown on the paper away from the lamp: each point of the paper is
  // joined to the lamp's place; where that line crosses the bottle's axis (the station a0, with the glass's radius r there) the
  // paper is lit from the flank out to THROW radii beyond it (thick glass gathers its light: a bottle's caustic lies close by
  // it). So the body throws a broad light, the shoulder a narrowing one, the neck a thin one, the cork (which is no glass) none:
  // a long green shape in the bottle's own outline, stretched away from the lamp, with a bright gathered line along it and a
  // bright far edge, a net of lines that wavers with the flame. Wholly behind the base plane; it ends at the paper's edge.
  // CAUSTIC: the oval that holds it, for the table's keep-outs (centre x, centre z, half sizes).
  // (found from the same law: every station of the glass, its radius, and the lamp's place)
  const THROW = 3, radAt = (a) => { const ss = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }; const r = 5.7 + (2.05 - 5.7) * ss(sh0 + 0.4, nk + 0.2, a); return r + (1.62 - r) * ss(nk, nk + 2.6, a); };
  const CAUSTIC = (() => { let x1 = 0, z0 = 0, z1 = 0; for (let a = 0; a <= BL; a += 0.5) { const dx = -lx / GROW, dz = -a - lz / GROW, len = Math.hypot(dx, dz), sFar = radAt(a) * (1 + THROW); x1 = Math.max(x1, dx / len * sFar); z0 = Math.min(z0, -a + dz / len * sFar, -a); z1 = Math.max(z1, -a); }
    return [(x1 + 1) / 2, (z0 + z1) / 2 - 0.5, (x1 + 1) / 2, (z1 - z0) / 2 + 1]; })();
  const cg = new THREE.BufferGeometry();
  { const P = [], U = [], K = [], I = [];
    const q = (cx, cz, hx, hz, k) => { const n = P.length / 3; P.push(cx - hx, 0.09, cz - hz, cx + hx, 0.09, cz - hz, cx + hx, 0.09, cz + hz, cx - hx, 0.09, cz + hz); U.push(-1, -1, 1, -1, 1, 1, -1, 1); K.push(k, k, k, k); I.push(n, n + 2, n + 1, n, n + 3, n + 2); };
    q(CAUSTIC[0], CAUSTIC[1], CAUSTIC[2], CAUSTIC[3], 0); q(0, -(sh0 / 2 + 2.5), 6.6, sh0 / 2 + 2, 1);
    cg.boundingSphere = new THREE.Sphere(new THREE.Vector3(CAUSTIC[0], 0, CAUSTIC[1]), Math.hypot(CAUSTIC[2], CAUSTIC[3]) + 2);
    cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); cg.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); cg.setIndex(I); }
  // blending: the paper's own light is kept less (by alpha) where the glass stands between it and the lamp, and the green is added
  const causMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: lib.u.uTime, uLampCol: lib.u.uLampCol, uGreen: { value: new THREE.Vector3(gcol.r, gcol.g, gcol.b) }, uRest: { value: lib.u.uLampCol.value.length() },
      uLampL: { value: new THREE.Vector2(lx / GROW, lz / GROW) }, uBL: { value: BL }, uThrow: { value: THROW }, uPaper: { value: new THREE.Vector4(...(opts.paper || [-1e4, 1e4, -1e4, 1e4])) } }, fog: true,
    vertexShader: /* glsl */`attribute float aK; varying vec2 vUv, vM, vWp; varying float vK;
      #include <fog_pars_vertex>
      void main(){ vUv=uv; vK=aK; vM=position.xz; vWp=(modelMatrix*vec4(position,1.)).xz; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform float uTime, uRest, uBL, uThrow; uniform vec3 uLampCol, uGreen; uniform vec2 uLampL; uniform vec4 uPaper; varying vec2 vUv, vM, vWp; varying float vK;
      // the glass's radius at a station of the axis (a metres behind the base plane): body, shoulder, neck, lip
      float rad(float a){ float sh0=uBL-14.3, nk=uBL-8.2;
        float r=mix(5.7,2.05,smoothstep(sh0+.4,nk+.2,a)); r=mix(r,1.62,smoothstep(nk,nk+2.6,a));
        return r+.7*(smoothstep(uBL-2.,uBL-1.4,a)-smoothstep(uBL-.7,uBL,a)); }
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      float vor(vec2 p, float t){ vec2 i=floor(p), f=fract(p); float d1=9., d2=9.;
        for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h21(i+g),h21(i+g+7.7)); o=.5+.4*sin(t+6.2832*o);
          float d=length(g+o-f); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
        return d2-d1; }
      void main(){ float e=length(vUv); float fl=length(uLampCol)/uRest; float t=uTime*1.5+2.*(fl-1.)*6.;
        vec2 p=vM*vec2(.42,.5); p+=.55*vec2(sin(p.y*1.3+uTime*1.2),cos(p.x*1.1-uTime*.9));
        float n1=1.-smoothstep(.02,.16,vor(p,t)), n2=1.-smoothstep(.02,.2,vor(p*1.9+3.1,t*1.3+1.));
        float net=n1*1.1+n2*.55+.22;
        float m=(1.-smoothstep(.2,1.,e))*.3, sh=0.;
        if(vK<.5){
          // the line from the lamp's place through this point of the paper: where it crosses the axis, and how far beyond
          vec2 dl=vM-uLampL; float k0=clamp(-uLampL.x/max(dl.x,1e-3),0.,1.);
          float a0=-(uLampL.y+k0*dl.y), s=(1.-k0)*length(dl), r=rad(a0), w=(s-r)/(uThrow*r);
          float inA=smoothstep(.3,1.1,a0)*(1.-smoothstep(uBL-.4,uBL,a0));
          float env=smoothstep(-.12,.03,w)*(1.-smoothstep(.9,1.,w));
          float cw=(w-.42-.09*sin(a0*.8+uTime*1.7)-.05*sin(a0*2.1-uTime*2.6))/.1, rw=(w-.9-.03*sin(a0*1.3+uTime*2.1))/.06;
          float core=exp(-min(cw*cw,30.)), rim=exp(-min(rw*rw,30.));
          vec2 pe=min(vWp-uPaper.xz,uPaper.yw-vWp);
          float on=inA*env*smoothstep(0.,1.2,min(pe.x,pe.y));
          m=on*(.3+1.7*net+1.4*core+1.*rim)*(1.-.35*smoothstep(.3,1.,w)); sh=.5*on; }
        // thrown light keeps the glass's green: less red and blue than the glow under the cradle
        gl_FragColor=vec4(uGreen*(vK<.5?vec3(.5,1.,.62):vec3(1.))*m*fl,sh);
        #ifdef FOG_EXP2
        gl_FragColor.rgb*=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
        #endif
      }` });
  const caustic = new THREE.Mesh(cg, causMat); caustic.name = 'caustic'; caustic.renderOrder = 3; big.add(caustic);

  const greenLight = new THREE.Vector3(0.1, 0.9, 0.55).multiplyScalar(opts.greenGain ?? 3);
  const anchors = {
    portalCentre: new THREE.Vector3(0, BOTTLE_Y * GROW, 0), exitDir: new THREE.Vector3(0, 0, -1),
    flame: new THREE.Vector3(lx, FLAME_Y, lz), lampAxis: new THREE.Vector3(lx, 0, lz), causticCentre: new THREE.Vector3(CAUSTIC[0] * GROW, 0, CAUSTIC[1] * GROW), caustic: CAUSTIC.map((v) => v * GROW),
    mothRing: { centre: new THREE.Vector3(lx, 0, lz), radiusMin: 8, radiusMax: 10, yMin: 12, yMax: 22 },
  };
  return {
    object, radius: 58, height: 26, center: new THREE.Vector3(LAMP_AT[0] * 0.5, 9, LAMP_AT[2] * 0.5 - 6), anchors, lib, ground: true, groundY: 0,
    flicker: flickerAt,
    // the bottle's green light on the room swells and sinks with the sea light within (the same two slow swells)
    update(dt, time) { lib.setTime(time); lib.u.uGreenCol.value.copy(greenLight).multiplyScalar(0.72 + 0.28 * (0.5 + 0.3 * Math.sin(time * 0.5712) + 0.2 * Math.sin(time * 0.4586 + 1.3))); },
    dispose() {},
  };
}
