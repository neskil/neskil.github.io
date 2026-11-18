// THE ICE FINGER (brinicle-ice-finger): twelve hours in forty seconds under Antarctic sea ice, built 8x life size.
//
// MAP OF THIS FILE (in order)
//   1  constants: the frame (ceiling y 0, shelf y -64, hero at 0,-64,-128), GLSL chunks shared by every shader
//      (POOL_GLSL = the ceiling's panes as a light mask, used by ceiling, bed, creatures and shafts alike).
//   2  shaders: open water (DOME_GLSL: the dome, and what the ceiling fades to; lit haze and drifting shafts when the
//      camera is deep, uDeepK), ceiling (+ far-field leads and scoured fields for the chase), bed, critters (stars +
//      urchins), benthos (everything else that sits or swims: sponges, anemones, worms, walkers, tripod, cable, portal
//      rim, raft body, seal with its mottled coat; aTip carries surface flags: pores, faceted rock with patchy rime),
//      lesser fingers (aK.z = 1: the giants of the chase), platelets
//      (translucent), algae strands, seal bubbles, anchor ice (ANCH_*: glass shards with lit edges).
//   3  geometry helpers: makeAcc/tube (merged benthos mesh), shard clump / star / urchin / seal / finger / raft builders.
//   4  build(ctx):
//        4a seeded moods  -> `look` (hour: day | golden | night; ice: scoured | tide crack | platelet year;
//                            bed: gravel | spicule mat; cast: stars | urchin year | second seal; rare raft)
//        4b bed function  -> bedY(x, z); the hero is built on it (groundAt) at HERO = (0, -64, -128)
//        4c THE PATH      -> control points `pts` (entry line, 2 anticlockwise turns round the finger, the chase
//                            down the gully, 90 m straight at 18 degrees into the portal); key fractions U.*;
//                            the frost front table (aheadKeys: metres ahead of the lens of the first unfrozen ice)
//        4d sky and ice   -> dome, ceiling (+ baked ceiling map), platelets, strands, lesser fingers and the ten
//                            giants beside the chase, shafts (three groups at the panes, six along the chase)
//        4e bed and cast  -> bed, anchor ice, stars (hero nine at the huddle anchor), urchins, benthos mesh (the
//                            fluted vase sponges are built in `sponge`; then bush sponges, anemones, ribbon worms,
//                            walkers, tripod and cable, the portal's rock rim with its boulders and blades), seal(s),
//                            fish, jellies, particles, the rare raft
//        4f return        -> pois, pace(u), camera, portal, post (EXPOSURE, FOG, BLOOM, GRADE are set there
//                            and in `look`), update(), dispose()
//   Scripted moments, all keyed to u in update():
//        hero.setLength   the finger grows, touching down at U.td          (uniform uTipY inside the hero)
//        hero.setTouch    the dust ring                                    (uTouch)
//        frontAt(u)       the frost front in metres from the touchdown     (uFront, shared by hero, critters,
//                         benthos and the portal rim: one test freezes them all). u 0.54-0.63 it runs 13 m ahead
//                         of the lens (the race: its lit edge crosses the lower third), then surges to the portal
//        SU.uKeyDir       the key light wheels 40 degrees through the flight (also hero.setLight and the shafts)
//        sealAt(u)        the seal: circling its hole, then overtaking on the left in the chase (u 0.51-0.62)
//        raft             (rare) anchor ice tears loose and floats up on the right at u ~0.70-0.84
//        uDeepK           camera depth 58-105 m: lit haze, far ceiling, paler fog, chase shafts at full strength
//        uGiant           u 0.30-0.50: the giant fingers of the chase let down out of the ceiling
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/brinicle-ice-finger.js';

const HX = 0, HY = -64, HZ = -128;            // hero origin (the touchdown point) in world space
const KNEE = 42, SLOPE = Math.tan(18 * Math.PI / 180);
const RIVER = 620, S_PORTAL = 600, S_HOLLOW = 590;   // local metres downslope (z = -s)
const CEIL = { x0: -700, z0: 320, w: 1400, d: 1500 };   // ceiling rectangle: x0..x0+w, z0 down to z0-d
const lin = (h) => new THREE.Color(h);
const RAY_HAZE = 0.09;      // strength of the lit haze and its shafts in open water on the chase (DOME_GLSL)

// ---------------------------------------------------------------- 1 shared GLSL
const NOISE = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FBM + fx.GLSL_VORONOI;
// The panes of bare ice in the ceiling, as a mask. The ceiling draws it; everything below is lit through it.
const POOL_GLSL = /* glsl */`
uniform vec4 uPaneA[8];    // centre x, centre z, half x, half z
uniform vec4 uPaneB[8];    // brightness, drift phase, 0, 0
uniform vec3 uKeyDir;      // toward the light
uniform float uTime;
float paneMask(vec2 xz, float soft){
  float m = 0.0;
  for (int i = 0; i < 8; i++){
    vec2 d = abs(xz - uPaneA[i].xy) - uPaneA[i].zw;
    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    float k = uPaneB[i].x*(0.80 + 0.20*sin(uTime*0.13 + uPaneB[i].y));
    m = max(m, k*(1.0 - smoothstep(-soft, soft*0.6, sd)));
  }
  return m;
}
float poolAt(vec3 w){
  float t = max(-w.y, 0.0)/max(uKeyDir.y, 0.25);
  return paneMask(w.xz + uKeyDir.xz*t, 9.0 + 0.10*t);
}
`;

// ---------------------------------------------------------------- 2 shaders
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
// The colour of open water in direction d. Deep on the chase (uDeepK, from the camera's depth) the water is lit: a
// band of jade haze about the horizon and broad shafts that fan out from the light, drifting. The ceiling fades to
// this same colour, so there is no seam where the ice meets the haze.
const DOME_GLSL = /* glsl */`
uniform vec3 uFogCol; uniform vec3 uDeep; uniform vec3 uGlow; uniform vec3 uRayC; uniform float uDeepK;
vec3 domeColor(vec3 d, vec3 kdir, float time){
  vec3 col = mix(uFogCol, uDeep, smoothstep(0.0, -0.6, d.y));
  vec2 h = d.xz/max(length(d.xz), 1e-4), kd = kdir.xz/max(length(kdir.xz), 1e-4);
  float side = 0.5 + 0.5*dot(h, kd);
  col += uGlow*(0.15 + 0.85*side*side)*smoothstep(-0.15, 0.5, d.y);
  vec3 e1 = normalize(cross(kdir, vec3(0.0, 0.0, 1.0)) + vec3(1e-5, 0.0, 0.0)), e2 = cross(kdir, e1);
  vec2 q = vec2(dot(d, e1), dot(d, e2)); q /= max(length(q), 1e-3);
  float s1 = vnoise(q*2.6 + vec2(time*0.05, 3.0)), s2 = vnoise(q*7.5 + vec2(11.0, -time*0.11));
  float streak = smoothstep(0.30, 0.85, s1*0.72 + s2*0.45);
  float band = smoothstep(-0.50, -0.03, d.y)*(1.0 - 0.55*smoothstep(0.05, 0.5, d.y));
  float toward = 0.30 + 0.70*smoothstep(-0.55, 0.65, dot(d, kdir));
  col += uRayC*uDeepK*band*toward*(0.34 + 1.0*streak);
  return col;
}
`;
const DOME_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform float uTime;
varying vec3 vDir;
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
${DOME_GLSL}
void main(){
  vec3 d = normalize(vDir + vec3(0.0, 1e-5, 0.0));
  gl_FragColor = vec4(domeColor(d, uKeyDir, uTime), 1.0);
}`;

const CEIL_VERT = /* glsl */`
varying vec3 vW;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const CEIL_FRAG = /* glsl */`
uniform sampler2D uCeilMap; uniform vec4 uCeilRect;
uniform vec3 uSnow; uniform vec3 uPane; uniform vec3 uCoreC; uniform vec3 uOchre; uniform vec3 uCrackC;
uniform vec4 uHoleA; uniform vec4 uHoleB;
uniform float uTide; uniform float uTideX; uniform float uShag; uniform float uAlgae; uniform float uCrackI; uniform float uFogD; uniform float uCeilI;
varying vec3 vW;
${NOISE}
${POOL_GLSL}
${DOME_GLSL}
void main(){
  vec2 xz = vW.xz;
  float dist = length(cameraPosition - vW);
  float fineK = 1.0 - smoothstep(50.0, 240.0, dist), midK = 1.0 - smoothstep(260.0, 620.0, dist);
  vec2 wp = vec2(fbmLo(xz*0.021), fbmLo(xz*0.021 + 17.3)) - 0.5;
  vec4 cm = texture2D(uCeilMap, vec2((xz.x - uCeilRect.x)*uCeilRect.z, (uCeilRect.y - xz.y)*uCeilRect.w));
  float pane = paneMask(xz + wp*30.0, 5.0);
  float n1 = mix(0.5, vnoise(xz*0.19), midK), n2 = vnoise(xz*0.83 + 5.0), n3 = vnoise(xz*2.9 + 1.7);
  float plate = mix(0.5, n2*0.55 + n3*0.45, fineK);
  // snow lying on top, drifting slowly: dim teal under it, jade where the wind has scoured it away
  float snow = clamp(cm.g + (n1 - 0.5)*0.3 + 0.12*sin(uTime*0.07 + xz.x*0.013 + xz.y*0.007), 0.0, 1.0);
  float T = 0.08 + 0.24*(1.0 - snow);
  T = mix(T, 1.0, pane*(0.74 + 0.26*n1));
  // refrozen cracks: two webs, antialiased from their own screen-space width
  vec3 v1 = voronoi(xz*0.0165 + wp*0.55); vec3 v2 = voronoi(xz*0.052 + wp*0.9 + 9.0);
  float aa1 = fwidth(v1.y) + 0.003, aa2 = fwidth(v2.y) + 0.005;
  float crack = (1.0 - smoothstep(0.0065, 0.0065 + aa1*1.6, v1.y))*clamp(0.045/aa1, 0.2, 1.0) + 0.4*(1.0 - smoothstep(0.012, 0.012 + aa2*1.6, v2.y))*fineK;
  float halo = exp(-v1.y*20.0);
  float flick = 0.78 + 0.22*sin(uTime*1.3 + v1.z*40.0);
  float tx = xz.x - (uTideX + 11.0*sin(xz.y*0.011) + 4.0*sin(xz.y*0.037 + 1.0));
  float aat = fwidth(tx) + 0.02;
  float tide = uTide*(1.0 - smoothstep(1.1, 1.1 + aat*1.6, abs(tx)));
  float tideHalo = uTide*exp(-abs(tx)*0.11);
  float alg = smoothstep(0.40, 0.68, cm.r + (n1 - 0.5)*0.3 + (n2 - 0.5)*0.22*fineK)*uAlgae;
  vec3 col = mix(uSnow*(0.35 + 2.2*T), uPane, smoothstep(0.34, 1.0, T));
  col *= 0.60 + 0.80*plate;
  col *= 1.0 - uShag*0.5*cm.b*(1.0 - 0.6*plate);
  col += uCoreC*smoothstep(0.70, 1.0, pane)*(0.30 + 0.45*n2);
  col = mix(col, (col*2.2 + 0.04)*uOchre, min(alg*0.78, 1.0));
  float farK = uDeepK*smoothstep(240.0, 560.0, dist);
  col += uCrackC*uCrackI*(crack*flick + halo*0.30)*(1.0 - 0.72*farK) + uCrackC*(tide*1.5 + tideHalo*0.45);
  // seen from deep on the chase the ceiling is 500-1500 m off: the fine web is below a pixel there, so wide refrozen
  // leads and wind-scoured fields (brightest on the key side) carry its glow
  vec3 v3 = voronoi(xz*0.0043 + wp*0.22 + 3.7);
  float aa3 = fwidth(v3.y) + 0.004;
  float lead = (1.0 - smoothstep(0.016, 0.016 + aa3*1.5, v3.y))*clamp(0.09/aa3, 0.3, 1.0);
  float field = smoothstep(0.50, 0.74, fbmLo(xz*0.0029 + 4.0));
  float keySide = 0.55 + 0.45*clamp(-(xz.x - cameraPosition.x)*uKeyDir.x*0.004 + 0.5, 0.0, 1.0);
  col += farK*(uCrackC*uCrackI*(lead*1.0 + exp(-v3.y*7.0)*0.30) + (uPane*0.52 + uCoreC*0.08)*field*keySide*(0.75 + 0.5*cm.b));
  float dA = length(xz - uHoleA.xy), dB = length(xz - uHoleB.xy);
  float hA = 1.0 - smoothstep(uHoleA.z - 0.4, uHoleA.z + 0.4 + fwidth(dA), dA);
  col = mix(col, uCoreC*uHoleA.w + uPane*0.4, hA) + uCoreC*0.5*exp(-dA*dA/(uHoleA.z*uHoleA.z*9.0));
  float qB = dB/uHoleB.z; col += (uPane + uCoreC*0.6)*uHoleB.w*exp(-qB*qB*1.4);
  col *= uCeilI;
  // light carries through the haze further than solid things do, and from the deep the whole ceiling is far away
  float fd = dist*uFogD*mix(0.6, 0.27, uDeepK);
  vec3 far = domeColor(normalize(vW - cameraPosition + vec3(0.0, 1e-4, 0.0)), uKeyDir, uTime) + uFogCol*0.2*(1.0 - uDeepK);
  gl_FragColor = vec4(mix(col, far, 1.0 - exp(-fd*fd)), 1.0);
}`;

const BED_VERT = /* glsl */`
attribute float aEdge;
varying vec3 vW; varying vec3 vN; varying float vEdge;
#include <fog_pars_vertex>
void main(){
  vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vN = normal; vEdge = aEdge;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BED_FRAG = /* glsl */`
