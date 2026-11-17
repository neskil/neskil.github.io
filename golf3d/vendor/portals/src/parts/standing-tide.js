// THE STANDING TIDE: hero set piece of "The Standing Tide".
//
// A sea that stands up under a stone ceiling. A glassy hill of water 2.8 km across and 300 m high (the
// brief's tideHeight formula, its 50 m peak term split 30 exp(-r/45) + 20 exp(-r/9) for a steeper spire), drawn at the top into a quivering cusp whose tip is a rope of water that
// breaks into beads; the beads rise, faster and faster, into the lowest crater of a 2.4 km ivory moon
// whose wet belly hangs 80 m over the tip. Crater rims have real relief, crater lakes cling to the
// ceiling, and sheets of water let go of the rim lips and fall onto the hill as rain. You can see into
// the hill: a dark heart 55 m inside, slanted light shafts (two parallax layers in the surface shader
// plus 90 additive quads), eight turning shoals, five tide-rays, kelp in its foot, the bed bent through
// its thin skirt. Forty orange lug sails climb it at every height, heeled to the slope, trailing wakes.
//
// LOCAL SPACE  origin = normal sea level on the hill's axis, +Y up, front = +Z: the camera arrives from
//   +Z flying toward -Z, so port (the sun's side) is -X and starboard +X. Every shader works in this
//   local space (camera and sun are brought into it), so the world may translate and yaw hero.object
//   freely: move object.position along the course to make the hill and moon travel. Do not scale it.
// SIZE   hero.radius 450 / height 300 / center (0,170,0) frame the steep body for the part viewer. The
//   water skirt reaches r = 1,400 (hero.extent), the moon's limb r = 1,200 and its mesh y = 380..2,100.
// COST   about 146k triangles, 14 draw calls (13 with bed:false), no lights, no textures, no render
//   targets; build about 120 ms. All motion is in vertex/fragment shaders.
// PREVIEW  opts.view = 'peak' | 'belly' | 'boat' | 'shoal' | 'slope' | 'foot' frames a close orbit in the part viewer.
//
// opts
//   palette  [ivory stone, slate shade, turquoise, deep blue, aqua sky, white, sail orange] (brief default)
//   detail   0.6..1 (default ctx.quality.detail or 1): thins fish, kelp, small beads, sheets (9 -> 5) and
//            surface rings. Never thins the moon, core, fleet, rays, the 60 real beads or the near shoal.
//   bed      true: a preview seabed disc (r 5,200, y -2.6): wet reef flat with sky-mirror pools outside
//            the water, caustic-lit sand, coral heads and seagrass under it (pattern anchored in WORLD xz
//            so it does not slide when the hill moves). Pass false when the world builds its own flat.
//   kelp     true: 380 kelp ribbons in the hill's foot. They ride with the hill; pass false and plant
//            world-anchored kelp instead if the sliding shows.
//   boats    24..48 (default 40).    sun: Vector3, local direction TO the sun (default 38 deg up, to port).
//   progress initial value for setProgress (default null = free-running).
//
// anchors (local space)
//   portalSeat  { position (0,320,0), facing: unit vector from the portal toward the arriving camera
//               (0,-sin20,cos20), tiltDeg 20, radius 7 }: 13 m over the rope's top, under the lowest
//               crater's lake, between the two veils. Use portal { tilt: true }.
//   flyThrough  ordered Vector3 list along x = 0 from z = 1,900: level at y 4.5 over the drained flat,
//               5.5 m above the water from the lip (r 1,400) to r 430, one straight 21 degree climb to
//               (0, 299.5, 56.4), then the last 60 m dead straight at 20 degrees into the seat. Boats keep
//               >= 9 m from it (seven "lane" boats pass 9-15 m to either side), sheets >= 26 m, real beads
//               >= 1.2 m (they are water; thirty or so pass within 2-6 m of the last 20 m).
//               96 more real beads (r 0.35-1.2 m) rise in a band round the last 150 m of this line, 2.7-6.2 m to
//               either side of it, so six to ten pass the lens on the approach.
//   viewpoints  { entry, slope, summit, outside }: each { position, lookAt }
//   tip (0,300,0), ropeTop (0,307,0), lowestCrater { lake, rimRadius 80, rimY }
//   veils [2], portSheet, sheets [..]: { top, foot, width } of the falling sheets at roll 0
//   shoalBall (0, h-10, 520): the 14 m shoal under the path; shoals [8]
//   moonCentre (0,1580,0), moonRadius, waterEdgeRadius 1,400, bedY -2.6, coreRadius 750, sun
//
// WORLD HOOKS (uniforms in hero.uniforms)  SUNC sun colour, uWind 0..1 (whitecaps, heel), uSailW 1 = white sails with
//   one coloured panel, uRay0 / uBall = hero-local radius of the lane tide-ray / the shoal under the path (< 0 = free),
//   uB0 = (hero-local radius, lateral x, -) of the keyed starboard lane boat (x < 0 = free-running).
// PROGRESS HOOK  hero.setProgress(u) (u = path progress) drives the moon's roll: 0.12 rad at u = 0 down
//   to 0 at u = 1, so craters cross the belly toward the camera and the lowest crater, its lake and the
//   two veils stand exactly over the peak / round the portal on arrival. Sheets and their rain patches
//   follow the roll. Without it (null) the roll breathes slowly on time. Everything else is ambient.
//   hero.setSun(v) re-aims the light. hero.roll reports the current angle.
// SHARING WITH THE WORLD  hero.glsl is the GLSL chunk (tideH, surfY, moonShade, caustic, underwater,
//   lit, skyCol, moonRay) and hero.uniforms its uniforms (uTime, uSun, uQuiv, cIvory..cOrange): spread
//   both into world shaders (seabed, hulls, anything under the water) with positions converted to hero
//   local space. hero.tideHeight(r), hero.moonHeight(d) are the same maths in JS. hero.boatGeometry is
//   the boat (aPart 0 wood, 1 sail, 2 pennant, 3 awning; vertex colours) for stranded boats.
//
// LIGHTING  none needed: every material is a custom shader lit by its own sun (uSun), an analytic
//   aqua-to-milk sky and turquoise bounce; scene fog is honoured (fog chunks). The moon's shadow is one
//   ray-sphere test per pixel with the radius cheated to 800 m so the summit, beads and portal stay in
//   sun (the true 1,200 m umbra would swallow them); it lies to starboard on bed and slope. Bloom wants
//   threshold about 0.9: only sun glitter, bead glints and lake sparkles exceed 1.
// NEAR AND FAR  the surface shader marches the view ray into the hill (12 steps, no textures): opacity grows with the
//   metres of water before the core or bed (clear beside the lens, clearer still in the thin foot), colour deepens
//   with the whole chord through the hill, so the middle is a dark heart and the skyline, foot and peak are pale and
//   lit through, with no switch between a "near" and a "far" look. Across the hill the same shader draws what is
//   inside: slanted sun beams on two upright planes and four far shoals at fixed places in the hill (they slide
//   against the heart as the eye moves and fade out within 170-420 m, where the real fish take over), and broad
//   swell rings. The heart is written at about half of palette[3] because the tone map lifts it.
//   Boats point 36 degrees off the fall line on their tack; each lays a sail shadow.
// DRAW ORDER  opaque: bed, core, moon, rope, beads, fleet, fish, rays, kelp. Then transparent by
//   renderOrder: shafts 1, water surface 2 (premultiplied alpha, front faces; it WRITES depth so that
//   far-side wakes, sheets and sails are hidden by the hill), wakes 3 (polygon offset), sheets 4.
//   Anything of the world's that is under the water must be opaque, or transparent with renderOrder < 2.
import * as THREE from 'three';

const DEFAULT_PALETTE = ['#F1EBDD', '#9FB4CC', '#2FB7B0', '#0F5F9A', '#7FD0F2', '#FFFFFF', '#F28C3B'];
const MOON_R = 1200, MOON_Y = 1580, BED_Y = -2.6, EDGE_R = 1400, SIG2 = 2 * 430 * 430;

// The brief's water height (metres above normal sea level) at distance r from the hill's axis. The 50 m peak
// term is split 30 x exp(-r/45) + 20 x exp(-r/9): same tip (y 300), but the last 20 m are a steep pulled spire.
export function tideHeight(r) {
  const t = Math.min(1, Math.max(0, (r - 1250) / 250));
  return 250 * Math.exp(-r * r / SIG2) + 30 * Math.exp(-r / 45) + 20 * Math.exp(-r / 9) - 3.4 * t * t * (3 - 2 * t);
}
// Moon underside height at horizontal distance d from the axis (smooth sphere, no craters).
export function moonHeight(d) { return MOON_Y - Math.sqrt(Math.max(0, MOON_R * MOON_R - d * d)); }

// ---------------------------------------------------------------------------------------------
// Shared GLSL. Everything is computed in the hero's LOCAL space (origin = sea level on the hill's
// axis), so the world may translate / yaw the hero freely. tideH() is the function to share with
// world shaders (seabed, reef, anything that must know whether it is under the standing water).
// ---------------------------------------------------------------------------------------------
export const TIDE_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uSun;      // unit vector toward the sun, hero-local
uniform vec3 uQuiv;     // xy: lateral quiver of the peak (m), z: height of the peak term (about 50)
uniform vec3 cIvory, cSlate, cTurq, cDeep, cAqua, cWhite, cOrange;
const vec3 MOONC = vec3(0., 1580., 0.);
const float BEDY = -2.6;
uniform float uWind;  // 0 glassy calm .. 1 trade wind: whitecaps running uphill, the fleet heeled hard
uniform float uSailW; // 1 = white sails with one sailcloth-coloured panel
uniform vec3 SUNC;   // sun colour (default warm white 1, .95, .86); the world tints it per hour
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .3 + vn(p * 4.1 + 3.7) * .2; }
float tideH(vec2 p){
  float r2 = dot(p, p), r = sqrt(r2);
  float lq = length(p - uQuiv.xy);
  return 250. * exp(-r2 / 369800.) + uQuiv.z * (.6 * exp(-lq / 45.) + .4 * exp(-lq / 9.)) - 3.4 * smoothstep(1250., 1500., r);
}
vec2 tideG(vec2 p){
  float r2 = dot(p, p);
  vec2 q = p - uQuiv.xy; float lq = length(q);
  return -250. * exp(-r2 / 369800.) * p / 184900. - uQuiv.z * (.6 / 45. * exp(-lq / 45.) + .4 / 9. * exp(-lq / 9.)) * q / max(lq, .6);
}
vec3 tideN(vec2 p){ vec2 g = tideG(p); return normalize(vec3(-g.x, 1., -g.y)); }
// long swell rings that climb the hill (phase runs inward), metres
float swellPh(vec2 p){ return length(p) * .09 + uTime * .85 + 2.5 * vn(p * .004); }
float swellK(float r){ return smoothstep(1385., 1150., r) * smoothstep(30., 150., r); }
float swellH(vec2 p){ return .5 * sin(swellPh(p)) * swellK(length(p)); }
float surfY(vec2 p){ return tideH(p) + swellH(p); }
float ropeTop(){ return tideH(uQuiv.xy) + 7.; }
// 1 in sunlight, 0 inside the moon's shadow (soft edge): one ray-sphere test.
float moonShade(vec3 p){
  vec3 d = MOONC - p; float t = dot(d, uSun);
  float m = length(d - uSun * t);
  return mix(1., smoothstep(730., 910., m), step(0., t));   // radius cheated (800, not 1200) so the summit stays sunlit
}
// A crawling caustic net, 0..~1.6, no textures.
float caustic(vec2 p, float t){
  vec2 w = vec2(vn(p * .7 + vec2(t * .21, -t * .13)), vn(p * .7 + vec2(-t * .17, t * .19) + 9.3));
  float a = 1. - abs(2. * vn(p + w * 1.3 + t * .05) - 1.);
  float b = 1. - abs(2. * vn(p * 1.6 - w * 1.1 - t * .04 + 4.7) - 1.);
  float c = a * b; c = c * c; return c * c * 1.6 + c * .25;
}
vec3 skyCol(vec3 d){
  vec3 s = mix(cIvory * .93, cAqua * .96, smoothstep(0., .62, d.y));
  vec3 sea = mix(cTurq * .5, cIvory * .8, smoothstep(-.3, 0., d.y));
  return mix(sea, s, smoothstep(-.02, .02, d.y));
}
// What the moon looks like along a ray from p in direction d: rgb, a = 1 when hit.
vec4 moonRay(vec3 p, vec3 d){
  vec3 oc = p - MOONC; float b = dot(oc, d), c = dot(oc, oc) - 1440000.;
  float disc = b * b - c;
  if (disc < 0. || -b < 0.) return vec4(0.);
  float t = -b - sqrt(disc);
  vec3 n = (oc + d * t) / 1200.;
  float nl = max(dot(n, uSun), 0.);
  vec3 col = cIvory * .7 * SUNC * nl + cSlate * .36 + cTurq * .2 * max(-n.y, 0.);
  col *= .7 + .6 * fbm(n.xz * 11.);
  return vec4(col, smoothstep(0., 260000., disc));
}
// Fade an under-water colour toward the hill's blue heart; adds the caustic net. V = unit vector to camera.
vec3 underwater(vec3 col, vec3 p, vec3 V){
  float d = surfY(p.xz) - p.y;
  if (d <= 0.) return col;
  float s = d * mix(2.1, 1., abs(V.y));
  vec3 T = exp(-s * vec3(1. / 22., 1. / 44., 1. / 58.));
  float sh = .55 + .45 * moonShade(p);
  col *= 1. + caustic(p.xz * .11, uTime) * exp(-d / 16.) * .9 * sh;
  return mix(cDeep * (.5 + .42 * sh), col, T);
}
vec3 lit(vec3 alb, vec3 n, vec3 p){
  float nl = max(dot(n, uSun), 0.) * moonShade(p);
  vec3 amb = mix(cSlate * .42, cAqua * .5, n.y * .5 + .5) + cTurq * .14 * max(-n.y, 0.);
  return alb * (SUNC * nl + amb);
}
`;
const VERT_PARS = /* glsl */`
#include <fog_pars_vertex>
varying vec3 vLp; varying vec3 vCam;
vec3 camLocal(){ return (cameraPosition - modelMatrix[3].xyz) * mat3(modelMatrix); }
`;
// expects `vec3 lp` (hero-local position) to be defined
const VERT_END = /* glsl */`
  vLp = lp; vCam = camLocal();
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;
const FRAG_PARS = /* glsl */`
#include <fog_pars_fragment>
varying vec3 vLp; varying vec3 vCam;
float fogF(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fogMix(vec3 c){
#ifdef USE_FOG
  return mix(c, fogColor, fogF());
#else
  return c;
#endif
}
// premultiplied (a) or additive (a = 0) colours
vec3 fogMixP(vec3 c, float a){
#ifdef USE_FOG
  return mix(c, fogColor * a, fogF());
#else
  return c;
#endif
}
`;

