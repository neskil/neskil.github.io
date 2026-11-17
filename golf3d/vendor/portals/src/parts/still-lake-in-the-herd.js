// HERO SET PIECE for "still-lake-in-the-herd": the sperm whale, one maker for all of them.
//
// WHAT IT IS
//   whaleGeometry() lofts a true sperm whale in unit length (snout at +Z 0.5, fluke notch at -Z 0.5): the great
//   square head a third of the body long with its recessed lower front, the narrow pale under-slung jaw, the eye
//   low behind the mouth corner, paddle flippers, the low hump two thirds back with the knuckles behind it, the
//   deep narrow tail stock and broad notched flukes. Six levels of detail come from the same profile (hi, near, mid,
//   low, rank, far).
//   makeWhaleKit() owns the shared uniform block, the skin texture (pale scars, creases behind the head,
//   mottling), the GLSL every piece of the herd shares (where a whale is at a time, the light under water,
//   refraction through the flat surface, caustics) and the factories the world uses:
//     kit.herd(list, lod)      instanced whales that swim round the lake on the GPU (rings, loungers, the deep)
//     kit.actors(n, shape, withWash)  a few whales placed by hand each frame (the named pair, the newborn, the
//                              nosing calves, the sounding bull, the leaping whales), with their white water if asked
//     kit.spouts(list, far)    the blows: spray thrown forward and to the left from each whale as it comes up
//                              (far = true: the far whales' short bright plumes)
//     kit.puffs(n, per)        blows and splashes started by hand (for the actors), 'per' drops to each
//     kit.shade(list)          each whale's shade in the water under it
//     kit.pool(n, lod)         places for whales of the herd drawn in the full make while they are near the route
//     kit.wash(list, lite)     the white water, the dark waterline and the back's image round whales at the surface
//                              (lite = true: a coarser sheet, for the many whales of the ranks)
//   buildHero() alone shows the cow and her calf side by side in the air with the cow blowing.
//
// LOCAL SPACE of a whale: +Z forward, +Y up, +X is the whale's LEFT (the blowhole is on that side).
// LIGHT: own ShaderMaterials, lit by the shared uniforms (sun, sky, bounce, fog), no three.js lights.
import * as THREE from 'three';

const TAU = Math.PI * 2;
// OUT OF SIGHT, ONE RULE: no point of a whale is drawn at or under its OUT-OF-SIGHT DEPTH, and over the last third of
// the way down to that depth it thins away point by point (WHALE_FRAG). That depth is FLOOR for every whale of the
// herd: the lake's floor of blue lies there (the world sets its sheet at it). A whale placed by hand (kit.actors)
// may be given another (o.hide): OPEN_HIDE where the open sea has taken it, and FLOOR and a metre more for the
// great bull, which is played in the lake. The world starts a leap and puts it away with the whole of
// the whale under its own depth, so it
// neither comes into being nor goes at one moment. A whale placed by hand is not worked at all once its middle
// is GONE metres under the floor (a length and a half of the longest whale): there the world keeps the ones it is
// not playing.
export const FLOOR = 75, GONE = 30, OPEN_HIDE = 26;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ shared GLSL
// Where the lake is, where a whale of the herd is at time t, and what it does there.
export const GLSL_HERD = /* glsl */`
#ifndef SL_HERD
#define SL_HERD
uniform float uTime;
uniform vec4 uLake;
uniform vec4 uShape;
uniform vec4 uBoat;
uniform vec4 uLane;
uniform vec4 uRanks;
#ifndef SL_PHASE
#define SL_PHASE
uniform vec4 uPhase;
#endif
float lakeShape(float th){ return 1. + uShape.x*cos(2.*th + uShape.y) + uShape.z*cos(3.*th + uShape.w); }
float lakeShapeD(float th){ return -2.*uShape.x*sin(2.*th + uShape.y) - 3.*uShape.z*sin(3.*th + uShape.w); }
// distance from the lake's centre in lake radii (1 on its edge)
float lakeRho(vec2 p){ vec2 d = p - uLake.xy + vec2(1e-3, 0.); return length(d)/(uLake.z*lakeShape(atan(d.y, d.x))); }
// 1 on the lane of smooth water that leaves the lake toward the gate, 0 elsewhere
float laneAt(vec2 p, float pad){
  vec2 d = p - uLake.xy; float al = dot(d, uLane.xy), la = abs(d.x*uLane.y - d.y*uLane.x);
  return uLane.w*smoothstep(0., uLake.z*0.6, al)*(1. - smoothstep(uLane.z + pad, uLane.z + pad + 8., la));
}
// HOW ROUGH THE SEA IS at a place: 0 on the lake, 1 in the open. It grows rank by rank over the four innermost
// ranks (uRanks.x = the innermost rank's distance from the heart in lake radii, uRanks.y = the ranks' spacing). The
// lane between its two ranks of bulls is somewhat smoother than the sea beside it where it leaves the lake, and as
// rough as the open sea by the fourth rank: the way out roughens rank by rank. rho may come warped (the edge is no line).
float roughOf(float rho, float lane){ float r0 = smoothstep(-0.9, 3.6, (rho - uRanks.x)/max(uRanks.y, 1e-3)); return r0*(1. - 0.3*lane*(1. - r0)); }
float roughAt(vec2 p){ return roughOf(lakeRho(p), laneAt(p, 0.)); }
// how clear the water is to look into: 1 on the lake, less at the innermost rank, gone by the second
float calmOf(float rough){ return 1. - smoothstep(0., 0.42, rough); }
float calmAt(vec2 p){ return calmOf(roughAt(p)); }
struct Whale { vec3 pos; vec2 fwd; float pitch; float roll; float phi; float speed; float flukeUp; float arch; };
// THE ROLL THROUGH THE SURFACE, one round of it per period: the whale comes up head first and blows (it surges as it
// breaks the surface), lies awash, then rolls forward and goes under; one that sounds goes deep. x = the height of
// its axis at phase phi, y = the slope of its way there (so a body can be laid along the way it swims).
vec2 rollAt(float phi, vec4 B, float sound, float speed){
  float s = sin(phi), c = cos(phi);
  // (under for the third of its round in which sin(phi) is below -0.35; at the surface for the rest)
  float dv = clamp((-s - 0.35)/0.6, 0., 1.), k = 1.6 + 2.6*sound;
  float su = exp(-(1. - cos(phi - 0.45))*5.);
  float y = B.z + B.w*(1. - k*dv*dv*(3. - 2.*dv) + 0.4*su);
  float ddv = (dv > 0. && dv < 1.) ? -c/0.6 : 0.;
  float dy = B.w*(-k*6.*dv*(1. - dv)*ddv - 0.4*su*5.*sin(phi - 0.45))*6.2831853/max(B.y, 1.);
  return vec2(y, atan(dy, max(speed, 1.3)));
}
// A = ring radius (lake radii are folded in by the shape), start angle, angular speed, length
// B = phase 0..1, period s, height of the body axis, depth of the dive (axis at B.z + B.w lying at the surface)
// C = roll amplitude, swim strength, how far it sounds 0..1 (those throw their flukes), seed
// D = yaw offset, yaw wander, pitch offset, roll offset
// G = arc centre, arc half width (rad): a whale with an arc swims it over and over, going under at its far end
//     and coming up again at its near end (half width over 3.1: the whole round, no arc)
Whale whaleAt(vec4 A, vec4 B, vec4 C, vec4 D, vec4 G, vec4 KR, vec4 KQ, float t){
  Whale w;
  float th = A.y + A.z*t, ends = 0.;
  if (G.y < 3.1){ float x = mod(th + G.y, 2.*G.y) - G.y; th = G.x + x; ends = smoothstep(0.84, 0.96, abs(x)/G.y); }
  float sh = lakeShape(th), shd = lakeShapeD(th);
  vec2 e = vec2(cos(th), sin(th)), q = vec2(-e.y, e.x);
  float R = A.x*sh;
  vec2 tn = normalize(shd*e + sh*q)*(A.z < 0. ? -1. : 1.);
  float yo = D.x + D.y*sin(t*0.07 + C.w*6.2831853);
  float cy = cos(yo), sy = sin(yo);
  w.fwd = vec2(tn.x*cy - tn.y*sy, tn.x*sy + tn.y*cy);
  w.speed = abs(A.z)*R;
  w.phi = 6.2831853*(t/max(B.y, 1.) + B.x);
  float s = sin(w.phi), c = cos(w.phi);
  vec2 p = uLake.xy + R*e;
  // the body lies along its own way: its head is ahead of its middle in the round and its tail behind
  float lag = 0.5*min(A.w/max(w.speed, 1.3)*6.2831853/max(B.y, 1.), 1.8);
  vec2 rm = rollAt(w.phi, B, C.z, w.speed), rh = rollAt(w.phi + lag, B, C.z, w.speed), rt = rollAt(w.phi - lag, B, C.z, w.speed);
  float y = rm.x, lo = -0.3 - 0.5*C.z, live = min(1., 0.2 + w.speed*0.5);
  float pm = clamp(rm.y, lo, 0.32)*live, am = (clamp(rt.y, lo, 0.32) - clamp(rh.y, lo, 0.32))*live;
  float dv = clamp((-s - 0.35)/0.6, 0., 1.);
  float fl = C.z*smoothstep(0.02, 0.3, dv)*(1. - smoothstep(0.5, 0.95, dv))*step(c, 0.);
  // A WHALE THE WORLD KEEPS (KR.x = 1: a whale of the rounds whose place lies in the lane of deep water along the
  // route's line or in its easing; see the part's WAY block and the world's header) takes the height of its axis,
  // its pitch, the arch of its back and the lift of its flukes out of what the world has written for this frame
  // (KR.y, KR.z, KR.w, KQ.x): a function of the whale's own place and its own clock. Its place on its round, its
  // heading and its roll stay its own. At the edge of the lane's reach what the world writes is what the whale's
  // own clock gives.
  float kept = step(0.5, KR.x);
  y = mix(y, KR.y, kept); pm = mix(pm, KR.z, kept); am = mix(am, KR.w, kept); fl = mix(fl, KQ.x, kept);
  // (NOTHING HERE READS THE BOAT. The lane of deep water along the route's line is the world's, by the whale's own
  // place: the whales of the rounds through KR above, and a whale that keeps a place whose body reaches into that
  // lane was put under it once, at the build.)
  // UNDER THE LANE OF SMOOTH WATER a whale of the rounds goes deep: a length and a half of its own under the eye of a man standing
  // in a boat there, beginning its dive 2.2 of its lengths outside the
  // lane's smooth water and coming up as far beyond it; head down going under, head up coming out
  vec2 dl = p - uLake.xy; float lal = dot(dl, uLane.xy), lla = dl.x*uLane.y - dl.y*uLane.x;
  float lk = uLane.w*smoothstep(0., uLake.z*0.6, lal)*(1. - smoothstep(uLane.z + 2., uLane.z + 2. + 2.2*A.w, abs(lla)))*smoothstep(1., 1.05, R/uLake.z/sh)*step(1e-7, abs(A.z));
  float toLane = -sign(lla)*(w.fwd.x*uLane.y - w.fwd.y*uLane.x);
  // (G.z: one that keeps its place lying along the lane's edge does neither)
  float dk = max(ends, lk)*(1. - G.z); lk *= 1. - G.z;
  y = mix(y, min(y, -1.3 - 0.11*A.w - 3.5*ends), dk) - max(1.5*A.w - 3., 0.)*lk*lk*(3. - 2.*lk);
  w.pos = vec3(p.x, y, p.y);
  w.pitch = pm*(1. - dk) - 0.25*dk*(1. - dk)*4.*mix(1., 2.*toLane, step(0.001, lk)) + D.z;
  // (G.w: the set of its back as it lies: head and tail a little down, the hump the highest of it)
  w.arch = am*(1. - dk) + G.w;
  w.roll = C.x*sin(w.phi*0.31 + C.w*40.) + D.w;
  // the flukes come clear only as the body tips down into its dive
  w.flukeUp = fl*(1. - dk);
  return w;
}
// the same for a whale placed by hand: A = x, z, yaw, length; B = y, pitch, roll, tail phase;
// C = fluke lift, swim strength, speed (for its wash), arch of the back (radians between head and tail)
Whale whaleDirect(vec4 A, vec4 B, vec4 C){
  Whale w; w.pos = vec3(A.x, B.x, A.y); w.fwd = vec2(sin(A.z), cos(A.z)); w.pitch = B.y; w.roll = B.z; w.phi = B.w; w.speed = C.z; w.flukeUp = C.x; w.arch = C.w;
  return w;
}
// unit-length local point p of a whale -> world. THE SPINE BENDS: the back arches by w.arch (head and tail down, the
// middle up), a slow wave runs down it as it swims (the stock pumps, the head nods the other way), the stock lifts
// for a dive, and the flukes' tips trail the stock. Each section of the body is turned to stand square on the spine.
// flex.x = tail weight, flex.y = its slope along z
vec3 whalePlace(Whale w, float len, vec3 p, vec2 flex, float tailPh, float swim, inout vec3 n){
  float z = p.z, hz = max(z - 0.12, 0.);
  float wave = sin(tailPh + z*5.5), wavd = 5.5*cos(tailPh + z*5.5), nod = sin(tailPh - 2.75);
  float yb = swim*(flex.x*wave - 2.1*hz*hz*nod) + w.flukeUp*0.16*flex.x - 0.5*w.arch*(z*z - 0.0833);
  float slope = swim*(flex.y*wave + flex.x*wavd - 4.2*hz*nod) + w.flukeUp*0.16*flex.y - w.arch*z;
  float tip = clamp((abs(p.x) - 0.03)/0.14, 0., 1.)*step(z, -0.36);
  yb -= tip*tip*(1.3*swim*cos(tailPh + z*5.5) + 0.03*w.flukeUp);
  float ic = inversesqrt(1. + slope*slope), ys = p.y;
  p.y = yb + ys*ic; p.z = z - ys*slope*ic;
  n = normalize(vec3(n.x, n.y*ic + n.z*slope*ic, n.z*ic - n.y*slope*ic) + vec3(0., 1e-5, 0.));
  float cp = cos(w.pitch), sp = sin(w.pitch);
  vec3 fwd = vec3(w.fwd.x*cp, sp, w.fwd.y*cp), up = vec3(-w.fwd.x*sp, cp, -w.fwd.y*sp), side = cross(up, fwd);
  float cr = cos(w.roll), sr = sin(w.roll);
  vec3 s2 = side*cr + up*sr, u2 = up*cr - side*sr;
  n = s2*n.x + u2*n.y + fwd*n.z;
  return w.pos + (s2*p.x + u2*p.y + fwd*p.z)*len;
}
#endif
`;

// Seeing into the water from above: Snell at a flat surface (y = 0). xyz = where the point appears, w = metres of
// water the line of sight crosses. Points above the surface come back unchanged.
export const GLSL_REFRACT = /* glsl */`
#ifndef SL_REFRACT
#define SL_REFRACT
vec4 seenThroughWater(vec3 wp, vec3 eye){
  float d = -wp.y;
  if (d <= 0.) return vec4(wp, 0.);
  float h = max(eye.y, 0.25), D = length(wp.xz - eye.xz), D2 = D*D;
  float q = 1.33*h/(d + 1.33*h);
  for (int i = 0; i < 5; i++){
    float a2 = D2*q*q + h*h, b = 1. - q, b2 = D2*b*b + d*d;
    float f = q*inversesqrt(a2) - 1.33*b*inversesqrt(b2);
    float fp = h*h*inversesqrt(a2)/a2 + 1.33*d*d*inversesqrt(b2)/b2;
    q = clamp(q - f/max(fp, 1e-7), 0.02, 1.);
  }
  float b = 1. - q;
  return vec4(wp.x, -h*b/q, wp.z, sqrt(D2*b*b + d*d));
}
#endif
`;

