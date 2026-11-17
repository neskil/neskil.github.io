// AZULEJO DESCENT hero: THE SEA WALL, plus the world's shared tile material.
//
// A concave retaining wall (radius 40 m, 90 m along its arc, 22 m to the cornice, baroque crest to ~29 m,
// an armillary sphere turning on top at ~33 m) whose whole inner face is one azulejo panel: a storm sea of
// scroll waves marching the way the tram travels, three caravels under full sail, a whale that surfaces,
// blows and sounds, flying fish, gulls, scroll clouds and a rain bank, inside an ochre and manganese border.
// The picture advances tile by tile: fringe tiles at each figure's bow and stern turn over like split-flaps.
//
// FRAME   Origin = base centre of the wall face, +Y up. The wall bows away from the viewer: its concave,
//         painted face looks toward +Z and the arc centre is at (0,0,+40). Arc angle a (0 at the wall centre)
//         puts a face point at (40 sin a, y, 40 - 40 cos a). TRAVEL IS TOWARD +X (a rising): a right-hand
//         hairpin seen from above. In the brief's world (X east, Z south) the world sets rotation.y = -Math.PI/2
//         and stands the origin 40 m east of the arc centre, so the face looks west and the tram passes heading south.
// SIZE    radius 27 is a framing radius about centre (0,12,9); the true footprint is 78 m wide and 28 m deep,
//         height ~34. COST about 14k triangles, 2 draw calls, ~150 ms build, no lights, no textures.
// LIGHT   None: self-shaded tile material (scene lights ignored, scene fog honoured). Shared uniforms in
//         hero.uniforms: uSun (world-space direction TO the sun; default lights the face from the front-left,
//         i.e. the brief's 48 deg western key once rotated), uCamSway (vec2, cab sway in radians: slides the
//         sheen), uTime, uU (reserved; scripted figures are placed by setProgress, below). Bloom should catch only the sheen (peaks ~1.6) so threshold ~1.0.
// OPTS    palette [tin, pale, mid, deep, ochre, manganese, yellow] (brief default); arc (m along the face, 90);
//         cast 'caravels' | 'fishing' (lateen boats and dolphins) | 'galleon' (one great ship and a sea serpent); border 'ochre' | 'manganese'; travel +1 | -1.
// HOOKS   setProgress(p): p 0..1 = the cab's way round the 180 deg hairpin (cab angle -90..+90 deg about the arc
//         centre). The lead caravel then holds station 24 m ahead of the cab (easing to the wall's end) and the
//         whale surfaces at p=0.5, blows and sounds by p=0.8. setProgress(null) returns to the ambient loop
//         (fleet crosses the wall every ~10 s, whale cycle 9 s). setCab(angle) does the same from a raw angle.
// ANCHORS (local space) arcCentre; wallRadius 40; trackRadius 32; flyThrough: eye points round the hairpin at
//         radius 32 (8 m off the face, 7.4 m off the plinth), y 12 falling to 7; lead: live Vector3 of the lead
//         caravel's hull (a POI target, updated every frame); whale: live Vector3; viewpoints.midTurn / .wide /
//         .end ({position, target}); portalSeat {position, facing}: a 14 m portal fits at the arc centre facing
//         the wall (the brief seats its portal in the church door instead); crestTop; sunHint.
//
// makeTileMaterial(opts) -> THREE.ShaderMaterial, the one material of this world (cab and sky included).
//   Geometry attributes: aTile vec2 = tile coordinate in METRES (arc length on curved walls, dominant-axis
//   projection on boxes; 14 cm tiles so grids line up), aPic float = picture id, aBorder float = 1 draws the
//   baroque border ornament running along aTile.x with aTile.y 0..1.4 m across, aSeed float = per-surface
//   variation, aShade float (optional) 0..1 = analytic shade (eaves, street slot): cobalt wash, then hatching.
//   Picture ids: 0 plain tile with corner sprigs, 1 the sea panel (needs uPanel), 2 star diaper, 3 lattice,
//   4 wave paving (deep/pale cobalt, wet), 5 fish-scale roof, 6 solid glaze (aSeed <.2 pale, <.4 mid, <.6 deep,
//   <.8 ochre, else manganese), 7 tram yellow (tiled, cobalt pinstripe along v if aSeed<.5 else along u), 8 sky wash, 10 crest cartouche,
//   16 foliage stipple (matte; aSeed = tone, >.75 manganese; aShade = underside), 17 distant house front, 18 cloth, 19 compass rose.
//   20 a far-bank range (matte; aTile = east, metres BELOW the ridge as a negative v; aSeed = tone, 1 nearest and deepest .. 0 palest).
//   Roofs, far fronts, paving and the river (5, 17, 4, 13) also carry a painted cloud shade that drifts over the city block by block.
//   World pictures: 9 the sky dome (aTile = azimuth from south, elevation, both x52; clouds, sun, rain bank; uSky),
//   11 a window (aTile 0..1.1 x 0..1.8, lit in yellow by uWorld.z), 12 an arched door (1.5 x 2.8), 13 the river
//   (scallop waves, glitter), 14 a 0.84 m string course on which the cat walks (uCat), 15 star diaper that the
//   rare roaming whale crosses (uRare). Painted swallows or sardines (uWorld.x, .w) cross every pic 0/2/3/15 wall,
//   the shower's strokes (uWorld.y) run down every wall. Optional vertex attributes: aWind (breeze amplitude in
//   metres), aRib (ribbon half-width vector: kept about 1.5 px wide, uPix), aInst (per instance: seed offset, phase).
//   Shade colours are uniforms (uWash, uWash2, uFloor) so a dusk palette can invert the scheme. uOpt.w = 1 gives the sky dome its day
//   wash (tin white rising to cobalt, three rows of scroll clouds); 0 gives the dusk sky (brush bands, outline clouds, painted stars, a ringed moon).
//   uWarm (vec4) = share of near windows lit in tram yellow, share of far windows lit, depth of the solid shade on faces turned well away
//   from the sun, gold on the lead ship (cross, waist band, pennant). Lit windows are laid on after the shade.
//   opts: { palette, uniforms (pass hero.uniforms to share uSun/uCamSway/uTime/uU), side }.
//   Grout, crazing, tilt and flips fade to a smooth wash below ~3 px per tile (derivatives taken once in main).
import * as THREE from 'three';

export const AZULEJO_PALETTE = ['#F3F1E7', '#B4C8EA', '#3E6DC2', '#142E7C', '#C8962E', '#5C3A68', '#F2C312'];
const TILE = 0.14;

const GLSL_COMMON = /* glsl */`
#define TILE 0.14
uniform vec3 uTin, uPale, uMid, uDeep, uOchre, uMang, uYel, uSun;
uniform vec2 uCamSway;
uniform float uTime, uU;
uniform vec4 uPanel;   // sea panel: length, height, border width, travel sign
uniform vec4 uSd;      // per-seed randoms
uniform vec4 uFig[4];  // lead, 2nd, 3rd caravel, whale: x, y, rotation, scale (panel metres, snapped to tiles)
uniform vec4 uFigB;    // whale blow 0..1, fleet step, cast, fish base x
uniform vec3 uFloor, uWash, uWash2;   // darkest value, shade wash, slot wash (multipliers)
uniform vec4 uWorld;   // painted birds offset (m), rain 0..1, dusk glow 0..1, birds kind (0 swallows, 1 sardines)
uniform vec4 uCat;     // frieze cat: x, y, direction, tone (0 white, 1 cobalt)
uniform vec4 uRare;    // roaming whale on pic 15 surfaces: x, y, rotation, scale (0 = off)
uniform vec4 uSky;     // rain bank (2 = the shower overhead), sun glow, cloud drift, warm morning horizon
uniform vec4 uOpt;     // border swap (ochre <-> manganese, borders only), long morning hatching, wet strength, day sky depth (0 at dusk)
uniform vec4 uWarm;    // warm accents: share of near windows lit in tram yellow, share of far windows lit, depth of the shade on faces turned from the sun, gold on the lead ship
varying vec2 vTile; varying float vPic, vBorder, vSeed, vShade; varying vec3 vWN, vWP;
float gAA, gDet, gPat, gLit; vec3 gOc, gMg, gEm;
float h11(float n){ return fract(sin(n*12.9898+4.137)*43758.5453); }
float h21(vec2 p){ p=fract(p*vec2(.1031,.1030)); p+=dot(p,p.yx+33.33); return fract((p.x+p.y)*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y); }
float fl(float d){ return 1.-smoothstep(-gAA,gAA,d); }
float ln(float d,float w){ return (1.-smoothstep(w-gAA,w+gAA,abs(d)))*min(1.,(w+w)/(gAA+1e-5)); }
float br(vec2 p){ return mix(.86,.7+.32*vn(p*vec2(2.3,17.)),clamp(1.-gAA/.05,0.,1.)); }
float seg(vec2 p,vec2 a,vec2 b){ vec2 pa=p-a,ba=b-a; float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-5),0.,1.); return length(pa-ba*h); }
float edge(vec2 p,vec2 a,vec2 b){ vec2 e=b-a; return dot(p-a,vec2(e.y,-e.x))/max(length(e),1e-5); }
float tri(vec2 p,vec2 a,vec2 b,vec2 c){ return max(edge(p,a,b),max(edge(p,b,c),edge(p,c,a))); }
vec2 rot(vec2 p,float a){ float c=cos(a),s=sin(a); return vec2(c*p.x+s*p.y,-s*p.x+c*p.y); }
float ang(vec2 v){ return atan(v.y,abs(v.x)<1e-5?1e-5:v.x); }
`;

