// THE GREEN ROOM: hero set piece. The barrel of a single 15 m reef wave at the moment the sun finds the lip.
//
// WHAT IT IS
//   One peeling wave, 210 m long, lying along the Z axis. Local frame: origin at the bottom of the trough under the
//   default tube, +Y up, the camera's line of travel is +Z (the bright almond mouth is at +Z = "front", the foam
//   ball at -Z). Looking along +Z the glass wall (wave face) is on the LEFT at x = +7, the falling curtain on the
//   RIGHT at about x = -7, the roof 14 m up, the crest at 15 m. Seaward is +X (back of the wave), shore is -X.
//   Pieces: the wave itself (inner tube surface + outer skin + back slope, one vertex-animated mesh with a noise-torn
//   lip and curtain windows), reef and sand seen by refraction through the trough (in the shader), six dolphins
//   inside the wall (one leaps across the tube), foam ball, lip droplets / spindrift / splashes (3,000 sprites),
//   mist and the spit blast (2,100 soft sprites), and a fan of gold shafts from the place the sun burns through.
//
// OPTS
//   palette   7 hex strings [deep, teal, jade, aqua, foamWhite, peach, sunGold] (brief palette by default)
//   sunDir    [x,y,z] local direction TOWARD the sun. Default: 24 deg up, 25 deg to seaward (+X) of +Z, jittered per seed.
//   reef      true: paint reef/sand under the trough in the wave shader (scrolls at 13 m/s). false: plain deep water.
//   reefSpeed m/s scroll of the reef and of surface streaks on the flat water (default 13).
//
// LIVE CONTROLS (all on the returned object; nothing here uses wall-clock time for scripted moments)
//   setProgress(u)      drives the whole brief timeline from the journey's u (reveal, pinch, leap, spit). Optional:
//                       use it OR the individual setters below. Until one is called the piece idles at its hero moment
//                       (reveal = 1, a dolphin leaping every ~9 s).
//   setReveal(k)        0..1  lip thins, sun disc burns through, wall turns from opaque jade to glass, dolphins appear.
//   setTube({radius, mouthZ, foamZ})   radius: tube half-width scale (1 = 14 m across, 0.36 = 5 m pinch);
//                       mouthZ: z where the lip is half thrown (default 62; the tube is closed behind mouthZ-30 and the
//                       wave is an unbroken shoulder ahead of mouthZ+24. Put it BEHIND the camera to start on the
//                       feathering crest, then run it ahead to close the sky); foamZ: centre of the foam ball (-48).
//   setLeap(l)          0..1.6: the leaping dolphin (0..1 = wall -> air -> wall, 1..1.6 lets the entry splash finish).
//   setSpit(s)          0..1: the spit blast travelling from the foam ball out of the mouth, with its gold shafts.
//   setPod(z)           z around which the dolphins keep station (default 4; set it to the camera's local z + ~8).
//   setSun([x,y,z])     change the sun direction.
//   setScroll(m)        extra metres of reef scroll (a world that moves the wave passes its world z here, reefSpeed 0).
//   opts also: swell (height multiplier), plume (spindrift height, 1), rain (0..1 dimples on face and flat water),
//                       cast ('dolphin' | 'trevally': a school of 24 giant trevally in the wall instead of the pod),
//                       reefColors ([hex, hex] coral ochre and pale gold, when the palette's own golds are not ochre),
//                       bio (0..1 bioluminescent foam lines and foam ball, for night), sea (hex: colour the far skirts
//                       blend to before they dissolve, so no seam shows against the world's ocean).
//   setTrail(k)         0..1: the white line the board's rail scores along the wall behind the camera.
//   The flat-water and back-slope skirts and both ends dissolve with an ordered dither so the world's sea shows through.
//   tubeAt(z)           -> { cx, cy, a, b, wallX, floorY, curl } current cross-section (centre, half-width/height).
//   wallPoint(z, th, out)  -> Vector3 on the inner surface (th: -PI/2 trough, 0 wall, PI/2 roof, PI curtain).
//
// ANCHORS (local space, default tube)
//   portalSeat   { position, facing, radius }: centre of the 14 m ring standing in the mouth, facing back down the tube
//                (-Z). Lower rim cuts the trough, upper rim is brushed by the lip.
//   flyThrough   ordered points of a camera line through the barrel from foam ball to portal (tube axis, so it has
//                the most clearance the tube allows: ~6 m when open, less by design at the wall passes).
//   lowLine / highLine   the two riding lines of the brief (1.5 m over the reef; high beside the dolphins).
//   crestStart   point on the feathering crest for the opening shot (valid while mouthZ is behind the camera).
//   lookBack     point to gaze at for the glance at the foam ball.   foamBall  its centre.
//   dolphinPod   centre of the pod in the wall.   leapFrom / leapTo   where the leaper exits and re-enters the face.
//   lipSun       where the sun burns through as seen from mid-tube.   sunDir   unit vector toward the sun.
//   canoeLane    two points of a line beyond the mouth on the shoulder for the outrigger.   mouth   mouth centre.
//
// SIZE   length 210 m (z -95..115), width ~150 m with its flat-water and back-slope skirts, crest 15 m.
//        radius reported = 48 (the tube and its near water; the long axis is 105 m each way), height 15.
// COST   ~70k triangles, 7 draw calls, no lights, no render targets, build ~100 ms.
// LIGHT  Needs none: every material is a self-lit ShaderMaterial writing linear HDR (sun disc/lip/droplets 3-7),
//        with scene fog honoured. The sun is a direction uniform; put the world's sky sun in the same direction.
//        Dolphins inside the wall are drawn with a GREATER depth test after the wave (they show only where water
//        is in front of them), so keep other opaque geometry out of the water volume.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PAL = ['#083040', '#0c5f6e', '#2fc7a0', '#7fd6e0', '#eafff6', '#ffd9a8', '#ffb23e'];
const PI = Math.PI, HPI = PI / 2;
const ZB = -95, ZF = 115, WALLX = 7, W0 = 0.2, Q0 = 0.5, YSEA = 1.8, TFALL = 0.95;

// ---------------------------------------------------------------- JS mirror of the wave function (see GLSL below)
function mCurl(z, st) {
  const w = Math.sin(z * 0.11 + st.v[0] + st.time * 0.5) * 0.5 + Math.sin(z * 0.047 + st.v[1] - st.time * 0.3) * 0.5;
  return 1 - smoothstep(st.mouthZ - 30 + w * 5, st.mouthZ + 24 + w * 5, z);
}
function mShape(z, st, o = {}) {
  const fl = smoothstep(st.mouthZ - 45, st.mouthZ, z), sh = smoothstep(st.mouthZ + 8, st.mouthZ + 58, z);
  const bk = 1 - smoothstep(st.foamZ - 42, st.foamZ - 6, z);
  const br = 1 + 0.05 * Math.sin(z * 0.06 - st.time * 0.8 + st.v[2]);
  const en = smoothstep(ZB, ZB + 30, z), ef = 1 - smoothstep(ZF - 34, ZF - 3, z);
  o.a = 7 * lerp(st.rad, 1.21, fl) * br * lerp(0.35, 1, en); o.b = 7 * (1 - 0.62 * sh) * (1 - 0.5 * bk) * st.swell * lerp(0.14, 1, en) * lerp(0.1, 1, ef); o.cy = o.b; o.cx = WALLX - o.a; o.sh = sh;
  return o;
}
function mThEnd(z, st, S) {
  const c = mCurl(z, st);
  return lerp(lerp(1.15, 0.75, S.sh), PI + TFALL, c) + 0.12 * Math.sin(z * 0.35 + st.time * 1.3) * c * (1 - c) * 4;
}
function mEll(S, th, out) {
  if (th <= PI) return out.set(S.cx + S.a * Math.cos(th), S.cy + S.b * Math.sin(th), 0);
  const f = th - PI; return out.set(S.cx - S.a + 0.1 * S.a * f * f, S.cy - S.b * f * (1 + 0.08 * f), 0);
}

// ---------------------------------------------------------------- shared GLSL
const G_COMMON = /* glsl */`
#define GPI 3.14159265
#define GHPI 1.5707963
uniform float uTime, uRad, uMouthZ, uFoamZ, uSwell;
uniform vec4 uVar;
float gHash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float gHash3(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(gHash(i), gHash(i+vec2(1,0)), f.x), mix(gHash(i+vec2(0,1)), gHash(i+vec2(1,1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(gHash3(i), gHash3(i+vec3(1,0,0)), f.x), mix(gHash3(i+vec3(0,1,0)), gHash3(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(gHash3(i+vec3(0,0,1)), gHash3(i+vec3(1,0,1)), f.x), mix(gHash3(i+vec3(0,1,1)), gHash3(i+vec3(1,1,1)), f.x), f.y), f.z); }
float gCurl(float z){
  float w = sin(z*.11+uVar.x+uTime*.5)*.5 + sin(z*.047+uVar.y-uTime*.3)*.5;
  return 1. - smoothstep(uMouthZ-30.+w*5., uMouthZ+24.+w*5., z); }
float gShoulder(float z){ return smoothstep(uMouthZ+8., uMouthZ+58., z); }
float gBroken(float z){ return 1. - smoothstep(uFoamZ-42., uFoamZ-6., z); }
// x: half width a, y: half height b, z: centre y, w: centre x
vec4 gShape(float z){
  float fl = smoothstep(uMouthZ-45., uMouthZ, z);
  float br = 1. + .05*sin(z*.06 - uTime*.8 + uVar.z);
  float en = smoothstep(${ZB}., ${ZB + 30}., z), ef = 1. - smoothstep(${ZF - 34}., ${ZF - 3}., z);
  float a = 7.*mix(uRad, 1.21, fl)*br*mix(.35, 1., en);
  float b = 7.*(1.-.62*gShoulder(z))*(1.-.5*gBroken(z))*uSwell*mix(.14, 1., en)*mix(.1, 1., ef);
  return vec4(a, b, b, ${WALLX.toFixed(1)} - a); }
float gThEnd(float z){
  float c = gCurl(z);
  return mix(mix(1.15, .75, gShoulder(z)), GPI + ${TFALL}, c) + .12*sin(z*.35+uTime*1.3)*c*(1.-c)*4.; }
vec2 gEll(vec4 S, float th){
  if (th <= GPI) return vec2(S.w + S.x*cos(th), S.z + S.y*sin(th));
  float f = th - GPI; return vec2(S.w - S.x + .1*S.x*f*f, S.z - S.y*f*(1.+.08*f)); }
vec2 gEllN(vec4 S, float th){
  if (th <= GPI) return normalize(vec2(S.y*cos(th), S.x*sin(th)));
  return normalize(vec2(-1., -.2*(th-GPI))); }
float gThick(float d){ return .04 + .2*d + .6*smoothstep(1., 2.6, d); }
`;

