// HERO of "cut-from-the-sky" (after Rene Magritte): THE CANVAS OF THE OTHER HOUR.
// A 220 x 165 m stretched canvas on a plain three-legged wooden easel 240 m tall, standing in the bay.
// The canvas is an OPENING, not a picture: every pixel seen through its rectangle shows the other hour
// (from the noon side: starry night, a crescent, a sunlit green sea; from the night side: noon cumulus over
// the slate bay), with one ruled horizon through both. Its edge is a made thing: white primed cloth folded
// over a 3 m stretcher, domed tack heads every 6 m with highlight and small grey shadow, the wooden bar behind.
//
//
// EXPORTS (the world is shaded by these and nothing else; all unlit, no fog, no lights, no textures, no full-screen pass)
//   CFS.uniforms          one shared uniform set: canvas plane (uCvO/U/V/N/H), key (uKey), crescent (uMoon), style seconds
//                         (uT = u * 45), sea level (uSeaY), cloud arrangement (uSeed), pigments (uP[10])
//   STYLE_GLSL            cfsMeet/cfsInside/cfsCross/cfsSide/cfsWhich (rectangle test), cfsNoon/cfsNight/cfsHour(ray, which,
//                         dir, px) (the two skies; dir -1 = a cut's reversed drift), cfsCutRay, cfsSea, cfsRamp/cfsPaint
//   skyMaterial() / makeSkyDome()   sky AND sea of both hours at infinity in one draw (renderOrder -0.5, no depth write)
//   paintMaterial({ mode, mirror, clip })   a solid: local colour in the vertex attribute "color", five-value ramp against
//                         uKey, aFx.x highlight, aFx.y = 1 flat decal. mode 1 = ordinary thing (hidden when its sight line
//                         crosses the canvas plane beside the opening), 0 = never hidden, 2 = the easel behind the picture.
//                         mirror: the y-flipped image in the water (same geometry, renderOrder -0.4). clip: cut at sea level.
//   cutMaterial({ mode, fold, clip, vertexShader })   a cut full of noon sky by view ray; CUT_VERT (aSway), CUT_FRAG
//   makeDoves(n) / doveGeometry() / DOVE_VERT   the flat sky-doves, one draw; fill .pos/.fly per frame and commit()
//   makeMesher(), addBeam, addLathe, curtainGeometry, addBilboquet   geometry helpers (painted solids and cuts)
//   CFS_PALETTE, CFS_MIX  the brief's pigments and mixes
//
// ADDED BY THE WORLD BUILD: every buildHero() makes its OWN uniform set (freshUniforms()), so two copies of the world never
//   share drift or placement; the hero returns style = { uniforms, paint(opts), cut(opts), doves(n), skyDome() } bound to it,
//   and the world shades everything through hero.style. paintMaterial marks by aFx.y: 0 plain, 1 flat decal, 2 speckled
//   stone, 3 setts, 4 shutter slats, 5 roof tiles, 6 window pane (aFx.x = its phase; dims one at a time), 7 real cumulus,
//   8 ashlar (along uAsh.xy); makeMesher().kind sets the default mark. paintMaterial({ sway }) reads aSway (leaf tips);
//   cutMaterial({ mirror }) is a cut's image in the water (mesh.scale.y = -1); uSky.x = 1 packs the cumulus rows.
// buildHero(ctx, opts): opts.palette (the brief's seven), opts.detail (0.6..1), opts.sky (default true: adds the sky-and-sea
//   dome; pass false if the world adds its own makeSkyDome()), opts.mirror (true: images in the water), opts.beyond (true:
//   two demo curtains, a bilboquet and a stream of 18 doves behind the canvas; the world passes false and builds its own),
//   opts.stone (the rare stone edition: grey easel), opts.flipX (mirror key, crescent and anchors in x), opts.key / opts.moon
//   (world-space Vector3s to pin the key or the crescent; by default both ride with the hero so that the brief's placement,
//   anchors.placement, gives exactly the brief's world directions).
// Returns the contract plus setProgress(u) (call every frame: drift, sway, swell and doves are functions of u, never of the
//   clock; without it the viewer's time is used) and uniforms. The hero is its own origin: local y 0 = sea level, canvas
//   plane z = 0, noon side +Z, canvas centre (0, 92.5, 0). radius 135, height 240.
// ANCHORS (local): placement {position, rotationY} the brief's seat; canvas {center, normal, right, half sizes};
//   crossing {position (105,110,0), heading -Z}: where the path goes through, 5 m inside the edge, 2.6 m off its inner face;
//   flyThrough: seven points from the noon side through the opening (clearance is 2.6 m at the edge by the brief's own
//   wish, 6 m and more elsewhere); viewpoints {reveal, closest, far, behind}; edgeNear: the tacked inner face beside the
//   crossing; apex, feet; keyLocal, moonLocal; beyond (where the demo things stand); portalSeat null (the exit is elsewhere).
// COST: about 76k triangles and 10 draws with everything on (38k and 5 with beyond:false, mirror:false), build about
//   150 ms in steps under 30 ms. EXPECTS: post { flat: 1, bloom 0 }, no scene fog, a sea at local y 0 (drawn by the dome),
//   nothing else writing a sky. update() must be called every frame: it copies the hero's world matrix into the uniforms.
import * as THREE from 'three';

export const CFS_PALETTE = ['#6E9FCB', '#F2F0E8', '#C2C8D1', '#1A2236', '#2B3037', '#EEC455', '#5F8794'];
// the brief's mixes (styleNote 1), not in the seven-colour palette array
export const CFS_MIX = { horizon: '#BCD3E3', nightHorizon: '#2C3A55', metal: '#8F9498', slate: '#26333F', leaf: '#1F2E28', wood: '#B58850', shade: '#1E242B' };
const BRIEF_YAW = Math.PI - Math.atan2(68, 210);          // rotation.y that seats the hero as the brief's "space" says
const DRIFT_RATE = (45 * Math.PI / 180) / 45;              // outer clouds: 45 degrees over the 45 s flight

// ---------------------------------------------------------------------------------------------------------
// Shared uniforms: ONE object for every material of the world (pass CFS.uniforms into your own ShaderMaterials
// by spreading it, or simply use the factories below).
// ---------------------------------------------------------------------------------------------------------
const col = (h) => new THREE.Color(h);
export function freshUniforms() {
  return {
    uCvO: { value: new THREE.Vector3(0, 92.5, 0) },        // canvas centre (world)
    uCvU: { value: new THREE.Vector3(1, 0, 0) },           // canvas right (world, unit)
    uCvV: { value: new THREE.Vector3(0, 1, 0) },           // canvas up
    uCvN: { value: new THREE.Vector3(0, 0, 1) },           // canvas normal, pointing to the NOON side
    uCvH: { value: new THREE.Vector4(107.6, 80.1, 110, 82.5) }, // half size of the opening (xy) and of the outer edge (zw)
    uKey: { value: new THREE.Vector3(-0.6, 0.7, -0.4).normalize() }, // the one painted key, world
    uMoon: { value: new THREE.Vector3(0.2366, 0.2079, 0.949).normalize() }, // crescent direction, world
    uT: { value: 0 },                                      // style seconds = u * 45 (drift, sway, swell)
    uSeaY: { value: 0 },                                   // sea level, world
    uSeed: { value: 0 },                                   // whole number: which arrangement of the alike clouds
    uAsh: { value: new THREE.Vector4(1, 0, 0, 0) },        // xy: the ashlar wall's horizontal tangent in world xz
    uSky: { value: new THREE.Vector4(1, 0, 0, 0) },        // x: cloud rows packed (0 spaced, 1 packed)
    uP: { value: [col('#6E9FCB'), col('#BCD3E3'), col('#F2F0E8'), col('#C2C8D1'), col('#1A2236'), col('#2C3A55'),
      col('#26333F'), col('#5F8794'), col('#8E9AAE'), col('#3A4862')] },
  };
}
// the default set (the set-piece viewer and anything built without a hero); every buildHero() makes its OWN set, so two
// copies of the world (one seen through the other's portal) never share drift, seed or canvas placement
export const CFS = { uniforms: freshUniforms() };

