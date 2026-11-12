// The exit portal: a window that shows the next world, with a glowing rim.
import * as THREE from 'three';

const NOISE_GLSL = /* glsl */`
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+7.1; a*=.5; } return s; }
`;

// BROUGHT IN: sdBox below is the exact distance to a box in the plane as Inigo Quilez publishes it
// (https://iquilezles.org/articles/distfunctions2d/), MIT License. The notice ships with the site in THIRD-PARTY-NOTICES.txt.
const SDF_GLSL = /* glsl */`
uniform int uShape; uniform vec2 uHalf; // uHalf.x = radius / half width, uHalf.y = half height
float sdBox(vec2 p, vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }
float portalSdf(vec2 p){
  if(uShape==0) return length(p)-uHalf.x;
  if(uShape==1) return sdBox(p, uHalf);
  // arch: box with a semicircle on top
  float r=uHalf.x; float yTop=uHalf.y-r;
  float box=sdBox(p-vec2(0.,(yTop-uHalf.y)*.5), vec2(r,(yTop+uHalf.y)*.5));
  float cap=length(p-vec2(0.,yTop))-r;
  return min(box,cap);
}
`;

function shapeGeometry(shape, hx, hy) {
  if (shape === 'rect') return new THREE.PlaneGeometry(hx * 2, hy * 2);
  if (shape === 'arch') {
    const s = new THREE.Shape(); const yTop = hy - hx;
    s.moveTo(-hx, -hy); s.lineTo(hx, -hy); s.lineTo(hx, yTop); s.absarc(0, yTop, hx, 0, Math.PI, false); s.lineTo(-hx, -hy);
    return new THREE.ShapeGeometry(s, 48);
  }
  return new THREE.CircleGeometry(hx, 96);
}

// ---------------------------------------------------------------------------------------------
// Portal looks. 'ring' is the classic, with its own shaders (see the class).
// Every other look shares this vertex shader and fragment header. uReveal (0..1) brings the next
// world in; uNear (0..1 over the last 30 m) clears whatever still covers the opening, so that at
// the threshold the inside is exactly the undistorted next world.
// ---------------------------------------------------------------------------------------------
export const PORTAL_STYLES = ['ring', 'iris', 'film', 'lens', 'corona', 'flock'];

// The host world's glow (bloom) is added over the whole frame after the scene is drawn, the opening included, and
// a bright sky behind a portal used to turn the world inside it into a pale disc. The opening therefore takes
// away most of the glow that was laid over this pixel on the previous frame (tBloom, the glow pass's own
// buffer), so that glow plus picture comes out as the picture. The value written may be negative; the glow pass
// ignores such pixels and the final pass clamps after the glow is back.
const WASH_GLSL = /* glsl */`vec3 wash(){ vec4 b=textureLod(tBloom, clamp(vScr.xy/max(vScr.w,1e-4)*.5+.5,0.,1.), 0.); return clamp(b.rgb*b.a,0.,50.)*uDewash; }`;

// uNextPV takes a point of the opening (portal space) to the clip space of the camera that drew the next world.
// That camera stands closer to the opening than the viewer does while the portal is far off (see the engine's
// _renderPortal), so the texture is never looked up with the viewer's own screen position.
const VIEW_VERT = /* glsl */`uniform mat4 uNextPV; varying vec2 vLocal; varying vec4 vClip, vScr; flat varying vec4 vC0, vCx, vCy; flat varying vec3 vCam;
  void main(){ vLocal=position.xy;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); vScr=gl_Position; vClip=uNextPV*vec4(position,1.);
    vC0=uNextPV[3]; vCx=uNextPV[0]; vCy=uNextPV[1];              // clip position of any local point = vC0 + x*vCx + y*vCy
    vCam=(inverse(modelViewMatrix)*vec4(0.,0.,0.,1.)).xyz; }`;   // camera in portal space

const VIEW_HEAD = /* glsl */`precision highp float;
  uniform sampler2D tNext, tBloom; uniform float uReveal, uTime, uNear, uSeed, uGlow, uDewash; uniform vec3 uColor, uGain; uniform vec4 uVeil;
  varying vec2 vLocal; varying vec4 vClip, vScr; flat varying vec4 vC0, vCx, vCy; flat varying vec3 vCam;
  ${NOISE_GLSL}${SDF_GLSL}
  vec2 scr(vec2 q){ vec4 c=vC0+vCx*q.x+vCy*q.y; return c.xy/max(c.w,1e-4); }
  ${WASH_GLSL}
  // the next world as it would be seen through local point q of the opening (q == vLocal gives exactly the plain window);
  // uGain shows it at its own exposure and tint rather than the host's. The result can be below zero (see wash()).
  vec3 nextAt(vec2 q){ vec2 s=vClip.xy/max(vClip.w,1e-4)+(scr(q)-scr(vLocal)); return textureLod(tNext, clamp(s*.5+.5,0.,1.), 0.).rgb*uGain-wash(); }
  // the glow inside the rim is gone at the crossing; uNear only clears what uReveal has already opened, so a portal
  // whose next world is not ready yet keeps its rim and its veil instead of going black
  float rimLeft(){ return 1.-smoothstep(.72,1.,uNear)*smoothstep(0.,1.,uReveal); }
  vec3 veilAt(vec2 p, float R){ float ang=atan(p.y,p.x), r=length(p)/R;
    float sw=fbm(vec2(ang*1.6+r*2.5-uTime*.25, r*3.5-uTime*.5)); float sw2=fbm(vec2(ang*3.-uTime*.15, r*7.+uTime*.3));
    float wr=smoothstep(1.6,3.1416,abs(ang));                    // cross-fade over the atan seam (the classic veil has a cut there)
    if(ang<0. && wr>0.){ float a2=ang+6.2832;
      sw=mix(sw, fbm(vec2(a2*1.6+r*2.5-uTime*.25, r*3.5-uTime*.5)), wr); sw2=mix(sw2, fbm(vec2(a2*3.-uTime*.15, r*7.+uTime*.3)), wr); }
    return uColor*(.12+1.5*pow(sw,2.2)+.6*pow(sw2,3.))*(.35+.9*r); }
  // portal.veil: a world may ask for one flat colour in place of the swirl. uVeil.a is then 1 and uVeil.rgb the colour
  // (linear, like uColor); each look writes it where it would write its veil. With uVeil.a 0 nothing changes.
`;