const G_FOG_FADE = /* glsl */`
float gFogKeep(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      return 1. - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.;
  #endif
}`;

// ---------------------------------------------------------------- the wave
const WAVE_VERT = /* glsl */`
${G_COMMON}
#include <fog_pars_vertex>
varying vec3 vL, vN;
varying float vTh, vSide, vThk, vEdge, vLip, vCurl, vBk, vFloor, vArc;
// position attribute = (z in metres, strip parameter 0..1, side 0 inner / 1 outer)
vec3 wavePos(float z, float w, float side, out float th, out float thk, out float edge, out float lip, out float flo, out float arc){
  vec4 S = gShape(z); float te = gThEnd(z);
  if (side < .5) {
    if (w < ${W0}) {
      float k = w/${W0}; float x = S.w - 75.*pow(1.-k, 1.8);
      th = -GHPI; thk = 30.; edge = 10.; lip = 0.; flo = 1.; arc = x - S.w;
      return vec3(x, .55*(1.-exp((x-S.w)/5.)), z);
    }
    th = mix(-GHPI, te, (w-${W0})/(1.-${W0}));
    float d = te - th; edge = d; lip = 1.; flo = 1. - smoothstep(-GHPI, -.75, th); arc = (th+GHPI)*7.;
    thk = gThick(d) + 6.*pow(max(0., .75-th), 1.5);
    return vec3(gEll(S, th), z);
  }
  float tj = min(te-.04, 1.0); flo = 0.;
  if (w < ${Q0}) {
    th = mix(te, tj, w/${Q0}); float d = te - th; edge = d; lip = 1.; arc = (th+GHPI)*7.;
    thk = gThick(d);
    return vec3(gEll(S, th) + gEllN(S, th)*thk, z);
  }
  th = tj; float tJ = gThick(te-tj); vec2 pj = gEll(S, tj) + gEllN(S, tj)*tJ;
  float s = (w-${Q0})/(1.-${Q0}); float dx = 80.*pow(s, 1.7);
  edge = 10.; lip = 0.; thk = tJ + dx*.9; arc = (tj+GHPI)*7. + dx;
  return vec3(pj.x + dx, ${YSEA} + (pj.y-${YSEA})/(1. + dx/16. + dx*dx/121.), z);
}
void main(){
  float th, thk, edge, lip, flo, arc, t2;
  vec3 p = wavePos(position.x, position.y, position.z, th, thk, edge, lip, flo, arc);
  vec3 pz = wavePos(position.x+.6, position.y, position.z, t2, t2, t2, t2, t2, t2);
  vec3 pw = wavePos(position.x, position.y+.004, position.z, t2, t2, t2, t2, t2, t2);
  vN = normalize(cross(pz-p, pw-p) + vec3(0., 1e-5, 0.));
  vL = p; vTh = th; vSide = position.z; vThk = thk; vEdge = edge; vLip = lip; vFloor = flo; vArc = arc;
  vCurl = gCurl(position.x); vBk = gBroken(position.x);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const WAVE_FRAG = /* glsl */`
${G_COMMON}
#include <fog_pars_fragment>
uniform vec3 uCam, uSun, cDeep, cTeal, cJade, cAqua, cFoam, cPeach, cGold;
uniform vec3 uTrail, cSea, cReefA, cReefB;
uniform float uReveal, uReef, uReefSpeed, uSpitGlow, uRagged, uScroll, uRain, uBio, uSeaMix;
varying vec3 vL, vN;
varying float vTh, vSide, vThk, vEdge, vLip, vCurl, vBk, vFloor, vArc;

