// HERO SET PIECE for "singing-erg": THE CHOIR and its rose window of rainbows.
//
// What it is
//   A sand bowl 640 m across and 80 m deep with seven colossal hexagonal crystal monoliths (200-450 m)
//   standing on its rim in a 220 degree arc that opens toward +Z. The tallest stands dead ahead at -Z, the
//   rest step down to either side like organ pipes; each is a fused bundle (main prism + parallel "pipes" +
//   a rosette of leaning secondary crystals + shards). Each throws a spectral fan across the bowl; the seven
//   fans cross at the centre into a rose window ~420 m wide (spokes on the far side, scalloped petals on the
//   near side, magenta where a red edge meets a violet edge, HDR white where all seven recombine at the
//   origin). Every 3.5 s the bowl floor snaps to a new seven-fold Chladni figure: bright ridges along the
//   nodal lines, a song ripple racing outward, and sand jets leaping from the lines in the colour of the
//   window they stand in. Mirror-winged flyers circle overhead and flash like heliographs.
//   Origin = centre of the bowl floor (the white point, where the portal stands), +Y up, the camera arrives
//   from +Z over the low saddle in the front rim, travelling toward -Z.
//
// Size and cost
//   radius 340 (rim crest at r = 320; with opts.skirt the dune apron reaches r = 560), height ~450-520.
//   ~109k triangles (64k sand, ~20k crystal, 24k jets), 5 draw calls (sand, crystal, jets, light curtains,
//   glints+flyers), no lights, no textures, ~180-330 ms build on the shared software box.
//
// Lighting it expects
//   NONE from the scene: every material is a self-lit ShaderMaterial (linear HDR, scene fog supported) that
//   uses the brief's fixed sun. anchors.sunDir is the hero-local direction TO the sun (55 deg up, 25 deg
//   right of the -Z heading); put the world's sun disc there and light the rest of the world from it with a
//   white key ~1.05 and blue-black ambient (#1A2244 x 1.6, linear) to match my sand exactly.
//   STYLE (how the brief's rule is done): every albedo/emission is black, white or lavender from the palette;
//   saturation comes only from spectral(t), a 7-key red->violet ramp (see GLSL below) used by the fans,
//   grain glints, fracture flares and shadow fringes; palette[6] magenta only where min(red, violet) of two
//   fans overlap. Fans REPLACE the white sunlight on the sand (light = sun*(1-cover) + fan) so they stay
//   saturated on white sand. Shadows are analytic (ray vs. prism per fragment) with fwidth edges: razor sharp.
//
// opts
//   palette       [sky black, shadow, haze blue, lavender, warm white, white, magenta] hex strings
//   sunDir        [x,y,z] hero-local direction to the sun (default from the brief)
//   sunIntensity  1.05     skirt  true: add the dune apron r 320..560 (false: stop at the rim crest and let
//                 the world's own terrain take over; stamp it with anchors.heightAt)
//   beams         0.15 strength of the faint spectral light curtains in the air (0 = off)
//   jets          12000 jet sprites (two triangles each)        flyers 40
//   sparkle       1    glint strength                           gain 1.1 fan brightness
//   floor         1    albedo factor of the bowl floor inside the window (0.5-1); below 1 the fans also keep their
//                      hue where they overlap (white only at the white point) and the nodal lines get a dark seam
//   uniforms.uApproach 0..1 (default 0): the world raises it on the run in; the floor within ~60 m of the white point
//                      brightens and its petals gain saturation.
//   uniforms.uReveal   0..1: 0 = the crystals, their tip glints and light curtains are dark (black glass on a black
//                      sky), 1 = blazing. The world drives it from path progress for the reveal at the crest.
//
// anchors (hero-local space)
//   portalSeat    { position (0,7.6,0), normal (0,0,1), radius 7 }: the 14 m ring stands on the white point,
//                 facing the approach, the tallest monolith directly behind it.
//   flyThrough    ordered points from the saddle crest (z = 330) down the front wall to the portal, 2.5-3 m
//                 above the sand (it is a toboggan run; nothing but sand and additive jets is near it, the
//                 nearest crystal is > 250 m away), straight and nearly level for the last 70 m.
//   crest         where the Choir is revealed (top of the saddle, front rim).   whitePoint (0,0,0)
//   monoliths     [{ position, height, radius, tip, fanDir }] (index 3 is the tallest)   tallest: that one
//   sunDir        Vector3 to the sun.   rimRadius 320, ringRadius 300, windowRadius 210, bowlDepth, saddleHeight
//   heightAt(x,z) sand height of the piece (use it to stamp the world's terrain and to seat creatures)
//   viewpoints    a few good camera positions (look at `center`).
//
// Extra API on the returned object
//   setProgress(u)   0..1 ignition of the rose window, petal by petal, ending with the white point (default 1,
//                    fully lit). Use it for the reveal or the eclipse variation. Never wall-clock.
//   setSongClock(s)  optional: supply your own clock (seconds) for the 3.5 s Chladni cycle, e.g. derived from
//                    path progress, so the snaps land where you want them. Default: the time given to update().
//   uniforms         the shared uniform table (uMono, uFan, uSun, ...) if the world wants to tint its own
//                    props with windowAt(); WINDOW_GLSL is exported for that purpose.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#05060F', '#1A2244', '#5A7DB0', '#C9C3D6', '#F6F3EA', '#FFFFFF', '#FF4FA3'];
const RIM = 320, RING = 300, WIN = 210, DEPTH = 80, SADDLE = 46;

// ---------------------------------------------------------------- shared GLSL
export const COMMON_GLSL = /* glsl */`
float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float h21(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
vec3 h23(vec2 p){ vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); q+=dot(q,q.yxz+33.33); return fract((q.xxy+q.yzz)*q.zyx); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
// the only source of saturation in this world: red -> violet
vec3 spectral(float t){ t=clamp(t,0.,1.)*6.;
  vec3 c=mix(vec3(1.,.03,.05), vec3(1.,.36,0.), clamp(t,0.,1.));
  c=mix(c, vec3(1.,.84,.05), clamp(t-1.,0.,1.));
  c=mix(c, vec3(.08,.9,.2), clamp(t-2.,0.,1.));
  c=mix(c, vec3(0.,.6,1.), clamp(t-3.,0.,1.));
  c=mix(c, vec3(.12,.12,1.), clamp(t-4.,0.,1.));
  c=mix(c, vec3(.62,.05,1.), clamp(t-5.,0.,1.));
  return c; }
`;