// ---- small repeating fields and the border ornament ----
const GLSL_FIELDS = /* glsl */`
vec3 borderOrn(float al,float ac,float w){   // al metres along, ac metres across (0 outer .. w inner)
  vec3 c=mix(uTin,uPale,.22*br(vec2(al,ac*3.)));
  float a01=ac/w;
  c=mix(c,gMg,ln(ac-.09*w,.035)); c=mix(c,gMg,ln(ac-.91*w,.035));
  c=mix(c,gOc,.9*ln(ac-.17*w,.018)); c=mix(c,gOc,.9*ln(ac-.83*w,.018));
  float per=w*1.25; float k=al/per; float cell=floor(k); float u=fract(k)-.5;
  float sgn=mod(cell,2.)<.5?1.:-1.;
  vec2 v=vec2(u*per,(a01-.5)*w-sgn*.05*w);
  float r=length(v)/w;
  float vine=(a01-.5)*w-.2*w*sin(k*3.14159);
  c=mix(c,gOc,ln(vine,.03*w/.5)*smoothstep(.2,.26,r));
  float sp=fract(ang(v)*sgn/6.2832+r*3.6);
  float vol=ln((sp-.5)*w*.27,.028*w/.5)*(1.-smoothstep(.2,.24,r));
  c=mix(c,gOc,vol*br(v*2.)); c=mix(c,gOc,fl(length(v)-.035*w/.5*1.6));
  vec2 lf=vec2(abs(u)*per-.36*per,(a01-.5)*w+sgn*.2*w);            // acanthus dabs between volutes
  c=mix(c,gOc,.85*fl(length(lf*vec2(.55,1.))-.07*w));
  c=mix(c,gMg,.8*fl(length(lf*vec2(.55,1.))-.028*w));
  float bd=length(vec2((fract(al/(w*.2))-.5)*w*.2,ac-.955*w));    // bead row on the picture side
  c=mix(c,uDeep,.8*fl(bd-.022*w/.5));
  return c;
}
vec3 fieldPic(float id,vec2 p,float sd){
  vec3 c=uTin, av=uTin; float pf=clamp(gPat,0.,1.);
  if(id<.5){                                    // plain tile, corner sprigs
    vec2 q=abs(fract(p/TILE)-.5)*TILE; float d=length(q-vec2(.07))-.018;
    c=mix(c,uMid,.7*fl(d)*gDet); c=mix(c,uPale,.5*ln(length(q)-.03,.006)*gDet);
    vec2 mq=(fract(p/vec2(2.24,3.36)+vec2(.5,.2))-.5)*vec2(2.24,3.36);          // an albarrada every sixteen tiles: a vase of flowers in a lobed frame
    float md=length(mq*vec2(1.2,1.))-.98+.07*cos(ang(mq)*8.);
    c=mix(c,mix(uTin,uPale,.3+.2*br(p*2.)),fl(md)); c=mix(c,uMid,ln(md,.05)); c=mix(c,uDeep,ln(md+.13,.018));
    float vs=min(length((mq-vec2(0.,-.42))*vec2(1.,.8))-.22,max(abs(mq.x)-.07-.5*max(mq.y+.2,0.)*max(mq.y+.2,0.),abs(mq.y+.12)-.14));
    vs=min(vs,max(abs(mq.x)-.13,abs(mq.y+.7)-.035));
    float stm=min(seg(mq,vec2(0.,0.),vec2(0.,.4)),min(seg(mq,vec2(0.,0.),vec2(-.32,.2)),seg(mq,vec2(0.,0.),vec2(.32,.2))));
    c=mix(c,uMid,ln(stm,.022));
    float flw=min(length(mq-vec2(0.,.48))-.17,min(length(mq-vec2(-.38,.24))-.14,length(mq-vec2(.38,.24))-.14));
    c=mix(c,uMid,fl(flw)*br(p*4.)); c=mix(c,uDeep,ln(flw,.02)); c=mix(c,uTin,fl(flw+.09));
    c=mix(c,uPale,.9*fl(min(length((mq-vec2(-.2,-.02))*vec2(1.,2.2))-.1,length((mq-vec2(.2,-.02))*vec2(1.,2.2))-.1)));
    c=mix(c,mix(uMid,uDeep,.5),fl(vs)); c=mix(c,uTin,.8*ln(mq.y+.42,.02)*fl(vs+.03)); c=mix(c,uDeep,ln(vs,.02));
    av=mix(uTin,uPale,.2); c=mix(av,c,clamp(2.24/max(gAA,1e-4)/14.,0.,1.));
  } else if(id<2.5){                            // star diaper over 2x2 tiles
    vec2 q=fract(p/(TILE*2.)+.5)-.5; vec2 a=abs(q); float r=length(q);
    float star=min(a.x,a.y)*1.9+max(a.x,a.y)*.55-.21;
    c=mix(c,uPale,fl(star*.28)*br(p*3.)); c=mix(c,uMid,ln(star*.28,.012));
    c=mix(c,uDeep,fl((r-.085)*.28)); c=mix(c,uMid,ln((abs(a.x-a.y)-.0)*.2,.008)*smoothstep(.3,.42,r));
    c=mix(c,uMid,fl((length(a-.5)-.13)*.28)); c=mix(c,uTin,fl((length(a-.5)-.06)*.28));
    av=mix(uTin,uMid,.3); c=mix(av,c,pf);
    vec2 mq=abs(fract(vec2(p.x+p.y,p.x-p.y)/3.36)-.5)*3.36; float md=min(mq.x,mq.y);
    c=mix(c,uTin,.8*ln(md,.2)); c=mix(c,uMid,ln(md-.2,.035)); c=mix(c,uDeep,fl(length(mq)-.3));
  } else if(id<3.5){                            // diagonal lattice with knots
    vec2 q=vec2(p.x+p.y,p.x-p.y)/(TILE*2.); vec2 f=abs(fract(q)-.5);
    c=mix(c,uPale,.8*ln(min(f.x,f.y)*.2,.02)*br(p*2.)); c=mix(c,uMid,ln(min(f.x,f.y)*.2,.007));
    c=mix(c,uDeep,fl((length(f)-.11)*.2)); c=mix(c,uMid,.6*fl((length(f-.5)-.16)*.2)*br(p*4.));
    av=mix(uTin,uPale,.55); c=mix(av,c,pf);
    vec2 mq=abs(fract(p/vec2(2.24,3.36))-.5)*vec2(2.24,3.36); float md=length(mq*vec2(1.5,1.))-.9;
    c=mix(c,mix(uTin,uPale,.2),fl(md)); c=mix(c,uMid,ln(md,.05)); c=mix(c,uMid,ln(md+.22,.02)); c=mix(c,uDeep,fl(length(mq)-.16));
  } else if(id<4.5){                            // wave paving, wet
    float y=p.y+.42*sin(p.x*1.9)+.1*sin(p.x*5.3); float s=abs(fract(y/1.1)-.5)*1.1-.27;
    float bpx=.2/max(gAA,1e-4); vec3 dkp=mix(mix(uMid,uDeep,.45),uDeep,smoothstep(5.,16.,bpx)), ltp=mix(uPale,uTin,.3*smoothstep(5.,16.,bpx));
    c=mix(ltp,dkp,fl(s)*(.82+.18*br(p))); c=mix(mix(uPale,mix(uMid,uDeep,.3),.42),c,.38+.62*smoothstep(.45,4.,bpx));   // bold under the wheels, a calm cobalt wash far off
  } else if(id<5.5){                            // fish-scale roof
    vec2 q=p/vec2(.3,.24); float row=floor(q.y); q.x+=.5*mod(row,2.); vec2 f=vec2(fract(q.x)-.5,fract(q.y));
    float d=length(vec2(f.x,f.y-1.)*vec2(1.,.8))-.5;
    c=mix(uPale,uMid,.55+.45*h21(vec2(floor(q.x),row)+sd)); c=mix(c,uDeep,.7*ln(d*.24,.012));
    c=mix(c,uTin,.45*(1.-smoothstep(0.,.3,f.y))*step(d,0.));
    vec3 far5=mix(mix(uPale,uMid,.82+.18*h11(sd*57.)),uDeep,.16+.5*ln((fract(p.y/1.44)-.5)*1.44,.16));   // far off: mid cobalt with deep courses
    c=mix(far5,c,clamp(gPat*1.5,0.,1.));
  } else if(id<6.5){                            // solid glaze
    c=sd<.2?uPale:sd<.4?uMid:sd<.6?uDeep:sd<.8?uOchre:uMang; c*=(.9+.14*br(p*2.))*(.84+.3*vn(p*1.3+sd*9.));
    c=mix(c,c*.68,.55*smoothstep(.56,.68,vn(p*6.))*clamp(1.-gAA/.08,0.,1.));   // stippled brushwork
  } else if(id<7.5){ c=uYel*(.9+.12*br(p*2.));
  } else if(id<8.5){                            // sky wash: broad horizontal strokes
    c=mix(uTin,uPale,clamp(.5+.5*sin(p.y*.02)+.25*(vn(p*vec2(.004,.05))-.5),0.,1.)*.8);
  } else {                                      // crest cartouche: armillary rings, rays, scroll field
    vec2 q=p-vec2(0.,3.1); float r=length(q);
    c=mix(c,uPale,.5*br(p*1.5)*(1.-smoothstep(1.,4.5,r)));
    float rays=abs(fract(ang(q)/6.2832*16.)-.5);
    c=mix(c,uPale,.8*fl((rays-.2)*r*.39)*smoothstep(1.8,2.,r)*(1.-smoothstep(2.6,3.3,r)));
    c=mix(c,uMid,ln(r-1.55,.06)); c=mix(c,uDeep,ln(r-1.75,.03));
    c=mix(c,uTin,fl(r-1.5));
    c=mix(c,uMid,ln(length(q*vec2(2.6,1.))-1.4,.05)); c=mix(c,uMid,ln(length(q*vec2(1.,2.6))-1.4,.05));
    c=mix(c,uDeep,ln(abs(q.y+q.x*.42)-.12,.035)*step(r,1.45)); c=mix(c,uDeep,fl(r-.2));
    float sw=p.y-.75-.35*sin(p.x*1.6); c=mix(c,uMid,.8*ln(sw,.05)*smoothstep(2.4,3.2,abs(p.x)));
    vec2 dd=vec2((fract(p.x/.56)-.5)*.56,p.y-.28); c=mix(c,uDeep,.8*fl(length(dd)-.07));
  }
  return c;
}
`;

