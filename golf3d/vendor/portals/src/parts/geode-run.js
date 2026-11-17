// THE GEODE: hero set piece for "geode-run".
//
// What it is (local space, +Y up, y = 0 is the pool surface, origin under the middle of the egg, front = +Z):
//   - A hollow amethyst egg, 180 m across and 175 m tall inside (roof at y = 175, floor rock at y ~ 0..3). The wall is a
//     displaced shell with a faceted cell shader (small crystal crust) carrying ~5,200 instanced amethyst points
//     1-14 m long in druse clusters: dark roots, pale tips, sparse hard glints that travel as the view changes.
//   - ~45 milk-white selenite beams (bevelled hexagonal blades) jutting from the walls and spanning the void; the ones
//     that cross the daylight column blaze along their whole length; all of them answer the cart lamp (light pipe).
//   - The daylight shaft: a leaning column 30 m wide from the sinkhole (fern and root fringe, a disc of noon sky with a
//     cloud edge sliding over it) down to a hot oval on the turquoise pool, with mist, moths, falling leaves and 120
//     circling swiftlets. A second small sinkhole throws a thin blade of light across the upper wall.
//   - The trestle: two tracks (helix radius 40 m, ours, on the cave-side edge of the deck, and 47.5 m, the loose cart's,
//     on the wall side; anticlockwise seen from above, one and a half turns from y = 138 to y = 88) on spindly grey
//     timber bents every 9 m: every second bent stands on a battered, cross-braced tower by the wall, the others hang
//     on chains from the roof; nothing of the trestle stands between our rail and the cave; a 50 m approach from the throat mouth (+Z side),
//     which leaves the mouth heading 19 degrees left of -Z, toward the daylight column, and straightens onto the
//     helix (anchors.entry.direction carries that heading: the world's throat bends to meet it); a 52 m spur that swings in off
//     the helix and ends in splintered timber in mid-air.
//   - Six thread waterfalls dropping from beam to beam, an aerial cableway with 14 travelling iron buckets, and at
//     the pool's edge the well: a rock curb and a collar of twelve white selenite blades round the portal seat.
//   The outer shell is cut away when the camera is outside the egg (viewer, establishing shots): back walls only.
//
// opts: palette (7 hex, brief order: shadow, amethyst root, amethyst tip, lamp white, daylight blue, pool, timber),
//       haze (0.003: the piece's own blue in-geode haze; pass 0 if scene fog already does this), glint (1),
//       throatStub (true: 12 m of dark rock lip behind the mouth), cutaway (false; true folds the near wall away when
//       the camera is outside the egg: on by itself only in the set-piece viewer), lamp ('demo': a lamp rides the rails),
//       preview ('in' | 'low' | 'inlamp': viewer-only framings from inside; 'in' at u = 0.14 is the reveal).
//
// anchors (all local space; THREE.Vector3 unless noted):
//   entry        { position, direction }  throat mouth in the wall, rail level; the track runs on from here.
//   track        { outer: [Vector3], second: [Vector3] }  rail-top centre lines every 1.5 m (outer = ours: approach,
//                helix, spur; second = the white cart's, on the wall side of ours, merging onto the spur). trackAt(d) -> { position, tangent }
//                samples the outer line by distance in metres from the entry.
//   helix        { center, radius, secondRadius, yTop, yBottom, theta0, turns, startDist, endDist }
//   railEnd      { position, direction }  the splintered end of the spur.
//   flyThrough   ordered points: 1.7 m above our rails from the entry to the rail end, then the leap (15 degrees
//                down, steepening over 40 m, last 60 m straight at 66 degrees) to the portal centre. The dive is
//                clear by 6 m or more; on the trestle the clear box is the brief's 2.4 x 2.2 m over the rails.
//   revealDist   metres of our rail from the entry kept open as the reveal's own sight line (no beam or druse within it)
//   portalSeat   { position, normal, radius: 7, tilt }  centre of the 14 m portal in the well, 6 m above the water;
//                normal points back up the dive (the camera arrives travelling along -normal). Use portal tilt.
//   shaft        { bottom, top, radius }  axis of the daylight column.   sinkhole { position, radius }.
//   pool         { center, radius, y: 0 }.   lightSpot (where the column meets the water).
//   beamPass     { position, dist } a selenite beam 3.3 m above our rail on the helix (the "1 m over the lamp" beat).
//   fallPass     { position, dist } the thread waterfall 12.8 m inside our rail.   bucketPass { position, dist }.
//   viewpoints   { reveal, revealLook, low, lowLook, across }.
//
// Hooks: hero.setLamp(worldPos, worldDir, intensity = 1, halfAngleDeg = 24) lights every material with the cart's
//   carbide cone (range 30 m) and slides the white core inside the selenite; call it each frame, intensity 0 = off.
//   hero.setCloud(v) overrides the cloud edge (otherwise a 12 s ambient cycle on `time`); hero.uniforms holds all
//   shared uniforms (uCloud, uHaze, uGlint, uShaftCol, uAmbCol ...). Nothing here needs a progress value: every
//   scripted beat in this world belongs to the cart (world side); the piece's motion is ambient.
//
// Lighting: every material is a self-lit ShaderMaterial (linear HDR, scene fog honoured): a line light along the
//   shaft axis (blue-white, 1/d falloff, direct beam inside the column), cold sky ambient from above, a little
//   turquoise bounce off the pool, the lamp cone. No scene lights are needed and none are added. Expects bloom
//   (shaft, sky disc, blazing selenite and glints sit at 2-6). Keep the hero unscaled (rotation/translation only).
// Size: radius 95, height 195 (sinkhole neck to y = 193), centre (0, 80, 0).
// Cost: about 138k triangles (amethyst 94k, trestle 19k, shell and floor 19k), 11 draw calls, 150-350 ms build.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0B0716', '#3D2466', '#8A5BD6', '#EEF3FA', '#9CCBFF', '#2FD3C4', '#5A5560'];
const TAU = Math.PI * 2, V3 = THREE.Vector3;
const RX = 90, YC = 70, AU = 105, AD = 85;             // egg: half-width, widest height, upper / lower half-heights
const HR = 40, HR2 = 47.5, Y_TOP = 138, Y_BOT = 88, TURNS = 1.5, TH0 = 0;   // HR: our rail; HR2: the loose cart's rail, on the wall side of ours
// THE CLEAR SPACE round our rail, so that the cave is seen from the cart: no standing timber (leg, cap, brace, girt, chain,
// stop) comes within CLEAR metres of the eye line (EYE_H over the rail top, taken at every rail point, 1.5 m apart), save
// under the deck: below the rail top and no further toward the cave than DECK_IN from the rail's centre line (round the
// helix: no further than DECK_EDGE). Round the helix the cave is the inside of the curve and the wall side below the
// rail carries the second track and the towers; on the approach and the spur the cave lies on both hands.
const CLEAR = 6, DECK_IN = 1.6, EYE_H = 1.7;
// Our own deck stops DECK_EDGE from the rail's centre line on a cave side (just past the rail and its stringer): the
// rider looks down past the rail into the cave, not onto a shelf of sleeper ends and cap ends.
const DECK_EDGE = 0.72;
// the threads of water added round the helix fall on the wall side: no nearer the second track than THREAD_OUT (the
// loose cart, its deck and a thread's own spray stand clear of each other) and within THREAD_BAND of that line
const THREAD_OUT = 5, THREAD_BAND = 9;
const SHAFT_R = 15, PORTAL_R = 7;

// ---------------------------------------------------------------- shared GLSL
const GL_COMMON = /* glsl */`
uniform vec3 uShaftA, uShaftB, uShaftCol, uAmbCol, uPoolCol, uHazeCol, uLampCol, uCamL;
uniform vec4 uLampPos, uLampDir;
uniform float uShaftR, uCloud, uTime, uHaze, uGlint, uOutside, uLampRange;
uniform vec4 uPt[8]; uniform vec3 uPtCol, uDarkCol;
// 1 inside the egg, falling to 0 up the throat: the daylight never reaches the mine
float eggGate(vec3 P){ float a=P.y>70.0?105.0:85.0; float e=dot(P.xz,P.xz)/8100.0+(P.y-70.0)*(P.y-70.0)/(a*a); return 1.0-smoothstep(1.15,1.75,e); }
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
vec3 h33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=h33(i).x, b=h33(i+vec3(1,0,0)).x, c=h33(i+vec3(0,1,0)).x, d=h33(i+vec3(1,1,0)).x;
  float e=h33(i+vec3(0,0,1)).x, g=h33(i+vec3(1,0,1)).x, h=h33(i+vec3(0,1,1)).x, k=h33(i+vec3(1,1,1)).x;
  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z); }
vec3 shaftPoint(vec3 P){ vec3 ab=uShaftB-uShaftA; float t=clamp(dot(P-uShaftA,ab)/dot(ab,ab),0.0,1.0); return uShaftA+ab*t; }
// light of the geode at local point P with normal N: Lk = key direction, returns irradiance (linear HDR)
vec3 geodeLight(vec3 P, vec3 N, out vec3 Lk){
  vec3 toC=shaftPoint(P)-P; float d=length(toC);
  vec3 L=normalize(toC+vec3(0.0,0.45*d+1.0,0.0)); Lk=L;
  float atten=uShaftR*2.2/(uShaftR+d);
  float inCol=1.0-smoothstep(uShaftR*0.75,uShaftR*1.2,d);
  float ndl=max(dot(N,L)*0.72+0.28,0.0);
  float gate=eggGate(P);
  vec3 key=uShaftCol*(gate*uCloud*atten*(ndl+2.6*inCol*max(N.y*0.6+0.4,0.0)));
  vec3 amb=mix(uDarkCol,uAmbCol,gate)*(0.55+0.45*N.y);
  amb+=uPoolCol*(gate*0.22*uCloud*exp(-max(P.y,0.0)/28.0)*max(0.5-0.5*N.y,0.0));
  vec3 lp=uLampPos.xyz-P; float ld=length(lp); vec3 ll=lp/max(ld,1e-3);
  float cone=smoothstep(uLampDir.w,mix(uLampDir.w,1.0,0.45),dot(-ll,uLampDir.xyz));
  vec3 lamp=uLampCol*(uLampPos.w*cone*max(dot(N,ll)*0.8+0.2,0.0)/(1.0+ld*ld*0.003)*(1.0-smoothstep(uLampRange*0.73,uLampRange*1.13,ld)));
  lamp+=uLampCol*(uLampPos.w*0.16*max(dot(N,ll)*0.6+0.4,0.0)/(1.0+ld*ld*0.03));   // the flame's bare spill to every side: rock, timber and crystal beside the cart stand warm against the cold beyond
  vec3 pts=vec3(0.0);
  for(int i=0;i<8;i++){ vec3 dq=uPt[i].xyz-P; float r2=dot(dq,dq); vec3 lq=dq*inversesqrt(max(r2,1e-4)); pts+=uPtCol*(uPt[i].w*max(dot(N,lq)*0.7+0.3,0.0)/(1.0+r2*0.014)); }
  return key+amb+lamp+pts;
}
// hard facet glint: h = facet hash; a narrow band of phase is lit and the phase depends on the view direction
float facetGlint(vec3 V, float h, float sharp){
  vec3 g=normalize(vec3(fract(h*13.7),fract(h*71.3),fract(h*157.1))-0.5+vec3(1e-3));
  float ph=fract(h*31.7+dot(V,g)*7.0+uTime*0.06);
  return smoothstep(sharp,1.0,1.0-abs(ph*2.0-1.0));
}
vec3 applyHaze(vec3 col, vec3 P){
  float f=1.0-exp(-length(P-uCamL)*uHaze);
  vec3 hz=uHazeCol*(eggGate(P)*(0.4+0.6*uCloud)*(1.0+0.6*exp(-length(P-shaftPoint(P))/40.0)));
  return mix(col,hz,f);
}
`;
const VS_PARS = /* glsl */`
varying vec3 vP; varying vec3 vN;
#include <fog_pars_vertex>
vec3 instNormal(mat3 m, vec3 n){ return normalize(m*(n/vec3(dot(m[0],m[0]),dot(m[1],m[1]),dot(m[2],m[2])))); }
`;
const FS_PARS = /* glsl */`
varying vec3 vP; varying vec3 vN;
#include <fog_pars_fragment>
` + GL_COMMON;
const FS_END = /* glsl */`
  col=applyHaze(col,vP);
  gl_FragColor=vec4(col,1.0);
  #include <fog_fragment>
`;
// additive materials fade with fog instead of being tinted by it
const FS_ADD_FOG = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col*=exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      col*=1.0-smoothstep(fogNear,fogFar,vFogDepth);
    #endif
  #endif
`;

// ---------------------------------------------------------------- shell, floor rock, sinkhole neck, throat stub
const SHELL_VS = VS_PARS + /* glsl */`
attribute vec3 color; attribute vec3 aMat;
varying vec3 vC; varying vec3 vM;
void main(){
  vP=position; vN=normal; vC=color; vM=aMat;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHELL_FS = FS_PARS + /* glsl */`
uniform vec3 uRoot, uTip, uShadow, uGlowA, uGlowB, uCast2, uMilk; uniform float uGlowK; uniform vec4 uMouth, uHole2;
varying vec3 vC; varying vec3 vM;
vec4 vor(vec3 x){ vec3 i=floor(x), f=fract(x); float d1=8.0, d2=8.0; vec3 id=vec3(0.0);
  for(int a=-1;a<=1;a++) for(int b=-1;b<=1;b++) for(int c=-1;c<=1;c++){
    vec3 g=vec3(float(a),float(b),float(c)); vec3 o=h33(i+g); vec3 r=g+o-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; id=o; } else if(d<d2){ d2=d; } }
  return vec4(id,sqrt(d2)-sqrt(d1)); }
void main(){
  vec3 N=normalize(vN); vec3 toCam=uCamL-vP; vec3 V=normalize(toCam);
  if(uOutside>0.5 && dot(N,toCam)<0.0) discard;
  if(vM.z<0.5){
    float rag=vn3(vP*0.35)*2.0;
    if(vP.y>150.0 && length(vP-shaftPoint(vP))<uShaftR-1.0+rag) discard;
    if(distance(vP,uMouth.xyz)<uMouth.w+rag*0.6) discard;
    if(distance(vP,uHole2.xyz)<uHole2.w+rag*0.5) discard;
  }
  vec4 v1=vor(vP*0.3), v2=vor(vP*0.95+7.3);
  vec3 Lk; vec3 col;
  // crystal crust: every cell is a facet with its own tilt, dark at the seams (roots) and pale toward its middle (tip)
  vec3 Nf=normalize(N+(v1.xyz-0.5)*1.25+(v2.xyz-0.5)*0.7);
  float tipK=0.6*smoothstep(0.0,0.55,v1.w)+0.4*smoothstep(0.0,0.4,v2.w);
  float ndv=max(dot(Nf,V),0.0);
  vec3 alb=mix(uShadow*0.9+uRoot*0.55,mix(uRoot*1.3,uTip,0.3+0.3*v2.y),tipK)*(0.62+0.76*v1.x);
  alb=mix(alb,uTip,0.25*pow(1.0-ndv,3.0));
  // the mineral is not one colour: zones where this geode's second mineral has grown instead, and agate bands in the
  // rind, pale and smoky, lying nearly level round the egg
  float z2=smoothstep(0.5,0.68,vn3(vP*0.022+vec3(9.0,3.0,5.0)));
  alb=mix(alb,mix(uCast2*0.22,uCast2,tipK)*(0.62+0.76*v1.x),z2*0.85);
  float band=smoothstep(0.6,0.92,0.5+0.5*sin(vP.y*0.42+vn3(vP*0.035+vec3(4.0,1.0,7.0))*7.0));
  alb=mix(alb,mix(uMilk*0.4,uTip,0.3)*(0.5+0.6*v2.x),band*0.5);
  vec3 E=geodeLight(vP,Nf,Lk);
  float lum=dot(E,vec3(0.3,0.5,0.2));
  float inner=smoothstep(0.4,0.95,dot(reflect(-V,Nf),Lk))*tipK;               // the bright inner face of a facet turned to the light
  // sparse hard points of light: under 2% of the small cells, only at the heart of the cell, and they travel with the view
  float gsel=step(0.965,fract(v2.z*7.13+v2.x*3.1));
  float gl=facetGlint(V,v2.x+v1.y*3.1,0.9)*gsel*smoothstep(0.34,0.5,v2.w);
  vec3 crust=alb*mix(vec3(lum),E,0.4)/(1.0+0.45*lum)*vC*(1.45+0.7*inner)+mix(uTip,vec3(1.0),0.6)*(gl*uGlint*(0.2+lum)*5.0);
  // pockets of druse 10 m across: the wall holds light of its own at their hearts, so it has structure at 100 m
  vec4 v3=vor(vP*0.09+3.1);
  float pocket=smoothstep(0.16,0.7,v3.w);
  crust*=0.62+0.5*v3.y+0.35*pocket;
  crust+=mix(mix(uGlowA,uGlowB,0.3*tipK),uCast2*1.3,z2*0.8)*(uGlowK*0.25*pocket*(0.35+0.65*v3.x)*(0.45+0.75*tipK)*(0.6+0.4*uCloud)*eggGate(vP));
  // rock and moss round the pool: wet, seamed, mossed wherever the daylight lands
  float rn=vn3(vP*0.8)*0.5+vn3(vP.zxy*3.1+2.0)*0.3+vn3(vP.yzx*9.7+5.0)*0.2;
  float seam=1.0-abs(2.0*(vn3(vP*0.42+13.0)*0.6+vn3(vP.zxy*1.3+4.0)*0.4)-1.0);
  vec3 ralb=mix(vec3(0.035,0.032,0.05),vec3(0.24,0.23,0.29),rn)*vC*(1.0-0.55*smoothstep(0.86,0.97,seam));
  float mossK=clamp(vM.y*1.5,0.0,1.0)*smoothstep(0.2,0.5,rn+vM.y*0.6);
  ralb=mix(ralb,mix(vec3(0.04,0.20,0.06),vec3(0.34,0.60,0.12),rn),mossK);
  vec3 Nr=normalize(N+(vec3(vn3(vP*1.7),vn3(vP*1.7+9.1),vn3(vP*1.7+4.7))-0.5)*1.1+(vec3(vn3(vP*6.3),vn3(vP*6.3+3.1),vn3(vP*6.3+7.7))-0.5)*0.5);
  vec3 Er=geodeLight(vP,Nr,Lk);
  float wet=(1.0-mossK)*(0.35+0.65*smoothstep(0.45,0.7,vn3(vP*0.5+21.0)));
  float rsp=pow(max(dot(reflect(-V,Nr),Lk),0.0),28.0)*wet;
  vec3 rock=ralb*Er+(uShaftCol*uCloud*eggGate(vP)+uLampCol*0.2)*(rsp*0.16)*min(dot(Er,vec3(0.3,0.5,0.2)),2.0);
  col=mix(crust,rock,vM.x);
` + FS_END + '}';

// ---------------------------------------------------------------- amethyst points (instanced)
const CRYSTAL_VS = VS_PARS + /* glsl */`
attribute vec3 aInst;                       // seed, hue shift, brightness
varying vec3 vI; varying float vH; varying vec3 vNl; varying vec3 vLp; varying float vLen; varying float vFh;
uniform vec3 uCamL; uniform float uOutside;
void main(){
  vec4 lp=instanceMatrix*vec4(position,1.0);
  vec3 root=instanceMatrix[3].xyz;
  // cut-away: seen from outside the egg, the crystals of the near wall are folded away
  float hide=step(0.5,uOutside)*step(dot(vec3(0.0,70.0,0.0)-root,uCamL-root),0.0);
  lp.xyz=mix(lp.xyz,root,hide);
  vP=lp.xyz; vN=instNormal(mat3(instanceMatrix),normal); vI=aInst; vH=position.y; vNl=normal; vLp=position; vLen=length(instanceMatrix[1].xyz);
  vFh=fract(sin((aInst.x*17.0+dot(floor(normal*2.6+0.5),vec3(1.0,5.0,11.0)))*12.9898)*43758.5453);   // one hash per facet, made here: the same at all three corners
  vec4 mvPosition=modelViewMatrix*lp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CRYSTAL_FS = FS_PARS + /* glsl */`
uniform vec3 uRoot, uTip, uShadow, uGlowA, uGlowB, uCast2; uniform float uGlowK;
varying vec3 vI; varying float vH; varying vec3 vNl; varying vec3 vLp; varying float vLen; varying float vFh;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCamL-vP);
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  float fh=vFh;                                                              // one hash per facet
  float big=step(1.5,vI.y), hueV=vI.y-2.0*big;                               // the great druses (hue + 2) hold light of their own
  float h=smoothstep(0.05,0.95,vH);
  vec3 tip=mix(uTip,uTip.brg,hueV*0.35);                                     // per-crystal hue lean
  float z2=smoothstep(0.5,0.68,vn3(vP*0.022+vec3(9.0,3.0,5.0)));             // where the second mineral has grown (the wall's own zones)
  tip=mix(tip,uCast2,z2*0.85); vec3 rootC=mix(uRoot,uCast2*0.25,z2*0.85);
  vec3 body=mix(uShadow+rootC*0.3,rootC*1.35,smoothstep(0.0,0.5,vH));
  float dCam=length(uCamL-vP);
  float farK=smoothstep(35.0,110.0,dCam);                        // far walls: calmer facets, no confetti
  body=mix(body,tip*1.1,smoothstep(0.45,1.0,vH)*(1.0-0.55*farK))*mix(0.6+0.65*fh,0.92,farK*0.75)*vI.z;
  float ndv=max(dot(N,V),0.0);
  float fres=pow(1.0-ndv,3.0);
  vec3 R=reflect(-V,N);
  float inner=smoothstep(0.35,0.95,dot(R,Lk))*(0.3+0.7*h)*(1.0-mix(0.8,0.35,big)*farK);    // the bright inner face
  float back=pow(max(dot(-V,Lk),0.0),3.0)*h;                                 // tips backlit by the shaft
  float lum=dot(E,vec3(0.3,0.5,0.2));
  vec3 Ec=mix(vec3(lum),E,0.4)/(1.0+0.55*lum);                               // keep the violet: daylight only tints it, and never bleaches it
  vec3 col=body*Ec*(1.7+0.8*inner)+tip*(lum/(1.0+0.55*lum))*(0.16*fres*(1.0-0.75*farK)+0.3*back*(1.0-0.7*farK));
  col+=tip*((1.0-eggGate(vP))*0.24*(0.2+0.8*h)*(0.5+0.8*fh));              // in the dark of the mine a point keeps a breath of its own colour: never a black lump
  col*=mix(1.0,0.5,farK*(1.0-smoothstep(1.5,5.0,vLen)));                      // small far points sink into the crust
  // a facet that catches the light brightens a little all over and carries one small hard gleam
  float gl=facetGlint(V,fh+vI.x,0.87)*(1.0-0.97*farK);
  vec2 nn=normalize(vNl.xz+vec2(1e-4));
  vec2 gxz=nn*0.85+vec2(-nn.y,nn.x)*((fract(fh*5.1)-0.5)*0.6);
  vec3 gd=(vLp-vec3(gxz.x,0.1+0.8*fract(fh*7.3+vI.x*3.1),gxz.y))*vec3(1.0,2.6,1.0);
  float gspot=(1.0-smoothstep(0.06,0.5,length(gd)))*smoothstep(2.5,6.0,dCam);   // close facets are clean gradients
  col+=mix(tip,vec3(1.0),0.7)*(gl*gspot*uGlint*(0.3+lum)*7.0)+tip*(gl*uGlint*lum*0.45);
  // light transmitted through the body of a great crystal: strongest on the faces turned to the eye, rising to the tip,
  // breathing slowly, each on its own; it is the wall's own colour and it holds at any distance
  float ndc=clamp(ndv,0.0,1.0);
  float coreG=(0.18+0.82*ndc*ndc)*smoothstep(0.08,0.8,vH)*(0.75+0.5*fh);
  float breath=0.82+0.18*sin(uTime*0.5+vI.x*40.0);
  col+=mix(mix(uGlowA,uGlowB,smoothstep(0.25,1.0,vH)),uCast2*1.25,z2*0.8)*(big*uGlowK*coreG*breath*(0.7+0.7*fract(vI.x*5.3))*(0.6+0.4*uCloud)*(0.5+0.5*eggGate(vP)));   // half as strong in the mine, where the points are small and close
