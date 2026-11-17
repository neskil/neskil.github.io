// THE CORE of the digging wheel: the frame's figures, the chance, the builder of flat-faced solids whose every corner carries a
// motion mark, the one table of uniforms, and the GLSL every drawing of this world shares (light, sky fill, haze, noise, the
// clock's laws, the sun's shadow test). The land, the machine, the works and the world file build on it.
//
// THE FRAME: metres, y up. The origin is the machine's turning axis on the pit floor. +x east (the face, the hill), +z south
// (the lens's side and the sun's). The wheel's hub is (80, 32, 0); it turns in the plane z about 0, once in 20 s, anticlockwise
// seen from +z, so that its buckets RISE on the +x side.
//
// WHAT THE OTHER FILES USE (the interfaces; only the lead changes them):
//   WHEEL, ZC, SUN, N_BUCKETS, WHEEL_PERIOD, G, MAX_BOXES, MAX_CAPS, the colours, C(hex, k)
//   BOOM, boomTop(x), boomBot(x), beltY(x), BRIDGE, bridgeY(x), SPOUT, HEAP   where the machine's and the works' files meet
//   HARVEST                                    where the land's and the harvest's files meet: the cut part of the home field and what stands in it
//   fixedRng(seedNumber)                       a generator that no visit's seed touches (every geometry count is the same on every seed)
//   namedRng(ctx, name)                        a named stream of the visit's chance
//   wheelAngle(t), turnedAt(p, t)              the wheel's turn at clock t, in JS (the mirror of GLSL turned())
//   makeUniforms()                             the ONE table every material of this world is given
//   addShadowBox(uniforms, centre, half, yaw)  one of up to 24 boxes the sun's ray is tried against (see GLSL_SHADE for how to size them)
//   addShadowCap(uniforms, a, b, ra, rb)       one of up to 20 capsules (round bars from a to b, radius ra at a and rb at b)
//   GLSL_COMMON, GLSL_CLOCK, GLSL_SHADE, GLSL_SURFACE_DEFAULT, GLSL_MOTION_DEFAULT
//   makeMaterial(uniforms, opts)               the material Geo.mesh gives (for a geometry made some other way: it needs the
//                                              attributes position, color (vec3), mark (vec4), aux (vec4))
//   class Geo                                  tri, quad, boxM, box, beam, prism, cyl, lump, geometry, mesh, triangles; g.mark, g.aux
import * as THREE from 'three';

