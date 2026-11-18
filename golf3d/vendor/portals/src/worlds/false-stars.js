// FALSE STARS: a New Zealand glow-worm cave from the bow of an unlit black kayak. The Grotto (a sphere of blue stars doubled
// in still water, the Chandelier on the axis), the Tube, the Flume (the gun barrel), then fired out of a cliff beside our own
// waterfall into a moonlit gorge under the real Milky Way, diving to a ring that hangs in the fall's mist over a pool ringed
// with tree-fern crowns.
//
// World space == the hero's local space (the cave is the hero, src/parts/false-stars.js): origin = the water under the
// Chandelier, entry at (0, 0.8, 46) heading -Z. Everything outside is authored in "gorge coordinates" hung on the hero's
// mouth anchor: x = metres right of the flume axis, y = metres above the lip's water level, k = metres out from the cliff.
// Timing: the Grotto is the first 112 m of river (u 0..0.21 at 50 s), the Tube to 225 m (u 0.42), the Flume to the lip at
// 345 m (u 0.647); the arc and dive are the rest. Parts are switched by river distance (hero.anchors.riverAt): grotto rock
// until 26 m into the Tube, tube rock until 14 m into the Flume. The Hall's flowstone (hall-stone) and the Organ's own lights
// are drawn only while the Hall is in view. The outside is drawn from 6 m before the Hall's far door (the forest under the
// horizon only once the Flume is entered), and what shows through the mouth dawns from black over eighteen metres of
// river behind a multiplying pane at the lip (mouth-dawn), so the mouth is never a sudden light. The ruru crosses the
// glide at u 0.84..0.91 against a small bank of moonlit mist (mist-moonlit), never in front of the ring.
// The smear: from where the current takes hold (boat speed over 5.5 m/s: the neck into the Hall, then from the Hall's far
// door down the Flume) every cave light is a bright head with a tail whose length is the hero's shutter times its own
// screen speed, the shutter a rule of the boat's speed along the river alone, and chevrons stand on the water under them.
// Past the lip the hero's own shutter is left as it was. The ranks' stone, the weta and the Hall's mirrored lights are
// drawn by the eye's river distance.
// Underground there is no light but the worms and no hue warmer than green: the colony lives on the Organ's ranks (the hero),
// pale mayflies climb a slow helix round the great Organ (organ-flies, u 0.28..0.44), and the Hall's throat runs under the
// false Milky Way (u 0.47..0.55). Out of the mouth six bats fly with the bow (bats-near, u 0.61..0.87: each a twentieth of the
// frame wide, its back half turned to the eye so both wings show, never across the ring) ahead of the flock in the notch.
// Seeded: hour (moon, moonless, dusk, and dawn: a pearl sky with the last stars over a sea of mist that fills the gorge to just
// under the ring, its heads pale toward the moon and blue-grey in the shade, the ring in a dark hollow over the fern crowns;
// the glide is flown over the sea and the dive ends at the ring, before the mist), weather (clear, after rain, cloud sea),
// season (summer, winter, autumn eels in the Flume), vary.rare = the mayfly hatch.
// Nothing uses three.js lights: every material is a self-lit ShaderMaterial (moon key from the LEFT, blue sky fill, height mist).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/false-stars.js';

const PALETTE = ['#03070B', '#0D1F2C', '#4FE0D6', '#0B1638', '#9DB2C6', '#27473F', '#E4EEF8'];
const V3 = THREE.Vector3, TAU = Math.PI * 2, RAD = Math.PI / 180;
const FLOOR = -112;                        // pool level in gorge coordinates
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
// The cliff's bedding: limestone beds of uneven thickness (a table made per seed in build) whose planes undulate gently.
// Near the flight the beds are BUILT as ledges in a fine mesh over both gorge walls (see hT and cliffPatch); far off the same
// bed coordinate is only painted as soft bands. strataWarp is the undulation of the bedding planes, in world coordinates.
const strataWarp = (x, z) => 3.2 * Math.sin(x * 0.023 + 1.3) + 2.4 * Math.sin(z * 0.019 + 0.4) + 1.3 * Math.sin((x + z) * 0.047 + 2.0);

// ---------------------------------------------------------------- shared GLSL
const GL_NOISE = /* glsl */`
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=h31(i), b=h31(i+vec3(1,0,0)), c=h31(i+vec3(0,1,0)), d=h31(i+vec3(1,1,0));
  float e=h31(i+vec3(0,0,1)), g=h31(i+vec3(1,0,1)), h=h31(i+vec3(0,1,1)), k=h31(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z); }
`;
// Moon key, sky fill and the gorge's height mist (analytic exponential layer + a thin uniform haze), brighter toward the moon.
const GL_OUT = /* glsl */`
uniform vec3 uMoonDir, uMoonCol, uAmbCol, uMistCol;
uniform vec4 uMist;        // density at y0, y0 (world), falloff per metre, uniform haze density
uniform float uTime, uOutGain;
${GL_NOISE}
vec3 mistApply(vec3 col, vec3 wp){
  vec3 dv=wp-cameraPosition; float d=length(dv);
  float t=clamp(uMist.z*dv.y,-9.0,9.0);
  float f=abs(t)>1e-3 ? (1.0-exp(-t))/t : 1.0;
  float od=uMist.x*exp(-clamp(uMist.z*(cameraPosition.y-uMist.y),-5.0,12.0))*d*f+uMist.w*d;
  float k=1.0-exp(-max(od,0.0));
  vec3 V=dv/max(d,1e-3);
  float g=max(dot(V,uMoonDir),0.0);
  return mix(col,uMistCol*(0.72+1.25*g*g*g),clamp(k,0.0,1.0));
}
`;

// ---- gorge terrain: moon-raked limestone, bush on the flats and the ledges, the mouth cut out of the cliff. One shader for
// the coarse sheet and for the fine cliff patches. aC = bed coordinate (index + fraction up the bed), crevice light (dark at
// the foot of a face and at the back of a ledge), tread (1 on top of a bed), and how far real ledges are built here (0 on
// the coarse sheet, where the beds are only painted as soft bands). aCut > 0.5: the coarse sheet under a patch, not drawn.
const TERRAIN_VERT = /* glsl */`
attribute float aShade, aCut, aD; attribute vec4 aC;
varying vec3 vP, vN; varying float vS, vCut, vD; varying vec4 vC;
void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; vN=normal; vS=aShade; vC=aC; vCut=aCut; vD=aD; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const TERRAIN_FRAG = /* glsl */`
uniform vec3 uLip, uF, uR, uWormC;
uniform float uFalls;
varying vec3 vP, vN; varying float vS, vCut, vD; varying vec4 vC;
${GL_OUT}
void main(){
  if(vCut>0.5) discard;
  vec3 q=vP-uLip; float kk=dot(q,uF), xx=dot(q,uR);
  if(kk<9.0 && kk>-40.0 && abs(xx)<8.5 && q.y>-6.0 && q.y<12.0) discard;          // the cave mouth
  vec3 N=vN/max(length(vN),1e-4);
  float dC=length(cameraPosition-vP), fa=smoothstep(90.0,330.0,dC), fb=smoothstep(14.0,70.0,dC);
  float built=clamp(vC.w,0.0,1.0);
  float n1=vn3(vP*0.07), n2=vn3(vP*0.31+3.1);
  float fine=mix(vn3(vP*3.7),0.5,fb);
  float rockK=smoothstep(0.22,0.5,1.0-N.y);
  float ib=floor(vC.x), fbed=vC.x-ib;
  float hsh=h31(vec3(ib,3.0,7.0));
  // painted beds, only where no ledge is built (the far gorge): a paler band along the top of each bed whose edge wanders,
  // and a soft shade under it. No outline, no fault, no curtain.
  float lipN=(vn3(vec3(vP.x*0.21,ib*1.7,vP.z*0.21))-0.5)*0.18+(n2-0.5)*0.09;
  float dcap=0.84+0.07*hsh-fbed+lipN;
  float capP=(1.0-smoothstep(-0.06,0.06,dcap))*(1.0-built);
  float underP=smoothstep(0.0,0.07,dcap)*exp(-max(dcap,0.0)/0.24)*(1.0-built)*0.45;
  float tread=max(vC.z*built,capP);
  float crev=mix(1.0,clamp(vC.y,0.0,1.0),built);
  // on a built ledge vD runs 0 (foot of the face) .. 1 (its lip) .. 2 (the back of its tread). The nose of every bed leans out,
  // so the lower half of its face is an overhang's hollow: darker, and here and there lit from inside by glow-worms
  float qf=vD, faceK=built*(1.0-smoothstep(0.98,1.04,qf));
  float under=faceK*(1.0-smoothstep(0.05,0.55,qf));
  crev*=mix(1.0,0.42,under);
  float lipA=smoothstep(0.6,0.9,vC.y);                 // (a lip is open to the sky; the seam at the back of a tread, where vD also passes 1, is not)
  float lipHi=built*smoothstep(0.8,0.97,qf)*(1.0-smoothstep(1.0,1.2,qf))*lipA;
  // the rock: every bed its own tone, mottled and pitted; the rain's flutes (karren) and thin partings on the faces
  float karst=vn3(vec3(vP.x*0.55+n1*1.5,vP.y*0.05+ib*3.0,vP.z*0.55));
  float karstF=mix(0.5,vn3(vec3(vP.x*2.1,vP.y*0.12+ib,vP.z*2.1)),1.0-fb);
  float mott=vn3(vP*0.83+5.0), mott2=vn3(vP*0.27+11.0);
  float thin=abs(fract(vC.x*4.0+0.4*n2+0.25*mott)-0.5)*2.0;
  float parting=(1.0-smoothstep(0.0,0.22,thin))*(1.0-fa)*0.3*(1.0-tread);
  float streakN=vn3(vec3(vP.x*0.42,vP.y*0.035,vP.z*0.42)+n1*1.5);
  float streak=smoothstep(0.58,0.8,streakN);
  vec3 rock=mix(vec3(0.036,0.043,0.056),vec3(0.082,0.094,0.112),0.2+0.36*hsh+0.2*n1+0.24*mott2)*(0.84+0.32*fine);
  // (a built wall is never one grey: each bed has its own tone, ochre where lichen has it, dark where water runs, pale at the lips)
  rock*=mix(vec3(1.0),mix(vec3(0.62,0.66,0.74),vec3(1.34,1.2,0.92),smoothstep(0.25,0.75,hsh*0.6+mott2*0.4)),built*0.8);
  rock*=1.0+0.4*lipHi;
  rock*=(1.0-0.42*streak*(1.0-tread))*(1.0-parting);
  rock*=mix(1.0,(0.8+0.4*karst)*(0.86+0.28*mott)*(0.86+0.28*karstF),(1.0-0.75*fa)*(1.0-tread));
  rock*=mix(1.0,1.12,tread);
  // growth: bush on the flats; on a built ledge moss only where it has taken, in patches (the ferns stand on it as tufts)
  float take=smoothstep(0.36,0.6,vn3(vec3(vP.x*0.05+7.0,ib*2.3,vP.z*0.05))*0.7+0.3*n2);
  float lvl=1.0-rockK;
  float veg=clamp(lvl*mix(1.0,take,vC.z*built)+rockK*capP*take,0.0,1.0);
  // hanging ferns and moss: festoons that hang from a lip down the face below it, ragged, in runs along the ledge
  float alongN=vn3(vec3(vP.x*0.31+3.0,ib*1.9,vP.z*0.31)), frondN=vn3(vec3(vP.x*2.4,vP.y*0.5,vP.z*2.4)), frond2=mix(vn3(vec3(vP.x*6.5,vP.y*0.9,vP.z*6.5)),0.5,fb);
  float hl=(0.08+0.5*smoothstep(0.3,0.75,alongN))*(0.55+0.9*frondN);
  float hang=faceK*smoothstep(1.0-hl,1.0-hl*0.55,qf+0.07*(frond2-0.5))*smoothstep(0.3,0.55,alongN+0.3*take)*smoothstep(0.45,0.8,vC.y);
  veg=max(veg,hang*0.94);
  vec3 bush=mix(vec3(0.014,0.045,0.032),vec3(0.03,0.085,0.048),n2)*(0.7+0.6*fine)*(0.75+0.5*mott);
  vec3 alb=mix(rock,bush,veg);
  float shadow=underP*rockK;
  // built faces carry their own normals; the painted ones are stood a little upright so they take the moon as faces
  vec2 hz=N.xz/max(length(N.xz),1e-3);
  vec3 Nc=mix(N,mix(vec3(hz.x,0.12,hz.y),vec3(0.0,1.0,0.0),capP),rockK*(1.0-0.6*fa)*(1.0-built)*0.7);
  vec3 Nb=Nc+vec3((streakN-0.5)*0.2,0.0,(n2-0.5)*0.2)*rockK+vec3(fine-0.5)*0.2;
  Nb+=vec3(hz.y,0.0,-hz.x)*((karst-0.5)*0.8+(karstF-0.5)*0.55+(mott-0.5)*0.3)*rockK*(1.0-tread)*(1.0-0.8*fa);   // flutes and hollows turn the face from side to side
  Nb=Nb/max(length(Nb),1e-3);
  vec3 V=cameraPosition-vP; V=V/max(length(V),1e-3);
  float nl=max(dot(Nb,uMoonDir),0.0);
  float lee=1.0-smoothstep(-0.25,0.35,dot(N,uMoonDir));                           // the wall the moon never reaches
  vec3 Hh=uMoonDir+V; Hh=Hh/max(length(Hh),1e-3);
  float sp=max(dot(Nb,Hh),0.0); sp*=sp; sp*=sp; sp*=sp; sp*=sp; sp*=sp;
  float wet=rockK*(1.0-veg)*(0.25+0.75*streak)*(1.0+1.2*uFalls);
  vec3 col=alb*(uMoonCol*nl*vS*(0.25+0.75*crev)*(1.0-0.9*shadow)+uAmbCol*(0.4+0.6*(Nb.y*0.5+0.5))*(1.0+(0.9+2.3*min(uMoonCol.g,1.0))*lee)*crev*(1.0-0.85*shadow))+uMoonCol*sp*wet*vS*0.7*(1.0-shadow)*crev;
  col*=1.0-uFalls*rockK*(1.0-veg)*(0.24+0.26*smoothstep(0.35,0.75,streakN));                 // after rain the faces are dark with running water
  col+=uWormC*(under*(1.0-veg)*smoothstep(0.5,0.78,vn3(vec3(vP.x*0.1+9.0,ib*3.1,vP.z*0.1)))*(0.6+0.8*fine));     // the glow of a colony under an overhang
  gl_FragColor=vec4(mistApply(col*uOutGain,vP),1.0);
}`;

// ---- pool and river: black water, sky on it at grazing angles, broken moonlight, rings and foam from the plume's foot
const WATER_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const WATER_FRAG = /* glsl */`
uniform vec3 uFoot, uSkyLow, uSkyHigh, uF;
uniform float uGlit;
varying vec3 vP;
${GL_OUT}
void main(){
  vec3 V=cameraPosition-vP; float dist=max(length(V),1e-3); V/=dist;
  vec2 p=vP.xz; vec2 q=p-uFoot.xz; float r=length(q); vec2 rd=q/max(r,0.05);
  float boil=exp(-r*0.09);
  float ring=sin(r*0.95-uTime*3.4+2.0*vn3(vec3(p*0.11,uTime*0.2)))*exp(-r*0.035);
  float w1=sin(dot(p,vec2(0.71,0.43))*1.3+uTime*1.1), w2=sin(dot(p,vec2(-0.38,0.92))*2.1-uTime*1.5), w3=vn3(vec3(p*0.9,uTime*0.7))-0.5;
  vec2 sl=rd*ring*0.22+vec2(w1*0.03+w3*0.09,w2*0.03-w3*0.07)*(1.0+2.5*boil);
  vec3 N=vec3(-sl.x,1.0,-sl.y); N=N/max(length(N),1e-3);
  vec3 R=reflect(-V,N); R.y=abs(R.y);
  float c1=1.0-clamp(dot(N,V),0.0,1.0); float fr=0.04+0.96*c1*c1*c1*c1;
  float up=1.0-clamp(R.y,0.0,1.0);
  vec3 sky=mix(uSkyHigh,uSkyLow,up*up*up);
  vec3 col=vec3(0.0015,0.003,0.005)+sky*fr;
  // broken moonlight: glints wherever a facet tips the moon into the eye, wide and sparse, densest toward the moon side
  float lobe=max(dot(R,uMoonDir),0.0); float l2=lobe*lobe;
  float sparkA=vn3(vec3(p*0.6,uTime*1.1)), sparkB=mix(vn3(vec3(p*1.7+9.0,uTime*1.9)),0.5,smoothstep(50.0,130.0,dist));
  float glit=smoothstep(0.74,0.9,sparkA*0.6+sparkB*0.4+l2*0.22+boil*0.08)*(0.25+0.75*l2*l2);
  glit+=l2*l2*l2*l2*0.6;
  col+=uMoonCol*glit*uGlit;
  float turb=vn3(vec3(p*0.42,uTime*0.5))*0.6+vn3(vec3(p*1.1+4.0,uTime*0.9))*0.4;
  float foam=smoothstep(0.25,1.0,boil*1.7*(0.55+0.9*turb))+max(ring,0.0)*boil*0.5;
  foam+=smoothstep(0.62,0.9,vn3(vec3(p*vec2(0.5,0.5)+uF.xz*uTime*1.1,3.0))*0.6+vn3(vec3(p*1.3+uF.xz*uTime*1.6,7.0))*0.4)*0.07*smoothstep(24.0,40.0,r);
  col+=(uMoonCol*0.33+uAmbCol*1.4)*clamp(foam,0.0,1.5);
  // seen from high above the river is a silver thread: a broad broken sheen of the moonlit sky, in drifting riffles
  float high=smoothstep(26.0,70.0,dist)*smoothstep(20.0,44.0,r);
  float rif=smoothstep(0.42,0.8,vn3(vec3(p*vec2(0.21,0.21)+uF.xz*uTime*0.8,1.0))*0.55+vn3(vec3(p*0.62+uF.xz*uTime*1.3,5.0))*0.45);
  col+=(uMoonCol*vec3(0.085,0.1,0.125)+uSkyLow*0.5)*high*(0.24+1.15*rif)*uGlit;
  gl_FragColor=vec4(mistApply(col*uOutGain,vP),1.0);
}`;

// ---- canopy crowns and rimu: lumpy instanced volumes, moonlit from the left, heaving near the fall
const CANOPY_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iScl, iCol;     // iScl: sx, sy, sz, yaw   iCol: rgb, moon shade
uniform float uLump; uniform vec3 uFoot;
varying vec3 vP, vN, vC; varying float vS, vH;
${GL_OUT}
void main(){
  vec3 p=position; vec3 n=normal;
  float seed=fract(iPos.x*0.137+iPos.z*0.291)*40.0;
  float l=vn3(position*1.7+seed)+0.55*vn3(position*3.9+seed*1.7);
  p*=1.0+uLump*(l-0.78)*0.72;
  if(uLump>0.5 && p.y<0.0) p.y*=0.4;
  vH=position.y;
  p*=iScl.xyz; n/=max(iScl.xyz,vec3(0.05));
  float c=cos(iScl.w), s=sin(iScl.w);
  p.xz=vec2(c*p.x+s*p.z,-s*p.x+c*p.z); n.xz=vec2(c*n.x+s*n.z,-s*n.x+c*n.z);
  vec3 wp=iPos+p;
  float gust=exp(-length(iPos.xz-uFoot.xz)*0.012)*1.2+0.25;
  float hk=clamp(p.y/max(iScl.y,0.5)+0.4,0.0,1.6);
  wp.xz+=vec2(sin(uTime*0.9+iPos.x*0.07+p.y*0.3),cos(uTime*0.7+iPos.z*0.06+p.x*0.25))*0.22*gust*hk;
  wp.y+=sin(uTime*1.3+iPos.x*0.05+iPos.z*0.04+p.x*0.5)*0.14*gust*hk;
  vP=wp; vN=n; vC=iCol.rgb; vS=iCol.a;
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0);
}`;
const CANOPY_FRAG = /* glsl */`
uniform float uLump, uFrost;
varying vec3 vP, vN, vC; varying float vS, vH;
${GL_OUT}
void main(){
  vec3 N=vN/max(length(vN),1e-4);
  float n1=vn3(vP*0.9), n2=vn3(vP*2.7+5.0);
  vec3 V=cameraPosition-vP; float dC=length(V); V=V/max(dC,1e-3);
  float facing=abs(dot(N,V)), lodC=1.0-smoothstep(260.0,520.0,dC);
  // a crown is boughs and sprays of leaves with dark air between them: its rim is eaten into a broken, leafy outline, holes
  // open in it (the far side of the crown shows through them, in its own shade), and its surface is clumps of lit leaves
  // with blue-black gaps. Far down the gorge, where a spray is under a pixel, it closes up again.
  float cut=vn3(vP*0.5+11.0)*0.5+vn3(vP*1.3+3.0)*0.32+n2*0.18;
  float rimE=(1.0-facing)*(1.0-facing);
  if(uLump>0.5 && cut<(0.3+0.44*rimE)*lodC) discard;
  float inside=gl_FrontFacing?0.0:1.0; if(inside>0.5) N=-N;
  vec3 Nb=N+(vec3(n1,n2,vn3(vP*1.7+9.0))-0.5)*1.2+(vec3(vn3(vP*4.1+2.0),vn3(vP*4.1+7.0),vn3(vP*4.1+13.0))-0.5)*0.7*lodC; Nb=Nb/max(length(Nb),1e-3);
  float leaf=vn3(vP*6.3+3.0);
  float clump=smoothstep(0.3,0.68,vn3(vP*1.05+17.0)*0.55+n2*0.3+leaf*0.15);
  float gap=mix(1.0,0.12+0.88*clump,0.85*lodC);                                           // dark between the clumps
  float ao=mix(smoothstep(-0.5,0.9,vH),1.0,1.0-uLump)*(0.3+0.7*smoothstep(0.25,0.7,n1*0.6+n2*0.4))*(0.7+0.5*leaf)*gap*mix(1.0,0.22,inside);
  float nl=max(dot(Nb,uMoonDir)*0.86+0.14,0.0);
  float rim=1.0-clamp(dot(N,V),0.0,1.0); rim*=rim;
  vec3 alb=vC*(0.5+1.0*n2)*(0.7+0.7*smoothstep(0.45,0.85,leaf));
  alb=mix(alb,vec3(0.34,0.38,0.42),uFrost*smoothstep(0.1,0.8,Nb.y)*0.7);
  vec3 col=alb*ao*(uMoonCol*nl*vS*2.9+uAmbCol*(0.6+0.75*(Nb.y*0.5+0.5)))+uMoonCol*vS*rim*nl*0.08*ao;
  gl_FragColor=vec4(mistApply(col*uOutGain,vP),1.0);
}`;

// ---- tree ferns and nikau: a crown of arching fronds built in the vertex shader (aF: azimuth, v along the frond, side,
// frond phase; trunk vertices carry aF.w < 0). From above each crown is a green star; ponga flash silver undersides.
const FERN_VERT = /* glsl */`
attribute vec4 aF; attribute vec3 iPos; attribute vec4 iPar, iCol;   // iPar: crown radius, trunk height, lift 0..1, phase  iCol: rgb, shade
attribute vec3 iLean;                                               // lean x, lean z, silver 0..1
uniform vec3 uFoot;
varying vec3 vP, vN, vC; varying vec2 vUV; varying vec3 vK;          // vK: shade, silver flash, trunk flag
${GL_OUT}
void main(){
  float R=iPar.x, lift=iPar.z, ph=iPar.w*6.2832;
  float gust=exp(-length(iPos.xz-uFoot.xz)*0.013)*1.15+0.22;
  vec3 wp; vec3 n; float flash=0.0;
  if(aF.w<0.0){                                                       // trunk: a tapering, slightly bulged column
    float yy=aF.y;                                                    // 0 at the crown, 1 at the ground
    float rr=R*(0.05+0.035*yy+0.03*lift*(1.0-smoothstep(0.0,0.14,yy)));
    wp=iPos+vec3(cos(aF.x)*rr,-yy*iPar.y,sin(aF.x)*rr)-vec3(iLean.x,0.0,iLean.y)*yy*iPar.y;
    n=vec3(cos(aF.x),0.15,sin(aF.x));
    vUV=vec2(0.0,yy);
  } else {
    float v=aF.y, az=aF.x+ph;
    float heave=sin(uTime*(0.8+0.5*aF.w)+ph+aF.x*2.0+iPos.x*0.05)*0.5+0.5*sin(uTime*2.3+aF.w*17.0+ph);
    float e0=mix(0.42,1.12,lift)+0.20*gust*heave*(0.4+0.6*aF.w);
    float cc=mix(1.55,0.95,lift)+0.25*(aF.w-0.5);
    float e=e0-cc*v;
    float rad=(sin(e0)-sin(e))/cc, hh=(cos(e)-cos(e0))/cc;
    vec2 d2=vec2(cos(az),sin(az));
    float wdt=(0.03+0.17*sin(3.1416*pow(clamp(v,0.0,1.0),0.75)))*mix(1.0,0.75,lift);
    float tw=0.35*gust*heave*v;                                       // the downdraught rolls the blade
    vec3 across=vec3(-d2.y,0.0,d2.x)*cos(tw)+vec3(d2.x*-sin(e),cos(e),d2.y*-sin(e))*sin(tw);
    vec3 lp=vec3(d2.x*rad,hh,d2.y*rad)+across*(aF.z*wdt)-vec3(0.0,abs(aF.z)*wdt*0.22,0.0);
    wp=iPos+lp*R;
    vec3 up=vec3(-d2.x*sin(e),cos(e),-d2.y*sin(e));
    n=up+across*aF.z*0.45;
    flash=iLean.z*smoothstep(0.25,0.95,heave*gust)*v;
    vUV=vec2(aF.z,v);
  }
  vP=wp; vN=n; vC=iCol.rgb; vK=vec3(iCol.a,flash,aF.w<0.0?1.0:0.0);
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0);
}`;
const FERN_FRAG = /* glsl */`
varying vec3 vP, vN, vC; varying vec2 vUV; varying vec3 vK;
${GL_OUT}
void main(){
  vec3 N=vN/max(length(vN),1e-4);
  vec3 V=cameraPosition-vP; V=V/max(length(V),1e-3);
  vec3 alb;
  float fw=fwidth(vUV.y*17.0);
  if(vK.z>0.5){ alb=vec3(0.03,0.032,0.03)*(0.6+0.8*vn3(vP*vec3(6.0,1.5,6.0))); }
  else {
    float comb=abs(fract(vUV.y*17.0+abs(vUV.x)*0.55)-0.5)*2.0;         // pinnae: teeth along the blade, raked toward the tip
    float cut=mix(0.95-comb*0.9,0.3,clamp(fw*1.4,0.0,1.0));
    float edge=abs(vUV.x);
    if(edge>0.16 && edge>cut+0.1) discard;
    float rach=1.0-smoothstep(0.03,0.14,edge);
    alb=vC*(0.75+0.7*vUV.y)*(1.0-0.55*rach)*(0.8+0.4*vn3(vP*3.0));
    if(!gl_FrontFacing){ N=-N; alb=mix(alb,vec3(0.30,0.36,0.38),0.35+0.65*clamp(vK.y*3.0,0.0,1.0)); }
    alb=mix(alb,vec3(0.36,0.43,0.45),clamp(vK.y,0.0,1.0)*0.85);
  }
  float nl=max(dot(N,uMoonDir)*0.7+0.3,0.0);
  float tr=max(dot(-V,uMoonDir),0.0); tr*=tr;
  vec3 Hh=uMoonDir+V; Hh=Hh/max(length(Hh),1e-3);
  float sp=max(dot(N,Hh),0.0); sp*=sp; sp*=sp; sp*=sp;
  vec3 col=alb*(uMoonCol*(nl+tr*0.5)*vK.x*1.65+uAmbCol*(0.65+0.6*(N.y*0.5+0.5)))+uMoonCol*sp*0.04*vK.x*(1.0-vK.z);
  gl_FragColor=vec4(mistApply(col*uOutGain,vP),1.0);
}`;

