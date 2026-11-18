// HERO SET PIECE for "moon-jar-kiln": THE FIRE FRONT.
//
// What it is
//   The whole climbing kiln, inside and out: fire mouth and firebox, twelve chambers under one vault of clay lumps, the
//   flame walls with their arches and floor ports, the sand terraces, 300 moon jars on setters (some ranks are saggar
//   stacks or tiers of bowls: which, and how many, differs per seed), the one great jar (12 m) alone in chamber 7
//   with its cone pack, the river of flame on
//   the crown, flame tongues at every arch, port and log, ash-glass drips, and the flue up to the portal.
//   Everything is driven by ONE value, the fire front: a distance d into the kiln. Behind it the river burns and every
//   jar is a gold lantern with a dark rim; as it passes, each jar sweats, the glaze runs down from the shoulder behind a
//   bright thread, and the body lights; ahead of it the jars are chalk-white in dull ember light, and the top two
//   chambers take cool light from the flue.
//   Origin = centre of the fire mouth's sill, on the yard's ground. +Y up. The fire mouth faces +Z (the yard); the kiln
//   runs toward -Z and climbs: local z = -d. Built 20 x life size (1 unit = 1 m).
//
// Size
//   Kiln length 549 m (d = 0..549), rise 182 m, then the flue: 64 m at 40 degrees; top of the flue at about (0, 232, -598).
//   Chambers 1-6: 40 m long, 70 m wide, 40 m high, 17 degrees. Great chamber: d 276..356, 101 m wide, 58 m high, level
//   floor at y = 72, the great jar at d = 318 (centre (0, 82, -318)). Chambers 8-12 steepen (20..36 degrees).
//   NOTE: radius (2.6), height (10) and center describe the GREAT JAR only, so that a camera told to orbit the piece
//   circles the jar inside the great chamber (18..20 m from its axis). The real box is in `extent`.
//
// opts
//   palette     [snow, snow shadow, soot, white-gold fire, orange, ember red, fired clay] hex strings (brief default)
//   rare        true: one jar in the great chamber (anchors.collapseJar: the fifth of the first rank on the left)
//               folds at the waist and goes down into a glowing, crusting puddle as setProgress passes collapseAt
//   frontKeys   [[u, d], ...] where the fire front is at each u (default: the brief's journey; see DEFAULT_FRONT_KEYS).
//               Re-key it to your own path: the front should run about 60 m ahead of the camera through chambers 1-6.
//   greatMelt   [0.50, 0.58]  u range over which the great jar goes from chalk to lantern
//   greatMeltKeys  [[u, k], ...] instead of greatMelt: the melt 0..1 keyed to u (k 0.34 puts the line on the shoulder,
//               0.47 below the waist)
//   coneAt      [0.53, 0.56, 0.59]  u at which each spike of the great jar's cone pack bows over
//   intensity 1 (fire light), haze 1, jarGlow 1, river 1, spyJets 0 (0..1: flame jets out of the spy holes, for the
//   night variation), flueLight (hex: the daylight colour that comes down the flue), flueReach 104 (metres down the
//   kiln that the flue's light carries), warmth (-1 a paler, harder fire .. +1 a redder one; unset: by seed),
//   exterior true, exteriorBack true (false leaves out the end cap and the flue stack, which only a view from behind
//   the kiln needs)
//
// anchors (hero-local)
//   fireMouth    { position, normal, width 16, height 20 }: the black arch full of fire, seen from the yard
//   flyThrough   ordered points: yard (z = +112.5) -> fire mouth -> every arch about 9 m above its sill (low through
//                chambers 1-2 under the river, at jar height through the wider arch into chamber 3 and along its
//                left-hand rank, high through the arches into 4 and 6) -> one full anticlockwise turn round the great jar
//                as a rising spiral (18.5 m out at the jar's side, 25 m out and 23 m up at the uphill corner, from
//                where the whole chamber lies below) and a wide turn back past it -> chambers 8-9 -> 15 to 20 m up
//                through chambers 10-12, over the terraces of the quiet hall -> flue throat -> portalSeat.
//                At least 7 m clear of everything. pathHeight = 9.
//   The two top chambers (11, 12) are one quiet hall: no wall is built between them (its arch stays in `arches`
//   and `marks` as a place), moon jars and half-size ware turn about on its terraces so that each stands clear, and
//   the arches into chambers 3 and 11 are wider (14 m half-width; the terraces run on through them).
//   marks        indices into flyThrough: { mouth, walls[12], orbit [first, last], throat }. A world keys its moments
//                to the u of these points (sample its own path), then hands the keys over with setKeys().
//   greatJar     { center, radius 6, base, top, floorY }     orbit { center, radius, points[9] }
//   conePack     top of the great jar's cone pack            collapseJar  centre of the jar used by opts.rare
//   arches[12]   { position (9 m above the sill), d, sillY, halfWidth 9 (8 at the firebox), height }
//   chambers[13] { kind, d0, d1, floor0, floor1, halfWidth, height, center }   (index 0 is the firebox)
//   flue         { throat, top, axis, halfThroat 15, halfTop 9, length 64 }
//   portalSeat   { position, normal (faces back down the shaft), axis, width 18, pitch 40 }: a 14 x 14 m portal with
//                tilt fits the 18 m mouth. The last 64 m of the path are the flue's axis.
//   stokePorts[24] { position, normal (into the kiln), d, side }: where logs come in. spyHoles[24] on the outside.
//   floorPorts   positions of the flame ports on the uphill side of each wall (for sparks and embers)
//   viewpoints   the brief's six must-work frames as { name, position, target }
//
// Extra API
//   setProgress(u)   u of the journey, every frame. Moves the front (frontKeys), melts the great jar, bows the cones,
//                    runs the rare collapse. Never wall-clock. If it is never called the piece loops the great jar's
//                    melt on time, for viewing alone.
//   setKeys({ frontKeys, greatMeltKeys, coneAt, collapseAt })   re-key the journey once the world knows its path
//   setFront(d), setGreatMelt(k), setCones(a,b,c), setCollapse(k), setSpyJets(g), setFlueLight(color), setIntensity(k)
//   setLogDrop(i, k)  i = 0 | 1: a pine split thrown in through a stoke port (logDrops[i] = { d, side, from, to });
//                     k 0..1 it falls and catches, 1..3 its flame burns down. Exports latheGeometry, jarProfile.
//   frontAt(u) -> d      floorY(d) -> height of the aisle floor      uniforms: the shared block (uFront, uTime, ...)
//
// The river runs on along the crown uLead (58 m) ahead of the front that lights the jars, and what stands under that
// stretch takes its light from above while still chalk: gold lanterns, melting jars and white ones under one fire.
// Fire: the river is a soft, translucent volume of long licks that hugs the vault (at most about a sixth of its
// height deep) and is drawn out in fibres along the flow; near a flame wall it leaves the crown and dives through
// the arch head as a layer a few metres thick, never a curtain hanging from the vault.
// The river is a volume of separate licks. One low mesh per section lies along the lowest the fire can hang, and
// a small cap stands in the head of each arch; the shader marches each sight line up through an analytic field: long
// tongues drawn out along the flow (a ridge of stretched noise, torn into lengths, leaning back with depth), each
// with a thin white-gold thread along its spine, a dim saturated orange body and dark red torn edges, the bare vault
// dark between them; under an arch head the field banks down into loose tongues. Every mesh answers only for its own
// stretch of the kiln (attribute aSec), so no stretch is marched twice and no seam shows through an arch.
// Every tongue is three offset billboards (core and two skirts) that cool from a white-gold root to a red tip; the
// firebox bed has two wide curtains of fire behind its tongues. Flame walls are soot-black and take almost no light;
// depth comes from the warm haze, which glows only along the part of a sight line that lies behind the front.
// Cool against the fire: unlit brick and the vault's flanks take a blue-violet (uCool), shafts of cold daylight stand
// under spy holes in the great chamber and three others, two of them crossing in the top chamber (flame type 9, with a pool on the sand), thin flame tips burn
// salt-green, and the flue is fire brick lit warm from below, its joints glowing like embers, sooting over toward a frosted rim.
// Cost: about 290k triangles worst case (jars swap between 24-, 16- and 10-sided levels per chamber by distance), 60
// draw calls at most (25 of them the river's pieces and caps, culled ahead of the front), no lights, two small data textures, about 0.6 s build. stats = { triangles, drawCalls }.
// Lighting: the inside is lit by its own shaders and ignores scene lights; it needs none. Give it low bloom (strength
// about 0.25, threshold above 1.1) and exposure 1. Scene fog is applied only to the part of a sight line that lies in
// front of the fire mouth, so the snow haze veils the mouth from the yard but never the chambers. The outside (clay
// face, skin, flue stack: one MeshStandardMaterial mesh with vertex colours) is lit by the world's lights and fog.
// Style: none of its own (styleNote is empty); the world returns its normal style.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EDF3F9', '#8097B4', '#1A1210', '#FFF2C4', '#FF9B30', '#A6261A', '#6E4B38'];
const DEG = Math.PI / 180;
const PROF_N = 1024, PROF_LEN = 576, PROF_SLOPE = 0.33, RIVER_TD = 0.15, RIVER_NA = 1.9, RIVER_NB = 0.7, RIVER_BK0 = 0.92, RIVER_BK1 = 0.246, RIVER_BKMAX = RIVER_BK0 + 1.3 * RIVER_BK1;

// ------------------------------------------------------------------------------------------------
// Layout. d = metres into the kiln measured horizontally from the fire-mouth face (local z = -d).
// ------------------------------------------------------------------------------------------------
const WALL_T = 5;                 // flame-wall thickness
const AISLE = 12;                 // aisle half-width
const VE = 0.7;                   // vault cross-section exponent (squarer than an ellipse)
function makeLayout() {
  const secs = [];                // { kind, d0, d1, f0, f1, W, H, slope }
  let d = 0, f = 0;
  const add = (kind, run, rise, W, H) => { secs.push({ kind, d0: d, d1: d + run, f0: f, f1: f + rise, W, H, slope: rise / run }); d += run; f += rise; };
  add('firebox', 36, 0, 16, 26);
  for (let i = 0; i < 6; i++) add('chamber', 40, 12, 35, 40);
  add('great', 80, 0, 50.75, 58);
  for (const a of [20, 24, 28, 32, 36]) add('chamber', 44 * Math.cos(a * DEG), 44 * Math.sin(a * DEG), 35, 44);
  const end = d, fEnd = f;
  const secAt = (dd) => { for (let i = secs.length - 1; i >= 0; i--) if (dd >= secs[i].d0) return secs[i]; return secs[0]; };
  const floorY = (dd) => { if (dd <= 0) return 0; if (dd >= end) return fEnd; const s = secAt(dd); return lerp(s.f0, s.f1, (dd - s.d0) / (s.d1 - s.d0)); };
  // per-chamber swell: narrower at the flame walls, so the kiln is a row of bellies
  const swell = (s, dd) => { const t = clamp((dd - s.d0) / (s.d1 - s.d0), 0, 1); return s.kind === 'firebox' ? 1 : 0.94 + 0.06 * Math.pow(Math.sin(Math.PI * t), 0.6); };
  // walls[k]: the flame wall at the downhill end of secs[k + 1] (k = 0..11), arch sizes
  const walls = [];
  for (let k = 1; k < secs.length; k++) {
    const s = secs[k], prev = secs[k - 1];
    walls.push({ d: s.d0, f: s.f0, W: Math.max(s.W, prev.W) * 0.97, H: Math.max(s.H, prev.H) * 0.97 + Math.max(0, prev.slope - s.slope) * 3,
      archW: k === 12 ? 24 : (k === 11 || k === 3) ? 14 : 9, archH: k === 1 ? 21 : (k === 12 ? 40 : k >= 9 ? 34 : 26), up: s, down: prev, index: k });   // the last wall is no more than a great rib: the two quiet top chambers are one hall, seen whole
  }
  return { secs, end, fEnd, secAt, floorY, swell, walls };
}
// vault cross-section point for angle th (0 = +x springing, PI/2 = crown, PI = -x springing)
function vaultXY(W, H, th, out) {
  const c = Math.cos(th), s = Math.sin(th);
  out.x = W * Math.sign(c) * Math.pow(Math.abs(c), VE); out.y = H * Math.pow(Math.max(s, 0), VE); return out;
}
// height of the vault above the floor line at lateral x
function vaultHeightAt(W, H, x) { const c = Math.pow(clamp(Math.abs(x) / W, 0, 1), 1 / VE); return H * Math.pow(Math.sqrt(Math.max(0, 1 - c * c)), VE); }