export const WHEEL = { x: 80, y: 32, R: 10 };                 // the wheel's hub and the radius its teeth sweep
export const ZC = -5;                                         // the machine's middle line (the wheel hangs 5 m to the lens's side of it)
export const SUN = new THREE.Vector3(-0.50, 0.40, 0.77).normalize();   // toward the sun: 23.5 degrees up in the south-west
export const N_BUCKETS = 16;
export const WHEEL_PERIOD = 20;                               // seconds a turn (GLSL_CLOCK has the same figure typed in)
export const G = 9.81;
export const MAX_BOXES = 24, MAX_CAPS = 20;                 // the shadow tables' sizes; each file's share: boxes machine 16, works 3, land 1, the harvest 4 (all 24 in use); capsules land 10 (8 in use), machine 10
// THE HARVEST, BEGUN AND LEFT (round three b): where the land's file and the harvest's file meet. North of the farmstead
// and the lane the home field is CUT from the pit's lip east to the tramline at x 174 (stubble, the straw in windrows a
// header's width apart, running north and south): north of the shelter row of limes west of its east end, and east of
// that end down to the lane's north verge. East of the cut's edge the pass in hand: a header's width cut north of the
// knife, standing south of it; the combine stands in that pass with its header in the standing barley, heading south
// (toward +z, toward the lane); a tractor with a grain trailer stands on the stubble west of it. The way out flies
// north along x 184, over the standing barley just east of the pass, and then north-west over the stubble to the ring:
// the lens's line crosses over the combine's tail (6 m and more over it), the tractor and its trailer lie left of the ring. Places by x and z; each
// stands on the land. Nothing here moves and nobody is there.
export const HARVEST = {
  cut: { x1: 174, z0: -131, z1: -26.5, eastX0: 150, eastZ1: -8.3 },   // the stubble: from the lip east to x1, from the north hedge's foot (z0) south to the hedge at the limes' foot (z1); and east of eastX0 on south to the lane's north verge (eastZ1)
  pass: { x0: 174, x1: 181.2, knife: -34.5 },                 // the pass in hand: cut where z is under knife (north of it), standing south of it as far as the lane's verge
  rows: 7.2,                                                  // a header's width: the windrows' spacing
  combine: { x: 177.6, z: -41, yaw: 0 },                      // its middle; it heads toward +z (south); its header spans the pass, the knife at pass.knife
  tractor: { x: 153, z: -57, yaw: 0 }, trailer: { x: 153, z: -64.5, yaw: 0 },   // the tractor heads south too, the trailer on its drawbar behind it (north)
};
// where the machine's and the works' files meet (figures both build to)
export const BOOM = { x0: 8, x1: WHEEL.x, top0: 24, bot0: 18, rise: 10.5, zS: -2.3, zN: -7.7 };   // the wheel's boom: a plate girder from x0 to the hub, its top and bottom lines climbing `rise`, its two sides
export const boomTop = (x) => BOOM.top0 + (x - BOOM.x0) / (BOOM.x1 - BOOM.x0) * BOOM.rise;
export const boomBot = (x) => BOOM.bot0 + (x - BOOM.x0) / (BOOM.x1 - BOOM.x0) * BOOM.rise;
export const beltY = (x) => boomTop(x) + 0.95;                // the top of the boom's belt
export const BRIDGE = { from: [-14, 13.5], to: [-84, 10.5], w: 3.4, h: 3.0 };   // the discharge bridge's middle line (x, y) on z = ZC; its belt's top is 1.5 m over it
export const bridgeY = (x) => BRIDGE.from[1] + (x - BRIDGE.from[0]) / (BRIDGE.to[0] - BRIDGE.from[0]) * (BRIDGE.to[1] - BRIDGE.from[1]) + BRIDGE.h / 2;   // the top of the bridge's belt
export const SPOUT = { from: [-86, 10], to: [-108, 17], w: 2.6, h: 2.2 };       // the loader's spout: its middle line (x, y) on z = ZC, out over the heap
export const HEAP = { x: -112, z: ZC, R: 13, H: 14 };         // the heap under the spout: its middle, its radius, its height

// THE FLIGHT'S LINE, BY PLACE (x, y, z in metres of the frame; y absolute; the same on every seed). It stands here, in the
// core, because two files build to it: the world file flies it, and the land file stands its near crop along the part of it
// that goes over the field. Nothing reads a seed, a still's position or the lens to place it.
export const ROUTE = [
  [-84.4, 9.5, 135.5],  // the entry ring on the pit floor, south-south-west of the machine, 159.6 m from its turning axis (the ring's lowest point 2.5 m over the floor); the line first points 16.8 degrees east of north, at the middle of the machine's whole outline (which the entry sees from 16.1 degrees west of north, the heap's foot, to 52.2 east, the wheel's tip)
  [-81.8, 9.5, 126.9],  // straight for 9 m
  [-75, 9.2, 113.5],    // then round to the right, 26 degrees in the next 52 m (15 of them by metre 24, here), across the haul road
  [-63.2, 8.2, 97.3],   // the coach ahead on the left, the tracks beyond it
  [-44.5, 6, 76.5],    // off the road to the north
  [-32.5, 5, 62],      // past the coach's west end, 10 m from it, a little over its roof
  [-19.5, 4.6, 39.5],  // in toward the tracks, the aft crawlers ahead on the left
  [-12.6, 4.6, 31.6],  // round to the east (a round of 26 m)
  [-4.6, 4.7, 27.1],
  [4.6, 4.9, 25.6],    // along the stair tower and the fore south crawlers, 8 to 10 m south of them
  [22, 6.5, 25.6],
  [44, 19.5, 27],      // rising beside the boom, the belt and its earth above
  [62, 30, 30.5],      // the wheel ahead
  [80, 35.6, 26.5],    // abreast of the wheel, 25 m south of its near face
  [92, 40.3, 29],      // over the lip
  [105, 42.8, 36],     // round the wheel's east side over the standing crop
  [120, 51.5, 51],     // climbing south-east over the grain, the wheel in its bay below and behind
  [135, 60.5, 60.5],   // THE LOOK BACK: the line's farthest south, 60.5 m south of the wheel's plane, 26.6 m over the lip's level and still climbing
  [150, 64, 51.5],     // metre 319.6, 30.1 m over the lip's level (the line's highest, 30.2 m, is 2.2 m on, at metre 321.8, where the gaze lets go of the look back)
  // THE WAY OUT (round three: round the farmstead's east side, wide of every crown, and into the ring from the south-east;
  // as far as [150, 64, 51.5] the points are round two's to the centimetre, from [-44.5, 6, 76.5] on)
  [172.75, 61, 28.75],     // metre 352.0: north-east and down (52 to 39 degrees east of north, down by up to 7.5 degrees), the farmstead and the poplars' row on the left
  [179.97, 59.9, 18.24],   // metre 364.8: round to the north (from 39 degrees east of north at metre 354 to 6 at metre 379)
  [182.95, 58.7, 5.9],     // metre 377.6: past the poplars' east end, 34.8 m from the last one's stem and 30.9 m from its crown (metre 373.3)
  [183.75, 57.4, -8.5],    // metre 392.1: north over the lane (its middle crossed at metre 386.6, 13.7 m over it, 65.6 m east of the last of the lane's two poles)
  [184.54, 56, -22.85],    // metre 406.5: past the limes' east end (the row's line crossed at metre 408.3, 38.5 m east of the last lime's stem)
  [183.21, 54.9, -35.19],  // metre 419.0: round to the north-west behind the limes (from due north at metre 406 to 33 degrees west of north by metre 434), the last lime's crown 30.7 m off at the nearest (metre 427.8)
  [178.06, 53.7, -46.44],  // metre 431.5
  [171.5, 52.7, -56.2],    // metre 443.3: straight at the ring (the last 22 m within 2 degrees of the last direction: 33.6 degrees west of north, 5.4 degrees down)
  [165, 51.58, -66],       // metre 455.1: the exit ring, standing in the stubble of the half-cut home field 63 m north of the lane's middle and 41.4 m north of the limes' row, square to that last direction (its lowest point 2.43 m over the stubble, where the lens is 9.43 m over it: its least on the way out)
];
export const SPEED = 13;                                      // metres a second