// ---- the plume: ballistic sheets on the launch parabola; the pattern falls with the water (t - time), breaking into strands
const PLUME_VERT = /* glsl */`
attribute vec3 aQ;                 // across -1..1, seconds since leaving the lip, half width there (m)
varying vec3 vP, vQ, vN;
void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; vQ=aQ; vN=mat3(modelMatrix)*normal; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const PLUME_FRAG = /* glsl */`
uniform float uLayer, uTmax;
varying vec3 vP, vQ, vN;
${GL_OUT}
void main(){
  float a=vQ.x, t=vQ.y, w=vQ.z;
  float ft=t-uTime;                                   // the water's launch time: every pattern falls with the water
  float dC=length(vP-cameraPosition);
  float ax=a*w;                                       // metres across the sheet
  float lod=1.0-smoothstep(30.0,120.0,dC);
  // three scales: falling masses, ropes, and strands three to six to the metre
  float mass=vn3(vec3(ax*0.55+uLayer*5.0,ft*2.6,uLayer*7.0));
  float rope=vn3(vec3(ax*1.7+3.0,ft*5.2+mass,uLayer*3.0+1.0));
  float str=mix(0.5,vn3(vec3(ax*4.6,ft*4.0+mass*1.5,2.0))*0.6+vn3(vec3(ax*9.5,ft*9.0,5.0))*0.4,lod);
  float body=mass*0.42+rope*0.30+str*0.28;
  float fall=smoothstep(0.2,2.3,t);                   // 0 at the lip .. 1 once the sheet has torn (25 m out)
  // the outline is eaten by the same ropes and strands, more as it falls: there is no smooth edge anywhere
  float ed=abs(a)+(rope-0.5)*0.6*(0.35+fall)+(str-0.5)*0.34;
  float edge=1.0-smoothstep(0.58,0.98,ed);
  float thr=mix(0.19,0.56,fall)+uLayer*0.09;          // solid water at the lip, torn to strands and clumps with gaps below
  float dens=smoothstep(thr,thr+0.15,body)*edge;
  float alpha=dens*smoothstep(0.0,0.2,t)*(1.0-smoothstep(uTmax-0.5,uTmax-0.1,t));   // gone just above the pool: the water plane never slices it
  alpha*=mix(0.86,0.30,uLayer);
  vec3 gn=vN/max(length(vN),1e-6);                    // the sheet's smooth normal (a facet normal steps the alpha panel by panel)
  vec3 Vg=vP-cameraPosition; Vg=Vg/max(length(Vg),1e-3);
  alpha*=mix(0.5,1.0,smoothstep(0.02,0.25,abs(dot(gn,Vg))));                      // a sheet seen along itself is spray, not a shell
  vec3 V=vP-cameraPosition; V=V/max(length(V),1e-3);
  float back=max(dot(V,uMoonDir),0.0);
  vec3 col=(uMoonCol*(0.40+0.5*back*back)+uAmbCol*1.0)*(0.4+1.3*smoothstep(thr,thr+0.42,body))*(0.7+0.6*str);   // aerated water is white from every side
  col+=uMoonCol*0.07*exp(-t*1.3)*(1.0-a*a)*(0.55+0.45*back)*(0.5+str);       // the bright core as it leaves the lip
  float glass=(1.0-fall)*(1.0-0.5*uLayer);                                    // near the lip the water is whole: dark and glassy between ropes of white
  col*=mix(1.0,0.16+1.05*smoothstep(0.45,0.8,rope*0.55+str*0.45),glass*0.9)*mix(0.8,1.0,fall);
  col*=1.0+0.9*(1.0-smoothstep(0.0,0.55,dens))*(0.35+0.65*back);             // thin water at the torn edges glows
  col=mistApply(col*uOutGain,vP);
  alpha*=smoothstep(1.5,7.0,dC);
  gl_FragColor=vec4(col*alpha,alpha);
}`;

// ---- falling clumps: separate masses of water riding the same parabola, drawn out along their fall, head down, ragged tails
const CLUMP_VERT = /* glsl */`
attribute vec4 iPar;               // phase 0..1, across -1..1, offset off the sheet (m), size (m)
uniform vec3 uPO, uPV, uPR;         // the plume: origin, launch velocity, right
uniform vec2 uPT;                  // flight time (s), width scale
uniform float uTime;
varying vec2 vUV; varying vec3 vW; varying vec2 vK;
void main(){
  float t=fract(uTime/uPT.x+iPar.x)*uPT.x;
  float wdt=(2.3+0.78*t)*uPT.y;
  vec3 c=uPO+uPV*t+uPR*(-(0.9*t+0.42*t*t)+iPar.y*wdt*0.9);
  c.y=uPO.y+uPV.y*t-4.9*t*t+iPar.z*(0.4+0.25*t);
  vec3 vel=uPV+uPR*(-(0.9+0.84*t)); vel.y=uPV.y-9.8*t;
  vec3 vd=vel/max(length(vel),1e-3);
  vec3 toC=cameraPosition-c;
  // an ellipsoid of water drawn out along its fall: seen from the side a streak, seen along the fall a round blob
  vec3 vw=toC/max(length(toC),1e-3);
  vec3 ax=vd-vw*dot(vd,vw); float al=length(ax); ax=ax/max(al,1e-3);
  vec3 side=cross(ax,vw);
  float wid=iPar.w*(0.40+0.05*t), len=max(iPar.w*(1.5+0.55*t)*al,wid*1.15);
  vec3 wp=c+ax*(position.y*len)+side*(position.x*wid);
  vUV=position.xy; vW=c;
  vK=vec2(smoothstep(0.05,0.5,t)*(1.0-smoothstep(uPT.x-0.5,uPT.x-0.05,t))*smoothstep(2.0,8.0,length(toC)),iPar.x*37.0);
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0);
}`;
const CLUMP_FRAG = /* glsl */`
varying vec2 vUV; varying vec3 vW; varying vec2 vK;
${GL_OUT}
void main(){
  float x=vUV.x, y=vUV.y;
  float prof=mix(0.18,1.0,smoothstep(-1.0,0.55,y))*(1.0-smoothstep(0.5,1.0,y)*0.75);     // a head that leads, a tail drawn out behind
  float n=vn3(vec3(x*2.2+vK.y,y*1.7-uTime*2.0,vK.y))*0.6+vn3(vec3(x*5.5,y*4.0-uTime*4.0,vK.y+3.0))*0.4;
  float a=1.0-smoothstep(0.0,1.0,abs(x)/max(prof,0.05)+0.9*(n-0.5));
  a*=(1.0-smoothstep(0.75,1.0,abs(y)))*vK.x;
  vec3 V=vW-cameraPosition; V=V/max(length(V),1e-3);
  float back=max(dot(V,uMoonDir),0.0);
  vec3 col=(uMoonCol*(0.42+0.5*back*back)+uAmbCol*1.0)*(0.55+0.9*n)*(0.6+0.6*smoothstep(-0.4,0.8,y));
  col=mistApply(col*uOutGain,vW);
  a*=0.82;
  gl_FragColor=vec4(col*a,a);
}`;

// ---- the cloud floor (a cloud sea below the mouth, or the gorge brim-full of mist at dawn): two drifting sheets of
// billows with a hollow over the pool where the fall's downdraught has punched through. We dive into the hollow.
const DECK_VERT = /* glsl */`
varying vec3 vP; varying float vLayer, vEdge;
attribute float aLayer, aEdge;       // aEdge: metres of clear air between the sheet and the ground under it (0 where it would touch a wall)
void main(){ vP=(modelMatrix*vec4(position,1.0)).xyz; vLayer=aLayer; vEdge=aEdge; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0); }`;
const DECK_FRAG = /* glsl */`
uniform vec4 uDeck;                // peak opacity, hollow radius (m), opacity inside the hollow, brightness
uniform vec3 uHole, uHole2, uDrift; // the hollow runs from the cliff foot (uHole2) to the pool (uHole); world xz in .xz
uniform float uGap;                // how much of the sea is torn open in ragged gaps (0 = brim-full)
uniform vec3 uShade;               // the sky's blue in the shade of the heads (dawn: pale on one side, blue-grey on the other)
varying vec3 vP; varying float vLayer, vEdge;
${GL_OUT}
float bil(float v){ v=2.0*v-1.0; return 1.0-v*v; }                 // a dome with a crease round it
// cloud tops at four sizes: swells 120 m across, heads 40 m, cauliflower 14 m, and 5 m curds near the eye
float deckH(vec2 p, float l, float fine){
  float a=vn3(vec3(p*0.0085,uTime*0.010+l*5.0));
  float b=bil(vn3(vec3(p*0.026+a*1.5,3.0+uTime*0.018)));
  float c=bil(vn3(vec3(p*0.071+b*0.8,7.0+l+uTime*0.03)));
  float d=bil(vn3(vec3(p*0.21+c*0.6,11.0+uTime*0.05)));
  float e=bil(vn3(vec3(p*0.57+d*0.5,13.0+uTime*0.07)));
  return a*0.40+b*0.34+c*0.18+d*0.12*fine+e*0.05*fine*fine*fine;
}
void main(){
  vec3 V=vP-cameraPosition; float dC=length(V); V=V/max(dC,1e-3);
  vec2 p0=vP.xz+uDrift.xz*uTime*(1.5+vLayer)+vLayer*37.0;
  float fine=1.0-smoothstep(60.0,260.0,dC);
  // one step of parallax: the heads stand up to 16 m proud of the troughs, so they slide across them as we fly over
  float h0=deckH(p0,vLayer,0.0);
  vec2 p=p0-V.xz/max(abs(V.y),0.4)*(h0-0.5)*16.0;
  float n=deckH(p,vLayer,fine);
  vec2 ml=uMoonDir.xz/max(length(uMoonDir.xz),1e-3);
  float dn=deckH(p+ml*5.0,vLayer,fine)-n;                                         // the tops' slope toward the moon
  // the hollow the fall has punched: torn and ragged, but always open where we dive through it
  vec2 ha=vP.xz-uHole2.xz, hb=uHole.xz-uHole2.xz;
  float hs=clamp(dot(ha,hb)/max(dot(hb,hb),1.0),0.0,1.0);
  float rag=clamp((n-0.5)*2.2+(vn3(vec3(p0*0.045,5.0+uTime*0.03))-0.5)*1.1,-0.95,0.25);
  float rh=length(ha-hb*hs)+rag*uDeck.y;
  float hole=smoothstep(uDeck.y*0.6,uDeck.y*1.25,rh);
  // ragged gaps elsewhere: the forest shows through
  float gapN=vn3(vec3(p0*0.0056+vec2(3.7,9.1),uTime*0.006))+(n-0.5)*0.30;
  float gap=smoothstep(0.585,0.685,gapN)*uGap;
  // the lower sheet is the sea itself; the upper sheet is only the heads that stand above it
  float cover=mix(smoothstep(0.17,0.42,n),smoothstep(0.52,0.76,n)*0.9,vLayer)*(1.0-gap);
  // it thins to nothing before it can touch a wall: no edge is ever drawn against the rock
  float e=clamp(vEdge/24.0,0.0,1.0);
  float edge=smoothstep(0.10,0.60,e*(0.4+1.2*n));
  float a=cover*uDeck.x*mix(uDeck.z,1.0,hole)*edge*smoothstep(5.0,34.0,dC);
  float g=max(dot(V,uMoonDir),0.0);
  float above=smoothstep(-6.0,6.0,cameraPosition.y-vP.y);
  float lit=smoothstep(-0.55,0.55,-dn*13.0);                                      // moon side silver, lee side in blue-black shadow
  float tops=smoothstep(0.26,0.74,n);                                             // heads pale, the troughs between them dark
  float rimK=1.0-smoothstep(0.0,0.45,cover);                                      // thin cloud at a torn edge takes the light through it
  vec3 col=uMistCol*(0.11+tops*(0.35+3.3*lit*lit)+0.5*rimK*(0.4+0.6*lit)+0.6*g*g)+uMoonCol*0.06*lit*tops+uShade*(1.0-lit)*(0.35+0.65*tops);
  col*=uDeck.w*(0.9+0.2*vLayer);
  col=mix(uMistCol*0.5,col,above);
  col*=0.5+0.5*hole;                                                              // the hollow's walls fall away into the dark
  col=mistApply(col*uOutGain,vP);
  gl_FragColor=vec4(col*a,a);
}`;
// ---- cloud heads: billows standing out of the sea and banked along both walls, lit as rounded bodies (a dome's normal,
// cauliflowered by noise): silver on the moon side, blue-black beneath. Camera-facing, sorted far to near at build.
const HEAD_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;    // radius (m), seed, height : width, opacity
attribute vec4 iWall;                        // toward the nearest wall (world x, z), metres of air to it, how fast it leans away with height
uniform vec3 uDrift, uMoonDir; uniform float uTime;
varying vec2 vUV; varying vec3 vK, vW, vMoonV, vUpV; varying float vWallK;
void main(){
  vec3 c=iPos+uDrift*sin(uTime*0.05+iPar.y*6.2832)*9.0; c.y+=sin(uTime*0.09+iPar.y*17.0)*0.8;
  vec4 mv=viewMatrix*vec4(c,1.0);
  float fade=smoothstep(iPar.x*0.55,iPar.x*1.7,length(mv.xyz));
  vec2 ofs=position.xy*iPar.x*vec2(1.0,iPar.z);
  mv.xy+=ofs;
  vec3 wo=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0])*ofs.x+vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1])*ofs.y;   // this corner, from the centre, in the world
  vWallK=(iWall.z-dot(wo.xz,iWall.xy)+wo.y*iWall.w)/max(iPar.x,1.0);
  vUV=position.xy; vK=vec3(iPar.w*fade,iPar.y,uTime*0.02); vW=c;
  vMoonV=mat3(viewMatrix)*uMoonDir; vUpV=mat3(viewMatrix)*vec3(0.0,1.0,0.0);
  gl_Position=projectionMatrix*mv;
}`;
const HEAD_FRAG = /* glsl */`
uniform vec3 uMoonCol, uAmbCol, uMistCol, uShade; uniform vec4 uMist; uniform float uOutGain, uHeadK;
varying vec2 vUV; varying vec3 vK, vW, vMoonV, vUpV; varying float vWallK;
${GL_NOISE}
void main(){
  float r2=dot(vUV,vUV);
  float n=vn3(vec3(vUV*1.5+vK.y*31.0,vK.z+vK.y*5.0))*0.6+vn3(vec3(vUV*3.9-vK.y*13.0,vK.z*2.0))*0.4;
  float nf=vn3(vec3(vUV*8.5+vK.y*7.0,vK.z*3.0));
  float d=r2+0.8*(n-0.5)+0.24*(nf-0.5);
  float z=sqrt(max(1.0-clamp(d,0.0,1.0),0.0));
  vec3 N=vec3(vUV+(vec2(n,nf)-0.5)*0.95,z+0.2); N=N/max(length(N),1e-3);
  float lit=smoothstep(-0.30,0.80,dot(N,vMoonV));
  // crisp on the moon side, feathered in the shade, and gone before the card can reach the rock
  float a=(1.0-smoothstep(mix(0.22,0.52,lit),0.92,d))*(1.0-smoothstep(0.72,1.0,r2))*smoothstep(0.0,0.28,vWallK);
  float topk=smoothstep(-0.65,0.55,dot(N,vUpV));                                  // the underside sinks into the sea's own shadow
  vec3 col=uMistCol*(0.11+(0.35+3.3*lit*lit)*topk)+uMoonCol*0.06*lit*topk+uShade*(1.0-lit)*(0.35+0.65*topk);
  // the same height mist as everything else outside (inlined: this sprite has no cameraPosition-space position per pixel)
  vec3 dv=vW-cameraPosition; float dd=length(dv);
  float t=clamp(uMist.z*dv.y,-9.0,9.0); float f=abs(t)>1e-3 ? (1.0-exp(-t))/t : 1.0;
  float od=uMist.x*exp(-clamp(uMist.z*(cameraPosition.y-uMist.y),-5.0,12.0))*dd*f+uMist.w*dd;
  col=mix(col*uHeadK,uMistCol*0.8,clamp(1.0-exp(-max(od,0.0)),0.0,1.0)*0.85)*uOutGain;
  a*=vK.x;
  gl_FragColor=vec4(col*a,a);
}`;

// ---- after rain: seep falls. Ribbons laid down the fall line of both gorge walls over the built ledges. Each vertex knows
// its bed and where on the bed it is (aB: bed coordinate, 0 foot .. 1 lip of the face and 1 .. 2 across the ledge, how far ledges
// are built), so each fall leaps from a lip, drops the face as a ragged veil that wavers and fades in and out, bursts in a soft
// puff of mist at the foot, runs unseen across the ledge and starts again a little to one side. Silver on the moon wall, a dim
// blue-grey on the lee wall.
const FALL_VERT = /* glsl */`
attribute vec3 aAcr, aB; attribute vec4 aQ;  // aAcr: unit vector across the fall (world)   aQ: side -1|1, metres down the fall, half width (m), seed
attribute float aS;                          // how much moon reaches this wall
varying vec3 vP, vB; varying vec4 vQ; varying float vS, vE;
void main(){
  vec3 c=(modelMatrix*vec4(position,1.0)).xyz;
  vec3 tc=cameraPosition-c; float dist=length(tc);
  float hw=max(aQ.z,dist*0.0034);                                                 // the stream: never under two pixels
  float wg=4.2+hw*2.0;                                                            // the ribbon: wide enough for the stream to step sideways in
  vec3 wp=c+aAcr*(aQ.x*wg)+tc/max(dist,1e-3)*1.4;
  vP=wp; vQ=vec4(aQ.x*wg,aQ.y,hw,aQ.w); vS=aS; vE=aQ.x; vB=aB;
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0);
}`;
const FALL_FRAG = /* glsl */`
varying vec3 vP, vB; varying vec4 vQ; varying float vS, vE;     // vQ: metres across the ribbon, metres down the fall, half width of the stream, seed
${GL_OUT}
void main(){
  float ib=floor(vB.x), qf=vB.y;
  float face=(1.0-smoothstep(0.93,1.08,qf))*smoothstep(0.1,0.5,vB.z);             // on a rock face (not on the ledge)
  float sd=floor(vQ.w*97.0);
  float hs=h31(vec3(ib,sd,2.0)), hs2=h31(vec3(ib,sd,11.0));                       // this fall on this bed
  float wav=vn3(vec3(vQ.w*31.0,vQ.y*0.33-uTime*0.22,ib*1.3))-0.5;
  float cen=(hs-0.5)*4.0+wav*2.6;                                                 // it steps sideways on every ledge and wavers as it drops
  float hw=vQ.z*(0.6+0.9*hs2);
  float ax=(vQ.x-cen)/max(hw,0.05);                                               // in half widths of the stream
  float on=step(0.2,hs2)*face;                                                    // now and then a bed it misses
  float t=vQ.y*0.42-uTime*(2.0+1.3*hs);                                           // the pattern falls with the water
  float n1=vn3(vec3(ax*1.2+vQ.w*9.0,t,ib*3.1)), n2=vn3(vec3(ax*3.6,t*2.7,vQ.w*5.0+ib));
  float body=n1*0.6+n2*0.4;
  float prof=1.0-smoothstep(0.1,1.0,abs(ax)+(body-0.5)*1.1);
  float drop=1.0-clamp(qf,0.0,1.0);                                               // 0 at the lip .. 1 at the foot
  float thin=1.0-0.6*smoothstep(0.1,0.9,drop);                                    // it frays into spray as it drops
  float gust=smoothstep(0.2,0.6,vn3(vec3(vQ.w*17.0,uTime*0.19+ib*1.7,3.0)));      // and comes and goes
  float lit=smoothstep(0.05,0.5,vS);
  float brk=0.3+0.7*smoothstep(0.3,0.62,vn3(vec3(vQ.w*13.0,vQ.y*0.3-uTime*0.6,5.0)));      // the veil thins and thickens down its length
  float a=prof*on*smoothstep(0.12,0.5,body*(0.75+0.5*hs)*(0.6+0.4*thin))*(0.45+0.55*thin)*(0.45+0.55*gust)*brk;
  float foot=1.0-smoothstep(0.0,0.34,qf);
  float puff=foot*on*(1.0-smoothstep(0.4,4.6,abs(ax)))*(0.3+0.7*vn3(vec3(ax*0.7,qf*6.0-uTime*0.7,vQ.w*7.0)));   // mist at the foot
  a=clamp(a*1.25+puff*0.9,0.0,1.0)*mix(0.85,1.0,lit)*(1.0-smoothstep(0.75,1.0,abs(vE)));
  vec3 V=vP-cameraPosition; V=V/max(length(V),1e-3);
  float back=max(dot(V,uMoonDir),0.0);
  vec3 col=(uMoonCol*((0.95+0.6*back*back)*vS+0.13)+uAmbCol*1.8)*(0.5+0.8*body)*(1.0+0.25*puff);   // silver where the moon reaches, dim blue-grey on the lee wall
  float wetA=(1.0-smoothstep(0.8,3.2,abs(ax)))*0.3*smoothstep(0.2,0.65,n1)*on;    // the rock under it runs dark and wet
  col=mistApply(col*uOutGain,vP);
  float fade=(1.0-smoothstep(260.0,420.0,length(vP-cameraPosition)))*(1.0-smoothstep(0.8,1.0,abs(vE)));
  gl_FragColor=vec4(col*a*fade,(a+(1.0-a)*wetA)*fade);
}`;

// ---- rimu: tall emergents with weeping sprays in tiers. aS = 0 at a spray's shoulder .. 1 at its hem (-1 on the trunk);
// the hem is eaten into hanging strands in the fragment shader so the outline weeps instead of ending in a lump
const RIMU_VERT = /* glsl */`
attribute float aS; attribute vec3 iPos; attribute vec4 iScl, iCol;
varying vec3 vP, vN, vC, vO; varying float vS, vH;
${GL_OUT}
void main(){
  vec3 p=position*iScl.xyz; vec3 n=normal;
  float c=cos(iScl.w), s=sin(iScl.w);
  p.xz=vec2(c*p.x+s*p.z,-s*p.x+c*p.z); n.xz=vec2(c*n.x+s*n.z,-s*n.x+c*n.z);
  vec3 wp=iPos+p; vO=wp;
  float sw=max(aS,0.0);
  wp.xz+=vec2(sin(uTime*0.8+iPos.x*0.07+p.y*0.21),cos(uTime*0.6+iPos.z*0.06+p.y*0.17))*(0.25+0.9*sw*sw);
  vP=wp; vN=n; vC=iCol.rgb; vS=iCol.a; vH=aS;
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0);
}`;
const RIMU_FRAG = /* glsl */`
uniform float uFrost; uniform vec3 uStr;      // uStr: how fine the strands are, and how much of the hem they eat (slope, offset)
varying vec3 vP, vN, vC, vO; varying float vS, vH;
${GL_OUT}
void main(){
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  float hem=max(vH,0.0);
  float strands=vn3(vec3(vO.x*0.9*uStr.x,vO.y*0.16,vO.z*0.9*uStr.x))*0.65+vn3(vec3(vO.x*2.3*uStr.x,vO.y*0.4,vO.z*2.3*uStr.x))*0.35;
  if(vH>=0.0 && strands<hem*uStr.y-uStr.z) discard;                                // weeping: the hem hangs in ragged strands
  float n1=vn3(vP*0.45), n2=vn3(vP*1.3+5.0);
  vec3 Nb=N+(vec3(n1,n2,vn3(vP*0.8+9.0))-0.5)*0.8; Nb=Nb/max(length(Nb),1e-3);
  float nl=max(dot(Nb,uMoonDir)*0.7+0.3,0.0);
  vec3 alb=vH<0.0 ? vec3(0.02,0.02,0.018) : vC*(0.6+0.7*n2)*(1.0-0.5*hem);
  alb=mix(alb,vec3(0.34,0.38,0.42),uFrost*smoothstep(0.0,0.7,Nb.y)*0.8*step(0.0,vH));
  vec3 col=alb*(uMoonCol*nl*vS+uAmbCol*(0.45+0.55*(Nb.y*0.5+0.5)));
  gl_FragColor=vec4(mistApply(col*uOutGain,vP),1.0);
}`;