// ---- the cast: caravel, whale, flying fish (local metres, bow toward +x, waterline y = 0) ----
const GLSL_FIGS = /* glsl */`
vec3 sailP(vec2 q,float mx,float y0,float y1,float hw,float belly){
  float t=clamp((q.y-y0)/(y1-y0),0.,1.);
  float xs=q.x-mx-.3-belly*sin(3.14159*t); float w=hw*(1.-.2*t); float n=xs/w;
  float foot=y0+.55*(1.-min(1.,n*n));
  return vec3(max(abs(xs)-w,max(foot-q.y,q.y-y1)),n,t);
}
float sheerY(float x){ return 1.2+.03*x*x+.85*(1.-smoothstep(-3.3,-2.4,x))+.4*smoothstep(4.,5.,x); }
vec4 shipD(vec2 q){
  float x=q.x,y=q.y;
  float dH=max(max(y-sheerY(x),-1.2+.02*x*x-y),max(-6.-.08*y-x,x-5.3-.5*y));
  float dM=sailP(q,.4,3.3,9.7,2.7,1.1).x, dF=sailP(q,3.7,3.5,7.7,1.9,.85).x;
  if(uFigB.z>.5&&uFigB.z<1.5){ float dL=tri(q,vec2(-5.2,2.6),vec2(5.9,3.1),vec2(-1.5,11.6)); return vec4(dH,dL,dL,dL); }   // fishing boats: one lateen sail
  float dZ=tri(q,vec2(-6.4,3.9),vec2(-2.9,2.9),vec2(-2.5,8.7));
  return vec4(dH,dM,dF,dZ);
}
float shipSil(vec2 q){ if(abs(q.x)>8.||q.y<-1.5||q.y>11.6) return 0.; vec4 D=shipD(q); return step(min(min(D.x,D.y),min(D.z,D.w)),0.); }
void paintSail(inout vec3 c,inout float a,vec3 S,float emb,vec2 q){
  float f=fl(S.x);
  vec3 s=mix(uTin,uPale,(.62*(1.-smoothstep(-1.,-.1,S.y))+.2*(1.-smoothstep(0.,.25,S.z)))*br(q*1.4));
  s=mix(s,uPale,.7*ln((fract(S.y*2.5+.5)-.5)*.6,.014));
  float cx=abs(S.y),cy=abs(S.z-.52)*2.;
  float k=min(max(cx-.09-.3*cy,cy-.6),max(cy-.09-.3*cx,cx-.6));
  float em=emb<.5?fl(k*1.4):step(.5,fract(S.y*1.5+.25))*.75;
  s=mix(s,gEm,em*br(q*2.+3.));
  c=mix(c,s,f); c=mix(c,uDeep,ln(S.x,.055)); a=max(a,fl(S.x-.06));
}
vec4 lateen(vec2 q){                               // a fishing boat under one lateen sail, an eye painted at the bow
  float x=q.x,y=q.y; vec4 D=shipD(q);
  float rig=min(seg(q,vec2(.6,1.),vec2(.6,8.8)),seg(q,vec2(6.2,2.8),vec2(-1.8,12.)));
  vec3 c=uDeep; float a=max(ln(rig,.075),.8*ln(seg(q,vec2(.6,8.8),vec2(-5.9,2.3)),.03));
  paintSail(c,a,vec3(D.y,(x+.3)/5.,clamp((y-2.6)/9.,0.,1.)),1.,q);
  float e=sheerY(x)-y, f=fl(D.x); vec3 h=uTin;
  h=mix(h,uMid,(smoothstep(.42,.5,e)-smoothstep(.85,.93,e))*br(q*1.7));
  h=mix(h,uPale,smoothstep(1.35,1.6,e)*br(q*1.2+7.));
  h=mix(h,uDeep,max(ln(e-.42,.03),ln(e-.9,.03)));
  vec2 ey=q-vec2(4.2,sheerY(4.2)-.68); h=mix(h,uTin,fl(length(ey*vec2(.6,1.))-.24)); h=mix(h,uDeep,max(ln(length(ey*vec2(.6,1.))-.24,.03),fl(length(ey)-.1)));
  h=mix(h,uMid,.8*ln(seg(q,vec2(-5.2,sheerY(-5.2)-.2),vec2(-1.,sheerY(-1.)-.5))-.0,.05)*step(.5,fract(x*2.2)));   // nets hung to dry
  c=mix(c,h,f); c=mix(c,uDeep,ln(D.x,.065)); a=max(a,fl(D.x-.07));
  vec2 v=q-vec2(6.05,.15); float r=length(v);
  float foam=fl(r-.7); c=mix(c,uTin,foam); c=mix(c,uMid,foam*ln((fract(ang(v)/6.2832+r*1.25)-.5)*.6,.05));
  c=mix(c,uDeep,ln(r-.7,.045)); a=max(a,fl(r-.75));
  return vec4(c,a);
}
vec4 caravel(vec2 q,float id){
  if(abs(q.x)>9.2||q.y<-1.8||q.y>12.8) return vec4(0.);
  float ld=step(id,.5)*uWarm.w; gEm=mix(uMid,mix(uOchre,uYel,.3),ld);        // the lead ship carries the gold: her cross, her waist band, her pennant
  if(uFigB.z>.5&&uFigB.z<1.5) return lateen(q);
  float x=q.x,y=q.y; vec4 D=shipD(q); float emb=uFigB.z>1.5?0.:step(.6,fract(uSd.y+id*.37));
  float rig=min(min(seg(q,vec2(.4,1.),vec2(.4,11.3)),seg(q,vec2(3.7,1.2),vec2(3.7,8.8))),seg(q,vec2(-3.6,2.),vec2(-3.6,7.4)));
  rig=min(rig,seg(q,vec2(5.6,2.3),vec2(8.1,3.5)));
  float stay=min(min(seg(q,vec2(.4,11.2),vec2(8.,3.5)),seg(q,vec2(.4,11.2),vec2(-5.9,2.6))),
                 min(seg(q,vec2(3.7,8.7),vec2(8.,3.5)),seg(q,vec2(-6.4,3.9),vec2(-2.5,8.7))));
  vec3 c=uDeep; float a=max(ln(rig,.075),.8*ln(stay,.032));
  float px=x-.4, pw=.32*(1.-px/2.8), py=y-11.-.24*sin(px*2.6-uTime*7.+id*2.)*px*.5;
  float pen=max(abs(py)-pw,max(-px,px-2.8)); c=mix(c,mix(uMid,uYel,ld),fl(pen)); a=max(a,fl(pen-.03));
  float p2=x-3.7, py2=y-8.6-.2*sin(p2*3.-uTime*7.5+id)*p2*.5;
  float pen2=max(abs(py2)-.24*(1.-p2/2.),max(-p2,p2-2.)); c=mix(c,uDeep,fl(pen2)); a=max(a,fl(pen2));
  float nest=max(abs(x-.4)-.36,abs(y-10.05)-.22); c=mix(c,uTin,fl(nest)); c=mix(c,uDeep,ln(nest,.04)); a=max(a,fl(nest-.04));
  vec3 Z=vec3(D.w,(x+3.9)/1.9,clamp((y-2.9)/5.8,0.,1.));
  paintSail(c,a,Z,1.,q);
  paintSail(c,a,sailP(q,3.7,3.5,7.7,1.9,.85),emb,q);
  paintSail(c,a,sailP(q,.4,3.3,9.7,2.7,1.1),emb,q);
  float e=sheerY(x)-y, f=fl(D.x);
  vec3 h=uTin;
  h=mix(h,gEm,(smoothstep(.42,.5,e)-smoothstep(.85,.93,e))*br(q*1.7));
  h=mix(h,uPale,smoothstep(1.35,1.6,e)*br(q*1.2+7.));
  h=mix(h,uDeep,max(ln(e-.42,.03),max(ln(e-.9,.03),ln(e-1.4,.022))));
  h=mix(h,uDeep,fl(length(vec2((fract(x/.95)-.5)*.95,e-.66))-.1)*step(-3.,x)*step(x,4.5));
  vec2 wq=vec2((fract((x+5.75)/.74)-.5)*.74,e-1.18);
  h=mix(h,uDeep,fl(max(abs(wq.x)-.17,abs(wq.y)-.2))*step(x,-3.55)*step(-5.75,x));
  h=mix(h,uMid,ln((fract(x/.3)-.5)*.3,.03)*step(e,.36)*step(.06,e)*step(x,-2.6));   // castle balusters
  c=mix(c,h,f); c=mix(c,uDeep,ln(D.x,.065)); a=max(a,fl(D.x-.07));
  vec2 v=q-vec2(6.05,.15); float r=length(v);                                        // bow scroll
  float foam=fl(r-.85); c=mix(c,uTin,foam); c=mix(c,uMid,foam*ln((fract(ang(v)/6.2832+r*1.25)-.5)*.6,.05));
  c=mix(c,uDeep,ln(r-.85,.045)); a=max(a,fl(r-.9));
  return vec4(c,a);
}
float whaleD(vec2 q){
  float hx=q.x-2., L=hx>0.?8.:12.; float n=clamp(1.-hx*hx/(L*L),0.,1.);
  float th=2.5*sqrt(n)*(hx>0.?1.:.22+.78*n);
  float sp=.9-.014*q.x*q.x;
  float body=max(abs(q.y-sp)-th,abs(q.x)-10.);
  vec2 f=rot(q-vec2(-9.6,-.45),-.45);
  float hh=.3+2.1*smoothstep(0.,2.6,-f.x);
  float fk=max(max(abs(f.y)-hh,max(f.x-.6,-3.-f.x)),-(abs(f.y)-(-f.x-2.1)*1.4));
  return min(body,fk);
}
float whaleSil(vec2 q){ if(abs(q.x)>14.||abs(q.y)>6.) return 0.; return step(whaleD(q),0.); }
vec4 whale(vec2 q){
  if(q.x<-14.||q.x>11.||q.y<-5.||q.y>10.) return vec4(0.);
  float d=whaleD(q), sp=.9-.014*q.x*q.x, f=fl(d);
  float up=q.y-sp;
  vec3 c=mix(uMid,uDeep,.2+.6*smoothstep(-.5,2.2,up)); c=mix(c,uPale,.3*smoothstep(.55,.9,vn(q*vec2(1.2,5.))));
  c=mix(c,uPale,.55*ln((fract(up/.55+.15*sin(q.x*.7))-.5)*.55,.028)*step(-.9,up-.02*q.x));
  float belly=(1.-smoothstep(-1.1,-.6,up-.02*q.x))*step(-3.5,q.x);
  vec3 b=mix(uTin,uPale,.5*ln((fract(up/.36)-.5)*.36,.035)+.2);
  c=mix(c,b,belly); c=mix(c,uMid,belly*ln((fract(up/.36)-.5)*.36,.016));
  c=mix(c,uTin,fl(length(q-vec2(7.3,-.25))-.36)); c=mix(c,uDeep,ln(length(q-vec2(7.3,-.25))-.36,.04)); c=mix(c,uDeep,fl(length(q-vec2(7.4,-.25))-.17));
  c=mix(c,uDeep,ln(seg(q,vec2(9.9,-.75),vec2(6.2,-1.05)),.05));
  c=mix(c,uTin,.9*step(.8,vn(q*5.))*step(6.5,q.x)*step(1.,up));                       // barnacles
  vec2 fq=rot(q-vec2(3.,-2.3),-.55); float fd=length(fq*vec2(.42,1.))-.52;
  c=mix(c,uDeep,ln(d,.085)); float a=fl(d-.09);
  c=mix(c,mix(uMid,uDeep,.5),fl(fd)); c=mix(c,uDeep,ln(fd,.06)); a=max(a,fl(fd-.06));
  float B=uFigB.x;                                                                      // spout
  vec2 v=q-vec2(5.7,3.1); float r=length(v); float an=atan(v.x,max(v.y,1e-3));
  float R=7.*B; float fan=.12+.4*clamp(r/max(R,1e-3),0.,1.);
  float pl=step(1e-3,v.y)*step(r,R)*(1.-smoothstep(fan-.08,fan,abs(an)))*step(.03,B);
  float st=abs(fract(an*5.3+.5)-.5)/5.3*r;
  vec3 pc=mix(uTin,uPale,.5*br(v*2.)); pc=mix(pc,uMid,ln(st,.045)*(.5+.5*sin(r*5.-uTime*14.)));
  c=mix(c,pc,pl*(1.-a)); a=max(a,pl);
  float cap=ln(r-R,.13)*step(1e-3,v.y)*(1.-smoothstep(fan,fan+.25,abs(an)))*step(.03,B);  // scrolled crown
  c=mix(c,uDeep,cap*(1.-f)); a=max(a,cap);
  return vec4(c,a);
}
float serpD(vec2 q){                               // the sea serpent: four humps, a neck and head, a tail tip
  float d=1e3;
  for(int i=0;i<4;i++){ float fi=float(i); d=min(d,max(abs(length(q-vec2(-9.5+fi*4.2,-1.6))-2.1)-(.42+.12*fi),-1.6-q.y)); }
  d=min(d,seg(q,vec2(6.3,-1.6),vec2(7.5,3.))-.85);
  d=min(d,length((q-vec2(8.5,3.5))*vec2(.6,1.))-.95);
  return min(d,tri(q,vec2(-13.6,1.4),vec2(-11.9,-1.6),vec2(-11.2,-.2)));
}
vec4 serpent(vec2 q){
  if(q.x<-14.5||q.x>11.||q.y<-2.2||q.y>6.) return vec4(0.);
  float d=serpD(q);
  vec3 c=mix(uMid,uDeep,.25+.5*vn(q*vec2(.8,1.6)));
  vec2 g=q/vec2(.5,.42); g.x+=.5*mod(floor(g.y),2.); vec2 f=vec2(fract(g.x)-.5,fract(g.y));
  c=mix(c,uPale,.6*ln((length(vec2(f.x,(f.y-1.)*.8))-.5)*.42,.03));
  c=mix(c,uTin,fl(length(q-vec2(8.9,3.75))-.26)); c=mix(c,uDeep,fl(length(q-vec2(9.,3.75))-.12));
  c=mix(c,uDeep,ln(seg(q,vec2(10.1,3.1),vec2(8.3,3.)),.05));
  float cr=tri(vec2(fract(q.x/.9)*.9,q.y),vec2(.1,4.3),vec2(.8,4.3),vec2(.3,5.));           // a crest of spines on the head
  c=mix(c,uDeep,ln(d,.085)); float a=fl(d-.09);
  float ca=fl(cr)*step(7.6,q.x)*step(q.x,9.4); c=mix(c,uDeep,ca*(1.-a)); a=max(a,ca);
  return vec4(c,a);
}
vec4 beast(vec2 q){ if(uFigB.z>1.5) return serpent(q); return whale(q); }
vec4 dolphins(vec2 p){                            // three dolphins leaping ahead of the fishing fleet
  vec3 c=uMid; float a=0.;
  for(int j=0;j<3;j++){
    float fj=float(j); float ph=fract(uTime*.38+fj*.37); float ht=2.6+.6*fj;
    vec2 pos=vec2(uFigB.w+10.+fj*5.5+ph*7.,uFig[0].y-1.4+ht*4.*ph*(1.-ph)); pos=floor(pos/TILE)*TILE;
    vec2 q=rot(p-pos,atan(ht*4.*(1.-2.*ph),7.));
    if(abs(q.x)<2.4&&abs(q.y)<1.6){
      float bd=min(length(q*vec2(1.,3.2))-1.5,length((q-vec2(1.55,-.05))*vec2(1.,2.6))-.42);
      float fin=tri(q,vec2(-.5,.4),vec2(.3,.4),vec2(-.7,1.05));
      float tl=min(tri(q,vec2(-1.3,0.),vec2(-1.75,0.),vec2(-2.1,-.55)),tri(q,vec2(-1.3,0.),vec2(-2.1,.55),vec2(-1.75,0.)));
      float dd=min(min(bd,fin),tl);
      vec3 fc=mix(uMid,uDeep,smoothstep(-.1,.35,q.y)); fc=mix(fc,uTin,(1.-smoothstep(-.3,-.12,q.y))*step(-1.2,q.x));
      fc=mix(fc,uTin,fl(length(q-vec2(1.,.12))-.07)); fc=mix(fc,uDeep,ln(dd,.05));
      float fa=fl(dd-.05); c=mix(c,fc,fa); a=max(a,fa);
    }
  }
  return vec4(c,a);
}
vec4 fishes(vec2 p){
  vec3 c=uMid; float a=0.;
  for(int j=0;j<7;j++){
    float fj=float(j); float ph=fract(uTime*.5+h11(fj+uSd.z*9.));
    float hop=3.2+2.*h11(fj*3.1); float ht=1.1+1.2*h11(fj*5.7);
    vec2 pos=vec2(uFigB.w-5.5-fj*5.3+fract(fj*.618)*4.+ph*hop,uFig[0].y+.5+ht*4.*ph*(1.-ph)-2.*h11(fj*2.3));
    pos=floor(pos/TILE)*TILE;
    vec2 q=rot(p-pos,atan(ht*4.*(1.-2.*ph),hop));
    if(abs(q.x)<1.2&&abs(q.y)<1.){
      float bd=length(q*vec2(1.,3.4))-.62;
      float tl=tri(q,vec2(-.55,0.),vec2(-.95,-.3),vec2(-.95,.3));
      float wg=tri(q,vec2(.22,.05),vec2(-.1,.05),vec2(-.42,.72+.12*sin(uTime*30.+fj)));
      float wg2=tri(q,vec2(.2,-.05),vec2(-.5,-.5),vec2(-.1,-.05));
      float fa=max(max(fl(bd),fl(tl)),max(fl(wg),fl(wg2)));
      vec3 fc=mix(uPale,uMid,fl(bd)); fc=mix(fc,uDeep,max(ln(bd,.035),max(ln(wg,.025),ln(tl,.025))));
      fc=mix(fc,uTin,fl(length(q-vec2(.4,.03))-.05));
      c=mix(c,fc,fa); a=max(a,max(fa,ln(bd,.05)));
    }
    float sp=ln(length((p-vec2(pos.x-ph*hop,uFig[0].y+.3-2.*h11(fj*2.3)))*vec2(1.,2.2))-.25-1.2*ph,.05)*(1.-ph)*(1.-ph);
    c=mix(c,uTin,sp*(1.-a)); a=max(a,sp*.9);                                             // splash ring where it left the water
  }
  return vec4(c,a);
}
vec2 figQ(vec2 p,int i){ return rot(p-uFig[i].xy,uFig[i].z)/max(uFig[i].w,.05); }
float fleetSil(vec2 p){
  float s=max(max(shipSil(figQ(p,0)),shipSil(figQ(p,1))),shipSil(figQ(p,2)));
  vec2 wq=figQ(p,3); if(uFigB.z>1.5) return max(s,(abs(wq.x)>14.5||abs(wq.y)>6.)?0.:step(serpD(wq),0.));
  return max(s,whaleSil(wq));
}
float shipsSil(vec2 p){ return max(max(shipSil(figQ(p,0)),shipSil(figQ(p,1))),shipSil(figQ(p,2))); }
float beastSil(vec2 p){ vec2 wq=figQ(p,3); if(uFigB.z>1.5) return (abs(wq.x)>14.5||abs(wq.y)>6.)?0.:step(serpD(wq),0.); return whaleSil(wq); }
float wakeM(vec2 p){
  float m=0.;
  for(int i=0;i<3;i++){ vec2 q=figQ(p,i); float t=(-5.6-q.x)/9.;
    m=max(m,step(0.,t)*step(t,1.)*step(abs(q.y-.35),.3+.9*t)*(1.-t)); }
  return m;
}
`;

