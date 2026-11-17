// The Ground Turns: the device. One GLSL function sky(dir) in the SKY FRAME (engine space, which never moves) is shared by
// the dome, the sea, the cistern and the portal card, so every star is nailed to the screen; the LAND is one group whose
// matrix is written from u alone:  land.matrix = T(P(u)) R(k, turn(u)) T(-G(u)),  k the polar axis through the lens.
// Lamps fixed to the land leave their past places hanging in the sky as arcs centred on the pole star.
import * as THREE from 'three';

const D2R = Math.PI / 180;
export const TURN_MAX = 52.5;                       // degrees turned at u = 1
// turn(u) in degrees: level until 0.12, eased in to 0.20, then the true 15 degrees an hour at one second for six minutes
export function turnDeg(u) {
  const a = u < 0.12 ? 0 : u < 0.20 ? (u - 0.12) * (u - 0.12) / 0.16 : 0.04 + (u - 0.20);
  return TURN_MAX * a / 0.84;
}
// the u at which the turn was t degrees (for the arcs: where the camera stood over the land then)
export const uOfTurn = (t) => 0.16 + 0.84 * t / TURN_MAX;
// how far north along the track the lens has drifted at u: one straight line, eased out (1.6 m/s at first, all but still at the
// end), so the household grows in the first half of the night and the cistern is still whole in frame at the last
export const DRIFT = 28, DRIFT_P = 2.4;
export const driftN = (u) => DRIFT * (1 - Math.pow(Math.max(0, 1 - u), DRIFT_P));

// equatorial (hour angle H, declination dec, both radians) -> engine direction (+X east, +Y up, -Z north) at latitude lat
function eq2dir(H, dec, lat, out = new THREE.Vector3()) {
  const E = -Math.cos(dec) * Math.sin(H);
  const U = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const N = Math.cos(lat) * Math.sin(dec) - Math.sin(lat) * Math.cos(dec) * Math.cos(H);
  return out.set(E, U, -N).normalize();
}
// right ascension (hours), declination (degrees), peak brightness (linear), tint
const REAL_STARS = [
  [2.530, 89.26, 6.0, '#E6EEFF'],   // Polaris: the pivot, a little brighter than life so it is found at once
  [11.062, 61.75, 4.6, '#FFE9C8'], [11.031, 56.38, 3.4, '#DCE6FF'], [11.897, 53.69, 3.4, '#DCE6FF'], [12.257, 57.03, 2.4, '#DCE6FF'],
  [12.900, 55.96, 4.6, '#DCE6FF'], [13.399, 54.93, 4.0, '#DCE6FF'], [13.792, 49.31, 4.4, '#CFE0FF'],          // the Plough
  [0.153, 59.15, 3.6, '#F2F0E6'], [0.675, 56.54, 3.8, '#FFE0B8'], [0.945, 60.72, 3.8, '#CFE0FF'], [1.430, 60.24, 3.0, '#DCE6FF'], [1.907, 63.67, 2.2, '#CFE0FF'],   // Cassiopeia
  [5.278, 46.00, 7.0, '#FFE08A'],   // Capella, the yellow one the falling sea line uncovers
];

// ---- the one sky, in the sky frame. w widens every star (1 on the dome; more in a reflection), glow scales airglow and dawn.
export const SKY_GLSL = /* glsl */`
  uniform vec3 uLandUp, uSunDir, uGal; uniform float uSunAlt, uPx, uTime, uCells2; uniform vec4 uStar[14]; uniform vec3 uStarCol[14]; uniform vec4 uVenus;
  float gtH21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float gtVn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(gtH21(i),gtH21(i+vec2(1.,0.)),f.x), mix(gtH21(i+vec2(0.,1.)),gtH21(i+vec2(1.,1.)),f.x), f.y); }
  float gtFbm(vec2 p){ return .5*gtVn(p)+.25*gtVn(p*2.03+7.1)+.125*gtVn(p*4.01+3.3)+.0625*gtVn(p*8.1+1.7); }
  vec2 gtOct(vec3 d){ d/=(abs(d.x)+abs(d.y)+abs(d.z)); vec2 p=d.xz;
    if(d.y<0.){ vec2 s=vec2(p.x>=0.?1.:-1., p.y>=0.?1.:-1.); p=(1.-abs(p.yx))*s; } return p; }
  vec3 gtUnoct(vec2 p){ vec3 v=vec3(p.x, 1.-abs(p.x)-abs(p.y), p.y); float t=max(-v.y,0.);
    v.x+= v.x>=0.? -t : t; v.z+= v.z>=0.? -t : t; return normalize(v); }
  // one star per cell at a hashed place kept clear of the cell's edge, so no neighbour search is needed
  vec3 gtLayer(vec3 dir, float cells, float gain, float cap, float sig, float lowTw, float dens, float veil){
    vec2 g=(gtOct(dir)*.5+.5)*cells, id=floor(g);
    float h1=gtH21(id+11.3), h2=gtH21(id+47.7), h3=gtH21(id+83.1), h4=gtH21(id+5.9);
    vec3 sd=gtUnoct(((id+.14+.72*vec2(h1,h2))/cells)*2.-1.);
    vec3 dv=dir-sd; float d2=dot(dv,dv);
    float hh=max(h3,.012); float peak=min(gain*dens/(hh*sqrt(hh)), cap);
    float tw=1.+(.20+.40*lowTw)*sin(uTime*(3.+6.*h4)+h1*40.);
    float vis=clamp(1.-veil/max(peak,1e-3), 0., 1.);
    vec3 tint=mix(vec3(.62,.75,1.), vec3(1.,.80,.56), h4*h4);
    float sg=sig*(1.+.55*smoothstep(1.,2.4,peak));                                     // the brightest are a little wider, not sharper: a round shape for the bloom
    return tint*(peak*tw*vis*exp(-d2/(2.*sg*sg)));
  }
  vec3 gtSmoothSky;                                                                  // the last sky4 without its stars and sun (for the still waters)
  vec3 sky4(vec3 dir, float w, float glow, float mwG){
    float h=dot(dir,uLandUp);
    float hp=max(h,0.);
    // night: zenith, and an airglow band hugging the land's horizon
    vec3 col=(mix(vec3(.030,.040,.066), vec3(.019,.026,.050), smoothstep(0.,.9,hp))+vec3(.016,.030,.036)*exp(-hp/.060))*glow;
    // the Milky Way: a river of star clouds about the galactic plane, not a beam: it wanders, swells and thins along its
    // length, is knotted with brighter clouds and split by dark rifts, and sinks into the haze near the land's horizon
    // (brightness only: its place in the sky is a function of dir alone)
    float b=dot(dir,uGal);
    vec3 ax=normalize(cross(uGal,vec3(.31,.72,.62))); vec3 ay=cross(uGal,ax);
    float la=atan(dot(dir,ay),dot(dir,ax)+1e-6);
    vec2 mp=vec2(la*4., b*9.);
    float f1=gtFbm(mp*1.7+3.), f2=gtFbm(mp*5.+11.);
    float f3=gtFbm(mp*vec2(2.6,9.)+23.);
    float wl=gtVn(vec2(la*2.3+1.7,.5)), wl2=gtVn(vec2(la*5.1+8.,3.5));
    float bw=b+.050*(wl-.5)+.040*(f1-.5);                                          // the band meanders
    float wid=.080+.085*wl2;                                                       // and is nowhere the same width
    float lane=(1.-smoothstep(0.,.040,abs(bw-.012-.05*(f1-.5))))*.95+(1.-smoothstep(0.,.026,abs(bw+.062-.07*(f2-.5))))*.6;
    float band=exp(-(bw*bw)/(wid*wid));
    float cloud=smoothstep(.25,.85,f2)*.9+.35;
    float knots=.30+1.15*smoothstep(.28,.78,gtFbm(vec2(la*3.1+5.,b*13.)+f1));      // star clouds and gaps along it
    float mw=band*(.32+.68*f1)*knots*(1.-.90*min(lane,1.)*(.35+.65*f3));
    float core=exp(-(bw*bw)/(.032*.032))*cloud*(1.-min(lane,1.)*.9)*(.35+1.0*wl);
    float ext=.30+.70*smoothstep(0.,.045,hp);                                      // it stands on the land's horizon: only the last two degrees thin in the haze
    col+=(vec3(.235,.335,.600)*(.40*mw*(.40+1.2*f2))+vec3(.62,.50,.44)*(.29*core*f1)+vec3(.19,.28,.54)*(.060*exp(-abs(bw)/.20)))*(mwG*ext);
    // dawn is a place: a band along the tilted horizon, strongest toward the sun's azimuth, from the sun's depth alone.
    // First a deep blue on the low rim (the sun some 20 degrees down, u 0.45), then rose (u 0.6), then peach and gold against the sea line.
    float tw=smoothstep(-.40,-.14,uSunAlt);
    float dawn=smoothstep(-.31,-.04,uSunAlt);
    vec3 sh=uSunDir-uLandUp*dot(uSunDir,uLandUp); sh/=max(length(sh),1e-3);
    vec3 dh=dir-uLandUp*h; dh/=max(length(dh),1e-3);
    float caz=dot(dh,sh);
    float azw=exp(-(1.-caz)/(.09+.27*tw));                                         // a place: a third of the compass at most
    float day=smoothstep(-.02,.06,uSunAlt);
    float d15=dawn*sqrt(dawn);
    // the blue belongs to the rim on the sun's side (no floor round the compass, a low scale height): the sky away from it stays night
    vec3 dawnB=vec3(.022,.072,.235)*(exp(-hp/(.060+.085*tw))*tw*(.03+.97*azw)*2.0);
    vec3 dawnC=vec3(.50,.135,.165)*(exp(-hp/(.040+.075*dawn))*d15*azw*.62)
      +vec3(1.45,.60,.19)*(azw*azw*exp(-hp/(.020+.058*dawn))*dawn*dawn*1.05)
      +vec3(.95,.50,.24)*(day*azw*azw*exp(-hp/.13)*.50)
      +vec3(.008,.022,.066)*(dawn*dawn*(.3+.7*day)*azw*exp(-hp/.45));
    dawnC*=glow/(1.+.85*max(dawnC.r,max(dawnC.g,dawnC.b)));                          // a soft knee that keeps the hue: the rim glows rose and gold, never white
    dawnB*=glow/(1.+2.5*max(dawnC.r,dawnC.g));                                      // and the blue gives way where the warm rim is, so the two do not sum to lavender
    col+=dawnC+dawnB;
    gtSmoothSky=col;
    float veil=dot(dawnC+.22*dawnB,vec3(.3,.5,.2))*7.;                              // only the rim's own glow puts stars out: never the fixed sky at large
    // stars: two hashed layers and fourteen real ones, each a gaussian never narrower than about 1.2 pixels, flux kept
    float sig=.52*uPx*w, fl=1./(w*w);
    float lowTw=exp(-hp/.2);
    col+=gtLayer(dir,64.,.0105*fl,2.6*fl,sig,lowTw,1.+.8*min(mw,1.2),veil);
    col+=gtLayer(dir,uCells2,.0030*fl,.62*fl,sig*.9,lowTw,1.+2.4*min(mw,1.2),veil);
    for(int i=0;i<14;i++){ vec3 dv=dir-uStar[i].xyz; float d2=dot(dv,dv); float s2=sig*1.45;
      float tw=1.+(.025+.2*lowTw)*sin(uTime*(3.1+.43*float(i))+float(i)*1.7);
      col+=uStarCol[i]*(uStar[i].w*fl*tw*clamp(1.-veil/uStar[i].w,0.,1.))*(.85*exp(-d2/(2.*s2*s2))+step(w,1.08)*(.055*exp(-sqrt(d2)/(uPx*2.4))+.010*exp(-sqrt(d2)/(uPx*7.)))); }
    { vec3 pv=dir-uStar[0].xyz; vec3 px=normalize(cross(uStar[0].xyz,vec3(0.,0.,1.))); vec3 py=cross(px,uStar[0].xyz);
      float ax=abs(dot(pv,px)), ay=abs(dot(pv,py)), l2=dot(pv,pv);
      float vis0=clamp(1.-veil/3.,0.,1.);
      col+=vec3(.75,.85,1.)*(fl*vis0*(1.1*(exp(-ax/.0016-ay/.030)+exp(-ay/.0016-ax/.030))+.35*exp(-sqrt(l2)/.012))); }
    // the rare morning star: steady, no twinkle
    { vec3 dv=dir-uVenus.xyz; float s2=sig*1.5; col+=vec3(1.,.8,.56)*(uVenus.w*fl*exp(-dot(dv,dv)/(2.*s2*s2))); }
    // the sun: a disc of 0.27 degrees that never moves, and a small coloured aureole
    { vec3 dv=dir-uSunDir; float th=sqrt(dot(dv,dv)); float ed=max(uPx*w,3e-4);
      col+=vec3(30.,22.,13.)*(1.-smoothstep(.0047-ed,.0047+ed,th))
          +vec3(1.,.62,.30)*(glow*(10.*exp(-th/.0115)+1.1*exp(-th/.036)+dawn*dawn*(.26*exp(-th/.10)+.030*exp(-th/.26)))); }
    return col;
  }
  vec3 sky(vec3 dir, float w, float glow){ return sky4(dir,w,glow,glow); }
`;