// ---- autumn: longfin eels riding the Flume beside the boat (boat space; black S shapes with wet, sky-lit backs)
const EELS_VERT = /* glsl */`
attribute float aT; attribute vec4 iPar;      // iPar: x (m right of the keel), z (m ahead of the eye, negative forward), phase, length scale
uniform float uTime, uEelsY;
varying vec3 vN; varying float vT;
void main(){
  float ph=aT*7.0-uTime*(6.0+2.0*fract(iPar.z*3.3))+iPar.z*20.0;
  float amp=(0.04+0.17*aT)*iPar.w;
  vec3 p=vec3(position.x+amp*sin(ph), position.y, position.z*iPar.w);
  p.x+=iPar.x+0.25*sin(uTime*0.7+iPar.z*9.0);
  p.z+=iPar.y+0.9*sin(uTime*0.45+iPar.z*5.0);
  p.y+=uEelsY;
  vN=mat3(modelMatrix)*normal; vT=aT;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;
const EELS_FRAG = /* glsl */`
uniform vec3 uEelsCol; uniform float uEelsA;
varying vec3 vN; varying float vT;
void main(){
  vec3 n=vN/max(length(vN),1e-4);
  float up=max(n.y,0.0); up*=up; float ridge=up*up; ridge*=ridge;
  gl_FragColor=vec4(uEelsCol*(0.004+0.05*up*(0.6+0.4*sin(vT*90.0))+0.55*ridge)*uEelsA,1.0);      // black, with a thin wet line of light down the back
}`;

// ---- mist: soft camera-facing puffs (boiling at the foot, drifting down the gorge, hanging in the notch)
const MIST_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;    // radius, phase, rise (m; 0 = drifting bank), opacity
uniform vec3 uDrift, uFoot;
varying vec2 vUV; varying vec3 vK; varying vec3 vW; varying float vH;
uniform float uTime, uOp;
void main(){
  vec3 c=iPos; float cyc=1.0, grow=1.0;
  if(iPar.z>0.0){ float f=fract(uTime*0.055+iPar.y); c.y+=f*iPar.z; c.xz+=uDrift.xz*f*14.0; grow=0.55+0.9*f; cyc=sin(3.1416*f); cyc*=cyc; }
  else { c+=uDrift*sin(uTime*0.05+iPar.y*6.2832)*12.0; c.y+=sin(uTime*0.11+iPar.y*17.0)*1.2; }
  vec4 mv=viewMatrix*modelMatrix*vec4(c,1.0);
  float rad=iPar.x*grow;
  float dist=length(mv.xyz);
  float fade=smoothstep(rad*0.35,rad*1.3,dist);
  mv.xy+=position.xy*rad;
  vUV=position.xy; vK=vec3(iPar.w*cyc*fade*uOp,iPar.y,uTime*0.03); vW=c;
  // this corner's height over the pool: the puff thins to nothing at the water, so the water plane never rules a line across it
  vH=(modelMatrix*vec4(c,1.0)).y+(viewMatrix[1][0]*position.x+viewMatrix[1][1]*position.y)*rad-uFoot.y;
  gl_Position=projectionMatrix*mv;
}`;
const MIST_FRAG = /* glsl */`
varying vec2 vUV; varying vec3 vK; varying vec3 vW; varying float vH;
uniform vec3 uMoonDir, uMoonCol, uAmbCol, uMistCol; uniform float uOutGain;
${GL_NOISE}
void main(){
  float r2=dot(vUV,vUV);
  float n=vn3(vec3(vUV*1.6+vK.y*31.0,vK.z+vK.y*5.0))*0.65+vn3(vec3(vUV*3.7-vK.y*13.0,vK.z*2.0))*0.35;
  float a=(1.0-smoothstep(0.0,1.0,r2+0.95*(n-0.5)))*vK.x;                         // each puff is torn, with holes in it: the pool shows between them
  a*=(1.0-smoothstep(0.75,1.0,r2))*smoothstep(0.3,5.0,vH);
  vec3 V=vW-cameraPosition; V=V/max(length(V),1e-3);
  float g=max(dot(V,uMoonDir),0.0);
  vec3 col=(uMistCol*(1.15+2.0*g*g)+uMoonCol*0.035*(0.6+0.4*vUV.y))*(0.7+0.6*n)*uOutGain;
  gl_FragColor=vec4(col*a,a);
}`;

// ---- small lights and motes: outside worms, mayflies, the placed real stars, spray beads. Camera-facing instanced quads
// sized from the drawing buffer every frame, never under uPx.x pixels, capped at uPx.y; MOVE is injected per kind.
const spriteVert = (move) => /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;       // iPar: size (m), phase, a, b (per kind)
uniform vec2 uRes; uniform vec3 uPx; uniform float uTime, uBright; uniform vec3 uColA, uColB;
varying vec2 vUV; varying vec3 vCol; varying float vF;
void main(){
  vec3 c=iPos; float br=1.0; float tint=fract(iPar.y*7.31); vF=0.0;
  ${move}
  vec4 mv=modelViewMatrix*vec4(c,1.0);
  float zc=min(mv.z,-0.05);
  float rTrue=iPar.x*projectionMatrix[1][1]*0.5*uRes.y/(-zc);
  float r=clamp(rTrue,uPx.x,max(uPx.x,uRes.y*uPx.y));
  br*=max(pow(clamp(rTrue/r,0.0,1.0),1.3),uPx.z)*smoothstep(0.3,0.9,-mv.z);
  vec4 pc=projectionMatrix*vec4(mv.xy,zc,1.0);
  pc.xy+=position.xy*r*2.4/(0.5*uRes)*pc.w;
  gl_Position=pc;
  if(mv.z>-0.1) gl_Position=vec4(0.0,0.0,2.0,1.0);
  vUV=position.xy; vCol=mix(uColA,uColB,tint)*(br*uBright);
}`;
const SPRITE_FRAG = /* glsl */`
varying vec2 vUV; varying vec3 vCol;
void main(){
  float r2=dot(vUV,vUV);
  float core=exp(-r2*10.0), halo=exp(-r2*3.4)*0.12;
  gl_FragColor=vec4(vCol*(core+halo)*(1.0-smoothstep(0.6,1.0,r2)),1.0);
}`;
// mayflies: each an upright V of two pale blades that beat, tilted at its own angle and rocking, with a short smear beneath it
// from its rise. They leave the water slowly and quicken as they climb, so the air is thickest low over the stream. Far ones
// are two-pixel motes; near ones show their wings. Sized from the drawing buffer every frame like the other sprites.
const FLY_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iPar;       // iPar: wing length (m), phase, rise (m), cycles per second
uniform vec2 uRes; uniform vec3 uPx; uniform float uTime, uBright; uniform vec3 uColA, uColB;
varying vec2 vUV; varying vec3 vCol; varying float vF;
void main(){
  float tint=fract(iPar.y*7.31), h2=fract(iPar.y*13.7), h3=fract(iPar.y*29.3);
  float f=fract(uTime*iPar.w+iPar.y);
  float fr=f*sqrt(f)*(0.6+0.4*f);                                                 // slow off the water, quicker as it climbs
  float an=iPar.y*40.0+uTime*(0.5+1.4*tint);
  float rr=(0.12+0.55*fr)*(0.4+tint);
  vec3 c=iPos+vec3(cos(an)*rr,0.06+fr*iPar.z+0.05*sin(uTime*(2.0+3.0*h2)+iPar.y*50.0),sin(an)*rr);
  vF=sin(uTime*(17.0+9.0*tint)+iPar.y*90.0);                                      // the wing beat
  float br=smoothstep(0.0,0.07,f)*(1.0-smoothstep(0.78,1.0,f))*(0.75+0.25*vF);
  vec4 mv=modelViewMatrix*vec4(c,1.0);
  float zc=min(mv.z,-0.05);
  float rTrue=iPar.x*projectionMatrix[1][1]*0.5*uRes.y/(-zc);
  float r=clamp(rTrue,uPx.x,max(uPx.x,uRes.y*uPx.y));
  br*=max(pow(clamp(rTrue/r,0.0,1.0),1.2),uPx.z)*smoothstep(0.35,1.1,-mv.z);
  float tilt=(h3-0.5)*2.0+0.4*sin(uTime*(1.3+2.0*h2)+iPar.y*30.0);                // every one at its own angle, rocking
  float ct=cos(tilt), st=sin(tilt);
  vec2 q=vec2(position.x*0.85,position.y*1.2);
  vec4 pc=projectionMatrix*vec4(mv.xy,zc,1.0);
  pc.xy+=vec2(ct*q.x-st*q.y,st*q.x+ct*q.y)*r*2.6/(0.5*uRes)*pc.w;
  gl_Position=pc;
  if(mv.z>-0.1) gl_Position=vec4(0.0,0.0,2.0,1.0);
  vUV=position.xy; vCol=mix(uColA,uColB,tint)*(br*uBright);
}`;
const FLY_FRAG = /* glsl */`
varying vec2 vUV; varying vec3 vCol; varying float vF;
void main(){
  vec2 b=vUV-vec2(0.0,-0.34);                                                     // the body sits low in the card; the wings rise from it
  float open=0.30+0.42*(0.5+0.5*vF);                                              // half the angle of the V: the beat
  float so=sin(open), co=cos(open);
  float tL=dot(b,vec2(-so,co)), pL=b.x*co+b.y*so;
  float tR=dot(b,vec2(so,co)),  pR=b.x*co-b.y*so;
  float wL=0.035+0.19*sin(3.1416*pow(clamp(tL/1.15,0.0,1.0),0.7)), wR=0.035+0.19*sin(3.1416*pow(clamp(tR/1.15,0.0,1.0),0.7));
  float wings=exp(-pL*pL/(wL*wL))*smoothstep(-0.04,0.10,tL)*(1.0-smoothstep(0.85,1.2,tL))
             +exp(-pR*pR/(wR*wR))*smoothstep(-0.04,0.10,tR)*(1.0-smoothstep(0.85,1.2,tR));
  float body=exp(-(vUV.x*vUV.x*70.0+(vUV.y+0.36)*(vUV.y+0.36)*16.0));
  float smear=exp(-vUV.x*vUV.x*34.0)*smoothstep(-1.0,-0.5,vUV.y)*(1.0-smoothstep(-0.5,-0.3,vUV.y))*0.22;   // the rise, and the long tails
  float w=min(wings,1.0)*0.8+body*0.75+smear;
  gl_FragColor=vec4(vCol*w*(1.0-smoothstep(0.8,1.0,max(abs(vUV.x),abs(vUV.y)))),1.0);
}`;
// the mayflies that spiral up round the great Organ toward the lures on its crown: the same wings, but each climbs a slow
// helix round the island (iPos = the island's foot), wide over the water and drawn in toward the columns as it rises
const FLY_VERT_SPIRAL = FLY_VERT
  .replace('float fr=f*sqrt(f)*(0.6+0.4*f);', 'float fr=f*(0.55+0.45*f);')
  .replace('float an=iPar.y*40.0+uTime*(0.5+1.4*tint);', 'float an=iPar.y*40.0+uTime*(0.16+0.2*tint)+fr*2.6;')
  .replace('float rr=(0.12+0.55*fr)*(0.4+tint);', 'float rr=(2.4+4.6*h2)*(1.0-0.6*fr)+0.3*sin(uTime*1.1+iPar.y*20.0);');
const MOVE_WORM = `br=0.7+0.3*sin(uTime*(0.3+0.5*tint)+iPar.y*6.2832);`;
const MOVE_STAR = `float tw=sin(uTime*(7.0+9.0*tint)+iPar.y*40.0)*sin(uTime*(3.1+4.0*tint)+iPar.y*17.0); br=iPar.z*(0.72+0.38*tw);`;
const MOVE_BEAD = `c.y+=sin(uTime*0.6+iPar.y*30.0)*0.25+fract(uTime*0.07*(0.5+tint)+iPar.y)*1.6-0.8; c.z+=sin(uTime*0.4+iPar.y*11.0)*0.3;
  br=iPar.z*(0.5+0.5*sin(uTime*(2.0+3.0*tint)+iPar.y*50.0));`;

// ---- the kayak: matt black, wet; it is lit only by what it reflects (uEnv = worm glow underground, moon and sky outside)
const BOAT_VERT = /* glsl */`
attribute float aKind;            // 0 deck and hull, 1 deck lines and fittings, 2 paddle
varying vec3 vL, vN, vV; varying float vKind;
void main(){
  vL=position; vKind=aKind;
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  vN=normalMatrix*normal; vV=-mv.xyz;
  gl_Position=projectionMatrix*mv;
}`;
const BOAT_FRAG = /* glsl */`
uniform vec3 uEnv, uGlintCol, uKeyV, uKeyCol, uRim; uniform float uWet, uTime;
varying vec3 vL, vN, vV; varying float vKind;
${GL_NOISE}
void main(){
  vec3 N=vN/max(length(vN),1e-4); vec3 V=vV/max(length(vV),1e-4);
  if(!gl_FrontFacing) N=-N;
  float c=1.0-clamp(dot(N,V),0.0,1.0); float fr=0.035+0.965*c*c*c;
  float deck=1.0-step(0.5,vKind);
  // beads of water on the deck: a few jittered drops of different sizes, each a pin-sharp glint that winks as the view moves
  vec2 g=vL.xz*vec2(31.0,23.0)+vec2(vn3(vL*9.0),vn3(vL*7.0+4.0))*1.3; vec2 ig=floor(g); vec2 fg=fract(g)-0.5;
  float hh=h31(vec3(ig,1.7)); vec2 off=(vec2(h31(vec3(ig,5.1)),h31(vec3(ig,9.4)))-0.5)*0.7;
  float rad=0.07+0.11*h31(vec3(ig,3.3));
  float bead=(1.0-smoothstep(rad*0.35,rad,length(fg-off)))*step(0.78,hh)*deck;
  float wink=0.5+0.5*sin(uTime*(0.6+1.8*hh)+hh*60.0+dot(V.xy,vec2(11.0,7.0)));
  float film=vn3(vec3(vL.x*14.0,vL.y*5.0,vL.z*2.2))*0.6+vn3(vL*vec3(40.0,9.0,9.0))*0.4;       // water sheeting off toward the gunwales
  vec3 base=vec3(0.0055,0.0065,0.008)*(0.7+0.6*film);
  if(vKind>1.5) base=vec3(0.011,0.012,0.013);
  else if(vKind>0.5) base=vec3(0.004,0.0045,0.005);
  float kd=max(dot(N,uKeyV),0.0);
  vec3 Hh=uKeyV+V; Hh=Hh/max(length(Hh),1e-3);
  float sp=max(dot(N,Hh),0.0); sp*=sp; sp*=sp; sp*=sp; sp*=sp;
  float wetK=mix(0.35,1.0,deck)*uWet*(0.55+0.45*smoothstep(0.35,0.7,film));
  float sp2=max(dot(N,Hh),0.0); sp2*=sp2; sp2*=sp2; sp2*=sp2;
  float shiny=mix(vKind>1.5?0.5:0.0,1.0,deck);
  vec3 col=base*(uEnv*7.0+uKeyCol*kd*4.0)+(uEnv*fr*wetK*0.55+uKeyCol*(sp*0.5+sp2*0.12+fr*0.03)*wetK)*shiny;
  col+=uGlintCol*bead*wink*uWet*(0.3+0.7*smoothstep(-0.2,0.6,N.y));
  // in the Tube the roof is an arm's length over the wet deck: a streaky sheen of its light along the deck and a thin rim down
  // the gunwales and the paddle, so the bow is a wet shape and not a hole in the water
  col+=uRim*(c*c*(0.3+0.7*smoothstep(0.3,0.75,film))*deck+c*c*c*(1.0-deck)*(vKind>1.5?0.8:0.45));
  // the paddle: wet carbon. Its upper side takes the roof's light as a soft line along the shaft and round the blade's edge,
  // so it is read as a shaft and a blade and never as a bare dark bar
  if(vKind>1.5){ float topL=smoothstep(0.25,0.9,N.y); col+=(uEnv*1.5+uRim*2.2+uKeyCol*0.25)*(0.10+0.9*topL*topL)*(0.6+0.4*film); }
  gl_FragColor=vec4(col,1.0);
}`;

// ---- the ruru: a dark owl on broad round wings, near black, with a thin rim of moonlight on the edges that face the moon
const OWL_VERT = /* glsl */`
attribute vec2 aW;                // signed span fraction (0 on the body), chord fraction
uniform float uFlap;
varying vec3 vP, vN, vAx, vAz; varying vec2 vW;
void main(){
  vec3 p=position; float s=abs(aW.x);
  float ang=uFlap*(0.25+0.75*s);
  p.y+=sin(ang)*s*s*0.15;
  p.x*=1.0-0.04*(1.0-cos(ang))*s;
  vP=(modelMatrix*vec4(p,1.0)).xyz; vN=mat3(modelMatrix)*normal; vW=aW;
  vAx=normalize(mat3(modelMatrix)*vec3(1.0,0.0,0.0)); vAz=normalize(mat3(modelMatrix)*vec3(0.0,0.0,1.0));
  gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.0);
}`;
const OWL_FRAG = /* glsl */`
varying vec3 vP, vN, vAx, vAz; varying vec2 vW;
${GL_OUT}
void main(){
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  vec3 V=cameraPosition-vP; V=V/max(length(V),1e-3);
  float rim=1.0-clamp(dot(N,V),0.0,1.0); rim*=rim;
  float bars=0.7+0.3*vn3(vP*vec3(9.0,9.0,30.0));
  float bar2=0.55+0.45*smoothstep(0.35,0.65,vn3(vP*vec3(5.0,5.0,26.0)+3.0));
  // near black: the bars of its back only just show where the moon lies on them
  vec3 col=vec3(0.040,0.033,0.027)*bars*bar2*(uAmbCol*1.2+uMoonCol*(max(dot(N,uMoonDir),0.0)*0.7+0.1));
  // the rim: on the body where it turns toward the moon; on the wings and tail along the edges that face the moon
  float wing=step(0.001,abs(vW.x)), c2=vW.y*2.0-1.0;
  float eL=smoothstep(0.80,0.97,-c2)*max(dot(-vAz,uMoonDir),0.0), eT=smoothstep(0.84,0.98,c2)*max(dot(vAz,uMoonDir),0.0);
  float eS=smoothstep(0.955,0.995,abs(vW.x))*max(dot(vAx*sign(vW.x),uMoonDir),0.0)*0.35;
  col+=uMoonCol*(mix(rim*rim*smoothstep(0.2,0.9,dot(N,uMoonDir))*0.07,min(eL+eT+eS,1.0)*0.42,wing));
  gl_FragColor=vec4(col*uOutGain,1.0);
}`;

// ---- the bats that fly with the bow: six long-tailed bats of our own, flat black silhouettes with angular wings bent at the
// wrist and a scalloped trailing edge, beating fast and unevenly. Instanced; the script places each one every frame.
const BAT_VERT = /* glsl */`
attribute vec2 aW;                // signed span fraction (0 on the body), chord fraction
attribute float iPh;
varying vec3 vP, vN; varying vec2 vW;
${GL_OUT}
void main(){
  vec3 p=position; float s=abs(aW.x);
  float ph=uTime*(13.0+6.0*fract(iPh*7.3))+iPh*40.0;
  float beat=sin(ph)+0.25*sin(ph*2.0+0.8);
  float ang=0.8*beat*(0.3+0.7*s)-0.1;
  p.y+=sin(ang)*s*0.4-0.035*beat*(1.0-s);
  p.x*=1.0-0.3*(1.0-cos(ang))*s;
  p.z+=0.05*cos(ph)*s*s;
  vec4 wp=modelMatrix*instanceMatrix*vec4(p,1.0);
  vP=wp.xyz; vN=mat3(modelMatrix)*mat3(instanceMatrix)*normal; vW=aW;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const BAT_FRAG = /* glsl */`