// ------------------------------------------------------------------------------------------------
// Small geometry writer: quads and triangles with position / normal / uv(metres) / aMat / aAux / color
// ------------------------------------------------------------------------------------------------
class Geo {
  constructor() { this.p = []; this.n = []; this.uv = []; this.m = []; this.a = []; this.c = []; this.i = []; this.count = 0; }
  v(x, y, z, nx, ny, nz, u, v, mat, aux = 0, r = 1, g = 1, b = 1) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v); this.m.push(mat); this.a.push(aux); this.c.push(r, g, b); return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // grid of rows x cols vertices already pushed starting at index base (row-major); flip reverses the winding
  grid(base, rows, cols, flip = false) {
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = base + r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      if (flip) this.i.push(a, d, b, b, d, e); else this.i.push(a, b, d, b, e, d);
    }
  }
  steps(g, computeNormals) {
    return [
      () => g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)),
      () => g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)),
      () => g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)),
      () => { g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 1)); g.setAttribute('aAux', new THREE.Float32BufferAttribute(this.a, 1)); },
      () => g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)),
      () => g.setIndex(this.i),
      () => { if (computeNormals) g.computeVertexNormals(); },
      () => { g.computeBoundingSphere(); g.computeBoundingBox(); },
    ];
  }
  build(computeNormals = false) { const g = new THREE.BufferGeometry(); for (const step of this.steps(g, computeNormals)) step(); return g; }
  // the same geometry, handing the page back between its attributes (the kiln's big merged chunks)
  async buildSlowly(ctx, computeNormals = false) { const g = new THREE.BufferGeometry(); for (const step of this.steps(g, computeNormals)) { step(); await ctx.yield(); } return g; }
  get triangles() { return this.i.length / 3; }
}
// a flat quad with its own normal: corners a,b,c,d counter-clockwise seen from the normal side; uv from two axes
function flatQuad(G, a, b, c, d, mat, aux, col, uvs, want) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  if (want && nx * want[0] + ny * want[1] + nz * want[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
  const ax = Array.isArray(aux) ? aux : [aux, aux, aux, aux];
  const P = [a, b, c, d], id = [];
  for (let k = 0; k < 4; k++) id.push(G.v(P[k][0], P[k][1], P[k][2], nx, ny, nz, uvs ? uvs[k][0] : P[k][0], uvs ? uvs[k][1] : (Math.abs(ny) > 0.7 ? -P[k][2] : P[k][1]), mat, ax[k], col[0], col[1], col[2]));
  G.quad(id[0], id[1], id[2], id[3]);
}

// ------------------------------------------------------------------------------------------------
// GLSL shared by every kiln shader: the front, the fire's colour and place, haze, snow fog outside
// ------------------------------------------------------------------------------------------------
const GLSL_COMMON = /* glsl */`
uniform float uFront, uTime, uFlueD, uFlueR, uFire, uHaze, uInside, uLead;
uniform vec3 uCamL, uGold, uOrange, uEmber, uSkyCol, uSoot, uClay, uCool;
uniform vec4 uShaft[5];          // where the great chamber's three shafts of cold light land (xyz) and how wide (w)
float hash11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p+n*17.13+3.7)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1.,0.)), f.x), mix(hash21(i+vec2(0.,1.)), hash21(i+vec2(1.,1.)), f.x), f.y); }
float fbm2(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03+vec2(17.1, 9.2); a *= .5; } return s; }
float fbm3(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a*vnoise(p); p = p*2.03+vec2(17.1, 9.2); a *= .5; } return s; }
// 1 behind the fire front (fired), 0 ahead of it (still cold), over a 30 m band
float heatAt(float d){ return smoothstep(uFront+8., uFront-22., d); }
float frontGlow(float d){ float x = (d-uFront+6.)/20.; return exp(-x*x); }
// the river on the crown over axis distance d: 1 where it runs overhead, 0 beyond its leading tips and at the kiln's two ends
// (the river's own gates; the front may or may not have come)
float riverOn(float d){ return (1.-smoothstep(uFront+uLead-22., uFront+uLead+28., d))*smoothstep(4., 13., d)*(1.-smoothstep(uFlueD-26., uFlueD-8., d)); }
// white-gold at the root and still gold in the top chambers, only a little redder
vec3 fireCol(float d){ return mix(uGold, uOrange, .42*smoothstep(60., 520., d)); }
// the cold light that comes down the great chamber's spy holes, where it lands
float shaftPool(vec3 P){
  float k = 0.;
  for (int i = 0; i < 5; i++){ vec3 r = P-uShaft[i].xyz; r.y *= .45; k += exp(-dot(r, r)/max(uShaft[i].w*uShaft[i].w, 1e-3)); }
  return k;
}
// analytic flame noise of the river on the crown: p = (across, along) metres; flows uphill (+along)
float riverNoise(vec2 p){
  vec2 q = vec2(p.x*.10, p.y*.017-uTime*.55);
  float a = fbm3(q*1.3+vec2(0., uTime*.12));
  return fbm3(q*2.4+vec2(a*1.9, -uTime*.3-a*.7));
}
float flueLight(float d){ return smoothstep(uFlueD-uFlueR, uFlueD-34., d); }
// light arriving at a surface with local normal N at axis distance d (no real lights in the kiln)
vec3 kilnLight(vec3 N, float d){
  float heat = heatAt(d), fg = frontGlow(d);
  float pre = (1.-heat)*exp(-max(d-uFront, 0.)/20.);
  vec3 fc = fireCol(d);
  vec3 warmc = mix(uOrange, fc, .55);
  // the river runs on overhead ahead of the front: what stands under it takes its light from above while it is still cold
  float under = max(1.-smoothstep(uFront+uLead-22., uFront+uLead+24., d)-heat, 0.);
  vec3 L = warmc*heat*(.55+.6*fg)*(.16+.84*max(dot(N, vec3(0., .86, .5)), 0.))*uFire;
  L += vec3(1., .60, .30)*pre*.55*(.12+.88*max(dot(N, vec3(0., .45, .89)), 0.));
  L += warmc*under*.42*(.10+.90*max(N.y, 0.))*uFire;
  vec3 emb = mix(uEmber, vec3(.40, .13, .07), .55);
  L += emb*(1.-heat)*(.18+.82*max(.3-N.y*.7, 0.))*.85;
  // ahead of the front what the embers do not reach is cool: a blue-violet half-light from above
  L += mix(vec3(.25, .225, .21), uCool, .6)*(1.-heat)*(.35+.65*max(N.y*.7+.3, 0.));
  float fl = flueLight(d);
  L += uSkyCol*fl*(.06+.94*max(N.y*.85-N.z*.15, 0.))*2.0*(1.-.7*heat);
  // behind it, whatever is turned away from the fire keeps a blue-violet shadow
  L += uCool*heat*.30*max(.2-dot(N, vec3(0., .86, .5))*.8, 0.);
  return L;
}
// warm haze that steps each chamber back; colour follows the fire where the fragment is
vec3 kilnHaze(vec3 col, float d, float dist){
  // the haze glows where the sight line runs through the fired part of the kiln: each arch further off is paler and
  // warmer than the one before, while the cold chambers beyond the front keep their dull red dark
  float dc = -uCamL.z, lo = min(dc, d), hi = max(dc, d);
  float hotK = clamp((uFront-4.-lo)/max(hi-lo, 1.), 0., 1.);
  float fg = frontGlow(d);
  vec3 hotc = mix(uOrange, uGold, .6)*(.125+.075*fg)*uFire;
  vec3 coldc = uEmber*.07+uCool*.085+uSkyCol*.07*flueLight(d);
  float hz = (1.-exp(-dist*mix(.0034, .0052, hotK)*uHaze))*mix(.8, 1., hotK);
  return mix(col, mix(coldc, hotc, hotK), hz);
}
`;
// vertex + fragment pieces for the snow haze outside: only the part of the sight line in front of the fire mouth
const GLSL_FOG_PARS = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
#endif
vec3 sceneFog(vec3 col, vec3 P, float dist){
  #ifdef USE_FOG
    float outside = uCamL.z > 0. ? (P.z < 0. ? uCamL.z/max(uCamL.z-P.z, 1e-3) : 1.) : 0.;
    float fd = dist*outside;
    #ifdef FOG_EXP2
      float ff = 1.-exp(-fogDensity*fogDensity*fd*fd);
    #else
      float ff = smoothstep(fogNear, fogFar, fd);
    #endif
    col = mix(col, fogColor, clamp(ff, 0., 1.));
  #endif
  return col;
}
`;

// ------------------------------------------------------------------------------------------------
// Shell shader: vault lumps (0), soot brick (1), sand (2), burning logs (3), fired clay (4),
// flame-port glow (5), flue brick with daylight (6)
// ------------------------------------------------------------------------------------------------
const SHELL_VERT = /* glsl */`
attribute float aMat; attribute float aAux; attribute vec3 color;
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying float vMat; varying float vAux; varying vec3 vCol; varying float vDist;
void main(){
  vP = position; vN = normal; vUv = uv; vMat = aMat; vAux = aAux; vCol = color;
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const SHELL_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying float vMat; varying float vAux; varying vec3 vCol; varying float vDist;
uniform sampler2D tProf;
uniform vec4 uPool;                // the great jar's pool of firelight on the sand: centre x, centre z, radius, strength
// nearest cell: x = distance to its centre, yz = vector to the centre, w = cell id
vec4 cells(vec2 p){
  vec2 i = floor(p), f = fract(p); float best = 9.; vec2 bv = vec2(0.); float id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y)); vec2 o = hash22(i+g); vec2 r = g+o-f; float dd = dot(r, r);
    if (dd < best){ best = dd; bv = r; id = o.x+o.y*7.; }
  }
  return vec4(sqrt(best), bv, id);
}
void main(){
  float d = -vP.z;
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.));
  vec3 Vv = uCamL-vP; float vl = max(length(Vv), 1e-3); vec3 V = Vv/vl;
  float heat = heatAt(d), fg = frontGlow(d);
  vec3 fc = fireCol(d);
  vec3 col;
  if (vMat < .5){
    // vault: fist-rolled clay lumps laid end-on, ash glaze toward the crown
    vec4 c = cells(vUv/1.55);
    float dome = 1.-smoothstep(.0, .6, c.x);
    vec3 t1 = normalize(cross(N, vec3(0., 0., 1.))+vec3(1e-4, 0., 0.)); vec3 t2 = cross(N, t1);
    vec3 Nb = normalize(N-(t1*c.y+t2*c.z)*1.25*(1.-dome*.5));
    float crev = smoothstep(.46, .68, c.x);
    float tone = .75+.5*fract(c.w*3.7);
    float n = fbm2(vUv*.13);
    float glaze = smoothstep(.25, .8, vAux+(n-.5)*.7);
    vec3 alb = uClay*tone*(.75+.5*n);
    alb = mix(alb, vec3(.105, .10, .042)*(.6+tone*.6), glaze*.85);
    float fbx = 1.-smoothstep(30., 44., d);
    alb *= (1.-mix(.5, .7, heat)*crev*(1.-.6*fbx))*mix(.6+.55*dome, .9+.12*dome, fbx);
    vec3 L = kilnLight(Nb, d);
    // ahead of the front the vault is a violet dusk in which a lump here and there still holds an ember: small
    // orange-gold sparks, breathing, never a grid of red dots on violet (which reads as magenta)
    float twk = .66+.46*sin(uTime*1.6+c.w*37.);
    float spark0 = smoothstep(.40, .06, c.x)*step(.62, fract(c.w*7.3)), spark = spark0*(1.-heat), flank = (1.-vAux)*(1.-vAux);
    col = alb*L*1.25+alb*mix(uEmber, vec3(.4, .13, .07), .4)*(1.-heat)*(.40+.26*dome)*1.05*twk;
    col += mix(uOrange, uGold, .22)*spark*(.10+.16*fract(c.w*13.7))*(.55+.45*tone)*twk;
    // hot clay glows of itself, most near the river on the crown
    // (on the flanks, where the violet shadow lies, only some lumps glow, as small orange-gold embers)
    col += mix(mix(uOrange, fc, .25), mix(uOrange, uGold, .3), spark0*flank)*heat*(.035+.2*vAux*vAux*vAux)*(1.-.75*crev)*(.6+.7*tone)*mix(.5+.5*dome, .22+.20*dome+2.6*spark0, flank)*uFire;
    // the river lights the vault it runs on, also where it runs on ahead of the front: the lumps beside and between
    // its licks stand in its light, strongest at the crown and gone by the springing, breathing with the fire
    float rvl = riverOn(d)*pow(smoothstep(.0, .80, vAux), 1.4)*(.62+.76*riverNoise(vec2(vP.x*.6, d+7.)));
    col += (alb*1.2+vec3(.085, .034, .012))*mix(uOrange, fc, .3)*rvl*(.84+.16*dome)*(1.-.2*crev)*.85*uFire;
    // glaze reflects the river
    vec3 R = reflect(-V, Nb);
    float sp = pow(max(dot(R, normalize(vec3(0., .9, .35))), 0.), 14.);
    col += fc*heat*glaze*sp*.9*(.3+riverNoise(vUv+R.xz*20.))*dome;
    // low on the flanks, behind the terraces, the vault falls into blue-violet shadow
    col += uCool*(1.-vAux)*(1.-vAux)*(.125+.085*tone)*(.60+.19*dome)*(1.-.8*spark0)*(1.-.45*heat);
    col += alb*mix(uOrange, fc, .4)*fbx*(.8+.2*dome)*(.45+1.1*n)*(.7+.5*fbm2(vUv*.045+7.))*1.15;
    col += alb*mix(uEmber, uOrange, .5)*smoothstep(uFlueD-34., uFlueD-2., d)*vAux*vAux*(.5+.5*dome)*1.7;
    col *= vCol;
  } else if (vMat < 1.5){
    // soot-black clay brick
    vec2 bu = vUv/vec2(4.4, 1.7); bu.x += .5*mod(floor(bu.y), 2.);
    vec2 bi = floor(bu), bf = fract(bu);
    float mort = smoothstep(.0, .035, bf.x)*smoothstep(1., .965, bf.x)*smoothstep(.0, .09, bf.y)*smoothstep(1., .91, bf.y);
    float tone = .6+.8*hash21(bi);
    float n = fbm2(vUv*.6);
    float n2 = fbm2(vUv*.085+3.);
    float pat = (.5+.5*n)*tone*(.4+.6*mort)*(.65+.7*n2);
    vec3 alb = uSoot*(.55+.5*n)*tone*(.45+.55*mort)*.36;
    vec3 Nb = normalize(N+vec3((bf.x-.5)*.25*(1.-mort), (bf.y-.5)*.5*(1.-mort), 0.));
    vec3 L = kilnLight(Nb, d);
    col = alb*L*vCol;
    // the soot soaks up the fire: a dull glow, strongest round the arch, wavering; never as bright as a jar
    float nearArch = smoothstep(0., .12, vAux), pre = exp(-max(d-uFront, 0.)/24.);
    float wav = .76+.2*sin(uTime*2.7+vUv.x*.21)*sin(uTime*1.9+vUv.y*.17+1.3)+.08*sin(uTime*6.1+vUv.x*.9+vUv.y*.6);
    wav += .2*sin(d*.105-uTime*2.3+vUv.y*.06);                 // the fire's breath going up the kiln, chamber by chamber
    // behind the front the walls are soot-black silhouettes against the fire: only a breath of the brickwork shows,
    // a little more close to (so a wall passed at ten metres is still brick, not a hole)
    float nearCam = smoothstep(72., 12., vDist), fbx = 1.-smoothstep(30., 44., d);
    nearCam = max(nearCam, .62*step(277., d)*step(d, 281.));          // the great chamber's lower wall is seen whole from across the chamber: its brickwork shows
    vec3 wl = mix(uOrange, fc, .35)*heat*(.8+1.1*fg+.95*nearArch)*(.05+.36*nearCam+1.1*fbx)+mix(uEmber, vec3(.85, .42, .22), .4)*(1.-heat)*(.82+.6*nearArch)*(1.-.2*pre);
    col += vec3(.078, .060, .052)*pat*wl*wav*uFire*(.6+.4*vCol)*1.45;
    // the river lights the wall it dives at: the face under the crown, where the fire turns down to the arch
    vec4 prw = textureLod(tProf, vec2(d/${PROF_LEN}., .5), 0.);
    float rwl = riverOn(d)*exp(-max(prw.r+${PROF_SLOPE}*d-vP.y, 0.)/8.)*exp(-vP.x*vP.x/600.)*(1.-fbx);
    // (a wash more than lit courses: brickwork standing bright behind the fire would show through it and thin it)
    col += vec3(.078, .060, .052)*mix(pat, .42, .75)*mix(uOrange, fc, .3)*rwl*wav*uFire*(.6+.4*vCol)*3.4;
    // away from the arch the brickwork goes to blue-violet: the corners the fire does not reach
    col += uCool*pat*(.105-.045*heat)*(1.-.75*nearArch)*(.5+.5*vCol)*(1.-fbx)+uSkyCol*flueLight(d)*pat*.045*(1.-heat);
    // the flue's throat: the back wall round it takes the light that stands in the shaft and lets it fall off into the vault
    float thr = step(uFlueD-1.5, d)*smoothstep(.0, .3, vAux);
    col += mix(uEmber, uOrange, .2)*pat*thr*thr*thr*.26*(.8+.2*sin(uTime*3.1+vUv.x*.3));
    // glassy soot catches the fire at a grazing angle
    float fr = pow(1.-clamp(dot(N, V), 0., 1.), 4.);
    col += fc*heat*fr*.05*mort+uEmber*(1.-heat)*(fr*.03+.012*tone*mort);
    // rim of the arch (vAux = 1 on the arch ring): baked edge glow where the fire licks through
    float rimg = pow(clamp(vAux, 0., 1.), 24.)*.75;      // clamped: multisampling extrapolates a varying past its range on thin triangles
    // and where the river dives at the arch ahead of the front, the head of the ring stands in its fire
    col += mix(uOrange, fc, .3)*riverOn(d)*(1.-heat)*rimg*exp(-max(prw.r+${PROF_SLOPE}*d-vP.y, 0.)/14.)*exp(-vP.x*vP.x/600.)*(.45+.55*n)*(.5+.5*mort)*1.5*uFire;
    col += (mix(uOrange, fc, .3)*heat*(.9+fg)+uEmber*(1.-heat)*.75+vec3(1., .42, .1)*(1.-heat)*exp(-max(d-uFront, 0.)/24.)*.35)*rimg*(.45+.55*n)*(.5+.5*mort)*.55;
    // the inner face of an arch (jambs and soffit) is the one stretch of wall the fire washes on its way through:
    // fire brick laid as voussoirs, lit by the flame that pours under it, its joints glowing. Passed at a few metres
    // it is warm brick with form, never a black shape at the edge of the frame
    float inner = (1.-smoothstep(.05, .3, abs(N.z)))*step(abs(vP.x), 14.6)*step(d, uFlueD-2.);
    if (inner > .001){
      vec2 vb = vUv/vec2(1.55, 3.2); vb.y += .5*mod(floor(vb.x), 2.);
      vec2 vi = floor(vb), vf = fract(vb);
      float vm = smoothstep(.0, .09, vf.x)*smoothstep(1., .91, vf.x)*smoothstep(.0, .045, vf.y)*smoothstep(1., .955, vf.y);
      float vt = .76+.48*hash21(vi+3.);
      vec3 fb = mix(vec3(.30, .125, .065), vec3(.42, .22, .10), hash21(vi+7.))*vt*(.30+.70*vm)*(.62+.76*n);
      fb = mix(fb, vec3(.05, .04, .045)*vt, step(.90, hash21(vi+11.))*.8*vm);          // a brick here and there burnt blue-black
      float sof = max(-N.y, 0.);
      vec3 fl2 = mix(uOrange, fc, .4)*heat*(.58+.70*sof+.22*fg)*(.55+.6*wav)+mix(uEmber, vec3(.85, .42, .22), .45)*(1.-heat)*(.34+.42*pre);
      float nearI = smoothstep(90., 22., vDist)*smoothstep(4., 10., d)*mix(.5, 1., smoothstep(4., 14., vDist));      // only near the eye: far off the flame walls stay a nest of soot-black arches, and the fire mouth stays a black arch full of fire; passed at arm's length a jamb is dim warm brick, never the brightest thing in the frame
      col += fb*fl2*inner*nearI*uFire*.88;
      col += mix(uEmber*.8, mix(uOrange, fc, .3), heat)*(1.-vm)*inner*nearI*(.035+.05*sof)*(.6+.4*sin(uTime*2.3+vi.x*1.9+vi.y*2.7));
    }
    col *= 1.-.5*step(uFlueD-1.5, d);                                   // the bell's wall is the sootiest in the kiln
  } else if (vMat < 2.5){
    // sand terraces and the aisle: warm brown and darker than the jars, lit in pools under the arches and at the ports
    float n = fbm2(vUv*.35), g = hash21(floor(vUv*9.));
    float n5 = fbm2(vUv*.07+vec2(5., 2.));
    float rip = .5+.5*sin(vUv.y*2.6+n*9.+vUv.x*.4);
    // raked here and there: broad furrows that wander and fade out where feet and setters have scuffed them
    float rake = (.5+.5*sin(vUv.x*2.3+sin(vUv.y*.13+n5*6.)*2.2+n*2.5))*smoothstep(.36, .62, n5);
    vec3 alb = vec3(.215, .150, .100)*(.58+.6*n)*(.92+.08*rip+.10*rake)*(.9+.2*g)*vCol;
    // drifts of grey wood ash blown against the terraces
    float ash = smoothstep(.50, .70, fbm2(vUv*.085+vec2(11., 3.))+.08*rake-.06);
    alb = mix(alb, vec3(.23, .21, .19)*(.7+.5*n), ash*.7);
    vec4 pc = cells(vUv*.62);
    float peb = step(.80, fract(pc.w*5.3))*smoothstep(.20, .12, pc.x);
    alb = mix(alb, uClay*(1.0+1.3*fract(pc.w*9.1)), peb*.85);
    alb *= 1.-.30*exp(-vP.x*vP.x/14.)*(.5+.5*vnoise(vec2(vUv.x*.7, vUv.y*.18)));
    float riser = 1.-smoothstep(.5, .8, N.y);
    alb *= 1.-riser*(.25+.3*smoothstep(.35, .6, fbm2(vec2(vUv.x*.25+vUv.y*.25, vP.y*1.6))));
    // the river overhead throws moving pools of light down the aisle; between them the floor falls into shadow
    float rv = riverNoise(vec2(vP.x*.8, d+18.));
    float pools = mix(1., .50+.80*smoothstep(.34, .70, rv), heat);
    // height above the aisle floor: the embers' red light lies low and falls off up the terraces
    vec4 prf = textureLod(tProf, vec2(d/${PROF_LEN}., .5), 0.);
    float low = exp(-max(vP.y-(prf.r+${PROF_SLOPE}*d-prf.g+.6)-1., 0.)/6.);
    vec3 L = kilnLight(N, d)*mix(1., .7, flueLight(d)*(1.-heat))*pools*mix(1., .9, heat);
    col = alb*L+alb*mix(uEmber, uOrange, .3)*(1.-heat)*.42*(.3+.7*low);
    // the firebox floor is a bed of coals under the logs, brightest toward the back
    float bedK = (1.-smoothstep(.25, .32, vCol.r))*smoothstep(1., 8., d)*step(d, 37.);
    float coal = smoothstep(.62, .18, pc.x)*(.35+.65*fract(pc.w*3.3))*(.7+.3*sin(uTime*1.7+pc.w*47.));
    col += mix(uEmber*.9, uOrange*1.05, coal*smoothstep(4., 14., d))*bedK*(.16+.62*coal)*(1.+1.3*uInside);
    // ahead of the front the floor is not black: drifts of live coals lie along the aisle and against the terraces,
    // and the cut faces of the terraces take their red light
    float eb = smoothstep(.46, .70, fbm2(vUv*.09+vec2(7., 1.)));
    float er = mix(.16, .60, fract(pc.w*9.1));                       // coals of every size, none of them round
    float ec = smoothstep(er, er*.25, pc.x+(vnoise(vUv*1.9+pc.w*5.)-.5)*.42)*(.35+.65*fract(pc.w*4.7))*(.7+.3*sin(uTime*1.3+pc.w*33.));
    col += mix(uEmber*1.5, uOrange*1.15, ec*.45)*eb*ec*(1.-heat)*(1.-riser)*.7*(.25+.75*low);
    // the cut faces: strata of rammed sand and clay, red in the embers' light at the foot, violet higher up
    float strata = .5+.5*sin(vP.y*4.2+n*6.+fbm2(vUv*.3+3.)*5.);
    float quiet = (1.-heat)*smoothstep(8., 40., d-uFront-uLead);
    col += vec3(.150, .030, .012)*riser*(1.-heat)*(.25+.75*n)*(.30+.70*strata)*(.4+eb)*max(low, .30*quiet)*1.25;
    col += uCool*riser*(1.-heat)*(1.-low)*(.03+.07*strata)*(.5+n);
    // behind the front the lanterns standing on a terrace light its cut face: rammed strata in warm brown, never a black box
    col += vec3(.215, .150, .100)*mix(uOrange, fc, .35)*riser*heat*(.62+.38*strata)*(.45+.9*n)*(.75+.5*n5)*1.15*uFire;
    col += alb*uSkyCol*quiet*flueLight(d)*(1.-riser)*1.5*(.6+.4*rake);
    col += vec3(.30, .062, .026)*riser*quiet*(.62+.38*strata)*(.35+.65*n)*(.55+.45*eb)*(.7+.5*n5)*.95;
    col += alb*mix(uEmber, uOrange, .3)*quiet*(1.-riser)*(.9+1.6*eb)*1.5;      // the quiet hall's terraces are seen from below: their cut faces stand red in the embers' light
    float sp5 = shaftPool(vP);
    col += alb*uSkyCol*sp5*4.5;
    // the great jar stands in its own light: a soft pool of gold on the sand round its setter, growing as the jar
    // becomes a lantern, wavering with the fire; darker at the setter's foot, and it gives way to the cold slants
    vec2 pj = vP.xz-uPool.xy; float pr = length(pj);
    float gp = exp(-pr*pr/(uPool.z*uPool.z))*(.30+.70*smoothstep(2.6, 7.5, pr))*uPool.w*(1.-riser);
    gp *= (.84+.16*sin(uTime*3.1+pj.x*.21)*sin(uTime*2.3+pj.y*.17))*(.75+.5*n)*(1.-.55*clamp(sp5, 0., 1.));
    col += alb*mix(uOrange, uGold, .5)*gp*2.5;
    // crumbs of ember fallen from the logs and the ports
    float crumb = step(.80, fract(pc.w*7.7))*smoothstep(.20, .05, pc.x);
    col += mix(uEmber*1.2, uOrange*1.6, heat)*crumb*(.55+.45*sin(uTime*2.3+pc.w*61.));
    // pools of light where the floor ports open (vAux baked near each wall's uphill face)
    float pool = vAux*(.6+.4*sin(uTime*7.+vUv.x*.9)*sin(uTime*4.3+vUv.x*.37));
    col += alb*pool*mix(mix(uEmber, uOrange, .35)*1.7, mix(uOrange, fc, .4)*2.6, heat);
  } else if (vMat < 3.5){
    // burning pine splits: char in long blocks along the grain, a few fissures glowing, end grain in ember rings
    float cn = fbm2(vUv*vec2(.5, 1.6));
    if (vAux > 1.5){
      float r = length(vUv), ring = .5+.5*sin(r*15.+cn*5.);
      float pulse = .72+.28*sin(uTime*1.9+vP.x*1.3+vP.z*.7);
      col = mix(uEmber*.45, mix(uOrange, uEmber, .3)*1.15, ring*(.3+.7*cn))*pulse*(1.-smoothstep(.72, 1.02, r))+vec3(.03, .012, .006);
    } else {
      vec4 c = cells(vUv*vec2(.30, 1.05));
      float crack = smoothstep(.50, .64, c.x)*(1.-smoothstep(.64, .80, c.x));
      float patch_ = smoothstep(.42, .70, fbm2(vUv*vec2(.12, .35)+3.));
      float pulse = .6+.4*sin(uTime*2.3+c.w*40.)*sin(uTime*1.1+vUv.x);
      vec3 alb = vec3(.040, .025, .018)*(.5+cn)*(.7+.6*fract(c.w*5.1));
      col = alb*mix(uOrange, uGold, .3)*1.7*(.35+.65*max(N.y, 0.))+uEmber*.08*cn;
      col += mix(uEmber*1.1, uOrange*1.15, pulse*vAux)*crack*patch_*(.35+.65*pulse);
      col += uEmber*.55*smoothstep(.3, -.6, N.y)*(.5+.5*cn);
    }
  } else if (vMat < 4.5){
    // fired clay: setter drums, wads, port frames
    float n = fbm2(vUv*.9);
    float ring = .9+.1*sin(vUv.y*9.+n*3.);
    vec3 alb = mix(uClay, vec3(.36, .26, .18), .55)*(.6+.7*n)*ring*vCol;
    col = alb*kilnLight(N, d)+uOrange*heat*alb*.3*uFire;
  } else if (vMat < 5.5){
    // flame port: an arched mouth that glows ember red before the front and white-gold behind it
    vec2 q = vUv*2.-1.;
    float arch = q.y < .2 ? abs(q.x) : length(vec2(q.x, (q.y-.2)/.8));
    float inside = smoothstep(.98, .72, arch);
    float core = smoothstep(.9, .1, arch)*(1.-.35*smoothstep(-1., 1., q.y));
    float fl = .7+.3*sin(uTime*9.+vAux*50.)*sin(uTime*5.7+vAux*31.);
    float pf = vnoise(vec2(q.x*2.2+vAux*9., q.y*2.6-uTime*3.2));
    core *= .45+.9*pf;
    vec3 hot = mix(uOrange*.5, mix(uOrange, fc, .5)*1.3, core*core)*fl*(1.-.5*smoothstep(-.2, 1., q.y));
    vec3 cold = mix(uEmber*.55, mix(uEmber, uOrange, .6)*1.25, core*core)*(.55+.45*fl);
    float pre = exp(-max(d-uFront, 0.)/24.);
    col = mix(mix(cold, hot*.5, pre*.5), hot, heat)*inside;
    col = max(col, uSoot*.03);
  } else {
    // flue: a brick chimney. The mortar of its joints glows where the heat stands in it, each brick's lower edge takes
    // the fire's light from below and its upper edge the sky's from above; frost at the rim. Heat makes the far courses swim
    float up = vAux, up2 = up*up;
    vec2 fuv = vUv+vec2(sin(vUv.y*.83-uTime*4.1+vUv.x*.31), sin(vUv.x*.57+vUv.y*.4-uTime*3.3))*.01*smoothstep(12., 60., vDist);
    // the two side walls are laid with their courses running up the shaft, as the walls of a passage are: seen from
    // inside, their long joints draw to the mouth; floor, roof and chamfers are laid in rings
    vec2 buv = abs(N.x) > .9 ? fuv.yx : fuv;
    vec2 bu = buv/vec2(2.3, .92); bu.x += .5*mod(floor(bu.y), 2.);
    vec2 bi = floor(bu), bf = fract(bu);
    float jw = 1.+1.6*smoothstep(18., 60., vDist);                     // joints widen with distance, so they never thin to a shimmer
    // seen along the shaft the upright joints of a wall line up into zigzags that outweigh the courses: they thin
    // out as the wall turns edge-on, and the courses (rings round the shaft) carry the brickwork
    float headK = .25+.75*smoothstep(.10, .55, abs(dot(N, V)));
    float mort = mix(1., smoothstep(.0, .05*jw, bf.x)*smoothstep(1., 1.-.05*jw, bf.x), headK)*smoothstep(.0, .12*jw, bf.y)*smoothstep(1., 1.-.12*jw, bf.y);
    mort = mix(mort, .82, smoothstep(40., 85., vDist));                // far courses run together
    float tone = mix(1., .78+.44*hash21(bi), headK);
    float n = fbm2(fuv*.4), n2 = fbm2(fuv*.07+5.);
    float streak = fbm2(vec2(fuv.x*.55, fuv.y*.035)+9.);               // soot runs down the shaft in long streaks
    // fire brick: plum and rust low in the shaft where the flame scours it clean, sooting over toward the mouth
    float bh = hash21(bi+3.);
    vec3 brick = mix(vec3(.27, .105, .06), vec3(.40, .185, .09), bh)*tone*(.62+.55*n)*(.7+.45*n2);
    brick = mix(brick, vec3(.07, .06, .075)*tone, step(.9, hash21(bi+11.))*.8);      // a brick here and there burnt blue-black
    float sootK = clamp(smoothstep(.16, .62, up+(streak-.5)*.95)*.9, 0., 1.);
    vec3 alb = mix(brick, mix(uSoot*.8, vec3(.17, .125, .115), .6)*tone*(.6+.6*n)*(.4+1.0*streak), sootK);
    float heatK = smoothstep(1.02, .0, up), warmK = heatK*heatK;       // the fire's light climbs the shaft and thins toward the mouth
    vec3 warm = mix(uOrange, uGold, .25);
    float fl = .8+.2*sin(uTime*5.3+vUv.y*.4)*sin(uTime*3.1+vUv.x*.3);
    float nearK = 1.-.6*smoothstep(46., 90., vDist);
    float lowE = smoothstep(.34, .10, bf.y)*mort*nearK, highE = smoothstep(.66, .90, bf.y)*mort*nearK;
    // the ware's stair: its risers stand upright (brick, as the walls are), its treads lie level
    float riserK = step(.9, N.z), treadK = step(.9, N.y);
    float under = max(-(N.y*.643-N.z*.766), 0.)*(1.-riserK);           // faces turned down the shaft: the soffits of the corbels and of the stair's nosings
    vec3 L = warm*(.34+.85*lowE+1.3*under+.55*riserK)*(.17+.83*warmK)*fl*mix(1., .42, smoothstep(30., 95., vDist))+uSkyCol*(.07+.85*up2*up)*(.45+1.5*highE)*(1.-.8*under)*(1.+.9*treadK)+uCool*.2+warm*.035;
    // where the ware stands: a soft shade on the tread under each piece of its rank and in the corner under the riser; under
    // each nosing the top of the riser is in its shade. The tread's colour carries its rank (r the count, g the metres from its
    // inner corner, b the pitch); a riser's carries the metres below its top in g
    float shade = 1.;
    if (treadK > .5){
      float pitch = vCol.b*8., nn = floor(vCol.r*40.+.5), wS = (pitch-.8)/.82, dz = vCol.g*16.-(.5*wS+.55);
      float dx = (fract(vP.x/pitch+.5*mod(nn, 2.))-.5)*pitch;
      shade = 1.-.55*exp(-(dx*dx+dz*dz)/(.30*wS*wS))*step(abs(vP.x), nn*.5*pitch);
      shade *= 1.-.35*exp(-vCol.g*16./.9);
    } else if (riserK > .5) shade = 1.-.5*exp(-vCol.g*16./.8);
    float fn = fbm2(vUv*.6);
    float frost = smoothstep(.83, 1.0, up+.16*(fn-.5)*2.+.08*(streak-.5))*(1.-under);
    alb = mix(alb, vec3(.60, .64, .74), frost*.8*(.45+.55*vnoise(vUv*2.3))*(.6+.4*mort));
    // runs of ash glass: where the fly ash has melted on the brick it has run down the shaft in long olive-brown tears
    float runN = fbm2(vec2(fuv.x*1.15+.55*sin(fuv.y*.31+n2*5.), fuv.y*.125)+21.);
    float runK = smoothstep(.58, .70, runN)*smoothstep(.16, .34, up)*(1.-smoothstep(.72, .9, up));
    alb = mix(alb, vec3(.12, .105, .045)*(.7+.6*n), runK*.85);
    col = alb*L*2.3*shade+warm*under*.34*tone*(.4+.6*n)*fl*max(warmK, .16)*(.3+.7*mort);
    // the glass catches both lights: the fire's from below along its lower edge, the sky's down its length
    float glint = smoothstep(.58, .61, runN)*smoothstep(.68, .62, runN)*(.35+.65*vnoise(vec2(fuv.x*.9, fuv.y*.16)+dot(V, vec3(2., 3., 2.5))));
    col += (warm*(1.-up)*.5+uSkyCol*(.2+up)*.24)*runK*(.05+.4*glint);
    // frost at the rim takes the sky's colour, and sparkles a little
    col += uSkyCol*frost*(.16+.10*fn)+uSkyCol*frost*step(.93, hash21(floor(vUv*5.)))*.35*(.5+.5*sin(uTime*3.+hash21(floor(vUv*5.)+3.)*40.));
    // the joints: orange-gold low in the shaft, cooling to ember red toward the mouth
    float jglow = (1.-mort)*(.55+.45*hash21(bi+7.))*(.7+.3*sin(uTime*2.1+bi.x*1.7+bi.y*2.3));
    // the heat stands in the joints in patches, and soot chokes them: by the middle of the shaft only a few seams still glow
    jglow *= max(1.-smoothstep(.30, .66, up+(streak-.5)*.9+(n2-.5)*.5), .62*smoothstep(.40, .54, n2)*(1.-smoothstep(.82, .94, up)))*smoothstep(.30, .52, n2+.55*(1.-up)-(streak-.5)*.4)*(1.-runK);
    jglow = mix(jglow, .15, smoothstep(34., 80., vDist));               // far off the joints melt into one glow: no shimmer of lines
    col += mix(uEmber*1.25, mix(uOrange, uGold, .2)*1.45, warmK*warmK)*jglow*(.34+.76*warmK)*(.6+.8*n2);
    float frf = pow(1.-clamp(dot(N, V), 0., 1.), 3.);
    col += (uSkyCol*up2*.5+warm*(1.-up)*.5)*frf*.14*(.4+.6*mort)*tone;
  }
  float hazeK = vMat > 5.5 ? (1.-vAux)*.6 : 1.;
  col = mix(col, kilnHaze(col, d, vDist), hazeK);
  col = sceneFog(col, vP, vDist);
  gl_FragColor = vec4(col, 1.);
}`;

function fogUniforms() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }

// ------------------------------------------------------------------------------------------------
// Shell geometry
// ------------------------------------------------------------------------------------------------
// arch outline: jambs + semicircle, from the right foot over the top to the left foot. Returns [{x,y,nx,ny,s}]
function archPath(hw, h, segs = 24) {
  const hj = h - hw, pts = [], nJ = Math.max(2, Math.round(segs * 0.25)), nA = segs - 2 * nJ;
  for (let i = 0; i < nJ; i++) pts.push({ x: hw, y: hj * i / nJ, nx: 1, ny: 0 });
  for (let i = 0; i <= nA; i++) { const a = Math.PI * i / nA; pts.push({ x: hw * Math.cos(a), y: hj + hw * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a) }); }
  for (let i = nJ - 1; i >= 0; i--) pts.push({ x: -hw, y: hj * i / nJ, nx: -1, ny: 0 });
  pts[0].y = -5; pts[pts.length - 1].y = -5;      // feet run below the sloping sill
  let s = 0; pts[0].s = 0;
  for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); pts[i].s = s; }
  return pts;
}
// rank layout of a chamber: row centres and edges (lateral), jars per rank, pitch along d
function rowsOf(sec) {
  const great = sec.kind === 'great';
  const n = great ? 7 : 4, pitch = (sec.d1 - sec.d0 - WALL_T) / n;
  return great ? { xs: [29, 35, 41], edges: [24.5, 32, 38, sec.W], n, pitch, step: 5.2 }
    : { xs: [16.5, 22.5, 28.5], edges: [12.5, 19.5, 25.5, sec.W], n, pitch, step: 5.2 };
}
function padTop(L, sec, j, r) {
  const R = rowsOf(sec), dc = sec.d0 + WALL_T / 2 + (j + 0.5) * R.pitch;
  return L.floorY(dc) + Math.abs(sec.slope) * R.pitch * 0.5 + 0.6 + r * R.step;
}
function padTopAtX(L, sec, j, x) {
  if (sec.kind === 'firebox') return L.floorY(sec.d0);
  const R = rowsOf(sec), ax = Math.abs(x);
  if (ax < R.edges[0]) return L.floorY(sec.d0 + WALL_T / 2 + (j + 0.5) * R.pitch) + 0.3;
  return padTop(L, sec, j, ax < R.edges[1] ? 0 : ax < R.edges[2] ? 1 : 2);
}

function buildVault(G, L, sec, noise) {
  const nR = sec.kind === 'great' ? 17 : 9, nC = 31, base = G.count, p = { x: 0, y: 0 }, q = { x: 0, y: 0 };
  for (let r = 0; r < nR; r++) {
    const t = r / (nR - 1), d = lerp(sec.d0, sec.d1, t), sw = L.swell(sec, d), f = L.floorY(d);
    const d2 = d + 0.5, sw2 = L.swell(sec, d2), f2 = L.floorY(Math.min(d2, sec.d1)) + (d2 > sec.d1 ? sec.slope * (d2 - sec.d1) : 0);
    const soot = sec.kind === 'firebox' ? 0.9 : 0.5 + 0.5 * Math.pow(Math.sin(Math.PI * t), 0.5);
    for (let c = 0; c < nC; c++) {
      const th = Math.PI * c / (nC - 1);
      vaultXY(sec.W * sw, sec.H * sw, th, p);
      // normal from two tangents (across and along), pointing in
      vaultXY(sec.W * sw, sec.H * sw, clamp(th + 0.02, 0, Math.PI), q); let ax = q.x - p.x, ay = q.y - p.y;
      vaultXY(sec.W * sw, sec.H * sw, clamp(th - 0.02, 0, Math.PI), q); ax -= q.x - p.x; ay -= q.y - p.y;
      vaultXY(sec.W * sw2, sec.H * sw2, th, q); const bx = q.x - p.x, by = q.y + f2 - p.y - f, bz = -0.5;
      let nx = ay * bz - 0 * by, ny = 0 * bx - ax * bz, nz = ax * by - ay * bx;
      if (nx * -p.x + ny * (sec.H * 0.3 - p.y) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const l = Math.hypot(nx, ny, nz) || 1;
      const tint = soot * (0.86 + 0.28 * (0.5 + 0.5 * noise.n3(p.x * 0.05, (p.y + f) * 0.05, d * 0.05)));
      G.v(p.x, p.y + f, -d, nx / l, ny / l, nz / l, (th - Math.PI / 2) * sec.W * 0.95, d, 0, Math.pow(Math.sin(th), 2), tint, tint, tint);
    }
  }
  G.grid(base, nR, nC);
}

// one flame wall: two faces between the vault outline and the arch, the arch's inner surface, a raised
// ring of arch bricks on each face, and painted flame ports. Collects port and arch data for the flames.
function buildWall(G, L, w, ports, sides = [1, -1]) {
  const N = 28, AP = archPath(w.archW, w.archH, N), p = { x: 0, y: 0 }, f = w.f;
  const RING = 2.0, PROUD = 0.7;
  for (const side of sides) {              // +1: downhill face (normal +z), -1: uphill face (normal -z)
    const z = -w.d + side * WALL_T / 2, base = G.count;
    for (let i = 0; i <= N + 2; i++) {
      const k = clamp(i - 1, 0, N), a = AP[k], drop = (i === 0 || i === N + 2) ? -6 : 0;
      const th = Math.PI * k / N; vaultXY(w.W, w.H, th, p);
      const ox = a.x + a.nx * (RING + 0.5), oy = a.y + a.ny * (RING + 0.5);
      G.v(ox, f + oy + drop, z, 0, 0, side, ox, f + oy + drop, 1, 0.12);
      G.v(p.x, f + p.y + drop, z, 0, 0, side, p.x, f + p.y + drop, 1, 0);
    }
    for (let i = 0; i < N + 2; i++) { const a = base + i * 2; if (side > 0) G.quad(a, a + 1, a + 3, a + 2); else G.quad(a, a + 2, a + 3, a + 1); }
    // ring of arch bricks, standing proud of the face
    const rb = G.count, zp = z + side * PROUD;
    for (let i = 0; i <= N; i++) {
      const a = AP[i], drop = 0;
      G.v(a.x, f + a.y + drop, zp, 0, 0, side, a.s, 0, 1, 1.0);
      G.v(a.x + a.nx * RING, f + a.y + a.ny * RING, zp, 0, 0, side, a.s, RING, 1, 0.35);
      G.v(a.x + a.nx * RING, f + a.y + a.ny * RING, zp, a.nx * 0.7, a.ny * 0.7, side * 0.7, a.s, RING, 1, 0.3);
      G.v(a.x + a.nx * (RING + 0.5), f + a.y + a.ny * (RING + 0.5), z, a.nx * 0.7, a.ny * 0.7, side * 0.7, a.s, RING + 0.9, 1, 0.12);
    }
    for (let i = 0; i < N; i++) {
      const a = rb + i * 4, b = a + 4;
      if (side > 0) { G.quad(a, a + 1, b + 1, b); G.quad(a + 2, a + 3, b + 3, b + 2); } else { G.quad(a, b, b + 1, a + 1); G.quad(a + 2, b + 2, b + 3, a + 3); }
    }
    // painted flame ports at terrace level
    if (!ports) continue;
    const sec = side > 0 ? w.down : w.up, R = sec.kind === 'firebox' ? null : rowsOf(sec), j = side > 0 ? (R ? R.n - 1 : 0) : 0;
    for (const sx of [1, -1]) for (let i = 0; i < 7; i++) {
      const x = sx * (13.2 + 2.9 * i);
      if (Math.abs(x) + 1.4 > sec.W * 0.93 || Math.abs(x) - 1.25 < w.archW + 2.6) continue;
      let y = side > 0 ? padTopAtX(L, w.up, 0, x) : padTopAtX(L, sec, j, x);
      if (sec.kind === 'firebox') { if (i > 0) continue; y = f + 0.4; }
      const hw = 1.25, hh = 3.7, zq = z + side * 0.08, s = ports.length * 0.37;
      const A = [x - hw, y, zq], B = [x + hw, y, zq], C = [x + hw, y + hh, zq], D = [x - hw, y + hh, zq];
      if (side > 0) flatQuad(G, A, B, C, D, 5, s, [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      else { flatQuad(G, B, A, D, C, 5, s, [1, 1, 1], [[1, 0], [0, 0], [0, 1], [1, 1]]); ports.push({ x, y, d: w.d + WALL_T / 2, wall: w.index }); }
    }
  }
  // inner surface of the arch, from proud face to proud face
  const ib = G.count, z0 = -w.d + WALL_T / 2 + PROUD, z1 = -w.d - WALL_T / 2 - PROUD;
  for (let i = 0; i <= N; i++) {
    const a = AP[i];
    G.v(a.x, f + a.y, z0, -a.nx, -a.ny, 0, a.s, 0, 1, 1.0);
    G.v(a.x, f + a.y, (z0 + z1) / 2, -a.nx, -a.ny, 0, a.s, (z0 - z1) / 2, 1, 0.55);
    G.v(a.x, f + a.y, z1, -a.nx, -a.ny, 0, a.s, z0 - z1, 1, 0.25);
  }
  G.grid(ib, N + 1, 3);
}

// aisle ramp and the sand terraces of one section
function buildFloor(G, L, sec, rng) {
  if (sec.kind === 'firebox') {
    const base = G.count;
    for (let r = 0; r <= 4; r++) for (let c = 0; c <= 4; c++) {
      const x = lerp(-sec.W, sec.W, c / 4), d = lerp(-1.5, sec.d1, r / 4);
      G.v(x, 0, -d, 0, 1, 0, x, d, 2, 0.5, 0.2, 0.15, 0.12);
    }
    G.grid(base, 5, 5); return;
  }
  const R = rowsOf(sec), e0 = R.edges[0] + 0.6, nR = sec.kind === 'great' ? 25 : 13, base = G.count;
  const sl = sec.slope, nl = Math.hypot(1, sl), wDown = L.walls.find((w) => w.up === sec);
  for (let r = 0; r < nR; r++) for (let c = 0; c < 7; c++) {
    const x = lerp(-e0, e0, c / 6), d = lerp(sec.d0, sec.d1, r / (nR - 1)), t = 0.86 + 0.2 * rng();
    // the fire pours through the head of each arch: a pool of its light lies on the aisle under it, shadow between
    const del = Math.min(d - sec.d0, sec.d1 - d), pool = 0.8 * Math.exp(-del * del / 42) * Math.exp(-x * x / 150);
    G.v(x, L.floorY(d), -d, 0, 1 / nl, sl / nl, x, d, 2, pool, t, t, t);
  }
  G.grid(base, nR, 7);
  for (const sx of [1, -1]) for (let j = 0; j < R.n; j++) for (let r = 0; r < 3; r++) {
    const thru = j === 0 && !!wDown && wDown.archW > R.edges[0];       // where a wall's arch is wider than the aisle the terraces run on through it
    const xa = R.edges[r] * sx, xb = (R.edges[r + 1] + 1) * sx, da = sec.d0 + WALL_T / 2 + j * R.pitch - (j === 0 ? 1 : 0) - (thru ? WALL_T - 1.2 : 0), db = sec.d0 + WALL_T / 2 + (j + 1) * R.pitch + (j === R.n - 1 ? 1 : 0);
    const y = padTop(L, sec, j, r), t = 0.82 + 0.26 * rng(), col = [t, t * (0.96 + 0.06 * rng()), t * (0.92 + 0.1 * rng())];
    const pa = j === 0 ? 0.85 : 0, pb = j === 0 ? 0.12 : 0;
    // top (counter-clockwise seen from above)
    const A = [xa, y, -da], B = [xb, y, -da], C = [xb, y, -db], D = [xa, y, -db];
    if (sx > 0) flatQuad(G, A, B, C, D, 2, [pa, pa, pb, pb], col); else flatQuad(G, B, A, D, C, 2, [pa, pa, pb, pb], col);
    // riser toward the aisle: a battered cut of sand
    const yl = r === 0 ? Math.min(L.floorY(da), L.floorY(db)) - 0.6 : padTop(L, sec, j, r - 1);
    const xo = xa - sx * (r === 0 ? 0.9 : 0.5), dk = [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8];
    const E = [xo, yl, -da], F = [xo, yl, -db];
    if (sx > 0) flatQuad(G, E, A, D, F, 2, [pa * 0.6, pa, pb, pb * 0.6], dk, [[xa, da], [xa + 3, da], [xa + 3, db], [xa, db]]);
    else flatQuad(G, A, E, F, D, 2, [pa, pa * 0.6, pb * 0.6, pb], dk, [[xa + 3, da], [xa, da], [xa, db], [xa + 3, db]]);
    // close the two triangular ends of the battered riser
    for (const dd of [da, db]) flatQuad(G, [xo, yl, -dd], [xa, y, -dd], [xa, yl, -dd], [xa, yl, -dd], 2, 0, dk, [[xo, yl], [xa, y], [xa, yl], [xa, yl]], [0, 0, dd === da ? 1 : -1]);
    // riser toward downhill
    if (j > 0 || thru) {
      const yd = thru ? padTop(L, wDown.down, rowsOf(wDown.down).n - 1, r) : padTop(L, sec, j - 1, r), H1 = [xa, yd, -da + 0.5], H2 = [xb, yd, -da + 0.5];
      if (sx > 0) flatQuad(G, H1, H2, B, A, 2, 0, dk, [[xa, da], [xb, da], [xb, da + 3], [xa, da + 3]]);
      else flatQuad(G, H2, H1, A, B, 2, 0, dk, [[xb, da], [xa, da], [xa, da + 3], [xb, da + 3]]);
      // the open side of that battered riser, seen from the aisle
      flatQuad(G, [xa, yd, -da + 0.5], [xa, y, -da], [xa, yd, -da], [xa, yd, -da], 2, 0, dk, [[da, yd], [da + 0.5, y], [da + 0.5, yd], [da + 0.5, yd]], [-sx, 0, 0]);
    }
  }
}

// things left on the aisle: stacks of spare setter discs, a tumbled one, wads of fireclay. All under 2.5 m, at the
// aisle's sides, so the flight line 9 m up stays clear
function buildAisleProps(G, L, sec, rng) {
  if (sec.kind === 'firebox') return;
  const great = sec.kind === 'great', n = great ? 9 : 4, half = great ? 21 : 10;
  const disc = (cx, cy, cz, r, h, tone, tilt, yaw) => {
    const N = 10, ct = Math.cos(tilt), st = Math.sin(tilt), cyw = Math.cos(yaw), syw = Math.sin(yaw), col = [tone, tone * 0.95, tone * 0.9];
    const P = (a, rr, y) => { const lx = Math.cos(a) * rr, lz = Math.sin(a) * rr, x1 = lx * ct - y * st, y1 = lx * st + y * ct; return [cx + x1 * cyw + lz * syw, cy + y1, cz - x1 * syw + lz * cyw]; };
    for (let k = 0; k < N; k++) {
      const a0 = k / N * Math.PI * 2, a1 = (k + 1) / N * Math.PI * 2, am = (a0 + a1) / 2, o = [P(am, 1, 0)[0] - cx, 0.2, P(am, 1, 0)[2] - cz];
      flatQuad(G, P(a0, r * 1.03, 0), P(a1, r * 1.03, 0), P(a1, r, h), P(a0, r, h), 4, 0, col, [[a0 * r, cy], [a1 * r, cy], [a1 * r, cy + h], [a0 * r, cy + h]], o);
      flatQuad(G, P(a0, r, h), P(a1, r, h), P(a1, r * 0.45, h * 0.86), P(a0, r * 0.45, h * 0.86), 4, 0, [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], [[a0 * r, 0], [a1 * r, 0], [a1 * r * 0.45, r * 0.55], [a0 * r * 0.45, r * 0.55]], [0, 1, 0]);
      flatQuad(G, P(a0, r * 0.45, h * 0.86), P(a1, r * 0.45, h * 0.86), P(0, 0, h * 0.86), P(0, 0, h * 0.86), 4, 0, [col[0] * 0.62, col[1] * 0.62, col[2] * 0.62], [[a0, 0], [a1, 0], [am, 1], [am, 1]], [0, 1, 0]);
    }
  };
  for (let i = 0; i < n; i++) {
    const sx = i % 2 ? 1 : -1, x = sx * rng.range(4.5, half), d = lerp(sec.d0 + 6, sec.d1 - 6, (i + rng.range(0.15, 0.85)) / n), y0 = L.floorY(d) - 0.25;
    if (great && Math.hypot(x, d - (sec.d0 + 42)) < 10) continue;                 // not under the great jar
    const kind = rng(), r = rng.range(1.5, 2.3);
    if (kind < 0.6) {                    // a stack of discs, none quite over the last
      const m = rng.int(2, 4); let y = y0;
      for (let k = 0; k < m; k++) { const h = rng.range(0.5, 0.75); disc(x + rng.range(-0.25, 0.25), y, -d + rng.range(-0.25, 0.25), r * rng.range(0.88, 1.0), h, rng.range(0.75, 1.15), 0, rng() * 6.28); y += h * 0.9; }
    } else if (kind < 0.8) {             // one flat, one leaning on it
      disc(x, y0, -d, r, 0.6, rng.range(0.8, 1.1), 0, 0);
      disc(x + sx * r * 0.9, y0 + 0.25, -d + rng.range(-0.4, 0.4), r * 0.9, 0.55, rng.range(0.8, 1.1), 0.5 * -sx, rng.range(-0.4, 0.4));
    } else {                             // a scatter of fireclay wads
      for (let k = 0; k < 6; k++) disc(x + rng.range(-2.4, 2.4), y0 - 0.1, -d + rng.range(-2.4, 2.4), rng.range(0.4, 0.75), rng.range(0.4, 0.6), rng.range(0.8, 1.25), rng.range(-0.3, 0.3), rng() * 6.28);
    }
    // shards of a waster swept aside: pale porcelain crescents lying in the sand
    const ns = rng.int(3, 7), sxh = x - sx * rng.range(2.5, 4.5);
    for (let k = 0; k < ns; k++) {
      const cx = sxh + rng.range(-2, 2), cz = -d + rng.range(-3, 3), a = rng() * 6.28, w = rng.range(0.5, 1.3), h = rng.range(0.25, 0.6), lift = rng.range(0.15, 0.5), tone = rng.range(1.0, 1.6);
      const ca = Math.cos(a) * w, sa = Math.sin(a) * w, px = -Math.sin(a) * h, pz = Math.cos(a) * h, yb = L.floorY(-cz) + 0.06;
      flatQuad(G, [cx - ca, yb, cz - sa], [cx + ca, yb, cz + sa], [cx + ca * 0.6 + px, yb + lift, cz + sa * 0.6 + pz], [cx - ca * 0.6 + px, yb + lift, cz - sa * 0.6 + pz], 4, 0, [tone, tone * 0.97, tone * 0.9], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 1, 0]);
    }
  }
}

// flue geometry constants
function flueFrame(L) {
  const a = 40 * DEG, T = new THREE.Vector3(0, L.fEnd + 16, -L.end);
  const axis = new THREE.Vector3(0, Math.sin(a), -Math.cos(a)), v = new THREE.Vector3(0, Math.cos(a), Math.sin(a));   // v: "up" across the shaft
  const half = (s) => 15 - 6 * clamp((s - 13) / 39, 0, 1);   // straight taper: the walls are flat, their courses straight
  return { T, axis, v, half, length: 64, tanA: Math.tan(a) };
}
// the ware's stair up the flue's lower wall: the inner corner of each tread, on the wall, s metres along the shaft (the first
// just inside the throat, the last some 8 m under the corbels, so that the mouth's frame stands clear over the top rank); the
// ranks stand closer and their ware is smaller as the shaft narrows
function flueStair(FL) {
  const rows = [], p = new THREE.Vector3();
  for (let s = -2; s <= 47;) {
    const h = FL.half(s), S = clamp(0.3 * h, 2.7, 4.5);
    p.copy(FL.T).addScaledVector(FL.axis, s).addScaledVector(FL.v, -h);
    rows.push({ s, h, S, y: p.y, z: p.z });
    s += 1.45 * S + 1;
  }
  return rows;
}
function buildFlue(G, L, FL) {
  {
    const h = 17.5, C = [[h, -h], [h, h], [-h, h], [-h, -h]], q = new THREE.Vector3(), pt = (c, s) => { q.copy(FL.T).addScaledVector(FL.axis, s).addScaledVector(FL.v, c[1]); return [q.x + c[0], q.y, q.z]; };
    for (let k = 0; k < 4; k++) { const a = C[k], b = C[(k + 1) % 4], sa = a[1] * FL.tanA + 0.25, sb = b[1] * FL.tanA + 0.25; flatQuad(G, pt(a, sa), pt(b, sb), pt(b, sb + 16), pt(a, sa + 16), 1, 0, [0.5, 0.5, 0.5]); }
  }
  // back wall of the top chamber around the flue's square throat
  const w = L.walls[L.walls.length - 1], sec = L.secs[L.secs.length - 1], Wb = sec.W * 0.97, Hb = sec.H * 0.97, f = L.fEnd, z = -L.end + 0.2;
  const yTop = 16 + 15 / Math.cos(40 * DEG), N = 24, p = { x: 0, y: 0 }, base = G.count;
  for (let i = 0; i <= N; i++) {
    const t = i / N; let x, y;
    if (t < 1 / 3) { x = 15; y = lerp(-8, yTop, t * 3); } else if (t < 2 / 3) { x = lerp(15, -15, t * 3 - 1); y = yTop; } else { x = -15; y = lerp(yTop, -8, t * 3 - 2); }
    vaultXY(Wb, Hb, Math.PI * t, p);
    const oy = (i === 0 || i === N) ? -8 : p.y;
    G.v(x, f + y, z, 0, 0, 1, x, f + y, 1, 0.3);
    G.v(p.x, f + oy, z, 0, 0, 1, p.x, f + oy, 1, 0);
  }
  for (let i = 0; i < N; i++) { const a = base + i * 2; G.quad(a, a + 1, a + 3, a + 2); }
  // the shaft: eight faces (chamfered square), each starting on the back wall's plane
  // (u across a wide face is the true distance from its middle, so the courses run straight while the shaft narrows)
  const nS = 14, ch = 1.6, tmp = new THREE.Vector3();
  const corner = (k, h) => {   // 8 corners of a chamfered square of half-size h, counter-clockwise
    const c = [[h, -h + ch], [h, h - ch], [h - ch, h], [-h + ch, h], [-h, h - ch], [-h, -h + ch], [-h + ch, -h], [h - ch, -h]][k % 8]; return c;
  };
  for (let k = 0; k < 8; k++) {
    const fb = G.count;
    const c0 = corner(k, 1), c1 = corner(k + 1, 1); let nx = -(c1[1] - c0[1]), ny = c1[0] - c0[0];   // inward-ish normal in (a,b)
    if (nx * c0[0] + ny * c0[1] > 0) { nx = -nx; ny = -ny; } const nl = Math.hypot(nx, ny);
    const nrm = new THREE.Vector3(nx / nl, 0, 0).addScaledVector(FL.v, ny / nl);
    for (let r = 0; r <= nS; r++) for (let e = 0; e < 2; e++) {
      const b15 = corner(k + e, 15)[1], s0 = b15 * FL.tanA;      // where this edge meets the back wall's plane
      const s = lerp(s0, FL.length, Math.pow(r / nS, 1.25)), h = FL.half(s), c = corner(k + e, h);
      tmp.copy(FL.T).addScaledVector(FL.axis, s).addScaledVector(FL.v, c[1]); tmp.x += c[0];
      G.v(tmp.x, tmp.y, tmp.z, nrm.x, nrm.y, nrm.z, k * 7.5 + (k % 2 ? e * ch * 1.4 : 15 + (e ? 1 : -1) * (h - ch)), s, 6, clamp(s / FL.length, 0, 1));
    }
    G.grid(fb, nS + 1, 2);
  }
  // the mouth: four corbelled courses step in to a square opening 15 m across, so that the portal stands in a frame
  // of brickwork whose soffits take the fire's light from below
  const STEPS = [[54.5, 8.75], [57.2, 8.3], [59.9, 7.9], [62.4, 7.5]], pt = (a, b, s) => { tmp.copy(FL.T).addScaledVector(FL.axis, s).addScaledVector(FL.v, b); return [tmp.x + a, tmp.y, tmp.z]; };
  const dn = [-FL.axis.x, -FL.axis.y, -FL.axis.z];
  let hPrev = 11.5;
  STEPS.forEach(([s0, h], j) => {
    const s1 = j < STEPS.length - 1 ? STEPS[j + 1][0] : FL.length + 1.5, sq = (hh) => [[hh, -hh], [hh, hh], [-hh, hh], [-hh, -hh]], O = sq(hPrev), I = sq(h);
    for (let k = 0; k < 4; k++) {
      const k1 = (k + 1) % 4, up0 = clamp(s0 / FL.length, 0, 1), up1 = clamp(s1 / FL.length, 0, 1);
      // soffit, facing down the shaft
      flatQuad(G, pt(O[k][0], O[k][1], s0), pt(O[k1][0], O[k1][1], s0), pt(I[k1][0], I[k1][1], s0), pt(I[k][0], I[k][1], s0), 6, up0, [1, 1, 1], [[k * 20, 0], [k * 20 + 2 * hPrev, 0], [k * 20 + 2 * hPrev, hPrev - h], [k * 20, hPrev - h]], dn);
      // the course's face, turned to the shaft's axis
      const mx = (I[k][0] + I[k1][0]) / 2, mb = (I[k][1] + I[k1][1]) / 2, want = [-mx, -mb * FL.v.y, -mb * FL.v.z];
      flatQuad(G, pt(I[k][0], I[k][1], s0), pt(I[k1][0], I[k1][1], s0), pt(I[k1][0], I[k1][1], s1), pt(I[k][0], I[k][1], s1), 6, [up0, up0, up1, up1], [1, 1, 1], [[k * 20 + j * 2.2, s0], [k * 20 + j * 2.2 + 2 * h, s0], [k * 20 + j * 2.2 + 2 * h, s1], [k * 20 + j * 2.2, s1]], want);
    }
    hPrev = h;
  });
  // the ware's stair: the hall's terraces go on up the lower wall, wall to wall. Each tread is level, from its inner corner on the
  // wall out to the corner below; each riser stands on the tread below (the first goes down behind the hall's end floor). Their
  // ends are as wide as the shaft is where they stand, so they close on the side walls (the corners behind the chamfers are hidden)
  const rows = flueStair(FL), sAt = (y, z) => (y - FL.T.y) * FL.axis.y + (z - FL.T.z) * FL.axis.z, halfAt = (y, z) => FL.half(sAt(y, z)), upAt = (y, z) => clamp(sAt(y, z) / FL.length, 0, 1);
  rows.forEach((r, k) => {
    const zf = k ? rows[k - 1].z : -L.end - 0.3, yf = k ? rows[k - 1].y : r.y - 7;
    const hb = r.h, ht = halfAt(r.y, zf), hf = halfAt(yf, zf), ub = upAt(r.y, r.z), ut = upAt(r.y, zf), uf = upAt(yf, zf);   // how far up the shaft each corner stands, as the walls beside it carry it
    // the rank that stands on this tread, as the ware's own placing has it: written into the tread's colour for its contact shade
    const pitch = 0.82 * r.S + 0.8, n = Math.floor(2 * (r.h - 0.5 * r.S - 0.9) / pitch) + 1, NO = 0.3, NT = 0.55, dep = zf + NO - r.z;
    const cq = (P, nr, ax, cols) => { const id = P.map((q, i) => G.v(q[0], q[1], q[2], nr[0], nr[1], nr[2], q[0], Math.abs(nr[1]) > 0.7 ? -q[2] : q[1], 6, ax[i], cols[i][0], cols[i][1], cols[i][2])); G.quad(id[0], id[1], id[2], id[3]); };
    const cr = n / 40, cb = pitch / 8, far = [0, 1, 0];
    // the tread, out over a nosing course that stands proud of the riser below it
    cq([[-ht, r.y, zf + NO], [ht, r.y, zf + NO], [hb, r.y, r.z], [-hb, r.y, r.z]], [0, 1, 0], [ut, ut, ub, ub], [[cr, dep / 16, cb], [cr, dep / 16, cb], [cr, 0, cb], [cr, 0, cb]]);
    cq([[-ht, r.y - NT, zf + NO], [ht, r.y - NT, zf + NO], [ht, r.y, zf + NO], [-ht, r.y, zf + NO]], [0, 0, 1], [ut, ut, ut, ut], [far, far, far, far]);
    cq([[-ht, r.y - NT, zf], [ht, r.y - NT, zf], [ht, r.y - NT, zf + NO], [-ht, r.y - NT, zf + NO]], [0, -1, 0], [ut, ut, ut, ut], [far, far, far, far]);
    // the riser, in the nosing's shade at its top
    cq([[-hf, yf, zf], [hf, yf, zf], [ht, r.y - NT, zf], [-ht, r.y - NT, zf]], [0, 0, 1], [uf, uf, ut, ut], [[0, (r.y - NT - yf) / 16, 0], [0, (r.y - NT - yf) / 16, 0], [0, 0, 0], [0, 0, 0]]);
  });
}

// burning pine splits on the firebox floor
function buildLogs(G, rng) {
  const logs = [];
  for (let i = 0; i < 7; i++) logs.push({ x: -11.5 + i * 3.8 + rng.range(-0.5, 0.5), y: 0, d: rng.range(11, 24), yaw: rng.range(-0.16, 0.16), len: rng.range(12.5, 14.5), r: rng.range(1.2, 1.6) });
  for (let i = 0; i < 5; i++) logs.push({ x: rng.range(-5, 5), y: i === 0 ? 1.5 : 0.25, d: 6 + i * 6.2 + rng.range(-1, 1), yaw: Math.PI / 2 + rng.range(-0.5, 0.5), len: rng.range(12, 14), r: rng.range(1.1, 1.4) });
  for (let i = 0; i < 2; i++) logs.push({ x: rng.range(-6, 6), y: 2.7, d: rng.range(5.5, 9.5), yaw: rng.range(-0.5, 0.5), len: rng.range(11, 13), r: rng.range(1.0, 1.2) });
  // the last armful, thrown in just inside the mouth: some end-on to the yard, some across, lying over one another
  for (let i = 0; i < 4; i++) logs.push({ x: -6.3 + i * 4.2 + rng.range(-0.8, 0.8), y: 0, d: rng.range(8.2, 9.6), yaw: rng.range(-0.3, 0.3), len: rng.range(9, 11.5), r: rng.range(1.25, 1.65) });
  for (let i = 0; i < 3; i++) logs.push({ x: rng.range(-3.5, 3.5), y: 1.5 + i * 0.5, d: 4.2 + i * 2.1 + rng.range(-0.4, 0.4), yaw: Math.PI / 2 + rng.range(0.25, 0.75) * (i % 2 ? 1 : -1), len: rng.range(9, 12), r: rng.range(1.1, 1.45) });
  for (const lg of logs) {
    const roll = rng.range(-0.5, 0.5), cs = Math.cos(lg.yaw), sn = Math.sin(lg.yaw), nSeg = 3, prof = [];
    // quarter-round split: heart edge at the origin, bark arc
    prof.push([0, 0, -0.7, -0.7]);
    for (let k = 0; k <= 3; k++) { const a = roll + (k / 3) * Math.PI * 0.6 + 0.3; prof.push([Math.cos(a) * lg.r, Math.sin(a) * lg.r, Math.cos(a), Math.sin(a)]); }
    const base = G.count, nP = prof.length + 1;
    for (let s = 0; s <= nSeg; s++) {
      const t = s / nSeg, along = (t - 0.5) * lg.len, bend = Math.sin(t * Math.PI) * rng.range(-0.25, 0.25), glow = 0.25 + 0.5 * Math.abs(t - 0.5) * 2 * rng();
      for (let k = 0; k < nP; k++) {
        const q = prof[k % prof.length], lx = q[0] - lg.r * 0.4 + bend, ly = Math.max(q[1], -0.2) + 0.2;
        G.v(lg.x + lx * cs + along * sn, lg.y + ly, -(lg.d + along * cs - lx * sn), q[2] * cs, q[3], q[2] * sn, along + lg.x * 3, k * lg.r * 0.9 + lg.d, 3, glow);
      }
    }
    G.grid(base, nSeg + 1, nP);
    for (const e of [0, nSeg]) {   // end grain, glowing
      const c0 = base + e * nP, nz = e === 0 ? 1 : -1, eb = G.count;
      for (let k = 0; k < prof.length; k++) { const i0 = c0 + k; G.v(G.p[i0 * 3], G.p[i0 * 3 + 1], G.p[i0 * 3 + 2], -nz * sn, 0, nz * cs, prof[k][0] / lg.r, prof[k][1] / lg.r, 3, 2.0); }
      for (let k = 1; k < prof.length - 1; k++) G.tri(eb, eb + k, eb + k + 1);
    }
  }
}

// ------------------------------------------------------------------------------------------------
// Jar shader: chalk -> sweat -> glaze running down from the shoulder -> gold lantern with a dark rim.
// aInfo = (axis distance d, delay in metres, kind, seed). kind 0 jar, 1 the great jar (melt = uGreat),
// 2 saggar stack, 3 the jar that collapses in the rare event (uCollapse).
// ------------------------------------------------------------------------------------------------
const JAR_VERT = /* glsl */`
attribute vec4 aInfo; attribute float aPart;
uniform float uCollapse;
varying vec3 vP; varying vec3 vN; varying vec3 vL; varying vec4 vInfo; varying float vPart; varying float vDist;
void main(){
  vec3 p = position; vec3 n = normal;
  float sd = aInfo.w;
  // two thrown bowls joined at the waist: the upper one never sits quite true
  float up = smoothstep(.44, .56, p.y)*(1.-aPart);
  float a = sd*6.2831;
  p.xz += vec2(cos(a), sin(a))*.013*up;
  p.xz *= 1.+.02*sin(a*3.)*up;
  if (aInfo.z > 2.5){
    // the waist gives way: the upper bowl tips toward +x and sinks into the lower one while the belly folds out
    // under it; then it all goes down into a low puddle that spreads over the setter and onto the sand
    float k = uCollapse*(1.-aPart);
    float sag = smoothstep(.0, .55, k), fl = smoothstep(.45, 1., k);
    float yy = p.y, upper = smoothstep(.36, .62, yy);
    float a2 = sag*.80*upper, ca = cos(a2), sa = sin(a2);
    vec2 r = vec2(p.x, yy-.47);
    r = vec2(r.x*ca+r.y*sa, -r.x*sa+r.y*ca);
    p.x = r.x; p.y = .47+r.y;
    n.xy = vec2(n.x*ca+n.y*sa, -n.x*sa+n.y*ca);
    float wq = (yy-.44)/.12;
    p.xz *= 1.+sag*.26*exp(-wq*wq)*(.55+.9*position.x);
    p.y = (p.y-sag*upper*.17)*(1.-.10*sag);
    float ang = atan(position.z, position.x+1e-5);
    float lobes = 1.+.12*sin(ang*3.+1.3)+.07*sin(ang*5.+.4);
    vec2 pf = position.xz*(1.+.25*(1.-yy))*lobes;
    float rr = length(pf);
    float py = mix(.012, -.098, smoothstep(.32, .40, rr))+yy*.05*(1.-smoothstep(.3, .56, rr));
    p = mix(p, vec3(pf.x, py, pf.y), fl);
    n = normalize(mix(n, vec3(0., 1., 0.), fl*.85)+vec3(1e-3, 0., 0.));
  }
  vL = position; vInfo = aInfo; vPart = aPart;
  vec4 lp = instanceMatrix*vec4(p, 1.);
  vP = lp.xyz;
  vN = mat3(instanceMatrix)*n;
  vec4 mv = modelViewMatrix*lp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const JAR_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
uniform float uGreat, uCollapse, uJarGlow, uDetail;
uniform sampler2D tNoise;
varying vec3 vP; varying vec3 vN; varying vec3 vL; varying vec4 vInfo; varying float vPart; varying float vDist;
void main(){
  float d = vInfo.x, kind = vInfo.z, sd = vInfo.w, t = vL.y;
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.));
  vec3 Vv = uCamL-vP; float vl = max(length(Vv), 1e-3); vec3 V = Vv/vl;
  float heat = heatAt(d);
  vec3 fc = fireCol(d);
  vec2 dir = normalize(vL.xz+vec2(1e-5, 0.));
  float n1 = vnoise(dir*2.6+sd*vec2(13., 7.)), n2 = vnoise(dir*9.+sd*vec2(5., 23.)+t*3.), n3 = vnoise(vec2(dir.x*6.+dir.y*3.5+sd*9., sd*5.));
  vec3 col;
  if (vPart > .5 || (kind > 1.5 && kind < 2.5)){
    // clay: setters and saggar stacks. Saggars go dull orange when fired, never bright
    float joint = kind > 1.5 ? smoothstep(.012, .0, abs(fract(t*4.+.5)-.5)*.25) : 0.;
    float cn = vnoise(vec2(dir.x*4.+dir.y*2.5+sd*9., t*(kind > .5 && kind < 1.5 ? 26. : 9.)));
    float cn2 = vnoise(vec2(dir.x*17.+dir.y*11., t*40.+sd*5.));
    vec3 alb = mix(uClay, vec3(.40, .29, .20), kind > 1.5 ? .7 : .45)*(.6+.5*cn+.25*cn2)*(1.-.8*joint);
    if (kind > .5 && kind < 1.5){
      // the great jar's setter drum: three courses of hand-cut clay blocks with wads of fireclay squeezed from the joints
      float cy = (t+.345)/.115, row = floor(cy), fy = fract(cy);
      float ang = atan(dir.y, dir.x)*2.228+.5*mod(row, 2.), fx = fract(ang);
      float mort = smoothstep(.0, .05, fx)*smoothstep(1., .95, fx)*smoothstep(.0, .09, fy)*smoothstep(1., .91, fy);
      float tone = .72+.5*hash21(vec2(floor(ang)+31., row));
      float chip = smoothstep(.62, .8, vnoise(vec2(ang*3.1, cy*3.7)));
      alb = mix(uClay, vec3(.40, .29, .20), .45)*(.7+.35*cn2+.2*vnoise(vec2(ang*9., cy*7.)))*tone*(.32+.68*mort)*(1.-.3*chip);
      N = normalize(N+vec3(dir.x, 0., dir.y)*(fx-.5)*.5*(1.-mort)+vec3(0., (fy-.5)*.7*(1.-mort), 0.));
    }
    col = alb*kilnLight(N, d);
    float sagg = kind > 1.5 ? .8 : .3;
    col += uOrange*heat*alb*sagg*(.55+.45*max(dot(N, V), 0.))*uFire;
  } else {
    float prog = kind > .5 && kind < 1.5 ? uGreat : clamp((uFront-d-vInfo.y+14.)/26., 0., 1.);
    // throwing rings and the seam at the waist
    float rings = sin(t*150.+n1*4.)*.5+sin(t*61.+sd*30.)*.5;
    N = normalize(N+vec3(0., rings*.045*uDetail*smoothstep(110., 30., vDist)*smoothstep(.02, .2, t), 0.));
    float seam = smoothstep(.014, .0, abs(t-.5+.004*(n2-.5)));
    float ndv = clamp(dot(N, V), 0., 1.);
    // the melt line comes down from the shoulder as glaze going wet: a soft wavering edge with a few long runs
    // drawn out below it, never teeth
    float m = smoothstep(.06, .82, prog);
    float run = smoothstep(.56, .96, n3);
    float rag = (n1-.5)*.10+(n2-.5)*.03-run*.15;
    float tl = mix(1.14, -.30, m)+rag*smoothstep(.0, .2, m);
    float wet = smoothstep(tl-.035, tl+.035, t);
    float band = smoothstep(tl-.10, tl-.02, t)*(1.-wet);
    float edge = smoothstep(tl-.012, tl+.02, t)*(1.-smoothstep(tl+.02, tl+.07, t));
    float sweat = smoothstep(.0, .12, prog)*(1.-smoothstep(.3, .6, prog));
    float glow = clamp(smoothstep(tl+.03, tl+.30, t)*smoothstep(.08, .3, prog)+smoothstep(.8, 1., prog), 0., 1.);
    // chalk
    vec3 alb = vec3(.80, .775, .735)*(.9+.12*n2)*(1.-.10*seam);
    alb *= 1.-.07*smoothstep(.3, .9, vnoise(vec2(dir.x*5.+sd*40., t*7.)));
    float coldK = (1.-heat)*smoothstep(8., 40., d-uFront-uLead);
    vec3 KL = kilnLight(normalize(N+vec3(0., .55*coldK, 0.)), d);
    KL = mix(KL, vec3(dot(KL, vec3(.3, .5, .2))), mix(.16, .42, clamp(heat+exp(-max(d-uFront-uLead, 0.)/30.), 0., 1.)));        // chalk keeps its whiteness under orange light; in the cold chambers it shows the ember red below and the violet above
    // far ahead of the front the embers on the sand and the floor ports redden the belly; the shoulder keeps the cool light
    float belly = coldK*smoothstep(.60, .10, t)*(.5+.5*max(.35-N.y, 0.));
    KL = mix(KL, KL*vec3(1., .50, .36), belly*.8)+vec3(.66, .13, .04)*belly*.6;
    KL += vec3(.95, .25, .07)*coldK*max(.12-N.y, 0.)*.6;                 // the embers on the sand light it from below: the jar's underside glows, so it stands whole on its setter
    // a raw jar is still a jar: the dark of its mouth, the shadow under its lip, the seam at the waist
    float rJ = length(vL.xz), inMouth = smoothstep(.20, .186, rJ)*step(.86, t);
    float mouthK = max(smoothstep(.925, .965, t)*smoothstep(.2, .7, N.y)*.6, inMouth*1.3), lipSh = smoothstep(.80, .90, t)*(1.-smoothstep(.90, .93, t));
    vec3 chalk = alb*KL*(1.-.3*sweat)*mix(vec3(1.), vec3(.50, .44, .40), band)*(1.-.72*mouthK)*(1.-.22*lipSh)*(1.-.78*coldK*smoothstep(.88, .915, t))*(1.-.62*coldK*smoothstep(.075, .03, t))*(1.-mix(.16, .30, coldK)*smoothstep(.03, .0, abs(t-.5)));
    // wet glaze, not yet glowing: darker, glassy
    vec3 wetc = alb*vec3(.55, .47, .38)*KL;
    vec3 body = mix(chalk, wetc, wet);
    // lantern: lit from within, darkening to red-brown at the rim, dark foot and mouth rings
    float rim = smoothstep(.0, .74, pow(1.-ndv, 1.4));
    float ends = clamp(smoothstep(.085, .03, t)+smoothstep(.915, .965, t)+inMouth*1.2, 0., 1.);
    float core = ndv*ndv;
    // heat rises: red-brown at the foot, deep orange through the belly, gold at the shoulder (the tone map turns a
    // bright orange pale, so the belly is held dim and red: the jar is never the colour of the flame behind it)
    float isGreat = step(.5, kind)*step(kind, 1.5);
    float tt = clamp(t+(n1-.5)*.14, 0., 1.);
    vec3 ramp = mix(vec3(.26, .036, .010), uOrange*vec3(.78, .50, .42), smoothstep(.04, .44, tt));
    ramp = mix(ramp, mix(uOrange, uGold, .45)*vec3(1.2, .95, .55), smoothstep(.42, .80, tt)*mix(.7, 1., isGreat));
    vec3 lamp = ramp*(.42+.5*core+.34*core*core*core)*(.84+.26*n2);
    float sh = smoothstep(.56, .80, t+(n1-.5)*.10)*(1.-smoothstep(.89, .96, t));
    lamp += uGold*vec3(1.5, 1.05, .34)*sh*core*(.25+.75*core)*mix(.16, 1.45, isGreat)*(.9+.2*n2);      // white heat at the shoulder
    lamp *= .9+.2*vnoise(vec2(dir.x*3.+dir.y*5.+sd*11., t*3.-uTime*.25));
    lamp = mix(lamp, vec3(.20, .04, .014)*.45, rim);
    lamp = mix(lamp, vec3(.16, .05, .025)*.5, ends*.9);
    lamp *= 1.-.35*seam;
    // crazing: the glaze crackles as it takes the heat, a fine net that shows dark on the lit body and grey on the chalk
    vec2 cq = vec2(dir.x*6.+t*2.+sd*9., dir.y*6.+t*9.)*mix(1.5, 1., isGreat), ci = floor(cq), cf = fract(cq);
    float m1 = 9., m2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j)), r = g+hash22(ci+g)-cf; float dd = dot(r, r);
      if (dd < m1){ m2 = m1; m1 = dd; } else if (dd < m2){ m2 = dd; }
    }
    float craze = 1.-smoothstep(.012, .07, sqrt(m2)-sqrt(m1));
    craze *= mix(.45, 1., isGreat)*smoothstep(mix(34., 80., isGreat), 12., vDist)*smoothstep(.06, .2, t)*(1.-smoothstep(.86, .95, t));
    lamp *= 1.-.24*craze; body *= 1.-.11*craze;
    float pudK = 0.;
    if (kind > 2.5){
      // over-fired: it stays an orange-gold body with its dark rim and seam while it buckles (never brighter than
      // the flame), then lies as a molten puddle with a darker crust creeping in from the edge
      float pm = vnoise(vP.xz*.9+uTime*.12)*.6+vnoise(vP.xz*2.3-uTime*.2)*.4;
      float rr = length(vL.xz)*2.;
      vec3 molten = mix(uOrange*1.1, uGold*vec3(1.9, 1.3, .42), smoothstep(.40, .78, pm)*(1.-.6*smoothstep(.25, .7, rr)));
      // the crust: dark, creeping in from the edge in plates, with the melt still showing in the cracks between them
      float cr = smoothstep(.20, .74, rr+(pm-.5)*.75);
      float crack = (1.-smoothstep(.0, .12, abs(vnoise(vP.xz*1.9+3.7)-.5)))*.55*(.5+pm);
      vec3 pud = mix(molten, mix(vec3(.10, .024, .010), uOrange*.9, crack), cr*.96);
      pudK = smoothstep(.55, 1., uCollapse);
      lamp = mix(lamp*mix(vec3(1.), vec3(1.08, .80, .55), smoothstep(.05, .5, uCollapse)), pud, pudK);
    }
    body += alb*uSkyCol*shaftPool(vP)*1.6*max(N.y*.7+.3, 0.);
    col = mix(body, lamp*uJarGlow, max(glow, pudK));
    col += uOrange*edge*.5*(1.-smoothstep(.9, 1., prog))*smoothstep(.05, .15, prog);
    // the wet coat reflects the river of flame on the crown
    vec3 R = reflect(-V, N);
    float upR = max(R.y, .08);
    vec2 rp = vec2(vP.x+R.x*24./upR, -vP.z-R.z*24./upR);
    // the same licks that run on the crown, smooth from the fire's own noise texture
    vec4 rs = textureLod(tNoise, vec2(rp.x/14.+sd, (rp.y-16.*uTime)/180.), 2.);
    vec4 rs2 = textureLod(tNoise, vec2(rp.x/36.+sd*3., (rp.y-16.*uTime)/120.), 2.);
    float rl = smoothstep(.62, .96, 1.-abs(2.*rs.r-1.))*smoothstep(.25, .6, rs2.a);
    float inband = smoothstep(19., 7., abs(rp.x))*smoothstep(.04, .2, R.y);
    vec3 env = mix(uOrange*vec3(.9, .6, .5), uGold*vec3(1.7, 1.2, .42), rl)*(.03+5.*rl*inband)*heatAt(rp.y);
    env += vec3(1., .42, .1)*(1.-heat)*exp(-max(d-uFront, 0.)/24.)*.5*max(R.z*.8+.2, 0.);
    env += uEmber*(1.-heat)*.25*max(-R.y, 0.)+uSkyCol*flueLight(d)*.6*max(R.y, 0.)*(1.-heat);
    float fres = .05+.25*pow(1.-ndv, 3.)*smoothstep(.0, .35, ndv);
    col += env*fres*1.1*wet*(1.-.5*ends)*(1.-rim*.8)*(1.-pudK);
    float sp = pow(max(dot(R, normalize(vec3(.1, .8, .55))), 0.), 90.);
    // the arch behind us and the arch ahead, each full of fire: soft tongues that slide as the fire moves
    vec4 fs = textureLod(tNoise, vec2(R.x*1.5+sd*3., R.y*.45-uTime*.07), 1.);
    float sp2 = smoothstep(.88, .99, dot(R, normalize(vec3(0., .38, 1.))))+smoothstep(.90, .99, dot(R, normalize(vec3(0., .5, -1.))))*heatAt(d+26.);
    col += uGold*vec3(1.5, 1.05, .36)*(sp*2.2*(.4+rl)+sp2*1.7*smoothstep(.46, .66, fs.r+.3*(fs.b-.5)))*wet*heat*(1.-rim)*(1.-pudK);
  }
  col = kilnHaze(col, d, vDist);
  col = sceneFog(col, vP, vDist);
  gl_FragColor = vec4(col, 1.);
}`;

// lathe: profile = [[r, y, part]], smooth normals from the profile tangent
function lathe(profile, segs) {
  const nP = profile.length, pos = [], nor = [], part = [], idx = [];
  for (let i = 0; i < nP; i++) {
    const a = profile[Math.max(0, i - 1)], b = profile[Math.min(nP - 1, i + 1)];
    let tr = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tr, ty) || 1; tr /= tl; ty /= tl;
    const nr = ty, ny = -tr;
    for (let s = 0; s <= segs; s++) {
      const th = (s / segs) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      pos.push(profile[i][0] * c, profile[i][1], profile[i][0] * sn); nor.push(nr * c, ny, nr * sn); part.push(profile[i][2] || 0);
    }
  }
  for (let i = 0; i < nP - 1; i++) for (let s = 0; s < segs; s++) {
    const a = i * (segs + 1) + s, b = a + 1, c = a + segs + 1, e = c + 1;
    if (profile[i][0] > 1e-4) idx.push(a, c, b);
    if (profile[i + 1][0] > 1e-4) idx.push(b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setIndex(idx);
  return g;
}
// moon jar profile in unit space (belly diameter 1, foot at y = 0, lip near 0.985), on its setter (y < 0)
function jarProfile(nBowl, lipDetail, setter) {
  const P = [];
  if (setter === 'drum') {          // the great jar's setter drum: 4 m tall under a 12 m jar
    P.push([0.30, -0.345, 1], [0.305, -0.33, 1], [0.30, -0.235, 1], [0.285, -0.225, 1], [0.30, -0.215, 1], [0.295, -0.12, 1], [0.28, -0.11, 1], [0.292, -0.10, 1], [0.286, -0.012, 1], [0.27, 0, 1], [0.19, 0, 1]);
  } else if (setter) {
    if (lipDetail > 1) P.push([0.33, -0.105, 1], [0.337, -0.09, 1], [0.332, -0.014, 1], [0.305, 0, 1], [0.19, 0, 1]);
    else P.push([0.335, -0.105, 1], [0.33, -0.004, 1], [0.19, 0, 1]);
  }
  if (lipDetail > 1) P.push([0.192, 0.012, 0], [0.186, 0.036, 0]); else P.push([0.188, 0.03, 0]);
  const a0 = -66.4 * DEG, a1 = 64.5 * DEG;
  for (let i = 0; i <= nBowl; i++) { const a = a0 * (1 - i / nBowl); if (i > 0 || lipDetail < 2) P.push([0.5 * Math.cos(a), 0.49 + 0.46 * Math.sin(a), 0]); else P.push([0.2, 0.068, 0]); }
  for (let i = 1; i <= nBowl; i++) { const a = a1 * (i / nBowl); P.push([0.5 * Math.cos(a) - 0.002, 0.49 + 0.45 * Math.sin(a), 0]); }
  if (lipDetail > 1) P.push([0.205, 0.918, 0], [0.204, 0.948, 0], [0.221, 0.972, 0], [0.213, 0.986, 0], [0.196, 0.976, 0], [0.186, 0.9, 0], [0, 0.885, 0]);
  else if (lipDetail > 0) P.push([0.205, 0.93, 0], [0.22, 0.975, 0], [0.195, 0.975, 0], [0, 0.9, 0]);
  else P.push([0.212, 0.975, 0], [0, 0.93, 0]);
  return P;
}
// a stack of four small bowls on a setter, each standing in the one below: the kiln's smaller ware
function bowlStackProfile() {
  const P = [[0.335, -0.105, 1], [0.33, -0.004, 1], [0.15, 0, 1]];
  for (let k = 0; k < 4; k++) {
    const y0 = k * 0.245;
    P.push([0.13, y0 + 0.004, 0], [0.15, y0 + 0.03, 0], [0.27, y0 + 0.085, 0], [0.365, y0 + 0.185, 0], [0.372, y0 + 0.215, 0], [0.345, y0 + 0.222, 0]);
    if (k < 3) P.push([0.14, y0 + 0.238, 0]); else P.push([0.13, y0 + 0.12, 0], [0, y0 + 0.105, 0]);
  }
  return P;
}
function saggarProfile() {
  const P = [[0.37, -0.105, 1], [0.375, -0.004, 1]];
  for (let k = 0; k < 4; k++) { const y0 = k * 0.25, r = 0.36 + 0.03 * ((k * 7) % 3) / 2; P.push([r, y0 + 0.012, 0], [r + 0.012, y0 + 0.238, 0]); }
  P.push([0.30, 1.0, 0], [0, 1.0, 0]);
  return P;
}

// ------------------------------------------------------------------------------------------------
// The river of flame on the crown: a volume, not sheets. The fire is a field hanging under the vault (its roof dips
// to the head of every arch and rises again beyond, so it pours through), its underside torn by flowing noise into
// lumps and tongues. A proxy surface lies along the lowest the fire can reach; from each of its fragments the shader
// marches up through the field, so the body is soft from every side and has no outline anywhere.
// ------------------------------------------------------------------------------------------------
// the fire's roof at distance d is the vault itself: centre height C and drop D of its cross-section (half-width
// Wr). Close to a flame wall the fire banks down on the axis to pour through the arch: kA is how close (1 in the
// arch), X how deep it then hangs below the roof
function riverProfileAt(L, d) {
  const sec = L.secAt(d), sw = L.swell(sec, d), Hc = sec.H * sw, C = L.floorY(d) + Hc - 0.6;
  let kA = 0, X = 0, best = 1e9;
  for (const w of L.walls) {
    const del = d - w.d, a = Math.abs(del);
    if (a < best) {       // the bank hangs to well under the arch's crown, but never to within 3 m of the flight line
      best = a; const fl = Math.max(w.f, L.floorY(d));
      X = Math.max(Math.min(C - (fl + w.archH) + 3 - Hc * RIVER_TD * 0.33, (C - fl - 12.2 - Hc * RIVER_TD * 0.35) / RIVER_BKMAX), 0);
    }
    // in the great chamber the fire comes down to the arch in a long slope, not a fall
    const reach = ((w.up.kind === 'great' && del >= 0) || (w.down.kind === 'great' && del < 0)) ? 36 : (del < 0 ? 15 : 13);
    if (a < reach + 1) kA = Math.max(kA, 1 - smoothstep(3.2, reach, a));
  }
  return { C, D: Hc, Wr: sec.W * sw, kA, X };
}
function riverRoof(pr, x) {
  const ax = Math.min(Math.abs(x) / Math.max(pr.Wr, 1), 1);
  return pr.C - pr.D * (1 - Math.pow(Math.max(1 - Math.pow(ax, 2.857), 0), 0.35));
}
const riverEnds = (L, d) => smoothstep(4, 13, d) * (1 - smoothstep(L.end - 26, L.end - 8, d));
const riverHalf = (pr) => Math.max(pr.Wr, 1) * 0.78;
// the deepest the fire can hang below its roof at (x, d): where the proxy surface lies
function riverDepth(L, pr, x, d) {
  const base = pr.D * RIVER_TD * riverEnds(L, d) * (1 - smoothstep(0.55, 1, Math.abs(x) / (Math.max(pr.Wr, 1) * 0.66))) * (1 + 0.5 * smoothstep(350, 384, d)), w = pr.kA * (1 - smoothstep(6, Math.max(pr.Wr, 1) * 0.77, Math.abs(x)));
  return (RIVER_NA - RIVER_NB) * base * (1 - 0.85 * w) + RIVER_BKMAX * pr.X * w + 0.2;
}
function buildRiverProfile(L) {
  const data = new Uint16Array(PROF_N * 4), H = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < PROF_N; i++) {
    const d = (i + 0.5) / PROF_N * PROF_LEN, pr = riverProfileAt(L, Math.min(d, L.end - 0.01));
    data[i * 4] = H(pr.C - PROF_SLOPE * d); data[i * 4 + 1] = H(pr.D); data[i * 4 + 2] = H(pr.kA); data[i * 4 + 3] = H(pr.X);
  }
  const t = new THREE.DataTexture(data, PROF_N, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
// tiling flame noise: four fields of value noise at different grains, one per channel
async function buildFlameNoise(ctx, rng) {
  const S = 256, data = new Uint8Array(S * S * 4);
  const CH = [[4, 4], [4, 4], [8, 4], [3, 3]];           // [base period, octaves] per channel
  const lat = CH.map(([base, oct]) => { const o = []; for (let k = 0; k < oct; k++) { const P = base << k, a = new Float32Array(P * P); for (let i = 0; i < a.length; i++) a[i] = rng(); o.push({ P, a }); } return o; });
  const norm = CH.map(([, oct]) => 1 / (1 - Math.pow(0.5, oct)));
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0, amp = 0.5;
        for (const o of lat[c]) {
          const fx = x / S * o.P, fy = y / S * o.P, ix = Math.floor(fx), iy = Math.floor(fy);
          let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
          const x1 = (ix + 1) % o.P, y1 = (iy + 1) % o.P, A = o.a;
          sum += amp * ((A[iy * o.P + ix] * (1 - tx) + A[iy * o.P + x1] * tx) * (1 - ty) + (A[y1 * o.P + ix] * (1 - tx) + A[y1 * o.P + x1] * tx) * ty);
          amp *= 0.5;
        }
        data[(y * S + x) * 4 + c] = Math.round(255 * clamp((sum * norm[c] - 0.5) * 1.5 + 0.5, 0, 1));
      }
    }
    await ctx.yield();       // every row
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
const RIVER_VERT = /* glsl */`
attribute vec4 aSec;
varying vec3 vP; varying float vDist; varying vec4 vSec;
void main(){
  vP = position; vSec = aSec;
  vec4 mv = modelViewMatrix*vec4(position, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const RIVER_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
uniform sampler2D tProf, tNoise;
uniform vec4 uWall[13];          // every flame wall: d, sill height, arch half-width, height of the arch's springing
uniform vec3 uWH; uniform vec2 uSecD;   // width over height of the vault in the firebox, chambers 1-7, chambers 8-12
uniform float uRiver, uSteps, uRiverEnd;
varying vec3 vP; varying float vDist; varying vec4 vSec;
void main(){
  vec3 ro = vP;
  vec3 rdv = vP-uCamL; vec3 rd = rdv/max(length(rdv), 1e-3);
  float d0 = -ro.z, dd = -rd.z;
  float dds = abs(dd) < 1e-4 ? 1e-4 : dd;
  // the sine of the ray's angle with the sloping roof
  float c1 = textureLod(tProf, vec2((d0+5.)/${PROF_LEN}., .5), 0.).r, c0 = textureLod(tProf, vec2((d0-5.)/${PROF_LEN}., .5), 0.).r;
  float sl = (c1-c0)*.1+${PROF_SLOPE};
  float sinA = abs(dot(rd, normalize(vec3(0., 1., sl))));
  // how far the ray can run inside the fire: from its underside up to the vault, at the angle it climbs
  vec4 p0 = textureLod(tProf, vec2(d0/${PROF_LEN}., .5), 0.);
  float wr0 = max(p0.g*(d0 < uSecD.x ? uWH.x : (d0 < uSecD.y ? uWH.y : uWH.z)), 1.);
  float h0 = p0.r+${PROF_SLOPE}*d0-p0.g*(1.-pow(max(1.-pow(min(abs(ro.x)/wr0, 1.), 2.857), 0.), .35))-ro.y;
  float Lm = clamp((max(h0, 0.)+3.)/max(sinA, .07), 14., 160.);
  // nothing ahead of the front burns: leave at once
  if (min(d0, d0+dd*Lm) > uFront+uLead+30.){ gl_FragColor = vec4(0.); return; }
  // a flame wall stops the ray unless it passes through the arch. The opening is convex, so the ray is clear of
  // the wall when it is inside the opening at both faces; if it leaves between them it has met the arch's soffit
  float tEnd = Lm;
  for (int k = 0; k < 13; k++){
    vec4 w = uWall[k];
    float ta = (w.x-3.2-d0)/dds, tb = (w.x+3.2-d0)/dds;
    float tn = max(min(ta, tb), 0.), tf = max(ta, tb);
    if (tf > 0. && tn < tEnd){
      vec3 qn = ro+rd*tn, qf = ro+rd*tf;
      float xn = abs(qn.x), xf = abs(qf.x);
      float gn = max(xn-w.z, qn.y-(w.y+w.w+sqrt(max(w.z*w.z-xn*xn, 0.))));
      float gf = max(xf-w.z, qf.y-(w.y+w.w+sqrt(max(w.z*w.z-xf*xf, 0.))));
      if (gn > 0.) tEnd = tn;
      else if (gf > 0.) tEnd = min(tEnd, tn+(tf-tn)*(-gn)/max(gf-gn, 1e-4));
    }
  }
  // each piece of the river answers only for its own stretch of the kiln (the next piece, or the cap that stands in
  // the arch between the two, takes the sight line on from the wall's middle), so no stretch is ever counted twice
  vec2 rg = dds > 0. ? vSec.xy : vSec.zw;
  tEnd = min(tEnd, max(((dds > 0. ? rg.y : rg.x)-d0)/dds, 0.));
  float span = max(min(Lm, tEnd), 3.);
  float jit = mix(.5, hash21(gl_FragCoord.xy*.7313+3.1), .7);
  float lod = clamp(log2(max(vDist*.02, 1.)), 0., 3.);
  vec3 acc = vec3(0.), accM = vec3(0.); float A = 0., At = 0., cAcc = 0.;
  for (int i = 0; i < 32; i++){
    if (float(i) >= uSteps) break;
    // short steps first, where the fire is seen sharpest, longer ones deeper in
    float u0 = (float(i)+jit)/uSteps;
    float t = span*pow(u0, 1.25), ds = span*1.25*pow(max(u0, 1e-3), .25)/uSteps;
    if (t > tEnd) break;
    vec3 p = ro+rd*t;
    float d = -p.z;
    vec4 pr = textureLod(tProf, vec2(d/${PROF_LEN}., .5), 0.);
    float wr = max(pr.g*(d < uSecD.x ? uWH.x : (d < uSecD.y ? uWH.y : uWH.z)), 1.), ax = abs(p.x)/wr;
    float sh = pow(max(1.-pow(min(ax, 1.), 2.857), 0.), .35);
    float h = pr.r+${PROF_SLOPE}*d-pr.g*(1.-sh)-p.y;                 // depth below the vault
    if (h < -2.5) break;
    float ends = smoothstep(4., 13., d)*(1.-smoothstep(uRiverEnd-26., uRiverEnd-8., d));
    float base = pr.g*${RIVER_TD}*ends*(1.-smoothstep(.55, 1., ax/.66))*(1.+.5*smoothstep(350., 384., d));
    float w = pr.b*(1.-smoothstep(6., wr*.77, abs(p.x)));            // 1 on the axis close to a flame wall
    float Hm = ${(RIVER_NA - RIVER_NB).toFixed(3)}*base*(1.-.85*w)+${RIVER_BKMAX.toFixed(4)}*pr.a*w+.2;
    if (h > Hm+1.6 && i > 1) break;                                   // out through the underside
    float lead = 1.-smoothstep(uFront+uLead-22., uFront+uLead+28., d);            // 0 at the tips of the front, 1 well behind it
    if (lead < .004 || Hm < .25) continue;
    float lodi = lod+clamp(log2(max(ds*.7, 1.)), 0., 3.);
    // what hangs lower lags behind: the whole field leans back with depth, so that from the side the fire is long
    // licks streaming up under the vault and never a curtain of upright streaks
    float hh = max(h, 0.);
    float fl = d-16.*uTime+hh/max(Hm, 1.)*25.;
    // the river wanders under the crown: its licks swing from side to side as they climb, and the swing itself creeps
    // uphill, so that seen from below they are bent tongues and never straight rays out of the arch head
    float mx = p.x+4.6*sin(d*.083+1.9*sin(d*.029+1.3)-uTime*.33)+2.1*sin(d*.23+p.x*.05-uTime*.9)+hh*.35*sin(d*.11+2.);
    vec4 s1 = textureLod(tNoise, vec2(mx/36.+hh*.011, fl/120.), lodi);
    // the licks: the fire is not a layer but separate tongues drawn out along the flow, eleven times longer than
    // they are wide, wandering as they go, with the bare vault dark between them
    vec4 s3 = textureLod(tNoise, vec2(mx/15.+(s1.g-.5)*.42-hh*.007, (fl-5.*uTime)/118.), min(lodi, 3.));
    float ridge = 1.-abs(2.*s3.r-1.);
    vec4 s2 = textureLod(tNoise, vec2(mx/15.6+s1.g*.09+hh*.045, fl/41.-uTime*.07), lodi);
    float nb = mix(s1.a, s1.r, smoothstep(.1, .7, lead));
    float lk = smoothstep(.30, .86, ridge);                         // 1 along a lick's spine, 0 between two licks
    // a lick is whole along its spine and torn into lengths: where the big noise falls it breaks off in a tip
    float tear = smoothstep(.12, .44, nb+.30*(s2.r-.5)+.14*lk);
    float lkB = smoothstep(.58, .89, ridge);                // broader: the tongues that go under an arch
    float nt = clamp(.5*nb+1.5*(s2.r-.5)+.25, 0., 1.3);
    // at the front the leading tongues are drawn out long and hang lowest
    float tipK = smoothstep(.0, .25, lead)*(1.-smoothstep(.35, .8, lead));
    float hbL = base*.66*lk*tear*(.55+.9*s2.g)*(1.+.45*tipK);
    float hbB = pr.a*w*(${RIVER_BK0}+${RIVER_BK1}*nt)*smoothstep(0., .5, lead)*(.8+.2*lkB)*mix(.88, 1., tear);
    float hb = min(hbL*(1.-.85*w)+hbB, Hm);
    if (hb < .08) continue;
    // near an arch the fire leaves the vault and dives as a layer a few metres thick: nothing hangs from the crown
    float hTop = max(hbB-(3.6+3.2*s2.g), 0.)*smoothstep(.15, .6, w);
    float rr = clamp((hh-hTop)/max(hb-hTop, .5), -1., 3.);                                                 // 0 against the vault, 1 at the lick's underside
    float edge = rr+(s2.b-.5)*1.3*smoothstep(.15, 1., rr);          // the underside is a torn skin
    float rho = (1.-smoothstep(.50, 1.10, edge))*smoothstep(-.9, .45, rr)*smoothstep(-.3, .7, h)*smoothstep(0., .14, lead)*smoothstep(.7, 2.4, hb);
    // a dim red mantle under each lick: the fire thins out into the air below it instead of ending at its torn skin
    // (fading out as it banks down to an arch: there the layer's own underside is its edge)
    float man = (1.-smoothstep(.55, 2.3, edge))*smoothstep(-.9, .45, rr)*smoothstep(-.3, .7, h)*smoothstep(0., .14, lead)*smoothstep(.7, 2.4, hb)*.2*(1.-w);
    float rt = max(rho, man);
    if (rt < .003) continue;
    float fg = frontGlow(d);
    // dark red where the fire is thin (its edges, its torn tips), saturated orange through the body, amber where it
    // is deepest, and white-gold only in a thin thread along the spine of a lick, deep inside it
    float thick = clamp(hb/mix(3.5, 8., w), 0., 1.), inner = clamp(1.-edge, 0., 1.);
    float temp = thick*(.18+.82*inner)*(.6+.6*s2.g)*(.45+.55*lead)*(.4+.6*tear);
    vec3 e = mix(vec3(.30, .022, .004), uOrange*vec3(.74, .46, .40)*1., smoothstep(.04, .40, temp));
    e = mix(e, uOrange*vec3(1.05, .86, .9), smoothstep(.62, 1., temp)*.5);
    float core = smoothstep(.86, 1., ridge)*smoothstep(.0, .35, inner)*tear*smoothstep(.1, .5, lead)*smoothstep(.38, .62, s1.b);
    e = mix(e, uGold*vec3(1.5, 1.05, .34), core*.5);
    // salt and ash: where the fire thins at its tips it burns blue-green
    float salt = smoothstep(.62, .80, s1.b)*(1.-smoothstep(.04, .26, temp))*(1.-.5*lead)*smoothstep(.7, 1., rr);
    e = mix(e, vec3(.03, .44, .42), salt*.8);
    // long fibres drawn out along the flow, so that a still shows which way the fire runs
    vec4 s4 = textureLod(tNoise, vec2(mx/6.2+(s1.g-.5)*.5, (fl-9.*uTime)/58.), min(lodi, 2.5));
    // and finer ones, which carry the fire's grain when it is seen from close by
    vec4 s5 = textureLod(tNoise, vec2(mx/2.3+(s1.g-.5)*.7+hh*.02, (fl-14.*uTime)/17.), min(lodi, 2.));
    e *= (1.+.45*fg*(1.-lead*.5))*(.62+.55*s2.g)*mix(.42+1.2*s4.r, .72+.6*s4.r, .7*w)*(.66+.68*s5.b);
    // the mantle glows and covers what lies behind the fire, but it never veils the fire: the body is summed against
    // its own cover alone (A), as if there were no mantle; the mantle's glow and the cover of the room against both (At)
    float a = rho < .003 ? 0. : 1.-exp(-rho*.32*ds), at = 1.-exp(-rt*.32*ds);
    accM += (1.-At)*(at-a)*vec3(.42, .07, .012)*(.7+.6*s2.g); At += (1.-At)*at;
    cAcc += (1.-A)*a*core*(1.+.3*fg);
    acc += (1.-A)*a*e; A += (1.-A)*a;
    if (A > .97) break;
  }
  // seen from close under it the fire must keep its colour and its licks instead of burning out to a white cloud
  float lm = dot(acc, vec3(.3, .55, .15));
  float nearK = 1.-smoothstep(16., 52., vDist);
  acc /= 1.+(1.05+.9*nearK)*max(lm-.62+.2*nearK, 0.);
  // the white-gold thread along a lick's spine is laid over the held-down body: the one thing in the fire that burns out to white
  acc += uGold*vec3(1.9, 1.3, .42)*min(cAcc, 1.)*(1.25-.45*nearK);
  acc += accM;
  vec3 fa = sceneFog(vec3(0.), vP, vDist), fb = sceneFog(vec3(1.), vP, vDist);
  acc = acc*(fb-fa)+fa*At;
  gl_FragColor = vec4(acc*uRiver, At*.92);
}`;
// the proxy: the lowest the fire can hang, one piece per section so that the pieces draw far to near
function buildRiverProxy(L, sec) {
  const pos = [], idx = [], nC = 17, d0 = Math.max(sec.d0, 4), d1 = Math.min(sec.d1, L.end - 7), nR = Math.max(2, Math.ceil((d1 - d0) / 2) + 1);
  for (let r = 0; r < nR; r++) {
    const d = lerp(d0, d1, r / (nR - 1)), pr = riverProfileAt(L, Math.min(d, L.end - 0.01)), hw = riverHalf(pr);
    for (let c = 0; c < nC; c++) { const x = ((c / (nC - 1)) * 2 - 1) * hw; pos.push(x, riverRoof(pr, x) - riverDepth(L, pr, x, d), -d); }
  }
  for (let r = 0; r < nR - 1; r++) for (let c = 0; c < nC - 1; c++) { const a = r * nC + c; idx.push(a, a + 1, a + nC, a + 1, a + nC + 1, a + nC); }
  const lo = sec.d0 <= 0 ? -20 : sec.d0, hi = sec.d1 >= L.end - 0.01 ? L.end + 40 : sec.d1;
  return riverGeo(pos, idx, [lo, hi, lo, hi]);
}
// aSec: the stretch of the kiln (d from, d to) a piece answers for, for sight lines going uphill and going downhill
function riverGeo(pos, idx, sec4) {
  const g = new THREE.BufferGeometry(), n = pos.length / 3, a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set(sec4, i * 4);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSec', new THREE.Float32BufferAttribute(a, 4));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}
// a cap in the head of an arch: the part of the opening that lies above the lowest the fire can hang there. A sight
// line that passes through the arch inside the fire starts its march here, into whichever chamber lies ahead of it
function buildRiverCap(L, k) {
  const w = L.walls[k], lo = L.secs[k], hi = L.secs[k + 1], pr = riverProfileAt(L, w.d), pos = [], idx = [], nC = 17, hj = w.archH - w.archW;
  for (let c = 0; c < nC; c++) {
    const x = ((c / (nC - 1)) * 2 - 1) * (w.archW - 0.05), roof = riverRoof(pr, x);
    const top = Math.min(w.f + hj + Math.sqrt(Math.max(w.archW * w.archW - x * x, 0)), roof), bot = Math.min(roof - riverDepth(L, pr, x, w.d) - 0.25, top);
    pos.push(x, bot, -w.d, x, top, -w.d);
  }
  for (let c = 0; c < nC - 1; c++) { const a = c * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  return riverGeo(pos, idx, [w.d, hi.d1 >= L.end - 0.01 ? L.end + 40 : hi.d1, lo.d0 <= 0 ? -20 : lo.d0, w.d]);
}

// aFl = (d for gating, seed, type, gain). type 0 floor-port fountain, 1 tongue pouring through an arch,
// 2 always burning (firebox, fire mouth), 3 spy-hole jet (uJets), 4 the collapse burst (uCollapse),
// 5 and 6 the two pine splits thrown in through stoke ports (uLogs), 7 a spark thrown up by the collapse
// (aAxis = its velocity), 8 a wide curtain of fire, always burning (the bed of the firebox).
// Every tongue is three quads: a core and two wider, lower skirts set a little to either side and nearer the eye,
// each with its own noise, so that a flame is a soft body with depth and not one cut-out.
const FLAME_VERT = /* glsl */`
attribute vec3 aPos; attribute vec3 aAxis; attribute vec2 aSize; attribute vec4 aFl;
uniform float uFront, uTime, uJets, uCollapse, uInside; uniform vec2 uLogs; uniform vec3 uCamL;
uniform vec4 uLogP0, uLogP1; uniform vec3 uLogA0, uLogA1, uLogX0, uLogX1;
varying vec2 vQ; varying vec4 vFl; varying float vHot; varying float vGain; varying float vDist; varying vec3 vP; varying float vLy; varying float vCurt; varying float vAir;
float heatAt(float d){ return smoothstep(uFront+8., uFront-22., d); }
void main(){
  float d = aFl.x, ty = aFl.z, ly = position.z, sd = aFl.y+ly*.371;
  float hot = heatAt(d), gain = aFl.w, hs = 1.;
  float x = (d-uFront+6.)/20.; float fg = exp(-x*x);
  vec3 base = aPos, axis = aAxis; vAir = 0.;
  if (ty < .5){ hs = mix(.36, 1., hot)*(1.+.55*fg)*(.80+.28*sin(uTime*(1.1+1.7*fract(sd*5.3))+sd*40.))*(.62+.7*fract(aFl.y*9.7)); gain *= mix(.6, 1., hot); }
  else if (ty < 1.5){ gain *= smoothstep(0., .5, hot); hs = .6+.4*hot+.5*fg; }
  else if (ty < 2.5){ hot = 1.; hs = .88+.16*sin(uTime*(1.3+fract(sd*3.1))+sd*23.); gain *= mix(1., smoothstep(6.5, 10., abs(aPos.x)), smoothstep(0., .3, uInside)); }
  else if (ty < 3.5){ gain *= uJets*(.5+.5*hot); hs = .7+.3*hot; hot = 1.; }
  else if (ty < 4.5){ gain *= smoothstep(.28, .46, uCollapse)*(1.-smoothstep(.62, 1., uCollapse)); hot = 1.; hs = .5+uCollapse; }
  else if (ty < 6.5){
    // a thrown split's fire is on the split while it falls and streams back the way it came (uLogP = where the fire is
    // rooted and, in w, how far the split is still in the air; uLogA = the way the fire streams; uLogX = the split's
    // own length); landed, it stands where the split lies. A type with a fraction is a tongue rooted along the
    // split's length (aAxis.x, in metres from its middle) that burns only in the air
    vec4 lp = ty < 5.5 ? uLogP0 : uLogP1; float lg = ty < 5.5 ? uLogs.x : uLogs.y, tr = step(.1, fract(ty));
    gain *= lg*mix(1., lp.w, tr); hot = 1.; hs = .35+.65*lg;
    base = lp.xyz+(ty < 5.5 ? uLogX0 : uLogX1)*(aAxis.x*tr); axis = ty < 5.5 ? uLogA0 : uLogA1; vAir = lp.w;
  }
  else if (ty < 7.5){
    float k = clamp((uCollapse-.30)/.70, 0., 1.), tt = k*2.4;
    base = aPos+aAxis*tt-vec3(0., 4.4*tt*tt, 0.);
    base.y = max(base.y, aPos.y-3.2);
    gain *= smoothstep(0., .05, k)*(1.-smoothstep(.6, 1., k))*step(ly, .5);
    axis = vec3(0., 1., 0.); hot = 1.;
  }
  else if (ty < 8.5){ hot = 1.; gain *= 1.-uInside; }
  else { hot = 1.; gain *= step(ly, .5); }
  float wl = (1.+.55*ly)*(ty < 2.5 ? .78+.5*fract(aFl.y*4.3) : 1.)*(1.-.4*vAir), hl = 1.-.2*ly;      // (a split's fire is narrower in the air)
  if (ty > 1.5 && ty < 2.5) wl *= mix(1., .58, smoothstep(0., .3, uInside));      // from inside, the bed's fire stands as separate tongues
  if (ty > 8.5){ wl = 1.+1.7*position.y; hl = 1.; hs = 1.; }
  float off = (ly < .5 ? 0. : (ly < 1.5 ? -.26 : .26))*aSize.x*(ty > 6.5 ? 0. : 1.);
  vec3 toCam = uCamL-base; float tl = max(length(toCam), 1e-3);
  if (ty > 3.5 && ty < 4.5){
    // the burst over the jar that folds is looked down on: its card would lie open to the eye, so it turns to face
    // the eye as the view steepens, and thins
    vec3 td = toCam/tl; float steep = smoothstep(.30, .72, abs(td.y));
    vec3 ax2 = axis-td*dot(td, axis)*steep; float al = length(ax2);
    axis = al > 1e-3 ? ax2/al : axis;
    gain *= 1.-.45*steep;
  }
  vec3 rt = cross(axis, toCam); float rl = length(rt); rt = rl > 1e-4 ? rt/rl : vec3(1., 0., 0.);
  vec3 p = base+rt*(position.x*aSize.x*wl+off)+axis*(position.y*aSize.y*hs*hl)+toCam/tl*(ly*.45*step(ty, 8.5));
  if (gain < .01) p = aPos;
  vQ = position.xy; vFl = aFl; vHot = hot; vGain = gain; vP = p; vLy = ly; vCurt = ty > 7.5 ? aSize.x/max(aSize.y, 1e-3) : 0.;
  vec4 mv = modelViewMatrix*vec4(p, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const FLAME_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
varying vec2 vQ; varying vec4 vFl; varying float vHot; varying float vGain; varying float vDist; varying vec3 vP; varying float vLy; varying float vCurt; varying float vAir;
void main(){
  float ty = vFl.z, sd = vFl.y+vLy*.371, x = clamp(vQ.x, -.5, .5)*2., y = clamp(vQ.y, 0., 1.), I, T;      // clamped for multisampling (pow of y below)
  if (ty > 8.5){
    // a shaft of cold light from a spy hole: dust and smoke drifting through it
    float inFlue = step(uFlueD+10., vFl.x);                          // the two slants inside the flue carry their light right across the shaft
    float across = exp(-x*x*4.2)*(1.-x*x), along = smoothstep(0., .05, y)*(1.-smoothstep(mix(.5, .86, inFlue), 1., y))*(1.-mix(.45, .2, inFlue)*y);
    float dust = .5+.95*fbm3(vec2(x*2.2+sd*9., y*13.-uTime*.3))*(.6+.6*vnoise(vec2(y*38.+uTime*.9, sd*7.)));
    float k = across*along*dust*vGain*smoothstep(5., 24., vDist)*(1.-.55*heatAt(-vP.z));   // the fire's own light drowns it
    gl_FragColor = vec4(sceneFog(mix(uSkyCol, vec3(.8, .85, 1.), .3)*k, vP, vDist), 0.);
    return;
  }
  if (ty > 6.5 && ty < 7.5){
    float r = length(vec2(x, y*2.-1.)); I = smoothstep(1., .1, r); T = I;
  } else {
    float t = uTime*(1.25+.8*fract(sd*7.3));
    float curt = step(1.15, vCurt), k = max(vCurt, 1.);
    float xs = x*k;                                              // across, in units of the flame's own height
    // every flame leans its own way and wanders, more toward its tip
    float lean = (fract(sd*13.7)-.5)*mix(1.2, .25, curt);
    float sway = fbm3(vec2(sd*31.+xs*.35, y*1.4-t*1.1))-.47;
    float xw = xs-lean*y*y+sway*1.9*y*mix(1., .6, curt);
    // a tongue narrows from its root to its tip; a curtain is a wall of fire whose top edge wanders
    float wd = mix(.50, .26, pow(y, mix(.6, 1.4, fract(sd*3.7))));
    float top = .62+.6*(fbm3(vec2(xs*1.15+sd*9., t*.22))-.5)+.3*(vnoise(vec2(xs*3.1+sd*3., t*.5))-.5);
    float yy = mix(y, clamp(y/max(top, .2), 0., 1.5), curt);
    float r = abs(xw)/wd, r2 = r*r*(1.-curt);
    // licks: noise that climbs faster than the flame sways and tears it, more and more toward the tip
    float e = fbm3(vec2(xw*mix(3., 1.6, curt)+sd*17., y*mix(1.6, 1.5, curt)-t*2.4));
    // streaks inside the body, so that even its root is never one flat brightness
    float e3 = fbm3(vec2(xw*mix(5.5, 4.5, curt)+sd*5., y*mix(2.4, 1.6, curt)-t*3.3));
    float f = 1.-r2*.9-yy*mix(1.1, 1., curt)*mix(.8, 1.25, fract(sd*5.1))+(e-.5)*(.8+2.3*yy)+(e3-.5)*.7*yy-(1.-e3)*yy*.45*(1.-curt);
    I = clamp(f*1.12, 0., 1.)*mix(.62+.75*e3, .30+1.4*e3, curt)-vLy*.06;
    // nothing reaches the quad's edge, and the root dissolves instead of standing on a line
    float rootN = fbm3(vec2(xs*1.7+sd*5., t*.3));
    float fade = smoothstep(mix(0., .34*rootN-.06, curt), mix(.16, .12+.42*rootN, curt), y)*(1.-smoothstep(.75, 1., y))*(1.-smoothstep(.7, 1., abs(x)));
    I = clamp(I, 0., 1.)*fade;
    // a flame cools as it climbs: white-gold only at its root, orange through its body, red at the tip
    T = I*(1.-mix(.55, .70, curt)*smoothstep(.05, .85, yy))*(1.-.45*(1.-curt)*smoothstep(.15, .9, r))*mix(1., .42+.5*e, curt);
  }
  // the firebox burns hottest: white-gold fire seen from the snow. Up the kiln a tongue is a small relative of the
  // river: a saturated orange body, a white-gold core only at its root, red where it tears away
  float fb0 = max(step(vFl.x, 12.), step(3.5, ty)*step(ty, 4.5));           // the firebox, and the burst of a jar going over
  float fbx = max(fb0, vAir);                                               // and resinous pine flaring in the air (its colours only)
  vec3 root = uGold*vec3(1.6, 1.0, .24)*mix(1., 1.3, fbx);
  // a few flames carry salt and ash: their tips and edges burn blue-green
  float salt = step(.80, fract(sd*11.3))*step(ty, 6.5)*smoothstep(.30, .75, y);
  vec3 tipc = mix(vec3(.34, .030, .006), vec3(.03, .40, .40), salt*.7);
  vec3 bodyc = mix(uOrange*vec3(.88, .56, .45), uOrange*vec3(1.15, .9, .6), fbx);
  vec3 hotc = mix(mix(tipc, bodyc, smoothstep(.05+.06*salt, .42+.08*salt, T)), root*mix(1., .8, step(7.5, ty)), smoothstep(mix(.78, .60, fbx), 1., T));
  vec3 coldc = mix(uEmber*.8, uOrange*vec3(.95, .62, .5), smoothstep(.25, .9, T));
  vec3 c = mix(coldc, hotc, vHot);
  float a = smoothstep(.02, mix(.7, .5, fb0), I); a *= a*(1.5-.5*a);
  a *= vGain*(ty > 1.5 && ty < 2.5 ? smoothstep(10., 24., vDist) : smoothstep(4., 24., vDist));
  c = sceneFog(c, vP, vDist);
  gl_FragColor = vec4(c*a, clamp(a, 0., 1.)*(.60+.37*smoothstep(.45, .95, I)));
}`;
// a pine split thrown in through a stoke port: pale wood that chars and catches as it falls (uCatch 0..1)
const LOG_VERT = /* glsl */`
varying vec3 vL; varying vec3 vN; varying vec3 vW;
void main(){
  vL = position; vN = mat3(modelMatrix)*normal;
  vec4 wp = modelMatrix*vec4(position, 1.); vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const LOG_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uCatch;
varying vec3 vL; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.));
  float grain = vnoise(vec2(vL.x*.35, (vL.y+vL.z)*5.)), n = fbm3(vL.xy*1.4+vL.z);
  float endg = smoothstep(4.6, 4.95, abs(vL.x));
  vec3 wood = mix(vec3(.50, .36, .20), vec3(.72, .58, .36), endg)*(.7+.5*grain);
  vec3 col = wood*mix(uOrange, uGold, .4)*(.35+.5*max(N.y, 0.)+.25*max(-N.y, 0.));
  float chk = vnoise(vec2(vL.x*.5, (vL.y-vL.z)*4.));
  float crack = smoothstep(.60, .68, chk)*(1.-smoothstep(.70, .80, chk));        // long checks along the grain
  float pulse = .65+.35*sin(uTime*9.+vL.x*3.)*sin(uTime*5.+vL.y*7.);
  float charK = uCatch*smoothstep(.75-.7*uCatch, 1.05-.7*uCatch, n+.25*grain);   // it chars in patches, the pale wood showing between
  col = mix(col, vec3(.05, .026, .018)*(.6+.8*grain), charK*.9);
  col += mix(uEmber*1.3, uOrange*1.5, pulse)*crack*uCatch*(.5+.5*charK)+uOrange*uCatch*uCatch*endg*.9;
  gl_FragColor = vec4(col, 1.);
}`;
function buildSplitGeometry() {
  const G = new Geo(), len = 10, r = 1.25, nS = 4, prof = [[0, 0, -0.7, -0.7]];
  for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI * 0.55 + 0.25; prof.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]); }
  const nP = prof.length + 1;
  for (let s = 0; s <= nS; s++) for (let k = 0; k < nP; k++) { const q = prof[k % prof.length], x = (s / nS - 0.5) * len; G.v(x, q[1] - r * 0.45, q[0] - r * 0.45, 0, q[3], q[2], x, k, 3, 0.3); }
  G.grid(0, nS + 1, nP);
  for (const e of [0, nS]) { const eb = G.count, sgn = e === 0 ? -1 : 1; for (let k = 0; k < prof.length; k++) G.v(sgn * len / 2, prof[k][1] - r * 0.45, prof[k][0] - r * 0.45, sgn, 0, 0, k, 0, 3, 1); for (let k = 1; k < prof.length - 1; k++) G.tri(eb, eb + k, eb + k + 1); }
  return G.build();
}
function buildFlameGeometry(list) {
  const g = new THREE.InstancedBufferGeometry(), P = [], I = [];
  for (const ly of [2, 1, 0]) { const b = P.length / 3; P.push(-0.5, 0, ly, 0.5, 0, ly, 0.5, 1, ly, -0.5, 1, ly); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }   // skirts first, the core last
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex(I);
  const n = list.length, pos = new Float32Array(n * 3), ax = new Float32Array(n * 3), size = new Float32Array(n * 2), fl = new Float32Array(n * 4);
  list.forEach((f, i) => {
    pos.set(f.pos, i * 3); ax.set(f.axis || [0, 1, 0], i * 3); size.set([f.w, f.h], i * 2); fl.set([f.d, f.seed, f.type, f.gain ?? 1], i * 4);
  });
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(ax, 3));
  g.setAttribute('aSize', new THREE.InstancedBufferAttribute(size, 2));
  g.setAttribute('aFl', new THREE.InstancedBufferAttribute(fl, 4));
  g.instanceCount = n;
  return g;
}

// ------------------------------------------------------------------------------------------------
// Ash-glass drips on the crown (they stretch, and a bead falls from each when it is hot)
// ------------------------------------------------------------------------------------------------
const DRIP_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aInfo; attribute float aPart;
uniform float uFront, uTime;
varying vec3 vP; varying vec3 vN; varying float vD; varying float vDist; varying float vBead;
void main(){
  float d = aInfo.x, sd = aInfo.y, len = aInfo.z, th = aInfo.w;
  float hot = smoothstep(uFront+8., uFront-22., d);
  vec3 p = position;
  if (aPart > .5){
    float ph = fract(uTime*(.09+.07*sd)+sd*7.3);
    float sz = th*.42*hot*smoothstep(0., .08, ph)*(1.-ph*.6), fall = len*1.02+ph*ph*38.;
    sz *= smoothstep(.6, 2.5, length((modelViewMatrix*vec4(aPos.x, aPos.y-fall, aPos.z, 1.)).xyz));        // the kit's near law for small falling things (its own two numbers): a bead shrinks to nothing as it nears the eye
    p = p*vec3(sz, sz*1.7, sz); p.y -= fall;
  } else {
    float st = 1.+.24*hot*(.5+.5*sin(uTime*(.5+sd)+sd*30.));
    p.xz *= th*(1.+.6*smoothstep(-.25, 0., p.y)); p.y *= len*st;
  }
  p += aPos;
  vP = p; vN = normal; vD = d; vBead = aPart;
  vec4 mv = modelViewMatrix*vec4(p, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const DRIP_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
uniform sampler2D tProf; uniform vec3 uWH; uniform vec2 uSecD;   // the river's own: the vault's profile along the kiln, its width over height by section
varying vec3 vP; varying vec3 vN; varying float vD; varying float vDist; varying float vBead;
void main(){
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.));
  vec3 Vv = uCamL-vP; vec3 V = Vv/max(length(Vv), 1e-3);
  float heat = heatAt(vD), ndv = clamp(dot(N, V), 0., 1.);
  vec3 fc = fireCol(vD);
  vec3 alb = vec3(.10, .092, .036);
  vec3 col = alb*kilnLight(N, vD);
  col += mix(uOrange, fc, .3)*heat*(.02+.34*pow(1.-ndv, 2.5))*(1.+2.4*vBead)*mix(vec3(1.), vec3(1., .62, .3), vBead);          // molten glass: lit edges
  col += uEmber*(1.-heat)*pow(1.-ndv, 3.)*.25;
  // a drip hangs in the river that runs along the crown, front passed or not: the brown glass takes the fire's light as
  // amber, strongest under the crown, half at four tenths of the vault's half-width at the drip's place and all but gone
  // by the flanks (narrower than the vault's own light: about the river's body overhead), breathing with the fire;
  // a falling bead keeps its own light
  float wv = max(textureLod(tProf, vec2(vD/${PROF_LEN}., .5), 0.).g*(vD < uSecD.x ? uWH.x : (vD < uSecD.y ? uWH.y : uWH.z)), 1.), ax = vP.x/wv;
  float rv = riverOn(vD)*exp(-4.08*ax*ax)*(.62+.76*riverNoise(vec2(vP.x*.6, vD+7.)))*(1.-vBead);
  col += vec3(1., .46, .13)*rv*(.26+.4*pow(1.-ndv, 2.))*uFire;
  col = kilnHaze(col, vD, vDist);
  col = sceneFog(col, vP, vDist);
  gl_FragColor = vec4(col, 1.);
}`;
function buildDripGeometry(list) {
  const body = lathe([[0, -1, 0], [0.115, -0.93, 0], [0.085, -0.72, 0], [0.11, -0.36, 0], [0.2, -0.08, 0], [0.44, 0.03, 0]], 5);
  const bead = lathe([[0, -0.07, 1], [0.065, 0, 1], [0, 0.07, 1]], 4);
  const m = mergeGeometries([body, bead]);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', m.getAttribute('position')); g.setAttribute('normal', m.getAttribute('normal')); g.setAttribute('aPart', m.getAttribute('aPart')); g.setIndex(m.getIndex());
  const n = list.length, pos = new Float32Array(n * 3), info = new Float32Array(n * 4);
  list.forEach((d, i) => { pos.set(d.pos, i * 3); info.set([d.d, d.seed, d.len, d.th], i * 4); });
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
  g.instanceCount = n;
  g.userData.tris = m.getIndex().count / 3;
  return g;
}

// ------------------------------------------------------------------------------------------------
// Cone packs: three slim clay spikes in a boat of clay; each bows over as the heat reaches it
// ------------------------------------------------------------------------------------------------
const CONE_VERT = /* glsl */`
attribute vec4 aInfo; attribute float aSpike; attribute float aH; attribute vec3 aBase;
uniform float uFront; uniform vec3 uCones;
varying vec3 vP; varying vec3 vN; varying float vD; varying float vSpike; varying float vDist; varying float vBend;
void main(){
  vec3 p = position, n = normal; float d = aInfo.x, bend = 0.;
  if (aSpike > .5){
    float k = aInfo.y > .5 ? (aSpike < 1.5 ? uCones.x : aSpike < 2.5 ? uCones.y : uCones.z) : clamp((uFront-d-(aSpike-1.)*4.+3.)/7., 0., 1.);
    bend = k*k*(3.-2.*k);
    float a = bend*2.15*pow(aH, 1.35);
    float c = cos(a), s = sin(a);
    vec3 r = p-aBase; p = aBase+vec3(r.x*c+r.y*s, -r.x*s+r.y*c, r.z);
    n = vec3(n.x*c+n.y*s, -n.x*s+n.y*c, n.z);
  }
  vec4 lp = instanceMatrix*vec4(p, 1.);
  vP = lp.xyz; vN = mat3(instanceMatrix)*n; vD = d; vSpike = aSpike; vBend = bend;
  vec4 mv = modelViewMatrix*lp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const CONE_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_FOG_PARS}
varying vec3 vP; varying vec3 vN; varying float vD; varying float vSpike; varying float vDist; varying float vBend;
void main(){
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.));
  float heat = heatAt(vD);
  vec3 fc = fireCol(vD);
  float n = vnoise(vP.xz*3.+vP.y*2.);
  vec3 alb = vSpike > .5 ? mix(vec3(.22, .12, .07), vec3(.19, .095, .055), .3*vSpike-.2) : uClay*.95;
  alb *= .8+.4*n;
  vec3 col = alb*kilnLight(N, vD);
  col += mix(uOrange, fc, .25)*alb*(heat*.45+vBend*.7)*uFire*(vSpike > .5 ? 1.6 : 1.);
  col = kilnHaze(col, vD, vDist);
  col = sceneFog(col, vP, vDist);
  gl_FragColor = vec4(col, 1.);
}`;
function buildConeGeometry() {
  const pos = [], spike = [], hh = [], base = [];
  const tri = (a, b, c, sp, ha, hb, hc, bs) => { pos.push(...a, ...b, ...c); spike.push(sp, sp, sp); hh.push(ha, hb, hc); base.push(...bs, ...bs, ...bs); };
  const quad = (a, b, c, d, sp, h0, h1, bs) => { tri(a, b, c, sp, h0, h0, h1, bs); tri(a, c, d, sp, h0, h1, h1, bs); };
  // the boat: a low clay trough, wider at the foot, pinched at both ends
  const bx = [-1.5, -1.15, 1.15, 1.5], bw = [0.22, 0.52, 0.52, 0.22], O = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const x0 = bx[i], x1 = bx[i + 1], w0 = bw[i], w1 = bw[i + 1], t = 0.72, y = 0.38;
    quad([x0, 0, w0], [x1, 0, w1], [x1 * 0.95, y, w1 * t], [x0 * 0.95, y, w0 * t], 0, 0, 0, O);
    quad([x1, 0, -w1], [x0, 0, -w0], [x0 * 0.95, y, -w0 * t], [x1 * 0.95, y, -w1 * t], 0, 0, 0, O);
    quad([x0 * 0.95, y, w0 * t], [x1 * 0.95, y, w1 * t], [x1 * 0.95, y, -w1 * t], [x0 * 0.95, y, -w0 * t], 0, 0, 0, O);
  }
  quad([bx[0], 0, -bw[0]], [bx[0], 0, bw[0]], [bx[0] * 0.95, 0.38, bw[0] * 0.72], [bx[0] * 0.95, 0.38, -bw[0] * 0.72], 0, 0, 0, O);
  quad([bx[3], 0, bw[3]], [bx[3], 0, -bw[3]], [bx[3] * 0.95, 0.38, -bw[3] * 0.72], [bx[3] * 0.95, 0.38, bw[3] * 0.72], 0, 0, 0, O);
  // three three-sided spikes, leaning a little the way they will fall
  const nS = 5, Hs = 1.6;
  for (let s = 0; s < 3; s++) {
    const cx = -0.85 + s * 0.85, bs = [cx, 0.3, 0];
    const ring = (k) => { const t = k / nS, r = lerp(0.19, 0.035, t), y = 0.3 + Hs * t, lean = 0.16 * Hs * t, pts = []; for (let c = 0; c < 3; c++) { const a = c * 2.094 + 0.5 + s; pts.push([cx + lean + Math.cos(a) * r, y, Math.sin(a) * r]); } return pts; };
    for (let k = 0; k < nS; k++) {
      const A = ring(k), B = ring(k + 1);
      for (let c = 0; c < 3; c++) { const c1 = (c + 1) % 3; quad(A[c1], A[c], B[c], B[c1], s + 1, k / nS, (k + 1) / nS, bs); }
    }
    const T = ring(nS); tri(T[0], T[2], T[1], s + 1, 1, 1, 1, bs);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSpike', new THREE.Float32BufferAttribute(spike, 1));
  g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
  g.computeVertexNormals();
  return g;
}

// a point on the inside of the vault at angle th, with its inward normal and two surface tangents
function vaultFrame(L, sec, d, th, off = 0) {
  const sw = L.swell(sec, d), p = { x: 0, y: 0 }, q = { x: 0, y: 0 };
  vaultXY(sec.W * sw + off, sec.H * sw + off, th, p); vaultXY(sec.W * sw + off, sec.H * sw + off, th + 0.02, q);
  const P = new THREE.Vector3(p.x, p.y + L.floorY(d), -d);
  const tu = new THREE.Vector3(q.x - p.x, q.y - p.y, 0).normalize(); if (tu.y < 0) tu.negate();
  const td = new THREE.Vector3(0, sec.slope, -1).normalize();
  const n = new THREE.Vector3().crossVectors(td, tu).normalize(); if (n.x * p.x > 0) n.negate();
  return { P, tu, td, n };
}
// a stoke port in the vault's flank: a clay arch frame round a bricked-up door
function buildStokePort(G, F) {
  const AP = archPath(3, 7.6, 10), at = (x, y, o) => { const v = F.P.clone().addScaledVector(F.td, x).addScaledVector(F.tu, y).addScaledVector(F.n, o); return [v.x, v.y, v.z]; };
  const nn = [F.n.x, F.n.y, F.n.z], y0 = (a) => Math.max(a.y, 0) - 3.2;
  for (let i = 0; i < AP.length - 1; i++) {
    const a = AP[i], b = AP[i + 1];
    const I0 = at(a.x, y0(a), 1.5), I1 = at(b.x, y0(b), 1.5), O0 = at(a.x + a.nx * 1.0, y0(a) + a.ny * 1.0, 1.5), O1 = at(b.x + b.nx * 1.0, y0(b) + b.ny * 1.0, 1.5);
    const B0 = at(a.x + a.nx * 1.7, y0(a) + a.ny * 1.7, -0.8), B1 = at(b.x + b.nx * 1.7, y0(b) + b.ny * 1.7, -0.8), D0 = at(a.x, y0(a), 0.35), D1 = at(b.x, y0(b), 0.35);
    flatQuad(G, I0, I1, O1, O0, 4, 0, [1, 1, 1], null, nn);
    flatQuad(G, O0, O1, B1, B0, 4, 0, [0.8, 0.8, 0.8], null, nn);
    flatQuad(G, I0, I1, D1, D0, 4, 0, [0.5, 0.5, 0.5], null, nn);
    const C = at(0, 0, 0.35);
    flatQuad(G, D0, D1, C, C, 1, 0, [1.6, 1.6, 1.6], [[a.x, y0(a)], [b.x, y0(b)], [0, 0], [0, 0]], nn);
  }
}

// the outside: clay face round the fire mouth with its soot fan, the cracked clay skin of every chamber, the flue stack.
// Lit by the world's own lights (MeshStandardMaterial, vertex colours).
function buildExterior(L, FL, noise, clayHex, back = true) {
  const G = new Geo(), clay = new THREE.Color(clayHex).lerp(new THREE.Color('#b08a6a'), 0.45), p = { x: 0, y: 0 }, q = { x: 0, y: 0 };
  const shade = (x, y, z, k) => { const n = 0.72 + 0.4 * (0.5 + 0.5 * noise.n3(x * 0.07, y * 0.07, z * 0.07)) - 0.25 * Math.max(0, noise.n3(x * 0.3, y * 0.3, z * 0.3)); return [clay.r * n * k, clay.g * n * k, clay.b * n * k]; };
  // face: rings between the arch and a broad shouldered outline
  const N = 28, AP = archPath(8, 20, N), rings = 5, z = 1.5, base = G.count;
  for (let i = 0; i <= N; i++) {
    const a = AP[i], th = Math.PI * i / N, c = Math.cos(th), s = Math.sin(th);
    const ox = 31 * Math.sign(c) * Math.pow(Math.abs(c), 0.45), oy = (i === 0 || i === N) ? -5 : 35 * Math.pow(Math.max(s, 0), 0.45);
    for (let r = 0; r < rings; r++) {
      const t = Math.pow(r / (rings - 1), 1.5), x = lerp(a.x, ox, t), y = lerp(a.y, oy, t);
      const soot = clamp(Math.exp(-Math.max(y - 15, 0) / 13) * Math.exp(-x * x / 160) * 1.2 + Math.exp(-(r / (rings - 1)) * 5), 0, 1);
      const col = shade(x, y, z, 1 - 0.9 * soot);
      G.v(x, y, z + (r === 0 ? 0 : 0.4 * Math.sin(t * 3.1)), 0, 0, 1, x, y, 0, 0, col[0], col[1], col[2]);
    }
  }
  G.grid(base, N + 1, rings, true);
  // skin over every chamber: darker (wet, steaming) low down where the snow has melted off
  for (const sec of L.secs) {
    const nR = 6, nC = 15, b = G.count;
    for (let r = 0; r < nR; r++) {
      const d = lerp(sec.d0, sec.d1, r / (nR - 1)), sw = L.swell(sec, d), f = L.floorY(d);
      for (let c = 0; c < nC; c++) {
        const th = Math.PI * c / (nC - 1);
        vaultXY(sec.W * sw + 2.6, sec.H * sw + 2.6, th, p);
        const wet = 0.62 + 0.38 * smoothstep(0.2, 0.75, Math.sin(th)), col = shade(p.x, p.y + f, d, wet);
        G.v(p.x, p.y + f - (c === 0 || c === nC - 1 ? 6 : 0), -d, 0, 1, 0, th * 30, d, 0, 0, col[0], col[1], col[2]);
      }
    }
    G.grid(b, nR, nC, true);
    // shoulder between this chamber's skin and the next one's
    const nx = L.secs[L.secs.indexOf(sec) + 1];
    if (nx) {
      const sb = G.count, f = L.floorY(sec.d1);
      for (let c = 0; c < nC; c++) {
        const th = Math.PI * c / (nC - 1), drop = (c === 0 || c === nC - 1) ? 6 : 0;
        vaultXY(sec.W * L.swell(sec, sec.d1) + 2.6, sec.H * L.swell(sec, sec.d1) + 2.6, th, p); vaultXY(nx.W * L.swell(nx, nx.d0) + 2.6, nx.H * L.swell(nx, nx.d0) + 2.6, th, q);
        const c1 = shade(p.x, p.y + f, sec.d1, 0.7), c2 = shade(q.x, q.y + f, sec.d1, 0.7);
        G.v(p.x, p.y + f - drop, -sec.d1 + 0.9, 0, 0, 1, p.x, p.y, 0, 0, c1[0], c1[1], c1[2]);
        G.v(q.x, q.y + f - drop, -sec.d1 + 0.7, 0, 0, 1, q.x, q.y, 0, 0, c2[0], c2[1], c2[2]);
        G.v(q.x, q.y + f - drop, -sec.d1, 0, 0, 1, q.x, q.y, 0, 0, c2[0], c2[1], c2[2]);
      }
      G.grid(sb, nC, 3, true);
    }
  }
  // end cap behind the top chamber and the flue stack (left out when the world never shows the kiln from behind:
  // the cap would show through the flue's throat from inside)
  if (!back) return G;
  const last = L.secs[L.secs.length - 1], cb = G.count, sw = L.swell(last, last.d1);
  for (let c = 0; c < 15; c++) { vaultXY(last.W * sw + 2.6, last.H * sw + 2.6, Math.PI * c / 14, q); const col = shade(q.x, q.y, 3, 0.8); G.v(q.x, q.y + L.fEnd, -L.end - 0.5, 0, 0, -1, q.x, q.y, 0, 0, col[0], col[1], col[2]); G.v(q.x * 0.5, q.y * 0.5 + L.fEnd + 8, -L.end - 1.2, 0, 0, -1, q.x, q.y, 0, 0, col[0], col[1], col[2]); }
  G.grid(cb, 15, 2);
  const fb = G.count, tmp = new THREE.Vector3();
  for (let r = 0; r <= 4; r++) for (let k = 0; k <= 4; k++) {
    const s = lerp(6, FL.length, r / 4), h = FL.half(s) + 1.8, c = [[h, -h], [h, h], [-h, h], [-h, -h], [h, -h]][k];
    tmp.copy(FL.T).addScaledVector(FL.axis, s).addScaledVector(FL.v, c[1]); tmp.x += c[0];
    const col = shade(tmp.x, tmp.y, tmp.z, 0.75 - 0.4 * smoothstep(0.6, 1, r / 4));
    G.v(tmp.x, tmp.y, tmp.z, 0, 1, 0, k * 10, s, 0, 0, col[0], col[1], col[2]);
  }
  G.grid(fb, 5, 5, true);
  const rb = G.count, hi = FL.half(FL.length), ho = hi + 1.8;
  for (let k = 0; k <= 4; k++) for (const h of [hi, ho]) {
    const c = [[h, -h], [h, h], [-h, h], [-h, -h], [h, -h]][k];
    tmp.copy(FL.T).addScaledVector(FL.axis, FL.length).addScaledVector(FL.v, c[1]); tmp.x += c[0];
    G.v(tmp.x, tmp.y, tmp.z, 0, 1, 0, k * 10, h, 0, 0, 0.5, 0.52, 0.56);
  }
  G.grid(rb, 5, 2, true);
  return G;
}

// front position (metres into the kiln) keyed to the journey's u, after the brief
const DEFAULT_FRONT_KEYS = [[0, 30], [0.10, 34], [0.143, 44], [0.18, 100], [0.25, 160], [0.32, 218], [0.39, 268], [0.44, 292], [0.47, 302], [0.50, 310],
  [0.58, 326], [0.627, 352], [0.67, 404], [0.74, 430], [0.80, 440], [0.82, 443], [0.87, 447], [1, 452]];
function keyed(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (u - a[0]) / Math.max(1e-6, b[0] - a[0])); }
  return keys[keys.length - 1][1];
}

