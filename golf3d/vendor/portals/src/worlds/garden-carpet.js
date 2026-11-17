// THE GARDEN UNDERFOOT: ant-high over a Persian garden carpet in a sunlit sitting room, built 300 times
// life size. The carpet (the hero set piece, src/parts/garden-carpet.js) lies under one great pool of
// lattice light; this file builds the room around it and the flight over it.
//
// SPACE  Everything is built in the hero's local frame (pool centre = origin, x east, +z south) inside one
//   group placed at (0, 0, -390), so the brief's world numbers hold: carpet x -240..240, z 0..-780.
//   Room: oak floor, four papered walls with a panelled dado and skirting, a door in the far wall, the
//   lattice window in the east wall (the same star-and-hexagon mask that lights everything), a ceiling
//   lost in haze. On the carpet's edges: the ivory fringe (instanced twisted cords in loose arches, a lane
//   down the axis and a pointed gateway of two cords), the armchair (turned walnut legs on brass castors,
//   studded seat rail, swinging tassel), the cat asleep at the north-west corner (breathing flank, ears,
//   twitching tail), a ball of yarn with its loose end on the east border, slippers or a tea glass on a brass
//   tray in front of the armchair, and the rolled runner over the far end of the long canal with the portal in
//   its hollow.
// LIGHT  No three.js lights. Every material calls the hero's gcSun (sun through the lattice, past the
//   swaying branch, past capsule occluders for the things standing on the wool) plus sky from the window
//   wall and a warm bounce off the floor. The window has a heavy frame (posts 30 m wide, a centre light 210 m
//   wide, lights of 100 m beside it, transoms every 100 m): the posts lay seven or eight long bars of shade
//   across the carpet from east to west, the two lowest transoms one bar down each side, and the pool lies in
//   the bright lozenge between them; the fine star-and-hexagon lattice only mottles the light inside. Four
//   soft shafts of lit haze (camera-facing ribbons with a gaussian profile) hang along the sun's ray, the
//   main one landing on the pool; the lint motes glow where they drift through them.
// LOOKS  spring (madder garden, early sun), golden (the same in amber), winter (ivory and blue, white sun,
//   snow beyond the lattice), night (indigo, cold moon pool, woven lamps). Swaps by seed: cat coat, yarn
//   dye, slippers or tea glass, carp or ducks leading the canal run. Rare: see RARE below.
// FLIGHT (by u)  0-0.05 out from under the table and through the fringe gateway; 0.05-0.15 the prairie: low, north over the
//   south border and then east along the foot of the south-east beds, the gaze held north-north-west over the tufts to the cat,
//   the roll and the stove on the horizon, all in one lozenge of sun; 0.16-0.20 a quick turn in under the side chair by its
//   left side, over the low stretcher; 0.20-0.28 up under its seat, its two front legs at the edges of the frame and the pool,
//   the lantern, the stove and the cat between them; 0.28-0.36 out between the legs and down to the border gateway, which
//   stands upright in the middle of the frame (0.34) and is flown through at 0.381, the gaze held straight down its axis
//   until we are inside it (0.345-0.376) and only then turned to the garden, so that its pillars leave by the frame's
//   edges; 0.38-0.43 west, low along the foot of the south-east orchard, the flowering tree and its birds on the right; 0.43-0.47 round onto the south canal; 0.47-0.55 north
//   up the avenue of cypresses over the silk water, the fountain ahead; 0.55-0.63 a climbing turn to the east over the
//   blossoming crowns of the orchard, the side chair and the lattice window ahead; 0.63-0.67 a wide turn to the left over the
//   garden's south-east corner; 0.66-0.75 THE GARDEN WHOLE: one long glide north-west, straight at the pool, from 70 m: the
//   fountain and the carp in the lower middle, the avenues and blossom trees throwing long shadows, the lantern and the stove
//   to the left, the cat and the roll to the right, and the southern garden behind and beside us sinking back into the pile
//   as we come (standing at 0.67, flat by 0.76); 0.75 past the fountain's east flank; 0.76-0.86 down over the north lobes to
//   the north canal, the gaze a little to the west so that the stove stands whole on the left: what lies ahead goes down
//   last (the north orchards 0.74-0.83, the bank cypresses and the far rows 0.76-0.86, the beds and the silk water at the
//   canal's mouth, 0.86), the pacing carp or ducks already in the canal ahead from 0.76; 0.86-0.91 the canal run along the west bank, the carp or duck pacing in the canal on the right and the two
//   cypresses of the bank passing close on the left; from 0.92 straight into the hollow of the rolled runner.
// GARDEN RISING (a pure function of u and time; everything is built in build() and only shown or hidden)
//   the woven garden stands up out of the rug as the flight goes through it: the border gateway (a strip of the border as a
//   pointed arch of knotted pile with tufted edges, up from 0.245, down again behind us by 0.42), the flower beds swelling into relief with flowers on
//   stems (0.265-0.345), the wool cypresses and blossom trees quarter by quarter (knotted pile with shells of blunt tufts,
//   pom-pom crowns and blossoms that open and close), the water sinking and turning to slow silk (0.33-0.42), the woven
//   birds leaving the flowering tree (0.36-0.42), ahead in a loose arch over the avenue, then wheeling low over the west arm of
//   the cross canal, the fountain of looping silk thread (0.41-0.49 up). Before dawn woven lamps stand up along the canals
//   with it (rings of glowing knots on saffron stems). It settles from 0.68, the south first and whatever lies ahead of the
//   camera last, and is flat pile again by 0.86.
// RARE (ctx.vary.rare)  the stretch from 0.38 to 0.63 is flown high (to 88 m, climbing at once after the gate), above the cypresses. The cat's tail lifts and sweeps
//   out over the west border (u 0.395-0.55, full at 0.435-0.49) and a wave of pile rolls east through the garden (in the
//   field from u 0.47 to 0.60, under the camera at 0.535): along its crest a ridge of turned pile (the rug's own pattern up its dark lee, pale silky fibres and loose tufts on top), every
//   tree heaved up and tipped as it passes, the carp bolting ahead of it. The gaze goes to the tail and then rides the crest.
// ROOM  (added for the winter and night visits above all) the flight begins under a table that stands on the
//   boards south of the fringe (turned legs, stretchers); by the armchair a brass tray on a folding stand with a steaming glass
//   of tea and a lantern on the border; an iron stove against the west wall with coals behind mica panes, a
//   kettle steaming on it; a side chair standing half on the east border and half on the boards, turned a little toward the pool (the flight goes in at its side and out between its front legs); a bookcase
//   and the chair's pair along the far wall; madder curtains at the window and a
//   portiere at the door, stirring. The stove and the lantern are the room's two warm lights (hero.setLamps):
//   in winter and before dawn they lay a pool of orange light over the west third of the carpet, against the
//   cold light of the window; in spring the lantern is out and the stove holds only embers.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/garden-carpet.js';