// ---- the sea panel ----
const GLSL_SEA = /* glsl */`
float crestF(float u){ float a=smoothstep(0.,.74,u), b=1.-smoothstep(.74,1.,u); return a*a*b; }
vec3 rowCol(float d,float u,float sc,float xx,vec2 p,float t){
  float dn=d/sc; vec3 c=uTin;
  c=mix(c,uPale,.55*step(.6,vn(p*vec2(3.,7.)/sc))*step(.08,dn));                       // foam dabs under the lip
  float w=smoothstep(.2,.4,dn);
  vec3 body=mix(mix(uPale,uMid,smoothstep(.12,.42,dn)),uDeep,.9*smoothstep(.36,.98,dn));
  body=mix(body,mix(uTin,uPale,.75),mix(.14,.6,uWorld.z)*t);
  c=mix(c,body,w*br(p*1.3+xx));
  float sl=(fract(dn*2.1+.12*sin(xx*9.))-.5)/2.1*sc;
  c=mix(c,mix(uTin,uPale,.5),.55*ln(sl,.022*sc)*smoothstep(.45,.7,dn)*step(.35,vn(vec2(xx*5.,dn*2.))));
  vec2 v=vec2((u-.8)*3.6,-(dn-.44))*sc; float r=length(v)/sc;                           // the curl
  float in1=1.-smoothstep(.27,.3,r);
  c=mix(c,uTin,in1); c=mix(c,uDeep,in1*ln((fract(ang(v)/6.2832+r*3.3)-.5)*.3*sc,.03*sc));
  c=mix(c,uDeep,ln((r-.3)*sc,.035*sc));
  c=mix(c,uDeep,ln(d-.05*sc,.045*sc));                                                  // crest outline
  return c;
}
vec3 seaPic(vec2 p,float hide){
  float L=uPanel.x,H=uPanel.y,bw=uPanel.z;
  vec2 e=vec2(.5*L-abs(p.x),min(p.y,H-p.y)); float eb=min(e.x,e.y);
  if(eb<bw){
    if(e.x<bw&&e.y<bw){ vec2 v=e-bw*.5; float r=length(v);
      vec3 k=mix(uTin,uPale,.25); k=mix(k,gMg,ln(max(abs(v.x),abs(v.y))-.44*bw,.035));
      float pet=abs(fract(ang(v)/6.2832*8.)-.5);
      k=mix(k,gOc,fl((pet-.3)*r*.8)*step(r,.36*bw)*br(v*3.)); k=mix(k,gMg,ln(r-.36*bw,.03));
      return mix(k,gMg,fl(r-.08*bw)); }
    return borderOrn(e.y<e.x?p.x:p.y,eb,bw);
  }
  float Yh=bw+(H-2.*bw)*(.6+.05*uSd.x); float top=H-bw-Yh; float sy=(p.y-Yh)/top;
  float day=1.-uWorld.z;
  float sn=vn(vec2(p.x*.07+uSd.y*9.,p.y*.9));
  vec3 c=mix(uTin,uPale,clamp(.12+.6*sy+.45*(sn-.5),0.,1.)*br(p*.7));
  vec3 st=mix(uPale,uMid,clamp(.34+.46*sy+.3*(sn-.5),0.,1.)*(.8+.2*br(p*.7)));        // a storm sky: mid cobalt, darker than the real one behind
  st=mix(st,mix(uTin,uPale,.5),.5*(1.-smoothstep(0.,.3,sy))*smoothstep(.4,.7,vn(vec2(p.x*.11,3.))));   // torn light along the horizon
  c=mix(c,st,day);
  vec2 rq=(p-vec2(-.3*L+(uSd.w-.5)*6.,Yh+top*.52))/.74; float rr=length(rq);
  if(rr<3.8){ float ra=ang(rq)/6.2832;
    float k4=abs(fract(ra*4.+.5)-.5), kd=abs(fract(ra*4.)-.5);
    float s4=rr-3.3*max(1.-k4*3.7,0.), s8=rr-2.1*max(1.-kd*3.7,0.);
    c=mix(c,uPale,ln(rr-2.6,.05)); c=mix(c,uMid,ln(rr-2.75,.02));
    c=mix(c,mix(uPale,uTin,step(.5,fract(ra*4.))),fl(s8*.3)); c=mix(c,uMid,ln(s8*.3,.03));
    c=mix(c,mix(uMid,uTin,step(.5,fract(ra*4.+.5))),fl(s4*.3)); c=mix(c,uDeep,ln(s4*.3,.035));
    c=mix(c,uTin,fl(rr-.45)); c=mix(c,uDeep,ln(rr-.45,.04)); c=mix(c,uDeep,fl(rr-.16)); }
  float cx=(p.x-floor(uTime*2.)*TILE*.5)/24.+uSd.z*5.; float ci=floor(cx);
  vec2 cq=vec2((fract(cx)-.5)*24.,p.y-Yh-top*(.34+.3*h11(ci*3.3+uSd.w)));
  float cv=step(.25,h11(ci*7.7+uSd.w));
  float cd=min(min(length(cq-vec2(-1.8,0.))-1.3,length(cq-vec2(0.,.55))-1.7),min(length(cq-vec2(2.,.1))-1.35,length(cq-vec2(3.6,-.3))-.85));
  cd=max(min(cd,length(cq-vec2(-3.4,-.35))-.8),-.75-cq.y);
  c=mix(c,mix(uTin,mix(uPale,uMid,.5*day),mix(.4,.85,day)*(1.-smoothstep(-.6,.6,cq.y))),fl(cd)*cv); c=mix(c,mix(uMid,uDeep,.4*day),ln(cd,.06)*cv);
  vec2 sv=cq-vec2(-1.8,0.); float sr=length(sv);
  c=mix(c,uMid,cv*ln((fract(ang(sv)/6.2832+sr*.9)-.5)*.8,.045)*step(sr,1.05));
  sv=cq-vec2(2.,.1); sr=length(sv);
  c=mix(c,uMid,cv*ln((fract(-ang(sv)/6.2832+sr*.9)-.5)*.8,.045)*step(sr,1.1));
  float rb=smoothstep(.12*L,.36*L,p.x+3.*sin(p.y*.6))*smoothstep(0.,.2,sy);            // the departing shower
  rb=max(rb,.35*day*smoothstep(0.,.2,sy));                                               // by day rain slants across the whole panel
  float hat=(fract((p.x+p.y*.45)/.42)-.5)*.42;
  c=mix(c,uPale,rb*.4*uWorld.z); c=mix(c,mix(uMid,uDeep,.3),rb*.3*day);
  c=mix(c,mix(uMid,uDeep,.4),rb*.85*ln(hat,.05)*step(.3,vn(vec2((p.x+p.y*.45)*3.,p.y*.35))));
  vec2 gq=vec2(p.x-floor(uTime*6.)*TILE*.5,p.y)/vec2(11.,3.2); vec2 gi=floor(gq);       // gulls
  vec2 gf=(fract(gq)-.5)*vec2(11.,3.2)-(vec2(h21(gi+3.),h21(gi+9.))-.5)*vec2(6.,1.6);
  float gd=gf.y-.34*abs(sin(clamp(gf.x,-.8,.8)*3.927))*(.55+.45*sin(uTime*5.+gi.x*2.));
  c=mix(c,uDeep,ln(gd,.05)*step(abs(gf.x),.8)*step(.5,h21(gi+uSd.w))*step(.1,sy)*(1.-rb));
  c=mix(c,uDeep,ln(p.y-Yh,.04));
  float hit=99.,hd=0.,hu=0.,hsc=1.,hx=0.;
  for(int i=0;i<10;i++){
    float fi=float(i), t=fi/9.;
    float sc=mix(1.5,.4,pow(t,.8)), yb=mix(bw+.75,Yh-.2,1.-pow(1.-t,1.7));
    float xx=(p.x-floor(uTime*8.*(.35+.43*sc))*TILE)/(3.6*sc)+h11(fi+uSd.x)*7.;
    float u=fract(xx);
    float cr=yb+.78*sc*(.72+.5*h11(floor(xx)*1.7+fi*31.))*crestF(u)+.12*sc*sin(xx*2.1+fi);
    if(hit>50.&&p.y<cr){ hit=fi; hd=cr-p.y; hu=u; hsc=sc; hx=xx; }
  }
  if(hit<50.) c=rowCol(hd,hu,hsc,hx,p,hit/9.); else if(p.y<Yh) c=mix(uPale,uMid,.3);
  float show=1.-hide;
  if(hit>4.5){ vec4 f1=caravel(figQ(p,1),1.), f2=caravel(figQ(p,2),2.);
    c=mix(c,f1.rgb,f1.a*show); c=mix(c,f2.rgb,f2.a*show); }
  if(hit>1.5){ vec4 f0=caravel(figQ(p,0),0.); c=mix(c,f0.rgb,f0.a*show); vec4 ff=fishes(p); c=mix(c,ff.rgb,ff.a);
    if(uFigB.z>.5&&uFigB.z<1.5){ vec4 dl=dolphins(p); c=mix(c,dl.rgb,dl.a); } }
  if(hit>1.5){ vec4 wh=beast(figQ(p,3)); c=mix(c,wh.rgb*(1.-.25*uWorld.z),wh.a*show); }   // at dusk the pale beast is held back so it does not flare
  return c;
}
`;