// the colours (linear), as the proof had them
export const C = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
export const STEEL = [0.10, 0.105, 0.115], BRIGHT = [0.74, 0.73, 0.70], GREY = [0.215, 0.23, 0.235], OXIDE = [0.44, 0.18, 0.11];
export const EARTH = [0.43, 0.33, 0.21], HOLLOW = [0.02, 0.02, 0.022], DARK = [0.1, 0.105, 0.11], PALE = [0.40, 0.42, 0.40], GLASS = [0.035, 0.05, 0.065];

// ---------- chance ----------
// a small fixed generator: nothing it deals is the visit's
export function fixedRng(s) {
  let a = s >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  return r;
}
// a named stream of the visit's own chance (never for a count of geometry: counts are the same on every seed)
export function namedRng(ctx, name) { return ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)); }

// ---------- the clock's law for the wheel, in JS ----------
export function wheelAngle(t) { return 2 * Math.PI * (((t % WHEEL_PERIOD) + WHEEL_PERIOD) % WHEEL_PERIOD) / WHEEL_PERIOD; }
// where a point of the wheel as built stands at clock t
export function turnedAt(p, t) {
  const a = wheelAngle(t), c = Math.cos(a), s = Math.sin(a), dx = p[0] - WHEEL.x, dy = p[1] - WHEEL.y;
  return [WHEEL.x + c * dx - s * dy, WHEEL.y + s * dx + c * dy, p[2]];
}

