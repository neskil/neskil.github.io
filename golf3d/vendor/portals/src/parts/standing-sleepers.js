// THE STANDING SLEEPERS: hero set piece for the world "standing-sleepers".
//
// What it is
//   A pod of sperm whales asleep, hanging upright in open water like the stones of a henge: thirteen
//   sleepers 11-13 m long and the matriarch at 16 m on a rough ring 60 m across, most head-up, two
//   head-down, plus a 4 m calf, the matriarch's waking eye, her peeling skin sheets and the remoras
//   clamped on every body. Each whale is modelled, not a capsule: flat square brow with the raised
//   S-slit blowhole on the front left corner, narrow underslung bone-white jaw (one hangs open on a
//   row of pegs), paddle flippers, dorsal hump and knuckles, tail keel, notched and nicked flukes.
//   The skin shader adds prune furrows down the flank (also displaced in the mesh), tooth rakes,
//   sucker-ring chains, sloughing patches, white belly blotches, caustics and a gold rim to the sun.
//
// Local space  (== the brief's coordinates: put hero.object at the world origin, unrotated)
//   y = 0 is the SEA SURFACE, the pod hangs below it (negative y), ring centred on x 0, z 0.
//   Fixed seats from the brief: gate pair at (29, 9) head-down and (21.5, 23); matriarch at
//   (-16, 27), nose 8 m down; her neighbour at (-3, 30). The middle of the ring is empty. Two ring seats, south-east
//   and south-west of the portal, stand 25.6 m out with their tops 6.5 m down (the exit guards: see "EXIT GUARDS").
//
// anchors (local space)
//   portalSeat  { position (0,-11,0), normal: unit vector the portal should face (down the last
//               straight of the brief's path), radius 7 }: the empty heart of the ring.
//   flyThrough  the brief's 21 path points with the eye pass tightened (FLY_PATH): every whale axis is >= 6.5 m
//               from this line except the staged matriarch pass, which is 3 m from her skin at the eye.
//   eye         { position, normal, radius 0.32 }: the matriarch's detailed eye (rest pose), on her RIGHT
//               side, which the brief's pass faces; her belly then faces the last of the pass, where the
//               calf settles. Live world position every frame from hero.eyeWorld(target).
//   gate        { a, b, mid }: tops of the two gate whales and the point between them.
//   matriarch   { nose, flukes, axis (x,z), bellyDir, eyeDir }.
//   calfRoute   ordered points of the calf's swim round the matriarch to her belly (the last is where it settles, lying
//               at 40 degrees with its nose on her belly 19 m down). Live position: hero.calfWorld(target).
//   whales      [{ position (pivot), length, headDown, yaw, top, bottom, role }] for all sleepers,
//               for placing shafts, bubbles or anything else against them.
//   viewpoints  { entry, gate, eyePass, henge }: camera positions with composed views.
//
// Progress (never wall-clock in a world)
//   hero.setProgress(u)   the world's path u, 0..1. Drives: the gate T's single fluke flex
//                         (opts.flexAt, default 0.11), the eye opening (opts.eyeAt [0.39, 0.44]),
//                         the matriarch's 8 degree roll (opts.rollAt [0.39, 0.47]) and the calf's
//                         crossing (opts.calfAt [0.42, 0.50]; the world uses [0.405, 0.458]). If it is never called, update() loops
//                         those on wall time for the viewer. hero.setEyeOpen(x|null) overrides the eye.
//   Ambient sleep (bob, slow turn, lean, one fluke flex at a time every 20-40 s, remora wriggle,
//   sheet flutter, caustic crawl) runs on the time passed to update().
//
// opts
//   palette     [gold, silver, water blue, deep blue, ink, charcoal, bone] (the brief's)
//   count       sleepers including the matriarch, 10-16 (default 14);  headDown 0-3 (default 2)
//   calves      1 or 2 (default 1);  remoras true/false;  sheets true/false
//   sunDir      Vector3 TOWARD the sun as seen under water (default 43 degrees off the zenith to
//               the west-south-west);  surfaceY (default 0, local)
//   focus       'ring' (default) | 'matriarch' | 'eye' | 'gate' | 'calf' | 'henge' (from below): only
//               changes the returned center/radius/height so the part viewer can orbit a detail.
//   calfRoute   [[x,y,z], ...] to replace the calf's route (local space)
//   flexAt, eyeAt, rollAt, calfAt, rollSign   timing of the staged moments in path u (see above)
//
// Light (the piece is self-lit by its own shader so depth can drain the gold; it takes scene FOG)
//   hero.setLight({ sunDir, sunColor, key, fill, deepFill, shade, rim, caustics, fadeDepth, catchlight, deep, rake })
//   shade = the scene-linear colour that the world's exposure and grade show as slate (#16324A): the floor of every
//   shadow side, carrying furrows, scars and slough, so no body is crushed to navy by the tone map (see ssLight).
//   rake 0..2 = with deep: a warm flank and gold edge toward the sun on every body, so from below the pod is lit, not cut out.
//   deep 0..1 = the view from far below: the gold drains off the bodies and stays only as a cap on the top 1-2 m of
//   each (heads, or the flukes of the head-down ones), fills fall to slate, so the pod reads as dark standing stones.
//   key = gold sun, strong at 5 m, gone by 30 m; fill = silver from the ceiling; deepFill = slate
//   blue on shadow sides (never black). Expects FogExp2 about 0.012 in the water colour to do the
//   depth work, bloom threshold near 0.95: only the rims on the heads and the eye's catchlight
//   (emissive 5) pass it. Whale albedo stays under 0.35.
//
// Size: the ring is 33 m in radius and the bodies hang from 5.5 to 26.5 m deep (hero.extent). The returned
//   radius 24 / height 14 / center (0,-13,0) only frame the ring for the part viewer.
// Cost: about 140k triangles, 6 draw calls (matriarch 36k, gate pair + calf 3 x 13k in one call, eleven
//   sleepers 11 x 4.6k in one call, remoras 13k, eye 2.9k, skin sheets 1.7k), no lights, no textures,
//   build about 200-300 ms. Everything follows the sleep motion on the CPU (14 matrices a frame).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#F4B860', '#DDE8EC', '#1E6FA8', '#0A3458', '#03121F', '#3B4046', '#E9E4D8'];
const PIVOT = 0.42;            // body station (0 nose .. 1 fluke notch) the whale hangs and leans about
const GIRTH = 0.085;           // arc metres per radian per metre of length, for skin coordinates
const EYE_A = 0.295, EYE_PHI = 2.02;

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float ssH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
vec2 ssH2(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
float ssN(vec2 x){
  vec2 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(ssH(i), ssH(i + vec2(1.0, 0.0)), f.x), mix(ssH(i + vec2(0.0, 1.0)), ssH(i + vec2(1.0, 1.0)), f.x), f.y);
}
float ssF(vec2 p){
  float v = ssN(p)*0.55; p = mat2(0.8, -0.6, 0.6, 0.8)*p*2.07 + 3.1;
  v += ssN(p)*0.28; p = mat2(0.8, -0.6, 0.6, 0.8)*p*2.11 + 5.3;
  return v + ssN(p)*0.17;
}
// long forking furrows: q = (arc metres round the girth, metres along the body). 1 on a groove line.
float ssFurrow(vec2 q, float sd){
  float w = ssN(q*vec2(0.9, 0.8) + sd*7.3) + 0.35*ssN(q*vec2(2.3, 2.9) + sd);
  float n1 = ssN(vec2(q.x*7.5 + w*3.0, q.y*0.42) + sd*3.1);
  return 1.0 - abs(2.0*n1 - 1.0);
}
// broad folds the mesh can carry: 1 in the valley
float ssFold(vec2 q, float sd){
  float w = ssN(q*vec2(0.5, 0.55) + sd*2.9);
  float n = ssN(vec2(q.x*2.4 + w*2.4, q.y*0.33) + sd*5.7);
  return smoothstep(0.5, 0.95, 1.0 - abs(2.0*n - 1.0));
}
float ssFlank(float a, float phi, float part){
  return smoothstep(0.30, 0.40, a)*(1.0 - smoothstep(0.86, 0.97, a))*(1.0 - step(0.5, part))*(1.0 - smoothstep(2.65, 3.05, abs(phi)));
}
`;

const WHALE_VERT = /* glsl */`
attribute vec4 aBody;    // a (0 nose..1 tail), phi (0 dorsal, +-pi ventral), part (0 body 1 jaw 2 flipper 3 fluke 4 teeth), mask
attribute vec4 aInst;    // length m, seed, fluke flex (rad), swim amplitude (rad)
attribute vec4 aInst2;   // jaw open (rad), furrow amount, paleness, depth of the body's top (m, for the gold cap)
uniform float uTime, uDisp;
varying vec3 vWp; varying vec3 vN; varying vec4 vBody; varying vec4 vI; varying vec4 vI2; varying vec2 vQ;
#include <common>
#include <fog_pars_vertex>
${NOISE_GLSL}
void main(){
  float a = aBody.x, L = aInst.x;
  vec3 p = position; vec3 n = normal;
  vQ = vec2(aBody.y*${GIRTH.toFixed(3)}*L, a*L);
  vBody = aBody; vI = aInst; vI2 = aInst2;
  if (uDisp > 0.0) {
    float g = ssFold(vQ, aInst.y);
    p -= n*(uDisp*g*ssFlank(a, aBody.y, aBody.z)*aInst2.y*(1.0 - 0.75*smoothstep(0.58, 0.88, a))/L);
  }
  // the jaw hangs open about its hinge
  if (aBody.z > 0.5 && aBody.z < 1.5 || aBody.z > 3.5) {
    float ja = aInst2.x*(1.0 - smoothstep(0.22, 0.30, a));
    vec2 h = vec2(${(PIVOT - 0.285).toFixed(3)}, -0.062);
    float c = cos(ja), s = sin(ja); vec2 d = p.yz - h;
    p.yz = h + vec2(c*d.x + s*d.y, -s*d.x + c*d.y);
    vec2 nn = n.yz; n.yz = vec2(c*nn.x + s*nn.y, -s*nn.x + c*nn.y);
  }
  // fluke flex and (calf) swimming: a dorso-ventral bend of the tail stock about station 0.62
  float t = clamp((a - 0.62)/0.38, 0.0, 1.0);
  float ang = (aInst.z + aInst.w*sin(uTime*4.4 - a*4.0 + aInst.y*6.0))*t*(0.4 + 0.6*t);
  if (abs(ang) > 0.0001) {
    vec2 h = vec2(${(PIVOT - 0.62).toFixed(3)}, 0.0);
    float c = cos(ang), s = sin(ang); vec2 d = p.yz - h;
    p.yz = h + vec2(c*d.x + s*d.y, -s*d.x + c*d.y);
    vec2 nn = n.yz; n.yz = vec2(c*nn.x + s*nn.y, -s*nn.x + c*nn.y);
  }
  vec4 wp = modelMatrix*instanceMatrix*vec4(p, 1.0);
  vWp = wp.xyz;
  vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;

// light model shared by every material of the piece (whales, eye, sheets, remoras)
const LIGHT_GLSL = /* glsl */`
uniform float uTime, uSurfaceY, uKey, uCaustic, uRim, uFade, uDeep, uRake;
uniform vec3 uSunDir, uSunCol, uFill, uDeepFill, uShade;
float ssTop = -1.0;       // depth (m) of the top of this body; set by the whale shader so the gold can sit on it as a cap
float ssShadeK = 1.0;     // how much of the slate shadow floor this surface takes (the eyeball takes little: it stays dark)
float ssCaustic(vec3 wp){
  vec3 s = uSunDir;
  vec3 t1 = normalize(cross(s, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0)); vec3 t2 = cross(s, t1);
  vec2 p = vec2(dot(wp, t1), dot(wp, t2));
  float tt = uTime*0.5;
  float w = ssN(p*0.45 + vec2(tt*0.6, -tt*0.4));
  float a = ssN(p*1.7 + vec2(w*2.2 + tt, w*1.5 - tt*0.7));
  float b = ssN(p*3.3 - vec2(w*1.4 + tt*1.3, tt*0.9) + 7.7);
  float l1 = 1.0 - abs(2.0*a - 1.0), l2 = 1.0 - abs(2.0*b - 1.0);
  float c = l1*l1*l1*l1*1.25 + l2*l2*l2*l2*l2*l2*0.75;
  return c*(0.75 + 0.25*sin(uTime*2.3 + p.x*1.7));
}
// returns linear colour of a surface with this albedo; N unit, V unit toward the eye
vec3 ssLight(vec3 alb, vec3 N, vec3 V, vec3 wp, float cav){
  float depth = max(uSurfaceY - wp.y, 0.0);
  float kf = exp(-depth/uFade);
  // seen from the deep (uDeep 1) the gold has drained off the bodies: it stays only as a cap on the top 1-2 m
  float cap = ssTop < 0.0 ? 0.0 : exp(-max(depth - ssTop, 0.0)/1.5);
  kf = mix(kf, 0.5*cap, uDeep);
  float ndl = dot(N, uSunDir);
  float wrap = clamp(ndl*0.8 + 0.2, 0.0, 1.0);
  float ca = ssCaustic(wp);
  vec3 key = uSunCol*(uKey*kf*wrap*(0.55 + uCaustic*ca));
  float up = clamp(N.y*0.5 + 0.5, 0.0, 1.0);
  vec3 amb = mix(uDeepFill*(1.0 - 0.6*uDeep), uFill*((0.35 + 0.65*exp(-depth/22.0))*(1.0 - 0.45*uDeep)), up*up);
  float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  vec3 rim = uSunCol*(uRim*kf*fr*fr*fr*smoothstep(-0.25, 0.55, ndl)*(0.5 + ca));
  vec3 sheen = uFill*(0.05*fr*fr*up);
  vec3 gild = uSunCol*(uDeep*cap*cap*uRim*(0.1*wrap + 0.22*fr*fr*smoothstep(-0.4, 0.5, ndl)));
  vec3 slate = vec3(0.0075, 0.03, 0.064)*(uDeep*(0.75 + 0.5*up));        // from the deep a body is a slate silhouette, never black
  vec3 lit = alb*(key + amb)*cav;
  // SHADOW SIDES ARE SLATE, NEVER BLACK. alb*amb alone is 0.01-0.03 scene-linear, which the tone map's toe crushes to
  // navy, so the water's own scattered light is a floor under the lit term: uShade is the scene-linear colour that
  // reaches the screen as the mood's slate (#16324A in the golden hour). Skin detail rides on it (m: 1 on mean
  // charcoal skin, about 0.3 in a furrow, 2-6 on scars, slough and the lid rosette), modelled by a soft fill from the
  // water on the far side from the sun. The red part barely varies with m because red is the channel the toe eats first.
  // A smooth maximum with the lit term, so sunlit skin keeps its gold and nothing is added there.
  float rel = dot(alb, vec3(0.3, 0.5, 0.2))*19.5;
  float det = rel*1.2/(1.0 + 0.2*rel);
  vec3 Fd = normalize(vec3(-uSunDir.x, 0.45, -uSunDir.z));
  float model = 0.3 + 0.75*clamp(dot(N, Fd)*0.5 + 0.5, 0.0, 1.0) + 0.15*up;
  float m = det*model*cav*cav; m = clamp(m*m, 0.3, 7.0);
  vec3 shade = uShade*(vec3(0.98, 0.66, 0.60) + vec3(0.08, 0.34, 0.38)*m);
  float xl = dot(lit, vec3(0.3, 0.5, 0.2))/max(dot(shade, vec3(0.3, 0.5, 0.2)), 1e-4);
  lit += shade*((pow(1.0 + xl*xl*xl, 0.3333) - xl)*(1.0 - uDeep)*ssShadeK);
  // uRake (the henge seen from below): the sun still rakes the pod from one side, so every body keeps a warm flank and a
  // thin gold edge toward the sun over its slate, and reads as a lit, round thing, not as a paper silhouette
  float rk = uRake*exp(-depth/60.0);
  vec3 rake = uSunCol*(rk*(wrap*wrap*(0.5 + 0.55*ca)*(0.06 + 1.5*dot(alb, vec3(0.3, 0.5, 0.2)))*cav + 0.2*fr*fr*smoothstep(-0.1, 0.6, ndl)));
  return lit + rim*(0.4 + 6.0*alb.g) + sheen + gild + slate + rake;
}
`;

const WHALE_FRAG = /* glsl */`
uniform vec3 uChar, uBone, uSlate;
uniform float uBump;
varying vec3 vWp; varying vec3 vN; varying vec4 vBody; varying vec4 vI; varying vec4 vI2; varying vec2 vQ;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
// relief of the skin in metres at skin coordinate q: broad folds, forking furrows and fine wrinkles on the flank,
// slow dimples on the head. g returns (fold, groove, fine) for the colour.
float ssRelief(vec2 q, float sd, float flank, float cFade, float fFade, out vec3 g){
  float groove = smoothstep(0.45, 0.96, ssFurrow(q, sd)); groove *= groove;
  float n2 = ssN(vec2(q.x*11.0 + 2.0*ssN(q*vec2(1.7, 0.4)), q.y*0.6) + sd*1.9);
  float fine = smoothstep(0.35, 0.95, 1.0 - abs(2.0*n2 - 1.0));
  float dimple = ssN(q*2.3 + sd*4.0)*0.5 + ssN(q*6.1 + sd)*0.25;
  float fold = ssFold(q, sd);
  g = vec3(fold, groove, fine);
  return -(fold*0.02 + groove*cFade*0.034 + fine*fFade*0.009)*flank + dimple*0.012*(1.0 - flank)*cFade;
}
// a set of 3-5 parallel tooth rakes per hashed cell, never thinner than 1.5 px
float ssRakes(vec2 q, float cell, float sd, float px){
  vec2 g = q/cell + sd*13.7; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  vec2 h = ssH2(id + 3.3);
  float on = step(0.6, ssH(id*1.7 + 9.1));
  float ang = (h.x - 0.5)*2.6;
  vec2 d = vec2(cos(ang), sin(ang));
  vec2 p = (f - (h - 0.5)*0.2)*cell;
  float u = dot(p, d), v = dot(p, vec2(-d.y, d.x));
  float n = 3.0 + floor(h.y*2.99);
  float sp = 0.045 + 0.03*h.x;
  float len = cell*(0.15 + 0.13*h.y);
  v += (h.x - 0.5)*0.5*u*u/len + ((mod(n, 2.0) < 0.5) ? 0.5*sp : 0.0) + 0.012*sin(u*17.0 + h.y*40.0);
  float hw = 0.0045; float w = max(hw, 0.75*px);
  float li = floor(v/sp + 0.5);
  float vv = abs(fract(v/sp + 0.5) - 0.5)*sp;
  float line = 1.0 - smoothstep(w, w + px + 0.0005, vv);
  line *= min(1.0, hw/w*1.6)*(1.0 - smoothstep(0.3*sp, 0.5*sp, w));
  float ll = len*(0.3 + 0.7*ssH(id + li*7.13));
  float uo = u - (ssH(id*3.1 + li) - 0.5)*len*0.9;
  float env = (1.0 - step(n*sp*0.5, abs(v)))*(1.0 - smoothstep(ll*0.2, ll, abs(uo)));     // each rake its own length, tapering out
  return line*env*on*(0.55 + 0.45*ssH(id*5.3 + li*1.9));
}
// chains of sucker rings
float ssRings(vec2 q, float sd, float px){
  float cell = 0.2; vec2 g = q/cell + sd*5.1; vec2 id = floor(g); vec2 f = (fract(g) - 0.5)*cell;
  vec2 h = ssH2(id + 1.7);
  float r = 0.02 + 0.028*h.x*h.x;
  vec2 fc = f - (ssH2(id*1.9 + 4.4) - 0.5)*0.09;
  float d = abs(length(fc) - r) + 0.012*smoothstep(0.35, 0.8, ssN(fc*40.0 + id));
  float hw = 0.006; float w = max(hw, 0.75*px);
  float ring = (1.0 - smoothstep(w, w + px + 0.0005, d))*min(1.0, hw/w*1.6)*(1.0 - smoothstep(0.02, 0.045, px));
  float chain = 1.0 - smoothstep(0.07, 0.12, abs(ssN(q*vec2(0.8, 0.45) + sd*9.0) - 0.5));
  return ring*chain*step(0.4, h.y);
}
void main(){
  float a = vBody.x, phi = vBody.y, part = vBody.z, sd = vI.y;
  vec2 q = vQ;
  vec2 fw = fwidth(q);
  float px = clamp(max(fw.x, fw.y), 0.0, 4.0);
  float pxg = clamp(max(fw.x, 0.3*fw.y), 0.0, 4.0);
  float isBody = 1.0 - step(0.5, part);
  float flank = ssFlank(a, phi, part)*vI2.y;
  float pale = vI2.z;

  // ---- relief: furrows (two scales) on the flank, slow dimples on the head
  // the fine wrinkles fade before they are thinner than a pixel, the furrows a little later (no moire, no blocks)
  float cFade = 1.0 - smoothstep(0.014, 0.05, pxg), fFade = 1.0 - smoothstep(0.007, 0.02, pxg);
  vec3 rg0, rg1;
  float H = ssRelief(q, sd, flank, cFade, fFade, rg0);
  float fold = rg0.x, groove = rg0.y, fine = rg0.z;
  // slope of the relief by finite differences in skin space (a screen-space dFdx of H steps in 2 x 2 pixel blocks)
  vec2 e = max(fw*1.25, vec2(0.004));
  vec2 gH = vec2(ssRelief(q + vec2(e.x, 0.0), sd, flank, cFade, fFade, rg1) - H, ssRelief(q + vec2(0.0, e.y), sd, flank, cFade, fFade, rg1) - H)/e;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 dpx = dFdx(vWp), dpy = dFdy(vWp);
  vec2 dqx = dFdx(q), dqy = dFdy(q);
  float hx = dot(gH, dqx), hy = dot(gH, dqy);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = (hx*r1 + hy*r2)*sign(det);
  N = normalize(abs(det)*N - uBump*grad + 1e-6*N);

  // ---- colour: charcoal with cloud, sloughing patches, belly blotches, bone jaw, scars
  float cloud = ssF(q*0.6 + sd*11.0);
  vec3 alb = uChar*(0.62 + 0.75*cloud);
  alb = mix(alb, uChar*1.55 + uBone*0.05, pale);
  float sl = ssF(q*vec2(1.5, 1.0) + sd*5.0)*0.8 + ssF(q*vec2(6.5, 5.0) + sd*8.0)*0.2;
  float th = 0.60 - 0.04*pale;
  float aaS = 0.012 + px*1.5;
  float inside = smoothstep(th, th + aaS, sl);
  float edge = smoothstep(th - 0.035 - aaS, th, sl)*(1.0 - smoothstep(th, th + 0.02 + aaS, sl));
  float isSkin = 1.0 - step(2.5, part)*0.6;
  alb = mix(alb, alb*1.35 + uBone*0.03, inside*(0.5 + 0.25*flank)*isSkin);
  alb *= 1.0 - 0.42*edge*isSkin*cFade;
  // belly
  float ventral = smoothstep(2.15, 2.85, abs(phi))*isBody;
  float bl = smoothstep(0.54, 0.58 + px, ssF(q*vec2(1.4, 0.75) + sd*2.3));
  alb = mix(alb, uBone*0.36, bl*ventral*smoothstep(0.34, 0.44, a)*(1.0 - smoothstep(0.66, 0.8, a))*0.75);
  // furrow cavities, a paler crest between them
  alb *= 1.0 - flank*(0.2*fold + 0.46*groove*cFade + 0.22*fine*fFade);
  alb *= 1.0 + flank*0.18*(1.0 - groove)*cFade;
  // scars: pale rakes everywhere (denser on the head), sucker rings low on the head
  float headM = 1.0 - smoothstep(0.30, 0.42, a);
  float rk = ssRakes(q, 1.3, sd, px)*(0.35 + 0.65*headM) + ssRakes(q.yx*vec2(1.0, -1.0) + 3.7, 0.8, sd + 0.37, px)*headM;
  float rg = ssRings(q, sd, px)*headM*smoothstep(1.2, 1.9, abs(phi));
  float scar = clamp(rk*(0.55 + 0.45*headM) + rg, 0.0, 1.0)*step(part, 2.5)*(1.0 - pale*0.7);
  alb = mix(alb, alb*1.35 + uBone*0.06, scar*0.55);
  // jaw: bone white rim, mouth line on the head, pegs
  float jaw = step(0.5, part)*(1.0 - step(1.5, part));
  alb = mix(alb, uBone*(0.2 + 0.1*ssF(q*7.0)), jaw*vBody.w);
  float lip = isBody*(1.0 - smoothstep(0.02, 0.05 + px, abs(abs(phi) - 2.72)))*smoothstep(0.03, 0.06, a)*(1.0 - smoothstep(0.26, 0.29, a));
  alb = mix(alb, uBone*0.3, lip*0.22);
  alb = mix(alb, uBone*0.4, step(3.5, part));
  // flukes and flippers: pale nicked trailing edge
  float fin = step(1.5, part)*(1.0 - step(3.5, part));
  alb = mix(alb, uBone*0.36, fin*smoothstep(0.82, 1.0, vBody.w)*(0.4 + 0.6*ssN(q*14.0 + sd)));
  // the plain eye every whale has: a dark almond in a ring of lid wrinkles
  vec2 ev = (vec2(abs(phi), a) - vec2(${EYE_PHI.toFixed(3)}, ${EYE_A.toFixed(3)}))*vec2(${GIRTH.toFixed(3)}*vI.x, vI.x);
  float er = length(ev*vec2(1.25, 0.8));
  float lid = (1.0 - smoothstep(0.1, 0.24, er))*isBody;
  alb = mix(alb, alb*1.7 + uBone*0.05, (1.0 - smoothstep(0.3, 0.8, er))*isBody*0.85);            // paler, thinner skin round the eye
  alb *= 1.0 - lid*0.35*(0.5 + 0.5*sin(er*150.0))*(1.0 - smoothstep(0.004, 0.02, px));
  alb = mix(alb, vec3(0.006, 0.005, 0.005), (1.0 - smoothstep(0.03, 0.045 + px, er))*isBody);
  // blowhole: a dark S-slit on the front left corner of the brow
  vec2 bv = (vec2(phi, a) - vec2(-0.62, 0.012))*vec2(${GIRTH.toFixed(3)}*vI.x, vI.x);
  float bs = abs(bv.x - 0.05*sin(bv.y*22.0));
  alb *= 1.0 - 0.85*(1.0 - smoothstep(0.012, 0.03 + px, bs))*(1.0 - smoothstep(0.1, 0.14, abs(bv.y)))*isBody;

  float cav = 1.0 - flank*0.35*groove*cFade;
  vec3 V = normalize(cameraPosition - vWp);
  ssTop = vI2.w;
  vec3 col = ssLight(alb, N, V, vWp, cav);
  // wet sheen toward the sun on the skin crests
  vec3 Hh = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
  float sp = dot(N, Hh); sp = clamp(sp, 0.0, 1.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col += uSunCol*(sp*0.35*uKey*exp(-max(uSurfaceY - vWp.y, 0.0)/uFade)*(1.0 - uDeep)*(1.0 - 0.7*groove*flank));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- whale form (unit length, nose +Y)
// Whale space: station a runs 0 (brow) .. 1 (fluke notch) down -Y, y = PIVOT - a; dorsal +Z, belly -Z,
// the whale's left is -X. phi is the angle round the girth: 0 dorsal, +-pi ventral.
const KEYS = [ // a, dorsal half-depth, ventral half-depth, half-width, centre z, squareness
  [0.00, 0.078, 0.060, 0.056, 0.000, 3.6], [0.10, 0.086, 0.064, 0.063, 0.000, 3.3], [0.25, 0.092, 0.072, 0.070, 0.000, 2.8],
  [0.33, 0.092, 0.082, 0.074, 0.000, 2.5], [0.42, 0.092, 0.090, 0.076, 0.000, 2.25], [0.55, 0.080, 0.080, 0.066, 0.004, 2.1],
  [0.66, 0.060, 0.062, 0.046, 0.008, 2.0], [0.78, 0.039, 0.044, 0.025, 0.008, 2.0], [0.88, 0.025, 0.030, 0.013, 0.004, 2.0],
  [0.95, 0.015, 0.017, 0.010, 0.000, 2.0], [1.00, 0.007, 0.007, 0.010, 0.000, 2.0]];
const _P = [0, 0, 0, 0, 0];
function prof(a) {
  a = clamp(a, 0, 1);
  let k = 0; while (k < KEYS.length - 2 && a > KEYS[k + 1][0]) k++;
  const K0 = KEYS[Math.max(0, k - 1)], K1 = KEYS[k], K2 = KEYS[k + 1], K3 = KEYS[Math.min(KEYS.length - 1, k + 2)];
  const h = K2[0] - K1[0], t = (a - K1[0]) / h, t2 = t * t, t3 = t2 * t;
  for (let c = 1; c <= 5; c++) {
    const m1 = (K2[c] - K0[c]) / Math.max(1e-6, K2[0] - K0[0]) * h, m2 = (K3[c] - K1[c]) / Math.max(1e-6, K3[0] - K1[0]) * h;
    _P[c - 1] = (2 * t3 - 3 * t2 + 1) * K1[c] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * K2[c] + (t3 - t2) * m2;
  }
  return _P;
}
const gauss = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));
function humpAt(a) {
  let h = 0.024 * (a < 0.635 ? gauss(a, 0.635, 0.05) : gauss(a, 0.635, 0.028));
  for (let k = 0; k < 5; k++) h += 0.0085 * (1 - k * 0.16) * gauss(a, 0.705 + k * 0.043, 0.011);
  return h + 0.004 * gauss(a, 0.335, 0.03) - 0.004 * gauss(a, 0.30, 0.03);   // the step behind the head
}
// point on the hull. sc scales the section (the bevelled flat brow uses sc < 1).
function surf(a, phi, out, sc = 1) {
  const P = prof(a), s = Math.sin(phi), c = Math.cos(phi), e = 2 / P[4];
  const vent = Math.max(0, -c), dors = Math.max(0, c);
  const headM = 1 - smoothstep(0.26, 0.40, a);
  let x = P[2] * Math.sign(s) * Math.pow(Math.abs(s), e);
  x *= 1 - 0.40 * headM * Math.pow(vent, 1.5);
  let z = (c >= 0 ? P[0] : P[1]) * Math.sign(c) * Math.pow(Math.abs(c), e);
  z += Math.pow(dors, 6) * humpAt(a) - Math.pow(vent, 8) * 0.013 * gauss(a, 0.85, 0.06);
  // the raised blowhole on the front left corner
  const bh = 1 + 0.07 * gauss(phi, -0.62, 0.3) * gauss(a, 0.012, 0.03);
  x *= sc * bh; z = z * sc * bh + P[3];
  // the brow overhangs the jaw; the face is slightly domed
  const ay = a + 0.03 * vent * vent * (1 - smoothstep(0, 0.17, a)) - 0.009 * (1 - sc * sc);
  out[0] = x; out[1] = PIVOT - ay; out[2] = z;
  return out;
}
const _sa = [0, 0, 0], _sb = [0, 0, 0], _sc = [0, 0, 0];
// position and outward normal of the hull at (a, phi), unit whale space
function surfN(a, phi) {
  surf(a, phi, _sa); surf(a + 0.004, phi, _sb); surf(a, phi + 0.02, _sc);
  const p = new THREE.Vector3(_sa[0], _sa[1], _sa[2]);
  const da = new THREE.Vector3(_sb[0] - _sa[0], _sb[1] - _sa[1], _sb[2] - _sa[2]);
  const dp = new THREE.Vector3(_sc[0] - _sa[0], _sc[1] - _sa[1], _sc[2] - _sa[2]);
  const n = new THREE.Vector3().crossVectors(dp, da).normalize();
  if (n.x * p.x + n.z * p.z < 0) n.negate();
  return { p, n, along: da.normalize(), around: dp.normalize() };
}

// Collects closed tubes (rows of rings, columns wrap) into one geometry with smooth normals.
function makeBuilder() {
  const pos = [], nor = [], body = [], idx = [];
  const tmp = [0, 0, 0];
  // async only so a long hull can hand frames back (yielder); without one it runs to the end synchronously
  async function tube(rows, cols, posFn, attrFn, yielder) {
    const base = pos.length / 3, W = cols + 1;
    const P = new Float32Array(rows * W * 3), cen = new Float32Array(rows * 3);
    for (let i = 0; i < rows; i++) {
      if (yielder && i % 4 === 3) await yielder();
      for (let j = 0; j <= cols; j++) {
        posFn(i, (j % cols) / cols, tmp);
        const o = (i * W + j) * 3; P[o] = tmp[0]; P[o + 1] = tmp[1]; P[o + 2] = tmp[2];
        if (j < cols) { cen[i * 3] += tmp[0] / cols; cen[i * 3 + 1] += tmp[1] / cols; cen[i * 3 + 2] += tmp[2] / cols; }
      }
    }
    // does (d/dv) x (d/du) point outward? decide once from the fattest ring
    let flip = 1, best = -1;
    const nv = [0, 0, 0];
    const rawN = (i, j) => {
      const jp = (j + 1) % cols, jm = (j - 1 + cols) % cols, ip = Math.min(rows - 1, i + 1), im = Math.max(0, i - 1);
      const a = (i * W + jp) * 3, b = (i * W + jm) * 3, c = (ip * W + j) * 3, d = (im * W + j) * 3;
      const ax = P[a] - P[b], ay = P[a + 1] - P[b + 1], az = P[a + 2] - P[b + 2];
      const bx = P[c] - P[d], by = P[c + 1] - P[d + 1], bz = P[c + 2] - P[d + 2];
      nv[0] = ay * bz - az * by; nv[1] = az * bx - ax * bz; nv[2] = ax * by - ay * bx;
      return Math.hypot(nv[0], nv[1], nv[2]);
    };
    for (let i = 1; i < rows - 1; i++) {
      const o = (i * W) * 3, r = Math.hypot(P[o] - cen[i * 3], P[o + 1] - cen[i * 3 + 1], P[o + 2] - cen[i * 3 + 2]);
      if (r > best) { best = r; rawN(i, 0); flip = (nv[0] * (P[o] - cen[i * 3]) + nv[1] * (P[o + 1] - cen[i * 3 + 1]) + nv[2] * (P[o + 2] - cen[i * 3 + 2])) >= 0 ? 1 : -1; }
    }
    for (let i = 0; i < rows; i++) {
      if (yielder && i % 6 === 5) await yielder();
      for (let j = 0; j <= cols; j++) {
        const jj = j % cols, o = (i * W + jj) * 3;
        let l = rawN(i, jj);
        let nx = nv[0] * flip, ny = nv[1] * flip, nz = nv[2] * flip;
        if (l < 1e-12) {   // collapsed end ring: point along the axis
          const i2 = i === 0 ? 1 : rows - 2, i3 = i === 0 ? 2 : rows - 3;
          nx = cen[i * 3] - cen[i2 * 3]; ny = cen[i * 3 + 1] - cen[i2 * 3 + 1]; nz = cen[i * 3 + 2] - cen[i2 * 3 + 2];
          l = Math.hypot(nx, ny, nz);
          if (l < 1e-9) { nx = cen[i2 * 3] - cen[i3 * 3]; ny = cen[i2 * 3 + 1] - cen[i3 * 3 + 1]; nz = cen[i2 * 3 + 2] - cen[i3 * 3 + 2]; l = Math.hypot(nx, ny, nz) || 1; }
        }
        pos.push(P[o], P[o + 1], P[o + 2]); nor.push(nx / l, ny / l, nz / l);
        tmp[0] = P[o]; tmp[1] = P[o + 1]; tmp[2] = P[o + 2];
        const at = attrFn(i, j / cols, tmp); body.push(at[0], at[1], at[2], at[3]);
      }
    }
    for (let i = 0; i < rows - 1; i++) {
      if (yielder && i % 24 === 23) await yielder();
      for (let j = 0; j < cols; j++) {
        const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1;
        if (flip > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
      }
    }
  }
  // async for the same reason: each typed-array copy of a 36k-triangle hull is its own step when a yielder is given
  async function build(yielder) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (yielder) await yielder();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    if (yielder) await yielder();
    g.setAttribute('aBody', new THREE.Float32BufferAttribute(body, 4));
    if (yielder) await yielder();
    g.setIndex(idx);
    return g;
  }
  // the same without a yielder, for small pieces built in one go (the tubes above run to the end synchronously then)
  function buildNow() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aBody', new THREE.Float32BufferAttribute(body, 4));
    g.setIndex(idx);
    return g;
  }
  return { tube, build, buildNow, tris: () => idx.length / 3 };
}

// One sperm whale at unit length. o: { sides, rings, teeth, rng }
async function makeWhaleGeometry(o) {
  const B = makeBuilder(), rng = o.rng, sides = o.sides, at = [0, 0, 0, 0], hi = sides >= 48;
  // ---- hull: bevelled flat brow, then even stations to the tail
  const rows = [], NC = Math.max(5, Math.round(o.rings * 0.09));
  for (let k = 0; k <= NC; k++) { const sc = Math.pow(Math.sin((k / NC) * Math.PI / 2), 0.8); rows.push([0.045 * (1 - Math.pow(1 - Math.pow(sc, 4), 0.25)), sc]); }
  for (let k = 1; k <= o.rings; k++) rows.push([0.045 + 0.955 * (k / o.rings), 1]);
  rows.push([1.004, 0.02]);
  await B.tube(rows.length, sides, (i, v, out) => surf(rows[i][0], -Math.PI + v * 2 * Math.PI, out, rows[i][1]),
    (i, v) => { at[0] = rows[i][0]; at[1] = -Math.PI + v * 2 * Math.PI; at[2] = 0; at[3] = 0; return at; }, o.yield);
  if (o.yield) await o.yield();
  // ---- flukes: one lens-sectioned wing, tip to tip, notched and nicked
  const nicks = []; for (let k = 0; k < 7; k++) nicks.push([rng.range(-0.95, 0.95), rng.range(0.015, 0.05), rng.range(0.004, 0.013)]);
  const FW = 0.145, fRows = hi ? 31 : 19, fCols = hi ? 14 : 8;
  const LE = (s) => 0.9 + 0.11 * Math.pow(Math.abs(s), 1.15);
  const TE = (s) => {
    const q = Math.abs(s); let v = 1.01 + 0.034 * Math.sin(Math.PI * Math.pow(q, 0.72)) * (1 - q * q * q) - 0.032 * gauss(s, 0, 0.075);
    for (const n of nicks) v -= n[2] * gauss(s, n[0], n[1]);
    return Math.max(v, LE(s) + 0.0005);
  };
  const fS = (i) => { const t = -1 + (2 * i) / (fRows - 1); return Math.sign(t) * (1 - Math.pow(1 - Math.abs(t), 1.6)); };
  if (o.yield) await o.yield();
  B.tube(fRows, fCols, (i, v, out) => {
    const s = fS(i), w = v * 2 * Math.PI, cp = 0.5 - 0.5 * Math.cos(w);
    const th = 0.0105 * (1 - Math.pow(Math.abs(s), 1.5)) + 0.0012;
    out[0] = s * FW; out[1] = PIVOT - lerp(LE(s), TE(s), cp);
    out[2] = th * Math.sin(w) * (1.25 - 0.6 * cp) + 0.014 * s * s; return out;
  }, (i, v, p) => { at[0] = PIVOT - p[1]; at[1] = p[0] / GIRTH; at[2] = 3; at[3] = 0.5 - 0.5 * Math.cos(v * 2 * Math.PI); return at; });
  // ---- flippers: short paddles held out and a little back
  const pRows = hi ? 11 : 7, pCols = hi ? 10 : 6;
  for (const sg of [-1, 1]) {
    const S = surfN(0.365, sg * 2.12);
    const dir = new THREE.Vector3(sg * 0.74, -0.52, -0.42).normalize();
    const chord = new THREE.Vector3(0, 1, 0).addScaledVector(dir, -dir.y).normalize();
    const thick = new THREE.Vector3().crossVectors(dir, chord).normalize();
    const root = S.p.clone().addScaledVector(S.n, -0.012);
    B.tube(pRows, pCols, (i, v, out) => {
      const u = i / (pRows - 1), w = v * 2 * Math.PI;
      const wd = 0.026 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * Math.pow(u, 0.7)) * 0.985), 0.6) * (0.55 + 0.6 * u) + 0.0004;
      const c = Math.cos(w) * wd - 0.02 * u * u, t = Math.sin(w) * wd * 0.2, l = u * 0.098;
      out[0] = root.x + dir.x * l + chord.x * c + thick.x * t;
      out[1] = root.y + dir.y * l + chord.y * c + thick.y * t;
      out[2] = root.z + dir.z * l + chord.z * c + thick.z * t; return out;
    }, (i, v, p) => { const u = i / (pRows - 1); at[0] = PIVOT - p[1]; at[1] = sg * (2.12 + u * 1.1); at[2] = 2; at[3] = (0.5 - 0.5 * Math.cos(v * 2 * Math.PI)) * u; return at; });
  }
  if (o.yield) await o.yield();
  // ---- jaw: a narrow underslung bar, bone white along its edges
  const jRows = hi ? 22 : 10, jCols = hi ? 10 : 6;
  const jawAt = (u) => {
    const a = lerp(0.062, 0.30, u), hw = lerp(0.0085, 0.025, Math.pow(u, 1.6)), hd = lerp(0.008, 0.017, u);
    const en = Math.pow(Math.sin(Math.min(1, u * 9) * Math.PI / 2), 0.6) * (1 - 0.9 * smoothstep(0.9, 1, u)) + 0.001;
    return [a, hw * en, hd * en, -prof(a)[1] + hd * 0.25];
  };
  B.tube(jRows, jCols, (i, v, out) => {
    const J = jawAt(i / (jRows - 1)), w = v * 2 * Math.PI, c = Math.cos(w), s = Math.sin(w);
    out[0] = J[1] * Math.sign(c) * Math.pow(Math.abs(c), 0.6); out[1] = PIVOT - J[0];
    out[2] = J[3] + J[2] * Math.sign(s) * Math.pow(Math.abs(s), 0.6); return out;
  }, (i, v, p) => {
    const w = v * 2 * Math.PI; at[0] = PIVOT - p[1]; at[1] = (p[0] >= 0 ? 1 : -1) * 3.0; at[2] = 1;
    at[3] = 0.25 + 0.75 * Math.pow(Math.abs(Math.cos(w)), 0.7) * (Math.sin(w) > -0.6 ? 1 : 0.5); return at;
  });
  if (o.yield) await o.yield();
  if (o.teeth) {
    const TR = [0.0042, 0.0036, 0.002, 0.0001], TH = [0, 0.4, 0.8, 1];
    for (let k = 0; k < 18; k++) for (const sg of [-1, 1]) {
      const u = 0.05 + (k / 17) * 0.62, J = jawAt(u).slice(), hgt = 0.011 * (0.8 + 0.4 * rng());
      B.tube(4, 5, (i, v, out) => {
        const w = v * 2 * Math.PI;
        out[0] = sg * J[1] * 0.62 + Math.cos(w) * TR[i]; out[1] = PIVOT - J[0] + Math.sin(w) * TR[i]; out[2] = J[3] + J[2] * 0.8 + TH[i] * hgt; return out;
      }, (i, v, p) => { at[0] = PIVOT - p[1]; at[1] = sg * 3.0; at[2] = 4; at[3] = 1; return at; });
    }
  }
  if (o.yield) await o.yield();
  const g = await B.build(o.yield);
  if (o.yield) await o.yield();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -0.08, 0), 0.75);
  g.boundingBox = new THREE.Box3(new THREE.Vector3(-0.2, -0.62, -0.2), new THREE.Vector3(0.2, 0.45, 0.2));
  return g;
}

// ---------------------------------------------------------------- the matriarch's eye
// Local frame (metres): +Z out of the skin, +Y toward her nose, the lid slit runs along Y.
const EYE_VERT = /* glsl */`
attribute vec3 aEye;     // rho 0 (lid edge) .. 1 (rosette rim), psi, kind (0 lid, 1 eyeball)
uniform float uOpen;
varying vec3 vWp; varying vec3 vN; varying vec3 vE; varying float vFold;
#include <common>
#include <fog_pars_vertex>
float eyeFold(float rho, float psi){
  float rr = pow(rho, 0.8 + 0.45*uOpen);
  float ph = rr*(30.0 + 5.0*sin(psi*2.0 + 0.6)) + 1.6*sin(psi*3.0 + rr*4.0) + 0.9*sin(psi*7.0 + 1.3) + 0.5*sin(psi*13.0 - rr*9.0);
  float lidw = 0.3 + 0.7*abs(sin(psi))*(0.65 + 0.35*sin(psi*4.0 + rr*6.0 + 0.8));
  return sin(ph)*max(1.0 - rho, 0.0)*(0.35 + 0.65*smoothstep(0.0, 0.12, rho))*lidw;
}
vec3 eyeP(float rho, float psi){
  float ax = 0.092, bx = 0.004 + 0.064*uOpen;
  float c = cos(psi), s = sin(psi);
  float rin = ax*bx/sqrt(bx*bx*c*c + ax*ax*s*s);
  float r = mix(rin, 0.32*(1.0 + 0.06*sin(psi*3.0 + 0.7))*(0.86 + 0.2*c*c), pow(rho, 0.85));
  float z = 0.034*pow(max(1.0 - rho, 0.0), 1.6) - 0.022*uOpen*(1.0 - smoothstep(0.0, 0.07, rho));
  z += eyeFold(rho, psi)*0.0105*(0.55 + 0.75*uOpen)*smoothstep(0.0, 0.1, rho);
  vec3 p = vec3(r*s, r*c, z);
  p.z -= p.x*p.x*0.42 + 0.036*smoothstep(0.84, 1.0, rho);
  return p;
}
void main(){
  vec3 p = position; vec3 n = normal; vFold = 0.0;
  if (aEye.z < 0.5) {
    float rho = aEye.x, psi = aEye.y;
    p = eyeP(rho, psi);
    vec3 pr = eyeP(rho + 0.012, psi), pp = eyeP(rho, psi + 0.03);
    n = normalize(cross(pp - p, pr - p) + vec3(0.0, 0.0, 1e-7));
    if (n.z < 0.0) n = -n;
    vFold = eyeFold(rho, psi);
  }
  vE = vec3(aEye.x, aEye.y, aEye.z);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWp = wp.xyz; vN = normalize(mat3(modelMatrix)*n);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const EYE_FRAG = /* glsl */`
uniform vec3 uChar, uBone, uGaze; uniform float uOpen, uCatch;
varying vec3 vWp; varying vec3 vN; varying vec3 vE; varying float vFold;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWp);
  vec3 col;
  if (vE.z < 0.5) {
    float rho = vE.x;
    vec2 q = vec2(rho*0.32*sin(vE.y), rho*0.32*cos(vE.y));
    vec3 alb = uChar*(2.0 + 0.7*ssN(q*9.0 + 4.0)) + uBone*0.05;
    alb *= 0.5 + 0.5*smoothstep(-0.8, -0.3, vFold);            // fold creases
    alb = mix(alb, uBone*0.58, smoothstep(0.1, 0.65, vFold)*0.75*(1.0 - rho*0.5));   // pale fold crests: the ring that reads
    alb *= 0.4 + 0.6*smoothstep(0.0, 0.06, rho);               // dark wet lid edge
    alb = mix(alb, uChar*(0.95 + 1.1*ssN(q*0.55)) + uBone*0.03, smoothstep(0.72, 1.0, rho));
    col = ssLight(alb, N, V, vWp, 1.0);
  } else {
    float c = dot(N, normalize(uGaze));
    float iris = smoothstep(0.52, 0.62, c), pupil = smoothstep(0.88, 0.93, c);
    vec3 brown = vec3(0.075, 0.032, 0.012)*(0.6 + 0.8*ssN(N.xy*40.0 + N.z*17.0));
    vec3 alb = mix(vec3(0.42, 0.44, 0.42), brown, iris);
    alb = mix(alb, vec3(0.004, 0.003, 0.003), pupil);
    ssShadeK = 0.3;
    col = ssLight(alb, N, V, vWp, 1.0);
    vec3 Hf = normalize(V + 0.5*uSunDir + vec3(0.0, 0.28, 0.0));
    float sp = clamp(dot(N, Hf), 0.0, 1.0);
    float s2 = sp*sp; s2 *= s2; s2 *= s2; s2 *= s2;                           // ^16: a spark four or five pixels wide at the pass
    float hot = smoothstep(0.3, 0.8, s2);
    col += uSunCol*(uCatch*hot*smoothstep(0.15, 0.6, uOpen)*(1.0 - 0.5*uDeep)) + uFill*(0.16*s2);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}
`;
function makeEyeGeometry() {
  const NR = 20, NS = 72, pos = [], nor = [], eye = [], idx = [];
  for (let i = 0; i <= NR; i++) for (let j = 0; j <= NS; j++) {
    const rho = Math.pow(i / NR, 1.15), psi = (j / NS) * Math.PI * 2;
    pos.push(EYE_R * rho * Math.sin(psi), EYE_R * rho * Math.cos(psi), 0); nor.push(0, 0, 1); eye.push(rho, psi, 0);
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const base = pos.length / 3, SR = 12, SS = 20, R = 0.074;
  for (let i = 0; i <= SR; i++) for (let j = 0; j <= SS; j++) {
    const th = (i / SR) * Math.PI * 0.6, ph = (j / SS) * Math.PI * 2;
    const x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
    pos.push(x * R, y * R * 1.25, z * R - 0.056); nor.push(x, y, z); eye.push(0, 0, 1);
  }
  for (let i = 0; i < SR; i++) for (let j = 0; j < SS; j++) { const a = base + i * (SS + 1) + j, b = a + 1, c = a + SS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aEye', new THREE.Float32BufferAttribute(eye, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.42);
  return g;
}

// ---------------------------------------------------------------- peeling skin sheets (instanced)
const SHEET_VERT = /* glsl */`
attribute vec4 aSheet;   // length m, width m, phase, curl
uniform float uTime, uInvL;
varying vec3 vWp; varying vec3 vN; varying vec2 vUv2; varying float vPh;
#include <common>
#include <fog_pars_vertex>
void main(){
  float u = position.y, v = position.x;
  float k = aSheet.w*(1.0 + 0.28*sin(uTime*1.3 + aSheet.z) + 0.12*sin(uTime*3.1 + aSheet.z*2.3 + u*3.0))*(0.35 + 0.65*u) + 0.05;
  float ku = k*u;
  float tw = 0.5*sin(uTime*0.9 + aSheet.z*1.7)*u*v;
  vec3 p = vec3(v*aSheet.y*(1.0 - 0.35*u*u), sin(ku)/k*aSheet.x, (1.0 - cos(ku))/k*aSheet.x + 0.004 + tw*aSheet.y);
  vec3 n = vec3(0.0, -sin(ku), cos(ku));
  vUv2 = vec2(v, u); vPh = aSheet.z;
  vec4 wp = modelMatrix*instanceMatrix*vec4(p*uInvL, 1.0);
  vWp = wp.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const SHEET_FRAG = /* glsl */`
uniform vec3 uBone;
varying vec3 vWp; varying vec3 vN; varying vec2 vUv2; varying float vPh;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWp);
  if (dot(N, V) < 0.0) N = -N;
  vec2 c = vec2(vUv2.x*2.0, max(0.0, vUv2.y*1.2 - 0.2));
  float rag = ssN(c*2.6 + vPh*7.0)*0.6 + ssN(c*6.3 + vPh*3.0)*0.4;
  float r = length(c) + (rag - 0.4)*0.75;
  float a = 1.0 - smoothstep(0.55, 0.72, r);
  float thin = smoothstep(0.2, 0.7, r);
  vec3 alb = uBone*(0.1 + 0.1*ssN(vUv2*vec2(7.0, 11.0) + vPh) + 0.12*thin);
  vec3 col = ssLight(alb, N, V, vWp, 1.0);
  float depth = max(uSurfaceY - vWp.y, 0.0);
  col += uSunCol*(0.09*uKey*exp(-depth/uFade)*(0.4 + ssCaustic(vWp)));     // light through the sheet
  gl_FragColor = vec4(col*(0.7 + 0.6*thin), a*(0.62 - 0.2*thin));
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- remoras (instanced)
const REMORA_VERT = /* glsl */`
attribute vec4 aBody;    // t (0 head .. 1 tail), side, fin, 0
attribute vec3 aRem;     // phase, wriggle, tone
uniform float uTime;
varying vec3 vWp; varying vec3 vN; varying vec4 vBody; varying float vTone;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position; float t = aBody.x;
  p.x += aRem.y*t*t*sin(uTime*(2.2 + aRem.x*0.4) + aRem.x*6.0 - t*4.5);
  vBody = aBody; vTone = aRem.z;
  vec4 wp = modelMatrix*instanceMatrix*vec4(p, 1.0);
  vWp = wp.xyz; vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}
`;
const REMORA_FRAG = /* glsl */`
uniform vec3 uChar, uBone;
varying vec3 vWp; varying vec3 vN; varying vec4 vBody; varying float vTone;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWp);
  if (dot(N, V) < 0.0) N = -N;
  float stripe = 1.0 - smoothstep(0.1, 0.3, abs(vBody.y));
  float edge = smoothstep(0.3, 0.42, abs(vBody.y))*(1.0 - smoothstep(0.5, 0.7, abs(vBody.y)));
  vec3 alb = mix(uBone*(0.2 + 0.08*vTone), uChar*0.3, stripe) + uBone*0.2*edge;
  alb = mix(alb, uChar*0.5 + uBone*0.12*vBody.w, vBody.z);
  gl_FragColor = vec4(ssLight(alb, N, V, vWp, 1.0), 1.0);
  #include <fog_fragment>
}
`;
function makeRemoraGeometry() {
  const B = makeBuilder(), at = [0, 0, 0, 0], rows = 11, cols = 7;
  // unit length along Y (head +0.5), sucker side toward -Z (the whale), tail fin in the Y-Z plane
  B.tube(rows, cols, (i, v, out) => {
    const t = i / (rows - 1), w = v * 2 * Math.PI;
    const r = 0.07 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + 0.96 * Math.pow(t, 0.62)) * 0.97), 0.75) * (1 - 0.72 * smoothstep(0.35, 0.82, t)) + 0.001;
    const fin = smoothstep(0.8, 1, t);
    const rx = r * (1 - 0.85 * fin), rz = r * 0.62 * (1 - fin) + fin * (0.03 + 0.085 * (t - 0.8) / 0.2);
    out[0] = Math.cos(w) * rx; out[1] = 0.5 - t - fin * 0.035 * (1 - Math.abs(Math.sin(w))); out[2] = Math.sin(w) * rz + r * 0.25 * (1 - fin) - 0.01 * smoothstep(0.3, 0, t);
    return out;
  }, (i, v) => { const t = i / (rows - 1); at[0] = t; at[1] = Math.sin(v * 2 * Math.PI); at[2] = smoothstep(0.8, 0.9, t); at[3] = Math.abs(Math.sin(v * 2 * Math.PI)); return at; });
  // long low dorsal and anal fins
  for (const sg of [-1, 1]) B.tube(6, 4, (i, v, out) => {
    const t = i / 5, w = v * 2 * Math.PI, h = 0.035 * Math.sin(Math.PI * Math.pow(t, 0.6)) + 0.001;
    out[0] = Math.cos(w) * 0.003; out[1] = 0.0 - t * 0.32; out[2] = sg * (0.03 * (1 - t * 0.6) + h * (0.5 + 0.5 * Math.sin(w))) + 0.012; return out;
  }, (i, v) => { at[0] = 0.5 + (i / 5) * 0.32; at[1] = 1; at[2] = 1; at[3] = 0.5 + 0.5 * Math.sin(v * 2 * Math.PI); return at; });
  const g = B.buildNow();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.7);
  return g;
}

