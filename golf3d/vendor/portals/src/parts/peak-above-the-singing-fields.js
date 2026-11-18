// The Peak Above the Singing Fields: the hero part.
// ONE MOUNTAIN with its head in cloud, and the sky seen from its top. This file builds the mountain's body (a single
// tooth of grey granite 360 m high on a foot 400 m across, with great buttresses, joints and ledges, dressed by
// height: grass ledges low, bare jointed rock, first snow in the gullies at the crown's height, snow on every ledge
// of the last 60 m, a smooth pale level top), the two standing bodies of cloud (the crown round its head with a
// standing cleft, the far sea beyond a ring of open air), the cloud that travels between them,
// the land's own law, the route's knots, the shelf's stone shapes, the sky (one dome: colour by
// the eye's height, stars, the starless reach in the north) and the moon. Everything here is a STANDING STATE: one
// hour stands for the whole visit; what differs differs by PLACE (a point's own height, its own side of the
// mountain) and the sky alone by the EYE'S HEIGHT, never by metres flown, the route's parameter or a clock. What
// moves (cloud, falling water, mist, the reach's breathing edge) moves on the world's clock from phases dealt by its own
// stream.
//
// Units are metres. In the part's own space the mountain's axis is the origin's vertical; the world sets the part
// down at PLACE.AX, PLACE.AZ. Bearings are degrees clockwise seen from above, 0 = north (-Z), 90 = east (+X).
import * as THREE from 'three';
import { makeCloudField } from '../kit/sky.js';

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// THRIFT, THE SAME NUMBERS. The engine's Math.hypot lays its numbers in a fresh list at every call (dear in itself,
// and litter the collector must clear: the land's height asks it six times and more). These are its own sums for two
// numbers and for three, the same number to the bit,
// and every distance of this place, in the part and in the world, is worked by them.
export const hyp = (a, b) => {
  a = Math.abs(a); b = Math.abs(b); let m = 0; if (a > m) m = a; if (b > m) m = b;
  if (m === Infinity) return Infinity; if (a !== a || b !== b) return NaN; if (m === 0) return 0;
  const x = a / m, y = b / m; return Math.sqrt(x * x + y * y) * m;
};
export const hyp3 = (a, b, c) => {
  a = Math.abs(a); b = Math.abs(b); c = Math.abs(c); let m = 0; if (a > m) m = a; if (b > m) m = b; if (c > m) m = c;
  if (m === Infinity) return Infinity; if (a !== a || b !== b || c !== c) return NaN; if (m === 0) return 0;
  const x = a / m, y = b / m, z = c / m, s1 = x * x, s2 = y * y, p = s1 + s2, comp = (p - s1) - s2; return Math.sqrt(p + (z * z - comp)) * m;
};

// ---------------------------------------------------------------- the place
export const PLACE = {
  // the mountain's axis and its level top
  AX: 0, AZ: -350, TOP: 360,
  // the crown of cloud: its base, its top, how far it reaches from the axis
  CROWN0: 200, CROWN1: 280, CROWNR: 260,
  // the fall: the lip and the foot, in world coordinates (a cleft of the west face)
  FALLX: -152, FALLZ: -352, FALLTOP: 63, FALLFOOT: 8, FALLW: 16,
  // the vale's floor and the shelf's top
  VALE: 8, SHELF: 34,
};

// the face's radius by height: the profile of the tooth (metres from the axis)
const PROFILE = [[0, 200], [30, 165], [60, 140], [100, 120], [150, 98], [200, 78], [250, 58], [300, 36], [340, 16], [358, 7]];
export function faceRadiusAt(y) {
  if (y <= 0) return 200 - y * 1.2;
  for (let i = 1; i < PROFILE.length; i++) {
    if (y <= PROFILE[i][0]) { const a = PROFILE[i - 1], b = PROFILE[i]; return lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0])); }
  }
  return 7;
}