// ---------- the one table of uniforms ----------
export function makeUniforms() {
  const v3 = (n) => Array.from({ length: n }, () => new THREE.Vector3()), v4 = (n) => Array.from({ length: n }, () => new THREE.Vector4());
  return {
    uSun: { value: SUN.clone() },
    uT: { value: 0 },                                         // the world's clock, seconds
    uWheel: { value: new THREE.Vector3(WHEEL.x, WHEEL.y, WHEEL.R) },
    uHaze: { value: new THREE.Vector3(0.80, 0.80, 0.78) },    // the far air's colour (the world file sets it from its sky)
    uBoxC: { value: v3(MAX_BOXES) }, uBoxH: { value: v3(MAX_BOXES) }, uBoxR: { value: Array.from({ length: MAX_BOXES }, () => new THREE.Vector2(1, 0)) }, uBoxN: { value: 0 },
    uCapA: { value: v4(MAX_CAPS) }, uCapB: { value: v4(MAX_CAPS) }, uCapN: { value: 0 },
  };
}
// a shadow box: its middle [x, y, z], its half sizes [hx, hy, hz], its yaw about y (radians, as Geo.box's ry). Gives its
// place in the table, or -1 when the table is full. SIZE IT INSIDE ITS MASS: 0.1 m or more under every sunlit face (a corner
// of the drawing that lies inside a box is taken as shaded).
export function addShadowBox(uniforms, centre, half, yaw = 0) {
  const i = uniforms.uBoxN.value; if (i >= MAX_BOXES) return -1;
  uniforms.uBoxC.value[i].set(centre[0], centre[1], centre[2]); uniforms.uBoxH.value[i].set(half[0], half[1], half[2]); uniforms.uBoxR.value[i].set(Math.cos(yaw), Math.sin(yaw));   // (its yaw's cosine and sine: worked once here, not at every pixel)
  uniforms.uBoxN.value = i + 1; return i;
}
// a shadow capsule: a round bar from a to b, radius ra at a and rb at b (a poplar: wide low, narrow high)
export function addShadowCap(uniforms, a, b, ra, rb = ra) {
  const i = uniforms.uCapN.value; if (i >= MAX_CAPS) return -1;
  uniforms.uCapA.value[i].set(a[0], a[1], a[2], ra); uniforms.uCapB.value[i].set(b[0], b[1], b[2], rb);
  uniforms.uCapN.value = i + 1; return i;
}

// ---------- GLSL ----------
// (the uniforms' declarations, once, whichever chunks a shader takes)
const GLSL_HEAD = /* glsl */`
#ifndef DW_HEAD
#define DW_HEAD
  uniform vec3 uSun;      // toward the sun
  uniform float uT;       // the world's clock, seconds
  uniform vec3 uWheel;    // the hub's x, y and the radius the teeth sweep
  uniform vec3 uHaze;     // the far air's colour
#endif
`;

// noise, the sun's colour, the sky's fill, the haze (vertex or fragment)
export const GLSL_COMMON = GLSL_HEAD + /* glsl */`
  const vec3 SUNC = vec3(1.0, 0.76, 0.44) * 1.5;            // the low gold sun (round three e: deeper and stronger against a lower, bluer fill)
  float hash1(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
    return mix(mix(mix(hash1(i), hash1(i + vec3(1,0,0)), f.x), mix(hash1(i + vec3(0,1,0)), hash1(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash1(i + vec3(0,0,1)), hash1(i + vec3(1,0,1)), f.x), mix(hash1(i + vec3(0,1,1)), hash1(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = 0.5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s / 0.9375; }
  // what the sky and the lit ground give a face that looks along n
  vec3 skyAmb(vec3 n){ return mix(vec3(0.52, 0.40, 0.24) * 0.20, vec3(0.34, 0.46, 0.74) * 0.34, n.y * 0.5 + 0.5); }
  // the air between the lens and the place wp: its depth, and (round three e) the direction of sight against the sun's,
  // by which the air toward the sun is gold. (The lens's place is read in this world's shaders only as light itself
  // needs it: here for the air; in faceNormal to light a face on the side that is seen; in the land's shaders for the
  // ears' sheen and the stand's own shade toward the sun and for the light through leaves.)
  vec3 hazeK(vec3 col, vec3 wp, float k){ vec3 v = wp - cameraPosition; float d = length(v); float f = 1. - exp(-d * k);
    float g = max(dot(v / max(d, 1e-3), uSun), 0.);           // (the air toward the sun is gold: the look's own direction, read as the air's light needs it)
    return mix(col, mix(uHaze, vec3(1.0, 0.80, 0.52), 0.7 * g * g * g), f); }
  vec3 haze(vec3 col, vec3 wp){ return hazeK(col, wp, 0.0007); }      // (round three e: the air nearly twice as dense as it was, 0.00038)
`;