const VIEW_FRAG = {};

// IRIS: nine sickle blades, each the outside of a big circle pushed off centre; blade i lies over blade i-1.
VIEW_FRAG.iris = /* glsl */`
  #define NB 9
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float RB=uShape==0 ? R : length(uHalf);
    float edge=smoothstep(-.22*R,0.,d);
    float rev=smoothstep(0.,1.,uReveal), open=smoothstep(0.,.8,uNear);
    float a=mix(R*(.04+.5*rev), RB*1.14, open);                 // aperture radius; past the rim well before the crossing
    float Rc=RB*1.3, off=Rc-a;
    float rl=length(p), tw=.55*(1.-open)*rl/R;
    float cs=cos(tw), sn=sin(tw); vec2 pp=vec2(cs*p.x-sn*p.y, sn*p.x+cs*p.y);
    float phi=atan(pp.y,pp.x);
    float rot=uSeed*6.2832+uTime*.015+rev*.8+open*1.1;
    float px=length(fwidth(p))*.9;
    float best=-10., topE=0., topTh=rot, mx=-1e5;
    if(open<1.) for(int i=0;i<NB;i++){
      float th=rot+float(i)*6.2832/float(NB);
      float e=length(pp+vec2(cos(th),sin(th))*off)-Rc;          // >0 inside blade i
      mx=max(mx,e);
      float rel=mod(th-phi+3.14159,6.2832)-3.14159;
      if(e>-px && rel>best){ best=rel; topE=e; topTh=th; }
    }
    vec3 base=nextAt(p);
    if(rev<.999) base=mix(uVeil.a>.5 ? uVeil.rgb : veilAt(p,R)*1.2+uColor*.6, base, rev);
    vec3 col=base;
    if(open<1.){                                                 // blades are past the rim once open == 1
    vec3 cen=max((nextAt(vec2(.2,.1)*R)+nextAt(vec2(-.2,.1)*R)+nextAt(vec2(0.,-.2)*R))/3.,0.);
    vec3 light=mix(uColor*1.3, cen*1.5+uColor*.25, rev);         // the light coming through
    // the top blade at this pixel
    vec2 cb=-vec2(cos(topTh),sin(topTh))*off; vec2 rd=pp-cb;
    float th2=topTh+6.2832/float(NB);
    float e2=length(pp+vec2(cos(th2),sin(th2))*off)-Rc;          // <0: distance to the edge of the blade lying above
    float grain=vnoise(vec2(length(rd)/R*55., topTh*9.))*.6+vnoise(vec2(length(rd)/R*170., topTh*3.))*.4;
    float lit=.5+.5*dot(normalize(rd), normalize(vec2(-.5,.8)));
    vec3 metal=mix(vec3(.02,.022,.03), uColor*uColor*.2, .6)*(.25+1.5*lit*lit)*(.65+.7*grain);
    metal*=.2+.8*smoothstep(0.,.12*R,-e2);                       // shadow under the blade above
    metal+=uColor*.05*pow(1.-clamp(topE/(.5*R),0.,1.),2.);
    metal+=mix(uColor,vec3(.7,.8,1.),.5)*.17*pow(lit,5.)*(.45+grain);                  // a brushed sheen where the blades face the light
    metal-=vec3(.1)*(1.-open);                                   // under black against the haze and the bloom of the seams; the sheen stays above it
    float fall=.15+.85*exp(-max(rl-a,0.)/(.5*R));
    float te=max(topE,0.);
    metal+=light*fall*(1.8*exp(-te/(.01*R))+.07*exp(-te/(.1*R)));                   // rim light on the blade edge
    metal+=light*fall*(2.*exp(e2/(.007*R))+.12*exp(e2/(.035*R)))*(1.-.6*open);          // seam of light under the next blade
    vec3 ap=base+light*exp(min(mx,0.)/(.05*R))*.35*(1.-open);
    col=mix(ap, metal, smoothstep(-px,px,mx));
    }
    col+=uColor*(pow(edge,4.)*.18+pow(edge,16.)*2.6*(.45+.55*max(rev*.5,open)))*(.8+.2*sin(uTime*1.3+atan(p.y,p.x)*3.))*rimLeft();
    gl_FragColor=vec4(col,1.);
  }`;