varying vec3 vP, vN; varying vec2 vW;
${GL_OUT}
void main(){
  vec3 N=vN/max(length(vN),1e-4); if(!gl_FrontFacing) N=-N;
  float wing=step(0.001,abs(vW.x));
  // near black: a wing's membrane lets a breath of the sky through between its fingers, the body none
  float fingers=0.5+0.5*cos(abs(vW.x)*19.0);
  vec3 col=vec3(0.03,0.032,0.04)*(uAmbCol*(0.7+0.9*wing*fingers)+uMoonCol*(max(dot(N,uMoonDir),0.0)*0.25+0.03));
  col+=uMoonCol*(wing*smoothstep(0.9,1.0,1.0-vW.y)*max(dot(N,uMoonDir),0.0)*0.06);       // the leading edge, where the moon lies on it
  gl_FragColor=vec4(col*uOutGain,1.0);
}`;

// ---- the veil of spray at the lip: one eased wash in front of the lens, never a flash
const VEIL_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uA, uTime;
varying vec2 vUV;
${GL_NOISE}
void main(){
  float n=vn3(vec3(vUV*vec2(5.0,2.0)+vec2(0.0,uTime*2.6),uTime*0.7))*0.6+vn3(vec3(vUV*vec2(17.0,5.0)+vec2(0.0,uTime*5.0),1.0))*0.4;
  float a=uA*(0.55+0.6*n);
  gl_FragColor=vec4(uCol*a,a);
}`;
const VEIL_VERT = /* glsl */`varying vec2 vUV; void main(){ vUV=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

// ---------------------------------------------------------------- geometry helpers
function quadInstanced(count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1]));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
  return g;
}
function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1]));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
  return g;
}
// one crown: NF fronds (2 x 5 quads each) + a 5-sided trunk
function fernCrownGeometry(NF = 11, SEG = 5, trunk = true) {
  const aF = [], pos = [], idx = [];
  for (let f = 0; f < NF; f++) {
    const az = (f / NF) * TAU + ((f * 7) % 3) * 0.07, ph = ((f * 0.618) % 1);
    const b = aF.length / 4;
    for (let j = 0; j <= SEG; j++) for (let s = -1; s <= 1; s += 2) { aF.push(az, j / SEG, s, ph); pos.push(0, 0, 0); }
    for (let j = 0; j < SEG; j++) { const q = b + j * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
  }
  const b = aF.length / 4, TS = 5;
  if (trunk) {
    for (let j = 0; j <= 2; j++) for (let s = 0; s < TS; s++) { aF.push((s / TS) * TAU, j / 2, 0, -1); pos.push(0, 0, 0); }
    for (let j = 0; j < 2; j++) for (let s = 0; s < TS; s++) { const q = b + j * TS + s, r = b + j * TS + (s + 1) % TS; idx.push(q, r, q + TS, r, r + TS, q + TS); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(aF, 4)); g.setIndex(idx);
  return g;
}
// simple merged-mesh builder (positions, normals computed later, one float attribute per vertex)
function mesher() {
  const pos = [], idx = [], ext = [];
  return {
    pos, idx, ext,
    v(x, y, z, e = 0) { pos.push(x, y, z); ext.push(e); return pos.length / 3 - 1; },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    tri(a, b, c) { idx.push(a, b, c); },
    // tube along points with radii; returns nothing
    tube(pts, rad, sides, e = 0) {
      const b0 = pos.length / 3, up = new V3(0, 1, 0), t = new V3(), n1 = new V3(), n2 = new V3();
      for (let i = 0; i < pts.length; i++) {
        t.subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
        n1.crossVectors(t, Math.abs(t.y) > 0.9 ? new V3(1, 0, 0) : up).normalize(); n2.crossVectors(t, n1);
        const r = Array.isArray(rad) ? rad[i] : rad;
        for (let s = 0; s < sides; s++) { const a = (s / sides) * TAU, c = Math.cos(a) * r, d = Math.sin(a) * r; this.v(pts[i].x + n1.x * c + n2.x * d, pts[i].y + n1.y * c + n2.y * d, pts[i].z + n1.z * c + n2.z * d, e); }
      }
      for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s < sides; s++) { const q = b0 + i * sides + s, r = b0 + i * sides + (s + 1) % sides; this.quad(q, r, r + sides, q + sides); }
    },
    geometry(extName, extSize = 1) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      if (extName) g.setAttribute(extName, new THREE.Float32BufferAttribute(ext.flat ? ext.flat() : ext, extSize));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    },
  };
}

// ---------------------------------------------------------------- the looks (hour) this world can wear
const LOOKS = {
  moon:     { hero: 'night',    zen: '#0B1638', mid: '#11254c', hor: '#31486c', stars: 1.0,  milky: 1.0,  moon: 1,    key: 1.15, keyCol: '#E4EEF8', amb: ['#3c5c9c', 0.36], mist: ['#9DB2C6', 0.105], fog: [0.0034, 8, 0.03, 0.00034], glit: 0.6, gain: 1.0 },
  moonless: { hero: 'moonless', zen: '#040a20', mid: '#081634', hor: '#172a50', stars: 1.7,  milky: 1.9,  moon: 0,    key: 0.10, keyCol: '#b9c8f0', amb: ['#4e68a6', 0.85], mist: ['#7890bc', 0.060], fog: [0.0026, 8, 0.03, 0.00022], glit: 0.25, gain: 1.6 },
  dawn:     { hero: 'dawn',     zen: '#173a7c', mid: '#4a6ea8', hor: '#c4cdd8', stars: 0.42, milky: 0.20, moon: 0.45, key: 0.62, keyCol: '#e6ebf4', amb: ['#5f82bc', 0.30], mist: ['#c9d2de', 0.150], fog: [0.0038, 30, 0.03, 0.00030], glit: 0.5, gain: 1.0 },
  dusk:     { hero: 'dusk',     zen: '#10286e', mid: '#2c56a0', hor: '#7d9cc8', stars: 0.28, milky: 0.10, moon: 0.8,  key: 0.70, keyCol: '#dfe8f6', amb: ['#4a74c4', 0.50], mist: ['#a9bede', 0.150], fog: [0.0036, 10, 0.03, 0.00036], glit: 0.85, gain: 1.0 },
};

export default {
  id: 'false-stars',
  name: 'False Stars',
  category: 'wilderness',
  weirdness: 0.15,
  media: ['water', 'interior', 'air'],
  async build(ctx) {
    const { rng, noise, renderer } = ctx;
    const vary = ctx.vary || {}, det = ctx.quality?.detail ?? 1;

    // ---------------- which night are we fired into (hour), what weather, what season, who is about
    const lr = rng.fork('look');
    const hourAsk = vary.hour || 'any';
    const lookId = hourAsk === 'dawn' ? 'dawn' : (hourAsk === 'day' || hourAsk === 'golden') ? 'dusk'
      : hourAsk === 'night' ? lr.pick(['moon', 'moon', 'moonless']) : lr.pick(['moon', 'moon', 'moonless', 'dawn', 'dusk']);
    const LK = LOOKS[lookId];
    const weather = lookId === 'dawn' ? 'brim' : lr.pick(['clear', 'clear', 'rain', 'cloudsea']);   // dawn: the gorge brim-full of mist
    const season = lr.pick(['summer', 'summer', 'winter', 'autumn']);
    const rare = !!vary.rare, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const batCount = season === 'winter' ? 0 : Math.round((lookId === 'dusk' ? 230 : 140) * (0.8 + 0.4 * lr()));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE[0]);
    scene.fog = new THREE.FogExp2(new THREE.Color('#050b12'), 0.0009);

    // ---------------- the cave (hero) and the flight
    const hero = await buildHero(ctx, { palette: PALETTE, density: dens, hour: LK.hero, weather: weather === 'rain' ? 'rain' : undefined, streak: 0.4 });   // after rain the river runs a metre higher, roofs closer
    hero.uniforms.uAmb.value.setRGB(0.0065, 0.027, 0.03);       // a floor of blue-green relief so the rock never falls to dark mush
    scene.add(hero.object);
    const A = hero.anchors;
    const path = makePath(A.flyThrough);
    await ctx.yield();

    const lip = A.mouth.position.clone(), fH = new V3(A.mouth.direction.x, 0, A.mouth.direction.z).normalize(), rH = A.mouth.right.clone().normalize();
    const W = (x, y, k, out = new V3()) => out.copy(lip).addScaledVector(rH, x).addScaledVector(fH, k).setY(lip.y + y);
    const toG = (p) => { const dx = p.x - lip.x, dz = p.z - lip.z; return { x: dx * rH.x + dz * rH.z, y: p.y - lip.y, k: dx * fH.x + dz * fH.z }; };
    const portalPos = path.end.clone(), PG = toG(portalPos);
    const SEC = A.sections, caveU = SEC.caveU, sG = SEC.grotto[1], sT = SEC.tube[1], sM = SEC.flume[1], sD0 = SEC.dome[0], sD1 = SEC.dome[1];   // u at the lip (0.647); river distances of the Grotto's, Tube's and Flume's ends
    const moonDir = new V3().addScaledVector(fH, Math.cos(76 * RAD) * Math.cos(22 * RAD)).addScaledVector(rH, -Math.sin(76 * RAD) * Math.cos(22 * RAD)).setY(Math.sin(22 * RAD)).normalize();

    // ---------------- shared outside uniforms
    const moonCol = lin(LK.keyCol, LK.key), ambCol = lin(LK.amb[0], LK.amb[1]), mistCol = lin(LK.mist[0], LK.mist[1]);
    const fogP = LK.fog.slice();
    const deckOnEarly = weather === 'cloudsea' || weather === 'brim';
    const cloudY = weather === 'brim' ? PG.y - 13 : Math.min(FLOOR + 50, PG.y - 22);   // the cloud floor lies under the ring, which hangs over it in a hollow: at dawn a sea of mist that fills the gorge to just under the ring (the glide is flown over it and the dive ends at the ring, before the mist), on a cloud-sea night a little lower
    if (weather === 'cloudsea') { fogP[0] *= 1.2; fogP[1] = 24; fogP[3] *= 0.9; }
    if (weather === 'rain') { fogP[0] *= 1.35; fogP[3] *= 1.3; }
    const OU = {
      uMoonDir: { value: moonDir }, uMoonCol: { value: moonCol }, uAmbCol: { value: ambCol }, uMistCol: { value: mistCol },
      uMist: { value: new THREE.Vector4(fogP[0], lip.y + FLOOR + fogP[1], fogP[2], fogP[3]) }, uTime: { value: 0 }, uOutGain: { value: 1 },
      uFoot: { value: new V3() }, uLip: { value: lip }, uF: { value: fH }, uR: { value: rH },
    };
    const outU = (extra = {}) => Object.assign({ uMoonDir: OU.uMoonDir, uMoonCol: OU.uMoonCol, uAmbCol: OU.uAmbCol, uMistCol: OU.uMistCol, uMist: OU.uMist, uTime: OU.uTime, uOutGain: OU.uOutGain }, extra);
    const outside = new THREE.Group(); outside.name = 'outside'; scene.add(outside);

    await ctx.yield();

    // ---------------- sky: the real stars. The Milky Way stands up out of the notch dead ahead; the moon is on our left
    const sky = makeSky({
      rng, preset: 'night', bake: true, renderer, zenith: LK.zen, mid: LK.mid, horizon: LK.hor, ground: '#070f1c', horizonPow: 3.0,
      stars: LK.stars, twinkle: 0.85, starDensity: 1, milkyWay: LK.milky * 0.62, milkyAxis: [rH.x, 0.0, rH.z], milkyAngle: season === 'winter' ? 262 : 232, milkyColor: '#6f86c0', milkyCore: '#aebfe6',
      bodies: LK.moon > 0 ? [{ direction: moonDir.clone(), size: 1.5, phase: 0.8, phaseAngle: 35, intensity: 0.9 * LK.moon, dark: 0.02, glow: 0.2 * LK.moon, glowColor: '#9db8ff' }] : [],
      clouds: false, clouds2: false,
    });
    outside.add(sky.object);
    await ctx.yield();
    const skyLow = sky.colorAt(new V3(fH.x, 0.04, fH.z).normalize(), new THREE.Color()), skyHigh = sky.colorAt(new V3(fH.x * 0.4, 0.9, fH.z * 0.4).normalize(), new THREE.Color());

    // ---------------- the gorge: height function in gorge coordinates (x right, k out from the cliff), y above the lip
    const tr = rng.fork('terrain'), so = tr.range(0, 100);
    const rimL = tr.range(142, 166), rimR = tr.range(124, 150), mean = tr.range(9, 17) * tr.sign();
    const BUT = { x: PG.x + tr.range(21, 26), k: PG.k + tr.range(4, 12), h: tr.range(12.5, 15), r2: tr.range(70, 95) };
    const cxAt = (k) => mean * Math.sin((k - 150) / 150) * smoothstep(150, 380, k);
    const rivX = (k) => cxAt(k) + 7 * Math.sin(k / 47 + so) * smoothstep(150, 200, k) + plumeX(5.08) * (1 - smoothstep(134, 230, k));
    const PLV = 26.5, PLT = (PLV * Math.sin(6 * RAD) + Math.sqrt((PLV * Math.sin(6 * RAD)) ** 2 + 2 * 9.8 * (0.3 - FLOOR))) / 9.8;   // the plume: speed off the lip, time to the pool
    const plumeX = (t) => -(0.9 * t + 0.42 * t * t);                    // it bears left of the flume axis as it falls
    const POOL = { x: plumeX(PLT), k: PLV * Math.cos(6 * RAD) * PLT, r: 24 };
    function hAt(x, k, cheap) {
      const cx = cxAt(k), ax = Math.abs(x - cx), side = x < cx ? -1 : 1;
      const pinch = smoothstep(260, 610, k), open = smoothstep(640, 820, k);
      const hw = lerp(74, 9, pinch) + 140 * open + (cheap ? 0 : 7 * noise.n2(k * 0.008, so + side * 5));
      let fl = FLOOR + 1.4 + 5 * smoothstep(0.35, 1, ax / Math.max(hw, 1));
      if (!cheap) fl += 1.8 * noise.fbm2(x * 0.03 + so, k * 0.03, 3);
      const rp = Math.hypot(x - POOL.x, k - POOL.k); fl = lerp(FLOOR - 3, fl, smoothstep(POOL.r - 4, POOL.r + 5, rp));
      if (k > POOL.k) { const rd = Math.abs(x - rivX(k)); fl = Math.min(fl, lerp(FLOOR - 2.5, fl, smoothstep(6.5, 11, rd))); }
      fl += BUT.h * Math.exp(-((x - BUT.x) ** 2 + (k - BUT.k) ** 2) / BUT.r2);
      let y = fl;
      const d = ax - hw;
      if (d > 0) {
        const sw = lerp(52, 135, pinch), t = d / sw, tt = Math.min(t, 1);
        const rim = (side < 0 ? rimL : rimR) * (1 - 0.42 * smoothstep(180, 620, k)) * (1 - 0.55 * open) * (1 + (cheap ? 0 : 0.16 * noise.n2(k * 0.0045 + so, side * 3.1)));
        let w = rim * Math.pow(tt, 0.72);
        if (!cheap) w += tt * (7 * noise.fbm2(x * 0.021, k * 0.021 + so, 3) + 5 * Math.sin(w * 0.16 + noise.n2(k * 0.02, so) * 2));
        if (t > 1) w += (d - sw) * 0.05 + (cheap ? 0 : 6 * noise.n2(x * 0.01 + so, k * 0.01));
        y = fl + w;
      }
      // the cliff under the lip. Its wander belongs to the cliff alone: carried down the gorge it was a floor of its own, in strips
      // of constant x, that filled the pool and the river to a ruler-straight shore wherever it ran above the water
      const clK = smoothstep(2, 26, k);
      const cl = FLOOR + 222 * (1 - smoothstep(-10, 4, k)) + (cheap ? 0 : 5 * noise.n2(x * 0.02, so + 9) * (1 - clK)) - 8 * clK;
      return Math.max(y, cl);
    }
    // soft shadow of the left wall in the moon's light (softened and lifted: a pool of broken moonlight is the point)
    const shE = 34 * RAD, shC = Math.cos(shE), shS = Math.sin(shE);
    function shadeAt(x, y, k) {
      let occ = 0;
      for (let i = 1, dist = 7; i <= 9; i++, dist *= 1.55) { const hy = hAt(x - shC * dist, k, true) - (y + 1.5 + shS * dist); if (hy > 0) occ = Math.max(occ, Math.min(1, hy / 14)); }
      return 1 - 0.62 * occ;
    }
    await ctx.yield();

    // ---------------- the cliff's beds, and the ledges they are built into over both walls near the flight
    // Beds of uneven thickness (massive ones 13 to 21 m between runs of thin ones), from this world's own stream so nothing
    // else's draws move. bedCoord: gorge height (plus the bedding's undulation) -> bed index + fraction up the bed.
    const bedRng = makeRng('false-stars-beds:' + (ctx.seed ?? 0));
    const BED0 = -152, bedY = [BED0], bedH = [];
    while (bedY[bedY.length - 1] < 96) { const big = bedRng() < 0.4; bedY.push(bedY[bedY.length - 1] + (big ? bedRng.range(13, 21) : bedRng.range(6.5, 11))); bedH.push(bedRng()); }
    bedH.push(0.5);
    const bedCoord = (yy) => {
      const y = clamp(yy, BED0, bedY[bedY.length - 1] - 0.01);
      let lo = 0, hi = bedY.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (bedY[m] <= y) lo = m; else hi = m; }
      return lo + (y - bedY[lo]) / (bedY[lo + 1] - bedY[lo]);
    };
    const hwAt = (k, side) => lerp(74, 9, smoothstep(260, 610, k)) + 140 * smoothstep(640, 820, k) + 7 * noise.n2(k * 0.008, so + side * 5);   // the wall's foot, as in hAt
    // The patches: k (out from the cliff) PK0..PK1, d (metres into the wall from its foot) PD0..PD1, on both sides.
    const PK0 = 4, PK1 = 264, PD0 = -5, PD1 = 63;
    const TI = { b: 0, ao: 1, tread: 0, amp: 0, out: 0, q: 0, tw: 0 }, pw = new V3();
    const wobAt = (wx, wz) => strataWarp(wx, wz) + 2.4 * noise.n2(wx * 0.043 + so, wz * 0.043) + 1.0 * noise.n2(wx * 0.15, wz * 0.15 + so);   // the bedding's undulation and the lip's wander (m)
    // hT: the ground with its ledges. Going up a bed: first its face (steep, fluted in the shader, its nose rounded and leaning
    // out a little), then its top, a tread that slopes gently back to the foot of the next face. How deep the tread is changes
    // from bed to bed and along each ledge, the lip wanders with the bedding and with two scales of noise, and a bed pinches
    // out into the slope for a stretch. o (optional) receives: bed coordinate, crevice light, tread 0|1, how far the ledge is
    // built (0..1), the nose's lean (m toward the gorge), q (0 foot .. 1 lip of the face, 1 .. 2 across the tread), tread depth (m).
    function hT(x, k, o) {
      const y0 = hAt(x, k);
      W(x, 0, k, pw);
      const b = bedCoord(y0 + wobAt(pw.x, pw.z));
      if (o) { o.b = b; o.ao = 1; o.tread = 0; o.amp = 0; o.out = 0; o.q = 0; o.tw = 0; }
      if (k <= PK0 || k >= PK1) return y0;
      const cx = cxAt(k), side = x < cx ? -1 : 1, d = Math.abs(x - cx) - hwAt(k, side);
      if (d <= 0.5 || d >= 61.5) return y0;
      let amp = smoothstep(PK0 + 2, PK0 + 14, k) * (1 - smoothstep(PK1 - 60, PK1 - 8, k)) * smoothstep(0.5, 6, d) * (1 - smoothstep(56, 61.5, d));
      const ib = Math.floor(b), f = b - ib, T = bedY[ib + 1] - bedY[ib], hs = bedH[ib];
      const al = noise.n2(pw.x * 0.017 + ib * 7.13, pw.z * 0.017 - ib * 3.71);                       // along each ledge
      amp *= 0.35 + 0.65 * smoothstep(-0.95, -0.6, al + 0.5 * noise.n2(pw.x * 0.006 + 31, pw.z * 0.006));
      const tf = clamp(0.38 + 0.32 * hs + 0.26 * al, 0.14, 0.78), r = 1 - tf;                          // the tread's share of the bed, in plan
      const ov = Math.min((0.3 + 0.8 * bedH[(ib + 3) % bedH.length]) * clamp(T / 10, 0.6, 1.6), 0.36 * tf * T / 2.8) * amp;
      let g, ao, tread = 0, out, q;
      if (f < r) { q = f / r; g = q < 0.72 ? q * 1.18 : 0.85 + 0.075 * (1 - ((1 - q) / 0.28) ** 2); ao = 1 - 0.7 * (1 - smoothstep(0, 0.5, q)); out = ov * smoothstep(0.3, 0.9, q); }
      else { const tq = (f - r) / tf; q = 1 + tq; g = 0.925 + 0.075 * tq; ao = 1 - 0.62 * smoothstep(0.45, 1, tq); tread = 1; out = ov * (1 - smoothstep(0, 0.45, tq)); }
      if (o) { o.ao = lerp(1, ao, amp); o.tread = tread; o.amp = amp; o.out = out; o.q = q; o.tw = tf * T / 2.8; }
      return y0 + amp * T * (g - f);
    }
    const cutAt = (x, k) => { const cx = cxAt(k), side = x < cx ? -1 : 1, d = Math.abs(x - cx) - hwAt(k, side); return clamp(Math.min(d - PD0, PD1 - d, k - PK0, PK1 - k) / 9, 0, 1); };
    await ctx.yield();

    const TNX = 92, TNK = 132;
    let terrainMat = null;
    { // terrain mesh: fine round the pool and the dive, coarse toward the notch and the plateaus. Under the cliff patches it is not drawn.
      const NX = TNX, NK = TNK, nv = (NX + 1) * (NK + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), shd = new Float32Array(nv), ac = new Float32Array(nv * 4), cut = new Float32Array(nv);
      const p = new V3(), idx = [];
      for (let j = 0; j <= NK; j++) {
        const b = j / NK, k = -24 + 380 * b + 600 * b * b * b;
        for (let i = 0; i <= NX; i++) {
          const a = (i / NX) * 2 - 1, x = Math.sign(a) * (110 * Math.abs(a) + 240 * Math.abs(a) ** 3), q = j * (NX + 1) + i;
          const y = hAt(x, k), e = 1.5;
          W(x, y, k, p); pos[q * 3] = p.x; pos[q * 3 + 1] = p.y; pos[q * 3 + 2] = p.z;
          const gx = (hAt(x + e, k) - y) / e, gk = (hAt(x, k + e) - y) / e;
          const nl = Math.hypot(gx, 1, gk);
          nor[q * 3] = (-gx * rH.x - gk * fH.x) / nl; nor[q * 3 + 1] = 1 / nl; nor[q * 3 + 2] = (-gx * rH.z - gk * fH.z) / nl;
          shd[q] = shadeAt(x, y, k);
          ac[q * 4] = bedCoord(y + wobAt(p.x, p.z)); ac[q * 4 + 1] = 1; cut[q] = cutAt(x, k);
          if ((i & 7) === 7) await ctx.yield();             // a part of a row at a time
        }
        await ctx.yield();
      }
      for (let j = 0; j < NK; j++) for (let i = 0; i < NX; i++) { const q = j * (NX + 1) + i, r = q + NX + 1; idx.push(q, q + 1, r, q + 1, r + 1, r); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aShade', new THREE.BufferAttribute(shd, 1));
      g.setAttribute('aC', new THREE.BufferAttribute(ac, 4)); g.setAttribute('aCut', new THREE.BufferAttribute(cut, 1)); g.setAttribute('aD', new THREE.BufferAttribute(new Float32Array(nv), 1));
      g.setIndex(idx); g.computeBoundingSphere();
      await ctx.yield();
      terrainMat = new THREE.ShaderMaterial({ vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG, side: THREE.DoubleSide, uniforms: outU({ uLip: OU.uLip, uF: OU.uF, uR: OU.uR, uFalls: { value: weather === 'rain' ? 1 : 0 },
        uWormC: { value: hero.uniforms.uWormCol.value.clone().multiplyScalar(deckOnEarly ? 0.012 : 0.026) } }) });
      const m = new THREE.Mesh(g, terrainMat);
      m.name = 'gorge'; outside.add(m);
      await ctx.yield();
      // two far ridges beyond the notch, pale in the haze
      const rp = [], ri = [], rs = [], rc = [], rz = [];
      for (let layer = 0; layer < 2; layer++) {
        const kk = 1150 + layer * 650, b0 = rp.length / 3;
        for (let i = 0; i <= 40; i++) {
          const x = (i / 40 - 0.5) * (2600 + layer * 1600), top = -70 + layer * 40 + 70 * noise.fbm2(i * 0.17 + so, layer * 9.1, 3) + 0.00006 * x * x;
          W(x, top, kk, p); rp.push(p.x, p.y, p.z); W(x, -260, kk, p); rp.push(p.x, p.y, p.z); rs.push(0.5, 0.5); rc.push(0.3, 1, 0, 0, 0.3, 1, 0, 0); rz.push(0, 0);
        }
        for (let i = 0; i < 40; i++) { const q = b0 + i * 2; ri.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
      }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
      const rn = new Float32Array(rp.length); for (let i = 0; i < rn.length; i += 3) { rn[i] = -fH.x * 0.6; rn[i + 1] = 0.8; rn[i + 2] = -fH.z * 0.6; }
      rg.setAttribute('normal', new THREE.BufferAttribute(rn, 3)); rg.setAttribute('aShade', new THREE.Float32BufferAttribute(rs, 1));
      rg.setAttribute('aC', new THREE.Float32BufferAttribute(rc, 4)); rg.setAttribute('aCut', new THREE.Float32BufferAttribute(rz, 1)); rg.setAttribute('aD', new THREE.Float32BufferAttribute(rz, 1)); rg.setIndex(ri);
      const rm = new THREE.Mesh(rg, terrainMat); rm.name = 'far-ridges'; rm.frustumCulled = false; outside.add(rm);
    }
    await ctx.yield();

    // the cliff patches: a fine sheet over each wall, heights from hT, each nose leaning out over the face below it
    const cliffPatch = async (side, kStep, nd) => {
      const ks = []; for (let k = PK0; k < PK1 - 1; k += kStep * (1 + 1.5 * smoothstep(110, 250, k))) ks.push(k); ks.push(PK1);
      const NR = ks.length, NC = nd + 1, n = NR * NC, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), shd = new Float32Array(n), ac = new Float32Array(n * 4), ad = new Float32Array(n), p = new V3(), idx = [];
      for (let j = 0; j < NR; j++) {
        const k = ks[j], cx = cxAt(k), hwk = hwAt(k, side);
        for (let i = 0; i < NC; i++) {
          const d = PD0 + (PD1 - PD0) * (i / nd), x = cx + side * (hwk + d), q = j * NC + i, y = hT(x, k, TI);
          W(x - side * TI.out, y, k, p); pos[q * 3] = p.x; pos[q * 3 + 1] = p.y; pos[q * 3 + 2] = p.z;
          ac[q * 4] = TI.b; ac[q * 4 + 1] = TI.ao; ac[q * 4 + 2] = TI.tread; ac[q * 4 + 3] = TI.amp; ad[q] = TI.q;
          if (side > 0 && (i % 6 === 0 || i === nd)) shd[q] = shadeAt(x, y, k);          // the lee wall takes no moon at all
          if ((i & 31) === 31) await ctx.yield();
        }
        if (side > 0) for (let i = 0; i < NC; i++) { if (i % 6 === 0 || i === nd) continue; const i0 = i - i % 6, i1 = Math.min(i0 + 6, nd); shd[j * NC + i] = lerp(shd[j * NC + i0], shd[j * NC + i1], (i - i0) / (i1 - i0)); }
        else shd.fill(1, j * NC, j * NC + NC);
        await ctx.yield();
      }
      let upSum = 0;
      for (let j = 0; j < NR; j++) {
        for (let i = 0; i < NC; i++) {
          const q = (j * NC + i) * 3, a1 = (j * NC + Math.min(i + 1, nd)) * 3, a0 = (j * NC + Math.max(i - 1, 0)) * 3, b1 = (Math.min(j + 1, NR - 1) * NC + i) * 3, b0 = (Math.max(j - 1, 0) * NC + i) * 3;
          const ax = pos[a1] - pos[a0], ay = pos[a1 + 1] - pos[a0 + 1], az = pos[a1 + 2] - pos[a0 + 2], bx = pos[b1] - pos[b0], by = pos[b1 + 1] - pos[b0 + 1], bz = pos[b1 + 2] - pos[b0 + 2];
          const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, l = Math.hypot(nx, ny, nz) || 1;
          nor[q] = nx / l; nor[q + 1] = ny / l; nor[q + 2] = nz / l; upSum += ny / l;
        }
        if ((j & 15) === 15) await ctx.yield();
      }
      if (upSum < 0) for (let i = 0; i < nor.length; i++) nor[i] = -nor[i];
      for (let j = 0; j < NR - 1; j++) for (let i = 0; i < nd; i++) { const q = j * NC + i, r = q + NC; idx.push(q, q + 1, r, q + 1, r + 1, r); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aShade', new THREE.BufferAttribute(shd, 1));
      g.setAttribute('aC', new THREE.BufferAttribute(ac, 4)); g.setAttribute('aCut', new THREE.BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aD', new THREE.BufferAttribute(ad, 1));
      g.setIndex(idx); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, terrainMat); m.name = side > 0 ? 'cliff-right' : 'cliff-left'; outside.add(m);
      await ctx.yield();
    };
    await cliffPatch(1, 2.0, 98);                           // the moonlit wall, beside and below the whole arc
    await cliffPatch(-1, 3.4, 52);                           // the lee wall: a dark shape with a stepped skyline

    { // falls down the gorge walls, each laid down the fall line over the ledges. In any weather two side falls come down the
      // moon wall ahead of the mouth and one down the lee wall: silver threads that give the long view its depth. After rain
      // there are six to eight seep falls on each wall.
      const wet = weather === 'rain';
      const fr = wet ? tr.fork('falls') : makeRng('false-stars-falls:' + (ctx.seed ?? 0)), pos = [], acr = [], aq = [], ab = [], as = [], idx = [], p = new V3();
      const mgx = moonDir.dot(rH), mgk = moonDir.dot(fH);
      for (const side of [-1, 1]) {
        const nF = wet ? 6 + fr.int(0, 2) : side > 0 ? 2 : 1;
        for (let f = 0; f < nF; f++) {
          const k0 = wet ? 16 + (f + fr.range(0.15, 0.85)) * (225 / nF) : side > 0 ? 118 + f * 78 + fr.range(-10, 10) : fr.range(150, 200);
          let x = cxAt(k0) + side * (hwAt(k0, side) + 52 * fr.range(0.62, 0.97)), k = k0, dist = 0, rows = 0, yPrev = 0;
          const hw = fr.range(0.3, 0.55) * (side > 0 ? (f % 2 === 0 || !wet ? 2.6 : 0.9) : 1.8), seed = fr(), b0 = pos.length / 3;   // every other one on the moon wall is a real fall
          for (let st = 0; st < 240; st++) {
            const e = 1.5, gx = (hAt(x + e, k) - hAt(x - e, k)) / (2 * e), gk = (hAt(x, k + e) - hAt(x, k - e)) / (2 * e), gl = Math.hypot(gx, gk);
            const y = hT(x, k, TI);
            if (y < FLOOR + 7 || k < 7 || gl < 0.25) break;
            const nl = Math.hypot(gx, 1, gk), nx = -gx / nl, ny = 1 / nl, nk = -gk / nl, ul = Math.max(gl, 1e-3);
            const ax = -gk / ul, ak = gx / ul;                                     // across the fall: level, square to the slope
            const shade = shadeAt(x, y, k) * smoothstep(-0.15, 0.45, nx * mgx + ny * moonDir.y + nk * mgk);
            if (rows > 0) dist += Math.hypot(0.5, y - yPrev);
            yPrev = y;
            W(x - side * TI.out, y, k, p);
            for (const sd of [-1, 1]) { pos.push(p.x, p.y, p.z); acr.push(rH.x * ax + fH.x * ak, 0, rH.z * ax + fH.z * ak); aq.push(sd, dist, hw, seed); ab.push(TI.b, TI.q, TI.amp); as.push(shade); }
            if (rows > 0) { const q = b0 + (rows - 1) * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
            rows++;
            x -= gx / ul * 0.5; k -= gk / ul * 0.5;                                // half a metre in plan: several rows down every face
          }
          await ctx.yield();
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aAcr', new THREE.Float32BufferAttribute(acr, 3));
      g.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 1)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: outU() }));
      m.frustumCulled = false; m.renderOrder = 1.2; m.name = 'seep-falls'; outside.add(m);
    }
    await ctx.yield();

    // ---------------- pool and river (one sheet; the terrain is carved under it)
    {
      const g = new THREE.BufferGeometry(), p = new V3(), pp = [];
      for (const [x, k] of [[-260, 30], [260, 30], [260, 980], [-260, 980]]) { W(x, FLOOR, k, p); pp.push(p.x, p.y, p.z); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setIndex([0, 2, 1, 0, 3, 2]); g.computeBoundingSphere();
      W(POOL.x, FLOOR, POOL.k, OU.uFoot.value);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, side: THREE.DoubleSide,
        uniforms: outU({ uFoot: OU.uFoot, uSkyLow: { value: skyLow }, uSkyHigh: { value: skyHigh }, uF: OU.uF, uGlit: { value: LK.glit } }) }));
      m.name = 'pool'; outside.add(m);
    }

    // ---------------- the plume: the river leaves the lip at 22 m/s and lands ~108 m out; two ballistic sheets
    const PL = { o: A.plume.origin.clone(), v: new V3().copy(fH).multiplyScalar(PLV * Math.cos(6 * RAD)).setY(PLV * Math.sin(6 * RAD)), g: 9.8 };
    PL.T = PLT + 0.12;
    const plumeAt = (t, out = new V3()) => out.copy(PL.o).addScaledVector(PL.v, t).addScaledVector(rH, plumeX(t)).setY(PL.o.y + PL.v.y * t - 0.5 * PL.g * t * t);
    const plumeK = weather === 'rain' ? 2.0 : season === 'autumn' ? 1.35 : 1, plumeMats = [];
    for (let layer = 0; layer < 2; layer++) {
      const NJ = 64, NI = 8, pos = [], aq = [], idx = [], c = new V3(), vel = new V3(), n = new V3();
      for (let j = 0; j <= NJ; j++) {
        const t = (j / NJ) * PL.T, w = (2.3 + 0.78 * t) * Math.max(plumeK, 1.42) * (layer ? 1.55 : 1);
        plumeAt(t, c); vel.copy(PL.v).setY(PL.v.y - PL.g * t); n.crossVectors(rH, vel).normalize().addScaledVector(rH, 0.25).normalize();
        for (let i = 0; i <= NI; i++) {
          const a = (i / NI) * 2 - 1, bulge = (1 - a * a) * (0.5 + 0.35 * t) * (layer ? 1.7 : 1) + (layer ? 0.4 : 0);
          pos.push(c.x + rH.x * a * w + n.x * bulge, c.y + n.y * bulge, c.z + rH.z * a * w + n.z * bulge); aq.push(a, t, w);
        }
      }
      for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const q = j * (NI + 1) + i, r = q + NI + 1; idx.push(q, q + 1, r, q + 1, r + 1, r); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 3)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      const mat = new THREE.ShaderMaterial({ vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: outU({ uLayer: { value: layer }, uTmax: { value: PL.T } }) });
      const m = new THREE.Mesh(g, mat); m.renderOrder = 2 + layer; m.name = 'plume' + layer; outside.add(m); plumeMats.push(mat);
    }
    { // separate falling clumps on the same parabola, and the spray that flies beside them
      const pr = rng.fork('clumps'), iq = [], n = Math.round(120 * Math.sqrt(plumeK));
      for (let i = 0; i < n; i++) iq.push(pr(), pr.range(-1, 1), pr.range(-0.3, 1.5), pr.range(0.55, 1.35) * (pr() < 0.2 ? 1.6 : 1));
      const g = quadInstanced(n, { iPar: [iq, 4] });
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: CLUMP_VERT, fragmentShader: CLUMP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: outU({ uPO: { value: PL.o }, uPV: { value: PL.v }, uPR: { value: rH }, uPT: { value: new THREE.Vector2(PL.T, plumeK) } }) }));
      m.frustumCulled = false; m.renderOrder = 3.5; m.name = 'plume-clumps'; outside.add(m);
    }

    await ctx.yield();

    const bankOp = { value: 1 };                                      // the moonlit bank the ruru crosses: from far up the glide it is one round smudge beside the ring, so it gathers as we come down on it
    // ---------------- mist: boiling at the foot, spray off the plume, banks down the gorge, glow in the notch, the cloud deck
    {
      const mr = rng.fork('mist'), mp = [], mq = [], p = new V3();
      const add = (x, y, k, rad, rise, op) => { W(x, y, k, p); mp.push(p.x, p.y, p.z); mq.push(rad, mr(), rise, op); };
      const thick = weather === 'rain' ? 1.12 : weather === 'clear' ? 1 : 1.05;
      for (let i = 0; i < Math.round(24 * det); i++) add(POOL.x + mr.range(-13, 9), FLOOR + mr.range(0, 4), POOL.k + mr.range(-9, 12), mr.range(8, 17) * plumeK ** 0.5, mr.range(16, 40), 0.3 * thick);
      for (let i = 0; i < 10; i++) add(POOL.x + mr.range(-9, 8), FLOOR + mr.range(2, 9), POOL.k + mr.range(-9, 9), mr.range(8, 14) * plumeK ** 0.5, 0, 0.38 * thick);
      for (let i = 0; i < 22; i++) { const t = mr.range(0.9, PL.T - 0.3); plumeAt(t, p); const gq = toG(p); add(gq.x + mr.range(-4, 3), gq.y + mr.range(-2, 3), gq.k + mr.range(-2, 6), mr.range(3, 9) * plumeK ** 0.5, mr.range(4, 10), 0.13 * thick); }
      for (let i = 0; i < Math.round(22 * det); i++) {
        const k = mr.range(160, 600), x = rivX(k) + mr.range(-55, 55) * (1 - 0.7 * smoothstep(300, 600, k));
        add(x, FLOOR + mr.range(4, 16), k, mr.range(22, 46), 0, mr.range(0.1, 0.2) * thick);
      }
      for (let i = 0; i < 9; i++) add(PG.x + mr.range(-24, -3), PG.y - mr.range(15, 36), PG.k + mr.range(4, 34), mr.range(8, 14), 0, 0.15 * thick);   // the fall's mist, risen as high as the ring: behind it and below, never in front
      for (let i = 0; i < 6; i++) add(cxAt(620) + mr.range(-40, 40), FLOOR + mr.range(10, 50), mr.range(560, 720), mr.range(55, 80), 0, 0.22);
      const mp2 = [], mq2 = [], mp3 = [], mq3 = [];
      { // the fall's own spray in the moon: bright puffs that rise off the falling water beside the first of the glide (they
        // thin away near the lens, and none stands in the flight's way)
        const sr = makeRng('false-stars-spray:' + (ctx.seed ?? 0));
        for (let i = 0; i < 16; i++) {
          const t = sr.range(1.5, 3.7); plumeAt(t, p); const gq = toG(p), x = gq.x + sr.range(-3.5, 2.5), y = gq.y + sr.range(-2, 2.5), k = gq.k + sr.range(-2, 4), rad = sr.range(3.2, 6.2) * (0.8 + 0.12 * t);
          W(x, y, k, p); if (path.distanceTo(p.x, p.y, p.z) < rad * 1.5 + 5) continue;
          mp3.push(p.x, p.y, p.z); mq3.push(rad, sr(), sr.range(3, 6), 0.2);
        }
      }
      { // and a bank of it to the right of the ring and below it, as seen from the last of the glide, where the moon lies on it:
        // what the ruru crosses is the brightest mist in the frame
        const e0 = path.posAtDist(0.86 * path.length, new V3()), dR = portalPos.clone().sub(e0).normalize(), rR = new V3().crossVectors(dR, new V3(0, 1, 0)).normalize(), uR = new V3().crossVectors(rR, dR), q = new V3();
        for (const [th, ph, rg, rad, op] of [[19, -14, 60, 9, 0.5], [26, -15.5, 63, 10.5, 0.58], [33.5, -14.5, 62, 9.5, 0.52], [23, -19, 57, 8.5, 0.42], [30.5, -19.5, 59, 8.5, 0.42]]) {   // (one bank, its puffs well overlapped: no holes in it)
          const a = th * RAD, b = ph * RAD; q.copy(e0).addScaledVector(dR, rg * Math.cos(a) * Math.cos(b)).addScaledVector(rR, rg * Math.sin(a) * Math.cos(b)).addScaledVector(uR, rg * Math.sin(b));
          mp2.push(q.x, q.y, q.z); mq2.push(rad, mr(), 0, op);
        }
      }
      const g = quadInstanced(mq.length / 4, { iPos: [mp, 3], iPar: [mq, 4] });
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { uTime: OU.uTime, uMoonDir: OU.uMoonDir, uMoonCol: OU.uMoonCol, uAmbCol: OU.uAmbCol, uMistCol: OU.uMistCol, uOutGain: OU.uOutGain, uFoot: OU.uFoot, uOp: { value: 1 }, uDrift: { value: new V3().addScaledVector(fH, 0.8).addScaledVector(rH, 0.25) } } }));
      m.frustumCulled = false; m.renderOrder = 4; m.name = 'mist'; outside.add(m);
      const m2 = new THREE.Mesh(quadInstanced(mq2.length / 4, { iPos: [mp2, 3], iPar: [mq2, 4] }), new THREE.ShaderMaterial({ vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { uTime: OU.uTime, uMoonDir: OU.uMoonDir, uMoonCol: OU.uMoonCol, uAmbCol: OU.uAmbCol, uMistCol: { value: mistCol.clone().multiplyScalar(lookId === 'dawn' ? 1.9 : lookId === 'moonless' ? 3.3 : 2.2).add(moonCol.clone().multiplyScalar(0.035)) }, uOutGain: OU.uOutGain, uFoot: OU.uFoot, uOp: bankOp, uDrift: { value: new V3().addScaledVector(fH, 0.5).addScaledVector(rH, 0.15) } } }));
      m2.frustumCulled = false; m2.renderOrder = 4; m2.name = 'mist-moonlit'; outside.add(m2);
      if (mq3.length) {                                               // the spray: the same bright mist, always there
        const m3 = new THREE.Mesh(quadInstanced(mq3.length / 4, { iPos: [mp3, 3], iPar: [mq3, 4] }), new THREE.ShaderMaterial({ vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
          blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
          uniforms: { uTime: OU.uTime, uMoonDir: OU.uMoonDir, uMoonCol: OU.uMoonCol, uAmbCol: OU.uAmbCol, uMistCol: m2.material.uniforms.uMistCol, uOutGain: OU.uOutGain, uFoot: OU.uFoot, uOp: { value: 1 }, uDrift: { value: new V3().addScaledVector(fH, 0.5).addScaledVector(rH, 0.15) } } }));
        m3.frustumCulled = false; m3.renderOrder = 4; m3.name = 'fall-spray'; outside.add(m3);
      }
    }
    const deckOn = weather === 'cloudsea' || weather === 'brim', deckY = lip.y + cloudY, deckVeil = weather === 'brim' ? 0.14 : 0.0;
    if (deckOn) { // the cloud floor: two sheets of drifting billows that thin away before they reach either wall, torn open in gaps and
      // hollowed over the pool where the fall punches through; cloud heads stand out of it and bank up along the walls
      const brim = weather === 'brim', NXD = 58, NKD = 84, pp = [], la = [], ed = [], idx = [], p = new V3();
      for (let layer = 0; layer < 2; layer++) {
        const yl = cloudY + layer * 7, b0 = pp.length / 3;
        for (let j = 0; j <= NKD; j++) {
          const k = 2 + 1100 * Math.pow(j / NKD, 1.7), cx = cxAt(k);
          for (let i = 0; i <= NXD; i++) {
            const a = (i / NXD) * 2 - 1, x = cx + Math.sign(a) * (120 * Math.abs(a) + 110 * a * a);
            W(x, yl, k, p); pp.push(p.x, p.y, p.z); la.push(layer); ed.push(yl - hAt(x, k));
          }
          if ((j & 7) === 7) await ctx.yield();
        }
        for (let j = 0; j < NKD; j++) for (let i = 0; i < NXD; i++) { const q = b0 + j * (NXD + 1) + i, r = q + NXD + 1; idx.push(q, r, q + 1, q + 1, r, r + 1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('aLayer', new THREE.Float32BufferAttribute(la, 1));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(ed, 1)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
      const HG = [PG.x + 2, PG.k - 8, -10, 104], holeR = brim ? 30 : 27;     // the hollow runs from the plume's foot to under the ring
      const shadeCol = lin('#3f66b0', brim ? 0.1 : 0);
      const hole = W(HG[0], 0, HG[1], new V3()), hole2 = W(HG[2], 0, HG[3], new V3()), drift = new V3().addScaledVector(fH, 0.8).addScaledVector(rH, 0.25);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: DECK_VERT, fragmentShader: DECK_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: outU({ uDeck: { value: new THREE.Vector4(0.96, holeR, 0.0, brim ? 0.92 : 1.0) }, uHole: { value: hole }, uHole2: { value: hole2 }, uDrift: { value: drift }, uGap: { value: brim ? 0.0 : 1.0 }, uShade: { value: shadeCol } }) }));
      m.frustumCulled = false; m.renderOrder = 1.5; m.name = 'cloud-floor'; outside.add(m);
      await ctx.yield();
      const hr = tr.fork('cloud-heads'), heads = [];
      const clearAt = (x, k) => cloudY - hAt(x, k);
      // how far a head stands from the nearer wall at its own height, and how fast the wall leans away above it: its card fades
      // out before that plane (toward the wall in world x, z; metres of air; metres per metre of height)
      const wallT = (side, k, yy) => { const cx = cxAt(k); let lo = 0, hi = 260; if (hAt(cx + side * hi, k) < yy) return hi; for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (hAt(cx + side * mid, k) < yy) lo = mid; else hi = mid; } return lo; };
      const wallOf = (x, y, k, hh) => {
        const cx = cxAt(k), side = x < cx ? -1 : 1, off = (x - cx) * side;
        const d0 = wallT(side, k, y) - off - 2.5, d1 = wallT(side, k, y - hh) - off - 2.5;
        return [rH.x * side, rH.z * side, d0, clamp((d0 - d1) / Math.max(hh, 1), 0, 3)];
      };
      const holeD = (x, k) => { const bx = HG[0] - HG[2], bk = HG[1] - HG[3], t = clamp(((x - HG[2]) * bx + (k - HG[3]) * bk) / (bx * bx + bk * bk), 0, 1); return Math.hypot(x - HG[2] - bx * t, k - HG[3] - bk * t); };
      for (const side of [-1, 1]) for (let k = 6 + hr.range(0, 6); k < 560; k += hr.range(6, 11) * (1 + k / 450)) {
        const cx = cxAt(k); let lo = 0, hi = 230;                                   // walk out from mid-gorge to where the sea has 8 m of air under it
        if (clearAt(cx + side * hi, k) > 8) continue;
        for (let it = 0; it < 11; it++) { const mid = (lo + hi) / 2; if (clearAt(cx + side * mid, k) > 8) lo = mid; else hi = mid; }
        const rad = hr.range(8, 15) * (1 + k / 600), x = cx + side * (lo - rad * hr.range(0.15, 0.5)), y = cloudY + hr.range(-1, 4), seed = hr(), sq = hr.range(0.55, 0.8);
        W(x, y, k, p); if (path.distanceTo(p.x, p.y, p.z) < rad + 12 || holeD(x, k) < holeR * 0.8) continue;
        heads.push([p.x, p.y, p.z, rad, seed, sq, 0.86, k, ...wallOf(x, y, k, rad * sq)]);
      }
      await ctx.yield();
      for (let i = 0, n = 0, want = Math.round(84 * det); i < 500 && n < want; i++) {
        const k = 18 + 540 * Math.pow(hr(), 1.2), x = cxAt(k) + hr.range(-1, 1) * 88, rad = hr.range(12, 26) * (1 + k / 900), seed = hr(), sq = hr.range(0.5, 0.72), up = hr.range(0.1, 0.3);
        if (clearAt(x, k) < 16 || holeD(x, k) < rad * 0.7 + holeR * 0.9) continue;
        W(x, cloudY + rad * up, k, p); if (path.distanceTo(p.x, p.y, p.z) < rad + 14) continue;
        heads.push([p.x, p.y, p.z, rad, seed, sq, 0.9, k, ...wallOf(x, cloudY + rad * up, k, rad * sq)]); n++;
        if ((i & 63) === 63) await ctx.yield();
      }
      for (let i = 0; i < 9; i++) {                                       // a rank of heads standing to the right of the last straight, each a body with a lit side
        const k = PG.k - 64 + i * 24 + hr.range(-5, 5), x = PG.x + 40 + ((i * 37) % 31) + hr.range(-4, 4), rad = hr.range(15, 23), seed = hr(), sq = hr.range(0.55, 0.72);
        if (clearAt(x, k) < 12) continue;
        W(x, cloudY + rad * 0.22, k, p); if (path.distanceTo(p.x, p.y, p.z) < rad + 14) continue;
        heads.push([p.x, p.y, p.z, rad, seed, sq, 0.92, k, ...wallOf(x, cloudY + rad * 0.22, k, rad * sq)]);
      }
      heads.sort((a, b) => b[7] - a[7]);                                           // far to near, as seen from the cliff
      const hp = [], hq = [], hw4 = []; for (const h of heads) { hp.push(h[0], h[1], h[2]); hq.push(h[3], h[4], h[5], h[6]); hw4.push(h[8], h[9], h[10], h[11]); }
      const hm = new THREE.Mesh(quadInstanced(heads.length, { iPos: [hp, 3], iPar: [hq, 4], iWall: [hw4, 4] }), new THREE.ShaderMaterial({ vertexShader: HEAD_VERT, fragmentShader: HEAD_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { uTime: OU.uTime, uMoonDir: OU.uMoonDir, uMoonCol: OU.uMoonCol, uAmbCol: OU.uAmbCol, uMistCol: OU.uMistCol, uMist: OU.uMist, uOutGain: OU.uOutGain, uDrift: { value: drift }, uHeadK: { value: brim ? 0.92 : 1.0 }, uShade: { value: shadeCol } } }));
      hm.frustumCulled = false; hm.renderOrder = 1.8; hm.name = 'cloud-heads'; outside.add(hm);
    }
    await ctx.yield();

    // ---------------- forest: canopy crowns over the floor and ledges; tree ferns (green stars), nikau; rimu on the rims
    const slopeAt = (x, k) => Math.hypot(hAt(x + 3, k) - hAt(x - 3, k), hAt(x, k + 3) - hAt(x, k - 3)) / 6;
    const tmpP = new V3();
    const clearOf = (x, y, k, r) => { W(x, y, k, tmpP); return path.distanceTo(tmpP.x, tmpP.y, tmpP.z) > r + 7; };
    const frost = season === 'winter' ? 1 : 0;
    const canopyMat = (lump) => new THREE.ShaderMaterial({ vertexShader: CANOPY_VERT, fragmentShader: CANOPY_FRAG, side: lump ? THREE.DoubleSide : THREE.FrontSide, uniforms: outU({ uLump: { value: lump }, uFoot: OU.uFoot, uFrost: { value: lump ? frost * 0.35 : frost } }) });
    {
      const cr = rng.fork('canopy'), ip = [], is = [], ic = [], want = Math.round(1180 * det);
      const cA = new THREE.Color(0.05, 0.155, 0.12), cB = new THREE.Color(0.10, 0.155, 0.06), cC = new THREE.Color(0.035, 0.13, 0.15), c = new THREE.Color();
      let n = 0;
      for (let i = 0; i < want * 6 && n < want; i++) {
        if ((i & 15) === 15) await ctx.yield();
        const k = 10 + 650 * Math.pow(cr(), 1.35), x = cxAt(k) + cr.gauss() * 85;
        if (Math.abs(x) > 300) continue;
        const y = hT(x, k); if (y < FLOOR + 0.7) continue;
        const sl = slopeAt(x, k); if (sl > 0.62 || (sl > 0.4 && cr() < 0.5)) continue;       // never on the cliff: crowns there hung in the air
        const R = lerp(2.7, 9.6, Math.pow(cr(), 1.6)) * (1 + k / 900);                    // crowns of mixed sizes: many small, a few broad
        if (!clearOf(x, y + R * 0.4, k, R * 1.15 + 10)) continue;
        if (k > POOL.k - 6 && Math.abs(x - rivX(k)) < 7.5 + R * 1.1) continue;             // the river keeps an open lane of sky: from the glide it is a silver thread through the bush
        W(x, y + R * (0.22 - 0.3 * sl), k, tmpP); ip.push(tmpP.x, tmpP.y, tmpP.z);
        is.push(R * cr.range(0.9, 1.3), R * cr.range(0.6, 0.95), R * cr.range(0.9, 1.3), cr.range(0, TAU));
        c.copy(cA).lerp(cr() < 0.5 ? cB : cC, cr() * 0.8).multiplyScalar(cr.range(0.75, 1.5));
        ic.push(c.r, c.g, c.b, shadeAt(x, y + R, k)); n++;
      }
      for (let i = 0, nb = 0, wantB = Math.round(70 * det); i < wantB * 30 && nb < wantB; i++) {     // bush standing on the deeper ledges of both walls
        if ((i & 31) === 31) await ctx.yield();
        const side = cr() < 0.75 ? 1 : -1, k = PK0 + 8 + (PK1 - 50 - PK0) * cr(), d = cr.range(3, 56), x = cxAt(k) + side * (hwAt(k, side) + d);
        const y = hT(x, k, TI), tq = TI.q - 1;
        if (TI.tread < 0.5 || TI.amp < 0.45 || TI.tw < 2.2 || tq < 0.3 || tq > 0.8) continue;
        const R = Math.min(3.4, TI.tw * cr.range(0.5, 0.75));
        if (!clearOf(x, y + R * 0.4, k, R + 6)) continue;
        W(x, y + R * 0.3, k, tmpP); ip.push(tmpP.x, tmpP.y, tmpP.z);
        is.push(R * cr.range(0.9, 1.3), R * cr.range(0.6, 0.9), R * cr.range(0.9, 1.3), cr.range(0, TAU));
        c.copy(cA).lerp(cr() < 0.5 ? cB : cC, cr() * 0.8).multiplyScalar(cr.range(0.75, 1.4));
        ic.push(c.r, c.g, c.b, shadeAt(x, y + R, k)); n++; nb++;
      }
      const m = new THREE.Mesh(instanced(new THREE.IcosahedronGeometry(1, 1), n, { iPos: [ip, 3], iScl: [is, 4], iCol: [ic, 4] }), canopyMat(1));
      m.frustumCulled = false; m.name = 'canopy'; outside.add(m);
    }
    await ctx.yield();
    {
      const fr = rng.fork('ferns'), ip = [], iq = [], ic = [], il = [], c = new THREE.Color();
      const KINDS = {
        mamaku: { R: [3.2, 4.0], trunk: [9, 17], lift: 0, silver: 0.15, col: [0.07, 0.23, 0.11] },
        ponga: { R: [2.2, 2.9], trunk: [4, 8], lift: 0.05, silver: 1, col: [0.08, 0.21, 0.14] },
        wheki: { R: [1.6, 2.1], trunk: [3, 6], lift: 0.12, silver: 0.3, col: [0.06, 0.17, 0.08] },
        nikau: { R: [2.5, 3.1], trunk: [8, 12], lift: 1, silver: 0.2, col: [0.06, 0.19, 0.085] },
      };
      const plant = (kind, x, k, lean, force, big = 1) => {
        const K = KINDS[kind], y = hT(x, k);
        if (!force && (y < FLOOR + 0.6 || slopeAt(x, k) > 1.0)) return false;
        const R = fr.range(K.R[0], K.R[1]) * big; let th = fr.range(K.trunk[0], K.trunk[1]) * (big > 1 ? 1.15 : 1), ok = false;
        for (let a = 0; a < 5 && !ok; a++) { if (clearOf(x, y + th + R * 0.3, k, R)) ok = true; else th *= 0.66; }
        if (!ok || th < 1.6) return false;
        W(x, y + th, k, tmpP); ip.push(tmpP.x, tmpP.y, tmpP.z); iq.push(R, th + 1, K.lift, fr());
        c.setRGB(K.col[0], K.col[1], K.col[2]).multiplyScalar(fr.range(0.8, 1.45)); c.g *= fr.range(0.9, 1.15);
        ic.push(c.r, c.g, c.b, shadeAt(x, y + th, k)); il.push(lean ? lean[0] : fr.range(-0.06, 0.06), lean ? lean[1] : fr.range(-0.06, 0.06), K.silver);
        return true;
      };
      const pickKind = () => { const r = fr(); return r < 0.46 ? 'mamaku' : r < 0.76 ? 'ponga' : r < 0.9 ? 'wheki' : 'nikau'; };
      // the ring of crowns under the portal, and two leaning nikau on the moonlit buttress to its right
      for (let i = 0, n = 9 + fr.int(0, 3); i < n; i++) { const a = (i / n) * TAU + fr.range(-0.2, 0.2), rr = fr.range(10.5, 15.5); plant(i % 3 ? 'mamaku' : 'ponga', PG.x + Math.cos(a) * rr, PG.k + 10 + Math.sin(a) * rr * 0.9); }
      plant('nikau', BUT.x - 2.2, BUT.k + 1.5, [0.3 * rH.x - 0.1 * fH.x, 0.3 * rH.z - 0.1 * fH.z].map((v) => -v), true);
      plant('nikau', BUT.x + 2.6, BUT.k - 2.0, [-0.12 * rH.x - 0.22 * fH.x, -0.12 * rH.z - 0.22 * fH.z], true);
      const nearN = 170, farN = Math.round(330 * det), glideN = 170;
      await ctx.yield();
      for (let i = 0, n = 0; i < nearN * 5 && n < nearN; i++) {            // thick round the pool and the banks below the dive
        const a = fr.range(0, TAU), rr = POOL.r + 2 + 75 * Math.pow(fr(), 1.3);
        const x = POOL.x + 8 + Math.cos(a) * rr * 1.1, k = POOL.k + 6 + Math.sin(a) * rr;
        if (k < 14) continue;
        if (plant(pickKind(), x, k)) n++;
        if ((i & 15) === 15) await ctx.yield();
      }
      { // and through the canopy under the last third of the glide (what lies under the bow as we come down on the ring): tall
        // mamaku and nikau standing clear of the crowns, each a star or a shuttlecock from above, across the whole floor
        const gr2 = makeRng('false-stars-glide-ferns:' + (ctx.seed ?? 0));
        for (let i = 0, n = 0; i < glideN * 6 && n < glideN; i++) {
          const k = PG.k - 14 + 150 * Math.pow(gr2(), 0.85), off = gr2.sign() * gr2.range(9, 84), x = rivX(k) + off, r = gr2();
          if (plant(r < 0.56 ? 'mamaku' : r < 0.8 ? 'nikau' : 'ponga', x, k, null, false, 1.28)) n++;
          if ((i & 15) === 15) await ctx.yield();
        }
      }
      for (let i = 0, n = 0; i < farN * 5 && n < farN; i++) {
        const k = 60 + 520 * fr(), x = rivX(k) + fr.sign() * fr.range(9, 70) * (1 - 0.6 * smoothstep(300, 600, k));
        if (plant(pickKind(), x, k)) n++;
        if ((i & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
      const n = iq.length / 4;
      const m = new THREE.Mesh(instanced(fernCrownGeometry(), n, { iPos: [ip, 3], iPar: [iq, 4], iCol: [ic, 4], iLean: [il, 3] }),
        new THREE.ShaderMaterial({ vertexShader: FERN_VERT, fragmentShader: FERN_FRAG, side: THREE.DoubleSide, uniforms: outU({ uFoot: OU.uFoot }) }));
      m.frustumCulled = false; m.name = 'tree-ferns'; outside.add(m);
      await ctx.yield();
      // cliff ferns: hound's-tongue and kidney ferns in tufts on the ledges, most of them at the lip where they hang over the
      // face below (thick on the moonlit wall, thinner on the dark one)
      const cf = rng.fork('cliff-ferns'), cp = [], cq = [], cc = [], cl = [];
      for (let i = 0, n = 0, want = Math.round(720 * det); i < want * 16 && n < want; i++) {
        if ((i & 31) === 31) await ctx.yield();
        const side = cf() < 0.74 ? 1 : -1, k = PK0 + 6 + (PK1 - 40 - PK0) * Math.pow(cf(), 1.3), d = cf.range(2, 57), x = cxAt(k) + side * (hwAt(k, side) + d);
        const y = hT(x, k, TI), tq = TI.q - 1;
        if (TI.tread < 0.5 || TI.amp < 0.3 || tq > (cf() < 0.7 ? 0.38 : 0.9)) continue;
        if (y > 44 || y < FLOOR + 6 || !clearOf(x, y, k, 4)) continue;
        const R = cf.range(1.3, 2.9) * (0.75 + 0.25 * Math.min(1.6, TI.tw / 2));
        W(x - side * (TI.out + 0.3), y + 0.3, k, tmpP); cp.push(tmpP.x, tmpP.y, tmpP.z); cq.push(R, 0.8, cf.range(-0.4, -0.15), cf());
        const b = cf.range(0.8, 1.5); cc.push(0.05 * b, 0.165 * b * cf.range(0.9, 1.15), 0.085 * b, shadeAt(x, y + 1, k)); cl.push(0, 0, 0.45);
        n++;
      }
      const mc = new THREE.Mesh(instanced(fernCrownGeometry(7, 3, false), cq.length / 4, { iPos: [cp, 3], iPar: [cq, 4], iCol: [cc, 4], iLean: [cl, 3] }), m.material);
      mc.frustumCulled = false; mc.name = 'cliff-ferns'; outside.add(mc);
    }
    await ctx.yield();
    { // rimu: tall emergents standing above everything on the rims, their foliage weeping in tiers of drooping sprays
      const rr = rng.fork('rimu'), mb = mesher();
      mb.tube([new V3(0, 0, 0), new V3(0.008, 0.5, 0.004), new V3(0, 1, 0)], [0.02, 0.012, 0.003], 5, -1);
      const TIERS = 7, SD = 6;
      for (let t = 0; t < TIERS; t++) {
        const h = 0.5 + 0.48 * (t / (TIERS - 1)), spread = 0.15 * Math.pow(Math.sin(Math.PI * clamp((h - 0.4) / 0.64, 0.06, 0.94)), 0.6) + 0.02, nb = t === TIERS - 1 ? 1 : 3, a0 = rr.range(0, TAU);   // a bare bole, then a rounded, irregular head
        for (let j = 0; j < nb; j++) {
          const a = a0 + (j / nb) * TAU + rr.range(-0.5, 0.5), ca = Math.cos(a), sa = Math.sin(a), off = spread * rr.range(0.45, 1.0) * (nb === 1 ? 0 : 1);
          const drop = rr.range(0.13, 0.21) * (1.1 - 0.3 * h), rad = rr.range(0.065, 0.1) * (1.15 - 0.3 * h) * (nb === 1 ? 1.25 : 1), hh = h + rr.range(-0.035, 0.035);
          const apex = mb.v(ca * off * 0.25, hh + 0.025, sa * off * 0.25, 0), r1 = [], r2 = [];
          for (let m = 0; m < SD; m++) {
            const b = (m / SD) * TAU, cb = Math.cos(b), sb = Math.sin(b), jr = rr.range(0.8, 1.2);
            r1.push(mb.v(ca * off * 0.7 + cb * rad * 0.72, hh - drop * 0.22, sa * off * 0.7 + sb * rad * 0.72, 0.4));
            r2.push(mb.v(ca * off + cb * rad * jr, hh - drop * rr.range(0.8, 1.15), sa * off + sb * rad * jr, 1));
          }
          for (let m = 0; m < SD; m++) { const m1 = (m + 1) % SD; mb.tri(apex, r1[m1], r1[m]); mb.quad(r1[m], r1[m1], r2[m1], r2[m]); }
        }
      }
      const ip = [], is = [], ic = [];
      for (const side of [-1, 1]) for (let k = 12 + rr.range(0, 10); k < 600; k += rr.range(8, 19)) {
        const pinch = smoothstep(260, 610, k), x = cxAt(k) + side * (lerp(74, 9, pinch) + lerp(52, 135, pinch) * rr.range(0.98, 1.3)), y = hT(x, k), H = rr.range(31, 46);
        W(x, y - 1, k, tmpP); ip.push(tmpP.x, tmpP.y, tmpP.z); is.push(H * rr.range(1.0, 1.25), H, H * rr.range(1.0, 1.25), rr.range(0, TAU));
        const b = rr.range(0.9, 1.5); ic.push(0.035 * b, 0.075 * b, 0.045 * b, shadeAt(x, y + H * 0.7, k));
      }
      // Three giants on the banks beyond the pool: their heads reach the ring, which hangs just over them (they stand beyond
      // it and to either side: the flight never comes within twenty metres of one). They are the nearest solid things in the
      // exit frame and are seen from above, so they are built finer than the rim's trees: fifteen whorls of five drooping
      // branches, each an arched spine from which a curtain of foliage hangs on either side, splayed a little, its lower
      // half eaten into hanging strands by the shader. From above a branch is a narrow ragged frond, not a dome; from the
      // side the curtains weep in tiers with the trunk showing between them.
      const gp = [], gs = [], gc = [];
      for (const [dk, off] of [[14, 25], [4, -27], [44, 19]]) {
        const k = PG.k + dk, x = rivX(k) + off, y = hT(x, k), H = PG.y - 13 - y + rr.range(-4, 1);
        W(x, y - 1, k, tmpP); if (path.distanceTo(tmpP.x, tmpP.y + H, tmpP.z) < 17) continue;
        gp.push(tmpP.x, tmpP.y, tmpP.z); gs.push(H * rr.range(0.95, 1.1), H, H * rr.range(0.95, 1.1), rr.range(0, TAU));
        const b = rr.range(1.0, 1.5) * 1.5; gc.push(0.035 * b, 0.078 * b, 0.047 * b, shadeAt(x, y + H * 0.7, k));
      }
      const gr = makeRng('false-stars-giants:' + (ctx.seed ?? 0)), gb = mesher(), GT = 15, GSEG = 5;
      gb.tube([new V3(0, 0, 0), new V3(0.006, 0.5, 0.003), new V3(0, 1, 0)], [0.021, 0.012, 0.003], 6, -1);
      for (let t = 0; t < GT; t++) {
        const h = 0.4 + 0.585 * (t / (GT - 1)), prof = Math.pow(Math.sin(Math.PI * clamp((h - 0.34) / 0.68, 0.05, 0.97)), 0.7), nb = t >= GT - 2 ? 3 : 5, a0 = gr.range(0, TAU);
        for (let j = 0; j < nb; j++) {
          const a = a0 + (j / nb) * TAU + gr.range(-0.35, 0.35), ca = Math.cos(a), sa = Math.sin(a);
          const len = (0.035 + 0.125 * prof) * gr.range(0.7, 1.15), drop = (0.05 + 0.055 * prof) * gr.range(0.8, 1.25), hh = h + gr.range(-0.012, 0.012), lift = gr.range(0.1, 0.35), rows = [];
          for (let q = 0; q <= GSEG; q++) {
            const u = q / GSEG, r = len * (0.06 + 0.94 * u), y = hh + len * (lift * u - 0.62 * u * u), x = ca * r, z = sa * r;
            const w = len * (0.05 + 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.1))), dk = drop * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)));
            const row = [gb.v(x, y, z, 0)];
            for (const sd of [-1, 1]) {
              const j1 = gr.range(0.8, 1.25);
              row.push(gb.v(x - sa * sd * w * 0.6, y - dk * 0.42, z + ca * sd * w * 0.6, 0.45), gb.v(x - sa * sd * w + ca * dk * 0.08, y - dk * j1, z + ca * sd * w + sa * dk * 0.08, 1));
            }
            rows.push(row);
          }
          for (let q = 0; q < GSEG; q++) { const Ar = rows[q], Br = rows[q + 1]; gb.quad(Ar[0], Br[0], Br[1], Ar[1]); gb.quad(Ar[1], Br[1], Br[2], Ar[2]); gb.quad(Br[0], Ar[0], Ar[3], Br[3]); gb.quad(Br[3], Ar[3], Ar[4], Br[4]); }
        }
      }
      await ctx.yield();
      const rimuMat = (str) => new THREE.ShaderMaterial({ vertexShader: RIMU_VERT, fragmentShader: RIMU_FRAG, side: THREE.DoubleSide, uniforms: outU({ uFrost: { value: frost }, uStr: { value: new V3(str[0], str[1], str[2]) } }) });
      const m = new THREE.Mesh(instanced(mb.geometry('aS', 1), is.length / 4, { iPos: [ip, 3], iScl: [is, 4], iCol: [ic, 4] }), rimuMat([1.0, 1.05, 0.22]));
      m.frustumCulled = false; m.name = 'rimu'; outside.add(m);
      if (gs.length) {
        const mg = new THREE.Mesh(instanced(gb.geometry('aS', 1), gs.length / 4, { iPos: [gp, 3], iScl: [gs, 4], iCol: [gc, 4] }), rimuMat([2.3, 1.25, 0.33]));
        mg.frustumCulled = false; mg.name = 'rimu-giants'; outside.add(mg);
      }
    }
    await ctx.yield();

    // ---------------- small lights: worms on the shaded left wall, the placed real stars, mayflies, spray beads
    const res = new THREE.Vector2(800, 450), uRes = { value: res };
    const sprites = (name, n, attrs, move, o) => {
      const mat = new THREE.ShaderMaterial({ vertexShader: o.vert || spriteVert(move), fragmentShader: o.frag || SPRITE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uRes, uTime: OU.uTime, uPx: { value: new THREE.Vector3(o.px[0], o.px[1], o.px[2] ?? 0.06) }, uBright: { value: o.bright }, uColA: { value: new THREE.Color().setRGB(...o.a) }, uColB: { value: new THREE.Color().setRGB(...o.b) } } });
      const m = new THREE.Mesh(quadInstanced(n, attrs), mat); m.frustumCulled = false; m.renderOrder = 5; m.name = name; return m;
    };
    const wormCol = hero.uniforms.uWormCol.value;
    { // 600 worms on the wall the moon never reaches
      const wr = rng.fork('outworms'), ip = [], iq = [];
      for (let i = 0; i < 4000 && iq.length < 2400; i++) {
        if (i % 500 === 499) await ctx.yield();
        const k = 5 + 330 * Math.pow(wr(), 1.3), t = 0.02 + 0.55 * wr(), pinch = smoothstep(260, 610, k);
        const x = cxAt(k) - (lerp(74, 9, pinch) + lerp(52, 135, pinch) * t);
        if (noise.n2(k * 0.035 + so, t * 5.0) + 0.5 * noise.n2(k * 0.11, t * 15 + so) < 0.05) continue;
        if (deckOn && hAt(x, k) < cloudY + 9) continue;                    // no light shows through the cloud floor
        W(x + 0.7, hT(x, k) + 0.6, k, tmpP); ip.push(tmpP.x, tmpP.y, tmpP.z); const r = wr(); iq.push(0.16 + 0.3 * r * r, wr(), 0, 0);
      }
      const m = sprites('wall-worms', iq.length / 4, { iPos: [ip, 3], iPar: [iq, 4] }, MOVE_WORM, { px: [1.1, 0.006], bright: 2.6, a: [wormCol.r * 0.85, wormCol.g, wormCol.b], b: [wormCol.r, wormCol.g * 0.95, wormCol.b * 1.1] });
      outside.add(m);
    }
    await ctx.yield();
    { // and colonies under the overhangs of the moonlit wall beside the glide: lights in the hollow under each bed's nose
      const wr = makeRng('false-stars-ledgeworms:' + (ctx.seed ?? 0)), ip = [], iq = [];
      for (let i = 0; i < 9000 && iq.length < 3600; i++) {
        if (i % 250 === 249) await ctx.yield();
        const k = 14 + 215 * Math.pow(wr(), 1.2), d = wr.range(1.5, 52), x = cxAt(k) + hwAt(k, 1) + d;
        if (noise.n2(k * 0.045 + so * 3, d * 0.07) + 0.4 * noise.n2(k * 0.15, d * 0.21 + so) < 0.12) continue;
        const y = hT(x, k, TI);
        if (TI.tread > 0.5 || TI.amp < 0.5 || TI.q < 0.08 || TI.q > 0.5) continue;
        if (deckOn && y < cloudY + 9) continue;
        W(x - TI.out - 0.35, y, k, tmpP); if (path.distanceTo(tmpP.x, tmpP.y, tmpP.z) < 5) continue;
        ip.push(tmpP.x, tmpP.y, tmpP.z); const r = wr(); iq.push(0.15 + 0.28 * r * r, wr(), 0, 0);
      }
      const m = sprites('ledge-worms', iq.length / 4, { iPos: [ip, 3], iPar: [iq, 4] }, MOVE_WORM, { px: [1.1, 0.006], bright: 2.2, a: [wormCol.r * 0.85, wormCol.g, wormCol.b], b: [wormCol.r, wormCol.g * 0.95, wormCol.b * 1.1] });
      outside.add(m);
    }
    await ctx.yield();
    const skyStuff = new THREE.Group(); skyStuff.name = 'placed-stars'; outside.add(skyStuff);
    {
      const sr = rng.fork('stars'), ip = [], iq = [], SR = 2500;
      const dirOf = (az, el, out = new V3()) => out.set(0, 0, 0).addScaledVector(fH, Math.cos(az * RAD) * Math.cos(el * RAD)).addScaledVector(rH, Math.sin(az * RAD) * Math.cos(el * RAD)).setY(Math.sin(el * RAD));
      const star = (az, el, mag) => { dirOf(az, el, tmpP); ip.push(tmpP.x * SR, tmpP.y * SR, tmpP.z * SR); iq.push(4, sr(), mag, 0); };
      // the Pointers low, the Cross above them (lowered a little from the true sky so the frame holds them), Carina up the band
      for (const s of [[-12.5, 12.6, 1.0], [-8.2, 15.8, 0.8], [-1.0, 20.6, 0.9], [2.3, 24.4, 0.75], [-1.9, 26.8, 0.7], [-4.6, 23.9, 0.5], [-2.7, 22.7, 0.3],
        [3.4, 33.5, 0.55], [6.5, 40.5, 0.85], [-4.2, 37.6, 0.45], [1.2, 46.5, 0.5], [9.2, 29.6, 0.4], [-9.5, 31.5, 0.35]]) star(...s);
      for (let i = 0; i < 26; i++) star(sr.range(-80, 80), sr.range(7, 62), sr.range(0.2, 0.5));
      skyStuff.add(sprites('stars', iq.length / 4, { iPos: [ip, 3], iPar: [iq, 4] }, MOVE_STAR, { px: [1.25, 0.0042], bright: 3.2 * (0.55 + 0.45 * LK.stars), a: [1, 1, 1], b: [0.78, 0.86, 1] }));
      const blob = (az, el, deg, rgb, alpha, order) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VEIL_VERT, transparent: true, depthWrite: false, premultipliedAlpha: true,
          blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { uC: { value: new THREE.Vector4(rgb[0], rgb[1], rgb[2], alpha) } },
          fragmentShader: `uniform vec4 uC; varying vec2 vUV; ${GL_NOISE} void main(){ float r2=dot(vUV,vUV); float n=vn3(vec3(vUV*2.3,uC.a*9.0)); float a=1.0-smoothstep(0.0,1.0,r2+0.7*(n-0.5)); a*=a*(1.0-smoothstep(0.7,1.0,r2)); gl_FragColor=vec4(uC.rgb*a,uC.a*a); }` }));
        dirOf(az, el, m.position).multiplyScalar(SR * (order ? 0.98 : 1.02)); m.scale.setScalar(SR * Math.tan(deg * RAD)); m.lookAt(0, 0, 0); m.renderOrder = order ? 5 : 1; m.frustumCulled = false; skyStuff.add(m);
      };
      blob(2.6, 21.2, 3.4, [0, 0, 0], 0.72 * Math.min(1, LK.milky), 0);                                                    // the Coalsack: a hole beside the Cross
      const mk = lookId === 'moonless' ? 2.2 : 1;
      blob(33, 26, 4.6, [0.012 * mk * LK.stars, 0.016 * mk * LK.stars, 0.024 * mk * LK.stars], 0, 1);   // both Magellanic Clouds, high on the right
      blob(24, 16.5, 2.6, [0.014 * mk * LK.stars, 0.018 * mk * LK.stars, 0.026 * mk * LK.stars], 0, 1);
    }
    await ctx.yield();
    const flyBright = rare ? 0.6 : 0.85;
    // seen through the previous world's portal the Chandelier is a few pixels of sprites: a soft halo round it and round its
    // reflection gathers them into the hourglass. It is only lit while we are outside looking in (see update: thru).
    const halo = sprites('chandelier-halo', 2, { iPos: [[0, A.chandelier.position.y, 0, 0, -A.chandelier.position.y, 0], 3], iPar: [[2.6, 0.3, 0, 0, 2.6, 0.7, 0, 0], 4] }, 'br=1.0;',
      { px: [1.0, 0.5, 1.0], bright: 0, a: [wormCol.r, wormCol.g, wormCol.b], b: [wormCol.r, wormCol.g, wormCol.b] });
    halo.visible = false; hero.object.add(halo);
    { // mayflies: pale wings spiralling up off the stream toward the lures. The rare event is the hatch: four thousand at once,
      // a slow upward snow of wings from the water to the roof, thickest over the stream
      const fr = rng.fork('mayflies'), ip = [], iq = [], pa = new V3(), pb = new V3();
      const n = rare ? Math.round(4000 * Math.max(det, 0.7)) : Math.round(600 * dens * det), sMax = rare ? sT + 20 : sD1 - 8;
      for (let i = 0; i < n; i++) {
        const s = rare && fr() < 0.62 ? fr.range(-10, sG - 4) : fr.range(-16, sMax), hallK = s > sD0 + 8 && s < sD1 - 10, grot = s < sG - 10;       // the hatch is thickest in the Sphere
        A.pathAt(s, pa); A.pathAt(s + 1.5, pb); const tx = pb.x - pa.x, tz = pb.z - pa.z, tl = Math.hypot(tx, tz) || 1;
        const lat = hallK ? fr.range(-11, 11) : grot ? (fr() < 0.5 ? fr.range(-3.4, 3.4) : fr.range(-7.5, 9) * (s < 8 ? 1.3 : 1)) : fr.range(-2.3, 2.3);
        ip.push(pa.x + (-tz / tl) * lat, pa.y - 0.8, pa.z + (tx / tl) * lat);
        const big = fr(), sz = 0.016 + 0.034 * big * big;                                                         // wing length: one to three
        iq.push(sz, fr(), (hallK ? fr.range(3, 8) : grot ? fr.range(2.2, 4.4) : fr.range(1.2, 1.9)) + (rare ? 0.5 : 0), fr.range(0.04, 0.085) * (rare ? 0.75 : 1) * (hallK ? 0.6 : 1));
        if (i % 500 === 499) await ctx.yield();
      }
      // cold moon-white wings, never under a mote of two pixels, held to a visible brightness however small they are drawn
      const m = sprites('mayflies', n, { iPos: [ip, 3], iPar: [iq, 4] }, '', { px: [1.0, 0.0068, rare ? 0.62 : 0.62], vert: FLY_VERT, frag: FLY_FRAG, bright: flyBright, a: [0.78, 0.86, 0.94], b: [0.66, 0.80, 0.93] });
      hero.object.add(m);
      if (rare) { // outside the hatch goes on: wings in the moonlight round the arc, and the bats wheel through them
        const op = [], oq = [];
        for (let i = 0; i < Math.round(520 * Math.max(det, 0.7)); i++) {
          path.pointAt(fr.range(0.652, 0.86), pa);
          const big = fr();
          op.push(pa.x + fr.range(-26, 26), pa.y + fr.range(-16, 8), pa.z + fr.range(-18, 18)); oq.push(0.02 + 0.04 * big * big, fr(), fr.range(5, 11), fr.range(0.03, 0.07));
        }
        outside.add(sprites('hatch', oq.length / 4, { iPos: [op, 3], iPar: [oq, 4] }, '', { px: [1.0, 0.0068, 0.45], vert: FLY_VERT, frag: FLY_FRAG, bright: 0.22 + 0.2 * LK.key, a: [0.78, 0.86, 0.94], b: [0.66, 0.80, 0.93] }));
      }
    }
    { // and round the great Organ: pale mayflies climbing a slow helix up the towers toward the lures on their crowns. With the
      // silk beads they are the palest, bluest white in the cave.
      const g = A.ranks.great, fo = makeRng('false-stars-organflies:' + (ctx.seed ?? 0)), n = Math.round(230 * Math.max(det, 0.7)), ip = [], iq = [];
      for (let i = 0; i < n; i++) { const big = fo(); ip.push(g.position.x, 0, g.position.z); iq.push(0.03 + 0.04 * big * big, fo(), Math.min(g.top + 1.5, 11) * fo.range(0.7, 1.0), fo.range(0.034, 0.06)); }
      const m = sprites('organ-flies', n, { iPos: [ip, 3], iPar: [iq, 4] }, '', { px: [1.5, 0.0068, 0.7], vert: FLY_VERT_SPIRAL, frag: FLY_FRAG, bright: flyBright * 1.1, a: [0.74, 0.85, 1.0], b: [0.62, 0.78, 1.0] });
      m.visible = false; hero.object.add(m);
    }

    await ctx.yield();

    // ---------------- wildlife outside: long-tailed bats pouring out of the mouth with us; the ruru
    let bats = null;
    if (batCount > 0) {
      bats = F.makeFlock({ rng: rng.fork('bats'), species: 'bats', count: batCount, size: 0.6, spread: [5.4, 3.0, 13], wander: [1.6, 1.2, 2.0, 1.5],
        light: { sunDir: [moonDir.x, moonDir.y, moonDir.z], sunColor: LK.keyCol, sunIntensity: 0.35, sky: '#22345e', skyIntensity: 0.3, ground: '#070a12', groundIntensity: 0.2 },
        palette: { body: '#08090c', belly: '#0a0b0e', wingC: '#0b0c10', trail: '#0d0e12', tip: '#060608', beak: '#050506', head: '#08090c', legC: '#050505' },
        along: { path, side: -1.0, up: 1.5, lead: 22, from: 0.57, to: 0.84, tread: 110, drift: 4 } });       // (the nearest is some five metres ahead: a bat at the lens is a black cut-out)
      scene.add(bats.object);
      await ctx.yield();
    }
    // Six bats of our own fly with the bow from the lip (u 0.62) to the turn into the gorge (u 0.86): each some four metres
    // off, half a metre across, a flat black silhouette with angular wings (wrist forward, a scalloped trailing edge, ears).
    // They are held where the picture is bright behind them (the Milky Way's band and the sky over the notch, the plume's
    // spray on the left), never across the ring, and at the end pull away ahead into the flock. Head toward -Z, back +Y.
    let nearBats = null; const NBAT = 6;
    const BATS = [[-0.2, 0.64, 3.5, 1.7, 2.3], [0.2, 0.44, 4.2, 2.1, 1.6], [0.36, 0.78, 3.9, 1.4, 2.6], [-0.62, -0.1, 3.4, 1.9, 2.2], [-0.32, -0.27, 3.6, 2.4, 1.5], [0.0, 0.3, 4.3, 1.6, 2.0]];   // place in the frame (-1..1 across, up), metres off, two rates of wander
    if (batCount > 0) {
      const mb = mesher(), v = (x, y, z, s = 0, c = 0.5) => mb.v(x, y, z, [s, c]);
      const ball = (cx, cy, cz, rx, ry, rz) => {
        const NA = 6, NL = 4, b = mb.pos.length / 3;
        for (let j = 0; j <= NL; j++) for (let i = 0; i < NA; i++) { const th = (j / NL) * Math.PI, ph = (i / NA) * TAU; v(cx + Math.sin(th) * Math.cos(ph) * rx, cy + Math.sin(th) * Math.sin(ph) * ry, cz - Math.cos(th) * rz); }
        for (let j = 0; j < NL; j++) for (let i = 0; i < NA; i++) { const q = b + j * NA + i, r = b + j * NA + (i + 1) % NA; mb.quad(q, r, r + NA, q + NA); }
      };
      ball(0, 0, 0.03, 0.05, 0.045, 0.14); ball(0, 0.014, -0.125, 0.044, 0.04, 0.052);
      for (const sd of [-1, 1]) { const b = mb.pos.length / 3; v(sd * 0.01, 0.04, -0.135); v(sd * 0.052, 0.03, -0.12); v(sd * 0.045, 0.105, -0.12); mb.tri(b, b + 1, b + 2); }     // ears
      const SS = [0, 0.12, 0.24, 0.35, 0.47, 0.6, 0.7, 0.8, 0.9, 1.0], FT = [0, 0.35, 0.6, 0.8, 1.0], TB = [0.18, 0.13, 0.105, 0.09, 0.055];
      for (const sd of [-1, 1]) {
        const b = mb.pos.length / 3;
        for (const sp of SS) {
          const lead = sp < 0.45 ? lerp(-0.07, -0.2, Math.sin(Math.PI * 0.5 * sp / 0.45)) : lerp(-0.2, 0.05, Math.pow((sp - 0.45) / 0.55, 1.5));
          let k = 0; while (k < 3 && sp > FT[k + 1]) k++;
          const f = (sp - FT[k]) / (FT[k + 1] - FT[k]), trail = Math.max(lead + 0.004, lerp(TB[k], TB[k + 1], f) - 0.075 * Math.sin(Math.PI * f) * (1 - 0.4 * sp));     // the membrane's edge is drawn in between the finger tips
          for (let j = 0; j <= 2; j++) { const c = j / 2; v(sd * (0.045 + sp * 0.455), 0.012 * Math.sin(c * Math.PI) + 0.01, lerp(lead, trail, c), sd * sp, c); }
        }
        for (let i = 0; i < SS.length - 1; i++) for (let j = 0; j < 2; j++) { const q = b + i * 3 + j, r = q + 3; mb.quad(q, q + 1, r + 1, r); }
      }
      const g = mb.geometry('aW', 2), ph = new Float32Array(NBAT); for (let j = 0; j < NBAT; j++) ph[j] = (j * 0.618 + 0.13) % 1;
      g.setAttribute('iPh', new THREE.InstancedBufferAttribute(ph, 1));
      nearBats = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({ vertexShader: BAT_VERT, fragmentShader: BAT_FRAG, side: THREE.DoubleSide, uniforms: outU() }), NBAT);
      nearBats.frustumCulled = false; nearBats.name = 'bats-near'; nearBats.visible = false; outside.add(nearBats);
    }
    const batRt = new V3(), batUp = new V3(), batF = new V3(), batX = new V3(), batY = new V3(), batZ = new V3(), batP = new V3(), ringN = new V3(), batM = new THREE.Matrix4();
    const owl = (() => {
      // a morepork seen from above and behind: a big round head with no neck, a stocky body, a short fanned tail, and broad
      // round wings (wrist forward, five slotted fingers at the tip). Model space: head toward -Z, back toward +Y.
      const mb = mesher(), v = (x, y, z, s = 0, c = 0.5) => mb.v(x, y, z, [s, c]);
      const ball = (cx, cy, cz, rx, ry, rz) => {
        const NA = 9, NB = 6, b = mb.pos.length / 3;
        for (let j = 0; j <= NB; j++) for (let i = 0; i < NA; i++) { const th = (j / NB) * Math.PI, ph = (i / NA) * TAU; v(cx + Math.sin(th) * Math.cos(ph) * rx, cy + Math.sin(th) * Math.sin(ph) * ry, cz - Math.cos(th) * rz); }
        for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) { const q = b + j * NA + i, r = b + j * NA + (i + 1) % NA; mb.quad(q, r, r + NA, q + NA); }
      };
      ball(0, 0, 0.03, 0.09, 0.074, 0.2); ball(0, 0.016, -0.16, 0.108, 0.09, 0.096);
      { // the tail: a short rounded fan
        const b = mb.pos.length / 3, NT = 6; v(0, 0.004, 0.14);
        for (let i = 0; i <= NT; i++) { const a = (i / NT - 0.5) * 1.5; v(Math.sin(a) * 0.2, 0.0, 0.14 + Math.cos(a) * 0.2 + 0.012 * Math.cos(i * Math.PI)); }
        for (let i = 0; i < NT; i++) mb.tri(b, b + 1 + i, b + 2 + i);
      }
      for (const sd of [-1, 1]) {
        const NSP = 11, NC = 4, b = mb.pos.length / 3;
        for (let i = 0; i <= NSP; i++) {
          const s = i / NSP, tipK = Math.sqrt(Math.max(0, 1 - Math.pow(s, 3.2)));
          const chord = (0.3 + 0.06 * Math.sin(Math.PI * Math.min(1, s / 0.75))) * (0.38 + 0.62 * tipK) + 0.012;
          const lead = -0.16 - 0.035 * Math.sin(Math.PI * Math.pow(s, 0.8)) + 0.075 * s * s;
          for (let j = 0; j <= NC; j++) {
            const c = j / NC, finger = s > 0.62 ? 0.03 * Math.max(0, Math.sin((s - 0.62) * 41)) * (c > 0.6 ? 1 : 0.25) : 0, notch = j === NC ? 0.01 * Math.sin(s * 37) : 0;
            v(sd * (0.06 + s * 0.5), 0.03 + 0.016 * Math.sin(c * Math.PI) + 0.045 * s, lead + chord * c + notch - finger * (c - 0.5), sd * s, c);
          }
        }
        for (let i = 0; i < NSP; i++) for (let j = 0; j < NC; j++) { const q = b + i * (NC + 1) + j, r = q + NC + 1; mb.quad(q, q + 1, r + 1, r); }
      }
      const m = new THREE.Mesh(mb.geometry('aW', 2), new THREE.ShaderMaterial({ vertexShader: OWL_VERT, fragmentShader: OWL_FRAG, side: THREE.DoubleSide, uniforms: outU({ uFlap: { value: 0 } }) }));
      m.frustumCulled = false; m.name = 'ruru'; m.scale.setScalar(2.05); outside.add(m);
      return m;
    })();
    // The ruru's crossing, u 0.845 to 0.90 (two to three seconds). It is placed by angles from the line of sight to the ring, as
    // seen from the eye's place on the path: it comes up from under the bow on the right, a wing's length below the ring, and
    // slides out to the right across the fall's risen mist, five metres off, seen from above and behind with its whole span
    // showing. It is never between the eye and the ring. It flies with us and across us, a little nose-down, banked to the left.
    const owlU = 0.86, owlD = new V3(), owlRt = new V3(), owlUp = new V3();
    {
      const t86 = path.tangentAtDist(owlU * path.length, new V3()), th = new V3(t86.x, 0, t86.z).normalize(), rt = new V3().crossVectors(th, new V3(0, 1, 0)).normalize();
      const fwd = th.clone().multiplyScalar(Math.cos(40 * RAD)).addScaledVector(rt, Math.sin(40 * RAD)).multiplyScalar(Math.cos(12 * RAD)).setY(-Math.sin(12 * RAD)).normalize();
      const oRight = new V3().crossVectors(fwd, new V3(0, 1, 0)).normalize(), oUp = new V3().crossVectors(oRight, fwd).normalize();
      oUp.multiplyScalar(Math.cos(16 * RAD)).addScaledVector(oRight, -Math.sin(16 * RAD)).normalize();          // banked left: its back toward the eye
      const oZ = fwd.clone().negate(), oX = new V3().crossVectors(oUp, oZ).normalize();
      owl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(oX, oUp, oZ));
    }

    await ctx.yield();

    // ---------------- our boat: a matt black touring kayak built round the eye (boat space: eye at the origin, bow toward -Z)
    const boat = new THREE.Group(); boat.name = 'kayak'; scene.add(boat);
    const BU = { uEnv: { value: new THREE.Color() }, uRim: { value: new THREE.Color() }, uGlintCol: { value: new THREE.Color() }, uKeyV: { value: new V3(0, 1, 0) }, uKeyCol: { value: new THREE.Color() }, uWet: { value: 1 }, uTime: OU.uTime };
    const boatMat = new THREE.ShaderMaterial({ vertexShader: BOAT_VERT, fragmentShader: BOAT_FRAG, uniforms: BU, side: THREE.DoubleSide });
    const TIP = new V3(0, -0.5, -2.15);
    {
      const mb = mesher(), NST = 18, row = [];
      const deckY = (f) => -0.585 + 0.085 * f * f, halfW = (f) => 0.3 * Math.pow(Math.max(1 - f, 0), 0.62) + 0.003;
      for (let i = 0; i <= NST; i++) {
        const f = i / NST, z = 0.3 - 2.45 * f, hw = halfW(f), yd = deckY(f), yg = yd - 0.05 * (1 - f) - 0.008;
        const sec = [[-hw * 0.72, yg - 0.2 * (1 - f * 0.6)], [-hw, yg], [-hw * 0.55, yd - 0.014], [0, yd], [hw * 0.55, yd - 0.014], [hw, yg], [hw * 0.72, yg - 0.2 * (1 - f * 0.6)]];
        row.push(sec.map((q) => mb.v(q[0], q[1], z, 0)));
      }
      for (let i = 0; i < NST; i++) for (let j = 0; j < 6; j++) mb.quad(row[i][j], row[i][j + 1], row[i + 1][j + 1], row[i + 1][j]);
      // deck lines: perimeter lines and a crossed bungee, a carry-toggle cord, two pad eyes
      const line = (pts, r = 0.0048) => mb.tube(pts, r, 4, 1);
      for (const sd of [-1, 1]) {
        const pts = []; for (let i = 0; i <= 12; i++) { const f = 0.3 + 0.62 * (i / 12); pts.push(new V3(sd * (halfW(f) - 0.03) * 0.86, deckY(f) + 0.004 - 0.02 * (1 - f), 0.3 - 2.45 * f)); }
        line(pts);
      }
      for (const sd of [-1, 1]) { const fa = 0.56, fb = 0.68; line([new V3(sd * halfW(fa) * 0.8, deckY(fa) - 0.012, 0.3 - 2.45 * fa), new V3(0, deckY((fa + fb) / 2) + 0.008, 0.3 - 2.45 * (fa + fb) / 2), new V3(-sd * halfW(fb) * 0.8, deckY(fb) - 0.01, 0.3 - 2.45 * fb)]); }
      { const f = 0.93, z = 0.3 - 2.45 * f; mb.tube([new V3(-0.012, deckY(f) + 0.012, z), new V3(0.012, deckY(f) + 0.012, z)], 0.012, 5, 1); }
      const m = new THREE.Mesh(mb.geometry('aKind', 1), boatMat); m.frustumCulled = false; m.name = 'deck'; boat.add(m);
    }
    const toggle = new THREE.Group(); toggle.position.copy(TIP); boat.add(toggle);
    {
      const mb = mesher();
      mb.tube([new V3(0, 0, 0), new V3(0, -0.06, -0.03), new V3(0, -0.11, -0.035)], 0.0045, 4, 1);
      mb.tube([new V3(-0.055, -0.115, -0.035), new V3(0.055, -0.115, -0.035)], 0.011, 6, 1);
      const m = new THREE.Mesh(mb.geometry('aKind', 1), boatMat); m.frustumCulled = false; toggle.add(m);
    }
    const paddle = new THREE.Group(); boat.add(paddle);
    {
      const mb = mesher(), pts = []; for (let i = 0; i <= 8; i++) pts.push(new V3(-0.78 + 1.56 * (i / 8), 0, 0));
      mb.tube(pts, 0.019, 6, 2);
      for (const sd of [-1, 1]) {                                      // feathered spoon blades
        const NB = 6, rows = [], fe = sd * 0.5, cf = Math.cos(fe), sf = Math.sin(fe);
        for (let i = 0; i <= NB; i++) {
          const t = i / NB, x = sd * (0.72 + 0.4 * t), w = 0.08 * Math.sin(Math.PI * Math.pow(t, 0.6)) + 0.012, cup = 0.03 * Math.sin(Math.PI * t);
          rows.push([-1, 0, 1].map((a) => { const yy = a * w, zz = cup - Math.abs(a) * 0.012; return mb.v(x, yy * cf - zz * sf, yy * sf + zz * cf, 2); }));
        }
        for (let i = 0; i < NB; i++) for (let j = 0; j < 2; j++) mb.quad(rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]);
      }
      const m = new THREE.Mesh(mb.geometry('aKind', 1), boatMat); m.frustumCulled = false; m.name = 'paddle'; paddle.add(m);
    }
    // spray beads that hang beside us in the air because they fall as we do
    const beads = (() => {
      const br = rng.fork('beads'), ip = [], iq = [], n = Math.round(90 * det);
      for (let i = 0; i < n; i++) { ip.push(br.sign() * br.range(0.7, 4.5), br.range(-1.6, 2.2), br.range(-9, -1.2)); iq.push(br.range(0.012, 0.03), br(), br.range(0.4, 1), 0); }
      const m = sprites('spray-beads', n, { iPos: [ip, 3], iPar: [iq, 4] }, MOVE_BEAD, { px: [1.0, 0.003], bright: 0, a: [0.8, 0.88, 1.0], b: [0.62, 0.8, 0.95] });
      boat.add(m); return m;
    })();
    // spray flying beside the plume on the same parabola (points of moonlight)
    {
      const sr = rng.fork('spray'), ip = [], iq = [], n = Math.round(260 * det), f3 = (v) => v.toFixed(4);
      for (let i = 0; i < n; i++) { ip.push(sr.range(-1.3, 1.3), sr.range(-0.6, 2.2), sr.range(-1, 1)); iq.push(sr.range(0.03, 0.08), sr(), sr.range(0.35, 1), 0); }
      const MOVE_SPRAY = `float pt=fract(uTime*${f3(1 / PL.T)}+iPar.y)*${f3(PL.T)};
        vec3 po=vec3(${f3(PL.o.x)},${f3(PL.o.y)},${f3(PL.o.z)}), pv=vec3(${f3(PL.v.x)},${f3(PL.v.y)},${f3(PL.v.z)}), prr=vec3(${f3(rH.x)},0.0,${f3(rH.z)});
        c=po+pv*pt+prr*(-(0.9*pt+0.42*pt*pt)+iPos.x*(2.4+0.85*pt)*${f3(plumeK)});
        c.y=po.y+pv.y*pt-4.9*pt*pt+iPos.y*(0.5+0.45*pt); c+=vec3(${f3(fH.x)},0.0,${f3(fH.z)})*iPos.z*(0.3+0.5*pt);
        br=iPar.z*(0.35+0.65*abs(sin(uTime*(3.0+4.0*tint)+iPar.y*50.0)))*smoothstep(0.05,0.5,pt)*(1.0-smoothstep(${f3(PL.T - 0.7)},${f3(PL.T - 0.1)},pt));`;
      outside.add(sprites('plume-spray', n, { iPos: [ip, 3], iPar: [iq, 4] }, MOVE_SPRAY, { px: [1.0, 0.004], bright: 0.25 + 0.75 * LK.key, a: [0.85, 0.92, 1.0], b: [0.66, 0.82, 0.96] }));
    }
    // autumn flood: migrating longfin eels ride the Flume beside us (boat space; they keep station, weaving)
    let eels = null;
    if (season === 'autumn') {
      const er = rng.fork('eels'), mb = mesher(), pts = [], rad = [], NR = 22, SDS = 6;
      for (let i = 0; i <= NR; i++) { const t = i / NR; pts.push(new V3(0, 0, t * 1.5)); rad.push(0.012 + 0.075 * Math.sin(Math.PI * Math.pow(t, 0.42)) * (1 - 0.7 * t)); }
      mb.tube(pts, rad, SDS, 0);
      for (let i = 0; i < mb.ext.length; i++) mb.ext[i] = Math.floor(i / SDS) / NR;
      const iq = [], n = 7;
      for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1; iq.push(sd * er.range(0.75, 2.3), -er.range(2.4, 8.5), er(), er.range(0.8, 1.2)); }
      eels = new THREE.Mesh(instanced(mb.geometry('aT', 1), n, { iPar: [iq, 4] }), new THREE.ShaderMaterial({ vertexShader: EELS_VERT, fragmentShader: EELS_FRAG,
        uniforms: { uTime: OU.uTime, uEelsY: { value: -0.85 }, uEelsCol: { value: new THREE.Color() }, uEelsA: { value: 0 } } }));
      eels.frustumCulled = false; eels.name = 'autumn-eels'; eels.visible = false; boat.add(eels);
    }
    // the veil at the lip, held square to the lens
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, uniforms: { uCol: { value: mistCol.clone().multiplyScalar(2.4).add(moonCol.clone().multiplyScalar(0.05)) }, uA: { value: 0 }, uTime: OU.uTime } }));
    veil.frustumCulled = false; veil.renderOrder = 30; veil.scale.set(2.4, 1.5, 1); veil.name = 'lip-veil'; scene.add(veil);

    await ctx.yield();

    // ---------------- gaze: the Chandelier and its weta as we pass, then the ring in the mist from the lip onward
    const Lp = path.length, wetaC = new V3();
    for (const w of A.weta) wetaC.add(w); wetaC.multiplyScalar(1 / Math.max(1, A.weta.length)).lerp(A.chandelier.position, 0.35);
    const poiA = new V3(), poiB = new V3();
    const uOf = (sv) => clamp((sv + (SEC.caveLen - sM) * clamp(sv / sM, 0, 1)) / Lp, 0, 1);       // journey u at river distance sv (near enough)
    const RK = A.ranks, rankAt = (r, h) => r.position.clone().setY(r.top * h);
    const plumeLook = plumeAt(2.6, new V3()); plumeLook.y += 9;
    const gorgeLook = W(rivX(235), FLOOR, 235, new V3());
    const vistaLook = W(-8, -78, 330, new V3());
    const pois = [
      // the Chandelier and its weta until we are abeam (u 0.093), then round to the way ahead
      { at: (time, u) => { path.posAtDist(u * Lp + 18, poiB); return poiA.copy(wetaC).lerp(poiB, smoothstep(0.089, 0.113, u)); }, from: -0.03, to: 0.132, weight: 0.92 },
      // the Organ's ranks, one after another down the river: the Grotto's rank as the far hall opens, the door rank as we come
      // into the Hall, the great Organ across the lake, then the far rank under its pendant
      { at: rankAt(RK.grotto, 0.5), from: uOf(RK.grotto.s - 33), to: uOf(RK.grotto.s + 4), weight: 0.5, fade: 0.3 },
      { at: rankAt(RK.door, 0.55), from: uOf(RK.door.s - 28), to: uOf(RK.door.s + 4), weight: 0.45, fade: 0.3 },
      { at: rankAt(RK.great, 0.5), from: uOf(RK.great.s - 46), to: uOf(RK.great.s + 5), weight: 0.55, fade: 0.3 },
      { at: A.organ.position, from: uOf(A.organ.s - 30), to: uOf(A.organ.s + 8), weight: 0.6 },
      // out of the mouth: the long view. The gaze is held out along the gorge (sky and the Milky Way in the notch above, the
      // valley and the fall below) while the bow dips; the ring is in the frame from the lip on, low and left of the bow,
      // and takes the gaze only for the last straight.
      { at: vistaLook, from: 0.622, to: 0.945, fade: 0.22, weight: 0.5 },
      // and, just out of the mouth, down and left to the fall we were fired out beside: the plume and its spray in the moon
      { at: plumeLook, from: 0.652, to: 0.752, fade: 0.36, weight: 0.5 },
      // then down into the gorge as it opens under the bow: the pool, the river going away between the crowns, the ring over them
      { at: gorgeLook, from: 0.735, to: 0.848, fade: 0.36, weight: 0.42 },
      { at: portalPos, from: 0.83, to: 1.25, fade: 0.1, weight: 0.4 },
    ];

    // ---------------- per-frame
    const heroPart = (n) => hero.object.getObjectByName(n);
    const grottoParts = ['grotto', 'grotto-mirror', 'grotto-teeth', 'grotto-teeth-mirror', 'weta', 'drips', 'worms', 'worms-mirror'].map(heroPart).filter(Boolean), rankParts = ['rank-stone', 'rank-stone-mirror'].map(heroPart).filter(Boolean), tubeParts = ['tube', 'tube-mirror'].map(heroPart).filter(Boolean), hallParts = ['threads'].map(heroPart).filter(Boolean), hallWorms = ['worms-tube', 'worms-mirror-tube', 'worms-organ', 'worms-organ-mirror'].map(heroPart).filter(Boolean), hallStone = ['hall-stone', 'drips-hall'].map(heroPart).filter(Boolean), flyPart = heroPart('mayflies');
    // the Hall's images in its lake (stone, threads, lights): not drawn until the Grotto is put away behind us (through the neck they are a few dim pixels)
    const hallImages = ['hall-stone-mirror', 'threads-mirror'].map(heroPart).filter(Boolean), shortSnares = ['snares-short', 'snares-short-mirror'].map(heroPart).filter(Boolean), organFlies = heroPart('organ-flies'), wetaPart = heroPart('weta');
    const lateParts = ['flume-mirror', 'worms-mirror-flume', 'trough', 'mouth-image'].map(heroPart).filter(Boolean);     // the images in the water: put away once we are in the air
    const flumeParts = ['flume', 'worms-flume'].map(heroPart).filter(Boolean);     // the Flume and its lights lie beyond the Hall's far door: not drawn from the Grotto
    const P = new V3(), P2 = new V3(), T = new V3(), T2 = new V3(), bp = new V3(), cf = new V3(), camP = new V3(), bf = new V3(), bx = new V3(), by = new V3(), bz = new V3(), up = new V3(0, 1, 0), m4 = new THREE.Matrix4(), eul = new THREE.Euler(0, 0, 0, 'YZX');
    const envC = new THREE.Color(), tmpC = new THREE.Color();
    const zC = A.chandelier.dist, sOut = sD1 - 6, baseBright = hero.uniforms.uBright.value;
    const ROCK_CF = 4, rainK = weather === 'rain' ? 1 : 0, liftCol = new THREE.Color(0.0075, 0.0345, 0.0385), liftHall = new THREE.Color(0.0066, 0.0305, 0.054), ambCave = new THREE.Color(0.0065, 0.027, 0.03), ambFlume = new THREE.Color(0.0075, 0.019, 0.036);
    const keyCave = new V3(), mouthCol = hero.uniforms.uSkyCol.value, mouthBase = mouthCol.clone();
    const floorFlora = ['canopy', 'tree-ferns', 'cliff-ferns'].map((n) => outside.getObjectByName(n)).filter(Boolean);     // the forest under the horizon: not drawn until the Tube's rock is put away (through the mouth it is dark on dark)
    // The outside is drawn from the Hall's last metres on, and without the forest under the horizon until the Tube's rock is put
    // away (the Hall's lights, the Tube's rock and the whole gorge are never drawn together). From the Hall's throat the mouth,
    // where a sliver of it would show round the last bend, is black; its light dawns over eighteen metres of river as we
    // round the bend: a pane at the lip, drawn last, that multiplies what shows through the mouth by 0..1.
    const shutter = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), new THREE.ShaderMaterial({ vertexShader: 'void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform float uK; void main(){ gl_FragColor=vec4(vec3(uK),1.0); }', uniforms: { uK: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }));
    shutter.position.copy(lip).addScaledVector(fH, 0.25).setY(lip.y + 7); shutter.lookAt(shutter.position.clone().sub(fH));
    shutter.frustumCulled = false; shutter.renderOrder = 60; shutter.name = 'mouth-dawn'; scene.add(shutter);
    function update(dt, time, camera, u) {
      const d = u * Lp, s = A.riverAt(d);                               // metres flown, and the river distance there
      path.posAtDist(d, P); path.tangentAtDist(d, T); path.tangentAtDist(d + 12, T2);
      OU.uTime.value = time;
      if (renderer) { renderer.getDrawingBufferSize(res); if (!(res.x > 0)) res.set(800, 450); }
      if (camera.getWorldPosition) camera.getWorldPosition(camP); else camP.copy(camera.position);
      // 1 while this world is only seen through the previous world's portal (its camera stands back from the entry point)
      const thru = u <= 0 ? smoothstep(1.2, 7.0, camP.distanceTo(P)) : 0;

      // the cave: the hero keys its wake, dimming, streaks and the eel to where the boat is on the river
      const inCave = u < caveU + 0.11;
      hero.object.visible = inCave;
      if (inCave) {
        bp.copy(P).addScaledVector(T, -1.15);
        hero.setBoat(bp, T, A.speedAt(s)); hero.setEyeS(s);
        // exposure of the cave by river distance: high in the Sphere, eased for the Chandelier's dense knot as we pass it, up again
        // for the far hall, steady through the Tube and Flume. Seen through the previous portal the rock stays dark and the worms
        // themselves are lifted, so the disc holds an hourglass of light and not a grey dome.
        const dK = A.domeK(s);                                            // 1 under the dome of the Hall of Threads
        let g = lerp(1.8, 1.25, smoothstep(zC - 22, zC - 6, s));
        g = lerp(g, 1.75 - 0.15 * rainK, smoothstep(zC + 5, zC + 20, s));              // the far hall is still the Sphere: held to its last frame
        g = lerp(g, 1.3, smoothstep(sG - 4, sG + 22, s));
        const thr = smoothstep(sD1 - 40, sD1 - 22, s) * (1 - smoothstep(sD1 - 8, sD1 + 5, s)), dKt = Math.max(dK, 0.72 * thr);      // the Hall's throat, down to the door of the passage: held at the Hall's light
        g = lerp(g, 1.72, dKt);                                          // the Hall is a second Sphere: a far roof of lights over still water
        g = lerp(g, 1.5, smoothstep(sT - 10, sT + 40, s));
        hero.uniforms.uGain.value = lerp(g, 1.35, thru);
        // stars on dark rock. In the Sphere the rock takes the colony's light whole. Past the Chandelier the roofs come down and
        // in the Tube the walls are an arm's length from thousands of lights, so the brightest rock is held down (uRockK
        // compresses the baked irradiance) and a pedestal of dim blue-green goes under it (uLift, divided by the gain so it lands
        // in the same place whatever the gain). The display curve (tone map, then the grade's contrast) falls off a cliff: rock
        // below about 0.032 is black, 0.036 a tenth of white, 0.05 a quarter. The pedestal is set just under that and the rock
        // shader swings it with the relief (0.42 to 1.7 times), so dish hollows fall to black and cusps and lit faces stand out.
        const fluK = smoothstep(sT - 12, sT + 34, s), far = smoothstep(zC + 5, zC + 18, s) * (1 - thru), tubeK = smoothstep(sG - 16, sG + 10, s);
        const tubeN = tubeK * (1 - dK);                                  // the narrow passages only
        const rainNeck = rainK * (1 - smoothstep(sD0 - 6, sD0 + 10, s));      // after rain, the flooded neck before the Hall
        hero.uniforms.uRockK.value = lerp((lerp(10, 14, tubeN) + rainK * lerp(5, 0, tubeN)) * far, ROCK_CF, fluK);
        // the relief's swing: whole in the Sphere's far hall, eased where the walls are an arm's length off (there it read as a
        // warped ripple, not as scallops), and after rain in the far hall, where the lights carry the picture
        hero.uniforms.uRel.value = far * lerp(lerp(0.75 - 0.25 * rainK, 0.32, tubeK), 0.3, fluK);
        hero.uniforms.uCalm.value = Math.max(tubeK, fluK);          // past the Grotto the rock is soft scallops everywhere: the Hall's funnels come as close as the Tube's walls
        hero.uniforms.uAmb.value.copy(ambCave).multiplyScalar(1 - far * lerp(0.4, 0.75, tubeN)).lerp(ambFlume, fluK);
        // (in the Hall the pedestal leans to the brief's relief blue, so the shade is blue-black where the colony's light is green: a second tone;
        // after rain the neck's roof is an arm's length off: its rock is the throat's soft scallops (uEven) on a higher, even pedestal)
        hero.uniforms.uLift.value.copy(liftCol).lerp(liftHall, dKt).multiplyScalar(far * lerp(0.5, 0.4 + 0.22 * rainK + 0.68 * rainNeck, tubeN) * lerp(1, 0.75, fluK) / g);
        hero.uniforms.uEven.value = 0.9 * rainNeck * tubeN;
        hero.uniforms.uVoid.value = smoothstep(sG - 6, sD0 + 10, s) * (1 - fluK) * (1 - 0.5 * rainNeck);      // from the neck through the Hall the rock's pedestal follows the colony's clouds (dark lanes between them)
        hero.uniforms.uHue.value = lerp(0.25, 1, smoothstep(sG - 10, sD0 + 12, s)) * (1 - thru);      // the colony's two colours are told apart on the rock from the Hall on: green under its clouds, blue along its lanes
        // in the Tube the lights are an arm's length off and drawn large: at the Sphere's strength their glow veils the rock, so they are eased
        // (after rain the river runs a metre higher: in the far hall the roof's lights are close enough to run together, so they are eased there too)
        hero.uniforms.uBright.value = baseBright * (1 + 1.3 * thru) * lerp(lerp(lerp(1 - 0.25 * rainK * far, 0.78 - 0.2 * rainK, smoothstep(sG - 24, sG + 8, s)), 1.0, Math.max(dK, 0.85 * thr)), 0.8, fluK);
        hero.uniforms.uRimK.value = lerp(1.25, 0.9, tubeK) * (1 - 0.6 * thru);            // the wet rim on what hangs from the roof: strongest in the Sphere
        hero.update(dt, time, camera);
        // THE SMEAR, by our speed along the river alone (one law from the Grotto to the lip). Under 5.5 m/s (the Sphere, the
        // Hall) the lights are round points. Faster than that each of the cave's lights is drawn out along our travel into a
        // comet (a bright head, a tapering tail: see the hero's worm shader). The tail is a length in metres that grows with
        // the speed over 5.5 m/s and levels off at 1.4 m (0.6 m at 6.5 m/s as the neck takes us, 1.0 at 8, 1.3 at 10, 1.4 down the Flume), so on
        // the screen it is our speed and the light's nearness: an arm's length overhead a long stroke, across a hall a point.
        // Chevrons stand on the water with it. A length, not a time: a still shows what the flight shows. Past the lip there
        // is no river: the lights are the points they always were (the hero's own shutter stands).
        if (s < sM) {
          const spd = A.speedAt(s), over = Math.max(spd - 5.5, 0), smK = smoothstep(5.5, 6.8, spd), Lm = 1.4 * (1 - Math.exp(-over / 1.8)) * (rainK ? 0.7 : 1);     // (after rain the roofs are closer: shorter)
          hero.uniforms.uShutter.value = Lm / Math.max(spd, 1);
          hero.uniforms.uStreak.value = lerp(1.15, 30, smK);
          hero.uniforms.uChev.value = smK;
          // down the neck the Hall beyond is the brighter place: its lights are lifted as we come to the door (a lit door, not a dark pane)
          hero.uniforms.uAhead.value = 1.2 * smoothstep(sG - 34, sG - 14, s) * (1 - smoothstep(sD0 - 4, sD0 + 6, s));
        } else { hero.uniforms.uStreak.value = 1.15; hero.uniforms.uChev.value = 0; hero.uniforms.uAhead.value = 0; }
        hero.uniforms.uBoatP.value.y *= 1 - thru;                        // no bow wake before there is a bow
        halo.visible = thru > 0.01; halo.material.uniforms.uBright.value = 0.55 * thru;
        const gv = s < sG + 4; for (const o of grottoParts) o.visible = gv;        // (four metres into the neck the whole Grotto is behind the eye)
        for (const o of rankParts) o.visible = s < sD1 + 3;                      // the Grotto's rank and the door rank are seen down the gallery from the entry on
        const tv = s < sT + 1; for (const o of tubeParts) o.visible = tv;                // the Tube and the Hall: until the Flume has us
        const hv = s > sD0 - 46 && s < sD1 + 3; for (const o of hallParts) o.visible = hv;        // the Hall's threads and lights are behind us once we are in the passage to the Flume
        const wv = s < sD1 + 3; for (const o of hallWorms) o.visible = wv;
        const sv = s > RK.grotto.s + 6 && s < sD1 + 3; for (const o of hallStone) o.visible = sv;      // (from where the Grotto's own rank is put away behind us: see the hero)
        if (wetaPart) wetaPart.visible = gv && s < zC + 30;                      // the weta cling to the Chandelier: thirty metres on they are far behind the eye
        const iv = !gv && s < sD1 + 3; for (const o of hallImages) o.visible = iv;
        const fl = s > sD0 - 4; for (const o of flumeParts) o.visible = fl;
        const lv = fl && s < sM + 6; for (const o of lateParts) o.visible = lv;   // the water is a mirror the whole river long: its images go when we leave it
        const nv = s < sT + 60; for (const o of shortSnares) o.visible = nv;
        if (organFlies) organFlies.visible = s > sD0 - 30 && s < sD1 + 3;
        if (flyPart) { flyPart.visible = s < sT + 30; flyPart.material.uniforms.uBright.value = flyBright * (1 - 0.75 * thru); }
      }
      // the outside: drawn from the Tube's last bend on, because it shows in the disc of the mouth
      const out = s > sOut, dawnK = smoothstep(sOut + 1, sOut + 19, s);
      outside.visible = out;
      shutter.visible = out && dawnK < 0.999; shutter.material.uniforms.uK.value = dawnK * dawnK;
      mouthCol.copy(mouthBase).multiplyScalar(0.05 + 0.95 * dawnK);
      if (out) {
        const fv = s > sT + 1; for (const o of floorFlora) o.visible = fv;
        sky.update(dt, time, camera);
        skyStuff.position.copy(camP);
        OU.uOutGain.value = lerp(1.3, 1.0, smoothstep(0.6, 0.72, u)) * LK.gain;
        bankOp.value = smoothstep(0.75, 0.84, u);
        const w = (u - owlU) / 0.02;
        owl.visible = u > 0.838 && u < 0.912;
        if (owl.visible) {
          owlD.copy(portalPos).sub(P).normalize(); owlRt.crossVectors(owlD, up).normalize(); owlUp.crossVectors(owlRt, owlD);
          const wp = Math.max(w - 0.8, 0), th = (19 + 12 * w + 6 * wp * wp) * RAD, ph = -(14 + 16 * smoothstep(0.25, 1.0, -w) - 2.0 * Math.max(w, 0)) * RAD, R = 4.7 + 0.7 * w * w;
          owl.position.copy(P).addScaledVector(owlD, R * Math.cos(th) * Math.cos(ph)).addScaledVector(owlRt, R * Math.sin(th) * Math.cos(ph)).addScaledVector(owlUp, R * Math.sin(ph));
          owl.position.y += 0.08 * Math.sin(time * 1.1);
          owl.material.uniforms.uFlap.value = 0.85 * Math.sin(time * 8.0);          // a bounded wing angle (radians at the tip): slow deep beats
        }
      }
      if (bats) { bats.object.visible = u > 0.5; if (u > 0.5) bats.update(dt, time, camera, u); }
      if (nearBats) {
        const bv = u > 0.6 && u < 0.872;
        nearBats.visible = bv;
        if (bv) {
          const me = camera.matrixWorld.elements, pe = camera.projectionMatrix.elements, th = 1 / Math.max(pe[0], 0.1), tv = 1 / Math.max(pe[5], 0.1);
          batRt.set(me[0], me[1], me[2]).normalize(); batUp.set(me[4], me[5], me[6]).normalize(); batF.set(-me[8], -me[9], -me[10]).normalize();
          ringN.copy(portalPos).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);      // where the ring stands in the frame
          const airK = smoothstep(caveU - 0.002, caveU + 0.014, u), asp = th / tv;
          for (let j = 0; j < NBAT; j++) {
            const q = BATS[j], kin = smoothstep(0.606 + 0.007 * j, 0.642 + 0.007 * j, u), kout = smoothstep(0.80 + 0.006 * j, 0.87, u), ko = kout * kout;
            let ax = q[0] + 0.07 * Math.sin(time * q[3] + j * 2.1) + 0.03 * Math.sin(time * 2.9 + j), ay = q[1] + 0.06 * Math.sin(time * q[4] + j * 1.3) + 0.03 * Math.cos(time * 2.3 + j * 0.7);
            ax = lerp(ax * (1 + 0.5 * (1 - kin)), 0.04 + 0.07 * (j - 2.5), ko); ay = lerp(ay + 1.6 * (1 - kin), 0.5 + 0.05 * (j % 3), ko);       // they come over us from behind and above, and at the end pull away ahead into the flock
            ay = lerp(Math.max(ay, 0.06), ay, airK);                           // (in the Flume's mouth none flies under the water)
            const rdx = (ax - ringN.x) * asp, rdy = ay - ringN.y, rd = Math.hypot(rdx, rdy);
            if (ringN.z < 1 && rd < 0.36) { const k = 0.36 / Math.max(rd, 1e-3); ax = ringN.x + rdx * k / asp; ay = ringN.y + rdy * k; }       // never across the ring
            const dd = q[2] + 30 * ko;
            batP.copy(camP).addScaledVector(batF, dd).addScaledVector(batRt, ax * th * dd).addScaledVector(batUp, ay * tv * dd);
            // heading: with us, yawing a little either way; banked into its own wander
            const yaw = 0.3 * Math.sin(time * q[3] * 0.8 + j * 1.7), roll = 0.45 * Math.cos(time * q[3] + j * 2.1);
            // Its back is turned half toward the eye (a bat seen level from behind is a line: these climb and flutter, so the
            // whole of both wings shows), its nose up the way we go.
            batY.copy(camP).sub(batP).normalize().multiplyScalar(0.8 + 0.25 * Math.sin(time * q[4] * 0.7 + j * 2.3)).addScaledVector(up, 0.5).addScaledVector(batRt, roll * 0.5).normalize();
            batZ.set(-T.x, -T.y * 0.6, -T.z).addScaledVector(batRt, -yaw); batZ.addScaledVector(batY, -batZ.dot(batY));
            if (batZ.lengthSq() < 1e-4) batZ.copy(up).multiplyScalar(-1).addScaledVector(batY, up.dot(batY));
            batZ.normalize(); batX.crossVectors(batY, batZ).normalize();
            const S = 0.52;
            batM.makeBasis(batX, batY, batZ); batM.scale(P2.set(S, S, S)); batM.setPosition(batP);
            nearBats.setMatrixAt(j, batM);
          }
          nearBats.instanceMatrix.needsUpdate = true;
        }
      }

      // the kayak: level on the water underground (it only yaws a little after the gaze); in the air it tips over with the view
      // Seen through the previous portal (u exactly 0) it is not carried by that portal's camera: it lies still at the entry
      // point on the path's first heading, which is the pose the viewer arrives into.
      const parked = u <= 0;
      camera.getWorldDirection(cf);
      const air = smoothstep(caveU - 0.02, caveU + 0.03, u);
      const yawT = Math.atan2(T.x, -T.z), yawC = parked ? yawT : Math.atan2(cf.x, -cf.z), pitT = Math.asin(clamp(T.y, -1, 1)), pitC = Math.asin(clamp(cf.y, -1, 1));
      let dy = yawC - yawT; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const flow = smoothstep(sG - 12, sT + 30, s);
      const yaw = yawT + dy * lerp(0.42, 0.85, air) + 0.012 * Math.sin(time * 0.6) + 0.006 * flow * Math.sin(time * 5.3);
      const pit = lerp(pitT, pitC, 0.85 * air) + 0.004 * Math.sin(time * 0.9) + 0.006 * flow * Math.sin(time * 7.1 + 1.0);
      bf.set(Math.sin(yaw) * Math.cos(pit), Math.sin(pit), -Math.cos(yaw) * Math.cos(pit));
      const turn = clamp(-(T.z * T2.x - T.x * T2.z) * 5, -1, 1);                       // + = bending right
      bz.copy(bf).negate(); bx.crossVectors(up, bz).normalize(); by.crossVectors(bz, bx);
      by.addScaledVector(bx, -0.14 * turn + 0.01 * Math.sin(time * 0.8)).normalize(); bx.crossVectors(by, bz).normalize();
      boat.quaternion.setFromRotationMatrix(m4.makeBasis(bx, by, bz)); boat.position.copy(parked ? P : camP);
      toggle.rotation.set(0.25 * Math.sin(time * 2.1) * (0.3 + flow) + 0.5 * air, 0, 0.3 * Math.sin(time * 1.7 + 1) * (0.25 + flow) - 0.5 * turn);
      // paddle: shipped and still in the Grotto, bracing into the Tube's bends, flat along the deck in the Flume, lifted in the air
      // In still water it is shipped: laid at an angle across the foredeck, the right blade forward beside the bow where it can be
      // read as a blade, the rest of the shaft running back out of the frame. In the Tube's bends it braces a little either way.
      // From the Hall's door on (the Flume, the air) it is stowed along the hull below the frame: a paddle held level across the
      // lap is a ruled dark bar across the picture.
      const wS = smoothstep(sD1 - 14, sD1 + 6, s), wT = smoothstep(sG - 6, sG + 8, s) * (1 - smoothstep(sD0 - 8, sD0 + 10, s)), wG = 1 - wS;
      paddle.position.set(0.2 * wG, -0.475 * wG - 0.95 * wS, -0.9 * wG - 0.5 * wS);
      eul.set(0.42 * wG, (0.86 + 0.16 * turn * wT + 0.012 * Math.sin(time * 0.7)) * wG + 0.3 * wS, (-0.05 - 0.1 * turn * wT) * wG);
      paddle.rotation.copy(eul);
      // what the wet deck reflects: worm glow underground (brightest under the Chandelier), cold sky near the mouth, the moon outside
      const glow = 0.034 + 0.055 * Math.exp(-((s - zC) * (s - zC)) / 340) - 0.012 * smoothstep(sT, sT + 110, s) + 0.05 * smoothstep(sG - 48, sG - 6, s) * (1 - smoothstep(sT, sT + 60, s)) * (1 - 0.4 * A.domeK(s));   // the Tube's roof is an arm's length over the wet deck
      const skyK = Math.pow(smoothstep(sT - 30, sM + 8, s), 1.6);                    // the mouth's cold light finds the wet deck far up the Flume
      envC.copy(wormCol).multiplyScalar(glow).lerp(tmpC.copy(ambCol).multiplyScalar(1.5).add(mistCol), skyK);
      BU.uEnv.value.copy(envC);
      BU.uRim.value.copy(wormCol).multiplyScalar((0.035 + 0.085 * smoothstep(sG - 50, sG - 12, s)) * (1 - 0.6 * smoothstep(sT, sT + 70, s)) * (1 - smoothstep(sM - 20, sM + 5, s)) * (1 - thru));
      BU.uGlintCol.value.copy(wormCol).multiplyScalar(2.6 * (1 - 0.6 * smoothstep(sT, sM - 15, s))).lerp(tmpC.copy(moonCol).multiplyScalar(3.2).add(ambCol), air);
      // key light on the deck: in the Flume the disc ahead lays a blue lane down the wet foredeck; outside, the moon
      const kOut = smoothstep(sM - 12, sM + 10, s), kIn = smoothstep(sT - 25, sT + 60, s) * (1 - kOut);
      BU.uKeyCol.value.copy(moonCol).multiplyScalar(0.9 * kOut).add(tmpC.copy(mouthCol).multiplyScalar(1.0 * kIn));
      keyCave.copy(T).setY(T.y + 0.3).normalize().lerp(moonDir, kOut).normalize();
      BU.uKeyV.value.copy(keyCave).transformDirection(camera.matrixWorldInverse);
      beads.material.uniforms.uBright.value = (0.7 + 0.8 * LK.key) * smoothstep(caveU - 0.004, caveU + 0.025, u) * (1 - smoothstep(0.93, 0.99, u));
      beads.visible = u > caveU - 0.01;
      if (eels) {
        const ea = smoothstep(sT - 2, sT + 16, s) * (1 - smoothstep(sM - 26, sM - 8, s));
        eels.visible = ea > 0.002;
        if (eels.visible) { eels.material.uniforms.uEelsA.value = ea; eels.material.uniforms.uEelsCol.value.copy(wormCol).multiplyScalar(0.8).lerp(tmpC.copy(ambCol).multiplyScalar(2.0).add(mistCol), skyK); }
      }
      // the veil of spray at the lip, and (when the gorge is brim-full) the cloud floor as we go through it: one eased wash each
      let va = 0.4 * smoothstep(caveU - 0.016, caveU + 0.002, u) * (1 - smoothstep(caveU + 0.004, caveU + 0.034, u));
      if (deckOn && u > caveU) va = Math.max(va, deckVeil * (1 - smoothstep(2, 7, Math.abs(camP.y - deckY - 3.5))));
      veil.visible = va > 0.003;
      if (veil.visible) {
        veil.material.uniforms.uA.value = va; veil.position.copy(camP).addScaledVector(cf, 0.7);
        if (camera.getWorldQuaternion) camera.getWorldQuaternion(veil.quaternion); else veil.quaternion.copy(camera.quaternion);
      }
    }
    update(0, 0, { position: path.start.clone(), quaternion: new THREE.Quaternion(), matrixWorldInverse: new THREE.Matrix4().makeTranslation(-path.start.x, -path.start.y, -path.start.z), getWorldDirection: (o) => o.copy(path.startTangent) }, 0);
    outside.visible = true; shutter.visible = true;                   // let the first compile see everything; update() hides it again
    await sky.prewarm(renderer, null, scene);

    return {
      scene, path, duration: 50,
      // the brief's river: drift through the Sphere, quicken in the Tube, fire down the Flume, then ease for the sky and the arc
      // (and the Hall of Threads is drifted through as slowly as the Sphere, the Flume fired down, the long glide flown at an easy pace)
      // (the neck between the Grotto and the Hall is ten metres long: a breath quicker through it, no more)
      pace: (u) => lerp(lerp(lerp(lerp(0.62, 0.9, smoothstep(0.185, 0.215, u)), 0.6, smoothstep(0.222, 0.262, u)), 1.5, smoothstep(0.455, 0.53, u)), 0.95, smoothstep(0.615, 0.69, u)),
      title: lookId === 'dawn' ? 'False Stars, Before Dawn' : rare ? 'False Stars: The Hatch' : 'False Stars',
      camera: { fov: 62, near: 0.12, far: 5200, lookAhead: 16, sway: 0.6, bank: 0.55 },      // (a level horizon over the gorge: the moonlit wall stands upright)
      pois,
      portal: { shape: 'circle', radius: 7, color: '#8ff0e6', glow: 1, tilt: true, revealDistance: 230 },
      post: { exposure: 1.6, bloom: { strength: 0.52, radius: 0.7, threshold: 0.84 },
        grade: { saturation: 1.1, contrast: 1.06, tint: '#eaf2ff', shadowTint: '#03060c', vignette: 0.42, grain: 0.03, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