// the moon's height over the horizon, in degrees: clear over the crown's highest heaps as an eye above the cleft
// sees them
export const MOON_EL = 21;
// a direction from a bearing and a height in degrees (pointing TOWARD the body)
export function skyDir(elevation, bearing) {
  const e = elevation * DEG, a = bearing * DEG;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

// ---------------------------------------------------------------- the standing hour
// One hour stands for a whole visit. The visit's kind (golden, day, dawn, low) picks the sun's place and colours once.
export function makeHour(kind) {
  const H = {
    golden: { sunEl: 13, sunAz: -70, moonAz: 150, sun: '#ffd08a', sunK: 3.2, skyLow: '#9ec4ee', hemi: 1.2, zen: '#5f9be0', hor: '#f3d9a2', fogSun: '#f2dcae', fogAway: '#b9cfe6', rose: '#f1b79e', moonK: 1.0 },
    day: { sunEl: 30, sunAz: -70, moonAz: 150, sun: '#fff0d2', sunK: 3.3, skyLow: '#a9cbf2', hemi: 1.25, zen: '#4f8fe0', hor: '#dfe9f2', fogSun: '#eef0e6', fogAway: '#c3d6ec', rose: '#f3d9c4', moonK: 0.8 },
    dawn: { sunEl: 13, sunAz: 110, moonAz: -60, sun: '#ffb9a0', sunK: 3.0, skyLow: '#a7b9e8', hemi: 1.25, zen: '#6a94dc', hor: '#f6cfc0', fogSun: '#f6d2c2', fogAway: '#b7c6e6', rose: '#f3a9a4', moonK: 1.0 },
    low: { sunEl: 12, sunAz: -70, moonAz: 150, sun: '#ffb466', sunK: 3.1, skyLow: '#8fb0e6', hemi: 1.25, zen: '#4f83d6', hor: '#f6c98a', fogSun: '#f4cf98', fogAway: '#aebfe2', rose: '#ee9f8c', moonK: 1.25 },
  }[kind] || null;
  const h = H || makeHour('golden');
  if (!H) return h;
  h.kind = kind;
  h.sunDir = skyDir(h.sunEl, h.sunAz);
  h.moonDir = skyDir(MOON_EL, h.moonAz);
  return h;
}

// ---------------------------------------------------------------- the light all of this world's own shaders share
// One set of uniform objects (shared by reference, so one write reaches every shader) and one piece of GLSL: the
// sun, the sky's fill (thinner above the crown, by the lit point's own height), the moon's small silver, the air
// (the world's thin air and the land's haze, by the sight line's own path), the mountain's shadow on the land as one
// analytic wedge, the shadows of the shelf's stone shapes, of the small travelling clouds and of the far sea's bank.
export const MAX_SHAPES = 14, MAX_CLOUDS = 16;
// the air's numbers: the thin fog of the whole world, the land's haze, the top of the land's air and how softly it ends
export const AIR = { fog: 0.000256, haze: 0.0006, top: 120, soft: 60 };
export function makeLight(hour, opts = {}) {
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const shapes = [], shapesB = [];
  for (let i = 0; i < MAX_SHAPES; i++) { shapes.push(new THREE.Vector4(0, 0, 1, 1)); shapesB.push(new THREE.Vector4(0, 0, 0, 0)); }
  const clouds = [];
  for (let i = 0; i < MAX_CLOUDS; i++) clouds.push(new THREE.Vector4(0, 225, 0, 0));
  const u = {
    uSunDir: { value: hour.sunDir.clone() }, uSunCol: { value: col(hour.sun, hour.sunK / Math.PI) },
    uMoonDir: { value: hour.moonDir.clone() }, uMoonCol: { value: col('#c3d0ee', 0.55 * hour.moonK) },
    uSkyLow: { value: col(hour.skyLow, hour.hemi / Math.PI) }, uGroundLow: { value: col('#6f8a4e', 0.8 * hour.hemi / Math.PI) },
    uSkyHigh: { value: col('#31479c', 0.3) }, uSeaBounce: { value: col('#a9a8c8', 0.5).lerp(col(hour.rose, 0.5), 0.25) },
    uFogSun: { value: col(hour.fogSun) }, uFogAway: { value: col(hour.fogAway) },
    uCloudLit: { value: col('#f6f1e6', 0.92) }, uCloudShade: { value: col('#a9a8c8', 0.8) },
    // the air: one thin fog for the whole world, and the land's own haze (a layer of air below uFog.z, soft to uFog.w)
    uFog: { value: new THREE.Vector4(opts.fog ?? AIR.fog, opts.haze ?? AIR.haze, AIR.top, AIR.soft) },
    uAxis: { value: new THREE.Vector3(PLACE.AX, PLACE.CROWNR, PLACE.AZ) },
    // the far sea: its shore's mean distance from the axis and its tops' height
    uSea: { value: new THREE.Vector4(1560, 236, 192, 0) },
    // the small clouds of the open ring, where each stands at this moment of the world's clock (x, y, z, breadth)
    uCloudN: { value: 0 }, uCloudP: { value: clouds },
    uTime: { value: 0 }, uShapeN: { value: 0 }, uShape: { value: shapes }, uShapeB: { value: shapesB },
    uWind: { value: new THREE.Vector2(Math.sin(110 * DEG), -Math.cos(110 * DEG)) },
    // EVERY TRAVELLING FIELD HAS ITS OWN PLACE IN ITS RUN: two numbers (0 to 97) for each, dealt once by the world
    // from a stream of that field's own and added to the field's coordinates (as the far sea's uSeaPh): the gusts
    // over the land, the dust veil over the shelf, the grass's waves, the river's net of light, the pools' ripple,
    // the falling thread's shimmer. So no clock value shows the same gust in the same field on two visits
    uPhGust: { value: new THREE.Vector2() }, uPhDust: { value: new THREE.Vector2() }, uPhWave: { value: new THREE.Vector2() },
    uPhNet: { value: new THREE.Vector2() }, uPhRip: { value: new THREE.Vector2() }, uPhShim: { value: new THREE.Vector2() },
  };
  return { uniforms: u, hour };
}

export const PEAK_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uMoonDir, uMoonCol, uSkyLow, uGroundLow, uSkyHigh, uSeaBounce, uFogSun, uFogAway, uCloudLit, uCloudShade, uAxis;
uniform vec4 uFog, uSea; uniform float uTime; uniform int uShapeN, uCloudN; uniform vec4 uCloudP[${MAX_CLOUDS}]; uniform vec4 uShape[${MAX_SHAPES}], uShapeB[${MAX_SHAPES}]; uniform vec2 uWind, uPhGust, uPhDust, uPhWave, uPhNet, uPhRip, uPhShim;
float ph1(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float pn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(ph1(i),ph1(i+vec3(1.,0.,0.)),f.x),mix(ph1(i+vec3(0.,1.,0.)),ph1(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(ph1(i+vec3(0.,0.,1.)),ph1(i+vec3(1.,0.,1.)),f.x),mix(ph1(i+vec3(0.,1.,1.)),ph1(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
float pfbm3(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*pn3(p); p=p*2.03+vec3(11.3,7.1,5.7); a*=.5; } return s; }
float ph2(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float pn2(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(ph2(i),ph2(i+vec2(1.,0.)),f.x),mix(ph2(i+vec2(0.,1.)),ph2(i+vec2(1.,1.)),f.x),f.y); }
float pfbm2(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*pn2(p); p=p*2.03+vec2(17.3,9.1); a*=.5; } return s; }
// one family of parallel joints across a coordinate, at uneven spacing (the coordinate counts beds): x = how far to
// the nearest joint (in beds), y = a number for the bed between two joints
vec2 jset(float c, float k){
  float i=floor(c), f=c-i, d=f-(.2+.6*ph2(vec2(i,k)));
  float dn=d<0. ? f+.8-.6*ph2(vec2(i-1.,k)) : 1.2+.6*ph2(vec2(i+1.,k))-f;
  return vec2(min(abs(d),dn),ph2(vec2(d<0. ? i : i+1.,k+7.3)));
}
vec3 ph33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
// jointed granite: beds lying a little out of level and two families of upright joints, every family at uneven
// spacing, the upright ones leaning and running through several beds, so no two blocks are alike and none is a
// cell of a net or a course of a wall.
// x = how far the block stands out (0..1; it falls away into the joints over a rounded edge), y = 1 in a joint,
// z = a number for the block; tilt = the way the block's own face is turned from the mean face. A family that lies
// in the face itself (N across it) draws no joint there. px (metres a pixel) widens the edges with the eye's
// distance, so far rock is calm.
vec3 jointed(vec3 p, vec3 N, float px, out vec3 tilt){
  // the beds undulate, pinch and swell; the two upright families lean, one each way
  float wy=p.y+.09*dot(p.xz,vec2(.8,.6))+5.*pn3(p*.013)+2.4*pn3(p*.045+3.)+.5*pn3(p*.21);
  vec2 b=jset(wy/3.6,1.);
  // the upright joints are master joints: one runs up through three or four beds before the next set takes over
  // (never bed by bed, which is a mason's bond)
  float st=jset(wy/13.+.4*pn3(p*.02+31.),8.).y*37.;
  vec3 q=p+2.6*vec3(pn3(p*.021+5.),0.,pn3(p*.021+9.))+.7*vec3(pn3(p*.09+1.),0.,pn3(p*.09+4.));
  vec2 j1=jset((dot(q.xz,vec2(.83,.56))+.27*q.y)/5.6+st,2.), j2=jset((dot(q.xz,vec2(-.56,.83))-.36*q.y)/8.2+st*1.7,3.);
  float kb=smoothstep(.2,.55,length(N.xz)), k1=smoothstep(.2,.55,length(vec2(N.y,dot(N.xz,vec2(-.56,.83))))), k2=smoothstep(.2,.55,length(vec2(N.y,dot(N.xz,vec2(.83,.56)))));
  // the rock is massive in places and broken in others, and no joint runs on for ever: each family comes and goes
  float broken=smoothstep(.3,.62,pn3(p*.03+7.));
  vec3 lv=vec3(smoothstep(.36,.58,pn3(p*.05+vec3(0.,b.y*9.,0.))),smoothstep(.42,.58,pn3(p*.11+11.+st)),smoothstep(.45,.6,pn3(p*.09+23.+st))), live=lv*broken;
  vec3 dm=vec3(b.x*3.6,j1.x*5.6,j2.x*8.2);
  float rw=.3+px*1.6, jw=.03+px*.45;
  vec3 kk=vec3(kb,k1,k2)*live;
  vec3 e=mix(vec3(1.),smoothstep(vec3(0.),vec3(rw),dm),kk), cr=(1.-smoothstep(vec3(jw*.4),vec3(jw),dm))*kk;
  // a block's own number is whole on either side of a joint that is there, and one number across a joint that is
  // not: the four numbers a block could have (with and without each upright family) are eased by how much of each
  // family lives at the place, and all of it by the beds' own life (so no number changes from pixel to pixel)
  vec3 hA=ph33(vec3(b.y,0.,0.)*91.7+3.1), hB=ph33(vec3(b.y,j1.y,0.)*91.7+3.1), hC=ph33(vec3(b.y,0.,j2.y)*91.7+3.1), hD=ph33(vec3(b.y,j1.y,j2.y)*91.7+3.1);
  vec3 h3=mix(vec3(.5),mix(mix(hA,hB,lv.y),mix(hC,hD,lv.y),lv.z),lv.x);
  tilt=(h3-.5)*vec3(1.,.5,1.)*broken;
  return vec3(mix(.6,.3+.7*h3.x,broken)*min(e.x,min(e.y,e.z)),max(cr.x,max(cr.y,cr.z)),mix(.5,h3.y,broken));
}
// the shelf's pavement: long slabs between two families of joints in the plan, the cross joints staggered from
// slab to slab. x = metres to the nearest joint, y = a number for the slab (and, in slabs: z = the number of the
// long strip between two joints of the 8.5 m family, the same all along it, w = how much of that family's joint
// lives at the place, going to nothing over the last half metre to the joint itself: what is scaled by it is whole
// across the joint)
vec4 slabs(vec2 p){
  vec2 q=p+5.*vec2(pn2(p*.02),pn2(p*.02+5.))+1.2*vec2(pn2(p*.11+2.),pn2(p*.11+8.));
  vec2 a=jset(dot(q,vec2(.906,.423))/8.5,4.);
  vec2 c=jset(dot(q,vec2(-.423,.906))/23.+a.y*31.,5.);
  // no joint runs on for ever: each comes and goes along its length
  float la=smoothstep(.34,.5,pn2(p*.045+a.y*9.)), lc=smoothstep(.42,.6,pn2(p*.06+17.+a.y*5.));
  return vec4(min(mix(9.,a.x*8.5,la),mix(9.,c.x*23.,lc)),fract(a.y*3.1+c.y*7.7*lc),a.y,la*smoothstep(0.,.06,a.x));
}
vec2 slab(vec2 p){ return slabs(p).xy; }
// the tooth's radius by height (the same profile the body is built from)
float faceR(float y){
  float r=mix(200.,165.,clamp(y/30.,0.,1.));
  r=mix(r,140.,clamp((y-30.)/30.,0.,1.)); r=mix(r,120.,clamp((y-60.)/40.,0.,1.)); r=mix(r,98.,clamp((y-100.)/50.,0.,1.));
  r=mix(r,78.,clamp((y-150.)/50.,0.,1.)); r=mix(r,58.,clamp((y-200.)/50.,0.,1.)); r=mix(r,36.,clamp((y-250.)/50.,0.,1.));
  r=mix(r,16.,clamp((y-300.)/40.,0.,1.)); r=mix(r,7.,clamp((y-340.)/18.,0.,1.)); return r; }
// the mountain's shadow on a point of the land: 1 in the sun, less in the shade. ONE RULE OF THE SUN AND THE PLACE:
// the rock's shadow is its own outline thrown along the sun's ray (the buttresses stand out of the outline: its edge
// is no ruled line), soft by the sun's breadth and the air, the softer the further it falls; where the head's
// shadow ends lies the crown's (the cloud round the head is 260 m across and thin at its rim: a broad, ragged,
// lighter shade); and all of it is filled by the air's own light with distance, so its far end is lost in the haze
float peakShade(vec3 wp){
  vec2 q=wp.xz-uAxis.xz; float hl=max(length(uSunDir.xz),1e-4); vec2 sh=uSunDir.xz/hl;
  float t=-dot(q,sh), side=q.x*sh.y-q.y*sh.x, tp=max(t,0.), cot=hl/max(uSunDir.y,.05);
  float y=wp.y+tp/cot;
  float w=3.+tp*.07;
  float rock=(1.-smoothstep(-w,w,abs(side)-faceR(y)*(.94+.24*(pn2(vec2(y*.035,sign(side)*9.3))-.5))))*step(0.,t)*(1.-smoothstep(350.,362.,y));
  vec2 e=vec2((t-237.*cot)/(uAxis.y*.95+45.*cot),side/(uAxis.y*.9));
  float crown=.6*(1.-smoothstep(.5,1.05,length(e)+.3*(pfbm2(vec2(t,side)*.006)-.5)))*step(0.,t);
  return 1.-max(rock,crown)*(1.-.75*smoothstep(500.,1500.,tp));
}
// the shadows of the shelf's stone shapes (a place, a breadth across the wind, a height and a lean each; the
// breadth by height is the fin's own law, see buildShapes): 1 in the sun
float shapeShade(vec3 wp){
  float hl=max(length(uSunDir.xz),1e-4); vec2 sh=uSunDir.xz/hl; float tanE=uSunDir.y/hl, lit=1.;
  for(int i=0;i<${MAX_SHAPES};i++){
    if(i>=uShapeN) break;
    vec4 S=uShape[i], B=uShapeB[i];
    float y0=wp.y-B.x;
    // the shape leans downwind by B.yz a metre of height: take its middle at the height the ray meets it
    vec2 q=wp.xz-S.xy; float t=-dot(q,sh);
    float y=y0+max(t,0.)*tanE; float k=clamp(y/max(S.w,1.),0.,1.);
    vec2 q2=q-B.yz*y; t=-dot(q2,sh); float d=abs(q2.x*sh.y-q2.y*sh.x);
    float prof=S.z*pow(max(1.-pow(k,1.25),0.),.71)+.25;
    float w=1.5+max(t,0.)*.03;
    float inside=(1.-smoothstep(-w,w,d-prof))*smoothstep(S.z*.5,S.z*1.1,t)*(1.-smoothstep(S.w*.9,S.w*1.04,y))*step(0.,y);
    lit=min(lit,1.-inside);
  }
  return lit;
}
// the shadows of the small clouds of the open ring, each cast from where that cloud stands now, along the sun's
// own ray: 1 in the sun. A cloud is thin, so its shadow is soft and never dark. And the far sea's own shade: a point
// from which the sun stands behind the far sea's bank (the ray to the sun leaves the ring of open air under the
// bank's top) is in the bank's shade; the land under the sheet is in it altogether
float cloudShade(vec3 wp){
  float hl=max(length(uSunDir.xz),1e-4); vec2 sh=uSunDir.xz/hl; float inv=1./max(uSunDir.y,.08), lit=1.;
  vec2 qa=wp.xz-uAxis.xz; float ba=dot(qa,sh), disc=ba*ba-dot(qa,qa)+uSea.x*uSea.x;
  float ys=disc>0. ? wp.y+(-ba+sqrt(max(disc,0.)))*uSunDir.y/hl : -1e3;
  lit=mix(.42,1.,smoothstep(uSea.y-26.,uSea.y+30.,ys));
  for(int i=0;i<${MAX_CLOUDS};i++){
    if(i>=uCloudN) break;
    vec4 C=uCloudP[i];
    vec2 q=wp.xz+uSunDir.xz*((C.y-wp.y)*inv)-C.xz;
    float al=dot(q,sh), ac=q.x*sh.y-q.y*sh.x;
    float d=length(vec2(al*.85,ac))/max(C.w,1.);
    lit=min(lit,1.-.5*(1.-smoothstep(.45,1.15,d))*step(wp.y,C.y-4.));
  }
  return lit;
}
// light on a point: sun (times what reaches it), the sky's fill by the point's own height, the moon's silver
vec3 peakLit(vec3 alb, vec3 N, vec3 wp, float sun, float ao){
  float hi=smoothstep(250.,290.,wp.y);
  vec3 fill=mix(mix(uGroundLow,uSeaBounce,hi), mix(uSkyLow,uSkyHigh,hi), clamp(N.y*.42+.58,0.,1.));
  // a point that stands inside the crown (between its base and its tops, within its reach of the axis) takes the
  // cloud's own light as well: white, soft, from every side
  float inCrown=smoothstep(176.,204.,wp.y)*(1.-smoothstep(286.,318.,wp.y))*(1.-smoothstep(uAxis.y*.8,uAxis.y,length(wp.xz-uAxis.xz)));
  fill+=mix(uCloudLit,uSunCol,.3)*.5*inCrown;
  // a face that stands (rock, a stone shape) takes the light the lit land, the bright haze and the crown throw back
  // at it, from every side: its shade is blue and open, never black
  fill+=(uSunCol*.08+uSkyLow*.8)*(1.-abs(N.y))*(1.-.5*hi);
  // and a face that stands over the crown takes the light of the crown's lit tops, which lie under it and about it
  // on every side: strongest just over the tops, less toward the last rock's head
  fill+=mix(uCloudLit,uSunCol,.3)*.42*smoothstep(286.,318.,wp.y)*(1.-.6*smoothstep(318.,356.,wp.y))*(1.-.7*max(N.y,0.));
  return alb*(uSunCol*max(dot(N,uSunDir),0.)*sun + fill*ao + uMoonCol*max(dot(N,uMoonDir),0.)*(.5+.5*ao));
}
// the air between the eye and a point: the world's one thin air (clear for two kilometres, then closing fast, so
// that the furthest things go into the sky's own horizon colour), and the land's haze, which lies in the air below
// uFog.z (ending softly over uFog.w) and is counted along the part of the sight line that runs through that air
vec3 peakAir(vec3 col, vec3 wp){
  vec3 v=wp-cameraPosition; float d=length(v); vec3 dir=v/max(d,1e-3);
  float ya=cameraPosition.y, yb=wp.y, lo=min(ya,yb), hi=max(ya,yb);
  float top=uFog.z+.5*uFog.w;
  float inl=clamp((top-lo)/max(hi-lo,1.),0.,1.)*(1.-smoothstep(uFog.z-.5*uFog.w,top,lo));
  float sunny=pow(clamp(dot(normalize(dir.xz+vec2(1e-5,0.)),normalize(uSunDir.xz))*.5+.5,0.,1.),2.);
  float k1=uFog.y*(.8+.45*sunny)*d*inl, k0=uFog.x*d;
  float f=1.-exp(-k0*k0*k0*k0-k1*k1);
  return mix(col,mix(uFogAway,uFogSun,sunny),f);
}
`;

// ---------------------------------------------------------------- the mountain's form
// The body is one skin over the axis: a radius for every bearing and height. The profile is the ENVELOPE: buttress
// gullies, flutes, crags and ledges all cut inward from it, so nothing of the face stands outside faceRadiusAt(y)
// by more than 2 m, except the fall's lip (a spur 12 m out of the west face at 63 m, 55 m from the route's line)
// and THE NORTH BUTTRESS: one great spur of the same granite standing out of the north-north-west face from the
// ground to the crown's base, up to 58 m beyond the envelope at its crest, stepping in on three broad benches (near
// 100, 140 and 174 m) as the face steps in on its ledges; its bearing, breadth, reach and benches are dealt by a
// stream of its own. The line climbs past it: 30 m and more of open air between them.
// THE FACE STANDS IN BEDS AND PILLARS, by the last tooth's own law brought down the face: from 100 m up (eased in to
// 120 m) to the tooth, whose law takes over between 282 and 300 m, on every bearing alike. A bed is 8 m deep (three
// rows of the skin): it stands steep and ends in a lip, cut back 1.2 m at its foot. Round the mountain the rock
// stands in pillars 12 m broad at the middle height of their three beds (10 to 14 m at every height: their number
// is the envelope's girth there over 12 m), each pillar's face set back by its own measure (to 1.1 m: at these
// radii a flat face's own chord is a hand deep and would not be seen), with an upright crack 1.4 m deep between
// two; the cracks shift every three beds. All of it is cut INWARD from the skin as it was: no rock comes nearer the
// line by it. Under 100 m the skin is as it was. ONE FIGURE KEEPS IT TO ONE SIDE: all = 0 lays the beds and pillars
// only on the bearings b0 to b1 by the north (eased over 12 degrees at either end)
export const BEDS = { y0: 100, y1: 120, deep: 8, step: 1.7, broad: 12, back: 1.1, crack: 1.4, all: 1, b0: 280, b1: 100 };
export function makeForm(rs, noise, rsSpur = null) {
  const nRib = rs.chance(0.5) ? 3 : 4, ribs = [], base = rs.range(0, 360);
  // the great ribs: one stands out further than the others; each has a narrow crest on broad shoulders
  for (let i = 0; i < nRib; i++) ribs.push({ b: base + i * 360 / nRib + rs.range(-22, 22), w: rs.range(26, 38), k: i === 0 ? 1 : rs.range(0.62, 0.92), tw: rs.range(-0.07, 0.07) });
  const ledgeP = rs.range(19, 26), ledgeW = rs.range(8, 14), gully = rs.range(0.3, 0.36), o1 = rs.range(0, 50), o2 = rs.range(0, 50), lop = rs.range(0, 360);
  // (THRIFT, the same number: where d + 180 lies in 0..360 the two remainders are a taking away, and are worked so)
  const wrap = (d) => { const u = d + 180; if (u >= 0 && u < 360) { const v = u + 360; if (v < 720) return v - 360 - 180; } d = ((d + 180) % 360 + 360) % 360 - 180; return d; };
  // the north buttress: where it stands, how broad it is, how far it reaches, where its benches lie
  const q = rsSpur || (() => 0.5); if (!q.range) q.range = (a, b) => a + (b - a) * 0.5;
  const spur = { b: q.range(347, 353), w: q.range(9, 11), out: q.range(52, 58), y: [q.range(96, 104), q.range(136, 144), q.range(170, 177)], drop: [q.range(13, 15), q.range(15, 17), q.range(14, 16)] };
  // how much of it stands at a bearing (1 on its crest: a narrow nose on broad shoulders), and how far it reaches
  // at a height (whole to the first bench, less above each bench, nothing at the crown's base; at the ground no
  // further than 212 m from the axis)
  const spurK = (bear) => { const d = wrap(bear - spur.b) / spur.w; return Math.abs(d) > 3 ? 0 : 0.62 * Math.exp(-d * d) + 0.38 * Math.exp(-d * d * 7); };
  const spurOut = (y) => {
    let o = spur.out;
    for (let i = 0; i < 3; i++) o -= spur.drop[i] * sstep(spur.y[i], spur.y[i] + 3.5, y);
    return Math.max(0, Math.min(o * (1 - sstep(184, 204, y)), 212 - faceRadiusAt(y)));
  };
  // how much of a great rib stands at this bearing and height (0 in a gully, 1 on a rib's crest)
  // (asked again for the place it was last asked for, it answers from memory: the body asks three times for each of its points)
  let ribB = NaN, ribY = NaN, ribM = 0;
  const rib = (bear, y) => (bear === ribB && y === ribY ? ribM : ribK(bear, y, spurK(bear)));
  // (the same with the buttress's share at this bearing handed in: sk is spurK(bear))
  // (THRIFT, the same number: the greatest of the ribs' shares is asked for, so the nearest rib is worked first, and
  // another's share is worked only where it could be the greater: a share is under k / (1 + t + t²/2 + t³/6) for
  // t the square of its distance in breadths, e to the t being more than that sum)
  const ribT = new Float64Array(nRib);
  const ribK = (bear, y, sk) => {
    let m = sk, bi = 0, bt = Infinity;
    for (let i = 0; i < nRib; i++) { const r = ribs[i], d = wrap(bear - r.b - r.tw * y) / r.w, t = d * d; ribT[i] = t; if (t < bt) { bt = t; bi = i; } }
    m = Math.max(m, ribs[bi].k * (0.62 * Math.exp(-bt) + 0.38 * Math.exp(-bt * 9)));
    for (let i = 0; i < nRib; i++) {
      if (i === bi) continue;
      const t = ribT[i], k = ribs[i].k;
      if (k / (1 + t * (1 + t * (0.5 + t * 0.16666666666666666))) * 1.000001 <= m) continue;
      m = Math.max(m, k * (0.62 * Math.exp(-t) + 0.38 * Math.exp(-t * 9)));
    }
    ribB = bear; ribY = y; ribM = m;
    return m;
  };
  // gullies are deepest in the middle heights, shallow on the skirts and on the last tooth; one side of the
  // mountain is a little leaner than the other, so its plan is no circle
  const midOf = (y) => (0.45 + 0.55 * sstep(15, 95, y)) * (1 - 0.55 * sstep(290, 356, y));
  const lean = (bear) => 0.07 * (0.5 + 0.5 * Math.cos((bear - lop) * DEG));
  // the fall's cleft, in the part's own space: its bearing and how far a point lies to the side of its middle
  const fx = PLACE.FALLX - PLACE.AX, fz = PLACE.FALLZ - PLACE.AZ, fallBear = Math.atan2(fx, -fz) / DEG, wallR = hyp(fx, fz) - 3;
  const cleft = (bear, r) => 1 - sstep(9, 27, Math.abs(wrap(bear - fallBear)) * DEG * r);
  // how much of the face's beds and pillars stands on a bearing (see BEDS: 1 everywhere while BEDS.all is set)
  const bedSpan = ((BEDS.b1 - BEDS.b0) % 360 + 360) % 360 / 2;
  const bedsAt = (bear) => (BEDS.all ? 1 : 1 - sstep(0, 12, Math.abs(wrap(bear - BEDS.b0 - bedSpan)) - bedSpan));
  // the plain form: profile and ribs (what the shade bake and the far side use)
  const coarse = (bear, y) => { const b = faceRadiusAt(y) + spurK(bear) * spurOut(y); return b * (1 - gully * midOf(y) * (1 - rib(bear, y)) - lean(bear) * sstep(0, 60, y)); };
  // THRIFT (the same numbers): the plain form's four terms that hang on the height alone, worked once for a height
  // (coarseY), and the plain form from them at a bearing (coarseR: sk is spurK(bear), rb the rib there). A row of the skin stands at
  // one height, and so does each step of the sun's ray from it.
  const coarseY = (y, T) => { T[0] = faceRadiusAt(y); T[1] = spurOut(y); T[2] = midOf(y); T[3] = sstep(0, 60, y); return T; };
  const coarseR = (bear, T, sk, rb) => { const b = T[0] + sk * T[1]; return b * (1 - gully * T[2] * (1 - rb) - lean(bear) * T[3]); };
  // (what the plain form lies between whatever the rib: out[0] with the rib at nought, out[1] with the rib whole)
  const coarse01 = (bear, T, sk, out) => { const b = T[0] + sk * T[1], l = lean(bear) * T[3]; out[0] = b * (1 - gully * T[2] - l); out[1] = b * (1 - l); return out; };
  const radius = (bear, y) => {
    // (one skin for a bearing however it is written: 350 and -10 are the same place)
    if (bear >= 0 && bear < 360) { const v = bear + 360; bear = v < 720 ? v - 360 : v % 360; } else bear = ((bear % 360) + 360) % 360;   // (the same number, without the remainders)
    const a = bear * DEG, sx = Math.sin(a), sz = -Math.cos(a), mid = midOf(y);
    // ledges: the face stands steeper than its mean and steps in on benches (cut inward: the step is taken upward)
    const lw = ledgeW * noise.n2(sx * 1.7 + o1, sz * 1.7 + y * 0.004), s = (y + lw) / ledgeP, i = Math.floor(s), t = s - i;
    const amt = 0.72 * sstep(60, 110, y) * sstep(-0.35, 0.25, noise.n2(sx * 2.3 + i * 3.1, sz * 2.3 + o2)) * (1 - sstep(340, 356, y));
    const ye = lerp(y, (i + sstep(0, 0.22, t)) * ledgeP - lw, amt);
    const sk = spurK(bear), b = faceRadiusAt(Math.max(y, Math.min(ye, 357))) + (sk > 0 ? sk * spurOut(y) * (1 + 0.16 * noise.n2(sx * 9 + o2, y * 0.05 + o1)) : 0);
    let r = b * (1 - gully * mid * (1 - rib(bear, y)) - lean(bear) * sstep(0, 60, y));
    // flutes down the face (vertical joints) and crags, both inward; a flute is as deep as the tooth is broad there,
    // so the narrow last tooth is smooth
    const arc = a * 100;
    // (the flutes' noise is laid along the arc and does not close on itself at north: from 120 m up it is eased
    // between its two ends over 6 degrees either side of north, so the skin's function is one there; the easing
    // comes in between 100 and 120 m, and under 100 m the skin is as it was)
    let flute = noise.n2(arc / 13 + o1, y / 120 + o2);
    const north = Math.min(bear, 360 - bear), seamK = y > BEDS.y0 && north < 6 ? 0.5 * sstep(0, 6, 6 - north) * sstep(BEDS.y0, BEDS.y1, y) : 0;
    if (seamK > 0) flute = lerp(flute, noise.n2((bear < 180 ? arc + TAU * 100 : arc - TAU * 100) / 13 + o1, y / 120 + o2), seamK);
    r -= 3.2 * mid * Math.min(1, b / 70) * (1 - Math.abs(flute));
    const nx = sx * b, nz = sz * b;
    r -= (2.2 + 4.5 * mid) * Math.max(0, 0.15 + noise.fbm3(nx * 0.021 + o1, y * 0.016, nz * 0.021 + o2, 3)) * (1 - 0.7 * sstep(340, 358, y));
    r += 1.4 * noise.n3(nx * 0.11, y * 0.09, nz * 0.11) * (1 - sstep(346, 358, y));
    // THE LAST TOOTH (from the crown's tops to just under the level top) has form at three sizes, as the scarp has:
    // it stands in flat-faced pillars some eleven metres broad between upright cracks (the cracks shift every three
    // beds, so none runs the tooth's whole height), and it steps in on its beds, eight metres deep, each standing
    // steep and ending in a ledge (the snow lies on the ledges); the joints and the grain are the rock's shader's
    // THE FACE'S BEDS AND PILLARS (see BEDS), handed over to the tooth's law between 282 and 300 m
    const fk = y > BEDS.y0 && y < 300 ? sstep(BEDS.y0, BEDS.y1, y) * (1 - sstep(282, 300, y)) * bedsAt(bear) : 0;
    if (fk > 0) {
      const bed = (y + 2.5 * noise.n2(sx * 2 + o1, sz * 2 + o2)) / BEDS.deep, bi = Math.floor(bed), bf = bed - bi, set = Math.floor(bi / 3);
      r -= fk * BEDS.step * (0.7 - bf + sstep(0.7, 1, bf));
      const n = Math.max(8, Math.round(TAU * faceRadiusAt((set * 3 + 1.5) * BEDS.deep) / BEDS.broad));
      const cb = ((bear / 360 + noise.n2(set * 7.31 + o1, 3.7) * 0.5 + 0.5) % 1) * n, ci = Math.floor(cb), cf = cb - ci - 0.5;
      // (metres along the arc from the nearer crack; the pillar's own number)
      const m = (0.5 - Math.abs(cf)) * (TAU / n) * b, own = noise.n2(set * 13.7 + o1, ci * 5.3 + o2) * 0.5 + 0.5;
      r -= fk * (BEDS.back * own + BEDS.crack * Math.exp(-(m / 1.6) * (m / 1.6)));
    }
    const tk = sstep(282, 300, y) * (1 - sstep(346, 356, y));
    if (tk > 0) {
      const bed = (y + 2.5 * noise.n2(sx * 2 + o1, sz * 2 + o2)) / 8, bi = Math.floor(bed), bf = bed - bi;
      r += tk * 1.7 * (bf - sstep(0.7, 1, bf) - 0.4);
      const cell = 360 / 17, cb = ((bear + 360 * (noise.n2(Math.floor(bi / 3) * 7.31 + o1, 3.7) * 0.5 + 0.5)) % 360) / cell, cf = cb - Math.floor(cb) - 0.5, half = cell * 0.5 * DEG;
      r *= lerp(1, Math.cos(half) / Math.cos(cf * 2 * half), tk);
      r -= tk * 1.4 * Math.exp(-Math.pow((0.5 - Math.abs(cf)) * cell / 2, 2));
    }
    // the fall's cleft: one upright wall behind the water from below the vale's floor to the lip
    const c = cleft(bear, r) * (1 - sstep(PLACE.FALLTOP - 1, PLACE.FALLTOP + 3, y));
    if (c > 0) r = lerp(r, wallR + 1.2 * noise.n2(arc / 5, y / 6), c);
    return r;
  };
  // the height of the skin over a point of the land (0 outside the foot): where a tree of the skirts stands
  const heightAt = (lx, lz) => {
    const r = hyp(lx, lz), bear = Math.atan2(lx, -lz) / DEG;
    if (r > 215) return -1e3;
    let lo = -8, hi = 359;
    if (radius(bear, lo) < r) return -1e3;
    for (let k = 0; k < 16; k++) { const m = (lo + hi) * 0.5; if (radius(bear, m) > r) lo = m; else hi = m; }
    return lo;
  };
  return { radius, coarse, coarseY, coarseR, coarse01, rib, ribK, midOf, cleft, heightAt, fallBear, wallR, nRib, spur, spurK, spurOut };
}

// ---------------------------------------------------------------- the rock: one shader for the mountain and the shelf's stone shapes
const ROCK_VERT = /* glsl */`
attribute vec3 aDress;
varying vec3 vW, vN, vDress;
void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vDress=aDress; gl_Position=projectionMatrix*viewMatrix*wp; }`;
const ROCK_FRAG = /* glsl */`
uniform vec3 uRock, uRockWarm, uRockPale, uGrass, uSnow;
uniform vec4 uWater[2];
varying vec3 vW, vN, vDress;
${PEAK_GLSL}
vec3 bumpN(vec3 N, vec3 sx, vec3 sy, float hx, float hy, float k){
  vec3 r1=cross(sy,N), r2=cross(N,sx); float det=dot(sx,r1);
  vec3 g=sign(det)*(hx*r1+hy*r2);
  return normalize(abs(det)*N-k*g);
}
void main(){
  vec3 N=normalize(vN), p=vW;
  vec3 sx=dFdx(p), sy=dFdy(p); float px=max(length(sx),length(sy));
  // 1 on the mountain (jointed granite), 0 on the shelf's stone shapes (one stone each, wind-worn)
  // (far: a joint's recess is drawn where it is broad enough before the eye to be seen as a recess, some metres of
  // rock to a point of the raster at most; further off it gives way to its bed's mean tone, so that a joint is a
  // hollow with its shade near by and never a thin line far off)
  float joint=vDress.x, far=smoothstep(.08,.4,px);
  // THREE SIZES, all in the rock's own space (nothing is laid on by a flat projection, so nothing stretches):
  // beds and joints metres apart; weathering, a hand to a stride; grain and crystals, lost a few metres off
  float big=pfbm3(p*.045), med=pfbm3(p*.31+3.), fine=pn3(p*3.3)*(1.-smoothstep(.02,.2,px)), grain=pn3(p*13.)*(1.-smoothstep(.006,.05,px));
  // the mountain's granite stands in beds and blocks: THEY ARE RELIEF (a block stands out of the face, its edges
  // rounded back; the light and the shade show it), never a stroke: nothing dark is drawn along a joint
  vec3 tilt; vec3 jt=jointed(p,N,px,tilt);
  float hb=jt.x*.2*(1.-.7*far);
  tilt*=.26*(1.-.6*far)*joint;
  // the stone's beds: broad bands of a tone each, a little out of level (the mountain's are 6 m and more deep, the
  // shapes' a couple of metres: the same stone); on the shapes fine flutes run along them with the wind
  vec2 band=jset((p.y+.06*dot(p.xz,vec2(.6,-.8))+1.6*pn3(p*.03))/mix(2.3,6.5,joint),6.);
  float gv=.5+.5*sin(p.y*2.4-.5*dot(p.xz,uWind)+2.5*big), groove=gv*gv*smoothstep(.3,.6,pn3(p*.07+5.));
  float h=med*.6+fine*.25+grain*.15-(1.-joint)*.3*groove;
  float up=N.y;
  vec3 Nj=normalize(bumpN(N,sx,sy,dFdx(hb),dFdy(hb),joint)+tilt);
  float upB=Nj.y, deep=1.-smoothstep(.6,.86,vDress.z);
  // dress by height: grass on the low ledges; scree; first snow in the gullies from the crown's height, then on every
  // ledge and bed lip of the last 60 m; the pale level top
  float low=1.-smoothstep(52.,86.,p.y+20.*(big-.5));
  // (above the skirts TURF LIES ON LEVEL TREADS ONLY, on every bench up to the crown's lowest cloud at 185 m, and
  // ends at the lip in a ragged edge a stride deep: no grass is washed down a riser. The skirts keep their own law)
  float tread=smoothstep(.77,.83,up+.2*(pn3(p*1.3+7.)-.5)+.1*(med-.5))*(1.-smoothstep(181.,187.,p.y+4.*(big-.5)));
  // (and the skirts' turf ends upward as it ends at a lip: in a ragged edge, never in a wash thinning over the rock)
  float skirt=smoothstep(.42,.58,low+.3*(pn3(p*.3+11.)*.6+pn3(p*1.3+7.)*.4-.5));
  float grass=mix(tread,smoothstep(.34,.62,up+.3*(med-.5)),skirt)*step(.5,joint);
  float scree=smoothstep(.5,.68,pn3(vec3(p.x*.045,p.y*.03,p.z*.045)+21.)*.65+.35*med)*smoothstep(8.,40.,p.y);
  grass*=1.-.85*scree;
  float snowLedge=smoothstep(298.,322.,p.y+22.*(big-.5))*max(smoothstep(.42,.72,up+.2*(med-.5)),.9*smoothstep(.34,.66,upB+.25*(med-.5)));
  float snowGully=smoothstep(236.,300.,p.y+26.*(big-.5))*deep*smoothstep(.3,.6,med*.6+up*.6+.25);
  float snow=max(snowLedge,snowGully)*(1.-smoothstep(356.5,358.5,p.y))*step(.5,joint);
  float pale=smoothstep(356.5,358.8,p.y)*step(.5,joint);
  float wet=smoothstep(194.,212.,p.y)*(1.-smoothstep(262.,278.,p.y))*step(.5,joint);
  // the granite: pale grey going warm, each bed a little its own tone
  vec3 alb=mix(uRock,uRockWarm,smoothstep(.35,.7,med))*(.8+.4*big)*(.94+.12*grain);
  alb*=mix(.93+.14*band.y,.92+.16*band.y,joint)*mix(1.,.96+.08*jt.z,joint*(1.-far));
  alb=mix(alb,alb*vec3(1.1,1.,.86),(1.-joint)*smoothstep(.5,.8,band.y));
  // rain marks under the ledges (short, by the face's own height)
  float streak=smoothstep(.55,.8,pn3(vec3(p.x*.2,p.y*.05,p.z*.2)+31.))*smoothstep(.4,.62,pn3(p*.02+17.));
  alb*=1.-.2*streak*joint;
  // lichen in gold and grey-green patches below the crown; moss in the joints of the lower face
  // (crisp patches a stride across near the eye; further off only their mean tint, so nothing speckles)
  float lk=pn3(p*.24+9.)*.65+pn3(p*.8+2.)*.35, lreg=smoothstep(.4,.62,pn3(p*.05+23.))*(1.-smoothstep(170.,240.,p.y));
  float lich=mix(smoothstep(.55,.61,lk),.22,smoothstep(.1,.5,px))*lreg;
  vec3 lcol=mix(vec3(.78,.6,.2),vec3(.5,.56,.42),smoothstep(.45,.55,pn3(p*.035+41.)));
  alb=mix(alb,lcol*(.75+.5*med),lich*.6);
  // moss where the lower face's blocks go back into their joints (in the relief's own hollows, as a soft stain)
  alb=mix(alb,vec3(.2,.36,.1),joint*(1.-smoothstep(.1,.5,jt.x))*smoothstep(.1,.6,upB+.3)*(1.-smoothstep(110.,170.,p.y))*smoothstep(.4,.62,pn3(p*.06+3.))*.5*(1.-far));
  float gph=dot(p.xz,uWind)*.3-uTime*1.9+uPhWave.x+3.5*pn2(p.xz*.022+uPhWave);
  float gwave=(.5+.5*sin(gph))*(.55+.45*sin(gph*.31+1.3+dot(p.xz,vec2(-uWind.y,uWind.x))*.05));
  alb=mix(alb,uGrass*(.5+.5*med+.5*big)*(1.+.3*(gwave-.3))*mix(vec3(1.),vec3(1.14,1.04,.66),smoothstep(.4,.7,pn3(p*.035+4.))),grass);
  alb*=mix(1.,.78,wet);
  // THE FACE'S WATERS (the part's thread; each given by its bearing and the heights it runs between): where one
  // comes down, the rock under it is dark and wet and the turf of a tread it crosses is dark wet turf, a ragged
  // way two to five metres broad. The white water itself hangs in the air, off the rock
  vec2 ax=p.xz-uAxis.xz; float seep=0.;
  for(int i=0;i<2;i++){ vec2 d=uWater[i].xy; seep=max(seep,(1.-smoothstep(.9,2.4+px,abs(ax.x*d.y-ax.y*d.x)+1.2*(pn3(p*.45+3.)-.5)))*step(0.,dot(ax,d))*smoothstep(uWater[i].z-1.5,uWater[i].z+.5,p.y)*(1.-smoothstep(uWater[i].w-1.,uWater[i].w+.5,p.y))); }
  alb*=mix(vec3(1.),vec3(.5,.56,.6),seep*joint);
  float rime=wet*smoothstep(.4,.75,pn3(p*.33+5.))*smoothstep(.1,.5,upB+.3*med)*.5;
  alb=mix(alb,uSnow*.9,rime);
  alb=mix(alb,uRockPale*(.9+.2*med),pale);
  alb=mix(alb,uSnow,snow);
  float bumpK=mix(mix(.55,.2,grass),.08,max(snow,pale))*mix(.5,1.,joint);
  vec3 Nb=bumpN(N,sx,sy,dFdx(h),dFdy(h),bumpK);
  float blockK=joint*(1.-grass)*(1.-.6*max(snow,pale));
  Nb=normalize(bumpN(Nb,sx,sy,dFdx(hb),dFdy(hb),blockK)+tilt*blockK);
  float sun=vDress.y*shapeShade(p)*cloudShade(p);
  float ao=vDress.z*(1.-.22*joint*(1.-smoothstep(.05,.45,jt.x))*(1.-far));
  vec3 col=peakLit(alb,Nb,p,sun,ao);
  // threads of water down the gullies of the face between the skirts and the crown: one meridian in four carries
  // one, a hand broad, shimmering on the world's clock. So thin a water is seen only from near: from further off
  // than a hand's breadth fills a third of a pixel's footprint it is lost in the face (the eye's own distance)
  float rr=max(length(ax),1.), tw=atan(ax.x,-ax.y+1e-5)*38., ti=floor(tw);
  float wm=abs(fract(tw)-.5-.2*sin(p.y*.21+ti*2.3))*rr/38.;
  float thread=step(.66,ph1(vec3(ti,3.,1.)))*(1.-smoothstep(.08,.22+px,wm))*smoothstep(58.,92.,p.y)*(1.-smoothstep(200.,222.,p.y))*joint*(1.-grass)*(1.-smoothstep(.6,.86,vDress.z))*(1.-smoothstep(.07,.2,px));
  col=mix(col,col*.6+(uSkyLow*1.2+uSunCol*.3*sun)*(.7+.3*sin(p.y*1.3+uTime*6.+ti*5.+uPhShim.x)),thread*.6);
  vec3 V=normalize(cameraPosition-p);
  // the wind-polished shapes: a soft sheen toward the sun, and the low sun caught along the edge of one seen against it
  col+=uSunCol*.2*(1.-joint)*sun*pow(max(dot(Nb,normalize(uSunDir+V)),0.),18.);
  col+=uSunCol*alb*.5*(1.-joint)*pow(clamp(1.-dot(Nb,V),0.,1.),3.)*smoothstep(-.2,.6,dot(-V,uSunDir))*step(0.,dot(N,uSunDir)+.35);
  // the level top takes the moon's silver as a soft sheen; snow takes a little of the low sun through it
  col+=uMoonCol*4.*pale*pow(max(dot(Nb,normalize(uMoonDir+V)),0.),14.);
  col+=uSunCol*.1*snow*max(dot(uSunDir,-V)*.5+.5,0.);
  gl_FragColor=vec4(peakAir(col,p),1.);
}`;
export function makeRockMaterial(light) {
  const c = (hex) => new THREE.Color(hex);
  return new THREE.ShaderMaterial({
    name: 'PeakRock', vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG,
    uniforms: { ...light.uniforms, uRock: { value: c('#b3b5b8') }, uRockWarm: { value: c('#c6bcab') }, uRockPale: { value: c('#c9ccd4') }, uGrass: { value: c('#6fae45') }, uSnow: { value: c('#eef1f6').multiplyScalar(0.92) },
      // (the face's waters: bearing as a unit vector, the lowest and the highest metre of each; none until the thread is built)
      uWater: { value: [new THREE.Vector4(0, -1, 1e5, 1e5), new THREE.Vector4(0, -1, 1e5, 1e5)] } },
  });
}

// ---------------------------------------------------------------- the body's skin
// A grid over bearing and height, closed at the top by the level place with its two low shoulders. Each vertex
// carries its dress: (1 = the mountain, what of the sun reaches it past the great ribs, how deep it lies in a gully).
async function buildBody(ctx, form, hour) {
  const NB = 304, ys = [];
  for (let y = -8; y < 70; y += 2.6) ys.push(y);
  for (let y = 70; y < 200; y += 2.6) ys.push(y);
  // (rows 2.6 m apart to 262 m: a bed of 8 m is three rows, and a row of 3.4 m cannot carry its lip)
  for (let y = 200; y < 262; y += 2.6) ys.push(y);
  for (let y = 262; y < 357; y += 2) ys.push(y);
  ys.push(357.4);
  // the level top: rings from the rim inward; its height is 360 with a rounded rim and two shoulders east and west
  const capR = [6.7, 6.0, 5.0, 3.8, 2.4, 1.0, 0.02];
  const capY = (x, z) => {
    const rho = hyp(x, z);
    const hump = (cx) => 3.5 * Math.exp(-(((x - cx) / 1.9) ** 2) - ((z / 3.3) ** 2));
    return PLACE.TOP - 2.2 * sstep(5.4, 7.3, rho) + hump(6.3) + hump(-6.3);
  };
  const NR = ys.length + capR.length, nv = NB * NR;
  const pos = new Float32Array(nv * 3), dress = new Float32Array(nv * 3);
  const S = hour.sunDir, steps = [5, 11, 20, 32, 48, 70, 100, 140, 190];
  // (THRIFT, the same numbers: a row of the skin stands at one height, so the height's share of the plain form is
  // worked once for the row and once for each step of the sun's ray from it, and a bearing's rib is worked once)
  // (and a step whose squared distance from the axis is clearly beyond the form's reach at its height is passed without measuring it)
  // (and where the plain form with the rib whole still lies short of the step, or with no rib at all stands seven metres and more over it, the rib is not asked for)
  const T0 = [0, 0, 0, 0], TS = steps.map(() => [0, 0, 0, 0]), LIM = new Float64Array(steps.length), C01 = [0, 0];
  const row = (y) => { form.coarseY(y, T0); for (let s = 0; s < steps.length; s++) { form.coarseY(y + S.y * steps[s], TS[s]); const l = (TS[s][0] + form.spur.out - 2) * 1.000000001; LIM[s] = l * l; } };
  for (let j = 0; j < NR; j++) {
    const level = j < ys.length;
    if (level) row(ys[j]);
    for (let i = 0; i < NB; i++) {
      const bear = i / NB * 360, a = bear * DEG, k = (j * NB + i) * 3;
      let x, y, z;
      if (level) { y = ys[j]; const r = form.radius(bear, y); x = Math.sin(a) * r; z = -Math.cos(a) * r; }
      else { const r = capR[j - ys.length]; x = Math.sin(a) * r; z = -Math.cos(a) * r; y = capY(x, z); row(y); }
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      // what of the sun reaches this point past the great ribs (the plain form stands in for the body)
      let occ = 0;
      for (let s = 0; s < steps.length && occ < 1; s++) {
        const t = steps[s], qx = x + S.x * t, qy = y + S.y * t, qz = z + S.z * t;
        if (qy > 356) break;
        // (the plain form stands nowhere beyond the profile's own radius, and beyond that by the buttress's reach
        // only on the buttress's own bearings: a point further out is in the open, and the form is not asked)
        if (qx * qx + qz * qz > LIM[s]) continue;
        const rq = hyp(qx, qz), fr = TS[s][0];
        if (rq + 2 >= fr + form.spur.out) continue;
        const qb = Math.atan2(qx, -qz) / DEG, sk = form.spurK(qb);
        if (rq + 2 >= fr && sk === 0) continue;
        form.coarse01(qb, TS[s], sk, C01);
        if (C01[1] - 2 - rq < -1e-6) continue;
        if (C01[0] - 2 - rq > 7.000001) { occ = 1; continue; }
        const d = form.coarseR(qb, TS[s], sk, form.ribK(qb, qy, sk)) - 2 - rq;
        if (d > 0) occ = Math.max(occ, sstep(0, 7, d));
      }
      const sk0 = form.spurK(bear), rb = form.ribK(bear, y, sk0);
      const deep = clamp((form.coarseR(bear, T0, sk0, rb) - hyp(x, z)) / 9, 0, 1);
      dress[k] = 1; dress[k + 1] = 1 - occ;
      dress[k + 2] = clamp(1 - 0.36 * T0[2] * (1 - rb) - 0.16 * deep, 0.4, 1);
    }
    if (j % 4 === 3) await ctx.yield();
  }
  const idx = new Uint32Array(NB * (NR - 1) * 6);
  let w = 0;
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NB; i++) {
    const i1 = (i + 1) % NB, a = j * NB + i, b = j * NB + i1, c = (j + 1) * NB + i, d = (j + 1) * NB + i1;
    idx[w++] = a; idx[w++] = b; idx[w++] = c; idx[w++] = b; idx[w++] = d; idx[w++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aDress', new THREE.BufferAttribute(dress, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  // the skin's normals, summed face by face in three sittings (the kit's own one call holds the page too long)
  const nrm = new Float32Array(pos.length), probe = 40 * NB * 3;
  for (let k = 0, part = Math.ceil(idx.length / 9) * 3; k < idx.length; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (k % part === part - 3) await ctx.yield();
  }
  for (let k = 0; k < nrm.length; k += 3) { const l = hyp3(nrm[k], nrm[k + 1], nrm[k + 2]) || 1; nrm[k] /= l; nrm[k + 1] /= l; nrm[k + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  // outward: the first row's first normal must point away from the axis
  if (nrm[probe] * pos[probe] + nrm[probe + 2] * pos[probe + 2] < 0) {
    for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    for (let k = 0; k < nrm.length; k++) nrm[k] = -nrm[k];
  }
  await ctx.yield();
  // ledge sites: level places of the face between the skirts and the crown (for the world's high flowers)
  const sites = [];
  for (let j = 2; j < ys.length; j++) {
    if (ys[j] < 62 || ys[j] > 192) continue;
    for (let i = 0; i < NB; i++) { const k = (j * NB + i) * 3; if (nrm[k + 1] > 0.74) sites.push([pos[k], pos[k + 1], pos[k + 2]]); }
  }
  g.computeBoundingSphere();
  return { geometry: g, sites, triangles: idx.length / 3, capY };
}

// ---------------------------------------------------------------- the crown of cloud
// THE CLOUD HAS ONE TRUTH FOR EVERY EYE. The crown is a ring of heaped cloud round the peak's head between 185 and
// about 290 m (the cleft's walls overhang to about 340 beside the rock): an inner round leaning on the rock, a
// collar against the tooth, an outer round reaching 200 to 270 m from the axis, and a tongue streaming off the lee
// (east-south-east) to about 470 m. It stands where it stands: it churns in place (the kit's slow
// boil) and nothing of it is switched, spread, thinned or parted by where an eye is (the kit's fade at the lens
// begins inside two and a half metres of a puff's middle).
// THE CLEFT is the way through it: a standing lane, there for every eye. The world hands in the lane's own line
// (points of the route between the heights where cloud can stand, at even metres); a heap whose body would come
// within 20 m of that line is drawn smaller until it clears, or left out; and the kit keeps every puff out of a
// tube of 20 m about the line (its avoid list), as it keeps them out of the rock.
// THE CLEFT'S OWN PLACES (all by place, the same for every eye):
//  THE RIGHT WALL IS THE ROCK: from the mouth to the top no heap's body (its drum) stands between the lane and the
//  face from 15 m under the line's height up: one that would is drawn smaller by the lane's own rule until it does
//  not, or left out; the lane's four inner heaps are not laid; and no puff's middle stands there.
//  THE LEFT WALL IS THREE STANDS WITH TWO WINDOWS: the wall's seven heaps stand on the bearings of the stands; on
//  a window's bearings, beyond the line, from 15 m under the line's height there to the sky, no heap of any round
//  has its middle (one dealt there is left out: the deal stands as it fell) and no puff's skin reaches in.
//  UNDER THE MOUTH THE AIR IS OPEN: no heap's body stands under the line's height within 60 m of the lane's first
//  40 m on the left hand (one of a round that would is left out; one of the wall is set off by as much more).
//  A PUFF IS WHOLE OR IT IS NOT THERE: none is shrunk to fit the lane; one whose skin (0.78 of its size at its
//  breath's large end) would reach within 20 m of the lane's line is not there.
//  A CLOUD IS LIT BY THE SUN THAT REACHES IT (see lightCrown): `all` 0 keeps that to the cloud within `near` m of the lane (dying away over 80 m more).
export const CROWN = { stands: [[8, 22], [36, 48], [62, 75]], windows: [[22, 36], [48, 62]], sill: 15, mouth: 40, bay: 60, shade0: 12, shade1: 60, shadeK: 1, floor: 0.1, feet: 0.62, all: 0, near: 50 };
async function makeCrown(ctx, rc, hour, origin, full, detail, lane) {
  const at = [], ox = origin[0], oz = origin[1], H = 0.6, C = CROWN;
  // the lane from the mouth to the top: each point with its radius from the axis, its bearing and its metres from the mouth
  const cl = [], bearOf = (x, z) => ((Math.atan2(x - ox, -(z - oz)) / DEG) + 360) % 360;
  if (lane) for (const q of lane) if (q[1] >= CLEFT.y0 && q[1] <= CLEFT.y1) cl.push({ x: q[0], y: q[1], z: q[2], r: hyp(q[0] - ox, q[2] - oz), b: bearOf(q[0], q[2]), s: cl.length * 3 });
  const lineAt = (b) => { let best = null, e = 2; for (const q of cl) { const d = Math.abs(q.b - b); if (d < e) { e = d; best = q; } } return best; };
  // a drum between the lane and the face (it lies across a spoke from the axis to a point of the lane, short of that point)
  const faceSide = (x, top, z, w) => {
    for (const q of cl) {
      if (top <= q.y - C.sill) continue;
      const dx = q.x - ox, dz = q.z - oz, t = ((x - ox) * dx + (z - oz) * dz) / (dx * dx + dz * dz);
      if (t < 1 && hyp(x - ox - dx * Math.max(t, 0), z - oz - dz * Math.max(t, 0)) <= 0.55 * w) return true;
    }
    return false;
  };
  // a point between the lane and the face
  const between = (x, top, z) => { const q = lineAt(bearOf(x, z)); return !!q && hyp(x - ox, z - oz) < q.r && top > q.y - C.sill; };
  // a point with a reach (a heap's middle: 0; a puff: its skin) in a window
  const inWindow = (x, top, z, reach) => {
    const b = bearOf(x, z), r = hyp(x - ox, z - oz);
    for (const w of C.windows) { const q = lineAt(clamp(b, w[0], w[1])); if (q && Math.max(0, w[0] - b, b - w[1]) * DEG * r <= reach && r + reach > q.r && top > q.y - C.sill) return true; }
    return false;
  };
  // a drum under the line's height in the bay on the left of the lane's first metres
  const underMouth = (x, y, z, w) => { for (const q of cl) { if (q.s > C.mouth + 3) break; if (y < q.y && hyp(x - ox, z - oz) > q.r && hyp(x - q.x, z - q.z) - 0.55 * w < C.bay) return true; } return false; };
  // how near a heap's body (a drum of 0.55 of its breadth, from its base to its top) comes to the lane's line
  const laneGap = (x, y, z, w) => {
    let g = 1e9;
    if (lane) for (const q of lane) if (q[1] > y - 14 && q[1] < y + w * H * 1.25 + 16) g = Math.min(g, hyp(x - q[0], z - q[2]) - 0.55 * w);
    return g;
  };
  const put = (bear, r, y, w, round) => {
    const x = ox + Math.sin(bear * DEG) * r, z = oz - Math.cos(bear * DEG) * r;
    if (inWindow(x, y + w * H * 1.25, z, 0) || underMouth(x, y, z, w)) return;
    let ww = w;
    for (let k = 0; k < 8 && (laneGap(x, y, z, ww) < 20 || faceSide(x, y + ww * H * 1.25, z, ww)); k++) ww *= 0.86;
    if (ww >= 30 && laneGap(x, y, z, ww) >= 20 && !faceSide(x, y + ww * H * 1.25, z, ww)) at.push([x, y, z, ww, round]);
  };
  const nIn = 14, nOut = full > 0.5 ? 15 : 13, nCol = 9, b0 = rc.range(0, 360);
  // heaps of uneven size on uneven bases, in two loose rounds about the rock (bearings, distances and bases all drawn);
  // the inner round stands shoulder to shoulder against the rock, so that from below the head is hidden all round
  // (by arithmetic: a sight line from the fields, the shelf or the garden to any point of the tooth above
  // 290 m passes 100 m from the axis between 216 and 256 m and 80 m from it between 245 and 301 m: the inner
  // round stands there from 192..206 m up to 250 m and more, the collar from 228..240 up to 255 m and more)
  for (let i = 0; i < nIn; i++) put(b0 + i * 360 / nIn + rc.range(-6, 6), rc.range(90, 108), PLACE.CROWN0 + rc.range(-8, 6), rc.range(112, 134), 'inner');
  // the collar: small heaps against the tooth itself, between the inner round's tops
  for (let i = 0; i < nCol; i++) { const w = rc.range(56, 68), y = rc.range(228, 240); put(b0 + 11 + i * 360 / nCol + rc.range(-8, 8), faceRadiusAt(y + 20) + 0.42 * w, y, w, 'collar'); }
  for (let i = 0; i < nOut; i++) put(b0 + 17 + i * 360 / nOut + rc.range(-11, 11), rc.range(166, 212) + 14 * full, PLACE.CROWN0 + rc.range(-6, 20), rc.range(92, 136) * (1 + 0.14 * full), 'outer');
  // the lee tongue: heaps strung out downwind to 420 m, smaller as they go
  const nT = full > 0.5 ? 4 : 3;
  for (let i = 0; i < nT; i++) put(WIND_BEAR + rc.range(-7, 7), 268 + i * (152 / (nT - 1)) + rc.range(-10, 10), PLACE.CROWN0 + 15 + i * 4, lerp(116, 72, i / nT) * rc.range(0.9, 1.1), 'tongue');
  // the cleft's left wall, by the lane's line: seven heaps on its outer side, on the bearings of the three stands
  // (each heap's place along the stands is dealt as its place along the lane was), each set off from the line by
  // 0.55 of its breadth and 20 to 36 m, and by as much more as leaves the bay under the mouth open. (The four small
  // heaps once laid against the rock on the lane's inner side are not laid: the right wall is the rock; their
  // numbers are still drawn, so the wall's deal stands)
  if (lane) {
    const n = lane.length;
    const span = C.stands.reduce((a, s) => a + s[1] - s[0], 0);
    for (let k = 0; k < 7; k++) {
      let f = (k + rc.range(0.15, 0.85)) / 7 * span, sb = C.stands[0][0], i = 0, e = 1e9;
      for (const s of C.stands) { if (f <= s[1] - s[0]) { sb = s[0] + f; break; } f -= s[1] - s[0]; sb = s[1]; }
      for (let j = 0; j < n; j++) { const d = Math.abs(bearOf(lane[j][0], lane[j][2]) - sb); if (lane[j][1] >= CLEFT.y0 && d < e) { e = d; i = j; } }
      // (nx, nz) points out from the axis through the lane's point: to the left of the heading, away from the rock,
      // so that the heap's middle stands on its stand's own bearing
      const q = lane[i], l = hyp(q[0] - ox, q[2] - oz) || 1, nx = (q[0] - ox) / l, nz = (q[2] - oz) / l;
      const wo = rc.range(64, 98), wi = rc.range(40, 58);
      const oo = 0.55 * wo + rc.range(22, 36), oi = 0.55 * wi + rc.range(20, 27);
      const yo = Math.max(PLACE.CROWN0 - 8, q[1] - wo * H * rc.range(0.35, 0.7));
      let more = 0; while (more < 80 && (underMouth(q[0] + nx * (oo + more), yo, q[2] + nz * (oo + more), wo) || laneGap(q[0] + nx * (oo + more), yo, q[2] + nz * (oo + more), wo) < 20)) more += 4;
      at.push([q[0] + nx * (oo + more), yo, q[2] + nz * (oo + more), wo, 'wall']);
      // (the inner heap's numbers wi, oi and this one were its deal: drawn still, laid no more)
      if (k % 2 === 0) rc.range(0.6, 1.1);
    }
  }
  const light = { sunDirection: hour.sunDir, sunColor: hour.sun, litColor: '#fbf3e2', shadeColor: '#9292c4', bottomColor: new THREE.Color(hour.rose).lerp(new THREE.Color('#b98fb4'), 0.35) };
  const avoid = [[ox, 352, oz, 9, 150, 104]];
  if (lane) { const n = Math.min(15, lane.length); for (let k = 0; k < n; k++) { const q = lane[Math.round(k * (lane.length - 1) / Math.max(1, n - 1))]; avoid.push([q[0], q[1], q[2], 20]); } }
  await ctx.yield();
  const crown = makeCloudField({
    rng: rc, mode: 'cumulus', at, height: H, puffs: Math.round(44 * (0.7 + 0.3 * detail)), wind: [0, 0, 0], avoid, opacity: 0.92, ...light,
    nearFade: [0.02, 0.05], farFade: [9000, 12000], fogFade: 0.35, silver: 0.9, erode: 1.0, softness: 0.32, bump: 1.25, renderOrder: 8,
  });
  // THE CROWN'S PUFFS AS THEY STAND (centre, breadth, flat base, strength; shrunk beside the rock and the lane by the
  // kit's own law, worked here once as the kit works it): what stands behind the cloud is veiled by these
  // (and each puff's own state by the rules of the cleft: its size, or next to nothing where it is not there; kept
  // by its place, since the kit writes its drawn puffs anew from a copy of its own at every sort: see retouch)
  const ip = crown.puffs.geometry.attributes.iPos.data.array, np = crown.count, veil = new Float32Array(np * 6), av = avoid.slice(0, 1), state = new Float32Array(np * 2), out = { lane: 0, window: 0, face: 0 };
  // (the lane's points that any puff's skin and 20 m could reach: those not lower than the lowest of them)
  await ctx.yield();
  let low = 1e9; for (let i = 0; i < np; i++) low = Math.min(low, ip[i * 12 + 1] - 20 - 0.78 * 1.045 * ip[i * 12 + 3]);
  const ln = []; if (lane) for (const q of lane) if (q[1] >= low) ln.push(q[0], q[1], q[2]);
  for (let i = 0; i < np; i++) {
    if ((i & 255) === 255) await ctx.yield();
    const k = i * 12, x = ip[k], y = ip[k + 1], z = ip[k + 2];
    let size = ip[k + 3], room = 1e9;
    const skin = 0.78 * 1.045 * size;
    let lg = 1e18; for (let j = 0; j < ln.length; j += 3) { const dx = x - ln[j], dy = y - ln[j + 1], dz = z - ln[j + 2], e = dx * dx + dy * dy + dz * dz; if (e < lg) lg = e; }
    lg = Math.sqrt(lg);
    const why = lg - 20 < skin ? 'lane' : inWindow(x, y + skin, z, skin) ? 'window' : between(x, y + skin, z) ? 'face' : '';
    state[i * 2] = size; state[i * 2 + 1] = ip[k + 5];
    if (why) { out[why]++; state[i * 2] = 0.001; ip[k + 3] = 0.001; ip[k + 6] = 0; veil.set([x, y, z, 0.001, ip[k + 7], 0], i * 6); continue; }
    for (const a of av) {
      let rm;
      if (a.length < 5) rm = hyp3(x - a[0], y - a[1], z - a[2]) - a[3];
      else { const t = clamp((a[1] - y) / Math.max(a[1] - a[4], 1e-3), 0, 1), dxz = hyp(x - a[0], z - a[2]) - lerp(a[3], a[5], t), dy = Math.max(y - a[1], a[4] - y); rm = dy > 0 ? hyp(Math.max(dxz, 0), dy) : dxz; }
      room = Math.min(room, rm);
    }
    const fit = clamp(room / (size * 0.78), 0, 1);
    veil.set([x, y, z, size * Math.max(fit, 0.3), ip[k + 7], sstep(0.3, 0.95, fit)], i * 6);
  }
  return { crown, heaps: at, veil, state, out, cl };
}

// A CLOUD IS LIT BY THE SUN THAT REACHES IT. For every puff of the crown alike, worked once here (the hour stands):
// how many metres of cloud and rock lie on the sun's ray from the puff, beyond its own skin. Cloud is the union of
// the standing puffs' bodies along the ray (a body: 0.62 of a puff's size); rock is the mountain's plain form. In
// the open (under 12 m) a puff keeps the kit's lit tone; behind 60 m and more it stands in shade, in between by so
// much. Nothing here reads the eye.
// CROWN.all: 1 lights the whole crown so. It stands at 0: the shade is kept to the cloud within CROWN.near metres
// of the lane's line between the mouth and the top, dying away over 80 m more, and the rest of the crown is lit as the kit lights it: seen from
// the fields the whole crown in this shade would stand as a violet cloud over the mountain, and the place is a
// head hidden in WHITE cloud.
async function lightCrown(ctx, clouds, hour, form, origin, lane) {
  const C = CROWN, ip = clouds.crown.puffs.geometry.attributes.iPos.data.array, np = clouds.crown.count, st = clouds.state, S = hour.sunDir;
  // THE PART'S OWN PATCH OF THE KIT'S CLOUD MATERIAL (this field's only). The kit's shade for a puff holds two
  // things here: its fraction is the kit's own base occlusion, as dealt; its whole part, in fifteenths, is this
  // puff's shade by the sun's ray. A puff with none of that shade is drawn to the byte as the kit draws it. One
  // with it loses so much of its tone (CROWN.shadeK at the full), the floor under its tone goes down to
  // CROWN.floor, and it is drawn in the shade colour (lilac) on every side, its underside too, its feet and folds
  // darker still (to CROWN.feet of it). If the kit's text is not as it was when this was written, no patch is made
  // and the shade is written as plain occlusion instead.
  const m = clouds.crown.material, f3 = (v) => v.toFixed(3);
  const swaps = [[0, 'float big = max(cloudTone(iNrm.xyz, back, uSunDir) - iData.y, uLight.x);', `float pkS = floor(iData.y)/15., pkO = fract(iData.y); float big = max(cloudTone(iNrm.xyz, back, uSunDir) - pkO - pkS*${f3(C.shadeK)}, mix(uLight.x, ${f3(C.floor)}, pkS));`],
    [0, 'float crest = clamp(1. - iData.y*5., 0., 1.);', 'float crest = clamp(1. - (pkO + pkS)*5., 0., 1.);'],
    [0, 'vData = vec4(seed, big, iData.z*fade, iData.w);', 'vData = vec4(seed, big + 4.*floor(iData.y), iData.z*fade, iData.w);'],
    [1, 'float light = max(vData.y + dot(N, uSunDir)', 'float pkS = floor(vData.y*.25)/15., pkT = vData.y - 4.*floor(vData.y*.25); float light = max(pkT + dot(N, uSunDir)'],
    [1, 'vec3 col = mix(mix(uBottom, uShade, smoothstep(-.5, .7, vNrm.y + N.y*.5)), uLit, light);', `vec3 col = mix(mix(uBottom, uShade, smoothstep(-.5, .7, vNrm.y + N.y*.5)), uLit, light); col = mix(col, uShade*mix(${f3(C.feet)}, 1., smoothstep(-.4, .5, vNrm.y + N.y*.5 - (lump - .5))), pkS*(1. - light));`]];
  const src = [m.vertexShader, m.fragmentShader], packed = swaps.every(([k, a]) => src[k].split(a).length === 2);
  if (packed) { for (const [k, a, b] of swaps) src[k] = src[k].replace(a, b); m.vertexShader = src[0]; m.fragmentShader = src[1]; }
  clouds.packed = packed;
  const ox = origin[0], oz = origin[1], P = new Float32Array(np * 4), seg = [], steps = [5, 11, 20, 32, 48, 70, 100, 140, 190];
  for (let i = 0; i < np; i++) { const k = i * 12; P[i * 4] = ip[k]; P[i * 4 + 1] = ip[k + 1]; P[i * 4 + 2] = ip[k + 2]; P[i * 4 + 3] = st[i * 2] > 0.01 ? 0.62 * clouds.veil[i * 6 + 3] : 0; }
  // (the standing puffs in the order of their place across the sun's ray: only those within a body's breadth of a
  // puff's own ray, read across it, can lie on that ray)
  const e1 = new THREE.Vector3(S.z, 0, -S.x).normalize(), U = new Float32Array(np), ord = []; let rmax = 0;
  for (let i = 0; i < np; i++) { U[i] = P[i * 4] * e1.x + P[i * 4 + 2] * e1.z; if (P[i * 4 + 3] > 0) { ord.push(i); rmax = Math.max(rmax, P[i * 4 + 3]); } }
  ord.sort((a, b) => U[a] - U[b]);
  let worked = 0;
  for (let i = 0; i < np; i++) {
    if (P[i * 4 + 3] <= 0) continue;
    const x = P[i * 4], y = P[i * 4 + 1], z = P[i * 4 + 2], t0 = 0.75 * st[i * 2];
    // (how much of its shade a puff keeps, by its distance from the lane's line: none of it, and its ray is not worked)
    let keep = 1;
    if (!C.all) { let lg = 1e18; for (const q of clouds.cl) { const dx = x - q.x, dy = y - q.y, dz = z - q.z, e = dx * dx + dy * dy + dz * dz; if (e < lg) lg = e; } keep = 1 - sstep(C.near, C.near + 80, Math.sqrt(lg)); }
    if (keep <= 0) { if (packed) { st[i * 2 + 1] = Math.min(st[i * 2 + 1], 0.99); ip[i * 12 + 5] = st[i * 2 + 1]; } continue; }
    if (++worked % 150 === 0) await ctx.yield();
    seg.length = 0;
    let lo = 0, hi = ord.length; const u0 = U[i] - rmax - 0.01, u1 = U[i] + rmax + 0.01;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (U[ord[mid]] < u0) lo = mid + 1; else hi = mid; }
    for (let o = lo; o < ord.length && U[ord[o]] <= u1; o++) {
      const j = ord[o], r = P[j * 4 + 3]; if (j === i) continue;
      const dx = P[j * 4] - x, dy = P[j * 4 + 1] - y, dz = P[j * 4 + 2] - z, tc = dx * S.x + dy * S.y + dz * S.z;
      if (tc + r <= t0) continue;
      const d2 = dx * dx + dy * dy + dz * dz - tc * tc; if (d2 >= r * r) continue;
      const h = Math.sqrt(r * r - d2), a = Math.max(t0, tc - h), b = tc + h; if (b > a) seg.push([a, b]);
    }
    let D = 0, end = -1e9;
    seg.sort((p, q) => p[0] - q[0]);
    for (const q of seg) if (q[1] > end) { D += q[1] - Math.max(q[0], end); end = q[1]; }
    for (const t of steps) { const qx = x - ox + S.x * t, qy = y + S.y * t, qz = z - oz + S.z * t; if (qy > 356) break; if (hyp(qx, qz) + 2 < form.coarse(Math.atan2(qx, -qz) / DEG, qy)) { D += 1e3; break; } }
    const occ = sstep(C.shade0, C.shade1, D) * keep;
    st[i * 2 + 1] = packed ? Math.round(occ * 15) + Math.min(st[i * 2 + 1], 0.99) : Math.max(st[i * 2 + 1], 0.85 * occ); ip[i * 12 + 5] = st[i * 2 + 1];
  }
  // THE KIT SORTS ITS PUFFS FOR EVERY FRAME out of a copy it keeps to itself and writes the drawn ones anew: so each
  // puff's state by these rules (not there; its shade) is kept here by the puff's own place and written to it again
  // after every sort
  const where = new Map(), key = (p) => ip[p] * 4099 + ip[p + 1] * 71 + ip[p + 2];
  for (let i = 0; i < np; i++) where.set(key(i * 12), i);
  clouds.retouch = () => {
    for (let p = 0, n = np * 12; p < n; p += 12) {
      const i = where.get(key(p)); if (i === undefined) continue;
      if (st[i * 2] < 0.01) { ip[p + 3] = st[i * 2]; ip[p + 6] = 0; }
      ip[p + 5] = st[i * 2 + 1];
    }
  };
}

// ---------------------------------------------------------------- the far sea of cloud
// A standing sheet of heaped cloud tops at the crown's level whose uneven shore lies 1500 to 1600 m from the axis
// (1600 on the bearings of the sun and the moon) and which runs to the horizon on every side; cloud towers stand on
// it far out. It is placed in the world, the same for every eye (the air between an eye and it veils it, as air does): from
// the fields it is a low bank along the horizon, from above the crown a sea of tops. Its tops roll slowly on the world's clock.
export const SEA = { shore0: 1500, shore1: 1600, top: 236, base: 192, far: 5200 };
const SEA_VERT = /* glsl */`
attribute float aPart;
varying vec3 vW, vN; varying float vPart;
void main(){ vec4 wp=modelMatrix*vec4(position,1.); vW=wp.xyz; vN=normalize(mat3(modelMatrix)*normal); vPart=aPart; gl_Position=projectionMatrix*viewMatrix*wp; }`;
const SEA_FRAG = /* glsl */`
uniform vec3 uRose; uniform vec2 uSeaPh;
varying vec3 vW, vN; varying float vPart;
${PEAK_GLSL}
// the height of the heaped tops at a place (0..1): broad heaps with a finer boil on them, drifting slowly
// downwind and turning over on the world's clock
float heap(vec2 q){
  vec2 w=q-uWind*uTime*12.+uSeaPh*40.;
  float a=pfbm2(w*.0031+vec2(0.,uTime*.02)), b=pn2(w*.0105+vec2(uTime*.08,7.));
  return clamp(smoothstep(.28,.78,a)*.72+.28*b,0.,1.);
}
void main(){
  vec3 p=vW, V=normalize(p-cameraPosition), Ng=normalize(vN);
  float top=smoothstep(.5,.9,vPart), under=1.-smoothstep(.02,.3,vPart);
  // the tops: light by the heaps' own slopes (the step widens with the eye's distance, so far tops stay calm)
  float e=18.+.012*length(p.xz-cameraPosition.xz);
  float h0=heap(p.xz), hx=heap(p.xz+vec2(e,0.)), hz=heap(p.xz+vec2(0.,e));
  vec3 Nt=normalize(vec3(-(hx-h0)*46./e,1.,-(hz-h0)*46./e));
  vec3 N=normalize(mix(Ng,Nt,top));
  float sl=dot(N,uSunDir), lit=smoothstep(-.12,.55,sl)*mix(.55,1.,h0);
  vec2 hd=normalize(V.xz+vec2(1e-5,0.));
  float sunAz=clamp(dot(hd,normalize(uSunDir.xz))*.5+.5,0.,1.), moonAz=clamp(dot(hd,normalize(uMoonDir.xz)),0.,1.);
  vec3 shade=mix(uCloudShade*.86,uRose,.2+.35*sunAz)*mix(.66,1.,h0);
  vec3 col=mix(shade,uCloudLit*mix(vec3(1.),uSunCol*1.15,.45),lit);
  // the low sun's gold road on the tops under it; the moon's silver on those under the moon
  // (the road shimmers as the tops under it turn over, on the world's clock)
  float shim=smoothstep(.36,.74,pn2(p.xz*.005+uTime*vec2(.21,.12)+uSeaPh)*.5+pn2(p.xz*.016-uTime*vec2(.4,.25)+uSeaPh.yx)*.5);
  col+=uSunCol*(.55*pow(sunAz,6.)+.12*pow(sunAz,2.))*top*(.35+.65*h0)*smoothstep(-.05,.3,sl+.25)*(.66+.7*shim);
  float glint=smoothstep(.5,.78,pn2(p.xz*.006+uTime*vec2(.09,.05)-uSeaPh)*.5+pn2(p.xz*.019-uTime*vec2(.2,.12)-uSeaPh.yx)*.5);
  col+=uMoonCol*3.2*pow(moonAz,5.)*top*(.3+.7*h0)*(.45+1.5*glint);
  // the shore's face and the underside: lilac, rose toward the sun, the sun coming through the bank's thin rim
  float thin=smoothstep(.3,.62,vPart)*(1.-top);
  vec3 low=mix(uCloudShade*.82,uRose*.9,.2+.5*sunAz)*(.8+.3*pn2(p.xz*.004+3.));
  low+=uSunCol*.9*pow(clamp(dot(V,uSunDir),0.,1.),3.)*thin;
  low=mix(low,uCloudLit*mix(vec3(1.),uSunCol*1.15,.45),smoothstep(.05,.6,dot(Ng,uSunDir))*(.35+.65*smoothstep(.15,.5,vPart)));
  col=mix(low,col,top);
  col=mix(col,low*.86,under);
  // THE BANK'S FOOT STANDS IN THE LAND'S FAR AIR: the shore's lower face and the sheet's underside go into the air's
  // own colour with distance (the colour the land's far edge and the sky's horizon go into), so the bank rises out
  // of the haze and no line lies under it
  float dA=length(p.xz-cameraPosition.xz), foot=1.-smoothstep(.1,.66,vPart+.2*(pn2(p.xz*.004+11.)-.5));
  // AND THE WHOLE BANK STANDS BEHIND 1500 M AND MORE OF AIR. The air thins with height (by half every 70 m); what a
  // sight line gathers of it is its length times the air's mean thickness between the eye's height and the place's.
  // Seen from the fields, through the low thick air, the bank and its rim go about three quarters into the horizon's
  // own colour, from the climb a half falling to a third, and no hard rim stands against the sky; seen from above
  // the crown, through thin air, the tops near the shore stay nearly clear, those 1000 m past the shore go a third
  // into it and the sheet's far edge a half and more
  float ea=exp(-max(cameraPosition.y,0.)/100.), eb=exp(-max(p.y,0.)/100.), dy=p.y-cameraPosition.y;
  float thick=abs(dy)<1. ? ea : 100.*(ea-eb)/dy;
  float veil=1.-exp(-length(p-cameraPosition)*thick/400.);
  col=mix(col,mix(uFogAway,uFogSun,sunAz*sunAz),max(foot*(1.-exp(-dA*dA/810000.)),veil));
  gl_FragColor=vec4(peakAir(col,p),1.);
}`;
export function makeFarSea(ctx, opts = {}) {
  const { hour, light, rng: rs, noise, origin = [PLACE.AX, PLACE.AZ] } = opts;
  const NB = 192, rings = [[-16, SEA.base, 0], [-24, SEA.base + 12, 0.2], [-22, SEA.base + 28, 0.42], [-10, SEA.top - 6, 0.62], [0, SEA.top, 0.8], [26, SEA.top, 1], [60, SEA.top, 1], [105, SEA.top, 1], [165, SEA.top, 1],
    [245, SEA.top, 1], [350, SEA.top, 1], [500, SEA.top, 1], [720, SEA.top, 1], [1040, SEA.top, 1], [1500, SEA.top, 1], [2150, SEA.top, 1], [2900, SEA.top, 1], [3650, SEA.top, 1]];
  const under = [[-16, SEA.base, 0], [300, SEA.base - 4, 0], [1400, SEA.base - 4, 0], [3650, SEA.base - 4, 0]];
  const wrapD = (d) => Math.abs(((d + 180) % 360 + 360) % 360 - 180);
  const o1 = rs.range(0, 60), o2 = rs.range(0, 60);
  // the shore's distance by bearing: uneven, and at its furthest on the bearings of the sun and the moon
  const shoreAt = (bear) => {
    const a = bear * DEG, n = noise.fbm2(Math.sin(a) * 1.6 + o1, Math.cos(a) * 1.6 + o2, 2);
    const hold = Math.max(1 - sstep(10, 34, wrapD(bear - hour.sunAz)), 1 - sstep(10, 30, wrapD(bear - hour.moonAz)));
    return lerp(clamp(1550 + 75 * n, SEA.shore0, SEA.shore1), SEA.shore1, hold);
  };
  const pos = [], part = [], idx = [];
  const ring = (list, flip) => {
    const v0 = pos.length / 3;
    for (let j = 0; j < list.length; j++) for (let i = 0; i < NB; i++) {
      const bear = i / NB * 360, a = bear * DEG, r = shoreAt(bear) + list[j][0], x = origin[0] + Math.sin(a) * r, z = origin[1] - Math.cos(a) * r;
      // heaps: 26 m of relief on the tops near the shore, broader and lower far out
      const lump = list[j][2] > 0.5 ? (26 * noise.fbm2(x / 190 + o1, z / 190 + o2, 3) + 10 * noise.n2(x / 62 + o2, z / 62 + o1)) * list[j][2] * (1 - 0.5 * sstep(600, 3000, list[j][0])) : 4 * noise.n2(x / 90 + o1, z / 90);
      pos.push(x, list[j][1] + lump, z); part.push(list[j][2]);
    }
    for (let j = 0; j < list.length - 1; j++) for (let i = 0; i < NB; i++) {
      const i1 = (i + 1) % NB, a = v0 + j * NB + i, b = v0 + j * NB + i1, c = v0 + (j + 1) * NB + i, d = v0 + (j + 1) * NB + i1;
      if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  };
  ring(rings, true); ring(under, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
  g.computeVertexNormals();
  const material = new THREE.ShaderMaterial({ name: 'PeakFarSea', vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, uniforms: { ...light.uniforms, uRose: { value: new THREE.Color(hour.rose) }, uSeaPh: { value: new THREE.Vector2(0, 0) } }, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'far sea'; mesh.frustumCulled = false;
  const object = new THREE.Group(); object.name = 'farSea'; object.add(mesh);
  // the towers: great heaps standing on the sheet 2200 to 3400 m out, 650 to 950 m broad and some 500 to 1300 m
  // high, their middles 1300 m apart and more (eight to twelve are asked for; as many stand as find room, four to
  // eight: the loop runs its tries out, so the far sea's phases, drawn after it, hang on it), no tower's middle
  // toward the sun, the moon or due north
  const at = [], nT = rs.int(8, 12);
  for (let i = 0, tries = 0; i < nT && tries < 200; tries++) {
    const bear = rs.range(0, 360), r = rs.range(2200, 3400), w = rs.range(650, 950);
    // no tower's middle within 44 degrees of the sun's bearing or 48 of the moon's, counted from the axis (a heap's
    // body reaches at most 1.27 of its breadth from its middle, its last wisp counted): from the line above the
    // crown, which keeps within 145 m of the axis, no part of a tower then comes within 9 degrees of the sun or of
    // the moon's disc. (From the fields, 485 m off the axis, a tower's edge can in a rare deal reach either disc.)
    if (wrapD(bear - hour.sunAz) < 44 || wrapD(bear - hour.moonAz) < 48) continue;
    // and no tower's middle within 20 degrees of north, the sky the last straight flies toward (a tower's body may
    // still reach to within some 7 degrees of that heading, low beside the ring; the stars over it stand free)
    if (wrapD(bear) < 20) continue;
    if (at.some((q) => hyp(q[0] - origin[0] - Math.sin(bear * DEG) * r, q[2] - origin[1] + Math.cos(bear * DEG) * r) < 1300)) continue;
    at.push([origin[0] + Math.sin(bear * DEG) * r, SEA.top - 40, origin[1] - Math.cos(bear * DEG) * r, w]); i++;
  }
  const towers = makeCloudField({
    rng: rs, mode: 'cumulus', at, height: 1.1, puffs: 44, wind: [0, 0, 0], opacity: 0.95, sunDirection: hour.sunDir, sunColor: hour.sun, litColor: '#f6f1e6', shadeColor: '#a9a8c8', bottomColor: hour.rose,
    nearFade: [0.02, 0.05], farFade: [20000, 24000], fogFade: 0.45, silver: 1, erode: 1.0, softness: 0.32, bump: 1.25, noiseTexture: opts.noiseTexture,
  });
  object.add(towers.object);
  // where the rolling tops, the sun's road and the moon's silver stand in their turning at the clock's first second:
  // dealt by the far sea's own stream, after its last draw
  material.uniforms.uSeaPh.value.set(rs.range(0, 97), rs.range(0, 97));
  return { object, mesh, towers, shoreAt, triangles: idx.length / 3 + towers.triangles, update(dt, time, camera) { towers.update(dt, time, camera); } };
}

// THE MOON STANDS OVER CLOUD. Three or four heaps (the number dealt) stand on the far sea toward the moon: each
// middle within MOONHEAPS.arc degrees of the moon's bearing (the hour's, whichever hour stands), 2400 to 3000 m
// from the axis, 500 to 700 m broad, its head 300 to 500 m over its foot (the kit's heap is as high as its breadth
// times a figure, three quarters to five quarters of it, and its topmost puff stands some 0.15 of the breadth over
// that: each heap is a field of its own with the figure (400 m less 0.14 of its breadth) over its breadth),
// middles 650 m apart and more. NO HEAP STANDS BETWEEN THE LINE AND THE MOON: from every
// fifth point of the line (15 m) the ray to a point MOONHEAPS.clear degrees under the moon's lower limb is
// followed, and a middle is refused where that ray passes lower than the heap's highest possible head within the
// heap's reach (MOONHEAPS.reach of its breadth) and the clear angle beside it. So from the fields, where the moon
// stands low over the far sea, the heaps flank it; from above the crown their heads stand under it. The moon's
// silver lies on their heads as on the sheet (toward the moon's bearing from the eye, on what faces up): the
// part's own patch of the kit's cloud material, made only if the kit's text is as it was when this was written.
// Their own stream ('moonheaps'): no old tower, no phase of the sea and nothing else moves by them.
export const MOONHEAPS = { arc: 40, clear: 3, reach: 0.9, silver: 1.2 };
export function makeMoonHeaps(ctx, opts = {}) {
  const { hour, light, rng: rs, origin, route } = opts, MH = MOONHEAPS;
  const wrapD = (d) => Math.abs(((d + 180) % 360 + 360) % 360 - 180);
  const mx = Math.sin(hour.moonAz * DEG), mz = -Math.cos(hour.moonAz * DEG), tanM = Math.tan((MOON_EL - MOON_SIZE - MH.clear) * DEG), tanC = Math.tan(MH.clear * DEG);
  const eyes = []; if (route) for (let i = 0; i < route.length; i += 5) eyes.push(route[i]);
  const hides = (x, z, w) => {
    const head = SEA.top - 40 + 520;
    for (const e of eyes) { const qx = x - e[0], qz = z - e[2], al = qx * mx + qz * mz; if (al > 0 && Math.abs(qx * mz - qz * mx) < MH.reach * w + al * tanC && e[1] + al * tanM < head) return true; }
    return false;
  };
  const at = [], n = rs.int(3, 4);
  for (let i = 0, tries = 0; i < n && tries < 600; tries++) {
    const bear = hour.moonAz + rs.range(-MH.arc, MH.arc), r = rs.range(2400, 3000), w = rs.range(500, 700);
    const x = origin[0] + Math.sin(bear * DEG) * r, z = origin[1] - Math.cos(bear * DEG) * r;
    if (wrapD(bear) < 20 || at.some((q) => hyp(q[0] - x, q[2] - z) < 650) || hides(x, z, w)) continue;
    at.push([x, SEA.top - 40, z, w]); i++;
  }
  const object = new THREE.Group(); object.name = 'moonHeaps';
  const silver = light.uniforms.uMoonCol.value.clone().multiplyScalar(MH.silver), az = new THREE.Vector2(mx, mz), fields = [];
  const swaps = [['uniform float uTime, uSilver, uFogFade;', 'uniform vec3 uMoonSilver; uniform vec2 uMoonAz; uniform float uTime, uSilver, uFogFade;'],
    ['col += uSunColor*(uSilver*rim);', 'col += uSunColor*(uSilver*rim); col += uMoonSilver*pow(clamp(dot(normalize(vWorld.xz - cameraPosition.xz), uMoonAz), 0., 1.), 5.)*smoothstep(.1, .8, vNrm.y + N.y*.4);']];
  for (const q of at) {
    const f = makeCloudField({
      rng: rs, mode: 'cumulus', at: [q], height: (400 - 0.14 * q[3]) / q[3], puffs: 36, wind: [0, 0, 0], opacity: 0.95, sunDirection: hour.sunDir, sunColor: hour.sun, litColor: '#f6f1e6', shadeColor: '#a9a8c8', bottomColor: hour.rose,
      nearFade: [0.02, 0.05], farFade: [20000, 24000], fogFade: 0.45, silver: 1, erode: 1.0, softness: 0.32, bump: 1.25, noiseTexture: opts.noiseTexture,
    });
    const m = f.material;
    if (swaps.every(([a]) => m.fragmentShader.split(a).length === 2)) { for (const [a, b] of swaps) m.fragmentShader = m.fragmentShader.replace(a, b); m.uniforms.uMoonSilver = { value: silver }; m.uniforms.uMoonAz = { value: az }; }
    object.add(f.object); fields.push(f);
  }
  return { object, fields, at, triangles: fields.reduce((s, f) => s + f.triangles, 0), update(dt, time, camera) { for (const f of fields) f.update(dt, time, camera); } };
}

// ---------------------------------------------------------------- cloud that travels: the small clouds of the open ring, the scud, the cleft's mist
// Every shred rides a TRACK FIXED IN THE WORLD, downwind, on the world's clock: it starts at one end of its track,
// thins in over the first tenth, thins out over the last and begins again. Nothing here reads an eye.
//  - the small clouds (12 to 16, 35 to 70 m across, thin): tracks across the ring of open air between the crown and
//    the far sea, none nearer the axis than 250 m, from inside the far sea's windward shore to inside its lee shore.
//    Their shadows on the land are cast from these same places (the light's uCloudP, written in update);
//  - the scud: shreds torn from the crown's tops, streaming off downwind between 258 and 296 m, past either side
//    of the last rock;
//  - the upper scud, between 288 and 346 m: streaming by beside the rock and forming in its wake;
//  - the cleft's mist: a few shreds that hang and stream in the cleft, each beside the lane, on a short track.
// No track of the scud, the upper scud or the mist comes nearer the route's line than its shred's own reach and
// 10 m (tested here against the whole line); the small clouds are not tested: by their place they stand 60 m and
// more from it.
const DRIFT_VERT = /* glsl */`
attribute vec4 iA, iB, iC;
uniform float uTime; uniform vec2 uWind; uniform vec3 uSunDir;
varying vec2 vUv; varying vec4 vK; varying vec3 vW;
void main(){
  float len=max(iA.w,1.), s=fract(iC.x+uTime*iC.y/len);
  vec3 c=iA.xyz+vec3(uWind.x,0.,uWind.y)*(s*len)+iB.xyz;
  float fade=smoothstep(0.,.1,s)*(1.-smoothstep(.88,1.,s));
  vec3 right=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]), up=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
  float size=iB.w*(1.+.06*sin(uTime*.4+iC.z*40.));
  vUv=position.xy*2.;
  vW=c+(right*position.x+up*position.y*.62)*size*2.;
  // the eye inside a shred's own two and a half metres: it thins to nothing there, as any mist does
  fade*=smoothstep(.6,2.5,distance(c,cameraPosition)-size*.5);
  vK=vec4(iC.z,fade*iC.w,clamp(.5+.5*dot(normalize(iB.xyz+vec3(0.,.01,0.)),uSunDir),0.,1.),s);
  gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);
  if(fade<=0.) gl_Position=vec4(2.,2.,2.,1.);
}`;
const DRIFT_FRAG = /* glsl */`
uniform vec3 uRose;
varying vec2 vUv; varying vec4 vK; varying vec3 vW;
${PEAK_GLSL}
void main(){
  float r=length(vUv);
  // a shred is a soft torn wisp, never a disc: its edge is where a warped noise runs out
  vec2 q=vUv*1.25+vK.x*vec2(37.1,11.7)+vec2(-uTime*.045,uTime*.02);
  float n=pfbm2(q+.9*vec2(pn2(q*1.7+3.),pn2(q*1.7+9.)));
  float body=1.-smoothstep(.1,1.,r+(n-.5)*1.1);
  float a=body*body*vK.y;
  if(a<.008) discard;
  // lit toward the sun, lilac away from it, rose underneath; a bright thin rim where the sun or the moon comes through
  float light=clamp(vK.z*.7+.3+.4*(n-.5)-.25*vUv.y*(1.-vK.z),0.,1.);
  vec3 col=mix(mix(uRose,uCloudShade,smoothstep(-.6,.3,vUv.y)),uCloudLit*mix(vec3(1.),uSunCol*1.15,.4),smoothstep(.2,.8,light));
  vec3 V=normalize(vW-cameraPosition);
  float thin=1.-body;
  col+=uSunCol*.6*pow(clamp(dot(V,uSunDir),0.,1.),4.)*thin+uMoonCol*1.5*pow(clamp(dot(V,uMoonDir),0.,1.),6.)*thin;
  gl_FragColor=vec4(peakAir(col,vW),a);
}`;
export function makeDrift(ctx, opts = {}) {
  const { hour, light, rng: rs, origin = [PLACE.AX, PLACE.AZ], route = null, lane = null } = opts;
  // (a stream for each cast: the small clouds keep the drift's own; the scud, the upper scud and the cleft's mist
  // each have theirs)
  const rsScud = opts.rngScud || rs, rsUpper = opts.rngUpper || rs, rsMist = opts.rngMist || rs;
  const wx = light.uniforms.uWind.value.x, wz = light.uniforms.uWind.value.y, nx = -wz, nz = wx;
  const A = [], B = [], C = [], small = [];
  // how near a track (from a place, len metres downwind) comes to the route's line
  const lineGap = (x, y, z, len) => {
    let g = 1e9;
    let gq = 1e18;
    if (route) for (const q of route) { const t = clamp((q[0] - x) * wx + (q[2] - z) * wz, 0, len), a = q[0] - x - wx * t, b = q[1] - y, c = q[2] - z - wz * t, w = a * a + b * b + c * c; if (w > gq) continue; const e = hyp3(a, b, c); if (e < g) { g = e; gq = w * 1.0000001; } }
    return g;
  };
  const shred = (x, y, z, len, speed, phase, puffs, spread, size, flat, alpha, r = rs) => {
    for (let k = 0; k < puffs; k++) {
      const a = r.range(0, TAU), d = spread * Math.sqrt(r());
      A.push(x, y, z, len); B.push(Math.cos(a) * d, r.range(-1, 1) * spread * flat, Math.sin(a) * d, size * r.range(0.75, 1.2)); C.push(phase, speed, r(), alpha);
    }
  };
  // the small clouds of the open ring
  const nSmall = rs.int(12, MAX_CLOUDS);
  for (let i = 0; i < nSmall; i++) {
    const lat = rs.range(250, 1300) * (rs.chance(0.6) ? 1 : -1), hc = Math.sqrt(1700 * 1700 - lat * lat), y = rs.range(205, 245), across = rs.range(35, 70);
    const x = origin[0] + nx * lat - wx * hc, z = origin[1] + nz * lat - wz * hc, c = { x, y, z, len: 2 * hc, speed: rs.range(7, 9), phase: rs(), r: across * 0.5 };
    small.push(c);
    shred(x, y, z, c.len, c.speed, c.phase, 8, across * 0.36, across * 0.34, 0.22, 0.85);
  }
  // the scud off the crown's tops
  for (let i = 0, tries = 0; i < 56 && tries < 500; tries++) {
    const r = rsScud, lat = r.range(52, 270) * r.sign(), y = r.range(258, 296), x = origin[0] + nx * lat - wx * 260, z = origin[1] + nz * lat - wz * 260, size = r.range(20, 36);
    if (lineGap(x, y, z, 760) < size + 16) continue;
    shred(x, y, z, 760, r.range(12, 17), r(), 4, size * 0.75, size, 0.3, 0.75, r); i++;
  }
  // the upper scud, between 288 and 346 m: beside the rock (110 m and more to either side of the axis's own wind
  // line, out to 160 m north of it and 280 m south) it streams by from 260 m upwind; in the rock's wake it forms
  // 140 m downwind of the axis and streams away. (Any track that would come within its shred's reach and 16 m of
  // the route's line is not laid.)
  for (let i = 0, tries = 0; i < 40 && tries < 400; tries++) {
    const r = rsUpper, lat = r.range(-160, 280), wake = Math.abs(lat) < 110, s0 = wake ? 140 : -260, len = 780 - s0, y = r.range(288, 346), size = r.range(18, 34);
    const x = origin[0] + nx * lat + wx * s0, z = origin[1] + nz * lat + wz * s0;
    if (lineGap(x, y, z, len) < size + 16) continue;
    shred(x, y, z, len, r.range(12, 17), r(), 4, size * 0.75, size, 0.3, 0.7, r); i++;
  }
  // the cleft's own mist, beside the lane
  if (lane) for (let i = 0, tries = 0; i < 8 && tries < 120; tries++) {
    const r = rsMist, q = lane[r.int(0, lane.length - 1)], side = r.sign(), off = r.range(15, 26), len = r.range(40, 70), size = r.range(7, 11);
    const x = q[0] + nx * side * off - wx * len * 0.5, y = q[1] + r.range(-8, 10), z = q[2] + nz * side * off - wz * len * 0.5;
    if (lineGap(x, y, z, len) < size + 10) continue;
    shred(x, y, z, len, r.range(2, 4), r(), 2, size * 0.6, size, 0.4, 0.38, r); i++;
  }
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
  g.instanceCount = A.length / 4;
  const material = new THREE.ShaderMaterial({ name: 'PeakDrift', vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG, uniforms: { ...light.uniforms, uRose: { value: new THREE.Color(hour.rose) } }, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'drift cloud'; mesh.frustumCulled = false; mesh.renderOrder = 9;
  light.uniforms.uCloudN.value = small.length;
  // where each small cloud stands at a moment of the world's clock (the same law the shader moves it by)
  const place = (time) => {
    for (let i = 0; i < small.length; i++) {
      const c = small[i], s = (c.phase + time * c.speed / c.len) % 1, fade = sstep(0, 0.1, s) * (1 - sstep(0.88, 1, s));
      light.uniforms.uCloudP.value[i].set(c.x + wx * s * c.len, c.y, c.z + wz * s * c.len, c.r * (0.4 + 0.6 * fade) * (fade > 0 ? 1 : 0));
    }
  };
  place(0);
  return { object: mesh, small, count: A.length / 4, update(dt, time) { place(time); } };
}

// ---------------------------------------------------------------- the buttress's thread of falling water
// THE FACE'S WATER HANGS. One water comes down the north buttress on one bearing just sunward of its nose: it seeps
// out of the rock over the top bench, comes down to that bench as a wet way on the rock, crosses the bench as dark
// wet turf, LEAPS from the bench's lip and falls free to the second bench, crosses it, leaps again and ends in
// spray on the first bench (it sinks into the bench's turf there). A second comes out of the wet rock in the cleft
// and falls free to the first ledge under it. A leap is the west fall's law (a launch, the drop by the time
// fallen): the risers lean back two metres in five, so water let go 2 m out from a lip would strike the rock five
// metres down and run on as a white line; the launch is therefore the least that carries the water clear to the
// tread below, 1.5 to 2.5 m (dealt) out from the riser's foot: it hangs up to some 5 m off the rock. It is 2 m
// broad where it leaves and 5 to 7 m (dealt) where it lands. No white water lies on the rock or on a tread: the
// wet way is the rock's own shader (uWater). Its strands fall on the world's clock.
const THREAD_VERT = /* glsl */`
attribute vec3 aK; attribute vec4 aArc;
varying vec3 vK, vW;
void main(){
  vK=aK; vec3 wp=(modelMatrix*vec4(position,1.)).xyz;
  // (a hanging water is one strip along its arc, turned about the arc toward the eye, as the west fall's body is)
  if(aK.z<.5) wp+=normalize(cross(aArc.xyz,cameraPosition-wp))*aK.x*aArc.w;
  vW=wp; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);
}`;
const THREAD_FRAG = /* glsl */`
uniform float uPhase;
varying vec3 vK, vW;
${PEAK_GLSL}
void main(){
  // vK: across the water (-1..1), metres fallen along its arc (from a place dealt to each water), and 1 on the
  // spray's cards (on the water itself: half of how far down its leap it is)
  float s=vK.x, run=vK.y, t=uTime+uPhase;
  float sun=peakShade(vW), a;
  vec3 col=uCloudLit*(uSkyLow*1.5+uSunCol*.85*sun);
  if(vK.z>.5){
    // the spray where it lands: a soft breathing puff
    float r=length(vec2(s,run));
    a=(1.-smoothstep(.15,1.,r+.35*(pfbm2(vec2(s,run)*2.+vec2(0.,-t*.7))-.5)))*.34;
  } else {
    float streak=pfbm2(vec2(s*2.2+3.*pn2(vec2(run*.05,7.)),run*.22-t*2.3))*.6+pn2(vec2(s*5.,run*.7-t*5.))*.4;
    float tau=vK.z*2.04;
    // (it leaves the lip whole and is drawn out into strands as it falls and spreads)
    a=smoothstep(.22+.14*tau,.56+.1*tau,streak+.3*(1.-abs(s)))*pow(max(1.-s*s,0.),.7)*smoothstep(0.,.05,tau)*(.92-.3*tau);
    col*=.8+.35*streak;
  }
  if(a<.01) discard;
  gl_FragColor=vec4(peakAir(col,vW),a);
}`;
function makeThread(rs, rsCleft, form, light, rock, origin, route) {
  const sp = form.spur, bear = sp.b - sp.w * rs.range(0.25, 0.45), y1 = sp.y[2] + rs.range(10, 14), phase = rs.range(0, 60);
  const G = 9.81, pos = [], k = [], arc = [], idx = [], waters = [], hung = [];
  // the skin on a bearing, read every quarter metre between two heights (the BUILT skin's own function)
  const profile = (b, yLo, yHi) => { const n = Math.ceil((yHi - yLo) * 4) + 1, r = new Float32Array(n); for (let i = 0; i < n; i++) r[i] = form.radius(b, yLo + i * 0.25); return (y) => { const f = clamp((y - yLo) * 4, 0, n - 1.001), i = Math.floor(f); return lerp(r[i], r[i + 1], f - i); }; };
  // how near the route's line comes to a point of the part's own space
  const lineGap = (x, y, z) => { let g = 1e9, gq = 1e18; if (route) for (const q of route) { const a = x + origin[0] - q[0], b = y - q[1], c = z + origin[1] - q[2], w = a * a + b * b + c * c; if (w > gq) continue; const e = hyp3(a, b, c); if (e < g) { g = e; gq = w * 1.0000001; } } return g; };
  // ONE LEAP: the water leaves the rock at yL on its bearing and falls by the fall's law (a launch speed, the drop
  // by the time fallen) until it meets the rock again. The launch is the least for which it meets the rock at a
  // good place (the bench below, or a ledge: see each water) and not on the riser, which leans back. It is 2 m
  // broad where it leaves and wFoot broad where it lands, with spray there
  const leap = (b, R, yL, good, yStop, wFoot, ph, lowest = false) => {
    const a = b * DEG, sx = Math.sin(a), sz = -Math.cos(a), r0 = R(yL) + 0.3;
    let v = 0, T = 0, yHit = 1e9;
    for (let w = 0.6; w < 14; w += 0.1) {
      let hit = 0, yh = 0;
      for (let tf = 0.3; tf < 4; tf += 0.03) { const y = yL - 0.5 * G * tf * tf, r = r0 + w * tf; if (y < yStop) break; if (r < R(y) + 0.25) { if (good(y, r)) { hit = tf; yh = y; } break; } }
      // (the first good place the rising launch finds; or, where the lowest is asked, the lowest of them all)
      if (hit && (v === 0 || (lowest && yh < yHit - 0.5))) { v = w; T = hit; yHit = yh; if (!lowest) break; }
    }
    if (v === 0) return null;
    const SEG = 14, pts = [];
    let run = ph, px = 0, py = 0, near = 1e9;
    for (let i = 0; i <= SEG; i++) {
      const tau = Math.pow(i / SEG, 0.8), tf = T * tau, r = r0 + v * tf, y = yL - 0.5 * G * tf * tf, tl = hyp(v, G * tf) || 1, half = lerp(1, wFoot / 2, tau * tau * (3 - 2 * tau));
      if (i > 0) run += hyp(r - px, y - py);
      px = r; py = y;
      pts.push([sx * r, y, sz * r, sx * v / tl, -G * tf / tl, sz * v / tl, half, run, tau]);
      near = Math.min(near, lineGap(sx * r, y, sz * r) - half);
    }
    // (media, and yet NO HANGING WATER COMES WITHIN 20 m OF THE LINE: one that would is not hung, and its way is wet rock)
    if (near < 20) return null;
    const v0 = pos.length / 3;
    pts.forEach((q, i) => {
      for (const side of [-1, 1]) { pos.push(q[0], q[1], q[2]); arc.push(q[3], q[4], q[5], q[6]); k.push(side, q[7], q[8] * 0.49); }
      if (i > 0) { const c = v0 + (i - 1) * 2; idx.push(c, c + 2, c + 1, c + 1, c + 2, c + 3); }
    });
    // the spray where it lands: three upright cards crossed on the tread
    const f = pts[SEG], Rs = 0.8 * wFoot, foot = [f[0], f[1] + 0.4 * Rs, f[2]];
    for (let i = 0; i < 3; i++) {
      const t = i * Math.PI / 3, ux = Math.cos(t), uz = Math.sin(t), c = pos.length / 3;
      pos.push(foot[0] - ux * Rs, foot[1] - Rs, foot[2] - uz * Rs, foot[0] + ux * Rs, foot[1] - Rs, foot[2] + uz * Rs, foot[0] + ux * Rs, foot[1] + Rs, foot[2] + uz * Rs, foot[0] - ux * Rs, foot[1] + Rs, foot[2] - uz * Rs);
      k.push(-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1); for (let j = 0; j < 4; j++) arc.push(0, 1, 0, 0); idx.push(c, c + 1, c + 2, c, c + 2, c + 3);
    }
    hung.push({ bear: b, from: yL, to: f[1], speed: v, reach: f[7] - ph, broad: wFoot, out: hyp(f[0], f[2]) - R(f[1] + 2.5), lineGap: near, foot });
    return f;
  };
  // THE BUTTRESS'S WATER: from its seep it comes down the rock to the top bench, crosses it, leaps from its lip to
  // the second bench, crosses that, leaps again and ends in spray on the first bench
  {
    const R = profile(bear, sp.y[0] - 2, y1 + 1);
    let low = y1;
    // (a bench's tread lies between its lip, at the bench's height, and its riser's foot 3.5 m higher: the water
    // lands on it 1.5 to 2.5 m, dealt, and more out from the riser's foot)
    for (const i of [2, 1]) {
      const yA = sp.y[i - 1], yB = yA + 3.5, rT = Math.min(R(yB) + rs.range(1.5, 2.5), lerp(R(yB), R(yA), 0.8));
      const f = leap(bear, R, sp.y[i] + 0.6, (y, r) => y <= yB + 0.5 && r >= rT - 0.3, yA - 1, rs.range(5, 7), phase + i * 17); low = f ? f[1] : yA + 2;
    }
    waters.push([bear, low - 1, y1]);
  }
  // THE CLEFT'S WATER, by the same law: out of the wet rock on a bearing of its own between 26 and 34, from the
  // bed's lip next under a height dealt between 240 and 250 m (a lip: where the skin turns most sharply outward of
  // its neighbours), down to the lowest ledge above 215 m that a launch can reach (a ledge: where the skin steps
  // out 1.2 m and more within 2.5 m of height)
  if (rsCleft) {
    const b = rsCleft.range(26, 34), ys = rsCleft.range(240, 250), wFoot = rsCleft.range(5, 7), ph = rsCleft.range(0, 60), R = profile(b, 211, ys + 3);
    let yL = ys, best = -1e9; for (let y = ys - 8; y <= ys; y += 0.25) { const c = R(y) - 0.5 * (R(y - 1.5) + R(y + 1.5)); if (c > best) { best = c; yL = y; } }
    const f = leap(b, R, yL, (y) => yL - y >= 6 && R(y - 1) - R(y + 1.5) >= 1.2, 215, wFoot, ph, true);
    waters.push([b, (f ? f[1] : yL - 6) - 1, yL + 2]);
  }
  waters.forEach((w, i) => rock.uniforms.uWater.value[i].set(Math.sin(w[0] * DEG), -Math.cos(w[0] * DEG), w[1], w[2]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 3)); g.setAttribute('aArc', new THREE.Float32BufferAttribute(arc, 4)); g.setIndex(idx);
  g.computeBoundingSphere(); if (g.boundingSphere) g.boundingSphere.radius += 8;
  const m = new THREE.ShaderMaterial({ name: 'PeakThread', uniforms: { ...light.uniforms, uPhase: { value: phase } }, vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'buttress thread'; mesh.renderOrder = 4;
  return { mesh, bear, top: y1, waters, hung };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const core = ctx.core, stream = (name) => core.makeRng(core.hashSeed('peak:' + name + ':' + ctx.seed));
  // every stream of the part, taken here before anything is built
  const rsForm = stream('form'), rsCrown = stream('crown'), rsSea = stream('farsea'), rsDrift = stream('drift'), rsThread = stream('thread');
  // (the cleft's water has a stream of its own)
  const rsCleftWater = stream('cleftwater');
  const rsScud = stream('scud'), rsUpper = stream('upperscud'), rsMist = stream('mist');
  const noise = core.makeNoise(core.hashSeed('peak:noise:' + ctx.seed));
  const hour = opts.hour || makeHour('golden');
  const light = opts.light || makeLight(hour);
  const origin = opts.origin || [0, 0];
  if (!opts.light) light.uniforms.uAxis.value.set(origin[0], PLACE.CROWNR, origin[1]);
  const detail = ctx.quality?.detail ?? 1;
  const form = opts.form || makeForm(rsForm, noise);
  const object = new THREE.Group(); object.name = 'peak';
  const rock = opts.rock || makeRockMaterial(light);
  const body = await buildBody(ctx, form, hour);
  const mesh = new THREE.Mesh(body.geometry, rock); mesh.name = 'peakBody';
  object.add(mesh);
  await ctx.yield();
  // the route's line (the world hands it in, a point every 3 m), and of it the lane through the heights where the
  // crown's cloud can stand
  const route = opts.route || null, lane = route ? route.filter((q) => q[1] > PLACE.CROWN0 - 14 && q[1] < CLEFT.y1 + 18 && hyp(q[0] - origin[0], q[2] - origin[1]) < 200) : null;
  const clouds = await makeCrown(ctx, rsCrown, hour, origin, opts.full ?? 0.5, detail, lane);
  await ctx.yield();
  await lightCrown(ctx, clouds, hour, form, origin, lane);
  await ctx.yield();
  const farSea = makeFarSea(ctx, { hour, light, rng: rsSea, noise, origin, noiseTexture: clouds.crown.noiseTexture });
  await ctx.yield();
  const moonHeaps = makeMoonHeaps(ctx, { hour, light, rng: stream('moonheaps'), origin, route, noiseTexture: clouds.crown.noiseTexture });
  const drift = makeDrift(ctx, { hour, light, rng: rsDrift, rngScud: rsScud, rngUpper: rsUpper, rngMist: rsMist, origin, route, lane });
  // the cloud holds world coordinates of its own: it hangs in a group that undoes the part's place
  const air = new THREE.Group(); air.name = 'peakAir'; air.position.set(-origin[0], 0, -origin[1]);
  air.add(clouds.crown.object, farSea.object, moonHeaps.object, drift.object); object.add(air);
  await ctx.yield();
  const thread = makeThread(rsThread, rsCleftWater, form, light, rock, origin, route);
  object.add(thread.mesh);
  const hero = {
    object, radius: 200, height: PLACE.TOP, center: new THREE.Vector3(0, 190, 0), ground: true, groundY: 0,
    light, hour, form, body, clouds, farSea, moonHeaps, drift, rock, lane, thread,
    anchors: {
      summit: new THREE.Vector3(0, PLACE.TOP, 0), portalSeat: new THREE.Vector3(0, RING.y, 0),
      fallLip: new THREE.Vector3(PLACE.FALLX - PLACE.AX + 2, PLACE.FALLTOP, PLACE.FALLZ - PLACE.AZ),
      fallFoot: new THREE.Vector3(PLACE.FALLX - PLACE.AX, PLACE.FALLFOOT, PLACE.FALLZ - PLACE.AZ),
      faceRadiusAt,
    },
    // (the camera is handed on only because the kit's puffs are sorted for drawing; no cloud's place, size, reach
    // or strength reads it)
    update(dt, time, camera) {
      light.uniforms.uTime.value = time;
      // (the kit's heaps breathe and boil very slowly on the clock they are handed: here they are handed the world's
      // clock four times over, so the crown boils and the far towers turn over at a pace an eye can see)
      clouds.crown.update(dt, time * 4, camera); clouds.retouch(); farSea.update(dt, time * 4, camera); moonHeaps.update(dt, time * 4, camera); drift.update(dt, time);
    },
    dispose() {},
  };
  return hero;
}

// ---------------------------------------------------------------- the land's own law (world coordinates)
// Rolling fields; the shelf of bare rock (top 34 m) against the mountain's south-west foot, edged by a scarp to the
// fields and by flower terraces down to the vale on its north side; the garden vale (floor 8 m) west of the
// mountain with the river's bed and the fall's pool; low rises west and north of the vale; wider, slower hills far out.
// (wide enough that fourteen wind-shaped forms stand on it with the lane and the gaps the rules ask: east to
// x -50, and two lobes to the south-west, to x -400 and z +40, clear of the river)
export const SHELF = { cx: -161, cz: -146, hx: 111, hz: 102, round: 34, lobes: [{ cx: -275, cz: -70, hx: 75, hz: 90, round: 30 }, { cx: -350, cz: -15, hx: 50, hz: 55, round: 30 }] };
// the breach in the south scarp: where it meets the slab's edge, its half breadth and the breadth over which the
// scarp comes back, and how its line leans (east for every metre south: north-north-west, as the rise's bearing)
export const BREACH = { x: -111, z: -44, half: 28, soft: 26, lean: 0.364 };
// the north tarn: one round water in the north meadows, 90 m across
export const TARN = { x: 30, z: -760, r: 45, y: -1 };
export const RIVER = [[-176, -350], [-198, -348], [-215, -338], [-216, -312], [-215, -290], [-232, -268], [-262, -254], [-296, -232], [-330, -196], [-372, -150], [-420, -92], [-480, -30], [-560, 40], [-680, 120]];
// THE RIVER GOES ON: from where its built water ends it runs on in long bends, south-west and then west and
// north-west round the land under the sun's bearing, to the haze and under the far sea (the ground's own skin shows
// its water; the land lies in a broad shallow valley along it)
export const FAR_RIVER = [[-680, 120], [-800, 190], [-950, 170], [-1060, 60], [-1090, -90], [-1040, -240], [-1100, -390], [-1260, -470], [-1380, -600], [-1400, -770], [-1540, -880], [-1760, -900], [-2000, -800], [-2300, -860], [-2700, -760], [-3300, -900]];
// THE TARN'S BECK: a small river comes down out of the north-east land into the north tarn and leaves it westward,
// winding across the north meadows in a shallow dale of its own to join the far river (the ground's own skin shows
// its water, its gravel and its rushes; the land's law cuts its dale)
export const BECK = [[560, -1090], [430, -985], [300, -950], [190, -870], [95, -800], [30, -760], [-40, -775], [-110, -815], [-190, -775], [-280, -835], [-390, -800], [-500, -870], [-640, -835], [-790, -905], [-940, -850], [-1090, -905], [-1250, -830], [-1400, -770]];
export const beckD = (x, z) => {
  let d = 1e9;
  if (z > -640 || z < -1210 || x < -1520 || x > 680) return d;
  for (let i = 0; i < BECK.length - 1; i++) {
    const a = BECK[i], bx = BECK[i + 1][0] - a[0], bz = BECK[i + 1][1] - a[1], t = clamp(((x - a[0]) * bx + (z - a[1]) * bz) / (bx * bx + bz * bz), 0, 1);
    d = Math.min(d, hyp(x - a[0] - bx * t, z - a[1] - bz * t));
  }
  return d;
};
export const farRiverD = (x, z) => {
  let d = 1e9;
  for (let i = 0; i < FAR_RIVER.length - 1; i++) {
    const a = FAR_RIVER[i], bx = FAR_RIVER[i + 1][0] - a[0], bz = FAR_RIVER[i + 1][1] - a[1], t = clamp(((x - a[0]) * bx + (z - a[1]) * bz) / (bx * bx + bz * bz), 0, 1);
    d = Math.min(d, hyp(x - a[0] - bx * t, z - a[1] - bz * t));
  }
  return d;
};
// the terraces: over how many metres short of the river's bank they die away
export const TERRACE = { die: 30 };
export function makeLand(noise, form) {
  const P = PLACE;
  // the river's middle line: nearest point, how far along (0 at the pool) and the water's level there
  const segs = [];
  let acc = 0;
  for (let i = 0; i < RIVER.length - 1; i++) { const a = RIVER[i], b = RIVER[i + 1], l = hyp(b[0] - a[0], b[1] - a[1]); segs.push({ ax: a[0], az: a[1], dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l, l, s0: acc }); acc += l; }
  const riverAt = (x, z) => {
    let best = 1e9, bs = 0;
    // (THRIFT, the same answer: a reach whose squared distance is clearly the greater is not measured)
    let bq = 1e18;
    for (const g of segs) { const t = clamp((x - g.ax) * g.dx + (z - g.az) * g.dz, 0, g.l), ex = x - g.ax - g.dx * t, ez = z - g.az - g.dz * t, q = ex * ex + ez * ez; if (q > bq) continue; const d = hyp(ex, ez); if (d < best) { best = d; bs = g.s0 + t; bq = q * 1.0000001; } }
    return { d: best, s: bs };
  };
  // (the river's bed and banks lie within 28.5 m of its middle line: whether a place lies within 29 m of the box
  // about any one reach of that line; where it does not, the river has no part in the land's height or its kind)
  const rbox = segs.map((g) => [Math.min(g.ax, g.ax + g.dx * g.l) - 29, Math.max(g.ax, g.ax + g.dx * g.l) + 29, Math.min(g.az, g.az + g.dz * g.l) - 29, Math.max(g.az, g.az + g.dz * g.l) + 29]);
  const rall = rbox.reduce((a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[3], b[3])], [1e9, -1e9, 1e9, -1e9]), rx0 = rall[0], rx1 = rall[1], rz0 = rall[2], rz1 = rall[3];
  const nearRiver = (x, z) => { if (!(x > rx0 && x < rx1 && z > rz0 && z < rz1)) return false; for (const b of rbox) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) return true; return false; };
  // the water's level: 8 m through the vale, then down to the fields by the shelf's north-west corner
  const waterAt = (s) => P.VALE - 7.2 * sstep(150, 330, s);
  const riverHalf = (s) => 17 + 2.5 * Math.sin(s * 0.021) - 5 * sstep(170, 320, s);
  const boxSd = (x, z, B) => {
    const qx = Math.abs(x - B.cx) - (B.hx - B.round), qz = Math.abs(z - B.cz) - (B.hz - B.round);
    const ax = Math.max(qx, 0), az = Math.max(qz, 0);   // (beside an edge or inside, one of the two is nought and the distance is the other)
    return (ax > 0 && az > 0 ? hyp(ax, az) : ax + az) + Math.min(Math.max(qx, qz), 0) - B.round;
  };
  // the shelf's outline: its main slab and the south-western lobes as one (a soft join where they meet)
  const join = (a, b) => { const k = clamp(0.5 + 0.5 * (b - a) / 24, 0, 1); return lerp(b, a, k) - 24 * k * (1 - k); };
  const shelfSd = (x, z) => join(join(boxSd(x, z, SHELF), boxSd(x, z, SHELF.lobes[0])), boxSd(x, z, SHELF.lobes[1])) + 7 * noise.n2(x / 55 + 3.3, z / 55 - 1.7);
  // THE SCARP IS A BROKEN SCARP, by these rules of the place, the same all round the shelf: buttresses stand out of
  // its line by up to 9 m and recesses lie between them; it goes down in two risers with a ledge between (none to
  // 9 m broad: turf grows on it); its crest is notched (see height); fans of fallen stone lean on its foot, turfed
  // over. And at ONE PLACE on its south side THE BREACH: an old fall has left a ramp of turf and blocks 40 m broad
  // (more at its foot), from inside the slab's edge down into the fields, its line leaning north-north-west.
  // scarpAt: how far out from the shelf's outline a place lies (sd), the same counted from the buttresses' own
  // line (s1), the ledge's breadth there (wl), how much of a fan (fan) and of the breach (br) is there
  const scarpAt = (x, z, out = {}) => {
    const sd = shelfSd(x, z);
    out.sd = sd; out.s1 = sd; out.wl = 0; out.fan = 0; out.br = 0;
    if (sd > 82 || sd < -40) return out;
    out.s1 = sd - 9 * sstep(-0.15, 0.55, noise.n2(x / 33 + 1.1, z / 33 - 4.2));
    out.wl = 9 * sstep(-0.1, 0.5, noise.n2(x / 41 - 6.3, z / 41 + 2.9));
    out.fan = sstep(0, 0.6, noise.n2(x / 52 - 2.2, z / 52 + 6.1));
    const along = Math.abs(x - BREACH.x - (z - BREACH.z) * BREACH.lean) - 0.25 * Math.max(0, sd);
    out.br = (1 - sstep(BREACH.half, BREACH.half + BREACH.soft, along)) * sstep(BREACH.z - 70, BREACH.z - 45, z);
    return out;
  };
  const _sc = {}, _te = { w: 0, f: 0, r: 0, sd: 0 };
  // (R7 KEEPS ITS PLACE: the pace's "terraces' foot" is read under the line from the steps' own law with no step
  // died away, as it was read before the steps were made to die away toward the river: heightWhole, asked only by
  // routePlan. The land everything stands on and is drawn from is height.)
  let stepsWhole = false;
  // terraceEnd: how much of the terraces stands at a place by the outline's facing (f; 0 beyond the river) and by
  // the river (r), and by both (w = f r; all 0..1, asked only from 8 m inside the outline to 72 m out, 0 elsewhere), and how far out
  // from the main slab's rounded outline the place lies (sd); see the terraces in height. (The side of the river: the shelf lies on one hand of
  // its line all the way down, the hand a negative cross product names.)
  const terraceEnd = (x, z, out) => {
    out.w = 0; out.f = 0; out.r = 0; out.sd = -1e3;
    if (!(z < SHELF.cz && x < -118)) return out;
    const bsd = boxSd(x, z, SHELF); out.sd = bsd;
    if (bsd <= -8 || bsd >= 72) return out;
    const qx = Math.max(Math.abs(x - SHELF.cx) - (SHELF.hx - SHELF.round), 0), qz = Math.max(Math.abs(z - SHELF.cz) - (SHELF.hz - SHELF.round), 0);
    const f = sstep(0.3, 0.6, qz / Math.max(hyp(qx, qz), 1e-6));
    if (f > 0) {
      let best = 1e9, side = 0, bs = 0;
      let bq = 1e18;
      for (const g of segs) { const t = clamp((x - g.ax) * g.dx + (z - g.az) * g.dz, 0, g.l), ex = x - g.ax - g.dx * t, ez = z - g.az - g.dz * t, q = ex * ex + ez * ez; if (q > bq) continue; const d = hyp(ex, ez); if (d < best) { best = d; side = g.dx * ez - g.dz * ex; bs = g.s0 + t; bq = q * 1.0000001; } }
      if (side < 0) { out.f = f; out.r = sstep(0, TERRACE.die, best - riverHalf(bs) - 9); out.w = f * out.r; }
    }
    return out;
  };
  // the fields roll by 3 m; behind the entry they run on as one broad dale that falls gently away to the south
  // (so nothing of the land stands in the sight of an eye that looks in through the entry from behind it)
  const fieldsAt = (x, z) => {
    const fx = x - P.AX, fz = z - P.AZ, far = fx * fx + fz * fz < 176000 ? 0 : sstep(420, 1000, hyp(fx, fz));   // (nought within 419.5 m of the axis)
    const dale = (1 - sstep(90, 260, Math.abs(x))) * sstep(-20, 80, z);
    // (THRIFT, the same number: where a term's weight is nought its noise is not asked for)
    const near = 2.8 * noise.fbm2(x / 130 + 7.1, z / 130 - 2.3, 2) * (1 - 0.6 * dale) - 0.024 * Math.max(z, 0) * dale;
    return far * (1 - dale) > 0 ? near + far * (1 - dale) * (9 + 16 * noise.fbm2(x / 520 + 1.3, z / 520 + 4.1, 2)) : near;
  };
  const height = (x, z) => {
    let h = fieldsAt(x, z);
    // the vale and the low rises round it (west and north of the mountain)
    // (the vale lies in x -420..-110 and z -500..-236, the rises in z under -140 and x under -60: outside them they are nought and are not worked)
    const vale = x > -420 && x < -110 && z > -500 && z < -236 ? sstep(-420, -340, x) * (1 - sstep(-150, -110, x)) * (sstep(-500, -430, z) * (1 - sstep(-262, -236, z))) : 0;
    const rise = z < -140 && x < -60 ? sstep(-140, -260, z) * sstep(-60, -200, x) * (1 - vale) : 0;
    if (rise > 0) h += rise * (10 + 9 * noise.fbm2(x / 170 - 3.7, z / 170 + 8.2, 2)) * (1 - sstep(700, 1200, hyp(x - P.AX, z - P.AZ)));
    if (vale > 0) h = lerp(h, P.VALE + 0.7 * noise.n2(x / 38, z / 38), vale);
    // the shelf: a broken scarp to the fields (see scarpAt); on its north side terraces step down to the vale instead
    const sc = scarpAt(x, z, _sc), sd = sc.sd;
    if (sd < 82) {
      const top = P.SHELF + 0.9 * noise.fbm2(x / 44 + 5.5, z / 44 + 0.4, 2);
      // the crest's notches (two steps of 3.5 m, cut back a few metres into the slab's edge)
      const q = 2 * sstep(0.15, 0.7, noise.n2(x / 21 + 8.8, z / 21 - 3.1)), top1 = top - 3.5 * (Math.floor(q) + sstep(0.35, 0.65, q - Math.floor(q))) * sstep(-9, 2, sd);
      // the fans of fallen stone at the foot, turfed over; the ledge's height; the two risers
      const base = h + sc.fan * 11 * (1 - sstep(10, 48, sc.s1));
      const mid = base + (top1 - base) * (0.46 + 0.1 * noise.n2(x / 29 + 3.3, z / 29 + 7.1));
      const hw = top1 - (top1 - mid) * sstep(-4, 4, sc.s1) - (mid - base) * sstep(sc.wl + 3, sc.wl + 12, sc.s1);
      // the breach's ramp, from 28 m inside the slab's edge down to the fan's toe 58 m out
      const tb = clamp((sd + 28) / 86, 0, 1), hb = lerp(top, h, lerp(tb, sstep(0, 1, tb), 0.5)) + 0.8 * noise.n2(x / 13, z / 13) * sstep(0, 0.2, tb);
      h = lerp(hw, hb, sc.br);
    }
    // the terraces: five steps of the land from the shelf's north edge down to the vale's floor. THEY FOLLOW THE
    // SHELF'S OWN OUTLINE: a step is a distance out from the main slab's rounded outline (from 6 m inside it to
    // 42 m out), so along the straight north edge the steps run as the edge runs and at the north-west corner they
    // would turn with its round; they live where the outline faces north (within 53 degrees of it, gone by 72) and,
    // as they were, to the mountain's foot in the east; and THEY DIE AWAY TOWARD THE RIVER: over TERRACE.die metres
    // short of the river's bank (the bank: 9 m beyond the water's half breadth) they go down into the land that
    // lies there without them, each step's end a rounded foot above the bank, and none stands beyond the river.
    // (Before: laid by x and z alone, eased in from x -300 to -266: their west end and foot lay square to the map
    // and a wedge of them stood west of the river's bend.)
    // (Beyond the steps' foot the vale's floor is laid level as it always was, by x alone: the steps' own law hands
    // over to it across the 30 m beyond the foot.)
    // (Where they die away the land is never left higher than the step that stood there: it goes down to the land
    // that lies there without them where that is lower, and keeps the step's own level where the scarp would stand
    // above it, down to the river's bank.)
    const te = terraceEnd(x, z, _te), tt = clamp((te.sd + 6) / 48, 0, 1);
    if (tt > 0) {
      const st = tt * 5, si = Math.floor(st), sf = st - si;
      const terr = P.SHELF - (P.SHELF - P.VALE) * Math.min(5, si + 0.1 * sf + 0.9 * sstep(0.72, 1, sf)) / 5;
      const hT = lerp(h, terr + 0.35 * noise.n2(x / 21, z / 21), (1 - sstep(-152, -118, x)) * sstep(0, 0.04, tt));
      h = lerp(lerp(h, lerp(Math.min(h, hT), hT, stepsWhole ? 1 : te.r), te.f), lerp(h, hT, sstep(-300, -266, x)), sstep(42, 72, te.sd));
    }
    // the far river's valley: broad and shallow, its floor at the water's last level
    if (x < -430) { const fr = farRiverD(x, z); if (fr < 240) h = lerp(h, 0.3 + 0.5 * noise.n2(x / 60, z / 60), sstep(240, 40, fr)); }
    // the beck's dale: wherever the land stands higher, it is cut down to the beck's own level, a floor 90 m broad
    // (the beck wanders over it) sloping up to the meadows over 55 m more on either side
    if (z < -640) { const bd = beckD(x, z); if (bd < 100) h = lerp(h, Math.min(h, -0.3 + 0.4 * noise.n2(x / 40, z / 40)), sstep(100, 45, bd)); }
    // the river's bed and the fall's pool
    if (nearRiver(x, z)) {
      const rv = riverAt(x, z), wl = waterAt(rv.s), hw = riverHalf(rv.s);
      const bank = sstep(hw + 9, hw - 2, rv.d);
      if (bank > 0) h = lerp(h, wl - 1.25 + 0.35 * noise.n2(x / 9, z / 9), bank);
    }
    const px = x - (P.FALLX - 20), pz = z - P.FALLZ;
    if (px * px + pz * pz < 784) { const pd = hyp(px, pz); if (pd < 27) h = lerp(h, P.VALE - 2.4, sstep(27, 15, pd)); }
    // the north tarn: a shallow bowl, its shore a little ragged (its noise moves the shore by under 14 m: further
    // off than that it is not asked for)
    const tx = x - TARN.x, tz = z - TARN.z;
    if (tx * tx + tz * tz < (TARN.r + 47) * (TARN.r + 47)) {
      const td0 = hyp(tx, tz);
      if (td0 < TARN.r + 46) { const td = td0 + 5 * noise.n2(x / 31 + 4.4, z / 31 - 7.7); if (td < TARN.r + 30) h = lerp(lerp(h, Math.max(h, TARN.y + 0.7), sstep(TARN.r + 30, TARN.r + 16, td)), TARN.y - 2.2, sstep(TARN.r + 8, TARN.r - 10, td)); }
    }
    return h;
  };
  const levelAt = (x, z) => {
    const rv = riverAt(x, z), hw = riverHalf(rv.s);
    const pd = hyp(x - (P.FALLX - 20), z - P.FALLZ);
    if (hyp(x - TARN.x, z - TARN.z) < TARN.r + 9) return TARN.y;
    return rv.d < hw + 6 || pd < 26 ? waterAt(rv.s) : -1e3;
  };
  // the ground a thing stands on: the land, or the mountain's skin where it stands higher
  const heightWhole = (x, z) => { stepsWhole = true; const h = height(x, z); stepsWhole = false; return h; };
  const surfaceAt = (x, z) => Math.max(height(x, z), form ? form.heightAt(x - P.AX, z - P.AZ) : -1e3);
  const skinR = (bear, y) => (form ? form.radius(bear, y) : faceRadiusAt(y));
  return { height, heightWhole, levelAt, surfaceAt, riverAt, nearRiver, waterAt, riverHalf, shelfSd, scarpAt, terraceEnd, fieldsAt, skinR };
}

// ---------------------------------------------------------------- the route's knots (world coordinates), by the rules at the head of the world's file
// The entry stands 485 m from the axis (R1). The climb is laid by bearing, height and distance from the face's
// envelope (R5): 63 m off under the crown, 54 m at the cleft's mouth, 50 and 48 m in the cleft, then out from the
// last rock to 70 m off it; its last knot is the summit turn's own first point (R6).
export const ENTRY = { x: -70, z: 130 };
export const CLIMB = [[305, 112, 63], [340, 162, 63], [8, 200, 54], [42, 244, 50], [75, 286, 48], [100, 314, 70]];
// the height at which the summit turn begins
export const TURN_Y = 338;
// the first leg's length, and how high over the shelf's top the line crosses the scarp's rim
export const FIRST_LEG = 60, RIM_OVER = 2;
// the cleft through the crown: a standing lane from bearing b0 at the crown's base to bearing b1 above its top
export const CLEFT = { b0: 8, b1: 75, y0: PLACE.CROWN0, y1: 286 };
export const RING = { y: PLACE.TOP + 10, r: 9, turn: 55, straight: 65, rise: 14 };
// the height at which the last straight begins (it rises to the ring)
export const straightY = (f = 1) => RING.y - f * RING.straight * Math.tan(RING.rise * DEG);
export function routeKnots(land) {
  const P = PLACE, K = [];
  // R1 the fields: in due north, 4.2 m over the highest grass of the first leg, rising 3.4 degrees from the first
  // metre (so the heading's horizon lies under the middle of the eye's field and the whole crown stands inside it).
  // The leg is FIRST_LEG long (the engine's level entry frame needs that much) and ends at THE BEND.
  const dx = -0.342, dz = -0.94, yr = P.SHELF + RIM_OVER, leg = FIRST_LEG;
  let top = -1e9, run = 0;
  for (let zs = ENTRY.z + 12; zs >= ENTRY.z - leg - 8; zs -= 4) top = Math.max(top, land.height(ENTRY.x, zs), land.height(ENTRY.x - 3, zs), land.height(ENTRY.x + 3, zs));
  const y0 = top + 4.2;
  for (const f of [0, 1 / 3, 2 / 3, 1]) K.push([ENTRY.x, y0 + f * leg * 0.06, ENTRY.z - f * leg]);
  // (the bend's own place goes with the knots, for the looks)
  K.bend = K[3];
  // R2 ONE EVEN RISE to the rim, which lies north-north-west of the bend (found by marching the land on the rise's
  // own bearing): the longest run the land gives from the bend, and the rim crossed RIM_OVER metres over the shelf's
  // top, so that the rise is of some 30 m over 120 to 135 m (13 to 15 degrees) and nowhere steeper than a sixth
  // more than its mean. The line keeps a part of its northward heading over the first third (its first knot stands
  // seven tenths of the way out to the rise's own bearing) and comes over the rim on the rim's bearing, still
  // rising a little toward its height over the slab
  for (; run < 200; run += 1) if (land.shelfSd(ENTRY.x + dx * run, ENTRY.z - leg + dz * run) < 2) break;
  const bx = ENTRY.x, bz = ENTRY.z - leg, yb = y0 + leg * 0.06;
  K.push([bx + dx * run * 0.34 * 0.7, lerp(yb, yr, 0.3), bz + dz * run * 0.34], [bx + dx * run * 0.67, lerp(yb, yr, 0.66), bz + dz * run * 0.67], [bx + dx * run, yr, bz + dz * run]);
  // R3 the shelf: down its middle to its north edge, 20 to 22 m over the slab
  K.push([-140, P.SHELF + 22, -150], [-190, P.SHELF + 20, -248]);
  // R4 the garden: north over the vale, rising to the height of the fall's lip, the fall abeam 58 m to the right
  K.push([P.FALLX - 52, P.FALLTOP - 5, -304], [P.FALLX - 58, P.FALLTOP + 1, P.FALLZ - 10]);
  // R5 the climb, the cleft and the leg above the crown: bearing, height, distance from the face's envelope
  for (const [bear, y, off] of CLIMB) {
    const r = faceRadiusAt(y) + off;
    K.push([P.AX + Math.sin(bear * DEG) * r, y, P.AZ - Math.cos(bear * DEG) * r]);
  }
  // R6 one right turn of radius RING.turn south of the top, still rising, then straight and north into the ring,
  // rising 14 degrees all along the straight (the ring stands on the top rock above the eye, the northern sky behind
  // it). The turn's middle stands RING.turn east of the axis's meridian and RING.straight south of the axis; the turn
  // begins due east of its middle, heading south, at TURN_Y
  const R = RING.turn, cx = P.AX + R, cz = P.AZ + RING.straight;
  K.push([cx + R, TURN_Y, cz]);
  for (let i = 1; i <= 4; i++) { const a = i * 45 * DEG; K.push([cx + R * Math.cos(a), lerp(TURN_Y, straightY(), i / 4), cz + R * Math.sin(a)]); }
  K.push([P.AX, straightY(0.62), P.AZ + RING.straight * 0.62], [P.AX, straightY(0.3), P.AZ + RING.straight * 0.3], [P.AX, RING.y, P.AZ]);
  return K;
}

// ---------------------------------------------------------------- the line's places, the looks and the pace (R7, R8)
// PLACES OF THE LINE, in metres from its start, each found on the line itself at every metre: where it is nearest a
// place of the world, where it first stands at a height, where a thing stands so many degrees off its heading. The
// looks and the pace run between these places and read nothing else.
export function routePlan(opts = {}) {
  const { path, land, form, knots, shapes = [], hour } = opts, P = PLACE, L = path.length;
  const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
  // where the line is nearest a place of the world (between two metres of it)
  const metresAt = (x, y, z, a = 0, b = L) => { let best = 1e18, bd = a; for (let d = a; d <= b; d += 1) { path.posAtDist(d, _p); const q = (_p.x - x) ** 2 + (_p.y - y) ** 2 + (_p.z - z) ** 2; if (q < best) { best = q; bd = d; } } return bd; };
  // where the line first stands at a height
  const metresAtHeight = (h) => { for (let d = 0; d <= L; d += 1) { path.posAtDist(d, _p); if (_p.y >= h) return d; } return L; };
  // how far off the heading a place stands, in the plan, at a metre of the line
  const offAt = (x, z, s) => {
    path.posAtDist(s, _p); path.tangentAtDist(s, _t);
    const dx = x - _p.x, dz = z - _p.z, l = hyp(dx, dz) || 1, tl = hyp(_t.x, _t.z) || 1;
    return Math.acos(clamp((dx * _t.x + dz * _t.z) / (l * tl), -1, 1)) / DEG;
  };
  // the first metre from a place on at which a thing stands so many degrees off the heading or more (the leg's end
  // if never)
  const untilOff = (x, z, s0, deg, s1) => { for (let s = s0; s <= s1; s += 1) if (offAt(x, z, s) >= deg) return s; return s1; };
  const S = {};
  // the bend (the first leg's end); the scarp's foot under the line, its rim (where the line first stands over the
  // shelf) and the shelf's north edge (where it leaves it); the terraces' foot (where the vale's floor first lies under it)
  S.bend = metresAt(knots.bend[0], knots.bend[1], knots.bend[2], 0, 140);
  S.rim = 0; S.edge = 0;
  for (let d = 0; d <= L; d += 1) { path.posAtDist(d, _p); if (_p.y > 90) break; if (land.shelfSd(_p.x, _p.z) < 2) { if (!S.rim) S.rim = d; S.edge = d; } }
  S.foot = S.rim; S.terr = S.edge;
  for (let d = 0; d <= S.rim; d += 1) { path.posAtDist(d, _p); if (land.shelfSd(_p.x, _p.z) < 17) { S.foot = d; break; } }
  // the fall abeam; where it lies well behind (135 degrees off the heading)
  S.fall = metresAt(P.FALLX - 58, P.FALLTOP, P.FALLZ, S.edge, S.edge + 260);
  // (read from the steps' own law, whole: the steps now die away toward the river's bank, which the line passes
  // within 4 m of; the pace's place stays where it was laid, see the land's heightWhole)
  for (let d = S.edge; d <= S.fall; d += 1) { path.posAtDist(d, _p); S.terr = d; if (land.heightWhole(_p.x, _p.z) < P.VALE + 1.5) break; }
  // the cleft's mouth and top (by height); under the crown's lowest cloud (15 m under its base); clear over its
  // highest cloud beside the rock (18 m over the cleft's top: the lane's own upper end)
  S.mouth = metresAtHeight(CLEFT.y0); S.cleftTop = metresAtHeight(CLEFT.y1); S.under = metresAtHeight(CLEFT.y0 - 15); S.clear = metresAtHeight(CLEFT.y1 + 18);
  S.fallBehind = untilOff(P.FALLX, P.FALLZ, S.fall, 135, S.mouth);
  // the summit turn's two ends; where the eye stands level with the ring's lower rim
  S.turn0 = metresAt(P.AX + 2 * RING.turn, TURN_Y, P.AZ + RING.straight, S.cleftTop, L); S.turn1 = metresAt(P.AX, straightY(), P.AZ + RING.straight, S.turn0, L);
  S.ringLevel = metresAtHeight(RING.y - RING.r);
  return { S, L, metresAt, metresAtHeight, offAt, untilOff };
}

// (how far each look of the climb turns the gaze toward its thing)
export const LOOK = { rise: 0.6, fall: 0.3, nose: 0.7, rock: 0.38 };
// R8 THE LOOKS: each a thing at a place, each between two places of the line (in metres here), one after another.
// A look shorter than 38 m would be a turn of about a second: it is left out.
export function routeLooks(plan, opts = {}) {
  const { path, land, form, shapes = [], hour } = opts, { S, untilOff, metresAtHeight } = plan, P = PLACE, out = [];
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  const add = (name, at, a, b, weight, fade) => { if (b - a >= 38) out.push({ name, at, from: a, to: b, weight, fade }); };
  // THE RISE AND THE SHELF, one stone shape for both: the nearest to the line of the shapes that stand on the side
  // the sun stands on (found from the heading at the shelf's middle and the sun's own bearing) and stay before the
  // eye for 60 m and more past the rim. ON THE RISE the gaze rests on the place where it stands on the slab (its
  // foot), from the bend until the shelf's own look has taken the gaze whole; OVER THE SHELF it rests on its middle,
  // from 20 m past the scarp's rim until the shape is abeam
  {
    path.tangentAtDist((S.rim + S.edge) / 2, _t);
    const sunSide = _t.z * hour.sunDir.x - _t.x * hour.sunDir.z > 0 ? 1 : -1;
    let best = null, bEnd = 0;
    for (const c of shapes.filter((q) => q.near && q.side === sunSide)) {
      const e = untilOff(c.x, c.z, S.rim + 20, 88, S.edge);
      if (e - (S.rim + 20) >= 60 && (!best || c.flank < best.flank)) { best = c; bEnd = e; }
    }
    if (best) {
      add('rise', [best.x, best.base, best.z], S.bend, S.rim + 20 + 0.4 * (bEnd - S.rim - 20), LOOK.rise, 0.14);
      add('shape', [best.x + best.leanX * best.h * 0.5, best.base + best.h * 0.5, best.z + best.leanZ * best.h * 0.5], S.rim + 20, bEnd, 0.3, 0.4);
    }
  }
  // over the garden: the fall at the middle of its drop (5 m out from the lip, where the water hangs), from the
  // shelf's north edge until it stands 60 degrees off the heading
  const fallAt = [P.FALLX - 5, P.FALLFOOT + 0.55 * (P.FALLTOP - P.FALLFOOT), P.FALLZ];
  const sFallOff = untilOff(fallAt[0], fallAt[2], S.edge, 60, S.fall);
  add('fall', fallAt, S.edge, sFallOff, 0.4, 0.5);
  // THE CLIMB'S THREE LOOKS, each a thing at its place, in the order the line meets them (the gaze goes back to
  // the line between them):
  // LOW, the fall again as the line climbs past it: from where it stands 45 degrees off the heading until it lies
  // 100 degrees off, behind the shoulder (the same thing as the look before, taken up from it: one pull)
  const sFallLow = untilOff(fallAt[0], fallAt[2], S.edge, 45, S.fall), sFallHigh = untilOff(fallAt[0], fallAt[2], S.fall - 20, 100, S.mouth);
  add('fall again', fallAt, sFallLow, sFallHigh, LOOK.fall, 0.5);
  // MIDDLE, the north buttress: its nose at the lip of its first bench, from that place until the line stands level
  // with its second bench
  const sp = form.spur, spY = sp.y[0], spR = faceRadiusAt(spY) + form.spurOut(spY), noseAt = [P.AX + Math.sin(sp.b * DEG) * spR, spY, P.AZ - Math.cos(sp.b * DEG) * spR];
  const sNoseOff = metresAtHeight(sp.y[1]);
  add('nose', noseAt, sFallHigh, sNoseOff, LOOK.nose, 0.3);
  // HIGH, the crown's underside where the rock goes up into it beside the cleft's mouth: from that place to the
  // cleft's mouth. (Its place is typed: 12 degrees round from the mouth on the lane's side and 12 m over the
  // crown's base, 6 m off the face's envelope, the first rock that stands inside the cloud beside the lane. No
  // stream and no seed enters it.)
  const mouthY = CLEFT.y0 + 12, mouthR = faceRadiusAt(mouthY) + 6, mouthB = (CLEFT.b0 + 12) * DEG;
  add('rock', [P.AX + Math.sin(mouthB) * mouthR, mouthY, P.AZ - Math.cos(mouthB) * mouthR], sNoseOff, S.mouth, LOOK.rock, 0.5);
  // above the crown: the moon, from the cleft's top until it stands 30 degrees off the heading
  const M = hour.moonDir, _moonAt = new THREE.Vector3(), L = path.length;
  const sMoonOff = untilOff(P.AX + M.x * 1e6, P.AZ + M.z * 1e6, S.clear, 30, S.turn1);
  add('moon', (time, u) => { path.posAtDist(u * L, _moonAt); return _moonAt.addScaledVector(M, 3000); }, S.cleftTop, sMoonOff, 0.5, 0.4);
  // through the summit turn: the last tooth of rock at its waist (16 m under its top), from the turn's first point to
  // its last
  add('tooth', [P.AX, P.TOP - 16, P.AZ], S.turn0, S.turn1, 0.5, 0.5);
  // (on the last straight nothing pulls the gaze: the line itself runs to the ring)
  return out;
}

// R7 THE PACE: a law of the place; every change of it runs between two places of the line
export const PACE = { fields: 0.8, garden: 0.15, cleft: 0.2, crown: 0.53 };
export function routePace(plan) {
  const { S, L } = plan;
  return (u) => {
    const s = u * L;
    // slower over the fields; up to the usual pace between the scarp's foot and its rim
    let k = PACE.fields + (1 - PACE.fields) * sstep(S.foot, S.rim, s);
    // a little slower above the garden: down between the shelf's north edge and the terraces' foot, up again
    // between the fall's abeam point and the place where the fall lies well behind
    k -= PACE.garden * sstep(S.edge, S.terr, s) * (1 - sstep(S.fall, S.fallBehind, s));
    // faster through the cleft: up between the crown's lowest cloud and the cleft's mouth, down again between the
    // cleft's top and the place where the line stands clear over the crown's highest cloud
    k += PACE.cleft * sstep(S.under, S.mouth, s) * (1 - sstep(S.cleftTop, S.clear, s));
    // slow above the crown and through the summit turn, from that same stretch on; back to the usual pace between
    // the turn's end and the place where the eye stands level with the ring's lower rim
    k -= PACE.crown * sstep(S.cleftTop, S.clear, s) * (1 - sstep(S.turn1, S.ringLevel, s));
    return k;
  };
}

// ---------------------------------------------------------------- the sky: one dome, deepening evenly with the eye's height
// ONE LAW OF THE EYE'S HEIGHT, and nothing else follows it: the sky's colour overhead and which stars show. It runs
// in one eased curve through five heights (the fields, the fall's lip, the crown's base, the crown's top, the
// summit), with no step and no level stretch, so an eye that stood still at any height would see one unchanging
// sky. Low down the sky keeps its warm band at every height (14 degrees deep in the fields, 6 at the top). The
// stars stand where they stand; the bright air below hides them: none under 150 m, the brightest from the crown's
// base, the fainter through the crown's height, all of them at the top. The sun's disc is the same at every height.
// THE STARLESS REACH is no drawn thing: it is a region of this star sky, in the north, in which the stars thin and
// go out over a band a few degrees deep, turning cold before they fail; inside it the sky itself is only a few
// shown steps darker. ONE smooth field in sky angles: a slanting reach, broadest in the north-east, leaning up toward the west,
// where it does not close (the stars come back little by little over 20 degrees). Its edge breathes a degree or two
// about a fixed line on the world's clock; it never moves on. It touches nothing and casts nothing.
export const SKY_Y = [10, 63, 200, 280, 360];
const pchip = (xs, ys, x) => {
  const n = xs.length; if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
  let i = 0; while (x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], d = (k) => (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]);
  const m = (k) => { if (k === 0) return d(0); if (k === n - 1) return d(n - 2); const a = d(k - 1), b = d(k); return a * b <= 0 ? 0 : 2 * a * b / (a + b); };
  const t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m(i) + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m(i + 1);
};
// the law itself (also run alone, to print its steps): the eye's height in, the sky's numbers out
const SKY_BAND = [14, 12.5, 9, 7.5, 6], SKY_GLOW = [1, 0.9, 0.5, 0.34, 0.2], SKY_DEEP = [0, 0.12, 0.5, 0.75, 1], SKY_AY = [150, 200, 280, 350], SKY_ADMIT = [0, 0.22, 0.62, 1], SKY_TY = [150, 360], SKY_TW = [0.75, 0.5];
const skyTables = new WeakMap();
export function skyLaw(y, hour, out = null) {
  // (the tables of an hour are made once and kept; a call writes into the result it is handed, so the flight makes
  // no garbage here)
  let T = skyTables.get(hour);
  if (!T) {
    const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
    // (the engine's grade shows no light under about #3d in a channel: the upper sky's colours stand just over that
    // floor, so that the deep sky is shown as an inky blue the stars stand in, never as a flat black; the second
    // step, at the crown's height, is the same blue at every hour)
    const zen = [hour.zen, '#3f78cf', '#3d467d', '#3d4260', '#3e424e'].map(hex);
    const mid = [new THREE.Color(hour.zen).lerp(new THREE.Color(hour.hor), 0.42), new THREE.Color('#3f78cf').lerp(new THREE.Color(hour.hor), 0.36), new THREE.Color('#3e63b8'), new THREE.Color('#3e4c9c'), new THREE.Color('#3e4678')].map((c) => [c.r, c.g, c.b]);
    // (the colours are eased in the sRGB sense, where even steps look even, and handed on as linear light)
    const enc = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    T = { zen: [0, 1, 2].map((k) => zen.map((c) => enc(c[k]))), mid: [0, 1, 2].map((k) => mid.map((c) => enc(c[k]))) };
    skyTables.set(hour, T);
  }
  const dec = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const w = out || { zen: [0, 0, 0], mid: [0, 0, 0], band: 0, admit: 0, twinkle: 0, glow: 0, deep: 0 };
  for (let k = 0; k < 3; k++) { w.zen[k] = dec(pchip(SKY_Y, T.zen[k], y)); w.mid[k] = dec(pchip(SKY_Y, T.mid[k], y)); }
  // the warm band's depth in degrees, the share of the stars the air lets through, how hard they twinkle
  w.band = pchip(SKY_Y, SKY_BAND, y); w.admit = pchip(SKY_AY, SKY_ADMIT, y); w.twinkle = pchip(SKY_TY, SKY_TW, y);
  // the air's own glow about the sun (the disc and its near glare are the sun's and do not change)
  w.glow = pchip(SKY_Y, SKY_GLOW, y);
  // how far the band above the horizon has gone from the low air's pale gold to deep gold and rose
  w.deep = pchip(SKY_Y, SKY_DEEP, y);
  return w;
}

const UPPER_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir=position; vec4 p=projectionMatrix*viewMatrix*vec4(position*100.+cameraPosition,1.); if(abs(p.w)<1e-4) p.w=1e-4; gl_Position=p.xyww; }`;
const UPPER_FRAG = /* glsl */`
uniform float uTime, uStarK, uBand, uAdmit, uTw, uGlow, uDeep; uniform vec3 uSunDir, uSunCol, uZen, uMid, uFogSun, uFogAway, uRose, uRC, uRU, uRV, uRiver; uniform vec4 uReach, uReachB, uMoonD;
varying vec3 vDir;
float uh2(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float un2(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f); return mix(mix(uh2(i),uh2(i+vec2(1.,0.)),f.x),mix(uh2(i+vec2(0.,1.)),uh2(i+vec2(1.,1.)),f.x),f.y); }
vec3 uh33(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
// how far inside the reach a direction lies: 0 outside, 1 well inside (degrees on a chart about the reach's middle)
float reach(vec3 d){
  float c=dot(d,uRC); if(c<.15) return 0.;
  vec2 q=vec2(atan(dot(d,uRU)/c),atan(dot(d,uRV)/c))*57.2958;
  vec2 A=uReach.xy, AB=uReach.zw-uReach.xy; float L2=max(dot(AB,AB),1e-3);
  float t=dot(q-A,AB)/L2, tc=clamp(t,0.,1.3);
  float pd=length(q-A-AB*tc);
  float w=mix(uReachB.x,uReachB.y,smoothstep(0.,1.,t));
  w+=3.6*(un2(q*.05+uReachB.w)-.5)+1.2*sin(uTime*.105+uReachB.z+2.6*un2(q*.04+3.))+.5*sin(uTime*.061+1.7*uReachB.z);
  return smoothstep(0.,6.5,w-pd)*(1.-smoothstep(.5,1.08,t));
}
// the river of stars: 1 on its middle line, 0 outside it (a band about a great circle)
float river(vec3 d){ float s=abs(dot(d,uRiver)); return 1.-smoothstep(.06,.2,s+.035*(un2(d.xz*7.+d.y*5.)-.5)); }
// one layer of stars: a star in a cell of the direction's own lattice, its size in true angle, never under a pixel
vec3 stars(vec3 d, float n, float keep, float size, float pix, float gain, float late){
  vec3 g=d*n, c=floor(g), r3=uh33(c);
  vec3 sp=normalize((c+.5+(r3-.5)*.5)/n);
  vec3 q=sp*n-c; float rr=max(size,pix*.75), m=rr*n;
  float rv=river(sp);
  if(r3.z>keep*(.55+.9*rv) || any(lessThan(q,vec3(m))) || any(greaterThan(q,vec3(1.-m)))) return vec3(0.);
  float hs=fract(r3.x*7.31+r3.y*3.17), b=gain*(.26+.74*hs*hs*hs)*size*size/(rr*rr);
  // the air lets the brightest through first
  b*=smoothstep(0.,.14,uAdmit-late-.78*sqrt(max(1.-hs,0.)));
  float a=length(d-sp);
  float dk=reach(sp);
  // along the reach's edge a star loses its warmth, dims and is out
  b*=1.-smoothstep(hs*.5,hs*.5+.45,dk);
  float tk=fract(hs*5.3);
  vec3 tint=tk<.34 ? vec3(1.,.9,.74) : (tk<.67 ? vec3(.78,.87,1.15) : vec3(1.,.83,.8));
  tint=mix(tint,vec3(.5,.74,1.35),smoothstep(.03,.4,dk));
  b*=1.+uTw*sin(uTime*(2.5+6.*r3.x)+r3.y*40.);
  b*=smoothstep(.015,.09,sp.y);
  return tint*b*(1.-smoothstep(rr*.45,rr,a));
}
void main(){
  vec3 d=normalize(vDir); float el=max(d.y,0.);
  float pix=length(fwidth(d));
  vec2 hd=normalize(d.xz+vec2(1e-5,0.)), hs=normalize(uSunDir.xz+vec2(1e-5,0.));
  float sunny=pow(clamp(dot(hd,hs)*.5+.5,0.,1.),2.);
  // overhead, the mid sky, and the warm band low down (gold toward the sun, rose away from it)
  float band=exp(-el*el/max(uBand*uBand,1e-4));
  vec3 c=mix(uZen,uMid,exp(-el*4.2));
  vec3 warm=mix(mix(uFogAway,uRose,.45),uFogSun,sunny);
  warm=mix(warm,mix(mix(uRose,uFogAway,.3)*.62,uFogSun*vec3(1.,.8,.55)*.9,sunny),uDeep);
  c=mix(c,warm,band);
  // the horizon itself is the far air's own colour (what the furthest things go into), the same at every height
  c=mix(c,mix(uFogAway,uFogSun,sunny),exp(-el*el*900.));
  c+=uSunCol*.05*uGlow*sunny*exp(-el*5.)*(1.-.5*band);
  float dk=reach(d), rv=river(d);
  // the river's own faint glow of stars too far to tell apart; in the reach there is none, and the sky's light a
  // thirtieth less (shown, that is a few steps darker: the grade is steep in the darks)
  vec3 dq=d*5.;
  float dust=(.4+.6*smoothstep(.25,.8,un2(dq.xz+dq.y*.7)*.5+un2(dq.zy*2.3+3.)*.3+un2(dq.xy*5.1+7.)*.2))*rv*rv;
  float high=smoothstep(.25,1.,uAdmit);
  c+=vec3(.0022,.003,.0058)*(2.2*dust+.25*un2(dq.zx*1.7+11.))*high*(1.-band)*smoothstep(.03,.2,el)*(1.-dk);
  c*=1.-.03*dk;
  vec3 st=stars(d,30.,.55*uStarK,.0014,pix,2.8,0.);
  st+=stars(d,62.,.55*uStarK,.001,pix,1.7,.1);
  st+=stars(d,118.,.5*uStarK,.0008,pix,1.1,.22);
  st+=stars(d,190.,.5*uStarK,.0006,pix,.75,.34);
  // (no star shows through the moon's disc: the moon stands before them)
  c+=st*(1.-band)*(1.-.6*sunny*exp(-el*4.))*(1.-smoothstep(uMoonD.w-.0005,uMoonD.w+.0005,dot(d,uMoonD.xyz)));
  // the sun's disc and its glare, the same at every height
  float cs=clamp(dot(d,uSunDir),0.,1.);
  c+=uSunCol*(smoothstep(.99965,.9998,cs)*9.+.9*pow(cs,900.)+.2*pow(cs,220.)+uGlow*(.14*pow(cs,60.)+.05*pow(cs,7.)));
  gl_FragColor=vec4(c,1.);
}`;
export function makeUpperSky(ctx, opts = {}) {
  const hour = opts.hour || makeHour('golden'), rs = opts.rng;
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  // the reach's middle: bearing 2, 36.5 degrees up; its chart's right (east) and up
  const C = skyDir(36.5, 2), U = new THREE.Vector3().crossVectors(C, new THREE.Vector3(0, 1, 0)).normalize(), V = new THREE.Vector3().crossVectors(U, C).normalize();
  // the seed deals only its lean, its length and its height, inside the bounds, and the slant of the river of stars
  const lean = rs ? rs.range(-1.5, 1.5) : 0, broad = rs ? rs.range(13, 14.5) : 14, ph = rs ? rs.range(0, 6.28) : 1, off = rs ? rs.range(0, 40) : 3;
  const long = rs ? rs.range(-3, 3) : 0, slant = rs ? rs.range(-5, 5) : 0;
  // the river of stars: a great circle from low in the north-west up over the north to high in the east
  const river = new THREE.Vector3().crossVectors(skyDir(6, -52 + slant), skyDir(64, 78 - slant)).normalize();
  const law = skyLaw(0, hour);
  const uniforms = {
    uTime: { value: 0 }, uStarK: { value: clamp(opts.density ?? 1, 0.7, 1.3) },
    uSunDir: { value: hour.sunDir.clone() }, uSunCol: { value: col(hour.sun, 1.25) },
    uZen: { value: new THREE.Color().setRGB(law.zen[0], law.zen[1], law.zen[2]) }, uMid: { value: new THREE.Color().setRGB(law.mid[0], law.mid[1], law.mid[2]) },
    uBand: { value: Math.sin(law.band * DEG) }, uAdmit: { value: law.admit }, uTw: { value: law.twinkle }, uGlow: { value: law.glow }, uDeep: { value: law.deep },
    uFogSun: { value: col(hour.fogSun) }, uFogAway: { value: col(hour.fogAway) }, uRose: { value: col(hour.rose) },
    uRC: { value: C }, uRU: { value: U }, uRV: { value: V }, uRiver: { value: river },
    uMoonD: { value: new THREE.Vector4(hour.moonDir.x, hour.moonDir.y, hour.moonDir.z, Math.cos(MOON_SIZE * DEG)) },
    uReach: { value: new THREE.Vector4(21 + long, -0.5 + lean, -21 - long, 2.5 - lean) }, uReachB: { value: new THREE.Vector4(broad, broad * 0.74, ph, off) },
  };
  const material = new THREE.ShaderMaterial({ name: 'PeakSky', uniforms, vertexShader: UPPER_VERT, fragmentShader: UPPER_FRAG, depthWrite: false, depthTest: true, side: THREE.BackSide, fog: false });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 5), material);
  mesh.frustumCulled = false; mesh.renderOrder = -2; mesh.name = 'sky';
  const eyeLaw = skyLaw(0, hour);
  return {
    object: mesh, material, uniforms,
    // the one input: the eye's height
    setEye(y) {
      const w = skyLaw(y, hour, eyeLaw);
      uniforms.uZen.value.setRGB(w.zen[0], w.zen[1], w.zen[2]); uniforms.uMid.value.setRGB(w.mid[0], w.mid[1], w.mid[2]);
      uniforms.uBand.value = Math.sin(w.band * DEG); uniforms.uAdmit.value = w.admit; uniforms.uTw.value = w.twinkle; uniforms.uGlow.value = w.glow; uniforms.uDeep.value = w.deep;
    },
    update(dt, time) { uniforms.uTime.value = time; },
  };
}