// ---- the land's own light: no lamps, a cold hemisphere whose up is the land's up, a faint fill from the Milky Way, and
// (from u 0.895) the sun, with the dawn shadows worked out analytically from four boxes in the land frame.
export const LAND_GLSL = /* glsl */`
  uniform vec3 uSunLocal, uGalLocal; uniform float uSunI, uDawn, uTw; uniform vec3 uBoxMin[9], uBoxMax[9];
  float gtShadow(vec3 p){
    vec3 L=uSunLocal; L=vec3(abs(L.x)<1e-4?1e-4:L.x, abs(L.y)<1e-4?1e-4:L.y, abs(L.z)<1e-4?1e-4:L.z);
    vec3 inv=1./L; float sh=0.;
    for(int i=0;i<9;i++){ vec3 a=(uBoxMin[i]-p)*inv, b=(uBoxMax[i]-p)*inv; vec3 lo=min(a,b), hi=max(a,b);
      float tn=max(max(lo.x,lo.y),lo.z), tf=min(min(hi.x,hi.y),hi.z);
      sh=max(sh, smoothstep(0.,.9,tf-max(tn,0.02))); }
    return 1.-sh;
  }
  // n and p in the land frame; lit = how much of the sun reaches this point besides the eight boxes (the turf's own shadows)
  vec3 gtLit2(vec3 alb, vec3 n, vec3 p, float graze, float lit){
    float up=.35+.65*(.5+.5*n.y);
    vec3 amb=mix(vec3(.012,.015,.021), vec3(.215,.26,.355)*(1.+.20*uTw), up);
    amb+=vec3(.35,.46,.70)*(.05*max(dot(n,uGalLocal),0.));
    // the glowing rim of the sky lights the land from its own side long before the sun: sky light, no lamp, no shadow
    vec3 dl=normalize(vec3(uSunLocal.x,.32,uSunLocal.z)+vec3(1e-4,0.,0.)); float dw=max(dot(n,dl)*.8+.2,0.);
    amb+=(vec3(.040,.095,.270)*(uTw*(1.-.6*uDawn))+vec3(.95,.36,.22)*(uDawn*uDawn))*((dw*dw+.34*min(graze,1.))*.66*(1.-.6*min(uSunI,1.)));
    float bsh=1.; if(uSunI>0.) bsh=gtShadow(p+n*.03);                                // nine boxes: not walked while there is no sun (the term below is multiplied by uSunI)
    vec3 sun=vec3(1.,.55,.28)*(uSunI*(max(dot(n,uSunLocal),0.)+graze)*bsh*lit);
    return alb*(amb+sun);
  }
  vec3 gtLit(vec3 alb, vec3 n, vec3 p, float graze){ return gtLit2(alb,n,p,graze,1.); }
`;

// the turf: one relief (wind-rows and tussocks) shared by the ground and by the blades that stand on it
const TURF_GLSL = /* glsl */`
  float gH(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float gN(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(gH(i),gH(i+vec2(1.,0.)),f.x), mix(gH(i+vec2(0.,1.)),gH(i+vec2(1.,1.)),f.x), f.y); }
  float gtOnTurf(vec2 p){ return smoothstep(1.0,1.55,abs(p.x))+step(4.,p.y); }                 // 0 on the track, 1 on the grass
  // the low relief, 0..1: rows the west wind has combed (long east-west) and tussocks about a metre across
  float gtRelS(vec2 p){ return (.52*gN(vec2(p.x*.17,p.y*.78)+5.)+.48*gN(p*1.05+17.))*min(gtOnTurf(p),1.); }
  float gtRel(vec2 p, float k1, float k2){ return gtRelS(p)*k1+.20*gN(p*3.3+3.)*k2*min(gtOnTurf(p),1.); }
  float gtBig(vec2 p){ return gN(p*.045+3.)*.6+gN(p*.13+7.)*.4; }                              // drifts of paler bent and darker turf
  vec3 gtTurfCol(float big, float h){ return mix(vec3(.056,.078,.058), vec3(.122,.148,.086), clamp(big*.7+.35*h,0.,1.))*(.50+.85*h); }
  float gtGust(vec2 p, float t){ float gx=p.x*.050-t*.42+1.7*gN(p*.02), gz=p.y*.09+t*.03;
    return smoothstep(.50,.92,gN(vec2(gx,gz)))+.5*smoothstep(.55,.95,gN(vec2(gx*2.3+9.,gz*2.1))); }   // the west wind crossing the grass
`;

