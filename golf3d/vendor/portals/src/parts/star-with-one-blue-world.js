// A Star with One Blue World: the three bodies of the world, each built on its own.
//
// buildHero(ctx, opts): THE BLUE WORLD. One Object3D with its origin at the globe's centre; the star's light comes
//   along local +Z (the day half toward -Z), +Y up. Three pieces that read as one ball:
//   the day half (a half ball toward the star, one shader: seas, lands, ice, cloud bands, whorls of storm, cloud
//   shadow, the star's glint on the sea, the twilight band), the air (a rim term on the surfaces and one thin
//   back-face shell), and the night limb (the ball's own surface from the plane between day and night up 52 degrees
//   into the night: a ring; black; the air's line on its outer face by the twilight law, nothing on its inner face),
//   with a faint curtain of aurora on the night limb by the pole of spin.
//   The night half inside the ring is NOT built: the world's exit opening stands in the plane between day and night.
// buildStar(ctx, opts): THE STAR. One Object3D with its origin at the star's centre: the boiling face, the arches of
//   fire on its limb, the one great arch that reaches for the far turn, and one shell that carries the fringe of
//   spikes, the rayed outer glow and the long streamers of its crown.
// buildMoon(ctx, opts): THE MOON OF ICE. One ball with its origin at its own centre (see its own head, below).
//
// One light: the star. No three.js light, no texture: every surface is worked out in its shader from where it stands.
// THE WHOLE BALL AS A CUT: the night half is open, so every far or glowing thing (the star's face, glow and arches
// here; the far suns and the wind in the world file) asks whether the eye's ray to it meets the ball of the world
// and draws nothing where it does. BALL_GLSL below is that question, the same for all of them.
import * as THREE from 'three';

const DEG = Math.PI / 180;
// THE BALL'S SKIN (join sheet, THE BALL'S SKIN AT THE LINE OF DUSK). The world's exit opening is the disc of radius R
// in the plane between day and night. The ball that is built round it stands SKIN_OVER metres over that radius, so
// that the opening's own bright edge lies well inside the ball at the plane: the night limb at R + SKIN_OVER, the day
// half SKIN_STEP under it, and the day half runs on DUSK_LAP degrees past the plane under the limb (no seam lies at
// the plane). Every law of the ball (the air, the aurora, the storms' size on the ground, the cut of far things
// behind it, the ground the route flies over) reads this skin, never a typed radius.
export const SKIN_OVER = 0.6;
const SKIN_STEP = 0.015, DUSK_LAP = 2, SKIN_ROUND = 192, DAY_ROWS = 60, LIMB_ROWS = 32;
const THREAD_IN = 8, THREAD_OUT = 18, THREAD_LIGHT = 4.5;   // the air's far thread: degrees into the night (see airThread); its light at the ground
const lin =(hex) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };

// hashes and value noise without sine (the same on every graphics card)
export const NOISE_GLSL = /* glsl */`
  float h13(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
  vec3 h33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
  float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.);
    return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;

// the ball of the world against a ray from the eye. ro: the eye, from the ball's centre; rd: unit direction.
// ballMiss is 1 where the ray passes clear of the ball and 0 where it meets it (soft over a few centimetres for
// things drawn by the fragment); an eye inside the ball sees only the ball's own inside, so everything far is cut.
export const BALL_GLSL = /* glsl */`
  float ballMiss(vec3 ro, vec3 rd, float R){
    float b=dot(ro,rd), c=dot(ro,ro)-R*R;
    if(c<=0.) return 0.;
    if(b>=0.) return 1.;
    float d2=max(dot(ro,ro)-b*b,0.);
    return smoothstep(R-.04, R+.04, sqrt(d2));
  }
  // the same for a thing at a known place p (from the ball's centre): cut only if the ball stands before it
  float ballBefore(vec3 ro, vec3 p, float R){
    vec3 d=p-ro; float L=max(length(d),1e-4); vec3 rd=d/L;
    float b=dot(ro,rd), c=dot(ro,ro)-R*R, h=b*b-c;
    if(c<=0.) return 0.;
    if(h<=0. || b>=0.) return 1.;
    return (-b-sqrt(h))<L ? 0. : 1.;
  }
