// BROUGHT IN: the hash hash12 follows "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License, published on Shadertoy; the same form as the kit's fx.js.
// valley-inside-the-works: THE ONE SHADER FAMILY of everything liquid (river, fall, folds, ribbons, cream, froth).
// A thick opaque dark satin liquid: it mirrors the room (a small picture of the shed made by a function of
// direction, read along the reflected view), is lit by the scene's own two lights under the plan's bars of light,
// and carries flow lines, slow swells, soft folds and marbling in stream coordinates. It reads the eye only for
// its sheen and its mirror.
// Vertex data: aUv (across, along; metres of stream), aFlow (xyz the way it runs; on a vertex that moves, its length
// is the bulge's phase per metre; w its speed in m/s), aPleat (phase in metres, height in metres, its gradient across
// and along the stream, per metre; on the fall's sheet zw: how its thickness changes across and along, per metre; on
// a drop xyz: its middle), aMix (bank 0..1 and 1..2 over the lip; thin 0..1, on the fall's sheet its thickness; froth
// 0..1; cream 0..1), aAux (0 pleats that travel, 1 that stand, 2 a trough under its roller, 3 the fall's sheet, 4 a
// falling drop; across-units per metre; the stream's half width), aMove (a travelling bulge: its height, the body's
// sway, the phase here, the sway's phase; on a drop: how far it falls, how long one takes, where in that time it is).
import { LIGHT_BAR_GLSL, PIPES, pipeX, pipeRunY, riverX, GREAT_PIPE, BOAT, boatX } from './valley-inside-the-works-plan.js';
import { CUT, FOOT_Z, ZA, SB } from './valley-inside-the-works-chocolate-lip.js';
import { SHORE, streamV } from './valley-inside-the-works-chocolate-river.js';
import { HULL } from './valley-inside-the-works-chocolate-pool.js';

const f1 = (v) => v.toFixed(3);
// the way the stream runs where the pipes stand
const PIPE_FLOW = (() => { const dx = (riverX(PIPES.riseZ + 0.5) - riverX(PIPES.riseZ - 0.5)), l = Math.hypot(dx, 1); return [dx / l, 1 / l]; })();
// the plan's rank of pipes, for the mirror: the first riser's x, their step, their z, their radius, the last one's run height
const PIPE_DEFS = `#define PIPE_X0 ${f1(pipeX(0))}\n#define PIPE_STEP ${f1(PIPES.step)}\n#define PIPE_Z ${f1(PIPES.riseZ)}\n#define PIPE_R ${f1(PIPES.across / 2)}\n#define PIPE_TOP ${f1(pipeRunY(PIPES.count - 1))}\n#define SHEET_CUT ${f1(CUT)}\n#define SHEET_V0 ${f1(streamV(ZA) + SB)}\n#define SHEET_SB ${f1(SB)}\n#define PIPE_FOOT 0.6\n#define FOOT_Z ${f1(FOOT_Z)}\n#define SHORE ${f1(SHORE)}\n#define PIPE_F vec2(${f1(PIPE_FLOW[0])}, ${f1(PIPE_FLOW[1])})\n`;

// the plan's great pipe (its axis, the glass's radius) and the moored boat (its middle line, where its hull's stations begin and how they lie)
const MOOR_DEFS = `#define GREAT_X ${f1(GREAT_PIPE.x)}\n#define GREAT_Z ${f1(GREAT_PIPE.z)}\n#define GREAT_R ${f1(GREAT_PIPE.across / 2)}\n#define BOAT_X ${f1(boatX())}\n#define BOAT_Z0 ${f1(BOAT.z + HULL.z0)}\n#define HULL_DZ ${f1(HULL.dz)}\n#define HULL_LEN ${f1(HULL.dz * (HULL.half.length - 1))}\n#define HULL_N ${HULL.half.length - 1}\n#define HULL_M ${HULL.half.length}\n`;