// ---------------------------------------------------------------------------------------------------------
// STYLE_GLSL: the three chunks of the brief in one string (fragment and vertex safe, no derivatives inside).
//   cfsMeet / cfsInside / cfsCross / cfsSide / cfsWhich : the rectangle test
//   cfsNoon / cfsNight / cfsHour                        : the two skies as functions of a view ray
//   cfsSea                                              : slate bay or sunlit sea, with the reflected hour
//   cfsRamp / cfsPaint                                  : the five-value sign painter's modelling
// ---------------------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform vec3 uCvO; uniform vec3 uCvU; uniform vec3 uCvV; uniform vec3 uCvN; uniform vec4 uCvH;
uniform vec3 uKey; uniform vec3 uMoon; uniform float uT; uniform float uSeaY; uniform float uSeed; uniform vec3 uP[10];
uniform vec4 uAsh; uniform vec4 uSky;
#define CFS_ROW 0.19199
#define CFS_SROW 0.10472
#define CFS_TAU 6.2831853
float cfsH(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
// where the segment a->b meets the canvas plane, in canvas metres from its centre; z = 1 if it does
vec3 cfsMeet(vec3 a, vec3 b){
  float da=dot(a-uCvO,uCvN), db=dot(b-uCvO,uCvN);
  if(da*db>=0.) return vec3(0.);
  float t=da/(da-db); vec3 h=a+(b-a)*t-uCvO;
  return vec3(dot(h,uCvU),dot(h,uCvV),1.);
}
float cfsInside(vec3 m){ return m.z*step(abs(m.x),uCvH.x)*step(abs(m.y),uCvH.y); }
// +1: the sight line a->b goes through the opening; -1: it crosses the plane beside it; 0: it does not cross
float cfsCross(vec3 a, vec3 b){ vec3 m=cfsMeet(a,b); return m.z*(cfsInside(m)*2.-1.); }
float cfsSide(vec3 a){ return step(dot(a-uCvO,uCvN),0.); }           // 0 = noon side, 1 = night side
// the hour (0 noon, 1 night) in which the eye sees the point P
float cfsWhich(vec3 eye, vec3 P){ return abs(cfsSide(eye)-cfsInside(cfsMeet(eye,P))); }

// one cumulus cell. returns (signed distance in radians, positive inside; light 0..1). keep>0.5: only the few night clouds
vec2 cfsCloudP(float az, float el, float keep, float pk){
  float row=floor(el/CFS_ROW);
  if(row<0.||row>5.) return vec2(-1.,0.);
  float elc=(row+.5)*CFS_ROW, cr=cos(elc);
  float n=max(4.,floor(mix(32.,54.,pk)*cr+.5)), cw=CFS_TAU/n;
  float a=az/cw+row*.37, c=floor(a), ci=mod(c,n);
  if(keep>.5){
    float sel=(1.-step(.5,abs(row-1.)))*(1.-step(.5,abs(mod(ci,5.)-1.)))+(1.-step(.5,abs(row-2.)))*(1.-step(.5,abs(mod(ci,7.)-3.)));
    if(sel<.5) return vec2(-1.,0.);
  }
  vec2 id=vec2(ci,row)+uSeed*vec2(7.,13.);
  float h1=cfsH(id+3.1), h2=cfsH(id+17.7), h3=cfsH(id+41.3);
  float w=CFS_ROW*(.40+.16*h1)*(row<.5?.8:1.);
  vec2 p=vec2((a-c-.5)*cw*cr, el-elc);
  p-=vec2((h2-.5)*max(cw*cr-w*1.15,0.), (h3-.5)*CFS_ROW*mix(.34,.08,pk));
  float y0=-w*.15, best=-1., lit=0.;
  for(int i=0;i<7;i++){
    float fi=float(i), hx=cfsH(id*7.+vec2(fi,5.)), hy=cfsH(id*7.+vec2(fi,23.));
    float t=(fi+.5)/3.5-1.;
    float r=w*(.085+.105*(1.-t*t)+.085*hx);
    vec2 cp=vec2(t*w*.37+(hy-.5)*w*.08, y0+r*(.42+.75*hy*(1.-abs(t))));
    vec2 dv=p-cp; float dd=r-length(dv);
    if(dd>best){ best=dd; lit=dot(dv,vec2(-.45,.89))/max(r,1e-5); }
  }
  float sd=min(best,p.y-y0);
  float val=clamp(.5+.40*lit+.50*((p.y-y0)/max(w*.40,1e-5)-.5),0.,1.);
  return vec2(sd,val);
}
vec2 cfsCloud(float az, float el, float keep){ return cfsCloudP(az,el,keep,uSky.x); }
float cfsAz(vec3 d){ return (abs(d.x)+abs(d.z)>1e-5)?atan(d.x,d.z):0.; }
vec3 cfsNoon(vec3 d, float drift, float px){
  float g=1.-clamp(d.y,0.,1.); g=g*g*g*g*g;
  vec3 c=mix(uP[0],uP[1],g);
  vec2 k=cfsCloud(cfsAz(d)+drift, asin(clamp(d.y,-1.,1.)), 0.);
  px=max(px,1e-5);
  return mix(c, mix(uP[3],uP[2],smoothstep(.30,.72,k.y)), smoothstep(-px,px,k.x));
}
vec3 cfsNight(vec3 d, float drift, float px){
  float g=1.-clamp(d.y,0.,1.); g=g*g*g*g*g;
  vec3 c=mix(uP[4],uP[5],g);
  px=max(px,1e-5);
  float az=cfsAz(d), el=asin(clamp(d.y,-1.,1.));
  // stars: one soft disc per cell, never under about 2.4 pixels across, never flickering
  float sr=floor(el/CFS_SROW), sec=(sr+.5)*CFS_SROW, scr=max(cos(sec),.02);
  float sn=max(3.,floor(60.*scr+.5)), scw=CFS_TAU/sn;
  float sa=az/scw+sr*.61, sc=floor(sa); vec2 sid=vec2(mod(sc,sn),sr);
  vec2 sp=vec2((sa-sc-.5)*scw*scr, el-sec)-(vec2(cfsH(sid+11.3),cfsH(sid+23.9))-.5)*CFS_SROW*.62;
  float r0=.0013*(.6+1.2*cfsH(sid+37.1)), r=max(r0,1.2*px);
  float st=(1.-smoothstep(r*.4,r,length(sp)))*step(.48,cfsH(sid+71.7))*step(0.,el)*clamp(r0*r0/(r*r)+.4,0.,1.);
  c=mix(c,uP[2],st*.92);
  vec2 k=cfsCloud(az+drift*.35, el, 1.);
  c=mix(c, mix(uP[9],uP[8],smoothstep(.30,.72,k.y)), smoothstep(-px,px,k.x));
  // the crescent: 5 degrees wide, flat lead white, no halo
  vec3 mr=normalize(cross(vec3(0.,1.,0.),uMoon)+vec3(1e-6,0.,0.)), mu=cross(uMoon,mr);
  vec2 q=vec2(dot(d,mr),dot(d,mu));
  float m=min(.0436-length(q), length(q-vec2(.0436*.40,.0436*.12))-.0436*.90);
  return mix(c,uP[2],smoothstep(-px,px,m)*step(0.,dot(d,uMoon)));
}
// the ray a cut is filled with: folded above the horizon and lifted 9 degrees, so a cut low in the view is still blue
// sky with cumulus in it and never the pale horizon band
vec3 cfsCutRay(vec3 d){
  float el=asin(clamp(abs(d.y),0.,1.))*.88+.157;
  vec2 h=d.xz+vec2(0.,1e-6);
  return vec3(normalize(h)*cos(el),sin(el)).xzy;
}
// the noon INSIDE a cut: the same sky and the same alike cumulus (4 to 7 degrees wide), but set closer in their rows and
// with a second set of rows between the first, so that every curtain, back and dove carries whole clouds, white top and
// grey underside, and no cut is a sheet of plain blue. (His sky-birds hold a fuller sky than the one they fly in.)
vec3 cfsNoonCut(vec3 d, float drift, float px){
  float g=1.-clamp(d.y,0.,1.); g=g*g*g*g*g;
  vec3 c=mix(uP[0],uP[1],g);
  float az=cfsAz(d)+drift, el=asin(clamp(d.y,-1.,1.));
  vec2 k=cfsCloudP(az,el,0.,.55), k2=cfsCloudP(az+1.31,el+CFS_ROW*.5,0.,.55);
  if(k2.x>k.x) k=k2;
  px=max(px,1e-5);
  return mix(c, mix(uP[3],uP[2],smoothstep(.30,.72,k.y)), smoothstep(-px,px,k.x));
}
// which: 0 noon, 1 night. dir: +1 for the sky itself, -1 inside a cut (its clouds slide the other way)
vec3 cfsHour(vec3 d, float which, float dir, float px){
  float drift=dir*uT*${DRIFT_RATE.toFixed(6)};
  if(which<.5) return cfsNoon(d,drift,px);
  return cfsNight(d,drift,px);
}
// his sea is ruled with alike wavelets: one short bowed crest to a cell in staggered rows, riding with the swell; each
// gives way to the flat average before it is finer than about three pixels. fp: a pixel's footprint along the sight line
float cfsCrest(vec3 P, float fp){
  float fade=1.-smoothstep(.2,.55,fp);
  if(fade<=0.) return 0.;
  vec2 q=vec2(dot(P.xz,vec2(.94,.34)), dot(P.xz,vec2(-.34,.94))+uT*.9);
  vec2 g=vec2(q.x/9.,q.y/4.2); g.x+=.5*mod(floor(g.y),2.);
  vec2 id=floor(g), f=fract(g)-.5;
  f-=(vec2(cfsH(id+3.),cfsH(id+9.))-.5)*.3;
  float x=f.x*9., a=2.5+1.3*cfsH(id+21.), xa=clamp(x/a,-1.,1.), arch=1.-xa*xa;
  float z=f.y*4.2-.42*arch, e=max(fp*.8,.03), th=.36*arch;
  return fade*smoothstep(-e,e,z+th)*(1.-smoothstep(-e,e,z))*step(abs(x),a);
}
// the sea at world point P seen from eye, in the hour "which": slate bay under noon, sunlit green under night
vec3 cfsSea(vec3 P, vec3 eye, float which, float px){
  vec3 v=P-eye; float dist=length(v); vec3 ray=v/max(dist,1e-4);
  float fade=1./(1.+dist*.006);
  vec2 wv=vec2(sin(P.x*.21+P.z*.13+uT*.55)+sin(P.z*.37-uT*.36), sin(P.z*.19-P.x*.11+uT*.43)+sin(P.x*.31+uT*.29));
  vec3 r=normalize(vec3(ray.x,abs(ray.y)+.02,ray.z)+vec3(wv.x,0.,wv.y)*mix(.006,.016,which)*fade);
  vec3 m=cfsMeet(P+vec3(0.,.02,0.), P+r*30000.);
  float in2=cfsInside(m);
  float g=1.-clamp(r.y,0.,1.); g=g*g*g*g*g; float w2=abs(which-in2);
  vec3 sky=mix(mix(uP[0],uP[1],g),mix(uP[4],uP[5],g),w2);          // the water takes the hour's sky, not its clouds
  float bar=m.z*step(abs(m.x),uCvH.z)*step(abs(m.y),uCvH.w)*(1.-in2);
  sky=mix(sky,uP[2]*.92,bar);
  vec3 base=mix(uP[6]*.90,uP[7]*1.10,which);                     // measured: lands on #26333F and #5F8794 after the reflection
  float band=sin(dot(P.xz,vec2(.021,.046))+uT*.55+.6*sin(dot(P.xz,vec2(-.013,.008))))*.5+.5;
  band=band*band*(3.-2.*band);
  base*=1.+(.05+.11*which)*(band*2.-1.)/(1.+dist*dist*2.5e-6);
  // near the eye, short wavelets ride the long bands (gone before they are finer than a few pixels)
  float rp=sin(P.x*.83+P.z*.37+uT*1.1+1.7*sin(P.z*.21-uT*.4))*sin(P.z*1.21-P.x*.33-uT*.9);
  base*=1.+mix(.04,.09,which)*rp/(1.+dist*dist*4e-4);
  base*=1.+mix(.10,.20,which)*cfsCrest(P,dist*px*1.5/max(-ray.y,.03));
  float k=1.-clamp(-ray.y,0.,1.); k*=k; k*=k;
  vec3 c=mix(base,sky,mix(.012,.03,which)+mix(.07,.10,which)*k+.5*bar*(1.-k)+.16*in2);
  // the reflected ray goes through hour(): the cumulus of noon lie pale in the slate bay, the crescent, the stars and the
  // moonlit clouds in the sunlit sea; between them the water keeps its pigment exactly
  vec3 grad=mix(mix(uP[0],uP[1],g),mix(uP[4],uP[5],g),w2);
  vec3 img=cfsHour(r,w2,1.,px*2.5);
  return mix(c,img,mix(.10,.30,w2)*clamp(distance(img,grad)*1.6,0.,1.)*(1.-bar));
}
// his small marks, as a multiplier on the local colour. fp: the footprint of a pixel in metres; every mark gives way to
// its flat average before it is finer than about 3 pixels. kind: 2 speckled stone, 3 setts, 4 slats, 5 tiles, 8 ashlar
float cfsSpeck(vec3 P, float fp){
  float f1=1.-smoothstep(.010,.030,fp), f2=1.-smoothstep(.04,.13,fp), s=0.;
  if(f1>0.){ vec3 q=floor(P*40.); float h=cfsH(q.xz+q.y*17.13); s+=f1*(step(.9,h)-step(h,.13))*.16; }
  if(f2>0.){ vec3 q=floor(P*9.); float h=cfsH(q.xz*1.7+q.y*31.7+5.); s+=f2*(h-.5)*.10; }
  return s;
}
float cfsDetail(float kind, vec3 P, float fp, float fq){
  if(kind>9.5){                                                   // stucco ruled as banded masonry: level joints a value darker
    float fade=1.-smoothstep(.05,.14,fp), t=fract(P.y/.46);
    float joint=1.-smoothstep(0.,max(fq*.6,.008),min(t,1.-t)*.46-.02);
    return mix(.94,1.-.30*joint,fade);
  }
  if(kind<2.5) return 1.+cfsSpeck(P,fp);
  if(kind<3.5){
    float fade=1.-smoothstep(.07,.17,fp);
    vec2 g=vec2(P.x/.44,P.z/.27); g.x+=.5*mod(floor(g.y),2.);
    vec2 f=.5-abs(fract(g)-.5);
    float dm=min(f.x*.44,f.y*.27), joint=1.-smoothstep(0.,max(fq*.6,.006),dm-.016);
    return mix(.95,1.-.34*joint+(cfsH(floor(g))-.5)*.13,fade)+cfsSpeck(P,fp)*.6;
  }
  if(kind<4.5){
    float fade=1.-smoothstep(.018,.04,fp), t=fract(P.y/.13);
    float band=smoothstep(0.,.18,t)*(1.-smoothstep(.55,.8,t));
    return mix(.93,.80+.26*band,fade);
  }
  if(kind<5.5){
    float fade=1.-smoothstep(.045,.10,fp), row=floor(P.y/.30), t=fract(P.y/.30);
    float t2=abs(fract(P.z/.32+.5*mod(row,2.))-.5)*2.;
    return mix(.90,(1.-.24*(1.-smoothstep(0.,.3,t)))*(1.-.12*smoothstep(.75,1.,t2)),fade);
  }
  float fade=1.-smoothstep(.35,.8,fp), row=floor(P.y/1.86);
  vec2 g=vec2(dot(P.xz,uAsh.xy)/3.9+.5*mod(row,2.)+.31*mod(row,3.),P.y/1.86);
  vec2 f=.5-abs(fract(g)-.5);
  float dm=min(f.x*3.9,f.y*1.86), joint=1.-smoothstep(0.,max(fq*.6,.01),dm-.045);
  return mix(.96,1.-.30*joint+(cfsH(floor(g)+7.)-.5)*.10,fade)+cfsSpeck(P,fp);
}
// primed cloth folded over the stretcher (kind 9): a plain weave, seen only near and its flat average beyond, and one
// ruled grey selvedge thread along the folded sides. Measured in the canvas's own frame.
float cfsCloth(vec3 P, vec3 n, float fp){
  vec3 q=vec3(dot(P-uCvO,uCvU),dot(P-uCvO,uCvV),dot(P-uCvO,uCvN));
  vec3 a=abs(vec3(dot(n,uCvU),dot(n,uCvV),dot(n,uCvN)));
  float front=step(a.x,a.z)*step(a.y,a.z);
  vec2 t=front>.5?q.xy:(a.x>a.y?q.yz:q.xz);
  vec2 w=sin(t*39.27);
  float m=1.+.06*(1.-smoothstep(.016,.045,fp))*w.x*w.y;
  float wl=max(.05,fp*1.2), d=abs(q.z+1.45);
  m*=1.-.2*(1.-front)*(1.-smoothstep(wl*.5,wl,d))*min(1.,.1/wl+.3);
  return m;
}
// five smooth values against the fixed key; a little stiff, as he is
float cfsRamp(float ndl){ float x=clamp(ndl*.5+.5,0.,1.)*4.; return clamp((floor(x)+smoothstep(.18,.82,fract(x)))*.25,0.,1.); }
vec3 cfsPaint(vec3 local, float v, float hi){
  vec3 c=mix(local*vec3(.60,.64,.72), local, clamp(v/.75,0.,1.));
  return mix(c, mix(local,vec3(1.),.62), hi*smoothstep(.80,1.,v));
}
`;

// ---------------------------------------------------------------------------------------------------------
// Material factories. All unlit, all share CFS.uniforms, none uses fog, lights or textures.
// ---------------------------------------------------------------------------------------------------------
const own = (extra, U = CFS.uniforms) => Object.assign({}, U, extra);

// Sky AND sea of both hours at infinity: one draw. Needs no following: it uses the shader's own cameraPosition.
export function skyMaterial(U = CFS.uniforms) {
  return new THREE.ShaderMaterial({
    uniforms: own({}, U), depthWrite: false, side: THREE.BackSide, fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir=position; vec4 p=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.);
        if(abs(p.w)<1e-4) p.w=1e-4; gl_Position=p.xyww; }`,
    fragmentShader: STYLE_GLSL + /* glsl */`
      varying vec3 vDir;
      void main(){
        vec3 d=normalize(vDir+vec3(0.,1e-7,0.));
        float px=max(length(fwidth(d))*.7,1e-5), py=max(fwidth(d.y),1e-5);
        vec3 eye=cameraPosition;
        float which=cfsWhich(eye,eye+d*30000.);
        vec3 c=vec3(0.);
        float hz=smoothstep(-py,py,d.y);
        if(eye.y<=uSeaY+.05) hz=1.;
        if(hz>0.) c+=hz*cfsHour(vec3(d.x,max(d.y,0.),d.z),which,1.,px);
        if(hz<1.){
          float t=(eye.y-uSeaY)/max(-d.y,py*.5);
          vec3 P=eye+d*t;
          c+=(1.-hz)*cfsSea(P,eye,cfsWhich(eye,P),px);
        }
        gl_FragColor=vec4(c,1.);
      }`,
  });
}
export function makeSkyDome(U = CFS.uniforms) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(60, 3), skyMaterial(U));
  m.frustumCulled = false; m.renderOrder = -0.5; m.name = 'cfs-sky-and-sea';
  return m;
}