// the sky, sun and stars for a latitude (degrees). Everything is derived so the sun's first limb clears the sea at u 0.895.
export function makeAstronomy(latDeg = 30) {
  const lat = latDeg * D2R, dec = 23.44 * D2R, alt0 = -(0.26 + 0.27) * D2R;
  const k = new THREE.Vector3(0, Math.sin(lat), -Math.cos(lat));
  const Hrise = Math.acos((Math.sin(alt0) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec)));
  const Hsun = -Hrise - turnDeg(0.895) * D2R;                    // the sun's hour angle at the start
  const lst = 6 * 15 * D2R + Hsun;                               // sidereal time: the solstice sun's right ascension is 6 h
  const sun = eq2dir(Hsun, dec, lat);
  const gal = eq2dir(lst - 12.857 * 15 * D2R, 27.13 * D2R, lat);
  const stars = REAL_STARS.map(([ra, d, peak, tint]) => ({ dir: eq2dir(lst - ra * 15 * D2R, d * D2R, lat), peak, tint: new THREE.Color(tint) }));
  const venus = sun.clone().applyAxisAngle(k, -12 * D2R);        // the rare morning star, 12 degrees of turn ahead of the sun
  return { latDeg, k, sun, gal, stars, venus, lst };
}

// The headland's height at (east x, north n): level under the lens, then a long gentle fall to the cliff, and a fall east toward the cove.
export const groundY = (x, n) => {
  const t = Math.max(0, n - 26), a = t < 14 ? t * t / 28 : t - 7, e = Math.max(0, x - 10), b = e < 14 ? e * e / 28 : e - 7;
  return -(0.115 * a + 0.10 * b);
};
const GROUND_GLSL = /* glsl */`float gtGY(vec2 xz){ float t=max(0.,-xz.y-26.); float a=t<14.?t*t/28.:t-7.; float e=max(0.,xz.x-10.); float b=e<14.?e*e/28.:e-7.; return -(.115*a+.10*b); }`;