// FILM: a soap film over the window; two-beam interference from a drifting thickness field.
VIEW_FRAG.film = /* glsl */`
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float edge=smoothstep(-.22*R,0.,d); float rr=clamp(1.+d/R,0.,1.);
    float rev=smoothstep(0.,1.,uReveal), thin=1.-smoothstep(.1,.9,uNear)*rev;
    vec3 col;
    if(thin>.001){
    vec2 q=p/R; float t=uTime;
    vec2 w=vec2(fbm(q*1.3+vec2(0.,t*.05)+uSeed*9.), fbm(q*1.3+vec2(5.2,-t*.04)+uSeed*3.));
    float h=fbm(q*1.1+1.9*w+vec2(t*.03,-t*.06));                 // slow marbled swirls
    float grav=.5-.5*p.y/uHalf.y;                                // the film drains: thicker toward the bottom
    float h2=fbm(q*4.3+3.*w+vec2(-t*.05,t*.04));                 // finer eddies carried by the big ones
    float thick=clamp(.06+.42*h+.16*h2+.5*grav+.2*rr*rr*rr,0.,1.4)*(.3+.7*thin);
    vec3 V=normalize(vCam-vec3(p,0.)); float cosT=abs(V.z);
    float cosIn=sqrt(1.-(1.-cosT*cosT)/1.77);
    float opd=2.*1.33*(80.+900.*thick)*cosIn;                    // optical path difference, nm
    vec3 irid=.5-.5*cos(6.2832*opd/vec3(650.,540.,450.));
    irid=mix(vec3(dot(irid,vec3(.333))), irid, mix(.58,.9,rev));  // the shut film is pearl rather than neon
    float F=pow(1.-cosT,4.);
    float A=clamp(.1+.16*h2+.5*pow(rr,3.)+2.5*F,0.,.9);
    A=mix(.82, A, pow(rev,.6))*thin;                             // the film gives way a little ahead of the reveal
    vec2 off=(w-.5)*R*.05*thin*(.3+rr);
    vec3 next=nextAt(p+off);
    vec3 under=next;
    if(rev<.999){ vec3 dark=uColor*.02+vec3(.004,.005,.008);     // far off the shut film is a dark bubble; up close it waits as a veil
      under=mix(mix(dark, uVeil.a>.5 ? uVeil.rgb : veilAt(p,R)*.5+uColor*.05, uNear), next, rev); }
    vec3 sky=mix(vec3(1.), uColor, .3)*(.9+.5*rr);
    float glint=pow(fbm(q*3.2+w*4.+vec2(t*.05,0.)),5.)*14.;
    col=under*(1.-.3*A)+irid*sky*A*(1.+glint*.35);
    col+=mix(vec3(.62), irid*.75+.25, smoothstep(0.,.3,thin))*mix(vec3(1.),uColor,.5)*(pow(edge,3.)*.45*thin+pow(edge,14.)*2.8*rimLeft());
    } else col=nextAt(p)+vec3(.62)*mix(vec3(1.),uColor,.5)*pow(edge,14.)*2.8*rimLeft();
    gl_FragColor=vec4(col,1.);
  }`;

// LENS: a ball of glass. Far off the next world hangs in it upside down; as the camera closes, an upright,
// magnified image grows from the centre behind a bright focus ring, then relaxes to a flat window.
VIEW_FRAG.lens = /* glsl */`
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float edge=smoothstep(-.22*R,0.,d); float r=clamp(1.+d/R,0.,1.);
    float rev=smoothstep(0.,1.,uReveal), k=uNear;
    float f=mix(-.25,1.36,smoothstep(.06,.7,k));                 // the flip: a front that runs from the centre to the rim
    float w=1.-smoothstep(f-.3,f,r);                             // 0 inverted .. 1 upright
    float bulge=1.-smoothstep(.5,.93,k), gl=1.-smoothstep(.55,.93,k);
    float up=mix(1., .5+.5*r*r, bulge);
    float inv=-.92*(.55+.45*r*r);
    float m=mix(inv, up, w);                                     // exactly 1 once k >= .93
    float ca=.035*bulge*r;
    vec2 q=p*m;
    vec3 next=vec3(nextAt(q*(1.-ca)).r, nextAt(q).g, nextAt(q*(1.+ca)).b);
    vec3 col=next;
    if(rev<.999) col=mix(uVeil.a>.5 ? uVeil.rgb : veilAt(q,R), next, rev);
    float gw=min(1.,uGlow);                                      // quiet worlds get a quiet glass
    vec3 light=mix(uColor, max(nextAt(vec2(0.)),0.)+uColor*.2, rev);
    col+=light*exp(-m*m*90.)*w*(1.-w)*5.;                        // the focus ring sweeping outward
    vec2 pn=p/R;
    float body=sqrt(max(1.-r*r,0.));
    col*=mix(1., .34+.66*smoothstep(0.,.5,body), gl);            // glass darkens toward the limb
    vec3 env=mix(uColor*.25, vec3(.85,.92,1.), smoothstep(-.6,1.,pn.y))*.6;
    col=mix(col, env, gl*.3*pow(r,12.));                         // sky mirrored at grazing angles
    vec2 hp=pn-vec2(-.4,.46);
    float h1=.45*exp(-dot(hp,hp)*120.)+.5*exp(-dot(hp-vec2(.1,-.11),hp-vec2(.1,-.11))*420.);
    float h2=pow(r,6.)*smoothstep(.2,1.,dot(normalize(pn+1e-5),normalize(vec2(.55,-.83))));
    col+=gl*gw*(vec3(1.)*h1*1.2+mix(light,vec3(1.),.4)*h2*1.1);  // window highlight and the caustic crescent opposite
    col+=mix(uColor,vec3(1.),.5)*(pow(edge,4.)*.05*gl+pow(edge,14.)*2.3*rimLeft())*gw;
    gl_FragColor=vec4(col,1.);
  }`;