const PAINT_VERT = /* glsl */`
  attribute vec3 color; attribute vec2 aFx;
  #ifdef CFS_SWAY
    attribute float aSway;
  #endif
  uniform float uMirror; uniform float uSeaY; uniform float uT;
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vFx;
  void main(){
    vec4 w=vec4(position,1.); vec3 n=normal;
    #ifdef USE_INSTANCING
      w=instanceMatrix*w; n=mat3(instanceMatrix)*n;
    #endif
    w=modelMatrix*w; vN=mat3(modelMatrix)*n; vC=color; vFx=aFx;
    #ifdef CFS_SWAY
      w.x+=aSway*sin(uT*.9+w.z*.07+w.x*.05); w.z+=.5*aSway*sin(uT*.63+w.x*.09);
    #endif
    if(uMirror>.5){ float dp=max(w.y-uSeaY,0.);                 // height above the sea = depth of the image
      w.y=2.*uSeaY-w.y;
      w.x+=sin(dp*.55+uT*.9+w.z*.05)*min(dp*.03,.9); w.z+=sin(dp*.47-uT*.7+w.x*.05)*min(dp*.03,.9); }
    vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;
  }`;
const PAINT_FRAG = STYLE_GLSL + /* glsl */`
  uniform float uMode; uniform float uMirror; uniform float uClip;
  varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec2 vFx;
  void main(){
    vec3 eye=cameraPosition;
    vec3 ea=eye, pb=vW;
    if(uMirror>.5){ ea.y=2.*uSeaY-ea.y; pb.y=2.*uSeaY-pb.y; }      // the image is tested as the thing it mirrors
    float cr=cfsCross(ea,pb);
    if(uMode>.5&&uMode<1.5&&cr<-.5) discard;                       // a thing of the far side, seen past the canvas
    if(uMode>1.5&&cr>.5&&cfsSide(eye)<.5) discard;                 // the easel behind the picture
    if(uMirror<.5&&uClip>.5&&vW.y<uSeaY) discard;
    if(uMirror>.5&&vW.y>uSeaY) discard;
    vec3 n=normalize(vN+vec3(0.,1e-6,0.));
    if(gl_FrontFacing==(uMirror>.5)) n=-n;
    float kind=vFx.y, fpx=length(dFdx(vW)), fpy=length(dFdy(vW)), fp=max(sqrt(fpx*fpy),1e-4), fq=max(max(fpx,fpy),1e-4);
    vec3 c;
    if(kind>6.5&&kind<7.5){                                        // a real cumulus: lead white top, grey underside
      float hr=clamp((pb.y-vC.g)/max(vC.b,1e-3),0.,1.);              // height in the cloud (its foot and height ride in the colour)
      // each puff is modelled by the key like any solid (white where it faces the key, grey where it turns away), so the
      // puffs stand apart from one another seen from any side, above included; and the flat foot is grey
      float ao=clamp((1.-length(vN))*2.,0.,1.);                       // the crease between two puffs (see addCumulus)
      // and like the cumulus of the dome it is two-toned by height: a grey foot under a white top, the border between
      // them lifted on the side away from the key
      // them lifted on the side away from the key; and every puff has its own white crown and grey flank
      float v=.5*hr+.6*n.y+.2*dot(n,uKey)-.8*ao;
      c=mix(uP[3],uP[2],smoothstep(.18,.62,v));
    } else if(kind>5.5&&kind<6.5){                                 // a window pane: flat yellow, dimming one at a time
      float w=fract(uT*.03+vFx.x), dim=smoothstep(0.,.025,w)*(1.-smoothstep(.07,.095,w));
      c=mix(vC,vec3(.035,.045,.06),dim*.8);
    } else if(kind>.5&&kind<1.5){ c=vC;                            // flat decal: contact shadow, peg hole
    } else {
      float ndl=dot(n,uKey), ndv=abs(dot(n,normalize(ea-pb+vec3(0.,1e-6,0.))));
      c=cfsPaint(vC,cfsRamp(ndl),0.);
      // metal and turned wood: the form goes a value darker where it turns away at its edge, and the highlight is one
      // small pale spot in the same place on every one
      // (and the turning runs on through light and shade, so a ball seen from either side of the key is still a ball)
      c*=mix(1.,(.62+.58*(ndl*.5+.5))*(1.+.2*n.y),vFx.x);
      c*=1.-.34*vFx.x*(1.-smoothstep(0.,.62,ndv));
      c=mix(c,mix(vC,vec3(1.),.62),vFx.x*smoothstep(.9,.965,ndl));
      // and in its shade a reflected light, low on the side away from the key, as the academy models a ball: so a bell
      // seen from its dark side is still round (one value, never a second light: nothing else is lit by it)
      c*=1.+.46*vFx.x*smoothstep(.2,.9,dot(n,normalize(vec3(-uKey.x,-.45*uKey.y,-uKey.z))));
      if(kind>8.5&&kind<9.5) c*=cfsCloth(vW,n,fp); else if(kind>1.5) c*=cfsDetail(kind,vW,fp,fq);
    }
    if(uMirror>.5) c=mix(c,mix(uP[6],uP[7],cfsWhich(eye,vW)),.58);
    gl_FragColor=vec4(c,1.);
  }`;