// ---------------------------------------------------------------------------------------------
// small geometry helpers
// ---------------------------------------------------------------------------------------------
function polarGrid(radii, spokes) {
  const n = radii.length, pos = new Float32Array(n * spokes * 3), ring = new Float32Array(n * spokes);
  for (let i = 0; i < n; i++) for (let j = 0; j < spokes; j++) {
    const a = (j / spokes) * Math.PI * 2, k = i * spokes + j;
    pos[k * 3] = Math.sin(a) * radii[i]; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = Math.cos(a) * radii[i]; ring[k] = i;
  }
  const idx = new Uint32Array((n - 1) * spokes * 6); let o = 0;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < spokes; j++) {
    const a = i * spokes + j, b = i * spokes + (j + 1) % spokes, c = a + spokes, d = b + spokes;
    idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return { g, ring };
}
// BufferGeometry.computeVertexNormals() for an indexed grid with plain Float32 positions: the same sums in the same
// order with the same rounding (so the same normals to the last bit), but the page is handed back every 3000
// triangles. Done in one go, the normals of the moon's belly or of the reef flat hold a frame on their own.
export async function vertexNormalsInSlices(g, handBack) {
  const P = g.attributes.position.array, I = g.index.array, N = new Float32Array(P.length);
  const normal = new THREE.BufferAttribute(N, 3); g.setAttribute('normal', normal);
  for (let f = 0, nf = I.length; f < nf; f += 3) {
    if (f % 9000 === 8997) await handBack();
    const a = I[f] * 3, b = I[f + 1] * 3, c = I[f + 2] * 3;
    const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2];        // C - B
    const vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];        // A - B
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;       // (C - B) x (A - B)
    const ax = N[a] + nx, ay = N[a + 1] + ny, az = N[a + 2] + nz, bx = N[b] + nx, by = N[b + 1] + ny, bz = N[b + 2] + nz, cx = N[c] + nx, cy = N[c + 1] + ny, cz = N[c + 2] + nz;
    N[a] = ax; N[a + 1] = ay; N[a + 2] = az; N[b] = bx; N[b + 1] = by; N[b + 2] = bz; N[c] = cx; N[c + 1] = cy; N[c + 2] = cz;
  }
  await handBack();
  for (let i = 0, n = N.length; i < n; i += 3) {
    const x = N[i], y = N[i + 1], z = N[i + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    N[i] = x * k; N[i + 1] = y * k; N[i + 2] = z * k;
  }
  normal.needsUpdate = true;
}
// tiny mesh builder with per-vertex colour and a "part" id, used for the boat
class Soup {
  constructor() { this.p = []; this.c = []; this.k = []; this.u = []; this.i = []; }
  v(x, y, z, col, part = 0, u = 0, v = 0) { this.p.push(x, y, z); this.c.push(col.r, col.g, col.b); this.k.push(part); this.u.push(u, v); return this.p.length / 3 - 1; }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.i.push(a, b, c); }
  // box between two points with a square section (w, h), 12 triangles
  beam(ax, ay, az, bx, by, bz, w, h, col, part = 0) {
    const d = new THREE.Vector3(bx - ax, by - ay, bz - az), up = Math.abs(d.clone().normalize().y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3().crossVectors(d, up).normalize().multiplyScalar(w * 0.5), t = new THREE.Vector3().crossVectors(s, d).normalize().multiplyScalar(h * 0.5);
    const id = [];
    for (let e = 0; e < 2; e++) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const k = e ? 0.8 : 1; // slight taper
      id.push(this.v((e ? bx : ax) + (s.x * sx + t.x * sy) * k, (e ? by : ay) + (s.y * sx + t.y * sy) * k, (e ? bz : az) + (s.z * sx + t.z * sy) * k, col, part));
    }
    for (let q = 0; q < 4; q++) { const n = (q + 1) % 4; this.quad(id[q], id[n], id[4 + n], id[4 + q]); }
    this.quad(id[3], id[2], id[1], id[0]); this.quad(id[4], id[5], id[6], id[7]);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.k, 1));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i);
    const flat = g.toNonIndexed(); flat.computeVertexNormals(); g.dispose();
    return flat;
  }
}


// ---------------------------------------------------------------------------------------------
// seabed preview disc (opts.bed): wet reef flat outside, caustic-lit bed under the foot of the hill
// ---------------------------------------------------------------------------------------------
function makeBed(K) {
  const { g } = polarGrid([0, 400, 800, 1200, 1390, 1410, 1700, 2600, 5200], 72);
  const mat = K.mk(/* glsl */`
    varying vec2 vWp;
    void main(){ vec3 lp = position; lp.y = BEDY; vWp = (modelMatrix * vec4(lp, 1.)).xz; ${VERT_END} }`, /* glsl */`
    varying vec2 vWp;
    void main(){
      vec3 toC = vCam - vLp; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
      vec2 w = vWp; float r = length(vLp.xz);
      float big = fbm(w * .012), far = 1. / (1. + dist / 500.);
      float rip = sin((w.x * .9 + w.y * .35) * 2.4 + fbm(w * .07) * 9.) * .5 + .5;
      vec3 sand = cIvory * (.50 + .12 * big + .06 * rip * far);
      float ch = smoothstep(.56, .7, fbm(w * .0055 + 3.1));                      // channels
      sand = mix(sand, cTurq * .32 + cIvory * .16, ch * .7);
      vec2 cg = w / 13., ci = floor(cg), cf = fract(cg) - .5; float hh = h21(ci);   // coral heads
      float cd = length(cf - (vec2(h21(ci + 3.3), h21(ci + 7.7)) - .5) * .6);
      float head = smoothstep(.2 * hh + .05, .03, cd) * step(.42, hh);
      vec3 coralC = mix(cSlate * .55, mix(cIvory * .62, cTurq * .5, h21(ci + 1.7)), .65);
      sand = mix(sand, coralC * (.55 + .6 * clamp(1. - cd * 4., 0., 1.)), head);
      float grass = smoothstep(.5, .68, fbm(w * .021 + 11.)) * (1. - head);        // seagrass, combed
      sand = mix(sand, vec3(.09, .22, .15) + cTurq * .1, grass * .7 * (.55 + .45 * vn(w * vec2(.9, 3.2))));
      vec3 n = vec3(0., 1., 0.);
      float depth = tideH(vLp.xz) - BEDY;
      float wet = smoothstep(1900., 1400., r);
      vec3 col = lit(sand * mix(1., .7, wet), n, vLp);
      if (r < 1400. && depth > .0) {
        col = underwater(col, vLp, V);
      } else {
        vec2 rs = (vec2(vn(w * .9 + uTime * .3), vn(w * .9 - uTime * .25 + 5.)) - .5) * .05;
        vec3 R = normalize(vec3(-V.x + rs.x, abs(V.y) + .02, -V.z + rs.y));
        float fres = .04 + .96 * pow(1. - clamp(V.y, 0., 1.), 5.);
        vec4 mr = moonRay(vLp, R);
        vec3 refl = mix(skyCol(R), mr.rgb, mr.a);
        float pool = smoothstep(.53, .57, fbm(w * .03 + 5.) + ch * .2) * (1. - head);
        // rivulets draining toward the hill
        vec2 dirn = vLp.xz / max(r, 1.);
        float rv = vn(vec2(dot(w, vec2(-dirn.y, dirn.x)) * .5, dot(w, dirn) * .03 + uTime * .5));
        float riv = smoothstep(.78, .9, rv) * wet * (1. - pool);
        col = mix(col, refl, max(pool * (.45 + .55 * fres), wet * fres * .75));
        col += refl * riv * .25;
        float sp = pow(max(dot(R, uSun), 0.), 300.) * moonShade(vLp);
        col += SUNC * sp * 5. * max(pool, wet * .4);
      }
      gl_FragColor = vec4(fogMix(col), 1.);
    }`);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = -0.5;
  return m;
}