// THE CLOCK'S LAWS (vertex). moved(p, mark, aux) is where a corner built at p stands at clock uT.
//   mark.x 0: it stands.   mark.x 1: it turns with the wheel (turned(p)).
//   mark.x 2 and up belong to the file that makes the mesh: it hands Geo.mesh opts.motion, a GLSL string that DEFINES
//   vec3 movedMore(vec3 p, vec4 mark, vec4 aux)   (in the works file 2 is a bucket's load, 3 a looped falling lump, 4 a lump
//   riding a belt, and so on: see its WORKS_MOTION; mark.yzw and aux are that kind's own numbers; a kind's number means
//   something only inside the file whose motion law reads it). A motion law may call turned() and wheelTurn().
export const GLSL_CLOCK = GLSL_HEAD + /* glsl */`
  // the wheel's angle now (radians, anticlockwise seen from +z; one turn in 20 s)
  float wheelTurn(){ return 6.2831853 * mod(uT, 20.0) / 20.0; }
  // a point turned by the angle a about the hub's axis (the line through (uWheel.x, uWheel.y) parallel to z)
  vec3 turnedBy(vec3 p, float a){ float c = cos(a), s = sin(a); vec2 d = p.xy - uWheel.xy;
    return vec3(uWheel.xy + vec2(c * d.x - s * d.y, s * d.x + c * d.y), p.z); }
  // a point of the wheel as built, where the wheel has carried it now (buckets rise on the +x side)
  vec3 turned(vec3 p){ return turnedBy(p, wheelTurn()); }
  vec3 movedMore(vec3 p, vec4 mark, vec4 aux);              // kinds 2 and up: defined by opts.motion (or the default)
  vec3 moved(vec3 p, vec4 mark, vec4 aux){
    if (mark.x < 0.5) return p;                             // KIND 0: it stands
    if (mark.x < 1.5) return turned(p);                     // KIND 1: it turns with the wheel
    return movedMore(p, mark, aux);                         // KINDS 2 and up
  }
`;
export const GLSL_MOTION_DEFAULT = /* glsl */`
  vec3 movedMore(vec3 p, vec4 mark, vec4 aux){ return p; }
`;