const OZ = -390;                      // the hero's origin in world z
const SUN = [0.9018, 0.3106, 0.3006]; // direction to the sun: 18 degrees up, from the east and a little south
const WIN = { x: 680, zc: 240, hz: 500, y0: 120, y1: 800, cell: 18, bar: 2.7 };   // lattice opening, hero-local
const WALL = { w: -640, e: 680, s: 890, n: -710, top: 840 };
// the window's heavy frame: a centre light 210 m wide whose sun falls on the pool, lights either side (spaced so that the
// fringe gateway, the south meadow just ahead of the low pass and the mouth of the roll each stand in a lit one), posts 30 m wide,
// and transoms every 100 m up. The posts throw the long bars of shade that cross the carpet from east to west; the two
// lowest transoms throw one bar down each side of the field, so the pool lies whole in one bright lozenge.
const MUL = { zc: 226.7, half: 105, bay: 130, post: 15, transom: 100, first: 65, tHalf: 5, south: 108 };   // south: the second light south of the centre one is this much wider, so that one lozenge of sun covers the whole south border, the gateway and the low pass
// where the shafts of lit haze land (hero-local x, z), their radius and strength: one through the centre light onto the
// pool, lesser ones through the lights beside it
const BEAMS = [[0, 0, 40, 0.8], [-60, -185, 28, 0.36], [40, 179, 28, 0.5], [-80, 259, 28, 0.45]];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------------------------------
// GLSL. One fragment shader for the room and everything in it; a material id picks the surface.
const VARY = /* glsl */`varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec2 vUv; varying vec2 vMat;`;
const PROP_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aMat; attribute float aSway;
uniform vec3 uOrigin; uniform float uTime;
${VARY}
#include <fog_pars_vertex>
void main(){
  vec3 P = (modelMatrix * vec4(position, 1.)).xyz - uOrigin;
  P += aSway * vec3(sin(uTime * 0.7 + P.z * 0.05) * 0.5, 0.5 + 0.5 * sin(uTime * 0.9 + P.x * 0.03), cos(uTime * 0.6 + P.x * 0.04) * 0.5);
  vP = P; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = aCol; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// the cat: breathing flank, an ear that flicks, a tail tip that twitches (and sweeps in the rare event)
const CAT_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aMat; attribute vec3 aAnim; attribute vec3 aSweep;
uniform vec3 uOrigin; uniform float uTime; uniform vec4 uTail; uniform float uShell;
${VARY}
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float br = sin(uTime * 2.1) * 0.8 + sin(uTime * 4.2 + 0.6) * 0.15;
  p += normal * aAnim.x * (1.5 + 1.5 * br);
  // fur: the same skin drawn again a little further out, combed back and down along the lie of the coat as it goes
  vec3 lie = vec3(-0.9, -0.7, 0.3); lie -= normal * dot(lie, normal) * 0.8;
  p += normal * uShell * 2.2 + lie * uShell * uShell * 1.2;
  float s = aAnim.y;
  float tip = smoothstep(0.5, 1., s);
  float tw = max(sin(uTime * 1.1) * sin(uTime * 2.7 + 1.3), 0.); tw *= tw;
  p.y += tip * tip * (3.5 + 13. * tw * (1. + uTail.w) + 3. * sin(uTime * 0.7));
  p.xz += uTail.xy * tip * tip * (5. * tw * sin(uTime * 6.1) + 2. * sin(uTime * 0.9));
  // the sweep (rare): the whole tail swings out behind the cat, lifted, over the west border, and lashes there
  float all = smoothstep(0.08, 1., s);
  p += aSweep * uTail.z + normal * (smoothstep(0.03, 0.3, s) * uTail.z * 8.);
  p.y += all * uTail.z * 5. * sin(uTime * 5. + s * 4.);
  p.z += all * uTail.z * 8. * sin(uTime * 3.1 + s * 3.);
  float fl = max(sin(uTime * 0.83 + 2.), 0.); fl = fl * fl * fl * fl * sin(uTime * 17.);
  p.x += aAnim.z * fl * 2.2; p.y -= aAnim.z * abs(fl) * 1.2;
  vec3 P = (modelMatrix * vec4(p, 1.)).xyz - uOrigin;
  vP = P; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = aCol; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// the fringe: one instanced tube bent into a loose arch in the vertex shader; a knot near the tip, two plies
const FRINGE_VERT = /* glsl */`
attribute vec4 aRoot;    // x, z, yaw, phase
attribute vec4 aShape;   // length, arch height, radius, tint
uniform vec3 uOrigin; uniform float uTime; uniform vec3 uIvory; uniform vec3 uCam;
${VARY}
#include <fog_pars_vertex>
vec3 cordC(float s){
  float L = aShape.x, H = aShape.y;
  vec2 d = vec2(sin(aRoot.z), cos(aRoot.z));
  float reach = L * (0.82 * s + 0.18 * s * s);
  float a = min(s / 0.8, 1.);
  float sn = max(sin(3.14159 * sqrt(a) * a), 0.);
  float arch = sn * sqrt(sn);
  float y = 1.4 * (1. - smoothstep(0., 0.4, s)) + H * 0.8 * arch + aShape.z * 2.;
  float wig = sin(s * 7. + aRoot.w * 6.283) * 1.3 * s * (1. - s) * 4. + sin(uTime * 0.8 + aRoot.w * 40. + s * 3.) * 0.9 * arch;
  vec2 side = vec2(d.y, -d.x);
  return vec3(aRoot.x + d.x * reach + side.x * wig, y, aRoot.y + d.y * reach + side.y * wig);
}
void main(){
  float s = position.y;
  vec3 c0 = cordC(s), c1 = cordC(s + 0.02);
  vec3 T = normalize(c1 - c0 + vec3(0., 0., 1e-5));
  vec3 Bn = normalize(cross(T, vec3(0., 1., 0.)) + vec3(1e-4, 0., 0.));
  vec3 Nn = cross(Bn, T);
  // a soft cord of two plies, as thick as a finger is to a hand: an overhand knot where it leaves the carpet, a second small one
  // near its end, and the end itself cut blunt and a little frayed (not drawn out to a point)
  float kn = (s - 0.07) / 0.035, kn2 = (s - 0.9) / 0.022;
  float th = uv.x * 6.28318;
  float rr = aShape.z * 2.15;
  float tw = s * aShape.x / max(rr, 0.05);
  float fray = smoothstep(0.93, 1., s);
  float rad = rr * (1. + 0.75 * exp(-kn * kn) + 0.4 * exp(-kn2 * kn2) + 0.3 * fray) * (1. - 0.55 * smoothstep(0.992, 1., s)) * (1. + 0.27 * sin(th * 2. + tw * 1.1) + 0.2 * fray * sin(th * 5. + aRoot.w * 30.));
  rad = max(rad, length(c0 - uCam) * 0.0008);   // far cords keep a pixel and a half of width
  vec3 n = Bn * position.x + Nn * position.z;
  vec3 P = c0 + n * rad;
  vP = P; vN = normalize(n + vec3(0., 1e-5, 0.)); vCol = uIvory * aShape.w; vUv = vec2(uv.x, tw * 0.5); vMat = vec2(4., 1.);
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// material ids
const M = { PLAIN: 0, WOOD: 1, FLOOR: 2, WALL: 3, CORD: 4, BRASS: 5, VELVET: 6, FUR: 7, SPIRAL: 8, HOLLOW: 9, GLASS: 10, DOOR: 11, CEIL: 12, PICTURE: 13, EMBER: 14, LAMP: 15, BOOK: 16, IRON: 17, PILE: 18 };
const roomFrag = (G) => /* glsl */`
${G.common}
${G.light}
uniform vec3 uCam;
uniform vec3 uWallA, uWallB, uPaint, uOak, uGlare, uFurDark;
uniform vec4 uRoom;     // ambient gain, tabby stripes, night, dust
uniform float uWallK;   // how much of the warm bounce and haze the walls keep (1 = all)
uniform float uShell;   // 0 = skin; above: a fur shell this far out (0..1)
uniform vec2 uGlowK;    // how hot the stove's coals glow, how bright the lantern burns
uniform vec3 uCordWarm; // the warm light of the room (lamp, stove, oak boards) that the pale cords of the fringe pick up
uniform vec4 uBlob[4];   // what stands on the boards (centre x, z, half sizes): the floor is dark under and close round it
${VARY}
#include <fog_pars_fragment>
float rmFbm(vec2 p){ return 0.57 * gcNoise(p) + 0.29 * gcNoise(p * 2.03 + 7.1) + 0.14 * gcNoise(p * 4.1 + 3.3); }
// light of the window seen along R from P (for polish on wood, floor, brass and glass)
vec3 rmWin(vec3 P, vec3 R, float rough){
  float t = (uWin.x - P.x) / max(R.x, 0.02);
  vec3 h = P + R * t;
  return uGlare * gcLattice(vec2(h.z, h.y), 1. + t * rough) * smoothstep(0.02, 0.2, R.x);
}
// a recessed panel: pd = distance from its centre, hf = half size of the sunk field; returns shade
float rmPanel(vec2 pd, vec2 sg, vec2 hf){
  vec2 e = pd - hf;
  float inset = max(e.x, e.y);
  float bev = smoothstep(-7., -1., inset) * (1. - smoothstep(0., 2.5, inset));
  float lit = e.x > e.y ? 0.16 * sg.x : -0.3 * sg.y;
  return (1. + bev * lit) * (1. - 0.1 * (1. - smoothstep(-7., 0., inset)));
}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
  float ndv = clamp(dot(N, V), 0., 1.);
  vec3 R = reflect(-V, N);
  float id = floor(vMat.x + 0.5), par = vMat.y;
  vec2 fwU = fwidth(vUv); float fwu = max(fwU.x, fwU.y);
  vec2 fwP2 = fwidth(vP.xz); float fwp = max(max(fwP2.x, fwP2.y), 1e-4);
  float fwS = fwidth(vUv.y * 0.55 + vUv.x * 3.);
  vec3 alb = vCol; float wrap = 0., rimK = 0., gloss = 0., rough = 0.06, sunK = 1., metal = 0., flatK = 0., hazeK = 0., poolK = 0., wallK = 0., polish = 0.; vec3 emis = vec3(0.); float cordK = 0.;
  if (id < 0.5) {
    alb *= 0.9 + 0.2 * gcNoise(vUv * 0.6) * (1. - smoothstep(0.5, 2., fwu));
  } else if (id < 1.5) {                                   // wood: grain along uv.y (metres); finer fibres and open pores come in as the pixel footprint shrinks
    float w1 = rmFbm(vUv * vec2(0.05, 0.012));
    float g = rmFbm(vec2(vUv.x * 1.1 + w1 * 6., vUv.y * 0.06));
    float ring = 0.5 + 0.5 * sin(vUv.x * 2.2 + w1 * 26. + g * 4.);
    float fA = 1. - smoothstep(0.14, 0.5, fwu), fB = 1. - smoothstep(0.05, 0.2, fwu);
    float f1 = gcNoise(vec2(vUv.x * 2.7 + w1 * 4., vUv.y * 0.24));
    float f2 = gcNoise(vec2(vUv.x * 7., vUv.y * 0.55));
    float pore = smoothstep(0.6, 0.86, gcNoise(vec2(vUv.x * 4.4 + 3. + w1 * 3., vUv.y * 0.13)));
    float k = (0.76 + 0.34 * g) * (0.86 + 0.22 * ring) * (1. + (f1 - 0.5) * 0.4 * fA) * (1. + (f2 - 0.5) * 0.24 * fB) * (1. - 0.32 * pore * fA);
    alb *= mix(0.9, k, 1. - smoothstep(0.3, 1.6, fwu));
    gloss = 0.5; rough = 0.1; polish = 0.32;
  } else if (id < 2.5) {                                   // oak floorboards 36 m wide, running north to south
    vec2 p = vP.xz;
    float bi = floor(p.x / 36. + 0.5), bf = fract(p.x / 36. + 0.5);
    float jz = p.y / 330. + gcHash(vec2(bi, 3.)) * 9.;
    float ji = floor(jz), jf = fract(jz);
    float tone = gcHash(vec2(bi, ji));
    vec3 oak = uOak * (0.8 + 0.36 * tone); flatK = 1.;
    oak = mix(oak, oak * vec3(1.1, 0.95, 0.8), gcHash(vec2(ji, bi + 5.)));
    float w1 = rmFbm(vec2(p.x * 0.03 + tone * 20., p.y * 0.004));
    float g = rmFbm(vec2(p.x * 0.5 + w1 * 14., p.y * 0.02 + tone * 9.));
    float ring = 0.5 + 0.5 * sin(p.x * 0.9 + w1 * 40. + tone * 6.);
    float pores = gcNoise(vec2(p.x * 5., p.y * 0.35));
    oak *= mix(0.9, (0.72 + 0.4 * g) * (0.84 + 0.24 * ring) * (0.86 + 0.28 * pores), 1. - smoothstep(0.25, 1.6, fwp));
    float dx = min(bf, 1. - bf) * 36., dz = min(jf, 1. - jf) * 330.;
    float aa = fwp * 1.2 + 0.05;
    float gap = max(1. - smoothstep(0.38, 0.38 + aa, dx), 1. - smoothstep(0.34, 0.34 + aa, dz));
    float thin = clamp(0.9 / aa, 0., 1.);
    oak *= 1. - 0.22 * smoothstep(3.2, 0.5, dx);
    float dn = rmFbm(p * 0.021 + 11.);
    float dust = smoothstep(5., 0.6, dx) * smoothstep(0.3, 0.7, dn) + 0.3 * smoothstep(0.5, 0.9, rmFbm(p * 0.006 + 3.));
    alb = mix(oak, mix(uPal[0], vec3(0.5), 0.5) * 0.62, clamp(dust, 0., 1.) * uRoom.w);
    alb *= 1. - 0.85 * gap * thin;
    vec2 lc = floor(p / 9.), lf = p - (lc + 0.5) * 9.; float lh = gcHash(lc + 17.);
    vec2 la = (vec2(lh, fract(lh * 13.7)) - 0.5) * 5.;
    vec2 ld = vec2(cos(lh * 31.), sin(lh * 31.)) * (1. + 2. * fract(lh * 5.3));
    float lint = (1. - smoothstep(0.07, 0.07 + aa, gcSeg(lf, la - ld, la + ld))) * step(0.6, lh) * clamp(0.2 / aa, 0., 1.);
    alb = mix(alb, uPal[0] * 0.8, lint * 0.45);
    // the carpet's edge and the fringe lying on the boards
    float dcar = max(abs(p.x) - 241., abs(p.y) - 390.);
    alb *= mix(0.45, 1., smoothstep(0., 11., dcar));
    for (int i = 0; i < 4; i++) {
      vec2 bd = abs(p - uBlob[i].xy) - uBlob[i].zw;
      float db = length(max(bd, 0.)) + min(max(bd.x, bd.y), 0.);
      alb *= mix(0.3, 1., smoothstep(-6., 30., db));
    }
    float inF = step(abs(p.x), 246.) * step(390., abs(p.y)) * (1. - smoothstep(416., 428., abs(p.y)));
    float streak = gcNoise(vec2(dot(p, vec2(0.316, -0.949)) * 0.8, dot(p, vec2(0.949, 0.316)) * 0.05));
    sunK *= mix(1., 0.5 + 0.5 * smoothstep(0.35, 0.7, streak), inF);
    gloss = 0.75 * (0.55 + 0.45 * tone) * (1. - 0.6 * clamp(dust, 0., 1.)); rough = 0.045;
  } else if (id < 3.5) {                                   // wall: paper above a panelled dado (uv = along, height)
    float h = vUv.y;
    float aa = fwu + 0.05;
    vec2 q = vUv / vec2(110., 160.); q.x += 0.5 * floor(q.y);
    vec2 f = fract(q) - 0.5;
    float og = abs(abs(f.x) - 0.25 * (1. + cos(f.y * 6.28318)));
    float line = 1. - smoothstep(0.05, 0.05 + aa / 110., og);
    float bud = 1. - smoothstep(0.11, 0.11 + aa / 110., abs(f.x) * 1.5 + abs(f.y));
    float leaf = 1. - smoothstep(0.06, 0.06 + aa / 110., abs(abs(f.x) + abs(abs(f.y) - 0.3) - 0.07));
    float fill = smoothstep(0., 0.06 + aa / 110., 0.25 * (1. + cos(f.y * 6.28318)) - abs(f.x));
    float pat = max(line * 0.85, max(bud, leaf * 0.7)) * clamp(26. / aa, 0., 1.);
    alb = vCol * mix(uWallA * (0.9 + 0.2 * fill), uWallB * 1.22, pat) * (0.9 + 0.2 * rmFbm(vUv * 0.012));
    // the wall thins into the haze toward the ceiling; on the far wall one soft pool of sun thrown back off the carpet
    wallK = 1.; hazeK = 0.62 * smoothstep(230., 800., h) * (0.5 + 0.5 * uWallK);
    float pwx = (vP.x + 60.) / 330., pwy = (h - 120.) / 250.;
    poolK = step(0.5, N.z) * exp(-pwx * pwx - pwy * pwy);
    alb *= 0.93 + 0.07 * step(0.5, fract(vUv.x / 55.)) * (1. - smoothstep(6., 40., aa));
    if (h < 300.) {
      float pf = fract(vUv.x / 180.) - 0.5;
      vec2 pc = vec2(pf * 180., h - 172.);
      float sh = rmPanel(abs(pc), sign(pc), vec2(64., 84.));
      float rail = smoothstep(280., 284., h);
      sh = mix(sh, 1.12 - 0.3 * smoothstep(290., 300., h), rail);
      alb = vCol * uPaint * sh * (0.94 + 0.12 * rmFbm(vUv * vec2(0.05, 0.4)));
      gloss = 0.25; rough = 0.2;
    }
  } else if (id < 4.5) {                                   // twisted wool cord: uv.x round it, uv.y along it in radii
    float s = vUv.y * 0.55 + vUv.x * 3.;
    float strand = abs(fract(s) - 0.5) * 2.;
    float fib = 0.8 + 0.4 * gcNoise(vec2(s * 22., vUv.y * 1.4 - vUv.x * 7.));
    alb *= mix(0.84, (0.66 + 0.34 * smoothstep(0., 0.75, strand)) * fib, 1. - smoothstep(0.35, 1.1, fwS));
    wrap = 0.3 + 0.2 * par; rimK = 0.3 + 0.5 * par; cordK = 1.;                // (par 1: the fringe, softer and fuzzier at its edge)
  } else if (id < 5.5) {                                   // brass
    alb *= 0.9 + 0.2 * gcNoise(vec2(vUv.x * 40., vUv.y * 2.));
    alb *= 1. - 0.35 * par * (0.5 + 0.5 * sin(vUv.y * 2.4)) * (1. - smoothstep(0.4, 1.4, fwu));
    metal = 1.; rough = 0.03;
  } else if (id < 6.5) {                                   // velvet, with gold embroidery where par > 0
    vec2 e = vUv / 7.; vec2 ef = fract(e) - 0.5;
    float aaE = fwu / 7. + 0.01;
    float dia = abs(ef.x) + abs(ef.y);
    float th = max(1. - smoothstep(0.045, 0.045 + aaE, abs(dia - 0.36)), 1. - smoothstep(0.09, 0.09 + aaE, length(ef)));
    th = max(th, (1. - smoothstep(0.03, 0.03 + aaE, abs(length(ef - vec2(0.18, 0.)) - 0.09))) * step(0.5, fract(floor(e.x) * 0.5 + floor(e.y) * 0.5) + 0.3));
    alb *= 0.86 + 0.28 * gcNoise(vUv * vec2(2.4, 0.35));
    alb = mix(alb, uPal[4] * 1.15, th * max(par, 0.) * clamp(0.06 / aaE, 0., 1.));
    wrap = 0.2; rimK = 0.8;
    if (par < -0.5) { flatK = 0.55; rimK = 0.3; }           // a hanging curtain: the light comes through the cloth
  } else if (id < 7.5) {                                   // fur: uv.x along the body, uv.y round it (metres)
    float cl = gcNoise(vUv * 0.33);
    float st = 0.86 + 0.28 * gcNoise(vec2(vUv.x * 1.1 + cl * 2., vUv.y * 2.3));
    // a tabby's bands run over the back: narrow, wandering, broken and forked
    float band = sin(vUv.x * 0.5 + vUv.y * 0.035 + 9. * gcNoise(vUv * vec2(0.034, 0.024)) + 1.5 * sin(vUv.y * 0.055));
    float stripe = smoothstep(0.35, 0.8, band) * (0.3 + 0.7 * smoothstep(0.3, 0.55, gcNoise(vUv * vec2(0.07, 0.1) + 4.)));
    alb = mix(alb, alb * uFurDark, stripe * uRoom.y * (1. - 0.6 * par));
    alb = mix(alb, alb * 1.5 + 0.08, par * 0.35);
    alb *= st * (0.85 + 0.3 * cl);
    wrap = 0.5; rimK = 1.2;
    if (uShell > 0.001) {
      // a shell of fur: tufts of hair that taper as the shells go out, paler toward their tips
      vec2 fc = vUv / 1.05; float fr = gcHash(floor(fc) + 3.7);
      float fd = length(fract(fc) - 0.5 - (vec2(fr, fract(fr * 13.3)) - 0.5) * 0.5);
      if (fd > 0.62 * (1. - uShell * (0.45 + 0.5 * fr))) discard;
      // toward the silhouette the shells are seen edge on, and tufts would show as rows of flat dashes: there each tuft is cut
      // into fine hairs (the same small dot kept from shell to shell, so the dots stack into a strand along the lie of the
      // coat), and fewer of them reach the outer shells: a soft halo of hairs of uneven length
      float graze = 1. - smoothstep(0.16, 0.5, ndv);
      vec2 hc = vUv / 0.4; float hr = gcHash(floor(hc) + 9.1);
      float hd = length(fract(hc) - 0.5 - (vec2(hr, fract(hr * 7.7)) - 0.5) * 0.3);
      if (hd > mix(0.9, 0.34 - 0.1 * uShell, graze) || hr < graze * (0.3 + 0.55 * uShell)) discard;
      alb *= 0.9 + 0.22 * uShell; rimK = 1.2 + 2. * uShell;
    } else alb *= 0.86;
  } else if (id < 8.5) {                                   // the roll's end: pile fringe on the inside, ivory foundation outside
    float fd = 1. - smoothstep(0.15, 0.6, fwU.x);
    float k = floor(vUv.x / 0.6), kf = fract(vUv.x / 0.6);
    float run = floor(vUv.x / 3.6 + 2. * gcNoise(vec2(vUv.x * 0.05, 1.)));
    float hs = gcHash(vec2(run, 5.));
    vec3 pile = hs < 0.22 ? uGround : hs < 0.4 ? uPal[1] : hs < 0.54 ? uPal[2] : hs < 0.7 ? uPal[4] : hs < 0.84 ? uBedC : uPal[3];
    float t = vUv.y;
    float slot = smoothstep(0.3, 0.5, abs(kf - 0.5)) * fd;
    vec3 pc = pile * mix(1.3, 0.55, smoothstep(0.0, 0.5, t)) * (1. - 0.55 * slot) * mix(1., 0.8 + 0.4 * gcHash(vec2(k, 1.)), fd);
    pc *= 0.85 + 0.45 * smoothstep(0.55, 1., sin(vUv.x * 0.045 - uTime * 0.6));   // the nap of the cut edge turning, turn after turn
    float bead = (0.88 + 0.12 * sin(t * 56.)) * (0.94 + 0.06 * sin(vUv.x * 10.47));
    vec3 fc = uPal[0] * 1.02 * mix(0.92, bead, fd) * (0.82 + 0.18 * smoothstep(0.5, 0.75, t));
    alb = mix(fc, pc, 1. - smoothstep(0.47, 0.53, t));
    wrap = 0.5;
  } else if (id < 9.5) {                                   // the hollow of the roll: no sun
    sunK = 0.;
    alb *= 0.8 + 0.4 * gcNoise(vUv * 0.5);
  } else if (id < 10.5) {                                  // tea in a glass
    float back = clamp(dot(-V, uSunDir) * 0.5 + 0.5, 0., 1.);
    alb *= 0.55 + 1.5 * back * back + 0.5 * pow(1. - ndv, 2.);
    gloss = 1.; rough = 0.02; wrap = 0.6;
  } else if (id < 11.5) {                                  // the door in the far wall (uv in metres)
    vec2 dq = vec2(abs(vUv.x - 120.), vUv.y);
    float row = dq.y < 250. ? 0. : (dq.y < 470. ? 1. : 2.);
    vec2 ctr = vec2(60., row < 0.5 ? 140. : (row < 1.5 ? 360. : 545.));
    vec2 hf = vec2(38., row < 0.5 ? 86. : (row < 1.5 ? 86. : 44.));
    vec2 pc = vec2(dq.x - ctr.x, dq.y - ctr.y);
    alb = vCol * uPaint * rmPanel(abs(pc), sign(pc), hf) * (0.94 + 0.12 * rmFbm(vUv * vec2(0.4, 0.05)));
    alb *= 1. - 0.5 * (1. - smoothstep(0., 2.5, abs(vUv.x - 120.) - 0.));
    gloss = 0.3; rough = 0.2;
  } else if (id < 12.5) {                                  // ceiling: joists
    alb *= 0.8 + 0.2 * smoothstep(0.4, 0.5, abs(fract(vUv.x / 150.) - 0.5));
  } else if (id < 13.5) {                                  // the picture on the far wall: a small landscape in the carpet's dyes
    vec2 q = vUv;
    vec3 skyc = mix(uPal[0] * 1.1, uPal[3], smoothstep(0.35, 1., q.y));
    float h1 = 0.42 + 0.14 * gcNoise(vec2(q.x * 3., 1.));
    float h2 = 0.28 + 0.12 * gcNoise(vec2(q.x * 5. + 3., 4.));
    alb = mix(skyc, mix(uPal[3], uPal[2], 0.5), 1. - smoothstep(-0.01, 0.01, q.y - h1));
    alb = mix(alb, uPal[5] * 0.85, 1. - smoothstep(-0.01, 0.01, q.y - h2));
    alb = mix(alb, uPal[4] * 1.1, 1. - smoothstep(0.05, 0.06, length((q - vec2(0.68, 0.74)) * vec2(1.45, 1.))));
    alb = mix(alb, uPal[1], 1. - smoothstep(0., 0.012, abs(q.y - 0.15 - 0.035 * sin(q.x * 9.)) - 0.03));
    alb = mix(uPal[0] * 1.08, alb, step(0.07, min(min(q.x, 1. - q.x) * 1.47, min(q.y, 1. - q.y))));
  } else if (id < 14.5) {                                  // the stove's door: coals behind mica panes in iron glazing bars (uv in panes)
    vec2 gf = abs(fract(vUv) - 0.5);
    float bar = smoothstep(0.37, 0.45, max(gf.x, gf.y));
    float h = clamp(vUv.y / 3., 0., 1.);
    float fl = 0.5 * gcNoise(vec2(vUv.x * 2.3 + uTime * 0.7, vUv.y * 1.7 - uTime * 1.9)) + 0.5 * gcNoise(vec2(vUv.x * 5.1 - uTime * 1.1, vUv.y * 3.3 - uTime * 3.1));
    float coal = smoothstep(0.75, 0.1, h) * (0.6 + 0.4 * gcNoise(vUv * 6. + floor(uTime * 0.5)));
    float flame = smoothstep(0.25, 0.75, fl + 0.35 - h * 0.6);
    emis = vCol * uGlowK.x * (1. - bar) * (0.2 + 1.1 * coal + 0.9 * flame * vec3(1., 1.35, 1.8));
    alb = vec3(0.012); gloss = 0.5; rough = 0.2;
  } else if (id < 15.5) {                                  // the lantern's glass: uv.y = 0 at the burner, 1 at the cap. A small flame behind dark, clear glass
    float fl = 0.86 + 0.1 * sin(uTime * 9. + 2. * sin(uTime * 3.7)) + 0.04 * sin(uTime * 23.);
    float sway = 0.03 * sin(uTime * 5.3) + 0.02 * sin(uTime * 11.);
    float cy = (vUv.y - 0.27 - 0.04 * fl) / 0.15;
    float n6 = ndv * ndv * ndv; n6 *= n6;
    float tip = clamp(1.2 - cy * 0.5, 0.3, 1.6);                     // the flame narrows upward
    float flame = exp(-cy * cy) * clamp(n6 * n6 * tip + sway * cy, 0., 1.);
    float halo = exp(-cy * cy * 0.22) * ndv * ndv;
    emis = uGlowK.y * fl * (vCol * (0.06 + 0.3 * halo + 4.6 * flame) + vec3(2.2, 1.6, 0.7) * flame * flame);
    alb *= 0.1; gloss = 1.; rough = 0.02;
  } else if (id < 16.5) {                                  // a book's spine: gilt bands and a label (uv 0..1 on each face)
    float bands = step(abs(vUv.y - 0.84), 0.02) + step(abs(vUv.y - 0.2), 0.02) + step(abs(vUv.y - 0.13), 0.012);
    float lab = step(abs(vUv.y - 0.64), 0.07) * step(abs(vUv.x - 0.5), 0.36) * step(0.45, par);
    float fadeB = 1. - smoothstep(0.02, 0.07, fwu);
    alb *= 0.84 + 0.3 * gcNoise(vUv * vec2(3., 40.) + par * 30.);
    alb = mix(alb, uPal[4] * 0.95, clamp(bands, 0., 1.) * 0.85 * fadeB);
    alb = mix(alb, uPal[0] * 0.85, lab * 0.8 * fadeB);
    gloss = 0.2; rough = 0.15;
  } else if (id < 17.5) {                                  // cast iron, blackleaded: a dull sheen
    alb *= 0.75 + 0.5 * gcNoise(vUv * 0.3);
    gloss = 1.; rough = 0.3; rimK = 0.6;
  } else {                                                 // knotted pile on the things that stand up out of the carpet: uv in metres, a knot 1.2 m; par picks the design
    vec2 kq = vUv / 1.2; vec2 kc = floor(kq), kf = fract(kq) - 0.5;
    vec2 cc = (kc + 0.5) * 1.2;
    float fadeK = 1. - smoothstep(0.3, 0.9, fwu);
    vec3 pI = uPal[0], pM = uPal[1], pN = uPal[2], pS = uPal[4], pG = uPal[5];
    if (par < 0.5) {                                       // a cypress: feathers of indigo and sage in columns, a saffron seam between them, a saffron hem
      float lx = abs(mod(cc.x + 0.6, 9.6) - 4.8);
      float chev = fract((cc.y - lx * 1.3) / 4.8);
      float fe = step(0.3, abs(chev - 0.5));
      vec3 body = mix(mix(pN * 0.95, mix(pN, uPal[3], 0.22), uWinter), mix(pG, pN, 0.35), uNight);
      vec3 feather = mix(mix(pG * 1.1, mix(pG, uPal[3], 0.55) * 1.2, uWinter), mix(pG, pI, 0.4), uNight);
      alb = mix(body, feather, fe * (1. - smoothstep(0.5, 1.6, fwu) * 0.5));
      alb = mix(alb, pM * 1.15, uWinter * step(0.86, gcHash(kc + 7.)) * (1. - fe) * fadeK);          // winter: madder berries, a knot here and there
      alb = mix(alb, pS, max(step(4.5, lx), step(cc.y, 3.6) * step(2.4, cc.y)));
    } else if (par < 1.5) {                                // the fountain's basin: rings of the rosette's dyes, scalloped
      float ring = floor(cc.y / 2.4), sc = step(0.5, fract(cc.x / 7.2 + 0.5 * mod(ring, 2.)));
      float rm = mod(ring, 4.);
      alb = rm < 0.5 ? pM : rm < 1.5 ? mix(pI, pS, sc) : rm < 2.5 ? mix(pN, pM, sc) : pI;
    }
    alb *= mix(1., 0.9 + 0.2 * gcHash(kc + 3.), fadeK);
    float tuftEdge = max(abs(kf.x), abs(kf.y));
    if (uShell > 0.001) {
      if (tuftEdge > mix(0.6, 0.47 - 0.19 * uShell, fadeK)) discard;
      alb *= mix(1., (0.55 + 0.6 * uShell) * (0.85 + 0.3 * gcNoise(vUv * 9.)), fadeK);
    } else alb *= mix(0.85, 0.34, fadeK);
    wrap = 0.35; rimK = 0.7;
  }
  float sun = gcSun(vP) * sunK;
  float ndl = mix(clamp((dot(N, uSunDir) + wrap) / (1. + wrap), 0., 1.), 0.8, flatK);
  float up = 0.5 + 0.5 * N.y;
  // sky light enters by the window wall and dies toward the corners and the ceiling
  float open = (0.62 + 0.38 * N.x) * mix(0.42, 1., smoothstep(-640., 560., vP.x)) * mix(1., 0.35, smoothstep(220., 840., vP.y));
  float wk = mix(1., uWallK, wallK);
  vec3 amb = (uSkyCol * (0.25 + 0.6 * up) * open * 1.3 * (0.4 + 0.6 * wk) + uBounceCol * (0.75 - 0.6 * up) * wk * mix(1. + 0.9 * wallK, 0.45 - 0.2 * wallK, smoothstep(40., 520., vP.y))) * gAO * uRoom.x;
  vec3 warm = gcWarm(vP, N) * gAO;
  vec3 c = alb * (uSunCol * sun * ndl + amb + warm + uCordWarm * cordK * (0.45 + 0.55 * ndl) * gAO + uSunCol * (uGround * 1.6 + 0.2) * poolK * 0.75 * wk);
  float rim = 1. - ndv; rim = rim * rim * rim;
  c += alb * rimK * rim * (amb * 1.5 + uSunCol * sun * 0.45);
  float F = 0.04 + 0.96 * rim * (1. - ndv);
  vec3 wl = rmWin(vP, R, rough);
  float sd = max(dot(R, uSunDir), 0.); sd *= sd; sd *= sd; sd *= sd;
  c += gloss * F * wl + gloss * uSunCol * sun * sd * sd * 0.5;
  if (metal > 0.5) {
    vec3 env = mix(uBounceCol * 1.5, uSkyCol * 1.5 * open, smoothstep(-0.3, 0.5, R.y)) * gAO * uRoom.x + wl * 0.5;
    c = alb * (env * 0.95 + uSunCol * sun * (0.2 * ndl + 1.6 * sd * sd) + warm * 0.6 + gcWarm(vP, R) * 1.3);
  }
  c += gloss * F * gcWarm(vP, R) * 2.;
  c += (alb * 1.6 + 0.02) * polish * gcWarm(vP, R) * gAO;       // polish: turned rings and edges catch the stove and the lantern
  c += emis;
  #ifdef USE_FOG
    c = mix(c, fogColor * 1.5, hazeK);
  #endif
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// the lattice window: the sky and a glimpse of garden behind the same bars and branch that cut the light
const WINDOW_VERT = /* glsl */`
uniform vec3 uOrigin; varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vP = (modelMatrix * vec4(position, 1.)).xyz - uOrigin;
  vec4 mvPosition = viewMatrix * vec4(vP + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const windowFrag = (G) => /* glsl */`
${G.common}
${G.light}
uniform vec3 uCam, uSkyLo, uSkyHi, uHedge, uLeaf, uBar, uGlow;
uniform vec4 uOut;      // snow, stars, hedge height, sun glow
varying vec3 vP;
#include <fog_pars_fragment>
void main(){
  vec2 w = vec2(vP.z, vP.y);
  vec2 fw = fwidth(w); float aa = max(max(fw.x, fw.y), 1e-3);
  gcLattice(w, aa * 0.7 + 0.2);
  float bars = gBars, dbr = gBrD;
  float v = clamp((w.y - uWin2.x) / max(uWin2.y - uWin2.x, 1.), 0., 1.);
  vec3 sky = mix(uSkyLo, uSkyHi, smoothstep(0.05, 0.85, v));
  // stars before dawn
  vec2 sc = floor(w / 13.); float sh = gcHash(sc);
  float star = step(0.93, sh) * (1. - smoothstep(0.8, 2.2, length(w - (sc + 0.5) * 13.) / max(aa, 0.6)));
  sky += uOut.y * star * (0.6 + 0.4 * sin(uTime * (1. + sh * 3.) + sh * 40.)) * vec3(0.9, 0.95, 1.2) * smoothstep(0.2, 0.6, v);
  // a far hedge and nearer shrubs, soft, stirring
  float h1 = uOut.z * (0.16 + 0.07 * gcNoise(vec2(w.x * 0.006, 2.)) + 0.02 * gcNoise(vec2(w.x * 0.05, 5.)));
  float h2 = uOut.z * (0.07 + 0.09 * gcNoise(vec2(w.x * 0.013 + 0.06 * sin(uTime * 0.5 + w.x * 0.01), 9.)));
  sky = mix(sky, mix(uHedge, uSkyLo, 0.55), 1. - smoothstep(-0.02, 0.03, v - h1));
  sky = mix(sky, uHedge, 1. - smoothstep(-0.012, 0.02, v - h2));
  // the branch: a soft swaying silhouette with paler leaves at its edge
  float sil = 1. - smoothstep(-5., 5. + aa, dbr);
  vec3 lf = mix(uLeaf, uLeaf * 2.2 + uSkyLo * 0.1, smoothstep(-9., 2., dbr) * gcNoise(w * 0.12));
  sky = mix(sky, lf, sil * 0.94);
  // snow falling beyond the lattice
  vec2 sp = vec2(w.x + 6. * sin(uTime * 0.4 + w.y * 0.02), w.y + uTime * 7.);
  vec2 si = floor(sp / 17.); vec2 so = (vec2(gcHash(si + 3.), gcHash(si + 11.)) - 0.5) * 11.;
  float fl = 1. - smoothstep(0.9, 1.9 + aa, length(sp - (si + 0.5) * 17. - so));
  sky = mix(sky, vec3(1.9, 1.95, 2.1) * max(uSkyHi.b, 0.4), fl * uOut.x * 0.8);
  // the sun (or the moon) low behind the bars
  vec3 d = normalize(vP - uCam + vec3(1e-4, 0., 0.));
  float sd = max(dot(d, uSunDir), 0.);
  float s8 = sd * sd; s8 *= s8; s8 *= s8; float s64 = s8 * s8; s64 *= s64; s64 *= s64;
  sky += uGlow * uOut.w * (0.5 * s8 * s8 + 5. * s64 * s64 * s64);
  // bars: dark wood, a thread of light on their edges
  float edge = bars * (1. - bars) * 4.;
  vec3 bar = uBar * (uBounceCol * 0.9 + uSkyCol * 0.25) + sky * 0.1 * edge;
  vec3 c = mix(bar, sky, bars);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// the shafts of lit haze: where the sun comes clear through a light of the window it hangs in the dust as a soft round
// beam that lands in its lozenge on the wool. rmBeam(P): how deep P stands in the beams (0..1 and a little over).
const BEAM = /* glsl */`
#define NBEAM 4
uniform vec4 uBeam[NBEAM];   // where each shaft lands (hero-local x, z), its radius, its strength
float rmBeam(vec3 P){
  float s = 0.;
  for (int i = 0; i < NBEAM; i++) {
    vec3 d = P - vec3(uBeam[i].x, 0., uBeam[i].y);
    vec3 q = d - uSunDir * dot(d, uSunDir);
    s += uBeam[i].w * exp(-dot(q, q) / max(uBeam[i].z * uBeam[i].z, 1.));
  }
  return s;
}`;
// each shaft is one ribbon along the sun's ray that turns about that ray to face the eye; across it a gaussian (the
// column of lit dust through a round beam), so it has no edge, no sheets and no streaks
const shaftVert = (G) => /* glsl */`
${G.common}
attribute vec4 aBeam;
uniform vec3 uOrigin, uCamW;
varying vec3 vP; varying vec4 vB;
void main(){
  float R = aBeam.z;
  float len = (uWin.x - aBeam.x) / max(uSunDir.x, 0.05);
  float s = mix(-3. * R, len, position.y);
  vec3 c = vec3(aBeam.x, 0., aBeam.y) + uSunDir * s;
  vec3 sideV = normalize(cross(uSunDir, uCamW - uOrigin - c) + vec3(0., 1e-4, 0.));
  vec3 P = c + sideV * (position.x * R * 2.3);
  vP = P; vB = vec4(position.x, s, aBeam.w, R);
  gl_Position = projectionMatrix * viewMatrix * vec4(P + uOrigin, 1.);
}`;
const shaftFrag = (G) => /* glsl */`
${G.common}
uniform float uShaft, uFogD; uniform vec3 uOrigin, uCamW;
varying vec3 vP; varying vec4 vB;
void main(){
  vec3 toP = vP - (uCamW - uOrigin);
  float dist = length(toP);
  vec3 V = toP / max(dist, 1e-3);
  float sn = max(length(cross(V, uSunDir)), 0.62);
  float a = exp(-vB.x * vB.x * 5.3) / sn;
  a *= smoothstep(14., 14. + 3.4 * vB.w, vP.y);                  // it thins out well above the wool, so what it lands on (and the cat and the roll behind it) stays clear
  a *= 1. - smoothstep(uWin.x - 190., uWin.x - 20., vP.x);       // and into the glare of the window
  a *= smoothstep(60., 300., dist);                              // and thins toward the eye, so it never lies on the lens as a veil
  float n = 0.6 + 0.52 * gcNoise(vec2(vB.y * 0.011 - uTime * 0.035, vB.x * 1.3 + uTime * 0.02)) + 0.16 * gcNoise(vec2(vB.y * 0.045 + uTime * 0.05, vB.x * 3.1 - uTime * 0.03));
  float ff = exp(-uFogD * uFogD * dist * dist);
  gl_FragColor = vec4(uSunCol * (a * n * vB.z * uShaft * ff), 1.);
}`;
// lint motes: a box of slow specks that wraps round the camera; they light up where the lattice lets the sun through
const moteVert = (G) => /* glsl */`
${G.common}
${G.light}
${BEAM}
attribute vec4 aSeed;
uniform vec3 uOrigin, uCamW;
varying vec2 vQ; varying vec3 vC;
void main(){
  vec3 box = vec3(190., 90., 190.);
  float k = aSeed.w;
  vec3 base = aSeed.xyz * box + vec3(sin(uTime * 0.11 + k * 6.) * 7. - uTime * 0.5, sin(uTime * 0.17 + k * 31.) * 4. - uTime * 0.3 * (0.4 + k), cos(uTime * 0.09 + k * 9.) * 7.);
  vec3 rel = mod(base - uCamW + 0.5 * box, box) - 0.5 * box;
  vec3 Pw = uCamW + rel;
  vec3 P = Pw - uOrigin;
  float dist = length(rel);
  float sz = mix(0.05, 0.17, fract(k * 7.3));
  float szA = max(sz, dist * 0.0013);
  float e = sz / szA; e *= e;
  float lit = gcLat(P);
  float tw = 0.35 + 0.65 * abs(sin(uTime * (0.5 + k) + aSeed.x * 40.));
  float fade = smoothstep(5., 22., dist) * (1. - smoothstep(0.4 * box.x, 0.5 * box.x, dist)) * step(3.4, P.y) * step(abs(P.x), 640.);
  vC = (uSunCol * lit * (0.45 + 2.6 * min(rmBeam(P), 1.2)) + uSkyCol * 0.08) * tw * e * fade;
  float a = uTime * (0.3 + k) + k * 20.;
  vec2 q = position.xy;
  vec2 r = vec2(q.x * cos(a) - q.y * sin(a), q.x * sin(a) + q.y * cos(a));
  vQ = q;
  vec4 mv = viewMatrix * vec4(Pw, 1.);
  mv.xy += r * szA * vec2(2.4, 1.);
  gl_Position = projectionMatrix * mv;
}`;
const MOTE_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vC;
void main(){
  float d = dot(vQ, vQ);
  float a = max(1. - d, 0.); a *= a;
  gl_FragColor = vec4(vC * a, 1.);
}`;
// rare: the crest of the wave of pile. Where the front passes, the pile is thrown up and turned over in a ridge of pale wool
// that runs the whole length of the carpet, leaning the way the wave runs (a ribbon bent over the front in the vertex shader)
const crestVert = (G) => /* glsl */`
${G.common}
uniform float uShell;   // 0 = the ridge itself; above: a shell of loose tufts this far out (0..1)
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying vec2 vK;
#include <fog_pars_vertex>
void main(){
  float a = uv.x, z = position.z;
  float n1 = gcNoise(vec2(z * 0.045, uTime * 0.6)), n2 = gcNoise(vec2(z * 0.19 + 7., uTime * 1.3));
  float n3 = gcNoise(vec2(z * 0.61 + 3., uTime * 0.9));                      // the top is ragged: tufts thrown up unevenly
  float W = 20. + 6. * n1;
  float x = uWave.x + 3. + (a - 0.5) * W + (n1 - 0.5) * 9.;
  float endK = 1. - smoothstep(372., 389., abs(z));
  float H = uWave.w * endK * (7.5 + 5.5 * n1 + 2.5 * n2) * (0.84 + 0.32 * n3) * (1. - smoothstep(228., 239., abs(x)));
  float sn = max(sin(a * 3.14159), 0.);
  float h = H * sn * sqrt(sn), dh = H * 1.5 * sqrt(sn) * cos(a * 3.14159) * 3.14159;
  vec3 P = vec3(x + h * 0.55, 0.3 + 2.4 * uWave.w * endK + gcWaveLift(x) + gcLift(vec2(x, z)) + h, z);
  vec3 Nn = normalize(vec3(-dh, W + 0.55 * dh, 0.) + vec3(0., 1e-4, 0.));
  P += Nn * (uShell * 1.7 * uWave.w * endK);
  vP = P; vN = Nn; vUv = vec2(a, sn); vK = vec2(z, a * W) / 1.2;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const crestFrag = (G) => /* glsl */`
${G.common}
${G.light}
${G.nap}
${G.dye}
uniform float uShell;
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying vec2 vK;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) N = -N;
  vec2 fw2 = fwidth(vP.xz); float fwm = max(max(fw2.x, fw2.y), 1e-4);
  vec2 fwk2 = fwidth(vK); float fwk = max(max(fwk2.x, fwk2.y), 1e-4);
  float fine = 1. - smoothstep(0.3, 0.8, fwk);                 // 1 where the tufts of the ridge can be told apart
  vec2 kc = floor(vK), kf = fract(vK) - 0.5;
  float hk = gcHash(kc + 11.3);
  // the outer shells: loose tufts of turned pile standing out of the ridge, fewer and thinner the further out
  float te = max(abs(kf.x), abs(kf.y));
  if (uShell > 0.001 && (te > mix(0.6, 0.47 - 0.2 * uShell, fine) || hk < uShell * 0.5 * fine)) discard;
  vec2 q = mix((floor(vP.xz / 0.6) + 0.5) * 0.6, vP.xz, smoothstep(0.2, 0.38, fwm));
  gW = max(0.3, fwm * 1.6);
  vec4 dye = gcDye(q, uTime);
  // the rug's own pattern is carried up the ridge: whole on its dark lee side (the west, behind the front), washed toward
  // ivory on the face that has turned over to the sun, and palest along the top, where the pile shows its silky sides
  float front = smoothstep(0.44, 0.62, vUv.x), top = smoothstep(0.9, 1., vUv.y) * (1. - 0.6 * (1. - smoothstep(0.3, 0.5, vUv.x)));
  vec3 alb = mix(dye.rgb, uPal[0] * 1.1, max(mix(0.03, 0.3, front), 0.8 * top));
  // fibres combed over the ridge, and each tuft its own value
  float fib = 0.62 + 0.76 * gcNoise(vec2(vP.z * 2.6, vUv.x * 9.)) ;
  float streak = mix(0.95, fib * (0.8 + 0.4 * hk), fine) * (0.86 + 0.28 * gcNoise(vec2(vP.z * 0.23, vUv.x * 3. + 2.)));
  float tuftK = uShell > 0.001 ? mix(1., 0.72 + 0.5 * uShell, fine) : mix(1., 0.55 + 0.3 * smoothstep(0.5, 0.2, te), fine);   // dark roots between the tufts, paler tips
  float sun = gcSun(vP);
  float ndl = clamp(dot(N, uSunDir) * 0.8 + 0.34, 0., 1.);
  float up = 0.5 + 0.5 * N.y;
  vec3 amb = (uSkyCol * (0.3 + 0.6 * up) + uBounceCol * (0.7 - 0.5 * up)) * uAmbTint;
  vec3 c = alb * streak * tuftK * (uSunCol * sun * ndl * 1.2 + amb * gAO * mix(0.62, 1., max(front, top)) + gcWarm(vP, N));
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// steam over the tea glass: a few upright sheets with a scrolling wisp
const STEAM_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const steamFrag = (G) => /* glsl */`
${G.common}
${G.light}
uniform vec3 uOrigin2; varying vec2 vUv; varying vec3 vP;
void main(){
  float t = uTime * 0.16;
  float wob = (gcNoise(vec2(vUv.y * 3. - t * 2., vP.z * 0.05)) - 0.5) * 0.5 * vUv.y;
  float x = vUv.x - 0.5 + wob;
  float n = gcNoise(vec2(x * 5. + 3., vUv.y * 4. - t * 5.)) * 0.6 + gcNoise(vec2(x * 11., vUv.y * 9. - t * 8.)) * 0.4;
  float body = (1. - smoothstep(0.05, 0.16 + 0.22 * vUv.y, abs(x))) * smoothstep(0., 0.08, vUv.y) * (1. - smoothstep(0.45, 1., vUv.y));
  float a = body * smoothstep(0.3, 0.75, n) * 0.5;
  vec3 c = (uSunCol * gcLat(vP + uOrigin2) * 0.8 + uSkyCol * 0.5) * a;
  gl_FragColor = vec4(c, 1.);
}`;

// ---------------------------------------------------------------------------------------------------
// THE RISING GARDEN (u 0.25-0.79): in mid-flight the woven garden stands up out of the pile. Everything below is built in
// build(), lies flat and hidden until its moment, and is only moved, shown and hidden in update().
// NGO: how many things rise on their own (16 cypresses, 24 blossoming trees, the fountain's basin, the flower beds)
const NGO = 44;
// knotted pile on a smooth body (cypress spindles, trunks, the basin): the same fragment shader as the room (material PILE),
// drawn once as the skin and again as shells pushed out along the normal, each shell cut into blunt square tufts on the
// knot grid of the uv. aAnim = foot x, foot z, index into uRise.
const GARDEN_VERT = /* glsl */`
#define NGO ${NGO}
attribute vec3 aCol; attribute vec2 aMat; attribute vec3 aAnim;
uniform vec3 uOrigin; uniform float uTime; uniform float uShell; uniform float uRise[NGO]; uniform vec4 uWave;
${VARY}
#include <fog_pars_vertex>
void main(){
  float r = uRise[int(aAnim.z + 0.5)];
  vec3 l = position - vec3(aAnim.x, 0., aAnim.y);
  float sx = mix(0.3, 1., smoothstep(0., 0.7, r));
  vec3 P = vec3(aAnim.x + l.x * sx, l.y * r, aAnim.y + l.z * sx);
  P += normal * (uShell * 1.3 * min(r, 1.));
  float sw = l.y * l.y * 0.00022 * min(r, 1.);
  P.x += sw * sin(uTime * 0.8 + aAnim.x * 0.05); P.z += sw * cos(uTime * 0.65 + aAnim.y * 0.04);
  float wq = (aAnim.x - uWave.x) / max(uWave.z, 1.);
  float wg = uWave.w * uWave.y * exp(-wq * wq * 2.2);             // the garden rides the rare wave of pile:
  P.x += P.y * wg * wq * 0.15;                                    // each tree tips away from the front as it comes, and back as it goes,
  P.y += wg * (1. + 0.25 * min(r, 1.));                           // and is heaved up on its crest
  vP = P; vN = normalize(normal + vec3(0., 1e-5, 0.)); vCol = aCol; vUv = uv; vMat = aMat;
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// wool pom-poms (leaves, blossoms, the flowers of the beds): camera-facing discs shaded and depth-written as balls
const pomVert = (G) => /* glsl */`
#define NGO ${NGO}
${G.common}
${G.light}
attribute vec4 aFoot;   // foot x, foot z, index into uRise, kind (0 leaf, 1 blossom, 2 bed flower, 3 lamp, 4 a tuft of the gate's edge, 5 a lamp standing on a stem)
attribute vec4 aOff;    // offset from the foot when fully risen, radius
attribute vec4 aTint;   // colour, seed
attribute vec4 aCN;     // the direction this ball faces in its crown, how open it is (ao)
uniform vec3 uOrigin; uniform float uRise[NGO]; uniform vec3 uBloomA, uBloomB; uniform float uLampK;
varying vec2 vQ; varying vec3 vC; varying vec4 vL; varying vec3 vView; varying vec4 vS; varying vec3 vWarm; varying vec4 vZW;
#include <fog_pars_vertex>
void main(){
  float r = uRise[int(aFoot.z + 0.5)];
  float kind = aFoot.w, seed = aTint.w;
  float gateK = step(3.5, kind) * step(kind, 4.5);               // a tuft on the edge of the border gate: it rises with the arch, straight up
  float stemK = step(4.5, kind);                                 // a standing lamp: its card is drawn out downward for the stem, like a bed flower's
  float sx = mix(mix(0.3, 1., smoothstep(0., 0.7, r)), 1., gateK);
  vec3 C = vec3(aFoot.x + aOff.x * sx, aOff.y * r, aFoot.y + aOff.z * sx);
  float bed = step(1.5, kind) * step(kind, 2.5);
  float wqp = (aFoot.x - uWave.x) / max(uWave.z, 1.), wgp = gcWaveLift(aFoot.x);
  C.x += C.y * wgp * wqp * 0.15;
  C.y += bed * (gcLift(aFoot.xy) + 2.4) + wgp * (1. + 0.25 * min(r, 1.) * (1. - bed));
  float sw = aOff.y * aOff.y * 0.00022 * min(r, 1.) * (1. - gateK);
  C.x += sw * sin(uTime * 0.8 + aFoot.x * 0.05) + 0.3 * min(r, 1.) * sin(uTime * 1.3 + seed * 40.);
  C.z += sw * cos(uTime * 0.65 + aFoot.y * 0.04) + 0.3 * min(r, 1.) * cos(uTime * 1.1 + seed * 23.);
  float R = aOff.w * smoothstep(0.03, 0.6, r) * mix(1., smoothstep(0.25, 1., r), bed);
  // blossoms open and close in four stepped frames, a few at a time, as the woven ones do
  float fr = 3.;
  vec3 col = aTint.rgb;
  if (kind > 0.5 && kind < 1.5) {
    float tri = 1. - abs(2. * fract(uTime * 0.05 + seed) - 1.);
    fr = floor(clamp((tri - 0.1) / 0.7, 0., 0.999) * 4.);
    R *= 0.62 + 0.13 * fr;
    col = mix(uBloomA, uBloomB, max(step(1.5, fr), step(0.5, fract(seed * 5.3))) * step(0.3, fract(seed * 7.7)));
  }
  vec4 mvPosition = viewMatrix * vec4(C + uOrigin, 1.);
  vView = vec3(mvPosition.xyz);
  // a flower of the beds stands on a stem: its card is drawn out downward to the bed
  vec2 pq = vec2(position.x, position.y * mix(1., 2.7, max(bed, stemK * 0.93) * step(position.y, 0.)));
  mvPosition.xy += pq * R;
  gl_Position = projectionMatrix * mvPosition;
  vec4 c0 = projectionMatrix * vec4(vView, 1.), c1 = projectionMatrix * vec4(vView + vec3(0., 0., R * 0.85), 1.);
  vZW = vec4(c0.zw, c1.zw);
  vQ = pq;
  float sun = gcSun(C);
  vL = vec4(sun, gAO * aCN.w, clamp(dot(aCN.xyz, uSunDir) * 0.6 + 0.5, 0., 1.), R);
  vC = col; vS = vec4(seed, kind, fr, step(2.5, kind) * uLampK);
  vWarm = gcWarm(C, normalize(aCN.xyz + vec3(0., 0.4, 0.)));
  #include <fog_vertex>
}`;
const pomFrag = (G) => /* glsl */`
${G.common}
uniform vec3 uHeart;
varying vec2 vQ; varying vec3 vC; varying vec4 vL; varying vec3 vView; varying vec4 vS; varying vec3 vWarm; varying vec4 vZW;
#include <fog_pars_fragment>
void main(){
  float seed = vS.x, kind = vS.y;
  float rho = sqrt(max(dot(vQ, vQ), 1e-6));
  vec2 dq = vQ / rho;
  float fwq = fwidth(vQ.x) + fwidth(vQ.y);
  float isBed = step(1.5, kind) * step(kind, 2.5), isLamp = max(step(2.5, kind) * step(kind, 3.5), step(4.5, kind));
  if (isLamp > 0.5) {
    // a woven lamp of the night garden: a rosette of glowing knots, a saffron heart and stepped rings, that swells and
    // shrinks a knot at a time (five steps in three seconds)
    float snapL = 1. - smoothstep(0.1, 0.22, fwq);
    float KN = kind > 4.5 ? 6.5 : 4.5;                              // a standing lamp is seen from further off: more knots, a rounder ring
    vec2 kq = mix(vQ, (floor(vQ * KN) + 0.5) / KN, snapL);
    float rk = length(kq);
    float tri = abs(mod(floor(uTime * 1.6 + seed * 8.), 4.) - 2.);
    if (rk > 0.94 - 0.22 * tri) {
      // the stem of a standing lamp: plied saffron wool, lit from above by its own ring
      if (kind < 4.5 || vQ.y > -0.3 || abs(vQ.x + 0.02 * sin(vQ.y * 9. + seed * 20.)) > 0.085) discard;
      vec3 sc = mix(uPal[6], uPal[4], 0.45) * (0.75 + 0.5 * step(0.5, fract(vQ.y * 5.5 + vQ.x * 4.)));
      vec3 cst = sc * ((uSkyCol * 0.7 + uBounceCol * 0.45) * vL.y + vWarm * vL.y + uPal[4] * 1.1 * vS.w * smoothstep(-2.4, -0.7, vQ.y));
      gl_FragColor = vec4(cst, 1.);
      gl_FragDepth = clamp(vZW.x / max(vZW.y, 1e-4) * 0.5 + 0.5, 0., 1.);
      #include <fog_fragment>
      return;
    }
    float ring = floor(rk * 4.5 + 0.5);
    vec2 kf = abs(fract(vQ * KN) - 0.5);
    if (kind > 4.5 && snapL > 0.5 && dot(kf, kf) > 0.235) discard;   // a standing lamp's knots are round tufts, with the night between them
    float groove = mix(1., 1. - 0.5 * smoothstep(0.34, 0.5, max(kf.x, kf.y)), snapL);
    vec3 lc = ring < 0.5 ? uHeart * 1.1 + 0.1 : ring < 1.5 ? vC : ring < 2.5 ? uPal[1] * 1.25 : ring < 3.5 ? vC : uPal[0] * 0.9;
    float gl = ring < 0.5 ? 1.9 : ring < 1.5 ? 1.25 : ring < 2.5 ? 0.7 : ring < 3.5 ? 0.95 : 0.55;
    float flick = 0.88 + 0.12 * sin(uTime * 2.3 + seed * 40.);
    vec3 cl = lc * groove * (gl * flick * vS.w + 0.12);
    gl_FragColor = vec4(cl, 1.);
    gl_FragDepth = clamp(vZW.x / max(vZW.y, 1e-4) * 0.5 + 0.5, 0., 1.);
    #include <fog_fragment>
    return;
  }
  // the stem of a bed flower: a thread of sage wool that thickens to a dark tuft where it stands in the bed
  float sy = vQ.y;
  float stemW = 0.1 + 0.34 * smoothstep(-1.5, -2.7, sy);
  float inStem = isBed * step(sy, -0.3) * step(abs(vQ.x + 0.13 * sin(sy * 2.3 + seed * 9.)), stemW);
  // the edge: loose fibre ends; a blossom has five round petals
  float edge = 0.94 - 0.1 * gcNoise(vQ * 6. + seed * 31.) - 0.05 * gcNoise(vQ * 17. + seed * 7.);
  float isB = step(0.5, kind) * step(kind, 1.5);
  float pet = max(max(dot(dq, vec2(0., 1.)), dot(dq, vec2(0.951, 0.309))), max(max(dot(dq, vec2(-0.951, 0.309)), dot(dq, vec2(0.588, -0.809))), dot(dq, vec2(-0.588, -0.809))));
  float notch = smoothstep(0.81, 0.97, pet);
  edge *= mix(1., 0.7 + 0.3 * notch, isB);
  if (rho > edge) {
    if (inStem < 0.5) discard;
    vec3 stemC = mix(uPal[5], uPal[2], 0.35) * mix(0.3, 0.95, smoothstep(-2.7, -0.9, sy)) * (0.85 + 0.3 * gcNoise(vec2(vQ.x * 14., sy * 3.) + seed * 20.));
    vec3 cs = stemC * (uSunCol * vL.x * 0.6 + (uSkyCol * 0.7 + uBounceCol * 0.45) * vL.y + vWarm * vL.y);
    gl_FragColor = vec4(cs, 1.);
    gl_FragDepth = clamp(vZW.x / max(vZW.y, 1e-4) * 0.5 + 0.5, 0., 1.);
    #include <fog_fragment>
    return;
  }
  float rr = rho / edge;
  float nz = sqrt(max(1. - rr * rr, 0.));
  vec3 nv = normalize(vec3(dq * rr, nz + 0.08));
  vec3 N = normalize((vec4(nv, 0.) * viewMatrix).xyz + vec3(0., 1e-4, 0.));
  float ndl = clamp((dot(N, uSunDir) + 0.45) / 1.45, 0., 1.);
  float up = 0.5 + 0.5 * N.y;
  vec3 amb = (uSkyCol * (0.25 + 0.6 * up) * 1.1 + uBounceCol * (0.75 - 0.6 * up)) * vL.y;
  // wool: fibre ends seen end-on in the middle, strands combed out toward the edge
  float st = 0.8 + 0.36 * gcNoise(vQ * 10. + seed * 50.);
  float strand = 0.86 + 0.3 * gcNoise(vec2(rr * 5. + seed * 3., (dq.x * 2.3 + dq.y * 1.7) * 6. + seed * 11.));
  vec3 alb = vC * mix(st, strand, smoothstep(0.35, 0.85, rr));
  // a blossom: a saffron heart, petals a shade deeper toward it and between them
  alb = mix(alb, uHeart, isB * (1. - smoothstep(0.2, 0.3, rr)));
  alb *= 1. - 0.3 * isB * (1. - notch) * smoothstep(0.3, 0.9, rr);
  alb *= 1. - 0.45 * isBed * smoothstep(0.1, -0.9, vQ.y);
  vec3 c = alb * (uSunCol * vL.x * ndl * (0.3 + 0.7 * vL.z) + amb + vWarm * vL.y);
  float rim = 1. - nz;
  c += alb * rim * rim * (amb * 0.9 + uSunCol * vL.x * 0.3 * vL.z);
  gl_FragColor = vec4(c, 1.);
  vec2 zw = mix(vZW.xy, vZW.zw, nz);                       // the ball's own depth, so that balls cut into one another as balls
  gl_FragDepth = clamp(zw.x / max(zw.y, 1e-4) * 0.5 + 0.5, 0., 1.);
  #include <fog_fragment>
}`;
// the fountain: threads of silk thrown up from the basin, each a thin tube bent along its arc in the vertex shader and
// wound into slow loops as it falls
const silkVert = (G) => /* glsl */`
${G.common}
${G.light}
attribute vec4 aJet;    // azimuth, radial speed, vertical speed, phase
attribute vec4 aJet2;   // start height, start radius, loop radius, loop turns
attribute vec4 aJet3;   // height it lands at, thickness, tint, rise delay
uniform vec3 uOrigin, uCamW; uniform float uFount;
varying vec3 vP; varying vec3 vN; varying vec4 vS; varying float vSun;
#include <fog_pars_vertex>
vec3 jet(float s, float k){
  float g = 18.;
  float vy = aJet.z * sqrt(k), vr = aJet.y * (0.35 + 0.65 * k);
  float y0 = aJet2.x * k, yEnd = min(aJet3.x, y0);
  float T = (vy + sqrt(vy * vy + 2. * g * max(y0 - yEnd, 0.))) / g;
  float t = s * T;
  vec3 dir = vec3(cos(aJet.x), 0., sin(aJet.x));
  vec3 P = dir * (aJet2.y + vr * t) + vec3(0., y0 + vy * t - 0.5 * g * t * t, 0.);
  float ca = s * 6.2832 * aJet2.w - uTime * 1.2 + aJet.w;
  float cr = aJet2.z * k * sin(3.14159 * min(s * 1.2, 1.)) * (0.4 + 0.6 * s);
  P += vec3(-dir.z, 0., dir.x) * (cos(ca) * cr) + (dir * 0.5 + vec3(0., 0.7, 0.)) * (sin(ca) * cr);
  return P;
}
void main(){
  float s = position.y;
  float k = clamp(uFount * 1.25 - aJet3.w * 0.25, 0.0004, 1.);
  k *= 0.93 + 0.07 * sin(uTime * 1.7 + aJet.w * 3.);          // the jets breathe
  vec3 c0 = jet(s, k), c1 = jet(s + 0.012, k);
  vec3 T = normalize(c1 - c0 + vec3(0., 1e-4, 0.));
  vec3 side = vec3(-sin(aJet.x), 0., cos(aJet.x));
  vec3 Bn = normalize(cross(T, side) + vec3(1e-4, 0., 0.));
  vec3 Nn = cross(Bn, T);
  float dist = length(c0 - (uCamW - uOrigin));
  float rad = max(aJet3.y * (1. - 0.4 * s), dist * 0.0018) * smoothstep(0.0, 0.03, s) * smoothstep(0., 0.06, uFount);
  vec3 n = Bn * position.x + Nn * position.z;
  vec3 P = c0 + n * rad;
  float wgs = gcWaveLift(0.);
  P.x += P.y * wgs * (-uWave.x / max(uWave.z, 1.)) * 0.15;
  P.y += wgs;
  vP = P; vN = normalize(n + vec3(0., 1e-5, 0.)); vS = vec4(s, uv.x, aJet3.z, aJet.w);
  vSun = gcSun(c0);
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const silkFrag = (G) => /* glsl */`
${G.common}
uniform vec3 uCamW, uOrigin, uSilkA, uSilkB; uniform float uSilkGlow;
varying vec3 vP; varying vec3 vN; varying vec4 vS; varying float vSun;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 V = normalize(uCamW - uOrigin - vP + vec3(0., 1e-4, 0.));
  float ndv = abs(dot(N, V));
  // silk: plies wound round the thread, a lustre that runs along it with the flow
  float ply = 0.75 + 0.25 * sin(vS.y * 12.566 + vS.x * 90.);
  float run = 0.5 + 0.5 * sin(vS.x * 46. - uTime * 3.2 + vS.w * 5.);
  vec3 alb = mix(uSilkA, uSilkB, vS.z) * ply;
  float ndl = clamp(dot(N, uSunDir) * 0.6 + 0.4, 0., 1.);
  float up = 0.5 + 0.5 * N.y;
  vec3 amb = uSkyCol * (0.3 + 0.7 * up) * 1.2 + uBounceCol * (0.7 - 0.5 * up);
  vec3 c = alb * (uSunCol * vSun * ndl * 1.15 + amb + gcWarm(vP, N));
  float sheen = (1. - ndv); sheen *= sheen;
  c += (uSkyCol * 1.3 + uSunCol * vSun * 0.9) * (0.25 * ndv * ndv * run * run + 0.5 * sheen) * mix(uSilkB, vec3(1.), 0.5);
  c += alb * uSilkGlow * (0.4 + 0.6 * run);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// the woven birds: flat pieces of knotted pile cut to a bird, the dye stepped knot by knot, the two wings folding about the body
const birdVert = (G) => /* glsl */`
${G.common}
${G.light}
attribute vec4 aB1;   // where it is (hero-local), wing phase
attribute vec4 aB2;   // which way it flies (unit), size (0 = not out yet)
uniform vec3 uOrigin;
varying vec2 vLW; varying vec3 vN; varying vec4 vL; varying vec3 vWarm;
#include <fog_pars_vertex>
void main(){
  float l = position.x * 4.6, w = position.y * 5.8, aw = abs(w);
  float fl = sin(aB1.w);
  float ext = max(aw - 0.8, 0.);
  float th = 0.18 + 0.95 * fl - 0.5 * cos(aB1.w) * smoothstep(2., 5.8, aw);
  float y = ext * sin(th) + 0.5 * fl * (1. - smoothstep(0., 2., aw));
  float wy = sign(w) * (min(aw, 0.8) + ext * cos(th));
  // a woven bird is drawn in plan: it keeps its back turned most of the way to the eye, and flies along what the eye
  // sees of its heading (straight up the cloth when it flies straight away)
  vec3 toC = normalize(cameraPosition - uOrigin - aB1.xyz);
  vec3 n0 = normalize(toC + vec3(0., 0.45, 0.));
  vec3 fd = normalize(aB2.xyz + vec3(1e-4, 0., 0.));
  vec3 f = normalize(fd - n0 * dot(fd, n0) + (vec3(0., 1., 0.) - n0 * n0.y) * 0.35 + vec3(1e-4, 0., 0.));
  vec3 rt = normalize(cross(f, n0) + vec3(0., 0., 1e-4));
  vec3 upv = cross(rt, f);
  vec3 P = aB1.xyz + aB2.w * (f * l + rt * wy + upv * y);
  vLW = vec2(l, w);
  vN = normalize(upv * cos(th) - rt * sign(w) * sin(th) * step(0.8, aw) + vec3(0., 1e-4, 0.));
  float sun = gcSun(aB1.xyz);
  vL = vec4(sun, gAO, aB1.w, aB2.w);
  vWarm = gcWarm(aB1.xyz, vec3(0., 1., 0.));
  vec4 mvPosition = viewMatrix * vec4(P + uOrigin, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const birdFrag = (G) => /* glsl */`
${G.common}
uniform vec3 uBirdA, uBirdB, uBirdC; uniform float uBirdGlow;
varying vec2 vLW; varying vec3 vN; varying vec4 vL; varying vec3 vWarm;
#include <fog_pars_fragment>
float bEll(vec2 p, vec2 r){ return (length(p / r) - 1.) * min(r.x, r.y); }
void main(){
  vec2 fw2 = fwidth(vLW); float fw = max(max(fw2.x, fw2.y), 1e-4);
  float KN = 0.36;
  float snapK = 1. - smoothstep(0.1, 0.22, fw);
  vec2 kc = (floor(vLW / KN) + 0.5) * KN;
  vec2 p = mix(vLW, kc, snapK);
  float aw = abs(p.y), l = p.x;
  // a swallow in plan: a full body, a round head and a beak, two long wings swept back to a point, a forked tail
  float dB = bEll(vec2(l - 0.5, p.y), vec2(2.6, 1.15));
  float dH = length(vec2(l - 3.05, p.y)) - 0.95;
  float dK = max(abs(l - 4.1) - 0.5, abs(p.y) - 0.3 * (1. - (l - 3.6)));
  float tl = -l - 1.9;                                                 // along the tail, from its root
  float dT = max(abs(aw - 0.2 - tl * 0.5) - (0.5 - 0.1 * tl), max(-l - 4.6, l + 1.9));
  float wx = aw - 0.7;
  float lead = 1.95 - 0.5 * wx - 0.04 * wx * wx, trail = -1.05 - 0.2 * wx + 0.3 * abs(fract(wx / 1.25) - 0.5);
  float dW = max(max(l - lead, trail - l), max(aw - 5.7, 0.7 - aw)) * 0.9;
  float dd = min(min(dB, dH), min(min(dK, dT), dW));
  if (dd > 0.) discard;
  vec3 I = uPal[0], Nn = uPal[2], S = uPal[4];
  vec3 col = uBirdA;
  float onW = step(dW, 0.) * step(0., min(dB, dH));
  col = mix(col, uBirdB, onW);
  col = mix(col, uBirdC, onW * step(l, trail + 0.75));                 // the flight feathers along the trailing edge
  col = mix(col, uBirdA, onW * step(4.3, aw));                         // the wing tips in the body's dye
  col = mix(col, uBirdC, step(dT, 0.) * step(0., dB) * step(1.2, tl));
  col = mix(col, I, step(dB, -0.25) * step(l, 1.7) * step(abs(p.y), 0.5));
  col = mix(col, S, step(dK, 0.));
  col = mix(col, Nn, step(length(vec2(l - 3.3, aw - 0.42)), 0.24));
  col = mix(col, mix(Nn, col, 0.3), step(-0.3, dd) * (1. - step(dK, 0.)) * snapK);   // a dark edge, where the knots can be told apart
  vec2 kf = fract(vLW / KN) - 0.5;
  float knot = mix(1., 1.02 + 0.5 * dot(kf, vec2(0.7, 0.5)) - 0.4 * smoothstep(0.36, 0.5, max(abs(kf.x), abs(kf.y))), snapK);
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float ndl = 0.45 + 0.55 * abs(dot(N, uSunDir));
  vec3 amb = uSkyCol * 1.05 + uBounceCol * 0.6;
  vec3 c = col * knot * (uSunCol * vL.x * ndl + amb * vL.y + vWarm);
  c += col * uBirdGlow;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------
// Geometry helpers. A builder merges parts into one buffer with colour, material id and sway weight.
function makeBuilder() {
  const pos = [], nor = [], col = [], uv = [], mat = [], sway = [], anim = [], idx = [];
  const _p = V3(), _n = V3(), _c = new THREE.Color(), nm = new THREE.Matrix3();
  const api = {
    get triangles() { return idx.length / 3; },
    // geo: BufferGeometry with position, normal, uv (and optional sway attribute 'sw', colour 'cv')
    add(geo, o = {}) {
      const m = o.m || null, base = pos.length / 3;
      const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv, S = geo.attributes.sw, C = geo.attributes.cv;
      if (m) nm.getNormalMatrix(m);
      const c0 = _c.set(o.color ?? '#ffffff'); const cr = c0.r, cg = c0.g, cb = c0.b;
      const us = o.uvScale || [1, 1], id = o.mat ?? 0, par = o.par ?? 0;
      for (let i = 0; i < P.count; i++) {
        _p.fromBufferAttribute(P, i); _n.fromBufferAttribute(N, i);
        if (o.anim) { const an = o.anim(_p.x, _p.y, _p.z, S ? S.getX(i) : 0); anim.push(an[0], an[1], an[2]); } else anim.push(0, 0, 0);
        if (m) { _p.applyMatrix4(m); _n.applyMatrix3(nm).normalize(); }
        pos.push(_p.x, _p.y, _p.z); nor.push(_n.x, _n.y, _n.z);
        let k = 1;
        if (o.shade) k = o.shade(_p.x, _p.y, _p.z);
        if (C) col.push(C.getX(i) * k, C.getY(i) * k, C.getZ(i) * k); else col.push(cr * k, cg * k, cb * k);
        if (o.uvSwap) uv.push(U.getY(i) * us[0], U.getX(i) * us[1]); else uv.push(U ? U.getX(i) * us[0] : 0, U ? U.getY(i) * us[1] : 0);
        mat.push(id, par); sway.push(S ? S.getX(i) * (o.sway ?? 1) : 0);
      }
      const I = geo.index;
      if (I) for (let i = 0; i < I.count; i++) idx.push(base + I.getX(i));
      else for (let i = 0; i < P.count; i++) idx.push(base + i);
      geo.dispose();
      return api;
    },
    build(extra) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aMat', new THREE.Float32BufferAttribute(mat, 2));
      if (extra) g.setAttribute('aAnim', new THREE.Float32BufferAttribute(anim, 3)); else g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
      g.setIndex(idx);
      g.computeBoundingSphere();
      return g;
    },
  };
  return api;
}
const TR = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V3(sx, sy, sz));

// a box with rounded edges; uv in metres on its two largest spans
function roundBox(w, h, d, r, seg = 3) {
  const n = Math.max(2, seg * 2);
  const g = new THREE.BoxGeometry(w, h, d, n, n, n);
  const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = V3(), c = V3();
  for (let i = 0; i < P.count; i++) {
    v.fromBufferAttribute(P, i);
    c.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    v.sub(c);
    const l = v.length();
    if (l > 1e-6) { v.multiplyScalar(1 / l); } else v.fromBufferAttribute(N, i);
    N.setXYZ(i, v.x, v.y, v.z);
    P.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r);
    const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
    if (ay >= ax && ay >= az) U.setXY(i, P.getX(i), P.getZ(i)); else if (ax >= az) U.setXY(i, P.getY(i), P.getZ(i)); else U.setXY(i, P.getY(i), P.getX(i));
  }
  return g;
}
// a turned profile [[radius, y], ...]: uv = (round in metres, height)
function lathe(profile, seg = 20) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y));
  const g = new THREE.LatheGeometry(pts, seg);
  const U = g.attributes.uv, P = g.attributes.position;
  let rmax = 0; for (const [r] of profile) rmax = Math.max(rmax, r);
  for (let i = 0; i < U.count; i++) U.setXY(i, U.getX(i) * 6.2832 * rmax, P.getY(i));
  return g;
}
// a tube along points with radius rad(s) (s = 0..1); uv = (round 0..1, length in radii); 'sw' = sway(s)
function tube(points, rad, radial = 7, o = {}) {
  const n = points.length, pos = [], nor = [], uv = [], sw = [], idx = [];
  const T = V3(), Nn = V3(0, 1, 0), Bn = V3(), prevT = V3(), q = new THREE.Quaternion(), ax = V3();
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(i - 1, 0)], b = points[Math.min(i + 1, n - 1)];
    T.subVectors(b, a).normalize();
    if (i === 0) { Nn.set(0, 1, 0); if (Math.abs(T.y) > 0.9) Nn.set(1, 0, 0); Bn.crossVectors(T, Nn).normalize(); Nn.crossVectors(Bn, T).normalize(); }
    else { ax.crossVectors(prevT, T); const sl = ax.length(); if (sl > 1e-6) { q.setFromAxisAngle(ax.multiplyScalar(1 / sl), Math.asin(Math.min(sl, 1))); Nn.applyQuaternion(q); } Bn.crossVectors(T, Nn).normalize(); Nn.crossVectors(Bn, T).normalize(); len += points[i].distanceTo(points[i - 1]); }
    prevT.copy(T);
    const s = i / (n - 1), r = rad(s), r0 = Math.max(o.uvRadius ?? rad(0.5), 0.05);
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2 + (o.twist ? len / r0 * o.twist : 0), ca = Math.cos(th), sa = Math.sin(th);
      const ply = o.ply ? 1 + o.ply * Math.sin(2 * ((j / radial) * Math.PI * 2) + len / r0 * 0.9) : 1;
      const nx = Bn.x * ca + Nn.x * sa, ny = Bn.y * ca + Nn.y * sa, nz = Bn.z * ca + Nn.z * sa;
      pos.push(points[i].x + nx * r * ply, points[i].y + ny * r * ply, points[i].z + nz * r * ply);
      nor.push(nx, ny, nz); uv.push(j / radial, len / r0 * 0.5); sw.push(o.sway ? o.sway(s) : 0);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('sw', new THREE.Float32BufferAttribute(sw, 1));
  g.setIndex(idx);
  return g;
}
const curvePts = (ctrl, n) => new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(n);
// a quad a-b-c-d (counter-clockwise seen from its front) with uv in the given corners
function quad(a, b, c, d, uvs) {
  const g = new THREE.BufferGeometry();
  const n = V3().subVectors(b, a).cross(V3().subVectors(d, a)).normalize();
  g.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// ---------------------------------------------------------------------------------------------------
// The seeded looks: fog, window sky, wall paper, post. Colours are linear RGB.
const LOOKS = {
  spring: { fog: [0.215, 0.187, 0.152], dens: 0.0006, skyLo: [1.9, 1.62, 0.98], skyHi: [0.5, 0.9, 1.8], hedge: [0.3, 0.46, 0.2], leaf: [0.05, 0.085, 0.035],
    glow: [3, 2.4, 1.4], glare: [1.25, 1.15, 0.9], out: [0, 0, 1, 1], leafK: 0.45, sway: 1, branch: 0.3, lattice: 0.45, cloud: 0.08, shaft: 0.15, amb: 1, wallK: 0.38, stove: 0.3, lamp: 0, cordWarm: [0.09, 0.055, 0.02],
    wallA: [0.34, 0.38, 0.27], wallB: [0.55, 0.5, 0.36], paint: [0.62, 0.57, 0.45], portal: '#ffd9a0',
    post: { exposure: 1.0, tint: '#fff5e4', shadowTint: '#0a1026', sat: 1.06 } },
  golden: { fog: [0.27, 0.19, 0.125], dens: 0.00064, skyLo: [2.5, 1.45, 0.55], skyHi: [0.85, 0.75, 1.1], hedge: [0.5, 0.33, 0.1], leaf: [0.09, 0.06, 0.02],
    glow: [4, 2.2, 0.8], glare: [1.6, 1.0, 0.5], out: [0, 0, 1, 1.2], leafK: 0.45, sway: 1, branch: 0.3, lattice: 0.45, cloud: 0.08, shaft: 0.17, amb: 1, wallK: 0.38, stove: 0.35, lamp: 0, cordWarm: [0.08, 0.045, 0.015],
    wallA: [0.34, 0.38, 0.27], wallB: [0.55, 0.5, 0.36], paint: [0.62, 0.57, 0.45], portal: '#ffc27a',
    post: { exposure: 1.0, tint: '#ffeed2', shadowTint: '#120b22', sat: 1.08 } },
  winter: { fog: [0.2, 0.215, 0.25], dens: 0.0006, skyLo: [1.55, 1.62, 1.75], skyHi: [0.95, 1.15, 1.6], hedge: [1.25, 1.35, 1.55], leaf: [0.07, 0.06, 0.06],
    glow: [2.2, 2.2, 2.4], glare: [1.1, 1.2, 1.4], out: [1, 0, 1.15, 0.8], leafK: 0.34, sway: 0.5, branch: 0.8, lattice: 0.55, cloud: 0.1, lampReach: 165, shaft: 0.15, amb: 1, wallK: 0.6, stove: 1.0, lamp: 1.15, cordWarm: [0.33, 0.185, 0.055],
    wallA: [0.27, 0.31, 0.22], wallB: [0.6, 0.5, 0.3], paint: [0.66, 0.6, 0.47], portal: '#ffe2b8',
    post: { exposure: 0.97, tint: '#f6f5f6', shadowTint: '#0c1836', sat: 1.06 } },
  night: { fog: [0.034, 0.04, 0.085], dens: 0.00058, skyLo: [0.85, 0.46, 0.3], skyHi: [0.03, 0.05, 0.15], hedge: [0.02, 0.022, 0.05], leaf: [0.008, 0.01, 0.022],
    glow: [1.3, 1.6, 2.3], glare: [0.34, 0.27, 0.34], out: [0, 1, 1, 0.9], leafK: 0.45, sway: 0.7, branch: 0.52, cloud: 0.2, shaft: 0.12, amb: 1.15, wallK: 1, stove: 0.42, lamp: 0.46, cordWarm: [0.2, 0.115, 0.04],
    wallA: [0.32, 0.37, 0.3], wallB: [0.52, 0.5, 0.4], paint: [0.6, 0.57, 0.48], portal: '#ffcf80',
    post: { exposure: 1.58, tint: '#ece8f6', shadowTint: '#0a0822', sat: 1.02 } },
};

export default {
  id: 'garden-carpet',
  name: 'The Garden Underfoot',
  category: 'domestic',
  weirdness: 0.45,
  media: ['interior', 'tiny', 'air'],
  async build(ctx) {
    const rng = ctx.rng.fork('garden-carpet-world');
    const detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const hour = vary.hour || 'any';
    // ---- the look of this visit ----
    const lr = rng();
    const variant = hour === 'dawn' ? 'winter' : hour === 'night' ? 'night' : (hour === 'day' || hour === 'golden') ? 'spring'
      : (lr < 0.46 ? 'spring' : lr < 0.74 ? 'winter' : 'night');
    const lookName = variant === 'spring' && hour === 'golden' ? 'golden' : variant;
    const L = LOOKS[lookName];
    const coatR = rng();
    let coat = ['tabby', 'white', 'black'][Math.floor(coatR * 400) % 3];
    if (coat === 'black' && variant === 'night') coat = 'tabby';   // a black cat on an indigo carpet before dawn would be a hole in the picture
    if (coat === 'black' && vary.rare) coat = 'white';             // and a black tail sweeping over dark boards could not be seen at all
    const yarnDye = rng.chance(0.6) ? 4 : 1;                 // saffron or madder
    const tea = rng.chance(0.4);
    const rare = !!vary.rare;
    const col3 = (a) => new THREE.Color().setRGB(a[0], a[1], a[2]);

    const scene = new THREE.Scene();
    const fogCol = col3(L.fog);
    scene.fog = new THREE.FogExp2(fogCol, L.dens);
    scene.background = fogCol.clone();
    const root = new THREE.Group(); root.position.set(0, 0, OZ); scene.add(root);

    // ---- the hero: the carpet ----
    const hero = await buildHero(ctx, { variant, rare });
    hero.object.position.set(0, 0, 0);
    root.add(hero.object);
    hero.setLighting({ sunDir: SUN, window: WIN, branchLine: [560, 130, 330, 300], leaf: L.leafK, posts: MUL.bay, mullions: [MUL.zc, MUL.half, MUL.post, MUL.transom], transoms: [MUL.first, MUL.tHalf, MUL.south], branch: L.branch, sway: L.sway, cloud: L.cloud, lattice: L.lattice ?? 1 });
    if (lookName === 'golden') hero.setLighting({ sunColor: col3([1.1, 0.68, 0.33]), skyColor: col3([0.25, 0.25, 0.36]), bounceColor: col3([0.42, 0.25, 0.12]) });
    // winter: a low white sun, a shade warmer than the sky, so that the lozenges are cool white and the bars between them pale blue
    if (variant === 'winter') hero.setLighting({ sunColor: col3([0.9, 0.845, 0.77]), skyColor: col3([0.195, 0.285, 0.53]), bounceColor: col3([0.24, 0.215, 0.21]) });
    if (variant === 'night') hero.setLighting({ sunColor: col3([0.42, 0.52, 0.82]), skyColor: col3([0.17, 0.215, 0.39]), bounceColor: col3([0.17, 0.12, 0.13]) });
    // the shade on the wool keeps a cream cast (the bounce off the oak boards), so that saffron and madder stay legible in the
    // bars of shade; before dawn the shade stays blue
    hero.setLighting({ ambTint: col3(variant === 'winter' ? [1.34, 1.08, 0.74] : variant === 'night' ? [1, 1, 1] : [1.12, 1, 0.86]) });
    hero.uniforms.uPenK.value = variant === 'winter' ? 1.05 : 1.5;                         // on the wool the fine lattice is soft (the sun is half a degree wide and the window 700 m off); the mullions' bars stay
    const pal = hero.uniforms.uPal.value;                    // ivory, madder, indigo, pale blue, saffron, sage, walnut (matte wool values)
    const HU = hero.uniforms, lampC = HU.uLampC.value;
    await ctx.yield();

    // where things stand (hero-local)
    const CAT = { x: -116, z: -322, yaw: 0.22 };
    const YARN = { x: 206, z: 72, r: 11 };                    // on the east border, clear of the sight line when the garden is seen whole
    const SLIP = { x: -166, z: -60 };                         // the slippers, beside the armchair where they were stepped out of
    const STAND = { x: -158, z: 66, y: 148 };                 // the brass tray on its folding stand, in front of the armchair
    const LAMP = { x: -200, z: tea ? -92 : -150 };            // the lantern, on the west border
    const STOVE = { x: -520, z: -430 };                       // the iron stove against the west wall, its door facing the cat
    const TABLE = { hx: 78, z0: 400, z1: 560, top: 128 };     // the table that stands on the boards with its north legs in the fringe: the flight begins under it
    const CASE = { x0: -520, x1: -190, h: 560, d: 84 };       // the bookcase on the far wall
    const CHAIR2 = { x: 205, z: -612 };                       // the side chair against the far wall
    // its pair, pushed back from the table and turned to the garden, its back posts at the carpet's south edge, its left legs
    // on the east border and its right legs on the boards (far enough east that the low pass over the south border sees no
    // more of it than one leg at the edge of the frame): the doorway of the flight. It faces the pool (psi west of north); the
    // flight slips in low by its left side, turns onto its axis and rises under the seat with the two turned front legs
    // standing either side of the garden, then leaves between them.
    const CHAIR3 = { x: 212, z: 312, psi: -0.349 };
    const cf = [Math.sin(CHAIR3.psi), -Math.cos(CHAIR3.psi)], cr = [-cf[1], cf[0]];   // its forward and right, on the floor
    // a point of the chair's frame: D metres short of the plane of the front legs, lat to the right of its axis
    const chairAt = (D, y, lat = 0) => [CHAIR3.x + cf[0] * (64 - D) + cr[0] * lat, y, CHAIR3.z + cf[1] * (64 - D) + cr[1] * lat];
    const ROLL = { y: 35, z0: -310, z1: -460, r: 35, hollow: 11 };
    const cy = Math.cos(CAT.yaw), sy = Math.sin(CAT.yaw);
    const catPt = (x, y, z) => [CAT.x + x * cy + z * sy, y, CAT.z - x * sy + z * cy];
    hero.setOccluders([
      { a: [0, ROLL.y, ROLL.z0 - 4], b: [0, ROLL.y, ROLL.z1], r: ROLL.r },
      { a: catPt(-30, 27, 0), b: catPt(30, 27, 0), r: 31 },
      { a: catPt(44, 34, -26), r: 19 },
      { a: [YARN.x, YARN.r + 2, YARN.z], r: YARN.r },
      tea ? null : { a: [SLIP.x - 24, 9, SLIP.z - 17], b: [SLIP.x + 26, 10, SLIP.z - 21], r: 10.5 },
      tea ? null : { a: [SLIP.x - 30, 9, SLIP.z + 20], b: [SLIP.x + 20, 10, SLIP.z + 27], r: 10.5 },
      { a: [-212, 0, 140], b: [-212, 100, 140], r: 7.5 },
      { a: [-212, 0, -10], b: [-212, 100, -10], r: 7.5 },
      { a: [-TABLE.hx, 0, TABLE.z0], b: [-TABLE.hx, 110, TABLE.z0], r: 7 },
      { a: [TABLE.hx, 0, TABLE.z0], b: [TABLE.hx, 110, TABLE.z0], r: 7 },
      { a: [0, TABLE.top, TABLE.z0 + 30], b: [0, TABLE.top, TABLE.z1 - 30], r: 72 },
      { a: [LAMP.x, 14, LAMP.z], b: [LAMP.x, 74, LAMP.z], r: 20 },
      { a: chairAt(0, 0, -78), b: chairAt(0, 118, -78), r: 6.2 },
      { a: chairAt(0, 0, 78), b: chairAt(0, 118, 78), r: 6.2 },
    ]);   // (the side chair's seat is not among them: its shadow would fall 400 m off, a soft stain on the south-west field)
    // the room's two warm lights: the stove's open glow and the lantern on the border. Their colours flicker in update().
    const STOVE_C = [3.3, 1.2, 0.32], LAMP_C = [2.7, 1.42, 0.52];
    hero.setLamps([
      { p: [STOVE.x + 96, 82, STOVE.z], reach: 310, color: STOVE_C.map((v) => v * L.stove), wrap: 0.6 },
      { p: [LAMP.x, 56, LAMP.z], reach: L.lampReach || 250, color: LAMP_C.map((v) => v * L.lamp), wrap: 0.75 },   // in winter its pool dies before the pool's east lobes, where the window's cool light takes over
    ]);

    // ---- materials: one fragment shader, a few vertex shaders ----
    const FRAG = roomFrag(hero.glsl);
    const roomU = {
      uOrigin: { value: V3(0, 0, OZ) },
      uWallA: { value: col3(L.wallA) }, uWallB: { value: col3(L.wallB) }, uPaint: { value: col3(L.paint) },
      uOak: { value: col3([0.34, 0.225, 0.115]) }, uGlare: { value: col3(L.glare) },
      uFurDark: { value: col3([0.36, 0.32, 0.3]) }, uWallK: { value: L.wallK }, uRoom: { value: new THREE.Vector4(L.amb, coat === 'tabby' ? 1 : 0, variant === 'night' ? 1 : 0, 1) },
      uTail: { value: new THREE.Vector4(0.24, 0.97, 0, 0) }, uGlowK: { value: new THREE.Vector2(L.stove, L.lamp) },
      uBlob: { value: [new THREE.Vector4(STOVE.x, STOVE.z, 66, 66), new THREE.Vector4((CASE.x0 + CASE.x1) / 2, WALL.n + CASE.d / 2, (CASE.x1 - CASE.x0) / 2, CASE.d / 2 + 2),
        new THREE.Vector4(CHAIR2.x, CHAIR2.z + 2, 70, 62), new THREE.Vector4(366, WALL.n + 22, 86, 10)] }, uIvory: { value: pal[0].clone().multiplyScalar(1.12) }, uCordWarm: { value: new THREE.Color(0, 0, 0) },
    };
    const SOFT = { value: 5 };                               // standing things take the lattice through a wide penumbra: mottled light, not a net
    const mkMat = (vert, skip = [-1, -1], o = {}) => new THREE.ShaderMaterial({
      uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), HU, roomU, { uOccSkip: { value: new THREE.Vector2(skip[0], skip[1]) }, uPenK: o.pen ? { value: o.pen } : SOFT, uShell: { value: o.shell ?? 0 } }, o.cordWarm ? { uCordWarm: { value: col3(o.cordWarm) } } : {}),
      vertexShader: vert, fragmentShader: FRAG, fog: true, side: o.side ?? THREE.FrontSide });
    const addMesh = (geo, mat, name, cull = true) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = cull; root.add(m); return m; };
    // floor and walls take the lattice through a penumbra so wide that only the window's posts, the branch and the drifting
    // shade are left: broad soft lozenges, so that the carpet keeps the sharpest light in the room
    const matRoom = mkMat(PROP_VERT, [-1, -1], { pen: 9 });

    // ---- the room shell ----
    {
      const b = makeBuilder();
      const W = WALL, hw = 240.6, hl = 390.4;
      const flr = (x0, x1, z0, z1) => b.add(quad(V3(x0, 0, z1), V3(x1, 0, z1), V3(x1, 0, z0), V3(x0, 0, z0), [0, 0, 1, 0, 1, 1, 0, 1]), { mat: M.FLOOR });
      flr(W.w, W.e, hl, W.s); flr(W.w, W.e, W.n, -hl); flr(W.w, -hw, -hl, hl); flr(hw, W.e, -hl, hl);
      // a wall from (ax, az) to (bx, bz), facing left of that direction, between y0 and y1
      const wall = (ax, az, bx, bz, y0, y1, u0 = 0) => {
        const len = Math.hypot(bx - ax, bz - az);
        b.add(quad(V3(ax, y0, az), V3(bx, y0, bz), V3(bx, y1, bz), V3(ax, y1, az), [u0, y0, u0 + len, y0, u0 + len, y1, u0, y1]), { mat: M.WALL });
      };
      wall(W.w, W.n, W.e, W.n, 0, W.top);                    // north, the far wall
      wall(W.e, W.s, W.w, W.s, 0, W.top);                    // south, behind the entry
      wall(W.w, W.s, W.w, W.n, 0, W.top);                    // west, behind the chair
      const wz0 = WIN.zc - WIN.hz, wz1 = WIN.zc + WIN.hz;
      wall(W.e, W.n, W.e, W.s, 0, WIN.y0); wall(W.e, W.n, W.e, W.s, WIN.y1, W.top);
      wall(W.e, W.n, W.e, wz0, WIN.y0, WIN.y1); wall(W.e, wz1, W.e, W.s, WIN.y0, WIN.y1, wz1 - W.n);
      b.add(quad(V3(W.w, W.top, W.n), V3(W.e, W.top, W.n), V3(W.e, W.top, W.s), V3(W.w, W.top, W.s), [W.w, W.n, W.e, W.n, W.e, W.s, W.w, W.s]), { mat: M.CEIL, color: col3([0.4, 0.36, 0.3]) });
      await ctx.yield();
      // skirting: oak, 60 m high, with a rounded top; cut for the door
      const oak = col3([0.3, 0.17, 0.075]), paint = col3([1, 1, 1]);
      const DOOR = { x0: 300, x1: 540, h: 620 };
      const sk = (len, x, z, ry) => b.add(roundBox(len, 60, 9, 3, 1), { m: TR(x, 30, z, 0, ry, 0), mat: M.WOOD, color: oak });
      sk(DOOR.x0 - 26 - W.w, (W.w + DOOR.x0 - 26) / 2, W.n + 4.5, 0); sk(W.e - DOOR.x1 - 26, (W.e + DOOR.x1 + 26) / 2, W.n + 4.5, 0);
      sk(W.e - W.w, 20, W.s - 4.5, 0); sk(W.s - W.n, W.w + 4.5, (W.s + W.n) / 2, Math.PI / 2); sk(W.s - W.n, W.e - 4.5, (W.s + W.n) / 2, Math.PI / 2);
      // the door in the far wall: six sunk panels, an architrave and a brass knob
      b.add(quad(V3(DOOR.x0, 0, W.n + 3), V3(DOOR.x1, 0, W.n + 3), V3(DOOR.x1, DOOR.h, W.n + 3), V3(DOOR.x0, DOOR.h, W.n + 3), [0, 0, 240, 0, 240, DOOR.h, 0, DOOR.h]), { mat: M.DOOR, color: paint });
      const pc = col3(L.paint).multiplyScalar(1.05);
      b.add(roundBox(26, DOOR.h + 13, 12, 4, 1), { m: TR(DOOR.x0 - 13, (DOOR.h + 13) / 2, W.n + 6), mat: M.PLAIN, color: pc });
      b.add(roundBox(26, DOOR.h + 13, 12, 4, 1), { m: TR(DOOR.x1 + 13, (DOOR.h + 13) / 2, W.n + 6), mat: M.PLAIN, color: pc });
      b.add(roundBox(292, 30, 14, 4, 1), { m: TR(420, DOOR.h + 15, W.n + 7), mat: M.PLAIN, color: pc });
      b.add(new THREE.SphereGeometry(7, 12, 8), { m: TR(DOOR.x0 + 24, 300, W.n + 14), mat: M.BRASS, color: col3([0.3, 0.215, 0.1]) });
      b.add(lathe([[0.1, 0], [12, 0], [12, 2], [4, 3], [3.4, 8]], 12), { m: TR(DOOR.x0 + 24, 300, W.n + 3, Math.PI / 2, 0, 0), mat: M.BRASS, color: col3([0.8, 0.55, 0.2]) });
      // a picture on the far wall, on the axis above the roll: a walnut frame with a gilt slip
      {
        const PX = -4, PY = 480, PW = 256, PH = 174, pz = W.n + 3;
        b.add(quad(V3(PX - PW / 2, PY - PH / 2, pz), V3(PX + PW / 2, PY - PH / 2, pz), V3(PX + PW / 2, PY + PH / 2, pz), V3(PX - PW / 2, PY + PH / 2, pz), [0, 0, 1, 0, 1, 1, 0, 1]), { mat: M.PICTURE });
        const wn = col3([0.17, 0.085, 0.04]), gilt = col3([0.6, 0.43, 0.16]);
        for (const sgn of [-1, 1]) {
          b.add(roundBox(PW + 44, 22, 12, 4, 1), { m: TR(PX, PY + sgn * (PH / 2 + 11), pz + 4), mat: M.WOOD, color: wn });
          b.add(roundBox(22, PH + 4, 12, 4, 1), { m: TR(PX + sgn * (PW / 2 + 11), PY, pz + 4), mat: M.WOOD, color: wn });
          b.add(roundBox(PW + 4, 4, 13, 1.5, 1), { m: TR(PX, PY + sgn * (PH / 2 + 1.5), pz + 4), mat: M.BRASS, color: gilt });
          b.add(roundBox(4, PH + 4, 13, 1.5, 1), { m: TR(PX + sgn * (PW / 2 + 1.5), PY, pz + 4), mat: M.BRASS, color: gilt });
        }
      }
      await ctx.yield();
      // the window's surround, sill and posts
      const fw = col3([0.2, 0.115, 0.05]);
      b.add(roundBox(18, 22, 2 * WIN.hz + 44, 4, 1), { m: TR(W.e - 9, WIN.y1 + 11, WIN.zc), mat: M.WOOD, color: fw });
      b.add(roundBox(34, 12, 2 * WIN.hz + 60, 4, 1), { m: TR(W.e - 15, WIN.y0 - 6, WIN.zc), mat: M.WOOD, color: fw });
      for (const z of [wz0 - 11, wz1 + 11]) b.add(roundBox(18, WIN.y1 - WIN.y0, 22, 4, 1), { m: TR(W.e - 9, (WIN.y0 + WIN.y1) / 2, z), mat: M.WOOD, color: fw });
      for (let k = -4; k <= 4; k++) {
        const z = MUL.zc + Math.sign(k) * MUL.half + (k - Math.sign(k)) * MUL.bay + (k >= 3 ? MUL.south : 0);
        if (k !== 0 && z > wz0 + 30 && z < wz1 - 30) b.add(roundBox(14, WIN.y1 - WIN.y0, 2 * MUL.post + 2, 4, 1), { m: TR(W.e - 6, (WIN.y0 + WIN.y1) / 2, z), mat: M.WOOD, color: fw });
      }
      for (let y = WIN.y0 + MUL.first; y < WIN.y1 - 20; y += MUL.transom) b.add(roundBox(13, 2 * MUL.tHalf + 2, 2 * WIN.hz, 3, 1), { m: TR(W.e - 6, y, WIN.zc), mat: M.WOOD, color: fw });
      await ctx.yield();
      addMesh(b.build(), matRoom, 'room', false);
    }
    await ctx.yield();

    // ---- the lattice window, the shafts of lit haze, the lint ----
    const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
    {
      const wz0 = WIN.zc - WIN.hz, wz1 = WIN.zc + WIN.hz, x = WALL.e - 1.5;
      const g = quad(V3(x, WIN.y0, wz0), V3(x, WIN.y0, wz1), V3(x, WIN.y1, wz1), V3(x, WIN.y1, wz0), [0, 0, 1, 0, 1, 1, 0, 1]);
      const mat = new THREE.ShaderMaterial({
        uniforms: Object.assign(fogU(), HU, { uOrigin: roomU.uOrigin, uSkyLo: { value: col3(L.skyLo) }, uSkyHi: { value: col3(L.skyHi) }, uHedge: { value: col3(L.hedge) },
          uLeaf: { value: col3(L.leaf) }, uBar: { value: col3([0.22, 0.13, 0.06]) }, uGlow: { value: col3(L.glow) }, uOut: { value: new THREE.Vector4().fromArray(L.out) } }),
        vertexShader: WINDOW_VERT, fragmentShader: windowFrag(hero.glsl), fog: true });
      addMesh(g, mat, 'window');
    }
    const camW = V3(0, 9, 62);
    const beamU = { value: BEAMS.map((q) => new THREE.Vector4(q[0], q[1], q[2], q[3])) };
    {
      const NS = 18, pos = [], idx = [];
      for (let j = 0; j <= NS; j++) pos.push(-1, j / NS, 0, 1, j / NS, 0);
      for (let j = 0; j < NS; j++) { const o = j * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('aBeam', new THREE.InstancedBufferAttribute(new Float32Array(BEAMS.flat()), 4)); g.instanceCount = BEAMS.length;
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign({}, HU, { uOrigin: roomU.uOrigin, uCamW: { value: camW }, uShaft: { value: L.shaft }, uFogD: { value: L.dens } }),
        vertexShader: shaftVert(hero.glsl), fragmentShader: shaftFrag(hero.glsl), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const m = addMesh(g, mat, 'shafts', false); m.renderOrder = 2;
    }
    {
      const n = Math.round(1700 * detail * density);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const seed = new Float32Array(n * 4), mr = rng.fork('motes');
      for (let i = 0; i < n * 4; i++) seed[i] = mr();
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign({}, HU, { uOrigin: roomU.uOrigin, uCamW: { value: camW }, uBeam: beamU }), vertexShader: moteVert(hero.glsl), fragmentShader: MOTE_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const m = addMesh(g, mat, 'lint', false); m.renderOrder = 3;
    }
    const crestMeshes = [];
    if (rare) {
      const pos = [], uv = [], idx = [], NZ = 390, NA = 8;
      for (let i = 0; i <= NZ; i++) for (let j = 0; j <= NA; j++) { pos.push(0, 0, -390 + i * 2); uv.push(j / NA, i / NZ); }
      for (let i = 0; i < NZ; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, c = a + NA + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      await ctx.yield();
      // the ridge and two shells of loose tufts over it
      for (let k = 0; k <= 2; k++) {
        const m = addMesh(g, new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, { uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: { value: 1.5 }, uShell: { value: k / 2 } }), vertexShader: crestVert(hero.glsl), fragmentShader: crestFrag(hero.glsl),
          fog: true, side: THREE.DoubleSide }), k ? 'wave-crest-tufts' + k : 'wave-crest', false);
        m.visible = false; crestMeshes.push(m);
      }
    }
    await ctx.yield();

    // ---- the fringe: twisted ivory cords in loose arches at both ends, a lane down the axis ----
    {
      // one unit tube; the south cords (the foreground of the first seconds) are finer made than the north ones
      const unit = (RAD, SEG) => {
        const pos = [], uv = [], idx = [];
        for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) { const a = (j / RAD) * Math.PI * 2; pos.push(Math.cos(a), i / SEG, Math.sin(a)); uv.push(j / RAD, i / SEG); }
        for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, c = a + RAD + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
        return { pos, uv, idx };
      };
      const fr = rng.fork('fringe');
      const matF = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, roomU, { uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: SOFT, uCordWarm: { value: col3(L.cordWarm) } }), vertexShader: FRINGE_VERT, fragmentShader: FRAG, fog: true });
      const side = (south, count) => {
        const root4 = [], shape4 = [];
        for (let i = 0; i < count; i++) {
          const x = -239 + (478 * (i + fr())) / count;
          if (south && (Math.abs(x) < 9.5 || Math.abs(Math.abs(x) - TABLE.hx) < 10)) continue;   // the lane; the table's legs
          const bunch = (Math.floor(i / 3) % 2 ? 1 : -1) * 0.12;
          const nearLane = south ? Math.max(0, 1 - Math.abs(x) / 55) : 0;
          const yaw = (south ? 0 : Math.PI) + bunch + fr.range(-0.42, 0.42) * (1 - 0.6 * nearLane) + Math.sign(x) * 0.34 * nearLane;
          root4.push(x, south ? 390.3 : -390.3, yaw, fr());
          shape4.push(fr.range(24, 34), south ? lerp(fr.range(6, 14), fr.range(3.5, 7.5), nearLane * nearLane) : fr.range(3, 10), fr.range(0.3, 0.43), fr.range(0.82, 1.08));
        }
        const g = new THREE.InstancedBufferGeometry(), { pos, uv, idx } = south ? unit(8, 20) : unit(5, 10);
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        g.setAttribute('aRoot', new THREE.InstancedBufferAttribute(new Float32Array(root4), 4));
        g.setAttribute('aShape', new THREE.InstancedBufferAttribute(new Float32Array(shape4), 4));
        g.instanceCount = root4.length / 4;
        g.boundingSphere = new THREE.Sphere(V3(0, 8, south ? 408 : -408), 250);
        addMesh(g, matF, south ? 'fringe-south' : 'fringe-north');
      };
      side(true, Math.round(250 * (0.5 + 0.5 * detail)));
      await ctx.yield();
      side(false, Math.round(170 * (0.5 + 0.5 * detail)));
    }
    await ctx.yield();

    // ---- the gateway: two thick plied cords leaning together over the lane ----
    const PILE = 2.5;
    {
      const b = makeBuilder(), iv = pal[0].clone().multiplyScalar(1.15);
      for (const s of [-1, 1]) {
        const dz = s < 0 ? 0 : 2.3;
        const pts = curvePts([V3(16 * s, 0.8, 395.6 + dz), V3(14.3 * s, 8, 395.3 + dz), V3(10.2 * s, 15.4, 395 + dz), V3(4.4 * s, 20.8, 394.8 + dz), V3(-0.5 * s, 24.3, 394.6 + dz), V3(-2.6 * s, 26.6, 394.3 + dz)], 46);
        const rad = (t) => 1.08 * (1 + 0.55 * Math.exp(-(((t - 0.035) / 0.03) ** 2)) + 0.5 * Math.exp(-(((t - 0.9) / 0.02) ** 2)) + 0.9 * smoothstep(0.93, 1, t)) * (1 - 0.6 * smoothstep(0.985, 1, t));
        b.add(tube(pts, rad, 10, { ply: 0.15, uvRadius: 1.08, sway: (t) => 0.5 * smoothstep(0.55, 1, t) }), { mat: M.CORD, color: iv });
      }
      addMesh(b.build(), mkMat(PROP_VERT, [-1, -1], { cordWarm: L.cordWarm.map((v) => v * 1.25) }), 'gate');
    }

    await ctx.yield();
    // ---- the armchair: front legs on the west border, the seat rail 105 m up ----
    const brass = col3([0.85, 0.6, 0.24]), walnut = col3([0.2, 0.1, 0.045]);
    {
      const b = makeBuilder();
      const fab = pal[5].clone().multiplyScalar(0.9), fabDark = fab.clone().multiplyScalar(0.8);
      const legProfile = [[3.6, 13], [3.9, 15], [4.7, 19], [6.6, 24], [7.4, 30], [6.5, 36], [4.5, 40], [4.0, 43], [5.3, 45.3], [5.4, 47.5], [4.0, 50], [4.4, 54], [6.1, 62], [7.3, 72], [7.5, 80], [6.9, 86], [5.4, 90], [5.0, 92], [6.5, 94], [6.5, 96.6], [5.3, 99.5]];
      const castor = (x, z, a) => {
        b.add(new THREE.CylinderGeometry(5, 5, 3.6, 18, 1), { m: TR(x, 5 + PILE * 0.3, z, Math.PI / 2, a, 0), mat: M.BRASS, color: brass, par: 0 });
        b.add(new THREE.TorusGeometry(4.2, 0.9, 6, 18), { m: TR(x, 5 + PILE * 0.3, z, 0, a, 0), mat: M.BRASS, color: brass.clone().multiplyScalar(0.7) });
        for (const sd of [-1, 1]) b.add(roundBox(1.2, 8, 5, 0.5, 1), { m: TR(x + Math.sin(a) * 2.6 * sd, 8.5, z + Math.cos(a) * 2.6 * sd, 0, a, 0), mat: M.BRASS, color: brass });
        b.add(lathe([[0.1, 11.5], [4.6, 11.5], [4.8, 13], [4.2, 15.5], [3.7, 16]], 16), { m: TR(x, 0, z), mat: M.BRASS, color: brass, par: 1 });
      };
      for (const [x, z, a] of [[-212, 140, 0.5], [-212, -10, -0.3]]) {
        b.add(lathe(legProfile, 22), { m: TR(x, 0, z), mat: M.WOOD, color: walnut, shade: (px, py) => 0.75 + 0.25 * smoothstep(8, 40, py) });
        b.add(roundBox(15.5, 30, 15.5, 1.6, 1), { m: TR(x, 113.5, z), mat: M.WOOD, color: walnut });
        castor(x, z, a);
      }
      await ctx.yield();
      for (const [x, z, a] of [[-362, 140, 1.2], [-362, -10, 0.2]]) {
        b.add(roundBox(13, 92, 13, 2.2, 1), { m: TR(x - 3, 58, z, 0, 0, -0.07, 1, 1, 1), mat: M.WOOD, color: walnut });
        castor(x - 6, z, a);
      }
      await ctx.yield();
      // seat rails with a bead, brass studs along the top edge, the dark cloth and webbing underneath
      b.add(roundBox(10, 24, 150, 2, 1), { m: TR(-208, 116.5, 65), mat: M.WOOD, color: walnut });
      b.add(roundBox(10, 24, 150, 2, 1), { m: TR(-366, 116.5, 65), mat: M.WOOD, color: walnut });
      for (const z of [144, -14]) b.add(roundBox(158, 24, 10, 2, 1), { m: TR(-287, 116.5, z), mat: M.WOOD, color: walnut });
      b.add(roundBox(3, 3, 150, 1.4, 1), { m: TR(-202.6, 106.5, 65), mat: M.WOOD, color: walnut.clone().multiplyScalar(1.5) });
      for (const z of [149.6, -19.6]) b.add(roundBox(158, 3, 3, 1.4, 1), { m: TR(-287, 106.5, z), mat: M.WOOD, color: walnut.clone().multiplyScalar(1.5) });
      for (let i = 0; i < 24; i++) b.add(new THREE.SphereGeometry(1.5, 6, 4), { m: TR(-202.4, 125.4, -6 + i * 6.2, 0, 0, 0, 1, 1, 1), mat: M.BRASS, color: brass });
      for (const z of [149.6, -19.6]) for (let i = 0; i < 25; i++) b.add(new THREE.SphereGeometry(1.5, 6, 4), { m: TR(-364 + i * 6.4, 125.4, z), mat: M.BRASS, color: brass });
      b.add(quad(V3(-362, 107, 140), V3(-362, 107, -10), V3(-212, 107, -10), V3(-212, 107, 140), [0, 0, 150, 0, 150, 150, 0, 150]), { mat: M.PLAIN, color: col3([0.035, 0.03, 0.028]) });
      for (let i = 0; i < 3; i++) {
        const o = -10 + 28 + i * 47, jute = col3([0.26, 0.2, 0.12]);
        b.add(quad(V3(-362, 106.3, o + 8), V3(-362, 106.3, o - 8), V3(-212, 106.3, o - 8), V3(-212, 106.3, o + 8), [0, 0, 16, 0, 16, 150, 0, 150]), { mat: M.PLAIN, color: jute });
        b.add(quad(V3(-362 + 28 + i * 47 - 8, 106, 140), V3(-362 + 28 + i * 47 - 8, 106, -10), V3(-362 + 28 + i * 47 + 8, 106, -10), V3(-362 + 28 + i * 47 + 8, 106, 140), [0, 0, 150, 0, 150, 16, 0, 16]), { mat: M.PLAIN, color: jute });
      }
      await ctx.yield();
      // upholstery: seat, arms with rolled tops, a raked back
      b.add(roundBox(178, 46, 180, 17, 3), { m: TR(-286, 147, 65), mat: M.VELVET, color: fab, uvScale: [1, 1] });
      for (const z of [140, -10]) {
        b.add(roundBox(164, 92, 38, 15, 3), { m: TR(-292, 206, z), mat: M.VELVET, color: fabDark });
        b.add(new THREE.CylinderGeometry(20, 20, 166, 18, 1), { m: TR(-290, 252, z, 0, 0, Math.PI / 2), mat: M.VELVET, color: fab, uvScale: [125, 166] });
      }
      b.add(roundBox(46, 250, 182, 19, 3), { m: TR(-364, 276, 65, 0, 0, 0.11), mat: M.VELVET, color: fab });
      await ctx.yield();
      addMesh(b.build(), mkMat(PROP_VERT, [6, 8]), 'chair');
    }
    // the tassel on the seat rail: a cord, a wound head and a skirt of threads, swinging
    const tassel = (() => {
      const b = makeBuilder(), sa = pal[4].clone().multiplyScalar(1.1);
      b.add(tube([V3(0, 0, 0), V3(0.3, -7, 0), V3(-0.2, -14, 0.2), V3(0, -20, 0)], () => 0.75, 7, { ply: 0.15 }), { mat: M.CORD, color: sa });
      b.add(new THREE.SphereGeometry(3.5, 14, 10), { m: TR(0, -23, 0, 0, 0, 0, 1, 1.15, 1), mat: M.CORD, color: sa, uvScale: [6, 9] });
      b.add(new THREE.TorusGeometry(2.6, 0.9, 6, 14), { m: TR(0, -26.6, 0, Math.PI / 2, 0, 0), mat: M.CORD, color: pal[1].clone(), uvScale: [5, 2] });
      b.add(lathe([[2.4, -43], [4.7, -42.5], [4.5, -38], [3.7, -32], [3.0, -28.5], [2.4, -26.5]], 16), { mat: M.CORD, color: sa, uvScale: [0.5, 0.25] });
      const m = addMesh(b.build(), mkMat(PROP_VERT, [-1, -1], { side: THREE.DoubleSide }), 'tassel', false);
      m.position.set(-201, 105, 96);
      return m;
    })();
    await ctx.yield();

    // ---- the ball of yarn: wound bands of strands over a core, its loose end trailing over the border ----
    let yarnMesh = null;
    {
      const b = makeBuilder(), yr = rng.fork('yarn');
      const dye = pal[yarnDye].clone().multiplyScalar(yarnDye === 4 ? 1.1 : 1.05);
      const cx = YARN.x, cyy = YARN.r + PILE - 0.6, cz = YARN.z;
      b.add(new THREE.SphereGeometry(10.1, 28, 18), { m: TR(cx, cyy, cz), mat: M.CORD, color: dye.clone().multiplyScalar(0.6), uvScale: [9, 14] });
      const n = V3(), e1 = V3(), e2 = V3(), p = V3();
      for (let k = 0; k < 46; k++) {
        n.set(yr.gauss(), yr.gauss() * 0.8, yr.gauss()).normalize();
        e1.set(n.z, 0, -n.x); if (e1.lengthSq() < 1e-4) e1.set(1, 0, 0); e1.normalize(); e2.crossVectors(n, e1);
        const R = 10.25 + 0.035 * k, off = yr.range(-0.3, 0.3) * R, wd = yr.range(1.6, 2.8), tone = yr.range(0.82, 1.12);
        const pos = [], nor = [], uv = [], idx = [], SEG = 40;
        for (let i = 0; i <= SEG; i++) {
          const a = (i / SEG) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          for (const e of [-1, 1]) {
            const o = off + e * wd * 0.5, rr = Math.sqrt(Math.max(R * R - o * o, 0.01));
            p.set(0, 0, 0).addScaledVector(e1, ca * rr).addScaledVector(e2, sa * rr).addScaledVector(n, o);
            pos.push(cx + p.x, cyy + p.y, cz + p.z); p.normalize(); nor.push(p.x, p.y, p.z);
            uv.push((e + 1) * 0.5 * (wd / 1.5), a * R / 1.4);
          }
          if (i < SEG) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        b.add(g, { mat: M.CORD, color: dye.clone().multiplyScalar(tone) });
        if ((k & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
      const endPts = curvePts([V3(cx + 3, PILE + 1.2, cz - 9), V3(cx + 10, PILE + 0.9, cz - 21), V3(cx - 1, PILE + 0.9, cz - 38), V3(cx + 11, PILE + 0.9, cz - 56), V3(cx + 4, PILE + 0.9, cz - 74),
        V3(cx + 17, PILE + 0.9, cz - 88), V3(cx + 28, PILE + 1.4, cz - 97), V3(cx + 36, 2.2, cz - 103), V3(cx + 43, 0.9, cz - 116), V3(cx + 54, 0.9, cz - 130), V3(cx + 59, 0.9, cz - 146)], 90);
      b.add(tube(endPts, (t) => 0.85 * (1 - 0.5 * smoothstep(0.985, 1, t)), 7, { ply: 0.16, uvRadius: 0.85, sway: (t) => 5 * smoothstep(0.72, 1, t) ** 2 }), { mat: M.CORD, color: dye });
      yarnMesh = addMesh(b.build(), mkMat(PROP_VERT, [3, 4], { side: THREE.DoubleSide }), 'yarn');
    }

    await ctx.yield();
    // ---- the furniture of the room: a table south of the fringe (the flight begins under it), the iron stove with its
    // kettle, a bookcase and a side chair along the far wall, curtains at the window and a portiere at the door ----
    const fr2 = rng.fork('furniture');
    const iron = col3([0.05, 0.05, 0.056]), copper = col3([0.72, 0.36, 0.17]);
    // a pleated hanging cloth w wide and h long, hung from y = 0 in the x-y plane; it stirs more toward the hem
    const drape = (w, h, nx, ny, depth, pleats, amp, top, hem) => {
      const pos = [], uv = [], sw = [], cv = [], idx = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const u = i / nx, t = j / ny, k = 0.35 + 0.65 * t;
        const x = (u - 0.5) * w * (0.86 + 0.14 * t) + Math.sin(u * 9.4 + 1.3) * 3 * t;
        pos.push(x, -t * h, depth * k * Math.sin(u * pleats * Math.PI * 2) + depth * 0.35 * t * Math.sin(u * 4.1 + 0.7));
        uv.push(u * w, t * h); sw.push(amp * Math.pow(t, 1.6));
        const band = (t > 0.845 && t < 0.895) || (t > 0.925 && t < 0.945) ? 1 : 0;
        const c = band ? hem : top, sh = 0.82 + 0.18 * Math.cos(u * pleats * Math.PI * 2);
        cv.push(c.r * sh, c.g * sh, c.b * sh);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, c = a + nx + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('sw', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('cv', new THREE.Float32BufferAttribute(cv, 3)); g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    // a turned leg 116 m high (scaled by k), with a brass cup under its foot
    const turned = [[4.6, 5], [6.3, 7], [6.6, 11], [5.0, 14], [4.3, 17], [5.6, 21], [7.3, 29], [7.7, 38], [6.5, 47], [5.0, 52], [5.9, 54.5], [5.9, 57], [7.6, 58], [7.6, 63], [5.9, 64], [5.0, 68], [5.6, 74], [7.1, 86], [7.5, 96], [6.5, 102], [5.2, 105], [6.7, 106.5], [6.7, 116]];
    const turnedLeg = (b, x, z, k, wood) => {
      b.add(lathe(turned, 20), { m: TR(x, 0, z, 0, 0, 0, k), mat: M.WOOD, color: wood, shade: (px, py) => 0.72 + 0.28 * smoothstep(6, 44, py) });
      b.add(lathe([[0.1, 0], [6.2, 0], [7, 1.5], [6.8, 4.5], [5.2, 6.4], [4.4, 6.6]], 16), { m: TR(x, PILE * 0.25, z, 0, 0, 0, k), mat: M.BRASS, color: brass, par: 1 });
    };
    // a turned stretcher between two points at the same height
    const spindle = (b, ax, az, bx, bz, y, wood, C = null) => {
      const len = Math.hypot(bx - ax, bz - az), h = len / 2;
      const prof = [[3.2, -h], [3.2, -h + 6], [4.6, -h + 9], [3.4, -h + 13], [3.8, -h * 0.55], [5.4, -h * 0.2], [5.8, 0], [5.4, h * 0.2], [3.8, h * 0.55], [3.4, h - 13], [4.6, h - 9], [3.2, h - 6], [3.2, h]];
      const m = TR((ax + bx) / 2, y, (az + bz) / 2, Math.PI / 2, Math.atan2(bx - ax, bz - az), 0);
      b.add(lathe(prof, 12), { m: C ? C.clone().multiply(m) : m, mat: M.WOOD, color: wood });
    };
    // a side chair in its own frame (origin under the seat, front toward -z), placed by the matrix C. The seat is wider at the
    // front (78 m either side) than at the back (62): two turned front legs with beads and rings on brass cups, two raked
    // back posts carrying a ladder back, a turned stretcher low down each side and one across the back (none across the front,
    // so the way between the front legs is clear), seat rails with a bead, a madder cushion.
    const CH = { hf: 78, hb: 62, zf: -64, zb: 60, sy: 20 };   // sy: the height of the side stretchers, low enough for the flight to come in well over one of them (it crosses 27 m above)
    const chairLeg = [[4.4, 6.4], [5.7, 7], [6.7, 9], [6.9, 11.5], [5.7, 13.5], [4.5, 15], [4.2, 17.5], [5.3, 19], [5.7, 20], [5.3, 21], [4.6, 22.5], [5.8, 26], [7.2, 32], [7.8, 39], [7.2, 46], [5.9, 51],
      [5.2, 53.5], [6.7, 54.5], [7.1, 55.8], [6.7, 57], [5.4, 58], [8.0, 59], [8.2, 61], [8.0, 63], [5.4, 64], [6.7, 65], [7.1, 66.2], [6.7, 67.5], [5.2, 68.5], [5.0, 71], [5.6, 75], [6.8, 84], [7.6, 94],
      [7.4, 100], [6.2, 104], [5.2, 106], [6.9, 107], [7.3, 108.2], [6.9, 109.5], [5.6, 110.5], [5.6, 112.5]];
    const sideChair = async (b, C, wood, seg) => {
      const at = (m) => C.clone().multiply(m), k = 126 / 116, lite = wood.clone().multiplyScalar(1.25);
      const low = (px, py) => 0.72 + 0.28 * smoothstep(6, 44, py);
      for (const sx of [-1, 1]) {
        // front leg, the block the rails run into (chamfered, with a collar where the turning meets it), the brass cup
        b.add(lathe(chairLeg.map(([r, y]) => [r * 0.78, y]), seg), { m: at(TR(sx * CH.hf, 0, CH.zf, 0, 0, 0, k)), mat: M.WOOD, color: wood, shade: low });
        b.add(lathe([[0.1, 0], [5.2, 0], [6, 1.5], [5.8, 4.6], [4.4, 6.5], [3.5, 6.7]], seg), { m: at(TR(sx * CH.hf, PILE * 0.25, CH.zf, 0, 0, 0, k)), mat: M.BRASS, color: brass, par: 1 });
        b.add(roundBox(13.5, 27, 13.5, 2.2, 2), { m: at(TR(sx * CH.hf, 135, CH.zf)), mat: M.WOOD, color: wood, uvSwap: true });
        b.add(lathe([[4.8, 0], [6.1, 0.7], [6.4, 1.8], [6, 2.9], [4.8, 3.3]], seg), { m: at(TR(sx * CH.hf, 119.6, CH.zf)), mat: M.WOOD, color: lite });
        // back post: raked, swelling where the seat joins it, a ball on top
        const post = curvePts([V3(sx * CH.hb, 1, CH.zb - 9), V3(sx * CH.hb, 70, CH.zb - 2), V3(sx * CH.hb, 140, CH.zb), V3(sx * CH.hb, 230, CH.zb + 7), V3(sx * CH.hb, 318, CH.zb + 20)], 18);
        b.add(tube(post, (t) => 6.4 - 1.6 * smoothstep(0.5, 1, t) + 1.6 * Math.exp(-(((t - 0.44) / 0.04) ** 2)) + 0.9 * Math.exp(-(((t - 0.2) / 0.012) ** 2)), 12, { uvRadius: 1 }), { m: C, mat: M.WOOD, color: wood, shade: low });
        b.add(new THREE.SphereGeometry(6.2, 10, 8), { m: at(TR(sx * CH.hb, 322, CH.zb + 20.6)), mat: M.WOOD, color: wood });
        b.add(lathe([[0.1, 0], [6, 0], [6.9, 1.4], [6.7, 4.2], [5.4, 5.8]], 12), { m: at(TR(sx * CH.hb, PILE * 0.25, CH.zb - 9)), mat: M.BRASS, color: brass, par: 1 });
        // the side stretcher and the side rail, both running from the narrow back to the wide front
        const dx = sx * (CH.hf - CH.hb), dz = CH.zf - (CH.zb - 4), len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz), h = len / 2;
        const prof = [[3.2, -h], [3.2, -h + 6], [4.7, -h + 8], [5.0, -h + 9.5], [4.7, -h + 11], [3.4, -h + 13], [3.8, -h * 0.55], [5.4, -h * 0.2], [5.9, -3], [4.9, -1.6], [6.3, 0], [4.9, 1.6], [5.9, 3], [5.4, h * 0.2], [3.8, h * 0.55], [3.4, h - 13], [4.7, h - 11], [5.0, h - 9.5], [4.7, h - 8], [3.2, h - 6], [3.2, h]];
        b.add(lathe(prof, Math.max(10, seg - 8)), { m: at(TR(sx * (CH.hb + CH.hf) / 2, CH.sy, (CH.zb - 4 + CH.zf) / 2, Math.PI / 2, ry, 0)), mat: M.WOOD, color: wood });
        b.add(roundBox(6, 16, len - 10, 1.5, 1), { m: at(TR(sx * (CH.hb + CH.hf) / 2, 136, (CH.zb + CH.zf) / 2, 0, ry, 0)), mat: M.WOOD, color: wood });
        b.add(roundBox(2.6, 2.6, len - 16, 1.2, 1), { m: at(TR(sx * ((CH.hb + CH.hf) / 2 + 3.4), 127.5, (CH.zb + CH.zf) / 2, 0, ry, 0)), mat: M.WOOD, color: lite });
        await ctx.yield();   // one side of the chair in a step
      }
      spindle(b, -CH.hb, CH.zb - 5, CH.hb, CH.zb - 5, 70, wood, C);
      b.add(roundBox(2 * CH.hf - 14, 16, 6, 1.5, 1), { m: at(TR(0, 136, CH.zf)), mat: M.WOOD, color: wood, uvSwap: true });
      b.add(roundBox(2 * CH.hf - 20, 2.6, 2.6, 1.2, 1), { m: at(TR(0, 127.5, CH.zf - 3.4)), mat: M.WOOD, color: lite, uvSwap: true });
      b.add(roundBox(2 * CH.hb - 12, 16, 6, 1.5, 1), { m: at(TR(0, 136, CH.zb)), mat: M.WOOD, color: wood, uvSwap: true });
      for (const [y, h, dz] of [[196, 20, 4.5], [244, 22, 9.5], [296, 30, 16.5]]) b.add(roundBox(2 * CH.hb - 8, h, 5, 2, 1), { m: at(TR(0, y, CH.zb + dz, 0.12, 0, 0)), mat: M.WOOD, color: lite, uvSwap: true });
      // the cushion, cut to the seat's taper
      const cu = roundBox(2 * CH.hf + 16, 15, CH.zb - CH.zf + 14, 6, 2), P = cu.attributes.position;
      for (let i = 0; i < P.count; i++) P.setX(i, P.getX(i) * lerp(1, (CH.hb + 8) / (CH.hf + 8), clamp((P.getZ(i) + 62) / 124, 0, 1)));
      b.add(cu, { m: at(TR(0, 152, (CH.zf + CH.zb) / 2)), mat: M.VELVET, color: pal[1].clone().multiplyScalar(1.05), par: 1 });
    };
    const furn = makeBuilder();
    {
      const b = furn;
      const oakD = col3([0.24, 0.125, 0.05]), oakL = col3([0.3, 0.165, 0.07]);
      // -- the table --
      {
        const T = TABLE, zc = (T.z0 + T.z1) / 2, lz = T.z1 - T.z0;
        for (const sx of [-1, 1]) for (const z of [T.z0, T.z1]) {
          turnedLeg(b, sx * T.hx, z, 0.9, oakD);
          b.add(roundBox(15, 24, 15, 1.6, 1), { m: TR(sx * T.hx, T.top - 12, z), mat: M.WOOD, color: oakD });
        }
        await ctx.yield();
        for (const z of [T.z0, T.z1]) {
          spindle(b, -T.hx, z, T.hx, z, 56, oakD);
          b.add(roundBox(2 * T.hx - 15, 18, 7, 1.5, 1), { m: TR(0, T.top - 9, z), mat: M.WOOD, color: oakD });
          b.add(roundBox(2 * T.hx - 22, 2.4, 8.4, 1, 1), { m: TR(0, T.top - 17.5, z), mat: M.WOOD, color: oakL });
        }
        for (const sx of [-1, 1]) {
          spindle(b, sx * T.hx, T.z0, sx * T.hx, T.z1, 56, oakD);
          b.add(roundBox(7, 18, lz - 15, 1.5, 1), { m: TR(sx * T.hx, T.top - 9, zc), mat: M.WOOD, color: oakD });
        }
        b.add(roundBox(2 * T.hx + 44, 9, lz + 44, 3.5, 2), { m: TR(0, T.top + 4.5, zc), mat: M.WOOD, color: oakL, uvSwap: true });
        b.add(quad(V3(-T.hx, T.top - 0.5, T.z1), V3(-T.hx, T.top - 0.5, T.z0), V3(T.hx, T.top - 0.5, T.z0), V3(T.hx, T.top - 0.5, T.z1), [0, 0, lz, 0, lz, 156, 0, 156]), { mat: M.WOOD, color: oakD.clone().multiplyScalar(0.6) });
      }
      await ctx.yield();
      // -- the stove: a hearth plate, four feet, the fire box with its glazed door, a cornice, the upper chamber, the pipe --
      {
        const S = STOVE, fx = S.x + 75;
        b.add(roundBox(270, 3.5, 250, 1.5, 1), { m: TR(S.x + 34, 1.9, S.z), mat: M.BRASS, color: col3([0.5, 0.34, 0.15]), par: 0 });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(lathe([[8, 0], [10.5, 2], [10, 6], [6.5, 12], [6, 20], [9, 29], [12, 36]], 12), { m: TR(S.x + sx * 58, 3.5, S.z + sz * 58), mat: M.IRON, color: iron });
        b.add(roundBox(162, 10, 162, 3, 1), { m: TR(S.x, 43, S.z), mat: M.IRON, color: iron });
        b.add(roundBox(150, 186, 150, 9, 2), { m: TR(S.x, 140, S.z), mat: M.IRON, color: iron });
        for (const sz of [-1, 1]) for (const [y, h] of [[92, 62], [182, 86]]) b.add(roundBox(112, h, 5, 2.2, 1), { m: TR(S.x, y, S.z + sz * 75.5), mat: M.IRON, color: iron.clone().multiplyScalar(1.5) });
        b.add(roundBox(168, 11, 168, 4, 1), { m: TR(S.x, 238, S.z), mat: M.IRON, color: iron });
        b.add(roundBox(118, 58, 118, 8, 2), { m: TR(S.x - 6, 272, S.z), mat: M.IRON, color: iron });
        b.add(roundBox(132, 9, 132, 3.5, 1), { m: TR(S.x - 6, 305, S.z), mat: M.IRON, color: iron });
        await ctx.yield();
        // the door: an iron frame round nine mica panes with the coals behind them, hinges, a brass latch; the ash door under it
        b.add(roundBox(6, 112, 104, 2.5, 1), { m: TR(fx + 2, 160, S.z), mat: M.IRON, color: iron.clone().multiplyScalar(1.6) });
        b.add(quad(V3(fx + 5.4, 112, S.z + 44), V3(fx + 5.4, 112, S.z - 44), V3(fx + 5.4, 208, S.z - 44), V3(fx + 5.4, 208, S.z + 44), [0, 0, 3, 0, 3, 3, 0, 3]), { mat: M.EMBER, color: col3([4.2, 1.15, 0.2]) });
        for (const y of [128, 192]) b.add(roundBox(9, 12, 7, 2, 1), { m: TR(fx + 4, y, S.z + 54), mat: M.IRON, color: iron });
        b.add(new THREE.SphereGeometry(5.5, 10, 8), { m: TR(fx + 9, 160, S.z - 49), mat: M.BRASS, color: brass });
        b.add(roundBox(5, 34, 96, 2, 1), { m: TR(fx + 2, 76, S.z), mat: M.IRON, color: iron.clone().multiplyScalar(1.6) });
        for (let i = -2; i <= 2; i++) b.add(roundBox(2, 16, 7, 0.8, 1), { m: TR(fx + 4.6, 76, S.z + i * 15), mat: M.EMBER, color: col3([1.7, 0.4, 0.06]) });
        b.add(new THREE.SphereGeometry(4.5, 10, 8), { m: TR(fx + 8, 90, S.z), mat: M.BRASS, color: brass });
        await ctx.yield();
        // the pipe: up, an elbow, into the wall
        const pp = curvePts([V3(S.x - 28, 306, S.z), V3(S.x - 28, 420, S.z), V3(S.x - 28, 548, S.z), V3(S.x - 40, 588, S.z), V3(S.x - 76, 602, S.z), V3(WALL.w + 2, 604, S.z)], 22);
        b.add(tube(pp, () => 20, 14, { uvRadius: 2 }), { mat: M.IRON, color: iron.clone().multiplyScalar(1.25) });
        for (const y of [312, 470]) b.add(new THREE.TorusGeometry(21, 2.6, 6, 18), { m: TR(S.x - 28, y, S.z, Math.PI / 2, 0, 0), mat: M.IRON, color: iron });
        // the kettle on the upper chamber: copper, a brass lid, a spout, a hoop handle
        const kx = S.x + 26, kz = S.z + 8, ky = 309.5;
        b.add(lathe([[0.1, 0], [19, 0], [24, 5], [26, 15], [23, 27], [14, 34], [9, 36]], 22), { m: TR(kx, ky, kz), mat: M.BRASS, color: copper, par: 0 });
        b.add(lathe([[9.6, 35.4], [10, 37.5], [4, 39.5], [2.6, 43], [4.4, 46.5], [0.1, 48.5]], 14), { m: TR(kx, ky, kz), mat: M.BRASS, color: brass, par: 0 });
        b.add(tube(curvePts([V3(kx + 21, ky + 13, kz), V3(kx + 32, ky + 21, kz), V3(kx + 38, ky + 33, kz), V3(kx + 43, ky + 38, kz)], 8), (t) => 4.4 - 1.8 * t, 8), { mat: M.BRASS, color: copper });
        b.add(new THREE.TorusGeometry(23, 1.9, 6, 20, Math.PI), { m: TR(kx, ky + 30, kz), mat: M.BRASS, color: brass });
      }
    }
    await ctx.yield();
    {
      const b = furn;
      const wal = col3([0.2, 0.105, 0.045]), walD = col3([0.12, 0.062, 0.03]);
      // -- the bookcase on the far wall: carcass, plinth, cornice, five shelves of books --
      {
        const C = CASE, zb = WALL.n, zf = WALL.n + C.d, xc = (C.x0 + C.x1) / 2, w = C.x1 - C.x0;
        for (const x of [C.x0 + 6, C.x1 - 6]) b.add(roundBox(12, C.h, C.d, 2.5, 1), { m: TR(x, C.h / 2, zb + C.d / 2), mat: M.WOOD, color: wal });
        b.add(roundBox(w + 8, 34, C.d + 5, 3, 1), { m: TR(xc, 17, zb + C.d / 2 + 2.5), mat: M.WOOD, color: wal, uvSwap: true });
        b.add(roundBox(w + 26, 20, C.d + 16, 5, 1), { m: TR(xc, C.h + 8, zb + C.d / 2 + 5), mat: M.WOOD, color: wal, uvSwap: true });
        b.add(roundBox(w + 12, 8, C.d + 8, 2.5, 1), { m: TR(xc, C.h - 6, zb + C.d / 2 + 3), mat: M.WOOD, color: wal.clone().multiplyScalar(1.4), uvSwap: true });
        b.add(quad(V3(C.x0, 30, zb + 5), V3(C.x1, 30, zb + 5), V3(C.x1, C.h, zb + 5), V3(C.x0, C.h, zb + 5), [0, 0, w, 0, w, C.h, 0, C.h]), { mat: M.PLAIN, color: walD });
        const dyes = [pal[1], pal[2], pal[4], pal[5], pal[6], pal[1].clone().lerp(pal[2], 0.5), pal[3], pal[0].clone().multiplyScalar(0.75), pal[1]];
        const SH = 104, nSh = 5;
        for (let k = 0; k < nSh; k++) {
          const y0 = 34 + k * SH;
          b.add(roundBox(w - 20, 7, C.d - 6, 2, 1), { m: TR(xc, y0 - 3.5, zb + C.d / 2 + 1), mat: M.WOOD, color: wal.clone().multiplyScalar(1.15), uvSwap: true });
          await ctx.yield();
          let x = C.x0 + 14;
          const xEnd = C.x1 - 14;
          while (x < xEnd - 8) {
            const r = fr2();
            if (r < 0.1 && x < xEnd - 70) {
              // a few books lying flat, a small brass bowl on them
              const n = 2 + Math.floor(fr2() * 3); let yy = y0;
              for (let i = 0; i < n; i++) {
                const t = 9 + fr2() * 8, len = 52 + fr2() * 12, c = dyes[Math.floor(fr2() * dyes.length)].clone().multiplyScalar(0.6 + 0.5 * fr2());
                b.add(roundBox(len, t, 58, 1.2, 1), { m: TR(x + 32, yy + t / 2, zf - 34 - fr2() * 6, 0, (fr2() - 0.5) * 0.2, 0), mat: M.BOOK, color: c, par: fr2(), uvScale: [1 / 58, 1 / len] });
                yy += t;
              }
              if (fr2() < 0.6) b.add(lathe([[0.1, 0], [8, 0], [12, 4], [14, 10], [13.4, 10.6], [11, 5.5], [7, 2], [0.1, 1.6]], 14), { m: TR(x + 32, yy, zf - 36), mat: M.BRASS, color: brass, par: 0 });
              x += 68;
            } else if (r < 0.17) {
              x += 10 + fr2() * 16;
            } else {
              const t = 9 + fr2() * 13, h = (0.6 + 0.3 * fr2()) * (SH - 10), d = 50 + fr2() * 16, lean = fr2() < 0.12 ? (fr2() < 0.5 ? 0.14 : -0.14) : 0;
              const c = dyes[Math.floor(fr2() * dyes.length)].clone().multiplyScalar(0.55 + 0.6 * fr2());
              const g = roundBox(t, h, d, Math.min(1.6, t * 0.16), 1);
              const U = g.attributes.uv, P = g.attributes.position;
              for (let i = 0; i < U.count; i++) U.setXY(i, P.getX(i) / t + 0.5, P.getY(i) / h + 0.5);
              b.add(g, { m: TR(x + t / 2 + Math.abs(lean) * 12, y0 + h / 2, zf - 8 - d / 2, 0, 0, lean), mat: M.BOOK, color: c, par: fr2() });
              x += t + 0.8 + Math.abs(lean) * 22;
            }
          }
        }
        // on top: a brass samovar-jar and a stack of two books
        b.add(lathe([[0.1, 0], [22, 0], [26, 6], [20, 14], [28, 32], [34, 58], [28, 82], [16, 94], [14, 104], [20, 108], [20, 112], [0.1, 114]], 20), { m: TR(C.x0 + 92, C.h + 18, zb + 46), mat: M.BRASS, color: brass, par: 1 });
        b.add(roundBox(84, 15, 60, 1.6, 1), { m: TR(C.x1 - 96, C.h + 25.5, zb + 46, 0, 0.2, 0), mat: M.BOOK, color: pal[1].clone().multiplyScalar(0.9), par: 0.2, uvScale: [1 / 60, 1 / 84] });
        b.add(roundBox(70, 12, 52, 1.6, 1), { m: TR(C.x1 - 92, C.h + 39, zb + 46, 0, -0.15, 0), mat: M.BOOK, color: pal[2].clone().multiplyScalar(1.3), par: 0.7, uvScale: [1 / 52, 1 / 70] });
      }
      await ctx.yield();
      // -- the side chair against the far wall (its pair, the doorway of the flight, is built below as a mesh of its own) --
      await sideChair(b, TR(CHAIR2.x, 0, CHAIR2.z, 0, Math.PI, 0), wal, 16);
      await ctx.yield();
      addMesh(b.build(), mkMat(PROP_VERT, [8, 11]), 'furniture', false);
      await ctx.yield();
      const cb = makeBuilder();
      await sideChair(cb, TR(CHAIR3.x, 0, CHAIR3.z, 0, -CHAIR3.psi, 0), wal.clone().multiplyScalar(1.9), 28);
      await ctx.yield();
      addMesh(cb.build(), mkMat(PROP_VERT, [12, 14]), 'side-chair', false);
    }
    await ctx.yield();
    // -- cloth that stirs in the draught: curtains drawn to the sides of the lattice window, a portiere half across the door --
    {
      const b = makeBuilder();
      const cur = pal[1].clone().multiplyScalar(2.1), hem = pal[4].clone().multiplyScalar(1.5);
      const wz0 = WIN.zc - WIN.hz, wz1 = WIN.zc + WIN.hz;
      b.add(drape(150, 800, 30, 40, 9, 5.5, 20, cur, hem), { m: TR(WALL.e - 34, 836, wz0 + 22, 0, -Math.PI / 2, 0), mat: M.VELVET, par: -1 });
      await ctx.yield();
      b.add(drape(150, 800, 30, 40, 9, 5.5, 20, cur, hem), { m: TR(WALL.e - 34, 836, wz1 - 22, 0, -Math.PI / 2, 0), mat: M.VELVET, par: -1 });
      await ctx.yield();
      b.add(drape(190, 640, 34, 36, 10, 6.5, 24, cur, hem), { m: TR(366, 664, WALL.n + 30), mat: M.VELVET, par: -1 });
      await ctx.yield();
      // the portiere's brass rod, its finials and rings
      const rod = [V3(256, 668, WALL.n + 30), V3(584, 668, WALL.n + 30)];
      b.add(tube(rod, () => 3.6, 8, { uvRadius: 3.6 }), { mat: M.BRASS, color: brass });
      for (const x of [256, 584]) b.add(new THREE.SphereGeometry(7.5, 10, 8), { m: TR(x, 668, WALL.n + 30), mat: M.BRASS, color: brass });
      for (let i = 0; i < 9; i++) b.add(new THREE.TorusGeometry(6, 1.5, 5, 12), { m: TR(288 + i * 19.5, 666, WALL.n + 30, 0, Math.PI / 2, 0), mat: M.BRASS, color: brass });
      for (const x of [262, 578]) b.add(roundBox(5, 5, 28, 1.5, 1), { m: TR(x, 668, WALL.n + 16), mat: M.BRASS, color: brass });
      addMesh(b.build(), mkMat(PROP_VERT, [-1, -1], { side: THREE.DoubleSide, pen: 9 }), 'curtains', false);
    }
    await ctx.yield();
    // ---- by the armchair: the slippers (on some visits), the brass tray on its folding stand with a glass of tea, the lantern ----
    let borderProp = null;
    if (!tea) {
      const b = makeBuilder();
      const velvet = (variant === 'winter' ? pal[2] : pal[1]).clone().multiplyScalar(variant === 'winter' ? 1.5 : 1.0), lining = pal[0].clone().multiplyScalar(0.9), sole = col3([0.2, 0.12, 0.06]);
      const hwAt = (t) => t < 0.12 ? 10.5 * Math.sqrt(Math.max(1 - (1 - t / 0.12) ** 2, 0)) : t < 0.68 ? lerp(10.5, 14.5, smoothstep(0.3, 0.68, t)) - 1.6 * Math.exp(-(((t - 0.36) / 0.12) ** 2)) : 14.5 * Math.cos(((t - 0.68) / 0.32) * Math.PI / 2) ** 0.8;
      const yAt = (t) => 10 * smoothstep(0.72, 1, t) ** 2;
      const LEN = 80, NT = 36, NU = 8;
      const grid = (fn, nt, nu) => {
        const pos = [], uv = [], idx = [];
        for (let i = 0; i <= nt; i++) for (let j = 0; j <= nu; j++) { const r = fn(i / nt, j / nu); pos.push(r[0], r[1], r[2]); uv.push(r[3], r[4]); }
        for (let i = 0; i < nt; i++) for (let j = 0; j < nu; j++) { const a = i * (nu + 1) + j, c = a + nu + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        g.computeVertexNormals();
        return g;
      };
      const TH = 3.6;
      const one = (mx, m) => {
        const X = (x) => x * mx;
        // insole (top of the sole), the welt round it, the open heel's low wall, the vamp and its rolled throat
        b.add(grid((t, u) => [X((u * 2 - 1) * hwAt(t) * 0.96), yAt(t) + TH, -t * LEN, (u * 2 - 1) * hwAt(t), t * LEN], NT, NU), { m, mat: M.VELVET, color: lining, par: 0, shade: (x, y, z) => 1 });
        for (const sd of [-1, 1]) {
          b.add(grid((t, k) => [X(sd * hwAt(t) * (1.0 - 0.04 * k)), yAt(t) + TH * k, -t * LEN, k * TH, t * LEN], NT, 2), { m, mat: M.WOOD, color: sole });
          b.add(grid((t, k) => { const tt = t * 0.47; return [X(sd * hwAt(tt) * (1.0 + 0.05 * k)), yAt(tt) + TH + k * 6.5, -tt * LEN, k * 6.5, tt * LEN]; }, 16, 2), { m, mat: M.VELVET, color: velvet, par: 0 });
        }
        b.add(grid((t, u) => { const t0 = 0.36 + 0.2 * Math.sin(u * Math.PI), tt = t0 + t * (1 - t0), ang = u * Math.PI, w = hwAt(tt) * 1.03, H = 11.5 * (1 - smoothstep(0.5, 1.0, tt)) + 1.2; return [X(-Math.cos(ang) * w), yAt(tt) + TH * 0.6 + Math.sin(ang) * H, -tt * LEN, (u - 0.5) * 44, tt * LEN]; }, 22, 14), { m, mat: M.VELVET, color: velvet, par: 1 });
        const arc = []; for (let i = 0; i <= 20; i++) { const ang = (i / 20) * Math.PI, tt = 0.36 + 0.2 * Math.sin(ang), w = hwAt(tt) * 1.03, H = 11.5 * (1 - smoothstep(0.5, 1.0, tt)) + 1.2; arc.push(V3(X(-Math.cos(ang) * w), yAt(tt) + TH * 0.6 + Math.sin(ang) * H, -tt * LEN).applyMatrix4(m)); }
        b.add(tube(arc, () => 1.25, 7, { ply: 0.12 }), { mat: M.CORD, color: pal[4].clone().multiplyScalar(1.1) });
      };
      one(1, TR(SLIP.x - 40, PILE - 0.4, SLIP.z - 17, 0, -Math.PI / 2 + 0.08, 0));
      one(-1, TR(SLIP.x - 47, PILE - 0.4, SLIP.z + 20, 0, -Math.PI / 2 - 0.14, 0));
      borderProp = addMesh(b.build(), mkMat(PROP_VERT, [4, 6], { side: THREE.DoubleSide }), 'slippers');
    }
    await ctx.yield();
    let trayProp = null, steam = null;
    {
      const b = makeBuilder(), y0 = STAND.y, cx = STAND.x, cz = STAND.z, wal = col3([0.2, 0.105, 0.045]);
      // the folding stand: two crossed pairs of turned legs, rails under the tray, a stretcher through the crossings, brass feet
      for (const dz of [-27, 27]) {
        for (const sx of [-1, 1]) {
          const leg = [V3(cx + sx * 39, PILE - 0.4, cz + dz + sx * 1.6), V3(cx + sx * 20, y0 * 0.26, cz + dz + sx * 1.6), V3(cx, y0 * 0.52, cz + dz + sx * 1.6), V3(cx - sx * 20, y0 * 0.78, cz + dz + sx * 1.6), V3(cx - sx * 37, y0 - 3, cz + dz + sx * 1.6)];
          b.add(tube(leg, (t) => 3.3 + 0.9 * Math.exp(-(((t - 0.5) / 0.06) ** 2)) + 1.1 * Math.exp(-(((t - 0.07) / 0.03) ** 2)), 8, { uvRadius: 1 }), { mat: M.WOOD, color: wal, shade: (x, y) => 0.7 + 0.3 * smoothstep(5, 50, y) });
          b.add(new THREE.SphereGeometry(4.6, 10, 8), { m: TR(cx + sx * 39.5, PILE + 2.2, cz + dz + sx * 1.6, 0, 0, 0, 1, 0.8, 1), mat: M.BRASS, color: brass });
        }
        b.add(new THREE.SphereGeometry(3.2, 8, 6), { m: TR(cx, y0 * 0.52, cz + dz + Math.sign(dz) * 4.4), mat: M.BRASS, color: brass });
      }
      for (const sx of [-1, 1]) b.add(roundBox(5, 5, 66, 1.6, 1), { m: TR(cx + sx * 37, y0 - 2.6, cz), mat: M.WOOD, color: wal });
      b.add(tube([V3(cx, y0 * 0.52, cz - 29), V3(cx, y0 * 0.52, cz + 29)], () => 2.4, 8, { uvRadius: 1 }), { mat: M.WOOD, color: wal });
      await ctx.yield();
      // the tray, the glass of tea in its saucer, three lumps of sugar
      const ring = (r0, r1, y, n) => { const g = new THREE.RingGeometry(r0, r1, 48, n); const U = g.attributes.uv, P = g.attributes.position; for (let i = 0; i < U.count; i++) U.setXY(i, 0, Math.hypot(P.getX(i), P.getY(i))); return g; };
      b.add(ring(0.1, 42, 0, 6), { m: TR(cx, y0 + 2.2, cz, -Math.PI / 2, 0, 0), mat: M.BRASS, color: brass, par: 1 });
      b.add(lathe([[41.5, 2.2], [43.5, 3.2], [45.5, 6.5], [46.5, 7], [46, 5.4], [44.5, 1.2], [42, 0], [30, 0], [0.1, 0.4]], 48), { m: TR(cx, y0, cz), mat: M.BRASS, color: brass, par: 0 });
      const gx = cx + 8, gz = cz - 4, gy = y0 + 2.3;
      b.add(lathe([[5, 0], [11.5, 0.3], [13, 1.6], [13.2, 2.4], [11.5, 1.7], [5.5, 1.3]], 28), { m: TR(gx, gy, gz), mat: M.BRASS, color: col3([0.75, 0.72, 0.65]), par: 0 });
      const prof = [[5.6, 0], [7.3, 0.5], [7.6, 2.2], [6.6, 6.5], [5.7, 11.5], [5.9, 16], [7.1, 21.5], [8.2, 26]];
      b.add(lathe(prof, 26), { m: TR(gx, gy + 1.3, gz), mat: M.GLASS, color: col3([0.85, 0.3, 0.05]) });
      b.add(lathe([[8.2, 26], [8.6, 29.5], [8.7, 31]], 26), { m: TR(gx, gy + 1.3, gz), mat: M.GLASS, color: col3([0.5, 0.55, 0.55]) });
      b.add(new THREE.CircleGeometry(8.1, 26), { m: TR(gx, gy + 27.2, gz, -Math.PI / 2, 0, 0), mat: M.GLASS, color: col3([0.6, 0.18, 0.03]) });
      for (const [dx, dz, a] of [[-20, 12, 0.3], [-25, 6, 1.1], [-21, 5.5, 0.7]]) b.add(roundBox(4.6, 4.6, 4.6, 0.8, 1), { m: TR(cx + dx, y0 + 4.5, cz + dz, 0, a, 0), mat: M.PLAIN, color: col3([0.75, 0.73, 0.68]) });
      await ctx.yield();
      // the lantern: a brass font, a glass with the flame in it, four guard wires, a vented cap and its carrying ring
      const lx = LAMP.x, lz = LAMP.z, ly = PILE - 0.5;
      b.add(lathe([[0.1, 0], [23, 0], [25.5, 3], [24.5, 8], [17, 12], [13.5, 18], [16, 22], [20.5, 24], [20.5, 27.5], [15, 28.5]], 24), { m: TR(lx, ly, lz), mat: M.BRASS, color: brass, par: 1 });
      b.add(lathe([[14.5, 0], [20.5, 7], [23.5, 19], [22.5, 31], [17.5, 43], [12.5, 51]], 20), { m: TR(lx, ly + 28, lz), mat: M.LAMP, color: col3([1.45, 0.58, 0.14]), uvScale: [1, 1 / 51] });
      b.add(lathe([[12.5, 78.5], [17, 80.5], [18, 85], [12, 91], [7, 96], [8, 99], [3, 102], [0.1, 102.5]], 18), { m: TR(lx, ly, lz), mat: M.BRASS, color: brass, par: 0 });
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + 0.6, ca = Math.cos(a), sa = Math.sin(a);
        const w = curvePts([V3(lx + ca * 20.5, ly + 26, lz + sa * 20.5), V3(lx + ca * 26.5, ly + 40, lz + sa * 26.5), V3(lx + ca * 27.5, ly + 55, lz + sa * 27.5), V3(lx + ca * 23, ly + 70, lz + sa * 23), V3(lx + ca * 16.5, ly + 80.5, lz + sa * 16.5)], 10);
        b.add(tube(w, () => 1.5, 6, { uvRadius: 1.5 }), { mat: M.BRASS, color: brass });
      }
      b.add(new THREE.TorusGeometry(15, 1.7, 6, 18, Math.PI), { m: TR(lx, ly + 99, lz, 0, 0.6, 0), mat: M.BRASS, color: brass });
      trayProp = addMesh(b.build(), mkMat(PROP_VERT, [11, 12], { side: THREE.DoubleSide }), 'tray-and-lantern');
      await ctx.yield();
      // steam: a few upright sheets with a scrolling wisp over the glass, and a taller plume from the kettle's spout
      const sheets = (px, py, pz, rad, hgt, n0) => {
        const pos = [], uv = [], idx = [];
        for (let k = 0; k < n0; k++) {
          const a = (k / n0) * Math.PI, o = pos.length / 3, c = Math.cos(a) * rad, s = Math.sin(a) * rad;
          pos.push(px - c, py, pz - s, px + c, py, pz + s, px + c, py + hgt, pz + s, px - c, py + hgt, pz - s); uv.push(0, 0, 1, 0, 1, 1, 0, 1);
          idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        return g;
      };
      const steamMat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, { uOrigin2: { value: V3(0, 0, 0) } }), vertexShader: STEAM_VERT, fragmentShader: steamFrag(hero.glsl), fog: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      steam = addMesh(sheets(gx, gy + 27, gz, 15, 73, 4), steamMat, 'steam');
      steam.renderOrder = 3;
      const ks = addMesh(sheets(STOVE.x + 71, 352, STOVE.z + 8, 36, 190, 4), steamMat, 'kettle-steam');
      ks.renderOrder = 3;
    }
    await ctx.yield();

    // a parametric skin: fn(s, v) -> [x, y, z, u, v, weight]; wound so its normals point out
    const skin = (fn, ns, nv) => {
      const pos = [], uv = [], sw = [], idx = [];
      for (let i = 0; i <= ns; i++) for (let j = 0; j <= nv; j++) { const r = fn(i / ns, j / nv); pos.push(r[0], r[1], r[2]); uv.push(r[3], r[4]); sw.push(r[5] || 0); }
      for (let i = 0; i < ns; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, c = a + nv + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('sw', new THREE.Float32BufferAttribute(sw, 1)); g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    const bell = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

    // ---- the cat, asleep on the north-west corner, seen from behind ----
    {
      const b = makeBuilder();
      const base = coat === 'black' ? col3([0.02, 0.019, 0.026]) : coat === 'white' ? col3([0.56, 0.54, 0.5]) : col3([0.29, 0.225, 0.165]);
      const low = (x, y) => 0.55 + 0.45 * smoothstep(0, 24, y);
      const body = (s, v) => {
        const a = v * Math.PI * 2, e = clamp(2 * s - 1, -0.992, 0.992), rr = Math.pow(1 - e * e, 0.42);
        const ry = 30 * rr * (1 + 0.1 * bell(s, 0.27, 0.2) - 0.05 * bell(s, 0.62, 0.15)), rz = 45 * rr * (1 + 0.08 * bell(s, 0.27, 0.22));
        const yy = ry - Math.cos(a) * ry, y = yy < 5 ? 0.8 + yy * 0.25 : yy - 2.95;
        const z = 5 - 20 * e * e + Math.sin(a) * rz * (1 + 0.14 * (1 - smoothstep(0, 16, yy)));
        return [-64 + 128 * s, y, z, -64 + 128 * s, v * 200, bell(s, 0.5, 0.28) * smoothstep(0.15, 0.75, (1 - Math.cos(a)) / 2)];
      };
      const ball = (cx, cyy, cz, rx, ry, rz, uvr) => (s, v) => {
        const a = v * Math.PI * 2, e = clamp(2 * s - 1, -0.992, 0.992), rr = Math.sqrt(1 - e * e);
        return [cx + e * rx, cyy - Math.cos(a) * ry * rr, cz + Math.sin(a) * rz * rr, cx + e * rx, v * uvr, 0];
      };
      const A0 = (x, y, z, w) => [w, 0, 0];
      b.add(skin(body, 44, 30), { mat: M.FUR, color: base, shade: low, anim: A0 });
      await ctx.yield();
      // the haunch and the shoulder stand out of the loaf, with a saddle between them
      b.add(skin(ball(-37, 30, 15, 31, 31, 36, 150), 18, 16), { mat: M.FUR, color: base, shade: low, anim: (x, y, z) => [0.5 * smoothstep(20, 44, y), 0, 0] });
      b.add(skin(ball(19, 33, 3, 21, 25, 31, 140), 16, 14), { mat: M.FUR, color: base, shade: low, anim: (x, y, z) => [0.7 * smoothstep(20, 44, y), 0, 0] });
      b.add(skin(ball(44, 36, -26, 19, 17, 18.5, 110), 18, 16), { mat: M.FUR, color: base, shade: (x, y) => 0.7 + 0.3 * smoothstep(20, 50, y) });
      await ctx.yield();
      // ears: soft leaves with a rounded tip, thick at the root
      for (const [ex, ez, lean] of [[35, -22, 0.24], [53, -31, -0.2]]) {
        const g = skin((s, v) => {
          const a = v * Math.PI * 2, hw = 8.8 * Math.pow(Math.max(1 - s * s, 0), 0.6) * (1 - 0.15 * s) + 0.3, th = 3.4 * (1 - 0.6 * s) + 0.3;
          return [Math.cos(a) * hw, 17 * s, Math.sin(a) * th * (Math.sin(a) > 0 ? 0.55 : 1), Math.cos(a) * hw + ex, s * 30, 0];
        }, 8, 12);
        b.add(g, { m: TR(ex, 49.5, ez, -0.12, 0.35, lean), mat: M.FUR, color: base.clone().multiplyScalar(0.85), anim: (x, y) => [0, 0, smoothstep(3, 17, y) * (lean > 0 ? 1 : 0.5)] });
      }
      const tailPts = curvePts([V3(-58, 10, 2), V3(-66, 6.8, 24), V3(-55, 6.5, 46), V3(-28, 6.4, 59), V3(6, 6.3, 63), V3(36, 6.3, 59), V3(58, 6.3, 47), V3(71, 6.3, 31)], 40);
      const tr = (t) => 6.3 * (1 - 0.2 * t) * Math.sqrt(Math.max(1 - smoothstep(0.9, 1, t) ** 2, 0.03));
      // the last of the tail is pale (a cream or white tip), so the tail reads when it lifts, whatever the coat
      const tailGeo = tube(tailPts, tr, 10, { sway: (t) => t, uvRadius: 6 });
      {
        const S = tailGeo.attributes.sw, cv = new Float32Array(S.count * 3);
        const tipC = coat === 'black' ? col3([0.5, 0.48, 0.46]) : coat === 'white' ? col3([0.42, 0.38, 0.34]) : col3([0.52, 0.44, 0.31]);
        for (let i = 0; i < S.count; i++) { const k = smoothstep(0.7, 0.82, S.getX(i)); cv[i * 3] = lerp(base.r, tipC.r, k); cv[i * 3 + 1] = lerp(base.g, tipC.g, k); cv[i * 3 + 2] = lerp(base.b, tipC.b, k); }
        tailGeo.setAttribute('cv', new THREE.Float32BufferAttribute(cv, 3));
      }
      b.add(tailGeo, { mat: M.FUR, uvSwap: true, uvScale: [12, 36], anim: (x, y, z, w) => [0, w, 0], shade: (x, y) => 0.7 + 0.3 * smoothstep(1, 10, y) });
      await ctx.yield();
      // the skin, and six shells of fur over it (the same geometry pushed out along its normals, cut into tapering tufts)
      const catGeo = b.build(true);
      {
        // where each ring of the tail goes when it sweeps: out behind the cat to the west, lifted, the tip curling up
        const A = catGeo.attributes.aAnim, sw = new Float32Array(A.count * 3);
        for (let i = 0; i < A.count; i++) {
          const t = A.getY(i); if (t <= 0) continue;
          const r = tailPts[Math.min(40, Math.round(t * 40))];
          sw[i * 3] = -58 - 150 * t - r.x; sw[i * 3 + 1] = 10 + 66 * Math.pow(t, 0.8) + 18 * smoothstep(0.7, 1, t) - r.y; sw[i * 3 + 2] = 2 + 124 * t * (1 - 0.3 * t) - r.z;
        }
        catGeo.setAttribute('aSweep', new THREE.Float32BufferAttribute(sw, 3));
      }
      await ctx.yield();
      for (let k = 0; k <= 6; k++) {
        const matCat = new THREE.ShaderMaterial({
          uniforms: Object.assign(fogU(), HU, roomU, { uOccSkip: { value: new THREE.Vector2(1, 3) }, uPenK: SOFT, uShell: { value: k / 6 } }), vertexShader: CAT_VERT, fragmentShader: FRAG, fog: true });
        const cat = addMesh(catGeo, matCat, k ? 'cat-fur' + k : 'cat', false);
        cat.position.set(CAT.x, PILE - 0.7, CAT.z); cat.rotation.y = CAT.yaw;
      }
    }
    await ctx.yield();

    // ---- the rolled runner over the far end of the long canal: back of the weave outside, the spiral at its end ----
    {
      const TURNS = 5, TH = 3.3, PITCH = (ROLL.r - TH - ROLL.hollow) / TURNS;
      const PH = -Math.PI / 2 - 0.35;                        // the free outer edge lies low on the left
      const ri = (th) => ROLL.hollow + PITCH * th / (2 * Math.PI);
      const arc = (th) => ROLL.hollow * th + PITCH * th * th / (4 * Math.PI);
      const jit = (th) => 1.3 * Math.sin(th * 0.7 + 1) + 0.7 * Math.sin(th * 2.3);
      const at = (th, r, z) => [Math.cos(PH + th) * r, ROLL.y + Math.sin(PH + th) * r, z];
      const TMAX = TURNS * 2 * Math.PI;
      const sheet = (fn, ni, nj, inward) => {
        const pos = [], nor = [], uv = [], cv = [], idx = [];
        for (let i = 0; i <= ni; i++) for (let j = 0; j <= nj; j++) { const r = fn(i / ni, j / nj); pos.push(r.p[0], r.p[1], r.p[2]); nor.push(r.n[0], r.n[1], r.n[2]); uv.push(r.uv[0], r.uv[1]); const c = r.c || [1, 1, 1]; cv.push(c[0], c[1], c[2]); }
        for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) { const a = i * (nj + 1) + j, c = a + nj + 1; if (inward) idx.push(a, c, a + 1, a + 1, c, c + 1); else idx.push(a, a + 1, c, a + 1, c + 1, c); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('cv', new THREE.Float32BufferAttribute(cv, 3)); g.setIndex(idx);
        return g;
      };
      const radial = (th, s = 1) => [Math.cos(PH + th) * s, Math.sin(PH + th) * s, 0];
      // outside: the last turn, showing the back of the weave (uv = carpet metres)
      const outer = sheet((i, j) => {
        const th = TMAX - (2 * Math.PI + 0.3) * (1 - i), zf = ROLL.z0 + jit(th), z = lerp(zf, ROLL.z1, j);
        return { p: at(th, ri(th) + TH, z), n: radial(th), uv: [240 - (ROLL.z0 - z), -330 + arc(th)] };
      }, 84, 10, false);
      const mo = addMesh(outer, hero.makeWeaveMaterial({ back: true, occSkip: [0, 1], side: THREE.FrontSide, penumbra: 5 }), 'roll-back');
      mo.geometry.computeBoundingSphere();
      await ctx.yield();
      const b = makeBuilder();
      const NS = 300;
      // the end: the spiral ribbon (pile fringe inside, ivory foundation outside), stepped a little turn by turn
      b.add(sheet((i, j) => { const th = TMAX * i; return { p: at(th, ri(th) + TH * j, ROLL.z0 + jit(th)), n: [0, 0, 1], uv: [arc(th), j] }; }, NS, 1, false), { mat: M.SPIRAL });
      const ivd = [pal[0].r * 0.5, pal[0].g * 0.5, pal[0].b * 0.5], pd = [pal[1].r * 0.55, pal[1].g * 0.55, pal[1].b * 0.55];
      b.add(sheet((i, j) => { const th = TMAX * i, zf = ROLL.z0 + jit(th); return { p: at(th, ri(th) + TH, zf - 7 * j), n: radial(th), uv: [arc(th), j * 7], c: ivd }; }, NS, 1, false), { mat: M.PLAIN });
      b.add(sheet((i, j) => { const th = TMAX * i, zf = ROLL.z0 + jit(th); return { p: at(th, ri(th), zf - 7 * j), n: radial(th, -1), uv: [arc(th), j * 7], c: pd }; }, NS, 1, true), { mat: M.PLAIN });
      { const g = new THREE.RingGeometry(ROLL.hollow - 0.3, ROLL.r + 0.5, 56, 1); b.add(g, { m: TR(0, ROLL.y, ROLL.z0 - 6.5), mat: M.HOLLOW, color: col3([0.012, 0.01, 0.01]) }); }
      { const g = new THREE.CircleGeometry(ROLL.hollow + 5, 24); b.add(g, { m: TR(0, ROLL.y, ROLL.z0 - 80), mat: M.HOLLOW, color: col3([0.004, 0.004, 0.005]) }); }
      await ctx.yield();
      // the hollow: the pile of the innermost turn, falling into the dark
      b.add(sheet((i, j) => {
        const th = (2 * Math.PI + 0.25) * i, zf = ROLL.z0 + jit(th), z = lerp(zf, ROLL.z0 - 82, j * j), k = Math.exp(-(zf - z) / 16);
        return { p: at(th, ri(th), z), n: radial(th, -1), uv: [arc(th), zf - z], c: [pal[1].r * 0.5 * k + 0.004, pal[1].g * 0.5 * k + 0.004, pal[1].b * 0.5 * k + 0.005] };
      }, 40, 7, true), { mat: M.HOLLOW });
      await ctx.yield();
      // the madder selvedge, whipped along the edge of every turn
      const rp = []; for (let i = 0; i <= 330; i++) { const th = TMAX * i / 330, q = at(th, ri(th) + TH - 0.35, ROLL.z0 + jit(th) + 0.4); rp.push(V3(q[0], q[1], q[2])); }
      b.add(tube(rp, () => 0.62, 6, { uvRadius: 0.62 }), { mat: M.CORD, color: pal[1].clone().multiplyScalar(1.05) });
      await ctx.yield();
      addMesh(b.build(), mkMat(PROP_VERT, [0, 1]), 'roll-end');
    }
    await ctx.yield();

    // ---- THE RISING GARDEN: what stands up out of the pile in mid-flight (u 0.25-0.79) ----
    // Each woven cypress and blossoming tree has a wool one lying flat and hidden at its own place. They rise as the camera
    // arrives (nearest first), stand while it flies in through the border gate, past the orchard, up the avenue of cypresses
    // along the south canal, over the orchard and down the long glide to the pool, and have settled back into the pile by u 0.79. riseArr[i] is how far
    // thing i stands (0..1 and a little over as it springs up); the hero lays their shadows from uGT.
    const gr = rng.fork('rising-garden');
    const riseArr = new Float32Array(NGO), riseU = { value: riseArr };
    const GT = HU.uGT.value, GOBJ = [];
    const IDX = { basin: 40, beds: 41, gate: 42, lamps: 43 };
    for (const [qx, qz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const sched = (x, z) => qz > 0 ? { up: 0.283 + Math.hypot(x - 190, z - 252) / 3000, dr: gr() } : { up: 0.425 + (Math.abs(z) - 150) / 1500 + gr() * 0.01, dr: gr() };
      for (const ax of [27, 153]) for (const az of [160, 200]) GOBJ.push(Object.assign({ kind: 'cypress', x: qx * ax, z: qz * az, h: ax < 90 ? 66 : 56, r: ax < 90 ? 7.8 : 7.4 }, sched(qx * ax, qz * az)));
    }
    for (const [qx, qz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const sched = (x, z) => qz > 0 ? { up: 0.283 + Math.hypot(x - 190, z - 252) / 3000, dr: gr() } : { up: 0.425 + (Math.abs(z) - 150) / 1500 + gr() * 0.01, dr: gr() };
      for (const ax of [72, 108]) for (const az of [152.5, 182.5, 212.5]) GOBJ.push(Object.assign({ kind: 'tree', x: qx * ax, z: qz * az, h: 44 + gr.range(-3, 4), r: 12.5 }, sched(qx * ax, qz * az)));
    }
    GOBJ.forEach((o, i) => { o.i = i; o.ph = gr() * 6.28; GT[i].set(o.x, o.z, 0, o.kind === 'cypress' ? o.r * 0.9 : -o.r); });
    const BIRD_TREE = GOBJ.find((o) => o.kind === 'tree' && o.x === 72 && o.z === 212.5);
    // the border gateway (built further down): where it stands, and the centre line of its pointed arch as [across, height]
    const GATE = { x: 100, z: 248.5, nx: -1, nz: 0, a: 15, spring: 34, wd: 8, dp: 7.5 };
    const gateLine = [];
    {
      const Gt = GATE, R = 1.35 * Gt.a, fm = Math.acos(0.35 / 1.35);
      for (let i = 0; i <= 8; i++) gateLine.push([-Gt.a, (Gt.spring * i) / 8]);
      for (let i = 1; i <= 12; i++) { const f = (fm * i) / 12; gateLine.push([0.35 * Gt.a - R * Math.cos(f), Gt.spring + R * Math.sin(f)]); }
      for (let i = 11; i >= 0; i--) { const f = (fm * i) / 12; gateLine.push([-0.35 * Gt.a + R * Math.cos(f), Gt.spring + R * Math.sin(f)]); }
      for (let i = 7; i >= 0; i--) gateLine.push([Gt.a, (Gt.spring * i) / 8]);
    }
    await ctx.yield();
    const matGarden = [];
    {
      const b = makeBuilder(), bt = makeBuilder();
      const trunkC = col3([0.2, 0.115, 0.055]);
      for (const o of GOBJ) {
        const A = () => [o.x, o.z, o.i];
        if (o.kind === 'cypress') {
          // a flame of pile: a full skirt, a long taper, flounces every few metres, a short trunk under it
          const prof = [[0.2, 3.2]];
          const NR = o.z > 0 ? 22 : 14;
          for (let k = 0; k <= NR; k++) {
            const t = k / NR, y = 3.4 + (o.h - 3.4) * t;
            const sh = t < 0.26 ? 0.6 + 0.4 * Math.sin((t / 0.26) * Math.PI / 2) : Math.pow(Math.max(1 - Math.pow((t - 0.26) / 0.74, 1.55), 0), 0.85);
            prof.push([Math.max(o.r * sh * (1 + 0.08 * Math.sin(y * 1.31 + o.ph)), 0.25), y]);
          }
          const NS = o.z > 0 ? 14 : 10;
          const g = lathe(prof, NS), U = g.attributes.uv, P = g.attributes.position, nP = prof.length;
          for (let i = 0; i < U.count; i++) U.setXY(i, (Math.floor(i / nP) / NS) * 57.6, P.getY(i));   // six columns of feathers round it, whatever its girth
          b.add(g, { m: TR(o.x, 0, o.z, 0, o.ph, 0), mat: M.PILE, par: 0, anim: A });
          bt.add(new THREE.CylinderGeometry(2.2, 2.9, 5, 10, 1), { m: TR(o.x, 2.5, o.z), mat: M.CORD, color: trunkC, uvScale: [4, 3], anim: A });
        } else {
          // a blossoming tree: a plied trunk that leans a little, four boughs into the crown (the crown itself is pom-poms)
          const lean = [Math.cos(o.ph) * 2.2, Math.sin(o.ph) * 2.2], top = o.h - 14;
          const tp = curvePts([V3(o.x, 0.5, o.z), V3(o.x + lean[0] * 0.5, top * 0.35, o.z + lean[1] * 0.5), V3(o.x + lean[0], top * 0.7, o.z + lean[1]), V3(o.x + lean[0] * 0.8, top, o.z + lean[1] * 0.8)], 10);
          bt.add(tube(tp, (t) => 2.7 - 1.0 * t + 1.2 * Math.exp(-((t / 0.08) ** 2)), 8, { ply: 0.16, uvRadius: 2.2 }), { mat: M.CORD, color: trunkC, anim: A });
          for (let k = 0; k < 4; k++) {
            const a = o.ph + k * 1.571 + 0.4, ca = Math.cos(a), sa = Math.sin(a);
            const bp = curvePts([V3(o.x + lean[0] * 0.75, top * 0.62, o.z + lean[1] * 0.75), V3(o.x + lean[0] + ca * 3.4, top * 0.86, o.z + lean[1] + sa * 3.4), V3(o.x + lean[0] + ca * 7.5, top + 1.5, o.z + lean[1] + sa * 7.5)], 5);
            bt.add(tube(bp, (t) => 1.5 - 0.6 * t, 6, { ply: 0.16, uvRadius: 1.3 }), { mat: M.CORD, color: trunkC, anim: A });
          }
        }
        if ((o.i & 7) === 7) await ctx.yield();
      }
      await ctx.yield();
      // the fountain's basin on the rosette island: a wide bowl, a stem, a smaller bowl and a spout, all in the rosette's dyes
      {
        const g = lathe([[0.2, 0.3], [21, 0.3], [21.6, 2.6], [19.5, 5.4], [10, 6.8], [6.2, 9.6], [6.4, 13.6], [12.6, 17.2], [15.2, 20.4], [14.4, 21.2], [11, 18.8], [4.2, 17.8], [3.3, 22], [4.4, 24], [3, 25.6], [0.2, 26]], 24);
        const U = g.attributes.uv; for (let i = 0; i < U.count; i++) U.setX(i, (Math.floor(i / 16) / 24) * 144);
        b.add(g, { mat: M.PILE, par: 1, anim: () => [0, 0, IDX.basin] });
      }
      const geo = b.build(true), geoT = bt.build(true);
      geo.boundingSphere = new THREE.Sphere(V3(0, 30, 0), 420); geoT.boundingSphere = geo.boundingSphere;
      // the skin and three shells of pile over it; the trunks and boughs once
      for (let k = 0; k <= 4; k++) {
        const m = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, roomU, { uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: SOFT, uShell: { value: k > 3 ? 0 : k / 3 }, uRise: riseU, uCordWarm: { value: col3(L.cordWarm.map((v) => v * 0.5)) } }),
          vertexShader: GARDEN_VERT, fragmentShader: FRAG, fog: true });
        const mesh = addMesh(k > 3 ? geoT : geo, m, k > 3 ? 'garden-trunks' : k ? 'garden-pile' + k : 'garden', false); mesh.visible = false; matGarden.push(mesh);
      }
    }
    await ctx.yield();
    // ---- the pom-poms: crowns of leaves and blossoms, the saffron tips of the cypresses, the flowers of the swollen beds ----
    let pomMesh = null;
    {
      const foot = [], off = [], tint = [], cn = [];
      const put = (o, idx, kind, x, y, z, rad, c, k, nx, ny, nz, ao) => { foot.push(o.x, o.z, idx, kind); off.push(x, y, z, rad); tint.push(c.r * k, c.g * k, c.b * k, gr()); cn.push(nx, ny, nz, ao); };
      const leafA = variant === 'winter' ? pal[2].clone().lerp(pal[3], 0.42).multiplyScalar(1.25) : variant === 'night' ? pal[5].clone().lerp(pal[2], 0.3).multiplyScalar(1.2) : pal[5].clone().multiplyScalar(1.05);
      const leafB = variant === 'winter' ? pal[3].clone().lerp(pal[0], 0.35) : variant === 'night' ? pal[5].clone().lerp(pal[3], 0.3) : pal[5].clone().lerp(pal[4], 0.22);
      const bloomC = pal[0].clone().multiplyScalar(1.1), lampC2 = pal[4].clone().multiplyScalar(1.2), tipC = pal[4].clone().multiplyScalar(1.15);
      const tmp = new THREE.Color();
      for (const o of GOBJ) {
        if (o.kind === 'cypress') { put(o, o.i, 0, 0, o.h + 0.6, 0, 2.3, tipC, 1, 0, 1, 0, 1); continue; }
        const near = o.z > 0 && o.x > 0, nLeaf = near ? 50 : 32, nBl = near ? 40 : 22;
        const lx = Math.cos(o.ph) * 1.8, lz = Math.sin(o.ph) * 1.8, cy0 = o.h - 12.5, RX = o.r * 0.86, RY = o.r * 0.7;
        put(o, o.i, 0, lx, cy0, lz, o.r * 0.74, leafA, 0.62, 0, 1, 0, 0.6);                       // the heart of the crown, in shade
        for (let k = 0; k < nLeaf; k++) {
          // leaves: balls spread evenly over a lumpy ball (a spiral of points), none underneath
          const t = (k + 0.5) / nLeaf, ny = 1 - 1.72 * t, rr = Math.sqrt(Math.max(1 - ny * ny, 0)), a = k * 2.39996 + o.ph;
          const nx = Math.cos(a) * rr, nz = Math.sin(a) * rr, lump = 0.9 + 0.2 * gr();
          put(o, o.i, 0, lx + nx * RX * lump, cy0 + ny * RY * lump, lz + nz * RX * lump, gr.range(3.5, 5.1), tmp.copy(leafA).lerp(leafB, gr() * gr()), gr.range(0.85, 1.12), nx, ny, nz, 0.55 + 0.45 * smoothstep(-0.7, 0.5, ny));
        }
        for (let k = 0; k < nBl; k++) {
          // blossoms: smaller balls that stand out of the leaves, on the top and the flanks
          const ny = gr.range(-0.3, 0.95), rr = Math.sqrt(1 - ny * ny), a = gr() * 6.2832;
          const nx = Math.cos(a) * rr, nz = Math.sin(a) * rr, lump = 1.2 + 0.1 * gr();
          const lamp = false;                                  // (before dawn some blossoms were lamps: they showed only as panels behind the crowns; the lamps now stand beside the canals, below)
          put(o, o.i, lamp ? 3 : 1, lx + nx * RX * lump, cy0 + ny * RY * lump, lz + nz * RX * lump, lamp ? 4.3 : gr.range(3.2, 4.3), lamp ? lampC2 : bloomC, 1, nx, ny, nz, 0.75 + 0.25 * smoothstep(-0.4, 0.5, ny));
        }
      }
      await ctx.yield();
      // the beds: a flower head on every coloured stripe, standing on the swollen bed
      const bandC = [pal[1].clone().multiplyScalar(1.15), pal[4].clone().multiplyScalar(1.1), pal[0].clone().multiplyScalar(1.05)], BED = { x: 0, z: 0 };
      const flower = (x, z, band) => { foot.push(x, z, IDX.beds, 2); off.push(0, gr.range(1.6, 4.6), 0, gr.range(1.45, 2.15)); const c = bandC[band], k = gr.range(0.88, 1.12); tint.push(c.r * k, c.g * k, c.b * k, gr()); cn.push(0.25, 0.9, 0.1, 0.92); };
      for (const [qx, qz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        for (let n = 10; n < 16; n++) for (let bnd = 0; bnd < 3; bnd++) {
          const az = n * 21.6 + 1.8 + bnd * 7.2;
          if (az < 242 || az > 316) continue;
          for (const x0 of [24, 68, 112]) for (let ax = x0 + 2.2; ax < x0 + 36.5; ax += 3.5) flower(qx * (ax + gr.range(-0.6, 0.6)), qz * (az + gr.range(-0.7, 0.7)), bnd);
        }
        for (let n = 5; n < 9; n++) for (let bnd = 0; bnd < 3; bnd++) {
          const ax = n * 21.6 + 1.8 + bnd * 7.2;
          if (ax < 114 || ax > 170) continue;
          for (const z0 of [22, 72]) for (let az = z0 + 2.2; az < z0 + 42.5; az += 3.5) flower(qx * (ax + gr.range(-0.7, 0.7)), qz * (az + gr.range(-0.6, 0.6)), bnd);
        }
        await ctx.yield();
      }
      // the border gate's edges: a row of tufts along each of its four arrises, in the guard stripes' dyes, so that the
      // arch is a thick piece of pile and not a bent strip
      {
        const Gt = GATE, lx = Gt.nz, lz = -Gt.nx, n = gateLine.length, gc = [pal[0].clone().multiplyScalar(1.05), pal[1].clone().multiplyScalar(1.15), pal[2].clone().multiplyScalar(1.3), pal[4].clone().multiplyScalar(1.1)];
        let S = 0, next = 0, kk = 0;
        for (let i = 0; i < n; i++) {
          const pt = gateLine[i], q0 = gateLine[Math.max(i - 1, 0)], q1 = gateLine[Math.min(i + 1, n - 1)];
          let tx = q1[0] - q0[0], ty = q1[1] - q0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          if (i > 0) S += Math.hypot(pt[0] - gateLine[i - 1][0], pt[1] - gateLine[i - 1][1]);
          if (S < next) continue;
          next = S + 2.5; kk++;
          for (const ar of [-1, 1]) for (const dn of [-1, 1]) {
            const ac = pt[0] - ty * ar * Gt.wd * 0.5, y = pt[1] + tx * ar * Gt.wd * 0.5, d = dn * Gt.dp * 0.5;
            foot.push(Gt.x, Gt.z, IDX.gate, 4); off.push(lx * ac + Gt.nx * d, Math.max(y, 1.2), lz * ac + Gt.nz * d, gr.range(1.2, 1.6));
            const c = gc[(kk + (ar > 0 ? 0 : 2)) % 4], k = gr.range(0.9, 1.1); tint.push(c.r * k, c.g * k, c.b * k, gr());
            cn.push(Gt.nx * dn * 0.6 - ty * ar * 0.6, 0.5 + tx * ar * 0.5, Gt.nz * dn * 0.6, 0.9);
          }
        }
      }
      // before dawn: the woven lamps along the canals stand up with the garden, each a ring of glowing knots on a stem of
      // saffron wool over its own woven ring, whose halo on the indigo ground is its pool of light
      if (variant === 'night') {
        const lampAt = (x, z) => { foot.push(x, z, IDX.lamps, 5); off.push(0, 15.5 + gr.range(-0.8, 0.8), 0, 6.3); tint.push(lampC2.r, lampC2.g, lampC2.b, gr()); cn.push(0, 1, 0, 1); };
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          for (let k = sz > 0 ? 1 : 0; k < 6; k++) lampAt(sx * 17.4, sz * (126 + 36 * k));   // (none at the south avenue's end, where the camera turns close over the canal)
          for (let k = 0; k < 2; k++) lampAt(sx * (126 + 36 * k), sz * 17.4);
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aFoot', new THREE.InstancedBufferAttribute(new Float32Array(foot), 4));
      g.setAttribute('aOff', new THREE.InstancedBufferAttribute(new Float32Array(off), 4));
      g.setAttribute('aTint', new THREE.InstancedBufferAttribute(new Float32Array(tint), 4));
      g.setAttribute('aCN', new THREE.InstancedBufferAttribute(new Float32Array(cn), 4));
      g.instanceCount = foot.length / 4;
      const bloomB = variant === 'night' ? pal[4].clone().multiplyScalar(1.1) : pal[1].clone().multiplyScalar(variant === 'winter' ? 1.3 : 1.2);
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, { uOrigin: roomU.uOrigin, uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: SOFT, uRise: riseU, uBloomA: { value: bloomC }, uBloomB: { value: bloomB },
        uHeart: { value: pal[4].clone().multiplyScalar(1.25) }, uLampK: { value: variant === 'night' ? 1 : 0 } }), vertexShader: pomVert(hero.glsl), fragmentShader: pomFrag(hero.glsl), fog: true });
      pomMesh = addMesh(g, mat, 'garden-pompoms', false); pomMesh.visible = false;
    }
    await ctx.yield();
    // ---- the fountain of looping silk thread, over the basin on the rosette island ----
    const fountU = { value: 0 };
    let silkMesh = null;
    {
      const RAD = 5, SEG = 44, pos = [], uv = [], idx = [];
      for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) { const a = (j / RAD) * Math.PI * 2; pos.push(Math.cos(a), i / SEG, Math.sin(a)); uv.push(j / RAD, i / SEG); }
      for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, c = a + RAD + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
      const j1 = [], j2 = [], j3 = [];
      const jet = (az, vr, vy, y0, r0, loop, turns, yEnd, thick, delay) => { j1.push(az, vr, vy, gr() * 6.28); j2.push(y0, r0, loop, turns); j3.push(yEnd, thick, gr(), delay); };
      for (let k = 0; k < 10; k++) jet(k * 0.6283 + gr.range(-0.2, 0.2), gr.range(1.4, 3.4), gr.range(41, 49), 25.5, 0.6, gr.range(3, 5), gr.range(2.5, 3.5), 19.5, gr.range(0.85, 1.1), 0.6 + 0.4 * gr());   // the plume, falling back into the upper bowl
      for (let k = 0; k < 8; k++) for (let m = 0; m < 3; m++) jet(k * 0.7854 + (m - 1) * 0.09, gr.range(9.2, 11), gr.range(28, 33), 20.6, 14.4, gr.range(2.4, 4.2), gr.range(3, 4.5), -2.8, gr.range(0.7, 0.95), gr() * 0.6);   // eight arcs out over the pool, toward its eight lobes
      for (let k = 0; k < 8; k++) for (let m = 0; m < 2; m++) jet(k * 0.7854 + 0.3927 + (m - 0.5) * 0.12, gr.range(5.5, 6.6), gr.range(35, 38), 20.6, 13, gr.range(2.5, 4), gr.range(3.5, 5), -2.8, gr.range(0.65, 0.85), 0.3 + gr() * 0.5);   // eight steeper ones between them
      for (let k = 0; k < 8; k++) jet(k * 0.7854 + 0.3927, gr.range(4.5, 5.5), gr.range(12, 14), 5.6, 20.4, gr.range(1, 1.6), gr.range(2, 3), -2.8, 0.6, gr() * 0.3);                                          // eight low spouts from the rim of the wide bowl
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.setAttribute('aJet', new THREE.InstancedBufferAttribute(new Float32Array(j1), 4));
      g.setAttribute('aJet2', new THREE.InstancedBufferAttribute(new Float32Array(j2), 4));
      g.setAttribute('aJet3', new THREE.InstancedBufferAttribute(new Float32Array(j3), 4));
      g.instanceCount = j1.length / 4;
      const silkA = pal[3].clone().lerp(pal[0], 0.35).multiplyScalar(1.45), silkB = pal[0].clone().multiplyScalar(1.2);
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, { uOrigin: roomU.uOrigin, uCamW: { value: camW }, uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: SOFT, uFount: fountU,
        uSilkA: { value: silkA }, uSilkB: { value: silkB }, uSilkGlow: { value: variant === 'night' ? 0.3 : 0 } }), vertexShader: silkVert(hero.glsl), fragmentShader: silkFrag(hero.glsl), fog: true, side: THREE.DoubleSide });
      silkMesh = addMesh(g, mat, 'fountain-silk', false); silkMesh.visible = false;
    }
    await ctx.yield();

    // ---- the woven birds (moths before dawn) that lift off the flowering tree and lead the way up the avenue ----
    const NB = 14, bA = new Float32Array(NB * 4), bB = new Float32Array(NB * 4), birdSpec = [];
    let birdMesh = null, bAttrA = null, bAttrB = null;
    {
      const NX = 8, NY = 12, pos = [], idx = [];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) pos.push(-1 + (2 * i) / NX, -1 + (2 * j) / NY, 0);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, c = a + NX + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      bAttrA = new THREE.InstancedBufferAttribute(bA, 4); bAttrA.setUsage(THREE.DynamicDrawUsage);
      bAttrB = new THREE.InstancedBufferAttribute(bB, 4); bAttrB.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('aB1', bAttrA); g.setAttribute('aB2', bAttrB); g.instanceCount = NB;
      for (let i = 0; i < NB; i++) {
        const a = gr() * 6.28, ny = gr.range(0.1, 0.9), rr = Math.sqrt(1 - ny * ny);
        birdSpec.push({ perch: V3(BIRD_TREE.x + Math.cos(a) * rr * 12, BIRD_TREE.h - 12 + ny * 10, BIRD_TREE.z + Math.sin(a) * rr * 12), u0: 0.39 + i * 0.0042, orbR: gr.range(8, 17), orbW: gr.range(0.55, 0.95) * (i % 3 ? 1 : -1), orbPh: gr() * 6.28,
          hgt: gr.range(-4, 6), flapW: gr.range(7.5, 10), size: [0.78, 1.08, 1.5][i % 3] * gr.range(0.94, 1.06), land: 2.2 + gr() * 2.9 });
      }
      const bc = variant === 'winter' ? [pal[0].clone().multiplyScalar(1.08), pal[3].clone().lerp(pal[0], 0.5), pal[1].clone().multiplyScalar(1.25)]   // winter: ivory birds, the flight feathers and the tail's forks madder
        : variant === 'night' ? [pal[0].clone(), pal[3].clone().lerp(pal[0], 0.5), pal[4].clone()] : [pal[0].clone().multiplyScalar(1.1), pal[3].clone().lerp(pal[0], 0.55), pal[4].clone().multiplyScalar(1.1)];
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign(fogU(), HU, { uOrigin: roomU.uOrigin, uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: SOFT, uBirdA: { value: bc[0] }, uBirdB: { value: bc[1] }, uBirdC: { value: bc[2] },
        uBirdGlow: { value: variant === 'night' ? 0.55 : 0 } }), vertexShader: birdVert(hero.glsl), fragmentShader: birdFrag(hero.glsl), fog: true, side: THREE.DoubleSide });
      birdMesh = addMesh(g, mat, 'woven-birds', false); birdMesh.visible = false;
    }
    await ctx.yield();

    // ---- the border gateway: a strip of the carpet's own border (vine, palmettes and guards, the same dye, its buds still
    // marching) standing up as a pointed arch at the inner edge of the east border, in front of the chair: the flight goes through it ----
    const gateMeshes = [];
    {
      const Gt = GATE, lx = Gt.nz, lz = -Gt.nx, line = gateLine;
      const pos = [], nor = [], uv = [], idx = [];
      const n = line.length;
      // four faces: front and back carry the main border, the outside the diamond guard, the inside the crenellated guard
      // (the inside was the black and ivory crenellated guard, which read as tiles at the lens: it now carries the heart of the main border)
      const faces = [[1, 0, 45.6, 14.4, 3.9], [-1, 0, 45.6, 14.4, 3.9], [0, 1, 3, 12.6, 1.5], [0, -1, 26.2, 33.8, 1.5]];   // (inner edge, outer edge of the border's depth, how many carpet metres to one of the arch)
      for (const [fn, fr, bd0, bd1, sc] of faces) {
        const base = pos.length / 3; let S = 0;
        for (let i = 0; i < n; i++) {
          const p = line[i], q0 = line[Math.max(i - 1, 0)], q1 = line[Math.min(i + 1, n - 1)];
          let tx = q1[0] - q0[0], ty = q1[1] - q0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          const rx = -ty, ry = tx;                             // outward, in the plane of the arch
          if (i > 0) S += Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]);
          for (let e = 0; e < 2; e++) {
            const s2 = e ? 1 : -1;
            const ar = fn !== 0 ? s2 * Gt.wd * 0.5 : fr * Gt.wd * 0.5, dn = fn !== 0 ? fn * Gt.dp * 0.5 : s2 * Gt.dp * 0.5;
            const ac = p[0] + rx * ar, y = p[1] + ry * ar;
            pos.push(Gt.x + lx * ac + Gt.nx * dn, y, Gt.z + lz * ac + Gt.nz * dn);
            if (fn !== 0) nor.push(Gt.nx * fn, 0, Gt.nz * fn); else nor.push(lx * rx * fr, ry * fr, lz * rx * fr);
            uv.push(240 - lerp(bd0, bd1, e), -262 + S * sc);
          }
          if (i < n - 1) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(V3(Gt.x, 34, Gt.z), 60);
      // the skin and three shells of pile over it, like the trees: at the lens its faces are blunt tufts, not printed knots; its
      // shaded faces take a fill of light thrown back off the sunlit wool, so that its dyes show from every side
      for (let k = 0; k <= 3; k++) {
        const m = addMesh(g, hero.makeWeaveMaterial({ back: false, occSkip: [-1, -1], side: THREE.DoubleSide, penumbra: 5, shell: k / 3, pile: 1.1, fill: 1 }), k ? 'border-gate-pile' + k : 'border-gate', false);
        m.visible = false; gateMeshes.push(m);
      }
    }
    await ctx.yield();
    // ---- the flight (written in the hero's frame, flown in world coordinates) ----
    // Out from under the table and through the gateway; north over the south border and then east along the foot of the
    // south-east beds, low, the gaze held north-north-west over the wool (the prairie); in by the left side of the side chair
    // that stands half on the east border, and a steep rise under its seat, so that its two front legs stand at the edges of
    // the frame with the garden between them; out between the legs, down through the border gateway and west, low, along
    // the foot of the orchard; round onto the south canal and north up the avenue of cypresses toward the fountain; at the
    // avenue's end a climbing turn to the east, over the blossoming crowns of the south-east orchard, and a wide turn back to
    // the left over the garden's south-east corner; then one long glide north-west, straight at the pool, with the whole
    // garden ahead and below as it sinks back into the pile; past the fountain's east flank; down to the north canal; the roll.
    // On a rare visit the stretch from the orchard's foot to the avenue's end is flown high (RY), above the cypresses, so that
    // the wave of pile is seen crossing the garden from above.
    const RY = rare ? [31, 34, 50, 68, 82, 87, 88, 88, 88, 82, 76, 71, 68, 67, 69] : null;   // (it climbs at once after the gate: the cat's tail must be seen over the cypresses of the south avenue)
    const midLow = [[124, 31, 246.5], [100, 28.5, 249], [78, 26, 261], [54, 24, 276], [29, 22.5, 288],   // west along the foot of the orchard, over the swollen beds: the flowering tree and its birds on the right
      [8, 21.5, 281], [0.5, 21, 258], [0, 21, 218], [0, 21, 175], [0.5, 22, 150],                        // round onto the south canal and north up the avenue of cypresses, the fountain ahead
      [5, 26, 134], [18, 34, 125], [36, 44, 127], [56, 56, 136], [76, 65, 145]];                        // a climbing turn to the east at the avenue's end, out over the crowns of the orchard
    const path = makePath([
      [0, 9, 466], [0, 9, 446], [0, 9, 425], [0, 9, 404],                                       // under the table, down the fringe lane, the gateway
      [1, 9, 386], [4, 9.1, 366], [13, 9.2, 348], [28, 9.3, 335],                                // the prairie: north over the border's stripes to the head of the canal,
      [50, 9.4, 328], [76, 9.5, 327], [102, 9.9, 331], [126, 27, 339],                           // then east along the foot of the striped beds, all in one lozenge of sun
      chairAt(72, 52, -75), chairAt(80, 68, -50), chairAt(84, 79, -27), chairAt(82, 87, -10),    // rising, in by the chair's left side between its stretcher and its seat rail, and round onto its axis under the seat,
      chairAt(70, 93, -1),                                                                       // well short of the front legs, so that they stand at the two edges of the frame for a long moment;
      [208, 84, 292], [198, 69, 271], [181, 54, 257], [150, 36, 246],                            // then down and out between them, turning west, toward the border gate that has stood up beyond the doorway
    ].concat(midLow.map((q, i) => [q[0], RY ? RY[i] : q[1], q[2]]), [
      [95, 72, 144], [107, 77, 128], [103, 80, 107],                                             // the wide turn to the left over the garden's south-east corner,
      [86, 80, 88], [63, 76, 64], [42, 69, 42], [23, 58, 20],                                    // and the long glide north-west, straight at the pool: the garden whole, sinking back into the pile
      [9, 45, -11], [0, 31, -56], [-6, 19, -98],                                                 // past the east flank of the fountain and down over the pool's north lobes
      [-8, 14, -121], [-11, 10.4, -146], [-11, 10.4, -172], [-10, 11.3, -192],                   // the canal run, just inside the west bank: the cypresses close on the left, the carp in the canal on the right
      [-5, 13.8, -210], [-1, 16.7, -224], [0, 21, -245.33], [0, 28, -280.67], [0, 35, -316],     // back to the axis and straight up into the hollow of the roll
    ]).map(([x, y, z]) => [x, y, z + OZ]));
    const uCanal = path.nearestXZ(-8, -121 + OZ).u, uClose = path.nearestXZ(-13.5, -160 + OZ).u;
    const seatP = chairAt(82, 87, -10);
    const uIn = path.nearestXZ(126, 339 + OZ).u, uSeat = path.nearestXZ(seatP[0], seatP[2] + OZ).u, uExit = path.nearestXZ(183, 252 + OZ).u;
    // uA: the avenue's end; uC: the end of the turn over the south-east corner, where the glide begins; uF: beside the fountain
    const uA = path.nearestXZ(0.5, 150 + OZ).u, uC = path.nearestXZ(103, 107 + OZ).u, uF = path.nearestXZ(23, 20 + OZ).u;
    const uGate = path.nearestXZ(GATE.x, GATE.z + OZ).u;      // the plane of the border gate
    // THE SCORE. The garden's rising, the gaze and the birds were written against an earlier, shorter route on which the
    // avenue's end stood at 0.597 of the way and the mouth of the north canal at 0.847. sv(u) is where that route would have
    // been when this one is at u (the same place on the ground, up to the avenue and from the canal on), so everything
    // written in the score's numbers still happens where it did; su(v) is its inverse. What happens on the new stretch
    // between them (the orchard, the corner, the glide) is written against u itself, from uA, uC and uF.
    const VA = 0.597, VB = 0.847;
    const sv = (u) => (u <= uA ? u * (VA / uA) : u >= uCanal ? 1 - (1 - u) * ((1 - VB) / (1 - uCanal)) : VA + ((u - uA) / (uCanal - uA)) * (VB - VA));
    const su = (v) => (v <= VA ? v * (uA / VA) : v >= VB ? 1 - (1 - v) * ((1 - uCanal) / (1 - VB)) : uA + ((v - VA) / (VB - VA)) * (uCanal - uA));
    // every tree stands until the glide has begun; then the south half of the garden, which the glide leaves behind, settles a
    // few at a time, and the north half, which lies ahead, stands on until the camera has passed the fountain and goes down
    // row by row in front of it (the rows nearest the pool first, the far rows last and slowest), flat as it reaches the canal
    GOBJ.forEach((o) => {
      const far = clamp((Math.abs(o.z) - 150) / 62.5, 0, 1);
      if (o.z > 0) { o.down = uC + 0.008 + o.dr * 0.016; o.fall = 0.07; }
      else if (far > 0.7 || (o.kind === 'cypress' && Math.abs(o.x) < 90)) { o.down = uF + 0.004 + o.dr * 0.008; o.fall = 0.1; o.slow = true; }   // the far row and the four cypresses of the canal's banks: last, and slowly
      else { o.down = uF - 0.012 + far * 0.02 + o.dr * 0.012; o.fall = 0.07 + 0.03 * far; }
    });
    const bellU = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
    const aim = V3(), carpAim = V3(), camAt = V3(), rareV = V3();
    // Where the gaze rests, one point that travels:
    //   the prairie (to uIn): far to the north-north-west and level, so that the wool fills the lower half of the frame and the
    //     cat, the roll, the lantern and the stove's glow stand small on the horizon in its middle third;
    //   under the chair: a quick turn to a point on the chair's axis 50 m beyond its front legs (the left leg crosses the frame
    //     during the turn and then stands at its left edge while the camera comes round onto the axis), sliding away to 300 m:
    //     the pool a little left of centre, the lantern, the stove and the cat between the legs; held near the camera's own
    //     height so the gaze stays level through the rise;
    //   leaving the chair: the border gate, upright in the middle of the frame, and through it;
    //   then the flowering tree and its birds, the avenue, and the fountain at its end (GK, in the score's numbers).
    // From the avenue's end other points take over (see pois): the orchard and the side chair beyond it, then the far side of
    // the pool for the whole of the glide, then the cat and the roll.
    const GK = [[0.3, 104, 30, 247], [0.37, 84, 29, 243], [0.41, 80, 27, 226], [0.45, 74, 30, 218], [0.5, 0, 30, 150], [0.53, 0, 34, 50], [0.6, 0, 40, 0], [0.64, 0, 36, 0]];
    // Through the border gate the gaze is written as a heading (degrees west of north) at each place: the gate is 19 m wide
    // inside, and a gaze that turns to the tree while the camera is still in it looks straight at the inner face of its
    // north pillar from 9 m. So: down the gate's axis (the pillars at the two edges of the frame, the beds through the
    // opening) until the camera is inside, then round to the right, the pillar always just outside the frame, to the
    // flowering tree and its birds; from 0.43 of the way the old score holds again.
    const YAW = [[0.345, 88], [0.36, 94], [0.372, 94], [0.376, 91], [0.38, 80], [0.385, 64], [0.39, 46], [0.4, 20], [0.41, 4], [0.42, -5], [0.43, -9]];
    const yawPts = YAW.map(([uu, deg]) => {
      path.pointAt(uu + (uGate - 0.3812), camAt); const a = deg * Math.PI / 180;
      return [uu, camAt.x - Math.sin(a) * 70, camAt.y + lerp(-4, 5, smoothstep(0.378, 0.42, uu)), camAt.z - OZ - Math.cos(a) * 70];
    });
    const gazeAim = (time, u) => {
      const g = smoothstep(uIn - 0.012, uIn + 0.016, u), k = smoothstep(uSeat - 0.05, uSeat + 0.05, u);
      const qd = 64 + lerp(50, 300, k), ql = 6 * (1 - k);
      path.pointAt(u, camAt);
      let x = lerp(-150, CHAIR3.x + cf[0] * qd + cr[0] * ql, g), z = lerp(-330, CHAIR3.z + cf[1] * qd + cr[1] * ql, g);
      let y = lerp(camAt.y - 18, camAt.y * 0.7 * (1 - k) - 25 * k, g);
      // the garden: the gate, the flowering tree and its birds, up the avenue to the fountain
      const v = sv(u), w = smoothstep(0.283, 0.328, v);
      if (w > 0) {
        let i = 0; while (i < GK.length - 2 && v > GK[i + 1][0]) i++;
        const A = GK[i], B = GK[i + 1], t = smoothstep(A[0], B[0], v);
        x = lerp(x, lerp(A[1], B[1], t), w); y = lerp(y, lerp(A[2], B[2], t), w); z = lerp(z, lerp(A[3], B[3], t), w);
      }
      // through the border gate and out of it (YAW): straight down its axis until the camera is inside it, then round to the
      // flowering tree at the pace at which the gate's north pillar falls behind
      const uy = u - (uGate - 0.3812), wy = smoothstep(0.345, 0.365, uy) * (1 - smoothstep(0.415, 0.43, uy));
      if (wy > 0) {
        let ax = 0, ay = 0, az = 0;
        for (let k = -1; k <= 1; k++) {
          const uk = clamp(uy + k * 0.003, yawPts[0][0], yawPts[yawPts.length - 1][0]), wk = k ? 0.25 : 0.5;
          let i = 0; while (i < yawPts.length - 2 && uk > yawPts[i + 1][0]) i++;
          const A = yawPts[i], B = yawPts[i + 1], t = (uk - A[0]) / (B[0] - A[0]);
          ax += wk * lerp(A[1], B[1], t); ay += wk * lerp(A[2], B[2], t); az += wk * lerp(A[3], B[3], t);
        }
        x = lerp(x, ax, wy); y = lerp(y, ay, wy); z = lerp(z, az, wy);
      }
      return aim.set(x, y, OZ + z);
    };
    // rare: first the cat's tail, sweeping out over the west border; then a point on the crest of the wave of pile, well
    // ahead of the camera, which comes in from the left (in the field from 0.47), passes under it at u 0.535 and runs on to
    // the east border (0.60)
    const rareAim = (time, u) => {
      path.pointAt(u, camAt);
      const wx = 2750 * (u - 0.535), k = smoothstep(0.455, 0.482, u);
      return rareV.set(lerp(-235, clamp(wx, -230, 150), k), lerp(44, 0, k), OZ + lerp(-285, camAt.z - OZ - 100, k));
    };

    // ---- how the garden rises and settles (a pure function of u and time; nothing is made here) ----
    // v is the score's place (sv(u)): the rising is written in it. The settling is written against u: every tree stands until
    // the glide has begun (uC) and they go down a few at a time over the next tenth of the flight, the fountain falling and
    // the water turning back to wool behind them, so that the garden is seen whole, then half-standing, then flat.
    const springUp = (t) => { const q = clamp(t, 0, 1) - 1; return 1 + 2.2 * q * q * q + 1.2 * q * q; };   // up with a little overshoot
    const riseOf = (up, down, v, u, fall = 0.07, slow = false) => springUp((v - up) / 0.05) * (slow ? Math.pow(1 - clamp((u - down) / fall, 0, 1), 1.15) : 1 - smoothstep(down, down + fall, u));
    const bp = V3(), bq = V3(), bw = V3(), bl = V3();
    // where bird i is: on its perch in the flowering tree, wheeling over it, strung out ahead of the camera up the avenue,
    // then away to wheel low over the west arm of the cross canal (beyond the fountain and to its left, as the glide sees
    // it), and down onto the far rim of the pool, where it lies back into the pile. Returns its size (0 = not out).
    const birdAt = (i, v, u, time, out) => {
      const s = birdSpec[i];
      const a = smoothstep(s.u0, s.u0 + 0.034, v), b = smoothstep(0.447 + i * 0.002, 0.5 + i * 0.002, v);
      const c = smoothstep(uA - 0.034 + i * 0.0012, uA + 0.03, u), hi = smoothstep(uA - 0.002, uA + 0.016, u) * (1 - smoothstep(uA + 0.035, uA + 0.085, u));
      const e = smoothstep(uF - 0.04 + i * 0.0015, uF + 0.012, u), d = smoothstep(uF + 0.03 + i * 0.002, uCanal - 0.012, u);
      const ang = time * s.orbW + s.orbPh;
      bw.set(78 + Math.cos(ang) * s.orbR * 1.5, 34 + s.hgt * 0.6 + (i % 3) * 3.5 + 2 * Math.sin(time * 1.3 + i), 223 + Math.sin(ang) * s.orbR * 1.05);
      path.pointAt(Math.min(u + 0.028 + (i % 7) * 0.006, uA + 0.004), bl); bl.z -= OZ;
      const fa = i / (NB - 1) - 0.5;                                  // a loose arch of birds over the avenue, above the fountain's top as the camera sees it
      bl.x += fa * 30 + Math.cos(ang) * s.orbR * 0.3; bl.y += 17 + 15 * (1 - 4 * fa * fa) + s.hgt * 0.7 + 1.5 * Math.sin(time * 1.3 + i); bl.z += Math.sin(ang) * s.orbR;
      out.copy(s.perch).lerp(bw, a).lerp(bl, b);
      // away over the west arm of the cross canal: at first high, above the fountain's left shoulder as the avenue's end sees
      // it (hi), then low over the water for the glide
      const rr = 14 + s.orbR * 2.1;
      bw.set(lerp(-92, -30, hi) + Math.cos(ang * 0.55) * rr * (1 - 0.45 * hi), 27 + 44 * hi + s.hgt * 2.4 + 2.5 * Math.sin(time * 0.9 + i), lerp(-34, -20, hi) + Math.sin(ang * 0.55) * rr * 0.75);
      out.lerp(bw, c);
      // as the glide comes over the pool they go on north-west, to wheel over the orchard at the cat's feet while it settles,
      bw.set(-96 + Math.cos(ang * 0.6) * rr * 1.1, 31 + s.hgt * 1.8 + 2.5 * Math.sin(time * 0.9 + i), -172 + Math.sin(ang * 0.6) * rr * 0.8);
      out.lerp(bw, e);
      // and come down into the pile there as the last trees do
      bw.set(-92 + Math.cos(s.land) * 42, 3.4, -178 + Math.sin(s.land) * 36);
      out.lerp(bw, d);
      return s.size * smoothstep(0, 0.22, a) * (1 - d * d);
    };
    let gardenWas = -1;
    const gardenUpdate = (time, u, live) => {
      const v = sv(u);
      let any = 0;
      for (const o of GOBJ) {
        let r = live ? riseOf(o.up, o.down, v, u, o.fall, o.slow) : 0;
        if (r < 0.004) r = 0; else r *= 1 + 0.012 * Math.sin(time * 1.4 + o.ph);
        riseArr[o.i] = r; GT[o.i].z = o.h * Math.min(r, 1);
        if (r > any) any = r;
      }
      const basin = live ? riseOf(0.425, uC + 0.045, v, u) : 0, fount = live ? smoothstep(0.44, 0.53, v) * (1 - smoothstep(uC - 0.006, uC + 0.075, u)) : 0;
      const beds = live ? smoothstep(0.285, 0.37, v) * (1 - smoothstep(uCanal - 0.06, uCanal - 0.004, u)) : 0;   // the beds lie down as the camera comes down to the canal's mouth
      const water = live ? smoothstep(0.35, 0.45, v) * (1 - smoothstep(uCanal - 0.047, uCanal + 0.001, u)) : 0;   // the water stays silk until the camera is down at the canal's mouth, and is wool again for the canal run
      riseArr[IDX.basin] = basin < 0.004 ? 0 : basin; riseArr[IDX.beds] = beds < 0.004 ? 0 : Math.min(beds * 1.15, 1) * (1 + 0.02 * Math.sin(time * 1.1));
      const on = any > 0 || basin > 0.004;
      for (const m of matGarden) m.visible = on;
      fountU.value = fount; silkMesh.visible = fount > 0.004;
      let gate = live ? springUp((v - 0.262) / 0.05) * (1 - smoothstep(uGate + 0.007, uGate + 0.037, u)) : 0;     // it settles behind the camera as soon as the camera is through it
      gate = gate < 0.004 ? 0 : gate * (1 + 0.008 * Math.sin(time * 1.2));
      riseArr[IDX.gate] = gate;
      const lamps = live ? springUp((v - 0.33) / 0.05) * (1 - smoothstep(uF + 0.02, uF + 0.09, u)) : 0;   // the standing lamps of the night garden (none by day)
      riseArr[IDX.lamps] = lamps < 0.004 ? 0 : lamps;
      for (const m of gateMeshes) { m.visible = gate > 0; m.scale.y = Math.max(gate, 0.004); }
      pomMesh.visible = on || beds > 0.004 || gate > 0 || lamps > 0.004;
      const stand = Math.max(Math.min(any, 1), beds, water);
      if (stand !== gardenWas) { gardenWas = stand; hero.setGarden({ water, beds, shadow: Math.min(any * 4, 1), tufts: 1 - 0.5 * smoothstep(0, 0.5, stand) }); }
      else hero.setGarden({ water, beds });
      // the birds
      let shown = false;
      for (let i = 0; i < NB; i++) {
        const sz = live ? birdAt(i, v, u, time, bp) : 0, k = i * 4;
        if (sz < 0.004) { bB[k + 3] = 0; continue; }
        shown = true;
        birdAt(i, sv(u - 0.0012), u - 0.0012, time - 0.06, bq);
        bq.subVectors(bp, bq); const l = bq.length();
        if (l < 1e-3) bq.set(-0.6, 0.3, -0.7); else bq.multiplyScalar(1 / l);
        bq.y = clamp(bq.y, -0.6, 0.6);
        bA[k] = bp.x; bA[k + 1] = bp.y; bA[k + 2] = bp.z; bA[k + 3] = time * birdSpec[i].flapW + i * 1.7;
        bB[k] = bq.x; bB[k + 1] = bq.y; bB[k + 2] = bq.z; bB[k + 3] = sz;
      }
      birdMesh.visible = shown;
      if (shown) { bAttrA.needsUpdate = true; bAttrB.needsUpdate = true; }
    };

    return {
      scene, path, duration: 55,
      // unhurried over the prairie, quick through the turn under the chair, lingering in its doorway, slow past the flowering
      // tree, brisk on the climb over the orchard, lingering on the glide while the garden lies whole below, quick down past
      // the fountain, slow down the canal
      pace: (u) => 0.9 - 0.05 * bellU(u, su(0.105), 0.05) + 0.24 * bellU(u, uIn + 0.008, 0.028) - 0.24 * bellU(u, uSeat + 0.005, 0.045) + 0.1 * bellU(u, uExit + 0.03, 0.03) - 0.2 * bellU(u, su(0.43), 0.04) - 0.08 * bellU(u, su(0.57), 0.04)
        + 0.12 * bellU(u, uA + 0.04, 0.03) - 0.22 * bellU(u, uC + 0.035, 0.05) + 0.2 * bellU(u, uF + 0.03, 0.035) - 0.22 * bellU(u, uClose - 0.015, 0.04) + 0.12 * smoothstep(0.9, 0.96, u),
      title: lookName === 'winter' ? 'The Garden Underfoot, in Winter' : lookName === 'night' ? 'The Garden Underfoot, before Dawn' : 'The Garden Underfoot',
      camera: { fov: 62, near: 1, far: 2600, lookAhead: 22, sway: 0.5, bank: 0.6 },
      pois: [
        // the travelling point: two quick pulls that hold it from the gateway on, then four long ones, so that the steady
        // camera (a third of each) still turns to it
        { at: gazeAim, from: 0.032, to: su(0.34), weight: 0.85, fade: 0.1 },
        // three more over the prairie alone: they change nothing for the sweeping camera (it is already on the point) and
        // keep the steady one looking across the bands to the far wall instead of along the route into the chair
        { at: gazeAim, from: 0.028, to: uIn + 0.04, weight: 1, fade: 0.18 },
        { at: gazeAim, from: 0.03, to: uIn + 0.02, weight: 1, fade: 0.2 },
        { at: gazeAim, from: 0.034, to: uIn, weight: 1, fade: 0.22 },
        { at: gazeAim, from: 0.037, to: su(0.36), weight: 0.8, fade: 0.12 },
        { at: gazeAim, from: 0.042, to: uA + 0.07, weight: 0.85, fade: 0.12 },
        { at: gazeAim, from: 0.084, to: uA + 0.06, weight: 0.8, fade: 0.14 },
        { at: gazeAim, from: 0.12, to: uA + 0.05, weight: 0.75, fade: 0.16 },
        { at: gazeAim, from: 0.176, to: uA + 0.04, weight: 0.85, fade: 0.18 },
        // over the orchard: the blossoming crowns close below, the cypresses of the south-east quarter, the side chair's leg and
        // the lattice window beyond (near the route's own heading, a little down)
        { at: [190, 18, OZ + 170], from: uA + 0.004, to: uC - 0.022, weight: 0.7, fade: 0.3 },
        // the glide: the far side of the pool, so that the fountain and the carp lie in the lower middle of the frame, the
        // lantern and the stove to the left, the cat and the roll to the right, and the route itself points the same way
        { at: [-90, 0, OZ - 140], from: uC - 0.04, to: uF + 0.012, weight: 0.8, fade: 0.2 },
        { at: [-90, 0, OZ - 140], from: uC - 0.03, to: uF + 0.004, weight: 0.5, fade: 0.2 },
        { at: [-30, 24, OZ - 316], from: uF - 0.018, to: uCanal + 0.045, weight: 0.6, fade: 0.25 },   // the cat and the roll: held while the path swings out to the west bank
        // from the fountain down to the canal's mouth: the ground at the cat's feet, a little left of the canal and well down, so
        // that the silk canal and the carp setting off up it lie in the lower middle of the frame, the last trees of the north
        // garden stand half up in front of the cat as they settle, and the stove stands whole on the left
        { at: [-70, -12, OZ - 262], from: uF - 0.001, to: uCanal - 0.007, weight: 0.9, fade: 0.3 },
        // the pacing carp, 30 m ahead in the canal, with the cypresses of the bank on its left
        { at: (time, u) => { path.pointAt(u, camAt); return carpAim.set(hero.pacer.x - 6, 2.6, Math.min(hero.pacer.z + OZ, camAt.z - 30)); }, from: uCanal - 0.03, to: 0.925, weight: 0.5 },
      ].concat(rare ? [{ at: rareAim, from: 0.4, to: 0.612, weight: 0.9, fade: 0.13 }, { at: rareAim, from: 0.408, to: 0.606, weight: 0.6, fade: 0.14 }] : []),   // rare: the tail, then the wave
      portal: { shape: 'circle', radius: 7, color: L.portal, glow: 0.6, revealDistance: 300 },
      post: { exposure: L.post.exposure, bloom: { strength: 0.22, radius: 0.6, threshold: 1.0 },
        grade: { saturation: L.post.sat, contrast: 1.05, tint: L.post.tint, shadowTint: L.post.shadowTint, vignette: 0.25, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);                                  // the rare wave of pile: through the field from u 0.47 to 0.60, under the camera at 0.535
        gardenUpdate(time, u, !ctx.through);
        hero.update(dt, time, camera);
        camera.getWorldPosition(camW);
        tassel.rotation.z = 0.2 * Math.sin(time * 1.25) + 0.06 * Math.sin(time * 3.3 + 1);
        tassel.rotation.x = 0.12 * Math.sin(time * 1.05 + 0.7);
        // rare: the cat's tail sweeps out just before the wave of pile sets off; otherwise it only grows restless as we come down beside it
        const sweep = rare ? smoothstep(0.395, 0.435, u) * (1 - smoothstep(0.49, 0.55, u)) : 0;
        roomU.uTail.value.z = sweep * (0.86 + 0.14 * Math.sin(time * 2.4));
        roomU.uTail.value.w = smoothstep(uF, uF + 0.1, u) * (1 - smoothstep(0.93, 1, u));
        // the small things on the wool ride the wave of pile as it passes under them
        const wv = HU.uWave.value;
        for (const m of crestMeshes) m.visible = wv.w > 0.002;
        const liftAt = (x) => { const q = (x - wv.x) / Math.max(wv.z, 1); return wv.w * wv.y * Math.exp(-q * q * 2.2); };
        if (borderProp) borderProp.position.y = liftAt(SLIP.x);
        yarnMesh.position.y = liftAt(YARN.x);
        trayProp.position.y = steam.position.y = liftAt(STAND.x);
        // the fire in the stove breathes and flickers, the lantern's flame trembles: their pools of warm light move with them
        const fS = 0.84 + 0.1 * Math.sin(time * 1.7) + 0.06 * Math.sin(time * 5.3 + 1) + 0.05 * Math.sin(time * 11.7);
        const fL = 0.93 + 0.05 * Math.sin(time * 9 + 2 * Math.sin(time * 3.7)) + 0.02 * Math.sin(time * 23);
        lampC[0].set(STOVE_C[0] * L.stove * fS, STOVE_C[1] * L.stove * fS, STOVE_C[2] * L.stove * fS, 0.6);
        lampC[1].set(LAMP_C[0] * L.lamp * fL, LAMP_C[1] * L.lamp * fL, LAMP_C[2] * L.lamp * fL, 0.75);
        roomU.uGlowK.value.set(L.stove * (0.5 + 0.5 * fS), L.lamp);
      },
      dispose() { hero.dispose(); },
    };
  },
};