// ---- the rest of the world's pictures: sky, windows, doors, river, frieze with the cat, painted birds ----
const GLSL_WORLD = /* glsl */`
float cloudD(vec2 cq){
  float cd=min(min(length(cq-vec2(-1.8,0.))-1.3,length(cq-vec2(0.,.55))-1.7),min(length(cq-vec2(2.,.1))-1.35,length(cq-vec2(3.6,-.3))-.85));
  return max(min(cd,length(cq-vec2(-3.4,-.35))-.8),-.75-cq.y);
}
void skyCloud(inout vec3 c,vec2 p,float cw,float y0,float yv,float k0,float thr,float spd,float sd,float dk){
  float cx=(p.x+uSky.z*spd)/cw+uSd.z*5.+sd; float ci=floor(cx);
  float kk=k0*(1.+.45*h11(ci*1.9+sd));
  vec2 cq=vec2((fract(cx)-.5)*cw,p.y-y0-yv*h11(ci*3.3+uSd.w+sd))*kk;
  float cv=step(thr,h11(ci*7.7+uSd.w+sd));
  float cd=cloudD(cq);
  vec3 fill=mix(uTin,mix(uPale,mix(uPale,uMid,.55),dk),mix(.4,.8,dk)*(1.-smoothstep(-.7,.7,cq.y))*mix(1.,br(cq*1.6),dk));
  float lw=mix(1.7,1.,dk);
  c=mix(c,fill,fl(cd)*cv*mix(.25,1.,dk)); c=mix(c,uMid,ln(cd,.07*lw)*cv);
  vec2 sv=cq-vec2(-1.8,0.); float sr=length(sv);
  c=mix(c,uMid,cv*ln((fract(ang(sv)/6.2832+sr*.9)-.5)*.8,.05*lw)*step(sr,1.05));
  sv=cq-vec2(2.,.1); sr=length(sv);
  c=mix(c,uMid,cv*ln((fract(-ang(sv)/6.2832+sr*.9)-.5)*.8,.05*lw)*step(sr,1.1));
}
vec3 skyPic(vec2 p){                              // p = (azimuth from south, elevation) * 52
  float az=p.x/52., el=p.y/52.; float h=clamp(el/1.25,0.,1.);
  float dk=uOpt.w;                                // 1 by day: tin white rising to cobalt in broad strokes; 0 at dusk (the inverted scheme keeps its own wash)
  float w=sqrt(h)*.95+.16*(vn(vec2(p.x*.05,p.y*.9))-.5)+.05*sin(p.y*1.7+3.*vn(vec2(p.x*.04,p.y*.2)));
  vec3 c=mix(uTin,uPale,clamp(w,0.,1.));
  vec3 top=mix(uPale,uMid,.86);
  float n1=vn(vec2(p.x*.02,p.y*.55)), n2=vn(vec2(p.x*.031+7.,p.y*.9+3.));
  vec3 d3=mix(mix(uTin,uPale,smoothstep(-.02,.17,el+.03*(n2-.5))),top,smoothstep(.05,.52,el+.07*(n1-.5)));
  d3=mix(d3,uMid,.2*smoothstep(.45,.75,n1)*smoothstep(.1,.4,el));              // broad horizontal brush strokes, darker
  d3=mix(d3,uTin,.2*smoothstep(.55,.8,n2)*smoothstep(.02,.2,el));               // and paler
  c=mix(c,d3,dk);
  float shw=clamp(uSky.x-1.,0.,1.);
  c=mix(c,mix(uPale,uMid,.75),shw*clamp(.25+.75*smoothstep(.08,.7,el)+.3*(vn(vec2(p.x*.03,p.y*.11))-.5),0.,1.));
  float saz=atan(uSun.x,uSun.z), sel=asin(clamp(uSun.y,-1.,1.));
  float da=az-saz; da-=6.2832*floor(da/6.2832+.5);
  float sunw=.5+.5*cos(da);
  vec2 q=vec2(da*cos(el),el-sel)*52.; float r=length(q);
  c=mix(c,vec3(1.,.9,.7),uSky.w*.9*(1.-smoothstep(0.,.32,el))*(.35+.65*sunw*sunw));  // morning: a warm band under the sun
  c=mix(c,vec3(1.,.86,.56),uSky.w*.75*exp(-r*r/420.));                             // and a low golden-tin glow round it
  c=mix(c,uMid,uSky.y*.62*(1.-smoothstep(-.02,.4,el))*(.3+.7*sunw*sunw));          // dusk: the horizon keeps a paler band under the sun
  float rbw=1.-smoothstep(.7,1.3,abs(az-1.3)-shw*4.);
  float rbe=el+.07*(vn(vec2(p.x*.07,2.))-.5);
  float rb=clamp(min(uSky.x,1.)*rbw*(1.-smoothstep(.13+.57*shw,.4+.76*shw,rbe))*smoothstep(-.02,.04,el),0.,1.);
  float hat=(fract((p.x+p.y*.45)/1.3)-.5)*1.3;                        // the shower as a bank of slanting hatching
  c=mix(c,mix(uMid,uDeep,.35),rb*.5*(.75+.25*br(p*.3)));
  c=mix(c,mix(uMid,uDeep,.7),rb*.7*ln(hat,.13)*step(.3,vn(vec2((p.x+p.y*.45)*1.1,p.y*.2))));
  if(dk<.99){                                                          // dusk: white brushwork on the deep cobalt
    float nk=1.-dk; vec3 lite=mix(uPale,uMid,.55);
    float b1=smoothstep(.5,.78,vn(vec2(p.x*.018+3.,p.y*.42))), b2=smoothstep(.56,.8,vn(vec2(p.x*.026+11.,p.y*.7+5.)));
    c=mix(c,lite,nk*.3*b1*smoothstep(.03,.2,el)*(.6+.4*br(p*.35)));          // broad horizontal brush bands
    c=mix(c,uPale,nk*.5*b2*smoothstep(.2,.5,el));
    vec2 sg=p/vec2(5.2,4.4); vec2 si=floor(sg); vec2 sf=(fract(sg)-.5)*vec2(5.2,4.4)-(vec2(h21(si+3.),h21(si+9.))-.5)*vec2(2.6,2.2);
    float sz=.34+.5*h21(si+5.), tw=.7+.3*sin(uTime*(1.5+2.*h21(si+7.))+si.x*3.);
    float s4=(abs(sf.x)+abs(sf.y))*.5+2.2*sqrt(abs(sf.x*sf.y)+1e-6)-sz;        // four-point painted stars
    c=mix(c,mix(uMid,uDeep,.6),nk*tw*fl(s4*.9)*step(.74,h21(si+uSd.w*5.))*smoothstep(.13,.2,el)*(1.-rb));
    vec2 mq=vec2((az-.4-6.2832*floor((az-.4)/6.2832+.5))*cos(el),el-.29)*52.; float mr=length(mq);   // the moon, south-south-east
    if(mr<5.5){ float md=abs(fract(ang(mq)/6.2832*14.)-.5);
      c=mix(c,mix(uMid,uDeep,.5),nk*fl((md-.2)*mr*.45)*smoothstep(2.9,3.1,mr)*(1.-smoothstep(4.,4.2,mr)));
      c=mix(c,uDeep,nk*fl(mr-2.1)); c=mix(c,mix(uTin,uPale,.5),nk*fl(mr-2.1)*fl(length(mq-vec2(.95,.5))-1.75)); c=mix(c,uMid,nk*ln(mr-2.1,.07)); }
  }
  skyCloud(c,p,24.,9.,12.,.55,mix(.12,.2,dk),1.,0.,dk);                // scroll clouds in three rows, the high ones large (at dusk: outlines only)
  { vec3 c2=c; skyCloud(c2,p,36.,mix(12.,17.,dk),10.,.3,.3,1.4,3.7,dk); skyCloud(c2,p,46.,31.,13.,.24,.3,1.9,8.3,dk); c=mix(c,c2,mix(.7,1.,dk)); }
  vec2 gq=vec2(p.x+uTime*1.3,p.y+1.2*sin(uTime*.4+p.x*.2))/vec2(7.,4.2); vec2 gi=floor(gq);   // a painted flock of gulls
  vec2 gf=(fract(gq)-.5)*vec2(7.,4.2)-(vec2(h21(gi+3.),h21(gi+9.))-.5)*vec2(3.6,2.);
  float gd=gf.y-.5*abs(sin(clamp(gf.x,-1.2,1.2)*2.618))*(.5+.5*sin(uTime*5.+gi.x*2.+gi.y));
  c=mix(c,uDeep,ln(gd,.1)*step(abs(gf.x),1.2)*step(.7,h21(gi+uSd.w*7.))*smoothstep(.06,.12,el)*(1.-smoothstep(.45,.55,el))*(1.-.7*rb));
  if(r<6.){                                                            // the sun: a white disc ringed by ochre dashes
    float dash=abs(fract(ang(q)/6.2832*18.)-.5);
    c=mix(c,uOchre,fl((dash-.22)*r*.35)*smoothstep(3.,3.2,r)*(1.-smoothstep(4.3,4.5,r)));
    c=mix(c,mix(uTin,uDeep,uWorld.z)*(1.+uSky.y),fl(r-2.3)); c=mix(c,uMid,ln(r-2.3,.06)*(1.-uWorld.z));
  }
  return c;
}
vec3 winPic(vec2 p,float sd){                     // one window, 1.1 x 1.8 m, local metres
  vec2 q=p-vec2(.55,.9), a=abs(q);
  float inner=max(a.x-.41,a.y-.76);
  vec3 c=mix(uTin,uPale,.3+.2*br(p*3.));
  c=mix(c,uMid,ln(inner-.08,.016));
  vec3 pane=mix(uDeep,uMid,.2+.3*br(p*3.)+.3*smoothstep(-.7,.8,q.y+q.x*.6));
  float lit=step(1.001-max(uWorld.z*.6,uWarm.x),h11(floor(sd*997.+.5)));   // the seed is rounded first: a hash of an interpolated value dithers
  pane=mix(pane,uYel*2.2*(.7+.3*br(p*2.)),lit);
  c=mix(c,pane,fl(inner));
  float bars=max(ln(q.x,.022),ln(q.y-.22,.018));
  c=mix(c,mix(uTin,uPale,.3),bars*fl(inner)*(1.-.5*lit));
  gLit=lit*fl(inner+.02)*(1.-.75*bars)*(.72+.28*br(p*2.));
  return mix(c,uDeep,ln(inner,.028));
}
vec3 doorPic(vec2 p,float sd){                    // an arched door, 1.5 x 2.8 m
  vec2 q=p-vec2(.75,0.); float ax=abs(q.x);
  float d=min(max(ax-.6,q.y-2.),length(vec2(q.x,q.y-2.))-.6);
  vec3 c=mix(uTin,uPale,.35); c=mix(c,uMid,ln(d-.09,.02));
  vec3 dr=mix(mix(uMid,uDeep,.55),uDeep,step(.5,fract(sd*7.)))*(.85+.2*br(p*2.));
  float pn=max(abs(ax-.3)-.19,abs(fract(q.y/.95)-.5)*.95-.33);
  dr=mix(dr,uPale,.6*ln(pn,.016)*step(q.y,1.9)); dr=mix(dr,uTin,.7*ln(q.x,.01));
  dr=mix(dr,uTin,fl(length(q-vec2(.1,1.05))-.035));
  float fan=abs(fract(atan(q.x,max(q.y-2.,1e-3))/3.1416*5.)-.5);
  dr=mix(dr,uPale,.6*ln(fan*.3,.02)*step(2.,q.y));
  c=mix(c,dr,fl(d)); return mix(c,uDeep,ln(d,.03));
}
vec3 riverPic(vec2 p){                            // p = (east, south from the quay) metres: scallop waves marching east
  vec3 c=mix(uPale,uMid,clamp(.78+.22*vn(p*vec2(.012,.09))+.1*vn(p*vec2(.05,.4)),0.,1.));
  c=mix(mix(uMid,uDeep,.25),c,clamp(1.-gAA/6.,0.,1.));                        // far off it holds a fill tone, never a pale average
  c=mix(c,mix(uMid,uDeep,.55),.35*smoothstep(.5,.75,vn(p*vec2(.004,.02)+uSd.xy*5.)));   // long brushed currents
  for(int j=0;j<3;j++){
    float S=j==0?22.:j==1?7.:1.5; float rw=7.*S;
    float row=floor(p.y/rw), yy=fract(p.y/rw)*rw;
    float xx=(p.x-floor(uTime*3.)*.84*S)/(11.*S)+h11(row+float(j)*17.)*5.; float u=fract(xx)-.5;
    float d=length(vec2(u*11.*S,(yy-S)*1.9))-4.4*S;
    float k=clamp(1.-gAA/(1.6*S),0.,1.);
    c=mix(c,mix(uTin,uPale,.4),.5*k*(1.-smoothstep(-1.6*S,0.,d))*step(d,0.)*step(S,yy));
    c=mix(c,mix(uMid,uDeep,.7),k*ln(d,.2*S)*step(S,yy));
  }
  return c;
}
vec3 hillPic(vec2 p,float tone){                  // the far bank: p = (east, metres below the ridge); tone 1 nearest (deep), 0 farthest (pale)
  vec3 base=tone>.5?mix(uMid,mix(uMid,uDeep,.7),(tone-.5)*2.):mix(mix(uPale,uMid,.35),uMid,tone*2.);
  base=mix(base,mix(uPale,uTin,.75-.5*tone),uWorld.z);                         // at dusk the ranges sink into the deep sky, the nearest least
  vec3 c=base*(.85+.3*vn(p*vec2(.006,.03)+tone*9.));
  float dy=-p.y;                                                              // metres below the ridge
  float ter=(fract((dy+9.*vn(vec2(p.x*.008,tone*5.)))/11.)-.5)*11.;           // terrace lines following the slope
  c=mix(c,mix(base,uTin,.42),.8*ln(ter,.9)*smoothstep(4.,14.,dy));
  float hat=(fract((p.x+dy*.8)/7.)-.5)*7.;                                    // hatched shade under each terrace
  c=mix(c,mix(base,uDeep,.6),.5*ln(hat,.8)*step(ter,0.)*smoothstep(4.,14.,dy));
  float k=smoothstep(.55,.9,tone);
  if(k>0.){
    vec2 g=vec2(p.x/46.,(dy-8.)/22.); vec2 gi=floor(g);                       // tin quintas with deep roofs
    vec2 f=(fract(g)-.5)*vec2(46.,22.)-(vec2(h21(gi+2.),h21(gi+5.))-.5)*vec2(22.,6.);
    float on=step(.45,h21(gi+uSd.xy*11.))*step(8.,dy)*k;
    float bd=max(abs(f.x)-6.5,abs(f.y-1.)-3.);
    c=mix(c,uTin,fl(bd)*on); c=mix(c,uDeep,fl(max(abs(f.x)-7.5,abs(f.y+2.6)-1.2+abs(f.x)*.12))*on);
    c=mix(c,uDeep,fl(max(abs(abs(f.x)-2.8)-.9,abs(f.y-1.)-1.1))*on);
    vec2 w=vec2((fract(p.x/170.+.3)-.5)*170.,dy-26.);                         // a row of windmills under the ridge, sails turning
    float wd=max(abs(w.x)-2.2-.14*(w.y+9.),abs(w.y)-9.);
    c=mix(c,uTin,fl(wd)*k); c=mix(c,uDeep,fl(max(abs(w.x)-4.4-(w.y+9.)*.7,abs(w.y+10.6)-1.6))*k);
    vec2 sq=rot(w+vec2(0.,9.),uTime*.5+floor(p.x/170.+.3)*1.7); vec2 sa=abs(sq);
    c=mix(c,uTin,fl(min(max(sa.x-15.,sa.y-1.3),max(sa.y-15.,sa.x-1.3)))*k); c=mix(c,uDeep,fl(length(sq)-1.5)*k);
  }
  return c;
}
vec3 friezePic(vec2 p){                           // a string course, 0.84 m: running wave, bead row, and the cat
  vec3 c=mix(uTin,uPale,.3*br(p*2.));
  c=mix(c,uMid,ln(p.y-.07,.02)); c=mix(c,uMid,ln(p.y-.77,.02));
  c=mix(c,uPale,.8*ln(p.y-.2-.07*sin(p.x*11.22),.03));
  c=mix(c,uMid,.8*fl(length(vec2((fract(p.x/.28)-.5)*.28,p.y-.66))-.035));
  vec2 q=(p-uCat.xy)*vec2(uCat.z,1.);
  if(abs(q.x)<.8&&q.y>-.05&&q.y<.8){
    float ph=uCat.x*8.;
    float d=length((q-vec2(0.,.3))*vec2(.48,1.))-.125;
    d=min(d,length(q-vec2(.34,.44))-.105);
    d=min(d,tri(q,vec2(.27,.52),vec2(.31,.64),vec2(.36,.54))); d=min(d,tri(q,vec2(.36,.54),vec2(.42,.64),vec2(.44,.5)));
    d=min(d,seg(q,vec2(-.25,.34),vec2(-.46,.56+.05*sin(ph*.5)))-.028);
    d=min(d,seg(q,vec2(.18,.24),vec2(.18+.1*sin(ph),0.))-.03); d=min(d,seg(q,vec2(.12,.24),vec2(.12-.1*sin(ph),0.))-.03);
    d=min(d,seg(q,vec2(-.18,.24),vec2(-.18-.1*sin(ph),0.))-.03); d=min(d,seg(q,vec2(-.24,.24),vec2(-.24+.1*sin(ph),0.))-.03);
    vec3 cc=mix(uTin,mix(uMid,uDeep,.45),uCat.w);
    cc=mix(cc,mix(uPale,uDeep,uCat.w),.7*ln((fract(q.x/.11)-.5)*.11,.014)*step(q.x,.2)*step(.26,q.y));
    cc=mix(cc,mix(uDeep,uTin,uCat.w),fl(length(q-vec2(.38,.46))-.02));
    c=mix(c,cc,fl(d)); c=mix(c,uDeep,ln(d,.022));
  }
  return c;
}
vec2 birdsOv(vec2 p){                             // painted swallows (or sardines) crossing the walls, tile by tile
  float k=clamp(1.-gAA/.12,0.,1.); if(k<=0.) return vec2(0.);
  vec2 g=vec2(p.x-floor(uWorld.x/TILE)*TILE,p.y)/vec2(6.3,2.52); vec2 gi=floor(g);
  if(h21(gi+uSd.xy*40.)<.52) return vec2(0.);
  vec2 f=(fract(g)-.5)*vec2(6.3,2.52)-(vec2(h21(gi+3.),h21(gi+9.))-.5)*vec2(3.6,1.);
  f=floor(f/(TILE*.5))*(TILE*.5);
  if(abs(f.x)>.75||abs(f.y)>.7) return vec2(0.);
  float d, e=0.;
  if(uWorld.w<.5){
    float W=.62*(.25+.75*abs(sin(uTime*7.+gi.x*2.+gi.y)));
    d=length(f*vec2(1.,3.))-.2;
    d=min(d,min(tri(f,vec2(.1,0.),vec2(-.1,0.),vec2(-.3,W)),tri(f,vec2(.1,0.),vec2(-.3,-W),vec2(-.1,0.))));
    d=min(d,min(tri(f,vec2(-.15,0.),vec2(-.52,.13),vec2(-.4,0.)),tri(f,vec2(-.15,0.),vec2(-.4,0.),vec2(-.52,-.13))));
    e=fl(length(f-vec2(.12,0.))-.035)*.0;
  } else {
    float wv=.04*sin(f.x*9.-uTime*11.+gi.x);
    vec2 s=vec2(f.x,f.y-wv);
    d=length(s*vec2(1.,3.6))-.36; d=min(d,tri(s,vec2(-.3,0.),vec2(-.5,-.12),vec2(-.5,.12)));
    e=ln(s.y-.02,.014)*step(abs(s.x),.26)+fl(length(s-vec2(.24,.02))-.03);
  }
  return vec2(fl(d)*k,clamp(e,0.,1.)*k);
}
vec3 leafPic(vec2 p,float sd,float sh){           // foliage in glaze: stippled dabs in three strengths, no grid, no sheen
  vec3 mg=mix(uMang,vec3(.3,.19,.66),.6);
  vec3 ink=sd>.75?mg:uMid, dk=sd>.75?mix(mg,uMang,.55):uDeep, lt=sd>.75?mix(uTin,mg,.38):uPale;
  float tone=clamp(sd>.75?(sd-.75)*4.:sd*1.6,0.,1.);
  vec3 c=mix(lt,ink,.3+.45*tone), hi=mix(uTin,lt,.45);
  float k=clamp(1.-gAA/.45,0.,1.);
  for(int j=0;j<3;j++){
    float sc=j==0?1.05:j==1?.46:.27; vec2 g=p/sc+float(j)*vec2(3.7,1.3); vec2 gi=floor(g);
    float r=h21(gi+sd*13.+float(j)*5.);
    vec2 f=rot(fract(g)-.5-(vec2(h21(gi+1.7),h21(gi+7.3))-.5)*.5,r*6.2832);
    float d=(length(f*vec2(1.,1.9))-.2-.16*r)*sc;
    vec3 dab=r<.34?hi:r<.7?ink:dk;
    c=mix(c,dab,fl(d)*k*(.75+.25*br(p*3.)));
  }
  c=mix(mix(lt,ink,.4+.4*tone),c,k);
  c=mix(c,mix(ink,dk,.7),(sd>.75?.6:.88)*smoothstep(.15,.85,sh));     // the underside falls to deep cobalt
  return c;
}
vec3 farPic(vec2 p,float sd){                     // a distant house front: tin wall, rows of painted windows, a dado
  vec3 c=mix(uTin,uPale,.25+.5*h11(sd*31.));
  vec2 g=vec2(p.x/2.3,p.y/3.05+sd*3.); vec2 f=(fract(g)-.5)*vec2(2.3,3.05);
  float d=max(abs(f.x)-.46,abs(f.y+.1)-.8);
  float on=step(.18,h21(floor(g)+sd*7.));
  c=mix(c,mix(uMid,uDeep,.75),.95*fl(d)*on); c=mix(c,uMid,.7*ln(d-.16,.05)*on);
  gLit=.9*fl(d)*on*step(1.-uWarm.y,h21(floor(g)*1.7+sd*3.+2.));              // a few far windows burn yellow
  c=mix(c,mix(uPale,uMid,.6),.7*ln(f.y+1.25,.1));
  return c;
}
vec3 clothPic(vec2 p,float sd){                   // washing and bunting: stripes, checks, dots or a bordered sheet
  float k=fract(sd*7.31); vec3 a=uTin, b=fract(sd*3.17)<.5?uMid:uDeep; vec3 c;
  if(k<.28){ c=mix(a,b,step(.5,fract(p.y/.17))); }
  else if(k<.52){ vec2 q=step(.5,fract(p/.2)); c=mix(a,b,.5*(q.x+q.y)); }
  else if(k<.76){ vec2 q=fract(p/.16)-.5; c=mix(uPale,b,fl((length(q)-.26)*.16)); }
  else { c=mix(b,a,step(.06,min(min(p.x,1.-p.x),min(p.y,1.2-p.y)))); c=mix(c,b,.8*fl(length(vec2(p.x-.5,(p.y-.6)*.8))-.16)); }
  if(fract(sd*11.3)<mix(.16,.34,uWorld.w)) c=mix(c,uYel,.85*step(.5,fract(p.y/.17)));   // a little tram yellow on the line, more at the festival
  return c*(.9+.14*br(p*2.));
}
vec3 rosePic(vec2 p){                             // compass rose inlaid in the belvedere floor (p from its centre, metres)
  float r=length(p), an=ang(p)/6.2832;
  vec3 c=mix(uTin,uPale,.3+.3*br(p));
  float k4=abs(fract(an*4.+.5)-.5), k8=abs(fract(an*4.)-.5), k16=abs(fract(an*16.)-.5);
  float s4=r-5.2*max(1.-k4*3.4,0.), s8=r-3.4*max(1.-k8*3.4,0.);
  c=mix(c,uPale,fl((k16-.25)*r*.39)*smoothstep(5.6,5.8,r)*(1.-smoothstep(6.4,6.6,r)));
  c=mix(c,uMid,ln(r-5.6,.08)); c=mix(c,uDeep,ln(r-6.6,.12)); c=mix(c,uMid,ln(r-7.,.05));
  c=mix(c,mix(uPale,uTin,step(.5,fract(an*4.))),fl(s8*.4)); c=mix(c,uMid,ln(s8*.4,.04));
  c=mix(c,mix(uDeep,uTin,step(.5,fract(an*4.+.5))),fl(s4*.4)); c=mix(c,uDeep,ln(s4*.4,.05));
  c=mix(c,gOc,fl(r-.7)); c=mix(c,uDeep,ln(r-.7,.06)); c=mix(c,uTin,fl(r-.3));
  return c;
}
`;


