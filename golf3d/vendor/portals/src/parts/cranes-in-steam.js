// HERO SET PIECE for "cranes-in-steam": THE DANCE IN THE STEAM.
// Forty red-crowned cranes dancing in pairs on a gravel bar of a river that smokes instead of freezing,
// back lit by a rose sun 5 degrees up, in front of a dark 3 m cut bank furred with hoarfrosted reed and
// willow whips; a dozen more stand in the shallows at the downstream end and leave with the camera.
//
// LOCAL SPACE  origin = centre of the bar at WATER LEVEL (y = 0 is the river surface), +Y up.
//   The bar runs along X (80 m, x -40..+40), 14 m deep in Z, top 0.3 m above the water. The cut bank is
//   behind it (z about -8..-13, top y = 3). FRONT = +Z = the river: the camera flies DOWNSTREAM = +X along
//   z = +10.5, y = 2 (eye level with the cranes' heads), so the dance is on its LEFT and the sun (default
//   direction (0.34, 0.09, -0.94): 70 degrees left of +X, 5 degrees up) is behind the dancers.
//
// SIZE     radius 44 (bar half length), height 4.5 standing (a leap tops out at about 4 m; leavers climb to
//          the exit height). COST about 93k triangles, 7 draw calls, no lights, no textures, ~100 ms build.
//          (In the set-piece viewer the returned radius is 6 so that the orbit frames the dance; in a world it is 44.)
// LIGHT    every material here is its own ShaderMaterial lit by uniforms, not by scene lights:
//          hero.setLight({ sunDir, sunColor, sky, ground }) (linear colours; defaults: rose-gold #FFC9A0 x1.25
//          key, #8FA3CF x0.42 sky fill). Wants a low sun BEHIND the bar (-Z side), dark water in front, the
//          dark bank behind. Scene fog is honoured (fog: true) so the world's steam fog sits over everything.
// OPTS     palette  [water, white, rose, gold, skyBlue, violet, crownRed] hex strings (brief order)
//          count    dancers, 28..52 (default 40)          leavers   cranes that take off (default 12)
//          sunDir   [x,y,z] toward the sun, local space    exit      [x,y,z] local centre of the exit portal
//          hour     'dawn' | 'blue' | 'morning' | 'evening' | 'moon'   (tints light + steam, 'blue' has more sleepers)
//          weather  'still' | 'snow' | 'wind'   season 'winter' | 'thaw' (thaw: patchy snow on the bar)
//          steam    false to leave out the hero's own steam sprites; leaveSeconds (default 16); leaveStagger (s between leavers, 0.36)
//          roost    extra cranes standing in the shallows downstream of the bar that go up after `roostDelay` s (the rare event)
//          extraPairs  [{ kind: 'bow'|'leap'|'duet'|'idle'|'preen'|'sleep', x, z, ang, H, ph }] more pairs elsewhere in the world
//                      (the world's shoals), standing on extraGround(x, z) -> y; they dance, breathe and throw shadows like the rest
//          shadowLen, shadowK  length (m) and strength of the long blue shadow each standing crane throws away from the sun
//          coves    [x, ...] bays scalloped 1.7 m into the bar's lip (default four); two cranes wade in each, knee deep
//          extraDetail  geometry detail of the extra pairs (0.85); hero.setDance(seconds) drives their clock (shared.uDance);
//                      a pair may carry g (0, 1, 2 ...): the pairs of one g are one mesh, shown or hidden together (setShown)
//          lineDist (x, y, z) -> metres from a point of this space to the world's flown line. THE GUARD OF THE LIP: a tussock of the bar's lip
//                      any point of which (as dealt, with its blade's half width and its whole sway in this visit's wind) would stand within
//                      2.3 m of that line is not made; its draws are taken all the same, so every other tussock stands where it stood.
//                      Without lineDist every tussock is made. counts.lipTussocks / counts.lipNotMade say what was done.
// FLIGHT   seen from behind a flat wing is a hairline and a body an egg: the spread wing is arched (its rear half droops, so the
//          black secondaries show as a band under the white coverts), the body draws out and tapers on the wing, the legs trail
//          below the tail line, and the flyer's body is shaded matte (no pearl highlight)
// LAYOUT   two loose ranks of pairs along the lip, not ruled lines: rank A about 4.7 m from the camera line in knots of
//          two or three pairs (3-4 m apart) with 6-7 m of open gravel between the knots, rank B about 6.4 m off with
//          gaps of its own, a loose back rank under the bank, waders in the coves 3.85 m off. Every other pair of rank
//          A leaps and the rest bow, call, toss, preen, stand or sleep, each turned its own way, so from any point of
//          the pass several pairs stand 6-14 m away with wings open and no two neighbours hold the same pose.
// SHOWN    hero.setShown(bar, shoals): the cranes are meshes of one material (front ranks, the rest of the bar, the leavers,
//          and one per group g of the extra pairs); a world may hide the bar's or a group's while it is a long way off
//          (shoals: one flag for all groups or an array of flags by g; visible flags only: nothing is built or freed).
// PROGRESS hero.setProgress(p), p 0..1: the take-off. p = 0 the leavers stand in the shallows; as p rises
//          each runs three steps (feet planted, splash ring at each footfall), lifts and flies a straight
//          line through anchors.portalSeat. Position is a pure function of p (p * leaveSeconds of motion), so
//          map world u 0.83..1 -> p 0..1 for a real-time take-off at the brief's pace. Everything else
//          (dance, duet, breath, steam, frost fall) loops on `time` and is alive at p = 0.
// ANCHORS  flyThrough  ordered points of the safe camera line (bar pass at z=10.5,y=2, then the 6 degree climb)
//          closestPass point on that line nearest the front pair (world u 0.78)
//          lookAt      where the gaze should rest during the pass (centre of the dance, head height)
//          nearestPair foot point of the front pair (5 m from the line)      leapPair  the tallest leaper
//          portalSeat  { position, facing } centre of the 14 m portal and the direction it faces (back up the path)
//          leaveStart  centre of the take-off group        sunDir  the light direction the piece was built for
//          bankTop / barEnds  for seating terrain and trees (nothing of the hero is higher than y=5 behind z=-8)
// EXPORTS  buildHero (the contract) and makeCranes(ctx, list, opts): the same articulated crane for the
//          world's roosting groups / fly-overs: list of { x,y,z, heading, type, phase, period, scale, c:[4] }.
//          Types: 0 stand, 1 dance(bow+leap), 2 duet, 3 reed toss, 4 preen, 5 sleep on one leg, 6 leaver,
//          7 flyer (c = [start offset m, track length m, arc height m, tucked legs]: flies a straight track on the uTau clock at 12.6 m/s).
//          The piece is made to be seen from the river (+Z half); the far side is behind the bank.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#0B1620', '#F6F3F7', '#F4B8B0', '#FFC9A0', '#8FA3CF', '#5B5F8C', '#D4202A'];
const lin = (hex) => new THREE.Color(hex);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------------------------
// Shared GLSL: the crane rig. A pose is a handful of joint parameters computed per instance from its
// state (iB.x), phase and local time; every part of the bird (and the breath puffs and the tossed reed)
// is placed from the same functions, so feet stay planted and breath leaves the bill wherever it is.
// ---------------------------------------------------------------------------------------------------------
const RIG = /* glsl */`
#define PI 3.14159265
const float HIP_Y = 0.80; const float HIP_Z = -0.04; const float LEG1 = 0.40; const float LEG2 = 0.42;
const vec3 NECK0 = vec3(0.0, 1.02, 0.20); const float NECKL = 0.50; const float BILL = 0.25;
struct Pose { float pitch; float hip; float lift; float n0; float n1; float n2; float head; float hyaw;
  float open; float raise; float famp; float fph; float dangle; float trail; float legs; float nx;
  vec2 footL; vec2 footR; };
float cwin(float c, float a, float b, float f){ return smoothstep(a, a + f, c) * (1.0 - smoothstep(b - f, b, c)); }
Pose poseStand(float t, float ph){
  Pose P;
  P.pitch = 0.02 * sin(t * 0.7 + ph * 31.0); P.hip = 0.006 * sin(t * 1.3 + ph * 17.0); P.lift = 0.0;
  P.n0 = 0.75 + 0.05 * sin(t * 0.45 + ph * 40.0); P.n1 = -0.95; P.n2 = 0.30;
  P.head = -0.08 + 0.06 * sin(t * 0.6 + ph * 23.0); P.hyaw = 0.0;
  P.open = 0.0; P.raise = 0.0; P.famp = 0.0; P.fph = 0.0; P.dangle = 0.0; P.trail = 0.0; P.legs = 1.0; P.nx = 0.0;
  P.footL = vec2(0.0); P.footR = vec2(0.0);
  return P;
}
// distance run / height gained / climb fraction of a leaver at take-off clock tau
vec3 leaveKin(vec4 C, float tau){
  float tp = max(tau - C.x, 0.0);
  float tv = 2.8; float a = 4.5;
  float s = tp < tv ? 0.5 * a * tp * tp : 0.5 * a * tv * tv + a * tv * (tp - tv);
  float q = clamp((s - 3.6) / (C.y > 1.0 ? C.y : 55.0), 0.0, 1.0);
  return vec3(s, C.z * q * q * (3.0 - 2.0 * q), q);
}
vec2 gaitFoot(float psi, float S){
  if (psi < 0.36) return vec2(S * (0.18 - psi), 0.0);          // stance: slides back at exactly body speed
  float w = (psi - 0.36) / 0.64; float ws = w * w * (3.0 - 2.0 * w);
  return vec2(S * mix(-0.18, 0.18, ws), 0.26 * sin(PI * w));
}
Pose cranePose(vec4 B, vec4 C, float t, float tau){
  float ty = B.x; float ph = B.y; float T = max(B.z, 0.5);
  Pose P = poseStand(t, ph);
  float c = fract(t / T + ph);
  if (ty < 0.5) {                                   // stand: look about, now and then stretch the wings
    P.hyaw = 0.8 * sin(t * 0.37 + ph * 50.0) * smoothstep(0.2, 0.8, sin(t * 0.21 + ph * 20.0) * 0.5 + 0.5);
    float st = cwin(c, 0.55, 0.82, 0.09) * C.x;
    P.open = st; P.raise = 0.75 * st; P.famp = 0.45 * st; P.fph = t * 8.0; P.n0 -= 0.2 * st; P.n1 += 0.3 * st;
  } else if (ty < 1.5) {                            // dance: two bows, rise, crouch, leap, land
    float b = cwin(c, 0.0, 0.30, 0.05) * (0.5 - 0.5 * cos(c / 0.30 * 4.0 * PI));
    float tall = cwin(c, 0.30, 0.52, 0.07);
    float jump = step(0.01, C.x);
    float kr = cwin(c, 0.42, 0.52, 0.04) * jump;
    float ta = clamp((c - 0.50) / 0.22, 0.0, 1.0);
    float air = cwin(c, 0.49, 0.74, 0.03);
    float kl = cwin(c, 0.70, 0.84, 0.05) * jump;
    P.pitch += 1.0 * b - 0.22 * tall + 0.28 * kr - 0.30 * air + 0.15 * kl;
    P.n0 += 0.35 * b; P.n1 = mix(P.n1, 0.45, b); P.n2 = mix(P.n2, 0.5, b);
    P.n0 = mix(P.n0, 0.48, tall); P.n1 = mix(P.n1, -0.55, tall); P.n2 = mix(P.n2, 0.05, tall);
    P.head += 0.5 * tall - 0.15 * b;
    P.hip -= 0.20 * kr + 0.14 * kl;
    P.lift = C.x * 4.0 * ta * (1.0 - ta);
    P.open = max(0.5 * b, smoothstep(0.20, 0.34, c) * (1.0 - smoothstep(0.80, 0.97, c)));
    P.raise = 0.5 * b + 0.95 * cwin(c, 0.30, 0.53, 0.08) + 0.2 * air;
    P.famp = 0.85 * air + 0.35 * tall * (1.0 - jump);
    P.fph = ta * 2.4 * 2.0 * PI + 1.9 + (1.0 - jump) * t * 7.0;
    P.dangle = smoothstep(0.0, 0.15, P.lift);
    P.hyaw = 0.5 * sin(t * 0.5 + ph * 9.0) * cwin(c, 0.84, 1.0, 0.05);
  } else if (ty < 2.5) {                            // duet: bills to the sky, the male's wings lifted
    float u = cwin(c, 0.08, 0.85, 0.08);
    float K = C.z > 0.5 ? 5.0 : 10.0;
    float pu = 0.5 + 0.5 * sin(2.0 * PI * K * c); pu = pu * pu * u;
    P.n0 = mix(P.n0, 0.30, u); P.n1 = mix(P.n1, -0.35, u); P.n2 = mix(P.n2, 0.02, u);
    P.head = mix(P.head, 1.22 + 0.16 * pu, u); P.pitch -= 0.12 * u + 0.04 * pu; P.hip += 0.012 * pu;
    P.open = 0.5 * u * C.z; P.raise = (1.3 * u + 0.12 * pu) * C.z;
  } else if (ty < 3.5) {                            // reed toss: bow to pick, fling, jump at it
    float b = cwin(c, 0.04, 0.26, 0.07);
    float fl = cwin(c, 0.24, 0.42, 0.05);
    float ta = clamp((c - 0.34) / 0.13, 0.0, 1.0);
    float air = cwin(c, 0.33, 0.49, 0.03);
    P.pitch += 1.0 * b - 0.25 * fl - 0.15 * air;
    P.n0 += 0.35 * b; P.n1 = mix(P.n1, 0.45, b); P.n2 = mix(P.n2, 0.5, b);
    P.n0 = mix(P.n0, 0.45, fl); P.n1 = mix(P.n1, -0.5, fl); P.n2 = mix(P.n2, 0.0, fl);
    P.head += 0.9 * fl - 0.15 * b;
    P.hip -= 0.16 * cwin(c, 0.29, 0.36, 0.03) + 0.1 * cwin(c, 0.46, 0.56, 0.04);
    P.lift = C.x * 4.0 * ta * (1.0 - ta);
    P.open = max(0.3 * b, cwin(c, 0.27, 0.64, 0.07)); P.raise = 0.3 * b + 0.7 * fl; P.famp = 0.8 * air;
    P.fph = ta * 2.0 * 2.0 * PI + 1.9; P.dangle = smoothstep(0.0, 0.15, P.lift);
  } else if (ty < 5.5) {                            // preen (4) / asleep on one leg, head tucked (5)
    float sl = step(4.5, ty);
    float w = mix(cwin(c, 0.08, 0.9, 0.1), 1.0, sl);
    float sd = C.y < 0.5 ? -1.0 : 1.0;
    P.n0 = mix(P.n0, 0.5, w); P.n1 = mix(P.n1, -0.95, w); P.n2 = mix(P.n2, -1.3, w);
    P.hyaw = PI * w * sd; P.nx = 0.07 * w * sd;
    P.head = mix(P.head, -0.42 + 0.1 * sin(t * 7.0 + ph * 5.0) * (1.0 - sl), w);
    P.footR = vec2(0.03, 0.40) * sl; P.pitch = mix(P.pitch, 0.012 * sin(t * 0.5 + ph * 11.0), sl);
  } else {                                          // leaver: wake, run three steps, lift, fly
    float tp = tau - C.x; vec3 k = leaveKin(C, tau);
    if (ty > 6.5) { tp = 30.0 + t; k = vec3(100.0, 0.0, 1.0); }      // flyer (7): always on the wing, beats on the pose clock
    float wake = smoothstep(-0.8, 0.0, tp);
    float air = smoothstep(3.6, 6.0, k.x); float fly = smoothstep(5.0, 16.0, k.x);
    P.n0 = mix(mix(P.n0, 1.2, wake), 1.34, fly); P.n1 = mix(P.n1, -0.2, wake) * (1.0 - fly);
    P.n2 = mix(P.n2, 0.12, wake) * (1.0 - fly);
    P.pitch = mix(mix(P.pitch, 0.34, wake), 0.05, fly) - 0.16 * sin(PI * k.z);
    P.head = mix(P.head, P.pitch, wake); P.hyaw = 0.0;
    float S = 2.0 * B.w; float bob = sin(2.0 * PI * 2.0 * k.x / S);
    P.hip = (-0.10 + 0.025 * bob) * wake * (1.0 - air); P.lift = k.y + 0.12 * air;
    P.open = smoothstep(-0.5, 0.5, tp); P.raise = 0.14; P.famp = mix(1.0, 0.72, fly) * P.open;
    P.fph = 2.0 * PI * 2.3 * t + ph * 6.0;
    vec2 gl = gaitFoot(fract(k.x / S + 0.18), 2.0); vec2 gr = gaitFoot(fract(k.x / S + 0.68), 2.0);
    P.footL = vec2(gl.x, gl.y * wake); P.footR = vec2(gr.x, gr.y * wake);
    P.trail = air; P.legs = mix(1.0, 1.0 - C.w, fly);
  }
  return P;
}
vec3 rigHip(Pose P){ return vec3(0.0, HIP_Y + P.hip + P.lift, 0.0); }
vec3 rigBodyDir(Pose P, vec3 d){ float c = cos(P.pitch), s = sin(P.pitch); return vec3(d.x, d.y * c - d.z * s, d.y * s + d.z * c); }
vec3 rigBody(Pose P, vec3 p){ return rigHip(P) + rigBodyDir(P, p - vec3(0.0, HIP_Y, HIP_Z)); }
vec2 neckArc(float th, float k, float len){ float kk = abs(k) < 1e-3 ? 1e-3 : k; return vec2(sin(th + kk * len) - sin(th), cos(th) - cos(th + kk * len)) / kk; }
// centre line of the neck in the body frame at t 0..1, and its angle from vertical (forward positive)
void rigNeck(Pose P, float t, out vec3 c, out float th){
  float tm = 0.45; float ta = min(t, tm); float tb = max(t - tm, 0.0);
  float k1 = P.n1 / (tm * NECKL); float k2 = P.n2 / ((1.0 - tm) * NECKL);
  vec2 a = neckArc(P.n0, k1, ta * NECKL); float thm = P.n0 + k1 * ta * NECKL;
  vec2 b = neckArc(thm, k2, tb * NECKL); th = thm + k2 * tb * NECKL;
  c = NECK0 + vec3(P.nx * t, a.x + b.x, a.y + b.y);
}
// head-local (x, up, forward) -> body frame
vec3 rigHead(Pose P, vec3 h){
  vec3 c; float th; rigNeck(P, 1.0, c, th);
  float cy = cos(P.hyaw), sy = sin(P.hyaw); float x2 = h.x * cy + h.z * sy; float f2 = -h.x * sy + h.z * cy;
  float ca = cos(P.head), sa = sin(P.head);
  return c + vec3(x2, h.y * ca + f2 * sa, -h.y * sa + f2 * ca);
}
vec3 rigHeadDir(Pose P, vec3 h){
  float cy = cos(P.hyaw), sy = sin(P.hyaw); float x2 = h.x * cy + h.z * sy; float f2 = -h.x * sy + h.z * cy;
  float ca = cos(P.head), sa = sin(P.head);
  return vec3(x2, h.y * ca + f2 * sa, -h.y * sa + f2 * ca);
}
vec3 rigBill(Pose P){ return rigBody(P, rigHead(P, vec3(0.0, 0.0, BILL))); }
vec3 rigTurn(vec3 v, float hd){ float c = cos(hd), s = sin(hd); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
// bird-local -> hero-local (instance foot point, heading, scale, and the leaver's run along its track)
vec3 rigWorld(vec3 l, vec4 A, vec4 B, vec4 C, float tau){
  vec3 root = A.xyz;
  float sc = B.w;
  if (B.x > 6.5) {                                   // flyer: a straight track of C.y metres, looping on the tau clock, shrunk away at both ends
    float L = max(C.y, 1.0); float s = mod(tau * 12.6 + C.x, L); root += vec3(sin(A.w), 0.0, cos(A.w)) * s;
    root.y += C.z * sin(3.14159265 * s / L);
    sc *= smoothstep(0.0, 30.0, s) * (1.0 - smoothstep(L - 30.0, L, s));
  } else if (B.x > 5.5) { float s = leaveKin(C, tau).x; root += vec3(sin(A.w), 0.0, cos(A.w)) * s; }
  return root + rigTurn(l * sc, A.w);
}
`;