const _q = new THREE.Quaternion(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _v = new THREE.Vector3(), _v2 = new THREE.Vector2();
const _P = new THREE.Vector3(), _G = new THREE.Vector3();
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The device. opts: { path, lat, lamps: [Vector3 in the land frame], lampOutU: [u at which each goes dark], rare, calm, detail }
export async function makeDevice(ctx, opts = {}) {
  const detail = opts.detail ?? 1, astro = makeAstronomy(opts.lat ?? 30), path = opts.path;
  const lamps = opts.lamps || [], NL = 12;
  const C = (h) => new THREE.Color(h);
  // every uniform below is written in update() from u alone, except uTime and the two that follow the drawing buffer
  const U = {
    uLandUp: { value: new THREE.Vector3(0, 1, 0) }, uSunDir: { value: astro.sun.clone() }, uGal: { value: astro.gal.clone() },
    uSunAlt: { value: -0.5 }, uPx: { value: 0.003 }, uTime: { value: 0 }, uCells2: { value: Math.round(110 + 50 * Math.min(1, Math.max(0, (detail - 0.6) / 0.4))) },
    uStar: { value: astro.stars.map((s) => new THREE.Vector4(s.dir.x, s.dir.y, s.dir.z, s.peak)) },
    uStarCol: { value: astro.stars.map((s) => new THREE.Vector3(s.tint.r, s.tint.g, s.tint.b)) },
    uVenus: { value: new THREE.Vector4(astro.venus.x, astro.venus.y, astro.venus.z, opts.rare ? 8 : 0) },
    uTurn: { value: 0 }, uWindow: { value: 1 }, uCard: { value: 1 }, uRes: { value: new THREE.Vector2(800, 450) },
    uLampOut: { value: new Array(NL).fill(9) }, uP: { value: new THREE.Vector3() }, uK: { value: astro.k.clone() },
    uSunLocal: { value: astro.sun.clone() }, uGalLocal: { value: new THREE.Vector3(0.6, 0.5, -0.6).normalize() }, uSunI: { value: 0 }, uDawn: { value: 0 }, uTw: { value: 0 },
    uBoxMin: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => new THREE.Vector3(0, -50, 0)) }, uBoxMax: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => new THREE.Vector3(0, -49, 0)) },
    uCalm: { value: opts.calm ? 1 : 0 }, uG: { value: new THREE.Vector3(0, 6, 0) }, uCis: { value: new THREE.Vector3(5, -44, 2.65) },
    uNeedle: { value: new THREE.Vector3(0, -900, 0) },   // THE NEEDLE's place for its own surface (east, the terrace top's height, z of the axis); parked 900 m under the land until the world sets it
  };
  const lampOutTurn = []; for (let i = 0; i < NL; i++) lampOutTurn.push(i < lamps.length ? turnDeg(opts.lampOutU?.[i] ?? 2) * D2R : 0);
  U.uLampOut.value = lampOutTurn;

  const sky = new THREE.Group(); sky.name = 'sky-frame';            // never moves (the dome follows the lens, but does not turn)
  const land = new THREE.Group(); land.name = 'land-frame'; land.matrixAutoUpdate = false;

  // ---- the dome: drawn on the far plane after the land, so the hidden half costs nothing
  const DITHER = /* glsl */`float gtDither(){ return (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453)-.5)*.0012; }`;
  const domeMat = new THREE.ShaderMaterial({
    uniforms: U, depthWrite: false, side: THREE.BackSide,
    vertexShader: /* glsl */`varying vec3 vDir;
      void main(){ vDir=position; vec4 p=projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.); if(abs(p.w)<1e-4) p.w=1e-4; gl_Position=p.xyww; }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vDir; ${SKY_GLSL} ${DITHER}
      void main(){ vec3 d=normalize(vDir); vec3 c=sky(d,1.,1.);
        c=mix(vec3(.020,.029,.024), c, smoothstep(-.03,-.006,dot(d,uLandUp)));       // under the sea rim: nothing
        gl_FragColor=vec4(max(c+gtDither(),0.),1.); }`,
  });
  const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), domeMat);
  dome.frustumCulled = false; dome.renderOrder = 2; dome.name = 'dome'; sky.add(dome);
  await ctx.yield();

  // ---- the card that keeps the exit ring out of the sky until the brief's u 0.90: the same sky(dir), so it cannot be told from the dome
  const end = path.pointAt(1, new THREE.Vector3()), tan = path.tangentAt(1, new THREE.Vector3());
  const cardMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vW; varying vec2 vUv; uniform float uCard; ${SKY_GLSL} ${DITHER}
      void main(){ vec3 dv=vW-cameraPosition; vec3 d=dv/max(length(dv),1e-3);
        float r=length(vUv-.5)*2.; float k=1.-uCard; float o=mix(1.2,.62,clamp(k/.35,0.,1.));   // the sky opens on the hoop first (the rim inward, in the first third), then gives way evenly inside it
        gl_FragColor=vec4(max(sky(d,1.,1.)+gtDither(),0.), (1.-smoothstep(o-.15,o,r))*(1.-smoothstep(.35,1.,k))*step(1e-4,uCard)); }`,
  });
  const card = new THREE.Mesh(new THREE.CircleGeometry(8.6, 48), cardMat);
  card.position.copy(end).addScaledVector(tan, -1.5); card.lookAt(_v.copy(card.position).sub(tan));
  card.renderOrder = 9; card.frustumCulled = false; card.name = 'card'; sky.add(card);

  // ---- the sea: a flat disc in the land frame whose rim is the ruler line; it reflects sky(dir) about its own turned normal
  const SEA_Y = opts.seaY ?? -58, SEA_R = 14300;
  const rings = [0, 40, 110, 260, 600, 1300, 2800, 6000, SEA_R], SEG = 128;
  const sp = [], si = [];
  for (let r = 0; r < rings.length; r++) for (let s = 0; s < SEG; s++) { const a = s / SEG * Math.PI * 2; sp.push(Math.sin(a) * rings[r], SEA_Y, -Math.cos(a) * rings[r]); }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < SEG; s++) { const a = r * SEG + s, b = r * SEG + (s + 1) % SEG, c = a + SEG, d = b + SEG; si.push(a, b, c, b, d, c); }
  const seaG = new THREE.BufferGeometry(); seaG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); seaG.setIndex(si);
  const WROT = /* glsl */`uniform vec3 uK; uniform float uTurn; vec3 gtRotN(vec3 v){ float c=cos(uTurn), s=sin(uTurn); return v*c+cross(uK,v)*s+uK*(dot(uK,v)*(1.-c)); }`;
  const WATER_VERT = /* glsl */`varying vec3 vL, vW; void main(){ vL=position; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
  // surf round the rocks that stand in the bay: one unrolled term per rock (no loop), a ragged white collar that breathes with the swell
  const FOAM = (opts.seaRocks || []).map(([x, z, r]) => `{ float d=length(p-vec2(${x.toFixed(1)},${z.toFixed(1)}))-${(r * 0.93).toFixed(1)}; float nz=gtVn(p*.09+vec2(uTime*.10,-uTime*.06)+${(x * 0.01).toFixed(2)});
          float br=.5+.5*sin(d*.42-uTime*.9+7.*nz); foam=max(foam,(1.-smoothstep(1.,${(r * 0.55 + 4).toFixed(1)}+10.*nz,d))*(.35+.65*br*br)*smoothstep(-4.,1.,d)); }`).join('\n        ');
  const seaMat = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: WATER_VERT, side: THREE.DoubleSide,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vW; uniform float uCalm, uSunI; uniform vec3 uG; ${SKY_GLSL} ${DITHER} ${WROT}
      vec2 wave(vec2 p, vec2 dir, float len, float amp, float per){ float k=6.2832/len; float ph=dot(p,dir)*k-uTime*6.2832/per; return dir*(amp*k*cos(ph)); }
      void main(){
        vec3 dv=vW-cameraPosition; float dist=length(dv); vec3 V=dv/max(dist,1e-3);
        vec2 p=vL.xz;
        float fp=64./(dist*dist*max(uPx,1e-5));                                   // screen size of one metre of water along the line of sight, in pixels
        float swell=smoothstep(1.5,4.,90.*fp), c1=smoothstep(1.2,3.5,18.*fp), c2=smoothstep(1.2,3.5,6.*fp), c3=smoothstep(1.2,3.5,2.2*fp);
        vec2 g=wave(p+40.*gtVn(p*.006),vec2(.82,.57),90.,.4,9.)*swell*(1.-.85*uCalm);  // the long swell from the north-west, its crests a little bent
        // the chop is noise, never a sine: a slope along the line of sight throws a star's image far up or down the water and a
        // slope across it hardly at all, so each star falls as a thin broken thread
        vec2 q1=p*.055+vec2(uTime*.045,uTime*.02), q2=p*.17-vec2(uTime*.07,-uTime*.05), q3=p*.46+vec2(uTime*.11,uTime*.16);
        float a1=gtVn(q1), a2=gtVn(q2), a3=gtVn(q3);
        vec2 ch=vec2(gtVn(q1+vec2(.25,0.))-a1, gtVn(q1+vec2(0.,.25))-a1)*(.22*c1)
               +vec2(gtVn(q2+vec2(.25,0.))-a2, gtVn(q2+vec2(0.,.25))-a2)*(.16*c2)
               +vec2(gtVn(q3+vec2(.25,0.))-a3, gtVn(q3+vec2(0.,.25))-a3)*(.11*c3);
        g+=ch*(1.-.93*uCalm);
        // far water, where a pixel holds many waves: the crests face the lens, so a star's image is thrown up and down its own
        // column and falls as a thin, broken, shimmering thread (a point again in a calm)
        vec2 hv=vL.xz-uG.xz; float hd=max(length(hv),1.); hv/=hd;
        float az=atan(hv.x,-hv.y+1e-6), al=atan(64.,hd);
        float th=(gtVn(vec2(az*70.,al*135.-uTime*.8))-.5)*2.+(gtVn(vec2(az*150.+9.,al*290.+uTime*1.3))-.5);
        g+=hv*(th*.013*smoothstep(120.,450.,hd)*(1.-.92*uCalm));
        vec3 n=normalize(vec3(-g.x,1.,-g.y));
        vec3 N=normalize(gtRotN(n));
        vec3 R=reflect(V,N); float rh=dot(R,uLandUp); if(rh<.004) R=normalize(R+uLandUp*(.004-rh)*1.02+uLandUp*1e-4);
        float c=max(dot(-V,N),0.); float F=.02+.98*pow(1.-c,5.);
        float Fm=mix(F,1.,.42);                                                          // the mirror the stars and the Milky Way get: a little kinder than Fresnel
        float w=mix(1.12, 3.0, smoothstep(140.,1100.,dist));                             // points near; far water keeps the average glitter
        vec3 sr=sky4(R,w,.46,1.0);
        // glints: facets of the chop catching the brightest sky (the Milky Way, the dawn rim, the sun's road), near water only
        float sp=gtVn(p*.9+vec2(uTime*.9,uTime*.35))*gtVn(p*1.7-vec2(uTime*.6,uTime*1.1)); sp=smoothstep(.42,.75,sp);
        float lum=dot(sr,vec3(.3,.5,.2));
        vec3 col=vec3(.011,.017,.021)+sr*(F*.95)+max(sr-vec3(.045),0.)*((Fm-F)*1.1)            // what is brighter than the airglow (stars, the Milky Way, the dawn) gets the kinder mirror
          +sr*(sp*4.*smoothstep(.02,.12,lum)*(1.-smoothstep(250.,900.,dist))*(1.-.8*uCalm)*F);
        // the swell comes in sets: long pale backs a quarter of a kilometre apart that catch the sky, so the water is water and
        // not a dark slab; they melt into their mean where a pixel holds more than one
        float dawnS=smoothstep(-.244,-.006,uSunAlt);
        float setPh=dot(p,vec2(.82,.57))/250.+1.5*gtVn(p*.0019+3.)+.5*gtVn(p*.0061+9.)-uTime*.012;
        float sets=.5+.5*sin(6.2832*setPh); sets=sets*sets*(.35+.65*gtVn(p*vec2(.004,.0023)+17.));
        float seeSets=smoothstep(1.2,4.,250.*fp)*(1.-.7*uCalm);
        col+=(vec3(.0050,.0085,.0145)+vec3(.014,.020,.046)*dawnS*dawnS)*((mix(.45,sets,seeSets)-.2)*1.5);
        float foam=0.;
        ${FOAM}
        col=mix(col, vec3(.060,.076,.105)*(1.+1.2*dawnS*dawnS)+vec3(1.,.60,.34)*(uSunI*.16), min(foam,1.)*.92);
        gl_FragColor=vec4(max(col+gtDither(),0.),1.); }`,
  });
  const sea = new THREE.Mesh(seaG, seaMat); sea.frustumCulled = false; sea.name = 'sea'; land.add(sea);
  await ctx.yield();

  // ---- the cistern's water: dead flat, a ripple of 0.002 rad, so it holds stars as points that slide while the sky stands
  const cis = opts.cistern || { x: 5, z: -44, r: 2.65, y: 0.84 }; U.uCis.value.set(cis.x, cis.z, cis.r);
  const cisMat = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: WATER_VERT,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vW; uniform float uDawn; ${SKY_GLSL} ${WROT}
      void main(){
        vec3 dv=vW-cameraPosition; vec3 V=dv/max(length(dv),1e-3);
        vec2 p=vL.xz;
        vec3 n=normalize(vec3(.0007*sin(p.x*2.6+uTime*1.3)+.0004*sin(p.y*4.1-uTime*1.1), 1., .0007*sin(p.y*2.9-uTime*1.2+p.x*1.3)));   // so gentle a breath that a star stays a point
        vec3 N=normalize(gtRotN(n));
        vec3 R=reflect(V,N); float rh=dot(R,uLandUp); if(rh<.004) R=normalize(R+uLandUp*(.004-rh)*1.02+uLandUp*1e-4);
        float c=max(dot(-V,N),0.); float f1=1.-c; float F=.42+.58*f1*f1*f1;
        float rr=length(p)/2.62; float rim=1.-.6*smoothstep(.80,1.,rr);                 // the wall's own dark reflection round the edge
        vec3 sk=sky4(R,1.05,.4,.4); vec3 sm=gtSmoothSky; vec3 pts=max(sk-sm,0.);              // the stars alone, apart from the sky they lie in
        sm*=2.5; float sl=dot(sm,vec3(.3,.5,.2)); sm=mix(sm, vec3(.42,.72,1.75)*sl, .75*uDawn)*(1.-.45*uDawn*uDawn);   // deep water: by dawn it keeps the blue overhead, not the rose of the rim
        pts*=7./(1.+2.6*max(pts.r,max(pts.g,pts.b)));                                          // lifted, but no single point hot enough to make the bloom show its squares
        gl_FragColor=vec4(vec3(.003,.004,.007)+(sm*.80+pts)*(F*rim),1.); }`,
  });
  const cisWater = new THREE.Mesh(new THREE.CircleGeometry(cis.r, 40).rotateX(-Math.PI / 2), cisMat);
  cisWater.position.set(cis.x, cis.y, cis.z); cisWater.name = 'cistern-water'; land.add(cisWater);

  // ---- rotation about k by t, G(v), and the turn limit, shared by the arc and lamp shaders
  const ROT_GLSL = /* glsl */`uniform vec3 uK, uP; uniform float uTurn; uniform float uLampOut[12]; uniform vec2 uRes;
    vec3 gtRot(vec3 v, float t){ float c=cos(t), s=sin(t); return v*c+cross(uK,v)*s+uK*(dot(uK,v)*(1.-c)); }`;

  // ---- the lamps (points in the land frame) and their arcs (ribbons in the sky frame), one draw call each
  const NSEG = Math.round(64 + 32 * Math.min(1, Math.max(0, (detail - 0.6) / 0.4)));
  const ap = [], as = [], aside = [], aidx = [], ai = [];
  for (let l = 0; l < lamps.length; l++) for (let s = 0; s <= NSEG; s++) for (const sd of [-1, 1]) {
    ap.push(lamps[l].x, lamps[l].y, lamps[l].z); as.push(s / NSEG); aside.push(sd); aidx.push(l);
    if (s < NSEG && sd === -1) { const a = (l * (NSEG + 1) + s) * 2; ai.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const arcG = new THREE.BufferGeometry();
  arcG.setAttribute('position', new THREE.Float32BufferAttribute(ap, 3)); arcG.setAttribute('aS', new THREE.Float32BufferAttribute(as, 1));
  arcG.setAttribute('aSide', new THREE.Float32BufferAttribute(aside, 1)); arcG.setAttribute('aIdx', new THREE.Float32BufferAttribute(aidx, 1)); arcG.setIndex(ai);
  const TM = (TURN_MAX * D2R).toFixed(6);
  const arcMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aS, aSide, aIdx; varying float vSide, vS, vLen, vHw, vId; ${ROT_GLSL}
      vec4 at(float t){ float v=.16+.84*t/${TM}; vec3 w=uP+.5*gtRot(position-vec3(0.,6.,-${DRIFT.toFixed(1)}*(1.-pow(max(1.-v,1e-4),${DRIFT_P.toFixed(2)}))), t); return projectionMatrix*viewMatrix*vec4(w,1.); }
      void main(){
        float tEnd=min(uTurn, uLampOut[int(aIdx+.5)]);
        float t=aS*tEnd;
        vec4 a=at(t), b=at(t+.004);
        vec2 pa=a.xy/max(a.w,1e-3), pb=b.xy/max(b.w,1e-3);
        vec2 d=(pb-pa)*uRes; float dl=length(d); d= dl>1e-5 ? d/dl : vec2(1.,0.);
        float hw=max(4., uRes.y/95.);                                 // half-width in pixels of the quad: a crisp core and a faint skirt
        a.xy+=vec2(-d.y,d.x)*aSide*hw*2./uRes*a.w;
        vSide=aSide; vS=aS; vLen=tEnd; vHw=hw; vId=aIdx; gl_Position=a; }`,
    fragmentShader: /* glsl */`precision highp float; varying float vSide, vS, vLen, vHw, vId; uniform vec2 uRes;
      void main(){ float sc=max(uRes.y/450.,.6), px=abs(vSide)*vHw/sc;                // pixels from the line's centre, at 450 lines
        float core=exp(-px*px/(2.*.74*.74)), skirt=exp(-px/1.5)*(1.-smoothstep(.7,1.,abs(vSide)));
        float on=smoothstep(0.,.012,vLen);
        float age=.55+.45*vS*vS;                                       // brightest at the lamp; the oldest end still half as bright
        float each=.72+.28*sin(vId*2.4+.6);                            // no two lamps the same strength: the trails part from one another
        vec3 amber=mix(vec3(1.,.36,.085), vec3(1.,.52,.20), vS*.6+.4*(.5+.5*sin(vId*1.7)));
        gl_FragColor=vec4(amber*((1.65*core+.045*skirt)*on*age*each),1.); }`,
  });
  const arcs = new THREE.Mesh(arcG, arcMat); arcs.frustumCulled = false; arcs.renderOrder = 6; arcs.name = 'arcs'; sky.add(arcs);

  const lp = [], li = [];
  for (let l = 0; l < lamps.length; l++) { lp.push(lamps[l].x, lamps[l].y, lamps[l].z); li.push(l); }
  const lampG = new THREE.BufferGeometry(); lampG.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lampG.setAttribute('aIdx', new THREE.Float32BufferAttribute(li, 1));
  const lampMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`attribute float aIdx; varying float vOn; ${ROT_GLSL} uniform float uTime; uniform vec3 uG;
      void main(){ float o=uLampOut[int(aIdx+.5)]; vOn=(1.-smoothstep(o-.013,o,uTurn))*(.9+.1*sin(uTime*(2.+aIdx*.37)+aIdx*2.));
        vec3 pl=uG+.5*(position-uG);                                 // half-way to the lens: the same pixel, clear of the headland's depth
        gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(pl,1.); gl_PointSize=clamp(uRes.y/58.,6.,24.); }`,
    fragmentShader: /* glsl */`precision highp float; varying float vOn;
      void main(){ vec2 q=gl_PointCoord*2.-1.; float r2=dot(q,q); float g=exp(-r2*14.)+.16*exp(-r2*3.2)*(1.-smoothstep(.6,1.,r2));
        gl_FragColor=vec4(vec3(1.,.585,.255)*(6.*g*vOn),1.); }`,
  });
  const lampPts = new THREE.Points(lampG, lampMat); lampPts.frustumCulled = false; lampPts.renderOrder = 7; lampPts.name = 'lamps'; land.add(lampPts);
  await ctx.yield();

  // ---- each lamp doubled on the water: a shimmering streak lying on the sea toward the lens (land frame, one draw call)
  const stp = [], stuv = [], stid = [], sti = [], hc = 6 - SEA_Y;
  for (let l = 0; l < lamps.length; l++) {
    const L = lamps[l], dx = L.x, dz = L.z + 18, D = Math.hypot(dx, dz), ux = dx / D, uz = dz / D, fc = hc / (hc + (L.y - SEA_Y));
    const f0 = 0.5 * fc, f1 = Math.min(0.975, 1.9 * fc), hw = 7, b = stp.length / 3;
    for (const [f, vv] of [[f0, 0], [f1, 1]]) for (const sd of [-1, 1]) {
      stp.push(ux * D * f - uz * hw * sd, SEA_Y + 2.5, -18 + uz * D * f + ux * hw * sd); stuv.push(sd, (f - fc) / fc); stid.push(l);
    }
    sti.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const stG = new THREE.BufferGeometry();
  stG.setAttribute('position', new THREE.Float32BufferAttribute(stp, 3)); stG.setAttribute('aUv', new THREE.Float32BufferAttribute(stuv, 2));
  stG.setAttribute('aIdx', new THREE.Float32BufferAttribute(stid, 1)); stG.setIndex(sti);
  const streakMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec2 aUv; attribute float aIdx; varying vec2 vUv; varying float vOn, vId; ${ROT_GLSL}
      void main(){ float o=uLampOut[int(aIdx+.5)]; vOn=1.-smoothstep(o-.013,o,uTurn); vUv=aUv; vId=aIdx;
        gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float; varying vec2 vUv; varying float vOn, vId; uniform float uTime, uCalm;
      void main(){ float along=exp(-vUv.y*vUv.y*mix(5.,60.,uCalm));
        float sh=.5+.5*sin(vUv.y*46.+uTime*2.3+vId*3.1+3.*sin(vUv.y*13.-uTime*.9+vId));
        float wob=sin(vUv.y*31.-uTime*1.7+vId*5.)*.16*(1.-uCalm);
        float across=exp(-(vUv.x-wob)*(vUv.x-wob)*5.);
        gl_FragColor=vec4(vec3(1.,.585,.255)*(1.5*along*across*mix(.25+.75*sh*sh,1.,uCalm)*vOn),1.); }`,
  });
  const streaks = new THREE.Mesh(stG, streakMat); streaks.frustumCulled = false; streaks.renderOrder = 5; streaks.name = 'streaks'; land.add(streaks);

  // ---- materials for everything solid on the land (positions and normals are in the land frame: meshes sit at identity)
  const SOLID_VERT = /* glsl */`attribute vec3 color; attribute vec2 aMat; varying vec3 vL, vN, vC; varying float vM; uniform float uTime;
    void main(){ vec3 p=position; float sw=aMat.y;
      p.x+=sw*(.10+.07*sin(uTime*1.9+p.y*1.3+p.z*.8)+.04*sin(uTime*4.7+p.x*5.+p.y*3.));          // the west wind in the twigs
      p.z+=sw*.05*sin(uTime*2.6+p.x*2.1+p.y*1.7); p.y+=sw*.03*sin(uTime*3.3+p.x*3.);
      vL=p; vN=normal; vC=color; vM=aMat.x; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.); }`;
  const solidMat = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: SOLID_VERT, side: THREE.DoubleSide,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vN, vC; varying float vM; ${LAND_GLSL}
      uniform vec3 uNeedle;                                                            // THE NEEDLE's place (east, the terrace top's height, z of the axis), read by code 9 and by the damp ring's line alone
      float sH(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float sN(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(sH(i),sH(i+vec2(1.,0.)),f.x), mix(sH(i+vec2(0.,1.)),sH(i+vec2(1.,1.)),f.x), f.y); }
      // coursed stones of uneven length: returns (tone of this stone, darkness of the joint)
      vec2 stones(vec2 uv, float ch, float len, float joint){
        float row=floor(uv.y/ch); float x=uv.x/len+sH(vec2(row,7.3))*7.; float i=floor(x); float w=.35+.65*sH(vec2(i,row));
        float fx=fract(x); float c= fx<w ? i : i+.5; float lx= fx<w ? fx/w : (fx-w)/max(1.-w,1e-3); float wl= fx<w ? w : 1.-w;
        float fy=fract(uv.y/ch);
        float ex=min(lx,1.-lx)*wl*len, eyy=min(fy,1.-fy)*ch;
        float j=1.-smoothstep(0.,joint,min(ex,eyy));
        return vec2(sH(vec2(c*3.1,row*1.7)), j); }
      const float gtWallFoot=-.3;
      void main(){ vec3 n=normalize(vN+vec3(1e-5)); if(!gl_FrontFacing) n=-n;
        float horiz=1.-smoothstep(.5,.8,abs(n.y));
        vec2 uv=mix(vL.xz, vec2(abs(n.x)>abs(n.z)?vL.z:vL.x, vL.y), horiz);              // wall faces: along the wall and up; tops: plan
        vec3 alb=vC; float m=vM;
        float fw=fwidth(uv.x)+fwidth(uv.y);                                           // metres under one pixel: patterns finer than this melt into their mean
        vec2 u9=vec2((n.x*n.z>0.?vL.x-vL.z:vL.x+vL.z)*.7071, vL.y); float fw9=fwidth(u9.x)+fwidth(u9.y);   // THE NEEDLE's own face coordinate (read by code 9 alone): its faces stand at 45 degrees, where the choice above is a tie; metres along the face (east plus north, or east minus north) and up it
        if(m<.5){ float mo=sN(uv*1.3)*.5+sN(uv*4.7)*.3+sN(uv*17.)*.2;                    // whitewash: lime, a little uneven, damp at the foot
          alb*=.86+.20*mo; alb*=mix(vec3(.80,.85,.82),vec3(1.),smoothstep(-2.9,-2.2,vL.y-.25*sN(vec2(uv.x*1.5,2.))));
          alb=mix(vec3(.085,.09,.10)*(.8+.4*mo), alb, smoothstep(-2.93,-2.89,vL.y));                 // the tarred plinth
          alb*=1.-.10*smoothstep(.55,.8,sN(vec2(uv.x*6.,uv.y*.35+3.)))*horiz; }
        else if(m<1.5){ vec2 st=stones(uv+.03*sN(uv*9.), .17, .42, .022);                  // drystone: small coursed stones, deep joints, lichen
          float q=1.-smoothstep(.10,.34,fw); alb*=mix(.80+.34*sN(uv*1.6), (.60+.62*st.x)*(1.-.80*st.y), q);
          vec2 s2=stones(uv+.05*sN(uv*3.), .40, 1.15, .07); float q2=(1.-q)*(1.-smoothstep(.45,1.4,fw));        // from far off: the big through-stones and the courses, never a flat band
          float fwy=fwidth(uv.y), qc=(1.-smoothstep(.035,.10,fwy))*(1.-q)*horiz; float rw=floor(uv.y/.17), cf=fract(uv.y/.17);   // seen along its length: the courses still part, each its own tone
          alb*=mix(1., (.70+.55*sH(vec2(rw,3.7)+floor(uv.x/2.3)*.37))*(1.-.6*(1.-smoothstep(0.,.16,min(cf,1.-cf)))), qc);
          alb*=mix(1., (.66+.62*s2.x)*(1.-.55*s2.y), q2)*(.78+.30*smoothstep(-.2,1.1,vL.y-gtWallFoot)); alb=mix(alb, vec3(.60,.61,.50), .5*smoothstep(.62,.82,sN(uv*2.3+11.))*(1.-st.y*q)); }
        else if(m<2.5){ vec2 su=vec2(vL.x, vL.z*2.2); vec2 st=stones(su, .26, .34, .012); float q=1.-smoothstep(.03,.12,fw), q2=1.-smoothstep(.10,.30,fw);
          float cr=fract(su.y/.26); alb*=mix(1., (.84+.30*st.x)*(1.-.6*st.y), q)*mix(1., .74+.44*cr, q2)*(.9+.2*sN(su*.8)); }   // slates in courses
        else if(m<3.5){ alb*=.8+.4*sN(vL.xy*6.); }
        else if(m<4.5){ float f=sN(vL.xy*.02)*.6+sN(vL.xy*.07)*.4; alb*=.65+.7*f; }       // the far headland: fields and heath, barely told apart
        else if(m>8.5){ vec3 q=vL-uNeedle; float h=q.y, fid=(n.x>0.?1.:0.)+(n.z>0.?2.:0.), wash=step(3.,h);                // THE NEEDLE: old limewash over ashlar, on flat faces. h: metres above the terrace's top; fid: which of the four faces; wash: 1 above the 3 m of bare stone
          float a9=h<22.?3.-.6*max(h,0.)/22.:2.4*max(29.-h,0.)/7., s=(n.x*n.z>0.?q.x-q.z:q.x+q.z)*.7071, dA=max(a9*.7071-abs(s),0.);   // the half-diagonal at this height (3.0 m at the terrace, 2.4 at the shoulder, 0 at the point); metres along the face from its middle; metres to the nearer arris
          float mo=sN(u9*vec2(.9,2.1)+17.)*.6+sN(u9*vec2(3.1,7.))*.4, gr=mix(1., .86+.28*mo, 1.-smoothstep(.25,.90,fw9));          // the stone's own grain melts with distance (the first freeze's law, as it was)
          float crs=floor((h-3.)/1.2), bi=floor(s*.5+.5*mod(crs,2.)); gr*=mix(1., .90+.16*sH(vec2(bi*3.1+fid*17.,crs*1.7+5.)), wash);   // BUILT OF BLOCKS: courses 1.2 m tall counted from the wash line, blocks 2.0 m long, alternate courses breaking joint by half a block; each block its own tone, 0.90 to 1.06; no joint line
          float pat=smoothstep(.42,.72,sN((vec2(s,h)+fid*vec2(37.,11.))*.38+3.)), arr=(1.-smoothstep(0.,.5,dA))*(.55+.45*sN(vec2(h*.9,fid*7.+1.)));   // THE WASH IS WORN: patches 2.5 to 4 m across (a noise of 2.6 m cells), and the half metre next to each arris, unevenly
          float c=floor(s/1.2), r1=sH(vec2(c,fid+2.)), r2=sH(vec2(c+13.,fid+5.)), r3=sH(vec2(c+29.,fid+9.)), sw=.4+.4*r1;                  // rain streaks from under the shoulder: one in each 1.2 m of face, 0.4 to 0.8 m wide,
          float str=(1.-smoothstep(sw*.5-.1,sw*.5,abs(s-(c+.5)*1.2-(r3-.5)*(1.2-sw))))*(1.-smoothstep(0.,3.+3.*r2,22.-h))*step(h,22.);    // 3 to 6 m long, strongest at the shoulder (22 m) and dying downward
          alb=mix(alb, vec3(.50,.49,.46), max(pat,max(arr,str))*(n.x<0.?.55:.3)*wash)*gr;                                        // the wall's stone W shows through: up to 0.55 of the way on the two weather faces (west), 0.3 on the others
          float run=sN(vec2(u9.x*1.4,u9.y*.09)+71.); alb*=1.-.20*smoothstep(.45,.85,run)*(.4+.6*sN(u9*.3+9.))*horiz;          // rain runs down the faces from the point
          alb*=mix(.8,1.,clamp(h/.8,0.,1.));                                                                                // THE FOOT IS DAMP: the lowest 0.8 m darkens evenly to 0.8 at the step
          alb*=mix(vec3(.64,.71,.66), vec3(1.), smoothstep(-.9,-.1,n.x)); }                                                 // the weather faces (west) are damp and a little green; the others clean
        else if(m>7.5){ float bed=sN(vec2((vL.x+vL.z)*.06, vL.y*.55)), bl=sN(vec2((vL.x-vL.z)*.11, vL.y*.16)+31.);       // the stack: bedded, weathered in blocks,
          alb*=(.55+.5*bed+.35*bl)*(.75+.5*smoothstep(-58.,-20.,vL.y));                                                    // dark and wet at the foot,
          alb=mix(alb, vec3(.42,.41,.37), .65*smoothstep(.45,.8,n.y)*smoothstep(.35,.6,sN(vL.xz*.4+vL.y*.3)));            // its ledges paler
          alb=mix(alb, vec3(.030,.034,.036), 1.-smoothstep(-57.5,-53.,vL.y+2.*sN(vL.xz*.2))); }
        else if(m>6.5){ float bed=sN(vec2((vL.x+vL.z)*.5, vL.y*9.)); alb*=(.60+.34*sN(vL.xz*2.1+vL.y)+.22*bed);        // bare limestone: bedded, lichened
          alb=mix(alb, vec3(.52,.50,.36), .45*smoothstep(.60,.80,sN(vL.xz*3.7+vL.y*2.+19.))); }
        else if(m<5.5){ vec2 st=stones(uv, .30, .62, .014); alb*=(.82+.30*st.x)*(1.-.55*st.y)*(.9+.2*sN(uv*11.)); }   // dressed stone
        if(m>.5&&m<1.5){ vec3 q=vL-uNeedle; alb*=1.-.15*(1.-smoothstep(0.,.5,(abs(q.x)+abs(q.z)-3.)*.7071))*step(abs(q.y),.05)*step(.8,n.y); }   // THE NEEDLE's damp ring on the upper step's top: 0.85 at the shaft's foot, 1 at 0.5 m from it; exactly 1 everywhere else (and everywhere when uNeedle is parked)
        gl_FragColor=vec4(gtLit(alb,n,vL,0.),1.); }`,
  });
  // the headland: short dark grass that the wind crosses in pale bands, and the limestone track (two worn ruts, a grass crown)
  const groundMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aK; varying vec3 vL, vW; varying float vK;
      void main(){ vL=position; vK=aK; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vW; varying float vK; uniform float uTime, uPx; ${LAND_GLSL} ${TURF_GLSL}
      void main(){ vec2 p=vL.xz; float dist=length(vW-cameraPosition), far=smoothstep(30.,150.,dist);
        float fp=dist*dist*max(uPx,1e-5)/6.;                                            // metres of turf under one pixel along the line of sight
        float k1=1.-smoothstep(.45,2.0,fp), k2=1.-smoothstep(.14,.60,fp), k3=1.-smoothstep(.04,.20,fp);
        // the track: two worn ruts, a crown where grass has come back, grit and stones; its edges are ragged with turf
        float wob=.16*(gN(vec2(p.y*.55,3.))-.5)+.07*(gN(vec2(p.y*2.7,9.))-.5);
        float ax=abs(p.x+wob*.6), edge=1.2+wob+.30*(gN(p*vec2(1.3,2.6)+40.)-.5)*k2;
        float tr=(1.-smoothstep(edge-.12,edge+.08,ax))*step(p.y,4.);
        // the relief and its slope
        float h0=gtRel(p,k1,k2), hx=gtRel(p+vec2(.16,0.),k1,k2), hz=gtRel(p+vec2(0.,.16),k1,k2);
        vec2 gr=vec2(hx-h0,hz-h0)*(.50/.16);                                            // half a metre of relief
        float big=gtBig(p), h=mix(.5,h0/.9,k1);
        float fine=gN(p*vec2(5.2,3.1))*.6+gN(p*11.)*.4;
        vec3 grass=gtTurfCol(big,h)*(1.+.42*(fine-.5)*k3);
        float gust=gtGust(p,uTime);
        grass+=vec3(.062,.088,.104)*(gust*(.35+1.1*h)*(1.-.5*far));
        float rut=exp(-(ax-.68)*(ax-.68)/.030);
        float crown=(1.-smoothstep(.16,.40,ax+.30*(gN(vec2(p.x*3.,p.y*.9))-.5)*k2))*smoothstep(.06,.30,gN(vec2(1.3,p.y*.31)));
        float peb=mix(.45, gN(p*7.)*.45+gN(p*19.)*.35+.2*step(.5,gH(floor(p*23.))), k3);
        vec2 sc=floor(p*4.), sf=fract(p*4.)-.5; float hs=gH(sc+3.);
        vec2 so=sf-(vec2(gH(sc),gH(sc+9.))-.5)*.5;
        float stone=(1.-smoothstep(.09+.10*hs,.15+.10*hs,length(so)))*step(.58,hs)*k3;   // loose stones, most of them in the crown and at the edges
        stone*=1.-.75*rut;
        vec3 track=vec3(.50,.485,.43)*(.50+.52*rut+.50*(peb-.45))*(1.-.22*smoothstep(.55,.8,gN(vec2(p.x*.7,p.y*.12)+70.)))*(.66+.60*gN(vec2(p.x*1.1+3.,p.y*.62)));   // damp and dry reaches, potholes: never one flat tone
        track=mix(track, vec3(.64,.62,.56)*(.8+.4*gH(sc+5.)), stone*.8);
        track=mix(track, gtTurfCol(big,.55+.4*fine)*1.35+vec3(.02,.025,.015), crown*(.74+.2*k3*step(.45,fine)));
        float verge=(1.-smoothstep(.0,.7,abs(ax-edge)))*.35;
        vec3 alb=mix(grass*(1.+verge), track, tr);
        vec3 n=normalize(vec3(-gr.x,1.,-gr.y));
        vec3 nt=normalize(vec3((peb-.45)*.5*k3-stone*so.x*5., 1., (gN(p*7.+13.)-.5)*.5*k3-stone*so.y*5.));
        n=normalize(mix(n,nt,tr));
        // the turf's own long shadows when the sun is low: five looks toward the sun across the relief
        float lit=1.;
        if(uSunI>.001){ vec2 sd=uSunLocal.xz; float sl=max(length(sd),1e-3); sd/=sl; float ta=max(uSunLocal.y,0.)/sl;
          float hb=gtRelS(p), s=.4, sh=0.;
          for(int i=0;i<5;i++){ sh=max(sh, smoothstep(0.,.07,(gtRelS(p+sd*s)-hb)*.50-s*ta-.015)); s*=2.15; }
          lit=1.-sh*mix(.35,.92,k1)*(1.-.45*tr); }                                     // (the bare track is spared most of it: the boxes' long shadows read across it)
        // by night the hollows are darker and the side toward the Milky Way a shade paler
        vec2 gd=uGalLocal.xz; gd/=max(length(gd),1e-3);
        alb*=1.+.9*dot(n.xz,gd)*(1.-tr)*(1.-min(uSunI,1.)*.7);
        float graze=mix(.12+.10*(1.-k1), .04+.26*peb*peb+.12*rut*(1.-crown)+.42*stone, tr);    // the grit takes the low sun stone by stone, not as one pale sheet
        float sx=gN(vec2(p.x*.9+p.y*.9,vL.y*.22)), sy=gN(vec2(p.x*.25-p.y*.25,vL.y*1.6));
        vec3 rock=mix(vec3(.10,.10,.105), vec3(.26,.25,.235), sx*.6+sy*.4)*(.6+.4*smoothstep(.3,.6,sy));   // the cliff: bedded limestone
        float k=smoothstep(.25,.75,vK);
        alb=mix(alb, rock, k);
        n=normalize(mix(n, vec3(0.,.25,-1.), k));
        gl_FragColor=vec4(gtLit2(alb,n,vL,graze*(1.-k),mix(lit,1.,k)),1.); }`,
  });
  // grass blades: instanced, bending in a steady west wind, tips catching the sky. aOff = (x, z, height, phase)
  const grassMat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aOff; varying vec3 vL, vBase, vTip; varying float vT, vF, vLit; uniform float uTime, uPx; uniform vec3 uG, uCis; ${GROUND_GLSL} ${LAND_GLSL} ${TURF_GLSL}
      void main(){ float t=position.y; float a=aOff.w*6.2832; vec2 r=vec2(cos(a),sin(a)); vec2 q=aOff.xy;
        float gy=gtGY(q);
        float d=length(vec3(q.x,gy,q.y)-uG);                                           // distance from the lens (the lens is G(u) in the land frame)
        float wide=max(1., d*uPx*1.3/.07);                                               // never thinner than about 1.3 pixels
        float keep=(1.-smoothstep(42.,90.,d))*step(uCis.z+.55, length(q-uCis.xy));       // blades are near detail: they sink into the turf with distance (and none grows in the tank)
        float h=gtRelS(q), big=gtBig(q), hsh=fract(aOff.w*37.7);
        float gw=gtGust(q,uTime);
        float gust=.30+.3*sin(uTime*1.7+q.x*.21+q.y*.07+aOff.w*3.)+.2*sin(uTime*.6-q.x*.045)+.35*gw;
        float hz=aOff.z*(.40+1.75*h)*keep;                                               // tufts stand tall on the tussocks, cropped in the hollows
        vec3 p=vec3(q.x+r.x*position.x*wide*keep+t*t*gust*hz*.9, gy+t*hz*(1.-.25*t*gust), q.y+r.y*position.x*wide*keep+t*t*.15*hz*sin(uTime*2.3+aOff.w*9.));
        vBase=gtTurfCol(big,h/.9)*(1.05+.4*hsh)+vec3(.062,.088,.104)*gw*(.35+1.1*h);
        vTip=mix(vBase*1.6, vec3(.34,.33,.23)*(.55+.75*hsh), .25+.55*hsh*h)+vec3(.062,.088,.104)*gw*.5;   // bent grass: straw-pale heads, paler where the wind lays them over
        float lit=1.;
        if(uSunI>.001){ vec2 sd=uSunLocal.xz; float sl=max(length(sd),1e-3); sd/=sl; float ta=max(uSunLocal.y,0.)/sl; float s=.4, sh=0.;
          for(int i=0;i<5;i++){ sh=max(sh, smoothstep(0.,.07,(gtRelS(q+sd*s)-h)*.50-s*ta-.015)); s*=2.15; }
          lit=1.-sh*.92; }
        vLit=lit; vL=p; vT=t; vF=1./wide; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(p,1.); }`,
    fragmentShader: /* glsl */`precision highp float; varying vec3 vL, vBase, vTip; varying float vT, vF, vLit; ${LAND_GLSL}
      void main(){ float t=clamp(vT,0.,1.);                                                   // vT is 0 at the root and 1 at the tip; multisampling extrapolates it far outside that on a blade seen edge-on, and its square below would make one sample blaze
        vec3 alb=mix(vBase, vTip, t*t*(.35+.65*vF));
        float nearB=smoothstep(.30,.95,vF);                                                   // far blades take the turf's own light: no bright specks
        gl_FragColor=vec4(gtLit2(alb,vec3(0.,1.,0.),vec3(vL.x,vL.y-vT*.3+.02,vL.z),mix(.20,.12+.95*t*t,nearB),mix(vLit,1.,t*t*.6*nearB)),1.); }`,
  });
  const windowMat = new THREE.ShaderMaterial({
    uniforms: U, vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */`precision highp float; varying vec2 vUv; uniform float uWindow, uTime;
      void main(){ vec2 q=abs(vUv-.5); float bars=step(.035,q.x)*step(.035,q.y)*step(q.x,.46)*step(q.y,.45);
        gl_FragColor=vec4(vec3(.004,.006,.012)+vec3(1.,.585,.255)*(6.5*uWindow*bars*(.94+.06*sin(uTime*7.))),1.); }`,
  });
  await ctx.yield();

  // the Milky Way's highest point in the sky: the direction of the faint fixed fill
  const mwDir = new THREE.Vector3(0, 1, 0).addScaledVector(astro.gal, -astro.gal.y).normalize();
  const setBox = (i, min, max) => { U.uBoxMin.value[i].set(min[0], min[1], min[2]); U.uBoxMax.value[i].set(max[0], max[1], max[2]); };
  const state = { turn: 0, sunAlt: 0 };

  // Everything scripted, from u alone (never from the camera): the land's matrix and every uniform that follows the turn.
  function update(dt, time, camera, u, renderer) {
    const turn = turnDeg(u) * D2R;
    path.pointAt(u, _P); _G.set(0, 6, -driftN(u));
    _q.setFromAxisAngle(astro.k, turn);
    land.matrix.makeTranslation(_P.x, _P.y, _P.z).multiply(_m1.makeRotationFromQuaternion(_q)).multiply(_m2.makeTranslation(-_G.x, -_G.y, -_G.z));
    land.matrixWorldNeedsUpdate = true;
    U.uP.value.copy(_P); U.uG.value.copy(_G); U.uTurn.value = turn; U.uTime.value = time;
    U.uLandUp.value.set(0, 1, 0).applyQuaternion(_q);
    const sa = Math.asin(Math.max(-1, Math.min(1, astro.sun.dot(U.uLandUp.value))));
    U.uSunAlt.value = sa;
    _q.invert();
    U.uSunLocal.value.copy(astro.sun).applyQuaternion(_q);
    U.uGalLocal.value.copy(mwDir).applyQuaternion(_q);
    U.uDawn.value = ss(-0.31, -0.04, sa); U.uTw.value = ss(-0.40, -0.14, sa);
    U.uWindow.value = 1 - ss(0.10, 0.119, u);
    U.uCard.value = 1 - ss(0.90, 0.95, u);          // the brief's beat: the sky opens on the ring from u 0.90 to 0.95
    U.uSunI.value = 1.25 * ss(0.895, 0.915, u) * (0.45 + 0.55 * ss(0.90, 1.0, u));
    if (renderer) { renderer.getDrawingBufferSize(_v2); U.uRes.value.copy(_v2); }
    if (camera) U.uPx.value = 2 / (Math.max(0.05, camera.projectionMatrix.elements[5]) * Math.max(1, U.uRes.value.y));
    state.turn = turn; state.sunAlt = sa;
  }
  update(0, 0, null, 0, null);

  return { sky, land, uniforms: U, astro, update, state, setBox, cistern: cis, seaY: SEA_Y,
    materials: { solid: solidMat, ground: groundMat, grass: grassMat, window: windowMat, water: cisMat } };
}

// Set-piece viewer contract: the device alone (sky, sea, cistern water, a handful of lamps and their arcs), turning on a loop.
export async function buildHero(ctx, opts = {}) {
  const { makePath } = ctx.core;
  const path = makePath([[0, 0, 0], [0, 52.3, -1499]]);
  const lamps = []; for (let i = 0; i < 12; i++) { const az = (10 + 16 * i / 11) * D2R; lamps.push(new THREE.Vector3(Math.sin(az) * 2500, 8 + ((i * 5) % 12) * 5.6, -Math.cos(az) * 2500)); }
  const dev = await makeDevice(ctx, { path, lamps, lampOutU: lamps.map(() => 2), detail: ctx.quality?.detail ?? 1 });
  const object = new THREE.Group(); object.add(dev.sky, dev.land);
  return {
    object, radius: 60, height: 20, center: new THREE.Vector3(0, 6, -40), anchors: {},
    update(dt, time, camera) { dev.update(dt, time, camera, 0.12 + 0.6 * (0.5 - 0.5 * Math.cos(time * 0.15)), ctx.renderer); },
    dispose() {}, ground: false, groundY: 0,
  };
}