` + FS_END + '}';

// ---------------------------------------------------------------- selenite beams and portal collar (instanced)
const SELENITE_VS = VS_PARS + /* glsl */`
attribute vec4 aSel;                        // seed, blaze 0..1, length (m), point along the beam nearest the shaft
varying vec4 vS; varying vec3 vL; varying vec3 vLampK; varying vec3 vAxP; varying vec4 vAxD;
uniform vec4 uLampPos;
void main(){
  vec4 lp=instanceMatrix*vec4(position,1.0);
  vP=lp.xyz; vN=instNormal(mat3(instanceMatrix),normal); vS=aSel; vL=position;
  vAxP=instanceMatrix[3].xyz; vAxD=vec4(normalize(instanceMatrix[1].xyz+vec3(0.0,1e-5,0.0)),0.5*min(length(instanceMatrix[0].xyz),length(instanceMatrix[2].xyz)));
  // nearest point of the beam axis to the lamp: (t along 0..1, distance, -)
  vec3 a=(instanceMatrix*vec4(0.0,-0.5,0.0,1.0)).xyz, ax=instanceMatrix[1].xyz;
  float t=clamp(dot(uLampPos.xyz-a,ax)/max(dot(ax,ax),1e-4),0.0,1.0);
  vLampK=vec3(t,length(uLampPos.xyz-(a+ax*t)),0.0);
  vec4 mvPosition=modelViewMatrix*lp;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SELENITE_FS = FS_PARS + /* glsl */`
uniform vec3 uMilk;
varying vec4 vS; varying vec3 vL; varying vec3 vLampK; varying vec3 vAxP; varying vec4 vAxD;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCamL-vP);
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  float al=vL.y+0.5;                                                         // 0..1 along the beam
  float st=vn3(vec3(vL.x*26.0+vS.x*9.0,vL.y*vS.z*0.25,vL.z*26.0));           // striations run the length
  float st2=vn3(vec3(vL.x*90.0,vL.y*vS.z*0.06+vS.x,vL.z*90.0));
  float cleave=smoothstep(0.62,0.7,vn3(vec3(vL.x*3.0+vS.x*5.0,vL.y*vS.z*0.045,vL.z*3.0)));   // long cleavage planes
  float ndv=max(dot(N,V),0.0);
  float fres=pow(1.0-ndv,2.5);
  // inside the crystal: feathered veils lying along the beam, read at two depths under the face, so they slide behind
  // the surface as the eye passes
  vec3 rel=vP-vAxP; vec3 q1=rel-V*(vAxD.w*0.5), q2=rel-V*(vAxD.w*1.1);
  float y1=dot(q1,vAxD.xyz), y2=dot(q2,vAxD.xyz);
  float veil=0.6*smoothstep(0.45,0.8,vn3((q1-vAxD.xyz*y1)*1.6+vAxD.xyz*(y1*0.09)+vS.x*31.0))+0.4*smoothstep(0.5,0.85,vn3((q2-vAxD.xyz*y2)*2.3+vAxD.xyz*(y2*0.13)+vS.x*57.0));
  // faces: the face turned to a light carries it and the face turned away keeps half
  vec3 ll=normalize(uLampPos.xyz-vP+vec3(0.0,1e-4,0.0));
  float faceL=mix(0.5,1.2,smoothstep(-0.3,0.8,dot(N,ll))), faceD=mix(0.55,1.15,smoothstep(-0.3,0.8,dot(N,Lk)));
  vec3 alb=uMilk*(0.30+0.30*st+0.13*st2+0.07*cleave)*(0.8+0.45*veil);
  vec3 Lk2; vec3 Em=E+0.3*geodeLight(vP,-N,Lk2);                             // light passes through the crystal
  Em/=1.0+1.15*dot(Em,vec3(0.3,0.5,0.2));                                    // a milky solid: it never clips to paper white
  vec3 col=alb*mix(vec3(dot(Em,vec3(0.3,0.5,0.2))),Em,0.7)*(0.8+0.5*fres)+uMilk*uAmbCol*1.2;
  // how near the line of sight passes to the beam's own axis: the glow is a core seen through a translucent body
  vec3 cx=cross(V,vAxD.xyz); float cl=max(length(cx),1e-3);
  float bq=abs(dot(vP-vAxP,cx))/(cl*max(vAxD.w,1e-3));
  float line=exp(-bq*bq*5.5);
  float body=0.22+0.24*ndv;
  // light pipe: daylight entering where the beam crosses the column, carried the whole length and out of the ends
  float dS=(al-vS.w)*vS.z;
  float ends=smoothstep(0.42,0.5,abs(vL.y));
  float core=vS.y*uCloud*(0.42+0.85*exp(-dS*dS/90.0)+0.6*ends);
  core=1.4*core/(1.0+core);
  vec3 day=mix(uShaftCol*0.55,uMilk,0.3)*core*(body+1.25*line+0.5*ends);
  // the lamp: a white core sliding along beside the cart, and the far ends lighting like windows
  float dL=(al-vLampK.x)*vS.z;
  float lampIn=uLampPos.w*(1.0-smoothstep(10.0,32.0,vLampK.y));
  float lc=lampIn*(0.85*exp(-dL*dL/40.0)+0.07+1.0*smoothstep(0.44,0.5,abs(vL.y)));
  lc=1.5*lc/(1.0+lc);
  vec3 lampG=uMilk*lc*(body*0.9+1.2*line+0.6*ends);
  col+=(day*faceD+lampG*faceL)*(0.45+0.9*st)*(0.72+0.6*veil);
  // the six long edges of the prism catch the lamp: a warm line where the edge turns between the flame and the eye
  float ed=abs(fract((atan(vL.z,vL.x+1e-5)-0.26)*0.9549297+0.5)-0.5);         // 0 on an edge, 0.5 in the middle of a face
  float edge=(1.0-smoothstep(0.012,0.05,ed))*(1.0-ends)*(1.0-smoothstep(25.0,60.0,length(uCamL-vP)));
  vec3 rad=normalize(rel-vAxD.xyz*dot(rel,vAxD.xyz)+vec3(1e-4));
  col+=uLampCol*(lampIn*edge*(0.05+0.45*pow(max(dot(rad,normalize(ll+V)),0.0),5.0)))+uMilk*(edge*0.2*dot(Em,vec3(0.3,0.5,0.2)));
` + FS_END + '}';

// ---------------------------------------------------------------- trestle timber, rails, chains (instanced boxes)
const TIMBER_VS = VS_PARS + /* glsl */`
attribute vec3 aTim;                        // seed, kind (0 timber, 1 iron, 2 rail), -
uniform float uPx;
varying vec3 vT; varying vec3 vL; varying float vF;
void main(){
  mat3 m=mat3(instanceMatrix);
  vec3 ax=(instanceMatrix*vec4(0.0,position.y,0.0,1.0)).xyz;
  vec3 off=m*vec3(position.x,0.0,position.z);
  float w=min(length(m[0]),length(m[2]));
  vec4 mvC=modelViewMatrix*vec4(ax,1.0);
  float dz=max(-mvC.z,0.1);
  float keep=1.0-step(0.5,aTim.z)*step(fract(aTim.x*7.31),0.5)*smoothstep(45.0,85.0,dz);   // far turns carry less bracing
  float f=max(1.0,mix(1.15,0.8,smoothstep(45.0,110.0,dz))*dz/(uPx*w))*keep;   // about a pixel wide at least; finer far off
  vec3 lp=ax+off*f;
  vP=lp; vN=instNormal(m,normal); vT=aTim; vF=1.0/max(f,1.0);
  vL=vec3(position.x*length(m[0]),position.y*length(m[1]),position.z*length(m[2]));
  vec4 mvPosition=modelViewMatrix*vec4(lp,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const TIMBER_FS = FS_PARS + /* glsl */`
uniform vec3 uTimber, uMilk, uRoot;
varying vec3 vT; varying vec3 vL; varying float vF;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCamL-vP);
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  float grain=vn3(vec3(vL.x*9.0+vT.x*31.0,vL.y*0.7,vL.z*9.0))*0.6+vn3(vec3(vL.x*30.0,vL.y*2.5+vT.x*7.0,vL.z*30.0))*0.4;
  vec3 wood=mix(uTimber,uMilk,0.08)*(0.55+0.55*grain)*(0.8+0.4*vT.x);
  vec3 iron=vec3(0.035,0.036,0.045)*(0.7+0.6*grain);
  vec3 rail=vec3(0.16,0.17,0.2);
  float isIron=step(0.5,vT.y)*(1.0-step(1.5,vT.y)), isRail=step(1.5,vT.y);
  vec3 alb=mix(mix(wood,iron,isIron),rail,isRail);
  float gate=eggGate(vP);
  E/=1.0+0.7*dot(E,vec3(0.3,0.5,0.2))*max(gate,0.75);                        // weathered grey, never chalk white in the column or the lamp
  E+=uShaftCol*(uCloud*gate*(0.08+0.22*max(-N.y,0.0)));                       // daylight off the mist and the pool finds the backs and undersides
  vec3 lq=uLampPos.xyz-vP;
  E+=uLampCol*(uLampPos.w*0.3/(1.0+dot(lq,lq)*0.06));                         // the deck and the rails under the cart stand in the flame's glow on every face: never a black bar against the lit cave
  vec3 col=alb*(E+uAmbCol*0.6);
  float fres=pow(1.0-max(dot(N,V),0.0),3.0);
  col+=(isIron*0.10+isRail*0.5*max(N.y,0.0))*fres*uShaftCol*uCloud*0.5;
  col*=mix(1.0,vF,0.5);
  // aerial perspective inside the egg: far members sink toward the colour of the wall, a mid-dark violet silhouette
  // against the lit druses, so the trestle reads in depth and never as a white wire lattice
  float dC=length(uCamL-vP);
  float air=gate*smoothstep(14.0,mix(64.0,46.0,step(0.5,vT.z)),dC)*mix(0.8,0.93,step(0.5,vT.z));
  col=mix(col,(uHazeCol*(0.35+0.15*uCloud)+uRoot*0.5)*(0.5+0.3*grain),air*0.75);