// windowAt(p.xz): summed light of the seven fans. rgb = colour (0..1 per channel), a = coverage, mg = magenta amount.
export const WINDOW_GLSL = /* glsl */`
uniform vec4 uMono[7];   // x, z, height, radius
uniform vec4 uMonoB[7];  // base y, shoulder height, shoulder radius, -
uniform vec4 uFan[7];    // axis dir x, axis dir z, tan(half angle), ignition 0..1
uniform float uWinR, uRing, uTwist;
vec4 windowAt(vec2 p, out float mg){
  vec3 col=vec3(0.); float cover=0., red=0., vio=0.;
  float r=length(p), th=atan(p.x,-p.y+1e-5);
  float pet=uWinR*(.72+.28*pow(abs(sin(3.5*th)),.6));
  float farM=1.-smoothstep(pet-18.,pet,r);
  for(int i=0;i<7;i++){
    vec2 e=p-uMono[i].xy; vec2 d=uFan[i].xy;
    float s=dot(e,d); float w=dot(e,vec2(-d.y,d.x));
    float t=w/(max(s,1.)*uFan[i].z)+uTwist*(s-uRing)/uRing;
    float ew=clamp(7./(max(s,1.)*max(abs(uFan[i].z),.01)),.14,.7);
    float edge=smoothstep(1.,1.-ew,abs(t))*step(5.,s);
    float along=smoothstep(uMono[i].w+12.,uMono[i].w+95.,s)*(s<uRing?1.:farM);
    float I=edge*along*(1.25-.5*clamp(s/500.,0.,1.))*uFan[i].w;
    vec3 c=spectral(t*.5+.5);
    col=1.-(1.-col)*(1.-clamp(c*I*.92,0.,1.));
    cover+=I; red+=I*smoothstep(-.55,-1.,t); vio+=I*smoothstep(.55,1.,t);
  }
  mg=min(red,vio);
  col=clamp(mix(vec3(dot(col,vec3(.3333))),col,1.55),0.,1.);
  return vec4(col,cover);
}
`;

// Chladni figure: polar modes with seven-fold symmetry; chlDist ~ metres to the nearest nodal line.
const CHLADNI_GLSL = /* glsl */`
uniform vec4 uModeA, uModeB; uniform vec2 uModeA2, uModeB2; uniform float uSnap;
// (uTime must be declared by the including shader: the figure trembles a little between snaps)
float chl1(float r, float th, vec4 m, vec2 m2){ return cos(m.x*r+m2.x+.12*sin(uTime*5.))*cos(m.y*th)+m2.y*cos(m.z*r-m2.x*1.7)*cos(m.w*th); }
float chlDist(vec2 p){ float r=length(p), th=atan(p.x,-p.y+1e-5);
  float f=mix(chl1(r,th,uModeA,uModeA2), chl1(r,th,uModeB,uModeB2), uSnap);
  return abs(f)/(mix(uModeA.x,uModeB.x,uSnap)*1.15); }
`;