// ---------------------------------------------------------------- the moon
// ONE LIT SPHERE at one bearing, one height, one size and one strength. Its place, size and strength are given neither the eye's height
// nor a clock (only a cloud standing in the sight line to it dims it): the same pale day moon from the fields and the same white moon from the top. It is lit by this world's own
// sun: the sun's place in the moon's own frame is worked out from the two bodies' bearings and heights (golden hour:
// 128.0 degrees apart, so 0.81 of the disc is lit and the unlit limb lies on the side away from the sun). Its face
// is its own: grey seas, bright uplands with a few rayed pits, round pits of two sizes whose rims catch the light
// along the terminator; the limb is a little darker; a soft glow stands round it. It is added to whatever sky stands
// behind it (so its unlit limb is the sky's colour and the faint light the lit world sends back; the sky's shader
// lets no star through its disc), and only
// what stands in front hides it: cloud and rock. Its card is square on to its own direction (round seen
// straight on; any lens draws a round thing longer toward the edge of its field, this one as all others).
export const MOON_SIZE = 6.5;
// how many puffs of cloud the moon's card is veiled by at once
const VEILS = 24;
const MOON_VERT = /* glsl */`
uniform vec3 uDir, uU, uV; uniform float uSize;
varying vec2 vP;
void main(){
  vP=position.xy*2.4;
  vec3 d=uDir+(uU*vP.x+uV*vP.y)*uSize;
  vec4 p=projectionMatrix*viewMatrix*vec4(d*100.+cameraPosition,1.); if(abs(p.w)<1e-4) p.w=1e-4; gl_Position=p.xyww; }`;