// A solid: one local colour (vertex attribute "color", linear), five values, crisp edges.
//   mode 0: never hidden (easel, edge, headland, boulder, everything of the eye's own side is unaffected anyway)
//   mode 1: hidden when the sight line crosses the canvas plane BESIDE the opening (all ordinary things of either side)
//   mode 2: hidden when seen THROUGH the opening from the noon side (the easel's legs behind the picture)
//   mirror: draws the y-flipped image in the water (renderOrder -0.4, after the dome), tinted to the sea
//   clip:   discard below sea level (legs standing in the water)
// attributes: position, normal, color (vec3), aFx (x: highlight 0..1, y: 1 = flat decal in "color")
export function paintMaterial({ mode = 1, mirror = false, clip = false, sway = false } = {}, U = CFS.uniforms) {
  return new THREE.ShaderMaterial({
    uniforms: own({ uMode: { value: mode }, uMirror: { value: mirror ? 1 : 0 }, uClip: { value: clip ? 1 : 0 } }, U),
    vertexShader: (sway ? '#define CFS_SWAY\n' : '') + PAINT_VERT, fragmentShader: PAINT_FRAG, side: THREE.DoubleSide, fog: false,
  });
}

export const CUT_VERT = /* glsl */`
  attribute float aSway;
  uniform float uT;
  varying vec3 vW; varying float vSh;
  void main(){
    vec3 p=position;
    float s=aSway*sin(uT*.7+position.x*.045+position.y*.012);
    p.z+=s; p.x+=.35*aSway*sin(uT*.52+position.y*.02);
    vec4 w=vec4(p,1.);
    #ifdef USE_INSTANCING
      w=instanceMatrix*w;
    #endif
    w=modelMatrix*w; vW=w.xyz;
    vSh=clamp(.5-.5*dot(normalize(mat3(modelMatrix)*normal+vec3(0.,0.,1e-6)),vec3(-.6,.2,.77)),0.,1.);
    gl_Position=projectionMatrix*viewMatrix*w;
  }`;
export const CUT_FRAG = STYLE_GLSL + /* glsl */`
  uniform float uMode; uniform float uFold; uniform float uClip; uniform float uMirror;
  varying vec3 vW; varying float vSh;
  void main(){
    vec3 eye=cameraPosition;
    vec3 ea=eye, pb=vW;
    if(uMirror>.5){ ea.y=2.*uSeaY-ea.y; pb.y=2.*uSeaY-pb.y; if(vW.y>uSeaY) discard; }
    if(uMode>.5&&cfsCross(ea,pb)<-.5) discard;
    if(uMirror<.5&&uClip>.5&&vW.y<uSeaY) discard;
    vec3 d=normalize(vW-eye+vec3(0.,1e-6,0.));
    float px=max(length(fwidth(d))*.7,1e-5);
    vec3 c=cfsNoonCut(cfsCutRay(d),-uT*${DRIFT_RATE.toFixed(6)},px);                 // noon sky by view ray, drift reversed, cloud-rich
    c*=1.-uFold*vSh;
    if(uMirror>.5) c=mix(c,mix(uP[6],uP[7],cfsWhich(eye,vW)),.80);
    gl_FragColor=vec4(c,1.);
  }`;