// ---------------------------------------------------------------------------------------------------------
// Crane geometry. One merged mesh; aRig = (part, t, side, w) tells the vertex shader how to place a vertex:
//   0 body  position/normal in the body frame (rigid, pitches about the hip)
//   1 neck  position = ring offset (x, front), t = distance along the neck, w = how far to the front (-1..1)
//   2 head  position/normal in the head frame (x, up, forward)
//   3 wing  position = spread wing, aFold = folded wing, t = span, w = chord (feathers are cut in the fragment shader)
//   4 leg   position = ring offset (x, -, z), t = distance along the bone, w = 0 upper / 1 lower / 2 toes
// ---------------------------------------------------------------------------------------------------------
function craneGeometry(detail = 1) {
  const pos = [], nor = [], col = [], fold = [], rig = [], idx = [];
  const V = (p, n, c, r, f) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); rig.push(r[0], r[1], r[2], r[3]); if (f) fold.push(f[0], f[1], f[2]); else fold.push(0, 0, 0); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => { idx.push(a, b, c, a, c, d); };
  const smooth = (v0, i0, ctr) => {            // smooth normals for vertices >= v0 from triangles >= i0
    const n = pos.length / 3; for (let i = v0; i < n; i++) { nor[i * 3] = 0; nor[i * 3 + 1] = 0; nor[i * 3 + 2] = 0; }
    for (let i = i0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { nor[k] += nx; nor[k + 1] += ny; nor[k + 2] += nz; }
    }
    let out = 0;
    for (let i = v0; i < n; i++) { const l = Math.hypot(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]) || 1; nor[i * 3] /= l; nor[i * 3 + 1] /= l; nor[i * 3 + 2] /= l;
      out += nor[i * 3] * (pos[i * 3] - ctr[0]) + nor[i * 3 + 1] * (pos[i * 3 + 1] - ctr[1]) + nor[i * 3 + 2] * (pos[i * 3 + 2] - ctr[2]); }
    if (out < 0) for (let i = v0 * 3; i < n * 3; i++) nor[i] = -nor[i];      // make them point outward whatever the winding
  };
  const WHITE = [0.74, 0.735, 0.75], BLACK = [0.022, 0.022, 0.028], RED = [1, 0, 0], HORN = [0.40, 0.37, 0.2], LEG = [0.03, 0.03, 0.035];
  const R = (n) => Math.max(3, Math.round(n * detail));
  const bodyPr = (s) => Math.pow(Math.max(Math.sin(Math.PI * Math.pow(clamp(s, 0, 1), 0.85)), 0), 0.7);
  const bodyW = (z) => { const s = (z + 0.34) / 0.60; return s <= 0 ? 0.02 : Math.max(0.02, 0.14 * bodyPr(s)); };

  // body: an egg from the tail point to the breast, a little deeper than wide
  { const NR = R(10), NS = R(10), v0 = pos.length / 3, i0 = idx.length;
    for (let i = 0; i <= NR; i++) { const s = i / NR, pr = bodyPr(s), z = mix(-0.34, 0.26, s), y = mix(0.90, 1.0, s) + 0.02 * Math.sin(Math.PI * s);
      for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2, sn = Math.sin(a), belly = sn < 0 ? 0.93 : 1;
        const shade = 0.9 + 0.1 * clamp(sn + 0.6, 0, 1);
        V([0.14 * pr * Math.cos(a), y + 0.17 * pr * sn * belly, z], [0, 1, 0], [WHITE[0] * shade, WHITE[1] * shade, WHITE[2] * (shade * 0.5 + 0.5)], [0, s, 0, 0]); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; quad(a, b, b + NS, a + NS); }
    smooth(v0, i0, [0, 0.95, 0]); }

  // neck: rings swept along the pose's S curve in the vertex shader
  { const NK = R(12), NS = R(8), v0 = pos.length / 3;
    for (let i = 0; i <= NK; i++) { const t = i / NK, r = mix(0.064, 0.027, sstep(0, 0.5, t)) + 0.005 * sstep(0.8, 1, t);
      for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2; V([r * Math.cos(a), r * Math.sin(a), 0], [Math.cos(a), Math.sin(a), 0], WHITE, [1, t, 0, Math.sin(a)]); } }
    for (let i = 0; i < NK; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; quad(a, a + NS, b + NS, b); } }

  // head (x, up, forward): white from the eye to the nape, black face and throat, bare red crown; horn bill
  { const NR = R(6), NS = R(8), v0 = pos.length / 3, i0 = idx.length;
    for (let i = 0; i <= NR; i++) { const la = (i / NR) * Math.PI, f = 0.035 - 0.07 * Math.cos(la), rr = Math.max(Math.sin(la), 0.02);
      for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2, sn = Math.sin(a);
        let c = BLACK; if (sn > 0.45 && f > -0.012 && f < 0.092) c = RED; else if (f < 0.034 && sn > -0.4) c = WHITE;
        V([0.036 * rr * Math.cos(a), 0.012 + 0.042 * rr * sn, f], [0, 1, 0], c, [2, 0, 0, 0]); } }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; quad(a, b, b + NS, a + NS); }
    const b0 = pos.length / 3, BS = 6, rings = [[0.082, 0.017, 0.021, 1], [0.15, 0.012, 0.014, 1], [0.21, 0.007, 0.008, 0.85], [0.25, 0.002, 0.002, 0.6]];
    for (const [f, rx, ru, k] of rings) for (let j = 0; j < BS; j++) { const a = (j / BS) * Math.PI * 2; V([rx * Math.cos(a), 0.004 + ru * Math.sin(a), f], [0, 1, 0], [HORN[0] * k, HORN[1] * k, HORN[2] * k], [2, 0, 0, 1]); }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < BS; j++) { const a = b0 + i * BS + j, b = b0 + i * BS + (j + 1) % BS; quad(a, b, b + BS, a + BS); }
    smooth(v0, i0, [0, 0.01, 0.06]); }

  // wings: a span x chord grid with two shapes, spread and folded (primaries under, black tertial bustle outermost)
  for (const side of [-1, 1]) { const NS = R(14), NC = R(5), v0 = pos.length / 3;
    for (let i = 0; i <= NS; i++) { const u = i / NS;
      const xb = 0.76 * Math.pow(u, 0.9), le = 0.03 + 0.07 * Math.exp(-(((u - 0.45) / 0.28) ** 2)) - 0.54 * Math.max(u - 0.55, 0) ** 2;
      const ga = 1.25 * sstep(0.45, 1, u), len = 0.36 + 0.04 * Math.cos(2 * Math.PI * u);
      for (let j = 0; j <= NC; j++) { const v = j / NC;
        const cam = mix(0.42, 0.15, u);                                  // the wing is arched: its rear half droops, so from behind it shows as a surface, not a line
        const sp = [side * (0.09 + xb + v * len * Math.sin(ga)), 1.07 + 0.03 * Math.sin(Math.PI * v) * (1 - 0.5 * u) - 0.04 * u * u - cam * len * Math.pow(v, 1.7), 0.10 + le - v * len * Math.cos(ga)];
        const vf = Math.pow(v, 0.62), zf = 0.13 - mix(0.64, 0.50, u) * vf, wrap = mix(0.55, 1, sstep(0, 0.5, u));
        const fo = [side * (bodyW(zf) * wrap + 0.014 + 0.02 * (1 - u)), mix(1.105, 0.93, u) - vf * vf * vf * mix(0.30, 0.10, u), zf];
        V(sp, [0, 1, 0], WHITE, [3, u, side, v], fo); } }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = v0 + i * (NC + 1) + j; quad(a, a + 1, a + NC + 2, a + NC + 1); } }

  // legs: feathered thigh tapering to a thin black shank, knob at the joint, three long toes and a spur
  for (const side of [-1, 1]) { const NS = 6;
    const segs = [[[0, 0.05, 1], [0.16, 0.04, 1], [0.30, 0.016, 0], [1, 0.013, 0]], [[0, 0.02, 0], [0.07, 0.0125, 0], [0.93, 0.0115, 0], [1, 0.017, 0]]];
    segs.forEach((rings, seg) => { const v0 = pos.length / 3;
      for (const [al, r, w] of rings) for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2; V([r * Math.cos(a), 0, r * Math.sin(a)], [Math.cos(a), 0, Math.sin(a)], w ? WHITE : LEG, [4, al, side, seg]); }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NS; j++) { const a = v0 + i * NS + j, b = v0 + i * NS + (j + 1) % NS; quad(a, a + NS, b + NS, b); } });
    for (const [ang, L] of [[-0.55, 0.095], [0, 0.12], [0.55, 0.095], [Math.PI, 0.035]]) { const v0 = pos.length / 3, dx = Math.sin(ang), dz = Math.cos(ang);
      for (const [d, r, h] of [[0, 0.011, 0.012], [L * 0.55, 0.008, 0.008], [L, 0.003, 0.004]]) for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2 + Math.PI / 2, ox = Math.cos(a) * r, oy = Math.sin(a) * r * 0.7 + h;
        V([dx * d + dz * ox, oy, dz * d - dx * ox], [dz * Math.cos(a), Math.max(Math.sin(a), 0.2), -dx * Math.cos(a)], LEG, [4, 1, side, 2]); }
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { const a = v0 + i * 3 + j, b = v0 + i * 3 + (j + 1) % 3; quad(a, a + 3, b + 3, b); } } }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aFold', new THREE.Float32BufferAttribute(fold, 3));
  g.setAttribute('aRig', new THREE.Float32BufferAttribute(rig, 4));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// Shared uniforms (light, clocks) and the crane material
// ---------------------------------------------------------------------------------------------------------
function makeShared(palette, opts = {}) {
  const P = palette.map(lin);
  const sd = new THREE.Vector3(...(opts.sunDir || [0.34, 0.09, -0.94])).normalize();
  return {
    uTime: { value: 0 }, uTau: { value: 0 }, uPx: { value: 0.0012 },
    uSunDir: { value: sd }, uSunCol: { value: P[3].clone().multiplyScalar(1.25) }, uRimCol: { value: P[3].clone().multiplyScalar(1.25) },
    uSky: { value: P[4].clone().multiplyScalar(0.42) },
    uGround: { value: P[4].clone().lerp(P[2], 0.35).multiplyScalar(0.2) },
    uCrown: { value: P[6].clone() }, uRose: { value: P[2].clone() }, uViolet: { value: P[5].clone() },
  };
}
const FOGU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
const pickU = (S, names) => { const o = {}; for (const n of names) o[n] = S[n]; return o; };