// CORONA: a dark moon that clears from the centre outward.
VIEW_FRAG.corona = /* glsl */`
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float edge=smoothstep(-.22*R,0.,d); float r=clamp(1.+d/R,0.,1.);
    vec2 dn=normalize(p+1e-5);
    float rev=smoothstep(0.,1.,uReveal), k=smoothstep(0.,.85,uNear)*rev;
    float n=(fbm(dn*2.2+uSeed*5.+uTime*.04)*.16+fbm(dn*7.+uTime*.07)*.05)*smoothstep(0.,.3,r);
    float cr=mix(-.06+.74*rev, 1.7, k), soft=.3;
    float clr=(1.-smoothstep(cr-soft, cr, r+n))*smoothstep(0.,.12,uReveal);
    vec3 moon=-vec3(.12)*(1.-.4*pow(r,6.));                     // a touch under black against the bloom of its own corona
    if(rev<.999) moon=mix(moon, uVeil.a>.5 ? uVeil.rgb : veilAt(p,R)*.35, uNear*(1.-rev)); // reached before the next world is ready: embers, not a hole
    vec3 pale=mix(uColor, vec3(1.,.97,.92), .7);
    vec3 col=mix(moon, nextAt(p), clr);
    float ring=exp(-pow((r+n-cr+soft*.35)/.09,2.));
    col+=pale*ring*.14*rev*(1.-k);                                // pale light at the edge of the clearing
    col+=(mix(uColor,vec3(1.,.45,.38),.4)*pow(edge,14.)*.7+pale*pow(edge,40.)*2.2)*rimLeft();   // chromosphere and limb
    gl_FragColor=vec4(col,1.);
  }`;

// FLOCK: no rim at all. The window ends in a ragged, misted contour; the lights are a separate instanced mesh.
// The view mesh draws (and writes depth for) the part of the window that is at least half opaque; the halo mesh
// lays the soft outer feather and the mist over the scene without depth, so nothing translucent behind is cut off.
const FLOCK_GLSL = /* glsl */`
  float flockCut(vec2 p){ vec2 dn=normalize(p+1e-5); float n=fbm(dn*2.6+uSeed*7.+vec2(uTime*.06,-uTime*.04));
    return mix(.8+.17*n, 1., smoothstep(.45,.95,uNear)); }      // the feather survives to the rim: no bare edge in the last metres
  float flockFeather(){ return mix(.22,.14,smoothstep(.45,.95,uNear)); }
  float flockMist(vec2 p, float rs){ vec2 dn=normalize(p+1e-5); return .45+.7*fbm(dn*5.+rs*3.-uTime*.15); }
  vec4 flockPix(vec2 p, float R, float rs, float cut, float a){  // premultiplied; a is exactly 1 over the part seen at the crossing
    float rev=smoothstep(0.,1.,uReveal), fade=1.-smoothstep(.5,.95,uNear)*rev;
    vec3 next=nextAt(p), col=next;
    if(rev<.999) col=mix(uVeil.a>.5 ? uVeil.rgb : veilAt(p,R)*.7, next, rev);
    float band=exp(-pow((rs-cut+.1)/.11,2.));
    vec3 glow=mix(uColor, next, .7*rev)*band*flockMist(p,rs)*.18*fade;   // the mist takes the next world's light, not a flat tint
    return vec4(col*a+glow, a);
  }
`;
VIEW_FRAG.flock = FLOCK_GLSL + /* glsl */`
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float rs=1.+d/R, cut=flockCut(p);
    float a=1.-smoothstep(cut-flockFeather(), cut, rs);
    if(a<CUT_A) discard;
    gl_FragColor=flockPix(p,R,rs,cut,a);
  }`;

const HALO_HEAD = /* glsl */`precision highp float;
  uniform float uTime, uGlow, uReveal, uNear, uSeed, uHaloSize; uniform vec3 uColor; varying vec2 vLocal;
  ${NOISE_GLSL}${SDF_GLSL}
`;
const HALO_FRAG = {};

HALO_FRAG.iris = /* glsl */`
  void main(){
    float d=portalSdf(vLocal); if(d<-0.05) discard;
    float R=min(uHalf.x,uHalf.y), x=max(d,0.)/R, ang=atan(vLocal.y,vLocal.x);
    float rev=smoothstep(0.,1.,uReveal);
    float lite=.45+.55*max(rev*.5,smoothstep(0.,.8,uNear));       // a shut iris keeps its light behind the blades
    float rim=exp(-x*x*2400.)*2.2*lite;
    float ring2=exp(-pow((x-.085)/.01,2.))*.8;                    // outer edge of the housing
    float ticks=exp(-pow((x-.045)/.022,2.))*pow(.5+.5*cos(ang*72.),10.)*.9;
    float soft=exp(-x*11.)*(.08+.3*rev);
    float far=exp(-x*2.2)*.05*(.4+.6*rev);
    vec3 col=uColor*(rim+ring2+ticks+soft+far)*uGlow+vec3(1.)*exp(-x*x*5000.)*1.2*lite*uGlow;
    gl_FragColor=vec4(col,1.);
  }`;

HALO_FRAG.film = /* glsl */`
  void main(){
    float d=portalSdf(vLocal); if(d<-0.05) discard;
    float R=min(uHalf.x,uHalf.y), x=max(d,0.)/R;
    vec2 dn=normalize(vLocal+1e-5);
    float ph=fbm(dn*2.+uSeed*9.+uTime*.03)*2.2+x*5.;
    vec3 hue=.5+.5*cos(6.2832*(ph+vec3(0.,.33,.67)));
    vec3 tint=mix(uColor, hue, .65);
    float rim=exp(-x*x*2600.)*2.4, soft=exp(-x*11.)*.4, far=exp(-x*2.6)*.05;
    gl_FragColor=vec4((tint*(rim+soft)+uColor*far+vec3(1.)*exp(-x*x*9000.)*1.2)*uGlow, 1.);
  }`;