const MOON_FRAG = /* glsl */`
uniform vec3 uLit, uMark, uSunL; uniform vec4 uSeed, uRay[4]; uniform mat3 uSpin; uniform float uK; uniform vec2 uSunV;
uniform vec3 uDir, uU, uV; uniform float uSize; uniform vec4 uVeilA[VEILS]; uniform vec2 uVeilB[VEILS]; uniform int uVeilN;
varying vec2 vP;
// THE MOON STANDS BEHIND EVERY CLOUD. Its card is drawn before all cloud, and the cloud is laid over it; but a
// cloud's thin rim lets a bright thing through nearly whole, and a moon seen sharp through a cloud's rim reads as
// standing before the cloud. So along each sight line to the moon's card the bodies of the puffs that stand in it
// take the moon's light away (a puff's body: within a third of its breadth of its middle, going to nothing at
// half; above its flat base): behind a heap there is no moon, and it sinks into a heap's rim.
float veil(){
  vec3 d=normalize(uDir+(uU*vP.x+uV*vP.y)*uSize); float T=1.;
  for(int i=0;i<VEILS;i++){
    if(i>=uVeilN) break;
    vec4 A=uVeilA[i]; vec3 c=A.xyz-cameraPosition; float t=dot(c,d);
    if(t>0.){ vec3 q=c-d*t; T*=1.-(1.-smoothstep(.34,.52,length(q)/A.w))*smoothstep(uVeilB[i].x-A.w*.1,uVeilB[i].x+A.w*.32,A.y-q.y)*uVeilB[i].y; }
  }
  return T;
}
float mh1(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec3 mh3(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float mn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(mh1(i),mh1(i+vec3(1.,0.,0.)),f.x),mix(mh1(i+vec3(0.,1.,0.)),mh1(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(mh1(i+vec3(0.,0.,1.)),mh1(i+vec3(1.,0.,1.)),f.x),mix(mh1(i+vec3(0.,1.,1.)),mh1(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
float mf3(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*mn3(p); p=p*2.07+vec3(3.1,7.7,5.3); a*=.5; } return s; }
// round pits: balls dealt in the cells of a lattice in the moon's own space; where the sphere cuts one there is a
// round bowl with a raised rim (x = its height, y = 1 on the bowl's floor)
vec2 pits(vec3 q, float n){
  vec3 g=q*n, c=floor(g), r=mh3(c);
  float rad=.13+.17*r.z, d=length(fract(g)-.5-(r-.5)*.3)/rad, live=step(r.x,.5);
  return vec2((-.6*(1.-smoothstep(.45,.95,d))+.5*exp(-(d-1.)*(d-1.)*18.))*rad*live, (1.-smoothstep(.6,.9,d))*live);
}
float ground(vec3 q){ return .2*mf3(q*2.6+uSeed.xyx)+pits(q,3.1).x*1.4+pits(q+3.7,6.7).x; }
void main(){
  float r=length(vP), aa=fwidth(r)*1.5+1e-4;
  float disc=1.-smoothstep(1.-aa,1.,r);
  float mu=sqrt(max(1.-r*r,0.));
  // a point of the sphere in the moon's own space (its face is turned to this world once, by its own stream)
  vec3 q=uSpin*normalize(vec3(vP,mu+1e-4));
  // the grey seas: broad lowlands, darker; the uplands bright
  float sea=smoothstep(.44,.53,mf3(q*1.15+uSeed.yxy));
  float alb=mix(.86,.52,sea)*(.92+.16*mf3(q*4.+7.));
  // the rayed pits of the uplands: from each a bright apron and long thin rays, uneven in number and length
  for(int i=0;i<4;i++){
    vec3 c=uRay[i].xyz; float a=acos(clamp(dot(q,c),-1.,1.)), len=uRay[i].w;
    vec3 e1=normalize(cross(c,vec3(.31,.87,.38))), e2=cross(c,e1);
    vec2 w=normalize(vec2(dot(q,e1),dot(q,e2))+1e-5);
    float ray=smoothstep(.56,.8,mn3(vec3(w*4.5,float(i)*7.3+uSeed.x))*.7+mn3(vec3(w*11.,float(i)*3.1))*.3);
    alb+=(.42*ray*(1.-smoothstep(len*.25,len,a))*smoothstep(.02,.06,a)+.34*exp(-a*a/(.004+.004*len)))*(1.-.4*sea);
  }
  alb=clamp(alb,0.,1.2);
  // relief: the ground's own slopes turned to this world's sun (seen along the terminator, where the light lies low)
  // (the step the slope is read over is never under what one point of the eye's raster covers, so the relief does not speckle)
  vec3 t1=normalize(cross(q,vec3(.2,.9,.4))), t2=cross(q,t1); float e=max(.012,aa*1.2), h0=ground(q);
  vec3 nb=normalize(q-((ground(normalize(q+t1*e))-h0)/e*t1+(ground(normalize(q+t2*e))-h0)/e*t2));
  float nd=dot(nb,uSunL), ns=dot(q,uSunL);
  // a slope's share of the light counts for most where the sun lies low over it
  float lit=smoothstep(-.02,.1,ns)*pow(max(ns,0.),.55)*clamp(1.+.9*(nd-ns)/(max(ns,0.)+.16),.3,1.6);
  // the limb a little darker (a sphere, not a disc)
  vec3 col=mix(uMark,uLit,clamp(alb,0.,1.))*alb*1.12*lit*(.62+.38*pow(mu,.6));
  // the glow round it in the thin air, on its lit side the stronger. The glowing air lies before the moon as well
  // as beside it: the glow goes on over the disc at its rim's strength, so the unlit limb is never darker than the
  // sky beside it (over the disc its sunward lean runs evenly from side to side)
  float out1=max(r-1.,0.), side=.72+.28*dot(vP,uSunV)/max(r,1.);
  float halo=(.11*exp(-out1*5.)+.035*exp(-out1*1.5))*(1.-smoothstep(1.5,2.35,r))*side;
  // the unlit limb: the faint light this lit world sends back to it
  col+=uMark*.034*alb*(1.-lit);
  gl_FragColor=vec4((col*uK*disc+uLit*halo*uK)*veil(),1.);
}`;
export function makeMoon(ctx, opts = {}) {
  const hour = opts.hour || makeHour('golden'), rs = opts.rng;
  const D = hour.moonDir.clone().normalize();
  const U = new THREE.Vector3().crossVectors(D, new THREE.Vector3(0, 1, 0)).normalize(), V = new THREE.Vector3().crossVectors(U, D).normalize();
  const a = rs ? rs.range(0, 6.28) : 0.7;
  const uniforms = {
    uDir: { value: D }, uU: { value: U }, uV: { value: V }, uSize: { value: Math.tan(MOON_SIZE * DEG) },
    uLit: { value: new THREE.Color('#f4f6fb') }, uMark: { value: new THREE.Color('#c9d0e2') }, uSunL: { value: new THREE.Vector3() },
    uSeed: { value: new THREE.Vector4(rs ? rs.range(0, 30) : 3, rs ? rs.range(0, 30) : 9, Math.cos(a), Math.sin(a)) },
    uK: { value: 1.0 * hour.moonK }, uSpin: { value: new THREE.Matrix3() }, uRay: { value: [] }, uSunV: { value: new THREE.Vector2(1, 0) },
    uVeilA: { value: Array.from({ length: VEILS }, () => new THREE.Vector4(0, 0, 0, 1)) }, uVeilB: { value: Array.from({ length: VEILS }, () => new THREE.Vector2(0, 0)) }, uVeilN: { value: 0 },
  };
  // the moon's own space: its face is turned by three angles dealt from its stream (after the stream's older draws)
  const spin = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rs ? rs.range(-0.6, 0.6) : 0.2, rs ? rs.range(0, 6.28) : 1, a));
  uniforms.uSpin.value.setFromMatrix4(spin);
  // THE PHASE, worked out: the sun's direction in the moon's frame (right, up, toward the eye), turned into its own space
  const S = hour.sunDir;
  uniforms.uSunL.value.set(S.dot(U), S.dot(V), -S.dot(D)).normalize();
  uniforms.uSunV.value.set(uniforms.uSunL.value.x, uniforms.uSunL.value.y).normalize();
  uniforms.uSunL.value.applyMatrix4(spin);
  // four rayed pits, dealt on the face turned to this world (never under 35 degrees apart), each with its rays' reach
  const rays = [];
  for (let i = 0, tries = 0; i < 4 && tries < 200; tries++) {
    const th = rs ? rs.range(0, 6.28) : i * 1.7, rr = Math.sqrt(rs ? rs.range(0.02, 0.72) : 0.3 + 0.1 * i), len = rs ? rs.range(0.35, 0.8) : 0.5;
    const c = new THREE.Vector3(Math.cos(th) * rr, Math.sin(th) * rr, Math.sqrt(1 - rr * rr));
    if (rays.some((o) => o.c.angleTo(c) < 35 * DEG)) continue;
    rays.push({ c, len }); i++;
  }
  while (rays.length < 4) rays.push({ c: new THREE.Vector3(0, 0, -1), len: 0.3 });
  uniforms.uRay.value = rays.map((o) => { const c = o.c.clone().applyMatrix4(spin); return new THREE.Vector4(c.x, c.y, c.z, o.len); });
  const material = new THREE.ShaderMaterial({ name: 'PeakMoon', uniforms, vertexShader: MOON_VERT, fragmentShader: MOON_FRAG, defines: { VEILS }, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false; mesh.renderOrder = -0.5; mesh.name = 'moon';
  // which cloud stands in the sight lines to the moon's card from where the eye is: of the crown's puffs (opts.veil,
  // as they stand) and the small travelling clouds (opts.clouds: where each is now, and its half breadth), the
  // VEILS whose bodies reach furthest over the card
  const veil = opts.veil || null, small = opts.clouds || null, cone = Math.tan(MOON_SIZE * 2.4 * DEG), key = new Float32Array(VEILS), slot = new Float32Array(VEILS * 6);
  const offer = (x, y, z, size, base, fade, eye) => {
    const cx = x - eye.x, cy = y - eye.y, cz = z - eye.z, t = cx * D.x + cy * D.y + cz * D.z;
    if (t <= 0 || fade <= 0) return;
    const reach = (0.52 * size - hyp3(cx - D.x * t, cy - D.y * t, cz - D.z * t)) / t + cone;
    if (reach <= 0) return;
    let n = uniforms.uVeilN.value, j = n < VEILS ? n : -1;
    if (j < 0) { j = 0; for (let i = 1; i < VEILS; i++) if (key[i] < key[j]) j = i; if (key[j] >= reach) return; } else uniforms.uVeilN.value = n + 1;
    key[j] = reach; const o = j * 6; slot[o] = x; slot[o + 1] = y; slot[o + 2] = z; slot[o + 3] = size; slot[o + 4] = base; slot[o + 5] = fade;
  };
  const update = (eye) => {
    uniforms.uVeilN.value = 0;
    if (veil) for (let k = 0; k < veil.length; k += 6) offer(veil[k], veil[k + 1], veil[k + 2], veil[k + 3], veil[k + 4], veil[k + 5], eye);
    if (small) for (const c of small) if (c.w > 0) offer(c.x, c.y, c.z, c.w * 1.4, -1e6, 1, eye);
    for (let i = 0; i < uniforms.uVeilN.value; i++) { uniforms.uVeilA.value[i].set(slot[i * 6], slot[i * 6 + 1], slot[i * 6 + 2], slot[i * 6 + 3]); uniforms.uVeilB.value[i].set(slot[i * 6 + 4], slot[i * 6 + 5]); }
  };
  return { object: mesh, material, uniforms, direction: D, lit: 0.5 * (1 - S.dot(D)), update };
}

// ---------------------------------------------------------------- the shelf's stone shapes: where they stand
// Rules (the same for every shape, no place named). A shape is a wind-shaped form: its long axis lies along the wind
// (within a few degrees), its blunt undercut nose to windward, its long back falling away to the lee, and it leans
// downwind. It stands on the shelf's level, off the mountain's skirt and off the terraces. NO FLANK of any shape
// (its plan outline at the foot and its leaning head) comes within 45 m of the route's line; four to seven stand
// with their flanks 45 to 80 m from it, dealt along the line's stretch over the shelf at uneven metres, on either
// side as the draw falls and the shelf leaves room, never two abreast across the line; the others stand further off:
// some as a partner of one that stands already (flank to flank 25 to 40 m: pairs, a loose three), the rest loose,
// each where the shelf is emptiest among a handful of draws; flank to flank never under 25 m.
export const WIND_BEAR = 110;
export const SHAPE_H = [0.85, 1, 0.7];
// (pause: the build's own yield, asked between deals; it draws nothing)
export async function placeShapes(rs, land, path, family, pause = null) {
  const P = PLACE, p = new THREE.Vector3(), t = new THREE.Vector3(), line = [], out = [];
  let s0 = -1, s1 = -1;
  for (let d = 0; d <= path.length; d += 2) { path.posAtDist(d, p); if (p.y > 90) break; if (land.shelfSd(p.x, p.z) < 0) { if (s0 < 0) s0 = d; s1 = d; } }
  for (let d = Math.max(0, s0 - 160); d <= s1 + 160; d += 3) { path.posAtDist(d, p); path.tangentAtDist(d, t); const l = hyp(t.x, t.z) || 1; line.push([p.x, p.z, t.x / l, t.z / l, d]); }
  // how far a point of the land lies from the line, on which side (+1 = left of the heading) and at which metre
  // (the search runs on squared metres over two flat rows: it is asked some hundred thousand times in a deal)
  const LX = Float64Array.from(line, (g) => g[0]), LZ = Float64Array.from(line, (g) => g[1]), LN = line.length;
  // (THRIFT, the same answer: the line's points are kept in runs of eight with each run's box in the plan; a run
  // whose box lies further off than the nearest of the runs' middle points cannot hold the nearest point, and is
  // not searched; the runs that are searched are searched in the line's own order, as the whole line was)
  const LB = 8, NBK = Math.ceil(LN / LB), BX0 = new Float64Array(NBK).fill(1e18), BX1 = new Float64Array(NBK).fill(-1e18), BZ0 = new Float64Array(NBK).fill(1e18), BZ1 = new Float64Array(NBK).fill(-1e18);
  for (let i = 0; i < LN; i++) { const b = (i / LB) | 0; BX0[b] = Math.min(BX0[b], LX[i]); BX1[b] = Math.max(BX1[b], LX[i]); BZ0[b] = Math.min(BZ0[b], LZ[i]); BZ1[b] = Math.max(BZ1[b], LZ[i]); }
  const lineIdx = (x, z) => {
    let ub = 1e18;
    for (let i = LB >> 1; i < LN; i += LB) { const dx = x - LX[i], dz = z - LZ[i], q = dx * dx + dz * dz; if (q < ub) ub = q; }
    let best = 1e18, bi = 0;
    for (let b = 0; b < NBK; b++) {
      const ex = x < BX0[b] ? BX0[b] - x : x > BX1[b] ? x - BX1[b] : 0, ez = z < BZ0[b] ? BZ0[b] - z : z > BZ1[b] ? z - BZ1[b] : 0;
      if (ex * ex + ez * ez > ub) continue;
      for (let i = b * LB, e = Math.min(LN, i + LB); i < e; i++) { const dx = x - LX[i], dz = z - LZ[i], q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
    }
    return bi;
  };
  const lineD = (x, z) => { const bi = lineIdx(x, z); return hyp(x - LX[bi], z - LZ[bi]); };
  const lineAt = (x, z) => { const bi = lineIdx(x, z), g = line[bi]; return { d: hyp(x - g[0], z - g[1]), side: (g[3] * (x - g[0]) - g[2] * (z - g[1])) > 0 ? 1 : -1, s: g[4] }; };
  const leanDeg = rs.range(11, 17);
  const draw = (near, r = rs) => {
    const kind = r.chance(0.62) ? family : r.int(0, 2), wb = (WIND_BEAR + r.range(-9, 9)) * DEG, la = Math.tan((clamp(leanDeg + r.range(-3, 3), 8, 20)) * DEG);
    // three families of one kin: rounded and hollowed; tall leaning; low and long
    const h = kind === 1 ? r.range(37, 46) : kind === 2 ? r.range(26, 30) : r.range(28, 38);
    const across = kind === 1 ? r.range(14, 19) : kind === 2 ? r.range(20, 27) : r.range(18, 26);
    const R = across * 0.5 * (near ? 1 : 0.86), aw = R * r.range(0.75, 0.95), al = Math.min(50 - aw, R * (kind === 2 ? r.range(1.9, 2.5) : r.range(1.3, 1.9)));
    return { kind, h: near ? h : Math.max(26, h * 0.86), R, aw, al, wx: Math.sin(wb), wz: -Math.cos(wb), leanX: Math.sin(wb) * la, leanZ: -Math.cos(wb) * la, near, x: 0, z: 0, base: 0, flank: 0, side: 0, s: 0, seed: r.range(0, 100) };
  };
  // the plan outline of a shape at its foot, and its leaning head: the points its flank is measured at
  const outline = (c) => {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, ca = Math.cos(a), sa = Math.sin(a), ax = ca > 0 ? c.al : c.aw, r = 1.06 / Math.sqrt((ca / ax) ** 2 + (sa / c.R) ** 2); pts.push([c.x + (c.wx * ca - c.wz * sa) * r, c.z + (c.wz * ca + c.wx * sa) * r]); }
    const hx = c.x + c.leanX * c.h, hz = c.z + c.leanZ * c.h;
    pts.push([hx, hz], [hx + c.wx * c.R * 0.7, hz + c.wz * c.R * 0.7], [hx - c.wz * c.R * 0.6, hz + c.wx * c.R * 0.6], [hx + c.wz * c.R * 0.6, hz - c.wx * c.R * 0.6]);
    return pts;
  };
  // on the shelf's level (its whole foot), with the mountain's skin (at the shelf's height) clear of it
  const skinClear = (x, z) => { const lx = x - P.AX, lz = z - P.AZ, r = hyp(lx, lz); return r > 235 || land.skinR(Math.atan2(lx, -lz) / DEG, P.SHELF + 3) < r - 4; };
  const stands = (c) => { for (const q of c.pts.slice(0, 10)) if (land.shelfSd(q[0], q[1]) > -5 || q[1] < -238 || !skinClear(q[0], q[1])) return false; return true; };
  const measure = (c) => { c.pts = outline(c); let f = 1e9; for (const q of c.pts) f = Math.min(f, lineD(q[0], q[1])); const a = lineAt(c.x, c.z); c.flank = f; c.side = a.side; c.s = a.s; return c; };
  const gap = (c, o) => { let g = 1e18, qa = null, ra = null; for (const q of c.pts) for (const r of o.pts) { const dx = q[0] - r[0], dz = q[1] - r[1], w = dx * dx + dz * dz; if (w < g) { g = w; qa = q; ra = r; } } return qa ? hyp(qa[0] - ra[0], qa[1] - ra[1]) : 1e9; };
  const gapTo = (c, list = out) => { let g = 1e9; for (const o of list) g = Math.min(g, gap(c, o)); return g; };
  // the near ones, dealt along the line; a deal that leaves a slot empty is dealt again (up to 16 deals, the fullest kept)
  const nNear = rs.int(5, 7);
  const deal = () => {
    const got = [];
    for (let i = 0; i < nNear; i++) {
      for (let k = 0; k < 40; k++) {
        const c = draw(true), s = lerp(s0 - 10, s1 + 10, (i + rs.range(0.05, 0.95)) / nNear), side = rs.sign();
        path.posAtDist(s, p); path.tangentAtDist(s, t); const l = hyp(t.x, t.z) || 1, off = rs.range(52, 96);
        c.x = p.x + (t.z / l) * side * off; c.z = p.z - (t.x / l) * side * off;
        measure(c);
        if (c.flank < 45 || c.flank > 80 || !stands(c)) continue;
        if (got.some((o) => gap(c, o) < 25 || (o.side !== c.side && Math.abs(o.s - c.s) < 25))) continue;
        got.push(c); break;
      }
    }
    return got;
  };
  let near = [];
  for (let k = 0; k < 16 && near.length < nNear; k++) { const got = deal(); if (got.length > near.length) near = got; if (pause) await pause(); }
  // (FOUR AT THE LEAST: where fewer than four stand after sixty such draws, they go on until four do, to 2000 more;
  // where four stand already no draw is added.)
  for (let k = 0; (k < 60 && near.length < nNear) || (k < 2060 && near.length < 4); k++) {
    const c = draw(true), s = rs.range(s0 - 10, s1 + 10), side = rs.sign();
    path.posAtDist(s, p); path.tangentAtDist(s, t); const l = hyp(t.x, t.z) || 1, off = rs.range(52, 96);
    c.x = p.x + (t.z / l) * side * off; c.z = p.z - (t.x / l) * side * off;
    measure(c);
    if (c.flank < 45 || c.flank > 80 || !stands(c) || near.some((o) => gap(c, o) < 25 || (o.side !== c.side && Math.abs(o.s - c.s) < 25))) continue;
    near.push(c);
  }
  out.push(...near);
  // the others: partners first, then the loose ones, each where the shelf is emptiest among a handful of draws
  const B = SHELF;
  for (let k = 0, tries = 0; k < 3 && out.length < 14 && tries < 500; tries++) {
    const c = draw(false), o = out[rs.int(0, out.length - 1)], a = rs.range(0, TAU), g = o.R + c.R + rs.range(30, 52);
    c.x = o.x + Math.sin(a) * g; c.z = o.z + Math.cos(a) * g;
    measure(c);
    const gp = gapTo(c);
    if (pause && tries % 60 === 59) await pause();
    if (c.flank < 82 || gp < 25 || gp > 40 || !stands(c)) continue;
    out.push(c); k++;
  }
  for (let tries = 0; out.length < 14 && tries < 70; tries++) {
    let best = null, bg = 0;
    for (let k = 0; k < 40; k++) {
      const c = draw(false);
      c.x = rs.range(B.lobes[1].cx - B.lobes[1].hx, B.cx + B.hx); c.z = rs.range(B.cz - B.hz, B.lobes[1].cz + B.lobes[1].hz);
      measure(c);
      if (c.flank < 82 || !stands(c)) continue;
      const g = gapTo(c) * rs.range(0.8, 1);
      if (g > bg) { bg = g; best = c; }
    }
    if (best && gapTo(best) >= 25) out.push(best);
    if (pause && tries % 2 === 1) await pause();
  }
  // (a form's height by its family, set when all stand: the blade keeps its dealt height, the fin stands at
  // eighty-five in a hundred of it and the long back at seven tenths, so that a back is longer than it is high)
  for (const c of out) { c.base = land.height(c.x, c.z); c.h *= SHAPE_H[c.kind]; }
  return out;
}

// ---------------------------------------------------------------- the lone tors of the far land
// Kin of the shelf's shapes (the same stone, the same wind-shaped build), standing alone out in the fair land: four
// to six, each on a bearing of its own sector, 820 to 1450 m from the axis (under the ring of open air), none
// within 320 m of another (never a row, never a range) nor within 150 m of the river, old or far.
export function placeTors(rs, land) {
  const P = PLACE, out = [], n = rs.int(4, 6), b0 = rs.range(0, 360);
  for (let i = 0; i < n; i++) for (let k = 0; k < 30; k++) {
    const bear = (b0 + (i + rs.range(0.1, 0.9)) * 360 / n) * DEG, r = rs.range(820, 1450), x = P.AX + Math.sin(bear) * r, z = P.AZ - Math.cos(bear) * r;
    const kind = rs.int(0, 2), wb = (WIND_BEAR + rs.range(-9, 9)) * DEG, la = Math.tan(rs.range(9, 18) * DEG);
    const h = kind === 1 ? rs.range(40, 52) : kind === 2 ? rs.range(28, 34) : rs.range(32, 42), R = (kind === 1 ? rs.range(15, 20) : kind === 2 ? rs.range(21, 28) : rs.range(19, 27)) * 0.5;
    const aw = R * rs.range(0.75, 0.95), al = R * (kind === 2 ? rs.range(1.9, 2.5) : rs.range(1.3, 1.9)), seed = rs.range(0, 100);
    // A TOR IS A LOW BACK OF STONE: half its own drawn height, and never taller than 0.95 of its breadth 2R (a slim
    // upright seen from afar would read as a made thing). A fin's body is thinner than 2R across the wind, so seen
    // end on a fin can still stand up to one and a half times as tall as it is broad there. (A blade's drawn height
    // never counts now, the breadth's bound being lower: the draw stays so that the stream's order stands.)
    const low = Math.min(h * 0.5, 2 * R * 0.95);
    if (farRiverD(x, z) < 150 || land.riverAt(x, z).d < 150 || out.some((o) => hyp(o.x - x, o.z - z) < 320)) continue;
    out.push({ kind, h: low, R, aw, al, wx: Math.sin(wb), wz: -Math.cos(wb), leanX: Math.sin(wb) * la, leanZ: -Math.cos(wb) * la, near: false, x, z, base: land.height(x, z), flank: r, side: 0, s: 0, seed });
    break;
  }
  return out;
}

// ---------------------------------------------------------------- the stone shapes' bodies
// THE KINSHIP IS THE WIND'S (every one of them, by rule): each is A FIN of wind-cut stone lying along the wind, built
// like a boat's hull turned over. Its plan is a long drop drawn out along the wind, broadest a third of the way
// back from the prow and thin across; its crest is ONE LINE, a keel: up the prow (cut in low down, its brow
// overhanging) to the fin's one highest place near the windward end, then one long back, level-shouldered and
// curving over and down to the tail at the slab; its two flanks go up from the skirt, full below and drawing in
// to that keel like a pointed arch;
// the whole leans downwind; flutes run along the flanks, rising a little toward the lee; one or two shallow scoops
// lie in the flanks; the foot spreads into a skirt that grows out of the slab. No form has a knob, a neck, a
// second summit or a swelling. What differs is dealt: the family (a fin, a tall thin leaning blade, a low long
// back), the height and length, how thin, how the back runs, how deep the prow is cut, the scoops, the flutes'
// spacing. One skin each; the breadth across the wind by height is the breadth the shadow on the land is cut from.
// The near ones get the finer skin.
export async function buildShapes(ctx, list, opts = {}) {
  const { rng: rs, noise, light, rock } = opts;
  const pos = [], dress = [], idx = [];
  let n = 0;
  for (const c of list) {
    const nu = opts.cols || (c.near ? 46 : 26), nv = opts.rows || (c.near ? 46 : 24), v0 = pos.length / 3;
    // how thin across the wind (a share of the plan's own half breadth); how the back runs (the higher, the longer
    // it stays near the crest's height before it comes down to the tail)
    const thin = c.kind === 1 ? rs.range(0.8, 0.95) : c.kind === 2 ? rs.range(0.62, 0.74) : rs.range(0.52, 0.64);
    const backP = c.kind === 1 ? rs.range(1.3, 1.6) : c.kind === 2 ? rs.range(1.9, 2.5) : rs.range(1.5, 2.0);
    // the prow: how deep it is cut in and at what height; how far its brow overhangs
    const cut = rs.range(0.3, 0.45), cutAt = rs.range(0.1, 0.16), over = rs.range(0.12, 0.26);
    // one or two scoops in the flanks: which flank, how far along, how high, how broad and how deep
    const dents = [], nd = rs.int(1, 2);
    for (let i = 0; i < nd; i++) dents.push({ side: rs.sign(), t: rs.range(0.3, 0.75), v: rs.range(0.2, 0.55), st: rs.range(0.1, 0.18), sv: rs.range(0.12, 0.2), k: rs.range(0.12, 0.22) });
    const o = c.seed, flute = rs.range(5, 7.5), fluteK = rs.range(0.12, 0.2), sweep = rs.range(0.45, 0.7), fo = rs.range(0, 9);
    const len = c.aw + c.al, tp = (c.aw + 0.1 * c.al) / len;
    c.T = c.R * thin;
    for (let i = 0; i <= nu; i++) {
      // along the wind, from the prow's toe to the tail's tip (more stations toward the two ends)
      const t = 0.5 - 0.5 * Math.cos(Math.PI * i / nu), xi = -c.aw + len * t;
      // the keel's height there, and the plan's half breadth
      const H = Math.max(0.6, c.h * (t < tp ? Math.pow(sstep(0, 1, t / tp), 0.55) : 1 - Math.pow((t - tp) / (1 - tp), backP)));
      const W = c.T * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 0.7) + 0.3;
      const prow = 1 - sstep(tp * 0.6, tp * 1.6, t);
      for (let j = 0; j <= nv; j++) {
        // over the fin from one flank's foot (3 m under the slab) by the keel to the other's
        const sgn = j < nv / 2 ? -1 : 1, e = Math.abs(2 * j / nv - 1), yk = Math.pow(1 - Math.pow(e, 1.4), 0.8), y = -3 + (H + 3) * yk, k = clamp(y / c.h, 0, 1), kh = clamp(y / H, 0, 1);
        const skirt = 1 + 0.3 * Math.pow(1 - sstep(0, 0.1, kh), 2);
        let f = 1 + 0.1 * noise.n3(t * 3.1 + o, k * 2.2 + o, sgn * 1.7) + 0.03 * noise.n3(t * 9.3, k * 6 + o, sgn * 3.3 + o), deep = 0;
        for (const d of dents) if (d.side === sgn) { const da = (t - d.t) / d.st, dv = (kh - d.v) / d.sv, g = d.k * Math.exp(-da * da - dv * dv); f -= g; deep += g; }
        // flutes along the flanks: grooves a few metres apart, rising toward the lee, lost at the foot and the keel
        const fl = Math.pow(0.5 + 0.5 * Math.cos(TAU * (y - sweep * xi + 1.4 * noise.n2(t * 2.2 + o, y * 0.05)) / flute + fo), 3);
        const flank = sstep(0.06, 0.16, kh) * (1 - sstep(0.75, 0.95, kh));
        f -= fluteK * fl * flank;
        const lat = sgn * W * e * skirt * Math.max(f, 0.4);
        // the prow is cut in low down and its brow stands out above
        const along = xi + c.aw * prow * (cut * Math.exp(-Math.pow((k - cutAt) / 0.09, 2)) - over * sstep(0.18, 0.5, k) * (1 - sstep(0.75, 1, kh)));
        const lean = Math.max(y, 0);
        pos.push(c.x + c.leanX * lean + c.wx * along - c.wz * lat, c.base + y, c.z + c.leanZ * lean + c.wz * along + c.wx * lat);
        // how much sky a point of the skin sees: less in a scoop, in a flute, under the prow's brow and at the foot
        const under = prow * Math.exp(-Math.pow((k - cutAt) / 0.1, 2));
        dress.push(0, 1, clamp(1 - 0.9 * deep - 0.3 * fl * flank - 0.45 * under, 0.3, 1) * (0.5 + 0.5 * sstep(0, 6, y)));
      }
    }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = v0 + i * (nv + 1) + j, b = a + 1, d = a + nv + 1, e = d + 1;
      idx.push(a, b, d, b, e, d);
    }
    // (the shelf's shapes hand their shadows to the light all shaders share; the far tors' shadows are the ground's own)
    if (opts.shadows !== false && n < MAX_SHAPES) {
      light.uniforms.uShape.value[n].set(c.x, c.z, c.T, c.h);
      light.uniforms.uShapeB.value[n].set(c.base, c.leanX, c.leanZ, c.al);
      n++;
    }
    await ctx.yield();
  }
  if (opts.shadows !== false) light.uniforms.uShapeN.value = n;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aDress', new THREE.Float32BufferAttribute(dress, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, rock);
  mesh.name = opts.name || 'stone shapes';
  return { object: mesh, triangles: idx.length / 3, count: n };
}