// A cut full of noon sky: real outline geometry, pixel-hard, filled by view ray so the outline slides over a sky that
// stays at infinity. fold: 0.06 for curtains (their folds are shaded 6 percent), 0 for doves and the bowler-hatted backs.
// vertexShader: pass your own (doves) as long as it writes the varyings vW (world position) and vSh (0..1).
export function cutMaterial({ mode = 1, fold = 0, clip = false, mirror = false, vertexShader = CUT_VERT } = {}, U = CFS.uniforms) {
  return new THREE.ShaderMaterial({
    uniforms: own({ uMode: { value: mode }, uFold: { value: fold }, uClip: { value: clip ? 1 : 0 }, uMirror: { value: mirror ? 1 : 0 } }, U),
    vertexShader, fragmentShader: CUT_FRAG, side: THREE.DoubleSide, fog: false,
  });
}

// ---------------------------------------------------------------------------------------------------------
// A small triangle collector for painted solids (flat or given normals, local colour, highlight, decal flag).
// ---------------------------------------------------------------------------------------------------------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function makeMesher() {
  const P = [], N = [], C = [], F = [];
  const e1 = V(), e2 = V(), nn = V(), cc = V();
  const put = (p, n, c, hi, kind) => { P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); C.push(c.r, c.g, c.b); F.push(hi, kind || M.kind); };
  const M = {
    kind: 0,                                                 // default mark for whatever is added next (2 speckle, 3 setts, ...)
    count: () => P.length / 9,
    // flat triangle facing away from the point "inside"
    tri(a, b, c, inside, color, hi = 0, kind = 0) {
      nn.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
      if (nn.lengthSq() < 1e-12) return;
      nn.normalize(); cc.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(inside);
      if (nn.dot(cc) < 0) { nn.negate(); const t = b; b = c; c = t; }
      put(a, nn, color, hi, kind); put(b, nn, color, hi, kind); put(c, nn, color, hi, kind);
    },
    quad(a, b, c, d, inside, color, hi = 0, kind = 0) { M.tri(a, b, c, inside, color, hi, kind); M.tri(a, c, d, inside, color, hi, kind); },
    // smooth triangle with its own normals (wound to agree with them)
    triN(a, b, c, na, nb, nc, color, hi = 0, kind = 0) {
      nn.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
      if (nn.dot(na) < 0) { put(a, na, color, hi, kind); put(c, nc, color, hi, kind); put(b, nb, color, hi, kind); }
      else { put(a, na, color, hi, kind); put(b, nb, color, hi, kind); put(c, nc, color, hi, kind); }
    },
    // two rings of equal length joined by flat quads; closed rings
    loft(ra, rb, inside, color, hi = 0) {
      const n = ra.length;
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad(ra[i], ra[j], rb[j], rb[i], inside, color, hi); }
    },
    cap(ring, inside, color, hi = 0) {
      const c = V(); for (const p of ring) c.add(p); c.multiplyScalar(1 / ring.length);
      for (let i = 0; i < ring.length; i++) M.tri(c, ring[i], ring[(i + 1) % ring.length], inside, color, hi);
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(F, 2));
      g.computeBoundingSphere();
      return g;
    },
    // the same geometry made in short steps (one attribute to a step), for the big meshes: await M.geometryAsync(ctx.yield)
    async geometryAsync(tick) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); await tick();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); await tick();
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); await tick();
      g.setAttribute('aFx', new THREE.Float32BufferAttribute(F, 2)); await tick();
      g.computeBoundingSphere();
      return g;
    },
  };
  return M;
}