float foamLines(vec2 p){
  float w = vnoise(p*vec2(.3, .045))*2.6;
  float n = vnoise(vec2(p.x*1.9 + w, p.y*.085));
  float l = smoothstep(.7, .82, n);
  float n2 = vnoise(vec2(p.x*5.3 - w*1.7, p.y*.2 + 7.));
  l += .5*smoothstep(.76, .9, n2);
  l *= .45 + .75*vnoise(vec2(p.x*8. + w, p.y*1.1));
  return clamp(l, 0., 1.);
}
float rip(vec2 p){ return vnoise(p)*.65 + vnoise(p*2.7+11.)*.35; }
float caust(vec2 p, float t){
  vec2 q = p; float c = 0.;
  for (int i = 0; i < 3; i++){
    q += vec2(sin(q.y*1.7 + t*.9 + float(i)), cos(q.x*1.3 - t*.7 + float(i)*2.))*.6;
    c += 1./(abs(sin(q.x+q.y))*9. + .7);
  }
  return c/3.;
}
vec3 reef(vec2 p){
  vec2 q = vec2(p.x, p.y*.3);                                        // drawn out along the line of travel: speed streaks
  float m = vnoise(q*.1 + uVar.xy)*.6 + vnoise(q*.27 + 5.)*.4;       // coral gardens and the sand channels between them
  float garden = smoothstep(.4, .52, m);
  vec2 g = q*.42, gi = floor(g), gf = fract(g) - .5;                 // table corals: 2 m discs on a jittered grid
  vec2 jo = (vec2(gHash(gi), gHash(gi + 17.3)) - .5)*.5;
  float rr = .25 + .2*gHash(gi + 5.1), dd = length(gf - jo);
  float has = step(.3, gHash(gi + 9.7))*smoothstep(.36, .5, m);
  float table = smoothstep(rr, rr - .08, dd)*has;
  float shade = smoothstep(rr + .16, rr, length(gf - jo - vec2(.1, .04)))*has*(1. - table);
  float stag = vnoise(q*2.6)*.6 + vnoise(q*6.1 + 2.)*.4;             // staghorn thickets
  vec3 sand = mix(cFoam, cReefB, .3)*.6*(.88 + .24*vnoise(q*1.3 + 8.));
  vec3 thick = mix(cReefA*.36, cReefB*.52, stag)*(.6 + .6*stag);
  thick = mix(mix(cTeal*.5, thick, .45), thick, smoothstep(.2, .46, stag));
  vec3 tab = mix(cReefA*.5, cReefB*.74, gHash(gi + 2.2))*(.72 + .28*sin(dd*34.))*(.75 + .25*smoothstep(rr, 0., dd));
  vec3 c = mix(sand, thick, garden);
  c = mix(c, cTeal*.4, shade*.7);
  return mix(c, tab, table);
}
vec3 skyCol(vec3 r){
  float h = clamp(r.y, 0., 1.);
  vec3 c = mix(cPeach, cAqua, smoothstep(.02, .55, h));
  return c*(.75 + .9*pow(max(dot(r, uSun), 0.), 6.));
}
void main(){
  float z = vL.z, t = uTime, tornEdge = 0.;
  // the skirts and both ends dissolve (ordered dither) into whatever sea the world lays underneath
  float dis = max(smoothstep(${ZF - 16}., ${ZF - 1}., z), 1. - smoothstep(${ZB + 1}., ${ZB + 24}., z));
  dis = max(dis, vSide < .5 ? smoothstep(-44., -73., vArc) : smoothstep(52., 86., vL.x));
  if (dis > .001) {                                // a ragged, noise-shaped edge with only a little stipple in it
    float dn = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
    float dth = mix(dn, vnoise(vL.xz*.13 + 3.)*.65 + vnoise(vL.xz*.47)*.35, .72);
    if (dis > dth) discard;
  }
  float arcF = vArc - t*5.5;                       // flow: up the face, over the roof, down the curtain
  // ---- torn lip: fingers, then sheets with windows
  if (vLip > .5) {
    float zone = mix(.05, .75, smoothstep(0., .3, vCurl))*uRagged;
    float fin = vnoise(vec2(z*1.3 + uVar.w, vArc*.16 - t*1.1))*.45 + vnoise(vec2(z*4.3, vArc*.4 - t*2.))*.35 + vnoise(vec2(z*11., vArc*.9 - t*3.2))*.2;
    float fthr = mix(.12, 1.15, smoothstep(0., zone, vEdge));
    if (fin > fthr) discard;
    float win = vnoise(vec2(z*.33 + 3., vArc*.21 - t*1.0))*.8 + vnoise(vec2(z*1.9, vArc*.5 - t*2.2))*.2;
    float wz = smoothstep(GPI-.5, GPI+.45, vTh)*(1.-vBk)*smoothstep(.0, .25, vCurl);
    float wthr = mix(1.3, .62, wz);
    if (win > wthr) discard;
    tornEdge = max(1. - smoothstep(0., .05, fthr - fin), 1. - smoothstep(0., .035, wthr - win));
  }
  vec3 V = normalize(vL - uCam);
  vec3 N = normalize(vN);
  if (dot(N, V) > 0.) N = -N;
  // flow-aligned ripples
  vec3 Tz = vec3(0., 0., 1.), Ta = normalize(cross(N, Tz));
  vec2 rp = vec2(z*.55 + vArc*.1, arcF*.16);
  float h0 = rip(rp), hz = rip(rp + vec2(.12, 0.)), ha = rip(rp + vec2(0., .12));
  vec2 rp2 = vec2(z*2.3, arcF*.7);
  float g0 = vnoise(rp2), gz = vnoise(rp2 + vec2(.2, 0.)), ga = vnoise(rp2 + vec2(0., .2));
  float ripA = mix(1., .8, vSide*(1.-vLip));
  vec3 Nr = normalize(N + ((Tz*(h0-hz) + Ta*(h0-ha))*1.5 + (Tz*(g0-gz) + Ta*(g0-ga))*.5)*ripA);
  float y = vL.y;
  float sd = max(dot(V, uSun), 0.);                // looking toward the sun through the water
  vec3 Vr = normalize(V + (Nr-N)*.22);
  float sdr = max(dot(Vr, uSun), 0.);
  float thk = vThk*mix(1.7, .55, uReveal);
  float T = exp(-thk/2.3), T2 = exp(-thk/1.15);
  // ---- body colour by thickness / height
  vec3 body = mix(cDeep, cTeal, smoothstep(0., 4.5, y));
  body = mix(body, cJade, smoothstep(3., 11., y)*.85);
  body = mix(body, cAqua, T*.6);
  float lines = foamLines(vec2(z + vArc*.45, arcF));
  vec3 col;
  float fres = pow(1. - abs(dot(Nr, V)), 4.);
  vec3 R = reflect(V, Nr);
  if (vSide < .5) {
    // inside of the tube
    float inner = (.16 + .55*smoothstep(1., 13., y));
    col = body*inner;
    // the shadow is near-black teal, never black, and light still crawls in it
    float fine = caust(vec2(z*.9, arcF*.3), t*1.2);
    col = max(col, cDeep*.85 + cTeal*.08) + (cTeal*.2 + cJade*.05)*fine*(1.-vFloor)*(.5 + .5*smoothstep(0., 9., y))*(1. + 1.8*(1. - smoothstep(.42, .9, uRad)));
    col += (cTeal*.2 + cAqua*.05)*(1.-vCurl)*(1.-vFloor);        // open face: lit by the sky, cool
    // wall clears to glass: depth below, slanting bands of light inside the water
    float glass = uReveal*exp(-vTh*vTh*1.4)*(1.-vFloor);
    float beams = vnoise(vec2(z*.33 - y*.5 + t*.3, 3.))*.6 + vnoise(vec2(z*1.2 - y*1.7 + t*.55, 9.))*.4;
    vec3 clearC = mix(cJade, cAqua, .35)*(.24 + .32*pow(sdr, 2.)) + cGold*.35*pow(sdr, 8.);
    clearC = mix(cTeal*.55, clearC, smoothstep(-.9, .5, vTh))*(.42 + 1.05*beams)*(.7 + .85*caust(vec2(z*.42, y*.42), t*.9));   // and a net of caustics
    col = mix(col, clearC, glass*.5);
    // transmitted sun: gold where the water is thin, strongest toward the sun
    float lit = (.35 + .65*uReveal)*(1.-vFloor);
    col += (cAqua*.13 + cJade*.2)*T*lit;
    col += cGold*T*(.04 + .85*pow(sdr, 9.))*lit;
    // falling water: streaky translucency in roof and curtain
    float streaks = vnoise(vec2(z*2.6, vArc*.25 - t*2.4))*.6 + vnoise(vec2(z*7., vArc*.6 - t*4.))*.4;
    col *= mix(1., .55 + .9*streaks, smoothstep(1.2, 2.8, vTh));
    // soft sun disc + a streak that slides along the lip
    float disc = smoothstep(.992, .9988, sdr);
    vec3 dv = Vr - uSun; float streak = exp(-(dv.x*dv.x + dv.y*dv.y)*260.)*exp(-dv.z*dv.z*5.);
    col += (cGold*(disc*3.0 + streak*1.2) + mix(cGold, vec3(1.), .5)*disc*disc*.5)*max(T2, .2*uReveal)*lit;
    // caustics crawling over the roof
    float roof = smoothstep(.5, 1.3, vTh)*(1. - smoothstep(2.6, 3.4, vTh));
    col += mix(cAqua, cFoam, .4)*caust(vec2(z*.45, vArc*.45), t*1.3)*roof*T*.3*lit;
    // the tube mirrored in itself: dark behind, bright toward the mouth
    vec3 env = mix(cDeep*.6, mix(cAqua, cPeach, .4)*.9, smoothstep(.1, .95, R.z)*smoothstep(-.6, .3, R.y+.3));
    col = mix(col, env, fres*.5);
    vec3 foamC = mix(body*1.5, cFoam, .45)*(.3 + .35*smoothstep(0., 12., y)) + cGold*T*.3*pow(sdr, 3.)*lit;
    foamC = mix(foamC, body*.34, glass*.9);                      // against the light the foam lines are shadows in the glass
    foamC += cGold*uBio*(.35 + .65*vnoise(vec2(z*.7 - t, vArc*.3)));
    float linesG = max(lines, .6*glass*smoothstep(.56, .78, vnoise(vec2((z + vArc*.45)*3.3 + 7., arcF*.12))));   // more of them show in the glass
    col = mix(col, foamC, linesG*.8*(1.-vFloor*.5));
    // the line the rail has scored along the face behind us, carried up the wall by the flow
    if (uTrail.z > .001) {
      float dzb = uTrail.x - z;
      float ty = uTrail.y + dzb*.075 + sin(dzb*.45 + uVar.x)*.16*smoothstep(0., 6., dzb);
      float tw = .03 + .011*max(dzb, 0.);
      float e = (y - ty)/tw;
      float tl = exp(-e*e)*smoothstep(.15, 1.6, dzb)*exp(-max(dzb, 0.)/15.)*step(abs(vTh), 1.25);
      tl *= .5 + .5*vnoise(vec2(z*3.1, t*2.));
      col = mix(col, cFoam*(.42 + .3*lit) + cGold*(.2*T + .4*uBio), clamp(tl*uTrail.z, 0., 1.));
    }
    float flo = max(vFloor, glass*smoothstep(.15, -.85, vTh)*.6);      // the reef shows low in the cleared wall too
    if (flo > .01) {
      // trough and flat water: reef by refraction, wave shadow, whitewash where the curtain lands
      vec4 S = gShape(z);
      float dC = (S.w - S.x) - vL.x;               // metres shoreward of the curtain
      vec2 rr = vL.xz + clamp(V.xz/max(-V.y, .3), -3., 3.)*1.1 + (Nr.xz-N.xz)*2.2;
      rr.y += t*uReefSpeed + uScroll;
      vec3 rc = reef(rr)*vec3(.7, 1., .88);
      float lightF = mix(.5, 1., smoothstep(8., 38., dC));
      vec3 fl = mix(mix(cTeal, cJade, .35)*.5, rc, .66*uReef)*lightF;
      fl += rc*caust(rr*.6, t*1.6)*.4*lightF*uReef;
      vec3 R2 = R; R2.y = abs(R2.y);
      float fr2 = pow(1. - abs(dot(Nr, V)), 3.);
      fl = mix(fl, mix(env, skyCol(R2), smoothstep(-2., 6., dC)), fr2*.45);
      float washA = smoothstep(-2.5, .5, dC)*exp(-max(dC, 0.)/7.)*smoothstep(.7, 1., vCurl);
      float wn = vnoise(vec2(z*.45 + t*.6, vL.x*.45))*.6 + vnoise(vec2(z*1.6, vL.x*1.6 - t))*.4;
      float wash = smoothstep(.8 - washA*.75, 1. - washA*.6, wn + washA*.3)*smoothstep(0., .12, washA);
      fl = mix(fl, cFoam*(.28 + .5*lightF), max(wash, lines*.3*(1.-smoothstep(0., 20., dC))));
      col = mix(col, fl, flo);
    }
  } else {
    // outside skin and back of the wave, in open air
    float sunlit = .55 + .45*clamp(dot(N, uSun)*1.5 + .4, 0., 1.);
    col = body*(.3 + .35*smoothstep(2., 14., y))*sunlit;
    // the back of the wave: swell lines marching seaward and wind streaks, so it is never a flat plane
    float back = 1. - vLip;
    float sw = sin(vL.x*.62 + vnoise(vec2(z*.045, vL.x*.09))*5. - t*1.1)*.5 + .5;
    float wst = vnoise(vec2(z*.9 + t*.5, vL.x*.22 - t*.9));
    col *= mix(1., .62 + .5*sw + .3*wst, back);
    col += (cJade*.1 + cAqua*.05)*sw*back;
    col += cJade*T*.22 + cGold*T*(.05 + .55*pow(sdr, 6.))*vLip;
    col *= mix(1., .6 + .7*(vnoise(vec2(z*2.6, vArc*.25 - t*2.4))*.6 + vnoise(vec2(z*7., vArc*.6 - t*4.))*.4), vLip*smoothstep(1.4, 2.8, vTh));
    float disc = smoothstep(.988, .9985, sdr);
    col += cGold*disc*3.*T2*vLip*exp(-vEdge*1.5);
    vec3 R2 = R; R2.y = abs(R2.y);
    col = mix(col, skyCol(R2), (fres*.6 + .03)*mix(1., .45 + .4*sw, back));
    col += cGold*pow(max(dot(R2, uSun), 0.), 160.)*6.*(1.-lines);
    float gl = vnoise(vec2(z*2.7 + t*1.7, vL.x*2.7 - t*1.2));
    col += mix(cGold, cFoam, .35)*smoothstep(.8, .97, gl)*back*(.35 + 2.2*pow(max(dot(R2, uSun), 0.), 5.));   // sun glitter
    col = mix(col, cFoam*(.42 + .32*sunlit) + cGold*T*.3*vLip, lines*(.1 + .45*vLip)*(1.-vBk));
  }
  // the lip edge itself: a rim of thin water on fire
  float rim = vLip*exp(-vEdge*9.);
  col += cGold*max(rim, tornEdge*.6)*(.55 + 2.2*pow(sd, 3.))*(.4 + .6*uReveal);
  // broken wave behind the foam ball: whitewater
  float churn = vnoise(vec2(z*.5 - t*1.2, vArc*.4 + t*.7))*.6 + vnoise(vec2(z*1.7, vArc*1.3 - t*1.5))*.4;
  vec3 ww = cFoam*(.3 + .45*churn)*(.55 + .45*smoothstep(0., 10., y));
  col = mix(col, ww, vBk*smoothstep(.2, .6, churn + vBk*.5));
  col += mix(cFoam, cGold, .5)*uSpitGlow*(.02 + .1*pow(sd, 3.))*(1.-vSide);
  float rainM = vSide > .5 ? 1. : max(1. - smoothstep(.04, .3, vCurl), smoothstep(-8., -12., vArc));   // only where the sky can reach
  if (uRain*rainM > .001) {                        // rain dimpling the open face and the flat water
    vec2 rc = vec2(z, vArc)*3.4; vec2 ci = floor(rc); float fr = floor(t*5. + gHash(ci)*5.);
    vec2 cp = fract(rc) - .5 - (vec2(gHash(ci + fr*7.3), gHash(ci.yx + fr*3.1)) - .5)*.6;
    float ag = fract(t*5. + gHash(ci)*5.), rg = length(cp);
    col += mix(cFoam, cAqua, .4)*uRain*rainM*.4*(1. - ag)*smoothstep(.07, 0., abs(rg - ag*.34))*step(.45, gHash(ci + fr));
  }
  if (uSeaMix > .001) {                            // far skirts take the colour of the sea the world lays around them
    float seaK = vSide < .5 ? smoothstep(-20., -50., vArc) : smoothstep(34., 62., vL.x);
    vec3 Rs = reflect(V, N); Rs.y = abs(Rs.y);
    col = mix(col, mix(cSea, skyCol(Rs), clamp(pow(1. - abs(dot(N, V)), 3.)*.7 + .04, 0., 1.)), seaK*uSeaMix);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function buildWave(U) {
  const NZ = 220, NI = 60, NO = 36;
  const nv = (NZ + 1) * (NI + 1 + NO + 1), pos = new Float32Array(nv * 3), idx = new Uint32Array(NZ * (NI + NO) * 6);
  let p = 0, q = 0;
  const grid = (NW, side, base) => {
    for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NW; j++) { pos[p++] = lerp(ZB, ZF, i / NZ); pos[p++] = j / NW; pos[p++] = side; }
    for (let i = 0; i < NZ; i++) for (let j = 0; j < NW; j++) {
      const a = base + i * (NW + 1) + j, b = a + NW + 1;
      idx[q++] = a; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b + 1; idx[q++] = a + 1;
    }
  };
  grid(NI, 0, 0); grid(NO, 1, (NZ + 1) * (NI + 1));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 10), 140);
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WAVE_VERT, fragmentShader: WAVE_FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 0;
  return mesh;
}