HALO_FRAG.lens = /* glsl */`
  void main(){
    float d=portalSdf(vLocal); if(d<-0.05) discard;
    float R=min(uHalf.x,uHalf.y), x=max(d,0.)/R;
    vec2 dn=normalize(vLocal+1e-5);
    vec3 pale=mix(uColor, vec3(1.), .55);
    float rim=exp(-x*x*2200.)*2.1, soft=exp(-x*13.)*.08, far=exp(-x*2.4)*.04;
    float caus=exp(-x*7.)*pow(max(-dn.y*.8+dn.x*.6,0.),3.)*1.9*(1.-.7*uNear);   // light thrown out past the lower limb
    gl_FragColor=vec4((pale*(rim+soft+caus)+uColor*far+vec3(1.)*exp(-x*x*8000.)*1.1)*uGlow, 1.);
  }`;

HALO_FRAG.corona = /* glsl */`
  void main(){
    float d=portalSdf(vLocal); if(d<-0.05) discard;
    float R=min(uHalf.x,uHalf.y), x=max(d,0.)/R;
    vec2 dn=normalize(vLocal+1e-5);
    float open=max(smoothstep(0.,1.,uReveal)*.55, uNear);
    float ax=uSeed*3.1416; float eq=abs(dot(dn, vec2(cos(ax),sin(ax))));      // long streamers along one axis
    float s1=fbm(dn*3.2+uSeed*17.+vec2(0.,uTime*.02));
    float s2=fbm(dn*(9.+x*1.4-uTime*.12)+uSeed*3.);                           // structure drifting outward
    float rays=pow(vnoise(dn*36.+3.)*.6+vnoise(dn*88.+uTime*.05)*.4, 2.);
    float len=(.22+1.5*pow(eq,3.)*(.4+s1)+.6*s1*s1)*(1.+1.7*open);
    float stream=exp(-x/len)*(.1+1.05*s2*s2+.5*rays*exp(-x*1.4));
    float pxl=length(fwidth(vLocal))/R, dist=smoothstep(.012,.07,pxl);        // far off the limb stays at least a pixel or two wide,
    float inner=exp(-x*14.)*.5*(1.+1.5*dist)+exp(-x*x/max(1./1500.,pxl*pxl*2.5))*1.8*(1.+.6*dist);   // so the dark disc is always ringed by light
    vec2 bd=vec2(cos(uSeed*40.),sin(uSeed*40.)); float bdot=max(dot(dn,bd),0.);
    float bead=exp(-x*x*260.)*pow(bdot,160.)*6.+exp(-x*6.)*pow(bdot,24.)*.7; // the diamond on the ring
    vec3 pale=mix(uColor, vec3(1.,.97,.92), .7);
    vec3 col=pale*(inner+stream*.42)+vec3(1.)*(bead+exp(-x*x*6000.)*.7);
    col*=1.-.55*uNear;                                            // the fire thins as the streamers lengthen
    vec2 e=abs(vLocal)/uHaloSize; col*=1.-smoothstep(.72,1.,max(e.x,e.y));
    gl_FragColor=vec4(col*uGlow, 1.);
  }`;

// drawn with the view's vertex shader and header (it needs tNext), premultiplied instead of additive
HALO_FRAG.flock = FLOCK_GLSL + /* glsl */`
  void main(){
    vec2 p=vLocal; float d=portalSdf(p); float R=min(uHalf.x,uHalf.y);
    float rs=1.+d/R, cut=flockCut(p), x=rs-cut, fw=flockFeather();
    float a=1.-smoothstep(cut-fw, cut, rs);
    if(a>=.5 || x>1.5) discard;                                  // the view mesh has drawn the opaque part
    vec4 o=vec4(0.);
    if(a>0.) o=flockPix(p,R,rs,cut,a);
    float rev=smoothstep(0.,1.,uReveal), xo=max(x,0.);
    vec3 tint=mix(uColor, max(nextAt(normalize(p+1e-5)*R*.6),0.), .6*rev);
    float mist=exp(-xo*6.)*flockMist(p,rs)*smoothstep(-fw*.5,0.,x);
    float fade=1.-.75*smoothstep(.5,.95,uNear);
    o.rgb+=tint*(mist*.2+exp(-xo*2.)*.04*smoothstep(-fw*.5,0.,x))*uGlow*fade;
    gl_FragColor=o;
  }`;