export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const rng = ctx.rng.fork('moon-jar-kiln-hero'), noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const L = makeLayout(), FL = flueFrame(L);
  const group = new THREE.Group(); group.name = 'moon-jar-kiln';
  const great = L.secs[7], JAR_D = great.d0 + 42, JAR_S = 12;
  const jarBaseY = great.f0 + 0.345 * JAR_S, jarCenter = new THREE.Vector3(0, jarBaseY + 0.49 * JAR_S, -JAR_D);

  // ---- shared uniforms: one block drives every kiln shader
  // the fire's temper: -1 a whiter, harder fire, 0 the brief's white-gold and orange, +1 a redder, smokier one.
  // The world sets it with its look; every seed leans a little further one way or the other
  const warm = clamp((opts.warmth ?? 0) + rng.range(-1, 1) * (opts.warmth === undefined ? 0.5 : 0.2), -1, 1), wp = Math.max(warm, 0), wn = Math.max(-warm, 0);
  const gold = pal[3].clone().lerp(pal[4], 0.10 + 0.30 * wp).lerp(new THREE.Color('#fff3d6'), 0.32 * wn);
  const orange = pal[4].clone().lerp(pal[5], 0.06 + 0.36 * wp).lerp(pal[3], 0.22 * wn);
  const U = {
    uFront: { value: 310 }, uTime: { value: 0 }, uFlueD: { value: L.end }, uFlueR: { value: opts.flueReach ?? 104 }, uFire: { value: opts.intensity ?? 1 }, uHaze: { value: opts.haze ?? 1 },
    uCamL: { value: new THREE.Vector3(0, 9, 60) }, uGold: { value: gold }, uOrange: { value: orange }, uEmber: { value: pal[5].clone() },
    uSkyCol: { value: opts.flueLight ? new THREE.Color(opts.flueLight) : pal[0].clone().lerp(pal[1], 0.45) }, uSoot: { value: pal[2].clone().multiplyScalar(2.6) }, uClay: { value: pal[6].clone() },
    uInside: { value: 0 }, uLead: { value: 0 }, uCool: { value: new THREE.Color(0, 0, 0) }, uShaft: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, -999, 0, 1)) },
  };
  // the kiln's one cool colour: the sky's light gone blue-violet in the shadows the fire does not reach
  U.uCool.value.copy(U.uSkyCol.value).lerp(new THREE.Color('#4a3fd0'), 0.55).multiplyScalar(0.9);
  const uPool = { value: new THREE.Vector4(0, -(great.d0 + 42), 13.5, 0) };
  const uGreat = { value: 0 }, uCollapse = { value: 0 }, uCones = { value: new THREE.Vector3() }, uJets = { value: opts.spyJets ?? 0 }, uLogs = { value: new THREE.Vector2() };
  const mk = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...fogUniforms(), ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });

  // ---- shell: four merged chunks
  const chunkOf = (i) => (i <= 3 ? 0 : i <= 6 ? 1 : i <= 9 ? 2 : 3);
  const GS = [new Geo(), new Geo(), new Geo(), new Geo()], ports = [], stokePorts = [], spyHoles = [], aisleRng = rng.fork('aisle');
  for (let i = 0; i < L.secs.length; i++) {
    const sec = L.secs[i], G = GS[chunkOf(i)];
    buildVault(G, L, sec, noise); await ctx.yield();
    buildFloor(G, L, sec, rng); await ctx.yield();
    buildAisleProps(G, L, sec, aisleRng);
    if (i > 0 && i < 12) buildWall(G, L, L.walls[i - 1], ports);       // no wall stands between the two quiet top chambers: they are one hall under the flue
    await ctx.yield();
    if (sec.kind !== 'firebox') for (const sx of [1, -1]) {
      const dm = lerp(sec.d0, sec.d1, 0.5) + rng.range(-3, 3), th = sx > 0 ? 0.72 : Math.PI - 0.72;
      const F = vaultFrame(L, sec, dm, th); buildStokePort(G, F);
      stokePorts.push({ position: F.P.clone().addScaledVector(F.n, 2), normal: F.n.clone(), d: dm, side: sx });
      const E = vaultFrame(L, sec, dm + 9, sx > 0 ? 0.95 : Math.PI - 0.95, 2.8);
      spyHoles.push({ position: E.P.clone(), normal: E.n.clone().negate(), d: dm + 9, side: sx });
    }
    await ctx.yield();
  }
  // the clay face's inner side and the soot-black inside of the fire mouth
  buildWall(GS[0], L, { d: 1.0, f: 0, W: 17, H: 27, archW: 8, archH: 20, index: 0, up: L.secs[0], down: L.secs[0] }, null, [-1]);
  buildLogs(GS[0], rng);
  buildFlue(GS[3], L, FL);
  // prop of stacked clay rings for the great jar's cone pack
  const packPos = new THREE.Vector3(6.3, great.f0 + 3.6, -(JAR_D + 5.7));
  {
    const G = GS[2], n = 14, tiers = [[1.9, 0], [1.9, 0.7], [1.45, 0.75], [1.45, 2.3], [1.6, 2.35], [1.6, 3.6], [0, 3.6]], base = G.count;
    for (let t = 0; t < tiers.length; t++) for (let k = 0; k <= n; k++) {
      const a = k / n * Math.PI * 2, [r, y] = tiers[t], cap = t >= tiers.length - 2, tone = 0.5 + 0.12 * Math.sin(a * 3 + t);
      G.v(packPos.x + Math.cos(a) * r, great.f0 + y, packPos.z + Math.sin(a) * r, cap ? 0 : Math.cos(a) * 0.95, cap ? 1 : 0.3, cap ? 0 : Math.sin(a) * 0.95, a * 2, y, 4, 0, tone, tone * 0.93, tone * 0.86);
    }
    G.grid(base, tiers.length, n + 1);
  }
  await ctx.yield();
  const profTex = buildRiverProfile(L);
  const shellMat = mk(SHELL_VERT, SHELL_FRAG, { tProf: { value: profTex }, uPool }, { side: THREE.DoubleSide });
  let tris = 0; const shells = [];
  for (const G of GS) { const m = new THREE.Mesh(await G.buildSlowly(ctx), shellMat); m.name = 'kiln-shell'; group.add(m); shells.push(m); tris += G.triangles; await ctx.yield(); }

  // ---- jars: three levels of detail per chamber, one shader for all of them, the great jar and the saggars
  const jarMat = mk(JAR_VERT, JAR_FRAG, { uGreat, uCollapse, uJarGlow: { value: opts.jarGlow ?? 1 }, uDetail: { value: 1 }, tNoise: { value: null } });
  const hiSrc = lathe(jarProfile(5, 2, true), 24), midSrc = lathe(jarProfile(3, 1, true), 16), loSrc = lathe(jarProfile(2, 0, true), 10);
  const sagSrc = lathe(saggarProfile(), 10), bowlSrc = lathe(bowlStackProfile(), 14), greatSrc = lathe(jarProfile(16, 2, 'drum'), 64);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
  const makeInst = (src, items, name) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', src.getAttribute('position')); g.setAttribute('normal', src.getAttribute('normal')); g.setAttribute('aPart', src.getAttribute('aPart')); g.setIndex(src.getIndex());
    const info = new Float32Array(items.length * 4), m = new THREE.InstancedMesh(g, jarMat, items.length);
    items.forEach((it, k) => {
      E.set(it.tx, it.yaw, it.tz); Q.setFromEuler(E);
      m.setMatrixAt(k, M4.compose(V1.set(it.x, it.y, it.z), Q, V2.set(it.S * it.sx, it.S * it.sy, it.S * it.sz)));
      info.set([it.d, it.delay, it.kind, it.seed], k * 4);
    });
    g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.name = name;
    m.userData.tris = (src.getIndex().count / 3) * items.length;
    return m;
  };
  // the cast changes with the seed: mostly jars, or many ranks of saggar drums, or many of tiered bowls
  const castMode = Math.floor(rng() * 3), pSag = [0.30, 0.07, 0.17][castMode], pBowl = [0.05, 0.30, 0.17][castMode];
  const chambers = [], saggars = [], bowls = []; let collapseJar = null;
  for (let i = 1; i < L.secs.length; i++) {
    const sec = L.secs[i], R = rowsOf(sec), list = [];
    for (const sx of [1, -1]) for (let r = 0; r < 3; r++) {
      const cr = rng(), plain = (sec.kind === 'great' && r === 0) || (i === 3 && sx < 0 && r < 2), isSag = !plain && cr < pSag && i < 10, isBowl = !plain && cr >= pSag && cr < pSag + pBowl;   // the cold top chambers hold jars and bowls only
      const rankSize = rng.range(0.9, 1.0);
      for (let j = 0; j < R.n; j++) {
        const dc = sec.d0 + WALL_T / 2 + (j + 0.5) * R.pitch + (r === 1 ? 0.45 : -0.25), S = (isSag ? 6.6 : isBowl ? 7.2 : 8.0) * rankSize * rng.range(0.94, 1.03) * (i >= 11 && ((j + r) & 1) ? 0.52 : 1);   // in the two quiet top chambers moon jars and small ware turn about, so every jar stands clear on its setter
        const it = { x: sx * R.xs[r] + rng.range(-0.25, 0.25), y: padTop(L, sec, j, r) + 0.105 * S, z: -dc, S, yaw: rng() * 6.283, tx: rng.range(-0.03, 0.03), tz: rng.range(-0.03, 0.03),
          sx: rng.range(0.975, 1.025), sy: isSag ? rng.range(0.8, 1.25) : isBowl ? rng.range(0.9, 1.2) : rng.range(0.93, 1.04), sz: rng.range(0.975, 1.025), d: dc, delay: r * 2.2 + rng.range(0, 2.5), kind: isSag ? 2 : 0, seed: rng() };
        // the jar that goes over in the rare event: on the aisle's edge, third up the left-hand rank, in clear view from
        // the far side of the orbit; it tips toward the aisle and the camera (its local +x)
        if (sec.kind === 'great' && sx < 0 && r === 0 && j === 4) { collapseJar = it; if (opts.rare) { it.kind = 3; it.yaw = 1.05; it.tx = 0; it.tz = 0; } }
        (isSag ? saggars : isBowl ? bowls : list).push(it);
      }
    }
    const c = new THREE.Vector3(0, L.floorY((sec.d0 + sec.d1) / 2) + 10, -(sec.d0 + sec.d1) / 2);
    await ctx.yield();
    const hi = makeInst(hiSrc, list, 'jars-hi'); await ctx.yield();
    const ch = { sec, center: c, level: -1, lods: [hi, makeInst(midSrc, list, 'jars-mid'), makeInst(loSrc, list, 'jars-lo')] };
    ch.lods.forEach((m, k) => { m.visible = k === 2; group.add(m); });
    chambers.push(ch);
    await ctx.yield();
  }
  const greatJar = makeInst(greatSrc, [{ x: 0, y: jarBaseY, z: -JAR_D, S: JAR_S, yaw: rng() * 6.283, tx: rng.range(-0.012, 0.012), tz: rng.range(-0.012, 0.012), sx: 1, sy: rng.range(0.97, 1.02), sz: rng.range(0.985, 1.0), d: JAR_D, delay: 0, kind: 1, seed: rng() }], 'great-jar');
  group.add(greatJar);
  let saggarMesh = null;
  if (saggars.length) { saggarMesh = makeInst(sagSrc, saggars, 'saggars'); group.add(saggarMesh); }
  let bowlMesh = null;
  if (bowls.length) { bowlMesh = makeInst(bowlSrc, bowls, 'bowl-stacks'); group.add(bowlMesh); }
  await ctx.yield();
  let flueWare;
  // ---- the ware that climbs the flue: a rank of small ware on every tread of the stair up its lower wall, a moon jar and a
  // stack of tiered bowls turn about as jar and small ware do in the quiet hall, no two of a height, cold chalk as the hall's
  // are (their d lies beyond the kiln's end, where the front never comes). On every seed. A stream of their own, so that no
  // other chance in the build moves.
  {
    const fr = makeRng(hashSeed('moon-jar-kiln-flue-ware:' + ctx.seed)), jars = [], stacks = [];
    flueStair(FL).forEach((r, k) => {
      const pitch = 0.82 * r.S + 0.8, n = Math.floor(2 * (r.h - 0.5 * r.S - 0.9) / pitch) + 1;
      for (let i = 0; i < n; i++) {
        const jar = !((i + k) & 1), S = r.S * (jar ? fr.range(0.88, 1.05) : fr.range(0.62, 0.78));
        (jar ? jars : stacks).push({ x: (i - (n - 1) / 2) * pitch + fr.range(-0.3, 0.3), y: r.y + 0.105 * S, z: r.z + 0.5 * r.S + 0.35 + fr.range(0, 0.4), S, yaw: fr() * 6.283, tx: fr.range(-0.03, 0.03), tz: fr.range(-0.03, 0.03),
          sx: fr.range(0.975, 1.025), sy: jar ? fr.range(0.9, 1.08) : fr.range(0.85, 1.2), sz: fr.range(0.975, 1.025), d: L.end + 40, delay: 0, kind: 0, seed: fr() });
      }
    });
    flueWare = [makeInst(hiSrc, jars, 'flue-ware'), makeInst(bowlSrc, stacks, 'flue-bowls')];
    group.add(flueWare[0], flueWare[1]);
  }
  await ctx.yield();

  // ---- the river of flame
  const noiseTex = await buildFlameNoise(ctx, rng.fork('flame-noise'));
  jarMat.uniforms.tNoise.value = noiseTex;
  const uWall = [new THREE.Vector4(1, 0, 8, 12)];
  for (const w of L.walls) uWall.push(new THREE.Vector4(w.d, w.f, w.archW, w.archH - w.archW));
  const riverMat = mk(RIVER_VERT, RIVER_FRAG, { uRiver: { value: opts.river ?? 1 }, tProf: { value: profTex }, tNoise: { value: noiseTex }, uWall: { value: uWall }, uSteps: { value: Math.max(14, Math.round(32 * detail)) }, uRiverEnd: { value: L.end },
    uWH: { value: new THREE.Vector3(L.secs[0].W / L.secs[0].H, L.secs[1].W / L.secs[1].H, L.secs[8].W / L.secs[8].H) }, uSecD: { value: new THREE.Vector2(L.secs[0].d1, L.secs[7].d1) } },
    { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation });
  const rivers = []; let riverTris = 0;
  for (const sec of L.secs) {
    const g = buildRiverProxy(L, sec), m = new THREE.Mesh(g, riverMat);
    m.name = 'flame-river'; m.renderOrder = 2; group.add(m); riverTris += g.getIndex().count / 3;
    rivers.push({ mesh: m, d0: sec.d0, dc: (sec.d0 + sec.d1) / 2, cap: false });
  }
  for (let k = 0; k < L.walls.length; k++) {
    const g = buildRiverCap(L, k), m = new THREE.Mesh(g, riverMat), lo = L.secs[k], hi = L.secs[k + 1];
    m.name = 'flame-river-cap'; m.renderOrder = 2; group.add(m); riverTris += g.getIndex().count / 3;
    rivers.push({ mesh: m, d0: L.walls[k].d, dc: L.walls[k].d, cap: true, dcLo: (lo.d0 + lo.d1) / 2, dcHi: (hi.d0 + hi.d1) / 2 });
  }
  await ctx.yield();

  // ---- flame tongues
  const flames = [];
  // a fountain at every floor port: no two alike in height or breadth, and a lower, broader one behind each third
  for (const p of ports) {
    const tall = rng.chance(0.3), gk = p.wall === 7 ? 1.7 : 1;          // the great chamber's fountains stand taller
    flames.push({ pos: [p.x + rng.range(-0.4, 0.4), p.y + 0.2, -(p.d + 0.9)], w: (tall ? rng.range(6, 8.5) : rng.range(4.5, 8)) * (gk > 1 ? 1.3 : 1), h: (tall ? rng.range(11, 15) : rng.range(4.5, 9.5)) * gk, d: p.d, seed: rng(), type: 0 });
    if (rng.chance(0.34)) flames.push({ pos: [p.x + rng.range(-1.4, 1.4), p.y + 0.1, -(p.d + 2.6)], w: rng.range(5, 8), h: rng.range(3.5, 6.5), d: p.d, seed: rng(), type: 0, gain: 0.8 });
  }
  {
    // the great chamber's far wall: the fire is drawn to its ports and stands against it either side of the arch
    const w7 = L.walls[7], R = rowsOf(great);
    for (const sx of [1, -1]) for (let i = 0; i < 6; i++) {
      const x = sx * (13.5 + 4.6 * i + rng.range(-0.8, 0.8));
      flames.push({ pos: [x, padTopAtX(L, great, R.n - 1, x) + 0.2, -(w7.d - WALL_T / 2 - 1.1)], w: rng.range(7, 10.5), h: rng.range(9, 21), d: w7.d - 7, seed: rng(), type: 0 });
    }
    // shafts of cold light down the spy holes: three broad ones in the great chamber, landing beside the great jar,
    // and one in every second chamber and in each of the cold top chambers
    const shaft = (sec, d, th, to, wd, gain, k) => {
      const F = vaultFrame(L, sec, d, th, -0.6), ax = new THREE.Vector3(to[0], to[1], to[2]).sub(F.P), len = ax.length(); ax.normalize();
      flames.push({ pos: [F.P.x, F.P.y, F.P.z], axis: [ax.x, ax.y, ax.z], w: wd, h: len, d, seed: rng(), type: 9, gain });
      if (k >= 0) U.uShaft.value[k].set(to[0], to[1], to[2], wd * 1.5);
    };
    const gy = great.f0 + 0.3;
    shaft(great, JAR_D + 16, Math.PI - 1.0, [-9.5, gy, -(JAR_D - 4)], 3.0, 0.27, 0);
    shaft(great, JAR_D - 22, 1.05, [14, gy, -(JAR_D - 13)], 2.6, 0.21, 1);
    shaft(great, JAR_D + 26, 0.98, [11, gy, -(JAR_D + 13)], 3.0, 0.27, 2);
    {
      // two slants of cold daylight inside the flue: kept in the list (their random draws keep every later flame where it was) but unlit, so nothing pale lies over the portal
      const fp = (s, cx, cy) => FL.T.clone().addScaledVector(FL.axis, s).addScaledVector(FL.v, cy).add(new THREE.Vector3(cx, 0, 0));
      for (const [a, b, wd, gain] of [[fp(64, -7, 6.5), fp(22, 11, -10), 6.4, 0], [fp(63.5, 7, 6), fp(31, -10.5, -7.5), 5.2, 0]]) {
        const ax = b.clone().sub(a), len = ax.length(); ax.normalize();
        flames.push({ pos: [a.x, a.y, a.z], axis: [ax.x, ax.y, ax.z], w: wd, h: len, d: L.end + 20, seed: rng(), type: 9, gain });
      }
    }
    for (const i of [4, 10, 12]) {
      const sec = L.secs[i], sx = i === 4 ? 1 : -1, d = lerp(sec.d0, sec.d1, 0.62), dt = d - 9;
      shaft(sec, d, sx > 0 ? 1.0 : Math.PI - 1.0, [-sx * 5, L.floorY(dt) + 0.3, -dt], i === 12 ? 3.0 : 2.0, i === 12 ? 0.36 : i > 8 ? 0.3 : 0.22, i === 12 ? 3 : -1);
    }
    {
      // and a second, broader one into the top chamber from the other flank: two slants of daylight cross under the flue's bell
      const sec = L.secs[12], d = lerp(sec.d0, sec.d1, 0.36), dt = d - 8;
      shaft(sec, d, 0.95, [-6.5, L.floorY(dt) + 0.3, -dt], 3.4, 0.4, 4);
    }
  }
  for (let k = 0; k < 22; k++) {            // the burning bed: tall at the sides, low under the flight line
    const x = rng.range(-12.5, 12.5), mid = Math.abs(x) < 5.5;
    flames.push({ pos: [x, rng.range(1.2, 3.2), -rng.range(7, 33)], w: rng.range(6, 11), h: mid ? rng.range(3.5, 5) : rng.range(8, 17), d: 10, seed: rng(), type: 2 });
  }
  // deep in the bed, against the side walls and the first flame wall: what we fly between once we are inside
  for (let k = 0; k < 8; k++) { const sx = k % 2 ? 1 : -1; flames.push({ pos: [sx * rng.range(9.5, 13.5), rng.range(0.6, 2.2), -rng.range(22, 34)], w: rng.range(6, 9), h: rng.range(10, 18), d: 10, seed: rng(), type: 2, gain: rng.range(0.85, 1.1) }); }
  // the first flames inside the mouth, standing on the last armful of splits
  for (let k = 0; k < 7; k++) flames.push({ pos: [-7 + k * 2.3 + rng.range(-0.9, 0.9), rng.range(0.5, 2.6), -rng.range(4.5, 11)], w: rng.range(6, 11), h: rng.range(6.5, 17), d: 2, seed: rng(), type: 2, gain: rng.range(0.85, 1.2) });
  // two curtains of fire deep in the bed: from the yard the mouth is full of fire behind those tongues, white-gold at its roots
  for (const c of [[-19, 40, 15, 0.4], [-29, 44, 19, 0.62]]) flames.push({ pos: [rng.range(-0.6, 0.6), 0.5, c[0]], w: c[1], h: c[2], d: 2, seed: rng(), type: 8, gain: c[3] });
  for (const s of spyHoles) flames.push({ pos: [s.position.x, s.position.y, s.position.z], axis: [s.normal.x, s.normal.y, s.normal.z], w: 4.2, h: 20, d: s.d, seed: rng(), type: 3 });
  if (collapseJar) flames.push({ pos: [collapseJar.x - 1.5, collapseJar.y - 0.5, collapseJar.z + 1.5], w: 12, h: 16, d: collapseJar.d, seed: rng(), type: 4, gain: opts.rare ? 1.05 : 0 });
  if (collapseJar && opts.rare) {            // the fan of sparks the collapse throws up
    const sr = rng.fork('collapse-sparks');
    for (let k = 0; k < 110; k++) { const a = sr() * Math.PI * 2, sp = sr.range(3, 11), sz = sr.range(0.38, 0.9); flames.push({ pos: [collapseJar.x, collapseJar.y + 1.5, collapseJar.z], axis: [Math.cos(a) * sp, sr.range(5.5, 14), Math.sin(a) * sp], w: sz, h: sz, d: collapseJar.d, seed: sr(), type: 7, gain: 2 }); }
  }
  // two pooled pine splits that come in through stoke ports (chamber 3 on the left, chamber 5 on the left)
  const logDrops = [5, 9].map((pi, i) => {
    const sp = stokePorts[Math.min(pi, stokePorts.length - 1)];
    const S = sp.position.clone().addScaledVector(sp.normal, -3), E = new THREE.Vector3(sp.side * 14, L.floorY(sp.d) + 1.5, -sp.d);   // lands at the aisle's edge
    flames.push({ pos: [E.x, E.y - 1.2, E.z], w: 9, h: 16, d: sp.d, seed: 0.37 + 0.41 * i, type: 5 + i, gain: 1.15 });
    for (const [o, sd] of [[-3.4, 0.54], [3.3, 0.72]]) flames.push({ pos: [E.x, E.y - 1.2, E.z], axis: [o, 0, 0], w: 6, h: 11, d: sp.d, seed: sd + 0.177 * i, type: 5.25 + i, gain: 1.1 });   // tongues along it in the air
    return { S, E, d: sp.d, side: sp.side, mesh: null, mat: null, P: { value: new THREE.Vector4(E.x, E.y - 1.2, E.z, 0) }, A: { value: new THREE.Vector3(0, 1, 0) }, X: { value: new THREE.Vector3(1, 0, 0) } };
  });
  const flameMat = mk(FLAME_VERT, FLAME_FRAG, { uJets, uCollapse, uLogs, uLogP0: logDrops[0].P, uLogP1: logDrops[1].P, uLogA0: logDrops[0].A, uLogA1: logDrops[1].A, uLogX0: logDrops[0].X, uLogX1: logDrops[1].X }, { transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation });
  const flameMesh = new THREE.Mesh(buildFlameGeometry(flames), flameMat); flameMesh.name = 'flame-tongues'; flameMesh.frustumCulled = false; flameMesh.renderOrder = 3; group.add(flameMesh);
  await ctx.yield();

  const splitGeo = buildSplitGeometry();
  for (const lg of logDrops) {
    lg.mat = new THREE.ShaderMaterial({ uniforms: { ...U, uCatch: { value: 0 } }, vertexShader: LOG_VERT, fragmentShader: LOG_FRAG, side: THREE.DoubleSide });
    lg.mesh = new THREE.Mesh(splitGeo, lg.mat); lg.mesh.name = 'thrown-split'; lg.mesh.visible = false; lg.mesh.position.copy(lg.S); group.add(lg.mesh);
  }

  // ---- drips of ash glass on the crown
  const drips = [];
  for (let i = 1; i < L.secs.length; i++) {
    const sec = L.secs[i], n = Math.round((sec.kind === 'great' ? 28 : 16) * detail);
    for (let k = 0; k < n; k++) {
      const d = rng.range(sec.d0 + 5, sec.d1 - 5), off = rng.range(-1, 1), th = Math.PI / 2 + off * Math.abs(off) * 0.85, F = vaultFrame(L, sec, d, th);
      drips.push({ pos: [F.P.x, F.P.y - 0.15, F.P.z], d, seed: rng(), len: rng.range(4, 9) * (1 - 0.4 * Math.abs(off)), th: rng.range(1.7, 3.2) });
    }
  }
  const dripGeo = buildDripGeometry(drips);
  const dripMesh = new THREE.Mesh(dripGeo, mk(DRIP_VERT, DRIP_FRAG, { tProf: riverMat.uniforms.tProf, uWH: riverMat.uniforms.uWH, uSecD: riverMat.uniforms.uSecD })); dripMesh.name = 'ash-drips'; dripMesh.frustumCulled = false; group.add(dripMesh);

  // ---- cone packs: one each side at the foot of every chamber's first terrace, one beside the great jar
  const packs = [];
  for (let i = 1; i < L.secs.length; i++) {
    const sec = L.secs[i]; if (sec.kind === 'great') continue;
    const R = rowsOf(sec);
    for (const sx of [1, -1]) { const d = sec.d0 + WALL_T / 2 + 2.2 + rng.range(0, 1.5); packs.push({ x: sx * (R.edges[0] - 1.4), y: L.floorY(d) - 0.05, z: -d, s: 1.7, yaw: Math.PI / 2 + rng.range(-0.3, 0.3), d, great: 0 }); }
  }
  packs.push({ x: packPos.x, y: packPos.y, z: packPos.z, s: 1.5, yaw: Math.PI / 2 + 0.5, d: JAR_D, great: 1 });
  const coneGeo = buildConeGeometry(), coneInfo = new Float32Array(packs.length * 4);
  const coneMesh = new THREE.InstancedMesh(coneGeo, mk(CONE_VERT, CONE_FRAG, { uCones }, { side: THREE.DoubleSide }), packs.length);
  packs.forEach((p, k) => { E.set(0, p.yaw, 0); Q.setFromEuler(E); coneMesh.setMatrixAt(k, M4.compose(V1.set(p.x, p.y, p.z), Q, V2.set(p.s, p.s, p.s))); coneInfo.set([p.d, p.great, rng(), 0], k * 4); });
  coneGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(coneInfo, 4));
  coneMesh.instanceMatrix.needsUpdate = true; coneMesh.frustumCulled = false; coneMesh.name = 'cone-packs'; group.add(coneMesh);
  await ctx.yield();

  // ---- the outside (lit by the world)
  let exterior = null;
  if (opts.exterior !== false) {
    const GX = buildExterior(L, FL, noise, '#' + pal[6].getHexString(), opts.exteriorBack !== false);
    exterior = new THREE.Mesh(await GX.buildSlowly(ctx, true), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
    exterior.name = 'kiln-exterior'; group.add(exterior); tris += GX.triangles;
    await ctx.yield();
  }

  // ---- anchors (hero-local space)
  const PATH_H = 9, v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // marks: the index in flyThrough of each flame wall's arch, of the orbit's first and last point and of the flue's throat,
  // so that a world can key its moments to the places and not to fractions of a path whose length it does not know
  const flyThrough = [v3(0, PATH_H, 112.5), v3(0, PATH_H, 60), v3(0, PATH_H, 0), v3(0, 8.5, -18)], marks = { mouth: 2, walls: [], orbit: [0, 0], throat: 0 };
  // chambers 1 to 6, no two flown alike: low under the river (1, 2), on at the height of the jars through the wide arch
  // and along the left-hand rank of 3, high on the left through the arch into 4, the axis into 5, high into 6 and
  // down to the great jar. Within 2.5 m of the axis wherever the gaze is turned across a jamb. [x, height above the floor]: wall, middle, ...
  const LOWER = [[0, 7.5], [0, 5.5], [0, 6], [1.5, 7], [0.5, 7.5], [-2.5, 8.5], [-5, 14], [-1.5, 11], [0.5, 9.5], [-1, 12], [-1.2, 13.5], [-0.8, 10.5], [0, 9]];
  for (let k = 0; k < 7; k++) {
    const w = L.walls[k], a = LOWER[k * 2]; marks.walls.push(flyThrough.length); flyThrough.push(v3(a[0], w.f + a[1], -w.d));
    if (k < 6) { const dm = (w.d + L.walls[k + 1].d) / 2, b = LOWER[k * 2 + 1]; flyThrough.push(v3(b[0], L.floorY(dm) + b[1], -dm)); }
  }
  // the great chamber: in on the axis with the jar dead ahead, then one anticlockwise turn round it, far enough out
  // that the whole jar stands in the frame (12.5 m from its surface, 6 m from the nearest rank), rising 3.5 m
  const orbitR = 18.5, orbit = [];
  // the turn is a rising spiral: out and up over the right-hand rank to the uphill corner, from where the whole chamber
  // lies below (the jar, both ranks, the shafts, the arch of the fired kiln), then down and in again to the jar's side
  const ORB = [[1.06, 0], [1.05, 3], [1.13, 8.5], [1.08, 9.5], [1.06, 10.5], [1.08, 10], [1.05, 8.5], [1.2, 5], [1.12, 3.5]];
  for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2, r = orbitR * ORB[k][0]; orbit.push(v3(Math.sin(a) * r - (k === 0 ? 2.5 : 0), great.f0 + PATH_H + ORB[k][1], -JAR_D + Math.cos(a) * r)); }
  flyThrough.push(v3(-1, great.f0 + PATH_H, -(JAR_D - 31)));
  marks.orbit[0] = flyThrough.length; flyThrough.push(...orbit); marks.orbit[1] = flyThrough.length - 1;
  flyThrough.push(v3(20.5, great.f0 + PATH_H + 3.5, -(JAR_D - 9)), v3(22.5, great.f0 + PATH_H + 3, -(JAR_D + 6)), v3(11, great.f0 + PATH_H + 1.5, -(JAR_D + 24.5)));
  // chambers 8 to 12: up into the front's tongues, a close pass along the left-hand rank of cold jars, then the throat
  const UPPER = [[0, 9], [-3, 8.5], [-0.5, 10.5], [1.5, 11], [0.5, 17], [-3.5, 14.5], [-1.5, 17.5], [0.5, 25], [0, 21.5], [0, 10]];
  for (let k = 7; k < 12; k++) {
    const w = L.walls[k], a = UPPER[(k - 7) * 2]; marks.walls.push(flyThrough.length); flyThrough.push(v3(a[0], w.f + a[1], -w.d));
    const dm = k < 11 ? (w.d + L.walls[k + 1].d) / 2 : (w.d + L.end) / 2, b = UPPER[(k - 7) * 2 + 1];
    if (k < 11) flyThrough.push(v3(b[0], L.floorY(dm) + b[1], -dm));
  }
  const portalPos = FL.T.clone().addScaledVector(FL.axis, FL.length);
  marks.throat = flyThrough.length;
  flyThrough.push(FL.T.clone(), FL.T.clone().addScaledVector(FL.axis, 30), portalPos.clone());
  const anchors = {
    fireMouth: { position: v3(0, 10, 1.5), normal: v3(0, 0, 1), width: 16, height: 20 },
    flyThrough, marks, pathHeight: PATH_H,
    greatJar: { center: jarCenter.clone(), radius: JAR_S / 2, base: v3(0, jarBaseY, -JAR_D), top: v3(0, jarBaseY + 0.985 * JAR_S, -JAR_D), floorY: great.f0 },
    orbit: { center: jarCenter.clone(), radius: orbitR, points: orbit },
    conePack: packPos.clone().add(v3(0, 1.5, 0)),
    collapseJar: collapseJar ? v3(collapseJar.x, collapseJar.y + collapseJar.S * 0.5, collapseJar.z) : null,
    arches: L.walls.map((w) => ({ position: v3(0, w.f + PATH_H, -w.d), d: w.d, sillY: w.f, halfWidth: w.archW, height: w.archH })),
    chambers: L.secs.map((s, i) => ({ index: i, kind: s.kind, d0: s.d0, d1: s.d1, floor0: s.f0, floor1: s.f1, halfWidth: s.W, height: s.H, center: v3(0, (s.f0 + s.f1) / 2 + PATH_H, -(s.d0 + s.d1) / 2) })),
    flue: { throat: FL.T.clone(), top: portalPos.clone(), axis: FL.axis.clone(), halfThroat: 15, halfTop: 9, length: FL.length },
    portalSeat: { position: portalPos.clone(), normal: FL.axis.clone().negate(), axis: FL.axis.clone(), width: 18, pitch: 40 },
    stokePorts, spyHoles, floorPorts: ports.map((p) => v3(p.x, p.y, -(p.d + 0.9))),
    viewpoints: [
      { name: 'fromTheSnow', position: v3(0, 9, 110), target: v3(0, 10, 0) },
      { name: 'nestedArches', position: v3(0, L.floorY(135) + PATH_H, -135), target: v3(0, L.floorY(215) + PATH_H, -215) },
      { name: 'greatJarAhead', position: v3(0, great.f0 + PATH_H, -(JAR_D - 30)), target: jarCenter.clone() },
      { name: 'lookBack', position: jarCenter.clone().add(v3(-5, 3.5, -13)), target: v3(-2, L.floorY(190) + PATH_H, -190) },
      { name: 'emberChamber', position: v3(0, L.floorY(465) + PATH_H, -465), target: FL.T.clone() },
      { name: 'flue', position: FL.T.clone().addScaledVector(FL.axis, 18), target: portalPos.clone() },
    ],
  };

  // ---- progress
  let frontKeys = opts.frontKeys || DEFAULT_FRONT_KEYS, melt = opts.greatMelt || [0.50, 0.58], meltKeys = opts.greatMeltKeys || null, coneAt = opts.coneAt || [0.53, 0.56, 0.59], collapseAt = opts.collapseAt ?? 0.60;
  let driven = false;
  const apply = (u) => {
    U.uFront.value = keyed(frontKeys, u);
    // the flame runs on along the crown well ahead of the jars it has yet to light, until it stalls below the cold top chambers
    U.uLead.value = 58 * (1 - smoothstep(392, 452, U.uFront.value));
    uGreat.value = meltKeys ? keyed(meltKeys, u) : smoothstep(melt[0], melt[1], u);
    uPool.value.w = smoothstep(0.0, 0.75, uGreat.value);      // the pool is the jar's own light: none while the jar is still cold clay
    uCones.value.set(smoothstep(coneAt[0] - 0.008, coneAt[0] + 0.018, u), smoothstep(coneAt[1] - 0.008, coneAt[1] + 0.018, u), smoothstep(coneAt[2] - 0.008, coneAt[2] + 0.018, u));
    uCollapse.value = opts.rare ? smoothstep(collapseAt - 0.012, collapseAt + 0.034, u) : 0;
  };
  apply(0.54);
  const camL = new THREE.Vector3();
  const hero = {
    object: group,
    radius: 2.6, height: 10, center: jarCenter.clone(),
    extent: { min: v3(-45, -6, -(L.end + 50)), max: v3(45, portalPos.y + 6, 3), length: L.end, rise: L.fEnd },
    anchors, ground: false, groundY: 0,
    uniforms: { ...U, uGreat, uCollapse, uCones, uJets, uLogs },
    floorY: (d) => L.floorY(d), frontAt: (u) => keyed(frontKeys, u),
    // re-key the scripted moments once the world knows where its path passes the hero's marks
    setKeys(k) { if (k.frontKeys) frontKeys = k.frontKeys; if (k.greatMeltKeys) meltKeys = k.greatMeltKeys; if (k.coneAt) coneAt = k.coneAt; if (k.collapseAt !== undefined) collapseAt = k.collapseAt; },
    setProgress(u) { driven = true; apply(clamp(u, 0, 1)); },
    setFront(d) { driven = true; U.uFront.value = d; U.uLead.value = 58 * (1 - smoothstep(392, 452, d)); },
    setGreatMelt(k) { driven = true; uGreat.value = clamp(k, 0, 1); uPool.value.w = smoothstep(0.0, 0.75, uGreat.value); },
    setCones(a, b, c) { uCones.value.set(a, b, c); },
    setCollapse(k) { uCollapse.value = clamp(k, 0, 1); },
    setSpyJets(g) { uJets.value = g; },
    // k: 0 nothing; 0..1 the split comes in through the port, falls and catches; 1..3 its flame burns down
    setLogDrop(i, k) {
      const lg = logDrops[i]; if (!lg) return;
      const on = k > 0.001 && k < 1.02;
      if (lg.mesh.visible !== on) lg.mesh.visible = on;
      uLogs.value.setComponent(i, smoothstep(0.10, 0.45, k) * (1 - smoothstep(1.5, 3.0, k)));
      const kk = clamp(k, 0, 1), m = lg.mesh, S = lg.S, E = lg.E;
      // the split's fire: rooted on the split and streaming back the way it came while it is in the air, standing at the
      // landing place once it lies there
      const air = on ? 1 - smoothstep(0.80, 1.0, kk) : 0;
      const px = lerp(S.x, E.x, kk), py = lerp(S.y, E.y, kk * kk), pz = lerp(S.z, E.z, kk);
      const vx = E.x - S.x, vy = 2 * kk * (E.y - S.y), vz = E.z - S.z, vl = Math.hypot(vx, vy, vz) || 1;
      let ax = -vx / vl * air, ay = -vy / vl * air + (1 - 0.5 * air), az = -vz / vl * air; const al = Math.hypot(ax, ay, az) || 1;
      ax /= al; ay /= al; az /= al;
      lg.A.value.set(ax, ay, az);
      lg.P.value.set(lerp(E.x, px - ax * 2, air), lerp(E.y - 1.2, py - ay * 2, air), lerp(E.z, pz - az * 2, air), air);
      if (!on) return;
      m.position.set(px, py, pz);
      m.rotation.set(0.4 + kk * 2.6 * lg.side, 0.3 + kk * 1.1, lg.side * (0.5 - kk * 1.9));
      m.scale.setScalar(1 - 0.5 * smoothstep(0.85, 1.02, kk));
      lg.X.value.set(1, 0, 0).applyEuler(m.rotation);
      lg.mat.uniforms.uCatch.value = smoothstep(0.2, 0.8, kk);
    },
    logDrops: logDrops.map((l) => ({ d: l.d, side: l.side, from: l.S.clone(), to: l.E.clone() })),
    setFlueLight(c) { U.uSkyCol.value.set(c); },
    setIntensity(k) { U.uFire.value = k; },
    stats: { triangles: 0, drawCalls: 0 },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) apply(0.50 + 0.13 * ((time / 40) % 1));       // viewed alone: the front crosses the great jar on a loop
      camL.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(camL);
      U.uCamL.value.copy(camL);
      U.uInside.value = smoothstep(7, -9, camL.z);              // 0 in the yard, 1 once through the fire mouth
      // the river's pieces: only those the front has reached, drawn far to near
      for (const rv of rivers) {
        const on = rv.d0 < U.uFront.value + U.uLead.value + 32;
        if (rv.mesh.visible !== on) rv.mesh.visible = on;
        // far to near; a cap is drawn just after the piece that lies beyond it
        const far = rv.cap ? Math.abs((-camL.z < rv.d0 ? rv.dcHi : rv.dcLo) + camL.z) - 0.5 : Math.abs(rv.dc + camL.z);
        rv.mesh.renderOrder = 2.9 - Math.min(far, 800) * 0.001;
      }
      for (const ch of chambers) {
        const dist = camL.distanceTo(ch.center), near = ch.sec.kind === 'great' ? 84 : 46;
        const lv = dist < near ? 0 : dist < 108 ? 1 : 2;
        if (lv !== ch.level) { ch.level = lv; ch.lods[0].visible = lv === 0; ch.lods[1].visible = lv === 1; ch.lods[2].visible = lv === 2; }
      }
    },
    dispose() { hiSrc.dispose(); midSrc.dispose(); loSrc.dispose(); sagSrc.dispose(); bowlSrc.dispose(); greatSrc.dispose(); profTex.dispose(); noiseTex.dispose(); },
  };
  // cost: the worst case (two chambers at full detail, two at middle, the rest low)
  const jt = chambers.map((c) => c.lods.map((m) => m.userData.tris));
  let jarTris = 0; jt.forEach((t, i) => { jarTris += i < 2 ? t[0] : i < 4 ? t[1] : t[2]; });
  hero.stats.triangles = Math.round(tris + jarTris + greatJar.userData.tris + (saggarMesh ? saggarMesh.userData.tris : 0) + riverTris + (bowlMesh ? bowlMesh.userData.tris : 0) + flueWare[0].userData.tris + flueWare[1].userData.tris + flames.length * 6 + drips.length * dripGeo.userData.tris + packs.length * coneGeo.getAttribute('position').count / 3);
  hero.stats.drawCalls = shells.length + chambers.length + 1 + (saggarMesh ? 1 : 0) + (bowlMesh ? 1 : 0) + rivers.length + 3 + (exterior ? 1 : 0) + 2 + flueWare.length;
  return hero;
}

// the moon jar's lathe and profile, for the raw jars in the yard
export { lathe as latheGeometry, jarProfile };