// chamfered, tapered rectangular beam from A to B. side: the direction of its width. wA/dA, wB/dB: width and depth.
export function addBeam(M, A, B, side, wA, dA, wB, dB, color, { ch = 0.12, capA = true, capB = true, hi = 0 } = {}) {
  const ax = V().subVectors(B, A).normalize();
  const dp = V().crossVectors(ax, side).normalize(), sd = V().crossVectors(dp, ax).normalize();
  const ring = (O, w, d) => {
    const c = Math.min(w, d) * ch, hw = w / 2, hd = d / 2, r = [];
    for (const [x, z] of [[hw - c, hd], [hw, hd - c], [hw, -hd + c], [hw - c, -hd], [-hw + c, -hd], [-hw, -hd + c], [-hw, hd - c], [-hw + c, hd]]) {
      r.push(V().copy(O).addScaledVector(sd, x).addScaledVector(dp, z));
    }
    return r;
  };
  const ra = ring(A, wA, dA), rb = ring(B, wB, dB), mid = V().addVectors(A, B).multiplyScalar(0.5);
  M.loft(ra, rb, mid, color, hi);
  if (capA) M.cap(ra, mid, color, hi);
  if (capB) M.cap(rb, mid, color, hi);
}
// a turned (lathe) solid about "axis" from origin O. profile: [radius, height] pairs from the base up. smooth normals.
export function addLathe(M, O, axis, profile, segs, color, hi = 0) {
  const ax = V().copy(axis).normalize();
  const u = V().crossVectors(ax, Math.abs(ax.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0)).normalize(), w = V().crossVectors(ax, u);
  const n = profile.length, nr = [], nh = [];
  for (let i = 0; i < n; i++) {
    const a = profile[Math.max(i - 1, 0)], b = profile[Math.min(i + 1, n - 1)];
    let dr = b[0] - a[0], dh = b[1] - a[1]; const l = Math.hypot(dr, dh) || 1;
    nr.push(dh / l); nh.push(-dr / l);
  }
  const pt = (i, j) => { const a = (j / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    return V().copy(O).addScaledVector(ax, profile[i][1]).addScaledVector(u, c * profile[i][0]).addScaledVector(w, s * profile[i][0]); };
  const nm = (i, j) => { const a = (j / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const v = V().addScaledVector(u, c * nr[i]).addScaledVector(w, s * nr[i]).addScaledVector(ax, nh[i]);
    return v.lengthSq() > 1e-9 ? v.normalize() : v.copy(ax); };
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
    const a = pt(i, j), b = pt(i, j + 1), c = pt(i + 1, j + 1), d = pt(i + 1, j);
    const na = nm(i, j), nb = nm(i, j + 1), nc = nm(i + 1, j + 1), nd = nm(i + 1, j);
    if (profile[i][0] > 1e-4) M.triN(a, b, c, na, nb, nc, color, hi);
    if (profile[i + 1][0] > 1e-4) M.triN(a, c, d, na, nc, nd, color, hi);
  }
}

// ---------------------------------------------------------------------------------------------------------
// The made edge: cloth-wrapped stretcher ring with tacks. Local space: canvas plane z = 0, noon side +Z.
// ---------------------------------------------------------------------------------------------------------
const HW = 110, HH = 82.5, CY = 92.5, BW = 2.4;
const RING_PROFILE = [[0, -1.75], [0, 0.75], [0.09, 0.93], [0.27, 1.0], [2.13, 1.0], [2.31, 0.93], [2.4, 0.75], [2.4, -1.75], [2.33, -1.93],
  [2.15, -2.0], [1.66, -2.0], [1.66, -2.34], [1.54, -2.48], [0.86, -2.48], [0.74, -2.34], [0.74, -2.0], [0.25, -2.0], [0.07, -1.93]];
const SIDES = [
  { t: V(1, 0, 0), o: V(0, 1, 0), L: HW, off: HH }, { t: V(1, 0, 0), o: V(0, -1, 0), L: HW, off: HH },
  { t: V(0, 1, 0), o: V(1, 0, 0), L: HH, off: HW }, { t: V(0, 1, 0), o: V(-1, 0, 0), L: HH, off: HW }];
const ringPoint = (S, s, z, a) => V(0, CY, z).addScaledVector(S.o, S.off - s).addScaledVector(S.t, a);

async function buildEdge(M, rng, detail, keyL, C, tick, rngFront) {
  const np = RING_PROFILE.length;
  for (const S of SIDES) {
    const inside = ringPoint(S, 1.2, -0.5, 0);
    for (let i = 0; i < np; i++) {
      const [s0, z0] = RING_PROFILE[i], [s1, z1] = RING_PROFILE[(i + 1) % np];
      const color = (i >= 10 && i <= 14) ? C.wood : C.white;
      // split along the length so the flat-normal test stays local and the long faces are not two slivers
      const cuts = 4;
      for (let c = 0; c < cuts; c++) {
        const f0 = c / cuts * 2 - 1, f1 = (c + 1) / cuts * 2 - 1;
        const a = ringPoint(S, s0, z0, f0 * (S.L - s0)), b = ringPoint(S, s0, z0, f1 * (S.L - s0));
        const cc = ringPoint(S, s1, z1, f1 * (S.L - s1)), d = ringPoint(S, s1, z1, f0 * (S.L - s1));
        const ins = V().copy(inside).addScaledVector(S.t, (f0 + f1) * 0.5 * (S.L - 1.2));
        M.quad(a, b, cc, d, ins, color, 0, color === C.white ? 9 : 0);      // cloth carries its weave and selvedge (kind 9)
      }
    }
  }
  await tick();
  // tacks: a domed head every 6 m on the outer and the inner face, each with highlight and small grey shadow
  const segs = detail > 0.8 ? 12 : 8;
  const dome = [[0.5, 0], [0.5, 0.035], [0.47, 0.075], [0.38, 0.118], [0.21, 0.15], [0, 0.16]];
  let made = 0;
  for (const S of SIDES) for (const inner of [0, 1]) {
    const s = inner ? BW : 0, nrm = V().copy(S.o).multiplyScalar(inner ? -1 : 1);
    const L = S.L - s - 3, n = Math.max(2, Math.round(2 * L / 6)), step = 2 * L / n;
    // the shadow falls away from the key, along the face
    const sh = V().copy(keyL).addScaledVector(nrm, -keyL.dot(nrm)).multiplyScalar(-1);
    if (sh.lengthSq() < 1e-6) sh.set(0, -1, 0); sh.normalize();
    for (let i = 0; i <= n; i++) {
      const a = -L + i * step + rng.range(-0.22, 0.22), z = -0.5 + rng.range(-0.1, 0.1);
      const O = ringPoint(S, s, z, a);
      addLathe(M, O, nrm, dome, segs, C.tack, 1);
      // contact shadow: a soft-cornered disc, under a quarter over the head's width, lying on the cloth
      const u = V().crossVectors(nrm, V(0, 0, 1)).normalize(), w = V(0, 0, 1);
      const So = V().copy(O).addScaledVector(nrm, 0.045).addScaledVector(sh, 0.3), pts = [];
      for (let k = 0; k < 10; k++) { const an = k / 10 * Math.PI * 2; pts.push(V().copy(So).addScaledVector(u, Math.cos(an) * 0.6).addScaledVector(w, Math.sin(an) * 0.6)); }
      const below = V().copy(So).addScaledVector(nrm, -1);
      for (let k = 0; k < 10; k++) M.tri(So, pts[k], pts[(k + 1) % 10], below, C.tackShadow, 0, 1);
      if (++made % 12 === 0) await tick();
    }
  }
  // the same tacks along the face of the cloth, midway between those of the sides, so that the edge is a made thing from
  // the front as well (the closest pass looks along this face). Rule: one head every 6 m of the ring's centre line, on all
  // four sides, jittered from a stream of its own.
  if (rngFront) for (const S of SIDES) {
    const nrm = V(0, 0, 1), L = S.L - 1.2 - 3, n = Math.max(2, Math.round(2 * L / 6)), step = 2 * L / n;
    const sh = V().copy(keyL).addScaledVector(nrm, -keyL.dot(nrm)).multiplyScalar(-1);
    if (sh.lengthSq() < 1e-6) sh.set(0, -1, 0); sh.normalize();
    for (let i = 0; i < n; i++) {
      const a = -L + (i + 0.5) * step + rngFront.range(-0.22, 0.22), O = ringPoint(S, 1.2 + rngFront.range(-0.1, 0.1), 1.0, a);
      addLathe(M, O, nrm, dome, segs, C.tack, 1);
      const So = V().copy(O).addScaledVector(nrm, 0.045).addScaledVector(sh, 0.3), pts = [];
      for (let k = 0; k < 10; k++) { const an = k / 10 * Math.PI * 2; pts.push(V().copy(So).addScaledVector(S.t, Math.cos(an) * 0.6).addScaledVector(S.o, Math.sin(an) * 0.6)); }
      const below = V().copy(So).addScaledVector(nrm, -1);
      for (let k = 0; k < 10; k++) M.tri(So, pts[k], pts[(k + 1) % 10], below, C.tackShadow, 0, 1);
      if (++made % 12 === 0) await tick();
    }
  }
  // the cloth's corner folds: a raised pleat on the upright edges at every corner, outer face
  for (const S of [SIDES[2], SIDES[3]]) for (const top of [-1, 1]) {
    const aC = top * (S.L - 0.25), aE = top * (S.L - 0.25 - 3.6);
    const p0 = ringPoint(S, -0.03, 0.7, aC), p1 = ringPoint(S, -0.2, -1.7, aC), p2 = ringPoint(S, -0.03, -1.7, aE);
    const q0 = ringPoint(S, 0, 0.7, aC), q1 = ringPoint(S, 0, -1.7, aC), q2 = ringPoint(S, 0, -1.7, aE);
    const ins = ringPoint(S, 0.6, -0.9, top * (S.L - 1.5));
    M.tri(p0, p1, p2, ins, C.white); M.quad(p0, p1, q1, q0, ins, C.white); M.quad(p1, p2, q2, q1, ins, C.white); M.quad(p2, p0, q0, q2, ins, C.white);
  }
}

// ---------------------------------------------------------------------------------------------------------
// The easel: plain, three-legged, wooden, 240 m tall. Everything of it is shaded in mode 2, so from the noon side
// the picture covers the legs behind it (they show above the canvas, under it and from the night side).
// ---------------------------------------------------------------------------------------------------------
async function buildEasel(M, rng, C, tick, v) {
  const footY = -6, apexY = 233, X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  const zAt = (y) => -5.4 - (y - 10) * 0.02;
  const xAt = (y) => v.splay + (3.3 - v.splay) * (y - footY) / (apexY - footY);
  const disc = (O, a, b, r, color, n = 10) => {              // flat decal disc in the plane of a and b
    const nrm = V().crossVectors(a, b).normalize(), below = V().copy(O).addScaledVector(nrm, -1), pts = [];
    for (let k = 0; k < n; k++) { const an = k / n * Math.PI * 2; pts.push(V().copy(O).addScaledVector(a, Math.cos(an) * r).addScaledVector(b, Math.sin(an) * r)); }
    for (let k = 0; k < n; k++) M.tri(O, pts[k], pts[(k + 1) % n], below, color, 0, 1);
  };
  // two front legs with their rows of peg holes
  for (const sx of [-1, 1]) {
    const F = V(sx * xAt(footY), footY, zAt(footY)), T = V(sx * 3.3, apexY, zAt(apexY));
    addBeam(M, F, T, X, 7.2, 4.6, 5.6, 4.0, C.wood, { ch: 0.1 });
    const ax = V().subVectors(T, F).normalize(), dp = V().crossVectors(ax, X).normalize(), sd = V().crossVectors(dp, ax).normalize();
    if (dp.z < 0) dp.negate();
    for (let y = 22 + v.holeOff; y < 222; y += v.holeStep) {
      const t = (y - footY) / (apexY - footY), dpt = 4.6 + (4.0 - 4.6) * t;
      const P = V().lerpVectors(F, T, t);
      disc(V().copy(P).addScaledVector(dp, dpt / 2 + 0.06), sd, ax, 0.95, C.hole);
      disc(V().copy(P).addScaledVector(dp, -dpt / 2 - 0.06), ax, sd, 0.95, C.hole);
    }
    // the peg that carries the tray
    addLathe(M, V(sx * xAt(4.5), 4.5, zAt(4.5) - 2.6), Z, [[0, 0], [1.3, 0], [1.3, 9.6], [1.05, 10.1], [0, 10.1]], 10, C.wood);
    await tick();
  }
  await tick();
  // the tray the canvas stands on, with its front lip
  const th = v.tray;
  addBeam(M, V(-th, 8, 1.75), V(th, 8, 1.75), Z, 7.7, 4, 7.7, 4, C.wood, { ch: 0.07 });
  addBeam(M, V(-th, 10.7, 4.95), V(th, 10.7, 4.95), Z, 1.1, 1.6, 1.1, 1.6, C.wood, { ch: 0.2 });
  // the top cleat that holds the canvas down, its lip and its knob
  addBeam(M, V(-30, 178.3, -2.3), V(30, 178.3, -2.3), Z, 10.4, 5.6, 10.4, 5.6, C.wood, { ch: 0.08 });
  addBeam(M, V(-30, 174.6, 2.0), V(30, 174.6, 2.0), Z, 1.6, 3.2, 1.6, 3.2, C.wood, { ch: 0.16 });
  addLathe(M, V(0, 178.3, 2.9), Z, [[0, 0], [1.1, 0], [1.1, 0.9], [2.3, 1.2], [2.6, 2.0], [2.3, 2.9], [1.2, 3.3], [0, 3.4]], 14, C.metal, 1);
  await tick();
  // head block, hinge bolt and wing nut
  addBeam(M, V(0, 226, -10.3), V(0, 240, -10.3), X, 11.5, 7.6, 9.2, 6.4, C.wood, { ch: 0.12 });
  addLathe(M, V(-7.6, 234, -10.3), X, [[0, 0], [1.6, 0], [1.6, 0.9], [0.8, 0.9], [0.8, 14.4], [1.5, 14.4], [1.5, 15.3], [0, 15.3]], 10, C.metal, 1);
  addBeam(M, V(8.2, 234.6, -10.3), V(8.6, 238.6, -8.3), X, 0.7, 2.2, 0.7, 1.3, C.metal, { ch: 0.2, hi: 1 });
  addBeam(M, V(8.2, 233.4, -10.3), V(8.6, 229.4, -12.3), X, 0.7, 2.2, 0.7, 1.3, C.metal, { ch: 0.2, hi: 1 });
  await tick();
  // rear leg, the cross brace between the front legs, and the folding stay to the rear leg
  const rz = (y) => -13.5 + (v.rear + 13.5) * (231 - y) / (231 - footY);
  addBeam(M, V(0, 231, -13.5), V(0, footY, v.rear), X, 6.4, 4.6, 5.0, 4.0, C.wood, { ch: 0.1 });
  const by = v.braceY, bx = xAt(by) + 5.5;
  addBeam(M, V(-bx, by, zAt(by) - 3.5), V(bx, by, zAt(by) - 3.5), Y, 4.4, 2.4, 4.4, 2.4, C.wood, { ch: 0.12 });
  for (const sx of [-1, 1]) addLathe(M, V(sx * xAt(by), by, zAt(by) - 4.7), V(0, 0, -1), [[0, 0], [0.9, 0], [0.9, 0.35], [0.5, 0.6], [0, 0.65]], 8, C.metal, 1);
  const s0 = V(0, by, zAt(by) - 4.7), s1 = V(0, by, rz(by) + 2.2), sm = V().lerpVectors(s0, s1, 0.5);
  addBeam(M, s0, sm, X, 3.2, 2.0, 3.2, 2.0, C.wood, { ch: 0.15 });
  addBeam(M, V(0, by - 2.1, sm.z + 3), V(0, by - 2.1, s1.z), X, 3.2, 2.0, 3.2, 2.0, C.wood, { ch: 0.15 });
  addLathe(M, V(-2.0, by - 1.05, sm.z + 1.5), X, [[0, 0], [1.0, 0], [1.0, 4.0], [0, 4.0]], 8, C.metal, 1);
  await tick();
  // the stretcher's four corner braces, on the back (hidden by the picture from the noon side like the legs)
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    addBeam(M, V(sx * (HW - 1.2 - 17), CY + sy * (HH - 1.2), -3.15), V(sx * (HW - 1.2), CY + sy * (HH - 1.2 - 17), -3.15), V(0, 0, 1), 1.3, 2.3, 1.3, 2.3, C.wood, { ch: 0.14 });
  }
  return { footY, apexY, xAt, zAt, rz };
}