uniform vec3 uBedA; uniform vec3 uBedB; uniform vec3 uShell; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uCore;
uniform float uFront; uniform vec3 uHero;
varying vec3 vW; varying vec3 vN; varying float vEdge;
#include <fog_pars_fragment>
${NOISE}
${POOL_GLSL}
void main(){
  vec2 xz = vW.xz;
  float dist = length(cameraPosition - vW);
  float nearK = 1.0 - smoothstep(22.0, 100.0, dist), midK = 1.0 - smoothstep(80.0, 300.0, dist);
  float g1 = vnoise(xz*0.9), g2 = vnoise(xz*3.7 + 3.1), g3 = vnoise(xz*11.0 + 7.7), big = fbmLo(xz*0.045 + 2.0);
  // gravel ripples lying across the slope, shell hash gathered into pale drifts between them
  float ph = xz.y*1.3 + big*9.0 + g1*1.7 + xz.x*0.21;
  float rp = sin(ph)*midK;
  float drift = smoothstep(0.50, 0.70, fbmLo(vec2(xz.x*0.035, xz.y*0.085) + 11.0) + 0.10*rp);
  float speck = smoothstep(0.55, 0.85, g2)*0.55 + smoothstep(0.62, 0.92, g3)*0.85*nearK;
  vec3 alb = mix(uBedA, uBedB, clamp(big*1.3 - 0.15, 0.0, 1.0))*(0.50 + 0.55*g1 + 0.55*g2*midK + 0.5*g3*nearK);
  alb *= 0.78 + 0.22*rp;
  alb = mix(alb, uShell*(0.30 + 0.70*mix(0.45, speck, max(midK, 0.25))), drift*(0.30 + 0.70*mix(0.5, speck, midK)));
  alb += uShell*0.55*smoothstep(0.84, 0.96, g3)*smoothstep(0.45, 0.8, g2)*nearK;
  vec3 N = normalize(vN + vec3((g2 - 0.5)*0.55*nearK, 0.0, -0.32*cos(ph)*midK + (g3 - 0.5)*0.55*nearK));
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);
  float wob = 0.55 + 0.45*smoothstep(0.25, 0.75, vnoise(xz*0.035 + vec2(uTime*0.05, uTime*0.021)));
  float pool = poolAt(vW)*wob;
  vec3 col = alb*(uFillCol*(0.8 + 0.3*N.y) + uKeyCol*ndl*(0.10 + 1.7*pool));
  col += uKeyCol*pool*g3*g3*g3*g3*0.10*nearK;
  // the frost front throws its own cyan light a few metres ahead of itself
  float dH = length(xz - uHero.xz);
  col += uCore*alb*(2.0*exp(-abs(dH - uFront + 6.0)*0.09) + 2.6*exp(-abs(dH - uFront + 5.0)*0.22))*step(0.5, uFront)*smoothstep(260.0, 60.0, dist);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, vEdge);
}`;

// stars and urchins: one program. Stepped time-lapse crawl, arms a beat behind, flee from the web, whiten when caught.
const CRIT_VERT = /* glsl */`
attribute vec4 iA;     // x, y, z, size
attribute vec4 iB;     // yaw, seed, arrive (m of front), caught flag
attribute vec4 iC;     // flee x, flee z, bed dy/dx, bed dy/dz
attribute vec4 iT;     // tint rgb, kind (0 star, 1 urchin)
attribute vec4 aArm;   // t along the arm, arm azimuth, v across, pale
uniform float uFront;
varying vec3 vN; varying vec3 vW; varying vec3 vTint; varying vec4 vArm; varying vec3 vK; varying float vPool;
#include <fog_pars_vertex>
${POOL_GLSL}
void main(){
  float seed = iB.y, kind = iT.w;
  float st = uTime*5.0 + seed*37.0, sa = st - 0.6;
  float stp = floor(st) + smoothstep(0.0, 0.5, fract(st));
  float stpA = floor(sa) + smoothstep(0.0, 0.5, fract(sa));
  float k = uFront - iB.z;
  float W = clamp(iB.z - 2.0, 6.0, 30.0);
  float caught = step(0.5, iB.w)*smoothstep(0.0, 14.0, k);
  float live = 1.0 - caught;
  float alarm = smoothstep(-W, -W*0.25, k)*(1.0 - smoothstep(0.0, 8.0, k))*(1.0 - kind);
  vec3 p = position; vec3 n = normal;
  float t = aArm.x, t2 = t*t;
  vec2 ad = vec2(cos(aArm.y), sin(aArm.y)), lat = vec2(-ad.y, ad.x);
  p.xz += lat*(0.20*t2*sin(stpA*0.55 + aArm.y*3.0 + seed*20.0)*live);
  p.y += t2*(0.10*max(sin(stpA*0.4 + aArm.y*2.0 + seed*9.0), 0.0)*live + 0.40*caught*(1.0 - kind) + 0.38*alarm*step(3.5, aArm.y)*live);
  p.xz -= ad*(0.20*t2*caught*(1.0 - kind));
  float cy = cos(iB.x), sy = sin(iB.x);
  vec3 q = vec3(p.x*cy - p.z*sy, p.y, p.x*sy + p.z*cy)*iA.w;
  n = vec3(n.x*cy - n.z*sy, n.y, n.x*sy + n.z*cy);
  float R = mix(1.2 + 2.2*fract(seed*7.31), 0.12, max(step(0.5, iB.w), kind*0.8));
  float th0 = seed*6.283, th = th0 + stp*0.045;
  vec2 off = R*(vec2(cos(th), sin(th)) - vec2(cos(th0), sin(th0)));
  float fl = clamp((k + W)/(W - 4.0), 0.0, 1.0);
  float fq = min((floor(fl*4.0) + smoothstep(0.0, 0.6, fract(fl*4.0)))*0.25, 1.0);
  off += iC.xy*fq;
  vec3 wpos = iA.xyz + q + vec3(off.x, 0.0, off.y);
  wpos.y += dot(iC.zw, q.xz + off);
  n.xz -= iC.zw*n.y;
  vN = n; vW = wpos; vTint = iT.rgb; vArm = aArm; vK = vec3(caught, k, kind);
  vPool = poolAt(wpos);
  vec4 mvPosition = viewMatrix*vec4(wpos, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CRIT_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uCore; uniform vec3 uPale; uniform vec3 uFrostAlb; uniform float uAccent;
varying vec3 vN; varying vec3 vW; varying vec3 vTint; varying vec4 vArm; varying vec3 vK; varying float vPool;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  float back = gl_FrontFacing ? 0.0 : 1.0;
  N = mix(N, -N, back);
  float t = vArm.x, v = vArm.z, caught = vK.x, kind = vK.z;
  // rows of pale spine beads along the ridge and both flanks; they fade out before they could alias
  float fw = fwidth(t*10.0);
  float lod = (1.0 - smoothstep(0.2, 0.6, fw))*(1.0 - kind);
  float row = abs(v) < 0.3 ? v : abs(v) - 0.62;
  float bead = (1.0 - smoothstep(0.10, 0.30, length(vec2(fract(t*10.0) - 0.5, row*1.7))))*lod*step(0.06, t);
  vec3 alb = mix(vTint, uPale, max(max(vArm.w, bead*0.7), back*0.55));
  alb *= 0.78 + 0.34*(1.0 - abs(v))*(1.0 - kind);
  alb = mix(alb, uFrostAlb, caught*0.92);
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);
  vec3 light = uFillCol*(0.9 + 0.4*N.y) + uKeyCol*ndl*(0.22 + 1.5*vPool);
  // keep the one warm accent warm under jade light: light the living animal mostly by luminance
  float lum = dot(light, vec3(0.3, 0.5, 0.2));
  vec3 L = mix(light, vec3(lum*1.7), 0.8*(1.0 - caught));
  vec3 col = alb*L + alb*uAccent*(1.0 - caught)*(0.6 + 0.4*N.y);
  col += uCore*caught*(0.05 + 0.9*exp(-max(vK.y, 0.0)/9.0));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// benthos: one merged mesh (and the seal, the raft) with vertex colours and a per-vertex animation type.
//   aAnim = (type, amplitude, phase, t): 0 still, 1 sway, 2 worm, 3 walker, 4 frost crystal (aTip), 5 sea angel, 6 seal
//   aArr  = metres of frost front at which this vertex freezes (1e6 = never)
//   aTip  = for a frost crystal (type 4) the vector its tip grows along; for everything else two surface flags:
//           x = pores (sponge flesh, rough rock), y = rock (frost settles on it in patches, the stone shows through)
const BEN_VERT = /* glsl */`
attribute vec4 aAnim; attribute float aArr; attribute vec3 aTip;
uniform float uFront;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec3 vO; varying vec2 vK; varying float vPool; varying vec2 vF;
#include <fog_pars_vertex>
${POOL_GLSL}
void main(){
  vec3 p = position;
  float ty = aAnim.x, amp = aAnim.y, ph = aAnim.z, t = aAnim.w;
  float k = uFront - aArr;
  float frozen = smoothstep(0.0, 9.0, k), live = 1.0 - frozen;
  if (ty > 0.5 && ty < 1.5) {
    p.x += amp*t*t*sin(uTime*0.9 + ph + p.y*0.3)*live; p.z += amp*t*t*cos(uTime*0.7 + ph*1.3)*live;
  } else if (ty > 1.5 && ty < 2.5) {
    p.x += amp*sin(t*9.0 + uTime*1.1 + ph); p.y += amp*0.35*(1.0 + sin(t*7.0 - uTime*0.8 + ph)); p.z += amp*cos(t*8.0 + uTime*0.9 + ph*2.0);
  } else if (ty > 2.5 && ty < 3.5) {
    float s = uTime*3.0 + ph*10.0, sp = (floor(s) + smoothstep(0.0, 0.5, fract(s)))/3.0;
    float tri = abs(fract(sp*0.03 + ph)*2.0 - 1.0) - 0.5;
    p.x += cos(t)*amp*tri; p.z += sin(t)*amp*tri;
  } else if (ty > 3.5 && ty < 4.5) {
    float g = clamp(k/10.0, 0.0, 1.0);
    p += aTip*(g*g*(3.0 - 2.0*g)*(1.0 + 0.5*sin(g*3.1416)*(1.0 - g)));
  } else if (ty > 4.5 && ty < 5.5) {
    p.y += amp*abs(t)*sin(uTime*7.0 + ph) + 0.35*sin(uTime*0.6 + ph); p.x += 0.5*sin(uTime*0.23 + ph*2.0);
  } else if (ty > 5.5) {
    p.x += amp*sin(uTime*2.3 + ph - t*5.5)*smoothstep(0.3, -0.5, t);
  }
  vec4 w = modelMatrix*vec4(p, 1.0);
  vW = w.xyz; vO = position; vN = mat3(modelMatrix)*normal; vCol = color; vK = vec2(frozen, k);
  vF = (ty > 3.5 && ty < 4.5) ? vec2(0.0) : aTip.xy;
  vPool = poolAt(w.xyz);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BEN_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uCore; uniform vec3 uFrostAlb;
uniform float uUnder; uniform float uFuzz; uniform float uGrey; uniform float uMottle; uniform float uFront; uniform vec3 uHero;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec3 vO; varying vec2 vK; varying float vPool; varying vec2 vF;
#include <fog_pars_fragment>
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  if (!gl_FrontFacing) N = -N;
  // rock is faceted: its light comes off the flat of each face, not a smoothed blob
  N = normalize(mix(N, normalize(cross(dFdx(vW), dFdy(vW)) + vec3(0.0, 1e-6, 0.0)), 0.85*vF.y));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float mot = 0.78 + 0.44*vnoise(vO*1.3);
  vec3 alb = vCol*mot;
  // the seal's coat: dark blotches and pale flecks, at a scale vertex colours cannot carry
  float blotch = smoothstep(0.50, 0.74, vnoise(vO*vec3(1.7, 1.7, 1.1) + 3.0))*(1.0 - 0.6*smoothstep(0.38, 0.55, vCol.g)), fleck = smoothstep(0.64, 0.80, vnoise(vO*3.1 + 11.0));
  alb = mix(alb, alb*0.42, blotch*uMottle); alb = mix(alb, vec3(0.52, 0.53, 0.51), fleck*0.45*uMottle);
  // pores and pits (sponges, rock): two scales of dark dots, faded out before they could shimmer
  float detK = 1.0 - smoothstep(26.0, 80.0, length(cameraPosition - vW));
  float pore = smoothstep(0.50, 0.70, vnoise(vO*4.3 + 7.0))*0.65 + smoothstep(0.58, 0.78, vnoise(vO*10.5 + 3.0))*0.45;
  alb *= 1.0 - vF.x*0.66*min(pore, 1.0)*detK;
  // frost: a full coat on soft things; on rock it settles in patches and on the ledges, and the stone shows through
  float rimeK = 0.82*smoothstep(0.50, 0.78, 0.6*vnoise(vO*0.7 + 20.0) + 0.5*N.y);
  alb = mix(alb, uFrostAlb, vK.x*mix(0.9, rimeK, vF.y));
  float d = dot(N, uKeyDir), ndl = clamp(d, 0.0, 1.0)*0.8 + (0.5 + 0.5*d)*0.2;
  vec3 light = uFillCol*(0.9 + 0.35*N.y) + uKeyCol*ndl*(0.25 + 1.4*vPool);
  light = mix(light, vec3(dot(light, vec3(0.3, 0.5, 0.2))*1.25), uGrey);
  vec3 col = alb*light;
  float rim = 1.0 - ndv; rim *= rim;
  col += alb*(uKeyCol*0.5 + uFillCol)*rim*uFuzz;
  // undersides are lit from the bed, most of all where the lit edge of the frost is passing beneath
  float edgeL = step(0.5, uFront)*exp(-abs(length(vW.xz - uHero.xz) - uFront + 8.0)*0.05);
  col += uCore*alb*max(-N.y + 0.12*edgeL, 0.0)*uUnder*(1.0 + 2.4*edgeL);
  col += uCore*step(0.0, vK.y)*(0.9*exp(-max(vK.y, 0.0)/8.0) + 0.04*vK.x)*(1.0 - 0.8*vF.y);   // rock takes the frost's light only faintly
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// the forty lesser fingers: a cheaper cousin of the hero's look (collars, cold shell, brine light in the core)
const FING_VERT = /* glsl */`
attribute vec3 aK;     // 0 root .. 1 tip, seed, 1 for the giants of the chase
uniform float uGiant;
varying vec3 vN; varying vec3 vW; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; p.y *= mix(1.0, mix(0.1, 1.0, uGiant), aK.z);
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz; vN = normal; vK = aK;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FING_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uCore; uniform vec3 uIce; uniform vec3 uShade;
uniform float uTime; uniform float uCoreI;
varying vec3 vN; varying vec3 vW; varying vec3 vK;
#include <fog_pars_fragment>
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float bs = mix(1.0, 0.45 + 0.8*fract(vK.y*7.3), vK.z);
  float bands = vnoise(vec3(vW.x*0.5, vW.y*1.3*bs + vK.y*40.0*vK.z, vW.z*0.5));
  float st = vnoise(vec2(vK.y*31.0, vW.y*0.5 + uTime*1.5));
  vec3 alb = mix(uShade*0.4, uIce*0.7, 0.3 + 0.55*bands);
  alb = mix(alb, uIce*(0.50 + 0.22*bands), 0.42*vK.z);   // the giants are old pale ice, not royal blue
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);
  vec3 col = alb*(uKeyCol*ndl*1.1 + uFillCol*1.2);
  col += uCore*ndv*ndv*(0.2 + 0.9*st*st)*uCoreI*0.42*(0.35 + 0.65*vK.x);
  float r = 1.0 - ndv; col += uIce*r*r*r*(0.22 + 0.25*vK.z)*(0.3 + 0.7*ndl);
  col += uIce*vK.z*(0.022 + 0.05*bands)*(0.5 + 0.5*ndl);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// hexagonal platelets bristling under the ceiling
const PLAT_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
varying vec3 vN; varying vec3 vW; varying float vGlow; varying float vSeed;
#include <fog_pars_vertex>
${POOL_GLSL}
void main(){
  float tl = iB.y + 0.10*sin(uTime*0.5 + iB.z*40.0), cy = cos(iB.x), sy = sin(iB.x), ct = cos(tl), st = sin(tl);
  vec3 p = position*iA.w;
  p = vec3(p.x, p.y*ct - p.z*st, p.y*st + p.z*ct);
  vec3 n = vec3(0.0, -st, ct);
  p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy);
  n = vec3(n.z*sy, n.y, n.z*cy);
  vec3 w = iA.xyz + p;
  vW = w; vN = n; vSeed = iB.z;
  vGlow = paneMask(w.xz, 9.0);
  vec4 mvPosition = viewMatrix*vec4(w, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PLAT_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uSnow; uniform vec3 uPane; uniform vec3 uCoreC; uniform float uCeilI;
varying vec3 vN; varying vec3 vW; varying float vGlow; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float face = abs(dot(N, V)), fr = 1.0 - face; fr *= fr;
  // a thin plate of clear ice: faint and see-through face-on, bright where it turns edge-on or catches the light
  vec3 col = mix(uSnow*2.4 + uPane*0.12, uPane*1.15, vGlow)*(0.30 + 0.4*vSeed + 0.9*fr);
  vec3 H = normalize(uKeyDir + V);
  float sp = abs(dot(N, H)); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  float a = clamp(0.24 + 0.22*vSeed + 0.6*fr, 0.0, 0.85);
  gl_FragColor = vec4(col*uCeilI, 1.0);
  #include <fog_fragment>
  gl_FragColor = vec4(gl_FragColor.rgb*a + uCoreC*sp*(0.5 + 1.1*vGlow)*uCeilI*a, a);
}`;

// strands of ice algae hanging from the richest patches, swaying; kept at least ~1.5 px wide
const STRAND_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
varying float vT; varying float vGlow; varying float vSide;
#include <fog_pars_vertex>
${POOL_GLSL}
void main(){
  float t = -position.y, len = iA.w, ph = iB.z;
  vec2 off = vec2(sin(uTime*0.6 + ph + t*2.4), cos(uTime*0.47 + ph*1.7 + t*2.0))*iB.w*t*t*len*0.22;
  vec3 w = iA.xyz + vec3(off.x, -t*len, off.y);
  vec3 toCam = cameraPosition - w; float dist = length(toCam);
  vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), toCam) + vec3(1e-4, 0.0, 0.0));
  float wd = max(iB.x*(1.0 - 0.65*t), dist*0.0032);
  w += side*position.x*wd;
  vT = t; vSide = position.x*2.0; vGlow = paneMask(w.xz, 9.0);
  vec4 mvPosition = viewMatrix*vec4(w, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const STRAND_FRAG = /* glsl */`