// the lights of the living ring: instanced quads, each a short comet, flown round a torus in the vertex shader
const FLOCK_VERT = /* glsl */`attribute vec4 aSeed;
  uniform float uTime, uNear, uSeed, uPx;
  varying vec2 vP; varying float vL, vB, vHue;
  ${SDF_GLSL}
  vec3 flockPos(float t){
    float th=6.2832*(aSeed.x+t*(.05+.035*aSeed.z));
    th+=.22*sin(th*2.-t*.35+uSeed*6.)+.1*sin(th*5.+t*.5);        // the flock bunches and thins as it turns
    float ph=6.2832*(aSeed.y+t*(.06+.12*fract(aSeed.z*7.31)));
    vec2 dir=vec2(cos(th),sin(th));
    float s=0.; for(int i=0;i<12;i++) s-=portalSdf(dir*s);       // walk out to the edge of the opening, whatever its shape
    float R=min(uHalf.x,uHalf.y), part=uNear*uNear, m=fract(aSeed.w*13.7);
    float minor=R*(.05+.17*m*m)*(1.+2.2*part);
    float rad=s+R*.03+R*1.15*part+minor*cos(ph)+R*.03*sin(t*.7+aSeed.x*40.);
    return vec3(dir*rad, minor*sin(ph)*1.4);
  }
  void main(){
    vec3 h=(modelViewMatrix*vec4(flockPos(uTime),1.)).xyz, tl=(modelViewMatrix*vec4(flockPos(uTime-.13),1.)).xyz;
    float R=min(uHalf.x,uHalf.y);
    float wd0=R*.013*(.6+.9*aSeed.w), wmin=max(1.2*(-h.z)/(uPx*projectionMatrix[1][1]), 1e-5);
    float wd=max(wd0,wmin), thin=min(1.,wd0/wd);                 // never thinner than a pixel, but then no brighter either
    vec2 dv=h.xy-tl.xy; float len=length(dv); vec2 dir2=len>1e-5 ? dv/len : vec2(1.,0.), side=vec2(-dir2.y,dir2.x);
    vec2 uvq=position.xy+.5;
    vec3 c=mix(tl,h,uvq.x);
    c.xy+=(dir2*(uvq.x*2.-1.)+side*(uvq.y*2.-1.))*wd*2.;
    vL=len/wd; vP=vec2(mix(-2.,vL+2.,uvq.x),(uvq.y*2.-1.)*2.);
    vHue=fract(aSeed.w*5.3);
    vB=(1.5+2.6*fract(aSeed.z*3.7))*(.62+.38*sin(uTime*(2.+4.*aSeed.z)+aSeed.x*90.))*(1.-.45*uNear*uNear);
    vB*=thin*thin*mix(.5,1.,smoothstep(0.,.25,wd0/wmin));        // far off the flock is a soft wreath, not a glare
    gl_Position=projectionMatrix*vec4(c,1.);
  }`;
const FLOCK_FRAG = /* glsl */`precision highp float;
  uniform vec3 uColor; uniform float uGlow;
  varying vec2 vP; varying float vL, vB, vHue;
  void main(){
    float cx=clamp(vP.x,0.,vL); float dd=length(vP-vec2(cx,0.));
    vec2 hd=vP-vec2(vL,0.);
    float g=exp(-dd*dd*3.5)*mix(.1,1.,pow(cx/max(vL,1e-3),2.))+exp(-dot(hd,hd)*1.2)*.5;
    vec3 tint=uColor*mix(vec3(1.2,.85,.55), vec3(.7,.95,1.3), vHue);   // warm and cool lights either side of the portal colour
    gl_FragColor=vec4(mix(tint, vec3(1.), .2+.25*vHue)*g*vB*(.5+.5*uGlow), 1.);
  }`;

function seed01(spec, color) {
  let v = spec.seed;
  if (typeof v === 'string') { let h = 2166136261; for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619); v = (h >>> 0) / 4294967296 * 1000; }
  if (typeof v !== 'number' || !isFinite(v)) v = color.r * 12.9898 + color.g * 78.233 + color.b * 37.719 + (spec.radius ?? spec.width ?? 0) * 3.17 + (spec.height ?? 0) * 1.31 + (spec.revealDistance || 0) * 0.013 + (spec.glow ?? 1) * 5.3;
  const x = Math.sin(v * 12.9898 + 1.2345) * 43758.5453; return x - Math.floor(x);
}