// THE LIGHT (fragment only: it takes the face from the derivatives of the world position).
//   float shade(vec3 p)                 how much of the sun is cut off at p (0 none, 1 all): the wheel's disc with its buckets'
//                                       gaps going round, the boom's slab, then the sun's ray against the shadow boxes and capsules
//   float shadeOnce(vec3 wp)            the same at the fragment's own place, worked once for all who ask
//   vec3 faceNormal(vec3 wp)            the flat face's normal, turned to face the lens (a face is lit on the side that is seen)
//   float footprint(vec3 wp)            the pixel's footprint there, metres
//   vec3 lit(vec3 col, vec3 n, vec3 wp) the surface's colour under the sun (less its shadows) and the sky
export const GLSL_SHADE = GLSL_HEAD + /* glsl */`
  uniform vec3 uBoxC[${MAX_BOXES}]; uniform vec3 uBoxH[${MAX_BOXES}]; uniform vec2 uBoxR[${MAX_BOXES}]; uniform int uBoxN;
  uniform vec4 uCapA[${MAX_CAPS}]; uniform vec4 uCapB[${MAX_CAPS}]; uniform int uCapN;
  // a ray from o along d against a box of half sizes h about the origin: 1 in its shadow, soft at the shadow's edge
  // (the ray's miss distance past the box's edge is worked from the gap between its entry and exit times)
  float boxCut(vec3 o, vec3 d, vec3 h){
    d = mix(d, vec3(1e-4), vec3(lessThan(abs(d), vec3(1e-4))));
    vec3 m = 1. / d, n = m * o, k = abs(m) * h, t1 = -n - k, t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z), tF = min(min(t2.x, t2.y), t2.z);
    vec3 ad = abs(d); float di = dot(step(vec3(tN), t1), ad), dj = dot(step(t2, vec3(tF)), ad);
    float miss = (tN - tF) * di * dj / sqrt(di * di + dj * dj + 1e-8), soft = 0.10 + 0.010 * max(tN, 0.);
    return (1. - smoothstep(-soft, soft, miss)) * smoothstep(0., 0.3, tF);
  }
  // the same against a round bar from a.xyz (radius a.w) to b.xyz (radius b.w)
  float capCut(vec3 o, vec3 d, vec4 a, vec4 b){
    vec3 u = b.xyz - a.xyz, w = o - a.xyz; float B = dot(d, u), Cc = dot(u, u), D = dot(d, w), E = dot(u, w);
    float s = clamp((E - B * D) / max(Cc - B * B, 1e-5), 0., 1.), t = max(0., B * s - D); s = clamp((E + B * t) / Cc, 0., 1.);
    float dist = length(w + d * t - u * s), r = mix(a.w, b.w, s), soft = 0.15 + 0.012 * t;
    return (1. - smoothstep(r - soft, r + soft, dist)) * smoothstep(0., 0.5, t);
  }
  float shade(vec3 p){ float sh = 0.;
    // the wheel: a disc in the plane z = 0.2 about the hub, its rim toothed by the sixteen buckets as they go round
    if (p.z < -1.6) { float t = (0.2 - p.z) / uSun.z; vec2 q = (p + uSun * t).xy - uWheel.xy; float r = length(q);
      float k = abs(fract((atan(q.y, q.x) - 6.2831853 * mod(uT, 20.0) / 20.0) / 0.3926991 - 0.236) - 0.5);
      float edge = mix(uWheel.z - 1.9, uWheel.z - 0.15, smoothstep(0.06, 0.2, k)), soft = 0.2 + 0.012 * t;
      sh = max(sh, 1. - smoothstep(edge - soft, edge + soft, r)); }
    // the wheel's boom: a slab 72 m long that climbs 10.5 m to the hub (a box in a frame sheared by that climb)
    { float kx = 10.5 / 72.; vec3 o = vec3(p.x - (uWheel.x - 35.4), p.y - (uWheel.y - 0.5 - kx * (uWheel.x - p.x)), p.z + 5.);
      sh = max(sh, boxCut(o, vec3(uSun.x, uSun.y - kx * uSun.x, uSun.z), vec3(36.6, 2.9, 2.6))); }
    // the machine's big masses and whatever else is in the table
    for (int i = 0; i < ${MAX_BOXES}; i++) { if (i < uBoxN) { float c = uBoxR[i].x, s = uBoxR[i].y; vec3 o = p - uBoxC[i];
      sh = max(sh, boxCut(vec3(c * o.x - s * o.z, o.y, s * o.x + c * o.z), vec3(c * uSun.x - s * uSun.z, uSun.y, s * uSun.x + c * uSun.z), uBoxH[i])); } }
    for (int i = 0; i < ${MAX_CAPS}; i++) { if (i < uCapN) sh = max(sh, capCut(p, uSun, uCapA[i], uCapB[i])); }
    return sh * 0.94; }
  vec3 faceNormal(vec3 wp){ vec3 n = normalize(cross(dFdx(wp), dFdy(wp))); return dot(n, wp - cameraPosition) > 0. ? -n : n; }
  float footprint(vec3 wp){ vec3 w = fwidth(wp); return max(length(w) * 0.7071, 1e-4); }
  // THE CLOUDS' DRIFTING SHADOWS ON WHAT STANDS IN THE PIT: how much of the sun a cloud takes from the steel, the works,
  // the coach and the pickup at a place. It is the land's own field (its cloudCutL and pitCloud hold the same figures:
  // the same pattern at the same place and clock), so that a shadow that darkens the pit's floor darkens what stands on
  // it: on the machine's own ground 0.78 of the whole, as the floor there; easing to none over the last 28 m before the
  // lip at the wheel's end (the lip stands ${(WHEEL.x + 10.2).toFixed(1)} m out south of the cut front and ${(WHEEL.x + 6.2).toFixed(1)} m north of it), as the
  // floor does there; whole beyond 230 m of the machine's axis. By the place alone: the height is not asked.
  float cloudOn(vec3 wp){ vec2 p = wp.xz; float r = length(p), lipr = mix(${(WHEEL.x + 6.2).toFixed(1)}, ${(WHEEL.x + 10.2).toFixed(1)}, smoothstep(-3., 5., p.y));
    float far = max(smoothstep(130., 230., r), 0.78 * mix(1., smoothstep(0., 28., lipr - r), smoothstep(20., 50., p.x)));
    if (far <= 0.) return 0.; vec2 q = p - vec2(9., -4.) * uT; return 0.68 * far * smoothstep(0.535, 0.57, fbm(vec3(q / 270., 4.4))); }
  // the sun's cut AT THE FRAGMENT'S OWN PLACE (the bodies' shadows and the clouds' together), worked once however many
  // ask (lit() and a surface's own law of light both may): call it only with the fragment's own world place
  float gCut = -1.;
  float shadeOnce(vec3 wp){ if (gCut < 0.) gCut = 1. - (1. - shade(wp)) * (1. - cloudOn(wp)); return gCut; }
  vec3 lit(vec3 col, vec3 n, vec3 wp){ float ndl = max(dot(n, uSun), 0.), cut = ndl > 0. ? shadeOnce(wp) : 0.;
    return col * (SUNC * ndl * (1. - cut) + skyAmb(n)); }
`;