// A hanging curtain as cut geometry: gathered at the top, flaring to a scalloped hem, drawn a little aside.
// Local: hem at y 0, top at y height, centred on x 0, folds in z. aSway grows towards the hem.
export function curtainGeometry(rng, { width = 46, height = 170, folds = 5, lean = 0.16, nx = 80, ny = 24 } = {}) {
  const pos = [], sway = [], idx = [], ph = rng.range(0, 6.28), side = rng.sign();
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx * 2 - 1, t = j / ny, dn = 1 - t;                    // dn: 0 at the top, 1 at the hem
    const wd = width * 0.5 * (0.60 - 0.16 * Math.sin(Math.min(dn * 2.4, Math.PI)) + 0.40 * dn * dn * dn);
    const f = Math.sin(u * Math.PI * folds + ph + 0.6 * Math.sin(u * 3 + ph));
    const hem = 1.6 * (0.5 - 0.5 * f) * dn * dn * dn;
    const x = u * wd + side * lean * width * (dn * dn - 0.35) + 0.9 * f * dn;
    pos.push(x, t * height + (j === 0 ? hem : hem * (1 - t)), (1.2 + 3.6 * dn) * f);
    sway.push(1.6 * dn * dn);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// A bilboquet: his turned wooden baluster. Base centre O, total height h.
export function addBilboquet(M, O, h, color, segs = 20) {
  const P = [[0, 0], [0.17, 0], [0.175, 0.03], [0.15, 0.05], [0.10, 0.075], [0.085, 0.10], [0.105, 0.115], [0.085, 0.13], [0.07, 0.17],
    [0.095, 0.24], [0.135, 0.31], [0.15, 0.38], [0.135, 0.45], [0.09, 0.52], [0.055, 0.58], [0.05, 0.62], [0.085, 0.64], [0.05, 0.66],
    [0.042, 0.72], [0.06, 0.76], [0.105, 0.80], [0.13, 0.855], [0.125, 0.91], [0.09, 0.96], [0.045, 0.99], [0, 1]];
  addLathe(M, O, V(0, 1, 0), P.map(([r, y]) => [r * h, y * h]), segs, color, 0.35);
}

// ---------------------------------------------------------------------------------------------------------
// The sky-dove: a flat spread-winged outline with no thickness and no eye, turned to the eye, wings flexing.
// ---------------------------------------------------------------------------------------------------------
const DOVE_HALF = [[0, 0.34], [0.022, 0.30], [0.045, 0.265], [0.04, 0.225], [0.06, 0.19], [0.14, 0.215], [0.26, 0.225], [0.38, 0.19], [0.47, 0.125],
  [0.5, 0.05], [0.455, 0.07], [0.47, 0.0], [0.415, 0.035], [0.42, -0.04], [0.36, 0.01], [0.35, -0.06], [0.29, -0.005], [0.24, -0.065], [0.16, -0.05],
  [0.085, -0.085], [0.06, -0.14], [0.075, -0.2], [0.115, -0.3], [0.06, -0.325], [0.03, -0.31], [0, -0.335]];
export function doveGeometry() {                             // about 50 triangles; x: wing span -0.5..0.5, y: tail to beak
  const pts = DOVE_HALF.map(([x, y]) => new THREE.Vector2(x, y));
  for (let i = DOVE_HALF.length - 2; i >= 1; i--) pts.push(new THREE.Vector2(-DOVE_HALF[i][0], DOVE_HALF[i][1]));
  const tris = THREE.ShapeUtils.triangulateShape(pts, []), pos = [], idx = [];
  for (const p of pts) pos.push(p.x, p.y, 0);
  for (const t of tris) idx.push(t[0], t[1], t[2]);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
export const DOVE_VERT = /* glsl */`
  attribute vec4 aPos;                                       // per dove: world position, wing span in metres
  attribute vec4 aFly;                                       // per dove: roll (radians), wing phase (radians), 0, 0
  varying vec3 vW; varying float vSh;
  void main(){
    float wg=smoothstep(.06,.34,abs(position.x)), a=sin(aFly.y);
    vec2 p=position.xy;
    p.x*=1.-wg*(.22-.22*a);                                  // the wings fold in and open
    p.y-=wg*abs(position.x)*(.55*a-.12);                     // and their tips sweep back and forward
    float cr=cos(aFly.x), sr=sin(aFly.x); p=vec2(p.x*cr-p.y*sr,p.x*sr+p.y*cr)*aPos.w;
    vec3 te=cameraPosition-aPos.xyz;
    vec3 X=normalize(cross(vec3(0.,1.,0.),te)+vec3(1e-5,0.,0.)), Y=normalize(cross(te,X)+vec3(0.,1e-5,0.));
    vW=aPos.xyz+X*p.x+Y*p.y; vSh=0.;
    gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);
  }`;
// n doves in one draw. Write world positions into .pos (x, y, z, span) and .fly (roll, wing phase, 0, 0), then commit().
export function makeDoves(n, U = CFS.uniforms) {
  const g = doveGeometry(), pos = new Float32Array(n * 4), fly = new Float32Array(n * 4);
  const aPos = new THREE.InstancedBufferAttribute(pos, 4), aFly = new THREE.InstancedBufferAttribute(fly, 4);
  aPos.setUsage(THREE.DynamicDrawUsage); aFly.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('aPos', aPos); g.setAttribute('aFly', aFly); g.instanceCount = n;
  const mesh = new THREE.Mesh(g, cutMaterial({ mode: 1, fold: 0, vertexShader: DOVE_VERT }, U));
  mesh.frustumCulled = false; mesh.name = 'cfs-doves';
  return { mesh, pos, fly, count: n, commit() { aPos.needsUpdate = true; aFly.needsUpdate = true; } };
}

// ---------------------------------------------------------------------------------------------------------
// buildHero
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, tick = ctx.yield ? () => ctx.yield() : async () => {};
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : CFS_PALETTE;
  const U = opts.uniforms || freshUniforms(), flip = opts.flipX ? -1 : 1;
  const paintMat = (o) => paintMaterial(o, U), cutMat = (o) => cutMaterial(o, U);
  // palette -> shared uniforms (mixes stay the brief's)
  U.uP.value[0].set(pal[0]); U.uP.value[2].set(pal[1]); U.uP.value[3].set(pal[2]); U.uP.value[4].set(pal[3]); U.uP.value[7].set(pal[6]);
  U.uP.value[1].set(CFS_MIX.horizon); U.uP.value[5].set(CFS_MIX.nightHorizon); U.uP.value[6].set(CFS_MIX.slate);
  U.uSeed.value = rng.int(0, 40);
  // key and crescent in the hero's own frame, such that the brief's placement gives the brief's world directions
  const toLocal = (x, y, z) => { const c = Math.cos(BRIEF_YAW), s = Math.sin(BRIEF_YAW); return V(flip * (x * c - z * s), y, x * s + z * c).normalize(); };
  const keyL = toLocal(-0.6, 0.7, -0.4), moonL = toLocal(0.2366, 0.2079, 0.949);
  const stone = !!opts.stone;
  const wood = col(stone ? CFS_MIX.metal : CFS_MIX.wood);
  if (!stone) wood.offsetHSL(rng.range(-0.012, 0.012), 0, rng.range(-0.035, 0.03));
  const C = { white: col(pal[1]), wood, metal: col(CFS_MIX.metal), hole: wood.clone().multiplyScalar(0.42), tackShadow: col('#A4AAB4'), tack: wood };   // tack heads: domed, of the easel's own wood colour (studs, never holes)
  const v = { splay: rng.range(76, 90), holeStep: rng.range(11, 15), holeOff: rng.range(0, 6), tray: rng.range(88, 100), rear: -rng.range(105, 128), braceY: rng.range(52, 72) };
  const bey = { cx: rng.range(66, 84), cz: -rng.range(235, 285), bside: rng.sign(), bh: rng.range(46, 58), bz: -rng.range(150, 185) };

  const object = new THREE.Group(); object.name = 'cfs-canvas-of-the-other-hour';
  const add = (geo, mat, order = 0, name = '') => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; object.add(m); return m; };

  if (opts.sky !== false) object.add(makeSkyDome(U));
  await tick();
  const ME = makeMesher();
  // a stream of its own for what was added to the edge later, so that no earlier draw moves
  const seedOf = (label) => { let h = 2166136261 >>> 0; const t = String(ctx.seed ?? 0) + ':cfs:' + label; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const ownRng = (label) => { let a = seedOf(label); const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; r.range = (lo, hi) => lo + (hi - lo) * r(); return r; };
  await buildEdge(ME, rng, detail, keyL, C, tick, ownRng('front-tacks'));
  await tick();
  const edgeGeo = await ME.geometryAsync(tick);
  await tick();
  const MS = makeMesher();
  const easel = await buildEasel(MS, rng, C, tick, v);
  await tick();
  const easelGeo = await MS.geometryAsync(tick);
  await tick();
  add(edgeGeo, paintMat({ mode: 0 }), 0, 'cfs-edge');
  add(easelGeo, paintMat({ mode: 2, clip: true }), 0, 'cfs-easel');
  if (opts.mirror !== false) {
    add(edgeGeo, paintMat({ mode: 0, mirror: true }), -0.4, 'cfs-edge-mirror');
    add(easelGeo, paintMat({ mode: 2, mirror: true }), -0.4, 'cfs-easel-mirror');
  }
  await tick();
  // things of the far side, to show the opening in true parallax (the world coder passes beyond: false and builds the real ones)
  if (opts.beyond !== false) {
    const parts = [];
    for (const sx of [-1, 1]) {
      const g = curtainGeometry(rng, { width: rng.range(42, 50), height: rng.range(150, 180), folds: rng.int(4, 6), nx: Math.round(80 * detail), ny: Math.round(24 * detail) });
      g.translate(sx * bey.cx, -1.5, bey.cz + sx * rng.range(-12, 12)); parts.push(g);
      await tick();
    }
    const cg = new THREE.BufferGeometry(), P = [], N = [], S = [], I = []; let base = 0;
    for (const g of parts) {
      P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); S.push(...g.attributes.aSway.array);
      for (const i of g.index.array) I.push(i + base); base += g.attributes.position.count; g.dispose();
    }
    cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    cg.setAttribute('aSway', new THREE.Float32BufferAttribute(S, 1)); cg.setIndex(I);
    add(cg, cutMat({ mode: 1, fold: 0.06, clip: true }), 0, 'cfs-demo-curtains');
    const MB = makeMesher();
    addBilboquet(MB, V(bey.bside * 34, -1, bey.bz), bey.bh, C.wood, Math.round(22 * detail));
    const bg = MB.geometry();
    add(bg, paintMat({ mode: 1, clip: true }), 0, 'cfs-demo-bilboquet');
    if (opts.mirror !== false) add(bg, paintMat({ mode: 1, mirror: true }), -0.4, 'cfs-demo-bilboquet-mirror');
  }
  // a short stream of doves through the opening (demo of the fauna; beyond: false removes it)
  let doves = null; const dv = [];
  if (opts.beyond !== false) {
    doves = makeDoves(Math.round(18 * detail), U); object.add(doves.mesh);
    for (let i = 0; i < doves.count; i++) dv.push({ s: (i + rng.range(-0.3, 0.3)) / doves.count * 700, x: flip * (95 + rng.range(-5, 5)), y: 111 + rng.range(-5, 6), span: rng.range(3, 6), ph: rng.range(0, 6.28), rate: rng.range(3.2, 4.4) });
  }
  await tick();

  // anchors, all in the hero's local space (x is multiplied by -1 under opts.flipX)
  const fx = (x, y, z) => V(flip * x, y, z);
  const anchors = {
    placement: { position: V(80, 0, 450), rotationY: BRIEF_YAW },          // the brief's seat in world space (sea level y 0)
    canvas: { center: V(0, CY, 0), normal: V(0, 0, 1), right: V(1, 0, 0), halfWidth: HW, halfHeight: HH, openHalfWidth: HW - BW, openHalfHeight: HH - BW },
    crossing: { position: fx(105, 110, 0), heading: V(0, 0, -1) },          // 5 m inside the edge, square to the plane
    flyThrough: [fx(52, 58, 250), fx(78, 82, 170), fx(96, 100, 95), fx(104, 108, 40), fx(105, 110, 0), fx(105, 110, -45), fx(102, 104, -120)],
    viewpoints: { reveal: fx(-55, 66, 290), closest: fx(104.5, 109, 16), far: fx(-150, 40, 520), behind: fx(60, 90, -260) },
    edgeNear: fx(107.6, 110, -0.5),                                         // the inner face of the edge the camera passes, with its tacks
    apex: V(0, 240, -10.3), feet: [V(-v.splay, 0, -5.2), V(v.splay, 0, -5.2), V(0, 0, v.rear)],
    keyLocal: keyL.clone(), moonLocal: moonL.clone(),
    beyond: opts.beyond !== false ? { curtains: [fx(-bey.cx, 0, bey.cz), fx(bey.cx, 0, bey.cz)], bilboquet: V(bey.bside * 34, 0, bey.bz) } : null,
    portalSeat: null,                                                        // the exit is not at the hero in this world
  };

  let progress = -1;
  const q = new THREE.Quaternion(), p0 = V(), sc = V(), tmp = V(), AX = V(1, 0, 0), AY = V(0, 1, 0), AZ = V(0, 0, 1);
  const setDir = (target, local) => { target.copy(tmp.copy(local).applyQuaternion(q)).normalize(); };
  const worldKey = opts.key ? V().copy(opts.key).normalize() : null, worldMoon = opts.moon ? V().copy(opts.moon).normalize() : null;
  function update(dt, time, camera) {
    object.updateWorldMatrix(true, false);
    object.matrixWorld.decompose(p0, q, sc);
    U.uCvO.value.set(0, CY, 0).applyMatrix4(object.matrixWorld);
    setDir(U.uCvU.value, AX); setDir(U.uCvV.value, AY); setDir(U.uCvN.value, AZ);
    U.uCvH.value.set((HW - BW) * sc.x, (HH - BW) * sc.y, HW * sc.x, HH * sc.y);
    if (worldKey) U.uKey.value.copy(worldKey); else setDir(U.uKey.value, keyL);
    if (worldMoon) U.uMoon.value.copy(worldMoon); else setDir(U.uMoon.value, moonL);
    U.uSeaY.value = p0.y;
    U.uT.value = progress >= 0 ? progress * 45 : time;
    if (doves) {
      const T = U.uT.value;
      for (let i = 0; i < doves.count; i++) {
        const d = dv[i], s = (d.s + T * 40) % 700;
        tmp.set(d.x + 2 * Math.sin(s * 0.011 + d.ph), d.y + 1.5 * Math.sin(s * 0.017 + d.ph * 2), 350 - s).applyMatrix4(object.matrixWorld);
        const k = i * 4; doves.pos[k] = tmp.x; doves.pos[k + 1] = tmp.y; doves.pos[k + 2] = tmp.z; doves.pos[k + 3] = d.span * sc.x;
        doves.fly[i * 4] = 0.25 * Math.sin(s * 0.013 + d.ph); doves.fly[i * 4 + 1] = d.ph + T * d.rate;
      }
      doves.commit();
    }
  }
  update(0, 0, null);
  return {
    object, radius: 135, height: 240, center: V(0, 100, 0), anchors, update,
    setProgress(u) { progress = u; },                                         // the world calls this every frame with its u
    uniforms: U, easel, dispose() {}, ground: false, groundY: 0,
    // the style bound to THIS hero's uniform set: shade the whole world with these
    style: { uniforms: U, paint: paintMat, cut: cutMat, doves: (n) => makeDoves(n, U), skyDome: () => makeSkyDome(U) },
  };
}