export class Portal {
  // spec: { shape: 'circle'|'rect'|'arch', radius, width, height, color, glow, halo, frame,
  //         style: one of PORTAL_STYLES (default 'ring'), seed: number or string (default: derived from the other fields) }
  // 'corona' and 'lens' are round by nature: on a rect or an arch they fall back to 'iris' and 'film'.
  // frame: 0 is a bare opening: the plain window with no halo, no light inside the rim and no shimmer at its edge,
  // for a world that builds its own surround (or wants none). It is always the 'ring' look.
  // veil: a colour ('#rrggbb', 0xrrggbb or a THREE.Color). While the next world is not there the opening shows that one
  // flat colour in place of the swirl of its look (for flat, printed worlds); not given, the swirl as always.
  constructor(spec = {}) {
    const shape = spec.shape || 'circle';
    const hx = shape === 'circle' ? (spec.radius ?? 7) : (spec.width ?? 10) / 2;
    const hy = shape === 'circle' ? hx : (spec.height ?? 14) / 2;
    this.shape = shape; this.hx = hx; this.hy = hy;
    this.boundR = Math.hypot(hx, hy);
    const color = new THREE.Color(spec.color ?? '#9fd0ff');
    const shapeId = shape === 'circle' ? 0 : shape === 'rect' ? 1 : 2;
    const bare = spec.frame === 0 || spec.frame === false;
    let style = !bare && PORTAL_STYLES.includes(spec.style) ? spec.style : 'ring';
    if (shape !== 'circle') style = style === 'corona' ? 'iris' : style === 'lens' ? 'film' : style;
    const ring = style === 'ring', flock = style === 'flock', hasHalo = spec.halo !== false && !bare;
    const tNext = { value: null };
    this.style = style;
    const shared = { uTime: { value: 0 }, uColor: { value: color }, uShape: { value: shapeId }, uHalf: { value: new THREE.Vector2(hx, hy) },
      uReveal: { value: 0 }, uNear: { value: 0 }, uSeed: { value: seed01(spec, color) },
      uGain: { value: new THREE.Vector3(1, 1, 1) }, uNextPV: { value: new THREE.Matrix4() }, tBloom: { value: null }, uDewash: { value: 0 },
      uVeil: { value: new THREE.Vector4(0, 0, 0, 0) } };
    this._shared = shared;
    this.setVeil(spec.veil);

    this.viewMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, tNext, uGlow: { value: bare ? 0 : spec.glow ?? 1 } },
      vertexShader: !ring ? VIEW_VERT : /* glsl */`uniform mat4 uNextPV; varying vec2 vLocal; varying vec4 vClip, vScr;
        void main(){ vLocal=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); vScr=gl_Position; vClip=uNextPV*vec4(position,1.); }`,
      fragmentShader: !ring ? (flock ? `#define CUT_A ${hasHalo ? '.5' : '.004'}\n` : '') + VIEW_HEAD + VIEW_FRAG[style] : /* glsl */`precision highp float;
        uniform sampler2D tNext, tBloom; uniform float uReveal, uTime, uGlow, uNear, uDewash; uniform vec3 uColor, uGain; uniform vec4 uVeil;
        varying vec2 vLocal; varying vec4 vClip, vScr;
        ${NOISE_GLSL}${SDF_GLSL}${WASH_GLSL}
        void main(){
          vec2 suv = vClip.xy/max(vClip.w,1e-4)*.5+.5;
          float d = portalSdf(vLocal);
          float R = min(uHalf.x,uHalf.y);
          float edge = smoothstep(-.22*R, 0., d);
          float ang = atan(vLocal.y, vLocal.x);
          vec2 dirn = normalize(vLocal+1e-5);
          ${bare ? '' : 'suv += dirn*edge*edge*(.010*sin(uTime*1.7+ang*5.)+.006*sin(uTime*2.9-ang*9.));'}
          vec3 next = textureLod(tNext, clamp(suv,0.,1.), 0.).rgb*uGain-wash();
          float r = length(vLocal)/R;
          float sw = fbm(vec2(ang*1.6+r*2.5-uTime*.25, r*3.5-uTime*.5));
          float sw2 = fbm(vec2(ang*3.-uTime*.15, r*7.+uTime*.3));
          float wr = smoothstep(1.6,3.1416,abs(ang));                 // cross-fade over the atan seam, or the veil shows a hard cut to the left of centre
          if(ang<0. && wr>0.){ float a2=ang+6.2832;
            sw=mix(sw, fbm(vec2(a2*1.6+r*2.5-uTime*.25, r*3.5-uTime*.5)), wr); sw2=mix(sw2, fbm(vec2(a2*3.-uTime*.15, r*7.+uTime*.3)), wr); }
          vec3 veil = uVeil.a>.5 ? uVeil.rgb : uColor*(.12+1.5*pow(sw,2.2)+.6*pow(sw2,3.))*(.35+.9*r);   // portal.veil: one flat colour
          vec3 col = mix(veil, next, uReveal);
          // light inside the rim. Before the next world shows, it is the old broad glow; once it shows, only a thin
          // bright edge is left, so the wash no longer pales the outer third of the picture. Both follow portal.glow.
          float rev = smoothstep(0., 1., uReveal);
          float wash = mix(pow(edge,2.5)*1.6 + pow(edge,10.)*3., pow(edge,5.)*.22 + pow(edge,16.)*3., rev);
          col += uColor*wash*min(uGlow,1.5)*(.8+.2*sin(uTime*1.3+ang*3.))*(1.-.5*smoothstep(.72,1.,uNear)*rev);
          gl_FragColor = vec4(col,1.);
        }`,
      side: THREE.DoubleSide, toneMapped: false, fog: false,
    });
    this.view = new THREE.Mesh(shapeGeometry(shape, hx, hy), this.viewMat);
    this.view.renderOrder = 5; this.view.frustumCulled = false;
    // the living ring has no rim, so its window feathers out with real alpha: drawn first among the transparent
    // objects (still writing depth) so that anything translucent in front of it is laid over it as before
    if (flock) { this.viewMat.transparent = true; this.viewMat.premultipliedAlpha = true; this.view.renderOrder = -1; }

    const haloSize = Math.max(hx, hy) * (style === 'corona' ? 5.2 : 2.6);
    this.haloMat = new THREE.ShaderMaterial({
      uniforms: flock ? { ...shared, tNext, uGlow: { value: spec.glow ?? 1 }, uHaloSize: { value: haloSize } } : { ...shared, uGlow: { value: spec.glow ?? 1 }, uHaloSize: { value: haloSize } },
      vertexShader: flock ? VIEW_VERT : /* glsl */`varying vec2 vLocal; void main(){ vLocal=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: flock ? VIEW_HEAD + HALO_FRAG.flock : !ring ? HALO_HEAD + HALO_FRAG[style] : /* glsl */`precision highp float;
        uniform float uTime, uGlow; uniform vec3 uColor; varying vec2 vLocal;
        ${NOISE_GLSL}${SDF_GLSL}
        void main(){
          float d = portalSdf(vLocal); if(d<-0.05) discard;
          float R = min(uHalf.x,uHalf.y); float x = max(d,0.)/R;
          float ang = atan(vLocal.y, vLocal.x);
          float wisp = fbm(vec2(ang*2.5+uTime*.2, x*5.-uTime*.7));
          float wr = smoothstep(1.6,3.1416,abs(ang));                 // the same cross-fade over the atan seam
          if(ang<0. && wr>0.) wisp=mix(wisp, fbm(vec2((ang+6.2832)*2.5+uTime*.2, x*5.-uTime*.7)), wr);
          float rim = exp(-x*x*900.)*3.2;
          float soft = exp(-x*7.)*(.35+.9*wisp*wisp);
          float far = exp(-x*2.2)*.07;
          vec3 col = uColor*(rim+soft+far)*uGlow + vec3(1.)*exp(-x*x*4000.)*1.5*uGlow;
          gl_FragColor = vec4(col, 1.);
        }`,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false,
    });
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(haloSize * 2, haloSize * 2), this.haloMat);
    this.halo.position.z = -0.02; this.halo.renderOrder = 6; this.halo.frustumCulled = false;
    if (flock) { this.haloMat.blending = THREE.NormalBlending; this.haloMat.premultipliedAlpha = true; }   // feather over, mist added

    this.group = new THREE.Group();
    this.group.add(this.view);
    if (hasHalo) this.group.add(this.halo);
    this.group.matrixAutoUpdate = false;
    if (flock) this._makeFlock(shared, spec);

    // rim sample points (local) for screen bounds and near-plane fitting
    this.rim = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (shape === 'circle') this.rim.push(new THREE.Vector3(Math.cos(a) * hx, Math.sin(a) * hy, 0));
      else { const c = Math.cos(a), s = Math.sin(a), k = 1 / Math.max(Math.abs(c), Math.abs(s)); this.rim.push(new THREE.Vector3(c * k * hx, s * k * hy, 0)); }
    }
    this.rim.push(new THREE.Vector3(0, 0, 0));
  }

  place(frameMatrix) { (this._frame || (this._frame = new THREE.Matrix4())).copy(frameMatrix); this._grow = 1; this.group.matrix.copy(frameMatrix); this.group.matrixWorldNeedsUpdate = true; this.group.updateMatrixWorld(true); }
  // the opening at k of its size about its own middle (the engine's drawWithin: a ring first drawn late opens over some
  // metres of route and never appears in one frame)
  setGrow(k) {
    if (k === this._grow || !this._frame) return;
    this._grow = k; this.group.matrix.copy(this._frame).scale(new THREE.Vector3(k, k, k)); this.group.matrixWorldNeedsUpdate = true; this.group.updateMatrixWorld(true);
  }
  setTime(t) { this.viewMat.uniforms.uTime.value = t; }
  setReveal(r) { this.viewMat.uniforms.uReveal.value = r; }
  setTexture(tex) { this.viewMat.uniforms.tNext.value = tex; }
  setNear(k) { this._shared.uNear.value = Math.min(1, Math.max(0, k)); }
  // what the next world's linear colour is multiplied by inside the opening (the engine's exposure and tint match)
  setGain(r, g, b) { this._shared.uGain.value.set(r, g, b); }
  // the flat veil (see the constructor): a colour, or null for the look's own swirl. The colour is taken the way uColor is,
  // so in a post.flat world '#e8d8b0' reaches the screen as #e8d8b0.
  setVeil(c) { const v = this._shared.uVeil.value; if (c == null || c === false) v.set(0, 0, 0, 0); else { const k = new THREE.Color(c); v.set(k.r, k.g, k.b, 1); } }
  // the glow pass's buffer and how much of it the opening takes back (0 = none)
  setDewash(tex, k) { this._shared.tBloom.value = k > 0 ? tex : null; this._shared.uDewash.value = tex ? k : 0; }
  // the matrix from portal space to the clip space of the camera that drew the next world
  setNextView(m) { this._shared.uNextPV.value.copy(m); }
  dispose() {
    this.view.geometry.dispose(); this.halo.geometry.dispose(); this.viewMat.dispose(); this.haloMat.dispose();
    if (this.flock) { this.flock.geometry.dispose(); this.flock.material.dispose(); this.flock.dispose(); }   // the last frees instanceMatrix
  }

  _makeFlock(shared, spec) {
    const N = 520, arr = new Float32Array(N * 4);
    let a = Math.floor(shared.uSeed.value * 4294967296) >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let i = 0; i < N * 4; i++) arr[i] = rnd();
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(arr, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...shared, uGlow: { value: spec.glow ?? 1 }, uPx: { value: 270 } },
      vertexShader: FLOCK_VERT, fragmentShader: FLOCK_FRAG,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false,
    });
    this.flock = new THREE.InstancedMesh(geo, mat, N);
    this.flock.renderOrder = 7; this.flock.frustumCulled = false;
    this.flock.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); mat.uniforms.uPx.value = (rt ? rt.height : renderer.domElement.height) * 0.5; };
    this.group.add(this.flock);
  }

  // Which look a world's exit gets when the world does not ask for one. rng: a function returning [0,1).
  static pickStyle(rng, def = {}) {
    const r = typeof rng === 'function' ? rng() : 0.5;
    if (r < 0.34) return 'ring';
    const cat = def.category === 'wonders' ? def.placeKind : def.category, weird = def.weirdness ?? 0;   // a wonder's exit follows the kind of place it is
    const w = { iris: 1, film: 1, lens: 1, corona: 1, flock: 1 };
    if (cat === 'alien' || cat === 'bizarre') { w.corona = 2.3; w.lens = 2.1; w.iris = 0.8; w.film = 0.8; w.flock = 0.8; }
    else if (cat === 'interior' || cat === 'city') { w.iris = 1.9; w.film = 1.3; w.corona = 0.7; }
    else if (cat === 'ocean') { w.film = 1.6; w.lens = 1.5; w.flock = 1.4; w.iris = 0.6; }
    else if (cat === 'sky') { w.flock = 1.6; w.corona = 1.4; w.film = 1.2; }
    else if (cat === 'wilderness') { w.flock = 1.8; w.film = 1.2; w.lens = 1.1; w.iris = 0.6; }
    else if (cat === 'domestic') { w.lens = 1.7; w.film = 1.5; w.iris = 1.2; w.corona = 0.6; }
    w.corona += 1.5 * weird; w.lens += 1.2 * weird;
    const names = Object.keys(w); let total = 0; for (const k of names) total += w[k];
    let x = ((r - 0.34) / 0.66) * total;
    for (const k of names) { x -= w[k]; if (x < 0) return k; }
    return 'flock';
  }
}