const VERT = /* glsl */`
attribute vec2 aUv; attribute vec4 aFlow; attribute vec4 aPleat; attribute vec4 aMix; attribute vec3 aAux; attribute vec4 aMove;
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vFlow; varying vec4 vPleat; varying vec4 vMix; varying vec3 vAux;
#include <common>
#include <fog_pars_vertex>
void main() {
  // a body that falls: slow bulges travel down it (one every 1.4 s) and it sways; both are laws of the place along it
  // and of the world's clock alone (aMove: bulge height, sway, phase, the body's number; |aFlow.xyz|: phase per metre)
  float th = aMove.z - 4.4 * uTime, c = 0.5 + 0.5 * cos(th);
  float th2 = 0.15 * th + aMove.w;
  // (on the falling sheet the bulge is a plain swing; on the pool it is a ROLL: a broad round back and a narrow crease)
  float roll = 1.0 - step(0.5, aAux.x);
  float lift = aMove.x * mix(c, c * (2.0 - c), roll), dLift = -aMove.x * mix(0.5, 1.0 - c, roll) * sin(th);
  float sway = aMove.y * sin(th2), dSway = aMove.y * 0.15 * cos(th2);
  vec3 moved = position + normal * lift + vec3(sway, 0.0, 0.0);
  vec3 n = normal - aFlow.xyz * (dLift + normal.x * dSway);
  // a drop under a strand (aAux.x 4; aPleat.xyz its middle; aMove: how far it falls, how long one drop takes, where in
  // that time it is): it swells where it hangs, lets go, is drawn out a little as it falls, and is gone in the pool
  float drop = step(3.5, aAux.x), tau = fract(uTime / max(aMove.y, 0.5) + aMove.z), go = max(tau - 0.45, 0.0) / 0.55;
  vec3 dr = aPleat.xyz + (position - aPleat.xyz) * smoothstep(0.0, 0.4, tau) * vec3(1.0, 1.0 + 0.5 * go, 1.0) - vec3(0.0, aMove.x * go * go, 0.0);
  moved = mix(moved, dr, drop); n = mix(n, normal, drop);
  vec4 wp = modelMatrix * vec4(moved, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vUv = aUv; vFlow = aFlow; vPleat = aPleat * (1.0 - drop); vMix = aMix; vAux = aAux;
  vMix.z = mix(aMix.z, c * step(0.0005, aMove.x), roll);   // (on the pool: how near a travelling fold's crest is)
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG_HEAD = /* glsl */`
uniform float uTime; uniform vec3 uSunDir; uniform vec3 uBody; uniform vec3 uCream; uniform vec3 uGold; uniform vec3 uMousse; uniform vec4 uTune; uniform vec4 uSeed; uniform vec4 uSpring; uniform vec3 uWarm; uniform vec4 uRollZ; uniform vec4 uRollV; uniform vec4 uPier[10]; uniform vec4 uDrop[8]; uniform vec3 uHold[3];
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vFlow; varying vec4 vPleat; varying vec4 vMix; varying vec3 vAux;
#include <common>
#include <lights_pars_begin>
#include <fog_pars_fragment>
${LIGHT_BAR_GLSL}
${PIPE_DEFS}${MOOR_DEFS}// hash12: brought in, "Hash without Sine" (David Hoskins, MIT License); see the head of this file
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
// a pulse that is 1 on [a, 20) of every 20, filtered over the width f: the roof's glass as the mirror sees it
// (written here; the way of it, differencing the pulse's integral across the footprint, is the known box filter of a procedural pattern)
float teeth(float x, float a, float f) {
  float x1 = x + 0.5 * f, x0 = x - 0.5 * f;
  float i1 = floor(x1 / 20.0) * (20.0 - a) + max(mod(x1, 20.0) - a, 0.0);
  float i0 = floor(x0 / 20.0) * (20.0 - a) + max(mod(x0, 20.0) - a, 0.0);
  float c = clamp((i1 - i0) / max(f, 0.05), 0.0, 1.0);
  c = c * c * (3.0 - 2.0 * c);
  return mix(c, (20.0 - a) / 20.0, smoothstep(9.0, 24.0, f));
}
// the iron columns (four rows, one every 20 m) as upright streaks in the mirror: 0 clear .. 1 hidden by a column.
// pw: how far the mirrored ray turns from one pixel to the next (so a far column is spread, never a flicker)
float columns(vec3 P, vec3 R, float sig, float pw) {
  float dl = max(length(R.xz), 1e-3);
  vec2 Dn = R.xz / dl;
  float sx = max(abs(Dn.x), 1e-3), dark = 0.0;
  for (int i = 0; i < 4; i++) {
    float X = i == 0 ? -52.0 : (i == 1 ? -14.0 : (i == 2 ? 14.0 : 52.0));
    float tc = (X - P.x) * Dn.x / max(Dn.x * Dn.x, 1e-6);
    float zc = P.z + Dn.y * tc;
    float W = min(1.4 / sx, 400.0);
    float zf = Dn.y < 0.0 ? 20.0 * floor(min(zc + W, P.z) / 20.0) : 20.0 * ceil(max(zc - W, P.z) / 20.0);
    float stepZ = Dn.y < 0.0 ? -20.0 : 20.0;
    for (int k = 0; k < 2; k++) {
      vec2 d = vec2(X - P.x, zf + stepZ * float(k) - P.z);
      float s = dot(d, Dn), perp = abs(d.x * Dn.y - d.y * Dn.x);
      float b = max((sig + pw) * s, 0.1);
      float cover = clamp((0.78 + b - perp) / (2.0 * b), 0.0, 1.0) * clamp(1.6 / b, 0.0, 1.0);
      float y = P.y + R.y * s / dl;
      dark = max(dark, cover * step(1.0, s) * (1.0 - smoothstep(49.0, 54.0, y)));
    }
  }
  return dark;
}
// the rank of seven pipes that stands in the pool (the plan's PIPES): each riser an upright streak in the mirror
float pipesIn(vec3 P, vec3 R, float sig, float pw) {
  float dl = max(length(R.xz), 1e-3), dark = 0.0;
  vec2 Dn = R.xz / dl;
  for (int i = 0; i < 7; i++) {
    vec2 d = vec2(PIPE_X0 + PIPE_STEP * float(i) - P.x, PIPE_Z - P.z);
    float s = dot(d, Dn), perp = abs(d.x * Dn.y - d.y * Dn.x);
    float b = max((sig + pw) * s, 0.06);
    float cover = clamp((PIPE_R + b - perp) / (2.0 * b), 0.0, 1.0) * clamp(1.0 / b, 0.0, 1.0);
    float y = P.y + R.y * s / dl;
    dark = max(dark, cover * step(0.5, s) * (1.0 - smoothstep(PIPE_TOP + 0.8 * float(6 - i) - 1.0, PIPE_TOP + 0.8 * float(6 - i) + 1.0, y)));
  }
  return dark;
}
`;
const FRAG_ROOM = /* glsl */`
// THE ROOM as the liquid mirrors it: from the point P along R, softened by sig (radians). Linear light.
vec3 room(vec3 P, vec3 Rin, float sig, float gap, vec3 skyC, vec3 sunC, vec3 gndC) {
  float up = smoothstep(-0.15, 0.08, Rin.y);
  vec3 R = vec3(Rin.x, max(Rin.y, 0.02), Rin.z);
  float tRoof = (52.0 - P.y) / R.y;
  float tX = (80.0 - sign(R.x) * P.x) / max(abs(R.x), 1e-3);
  float tZ = (R.z > 0.0 ? 210.0 - P.z : P.z + 230.0) / max(abs(R.z), 1e-3);
  float q = -R.z / R.y;                                  // metres run up the valley for each metre risen
  // the saw-tooth roof: glass on the up-valley face of every tooth; slate and the lattice girders between
  float ph = 200.0 - (P.z + R.z * tRoof);
  // (looking down the valley the glass faces us; far up the valley the teeth hide their glass behind their slates)
  float a = q < 0.0 ? 8.0 : clamp(16.0 - 10.0 * q, gap, 16.0) + (17.0 - gap) * smoothstep(3.0, 9.0, q);
  float f = max(fwidth(ph) * 1.5, sig * 49.0 * (1.0 + q * q));
  float glass = teeth(ph, a, clamp(f, 0.4, 80.0)) * (q < 0.0 ? smoothstep(0.1, 0.8, -q) : smoothstep(0.15, 1.5, q));   // seen from right below, the steep glass shows little sky
  float sunward = max(dot(normalize(R), uSunDir), 0.0);
  float s4 = sunward * sunward; s4 *= s4;
  // (through the glass: the blue sky and its white cloud, which drifts; toward the sun, its glare)
  vec2 sk = R.xz / max(R.y, 0.1) * 0.8 + vec2(0.012 * uTime, 3.0);
  float cloud = smoothstep(0.42, 0.72, 0.65 * vnoise(sk) + 0.35 * vnoise(sk * 2.7 + 5.0));
  vec3 glassC = skyC * mix(vec3(0.3, 0.4, 0.58), vec3(0.6, 0.63, 0.66), cloud) + sunC * (0.05 + 0.22 * s4) * uWarm;
  glass *= 1.0 - 0.45 * smoothstep(9.0, 24.0, f);         // (far off, where the bars run together, no pale veil: the brown shows)
  vec3 slateC = (skyC * 0.014 + sunC * 0.006) * vec3(1.0, 0.8, 0.6);   // under the slates: dim, warmed from below
  vec3 roofC = mix(slateC, glassC, glass);
  roofC += skyC * vec3(0.1, 0.125, 0.16) * (4.0 * glass * (1.0 - glass)) * (1.0 - smoothstep(9.0, 24.0, f));   // the sky's pale blue at each bar's soft edge
  // the walls: warm brick (the left one sunlit), tall bright windows, the head wall's round ones, green low down
  vec3 wallLight = gndC * 0.16 + skyC * 0.16 + sunC * (R.x < 0.0 ? 0.08 : 0.01);
  float tW = min(tX, tZ);
  vec3 H = P + R * tW;
  float blur = max(2.0 * sig * tW, 0.5);
  float win = 0.0;
  if (tX < tZ) {
    float zw = abs(mod(H.z - 10.0, 20.0) - 10.0);
    win = (1.0 - smoothstep(4.2 - blur, 4.2 + blur, zw)) * smoothstep(31.0 - blur, 31.0 + blur, H.y) * (1.0 - smoothstep(47.0 - blur, 47.0 + blur, H.y));
  } else if (R.z < 0.0) {
    vec2 dw = vec2(mod(H.x + 16.5, 33.0) - 16.5, H.y - 43.0);
    float bw = max(0.3 * blur, 0.5);                       // the head wall's round windows keep their shape in the mirror
    win = 1.0 - smoothstep(7.6 - bw, 7.6 + bw, length(dw));
  }
  vec3 wallC = mix(vec3(0.36, 0.14, 0.085) * wallLight, skyC * vec3(0.26, 0.36, 0.52) + sunC * 0.03 * uWarm, win);
  float low = 1.0 - smoothstep(6.0, 15.0 + 0.6 * blur, H.y - P.y);
  vec3 greenC = vec3(0.1, 0.075, 0.045) * (gndC * 0.2 + skyC * 0.22 + sunC * 0.1);   // the liquid's own far face, under the level
  // low down the hall gives back the far meadow and the stone in shade: dark, in soft upright streaks, so that the
  // brown shows through and the bright things of the mirror (the roof's glass, the windows) stand out on it
  float az = Rin.x / (abs(Rin.z) + 0.35);
  float lv = vnoise(vec2(az * 9.0 + 0.03 * P.x, 0.5));
  vec3 lowC = vec3(0.13, 0.125, 0.08) * (gndC * 0.2 + skyC * 0.24 + sunC * 0.1) * (0.3 + 1.6 * lv * lv);   // (dark: the far meadow and the stone in shade; the brown shows through)
  wallC = mix(wallC, lowC, low);
  float under = smoothstep(-0.12, 0.12, (tW - tRoof) / max(tRoof, 1.0));   // the roof is nearer than the wall
  vec3 c = mix(wallC, roofC, under);
  // the iron columns stand in the mirror as upright streaks, dark across the bars of glass; and the pipes dark with a pale edge
  // (a face that is uneven in the small smears what it mirrors along the line of sight and hardly at all across it: the
  // lower the mirrored ray, the narrower an upright thing stays)
  float pw = max(fwidth(Rin.x), fwidth(Rin.z)) / max(length(Rin.xz), 0.05);
  float sc = sig * clamp(1.6 * Rin.y / max(length(Rin), 1e-3), 0.12, 1.0);
  vec3 ironC = vec3(0.22, 0.29, 0.21) * (skyC * 0.11 + gndC * 0.1 + sunC * 0.03);
  c = mix(c, ironC, 0.9 * columns(P, R, sc, pw));
  float pp = pipesIn(P, R, sc, pw);
  c = mix(c, vec3(0.2, 0.085, 0.05) * (skyC * 0.1 + sunC * 0.03) + skyC * 0.12 * (4.0 * pp * (1.0 - pp)), pp);
  return mix(greenC, c, up);
}
// flow lines: broad soft bands half a metre to two metres wide, a few percent lighter and darker (zero mean)
float streaks(vec2 c, float fw) {
  float n = vnoise(vec2(c.x * 0.8 + 0.8 * vnoise(c * vec2(0.3, 0.04) + 3.0), c.y * 0.045)) - 0.5;
  n += 0.55 * (vnoise(vec2(c.x * 1.7 + 13.0, c.y * 0.09)) - 0.5);
  return n;
}
// a slow fold, here and there: a rounded ridge a few metres long lying across the flow, carried by the stream; it
// widens and sinks as it ages (age 0..1). c: the stream's carried coordinates. Returns its slope (across, along).
vec2 foldGrad(vec2 c, float age) {
  vec2 cell = vec2(7.0, 13.0), id = floor(c / cell), f = c - id * cell;
  float h1 = hash12(id + 3.7), h2 = hash12(id + 17.3), h3 = hash12(id + 31.9);
  vec2 d = f - cell * (0.33 + 0.34 * vec2(h1, h2));
  float tilt = (h1 - 0.5) * 0.8, len = 2.2 + 2.2 * h2, wd = 0.75 + 1.3 * age;
  float a = d.y - tilt * d.x;
  float win = (1.0 - smoothstep(0.3 * len, 0.5 * len, abs(d.x))) * step(0.45, h3) * (1.0 - age);
  float dha = win * exp(-a * a / (wd * wd)) * (-2.0 * a / (wd * wd));
  return vec2(-tilt * dha, dha);
}
// slow ropey eddies along the banks: a turning spiral of low ridges that stands where the bank holds it.
// uv: stream metres; U: the stream's half width. Returns its slope (across, along) for a ridge 1 high.
vec2 eddyGrad(vec2 uv, float U, float t) {
  float side = uv.x < 0.0 ? -1.0 : 1.0, cellL = 27.0, j = floor(uv.y / cellL);
  float h1 = hash12(vec2(j, side * 7.0 + 2.0)), h2 = hash12(vec2(j + 11.0, side * 3.0));
  vec2 d = uv - vec2(side * (U - 2.6 - 0.8 * h2), (j + 0.3 + 0.4 * h2) * cellL);
  float r = max(length(d), 0.05), R = 1.9 + 0.6 * h1;
  float env = exp(-r * r / (R * R)) * smoothstep(0.1, 0.7, r) * step(0.4, h1) * step(1.0, U);
  float ph = 3.0 * r - side * atan(d.y, d.x + (abs(d.x) < 1e-4 ? 1e-4 : 0.0)) - 0.3 * t;
  float sn = sin(ph) * env;
  return (-3.0 * sn) * (d / r) + (side * sn / r) * vec2(-d.y, d.x) / r;
}
// one field of CREASES (q: its own coordinates, about a crest to two units): its slope in q, and its height 0..1
vec3 creaseField(vec2 q) {
  float e = 0.3, n0 = vnoise(q);
  return vec3((vnoise(q + vec2(e, 0.0)) - n0) / e, (vnoise(q + vec2(0.0, e)) - n0) / e, n0);
}
// THE CREAM'S REACH in the lower river: it enters at the left bank at the spring (uSpring.x: its stream metres) and is
// drawn out downstream, strongest at the spring, combed thinner and wider for 80 m and more; above the spring, none
float creamReach(vec2 uv) {
  float dv = uv.y - uSpring.x, k = max(dv, 0.0);
  // (never a ruled band along the shore: its middle line wanders, its width comes and goes, and from a few metres
  // below the spring it is torn into tongues with brown between them, which the stream carries along)
  float wan = vnoise(vec2(k * 0.085 + 3.0, 1.5)) - 0.5, bre = vnoise(vec2(k * 0.13 + 9.0, 0.03 * uTime + 4.0));
  float mid = -6.8 + 5.2 * (1.0 - exp(-k / 28.0)) + 1.6 * wan * smoothstep(1.0, 9.0, k);
  float wide = (1.0 + 5.6 * (1.0 - exp(-k / 30.0))) * (0.6 + 0.8 * bre);
  float strength = smoothstep(-1.5, 2.0, dv) * exp(-k / 55.0) * (1.0 - smoothstep(88.0, 112.0, k));
  float torn = mix(1.0, smoothstep(0.25, 0.6, vnoise(vec2(uv.x * 0.55 + 7.0, k * 0.16 - 0.03 * uTime))), smoothstep(2.5, 8.0, k));
  float q = (uv.x - mid) / wide;
  return min(0.8, 0.8 * strength * exp(-q * q) * (0.3 + 0.7 * torn));   // (swirls in the brown, never a pale field)
}
// cream drawn out along the flow lines: feathered ribbons, sharp on one side and combed thin on the other
float marble(vec2 c, float env) {
  vec2 w = vec2(c.x * 0.5, c.y * 0.1);
  // (drawn out, but never ruled: its ribbons wander, curl and close on themselves; no swirl wider than a couple of metres)
  float n = vnoise(w + 1.5 * vec2(vnoise(w * 0.5 + 11.0), vnoise(w * 0.5 + 23.0))) + 0.25 * vnoise(w * vec2(2.4, 2.0) + 3.0);
  float r = fract(n * 2.2), fr = min(fwidth(n) * 2.2, 0.5);
  float wide = 0.92 * sqrt(env);
  float m = smoothstep(0.0, 0.05 + fr, r) * (1.0 - smoothstep(wide * 0.35, wide + 0.04 + fr, r));
  return mix(m, wide * 0.62, smoothstep(0.2, 0.5, fr)) * smoothstep(0.0, 0.06, env);
}
`;
const FRAG_STAND = /* glsl */`
// WHERE A THING STANDS IN THE LIQUID (uPier: each stone pier's x, z and the way the stream runs there; the rank of
// pipes): the liquid climbs it in a small meniscus, a thin wet line of light, a few centimetres
// wide in the world (seen from afar its light is thinned as a pixel outgrows it: it fades, it never grows into a
// band); two or three slow rings travel out from it and die within a few metres; it is piled a little
// on the upstream side and dented behind; a slow V of two soft ridges trails downstream, and along them and in the
// slack behind the thing a thin line of pale froth gathers and is drawn out. And WHERE THE FALL LANDS the pool
// heaves: fat slow rings spread from the foot across the pool, uneven round the compass; the heap's face churns; a
// ragged collar of pale froth lies round the heap's foot and drifts off downstream in torn rafts. Returns the slope in the
// world's x and z, and in z how much of the meniscus's line of light lies here; gFroth: how much froth lies here.
float gFroth;
vec3 standing(vec2 q) {
  vec3 o = vec3(0.0);
  gFroth = 0.0;
  float px = length(fwidth(q));                          // (the picture's grain here, in metres of the liquid's face)
  for (int i = 0; i < 10; i++) {
    vec2 p = q - uPier[i].xy, f = uPier[i].zw;
    if (dot(p, p) < 500.0) {
      // the pier's own outline (pointed up the valley): how far outside it we are, and which way is out
      float ax = abs(p.x), sx = p.x < 0.0 ? -1.0 : 1.0;
      float d = ax - 1.7, e = p.y - 2.3;
      vec2 n = vec2(sx, 0.0);
      if (e > d) { d = e; n = vec2(0.0, 1.0); }
      e = 0.8 * ax + 0.6 * p.y - 2.26;
      if (e > d) { d = e; n = vec2(0.8 * sx, 0.6); }
      e = 0.846 * ax - 0.533 * p.y - 2.291;
      if (e > d) { d = e; n = vec2(0.846 * sx, -0.533); }
      float out0 = step(0.0, d), m = clamp(1.0 - d / 0.45, 0.0, 1.0) * out0, lw = max(0.06, 0.9 * px), lq = (d - 0.05 - 0.6 * lw) / lw;
      o.xy -= 0.4 * m * n;
      o.z += exp(-lq * lq) * out0 * (0.06 / lw);                // (the thin wet line, 6 cm of light: where a pixel is wider its light is thinned by as much, as the ribbons' is)
      o.xy += 0.1 * exp(-d / 1.4) * out0 * n;                   // a broad dent round the stone, and slow fat rings that travel out from it
      o.xy += 0.14 * sin(6.2832 * (d / 1.7 - uTime / 4.2)) * exp(-d / 3.2) * smoothstep(0.25, 0.8, d) * n;
      float a = dot(p, f), b = p.x * f.y - p.y * f.x;          // metres down the stream from the pier, and across it
      vec2 c1 = p + 3.6 * f;                                    // piled on the upstream side
      o.xy += 0.16 * exp(-dot(c1, c1) / 2.6) * (-2.0 * c1 / 2.6);
      vec2 c2 = vec2(a - 3.6, b);                               // a dent behind it
      vec2 gab = -0.2 * exp(-c2.x * c2.x / 3.2 - c2.y * c2.y / 2.2) * vec2(-2.0 * c2.x / 3.2, -2.0 * c2.y / 2.2);
      float t = max(a - 1.2, 0.0), sb = b < 0.0 ? -1.0 : 1.0, dv = (abs(b) - 1.8 - 0.3 * t) * 0.958;   // the V's two ridges
      gab += 0.1 * exp(-dv * dv / 0.36) * exp(-t / 7.0) * smoothstep(0.0, 1.5, a - 1.2) * (-2.0 * dv / 0.36) * vec2(-0.287, 0.958 * sb);
      o.xy += gab.x * f + gab.y * vec2(f.y, -f.x);
      // the froth: a thin line down each side of the wake, and a little gathered in the slack water behind the pier
      float wl = (abs(b) - 1.5 + 0.05 * t) / (0.13 + 0.03 * t) + 1.2 * (vnoise(vec2(a * 0.9, 3.0 * sb + uPier[i].x)) - 0.5);
      float clump = smoothstep(0.3, 0.5, vnoise(vec2(a * 1.1 - 0.5 * uTime, 5.0 * sb + uPier[i].x)));   // (broken, and drifting down)
      gFroth = max(gFroth, 0.7 * exp(-wl * wl) * clump * smoothstep(0.3, 1.6, a) * exp(-t / 5.0) * out0);
      // (and in the slack behind the pier a slow whorl of it: thin lines that curl in round its middle)
      vec2 e2 = vec2(a - 3.7, b);
      float re = length(e2), wh = sin(2.0 * atan(e2.y, e2.x + (abs(e2.x) < 1e-4 ? 1e-4 : 0.0)) + 5.0 * log(re + 0.35) - 0.3 * uTime + uPier[i].x);
      gFroth = max(gFroth, 0.85 * smoothstep(0.78, 0.94, wh) * exp(-re * re / 2.8) * smoothstep(0.25, 0.7, re) * out0);
      gFroth = max(gFroth, (1.0 - smoothstep(0.1, 0.5 + 0.5 * vnoise(q * 1.7), d)) * smoothstep(1.2, 2.2, a) * (1.0 - smoothstep(0.7, 1.6, abs(b))) * out0);
    }
  }
  for (int i = 0; i < 7; i++) {
    vec2 p = q - vec2(PIPE_X0 + PIPE_STEP * float(i), PIPE_Z);
    float r = length(p);
    if (r < 7.0 && r > 0.3) {
      float d = r - PIPE_FOOT, out0 = step(0.0, d), m = clamp(1.0 - d / 0.35, 0.0, 1.0) * out0, lw = max(0.05, 0.9 * px), lq = (d - 0.04 - 0.6 * lw) / lw, a = dot(p, PIPE_F);
      o.xy -= 0.4 * m * p / r;
      o.z += exp(-lq * lq) * out0 * (0.05 / lw);
      o.xy += 0.12 * sin(6.2832 * (d / 1.2 - uTime / 3.4)) * exp(-d / 2.0) * smoothstep(0.15, 0.5, d) * p / r;    // the rings: slow and fat
      o.xy -= 0.06 * exp(-r * r / 1.4) * (PIPE_F - a * 2.0 * p / 1.4);   // piled before each pipe, dented behind it
      float b = p.x * PIPE_F.y - p.y * PIPE_F.x, wl = b / (0.1 + 0.04 * max(a, 0.0));
      float clump = smoothstep(0.25, 0.5, vnoise(vec2(a * 1.6 - 0.7 * uTime, 3.7 * float(i))));
      gFroth = max(gFroth, exp(-wl * wl) * clump * smoothstep(PIPE_FOOT, PIPE_FOOT + 0.5, a) * exp(-max(a, 0.0) / 3.2) * out0);
    }
  }
  // where a drop from a strand lands (uDrop: its x and z, how long one takes, where in that time it is): each time
  // one arrives a small ring or two run out from the place and are gone
  for (int i = 0; i < 8; i++) {
    vec2 p = q - uDrop[i].xy;
    float r = length(p);
    if (r < 4.0) {
      float age = fract(uTime / max(uDrop[i].z, 0.5) + uDrop[i].w) * uDrop[i].z, rr = r - 0.7 * age;
      o.xy += 0.22 * sin(7.0 * rr) * exp(-rr * rr / 0.25) * exp(-age / 1.6) * smoothstep(0.0, 0.3, age) * p / max(r, 0.05);
    }
  }
  // THE FALL'S FOOT: a line across the pool (FOOT_Z) where the sheet goes in. Slow fat rings run out from it, uneven
  // round their arc. Where it goes in, the liquid is CHURNED (short humps that come and go); a ragged COLLAR of pale
  // froth lies round the line, wide here and gone there; and pieces of it DRIFT OFF down the pool and fade.
  vec2 pf = q - vec2(clamp(q.x, -5.5, 5.5), FOOT_Z);
  float rf = length(pf);
  if (q.y > FOOT_Z - 2.5 && rf < 36.0) {
    vec2 dir = pf / max(rf, 0.05);
    float wob = vnoise(dir * 2.3 + 3.0), ph = 1.9 * (rf - 0.8 * uTime) + 3.0 * wob;
    o.xy += 0.2 * (0.55 + 0.9 * wob) * exp(-rf / 9.5) * smoothstep(0.4, 2.2, rf) * (1.0 - smoothstep(30.0, 36.0, rf)) * cos(ph) * dir;
    vec2 cq = q * 1.4 + vec2(0.0, -0.5 * uTime);
    float h0 = vnoise(cq), hx = vnoise(cq + vec2(0.35, 0.0)), hz = vnoise(cq + vec2(0.0, 0.35));
    o.xy += 0.45 * exp(-rf * rf / 9.0) * (0.6 + 0.4 * sin(0.9 * uTime + 6.0 * h0)) * vec2(hx - h0, hz - h0) / 0.35;
    float rag = vnoise(vec2(q.x * 0.9 + 4.0, 0.25 * uTime)), rag2 = vnoise(vec2(q.x * 2.7 + 9.0, q.y * 2.1 - 0.4 * uTime));
    // (the collar lies round the heap's foot, two to four metres out from the line; on the heap itself the brown rolls show)
    float coll = smoothstep(1.5, 2.3, rf) * (1.0 - smoothstep(2.6 + 1.6 * rag * rag, 3.2 + 2.4 * rag * rag, rf)) * smoothstep(0.22, 0.5, rag2 + 0.25 * rag);
    float dz = q.y - FOOT_Z, zc = q.y - 0.45 * uTime;      // (what drifts off is carried at a slow walk)
    float dr1 = vnoise(vec2(q.x * 0.55 + 2.0, zc * 0.4)), dr2 = vnoise(vec2(q.x * 1.9 + 6.0, zc * 1.3));
    float drift = smoothstep(0.52, 0.7, dr1 + 0.3 * (dr2 - 0.5)) * smoothstep(0.3, 2.0, dz) * exp(-max(dz, 0.0) / 6.5) * (1.0 - smoothstep(6.5, 9.0, abs(q.x)));
    gFroth = max(gFroth, max(0.95 * coll, 0.8 * drift));
  }
  return o;
}
`;
const FRAG_MOOR = /* glsl */`
// THE GREAT PIPE'S FOOT AND THE BOAT'S WATERLINE: two things of the room that others build, one standing and one
// lying in the lower river; the liquid answers them. Returns, as standing() does, the surface's slope in the world's
// x and z, and in z the line of light where the liquid wets the thing; adds its froth to gFroth; gHull: 1 inside the
// boat's hull at the liquid's face, where no liquid is drawn. (Call it after standing().)
uniform float uHull[HULL_M];
float gHull;
vec3 moored(vec2 q) {
  vec3 o = vec3(0.0);
  float px = length(fwidth(q));                          // (the picture's grain here, in metres of the liquid's face)
  gHull = 0.0;
  // THE GREAT PIPE (its axis at GREAT_X, GREAT_Z; GREAT_R the glass's radius): the river is drawn up into it from
  // under its mouth, thick and slow. Round the glass the face is drawn down in a broad dent; slow rings close in on
  // it; a whorl of thin froth lines winds in toward it; froth lies gathered against its upstream side (upstream is
  // -z); and from downstream a fan of froth and pale streaks is drawn back in to it, narrowing as it comes.
  vec2 p = q - vec2(GREAT_X, GREAT_Z);
  float r = length(p);
  if (r < 15.0 && r > 0.4) {
    vec2 n = p / r;
    float d = r - GREAT_R, out0 = step(0.0, d), dd = max(d, 0.0), lw = max(0.05, 0.9 * px), lq = (d - 0.07) / lw;
    o.z += 0.6 * exp(-lq * lq) * out0 * (0.05 / lw);
    o.xy += 0.12 * exp(-dd / 1.4) * out0 * n;                                                             // the dent
    o.xy += 0.07 * sin(6.2832 * (dd / 1.1 + uTime / 3.6)) * exp(-dd / 2.8) * smoothstep(0.2, 0.7, dd) * n;   // the rings, closing in
    // (the whorl: three lines that wind in round the glass; the froth on them comes in pieces, which slide in along them)
    float th = atan(p.y, p.x + (abs(p.x) < 1e-4 ? 1e-4 : 0.0)), ph = 3.0 * th + 6.5 * log(r);
    float reach = exp(-dd * dd / 9.0) * smoothstep(0.1, 0.6, dd) * out0;
    o.xy += 0.035 * cos(ph) * reach * vec2(-n.y, n.x);                                                    // (it turns the face a little)
    float broken = smoothstep(0.3, 0.55, vnoise(vec2(1.7 * n.x + 1.3 * n.y + 5.0, 2.4 * log(r) + 0.28 * uTime)));
    gFroth = max(gFroth, 0.9 * smoothstep(0.92, 0.99, sin(ph)) * broken * reach);
    // (gathered against the upstream side, wide here and a hair there)
    float gath = vnoise(vec2(n.x * 2.6 + 9.0, 0.12 * uTime));
    gFroth = max(gFroth, (1.0 - smoothstep(0.12, 0.3 + 0.7 * gath, dd)) * smoothstep(0.0, 0.7, -n.y) * out0);
    // (drawn in from downstream: streaks that close on the glass and bend into the whorl as they near it, of unlike
    // width, in pieces that travel toward it; a few bright, most pale)
    float tw = 1.1 * exp(-dd / 2.0), ct = cos(tw), sn = sin(tw);
    vec2 pt = vec2(ct * p.x + sn * p.y, ct * p.y - sn * p.x);
    float a = pt.y, fs = pt.x / (0.5 + 0.55 * max(a, 0.0)), fl = fs * 1.6 + 0.9 * vnoise(vec2(a * 0.35, 7.0)), id = floor(fl);
    float piece = smoothstep(0.42, 0.62, vnoise(vec2(id * 7.3, a * 0.5 + 0.22 * uTime)));
    float fan = (1.0 - smoothstep(1.1, 1.5, abs(fs))) * smoothstep(0.3, 1.2, a) * exp(-max(a, 0.0) / 5.0);
    float wide = 0.04 + 0.1 * hash12(vec2(id, 5.0));
    gFroth = max(gFroth, (0.45 + 0.45 * step(0.5, hash12(vec2(id, 3.0)))) * (1.0 - smoothstep(wide, wide + 0.07, abs(fract(fl) - 0.5))) * piece * fan * out0);
  }
  // THE BOAT (its middle line at x = BOAT_X, straight along z; uHull: the half breadth of its skin at the liquid's
  // face, at stations HULL_DZ apart from z = BOAT_Z0, the bow first: it lies bow upstream). The river parts at the
  // bow in slow pleats, which run off along the hull and open; a thin line of froth lies along both sides where the
  // liquid wets it; close behind the stern a small whorl of froth turns in the slack and a short trail is drawn off.
  vec2 pb = q - vec2(BOAT_X, BOAT_Z0);
  if (abs(pb.x) < 8.0 && pb.y > -6.0 && pb.y < HULL_LEN + 9.0) {
    float st = clamp(pb.y, 0.0, HULL_LEN) / HULL_DZ, hb = uHull[0], sl = 0.0;
    for (int i = 0; i < HULL_N; i++) {
      float dh = uHull[i + 1] - uHull[i], ti = clamp(st - float(i), 0.0, 1.0);
      hb += dh * ti;
      sl += dh * step(0.0005, ti) * (1.0 - step(0.9995, ti));       // (the slope of the station we are in)
    }
    sl /= HULL_DZ;
    float ax = abs(pb.x), sx = pb.x < 0.0 ? -1.0 : 1.0, k = 1.0 / sqrt(1.0 + sl * sl);
    float off = max(-pb.y, 0.0) + max(pb.y - HULL_LEN, 0.0);         // metres beyond its ends
    float gap = max(ax - hb, 0.0), d = off > 0.0 ? length(vec2(gap, off)) : (ax - hb) * k;   // metres out from its skin
    vec2 n = off > 0.0 ? vec2(sx * gap, pb.y < 0.0 ? -off : off) / max(d, 0.05) : vec2(sx * k, -sl * k);
    gHull = step(ax, hb - 0.05) * (1.0 - step(0.0001, off));
    float out0 = step(0.0, d), lw = max(0.045, 0.9 * px), lq = (d - 0.06) / lw;
    o.z += exp(-lq * lq) * out0 * (0.045 / lw);
    o.xy -= 0.3 * clamp(1.0 - d / 0.3, 0.0, 1.0) * out0 * n;         // (it climbs the skin a finger's breadth)
    float a = pb.y, t = max(a, 0.0);                                 // metres downstream from the bow
    vec2 c1 = vec2(pb.x, a + 0.9);                                   // piled a little before the bow
    o.xy += 0.1 * exp(-dot(c1, c1) / 1.3) * (-2.0 * c1 / 1.3);
    float dv = d - 0.35 - 0.2 * t - 0.05 * sin(0.6 * uTime + 2.0 * sx), dw = dv - 0.85;   // the pleats: two soft ridges a side
    float fade = exp(-t / 4.5) * smoothstep(-1.0, 0.6, a) * out0;
    o.xy += 0.075 * (exp(-dv * dv / 0.2) * (-2.0 * dv / 0.2) + 0.65 * exp(-dw * dw / 0.26) * (-2.0 * dw / 0.26)) * fade * n;
    o.z += (0.17 * exp(-dv * dv / 0.02) + 0.1 * exp(-dw * dw / 0.03)) * fade * (0.4 + 0.9 * vnoise(vec2(a * 0.8 + 3.0 * sx, 0.1 * uTime)));   // (a soft light along each pleat's crest, stronger here and fainter there)
    // (the froth along both sides: a hair here, a hand there, with gaps, creeping aft)
    float g1 = vnoise(vec2(a * 0.9 + 4.0 * sx, 0.05 * uTime)), g2 = vnoise(vec2(a * 1.6 - 0.35 * uTime, 9.0 * sx));
    float sides = smoothstep(0.2, 1.2, a) * (1.0 - smoothstep(HULL_LEN - 0.3, HULL_LEN + 0.4, a));
    gFroth = max(gFroth, 0.9 * (1.0 - smoothstep(0.05, 0.1 + 0.14 * g1 * g1, d)) * smoothstep(0.18, 0.4, g2) * sides * out0);
    // (behind the stern: a dent in the slack, a small whorl of froth, a short trail)
    float az = a - HULL_LEN;
    vec2 c2 = vec2(pb.x, az - 0.9);
    o.xy -= 0.09 * exp(-dot(c2, c2) / 1.1) * (-2.0 * c2 / 1.1);
    vec2 e2 = vec2(az - 1.0, pb.x);
    float re = length(e2), wst = sin(2.0 * atan(e2.y, e2.x + (abs(e2.x) < 1e-4 ? 1e-4 : 0.0)) + 5.0 * log(re + 0.3) - 0.35 * uTime + 1.7);
    gFroth = max(gFroth, 0.85 * smoothstep(0.78, 0.94, wst) * exp(-re * re / 1.2) * smoothstep(0.12, 0.4, re) * step(-0.2, az) * out0);
    float wl = pb.x / (0.08 + 0.05 * max(az, 0.0)) + 1.1 * (vnoise(vec2(az * 0.9, 5.0)) - 0.5);
    float clump = smoothstep(0.3, 0.5, vnoise(vec2(az * 1.2 - 0.5 * uTime, 2.0)));
    gFroth = max(gFroth, 0.7 * exp(-wl * wl) * clump * smoothstep(0.3, 1.5, az) * exp(-max(az, 0.0) / 3.2) * out0);
  }
  return o;
}
`;
const FRAG_MAIN = /* glsl */`
void main() {
  vec3 N0 = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  // THE FALL'S SHEET (vAux.x 3; vMix.y how thick the mesh says it is; vMix.z 1 on a strand). It falls as ROPES side by
  // side, of unlike width (a hand to a metre and more), that wander a little and SWELL AND THIN down their length
  // (and that slides down them); between the ropes lie thin FILMS. The ropes grow out of the smooth sheet under the
  // lip and stand out more the farther it has fallen. Where a film is thinner than a hand it is TORN: holes with
  // ragged edges that crawl down, more of them and wider toward the pool.
  float sheet = step(2.5, vAux.x) * (1.0 - step(3.5, vAux.x));
  float fallen = vUv.y - SHEET_V0;                        // metres fallen since it left the lip
  // (the sheet's first metres lie level on the river and WEAR ITS LIFE, its creases and its mirror, with no seam; they
  // leave it over the shoulder. sheetS: how much of a sheet it is there)
  float sheetS = sheet * smoothstep(-5.6, -2.4, fallen), offSill = smoothstep(-1.0, 1.5, fallen);
  float xs = vUv.x * 1.3 + 0.5 * (vnoise(vec2(vUv.x * 0.45 + 5.0, vUv.y * 0.04)) - 0.5);
  float ci = floor(xs), cb = ci + 0.5 + 0.76 * (hash12(vec2(ci, 3.0)) - 0.5);       // (the ropes' sides: one in every unit, anywhere in it)
  float lo = cb, hi = ci + 1.5 + 0.76 * (hash12(vec2(ci + 1.0, 3.0)) - 0.5), rk = ci;
  if (xs < cb) { hi = cb; lo = ci - 0.5 + 0.76 * (hash12(vec2(ci - 1.0, 3.0)) - 0.5); rk = ci - 1.0; }
  float rwid = hi - lo, rb = hash12(vec2(rk, 7.0));
  // (a rope fills the middle of its place: more of it where it swells, less where it thins; the rest is film)
  float rsp = 0.55 + 0.95 * hash12(vec2(rk, 11.0));       // (no two ropes run at one speed)
  float swell = vnoise(vec2(rk * 13.1, vUv.y * 0.22 - 0.7 * rsp * uTime)) + 0.35 * (vnoise(vec2(rk * 7.7, vUv.y * 0.6 - 1.5 * rsp * uTime)) - 0.5);
  float fill = clamp(0.3 + 0.35 * rb + 0.4 * swell, 0.25, 0.96);
  float rq = ((xs - lo) / rwid - 0.5) / fill;             // -0.5..0.5 across the rope; beyond that: the film beside it
  float inRope = 1.0 - smoothstep(0.4, 0.5, abs(rq));
  float body = max(1.0 - 4.0 * rq * rq, 0.0);             // the rope's round: 1 on its middle line, 0 at its sides
  float ropes = smoothstep(-0.7, 3.5, fallen) * (1.0 - 0.8 * vMix.z) * sheet;
  float tear = vnoise(vec2(vUv.x * 2.3 + 17.0, vUv.y * 0.5 - 0.9 * uTime)) - 0.5;
  // (where the mesh's sheet is thin, at its two sides and in its webs, the film between the ropes goes first: the sheet
  // ends in separate ropes and ribbons that hang on below it, never in one cut edge)
  float feather = ropes * (1.0 - smoothstep(0.35, 0.85, vMix.y)) * (1.0 - 0.8 * vMix.z);
  float Te = vMix.y + ropes * (0.64 * body - 0.32) + (0.12 + 0.3 * ropes) * tear + feather * (0.5 * body - 0.5);
  float gone = (sheet > 0.5 && Te < SHEET_CUT) ? 1.0 : 0.0;   // (let go at the very end of main, after every derivative is taken)
  float thinS = sheet * (1.0 - smoothstep(SHEET_CUT, 0.5, Te)), thinO = vMix.y * (1.0 - sheet);
  vec3 fl = vFlow.xyz - N0 * dot(N0, vFlow.xyz);
  vec3 Tv = fl / max(length(fl), 1e-4);
  vec3 Tu = cross(N0, Tv);
  float bank = clamp(vMix.x, 0.0, 1.0);
  float sp = vFlow.w * (1.0 - 0.78 * bank * bank);
  float t = uTime;
  // the stream carries its patterns in two overlapping phases, so the shear between mid-stream and bank never winds up
  // (their phase differs from place to place along the stream, so the change of field never falls everywhere at once)
  float T = 24.0, pz = t / T + 0.9 * vnoise(vec2(vUv.y * 0.008 + 11.0, 2.5)), p0 = fract(pz), p1 = fract(pz + 0.5);
  float w0 = 1.0 - abs(2.0 * p0 - 1.0), w1 = 1.0 - w0, wn = 1.0 / sqrt(w0 * w0 + w1 * w1);
  vec2 c0 = vec2(vUv.x + uSeed.x, vUv.y - sp * p0 * T + uSeed.y);
  vec2 c1 = vec2(vUv.x + uSeed.x + 41.3, vUv.y - sp * p1 * T + uSeed.y + 77.0);
  float fw = fwidth(vUv.x);
  float st = (streaks(c0, fw) * w0 + streaks(c1, fw) * w1) * wn;
  // (the flow lines let go where the river runs in under the sheet's first row and come again on the sheet: no line across)
  st *= (1.0 - sheet * (1.0 - smoothstep(-5.6, -3.0, fallen))) * (1.0 - (1.0 - sheet) * smoothstep(-47.5, -45.3, vW.z) * step(vW.z, -41.9));
  // broad slow swells, a few centimetres high and metres long, running down the stream
  vec2 k1 = vec2(0.10, 0.45), k2 = vec2(-0.35, 0.62), k3 = vec2(0.8, 0.25);
  vec2 g = 0.022 * cos(dot(vUv, k1) - 0.55 * t) * k1 + 0.012 * cos(dot(vUv, k2) - 0.8 * t + 1.7) * k2 + 0.008 * cos(dot(vUv, k3) - 0.5 * t + 4.1) * k3;
  vec2 k4 = vec2(0.22, -0.3), k5 = vec2(-0.6, 0.15);
  g += 0.03 * cos(dot(vUv, k4) + 0.33 * t + 2.9) * k4 + 0.012 * cos(dot(vUv, k5) - 0.42 * t + 0.6) * k5;
  vec2 k6 = vec2(0.05, 1.0), k7 = vec2(-0.12, 0.62);
  g += 0.02 * cos(dot(vUv, k6) - 0.9 * t + 5.2) * k6 + 0.025 * cos(dot(vUv, k7) - 0.66 * t + 3.3) * k7;
  vec2 sw = vec2(0.23, 0.11);
  float n0 = vnoise(c0 * sw) * w0 + vnoise(c1 * sw) * w1;
  float nu = vnoise((c0 + vec2(0.5, 0.0)) * sw) * w0 + vnoise((c1 + vec2(0.5, 0.0)) * sw) * w1;
  float nw = vnoise((c0 + vec2(0.0, 1.0)) * sw) * w0 + vnoise((c1 + vec2(0.0, 1.0)) * sw) * w1;
  g += 0.07 * vec2((nu - n0) / 0.5, nw - n0);
  g *= 0.045;                                           // (the broad swells: a tenth of a slope that bent the mirror's bars)
  // slow folds carried by the stream (bowed downstream by the shear, as they are in thick liquid), and bank eddies
  float far = 1.0 - smoothstep(0.15, 0.6, fw), U = max(abs(vAux.z), 0.5);
  float shear = 1.56 * vFlow.w * clamp(vUv.x / (U * U), -1.0, 1.0) * T * step(bank, 0.999);
  vec2 f0 = foldGrad(c0, p0), f1 = foldGrad(c1, p1);
  g += 0.04 * far * (w0 * vec2(f0.x + f0.y * shear * p0, f0.y) + w1 * vec2(f1.x + f1.y * shear * p1, f1.y));
  g += 0.008 * far * eddyGrad(vUv, U, t) * step(0.5, vAux.z);
  float steep = smoothstep(0.3, 0.9, 1.0 - N0.y);   // the fall and the ribbons: faces that hang
  g *= 1.0 - steep;
  // CREASES: the slow fat creases of a thick liquid ride the stream, each some metres long and lying across the flow,
  // born and closed over many seconds (no small wavelets, no ripples of water, nothing that twinkles). They bend the
  // mirror's bars softly and shade the brown. Where they are finer than the picture's grain they are let go, evenly,
  // and what they did to the mirror is given to its softness instead (wNear: how much of them is drawn).
  float xm = vUv.x / max(vAux.y, 0.05);                 // metres across from the stream's middle line
  vec2 WK = vec2(0.26, 0.7);                            // (about three metres from crest to crest; the crests lie across the stream)
  float wNear = (1.0 - smoothstep(0.3, 1.0, max(fwidth(xm) * WK.x, fwidth(vUv.y) * WK.y))) * (1.0 - steep) * (1.0 - sheetS);
  // (they are carried at the stream's own pace in two overlapping phases of their own, fourteen seconds long, each on
  // a fresh field; the phase differs from place to place, so the change never falls everywhere at once)
  float TW = 14.0, pa = t / TW + 0.6 * vnoise(vec2(xm * 0.04 + 31.0, vUv.y * 0.012 + 7.0)), pb = pa + 0.5, a0 = fract(pa), a1 = fract(pb);
  float u0 = 1.0 - abs(2.0 * a0 - 1.0), u1 = 1.0 - u0, un = 1.0 / sqrt(u0 * u0 + u1 * u1), spW = 0.85 * vFlow.w;
  vec3 wv0 = creaseField(vec2(xm + uSeed.x + 17.3 * floor(pa), vUv.y - spW * a0 * TW + uSeed.y) * WK);
  vec3 wv1 = creaseField(vec2(xm + uSeed.x + 17.3 * floor(pb) + 41.3, vUv.y - spW * a1 * TW + uSeed.y + 77.0) * WK);
  // (they come in drifting patches with smooth liquid between, strongest toward the banks, fading into the smooth middle)
  float ruffle = 0.25 + 0.75 * smoothstep(0.3, 0.7, vnoise(vec2(xm * 0.09 + 3.0, (vUv.y - 0.6 * sp * t) * 0.03 + uSeed.y)));
  float midS = 0.45 + 0.55 * smoothstep(0.1, 0.75, abs(xm) / max(abs(vAux.z) / max(vAux.y, 0.05), 1.0));
  vec2 gw = 7.5 * uTune.y * ruffle * wNear * un * (u0 * wv0.xy + u1 * wv1.xy) * WK * midS;
  // a hanging body (its bulges and its swaying are moved in the mesh): a little slow unevenness slides down its face
  float sway = 0.1 * (vnoise(vec2(vUv.x * 0.4 + 31.0, vUv.y * 0.2 - 0.5 * t)) - 0.5) + 0.05 * (vnoise(vec2(vUv.x * 1.0 + 7.0, vUv.y * 0.45 - 1.2 * t)) - 0.5);
  // and its fall combs it: fine flutes drawn out down its whole height, each one a thread of the hall's light
  float fl1 = vnoise(vec2(vUv.x * 2.6 + 3.0, vUv.y * 0.035 - 0.12 * t)) - 0.5, fl2 = vnoise(vec2(vUv.x * 6.1 + 11.0, vUv.y * 0.06 - 0.2 * t)) - 0.5;
  // (the finer flutes are let go where they are finer than the picture's grain, evenly, so none flickers)
  sway += 0.5 * fl1 * (1.0 - smoothstep(0.3, 0.8, 2.6 * fw)) + 0.3 * fl2 * (1.0 - smoothstep(0.3, 0.8, 6.1 * fw));
  // pleats: rounded ridges 1.6 m apart; they travel (one laid every 2.4 s) or stand and breathe
  float lam = 1.6, still = step(0.5, vAux.x);
  float phi = vPleat.x / lam - mix(t / 2.4, 0.05 * sin(0.4 * t + 0.7 * vPleat.x), still);
  float cw = 0.5 + 0.5 * cos(6.2832 * phi), ridge = cw * cw;
  float pleatFar = 1.0 - smoothstep(0.25, 0.7, fwidth(vPleat.x) / lam);
  vec3 gp = (vPleat.y * pleatFar * -6.2832 * cw * sin(6.2832 * phi) / lam) * (vPleat.z * Tu + vPleat.w * Tv);
  // in a trough: a slow bow wave before the roller and a smooth wake behind it (uRollZ: where each roller is; uRollV: its speed)
  float ri = vPleat.x, inTrough = step(1.5, vAux.x) * (1.0 - step(2.5, vAux.x));
  float rz = ri < 0.5 ? uRollZ.x : (ri < 1.5 ? uRollZ.y : (ri < 2.5 ? uRollZ.z : uRollZ.w));
  float rv = ri < 0.5 ? uRollV.x : (ri < 1.5 ? uRollV.y : (ri < 2.5 ? uRollV.z : uRollV.w));
  float way = rv < 0.0 ? -1.0 : 1.0, dd = (vW.z - rz) * way, av = min(abs(rv), 2.5);
  float bow = 0.09 * av * exp(-(dd - 2.1) * (dd - 2.1) / 0.6) * (-2.0 * (dd - 2.1) / 0.6) + 0.035 * av * exp(-(dd + 2.6) * (dd + 2.6) / 3.0) * (2.0 * (dd + 2.6) / 3.0);
  gp += inTrough * way * bow * Tv;
  // THE SHEET'S ROPES: each a round whose face turns from one side to the other, the bold ones much, the slight ones
  // little, more where it swells; the film between lies flat. (A rope finer than the picture's grain is let go.)
  float rw = max(fwidth(xs), 1e-4);
  float rope = -2.0 * rq * inRope * (0.35 + 0.8 * rb) * (0.75 + 0.5 * swell) * max(ropes, 0.5 * sheet * smoothstep(-4.5, -1.0, fallen) * (1.0 - 0.8 * vMix.z)) * (1.0 - smoothstep(0.25, 0.7, rw / (rwid * fill)));
  rope *= max(smoothstep(0.12, 0.55, 1.0 - N0.y), 0.6 * smoothstep(-4.5, -1.5, fallen));   // (the ropes gather on the shoulder already: the brow is fluted, never a tabletop)
  // every free edge of the sheet is a rounded rim: its face turns toward the opening (vPleat.zw: the way the mesh's
  // sheet thickens; and a rope thickens toward its own middle line)
  vec3 eg = vPleat.z * Tu + vPleat.w * Tv - Tu * (5.1 * ropes * rq * inRope / max(rwid * fill, 0.15));
  vec3 rim = eg / max(length(eg), 1e-3) * (1.3 * sheet * (1.0 - smoothstep(SHEET_CUT, SHEET_CUT + 0.3, Te)));
  vec3 stand = standing(vW.xz);                         // (round the piers and the pipes that stand in it)
  stand += moored(vW.xz);                               // (and round the great pipe's foot and the moored boat)
  if (gHull > 0.5 && sheet < 0.5) gone = 1.0;           // (inside the boat's hull there is no liquid)
  stand *= (1.0 - steep) * (1.0 - sheet);
  vec3 N = normalize(N0 - (g.x * vAux.y + gw.x) * Tu - (g.y + gw.y) * Tv - gp + steep * sway * (1.0 - sheet) * Tu - rope * Tu - rim - vec3(stand.x, 0.0, stand.y));
  vec3 V = normalize(cameraPosition - vW);
  float nv = clamp(dot(N, V), 0.0, 1.0);
  vec3 R = reflect(-V, N);
  // the scene's own two lights
  vec3 sunC = vec3(0.0), skyC = vec3(1.0), gndC = vec3(0.5);
  #if NUM_DIR_LIGHTS > 0
    sunC = directionalLights[0].color;
  #endif
  #if NUM_HEMI_LIGHTS > 0
    skyC = hemisphereLights[0].skyColor; gndC = hemisphereLights[0].groundColor;
  #endif
  float bar = lightBar(vW);
  // the body: a dark rich chocolate brown with its flow lines, paler toffee where it runs thin; cream where it is marbled
  vec3 alb = uBody * (1.0 + 0.13 * st);
  alb = mix(alb, alb * 1.45 + vec3(0.03, 0.016, 0.007), clamp(thinO, 0.0, 1.0));
  alb = mix(alb, alb * 1.35 + vec3(0.03, 0.017, 0.007), 0.7 * thinS * offSill);   // (a film of it in the air: toffee; on the rock's sill a film is dark wet rock)
  float env = max(clamp(vMix.w, 0.0, 1.0), creamReach(vUv));
  // (the marbling is taken from the stronger of the two fields, changing over softly: its strength never breathes)
  float s0 = smoothstep(0.3, 0.7, w0);
  float cream = max(mix(marble(c1, env), marble(c0, env), s0), smoothstep(0.9, 1.0, env));
  vec3 creamC = mix(uCream, uGold, smoothstep(0.3, 0.75, vnoise(vec2(vUv.x * 0.7, vUv.y * 0.03) + 19.0)));
  alb = mix(alb, creamC * (1.0 + 0.1 * st), cream);
  alb = mix(alb, alb * 1.3 + vec3(0.02, 0.011, 0.005), clamp(abs(vPleat.y) * 3.0, 0.0, 1.0) * ridge * pleatFar);
  // FROTH, pale and thin, only on the level liquid: a line gathering along each shore (wide here, a hair there, with
  // gaps), the trails behind the piers and the pipes (gFroth), and slow rafts drawn out long by the stream: long thin
  // lines in loose patches, carried in the stream's two phases
  float level = (1.0 - steep) * (1.0 - sheet) * step(0.5, vAux.z), side = vUv.x < 0.0 ? -1.0 : 1.0;
  float ds = SHORE - (abs(vUv.x) - abs(vAux.z)) / max(vAux.y, 0.05);     // metres out from the shore into the liquid
  float gather = vnoise(vec2(vUv.y * 0.31 + 5.0 * side, 0.04 * t)), shw = 0.07 + 0.5 * gather * gather;
  float shoreF = (1.0 - smoothstep(0.6 * shw, shw, ds)) * step(-0.05, ds) * smoothstep(0.12, 0.3, vnoise(vec2(vUv.y * 1.9, ds * 7.0 + 2.0 * side)));
  // (and small rafts of it lying just off the shore, in the slow water)
  shoreF = max(shoreF, smoothstep(0.6, 0.68, vnoise(vec2((vUv.y - 0.25 * t) * 1.1 + 7.0 * side, ds * 2.6))) * (1.0 - smoothstep(0.35, 1.2, ds)) * step(0.0, ds));
  // RAFTS of froth, drawn by the stream into thin lines that BEND AND CLOSE ON THEMSELVES: pieces of the rims of slow
  // whorls (one level line of a soft field that the stream carries, each whorl under two metres wide and drawn out
  // along the stream), of unlike width: a hair where the field is steep, a patch where it lies flat. Only pieces of
  // them show, a few bright, most barely lighter than the body, with bare glossy brown between; and more of them
  // toward the outer bank of a bend (bendK: how the stream's middle line turns there, from the plan's own law).
  vec2 q0 = vec2(xm + uSeed.x, c0.y * 0.42), q1 = vec2(xm + uSeed.x + 41.3, c1.y * 0.42);
  float h0 = vnoise(q0 * 0.7 + 0.9 * vec2(vnoise(q0 * 0.38 + 7.0), vnoise(q0 * 0.38 + 19.0)));
  float h1 = vnoise(q1 * 0.7 + 0.9 * vec2(vnoise(q1 * 0.38 + 7.0), vnoise(q1 * 0.38 + 19.0)));
  vec2 hf = vec2(fwidth(h0), fwidth(h1)) * 3.0, hr = abs(vec2(h0, h1) - 0.5) * 3.0;   // (one level line of the field alone: no two run side by side like rings of grain)
  vec2 piece = smoothstep(vec2(0.44), vec2(0.56), vec2(vnoise(q0 * 0.8 + 31.0), vnoise(q1 * 0.8 + 31.0)));
  vec2 few = 0.34 + 0.66 * smoothstep(vec2(0.66), vec2(0.82), vec2(vnoise(q0 * 0.4 + 53.0), vnoise(q1 * 0.4 + 53.0)));
  vec2 wth = 0.07 + 0.13 * vec2(vnoise(q0 * 1.3 + 71.0), vnoise(q1 * 1.3 + 71.0));          // (of unlike width)
  vec2 rl = (1.0 - smoothstep(wth, wth + hf + 0.01, hr)) * piece * few * (1.0 - smoothstep(vec2(0.3), vec2(0.8), hf));
  float za = 0.031416 * (vW.z + 40.0), zb = 0.069813 * (vW.z + 40.0), sa = sin(za), sb = sin(zb);
  float bendK = 24.0 * 0.000987 * (6.0 * sa * cos(za) * cos(za) - 3.0 * sa * sa * sa) + 9.0 * 0.004874 * (6.0 * sb * cos(zb) * cos(zb) - 3.0 * sb * sb * sb);
  float outer = 0.3 + 0.7 * smoothstep(-0.25, 0.6, -9.0 * bendK * xm / max(abs(vAux.z) / max(vAux.y, 0.05), 1.0));
  float raft = mix(rl.y, rl.x, s0) * outer;
  float froth = level * clamp(max(max(shoreF, gFroth), raft), 0.0, 1.0);
  alb = mix(alb, uMousse * (0.88 + 0.24 * vnoise(vW.xz * 11.0) * (1.0 - smoothstep(0.02, 0.08, fw))), froth);
  N = normalize(mix(N, N0, 0.7 * froth));
  // lit by the sky's fill and the sun under the bars; a hanging sheet also by the bright hall it faces
  float back = steep * (1.0 - smoothstep(-0.6, 0.0, N0.z));   // a hanging body's back, toward the rock: it stands in dark air
  back = max(back, 0.85 * clamp(-thinO, 0.0, 1.0));           // and so does the bottom of a fold between two tongues
  vec3 irrA = (mix(gndC, skyC, 0.5 + 0.5 * N.y) + (skyC * 0.3 + sunC * 0.12) * steep) * (1.0 - 0.6 * back);
  vec3 irrS = 0.75 * sunC * max(dot(N, uSunDir), 0.0) * bar * (1.0 - back);
  vec3 irr = irrA + irrS;
  // THE BROWN IS HELD. The page's grade takes a few hundredths off every channel in the darks, so a dark brown put out
  // as the light gives it comes through red, or black. The body is therefore put out by its BRIGHTNESS alone (tb: as
  // a share of the day's fully lit body) along a line that the hour's own grade shows as one brown at every
  // brightness (uHold: the line's colours at tb 0.12, 0.6 and 1.6, reckoned from the grade's own numbers); cream and
  // froth keep the light's own colour, and so do the mirror and the sun's soft glint.
  vec3 lit = alb * irr * RECIPROCAL_PI;
  // (DARK CHOCOLATE IN THE SHADE, MILK CHOCOLATE IN THE SUN: out of the plan's bars of light the brown is taken darker,
  // in them brighter, than the light alone gives it. And every crease and fold shows in it from above: its flank
  // toward the light that comes down the valley is lighter, the other darker (SH: the face's small slopes, drawn steeper))
  vec3 LUMW = vec3(0.2126, 0.7152, 0.0722) * (RECIPROCAL_PI / 0.085);
  vec3 SH = 3.0 * (N - N0);
  float relief = clamp(1.0 + 1.4 * dot(SH, vec3(0.24, 0.0, -0.97)) + 0.8 * dot(SH, uSunDir) * bar, 0.5, 1.7);
  float wetEdge = 0.45 * level * (1.0 - smoothstep(0.0, 0.5, ds)) * step(-0.05, ds);   // (a dark wet edge along both banks)
  float tb = min((0.85 * dot(alb * irrA, LUMW) + 1.3 * dot(alb * irrS, LUMW)) * mix(relief, 1.0, steep) * (1.0 - wetEdge) * (1.0 - 0.6 * thinS * (1.0 - offSill)), 1.7);   // (never paler than milk chocolate, however strong the sun)
  vec3 held = tb < 0.6 ? mix(uHold[0], uHold[1], (tb - 0.12) / 0.48) : mix(uHold[1], uHold[2], tb - 0.6);
  float holdW = (1.0 - cream) * (1.0 - froth);
  // (and the glaze's own cool sheen over it: a faint blue of the sky, most in the shade)
  vec3 col = mix(lit, held, holdW) + skyC * vec3(0.004, 0.007, 0.012) * (1.0 - 0.7 * back) * (1.0 - 0.75 * steep) * (1.0 - 0.45 * holdW) * (1.0 - 0.6 * bar);
  // the mirror: a wet glaze, about 0.06 seen from straight above, rising to 0.7 and more at a glance
  // (the rim of a hanging body, thinner than a pixel, must not spark: its glance is taken no steeper than the pixel shows)
  float nvA = max(nv, min(1.5 * fwidth(nv) * steep, 0.999));
  float fr = 0.06 + 0.66 * pow(max(1.0 - nvA, 1e-4), uTune.w);
  // (a hanging face gives the hall back softer; and the fall's own roll, turning over toward the light, gives back the glass of the roof up the valley whole: a bright band along it)
  float curv = length(fwidth(N));                       // (where the face turns fast from pixel to pixel, as on the folds, the mirror is spread, never speckled)
  // (a level face is a satin mirror: the roof's bars are told in it, long and bright; softer where its creases are too fine to draw)
  float sigF = sqrt(0.00022 + 0.0028 * (1.0 - wNear) * (1.0 - wNear));
  vec3 mir = room(vW, R, mix(sigF, 0.057, steep) + 0.4 * min(curv, 0.5), mix(uTune.x, 6.0, sheet * smoothstep(-3.3, -0.6, fallen)), skyC, sunC, gndC);
  fr *= (1.0 - 0.85 * froth) * (1.0 - 0.35 * cream);   // (cream is glossy too: the creases run on over it)
  mir *= (1.0 - 0.6 * steep) * (1.0 - back) * (1.0 - back);   // (a fold's flank faces its neighbour, not the hall: it mirrors chocolate)
  col = col * (1.0 - fr) + mir * fr * uTune.z;
  // a hanging sheet mirrors the bright hall before it as long soft ribbons: each the picture of one tall light (the
  // sunlit glass to one side, the sky in the far windows to the other), drawn out down the sheet
  float nAc = dot(N, Tu), nDn = dot(N, Tv);
  vec3 ha = normalize(V + vec3(-0.36, 0.35, 0.8)), hc = normalize(V + vec3(0.42, 0.2, 0.77));
  // (where the face turns faster than a pixel can show, as on a thin string, the ribbon is spread and dimmed, never a spark)
  vec2 dn = vec2(nAc - dot(ha, Tu), nAc - dot(hc, Tu)), fn = fwidth(dn);
  vec2 wg = mix(vec2(0.032, 0.027), vec2(0.075, 0.06), sheet);   // (on the fall's ropes: a broad soft ribbon, not a hairline)
  vec2 wr = sqrt(wg * wg + 0.5 * fn * fn);
  vec2 da = dn / wr;
  vec2 db = vec2(nDn - dot(ha, Tv), nDn - dot(hc, Tv)) / 0.5;
  vec2 rib = exp(-da * da - db * db) * (wg / wr) * steep * (1.0 - 0.8 * froth) * (1.0 - back) * (1.0 - back);
  // (on the sheet only the bold ropes carry a ribbon of light, and that one bright: a few long lines, no pale veil)
  col += (skyC * 0.13 + sunC * 0.2) * uWarm * rib.x * mix(1.0, 1.5 * smoothstep(0.45, 0.85, rb) * smoothstep(0.35, 0.75, swell), sheet) + skyC * vec3(0.07, 0.065, 0.056) * rib.y * (1.0 - sheet);
  // the fall's roll gives back the bright glass over it as a band of shine along its turn: brightest along its middle
  // line and soft to both sides, stronger here and fainter there along the lip (slowly changing), broken where the ropes begin
  float hbN = max(dot(N, normalize(V + vec3(0.0, 0.95, -0.3))), 1e-4);
  float hb2 = hbN * hbN, hb8 = hb2 * hb2 * hb2 * hb2, hb64 = hb8 * hb8 * hb8 * hb8 * hb8 * hb8 * hb8 * hb8;
  float along = 0.3 + 0.9 * vnoise(vec2(vUv.x * 0.7 + 3.0, 0.12 * uTime));
  float turn = smoothstep(-SHEET_SB - 0.2, -SHEET_SB + 0.8, fallen) * (1.0 - smoothstep(0.5, 2.0, fallen));   // (only where it turns over)
  col += (skyC * 0.2 + sunC * 0.115) * uWarm * (0.3 * hb8 * hb8 + 0.7 * hb64) * along * turn * sheet * (1.0 - 0.7 * steep);
  // where the sheet is thin (its webs, its edges, its strands) a little warm light comes through it
  col += thinS * offSill * (sunC * vec3(0.026, 0.0125, 0.004) * (0.4 + 0.6 * bar) + skyC * vec3(0.017, 0.0085, 0.003));
  // at the shore the liquid ends against the wet earth: a hair of the hall's light where it wets it, no more
  float wq = ds / 0.035;
  col += (skyC * 0.07 + sunC * 0.04 * (0.3 + 0.7 * bar)) * vec3(1.0, 0.8, 0.6) * exp(-wq * wq) * level;
  col += (skyC * 0.16 + sunC * 0.08 * (0.3 + 0.7 * bar)) * vec3(1.0, 0.86, 0.68) * min(stand.z, 1.0);   // (the same line of light round each thing that stands in it)
  // the folds at the fall's foot: the hall's light lies along each crest (vMix.z: how near the crest is), broad and
  // bright on the tight folds of the pile, and fainter and finer as they run out and widen into rings (the length of
  // vFlow.xyz is a fold's phase per metre: about 9 on the pile, less the wider it has grown)
  float crest = vMix.z * (1.0 - step(0.5, vAux.x)), tight = smoothstep(2.5, 8.0, length(vFlow.xyz));
  float cr2 = crest * crest, cr4 = cr2 * cr2;
  // (where the folds are finer than the picture's grain their light is let go, and under froth: no pale veil, no slab)
  col += (skyC * 0.1 + sunC * 0.06) * uWarm * mix(0.22 * cr4 * cr4, cr4, tight) * (0.25 + 0.75 * tight) * (1.0 - steep) * (1.0 - 0.8 * smoothstep(0.2, 0.6, fwidth(vMix.z))) * (1.0 - 0.7 * froth);
  // the sun's own glint: broad, soft, only where a bar of light lies
  float sd = max(dot(R, uSunDir), 1e-4);
  col += sunC * uWarm * (0.06 * pow(sd, 12.0) + 0.3 * pow(sd, 60.0) * (1.0 - steep)) * bar * (1.0 - back);   // (one broad soft glint; no point of light anywhere)
  col = max(col, uHold[0] * holdW);                     // (under a dark mirror too the brown never sinks into the grade's red-black)
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
  if (gone > 0.5) discard;
}`;

// THE HOLD, hour by hour: what the body puts out at a brightness of 0.12, 0.6 and 1.6 of the day's fully lit body so
// that the page's grade for that hour (its exposure, tint, tone curve, saturation, contrast and shadow tint) shows
// one dark, rich brown (hue 24; a little yellower in the two cool hours, whose haze and mirror pull it toward red) from dark to
// light. Reckoned outside, by turning that grade round. (Exported so that another liquid, such as the pipes', can be
// given the same brown: linear colours, to be put out as they stand.)
export const HOLD = {
  day: [[0.0775, 0.0681, 0.0713], [0.1325, 0.0905, 0.0805], [0.2338, 0.1308, 0.0983]],
  golden: [[0.0687, 0.0649, 0.0735], [0.1234, 0.0882, 0.0835], [0.2223, 0.1294, 0.1027]],
  dawn: [[0.0656, 0.0620, 0.0551], [0.1218, 0.0900, 0.0642], [0.2226, 0.1387, 0.0811]],      // (under dawn's rose haze: hue 29)
  night: [[0.0766, 0.0634, 0.0550], [0.1363, 0.0876, 0.0627], [0.2448, 0.1305, 0.0773]],     // (the overcast hour: hue 26)
};
// One material of the family. Every one made here shares one program (same source, same defines).
export function chocolateMaterial(THREE, o, opts = {}) {
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.lights, THREE.UniformsLib.fog, {
    uTime: { value: 0 },
    uSunDir: { value: o.lightDir.clone().normalize() },
    uBody: { value: new THREE.Color(opts.body || '#614434') },
    uCream: { value: new THREE.Color(opts.cream || '#eed3a8') },
    uGold: { value: new THREE.Color(opts.gold || '#d9b27a') },
    uMousse: { value: new THREE.Color(opts.mousse || '#b9977a') },   // the froth: pale cream-brown, never white
    uTune: { value: new THREE.Vector4(15.0, 0.0065, opts.gloss || 1.0, 4.3) },   // least dark gap between mirrored teeth (m of 20), the creases' height (m), mirror gain, glaze power
    uSeed: { value: new THREE.Vector4(opts.seedU || 0, opts.seedV || 0, 0, 0) },
    uWarm: { value: new THREE.Vector3(1.0, 0.88, 0.66) },   // the glass as the mirror gives it back: warm white
    uRollZ: { value: new THREE.Vector4(0, 0, 0, 0) }, uRollV: { value: new THREE.Vector4(0, 0, 0, 0) },
    uDrop: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(1e5, 1e5, 4, 0)) },
    uHull: { value: HULL.half.slice() },
    uHold: { value: (HOLD[o.look && o.look.hour] || HOLD.day).map((k) => new THREE.Vector3(k[0], k[1], k[2])) },
    uPier: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => { const q = (opts.piers || [])[i]; return q ? new THREE.Vector4(q.x, q.z, q.fx, q.fz) : new THREE.Vector4(1e5, 1e5, 0, 1); }) },
    uSpring: { value: new THREE.Vector4(opts.spring === undefined ? 1e6 : opts.spring, 0, 0, 0) },
  }]);
  return new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG_HEAD + FRAG_ROOM + FRAG_STAND + FRAG_MOOR + FRAG_MAIN, lights: true, fog: true, side: THREE.DoubleSide });
}