// ---------------------------------------------------------------- dolphins
function dolphinGeometry(trev = false) {
  const P = [], N = [], C = [], I = [];
  // trev: a giant trevally, deep and narrow, 1.3 m long, with a forked upright tail
  const key = trev ? [[0, .03], [.06, .12], [.2, .215], [.4, .235], [.62, .17], [.8, .08], [.9, .04], [1, .03]]
    : [[0, .018], [.05, .045], [.1, .062], [.14, .125], [.22, .19], [.33, .228], [.46, .232], [.6, .19], [.74, .125], [.86, .07], [.95, .04], [1, .03]];
  const rad = (s) => { for (let i = 1; i < key.length; i++) if (s <= key[i][0]) { const a = key[i - 1], b = key[i]; return lerp(a[1], b[1], smoothstep(0, 1, (s - a[0]) / (b[0] - a[0]))); } return .03; };
  const zAt = trev ? (s) => 0.65 - 1.3 * s : (s) => 1.25 - 2.5 * s, NR = trev ? 16 : 28, NA = trev ? 8 : 10;
  for (let i = 0; i <= NR; i++) {
    const s = i / NR, r = rad(s), yc = trev ? 0.02 * Math.sin(s * PI) : -0.035 * (1 - smoothstep(0, .2, s)) + 0.02 * smoothstep(.7, 1, s);
    const tailFlat = smoothstep(.72, 1, s);               // peduncle: tall and narrow
    for (let j = 0; j < NA; j++) {
      const a = (j / NA) * PI * 2, cx = Math.sin(a), cy = Math.cos(a);
      const rx = r * (trev ? .36 : lerp(.92, .55, tailFlat)), ry = r * lerp(1.06, 1.25, tailFlat) * (cy < 0 ? .94 : 1);
      P.push(cx * rx, yc + cy * ry, zAt(s)); N.push(cx, cy, 0); C.push(smoothstep(.2, -.6, cy));
    }
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * NA + j, b = i * NA + (j + 1) % NA, c = a + NA, d = b + NA; I.push(a, b, c, b, d, c);
  }
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const fin = (r0, r1, tip, bulge, nrm) => {
    const n = 5, base = P.length / 3;
    for (let k = 0; k <= n; k++) {
      const f = k / n, w = Math.sin(f * PI);
      const le = r0.clone().lerp(tip, Math.pow(f, .8)).addScaledVector(bulge, w * .9), te = r1.clone().lerp(tip, Math.pow(f, 1.3)).addScaledVector(bulge, w * .35);
      P.push(le.x, le.y, le.z, te.x, te.y, te.z); N.push(nrm.x, nrm.y, nrm.z, nrm.x, nrm.y, nrm.z); C.push(0, 0);
    }
    for (let k = 0; k < n; k++) { const a = base + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  if (trev) {
    for (const sy of [-1, 1]) {
      fin(v(0, sy * .03, zAt(.94)), v(0, 0, zAt(1.0)), v(0, sy * .34, zAt(1.16)), v(0, 0, .035), v(1, 0, 0));                  // tail fork
      fin(v(0, sy * .2 + .02, zAt(.45)), v(0, sy * .1 + .02, zAt(.8)), v(0, sy * .3 + .02, zAt(.66)), v(0, 0, .03), v(1, 0, 0));   // dorsal / anal
    }
    for (const sx of [-1, 1]) fin(v(sx * .075, -.03, zAt(.24)), v(sx * .075, -.07, zAt(.3)), v(sx * .11, -.17, zAt(.46)), v(0, 0, .02), v(sx, 0, 0));   // sickle pectorals
  } else {
    fin(v(0, .2, zAt(.4)), v(0, .2, zAt(.56)), v(0, .52, zAt(.6)), v(0, .05, .07), v(1, 0, 0));                 // dorsal
    for (const sx of [-1, 1]) {
      fin(v(sx * .15, -.12, zAt(.27)), v(sx * .16, -.13, zAt(.35)), v(sx * .44, -.34, zAt(.43)), v(sx * .03, .0, .05), v(0, 1, 0));   // pectoral
      fin(v(0, .02, zAt(.93)), v(0, .02, zAt(1.0)), v(sx * .37, .02, zAt(1.06)), v(sx * .04, 0, .06), v(0, 1, 0));              // fluke
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aShade', new THREE.Float32BufferAttribute(C, 1)); g.setIndex(I);
  return g;
}
const DOLPHIN_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute float aShade, aPh;
uniform float uTime, uWob, uFish;
varying vec3 vL, vN; varying float vShade;
void main(){
  vec3 p = position;
  float tw = 1. - smoothstep(-1.25, .7, p.z*mix(1., 1.9, uFish));
  float ph = uTime*mix(5., 7.5, uFish) + aPh*6.283;
  float bend = sin(p.z*mix(1.9, 3.4, uFish) + ph)*(.025 + .17*tw*tw)*mix(1., .55, uFish);
  p.xy += mix(vec2(0., 1.), vec2(1., 0.), uFish)*bend;          // dolphins beat up and down, fish side to side
  vec4 wp = instanceMatrix*vec4(p, 1.);
  wp.xyz += uWob*vec3(0., sin(wp.z*2.3 + uTime*3.1)*.05, sin(wp.y*2.9 + uTime*2.6)*.07);
  vL = wp.xyz; vN = mat3(instanceMatrix)*normal; vShade = aShade;
  vec4 mvPosition = modelViewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
// drawn where water is in front of the dolphin: a dark shape haloed by transmitted light
const DOLPHIN_IN_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uCam, uSun, cDeep, cJade, cGold;
uniform float uReveal, uInside;
varying vec3 vL, vN; varying float vShade;
void main(){
  vec3 V = normalize(vL - uCam);
  float nv = abs(dot(normalize(vN), V));
  float a = uInside*mix(.1, 1., uReveal)*smoothstep(0., .2, nv)*.92;
  vec3 halo = cJade*.55 + cGold*.4*(.35 + max(dot(V, uSun), 0.));
  vec3 Nn = normalize(vN);
  vec3 bodyC = cDeep*.34 + (cJade*.07 + cGold*.02)*clamp(Nn.y*.7 + .2, 0., 1.) + cDeep*.25*vShade;   // a little light falls on the back from above
  float rim = 1. - nv;                                   // (seen obliquely along the body nv never nears 1: keep the halo to the very edge)
  vec3 col = mix(bodyC, halo, rim*rim*rim*rim*.9);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;
// drawn in open air (the leap)
const DOLPHIN_OUT_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 uCam, uSun, cDeep, cTeal, cAqua, cGold;
varying vec3 vL, vN; varying float vShade;
void main(){
  vec3 V = normalize(vL - uCam); vec3 N = normalize(vN); if (dot(N, V) > 0.) N = -N;
  float nv = abs(dot(N, V));
  vec3 col = mix(cDeep*.7 + cTeal*.12, cTeal*.75 + cAqua*.1, vShade)*(.5 + .5*clamp(N.y*.5+.5, 0., 1.));
  col += cAqua*.22*clamp(N.y, 0., 1.);
  float sdv = max(dot(V, uSun), 0.);
  col += cGold*pow(1.-nv, 4.)*(.1 + .55*sdv*sdv);
  col += cGold*pow(max(dot(reflect(V, N), uSun), 0.), 60.)*1.5;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- sprites: droplets (additive) and mist (soft)
const DROPS_VERT = /* glsl */`
${G_COMMON}
#include <fog_pars_vertex>
attribute vec4 aSeed; attribute float aKind;
uniform vec3 uCam, uSun, uSplashA, uSplashB; uniform float uLeap, uPlume;
varying vec2 vUv; varying float vA;
void main(){
  vec4 s = aSeed; vec3 p; float sz = .022 + .05*s.w*s.w; float a = 1.;
  if (aKind < .5) {                                     // torn off the lip
    float z0 = mix(uMouthZ-60., uMouthZ+30., s.x);
    vec4 S = gShape(z0); float te = gThEnd(z0); float c = gCurl(z0);
    float th0 = te - .3*s.y*s.y;
    vec2 e = gEll(S, th0); vec2 tg = normalize(gEll(S, th0+.03) - gEll(S, th0-.03));
    float life = .8 + .9*s.z; float age = fract(uTime/life + s.w*7.31)*life;
    vec2 q = e + (tg*(4. + 4.*s.y) + vec2(.8, 1.2*s.z))*age + vec2(0., -4.9*age*age);
    p = vec3(q, z0 + (s.z-.5)*1.5*age);
    a = smoothstep(0., .08, age)*(1.-smoothstep(life*.7, life, age))*smoothstep(.02, .2, c)*step(.3, q.y);
  } else if (aKind < 1.5) {                             // spindrift blown back off the crest
    float z0 = mix(${ZB + 35}., ${ZF - 4}., s.x);
    float nearK = step(fract(s.w*7.13), .62);            // most of the plume streams off the crest just ahead of the eye
    z0 = mix(z0, clamp(uCam.z + mix(-14., 62., s.x*s.x), ${ZB + 35}., ${ZF - 4}.), nearK);
    vec4 S = gShape(z0); float te = gThEnd(z0); float th0 = min(te - .03, 1.25 + .4*s.y);
    vec2 e = gEll(S, th0) + gEllN(S, th0)*gThick(te-th0);
    float life = (1.2 + 1.3*s.z)*mix(1., uPlume, .6); float age = fract(uTime/life + s.w*5.17)*life;
    vec2 q = e + vec2(6. + 4.*s.y, (2.2 + 1.6*s.z)*uPlume)*age + vec2(sin(age*5.+s.w*40.)*.3, -1.3*age*age);
    p = vec3(q, z0 + sin(age*3.+s.x*60.)*.4);
    a = smoothstep(0., .15, age)*(1.-smoothstep(life*.5, life, age))*(.8 + .5*nearK); sz *= (.8 + .5*nearK)*uPlume;
  } else {                                              // the leap: burst out of the face, punch back in
    float wh = step(.5, s.x);
    vec3 o = mix(uSplashA, uSplashB, wh);
    float age = (uLeap - mix(.02, .9, wh) - s.w*.06)*1.6;
    vec3 dir = normalize(vec3(-(.35 + s.y), (s.z-.15)*1.5, (s.w-.5)*1.4 + .5*(1.-wh*2.)));
    p = o + dir*(2.5 + 9.*s.y*s.z)*age + vec3(0., -4.9*age*age, 0.) + vec3(0., (s.z-.5)*.9, (s.y-.5)*1.6);
    a = step(0., age)*(1.-smoothstep(.45, .95, age))*(.35 + .65*s.z);
  }
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  float dist = -mvPosition.z, want = max(sz, dist*.0019);
  a *= clamp(pow(sz/want, 1.3), .12, 1.);
  float sd = max(dot(normalize(p - uCam), uSun), 0.);
  vA = a*(.9 + 4.*pow(sd, 3.))*(.4 + .6*fract(s.w*13.7));
  vUv = position.xy;
  mvPosition.xy += position.xy*want;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DROPS_FRAG = /* glsl */`
#include <fog_pars_fragment>
${G_FOG_FADE}
uniform vec3 cGold;
varying vec2 vUv; varying float vA;
void main(){
  float d = length(vUv); if (d > 1. || vA < .003) discard;
  float f = 1. - smoothstep(.15, 1., d);
  gl_FragColor = vec4(mix(cGold, vec3(1.), .3)*f*vA*gFogKeep(), 1.);
}`;
const MIST_VERT = /* glsl */`
${G_COMMON}
#include <fog_pars_vertex>
attribute vec4 aSeed; attribute float aKind;
uniform vec3 uCam, uSun; uniform float uSpit;
varying vec2 vUv; varying float vA, vSd, vH, vRnd, vKind;
void main(){
  vec4 s = aSeed; vec3 p; float sz = 2.; float a = 0.;
  if (aKind < .5) {                                     // foam ball churn
    vec4 S = gShape(uFoamZ);
    float an = s.x*6.283 + uTime*(.5 + s.y)*(s.z > .5 ? 1. : -1.), el = (s.y-.35)*2.6;
    float rr = .55 + .5*s.w;
    p = vec3(S.w + cos(an)*cos(el)*S.x*rr, S.z*.85 + sin(el)*S.y*.8*rr, uFoamZ + sin(an)*cos(el)*5.*rr + 2.5 + 1.5*sin(uTime*1.3 + s.w*20.));
    sz = 1.1 + 1.7*s.z; a = .1;
  } else if (aKind < 1.5) {                             // spray where the curtain lands
    float z0 = mix(uFoamZ + 4., uMouthZ + 6., s.x);
    vec4 S = gShape(z0); float c = gCurl(z0);
    float life = 1. + s.z; float age = fract(uTime/life + s.w*3.7)*life;
    p = vec3(S.w - S.x*.92 - (1. + 2.5*s.y)*age, .5 + (3.2 + 2.*s.z)*age - 2.6*age*age, z0 - age*2.);
    sz = 1. + 1.6*s.y + age*1.5; a = .2*smoothstep(0., .15, age)*(1.-smoothstep(life*.4, life, age))*smoothstep(.85, 1., c);
  } else if (aKind < 2.5) {                             // mist hanging in the tube, thick toward the foam ball
    float z0 = uFoamZ + 4. + 62.*s.x*s.x + mod(uTime*(1.5 + 2.*s.y), 8.);
    vec4 S = gShape(z0); float an = s.z*6.283 + uTime*.15;
    p = vec3(S.w + cos(an)*S.x*.7*s.w, S.z + sin(an)*S.y*.7*s.w, z0);
    sz = 2.6 + 3.*s.y; a = .03*(1.-s.x*.7)*(1. - .6*sin(3.14159*uSpit));
  } else if (aKind < 3.5) {                             // the spit: a travelling front with a thin torn tail
    float lag = s.x*s.x;
    float fr = uSpit*1.3 - .3*lag;
    float z0 = uFoamZ + fr*175.;
    vec4 S = gShape(z0); float an = s.z*6.283 + uTime*(.4 + s.y);
    p = vec3(S.w + cos(an)*S.x*.82*sqrt(s.w), S.z + sin(an)*S.y*.82*sqrt(s.w), z0);
    sz = 1.6 + 2.6*s.y + fr*1.5; a = .06*mix(1., .3, smoothstep(0., .5, lag))*smoothstep(0., .06, fr)*(1.-smoothstep(.6, .95, fr))*step(.001, uSpit)*(1.-step(.999, uSpit));
  } else {                                              // chunks of foam thrown forward off the ball
    vec4 S = gShape(uFoamZ);
    float life = .7 + .8*s.z; float age = fract(uTime/life + s.w*5.3)*life;
    float an = s.x*6.283, rr = sqrt(s.y);
    vec3 o = vec3(S.w + cos(an)*S.x*.85*rr, S.z*.9 + sin(an)*S.y*.75*rr, uFoamZ + 3.);
    vec3 v = vec3(cos(an)*1.6*rr, 2.4 + 3.*s.z + sin(an)*1.5, 5. + 9.*s.w);
    p = o + v*age + vec3(0., -4.9*age*age, 0.); p.y = max(p.y, .3);
    sz = (.07 + .26*s.y*s.z)*(1. + .8*age); a = .8*smoothstep(0., .1, age)*(1. - smoothstep(life*.5, life, age));
  }
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  a *= smoothstep(.6, 3.5, -mvPosition.z);                // never slap the lens
  vSd = max(dot(normalize(p - uCam), uSun), 0.); vH = clamp(p.y/14., 0., 1.); vA = a; vRnd = s.w*17.; vKind = aKind;
  vUv = position.xy;
  mvPosition.xy += position.xy*sz;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const MIST_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec3 cFoam, cGold, cTeal, cJade; uniform float uTime, uReveal;
varying vec2 vUv; varying float vA, vSd, vH, vRnd, vKind;
float h2(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
void main(){
  float d = length(vUv); if (d > 1. || vA < .003) discard;
  float n = vn(vUv*1.8 + vRnd + uTime*.25);
  float f = (1. - smoothstep(.1, 1., d))*(.2 + 1.25*n*n);            // torn, not a veil
  // teal in shadow, gold only where the sun stands behind it
  vec3 col = mix(cTeal*.5 + cJade*.22, cFoam*.6, .18 + .4*vH) + cGold*(.02 + .55*pow(vSd, 12.))*(.4 + .6*uReveal);
  if (vKind < .5) col = cFoam*(.55 + .3*vH) + cGold*.25*pow(vSd, 6.);     // the foam ball's own cloud is white
  if (vKind > 3.5) {                                                 // foam chunks: solid, bright, ragged
    f = smoothstep(.12, .6, (1. - d)*(.45 + .9*n));
    col = cFoam*(.5 + .35*vH) + cGold*(.08 + .7*pow(vSd, 3.));
  }
  gl_FragColor = vec4(col, clamp(f*vA, 0., 1.));
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- foam ball and sun shafts
const FOAM_VERT = /* glsl */`
${G_COMMON}
#include <fog_pars_vertex>
varying vec3 vL, vD; varying float vNz;
void main(){
  vec3 d = normalize(position); float t = uTime;
  vec4 S = gShape(uFoamZ);
  // billows: big lobes rolling up and forward, cauliflower on top of them
  float n = vnoise3(d*1.8 + vec3(0., -t*.8, t*.6))*.6 + vnoise3(d*3.9 + vec3(t*.6, t*1.0, 0.))*.4;
  float lobe = smoothstep(.2, .8, n);
  float bump = abs(vnoise3(d*6.5 + vec3(t*.5, -t*1.3, t*.4))*2. - 1.);        // cauliflower heads on the billows
  float r = (.6 + .56*lobe + .2*bump)*(1. + .07*sin(t*2.1 + d.y*3.));
  vec3 p = vec3(S.w + d.x*S.x*r, S.z*.9 + d.y*S.y*.95*r, uFoamZ - 3. + d.z*7.5*r + 1.2*lobe*max(d.z, 0.));
  p.y = max(p.y, .25);
  vL = p; vD = d; vNz = lobe;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FOAM_FRAG = /* glsl */`
${G_COMMON}
#include <fog_pars_fragment>
uniform vec3 uCam, uSun, cDeep, cFoam, cGold, cTeal, cJade; uniform float uReveal, uBio;
varying vec3 vL, vD; varying float vNz;
void main(){
  float t = uTime;
  vec3 N = normalize(cross(dFdx(vL), dFdy(vL)) + vec3(0., 0., 1e-5));
  if (dot(N, vD) < 0.) N = -N;
  N = normalize(mix(N, vD, .4));
  vec3 V = normalize(vL - uCam);
  float c1 = abs(vnoise3(vL*.75 + vec3(0., -t*1.3, t*.9))*2. - 1.), c2 = abs(vnoise3(vL*2. + vec3(t*.8, -t*1.6, 0.))*2. - 1.);
  float f2 = vnoise3(vL*6. + vec3(t*2., -t*3., 0.));
  // whitewater: bright rolling heads with dark teal creases where they meet
  float c3 = abs(vnoise3(vL*4.6 + vec3(-t*1.1, -t*2.2, t))*2. - 1.);
  float crease = smoothstep(0., .42, c1)*(.6 + .4*smoothstep(0., .4, c2))*(.68 + .32*smoothstep(0., .4, c3))*(.8 + .2*f2);
  float key = clamp(dot(N, normalize(vec3(-.25, .55, .8)))*.55 + .45, 0., 1.);    // light pours in from the mouth and roof
  vec3 col = mix(cTeal*.5 + cJade*.14 + cFoam*.1, cFoam*1.05, crease*(.3 + .7*pow(key, 1.3)));
  float core = smoothstep(.5, .1, vNz);                                           // hollows between the billows
  col = mix(col, cDeep*.5 + cTeal*.5 + cFoam*.08, core*.36);
  float sunSide = clamp(dot(N, uSun)*.5 + .5, 0., 1.);
  float rim = 1. - abs(dot(N, V)); rim *= rim;
  col += cGold*(.9*rim*sunSide*sunSide + .22*pow(sunSide, 4.)*crease)*(.45 + .55*uReveal)*(1. - core*.7);
  col += cFoam*.4*smoothstep(.72, .9, f2)*key*(1. - core);                        // flecks of spray on the surface
  col += cGold*uBio*crease*(.25 + .6*f2);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const SHAFT_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute float aI;
uniform vec3 uCam, uSun, uShaftO; uniform float uTime;
varying vec2 vUv; varying float vF;
float hh(float a, float b){ return fract(sin(a*127.1 + b*311.7)*43758.5453); }
void main(){
  float r1 = hh(aI, 1.3), r2 = hh(aI, 7.7), r3 = hh(aI, 3.1);
  vec3 D0 = -uSun;
  vec3 dir = normalize(D0*.55 + vec3(-(.15 + 1.0*r1), -(.1 + .85*r2), (r3 - .3)*1.7));
  vec3 o = uShaftO + vec3(0., 0., (r3-.5)*5.) + uSun*.5;
  float L = 9. + 10.*r3, al = position.x;
  vec3 c = o + dir*al*L;
  vec3 W = normalize(cross(dir, c - uCam) + vec3(0., 1e-5, 0.));
  vec3 p = c + W*position.y*(.07 + al*(.16 + .5*r2));
  vUv = position.xy; vF = (.55 + .45*sin(uTime*(1.5 + 2.*r1) + aI*2.4))*smoothstep(1.5, 6., distance(c, uCam));
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
#include <fog_pars_fragment>
${G_FOG_FADE}
uniform vec3 cGold; uniform float uShaft;
varying vec2 vUv; varying float vF;
void main(){
  float ac = 1. - vUv.y*vUv.y;
  float a = ac*ac*smoothstep(0., .06, vUv.x)*pow(1.-vUv.x, 1.3)*uShaft*vF;
  gl_FragColor = vec4(cGold*.6*a*gFogKeep(), 1.);
}`;

function spriteGeometry(n, kinds, rng) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(n * 4), kind = new Float32Array(n);
  let k = 0;
  for (let ki = 0; ki < kinds.length; ki++) for (let i = 0; i < kinds[ki]; i++, k++) { kind[k] = ki; for (let j = 0; j < 4; j++) seed[k * 4 + j] = rng(); }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 10), 160);
  return g;
}

// The foam ball's geometry: bit for bit what new THREE.IcosahedronGeometry(1, 30) holds (three r170, PolyhedronGeometry:
// the same arithmetic in the same order), made one face of the twenty at a time with a hand-back before each. Three's
// constructor is one call of 57,660 vertices in which the page gets no turn.
async function foamBallGeometry(ctx) {
  const t = (1 + Math.sqrt(5)) / 2, R = 1, cols = 31, n3 = cols * cols * 9, n2 = cols * cols * 6;
  const V = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  const F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  const pos = new Float32Array(20 * n3), nor = new Float32Array(20 * n3), uv = new Float32Array(20 * n2);
  const G = new Float64Array((cols + 1) * (cols + 2) / 2 * 3), P = new Float64Array(n3), T = new Float64Array(n2);   // one face, in doubles as three holds it
  // the passes of three's constructor, each under its name there, over one face
  const subdivideFace = (ax, ay, az, bx, by, bz, cx, cy, cz) => {
    // the grid of points between the corners a, b, c, row by row ...
    for (let i = 0, k = 0; i <= cols; i++) {
      const al = i / cols, rows = cols - i;
      const px = ax + (cx - ax) * al, py = ay + (cy - ay) * al, pz = az + (cz - az) * al, qx = bx + (cx - bx) * al, qy = by + (cy - by) * al, qz = bz + (cz - bz) * al;
      for (let j = 0; j <= rows; j++, k += 3) {
        if (j === 0 && i === cols) { G[k] = px; G[k + 1] = py; G[k + 2] = pz; }
        else { const be = j / rows; G[k] = px + (qx - px) * be; G[k + 1] = py + (qy - py) * be; G[k + 2] = pz + (qz - pz) * be; }
      }
    }
    // ... and the 961 triangles, corners in three's order (r0, r1: where rows i and i + 1 start in the grid)
    for (let i = 0, p = 0, r0 = 0; i < cols; i++) {
      const r1 = r0 + cols + 1 - i;
      for (let j = 0; j < 2 * (cols - i) - 1; j++) {
        const k = j >> 1, o0 = (r0 + k + 1) * 3, o1 = (r1 + k + (j & 1)) * 3, o2 = (j & 1 ? r1 + k : r0 + k) * 3;
        P[p++] = G[o0]; P[p++] = G[o0 + 1]; P[p++] = G[o0 + 2]; P[p++] = G[o1]; P[p++] = G[o1 + 1]; P[p++] = G[o1 + 2]; P[p++] = G[o2]; P[p++] = G[o2 + 1]; P[p++] = G[o2 + 2];
      }
      r0 = r1;
    }
  };
  const applyRadius = () => {
    for (let i = 0; i < n3; i += 3) {
      const x = P[i], y = P[i + 1], z = P[i + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
      P[i] = x * s * R; P[i + 1] = y * s * R; P[i + 2] = z * s * R;
    }
  };
  const generateUVs = () => {
    for (let i = 0, j = 0; i < n3; i += 3, j += 2) {
      const x = P[i], y = P[i + 1], z = P[i + 2];
      T[j] = Math.atan2(z, -x) / 2 / Math.PI + 0.5; T[j + 1] = 1 - (Math.atan2(-y, Math.sqrt(x * x + z * z)) / Math.PI + 0.5);
    }
  };
  const correctUVs = () => {                               // per triangle, by the azimuth of its centroid
    for (let i = 0, j = 0; i < n3; i += 9, j += 6) {
      const azi = Math.atan2((P[i + 2] + P[i + 5] + P[i + 8]) * (1 / 3), -((P[i] + P[i + 3] + P[i + 6]) * (1 / 3)));
      for (let m = 0; m < 3; m++) {
        const ux = T[j + m * 2];
        if (azi < 0 && ux === 1) T[j + m * 2] = ux - 1;
        if (P[i + m * 3] === 0 && P[i + m * 3 + 2] === 0) T[j + m * 2] = azi / 2 / Math.PI + 0.5;
      }
    }
  };
  const correctSeam = () => {
    for (let j = 0; j < n2; j += 6) {
      const x0 = T[j], x1 = T[j + 2], x2 = T[j + 4];
      if (Math.max(x0, x1, x2) > 0.9 && Math.min(x0, x1, x2) < 0.1) { if (x0 < 0.2) T[j] += 1; if (x1 < 0.2) T[j + 2] += 1; if (x2 < 0.2) T[j + 4] += 1; }
    }
  };
  const normalizeNormals = (from) => {                     // the positions as stored (32 bits), made unit length again
    for (let i = from, e = i + n3; i < e; i += 3) {
      const x = pos[i], y = pos[i + 1], z = pos[i + 2], s = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
      nor[i] = x * s; nor[i + 1] = y * s; nor[i + 2] = z * s;
    }
  };
  for (let f = 0; f < 20; f++) {
    await ctx.yield?.();
    const a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, c = F[f * 3 + 2] * 3;
    subdivideFace(V[a], V[a + 1], V[a + 2], V[b], V[b + 1], V[b + 2], V[c], V[c + 1], V[c + 2]);
    applyRadius(); generateUVs(); correctUVs(); correctSeam();
    pos.set(P, f * n3); uv.set(T, f * n2);                 // to 32 bits, as Float32BufferAttribute stores them
    normalizeNormals(f * n3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('green-room') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PAL).map((h) => new THREE.Color(h));
  const hueShift = rng.range(-0.018, 0.018), satShift = rng.range(-0.04, 0.06);
  pal[2].offsetHSL(hueShift, satShift, 0); pal[3].offsetHSL(hueShift * 0.6, 0, 0); pal[1].offsetHSL(hueShift, 0, 0);
  const st = { time: 0, rad: 1, mouthZ: 62, foamZ: -48, swell: rng.range(0.95, 1.08) * (opts.swell ?? 1), v: [rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 6.28), rng.range(0, 50)] };
  const sunEl = (24 + rng.range(-3, 4)) * PI / 180, sunAz = (25 + rng.range(-5, 6)) * PI / 180;
  const sun = opts.sunDir ? new THREE.Vector3().fromArray(opts.sunDir).normalize()
    : new THREE.Vector3(Math.sin(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(sunAz) * Math.cos(sunEl));

  const U = {
    uTime: { value: 0 }, uRad: { value: 1 }, uMouthZ: { value: st.mouthZ }, uFoamZ: { value: st.foamZ }, uSwell: { value: st.swell },
    uVar: { value: new THREE.Vector4(...st.v) }, uCam: { value: new THREE.Vector3(0, 5, -20) }, uSun: { value: sun },
    cDeep: { value: pal[0] }, cTeal: { value: pal[1] }, cJade: { value: pal[2] }, cAqua: { value: pal[3] }, cFoam: { value: pal[4] }, cPeach: { value: pal[5] }, cGold: { value: pal[6] },
    uReveal: { value: 1 }, uReef: { value: opts.reef === false ? 0 : 1 }, uReefSpeed: { value: opts.reefSpeed ?? 13 }, uSpitGlow: { value: 0 }, uRagged: { value: rng.range(0.85, 1.25) },
    uSpit: { value: 0 }, uLeap: { value: 0 }, uSplashA: { value: new THREE.Vector3() }, uSplashB: { value: new THREE.Vector3() },
    uShaftO: { value: new THREE.Vector3() }, uShaft: { value: 0.3 }, uInside: { value: 1 }, uWob: { value: 0 },
    uScroll: { value: 0 }, uRain: { value: opts.rain ?? 0 }, uPlume: { value: opts.plume ?? 1 },
    uBio: { value: opts.bio ?? 0 }, uTrail: { value: new THREE.Vector3(0, 0, 0) }, uFish: { value: 0 },
    cSea: { value: new THREE.Color(opts.sea || '#0c5f6e') }, uSeaMix: { value: opts.sea ? 1 : 0 },
    cReefA: { value: opts.reefColors ? new THREE.Color(opts.reefColors[0]) : pal[6] }, cReefB: { value: opts.reefColors ? new THREE.Color(opts.reefColors[1]) : pal[5] },
  };
  const uni = (extra) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, extra || {});
  const object = new THREE.Group(); object.name = 'the-green-room-hero';

  // wave
  const wave = buildWave(uni()); object.add(wave);
  await ctx.yield?.();

  // foam ball
  const foam = new THREE.Mesh(await foamBallGeometry(ctx), new THREE.ShaderMaterial({ uniforms: uni(), vertexShader: FOAM_VERT, fragmentShader: FOAM_FRAG, fog: true }));
  foam.frustumCulled = false; object.add(foam);
  await ctx.yield?.();

  // dolphins: two passes over the same instances (inside the water, in the air)
  const trev = opts.cast === 'trevally', ND = trev ? 24 : 6, dGeo = dolphinGeometry(trev);
  U.uFish.value = trev ? 1 : 0;
  const ph = new Float32Array(ND); for (let i = 0; i < ND; i++) ph[i] = rng();
  dGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
  const dIn = new THREE.InstancedMesh(dGeo, new THREE.ShaderMaterial({
    uniforms: uni({ uWob: { value: 1 } }), vertexShader: DOLPHIN_VERT, fragmentShader: DOLPHIN_IN_FRAG, fog: true, side: THREE.DoubleSide,
    transparent: true, depthWrite: false, depthFunc: THREE.GreaterDepth }), ND);
  const dOut = new THREE.InstancedMesh(dGeo, new THREE.ShaderMaterial({
    uniforms: uni({ uWob: { value: 0 } }), vertexShader: DOLPHIN_VERT, fragmentShader: DOLPHIN_OUT_FRAG, fog: true, side: THREE.DoubleSide }), ND);
  dOut.instanceMatrix = dIn.instanceMatrix;
  dIn.frustumCulled = dOut.frustumCulled = false; dIn.renderOrder = 2; dOut.renderOrder = 1;
  object.add(dOut, dIn);
  const pod = [];
  for (let i = 0; i < ND; i++) pod.push({ dz: -7 + i * 6.2 + rng.range(-1.5, 1.5), th: rng.range(-0.3, 0.5), depth: rng.range(0.75, 1.5), ph: rng.range(0, 6.28), sc: rng.range(0.9, 1.15) });
  if (trev) {
    // a school: packed along the wall from just behind the eye to 20 m ahead, at every depth
    for (let i = 1; i < ND; i++) Object.assign(pod[i], { dz: -5 + 26 * ((i * 0.618) % 1) + rng.range(-1, 1), th: rng.range(-0.28, 0.5), depth: rng.range(0.45, 1.7), sc: rng.range(0.85, 1.35) });
    Object.assign(pod[1], { dz: 0.8, th: 0.12, depth: 0.5, sc: 1.4 }); Object.assign(pod[2], { dz: 3.2, th: 0.02, depth: 0.6, sc: 1.3 }); Object.assign(pod[3], { dz: 5.5, th: 0.2, depth: 0.55, sc: 1.25 });
  } else {
    // the pod keeps station at arm's length: three right beside the eye, two further along the wall (dz from setPod's z)
    Object.assign(pod[1], { dz: 0.6, th: 0.1, depth: 0.7, sc: 1.3 });
    Object.assign(pod[2], { dz: 5.2, th: -0.04, depth: 0.85, sc: 1.2 });
    Object.assign(pod[3], { dz: 10.5, th: 0.26, depth: 0.8, sc: 1.15 });
    Object.assign(pod[4], { dz: -5.5, th: 0.0, depth: 0.9, sc: 1.15 });
    Object.assign(pod[5], { dz: 17, th: 0.04, depth: 1.1 });
  }
  pod[0].dz = 13; pod[0].th = 0.12; pod[0].depth = 0.9; pod[0].sc = trev ? 1.5 : 1.08;
  await ctx.yield?.();

  // sprites
  const srng = rng.fork ? rng.fork('sprites') : rng;
  const drops = new THREE.Mesh(spriteGeometry(3000, [1750, 950, 300], srng), new THREE.ShaderMaterial({
    uniforms: uni(), vertexShader: DROPS_VERT, fragmentShader: DROPS_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const mist = new THREE.Mesh(spriteGeometry(2360, [700, 500, 300, 600, 260], srng), new THREE.ShaderMaterial({
    uniforms: uni(), vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, fog: true, transparent: true, depthWrite: false }));
  drops.frustumCulled = mist.frustumCulled = false; mist.renderOrder = 3; drops.renderOrder = 4;
  object.add(mist, drops);

  // shafts
  const NS = 24, sp = [], si = [], sx = [];
  for (let i = 0; i < NS; i++) { const b = i * 4; sp.push(0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0); sx.push(i, i, i, i); si.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sGeo.setAttribute('aI', new THREE.Float32BufferAttribute(sx, 1)); sGeo.setIndex(si);
  const shafts = new THREE.Mesh(sGeo, new THREE.ShaderMaterial({
    uniforms: uni(), vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthTest: false }));
  shafts.frustumCulled = false; shafts.renderOrder = 5; object.add(shafts);
  await ctx.yield?.();

  // ---- state and helpers
  const S = {}, v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), vx = new THREE.Vector3(), vy = new THREE.Vector3(), vz = new THREE.Vector3();
  const M = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), camL = new THREE.Vector3(0, 5, -20);
  let podZ = 4, leap = 0, leapDriven = false, spit = 0, reveal = 1, shaftBoost = 0, trail = 0;
  const leapOff = rng.range(0, 9);
  const wallPoint = (z, th, out = new THREE.Vector3()) => { mShape(z, st, S); mEll(S, th, out); out.z = z; return out; };
  const tubeAt = (z) => { mShape(z, st, S); return { cx: S.cx, cy: S.cy, a: S.a, b: S.b, wallX: WALLX, floorY: 0, curl: mCurl(z, st) }; };
  const leapPos = (l, ret, out) => {
    const zA = podZ + pod[0].dz, z = zA + 15 * l - 15 * ret;
    mShape(z, st, S); mEll(S, pod[0].th, out);
    const s = Math.sin(PI * clamp(l, -0.1, 1.1));
    out.x += 0.9 - 6.2 * s; out.y += 2.6 * s - 0.6 * clamp(l, 0, 1); out.z = z; return out;
  };
  const sunPoint = (from, out) => {                       // where a ray toward the sun leaves the tube
    out.copy(from);
    for (let i = 0; i < 60; i++) {
      out.addScaledVector(sun, 0.5); mShape(out.z, st, S);
      const ex = (out.x - S.cx) / S.a, ey = (out.y - S.cy) / S.b; if (ex * ex + ey * ey > 1) break;
    }
    return out;
  };
  const placeDolphins = (time) => {
    const l = clamp(leap, 0, 1), ret = leapDriven ? 0 : smoothstep(2.4, 8.6, (time + leapOff) % 9);
    for (let i = 0; i < ND; i++) {
      const d = pod[i];
      if (i === 0) {
        leapPos(l, ret, v1);
        if (leap > 0 && leap < 1) { leapPos(l + 0.02, ret, v2); leapPos(l - 0.02, ret, v3); vz.subVectors(v2, v3).normalize(); } else vz.set(0, 0, 1);
      } else {
        const z = podZ + d.dz + 1.1 * Math.sin(time * 0.23 + d.ph), w = time * 0.37 + d.ph * 3, th = d.th + 0.11 * Math.sin(w);
        mShape(z, st, S); mEll(S, th, v1);
        const nx = S.b * Math.cos(th), ny = S.a * Math.sin(th), nl = Math.hypot(nx, ny) || 1;
        v1.x += nx / nl * d.depth; v1.y += ny / nl * d.depth; v1.z = z;
        vz.set(0, Math.cos(w) * 0.12, 1).normalize();
      }
      vx.crossVectors(up, vz).normalize(); vy.crossVectors(vz, vx);
      M.makeBasis(vx, vy, vz).scale(v2.set(d.sc, d.sc, d.sc)).setPosition(v1);
      dIn.setMatrixAt(i, M);
    }
    dIn.instanceMatrix.needsUpdate = true;
    leapPos(0.05, ret, U.uSplashA.value); leapPos(0.95, ret, U.uSplashB.value);
    U.uSplashA.value.x -= 0.6; U.uSplashB.value.x -= 0.6;
  };
  placeDolphins(0);

  // ---- anchors (default tube)
  const A3 = (v) => [Math.round(v.x * 100) / 100, Math.round(v.y * 100) / 100, Math.round(v.z * 100) / 100];
  const mouthS = mShape(st.mouthZ, st, {});
  const anchors = {
    portalSeat: { position: [mouthS.cx, 7.2, st.mouthZ], facing: [0, 0, -1], radius: 7 },
    mouth: [mouthS.cx, 7, st.mouthZ],
    flyThrough: [[0.5, 5.5, -38], [1, 5, -22], [2.2, 7.5, -4], [1.5, 5.5, 14], [0, 4, 30], [-1, 6, 46], [mouthS.cx, 7.2, st.mouthZ]],
    lowLine: [[-1, 1.5, -30], [-1, 1.5, 0], [-1.5, 1.5, 40]],
    highLine: [[4.2, 7.5, -20], [4.6, 8.5, 0], [4.2, 7.5, 20]],
    crestStart: [3.5, 15.5 * st.swell, 0],
    lookBack: [0.5, 5, st.foamZ + 4], foamBall: [0, 6, st.foamZ],
    dolphinPod: [WALLX + 1.1, 7, podZ + 8], leapFrom: A3(leapPos(0.05, 0, v1)), leapTo: A3(leapPos(0.95, 0, v1)),
    lipSun: A3(sunPoint(v2.set(1, 5, -10), v1)), sunDir: A3(sun),
    canoeLane: [[-34, 1, st.mouthZ + 30], [-30, 1, st.mouthZ + 85]],
  };

  // ---- controls
  const api = {
    object, radius: 48, height: 15, center: new THREE.Vector3(0, 6.5, 10), anchors, ground: true, groundY: -0.6,
    setReveal(k) { reveal = clamp(k, 0, 1); },
    setTube(o = {}) { if (o.radius != null) st.rad = clamp(o.radius, 0.3, 1.3); if (o.mouthZ != null) st.mouthZ = o.mouthZ; if (o.foamZ != null) st.foamZ = o.foamZ; },
    setLeap(l) { leapDriven = true; leap = clamp(l, 0, 1.6); },
    setSpit(s) { spit = clamp(s, 0, 1); },
    setPod(z) { podZ = z; },
    setSun(d) { sun.fromArray(d).normalize(); },
    setScroll(m) { U.uScroll.value = m; },
    setTrail(k) { trail = clamp(k, 0, 1); },
    shaftOrigin: U.uShaftO.value, state: st,
    setProgress(u) {
      const pinch = smoothstep(0.5, 0.56, u) * (1 - smoothstep(0.64, 0.7, u));
      reveal = smoothstep(0.28, 0.42, u) * (1 - 0.6 * pinch);
      st.rad = lerp(1, 0.36, pinch);
      spit = clamp((u - 0.65) / 0.125, 0, 1);
      leapDriven = true;
      leap = u < 0.7 ? clamp((u - 0.42) / 0.04, 0, 1.6) : clamp((u - 0.85) / 0.04, 0, 1.6);
    },
    tubeAt, wallPoint,
    update(dt, time, camera) {
      st.time = time; U.uTime.value = time;
      if (camera) { object.updateMatrixWorld(); camL.copy(camera.position); object.worldToLocal(camL); }
      if (!leapDriven) leap = clamp(((time + leapOff) % 9) / 1.6, 0, 1.6);
      U.uRad.value = st.rad; U.uMouthZ.value = st.mouthZ; U.uFoamZ.value = st.foamZ;
      U.uCam.value.copy(camL); U.uReveal.value = reveal; U.uLeap.value = leap; U.uSpit.value = spit;
      U.uTrail.value.set(camL.z, camL.y - 1.0, trail);
      const sb = Math.sin(PI * spit); U.uSpitGlow.value = sb; U.uShaft.value = Math.max(0.13 * reveal, 1.5 * sb) + shaftBoost;
      placeDolphins(time);
      // dolphins-in-water pass only makes sense from inside the tube or from behind the wave
      mShape(camL.z, st, S);
      U.uInside.value = smoothstep(S.cx - S.a - 3, S.cx - S.a + 1, camL.x);
      // sun burn-through point as seen from the camera (or from mid-tube when the camera is outside)
      const ex = (camL.x - S.cx) / S.a, ey = (camL.y - S.cy) / S.b;
      if (ex * ex + ey * ey < 1 && camL.z > ZB && camL.z < ZF) v2.copy(camL); else v2.set(S.cx + 1, 5, podZ - 10);
      sunPoint(v2, U.uShaftO.value);
    },
    dispose() {},
  };

  api.update(0, 0, null);
  return api;
}