const CRANE_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aFold; attribute vec4 aRig; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
uniform float uTime; uniform float uTau; uniform float uPx;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vUv; varying float vFly;
#include <fog_pars_vertex>
${RIG}
void main(){
  float part = aRig.x;
  Pose P = cranePose(iB, iC, uTime, uTau);
  vec3 lp; vec3 ln;
  vec3 rootW = (modelMatrix * vec4(rigWorld(vec3(0.0, 1.0, 0.0), iA, iB, iC, uTau), 1.0)).xyz;
  float dist = length(rootW - cameraPosition);
  float wsc = clamp(uPx * dist * 62.0, 1.0, 4.0);          // thin parts never fall under ~1.5 pixels
  if (part < 0.5) {                                          // on the wing the body draws out: longer, slimmer, tapering to the tail
    vec3 bp = position; float fl = P.trail;
    bp.z = mix(bp.z, bp.z * 1.3 - 0.02, fl); bp.x *= 1.0 - 0.12 * fl; bp.y = 0.95 + (bp.y - 0.95) * (1.0 - 0.2 * fl);
    lp = rigBody(P, bp); ln = rigBodyDir(P, normal); }
  else if (part < 1.5) {
    vec3 c; float th; rigNeck(P, aRig.y, c, th);
    vec3 nn = vec3(0.0, -sin(th), cos(th));
    lp = rigBody(P, c + vec3(position.x, 0.0, 0.0) + nn * position.y);
    ln = rigBodyDir(P, vec3(normal.x, 0.0, 0.0) + nn * normal.y);
  } else if (part < 2.5) {
    float wd = mix(1.0, min(wsc, 3.0), aRig.w);
    vec3 hp = vec3(position.x * wd, 0.004 + (position.y - 0.004) * wd, position.z);
    lp = rigBody(P, rigHead(P, hp)); ln = rigBodyDir(P, rigHeadDir(P, normal));
  } else if (part < 3.5) {
    float side = aRig.z; float u = aRig.y;
    vec3 S = vec3(side * 0.09, 1.07, 0.10);
    vec3 dA = aFold - S; vec3 dB = position - S; float lA = length(dA); float lB = length(dB);
    float op = clamp(P.open * 1.3 - 0.3 * u, 0.0, 1.0);
    vec3 dd = mix(dA / max(lA, 1e-4), dB / max(lB, 1e-4), op); dd /= max(length(dd), 1e-3);
    vec3 w = dd * mix(lA, lB, op);
    float ph = P.fph - 0.9 * u;
    float ang = (P.raise + P.famp * sin(ph + 0.4 * sin(ph))) * (0.45 + 0.55 * u) * smoothstep(0.0, 0.6, op) * side;
    float ca = cos(ang), sa = sin(ang);
    w = vec3(w.x * ca - w.y * sa, w.x * sa + w.y * ca, w.z);
    vec3 n = normalize(mix(vec3(side * 0.85, 0.5, -0.1), vec3(0.0, 1.0, -0.6 * aRig.w), op));
    n = vec3(n.x * ca - n.y * sa, n.x * sa + n.y * ca, n.z);
    lp = rigBody(P, S + w); ln = rigBodyDir(P, n);
  } else {
    float side = aRig.z; float seg = aRig.w; float al = aRig.y;
    vec3 Hj = rigHip(P) + vec3(side * 0.055, 0.0, 0.0);
    vec2 ft = side < 0.0 ? P.footL : P.footR;
    vec3 Fp = vec3(side * 0.065, ft.y, ft.x);                                  // planted on the foot point
    vec3 Fd = Hj + vec3(side * 0.012, -0.77, -0.09 + 0.05 * sin(uTime * 5.0 + side));   // dangling in a leap
    vec3 Ft = Hj + vec3(0.0, -0.17, -0.79);                                    // trailing in flight
    vec3 Fq = mix(mix(Fp, Fd, P.dangle), Ft, P.trail);
    vec3 dv = Fq - Hj; float dl = length(dv); vec3 dir = dv / max(dl, 1e-4);
    float d = clamp(dl, 0.08, LEG1 + LEG2 - 0.004);
    vec3 Fk = Hj + dir * d;
    float ca = clamp((LEG1 * LEG1 + d * d - LEG2 * LEG2) / (2.0 * LEG1 * d), -1.0, 1.0); float sa = sqrt(max(1.0 - ca * ca, 0.0));
    vec3 pr = cross(vec3(1.0, 0.0, 0.0), dir); pr /= max(length(pr), 1e-4);
    vec3 K = Hj + dir * (LEG1 * ca) + pr * (LEG1 * sa);
    if (seg < 1.5) {
      vec3 a0 = seg < 0.5 ? Hj : K; vec3 a1 = seg < 0.5 ? K : Fk;
      vec3 ax = a1 - a0; ax /= max(length(ax), 1e-4);
      vec3 e1 = vec3(1.0, 0.0, 0.0) - ax * ax.x; e1 /= max(length(e1), 1e-4);
      vec3 e2 = cross(ax, e1);
      lp = mix(a0, a1, al) + (e1 * position.x + e2 * position.z) * wsc;
      ln = e1 * normal.x + e2 * normal.z;
    } else {
      float be = max(P.dangle * 1.1, P.trail * 2.6); float cb = cos(be), sb = sin(be);
      vec3 q = vec3(position.x * min(wsc, 2.0), position.y, position.z);
      lp = Fk + vec3(q.x, q.y * cb - q.z * sb, q.y * sb + q.z * cb);
      ln = vec3(normal.x, normal.y * cb - normal.z * sb, normal.y * sb + normal.z * cb);
    }
    lp = Hj + (lp - Hj) * P.legs;
  }
  vec4 wp = modelMatrix * vec4(rigWorld(lp, iA, iB, iC, uTau), 1.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * rigTurn(ln, iA.w); vCol = color; vUv = vec4(aRig.y, aRig.w, part, iC.w); vFly = P.trail;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

export const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSky; uniform vec3 uGround; uniform vec3 uRimCol;      // uRimCol: the light on an edge turned to the sun and through a thin wing (the key's own colour unless the world gives another)
float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
// wrapped key + sky/ground fill + a rim of back light on whatever edge faces the sun
vec3 shade(vec3 alb, vec3 N, vec3 Vv, float thin, float rimK){
  float ndl = dot(N, uSunDir);
  float wrap = clamp((ndl + 0.45) / 1.45, 0.0, 1.0); wrap *= wrap;
  vec3 col = alb * (uSunCol * wrap + mix(uGround, uSky, N.y * 0.5 + 0.5));
  col += thin * alb * uRimCol * max(-ndl, 0.0) * 0.55;
  float fr = 1.0 - max(dot(N, Vv), 0.0);
  float rim = fr * fr * fr * smoothstep(-0.3, 0.8, dot(-Vv, uSunDir));
  col += uRimCol * rim * rimK * (0.25 + 0.9 * alb);
  return col;
}`;

const CRANE_FRAG = /* glsl */`
uniform vec3 uCrown;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vUv; varying float vFly;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  float part = vUv.z; float juv = step(1.5, vUv.w);
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vWp; Vv /= max(length(Vv), 1e-4);
  vec3 BLK = vec3(0.022, 0.022, 0.028); vec3 TAWNY = vec3(0.36, 0.22, 0.11);
  float red = clamp((vCol.r - vCol.g) * 1.4, 0.0, 1.0) * step(1.5, part) * step(part, 2.5);
  vec3 alb = mix(vCol, vec3(vCol.g, vCol.g, vCol.b), step(0.5, red));
  float thin = 0.0;
  if (part > 2.5 && part < 3.5) {                       // wing: cut feather tips, paint the black flight feathers
    float u = vUv.x, v = vUv.y; float fu = fract(u * 24.0); float fid = floor(u * 24.0);
    float prim = smoothstep(0.52, 0.62, u);
    float v0 = mix(0.86, 0.42, prim);
    float tip = clamp((v - v0) / (1.0 - v0), 0.0, 1.0);
    if (abs(fu - 0.5) * 2.0 > 1.0 - tip * tip * mix(0.85, 0.95, prim)) discard;
    float blk = (1.0 - step(0.57, u)) * smoothstep(0.48, 0.53, v + 0.04 * (h1(fid) - 0.5));
    blk = max(blk, (1.0 - step(0.21, u)) * smoothstep(0.28, 0.34, v));
    alb = mix(alb, BLK, blk * (1.0 - 0.6 * juv));
    alb *= 0.80 + 0.20 * smoothstep(0.0, 0.6, 1.0 - abs(fu - 0.5) * 2.0);
    float row = fract(v * 3.0 + 0.1 * sin(fu * 6.2832));                 // three rows of coverts lying over one another, each with a soft shadow at its hem
    alb *= 1.0 - 0.16 * smoothstep(0.72, 1.0, row) * (1.0 - blk) * (1.0 - step(0.9, v));
    if (dot(N, Vv) < 0.0) N = -N;
    thin = 1.0;
  } else if (part > 0.5 && part < 1.5) {                // neck: black, white from the nape down the hind neck
    float t = vUv.x, frt = vUv.y;
    float thr = mix(-1.2, 0.15, smoothstep(0.30, 1.0, t));
    float wb = 1.0 - smoothstep(thr - 0.12, thr + 0.12, frt);
    float base = 1.0 - smoothstep(0.03, 0.13, t + 0.04 * frt);
    alb = mix(mix(BLK, TAWNY, juv), vCol, max(wb * (1.0 - juv), base));
  } else if (part > 1.5 && part < 2.5) {                // head: bare red crown (the one accent in the world)
    alb = mix(alb, uCrown, red * (1.0 - juv));
    alb = mix(alb, TAWNY, juv * (1.0 - vUv.y));
  }
  float rimK = 0.9;
  if (part < 0.5) {                                     // a bird on the wing: matte feathers, softly modelled, blue beneath; no pearl highlight
    alb *= mix(1.0, 0.82 + 0.18 * smoothstep(-0.5, 0.3, N.y), vFly);
    vec3 Nf = N * 0.3 + Vv * 0.45 + vec3(0.0, 0.45, 0.0); Nf /= max(length(Nf), 1e-3);
    N = mix(N, Nf, 0.75 * vFly); N /= max(length(N), 1e-3); rimK = mix(0.9, 0.2, vFly);
  }
  vec3 col = shade(alb, N, Vv, thin, rimK);
  if (part < 0.5) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) + alb * uSunCol * 0.16, 0.85 * vFly); }      // a flyer's shaded body is grey-white, never a blue egg under a teal sky
  col += uCrown * red * (1.0 - juv) * 0.22;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

function instanced(base, list) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
  list.forEach((c, i) => {
    A.set([c.x, c.y || 0, c.z, c.heading || 0], i * 4);
    B.set([c.type || 0, c.phase || 0, c.period || 8, c.scale || 1], i * 4);
    C.set(c.c || [0, 0, 0, 0], i * 4);
  });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(C, 4));
  g.instanceCount = n;
  return g;
}

// The same crane for the rest of the world. list: [{ x, y, z, heading, type, phase, period, scale, c:[4] }]
//   c for type 0: [wingStretch 0|1, -, -, juvenile 0|2]   1: [leap height m, -, male, juv]   2: [-, -, male 0|1, juv]
//   3: [jump height, -, -, juv]   4/5: [-, side 0|1, -, juv]   6: [delay s, -, climb m, tucked legs 0|1]
// opts: { shared (hero.shared, to follow the hero's light and clocks), palette, detail (0.5 = far LOD, ~450 triangles) }
export function makeCranes(ctx, list, opts = {}) {
  const shared = opts.shared || makeShared(opts.palette || DEFAULT_PALETTE, opts);
  const geo = instanced(craneGeometry(opts.detail ?? 1), list);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...FOGU(), ...pickU(shared, ['uTime', 'uTau', 'uPx', 'uSunDir', 'uSunCol', 'uSky', 'uGround', 'uRimCol', 'uCrown']) },
    vertexShader: CRANE_VERT, fragmentShader: CRANE_FRAG, fog: true, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'cranes';
  return { object: mesh, shared, update(dt, time) { if (!opts.shared) shared.uTime.value = time; } };
}

// ---------------------------------------------------------------------------------------------------------
// Breath, steam, splash rings, diamond dust, the tossed reed
// ---------------------------------------------------------------------------------------------------------
const SPRITE_FRAG = /* glsl */`
uniform vec3 uRose; uniform vec3 uViolet;
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;       // vS = (age 0..1, seed, opacity, kind 0 breath / 1 steam)
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  float r = length(vQ); float soft = 1.0 - smoothstep(0.0, 1.0, r);
  float n = vnoise(vQ * 2.1 + vS.y * 17.0 + vec2(0.0, -vS.x * 1.6));
  n = 0.6 * n + 0.4 * vnoise(vQ * 4.7 - vS.y * 9.0 + vec2(vS.x * 0.8, 0.0));
  // steam is rising, torn vapour: drawn out upward in strands and eaten away harder toward the rim, so its outline is shreds, never a disc
  vec2 w = vec2(vQ.x * 1.2 + 0.3 * sin(vQ.y * 2.6 + vS.y * 21.0), vQ.y * 0.92 - vS.x * 1.3);
  float nt = 0.55 * vnoise(w * 2.1 + vS.y * 17.0) + 0.3 * vnoise(w * 4.7 - vS.y * 9.0) + 0.15 * vnoise(w * 9.5 + vS.y * 31.0);
  float r2 = r * r;
  float torn = smoothstep(0.31 + 0.48 * r2, 0.57 + 0.43 * r2, nt + 0.16 * (1.0 - r)) * (1.0 - smoothstep(0.5, 1.0, r)) * 1.2 * smoothstep(0.05, 0.8, vWp.y);
  float al = mix(soft * mix(soft, 1.0, 0.4) * (0.06 + 1.15 * smoothstep(0.2, 0.8, n)), torn, vS.w) * vS.z;
  al = min(al, mix(0.85, 0.66, vS.w));
  if (al < 0.004) discard;
  vec3 Vd = vWp - cameraPosition; Vd /= max(length(Vd), 1e-4);
  float fs = max(dot(Vd, uSunDir), 0.0); fs *= fs; fs *= fs;                 // forward scatter, pow 4
  vec3 breath = uSky * 1.3 + uSunCol * (0.25 + 1.5 * fs);
  vec3 steam = mix(uViolet * 0.55 + uSky * 0.5, uRose * 0.95, clamp(0.35 + 0.4 * vQ.y + 0.3 * n, 0.0, 1.0)) * (0.42 + 0.2 * length(uSunCol))
             + uSunCol * 0.4 * fs * (0.4 + 0.6 * n);
  float sm = max(steam.r, max(steam.g, steam.b));                            // the glow of the steam stays under white: the frosted reeds and twigs in front of it keep their lines
  if (sm > 0.6) steam *= (0.6 + 0.22 * (1.0 - exp(-(sm - 0.6) / 0.22))) / sm;
  gl_FragColor = vec4(mix(breath, steam, vS.w), al);
  #include <fog_fragment>
}`;