// The water as a body of colour, and the light that plays under it.
export const GLSL_WATER = /* glsl */`
#ifndef SL_WATER
#define SL_WATER
uniform vec3 uTurq, uCobalt, uSeaDeep, uSeaFire;
uniform vec2 uClear;
#ifndef SL_PHASE
#define SL_PHASE
uniform vec4 uPhase;
#endif
// the colour the water itself adds: on the lake turquoise going to cobalt with the length looked through; in the
// open sea a clear green-blue under the surface going to deep blue over some ten metres
vec3 waterBody(float depth, float path, float calm){
  vec3 open = mix(mix(uSeaDeep, uTurq, 0.3), mix(uSeaDeep, uCobalt, 0.6)*0.9, 1. - exp(-max(depth, 0.)*0.12));
  return mix(open, mix(uTurq*0.8, uCobalt*0.9, 1. - exp(-max(path, 0.)*0.07)), calm);
}
vec3 throughWater(vec3 col, float depth, float path, float calm){
  float k = mix(uClear.y, uClear.x, calm);
  vec3 T = exp(-k*(max(path, 0.) + 0.4*max(depth, 0.))*vec3(2.2, 0.9, 0.55));
  return col*T + waterBody(depth, path, calm)*(1. - T.g)*mix(0.9, mix(0.5, 0.95, smoothstep(3., 20., depth)), calm);
}
float caustic(vec2 p, float t0){
  float t = t0 + uPhase.x;
  vec2 q = p*0.42;
  q += 0.55*vec2(sin(q.y*1.7 + t*0.62), sin(q.x*1.5 - t*0.53));
  q += 0.28*vec2(sin(q.y*3.1 - t*0.81), sin(q.x*2.7 + t*0.74));
  float a = abs(sin(q.x*1.9 + 1.3*sin(q.y*1.3 + t*0.37)));
  float b = abs(sin(q.y*2.1 + 1.3*sin(q.x*1.1 - t*0.29)));
  float l = 1. - min(a, b);
  return l*l*l*l*(0.55 + 0.45*l*l);
}
#endif
`;

// WHAT THE WATER SHOWS WHERE NOTHING SWIMS (the world's floor of blue is drawn with it, and a whale under water
// fades into it). On the lake cobalt straight down and turquoise at a glance; outside a clear deep blue straight
// down and a greener blue at a glance. THE BED shelves from every island's shore (two metres deep at the shore,
// sixty at the shelf's edge, uShoal.y metres out, and beyond): where it is shallow its pale sand is seen through the
// water, green-blue and then blue with the depth, the sun's net moving on it. (Needs uLake and GLSL_WATER.)
export const GLSL_DEEP = /* glsl */`
#ifndef SL_DEEP
#define SL_DEEP
uniform sampler2D tShoal; uniform vec2 uShoal;
float bedDepth(vec2 p){ float s = texture2D(tShoal, clamp((p - uLake.xy)*uShoal.x + 0.5, 0., 1.)).r; return 2. + 58.*s*sqrt(max(s, 0.)); }
vec3 bedLight(float D){ return vec3(0.86, 0.82, 0.66)*exp(-uClear.y*1.8*D*vec3(2.2, 0.9, 0.55)); }
vec3 deepColor(float steep, float calm){
  vec3 outC = mix(mix(uSeaDeep, uTurq, 0.5), mix(uSeaDeep, uTurq, 0.2), smoothstep(0.15, 0.7, steep));
  return mix(outC, mix(uTurq*0.9, uCobalt*0.8, smoothstep(0.1, 0.6, steep)), calm);
}
// what lies behind a point of the water seen along the sight V (pointing from the eye): the floor of blue's colour
vec3 deepSeen(vec3 eye, vec3 V, float calm, float t, float lit){
  float steep = clamp(-V.y, 0.02, 1.);
  vec2 s = eye.xz + V.xz*(max(eye.y, 0.)/steep);
  float D = bedDepth(s); vec3 bl = bedLight(D)*(0.75 + 0.7*caustic(s*0.6, t));
  return (deepColor(steep, calm)*(1. - exp(-uClear.y*1.6*D)) + bl)*lit;
}
#endif
`;

// ------------------------------------------------------------------------------------------------ the whale's shape
// Hermite interpolation through a table of [s, value] rows (Catmull-Rom tangents on uneven s).
function tableFn(S, V) {
  const n = S.length, M = new Array(n);
  for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); M[i] = (V[b] - V[a]) / (S[b] - S[a]); }
  return (s) => {
    if (s <= S[0]) return V[0]; if (s >= S[n - 1]) return V[n - 1];
    let i = 0; while (s > S[i + 1]) i++;
    const h = S[i + 1] - S[i], t = (s - S[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * V[i] + (t3 - 2 * t2 + t) * h * M[i] + (-2 * t3 + 3 * t2) * V[i + 1] + (t3 - t2) * h * M[i + 1];
  };
}
// THE SPERM WHALE in unit length (s = 0 at the front of the head, 1 at the notch of the flukes). Measures, as shares
// of its length: the head a blunt box 0.32 long, 0.20 deep and 0.15 across its top, squared at the front and narrowing
// downward to the jaw; a shallow nape behind it; the body 0.18 deep and 0.165 across at the flippers (0.40); the low
// hump at 0.665 (0.032 high, a long slope before it and a short one behind) and five knuckles from 0.735 to 0.868;
// a hard taper to a tail stock 0.055 deep and 0.028 across at 0.89; flukes 0.34 across; the jaw 0.215 long.
const PS = [0.00, 0.03, 0.08, 0.15, 0.22, 0.28, 0.33, 0.37, 0.44, 0.52, 0.60, 0.66, 0.72, 0.80, 0.87, 0.93, 0.965, 1.0];
const TOP = tableFn(PS, [0.094, 0.099, 0.101, 0.102, 0.102, 0.101, 0.093, 0.089, 0.092, 0.090, 0.082, 0.073, 0.061, 0.043, 0.030, 0.021, 0.014, 0.008]);
const BOT = tableFn(PS, [0.078, 0.088, 0.094, 0.097, 0.098, 0.097, 0.094, 0.091, 0.090, 0.086, 0.079, 0.070, 0.058, 0.041, 0.029, 0.020, 0.013, 0.007]);
const WID = tableFn(PS, [0.060, 0.065, 0.069, 0.072, 0.075, 0.077, 0.078, 0.080, 0.083, 0.078, 0.066, 0.055, 0.043, 0.026, 0.015, 0.009, 0.006, 0.004]);
const EXP = tableFn(PS, [2.9, 3.0, 3.1, 3.1, 3.0, 2.9, 2.7, 2.5, 2.3, 2.2, 2.2, 2.2, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0]);
const KEEL = tableFn(PS, [0.46, 0.5, 0.54, 0.55, 0.5, 0.42, 0.32, 0.24, 0.14, 0.1, 0.08, 0.08, 0.1, 0.12, 0.1, 0.05, 0, 0]);
const KNUCKLES = [0.735, 0.772, 0.806, 0.838, 0.868];
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
const tailW = (s) => { const t = clamp((s - 0.4) / 0.6, 0, 1); return t * t; };
const tailWd = (s) => (s > 0.4 && s < 1 ? -2 * (s - 0.4) / 0.36 : 0);
const humpAt = (s) => { const d = s - 0.665; return 0.032 * Math.exp(-((d / (d < 0 ? 0.06 : 0.03)) ** 2)); };

// surface point of the body at station s (0 snout .. 1 tail) and girth angle a (0 = belly line, PI = ridge)
function bodyPoint(s, a, plump, out) {
  // (the brow: blunt but round. The front of the head is rounded off over the first six hundredths of the length,
  // and no section of the head is a box: its corners are a third of its breadth in radius)
  const nose = Math.pow(1 - Math.pow(1 - Math.min(s / 0.06, 1), 2.5), 1 / 2.5);
  const tail = s > 0.965 ? Math.sqrt(Math.max(0, 1 - ((s - 0.965) / 0.03) ** 2)) : 1;
  const k = nose * tail, n = EXP(s), e = 2 / n;
  const top = TOP(s) * k, bot = BOT(s) * k, w = WID(s) * k * plump;
  const cy = -Math.cos(a), sx = Math.sin(a);
  let y = (cy >= 0 ? top : bot) * spow(cy, e), x = w * spow(sx, e);
  if (y < 0 && bot > 1e-6) x *= 1 - KEEL(s) * Math.pow(-y / bot, 1.3);
  // the hump and the knuckles ride the ridge
  const ridge = Math.pow(Math.max(cy, 0), 4);
  let bump = humpAt(s);
  for (const kk of KNUCKLES) bump += 0.009 * Math.exp(-(((s - kk) / 0.011) ** 2));
  y += bump * ridge * tail;
  // the blowhole's lip: one raised slit at the front of the head, left of the middle
  const da = a - (Math.PI - 0.5);
  y += 0.007 * Math.exp(-(((s - 0.04) / 0.016) ** 2)) * Math.exp(-((da / 0.3) ** 2)) * nose;
  // the front of the head stands square; its lower part falls back toward the jaw
  let z = 0.5 - s;
  if (y < 0) z -= 0.3 * -y * (1 - sstep(0, 0.14, s));
  z += 0.01 * Math.max(cy, 0) * (1 - sstep(0, 0.06, s)) * nose;
  out[0] = x; out[1] = y; out[2] = z;
  return out;
}

// A small mesh builder: parts keep their own vertices; normals are summed from faces at the end.
function makeMeshBuilder() {
  const P = [], U = [], C = [], F = [], I = [], NF = [];
  return {
    P, I,
    v(x, y, z, u, v, c, tw, twd) { P.push(x, y, z); U.push(u, v); C.push(c[0], c[1], c[2]); F.push(tw, twd); NF.push(0, 0, 0, 0); return P.length / 3 - 1; },
    tri(a, b, c) { I.push(a, b, c); },
    quad(a, b, c, d) { I.push(a, b, c, a, c, d); },
    fixNormal(i, x, y, z) { NF[i * 4] = x; NF[i * 4 + 1] = y; NF[i * 4 + 2] = z; NF[i * 4 + 3] = 1; },
    build(weld) {
      const n = P.length / 3, N = new Float32Array(n * 3);
      for (let t = 0; t < I.length; t += 3) {
        const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
        const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const k of [a, b, c]) { N[k] += nx; N[k + 1] += ny; N[k + 2] += nz; }
      }
      for (const [a, b] of weld || []) for (let k = 0; k < 3; k++) { const s = N[a * 3 + k] + N[b * 3 + k]; N[a * 3 + k] = s; N[b * 3 + k] = s; }
      for (let i = 0; i < n; i++) {
        if (NF[i * 4 + 3]) { N[i * 3] = NF[i * 4]; N[i * 3 + 1] = NF[i * 4 + 1]; N[i * 3 + 2] = NF[i * 4 + 2]; continue; }
        const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
        if (l > 1e-12) { N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; } else { N[i * 3] = 0; N[i * 3 + 1] = 1; N[i * 3 + 2] = 0; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aFlex', new THREE.Float32BufferAttribute(F, 2));
      g.setIndex(I);
      return g;
    },
  };
}

const STATIONS = {
  hi: [0, 0.004, 0.012, 0.028, 0.06, 0.1, 0.15, 0.2, 0.25, 0.3, 0.34, 0.38, 0.44, 0.5, 0.56, 0.61, 0.645, 0.665, 0.685, 0.71, 0.735, 0.754, 0.772, 0.789, 0.806, 0.822, 0.838, 0.853, 0.868, 0.9, 0.94, 0.975, 0.995],
  near: [0, 0.004, 0.012, 0.028, 0.06, 0.1, 0.15, 0.2, 0.25, 0.3, 0.34, 0.38, 0.44, 0.5, 0.56, 0.61, 0.645, 0.665, 0.685, 0.72, 0.772, 0.806, 0.838, 0.868, 0.9, 0.94, 0.975, 0.995],
  mid: [0, 0.005, 0.03, 0.12, 0.26, 0.345, 0.45, 0.58, 0.668, 0.72, 0.82, 0.92, 0.985],
  low: [0, 0.006, 0.035, 0.18, 0.33, 0.45, 0.6, 0.668, 0.72, 0.82, 0.92, 0.985],
  rank: [0, 0.006, 0.04, 0.2, 0.34, 0.52, 0.668, 0.8, 0.92, 0.985],
  full: [0, 0.005, 0.015, 0.032, 0.06, 0.11, 0.18, 0.26, 0.34, 0.42, 0.52, 0.61, 0.665, 0.7, 0.735, 0.772, 0.806, 0.838, 0.868, 0.92, 0.975],
  plain: [0, 0.012, 0.05, 0.2, 0.34, 0.52, 0.668, 0.8, 0.985],
  far: [0.003, 0.05, 0.4, 0.668, 0.88],
};
const C_TOP = [1, 1, 1], C_BELLY = [1.9, 1.86, 1.78], C_JAW = [3.1, 3.05, 2.9], C_FIN = [0.92, 0.92, 0.94], C_EYE = [0.1, 0.09, 0.09], C_LID = [1.5, 1.45, 1.4];

// opts: lod 'hi' | 'full' | 'mid' | 'plain' | 'far' (the world uses these; 'near', 'low' and 'rank' are older makes the kit no longer builds); calf (plumper, larger eye); cord (a newborn's cord)
// ('full': THE FULL MAKE for every whale near the route's line: the rounded brow, the jaw, the eyes, the flippers,
// the hump and every knuckle, twenty sections of eight sides; 'plain': the same outline in eight sections of six
// sides, for those beyond it)
// ('near': the finest model a little thinned, with jaw, eyes and flippers: whales beside the boat;
// 'rank': the whole body and the flukes in the fewest sections, without flippers or jaw: the whales of the ranks,
// which swim the whole round and are seen from the boat among them and from over the lake)
export function whaleGeometry(opts = {}) {
  const lod = opts.lod || 'hi', calf = !!opts.calf, plump = calf ? 1.1 : 1, b = makeMeshBuilder(), p = [0, 0, 0], weld = [];
  if (lod === 'far') {
    // only what stands out of the water far away: a low arc of back, a stub of flukes
    const SS = STATIONS.far, AA = [Math.PI * 0.3, Math.PI * 0.65, Math.PI, Math.PI * 1.35, Math.PI * 1.7], rows = [];
    for (const s of SS) { const row = []; for (const a of AA) { bodyPoint(s, a, 1, p); row.push(b.v(p[0], p[1], p[2], s, a / TAU, C_TOP, tailW(s), tailWd(s))); } rows.push(row); }
    for (let i = 0; i < SS.length - 1; i++) for (let j = 0; j < AA.length - 1; j++) b.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]);
    const f0 = b.v(0, 0.004, -0.415, 0.95, 0.5, C_FIN, 1, tailWd(0.95)), f1 = b.v(0.17, 0.004, -0.505, 1, 0.6, C_FIN, 1, 0), f2 = b.v(-0.17, 0.004, -0.505, 1, 0.4, C_FIN, 1, 0), f3 = b.v(0, 0.004, -0.488, 1, 0.5, C_FIN, 1, 0);
    b.tri(f0, f1, f3); b.tri(f0, f3, f2);
    return b.build();
  }
  const SS = STATIONS[lod], na = lod === 'hi' ? 16 : lod === 'near' ? 12 : lod === 'plain' ? 6 : 8;
  // ---- body loft
  const rows = [];
  for (let i = 0; i < SS.length; i++) {
    const s = SS[i], row = [];
    for (let j = 0; j <= na; j++) {
      const a = (j / na) * TAU; bodyPoint(s, a, plump, p);
      const cy = -Math.cos(a), under = 1 - sstep(-0.8, 0.3, cy);
      let c = [C_TOP[0] + (C_BELLY[0] - 1) * under, C_TOP[1] + (C_BELLY[1] - 1) * under, C_TOP[2] + (C_BELLY[2] - 1) * under];
      const mouth = (1 - sstep(0.22, 0.29, s)) * (1 - sstep(-0.72, -0.4, cy)) * sstep(0.004, 0.03, s);
      c = c.map((v, k) => v + (C_JAW[k] * 0.85 - v) * mouth);
      const vi = b.v(p[0], p[1], p[2], s, j / na, c, tailW(s), tailWd(s));
      if (i === 0) b.fixNormal(vi, 0, 0.25, 0.97);
      if (i === SS.length - 1) b.fixNormal(vi, 0, 0, -1);
      row.push(vi);
    }
    weld.push([row[0], row[na]]);
    rows.push(row);
  }
  for (let i = 0; i < SS.length - 1; i++) for (let j = 0; j < na; j++) b.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]);
  // ---- flukes: two swept blades, thin lens section, notch between
  {
    const nt = lod === 'hi' ? 5 : lod === 'near' ? 4 : lod === 'full' ? 3 : 2, nc = lod === 'hi' ? 3 : lod === 'rank' || lod === 'plain' ? 1 : 2, span = 0.17;
    for (const side of [1, -1]) for (const face of [1, -1]) {
      const g = [];
      for (let i = 0; i <= nt; i++) {
        const t = i / nt, row = [];
        const zle = -0.4 - 0.105 * Math.pow(t, 0.9), zte = -0.488 - 0.018 * Math.sin(Math.PI * Math.min(t * 1.15, 1)) - 0.015 * t;
        for (let j = 0; j <= nc; j++) {
          const c = j / nc, z = zle + (Math.min(zte, zle) - zle) * c;
          const th = 0.012 * Math.pow(1 - t, 1.1) * Math.pow(Math.sin(Math.PI * clamp(c * 0.92 + 0.04, 0, 1)), 0.7);
          row.push(b.v(side * (0.004 + span * t), 0.003 + face * th - 0.004 * t * t, z, 0.95 + 0.05 * c, 0.5 + side * 0.2 * t, C_FIN, 1, tailWd(0.97)));
        }
        g.push(row);
      }
      for (let i = 0; i < nt; i++) for (let j = 0; j < nc; j++) {
        if (side * face > 0) b.quad(g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]); else b.quad(g[i][j], g[i][j + 1], g[i + 1][j + 1], g[i + 1][j]);
      }
    }
  }
  // ---- flippers: short paddles low on the flank, angled back and down
  if (lod !== 'rank' && lod !== 'plain') {
    const nt = lod === 'hi' ? 4 : lod === 'near' || lod === 'full' ? 2 : 1, len = 0.105 * (calf ? 1.1 : 1);
    for (const side of [1, -1]) {
      bodyPoint(0.335, Math.PI * 0.5 - 0.62, plump, p);
      const root = [side * p[0] * 0.92, p[1], p[2]];
      const ax = [side * 0.7, -0.5, -0.51], ch = [0, 0.32, 0.95], nm = [side * 0.58, 0.8, -0.16];
      for (const face of [1, -1]) {
        const g = [];
        for (let i = 0; i <= nt; i++) {
          const t = i / nt, hc = 0.031 * Math.pow(Math.sin(Math.PI * clamp(0.18 + 0.8 * Math.pow(t, 0.8), 0, 1)), 0.8), row = [];
          for (let j = 0; j <= 2; j++) {
            const c = j - 1, th = (j === 1 ? 0.006 : 0) * (1 - t * 0.7) * face;
            row.push(b.v(root[0] + ax[0] * len * t + ch[0] * hc * c + nm[0] * th, root[1] + ax[1] * len * t + ch[1] * hc * c + nm[1] * th, root[2] + ax[2] * len * t + ch[2] * hc * c + nm[2] * th - 0.01 * t * t,
              0.34, 0.25, C_FIN, tailW(0.34), 0));
          }
          g.push(row);
        }
        for (let i = 0; i < nt; i++) for (let j = 0; j < 2; j++) {
          if (side * face > 0) b.quad(g[i][j], g[i][j + 1], g[i + 1][j + 1], g[i + 1][j]); else b.quad(g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]);
        }
      }
    }
  }
  if (lod === 'hi' || lod === 'near' || lod === 'full' || lod === 'mid') {
    // ---- the lower jaw: a narrow pale rod slung under the head, shorter than the head, hanging a little open
    const JS = [0.275, 0.21, 0.15, 0.095, 0.06], ring = [];
    for (let i = 0; i < JS.length; i++) {
      const s = JS[i], t = i / (JS.length - 1), hw = 0.0235 - 0.0125 * t, hh = 0.0125 - 0.005 * t, y = -(BOT(s) * 0.95) - 0.003 - 0.024 * t, z = 0.5 - s - 0.3 * BOT(s) * (1 - sstep(0, 0.14, s)), row = [];
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 0.6], [-1, 0]]) row.push(b.v(dx * hw, y + dy * hh, z, s, 0.02, C_JAW, 0, 0));
      ring.push(row);
    }
    for (let i = 0; i < JS.length - 1; i++) for (let j = 0; j < 4; j++) { const k = (j + 1) % 4; b.quad(ring[i][j], ring[i][k], ring[i + 1][k], ring[i + 1][j]); }
    const last = ring[JS.length - 1]; b.quad(last[0], last[1], last[2], last[3]);
  }
  if (lod === 'hi' || lod === 'near' || lod === 'full') {
    // ---- eyes: a dark wet dome in a paler lid, low behind the corner of the mouth
    const er = (calf ? 0.0135 : 0.0068), lidC = calf ? [2.9, 2.8, 2.65] : C_LID, lidR = calf ? 2.5 : 1.9;
    for (const side of [1, -1]) {
      const a0 = Math.PI * 0.5 - 0.3; bodyPoint(0.285, a0, plump, p);
      const c0 = [side * p[0], p[1], p[2]], q = [0, 0, 0]; bodyPoint(0.285, a0 + 0.05, plump, q);
      const up = [side * (q[0] - p[0]), q[1] - p[1], 0], ul = Math.hypot(up[0], up[1]) || 1; up[0] /= ul; up[1] /= ul;
      const out = [up[1] * side, -up[0] * side, 0]; if (out[0] * side < 0) { out[0] = -out[0]; out[1] = -out[1]; }
      const fw = [0, 0, 1], nr = lod === 'full' ? 6 : 8, centre = b.v(c0[0] + out[0] * er * 0.75, c0[1] + out[1] * er * 0.75, c0[2], 0.262, 0.3, C_EYE, 0, 0);
      const r1 = [], r2 = [];
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        r1.push(b.v(c0[0] + (up[0] * ca) * er + out[0] * er * 0.35, c0[1] + (up[1] * ca) * er + out[1] * er * 0.35, c0[2] + fw[2] * sa * er * 1.25, 0.262, 0.3, C_EYE, 0, 0));
        r2.push(b.v(c0[0] + (up[0] * ca) * er * lidR - out[0] * er * 0.2, c0[1] + (up[1] * ca) * er * lidR - out[1] * er * 0.2, c0[2] + fw[2] * sa * er * (lidR + 0.5), 0.262, 0.3, lidC, 0, 0));
      }
      for (let i = 0; i < nr; i++) {
        const k = (i + 1) % nr;
        if (side > 0) { b.tri(centre, r1[i], r1[k]); b.quad(r1[i], r2[i], r2[k], r1[k]); } else { b.tri(centre, r1[k], r1[i]); b.quad(r1[i], r1[k], r2[k], r2[i]); }
      }
    }
  }
  if (opts.cord) {
    // ---- a newborn's cord: a pale ribbon trailing from the belly, waving with the tail
    const n = 9, g = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = 0.6 + 0.5 * t, w = 0.006 * (1 - 0.6 * t), y = -BOT(Math.min(s, 0.62)) * (1 - 0.3 * t) - 0.05 * t - 0.03 * Math.sin(t * 5);
      g.push([b.v(-w, y, 0.5 - s, 0.9, 0.02, [3.4, 2.7, 2.6], tailW(Math.min(s, 1)) * (0.4 + t), 0), b.v(w, y, 0.5 - s, 0.9, 0.02, [3.4, 2.7, 2.6], tailW(Math.min(s, 1)) * (0.4 + t), 0)]);
    }
    for (let i = 0; i < n; i++) { b.quad(g[i][0], g[i + 1][0], g[i + 1][1], g[i][1]); b.quad(g[i][0], g[i][1], g[i + 1][1], g[i + 1][0]); }
    for (const r of g) { b.fixNormal(r[0], 0, 1, 0); b.fixNormal(r[1], 0, 1, 0); }
  }
  return b.build(weld);
}