uniform vec3 uOchre; uniform vec3 uSnow; uniform vec3 uPane; uniform float uCeilI;
varying float vT; varying float vGlow; varying float vSide;
#include <fog_pars_fragment>
void main(){
  vec3 lit = mix(uSnow*1.6, uPane, vGlow);
  vec3 col = (uOchre*1.5 + 0.03)*(lit*1.6 + 0.05)*(0.55 + 0.45*(1.0 - abs(vSide)))*(1.0 - 0.45*vT);
  gl_FragColor = vec4(col*uCeilI, 1.0);
  #include <fog_fragment>
}`;

// the seal's bubble trail: soft rimmed discs, positions written on the CPU each frame
const BUB_VERT = /* glsl */`
attribute vec4 iP;
varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
void main(){
  vec4 mvPosition = viewMatrix*vec4(iP.xyz, 1.0);
  float s = max(abs(iP.w), -mvPosition.z*0.0022);
  vA = step(0.0, iP.w)*min(abs(iP.w)/max(s, 1e-4), 1.0);
  mvPosition.xy += position.xy*s;
  vUv = position.xy;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BUB_FRAG = /* glsl */`
uniform vec3 uIce; uniform vec3 uCore;
varying vec2 vUv; varying float vA;
#include <fog_pars_fragment>
void main(){
  float r = length(vUv);
  float a = (1.0 - smoothstep(0.82, 1.0, r))*(0.16 + 0.84*smoothstep(0.45, 0.95, r));
  float hl = 1.0 - smoothstep(0.0, 0.3, length(vUv - vec2(-0.35, 0.4)));
  vec3 col = (uIce*0.55 + uCore*0.25)*a + uIce*hl*0.7;
  #ifdef USE_FOG
    float keep = exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float keep = 1.0;
  #endif
  gl_FragColor = vec4(col*vA*keep, a*0.35*vA*keep);
}`;

// anchor ice: heaps of broken glass. Thin shards with lit edges, pale and clear face-on, glinting; the same ice as the
// hero's frost crust (uIce / uShade, albedo capped at 0.72). Instanced clumps; also rides the rare raft.
const ANCH_VERT = /* glsl */`
attribute vec3 aE;     // distance to the two free edges (0 on an edge), shard seed
uniform float uFront; uniform vec3 uHero;
varying vec3 vN; varying vec3 vW; varying vec3 vE; varying float vPool; varying float vK;
#include <fog_pars_vertex>
${POOL_GLSL}
void main(){
  vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.0);
  vN = mat3(modelMatrix)*(mat3(instanceMatrix)*normal);
  vW = w.xyz; vE = aE; vPool = poolAt(w.xyz); vK = uFront - length(w.xz - uHero.xz);
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const ANCH_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uIce; uniform vec3 uShade; uniform vec3 uCore; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec3 vE; varying float vPool; varying float vK;
#include <fog_pars_fragment>
${fx.GLSL_HASH}
${fx.GLSL_VALUE_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndv = clamp(dot(N, V), 0.0, 1.0), fres = 1.0 - ndv; fres *= fres;
  float e = min(vE.x, vE.y), fw = fwidth(e) + 1e-4, seed = vE.z, tipK = 1.0 - clamp(vE.x + vE.y, 0.0, 1.0);
  float edge = (1.0 - smoothstep(0.0, max(0.07, fw*1.5), e))*clamp(0.10/fw, 0.25, 1.0);
  float ndl = dot(N, uKeyDir), lit = clamp(ndl, 0.0, 1.0)*0.7 + abs(ndl)*0.3;
  // clear ice: face-on you look through it into the dark; it whitens toward its tip, its edges and along fractures
  float grain = vnoise(vec2((vE.x - vE.y)*13.0 + seed*50.0, tipK*3.0 + seed*9.0));
  float frostK = clamp(0.16 + 0.55*tipK*tipK + 0.6*edge + 0.5*fres + (grain - 0.45)*0.5, 0.0, 1.0);
  vec3 light = uFillCol*1.15 + uKeyCol*lit*(0.40 + 1.2*vPool);
  light = mix(light, vec3(dot(light, vec3(0.3, 0.5, 0.2))*1.2), 0.5);
  vec3 col = uIce*0.72*(0.8 + 0.2*seed)*light*(0.18 + 0.82*frostK);
  col += mix(uIce, uCore, 0.5)*fres*(0.05 + 0.30*clamp(ndl + 0.4, 0.0, 1.0));
  col += uCore*edge*(0.06 + 0.20*vPool);
  vec3 H = normalize(uKeyDir + V);
  float sp = clamp(abs(dot(N, H)), 0.0, 1.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  float tw = 0.5 + 0.5*sin(uTime*(1.3 + 3.0*seed) + seed*90.0), fl = tw*tw; fl *= fl; fl *= fl;
  col += uIce*sp*(0.35 + 1.1*tw)*(0.35 + vPool) + uCore*fl*(0.10 + 0.5*edge);
  col += uCore*step(0.0, vK)*exp(-max(vK, 0.0)/14.0)*(0.25 + 0.6*edge);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- 3 geometry helpers
const STILL = [0, 0, 0, 0], NOTIP = [0, 0, 0], WHITE = new THREE.Color(1, 1, 1);
const _t = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _ref = new THREE.Vector3();

// vertex accumulator for the merged benthos mesh (position, color, aAnim, aArr, aTip; smooth normals at build)
function makeAcc() {
  const P = [], C = [], A = [], R = [], T = [], I = [];
  const acc = {
    n: 0,
    v(x, y, z, c, anim = STILL, arr = 1e6, tip = NOTIP) {
      P.push(x, y, z); C.push(c.r, c.g, c.b); A.push(anim[0], anim[1], anim[2], anim[3]); R.push(arr); T.push(tip[0], tip[1], tip[2]);
      return acc.n++;
    },
    tri(a, b, c) { I.push(a, b, c); },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    lift(i, dy) { P[i * 3 + 1] += dy; },
    pos(i) { return [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]; },
    count() { return I.length / 3; },
    // the same geometry, handed over in short steps for a big mesh (smooth area-weighted normals, as computeVertexNormals)
    async buildSlow(ctx) {
      const g = new THREE.BufferGeometry(), pos = new Float32Array(P), idx = new Uint32Array(I), nrm = new Float32Array(pos.length), nV = pos.length / 3;
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); await ctx.yield();
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3)); await ctx.yield();
      g.setAttribute('aAnim', new THREE.BufferAttribute(new Float32Array(A), 4)); await ctx.yield();
      g.setAttribute('aArr', new THREE.BufferAttribute(new Float32Array(R), 1)); g.setAttribute('aTip', new THREE.BufferAttribute(new Float32Array(T), 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); await ctx.yield();
      for (let t = 0, nT = idx.length; t < nT; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const e1x = pos[c] - pos[b], e1y = pos[c + 1] - pos[b + 1], e1z = pos[c + 2] - pos[b + 2], e2x = pos[a] - pos[b], e2y = pos[a + 1] - pos[b + 1], e2z = pos[a + 2] - pos[b + 2];
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
        if (t % 18000 === 17997) await ctx.yield();
      }
      for (let i = 0; i < nV; i++) { const k = i * 3, l = Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]); if (l > 0) { nrm[k] /= l; nrm[k + 1] /= l; nrm[k + 2] /= l; } if (i % 8000 === 7999) await ctx.yield(); }
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      return g;
    },
    build(normals = true) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      g.setAttribute('aArr', new THREE.Float32BufferAttribute(R, 1));
      g.setAttribute('aTip', new THREE.Float32BufferAttribute(T, 3));
      g.setIndex(I);
      if (normals) g.computeVertexNormals();
      return g;
    },
  };
  return acc;
}

// a lofted tube through pts ([x,y,z] each). rad(i, ang, f) -> radius. o: col(i, ang, f) -> Color, anim(i, f) -> aAnim,
// arr(x, y, z, i) -> aArr, flags ([pores, rock, 0] -> aTip), closed (a loop), ref (a fixed vector no tangent is parallel
// to, so the tube never twists)
function tube(acc, pts, sides, rad, o = {}) {
  const n = pts.length, rows = [], closed = !!o.closed;
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i + n - 1) % n : Math.max(i - 1, 0)], b = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)], c = pts[i];
    const f = i / (closed ? n : n - 1);
    _t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    if (o.ref) _ref.set(o.ref[0], o.ref[1], o.ref[2]); else if (Math.abs(_t.y) > 0.9) _ref.set(1, 0, 0); else _ref.set(0, 1, 0);
    _e1.crossVectors(_t, _ref).normalize(); _e2.crossVectors(_t, _e1);
    const row = [], anim = o.anim ? o.anim(i, f) : STILL;
    for (let j = 0; j < sides; j++) {
      const ang = j / sides * Math.PI * 2, r = rad(i, ang, f), cs = Math.cos(ang) * r, sn = Math.sin(ang) * r;
      const x = c[0] + _e1.x * cs + _e2.x * sn, y = c[1] + _e1.y * cs + _e2.y * sn, z = c[2] + _e1.z * cs + _e2.z * sn;
      row.push(acc.v(x, y, z, o.col ? o.col(i, ang, f, x, y, z) : WHITE, anim, o.arr ? o.arr(x, y, z, i) : 1e6, o.flags || NOTIP));
    }
    rows.push(row);
  }
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const r0 = rows[i], r1 = rows[(i + 1) % n];
    for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; acc.quad(r0[j], r0[j1], r1[j1], r1[j]); }
  }
  return rows;
}

// one heap of broken glass, about 2.4 m across at scale 1: thin triangular shards and wider panes leaning every way,
// each two faces and two lit edges (6 triangles). aE = (distance to free edge A, to free edge B, shard seed).
function shardClumpGeometry(rng, count) {
  const P = [], Nn = [], E = [];
  const a = new THREE.Vector3(), sd = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Vector3(), q = new THREE.Vector3(), g = new THREE.Vector3();
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), V = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3());
  const tri = (A, B, C, eA, eB, eC, seed) => {
    g.subVectors(B, A).cross(q.subVectors(C, A)).normalize();
    for (const [v, e] of [[A, eA], [B, eB], [C, eC]]) { P.push(v.x, v.y, v.z); Nn.push(g.x, g.y, g.z); E.push(e[0], e[1], seed); }
  };
  const E0 = [1, 0], E1 = [0, 1], EZ = [0, 0];
  for (let i = 0; i < count; i++) {
    const pane = rng() < 0.25, yaw = rng() * 6.283, rr = Math.sqrt(rng()) * 1.15, pa = rng() * 6.283, t1 = rng(), t2 = rng(), hh = rng(), ww = rng();
    const tilt = pane ? 0.85 + t1 * 0.6 : t1 * t2 * 1.3 + 0.12 * rr, h = (pane ? 0.6 + hh * 0.8 : 0.5 + hh * 1.5) * (1.12 - 0.36 * rr), w = h * (pane ? 0.16 + ww * 0.16 : 0.05 + ww * 0.09);
    const th = 0.035 + rng() * 0.05, skew = rng() * 1.6 - 0.8, roll = rng() * 3.1416, seed = rng();
    a.set(Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt), Math.sin(tilt) * Math.sin(yaw));
    sd.set(-Math.sin(yaw), 0, Math.cos(yaw)); n.crossVectors(a, sd).normalize();
    sd.multiplyScalar(Math.cos(roll)).addScaledVector(n, Math.sin(roll)); n.crossVectors(a, sd).normalize();
    c.set(Math.cos(pa) * rr, -0.15, Math.sin(pa) * rr);
    p0.copy(c).addScaledVector(sd, -w); p1.copy(c).addScaledVector(sd, w); p2.copy(c).addScaledVector(a, h).addScaledVector(sd, w * skew);
    V[0].copy(p0).addScaledVector(n, th); V[1].copy(p1).addScaledVector(n, th); V[2].copy(p2).addScaledVector(n, th * 0.3);
    V[3].copy(p0).addScaledVector(n, -th); V[4].copy(p1).addScaledVector(n, -th); V[5].copy(p2).addScaledVector(n, -th * 0.3);
    tri(V[0], V[2], V[1], E0, EZ, E1, seed); tri(V[3], V[4], V[5], E0, E1, EZ, seed);
    tri(V[1], V[2], V[5], EZ, EZ, EZ, seed); tri(V[1], V[5], V[4], EZ, EZ, EZ, seed);
    tri(V[2], V[0], V[3], EZ, EZ, EZ, seed); tri(V[2], V[3], V[5], EZ, EZ, EZ, seed);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); geo.setAttribute('aE', new THREE.Float32BufferAttribute(E, 3));
  return geo;
}

// a sea star of unit radius lying in XZ: five plump tapering arms with a raised ridge. aArm = (t, azimuth, v, pale)
function starGeometry(segs, cross) {
  const P = [], A = [], I = []; let n = 0;
  const v = (x, y, z, t, ang, vv, pale) => { P.push(x, y, z); A.push(t, ang, vv, pale); return n++; };
  const nc = cross.length;
  for (let a = 0; a < 5; a++) {
    const ang = a / 5 * Math.PI * 2 + 0.3, dx = Math.cos(ang), dz = Math.sin(ang), lx = -dz, lz = dx;
    let prev = null;
    for (let i = 0; i < segs; i++) {
      const t = i / segs, w = 0.33 * Math.pow(1 - t, 0.75) + 0.06 * (1 - t), h = 0.21 * Math.pow(1 - t, 0.6) + 0.04;
      const row = cross.map((vv) => v(dx * t + lx * vv * w, h * Math.pow(1 - Math.abs(vv), 0.7) + (vv === 0 ? 0.04 : 0), dz * t + lz * vv * w, t, ang, vv, Math.abs(vv) === 1 ? 0.3 : 0));
      if (prev) for (let j = 0; j < nc - 1; j++) I.push(prev[j], prev[j + 1], row[j], prev[j + 1], row[j + 1], row[j]);
      prev = row;
    }
    const tip = v(dx, 0.03, dz, 1, ang, 0, 0.4);
    for (let j = 0; j < nc - 1; j++) I.push(prev[j], prev[j + 1], tip);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aArm', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// an urchin of unit radius: a low dome, sixteen spines that swivel (they reuse the stars' arm flex) and a shell-fragment hat
function urchinGeometry(rng) {
  const P = [], A = [], I = []; let n = 0;
  const v = (x, y, z, t, ang, vv, pale) => { P.push(x, y, z); A.push(t, ang, vv, pale); return n++; };
  const S = 7, apex = v(0, 0.6, 0, 0, 0, 0, 0), r1 = [], r2 = [];
  for (let j = 0; j < S; j++) { const a = j / S * Math.PI * 2; r1.push(v(Math.cos(a) * 0.6, 0.42, Math.sin(a) * 0.6, 0, a, 0, 0)); r2.push(v(Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86, 0, a, 0, 0)); }
  for (let j = 0; j < S; j++) { const j1 = (j + 1) % S; I.push(apex, r1[j1], r1[j], r1[j], r1[j1], r2[j], r1[j1], r2[j1], r2[j]); }
  for (let s = 0; s < 16; s++) {
    const a = s / 16 * Math.PI * 2 + rng.range(-0.15, 0.15), el = rng.range(0.2, 1.25), ce = Math.cos(el), se = Math.sin(el), L = rng.range(1.0, 1.35);
    const bx = Math.cos(a) * ce * 0.6, by = se * 0.5, bz = Math.sin(a) * ce * 0.6, px = -Math.sin(a) * 0.07, pz = Math.cos(a) * 0.07;
    const b0 = v(bx - px, by, bz - pz, 0, a, 0, 0), b1 = v(bx + px, by, bz + pz, 0, a, 0, 0), tp = v(Math.cos(a) * ce * L, se * L * 0.9, Math.sin(a) * ce * L, 1, a, 0, 0.5);
    I.push(b0, b1, tp);
  }
  const ha = rng.range(0, 6.28), hc = Math.cos(ha) * 0.42, hs = Math.sin(ha) * 0.42;
  const h0 = v(hc, 0.66, hs, 0, 0, 0, 1), h1 = v(-hs, 0.74, hc, 0, 0, 0, 1), h2 = v(-hc * 0.8, 0.62, -hs * 0.8, 0, 0, 0, 0.8), h3 = v(hs, 0.58, -hc, 0, 0, 0, 1);
  I.push(h0, h1, h2, h0, h2, h3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aArm', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// instance attributes for a critter mesh (stars or urchins) from a list of placements
function critterMesh(base, list, material) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position')); g.setAttribute('normal', base.getAttribute('normal')); g.setAttribute('aArm', base.getAttribute('aArm'));
  const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iT = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const s = list[i];
    iA.set([s.x, s.y, s.z, s.size], i * 4); iB.set([s.yaw, s.seed, s.arr, s.caught], i * 4);
    iC.set([s.fx, s.fz, s.gx, s.gz], i * 4); iT.set([s.r, s.g, s.b, s.kind], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.matrixAutoUpdate = false;
  return m;
}

// one lesser finger: a noise-displaced lathe with collar lips, hanging from (x, 0, z). For the giants of the chase `o`
// varies the build: taper (exponent of the cone), lean ([x, z] metres of drift at the tip), per (collar spacing), lip,
// and spurs ([{ k, a, L, rb, out }]: side icicles hanging from a collar at fraction k, azimuth a, L metres long)
function addFinger(P, K, I, N, x, z, len, r0, seed, rings = 22, sides = 10, wob = 0.7, giant = 0, o = null) {
  const base = P.length / 3, per = Math.max(1.5, len / rings * 3.3) * (o ? o.per : 1), nf = 0.4 * clamp(1.4 * rings / len, 0.2, 1);
  const tap = o ? o.taper : 0.85, lipK = giant ? (o ? o.lip : 0.5) : 0.26, lx = o ? o.lean[0] : 0, lz = o ? o.lean[1] : 0;
  const rAt = (k) => (giant ? r0 * (0.1 + 0.9 * Math.pow(1 - k, tap)) * (1 + 0.2 * N.n2(seed * 31, k * 6)) : r0 * (1 - 0.74 * Math.pow(k, 0.8)) + 0.22);
  const axAt = (k) => [x + Math.sin(k * 3.1 + seed * 9) * wob * k + lx * k, z + Math.cos(k * 2.3 + seed * 5) * wob * k + lz * k];
  for (let i = 0; i <= rings; i++) {
    const k = i / rings, y = 0.6 - k * (len + 0.6);
    const fr = (k * len / per + seed * 3) % 1, lip = 1 + lipK * fr * fr;
    const r = rAt(k) * lip * (i === 0 ? 1.7 : i === rings ? 0.45 : 1), c = axAt(k), tl = giant && i > 0 ? 0.34 * r : 0, tp = seed * 20 + i * 1.9;
    for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2, rr = r * (1 + 0.22 * N.n3(Math.cos(a) * 1.3 + seed * 11, y * nf, Math.sin(a) * 1.3));
      P.push(c[0] + Math.cos(a) * rr, y + tl * Math.sin(a - tp), c[1] + Math.sin(a) * rr); K.push(k, seed, giant);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides;
    I.push(a, b, c, b, d, c);
  }
  if (!o || !o.spurs) return;
  const T = [0, 0.16, 0.42, 0.74, 1], RR = [1.3, 1, 0.74, 0.42, 0.04];
  for (const sp of o.spurs) {
    const b0 = P.length / 3, c0 = axAt(sp.k), r = rAt(sp.k), y0 = 0.6 - sp.k * (len + 0.6), ca = Math.cos(sp.a), sa = Math.sin(sp.a);
    for (let i = 0; i < 5; i++) {
      const t = T[i], off = r * 0.7 + sp.out * (1 - (1 - t) * (1 - t)), cx = c0[0] + ca * off, cz = c0[1] + sa * off, cy = y0 + (i === 0 ? sp.rb * 0.9 : 0) - sp.L * Math.pow(t, 1.2);
      for (let j = 0; j < 5; j++) {
        const b = j / 5 * Math.PI * 2, rr = sp.rb * RR[i] * (1 + 0.25 * N.n3(Math.cos(b) * 1.1 + seed * 7, cy * 0.3, Math.sin(b) * 1.1 + sp.a));
        P.push(cx + Math.cos(b) * rr, cy, cz + Math.sin(b) * rr); K.push(Math.min(sp.k + t * sp.L / len, 1), seed, giant);
      }
    }
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { const a = b0 + i * 5 + j, b = b0 + i * 5 + (j + 1) % 5, c = a + 5, d = b + 5; I.push(a, b, c, b, d, c); }
  }
}

// the Weddell seal, 1 unit long, nose at +Z: lofted body, fore and hind flippers, eyes, whiskers. Animation type 6.
function sealGeometry(N, L) {
  const acc = makeAcc();
  const prof = [[0.5, 0.010], [0.485, 0.026], [0.455, 0.040], [0.41, 0.050], [0.36, 0.052], [0.31, 0.058], [0.24, 0.074], [0.14, 0.088], [0.03, 0.094], [-0.09, 0.090], [-0.2, 0.078], [-0.3, 0.060], [-0.38, 0.042], [-0.44, 0.027], [-0.485, 0.016], [-0.5, 0.008]];
  const back = new THREE.Color(0.27, 0.29, 0.31), dark = new THREE.Color(0.06, 0.065, 0.075), belly = new THREE.Color(0.62, 0.62, 0.58), c = new THREE.Color();
  const skin = (zn, ang) => {
    const bw = smoothstep(-0.3, 0.7, Math.sin(ang)), m = N.n3(Math.cos(ang) * 2.2, zn * 16, Math.sin(ang) * 2.2);
    c.copy(back).lerp(dark, smoothstep(0.05, 0.5, m) * 0.7 * (1 - bw)).lerp(belly, bw * 0.95);
    return c;
  };
  tube(acc, prof.map(([zn]) => [0, 0, zn * L]), 14, (i, ang) => prof[i][1] * L * (Math.sin(ang) > 0 ? 0.96 : 0.9 + 0.1 * Math.abs(Math.cos(ang))),
    { col: (i, ang) => skin(prof[i][0], ang), anim: (i) => [6, 0.05 * L, 0, prof[i][0]] });
  const flip = (pts, w, th, zn0) => tube(acc, pts, 6, (i, ang, f) => { const k = Math.sin(Math.PI * Math.min(f * 0.8 + 0.2, 1)); return L * (Math.abs(Math.cos(ang)) * w + th) * k; },
    { col: () => c.copy(back).lerp(dark, 0.55), anim: (i, f) => [6, 0.05 * L, 0, zn0 - f * 0.06], ref: [0, 0, 1] });
  for (const sx of [-1, 1]) {
    flip([[sx * 0.066 * L, -0.04 * L, 0.21 * L], [sx * 0.092 * L, -0.062 * L, 0.185 * L], [sx * 0.118 * L, -0.08 * L, 0.15 * L], [sx * 0.136 * L, -0.092 * L, 0.11 * L], [sx * 0.146 * L, -0.098 * L, 0.07 * L]], 0.027, 0.011, 0.2);
    tube(acc, [[sx * 0.012 * L, 0, -0.47 * L], [sx * 0.02 * L, 0, -0.52 * L], [sx * 0.035 * L, 0, -0.575 * L], [sx * 0.045 * L, 0, -0.62 * L]], 6,
      (i, ang, f) => L * (Math.abs(Math.sin(ang)) * 0.03 * Math.sin(Math.PI * (0.25 + f * 0.7)) + 0.004),
      { col: () => c.copy(back).lerp(dark, 0.6), anim: (i, f) => [6, 0.05 * L, 0, -0.47 - f * 0.15] });
    // eye and whiskers
    tube(acc, [[sx * 0.036 * L, 0.018 * L, 0.437 * L], [sx * 0.042 * L, 0.02 * L, 0.437 * L], [sx * 0.046 * L, 0.021 * L, 0.437 * L]], 5, (i) => L * [0.004, 0.0075, 0.002][i], { col: () => c.setRGB(0.012, 0.012, 0.016) });
    for (let wk = 0; wk < 5; wk++) {
      const up = (wk - 2) * 0.006 * L, a0 = acc.v(sx * 0.03 * L, -0.012 * L + up * 0.4, 0.468 * L, belly), a1 = acc.v(sx * 0.03 * L, -0.008 * L + up * 0.4, 0.47 * L, belly);
      acc.tri(a0, a1, acc.v(sx * 0.085 * L, -0.03 * L + up, 0.445 * L, belly));
    }
  }
  return acc.build();
}

const _c = new THREE.Color();
// the rare event's raft of anchor ice with six stars and an urchin riding it (local space, centred on the origin)
function raftGeometry(rng) {
  const acc = makeAcc(), red = new THREE.Color('#E8452C'), plum = new THREE.Color(0.20, 0.035, 0.09);
  for (let k = 0; k < 30; k++) {
    const a = rng.range(0, 6.283), r = Math.sqrt(rng()) * 6.6, x = Math.cos(a) * r, z = Math.sin(a) * r, s = rng.range(1.2, 2.8) * (1 - r / 11), tl = [rng.range(-0.5, 0.5), rng.range(-0.5, 0.5)], sd = rng.range(0, 9);
    const tone = rng.range(0.7, 1.1);
    tube(acc, [[x, -0.6 * s, z], [x + tl[0] * 0.3 * s, 0, z + tl[1] * 0.3 * s], [x + tl[0] * 0.8 * s, 0.6 * s, z + tl[1] * 0.8 * s], [x + tl[0] * 1.0 * s, 0.95 * s, z + tl[1] * 1.0 * s]], 5,
      (i, ang) => s * [0.2, 0.62, 0.42, 0.04][i] * (1 + 0.35 * Math.sin(ang * 2 + sd)), { col: (i) => _c.setRGB(0.50, 0.66, 0.70).multiplyScalar(tone * (0.7 + 0.12 * i)) });
  }
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * 6.283 + rng.range(-0.3, 0.3), r = rng.range(1.5, 5.2), x = Math.cos(a) * r, z = Math.sin(a) * r, y = rng.range(1.6, 2.6), yaw = rng.range(0, 6.283);
    for (let arm = 0; arm < 5; arm++) {
      const aa = yaw + arm / 5 * 6.283, ca = Math.cos(aa), sa = Math.sin(aa);
      tube(acc, [[x, y, z], [x + ca * 0.45, y + 0.05, z + sa * 0.45], [x + ca * 0.95, y - 0.05, z + sa * 0.95], [x + ca * 1.3, y - 0.12, z + sa * 1.3]], 4, (i, ang) => [0.42, 0.34, 0.2, 0.03][i] * (0.45 + 0.55 * Math.abs(Math.cos(ang))),
        { col: (i) => _c.copy(red).multiplyScalar(0.9 + 0.1 * i), anim: (i, f) => [1, 0.25, aa * 3, f] });
    }
  }
  tube(acc, [[2, 2.1, -1], [2, 2.5, -1], [2, 3.0, -1], [2, 3.25, -1]], 7, (i) => [0.5, 0.85, 0.6, 0.05][i], { col: () => plum });
  for (let s = 0; s < 14; s++) { const a = s / 14 * 6.283, el = 0.3 + (s % 3) * 0.4; acc.tri(acc.v(2 + Math.cos(a) * 0.5, 2.7, -1 + Math.sin(a) * 0.5, plum), acc.v(2 + Math.cos(a + 0.2) * 0.5, 2.7, -1 + Math.sin(a + 0.2) * 0.5, plum), acc.v(2 + Math.cos(a) * Math.cos(el) * 1.5, 2.7 + Math.sin(el) * 1.3, -1 + Math.sin(a) * Math.cos(el) * 1.5, plum)); }
  return acc.build();
}

// ---------------------------------------------------------------- 4 the world
const LOOKS = {
  day: { snow: '#0E4C7A', pane: '#2FBF9A', core: '#6FE6F2', key: '#86ead6', keyI: 1.25, fog: '#082A4A', deep: '#061A33', exposure: 1.1, tilt: 35, ceilI: 1, algae: 1, heroCore: 2.2 },
  golden: { snow: '#0d3f73', pane: '#b9cf7a', core: '#f3eebc', key: '#ffe7b8', keyI: 1.15, fog: '#07254a', deep: '#051733', exposure: 1.1, tilt: 56, ceilI: 0.95, algae: 1.6, heroCore: 2.2 },
  night: { snow: '#0b2a78', pane: '#93aadc', core: '#dfe9ff', key: '#a9c0ff', keyI: 0.8, fog: '#051a3c', deep: '#03102a', exposure: 1.45, tilt: 30, ceilI: 0.7, algae: 0.7, heroCore: 2.8 },
};

export default {
  id: 'brinicle-ice-finger',
  name: 'The Ice Finger',
  category: 'ocean',
  weirdness: 0.45,
  media: ['underwater', 'tiny'],
  async build(ctx) {
    const scene = new THREE.Scene(), rng = ctx.rng, N = ctx.noise;
    const vary = ctx.vary || {}, det = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);

    // ---- 4a seeded moods
    const mr = rng.fork('mood');
    const hourPick = ['day', 'day', 'day', 'golden', 'night'][Math.floor(mr() * 5)], iceI = Math.floor(mr() * 3), bedI = mr() < 0.3 ? 1 : 0, castI = Math.floor(mr() * 3);
    const hour = vary.hour === 'night' ? 'night' : (vary.hour === 'golden' || vary.hour === 'dawn') ? 'golden' : vary.hour === 'day' ? 'day' : hourPick;
    const look = LOOKS[hour], tide = iceI === 1, shag = iceI === 2, mat = bedI === 1, urchinYear = castI === 1, twoSeals = castI === 2, rare = !!vary.rare;
    const paneK = (tide ? 0.62 : shag ? 0.7 : 1), ceilI = look.ceilI * (shag ? 0.88 : 1);
    const keyCol = lin(look.key).multiplyScalar(look.keyI * (shag ? 0.85 : 1));
    const fillCol = lin(look.snow).multiplyScalar(1.5).add(lin(look.deep));
    const fogCol = lin(look.fog);
    scene.fog = new THREE.FogExp2(fogCol.clone(), 0.0024);
    scene.background = fogCol.clone();
    const tilt = look.tilt * Math.PI / 180, az0 = mr.range(-0.15, 0.15);
    const keyDir = new THREE.Vector3(-Math.sin(tilt), Math.cos(tilt), 0.12).normalize();

    // ---- 4b the bed, and the hero built on it
    const bedBase = (s) => { const q = s - KNEE; return q <= -8 ? 0 : -SLOPE * (q < 8 ? (q + 8) * (q + 8) / 32 : q); };
    const bedY = (x, z) => {
      const s = HZ - z, ax = Math.abs(x);
      let y = HY + bedBase(s);
      if (ax > 24) {
        const wall = smoothstep(24, 75, ax);
        y += wall * (7 * smoothstep(KNEE - 10, KNEE + 60, s) + 5 * N.fbm2(x * 0.012 + 3, z * 0.012, 3)) + smoothstep(26, 40, ax) * 0.5 * N.n2(x * 0.11, z * 0.11);
      }
      const dh = Math.hypot(x, s - S_HOLLOW);
      if (dh < 17) y -= 9 * (0.5 + 0.5 * Math.cos(Math.PI * dh / 17));
      return y;
    };
    const palette = ['#061A33', look.snow, look.pane, '#6FE6F2', '#DDF3F6', '#B58A3C', '#E8452C'];
    const hero = await buildHero(ctx, { palette, riverLength: RIVER, bed: false, groundAt: (x, z) => bedY(x + HX, z + HZ) - HY, keyDir, coreIntensity: look.heroCore, edgeIntensity: 1.8 });
    hero.object.position.set(HX, HY, HZ);
    scene.add(hero.object);
    const frost = hero.frost, uFront = frost.uniforms.uFront;
    await ctx.yield();

    // ---- 4c THE PATH: entry line, two anticlockwise turns round the finger, the chase, the straight dive
    const TAU = Math.PI * 2, A1 = Math.PI * 2.5, A2 = Math.PI * 4;
    const spin = (a) => {
      let r = 17, y;
      if (a <= A1) { const q = clamp(a / A1, 0, 1); y = -16 - 30 * q * q * (3 - 2 * q); }
      else { const q = (a - A1) / (A2 - A1); r = lerp(17, 10.5, smoothstep(0, 0.8, q)); y = lerp(-46, -58.6, smoothstep(0, 1, q)); }
      return [HX + Math.cos(a) * r, y, HZ - Math.sin(a) * r];
    };
    const pts = [[0, -16, 0], [0, -16, -42], [1.5, -16, -78], [8.5, -16, -103]];
    for (let i = -1; i <= 32; i++) pts.push(spin(i * Math.PI / 8));
    pts.push([10.2, -58.9, HZ - 13], [8, -59.1, HZ - 28]);
    const xP = frost.centre(S_PORTAL) * 0.5;
    const chaseX = (s) => lerp(lerp(6, frost.centre(s) * 0.5, smoothstep(44, 120, s)), xP, smoothstep(380, 500, s));
    for (const s of [46, 75, 130, 190, 250, 310, 370, 430, 500, 540, 570, S_PORTAL]) pts.push([chaseX(s), HY + bedBase(s) + 4.8, HZ - s]);
    const path = makePath(pts);
    const NS = 2400, samp = new Float32Array((NS + 1) * 3), _p = new THREE.Vector3(), _p2 = new THREE.Vector3();
    for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, _p); samp[i * 3] = _p.x; samp[i * 3 + 1] = _p.y; samp[i * 3 + 2] = _p.z; if (i % 400 === 399) await ctx.yield(); }
    const uOf = (q) => { let best = 1e18, bi = 0; for (let i = 0; i <= NS; i++) { const dx = samp[i * 3] - q[0], dy = samp[i * 3 + 1] - q[1], dz = samp[i * 3 + 2] - q[2], d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } } return bi / NS; };
    const U = { s0: uOf(spin(0)), q: uOf(spin(A1)), td: uOf(spin(Math.PI * 3.5)), ex: uOf(spin(A2)) };
    const lenAt = (u) => (u < U.s0 ? lerp(30, 33.5, u / U.s0) : u < U.q ? lerp(33.5, 50, (u - U.s0) / (U.q - U.s0)) : u < U.td ? lerp(50, 64, (u - U.q) / (U.td - U.q)) : 64);
    // the frost front: a pool round the foot during the held breath, then it runs with the camera. On the chase it is
    // placed by where its leading tongue lies: aheadKeys = [u, metres ahead of the lens, down the river, of the first
    // ice not yet frozen]. From 4.8 m up the bottom edge of the frame meets the bed 8 m ahead and the lower third ends
    // 26 m ahead, so 13 m (its tip runs some 8 m further) puts the lit edge across the lower third with black gravel and red stars beyond it
    // (u 0.54-0.63: the race); after that the front surges away to reach the portal's rim before we do.
    const aheadKeys = [[U.ex, 14], [U.ex + 0.08, 22], [0.5, 17], [0.545, 13], [0.63, 13], [0.69, 38], [0.78, 70], [0.88, 90], [1, 86]];
    const aheadAt = (u) => { let i = 0; while (i < aheadKeys.length - 2 && u > aheadKeys[i + 1][0]) i++; const a = aheadKeys[i], b = aheadKeys[i + 1]; return lerp(a[1], b[1], smoothstep(a[0], b[0], u)); };
    // how far the front lags behind its own radius where the river's leading tongue crosses s metres downslope: the
    // mean of the three earliest arrivals near the route, smoothed along the river so the edge runs without jerks
    const LT = 170, lagTab = new Float32Array(LT + 1), lagRaw = new Float32Array(LT + 1), three = [0, 0, 0];
    for (let i = 0; i <= LT; i++) {
      const sT = i * 4, cx = chaseX(clamp(sT, 46, S_PORTAL)) - HX; three[0] = three[1] = three[2] = 1e9;
      for (let q = -3; q <= 3; q++) { const x = cx + q * 2, lag = frost.arrive(x, -sT) - Math.hypot(x, sT); if (lag < three[2]) { three[2] = lag; three.sort((m, n) => m - n); } }
      lagRaw[i] = three[2] < 1e8 ? (three[0] + three[1] + three[2]) / 3 : three[0] < 1e8 ? three[0] : 8;
    }
    for (let i = 0; i <= LT; i++) { let a = 0, w = 0; for (let q = -3; q <= 3; q++) { const j = clamp(i + q, 0, LT), k = 4 - Math.abs(q); a += lagRaw[j] * k; w += k; } lagTab[i] = a / w; }
    const tongue = (sT) => { const f = clamp(sT / 4, 0, LT), i = Math.min(Math.floor(f), LT - 1), cx = chaseX(clamp(sT, 46, S_PORTAL)) - HX; return Math.hypot(cx, sT) + lerp(lagTab[i], lagTab[i + 1], f - i); };
    await ctx.yield();
    const FT = 400, frontTab = new Float32Array(FT + 1);
    for (let i = 0, run = 0; i <= FT; i++) {
      const u = i / FT; let f = 0;
      if (u > U.td) { const j = Math.round(u * NS) * 3, sCam = Math.max(HZ - samp[j + 2], 0); f = Math.max(26 * smoothstep(U.td, U.td + 0.035, u), smoothstep(U.td + 0.02, U.ex + 0.03, u) * tongue(sCam + aheadAt(u))); }
      run = Math.max(run, f); frontTab[i] = run;
    }
    const frontAt = (u) => { const f = clamp(u, 0, 1) * FT, i = Math.min(Math.floor(f), FT - 1); return lerp(frontTab[i], frontTab[i + 1], f - i); };
    const pace = (u) => {
      let p = lerp(0.85, 0.45, smoothstep(U.s0 - 0.05, U.s0 + 0.02, u));
      p -= 0.08 * Math.exp(-((u - U.td) / 0.025) * ((u - U.td) / 0.025));
      p = lerp(p, 2.1, smoothstep(U.ex, U.ex + 0.08, u));
      return lerp(p, 1, smoothstep(0.84, 0.91, u));
    };
    await ctx.yield();

    // ---- shared uniforms
    const PANES = [[-58, -125, 36, 62, 1], [46, -40, 16, 24, 0.6], [-96, -270, 20, 30, 0.85], [34, -215, 14, 20, 0.55], [-122, -390, 24, 36, 0.9], [-150, -520, 26, 40, 0.9], [-176, -660, 26, 36, 0.85], [70, -430, 16, 22, 0.5]];
    const pr = rng.fork('panes');
    const SU = {
      uTime: { value: 0 }, uKeyDir: { value: keyDir.clone() }, uKeyCol: { value: keyCol }, uFillCol: { value: fillCol },
      uPaneA: { value: PANES.map((p) => new THREE.Vector4(p[0] + pr.range(-8, 8), p[1] + pr.range(-10, 10), p[2] * pr.range(0.85, 1.15), p[3] * pr.range(0.85, 1.15))) },
      uPaneB: { value: PANES.map((p, i) => new THREE.Vector4(p[4] * (i === 0 ? Math.max(paneK, 0.8) : paneK), pr.range(0, 6.28), 0, 0)) },
      uCore: { value: lin('#6FE6F2') }, uIce: { value: lin('#DDF3F6') }, uShade: { value: lin('#2AA6C8') },
      uSnow: { value: lin(look.snow) }, uPane: { value: lin(look.pane).multiplyScalar(1.1) }, uCoreC: { value: lin(look.core) },
      uOchre: { value: lin('#B58A3C') }, uCeilI: { value: ceilI }, uFrostAlb: { value: lin('#DDF3F6').multiplyScalar(0.66) },
      uFront, uHero: { value: new THREE.Vector3(HX, HY, HZ) },
      // open water (DOME_GLSL): uDeepK rises with the camera's depth, so the lit haze belongs to the chase only
      uFogCol: { value: fogCol.clone() }, uDeep: { value: lin(look.deep) }, uGlow: { value: lin(look.snow).multiplyScalar(0.22) },
      uRayC: { value: lin(look.pane).multiplyScalar(0.7).add(lin(look.core).multiplyScalar(0.3)).multiplyScalar(RAY_HAZE * ceilI) }, uDeepK: { value: 0 },
      uGiant: { value: 0 },   // the giant fingers of the chase are drawn up into the ceiling until the chase nears (u 0.3-0.5)
    };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const pick = (...names) => { const o = {}; for (const n of names) o[n] = SU[n]; return o; };
    const shader = (vs, fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...fogU(), ...uniforms }, fog: true, ...extra });
    const put = (mesh, order = 0) => { mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); scene.add(mesh); return mesh; };
    const POOLU = pick('uPaneA', 'uPaneB', 'uKeyDir', 'uTime');
    const DOMEU = pick('uFogCol', 'uDeep', 'uGlow', 'uRayC', 'uDeepK');
    const PREMULT = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
    let xr = null;   // a late fork for everything added after the first build, so the older random draws keep their order

    // ---- 4d sky and ice: dome, ceiling, platelets, strands, lesser fingers, shafts
    put(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), new THREE.ShaderMaterial({ vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false,
      uniforms: { ...DOMEU, ...pick('uKeyDir', 'uTime') } })), -10);
    const CM = 128, cmData = new Uint8Array(CM * CM * 4);
    const cmAt = (x, z) => [0.5 + 0.5 * N.fbm2(x / 140 + 5, z / 140, 3), 0.5 + 0.45 * N.fbm2(x / 220 + 9, z / 220 + 4, 3), 0.5 + 0.5 * N.n2(x / 60, z / 60 + 7)];
    for (let j = 0; j < CM; j++) {
      for (let i = 0; i < CM; i++) { const c = cmAt(CEIL.x0 + (i + 0.5) / CM * CEIL.w, CEIL.z0 - (j + 0.5) / CM * CEIL.d), k = (j * CM + i) * 4; cmData[k] = clamp(c[0], 0, 1) * 255; cmData[k + 1] = clamp(c[1], 0, 1) * 255; cmData[k + 2] = clamp(c[2], 0, 1) * 255; cmData[k + 3] = 255; }
      if (j % 16 === 15) await ctx.yield();
    }
    const ceilMap = new THREE.DataTexture(cmData, CM, CM, THREE.RGBAFormat, THREE.UnsignedByteType);
    ceilMap.magFilter = ceilMap.minFilter = THREE.LinearFilter; ceilMap.wrapS = ceilMap.wrapT = THREE.MirroredRepeatWrapping; ceilMap.generateMipmaps = false; ceilMap.needsUpdate = true;
    const HOLE = { x: -34, z: -300 };
    // the sheet itself runs far past the mapped rectangle (the map repeats, mirrored): from 200 m down, the ceiling in
    // frame is one to three kilometres ahead
    const ceilGeo = new THREE.PlaneGeometry(5600, 4700, 1, 1).rotateX(Math.PI / 2).translate(0, 0, CEIL.z0 - 2350);
    put(new THREE.Mesh(ceilGeo, new THREE.ShaderMaterial({ vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, side: THREE.DoubleSide, uniforms: {
      ...POOLU, ...DOMEU, ...pick('uSnow', 'uPane', 'uCoreC', 'uOchre', 'uCeilI'), uCeilMap: { value: ceilMap }, uCeilRect: { value: new THREE.Vector4(CEIL.x0, CEIL.z0, 1 / CEIL.w, 1 / CEIL.d) },
      uCrackC: { value: lin(look.core).lerp(lin(look.pane), 0.25) }, uHoleA: { value: new THREE.Vector4(HOLE.x, HOLE.z, 5, 1.5) }, uHoleB: { value: new THREE.Vector4(150, HZ, 9, 0.8) },
      uTide: { value: tide ? 1 : 0 }, uTideX: { value: 9 }, uShag: { value: shag ? 1 : 0.25 }, uAlgae: { value: look.algae * (shag ? 1.4 : 1) }, uCrackI: { value: 0.95 }, uFogD: { value: 0.0024 } } })), -5);
    await ctx.yield();
    {
      const r = rng.fork('platelets'), n = Math.round(3000 * det * dens * (shag ? 1.5 : 1)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const near = r() < 0.55, a = r(), b = r(), c = r(), d = r(), e = r(), f = r();
        let x = near ? (a + b + c - 1.5) * 44 : (a * 2 - 1) * 130, z = near ? 20 - d * 230 : 40 - d * 470;
        if (Math.hypot(x - HX, z - HZ) < 13) x += 26;
        iA.set([x, -0.3 - e * e * (shag ? 4.5 : 2.8), z, (near ? 0.25 + 0.5 * f * f : 0.3 + 0.8 * f * f) + (shag ? 0.3 : 0)], i * 4); iB.set([r() * 6.28, (r() - 0.5) * 1.3, r(), 0], i * 4);
      }
      const g = new THREE.InstancedBufferGeometry(), hp = [0, 0, 0];
      for (let k = 0; k < 6; k++) hp.push(Math.cos(k / 6 * TAU), Math.sin(k / 6 * TAU) * 1.25 - 0.9, 0);
      g.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 1]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n;
      put(new THREE.Mesh(g, shader(PLAT_VERT, PLAT_FRAG, { ...POOLU, ...pick('uSnow', 'uPane', 'uCoreC', 'uCeilI') }, { side: THREE.DoubleSide, ...PREMULT })), 1);
      await ctx.yield();
    }
    {
      const r = rng.fork('strands'), n = Math.round(440 * det * (shag ? 1.6 : 1)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        let x = 0, z = 0, best = -1;
        for (let t = 0; t < 4; t++) { const cx = (r() + r() - 1) * 70, cz = 25 - r() * 300, al = cmAt(cx, cz)[0]; if (al > best) { best = al; x = cx; z = cz; } }
        const big = r() < 0.2;
        iA.set([x, -0.4, z, (big ? 5 : 2) + r() * 3.5], i * 4); iB.set([0.22 + r() * 0.3, r(), r() * 6.28, 0.5 + r()], i * 4);
        if (i % 200 === 199) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry(), sp = [], si = [];
      for (let k = 0; k <= 7; k++) { sp.push(-0.5, -k / 7, 0, 0.5, -k / 7, 0); if (k < 7) si.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setIndex(si);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n;
      put(new THREE.Mesh(g, shader(STRAND_VERT, STRAND_FRAG, { ...POOLU, ...pick('uOchre', 'uSnow', 'uPane', 'uCeilI') }, { side: THREE.DoubleSide })));
    }
    {
      const r = rng.fork('fingers'), n = Math.round(40 * dens), P = [], K = [], I = [];
      // the giants of the chase: ten long fingers reaching to 15-75 m above the bed, 42-130 m either side of the route
      // and on past the portal, no two alike: thin and long or short and stout, some leaning away from the route, each
      // with its own taper, collar spacing and a handful of side icicles, and two of them fused at the root. Seen from
      // the deep they are the columns of the cathedral, pale in the haze. They are drawn up into the ceiling (uGiant)
      // until the chase nears, so the entry keeps its one vertical.
      const giants = async () => {
        const gr = xr.fork('giants'), SIDES = [-1, 1, 1, -1, 1, -1, -1, 1, -1];
        const one = (s, x, reach, r0, k) => {
          const len = -(HY + bedBase(s) + reach), sd = Math.sign(x - chaseX(Math.min(s, S_PORTAL))) || 1, spurs = [], ns = 6 + Math.floor(gr() * 5);
          for (let q = 0; q < ns; q++) spurs.push({ k: gr.range(0.05, 0.62), a: gr.range(0, 6.283), L: (5 + gr() * 13) * k, rb: (0.7 + gr() * 1.5) * Math.sqrt(r0 / 8) * k, out: gr.range(0.2, 2.2) });
          addFinger(P, K, I, N, x, HZ - s, len, r0, gr(), 40, 10, gr.range(3, 10), 1, { taper: gr.range(0.55, 1.35), lean: [sd * gr.range(0, 0.13) * len, gr.range(-0.14, 0.14) * len], per: gr.range(0.6, 1.7), lip: gr.range(0.15, 0.5), spurs });
        };
        for (let i = 0; i < 9; i++) {
          const s = 385 + i * 72 + gr.range(-45, 45), thin = gr() < 0.45, x = chaseX(Math.min(s, S_PORTAL)) + SIDES[i] * gr.range(42, 130);
          const reach = thin ? gr.range(15, 42) : gr.range(36, 75), r0 = thin ? gr.range(4, 7.5) : gr.range(8, 14);
          one(s, x, reach, r0, 1);
          if (i === 3) { const a = gr.range(0, 6.283), d = r0 * 1.25; one(s + Math.sin(a) * d, x + SIDES[i] * Math.abs(Math.cos(a)) * d, reach + gr.range(22, 40), r0 * 0.62, 0.7); }
          await ctx.yield();
        }
      };
      for (let i = 0; i < n; i++) {
        let x = 0, z = 0;
        for (let t = 0; t < 6; t++) { x = (r() * 2 - 1) * 150; z = -55 - r() * 370; const nr = path.nearestXZ(x, z); if (Math.hypot(x - HX, z - HZ) > 36 && (nr.dist > 20 || nr.y < -70)) break; x = 170; }
        const len = 8 + 22 * r() * r();
        addFinger(P, K, I, N, x, z, len, 0.9 + len * 0.075, r());
        if (i % 6 === 5) await ctx.yield();
      }
      xr = r.fork('extra');
      await ctx.yield();
      await giants();
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3)); g.setIndex(I);
      await ctx.yield();
      g.computeVertexNormals();
      put(new THREE.Mesh(g, shader(FING_VERT, FING_FRAG, { ...pick('uKeyDir', 'uKeyCol', 'uFillCol', 'uCore', 'uIce', 'uShade', 'uTime', 'uGiant'), uCoreI: { value: look.heroCore } }, { side: THREE.DoubleSide })));
      await ctx.yield();
    }
    const rayCol = lin(look.pane).lerp(lin(look.core), 0.4), rayDir = keyDir.clone().negate();
    const rays = [
      fx.makeGodRays({ rng: rng.fork('rays1'), time: SU.uTime, position: [-58, -1, -125], direction: rayDir, radius: 42, count: 14, length: 100, width: [3, 11], color: rayCol, intensity: 0.2 * ceilI }),
      fx.makeGodRays({ rng: rng.fork('rays2'), time: SU.uTime, position: [-120, -1, -360], direction: rayDir, radius: 80, count: 10, length: 250, width: [5, 20], color: rayCol, intensity: 0.15 * ceilI }),
      fx.makeGodRays({ rng: rng.fork('rays3'), time: SU.uTime, position: [150, -1, HZ], direction: rayDir, radius: 7, count: 4, length: 70, width: [2, 7], color: rayCol, intensity: 0.2 * ceilI }),
    ];
    // mid-water shafts along the chase: each group falls from the ceiling to a foot on the bed beside the route (most to
    // the left, one crossing above the river from the right), so broad shafts stand in frame all the way down
    {
      const az = az0 + 0.18, st = Math.sin(tilt), kc = new THREE.Vector3(-st * Math.cos(az), Math.cos(tilt), st * Math.sin(az) + 0.1).normalize();
      for (const [s, off, rad, cnt] of [[215, -28, 30, 5], [330, -36, 34, 6], [445, -30, 34, 6], [560, -44, 36, 5], [400, 56, 22, 4], [690, -20, 60, 6]]) {
        const fx_ = chaseX(Math.min(s, S_PORTAL)) + off, fz = HZ - s, t = -(HY + bedBase(s)) / kc.y;
        await ctx.yield();
        rays.push(fx.makeGodRays({ rng: xr.fork('rays' + s), time: SU.uTime, position: [fx_ + kc.x * t, -1, fz + kc.z * t], direction: rayDir, radius: rad, count: cnt, length: t * 1.3, width: [8, 24], color: rayCol, intensity: 0.2 * ceilI, falloff: 0.6 }));
      }
    }
    for (const r of rays) { r.object.frustumCulled = false; scene.add(r.object); }
    await ctx.yield();

    // ---- 4e bed and cast
    {
      const NC = 44, NR = 520, zA = 70, zB = HZ - S_PORTAL - 170, nv = (NC + 1) * (NR + 1);
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), edge = new Float32Array(nv);
      let k = 0;
      for (let j = 0; j <= NR; j++) {
        const z = lerp(zA, zB, j / NR), ez = Math.max(1 - smoothstep(0, 0.03, j / NR), smoothstep(0.93, 1, j / NR));
        for (let i = 0; i <= NC; i++, k++) {
          const t = i / NC * 2 - 1, at = Math.abs(t), x = Math.sign(t) * (60 * at + 380 * Math.pow(at, 3.2)), y = bedY(x, z);
          const gx = (bedY(x + 0.8, z) - y) / 0.8, gz = (bedY(x, z + 0.8) - y) / 0.8, l = Math.hypot(gx, 1, gz);
          pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; nor[k * 3] = -gx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = -gz / l;
          edge[k] = Math.max(ez, smoothstep(0.72, 1, at));
        }
        if (j % 12 === 11) await ctx.yield();
      }
      const idx = new Uint32Array(NC * NR * 6); let q = 0;
      for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { const a = j * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const A = mat ? lin('#3c4030') : lin('#20242c'), B = mat ? lin('#5a5c44') : lin('#3a3f4a');
      put(new THREE.Mesh(g, shader(BED_VERT, BED_FRAG, { ...POOLU, ...pick('uKeyCol', 'uFillCol', 'uCore', 'uFront', 'uHero'), uBedA: { value: A.multiplyScalar(1.4) }, uBedB: { value: B.multiplyScalar(1.4) }, uShell: { value: lin('#cfd6c8').multiplyScalar(0.55) } }, { side: THREE.DoubleSide })), -3);
      await ctx.yield();
    }
    // anchor ice: heaps of broken glass on the bed (own shards and shader; the raft wears the same)
    const shardGeo = shardClumpGeometry(xr.fork('shards'), 18);
    const anchMat = shader(ANCH_VERT, ANCH_FRAG, { ...POOLU, ...pick('uKeyCol', 'uFillCol', 'uIce', 'uShade', 'uCore', 'uFront', 'uHero') }, { side: THREE.DoubleSide });
    await ctx.yield();
    {
      const r = rng.fork('anchor'), n = Math.round(240 * det * dens);
      const im = new THREE.InstancedMesh(shardGeo, anchMat, n);
      const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const s = -70 + r() * 700, x = (r() + r() + r() - 1.5) * 44, z = HZ - s, nearPath = Math.abs(x - chaseX(Math.max(s, 46))) < 9 || Math.hypot(x, s) < 24;
        const k = nearPath ? 0.75 + r() * 0.8 : 1.4 + r() * r() * 2.3;
        ee.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5); sc.set(k, k * (0.7 + r() * 0.5), k);
        im.setMatrixAt(i, m4.compose(_p.set(x, bedY(x, z) - 0.05, z), qq.setFromEuler(ee), sc));
        if (i % 100 === 99) await ctx.yield();
      }
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; scene.add(im);
      await ctx.yield();
    }
    // stars and urchins
    const critMat = shader(CRIT_VERT, CRIT_FRAG, { ...POOLU, ...pick('uKeyCol', 'uFillCol', 'uCore', 'uFrostAlb', 'uFront'), uPale: { value: lin('#f2b08a') }, uAccent: { value: 0.16 } }, { side: THREE.DoubleSide });
    const huddle = hero.anchors.starHuddle, HUD = new THREE.Vector3(huddle.x + HX, huddle.y + HY, huddle.z + HZ);
    {
      const sr = rng.fork('stars'), verm = lin('#E8452C'), plum = lin(urchinYear ? '#8a1f52' : '#5a2040');
      const place = (x, z, size, kind, force) => {
        const d1 = sr(), d2 = sr(), d3 = sr(), d4 = sr(), d5 = sr();
        const xl = x - HX, zl = z - HZ, s = -zl, y = bedY(x, z), gx = (bedY(x + 0.6, z) - y) / 0.6, gz = (bedY(x, z + 0.6) - y) / 0.6;
        const cov = frost.coverage(xl, zl), rad = Math.hypot(xl, zl), sd = xl >= frost.centre(Math.max(s, 0)) ? 1 : -1;
        let caught = 0, arr = rad + 10, fxv = 0, fzv = 0;
        if (cov > 0.5 && (kind === 1 || (force === undefined ? d1 < 0.34 : force))) { caught = 1; arr = frost.arrive(xl, zl); if (!(arr < 1e5)) { arr = rad + 10; } }
        else if (kind === 1) arr = 1e6;
        else if (cov > 0.22 || force === false) { const d = cov > 0.5 ? 3.5 + d2 * 2.5 : 1.5 + d2 * 1.5; if (rad < 22) { fxv = xl / Math.max(rad, 1) * d; fzv = zl / Math.max(rad, 1) * d; } else { fxv = sd * d; fzv = d3 * 2 - 1; } }
        const tint = kind === 1 ? plum : verm, tv = 0.82 + 0.3 * d4;
        return { x, y: y + 0.03, z, size, yaw: d5 * 6.28, seed: d3, arr, caught, fx: fxv, fz: fzv, gx, gz, r: tint.r * tv, g: tint.g * (kind ? 1 : 0.7 + 0.6 * d4), b: tint.b, kind };
      };
      const near = [], far = [], urch = [], sk = urchinYear ? 0.6 : 1;
      for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = 1.85 * Math.sqrt(i); near.push(place(HUD.x + Math.cos(a) * rr, HUD.z + Math.sin(a) * rr, 1.35 + 0.12 * (i % 3), 0, i === 0 ? false : i % 3 === 1)); }
      for (let i = 0; i < 26; i++) { const a = sr() * 6.28, rr = 11 + sr() * 28; near.push(place(HX + Math.cos(a) * rr, HZ + Math.sin(a) * rr, 1.1 + sr() * 0.25, 0)); }
      const nCh = Math.round(170 * dens * sk);
      for (let i = 0; i < nCh; i++) { const s = 30 + (i + sr()) / nCh * 575, side = i % 2 ? 1 : -1; near.push(place(chaseX(Math.max(s, 46)) + side * (2.5 + sr() * 9.5), HZ - s, 1.1 + sr() * 0.3, 0)); if (i % 60 === 59) await ctx.yield(); }
      const nFar = Math.round(1600 * dens * det * sk);
      for (let i = 0; i < nFar; i++) {
        const shelf = sr() < 0.42, x = (sr() + sr() + sr() - 1.5) * (shelf ? 90 : 56), z = shelf ? 35 - sr() * 205 : HZ - 40 - sr() * 600;
        far.push(place(x, z, 1.0 + sr() * 0.4, 0));
        if (i % 300 === 299) await ctx.yield();
      }
      const nU = Math.round(400 * dens * det * (urchinYear ? 2.1 : 1));
      for (let i = 0; i < nU; i++) {
        const shelf = sr() < 0.3, x = (sr() + sr() + sr() - 1.5) * (shelf ? 80 : 50), z = shelf ? 30 - sr() * 200 : HZ - 40 - sr() * 600;
        urch.push(place(x, z, 0.7 + sr() * 0.25, 1));
        if (i % 300 === 299) await ctx.yield();
      }
      scene.add(critterMesh(starGeometry(4, [-1, -0.5, 0, 0.5, 1]), near, critMat));
      await ctx.yield();
      scene.add(critterMesh(starGeometry(2, [-1, 0, 1]), far, critMat));
      await ctx.yield();
      scene.add(critterMesh(urchinGeometry(sr), urch, critMat));
      await ctx.yield();
    }
    // the merged benthos mesh
    const benMat = (under, grey = 0.45, mottle = 0) => shader(BEN_VERT, BEN_FRAG, { ...POOLU, ...pick('uKeyCol', 'uFillCol', 'uCore', 'uFrostAlb', 'uFront', 'uHero'), uUnder: { value: under }, uFuzz: { value: 0.85 }, uGrey: { value: grey }, uMottle: { value: mottle } }, { side: THREE.DoubleSide, vertexColors: true });
    const frameM = path.frameAt(true, new THREE.Matrix4(), true), endT = path.endTangent;
    {
      const br = rng.fork('benthos'), acc = makeAcc(), c = new THREE.Color();
      const arrAt = (x, z) => { const a = frost.arrive(x - HX, z - HZ); return a < 1e5 ? a : 1e6; };
      // a vase sponge: a deeply fluted cream-white vase on a splayed foot sunk in the gravel, a ragged lip round a dark
      // mouth, furred with spicules along the ridges and crowned with them at the lip
      const sponge = (x, z, h, far = false) => {
        const yc = bedY(x, z), ph = br() * 6.28, fl = 7 + Math.floor(br() * 3), ar = arrAt(x, z), sides = fl * (far ? 3 : 4), nSpic = far ? 110 : 170, an = (f) => [1, 0.014 * h, ph, f];
        const hr = (i) => { const v = Math.sin(i * 127.1 + ph * 311.7) * 43758.5453; return v - Math.floor(v); };
        const F = [0, 0.03, 0.07, 0.13, 0.22, 0.33, 0.45, 0.57, 0.69, 0.8, 0.89, 0.96, 1], FI = [0.985, 0.93, 0.82, 0.66, 0.5];
        const wave = (ang, f) => 0.5 + 0.5 * Math.sin(ang * fl + ph + 1.4 * f);
        const R = (ang, f) => {
          const body = 0.118 + 0.085 * (1 - smoothstep(0, 0.1, f)) + 0.118 * smoothstep(0.04, 0.72, f) - 0.03 * smoothstep(0.84, 1, f), fa = 0.27 * smoothstep(0.02, 0.22, f);
          return h * body * (1 - fa * 0.55 + fa * Math.pow(wave(ang, f), 0.7)) * (1 + 0.07 * N.n3(Math.cos(ang) * 1.6 + ph, f * 4, Math.sin(ang) * 1.6));
        };
        const lipDy = (ang) => h * 0.035 * N.n2(Math.cos(ang) * 2.3 + ph * 3, Math.sin(ang) * 2.3) + h * 0.014 * Math.sin(ang * fl + ph + 1.4);
        const P3 = (ang, f, k, dy) => {
          const rr = R(ang, f) * k, px = x + Math.sin(f * 2.2 + ph) * h * 0.03 * f + Math.cos(ang) * rr, pz = z + Math.cos(f * 1.8 + ph) * h * 0.03 * f + Math.sin(ang) * rr;
          const foot = 1 - smoothstep(0, 0.1, f);   // only the splayed foot follows the bed
          return [px, yc + f * h + (foot > 0 ? foot * (bedY(px, pz) - yc - 0.45) : 0) + dy, pz];
        };
        let prev = null;
        const ring = (f, k, lip, tone) => {
          const row = [];
          for (let j = 0; j < sides; j++) {
            const ang = j / sides * TAU, q = P3(ang, f, k, lip ? lipDy(ang) : 0);
            if (tone) c.setRGB(0.30, 0.36, 0.36).multiplyScalar(tone).lerp(_c.setRGB(0.03, 0.07, 0.10), 1 - tone);
            else c.setRGB(0.60, 0.61, 0.54).multiplyScalar((0.36 + 0.64 * lerp(1, wave(ang, f), smoothstep(0.02, 0.22, f))) * (0.78 + 0.3 * f));
            row.push(acc.v(q[0], q[1], q[2], c, an(f), ar));
          }
          if (prev) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; acc.quad(prev[j], prev[j1], row[j1], row[j]); }
          prev = row;
        };
        for (let i = 0; i < F.length; i++) ring(F[i], 1, i === F.length - 1, 0);
        for (let i = 0; i < FI.length; i++) ring(FI[i], 0.87 - 0.05 * i, i === 0, [1, 0.5, 0.22, 0.08, 0.02][i]);
        const cap = acc.v(x, yc + 0.46 * h, z, c.setRGB(0.03, 0.07, 0.10), an(0.46), ar);
        for (let j = 0; j < sides; j++) acc.tri(prev[j], prev[(j + 1) % sides], cap);
        for (let k = 0; k < nSpic; k++) {
          const crown = k < nSpic / 4, f = crown ? 1 : 0.07 + 0.9 * hr(k * 3 + 1), m = Math.round(hr(k * 3 + 2) * fl);
          const ang = (Math.PI / 2 - ph - 1.4 * f + TAU * m) / fl + (hr(k * 3 + 3) - 0.5) * (crown ? 1 : 0.36) * TAU / fl, ca = Math.cos(ang), sa = Math.sin(ang);
          const q = P3(ang, f, 0.97, crown ? lipDy(ang) : 0), L = h * (crown ? 0.05 + 0.05 * hr(k * 3 + 4) : 0.03 + 0.045 * hr(k * 3 + 4)), up = crown ? 1.5 : 0.25 + 0.6 * hr(k * 3 + 5), dl = L / Math.hypot(1, up), bw = h * 0.008;
          const vert = k % 2, tx = vert ? 0 : -sa * bw, ty = vert ? bw : 0, tz = vert ? 0 : ca * bw, a3 = an(f);
          c.setRGB(0.50, 0.52, 0.48); const b0 = acc.v(q[0] - tx, q[1] - ty, q[2] - tz, c, a3, ar), b1 = acc.v(q[0] + tx, q[1] + ty, q[2] + tz, c, a3, ar);
          acc.tri(b0, b1, acc.v(q[0] + ca * dl, q[1] + up * dl, q[2] + sa * dl, c.setRGB(0.68, 0.72, 0.70), a3, ar));
        }
      };
      for (const a of [-0.75, 0.15, 0.9, Math.PI - 0.5, Math.PI + 0.6]) { const rr = 19 + br() * 3; sponge(xP + Math.cos(a) * rr, HZ - S_HOLLOW - 6 + Math.sin(a) * rr * 0.9, 10 + br() * 4); await ctx.yield(); }
      const nSp = Math.round((mat ? 14 : 7) * dens);
      for (let i = 0; i < nSp; i++) { const s = -40 + br() * 560, side = br() < 0.5 ? -1 : 1; sponge(side * (20 + br() * 22), HZ - s, 6 + br() * 6, true); await ctx.yield(); }
      await ctx.yield();
      // bush sponges: clumps of lumpy cream lobes pitted with pores, each lobe with an open dark mouth and a bristle of
      // spicules round it (the vase sponges' smaller cousins); then the anemones
      const wr = xr.fork('soft'), POROUS = [1, 0, 0], H5 = [-0.2, 0.2, 0.52, 0.8, 1.0], RP = [0.62, 0.9, 1.0, 0.86, 0.6];
      for (let i = 0; i < Math.round(22 * dens); i++) {
        const s = -60 + br() * 640, x = (br() < 0.5 ? -1 : 1) * (9 + br() * 26), z = HZ - s, y0 = bedY(x, z), ar = arrAt(x, z);
        for (let k = 0; k < 5; k++) {
          const a = br() * 6.28, l = 1.2 + br() * 2.2, dx = Math.cos(a) * l * 0.5, dz = Math.sin(a) * l * 0.5;
          const rb = 0.40 + 0.26 * wr(), sd = wr() * 40, tint = 0.8 + 0.3 * wr(), bend = 0.3 + 0.5 * wr(), ph = wr() * 6.28, sway = (f) => [1, 0.04 * l, ph, f];
          const pts = H5.map((h) => { const f = Math.max(h, 0), o = f * (bend + (1 - bend) * f); return [x + dx * (0.25 + 1.1 * o), y0 + l * 1.2 * h, z + dz * (0.25 + 1.1 * o)]; });
          const rows = tube(acc, pts, 8, (ii, ang) => rb * RP[ii] * (1 + 0.27 * N.n3(Math.cos(ang) * 1.2 + sd, H5[ii] * l * 0.9, Math.sin(ang) * 1.2) + 0.1 * Math.sin(ang * 3 + ii * 2.1 + sd)), {
            col: (ii, ang, f, px, py, pz) => c.setRGB(0.76, 0.62, 0.41).multiplyScalar(tint * (0.60 + 0.42 * Math.max(H5[ii], 0)) * (1 - 0.4 * smoothstep(0.05, 0.5, -N.n3(px * 1.6, py * 1.6, pz * 1.6)))),
            anim: (ii) => sway(Math.max(H5[ii], 0)), arr: () => ar, flags: POROUS });
          const lip = rows[4], top = pts[4], inner = [];
          for (let j = 0; j < 8; j++) { const q = acc.pos(lip[j]); inner.push(acc.v(lerp(top[0], q[0], 0.62), lerp(top[1], q[1], 0.5) - 0.24 * rb, lerp(top[2], q[2], 0.62), c.setRGB(0.10, 0.11, 0.10), sway(1), ar, POROUS)); }
          for (let j = 0; j < 8; j++) { const j1 = (j + 1) % 8; acc.quad(lip[j], lip[j1], inner[j1], inner[j]); }
          const cap = acc.v(top[0], top[1] - 0.62 * rb, top[2], c.setRGB(0.03, 0.045, 0.05), sway(1), ar);
          for (let j = 0; j < 8; j++) acc.tri(inner[j], inner[(j + 1) % 8], cap);
          for (let q = 0; q < 5; q++) {
            const row = q < 3 ? 4 : 2 + (q & 1), v = acc.pos(rows[row][Math.floor(wr() * 8) % 8]), cc = pts[row], ox = v[0] - cc[0], oy = v[1] - cc[1], oz = v[2] - cc[2], ol = Math.hypot(ox, oy, oz) || 1;
            const L = 0.35 + 0.45 * wr(), up = q < 3 ? 0.9 : 0.3, tx = -oz / ol * 0.05, tz = ox / ol * 0.05, a3 = sway(Math.max(H5[row], 0));
            c.setRGB(0.52, 0.50, 0.42); const b0 = acc.v(v[0] - tx, v[1], v[2] - tz, c, a3, ar), b1 = acc.v(v[0] + tx, v[1], v[2] + tz, c, a3, ar);
            acc.tri(b0, b1, acc.v(v[0] + ox / ol * L * 0.7, v[1] + (oy / ol * 0.7 + up) * L, v[2] + oz / ol * L * 0.7, c.setRGB(0.72, 0.72, 0.64), a3, ar));
          }
        }
        await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < Math.round(14 * dens); i++) {
        const s = -50 + br() * 600, x = (br() < 0.5 ? -1 : 1) * (7 + br() * 20), z = HZ - s, y0 = bedY(x, z), ph = br() * 6.28, ar = arrAt(x, z);
        tube(acc, [[x, y0 - 0.2, z], [x, y0 + 0.7, z], [x, y0 + 1.3, z]], 8, (ii) => [0.7, 0.55, 0.9][ii], { col: () => c.setRGB(0.55, 0.42, 0.36), arr: () => ar });
        for (let k = 0; k < 18; k++) { const a = k / 18 * 6.28 + ph, r0 = 0.5 + (k % 3) * 0.2, dx = Math.cos(a), dz = Math.sin(a), l = 1.2 + br() * 0.6;
          tube(acc, [[x + dx * r0, y0 + 1.25, z + dz * r0], [x + dx * (r0 + l * 0.4), y0 + 1.25 + l * 0.6, z + dz * (r0 + l * 0.4)], [x + dx * (r0 + l * 0.9), y0 + 1.25 + l, z + dz * (r0 + l * 0.9)]], 3, (ii) => [0.11, 0.08, 0.03][ii],
            { col: (ii) => c.setRGB(0.66, 0.62, 0.56).multiplyScalar(0.7 + 0.15 * ii), anim: (ii, f) => [1, 0.55, ph + k, f], arr: () => ar }); }
        if (i % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      // ribbon worms writhing in knots: thin, flat, banded ribbons 16 m long, lying on the bed's own slope and seated at
      // least 12 m off the route on the chase so none lies on the river at the lens; then the walkers on the gravel
      for (let i = 0; i < 6; i++) {
        const s = i < 2 ? -18 + i * 30 : 80 + i * 85, off = 7 + br() * 8, sdn = i % 2 ? 1 : -1, x = i < 2 ? sdn * off : chaseX(s) + sdn * (off + 5), z = HZ - s, ph = br() * 6.28, wp = [];
        const p2 = wr() * 6.28, p3 = wr() * 6.28, NW = 96;
        for (let k = 0; k <= NW; k++) {
          const f = k / NW, px = x + 2.5 * Math.sin(f * 9.4 + ph) + 0.9 * Math.sin(f * 24 + p2) + 0.32 * Math.sin(f * 58 + p3), pz = z + 1.9 * Math.sin(f * 15.7 + ph * 2) + 0.8 * Math.cos(f * 21 + p3) + 0.3 * Math.cos(f * 63 + p2);
          wp.push([px, bedY(px, pz) + 0.16 + 0.10 * (1 + Math.sin(f * 41 + p2)), pz]);
        }
        tube(acc, wp, 4, (ii, ang, f) => (0.045 + 0.085 * Math.pow(Math.sin(Math.PI * clamp(f * 0.94 + 0.03, 0, 1)), 0.4)) * (0.38 + 0.62 * Math.abs(Math.cos(ang))),
          { col: (ii, ang, f) => c.setRGB(0.66, 0.60, 0.47).multiplyScalar((0.48 + 0.52 * smoothstep(-0.35, 0.35, Math.sin(f * 120))) * (Math.sin(ang) < -0.5 ? 0.7 : 1)), anim: (ii, f) => [2, 0.4, ph, f * 2.6] });
        if (i % 2 === 1) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < 7; i++) {
        const a = br() * 6.28, rr = 12 + br() * 22, x = HX + Math.cos(a) * rr, z = HZ + 4 + Math.sin(a) * rr, y0 = HY, hd = br() * 6.28, ph = br(), an = [3, 9, ph, hd], spider = i >= 4;
        const fx_ = Math.cos(hd), fz_ = Math.sin(hd), bl = spider ? 0.5 : 1.0;
        tube(acc, [[x - fx_ * bl, y0 + (spider ? 1.3 : 0.3), z - fz_ * bl], [x - fx_ * bl * 0.4, y0 + (spider ? 1.35 : 0.45), z - fz_ * bl * 0.4], [x + fx_ * bl * 0.4, y0 + (spider ? 1.35 : 0.45), z + fz_ * bl * 0.4], [x + fx_ * bl, y0 + (spider ? 1.3 : 0.3), z + fz_ * bl]], 6,
          (ii, ang) => [0.12, 0.3, 0.3, 0.1][ii] * (spider ? 0.5 : 1 + 0.5 * Math.abs(Math.cos(ang))), { col: () => (spider ? c.setRGB(0.5, 0.36, 0.2) : c.setRGB(0.36, 0.33, 0.28)), anim: () => an });
        const legs = spider ? 8 : 6;
        for (let k = 0; k < legs; k++) { const la = hd + Math.PI / 2 * (k % 2 ? 1 : -1) + (Math.floor(k / 2) - (legs / 4 - 0.5)) * (spider ? 0.55 : 0.5), lx = Math.cos(la), lz = Math.sin(la), ll = spider ? 2.3 : 0.7, hy = spider ? 1.3 : 0.35;
          tube(acc, [[x + lx * 0.15, y0 + hy, z + lz * 0.15], [x + lx * ll * 0.5, y0 + hy + (spider ? 0.9 : 0.15), z + lz * ll * 0.5], [x + lx * ll, y0 + 0.05, z + lz * ll]], 3, () => (spider ? 0.06 : 0.05), { col: () => (spider ? c.setRGB(0.5, 0.36, 0.2) : c.setRGB(0.3, 0.28, 0.24)), anim: () => an }); }
      }
      await ctx.yield();
      // the tripod with its boxed camera aimed at the finger, and the cable rising to the dive hole
      {
        const tx = HX + 30, tz = HZ, ty = HY + 10, grey = () => c.setRGB(0.22, 0.24, 0.26);
        for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; tube(acc, [[tx + Math.cos(a) * 4, HY, tz + Math.sin(a) * 4], [tx + Math.cos(a) * 2, HY + 5, tz + Math.sin(a) * 2], [tx, ty, tz]], 4, (ii) => [0.22, 0.17, 0.14][ii], { col: grey }); }
        tube(acc, [[tx + 1.2, ty + 0.9, tz], [tx + 1.0, ty + 0.9, tz], [tx - 1.2, ty + 0.9, tz], [tx - 1.4, ty + 0.9, tz]], 4, (ii) => [0.3, 1.15, 1.15, 0.3][ii], { col: () => c.setRGB(0.30, 0.32, 0.33), ref: [0, 1, 0] });
        tube(acc, [[tx - 1.4, ty + 0.9, tz], [tx - 2.1, ty + 0.85, tz]], 8, () => 0.55, { col: () => c.setRGB(0.05, 0.07, 0.09), ref: [0, 1, 0] });
        const cab = []; for (let k = 0; k <= 40; k++) { const f = k / 40; cab.push([tx + 1.2 + f * 119, lerp(ty + 0.9, -0.5, f) - 16 * Math.sin(Math.PI * f) * (1 - f * 0.5), tz + 6 * Math.sin(f * 4)]); }
        tube(acc, cab, 3, (ii, ang, f) => 0.16 + 0.5 * f, { col: () => c.setRGB(0.5, 0.52, 0.5), anim: (ii, f) => [1, 2.2 * Math.sin(Math.PI * f), 1.7, 1] });
      }
      // the portal's rim: a rough ring of dark rock with boulders heaped at its foot and along its crown. The frost
      // climbs both sides (rime in patches, the stone showing through), bristles them with blades and closes over the
      // top as a crown of crystals just before we dive through
      {
        const RN = 64, ROCK = [0.85, 1, 0], ring = [], climb = (a) => S_PORTAL - 6 + 54 * (0.5 + 0.5 * Math.sin(a));
        const rockCol = (px, py, pz) => c.setRGB(0.085, 0.092, 0.105).multiplyScalar(0.55 + 0.9 * (0.5 + 0.5 * N.n3(px * 0.7, py * 0.7, pz * 0.7)));
        for (let i = 0; i < RN; i++) {
          const a = i / RN * TAU, rr = 8.9 + 0.35 * Math.sin(a * 5 + 1) + 0.25 * N.n2(Math.cos(a) * 2.2 + 9, Math.sin(a) * 2.2);
          _p.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.4 + 0.45 * N.n2(Math.cos(a) * 1.7, Math.sin(a) * 1.7 + 30)).applyMatrix4(frameM); ring.push([_p.x, _p.y, _p.z, a]);
        }
        tube(acc, ring, 10, (i, ang) => { const a = ring[i][3], ca = Math.cos(ang) * 1.2, sa = Math.sin(ang) * 1.2; return 1.15 * (1 + 0.30 * N.n3(Math.cos(a) * 3 + ca, Math.sin(a) * 3 + sa, 7.7) + 0.16 * N.n3(Math.cos(a) * 8 + ca * 2, Math.sin(a) * 8 + sa * 2, 3.1)) + 0.1 * Math.sin(ang * 3 + i * 1.9); },
          { closed: true, ref: [endT.x, endT.y, endT.z], col: (i, ang, f, px, py, pz) => rockCol(px, py, pz), arr: (px, py, pz, i) => climb(ring[i][3]), flags: ROCK });
        await ctx.yield();
        for (let b = 0; b < 11; b++) {   // six boulders break the crown's silhouette, five lie against the foot
          const top = b < 6, a = top ? Math.PI / 2 + (b - 2.5) * 0.3 + (wr() - 0.5) * 0.14 : -Math.PI / 2 + (b - 8) * 0.36 + (wr() - 0.5) * 0.2, sz = top ? 0.8 + wr() * 0.8 : 1.5 + wr() * 1.3;
          const rr = 8.9 + (top ? 0.5 + sz * 0.35 : sz * 0.75) + wr() * (top ? 0.5 : 0.8), sd = wr() * 50, ar = climb(a);
          _p.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.4 + (wr() - 0.5) * (top ? 1.4 : 3.6)).applyMatrix4(frameM);
          const bx = _p.x, by = _p.y, bz = _p.z, lx = (wr() - 0.5) * 0.6 * sz, lz = (wr() - 0.5) * 0.6 * sz;
          tube(acc, [-1, -0.6, -0.1, 0.45, 0.85, 1].map((h) => [bx + lx * h, by + sz * h * 0.9, bz + lz * h]), 6,
            (i, ang) => sz * [0.2, 0.8, 1.0, 0.85, 0.45, 0.06][i] * (1 + 0.42 * N.n3(Math.cos(ang) * 1.3 + sd, i * 0.7, Math.sin(ang) * 1.3) + 0.12 * Math.sin(ang * 2 + sd + i)),
            { col: (i, ang, f, px, py, pz) => rockCol(px, py, pz), arr: () => ar, flags: ROCK });
          if (b % 4 === 3) await ctx.yield();
        }
        await ctx.yield();
        for (let i = 0; i < 220; i++) {   // the blades: a crown's worth over the top, the rest all round
          const crown = i < 100, a = crown ? Math.PI / 2 + (br() + br() - 1) * 1.0 : br() * TAU, up = smoothstep(0.2, 0.9, Math.sin(a));
          const rr = 8.9 + (br() - 0.3) * 2.0, zf = -0.5 - br() * 0.9, h = 1.0 + br() * (0.9 + 1.5 * up), ar = climb(a) + br() * 5, wv = 0.10 + 0.08 * h;
          _p.set(Math.cos(a) * rr, Math.sin(a) * rr, 0.4 + zf).applyMatrix4(frameM);
          _p2.set(Math.cos(a) * (0.5 + br() + up) + (br() - 0.5) * 0.7, Math.sin(a) * (0.5 + br() + up) + (br() - 0.5) * 0.7, -(0.25 + br() * (1.2 - 0.7 * up))).transformDirection(frameM).multiplyScalar(h);
          const ice = c.setRGB(0.60, 0.74, 0.78).multiplyScalar(0.8 + 0.4 * br()), an = [4, 0, 0, 0];
          const b0 = acc.v(_p.x - wv, _p.y, _p.z, ice, an, ar), b1 = acc.v(_p.x + wv, _p.y, _p.z, ice, an, ar), b2 = acc.v(_p.x, _p.y + wv, _p.z + wv * 0.7, ice, an, ar);
          const tp = acc.v(_p.x, _p.y, _p.z, ice, an, ar, [_p2.x, _p2.y, _p2.z]);
          acc.tri(b0, b1, tp); acc.tri(b1, b2, tp); acc.tri(b2, b0, tp);
          if (i % 80 === 79) await ctx.yield();
        }
      }
      await ctx.yield();
      const g = await acc.buildSlow(ctx);
      await ctx.yield();
      put(new THREE.Mesh(g, benMat(0)));
      await ctx.yield();
    }

    // the seal(s): circling the breathing hole, then overtaking on the left in the chase (keyed to u)
    const _f = new THREE.Vector3(), _c1 = new THREE.Vector3(), _c2 = new THREE.Vector3();
    // keys: u, metres ahead, to the left, above the camera. The camera looks 18 degrees down the slope, so "above" must
    // go negative for the seal to sit in the left half of the frame rather than be cut by its top edge.
    const sealKeys = [[0.47, -34, 16, 16], [0.51, 4, 14, 1], [0.55, 28, 12, -4.5], [0.6, 36, 13, -5.5], [0.66, 85, 30, 18], [0.74, 160, 70, 95], [1.01, 200, 80, 120]];
    const sealChase = (u, out, shift) => {
      const uu = Math.max(u - shift, 0.47); let i = 0; while (i < sealKeys.length - 2 && uu > sealKeys[i + 1][0]) i++;
      const a = sealKeys[i], b = sealKeys[i + 1], t = smoothstep(a[0], b[0], uu) * 0.5 + clamp((uu - a[0]) / (b[0] - a[0]), 0, 1) * 0.5;
      path.pointAt(uu, out); path.tangentAt(uu, _f); _f.y = 0; _f.normalize();
      const ah = lerp(a[1], b[1], t), lf = lerp(a[2], b[2], t) + shift * 400, up = lerp(a[3], b[3], t) + shift * 240;
      return out.set(out.x + _f.x * ah + _f.z * lf, out.y + up, out.z + _f.z * ah - _f.x * lf);
    };
    const sealAt = (u, time, out, shift = 0) => {
      const a = time * 0.11 + shift * 60;
      _c1.set(HOLE.x + Math.cos(a) * 22, -15 - 4 * Math.sin(a * 1.7), HOLE.z + Math.sin(a) * 22);
      const k = smoothstep(0.40, 0.47, u - shift);
      if (k <= 0) return out.copy(_c1);
      sealChase(u, _c2, shift);
      return out.lerpVectors(_c1, _c2, k);
    };
    await ctx.yield();
    const sealGeo = sealGeometry(N, 24), sealMat = benMat(0.5, 0.7, 1), seals = [];
    for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(sealGeo, sealMat); m.frustumCulled = false; m.visible = i === 0 || twoSeals; scene.add(m); seals.push(m); }
    const NB = 64, bubP = new Float32Array(NB * 4), bubAttr = new THREE.InstancedBufferAttribute(bubP, 4);
    bubAttr.setUsage(THREE.DynamicDrawUsage);
    {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iP', bubAttr); g.instanceCount = NB;
      put(new THREE.Mesh(g, shader(BUB_VERT, BUB_FRAG, pick('uIce', 'uCore'), { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor })), 5);
    }
    await ctx.yield();

    // kit fauna: ice fish under the platelets, white-and-amber jellies in mid-water
    const faunaLight = { sunDir: keyDir.clone(), sunColor: look.key, sunIntensity: 1.1, sky: look.pane, skyIntensity: 0.55, ground: look.snow, groundIntensity: 0.5 };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    await ctx.yield();
    fauna.add(F.makeFishSchool({ rng: rng.fork('fish'), species: 'mackerel', count: Math.round(120 * det), size: 4, center: [-6, -8, -62], radius: 34, height: 2.5, top: '#9db3c6', belly: '#eef6fa' }));
    await ctx.yield();
    const jp = [[-22, -24, -66], [27, -31, -96], [46, -38, -152], [-42, -46, -116], [30, -53, -182]];
    for (const [s, sd, up] of [[110, -1, 12], [190, 1, 9], [270, -1, 16], [350, 1, 8], [430, -1, 14], [510, 1, 12], [565, -1, 19], [320, 1, 38], [400, -1, 50], [480, 1, 44], [545, -1, 34]]) jp.push([chaseX(s) + sd * (20 + up * 0.5), HY + bedBase(s) + 4.8 + up, HZ - s]);
    fauna.add(F.makeJellyfish({ rng: rng.fork('jelly'), count: jp.length, positions: jp, radius: 1.5, length: 6, bell: '#e9f3f6', inner: '#e0a244', glow: '#e0a244', glowIntensity: 1.2, drift: [0, 0.04, 0], pulse: 0.35, hueVariety: 0.1 }));
    await ctx.yield();
    // falling platelets like slow snow, and the amphipod haze in the shafts
    const snow = fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', time: SU.uTime, count: Math.round(2400 * det), box: [70, 46, 70], velocity: [0, -0.45, 0], size: [0.05, 0.17], colors: ['#DDF3F6', '#9fe6ee', look.core], intensity: 0.75 });
    scene.add(snow.object);
    await ctx.yield();
    const haze = fx.makeParticles({ rng: rng.fork('haze'), preset: 'plankton', time: SU.uTime, count: Math.round(1500 * det), colors: ['#cfeee6', look.pane, '#ffffff'], intensity: 0.8 });
    scene.add(haze.object);
    await ctx.yield();

    // the rare event: a raft of anchor ice tears loose on the right and floats up, carrying six stars and an urchin
    const raft = new THREE.Group(), raftBase = new THREE.Vector3();
    {
      const body = new THREE.Mesh(raftGeometry(rng.fork('raft')), benMat(0.6)); body.frustumCulled = false; raft.add(body);
      await ctx.yield();
      const rr = xr.fork('raftice'), nR = 20, im = new THREE.InstancedMesh(shardGeo, anchMat, nR);
      const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), sc = new THREE.Vector3();
      for (let i = 0; i < nR; i++) {
        const a = i / nR * TAU + rr.range(-0.2, 0.2), rad = i % 4 === 0 ? rr.range(0, 3) : rr.range(3.6, 6.6), k = rr.range(0.75, 1.3), under = i % 4 === 1;
        ee.set((under ? Math.PI : 0) + rr.range(-0.5, 0.5), rr.range(0, 6.28), rr.range(-0.5, 0.5)); sc.set(k, k * rr.range(0.7, 1.1), k);
        im.setMatrixAt(i, m4.compose(_p.set(Math.cos(a) * rad, under ? -0.4 : 0.3, Math.sin(a) * rad), qq.setFromEuler(ee), sc));
      }
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; raft.add(im);
      // seated 10.5 m right of the route where the camera passes at u 0.82, so it lifts through the right third as we close
      path.pointAt(0.82, raftBase); path.tangentAt(0.82, _f); _f.y = 0; _f.normalize(); raftBase.set(raftBase.x - _f.z * 10.5, 0, raftBase.z + _f.x * 10.5); raftBase.y = bedY(raftBase.x, raftBase.z) + 0.4;
    }
    raft.position.copy(raftBase); raft.visible = rare; scene.add(raft);
    await ctx.yield();

    // ---- 4f camera, gaze, post, update
    const tip = new THREE.Vector3(), poiA = new THREE.Vector3(), poiB = new THREE.Vector3((HX + HUD.x) / 2, HY + 0.5, (HZ + HUD.z) / 2), sp = new THREE.Vector3(), sp2 = new THREE.Vector3(), camP = new THREE.Vector3();
    const pois = [
      { at: (time, u) => { hero.setLength(lenAt(u)); hero.tipPosition(tip); path.pointAt(u, _p2); return poiA.set(HX + tip.x, Math.max(HY + tip.y + 1.5, _p2.y - 9), HZ + tip.z); }, from: 0.02, to: U.td + 0.02, weight: 0.8, fade: 0.12 },
      { at: poiB, from: U.td - 0.05, to: U.ex + 0.035, weight: 0.6, fade: 0.3 },
    ];
    const kd = SU.uKeyDir.value, rd = new THREE.Vector3(), rayHaze = SU.uRayC.value, chaseRayI = 0.2 * ceilI;
    return {
      scene, path, duration: 42, pace, pois, ride: 'none',
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 20, sway: 0.4, bank: 0.5 },
      portal: { shape: 'circle', radius: 7, color: '#6FE6F2', glow: 0.8, tilt: true, revealDistance: 420 },
      post: { exposure: look.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#f1fbff', shadowTint: '#020a18', vignette: 0.36, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        SU.uTime.value = time;
        // how deep the camera is: the lit haze, the far ceiling and the paler fog belong to the chase
        camera.getWorldPosition(camP);
        const deepK = smoothstep(58, 105, -camP.y);
        SU.uDeepK.value = deepK; scene.fog.color.setRGB(fogCol.r + rayHaze.r * 0.4 * deepK, fogCol.g + rayHaze.g * 0.4 * deepK, fogCol.b + rayHaze.b * 0.4 * deepK);
        for (let i = 3; i < rays.length; i++) rays[i].uniforms.uIntensity.value = chaseRayI * (0.2 + 0.8 * deepK);
        SU.uGiant.value = smoothstep(0.30, 0.50, u);
        // the key light wheels 40 degrees through the flight
        const az = az0 + (u - 0.5) * 0.7 + 0.05 * Math.sin(time * 0.11), st = Math.sin(tilt);
        kd.set(-st * Math.cos(az), Math.cos(tilt), st * Math.sin(az) + 0.1).normalize();
        hero.setLight(kd, keyCol);
        rd.copy(kd).negate(); for (const r of rays) r.uniforms.uDir.value.copy(rd);
        hero.setLength(lenAt(u)); hero.setTouch(clamp((u - U.td) / 0.035, 0, 1)); hero.setFront(frontAt(u));
        hero.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
        snow.update(dt, time, camera); haze.update(dt, time, camera);
        for (let i = 0; i < 2; i++) {
          const sh = i * 0.03, m = seals[i];
          sealAt(u, time, sp, sh); sealAt(u + 0.004, time + 0.35, sp2, sh);
          m.position.copy(sp); if (sp2.distanceToSquared(sp) > 1e-6) m.lookAt(sp2);
        }
        const bubOn = u > 0.44 && u < 0.78;
        for (let i = 0; i < NB; i++) {
          const h = (i * 0.618034) % 1, age = (time * 0.5 + h) % 1, k = i * 4;
          sealAt(u - age * 0.012, time - age * 1.2, sp, 0);
          bubP[k] = sp.x + Math.sin(i * 2.4 + time * 1.3) * (0.6 + age * 2.2); bubP[k + 1] = sp.y + 1.5 + age * 9; bubP[k + 2] = sp.z + Math.cos(i * 1.7 + time * 1.1) * (0.6 + age * 2.2);
          bubP[k + 3] = bubOn ? (0.14 + 0.3 * h) * Math.min(age * 6, 1) * (1 - age * age) + 1e-4 : -1;
        }
        bubAttr.needsUpdate = true;
        if (rare) {
          const k = smoothstep(0.66, 0.92, u), lift = k * k * 30, lean = smoothstep(0.66, 0.78, u);   // it leans its deck toward us as it lifts
          raft.position.set(raftBase.x + 3 * Math.sin(time * 0.3) * k, raftBase.y + lift, raftBase.z);
          raft.rotation.set(0.5 * lean + 0.1 * Math.sin(time * 0.5) * k, 0, 0.3 * lean + 0.08 * Math.cos(time * 0.4) * k);
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