// THE SURFACE (fragment). Geo.mesh's opts.surface is a GLSL string that DEFINES
//   vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot)
// and gives the surface's own colour before light. base: the corner's colour. p0: the corner's place AS BUILT, unmoved (seams
// and streaks drawn by p0 stick to a turning wheel). wp: where it is now. n: the face's normal. foot: the pixel's footprint
// there in metres (filter the drawing by it; never by where the lens is). It may use everything in GLSL_COMMON and uT.
export const GLSL_SURFACE_DEFAULT = /* glsl */`
  vec3 surface(vec3 base, vec3 p0, vec3 wp, vec3 n, float foot){ return base; }
`;

// the material of a Geo's mesh. opts.surface, opts.motion: GLSL strings as above (each optional)
export function makeMaterial(uniforms, opts = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms,
    vertexShader: `${GLSL_CLOCK}
      ${opts.motion || GLSL_MOTION_DEFAULT}
      attribute vec3 color; attribute vec4 mark; attribute vec4 aux; varying vec3 vW, vP0, vC;
      void main(){ vP0 = position; vC = color; vW = moved(position, mark, aux); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: `${GLSL_COMMON}${GLSL_SHADE}
      ${opts.surface || GLSL_SURFACE_DEFAULT}
      varying vec3 vW, vP0, vC;
      void main(){ vec3 n = faceNormal(vW); vec3 col = surface(vC, vP0, vW, n, footprint(vW));
        gl_FragColor = vec4(haze(lit(col, n, vW), vW), 1.); }`,
  });
}

// ---------- the builder: flat-faced solids, every corner its own (place, colour, mark, aux) ----------
// g.mark = [kind, a, b, c] and g.aux = [a, b, c, d] are the CURRENT mark and aux: every tri made after takes them.
const ICO_T = (1 + Math.sqrt(5)) / 2;
const ICO_V = [[-1, ICO_T, 0], [1, ICO_T, 0], [-1, -ICO_T, 0], [1, -ICO_T, 0], [0, -1, ICO_T], [0, 1, ICO_T], [0, -1, -ICO_T], [0, 1, -ICO_T], [ICO_T, 0, -1], [ICO_T, 0, 1], [-ICO_T, 0, -1], [-ICO_T, 0, 1]];
const ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
const BOX_F = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
const NO_MARK = [0, 0, 0, 0];

export class Geo {
  constructor(corners = 3072) {
    this.n = 0; this.cap = corners;                           // corners written, corners there is room for
    this.P = new Float32Array(corners * 3); this.C = new Float32Array(corners * 3); this.M = new Float32Array(corners * 4); this.A = new Float32Array(corners * 4);
    this.mark = NO_MARK; this.aux = NO_MARK;
  }
  _room(k) {
    if (this.n + k <= this.cap) return;
    let cap = this.cap; while (this.n + k > cap) cap *= 2;
    const grow = (a, w) => { const b = new Float32Array(cap * w); b.set(a.subarray(0, this.n * w)); return b; };
    this.P = grow(this.P, 3); this.C = grow(this.C, 3); this.M = grow(this.M, 4); this.A = grow(this.A, 4); this.cap = cap;
  }
  tri(a, b, c, col) {
    this._room(3);
    const P = this.P, C = this.C, M = this.M, A = this.A, mk = this.mark, ax = this.aux; let i = this.n * 3, j = this.n * 4;
    P[i] = a[0]; P[i + 1] = a[1]; P[i + 2] = a[2]; P[i + 3] = b[0]; P[i + 4] = b[1]; P[i + 5] = b[2]; P[i + 6] = c[0]; P[i + 7] = c[1]; P[i + 8] = c[2];
    for (let k = 0; k < 3; k++, i += 3, j += 4) { C[i] = col[0]; C[i + 1] = col[1]; C[i + 2] = col[2]; M[j] = mk[0]; M[j + 1] = mk[1]; M[j + 2] = mk[2]; M[j + 3] = mk[3]; A[j] = ax[0]; A[j + 1] = ax[1]; A[j + 2] = ax[2]; A[j + 3] = ax[3]; }
    this.n += 3;
  }
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  // a box by its eight corners from a matrix (a unit cube about its middle)
  boxM(m, col) {
    const v = [], e = m.elements;
    for (const z of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const x of [-0.5, 0.5]) v.push([e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]);
    for (const q of BOX_F) this.quad(v[q[0]], v[q[1]], v[q[2]], v[q[3]], col);
  }
  // a box by its middle and sizes, turned ry about y and rz about z
  box(cx, cy, cz, sx, sy, sz, col, ry = 0, rz = 0) {
    this.boxM(_m.compose(_p.set(cx, cy, cz), _q.setFromEuler(_e.set(0, ry, rz, 'YZX')), _s.set(sx, sy, sz)), col);
  }
  // a straight member from p to q, w wide (level, across it) and h deep
  beam(p, q, w, h, col) {
    const a = new THREE.Vector3(p[0], p[1], p[2]), b = new THREE.Vector3(q[0], q[1], q[2]), d = b.clone().sub(a), len = d.length(); d.normalize();
    const side = new THREE.Vector3(0, 1, 0).cross(d); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const up = d.clone().cross(side).normalize();
    this.boxM(_m.makeBasis(d.clone().multiplyScalar(len), up.multiplyScalar(h), side.multiplyScalar(w)).setPosition(a.add(b).multiplyScalar(0.5)), col);
  }
  // a flat outline (corners in order) pushed from w0 to w1 across it; map(u, v, w) gives the place
  prism(poly, w0, w1, map, col, capCol = col, ends = true) {
    const n = poly.length; let cu = 0, cv = 0; for (const [u, v] of poly) { cu += u / n; cv += v / n; }
    for (let i = 0; i < n; i++) {
      const [u0, v0] = poly[i], [u1, v1] = poly[(i + 1) % n];
      this.quad(map(u0, v0, w0), map(u1, v1, w0), map(u1, v1, w1), map(u0, v0, w1), col);
      if (ends) { this.tri(map(cu, cv, w0), map(u0, v0, w0), map(u1, v1, w0), capCol); this.tri(map(cu, cv, w1), map(u0, v0, w1), map(u1, v1, w1), capCol); }
    }
  }
  // a round bar from p to q (n sides, both ends closed)
  cyl(p, q, r, n, col) {
    const a = new THREE.Vector3(p[0], p[1], p[2]), b = new THREE.Vector3(q[0], q[1], q[2]), d = b.clone().sub(a).normalize();
    const s = new THREE.Vector3(0, 1, 0).cross(d); if (s.lengthSq() < 1e-6) s.set(1, 0, 0); s.normalize(); const t = d.clone().cross(s);
    const ring = (c) => Array.from({ length: n }, (_, i) => { const th = i / n * Math.PI * 2, cs = Math.cos(th) * r, sn = Math.sin(th) * r; return [c.x + s.x * cs + t.x * sn, c.y + s.y * cs + t.y * sn, c.z + s.z * cs + t.z * sn]; });
    const A = ring(a), B = ring(b), ca = [a.x, a.y, a.z], cb = [b.x, b.y, b.z];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quad(A[i], A[j], B[j], B[i], col); this.tri(ca, A[i], A[j], col); this.tri(cb, B[i], B[j], col); }
  }
  // a lump of earth: a twenty-faced ball pulled well out of round (r: its half width before the pulling). It takes sixteen
  // draws of rng every time: three for its squash, twelve for its corners, one for its tone.
  // mark and aux, when given, are this lump's own (the current ones come back after it).
  lump(c, r, rng, col, mark, aux) {
    const sx = rng.range(0.7, 1.35), sy = rng.range(0.5, 1.0), sz = rng.range(0.7, 1.35), k = r / 1.902;
    const W = ICO_V.map((v) => { const j = rng.range(0.62, 1.28); return [c[0] + v[0] * k * sx * j, c[1] + v[1] * k * sy * j, c[2] + v[2] * k * sz * j]; });
    const tone = rng.range(0.8, 1.15), cc = [col[0] * tone, col[1] * tone, col[2] * tone], m0 = this.mark, a0 = this.aux;
    if (mark) this.mark = mark; if (aux) this.aux = aux;
    for (const f of ICO_F) this.tri(W[f[0]], W[f[1]], W[f[2]], cc);
    this.mark = m0; this.aux = a0;
  }
  // the geometry: position, color (vec3), mark (vec4), aux (vec4), cut to what was written
  geometry() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3));
    g.setAttribute('mark', new THREE.BufferAttribute(this.M.slice(0, n * 4), 4)); g.setAttribute('aux', new THREE.BufferAttribute(this.A.slice(0, n * 4), 4));
    return g;
  }
  // the mesh. opts.surface: GLSL defining surface(); opts.motion: GLSL defining movedMore() (see above); opts.material: a
  // material of your own instead
  mesh(uniforms, opts = {}) {
    const m = new THREE.Mesh(this.geometry(), opts.material || makeMaterial(uniforms, opts));
    m.frustumCulled = false; return m;
  }
  get triangles() { return this.n / 3; }
}
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