// ---------------------------------------------------------------------------------------------
// the dark heart: a second mound 55 m inside the first
// ---------------------------------------------------------------------------------------------
function makeCore(K) {
  const radii = []; for (let i = 0; i <= 44; i++) radii.push(790 * Math.pow(i / 44, 1.15));
  const { g } = polarGrid(radii, 96);
  const mat = K.mk(/* glsl */`
    varying vec3 vN;
    // 55 m inside at the foot, 24 m under the shoulders and summit: seen from the slope its skyline then sits just
    // under the water's own, so the hill never shows sky through its upper shell
    float coreH(vec2 p){ float r = length(p); return 250. * exp(-dot(p, p) / 369800.) + 20. * exp(-r / 60.) - mix(24., 55., smoothstep(260., 800., r)); }
    void main(){
      vec3 lp = position;
      float h = coreH(lp.xz), e = 2.;
      vN = normalize(vec3(h - coreH(lp.xz + vec2(e, 0.)), e, h - coreH(lp.xz + vec2(0., e))));
      lp.y = max(h, BEDY - 1.5);
      ${VERT_END} }`, /* glsl */`
    varying vec3 vN; uniform vec3 uShA, uShB;
    void main(){
      vec3 V = normalize(vCam - vLp);
      float hgt = clamp(vLp.y / 210., 0., 1.), sh = moonShade(vLp);
      float nl = max(dot(vN, uSun), 0.);
      vec3 col = mix(cDeep * .6, cDeep * .95, hgt) * (.62 + .55 * nl * sh) * mix(1., .6, smoothstep(140., 520., length(vCam - vLp)));
      // slow broad shafts: bands across the sun direction, so they stretch along it
      vec2 sp = vec2(dot(vLp, uShA), dot(vLp, uShB));
      float s1 = smoothstep(.42, .8, vn(sp * vec2(.035, .011) + vec2(uTime * .035, 0.)));
      float s2 = smoothstep(.5, .85, vn(sp * vec2(.09, .02) - vec2(uTime * .05, 3.)));
      col += (cTurq * .36 + cAqua * .12) * (s1 + .5 * s2) * (.35 + .65 * nl) * sh;
      col += cTurq * .05 * caustic(vLp.xz * .03, uTime * .6) * hgt;
      col = mix(col, cDeep * .5, .35 * (1. - abs(dot(vN, V))));
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, {}, { uShA: K.SH.uShA, uShB: K.SH.uShB });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------------------------------------
// the water surface: one transparent layer over everything inside the hill
// ---------------------------------------------------------------------------------------------
function makeSurface(K) {
  const radii = [0];
  let r = 0.35; while (r < 60) { radii.push(r); r *= 1.19; }           // the cusp
  const n1 = radii.length, mid = Math.round(96 * (0.75 + 0.25 * K.detail));
  for (let i = 0; i <= mid; i++) radii.push(60 + (1380 - 60) * Math.pow(i / mid, 1.08));
  radii.push(1390, 1395, 1397.6, 1399, 1399.7, EDGE_R);
  const spokes = 160, { g, ring } = polarGrid(radii, spokes);
  const lip = new Float32Array(ring.length), last = radii.length - 1;
  for (let k = 0; k < ring.length; k++) { const d = last - ring[k]; lip[k] = d === 0 ? 1 : d === 1 ? 0.55 : d === 2 ? 0.2 : d === 3 ? 0.05 : 0; }
  g.setAttribute('aLip', new THREE.BufferAttribute(lip, 1));
  const mat = K.mk(/* glsl */`
    attribute float aLip; varying float vLip;
    void main(){
      vec3 lp = position; vLip = aLip;
      lp.y = mix(surfY(lp.xz), BEDY - .05, aLip);
      ${VERT_END} }`, /* glsl */`
    varying float vLip; uniform vec4 uHit[9]; uniform vec3 uShA, uShB;
    float ripH(vec2 p, float fine){
      float t = uTime;
      return vn(p * vec2(.5, .34) + vec2(t * .55, t * .3)) * .2 * fine
           + vn(p * .12 - vec2(t * .17, -t * .11)) * .85
           + vn(p * .027 + vec2(-t * .05, t * .04)) * 2.3;
    }
    // top of what is solid to the eye under the water: the core (same formula as makeCore), else the bed
    float coreY(vec2 q){ float rq = length(q); return max(250. * exp(-dot(q, q) / 369800.) + 20. * exp(-rq / 60.) - mix(24., 55., smoothstep(260., 800., rq)), BEDY); }
    void main(){
      vec3 toC = vCam - vLp; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
      vec2 p = vLp.xz; float r = length(p); vec2 rh = p / max(r, .5);
      float fine = 1. / (1. + dist / 260.), e = .4;
      float h0 = ripH(p, fine);
      vec2 sL = vec2(ripH(p + vec2(e, 0.), fine) - h0, ripH(p + vec2(0., e), fine) - h0) / e;   // long slow undulations
      float ph = swellPh(p), sk = swellK(r);
      sL += rh * (.045 * cos(ph) * sk + .022 * cos(r * .37 + uTime * 1.5) * sk * fine);
      float nearK = 1. / (1. + dist / 28.), nearM = 1. / (1. + dist / 95.);   // close to the lens: wind ripples and cat's-paws
      vec2 t2 = vec2(uTime * .8, -uTime * .6);
      vec2 sF = (vec2(vn(p * 1.7 + t2), vn(p * 1.7 - t2 + 5.3)) - .5) * (.36 + .3 * uWind) * nearK;
      sL += (vec2(vn(p * .21 + t2 * .5), vn(p * .21 - t2 * .4 + 8.1)) - .5) * .22 * uWind;
      sF += (vec2(vn(p * 4.3 - t2 * 1.6), vn(p * 4.3 + t2 * 1.4 + 2.1)) - .5) * .22 * nearK * nearK;
      sF += (vec2(vn(p * .66 + t2 * .55), vn(p * .66 - t2 * .45 + 3.3)) - .5) * .26 * nearM;
      vec2 s = sL + sF;
      vec2 g = tideG(p);
      vec3 Nm = normalize(vec3(-g.x, 1., -g.y));
      vec3 N = normalize(vec3(-g.x - s.x, 1., -g.y - s.y));
      // the mirror image is taken with the long undulations calmed near the lens: close up they smeared the moon's
      // reflection into blotches a quarter of the frame wide; far away they are what breaks it up
      vec2 sR = sL * mix(.14, .75, smoothstep(70., 420., dist)) + sF * .6;
      vec3 Nr = normalize(vec3(-g.x - sR.x, 1., -g.y - sR.y));
      float NV = max(dot(Nr, V), .02), NVm = max(dot(Nm, V), 0.);
      float F = .02 + mix(.44, .28, smoothstep(30., 380., dist)) * pow(max(1. - NV, 0.), 5.);   // far off, the grazing mirror of the moon's lit limb whitened the whole flank
      float farK = smoothstep(30., 380., dist);                         // 0 beside the lens .. 1 across the hill
      vec3 R = reflect(-V, Nr);
      // facets tipped away from the eye mirrored the milk-pale horizon (or the sea below it) as flat slabs: near the
      // lens every facet mirrors sky from a little above the horizon instead
      R = normalize(vec3(R.x, mix(max(abs(R.y), .2), R.y, smoothstep(40., 220., dist)), R.z) + vec3(0., 1e-4, 0.));
      vec4 mr = moonRay(vLp, R);
      vec3 refl = mix(skyCol(R), mix(mr.rgb, cAqua * .72, .28), mr.a * mix(.5, .9, farK));
      float shade = moonShade(vLp);
      float cl = smoothstep(.52, .74, fbm(p * .0017 + vec2(uTime * .004, 0.)));   // cloud shadows
      float sunK = shade * (1. - .3 * cl);
      float rs = max(dot(R, uSun), 0.);
      float spk = smoothstep(.8, 1., vn(p * 9. + vec2(uTime * 1.9, -uTime * 1.3)) * vn(p * 17. - vec2(uTime * 1.6, uTime * 1.1)) * 2.6);
      vec3 glit = SUNC * vec3(1., .93, .8) * (pow(rs, 900.) * 2.5 + pow(rs, 160.) * spk * 4.5 + pow(rs, 120.) * .2) * sunK;
      // small glints on the ripple faces that tilt toward the sun (the true mirror point is far off to port)
      vec2 sunH = uSun.xz / max(length(uSun.xz), 1e-3);
      float facet = dot(sF, -sunH);
      glit += SUNC * vec3(1., .95, .85) * smoothstep(.085, .15, facet) * smoothstep(.55, .9, spk + vn(p * 5.1 + t2 * 2.) * .9) * 1.7 * sunK * smoothstep(3., 9., dist);
      float low = 1. - smoothstep(.2, .5, uSun.y);                       // 1 at golden hour and dawn
      float sideS = dot(rh, sunH) * smoothstep(20., 300., r);
      // ---- THE HILL AS A BODY OF CLEAR WATER ----
      // March the view ray into the hill (12 steps, no textures): dCore = metres of water before the eye meets the
      // core or the bed, chord = metres of hill the ray would cross in all (to the far skin or the bed). Opacity grows
      // with the first, the colour deepens with the second: thin water (foot, skyline, peak) is pale and lit through,
      // the long chords through the middle are the dark heart. Nothing switches, so no straight colour boundary.
      float thick = max(tideH(p) - BEDY, 0.);
      vec3 Dm = -V;
      float dCore = 2000., chord = 2000., tP = 0., cP = max(vLp.y - coreY(p), .02), sP = .5;
      for (int i = 0; i < 12; i++) {
        float tm = 6. * pow(1.68, float(i));
        vec3 Pm = vLp + Dm * tm; float rq = length(Pm.xz);
        float gq = 250. * exp(-rq * rq / 369800.);
        float cy = max(gq + 20. * exp(-rq / 60.) - mix(24., 55., smoothstep(260., 800., rq)), BEDY);
        float sy = gq + uQuiv.z * (.6 * exp(-rq / 45.) + .4 * exp(-rq / 9.)) - 3.4 * smoothstep(1250., 1500., rq);
        float cc = Pm.y - cy, ss = min(sy + 1.2 - Pm.y, Pm.y - BEDY + .5);   // 1.2 m: the swell and ripples ride above tideH
        if (dCore > 1999. && cc < 0.) dCore = mix(tP, tm, cP / max(cP - cc, 1e-3));
        if (chord > 1999. && ss < 0.) chord = mix(tP, tm, sP / max(sP - ss, 1e-3));
        tP = tm; cP = max(cc, .02); sP = max(ss, .02);
      }
      float dW = min(dCore, chord);
      float exitK = smoothstep(0., 60., dCore - chord);                 // the ray leaves through the far skin: the rim
      float farS = smoothstep(140., 520., dist);
      float heart = 1. - exp(-chord / mix(120., 190., farS));
      heart *= heart;
      vec3 pale = (cAqua * .5 + cTurq * .6) * (.66 + .5 * sunK);      // thin water, lit through
      pale = mix(cAqua * .9 * (.6 + .45 * sunK), pale, smoothstep(.4, 9., thick));
      vec3 deepC = (cDeep * mix(.95, .5, farS) + cTurq * .015) * (.6 + .4 * sunK);         // the tone map shows linear cDeep as a mid blue: the heart is written at .4 of it    // the heart
      // a low sun lights the hill through: green-amber on the sun's flank, deep teal on the far one
      vec3 thru = mix(cDeep * .46 + cTurq * .06, cTurq * .8 + SUNC * vec3(.42, .36, .04), smoothstep(-.4, .75, sideS));
      pale = mix(pale, thru * (.72 + .4 * sunK), low * .8);
      deepC = mix(deepC, deepC * (.5 + .9 * smoothstep(-.6, .8, sideS)) + SUNC * cTurq * .1 * max(sideS, 0.), low * .7);
      vec3 body = mix(pale, deepC, heart);
      body *= .78 + .3 * max(dot(Nm, uSun), 0.) * sunK;
      float rim = 1. - NVm; rim *= rim;
      body += cAqua * .2 * rim * rim * (1. - .6 * heart);               // thin, lit-through silhouette
      body *= .95 + .07 * sin(ph) * sk;
      body += cAqua * .09 * smoothstep(.55, 1., sin(ph)) * sk * (1. - farK);   // swell crests under the lens, closing on the peak
      // broad sun shafts inside the heart: beams fixed in the hill on two upright planes (one nearer the eye, one
      // beyond the axis), so they slant down from the sun's side and slide against each other and the skin as the eye moves
      float dz = min(Dm.z, -.05);
      vec3 Pa = vLp + Dm * clamp((170. - vLp.z) / dz, 0., chord), Pb = vLp + Dm * clamp((-210. - vLp.z) / dz, 0., chord);
      float ca = dot(Pa, uShB), cb = dot(Pb, uShB);
      float ba = smoothstep(.52, .93, .5 + .5 * sin(ca * .021 + 2.2 * vn(vec2(ca * .004, uTime * .02)) + uTime * .03));
      float bb = smoothstep(.6, .95, .5 + .5 * sin(cb * .037 + 2.6 * vn(vec2(cb * .006 + 9., uTime * .025)) - uTime * .04 + 1.7));
      float shF = ba * .8 * smoothstep(-25., 120., Pa.y) + bb * .5 * smoothstep(-25., 150., Pb.y);
      body += (cAqua * .42 + cTurq * .5) * shF * heart * (.25 + .75 * sunK) * mix(.1, .7, farS);
      // shoals far inside: silver smudges at true positions in the hill, so they shift against the heart as the eye moves
      float shoalS = 0.;
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 cq = (i == 0 ? vec2(-270., 310.) : i == 1 ? vec2(200., 430.) : i == 2 ? vec2(-60., 540.) : vec2(340., 190.)) + vec2(sin(uTime * .05 + fi * 2.1), cos(uTime * .04 + fi)) * 35.;
        vec3 Cq = vec3(cq.x, tideH(cq) - 34. - 12. * fi, cq.y);
        float tc = clamp(dot(Cq - vLp, Dm), 0., chord);
        vec3 off = Cq - (vLp + Dm * tc); off.y *= 2.2;
        float mS = exp(-dot(off, off) / (800. + 320. * fi)); mS = mS * (.6 + .8 * mS);
        float fl = smoothstep(.3, .75, vn(off.xz * .07 + off.yy * .09 + vec2(uTime * .5, fi * 5.)));
        shoalS += mS * (.35 + .65 * fl) * smoothstep(170., 420., length(vCam - Cq)) * exp(-tc / 1300.);
      }
      body = mix(body, cIvory * .8 + cWhite * .25, clamp(shoalS * 1.2, 0., 1.) * .7 * (.6 + .4 * sunK));
      float aB = 1. - exp(-dW / mix(400., 165., smoothstep(8., 60., thick)));   // the thin foot is clearer still: kelp and reef show through it                                  // beside the lens the skin is thin: you look in
      aB = max(aB, exitK * .88);
      aB = max(aB, .05);
      // the peak is a thin column of clear water: pale, luminous, a lens showing the sky upside down
      float lq = length(p - uQuiv.xy), tipK = exp(-lq / 26.), tipL = smoothstep(52., 15., lq);
      // the peak is a column of clear water, a lens: sky below, the pale horizon across it, the sea on top (all
      // upside down), a darker heart and a bright thin rim where it turns away from the eye
      float cx = clamp(dot(normalize(Nm.xz + vec2(1e-4)), normalize(V.xz + vec2(1e-4))), 0., 1.), edgeL = 1. - cx;
      float hh = clamp((vLp.y - 257.) / 44., 0., 1.);
      float dyL = (.46 - hh) * 1.25 + (sL.x - sL.y) * .7 + edgeL * edgeL * .5 + .09 * sin(hh * 23. - uTime * 2.2 + cx * 3.);
      vec3 lens = skyCol(normalize(vec3(.3, dyL * (dyL > 0. ? 2.6 : 1.), 1.)));        // a thin milk horizon, not a pale half
      lens = mix(lens, cTurq * .62 + cDeep * .25, smoothstep(-.02, -.3, dyL) * .75);
      lens *= mix(.6, 1.05, smoothstep(.15, .85, edgeL)) * (.74 + .34 * sunK);
      lens += cWhite * .55 * edgeL * edgeL * edgeL * edgeL * (.45 + .55 * sunK) + cAqua * .25 * smoothstep(.75, 1., edgeL);
      body = mix(body, lens, tipL * .96); aB = mix(aB, .95, tipL);
      // crest lines of the climbing swell
      refl += cIvory * .14 * smoothstep(.75, 1., sin(ph)) * sk;
      // seen across the hill: eight or so broad bright swell rings wrapped round it like contours, climbing; and the
      // moon's slate underside mirrored on the upper slope
      float ring2 = smoothstep(.72, 1., sin(r * .043 + uTime * .4 + 2.5 * vn(p * .004))) * sk * farS * smoothstep(.04, .2, NVm);
      body += (cIvory * .2 + cAqua * .1) * ring2 * (.5 + .5 * sunK);
      // across the hill a true grazing mirror would paint the whole flank with sky: where the eye looks into the heart
      // the mirror is turned well down, so the water reads as clear and deep
      F = max(F, mr.a * .16 * farS) * (1. - .86 * heart * farS) * (1. - .45 * low * heart);   // a low sun's cream horizon would whiten the near water
      vec3 Rf = refract(-V, N, .75);
      float cosr = max(dot(-Rf, Nm), .25), deepK = smoothstep(6., 40., thick) * (1. - tipK);
      vec3 P1 = vLp + Rf * (7. / cosr), P2 = vLp + Rf * (22. / cosr);
      vec2 q1 = vec2(dot(P1, uShA) * .1 + uTime * .05, dot(P1, uShB) * .024), q2 = vec2(dot(P2, uShA) * .045 - uTime * .03, dot(P2, uShB) * .011 + 3.);
      float v1 = smoothstep(.45, .85, vn(q1) * .7 + vn(q1 * 2.3 + 1.7) * .3);
      float v2 = smoothstep(.42, .8, vn(q2) * .7 + vn(q2 * 2.1 + 5.1) * .3);
      vec3 shaftC = (cAqua * .5 + cTurq * .4) * (v1 * .2 + v2 * .26) * deepK * sunK / (1. + dist / 650.) * mix(2.6, 1., farK);
      vec3 col = refl * F + glit + (body * aB + shaftC) * (1. - F);
      float A = 1. - (1. - F) * (1. - aB);
      // foam: streaks drawn up the slope, lace at the lip, rain where the sheets land
      float foam = 0.;
      float ln = 1. - abs(2. * vn(rh * 130. + vn(p * .02) * 1.5) - 1.);          // thin streaks drawn up the slope
      float gate = smoothstep(.5, .72, vn(rh * 9. + vec2(r * .011 - uTime * .12)));
      float dash = smoothstep(.35, .7, vn(vec2(r * .09 - uTime * .5, dot(rh, vec2(23., 41.))))) * vn(p * .9 + uTime * .3);
      foam += smoothstep(.86, .99, ln) * gate * dash * dash * smoothstep(1250., 950., r) * smoothstep(10., 60., r) * (1. + 1.6 * smoothstep(280., 70., r)) * (.5 + .4 * (1. - farK)) / (1. + dist / 500.) * smoothstep(4., 16., dist);
      float lace = vn(p * .6 + uTime * .7) * vn(p * 1.9 - uTime * .9);                    // the lip: a glassy face with a foam foot and lace behind it
      foam += smoothstep(1384., 1398., r) * smoothstep(.12, .42, lace) * .8 + vLip * (.3 + .7 * smoothstep(.2, .5, vn(p * 2.3 + uTime * 1.6))) + smoothstep(.5, 1., vLip);
      float rain = 0.;
      for (int i = 0; i < 9; i++) {
        vec4 hI = uHit[i]; float d = length(p - hI.xy);
        float m = smoothstep(hI.z * 1.3, hI.z * .3, d) * hI.w;
        rain += m * (.3 + .7 * vn(p * 1.7 + vec2(float(i) * 7., uTime * 3.)));
      }
      foam += rain * .62;
      // trade wind: whitecaps that run up the slope
      // many small crisp crests, long across the slope and short up it, in gusty patches, thinning with distance
      float th = atan(p.x, abs(p.y) + 1e-3);
      vec2 c1 = vec2(th * (150. + 270. * smoothstep(120., 900., r)), r * 1.35 - uTime * 2.4), c2 = vec2(th * (50. + 100. * smoothstep(120., 900., r)), r * .5 - uTime * 1.5);
      float gust = smoothstep(.3, .62, vn(p * .03 + vec2(uTime * .06, 0.)));
      float cr1 = smoothstep(.7, .78, vn(c1) * .8 + vn(c1 * vec2(2.3, 1.7) + 5.) * .2) / (1. + dist / 80.);
      float cr2 = smoothstep(.69 + .08 * smoothstep(120., 900., dist), .8, vn(c2) * .8 + vn(c2 * vec2(2.1, 1.9) + 9.) * .2) * smoothstep(30., 130., dist) / (1. + dist / 420.);
      foam += uWind * (cr1 + cr2 * .85) * gust * (.55 + .45 * vn(p * 2.1 + uTime)) * smoothstep(1390., 1200., r) * smoothstep(20., 90., r);
      foam = clamp(foam, 0., 1.);
      vec3 foamC = cWhite * .74 * (.42 + .58 * sunK * max(dot(Nm, uSun), .35)) + cSlate * .08;
      col = mix(col, foamC, foam); A = mix(A, 1., foam);
      col = fogMixP(col, A);
      gl_FragColor = vec4(col, A);
    }`, { transparent: true, premultipliedAlpha: true, depthWrite: true }, { uHit: K.SH.uHit, uShA: K.SH.uShA, uShB: K.SH.uShB });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2;
  return m;
}

// ---------------------------------------------------------------------------------------------
// the moon's belly: lower cap of a 2.4 km stone sphere with real crater relief, wet, with lakes
// ---------------------------------------------------------------------------------------------
const dirAt = (d, phi, out = new THREE.Vector3()) => { const a = d / MOON_R; return out.set(Math.sin(a) * Math.sin(phi), -Math.cos(a), Math.sin(a) * Math.cos(phi)); };

function makeCraters(rng) {
  const list = [];
  const add = (d, phi, rc, o = {}) => list.push({ dir: dirAt(d, phi), d, phi, rc, depth: o.depth ?? rc * rng.range(0.16, 0.24), rim: o.rim ?? rc * rng.range(0.06, 0.1), lake: !!o.lake, peak: !!o.peak });
  add(0, 0, 80, { depth: 15, rim: 6.5, lake: true });                                  // the lowest crater, over the peak
  add(Math.hypot(72, 178), Math.atan2(-72, 178), rng.range(38, 46), { lake: true });   // port of the climb: its sheet passes the path
  const far = (c, d, phi, rc, k) => { const v = dirAt(d, phi); return list.every((o) => o.dir.distanceTo(v) * MOON_R > (o.rc + rc) * k); };
  for (let i = 0, tries = 0; i < 30 && tries < 600; tries++) {
    const d = rng.range(105, 640), phi = rng.range(0, Math.PI * 2), rc = rng.range(14, 30) + (rng.chance(0.35) ? rng.range(10, 34) : 0);
    if (!far(0, d, phi, rc, 1.02)) continue;
    add(d, phi, rc, { lake: rc > 20 && rng.chance(0.5), peak: rc > 34 && rng.chance(0.6) }); i++;
  }
  for (let i = 0, tries = 0; i < 34 && tries < 600; tries++) {
    const d = rng.range(680, 2350), phi = rng.range(0, Math.PI * 2), rc = rng.range(55, 150) + (rng.chance(0.3) ? rng.range(30, 90) : 0);
    if (!far(0, d, phi, rc, 0.85)) continue;
    add(d, phi, rc, { peak: rng.chance(0.5), depth: rc * rng.range(0.12, 0.2) }); i++;
  }
  // five old basins, 220-300 m across with tall rims, laid over the small craters of the belly: the relief that
  // still reads from 150-600 m below (appended last and drawn from their own fork, so nothing else is reshuffled)
  const rb = rng.fork('big');
  for (const [d, phi, rc] of [[400, 0.75, 130], [440, -0.72, 118], [470, 2.35, 150], [390, -2.5, 112], [575, 3.25, 140]]) {
    const r2 = rc * rb.range(0.9, 1.1);
    add(d + rb.range(-20, 20), phi + rb.range(-0.12, 0.12), r2, { depth: r2 * 0.2, rim: r2 * 0.13, peak: rb.chance(0.5) });
  }
  return list;
}
// relief (metres outward from the smooth sphere) and tones at a unit direction (rest pose)
function moonRelief(craters, v, tone) {
  let h = 0, lake = 0, wet = 0, cav = 0;
  for (let i = 0; i < craters.length; i++) {
    const c = craters[i], dx = v.x - c.dir.x, dy = v.y - c.dir.y, dz = v.z - c.dir.z;
    const x = Math.sqrt(dx * dx + dy * dy + dz * dz) * MOON_R / c.rc;
    if (x > 2.8) continue;
    let b = 0;
    if (x < 1) {
      b = -c.depth * (1 - Math.pow(x, 2.6));
      if (c.peak) b += c.depth * 0.42 * Math.exp(-(x * x) / 0.03);
      const lvl = -c.depth * 0.5;
      if (c.lake && b < lvl) { lake = Math.max(lake, Math.min(1, (lvl - b) / (c.depth * 0.06))); b = lvl; }
      cav = Math.max(cav, 1 - x * x);
    }
    const w = x < 1 ? 0.13 : 0.34, e = (x - 1) / w;
    b += c.rim * Math.exp(-e * e);
    if (x > 1) b += c.rim * 0.25 * Math.exp(-(x - 1) * 2.2);
    h += b;
    if (c.lake) wet = Math.max(wet, 1 - Math.min(1, Math.abs(x - 0.95) / 0.75));
  }
  if (tone) { tone[0] = lake; tone[1] = wet; tone[2] = cav; }
  return h;
}

async function makeMoon(K, craters) {
  const alphas = [];
  for (let i = 0; i <= 62; i++) alphas.push(0.5 * Math.pow(i / 62, 1.25));
  for (let i = 1; i <= 24; i++) alphas.push(0.5 + 1.5 * Math.pow(i / 24, 1.3));
  const spokes = 192, { g } = polarGrid(alphas, spokes), pos = g.attributes.position.array;
  const tone = new Float32Array(alphas.length * spokes * 3), v = new THREE.Vector3(), t3 = [0, 0, 0], nz = K.noise;
  await K.yield();
  for (let i = 0; i < alphas.length; i++) { await K.yield();                                     // 16k vertices of relief: hand frames back
   for (let j = 0; j < spokes; j++) {
    const k = i * spokes + j, phi = -(j / spokes) * Math.PI * 2;   // mirrored, so the faces point outward (down)
    dirAt(alphas[i] * MOON_R, phi, v);
    let h = moonRelief(craters, v, t3);
    if (t3[0] < 0.5) h += 5 * nz.fbm3(v.x * 5, v.y * 5, v.z * 5, 3) + 1.6 * nz.n3(v.x * 24, v.y * 24, v.z * 24) * (1 - t3[0]);
    const R = MOON_R + h;
    pos[k * 3] = v.x * R; pos[k * 3 + 1] = v.y * R; pos[k * 3 + 2] = v.z * R;
    tone[k * 3] = t3[0]; tone[k * 3 + 1] = t3[1]; tone[k * 3 + 2] = t3[2];
  } }
  await K.yield();
  g.setAttribute('aTone', new THREE.BufferAttribute(tone, 3));
  await vertexNormalsInSlices(g, K.yield);
  await K.yield();
  const mat = K.mk(/* glsl */`
    attribute vec3 aTone; uniform mat3 uRot;
    varying vec3 vN; varying vec3 vTone; varying vec3 vRest;
    void main(){
      vec3 lp = uRot * position + MOONC; vN = uRot * normal; vTone = aTone; vRest = position;
      ${VERT_END} }`, /* glsl */`
    varying vec3 vN; varying vec3 vTone; varying vec3 vRest;
    vec3 pit(vec2 q, float thr){
      vec2 ci = floor(q), cf = fract(q) - .5; float hh = h21(ci);
      vec2 c = cf - (vec2(h21(ci + 2.1), h21(ci + 5.3)) - .5) * .5; float lc = length(c);
      float pd = lc / (.08 + .2 * h21(ci + 9.7)), pin = smoothstep(1.15, .85, pd) * step(thr, hh);
      return vec3(c / max(lc, 1e-3) * pin * smoothstep(0., .8, pd) * .5, pin);
    }
    void main(){
      vec3 toC = vCam - vLp; float dist = length(toC); vec3 V = toC / max(dist, 1e-3);
      vec3 n = normalize(vN);
      vec2 q = vRest.xz * .05 + vRest.yy * vec2(.023, -.017);
      // small pits to 3 m: lit crescents and a darker floor
      vec3 p1 = pit(q * .7, .82), p2 = pit(q * 2.6 + 7.3, .6) * (1. / (1. + dist / 500.)) * smoothstep(.38, .62, fbm(q * .13 + 4.));   // pits come in fields, not evenly
      vec2 bump = p1.xy + p2.xy; float pin = max(p1.z, p2.z);
      n = normalize(n + vec3(bump.x, 0., bump.y));
      float mott = fbm(q * .6) * .6 + fbm(q * 4.) * .4;
      float down = max(-n.y, 0.), dAx = length(vLp.xz);
      float wetZone = max(vTone.y, .75 * exp(-dAx * dAx / 250000.) * down);
      float streak = smoothstep(.4, .8, fbm(q * vec2(.5, 3.4) + 3.)) ;
      float wet = clamp(wetZone * (.45 + .75 * streak), 0., 1.);
      vec3 alb = cIvory * (.6 + .22 * mott) * (1. - .2 * pin) * (1. - .34 * vTone.z);
      alb *= mix(1., .55, wet);
      alb *= 1. - .3 * smoothstep(.5, .8, fbm(q * vec2(.22, 1.9) + 17.)) * (.4 + .6 * wetZone);   // tide stains
      // dark stains drawn from the crater lips toward the low point: radial streaks in the stone's own frame
      float dR = length(vRest.xz); vec2 un = vRest.xz / max(dR, 1.);          // a function of direction only: radial, and no seam
      float stn = smoothstep(.55, .8, vn(un * 15. + 3.) * .65 + vn(un * 5.7 + vec2(dR * .004, 5.)) * .35);
      alb *= 1. - .22 * stn * smoothstep(60., 220., dR) * smoothstep(.3, .62, vTone.z * .5 + fbm(q * .16 + 9.));   // in runs below the lips, never an even grain
      // the key is lowered for the stone so the port flank reads ivory well down toward the belly
      vec3 sm = normalize(vec3(uSun.x, uSun.y * .35 - .22, uSun.z));
      float nl = max(dot(n, sm) * .8 + .2, 0.); nl *= nl;
      float prox = exp(-dAx * dAx / 640000.);
      vec3 col = alb * SUNC * nl;
      vec3 Lb = normalize(vec3(uSun.x * .9, -.55, uSun.z * .9));                               // light off the sunlit sea, from below to port
      float nb = dot(n, Lb) * .5 + .5;
      col += alb * (cSlate * (.44 + 1.0 * nb * nb) + cTurq * (.08 + .3 * nb * nb) * down * prox);  // slate floor + sea bounce; the bounce models the relief
      col += (cAqua * .3 + cTurq * .12) * caustic(vLp.xz * .017, uTime * .36) * down * (.06 + 1.35 * exp(-dAx * dAx / 42000.)) * (1. - .5 * vTone.x);   // soft, slow, strong only over the peak
      float fres = 1. - max(dot(n, V), 0.); fres = fres * fres * fres;
      col += (cAqua * .5 + cIvory * .25) * fres * wet * .55;                                 // wet gloss
      // crater lakes clinging to the ceiling
      float shiver = caustic(vRest.xz * .09, uTime * 1.3);
      vec3 lakeC = cTurq * (.42 + .4 * shiver) + cAqua * (.12 + .5 * fres) + cDeep * .12;
      lakeC += cWhite * .9 * smoothstep(1.1, 1.5, shiver) * prox;
      col = mix(col, lakeC, vTone.x);
      // air between the eye and the stone: the far limb goes a tone paler and bluer and sinks into the haze
      float hz = 1. - exp(-dist / 3800.);
      col = mix(col, cAqua * .5 + cIvory * .42, hz * .56);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, {}, { uRot: K.SH.uRot });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------------------------------------
// sheets of water letting go of crater rim lips and falling onto the hill
// ---------------------------------------------------------------------------------------------
function makeSheets(K, craters) {
  const rng = K.rng.fork('sheets'), want = Math.round(5 + 4 * Math.min(1, Math.max(0, (K.detail - 0.6) / 0.4)));
  const t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), d = new THREE.Vector3();
  const rimPoint = (c, psi, out) => {
    t1.crossVectors(c.dir, Z).normalize(); t2.crossVectors(c.dir, t1);
    d.copy(c.dir).addScaledVector(t1, Math.cos(psi) * c.rc * 0.98 / MOON_R).addScaledVector(t2, Math.sin(psi) * c.rc * 0.98 / MOON_R).normalize();
    return out.copy(d).multiplyScalar(MOON_R + moonRelief(craters, d) + 0.4);
  };
  const p = new THREE.Vector3(), specs = [];
  const aim = (c, tx, tz) => { let best = 0, bv = -1e9; for (let i = 0; i < 96; i++) { const psi = i / 96 * Math.PI * 2; rimPoint(c, psi, p); const cx = c.dir.x * MOON_R, cz = c.dir.z * MOON_R, s = (p.x - cx) * tx + (p.z - cz) * tz; if (s > bv) { bv = s; best = psi; } } return best; };
  specs.push({ c: craters[0], psi: aim(craters[0], -0.59, -0.81), arc: 36 });      // the two veils that frame the portal
  specs.push({ c: craters[0], psi: aim(craters[0], 0.59, -0.81), arc: 36 });
  specs.push({ c: craters[1], psi: aim(craters[1], 1, 0.15), arc: 52 });           // passes the climb to port
  const cand = rng.shuffle(craters.filter((c, i) => i > 1 && c.d > 100 && c.d < 340 && c.rc >= 20));
  for (const c of cand) {
    if (specs.length >= want) break;
    const psi = rng.range(0, Math.PI * 2), arc = Math.min(90, c.rc * rng.range(1.3, 2.1));
    let ok = true;
    for (let i = 0; i <= 6; i++) { rimPoint(c, psi + (i / 6 - 0.5) * arc / c.rc, p); if (p.z > -40 && Math.abs(p.x) < 26) ok = false; }
    if (ok) specs.push({ c, psi, arc });
  }
  const NA = 14, NV = 16, top = [], mid = [], uv = [], sd = [], out = [], idx = [], m = new THREE.Vector3();
  specs.forEach((s, si) => {
    rimPoint(s.c, s.psi, m); s.mid = m.clone(); s.seed = rng();
    const base = top.length / 3, cx = s.c.dir.x * MOON_R, cz = s.c.dir.z * MOON_R;
    for (let a = 0; a <= NA; a++) {
      rimPoint(s.c, s.psi + (a / NA - 0.5) * s.arc / s.c.rc, p);
      const ox = p.x - cx, oz = p.z - cz, ol = Math.hypot(ox, oz) || 1;
      for (let v = 0; v <= NV; v++) { top.push(p.x, p.y, p.z); mid.push(m.x, m.y, m.z); uv.push(a / NA, v / NV); sd.push(s.seed, s.arc); out.push(ox / ol, oz / ol); }
    }
    for (let a = 0; a < NA; a++) for (let v = 0; v < NV; v++) { const i0 = base + a * (NV + 1) + v, i1 = i0 + NV + 1; idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3));
  g.setAttribute('aMid', new THREE.Float32BufferAttribute(mid, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(sd, 2));
  g.setAttribute('aOut', new THREE.Float32BufferAttribute(out, 2));
  g.setIndex(idx);
  const mat = K.mk(/* glsl */`
    attribute vec3 aMid; attribute vec2 aSeed; attribute vec2 aOut; uniform mat3 uRot;
    varying vec2 vUv; varying vec3 vS;
    void main(){
      vec3 tp = uRot * position + MOONC, md = uRot * aMid + MOONC;
      float v = uv.y;
      vec2 xz = mix(tp.xz, md.xz, .5 * v * sqrt(v));
      float foot = surfY(xz) + .3;
      xz += aOut * (sin(v * 8. - uTime * 2.1 + aSeed.x * 40.) * 1.8 + sin(v * 21. - uTime * 3.4 + uv.x * 5.) * .55) * v;
      vec3 lp = vec3(xz.x, mix(tp.y, foot, v), xz.y);
      vUv = uv; vS = vec3(aSeed, tp.y - foot);
      ${VERT_END} }`, /* glsl */`
    varying vec2 vUv; varying vec3 vS;
    void main(){
      float u = vUv.x, v = vUv.y, wM = vS.y, len = max(vS.z, 1.);
      float c = sqrt(v) * len * .11 - uTime * 1.05;                       // faster and more stretched lower down
      float a1 = vn(vec2(u * wM * .75 + vS.x * 90., c * 1.6));
      float a2 = vn(vec2(u * wM * 2.6 + vS.x * 31., c * 4.2 + 3.));
      float a3 = vn(vec2(u * wM * .22 + vS.x * 57., uTime * .25));          // where along the lip the water lets go
      float body = smoothstep(.2 + .22 * v, .7 + .12 * v, a1 * .62 + a2 * .38 + (1. - v) * .42);
      float ue = abs(u * 2. - 1.);
      float edge = smoothstep(1., .62, ue * (1. + .35 * v) + .2 * a1 + .16 * (1. - a3));
      float topR = smoothstep(0., .05, v - (.01 + .2 * (1. - a3) * (1. - a3) + .07 * a2));   // no straight top edge
      float mist = smoothstep(.45, 1., v) * (1. - ue * ue) * (.1 + .16 * a1);
      float a = max(body * edge * (.92 - .42 * v) * topR, mist * smoothstep(1., .93, v));
      float sh = moonShade(vLp);
      vec3 col = mix(cAqua * .62 + cSlate * .1, cWhite * .74, a1 * .7 + .3 * a2) * (.5 + .52 * sh);
      col += cWhite * .45 * a2 * a2 * a2 * sh * (1. - v * .5);
      gl_FragColor = vec4(fogMix(col), a);
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide }, { uRot: K.SH.uRot });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh, specs };
}

// ---------------------------------------------------------------------------------------------
// the rope of water at the tip, the beads it breaks into, and the light shafts inside the hill
// ---------------------------------------------------------------------------------------------
const BALL_GLSL = /* glsl */`
vec3 waterBall(vec3 n, vec3 V, vec3 p){
  float nv = max(dot(n, V), 0.), k = 1. - nv, F = .03 + .97 * k * k * k * k;
  vec3 R = reflect(-V, n); vec4 mr = moonRay(p, R); vec3 refl = mix(skyCol(R), mr.rgb, mr.a);
  vec3 T = normalize(-V - 1.6 * (n - nv * V));                           // the world seen upside down through a lens
  vec4 mt = moonRay(p, T); vec3 tr = mix(skyCol(T), mt.rgb, mt.a);
  tr = mix(tr, cTurq * .8, smoothstep(0., -.35, T.y) * .6);
  float sp = pow(max(dot(R, uSun), 0.), 180.) * moonShade(p);
  return tr * (1. - F) * .9 + refl * F * 1.1 + SUNC * sp * 6.;
}
`;
function makeRope(K) {
  const g = new THREE.CylinderGeometry(1, 1, 1, 10, 28, true); g.translate(0, 0.5, 0);
  const mat = K.mk(BALL_GLSL + /* glsl */`
    varying vec3 vN;
    void main(){
      float v = position.y;
      float bz = smoothstep(.5, .72, v), bs = max(sin(v * 30. - uTime * 5.2), 0.);
      float rad = mix(2.3, .4, sqrt(v)) * mix(1. + .3 * sin(v * 17. - uTime * 3.), .1 + 2.5 * bs * sqrt(bs), bz) * (.1 + .9 * smoothstep(1., .94, v));
      vec2 sw = uQuiv.xy + vec2(sin(uTime * 2.5 + v * 4.), cos(uTime * 2.1 + v * 5.)) * .6 * v * v;
      vec3 lp = vec3(sw.x + position.x * rad, ropeTop() - 13. * (1. - v), sw.y + position.z * rad);
      vN = normalize(vec3(position.x, .25 + .45 * cos(v * 30. - uTime * 5.2) * bz, position.z));
      ${VERT_END} }`, BALL_GLSL + /* glsl */`
    varying vec3 vN;
    void main(){ vec3 V = normalize(vCam - vLp); gl_FragColor = vec4(fogMix(waterBall(normalize(vN), V, vLp)), 1.); }`);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}
const BEAD_VERT = /* glsl */`
  attribute vec4 aB; attribute vec2 aB2;
  vec3 beadCentre(out float sc){
    float tau = fract(aB.x + uTime / 9.);
    if (aB2.x < 0.) {                                                    // course beads: aB = phase, x, z, radius
      sc = aB.w * smoothstep(0., .14, tau) * (1. - smoothstep(.9, 1., tau));
      float y0 = max(320. - .3788 * aB.z - 21., surfY(vec2(aB.y, aB.z)) + 1.5);
      vec2 wb = vec2(sin(uTime * .7 + aB2.y), cos(uTime * .6 + aB2.y * 1.7)) * .35 * tau;
      return vec3(aB.y + wb.x, y0 - aB2.x * tau * sqrt(tau), aB.z + wb.y);
    }
    sc = aB.w * smoothstep(0., .05, tau) * (1. - smoothstep(.94, 1., tau));
    vec2 lat = vec2(sin(aB.z), cos(aB.z)) * aB.y * smoothstep(0., .3, tau) + uQuiv.xy * (1. - tau);
    lat += vec2(sin(uTime * .7 + aB2.y), cos(uTime * .6 + aB2.y * 1.7)) * .5 * tau;
    return vec3(lat.x, ropeTop() + aB2.x * tau * tau, lat.y);
  }
`;
function makeBeads(K) {
  const rng = K.rng.fork('beads'), n0 = 60, n = n0 + 96;
  const ico = new THREE.IcosahedronGeometry(1, 2), g = new THREE.InstancedBufferGeometry();
  g.index = ico.index; g.setAttribute('position', ico.attributes.position);
  const b = new Float32Array(n * 4), b2 = new Float32Array(n * 2);
  for (let i = 0; i < n0; i++) {
    b[i * 4] = (i + rng()) / n0; b[i * 4 + 1] = 2.4 + 11 * Math.pow(rng(), 0.8); b[i * 4 + 2] = rng() * Math.PI * 2;
    b[i * 4 + 3] = 0.14 + 0.6 * Math.pow(rng(), 1.5); b2[i * 2] = rng.range(74, 88); b2[i * 2 + 1] = rng() * 40;
  }
  for (let i = n0; i < n; i++) {
    const j = i - n0;
    b[i * 4] = (j * 0.618034 + rng() * 0.1) % 1; b[i * 4 + 1] = (j % 2 ? 1 : -1) * rng.range(2.7, 6.2); b[i * 4 + 2] = 4 + 150 * ((j + rng()) / 96);
    b[i * 4 + 3] = 0.34 + 0.86 * Math.pow(rng(), 1.5); b2[i * 2] = -rng.range(50, 64); b2[i * 2 + 1] = rng() * 40;
  }
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(b, 4)); g.setAttribute('aB2', new THREE.InstancedBufferAttribute(b2, 2));
  g.instanceCount = n;
  const mat = K.mk(BALL_GLSL + BEAD_VERT + /* glsl */`
    varying vec3 vN;
    void main(){
      float sc; vec3 ctr = beadCentre(sc);
      float wob = sin(uTime * 5. + aB2.y) * .17;
      vec3 st = vec3(1. - wob * .5, 1. + wob, 1. - wob * .5);
      vec3 lp = ctr + position * st * sc; vN = normalize(position / st);
      ${VERT_END} }`, BALL_GLSL + /* glsl */`
    varying vec3 vN;
    void main(){ vec3 V = normalize(vCam - vLp); gl_FragColor = vec4(fogMix(waterBall(normalize(vN), V, vLp)), 1.); }`);
  const real = new THREE.Mesh(g, mat); real.frustumCulled = false;
  // the small ones: camera-facing discs shaded as lenses
  const nb = Math.round(1000 * K.detail), gq = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(2, 2);
  gq.index = pl.index; gq.setAttribute('position', pl.attributes.position);
  const q = new Float32Array(nb * 4), q2 = new Float32Array(nb * 2);
  for (let i = 0; i < nb; i++) {
    q[i * 4] = rng(); q[i * 4 + 1] = 0.25 + 10 * Math.pow(rng(), 1.8); q[i * 4 + 2] = rng() * Math.PI * 2;
    q[i * 4 + 3] = 0.06 + 0.4 * Math.pow(rng(), 3); q2[i * 2] = rng.range(70, 90); q2[i * 2 + 1] = rng() * 40;
  }
  gq.setAttribute('aB', new THREE.InstancedBufferAttribute(q, 4)); gq.setAttribute('aB2', new THREE.InstancedBufferAttribute(q2, 2));
  gq.instanceCount = nb;
  const matq = K.mk(BEAD_VERT + /* glsl */`
    varying vec2 vQ;
    void main(){
      float sc; vec3 lp = beadCentre(sc); vQ = position.xy;
      vLp = lp; vCam = camLocal();
      vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
      float px = max(sc, -mvPosition.z * .0011);                         // never thinner than about a pixel and a half
      mvPosition.xy += position.xy * px;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`, /* glsl */`
    varying vec2 vQ;
    void main(){
      float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
      float rim = r2 * r2, sh = moonShade(vLp);
      vec3 col = mix(cAqua * .98, cTurq * .78, smoothstep(-.5, .8, vQ.y));  // sky below, sea above: inverted
      col += cWhite * .85 * rim * rim;
      vec2 gd = vQ - vec2(-.38, .42); col += SUNC * 5. * smoothstep(.07, 0., dot(gd, gd)) * sh;
      gl_FragColor = vec4(fogMix(col), 1.);
    }`);
  const small = new THREE.Mesh(gq, matq); small.frustumCulled = false;
  return [real, small];
}
function makeShafts(K) {
  const rng = K.rng.fork('shafts'), n = 90, base = [], pq = [], sz = [], idx = [];
  for (let i = 0; i < n; i++) {
    const r = rng.range(170, 820), a = rng.chance(0.6) ? rng.range(-1.4, 1.4) : rng.range(0, Math.PI * 2);
    const w = rng.range(7, 20), len = rng.range(38, 70), seed = rng() * 100, o = i * 4;
    for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { base.push(Math.sin(a) * r, 0, Math.cos(a) * r); pq.push(u, v); sz.push(w, len, seed); }
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(pq, 2));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(sz, 3));
  g.setIndex(idx);
  const mat = K.mk(/* glsl */`
    attribute vec3 aS; uniform vec3 uShDir; varying vec2 vUv; varying float vK;
    void main(){
      vec2 xz = position.xz + vec2(sin(uTime * .13 + aS.z), cos(uTime * .11 + aS.z * 1.3)) * 6.;
      float thick = tideH(xz) - BEDY;
      vec3 top = vec3(xz.x, tideH(xz) - 1.5, xz.y);
      vec3 ctr = top + uShDir * uv.y * aS.y * clamp(thick / 70., .15, 1.);
      vec3 cl = camLocal(), sd = cross(uShDir, cl - ctr);
      sd /= max(length(sd), 1e-3);
      vec3 lp = ctr + sd * uv.x * aS.x * (.55 + .6 * uv.y);
      // seen edge-on through the clear skin from far off, dozens of them stacked into a white haze: they belong to the near water
      vUv = uv; vK = (.55 + .45 * sin(uTime * .35 + aS.z * 7.)) * smoothstep(8., 30., thick) * smoothstep(300., 110., length(cl - ctr));
      ${VERT_END} }`, /* glsl */`
    varying vec2 vUv; varying float vK;
    void main(){
      float e = 1. - abs(vUv.x); e *= e;
      float a = e * smoothstep(0., .12, vUv.y) * (1. - vUv.y) * vK * moonShade(vLp);
      vec3 col = (cAqua * .5 + cTurq * .35 + cIvory * .1) * a * .8;
      gl_FragColor = vec4(fogMixP(col, 0.), 1.);
    }`, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }, { uShDir: K.SH.uShDir });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1;
  return m;
}

// ---------------------------------------------------------------------------------------------
// the fleet: one double-ended outrigger boat under a battened lug sail, instanced 40 times
// boat space: +x bow, +y up, +z starboard; outrigger float to port. aPart: 0 wood/paint, 1 sail,
// 2 pennant, 3 awning cloth
// ---------------------------------------------------------------------------------------------
function makeBoatGeometry(P, rng) {
  const S = new Soup(), C = (c, k = 1) => c.clone().multiplyScalar(k);
  const white = C(P[0], 0.74), wale = C(P[1], 0.62), bottom = new THREE.Color(0.07, 0.15, 0.17), wood = new THREE.Color(0.3, 0.22, 0.15),
    pale = new THREE.Color(0.48, 0.4, 0.29), straw = new THREE.Color(0.55, 0.45, 0.27), rope = new THREE.Color(0.5, 0.47, 0.4);
  // hull: 13 stations, 12 points round each
  const NS = 12, rings = [];
  for (let i = 0; i <= NS; i++) {
    const s = -1 + 2 * i / NS, as = Math.abs(s), x = s * 5.25 + Math.sign(s) * 0.35 * Math.pow(as, 6);
    const b = 0.96 * Math.pow(Math.max(0, 1 - Math.pow(as, 2.3)), 0.75) + 0.015, kd = -0.55 * (1 - Math.pow(as, 3)) , gh = 0.56 + 0.85 * Math.pow(as, 2.4);
    const sec = [[kd, 0, bottom], [kd * 0.55, b * 0.68, bottom], [0.06, b * 0.95, white], [gh - 0.14, b, white], [gh, b, wale], [gh - 0.05, Math.max(0, b - 0.1), wale], [-0.08, b * 0.5, pale]];
    const ids = [];
    for (let k = 0; k < sec.length; k++) ids.push(S.v(x, sec[k][0], sec[k][1], sec[k][2]));
    ids.push(S.v(x, -0.12, 0, pale));
    for (let k = sec.length - 1; k >= 1; k--) ids.push(S.v(x, sec[k][0], -sec[k][1], sec[k][2]));
    rings.push(ids);
  }
  for (let i = 0; i < NS; i++) { const a = rings[i], b = rings[i + 1], n = a.length; for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; S.quad(a[k], a[k2], b[k2], b[k]); } }
  for (const sx of [-1, 1]) S.beam(sx * 5.55, 1.3, 0, sx * 5.75, 2.05, 0, 0.12, 0.2, wale);          // stem and stern posts
  for (const x of [-2.6, -0.6, 2.2]) S.beam(x, 0.5, -0.82, x, 0.5, 0.82, 0.22, 0.06, wood);            // thwarts
  // outrigger float and its two arched booms
  const fz = -3.3, fr = [];
  for (let i = 0; i <= 6; i++) {
    const s = -1 + 2 * i / 6, r = 0.2 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), 2.2)), 0.6) + 0.02, ids = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ids.push(S.v(s * 3.3, 0.08 + Math.cos(a) * r + 0.25 * s * s, fz + Math.sin(a) * r, k < 3 ? pale : white)); }
    fr.push(ids);
  }
  for (let i = 0; i < 6; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; S.quad(fr[i][k], fr[i][k2], fr[i + 1][k2], fr[i + 1][k]); }
  for (const x of [-1.6, 1.7]) { S.beam(x, 0.72, 0.8, x, 1.0, -1.6, 0.1, 0.1, wood); S.beam(x, 1.0, -1.6, x * 0.9, 0.2, fz, 0.1, 0.1, wood); }
  // mast, yard, boom
  const mx = 0.7, tack = [3.0, 1.55], clew = [-3.5, 1.35], peak = [-3.1, 11.5], throat = [2.1, 9.0];
  S.beam(mx, 0.0, 0, mx, 11.9, 0, 0.2, 0.2, wood);
  S.beam(throat[0] + 0.35, throat[1] - 0.15, 0.12, peak[0] - 0.4, peak[1] + 0.2, 0.12, 0.11, 0.11, wood);
  S.beam(tack[0] + 0.2, tack[1], 0.12, clew[0] - 0.3, clew[1], 0.12, 0.1, 0.1, wood);
  // sail: bilinear patch with a belly; three patched panels; battens are drawn in the shader
  const NU = 6, NVv = 9, sail = [], orange = P[6], patch = new Set();
  while (patch.size < 3) patch.add(rng.int(0, NU - 1) + '_' + rng.int(1, NVv - 2));
  const sp = (u, v) => { const bx = tack[0] + (clew[0] - tack[0]) * u, by = tack[1] + (clew[1] - tack[1]) * u, tx = throat[0] + (peak[0] - throat[0]) * u, ty = throat[1] + (peak[1] - throat[1]) * u;
    return [bx + (tx - bx) * v - 0.25 * Math.sin(Math.PI * v) * (u - 0.3), by + (ty - by) * v, 0.16 + 0.95 * Math.sin(Math.PI * u) * Math.pow(Math.sin(Math.PI * v), 0.7)]; };
  for (let i = 0; i < NU; i++) for (let j = 0; j < NVv; j++) {
    const tone = patch.has(i + '_' + j) ? rng.range(1.12, 1.3) : rng.range(0.9, 1.04), col = C(orange, tone * (0.86 + 0.14 * j / NVv));
    if (patch.has(i + '_' + j)) col.lerp(P[0], 0.22);
    const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => { const p = sp(a / NU, b / NVv); return S.v(p[0], p[1], p[2], col, 1, a / NU, b / NVv); });
    S.quad(q[0], q[1], q[2], q[3]);
  }
  // ribbon stays, steering oar
  S.beam(mx, 11.8, 0, 5.6, 1.9, 0, 0.06, 0.06, rope); S.beam(mx, 11.8, 0, -5.6, 1.9, 0, 0.06, 0.06, rope); S.beam(mx, 11.6, 0, 0.4, 0.3, fz, 0.06, 0.06, rope);
  S.beam(-4.3, 1.5, 0.35, -6.0, 0.1, 0.8, 0.09, 0.09, wood); S.beam(-6.0, 0.1, 0.8, -6.9, -0.65, 1.0, 0.07, 0.42, pale);
  // awning on four posts
  const ax0 = -3.3, ax1 = -1.0, az = 0.78, ay = 2.05;
  for (const x of [ax0, ax1]) for (const z of [-az, az]) S.beam(x, 0.6, z * 0.95, x, ay, z, 0.07, 0.07, wood);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const col = C(P[0], 0.62 + 0.06 * ((i + j) % 2));
    const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => S.v(ax0 + (ax1 - ax0) * a / 3, ay + 0.18 * Math.sin(Math.PI * b / 2) - 0.07 * Math.sin(Math.PI * a / 3), -az + 2 * az * b / 2, col, 3, a / 3, b / 2));
    S.quad(q[0], q[1], q[2], q[3]);
  }
  // baskets, a net heap
  const frustum = (cx, cy, cz, r0, r1, h, n, col, cap) => { const lo = [], hi = [];
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; lo.push(S.v(cx + Math.cos(a) * r0, cy, cz + Math.sin(a) * r0, col)); hi.push(S.v(cx + Math.cos(a) * r1, cy + h, cz + Math.sin(a) * r1, col)); }
    const top = S.v(cx, cy + h + cap, cz, C(col, 0.7));
    for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; S.quad(lo[k], lo[k2], hi[k2], hi[k]); S.tri(hi[k], hi[k2], top); } };
  frustum(3.3, 0.1, 0.25, 0.24, 0.34, 0.45, 6, straw, -0.12); frustum(2.75, 0.05, -0.3, 0.28, 0.38, 0.5, 6, C(straw, 0.85), -0.14); frustum(3.75, 0.2, -0.15, 0.2, 0.28, 0.4, 6, straw, -0.1);
  frustum(1.35, 0.0, 0.1, 0.72, 0.4, 0.3, 7, new THREE.Color(0.1, 0.2, 0.2), 0.22);
  // white pennant at the masthead
  for (let i = 0; i < 5; i++) {
    const q = [[i, 0], [i + 1, 0], [i + 1, 1], [i, 1]].map(([a, b]) => S.v(mx - 0.1 - a * 0.36, 11.95 + (b ? 0.36 * (1 - a / 6) : 0), 0, C(P[5], 0.74), 2, a / 5, b));
    S.quad(q[0], q[1], q[2], q[3]);
  }
  return S.geometry();
}

const BOAT_GLSL = /* glsl */`
attribute vec4 aI;   // azimuth of its lane, start radius, climbing speed, tack phase
attribute vec4 aJ;   // scale, tack amplitude (m), lane offset (m), seed
uniform vec3 uB0;    // the world keys one lane boat to the flight: x = hero-local radius (< 0 = free), y = lateral x
float gPh; float gTack; vec2 gHd;
// where this boat is (xz) at time t, its velocity, and 0..1 visibility (it sinks out at r 300 and re-enters at r 1000).
// Also sets gTack (-1..1, which tack) and gHd (the way the bow points: close-hauled, 36 degrees off the fall line).
vec2 boatAt(float t, out vec2 vel, out float vis){
  float rr = 300. + mod(aI.y - 300. - aI.z * t, 700.);
  vis = smoothstep(300., 335., rr) * smoothstep(1000., 965., rr);
  float w = .045 + .03 * fract(aJ.w * 7.31); gPh = w * t + aI.w;
  float xl = aJ.z + aJ.y * sin(gPh);
  vec2 vl = vec2(aJ.y * w * cos(gPh), -aI.z);
  gTack = clamp(cos(gPh) * 1.7, -1., 1.);
  if (abs(aJ.z) > 1.) gTack = sign(aJ.z);                              // lane boats hold one tack, bows turned away from the course
  if (aJ.w > 1.5 && uB0.x > 0.) { float back = uTime - t; rr = uB0.x + aI.z * back; xl = uB0.y - 1.1 * back; vis = 1.; vl = vec2(1.1, -aI.z); gTack = 1.; }
  float zl = sqrt(max(rr * rr - xl * xl, 1.));
  float ya = .64 * gTack; vec2 hd = vec2(sin(ya), -cos(ya));
  float c = cos(aI.x), s = sin(aI.x);
  gHd = vec2(c * hd.x + s * hd.y, -s * hd.x + c * hd.y);
  vel = vec2(c * vl.x + s * vl.y, -s * vl.x + c * vl.y);
  return vec2(c * xl + s * zl, -s * xl + c * zl);
}
`;
function makeFleet(K, boatGeo) {
  const rng = K.rng.fork('fleet'), n = K.boats, aI = new Float32Array(n * 4), aJ = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const lane = i < 7, side = i % 2 ? 1 : -1;
    aI[i * 4] = lane ? 0 : (rng.chance(0.62) ? rng.range(0.14, 1.25) * rng.sign() : rng.range(1.25, Math.PI * 2 - 1.25));
    aI[i * 4 + 1] = 300 + ((i * 0.618034 + rng() * 0.05) % 1) * 700;
    aI[i * 4 + 2] = rng.range(2.0, 3.2); aI[i * 4 + 3] = rng() * 6.28;
    aJ[i * 4] = i === 1 ? 1.12 : rng.range(0.86, 1.14); aJ[i * 4 + 1] = lane ? rng.range(1.2, 2.2) : rng.range(13, 24);
    aJ[i * 4 + 2] = lane ? side * rng.range(11.5, 15) * (side > 0 && i > 1 ? 1.6 : 1) : 0; aJ[i * 4 + 3] = rng() + (i === 1 ? 2 : 0);   // boat 1 (starboard lane) is the one the world may key
  }
  const bI = new THREE.InstancedBufferAttribute(aI, 4), bJ = new THREE.InstancedBufferAttribute(aJ, 4);
  const g = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'color', 'aPart', 'uv']) g.setAttribute(k, boatGeo.attributes[k]);
  g.setAttribute('aI', bI); g.setAttribute('aJ', bJ); g.instanceCount = n;
  const mat = K.mk(BOAT_GLSL + /* glsl */`
    attribute float aPart; attribute vec3 color;
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      vec2 vel; float vis; vec2 xz = boatAt(uTime, vel, vis);
      float sT = gTack, sd = aJ.w * 40.;
      vec3 N = tideN(xz), f0 = normalize(vec3(gHd.x, 0., gHd.y));
      vec3 r0 = normalize(cross(f0, N));
      vec3 up = normalize(N + r0 * ((.13 + .3 * uWind + .1 * step(1.5, aJ.w)) * sT + .035 * sin(uTime * .9 + sd)));
      vec3 fwd = normalize(f0 - up * dot(f0, up)), right = cross(fwd, up);
      vec3 q = position, nn = normal;
      if (aPart > .5 && aPart < 1.5) {                                   // sail: fills to leeward, leech flutters
        q.z = q.z * sT + sin(uv.y * 9. - uTime * 6. + sd) * .07 * uv.x;
        nn = vec3(normal.xy * sT, normal.z + 1e-3);
      } else if (aPart > 1.5 && aPart < 2.5) {                           // pennant: streams aft and lifts toward the moon
        q.z += sin(uv.x * 5. - uTime * 9. + sd) * .3 * uv.x; q.y += uv.x * (.5 + .15 * sin(uTime * 4. + sd));
      } else if (aPart > 2.5) { q.y += sin(uTime * 3. + q.x * 2. + sd) * .04; }
      vec3 base = vec3(xz.x, surfY(xz) + .1 + .07 * sin(uTime * 1.3 + sd), xz.y);
      vec3 lp = base + (fwd * q.x + up * q.y + right * q.z) * aJ.x * vis;
      vN = fwd * nn.x + up * nn.y + right * nn.z; vCol = color; vPu = vec3(aPart, uv);
      ${VERT_END} }`, /* glsl */`
    varying vec3 vN; varying vec3 vCol; varying vec3 vPu;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN);
      if (dot(n, V) < 0.) n = -n;
      vec3 alb = vCol;
      if (vPu.x > .5 && vPu.x < 1.5) {
        alb = mix(alb, cWhite * .7, uSailW * (1. - step(2., vPu.z * 6.) * step(vPu.z * 6., 3.)));
        float bt = abs(fract(vPu.z * 6. + .5) - .5); alb *= mix(.5, 1., smoothstep(.015, .045, bt));            // battens
        float seam = abs(fract(vPu.y * 6. + .5) - .5); alb *= mix(.8, 1., smoothstep(.008, .03, seam));         // cloth seams
        float rp = smoothstep(.014, .004, abs(vPu.z - .27)) * step(.55, fract(vPu.y * 16.)); alb *= 1. - .5 * rp;   // reef points
        alb *= .9 + .2 * vn(vPu.yz * vec2(26., 44.));
      }
      vec3 col = lit(alb, n, vLp);
      if (vPu.x > .5) col += alb * SUNC * .55 * max(dot(-n, uSun), 0.) * moonShade(vLp);                       // cloth lit through
      col = underwater(col, vLp, V);
      gl_FragColor = vec4(fogMix(col), 1.);
    }`, { side: THREE.DoubleSide }, { uB0: K.SH.uB0 });
  const boats = new THREE.Mesh(g, mat); boats.frustumCulled = false;
  // wakes: a ribbon laid along where each boat has been
  const NK = 14, wp = [], wi = [];
  for (let k = 0; k <= NK; k++) { wp.push(-1, k / NK, 0, 1, k / NK, 0); if (k < NK) { const o = k * 2; wi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const wg = new THREE.InstancedBufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi);
  wg.setAttribute('aI', bI); wg.setAttribute('aJ', bJ); wg.instanceCount = n;
  const wmat = K.mk(BOAT_GLSL + /* glsl */`
    varying vec2 vUv; varying float vA;
    void main(){
      float k = position.y, tk = uTime - 1.5 - k * 17.;
      vec2 vel; float vis; vec2 xz = boatAt(tk, vel, vis);
      float w0 = floor((aI.y - 300. - aI.z * uTime) / 700.), w1 = floor((aI.y - 300. - aI.z * tk) / 700.);
      vA = vis * step(abs(w0 - w1), .5);
      if (aJ.w > 1.5 && uB0.x > 0.) vA = 1.;
      vec2 sd = normalize(vec2(vel.y, -vel.x));
      xz += sd * position.x * (.7 + 4.4 * sqrt(k)) * aJ.x;
      vec3 lp = vec3(xz.x, surfY(xz) + .16, xz.y);
      vUv = vec2(position.x, k);
      ${VERT_END} }`, /* glsl */`
    varying vec2 vUv; varying float vA;
    void main(){
      float u = abs(vUv.x), k = vUv.y;
      float nz = vn(vec2(vUv.x * 3., k * 46. + uTime * .4)) * .6 + vn(vec2(vUv.x * 9., k * 140.)) * .4;
      float edge = smoothstep(.5, .86, u) * smoothstep(1., .9, u);
      float lace = smoothstep(.36, .7, nz);                             // foam, not a pale sheet
      float a = (1. - k) * (1. - k) * (edge * (.25 + .5 * lace) + (1. - u) * smoothstep(.3, 0., k) * lace * .9 + .14 * lace) * smoothstep(0., .03, k) * vA;
      vec3 col = cWhite * .74 * (.5 + .5 * moonShade(vLp)) + cSlate * .06;
      gl_FragColor = vec4(fogMix(col), clamp(a, 0., 1.));
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 }, { uB0: K.SH.uB0 });
  const wakes = new THREE.Mesh(wg, wmat); wakes.frustumCulled = false; wakes.renderOrder = 3;
  // sail shadows: a soft strip laid on the water away from the sun, as long as the mast's shadow (long at a low sun)
  const NSh = 10, sp = [], si = [];
  for (let k = 0; k <= NSh; k++) { sp.push(-1, k / NSh, 0, 1, k / NSh, 0); if (k < NSh) { const o = k * 2; si.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
  sg.setAttribute('aI', bI); sg.setAttribute('aJ', bJ); sg.instanceCount = n;
  const smat = K.mk(BOAT_GLSL + /* glsl */`
    varying vec2 vUv; varying float vA;
    void main(){
      vec2 vel; float vis; vec2 xz = boatAt(uTime, vel, vis);
      float hl = max(length(uSun.xz), 1e-3), k = position.y;
      vec2 sh = -uSun.xz / hl, ac = vec2(sh.y, -sh.x);
      float L = 12.5 * aJ.x * clamp(hl / max(uSun.y, .1), .7, 5.);
      float wS = 2.4 + 5. * abs(dot(gHd, ac));                          // the sail's breadth as the sun sees it
      xz += sh * (k * L - .8) + ac * position.x * wS * .5 * (1. - .5 * k);
      vec3 lp = vec3(xz.x, surfY(xz) + .13, xz.y);
      vUv = vec2(position.x, k); vA = vis;
      ${VERT_END} }`, /* glsl */`
    varying vec2 vUv; varying float vA;
    void main(){
      float u = vUv.x, k = vUv.y;
      float a = (1. - u * u) * (1. - u * u) * smoothstep(0., .06, k) * (1. - k * k) * .78 * vA * moonShade(vLp);
      gl_FragColor = vec4(fogMix(cDeep * .13), a);
    }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -5 }, { uB0: K.SH.uB0 });
  const shadows = new THREE.Mesh(sg, smat); shadows.frustumCulled = false; shadows.renderOrder = 3;
  return [boats, shadows, wakes];
}

// ---------------------------------------------------------------------------------------------
// life inside the hill: turning shoals, tide-rays gliding uphill, kelp leaning toward the summit
// ---------------------------------------------------------------------------------------------
function makeFish(K) {
  const rng = K.rng.fork('fish'), per = Math.round(330 * K.detail), shoals = 8, n = per * shoals;
  const g = new THREE.InstancedBufferGeometry();
  // +x nose; a flat fish: body rhombus, dorsal fin, forked tail
  g.setAttribute('position', new THREE.Float32BufferAttribute([0.5, 0, 0, 0.08, 0.15, 0, -0.32, 0, 0, 0.5, 0, 0, -0.32, 0, 0, 0.08, -0.13, 0,
    -0.28, 0, 0, -0.52, 0.16, 0, -0.44, 0, 0, -0.28, 0, 0, -0.44, 0, 0, -0.52, -0.16, 0], 3));
  const sh = new Float32Array(n * 4), fo = new Float32Array(n * 4), list = [];
  for (let s = 0; s < shoals; s++) {
    const lane = s < 2, th = lane ? 0 : (s < 5 ? rng.range(0.1, 0.9) * (s % 2 ? 1 : -1) : rng.range(-2.6, 2.6));
    const r = lane ? 520 : rng.range(270, 880), rad = lane ? 7.5 : rng.range(5.5, 11), dep = lane ? 10 : rng.range(8, 20), dirn = lane ? (s ? -1 : 1) : rng.sign();
    list.push({ th, r, dep, rad });
    for (let i = 0; i < per; i++) {
      const k = (s * per + i) * 4, rf = Math.pow(rng(), 0.45);
      sh[k] = th; sh[k + 1] = r; sh[k + 2] = dep; sh[k + 3] = rad;
      fo[k] = rng() * 6.283; fo[k + 1] = Math.asin(rng.range(-1, 1)); fo[k + 2] = rf; fo[k + 3] = dirn * rng.range(0.55, 0.85) / (0.35 + rf);
    }
  }
  g.setAttribute('aSh', new THREE.InstancedBufferAttribute(sh, 4)); g.setAttribute('aFo', new THREE.InstancedBufferAttribute(fo, 4));
  g.instanceCount = n;
  const mat = K.mk(/* glsl */`
    attribute vec4 aSh; attribute vec4 aFo; varying vec3 vN; varying float vY; uniform float uBall;
    void main(){
      float t = uTime, sr = aSh.y;
      if (abs(aSh.y - 520.) < .01 && uBall > 0.) sr = uBall;            // the world keys the shoal under the path to the flight
      vec2 cxz = vec2(sin(aSh.x), cos(aSh.x)) * sr + vec2(sin(t * .11 + aSh.x * 9.), cos(t * .09 + aSh.x * 5.)) * 6.;
      vec3 C = vec3(cxz.x, surfY(cxz) - aSh.z, cxz.y);
      float ang = aFo.x + t * aFo.w * .5, cr = aSh.w * aFo.z, ct = cos(aFo.y);
      vec3 off = vec3(cos(ang) * ct, sin(aFo.y) * .75 + .1 * sin(ang * 2. + aFo.x), sin(ang) * ct) * cr;
      vec3 fw = normalize(vec3(-sin(ang), .12 * cos(ang * 2. + aFo.x), cos(ang))) * sign(aFo.w);
      vec3 rt = normalize(cross(fw, vec3(0., 1., 0.))), up = cross(rt, fw);
      float len = 1.25 * (.8 + .5 * fract(aFo.x * 3.7));
      vec3 q = position * len;
      float wv = sin(t * 9. + aFo.x * 20. - position.x * 7.) * .11 * (.55 - position.x) * len;
      vec3 lp = C + off + fw * q.x + up * q.y + rt * wv;
      vN = normalize(rt + fw * cos(t * 9. + aFo.x * 20. - position.x * 7.) * .3); vY = position.y;
      ${VERT_END} }`, /* glsl */`
    varying vec3 vN; varying float vY;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN); if (dot(n, V) < 0.) n = -n;
      vec3 base = mix(cIvory * .78, cSlate * .34, smoothstep(-.06, .08, vY));
      float fl = abs(dot(n, normalize(uSun + V + vec3(0., 1e-3, 0.)))); fl *= fl; fl *= fl; fl *= fl;
      vec3 col = base * (.8 + .6 * max(dot(n, uSun), 0.)) + cWhite * 1.5 * fl * moonShade(vLp);
      vec3 pu = vec3(vLp.x, mix(vLp.y, surfY(vLp.xz), .5), vLp.z);        // silver carries: fog them as if at half their depth
      gl_FragColor = vec4(fogMix(underwater(col, pu, V)), 1.);
    }`, { side: THREE.DoubleSide }, { uBall: K.SH.uBall });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return { mesh: m, list };
}
function makeRays(K) {
  const rng = K.rng.fork('rays'), pos = [], idx = [], NS = 8, NC = 3;
  for (let i = 0; i <= NS; i++) {
    const s = -1 + 2 * i / NS, as = Math.abs(s), c = 2.1 * Math.pow(1 - as, 0.75) + 0.06;
    for (let j = 0; j <= NC; j++) { const u = j / NC; pos.push(c * (0.58 - u * 1.05) - as * 0.75, 0.3 * (1 - as * as) * Math.sin(Math.PI * Math.min(1, u * 1.2)) , s * 3); }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const t0 = pos.length / 3;
  pos.push(-0.9, 0.05, 0.09, -0.9, 0.05, -0.09, -3.4, 0, 0.04, -3.4, 0, -0.04, -6.2, 0, 0); idx.push(t0, t0 + 1, t0 + 2, t0 + 1, t0 + 3, t0 + 2, t0 + 2, t0 + 3, t0 + 4);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const n = 5, a = new Float32Array(n * 4), b = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    a[i * 4] = i === 0 ? 0 : rng.range(0.12, 0.8) * (i % 2 ? 1 : -1); a[i * 4 + 1] = i === 0 ? 470 : rng.range(340, 900); a[i * 4 + 2] = rng.range(3.2, 4.2); a[i * 4 + 3] = rng() * 6.28;
    b[i * 4] = i === 0 ? 1.7 : rng.range(1.2, 1.5); b[i * 4 + 1] = i === 0 ? 2 : rng.range(6, 14); b[i * 4 + 2] = i === 0 ? 2.5 : 0; b[i * 4 + 3] = i === 0 ? 3.2 : rng.range(5, 10);
  }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aJ', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  const mat = K.mk(/* glsl */`
    attribute vec4 aI; attribute vec4 aJ; varying vec3 vN; varying vec3 vQ; uniform float uRay0;
    void main(){
      float t = uTime, rr = 320. + mod(aI.y - 320. - aI.z * t, 620.);
      if (aJ.z > 1. && uRay0 > 0.) rr = uRay0;                          // the world keys the lane ray to the flight
      float vis = ((aJ.z > 1. && uRay0 > 0.) ? smoothstep(110., 140., rr) : smoothstep(320., 350., rr)) * smoothstep(940., 910., rr), ph = .05 * t + aI.w;
      float xl = aJ.z + aJ.y * sin(ph), zl = sqrt(max(rr * rr - xl * xl, 1.));
      vec2 vl = vec2(aJ.y * .05 * cos(ph), -aI.z); float c = cos(aI.x), s = sin(aI.x);
      vec2 vel = vec2(c * vl.x + s * vl.y, -s * vl.x + c * vl.y), xz = vec2(c * xl + s * zl, -s * xl + c * zl);
      vec3 N = tideN(xz), f0 = normalize(vec3(vel.x, 0., vel.y));
      vec3 fwd = normalize(f0 - N * dot(f0, N)), right = cross(fwd, N);
      vec3 q = position; float az = abs(q.z) / 3.;
      float fp = t * 1.5 + aI.w * 3. - az * 1.6;
      float lift = sin(fp) * 1.0 * az * sqrt(az);
      q.y += lift + sin(t * 2. + q.x * .9) * .12 * smoothstep(-1., -6., q.x);
      vec3 base = vec3(xz.x, surfY(xz) - aJ.w, xz.y);
      vec3 lp = base + (fwd * q.x + N * q.y + right * q.z) * aJ.x * vis;
      vec3 nl = normalize(vec3(.12, 1., -sign(position.z) * cos(fp) * .5 * az));
      vN = fwd * nl.x + N * nl.y + right * nl.z; vQ = position;
      ${VERT_END} }`, /* glsl */`
    varying vec3 vN; varying vec3 vQ;
    void main(){
      vec3 V = normalize(vCam - vLp), n = normalize(vN);
      float top = step(0., dot(n, V)); if (top < .5) n = -n;
      float spots = smoothstep(.55, .7, vn(vQ.xz * 2.3 + 4.));
      vec3 alb = mix(cWhite * .8, cIvory * .95 * (1. - .3 * spots) + cWhite * .1, top);
      alb *= .7 + .3 * smoothstep(.0, .5, abs(vQ.z) / 3. + .25 * sin(vQ.x * 3.));          // darker spine, pale wing tips
      alb *= .8 + .2 * smoothstep(3., 1.5, abs(vQ.z));
      vec3 pu = vec3(vLp.x, mix(vLp.y, surfY(vLp.xz), .55), vLp.z);
      gl_FragColor = vec4(fogMix(underwater(lit(alb, n, vLp) * 1.25, pu, V)), 1.);
    }`, { side: THREE.DoubleSide }, { uRay0: K.SH.uRay0 });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}
function makeKelp(K) {
  const rng = K.rng.fork('kelp'), n = Math.round(380 * K.detail), NSg = 8, pos = [], idx = [];
  for (let k = 0; k <= NSg; k++) { pos.push(-0.5, k / NSg, 0, 0.5, k / NSg, 0); if (k < NSg) { const o = k * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const a = new Float32Array(n * 4); let i = 0;
  while (i < n) {
    const nearLane = rng.chance(0.36), th = nearLane ? rng.range(0.012, 0.075) * rng.sign() : rng.chance(0.7) ? rng.range(-1.3, 1.3) : rng.range(0, 6.283), r = rng.range(nearLane ? 640 : 730, 1140), cnt = rng.int(6, 16), gx = Math.sin(th) * r, gz = Math.cos(th) * r;
    for (let c = 0; c < cnt && i < n; c++, i++) { a[i * 4] = gx + rng.gauss() * 7; a[i * 4 + 1] = gz + rng.gauss() * 7; a[i * 4 + 2] = rng.range(14, 24); a[i * 4 + 3] = rng() * 50; }
  }
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const mat = K.mk(/* glsl */`
    attribute vec4 aK; varying vec2 vUv;
    void main(){
      vec2 xz = aK.xy; float v = position.y, r = length(xz);
      float H = min(aK.z, tideH(xz) - BEDY - 1.5); H = max(H, 0.);
      vec3 uph = vec3(-xz.x, 0., -xz.y) / max(r, 1.);
      vec3 sidev = vec3(uph.z, 0., -uph.x);
      vec3 p = vec3(xz.x, BEDY + v * H, xz.y) + uph * (v * v * H * .32 + sin(uTime * .6 + aK.w * 2. + v * 2.) * .7 * v)
             + sidev * sin(uTime * .8 + aK.w + v * 3.) * .8 * v;
      vec3 cl = camLocal(), ax = normalize(vec3(0., 1., 0.) + uph * .5 * v);
      vec3 sd = cross(ax, cl - p); sd /= max(length(sd), 1e-3);
      float wdt = (.9 + 1.5 * abs(sin(v * 11. + aK.w))) * (1. - .55 * v) * (.25 + .75 * smoothstep(0., .12, v)) * step(1., H) * max(1., length(cl - p) / 240.);   // stays a ribbon, not a hair, across the hill
      vec3 lp = p + sd * position.x * wdt;
      vUv = vec2(position.x, v);
      ${VERT_END} }`, /* glsl */`
    varying vec2 vUv;
    void main(){
      vec3 V = normalize(vCam - vLp);
      vec3 alb = mix(vec3(.012, .05, .022), vec3(.05, .1, .02), vUv.y);        // dark standing ribbons, never a pale overlay
      alb *= .55 + .45 * smoothstep(.06, .0, abs(vUv.x)) + .5 * smoothstep(.2, .5, abs(vUv.x));   // a midrib and bright frilled edges
      vec3 col = alb * (SUNC * (.5 + .5 * moonShade(vLp)) + cAqua * .35);
      vec3 pu = vec3(vLp.x, mix(vLp.y, surfY(vLp.xz), .6), vLp.z);
      gl_FragColor = vec4(fogMix(underwater(col, pu, V)), 1.);
    }`, { side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE);
  const P = pal.slice(0, 7).map((c) => new THREE.Color(c));
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const root = new THREE.Group(); root.name = 'standing-tide-hero';

  const SH = {
    uTime: { value: 0 }, uSun: { value: new THREE.Vector3() }, uQuiv: { value: new THREE.Vector3(0, 0, 50) },
    SUNC: { value: new THREE.Vector3(1.0, 0.95, 0.86) }, uSailW: { value: 0 }, uWind: { value: 0 }, uRay0: { value: -1 }, uBall: { value: -1 }, uB0: { value: new THREE.Vector3(-1, 12, 0) },
    cIvory: { value: P[0] }, cSlate: { value: P[1] }, cTurq: { value: P[2] }, cDeep: { value: P[3] }, cAqua: { value: P[4] }, cWhite: { value: P[5] }, cOrange: { value: P[6] },
    uRot: { value: new THREE.Matrix3() }, uHit: { value: Array.from({ length: 9 }, () => new THREE.Vector4(0, 0, 1, 0)) },
    uShDir: { value: new THREE.Vector3() }, uShA: { value: new THREE.Vector3() }, uShB: { value: new THREE.Vector3() },
  };
  const BASE = ['uTime', 'uSun', 'uQuiv', 'SUNC', 'uSailW', 'uWind', 'cIvory', 'cSlate', 'cTurq', 'cDeep', 'cAqua', 'cWhite', 'cOrange'];
  const mk = (vs, fs, extra = {}, uni = {}) => {
    const u = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    for (const k of BASE) u[k] = SH[k];
    Object.assign(u, uni);
    return new THREE.ShaderMaterial({ uniforms: u, vertexShader: TIDE_GLSL + VERT_PARS + vs, fragmentShader: TIDE_GLSL + FRAG_PARS + fs, fog: true, ...extra });
  };
  const setSun = (v) => {
    const s = SH.uSun.value.copy(v).normalize();
    const hl = Math.hypot(s.x, s.z), k = 0.75;                           // refracted into the water
    const d = SH.uShDir.value.set(-s.x * k, -Math.sqrt(Math.max(0.05, 1 - k * k * hl * hl)), -s.z * k).normalize();
    const a = SH.uShA.value.set(-d.z, 0, d.x); if (a.lengthSq() < 1e-6) a.set(1, 0, 0); a.normalize();
    SH.uShB.value.crossVectors(d, a).normalize();
  };
  // the course is -Z in local space; the sun stands 38 degrees up, 80 degrees to port (-X)
  setSun(opts.sun ? new THREE.Vector3().copy(opts.sun) : new THREE.Vector3(-0.776, 0.616, -0.137));

  const K = { mk, SH, rng, detail, P, noise: ctx.noise, yield: () => ctx.yield?.(), boats: Math.max(24, Math.min(48, Math.round(opts.boats ?? 40))) };
  const add = (m) => { root.add(m); return m; };

  if (opts.bed !== false) add(makeBed(K));
  add(makeCore(K));
  await ctx.yield?.();
  const craters = makeCraters(rng.fork('craters'));
  await ctx.yield?.();
  add(await makeMoon(K, craters));
  await ctx.yield?.();
  const sheets = makeSheets(K, craters); add(sheets.mesh);
  await ctx.yield?.();
  add(makeRope(K));
  await ctx.yield?.();
  for (const m of makeBeads(K)) add(m);
  await ctx.yield?.();
  add(makeShafts(K));
  await ctx.yield?.();
  const boatGeometry = makeBoatGeometry(P, rng.fork('boat'));
  await ctx.yield?.();
  for (const m of makeFleet(K, boatGeometry)) add(m);
  await ctx.yield?.();
  const fish = makeFish(K); add(fish.mesh);
  await ctx.yield?.();
  add(makeRays(K));
  await ctx.yield?.();
  if (opts.kelp !== false) add(makeKelp(K));
  await ctx.yield?.();
  add(makeSurface(K));
  await ctx.yield?.();

  // ---- anchors (local space) ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), rad = Math.PI / 180;
  const seat = V3(0, 320, 0), cl = Math.cos(20 * rad), sl = Math.sin(20 * rad);
  const fly = [V3(0, 4.5, 1900), V3(0, 4.5, 1650), V3(0, 4.5, 1470)];
  for (let r = 1380; r > 430; r -= 68) fly.push(V3(0, Math.max(4.5, tideHeight(r) + 5.5), r));
  const A = V3(0, tideHeight(430) + 5.5, 430), B = V3(0, seat.y - 60 * sl, 60 * cl);
  for (let i = 0; i < 8; i++) { const t = i / 8, r = A.z + (B.z - A.z) * t; fly.push(V3(0, Math.max(A.y + (B.y - A.y) * t, tideHeight(r) + 6.5), r)); }
  fly.push(B, seat.clone());
  const quat = new THREE.Quaternion(), ax = V3(1, 0, 0), tmp = V3(0, 0, 0);
  const sheetAnchors = sheets.specs.map((s) => ({ top: s.mid.clone().add(V3(0, MOON_Y, 0)), foot: V3(s.mid.x, tideHeight(Math.hypot(s.mid.x, s.mid.z)), s.mid.z), width: s.arc }));
  const anchors = {
    portalSeat: { position: seat, facing: V3(0, -sl, cl), tiltDeg: 20, radius: 7 },
    flyThrough: fly,
    viewpoints: {
      entry: { position: V3(0, 4.5, 1830), lookAt: V3(0, 150, 0) },
      slope: { position: V3(0, tideHeight(560) + 5.5, 560), lookAt: V3(40, 230, 150) },
      summit: { position: V3(0, 262, 150), lookAt: V3(0, 318, 0) },
      outside: { position: V3(-900, 120, 1300), lookAt: V3(0, 220, 0) },
    },
    tip: V3(0, 300, 0), ropeTop: V3(0, 307, 0),
    lowestCrater: { lake: V3(0, MOON_Y - MOON_R + 7.5, 0), rimRadius: 80, rimY: MOON_Y - MOON_R - 6.5 },
    veils: sheetAnchors.slice(0, 2), portSheet: sheetAnchors[2], sheets: sheetAnchors,
    shoalBall: V3(0, tideHeight(520) - 10, 520), shoals: fish.list.map((s) => V3(Math.sin(s.th) * s.r, tideHeight(s.r) - s.dep, Math.cos(s.th) * s.r)),
    moonCentre: V3(0, MOON_Y, 0), moonRadius: MOON_R, waterEdgeRadius: EDGE_R, bedY: BED_Y, coreRadius: 750,
    sun: SH.uSun.value,
  };

  let progress = opts.progress ?? null, roll = 0;
  const hero = {
    object: root, radius: 450, height: 300, center: V3(0, 170, 0), extent: EDGE_R, top: 400,
    anchors, ground: false, groundY: BED_Y,
    uniforms: SH, glsl: TIDE_GLSL, tideHeight, moonHeight, boatGeometry, craters,
    setProgress(u) { progress = u == null ? null : Math.min(1, Math.max(0, u)); },
    setSun,
    get roll() { return roll; },
    update(dt, time) {
      const t = time || 0;
      SH.uTime.value = t;
      const w = Math.PI * 2 * 0.4;                                       // the peak quivers 3 m (peak to peak) at 0.4 Hz
      SH.uQuiv.value.set(1.5 * Math.sin(w * t), 1.5 * Math.cos(w * 0.83 * t + 1.1), 50 + 1.3 * Math.sin(w * 1.31 * t));
      roll = progress == null ? 0.045 + 0.045 * Math.sin(t * 0.05) : 0.12 * (1 - progress);
      const c = Math.cos(roll), s = Math.sin(roll);
      SH.uRot.value.set(1, 0, 0, 0, c, -s, 0, s, c);
      quat.setFromAxisAngle(ax, roll);
      const hit = SH.uHit.value;
      for (let i = 0; i < 9; i++) {
        const sp = sheets.specs[i];
        if (!sp) { hit[i].set(0, 0, 1, 0); continue; }
        tmp.copy(sp.mid).applyQuaternion(quat);
        hit[i].set(tmp.x, tmp.z, sp.arc * 0.5, 1);
      }
    },
    dispose() { boatGeometry.dispose(); },
  };
  // preview only: opts.view = 'peak' | 'boat' | 'shoal' | 'foot' | 'belly' | 'slope' frames a close orbit
  const dbg = opts.view || null;
  if (dbg === 'peak') { hero.radius = 34; hero.height = 50; hero.center = V3(0, 316, 0); }
  if (dbg === 'belly') { hero.radius = 110; hero.height = 150; hero.center = V3(0, 330, 0); }
  if (dbg === 'shoal') { hero.radius = 7; hero.height = 34; hero.center = V3(0, tideHeight(520) + 1, 520); }
  if (dbg === 'foot') { hero.radius = 40; hero.height = 50; hero.center = V3(0, 3, 1395); }
  if (dbg === 'slope') { hero.radius = 60; hero.height = 150; hero.center = V3(0, tideHeight(600), 600); }
  if (dbg === 'boat') {                                                  // centre on the first lane boat as it is at t = 12
    const ia = root.children.find((m) => m.geometry?.attributes?.aPart).geometry.attributes, I = ia.aI.array, J = ia.aJ.array, t = 12;
    let b = 0, bd = 1e9;
    const rAt = (i) => 300 + ((((I[i * 4 + 1] - 300 - I[i * 4 + 2] * t) % 700) + 700) % 700);
    for (let i = 0; i < 7; i++) { const d = Math.abs(rAt(i) - 600); if (d < bd) { bd = d; b = i; } }
    const rr = rAt(b), wq = 0.045 + 0.03 * ((J[b * 4 + 3] * 7.31) % 1), xl = J[b * 4 + 2] + J[b * 4 + 1] * Math.sin(wq * t + I[b * 4 + 3]);
    const zl = Math.sqrt(Math.max(rr * rr - xl * xl, 1));
    hero.radius = 6; hero.height = 22; hero.center = V3(xl, tideHeight(rr) + 4, zl);
  }
  hero.update(0, 0, null);
  return hero;
}