` + FS_END + '}';

// ---------------------------------------------------------------- the pool
const POOL_VS = VS_PARS + /* glsl */`
attribute float aShore; varying float vShore;
void main(){
  vP=position; vN=normal; vShore=aShore;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const POOL_FS = FS_PARS + /* glsl */`
uniform vec4 uRing[6]; varying float vShore;
float wav(vec2 p){
  float s=(vn3(vec3(p*0.33,uTime*0.22))-0.5)*0.9+(vn3(vec3(p*1.3+4.0,uTime*0.5))-0.5)*0.3;
  for(int i=0;i<6;i++){ float d=length(p-uRing[i].xy); s+=uRing[i].z*sin(d*uRing[i].w-uTime*2.4+float(i)*1.7)*exp(-d*0.09);
    // a blind fish rises: one ring opens from the same spot every few seconds and dies as it spreads
    float age=fract(uTime*0.085+float(i)*0.37), rr=d-age*9.0; s+=1.5*(1.0-age)*(1.0-age)*sin(rr*4.2)*exp(-rr*rr*0.9); }
  return s;
}
void main(){
  vec2 p=vP.xz; float e=0.25;
  float w0=wav(p), wx=wav(p+vec2(e,0.0)), wz=wav(p+vec2(0.0,e));
  vec3 N=normalize(vec3(-(wx-w0)/e*0.35,1.0,-(wz-w0)/e*0.35));
  vec3 V=normalize(uCamL-vP);
  float fres=0.04+0.96*pow(1.0-max(dot(N,V),0.0),4.0);
  vec2 q=p-uShaftA.xz; float oval=exp(-dot(q,q)/(2.0*10.5*10.5));
  float caust=pow(abs(sin(w0*7.0+p.x*0.6))*abs(sin(w0*5.0-p.y*0.7+1.3)),3.0);
  vec3 deep=uPoolCol*(0.10+0.06*w0);
  vec3 col=deep*(uAmbCol*6.0+uShaftCol*uCloud*0.5);
  col+=uPoolCol*uCloud*oval*(2.3+2.2*caust+0.8*w0);
  col+=uShaftCol*uCloud*oval*oval*(0.8+1.5*caust);
  vec3 R=reflect(-V,N); vec3 toHole=normalize(uShaftB-vP);
  float spec=pow(max(dot(R,toHole),0.0),220.0);
  vec3 roof=mix(uHazeCol*0.9,uShaftCol*0.5*uCloud,smoothstep(0.75,0.99,dot(R,toHole)));
  col=mix(col,roof,fres*0.7)+uShaftCol*uCloud*spec*9.0;
  // the daylight column mirrored in the water: how near the reflected ray passes to the column's axis
  vec3 ab=uShaftB-uShaftA; vec3 rn=cross(R,ab); float miss=abs(dot(uShaftA-vP,rn))/max(length(rn),1e-3);
  col+=uShaftCol*uCloud*(0.16*(1.0-smoothstep(uShaftR*0.5,uShaftR*1.15,miss))*step(0.0,R.y)*(0.4+0.6*fres));
  // a tarn (water above the pool's level) holds the daylight in its milky water, more the nearer it lies to the column
  col+=uPoolCol*(step(0.05,vP.y)*uCloud*(0.5*uShaftR/(uShaftR+length(q)))*(0.75+0.5*w0));
  col=applyHaze(col,vP);
  gl_FragColor=vec4(col,smoothstep(0.0,1.0,vShore));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- daylight column and the blade from the second hole (additive)
const SHAFT_VS = VS_PARS + /* glsl */`
attribute vec3 aK; varying vec3 vK;        // v along (0 bottom..1 top), strength, angle
void main(){
  vP=position; vN=normal; vK=aK;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FS = FS_PARS + /* glsl */`
uniform vec3 uMilk;
varying vec3 vK;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCamL-vP);
  float wk=step(5.0,vK.y), wk0=wk;                                            // strength >= 5 marks the plume over the well
  float face=abs(dot(N,V));
  float soft=face*face*(3.0-2.0*face); soft*=soft;                              // a bright core, a transparent rim
  float rays=0.25+0.75*vn3(vec3(vK.z*5.0,vK.x*1.3-uTime*0.012,2.0))+0.45*vn3(vec3(vK.z*17.0,vK.x*2.0-uTime*0.02,7.0));
  rays=mix(rays,0.9,wk0*0.5);
  float mist=0.7+0.6*vn3(vec3(vP.xz*0.06,vP.y*0.035+uTime*0.07));
  float ends=smoothstep(0.0,0.05,vK.x)*(0.55+0.45*vK.x);
  ends=mix(ends,smoothstep(0.0,0.06,vK.x)*(1.0-vK.x)*(1.0-vK.x),wk);
  vec3 col=mix(uShaftCol*uCloud,(uPoolCol*1.3+uMilk*0.9)*(0.75+0.25*uCloud),wk)*(mix(0.088,0.125,wk)*(vK.y-10.0*wk)*(1.0+0.5*wk)*mix(soft,sqrt(soft),wk)*rays*mist*ends);
` + FS_ADD_FOG + /* glsl */`
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- the discs of sky in the two sinkholes
const SKY_VS = VS_PARS + /* glsl */`
void main(){
  vP=position; vN=normal;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SKY_FS = FS_PARS + /* glsl */`
uniform float uCloudPos, uStars; uniform vec3 uSkyA, uSkyB;
void main(){
  vec2 p=vP.xz-uShaftB.xz;
  float edge=p.x*0.8+p.y*0.6+(vn3(vec3(vP.xz*0.16,uTime*0.03))-0.5)*14.0+(vn3(vec3(vP.xz*0.5,3.0))-0.5)*5.0;
  float cl=smoothstep(-4.0,5.0,edge-uCloudPos);
  vec3 cell=floor(vec3(vP.xz*1.7,3.0));
  float star=step(0.93,h33(cell).x)*(1.0-smoothstep(0.05,0.32,length(fract(vP.xz*1.7)-0.5)))*(0.6+0.4*sin(uTime*(1.5+3.0*h33(cell).y)+h33(cell).z*40.0));
  vec3 blue=uSkyA+vec3(0.8,0.9,1.0)*(uStars*star*6.0);
  vec3 white=uSkyB*(1.0-0.33*smoothstep(4.0,22.0,edge-uCloudPos));
  gl_FragColor=vec4(mix(blue,white,cl),1.0);
}`;

// ---------------------------------------------------------------- mist, moths, leaves, waterfall smoke (points)
const POINTS_VS = /* glsl */`
attribute vec4 aPt;                         // type, seed, size (m), speed
uniform vec3 uShaftA, uShaftB; uniform float uTime, uPx, uCloud;
varying vec4 vPt; varying float vA;
#include <fog_pars_vertex>
void main(){
  float ty=aPt.x, sd=aPt.y; vec3 p=position; float a=1.0; float size=aPt.z;
  if(ty<2.5){                                // in the column: position = (radius, y0, angle)
    float span=uShaftB.y-uShaftA.y-6.0;
    float y=mod(position.y-uTime*aPt.w,span)+2.0;
    float ang=position.z+uTime*(0.05+0.12*fract(sd*7.0))*(ty>0.5?1.0:0.3)+sin(uTime*0.4+sd*40.0)*0.3*step(0.5,ty);
    vec3 ax=uShaftA+(uShaftB-uShaftA)*((y-uShaftA.y)/(uShaftB.y-uShaftA.y));
    float r=position.x+sin(uTime*0.7+sd*91.0)*1.2*step(0.5,ty);
    p=vec3(ax.x+cos(ang)*r,y,ax.z+sin(ang)*r);
    a=smoothstep(0.0,8.0,y)*(1.0-smoothstep(span-10.0,span,y));
    if(ty>0.5&&ty<1.5) a*=0.55+0.45*sin(uTime*(9.0+sd*8.0)+sd*60.0);          // moth wing flicker
    if(ty>1.5) a*=0.5+0.5*abs(sin(uTime*(3.0+sd*3.0)+sd*20.0));                // leaf spin
  } else if(ty<3.5){                         // smoke where a thread fall lands
    float life=fract(uTime*0.16*aPt.w+sd);
    p+=vec3(sin(sd*40.0+life*2.0)*(1.0+3.5*life),life*(3.0+4.0*fract(sd*9.0)),cos(sd*23.0+life*2.0)*(1.0+3.5*life));
    size*=0.5+1.3*life; a=smoothstep(0.0,0.15,life)*(1.0-life);
  } else {                                   // a miner's lamp: it stands where it was hung and its flame wavers
    a=0.86+0.14*sin(uTime*(9.0+sd*7.0)+sd*40.0)*sin(uTime*5.3+sd*17.0);
  }
  vPt=aPt; vA=a*(ty>3.5?1.0:0.5+0.5*uCloud);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  gl_PointSize=clamp(size*uPx/max(-mvPosition.z,0.5),ty>3.5?2.5:1.0,90.0);
  #include <fog_vertex>
}`;
const POINTS_FS = /* glsl */`
uniform vec3 uShaftCol, uMilk, uWarm;
varying vec4 vPt; varying float vA;
#include <fog_pars_fragment>
void main(){
  vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0;
  float ty=vPt.x; vec3 col;
  if(ty<0.5){ float s=1.0-smoothstep(0.0,1.0,d); col=uShaftCol*(0.038*s*s); }                  // mist
  else if(ty<1.5){ float s=1.0-smoothstep(0.25,1.0,max(abs(c.x)*1.3,abs(c.y)*3.0)*2.0); col=uMilk*(1.6*s); }   // moth
  else if(ty<2.5){ float s=1.0-smoothstep(0.3,1.0,d); col=vec3(0.45,0.8,0.25)*(0.7*s); }      // leaf
  else if(ty<3.5){ float s=1.0-smoothstep(0.0,1.0,d); col=mix(uShaftCol,uMilk,0.5)*(0.085*s*s); }       // smoke
  else { col=uWarm*((exp(-d*d*6.0)*0.55+exp(-d*d*70.0)*3.2)*(1.0-smoothstep(0.85,1.0,d))); }  // lamp: a warm flame in its own glow
  col*=vA;
` + FS_ADD_FOG + /* glsl */`
  gl_FragColor=vec4(col,1.0);
}`;

// ---------------------------------------------------------------- swiftlets circling in the column (one merged mesh)
const BIRD_VS = /* glsl */`
attribute vec4 aBird;                       // radius, y0, angle0, seed
attribute float aWing;
uniform vec3 uShaftA, uShaftB; uniform float uTime, uPx;
#include <fog_pars_vertex>
void main(){
  float sd=aBird.w, dir=sd>0.3?1.0:-1.0;
  float ang=aBird.z+uTime*(0.32+0.3*fract(sd*13.0))*dir;
  float dip=pow(max(sin(uTime*0.11+sd*33.0),0.0),6.0);                        // now and then one dips toward the pool
  float y=mix(aBird.y+sin(uTime*0.35+sd*20.0)*7.0,10.0+sd*10.0,dip*step(0.7,fract(sd*5.0)));
  float r=aBird.x*(0.8+0.2*sin(uTime*0.23+sd*50.0));
  vec3 ax=uShaftA+(uShaftB-uShaftA)*((y-uShaftA.y)/(uShaftB.y-uShaftA.y));
  vec3 c=vec3(ax.x+cos(ang)*r,y,ax.z+sin(ang)*r);
  vec3 fw=vec3(-sin(ang),0.0,cos(ang))*dir, rt=vec3(cos(ang),0.0,sin(ang));
  vec4 mvC=modelViewMatrix*vec4(c,1.0);
  float s=max(1.0,1.6*max(-mvC.z,0.1)/(uPx*0.9))*smoothstep(3.0,10.0,-mvC.z);   // keep a fleck at any distance; none in the lens
  float flap=sin(uTime*(13.0+sd*5.0)+sd*90.0);
  vec3 lp=position*s; lp.y+=aWing*flap*0.45*s;
  vec3 p=c+rt*lp.x*dir+vec3(0.0,lp.y,0.0)+fw*lp.z+rt*(-0.35*abs(lp.x)*dir*0.0);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FS = /* glsl */`
uniform vec3 uBirdCol;
#include <fog_pars_fragment>
void main(){
  gl_FragColor=vec4(uBirdCol,1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- ribbons: thread falls, roots, ferns, horsetails, cable
const RIBBON_VS = VS_PARS + /* glsl */`
attribute vec3 aDir; attribute vec4 aRib;   // tangent; (side * half width, kind, along 0..1, seed)
uniform vec3 uCamL; uniform float uPx, uTime, uFallK;
varying vec4 vR; varying float vSide;
void main(){
  vec3 p=position; float kind=aRib.y, al=aRib.z, sd=aRib.w;
  if(kind>0.5&&kind<1.5){ float sw=al*al*1.6; p.x+=sin(uTime*0.6+sd*30.0+al*3.0)*sw; p.z+=cos(uTime*0.47+sd*17.0+al*2.3)*sw; }   // roots sway
  if(kind>2.5){ float sw=al*al*0.5; p.x+=sin(uTime*1.1+sd*30.0)*sw; p.z+=cos(uTime*0.9+sd*17.0)*sw; }                         // fronds and horsetails
  vec3 toC=uCamL-p;
  vec3 sideV=normalize(cross(aDir,toC)+vec3(1e-4));
  vec4 mvC=modelViewMatrix*vec4(p,1.0);
  float hw=max(abs(aRib.x)*(kind<0.5?uFallK:1.0),(kind<0.5?2.0:0.75)*max(-mvC.z,0.1)/uPx);
  p+=sideV*sign(aRib.x)*hw;
  vP=p; vN=normalize(cross(sideV,aDir)+vec3(1e-4)); vR=aRib; vSide=sign(aRib.x);
  vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIBBON_FS = FS_PARS + /* glsl */`
uniform vec3 uMilk; uniform float uFrozen, uFallK;
varying vec4 vR; varying float vSide;
void main(){
  float kind=vR.y, al=vR.z, sd=vR.w;
  vec3 N=normalize(vN); vec3 Lk; vec3 E=geodeLight(vP,N,Lk)+geodeLight(vP,-N,Lk);
  vec3 col;
  if(kind<0.5){                                                               // thread waterfall
    float len=vR.z;                                                           // metres fallen
    float ice=step(h11(sd*3.7+0.31),uFrozen);                                  // winter: this fall is a frozen organ pipe
    float run=uTime*(1.0-ice);
    float st=vn3(vec3(vSide*2.2+sd*9.0,len*0.22-run*(3.2+len*0.03),sd*5.0));
    float st2=vn3(vec3(vSide*6.0,len*0.7-run*7.0,sd*3.0));
    float body=(1.0-vSide*vSide*0.7)*(0.45+0.55*st)*(0.6+0.4*st2)*(0.75+0.25*uFallK);
    body=mix(body,0.55+0.45*abs(sin(vSide*9.0+sd*20.0))*(0.7+0.3*st),ice);
    float strand=vn3(vec3(vSide*5.0+sd*13.0,len*0.05-run*0.4,sd*7.0));         // the thread parts into strands: gaps open and close down its length
    if(body<0.3+0.24*strand*(1.0-ice)) discard;
    vec3 Ew=E/(1.0+0.4*dot(E,vec3(0.3,0.5,0.2)));                              // water in the column is bright and keeps its streaks: never one white bar
    col=mix(uShaftCol,uMilk,0.6+0.3*ice)*(0.5*Ew+uAmbCol*2.0)*((0.8+2.3*body*body)*(1.0-0.6*ice))+mix(uShaftCol,uMilk,0.5)*(uCloud*eggGate(vP)*0.14*body);
  } else if(kind<1.5){ col=mix(vec3(0.07,0.05,0.045),vec3(0.16,0.14,0.11),h11(sd*7.0))*E*0.5; }      // roots
  else if(kind<2.5){ col=vec3(0.04,0.04,0.05)*E*0.5; }                                                // rope
  else if(kind<3.5){ col=mix(vec3(0.03,0.16,0.04),vec3(0.2,0.5,0.1),al)*E*0.5*(0.7+0.6*h11(sd*3.0)); }   // fern
  else { col=mix(vec3(0.2,0.36,0.2),vec3(0.6,0.78,0.5),al)*E*0.5/(1.0+0.12*dot(E,vec3(0.3,0.5,0.2))); }                                   // horsetail
` + FS_END + '}';

// ---------------------------------------------------------------- cableway buckets (instanced, travel in the shader)
const BUCKET_VS = VS_PARS + /* glsl */`
attribute vec2 aBk;                         // phase, seed
uniform vec3 uCabA, uCabB, uCabSide; uniform float uCabSag, uTime;
void main(){
  float u=fract(aBk.x+uTime*0.012);
  float s=u<0.5?u*2.0:2.0-u*2.0; float lane=u<0.5?1.0:-1.0;
  vec3 c=mix(uCabA,uCabB,s)+uCabSide*lane; c.y-=uCabSag*4.0*s*(1.0-s);
  vec3 fw=normalize(uCabB-uCabA), rt=normalize(uCabSide);
  float sw=sin(uTime*1.25+aBk.y*40.0)*0.13;
  vec3 lp=position*vec3(1.6,1.3,1.6); lp.xy=vec2(lp.x*cos(sw)-lp.y*sin(sw),lp.x*sin(sw)+lp.y*cos(sw));
  vec3 ln=normal; ln.xy=vec2(ln.x*cos(sw)-ln.y*sin(sw),ln.x*sin(sw)+ln.y*cos(sw));
  vP=c+rt*lp.x+vec3(0.0,lp.y,0.0)+fw*lp.z; vN=normalize(rt*ln.x+vec3(0.0,ln.y,0.0)+fw*ln.z);
  vec4 mvPosition=modelViewMatrix*vec4(vP,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BUCKET_FS = FS_PARS + /* glsl */`
uniform vec3 uBkGlow, uMilk;
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(uCamL-vP); if(dot(N,V)<0.0) N=-N;
  vec3 Lk; vec3 E=geodeLight(vP,N,Lk);
  float rust=vn3(vP*2.3);
  E/=1.0+0.25*dot(E,vec3(0.3,0.5,0.2));
  vec3 col=mix(vec3(0.05,0.05,0.07),vec3(0.15,0.12,0.12),rust)*(E+uAmbCol*0.5);
  col+=mix(uShaftCol,uMilk,0.4)*((0.35+0.65*uCloud)*0.5*pow(1.0-max(dot(N,V),0.0),2.0));   // a pale rim so the iron reads against the wall
  col+=uBkGlow*(0.75+0.25*sin(uTime*1.7+vP.x*0.4+vP.z*0.3));
` + FS_END + '}';

// ---------------------------------------------------------------- geometry helpers
function flatGeo(tris) {                    // tris: flat array of xyz triples, three vertices per face; flat normals
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  g.computeVertexNormals();
  return g;
}
// six-sided amethyst point: y 0 (root) .. 1 (tip), widest (radius 1) at the shoulder, apex pushed off-centre
function makeCrystalGeo() {
  const t = [], ring = (r, y, i) => { const a = (i / 6) * TAU; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const apex = [0.16, 1, 0.1];
  for (let i = 0; i < 6; i++) {
    const a0 = ring(0.74, 0, i), a1 = ring(0.74, 0, i + 1), b0 = ring(1, 0.66 + 0.05 * (i % 2), i), b1 = ring(1, 0.66 + 0.05 * ((i + 1) % 2), i + 1);
    t.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1, ...b0, ...apex, ...b1);
  }
  return flatGeo(t);
}
// selenite blade: hexagonal prism along y (-0.5..0.5), unit width, chamfered ends with a shallow peak
function makeBeamGeo() {
  const t = [], R = 0.5, c = 0.014, ring = (r, y, i) => { const a = (i / 6) * TAU + 0.26; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let i = 0; i < 6; i++) {
    const quad = (r0, y0, r1, y1) => { const a0 = ring(r0, y0, i), a1 = ring(r0, y0, i + 1), b0 = ring(r1, y1, i), b1 = ring(r1, y1, i + 1); t.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1); };
    quad(R, -0.5 + c, R, 0.5 - c); quad(R, 0.5 - c, R * 0.6, 0.5); quad(R * 0.6, -0.5, R, -0.5 + c);
    t.push(...ring(R * 0.6, 0.5, i), ...[0.05, 0.5 + c * 0.5, 0], ...ring(R * 0.6, 0.5, i + 1));
    t.push(...ring(R * 0.6, -0.5, i + 1), ...[0.05, -0.5 - c * 0.5, 0], ...ring(R * 0.6, -0.5, i));
  }
  return flatGeo(t);
}
// timber: open box along y (0..1), unit cross-section
function makeBoxGeo() {
  const t = [], c = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = c[i], [x1, z1] = c[(i + 1) % 4];
    t.push(x0, 0, z0, x0, 1, z0, x1, 1, z1, x0, 0, z0, x1, 1, z1, x1, 0, z1);
  }
  return flatGeo(t);
}
// iron bucket hanging below y = 0 (the rope): tapered tub, bail, sheave block. Local x = across the rope, z = along it
function makeBucketGeo() {
  const t = [], n = 8, ring = (r, y, i) => { const a = (i / n) * TAU; return [Math.cos(a) * r, y, Math.sin(a) * r * 1.25]; };
  for (let i = 0; i < n; i++) {
    const a0 = ring(0.55, -3.5, i), a1 = ring(0.55, -3.5, i + 1), b0 = ring(0.8, -2.3, i), b1 = ring(0.8, -2.3, i + 1), l0 = ring(0.86, -2.22, i), l1 = ring(0.86, -2.22, i + 1);
    t.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1, ...b0, ...l0, ...l1, ...b0, ...l1, ...b1, ...a1, ...[0, -3.5, 0], ...a0);
  }
  const bar = (x0, y0, x1, y1, w) => { t.push(x0, y0, -w, x1, y1, -w, x1, y1, w, x0, y0, -w, x1, y1, w, x0, y0, w); };
  bar(-0.8, -2.4, -0.12, -0.3, 0.07); bar(0.8, -2.4, 0.12, -0.3, 0.07);
  const bx = 0.14, by0 = -0.42, by1 = 0.12, bz = 0.3;                           // sheave block
  for (const s of [-1, 1]) t.push(s * bx, by0, -bz, s * bx, by1, -bz, s * bx, by1, bz, s * bx, by0, -bz, s * bx, by1, bz, s * bx, by0, bz);
  for (const s of [-1, 1]) t.push(-bx, by0, s * bz, -bx, by1, s * bz, bx, by1, s * bz, -bx, by0, s * bz, bx, by1, s * bz, bx, by0, s * bz);
  return flatGeo(t);
}

const eggA = (y) => (y > YC ? AU : AD);
const eggE = (x, y, z) => (x * x + z * z) / (RX * RX) + ((y - YC) / eggA(y)) ** 2;       // < 1 inside the void
// closest distance between segments p1-q1 and p2-q2 (plain numbers)
function segSegDist(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) {
  const d1x = bx - ax, d1y = by - ay, d1z = bz - az, d2x = dx - cx, d2y = dy - cy, d2z = dz - cz, rx = ax - cx, ry = ay - cy, rz = az - cz;
  const a = d1x * d1x + d1y * d1y + d1z * d1z, e = d2x * d2x + d2y * d2y + d2z * d2z, f = d2x * rx + d2y * ry + d2z * rz;
  let s, t;
  if (a < 1e-9 && e < 1e-9) { s = 0; t = 0; } else if (a < 1e-9) { s = 0; t = clamp(f / e, 0, 1); } else {
    const c = d1x * rx + d1y * ry + d1z * rz;
    if (e < 1e-9) { t = 0; s = clamp(-c / a, 0, 1); } else {
      const b = d1x * d2x + d1y * d2y + d1z * d2z, den = a * e - b * b;
      s = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = clamp((b - c) / a, 0, 1); }
    }
  }
  const x = rx + d1x * s - d2x * t, y = ry + d1y * s - d2y * t, z = rz + d1z * s - d2z * t;
  return Math.sqrt(x * x + y * y + z * z);
}

// ---------------------------------------------------------------- layout: tracks, dive, portal, pool, shaft (pure numbers)
function buildLayout(rng, noise, own) {
  const L = {};
  const hc = L.hc = { x: -5 + rng.range(-1.5, 1.5), z: 2 + rng.range(-1.5, 1.5) };
  const helixLen = TURNS * TAU * HR, drop = Y_TOP - Y_BOT, STEP = 1.5;
  const outer = [], second = [];                                              // { x, y, z, hx, hz } heading is horizontal unit
  // approach: straight back from the helix start to the wall
  let La = 0; const g0 = 0.07;
  const s0x = hc.x + HR * Math.cos(TH0), s0z = hc.z - HR * Math.sin(TH0), t0x = -Math.sin(TH0), t0z = -Math.cos(TH0);   // helix start, heading
  // the approach is not straight: walking back up it from the helix the heading swings BEND to the left, so the cart
  // comes out of the throat already pointed at the daylight column (the reveal sits in the direction of travel)
  const BEND = 19 * Math.PI / 180, appr = [];
  {
    let px = s0x, pz = s0z;
    for (let i = 1; i <= 60; i++) {
      const am = BEND * smoothstep(5, 38, (i - 0.5) * STEP), hmx = t0x * Math.cos(am) + t0z * Math.sin(am), hmz = t0z * Math.cos(am) - t0x * Math.sin(am);
      px -= hmx * STEP; pz -= hmz * STEP; La = i * STEP;
      const a = BEND * smoothstep(5, 38, La);
      appr.push({ x: px, y: Y_TOP + La * g0, z: pz, hx: t0x * Math.cos(a) + t0z * Math.sin(a), hz: t0z * Math.cos(a) - t0x * Math.sin(a) });
      if (eggE(px, Y_TOP + La * g0, pz) >= 0.955) break;
    }
  }
  for (let i = appr.length - 1; i >= 0; i--) outer.push(appr[i]);
  L.helixStartIdx = outer.length;
  const nH = Math.round(helixLen / STEP);
  for (let i = 0; i <= nH; i++) {
    const t = i / nH, th = TH0 + t * TURNS * TAU, y = Y_TOP - drop * t, c = Math.cos(th), s = Math.sin(th);
    outer.push({ x: hc.x + HR * c, y, z: hc.z - HR * s, hx: -s, hz: -c, th });
    second.push({ x: hc.x + HR2 * c, y, z: hc.z - HR2 * s, hx: -s, hz: -c, th });
  }
  L.helixEndIdx = outer.length - 1; L.nH = nH;
  // the leap: 15 degrees down, steepening over 40 m, then 60 m straight at 66 degrees
  const dive = []; let dh = 0, dv = 0;
  for (let s = 0; s <= 100; s += 2) {
    dive.push([dh, dv]);
    const pitch = lerp(15, 66, smoothstep(0, 40, s + 1)) * Math.PI / 180;
    dh += Math.cos(pitch) * 2; dv += Math.sin(pitch) * 2;
  }
  const last = dive[dive.length - 1];
  const CAM_H = 1.7, railEndY = 6 + last[1] - CAM_H;
  // spur: a left-hand arc off the end of the helix, then a short straight
  const E = outer[outer.length - 1], Tx = E.hx, Tz = E.hz;
  let nx = hc.x - E.x, nz = hc.z - E.z; const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
  const rho = 22, alpha = rng.range(120, 128) * Math.PI / 180, arc = rho * alpha, straight = 4.5, spurLen = arc + straight;
  const Cx = E.x + nx * rho, Cz = E.z + nz * rho;
  const spurAt = (d) => {
    const a = Math.min(d, arc) / rho, ca = Math.cos(a), sa = Math.sin(a), ex = Math.max(0, d - arc);
    const hx = Tx * ca + nx * sa, hz = Tz * ca + nz * sa;
    return { x: Cx + rho * (-nx * ca + Tx * sa) + hx * ex, y: lerp(Y_BOT, railEndY, d / spurLen), z: Cz + rho * (-nz * ca + Tz * sa) + hz * ex, hx, hz };
  };
  const nS = Math.round(spurLen / STEP);
  for (let i = 1; i <= nS; i++) outer.push(spurAt((i / nS) * spurLen));
  L.outer = outer;
  // the second track swings in from the wall side and merges onto the spur
  const Ei = second[second.length - 1], J = spurAt(rho * 1.08), k = 8 + (HR2 - HR) * 0.4;
  const b0 = [Ei.x, Ei.z], b1 = [Ei.x + Tx * k, Ei.z + Tz * k], b2 = [J.x - J.hx * k, J.z - J.hz * k], b3 = [J.x, J.z];
  for (let i = 1; i <= 14; i++) {
    const t = i / 14, u = 1 - t, w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
    const x = w0 * b0[0] + w1 * b1[0] + w2 * b2[0] + w3 * b3[0], z = w0 * b0[1] + w1 * b1[1] + w2 * b2[1] + w3 * b3[1];
    const p = second[second.length - 1]; let hx = x - p.x, hz = z - p.z; const hl = Math.hypot(hx, hz) || 1;
    second.push({ x, y: lerp(Ei.y, J.y, t), z, hx: hx / hl, hz: hz / hl });
  }
  L.second = second;
  // dive and portal
  const RE = outer[outer.length - 1]; L.railEnd = RE;
  L.dive = dive.map(([h, v]) => ({ x: RE.x + RE.hx * h, y: RE.y + CAM_H - v, z: RE.z + RE.hz * h }));
  const W = L.dive[L.dive.length - 1]; L.well = { x: W.x, y: 6, z: W.z };
  // sight lines kept open: from the spur and the last of the helix down to the well (so the exit reads from the trestle),
  // and the first 40 m out of the throat (nothing big across the reveal)
  L.sight = [];
  for (let i = L.helixEndIdx - 24; i < outer.length; i += 6) {
    const p = outer[i], dx = W.x - p.x, dy = 11 - (p.y + CAM_H), dz = W.z - p.z, l = Math.hypot(dx, dy, dz);
    L.sight.push([p.x + dx * (13 / l), p.y + CAM_H + dy * (13 / l), p.z + dz * (13 / l), p.x + dx * ((l - 9) / l), p.y + CAM_H + dy * ((l - 9) / l), p.z + dz * ((l - 9) / l)]);
  }
  { const a = outer[0], b = outer[Math.min(27, L.helixStartIdx)]; L.revealSeg = [a.x, a.y + CAM_H, a.z, b.x, b.y + CAM_H, b.z]; }
  const c66 = Math.cos(66 * Math.PI / 180), s66 = Math.sin(66 * Math.PI / 180);
  L.portalN = { x: -RE.hx * c66, y: s66, z: -RE.hz * c66 };
  // light spot, pool, shaft, sinkhole
  const P0 = L.spot = { x: W.x - RE.hx * 12, z: W.z - RE.hz * 12 };
  L.pool = { x: P0.x * 0.55, z: P0.z * 0.55, r: 25 };
  const S = { x: P0.x + (hc.x - P0.x) * 0.85, z: P0.z + (hc.z - P0.z) * 0.85 };
  L.sink = { x: S.x, y: 174, z: S.z };
  L.shaftA = new V3(P0.x, 0, P0.z);
  L.shaftB = new V3(P0.x + (S.x - P0.x) * (193 / 175), 193, P0.z + (S.z - P0.z) * (193 / 175));
  L.shaftAt = (y, out) => { const t = y / 193; out.x = lerp(L.shaftA.x, L.shaftB.x, t); out.z = lerp(L.shaftA.z, L.shaftB.z, t); return out; };
  // corridor test data: tracks (box above the rails) and the dive (sphere)
  const nT = outer.length + second.length, tr = new Float32Array(nT * 3); let q = 0;
  for (const p of outer) { tr[q++] = p.x; tr[q++] = p.y; tr[q++] = p.z; }
  for (const p of second) { tr[q++] = p.x; tr[q++] = p.y; tr[q++] = p.z; }
  const dv3 = L.dive;
  const trYMax = outer[0].y, trYMin = outer[outer.length - 1].y;
  L.clear = (x, y, z, hr, lo, hi, dr) => {
    const hr2 = hr * hr, dr2 = dr * dr;
    let near = !(y - trYMax > hi || y - trYMin < lo);                          // cheap rejects before walking the rails
    if (near) { const rx = x - hc.x, rz = z - hc.z; if (rx * rx + rz * rz > (HR2 + hr + 1) ** 2 && Math.abs((x - s0x) * t0z - (z - s0z) * t0x) > hr + 22) near = false; }
    if (near) for (let i = 0; i < tr.length; i += 3) { const dy = y - tr[i + 1]; if (dy > lo && dy < hi) { const dx = x - tr[i], dz = z - tr[i + 2]; if (dx * dx + dz * dz < hr2) return false; } }
    for (let i = 0; i < dv3.length; i++) { const p = dv3[i], dx = x - p.x, dy = y - p.y, dz = z - p.z; if (dx * dx + dy * dy + dz * dz < dr2) return false; }
    return true;
  };
  L.segClear = (a, b, hr, lo, hi, dr, n = 6) => {
    for (let i = 0; i <= n; i++) { const t = i / n; if (!L.clear(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t), hr, lo, hi, dr)) return false; }
    return true;
  };
  // floor rock: pool basin, well curb, rising into the wall at the rim
  const pl = L.pool;
  const ground = (x, z) => 1.5 + 1.7 * noise.fbm2(x * 0.045 + 3.1, z * 0.045 - 1.7, 3) + 0.45 * noise.n2(x * 0.31, z * 0.31);
  // the cavern floor's own water: two chains of rimstone tarns stepping up from the pool to the foot of the wall, each a
  // flat mirror inside a raised rim, away from the well's side of the pool (a stream of their own: 'geode-water')
  const tarns = L.tarns = [];
  {
    const rw = own('geode-water'), thW = Math.atan2(W.z - pl.z, W.x - pl.x);
    for (let k = 0; k < 2; k++) {
      let th = thW + (k ? 1 : -1) * rw.range(1.5, 2.5), d = pl.r * 1.28, y = 0.1;
      for (let i = 0; i < 7; i++) {
        const R = rw.range(3.6, 6.4); d += R;
        const x = pl.x + Math.cos(th) * d, z = pl.z + Math.sin(th) * d;
        if (Math.hypot(x, z) + R > 49 || Math.hypot(x - W.x, z - W.z) < 19 + R) break;
        y = Math.max(y + 0.3, Math.min(ground(x, z) - 0.2, y + 0.9));          // each a step above the last, following the ground where it rises
        tarns.push({ x, z, r: R, y });
        d += R + 0.5; th += rw.range(-0.16, 0.16);
      }
    }
  }
  L.floorH = (x, z) => {
    const r2 = x * x + z * z;
    let h = ground(x, z);
    const dp = Math.hypot(x - pl.x, z - pl.z) / (pl.r * (1 + 0.13 * noise.n2(x * 0.05 + 9, z * 0.05 + 4)));
    h = lerp(-3.4, Math.max(h, 0.35), smoothstep(0.84, 1.1, dp));
    for (let i = 0; i < tarns.length; i++) {
      const t = tarns[i], d = Math.hypot(x - t.x, z - t.z); if (d > t.r + 3.2) continue;
      const rr = t.r * (1 + 0.1 * noise.n2(x * 0.19 + t.x, z * 0.19 + t.z));
      h = d < rr ? t.y - 0.1 - 0.7 * (1 - (d / rr) ** 2) : lerp(h, Math.max(h, t.y + 0.25), smoothstep(rr + 2.8, rr + 0.3, d));
    }
    const dw = Math.hypot(x - W.x, z - W.z);
    h = lerp(h, 4.4 + 0.8 * noise.n2(x * 0.4, z * 0.4), smoothstep(15.5, 10.2, dw));
    if (dw < 8.8) h = lerp(-11, h, smoothstep(6.6, 8.8, dw));
    const yw = YC - AD * Math.sqrt(Math.max(0, 1 - r2 / (RX * RX)));
    return Math.max(h, yw + 0.5);
  };
  return L;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('geode-hero') : ctx.rng, noise = ctx.noise;
  // later additions draw from forks of their own, so the layout that was there before them is unchanged
  const rngD = ctx.rng.fork ? ctx.rng.fork('geode-druse') : rng, rngF = ctx.rng.fork ? ctx.rng.fork('geode-falls') : rng;
  const own = (name) => makeRng(hashSeed(name + ':' + ctx.seed));            // a stream made from the world's seed and a name: it draws from no other
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cShadow, cRoot, cTip, cMilk, cDay, cPool, cTimber] = pal;
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const pv = opts.preview;
  const cutaway = opts.cutaway !== undefined ? !!opts.cutaway : true;         // fold the near wall away when seen from outside (worlds pass false)

  const group = new THREE.Group(); group.name = 'geode-run-hero';
  const L = buildLayout(rng, noise, own);
  const tmpA = new V3(), tmpB = new V3(), tmpC = new V3(), m4 = new THREE.Matrix4();
  await ctx.yield();

  // ---- shared uniforms (one object per uniform, shared by reference between materials)
  const U = {
    uShaftA: { value: L.shaftA.clone() }, uShaftB: { value: L.shaftB.clone() }, uShaftR: { value: SHAFT_R },
    uShaftCol: { value: cDay.clone().multiplyScalar(2.3) }, uAmbCol: { value: cDay.clone().lerp(cTip, 0.55).multiplyScalar(0.085) },
    uPoolCol: { value: cPool.clone() }, uHazeCol: { value: cDay.clone().lerp(cTip, 0.6).multiplyScalar(0.26) },
    uLampCol: { value: cMilk.clone().multiplyScalar(5.0) }, uCamL: { value: new V3(0, 80, 300) },
    uLampPos: { value: new THREE.Vector4(0, -999, 0, 0) }, uLampDir: { value: new THREE.Vector4(0, 0, -1, Math.cos(24 * Math.PI / 180)) },
    uCloud: { value: 1 }, uTime: { value: 0 }, uHaze: { value: opts.haze !== undefined ? opts.haze : 0.003 },
    uGlint: { value: opts.glint !== undefined ? opts.glint : 1 }, uOutside: { value: 0 }, uPx: { value: 400 },
    uRoot: { value: cRoot.clone() }, uTip: { value: cTip.clone() }, uShadow: { value: cShadow.clone() },
    uMilk: { value: cMilk.clone().multiplyScalar(0.92) }, uTimber: { value: cTimber.clone() },
    uLampRange: { value: 30 }, uPt: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, -999, 0, 0)) },
    uPtCol: { value: cMilk.clone().lerp(cDay, 0.35) }, uDarkCol: { value: cTip.clone().lerp(cDay, 0.5).multiplyScalar(0.012) },
    uSkyA: { value: new THREE.Color(0.16, 0.42, 1.0).multiplyScalar(2.3) }, uSkyB: { value: new THREE.Color(1.0, 1.0, 1.02).multiplyScalar(3.6) }, uStars: { value: 0 },
    uBirdCol: { value: new THREE.Color(0.012, 0.012, 0.02) }, uBkGlow: { value: new THREE.Color(0, 0, 0) },
    uFallK: { value: 1 }, uFrozen: { value: 0 },
    uGlowA: { value: new THREE.Color('#D873CC') }, uGlowB: { value: new THREE.Color('#F9AEDD') }, uGlowK: { value: 1 },
    uWarm: { value: new THREE.Color(1.0, 0.5, 0.17).multiplyScalar(1.7) },      // the colour of a flame: the miners' lamps
    uCast2: { value: cTip.clone() },                                             // the geode's second mineral (the world names it; alone, the piece has one)
  };
  const mkMat = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial(Object.assign({
    vertexShader: vs, fragmentShader: fs, fog: true,
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, extra),
  }, params));

  // ---- shell, floor, sinkhole neck, throat stub: one mesh
  const P = [], C = [], M = [], REF = [], IDX = [];
  const addGrid = (nu, nv, fn) => {          // fn(u, v, o): fills o.p (xyz), o.c (rgb), o.m (mat), o.r (interior side)
    const base = P.length / 3, o = { p: [0, 0, 0], c: [1, 1, 1], m: [0, 0, 0], r: [0, 1, 0] };
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(i / nu, j / nv, o); P.push(...o.p); C.push(...o.c); M.push(...o.m); REF.push(...o.r); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; IDX.push(a, c, b, b, c, d); }
  };
  const shellPt = (th, ph, o) => {           // point on the lumpy egg wall; o = [x, y, z]
    const cy = Math.cos(ph), r = RX * Math.sin(ph), y = YC + (cy > 0 ? AU : AD) * cy, x = r * Math.cos(th), z = r * Math.sin(th);
    const n = 1 + 0.045 * noise.fbm3(x * 0.017, y * 0.017, z * 0.017, 3) + 0.012 * noise.n3(x * 0.07, y * 0.07, z * 0.07);
    o[0] = x * n; o[1] = YC + (y - YC) * n; o[2] = z * n; return o;
  };
  const inwardAt = (x, y, z, o) => { const a = eggA(y), nx = -x / (RX * RX), ny = -(y - YC) / (a * a), nz = -z / (RX * RX), l = Math.hypot(nx, ny, nz) || 1; o[0] = nx / l; o[1] = ny / l; o[2] = nz / l; return o; };
  const PH1 = 2.70;
  // the wall's points and tones, taken ring by ring ahead of the grid (the noise is the cost: a pause every dozen rings)
  const SNU = 112, SNV = 68, SH = new Float32Array((SNU + 1) * (SNV + 1) * 5), sq = [0, 0, 0];
  for (let j = 0; j <= SNV; j++) {
    for (let i = 0; i <= SNU; i++) {
      shellPt((i / SNU) * TAU, 0.012 + (j / SNV) * (PH1 - 0.012), sq); const k = (j * (SNU + 1) + i) * 5;
      SH[k] = sq[0]; SH[k + 1] = sq[1]; SH[k + 2] = sq[2];
      SH[k + 3] = 0.95 + 0.4 * noise.fbm3(sq[0] * 0.03 + 5, sq[1] * 0.03, sq[2] * 0.03, 2); SH[k + 4] = noise.n3(sq[0] * 0.02, sq[1] * 0.02 + 7, sq[2] * 0.02);
    }
    if (j % 12 === 11) await ctx.yield();
  }
  addGrid(SNU, SNV, (u, v, o) => {
    const k = (Math.round(v * SNV) * (SNU + 1) + Math.round(u * SNU)) * 5, b = SH[k + 3], t = SH[k + 4];
    o.p[0] = SH[k]; o.p[1] = SH[k + 1]; o.p[2] = SH[k + 2]; inwardAt(o.p[0], o.p[1], o.p[2], o.r);
    o.c[0] = b * (1 + 0.14 * t); o.c[1] = b * (1 - 0.05 * t); o.c[2] = b * (1 - 0.1 * t); o.m[0] = 0; o.m[1] = 0; o.m[2] = 0;
  });
  await ctx.yield();
  const sp = L.spot, well = L.well;
  // the floor's heights, taken ring by ring ahead of the grid (every tarn's bowl is asked at every point)
  const FNU = 132, FNV = 44, FH = new Float32Array((FNU + 1) * (FNV + 1));
  for (let j = 0; j <= FNV; j++) {
    const r = 57.5 * Math.pow(j / FNV, 0.85);
    for (let i = 0; i <= FNU; i++) { const a = (i / FNU) * TAU; FH[j * (FNU + 1) + i] = L.floorH(Math.cos(a) * r, Math.sin(a) * r); }
    if (j % 4 === 3) await ctx.yield();
  }
  addGrid(FNU, FNV, (u, v, o) => {             // floor: polar grid, denser toward the middle ring, fine enough to hold a tarn's rim
    const a = u * TAU, r = 57.5 * Math.pow(v, 0.85), x = Math.cos(a) * r, z = Math.sin(a) * r, h = FH[Math.round(v * FNV) * (FNU + 1) + Math.round(u * FNU)];
    o.p[0] = x; o.p[1] = h; o.p[2] = z; o.r[0] = 0; o.r[1] = 1; o.r[2] = 0;
    const b = 0.8 + 0.35 * noise.n2(x * 0.11, z * 0.11), dl = Math.hypot(x - sp.x, z - sp.z);
    o.c[0] = b; o.c[1] = b * 0.97; o.c[2] = b * 1.06;
    const wet = smoothstep(-0.2, 1.2, h);
    o.m[0] = 1; o.m[1] = wet * smoothstep(19, 9, dl) * (0.55 + 0.45 * noise.n2(x * 0.2 + 3, z * 0.2)); o.m[2] = 1;
  });
  await ctx.yield();
  const ax = new V3();
  addGrid(40, 6, (u, v, o) => {                // sinkhole neck
    const a = u * TAU, y = 169 + v * 24; L.shaftAt(y, ax);
    const r = SHAFT_R + 0.6 + 1.6 * noise.n2(Math.cos(a) * 2.2 + 11, Math.sin(a) * 2.2 + y * 0.08) + (v > 0.9 ? 1.5 : 0);
    o.p[0] = ax.x + Math.cos(a) * r; o.p[1] = y; o.p[2] = ax.z + Math.sin(a) * r; o.r[0] = -Math.cos(a); o.r[1] = 0; o.r[2] = -Math.sin(a);
    const b = 1.2 + 1.3 * v; o.c[0] = b; o.c[1] = b; o.c[2] = b; o.m[0] = 1; o.m[1] = 0.35 + 0.6 * v; o.m[2] = 1;
  });
  const mouthP = L.outer[0], mouth = new V3(mouthP.x, mouthP.y + 2.2, mouthP.z);
  if (opts.throatStub !== false) addGrid(16, 4, (u, v, o) => {   // a lip of dark rock behind the mouth
    const a = u * TAU, r = 5.9 + 0.9 * noise.n2(Math.cos(a) * 1.7 + v * 2, Math.sin(a) * 1.7 + 30);
    const bk = 1.5 - v * 13.5, sx = Math.cos(a) * r;      // bk: metres along the heading (negative = back into the rock)
    o.p[0] = mouth.x + mouthP.hx * bk + mouthP.hz * sx; o.p[1] = mouth.y + v * 13.5 * 0.07 + Math.sin(a) * r * 0.9; o.p[2] = mouth.z + mouthP.hz * bk - mouthP.hx * sx;
    o.r[0] = -mouthP.hz * Math.cos(a); o.r[1] = -Math.sin(a); o.r[2] = mouthP.hx * Math.cos(a);
    const b = 0.9 - 0.5 * v; o.c[0] = b; o.c[1] = b; o.c[2] = b * 1.1; o.m[0] = 0.55; o.m[1] = 0; o.m[2] = 1;
  });
  // second sinkhole on the far shoulder of the roof
  const th2 = rng.range(0, TAU), hole2 = shellPt(th2, rng.range(0.42, 0.56), [0, 0, 0]), hole2In = inwardAt(hole2[0], hole2[1], hole2[2], [0, 0, 0]);
  await ctx.yield();
  const shellGeo = new THREE.BufferGeometry();
  shellGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  await ctx.yield();
  shellGeo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  shellGeo.setAttribute('aMat', new THREE.Float32BufferAttribute(M, 3));
  await ctx.yield();
  shellGeo.setIndex(IDX); shellGeo.computeVertexNormals();
  await ctx.yield();
  { const n = shellGeo.attributes.normal.array; for (let i = 0; i < n.length; i += 3) if (n[i] * REF[i] + n[i + 1] * REF[i + 1] + n[i + 2] * REF[i + 2] < 0) { n[i] = -n[i]; n[i + 1] = -n[i + 1]; n[i + 2] = -n[i + 2]; } }
  const shellMat = mkMat(SHELL_VS, SHELL_FS, { uMouth: { value: new THREE.Vector4(mouth.x, mouth.y, mouth.z, 5.3) }, uHole2: { value: new THREE.Vector4(hole2[0], hole2[1], hole2[2], 4.2) } }, { side: THREE.DoubleSide });
  const shell = new THREE.Mesh(shellGeo, shellMat); shell.frustumCulled = false; group.add(shell);
  await ctx.yield();

  // ---- instance-matrix helper: a unit shape along +Y from `pos`, pointing along dir, scaled (wx, len, wz), rolled
  const bX = new V3(), bY = new V3(), bZ = new V3();
  const setBasis = (pos, dir, len, wx, wz, roll, out, hint) => {
    bY.copy(dir).normalize();
    if (hint) bX.copy(hint); else bX.set(Math.abs(bY.y) > 0.9 ? 1 : 0, Math.abs(bY.y) > 0.9 ? 0 : 1, 0);
    bZ.crossVectors(bX, bY); if (bZ.lengthSq() < 1e-6) { bX.set(0.3, 0.2, 0.9); bZ.crossVectors(bX, bY); } bZ.normalize(); bX.crossVectors(bY, bZ).normalize();
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll); tmpC.copy(bX).multiplyScalar(c).addScaledVector(bZ, s); bZ.multiplyScalar(c).addScaledVector(bX, -s); bX.copy(tmpC); }
    out.makeBasis(tmpC.copy(bX).multiplyScalar(wx), tmpA.copy(bY).multiplyScalar(len), tmpB.copy(bZ).multiplyScalar(wz)).setPosition(pos);
    return out;
  };

  // ---- selenite beams (chosen before the trestle so that timber can stand on them or give way)
  // (the fallen beams and, below, the wall's points are each tried until they fit: how many tries that takes turns on
  // the tracks, the floor and one another, so each draws from a stream of its own and nothing after them moves with it)
  const rngB = own('geode-beams'), rngP = own('geode-points');
  // each thing that used to draw from the hero's stream after the beams has a named stream of its own, so that no block
  // before it can deal it anew: the collar, the rail-end splinters, the pool's rings, the blade of light, the roots and
  // the ferns round the sinkhole, the cableway and its buckets, the mist, the moths, the leaves in the column, the flock
  const rngCo = own('geode-collar'), rngSp = own('geode-splinters'), rngRi = own('geode-rings'), rngBl = own('geode-blade'), rngRo = own('geode-roots'), rngFe = own('geode-ferns');
  const rngCa = own('geode-cableway'), rngBk = own('geode-buckets'), rngMi = own('geode-mist'), rngMo = own('geode-moths'), rngLe = own('geode-leaves'), rngFl = own('geode-flock');
  const beams = [];                           // { a, b (Vector3), wx, wz, blaze, tS }
  const shaftSeg = [L.shaftA.x, L.shaftA.y, L.shaftA.z, L.shaftB.x, L.shaftB.y - 20, L.shaftB.z];
  const toWall = (p, d, max) => { let s = 0; while (s < max && eggE(p.x + d.x * (s + 2), p.y + d.y * (s + 2), p.z + d.z * (s + 2)) < 1.0 && p.y + d.y * (s + 2) > L.floorH(p.x + d.x * (s + 2), p.z + d.z * (s + 2)) - 1) s += 2; return s; };
  const beamOk = (a, b, w) => {
    if (!L.segClear(a, b, 5.2 + w * 0.5, -7 - w * 0.5, 8.5 + w * 0.5, 8 + w * 0.5, Math.ceil(a.distanceTo(b) / 3))) return false;
    for (const o of beams) if (segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) < (w + o.wx) * 0.5 - 0.6) return false;   // may touch and cross, not coincide
    if (a.distanceTo(mouth) < 16 || b.distanceTo(mouth) < 16) return false;
    if (segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, ...L.revealSeg) < 21 + w * 0.5) return false;
    for (const sg of L.sight) if (segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, sg[0], sg[1], sg[2], sg[3], sg[4], sg[5]) < 4 + w * 0.5) return false;
    return true;
  };
  const pushBeam = (a, b, wx, wz, seed) => {                                  // the great beams draw their seed here; a beam with a stream of its own brings it
    const dS = segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, ...shaftSeg);
    // point along the beam nearest the shaft axis (coarse search)
    let tS = 0.5, best = 1e9; for (let i = 0; i <= 20; i++) { const t = i / 20, y = lerp(a.y, b.y, t); L.shaftAt(clamp(y, 0, 193), ax); const d = Math.hypot(lerp(a.x, b.x, t) - ax.x, lerp(a.z, b.z, t) - ax.z); if (d < best) { best = d; tS = t; } }
    const blaze = (1 - smoothstep(SHAFT_R * 0.55, SHAFT_R * 1.25, dS)) * (Math.max(a.y, b.y) > 4 ? 1 : 0.6);
    beams.push({ a: a.clone(), b: b.clone(), wx, wz, blaze, tS, seed: seed === undefined ? rngB() : seed });
  };
  const dirv = new V3(), pa = new V3(), pb = new V3(), tp = [0, 0, 0], tn = [0, 0, 0];
  // great beams through or beside the column, wall to wall
  for (let i = 0, tries = 0; i < 9 && tries < 400; tries++) {
    const y = rngB.range(22, 158); L.shaftAt(y, ax);
    const off = i < 6 ? rngB.range(0, 9) : rngB.range(18, 45), oa = rngB.range(0, TAU);
    tmpA.set(ax.x + Math.cos(oa) * off, y, ax.z + Math.sin(oa) * off);
    const da = rngB.range(0, TAU), el = rngB.range(-0.75, 0.75); dirv.set(Math.cos(da) * Math.cos(el), Math.sin(el), Math.sin(da) * Math.cos(el));
    if (eggE(tmpA.x, tmpA.y, tmpA.z) > 0.8) continue;
    const s1 = toWall(tmpA, dirv, 130), s0 = toWall(tmpA, tmpB.copy(dirv).negate(), 130);
    pa.copy(tmpA).addScaledVector(dirv, -s0 - 1.5); pb.copy(tmpA).addScaledVector(dirv, s1 + 1.5);
    if (rngB.chance(0.45)) { if (rngB.chance(0.5)) pa.copy(tmpA).addScaledVector(dirv, -Math.min(s0, rngB.range(14, 30))); else pb.copy(tmpA).addScaledVector(dirv, Math.min(s1, rngB.range(14, 30))); }   // some stop in mid-air
    const len = pa.distanceTo(pb), w = rngB.range(3.4, 5.2);
    if (len < 55 || len > 165 || !beamOk(pa, pb, w)) continue;
    pushBeam(pa, pb, w, w * rngB.range(0.55, 0.8)); i++;
    if (i % 3 === 0) await ctx.yield();
  }
  await ctx.yield();
  // beams jutting from the wall like spilled matches
  for (let i = 0, tries = 0; i < 30 && tries < 900; tries++) {
    shellPt(rngB.range(0, TAU), Math.acos(rngB.range(-0.8, 0.9)), tp); inwardAt(tp[0], tp[1], tp[2], tn);
    if (tp[1] < L.floorH(tp[0], tp[2]) + 1) continue;
    dirv.set(tn[0] + rngB.range(-0.9, 0.9), tn[1] + rngB.range(-0.9, 0.9), tn[2] + rngB.range(-0.9, 0.9)).normalize();
    const len = rngB.range(24, 58), w = rngB.range(2.1, 3.7);
    pa.set(tp[0], tp[1], tp[2]).addScaledVector(dirv, -3); pb.copy(pa).addScaledVector(dirv, len);
    if (eggE(pb.x, pb.y, pb.z) > 0.93 || pb.y < L.floorH(pb.x, pb.z) + 2 || !beamOk(pa, pb, w)) continue;
    pushBeam(pa, pb, w, w * rngB.range(0.5, 0.85)); i++;
  }
  // the beam that passes just over the lamp on the lower turn of the helix (its last full turn). Its station is drawn,
  // from a stream of its own, on the half of the lower turn that comes round from the far side of the cave toward the
  // well: between the rail point of the lower turn farthest from the well (in plan) and the one where the rail passes
  // over the well. There the rider looks along the rail and out over the cave, so the beam is seen coming and goes by
  // overhead; past the well the eye has gone down to the ring. PASS_TRIES stations are drawn before any is tested,
  // and the first that lies clear of the rails and the leap takes the beam.
  let beamPass = null;
  {
    const rb = own('geode-pass-beam'), thLow = TH0 + (TURNS - 1) * TAU, PASS_TRIES = 6, st = [], w = 2.3;
    let iFar = -1, iOver = -1, far = -1, near = 1e9;
    for (let i = L.helixStartIdx; i <= L.helixEndIdx; i++) {
      const p = L.outer[i]; if (p.th < thLow) continue;
      const q = Math.hypot(p.x - well.x, p.z - well.z);
      if (q > far) { far = q; iFar = i; } if (q < near) { near = q; iOver = i; }
    }
    for (let k = 0; k < PASS_TRIES; k++) st.push(rb.int(Math.min(iFar, iOver), Math.max(iFar, iOver)));
    const passSeed = rb();
    for (const passIdx of st) {
      const pp = L.outer[passIdx], rx = (pp.x - L.hc.x) / HR, rz = (pp.z - L.hc.z) / HR, yb = pp.y + 4.5;
      tmpA.set(pp.x, yb, pp.z); dirv.set(rx, 0, rz).normalize();                // it lies level, so that it clears the second rail beyond ours as it clears ours
      const s1 = toWall(tmpA, dirv, 80); pb.copy(tmpA).addScaledVector(dirv, s1 + 2); pa.copy(tmpA).addScaledVector(dirv, -24);
      if (!L.segClear(pa, pb, 2.2, -3, 4.0, 7, 30)) continue;
      pushBeam(pa, pb, w, w * 0.62, passSeed); beamPass = { position: new V3(pp.x, yb, pp.z), dist: passIdx * 1.5 }; break;
    }
  }
  // the collar of twelve white blades round the portal seat
  const W3 = new V3(well.x, well.y, well.z), Np = new V3(L.portalN.x, L.portalN.y, L.portalN.z);
  const cu = new V3().crossVectors(Np, new V3(0, 1, 0)).normalize(), cv = new V3().crossVectors(Np, cu).normalize();
  const collar = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + rngCo.range(-0.08, 0.08), len = rngCo.range(12, 18), w = rngCo.range(1.7, 2.5);
    tmpA.copy(cu).multiplyScalar(Math.cos(a)).addScaledVector(cv, Math.sin(a));           // radial in the portal plane
    dirv.copy(Np).addScaledVector(tmpA, rngCo.range(0.3, 0.5)).normalize();
    pa.copy(W3).addScaledVector(tmpA, PORTAL_R + 1.5 + w * 0.3).addScaledVector(dirv, -6.5);
    pb.copy(pa).addScaledVector(dirv, len);
    collar.push({ a: pa.clone(), b: pb.clone(), wx: w, wz: w * 0.42, blaze: 1.0, tS: 0.75, seed: rngCo(), hint: tmpA.clone() });
  }
  {
    const all = beams.concat(collar), n = all.length, geo = makeBeamGeo(), sel = new Float32Array(n * 4);
    const mesh = new THREE.InstancedMesh(geo, mkMat(SELENITE_VS, SELENITE_FS), n), mid = new V3();
    all.forEach((b, i) => {
      mid.copy(b.a).add(b.b).multiplyScalar(0.5); dirv.copy(b.b).sub(b.a);
      const len = dirv.length();
      mesh.setMatrixAt(i, setBasis(mid, dirv, len, b.wx, b.wz, b.hint ? 0 : b.seed * TAU, m4, b.hint));
      sel[i * 4] = b.seed; sel[i * 4 + 1] = b.blaze; sel[i * 4 + 2] = len; sel[i * 4 + 3] = b.tS;
    });
    geo.setAttribute('aSel', new THREE.InstancedBufferAttribute(sel, 4));
    mesh.frustumCulled = false; group.add(mesh);
  }
  await ctx.yield();

  // ---- amethyst points in druse clusters on the wall and round the pool
  {
    const NC = Math.round(5200 * (0.6 + 0.4 * detail)), NDR = 56, NFL = 14, NLO = 16, NCAP = NC + NDR * 15 + (NFL + NLO) * 12, geo = makeCrystalGeo(), inst = new Float32Array(NCAP * 3);
    const mesh = new THREE.InstancedMesh(geo, mkMat(CRYSTAL_VS, CRYSTAL_FS), NCAP);
    const cpos = new V3(), cn = new V3(), t1 = new V3(), t2 = new V3(), base = new V3(), tipP = new V3(), d = new V3();
    let n = 0, guard = 0;
    while (n < NC && guard++ < 8000) {
      const onFloor = rngP.chance(0.13);
      if (onFloor) {
        const a = rngP.range(0, TAU), r = rngP.range(23, 54); cpos.set(Math.cos(a) * r, 0, Math.sin(a) * r); cpos.y = L.floorH(cpos.x, cpos.z);
        if (cpos.y < 0.6 || Math.hypot(cpos.x - well.x, cpos.z - well.z) < 14.5 || Math.hypot(cpos.x - sp.x, cpos.z - sp.z) < 17) continue;
        cn.set(-cpos.x * 0.008, 1, -cpos.z * 0.008).normalize();
      } else {
        shellPt(rngP.range(0, TAU), Math.acos(rngP.range(-0.97, 0.992)), tp); inwardAt(tp[0], tp[1], tp[2], tn);
        cpos.set(tp[0], tp[1], tp[2]); cn.set(tn[0], tn[1], tn[2]);
        if (cpos.y < L.floorH(cpos.x, cpos.z) - 0.5) continue;
        L.shaftAt(clamp(cpos.y, 0, 193), ax);
        if (cpos.y > 150 && Math.hypot(cpos.x - ax.x, cpos.z - ax.z) < SHAFT_R + 4) continue;
        if (cpos.distanceTo(mouth) < 9.5 || Math.hypot(cpos.x - hole2[0], cpos.y - hole2[1], cpos.z - hole2[2]) < 8) continue;
      }
      t1.set(cn.y, cn.z, -cn.x).cross(cn).normalize(); t2.crossVectors(cn, t1);
      const giant = rngP.chance(0.2), master = giant ? rngP.range(8, 14) : rngP.range(3, 7) * (onFloor ? 0.7 : 1), count = rngP.int(4, giant ? 10 : 8);
      const hue = Math.pow(rngP(), 2.2), bright = rngP.range(0.8, 1.25), spread = master * rngP.range(0.3, 0.5);
      for (let k = 0; k < count && n < NC; k++) {
        const len = k === 0 ? master : master * rngP.range(0.22, 0.72), lean = k === 0 ? rngP.range(0, 0.3) : rngP.range(0.25, 0.95), la = rngP.range(0, TAU);
        d.copy(cn).addScaledVector(t1, Math.cos(la) * lean).addScaledVector(t2, Math.sin(la) * lean).normalize();
        const off = k === 0 ? 0 : spread * rngP.range(0.5, 1.4);
        base.copy(cpos).addScaledVector(t1, Math.cos(la) * off).addScaledVector(t2, Math.sin(la) * off).addScaledVector(d, -len * 0.2);
        tipP.copy(base).addScaledVector(d, len);
        if (!L.segClear(base, tipP, 4.5, -5, 7, 7.5, 3)) continue;
        const w = len * rngP.range(0.2, 0.3) + 0.15;
        mesh.setMatrixAt(n, setBasis(base, d, len, w, w * rngP.range(0.8, 1.1), rngP.range(0, TAU), m4));
        inst[n * 3] = rngP(); inst[n * 3 + 1] = clamp(hue + rngP.range(-0.1, 0.1), 0, 1); inst[n * 3 + 2] = bright * rngP.range(0.85, 1.15) * (k === 0 ? 1 : 0.78); n++;   // the small ones round a master sit back
      }
      if ((guard & 127) === 0) await ctx.yield();
    }
    await ctx.yield();
    // the great druses: an even golden-angle series over the wall from y 40 to y 160, each a master point 16-26 m long
    // with a crown of satellites radiating from its root. They carry the wall's own light (CRYSTAL_FS: aInst.y = hue + 2 marks them), so
    // every view across the egg has a lit crystal wall behind the timber.
    {
      // a druse refused where it first falls is tried again nearby, up to DR_TRIES places: the second track runs
      // along the wall, so more first places are taken than when the wall had no rail beside it
      const a0 = rngD.range(0, TAU), GA = 2.399963, DR_TRIES = 32;
      for (let i = 0; i < NDR; i++) {
        // one stream a druse, made from the seed and the druse's number, and all of its dice drawn here before any
        // test: every try's place and master, the master's width ratio, roll and seed, the crown's count and each
        // satellite's dice. A druse that gives way to the rails, the column or a sight line moves no other.
        const rd = own('geode-druse' + i), y0 = 40 + 120 * ((i + 0.5) / NDR), hue = Math.pow(rd(), 2.2), bright = rd.range(0.95, 1.25), tries = [], sat = [];
        for (let tr = 0; tr < DR_TRIES; tr++) tries.push([rd.range(-3, 3), tr ? rd.range(-0.45, 0.45) : 0, rd.range(16, 26), rd.range(1.5, 2.25), rd.range(0, 0.22), rd.range(0, TAU)]);
        const mwr = rd.range(0.82, 1.08), mroll = rd.range(0, TAU), msd = rd(), count = rd.int(9, 14);
        for (let k = 0; k < count; k++) sat.push([rd.range(0.3, 0.7), rd.range(0.3, 1.0), rd.range(-0.3, 0.3), rd.range(0.7, 1.9), rd.range(0.11, 0.17), rd.range(0.82, 1.08), rd.range(0, TAU), rd(), rd.range(-0.1, 0.1), rd.range(0.8, 1.05)]);
        for (const [dy, dth, master, mw, lean, la0] of tries) {
          const y = y0 + dy, th = a0 + i * GA + dth;
          shellPt(th, Math.acos(clamp((y - YC) / eggA(y), -1, 1)), tp); inwardAt(tp[0], tp[1], tp[2], tn);
          cpos.set(tp[0], tp[1], tp[2]); cn.set(tn[0], tn[1], tn[2]);
          if (cpos.distanceTo(mouth) < 24 || Math.hypot(cpos.x - hole2[0], cpos.y - hole2[1], cpos.z - hole2[2]) < 15) continue;
          t1.set(cn.y, cn.z, -cn.x).cross(cn).normalize(); t2.crossVectors(cn, t1);
          d.copy(cn).addScaledVector(t1, Math.cos(la0) * lean).addScaledVector(t2, Math.sin(la0) * lean).normalize();
          base.copy(cpos).addScaledVector(d, -master * 0.12); tipP.copy(base).addScaledVector(d, master);
          if (!L.segClear(base, tipP, 5.5 + mw, -6.5, 8.5, 8.5 + mw, 12)) continue;
          if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, ...shaftSeg) < SHAFT_R + 3) continue;
          if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, ...L.revealSeg) < 13) continue;
          let open = true; for (const sg of L.sight) if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, sg[0], sg[1], sg[2], sg[3], sg[4], sg[5]) < 5 + mw) { open = false; break; }
          if (!open) continue;
          mesh.setMatrixAt(n, setBasis(base, d, master, mw, mw * mwr, mroll, m4));
          inst[n * 3] = msd; inst[n * 3 + 1] = 2 + clamp(hue, 0, 1); inst[n * 3 + 2] = bright; n++;
          for (let k = 0; k < count; k++) {
            const [lenK, sl, laJ, offK, wK, wr, roll, sd, hj, bj] = sat[k];
            const len = master * lenK, la = (k / count) * TAU + laJ, off = mw * offK;
            d.copy(cn).addScaledVector(t1, Math.cos(la) * sl).addScaledVector(t2, Math.sin(la) * sl).normalize();
            base.copy(cpos).addScaledVector(t1, Math.cos(la) * off).addScaledVector(t2, Math.sin(la) * off).addScaledVector(d, -len * 0.18);
            tipP.copy(base).addScaledVector(d, len);
            const w = len * wK + 0.25;
            if (!L.segClear(base, tipP, 4.8 + w, -5.5, 7.5, 7.8 + w, 8)) continue;
            if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, ...shaftSeg) < SHAFT_R + 2) continue;
            mesh.setMatrixAt(n, setBasis(base, d, len, w, w * wr, roll, m4));
            inst[n * 3] = sd; inst[n * 3 + 1] = 2 + clamp(hue + hj, 0, 1); inst[n * 3 + 2] = bright * bj; n++;
          }
          break;
        }
        if ((i & 3) === 3) await ctx.yield();
      }
    }
    // the same light at the bottom of the cave: great points standing on the cavern floor (an even golden-angle ring
    // series) and druses low on the wall (y 6 to 40, the series above carried on down), so that crystals lit from within
    // are seen at every distance down to the floor. Each cluster deals from a stream of its own ('geode-floor' and its
    // number), so one that has to give way to the leap, the well or a sight line moves no other.
    {
      const rf = own('geode-floor'), a0 = rf.range(0, TAU), r0 = rf(), GA = 2.399963;
      for (let i = 0; i < NFL + NLO; i++) {
        const rc = own('geode-floor' + i), onFloor = i < NFL, hue = Math.pow(rc(), 2.2), bright = rc.range(0.95, 1.25);
        const master = onFloor ? rc.range(12, 22) : rc.range(11, 18), mw = master * rc.range(0.085, 0.11), lean = rc.range(0, onFloor ? 0.28 : 0.22), la0 = rc.range(0, TAU);
        if (onFloor) {
          const a = a0 + i * GA, r = 27 + 24 * ((r0 + i * 0.618034) % 1);
          cpos.set(Math.cos(a) * r, 0, Math.sin(a) * r); cpos.y = L.floorH(cpos.x, cpos.z); cn.set(-cpos.x * 0.006, 1, -cpos.z * 0.006).normalize();
          if (cpos.y < 0.3 || Math.hypot(cpos.x - well.x, cpos.z - well.z) < 20 || Math.hypot(cpos.x - sp.x, cpos.z - sp.z) < 19) continue;
        } else {
          const y = 6 + 34 * ((i - NFL + 0.5) / NLO) + rc.range(-2, 2);
          shellPt(a0 + i * GA, Math.acos(clamp((y - YC) / eggA(y), -1, 1)), tp); inwardAt(tp[0], tp[1], tp[2], tn);
          cpos.set(tp[0], tp[1], tp[2]); cn.set(tn[0], tn[1], tn[2]);
          if (cpos.y < L.floorH(cpos.x, cpos.z) - 1) continue;
        }
        t1.set(cn.y, cn.z, -cn.x).cross(cn).normalize(); t2.crossVectors(cn, t1);
        d.copy(cn).addScaledVector(t1, Math.cos(la0) * lean).addScaledVector(t2, Math.sin(la0) * lean).normalize();
        base.copy(cpos).addScaledVector(d, -master * 0.1); tipP.copy(base).addScaledVector(d, master);
        if (!L.segClear(base, tipP, 5.5 + mw, -6.5, 8.5, 9.5 + mw, 12)) continue;
        if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, ...shaftSeg) < SHAFT_R + 3) continue;
        let open = true; for (const sg of L.sight) if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, sg[0], sg[1], sg[2], sg[3], sg[4], sg[5]) < 5 + mw) { open = false; break; }
        if (!open) continue;
        mesh.setMatrixAt(n, setBasis(base, d, master, mw, mw * rc.range(0.82, 1.08), rc.range(0, TAU), m4));
        inst[n * 3] = rc(); inst[n * 3 + 1] = 2 + clamp(hue, 0, 1); inst[n * 3 + 2] = bright; n++;
        const count = rc.int(7, 11);
        for (let k = 0; k < count; k++) {
          const len = master * rc.range(0.28, 0.66), sl = rc.range(0.3, 1.0), la = (k / count) * TAU + rc.range(-0.3, 0.3), off = mw * rc.range(0.7, 1.9);
          d.copy(cn).addScaledVector(t1, Math.cos(la) * sl).addScaledVector(t2, Math.sin(la) * sl).normalize();
          base.copy(cpos).addScaledVector(t1, Math.cos(la) * off).addScaledVector(t2, Math.sin(la) * off).addScaledVector(d, -len * 0.18);
          tipP.copy(base).addScaledVector(d, len);
          const w = len * rc.range(0.11, 0.17) + 0.25, wr = rc.range(0.82, 1.08), roll = rc.range(0, TAU), sd = rc(), hj = rc.range(-0.1, 0.1), bj = rc.range(0.8, 1.05);
          if (!L.segClear(base, tipP, 4.8 + w, -5.5, 7.5, 8.5 + w, 8)) continue;
          if (segSegDist(base.x, base.y, base.z, tipP.x, tipP.y, tipP.z, ...shaftSeg) < SHAFT_R + 2) continue;
          mesh.setMatrixAt(n, setBasis(base, d, len, w, w * wr, roll, m4));
          inst[n * 3] = sd; inst[n * 3 + 1] = 2 + clamp(hue + hj, 0, 1); inst[n * 3 + 2] = bright * bj; n++;
        }
        if ((i & 7) === 7) await ctx.yield();
      }
    }
    mesh.count = n;
    geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 3));
    mesh.frustumCulled = false; group.add(mesh);
  }
  await ctx.yield();

  // ---- the trestle: instanced open boxes (timber, iron chain, rail)
  const mats = [], tims = [], rngT = own('geode-timber');                     // every member's grain: a stream of the trestle's own
  const addMember = (a, b, w, d, kind, hint, brace = 0) => {
    dirv.copy(b).sub(a); const len = dirv.length(); if (len < 0.05) return;
    setBasis(a, dirv, len, w, d, 0, m4, hint); for (let i = 0; i < 16; i++) mats.push(m4.elements[i]);
    tims.push(rngT(), kind, brace);
  };
  // the clear space (see CLEAR): true when the segment a-b enters it. Taken at every metre of the member against every
  // rail point; "under the deck" is judged at the rail point nearest in plan on the same turn.
  const NO = L.outer.length, wallSide = (i) => i >= L.helixStartIdx - 4 && i <= L.helixEndIdx + 4;   // where the second track runs beside ours
  const inClear = (a, b) => {
    const n = Math.max(1, Math.ceil(a.distanceTo(b)));
    for (let s = 0; s <= n; s++) {
      const t = s / n, x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t), z = lerp(a.z, b.z, t);
      for (let i = 0; i < NO; i++) {
        const p = L.outer[i], dx = x - p.x, dy = y - (p.y + EYE_H), dz = z - p.z;
        if (dy > CLEAR || dy < -CLEAR || dx * dx + dy * dy + dz * dz >= CLEAR * CLEAR) continue;
        let j = i, bd = 1e9;
        for (let k = Math.max(0, i - 6); k <= Math.min(NO - 1, i + 6); k++) { const q = L.outer[k], d2 = (x - q.x) ** 2 + (z - q.z) ** 2; if (d2 < bd) { bd = d2; j = k; } }
        const q = L.outer[j], l = (x - q.x) * q.hz - (z - q.z) * q.hx;         // metres to the left of the rail (the inside of the helix)
        if (y < q.y && (wallSide(j) ? l <= DECK_EDGE + 0.05 : Math.abs(l) <= DECK_IN)) continue;
        return true;
      }
    }
    return false;
  };
  // 0 = free, 1 = fouls a track or the leap, 2 = runs into a selenite beam
  const blocked = (a, b) => {
    if (!L.segClear(a, b, 2.7, -0.55, 4.9, 6.5, Math.max(3, Math.ceil(a.distanceTo(b) / 2.5))) || inClear(a, b)) return 1;
    for (const o of beams) if (segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) < o.wx * 0.5 + 0.1) return 2;
    for (const sg of L.sight) if (segSegDist(a.x, a.y, a.z, b.x, b.y, b.z, sg[0], sg[1], sg[2], sg[3], sg[4], sg[5]) < 2.6) return 1;
    return 0;
  };
  const underGround = (p) => eggE(p.x, p.y, p.z) > 0.985 || p.y < L.floorH(p.x, p.z) - 0.2;
  const leftOf = (p, out) => out.set(p.hz, 0, -p.hx);
  const up = new V3(0, 1, 0), hd = new V3(), lf = new V3(), A = new V3(), B = new V3();
  const deck = (pts, i0, i1, ours = false) => {
    for (let i = i0; i <= i1; i++) {
      const p = pts[i]; leftOf(p, lf); hd.set(p.hx, 0, p.hz);
      // our sleepers stop at DECK_EDGE on a cave side; beside the second track they keep their full reach toward the wall
      A.set(p.x, p.y - 0.24, p.z).addScaledVector(lf, ours && !wallSide(i) ? -DECK_EDGE : -1.0); B.set(p.x, p.y - 0.24, p.z).addScaledVector(lf, ours ? DECK_EDGE : 1.0);
      addMember(A, B, 0.24, 0.17, 0, hd);                                                   // sleeper
      if ((i - i0) % 2 === 0 && i + 2 <= i1) for (const s of [-0.5, 0.5]) {                 // rails
        const q = pts[i + 2]; A.set(p.x, p.y - 0.07, p.z).addScaledVector(lf, s); leftOf(q, tmpB); B.set(q.x, q.y - 0.07, q.z).addScaledVector(tmpB, s);
        addMember(A, B, 0.1, 0.14, 2, lf);
      }
      if ((i - i0) % 3 === 0 && i + 3 <= i1) for (const s of [-0.58, 0.58]) {               // stringers
        const q = pts[i + 3]; A.set(p.x, p.y - 0.55, p.z).addScaledVector(lf, s); leftOf(q, tmpB); B.set(q.x, q.y - 0.55, q.z).addScaledVector(tmpB, s);
        addMember(A, B, 0.26, 0.42, 0, lf);
      }
    }
  };
  deck(L.outer, 0, L.outer.length - 1, true); deck(L.second, 0, L.second.length - 1);
  await ctx.yield();
  // one bent: a cap beam and two battered legs marched down in 16 m lifts until rock, a beam, or a track stops them.
  // A spec gives the cap's two ends and each leg's place and batter, in metres to the left of our rail's centre line:
  // on the approach and the spur both legs stand under the deck; round the helix our rail rides the cave-side edge of
  // the deck and both legs stand beyond the second track as a tower by the wall, with a knee brace up under each track.
  const LIFT = 16, GAP = HR2 - HR;
  const B_OPEN = { cap: [-1.3, 1.3], leg: [[-1.0, -1 / 12], [1.0, 1 / 12]], yoke: 6.3, chain: [[-6.5, -0.06], [6.5, 0.06]] };
  const B_HELIX = { cap: [-GAP - 6.8, DECK_EDGE], leg: [[-GAP - 5.5, -1 / 12], [-GAP - 2.9, -1 / 40]], knee: [-0.6, -GAP], chain: [[-GAP - 6.4, -0.16], [-GAP - 3.7, -0.04]] };
  const bent = (p, lat, spec, id, stilts = true) => {
    const res = { legs: [[], []], feet: [null, null], hang: !stilts, p, lat: lat.clone(), spec, id };
    A.set(p.x, p.y - 0.78, p.z).addScaledVector(lat, spec.cap[0]); B.set(p.x, p.y - 0.78, p.z).addScaledVector(lat, spec.cap[1]);
    addMember(A, B, 0.36, 0.44, 0, up);
    for (let side = 0; side < 2; side++) {
      const off = spec.leg[side][0], rate = spec.leg[side][1], leg = res.legs[side];
      let prev = new V3(p.x, p.y - 1.0, p.z).addScaledVector(lat, off); leg.push(prev);
      let foot = null;
      for (let k = 1; k < 12 && stilts; k++) {
        const nx = new V3(p.x, p.y - 1.0 - k * LIFT, p.z).addScaledVector(lat, off + rate * k * LIFT);
        let end = false;
        if (underGround(nx)) { let lo = 0, hi = 1; for (let it = 0; it < 7; it++) { const mdl = (lo + hi) / 2; tmpC.lerpVectors(prev, nx, mdl); if (underGround(tmpC)) hi = mdl; else lo = mdl; } nx.lerpVectors(prev, nx, Math.min(1, hi + 0.04)); end = true; }
        const bl = blocked(prev, nx);
        if (bl) { if (bl === 1) res.hang = true; break; }
        foot = nx;
        if (end) break;
        leg.push(nx); prev = nx;
      }
      if (foot) addMember(leg[0], foot, 0.38, 0.38, 0, lat);                                // one straight battered stilt
      res.feet[side] = foot;
    }
    if (spec.knee && res.feet[1]) for (const kx of spec.knee) {                             // knee braces from the near leg, 9 m down it
      A.set(p.x, p.y - 10.0, p.z).addScaledVector(lat, spec.leg[1][0] + spec.leg[1][1] * 9); B.set(p.x, p.y - 1.0, p.z).addScaledVector(lat, kx);
      if (res.feet[1].y < A.y && !blocked(A, B)) addMember(A, B, 0.24, 0.28, 0, up);
    }
    const [lo_, li_] = res.legs;
    for (let k = 1; k < Math.min(lo_.length, li_.length); k++) {
      if (!blocked(lo_[k], li_[k])) addMember(lo_[k], li_[k], 0.22, 0.26, 0, up);
      if ((id + k) & 1) { if (!blocked(lo_[k - 1], li_[k])) addMember(lo_[k - 1], li_[k], 0.16, 0.18, 0, up, 1); } else if (!blocked(li_[k - 1], lo_[k])) addMember(li_[k - 1], lo_[k], 0.16, 0.18, 0, up, 1);
    }
    return res;
  };
  const tieRun = (run) => {                   // longitudinal girts and diagonals between neighbouring bents
    for (let j = 0; j + 1 < run.length; j++) for (let side = 0; side < 2; side++) {
      const a = run[j].legs[side], b = run[j + 1].legs[side], n = Math.min(a.length, b.length);
      for (let k = 1; k < n; k++) {
        if (k % 2 === 1) { if (!blocked(a[k], b[k])) addMember(a[k], b[k], 0.2, 0.24, 0, up, 1); }
      }
    }
  };
  const lat = new V3(), runs = [[], [], [], []];
  for (let i = 4; i < L.helixStartIdx - 2; i += 6) { const p = L.outer[i]; runs[0].push(bent(p, leftOf(p, lat), B_OPEN, runs[0].length)); }
  await ctx.yield();
  for (let i = L.helixStartIdx; i <= L.helixEndIdx; i += 6) {
    const p = L.outer[i], j = Math.round((i - L.helixStartIdx) / 6), bt = bent(p, leftOf(p, lat), B_HELIX, j, j % 2 === 0); bt.helix = true;
    if (j % 2 === 0) runs[1].push(bt); else runs[3].push(bt);
    if ((j & 3) === 3) await ctx.yield();
  }
  await ctx.yield();
  for (let i = L.helixEndIdx + 7; i < L.outer.length - 1; i += 6) { const p = L.outer[i]; runs[2].push(bent(p, leftOf(p, lat), B_OPEN, runs[2].length)); }
  await ctx.yield();
  for (let r = 0; r < 3; r++) { tieRun(runs[r]); await ctx.yield(); }
  // chains to the roof: wherever a stilt had to give way, and on every third bent of the top turn
  const chainTops = [];
  runs.forEach((run, ri) => run.forEach((bt, j) => {
    if (!bt.hang) return;
    // on the approach and the spur a hanging bent stands on two hangers on a yoke beam slung under the deck, and the
    // chains rise from the yoke's ends, outside the clear space
    const yk = bt.spec.yoke || 0, ch = bt.spec.chain;
    if (yk) {
      A.set(bt.p.x, bt.p.y - yk, bt.p.z).addScaledVector(bt.lat, ch[0][0]); B.set(bt.p.x, bt.p.y - yk, bt.p.z).addScaledVector(bt.lat, ch[1][0]);
      if (blocked(A, B)) return;
      addMember(A, B, 0.3, 0.36, 0, up);
      for (const sd of [0, 1]) { A.set(bt.p.x, bt.p.y - yk, bt.p.z).addScaledVector(bt.lat, bt.spec.leg[sd][0]); B.set(bt.p.x, bt.p.y - 0.9, bt.p.z).addScaledVector(bt.lat, bt.spec.leg[sd][0]); addMember(A, B, 0.2, 0.2, 0, bt.lat); }
    }
    for (const s of [0, 1]) {
      if (s === 1 && bt.helix && bt.id >= 28) continue;                                     // under the turn above: outer chain only
      const off = ch[s][0], lean = ch[s][1];
      A.set(bt.p.x, bt.p.y - (yk || 0.6), bt.p.z).addScaledVector(bt.lat, off);
      dirv.copy(bt.lat).multiplyScalar(lean).add(up).normalize();
      let sLen = 4; while (sLen < 120 && eggE(A.x + dirv.x * sLen, A.y + dirv.y * sLen, A.z + dirv.z * sLen) < 0.99) sLen += 1;
      B.copy(A).addScaledVector(dirv, sLen);
      tmpB.copy(A).addScaledVector(dirv, 1.5);
      if (blocked(tmpB, B)) continue;
      addMember(A, B, 0.13, 0.13, 1, bt.lat); chainTops.push(B.clone());
    }
  }));
  await ctx.yield();
  // ---- small things of known size, far below and across the cave: miners' lamps and ladderways (a stream of their own,
  // 'geode-lamps'). A lamp stands on a post at the wall-side end of the cap of every second tower round the helix and
  // lamps hang down those towers at every second lift; two towers drawn by the seed carry a ladderway from the deck to
  // the floor with a lamp at each landing; lamps stand round the well's curb and by each tarn.
  const lampPts = [], rngL = own('geode-lamps');
  {
    const towers = runs[1].filter((bt) => bt.feet[0] && bt.feet[1] && bt.legs[0].length > 2 && bt.legs[1].length > 2);
    const ladA = towers.length ? towers[rngL.int(0, towers.length - 1)] : null, ladB = towers.length ? towers[rngL.int(0, towers.length - 1)] : null;
    runs[1].forEach((bt, j) => {
      hd.set(-bt.lat.z, 0, bt.lat.x);
      if (j % 2 === 0) {
        A.set(bt.p.x, bt.p.y - 0.6, bt.p.z).addScaledVector(bt.lat, bt.spec.cap[0] + 0.3); B.copy(A).setY(bt.p.y + 1.9);
        addMember(A, B, 0.14, 0.14, 0, bt.lat); lampPts.push(B.x, B.y + 0.25, B.z, 1.5);
      }
      const ladder = bt === ladA || bt === ladB, lo_ = bt.legs[0], li_ = bt.legs[1], n = Math.min(lo_.length, li_.length);
      for (let k = 1; k < n; k++) {
        if (ladder || (j % 2 === 0 && k % 2 === 0)) lampPts.push((lo_[k].x + li_[k].x) / 2 + hd.x * 0.5, lo_[k].y + 1.7, (lo_[k].z + li_[k].z) / 2 + hd.z * 0.5, 1.3);
        if (!ladder) continue;
        for (const o of [0.3, 0.62, 0.94]) { A.copy(lo_[k]).addScaledVector(hd, o).setY(lo_[k].y + 0.16); B.copy(li_[k]).addScaledVector(hd, o).setY(li_[k].y + 0.16); addMember(A, B, 0.3, 0.05, 0, up); }   // the landing
        const top = (k & 1) ? li_[k - 1] : lo_[k - 1], bot = (k & 1) ? lo_[k] : li_[k], fl = top.distanceTo(bot), nr = Math.floor(fl / 0.42);
        for (const o of [0.4, 0.84]) { A.copy(bot).addScaledVector(hd, o).setY(bot.y + 0.2); B.copy(top).addScaledVector(hd, o).setY(top.y + 0.2); addMember(A, B, 0.07, 0.09, 0, hd); }   // the flight's stiles
        for (let r = 1; r < nr; r++) { tmpC.lerpVectors(bot, top, r / nr); tmpC.y += 0.2; A.copy(tmpC).addScaledVector(hd, 0.4); B.copy(tmpC).addScaledVector(hd, 0.84); addMember(A, B, 0.045, 0.045, 0, up, 1); }   // rungs
      }
    });
    const a0 = rngL.range(0, TAU);
    for (let i = 0; i < 6; i++) {                                                           // round the well's curb
      const a = a0 + (i / 6) * TAU, x = well.x + Math.cos(a) * 11.5, z = well.z + Math.sin(a) * 11.5, y0 = L.floorH(x, z);
      A.set(x, y0 - 0.3, z); B.set(x, y0 + 2.4, z);
      if (blocked(A, B)) continue;
      addMember(A, B, 0.16, 0.16, 0, up); lampPts.push(x, y0 + 2.65, z, 1.4);
    }
    for (const t of L.tarns) {                                                              // by each tarn, on the side away from the pool
      const dx = t.x - L.pool.x, dz = t.z - L.pool.z, dl = Math.hypot(dx, dz) || 1, sw = rngL.range(-0.7, 0.7), cs = Math.cos(sw), sn = Math.sin(sw);
      const x = t.x + ((dx * cs - dz * sn) / dl) * (t.r + 1.4), z = t.z + ((dx * sn + dz * cs) / dl) * (t.r + 1.4), y0 = L.floorH(x, z);
      A.set(x, y0 - 0.3, z); B.set(x, y0 + 2.4, z);
      if (blocked(A, B)) continue;
      addMember(A, B, 0.16, 0.16, 0, up); lampPts.push(x, y0 + 2.65, z, 1.4);
    }
  }
  // the splintered end of the spur, and a buffer stop where the second track begins
  {
    const e = L.railEnd; leftOf(e, lf); hd.set(e.hx, 0, e.hz);
    for (let i = 0; i < 9; i++) {
      A.set(e.x, e.y - rngSp.range(0.1, 0.8), e.z).addScaledVector(lf, rngSp.range(-1.2, 1.2)).addScaledVector(hd, rngSp.range(-1.5, 0));
      dirv.copy(hd).multiplyScalar(rngSp.range(0.6, 1)).addScaledVector(lf, rngSp.range(-0.5, 0.5)); dirv.y = rngSp.range(-0.9, 0.15); dirv.normalize();
      B.copy(A).addScaledVector(dirv, rngSp.range(1.2, 3.6));
      const bl = clamp((B.x - e.x) * lf.x + (B.z - e.z) * lf.z, -DECK_IN + 0.1, DECK_IN - 0.1);   // the broken ends stay under the deck's line: below the rail top, no wider than the deck
      B.addScaledVector(lf, bl - ((B.x - e.x) * lf.x + (B.z - e.z) * lf.z));
      B.y = Math.min(B.y, e.y - 0.05 - 0.3 * Math.max(0, (B.x - e.x) * hd.x + (B.z - e.z) * hd.z));   // and under the line of the leap (15 degrees down from the rail end), so the falling cart clears them
      addMember(A, B, rngSp.range(0.12, 0.3), rngSp.range(0.1, 0.24), i < 2 ? 2 : 0, up);
    }
    const s = L.second[0]; leftOf(s, lf); hd.set(s.hx, 0, s.hz);
    for (const sd of [-0.6, 0.6]) {
      A.set(s.x, s.y - 0.2, s.z).addScaledVector(lf, sd); B.copy(A).addScaledVector(hd, -1.3).addScaledVector(up, 1.5); addMember(A, B, 0.26, 0.26, 0, lf);
      A.copy(B); B.set(s.x, s.y - 0.2, s.z).addScaledVector(lf, sd).addScaledVector(hd, -2.6); addMember(A, B, 0.22, 0.22, 0, lf);
    }
    A.set(s.x, s.y + 1.2, s.z).addScaledVector(lf, -1).addScaledVector(hd, -1.2); B.copy(A).addScaledVector(lf, 2); addMember(A, B, 0.3, 0.3, 0, up);
  }
  {
    const n = tims.length / 3, geo = makeBoxGeo();
    const mesh = new THREE.InstancedMesh(geo, mkMat(TIMBER_VS, TIMBER_FS), n);
    mesh.instanceMatrix.array.set(mats); mesh.instanceMatrix.needsUpdate = true;
    geo.setAttribute('aTim', new THREE.InstancedBufferAttribute(new Float32Array(tims), 3));
    mesh.frustumCulled = false; group.add(mesh);
  }
  await ctx.yield();

  // ---- the pool
  {
    const pl = L.pool, nu = 56, nv = 14, pos = [], shore = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = (i / nu) * TAU, r = pl.r * 1.3 * (j / nv), x = pl.x + Math.cos(a) * r, z = pl.z + Math.sin(a) * r;
      pos.push(x, 0, z);
      shore.push(Math.hypot(x - well.x, z - well.z) < 9.5 ? 0 : clamp(-L.floorH(x, z) / 0.7, 0, 1));
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    for (const t of L.tarns) {                                                   // the tarns: one small disc each, at its own level
      const base = pos.length / 3, ns = 20, nr = 5;
      for (let j = 0; j <= nr; j++) for (let i = 0; i <= ns; i++) {
        const a = (i / ns) * TAU, r = (t.r * 1.14 + 0.3) * (j / nr), x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
        pos.push(x, t.y, z); shore.push(clamp((t.y - L.floorH(x, z)) / 0.3, 0, 1));
      }
      for (let j = 0; j < nr; j++) for (let i = 0; i < ns; i++) { const a = base + j * (ns + 1) + i, b = a + 1, c = a + ns + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
    geo.setAttribute('aShore', new THREE.Float32BufferAttribute(shore, 1)); geo.setIndex(idx);
    const rings = []; for (let i = 0; i < 6; i++) rings.push(new THREE.Vector4(pl.x + rngRi.range(-16, 16), pl.z + rngRi.range(-16, 16), rngRi.range(0.12, 0.3), rngRi.range(1.2, 2.2)));
    U.uRing = { value: rings };
    const mesh = new THREE.Mesh(geo, mkMat(POOL_VS, POOL_FS, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    mesh.renderOrder = 1; mesh.frustumCulled = false; group.add(mesh);
  }

  // ---- the daylight column and the blade from the second sinkhole (one additive mesh), and the two discs of sky
  const blade = { from: new V3(hole2[0], hole2[1], hole2[2]), to: new V3() };
  {
    const t = shellPt(th2 + Math.PI + rngBl.range(-1.1, 1.1), rngBl.range(0.85, 1.1), [0, 0, 0]); blade.to.set(t[0], t[1], t[2]);
    const pos = [], nor = [], aK = [], idx = [], e1 = new V3(), e2 = new V3(), axd = new V3();
    const tube = (a, b, r0, r1, segs, rows, strength) => {
      const base = pos.length / 3; axd.copy(b).sub(a).normalize();
      e1.set(1, 0, 0).addScaledVector(axd, -axd.x).normalize(); e2.crossVectors(axd, e1);
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= segs; i++) {
        const v = j / rows, an = (i / segs) * TAU, r = lerp(r0, r1, v), cx = Math.cos(an), sx = Math.sin(an);
        pos.push(lerp(a.x, b.x, v) + (e1.x * cx + e2.x * sx) * r, lerp(a.y, b.y, v) + (e1.y * cx + e2.y * sx) * r, lerp(a.z, b.z, v) + (e1.z * cx + e2.z * sx) * r);
        nor.push(e1.x * cx + e2.x * sx, e1.y * cx + e2.y * sx, e1.z * cx + e2.z * sx); aK.push(v, strength, an);
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) { const p0 = base + j * (segs + 1) + i, p1 = p0 + 1, p2 = p0 + segs + 1, p3 = p2 + 1; idx.push(p0, p2, p1, p1, p2, p3); }
    };
    tube(L.shaftA, L.shaftB, SHAFT_R + 2.5, SHAFT_R - 0.5, 48, 8, 1);
    tube(blade.to, blade.from, 3.4, 2.0, 16, 2, 2.2);
    tube(W3, tmpA.copy(W3).addScaledVector(Np, 58), 7.6, 3.0, 24, 4, 14.5);       // the well breathes light back up the line of the leap
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 3)); geo.setIndex(idx);
    const mesh = new THREE.Mesh(geo, mkMat(SHAFT_VS, SHAFT_FS, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    mesh.renderOrder = 3; mesh.frustumCulled = false; group.add(mesh);
    // sky discs
    const sp2 = [], si = [];
    const disc = (c, n, r) => {
      const base = sp2.length / 3; e1.set(1, 0, 0).addScaledVector(n, -n.x).normalize(); e2.crossVectors(n, e1);
      sp2.push(c.x, c.y, c.z);
      for (let i = 0; i <= 24; i++) { const an = (i / 24) * TAU; sp2.push(c.x + (e1.x * Math.cos(an) + e2.x * Math.sin(an)) * r, c.y + (e1.y * Math.cos(an) + e2.y * Math.sin(an)) * r, c.z + (e1.z * Math.cos(an) + e2.z * Math.sin(an)) * r); }
      for (let i = 0; i < 24; i++) si.push(base, base + 1 + i, base + 2 + i);
    };
    disc(L.shaftB, new V3(0, 1, 0), SHAFT_R + 6);
    tmpA.set(hole2In[0], hole2In[1], hole2In[2]); disc(tmpB.copy(blade.from).addScaledVector(tmpA, -5), tmpA, 9);
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3)); sg.setIndex(si); sg.computeVertexNormals();
    U.uCloudPos = { value: 0 };
    const sky = new THREE.Mesh(sg, mkMat(SKY_VS, SKY_FS, {}, { fog: false, side: THREE.DoubleSide }));
    sky.frustumCulled = false; group.add(sky);
  }
  await ctx.yield();

  // ---- thread waterfalls, roots, ferns, horsetails, cable ropes: one ribbon mesh; smoke points where falls land
  const rp = [], rd = [], rr = [], ri = [], smokeAt = [];
  const ribbon = (pts, kind, seed, hw0, hw1, alongFn) => {      // pts: [Vector3]
    const base = rp.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; dirv.copy(b).sub(a).normalize();
      const hw = lerp(hw0, hw1, i / (n - 1)), al = alongFn ? alongFn(i) : i / (n - 1);
      for (const s of [-1, 1]) { rp.push(p.x, p.y, p.z); rd.push(dirv.x, dirv.y, dirv.z); rr.push(s * hw, kind, al, seed); }
    }
    for (let i = 0; i < n - 1; i++) { const a = base + i * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const fallFrom = (x, y, z, seed) => {       // drop a thread from (x, y, z) to whatever is below it
    let yb = y; const fl = L.floorH(x, z);
    for (yb = y - 3; yb > Math.max(fl, 0); yb -= 1) { let hit = false; for (const o of beams) if (segSegDist(x, yb, z, x, yb - 0.5, z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) < o.wx * 0.42) { hit = true; break; } if (hit) break; }
    const len = y - yb, n = Math.max(3, Math.ceil(len / 4)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(new V3(x, y - (len * i) / n, z));
    ribbon(pts, 0, seed, 0.4, 0.62 + len * 0.004, (i) => (len * i) / n);
    smokeAt.push(new V3(x, yb, z));
    return len;
  };
  const rngW = own('geode-threads'), rngH = own('geode-horsetails');           // tried until they fit, like the beams: streams of their own
  let fallPass = null, nFirstFalls = 0;
  {
    const fi = L.helixStartIdx + Math.round(L.nH * 0.43), fp = L.outer[fi], rxx = (L.hc.x - fp.x) / HR, rzz = (L.hc.z - fp.z) / HR;
    const fx = fp.x + rxx * 12.8, fz = fp.z + rzz * 12.8; let fy = fp.y + 40; while (fy > fp.y + 8 && eggE(fx, fy + 3, fz) > 0.97) fy -= 2;
    fallFrom(fx, fy, fz, rngW()); fallPass = { position: new V3(fx, fp.y + 1.7, fz), dist: fi * 1.5 };
    for (let i = 0, tries = 0; i < 5 && tries < 200; tries++) {
      const b = rngW.pick(beams), t = rngW.range(0.25, 0.75), x = lerp(b.a.x, b.b.x, t), y = lerp(b.a.y, b.b.y, t) - b.wx * 0.4, z = lerp(b.a.z, b.b.z, t);
      if (y < 45) continue;
      let ok = true; for (let yy = y; yy > 2; yy -= 3) if (!L.clear(x, yy, z, 5, -4, 9, 8)) { ok = false; break; }
      if (!ok) continue;
      if (fallFrom(x, y, z, rngW()) < 14) { /* short threads are fine too */ } i++;
    }
    nFirstFalls = smokeAt.length;                                              // the threads above are the first ones: their smoke draws from their own stream
    // more threads, on the WALL side of the helix: where a beam crosses over the strip that lies between THREAD_OUT and
    // THREAD_OUT + THREAD_BAND metres beyond the second track (farther from the helix's axis than its rail), so each
    // falls between the loose cart's track and the wall, behind the rider's rail, and none falls on the cave side
    // between the eye and the cave. An even series round the helix, each dropping to whatever lies below it.
    const cand = [];
    for (const b of beams) {
      let best = null;
      for (let k = 2; k <= 18; k++) {
        const t = k / 20, x = lerp(b.a.x, b.b.x, t), y = lerp(b.a.y, b.b.y, t) - b.wx * 0.4, z = lerp(b.a.z, b.b.z, t);
        const out = Math.hypot(x - L.hc.x, z - L.hc.z) - HR2;
        if (out < THREAD_OUT || out > THREAD_OUT + THREAD_BAND) continue;
        for (let i = L.helixStartIdx; i <= L.helixEndIdx; i += 2) {
          const p = L.outer[i], dy = y - p.y; if (dy < 5 || dy > 30) continue;
          const dh = Math.hypot(x - p.x, z - p.z);
          if (!best || dh < best.dh) best = { x, y, z, dh, i };
        }
      }
      if (best) cand.push(best);
    }
    await ctx.yield();
    cand.sort((a, b) => a.i - b.i);
    for (const c of cand) c.seed = rngF();                                      // every candidate's seed, before any is tested
    let lastI = -99, made = 0;
    for (const c of cand) {
      if (made >= 8 || c.i - lastI < 14) continue;
      let ok = true; for (let yy = c.y; yy > 2; yy -= 3) if (!L.clear(c.x, yy, c.z, 4.6, -4, 9, 8)) { ok = false; break; }
      if (!ok) continue;
      fallFrom(c.x, c.y, c.z, c.seed); lastI = c.i; made++;
    }
  }
  await ctx.yield();
  // roots and ferns round the sinkhole
  for (let i = 0; i < 46; i++) {
    const a = rngRo.range(0, TAU), len = rngRo.range(6, 22) * (rngRo.chance(0.2) ? 1.3 : 1), y0 = rngRo.range(171, 176), r0 = SHAFT_R + rngRo.range(-0.6, 0.6), bend = rngRo.range(-2.5, 1), pts = [];
    for (let k = 0; k <= 7; k++) { const t = k / 7, y = y0 - len * t; L.shaftAt(y, ax); const r = r0 + bend * t * t; pts.push(new V3(ax.x + Math.cos(a) * r, y, ax.z + Math.sin(a) * r)); }
    ribbon(pts, 1, rngRo(), 0.13, 0.03);
  }
  for (let i = 0; i < 80; i++) {
    const a = rngFe.range(0, TAU), y0 = rngFe.range(170.5, 180), len = rngFe.range(2.5, 5.5), pts = []; L.shaftAt(y0, ax);
    for (let k = 0; k <= 3; k++) { const t = k / 3, r = SHAFT_R + 0.3 - len * 0.75 * t; pts.push(new V3(ax.x + Math.cos(a) * r, y0 + len * (0.25 * t - 0.6 * t * t), ax.z + Math.sin(a) * r)); }
    ribbon(pts, 3, rngFe(), 0.7, 0.05);
  }
  // pale horsetails standing in the oval of light
  for (let i = 0, tries = 0; i < 170 && tries < 900; tries++) {
    const a = rngH.range(0, TAU), r = rngH.range(3, 16), x = sp.x + Math.cos(a) * r, z = sp.z + Math.sin(a) * r, h = L.floorH(x, z);
    if (h < 0.15 || Math.hypot(x - well.x, z - well.z) < 10) continue;
    const len = rngH.range(1.4, 3.2), lx = rngH.range(-0.15, 0.15), lz = rngH.range(-0.15, 0.15);
    ribbon([new V3(x, h - 0.1, z), new V3(x + lx * len * 0.5, h + len * 0.5, z + lz * len * 0.5), new V3(x + lx * len, h + len, z + lz * len)], 4, rngH(), 0.1, 0.035); i++;
  }
  // the cableway: two ropes wall to wall, passing over our rail soon after the helix begins
  const bIdx = L.helixStartIdx + 8, bp = L.outer[bIdx], cabA = new V3(), cabB = new V3(), cabSide = new V3(); let cabSag = 5;
  {
    let bestScore = -1;
    for (let tries = 0; tries < 24; tries++) {
      const an = Math.atan2(bp.hz, bp.hx) + Math.PI / 2 + rngCa.range(-0.75, 0.75); dirv.set(Math.cos(an), 0, Math.sin(an));
      tmpA.set(bp.x, bp.y + 9.4, bp.z);
      const s1 = toWall(tmpA, dirv, 180), s0 = toWall(tmpA, tmpB.copy(dirv).negate(), 180), frac = s0 / (s0 + s1), yEnd = tmpA.y + cabSag * 4 * frac * (1 - frac);
      pa.copy(tmpA).addScaledVector(dirv, -s0); pb.copy(tmpA).addScaledVector(dirv, s1); pa.y = pb.y = yEnd;
      let minD = 99; for (const o of beams) minD = Math.min(minD, segSegDist(pa.x, pa.y - 3, pa.z, pb.x, pb.y - 3, pb.z, o.a.x, o.a.y, o.a.z, o.b.x, o.b.y, o.b.z) - o.wx * 0.5);
      L.shaftAt(150, ax); minD = Math.min(minD, 99);
      const score = Math.min(minD, 8) + (s0 + s1) * 0.01;
      if (score > bestScore) { bestScore = score; cabA.copy(pa); cabB.copy(pb); cabSide.set(-dirv.z, 0, dirv.x).multiplyScalar(1.7); }
    }
    for (const lane of [-1, 1]) { const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push(new V3().lerpVectors(cabA, cabB, t).addScaledVector(cabSide, lane).setY(cabA.y - cabSag * 4 * t * (1 - t))); } ribbon(pts, 2, 0.5, 0.05, 0.05); }
  }
  {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); geo.setAttribute('aDir', new THREE.Float32BufferAttribute(rd, 3));
    geo.setAttribute('aRib', new THREE.Float32BufferAttribute(rr, 4)); geo.setIndex(ri);
    const mesh = new THREE.Mesh(geo, mkMat(RIBBON_VS, RIBBON_FS, {}, { side: THREE.DoubleSide }));
    mesh.frustumCulled = false; group.add(mesh);
    const bg = makeBucketGeo(), NB = 14, bk = new Float32Array(NB * 2);
    for (let i = 0; i < NB; i++) { bk[i * 2] = (i + rngBk.range(-0.12, 0.12)) / NB; bk[i * 2 + 1] = rngBk(); }
    bg.setAttribute('aBk', new THREE.InstancedBufferAttribute(bk, 2));
    const bm = new THREE.InstancedMesh(bg, mkMat(BUCKET_VS, BUCKET_FS, { uCabA: { value: cabA }, uCabB: { value: cabB }, uCabSide: { value: cabSide }, uCabSag: { value: cabSag } }, { side: THREE.DoubleSide }), NB);
    bm.frustumCulled = false; group.add(bm);
  }
  await ctx.yield();

  // ---- mist, moths and leaves in the column; smoke where the thread falls land
  {
    const pos = [], pt = [];
    const nMist = Math.round(420 * detail), nMoth = Math.round(240 * detail);
    for (let i = 0; i < nMist; i++) { pos.push(SHAFT_R * 1.05 * Math.sqrt(rngMi()), rngMi.range(0, 187), rngMi.range(0, TAU)); pt.push(0, rngMi(), rngMi.range(10, 20), rngMi.range(0.6, 1.6)); }
    for (let i = 0; i < nMoth; i++) { pos.push(rngMo.range(1, SHAFT_R - 1.5), rngMo.range(0, 187), rngMo.range(0, TAU)); pt.push(1, rngMo(), rngMo.range(0.45, 0.75), rngMo.range(-0.25, 0.5)); }
    for (let i = 0; i < 36; i++) { pos.push(rngLe.range(1, SHAFT_R - 2), rngLe.range(0, 187), rngLe.range(0, TAU)); pt.push(2, rngLe(), rngLe.range(0.4, 0.6), rngLe.range(2.2, 4)); }
    // the first threads' smoke draws from the hero's stream in their order; the smoke of the threads added round the helix
    // draws from a fork of the falls' own stream (taken after their last draw), so the flock that draws next from the
    // hero's stream is dealt the same however many threads the beams gave
    const rngS = rngF.fork ? rngF.fork('geode-smoke') : rngF;
    for (let i = 0; i < lampPts.length; i += 4) { pos.push(lampPts[i], lampPts[i + 1], lampPts[i + 2]); pt.push(4, rngL(), lampPts[i + 3], 0); }
    smokeAt.forEach((s, k) => { const r = k < nFirstFalls ? rngW : rngS; for (let i = 0; i < 22; i++) { pos.push(s.x, s.y + 0.3, s.z); pt.push(3, r(), r.range(4, 8.5), r.range(0.7, 1.3)); } });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aPt', new THREE.Float32BufferAttribute(pt, 4));
    const mesh = new THREE.Points(geo, mkMat(POINTS_VS, POINTS_FS, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    mesh.renderOrder = 4; mesh.frustumCulled = false; group.add(mesh);
  }
  // ---- swiftlets
  {
    const NBD = 120, pos = [], bird = [], wing = [], K = 1.3;
    const shape = [[0, 0, 0.5, 0], [-0.1, 0, -0.3, 0], [0.1, 0, -0.3, 0], [-0.08, 0, 0.14, 0], [-0.85, 0, -0.16, 1], [-0.08, 0, -0.14, 0], [0.08, 0, 0.14, 0], [0.08, 0, -0.14, 0], [0.85, 0, -0.16, 1]];
    for (let i = 0; i < NBD; i++) {
      const r = rngFl.range(3, 13.5), y0 = rngFl.range(22, 166), a0 = rngFl.range(0, TAU), sd = rngFl();
      for (const v of shape) { pos.push(v[0] * K, v[1] * K, v[2] * K); bird.push(r, y0, a0, sd); wing.push(v[3]); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aBird', new THREE.Float32BufferAttribute(bird, 4));
    geo.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1));
    const mesh = new THREE.Mesh(geo, mkMat(BIRD_VS, BIRD_FS, {}, { side: THREE.DoubleSide }));
    mesh.renderOrder = 5; mesh.frustumCulled = false; group.add(mesh);
  }

  // ---- anchors
  const v3 = (p, dy = 0) => new V3(p.x, p.y + dy, p.z);
  const flyThrough = [];
  for (let i = 0; i < L.outer.length; i += 4) flyThrough.push(v3(L.outer[i], 1.7));
  for (let i = 1; i < L.dive.length; i += 2) flyThrough.push(v3(L.dive[i]));
  if (!flyThrough[flyThrough.length - 1].equals(W3)) flyThrough.push(W3.clone());
  const e0 = L.outer[0], re = L.railEnd, mid = new V3(); L.shaftAt(85, mid); mid.y = 85;
  const anchors = {
    entry: { position: v3(e0), direction: new V3(e0.hx, 0, e0.hz) },
    track: { outer: L.outer.map((p) => v3(p)), second: L.second.map((p) => v3(p)) },
    trackAt(d, out = { position: new V3(), tangent: new V3() }) {
      const f = clamp(d / 1.5, 0, L.outer.length - 1.001), i = Math.floor(f), a = L.outer[i], b = L.outer[i + 1], t = f - i;
      out.position.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t)); out.tangent.set(b.x - a.x, b.y - a.y, b.z - a.z).normalize(); return out;
    },
    revealDist: Math.min(27, L.helixStartIdx) * 1.5,                           // metres of our rail, from the entry, that the hero keeps open as the reveal's sight line (L.revealSeg)
    helix: { center: new V3(L.hc.x, 0, L.hc.z), radius: HR, secondRadius: HR2, yTop: Y_TOP, yBottom: Y_BOT, theta0: TH0, turns: TURNS, startDist: L.helixStartIdx * 1.5, endDist: L.helixEndIdx * 1.5 },
    railEnd: { position: v3(re), direction: new V3(re.hx, -0.07, re.hz).normalize() },
    flyThrough,
    portalSeat: { position: W3.clone(), normal: Np.clone(), radius: PORTAL_R, tilt: 66 },
    shaft: { bottom: L.shaftA.clone(), top: L.shaftB.clone(), radius: SHAFT_R },
    sinkhole: { position: new V3(L.sink.x, L.sink.y, L.sink.z), radius: SHAFT_R },
    secondSinkhole: { position: blade.from.clone(), target: blade.to.clone() },
    pool: { center: new V3(L.pool.x, 0, L.pool.z), radius: L.pool.r, y: 0 },
    lightSpot: new V3(sp.x, 0, sp.z),
    beamPass, fallPass,
    bucketPass: { position: new V3(bp.x, bp.y + 9.4, bp.z), dist: bIdx * 1.5 },
    cable: { a: cabA.clone(), b: cabB.clone(), side: cabSide.clone(), sag: cabSag },
    viewpoints: {
      reveal: v3(L.outer[4], 1.9), revealLook: mid.clone(),
      low: new V3(L.pool.x - 30, 7, L.pool.z - 18), lowLook: new V3(L.hc.x, 95, L.hc.z),
      across: new V3(L.hc.x + 58, 120, L.hc.z - 30),
    },
  };

  // ---- runtime
  const size = new THREE.Vector2(), camL = new V3(), qInv = new THREE.Quaternion(), lampP = new V3(), lampD = new V3();
  let cloudOverride = null, demoLamp = opts.lamp === 'demo' || (typeof pv === 'string' && pv.includes('lamp'));
  const hero = {
    object: group, radius: 95, height: 195, center: new V3(0, 80, 0), anchors, uniforms: U, ground: false, groundY: -15,
    // for the world: the same materials, shapes and layout tests, so the mine before the geode is cut from one cloth
    lib: { mkMat, setBasis, segSegDist, makeCrystalGeo, makeBeamGeo, makeBoxGeo, makeBucketGeo, beams, layout: L,
      glsl: { VS_PARS, FS_PARS, FS_END, FS_ADD_FOG, RIBBON_VS, RIBBON_FS, SELENITE_VS, SELENITE_FS, CRYSTAL_VS, CRYSTAL_FS, TIMBER_VS, TIMBER_FS } },
    setCloud(v) { cloudOverride = v; },
    setLamp(worldPos, worldDir, intensity = 1, halfAngleDeg = 24) {
      group.updateWorldMatrix(true, false);
      lampP.copy(worldPos); group.worldToLocal(lampP);
      group.getWorldQuaternion(qInv).invert(); lampD.copy(worldDir).normalize().applyQuaternion(qInv);
      U.uLampPos.value.set(lampP.x, lampP.y, lampP.z, intensity);
      U.uLampDir.value.set(lampD.x, lampD.y, lampD.z, Math.cos(halfAngleDeg * Math.PI / 180));
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      const k = 0.5 - 0.5 * Math.sin(time * TAU / 12 + 0.6), ks = k * k * (3 - 2 * k);   // how far the cloud edge has slid over
      U.uCloud.value = cloudOverride !== null ? cloudOverride : 1 - 0.5 * ks;
      U.uCloudPos.value = lerp(15, -9, cloudOverride !== null ? clamp((1 - cloudOverride) * 2, 0, 1) : ks);
      if (camera) {
        camL.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(camL); U.uCamL.value.copy(camL);
        U.uOutside.value = cutaway && eggE(camL.x, camL.y, camL.z) > 1.03 ? 1 : 0;
        let h = 1080; if (ctx.renderer && ctx.renderer.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(size).y || 1080;
        U.uPx.value = camera.projectionMatrix.elements[5] * h * 0.5;
      }
      if (demoLamp) {                          // viewer aid: the lamp rides our rails so the beams can be seen answering it
        const tr = anchors.trackAt((time * 6) % ((L.outer.length - 2) * 1.5));
        lampP.copy(tr.position); lampP.y += 1.3; group.localToWorld(lampP); lampD.copy(tr.tangent).transformDirection(group.matrixWorld);
        hero.setLamp(lampP, lampD, 1, 26);
      }
    },
    dispose() {},
  };
  // viewer-only framings: 'in' puts the orbit's u = 0.1 at the throat mouth (the reveal), 'low' looks down on the pool
  if (typeof pv === 'string' && pv.startsWith('in')) { hero.radius = 23; hero.height = 154; hero.center = new V3(e0.x - 10, 85, e0.z - 59); }
  if (typeof pv === 'string' && pv.startsWith('low')) { hero.radius = 10; hero.height = 60; hero.center = new V3(L.pool.x, 12, L.pool.z); }
  hero.update(0, 0, null);
  return hero;
}