const VARY_VS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vCam;
#include <fog_pars_vertex>
`;

// ---------------------------------------------------------------- sand
const SAND_VS = VARY_VS + /* glsl */`
attribute float aEdge; varying float vEdge;
void main(){
  vP=position; vN=normal; vEdge=aEdge;
  vCam=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const SAND_FS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying float vEdge;
uniform vec3 uSun, uSunCol, uAmb, uSand, uLav, uMag, uSky;
uniform float uGain, uSparkle, uCore, uSongT, uTime, uPulse, uFloor, uApproach;
#include <fog_pars_fragment>
${COMMON_GLSL}
${WINDOW_GLSL}
${CHLADNI_GLSL}
// analytic shadow of the seven prisms (ray toward the sun against each vertical prism), razor edged
float shadowAt(vec3 P, out vec3 caust){
  caust=vec3(0.); float sh=1.;
  float lxz=max(length(uSun.xz),1e-4); vec2 u=uSun.xz/lxz; float tanE=uSun.y/lxz;
  float fwp=fwidth(dot(P.xz,vec2(-u.y,u.x)));
  for(int i=0;i<7;i++){
    vec2 e=P.xz-uMono[i].xy; float tt=dot(e,u);
    float perp=dot(e,vec2(-u.y,u.x));
    float hg=P.y-tt*tanE-uMonoB[i].x; float H=uMono[i].z;
    float rad=(hg<uMonoB[i].y?uMonoB[i].z:uMono[i].w)*(1.-.94*smoothstep(H*.86,H,hg));
    float d=max(abs(perp)-rad,(hg-H)*.6);
    d=max(d,tt+rad*.3);
    float w=.3+fwp*1.2;
    float s=smoothstep(-w,w,d);
    float x=perp/max(rad,1.);
    float inside=(1.-s)*smoothstep(0.,60.,-tt);
    caust+=vec3(.03,.04,.08)*inside*(.3+vn(vec2(perp*.09,hg*.025+float(i)*3.7)));
    caust+=spectral(fract(hg*.004+x*.2+.5))*exp(-pow(d/(.9+w),2.))*.15*smoothstep(0.,40.,-tt);
    sh=min(sh,s);
  }
  return sh;
}
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
    float pt=smoothstep(.2,.04,d);
    vec3 hue=mix(vec3(1.),spectral(fract(h.z*5.+dot(V,fn)*3.)),.75);
    acc+=hue*g1*pt*w;
  }
  return acc*7.*uSparkle;
}
void main(){
  vec3 P=vP; float dist=length(vCam-P); vec3 V=(vCam-P)/dist;
  vec3 N=normalize(vN);
  float rf=1.-smoothstep(120.,700.,dist);
  vec2 wp=vec2(P.x*.8+P.z*.6,-P.x*.6+P.z*.8);
  float rip=sin(wp.x*1.9+vn(wp*.07)*9.+vn(wp*.4)*2.);
  float rip2=sin(wp.x*.42+vn(wp*.021)*8.);
  N=normalize(N+vec3(.8,0.,.6)*(rip*.13*rf+rip2*.1)+vec3(vn(P.xz*.045)-.5,0.,vn(P.xz*.045+7.3)-.5)*.22);
  float ndl=pow(max(dot(N,uSun),0.),1.6)*1.22;
  float rc=wp.x*12.+vn(wp*.55)*5.+vn(wp*.1)*8.; float fc=1.-smoothstep(.3,1.1,fwidth(rc));          // hand-width ripples, only near the eye
  ndl*=1.-.13*fc*(.5-.5*sin(rc));
  float r=length(P.xz);
  vec3 caust; float sh=shadowAt(P,caust);
  float mg; vec4 wn=windowAt(P.xz,mg);
  float cov=clamp(wn.a*1.7,0.,1.)*.97;
  // Chladni ridges on the bowl floor
  float fl=smoothstep(uWinR+40.,uWinR-10.,r)*smoothstep(8.,24.,r);
  float wd=max(2.4,dist*.0032);
  float rd0=1.-smoothstep(wd*.1,wd,chlDist(P.xz));
  float rd1=1.-smoothstep(wd*.1,wd,chlDist(P.xz+normalize(uSun.xz)*wd*.5));
  float rdg=rd0*fl, rsl=(rd1-rd0)*fl;
  vec3 alb=mix(uSand,uLav,clamp(vn(P.xz*.011)*.7+(1.-N.y)*2.2-.15,0.,1.)*.8);
  // the floor of the window is a darker, packed sand so the fans stay saturated on it (uFloor 1 = original, <1 darker)
  float apr=uApproach*(1.-smoothstep(34.,95.,r));          // the run in (uApproach, driven by the world): the last sixty metres come up bright
  alb*=mix(uFloor,1.,max(smoothstep(70.,190.,r),apr*.22));
  // where several fans overlap they sum to white: keep that for the white point only, elsewhere hold the hue
  float wpt=exp(-r*r/(26.*26.));
  vec3 fanc=wn.rgb; float fmin=min(fanc.r,min(fanc.g,fanc.b));
  fanc-=fmin*.72*(1.-wpt)*(1.-uFloor)*2.;
  fanc=min(fanc*uGain*(1.+.4*apr),vec3(1.2+.4*apr));
  vec3 light=uSunCol*ndl*sh*(1.-cov)+uAmb*(.55+.45*N.y)+caust*uSunCol;
  light+=fanc+uMag*mg*1.25;
  light*=max(.25,1.+rdg*rdg*(.3+.7*uPulse)+rsl*2.4);
  // overtones: a finer figure of hairline ridges inside the main one, seen only near the eye, each with a dark line beside it
  { float nk=(1.-smoothstep(22.,95.,dist))*fl; float c2=chlDist(P.xz*3.2)/3.2; float c2s=chlDist((P.xz+normalize(uSun.xz)*.35)*3.2)/3.2;
    float hw=.22+dist*.004; float r2=1.-smoothstep(hw*.3,hw,c2), r2s=1.-smoothstep(hw*.3,hw,c2s);
    light*=1.+nk*(r2*.55+(r2s-r2)*1.1);
    light=mix(light,uAmb*.7,nk*.5*(1.-uFloor)*2.*smoothstep(hw*2.4,hw*1.3,c2)*(1.-r2)); }
  // the nodal line itself: a blue-black seam down the middle of each ridge, so the floor has figure
  float seam=(1.-smoothstep(wd*.1,wd*.34,chlDist(P.xz)))*fl*(1.-uFloor)*2.;
  light=mix(light,uAmb*.6,clamp(seam,0.,.85));
  float core=wpt*uCore+exp(-r*r/(58.*58.))*apr*.06;
  vec3 col=alb*(light+core);
  // song ripple racing outward from the white point
  float rr=uSongT*150.;
  col+=alb*exp(-pow((r-rr)/8.,2.))*.4*max(0.,1.-uSongT/3.4)*(.4+ndl);
  // on the run in the song is seen: slow rings of the whole spectrum widen from the white point and pass under the runners
  if(uApproach>.001){
    float cb=0., hb=.5;
    for(int k=0;k<3;k++){ float q=fract(uTime*.3+float(k)/3.); float xr=(r-q*105.)/8.; float c=(1.-smoothstep(1.,2.,abs(xr)))*(1.-q*q)*smoothstep(0.,.12,q); if(c>cb){ cb=c; hb=clamp(.5-xr*.25,0.,1.); } }
    col=mix(col,alb*spectral(hb)*(.8+.6*ndl*sh)*1.3,cb*uApproach*smoothstep(9.,22.,r)*.94);
  }
  col+=sparkle(P,V,dist)*mix(1.,.3,smoothstep(250.,900.,dist))*(uSunCol*(sh*.85+.15)*(1.-cov*.7)+fanc*mix(1.6,.9,(1.-uFloor)*2.)+core*.3);
  #ifdef USE_FOG
    col=mix(col,fogColor,vEdge);
  #else
    col=mix(col,uSky,vEdge);
  #endif
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- crystal
const CRYSTAL_VS = VARY_VS + /* glsl */`
attribute vec4 aA; attribute vec2 aB; varying vec4 vA; varying vec2 vB;
void main(){
  vP=position; vN=normal; vA=aA; vB=aB;
  vCam=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const CRYSTAL_FS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec4 vA; varying vec2 vB;
uniform vec3 uSun, uSunCol, uAmb, uSand, uLav, uSky, uHaze;
uniform float uTime, uReveal;
#include <fog_pars_fragment>
${COMMON_GLSL}
vec3 envAt(vec3 d){
  float up=smoothstep(-.03,.05,d.y);
  vec3 sky=mix(uHaze*.6,uSky,smoothstep(0.,.18,d.y));
  vec3 gnd=uSand*uSunCol*(.5+.3*clamp(-d.y*2.,0.,1.));
  return mix(gnd,sky,up);
}
void main(){
  // not yet revealed: the glass is not drawn at all. The light then catches the tips first and runs down the spires
  float rvl=(vP.y+50.*h21(floor(gl_FragCoord.xy))-640.*(1.-uReveal*1.3))/150.;
  if(rvl<0.) discard;
  float dist=length(vCam-vP); vec3 V=(vCam-vP)/dist; vec3 N=normalize(vN);
  float seed=vA.w, y=vA.z, R=vB.x;
  // growth striations: hashed bands across the axis tilt the facet a little
  float band=h11(floor(y/(R*.14))+seed*31.7), band2=h11(floor(y/(R*.8))+seed*7.3);
  float st=(band-.5)*.55+(band2-.5)*.45;
  vec3 Np=normalize(N+vec3(0.,st*.03,0.));
  float nv=max(dot(Np,V),0.); float F=.05+.95*pow(max(1.-nv,0.),4.);
  vec3 Rf=reflect(-V,Np);
  float rs=max(dot(Rf,uSun),0.);
  vec3 refl=envAt(Rf)+uSunCol*(pow(rs,500.)*50.+pow(rs,60.)*.45);
  vec3 T=normalize(refract(-V,Np,.67));
  float back=pow(max(dot(-V,uSun),0.),4.);
  vec3 body=envAt(T)*vec3(.06,.065,.1)+uSky*.25+uHaze*.02+uLav*(.012+.04*back);          // clear glass: we see the black sky through it
  // internal fracture planes: three families per crystal, flaring when they mirror the sun at the eye
  vec3 fr=vec3(0.);
  for(int k=0;k<3;k++){
    float fk=float(k); float a=seed*18.85+fk*2.1+h11(seed*5.+fk)*1.3;
    vec3 n=normalize(vec3(cos(a),.3+.6*h11(seed*9.+fk*3.),sin(a)));
    float sp=R*(1.7+.9*h11(seed*13.+fk));
    float dn=dot(T,n); dn=(dn<0.?-1.:1.)*max(abs(dn),.02);
    float c0=dot(vP,n)/sp; float sg=dn>0.?1.:-1.;
    float j0=dn>0.?floor(c0)+1.:ceil(c0)-1.;
    vec3 tu=normalize(cross(n,vec3(.3,1.,.2))); vec3 tv=cross(n,tu);
    float g=abs(dot(n,normalize(uSun+V)));
    float gm=abs(dot(reflect(-V,n),uSun)); float g8=gm*gm; g8*=g8; g8*=g8;
    float flare=g8*g8*g8*1.9+g8*.045+.004;          // a tight lobe: a plane flares as the view crosses its mirror angle, and is dark glass otherwise
    for(int q=0;q<2;q++){
      float j=j0+sg*float(q); float t=(j*sp-dot(vP,n))/dn;
      vec3 hp=vP+T*t;
      vec2 pc=vec2(dot(hp,tu)*.6,dot(hp,tv))/(R*1.3)+vec2(j*7.3,seed*19.+fk*5.);
      float m=.65+.35*smoothstep(.3,.8,vn(pc)+.3*vn(pc*2.7));
      vec3 tint=mix(vec3(1.),spectral(fract(gm*7.+g*3.+h11(j+seed*3.))),.86);
      fr+=tint*m*flare*exp(-t/(R*2.2));
    }
  }
  float thin=pow(max(1.-nv,0.),1.5);
  float diff=max(dot(N,uSun),0.);
  vec3 col=body*(1.-F)+refl*F+fr*(1.-F)*uSunCol*1.5;
  col+=uSunCol*back*(.015+.4*thin*thin)*mix(uLav,vec3(1.),.5);
  col+=uSunCol*diff*.045*mix(uLav,vec3(1.),.4)*(1.+st*.2);
  { float f3=max(1.-nv,0.); f3=f3*f3*f3; col+=(uSunCol*(.2+.8*back)+uHaze*.3)*f3*1.6; }          // a white fresnel edge on every arris: glass, not stone
  // bevels and arrises catch the light, with a touch of dispersion when backlit
  float w=clamp(fwidth(vA.x)*1.6,.045,.34);
  float edge=max(vA.y,smoothstep(1.-w,1.,abs(vA.x)));
  float eg=edge*(.2+1.3*back+1.4*pow(rs,5.)+.45*diff)*(.6+.8*band2);
  vec3 ecol=mix(vec3(1.),spectral(fract(dot(V,N)*2.5+y*.006+seed)),.25+.45*back);
  col+=ecol*eg*uSunCol;
  // sand-blasted, drifted base
  float frost=smoothstep(R*.45+8.,0.,y+vn(vP.xz*.21)*7.);
  vec3 fcol=uSand*(uSunCol*diff*.75+uAmb*1.6+.05);
  col=mix(col,fcol,frost*.85);
  // unlit glass against the black sky is black: the Choir only blazes once we top the rim (uReveal, driven by the world)
  col=mix(uSky,col,smoothstep(0.,1.,rvl)*smoothstep(.1,.7,uReveal));
  gl_FragColor=vec4(col,1.);
  #include <fog_fragment>
}`;

// additive layers fade to black (not to the fog colour) with distance
const ADD_FOG = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF=1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float fogF=smoothstep(fogNear,fogFar,vFogDepth);
    #endif
    gl_FragColor.rgb*=1.-fogF;
  #endif
`;

// ---------------------------------------------------------------- jets (instanced quads on the nodal lines)
const JET_VS = /* glsl */`
attribute vec4 aJ; attribute vec2 aR;
uniform float uTime, uPulse, uGain;
varying vec2 vUv; varying vec3 vCol; varying float vH;
#include <fog_pars_vertex>
${COMMON_GLSL}
${WINDOW_GLSL}
${CHLADNI_GLSL}
void main(){
  vec3 base=aJ.xyz; vec3 cam=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;
  float dist=length(cam-base);
  float on=max(1.-smoothstep(1.2,2.6,chlDist(base.xz)),step(1.,aJ.w)*.8);
  float ph=fract(uTime*(.55+.5*aR.x)+aJ.w);
  float leap=sin(3.14159*ph);
  float hgt=(1.4+2.6*aR.y)*(.25+.75*leap)*(1.+1.1*uPulse)*max(1.,dist/220.);
  float wid=max(1.3+.9*aR.x,dist*.006);
  vec2 side=normalize(vec2(cam.z-base.z,-(cam.x-base.x)));
  vec3 p=base+vec3(side.x,0.,side.y)*position.x*wid+vec3(0.,(position.y+.02)*hgt,0.);
  p*=step(.02,on); 
  float mg; vec4 wn=windowAt(base.xz,mg);
  float r=length(base.xz);
  vec3 lit=vec3(.1)+wn.rgb*1.9+vec3(1.,.31,.64)*mg+vec3(.55)*exp(-r*r/700.);
  if(aJ.w>=1.) lit=spectral(fract(atan(base.x,base.z+1e-5)*.3183+aJ.w*.15))*1.5+.12;          // the ring round the white point: the spectrum twice round
  vCol=lit*on*(.5+.5*leap)*min(1.,260./dist+.12)*(.5+uGain*.5);
  vUv=position.xy; vH=aR.y+aJ.w*7.;
  vec4 mvPosition=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const JET_FS = /* glsl */`
varying vec2 vUv; varying vec3 vCol; varying float vH; uniform float uTime;
#include <fog_pars_fragment>
${COMMON_GLSL}
void main(){
  float x=vUv.x*2.; float core=exp(-x*x*(3.+9.*vUv.y))*(1.-x*x);
  float grain=.45+1.3*step(.62,h21(vec2(floor(vUv.y*11.-uTime*5.+vH*31.),floor(vUv.x*5.+vH*91.))));
  float a=core*(1.-vUv.y)*(1.-vUv.y)*smoothstep(0.,.06,vUv.y)*grain;
  gl_FragColor=vec4(vCol*a*3.,1.);
  ${ADD_FOG}
}`;

// ---------------------------------------------------------------- light curtains in the air
const BEAM_VS = /* glsl */`
attribute vec3 aC; varying vec3 vC; varying vec3 vP; varying vec3 vCam;
#include <fog_pars_vertex>
void main(){ vC=aC; vP=position; vCam=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEAM_FS = /* glsl */`
varying vec3 vC; varying vec3 vP; varying vec3 vCam; uniform float uTime, uBeam, uReveal; uniform vec3 uSun; uniform vec4 uFan[7];
#include <fog_pars_fragment>
${COMMON_GLSL}
void main(){
  vec3 V=normalize(vCam-vP);
  float fwd=.45+1.5*pow(max(dot(-V,uSun),0.),3.);
  float dust=.5+.5*vn(vP.xz*.03+vec2(uTime*.6,vP.y*.05-uTime*.3))+.4*vn(vP.xy*.11+uTime*.2);
  float a=pow(sin(3.14159*clamp(vC.y,0.,1.)),1.6)*smoothstep(0.,.12,vC.x)*smoothstep(1.,.55,vC.x);
  int fi=int(floor(vC.z/8.)); float hue=fract(vC.z/8.);
  gl_FragColor=vec4(spectral(hue)*a*dust*fwd*uBeam*.085*uFan[fi].w*uReveal,1.);
  ${ADD_FOG}
}`;

// ---------------------------------------------------------------- glints on the tips + mirror-winged flyers
const GLINT_VS = /* glsl */`
attribute vec3 aP; attribute vec4 aQ; uniform float uTime, uReveal; uniform vec3 uSun;
varying vec2 vUv; varying float vI;
#include <fog_pars_vertex>
void main(){
  vec3 c=aP; vec3 cam=(inverse(modelMatrix)*vec4(cameraPosition,1.)).xyz; float I; float size;
  if(aQ.z>.5){
    float a=aQ.y+uTime*aQ.w; c.xz+=vec2(cos(a),sin(a))*aQ.x; c.y+=sin(a*2.+aQ.y)*14.;
    float fl=pow(max(cos(a-aQ.y*3.),0.),40.);
    I=.1+6.*fl; size=5.+26.*fl;
  } else {
    vec3 V=normalize(cam-c); float back=pow(max(dot(-V,uSun),0.),3.);
    I=(.45+3.2*back)*(.82+.18*sin(uTime*2.3+aQ.y))*uReveal; size=aQ.x*(.6+.7*back);
  }
  float dist=length(cam-c); size=max(size,dist*.008);
  vUv=position.xy*2.; vI=I;
  vec4 mvPosition=modelViewMatrix*vec4(c,1.); mvPosition.xy+=position.xy*size;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GLINT_FS = /* glsl */`
varying vec2 vUv; varying float vI;
#include <fog_pars_fragment>
void main(){
  float d=length(vUv); float g=exp(-d*d*38.)*2.5+exp(-d*5.)*.12;
  for(int k=0;k<3;k++){ float a=float(k)*1.0472+.26; vec2 n=vec2(-sin(a),cos(a));
    g+=exp(-abs(dot(vUv,n))*70.)*exp(-d*4.2)*.9; }
  g*=smoothstep(1.,.6,d);
  gl_FragColor=vec4(vec3(.95,.96,1.)*g*vI,1.);
  ${ADD_FOG}
}`;

// ---------------------------------------------------------------- geometry helpers
const V3 = THREE.Vector3;

// chamfered hexagon: 12 points, faces k->k+1 are bevels for even k and the wide prism faces for odd k
function hexSection(R, rot, rj, bevel) {
  const c = [];
  for (let j = 0; j < 6; j++) { const a = rot + j * Math.PI / 3; c.push([Math.cos(a) * R * rj[j], Math.sin(a) * R * rj[j]]); }
  const pts = [];
  for (let j = 0; j < 6; j++) {
    const p = c[(j + 5) % 6], q = c[j], n = c[(j + 1) % 6];
    pts.push([lerp(q[0], p[0], bevel), lerp(q[1], p[1], bevel)], [lerp(q[0], n[0], bevel), lerp(q[1], n[1], bevel)]);
  }
  return pts;
}

// lofts the section through `rings` ({y, s, sx, sz, ox, oz, kx, kz}) along `axis`, flat shaded, capped on top
function addPrism(B, o) {
  const { base, axis, sec, rings, seed, R, H } = o;
  const ref = Math.abs(axis.z) > 0.9 ? new V3(1, 0, 0) : new V3(0, 0, 1);
  const t1 = new V3().crossVectors(ref, axis).normalize(), t2 = new V3().crossVectors(axis, t1);
  const n = sec.length, P = [], C = [];
  for (const g of rings) {
    const s = g.s ?? 1, sx = (g.sx ?? 1) * s, sz = (g.sz ?? 1) * s, ox = g.ox || 0, oz = g.oz || 0, kx = g.kx || 0, kz = g.kz || 0;
    const row = [];
    for (let k = 0; k < n; k++) {
      const lx = sec[k][0] * sx, lz = sec[k][1] * sz, ly = g.y + lx * kx + lz * kz, ax = lx + ox, az = lz + oz;
      row.push([base.x + t1.x * ax + axis.x * ly + t2.x * az, base.y + t1.y * ax + axis.y * ly + t2.y * az, base.z + t1.z * ax + axis.z * ly + t2.z * az, ly]);
    }
    P.push(row);
    C.push([base.x + t1.x * ox + axis.x * g.y + t2.x * oz, base.y + t1.y * ox + axis.y * g.y + t2.y * oz, base.z + t1.z * ox + axis.z * g.y + t2.z * oz]);
  }
  const push = (p, nx, ny, nz, u, bev) => { B.pos.push(p[0], p[1], p[2]); B.nor.push(nx, ny, nz); B.a.push(u, bev, p[3], seed); B.b.push(R, H); };
  for (let g = 0; g < rings.length - 1; g++) {
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n, a = P[g][k], b = P[g][k2], c = P[g + 1][k2], d = P[g + 1][k];
      const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2];
      const e2x = (c[0] + d[0]) * 0.5 - a[0], e2y = (c[1] + d[1]) * 0.5 - a[1], e2z = (c[2] + d[2]) * 0.5 - a[2];
      let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const cx = (a[0] + b[0] + c[0] + d[0]) * 0.25 - (C[g][0] + C[g + 1][0]) * 0.5, cy = (a[1] + b[1] + c[1] + d[1]) * 0.25 - (C[g][1] + C[g + 1][1]) * 0.5, cz = (a[2] + b[2] + c[2] + d[2]) * 0.25 - (C[g][2] + C[g + 1][2]) * 0.5;
      if (nx * cx + ny * cy + nz * cz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const bev = k % 2 === 0 ? 1 : 0;
      push(a, nx, ny, nz, -1, bev); push(b, nx, ny, nz, 1, bev); push(c, nx, ny, nz, 1, bev);
      push(a, nx, ny, nz, -1, bev); push(c, nx, ny, nz, 1, bev); push(d, nx, ny, nz, -1, bev);
    }
  }
  // cap
  const top = P[P.length - 1], ct = [0, 0, 0, 0];
  for (const p of top) { ct[0] += p[0] / n; ct[1] += p[1] / n; ct[2] += p[2] / n; ct[3] += p[3] / n; }
  for (let k = 0; k < n; k++) {
    const a = top[k], b = top[(k + 1) % n];
    const e1x = a[0] - ct[0], e1y = a[1] - ct[1], e1z = a[2] - ct[2], e2x = b[0] - ct[0], e2y = b[1] - ct[1], e2z = b[2] - ct[2];
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (nx * axis.x + ny * axis.y + nz * axis.z < 0) { nx = -nx; ny = -ny; nz = -nz; }
    push(ct, nx, ny, nz, 0, 0); push(a, nx, ny, nz, 1, 0); push(b, nx, ny, nz, 1, 0);
  }
  // tip position (for glints)
  return new V3(ct[0], ct[1], ct[2]);
}

// one crystal with a quartz-like termination; returns its tip
function crystal(B, rng, base, axis, R, H, rot, detail) {
  const rj = []; const alt = rng.range(0.03, 0.12);
  for (let j = 0; j < 6; j++) rj.push(1 + (j % 2 ? alt : -alt) + rng.range(-0.05, 0.05));
  const sec = hexSection(R, rot, rj, rng.range(0.07, 0.12));
  const tipH = Math.min(H * 0.45, R * rng.range(1.15, 1.8)), Hs = H - tipH, bury = R * 0.9 + 4;
  const ox = R * rng.range(-0.32, 0.32), oz = R * rng.range(-0.32, 0.32);
  const kx = rng.range(-0.28, 0.28), kz = rng.range(-0.28, 0.28);
  const style = rng.pick(['point', 'point', 'chisel', 'oblique']);
  const rings = [{ y: -bury, s: 1.07 }];
  if (detail) rings.push({ y: Hs * 0.36, s: 1.0 }, { y: Hs * 0.74, s: 0.965, ox: ox * 0.05, oz: oz * 0.05 });
  else rings.push({ y: Hs * 0.55, s: 0.985 });
  const ts = detail ? 0.91 : 0.93;
  rings.push({ y: Hs, s: ts, kx, kz, ox: ox * 0.08, oz: oz * 0.08 });
  if (style === 'point') {
    rings.push({ y: Hs + tipH * 0.58, s: ts * 0.52, ox: ox * 0.6, oz: oz * 0.6, kx: kx * 0.5, kz: kz * 0.5 });
    rings.push({ y: H, s: rng.range(0.05, 0.12), ox, oz });
  } else if (style === 'chisel') {
    const w = rng.chance(0.5);
    rings.push({ y: Hs + tipH * 0.55, s: ts, sx: w ? 0.42 : 0.78, sz: w ? 0.78 : 0.42, ox: ox * 0.5, oz: oz * 0.5, kx: kx * 0.4, kz: kz * 0.4 });
    rings.push({ y: H, s: 1, sx: w ? 0.06 : 0.5, sz: w ? 0.5 : 0.06, ox, oz });
  } else {
    const sl = rng.range(0.45, 0.8) * rng.sign(), ang = rng.range(0, 6.283), ca = Math.cos(ang) * sl, sa = Math.sin(ang) * sl;
    rings.push({ y: Hs + tipH * 0.3, s: ts * 0.9, kx: ca * 0.75, kz: sa * 0.75, ox: ox * 0.2, oz: oz * 0.2 });
    rings.push({ y: Hs + tipH * 0.62, s: ts * 0.66, kx: ca, kz: sa, ox: ox * 0.4, oz: oz * 0.4 });
  }
  return addPrism(B, { base, axis, sec, rings, seed: rng(), R, H });
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('choir'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cSky, cShadow, cHaze, cLav, cWarm, cWhite, cMag] = pal;
  const v3c = (c, k = 1) => new V3(c.r * k, c.g * k, c.b * k);
  const d2r = Math.PI / 180;
  const sunDir = opts.sunDir ? new V3().fromArray(opts.sunDir).normalize()
    : new V3(Math.sin(25 * d2r) * Math.cos(55 * d2r), Math.sin(55 * d2r), -Math.cos(25 * d2r) * Math.cos(55 * d2r)).normalize();
  const sunI = opts.sunIntensity ?? 1.05;
  const group = new THREE.Group(); group.name = 'singing-erg-choir';

  // ---- the seven monoliths: layout first (the sand needs them)
  const stepA = (220 / 6) * d2r, Hmax = rng.range(425, 450);
  const prof = [0.5, 0.645, 0.815, 1];
  const hand = rng.sign(), tanA = rng.range(0.16, 0.19), twist = rng.range(0.12, 0.3) * rng.sign();
  const monos = [];
  for (let i = 0; i < 7; i++) {
    const k = Math.abs(i - 3), a = (i - 3) * stepA + (k ? rng.range(-0.035, 0.035) : 0);
    const H = Math.max(200, Hmax * prof[3 - k] * (k ? rng.range(0.95, 1.05) : 1));
    const R = H / rng.range(9.6, 11.4) * (k === 3 ? 1.12 : 1);
    const x = RING * Math.sin(a), z = -RING * Math.cos(a);
    const tc = ((i - 3) / 3) * 0.75, beta = -Math.atan(tc * tanA * hand);
    const d0x = -x / RING, d0z = -z / RING, cb = Math.cos(beta), sb = Math.sin(beta);
    monos.push({ i, a, x, z, H, R, fx: d0x * cb - d0z * sb, fz: d0x * sb + d0z * cb, subs: [], tips: [] });
  }

  // ---- sand height field
  const nOff = rng.range(0, 100);
  const rimHAt = (th) => DEPTH - (DEPTH - SADDLE) * smoothstep(0.5, 0.96, Math.cos(th)) + 5 * noise.n2(Math.cos(th) * 1.7 + nOff, Math.sin(th) * 1.7);
  const hIn = (x, z) => {
    const r = Math.hypot(x, z), u = r / RIM, th = Math.atan2(x, z);
    let h = rimHAt(th) * (u > 0.34 ? Math.pow((u - 0.34) / 0.66, 1.75) : 0);
    h += 2.2 * smoothstep(0.1, 0.6, u) * noise.fbm2(x * 0.007 + nOff, z * 0.007, 3) + 1.4 * u * u;
    for (const m of monos) { const dx = x - m.x, dz = z - m.z, s = m.R * 1.7; h += 7 * Math.exp(-(dx * dx + dz * dz) / (s * s)); }
    return h;
  };
  const hOut = (x, z) => {
    const r = Math.hypot(x, z), th = Math.atan2(x, z), rh = hIn(x * RIM / r, z * RIM / r), dr = r - RIM;
    const slip = rh - 0.6 * dr;
    const dn = (8 + 70 * noise.ridged2(x * 0.0023 + nOff, z * 0.0023, 3)) * smoothstep(0, 110, dr) + rh * 0.45 * (1 - smoothstep(0, 160, dr));
    const sm = 0.5 * (slip + dn + Math.sqrt((slip - dn) * (slip - dn) + 90));
    return lerp(rh, sm, smoothstep(0, 14, dr));
  };
  const heightAt = (x, z) => (Math.hypot(x, z) <= RIM ? hIn(x, z) : hOut(x, z));
  for (const m of monos) m.y = hIn(m.x, m.z) - 3;

  // ---- sand mesh (polar grid; inner bowl and outer apron are separate vertex sets so the crest stays a knife edge)
  const skirt = opts.skirt !== false, SEG = 288, NI = 96;
  const outerOff = skirt ? [0, 3, 7, 12, 19, 28, 40, 54, 70, 88, 107, 127, 148, 170, 193, 217, 240] : [0, 3, 7, 12];
  const nv = (NI + 1 + outerOff.length) * SEG;
  const sp = new Float32Array(nv * 3), sn = new Float32Array(nv * 3), se = new Float32Array(nv), sidx = [];
  let vi = 0;
  const putRing = (r, fn, edge) => {
    for (let j = 0; j < SEG; j++) {
      const ph = (j / SEG) * Math.PI * 2, x = Math.max(r, 0.01) * Math.sin(ph), z = Math.max(r, 0.01) * Math.cos(ph);
      const h = fn(x, z), e = 1.5, hx = fn(x + e, z), hz = fn(x, z + e);
      let nx = -(hx - h) / e, nz = -(hz - h) / e; const l = Math.hypot(nx, 1, nz);
      sp[vi * 3] = x; sp[vi * 3 + 1] = h; sp[vi * 3 + 2] = z; sn[vi * 3] = nx / l; sn[vi * 3 + 1] = 1 / l; sn[vi * 3 + 2] = nz / l; se[vi] = edge; vi++;
    }
  };
  const band = (r0, r1) => { for (let j = 0; j < SEG; j++) { const j2 = (j + 1) % SEG, a = r0 * SEG + j, b = r1 * SEG + j, c = r1 * SEG + j2, d = r0 * SEG + j2; sidx.push(a, b, c, a, c, d); } };
  for (let i = 0; i <= NI; i++) { putRing(RIM * Math.pow(i / NI, 0.92), hIn, 0); await ctx.yield(); }
  for (let i = 0; i < NI; i++) band(i, i + 1);
  for (let i = 0; i < outerOff.length; i++) { putRing(RIM + outerOff[i], hOut, skirt ? smoothstep(170, 240, outerOff[i]) : 0); await ctx.yield(); }
  for (let i = 0; i < outerOff.length - 1; i++) band(NI + 1 + i, NI + 2 + i);
  await ctx.yield();
  const sandGeo = new THREE.BufferGeometry();
  sandGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sandGeo.setAttribute('normal', new THREE.BufferAttribute(sn, 3));
  sandGeo.setAttribute('aEdge', new THREE.BufferAttribute(se, 1));
  sandGeo.setIndex(sidx);
  await ctx.yield();

  // ---- crystals
  const B = { pos: [], nor: [], a: [], b: [] }, tips = [];
  const sunXZ = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
  for (const m of monos) {
    const mr = rng.fork('mono' + m.i), rot = mr.range(0, Math.PI / 3);
    const lean = mr.range(0, 0.035), la = mr.range(0, 6.283);
    const axis = new V3(Math.sin(lean) * Math.cos(la), Math.cos(lean), Math.sin(lean) * Math.sin(la)).normalize();
    const base = new V3(m.x, m.y, m.z);
    m.tip = crystal(B, mr, base, axis, m.R, m.H, rot, true);
    tips.push({ p: m.tip, s: m.R * 1.5 });
    // fused parallel "organ pipes"
    const faces = mr.shuffle([0, 1, 2, 3, 4, 5]), np = mr.int(2, 4);
    let shH = 0, shR = m.R * 0.93;
    for (let q = 0; q < np; q++) {
      const ph = rot + faces[q] * Math.PI / 3 + Math.PI / 6, r2 = m.R * mr.range(0.38, 0.6), h2 = m.H * mr.range(0.42, 0.8) * (q === 0 ? 1 : 0.8);
      const dd = m.R * 0.78 + r2 * 0.35, bx = m.x + Math.cos(ph) * dd, bz = m.z + Math.sin(ph) * dd;
      const tp = crystal(B, mr, new V3(bx, m.y, bz), axis, r2, h2, rot + (mr.chance(0.3) ? Math.PI / 6 : 0), true);
      tips.push({ p: tp, s: r2 * 1.4 });
      const perp = Math.abs((bx - m.x) * -sunXZ.y + (bz - m.z) * sunXZ.x);
      shR = Math.max(shR, perp + r2 * 0.9); shH = Math.max(shH, h2 * 0.9);
      await ctx.yield();
    }
    m.shH = shH; m.shR = shR;
    await ctx.yield();
    // rosette of leaning secondary crystals
    const ns = mr.int(6, 9);
    for (let q = 0; q < ns; q++) {
      const ph = (q / ns) * 6.283 + mr.range(-0.3, 0.3), ln = mr.range(0.22, 0.8), h2 = m.H * mr.range(0.1, 0.27), r2 = h2 / mr.range(5.5, 8);
      const dd = m.R * mr.range(0.7, 1.2), bx = m.x + Math.cos(ph) * dd, bz = m.z + Math.sin(ph) * dd;
      const ax = new V3(Math.cos(ph) * Math.sin(ln), Math.cos(ln), Math.sin(ph) * Math.sin(ln));
      crystal(B, mr, new V3(bx, hIn(bx, bz) - 2, bz), ax, r2, h2, mr.range(0, 1), false);
      if (q % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
    // shards
    const nt = mr.int(11, 17);
    for (let q = 0; q < nt; q++) {
      const ph = mr.range(0, 6.283), dd = m.R * mr.range(1.1, 2.6), h2 = mr.range(7, 28), r2 = h2 / mr.range(4, 7);
      const bx = m.x + Math.cos(ph) * dd, bz = m.z + Math.sin(ph) * dd, ln = mr.range(0.05, 0.95), pa = ph + mr.range(-0.9, 0.9);
      const ax = new V3(Math.cos(pa) * Math.sin(ln), Math.cos(ln), Math.sin(pa) * Math.sin(ln));
      crystal(B, mr, new V3(bx, hIn(bx, bz) - 1, bz), ax, r2, h2, mr.range(0, 1), false);
      if (q % 4 === 3) await ctx.yield();
    }
    await ctx.yield();
  }
  await ctx.yield();
  const cryGeo = new THREE.BufferGeometry();
  cryGeo.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  await ctx.yield();
  cryGeo.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  await ctx.yield();
  cryGeo.setAttribute('aA', new THREE.Float32BufferAttribute(B.a, 4));
  await ctx.yield();
  cryGeo.setAttribute('aB', new THREE.Float32BufferAttribute(B.b, 2));
  await ctx.yield();

  // ---- shared uniforms
  const modes = [];
  const nModes = rng.int(6, 8);
  for (let i = 0; i < nModes; i++) modes.push({
    a: new THREE.Vector4(rng.range(0.05, 0.105), rng.chance(0.25) ? 14 : 7, rng.range(0.03, 0.085), rng.pick([0, 7, 7, 14])),
    b: new THREE.Vector2(rng.range(0, 6.283), rng.range(0.45, 0.9)),
  });
  const igniteRank = [5, 3, 1, 0, 2, 4, 6];
  const U = {
    uMono: { value: monos.map((m) => new THREE.Vector4(m.x, m.z, m.H, m.R * 0.93)) },
    uMonoB: { value: monos.map((m) => new THREE.Vector4(m.y, m.shH, m.shR, 0)) },
    uFan: { value: monos.map((m) => new THREE.Vector4(m.fx, m.fz, tanA * hand, 1)) },
    uWinR: { value: WIN }, uRing: { value: RING }, uTwist: { value: twist },
    uModeA: { value: modes[0].a.clone() }, uModeB: { value: modes[1].a.clone() },
    uModeA2: { value: modes[0].b.clone() }, uModeB2: { value: modes[1].b.clone() },
    uSnap: { value: 1 }, uSongT: { value: 1 }, uPulse: { value: 0 }, uTime: { value: 0 },
    uSun: { value: sunDir.clone() }, uSunCol: { value: v3c(cWhite, sunI) }, uAmb: { value: v3c(cShadow, 1.6) },
    uSand: { value: v3c(cWarm, 0.72) }, uLav: { value: v3c(cLav, 0.7) }, uMag: { value: v3c(cMag) },
    uSky: { value: v3c(cSky) }, uHaze: { value: v3c(cHaze) },
    uGain: { value: opts.gain ?? 1.1 }, uSparkle: { value: opts.sparkle ?? 1 }, uCore: { value: 1.7 },
    uBeam: { value: opts.beams ?? 0.15 }, uReveal: { value: 1 }, uFloor: { value: opts.floor ?? 1 }, uApproach: { value: 0 },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const sandMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: SAND_VS, fragmentShader: SAND_FS, fog: true, side: THREE.DoubleSide });
  const sand = new THREE.Mesh(sandGeo, sandMat); sand.name = 'choir-sand'; sand.frustumCulled = false; group.add(sand);
  const cryMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: CRYSTAL_VS, fragmentShader: CRYSTAL_FS, fog: true, side: THREE.DoubleSide });
  const cry = new THREE.Mesh(cryGeo, cryMat); cry.name = 'choir-crystal'; cry.frustumCulled = false; group.add(cry);

  // ---- sand jets: instanced streaks that only show where they stand on a nodal line
  const NJ = Math.max(0, Math.floor(opts.jets ?? 12000));
  let jets = null;
  if (NJ > 0) {
    const jr = rng.fork('jets'), aJ = new Float32Array(NJ * 4), aR = new Float32Array(NJ * 2);
    for (let i = 0; i < NJ; i++) {
      if ((i & 1023) === 1023) await ctx.yield();
      let x = 0, z = 0;
      for (let t = 0; t < 8; t++) {
        const r = Math.sqrt(jr.range(0.004, 1)) * (WIN + 28), a = jr.range(0, 6.283);
        x = r * Math.sin(a); z = r * Math.cos(a);
        if (!(Math.abs(x) < 5 && z > -8)) break;      // keep the toboggan line and the portal clear
      }
      if (i % 7 === 3) { x = jr.range(6, 15) * jr.sign(); z = jr.range(14, WIN + 20); }
      let ring = 0;
      if (i % 15 === 8) {                                     // a standing ring of jets round the white point (always leaping: aJ.w >= 1), clear of the run in
        const r = jr.range(18, 40), a = jr.range(0.3, 6.283 - 0.3);
        x = r * Math.sin(a); z = r * Math.cos(a); ring = 1;
      }
      aJ[i * 4] = x; aJ[i * 4 + 1] = hIn(x, z); aJ[i * 4 + 2] = z; aJ[i * 4 + 3] = jr() + ring;
      aR[i * 2] = jr(); aR[i * 2 + 1] = jr();
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4));
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 2));
    g.instanceCount = NJ;
    jets = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: JET_VS, fragmentShader: JET_FS, fog: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    jets.name = 'choir-jets'; jets.frustumCulled = false; jets.renderOrder = 3; group.add(jets);
  }
  await ctx.yield();

  // ---- faint spectral light curtains from each monolith down to its fan
  if ((opts.beams ?? 0.15) > 0) {
    const bp = [], bc = [], bi = [];
    for (const m of monos) {
      for (let j = 0; j < 5; j++) {
        const t = ((j - 2) / 2) * 0.82, hue = (t * 0.5 + 0.5) * 7.9, code = m.i * 8 + hue;
        const gp = (s) => { const w = t * s * tanA * hand, x = m.x + m.fx * s - m.fz * w, z = m.z + m.fz * s + m.fx * w; return [x, hIn(x, z) + 0.6, z]; };
        const near = gp(78), far = gp(RING * 0.97), v0 = bp.length / 3;
        bp.push(m.x, m.y + m.H * 0.42, m.z, m.x, m.y + m.H * 0.9, m.z, far[0], far[1], far[2], near[0], near[1], near[2]);
        bc.push(0, 1, code, 0, 0, code, 1, 0, code, 1, 1, code);
        bi.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(bc, 3));
    g.setIndex(bi);
    const beams = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: BEAM_VS, fragmentShader: BEAM_FS, fog: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beams.name = 'choir-beams'; beams.frustumCulled = false; beams.renderOrder = 2; group.add(beams);
  }

  // ---- glints on the tips and the mirror-winged flyers
  {
    const NF = Math.max(0, Math.floor(opts.flyers ?? 40)), n = tips.length + NF, fr = rng.fork('flyers');
    const aP = new Float32Array(n * 3), aQ = new Float32Array(n * 4);
    tips.forEach((t, i) => { aP.set([t.p.x, t.p.y, t.p.z], i * 3); aQ.set([t.s, fr.range(0, 6.283), 0, 0], i * 4); });
    for (let i = 0; i < NF; i++) {
      const k = tips.length + i;
      aP.set([fr.range(-50, 50), fr.range(230, 430), fr.range(-70, 40)], k * 3);
      aQ.set([fr.range(80, 250), fr.range(0, 6.283), 1, fr.range(0.2, 0.38) * fr.sign()], k * 4);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 3));
    g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 4));
    g.instanceCount = n;
    const glints = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: GLINT_VS, fragmentShader: GLINT_FS, fog: true,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glints.name = 'choir-glints'; glints.frustumCulled = false; glints.renderOrder = 4; group.add(glints);
  }

  // ---- animation state
  let progress = 1, songClock = null, lastIdx = null;
  const applyProgress = () => {
    for (let i = 0; i < 7; i++) U.uFan.value[i].w = smoothstep(igniteRank[i] / 8.5, (igniteRank[i] + 1.8) / 8.5, progress);
    U.uCore.value = 1.7 * smoothstep(0.86, 1, progress);
  };
  const mod = (i, n) => ((i % n) + n) % n;
  function update(dt, time) {
    U.uTime.value = time;
    U.uTwist.value = twist + 0.05 * Math.sin(time * 0.8);   // the fans breathe: hue bands slide across the sand
    const s = songClock ?? time, idx = Math.floor(s / 3.5), fr = s - idx * 3.5;
    if (idx !== lastIdx) {
      lastIdx = idx;
      const A = modes[mod(idx - 1, nModes)], Bm = modes[mod(idx, nModes)];
      U.uModeA.value.copy(A.a); U.uModeA2.value.copy(A.b); U.uModeB.value.copy(Bm.a); U.uModeB2.value.copy(Bm.b);
    }
    U.uSnap.value = smoothstep(0, 0.4, fr);
    U.uSongT.value = fr;
    U.uPulse.value = Math.exp(-fr * 2.2) * smoothstep(0, 0.1, fr);
  }
  update(0, 0);

  // ---- anchors
  const flyThrough = [];
  for (const z of [330, 300, 262, 220, 175, 130, 95]) flyThrough.push(new V3(0, heightAt(0, z) + 2.8, z));
  const y70 = heightAt(0, 70) + 3;
  flyThrough.push(new V3(0, y70, 70), new V3(0, lerp(y70, 7.6, 0.5), 35), new V3(0, 7.6, 0));
  const tallest = monos[3];
  const monoAnchor = (m) => ({ position: new V3(m.x, m.y + 3, m.z), height: m.H, radius: m.R, tip: m.tip.clone(), fanDir: new V3(m.fx, 0, m.fz) });
  const center = new V3(0, 140, 0);
  const anchors = {
    portalSeat: { position: new V3(0, 7.6, 0), normal: new V3(0, 0, 1), radius: 7 },
    whitePoint: new V3(0, 0, 0),
    flyThrough,
    crest: new V3(0, heightAt(0, RIM) + 2.8, RIM),
    monoliths: monos.map(monoAnchor), tallest: monoAnchor(tallest),
    sunDir: sunDir.clone(),
    rimRadius: RIM, ringRadius: RING, windowRadius: WIN, bowlDepth: DEPTH, saddleHeight: SADDLE,
    heightAt,
    viewpoints: [
      { name: 'reveal', position: new V3(0, heightAt(0, RIM) + 6, RIM + 14), lookAt: new V3(0, 110, -RING) },
      { name: 'run', position: new V3(0, heightAt(0, 150) + 2.8, 150), lookAt: new V3(0, 60, -RING) },
      { name: 'high', position: new V3(260, 330, 620), lookAt: new V3(0, 60, -40) },
      { name: 'window', position: new V3(-140, 260, 330), lookAt: new V3(0, 0, -20) },
    ],
  };

  return {
    object: group, radius: 340, height: Math.round(tallest.H + 20), center, anchors,
    uniforms: U,
    update,
    setProgress(u) { progress = clamp(u, 0, 1); applyProgress(); },
    setSongClock(s) { songClock = s; },
    dispose() {},
    ground: false, groundY: 0,
  };
}