const PUFF_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;      // iD = (cycle offset, period s, size m, seed)
uniform float uTime; uniform float uTau; uniform float uRate;
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;
#include <fog_pars_vertex>
${RIG}
void main(){
  bool lv = iB.x > 5.5;
  float per = max(iD.y, 0.2);
  float te = (floor(uTime / per - iD.x) + iD.x) * per;        // when this puff left the bill
  float age = uTime - te;
  float tauE = uTau - age * uRate;                            // the take-off clock at that moment
  Pose P = cranePose(iB, iC, te, tauE);
  vec3 p = rigWorld(rigBill(P), iA, iB, iC, tauE);
  float a = clamp(age / min(per, 4.0), 0.0, 1.0);
  p += vec3(sin(iD.w * 40.0 + age * 0.7) * 0.05, 0.10, cos(iD.w * 23.0 + age * 0.6) * 0.05) * age;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec4 mvPosition = viewMatrix * wp;
  mvPosition.xy += position.xy * iD.z * (0.22 + 1.1 * sqrt(a));
  float op = smoothstep(0.0, 0.05, a) * (1.0 - a) * (1.0 - a) * (lv ? smoothstep(5.0, 10.0, -mvPosition.z) : smoothstep(1.2, 3.5, -mvPosition.z));
  if (lv && tauE < iC.x) op *= step(fract(iD.w * 7.0), 0.34);          // a standing bird breathes slowly
  if (lv) op *= 1.0 - 0.6 * smoothstep(1.0, 4.0, tauE - iC.x);          // and on the wing its breath is torn away
  vQ = position.xy; vS = vec4(a, iD.w, op * 0.85, 0.0); vWp = wp.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const STEAM_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ;          // iP = (x, y, z, size)  iQ = (seed, wisp rate, x stretch, opacity)
uniform float uTime;
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  float sd = iQ.x; float life = fract(uTime * iQ.y + sd);
  float wisp = step(0.0001, iQ.y);
  vec3 p = iP.xyz;
  p.x = mod(p.x + 54.0 + uTime * 0.6 * (0.6 + 0.8 * sd), 108.0) - 54.0;       // leans and drifts downstream
  p.y += wisp * life * iP.w * 0.9 + 0.25 * sin(uTime * 0.21 + sd * 30.0);
  p.x += wisp * life * iP.w * 0.6;
  float edge = 1.0 - smoothstep(42.0, 54.0, abs(p.x));
  float sz = iP.w * (0.75 + 0.5 * life * wisp);
  float ang = (sd - 0.5) * mix(1.2, 2.0, wisp) + uTime * 0.06 * (sd - 0.5);            // a head of the curtain lies nearly level, a wisp stands up and leans: never a squashed sliver
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(position.x * mix(iQ.z, 0.85 * iQ.z, wisp), position.y * mix(0.9, 1.15, wisp));
  q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec4 mvPosition = viewMatrix * wp;
  mvPosition.xy += q * sz;
  float op = iQ.w * edge * mix(1.0, sin(3.14159 * life), wisp) * smoothstep(2.0, 8.0, -mvPosition.z);
  vQ = position.xy; vS = vec4(life + uTime * 0.07, sd, op, 1.0); vWp = cameraPosition + mvPosition.xyz * mat3(viewMatrix);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const RING_VERT = /* glsl */`
attribute vec4 iR;                              // (x, z, tau of the footfall, size)
uniform float uTau;
varying vec2 vQ; varying vec2 vA;
#include <fog_pars_vertex>
void main(){
  float age = (uTau - iR.z) / 1.15;
  float on = step(0.0, age) * step(age, 1.0);
  float rad = iR.w * (0.25 + 1.0 * sqrt(clamp(age, 0.0, 1.0))) * on;
  float jet = step(0.5, position.z);            // z = 1 marks the upright splash card
  vec3 p = vec3(iR.x, 0.02, iR.y) + mix(vec3(position.x * rad, 0.0, position.y * rad), vec3(0.0), jet);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
  float up = sin(3.14159 * clamp(age * 2.2, 0.0, 1.0));
  mvPosition.xy += jet * on * vec2(position.x * 0.22, (position.y + 1.0) * 0.30 * up) * iR.w * 2.0;
  vQ = position.xy; vA = vec2(mix((1.0 - age) * on, up * on, jet), jet);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RING_FRAG = /* glsl */`
uniform vec3 uSunCol; uniform vec3 uSky;
varying vec2 vQ; varying vec2 vA;
#include <fog_pars_fragment>
void main(){
  float r = length(vQ); float al;
  if (vA.y > 0.5) {                                                           // the kick of spray: a loose fan of drops, never a solid shape
    float env = (1.0 - smoothstep(0.1, 1.0, abs(vQ.x) * (1.1 + 0.9 * vQ.y))) * (1.0 - smoothstep(0.1, 1.0, vQ.y)) * smoothstep(-1.0, -0.8, vQ.y);
    vec2 g = vec2(vQ.x * 6.0, (vQ.y + 1.0) * 4.5 - vA.x * 1.5); vec2 id = floor(g);
    float hh = fract(sin(dot(id, vec2(127.1, 311.7))) * 43758.5453);
    float dr = 1.0 - smoothstep(0.08, 0.36, length(fract(g) - 0.5 - (vec2(hh, fract(hh * 7.3)) - 0.5) * 0.5));
    al = env * (0.06 + 0.9 * dr * step(0.45, hh)) * vA.x * 0.34;
  } else { al = smoothstep(0.55, 0.9, r) * (1.0 - smoothstep(0.9, 1.0, r)) * vA.x * vA.x * 0.2; }
  if (al < 0.004) discard;
  gl_FragColor = vec4(uSky * 1.2 + uSunCol * 0.55, al);
  #include <fog_fragment>
}`;

const DUST_VERT = /* glsl */`
attribute vec4 aD;                              // (seed, fall speed, twinkle rate, size)
uniform float uTime; uniform float uPx;
varying float vTw;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  p.y = mod(p.y - uTime * aD.y, 4.5) + 0.1;                  // low over the bar: higher, it reads as stars in a dawn sky
  p.x += 0.35 * sin(uTime * 0.23 + aD.x * 50.0); p.z += 0.35 * cos(uTime * 0.19 + aD.x * 31.0);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.0);
  float tw = max(sin(uTime * aD.z + aD.x * 80.0), 0.0); tw *= tw; tw *= tw; tw *= tw;
  vTw = (0.05 + 0.95 * tw) * smoothstep(1.5, 5.0, -mvPosition.z) * (1.0 - 0.85 * smoothstep(8.0, 22.0, -mvPosition.z));
  gl_PointSize = clamp(aD.w / max(uPx * -mvPosition.z, 1e-4), 1.5, 4.5);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DUST_FRAG = /* glsl */`
uniform vec3 uSunCol; varying float vTw;
#include <fog_pars_fragment>
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float d = 1.0 - smoothstep(0.2, 1.0, length(q));
  gl_FragColor = vec4((uSunCol * 2.2 + vec3(0.6)) * vTw * d, 1.0);
}`;

const STEM_VERT = /* glsl */`
attribute vec3 color; attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
uniform float uTime; uniform float uTau; uniform float uPx;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol;
#include <fog_pars_vertex>
${RIG}
vec3 billAt(float t){ return rigWorld(rigBill(cranePose(iB, iC, t, uTau)), iA, iB, iC, uTau); }
void main(){
  float T = max(iB.z, 0.5); float c = fract(uTime / T + iB.y);
  float cp = 0.15; float cr = 0.30; float Tf = 1.5; float cl = cr + Tf / T;
  vec3 G = billAt(uTime - (c - cp) * T); G.y = iA.y + 0.03;          // where it lies, and where the bow picks it up
  vec3 p = G; float spin = 0.0;
  if (c >= cp && c < cr) { p = billAt(uTime); }                       // carried in the bill
  else if (c >= cr && c < cl) {                                       // thrown: lands exactly where it will be picked up
    vec3 P0 = billAt(uTime - (c - cr) * T); float ts = (c - cr) * T; vec3 gv = vec3(0.0, -7.0, 0.0);
    vec3 v0 = (G - P0) / Tf - 0.5 * gv * Tf;
    p = P0 + v0 * ts + 0.5 * gv * ts * ts; spin = ts / Tf * 4.0 * 3.14159265;
  }
  float dist = length((modelMatrix * vec4(p, 1.0)).xyz - cameraPosition);
  float wsc = clamp(uPx * dist * 125.0, 1.0, 4.0);
  vec3 l = vec3(position.x, position.y * wsc, position.z * wsc);
  float cs = cos(spin), sn = sin(spin);
  l = vec3(l.x * cs - l.y * sn, l.x * sn + l.y * cs, l.z);
  vec3 n = vec3(normal.x * cs - normal.y * sn, normal.x * sn + normal.y * cs, normal.z);
  vec4 wp = modelMatrix * vec4(p + rigTurn(l, iA.w), 1.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * rigTurn(n, iA.w); vCol = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// Free breath puffs with the hero's puff look, placed from the CPU (the world's swans: one at every wingbeat).
// iP = (x, y, z, size m)   iQ = (age 0..1, seed, opacity, -)
const FREE_PUFF_VERT = /* glsl */`
attribute vec4 iP; attribute vec4 iQ;
varying vec2 vQ; varying vec4 vS; varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(iP.xyz, 1.0);
  vec4 mvPosition = viewMatrix * wp; float a = clamp(iQ.x, 0.0, 1.0);
  mvPosition.xy += position.xy * iP.w * (0.22 + 1.1 * sqrt(a));
  float op = smoothstep(0.0, 0.05, a) * (1.0 - a) * (1.0 - a) * smoothstep(1.2, 3.5, -mvPosition.z) * iQ.z;
  vQ = position.xy; vS = vec4(a, iQ.y, op * 0.85, 0.0); vWp = wp.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_UNI = ['uTime', 'uTau', 'uRate', 'uRose', 'uViolet', 'uSunDir', 'uSunCol', 'uSky', 'uGround', 'uRimCol'];
const puffMat = (shared, vs) => new THREE.ShaderMaterial({ uniforms: { ...FOGU(), ...pickU(shared, PUFF_UNI) }, vertexShader: vs, fragmentShader: SPRITE_FRAG, fog: true, transparent: true, depthWrite: false });
// n free puffs: set(i, x, y, z, size, age01, seed, opacity) then flush() each frame
export function makePuffs(shared, n) {
  const g = quadGeo(false), P = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), Q = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  P.setUsage(THREE.DynamicDrawUsage); Q.setUsage(THREE.DynamicDrawUsage); g.setAttribute('iP', P); g.setAttribute('iQ', Q); g.instanceCount = n;
  const m = new THREE.Mesh(g, puffMat(shared, FREE_PUFF_VERT)); m.frustumCulled = false; m.renderOrder = 3; m.name = 'free-breath';
  return { object: m, set(i, x, y, z, size, age, seed, op) { const o = i * 4; P.array[o] = x; P.array[o + 1] = y; P.array[o + 2] = z; P.array[o + 3] = size; Q.array[o] = age; Q.array[o + 1] = seed; Q.array[o + 2] = op; Q.array[o + 3] = 0; }, flush() { P.needsUpdate = Q.needsUpdate = true; } };
}
// Breath for cranes made with makeCranes (the same list): a glowing puff at every note of a calling bird (type 2) that hangs four seconds,
// a slow breath from the others. rnd = a seeded random function.
export function makeBreath(list, shared, rnd) {
  const A = [], B = [], C = [], D = [];
  const one = (b, cn, size, per) => { A.push(b.x, b.y || 0, b.z, b.heading || 0); B.push(b.type || 0, b.phase || 0, b.period || 8, b.scale || 1); C.push(...(b.c || [0, 0, 0, 0])); D.push(cn - (b.phase || 0), per ?? (b.period || 8), size, rnd()); };
  for (const b of list) {
    if (b.type === 2) { const male = b.c && b.c[2] > 0.5, K = male ? 5 : 10; for (let k = 0; k < 3; k++) one(b, male ? (k + 1.25) / K : (2 * k + 2.25) / K, male ? 0.62 : 0.44); one(b, 0.93, 0.3); }
    else if (b.type === 5) one(b, rnd(), 0.22); else if (b.type < 5.5) one(b, rnd(), 0.32);
  }
  const g = quadGeo(false); instAttr(g, 'iA', A, 4); instAttr(g, 'iB', B, 4); instAttr(g, 'iC', C, 4); instAttr(g, 'iD', D, 4); g.instanceCount = D.length / 4;
  const m = new THREE.Mesh(g, puffMat(shared, PUFF_VERT)); m.frustumCulled = false; m.renderOrder = 3; m.name = 'breath';
  return m;
}

