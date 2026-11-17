// HERO SET PIECE for "lake-comes-down-in-curls" (after Leonardo da Vinci): THE LAKE LETS GO.
// A leaning bedded dam with a joint-bounded V notch, the high lake behind it, the fall as a column of
// plaited bundles of combed strands, the ROSETTE pool (great and lesser curls winding to hooked scrolls,
// bubble rings round a boil), strand volutes at the fall's foot, plug beds that slide from the notch
// and fall, and the BORE (the river's water heaped up, combed, its crest a row of scrolls). Oil glazes over brown underpaint: all light is
// computed in the materials (no lights, no shadow, no fog), colours are exact under post.flat.
//
// EXPORTS FOR THE WORLD (shade everything with these, so the hero is not pasted in):
//   PALETTE, PAL             the seven pigments and their indices
//   makeStyle(hexes)         ONE uniform set PER BUILD (uPal[7], uFloor, uLight, uDipN, uTime, uAir, uHour); spread it
//                            into any ShaderMaterial's uniforms ({ ...S, mine }) and it follows along. Nothing at module
//                            level is shared between two builds. uHour: x ochre fullness (late gold), y rank value (dusk)
//   STYLE_GLSL               fragment chunk: lcTone, lcGlaze, lcBeds, lcRock, lcAir (the air law), lcN2, lcH
//   glazeMaterial(S,o)       rock / earth / leaf solid (o.tint + o.tintAmt 1 for leaves, o.vertexColors; o.ledge and
//                            o.ledgeFine 0..1: how strongly the glaze draws the great beds and their partings as ledges;
//                            o.dark under 1: the mass stands in half tone; o.moss 0..1: moss along all its ledge tops)
//   contourShellMaterial(S,o) the lost contour: the same mesh pushed o.push (0.022) x view distance, depth write off,
//                            renderOrder 5 or 6; alpha runs from 0 at the pushed rim to 1 over the solid's own edge,
//                            worked out from the form's radius (o.rad, or a per-vertex aRad with o.radAttr)
//   strandMaterial(S,kind,o), strandGeometry(segs,attrs,count)   the strand rule for all drawn water, spray, rain
//                            (o.turn: rad/s, the coil turns steadily on the world's clock (its long axis goes round); o.minW: the least
//                            half width of a strand as a share of its distance (0.0011: two pixels);
//                            o.bend: the stem is an open arc; o.ang: the stem's share of the segments, the scroll's
//                            then finest on its outer winding; o.far: how pale
//                            a strand is when its light lines are finer than pixels; o.farLit: far off the outer strands are whole
//                            pale strokes; o.airK: the strand's share of the green air; o.slide: a 'fall' that keeps to the ground;
//                            uniforms uSize (a whole lock's scale), uLit (the strength of its light lines), uPaleB (how pale the
//                            strand's own body), uTin (how far along it comes to full width) may be driven by the owner)
//   waterMaterial(S,o)       water surface: level tone by the eye's distance and angle (dark olive umber looked down into, paling
//                            to the sky's low band o.band far off), streaming lanes from uBoilW, soft dimples; uRimW (x, z, radius,
//                            strength) darkens a round pool under its banks, uOutW (x, z, radius) spares the place where it runs out;
//                            the hero returns poolMaterial for water that leaves the pool (a river);  setStyleYaw(S, yaw)
//   post for the world: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }
//   No inverse tone map anywhere: THREE.Color(hex) values are written straight out. No textures are made.
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail 0.6..1, opts.inWorld (true: the object is already in
//   WORLD coordinates, pool centre at (10,0,340), anchors in world space; false: viewer frame, front to +Z),
//   opts.greatCurls 5..9, opts.hand +1|-1, opts.twin, opts.progress, opts.bore, opts.poolRadius, opts.apron,
//   opts.style (the world's makeStyle(); the hero makes its own without it), opts.band (the sky's low band, for the water),
//   opts.way (flat xyz of the route's points every 0.5 m near the fall, world coordinates: the volutes are shortened at build to stand 3 m clear of it).
// Returns { object, radius, height, center, anchors, bore, setProgress(u), setBore(a), setTwin(a), update, dispose,
//   hand, greatCurls, twin, style }. setTwin(0..1): the rare parting of the fall into two braids, with the second rosette. setProgress(u) takes the WORLD's u every frame: notch, fall and rosette grow over
//   u 0.10..0.34 (the rosette leads: whole by u 0.27), the three beds let go in anchors.bedWindows (the house-sized one over
//   opts.bedWindow, by default u 0.385..0.455: from the notch's far flank, down beside the column and into the pool);
//   ambient motion runs on the world clock. hero.bore is a Group in the object's frame (local +Z its way,
//   60 m wide): the world moves and turns it down the river and calls setBore(0..1, width in metres, heap 0..1: where
//   the river narrows the back is shorter and darker and nine of the crest's fourteen ringlets stand, a little taller; run 0..1: the
//   length of its five tails, 13 to 18 m while it turns out of the cleft, 36 to 51 m of combed strands on the straight river).
// ANCHORS (same frame as the object): poolCentre, boil, fallFoot, notchLip, lakeLevel (y), damFace { point,
//   normal }, flyThrough (six points of the brief's line from the lip to the outflow, >= 7 m clear of the
//   column; the spray volutes are kept 3 m or more from the way itself BY PLACE AT BUILD when opts.way is given: the least distance
//   of any strand at any phase is 3.18 m over seeds 1 to 200, proved by shots/lake-comes-down-in-curls/fix5/clear.mjs), viewpoints { reveal, closest, skim }, lookAt { column, flower }, greatCurls
//   [{ centre, radius, reach }], bedWindows, boreRun (three points down the ravine), portalSeat { position,
//   facing } (the gap at world (-74,12,690): outside the piece, given for convenience).
// SIZE: dam 190 m long, 105 m high, crest x = 85 W; rosette reach about 75 m from the boil; true radius 115 m
//   (the reported radius 55 only brings the viewer closer). COST: about 145k triangles, 17 draw calls, 7
//   programs, build 160 to 270 ms in yielded steps, no lights, no textures. EXPECTS AROUND IT: gorge walls
//   meeting the dam's two ends (they curl back 46 m), banks round the pool (the disc is 112 m in radius),
//   the far ranks and the sky. Never seen from behind the dam (x > 85 W).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

// The seven pigments, in the brief's order.
export const PALETTE = ['#1F150D', '#6B4E2E', '#B08A55', '#47563A', '#587C8E', '#A9BFC8', '#E4DDC3'];
export const PAL = { UMBER: 0, RAW: 1, OCHRE: 2, OLIVE: 3, AZUR: 4, PALE: 5, WHITE: 6 };
const DIP = 28 * Math.PI / 180, LIGHT_EL = 55 * Math.PI / 180;

// The style's uniforms: makeStyle() gives ONE set PER BUILD (never shared between two builds of the world),
// referenced by every material the factories below make for that build, so the whole world is shaded by
// one routine. World-space vectors. uLight: toward the light (55 deg up, from behind the entry (-Z) and
// a little to port (+X)). uDipN: normal of the beds (they dip 28 deg down toward -X). uHour: x = how
// full the ochre lights are (0 noon grey, 1 late gold), y = the value of the blue ranks (1, lower at dusk).
export function makeStyle(hexes = PALETTE) {
  const S = {
    uPal: { value: PALETTE.map((h, i) => new THREE.Color(hexes[i] || h)) },
    uFloor: { value: new THREE.Color('#2A1D12') },          // the raised umber floor of every shadow
    uLight: { value: new THREE.Vector3() },
    uDipN: { value: new THREE.Vector3() },
    uTime: { value: 0 },                                    // world clock (ambient loops only)
    uAir: { value: 1 },                                     // 1 = full air law; the viewer may lower it
    uHour: { value: new THREE.Vector2(0, 1) },
  };
  setStyleYaw(S, 0);
  return S;
}
// Rotate the style's world vectors about Y (the set-piece viewer shows the hero turned a quarter).
export function setStyleYaw(S, yaw) {
  const c = Math.cos(LIGHT_EL), e = new THREE.Euler(0, yaw, 0);
  S.uLight.value.set(0.18 * c, Math.sin(LIGHT_EL), -0.98 * c).normalize().applyEuler(e);
  S.uDipN.value.set(-Math.sin(DIP), Math.cos(DIP), 0).applyEuler(e);
}

// STYLE_GLSL: paste into any fragment shader (declares the shared uniforms itself).
//   lcTone(n)        the one light: smoothstep(-0.6,1,N.L) on a smooth world normal, in five soft steps
//   lcGlaze(c,tone)  mix(umber floor, local colour, tone): every shadow the same warm brown
//   lcBeds(wp)       soft value bands of the bedding at world point wp (-1..1), all dipping one way
//   lcRock(wp,n,occ,moss[,led])  the full rock glaze: raw umber half tone, ochre lights, olive moss, and the
//                    bedding as ledges per pixel (led.x the 4.4 m beds, led.y their partings in four and again in four, near; default 1,1)
//   lcRockD(wp,n,occ,moss,led,deep)  the same for a mass in half tone: deep.x scales its faces' tone, deep.y (0..1) lets the ledge
//                    tops that show carry small full ochre lights, moss lie whole along some of them and the joints cut deeper
//   lcAirK(c,wp,gk)  the same with the green ground's share gk (water and its light lines lose their contrast more slowly than rock: gk under 1)
//   lcAir(c,wp)      the air law by true view distance and height (brown to 60 m; from there olive gone grey at half
//                    contrast, two thirds of the way by 160 m; azurite from 220 m on, paler at the feet, paler rank by rank)
//   lcN2(p), lcH(p)  value noise and hash
export const STYLE_GLSL = /* glsl */`
uniform vec3 uPal[7]; uniform vec3 uFloor; uniform vec3 uLight; uniform vec3 uDipN; uniform float uTime; uniform float uAir; uniform vec2 uHour;
float lcH(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float lcN2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(lcH(i),lcH(i+vec2(1.,0.)),f.x), mix(lcH(i+vec2(0.,1.)),lcH(i+vec2(1.,1.)),f.x), f.y); }
float lcFull=0.;      // a material may set it (0..1) before lcRockD: at 1 every bed of the mass carries its ledge light, thin beds too, and a wall that leans out over us keeps them (the two walls of the last straight)
float lcBare=0.;      // a bare thing (a root): no bed, parting or joint is ruled on it; it keeps only the form's tone
float lcSoft=0.;      // a wall sets it before lcRockD: its form turns from half tone to umber in one soft turning, with no step of value to read as a crease
float lcGreat=1., lcTopX=0., lcUndX=0.;      // a crag's blade (the glaze material's uBlade) sets them before lcRockD: lcGreat 0 takes the ruled great ledges and far bands off it (they go round a form like hoops), lcTopX / lcUndX are its own few partings' lit top and undercut
float lcSteps(float t){ float q=clamp(t,0.,1.)*5.; return (floor(q)+smoothstep(.12,.88,fract(q)))/5.; }
float lcTone(vec3 n){ return lcSteps(smoothstep(-.6,1.,dot(n,uLight))); }
vec3 lcGlaze(vec3 c,float tone){ return mix(uFloor,c,clamp(tone,0.,1.)); }
float lcBeds(vec3 wp){ float b=dot(wp,uDipN);
  float w=lcN2(vec2(b*.35,dot(wp.xz,vec2(.021,.017))))*2.-1.;
  float s=sin(b*1.55+w*1.3)*.55+sin(b*.47+1.7)*.45;
  float fine=sin(b*6.3+w*2.)*.35, fine2=sin(b*23.+w*5.)*.2;
  float fw=fwidth(b); fine*=1.-smoothstep(.12,.45,fw); fine2*=1.-smoothstep(.03,.12,fw); s*=1.-smoothstep(.6,2.2,fw);
  return clamp(s+fine+fine2,-1.,1.); }
vec3 lcAirK(vec3 c,vec3 wp,float gk){
  float d=distance(wp,cameraPosition);
  float de=d*(1.+(1.-smoothstep(0.,80.+d*.11,wp.y))*smoothstep(200.,700.,d));   // the air doubles at a far thing's feet
  float lum=dot(c,vec3(.3,.5,.2));
  // the green ground, from 60 m: olive gone grey in the air, its value pulled half way to the mean (half the contrast of
  // the near rock), a quarter of the local hue kept so a far light is a dull olive-ochre and never full ochre
  float v=mix(.11,lum,.5);
  vec3 og=mix(uPal[3],uPal[5],.22);
  vec3 g=mix(og*(v/.166),c*(v/max(lum,.012)),.16);
  c=mix(c,g,(1.-exp(-max(d-60.,0.)/95.))*uAir*gk);
  vec3 bl=uPal[4]*(.8+lum*1.2)*uHour.y;
  c=mix(c,bl,smoothstep(220.,900.,de)*uAir);
  c=mix(c,uPal[5]*mix(1.,uHour.y,.6),smoothstep(900.,6500.,de)*.86*uAir);
  c=mix(c,uPal[5]*mix(1.,uHour.y,.6),(1.-smoothstep(0.,50.+d*.1,wp.y))*smoothstep(350.,1100.,d)*.6*uAir);      // far things stand on pale air: the foot of a far pinnacle, the far land under the ranks
  return c; }
vec3 lcAir(vec3 c,vec3 wp){ return lcAirK(c,wp,1.); }
// The bedding as LEDGES, per pixel, on any face that crosses the beds: every bed boundary (one bed is 4.4 m of b,
// the same rule the land, the cave and the pinnacles step their geometry by) has a lit top just above it and an
// undercut just under it; within 40 m or so each bed parts again into four. x lit top, y undercut, z the bed's own value.
vec3 lcLedge1(float q,float fw,float wide){
  float c=floor(q), f=q-c, h0=fract(c*.618034+.31), h1=fract((c+1.)*.618034+.31);
  float wt=mix(.06,.2,h0)*wide, wu=mix(.1,.3,h1);
  float top=1.-smoothstep(wt*.25-fw,wt*1.2+fw,f), und=smoothstep(1.-wu*1.15-fw,1.-wu*.25+fw,f);
  float fade=1.-smoothstep(.07,.22,fw);                                     // a bed thinner than a few pixels is not ruled: it is left to the form
  return vec3(top*mix(.25+.75*h0*h0,.6+.4*h0,lcFull),und*mix(.3+.7*h1,.7+.3*h1,lcFull),h0-.5)*fade; }             // thick beds step out, thin ones barely (the land's own rule): ledges come in groups
vec3 lcRockD(vec3 wp,vec3 n,float occ,float moss,vec2 led,vec2 deep){
  float nd=distance(wp,cameraPosition);
  float nearK=1.-smoothstep(60.,170.,nd), farK=smoothstep(60.,200.,nd);     // his dark within 60 m; beyond 200 m the beds are soft bands only
  float form0=smoothstep(-.6,1.,dot(n,uLight)), form=mix(lcSteps(form0),form0,max(.9*smoothstep(45.,150.,nd),lcSoft));      // the one light on the form: five firm steps near, lost into one soft turning of tone far off (no band of value there reads as a cast shadow)
  form=mix(form,form*form*(.4+.6*form),nearK*.9);                          // near rock is the darkest thing: a face only half turned to the light sinks to umber
  float beds=lcBeds(wp)*(1.-lcBare);
  float grain=lcN2(wp.xz*.7+wp.y*.9)*.5+lcN2(wp.zy*2.3+wp.x*1.7)*.5;
  grain=mix(.5,grain,1.-smoothstep(40.,160.,nd));                          // grain finer than a few pixels: its flat average
  float b=dot(wp,uDipN), along=dot(wp.xz,vec2(.011,.016)), q=b/4.4; q+=.3*sin(q*1.7+1.3)+(lcN2(vec2(b*.09,along))-.5)*.2;      // beds of unequal thickness (the world's bedQ), a little unruled
  // the partings inside a bed are not ruled: they pinch and thicken along the bed and crowd in groups (0.3 to 3 m)
  float q4=q*4.+.7*sin(q*2.9+.7)+.12*sin(q*7.3+2.)+(lcN2(vec2(b*.2,along*2.3+5.))-.5)*.5+.37, q16=q4*4.+.6*sin(q4*2.3+1.1)+.11;
  float fw=fwidth(q)+1e-4, fw4=fwidth(q4)+1e-4;
  float cq=floor(q), jo=fract(cq*.754877+.11)*9.;                           // joints: soft clefts across a bed, each bed's own, on two sets of planes
  vec2 jc=vec2(wp.z+jo,dot(wp.xy,vec2(uDipN.y,-uDipN.x))+jo*1.7)/vec2(7.5,9.5), jf=abs(fract(jc)-.5)*vec2(7.5,9.5), jw=fwidth(jc)*vec2(7.5,9.5)+1e-4;
  float joint=max((1.-smoothstep(.05,.22+jw.x,jf.x))*(1.-smoothstep(.12,.4,jw.x)),(1.-smoothstep(.05,.22+jw.y,jf.y))*(1.-smoothstep(.12,.4,jw.y)))*step(.5,fract(cq*.618034+.31))*(1.-smoothstep(14.,44.,nd))*(1.-lcBare);      // the thick beds only, and only near
  float xb=smoothstep(.06,.42,1.-abs(dot(n,uDipN)));                    // ledges stand only on faces that cross the beds
  vec3 L0=lcLedge1(q,fw,1.)*(1.-farK), l0=lcLedge1(q4,fw4,1.25)*(1.-smoothstep(22.,70.,nd));
  // the GREAT LEDGES of the middle distance (45 to 500 m): where the 4.4 m beds grow too fine to rule, the rock is still bedded: every two or three
  // beds part as one ledge, a soft dull light along its top over a soft dark, moss on some: a far wall or a crag is never a smooth dune
  float qg=q/2.6+.37, fwg=fwidth(qg)+1e-4; vec3 G=lcLedge1(qg,fwg,1.7)*smoothstep(45.,110.,nd)*(1.-smoothstep(300.,560.,nd))*mix(.5,1.,led.x)*lcGreat;
  vec3 L=L0*led.x, l=l0*led.y*(1.-.6*L.x)*(1.-.5*L.y);
  vec3 l2=lcLedge1(q16,fw4*4.,1.25)*led.y*(1.-.6*L.x)*(1.-.6*l.x)*(1.-smoothstep(6.,22.,nd));     // and again, for the rock within a few metres of the eye
  float Lt=mix(L.x,L0.x/max(1.-farK,.001)*(1.-.6*farK),deep.y);                          // deep.y: a mass in half tone keeps the whole light of its ledge tops, and keeps it farther
  float top=clamp(Lt+mix(.6,1.,deep.y)*l.x+mix(.35,.9,deep.y)*l2.x+mix(.55,1.,deep.y)*G.x,0.,1.); top=max(mix(top,smoothstep(.26,.48,top),deep.y),lcTopX); top*=mix(xb,smoothstep(0.,.3,xb),deep.y)*smoothstep(-.35-.6*lcFull,.1-.6*lcFull,n.y); float und=clamp(L.y+.55*l.y+.4*l2.y+.55*G.y+lcUndX,0.,1.)*xb;      // a top shows on a face that leans back or stands, never under an overhang
  float band=sin(b*.21+1.7+2.*lcN2(vec2(b*.05,along*.6)));                 // far off: two or three soft bands to a pinnacle
  float tone=form*(1.+.06*beds*mix(.35,1.,lcGreat)+.1*band*farK*lcGreat)+beds*.02+(grain-.5)*.05+xb*(L.z*.07*led.x+l.z*.04*led.y);      // inside a lit face the bands are slight
  float occD=occ*deep.x; occD=mix(occD,mix(occD,.88,.65),farK); occ=mix(occ,mix(occ,.88,.65),farK);      // crevice dark is a near thing
  tone*=occD; occ=mix(occD,occ,deep.y);                                     // deep.x: the mass stands in half tone; its ledge tops (deep.y) do not
  tone=mix(tone,max(tone,.94*mix(1.,min(occ,1.),.45)),top);                 // a ledge's top faces the light whichever way its wall looks: full ochre (dimmer in a hollow or deep in the cave)
  tone=clamp(tone-(und*(.25+.45*tone)+joint*xb*max(led.x,.6)*mix(.2,.42,deep.y)),0.,1.);            // a lit ochre top, an umber underside, the bed's own value between
  float o1=clamp(tone,0.,1.);
  o1*=mix(mix(.6,1.,smoothstep(.3,.62,o1)),1.,smoothstep(4.,48.,nd));      // the nearest thing is the darkest: in its shadows, never in its lights
  vec3 local=mix(uPal[1],uPal[2],smoothstep(mix(.5,.62,nearK)-.16*uHour.x,mix(.76,.88,nearK)-.1*uHour.x,o1));   // raw umber half tone; ochre where the light is full
  float mtop=clamp(lcLedge1(q,fw,2.2).x*(1.-farK)*3.*step(.3,fract(cq*.371+.2))+l0.x*1.6*step(.5,fract(floor(q4)*.259))+G.x*2.2*step(.4,fract(floor(qg)*.471+.13)),0.,1.)*xb*smoothstep(-.35,.1,n.y);      // moss lies whole along a ledge's top, whatever share of the ledge the mass draws
  mtop=mix(mtop,smoothstep(.2,.5,mtop)*step(.45,fract(cq*.871+floor(q4)*.137+.3)),deep.y);      // on such a mass moss lies whole along some tops and leaves the others to the light
  float mm=mix(mtop,smoothstep(.3,.7,grain+n.y*.4),smoothstep(.45,.85,n.y));
  float mg=G.x*step(.4,fract(floor(qg)*.471+.13))*xb*smoothstep(-.35,.1,n.y)*deep.y;      // and along some of the great ledges of a mass that carries its lights, whatever its own moss
  local=mix(local,uPal[3]*1.05,max(moss*clamp(mm,0.,1.),clamp(mg*1.6,0.,.85)));                      // moss lies along the ledges (verdigris gone olive), never in blotches
  return lcGlaze(local,clamp(o1*1.12+.02,0.,1.)); }      // thin on the lit crests (the ochre lands whole), pooled in the hollows
vec3 lcRock(vec3 wp,vec3 n,float occ,float moss,vec2 led){ return lcRockD(wp,n,occ,moss,led,vec2(1.,0.)); }
vec3 lcRock(vec3 wp,vec3 n,float occ,float moss){ return lcRock(wp,n,occ,moss,vec2(1.)); }
`;

// ---------------------------------------------------------------- the glaze material (rock, earth, leaf)
const GLAZE_VERT = /* glsl */`
varying vec3 vWp; varying vec3 vN; varying vec3 vC; varying float vNv0;
uniform float uPush; uniform float uRad;
#ifdef LC_RAD
  attribute float aRad;
#endif
void main(){
  vec4 p=vec4(position,1.); vec3 n=normal;
  #ifdef USE_INSTANCING
    p=instanceMatrix*p; n=mat3(instanceMatrix)*n;
  #endif
  vec4 wp=modelMatrix*p; vec3 wn=mat3(modelMatrix)*n; wn=wn/max(length(wn),1e-5);
  vWp=wp.xyz; vN=wn;
  #ifdef USE_COLOR
    vC=color;
  #else
    vC=vec3(1.,0.,1.);
  #endif
  float rad=uRad;
  #ifdef LC_RAD
    rad=aRad;
  #endif
  float push=min(uPush*distance(wp.xyz,cameraPosition),max(rad,.05)*.6);     // contour shell: pushed uPush x view distance, never farther than the form is thick there (a far spire's tip stays a tip)
  float q=max(rad,.05)/(max(rad,.05)+push+1e-4); vNv0=sqrt(clamp(1.-q*q,.0004,1.));   // N.V on the shell where it stands over the solid's own edge
  wp.xyz+=wn*push;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const GLAZE_FRAG = /* glsl */`
varying vec3 vWp; varying vec3 vN; varying vec3 vC; varying float vNv0;
uniform float uPush; uniform float uRim; uniform vec3 uTint; uniform float uTintAmt; uniform vec4 uFace; uniform vec2 uLedge; uniform vec2 uDeep; uniform float uLitTop; uniform float uBlade;
${STYLE_GLSL}
void main(){
  vec3 n=normalize(vN+vec3(0.,1e-5,0.));
  float occ=clamp(vC.r,0.,1.2), moss=clamp(vC.g+uDeep.y,0.,1.);      // uDeep: x a mass that stands in half tone, y moss along all its ledges
  vec3 nf=normalize(mix(n,uFace.xyz,uFace.w)+vec3(0.,1e-5,0.));      // uFace: the mass's own broad face, mixed into the light's normal
  float al=1., lk=1.;
  #ifdef LC_SHELL
    vec3 vd=cameraPosition-vWp; vd=vd/max(length(vd),1e-4);
    float nv=abs(dot(n,vd)), a0=clamp(nv*nv/max(vNv0*vNv0,1e-4),0.,1.);      // 0 at the pushed rim, 1 over the solid's edge, even across the band
    al=a0*a0*(3.-2.*a0)*uRim*clamp(vC.b,0.,1.); lk=a0*a0;                    // the rim carries the form's tone only: a ruled ledge half gone over the sky would read as a smear
  #endif
  lcFull=clamp(vC.b-1.,0.,1.);      // vertex colour b over 1: a mass all of whose beds carry their ledge lights
  // A CRAG'S BLADE (uBlade 1, on every vertex whose b is 1): g is not moss but the blade's own parting coordinate, whole numbers at its
  // few partings (its rings, which lie on bedding planes at unequal heights). Each parting is ruled here as a short slanting ledge, a
  // dull light on its top over a dark, that pinches out along the bed and stops where the face meets a joint or an arris (r, the
  // crevice dark, is low there): never a hoop round the form. The ruled beds of the land are taken off it.
  lcBare=step(vC.b,-.5);            // vertex colour b under 0: a bare root
  // A WALL (vertex colour b 3, on a blade): a blade whose ledge lights hold where it leans out over us (lcFull) and whose every parting can be followed
  // from arris to arris as a soft dark, the light on it swelling and dying along the bed.
  float wl=step(2.5,vC.b), bl=uBlade*(1.-lcFull*(1.-wl)); vec2 led=uLedge*lk*mix(vec2(1.),vec2(.0,.3*(1.-wl)),bl)*(1.-lcBare); lcSoft=.85*wl*bl;      // (no ruled hairline on a wall: its own partings only)
  {
    float s=vC.g, fs=fwidth(s)+1e-4, c=floor(s+.5), f=s-c, h=fract(c*.618034+.27), h2=fract(c*.3819+.61);
    float wt=mix(.08,.18,h), wu=mix(.14,.34,h2);
    float nz=lcN2(vec2(c*7.3,dot(vWp.xz,vec2(.11,.06)))+.3*h);
    float keep=bl*smoothstep(.6,.86,vC.r)*step(.5,mod(c,16.))*(1.-smoothstep(.1,.28,fs))*mix(smoothstep(.3,.5,nz),.45+.55*smoothstep(.25,.6,nz),wl);
    lcTopX=keep*mix(step(.3,h),step(.15,h)*smoothstep(.22,.5,nz),wl)*smoothstep(-fs,fs,f)*(1.-smoothstep(wt*.5-fs,wt+fs,f));
    lcUndX=keep*smoothstep(-wu*1.2-fs,-wu*.25+fs,f)*(1.-smoothstep(-fs,fs,f));
    lcGreat=(1.-bl)*(1.-lcBare); moss=max(moss*(1.-bl),bl*clamp(vC.r-2.,0.,1.));      // (a blade's r over 2: moss on a fallen block's upper face)
  }
  vec3 col=lcRockD(vWp,nf,occ,moss,led,vec2(uDeep.x,uLitTop*lk*(1.-lcBare)));
  col=mix(col,lcGlaze(uTint,lcTone(n)*occ*uDeep.x),uTintAmt);
  col=lcAir(col,vWp);
  gl_FragColor=vec4(col,al);
}`;
// o.blade 1 (the world's crags): on vertices whose b is 1, g is the blade's parting coordinate, not moss (see uBlade in GLAZE_FRAG).
// glazeMaterial(S, o): the solid. Vertex colour (optional, set o.vertexColors): r = crevice occlusion
// (1 open, 0.4 deep), g = moss 0..1, b = contour weight for the shell (1 where the form meets the air; 2 = the same, and every bed carries its ledge light; 3 on a blade = a wall, see GLAZE_FRAG). o.tint / o.tintAmt replace the rock's local colour (leaves: olive).
// contourShellMaterial(S, o): the same shade on the mass itself, pushed o.push x distance along its normal,
// alpha 0 at the pushed rim to 1 over the solid's own edge, depth writing OFF, drawn after every solid
// (give its mesh renderOrder 5 or 6): the contour is lost to the air without any sorting.
export function glazeMaterial(S, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...S, uPush: { value: 0 }, uRim: { value: 1 }, uRad: { value: o.rad ?? 20 }, uFace: { value: new THREE.Vector4(0, 1, 0, 0) }, uLedge: { value: new THREE.Vector2(o.ledge ?? 1, o.ledgeFine ?? 1) }, uDeep: { value: new THREE.Vector2(o.dark ?? 1, o.moss ?? 0) }, uLitTop: { value: o.litTop ?? 0 }, uBlade: { value: o.blade ?? 0 },
      uTint: { value: new THREE.Color(o.tint || PALETTE[3]) }, uTintAmt: { value: o.tintAmt ?? 0 } },
    vertexShader: GLAZE_VERT, fragmentShader: GLAZE_FRAG, vertexColors: !!o.vertexColors,
    side: o.side ?? THREE.FrontSide,
  });
}
export function contourShellMaterial(S, o = {}) {
  const m = glazeMaterial(S, o);
  m.defines = o.radAttr ? { LC_SHELL: 1, LC_RAD: 1 } : { LC_SHELL: 1 }; m.uniforms.uPush.value = o.push ?? 0.022; m.uniforms.uRim.value = o.rim ?? 1;
  m.transparent = true; m.depthWrite = false;
  return m;
}

// ---------------------------------------------------------------- the strand rule (all drawn water)
// One fragment for every lock: an olive rolled body, umber in the hollow at its rims, 3 to 5 lead-white
// light lines along it (fwidth-filtered, flat average when finer than 3 px), level tone, then the air law.
const STRAND_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vS; varying vec3 vWp;
uniform float uLines; uniform float uFar; uniform float uLit; uniform float uFarLit; uniform float uAirK; uniform float uPaleB; uniform float uPart;
${STYLE_GLSL}
void main(){
  float v=clamp(vUv.y,-1.,1.), round=1.-v*v;      // clamped: a varying runs past its range on thin triangles under antialiasing
  float fwl=fwidth(v*9.);      // (taken here, outside every branch)
  float flatK=smoothstep(.45,.95,fwidth(v));       // a strand under four pixels wide goes to its flat average tint, whole under two: a far bundle whose strands touch is one soft lock, paler on its outer side, never bars
  float f=(v*.5+.5)*uLines+.5, fw=fwidth(f)+1e-4, wl=.13;
  float line=1.-smoothstep(wl-fw,wl+fw,abs(fract(f)-.5));
  float farL=smoothstep(.3,.7,fw);
  line=mix(line,uFar,farL);          // lines finer than a few pixels: the strand itself is the pale stroke on its dark body
  float pulse=.62+.38*sin(vS.y*.55+vS.w*40.);
  float glint=smoothstep(.15,.9,sin(vS.y*.45+vS.w*17.)*.5+.5);
  vec3 hollow=mix(uFloor,uPal[3],.5);
  vec3 body=mix(uPal[3],uPal[5],clamp(vS.z,0.,1.)*.5*uPaleB);
  if(vS.x<-.001){ body=mix(uFloor,uPal[3],.66); hollow=mix(uFloor,uPal[3],.4); pulse=.8+.2*pulse;
    body=mix(body,hollow,.5*smoothstep(.3,.75,lcN2(vec2(v*7.+vS.w*5.,vS.y*.03))));      // the body is water too: slow lanes of tone run down it, never a flat board
    if(uPart>.5){      // the great fall's dark ribbons have the fall's own form: lanes of tone that go down with the strands, umber-olive at their
      // edges, and they PART: toward their edges and their foot they are tongues between hollows (the fall's whole body, behind them, is FALL_BODY below)
      float fa=clamp(vUv.x,0.,1.), keep=1.-smoothstep(.3,.8,fwl);
      float l1=lcN2(vec2(v*9.+vS.w*5.,vS.y*.1)), l2=lcN2(vec2(v*23.+3.,vS.y*.21+7.)), edge=smoothstep(.3,1.,abs(v));
      float dk=clamp(edge*.95+(.6*smoothstep(.35,.7,l1)+.3*smoothstep(.4,.8,l2)-.25)*keep,0.,1.);
      body=mix(mix(uFloor,uPal[3],.6),mix(uFloor,uPal[3],.16),dk); hollow=mix(uFloor,uPal[3],.2);
      float part=edge*1.15+smoothstep(.62,1.,fa)*.8+(1.-smoothstep(0.,.12,fa))*.6;
      if(mix(.5,l1*.65+l2*.35,keep)<part-.42) discard;
    }
  }
  vec3 col=mix(hollow,body,clamp(mix(round,.67,flatK)*(.5+.5*pulse),0.,1.));
  col=mix(col,uPal[6],clamp(line*clamp(vS.x,0.,1.)*uLit*mix(.3+.7*glint,1.,farL*uFarLit)*mix(smoothstep(0.,.5,round),.8,flatK),0.,1.));      // uFarLit: far off the outer strands are whole pale strokes (a great curl read from the lip)
  gl_FragColor=vec4(lcAirK(col,vWp,uAirK),1.);
}`;
// A planar lock: a stem (straight, or an open arc of uBend radians), then a log spiral winding to a small tight
// hooked scroll, in the plane (aU,aV).
const LOCK_VERT = /* glsl */`
attribute vec3 aO,aU,aV; attribute vec4 aP,aQ,aK;
uniform float uTime,uGrow,uCyc,uBend,uAng,uSqz,uSize,uTin,uMinW,uStem,uSqO; uniform vec3 uWave; uniform vec4 uMove;
varying vec2 vUv; varying vec4 vS; varying vec3 vWp;
void main(){
  float a=position.x, v=position.y;
  float sc=smoothstep(aQ.y,aQ.y+.14,uGrow);
  float cyc=fract(uTime*.085+aQ.z);
  float e=mix(1.,smoothstep(0.,.42,cyc)*(1.-smoothstep(.62,1.,cyc)),uCyc);
  float Ls=aP.x*sc*e*uSize*uStem, R=max(aP.y*sc*uSize*mix(1.,.3+.7*e,uCyc),1e-3), k=aP.z;
  float T=6.2832*max(aP.w+uMove.x*sin(uTime*uMove.y+aQ.z*6.2832)*(1.-uCyc)-uCyc*(1.-e)*.9,.3);   // the scroll winds and unwinds on the world's clock
  float q=sqrt(1.+k*k), Lp=R/k*q*(1.-exp(-k*T)), s=a*(Ls+Lp);
  if(uAng>.01){ float m=1.-clamp((a-uAng)/(1.-uAng),0.,1.)*(1.-exp(-k*T*.5)); s=a<uAng?Ls*a/uAng:Ls+R/k*q*(1.-m*m); }      // uAng: the stem's share of the segments; the scroll's then turn less where its radius is large (an even sagitta), so no corner shows on the outer winding
  float r=R, lat=0., sS=min(s,Ls), th=uBend*sS/max(Ls,1e-3);      // the stem: an open arc turning uBend radians the scroll's way
  vec2 p=uBend>1e-3?(Ls/uBend)*vec2(sin(th),1.-cos(th)):vec2(sS,0.), tg=vec2(cos(th),sin(th));
  if(s>Ls){
    float arg=max(1.-(s-Ls)*k/(R*q),1e-4), t=-log(arg)/k; r=R*arg;
    vec2 e0=vec2(-k,-1.)/q; float c=cos(t), sn=sin(t), cb=cos(uBend), sb=sin(uBend);
    vec2 dv=r*vec2(e0.x*c-e0.y*sn,e0.x*sn+e0.y*c), tl=vec2(c,sn);
    float phi=uMove.w*uTime+aQ.z*6.2832, ov=.11*smoothstep(0.,2.4,t)*step(1e-4,abs(uMove.w)); vec2 a1=vec2(cos(phi),sin(phi));      // uMove.w: the coil turns on the world's clock (0.15 rad/s for a great curl)
    dv+=ov*(2.*dot(dv,a1)*a1-dv); tl+=ov*(2.*dot(tl,a1)*a1-tl); tl=tl/max(length(tl),1e-4);
    vec2 ps=-R*e0+dv;
    p+=vec2(ps.x*cb-ps.y*sb,ps.x*sb+ps.y*cb); tg=vec2(tl.x*cb-tl.y*sb,tl.x*sb+tl.y*cb);
  } else { float w=s/max(Ls,1e-3); lat=-aK.w*uSize*.5*(1.-cos(w*6.2832))*.5*aQ.z
      +uWave.x*sin(w*uWave.y*6.2832+aQ.z*61.-uTime*uWave.z)*sin(w*3.1416); }   // uWave: the stem weaves, the whole bundle as one (strands never cross)
  vec2 nn=vec2(-tg.y,tg.x); p+=nn*lat;
  float wb=abs(aK.w)*uSize*.9+1e-3, off=aQ.x*uSize*sc*r/(r+wb)*(R+wb)/R;
  vec3 nrm=cross(aU,aV);
  vec3 pos=aO+aU*p.x+aV*p.y+(aU*nn.x+aV*nn.y)*off;
  pos+=nrm*aK.z*uSize*sc*cos(clamp(aQ.x/max(abs(aK.w),1e-3),-1.,1.)*1.45)*sqrt(max(sin(a*3.1416),0.));
  pos.x=mix(pos.x*uSqz,pos.x-aO.x*(1.-uSqz),max(step(.5,aK.x),uSqO));      // uSqz (the bore in a narrow river): flat locks are drawn narrower, standing scrolls only stand closer; uSqO 1 (the tails): flat locks too keep their breadth and only lie closer
  vec4 wp=modelMatrix*vec4(pos,1.);
  float dist=distance(wp.xyz,cameraPosition);
  float taper=smoothstep(0.,uTin,a)*(1.-smoothstep(.72,1.,a)*.85)*(1.-smoothstep(.97,1.,a));      // uTin: how far along a strand comes to its full width (0.05; more for a lock that rises out of level water)
  float hw0=aQ.w*sc*uSize*mix(1.,e,uCyc), hw=max(hw0,uMinW*dist*min(sc*40.,1.))*taper;      // uMinW: no strand thinner than about two pixels (0.0011 of its distance); more for a close-combed lock, whose far strands then touch and leave no gap
  float thin=clamp(hw0/max(uMinW*dist,1e-4),.3,1.);
  vec3 t3=mat3(modelMatrix)*(aU*tg.x+aV*tg.y);
  vec3 sideF=mat3(modelMatrix)*(aU*nn.x+aV*nn.y);
  vec3 sbd=cross(t3,cameraPosition-wp.xyz); sbd=sbd/max(length(sbd),1e-4);
  wp.xyz+=mix(sideF,sbd,aK.x*step(-.5,aK.y))*v*hw;      // a bundle's dark body (aK.y -1: half a metre to a metre broad) has an attitude of its own: its breadth lies in the bundle's own plane, whatever looks at it. Only a single strand is a round thread, drawn turned about its length
  vWp=wp.xyz; vUv=vec2(a,v);
  vS=vec4(thin*aK.y*(.45+.55*smoothstep(-1.,1.,-aQ.x/max(abs(aK.w),1e-3))),(s-uTime*mix(5.,7.,uCyc))*uMove.z,fract(aQ.z*7.31)*.8,aQ.z);
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
// The fall: bundles on a parabola from the notch lip to the foot, plaited (each bundle circles its
// place, half of them the other way, so they pass over and under), the plait running down at 14 m/s.
const FALL_VERT = /* glsl */`
attribute vec3 aO,aU; attribute vec4 aP,aK;
uniform float uTime,uGrow,uRun,uFine,uTwin; uniform vec3 uLip,uFoot;
#ifdef LC_SLIDE
  uniform float uProf[17];      // a slide: the water keeps to the ground, whose heights under its run are given at 17 even stations
#endif
varying vec2 vUv; varying vec4 vS; varying vec3 vWp;
void main(){
  float a=position.x, v=position.y;
  float sc=smoothstep(aP.y,aP.y+.1,uGrow);
  float W=mix(1.,7.,uGrow), tau=(a-.07)/.93;
  float o=uLip.x-uFoot.x, H=uLip.y-uFoot.y;
  vec3 c, tg;
  if(tau<0.){ c=uLip+vec3(-tau*120.,.3+tau*tau*60.,0.); tg=vec3(-1.,0.,0.); }
  else {
    #ifdef LC_SLIDE
      float ft=clamp(tau,0.,1.)*16., fi=min(floor(ft),15.), ff=ft-fi; int ip=int(fi);
      float y0=uProf[ip], y1=uProf[ip+1], ym=uProf[max(ip-1,0)], y2=uProf[min(ip+2,16)];
      float sl=mix(.5*(y1-ym),.5*(y2-y0),ff);      // the slope eased from station to station: the plait bends over each ledge, it does not kink
      c=vec3(uLip.x-o*tau,uLip.y+mix(y0,y1,ff*ff*(3.-2.*ff))+.3,uLip.z); tg=vec3(-o/16.,sl-.001,0.); tg=tg/max(length(tg),1e-4);
    #else
      c=vec3(uLip.x-o*tau,uFoot.y+H*(1.-tau*tau)+.3,uLip.z); tg=vec3(-o,-2.*H*tau-.01,0.); tg=tg/max(length(tg),1e-4);
    #endif
  }
  float open=smoothstep(-.075,.3,tau), fl=tau-uTime*.175*uRun;
  float ph=aP.z+aU.z*6.2832*fl, ps=aO.z+tau*3.+uTime*.25*sign(aU.z+1e-3);
  float lat=(aO.x*W*(.7+.5*tau)*(1.-.62*uTwin)+aU.x*sin(ph)*sc*min(W*.4,1.)*(1.-.4*uTwin))*(.35+.65*open)
    +(aO.x>=0.?1.:-1.)*uTwin*6.6*smoothstep(-.02,.22,tau);      // uTwin: the fall parts into two braids below the lip
  float dep=(aO.y+aU.y*cos(ph))*open*min(W*.35,1.);
  vec3 dn=vec3(-tg.y,tg.x,0.);
  vec3 pos=c+vec3(0.,0.,1.)*(lat+aP.x*cos(ps)*sc)+dn*(dep+aP.x*sin(ps)*.6*sc*open);
  vec4 wp=modelMatrix*vec4(pos,1.);
  float dist=distance(wp.xyz,cameraPosition);
  float taper=smoothstep(0.,.05,a)*(1.-smoothstep(.9,1.,a));
  float hw0=aP.w*sc;
  bool fixd=aK.x<0.;      // a fall's dark ribbons (2.7 m broad in the great fall, 1 m in the brook's slide) are things with a fixed attitude: their breadth lies along the strands' spread, whatever looks at them
  float hw=(fixd?hw0:max(hw0,.0011*dist*min(sc*40.,1.)))*taper;
  float thin=fixd?1.:clamp(hw0/max(.0011*dist,1e-4),.3,1.);
  vec3 t3=mat3(modelMatrix)*tg;
  vec3 sb=fixd?mat3(modelMatrix)*vec3(0.,0.,1.):cross(t3,cameraPosition-wp.xyz); sb=sb/max(length(sb),1e-4);      // a single strand (0.1 to 0.4 m as built) is a round thread: it is drawn as its own width, turned about its length
  wp.xyz+=sb*v*hw;
  vWp=wp.xyz; vUv=vec2(a,v);
  vS=vec4(aK.x*thin,fl*H*uFine,aK.y,aK.z);
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
// strandMaterial(S, 'lock' | 'fall', { lines, cyc }): cyc 1 = the lock unrolls and falls back on a loop. A 'fall' with o.slide
// (17 ground heights) keeps to the ground instead of the parabola: a brook sliding down a slope of ledges.
// Uniform uGrow (0..1) is growth against each strand's birth: zero scale before birth.
export function strandMaterial(S, kind = 'lock', o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...S, uGrow: { value: 1 }, uCyc: { value: o.cyc ?? 0 }, uLines: { value: o.lines ?? 4 }, uWave: { value: new THREE.Vector3(o.wave ?? 0, o.waves ?? 2, o.waveSpeed ?? 1.5) }, uMove: { value: new THREE.Vector4(o.turnAmp ?? 0.2, o.turnRate ?? 0.15, o.flow ?? 1, o.turn ?? 0) }, uBend: { value: o.bend ?? 0 }, uAng: { value: o.ang ?? 0 }, uSqz: { value: 1 }, uStem: { value: 1 }, uSqO: { value: o.sqo ?? 0 }, uSize: { value: 1 }, uTin: { value: 0.05 }, uMinW: { value: o.minW ?? 0.0011 }, uLit: { value: 1 }, uFar: { value: o.far ?? (kind === 'fall' ? 0.3 : 0.55) }, uFarLit: { value: o.farLit ?? 0 }, uAirK: { value: o.airK ?? 0.4 }, uPaleB: { value: 1 }, uPart: { value: 0 }, uTwin: { value: 0 },
      uLip: { value: new THREE.Vector3() }, uFoot: { value: new THREE.Vector3() }, uRun: { value: o.run ?? 1 }, uFine: { value: o.fine ?? 1 } },   // run, fine: a small fall (rill, brook) runs and pulses at its own scale
    vertexShader: kind === 'fall' ? FALL_VERT : LOCK_VERT, fragmentShader: STRAND_FRAG, side: THREE.DoubleSide,
  });
  if (kind === 'fall' && o.slide) { m.defines = { LC_SLIDE: 1 }; m.uniforms.uProf = { value: o.slide }; }      // o.slide: 17 heights of the ground under the run, from the lip (0) down, in the mesh's own frame relative to uLip.y
  return m;
}
// strandGeometry(segs, attrs, count): an instanced strip (position.x = 0..1 along, .y = -1..1 across).
// attrs: { name: [itemSize, Float32Array] } per instance (lock: aO,aU,aV,aP,aQ,aK; fall: aO,aU,aP,aK).
//   lock  aO origin, aU stem direction, aV in-plane side the scroll winds toward (unit, perpendicular),
//         aP (stem length, spiral start radius R, tightening k ~0.16..0.3, turns),
//         aQ (offset in the bundle m, birth 0..1, phase 0..1, half width m),
//         aK (0 flat in the plane | 1 facing the eye, light-line strength 0..1, crown height m, bundle half width m)
export function strandGeometry(segs, attrs, count) {
  const g = new THREE.InstancedBufferGeometry();
  const pos = new Float32Array((segs + 1) * 6), idx = [];
  for (let i = 0; i <= segs; i++) { pos[i * 6] = pos[i * 6 + 3] = i / segs; pos[i * 6 + 1] = -1; pos[i * 6 + 4] = 1; }
  for (let i = 0; i < segs; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  for (const n in attrs) g.setAttribute(n, new THREE.InstancedBufferAttribute(attrs[n][1], attrs[n][0]));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// Water surfaces: level tone and dimples only (no ripples, no glint); slow soft swells leave the boil.
// ---------------------------------------------------------------- the great fall's whole body
// FALL_BODY. A thing with a place and an attitude of its own: the far wall of a tube of elliptical section on the fall's centre line. At each height its
// half breadth (along the strands' spread, the mesh's z) is the body's width, 1 m behind the hanging lock and 7 m at the grown column's foot;
// its half depth (across that, along the fall line's normal) is the depth the strands take there (2.7 m when open: 99 in 100 of them) and 0.3 m.
// Only the wall that faces away is drawn (back faces), so every strand, before the fall line or behind it, is seen against it, and its outline
// is the outline of the strands' own cloud. Tone, lanes and parted edge are laws of the place on the wall (the angle round it, the height,
// the world's clock): BODY_FRAG. It has no rim, no end cap and no ring at the lip or the pool: it tapers to nothing at both ends and parts into tongues.
// position = (share of the fall's length 0..1, angle round the tube, +1 | -1: which braid's tube when the fall parts).
const BODY_VERT = /* glsl */`
uniform float uTime,uGrow,uTwin; uniform vec3 uLip,uFoot;
varying vec3 vWp; varying vec4 vB;
void main(){
  float a=position.x, ph=position.y, sd=position.z;
  float W=mix(1.,7.,uGrow), tau=(a-.07)/.93;
  float o=uLip.x-uFoot.x, H=uLip.y-uFoot.y;
  vec3 c, tg;      // the fall line and its tangent: the same law as the strands' (FALL_VERT, no slide)
  if(tau<0.){ c=uLip+vec3(-tau*120.,.3+tau*tau*60.,0.); tg=vec3(-1.,0.,0.); }
  else { c=vec3(uLip.x-o*tau,uFoot.y+H*(1.-tau*tau)+.3,uLip.z); tg=vec3(-o,-2.*H*tau-.01,0.); tg=tg/max(length(tg),1e-4); }
  float open=smoothstep(-.075,.3,tau), taper=smoothstep(0.,.05,a)*(1.-smoothstep(.9,1.,a));
  float there=sd>0.?1.:step(.001,uTwin);      // the second tube is nothing until the fall parts (it then leaves the first from the same place)
  float B=6.6*W/7.*(1.-.42*uTwin)*(.62+.42*clamp(tau,0.,1.))*(1.+.06*sin(tau*13.-uTime*.5)+.04*sin(tau*29.+1.7))*taper*there;      // the width breathes slowly down the fall
  float D=(2.7*open*min(W*.35,1.)+.3)*taper*there;
  vec3 dn=vec3(-tg.y,tg.x,0.);
  vec3 pos=c+vec3(0.,0.,1.)*(sd*uTwin*6.6*smoothstep(-.02,.22,tau)+B*cos(ph))+dn*(D*sin(ph));      // uTwin: one tube behind each braid
  vec4 wp=modelMatrix*vec4(pos,1.);
  vWp=wp.xyz; vB=vec4(a,ph,(tau-uTime*.175)*H,(1.-sd)*8.5);      // the lanes run down with the plait, 14 m/s
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const BODY_FRAG = /* glsl */`
varying vec3 vWp; varying vec4 vB; uniform float uAirK;
${STYLE_GLSL}
void main(){
  float fa=clamp(vB.x,0.,1.);
  float w=1.-vB.y/1.5708;      // across the wall by the angle round it: 0 straight behind the fall line (toward the dam), +1 and -1 at the two ends of the strands' spread, 2 and -2 meeting in front
  // THE WALL'S MIDDLE stands 40 degrees round from straight behind, toward the end of the spread that lies away from the cave (the mesh's +z): the way comes from
  // the cave down the dam and has the fall before it from the other end only (60 to 20 m off, 75 to 44 degrees off square), and from there the wall that stands
  // behind the strands is the dam's side of the tube and its far end, round to the front. A law of the place: nothing here reads the eye.
  float m=w-.45, aw=abs(m);
  float side=smoothstep(.7,1.15,aw), flatK=smoothstep(.45,.95,fwidth(w));
  float pulse=.8+.2*(.62+.38*sin(vB.z*.55+20.));
  float keep=1.-smoothstep(.3,.8,fwidth(w*9.));      // lanes finer than three pixels go to their flat average
  float l1=lcN2(vec2(w*9.+2.5+vB.w,vB.z*.1)), l2=lcN2(vec2(w*23.+3.+vB.w,vB.z*.21+7.));
  float dk=clamp(side*.8+(.6*smoothstep(.35,.7,l1)+.3*smoothstep(.4,.8,l2)-.25)*keep,0.,1.);
  vec3 body=mix(mix(uFloor,uPal[3],.6),mix(uFloor,uPal[3],.16),dk), hollow=mix(uFloor,uPal[3],.2);      // olive grey, umber-olive toward its two sides
  // it PARTS: toward its two sides, its head and its foot it is tongues between hollows, and further round it is gone: its outline is made of locks, never a rim.
  // Across its middle it is whole. On the dam's side toward the cave the tongues begin half way out (36 degrees from the middle) and it is gone by 120; round the
  // far end of the spread, where the strands stand before it deepest, it is whole 30 degrees further.
  float e=aw-.35*step(0.,m);
  float part=smoothstep(.4,.6,e)*(.6+.9*clamp(e-.55,0.,.6))+smoothstep(1.1,1.4,e)*1.2+smoothstep(.62,1.,fa)*.8+(1.-smoothstep(0.,.12,fa))*.6;
  if(mix(.5,l1*.65+l2*.35,keep)<part-.42) discard;
  vec3 col=mix(hollow,body,clamp(mix(1.-side,.67,flatK)*(.5+.5*pulse),0.,1.));      // the body's tone across its middle, into the hollow's tone at its sides
  gl_FragColor=vec4(lcAirK(col,vWp,uAirK),1.);
}`;
// bodyGeometry(segs, round): two tubes (one behind each braid), rings of round+1 from the middle of the near wall (the seam) round by the far wall.
function bodyGeometry(segs, round) {
  const g = new THREE.BufferGeometry(), nr = round + 1, nv = (segs + 1) * nr, pos = new Float32Array(nv * 6), idx = [];
  for (let t = 0; t < 2; t++) for (let i = 0; i <= segs; i++) for (let j = 0; j < nr; j++) {
    const k = (t * nv + i * nr + j) * 3; pos[k] = i / segs; pos[k + 1] = -Math.PI / 2 + 2 * Math.PI * j / round; pos[k + 2] = t ? -1 : 1;
    if (i < segs && j < round) { const q = t * nv + i * nr + j; idx.push(q, q + nr, q + 1, q + 1, q + nr, q + nr + 1); }      // wound so the outside is the front: the material draws the back, the wall that faces away
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

const WATER_VERT = /* glsl */`varying vec3 vWp; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`;
const WATER_FRAG = /* glsl */`
varying vec3 vWp; uniform vec3 uBoilW; uniform float uGrow; uniform float uPaleW; uniform vec4 uRimW; uniform vec3 uOutW; uniform vec3 uBandW;
${STYLE_GLSL}
void main(){
  vec2 rb=vWp.xz-uBoilW.xz; float r=length(rb), d=distance(vWp,cameraPosition);
  vec3 vd=(cameraPosition-vWp)/max(d,1e-3);
  float big=lcN2(vWp.xz*.021+7.)*.6+lcN2(vWp.xz*.09)*.4;
  float sw=sin(r*.42-uTime*.9)*exp(-r/85.)*uGrow;
  // the streaming: broad slow lanes of tone that leave the boil and run out with the current (level tone, no glint)
  float ang=atan(rb.y,-rb.x+sign(-rb.x+1e-4)*1e-3), nearB=1.-smoothstep(70.,150.,r);
  float lane=lcN2(vec2(ang*5.5,r*.03-uTime*.11))*.62+lcN2(vec2(ang*15.+3.,r*.055-uTime*.17))*.38;
  float dn=1.-smoothstep(25.,110.,d);
  float riv=lcN2(vec2(vWp.x*.16+3.,vWp.z*.03-uTime*.2))*.5+lcN2(vec2(vWp.x*.45+9.,vWp.z*.07-uTime*.4))*.32+mix(.5,lcN2(vec2(vWp.x*1.1,vWp.z*.16-uTime*.7)),dn)*.18;
  lane=smoothstep(.28,.72,mix(riv,lane,nearB))-.5;      // a river or a brook (far from any boil) streams down its own length, in lanes one can follow
  float dm=(smoothstep(.62,.9,lcN2(vWp.xz*.33+uTime*.04))-.25)*dn;      // soft dimples, near the eye
  float tone=.5+.2*big+.19*sw-.1*dm, lanes=.4*lane*(.35+.65*uGrow);
  // depth by the eye: looked down into, the water is dark transparent olive umber; at a low angle and far off it pales
  // toward the sky's low band; under the rock at its rim it is darkest
  float graze=1.-clamp(vd.y,0.,1.); graze=graze*graze*smoothstep(.5,.9,graze); graze=graze*graze*smoothstep(8.,160.,d);      // the pale of the sky's band lies on it only at a low glance
  float rd=distance(vWp.xz,uRimW.xy);      // under its banks: a band inside the rim, none outside it and none where the pool runs out (uOutW: x, z, radius)
  float rim=uRimW.w*smoothstep(uRimW.z-34.,uRimW.z-2.,rd)*(1.-smoothstep(uRimW.z-2.,uRimW.z+24.,rd))*smoothstep(uOutW.z*.5,uOutW.z,distance(vWp.xz,uOutW.xy));
  vec3 deep=mix(uFloor,uPal[3],.6)*.9, mid=mix(uPal[3],uPal[5],.14+uPaleW);
  float down=mix(1.,.27,smoothstep(.05,.5,clamp(vd.y,0.,1.)));      // looked down into from any height the water is deep; only a low glance finds its pale
  vec3 col=mix(deep,mid,clamp(tone*(1.-.55*rim)*down+lanes*mix(1.,.6,smoothstep(40.,140.,d)),0.,1.));      // the lanes keep their strength in the dark near water
  col=mix(col,mix(uPal[5],uBandW,.45),clamp(graze*.8,0.,.8)*(.75+.5*(tone+lanes-.5)));
  gl_FragColor=vec4(lcAirK(col,vWp,.1),1.);      // water keeps its own tone through the air (it is the olive of the green ground already); far off it goes blue and pale as all things do
}`;
export function waterMaterial(S, o = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...S, uBoilW: { value: new THREE.Vector3(0, 0, 1e5) }, uGrow: { value: 0 }, uPaleW: { value: o.pale ?? 0 },
      uRimW: { value: new THREE.Vector4(0, 0, 1, 0) }, uOutW: { value: new THREE.Vector3(0, 1e5, 1) }, uBandW: { value: new THREE.Color(o.band || PALETTE[6]) } },      // uRimW: a round pool's centre (x, z), radius and how dark it lies under its banks; uBandW: the sky's low band
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG });
}
// Bubbles: flat rings of lead white on the water, born, drifting out from the boil and gone, on the world clock.
const BUB_VERT = /* glsl */`
attribute vec4 aB; attribute vec3 aC; uniform float uTime,uGrow; varying vec2 vUv; varying vec3 vWp; varying float vA;
void main(){
  float cyc=fract(uTime*aC.z+aB.w), life=smoothstep(0.,.18,cyc)*(1.-smoothstep(.8,1.,cyc))*smoothstep(aC.y,aC.y+.1,uGrow);
  vec2 dir=aB.xy/max(length(aB.xy),1e-3);
  vec3 pos=vec3(aB.x+dir.x*cyc*aC.x,.12,aB.y+dir.y*cyc*aC.x)+vec3(position.x,0.,position.y)*aB.z*life;
  vec4 wp=modelMatrix*vec4(pos,1.);
  vWp=wp.xyz; vUv=position.xy; vA=life;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const BUB_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vWp; varying float vA;
${STYLE_GLSL}
void main(){
  float r=length(vUv), fw=fwidth(r)+1e-4;
  float ring=1.-smoothstep(.1-fw*.2,.1+fw,abs(r-.82));
  ring=mix(ring,.22*step(r,.95),smoothstep(.25,.6,fw));
  float arc=smoothstep(.2,.9,dot(vUv/max(r,1e-3),vec2(-.6,.8)));
  float al=ring*(.3+.6*arc)*vA;
  if(al<.02) discard;
  gl_FragColor=vec4(lcAir(uPal[6],vWp),al);
}`;

// ---------------------------------------------------------------- layout, in the W frame
// W frame = the world's axes with the origin at the pool's centre (world (10,0,340)): +Z the course,
// +X port (the dam), y = 0 the pool. The dam's crest line is x = 85, the notch at z = -10, the fall's
// foot (68,0,-10), the high lake at y = 84.
const NOTCH_Z = -10, DAM_X = 85, LAKE_Y = 84, SILL_Y = 80, BOIL = [62, 0, -10];

async function damGeometry(ctx, nz, fs, layers, joints) {
  // Rows are laid ON the bedding (constant b), so every ledge runs true along a bed and dips with it.
  const N = ctx.noise, cap = 7, sd = Math.sin(DIP), cd = Math.cos(DIP), rb = [];
  for (let L = 0; L < layers.length - 1; L++) for (const f of fs) { const b = lerp(layers[L].b, layers[L + 1].b, f); if (b > -47 && b < 69) rb.push({ b, L, f }); }
  // no more than 88 rows on the face, whatever the deal of beds: where a build has more, the middle row of a thin bed is left out, thinnest bed first
  // (the bed keeps its two edges, so every ledge stays; a build with many thin beds would otherwise carry a third more triangles)
  for (let pass = 0; pass < 2 && rb.length > 88; pass++) while (rb.length > 88) {
    let best = -1, bt = 1e9;
    for (let i = 0; i < rb.length; i++) { const r = rb[i], th = layers[r.L + 1].b - layers[r.L].b; if (r.f > 0.2 && r.f < 0.8 && (pass === 1 || !layers[r.L].thick) && th < bt) { bt = th; best = i; } }
    if (best < 0) break; rb.splice(best, 1);
  }
  const nh = rb.length - 1, rows = nh + cap + 1, cols = nz + 1;
  const pos = new Float32Array(rows * cols * 3), col = new Float32Array(rows * cols * 3), idx = [];
  const plate = (f) => (f > 0.01 ? 1 : 0);
  for (let i = 0; i < cols; i++) {
    if (i % 8 === 7) await ctx.yield();
    const z = -100 + (i / nz) * 190, dz = Math.abs(z - NOTCH_Z);
    const crest = 104 + 6 * N.n2(z * 0.021, 3.1) + 3 * N.n2(z * 0.07, 9.2);
    const st = Math.max(0, dz - 4.5) / 4.6, stair = SILL_Y + 8.5 * (Math.floor(st) + smoothstep(0.7, 1, st - Math.floor(st))) + (z > NOTCH_Z ? 2.5 : 0) * Math.min(st, 1);
    const top = Math.min(crest, stair), inNotch = smoothstep(crest - 1, crest - 9, stair);
    const rec = lerp(10.5, 19, smoothstep(14, 55, dz)), wrap = 46 * Math.pow(smoothstep(70, 95, Math.abs(z + 5)), 2);
    const X0 = (y) => DAM_X - rec * Math.pow(1 - clamp(y / 105, 0, 1), 1.7) + (2.2 * N.fbm2(z * 0.013 + 4, y * 0.012, 2) + 4.2 * N.n2(z * 0.034, y * 0.006 + 2)) * (1 - inNotch * 0.7) + inNotch * 2.5 + wrap;
    for (let j = 0; j < rows; j++) {
      const k = (i * rows + j) * 3;
      let x, y, occ = 1, moss = 0;
      if (j <= nh) {
        const r = rb[j], lay = layers[r.L];
        y = r.b / cd + 40; for (let q = 0; q < 3; q++) y = (r.b + sd * X0(y)) / cd;
        const fade = smoothstep(top, top - 2.5, y) * (0.5 + 0.5 * smoothstep(-4, 5, y));
        const yc = clamp(y, -5, top), x0 = X0(yc);
        const jz = (z + lay.s * 5) / lay.js; let dj = 1e3, cell = 0;
        for (let q = 0; q < joints.length; q++) { const d = Math.abs(jz - joints[q]) * lay.js; if (d < dj) dj = d; if (jz > joints[q]) cell = q; }
        const block = (((cell * 7 + r.L * 13 + 5) * 2654435761) >>> 0) / 4294967296 - 0.5;
        const crack = Math.exp(-(dj * dj) / 3.2);
        const prev = layers[Math.max(r.L - 1, 0)], wav = (l, q) => l.a * (0.5 + 0.5 * N.n2(z * 0.027, q * 1.7 + 0.3) * 1.6);
        const aE = r.f > 0.01 ? wav(lay, r.L) : Math.min(wav(lay, r.L), wav(prev, r.L - 1)) - 0.5;
        x = x0 + (-aE + block * 0.1 * lay.a * plate(r.f) + crack * (lay.thick ? 0.9 : 0.15)) * fade;      // beds run on as ledges; joints are soft clefts, not the edges of blocks
        y = yc;
        occ = (1 - (lay.thick ? 0.4 : 0.2) * crack) * (r.f < 0.01 ? 0.5 : lay.thick ? (r.f < 0.2 ? 0.85 : 1) : 0.72) * (0.8 + 0.2 * smoothstep(-2, 6, y));
        moss = (r.f > 0.8 ? 1 : 0) * smoothstep(-0.3, 0.3, N.n2(z * 0.09, y * 0.11)) * (0.3 + 0.7 * smoothstep(30, 4, dz - 6));
      } else {
        const c = (j - nh) / cap, xe = pos[(i * rows + nh) * 3];
        x = xe + c * 44 + (1 - c) * c * 6 * N.n2(z * 0.05, c * 3);
        y = lerp(top, Math.min(top, LAKE_Y - 6), smoothstep(0.25, 1, c)) + (1 - c) * c * 3 * N.n2(z * 0.08, 5 + c * 2);
        occ = 0.95; moss = 0.5 * (1 - c);
      }
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; col[k] = occ; col[k + 1] = moss;
      col[k + 2] = j > nh ? 1 : Math.max(smoothstep(top - 9, top - 3, y), smoothstep(8, 30, wrap));   // contour weight for the shell
    }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < rows - 1; j++) {
    const a = i * rows + j, b = a + rows; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// A FALLEN BED: a broken BLOCK of the dam's own rock, lx long, ly thick (a third of its length or more), lz wide. Its outline has six unequal
// sides, no two of them parallel, the corners knocked off; the upper bedding face is the one face open to the light, with a darker hollow in
// it and on some a patch of moss; its thickness stands in the dam's umber (the normals of the sides are turned under, as a broken face turns
// from the light) and carries two or three partings of unequal spacing that waver and die at the corners; the under face wedges out a little.
// Every face has its own vertices and its own normal (attribute normal: a builder that merges it keeps them). Vertex colour: r the tone (over 2
// on a blade: moss, see GLAZE_FRAG), g the block's own parting coordinate (whole numbers at its partings), b 1 (contour weight).
export function slabGeometry(lx, ly, lz, seed) {
  const h = (k) => { const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const L = lx / 2, T = ly / 2, W = lz / 2, s0 = 16 * (1 + Math.floor(h(0) * 30)), wedge = (h(10) - 0.5) * 0.36, np = h(11) < 0.45 ? 3 : 2;      // np: its partings
  const out = [[-L * (0.78 + 0.22 * h(1)), -W * (0.62 + 0.3 * h(2))], [L * (0.3 + 0.34 * h(3)), -W], [L, -W * (0.12 + 0.4 * h(4))],
    [L * (0.62 + 0.3 * h(5)), W * (0.6 + 0.32 * h(6))], [-L * (0.08 + 0.42 * h(7)), W], [-L, W * (0.1 + 0.42 * h(8))]], n = out.length;
  const P = [], C = [], Nn = [];
  const yT = (i) => T * (1 - 0.16 * h(30 + i)), yB = (i) => -T * (1 - wedge * out[i][0] / L) * (1 - 0.14 * h(40 + i)), fm = (i) => 0.3 + 0.4 * h(50 + i);
  const top = (i) => [out[i][0], yT(i), out[i][1]], bot = (i) => [out[i][0] * 0.94, yB(i), out[i][1] * 0.94];
  const mid = (i) => { const k = 1.02 + 0.07 * h(60 + i); return [out[i][0] * k, lerp(yB(i), yT(i), fm(i)), out[i][1] * k]; };      // the sides are broken faces: a low arris runs round the block's thickness
  const tri = (a, b, c, ca, cb, cc, bend) => {      // faces look outward (the block is convex round its middle); bend turns the face's normal under (down, in the block's own frame)
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const o2 = nx * (a[0] + b[0] + c[0]) + ny * (a[1] + b[1] + c[1]) + nz * (a[2] + b[2] + c[2]) >= 0, sg = o2 ? 1 : -1, l = Math.hypot(nx, ny, nz) || 1;
    nx *= sg / l; ny = ny * sg / l - bend; nz *= sg / l; const l2 = Math.hypot(nx, ny, nz) || 1;
    if (o2) { P.push(...a, ...b, ...c); C.push(...ca, ...cb, ...cc); } else { P.push(...a, ...c, ...b); C.push(...ca, ...cc, ...cb); }
    for (let q = 0; q < 3; q++) Nn.push(nx / l2, ny / l2, nz / l2);
  };
  // the upper bedding face: a fan round its hollow (off the middle, a hand lower, darker); one corner worn dark, and on two blocks in five moss lies in the hollow and out to one side
  const hx = L * (h(12) - 0.5) * 0.5, hz = W * (h(13) - 0.5) * 0.5, mossy = h(14) < 0.4, im = Math.floor(h(15) * n), gT = s0 + np + 0.5;
  const cH = [mossy ? 3 : 0.62, gT, 1], hol = [hx, T * 0.8, hz], rT = (i) => (mossy && (i === im || i === (im + 1) % n) ? 3 : i === (im + 3) % n ? 0.74 : 1.05);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(hol, top(i), top(j), cH, [rT(i), gT, 1], [rT(j), gT, 1], -0.9); }      // (bend under 0: its normal is drawn toward the bed's own upright, so the face is one plane of light with a soft hollow, not a cut gem)
  for (let i = 1; i < n - 1; i++) tri(bot(0), bot(i), bot(i + 1), [0.5, s0 + 0.5, 1], [0.5, s0 + 0.5, 1], [0.5, s0 + 0.5, 1], 0);
  // the thickness: two bands of broken face to a side. r is the crevice dark (a parting dies where it is low: at every other corner), g runs from one bedding face to the other, unevenly
  const rE = (i, k) => (h(70 + i * 3 + k) < 0.42 ? 0.52 : 0.82 + 0.14 * h(80 + i + k)), gj = (i, k) => (h(90 + i * 5 + k) - 0.5) * 0.5;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, bd = 0.5 + 0.5 * h(20 + i), gm = (q) => s0 + 0.5 + np * (0.22 + 0.56 * h(100 + q)) + gj(q, 1);
    const b0 = [rE(i, 0) * 0.85, s0 + 0.5 + gj(i, 0) * 0.4, 1], b1 = [rE(j, 0) * 0.85, s0 + 0.5 + gj(j, 0) * 0.4, 1], m0 = [rE(i, 1), gm(i), 1], m1 = [rE(j, 1), gm(j), 1], t0 = [rE(i, 2), gT + gj(i, 2) * 0.4, 1], t1 = [rE(j, 2), gT + gj(j, 2) * 0.4, 1];
    tri(bot(i), bot(j), mid(j), b0, b1, m1, bd + 0.35); tri(bot(i), mid(j), mid(i), b0, m1, m0, bd + 0.35);
    tri(mid(i), mid(j), top(j), m0, m1, t1, bd); tri(mid(i), top(j), top(i), m0, t1, t0, bd);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  return g;
}

// The least distance from a volute's strands to the way's points (flat xyz, the lock's own frame), walking its centre lines
// as LOCK_VERT bends them (uBend 0, uAng 0, no wave, uSize 1) at 24 phases of its cycle, half and full grown, at both ends of
// the scroll's slow winding, for the bundle's two outer strands and its middle one, less a strand's half width.
function voluteLeast(o, u, v, b, way, CYC, MOVE, only, p0 = 0, p1 = 24) {      // only: one of the two sizes (0.5 or 1); p0, p1: a share of the 24 phases: the caller yields between the shares and takes the least of them
  const wb = Math.max((b.ns - 1) / 2 * b.sp, 0.05), wbS = wb * 0.9 + 1e-3, k = b.k, q = Math.sqrt(1 + k * k), hw = b.sp * (b.fill ?? 0.42), NS = 36;
  let least = 1e9;
  for (const sc of [0.5, 1]) { if (only && sc !== only) continue; let m2 = 1e18;      // the least squared distance at this size: the root is taken once, so a build step stays short
   for (let ph = p0; ph < p1; ph++) {
    const cyc = ph / 24, e = lerp(1, smoothstep(0, 0.42, cyc) * (1 - smoothstep(0.62, 1, cyc)), CYC), Ls = b.stem * sc * e, R = Math.max(b.R * sc * lerp(1, 0.3 + 0.7 * e, CYC), 1e-3);
    for (const sw of [-1, 1]) {
      const T = 6.2832 * Math.max(b.turns + MOVE * sw * (1 - CYC) - CYC * (1 - e) * 0.9, 0.3), Lp = R / k * q * (1 - Math.exp(-k * T));
      for (let i = 0; i <= NS; i++) {
        const s = (i / NS) * (Ls + Lp); let px = Math.min(s, Ls), py = 0, tx = 1, ty = 0, r = R, lat = 0;
        if (s > Ls) { const arg = Math.max(1 - (s - Ls) * k / (R * q), 1e-4), t = -Math.log(arg) / k, c = Math.cos(t), sn = Math.sin(t), ex = -k / q, ey = -1 / q; r = R * arg; px += -R * ex + r * (ex * c - ey * sn); py += -R * ey + r * (ex * sn + ey * c); tx = c; ty = sn; }
        else lat = -wb * 0.25 * (1 - Math.cos(s / Math.max(Ls, 1e-3) * 6.2832)) * b.phase;
        const nx = -ty, ny = tx; px += nx * lat; py += ny * lat;
        for (let w = -1; w <= 1; w++) {
          const off = w * wb * sc * r / (r + wbS) * (R + wbS) / R, X = o[0] + u[0] * px + v[0] * py + (u[0] * nx + v[0] * ny) * off, Y = o[1] + u[1] * px + v[1] * py + (u[1] * nx + v[1] * ny) * off, Z = o[2] + u[2] * px + v[2] * py + (u[2] * nx + v[2] * ny) * off;
          for (let j = 0; j < way.length; j += 3) { const dx = X - way[j], dy = Y - way[j + 1], dz = Z - way[j + 2], d2 = dx * dx + dy * dy + dz * dz; if (d2 < m2) m2 = d2; }
        }
      }
    }
   }
   least = Math.min(least, Math.sqrt(m2) - hw * sc);
  }
  return least;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? 1, 0.6, 1), inWorld = !!opts.inWorld;
  const S = opts.style || makeStyle(opts.palette || PALETTE);      // this build's own uniforms
  const object = new THREE.Group(), inner = new THREE.Group(); object.add(inner);
  // The viewer wants the front toward +Z: turn the W frame a quarter (dam behind, course to +X) and
  // turn the style's light and dip with it. In the world (opts.inWorld) W is simply moved to the pool.
  const YAW = inWorld ? 0 : Math.PI / 2;
  if (inWorld) inner.position.set(10, 0, 340); else inner.rotation.y = YAW;
  setStyleYaw(S, YAW);
  const out = (x, y, z) => { const v = new THREE.Vector3(x, y, z); if (inWorld) v.add(inner.position); else v.applyAxisAngle(new THREE.Vector3(0, 1, 0), YAW); return v; };
  const outDir = (x, y, z) => { const v = new THREE.Vector3(x, y, z).normalize(); if (!inWorld) v.applyAxisAngle(new THREE.Vector3(0, 1, 0), YAW); return v; };

  // ---- seeded variety
  const nGreat = opts.greatCurls ?? rng.int(5, 9), hand = opts.hand ?? rng.sign(), twin = opts.twin ?? rng.chance(0.2);
  const layers = []; { let b = -70; while (b < 110) { const thick = rng.chance(0.4); layers.push({ b, a: thick ? rng.range(2.2, 4.6) : rng.range(0.1, 1.0), s: rng.range(-8, 8), js: rng.range(0.9, 2.4), thick }); b += thick ? rng.range(5.5, 9.5) : rng.range(2.2, 4.2); } layers.push({ b, a: 2, s: 0, js: 1 }); }
  const joints = []; { let z = -112; while (z < 120) { joints.push(z); z += rng.range(7, 19); } }

  // ---- rock: the dam (one merged modelled face with its crest and back), its contour shell, the beds
  const DAMO = { vertexColors: true, ledge: 0.45, dark: 0.62, moss: 0.7, litTop: 1 };      // the dam: the dark wing, moss lying along its ledges
  const rockMat = glazeMaterial(S, { ...DAMO, side: THREE.DoubleSide }), bedMat = glazeMaterial(S, { vertexColors: true, side: THREE.DoubleSide, ledge: 0.45, blade: 1 });      // a bed that falls shows its clean bedding face: ochre above, umber beneath      // the dam's great beds are its own rows; the shader adds their lit tops and partings
  { const fn = outDir(-0.86, 0.5, -0.1); rockMat.uniforms.uFace.value.set(fn.x, fn.y, fn.z, 0.22); }      // the dam stands in half tone; its ledges take the light
  const dam = new THREE.Mesh(await damGeometry(ctx, Math.round(94 * detail), detail > 0.8 ? [0, 0.14, 0.5, 0.86] : [0, 0.16, 0.84], layers, joints), rockMat);
  inner.add(dam); await ctx.yield();
  const shellMat = contourShellMaterial(S, DAMO); shellMat.uniforms.uFace.value.copy(rockMat.uniforms.uFace.value);
  const shellGeo = new THREE.BufferGeometry();            // the same vertices (so nothing shows inside the form), only the triangles that meet the air
  { const dg = dam.geometry, ix = dg.index.array, cw = dg.attributes.color.array, keep = [];
    for (let i = 0; i < ix.length; i += 3) if (cw[ix[i] * 3 + 2] + cw[ix[i + 1] * 3 + 2] + cw[ix[i + 2] * 3 + 2] > 0.02) keep.push(ix[i], ix[i + 1], ix[i + 2]);
    for (const k in dg.attributes) shellGeo.setAttribute(k, dg.attributes[k]); shellGeo.setIndex(keep); shellGeo.boundingSphere = dg.boundingSphere; }
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.renderOrder = 6; inner.add(shell); await ctx.yield();
  const beds = [];
  rng.chance(0.5);      // (a draw the build once used for the house-sized bed's side: kept, so every later draw falls as before)
  // The flank beds' windows are shares of the way, which is fixed: the first slides and falls while we fly the cave's last 17 m, the mouth and the shelf (z 93 to 155),
  // the second from the lip down the first of the dive (z 159 to 218); the house-sized one is keyed by place from the world.
  const bedSpec = [                      // [lx, ly, lz, x, y, z, u0, u1]: two flank beds, then the house-sized one
    [13, 5.5, 8.5, DAM_X + 1.5, SILL_Y + 1.95, NOTCH_Z + 5.4, 0.12, 0.2],      // blocks of the dam: none a board
    [13, 5.5, 8.5, DAM_X + 1.5, SILL_Y + 1.85, NOTCH_Z - 5.4, 0.205, 0.285],
    [15, 6.4, 11, DAM_X + 1, SILL_Y + 17.2, NOTCH_Z + 16.5, ...(opts.bedWindow || [0.385, 0.455])]];      // the house-sized one goes from the notch's far flank (the side the way does not pass under) and comes down beside the column while we look at it
  for (let i = 0; i < 3; i++) {
    const s = bedSpec[i], m = new THREE.Mesh(slabGeometry(s[0], s[1], s[2], 3 + i * 5.1), bedMat);
    m.position.set(s[3], s[4], s[5]); m.rotation.z = DIP * 0.5; inner.add(m); await ctx.yield();
    beds.push({ m, x: s[3], y: s[4], z: s[5], u0: s[6], u1: s[7], spin: Math.abs(rng.range(0.7, 1.4) * rng.sign()), dz: rng.range(-3, 3) });      // it turns its bedding face toward the pool (and the eye) as it falls: a block of the dam, its broken sides in umber
  }
  await ctx.yield();

  // ---- water surfaces: the pool (y = 0) and the high lake (y = 84) behind the dam
  const poolMat = waterMaterial(S, { band: opts.band }), lakeMat = waterMaterial(S, { pale: 0.3, band: opts.band });
  poolMat.uniforms.uRimW.value.set(0, 0, opts.poolRadius ?? 112, 0.75);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(opts.poolRadius ?? 112, 72), poolMat);
  pool.rotation.x = -Math.PI / 2; inner.add(pool);
  const lake = new THREE.Mesh(new THREE.PlaneGeometry(150, 164, 1, 1), lakeMat);   // kept inside the dam's two ends, so no edge of it shows past the gorge wall
  lake.rotation.x = -Math.PI / 2; lake.position.set(DAM_X + 73, LAKE_Y, -5); inner.add(lake);

  // ---- the fall: bundles of 7 to 15 strands
  const fallMat = strandMaterial(S, 'fall', { lines: 4 });
  fallMat.uniforms.uPart.value = 1; fallMat.uniforms.uLip.value.set(DAM_X - 2.5, SILL_Y + 0.6, NOTCH_Z); fallMat.uniforms.uFoot.value.set(68, 0, NOTCH_Z);
  {
    const max = Math.round(500 * detail), O = new Float32Array(max * 3), U = new Float32Array(max * 3), P = new Float32Array(max * 4), K = new Float32Array(max * 4);
    let n = 2, bi = 0;      // (the count starts at two, as when two boards stood here for the body: the last bundle is cut to the same number of strands and every later draw falls as before; places are written two lower)
    for (let q = 0; q < 7; q++, n++) {      // dark olive body ribbons behind the bundles
      const zb = -0.42 + 0.84 * q / 6;      // (kept inside the strands' spread: no ribbon of the body stands clear of the outermost locks)
      O.set([zb, 1.5, rng.range(0, 6.28)], (n - 2) * 3); U.set([0.5, 0.3, (q % 2 ? 1 : -1) * 1.5], (n - 2) * 3);
      P.set([0, q === 3 ? -0.5 : Math.abs(zb) * 0.8, rng.range(0, 6.28), 1.35], (n - 2) * 4); K.set([-1, 0, rng(), 0], (n - 2) * 4);      // the middle ribbon is there from the first: the hanging lock's own dark
    }
    while (n < max) {
      const ns = Math.min(rng.int(7, 15), max - n), birth = bi === 0 ? 0 : Math.pow(rng(), 0.8) * 0.86;
      let zb = bi === 0 ? 0 : rng.range(-1, 1) * (0.3 + 0.7 * birth);
      const dep = rng.range(-1.6, 1.6), tw = rng.range(0, 6.28), ax = rng.range(1.1, 2.2), ay = rng.range(0.8, 1.5), turns = rng.range(1.5, 3) * (bi % 2 ? 1 : -1);
      const sp0 = rng.range(0.26, 0.4), sp = bi === 0 ? Math.min(sp0, 2 / (ns - 1)) : sp0, ph = rng.range(0, 6.28), pale = rng.range(0.15, 0.7), seed = rng();      // the first bundle is the ONE HANGING LOCK, 2 m wide, there from u 0 (its birth is below zero); the rest grow from u 0.10
      for (let s = 0; s < ns; s++, n++) {
        O.set([zb, dep, tw], (n - 2) * 3); U.set([ax, ay, turns], (n - 2) * 3);
        P.set([(s - (ns - 1) / 2) * sp, (bi === 0 ? -0.5 : birth) + 0.02 * rng(), ph, sp * rng.range(0.36, 0.5)], (n - 2) * 4);
        K.set([0.25 + 0.75 * Math.pow(s / Math.max(ns - 1, 1), 1.5), pale, seed + s * 0.013, 0], (n - 2) * 4);
      }
      bi++;
    }
    const fall = new THREE.Mesh(strandGeometry(28, { aO: [3, O], aU: [3, U], aP: [4, P], aK: [4, K] }, n - 2), fallMat);
    fall.frustumCulled = false; inner.add(fall);
  }
  // the fall's whole body: the far wall of a tube on the fall line (FALL_BODY), on the fall's own growth, parting, lip and foot (the same uniform objects)
  const bodyMat = new THREE.ShaderMaterial({ uniforms: { ...S, uGrow: fallMat.uniforms.uGrow, uTwin: fallMat.uniforms.uTwin, uLip: fallMat.uniforms.uLip, uFoot: fallMat.uniforms.uFoot, uAirK: fallMat.uniforms.uAirK },
    vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, side: THREE.BackSide });
  const fallBody = new THREE.Mesh(bodyGeometry(30, 16), bodyMat);      // 1,920 triangles, one draw
  fallBody.frustumCulled = false; inner.add(fallBody);
  await ctx.yield();

  // ---- locks: a batch collects bundles of parallel strands (never crossing inside a bundle)
  const batch = (max) => {
    const A = { aO: [3, new Float32Array(max * 3)], aU: [3, new Float32Array(max * 3)], aV: [3, new Float32Array(max * 3)],
      aP: [4, new Float32Array(max * 4)], aQ: [4, new Float32Array(max * 4)], aK: [4, new Float32Array(max * 4)] };
    let n = 0;
    return {
      // o origin, u stem dir, v side the scroll winds to; b: { ns, sp, stem, R, k, turns, birth, phase, mode, lit, crown }
      add(o, u, v, b) {
        const wb = Math.max((b.ns - 1) / 2 * b.sp, 0.05), up = u[2] * v[0] - u[0] * v[2] >= 0 ? 1 : -1;
        if (b.body && n < max) {          // the low rolled body behind the bundle: one wide dark lock
          A.aO[1].set([o[0], o[1] - 0.14, o[2]], n * 3); A.aU[1].set(u, n * 3); A.aV[1].set(v, n * 3);
          A.aP[1].set([b.stem, b.R, b.k, b.turns], n * 4); A.aQ[1].set([0, b.birth, b.phase, wb + b.sp * 0.9], n * 4);
          A.aK[1].set([b.mode, -1, 0, wb], n * 4); n++;
        }
        for (let s = 0; s < b.ns && n < max; s++, n++) {
          const off = (s - (b.ns - 1) / 2) * b.sp;
          A.aO[1].set(o, n * 3); A.aU[1].set(u, n * 3); A.aV[1].set(v, n * 3);
          A.aP[1].set([b.stem, b.R, b.k, b.turns], n * 4);
          A.aQ[1].set([off, b.birth + 0.03 * (s / b.ns), b.phase + s * 0.0007, b.sp * (b.fill ?? 0.42)], n * 4);
          A.aK[1].set([b.mode, b.lit, (b.crown || 0) * (b.mode ? 1 : up), wb], n * 4);
        }
      },
      mesh(segs, mat) { const m = new THREE.Mesh(strandGeometry(segs, A, n), mat); m.frustumCulled = false; inner.add(m); return m; },
    };
  };
  const lockMat = strandMaterial(S, 'lock', { lines: 4, bend: 0.8, turnAmp: 0.12, ang: 0.45, far: 0.95, farLit: 1, airK: 0.25, turn: 0.15 * hand }),      // great curls turn at 0.15 rad/s on the world's clock, the way they wind
    smallMat = strandMaterial(S, 'lock', { lines: 3, far: 0.8, farLit: 0.6, airK: 0.3, flow: 2.2, turnAmp: 0.25, turnRate: 0.55, bend: 0.6, ang: 0.36, wave: 0.3, waves: 1.3, waveSpeed: 1.4 });
  const voluteMat = strandMaterial(S, 'lock', { lines: 3, cyc: 0.8, turnAmp: 0.2 }),      // (cyc and turnAmp are VCYC and VMOVE of the volutes' clearing below)
    BOREO = { lines: 3, wave: 0.45, waves: 1.4, waveSpeed: 1.2, bend: 0.35, flow: 1.6, far: 0.7 }, boreMat = strandMaterial(S, 'lock', BOREO), tailMat = strandMaterial(S, 'lock', { ...BOREO, sqo: 1 });      // the back's locks and the tails: one program, two sets of uniforms
  const [BX, , BZ] = BOIL, fan = (t) => [-Math.cos(t), 0, Math.sin(t)];            // t = 0 points down -X, into the pool
  const side = (d, h) => [d[2] * h, 0, -d[0] * h];

  // ---- the rosette: great curls like petals, each ONE lock of parallel strands that leaves the boil, sweeps out
  // in a long open arc and winds to a hooked scroll with dark water between its windings (the lock is a third
  // of the scroll's radius wide, never a filled disc); lesser curls between and beyond
  const great = batch(Math.round(130 * detail)), lesser = batch(Math.round(265 * detail)), greatInfo = [];
  for (let i = 0; i < nGreat; i++) {
    const f = (i + 0.5) / nGreat, t = (hand > 0 ? lerp(-1.72, 1.05, f) : lerp(-1.05, 1.72, f)) + rng.range(-0.06, 0.06), d = fan(t), r0 = rng.range(4.5, 7.5), long = i % 2;      // the fan leans the way the petals turn, so none sweeps into the dam
    const order = [0, 1, 3, 5, 7, 8, 6, 4, 2][Math.min(i, 8)] / Math.max(nGreat - 1, 1);       // two first, then outward pairs
    const R = long ? rng.range(7.6, 8.4) : rng.range(8.6, 9.6), k = rng.range(0.2, 0.22), turns = rng.range(1.6, 1.9), ns = 7;      // an open sweep of 50 to 66 m from the boil, then the hooked scroll
    const b = { ns, sp: R * rng.range(0.38, 0.42) / (ns - 1), stem: long ? rng.range(58, 66) : rng.range(50, 56), R, k,
      turns, birth: Math.min(order, 1) * 0.72, phase: rng(), mode: 0, lit: rng.range(0.8, 1), crown: 0.55, fill: 0.34, body: 1 };
    great.add([BX + d[0] * r0, 0.22 + 0.07 * i, BZ + d[2] * r0], d, side(d, hand), b);
    greatInfo.push({ t, reach: r0 + 0.9 * b.stem + b.R * 1.6, R: b.R, stem: b.stem, r0 });
  }
  // the lesser curls, 8 to 25 m: long locks drawn by the current (out from the boil between the petals, then round toward
  // the outflow), each curling off to its hooked scroll; a share are the pool's own quiet water, there before the lake lets go
  const nLess = Math.round(30 * detail), OUTF = [-56, 110];
  for (let i = 0; i < nLess; i++) {
    const nearB = i % 5 < 2, t = rng.range(-1.75, 1.75), dist = nearB ? rng.range(14, 48) : rng.range(50, 150), c = fan(t);
    let px = BX + c[0] * dist, pz = BZ + c[2] * dist; { const l = Math.hypot(px, pz); if (l > 96) { px *= 96 / l; pz *= 96 / l; } }
    const ox = OUTF[0] - px, oz = OUTF[1] - pz, ol = Math.hypot(ox, oz) || 1, wf = smoothstep(30, 95, dist), jit = rng.range(-0.3, 0.3);
    const dx = lerp(c[0], ox / ol, wf), dz = lerp(c[2], oz / ol, wf), a = Math.atan2(dz, -dx) + jit, d = fan(a);
    const h = rng.chance(0.75) ? hand : -hand, R = rng.range(1.9, 3.5), ns = 7;
    const b = { ns, sp: R * 0.4 / (ns - 1), stem: rng.range(8, 19), R, k: rng.range(0.2, 0.24), turns: rng.range(1.5, 2.1),
      birth: i % 2 === 0 ? -0.5 : 0.18 + 0.7 * rng(), phase: rng(), mode: 0, lit: rng.range(0.6, 0.95), crown: 0.2, fill: 0.36, body: 1 };
    lesser.add([px, 0.14 + 0.002 * i, pz], d, side(d, h), b);
  }
  const twinMat = strandMaterial(S, 'lock', { lines: 4, bend: 0.8, turnAmp: 0.15, turnRate: 0.4, ang: 0.45, turn: -0.15 * hand }); twinMat.uniforms.uGrow.value = 0;
  if (twin) {
    const tb = batch(64), c0 = [BX - 16, 0, BZ + 34];
    for (let i = 0; i < 5; i++) {
      const t = lerp(-0.5, 2.3, i / 4) + rng.range(-0.1, 0.1), d = fan(t), R = rng.range(4.2, 5.6), ns = 7;
      tb.add([c0[0] + d[0] * 2.5, 0.95 + 0.05 * i, c0[2] + d[2] * 2.5], d, side(d, -hand), { ns, sp: R * 0.36 / (ns - 1), stem: i % 2 ? rng.range(10, 14) : rng.range(5, 7), R, k: 0.22, turns: rng.range(1.6, 1.9), birth: 0.12 * i, phase: rng(), mode: 0, lit: 1, crown: 0.3, fill: 0.36, body: 1 });
    }
    tb.mesh(48, twinMat);
  }
  great.mesh(Math.round(96 * (detail * 0.5 + 0.5)), lockMat); lesser.mesh(Math.round(38 * (detail * 0.5 + 0.5)), smallMat);
  await ctx.yield();

  // ---- strand volutes at the fall's foot: rise, curl over outward, unroll and fall back (world clock)
  // BY PLACE, AT BUILD: a volute that would curl over into the way (opts.way: the route's points every 0.5 m, in the object's frame)
  // has its stem and its scroll shortened, in whole steps of a tenth, until every strand of it stands 3 m or more from the way at
  // every phase of its cycle; the draws keep their number and order. Nothing is tested against the camera in flight.
  const VCYC = 0.8, VMOVE = 0.2, wayW = [];
  if (opts.way) for (let i = 0; i < opts.way.length; i += 3) { const x = opts.way[i] - inner.position.x, y = opts.way[i + 1] - inner.position.y, z = opts.way[i + 2] - inner.position.z; if (Math.hypot(x - BOIL[0], z - BOIL[2]) < 45) wayW.push(x, y, z); }
  const vol = batch(Math.round(160 * detail)), nVol = Math.round(15 * detail);
  for (let i = 0; i < nVol; i++) {
    const t = lerp(-1.5, 1.5, (i + rng()) / nVol), d = fan(t), r0 = rng.range(2.5, 8), el = rng.range(1.0, 1.32), ce = Math.cos(el), se = Math.sin(el);
    const b = { ns: rng.int(8, 11), sp: rng.range(0.16, 0.21), stem: rng.range(9, 14.5), R: rng.range(3.0, 4.6), k: rng.range(0.22, 0.28), turns: rng.range(1.5, 2.1),
      birth: 0.1 + 0.6 * rng(), phase: rng(), mode: 1, lit: rng.range(0.7, 1), crown: 0, fill: 0.42 };
    const vo = [BX + 2 + d[0] * r0, -0.5, BZ + d[2] * r0], vu = [d[0] * ce, se, d[2] * ce], vv = [d[0] * se, -ce, d[2] * se];
    if (wayW.length) {
      const reach = b.stem + 2.6 * b.R + 4.5, wn = []; for (let j = 0; j < wayW.length; j += 3) if (Math.hypot(wayW[j] - vo[0], wayW[j + 1] - vo[1], wayW[j + 2] - vo[2]) < reach) wn.push(wayW[j], wayW[j + 1], wayW[j + 2]);      // only the way's points it could come near
      for (let it = 0; it < 18 && wn.length; it++) {      // half grown and full grown, each in two shares of its phases with a yield between: four short build steps to a try
        let least = 1e9; for (const sz of [0.5, 1]) for (const p0 of [0, 12]) { least = Math.min(least, voluteLeast(vo, vu, vv, b, wn, VCYC, VMOVE, sz, p0, p0 + 12)); await ctx.yield(); }
        if (least >= 3.2) break;
        b.stem *= 0.9; b.R *= 0.9; await ctx.yield();
      }
      await ctx.yield();
    }
    vol.add(vo, vu, vv, b);
  }
  vol.mesh(30, voluteMat);

  // ---- bubble rings round the boil (36 m across)
  const nBub = Math.round(3000 * detail), bubMat = new THREE.ShaderMaterial({ uniforms: { ...S, uGrow: { value: 1 } },
    vertexShader: BUB_VERT, fragmentShader: BUB_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  {
    const B = new Float32Array(nBub * 4), C = new Float32Array(nBub * 3);
    for (let i = 0; i < nBub; i++) {
      const ring = rng.int(0, 5), wide = i % 5 === 4, far = wide || rng.chance(0.22), t = wide ? rng.range(-1.3, 1.3) : rng.range(-2.0, 2.0);
      let r = wide ? rng.range(40, 165) : far ? rng.range(20, 62) : 4.5 + ring * 2.7 + rng.gauss() * 0.28;      // one in five drifts over the whole pool, in small strings
      if (wide) { const l = Math.hypot(BX - Math.cos(t) * r, BZ + Math.sin(t) * r); if (l > 100) r *= 100 / l * 0.8; }
      B.set([-Math.cos(t) * r, Math.sin(t) * r, wide ? rng.range(0.3, 0.75) : far ? rng.range(0.2, 0.5) : rng.range(0.22, 0.8), rng()], i * 4);
      C.set([wide ? rng.range(4, 9) : far ? rng.range(2, 6) : rng.range(0.6, 2.2), wide ? -1 : far ? 0.3 + 0.6 * rng() : rng() * 0.5, wide ? rng.range(0.03, 0.07) : rng.range(0.05, 0.14)], i * 3);
      if (i % 600 === 599) await ctx.yield();
    }
    const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 3));
    g.instanceCount = nBub; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const bub = new THREE.Mesh(g, bubMat); bub.position.set(BX, 0, BZ); bub.frustumCulled = false; bub.renderOrder = 3; inner.add(bub);
  }
  await ctx.yield();

  // ---- the bore: the river's own water heaped up. A back that rises out of the river with no edge (the water's own
  // tone at its foot, deep olive only under the crest, rolled over at the front), combed with locks that converge as
  // they run up it; at the crest every lock rolls up, forward and over into a scroll, the scrolls standing one over the
  // next like a row of ringlets; long tails lie flat on the water behind. Its own group, a child of `object`; local +Z
  // is its way, 60 m wide along local X. The world moves it down the river and gives its width by setBore(amount, width, heap, run): run 0..1 is the tails' length (short while it comes down the cleft and turns, whole on the straight river).
  const bore = new THREE.Group(); object.add(bore);
  const boreBodyMat = new THREE.ShaderMaterial({ uniforms: { ...S, uBandW: { value: new THREE.Color(opts.band || PALETTE[6]) } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aH; varying vec3 vWp; varying float vH;
      void main(){ vec4 wp=modelMatrix*vec4(position,1.); vWp=wp.xyz; vH=aH; gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`varying vec3 vWp; varying float vH; uniform vec3 uBandW;
      ${STYLE_GLSL}
      void main(){
        float d=distance(vWp,cameraPosition); vec3 vd=(cameraPosition-vWp)/max(d,1e-3);
        float big=lcN2(vWp.xz*.021+7.)*.6+lcN2(vWp.xz*.09)*.4;
        float down=mix(1.,.27,smoothstep(.05,.5,clamp(vd.y,0.,1.)));
        vec3 col=mix(mix(uFloor,uPal[3],.6)*.9,mix(uPal[3],uPal[5],.14),clamp((.5+.2*big)*down,0.,1.));      // the level water's own tone by the eye's angle, so the foot has no edge
        float graze=1.-clamp(vd.y,0.,1.); graze=graze*graze*smoothstep(.5,.9,graze); graze=graze*graze*smoothstep(8.,160.,d);
        float h=clamp(vH,0.,1.4);
        col=mix(col,mix(uPal[5],uBandW,.45),clamp(graze*.8,0.,.8)*(.75+.5*.2*(big-.5))*(1.-smoothstep(.1,.5,h)));
        col=mix(col,mix(uFloor,uPal[3],.52),clamp(smoothstep(.2,.8,h)*.9+smoothstep(1.02,1.3,h),0.,1.));   // olive umber up the back, under the crest and down the front
        gl_FragColor=vec4(lcAirK(col,vWp,.1),1.);
      }` });
  let boreBody = null; const tails = new THREE.Group(); bore.add(tails);      // the tails lie on the river behind: they keep their length when the back is drawn short
  const scrollMat = strandMaterial(S, 'lock', { lines: 3, cyc: 0.3, bend: 0.2, ang: 0.2, flow: 1.6, far: 0.6 });
  {
    const BEND = 0.35, CZ = -1.4, CY = 2.57, FZ = -15;      // the back is one straight ramp from its foot (z -15, y 0) to the crest (z -1.4, y 2.57), so the locks lie on it
    const nx = 40, prof = [[-17.5, -0.45, 0], [FZ, 0, 0], [-10, 0.945, 0.37], [-5, 1.89, 0.74], [CZ, CY, 1], [0.2, 2.8, 1.02], [1.4, 2.6, 1.08], [2.1, 1.9, 1.2], [2.3, 1.0, 1.3], [2.1, 0.3, 1.3], [1.9, -0.5, 1.3]];
    const wAt = (x) => Math.pow(Math.max(1 - Math.pow(Math.abs(x) / 30, 2.5), 0), 0.6), bowAt = (x) => 7 * (1 - (x / 30) * (x / 30));
    const pos = [], hh = [], idx = [], np = prof.length;
    for (let i = 0; i <= nx; i++) {
      const x = -30 + 60 * i / nx, w = wAt(x);
      for (let j = 0; j < np; j++) { pos.push(x, prof[j][1] * (prof[j][1] > 0 ? w : 1), prof[j][0] * (0.5 + 0.5 * w) + bowAt(x)); hh.push(prof[j][2] * (0.35 + 0.65 * w)); }
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < np - 1; j++) { const a = i * np + j, b = a + np; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1)); g.setIndex(idx); g.computeBoundingSphere();
    boreBody = new THREE.Mesh(g, boreBodyMat); bore.add(boreBody);
    const dq = detail * 0.5 + 0.5, bb = batch(112), tl = batch(40), sc = batch(112);      // 14 locks of 7 strands and a body up the back, as many scrolls, 5 tails: the strand rule's 7 at any detail
    const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    const nLock = 14, ns = 7;
    for (let i = 0; i < nLock; i++) {
      const x = -27.5 + 55 * (i + 0.5) / nLock, w = wAt(x), zs = 0.5 + 0.5 * w, hx = x >= 0 ? -1 : 1;
      const F = [x, 0.16, FZ * zs + bowAt(x)], C = [x, CY * w + 0.16, CZ * zs + bowAt(x)], d = [0, C[1] - F[1], C[2] - F[2]], len = Math.hypot(d[1], d[2]);
      const Ls = len * BEND / Math.sin(BEND), side = Ls * (1 - Math.cos(BEND)) / BEND, sp = rng.range(2.3, 2.7) / (ns - 1), lit = rng.range(0.7, 0.95), ph = rng();
      // up the back: one lock of parallel strands with a dark body under it, bending in toward the middle as it climbs
      bb.add(F, unit(d), [hx, 0, 0], { ns, sp, stem: Ls, R: 0.3, k: 0.25, turns: 0.5, birth: 0.35 * rng(), phase: ph, mode: 0, lit, crown: 0.12, fill: 0.4, body: 1 });
      // and over: where it ends on the crest it stands up, rolls forward and winds to its hooked scroll
      const u = unit([0.1 * hx, 1, 0.2]), v0 = [hx * 0.92, 0, 0.38], dv = v0[0] * u[0] + v0[1] * u[1] + v0[2] * u[2], v = unit([v0[0] - dv * u[0], v0[1] - dv * u[1], v0[2] - dv * u[2]]);
      const R = rng.range(1.45, 1.75) * (0.72 + 0.28 * w);
      sc.add([x + hx * side, C[1] - 0.25, C[2] + 0.15], u, v, { ns, sp: R * 0.44 / (ns - 1), stem: R * rng.range(0.5, 0.62), R, k: 0.23, turns: rng.range(1.7, 2.0), birth: i % 3 === 1 ? 0.8 + 0 * rng() : 0.2 + 0.4 * rng(), phase: ph, mode: 1, lit: 1, crown: 0, fill: 0.44, body: 1 });      // (five of the fourteen are born last: heaped in the narrow river the crest is a row of nine ringlets one can count, see apply)
    }
    // the tails: five long combed locks of seven strands flat on the river behind, each as broad as a ringlet, running straight back
    // and a little apart (they never cross, however narrow the river draws the bore); a tail's hooked scroll lies far behind, to alternate sides at unequal distances (36 to 50 m when the bore
    // runs the straight river: see uStem in apply), so what is seen from behind the bore is water combed toward it, never a row of marks
    for (let i = 0; i < 5; i++) {
      const x = -22 + 44 * (i + rng.range(0.3, 0.7)) / 5, zs = 0.5 + 0.5 * wAt(x), sx = x / 30 * 0.05 + rng.range(-0.02, 0.02) * 0.3, l = Math.hypot(sx, 1), h = i % 2 ? 1 : -1, R = rng.range(1.8, 2.6);
      tl.add([x, 0.2 + 0.01 * i, (FZ + 1.2) * zs + bowAt(x)], [sx / l, 0, -1 / l], [-h / l, 0, -h * sx / l],
        { ns: ns, sp: rng.range(2.5, 3.1) * 0.82 / (ns - 1), stem: 36 + 3.5 * ((i * 3) % 5) + rng.range(0, 1.5), R, k: 0.24, turns: rng.range(1.5, 2), birth: 0.5 * rng(), phase: rng(), mode: 0, lit: 0.85, crown: 0.15, fill: 0.36, body: 1 });
    }
    for (let i = 0; i < 23; i++) rng();      // (the nine tails of the first build took 63 draws, these five take 40: every later draw keeps its place)
    const m = bb.mesh(24, boreMat); inner.remove(m); bore.add(m);
    const m3 = tl.mesh(24, tailMat); inner.remove(m3); tails.add(m3);
    const m2 = sc.mesh(Math.round(40 * dq), scrollMat); inner.remove(m2); bore.add(m2);
  }
  if (inWorld) bore.position.set(-64, 0, 520); else { bore.position.copy(out(-25, 0, 78)); bore.rotation.y = YAW; }
  let apron = null;
  if (opts.apron ?? !inWorld) { apron = new THREE.Mesh(new THREE.CircleGeometry(1500, 48), poolMat); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.3; inner.add(apron); }
  await ctx.yield();

  // ---- progress and life
  const vr = opts.viewRadius ?? null, vc = opts.viewCentre ?? null;   // the viewer's close-ups come by opts (no page address is read)
  let U = opts.progress ?? 0.44, boreAmt = opts.bore ?? (inWorld ? 0 : 1), boreSqz = 1, boreHeap = 0, boreTail = 1, twinAmt = twin && !inWorld ? 1 : 0;
  const tmp = new THREE.Vector3(), cd = Math.cos(DIP), sd = Math.sin(DIP);
  const apply = () => {
    const g = smoothstep(0, 1, clamp((U - 0.10) / 0.24, 0, 1));
    const gl = smoothstep(0, 1, clamp((U - 0.10) / 0.17, 0, 1));      // the rosette leads the fall: it lies open under us at the lip while the column is still filling
    fallMat.uniforms.uGrow.value = g; lockMat.uniforms.uGrow.value = gl; smallMat.uniforms.uGrow.value = gl;
    voluteMat.uniforms.uGrow.value = clamp((g - 0.12) / 0.88, 0, 1); bubMat.uniforms.uGrow.value = 0.25 + 0.75 * g; poolMat.uniforms.uGrow.value = 0.45 + 0.55 * g;
    boreMat.uniforms.uGrow.value = boreAmt; scrollMat.uniforms.uGrow.value = boreAmt * (1 - 0.3 * boreHeap); bore.scale.set(1, Math.max(boreAmt, 0.001), 1 - 0.6 * boreHeap);
    scrollMat.uniforms.uSize.value = 1 + 0.3 * boreHeap; boreMat.uniforms.uLit.value = 1 - 0.6 * boreHeap;      // heaped up in a narrow river: a shorter, darker back; nine ringlets a little taller (the five born last, every third, are not yet out at 0.7 of the growth)
    boreMat.uniforms.uWave.value.x = 0.45 * (1 - 0.95 * boreHeap); boreMat.uniforms.uFar.value = lerp(0.7, 0.16, boreHeap); boreMat.uniforms.uPaleB.value = 1 - 0.9 * boreHeap; boreMat.uniforms.uTin.value = lerp(0.05, 0.16, boreHeap);
    tails.scale.z = 1 / bore.scale.z; tails.position.z = -6.9 * (1 - tails.scale.z); tailMat.uniforms.uWave.value.x = 0.45 * (1 - 0.6 * boreHeap) * (1 - 0.75 * boreTail); tailMat.uniforms.uStem.value = lerp(0.36, 1, boreTail);      // (their roots, 6.9 m behind the middle before the shortening, stay at the back's foot)      // and the back's locks are combed straight up it, dark with a few fine lines: the scrolls on the crest are then the only pale thing
    boreMat.uniforms.uSqz.value = boreSqz; tailMat.uniforms.uSqz.value = boreSqz; tailMat.uniforms.uGrow.value = boreAmt; scrollMat.uniforms.uSqz.value = boreSqz; boreBody.scale.x = boreSqz;
    fallMat.uniforms.uTwin.value = twinAmt; twinMat.uniforms.uGrow.value = twinAmt;
    for (let i = 0; i < 3; i++) {
      const b = beds[i], q = clamp((U - b.u0) / (b.u1 - b.u0), 0, 1), qs = Math.min(q / 0.3, 1), qf = Math.max(0, (q - 0.3) / 0.7), sl = 7 * qs * qs;
      b.m.position.set(b.x - cd * sl - 12 * qf, b.y - sd * sl - (i === 2 ? 101 : 80) * qf * qf, b.z + (b.dz + (i === 2 ? 14 : 0)) * qf);      // the house-sized one drifts along the dam as it falls, so it comes down clear of the column's starboard edge as we look across      // the two flank beds come to rest awash at the fall's foot, tilted slabs among the fallen beds
      b.m.rotation.z = DIP * 0.5 + b.spin * qf * (i === 2 ? 1.3 : 0.4); b.m.rotation.x = (i === 2 ? 0.4 : 0.15) * b.spin * qf;
    }
  };
  apply();
  const A = {
    poolCentre: out(0, 0, 0), boil: out(BX, 0, BZ), fallFoot: out(68, 0, NOTCH_Z), notchLip: out(DAM_X - 2.5, SILL_Y, NOTCH_Z),
    lakeLevel: LAKE_Y, damFace: { point: out(DAM_X - 4, 50, NOTCH_Z), normal: outDir(-1, 0.1, 0) }, flow: outDir(-1, 0, 0),
    flyThrough: [[-10, 68, -125], [24, 42, -70], [58, 24, -18], [28, 9, 20], [-20, 7, 58], [-62, 8, 110]].map((p) => out(p[0], p[1], p[2])),
    viewpoints: { reveal: out(24, 42, -70), closest: out(58, 24, -18), skim: out(10, 8, 40) },
    lookAt: { column: out(72, 30, NOTCH_Z), flower: out(BX - 22, 0, BZ) },
    greatCurls: greatInfo.map((c) => { const d = fan(c.t), sv = side(d, hand), al = c.r0 + 0.897 * c.stem - 0.717 * c.R, la = 0.379 * c.stem + 0.697 * c.R;      // the scroll's centre at the end of the 0.8 rad sweep
      return { centre: out(BX + d[0] * al + sv[0] * la, 0, BZ + d[2] * al + sv[2] * la), radius: c.R, reach: c.reach }; }),
    bedWindows: beds.map((b) => [b.u0, b.u1]),
    boreRun: [out(-80, 0, 180), out(-84, 0, 260), out(-84, 0, 350)], portalSeat: { position: out(-84, 12, 350), facing: outDir(0, 0, -1) },
  };
  return {
    object, radius: opts.viewRadius ?? vr ?? 55, height: vr ? vr * 1.2 : 105,
    center: vc === 'fall' ? out(71, 30, NOTCH_Z) : vc === 'pool' ? out(34, 2, 4) : vc === 'bore' ? out(-25, 3, 84) : out(42, 30, -6), anchors: A, bore, ground: false, groundY: 0,
    hand, greatCurls: nGreat, twin, style: S, poolMaterial: poolMat,      // poolMaterial: for water that runs out of the pool (the river), so the two are one tone across the join
    setProgress(u) { U = u; },                       // the world's u: notch and fall 0.10..0.34, beds by bedWindows
    setBore(amount, width = 60, heap = 0, run = 1) { boreAmt = clamp(amount, 0, 1); boreSqz = clamp(width / 60, 0.25, 1); boreHeap = clamp(heap, 0, 1); boreTail = clamp(run, 0, 1); },  // 0 gone, 1 full; width in metres (60 full): the back and its locks are drawn narrower, the scrolls stand closer; heap 0..1: a shorter back and taller ringlets (a narrow river); move hero.bore yourself
    setTwin(amount) { twinAmt = twin ? clamp(amount, 0, 1) : 0; },   // the rare parting: 0 one column, 1 two braids and the second rosette open
    update(dt, time, camera) {
      S.uTime.value = time;
      tmp.set(BX, 0, BZ).applyMatrix4(inner.matrixWorld); poolMat.uniforms.uBoilW.value.copy(tmp);
      tmp.set(0, 0, 0).applyMatrix4(inner.matrixWorld); poolMat.uniforms.uRimW.value.x = tmp.x; poolMat.uniforms.uRimW.value.y = tmp.z;
      tmp.set(OUTF[0], 0, OUTF[1]).applyMatrix4(inner.matrixWorld); poolMat.uniforms.uOutW.value.set(tmp.x, tmp.z, 78);      // no bank's dark where the pool runs out
      apply();
    },
    dispose() { twinMat.dispose(); fallBody.geometry.dispose(); bodyMat.dispose(); },      // the twin's material joins a mesh only on a rare build; the fall's body is freed here by name; every other geometry and material is on a mesh of the object and is freed with the scene
  };
}