const TILE_VERT = /* glsl */`
attribute vec2 aTile; attribute float aPic, aBorder, aSeed, aShade, aWind; attribute vec3 aRib; attribute vec2 aInst;
uniform float uTime, uPix;
varying vec2 vTile; varying float vPic, vBorder, vSeed, vShade; varying vec3 vWN, vWP;
#include <fog_pars_vertex>
void main(){
  vTile=aTile; vPic=aPic; vBorder=aBorder; vSeed=aSeed+aInst.x; vShade=aShade;
  mat4 m=modelMatrix;
  #ifdef USE_INSTANCING
    m=modelMatrix*instanceMatrix;
  #endif
  vec4 wp=m*vec4(position,1.);
  float wph=uTime*2.1+wp.x*.35+wp.z*.27+aInst.y*6.2832;                       // breeze: cloth, leaves, cords
  wp.xyz+=aWind*vec3(.6*sin(wph)+.25*sin(wph*2.3+1.),.22*sin(wph*1.7),.5*cos(wph*.9));
  float rl=length(aRib);                                                      // ribbons keep about 1.5 px of width
  if(rl>1e-6) wp.xyz+=(mat3(m)*aRib)/rl*max(0.,length(cameraPosition-wp.xyz)*uPix-rl);
  vWP=wp.xyz; vWN=mat3(m)*normal;
  vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const TILE_FRAG = GLSL_COMMON + '#include <fog_pars_fragment>\n' + GLSL_FIELDS + GLSL_FIGS + GLSL_SEA + GLSL_WORLD + /* glsl */`