// ---------------------------------------------------------------- the pod
const BRIEF_PATH = [[52, -5, 16], [38, -5.2, 16], [24, -6, 16.3], [8, -7, 17], [-6, -7.6, 17.6], [-13.7, -8.6, 18.3], [-17.1, -10.6, 20.5],
  [-19.1, -12.6, 22.4], [-21.4, -15.5, 24.5], [-22.7, -19, 28.2], [-22.4, -23.5, 32.8], [-17.5, -30.5, 41], [-11, -37.5, 43], [-5, -42.3, 40.5],
  [-1.2, -45.1, 35.5], [0, -46.3, 32.1], [0, -46.1, 27.3], [0, -43.3, 23.6], [0, -32.5, 15.7], [0, -21.8, 7.9], [0, -11, 0]];
// The path the world flies: the brief's, with the crossing of the ring bent up to 2.4 m north so it runs straight at the
// eye pass, and the pass itself pulled about a metre toward the matriarch's axis: the camera faces her eye from 3.3 m,
// 3 m from her skin, at u 0.40-0.41 (she is also turned 28 degrees from the brief's heading so that the eye looks back
// up the incoming path). The layout above still clears the brief's own line; every axis stays >= 6.5 m from this one.
const FLY_PATH = BRIEF_PATH.map((p) => p.slice());
FLY_PATH[3] = [8, -7, 18.3]; FLY_PATH[4] = [-6, -7.7, 19.6]; FLY_PATH[5] = [-12.4, -8.9, 20.4];
FLY_PATH[6] = [-16.2, -10.7, 21.6]; FLY_PATH[7] = [-18.9, -12.6, 23.6]; FLY_PATH[8] = [-20.6, -15.5, 25.6];
const EYE_R = 0.32;            // radius of the matriarch's lid rosette, metres
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const fract = (x) => x - Math.floor(x);
const hash1 = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// horizontal clearance of a vertical whale axis at (x, z), spanning depths d0..d1, from the brief's path
function pathClearance(x, z, d0, d1) {
  let best = 1e9;
  for (let i = 0; i < BRIEF_PATH.length - 1; i++) {
    const A = BRIEF_PATH[i], B = BRIEF_PATH[i + 1];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8, px = lerp(A[0], B[0], t), py = lerp(A[1], B[1], t), pz = lerp(A[2], B[2], t);
      const dy = Math.max(0, d0 - 3 + py, -py - d1 - 3);      // py is negative: depth = -py
      best = Math.min(best, Math.hypot(px - x, pz - z, dy));
    }
  }
  return best;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('standing-sleepers') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const palette = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const C = palette.map((h) => new THREE.Color(h));
  const [cGold, cSilver, , , , cChar, cBone] = C;
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.641, 0.731, 0.232)).normalize();
  const count = Math.round(clamp(opts.count ?? 14, 10, 16)), nDown = Math.round(clamp(opts.headDown ?? 2, 0, 3));
  const flexAt = opts.flexAt ?? 0.11, eyeAt = opts.eyeAt ?? [0.39, 0.44], rollAt = opts.rollAt ?? [0.39, 0.47], calfAt = opts.calfAt ?? [0.42, 0.50];
  const rollSign = opts.rollSign ?? 1;

  // ---- shared light uniforms
  const slate = new THREE.Color('#16324A');
  const shared = {
    uTime: { value: 0 }, uSurfaceY: { value: opts.surfaceY ?? 0 }, uKey: { value: 3.6 }, uCaustic: { value: 1.5 }, uRim: { value: 1.7 }, uFade: { value: 10 }, uDeep: { value: 0 }, uRake: { value: 0 },
    uSunDir: { value: sunDir }, uSunCol: { value: cGold.clone() },
    uFill: { value: cSilver.clone().multiplyScalar(1.15) }, uDeepFill: { value: slate.clone().multiplyScalar(9).add(new THREE.Color(0.1, 0.11, 0.12)) },
    uShade: { value: new THREE.Color(0.0457, 0.0684, 0.1054) },     // scene-linear value shown as #16324A under the golden grade
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const whaleMaterial = (disp) => new THREE.ShaderMaterial({
    uniforms: Object.assign(fogU(), shared, { uDisp: { value: disp }, uBump: { value: 1.6 }, uChar: { value: cChar }, uBone: { value: cBone }, uSlate: { value: slate } }),
    vertexShader: WHALE_VERT, fragmentShader: WHALE_FRAG, fog: true,
  });

  // ---- layout: fixed seats from the brief, the rest round the ring
  const whales = [];
  const addWhale = (w) => {
    const o = Object.assign({
      headDown: false, girth: rng.range(0.95, 1.07), seed: rng.range(1, 90), bobT: rng.range(18, 26), bobPh: rng.range(0, TAU),
      turnAmp: rng.range(0.16, 0.3), turnPh: rng.range(0, TAU), leanA: rng.range(0.03, 0.07), leanW: rng.range(0.07, 0.12), leanPh: rng.range(0, TAU),
      flex: 0, jaw: 0, pale: 0, furrow: 1, swim: 0, lod: 2, role: 'sleeper', matrix: new THREE.Matrix4(),
    }, w);
    o.turnW = rng.range(0.0087, 0.0175) / o.turnAmp;
    o.pivotY = -(o.top + (o.headDown ? 1 - PIVOT : PIVOT) * o.L);
    whales.push(o); return o;
  };
  const gateA = addWhale({ x: 29, z: 9, L: 12, headDown: nDown >= 1, top: nDown >= 1 ? 6 : 7.5, yaw: -Math.PI / 2 + rng.range(-0.2, 0.2), role: 'gateA', lod: 1, turnAmp: 0.06 });
  const gateB = addWhale({ x: 21.5, z: 23, L: 12.5, top: 8, yaw: rng.range(-0.25, 0.25), role: 'gateB', lod: 1, jaw: 0.14, turnAmp: 0.06 });
  const mat = addWhale({ x: -16, z: 27, L: 16, top: 8, yaw: Math.atan2(0.83, -0.56) - 28 * DEG, role: 'matriarch', lod: 0, turnAmp: 0.035, leanA: 0.025, girth: 1.03 });
  addWhale({ x: -3, z: 30, L: rng.range(11.5, 12.5), top: rng.range(8.6, 9.4), yaw: rng.range(0, TAU), role: 'neighbour' });
  const nFill = count - 4, n1 = Math.min(nFill, Math.floor(nFill * 48.7 / 305.4 + 0.2)), n2 = nFill - n1;
  const downPick = []; { const ids = rng.shuffle([...Array(n2).keys()].filter((k) => k > 0 && k < n2 - 1)); for (let k = 0; k < nDown - 1; k++) downPick.push(ids[k]); }
  for (let k = 0; k < nFill; k++) {
    const inGap1 = k < n1, base = inGap1 ? 47 + ((k + 1) / (n1 + 1)) * 48.7 : 120.6 + ((k - n1 + 1) / (n2 + 1)) * 256.7;
    const headDown = !inGap1 && downPick.includes(k - n1), L = rng.range(11, 13), top = headDown ? rng.range(5.5, 7) : rng.range(6.5, 9.5);
    let x = 0, z = 0, r = rng.range(27, 33);
    for (let tries = 0; tries < 14; tries++) {
      const ang = (base + rng.range(-3.5, 3.5)) * DEG;
      x = Math.cos(ang) * r; z = Math.sin(ang) * r;
      if (pathClearance(x, z, top, top + L) > 9) break;
      r = Math.min(36, r + 0.8);
    }
    addWhale({ x, z, L, top, headDown, yaw: rng.range(0, TAU) });
  }
  // EXIT GUARDS. The last straight climbs south at 54 degrees, so by u 0.88 every sleeper on the ring has slid under the
  // bottom of the frame. The ring seat nearest each of two bearings (south-east and south-west of the portal) is
  // therefore moved onto that bearing, 25.6 m out (the ring is 27-33), with its top 6.5 m down: at u 0.88-0.92 those
  // two stand at the left and right edges of the frame, mid-height, either side of the growing portal. No random
  // draw is made here, so everything else about the layout is as it was.
  for (const deg of [331.5, 208.5]) {
    let best = null, bd = 1e9;
    for (let k = 4; k < whales.length; k++) {
      const w = whales[k]; if (w.guard) continue;
      let d = Math.abs(((Math.atan2(w.z, w.x) / DEG - deg + 540) % 360) - 180);
      if (d < bd) { bd = d; best = w; }
    }
    if (!best || bd > 26) continue;
    best.guard = true; best.x = Math.cos(deg * DEG) * 25.6; best.z = Math.sin(deg * DEG) * 25.6;
    if (!best.headDown) best.top = 6.5;
    best.pivotY = -(best.top + (best.headDown ? 1 - PIVOT : PIVOT) * best.L);
  }
  // calves ride in the gate-level mesh
  const calves = [];
  const nCalf = Math.round(clamp(opts.calves ?? 1, 1, 2));
  for (let k = 0; k < nCalf; k++) calves.push({ L: k === 0 ? 4 : 3.4, seed: rng.range(1, 90), girth: 1.08, pale: 1, furrow: 0.22, flex: 0, jaw: 0, swim: 0.1, lod: 1, role: 'calf', matrix: new THREE.Matrix4(), calf: true, headDown: false });

  // ---- geometry: three levels of one whale
  const object = new THREE.Group(); object.name = 'standing-sleepers';
  const lodSpec = [{ sides: detail < 1 ? 88 : 104, rings: detail < 1 ? 128 : 150, teeth: true, disp: 0.055 }, { sides: 56, rings: 84, teeth: true, disp: 0.05 }, { sides: detail < 1 ? 28 : 32, rings: detail < 1 ? 44 : 52, teeth: false, disp: 0 }];
  const lodMeshes = [];
  const all = whales.concat(calves);
  for (let l = 0; l < 3; l++) {
    const list = all.filter((w) => w.lod === l);
    const geo = await makeWhaleGeometry({ sides: lodSpec[l].sides, rings: lodSpec[l].rings, teeth: lodSpec[l].teeth, rng: rng.fork('geo' + l), yield: ctx.yield ? () => ctx.yield() : null });
    const aInst = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 4), 4), aInst2 = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 4), 4);
    aInst.setUsage(THREE.DynamicDrawUsage);
    list.forEach((w, i) => { w.mesh = l; w.index = i; aInst.setXYZW(i, w.L, w.seed, 0, w.swim); aInst2.setXYZW(i, w.jaw, w.furrow, w.pale, w.calf ? -1 : w.top); });
    geo.setAttribute('aInst', aInst); geo.setAttribute('aInst2', aInst2);
    const mesh = new THREE.InstancedMesh(geo, whaleMaterial(lodSpec[l].disp), list.length);
    mesh.frustumCulled = false; mesh.name = 'sleepers-lod' + l;
    object.add(mesh); lodMeshes.push({ mesh, aInst, list });
    await ctx.yield?.();
  }

  // ---- sleep transforms
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  const _vx = new THREE.Vector3(), _vy = new THREE.Vector3(), _vz = new THREE.Vector3(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
  const UP = new THREE.Vector3(0, 1, 0);
  function whaleMatrix(w, time, extraYaw, out) {
    const bob = 0.3 * Math.sin(time * TAU / w.bobT + w.bobPh);
    const yaw = w.yaw + w.turnAmp * Math.sin(time * w.turnW + w.turnPh) + extraYaw;
    const lx = w.leanA * Math.sin(time * w.leanW + w.leanPh), lz = w.leanA * Math.cos(time * w.leanW * 0.83 + w.leanPh * 1.7);
    _e.set(lx + (w.headDown ? Math.PI : 0), yaw, lz, 'YXZ');
    return out.compose(_p.set(w.x, w.pivotY + bob, w.z), _q.setFromEuler(_e), _s.set(w.L * w.girth, w.L, w.L * w.girth));
  }
  const restMatrix = (w) => { _e.set(w.headDown ? Math.PI : 0, w.yaw, 0, 'YXZ'); return new THREE.Matrix4().compose(new THREE.Vector3(w.x, w.pivotY, w.z), new THREE.Quaternion().setFromEuler(_e), new THREE.Vector3(w.L * w.girth, w.L, w.L * w.girth)); };
  // frame on the hull: X round the girth, Y toward the nose (or tail), Z out of the skin; unit whale space
  function hullFrame(a, phi, scale, lift, flip, twist, out) {
    const S = surfN(a, phi);
    _vz.copy(S.n); _vy.copy(S.along).multiplyScalar(flip ? 1 : -1);
    if (twist) _vy.applyAxisAngle(_vz, twist);
    _vx.crossVectors(_vy, _vz).normalize(); _vy.crossVectors(_vz, _vx).normalize();
    out.makeBasis(_vx, _vy, _vz).scale(_s.set(scale, scale, scale)).setPosition(S.p.addScaledVector(S.n, lift));
    return S;
  }

  // ---- the matriarch's own details ride in a group that copies her instance matrix
  const mGroup = new THREE.Group(); mGroup.matrixAutoUpdate = false; object.add(mGroup);
  const eyeUniforms = Object.assign(fogU(), shared, { uOpen: { value: 0 }, uCatch: { value: 5 }, uGaze: { value: new THREE.Vector3(0, 0, 1) }, uChar: { value: cChar }, uBone: { value: cBone } });
  const eyeMesh = new THREE.Mesh(makeEyeGeometry(), new THREE.ShaderMaterial({ uniforms: eyeUniforms, vertexShader: EYE_VERT, fragmentShader: EYE_FRAG, fog: true, side: THREE.DoubleSide }));
  const eyeS = hullFrame(EYE_A, EYE_PHI, 1 / mat.L, 0.006 / mat.L, false, 0, eyeMesh.matrix);
  eyeMesh.matrixAutoUpdate = false; eyeMesh.frustumCulled = false; mGroup.add(eyeMesh);
  const eyeLocal = eyeS.p.clone(), eyeNormalLocal = eyeS.n.clone();

  if (opts.sheets !== false) {
    const nS = Math.round(40 * detail), sg = new THREE.PlaneGeometry(1, 1, 3, 7); sg.translate(0, 0.5, 0);
    const aSheet = new THREE.InstancedBufferAttribute(new Float32Array(nS * 4), 4); sg.setAttribute('aSheet', aSheet);
    const sm = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({
      uniforms: Object.assign(fogU(), shared, { uInvL: { value: 1 / mat.L }, uBone: { value: cBone } }),
      vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }), nS);
    for (let k = 0; k < nS; k++) {
      const a = rng.range(0.36, 0.84), phi = (rng.chance(0.78) ? 1 : -1) * rng.range(0.35, 2.75);
      hullFrame(a, phi, 1, 0.002 / mat.L, rng.chance(0.75), rng.range(-0.7, 0.7), _m); sm.setMatrixAt(k, _m);
      const len = 0.1 + 0.2 * Math.pow(rng(), 1.6); aSheet.setXYZW(k, len, len * rng.range(0.55, 1.0), rng.range(0, TAU), rng.range(1.6, 3.8));
    }
    sm.frustumCulled = false; sm.renderOrder = 2; mGroup.add(sm);
  }
  await ctx.yield?.();

  // ---- remoras: three to five on every sleeper
  const remoras = [];
  let remMesh = null;
  if (opts.remoras !== false) {
    for (const w of whales) {
      const n = detail < 1 ? rng.int(2, 4) : rng.int(3, 5);
      for (let k = 0; k < n; k++) {
        const where = rng(), sgn = rng.sign();
        let a = rng.range(0.14, 0.8), phi = sgn * rng.range(1.1, 2.0);
        if (where > 0.45) phi = sgn * rng.range(2.3, 2.95);
        if (where > 0.8) { a = rng.range(0.1, 0.25); phi = sgn * rng.range(2.35, 2.75); }
        if (w === mat && Math.abs(a - EYE_A) < 0.09 && phi > 1.2) a += 0.18;
        const len = rng.range(0.4, 0.7), flip = rng.chance(0.2), A = new THREE.Matrix4();
        const S = hullFrame(a, phi, len / w.L, 0.012 / w.L, flip, rng.range(-0.3, 0.3), A);
        remoras.push({ w, A, slide: S.along.clone().multiplyScalar((flip ? 1 : -1) * len / w.L), period: rng.range(16, 34), ph: rng(), phase: rng.range(0, TAU), wr: rng.range(0.09, 0.16), tone: rng() });
      }
    }
    const rg = makeRemoraGeometry();
    const aRem = new THREE.InstancedBufferAttribute(new Float32Array(remoras.length * 3), 3);
    remoras.forEach((r, i) => aRem.setXYZ(i, r.phase, r.wr, r.tone)); rg.setAttribute('aRem', aRem);
    remMesh = new THREE.InstancedMesh(rg, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), shared, { uChar: { value: cChar }, uBone: { value: cBone } }), vertexShader: REMORA_VERT, fragmentShader: REMORA_FRAG, fog: true }), remoras.length);
    remMesh.frustumCulled = false; remMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); object.add(remMesh);
  }

  // ---- the calf's route round the matriarch (polar about her axis: angle, radius, depth)
  // It idles behind her (north), comes round her north-west side dipping under the camera's line, and rises nose-first
  // to her belly low on the camera's side: it ends lying at 40 degrees, nose on her belly 19 m down, tail down and to the
  // north, broadside to the camera at u 0.46 (5.5 m away: a third of the frame wide) with her flukes below it.
  const polar = (deg, r, d) => new THREE.Vector3(mat.x + Math.cos(deg * DEG) * r, -d, mat.z + Math.sin(deg * DEG) * r);
  const calfRest = new THREE.Vector3(mat.x - 1.25, -19.98, mat.z + 1.43), calfDir = new THREE.Vector3(0.12, 0.64, -0.76).normalize();
  const calfDefaultRoute = () => [polar(88, 4.2, 19), new THREE.Vector3(mat.x - 1.6, -19.9, mat.z + 6.5), new THREE.Vector3(mat.x - 3.0, -20.9, mat.z + 5.5),
    new THREE.Vector3(mat.x - 2.1, -21.45, mat.z + 4.0), calfRest.clone().addScaledVector(calfDir, -1.6), calfRest.clone()];
  const routePts = opts.calfRoute ? opts.calfRoute.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    : calfDefaultRoute();
  const route = new THREE.CatmullRomCurve3(routePts, false, 'centripetal');
  const neighbour = whales[3];
  function calfMatrix(c, k, time, u, out) {
    let swim = 0.08;
    if (k === 0) {
      const t = smoothstep(calfAt[0], calfAt[1], u), moving = 4 * t * (1 - t);
      route.getPointAt(Math.min(0.999, t), _p); route.getTangentAt(Math.min(0.999, t), _vy);
      const idle = 1 - smoothstep(0, 0.1, t), settled = smoothstep(0.8, 1, t);
      // settled, it rides her bob so its nose stays on her belly, and nuzzles: a nudge along its own length, a slow roll
      _p.y += idle * 0.3 * Math.sin(time * 0.37) + settled * 0.3 * Math.sin(time * TAU / mat.bobT + mat.bobPh);
      _p.addScaledVector(_vy, idle * 0.4 * Math.sin(time * 0.5) + settled * (0.07 * Math.sin(time * 1.1) - 0.05));
      _vz.copy(UP).addScaledVector(_vy, -_vy.y).normalize();
      _vz.applyAxisAngle(_vy, settled * 0.3 * Math.sin(time * 0.31));
      swim = 0.08 + 0.2 * moving;
    } else {
      const ang = time * 0.11 + 2, r = 4.6 + 0.6 * Math.sin(time * 0.23);
      _p.set(neighbour.x + Math.cos(ang) * r, -(15 + 1.5 * Math.sin(time * 0.17)), neighbour.z + Math.sin(ang) * r);
      _vy.set(-Math.sin(ang), 0.1 * Math.cos(time * 0.17), Math.cos(ang)).normalize();
      _vz.copy(UP).addScaledVector(_vy, -_vy.y).normalize(); swim = 0.17;
    }
    _vx.crossVectors(_vy, _vz).normalize();
    out.makeBasis(_vx, _vy, _vz).scale(_s.set(c.L * c.girth, c.L, c.L * c.girth)).setPosition(_p);
    return swim;
  }

  // ---- staged and ambient motion
  let progress = null, eyeOverride = null;
  const flexSeed = rng.range(0, 100), gazeW = new THREE.Vector3(), eyeW = new THREE.Vector3(), eyeNW = new THREE.Vector3();
  function update(dt, time, camera) {
    shared.uTime.value = time;
    const u = progress == null ? fract(time / 50 + 0.3) : progress;
    // one fluke flex at a time
    for (const w of all) w.flex = 0;
    const xs = (u - (flexAt - 0.03)) / 0.08;
    if (xs > 0 && xs < 1) gateA.flex = 0.55 * Math.sin(TAU * xs) * Math.sin(Math.PI * xs);
    else if (Math.abs(u - flexAt) > 0.09 || progress == null) {
      const S = 30, k = Math.floor(time / S), x = (time - k * S - (8 + hash1(k * 3.1 + flexSeed) * (S - 20))) / 6;
      if (x > 0 && x < 1) { const w = whales[Math.floor(hash1(k * 7.7 + flexSeed * 1.3) * whales.length) % whales.length]; if (w !== mat) w.flex = 0.5 * Math.sin(TAU * x) * Math.sin(Math.PI * x); }
    }
    const roll = smoothstep(rollAt[0], rollAt[1], u);
    for (const w of whales) whaleMatrix(w, time, w === mat ? rollSign * 8 * DEG * roll : 0, w.matrix);
    calves.forEach((c, k) => { c.swim = calfMatrix(c, k, time, u, c.matrix); });
    for (const L of lodMeshes) {
      for (const w of L.list) { L.mesh.setMatrixAt(w.index, w.matrix); L.aInst.setZ(w.index, w.flex); L.aInst.setW(w.index, w.swim); }
      L.mesh.instanceMatrix.needsUpdate = true; L.aInst.needsUpdate = true;
    }
    mGroup.matrix.copy(mat.matrix); mGroup.matrixWorldNeedsUpdate = true;
    if (remMesh) {
      for (let i = 0; i < remoras.length; i++) {
        const r = remoras[i], x = fract(time / r.period + r.ph), s = smoothstep(0, 0.07, x) - smoothstep(0.5, 0.57, x);
        _m.copy(r.A); _m.elements[12] += r.slide.x * s; _m.elements[13] += r.slide.y * s; _m.elements[14] += r.slide.z * s;
        remMesh.setMatrixAt(i, _m2.multiplyMatrices(r.w.matrix, _m));
      }
      remMesh.instanceMatrix.needsUpdate = true;
    }
    // the eye opens like an iris and holds the camera
    const open = eyeOverride == null ? smoothstep(eyeAt[0], eyeAt[1], u) : eyeOverride;
    eyeUniforms.uOpen.value = open;
    object.updateMatrixWorld();
    _m.multiplyMatrices(object.matrixWorld, mat.matrix);
    eyeW.copy(eyeLocal).applyMatrix4(_m); eyeNW.copy(eyeNormalLocal).transformDirection(_m);
    if (camera) { gazeW.copy(camera.getWorldPosition(_p)).sub(eyeW).normalize().multiplyScalar(0.75 * open).add(eyeNW).normalize(); } else gazeW.copy(eyeNW);
    eyeUniforms.uGaze.value.copy(gazeW);
  }

  // ---- anchors
  const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const matRest = restMatrix(mat);
  const eyeRest = eyeLocal.clone().applyMatrix4(matRest), eyeDir = eyeNormalLocal.clone().transformDirection(matRest);
  const bellyDir = new THREE.Vector3(0, 0, -1).transformDirection(matRest);
  const topOf = (w) => new THREE.Vector3(w.x, -w.top, w.z), bottomOf = (w) => new THREE.Vector3(w.x, -(w.top + w.L * 1.03), w.z);
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, -11, 0), normal: new THREE.Vector3(0, -10.8, 7.9).normalize(), radius: 7 },
    flyThrough: FLY_PATH.map(v3),
    eye: { position: eyeRest, normal: eyeDir, radius: EYE_R },
    gate: { a: topOf(gateA), b: topOf(gateB), mid: new THREE.Vector3((gateA.x + gateB.x) / 2, -6, (gateA.z + gateB.z) / 2) },
    matriarch: { nose: topOf(mat), flukes: bottomOf(mat), axis: new THREE.Vector2(mat.x, mat.z), bellyDir, eyeDir },
    calfRoute: routePts.map((p) => p.clone()),
    whales: whales.map((w) => ({ position: new THREE.Vector3(w.x, w.pivotY, w.z), length: w.L, headDown: w.headDown, yaw: w.yaw, top: topOf(w), bottom: bottomOf(w), role: w.role })),
    viewpoints: { entry: new THREE.Vector3(52, -5, 16), gate: new THREE.Vector3(25, -6, 16.2), eyePass: new THREE.Vector3(-18.9, -12.6, 23.6), henge: new THREE.Vector3(0, -44, 34) },
  };

  // ---- what the part viewer orbits
  const focus = opts.focus ?? 'ring';
  let center = new THREE.Vector3(0, -13, 0), radius = 24, height = 14;
  if (focus === 'matriarch') { center = new THREE.Vector3(mat.x, -17, mat.z); radius = 4; height = 14; }
  else if (focus === 'eye') { center = eyeRest.clone(); radius = 0.4; height = 2; }
  else if (focus === 'gate') { center = anchors.gate.mid.clone().setY(-10); radius = 7; height = 12; }
  else if (focus === 'henge') { center = new THREE.Vector3(0, -12, 0); radius = 14; height = -70; }
  else if (focus === 'calf') { center = routePts[routePts.length - 1].clone(); radius = 1.5; height = 4; }

  update(0, 0, null);
  return {
    object, radius, height, center, anchors, update,
    dispose() {},
    ground: false, groundY: -60,
    setProgress(u) { progress = u == null ? null : clamp(u, 0, 1); },
    setEyeOpen(x) { eyeOverride = x == null ? null : clamp(x, 0, 1); },
    setLight(o = {}) {
      if (o.sunDir) shared.uSunDir.value.copy(o.sunDir).normalize();
      if (o.sunColor) shared.uSunCol.value.set(o.sunColor);
      if (o.fill) shared.uFill.value.set(o.fill);
      if (o.deepFill) shared.uDeepFill.value.set(o.deepFill);
      if (o.shade) shared.uShade.value.set(o.shade);
      if (o.key != null) shared.uKey.value = o.key;
      if (o.rim != null) shared.uRim.value = o.rim;
      if (o.caustics != null) shared.uCaustic.value = o.caustics;
      if (o.fadeDepth != null) shared.uFade.value = Math.max(0.5, o.fadeDepth);
      if (o.surfaceY != null) shared.uSurfaceY.value = o.surfaceY;
      if (o.catchlight != null) eyeUniforms.uCatch.value = o.catchlight;
      if (o.deep != null) shared.uDeep.value = clamp(o.deep, 0, 1);
      if (o.rake != null) shared.uRake.value = clamp(o.rake, 0, 2);
    },
    eyeWorld(target = new THREE.Vector3()) { return target.copy(eyeW); },
    calfWorld(target = new THREE.Vector3()) { return target.setFromMatrixPosition(calves[0].matrix).applyMatrix4(object.matrixWorld); },
    uniforms: shared,
    extent: { radius: 36, top: -5.5, bottom: -26.5 },
    sleepers: whales, calves,
  };
}