// ---------------------------------------------------------------------------------------------------------
// The setting: gravel bar, shelf ice, the dark cut bank, frosted reed, willow whips and snow-capped tussocks
// (one merged mesh; aW = (sway, phase, frost, kind 0 ground / 1 bank / 2 ribbon), aOff = ribbon half width)
// ---------------------------------------------------------------------------------------------------------
const SET_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aOff; attribute vec4 aW;
uniform float uTime; uniform float uPx; uniform float uWind;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vW;
#include <fog_pars_vertex>
void main(){
  vec3 p = position; float sw = aW.x * uWind;
  p.x += sw * (0.07 * sin(uTime * 0.9 + aW.y) + 0.025 * sin(uTime * 2.3 + aW.y * 1.7));
  p.z += sw * 0.045 * sin(uTime * 0.7 + aW.y * 1.3);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 tc = cameraPosition - wp.xyz; float dist = length(tc);
  vec2 sd = vec2(tc.z, -tc.x); sd /= max(length(sd), 1e-4);               // ribbons turn to the lens and stay 1.5 px wide
  wp.xyz += vec3(sd.x, 0.0, sd.y) * aOff.x * clamp(uPx * dist * 0.75 / max(abs(aOff.x), 1e-4), 1.0, 6.0);
  vWp = wp.xyz; vN = mat3(modelMatrix) * normal; vCol = color; vW = aW;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SET_FRAG = /* glsl */`
uniform float uSnow;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vW;
#include <fog_pars_fragment>
${LIGHT_GLSL}
// river shingle: one layer of rounded stones. Returns (distance to the joint, stone id, distance to the stone's centre)
vec3 shingle(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h2(i + g), h2(i + g + 17.3)); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h2(i + g + 5.1); } else if (d < d2) { d2 = d; }
  }
  return vec3(sqrt(d2) - sqrt(d1), id, sqrt(d1));
}
void main(){
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vWp; float dist = length(Vv); Vv /= max(dist, 1e-4);
  vec3 alb = vCol; float thin = 0.0; float rimK = 0.5; vec3 add = vec3(0.0);
  vec3 SNOW = vec3(0.60, 0.61, 0.64);
  float fw = length(fwidth(vWp.xz));                 // metres per pixel on the ground (taken before any loop)
  if (vW.w < 0.5) {                               // dark wet shingle: cobbles and pebbles, rime on their crowns, snow drifted to the bank foot
    float kA = 1.0 - smoothstep(0.10, 0.34, fw * 5.2); float kB = 1.0 - smoothstep(0.10, 0.34, fw * 15.0);
    vec3 A = shingle(vWp.xz * 5.2 + 3.0); vec3 B = shingle(vWp.xz * 15.0);
    float wet = 1.0 - smoothstep(0.02, 0.2, vW.z);
    float tone = mix(0.5, 0.34 + 0.5 * A.y, kA) * mix(1.0, 0.7 + 0.6 * B.y, kB);
    float kC = 1.0 - smoothstep(0.10, 0.34, fw * 1.9); vec3 C = shingle(vWp.xz * 1.9 + 11.0);            // cobbles the size of a loaf: these still read from the far end of the bar
    tone *= mix(1.0, 0.62 + 0.62 * C.y, kC);
    float patchy = vnoise(vWp.xz * 1.1 + 7.0); float lane = vnoise(vWp.xz * vec2(0.3, 1.7) + 2.0);        // beds of paler and darker gravel: these hold out to the far end of the bar
    tone *= 0.72 + 0.4 * patchy + 0.3 * lane;
    vec3 hue = mix(vec3(0.82, 0.92, 1.12), vec3(1.16, 0.98, 0.8), fract(A.y * 7.3 + B.y * 3.1 * kB));
    alb = vCol * hue * tone * 1.25;
    float joint = mix(1.0, smoothstep(0.0, 0.16, A.x), kA * 0.6) * mix(1.0, smoothstep(0.0, 0.2, B.x), kB * 0.5) * mix(1.0, smoothstep(0.0, 0.11, C.x), kC * 0.6);
    alb *= 0.25 + 0.75 * joint;
    float rime = smoothstep(0.42, 0.75, B.y) * smoothstep(0.10, 0.3, B.x) * kB + 0.35 * smoothstep(0.6, 0.9, A.y) * smoothstep(0.1, 0.3, A.x) * kA * (1.0 - kB);
    alb = mix(alb, SNOW * 0.8, rime * 0.55 * (1.0 - wet));
    float hoar = smoothstep(0.52, 0.7, 0.6 * vnoise(vWp.xz * 2.1 + 5.0) + 0.4 * vnoise(vWp.xz * 6.3)) * step(0.01, vW.z);        // patches of hoar on the dry stones: pale at any distance
    alb = mix(alb, SNOW * 0.62, hoar * 0.5 * (1.0 - wet));
    float ang = 6.2832 * B.y; vec3 bump = vec3(cos(ang), 0.0, sin(ang)) * (0.5 - B.z) * 1.1 * kB + vec3(cos(A.y * 40.0), 0.0, sin(A.y * 40.0)) * (0.45 - A.z) * 0.6 * kA;
    float cover = vnoise(vWp.xz * vec2(0.22, 0.6) + 3.0) * 0.6 + vnoise(vWp.xz * 1.3) * 0.4;
    float backK = (1.0 - smoothstep(-5.5, 1.5, vWp.z));
    float sn = smoothstep(0.60, 0.66, cover * 0.62 + backK * 0.36 + uSnow * 0.4 + 0.05 * (B.y - 0.5) * kB) * step(0.01, vW.z) * (1.0 - wet);
    float drift = 0.62 * vnoise(vWp.xz * vec2(0.16, 0.85) + 9.0) + 0.38 * vnoise(vWp.xz * vec2(0.55, 2.3) + 4.0);          // thin drifts the wind laid along the bar
    sn = max(sn, smoothstep(0.56, 0.63, drift + uSnow * 0.3 + 0.04 * (B.y - 0.5) * kB) * step(0.01, vW.z) * (1.0 - wet));
    alb = mix(alb, SNOW * (0.92 + 0.1 * vnoise(vWp.xz * 6.0)), sn);
    float lip = smoothstep(0.0, 0.025, vWp.y) * (1.0 - smoothstep(0.04, 0.10, vWp.y + 0.05 * (B.y - 0.5) * kB));       // a rind of ice where the stones meet the water
    alb = mix(alb, vec3(0.36, 0.44, 0.52), lip * 0.75);
    N = normalize(N + bump * (1.0 - sn) + vec3(0.0, 0.6, 0.0));
    float gl = step(0.982, h2(floor(vWp.xz * 60.0))) * max(sn, 0.5 * rime) * (1.0 - smoothstep(14.0, 34.0, dist));   // frost glints
    add = uSunCol * gl * 1.6 * (0.5 + 0.5 * sin(dot(Vv, vec3(40.0, 13.0, 29.0)) + vWp.x * 3.0));
    float fres = 1.0 - max(dot(N, Vv), 0.0); fres *= fres; fres *= fres;
    add += (uSky * 0.55 + uSunCol * 0.25 * smoothstep(0.2, 0.9, dot(reflect(-Vv, N), uSunDir))) * fres * (0.25 + 0.75 * wet) * (1.0 - sn);     // wet stones take the sky
  } else if (vW.w < 1.5) {                        // cut bank: dark frozen earth in strata, frost creeping down from the lip
    // dark frozen river earth in beds: loam over silt and a seam of gravel, cracked by the frost, pebbles and root holes close to; frost
    // creeps down from the lip. The face looks away from the sun: it stands in its own shade under the blue of the sky, and only the
    // rime at its lip takes a little of the key
    float bed = vnoise(vec2(vWp.x * 0.22, vWp.y * 5.5 + 0.6 * vnoise(vec2(vWp.x * 0.5, 3.0)))); float st = vnoise(vec2(vWp.x * 0.7, vWp.y * 9.0)); float cl = vnoise(vWp.xy * 3.3 + vWp.z);
    float kN = 1.0 - smoothstep(0.02, 0.08, fw);
    float crack = (1.0 - smoothstep(0.0, 0.09, abs(vnoise(vec2(vWp.x * 2.3, vWp.y * 1.1) + 7.0) - 0.5))) * kN;
    float grit = vnoise(vec2(vWp.x * 19.0, vWp.y * 23.0)) * kN;
    alb *= (0.5 + 0.55 * bed + 0.35 * st * cl) * mix(vec3(1.12, 1.0, 0.86), vec3(0.9, 0.98, 1.1), smoothstep(0.35, 0.7, bed)) * (1.0 - 0.5 * crack) * (0.85 + 0.4 * grit);
    alb = mix(alb, vec3(0.105, 0.1, 0.1) * (0.6 + 0.8 * grit), smoothstep(0.62, 0.74, vnoise(vec2(vWp.x * 0.13, vWp.y * 4.0 + 9.0))) * 0.7);
    float fr = smoothstep(0.62, 0.95, vW.z + 0.3 * vnoise(vWp.xy * vec2(2.0, 5.0)));
    alb = mix(alb, SNOW, max(fr, 0.5 * smoothstep(0.55, 0.8, vnoise(vec2(vWp.x * 1.7, vWp.y * 7.0) + 4.0)) * smoothstep(1.2, 2.6, vWp.y)));
    add = SNOW * uSunCol * 0.07 * fr * smoothstep(1.6, 2.9, vWp.y);
    rimK = 0.15;
  } else if (vW.w < 2.5) {                        // frosted stems: dark thread inside a fur of rime that the sun lights through
    N = normalize(Vv * 0.7 + vec3(0.0, 0.6, 0.0) + N * 0.3);
    alb = mix(alb, SNOW * 1.1, vW.z);
    thin = 1.0; rimK = 0.0;
    float bk = max(dot(-Vv, uSunDir), 0.0); float farS = smoothstep(7.0, 24.0, dist);
    alb *= mix(1.0, 0.5, bk * farS);                                         // looked at against the sun from far off we see the shaded side of the fur: blue-grey, drawn on the glowing steam
    add = uSunCol * vW.z * (0.10 + 0.75 * bk * bk) * (1.0 - 0.75 * farS);
  } else {                                        // snow caps and the dead sedge under them: plain, softly modelled
    float nn = vnoise(vWp.xz * 14.0 + vWp.y * 9.0);
    alb *= 0.86 + 0.28 * nn;
    N = normalize(N + vec3(nn - 0.5, 0.0, vnoise(vWp.zx * 11.0) - 0.5) * 0.5);
    rimK = 0.35 * vW.z;
    add = uSunCol * vW.z * step(0.975, h2(floor(vWp.xz * 70.0))) * 1.2 * (1.0 - smoothstep(8.0, 22.0, dist));
  }
  vec3 col = shade(alb, N, Vv, thin, rimK) + add;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

async function buildSetting(ctx, rng, noise, opts) {
  const pos = [], nor = [], col = [], off = [], aw = [], idx = [];
  const V = (x, y, z, n, c, o, w) => { pos.push(x, y, z); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); off.push(o[0], o[1], o[2]); aw.push(w[0], w[1], w[2], w[3]); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => { idx.push(a, b, c, a, c, d); };
  const Z0 = [0, 0, 0], UP = [0, 1, 0];
  const coves = opts.coves || [], cove = (x) => { let k = 0; for (const c of coves) { const t = (x - c) / 2.6; k += Math.exp(-t * t); } return k; };      // small bays in the lip where cranes wade
  const front = (x) => 7.4 * Math.pow(Math.max(1 - (x / (x < 0 ? 52 : 43.5)) ** 2, 0), 0.32) + 0.7 * noise.n2(x * 0.07, 3.1) + 0.25 * noise.n2(x * 0.31, 9.7) - 1.7 * cove(x);
  const barY = (x, z) => { const e = front(x) - z, ends = x < 0 ? sstep(54.5, 49.5, -x) : sstep(46, 41, x); return -0.35 + 0.65 * sstep(-0.4, 2.0, e) * ends + 0.035 * noise.n2(x * 0.45, z * 0.45) * sstep(0.3, 2.5, e); };
  // bar
  { const NX = 118, NZ = 20, x0 = -58, x1 = 50, z0 = -8.6, z1 = 11, v0 = pos.length / 3;
    for (let i = 0; i <= NX; i++) { if ((i & 15) === 0) await ctx.yield();   // a breath every 16 rows
      for (let j = 0; j <= NZ; j++) { const x = mix(x0, x1, i / NX), z = mix(z0, z1, Math.pow(j / NZ, 0.9)), h = barY(x, z);
      const dx = (barY(x + 0.3, z) - barY(x - 0.3, z)) / 0.6, dz = (barY(x, z + 0.3) - barY(x, z - 0.3)) / 0.6, l = Math.hypot(dx, 1, dz);
      const wet = sstep(0.14, 0.0, h);
      const g = 0.165 + 0.035 * noise.n2(x * 0.2, z * 0.2);
      let c = [mix(g, 0.035, wet), mix(g * 0.97, 0.037, wet), mix(g * 0.95, 0.044, wet)];
      V(x, h, z, [-dx / l, 1 / l, -dz / l], c, Z0, [0, 0, sstep(0.16, 0.3, h), 0]); } }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = v0 + i * (NZ + 1) + j; quad(a, a + 1, a + NZ + 2, a + NZ + 1); } }
  // cut bank: an undercut face 3 m high with a snow cornice, running the whole length behind the bar
  const bankZ = (x) => -8.3 + 0.9 * noise.n2(x * 0.05, 5.5) + 0.35 * noise.n2(x * 0.23, 1.5);
  const bankTop = (x, z) => 3.05 + 0.25 * noise.n2(x * 0.06, z * 0.06 + 20) + 0.08 * noise.n2(x * 0.4, z * 0.4);
  { const NX = 130, prof = [[0.5, 0.25, 0], [0.05, 0.75, 0], [-0.35, 1.4, 0.05], [-0.15, 2.1, 0.25], [0.25, 2.65, 0.6], [0.1, 2.95, 1.2], [-0.5, 3.1, 2], [-2.2, 3.2, 2], [-6, 3.25, 2], [-12, 2.9, 2], [-16, 1.2, 2], [-19, -0.3, 2]], v0 = pos.length / 3, NP = prof.length;
    await ctx.yield();
    for (let i = 0; i <= NX; i++) { const x = mix(-60, 60, i / NX), bz = bankZ(x), slump = 0.3 * noise.n2(x * 0.5, 2.2);
      for (let k = 0; k < NP; k++) { const [pz, py, fr] = prof[k]; const snow = fr >= 2;
        const y = snow ? bankTop(x, bz + pz) + (py - 3.1) : py * (bankTop(x, bz) / 3.05) + 0.0, z = bz + pz + (snow ? 0 : slump * (py / 3) * 0.8 + 0.15 * noise.n2(x * 1.3, py * 2));
        const e = 0.035 + 0.02 * noise.n2(x * 0.3, py);
        V(x, y, z, snow ? UP : [0, 0.25, 0.97], snow ? [0.6, 0.61, 0.64] : [e * 1.25, e, e * 0.85], Z0, [0, 0, snow ? 1 : fr, snow ? 0 : 1]); } }
    for (let i = 0; i < NX; i++) for (let k = 0; k < NP - 1; k++) { const a = v0 + i * NP + k; quad(a, a + NP, a + NP + 1, a + 1); } }
  // ribbons: stems as camera-widened strips. pts = [[x,y,z],...], w = half width at the base
  const ribbon = (pts, w, c, frost, sway, ph, tipW = 0.25) => { const v0 = pos.length / 3, n = pts.length;
    for (let i = 0; i < n; i++) { const t = i / (n - 1), hw = w * mix(1, tipW, t), s = sway * t * t;
      V(pts[i][0], pts[i][1], pts[i][2], UP, c, [-hw, 0, 0], [s, ph, frost, 2]); V(pts[i][0], pts[i][1], pts[i][2], UP, c, [hw, 0, 0], [s, ph, frost, 2]); }
    for (let i = 0; i < n - 1; i++) { const a = v0 + i * 2; quad(a, a + 1, a + 3, a + 2); } };
  const reed = (x, y, z, h, ph) => { const lx = rng.range(-0.25, 0.25), lz = rng.range(-0.15, 0.15), pts = [];
    for (let i = 0; i <= 3; i++) { const t = i / 3; pts.push([x + lx * t * t * h, y + h * t * (1 - 0.06 * t), z + lz * t * t * h]); }
    ribbon(pts, 0.012, [0.34, 0.27, 0.15], 0.45, 1, ph, 0.6);
    const tp = pts[3], d = [lx + rng.range(-0.3, 0.3), rng.range(-0.5, 0.1), lz]; const L = rng.range(0.22, 0.36);   // frosted plume, nodding
    ribbon([[tp[0], tp[1], tp[2]], [tp[0] + d[0] * L * 0.5, tp[1] + L * 0.45, tp[2] + d[2] * L], [tp[0] + d[0] * L, tp[1] + L * (0.7 + d[1] * 0.5), tp[2] + d[2] * L]], 0.045, [0.42, 0.34, 0.2], 0.85, 1.2, ph, 0.3); };
  const whip = (x, y, z, h, lean, az, ph, depth) => { const pts = [], n = 6, cx = Math.sin(az), cz = Math.cos(az);
    for (let i = 0; i <= n; i++) { const t = i / n, b = lean * h * t * t; pts.push([x + cx * b, y + h * t * (1 - 0.12 * lean * t), z + cz * b]); }
    ribbon(pts, 0.02 * (0.6 + h * 0.18), [0.06, 0.045, 0.04], 0.55 + 0.3 * rng(), 0.8, ph, 0.25);
    if (depth > 0) for (let k = 0; k < 3; k++) { const t = rng.range(0.35, 0.85), i = Math.floor(t * n), p = pts[i]; whip(p[0], p[1], p[2], h * rng.range(0.22, 0.4), rng.range(0.6, 1.4), az + rng.range(-1.6, 1.6), ph + k, 0); } };
  // reed stands along the bank top and at the two ends of the bar
  const nReed = Math.round(620 * (opts.detail ?? 1));
  await ctx.yield();
  for (let i = 0; i < nReed; i++) { if ((i & 63) === 0) await ctx.yield();
    const x = rng.range(-58, 58), cl = noise.n2(x * 0.09, 40) + 0.3 * noise.n2(x * 0.5, 41); if (cl < -0.15 && rng() < 0.8) continue;
    const z = bankZ(x) - 0.7 - Math.abs(rng.gauss()) * 1.6; reed(x, bankTop(x, z) - 0.05, z, rng.range(1.5, 2.3), x * 0.6 + rng()); }
  await ctx.yield();
  for (let i = 0; i < 150; i++) { const sgn = rng.sign(), x = sgn * rng.range(39.5, 47.5), z = rng.range(-7.5, -1.5) + 0.25 * (47 - Math.abs(x)); const y = barY(x, z); if (y < -0.2) continue; reed(x, Math.max(y, -0.05), z, rng.range(1.3, 2.1), x + rng()); }
  // willow whips: coppiced clumps on the bank, every twig furred
  const nClump = 34;
  for (let i = 0; i < nClump; i++) { if ((i & 3) === 0) await ctx.yield();
    const x = mix(-57, 57, (i + rng()) / nClump), z = bankZ(x) - rng.range(1.6, 7.5), y = bankTop(x, z) - 0.1, big = rng.range(0.8, 1.5);
    const nw = rng.int(7, 12); for (let k = 0; k < nw; k++) whip(x + rng.range(-0.3, 0.3), y, z + rng.range(-0.3, 0.3), rng.range(2.2, 4.6) * big, rng.range(0.05, 0.4), rng.range(0, 6.28), x + k, 1); }
  // roots and dead grass hanging from the lip of the bank
  await ctx.yield();
  for (let i = 0; i < 170; i++) { const x = rng.range(-58, 58), z = bankZ(x) + 0.32, y = bankTop(x, z) * 0.93, L = rng.range(0.3, 1.1), k = rng.range(-0.2, 0.2);
    ribbon([[x, y, z], [x + k * 0.5, y - L * 0.5, z + 0.12], [x + k, y - L, z + 0.08]], 0.012, [0.2, 0.16, 0.1], 0.7, 0.5, x * 3, 0.4); }
  // ... and more of the same from its own stream: long roots down the face, frost-furred grass curling over the cornice and standing in tufts
  // at the foot of the bank, so the face is earth with things growing out of it
  { const br = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':bank-fur'));
    for (let i = 0; i < 150; i++) { const x = br.range(-58, 58), z = bankZ(x) + 0.3, y = bankTop(x, z) * br.range(0.82, 0.95), L = br.range(0.7, 1.9), k = br.range(-0.35, 0.35);
      ribbon([[x, y, z], [x + k * 0.4, y - L * 0.4, z + 0.16], [x + k * 0.8, y - L * 0.75, z + 0.1], [x + k, y - L, z + 0.14]], 0.016, [0.13, 0.09, 0.06], br.range(0.25, 0.6), 0.3, x * 3, 0.35); }
    await ctx.yield();
    for (let i = 0; i < 320; i++) { const x = br.range(-58, 58), z = bankZ(x) + br.range(0.05, 0.45), y = bankTop(x, z) - 0.06, L = br.range(0.25, 0.6), k = br.range(-0.25, 0.25), o = br.range(0.2, 0.5);
      ribbon([[x, y, z], [x + k * 0.5, y + L * 0.6, z + o * 0.4], [x + k, y + L * 0.55, z + o], [x + k * 1.2, y + L * 0.1, z + o * 1.5]], 0.014, [0.4, 0.32, 0.17], br.range(0.7, 1), 0.8, x * 2, 0.3); }
    await ctx.yield();
    for (let i = 0; i < 160; i++) { const x = br.range(-56, 56), z = bankZ(x) + br.range(0.5, 1.3), y = barY(x, z) - 0.03, L = br.range(0.3, 0.7), k = br.range(-0.3, 0.3);
      ribbon([[x, y, z], [x + k * 0.5, y + L * 0.7, z + 0.05], [x + k, y + L, z + 0.12]], 0.013, [0.38, 0.3, 0.16], br.range(0.6, 1), 0.8, x * 2, 0.3); } }
  // sedge tussocks along the water's edge: a low lumpy mound. A domed, uneven cap of snow; under it a dark core, narrower than the cap and in
  // its shade; and the skirt, which is no surface but a ragged hem of dead blades in two rows that hang out from under the cap and lie down on
  // the stones, each of its own length, droop and tone; buff blades standing up through the cap.
  // No flat lid and no upright wall: every ring is lobed and jittered, and the crown sits off the middle. (The shape draws from a stream
  // of its own; the blades and the tussock's turn from the setting's.)
  const tq = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':tussock'));
  const tussock = (x, y, z, r, hgt, nb = 20, tall = 1) => { const NS = 13, ph = rng.range(0, 6.28);
    const p1 = tq.range(0, 6.28), p2 = tq.range(0, 6.28), ox = tq.range(-0.22, 0.22) * r, oz = tq.range(-0.22, 0.22) * r, lob = (a) => 1 + 0.17 * Math.sin(2 * a + p1) + 0.1 * Math.sin(3 * a + p2);
    const ring = (rr, hh, c, nUp, kind, fr, jit, sh) => { const v0 = pos.length / 3; for (let j = 0; j < NS; j++) { const a = (j / NS) * 6.283 + ph, k = rr * lob(a) * (1 - jit + 2 * jit * tq());
      V(x + ox * sh + Math.cos(a) * r * k, y + hgt * hh * (1 - 0.6 * jit + 1.2 * jit * tq()) * (0.85 + 0.15 * lob(a + 1.3)), z + oz * sh + Math.sin(a) * r * k, [Math.cos(a) * (1 - nUp), nUp, Math.sin(a) * (1 - nUp)], c, Z0, [0, 0, fr, kind]); } return v0; };
    const band = (a0, b0) => { for (let j = 0; j < NS; j++) { const a = a0 + j, b = a0 + (j + 1) % NS, c = b0 + j, d = b0 + (j + 1) % NS; quad(a, c, d, b); } };
    const SN = [0.6, 0.61, 0.64], SH = [0.44, 0.48, 0.56];
    const r0 = ring(0.8, -0.12, [0.06, 0.05, 0.035], 0.3, 3, 0, 0.12, 0), r2 = ring(0.72, 0.46, [0.085, 0.07, 0.045], 0.25, 3, 0, 0.1, 0.3); band(r0, r2);
    const c0 = ring(0.9, 0.4, SH, -0.3, 3, 0.4, 0.08, 0.3), c1 = ring(1.22, 0.47, SH, 0.1, 3, 0.7, 0.1, 0.4), c2 = ring(1.16, 0.64, SN, 0.5, 3, 1, 0.1, 0.5), c3 = ring(0.84, 0.86, SN, 0.8, 3, 1, 0.1, 0.8), c4 = ring(0.42, 1.0, SN, 0.95, 3, 1, 0.12, 1);
    band(c0, c1); band(c1, c2); band(c2, c3); band(c3, c4);
    const top = V(x + ox, y + hgt * 1.06, z + oz, UP, SN, Z0, [0, 0, 1, 3]); for (let j = 0; j < NS; j++) idx.push(c4 + j, top, c4 + (j + 1) % NS);
    // the ragged hem: dead blades that hang out from under the snow and lie down on the stones. An outer row of long ones and an inner row
    // of short, darker ones hard under the rim
    for (let k = 0; k < 15; k++) { const a = ((k + tq.range(0.1, 0.9)) / 15) * 6.283 + ph, ca = Math.cos(a), sa = Math.sin(a), l = lob(a), out = tq.range(1.35, 1.95), mid = tq.range(1.18, 1.36), yk = tq.range(0.28, 0.44), c = tq.range(0.7, 1.1);
      ribbon([[x + ca * r * 0.98 * l, y + hgt * 0.5, z + sa * r * 0.98 * l], [x + ca * r * mid * l, y + hgt * yk, z + sa * r * mid * l], [x + ca * r * out * l, y + hgt * 0.03, z + sa * r * out * l]], Math.max(0.012, r * tq.range(0.06, 0.1)), [0.3 * c, 0.235 * c, 0.115 * c], tq.range(0.1, 0.45), 0.2, ph + k, 0.3); }
    for (let k = 0; k < 12; k++) { const a = ((k + tq.range(0.1, 0.9)) / 12) * 6.283 + ph + 0.2, ca = Math.cos(a), sa = Math.sin(a), l = lob(a), out = tq.range(1.02, 1.3), c = tq.range(0.45, 0.75);
      ribbon([[x + ca * r * 0.88 * l, y + hgt * 0.47, z + sa * r * 0.88 * l], [x + ca * r * 0.98 * l, y + hgt * tq.range(0.2, 0.3), z + sa * r * 0.98 * l], [x + ca * r * out * l, y + hgt * 0.0, z + sa * r * out * l]], Math.max(0.014, r * tq.range(0.08, 0.12)), [0.26 * c, 0.2 * c, 0.1 * c], tq.range(0.0, 0.25), 0.1, ph + k * 2, 0.4); }
    // blades: a fountain of buff sedge standing up through the snow, leaning out, the tips nodding but never reaching the stones
    for (let k = 0; k < nb; k++) { const a = (k / nb) * 6.283 + rng.range(-0.25, 0.25), ca = Math.cos(a), sa = Math.sin(a), lean = rng.range(0.5, 1.5), up = hgt * rng.range(1.1, 2.0) * tall, c = rng.range(0.8, 1.15), b0 = r * rng.range(0.25, 0.8);
      ribbon([[x + ca * b0, y + hgt * 0.5, z + sa * b0], [x + ca * (b0 + r * 0.45 * lean), y + hgt * 0.5 + up * 0.55, z + sa * (b0 + r * 0.45 * lean)], [x + ca * (b0 + r * 1.0 * lean), y + hgt * 0.5 + up * 0.92, z + sa * (b0 + r * 1.0 * lean)], [x + ca * (b0 + r * 1.55 * lean), y + hgt * 0.5 + up * (1.0 - 0.14 * lean), z + sa * (b0 + r * 1.55 * lean)]], 0.012, [0.42 * c, 0.33 * c, 0.16 * c], rng.range(0.15, 0.5), 0.35, ph + k, 0.3); }
    for (let k = 0; k < 5; k++) { const a = rng.range(0, 6.28), d = r * rng.range(0.1, 0.7), L = rng.range(0.2, 0.42), lx = rng.range(-0.08, 0.08), lz = rng.range(-0.08, 0.08), bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
      ribbon([[bx, y + hgt * 0.8, bz], [bx + lx * 0.5, y + hgt * 0.8 + L * 0.6, bz + lz * 0.5], [bx + lx, y + hgt * 0.8 + L, bz + lz]], 0.009, [0.44, 0.35, 0.18], rng.range(0.3, 0.6), 0.6, ph + k * 2, 0.35); } };
  // along the lip they stand in knots of one to four with bare shingle between, no two alike: a tall fountain of sedge, a low snow hummock with
  // three blades, a small one hard against a big one; some right at the water, some a few steps up the bar
  // THE GUARD OF THE LIP, by place: a lip tussock any point of which (each vertex as dealt, with its blade's half width and the whole of its
  // sway in this visit's wind) would stand within LIP_CLEAR of the flown line is not made. The line is the world's (opts.lineDist: metres
  // from a point of this space to the path's own line). The tussock is built with every one of its draws, measured, and taken out again,
  // so all the others stand where they stood.
  const LIP_CLEAR = 2.3, lineDist = opts.lineDist, swayK = 0.1052 * (opts.wind ?? 1), lip = { made: 0, notMade: 0 };
  const lipTussock = (...a) => { const v0 = pos.length / 3, i0 = idx.length; tussock(...a); lip.made++;
    if (!lineDist) return; let near = false;
    for (let v = v0, n = pos.length / 3; v < n && !near; v++) near = lineDist(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]) - Math.abs(off[v * 3]) - swayK * aw[v * 4] < LIP_CLEAR;
    if (near) { pos.length = nor.length = col.length = off.length = v0 * 3; aw.length = v0 * 4; idx.length = i0; lip.made--; lip.notMade++; } };
  for (let kn = 0, x = -49.5; x < 41.5; kn++) { if ((kn & 3) === 0) await ctx.yield();
    const n = 1 + Math.floor(rng() * rng() * 4.4), back = rng() < 0.3 ? rng.range(1.8, 3.6) : rng.range(0.55, 1.5);
    for (let k = 0; k < n; k++) { const xx = x + (k ? rng.range(-0.9, 0.9) : 0), z = front(xx) - back - (k ? rng.range(-0.3, 0.7) : 0), y = barY(xx, z), kind = rng();
      if (kind < 0.3) lipTussock(xx, y, z, rng.range(0.24, 0.4), rng.range(0.13, 0.2), rng.int(3, 7), 1.6);                  // a low hummock
      else if (kind < 0.55) lipTussock(xx, y, z, rng.range(0.1, 0.16), rng.range(0.14, 0.24), rng.int(8, 12), 1.1);          // a small one
      else lipTussock(xx, y, z, rng.range(0.17, 0.32), rng.range(0.24, 0.46), rng.int(13, 22), rng.range(0.8, 1.25)); }
    x += rng() < 0.4 ? rng.range(4.5, 8.5) : rng.range(1.6, 3.4); }
  for (let i = 0; i < 12; i++) { if ((i & 3) === 0) await ctx.yield();
    const x = rng.range(-48, 40), z = bankZ(x) + rng.range(1.2, 2.6); tussock(x, barY(x, z), z, rng.range(0.2, 0.34), rng.range(0.28, 0.44), rng.int(10, 20)); }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  await ctx.yield();
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aOff', new THREE.Float32BufferAttribute(off, 3));
  await ctx.yield();
  g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 4)); g.setIndex(idx);
  return { geometry: g, barY, front, bankZ, bankTop, lip };
}

const SHADOW_VERT = /* glsl */`
attribute vec3 aS; varying vec3 vS;
#include <fog_pars_vertex>
void main(){ vS = aS; vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uSky; uniform float uShK; varying vec3 vS;
#include <fog_pars_fragment>
void main(){
  float ac = 1.0 - vS.x * vS.x; float t = clamp(vS.y, 0.0, 1.0);
  float al = ac * ac * (0.5 * (1.0 - t) * (1.0 - 0.6 * t) + 0.4 * exp(-t * 16.0)) * smoothstep(0.0, 0.04, t) * vS.z * uShK;
  if (al < 0.004) discard;
  gl_FragColor = vec4(uSky * 0.06, min(al, 0.8));
  #include <fog_fragment>
}`;
const STEM_FRAG = /* glsl */`
varying vec3 vN; varying vec3 vWp; varying vec3 vCol;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  vec3 Vv = cameraPosition - vWp; Vv /= max(length(Vv), 1e-4);
  vec3 N = Vv * 0.7 + vec3(0.0, 0.6, 0.0) + vN * 0.2; N /= max(length(N), 1e-3);
  float bk = max(dot(-Vv, uSunDir), 0.0);
  gl_FragColor = vec4(shade(vCol, N, Vv, 1.0, 0.0) + uSunCol * 0.5 * bk * bk, 1.0);
  #include <fog_fragment>
}`;
function stemGeometry() {
  const pos = [], nor = [], col = [], idx = [];
  const strip = (x0, x1, hw, axis, c0, c1) => { const v0 = pos.length / 3, n = 4;
    for (let i = 0; i <= n; i++) { const t = i / n, x = mix(x0, x1, t), w = hw * (1 - 0.5 * Math.abs(t - 0.5)), c = [mix(c0[0], c1[0], t), mix(c0[1], c1[1], t), mix(c0[2], c1[2], t)], bend = 0.03 * Math.sin(t * 3);
      for (const s of [-1, 1]) { pos.push(x, axis ? bend : s * w + bend, axis ? s * w : 0); nor.push(0, axis ? 1 : 0, axis ? 0 : 1); col.push(c[0], c[1], c[2]); } }
    for (let i = 0; i < n; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } };
  const BUFF = [0.36, 0.29, 0.16], PLUME = [0.62, 0.6, 0.6];
  strip(-0.5, 0.5, 0.006, 0, BUFF, BUFF); strip(-0.5, 0.5, 0.006, 1, BUFF, BUFF);
  strip(0.22, 0.56, 0.035, 0, BUFF, PLUME); strip(0.22, 0.56, 0.035, 1, BUFF, PLUME); strip(-0.2, 0.1, 0.02, 0, BUFF, BUFF);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}
const instAttr = (g, name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size));
function quadGeo(two) {
  const g = new THREE.InstancedBufferGeometry();
  const p = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], i = [0, 1, 2, 0, 2, 3];
  if (two) { p.push(-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1); i.push(4, 5, 6, 4, 6, 7); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(i);
  return g;
}

const HOURS = {   // key colour scale, sky fill scale, steam opacity, sleepers share
  dawn: { sun: null, k: 1.25, sky: 0.8, steam: 1, sleep: 0.0 },
  blue: { sun: '#9C8FCB', k: 0.45, sky: 0.6, steam: 1.1, sleep: 0.45 },
  morning: { sun: '#FFF1DC', k: 1.5, sky: 0.7, steam: 0.45, sleep: 0.0 },
  evening: { sun: '#FFB25E', k: 1.3, sky: 0.65, steam: 0.9, sleep: 0.1 },
  moon: { sun: '#9FB4E8', k: 0.5, sky: 0.22, steam: 0.8, sleep: 0.5 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const palette = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = ctx.quality?.detail ?? 1;
  const hour = HOURS[opts.hour] || HOURS.dawn, weather = opts.weather || 'still', season = opts.season || 'winter';
  const shared = makeShared(palette, opts);
  shared.uSunCol.value.copy(lin(hour.sun || palette[3])).multiplyScalar(hour.k * (weather === 'snow' ? 0.45 : 1)); shared.uRimCol.value.copy(shared.uSunCol.value);
  shared.uSky.value.copy(lin(palette[4])).multiplyScalar(hour.sky * (weather === 'snow' ? 1.25 : 1));
  shared.uGround.value.copy(lin(palette[4])).lerp(lin(palette[2]), 0.4).multiplyScalar(0.42 * hour.sky / 0.8);
  shared.uRate = { value: 0 }; shared.uDance = { value: 0 };      // uDance: the clock of the extra pairs (the world keys it to the path, so their leaps come where the lens is)
  const leaveSeconds = opts.leaveSeconds ?? 16;
  const root = new THREE.Group(); root.name = 'cranes-in-steam-hero';
  const mk = (vs, fs, names, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...FOGU(), ...pickU(shared, names) }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  const LIGHTS = ['uSunDir', 'uSunCol', 'uSky', 'uGround', 'uRimCol'];

  // --- the setting
  const COVES = [-36, -17, 2, 21];
  const set = await buildSetting(ctx, rng.fork('setting'), noise, { detail, coves: COVES, lineDist: opts.lineDist, wind: weather === 'wind' ? 3.2 : 1 });      // (wind: the sway of the setting's blades in this visit, as setMat.uWind below)
  const setMat = mk(SET_VERT, SET_FRAG, ['uTime', 'uPx', ...LIGHTS], { side: THREE.DoubleSide });
  setMat.uniforms.uWind = { value: weather === 'wind' ? 3.2 : 1 };
  setMat.uniforms.uSnow = { value: season === 'thaw' ? -0.5 : weather === 'snow' ? 0.8 : 0 };
  const setMesh = new THREE.Mesh(set.geometry, setMat); setMesh.frustumCulled = false; root.add(setMesh);
  await ctx.yield();

  // --- the dancers: a composed stage, not a scatter. The camera passes lineZ (default 9.6) with its gaze turned
  //     40 degrees left, so the FRONT ROW stands 4.6-5.2 m from the line along the gravel lip, a bowing pair and
  //     a leaping pair alternating every dozen metres; a MIDDLE ROW fills the gaps and a BACK ROW stands against
  //     the dark cut bank. Pairs are weighted downstream so the bar is still full when we are halfway along it.
  const cr = rng.fork('cranes'); const list = [], puffs = [], pairs = [];
  const lineZ = opts.lineZ ?? 9.6;
  const count = Math.round(clamp(opts.count ?? cr.int(21, 25) * 2, 28, 96) / 2) * 2;
  const x0 = cr.range(-0.3, 0.3);
  const frontZ = (x, lat) => Math.min(lineZ - lat, set.front(x) - 1.0);
  // Two ranks along the gravel lip, so that wherever the lens is on the pass four pairs stand inside 6-11 m of it. RANK A: a pair every
  // 4.2 m, its nearer bird 5 m from our line (no creature stands nearer than that), and every other pair leaps. RANK B stands 7.3-8.5 m
  // off, half a step along. A thin back rank rests against the bank; a few single birds stand at the lip itself.
  // The ranks are not ruled lines: some pairs dance, some call, some only stand, preen or sleep on one leg; each pair is turned its own way
  // and stands a little nearer or further from the water.
  // Every dancer on the bar runs on world time (shared.uTime): from a held camera they bow, leap and call. Along rank A the phases step
  // by 0.37 of a cycle from pair to pair, so at any moment several of its leapers are off the ground somewhere along the bar.
  const KA = ['bow', 'leap', 'duet', 'leap', 'idle', 'leap', 'toss', 'leap', 'bow', 'leap', 'preen', 'leap'];
  const KB = ['leap', 'bow', 'idle', 'leap', 'duet', 'sleep', 'leap', 'bow', 'preen', 'leap', 'duet', 'bow'];
  const fixed = [], pc = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':dance-floor'));
  const NEAREST = 5.0;
  for (let i = 0, x = -44.6; x < 38.6; i++, x += 4.2) {
    const kind = KA[i % KA.length], leap = kind === 'leap', dance = leap || kind === 'bow', xa = x + x0 + pc.range(-0.3, 0.3);
    const lat = leap ? NEAREST + 0.42 : kind === 'bow' ? NEAREST + 0.45 + pc.range(0, 0.4) : NEAREST + 0.5 + pc.range(0, 0.9);
    const ang = (leap ? 2.72 : kind === 'duet' ? 0.2 : 0.49) + pc.range(-1, 1) * (leap ? 0.2 : kind === 'duet' ? 0.3 : 0.6) + (!dance && kind !== 'duet' && pc.chance(0.5) ? Math.PI : 0);
    const T = leap ? 7 : kind === 'bow' ? 8 : undefined;
    const ph = (0.3 + 0.37 * i) % 1;
    fixed.push({ kind, x: xa, z: frontZ(xa, lat), ang, H: leap ? pc.range(1.8, 2.1) : 0, ph, T, front: true, turn: dance || kind === 'duet' ? 0 : 1.2 });
  }
  const nA = fixed.length;
  for (let i = 0, x = -42.5; x < 36.6; i++, x += 4.2) {
    const kind = KB[i % KB.length], leap = kind === 'leap', dance = leap || kind === 'bow', xb = x + x0 + pc.range(-0.4, 0.4), z = Math.min(lineZ - 7.3 - pc.range(0, 1.2), set.front(xb) - 2.6);
    if (fixed.some((f) => Math.hypot(f.x - xb, f.z - z) < 2.2)) continue;
    fixed.push({ kind, x: xb, z, ang: (leap ? 2.6 : kind === 'duet' ? -0.25 : 0.6) + pc.range(-1, 1) * (dance ? 0.3 : 0.7), H: leap ? pc.range(1.3, 1.9) : 0, ph: (0.62 + 0.29 * i) % 1, T: leap ? pc.range(6.5, 8) : undefined, second: true, turn: dance || kind === 'duet' ? 0 : 1.2 });
  }
  const far = (x, z, d) => pairs.every((p) => Math.hypot(p.x - x, p.z - z) > d);
  for (const f of fixed) pairs.push(f);
  const nBack = Math.max(4, Math.round((count - 2 * fixed.length) / 2));
  for (let k = 0, guard = 0; k < nBack && guard < 800; guard++) {
    const x = pc.range(-44, 36), z = pc.range(-6.0, -2.4); if (!far(x, z, 3.2)) continue;
    const r = pc(); let kind = r < 0.25 ? 'duet' : r < 0.6 ? 'idle' : 'preen'; if (pc() < hour.sleep) kind = 'sleep';
    pairs.push({ kind, x, z, ang: pc.range(-0.7, 0.7) + (pc.chance(0.5) ? Math.PI : 0), H: 0 }); k++;
  }
  // the lip birds: two cranes at each small bay of the lip, 5 m off our line, between the pairs of rank A
  const waders = [];
  COVES.forEach((c, i) => { [-1, 1].forEach((sd) => { const xw = c + sd * pc.range(0.7, 1.1), z = Math.min(set.front(xw) + 0.4, lineZ - NEAREST) - (sd > 0 ? 0 : 0.35);
    if (fixed.some((f) => Math.hypot(f.x - xw, f.z - z) < 1.5)) return;
    waders.push({ x: xw, z, kind: sd > 0 ? (i % 2 ? 'preen' : 'stretch') : (i % 2 ? 'stretch' : 'sleep'), hd: Math.PI / 2 + (sd > 0 ? Math.PI : 0) + pc.range(-0.5, 0.5), ph: pc() }); }); });
  const xr = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':extra-cranes'));
  for (const p of opts.extraPairs || []) pairs.push({ ...p, extra: true, H: p.H ?? xr.range(1.2, 1.9), ph: p.ph ?? xr(), T: p.T ?? (p.kind === 'leap' ? 7 : xr.range(6.5, 9)) });
  let curExtra = false, curGrp = 0;
  const groundOf = (x, z, extra) => (extra && opts.extraGround ? opts.extraGround(x, z) : Math.max(set.barY(x, z), -0.06));
  let curFront = false;
  const addBird = (b) => { b.extra = curExtra; b.grp = curExtra ? curGrp : 0; b.near = curFront; if (!curExtra) b.z = Math.min(b.z, lineZ - NEAREST); b.y = b.y ?? groundOf(b.x, b.z, curExtra); b.scale = b.scale ?? cr.range(0.95, 1.04); list.push(b); return b; };
  const breath = (R, b, cn, size, per) => puffs.push({ b, off: cn - b.phase, per: per ?? b.period, size, seed: R() });
  let leapPair = null, tossers = [];
  pairs.forEach((p, pi) => {
    curExtra = !!p.extra; curGrp = p.g ?? 0; curFront = !!p.front; const R = p.extra ? xr : cr;        // the extra pairs draw from their own stream, so the bar and the leavers do not depend on them
    const duet = p.kind === 'duet', pa = p.ang + (duet ? Math.PI / 2 : 0);          // a duet stands side by side, in profile to the river
    const ax = Math.cos(pa), az = Math.sin(pa), sep = duet ? 0.40 : R.range(0.8, 1.0);
    const T = p.T ?? R.range(6.5, 9.0), ph = p.ph ?? R(), juv = (!p.front && R.chance(0.08)) ? 2 : 0;
    for (const s of [-1, 1]) {
      const male = s > 0 ? 1 : 0, x = p.x + ax * sep * s - (duet ? az * 0.22 * s : 0), z = p.z + az * sep * s + (duet ? ax * 0.22 * s : 0);
      let b = { x, z, heading: Math.atan2(-ax * s, -az * s), period: T, phase: ph, scale: (male ? 1.03 : 0.97) * R.range(0.98, 1.02) * (p.big ?? 1) };
      const jv = p.juv && !male ? 2 : juv;                                  // a family: the bird beside the cock is this year's young, tawny-necked
      if (p.kind === 'leap' || p.kind === 'bow') { b.type = 1; b.phase = (ph + (male ? 0 : 0.76)) % 1; b.c = [p.kind === 'leap' ? p.H * (male ? 1 : R.range(0.7, 0.95)) : 0, 0, male, juv]; }
      else if (p.kind === 'duet') { b.type = 2; b.heading = Math.atan2(-az, ax) + R.range(-0.15, 0.15); b.period = T * 0.8; b.c = [0, 0, male, 0]; }
      else if (p.kind === 'toss') { if (male) { b.type = 3; b.period = 9; b.c = [0.95, 0, 1, 0]; } else { b.type = 0; b.c = [1, 0, 0, 0]; } }
      else if (p.kind === 'sleep') { b.type = 5; b.heading += R.range(-1, 1); b.c = [0, male, 0, 0]; }
      else if (p.kind === 'preen') { b.type = male ? 4 : 0; b.c = [1, R.chance(0.5) ? 1 : 0, 0, jv]; }
      else { b.type = 0; b.phase = R(); b.c = [R.chance(0.6) ? 1 : 0, 0, male, jv]; }
      if (p.turn && b.type !== 5) b.heading += pc.range(-p.turn, p.turn);          // a pair that only stands or preens: each bird looks where it pleases
      addBird(b);
      if (b.type === 2) { const K = male ? 5 : 10; for (let k = 0; k < 3; k++) breath(R, b, male ? (k + 1.25) / K : (2 * k + 2.25) / K, male ? 0.62 : 0.44); breath(R, b, 0.93, 0.3); }
      else if (b.type !== 5) { breath(R, b, R(), 0.34); breath(R, b, R(), 0.3); if (b.type === 1 && b.c[0] > 0) breath(R, b, 0.76, 0.5); }
      else breath(R, b, R(), 0.22);
      if (b.type === 3) tossers.push(b);
      if (p === fixed[1] && male) leapPair = b;
    }
  });
  curExtra = false; curFront = true;
  for (const w of waders) {
    const b = { x: w.x, z: w.z, heading: w.hd, period: pc.range(7, 10), phase: w.ph, scale: pc.range(0.98, 1.05) };
    if (w.kind === 'sleep') { b.type = 5; b.c = [0, pc.chance(0.5) ? 1 : 0, 0, 0]; } else if (w.kind === 'preen') { b.type = 4; b.c = [1, pc.chance(0.5) ? 1 : 0, 0, 0]; } else { b.type = 0; b.c = [1, 0, 1, 0]; }
    addBird(b); breath(cr, b, pc(), b.type === 5 ? 0.22 : 0.34);
  }
  await ctx.yield();

  // --- the leavers: stand in the shallows off the downstream end, then run, lift and fly through the exit.
  //     The take-off clock tau advances 1 s for every 12.6 m the camera travels (the world sets it from u), so a
  //     bird on the wing holds a fixed distance ahead of the lens: each one's delay is solved from the gap it
  //     is to keep (8-15 m; the rare roost 8-34 m), and the camera can never overtake one.
  const E = new THREE.Vector3(...(opts.exit || [150, 7.5, lineZ]));
  const camX0 = opts.camX0 ?? 12, VF = 12.6, RUNUP = 0.5 * 4.5 * 2.8 * 2.8;     // camera x at tau = 0; cruise speed; metres covered while accelerating
  const nLeave = Math.max(0, Math.round(opts.leavers ?? 12)), leavers = [], rings = [];
  const delayFor = (x, gap) => Math.max((x - RUNUP - camX0 - gap) / VF, 0);
  const aim = (left, r, lo) => { const dz = (left ? -1 : 1) * cr.range(2.7, r), dy = cr.range(lo, 5.0) * Math.sqrt(Math.max(1 - (dz / (r + 0.9)) ** 2, 0)); return [dz, dy]; };
  for (let tries = 0; leavers.length < nLeave && tries < 800; tries++) {
    const left = leavers.length % 12 < 7, x = cr.range(46, 58), z = lineZ + (left ? -cr.range(4.6, 10.5) : cr.range(5.0, 10.5));
    if (!leavers.every((l) => Math.hypot(l.x - x, (l.z - z) * 1.4) > 2.4)) continue;
    const [dz, dy] = aim(left, 4.8, -2.6), gap = Math.min(cr.range(7, 13), x - RUNUP - camX0 - 1);
    leavers.push({ x, y: -0.06, z, type: 6, heading: Math.atan2(E.x - x, E.z + dz - z), phase: cr(), period: 4, scale: cr.range(0.95, 1.04), aimY: E.y + dy, tuck: cr.chance(0.35) ? 1 : 0, wait: delayFor(x, gap), climb: 30 });
  }
  // the rare event: the rest of the roost, packed into the shallows round the tail of the bar, goes up as the eagle comes back
  const nRoost = Math.max(0, Math.round(opts.roost ?? 0));
  for (let i = 0, tries = 0; i < nRoost && tries < 4000; tries++) {
    const left = i % 2 === 0, x = 46 + 38 * Math.pow(cr(), 1.7), z = lineZ + (left ? -1 : 1) * cr.range(3.4, 10);
    if (!leavers.every((l) => Math.hypot(l.x - x, (l.z - z) * 1.3) > 2.0)) continue;
    const [dz, dy] = aim(left, 5.3, -1.2), gap = Math.min(8 + 26 * Math.pow(cr(), 1.4), x - RUNUP - camX0 - 0.5);
    leavers.push({ x, y: -0.06, z, type: 6, heading: Math.atan2(E.x - x, E.z + dz - z), phase: cr(), period: 4, scale: cr.range(0.95, 1.04), aimY: E.y + dy, tuck: cr.chance(0.35) ? 1 : 0, wait: delayFor(x, gap), climb: cr.range(20, 32), roost: true }); i++;
  }
  const flock = [];
  leavers.forEach((l) => {
    l.c = [l.wait, l.climb, l.aimY - l.y - 0.92 * l.scale, l.tuck]; flock.push(l);
    for (let k = 0; k < (l.roost ? 2 : 4); k++) puffs.push({ b: l, off: k / (l.roost ? 2 : 4) + cr.range(0, 0.1), per: 2, size: 0.34, seed: cr() });   // a trail of breath in flight
    const S = 2.0 * l.scale, fx = Math.sin(l.heading), fz = Math.cos(l.heading);
    for (const [o, side] of [[0.18, -1], [0.68, 1]]) for (let k = 0; k < 3; k++) { const s = (k + 1 - o) * S - 0.0; if (s > 4.6 || s < 0.2) continue;
      const d = s + 0.18 * S, lat = side * 0.065 * l.scale;                       // where that foot comes down
      rings.push(l.x + fx * d + fz * lat, l.z + fz * d - fx * lat, l.c[0] + Math.sqrt(2 * s / 4.5), cr.range(0.5, 0.75)); }
  });

  // --- crane mesh (dancers + leavers in one draw), breath, the tossed reed, splash rings
  await ctx.yield();
  const craneBase = craneGeometry(1);
  const craneMat = mk(CRANE_VERT, CRANE_FRAG, ['uTime', 'uTau', 'uPx', 'uCrown', ...LIGHTS], { side: THREE.DoubleSide });
  const craneMatX = mk(CRANE_VERT, CRANE_FRAG, ['uTime', 'uTau', 'uPx', 'uCrown', ...LIGHTS], { side: THREE.DoubleSide }); craneMatX.uniforms.uTime = shared.uDance;      // the same program on the extra pairs' clock
  const cranes = new THREE.Mesh(instanced(craneBase, list.filter((b) => b.near)), craneMat); cranes.frustumCulled = false; cranes.name = 'cranes'; root.add(cranes);
  await ctx.yield();
  const craneMid = craneGeometry(0.66);                      // the rows behind and the birds on the world's shoals: never nearer than 6 m
  const barMeshes = [cranes], shoalMeshes = [];
  { const m = new THREE.Mesh(instanced(craneMid, list.filter((b) => !b.near && !b.extra)), craneMat); m.frustumCulled = false; m.name = 'cranes-mid'; root.add(m); barMeshes.push(m); }
  const craneX = list.some((b) => b.extra) ? craneGeometry(opts.extraDetail ?? 0.85) : null;       // the shoal pairs come within 7 m of the lens
  const grps = [...new Set(list.filter((b) => b.extra).map((b) => b.grp))].sort((a, b) => a - b);
  for (const gk of grps) { const mine = list.filter((b) => b.extra && b.grp === gk), m = new THREE.Mesh(instanced(craneX, mine), craneMatX); m.name = 'cranes-shoals'; root.add(m); (shoalMeshes[gk] = shoalMeshes[gk] || []).push(m);
    // a group stands on one shoal: its mesh carries the sphere that holds it (leaps included), so a shoal astern of the lens is not drawn
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const b of mine) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x); z0 = Math.min(z0, b.z); z1 = Math.max(z1, b.z); }
    m.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 1.5, (z0 + z1) / 2), Math.hypot(x1 - x0, z1 - z0) / 2 + 5); m.frustumCulled = true; }
  await ctx.yield();
  const flockBase = craneGeometry(0.6);                      // the leavers and the roost never come nearer than 8 m: a lighter bird
  if (flock.length) { const m = new THREE.Mesh(instanced(flockBase, flock), craneMat); m.frustumCulled = false; m.name = 'leavers'; root.add(m); barMeshes.push(m); }
  await ctx.yield();
  const SPR = { transparent: true, depthWrite: false };
  // --- the shadows: every standing crane throws a long soft blue shadow away from the low sun (toward the river and
  //     the lens), laid on the gravel as a strip that follows the ground and stops at the water; a darker patch at the feet
  { const sd = shared.uSunDir.value, hl = Math.hypot(sd.x, sd.z) || 1, dx = -sd.x / hl, dz = -sd.z / hl, LEN = opts.shadowLen ?? 3.2, NSEG = 6;
    const pos = [], as = [], idx = [];
    for (const b of list) { const v0 = pos.length / 3, sc = b.scale || 1;
      for (let i = 0; i <= NSEG; i++) { const t = i / NSEG, a = -0.25 + t * (LEN + 0.25), cx = b.x + dx * a, cz = b.z + dz * a, hw = (0.17 + 0.3 * t) * sc;
        for (const s of [-1, 1]) { const px = cx + dz * s * hw, pz = cz - dx * s * hw, gy = groundOf(px, pz, b.extra); pos.push(px, gy + 0.03, pz); as.push(s, t, gy > 0.04 ? 1 : 0); } }
      for (let i = 0; i < NSEG; i++) { const a = v0 + i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(as, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, mk(SHADOW_VERT, SHADOW_FRAG, ['uSky'], { ...SPR, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.material.uniforms.uShK = { value: opts.shadowK ?? 1 };
    m.frustumCulled = false; m.renderOrder = 1; m.name = 'shadows'; root.add(m); }
  await ctx.yield();
  for (const grp of [-1, ...grps]) { const extra = grp >= 0, mine = puffs.filter((p) => (p.b.extra ? p.b.grp : -1) === grp); if (!mine.length) continue;      // breath follows its bird's own clock
    const g = quadGeo(false), A = [], B = [], C = [], D = [];
    for (const p of mine) { const b = p.b; A.push(b.x, b.y, b.z, b.heading); B.push(b.type, b.phase, b.period, b.scale); C.push(...b.c); D.push(p.off, p.per, p.size, p.seed); }
    instAttr(g, 'iA', A, 4); instAttr(g, 'iB', B, 4); instAttr(g, 'iC', C, 4); instAttr(g, 'iD', D, 4); g.instanceCount = mine.length;
    const m = new THREE.Mesh(g, mk(PUFF_VERT, SPRITE_FRAG, ['uTime', 'uTau', 'uRate', 'uRose', 'uViolet', ...LIGHTS], SPR)); m.frustumCulled = false; m.renderOrder = 3; root.add(m);
    if (extra) { m.material.uniforms.uTime = shared.uDance; (shoalMeshes[grp] = shoalMeshes[grp] || []).push(m); } }
  if (tossers.length) { const g = instanced(stemGeometry(), tossers);
    const m = new THREE.Mesh(g, mk(STEM_VERT, STEM_FRAG, ['uTime', 'uTau', 'uPx', ...LIGHTS], { side: THREE.DoubleSide })); m.frustumCulled = false; root.add(m); }
  if (rings.length) { const g = quadGeo(true); instAttr(g, 'iR', rings, 4); g.instanceCount = rings.length / 4;
    const m = new THREE.Mesh(g, mk(RING_VERT, RING_FRAG, ['uTau', 'uSunCol', 'uSky'], { ...SPR, side: THREE.DoubleSide })); m.frustumCulled = false; m.renderOrder = 2; root.add(m); }

  // --- steam: a lit curtain between the dancers and the bank, a glow above the bank, wisps peeling off the water
  const sr = rng.fork('steam');
  if (opts.steam !== false) { const g = quadGeo(false), P = [], Q = [], k = hour.steam * (weather === 'wind' ? 0.6 : 1), n = (c) => Math.round(c * (0.6 + 0.4 * detail));
    for (let i = 0; i < n(40); i++) { P.push(sr.range(-58, 58), sr.range(4.6, 7.0), sr.range(-16.5, -12.0), sr.range(5, 8)); Q.push(sr(), 0, 1.8, sr.range(0.5, 0.8) * k); }     // the lit curtain rising behind the bank lip
    for (let i = 0; i < n(18); i++) { P.push(sr.range(-58, 58), sr.range(7.5, 11), sr.range(-22, -15), sr.range(8, 12)); Q.push(sr(), 0, 1.6, sr.range(0.4, 0.62) * k); }
    for (let i = 0; i < 9; i++) { P.push(-52 + i * 12.5 + xr.range(-3, 3), xr.range(5.2, 7.4), xr.range(-13.5, -11.5), xr.range(6.5, 9.5)); Q.push(xr(), 0, 1.9, xr.range(0.7, 0.95) * k); }        // big rose heads right over the lip
    for (let i = 0; i < n(26); i++) { const fr = sr.chance(0.6); P.push(sr.range(-54, 54), sr.range(0.3, 0.7), fr ? sr.range(11.5, 17) : sr.range(-1, 6), fr ? sr.range(1.6, 2.8) : sr.range(1.0, 1.7)); Q.push(sr(), sr.range(0.06, 0.12), 1.4, (fr ? sr.range(0.16, 0.28) : sr.range(0.1, 0.18)) * k); }
    instAttr(g, 'iP', P, 4); instAttr(g, 'iQ', Q, 4); g.instanceCount = Q.length / 4;
    const m = new THREE.Mesh(g, mk(STEAM_VERT, SPRITE_FRAG, ['uTime', 'uRose', 'uViolet', ...LIGHTS], SPR)); m.frustumCulled = false; m.renderOrder = 1; m.name = 'steam'; root.add(m); }

  // --- diamond dust and the steady fall of frost crystals
  { const nD = Math.round((weather === 'snow' ? 900 : 520) * detail), p = new Float32Array(nD * 3), d = new Float32Array(nD * 4);
    for (let i = 0; i < nD; i++) { p.set([sr.range(-48, 48), sr.range(0, 10), sr.range(-15, 15)], i * 3); d.set([sr(), sr.range(0.08, 0.3) * (weather === 'snow' ? 3 : 1), sr.range(1.5, 5.5), sr.range(0.02, 0.04) * (weather === 'snow' ? 1.6 : 1)], i * 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aD', new THREE.BufferAttribute(d, 4));
    const m = new THREE.Points(g, mk(DUST_VERT, DUST_FRAG, ['uTime', 'uPx', 'uSunCol'], { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.frustumCulled = false; m.renderOrder = 4; root.add(m); }
  await ctx.yield();

  // --- anchors (local space)
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const np = fixed[Math.min(8, nA - 1)];
  const anchors = {
    flyThrough: [v3(-75, 2, lineZ), v3(-40, 2, lineZ), v3(0, 2, lineZ), v3(40, 2, lineZ), v3(90, E.y, mix(lineZ, E.z, 0.45)), v3(E.x, E.y, E.z)],
    closestPass: v3(np.x, 2, lineZ),
    lookAt: v3(np.x + 2, 1.6, 2.5),
    nearestPair: v3(np.x, set.barY(np.x, np.z), np.z),
    leapPair: v3(fixed[1].x, set.barY(fixed[1].x, fixed[1].z), fixed[1].z),
    portalSeat: { position: E.clone(), facing: v3(-1, 0, 0) },
    leaveStart: v3(52, 0, lineZ),
    leaversLeft: v3(52, 0, lineZ - 7.5), leaversRight: v3(52, 0, lineZ + 7.5),
    sunDir: shared.uSunDir.value.clone(),
    barEnds: [v3(-44, 0.3, 0), v3(44, 0.3, 0)],
    bankTop: v3(0, 3.1, -9.5),
    waterY: 0,
  };

  const radius = 44, height = 4.5, center = v3(np.x + 2, 1.5, 3); let progress = 0;

  const size = new THREE.Vector2();
  const setProgress = (p) => { progress = clamp(p, 0, 1); }; let danceSet = false;
  return {
    object: root, radius, height, center, anchors, shared, ground: true, groundY: 0,
    counts: { dancers: count, leavers: leavers.length, lipTussocks: set.lip.made, lipNotMade: set.lip.notMade }, birds: { dancers: list, flock },
    setProgress,
    setDance(t) { danceSet = true; shared.uDance.value = t; },      // the extra pairs' clock, seconds; left alone it follows time
    setShown(bar, shoals) { for (const m of barMeshes) m.visible = !!bar; shoalMeshes.forEach((ms, gk) => { if (ms) for (const m of ms) m.visible = Array.isArray(shoals) ? !!shoals[gk] : !!shoals; }); },      // meshes only: the world hides the cranes that are a long way off
    setLight({ sunDir, sunColor, sky, ground } = {}) {
      if (sunDir) shared.uSunDir.value.set(sunDir.x ?? sunDir[0], sunDir.y ?? sunDir[1], sunDir.z ?? sunDir[2]).normalize();
      if (sunColor) { shared.uSunCol.value.copy(sunColor); shared.uRimCol.value.copy(sunColor); } if (sky) shared.uSky.value.copy(sky); if (ground) shared.uGround.value.copy(ground);
    },
    update(dt, time, camera) {
      shared.uTime.value = time; if (!danceSet) shared.uDance.value = time;
      const tau = progress * leaveSeconds - 1.0;
      shared.uRate.value = opts.rate ?? (progress > 0 && progress < 1 ? 1 : 0);      // the take-off clock runs in real time when leaveSeconds matches the flight (a pure function of progress)
      shared.uTau.value = tau;
      if (camera && camera.isPerspectiveCamera) { ctx.renderer.getDrawingBufferSize(size); shared.uPx.value = ((2 * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(size.y, 1)); }
    },
    dispose() { craneBase.dispose(); craneMid.dispose(); flockBase.dispose(); craneX?.dispose(); },
  };
}