void main(){
  vec2 tw=fwidth(vTile); float px=max(max(tw.x,tw.y),1e-5);
  gOc=mix(uOchre,uMang,uOpt.x); gMg=mix(uMang,uOchre,uOpt.x);
  gAA=px*.75; gDet=smoothstep(2.,4.5,TILE/px); gPat=smoothstep(1.2,3.5,TILE/px); gLit=0.; gEm=uMid;
  float pic=floor(vPic+.5);
  if((pic>7.5&&pic<9.5)||(pic>12.5&&pic<13.5)||(pic>15.5&&pic<16.5)||(pic>17.5&&pic<18.5)||pic>19.5) gDet=0.;
  bool matte=(pic>15.5&&pic<16.5)||(pic>17.5&&pic<18.5)||pic>19.5;
  vec2 tc=vTile/TILE, id=floor(tc), f=fract(tc);
  float hs=h21(id+vSeed*17.);
  vec2 p=vTile, cen=(id+.5)*TILE;
  float flipQ=-1., hide=0., flipW=0.;
  bool sea=pic>.5&&pic<1.5&&vBorder<.5;
  if(sea){
    p.x*=uPanel.w; cen.x*=uPanel.w;
    vec2 ahead=cen+vec2(TILE*(1.+hs),0.);                               // one or two tiles ahead: only the fringe at a bow or a stern turns over
    float shN=shipsSil(cen), shP=shipsSil(ahead);
    float chS=abs(shN-shP), chB=abs(beastSil(cen)-beastSil(ahead))*(1.-max(shN,shP)), ph=uTime*4.+hs*7., pr=h21(id*1.3+floor(ph));
    float act=max(max(chS*step(pr,.55),chB*step(pr,.24)),wakeM(cen)*step(h21(id*1.7+floor(ph)),.22))*step(.85,gDet);   // tiles turn over only where a tile is big enough to read (no dither far off)
    if(act>.5){ flipQ=fract(ph); hide=shN*chS*step(flipQ,.5); flipW=chB*(1.-chS); }
  }
  float gap=0., lip=0.;
  if(flipQ>=0.){
    float sq=mix(1.,max(abs(cos(3.14159*flipQ)),.07),gDet); float fy=(f.y-.5)/sq;
    gap=step(.5,abs(fy)); lip=smoothstep(.36,.5,abs(fy))*(1.-gap);
    p.y=(id.y+.5+clamp(fy,-.5,.5))*TILE;
  }
  p+=(vec2(h21(id+5.),h21(id+11.))-.5)*.009*gDet;                    // hand-set tiles never quite register
  vec3 c;
  if(vBorder>.5) c=borderOrn(p.x,p.y,1.4);
  else if(sea) c=seaPic(p,hide);
  else if(pic>19.5) c=hillPic(p,vSeed);
  else if(pic>18.5) c=rosePic(p);
  else if(pic>17.5) c=clothPic(p,vSeed);
  else if(pic>16.5) c=farPic(p,vSeed);
  else if(pic>15.5) c=leafPic(p,vSeed,vShade);
  else if(pic>14.5){ c=fieldPic(2.,p,vSeed); if(uRare.w>.01){ vec4 wh=beast(rot(p-uRare.xy,uRare.z)/uRare.w); c=mix(c,wh.rgb,wh.a); } }
  else if(pic>13.5) c=friezePic(p);
  else if(pic>12.5) c=riverPic(p);
  else if(pic>11.5) c=doorPic(p,vSeed);
  else if(pic>10.5) c=winPic(p,vSeed);
  else if(pic>8.5&&pic<9.5) c=uTin;
  else c=fieldPic(pic,p,vSeed);
  bool wallF=pic<.5||(pic>1.5&&pic<3.5)||(pic>14.5&&pic<15.5);
  if(wallF&&vBorder<.5&&!sea){ vec2 bo=birdsOv(p); c=mix(c,mix(uDeep,uMid,.6*uWorld.w),bo.x); c=mix(c,uTin,bo.y); }
  if(uWorld.y>.01&&abs(vWN.y)<.6*length(vWN)&&pic<7.5){                     // the shower, painted: slanting strokes that run down every wall
    float ri=floor((vTile.x+vTile.y*.3)/.84), rs=(fract((vTile.x+vTile.y*.3)/.84)-.5)*.84;
    float rd=step(.62,fract(vTile.y*.3+uTime*1.1+h11(ri)*7.));
    c=mix(c,mix(uMid,uDeep,.3),uWorld.y*.85*ln(rs,.03)*rd*clamp(gPat,0.,1.));
  }
  float rp=h21(id+vSeed*3.+41.);
  if(sea||pic<.5||(pic>1.5&&pic<3.5)){                                // repairs: odd pattern tiles and bare mortar
    if(rp<.004) c=mix(c,mix(uTin,fieldPic(2.,vTile+rp*90.,0.),.6),gDet);
    else if(rp>.9982) c=mix(c,mix(mix(uTin,uMang,.3),uDeep,.55*step(.82,max(f.x,1.-f.y))),gDet);
  }
  c=mix(c,mix(uDeep,uMid,.35),gap); c=mix(c,uDeep,.7*lip);
  c*=1.+(hs-.5)*.13*gDet;
  c*=mix(vec3(1.),mix(vec3(1.02,1.,.95),vec3(.95,.98,1.03),h21(id+71.)),gDet);
  vec2 pe=abs(f-.5); c*=1.-.07*gDet*smoothstep(.36,.5,max(pe.x,pe.y));       // pillowed glaze edge
  float g=min(min(f.x,1.-f.x),min(f.y,1.-f.y))*TILE;
  float grt=(.26+.34*smoothstep(4.,12.,TILE/px))*gDet*(1.-smoothstep(max(.0012,px*.35),max(.0024,px*.9),g));
  c=mix(c,mix(mix(uTin,uMang,.4)*.62,c*.72,.7),grt);                  // grout takes the tile's own tone, so deep figures are not meshed with pale lines
  c=mix(c,c*vec3(.86,.84,.8),clamp(1.-gAA/.004,0.,1.)*step(abs(vn(p*85.)-.5),.03));   // crazing, only very close
  float stn=vn(vec2(vTile.x*.55,vTile.y*.07+vSeed));                 // rain stains run down from above
  c*=mix(vec3(1.),uWash,.22*smoothstep(.55,.85,stn));
  vec3 N=normalize(vWN+vec3(0.,1e-5,0.)); if(!gl_FrontFacing) N=-N;
  N=normalize(N+(vec3(h21(id+1.),h21(id+2.),h21(id+3.))-.5)*.06*gDet*((pic>10.5&&pic<12.5)?.15:1.));
  float ndl=dot(N,uSun);
  float shade=max(1.-smoothstep(-.45,.25,ndl),vShade);                 // grazing faces are hatched, only faces turned well away take the wash
  vec3 wash=uWash, wash2=uWash2;
  bool roofy=pic>4.5&&pic<5.5, farF=pic>16.5&&pic<17.5, pave=pic>3.5&&pic<4.5, riv=pic>12.5&&pic<13.5;
  if(roofy||farF||pave||riv){                                          // painted cloud shade drifting over the city, block by block
    float stp=floor(uTime*4.), sc=riv?5.6:1.12;
    vec2 q=floor((vWP.xz-stp*vec2(.84,.34))/sc);
    float cs=vn(q/(riv?26.:44.)+uSd.xy*9.);
    float inS=smoothstep(.53,.6,cs)*(1.-.75*clamp(vShade,0.,1.));
    c*=mix(vec3(1.),wash*mix(vec3(1.),wash,.5),.62*inS);
    float fr=step(abs(cs-.55),.02)*step(.55,h21(q+floor(uTime*2.)*7.))*(1.-clamp(vShade,0.,1.));   // its edge turns over like split-flaps
    c=mix(c,mix(uMid,uDeep,.5),.5*fr);
  }
  if(farF) c*=mix(vec3(1.),wash,.85*smoothstep(.45,.95,shade));
  c*=mix(vec3(1.),wash,.92*smoothstep(.45,.95,shade));
  if(!matte&&!(pic>8.5&&pic<9.5)) c*=mix(vec3(1.),mix(wash,wash2,.6),uWarm.z*(sea?.25:1.)*(1.-smoothstep(-.62,-.3,ndl)));   // faces turned well away: one deeper, solid cobalt
  c*=mix(vec3(1.),mix(wash2,vec3(1.),.35),smoothstep(.6,1.,vShade));
  float hb=smoothstep(.05,.3,shade)*(1.-smoothstep(.6,.95,shade)*(1.-.75*uOpt.y));
  float hl=ln((fract((vTile.x+vTile.y)/.24)-.5)*.24,.04+.02*uOpt.y)*mix(.5+.5*vn(vec2((vTile.x+vTile.y)*6.,(vTile.x-vTile.y)*.5)),1.,.7*uOpt.y);
  if(matte) hl=0.;
  c*=mix(vec3(1.),mix(wash,wash*wash,.6*uOpt.y),hb*hl);
  c=max(c*.84,uFloor);
  if(pic>6.5&&pic<7.5){                                                          // tram yellow stays yellow: the one accent, tiled and pinstriped
    c=uYel*(1.-.3*uWorld.z)*(.8-.22*shade)*(.92+.1*br(vTile*2.))*(1.+(hs-.5)*.1*gDet); c=mix(c,uYel*.5,grt*.8);
    float sq=vSeed<.5?vTile.y:vTile.x; c=mix(c,uDeep,.85*ln((fract(sq/.3)-.5)*.3,.011)); }
  c=mix(c,uYel*(1.25+.75*uWorld.z),clamp(gLit,0.,1.));
  vec3 V=normalize(cameraPosition-vWP+vec3(0.,1e-4,0.));
  vec3 Hh=normalize(uSun+V+vec3(uCamSway.x,uCamSway.y,uCamSway.x*.5)+vec3(0.,1e-4,0.));
  Hh=normalize(mix(vec3(Hh.x,Hh.y*.15,Hh.z),Hh,abs(N.y))+vec3(1e-4,0.,0.));
  float s=max(dot(N,Hh),0.); float s2=s*s; float s8=s2*s2*s2*s2; float s32=s8*s8*s8*s8;
  float blink=flipQ>=0.?.35*sin(3.14159*flipQ)*(1.-gap)*(1.-.7*flipW):0.;
  float fres=1.-max(dot(N,V),0.); fres=fres*fres*fres;
  if(!matte) c=mix(c,uPale*.9,(sea?mix(.08,.03,uWorld.z):.16)*fres);
  if(pic>3.5&&pic<4.5){                                                        // wet paving: sky wash at grazing angles, rippling
    float rp2=vn(vTile*vec2(1.3,2.1)+vec2(uTime*.5,-uTime*.3));
    c=mix(c,mix(uPale,uTin,.35),clamp(fres*.7*uOpt.z,0.,.3*uOpt.z)*(.3+.7*rp2));
    c=mix(c,uTin,.16*uWorld.y*smoothstep(.68,.82,vn(vec2(vTile.x*9.,vTile.y*.35-uTime*2.4)))*clamp(gPat,0.,1.));   // the shower: water running down the paving
  }
  if(pic>12.5&&pic<13.5) c+=vec3(1.,.97,.9)*.9*s8*step(.84,vn(vTile*.22+uTime*vec2(.5,.17)));   // river glitter
  float s128=s32*s32*s32*s32;
  float shn=s32*.055+s128*s128*.5;                                              // the one sheen: on the sea panel a soft band that never hides a figure
  if(sea) shn=min(mix(.2,.07,uWorld.z),.35*shn);
  if(!matte) c+=vec3(1.,.98,.93)*(shn+blink*(.25+(sea?.3:1.)*s8));
  if(pic>8.5&&pic<9.5) c=skyPic(p);                                             // the sky is paint only: no shade, no sheen
  gl_FragColor=vec4(c,1.);
  #include <fog_fragment>
}`;

export function makeTileUniforms(palette = AZULEJO_PALETTE) {
  const pal = AZULEJO_PALETTE.map((h, i) => new THREE.Color((palette && palette[i]) || h));
  const fig = []; for (let i = 0; i < 4; i++) fig.push(new THREE.Vector4(0, -100, 0, 1));
  return {
    uTin: { value: pal[0] }, uPale: { value: pal[1] }, uMid: { value: pal[2] }, uDeep: { value: pal[3] },
    uOchre: { value: pal[4] }, uMang: { value: pal[5] }, uYel: { value: pal[6] },
    uSun: { value: new THREE.Vector3(-0.42, 0.74, 0.52).normalize() }, uCamSway: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uU: { value: 0 }, uPanel: { value: new THREE.Vector4(90, 20, 1.4, 1) },
    uFloor: { value: new THREE.Vector3(pal[3].r * 0.8, pal[3].g * 0.8, pal[3].b * 0.8) },
    uWash: { value: new THREE.Vector3(pal[1].r / Math.max(pal[0].r, 0.05), pal[1].g / Math.max(pal[0].g, 0.05), pal[1].b / Math.max(pal[0].b, 0.05)) },
    uWash2: { value: new THREE.Vector3(pal[2].r / Math.max(pal[0].r, 0.05), pal[2].g / Math.max(pal[0].g, 0.05), pal[2].b / Math.max(pal[0].b, 0.05)) },
    uWorld: { value: new THREE.Vector4(0, 0, 0, 0) }, uCat: { value: new THREE.Vector4(0, -100, 1, 0) }, uRare: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSky: { value: new THREE.Vector4(1, 0, 0, 0) }, uOpt: { value: new THREE.Vector4(0, 0, 1, 1) }, uWarm: { value: new THREE.Vector4(0, 0, 0, 1) }, uPix: { value: 0.0011 },
    uSd: { value: new THREE.Vector4(0.5, 0.5, 0.5, 0.5) }, uFig: { value: fig }, uFigB: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
}
export function makeTileMaterial(opts = {}) {
  const shared = opts.uniforms || makeTileUniforms(opts.palette);
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(opts.fog === false ? {} : THREE.UniformsUtils.clone(THREE.UniformsLib.fog), shared),   // fog per material, the rest shared by reference
    vertexShader: TILE_VERT, fragmentShader: TILE_FRAG, fog: opts.fog !== false, side: opts.side ?? THREE.FrontSide,
  });
}

// ---- geometry: a small accumulator of non-indexed triangles carrying the tile attributes ----
function makeAcc() {
  const P = [], N = [], T = [], PIC = [], SEED = [], SHADE = [], BOR = [];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const acc = {
    count: () => P.length / 9,
    vert(p, n, t, pic, seed, shade, bor) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); T.push(t[0], t[1]); PIC.push(pic); SEED.push(seed); SHADE.push(shade || 0); BOR.push(bor || 0); },
    // quad a,b,c,d (any winding; fixed against the normal). n: one normal or four; t: four tile coords
    quad(a, b, c, d, n, t, pic, seed, shade, bor) {
      const ns = Array.isArray(n[0]) ? n : [n, n, n, n];
      const e1 = sub(b, a), e2 = sub(c, a), m = ns[0];
      const fl = (e1[1] * e2[2] - e1[2] * e2[1]) * m[0] + (e1[2] * e2[0] - e1[0] * e2[2]) * m[1] + (e1[0] * e2[1] - e1[1] * e2[0]) * m[2] < 0;
      const v = [a, b, c, d], order = fl ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
      for (const i of order) acc.vert(v[i], ns[i], t[i], pic, seed, shade, bor);
    },
    // any three.js geometry (position, normal, uv), transformed; tile coords = uv * tileScale
    geo(g, mat, pic, seed, tileScale, shade) {
      const gg = g.index ? g.toNonIndexed() : g; gg.applyMatrix4(mat);
      const p = gg.attributes.position, n = gg.attributes.normal, uv = gg.attributes.uv;
      for (let i = 0; i < p.count; i++) acc.vert([p.getX(i), p.getY(i), p.getZ(i)], [n.getX(i), n.getY(i), n.getZ(i)], [uv.getX(i) * tileScale[0], uv.getY(i) * tileScale[1]], pic, seed, shade);
      if (gg !== g) gg.dispose(); g.dispose();
    },
    // one attribute at a time; pause (optional) hands the page back between them
    async build(pause) {
      const g = new THREE.BufferGeometry();
      for (const [name, a, k] of [['position', P, 3], ['normal', N, 3], ['aTile', T, 2], ['aPic', PIC, 1], ['aSeed', SEED, 1], ['aShade', SHADE, 1], ['aBorder', BOR, 1]]) {
        g.setAttribute(name, new THREE.Float32BufferAttribute(a, k)); await pause?.();
      }
      g.computeBoundingSphere(); await pause?.(); g.computeBoundingBox();
      return g;
    },
  };
  return acc;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('sea-wall') : ctx.rng;
  const R = 40, L = Math.max(50, Math.min(opts.arc ?? 90, 230)), A = L / (2 * R);
  const Y0 = 0.9, HP = 20.2, Y1 = Y0 + HP, YC = 22.1, BW = 1.4;
  const travel = opts.travel === -1 ? -1 : 1;
  const U = makeTileUniforms(opts.palette);
  if ((opts.border ?? (rng.chance(0.25) ? 'manganese' : 'ochre')) === 'manganese') U.uOpt.value.x = 1;   // swapped inside border ornament only
  U.uPanel.value.set(L, HP, BW, travel);
  U.uSd.value.set(rng(), rng(), rng(), rng());
  const cast = opts.cast === 'fishing' ? 1 : opts.cast === 'galleon' ? 2 : 0; U.uFigB.value.z = cast;
  const mat = makeTileMaterial({ uniforms: U, side: THREE.DoubleSide });
  const object = new THREE.Group(); object.name = 'azulejo-sea-wall';

  // arc frame: a = angle about the arc centre, dr = metres toward the centre (the front), y up
  const pt = (a, dr, y) => [(R - dr) * Math.sin(a), y, R - (R - dr) * Math.cos(a)];
  const dirN = (a, ndr, ny) => [-Math.sin(a) * ndr, ny, Math.cos(a) * ndr];
  const acc = makeAcc();
  // sweep a profile [[dr,y,pic,seed,shade],...] along the arc; face normal = (dy,-ddr) in the (dr,y) plane
  function sweep(prof, a0, a1, n, tv0 = 0) {
    let v = tv0;
    for (let k = 0; k < prof.length - 1; k++) {
      const p0 = prof[k], p1 = prof[k + 1], ddr = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(ddr, dy) || 1e-6;
      const ndr = dy / len, ny = -ddr / len;
      for (let i = 0; i < n; i++) {
        const aa = a0 + (a1 - a0) * (i / n), ab = a0 + (a1 - a0) * ((i + 1) / n);
        const na = dirN(aa, ndr, ny), nb = dirN(ab, ndr, ny);
        acc.quad(pt(aa, p0[0], p0[1]), pt(ab, p0[0], p0[1]), pt(ab, p1[0], p1[1]), pt(aa, p1[0], p1[1]), [na, nb, nb, na],
          [[aa * R, v], [ab * R, v], [ab * R, v + len], [aa * R, v + len]], p0[2] ?? 0, p0[3] ?? 0, p0[4] ?? 0);
      }
      v += len;
    }
  }
  // the same, one profile segment at a time, handing the page back between them
  async function sweepY(prof, a0, a1, n) {
    let v = 0;
    for (let k = 0; k < prof.length - 1; k++) { sweep([prof[k], prof[k + 1]], a0, a1, n, v); v += Math.hypot(prof[k + 1][0] - prof[k][0], prof[k + 1][1] - prof[k][1]) || 1e-6; await ctx.yield?.(); }
  }
  // a box in the arc frame at angle a: t0..t1 along the tangent, dr0..dr1, y0..y1; optional taper of the top
  function box(a, t0, t1, d0, d1, y0, y1, pic, seed, shade = 0, taper = 0, top = true) {
    const c = Math.cos(a), s = Math.sin(a);
    const P3 = (t, dr, y) => { const b = pt(a, dr, y); return [b[0] + c * t, y, b[2] + s * t]; };
    const tm = (t0 + t1) / 2, dm = (d0 + d1) / 2, k = 1 - taper;
    const T0 = tm + (t0 - tm) * k, T1 = tm + (t1 - tm) * k, D0 = dm + (d0 - dm) * k, D1 = dm + (d1 - dm) * k;
    const nT = [c, 0, s], nD = dirN(a, 1, 0), neg = (v) => [-v[0], -v[1], -v[2]];
    const tu = a * R;
    acc.quad(P3(t0, d1, y0), P3(t1, d1, y0), P3(T1, D1, y1), P3(T0, D1, y1), nD, [[tu + t0, y0], [tu + t1, y0], [tu + T1, y1], [tu + T0, y1]], pic, seed, shade);
    acc.quad(P3(t0, d0, y0), P3(t1, d0, y0), P3(T1, D0, y1), P3(T0, D0, y1), neg(nD), [[tu + t0, y0], [tu + t1, y0], [tu + T1, y1], [tu + T0, y1]], pic, seed, shade);
    acc.quad(P3(t1, d0, y0), P3(t1, d1, y0), P3(T1, D1, y1), P3(T1, D0, y1), nT, [[d0, y0], [d1, y0], [D1, y1], [D0, y1]], pic, seed, shade);
    acc.quad(P3(t0, d0, y0), P3(t0, d1, y0), P3(T0, D1, y1), P3(T0, D0, y1), neg(nT), [[d0, y0], [d1, y0], [D1, y1], [D0, y1]], pic, seed, shade);
    if (top) acc.quad(P3(T0, D0, y1), P3(T1, D0, y1), P3(T1, D1, y1), P3(T0, D1, y1), [0, 1, 0], [[tu + T0, D0], [tu + T1, D0], [tu + T1, D1], [tu + T0, D1]], pic, seed, shade);
  }
  const mTmp = new THREE.Matrix4(), qTmp = new THREE.Quaternion(), vS = new THREE.Vector3(), vP = new THREE.Vector3();
  const place = (a, dr, y, scale = 1, t = 0, ry = 0) => {            // matrix for a kit geometry standing in the arc frame
    const b = pt(a, dr, y); qTmp.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + ry);
    return mTmp.compose(vP.set(b[0] + Math.cos(a) * t, y, b[2] + Math.sin(a) * t), qTmp, vS.set(scale, scale, scale)).clone();
  };
  const urnPts = [[0, 0], [0.42, 0], [0.42, 0.12], [0.2, 0.2], [0.16, 0.42], [0.34, 0.6], [0.56, 0.95], [0.6, 1.25], [0.5, 1.5], [0.3, 1.62], [0.36, 1.7], [0.36, 1.78], [0.2, 1.86], [0.1, 2.1], [0.19, 2.24], [0.12, 2.42], [0, 2.5]].map((p) => new THREE.Vector2(p[0], p[1]));
  const urn = (a, dr, y, scale, pic, seed, t = 0) => acc.geo(new THREE.LatheGeometry(urnPts, 12), place(a, dr, y, scale, t), pic, seed, [2.4 * scale, 2.6 * scale], 0);

  // 1. the picture: one cylinder strip, tile coords = (arc length from the centre, height above the panel foot)
  sweep([[0, Y0, 1, rng()], [0, Y1]], -A, A, 144);
  await ctx.yield?.();
  // 2. plinth: deep glazed kick, lattice dado, moulded ledge
  await sweepY([[0.78, 0, 6, 0.5], [0.78, 0.2, 6, 0.3], [0.64, 0.28, 3, 0.2, 0.35], [0.64, 0.6, 6, 0.3], [0.5, 0.68, 0, 0.1], [0.36, 0.76, 6, 0.9], [0.36, 0.84, 0, 0.3], [0, Y0]], -A, A, 96);
  await ctx.yield?.();
  // 3. cornice: cyma, ochre fascia, shaded soffit, manganese lip, wet ledge
  await sweepY([[0, Y1, 0, 0.2, 0.5], [0.12, Y1 + 0.08, 0, 0.2, 0.2], [0.12, Y1 + 0.2, 0, 0.4, 0.75], [0.32, Y1 + 0.4, 6, 0.7], [0.32, Y1 + 0.52, 0, 0.4, 0.8], [0.46, Y1 + 0.58, 0, 0.6, 0.15],
    [0.46, Y1 + 0.7, 0, 0.6, 0.7], [0.7, Y1 + 0.86, 6, 0.9], [0.7, YC, 5, 0.3], [0.15, YC]], -A, A, 96);
  await ctx.yield?.();
  // 4. baroque crest: arched cartouche gable, concave sweeps, volutes, then a coping cut as wave crests
  const cH = rng.range(4.6, 5.8), cw = rng.range(3.2, 4.2), wl = rng.range(2.6, 3.4);
  const hc = (s) => {
    const x = Math.abs(s);
    if (x < cw) return cH + 1.5 * Math.sqrt(Math.max(0, 1 - (x / cw) * (x / cw)));
    if (x < cw + 0.6) return cH;
    if (x < cw + 4.2) { const t = (x - cw - 0.6) / 3.6; return 1.7 + (cH - 2.7) * (1 - t) * (1 - t); }
    if (x < cw + 6.6) return 1.7 + 0.75 * Math.sin(Math.PI * (x - cw - 4.2) / 2.4);
    return 1.12 + 0.4 * Math.abs(Math.sin((x - cw - 6.6) * Math.PI / wl));
  };
  const NC = 280, crestSeed = rng();
  for (let i = 0; i < NC; i++) {
    const a0 = -A + (2 * A * i) / NC, a1 = -A + (2 * A * (i + 1)) / NC, s0 = a0 * R, s1 = a1 * R, h0 = hc(s0), h1 = hc(s1);
    const f = (a, y) => pt(a, 0.15, y), b = (a, y) => pt(a, -0.75, y);
    acc.quad(f(a0, YC), f(a1, YC), f(a1, YC + h1), f(a0, YC + h0), [dirN(a0, 1, 0), dirN(a1, 1, 0), dirN(a1, 1, 0), dirN(a0, 1, 0)], [[s0, 0], [s1, 0], [s1, h1], [s0, h0]], 10, crestSeed);
    acc.quad(b(a0, YC), b(a1, YC), b(a1, YC + h1), b(a0, YC + h0), [dirN(a0, -1, 0), dirN(a1, -1, 0), dirN(a1, -1, 0), dirN(a0, -1, 0)], [[s0, 0], [s1, 0], [s1, h1], [s0, h0]], 3, 0.4);
    const ds = s1 - s0, dh = h1 - h0, len = Math.hypot(ds, dh), am = (a0 + a1) / 2;      // the cap: a cobalt line on the silhouette
    const n = [Math.cos(am) * (-dh / len), ds / len, Math.sin(am) * (-dh / len)];
    acc.quad(pt(a0, 0.22, YC + h0), pt(a1, 0.22, YC + h1), pt(a1, -0.82, YC + h1), pt(a0, -0.82, YC + h0), n, [[s0, 0], [s1, 0], [s1, 1], [s0, 1]], 6, 0.3);
    if (i % 56 === 55) await ctx.yield?.();
  }
  // 5. the back: wet walk behind the crest, drip mould, battered diaper wall, stepped buttresses
  await sweepY([[-0.75, YC, 4, 0.2], [-1.6, YC, 0, 0.3], [-1.6, YC - 0.5, 6, 0.3], [-1.8, YC - 0.62, 2, 0.6], [-3.4, 0]], -A, A, 72);
  const nB = rng.int(6, 8);
  for (let i = 0; i < nB; i++) {
    const a = -A + (2 * A * (i + 0.5)) / nB + rng.range(-0.02, 0.02), w = rng.range(1.1, 1.4);
    box(a, -w, w, -5.7, -2.6, 0, 7 + rng.range(-0.6, 0.6), 3, rng(), 0, 0.07);
    box(a, -w * 0.86, w * 0.86, -4.5, -2.2, 6.4, 14, 3, rng(), 0, 0.08);
    box(a, -w * 0.72, w * 0.72, -3.4, -1.9, 13.4, 19, 0, rng(), 0, 0.1);
    box(a, -w * 0.8, w * 0.8, -3.5, -1.8, 19, 19.35, 6, 0.3, 0, 0.3);
  }
  await ctx.yield?.();
  // 6. end piers with inset lattice panels, ochre neck bands, fish-scale caps and tall urns
  for (const sg of [-1, 1]) {
    const a = sg * A, t0 = sg > 0 ? -0.25 : -2.75, t1 = sg > 0 ? 2.75 : 0.25, pTop = YC + 1.2 + rng.range(0, 0.8), ps = rng();
    box(a, t0 - 0.22, t1 + 0.22, -4.0, 1.32, 0, 1.5, 6, 0.5, 0, 0.03);
    box(a, t0, t1, -3.8, 1.1, 1.5, pTop, 2, ps);
    box(a, t0 + 0.55, t1 - 0.55, 1.1, 1.18, 3.2, pTop - 2.4, 3, ps + 0.3, 0, 0, false);
    box(a, t0 + 0.4, t1 - 0.4, 1.1, 1.22, 2.9, 3.2, 6, 0.9); box(a, t0 + 0.4, t1 - 0.4, 1.1, 1.22, pTop - 2.4, pTop - 2.1, 6, 0.9);
    box(a, t0 - 0.15, t1 + 0.15, -3.95, 1.25, pTop, pTop + 0.25, 6, 0.7);
    box(a, t0 - 0.34, t1 + 0.34, -4.14, 1.44, pTop + 0.25, pTop + 0.85, 0, ps, 0.1);
    box(a, t0 - 0.2, t1 + 0.2, -4.0, 1.3, pTop + 0.85, pTop + 2.2, 5, ps, 0, 0.62);
    urn(a, -1.35, pTop + 2.2, 1.45, 2, ps + 0.1, (t0 + t1) / 2);
    await ctx.yield?.();
  }
  // 7. urns on the crest: gable shoulders, volutes, and every few wave cusps out to the piers
  const urnAt = (s, sc) => { const a = s / R, y = YC + hc(s); box(a, -0.36 * sc, 0.36 * sc, -0.72, 0.12, y - 0.5, y + 0.3 * sc, 0, 0.5, 0.1); urn(a, -0.3, y + 0.3 * sc, 0.72 * sc, rng.chance(0.5) ? 2 : 3, rng()); };
  for (const sg of [-1, 1]) {
    urnAt(sg * (cw + 0.3), 1.15); urnAt(sg * (cw + 5.4), 0.95);
    await ctx.yield?.();
    for (let x = cw + 6.6 + wl * 2; x < L / 2 - 2; x += wl * 3) { urnAt(sg * x, 0.85); await ctx.yield?.(); }
  }
  // 8. marks of use: glazed pots with clipped shrubs along the plinth, a tile-setter's ladder and pail
  const potPts = [[0, 0], [0.3, 0], [0.34, 0.1], [0.5, 0.55], [0.52, 0.72], [0.58, 0.76], [0.58, 0.86], [0.46, 0.86], [0, 0.8]].map((p) => new THREE.Vector2(p[0], p[1]));
  const nPots = rng.int(5, 8);
  for (let i = 0; i < nPots; i++) {
    const a = (rng.chance(0.5) ? -1 : 1) * rng.range(0.25, A - 0.06), sc = rng.range(0.9, 1.25);
    acc.geo(new THREE.LatheGeometry(potPts, 12), place(a, 1.3, 0, sc), rng.chance(0.5) ? 2 : 3, rng(), [2, 0.9], 0);
    const sh = new THREE.IcosahedronGeometry(0.6 * sc, 1); sh.scale(1, rng.range(1.3, 2.1), 1);
    acc.geo(sh, place(a, 1.3, (0.86 + 0.8) * sc, 1), 16, rng.range(0.22, 0.5), [3.4, 3.4], 0.3);
    await ctx.yield?.();
  }
  {
    const a = (rng.chance(0.5) ? -1 : 1) * rng.range(0.45, Math.min(0.95, A - 0.1)), hgt = rng.range(7.5, 10.5), M = place(a, 1.75, 0.02).multiply(new THREE.Matrix4().makeRotationX(-Math.atan2(1.5, hgt)));
    for (const sx of [-0.3, 0.3]) acc.geo(new THREE.BoxGeometry(0.08, hgt, 0.1), M.clone().multiply(new THREE.Matrix4().makeTranslation(sx, hgt / 2, 0)), 6, 0.3, [0.2, hgt], 0);
    for (let y = 0.4; y < hgt - 0.2; y += 0.34) acc.geo(new THREE.BoxGeometry(0.6, 0.06, 0.06), M.clone().multiply(new THREE.Matrix4().makeTranslation(0, y, 0)), 6, 0.3, [0.6, 0.1], 0);
    acc.geo(new THREE.LatheGeometry(potPts, 10), place(a, 1.5, 0, 0.5, 0.9), 6, 0.1, [1, 0.5], 0);
  }
  await ctx.yield?.();
  // pedestal and rod for the armillary sphere
  const apexY = YC + cH + 1.5;
  box(0, -0.42, 0.42, -0.74, 0.14, apexY - 0.3, apexY + 0.7, 0, 0.5, 0.1, 0.25);
  acc.geo(new THREE.CylinderGeometry(0.07, 0.1, 1.0, 6), place(0, -0.3, apexY + 1.15), 6, 0.9, [0.5, 1], 0);
  await ctx.yield?.();
  const mesh = new THREE.Mesh(await acc.build(ctx.yield), mat); mesh.name = 'sea-wall'; object.add(mesh);
  await ctx.yield?.();

  // 9. the armillary sphere: the one part that turns in the round
  const acc2 = makeAcc(), I = new THREE.Matrix4(), RX = (x) => new THREE.Matrix4().makeRotationX(x), RZ = (z) => new THREE.Matrix4().makeRotationZ(z);
  acc2.geo(new THREE.TorusGeometry(1.5, 0.075, 6, 40), I, 6, 0.7, [9, 0.5], 0);
  await ctx.yield?.();
  acc2.geo(new THREE.TorusGeometry(1.5, 0.075, 6, 40), RX(Math.PI / 2), 6, 0.7, [9, 0.5], 0);
  await ctx.yield?.();
  acc2.geo(new THREE.TorusGeometry(1.5, 0.075, 6, 40), new THREE.Matrix4().makeRotationY(Math.PI / 2), 6, 0.7, [9, 0.5], 0);
  await ctx.yield?.();
  acc2.geo(new THREE.CylinderGeometry(1.64, 1.64, 0.34, 40, 1, true), RZ(0.41), 6, 0.9, [10, 0.34], 0);
  acc2.geo(new THREE.CylinderGeometry(0.05, 0.05, 3.9, 6), RZ(0.41 + Math.PI / 2 - 1.2), 6, 0.5, [0.3, 3.9], 0);
  acc2.geo(new THREE.SphereGeometry(0.42, 12, 8), I, 6, 0.5, [2, 1], 0);
  await ctx.yield?.();
  const armillary = new THREE.Mesh(await acc2.build(ctx.yield), mat); armillary.name = 'armillary';
  { const b = pt(0, -0.3, apexY + 3.2); armillary.position.set(b[0], b[1], b[2]); }
  object.add(armillary);
  await ctx.yield?.();

  // ---- the picture's cast, placed on the CPU each frame (snapped to whole tiles) ----
  const mixf = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const Yh = BW + (HP - 2 * BW) * (0.6 + 0.05 * U.uSd.value.x);
  const rowY = (i) => mixf(BW + 0.75, Yh - 0.2, 1 - Math.pow(1 - i / 9, 1.7)), rowS = (i) => mixf(1.5, 0.4, Math.pow(i / 9, 0.8));
  const snap = (x) => Math.floor(x / TILE) * TILE;
  const shipScale = cast === 1 ? 0.8 : 1, leadS = cast === 2 ? 1.32 : cast === 1 ? 1.12 : 1.27;   // the lead rides row 2: her hull sits in the near crests, her sails fill the panel
  const ships = [
    { off: 0, y: rowY(2) + 0.3 * rowS(2), s: leadS, ph: 0 },
    { off: rng.range(17, 21), y: rowY(4) + 0.3 * rowS(4), s: shipScale * 0.84, ph: 1.9 },
    { off: rng.range(34, 39), y: rowY(4) + 0.42 * rowS(4), s: shipScale * 0.78, ph: 4.1 },
  ];
  const whaleOff = rng.range(14, 16), whaleY = rowY(1) + 0.3 * rowS(1);
  const SPEED = 13.5, span = L + ships[2].off + 5, xMax = L / 2 - BW - 7.5, LEAD = Math.acos(0.8);   // 24 m ahead of a cab on the 32 m circle
  let progress = null, cabAngle = null, leadX = 0, whaleW = 0;
  const leadV = new THREE.Vector3(), whaleV = new THREE.Vector3();
  const facePoint = (x, y, out) => { const a = (x * travel) / R; return out.set((R - 0.05) * Math.sin(a), Y0 + y, R - (R - 0.05) * Math.cos(a)); };   // no allocation: runs every frame
  function pose(time) {
    if (cabAngle != null) {
      let x = (cabAngle * travel + LEAD) * R;
      if (x > xMax - 6) x = xMax - 6 * Math.exp(-(x - xMax + 6) / 6);                  // ease up to the end of the wall
      leadX = x; whaleW = progress != null ? Math.min(1, Math.max(0, (progress - 0.3) / 0.5)) : (time / 9 + 0.1) % 1;
    } else {
      leadX = -L / 2 - 8 + ((time * SPEED + span - 89) % span + span) % span;      // never an empty sea; lead at +20 m when time = 12
      whaleW = (((time / 9 + 0.1) % 1) + 1) % 1;
    }
    for (let i = 0; i < 3; i++) {
      const sh = ships[i], x = leadX - sh.off, k = x * 0.29 + sh.ph + time * 0.8;   // she pitches over the crests even while she holds station
      U.uFig.value[i].set(snap(x), cast === 2 && i ? -100 : snap(sh.y + 0.3 * sh.s * Math.sin(k)), 0.075 * Math.cos(k) + 0.02, sh.s);   // the galleon sails alone
    }
    const w = whaleW, rise = -4.7 + 6.1 * sstep(0, 0.3, w) - 7.2 * sstep(0.66, 1, w);
    U.uFig.value[3].set(snap(leadX - whaleOff + 2.5 * w), snap(whaleY + rise), mixf(0.38, -0.55, sstep(0.25, 0.95, w)), 1);
    U.uFigB.value.x = sstep(0.26, 0.36, w) * (1 - sstep(0.5, 0.62, w));
    U.uFigB.value.w = leadX;
    facePoint(leadX, U.uFig.value[0].y + 4.5 * leadS, leadV);
    facePoint(leadX - whaleOff, whaleY + 1, whaleV);
  }
  pose(12);

  // ---- anchors (local space) ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const flyThrough = [];
  for (let i = 0; i <= 12; i++) { const a = travel * (-1.5 + (3 * i) / 12); flyThrough.push(V3(32 * Math.sin(a), 12 - (5 * i) / 12, R - 32 * Math.cos(a))); }
  const anchors = {
    arcCentre: V3(0, 0, R), wallRadius: R, trackRadius: 32, travel,
    flyThrough,                                   // eye line round the hairpin, 8 m off the face
    lead: leadV, whale: whaleV,                   // live: where the lead caravel and the whale are on the face
    portalSeat: { position: V3(0, 9, R), facing: V3(0, 0, -1) },
    viewpoints: {
      midTurn: { position: V3(0, 9.6, 8), target: V3(travel * 22, 10, 6.5) },
      wide: { position: V3(-travel * 18, 15, 74), target: V3(0, 13, 6) },
      end: { position: V3(travel * 30, 8, 26), target: V3(travel * 34, 11, 15) },
    },
    crestTop: V3(0, apexY + 3.2, -0.3),
    sunHint: U.uSun.value.clone(),
  };

  let spin = rng.range(0, 6.28);
  return {
    object, radius: 27, height: Math.round(apexY + 5), center: V3(0, 12, 9), anchors,
    uniforms: U, material: mat, makeTileMaterial,
    /** p 0..1 = the cab's way round the hairpin (null = ambient loop). */
    setProgress(p) { progress = p; cabAngle = p == null ? null : (-0.5 + Math.min(1, Math.max(0, p))) * Math.PI; },
    /** cab angle about the arc centre in radians (0 = abreast of the wall centre, rising the way we travel). */
    setCab(angle) { cabAngle = angle; },
    update(dt, time, camera) {
      U.uTime.value = time;
      pose(time);
      spin += dt * 0.5 * (1 + 0.6 * Math.sin(time * 0.31));                              // gusting breeze
      armillary.rotation.set(0.12 * Math.sin(time * 0.7), spin, 0.41 * 0.3);
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