// The skin as data: R pale scars (scratches, rakes, sucker rings, most of them on the head), G creases (the
// wrinkled hide behind the head), B mottling. u runs snout to tail, v round the girth (0.5 = the ridge).
function makeSkinTexture(rng) {
  const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  // mottling
  for (let i = 0; i < 260; i++) {
    const x = rng() * W, y = rng() * H, r = 6 + rng() * 26, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(0,0,255,' + (0.1 + rng() * 0.22).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    if (y < r) { g.fillRect(x - r, y - r + H, r * 2, r * 2); }
  }
  // scars: scratches and parallel rakes, thick on the head and thinning aft; rings of sucker marks round the mouth
  const scratch = (x, y, len, ang, w, a) => { g.beginPath(); g.lineWidth = w; g.strokeStyle = 'rgba(255,0,0,' + a.toFixed(3) + ')'; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (rng() - 0.5) * len * 0.3, y + Math.sin(ang) * len * 0.5 + (rng() - 0.5) * len * 0.3, x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke(); };
  for (let i = 0; i < 150; i++) {
    const head = rng() < 0.85, x = head ? Math.pow(rng(), 1.7) * W * 0.3 : W * (0.3 + rng() * 0.68), y = rng() * H, len = 3 + rng() * (head ? 16 : 26), ang = rng() * 6.28, n = rng() < 0.3 ? 2 + Math.floor(rng() * 3) : 1;
    for (let k = 0; k < n; k++) scratch(x + Math.sin(ang) * k * 2.2, y - Math.cos(ang) * k * 2.2, len, ang, 0.45 + rng() * 0.5, (head ? 0.3 : 0.16) + rng() * 0.4);
  }
  for (let i = 0; i < 60; i++) {
    const x = rng() * W * 0.26, y = (rng() < 0.5 ? 0.02 + rng() * 0.2 : 0.78 + rng() * 0.2) * H, r = 1.5 + rng() * 3.5;
    g.beginPath(); g.lineWidth = 0.9; g.strokeStyle = 'rgba(255,0,0,' + (0.4 + rng() * 0.4).toFixed(3) + ')'; g.arc(x, y, r, 0, 6.3); g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return tex;
}

// The folds of the hide as a tile that repeats without a seam: R the slope of the relief round the girth, G its slope
// along the body, B its height (0 in the bottom of a fold). Lengthwise folds, wavy, broken here and there.
async function makeWrinkleTexture(rng, yieldFn) {
  const N = 256, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const g = cv.getContext('2d'), img = g.createImageData(N, N), H = new Float32Array(N * N);
  const ph = [0, 1, 2, 3, 4, 5].map(() => rng() * TAU);
  const ridge = (x) => Math.sqrt(Math.abs(Math.sin(Math.PI * x)));
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = i / N, v = j / N;
    const w1 = 0.5 * Math.sin(TAU * (u + 0.25 * Math.sin(TAU * v * 3 + ph[0])) + ph[1]) + 0.3 * Math.sin(TAU * (u * 3 + v * 2) + ph[2]) + 0.3 * Math.sin(TAU * (u * 7 + v * 5) + ph[5]);
    const w2 = 0.6 * Math.sin(TAU * (u * 2 + v) + ph[3]) + 0.3 * Math.sin(TAU * (u * 5 - v * 3) + ph[4]);
    const brk = 0.55 + 0.45 * Math.sin(TAU * (u * 5 + 0.5 * Math.sin(TAU * v * 5 + ph[2])) + ph[0]) * Math.sin(TAU * (v * 7 + u * 2) + ph[5]);
    H[j * N + i] = (0.62 * ridge(v * 17 + w1) + 0.38 * ridge(v * 37 + w2)) * (0.45 + 0.55 * brk);
    if (i === N - 1 && j % 16 === 15) await yieldFn();
  }
  const at = (a, b) => H[((b + N) % N) * N + (a + N) % N];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = (j * N + i) * 4;
    if (i === 0 && j % 64 === 63) await yieldFn();
    img.data[k] = 128 + 127 * clamp((at(i, j + 1) - at(i, j - 1)) * 2.5, -1, 1);
    img.data[k + 1] = 128 + 127 * clamp((at(i + 1, j) - at(i - 1, j)) * 2.5, -1, 1);
    img.data[k + 2] = 255 * clamp(H[j * N + i], 0, 1); img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  return tex;
}

// The sea's height: six plain sines of wind sea (all but gone on the lake and the lane), the long swell outside
// (travelling), the slow oily swell on the calm.
export const GLSL_SEA = /* glsl */`
#ifndef SL_SEA
#define SL_SEA
uniform vec4 uWave[6];
uniform float uWavePh[6];
uniform vec4 uSwell[2];
float seaState(vec2 p){ return mix(0.05, 1., roughAt(p)); }
// THE OILY SWELL of the calm: two slow low trains, a few decimetres from crest to trough and tens of metres long (60 m
// and 37 m), that lift and bend the mirror; it dies away where the chop takes over. xy = its slope, z = its height
vec3 oilGH(vec2 p, float t){
  float k = 1. - smoothstep(0.05, 0.6, roughAt(p));
  vec2 d0 = uWave[0].xy, d1 = vec2(-uWave[1].y, uWave[1].x);
  float a0 = dot(d0, p)*0.105 - 0.42*t + uWavePh[4], a1 = dot(d1, p)*0.171 - 0.55*t + uWavePh[5];
  return k*vec3(d0*(0.0168*cos(a0)) + d1*(0.0154*cos(a1)), 0.16*sin(a0) + 0.09*sin(a1));
}
// the wind sea alone (what runs over the long swell)
float chopH(vec2 p, float t){
  float h = 0.;
  for (int i = 0; i < 6; i++){ vec4 w = uWave[i]; h += w.w*sin(dot(w.xy, p)*w.z - sqrt(9.81*w.z)*t + uWavePh[i]); }
  // close round the boat the wind sea is broken down by her hull and her oars: to 0.3 of its height within three
  // metres of her middle, whole at twenty
  vec2 rb = p - uBoat.xy;
  return h*seaState(p)*mix(0.3, 1., smoothstep(9., 400., dot(rb, rb))) + oilGH(p, t).z;
}
// THE LONG SWELL of the straits: two crossed trains of low hills of water travelling on the world clock, each at the
// speed of a deep-water wave of its length (uSwell: height, wave vector x and z, phase). It dies away rank by rank and
// is not in the lane. xy = its slope, z = its height
vec3 swellGH(vec2 p){
  float k = roughOf(lakeRho(p), 0.)*(1. - laneAt(p, 6.));
  float a0 = dot(uSwell[0].yz, p) - sqrt(9.81*length(uSwell[0].yz))*uTime + uSwell[0].w, a1 = dot(uSwell[1].yz, p) - sqrt(9.81*length(uSwell[1].yz))*uTime + uSwell[1].w;
  return k*vec3(uSwell[0].yz*(uSwell[0].x*cos(a0)) + uSwell[1].yz*(uSwell[1].x*cos(a1)), uSwell[0].x*sin(a0) + uSwell[1].x*sin(a1));
}
float swellAt(vec2 p){ return swellGH(p).z; }
float waveH(vec2 p, float t){ return chopH(p, t) + swellAt(p); }
#endif
`;
const GLSL_HASH = /* glsl */`
float slHash(float n){ return fract(sin(n*12.9898)*43758.5453); }
float slHash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float slNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(slHash2(i), slHash2(i + vec2(1., 0.)), f.x), mix(slHash2(i + vec2(0., 1.)), slHash2(i + vec2(1., 1.)), f.x), f.y); }
`;

const WHALE_VERT = /* glsl */`
attribute vec2 aFlex; attribute vec3 aCol;
attribute vec4 iA, iB, iC, iE;
#ifndef DIRECT
attribute vec4 iD, iG, iR, iQ;
#else
attribute float iH;
#endif
#ifdef HIDEABLE
attribute float iN;
#endif
uniform float uFogDen;
varying vec3 vN, vWp, vAp, vCol, vT; varying vec2 vUv, vSk; varying vec4 vW, vTint; varying vec2 vLH;
${GLSL_HERD}
${GLSL_REFRACT}
${GLSL_SEA}
void main(){
  // (its length, for the marks by nearness; its out-of-sight depth)
  vLH = vec2(iA.w, ${FLOOR.toFixed(1)});
#ifdef DIRECT
  vLH.y = iH;
  Whale w = whaleDirect(iA, iB, iC);
  float tailPh = iB.w, swim = iC.y;
#else
  Whale w = whaleAt(iA, iB, iC, iD, iG, iR, iQ, uTime);
  float tailPh = uTime*(1.3 + 0.5*min(w.speed, 5.)) + iC.w*30., swim = iC.y;
#endif
  vec3 n = normal;
  vec3 wp = whalePlace(w, iA.w, position, aFlex, tailPh, swim, n);
  // the long swell lifts the whale with the water it lies in; what is seen through the water is worked out as on
  // still water, with the eye's height taken over the water as it stands under the eye (the eye itself keeps its
  // height: the swell is not in the route)
  float sw = swellAt(wp.xz), hS = chopH(wp.xz, uTime);
  vec4 ap = seenThroughWater(wp, vec3(cameraPosition.x, cameraPosition.y - swellAt(cameraPosition.xz), cameraPosition.z));
  float d = max(-wp.y, 0.), wv = min(d, 6.)*0.014;
  ap.y += hS*step(1e-4, d) + sw;
  ap.xz += wv*vec2(sin(wp.z*0.9 + uTime*1.3 + uPhase.w) + 0.5*sin(wp.x*2.1 - uTime*1.9 + uPhase.z), sin(wp.x*0.8 - uTime*1.1 + uPhase.y) + 0.5*sin(wp.z*2.3 + uTime*1.7 + uPhase.w));
  // vWp.y: height above the water as it stands there (the swell lifts and drops the waterline on the body)
  vN = n; vWp = vec3(wp.x, wp.y - hS, wp.z); vAp = ap.xyz; vUv = uv; vCol = aCol; vTint = iE;
  // the body's own line (for the lie of its folds) and the skin's measure in metres: a fold tile is 2.6 m long, two to a girth
  float cpT = cos(w.pitch); vT = vec3(w.fwd.x*cpT, sin(w.pitch), w.fwd.y*cpT); vSk = vec2(uv.x*iA.w/2.6, uv.y*max(1., floor(0.19*iA.w + 0.5)));
  vec4 mv = viewMatrix*vec4(ap.xyz, 1.);
  float fd = uFogDen*length(mv.xyz);
  vW = vec4(d, ap.w, calmAt(wp.xz), 1. - exp(-fd*fd));
  gl_Position = projectionMatrix*mv;
#ifdef DIRECT
  if (iB.x < -${(FLOOR + GONE).toFixed(1)}) gl_Position = vec4(0., 0., 2., 1.);
#endif
#ifdef HIDEABLE
  // (this whale is drawn by the other make just now: see kit.herd's show and kit.pool)
  if (iN < 0.5) gl_Position = vec4(0., 0., 2., 1.);
#endif
}`;

const WHALE_FRAG = /* glsl */`
uniform sampler2D tSkin, tWrinkle;
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uFogCol, uSkin, uScar, uSkyRefl, uFoam, uGateCol;
uniform float uTime, uWet, uSeaLit;
uniform vec4 uBoat, uGateL, uLake;
varying vec3 vN, vWp, vAp, vCol, vT; varying vec2 vUv, vSk; varying vec4 vW, vTint; varying vec2 vLH;
${GLSL_WATER}
${GLSL_DEEP}
${GLSL_HASH}
void main(){
  // what the vertex stage hands over is held to its range (antialiasing samples run outside the triangle)
  float dep = clamp(vW.x, 0., 400.), pathW = clamp(vW.y, 0., 4000.), calmK = clamp(vW.z, 0., 1.);
  // NOTHING AT OR UNDER ITS OUT-OF-SIGHT DEPTH IS SEEN (the rule at the head of this file): from two thirds of that
  // depth a body thins away point by point, and at the depth none of it is left. So a whale that comes up from
  // under it, or sounds to there, neither comes into being nor goes at any one moment.
  { float hideD = clamp(vLH.y, 6., 400.), gone = smoothstep(hideD*0.667, hideD, dep); if (gone > 0. && slHash2(gl_FragCoord.xy) < gone) discard; }
  // NOTHING UNDER WATER IS SEEN THROUGH HER: a sight that meets the water inside the boat's own outline (where the
  // sea leaves its surface out: her beam at the height the water stands against her) has met her first, so what
  // swims under the water along that sight is not drawn. No whale under her keel shows on her planks.
  { float tS = clamp(cameraPosition.y/max(cameraPosition.y - vAp.y, 1e-3), 0., 1.);
    vec2 sB = cameraPosition.xz + (vAp.xz - cameraPosition.xz)*tS - uBoat.xy;
    float alS = dot(sB, uBoat.zw), laS = abs(sB.x*uBoat.w - sB.y*uBoat.z), sS = clamp((5.8 + alS)/8.5, 0., 1.);
    float bmS = 0.665*pow(max(1. - pow(abs(2.*sS - 1.), 2.3), 0.), 0.72);
    if (vWp.y < 0. && alS > -5.8 && alS < 2.7 && laS < bmS) discard; }
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  float calf = clamp(vTint.w, 0., 1.), s = clamp(vUv.x, 0., 1.);
  // THE HIDE'S MARKS BY NEARNESS (declared in the world's header): within three of the whale's own lengths of the eye
  // its marks are drawn at their strongest (the folds' shadows, the pale scuffs and scars, the head's long
  // scratches, the blowhole's dark slit, the sheen broken into patches by the water sliding on it), and they go
  // back to the plain hide by six lengths, where they are finer than the picture's grain
  float nearK = 1. - smoothstep(3., 6., length(cameraPosition - vAp)/max(vLH.x, 1.));
#ifdef FAR
  vec3 sk = vec3(0.1, 0., 0.5); float crease = 0.;
#else
  vec3 sk = texture2D(tSkin, vUv).rgb;
  // THE HIDE: smooth on the head; from behind the head to the hump wrinkled like a prune, in lengthwise folds whose
  // size is told in metres of skin (the same on a long whale and a short one)
  float wr = smoothstep(0.31, 0.4, s)*(1. - smoothstep(0.7, 0.88, s))*(1. - 0.85*calf);
  vec4 wk = texture2D(tWrinkle, vSk);
  vec3 T = normalize(vT + vec3(0., 1e-5, 0.)), Bd = normalize(cross(N, T) + vec3(1e-5, 0., 0.));
  N = normalize(N - wr*0.95*((wk.r - 0.5)*Bd + (wk.g - 0.5)*T));
  float crease = wr*(1. - wk.b);
#endif
  vec3 toEye = cameraPosition - vAp; float dist = length(toEye); vec3 V = toEye/max(dist, 1e-3);
  // slate grey-brown, darkest and smoothest on the head, mottled; pale scars and scratches, most of them on the head
  vec3 alb = uSkin*vCol*vTint.rgb*(0.62 + 0.62*sk.b)*mix(0.78, 1., smoothstep(0.26, 0.42, s));
  // pale patches (old skin sloughing, a metre or three across, told in metres of hide) and the scars over them
  float patchy = smoothstep(0.6, 0.8, slNoise(vSk*vec2(1.1, 1.7) + vTint.rg*37.))*(1. - 0.7*calf);
  alb = mix(alb, uScar*vTint.rgb*0.85, mix(0.4, 0.5, nearK)*patchy);
  alb = mix(alb, uScar*vTint.rgb*1.15, clamp(sk.r*mix(0.8, 1.15, nearK), 0., 1.)*(1. - 0.8*calf));
  // (the head's long pale scratches, lengthwise; the blowhole, a dark slit at the front of the head left of the ridge)
  float scr = smoothstep(0.8, 0.92, slNoise(vec2(vSk.x*1.7 + vTint.g*13., vUv.y*110.)))*(1. - smoothstep(0.3, 0.44, s))*nearK*(1. - 0.8*calf);
  alb = mix(alb, uScar*vTint.rgb*1.2, 0.55*scr);
  float bhs = (s - 0.04)/0.012, bhv = (vUv.y - 0.42)/0.008;
  alb *= 1. - 0.85*nearK*exp(-bhs*bhs - bhv*bhv);
  alb *= 1. - mix(0.25, 0.5, nearK)*crease;
  alb = max(alb, vec3(0.));
  // (near, by the same nearness as the marks: the back, which the sun strikes square, is the darkest of the hide and
  // the flank under it a shade paler, so a bull beside the boat is a dark wet back over a paler flank with its
  // scars on it, not one pale face)
  alb *= mix(1., 0.66 + 0.34*(1. - smoothstep(0.1, 0.75, N.y)), nearK);
  float under = 1. - smoothstep(-0.09, 0.03, vWp.y);
  float ndl = clamp(dot(N, uSunDir), 0., 1.);
  vec3 amb = mix(uBounce, uSkyCol, N.y*0.5 + 0.5);
  vec3 H = normalize(V + uSunDir + vec3(0., 1e-4, 0.));
  float nh = clamp(dot(N, H), 0., 1.), nv = clamp(dot(N, V), 0., 1.);
  // out of the water it is wet: a soft sheen over the lit side, a hard glint that the folds break into threads, the
  // sky in its grazing edges
  // (wet hide is dark: it shows by what it gives back of the sun and the sky, not by its own grey)
  // (near, the wet hide takes little of the sun and the sky by its own grey: it is a dark body whose light is the
  // gleam and the sheen on it, and its scars are pale marks on the dark, not a pale wash over the whole of it)
  vec3 above = alb*(uSunCol*ndl*mix(0.8, 0.36, nearK) + amb*vec3(1.2, 1.18, 1.3)*mix(1., 0.62, nearK));
  // the wet on it moves: a film of water slides over the hide (the gleam wanders with it), and where the back has
  // just come up the water runs off it in threads down the flanks, from the ridge to the waterline
  float film = 0.55 + 0.9*slNoise(vWp.xz*1.3 + vec2(uTime*0.7, uTime*0.4));
  float runs = smoothstep(0.55, 0.85, slNoise(vec2(vSk.x*11., abs(vUv.y - 0.5)*16. - uTime*0.9)))*(1. - smoothstep(0.25, 1.6, vWp.y));
  float gleam = (pow(nh, 24.)*0.12 + pow(nh, 180.)*0.6*(0.5 + 0.8*sk.b)*(1. - 0.6*crease))*film + pow(nh, 40.)*0.5*runs;
  float fr = 1. - nv; fr = fr*fr*fr*fr;
  // (near, the sky's sheen does not lie over the whole back as one pale wash: it stands in patches where the film
  // of water is thick, and the hide between them is dark)
  above += uWet*(uSunCol*gleam*smoothstep(0., 0.15, ndl) + uSkyRefl*(fr*0.45 + (mix(0.13, 0.025 + 0.19*smoothstep(0.85, 1.35, film), nearK) + 0.22*runs)*clamp(N.y*0.7 + 0.3, 0., 1.)));
  // THE RING'S LIGHT on a wet hide: from where the ring stands, falling off with the square of the distance (half
  // of it at uGateL.w metres), on the side turned to it. The hide stays dark under it (it takes the light by its
  // own dark colour) and the wet on it gives the ring back only along its grazing edges: a back near the ring is a
  // dark body with a warm rim, not a pale stone
  { vec3 Lg = uGateL.xyz - vWp; float dg2 = dot(Lg, Lg), w2 = uGateL.w*uGateL.w, kg = w2/(w2 + dg2);
    above += (alb*0.3 + 0.45*uWet*fr)*uGateCol*kg*clamp(dot(N, Lg*inversesqrt(max(dg2, 1e-4)))*0.75 + 0.25, 0., 1.); }
#ifdef FAR
  // far off: the wet back gives the sky back along its top, so a row of them never reads as rocks
  above += uSkyRefl*0.13*clamp(N.y, 0., 1.) + uSunCol*0.04*pow(nh, 12.);
#endif
  // under it: lit from above (the back takes the light, flank and belly are in shade but paler of skin), the sun
  // broken into a moving net on back and head, the colour going to blue and fainter with the depth of water looked
  // through; and our own boat's shadow sliding over
  float up = clamp(N.y*0.6 + 0.5, 0., 1.);
  float ca = caustic(vWp.xz + N.xz*1.2, uTime);
  float sweep = 0.72 + 0.38*sin(vWp.x*0.21 + vWp.z*0.13 + uTime*0.5 + uPhase.z)*sin(vWp.z*0.17 - uTime*0.33 + uPhase.w);
  float deepK = smoothstep(0.5, 8., dep);
  vec2 sp = vWp.xz + uSunDir.xz*(dep*0.62/max(uSunDir.y, 0.3)) - uBoat.xy;
  float sAl = dot(sp, uBoat.zw), sLa = abs(sp.x*uBoat.w - sp.y*uBoat.z), soft = 0.5 + 0.09*dep;
  float shade = (1. - smoothstep(0.75 - 0.3*soft, 0.75 + soft, sLa))*smoothstep(-6.2 - soft, -5.4, sAl)*(1. - smoothstep(2.3, 2.9 + soft, sAl))*step(0.01, dep);
  // (the belly takes the water's own light from below: its pale skin shows paler than the flank over it)
  float dn = clamp(0.3 - 0.7*N.y, 0., 1.);
  vec3 below = alb*(uSunCol*(ndl*0.6 + ca*up*mix(2., 3.8, deepK)*exp(-dep*0.03))*sweep*exp(-dep*0.024)*(1. - 0.75*shade) + amb*(0.07 + 0.62*up*up*up)
    + (uTurq + uCobalt)*(uSeaLit*0.5*dn*dn));
  // A WHALE UNDER WATER IS IN THE WATER: every point of it goes into the very blue that lies behind it (what the
  // water shows where nothing swims: deepSeen, the floor's own colour along this sight) by the water looked through
  // to that point, red first, then green, then blue. So a body near the surface is lit and shaded, one further
  // down is bluer and fainter, and one deep in thick water is gone: none stands on the water as a flat shape.
  // AT A GLANCE THE SURFACE HIDES IT: under the ruffled open sea a body shows whole where the sight goes down at
  // eleven degrees or more and not at all under three and a half; under the calm (the lake, the lane) from four
  // degrees, and not under one. So from a bow's height in the open no dark shape lies on the water far ahead.
  { float kW = mix(uClear.y, uClear.x, calmK); vec3 Tw = exp(-kW*(pathW + 0.4*dep)*vec3(2.2, 0.9, 0.55));
    Tw *= smoothstep(mix(0.06, 0.02, calmK), mix(0.2, 0.07, calmK), V.y);
    below = below*Tw + deepSeen(cameraPosition, -V, calmK, uTime, uSeaLit)*(1. - Tw); }
  below += uSeaFire*(0.25 + 0.75*fr + 0.6*ca)*exp(-dep*0.08);
  vec3 col = mix(above, below, under);
  // WHERE THE BODY BREAKS THE SURFACE: in the open sea froth climbs the hide to an uneven line (4 to 18 cm
  // of it) and boils there; on the sleek only a bright thread lies at the waterline. Its size is told in
  // metres only; skin that lies flat in the surface (a back awash, flukes) carries none; the far model has none.
#ifndef FAR
  float fn = slNoise(vWp.xz*2.6 + vec2(uTime*0.6, -uTime*0.4)), fn2 = slNoise(vWp.xz*7.3 - vec2(uTime*0.9, uTime*0.5));
  float reach = mix(0.1 + 0.3*fn*fn, 0.03, calmK);
  float wl = (1. - smoothstep(0.35*reach, reach, abs(vWp.y - 0.3*reach)))*(1. - smoothstep(0.7, 0.93, abs(N.y)));
  float froth = wl*mix(0.55 + 0.45*smoothstep(0.25, 0.7, fn2), 0.3*smoothstep(0.2, 0.7, fn), calmK);
  col = mix(col, mix(uFoam*(0.72 + 0.28*fn2)*(0.55 + 0.45*clamp(ndl + 0.4, 0., 1.)), uSkyRefl*1.25, calmK), froth);
#endif
  col = mix(col, uFogCol, clamp(vW.w, 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;

// what the world writes for a whale it keeps: v = [kept 0/1, height of the axis, pitch, arch, fluke lift, 0 (not
// read), its blow's kind (see SPOUT_VERT)] into iR, iQ of instances i0 .. i0 + n - 1
const KEEP_NONE = [0, 0, 0, 0, 0, 0, -1e4];
function keepAttrs(g, n) {
  const R = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(n, 1) * 4), 4), Q = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(n, 1) * 4), 4);
  R.setUsage(THREE.DynamicDrawUsage); Q.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < n; i++) Q.array[i * 4 + 2] = -1e4;
  g.setAttribute('iR', R); g.setAttribute('iQ', Q);
  return (i0, cnt, v) => {
    const a = R.array, b = Q.array, j = i0 * 4;
    if (a[j] === v[0] && a[j + 1] === v[1] && a[j + 2] === v[2] && a[j + 3] === v[3] && b[j] === v[4] && b[j + 1] === v[5] && b[j + 2] === v[6]) return;
    for (let k = 0; k < cnt; k++) { const q = (i0 + k) * 4; a[q] = v[0]; a[q + 1] = v[1]; a[q + 2] = v[2]; a[q + 3] = v[3]; b[q] = v[4]; b[q + 1] = v[5]; b[q + 2] = v[6]; }
    R.needsUpdate = Q.needsUpdate = true;
  };
}
function instanced(base, n, attrs, dynamic) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  const out = {};
  for (const [name, size] of attrs) {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(n, 1) * size), size);
    if (dynamic) a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute(name, a); out[name] = a;
  }
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
  return { geometry: g, attr: out };
}

// >>> WAY (plain arithmetic, no THREE: the proofs in node read this very text)
// THE LANE OF DEEP WATER ALONG THE ROUTE'S LINE: a standing law of the place. A whale of the rounds (the great
// bulls and the cows of the ranks) is under water wherever ITS OWN PLACE lies within the lane, at every clock,
// whether a boat is there or not: the herd swims under the lane. THE LAW READS THE WHALE'S OWN PLACE AND ITS OWN
// CLOCK ONLY: where the world clock has carried it round its rank (place), which way it heads there, and how far
// its body then lies from the route's line (d: the least distance to the line of five points of its axis, snout
// to tail, less its half breadth, 0.09 of its length; on a straight stretch this is the middle's distance less
// the body's reach across the line, as before, and it has no step where the line bends). Nothing of the
// boat, of the eye, of the film or of the engine's speed is read here or handed in.
//   THE LANE: a whale whose body lies within WAY metres of the line (the boat's half beam, her oars' sweep and two
//   metres) lies level with ITS HIGHEST PART DEPTH
//   METRES UNDER WATER (or lower, where its own dive has it lower). Outside it the depth eases back to the height
//   its own clock gives over SOFT metres more (a smooth step of d), and the whale lies along the slope of that
//   easing as it swims down under the lane and up out of it. The lane has this one depth along the whole route,
//   first metre to the gate (in the lane of smooth water the shader's own rule of that lane takes the whales of
//   the rounds deeper still: see whaleAt).
//   SOFT by the whales' own crossing: the easing moves a whale up or down by at most 1.5 * (its height over the
//   lane's depth) * (the speed its body nears the line) / SOFT metres a second: with the tallest roll (axis 1.74 m
//   up, a back 1.9 m over it: 9.8 m to go) and the fastest swimmer over the water (5.4 m/s), 4.4 m/s at 18 m.
//   (TOP: the highest of a level body over its axis, as a share of its length: the head's 0.102 and its nod. A kept
//   whale keeps its standing pitch and the set of its back besides, which stand up to 0.126 of the length over the
//   axis: so the highest drawn point of a great bull lies 5.9 m under at the least, not 6.2: counted on the placed
//   vertices.)
//   ITS BLOWS are its own clock's. A blow is not given if the lane has the whale more than BLOW metres under its
//   own clock's height at the second the blow begins or a second later (the second its nozzle runs); so a blow is
//   whole or not at all, by the whale's own place at its own clock's blow. (AIR: the seconds a blow's drops are
//   in the air.)
//   (To spare the frame: a whale beyond the lane's reach is only laid on the line; one further off than it can
//   swim in the seconds to come is not looked at again until it could be within REST metres of that reach; a
//   blow's yes or no is worked once for its round. What is written for every whale is the same as without this.)
export const WAY = { WAY: 6.2, SOFT: 18, DEPTH: 6.2, TOP: 0.11, BLOW: 0.4, AIR: 5.2, REST: 8 };
const waySS = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wayClamp = (x, a, b) => Math.min(b, Math.max(a, x));
// the roll through the surface (the shader's rollAt): [height of the axis, slope of its way]
function wayRoll(phi, per, yB, amp, sound, speed) {
  const s = Math.sin(phi), c = Math.cos(phi), dv = wayClamp((-s - 0.35) / 0.6, 0, 1), k = 1.6 + 2.6 * sound, su = Math.exp(-(1 - Math.cos(phi - 0.45)) * 5);
  const y = yB + amp * (1 - k * dv * dv * (3 - 2 * dv) + 0.4 * su), ddv = dv > 0 && dv < 1 ? -c / 0.6 : 0;
  const dy = amp * (-k * 6 * dv * (1 - dv) * ddv - 0.4 * su * 5 * Math.sin(phi - 0.45)) * 6.2831853 / Math.max(per, 1);
  return [y, Math.atan2(dy, Math.max(speed, 1.3))];
}
// height, pitch, arch and fluke lift of a whale at phase phi of a round of period per (the shader's whaleAt, the pose part)
function wayPose(phi, per, b, speed, out) {
  const sound = b.fluke || 0, yB = b.y ?? -0.9, amp = b.amp ?? 0, lag = 0.5 * Math.min(b.len / Math.max(speed, 1.3) * 6.2831853 / Math.max(per, 1), 1.8);
  const rm = wayRoll(phi, per, yB, amp, sound, speed), rh = wayRoll(phi + lag, per, yB, amp, sound, speed), rt = wayRoll(phi - lag, per, yB, amp, sound, speed);
  const lo = -0.3 - 0.5 * sound, live = Math.min(1, 0.2 + speed * 0.5), dv = wayClamp((-Math.sin(phi) - 0.35) / 0.6, 0, 1);
  out[0] = rm[0]; out[1] = wayClamp(rm[1], lo, 0.32) * live; out[2] = (wayClamp(rt[1], lo, 0.32) - wayClamp(rh[1], lo, 0.32)) * live;
  out[3] = sound * waySS(0.02, 0.3, dv) * (1 - waySS(0.5, 0.95, dv)) * (Math.cos(phi) <= 0 ? 1 : 0);
  return out;
}
// o = { whales: the records of the whales of the rounds, cx, cz: the lake's centre, shape: [four numbers of the
// lake's shape], line: x, z of the whole route's line every o.step metres (places behind the first metre are
// laid on the first tangent drawn back) }
// step(time): time = the world clock, and nothing else. It writes b.keep = [kept, height, pitch, arch, fluke lift,
// 0, blows (-1e4 its own clock's, -2e4 not this one)] on every whale (see keepAttrs).
export function makeWay(o) {
  const C = WAY, B = o.whales, n = B.length, line = o.line, ds = o.step, np = line.length >> 1, TAU = 6.2831853;
  const sh = o.shape, lakeShape = (th) => 1 + sh[0] * Math.cos(2 * th + sh[1]) + sh[2] * Math.cos(3 * th + sh[3]), lakeShapeD = (th) => -2 * sh[0] * Math.sin(2 * th + sh[1]) - 3 * sh[2] * Math.sin(3 * th + sh[3]);
  const none = new Uint8Array(n), own = new Uint8Array(n), wake = new Float64Array(n), seen = new Uint8Array(n), bKey = new Float64Array(n).fill(-1e30), bNone = new Uint8Array(n);
  // (st.seen: 0 a whale not looked at this frame, 1 one only laid on the line (x, z, la are this frame's), 2 one the law has worked through)
  const st = { n, y: new Float64Array(n), x: new Float64Array(n), z: new Float64Array(n), la: new Float64Array(n), d: new Float64Array(n), wd: new Float64Array(n), own, none, seen };
  for (const b of B) b.keep = [0, 0, 0, 0, 0, 0, -1e4];
  let has = false, prevT = 0;
  const pl = [0, 0, 0, 0, 0], pj = [0, 0, 0, 0], pc = [0, 0, 0, 0], pb = [0, 0, 0], BODY = [-0.5, -0.25, 0.25, 0.5];
  // where whale b is at world second t: x, z, heading x, z, speed
  const place = (b, t) => {
    const th = b.th + (b.w || 0) * t, s0 = lakeShape(th), sd = lakeShapeD(th), ex = Math.cos(th), ez = Math.sin(th), R = b.r * s0;
    let tx = sd * ex - s0 * ez, tz = sd * ez + s0 * ex; const tl = Math.hypot(tx, tz) || 1, sg = (b.w || 0) < 0 ? -1 : 1; tx = tx / tl * sg; tz = tz / tl * sg;
    const yo = (b.yaw || 0) + (b.yawW || 0) * Math.sin(t * 0.07 + (b.seed ?? 0.5) * TAU), cy = Math.cos(yo), sy = Math.sin(yo);
    pl[0] = o.cx + R * ex; pl[1] = o.cz + R * ez; pl[2] = tx * cy - tz * sy; pl[3] = tx * sy + tz * cy; pl[4] = Math.abs(b.w || 0) * R; return pl;
  };
  // (the line's segments, worked once here, the line being never written after it is handed: each one's run, its
  // length (1 for a segment of no length) and its unit tangent)
  const ns = Math.max(0, np - 1), lux = new Float64Array(ns), luz = new Float64Array(ns), lul = new Float64Array(ns), ltx = new Float64Array(ns), ltz = new Float64Array(ns);
  for (let i = 0; i < ns; i++) { const ax = line[i * 2], az = line[i * 2 + 1], ux = line[i * 2 + 2] - ax, uz = line[i * 2 + 3] - az, ul = Math.hypot(ux, uz) || 1; lux[i] = ux; luz[i] = uz; lul[i] = ul; ltx[i] = ux / ul; ltz[i] = uz / ul; }
  // a place laid on the route's line: its station, its distance la, how far the heading (hx, hz) lies across the
  // line (0 along it, 1 square to it) and how far it heads away (1) or toward the line (-1)
  const lay = (x, z, hx, hz) => {
    let bi = 0, bd = 1e30;
    for (let i = 0; i < np; i += 8) { const dx = x - line[i * 2], dz = z - line[i * 2 + 1], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
    if (bd > 170 * 170) { pj[0] = bi * ds; pj[1] = Math.sqrt(bd); pj[2] = 0; pj[3] = 0; return pj; }
    const i0 = Math.max(0, bi - 9), i1 = Math.min(np - 2, bi + 9); let s = 0, la = 1e30, cr = 0, aw = 0;
    for (let i = i0; i <= i1; i++) {
      const ax = line[i * 2], az = line[i * 2 + 1], ux = lux[i], uz = luz[i], ul = lul[i], tx = ltx[i], tz = ltz[i];
      let f = ((x - ax) * tx + (z - az) * tz) / ul; if (i > 0 || f > 0) f = wayClamp(f, 0, 1);
      const qx = ax + ux * f, qz = az + uz * f, d = Math.hypot(x - qx, z - qz);
      if (d < la) { la = d; s = (i + f) * ds; cr = Math.abs(hx * tz - hz * tx); aw = d > 1e-3 ? (hx * (x - qx) + hz * (z - qz)) / d : 0; }
    }
    pj[0] = s; pj[1] = la; pj[2] = cr; pj[3] = aw; return pj;
  };
  // THE BODY'S OWN DISTANCE to the line: [the least distance of five points of its axis, less its half breadth; how
  // far the nearest of them heads away from the line (1) or toward it (-1); the middle's distance]
  const bodyD = (x, z, hx, hz, len) => {
    let L = lay(x, z, hx, hz); const la = L[1]; let d = la, aw = L[3];
    if (la < 0.59 * len + C.WAY + C.SOFT) for (let j = 0; j < 4; j++) { const o = BODY[j] * len; L = lay(x + hx * o, z + hz * o, hx, hz); if (L[1] < d) { d = L[1]; aw = L[3]; } }
    pb[0] = d - 0.09 * len; pb[1] = aw; pb[2] = la; return pb;
  };
  // how far the lane has a body at distance d: 1 within the lane, 0 beyond its easing
  const laneAt = (d) => 1 - waySS(C.WAY, C.WAY + C.SOFT, d);
  // the metres the lane has whale b under its own clock's height at world second t
  const under = (b, t) => {
    const p = place(b, t), speed = p[4], wd = laneAt(bodyD(p[0], p[1], p[2], p[3], b.len)[0]); if (wd <= 0) return 0;
    const per = Math.max(b.per ?? 10, 1); wayPose(TAU * (t / per + (b.ph ?? 0)), per, b, speed, pc);
    return wd * Math.max(0, pc[0] + C.DEPTH + C.TOP * b.len);
  };
  const step = (time) => {
    const jump = !has || time < prevT || time - prevT > 1;
    if (jump) wake.fill(-1e30);
    for (let i = 0; i < n; i++) {
      if (time < wake[i]) { seen[i] = 0; continue; }
      const b = B[i], len = b.len, per = Math.max(b.per ?? 10, 1), p = place(b, time), px = p[0], pz = p[1], speed = p[4];
      const Bd = bodyD(px, pz, p[2], p[3], len), d = Bd[0], away = Bd[1], la = Bd[2], wd = laneAt(d), k = b.keep;
      // its blow of this round: its own clock's, or not given (worked once for the round, by its own places then)
      const q = time / per + (b.ph ?? 0) - 0.06, key = Math.floor(q), since = (q - key) * per; let no = 0;
      if (since < C.AIR && la < 0.59 * len + C.WAY + C.SOFT + (speed + 1) * (C.AIR + 1)) {
        if (bKey[i] !== key) { const t0 = time - since; bKey[i] = key; bNone[i] = under(b, t0) > C.BLOW || under(b, t0 + 1) > C.BLOW ? 1 : 0; }
        no = bNone[i];
      }
      st.x[i] = px; st.z[i] = pz; st.la[i] = la; st.d[i] = d; st.wd[i] = wd; none[i] = no;
      if (wd <= 0 && !no) {
        // beyond the lane's reach: its own clock's ('not kept')
        if (k[0] !== 0 || k[6] !== -1e4) { k[0] = 0; k[1] = 0; k[2] = 0; k[3] = 0; k[4] = 0; k[5] = 0; k[6] = -1e4; }
        const far = la - (0.59 * len + C.WAY + C.SOFT) - C.REST;
        if (far > 0) wake[i] = time + far / (1.6 * speed + 1);
        own[i] = 0; seen[i] = 1;
        continue;
      }
      seen[i] = 2; own[i] = 1;
      wayPose(TAU * (time / per + (b.ph ?? 0)), per, b, speed, pc);
      // the lane's depth at its place, and the slope of the easing along the way it heads
      const dip = Math.max(0, pc[0] + C.DEPTH + C.TOP * len), u = wayClamp((d - C.WAY) / C.SOFT, 0, 1);
      const slope = dip * 6 * u * (1 - u) / C.SOFT * away;
      k[0] = 1; k[1] = pc[0] - wd * dip; k[2] = pc[1] * (1 - wd) + Math.atan(wayClamp(slope, -0.6, 0.6)); k[3] = pc[2] * (1 - wd); k[4] = pc[3] * (1 - wd); k[5] = 0; k[6] = no ? -2e4 : -1e4;
      st.y[i] = k[1];
    }
    has = true; prevT = time;
    return st;
  };
  // (lane(b, t): how far the lane has whale b at world second t, 0 .. 1: for the proofs)
  // (dist, at: the body's own distance to the line and the lane's weight at a distance, for a whale the world
  // places by hand on a round of its own, the newborn)
  return { step, state: st, lay, place, roll: wayRoll, pose: wayPose, under, dist: bodyD, at: laneAt, lane: (b, t) => { const p = place(b, t); return laneAt(bodyD(p[0], p[1], p[2], p[3], b.len)[0]); } };
}
// <<< WAY

// A whale of the herd as the world writes it down. Everything has a default, so a record can be short.
// r, th, w: ring radius (m at lake shape 1), start angle, angular speed (rad/s). len: metres.
// ph, per, y, amp: the roll through the surface (phase 0..1, period s, mean height of the axis, amplitude).
// roll, swim, fluke, seed; yaw, yawW, pitch, rollO; tint [r,g,b], calf 0..1
function packWhale(o, i, A) {
  const seed = o.seed ?? 0.5, t = o.tint || [1, 1, 1];
  A.iA.setXYZW(i, o.r, o.th, o.w || 0, o.len);
  A.iB.setXYZW(i, o.ph ?? 0, o.per ?? 10, o.y ?? -0.9, o.amp ?? 0);
  A.iC.setXYZW(i, o.roll || 0, o.swim ?? 0.02, o.fluke || 0, seed);
  if (A.iD) A.iD.setXYZW(i, o.yaw || 0, o.yawW || 0, o.pitch || 0, o.rollO || 0);
  if (A.iE) A.iE.setXYZW(i, t[0], t[1], t[2], o.calf || 0);
  if (A.iG) A.iG.setXYZW(i, o.arcC || 0, o.arcH ?? 4, o.hold ? 1 : 0, o.arch || 0);
}

export async function makeWhaleKit(ctx, opts = {}) {
  const rng = (opts.rng || ctx.rng).fork('whale-kit');
  const tSkin = makeSkinTexture(rng);
  await ctx.yield();
  const tWrinkle = await makeWrinkleTexture(rng, () => ctx.yield());
  await ctx.yield();
  const U = {
    uTime: { value: 0 }, uLake: { value: new THREE.Vector4(0, 0, 150, 0) }, uShape: { value: new THREE.Vector4(0, 0, 0, 0) },
    uBoat: { value: new THREE.Vector4(1e6, 1e6, 0, -1) }, uLane: { value: new THREE.Vector4(0, -1, 16, 0) },
    uTurq: { value: new THREE.Color('#1fa7c9') }, uCobalt: { value: new THREE.Color('#0d3b8f') }, uSeaDeep: { value: new THREE.Color('#0b2f7a') }, uSeaFire: { value: new THREE.Color(0, 0, 0) },
    uClear: { value: new THREE.Vector2(0.03, 0.3) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.75, 0.55).normalize() }, uSunCol: { value: new THREE.Color(3.0, 2.85, 2.5) },
    uSkyCol: { value: new THREE.Color(0.55, 0.75, 1.05) }, uBounce: { value: new THREE.Color(0.12, 0.3, 0.45) },
    uFogCol: { value: new THREE.Color(0.6, 0.75, 0.95) }, uFogDen: { value: 0.0004 },
    uSkin: { value: new THREE.Color('#3d4044') }, uScar: { value: new THREE.Color('#756e68') }, uSkyRefl: { value: new THREE.Color(0.7, 0.9, 1.2) }, uWet: { value: 1 },
    tSkin: { value: tSkin }, tWrinkle: { value: tWrinkle },
    uWave: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(1, 0, 0.2, 0)) }, uSwell: { value: [0, 1].map(() => new THREE.Vector4(0, 0.07, 0, 0)) },
    uWind: { value: new THREE.Vector3(0.9, 0.25, 0.3) }, uSpoutLit: { value: new THREE.Color(1.5, 1.52, 1.55) }, uSpoutShade: { value: new THREE.Color(0.5, 0.62, 0.85) },
    uRanks: { value: new THREE.Vector4(1.08, 0.12, 0, 0) }, uPhase: { value: new THREE.Vector4(0, 0, 0, 0) }, uWavePh: { value: [0, 1.7, 3.4, 5.1, 6.8, 8.5] },
    uBow: { value: 1 }, uFoam: { value: new THREE.Color(1.1, 1.14, 1.18) },
    uGateL: { value: new THREE.Vector4(0, 0, 0, 0) }, uGateCol: { value: new THREE.Color(0, 0, 0) },
    // (the bed's chart and the sea's light: the world sets its own; alone, deep water everywhere)
    tShoal: { value: new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1) }, uShoal: { value: new THREE.Vector2(0, 60) }, uSeaLit: { value: 1 },
  };
  U.tShoal.value.needsUpdate = true;
  const geo = {};
  for (const [name, o] of [['hi', { lod: 'hi' }], ['calf', { lod: 'hi', calf: true }], ['newborn', { lod: 'hi', calf: true, cord: true }], ['full', { lod: 'full' }], ['plain', { lod: 'plain' }], ['mid', { lod: 'mid' }], ['far', { lod: 'far' }]]) {
    geo[name] = whaleGeometry(o);
    await ctx.yield();
  }
  const whaleMat = (defines, side) => new THREE.ShaderMaterial({ uniforms: U, defines, vertexShader: WHALE_VERT, fragmentShader: WHALE_FRAG, side: side || THREE.FrontSide });
  const mats = { herd: whaleMat({}), far: whaleMat({ FAR: 1 }, THREE.DoubleSide), actor: whaleMat({ DIRECT: 1 }), hideable: whaleMat({ HIDEABLE: 1 }) };

  // instanced whales swimming their rounds on the GPU
  // (hideable = true: each whale can be left out for a frame, show(i, on), while kit.pool draws it in another make)
  function herd(list, lod = 'mid', hideable = false) {
    const { geometry, attr } = instanced(geo[lod], list.length, [['iA', 4], ['iB', 4], ['iC', 4], ['iD', 4], ['iE', 4], ['iG', 4]]);
    list.forEach((o, i) => packWhale(o, i, attr));
    const keepW = keepAttrs(geometry, list.length);
    let iN = null;
    if (hideable) { iN = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(list.length, 1)).fill(1), 1); iN.setUsage(THREE.DynamicDrawUsage); geometry.setAttribute('iN', iN); }
    const mesh = new THREE.Mesh(geometry, lod === 'far' ? mats.far : hideable ? mats.hideable : mats.herd); mesh.frustumCulled = false;
    return { object: mesh, count: list.length, triangles: list.length * geo[lod].index.count / 3, keep(i, v) { keepW(i, 1, v); },
      show(i, on) { const v = on ? 1 : 0; if (iN.array[i] !== v) { iN.array[i] = v; iN.needsUpdate = true; } } };
  }
  // n places for whales of the herd drawn in another make for a while: put(i, record) writes a herd record into
  // place i (the same record, so the same whale in the same pose), done(k) empties the places from k on
  function pool(n, lod = 'full') {
    const { geometry, attr } = instanced(geo[lod], n, [['iA', 4], ['iB', 4], ['iC', 4], ['iD', 4], ['iE', 4], ['iG', 4]], true);
    for (let i = 0; i < n; i++) { attr.iA.setXYZW(i, 1, 0, 0, 0); attr.iB.setXYZW(i, 0, 10, -900, 0); attr.iE.setXYZW(i, 1, 1, 1, 0); attr.iG.setXYZW(i, 0, 4, 0, 0); }
    const mesh = new THREE.Mesh(geometry, mats.herd); mesh.frustumCulled = false;
    const who = new Array(n).fill(null), keepW = keepAttrs(geometry, n);
    return { object: mesh, count: n,
      // (o.keep: what the world writes for this whale this frame, if it keeps it)
      put(i, o) { keepW(i, 1, o.keep || KEEP_NONE); if (who[i] === o) return; who[i] = o; packWhale(o, i, attr); for (const k in attr) attr[k].needsUpdate = true; },
      done(k) { for (let i = k; i < n; i++) if (who[i] !== null) { who[i] = null; keepW(i, 1, KEEP_NONE); attr.iA.setW(i, 0); attr.iB.setZ(i, -900); attr.iA.needsUpdate = attr.iB.needsUpdate = true; } } };
  }
  // a few whales placed by hand every frame: set(i, { x, y, z, yaw, pitch, roll, len, tail, fluke, swim, tint, calf })
  function actors(n, shape = 'hi', withWash = false) {
    const { geometry, attr } = instanced(geo[shape], n, [['iA', 4], ['iB', 4], ['iC', 4], ['iE', 4], ['iH', 1]], true);
    for (let i = 0; i < n; i++) { attr.iA.setXYZW(i, 0, 0, 0, 0); attr.iB.setXYZW(i, -500, 0, 0, 0); attr.iE.setXYZW(i, 1, 1, 1, 0); attr.iH.setX(i, FLOOR); }
    const mesh = new THREE.Mesh(geometry, mats.actor); mesh.frustumCulled = false;
    let washMesh = null;
    if (withWash) {
      // the white water round each of them: the same instance data on the wash's own sheet
      const g = new THREE.InstancedBufferGeometry(); g.index = washGeo.index;
      for (const k of Object.keys(washGeo.attributes)) g.setAttribute(k, washGeo.attributes[k]);
      g.setAttribute('iA', attr.iA); g.setAttribute('iB', attr.iB); g.setAttribute('iC', attr.iC);
      g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      washMesh = new THREE.Mesh(g, washMatDirect); washMesh.frustumCulled = false; washMesh.renderOrder = 2;
    }
    return {
      object: mesh, wash: washMesh, count: n,
      set(i, o) {
        attr.iA.setXYZW(i, o.x, o.z, o.yaw || 0, o.len); attr.iB.setXYZW(i, o.y, o.pitch || 0, o.roll || 0, o.tail || 0);
        attr.iC.setXYZW(i, o.fluke || 0, o.swim ?? 0.02, o.speed || 0, o.arch || 0);
        if (o.tint) attr.iE.setXYZW(i, o.tint[0], o.tint[1], o.tint[2], o.calf || 0);
        // (o.hide: this whale's out-of-sight depth where it is another than the floor's)
        const hd = o.hide || FLOOR; if (attr.iH.getX(i) !== hd) { attr.iH.setX(i, hd); attr.iH.needsUpdate = true; }
        attr.iA.needsUpdate = attr.iB.needsUpdate = attr.iC.needsUpdate = true; if (o.tint) attr.iE.needsUpdate = true;
      },
    };
  }

  // ---------------------------------------------------------------------------- the blows
  const quad = new THREE.BufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const PUFF_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uFogCol, uSpoutLit, uSpoutShade; uniform float uBow;
varying vec2 vQ; varying vec4 vP; varying vec3 vDir;
${GLSL_HASH}
void main(){
  float r = length(vQ);
  float n = slNoise(vQ*2.3 + vP.z*31. + vec2(0., -vP.y*1.6)), n2 = slNoise(vQ*5.5 - vP.z*17.);
  // spray, not a ball: the drop's edge is ragged and its body thin enough to see through
  float a = 1. - smoothstep(0.05, 1., r);
  a = smoothstep(0.18, 0.9, a*(0.3 + 1.0*n + 0.5*n2))*vP.x;
  if (a < 0.004) discard;
  vec3 dir = normalize(vDir + vec3(0., 1e-5, 0.));
  float sunward = clamp(dot(dir, uSunDir), 0., 1.);
  vec3 col = mix(uSpoutShade, uSpoutLit, clamp(0.55 + 0.5*vQ.y + 0.35*(n - 0.5), 0., 1.));
  // against the light the spray's rim burns
  col += uSunCol*(0.35*sunward*sunward*sunward*sunward + 0.5*pow(sunward, 24.))*(1. - 0.6*a);
  // a piece of rainbow where the mist stands 42 degrees from the point opposite the sun
  float ang = acos(clamp(dot(dir, -uSunDir), -1., 1.));
  float band = (ang - 0.69)/0.07;
  float inBow = smoothstep(0., 0.2, band)*(1. - smoothstep(0.8, 1., band));
  vec3 hue = clamp(vec3(1.5 - abs(band*4. - 3.2), 1.5 - abs(band*4. - 2.1), 1.5 - abs(band*4. - 1.0)), 0., 1.);
  col = mix(col, hue*uSunCol*0.62, inBow*uBow*(0.45 + 0.3*n));
  col = mix(col, uFogCol, clamp(vP.w, 0., 1.));
  gl_FragColor = vec4(col*a, a);
}`;
  const puffMat = (vert, defines) => new THREE.ShaderMaterial({
    uniforms: U, defines: defines || {}, vertexShader: vert, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  // THE BLOW IS SPRAY: one bushy jet thrown forward and to the left at forty-five degrees from the front of the head.
  // iS = (when in the blow this drop leaves, 0..1; when in the whale's round it blows; H = the jet's height in metres;
  // seed). A blow lasts a second at the nozzle; each drop leaves at 3.1 H metres a second and is spent within 1.4 H
  // metres (so the jet stands H high), spreading, leaning downwind, falling back as fine rain, gone in three to four
  // seconds. A drop is a tenth of H across at its birth (never more than 0.34 m) and grows as it thins to three
  // tenths of H, 1.2 m at the most (a bull's blow is more drops, not bigger ones). Every drop is drawn out along its
  // way while it is young (so the jet reads as strokes of spray, not as balls) and rounds as it slows; two drops in five
  // are streaks drawn out along their way. Far blows (FARPLUME) are two bright slanted streaks to a whale.
  const SPOUT_VERT = /* glsl */`
attribute vec4 iA, iB, iC, iD, iG, iS, iR, iQ;
uniform float uFogDen; uniform vec3 uWind;
varying vec2 vQ; varying vec4 vP; varying vec3 vDir;
${GLSL_HERD}
${GLSL_SEA}
${GLSL_HASH}
vec3 dropAt(vec3 hole, vec3 jet, vec3 fwd3, float v0, float sp, float age, float h3){
  return hole + jet*v0*(1. - exp(-age*2.2))/2.2 + fwd3*sp*0.3*(1. - exp(-age*1.2))/1.2 + uWind*age*(0.35 + 0.5*h3) + vec3(0., -0.22*age*age, 0.);
}
void main(){
  float per = max(iB.y, 1.);
  float since = fract(uTime/per + iB.x - iS.y)*per;
  float age = since - iS.x;
  if (age < 0.) age += per;
  // A KEPT WHALE'S BLOWS (Q.z, written by the world): -1e4 = its own clock's, as every other whale's; -2e4 = this
  // blow is not given (the lane of deep water had the whale under at the second its own clock's blow began: see
  // the WAY block). A blow is whole or not at all. Every blow is its whale's own clock's: its drops age on the
  // world clock and the jet's height is drawn out of the whale's seed and the number of its round.
  float shown = 1., round0 = floor(uTime/per + iB.x - iS.y);
  if (iR.x > 0.5 && iQ.z < -15000.) shown = 0.;
  float h1 = slHash(iS.w), h2 = slHash(iS.w + 7.31), h3 = slHash(iS.w + 3.17);
  float life = min(3. + h1, per*0.95);
  float k = clamp(age/life, 0., 1.);
  // (a blow stands where its whale's own round had its head when the drop left, kept or not)
  Whale w = whaleAt(iA, iB, iC, iD, iG, vec4(0.), iQ, uTime - age);
  vec3 n = vec3(0., 1., 0.);
  vec3 hole = whalePlace(w, iA.w, vec3(0.034, 0.103, 0.462), vec2(0.), 0., 0., n);
  float headOut = smoothstep(-0.3, 0.1, hole.y);
  hole = max(hole, vec3(-1e6, 0.1, -1e6)) + vec3(0., swellAt(hole.xz), 0.);
  vec3 fwd3 = vec3(w.fwd.x, 0., w.fwd.y), left = vec3(w.fwd.y, 0., -w.fwd.x);
  float H = iS.z*(0.75 + 0.5*slHash(iC.w*91. + round0));
  vec3 jet = normalize(fwd3*0.6 + left*0.37 + vec3(0., 0.71, 0.) + 0.3*vec3(h1 - 0.5, h2 - 0.5, h3 - 0.5));
  float v0 = 3.1*H*(0.7 + 0.6*h2);
  vec3 p = dropAt(hole, jet, fwd3, v0, w.speed, age, h3), p0 = dropAt(hole, jet, fwd3, v0, w.speed, max(age - 0.15, 0.), h3);
#ifdef FARPLUME
  float size = H*0.3*(1. + k), stretch = 2.6;
  float alpha = smoothstep(0., 0.05, k)*(1. - k)*headOut*step(age, life);
#else
  float size = min(H*(0.1 + 0.2*sqrt(k)), 0.34 + 0.85*sqrt(k))*(0.75 + 0.5*h3), stretch = 1. + (h3 < 0.4 ? 2.4 : 1.1)*(1. - smoothstep(0.05, 0.6, k));
  float alpha = smoothstep(0., 0.04, k)*(1. - k)*headOut*step(age, life)*(0.55 + 0.3*h2);
#endif
  alpha *= shown;
  vec4 mv = viewMatrix*vec4(p, 1.), mv0 = viewMatrix*vec4(p0, 1.);
  vec2 ax = mv.xy - mv0.xy; float al = length(ax); ax = al > 1e-4 ? ax/al : vec2(0., 1.);
  float dist = length(mv.xyz);
  // A BLOW IS A MEDIUM, passed through: close to the lens it thins, its opacity falling with the true distance to
  // the lens (whole at seven metres, nothing at a metre and a half; no step). Nothing of a blow reads the boat.
  alpha *= smoothstep(1.5, 7., dist);
  // SEEN NEAR (within seventy metres of the eye, whole within thirty: a rule of nearness in metres) a blow is a
  // mist: each drop is drawn larger, thinner and less drawn out, so that the drops run into one another and the
  // jet stands as one soft plume; far off they are the small bright strokes they were.
  float nearB = 1. - smoothstep(30., 70., dist);
  size *= 1. + 1.5*nearB; alpha *= 1. - 0.45*nearB; stretch = mix(stretch, 1. + 0.45*(stretch - 1.), nearB);
  mv.xy += (vec2(ax.y, -ax.x)*position.x*(1.5/(0.5 + stretch)) + ax*position.y*stretch)*size;
  vQ = position.xy; vDir = p - cameraPosition;
  float fd = uFogDen*dist;
  vP = vec4(alpha, k, iS.w, (1. - exp(-fd*fd))*0.8);
  gl_Position = projectionMatrix*mv;
}`;
  const spoutMat = puffMat(SPOUT_VERT), plumeMat = puffMat(SPOUT_VERT, { FARPLUME: 1 });
  // list: [{ whale: record, n: particles, ph: when in the whale's cycle it blows (0..1), size }]
  // far = true: the far whales' short bright slanted plumes
  function spouts(list, far) {
    let total = 0; for (const s of list) total += s.n;
    const { geometry, attr } = instanced(quad, total, [['iA', 4], ['iB', 4], ['iC', 4], ['iD', 4], ['iG', 4], ['iS', 4]]);
    let i = 0; const first = [], keepW = keepAttrs(geometry, total);
    for (const s of list) { first.push(i); for (let j = 0; j < s.n; j++, i++) {
      packWhale(s.whale, i, attr);
      attr.iS.setXYZW(i, far ? 0.5 * j : (j + 0.5 * ((i * 7) % 3) / 3) / s.n, s.ph, s.size, ((i * 0.6180339) % 1) * 97 + 1);
    } }
    const mesh = new THREE.Mesh(geometry, far ? plumeMat : spoutMat); mesh.frustumCulled = false; mesh.renderOrder = 3;
    return { object: mesh, count: total, triangles: total * 2, keep(k, v) { keepW(first[k], list[k].n, v); } };
  }
  // blows and splashes started by hand: fire(i, x, y, z, dx, dy, dz, size, time, kind, soft). kind 0 a blow (size = the
  // jet's height H in metres, the same spray as the herd's), kind 1 a splash (a crown of drops thrown up, falling back)
  const HAND_VERT = /* glsl */`
attribute vec4 iO, iV, iS;
uniform float uFogDen, uTime; uniform vec3 uWind;
varying vec2 vQ; varying vec4 vP; varying vec3 vDir;
${GLSL_HASH}
vec3 dropAt(vec3 jet, float v0, float ag, float h3){
  float dr = mix(2.2, 1.5, iS.z);
  vec3 p = iO.xyz + jet*v0*(1. - exp(-ag*dr))/dr + uWind*ag*mix(0.35 + 0.5*h3, 0.4, iS.z) + vec3(0., -mix(0.22, 2.2, iS.z)*ag*ag, 0.);
  p.y = max(p.y, iO.y - 0.12);
  return p;
}
void main(){
  float age = uTime - iO.w - iS.x*mix(1., 0.25, iS.z);
  float h1 = slHash(iS.w), h2 = slHash(iS.w + 7.31), h3 = slHash(iS.w + 3.17);
  float life = mix(3. + h1, 2.2 + 1.2*h1, iS.z);
  float k = clamp(age/life, 0., 1.);
  vec3 jet = normalize(iV.xyz + mix(0.3, 1.5, iS.z)*vec3(h1 - 0.5, h2 - 0.3, h3 - 0.5));
  float v0 = iV.w*mix(3.1*(0.7 + 0.6*h2), 2.6 + 3.2*h2, iS.z), ag = max(age, 0.);
  vec3 p = dropAt(jet, v0, ag, h3), p0 = dropAt(jet, v0, max(ag - 0.15, 0.), h3);
  float size = mix(min(iV.w*(0.1 + 0.2*sqrt(k)), 0.34 + 0.85*sqrt(k)), iV.w*(0.07 + 0.2*sqrt(k)), iS.z)*(0.75 + 0.5*h3)*(1. + 0.5*iS.y);
  float stretch = 1. + (h3 < 0.4 ? 2.4 : 1.1)*(1. - smoothstep(0.05, 0.6, k));
  float alpha = smoothstep(0., 0.05, k)*(1. - k)*step(0., age)*step(age, life)*mix(0.55 + 0.3*h2, 0.6 + 0.3*h2, iS.z)*(1. - 0.4*iS.y);
  vec4 mv = viewMatrix*vec4(p, 1.), mv0 = viewMatrix*vec4(p0, 1.);
  vec2 ax = mv.xy - mv0.xy; float al = length(ax); ax = al > 1e-4 ? ax/al : vec2(0., 1.);
  float dist = length(mv.xyz);
  // (spray is a medium: close to the lens it thins by the true distance to the lens, as a blow does; it reads no boat)
  alpha *= smoothstep(1.5, 7., dist);
  // A SPLASH SEEN FROM FAR OFF is one body of white water, not a handful of strokes (against a dark shore a far
  // leap's crown stood as white flecks on the rock): beyond fifty metres each drop of a splash is drawn larger,
  // softer and less drawn out, so the drops run together; by a hundred and ten metres wholly so. Near, the crown
  // is the separate drops it was.
  float farS = iS.z*smoothstep(50., 110., dist);
  size *= 1. + 1.8*farS; alpha *= 1. - 0.3*farS; stretch = mix(stretch, 1. + 0.25*(stretch - 1.), farS);
  mv.xy += (vec2(ax.y, -ax.x)*position.x*(1.5/(0.5 + stretch)) + ax*position.y*stretch)*size;
  vQ = position.xy; vDir = p - cameraPosition;
  float fd = uFogDen*dist;
  vP = vec4(alpha, k, iS.w, (1. - exp(-fd*fd))*0.8);
  gl_Position = projectionMatrix*mv;
}`;
  const handMat = puffMat(HAND_VERT);
  function puffs(n, per = 10) {
    const { geometry, attr } = instanced(quad, n * per, [['iO', 4], ['iV', 4], ['iS', 4]], true);
    for (let i = 0; i < n * per; i++) { attr.iO.setXYZW(i, 0, -50, 0, -1e4); attr.iV.setXYZW(i, 0, 1, 0, 1); attr.iS.setXYZW(i, (i % per) / per, 0, 0, ((i * 0.6180339) % 1) * 97 + 1); }
    const mesh = new THREE.Mesh(geometry, handMat); mesh.frustumCulled = false; mesh.renderOrder = 3;
    return {
      object: mesh, count: n * per,
      fire(e, x, y, z, dx, dy, dz, size, time, kind = 0, soft = 0) {
        for (let j = 0; j < per; j++) { const i = e * per + j; attr.iO.setXYZW(i, x, y, z, time); attr.iV.setXYZW(i, dx, dy, dz, size); attr.iS.setY(i, soft); attr.iS.setZ(i, kind); }
        attr.iO.needsUpdate = attr.iV.needsUpdate = attr.iS.needsUpdate = true;
      },
    };
  }

  // ---------------------------------------------------------------------------- white water round a whale at the surface
  const WASH_VERT = /* glsl */`
attribute vec4 iA, iB, iC;
#ifndef DIRECT
attribute vec4 iD, iG, iR, iQ;
#endif
uniform float uFogDen;
varying vec2 vL; varying vec3 vWp; varying vec3 vK; varying vec4 vM; varying vec2 vC; varying vec2 vO;
${GLSL_HERD}
${GLSL_SEA}
// the body's back and beam along its length (s = 0 the snout, 1 the flukes), in shares of its length
float topP(float s){ return mix(0.1, 0.012, smoothstep(0.42, 0.97, s)); }
float widP(float s){ return 0.004 + 0.074*(1. - smoothstep(0.48, 0.95, s)); }
// metres by which the back at station s stands out of the water in the whale's pose
float outAt(Whale w, float len, float s){
  float z = 0.5 - s;
  return w.pos.y + len*(sin(w.pitch)*z + cos(w.pitch)*topP(s) - 0.5*w.arch*(z*z - 0.0833));
}
void main(){
#ifdef DIRECT
  Whale w = whaleDirect(iA, iB, iC);
#else
  Whale w = whaleAt(iA, iB, iC, iD, iG, iR, iQ, uTime);
#endif
  float len = iA.w;
  // a sheet from a little ahead of the snout to a length and a half astern, its rows thick about the head
  float t = 0.5 - 0.5*position.y, tp = t*sqrt(sqrt(t)*sqrt(sqrt(t)));
  float along = 0.62 - 2.5*t*sqrt(tp);
  float s = 0.5 - along, sc = clamp(s, 0., 1.);
  float outH = outAt(w, len, sc);
  float emerge = smoothstep(-0.22, 0.2, outH);
  float wakeK = max(max(smoothstep(-0.1, 0.3, outAt(w, len, 0.08)), smoothstep(-0.1, 0.3, outAt(w, len, 0.36))), smoothstep(-0.1, 0.3, outAt(w, len, 0.66)));
  // the half breadth of the body where the water cuts it
  float hw = len*widP(sc)*clamp(sqrt(max(outH, 0.)/(0.09*len)), 0.25, 1.);
  float ax = abs(position.x), lx = sign(position.x)*ax*sqrt(ax)*len*(0.2 + 0.18*clamp(s, 0., 2.));
  vec2 side = vec2(w.fwd.y, -w.fwd.x);
  vec2 xz = w.pos.xz + side*lx + w.fwd*(along*len);
  float calm = calmAt(xz);
  // white water comes of the whale's own way and of the sea breaking on one that lies still
  float spd = max(0.22 + 0.78*clamp(w.speed/3., 0., 1.), 0.7*roughAt(xz));
  // form: the water pushed up before the head, and standing against the flanks
  float d = length(vec2(max(abs(lx) - hw, 0.), max(-s, 0.)*len));
  float lift = len*(0.034*spd*(1. - smoothstep(0.05, 0.45, s))*exp(-d/(0.055*len)) + 0.01*exp(-d/(0.035*len)))*emerge*(1. - 0.7*calm);
  // (the water piled against a body never stands higher than the back it is piled against)
  lift = min(lift, 0.02 + 0.7*max(outH, 0.));
  vec3 wp = vec3(xz.x, waveH(xz, uTime) + 0.05 + lift, xz.y);
  vL = vec2(lx, s); vWp = wp;
  vC = vec2(calm, (1. - smoothstep(0.72, 1., ax))*(1. - smoothstep(0.86, 1., position.y)));
  vM = vec4(hw, wakeK, len*widP(sc), len);
  // how high the back stands out of the water here, and on which side of the body the eye is
  vO = vec2(max(outH, 0.), dot(cameraPosition.xz - w.pos.xz, side));
  vec4 mv = viewMatrix*vec4(wp, 1.);
  float fd = uFogDen*length(mv.xyz);
  vK = vec3(emerge, spd, 1. - exp(-fd*fd));
  gl_Position = projectionMatrix*mv;
}`;
  const WASH_FRAG = /* glsl */`
uniform vec3 uFoam, uTurq, uFogCol, uSkin, uSkyCol; uniform float uTime;
varying vec2 vL; varying vec3 vWp; varying vec3 vK; varying vec4 vM; varying vec2 vC; varying vec2 vO;
${GLSL_HASH}
void main(){
  float ax = abs(vL.x), s = vL.y, len = max(vM.w, 1.), hw = vM.x, calm = clamp(vC.x, 0., 1.), spd = clamp(vK.y, 0., 1.);
  // metres out from the body's side, or from its snout ahead of it
  float d = length(vec2(max(ax - hw, 0.), max(-s, 0.)*len));
  float n = 0.55*slNoise(vWp.xz*1.1 + vec2(uTime*0.3, 0.)) + 0.45*slNoise(vWp.xz*3.1 - vec2(0., uTime*0.5));
  float n2 = slNoise(vWp.xz*8. + vec2(uTime*0.2, uTime*0.4));
  float onBody = 1. - smoothstep(1., 1.06, s);
  // white water against the body: a collar that boils at the head and widens down the flank
  float reach = (0.3 + 1.7*max(vM.z, 0.)*(0.4 + 0.6*spd))*(1. - 0.6*calm);
  // (only where the back truly stands out of the water: one that lies awash or has just gone under carries no
  // white sheet in its own shape;
  // and none over the back itself: the white lies along the waterline and outside it, and before the snout)
  // (AND ONLY WHERE THE BODY IS IN THE SURFACE: where its back stands higher over the water than the whole body is
  // deep, a fifth of its length, that part of it is in the air (a leap, a head thrown up) and the water under it
  // carries neither a collar nor a waterline nor the body's image; they lie round where it goes through the surface)
  float inW = 1. - smoothstep(0.2*len, 0.2*len + 0.6, vO.x);
  float collar = (1. - smoothstep(0., reach, d))*clamp(vK.x, 0., 1.)*onBody*smoothstep(0.03, 0.3, vO.x)*mix(1., smoothstep(0.45*hw, 0.95*hw, ax), step(0., s))*inW;
  float foam = smoothstep(0.45, 0.8, collar*(0.35 + 1.1*n))*(0.4 + 0.6*smoothstep(0.25, 0.6, n2))*(0.3 + 0.7*spd)*mix(1., 0.45, calm);
  // astern: bubbles and green-white water, widening and fading over a length and a half
  float tt = clamp((s - 0.55)/1.75, 0., 1.), wT = len*(0.07 + 0.11*tt);
  float bub = smoothstep(0.42, 0.8, 0.6*n + 0.5*n2);
  float trail = (1. - smoothstep(0.35*wT, wT, ax))*smoothstep(0., 0.12, tt)*(1. - tt)*(1. - tt)*clamp(vM.y, 0., 1.)*spd*mix(1., 0.5, calm);
  float tA = trail*(0.3 + 0.7*bub);
  float halo = collar*collar*0.3*spd;
  // on the sleek: rings going out from where the body lies in the surface
  // (round the whole body, as round an egg: its half length and its half beam)
  float eb = max(vM.z, 0.03*len) + 0.4, dR = (length(vec2(vL.x/eb, (s - 0.5)*len/(0.52*len))) - 1.)*eb;
  float rings = (0.5 + 0.5*sin(dR*2.4 - uTime*1.5))*smoothstep(0.2, 1.2, dR)*(1. - smoothstep(0.08*len, 0.2*len, dR))*clamp(vK.x, 0., 1.)*calm;
  // (on the calm a back that breaks the surface lies in a pale ring: a thread of white close along its waterline)
  float thread = (1. - smoothstep(0.04, 0.3 + 0.25*n, d))*smoothstep(0.03, 0.2, vO.x)*clamp(vK.x, 0., 1.)*onBody*calm*inW*(0.35 + 0.45*n2);
  float a = clamp(foam*0.95 + max(tA*0.85, halo) + rings*0.26 + thread, 0., 1.)*clamp(vC.y, 0., 1.);
  // THE BACK DOUBLED IN THE CALM. Seen low, the water on our side of a body gives back the body and not the sky: its
  // dark image lies out from the waterline as far as the back stands high, drawn out by the lowness of the look
  // (a mirror only at a glance: looked down on, the water is clear). And all round the body a dark line where the
  // water meets it.
  vec3 Vw = cameraPosition - vWp; float hv = max(length(Vw.xz), 1e-3), ve = max(Vw.y, 0.)/hv, sinE = ve*inversesqrt(1. + ve*ve);
  float fm = 1. - sinE; fm = 0.02 + 0.98*fm*fm*fm*fm*fm;
  float dW = max(ax - hw, 0.), reachM = vO.x/max(ve, 0.06);
  // (the image is there only at a glance, under about fifteen degrees: looked down on, the water is clear)
  float img = (1. - smoothstep(0.55*reachM, reachM + 0.05, dW))*step(0., vL.x*vO.y)*step(0.04, vO.x)*onBody*step(0., s)*fm*calm*clamp(vC.y, 0., 1.)*(1. - smoothstep(0.12, 0.28, sinE));
  float line = (1. - smoothstep(0.02, 0.22, d))*clamp(vK.x, 0., 1.)*onBody*calm*0.55*clamp(vC.y, 0., 1.)*inW;
  img *= inW;
  float dark = clamp(max(img*0.9, line)*(1. - a), 0., 1.);
  if (a + dark < 0.004) discard;
  vec3 aer = uTurq*0.75 + 0.35*uFoam;
  vec3 col = mix(aer, uFoam*(0.84 + 0.22*n2), clamp((foam*0.92 + 0.5*tA*bub + rings*0.1)/max(a, 1e-3), 0., 1.));
  col = (col*a + uSkin*uSkyCol*0.55*dark)/max(a + dark, 1e-3); a = a + dark;
  col = mix(col, uFogCol, clamp(vK.z, 0., 1.));
  gl_FragColor = vec4(col*a, a);
}`;
  const makeWashMat = (defines) => new THREE.ShaderMaterial({
    uniforms: U, defines, vertexShader: WASH_VERT, fragmentShader: WASH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  // (the sheet in 4 x 8 squares; a lighter one of 2 x 6 for the whales of the ranks)
  const washGeo = new THREE.PlaneGeometry(2, 2, 4, 8), washGeoLite = new THREE.PlaneGeometry(2, 2, 2, 6), washMat = makeWashMat({}), washMatDirect = makeWashMat({ DIRECT: 1 });
  function wash(list, lite) {
    const { geometry, attr } = instanced(lite ? washGeoLite : washGeo, list.length, [['iA', 4], ['iB', 4], ['iC', 4], ['iD', 4], ['iG', 4]]);
    list.forEach((o, i) => packWhale(o, i, attr));
    const mesh = new THREE.Mesh(geometry, washMat); mesh.frustumCulled = false; mesh.renderOrder = 2;
    const keepW = keepAttrs(geometry, list.length);
    return { object: mesh, count: list.length, triangles: list.length * (lite ? 24 : 64), keep(i, v) { keepW(i, 1, v); } };
  }

  // ---------------------------------------------------------------------------- a whale's shade in the water under it
  // A whale lying at the surface or near it keeps the sun off the water below: a soft dark shape of its own length
  // and breadth, four tenths of its length under it and down-sun of it by that depth (the light slants), seen
  // through the water like everything else below. One that has gone deep casts none here.
  const SHADE_VERT = /* glsl */`
attribute vec4 iA, iB, iC, iD, iG, iR, iQ;
uniform vec3 uSunDir; uniform float uFogDen; uniform vec2 uClear;
varying vec2 vQ; varying vec3 vK;
${GLSL_HERD}
${GLSL_REFRACT}
${GLSL_SEA}
void main(){
  Whale w = whaleAt(iA, iB, iC, iD, iG, iR, iQ, uTime);
  float len = iA.w, dS = 0.4*len;
  vec2 side = vec2(w.fwd.y, -w.fwd.x);
  vec2 c = w.pos.xz - uSunDir.xz*(dS*0.75/max(uSunDir.y, 0.35));
  vec2 xz = c + w.fwd*(position.y*0.56*len) + side*(position.x*0.15*len);
  vec3 wp = vec3(xz.x, min(w.pos.y, 0.) - dS, xz.y);
  vec4 ap = seenThroughWater(wp, vec3(cameraPosition.x, cameraPosition.y - swellAt(cameraPosition.xz), cameraPosition.z));
  ap.y += swellAt(wp.xz);
  vQ = position.xy;
  vec4 mv = viewMatrix*vec4(ap.xyz, 1.);
  float fd = uFogDen*length(mv.xyz);
  // (it is in the water: seen where one looks down into it, not at a glance, where the surface gives back the sky)
  vec3 Vw = cameraPosition - wp; float glance = smoothstep(0.17, 0.42, Vw.y*inversesqrt(max(dot(Vw, Vw), 1e-4)));
  // (and no plainer than the water over it lets it be: it goes with the light that reaches its depth and comes back,
  // by the water's own clearness there, so outside the calm it is faint and under a whale gone down it is gone)
  float calmS = calmAt(w.pos.xz);
  vK = vec3(smoothstep(-0.45*len, -0.12*len, w.pos.y)*glance*exp(-mix(uClear.y, uClear.x, calmS)*2.*max(-wp.y, 0.)), calmS, 1. - exp(-fd*fd));
  gl_Position = projectionMatrix*mv;
}`;
  const SHADE_FRAG = /* glsl */`
uniform vec3 uSeaDeep, uCobalt;
varying vec2 vQ; varying vec3 vK;
void main(){
  float r2 = clamp(dot(vQ, vQ), 0., 1.), e = (1. - r2)*(1. - r2);
  float a = e*clamp(vK.x, 0., 1.)*mix(0.34, 0.5, clamp(vK.y, 0., 1.))*(1. - clamp(vK.z, 0., 1.));
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uSeaDeep, uCobalt, 0.4)*0.3*a, a);
}`;
  const shadeMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
  function shade(list) {
    const { geometry, attr } = instanced(quad, list.length, [['iA', 4], ['iB', 4], ['iC', 4], ['iD', 4], ['iG', 4]]);
    list.forEach((o, i) => packWhale(o, i, attr));
    const mesh = new THREE.Mesh(geometry, shadeMat); mesh.frustumCulled = false; mesh.renderOrder = 0.3;
    const keepW = keepAttrs(geometry, list.length);
    return { object: mesh, count: list.length, triangles: list.length * 2, keep(i, v) { keepW(i, 1, v); } };
  }

  return { uniforms: U, geo, mats, herd, pool, actors, spouts, puffs, wash, shade };
}

// ------------------------------------------------------------------------------------------------ the set piece alone
// For judging the animal by itself: a cow swimming level with her calf at her flank and blowing; above her the same
// body rolled over so that its back is seen in plan; below, one going down for a dive with its back arched and its
// flukes up. In the world the whales are placed through kit.herd and kit.actors.
export async function buildHero(ctx, opts = {}) {
  const kit = opts.kit || await makeWhaleKit(ctx, opts);
  await ctx.yield();
  const object = new THREE.Group();
  const cows = kit.actors(3, 'hi'), calves = kit.actors(1, 'calf'), blow = kit.puffs(2, 12);
  object.add(cows.object, calves.object, blow.object);
  const cow = { x: 0, y: 4.6, z: 0, yaw: 0.0, pitch: 0.04, roll: 0, len: 11, tail: 0, swim: 0.03, arch: 0, tint: [1, 1, 1], calf: 0 };
  const plan = { x: 0.5, y: 9.4, z: -0.5, yaw: 0.0, pitch: 0, roll: 1.35, len: 11, tail: 0, swim: 0.03, arch: 0, tint: [1, 1, 1], calf: 0 };
  const diver = { x: 0.4, y: -0.6, z: 1.5, yaw: 0.1, pitch: -0.5, roll: 0, len: 11, tail: 0, swim: 0.015, arch: 0.75, fluke: 1, tint: [1, 1, 1], calf: 0 };
  const calf = { x: -3.3, y: 2.9, z: -1.2, yaw: 0.25, pitch: 0.12, roll: 0.5, len: 4.4, tail: 0, swim: 0.04, arch: 0.1, tint: [1.45, 1.45, 1.5], calf: 1 };
  return {
    object, kit, radius: 5.2, height: 9, center: new THREE.Vector3(0, 4.4, 0.4), anchors: { blowhole: new THREE.Vector3(0.37, 1.13, 5.08) },
    ground: false,
    update(dt, time) {
      kit.uniforms.uTime.value = time;
      cow.tail = time * 1.5; cow.y = 4.6 + 0.25 * Math.sin(time * 0.5); calf.tail = time * 2.2 + 1; calf.y = 2.9 + 0.25 * Math.sin(time * 0.5 + 0.6);
      plan.tail = time * 1.5 + 2; diver.tail = time * 1.2 + 4;
      cows.set(0, cow); cows.set(1, plan); cows.set(2, diver); calves.set(0, calf);
      // a blow every five seconds, whatever the clock shows when we come in: the two puffs hold this one and the last
      const k = Math.floor(time / 5), c = Math.cos(cow.yaw), s = Math.sin(cow.yaw);
      for (let j = 0; j < 2; j++) blow.fire((((k - j) % 2) + 2) % 2, cow.x + 0.37 * c + 5.08 * s, 5.75, cow.z - 0.37 * s + 5.08 * c, s * 0.6 + c * 0.37, 0.71, c * 0.6 - s * 0.37, 2.5, (k - j) * 5, 0);
    },
    dispose() {},
  };
}