`;

// THE SKIN'S DEPTH LEADS WHERE THE OPENING STANDS BEHIND IT. The opening's disc lies in the plane of dusk, and from
// beside the world it is seen nearly edge on: its range then runs many metres to a pixel, and a renderer that takes
// one depth for a whole pixel sets a sample on the disc's rim nearer than the skin that stands before it (the white
// hairline on the line of dusk; a skin 0.6 m out cannot answer a slope of 6 m a pixel). So the ball's two pieces
// write their depth nearer the eye, by rule: where the eye's ray through the skin goes on to the plane of dusk
// inside the opening (or within a pixel of its rim), by LEAD_PX pixels of the plane's own slope along that sight,
// never more than LEAD_SHARE of the way to the eye. Head on (the last straight, the low pass, the full world) that
// is centimetres; beside the plane it is metres. Only depth is written so: no colour, and nothing is moved.
const LEAD_PX = 1.5, LEAD_SHARE = 0.5;
const SKIN_VERT = /* glsl */`varying vec3 vP; flat varying float vDepthB;
  void main(){ vP=position; vDepthB=-.5*projectionMatrix[3][2]; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const SKIN_DEPTH_GLSL = /* glsl */`
  flat varying float vDepthB;
  // ro: the eye from the ball's centre; rd: the sight line; opening: the opening's radius in the plane z = 0
  float skinDepth(vec3 ro, vec3 rd, float opening){
    float dz=abs(rd.z)>1e-5 ? rd.z : 1e-5, t=-ro.z/dz, slope=min(fwidth(t),1e6);
    vec2 q=ro.xy+rd.xy*t;
    float behind=step(0.,t)*(1.-smoothstep(1.,2.,(length(q)-opening)/max(slope,1e-3)));
    float zv=1./max(gl_FragCoord.w,1e-6), lead=min(${LEAD_PX.toFixed(1)}*slope, ${LEAD_SHARE.toFixed(2)}*zv)*behind;
    return gl_FragCoord.z-vDepthB*(1./max(zv-lead,1e-3)-1./zv);
  }
`;

// the air's law by place on the ball (the join sheet's term 2, kept by place alone): full on the day side and to 20
// degrees into the night, falling to nothing at 26 (so that for an eye on the shadow's axis the air's last light is gone from the ball's outline before the opening's own rim shows through the hole: one ring, never two). nz is the z of the unit normal at the place (positive into the night).
export const AIR_GLSL = /* glsl */`
  float airLaw(float nz){ float deg=degrees(asin(clamp(nz,-1.,1.))); return 1.-smoothstep(20.,26.,deg); }
  // THE THREAD (the air line as the far eye sees it): where the air's edge stands at the line of dusk or within a few
  // degrees of it, the star's light comes round the world through the whole depth of the air and the edge burns as
  // one thin thread. By the facing of the air's edge to the star and by nothing else: whole to THREAD_IN degrees
  // into the night, nothing from THREAD_OUT degrees. For an eye on the shadow's axis the ball's outline stands
  // asin(radius / distance) into the night: so the thread is whole from afar, thins as we come in and is gone where
  // the outline stands THREAD_OUT degrees into the night; from there in, the air's line is airLaw's alone.
  float airThread(float nz){ float deg=degrees(asin(clamp(nz,-1.,1.))); return 1.-smoothstep(${THREAD_IN.toFixed(1)},${THREAD_OUT.toFixed(1)},deg); }
`;

// ------------------------------------------------------------------------------------------------ the day half
// Everything is a function of the unit normal: n in the world's own frame for the light, uSpin * n for the ground
// (lands, seas, ice), uCloud * n for the weather. Detail finer than a pixel is faded by its own width (fw).
const DAY_FRAG = /* glsl */`
  precision highp float;
  #define NW 6
  uniform float uTime, uSea, uCloudAmt, uFleck, uStarAng, uRadius, uOpening;
  uniform mat3 uSpin, uCloud;
  uniform vec3 uAxis, uLandOff, uCloudOff, uCentre, uBelt, uBands;
  uniform vec4 uWhorl[NW];
  uniform vec2 uWhorlRot[NW];
  uniform vec3 cDeep, cShallow, cLand, cDry, cIce, cCloud, cShade, cAir;
  varying vec3 vP;
  ${NOISE_GLSL}${SKIN_DEPTH_GLSL}
  // each finer layer of the noise is turned against the one before, so that no grid of it shows from near
  const mat3 TURN=mat3(0.,.8,.6, -.8,.36,-.48, -.6,-.48,.64);
  float fbmL(vec3 p, float fw, float lac){ float a=.5, s=0., f=1.;
    for(int i=0;i<7;i++){ s+=a*(vn3(p)-.5)*(1.-smoothstep(.3,.8,fw*f)); p=TURN*p*lac+3.7; f*=lac; a*=.52; } return s; }
  float fbmC(vec3 p, float fw){ float a=.5, s=0., f=1.;
    for(int i=0;i<6;i++){ s+=a*vn3(p)*(1.-smoothstep(.3,.8,fw*f)); p=TURN*p*2.17+5.1; f*=2.17; a*=.5; } return s; }
  // the cloud's own noise: its two broadest layers on the banded place p (drawn out along the lines of latitude), its
  // four finer layers on the round place q, so that the bands are bands and nothing under about 5 m is drawn out
  float fbmW(vec3 p, vec3 q, float fw){ float a=.5, s=0., f=1.;
    for(int i=0;i<2;i++){ s+=a*vn3(p)*(1.-smoothstep(.3,.8,fw*f)); p=TURN*p*2.17+5.1; f*=2.17; a*=.5; }
    q=q*(f*.9)+p*.12+9.3;
    for(int i=0;i<4;i++){ s+=a*vn3(q)*(1.-smoothstep(.3,.8,fw*f)); q=TURN*q*2.17+5.1; f*=2.17; a*=.5; } return s; }
  vec3 turn(vec3 p, vec3 a, float th){ float c=cos(th), s=sin(th); return p*c+cross(a,p)*s+a*dot(a,p)*(1.-c); }
  // the height of the ground over the sea (0 is the shore)
  vec3 groundWarp(vec3 s){ return vec3(vn3(s*2.1+uLandOff.yzx), vn3(s*2.1+uLandOff.zxy+7.3), vn3(s*2.1+uLandOff+13.1))-.5; }
  float ground(vec3 s, vec3 w, float fw){ return fbmL(s*1.45+uLandOff+w*.55, fw*1.45, 2.07)-uSea; }
  // the cloud's finer forms: heaps with furrows between them, from about 3 m across down to a third of a metre, on the
  // cloud's own frame (so they drift with it) and slowly working; each layer fades where it is finer than a pixel
  float billow(vec3 sc, float fw){ vec3 p=TURN*(sc*8.5)+uCloudOff.zxy+vec3(0.,uTime*.006,0.); float a=.5, s=0., f=8.5;
    for(int i=0;i<4;i++){ s+=a*(1.-abs(2.*vn3(p)-1.))*(1.-smoothstep(.3,.8,fw*f)); p=TURN*p*2.13+4.3; f*=2.13; a*=.55; } return s; }
  // the weather: 0 clear sky to 1 thick cloud, at the place sc of the cloud's own frame
  float weather(vec3 sc, float fw){
    float lat=dot(sc,uAxis);
    // bands that run round the axis of spin: each band of latitude drifts at its own rate (one of them backward)
    float bi=lat*5.+uBands.x, b0=floor(bi), bf=smoothstep(.3,.7,fract(bi));
    float r0=h13(vec3(b0,3.1,uBands.y))-.3, r1=h13(vec3(b0+1.,3.1,uBands.y))-.3;
    vec3 q=turn(sc, uAxis, uTime*.0021*mix(r0,r1,bf)*6.);
    vec3 st=q+uAxis*dot(q,uAxis)*1.5;
    vec3 w1=vec3(vn3(st*2.3+uCloudOff.zxy), vn3(st*2.3+uCloudOff+5.2), vn3(st*2.3+uCloudOff.yzx+9.1))-.5;
    vec3 p=st*2.4+uCloudOff+w1*1.25;
    vec3 w2=vec3(vn3(p*2.9+3.3), vn3(p*2.9+11.7), vn3(p*2.9+17.2))-.5;
    float c=fbmW(p+w2*.5+vec3(0.,0.,uTime*.004), q*2.4+uCloudOff.yzx+w1*.9+w2*.35+vec3(0.,uTime*.004,0.), fw*2.4);
    float amt=mix(h13(vec3(b0,9.7,uBands.y)), h13(vec3(b0+1.,9.7,uBands.y)), bf);
    c+= (amt-.5)*.34*uBands.z + uCloudAmt;
    float bl=(lat-uBelt.x)/max(uBelt.y,1e-3);
    c+= uBelt.z*exp(-bl*bl)*(.25+.2*vn3(st*5.+uCloudOff));
    // small flecked cloud between the bands, forming and thinning over tens of seconds
    float fl=fbmC(TURN*(q*29.+w1*2.5)+uCloudOff.yzx+vec3(uTime*.011), fw*29.);
    c+= uFleck*smoothstep(.5,.7,fl)*(1.-smoothstep(.25,.7,fw*60.))*.16;
    // the whorls of storm: a spiral about a clear eye, turning about the eye
    for(int i=0;i<NW;i++){
      vec4 wh=uWhorl[i]; if(wh.w<=0.) continue;
      float d=acos(clamp(dot(sc,wh.xyz),-1.,1.))/wh.w; if(d>=1.3) continue;
      vec3 e1=normalize(cross(wh.xyz,uAxis)+vec3(1e-5,0.,0.)), e2=cross(wh.xyz,e1);
      float x=dot(sc,e1), y=dot(sc,e2), ph=atan(y,x+sign(x+1e-9)*1e-6)*uWhorlRot[i].y;
      float n=vn3(sc*23.+wh.xyz*5.)-.5, dw=(d-.2)/.085;
      float arm=sin(ph*2.-7.5*log(max(d,.03))+uWhorlRot[i].x+n*1.6);
      float env=1.-smoothstep(.5,1.05,d), eye=smoothstep(.07,.15,d), wall=exp(-dw*dw);
      float sp=env*eye*max(smoothstep(-.35,.45,arm)*(.55+.45*(1.-d)), wall*1.1);
      float moat=smoothstep(.45,.9,d)*(1.-smoothstep(1.,1.3,d));
      c=mix(c, .22+.62*sp, (1.-smoothstep(.95,1.3,d))*(1.-.35*moat));
    }
    return c;
  }
`;
const DAY_MAIN = /* glsl */`
  void main(){
    vec3 n=normalize(vP);
    vec3 v=normalize(cameraPosition-uCentre-vP);
    float ndv=clamp(dot(n,v),0.,1.);
    float fw=length(fwidth(n));
    // the one light: the star, its rays along +Z. E is its height over the horizon at this place.
    float sinE=clamp(-n.z,-1.,1.), E=asin(sinE), eDeg=degrees(E);
    // THE STAR'S LIGHT ON THE GROUND, by the ground's own facing to the star and by nothing else: full where the star
    // stands high, falling as the ground turns from it (a ball, never a plate); then a band of warm low light (pale
    // gold, then gold, where the star stands under about 30 degrees), the dusk (rose, under about 6) and night at
    // the line itself. Every term is smooth in E: the day falls to the night through a soft terminator, no line.
    float sE=clamp(sinE,0.,1.);
    float I=sE*(.42+.58*smoothstep(0.,24.,eDeg));
    vec3 lightC=mix(vec3(1.,.30,.24), vec3(1.,.60,.30), smoothstep(.5,6.,eDeg));
    lightC=mix(lightC, vec3(1.,.86,.64), smoothstep(5.,14.,eDeg));
    lightC=mix(lightC, vec3(1.), smoothstep(13.,34.,eDeg));
    vec3 ts=vec3(0.,0.,-1.)+n*n.z; float tl=length(ts); ts/=max(tl,1e-4);
    float tanZ=clamp(tl/max(sinE,.02),.5,4.);
    // the ground: seas, lands, ice round the poles of spin
    vec3 s=uSpin*n;
    vec3 gw=groundWarp(s);
    float h=ground(s,gw,fw), stp=max(.004,fw);
    float slope=(ground(uSpin*normalize(n+ts*stp),gw,fw)-h)/stp;
    float relief=clamp(1.-slope*1.1,.5,1.45);
    float coast=max(fw*1.2,.0012);
    float land=smoothstep(-coast,coast,h);
    float shal=smoothstep(-.085,-.003,h);
    float m1=vn3(s*5.3+uLandOff.zxy);
    // the ground's fine mottle: two layers on turned frames (no squares of the noise's own lattice seen from low over it)
    float m2=(.6*vn3(TURN*(s*41.)+uLandOff)+.4*mix(.5, vn3(TURN*TURN*(s*97.)+uLandOff.yzx), 1.-smoothstep(.25,.7,fw*97.)))*(1.-smoothstep(.25,.7,fw*41.));
    // the sea: darker over the deeps, and paler drifts in it that bend with the coasts' own warp
    float drift=vn3(s*17.+gw*5.+uLandOff.yzx);
    vec3 sea=mix(cDeep, cShallow, shal*shal)*(.72+.56*m1)*mix(.66,1.,smoothstep(-.3,-.04,h));
    sea=mix(sea, cShallow*vec3(.9,1.12,1.), .3*smoothstep(.56,.84,drift)*(1.-shal));
    float dry=smoothstep(.3,.75, m1*.7+vn3(s*13.+uLandOff.yzx)*.3+h*1.4);
    vec3 gcol=mix(cLand, cDry, dry);
    float range=smoothstep(.06,.15,h+.035*(m2-.5));
    gcol*=mix(1.,.8,range)*(.82+.36*m2);
    gcol*=mix(1., relief, land);
    float lat=dot(n,uAxis);
    float ice=smoothstep(.905,.935, abs(lat)+.05*(m1-.5)+.025*(m2-.5));
    vec3 surf=mix(sea, gcol, land);
    surf=mix(surf, cIce*(.74+.2*relief), ice);
    // the weather over it: cloud with a lit side and a shaded side, and its shadow on sea and land
    vec3 sc=uCloud*n;
    // its finer forms ride on it (billow): they fret its edges into wisps and heap its top, and every heap has a side
    // toward the star and a side in its own blue grey shade (the same step toward the star that throws the shadow)
    vec3 sc2=uCloud*normalize(n+ts*(.0125*tanZ));
    float bw=billow(sc,fw), c=weather(sc,fw)+(bw-.5)*.2;
    float c2=weather(sc2,fw)+(billow(sc2,fw)-.5)*.2;
    float a=smoothstep(.45,.68,c), aS=smoothstep(.45,.68,c2);
    float body=smoothstep(.5,.9,c);
    float shade=smoothstep(-.02,.11,c2-c);
    vec3 cloudC=mix(cCloud*(.7+.2*body+.14*bw), cShade*.52, shade*.92);
    // the cloud's shadow on sea and land: by the cloud's own thickness (a thin wisp throws next to none)
    surf*=mix(vec3(1.), cShade*.62, smoothstep(.52,.84,c2)*.85);
    vec3 col=mix(surf, cloudC, a);
    col*=lightC*I*1.3;
    // the star mirrored in the sea: a broad soft patch that glitters, broken by coasts, ice and cloud
    float t5=uTime*5.;
    vec3 wv=vec3(vn3(s*310.+vec3(0.,t5*.07,0.)), vn3(s*310.+vec3(9.1,0.,t5*.07)), vn3(s*310.+vec3(t5*.07,4.7,0.)))-.5;
    vec3 wn=normalize(n+wv*.09*(1.-smoothstep(.2,.7,fw*310.)));
    float ga=acos(clamp(dot(reflect(-v,wn),vec3(0.,0.,-1.)),-1.,1.));
    // a soft sheen, no disc: brightest where the star mirrors toward the eye, with a broad faint skirt round it
    float gq=ga/uStarAng, gl=sqrt(.72*exp(-gq*gq*1.7)+.1*exp(-gq*gq*.4));
    float spk=vn3(vec3(s.xy*760.,s.z*760.+t5));
    float glit=mix(.8, .25+4.5*spk*spk*spk*spk, 1.-smoothstep(.3,.9,fw*760.));
    col+=vec3(1.,.93,.78)*gl*gl*glit*1.25*(1.-land)*(1.-ice)*(1.-a)*(1.-.75*aS)*smoothstep(0.,6.,eDeg);
    // the air: paler and bluer toward the edge, and the thin bright line at the very edge
    // (the air is lit as the ground under it is: it glows on the star's side of the ball, from about 7 degrees of the
    // star's height, and by the line of dusk its line is the night limb's own, no brighter)
    float rim=1.-ndv, airI=smoothstep(.12,.6,sE);
    col=mix(col, cAir*(.19+.86*airI), rim*rim*rim*.7);
    col+=cAir*.6*(1.+1.2*airI)*pow(rim,7.);
    // the last of the dusk is the night's own black, so that no step stands where the night limb begins
    col-=vec3(.072)*(1.-smoothstep(0.,2.5,eDeg));
    gl_FragColor=vec4(col,1.);
    gl_FragDepth=skinDepth(cameraPosition-uCentre, -v, uOpening);
  }
`;

// ------------------------------------------------------------------------------------------------ the night limb
// The ball's own surface from the plane between day and night up limbDeg into the night: a ring with a hole.
// Its black is the black of the opening's own dark face: where the eye's ray goes on to the plane of dusk the ring
// writes what the opening's look writes there (a little under black, by the same law of the radius), so no step of
// tone stands at the hole's edge. Outer face: that black and the air's line by the twilight law. Inner face: black only.
const LIMB_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uCentre, cAir; uniform float uOpening, uTime, uShim;
  varying vec3 vP;
  ${AIR_GLSL}${SKIN_DEPTH_GLSL}
  void main(){
    vec3 n=normalize(vP), ro=cameraPosition-uCentre, rd=normalize(vP-ro);
    float r=1.;
    if(ro.z>0. && rd.z<-1e-4){ vec2 q=ro.xy+rd.xy*(-ro.z/rd.z); r=clamp(length(q)/uOpening,0.,1.); }
    float r2=r*r;
    vec3 col=-vec3(.12)*(1.-.4*r2*r2*r2);
    if(gl_FrontFacing){
      float rim=1.-clamp(dot(n,-rd),0.,1.), rim2=rim*rim;
      // the air line's shimmer: the same law and the same seeded phase as the air shell's (one line of air, one shimmer)
      float shim=1.+.05*sin(atan(n.y,n.x+1e-6)*9.+uTime*.7+uShim)*sin(uTime*.31+uShim*1.7+n.x*4.);
      // where the eye looks toward the star through this air, the light of the dusk comes through it
      float fwd=pow(clamp(-rd.z,0.,1.),6.);
      col+=(cAir*.6+vec3(1.,.5,.26)*1.3*fwd)*rim2*rim2*rim2*rim*airLaw(n.z)*shim;
    }
    gl_FragColor=vec4(col,1.);
    gl_FragDepth=skinDepth(ro, rd, uOpening);
  }
`;
// a kit sphere's pole turned from +Y to +Z in place (a quarter turn about X), positions only: these shaders read
// nothing else of the geometry, so its normals and uvs are dropped
function poleToZ(g) {
  const p = g.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const y = p[i + 1]; p[i + 1] = -p[i + 2]; p[i + 2] = y; }
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  return g;
}
const POS_VERT = /* glsl */`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

// the air: one thin shell seen from behind, so that it shows only as a line just outside the ball's outline.
// Far off the line would be thinner than a pixel: the shell is widened with the eye's distance to a pixel and a half,
// and its light thinned by as much, so that the line's whole light is the world's and not the lens's.
const AIR_VERT = /* glsl */`
  uniform vec3 uCentre; uniform float uRadius, uThick, uBufH;
  varying vec3 vP; varying float vTh;
  void main(){
    float dist=length(cameraPosition-uCentre);
    float px=2./(projectionMatrix[1][1]*max(uBufH,1.));
    vTh=max(uThick, 1.6*px*dist);
    vP=normalize(position)*(uRadius+vTh);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(vP,1.);
  }`;
const AIR_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uCentre, cAir; uniform float uRadius, uThick, uTime, uShim;
  varying vec3 vP; varying float vTh;
  ${AIR_GLSL}
  void main(){
    vec3 ro=cameraPosition-uCentre, rd=normalize(vP-ro);
    vec3 t=ro-rd*dot(ro,rd); float d=length(t); vec3 nt=t/max(d,1e-4);
    float g=1.-clamp((d-uRadius)/max(vTh,1e-3),0.,1.);
    float outside=smoothstep(uRadius-.02,uRadius+.03,d);
    float shim=1.+.05*sin(atan(nt.y,nt.x+1e-6)*9.+uTime*.7+uShim)*sin(uTime*.31+uShim*1.7+nt.x*4.);
    // where the shell is drawn wider than it is, its light is thinned by as much: the line's whole light is by place alone
    float k=clamp(uThick/max(vTh,1e-3),0.,1.);
    // seen against the star's side of the sky the air carries the dusk's own light: rose at the ground, gold over it,
    // and bright (the ring of all this world's dusks, which the eye in the shadow sees whole)
    float fwd=pow(clamp(-rd.z,0.,1.),6.);
    vec3 dusk=mix(vec3(1.,.74,.46), vec3(1.,.44,.24), g)*2.4*fwd*g;
    // the thread: gold at the ground, blue white at the air's top, seen where the eye looks toward the star through it
    dusk+=mix(vec3(.62,.82,1.), vec3(1.,.8,.52), g)*(.35+.65*g)*${THREAD_LIGHT.toFixed(1)}*fwd*airThread(nt.z);
    // on the day side the air glows toward the star, as on the ground under it (nothing of this on the night side)
    float dayGlow=1.+1.2*smoothstep(.12,.6,clamp(-nt.z,0.,1.));
    gl_FragColor=vec4((cAir*.6*g*g*dayGlow+dusk)*outside*airLaw(nt.z)*shim*k,1.);
  }`;

// the aurora: a faint curtain on the night limb by the pole of spin; rays ripple along it and brighten and fade
const AURORA_VERT = /* glsl */`attribute vec2 aUV; varying vec2 vUV; varying vec3 vP;
  void main(){ vUV=aUV; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const AURORA_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uCentre, cAurora; uniform float uTime, uRadius, uOffA;
  varying vec2 vUV; varying vec3 vP;
  ${NOISE_GLSL}${BALL_GLSL}
  void main(){
    float u=clamp(vUV.x,0.,1.), h=clamp(vUV.y,0.,1.);
    float rays=vn3(vec3(u*46.+uTime*.35, uTime*.21, 1.7+uOffA))*.65+vn3(vec3(u*131.-uTime*.5, uTime*.4, 9.2+uOffA))*.35;
    float swell=.35+.65*vn3(vec3(u*4.+uTime*.05, uTime*.11, 4.4+uOffA));
    float up=smoothstep(0.,.07,h)*(1.-h)*(1.-h)*(.55+.45*rays);
    float ends=sqrt(clamp(sin(u*3.14159),0.,1.));
    float lit=up*rays*rays*swell*ends*2.2;
    gl_FragColor=vec4(cAurora*lit*ballBefore(cameraPosition-uCentre, vP, uRadius),1.);
  }`;

const PALETTE = { deep: '#0B3A8C', shallow: '#1F6FB8', land: '#6F7350', dry: '#9A8660', ice: '#E8EEF5', cloud: '#F4F7FB', shade: '#7F93BA',
  air: '#5AB0FF', aurora: '#6FD8C8', starMid: '#FFDC92', starLimb: '#F2A23A', core: '#FFD98A' };
const WEATHERS = ['clear', 'whorls', 'belt'];

export async function buildHero(ctx, opts = {}) {
  const R = opts.radius ?? 24, limbDeg = opts.limbDeg ?? 52, period = opts.spinPeriod ?? 300;
  // R is the opening's radius; the ball's skin stands over it (see SKIN_OVER): the limb outermost, the day half just under it
  const SKIN_LIMB = R + SKIN_OVER, SKIN = SKIN_LIMB - SKIN_STEP, AIR = 0.7;
  const axis = new THREE.Vector3().fromArray(opts.spinAxis ?? [0.643, 0.766, 0]).normalize();
  const pal = { ...PALETTE, ...(opts.palette || {}) };
  // the world's own stream: made from the seed and a name, it draws from no parent
  const rng = ctx.core.makeRng(ctx.core.hashSeed('blue-world:' + ctx.seed));
  // every draw is taken whatever the caller gives, so that nothing later in the stream turns on what was given
  const spinDraw = rng.range(0, Math.PI * 2), spinPhase = opts.spinPhase ?? spinDraw;
  const landOff = new THREE.Vector3(rng.range(-40, 40), rng.range(-40, 40), rng.range(-40, 40));
  const cloudOff = new THREE.Vector3(rng.range(-40, 40), rng.range(-40, 40), rng.range(-40, 40));
  const bands = new THREE.Vector3(rng.range(0, 1), rng.range(0, 50), rng.range(0.7, 1.1));
  // the weather, when the caller names none, is drawn from a stream of its own
  const weatherDraw = ctx.core.makeRng(ctx.core.hashSeed('blue-world-weather:' + ctx.seed)).pick(WEATHERS);
  const weather = WEATHERS.includes(opts.weather) ? opts.weather : weatherDraw;
  const density = opts.density ?? 1;
  // THE WHORLS OF STORM: six, in every weather, on ONE track of latitude (opts.whorlTrack, least and most degrees:
  // the track the low pass follows), evenly round the world from a seeded start with a little jitter, all drifting
  // along the track at ONE rate, so that their spacing holds and one of them is beside any place of the track at
  // every clock. Each has its own size and its own time of turning.
  const nWhorl = 6, track = opts.whorlTrack ?? [-14, -7], lon0 = rng.range(0, Math.PI * 2), wander = rng.range(-0.0016, 0.0016);
  const whorls = [];
  for (let i = 0; i < 6; i++) {
    const across = rng.range(5, 9);
    whorls.push({
      on: true,
      lat: rng.range(track[0] * 0.75 + track[1] * 0.25, track[0] * 0.25 + track[1] * 0.75) * DEG,
      lon: lon0 + (i / 6) * Math.PI * 2 + rng.range(-0.12, 0.12),
      rad: (weather === 'whorls' && i === 0 ? 9 : across) / 2 / SKIN,
      turn: rng.range(40, 70), wander, phase: rng.range(0, Math.PI * 2),
    });
  }
  // the aurora's and the air line's own offsets and phases (the last draws of this stream)
  const auroraOff = rng.range(0, 60), shimPhase = rng.range(0, Math.PI * 2);
  const u1 = new THREE.Vector3(0, 0, 1).cross(axis).normalize(), u2 = new THREE.Vector3().crossVectors(axis, u1);
  const uWhorl = whorls.map(() => new THREE.Vector4(1, 0, 0, 0)), uWhorlRot = whorls.map(() => new THREE.Vector2(0, 1));

  const object = new THREE.Group();
  const centre = { value: new THREE.Vector3() }, tU = { value: 0 }, bufH = { value: 450 };
  const cAir = { value: lin(pal.air) };
  await ctx.yield();

  // the day half: a half ball toward the star, DUSK_LAP degrees past the plane so that it laps under the night limb
  const dayU = {
    uTime: tU, uCentre: centre, uRadius: { value: SKIN }, uOpening: { value: R }, uSea: { value: 0.022 }, uStarAng: { value: Math.asin(265 / 900) },
    uCloudAmt: { value: weather === 'clear' ? -0.035 : weather === 'belt' ? -0.02 : 0.0 }, uFleck: { value: 0.75 * density },
    uSpin: { value: new THREE.Matrix3() }, uCloud: { value: new THREE.Matrix3() }, uAxis: { value: axis },
    uLandOff: { value: landOff }, uCloudOff: { value: cloudOff }, uBands: { value: bands },
    uBelt: { value: new THREE.Vector3(Math.sin((track[0] + track[1]) / 2 * DEG), 0.075, weather === 'belt' ? 1 : 0) },
    uWhorl: { value: uWhorl }, uWhorlRot: { value: uWhorlRot },
    cDeep: { value: lin(pal.deep) }, cShallow: { value: lin(pal.shallow) }, cLand: { value: lin(pal.land) }, cDry: { value: lin(pal.dry) },
    cIce: { value: lin(pal.ice) }, cCloud: { value: lin(pal.cloud) }, cShade: { value: lin(pal.shade) }, cAir,
  };
  const dayGeo = new THREE.SphereGeometry(SKIN, SKIN_ROUND, DAY_ROWS, 0, Math.PI * 2, Math.PI / 2 - DUSK_LAP * DEG, Math.PI / 2 + DUSK_LAP * DEG);
  await ctx.yield();
  poleToZ(dayGeo);
  await ctx.yield();
  const day = new THREE.Mesh(dayGeo,
    new THREE.ShaderMaterial({ uniforms: dayU, vertexShader: SKIN_VERT, fragmentShader: DAY_FRAG + DAY_MAIN, fog: false }));
  object.add(day);
  await ctx.yield();

  // the night limb: from the plane up limbDeg into the night; both faces
  const t0 = (90 - limbDeg) * DEG;
  const limbGeo = new THREE.SphereGeometry(SKIN_LIMB, SKIN_ROUND, LIMB_ROWS, 0, Math.PI * 2, t0, Math.PI / 2 - t0);
  await ctx.yield();
  poleToZ(limbGeo);
  await ctx.yield();
  const limb = new THREE.Mesh(limbGeo,
    new THREE.ShaderMaterial({ uniforms: { uCentre: centre, cAir, uOpening: { value: R }, uTime: tU, uShim: { value: shimPhase } }, vertexShader: SKIN_VERT, fragmentShader: LIMB_FRAG, side: THREE.DoubleSide, fog: false }));
  object.add(limb);
  await ctx.yield();

  // the air shell: seen from behind, it ends 40 degrees into the night (the twilight law ends at 26)
  const airGeo = new THREE.SphereGeometry(1, 96, 36, 0, Math.PI * 2, 50 * DEG, 130 * DEG);
  await ctx.yield();
  poleToZ(airGeo);
  const air = new THREE.Mesh(airGeo,
    new THREE.ShaderMaterial({ uniforms: { uCentre: centre, cAir, uRadius: { value: SKIN_LIMB }, uThick: { value: AIR }, uBufH: bufH, uTime: tU, uShim: { value: shimPhase } },
      vertexShader: AIR_VERT, fragmentShader: AIR_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  air.frustumCulled = false; air.renderOrder = 2;
  object.add(air);
  await ctx.yield();

  // the aurora: the night half of a small oval 9 degrees from the pole of spin, a curtain from 0.3 m to 1.4 m over the ground
  const NA = 160, NV = 6, aPos = new Float32Array((NA + 1) * (NV + 1) * 3), aUV = new Float32Array((NA + 1) * (NV + 1) * 2), aIdx = [];
  const e1 = new THREE.Vector3(axis.y, -axis.x, 0).normalize(), c9 = Math.cos(9 * DEG), s9 = Math.sin(9 * DEG);
  for (let i = 0; i <= NA; i++) {
    const ph = (i / NA) * Math.PI, cx = Math.cos(ph) * s9, cz = Math.sin(ph) * s9;
    const dx = axis.x * c9 + e1.x * cx, dy = axis.y * c9 + e1.y * cx, dz = cz;
    for (let j = 0; j <= NV; j++) {
      const k = i * (NV + 1) + j, r = SKIN_LIMB + 0.3 + 1.1 * (j / NV);
      aPos[k * 3] = dx * r; aPos[k * 3 + 1] = dy * r; aPos[k * 3 + 2] = dz * r; aUV[k * 2] = i / NA; aUV[k * 2 + 1] = j / NV;
      if (i < NA && j < NV) aIdx.push(k, k + NV + 1, k + 1, k + 1, k + NV + 1, k + NV + 2);
    }
  }
  const aGeo = new THREE.BufferGeometry();
  aGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3)); aGeo.setAttribute('aUV', new THREE.BufferAttribute(aUV, 2)); aGeo.setIndex(aIdx);
  const aurora = new THREE.Mesh(aGeo, new THREE.ShaderMaterial({
    uniforms: { uCentre: centre, uTime: tU, uRadius: { value: SKIN_LIMB }, uOffA: { value: auroraOff }, cAurora: { value: lin(pal.aurora).multiplyScalar(opts.aurora ?? 0.16) } },
    vertexShader: AURORA_VERT, fragmentShader: AURORA_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  aurora.renderOrder = 3;
  object.add(aurora);

  const _m4 = new THREE.Matrix4(), _v = new THREE.Vector3(), _size = new THREE.Vector2();
  const hole = Math.cos(limbDeg * DEG) * SKIN_LIMB, holeZ = Math.sin(limbDeg * DEG) * SKIN_LIMB;
  function update(dt, time, camera) {
    tU.value = time;
    object.getWorldPosition(centre.value);
    if (ctx.renderer) bufH.value = ctx.renderer.getDrawingBufferSize(_size).y;
    // the spin: the ground at the top goes toward +Z (the top is the line of dusk); the cloud drifts a twentieth again
    const th = spinPhase + (time / period) * Math.PI * 2;
    dayU.uSpin.value.setFromMatrix4(_m4.makeRotationAxis(axis, -th));
    dayU.uCloud.value.setFromMatrix4(_m4.makeRotationAxis(axis, -th * 1.05));
    for (let i = 0; i < 6; i++) {
      const w = whorls[i], lon = w.lon + w.wander * time, cl = Math.cos(w.lat), sl = Math.sin(w.lat);
      _v.copy(axis).multiplyScalar(sl).addScaledVector(u1, cl * Math.cos(lon)).addScaledVector(u2, cl * Math.sin(lon));
      uWhorl[i].set(_v.x, _v.y, _v.z, w.on ? w.rad : 0);
      const sense = w.lat > 0 ? 1 : -1;
      uWhorlRot[i].set(w.phase - sense * (time / w.turn) * Math.PI * 2, sense);
    }
  }
  update(0, 0, null);
  return {
    object, radius: SKIN_LIMB, height: 2 * SKIN_LIMB, center: new THREE.Vector3(0, 0, 0), openingRadius: R,
    anchors: { centre: new THREE.Vector3(0, 0, 0), openingNormal: new THREE.Vector3(0, 0, 1), holeRadius: hole, holeZ,
      duskTop: new THREE.Vector3(0, SKIN_LIMB, 0), starDirection: new THREE.Vector3(0, 0, -1) },
    weather, whorls: nWhorl, spinPhase, axis,
    update, ground: false,
  };
}

// ================================================================================================ THE STAR
// The face: a grain that boils. Cells of unlike size (about 17 m and 9 m across, mixed by a slow field) whose middles
// wander, each on its own period, so that they crawl, split and fade; each has a soft bright middle, and the lanes
// between them are dim and soft, never dark. Limb darkening from the angle to the eye (darker and redder at the
// edge, where the grain is finer by the slant alone); bright torches near the limb; a few small spots, each a dark
// heart in a border of fibres.
const FACE_FRAG = /* glsl */`
  precision highp float;
  #define NS 6
  uniform float uTime, uRate, uBallR;
  uniform vec3 uCentre, uWorld, cMid, cLimb, uOff;
  uniform vec4 uSpot[NS];
  varying vec3 vP;
  ${NOISE_GLSL}${BALL_GLSL}
  // x: distance to the nearest cell middle, y: how far inside the cell (0 on the lane), z: the cell's own number
  vec3 cells(vec3 p, float t){
    vec3 i=floor(p), f=fract(p); float d1=8., d2=8., id=0.;
    for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
      vec3 g=vec3(float(x),float(y),float(z)), h=h33(i+g);
      vec3 o=g+.5+.36*sin(t*(.45+.55*h.yzx)+h*6.2832)-f;
      float d=dot(o,o);
      if(d<d1){ d2=d1; d1=d; id=h.x; } else if(d<d2){ d2=d; }
    }
    d1=sqrt(d1); return vec3(d1, sqrt(d2)-d1, id);
  }
  void main(){
    vec3 eye=cameraPosition-uCentre, v=normalize(eye-vP), n=normalize(vP);
    if(ballMiss(cameraPosition-uWorld, -v, uBallR)<.5) discard;
    float mu=clamp(dot(n,v),0.,1.);
    float fw=length(fwidth(vP));
    float t=uTime*uRate;
    // a slow swell bends every border, so that no border is a ruled line and no two cells are of one size
    vec3 q1=vP/38.+uOff.yzx, q2=vP/90.+uOff;
    vec3 bend=vec3(vn3(q1+vec3(0.,t*.05,0.)), vn3(q1.zxy+11.), vn3(q1.yzx+23.))-.5;
    bend+=1.4*(vec3(vn3(q2+vec3(t*.02,0.,0.)), vn3(q2.zxy+5.), vn3(q2.yzx+17.))-.5);
    // THE GRAIN, which boils: cells of two sizes, mixed by a slow field that drifts, each with a soft bright middle
    // that swells and sinks on its own time; between them dim soft lanes that shift as the middles wander. No lane
    // goes dark. Finer cells ride on them from near. All go to their mean where a cell is under two pixels.
    vec3 gA=cells(vP/14.+uOff+bend*2.4, t), gB=cells(vP/7.5+uOff.zxy+bend*4.2, t*1.3);
    float size=smoothstep(.32,.68,vn3(vP/55.+uOff.zxy+vec3(t*.03,0.,0.)));
    // a cell's light: a round soft middle (by the way from its own middle) that sinks into the lane (by the way to the next cell)
    float topA=(1.-smoothstep(.12,.78,gA.x))*(.45+.55*smoothstep(0.,.5,gA.y))*(.75+.5*gA.z)*(.86+.14*sin(t*1.3+gA.z*40.));
    float topB=(1.-smoothstep(.12,.78,gB.x))*(.45+.55*smoothstep(0.,.5,gB.y))*(.75+.5*gB.z)*(.86+.14*sin(t*1.7+gB.z*40.));
    float gran=mix(topA, topB, size);
    vec3 g2=cells(vP/3.6+uOff.zxy+bend*7., t*1.6);
    gran*=mix(1., .7+.4*smoothstep(0.,.5,g2.y), 1.-smoothstep(1.2,4.,fw));
    gran=mix(gran, .62, smoothstep(3.5,9.,fw));
    // the large slow pattern: bright fields and dull fields
    float big=vn3(vP/95.+uOff.yzx+vec3(0.,uTime*.012,0.))*.6+vn3(vP/43.+uOff+vec3(uTime*.02,0.,0.))*.4;
    float L=(.6+.5*gran)*(.68+.64*big);
    // a few brighter fields, slow and broad, in which the grain burns whiter; and pores: here and there one cell of
    // the larger grain whose middle is sunk and dim, as dim as a lane and no dimmer
    float field=smoothstep(.6,.8,vn3(vP/62.+uOff.zxy+vec3(0.,0.,uTime*.01)+41.));
    L+=.3*field*(.4+.6*gran);
    L*=1.-.5*step(.93,gA.z)*(1.-smoothstep(.12,.5,gA.x))*(1.-.6*size);
    // bright torches near the limb: small fields that show where the face is seen aslant
    float torch=smoothstep(.58,.82,vn3(vP/14.+uOff.zxy+31.))*(1.-smoothstep(.3,.72,mu))*smoothstep(.04,.2,mu);
    L+=.42*torch*(1.-.5*gran);
    // spots: a dark heart, and round it a border of fibres that run out from the heart; small and slow
    float heart=0., border=0., fibre=0.;
    for(int i=0;i<NS;i++){ vec4 sp=uSpot[i]; if(sp.w<=0.) continue;
      vec3 e1=normalize(cross(sp.xyz, vec3(.31,.2,.93))), e2=cross(sp.xyz,e1);
      vec2 tp=vec2(dot(n,e1),dot(n,e2)); float rr=max(length(tp),1e-5);
      float a=acos(clamp(dot(n,sp.xyz),-1.,1.))/sp.w+.22*(vn3(vP/7.+sp.xyz*9.)-.5);
      float fb=vn3(vec3(tp/rr*6.,a*1.3)+sp.xyz*13.);
      float inb=1.-smoothstep(.82,1.08,a+.2*(fb-.5));
      if(inb>border){ border=inb; fibre=fb; }
      heart=max(heart, 1.-smoothstep(.34,.5,a)); }
    L*=mix(1., .5+.42*fibre, border);
    L*=mix(1., .32, heart);
    L=clamp(L,0.,1.3);
    // limb darkening: gold at the middle, fire gold then ember red at the edge; the lanes are fire gold everywhere
    // LIMB DARKENING, by the angle of the face to the eye: white hot where we look straight down into the star, gold
    // round that, a deeper gold orange toward the edge and ember at the very edge; and its light falls the same way.
    // The lanes between the cells are a deeper orange of the same place: the grain is told by colour as by light.
    float m=pow(mu,.72);
    vec3 cHot=vec3(1.,.9,.7), cEdge=cLimb*vec3(.9,.46,.22);
    vec3 tone=mix(cEdge, cLimb, smoothstep(0.,.4,m)); tone=mix(tone, cMid, smoothstep(.35,.8,m)); tone=mix(tone, cHot, .75*smoothstep(.8,1.,m));
    vec3 lane=tone*vec3(.86,.6,.42);
    vec3 col=mix(lane, tone, smoothstep(.38,.95,L))*(.22+.86*m*sqrt(m))*(.3+.92*L);
    gl_FragColor=vec4(col,1.);
  }
`;

// the fringe of spikes at the limb, the rayed outer glow and the long streamers: one shell round the star seen from
// behind (so it is right from any place, also from inside the glow). Every noise in it takes the star's seeded
// offset and the swell a seeded phase, so that no two seeds wear one crown. Both are worked out from how near the eye's ray passes the
// star's centre (x, in star radii) and where on the limb it passes (u): the rays stand on the star, not on the picture.
const GLOW_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime, uStarR, uBallR, uLively, uPhase;
  uniform vec3 uCentre, uWorld, cMid, cLimb, uOff, uQuiet;
  varying vec3 vP;
  ${NOISE_GLSL}${BALL_GLSL}
  void main(){
    vec3 ro=cameraPosition-uCentre, rd=normalize(vP-ro);
    float ts=-dot(ro,rd), dist=length(ro);
    vec3 c=ro+rd*max(ts,0.); float b=length(c), x=b/uStarR;
    vec3 u=c/max(b,1e-3);
    float toward=smoothstep(0.,.35,ts/max(dist,1.));
    // the outer glow: a half at the limb, nothing at 3.2 radii: a bright inner crown and long pale streamers in fine
    // rays, which swell and turn very slowly (a full change in about 40 s)
    float xo=max(x-1.,0.);
    float st=vn3(u*4.3+uOff+vec3(1.7,uTime*.011,5.))*.55+vn3(u*9.7+uOff.zxy+vec3(uTime*.016,2.,0.))*.45;
    st=smoothstep(.25,.85,st);
    float fr=.5+.5*vn3(u*38.+uOff.yzx+vec3(0.,0.,uTime*.03))+.4*(vn3(u*97.+uOff+3.)-.5);
    float swell=.85+.15*sin(uTime*.157+uPhase+u.x*3.+u.y*2.);
    float glow=(.3*exp(-xo*7.)+.17*exp(-xo*(4.1-2.8*st))*(.3+.7*st)*mix(1.,fr,smoothstep(0.,.4,xo)))*swell;
    glow*=1.-smoothstep(2.1,3.1,x);
    // THE LONG STREAMERS: narrow rays of the same light that stand straight out from the star, each to its own
    // length, the longest for two to three of its radii, with finer rays between; they turn and swell very slowly.
    // A ray is told by where round the star's outline the sight line passes (w), so that it is straight in every picture.
    vec3 e=ro/max(dist,1.), w=c-e*dot(c,e); w/=max(length(w),1e-3);
    float reach=.5+1.5*vn3(w*2.3+uOff.zxy+vec3(0.,uTime*.006,0.));
    float r1=vn3(w*6.+uOff.yzx+vec3(uTime*.008,0.,0.)), r2=vn3(w*17.+uOff+vec3(0.,0.,uTime*.012));
    r1=r1*r1*r1*2.4; r2=r2*r2*r2*r2*2.2;
    float far=(.25*r1+.13*r2*(.3+r1))*exp(-xo/reach)*smoothstep(.02,.4,xo)*(1.-smoothstep(2.7,3.7,xo))*swell;
    // THE CROWN'S QUIET SIDE (the join sheet's law of the entry: one dark bead on the star's face, no second dark
    // body against the crown): in the sector of the crown within about 40 degrees of the direction uQuiet (the moon's
    // side of the shadow's axis) the long streamers are still, so that the moon stands there before black sky
    far*=1.-smoothstep(.72,.9,dot(w,uQuiet));
    // the fringe: a fur of short spikes that flicker and lean
    vec3 uq=u*70.+uOff+vec3(uTime*.25*uLively, sin(uTime*.4+uPhase+u.y*9.)*.6, 0.);
    float spike=vn3(uq)*.6+vn3(uq*2.7+5.)*.4;
    float len=.005+.045*spike*spike*(.7+.5*sin(uTime*(1.1+spike)*uLively+u.z*31.));
    float fringe=.9*exp(-xo/max(len,1e-3))*step(1.,x);
    vec3 pale=vec3(.84,.9,1.);      // the far streamers are pearl, as a crown of light is
    vec3 col=mix(cMid, pale, smoothstep(0.,.45,xo))*glow+mix(cMid, vec3(1.,.95,.86), smoothstep(0.,.6,xo))*far+mix(cLimb, cMid, .6*spike)*fringe;
    gl_FragColor=vec4(col*toward*step(.985,x)*ballMiss(cameraPosition-uWorld, rd, uBallR),1.);
  }
`;

// the arches of fire: one mesh of tubes. Each loop breathes and leans in the vertex shader; its fire runs along it
// and bright knots rain down both legs. aInfo: (way along the loop 0..1, phase, breath period, lean period).
// how the arches move: each breathes between ARCH_BREATH[0] - ARCH_BREATH[1] and ARCH_BREATH[0] + ARCH_BREATH[1] of its
// height and sways ARCH_LEAN of its height either way across its own plane
const ARCH_BREATH = [0.975, 0.125], ARCH_LEAN = 0.14;
const ARCH_VERT = /* glsl */`
  attribute vec3 aRad, aLean; attribute vec4 aInfo; attribute vec2 aRing;
  uniform float uTime;
  varying vec3 vN, vW; varying vec4 vInfo; varying vec2 vRing;
  void main(){
    vRing=aRing;
    float br=${ARCH_BREATH[0].toFixed(3)}+${ARCH_BREATH[1].toFixed(3)}*sin(uTime*6.2832/aInfo.z+aInfo.y*6.2832);
    float ln=${ARCH_LEAN.toFixed(2)}*sin(uTime*6.2832/aInfo.w+aInfo.y*17.);
    vec3 p=position+aRad*(br-1.)+aLean*ln;
    vInfo=aInfo; vN=normalize(mat3(modelMatrix)*normal);
    vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz;
    gl_Position=projectionMatrix*viewMatrix*w;
  }`;
const ARCH_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime, uBallR; uniform vec3 uWorld, cLimb, cCore;
  varying vec3 vN, vW; varying vec4 vInfo; varying vec2 vRing;
  ${NOISE_GLSL}${BALL_GLSL}
  void main(){
    vec3 v=normalize(cameraPosition-vW);
    float face=clamp(abs(dot(normalize(vN),v)),0.,1.);
    float s=clamp(vInfo.x,0.,1.), leg=abs(s-.5)*2.;
    // threads run along the loop; the fire climbs it in clumps; the legs are bright, the crown faint
    float great=step(1.5,vInfo.y), sk=s*mix(7.,12.,great);
    float thr=vn3(vec3(vRing*2.3, sk-uTime*.22+vInfo.y*9.));
    float fn=vn3(vec3(sk-uTime*.5, vInfo.y*31., uTime*.1));
    float fire=(mix(.07,.3,great)+mix(2.3,1.7,great)*fn*fn)*(.4+1.3*thr*thr);
    // knots of fire rain down both legs; on the great arch they are many, of unlike strength and spacing, each a
    // clot on one side of the ribbon and not a bar across it
    float kw=leg*mix(2.3,6.,great)+great*.4*vn3(vec3(leg*11.,vInfo.y*5.,0.))-uTime/3.+vInfo.y*7.;
    float k=fract(kw)-.5, kn=vn3(vec3(floor(kw)*7.3,vInfo.y*13.,1.));
    float knot=exp(-k*k/.006)*smoothstep(.04,.2,leg)*mix(1., 2.*kn*kn*exp(-2.5*(vRing.x-(kn*2.-1.))*(vRing.x-(kn*2.-1.))), great);
    // the great arch (its phase is told apart by a whole 2 added to it) burns along its whole length, crown and all
    float foot=(1.-smoothstep(.86,1.,leg))*.75+.25, along=mix(.12,.3,great)+mix(.88,.5,great)*pow(leg,1.8);
    float body=pow(face,1.5), core=body*body;
    vec3 col=(cLimb*body*.85+cCore*1.2*core*thr)*fire*foot*along+cCore*knot*body*body*1.6;
    // THE GREAT ARCH IS A ROPE OF FIRE, not a tube: many fine threads run along it and wander across it, bright where
    // they bunch and dark between; its edges fray into loose threads; whole lengths of it burn low and others flare
    if(great>.5){
      float ax=clamp(vRing.x,-1.,1.);
      float wob=vn3(vec3(sk*.5, vInfo.y*3., uTime*.04))-.5;
      float t1=vn3(vec3(ax*2.6+wob*3., sk*.3-uTime*.1, vInfo.y*17.));
      float t2=vn3(vec3(ax*7.+wob*6., sk*.7-uTime*.26, vInfo.y*23.));
      float t3=vn3(vec3(ax*17.-wob*9., sk*1.6-uTime*.5, vInfo.y*29.));
      float rope=smoothstep(.36,.66,t1)*(.3+.9*smoothstep(.3,.72,t2))+.5*smoothstep(.55,.8,t3)*smoothstep(.3,.6,t2);
      float fray=1.-smoothstep(.35,1.,abs(ax)+.7*(vn3(vec3(sk*1.1-uTime*.15, ax*2.+3., vInfo.y*5.))-.5));
      float flare=vn3(vec3(sk*.45-uTime*.07, vInfo.y*41., 2.));
      float burn=(.3+1.9*flare*flare)*(.4+1.1*fn);
      vec3 fireC=mix(cLimb*vec3(1.,.72,.5), cCore, clamp(rope*rope,0.,1.));
      // its knots are clots of fire that run down one thread: long along the rope, narrow across it
      float clot=exp(-k*k/.02)*smoothstep(.04,.2,leg)*2.2*kn*kn*exp(-30.*(ax-.8*(kn*2.-1.))*(ax-.8*(kn*2.-1.)));
      col=fireC*rope*fray*burn*foot*(.45+.55*pow(leg,1.4))*1.5+cCore*clot*1.5;
    }
    gl_FragColor=vec4(col*smoothstep(0.,.25,face)*ballMiss(cameraPosition-uWorld, -v, uBallR),1.);
  }`;

export async function buildStar(ctx, opts = {}) {
  const R = opts.radius ?? 265, pal = { ...PALETTE, ...(opts.palette || {}) };
  const worldCentre = opts.worldCentre ? new THREE.Vector3().copy(opts.worldCentre) : new THREE.Vector3(0, 0, 900);
  const ballR = opts.worldRadius ?? 24;
  // the star's own stream: made from the seed and a name, it draws from no parent
  const rng = ctx.core.makeRng(ctx.core.hashSeed('star:' + ctx.seed));
  // the temper, when the caller names none, and the count of low arches are drawn from streams of their own
  const temperDraw = ctx.core.makeRng(ctx.core.hashSeed('star-temper:' + ctx.seed)).pick(['calm', 'restless']);
  const lowDraw = ctx.core.makeRng(ctx.core.hashSeed('low-arches:' + ctx.seed)).int(14, 18);
  const temper = ['calm', 'restless', 'vast'].includes(opts.temper) ? opts.temper : temperDraw;
  const off = new THREE.Vector3(rng.range(-30, 30), rng.range(-30, 30), rng.range(-30, 30));
  const object = new THREE.Group();
  const centre = { value: new THREE.Vector3() }, tU = { value: 0 }, uWorld = { value: worldCentre }, uBallR = { value: ballR };
  const cMid = { value: lin(pal.starMid) }, cLimb = { value: lin(pal.starLimb) }, cCore = { value: lin(pal.core) };

  // spots: three to six, each under 50 m across, on the half of the star that faces the world; they drift slowly
  const nSpot = temper === 'restless' ? 6 : temper === 'calm' ? 3 : 4, spots = [], uSpot = [];
  for (let i = 0; i < 6; i++) {
    const a = rng.range(0, Math.PI * 2), b = rng.range(0.25, 1.15);
    spots.push({ a, b, rad: rng.range(13, 24) / R, drift: rng.range(0.0008, 0.0022) * rng.sign() });
    uSpot.push(new THREE.Vector4(0, 0, 1, 0));
  }
  const faceGeo = new THREE.SphereGeometry(R, 96, 40);
  await ctx.yield();
  const face = new THREE.Mesh(faceGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: tU, uRate: { value: temper === 'restless' ? 0.62 : 0.42 }, uBallR, uCentre: centre, uWorld, cMid, cLimb, uOff: { value: off }, uSpot: { value: uSpot } },
    vertexShader: POS_VERT, fragmentShader: FACE_FRAG, fog: false }));
  object.add(face);
  await ctx.yield();

  // the glow's own stream: the phase of its slow swell (its noise takes the star's seeded offset)
  const glowPhase = ctx.core.makeRng(ctx.core.hashSeed('star-glow:' + ctx.seed))() * Math.PI * 2;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(R * 4.8, 48, 24), new THREE.ShaderMaterial({
    uniforms: { uTime: tU, uStarR: { value: R }, uBallR, uLively: { value: temper === 'restless' ? 1.5 : 1 }, uCentre: centre, uWorld, cMid, cLimb, uOff: { value: off }, uPhase: { value: glowPhase },
      uQuiet: { value: opts.quiet ? new THREE.Vector3().copy(opts.quiet).normalize() : new THREE.Vector3(0, 0, -1) } },
    vertexShader: POS_VERT, fragmentShader: GLOW_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  glow.frustumCulled = false; glow.renderOrder = 1;
  object.add(glow);
  await ctx.yield();

  // ---- the arches: loops of fire whose feet stand on the star. The tall ones stand on the limb as the shadow's axis
  // sees it (a ring 14 to 24 degrees toward the world from the star's own outline), evenly round it by a draw.
  const NSEG = 48, NRING = 8, list = [];
  const tall = temper === 'calm' ? 6 : 5, low = temper === 'calm' ? 3 : temper === 'restless' ? lowDraw : 4;
  const a0 = rng.range(0, Math.PI * 2);
  if (temper === 'vast') list.push({ al: a0 + Math.PI * 2 * 5.5 / 6, be: 20 * DEG, H: 200, span: Math.PI / 2, tube: 12, tw: 0 });
  for (let i = 0; i < tall; i++) {
    const H = rng.range(92, 160);
    list.push({ al: a0 + (i + rng.range(-0.3, 0.3)) * Math.PI * 2 / (temper === 'vast' ? 6 : tall), be: rng.range(14, 24) * DEG, H,
      span: H * rng.range(0.55, 0.95) / R, tube: rng.range(6.5, 10) * (0.8 + H / 400), tw: rng.range(-0.6, 0.6) });
  }
  for (let i = 0; i < low; i++) {
    const H = rng.range(20, 50);
    list.push({ al: rng.range(0, Math.PI * 2), be: rng.range(4, 34) * DEG, H, span: H * rng.range(0.8, 1.5) / R, tube: rng.range(2.6, 4.6), tw: rng.range(-1.2, 1.2) });
  }
  for (const A of list) { A.phase = rng(); A.T1 = rng.range(20, 40); A.T2 = rng.range(15, 30); A.skew = rng.range(-0.45, 0.45); A.crown = rng.range(0.5, 0.9); }
  // THE GREAT ARCH, on every seed: one tall loop, placed by the star's own geometry and by the route (opts.great).
  // BOTH ITS FEET stand on the star's face in the plan direction `foot` from the star's centre, one above the other,
  // 270 to 320 m apart (so that it is an arch and a bridge, never a hoop). ITS HEIGHT is a share of the star's own
  // radius, drawn from `height`. ITS LEAN is found from the route's clear distance: standing straight out it would
  // reach too near the route, so it leans over across the line from the star to its world (the star's own z) by
  // the least lean at which its top, at rest, stands `reach` metres (drawn) from the nearest of the caller's
  // `places` (the whole route, in the star's frame); and further, if it must, until no strand of it, ribbon and
  // all, at its furthest breath and either sway, comes within `clear` metres of any of them. How thick it is and
  // how it moves are drawn from the same stream of its own.
  if (opts.great) {
    const rg = ctx.core.makeRng(ctx.core.hashSeed('great-arch:' + ctx.seed)), G = opts.great;
    const height = R * rg.range(G.height[0], G.height[1]), reach = rg.range(G.reach[0], G.reach[1]), feet = rg.range(270, 320);
    const gf = new THREE.Vector3(G.foot.x, 0, G.foot.z).normalize(), side = Math.sign(gf.x) || 1;
    // (the loop's own cross direction, f x a, points from this foot toward the star's z axis when the foot stands at x over 0)
    const A = { f: gf, a: new THREE.Vector3(0, 1, 0), tw: 0, be: 0, al: 0, H: height, over: 0, span: 2 * Math.asin(feet / 2 / R), tube: rg.range(14, 18),
      phase: 2 + rg(), T1: rg.range(30, 44), T2: rg.range(22, 34), skew: rg.range(-0.15, 0.15), crown: rg.range(0.62, 0.8), great: true };
    if (G.places && G.places.length) {
      await ctx.yield();
      // only the places the arch could come near at all are counted
      const near = G.places.filter((p) => p.length() < R + 1.5 * height + G.reach[1] + 2 * A.tube);
      // its top at rest for a lean: the crown of its first strand (the law of centreLine in finishStar)
      const bin = new THREE.Vector3().crossVectors(A.f, A.a).normalize(), th = A.skew * 0.25 * A.span, top = new THREE.Vector3();
      const topFrom = (over) => { top.copy(A.f).multiplyScalar(Math.cos(th)).addScaledVector(A.a, Math.sin(th)).multiplyScalar(R * 0.985 + A.H).addScaledVector(bin, A.H * side * over);
        let best = Infinity; for (const p of near) best = Math.min(best, p.distanceTo(top)); return best; };
      const LEAN_MOST = 2; let lo = 0, hi = LEAN_MOST;
      if (topFrom(0) < reach) { for (let i = 0; i < 16; i++) { const mid = 0.5 * (lo + hi); if (topFrom(mid) < reach) lo = mid; else hi = mid; } A.over = side * hi; }
      await ctx.yield();
      if (leastFrom(A, R, near) < G.clear) {
        lo = Math.abs(A.over); hi = LEAN_MOST;
        for (let i = 0; i < 12; i++) { const mid = 0.5 * (lo + hi); A.over = side * mid; if (leastFrom(A, R, near) < G.clear) lo = mid; else hi = mid; if (i % 3 === 2) await ctx.yield(); }
        A.over = side * hi;
      }
      await ctx.yield();
    }
    list.push(A);
  }
  object.userData.arches = list;
  return finishStar(ctx, { object, R, list, NSEG, NRING, tU, centre, uWorld, uBallR, cLimb, cCore, spots, uSpot, nSpot, temper });
}

// the three strands of one loop: the second and third a little lower, narrower and leaner
const strandsOf = (A) => [0, 1, 2].map((k) => ({ ...A, H: A.H * (A.great ? [1, 0.94, 0.88] : [1, 0.84, 0.66])[k], span: A.span * (A.great ? [1, 0.9, 1.07] : [1, 0.9, 0.78])[k], tube: A.tube * [1, 0.8, 0.62][k],
  tw: A.tw + (A.great ? [0, 0.2, -0.17] : [0, 0.32, -0.27])[k], skew: A.skew + (A.great ? [0, 0.2, -0.24] : [0, 0.25, -0.3])[k], phase: A.phase + k * 0.31, T2: A.T2 * [1, 1.2, 0.85][k], main: k === 0 }));
// how near the strands of a loop that is given by its own frame (A.f toward its middle, A.a along it) come to any of
// `places` (in the star's frame), ribbon and all, at the furthest breath and either sway: the laws of finishStar and ARCH_VERT
function leastFrom(A0, R, places) {
  const f = new THREE.Vector3(), a = new THREE.Vector3(), bin = new THREE.Vector3(), dir = new THREE.Vector3(), c = new THREE.Vector3(), far = ARCH_BREATH[0] + ARCH_BREATH[1]; let best = Infinity;
  for (const A of strandsOf(A0)) {
    f.copy(A.f); a.copy(A.a); bin.crossVectors(f, a).normalize();
    a.multiplyScalar(Math.cos(A.tw)).addScaledVector(bin, Math.sin(A.tw)).normalize(); bin.crossVectors(f, a).normalize();
    for (let i = 0; i <= 48; i++) {
      const s = i / 48, th = (s + A.skew * s * (1 - s) - 0.5) * A.span, lift = Math.pow(Math.max(Math.sin(Math.PI * s), 0), A.crown), rT = A.tube * (0.62 + 0.5 * Math.sin(Math.PI * s));
      dir.copy(f).multiplyScalar(Math.cos(th)).addScaledVector(a, Math.sin(th));
      for (const ln of [-ARCH_LEAN, ARCH_LEAN]) {
        c.copy(dir).multiplyScalar(R * 0.985 + A.H * lift * far).addScaledVector(bin, A.H * lift * ((A.over || 0) + ln));
        for (const p of places) { const d = p.distanceTo(c) - rT; if (d < best) best = d; }
      }
    }
  }
  return best;
}

// the arches' one mesh, and what the star hands back
async function finishStar(ctx, S) {
  const { object, R, NSEG, NRING } = S;
  // each loop is three strands: the second and third a little lower, narrower and leaner
  const list = [];
  // (the great arch's strands are ropes of one bridge: they stand on feet a little apart, lean across one another and
  // meet near its crown, so that it is one braided arch and neither three arches nor three hoops one inside the other)
  for (const A of S.list) list.push(...strandsOf(A));
  const nv = list.length * (NSEG + 1) * NRING;
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), rad = new Float32Array(nv * 3), lean = new Float32Array(nv * 3), info = new Float32Array(nv * 4), ring = new Float32Array(nv * 2), idx = [];
  const f = new THREE.Vector3(), a = new THREE.Vector3(), bin = new THREE.Vector3(), dir = new THREE.Vector3(), c = new THREE.Vector3(), c2 = new THREE.Vector3(),
    tan = new THREE.Vector3(), nrm = new THREE.Vector3(), q = new THREE.Vector3();
  const centreLine = (A, s, out) => {
    const th = (s + A.skew * s * (1 - s) - 0.5) * A.span, lift = Math.pow(Math.max(Math.sin(Math.PI * s), 0), A.crown);
    dir.copy(f).multiplyScalar(Math.cos(th)).addScaledVector(a, Math.sin(th));
    return out.copy(dir).multiplyScalar(R * 0.985 + A.H * lift).addScaledVector(bin, A.H * lift * (A.over || 0));   // a loop that leans over (A.over: the share of its height) is carried across its own plane as it rises
  };
  const anchors = { feet: [], tops: [] };
  let v = 0;
  for (let n = 0; n < list.length; n++) {
    const A = list[n];
    if (A.f) { f.copy(A.f); a.copy(A.a); } else {
      f.set(Math.cos(A.al) * Math.cos(A.be), Math.sin(A.al) * Math.cos(A.be), Math.sin(A.be));
      a.set(-Math.sin(A.al), Math.cos(A.al), 0);
    }
    bin.crossVectors(f, a).normalize();
    a.multiplyScalar(Math.cos(A.tw)).addScaledVector(bin, Math.sin(A.tw)).normalize(); bin.crossVectors(f, a).normalize();
    if (A.main) { anchors.feet.push(centreLine(A, 0, new THREE.Vector3()), centreLine(A, 1, new THREE.Vector3())); anchors.tops.push(centreLine(A, 0.5, new THREE.Vector3())); }
    const base = v;
    for (let i = 0; i <= NSEG; i++) {
      const s = i / NSEG, lift = Math.pow(Math.max(Math.sin(Math.PI * s), 0), A.crown);
      centreLine(A, Math.max(0, s - 0.004), c); centreLine(A, Math.min(1, s + 0.004), c2); tan.subVectors(c2, c).normalize();
      centreLine(A, s, c); q.copy(dir);
      nrm.crossVectors(bin, tan).normalize();
      const rT = A.tube * (0.62 + 0.5 * Math.sin(Math.PI * s));
      for (let j = 0; j < NRING; j++, v++) {
        const ph = (j / NRING) * Math.PI * 2, cs = Math.cos(ph), sn = Math.sin(ph);
        const nx = nrm.x * cs + bin.x * sn, ny = nrm.y * cs + bin.y * sn, nz = nrm.z * cs + bin.z * sn;
        // a ribbon: broad in the loop's own plane, thin across it
        pos[v * 3] = c.x + (nrm.x * cs + bin.x * sn * 0.4) * rT; pos[v * 3 + 1] = c.y + (nrm.y * cs + bin.y * sn * 0.4) * rT; pos[v * 3 + 2] = c.z + (nrm.z * cs + bin.z * sn * 0.4) * rT;
        ring[v * 2] = cs; ring[v * 2 + 1] = sn;
        nor[v * 3] = nx; nor[v * 3 + 1] = ny; nor[v * 3 + 2] = nz;
        rad[v * 3] = q.x * A.H * lift; rad[v * 3 + 1] = q.y * A.H * lift; rad[v * 3 + 2] = q.z * A.H * lift;
        lean[v * 3] = bin.x * A.H * lift; lean[v * 3 + 1] = bin.y * A.H * lift; lean[v * 3 + 2] = bin.z * A.H * lift;
        info[v * 4] = s; info[v * 4 + 1] = A.phase; info[v * 4 + 2] = A.T1; info[v * 4 + 3] = A.T2;
        if (i < NSEG) { const k = base + i * NRING + j, k2 = base + i * NRING + (j + 1) % NRING; idx.push(k, k2, k + NRING, k2, k2 + NRING, k + NRING); }
      }
      if (i % 16 === 15) await ctx.yield();   // a strand is laid in pieces: no step of the build holds the page for a whole strand
    }
    await ctx.yield();
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aRad', new THREE.BufferAttribute(rad, 3)); g.setAttribute('aLean', new THREE.BufferAttribute(lean, 3)); g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); g.setAttribute('aRing', new THREE.BufferAttribute(ring, 2));
  g.setIndex(idx);
  const arches = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uTime: S.tU, uBallR: S.uBallR, uWorld: S.uWorld, cLimb: S.cLimb, cCore: S.cCore },
    vertexShader: ARCH_VERT, fragmentShader: ARCH_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  arches.frustumCulled = false; arches.renderOrder = 2;
  object.add(arches);
  const _v = new THREE.Vector3();
  function update(dt, time, camera) {
    S.tU.value = time;
    object.getWorldPosition(S.centre.value);
    for (let i = 0; i < 6; i++) {
      const sp = S.spots[i], al = sp.a + sp.drift * time;
      _v.set(Math.sin(sp.b) * Math.cos(al), Math.sin(sp.b) * Math.sin(al), Math.cos(sp.b));
      S.uSpot[i].set(_v.x, _v.y, _v.z, i < S.nSpot ? sp.rad : 0);
    }
  }
  update(0, 0, null);
  return { object, radius: R, height: 2 * R, center: new THREE.Vector3(0, 0, 0), anchors, temper: S.temper, arches: S.list.length,
    tall: S.list.filter((A) => A.H >= 90).length, great: S.list.find((A) => A.great) || null, update, ground: false };
}

// ------------------------------------------------------------------------------------------------ the moon of ice
// buildMoon(ctx, opts): THE MOON. One ball with its origin at its own centre, placed by the caller. Pale smooth plains
// of ice, long curving cracks with a raised ridge at either side, a few low domes, frost that glitters. It has no light
// of its own. LIT BY PLACE: by the star, less the share of the star's disc that the world hides as seen from each point
// of the ground (reckoned against the greatest share the world could hide from there, so that the outer shade of the
// world lies on the moon as a soft curved edge), and by the copper of the river of embers on the side that faces the
// shadow's axis. It turns slowly on itself by the clock.
const MOON_VERT = /* glsl */`varying vec3 vN; varying vec3 vW;
  void main(){ vN=normalize(position); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const MOON_FRAG = /* glsl */`
  uniform float uTime, uRate, uPhase, uStarR, uWorldR, uLaneCore, uLaneFull, uLaneZ1;
  uniform vec3 uSpinAxis, uSeed, uStar, uWorld, cIce, cCream, cCrack, cStar, cCopper;
  uniform vec4 uLine[9];
  uniform vec4 uDome[6];
  varying vec3 vN; varying vec3 vW;
  ${NOISE_GLSL}
  vec3 turn(vec3 v, vec3 k, float a){ return v*cos(a)+cross(k,v)*sin(a)+k*dot(k,v)*(1.-cos(a)); }
  // the ground's height at a place q of the moon's own frame (a unit vector), in units of about a metre; crack: how deep in a crack
  float ground(vec3 q, float fine, out float crack){
    vec3 w=q*2.3+uSeed;
    vec3 qw=normalize(q+.09*(vec3(vn3(w),vn3(w+7.3),vn3(w+13.1))-.5));
    float h=0.; crack=0.;
    for(int i=0;i<9;i++){
      float wd=uLine[i].w, d=abs(dot(qw,uLine[i].xyz)-.13*float(i-4))/wd;
      float cut=exp(-d*d), ridge=exp(-(d-2.1)*(d-2.1)*1.4);
      crack=max(crack,cut); h+=(-.55*cut+.4*ridge)*fine;
    }
    // a web of lesser cracks between them: the level lines of a slow noise
    float web=abs(vn3(qw*5.+uSeed.yzx)-.5)/.03, wc=exp(-web*web);
    crack=max(crack,.6*wc); h-=.3*wc*fine;
    for(int i=0;i<6;i++){ float s=(1.-dot(q,uDome[i].xyz))/uDome[i].w; h+=.9*exp(-s*s); }
    // smooth plains, and fields of broken ice between them
    float broken=smoothstep(.5,.7,vn3(q*2.1+uSeed.zxy));
    return h+.35*vn3(q*5.+uSeed.zxy)+broken*fine*(.22*vn3(q*38.+uSeed)+.1*vn3(q*90.+uSeed));
  }
  // the share of a disc of angular radius a that a disc of angular radius b hides when their middles stand d apart
  float hidden(float a, float b, float d){
    if(d>=a+b) return 0.;
    if(d<=abs(a-b)) return min(1.,(b*b)/max(a*a,1e-8));
    float x=clamp((d*d+a*a-b*b)/max(2.*d*a,1e-8),-1.,1.), y=clamp((d*d+b*b-a*a)/max(2.*d*b,1e-8),-1.,1.);
    float lens=a*a*acos(x)+b*b*acos(y)-.5*sqrt(max((-d+a+b)*(d+a-b)*(d-a+b)*(d+a+b),0.));
    return clamp(lens/max(3.14159265*a*a,1e-8),0.,1.);
  }
  void main(){
    vec3 n=normalize(vN), q=turn(n,uSpinAxis,-(uPhase+uTime*uRate));
    vec3 v=normalize(cameraPosition-vW);
    // detail finer than a pixel is faded by its own width
    float fw=max(length(dFdx(q)),length(dFdy(q))), fine=1.-smoothstep(.006,.03,fw);
    float crack, c1, c2;
    vec3 t1=normalize(cross(q,abs(q.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.))), t2=cross(q,t1);
    float e=max(.004,fw*1.5), h0=ground(q,fine,crack), hx=ground(normalize(q+t1*e),fine,c1), hy=ground(normalize(q+t2*e),fine,c2);
    vec3 nq=normalize(q-(t1*(hx-h0)+t2*(hy-h0))*(.04/e));
    vec3 nn=turn(nq,uSpinAxis,uPhase+uTime*uRate);
    // the ice: pale plains in two tones, cracks a little darker and bluer
    float tone=vn3(q*1.6+uSeed.yzx), tone2=vn3(q*7.+uSeed);
    vec3 ice=mix(cIce,cCream,smoothstep(.35,.7,tone))*(.9+.14*tone2);
    ice=mix(ice,mix(ice,cCrack,.3),smoothstep(.5,.7,vn3(q*2.1+uSeed.zxy)));
    ice=mix(ice,cCrack,.66*crack*fine);
    // the star's light, less what the world hides of its disc from this place
    vec3 toS=uStar-vW, toW=uWorld-vW; float dS=max(length(toS),1.), dW=max(length(toW),1.); vec3 l=toS/dS;
    float aS=asin(clamp(uStarR/dS,0.,1.)), aW=asin(clamp(uWorldR/dW,0.,1.)), sep=acos(clamp(dot(l,toW/dW),-1.,1.));
    float most=min(1.,(aW*aW)/max(aS*aS,1e-8)), share=hidden(aS,aW,sep)/max(most,1e-6);
    float sun=1.-.93*smoothstep(.04,.82,share);
    // THE STAR'S LIGHT ON THE ICE, by the ground's own facing to the star: full where it faces it, falling as it turns
    // away (the relief of ridges and cracks takes it: a lit flank and a shaded one), a warm low band where the star
    // stands low over the ball's own horizon, and the shadowed side beyond: a soft terminator, no line
    float ndl=dot(nn,l), gdl=dot(n,l);
    float lit=clamp(ndl,0.,1.)*(.45+.55*smoothstep(0.,.4,ndl)), sky=smoothstep(-.03,.3,gdl);
    vec3 low=mix(vec3(1.,.5,.28), vec3(1.,.84,.62), smoothstep(.0,.16,gdl)); low=mix(low, vec3(1.), smoothstep(.12,.5,gdl));
    vec3 col=ice*cStar*low*lit*sky*sun*1.3;
    // frost: small faces that flash where they mirror the star
    float spark=vn3(q*240.+uSeed), flash=pow(max(dot(reflect(-l,nn),v),0.),24.);
    col+=cStar*flash*sun*sky*(.1+2.4*pow(spark,6.)*(1.-smoothstep(.3,.9,fw*240.)));
    // the copper of the embers: the river runs in a sleeve round the shadow's axis, brightest at uLaneCore metres
    // from it, full as far as z uLaneFull and nothing by uLaneZ1. The ground takes its light by its own place: by
    // how far it lies from the river's core, by what the river has left at that z, and by how it faces the river
    // (upstream and toward the axis, where the river is full: the ground that looks downstream takes none).
    vec2 ax=vW.xy-uWorld.xy; float rAx=max(length(ax),1e-3), gap=max(rAx-uLaneCore,0.)/10.;
    float facing=smoothstep(0.,1.,dot(nn,normalize(vec3(-.6*ax/rAx,-.8))));
    float reach=1./(1.+gap*gap), along=1.-smoothstep(uLaneFull,uLaneZ1,vW.z);
    col+=ice*cCopper*(.004+.5*facing*reach*along);
    // a hairline of the star's light at the limb, seen from the night side
    float rim=1.-max(dot(n,v),0.);
    col+=cStar*.6*pow(rim,6.)*smoothstep(-.5,.1,dot(n,l))*sun;
    gl_FragColor=vec4(col,1.);
  }`;

export async function buildMoon(ctx, opts = {}) {
  const R = opts.radius || 21;
  // the moon's own stream: its turning, the lie of its cracks and domes, the tone of its ice
  const rng = ctx.core.makeRng(ctx.core.hashSeed('moon:' + ctx.seed));
  const unit = () => { const z = rng() * 2 - 1, a = rng() * Math.PI * 2, s = Math.sqrt(Math.max(0, 1 - z * z)); return new THREE.Vector3(s * Math.cos(a), z, s * Math.sin(a)); };
  const spinAxis = new THREE.Vector3(0.5 * (rng() - 0.5), 1, 0.5 * (rng() - 0.5)).normalize();
  const phase = rng() * Math.PI * 2, turnTime = 260 + 120 * rng(), sense = rng() < 0.5 ? -1 : 1;
  const seed = new THREE.Vector3(rng() * 40, rng() * 40, rng() * 40);
  // nine long cracks: each a circle of the ball about a pole of its own (the shader bends them); w: half its width
  const lines = []; for (let i = 0; i < 9; i++) { const p = unit(); lines.push(new THREE.Vector4(p.x, p.y, p.z, 0.007 + 0.011 * rng())); }
  // six low domes: where, and how broad
  const domes = []; for (let i = 0; i < 6; i++) { const p = unit(); domes.push(new THREE.Vector4(p.x, p.y, p.z, 0.008 + 0.02 * rng())); }
  const warm = rng();
  await ctx.yield();
  const uniforms = {
    uTime: { value: 0 }, uRate: { value: sense * Math.PI * 2 / turnTime }, uPhase: { value: phase },
    uSpinAxis: { value: spinAxis }, uSeed: { value: seed }, uLine: { value: lines }, uDome: { value: domes },
    uStar: { value: (opts.starCentre || new THREE.Vector3(0, 0, -900)).clone() }, uStarR: { value: opts.starRadius || 265 },
    uWorld: { value: (opts.worldCentre || new THREE.Vector3()).clone() }, uWorldR: { value: opts.worldRadius || 24 },
    uLaneCore: { value: opts.laneCore || 27 }, uLaneFull: { value: opts.laneFull || 190 }, uLaneZ1: { value: opts.laneZ1 || 230 },
    cIce: { value: lin('#dfe8ee') }, cCream: { value: lin('#efe4cc').lerp(lin('#e6e9e4'), warm * 0.6) },
    cCrack: { value: lin('#8e6f5c').lerp(lin('#7f97ad'), warm) },
    cStar: { value: lin(opts.starColor || '#fff1d2') }, cCopper: { value: lin('#ffb884') },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: MOON_VERT, fragmentShader: MOON_FRAG, fog: false });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat);
  const object = new THREE.Group(); object.add(ball);
  await ctx.yield();
  const update = (dt, time) => { uniforms.uTime.value = time; };
  return { object, radius: R, height: 2 * R, center: new THREE.Vector3(0, 0, 0), turnTime, update, ground: false };
}
