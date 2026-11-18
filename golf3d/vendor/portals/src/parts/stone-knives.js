// THE FOREST OF KNIVES: hero set piece for "stone-knives" (a Madagascan tsingy at late gold light).
//
// What it is (hero-local metres; origin = the exit portal's foot on the canyon stream, +Y up,
// the camera arrives from +Z flying north (-Z); west / the sun is -X):
//   - the blade field: ~50 sculpted hero blades (real teeth and buttress flutes, 730 tris each)
//     along the upper line, ~800 mid fins and ~1,850 far fins on a jointed grid, an ellipse
//     800 x 1050 m centred near (xc*0.4, 0, 120). Tops level at 76-80 m. Mid and far fins get
//     their needle teeth cut per pixel (discard) so the horizon is a bed of nails for 12-40 tris;
//   - the crest causeway (a 29 m knife edge under the entry) and nine landing tips, each a hero
//     blade whose highest tooth sits exactly on its anchor. The line goes DOWN: two long dropping
//     leaps off the end of the crest, then a street between blades that stand 12 to 15 m over the
//     eye (crowns in the sun, bodies in violet shade), through a gate of two cross-set blades, to
//     the lip of the fissure;
//   - the Cathedral: twin towers 104 / ~100 m either side of a 16 m keyhole at the origin, three
//     lesser spires, a rock bridge 25 m over the stream, strangler-fig root cables (swaying);
//   - the fissure (6.7 m wide, from the lip at z ~ 304) widening into the 18 m canyon that swings
//     north-east in one arc into the keyhole: two fluted wall fins (runnels, bedding joints with
//     lit lips, solution pits, moss in patches), an alcove in the right wall 100 m short of the
//     portal whose return face is turned up the canyon (the bats' cave), a floor with leaf litter
//     and a stream that carries a rocking strip of gold sky; a fallen blade wedged across the canyon
//     52 m short of the portal, 12 m up, with fig roots hanging off it (anchors.arch), five sifakas
//     sitting along its crest and a sixth leaping between two of its notches on wall time;
//   - Pachypodium in white flower on the hero crests (trembling), and THE TROOP: 24 Decken's
//     sifakas in one draw (2,242 triangles each: long back, heavy folded thighs, long shins and dark
//     feet, slim arms and dark hands, a bare dark face in a white ruff, amber eyes, small dark ears, a long
//     furred tail; about 850 of the triangles are locks of fur standing off the skin along every outline).
//     The fur takes the scene's light: sun on the side turned to it (above the sun line), the rock's violet
//     on the other, a rim toward the sun; it has no light of its own. Three more animals are placed for the
//     lens: one crosses the gap 7 m ahead at path fractions 0.08 and 0.34, one dives wall to wall down the
//     gaze in the fissure (in the air at 0.43, 0.455, 0.48, 0.505); opts.crossU / diveU move them. A pose is
//     sixteen angles an animal, worked out on the CPU each frame (clinging poses are solved from
//     where the hands and feet must be on the root, wall or tooth; a leap runs push, tuck-and-turn,
//     feet-first reach) and laid on the bones in the vertex shader; four carry an infant.
//
// STYLE / SHADING (no styleNote: naturalistic). One ShaderMaterial for all stone, in hero-local
// space, ignores scene lights, writes linear HDR, honours scene fog. The rule that carries the look:
// direct gold sun exists only above a height envelope (uBandLo = 65 m, noisy), times Lambert on
// flute-perturbed normals, times a scrolling cloud shadow and up to 8 soft sphere shadows
// (uTerm = 1, dawn: the sun lies flat on every face turned to it and stops at a hard terminator).
// Near faces are read as limestone in courses: bedding slits with a lit lip, flutes that start afresh in
// every bed with a lit razor crest and a dark runnel, tafoni, lichen, rust; all of it in metres along the
// face and world height, and nothing finer than a pixel is drawn. Looking down a wall the flutes give way
// to the beds. The dawn mist (uMist) is an analytic layer; from above its top is a lit, billowed sea with
// long shadows across it. The walls of the fissure and the canyon carry a flag (aAux.z = 1; a world's
// ledges on them 2, or 3 on the wall that faces away from the sun): on them the runnels run unbroken from
// top to bottom, the beds are of unequal thickness and show in broken lengths, and nothing closes into a
// cell when the wall is seen end-on. uMistSlot (rgb, density per metre) is the mist between those walls,
// in shade: the world turns it on as the lens comes to the lip (a > 0) and sets its colour.
// (uShadow: slots 0-2 are yours via setShadow, 3-7 follow the nearest sifakas). Below it: violet
// sky fill (palette[2]) with a fixed "form" direction, darkening down the slots, turning to deep
// green / emerald (palette[5], [4]) near the floor; fresnel gold rims, and edges that burn when
// you look toward the sun. Own haze (uHaze, gold toward the sun) is applied before scene fog.
// To match: light your terrain / flora with sunDir = anchors.sunDir, sun colour gold x 2.5,
// shade colour = palette violet, and only sun-light what is above ~65 m.
//
// opts: palette [stone, gold, violet, haze, emerald, deep, cream]; hour 'gold' | 'dawn' | 'noon' |
//   'blue'; weather 'dry' | 'rain' (dark glossy stone); sunDir (hero-local, toward the sun);
//   haze (density of the built-in haze, default 0.0009; 0 to rely on scene fog); pocket (0..1
//   strength of the emerald glow in the depths); troop (18..30 animals, default 24); bend (radius
//   of the canyon's arc, 170), approach (bearing of the upper line, 11 deg), crestEnd (24 m),
//   caveBack (100 m: how far short of the portal the alcove's face stands), archBack / archY (the fallen
//   blade: 52.5 m short of the portal, its crest at 12.3 m), leadHop (5: the crest hop on which the lead
//   animal stands hopping on the spot while the ride opens).
//
// Returned extras: setProgress(u) keys the scripted troop to the camera (T = 40 u seconds: lead
//   animal hops the crest 8 m ahead and stays one tip ahead of the landings (landingTimes: the lens
//   is on landing k at 19 s x its distance along the line / 204 m, on the lip at 19 s), turning to
//   face whoever follows as soon as it lands; the companion and two escorts fly the 4th bound
//   beside the lens (escortTips); the cascade drops into the fissure from T = 14.7 and goes down
//   wall to wall, clinging flank-on (ricochet2: each leaves a hold a set distance ahead of the
//   lens), T = 19..23.5, while the lead drops down five aerial roots hung 2 m either side of the
//   flight line: it reaches the last as the lens comes to path fraction 0.55, 8.4 m ahead, clings
//   there in three-quarter profile and leaps up and away to the wall before the lens passes
//   (anchors.timing gives the path fractions; a world must map u to T through them). One
//   animal waits on an aerial root 21 m short of the portal). From the canyon floor (slot) the gold
//   band follows the wall's own face rather than every flute, and the portal's light lies on the
//   stream as far as 170 m but on stone only within a few metres. Until it
//   is called the script loops on wall time (26 s), so the piece is alive in a portal preview.
//   setShadow(i 0..2, localPos, radius) for the hawk / our own shadow; sifakaPosition(i, out);
//   uniforms (uHaze, uPocket, uWet, uBandLo, uSunCol, uSky, uPortalCol = the portal's light on
//   stone and fur, uPocketAir, uFogTop ...); wallAt / wallOff / notch (the canyon walls' real
//   surface, for things that grow on them); roles {lead, escorts, waiting}; counts; fieldExtent.
//
// anchors (hero-local): portalSeat {position (0,4.5,0), facing (back down the canyon), radius 7};
//   heading (final flight direction, ~35 deg east of north); entry {position, direction};
//   crest [start, end] (top of the causeway; eye rides 0.9 m above); landings[0..9] (0 = end of
//   crest at 78.6 m, 1-2 the dropping leaps to 70 and 66 m, 3-8 the street at 63-66 m, 9 the lip
//   ledge at 67 m: exact tooth tips, eye lands 0.9 m above); timing {uLand[], uLip, uBottom, uOut,
//   tOut}; companionTips; flyThrough (entry, crest, an apex and a touchdown per
//   bound, the dive down the fissure centre, pull-out, canyon at 4-5 m, portal: 1.8 m+ from walls
//   in the fissure, 6 m+ in the canyon; over the tips it is 0.9 m by design); lip; fissure
//   [top, bottom]; canyon [{x, z, halfWidth}] centreline every 12 m; towerTops, towers, spires;
//   bridge {center, underside, span}; waitingSifaka; escortTips; cave {s, position, normal,
//   right, width, height}; sunDir; viewpoints.
//
// Size: radius 78 / height 104 is the Cathedral (what the viewer orbits); the field is fieldExtent.
// Cost: about 185-200k triangles, 8 draw calls (2 hero-blade variants, mid, far, the static stone, the roots,
// Pachypodium, sifakas), no lights, no textures, 150-270 ms of build JS on the shared test machine.
// Not built here (world coder): rootlet curtains, dust / petal sprites, the hawk, the rare shearing blade.
// Expects: late sun low in the west (-X), a peach-to-violet sky, fog / haze toward palette[3].
import * as THREE from 'three';

const DEF_PAL = ['#8C8F98', '#F6C469', '#463C68', '#E8C7A0', '#2FA45C', '#10312A', '#F4EEE2'];
const TOP = 78;                       // level of the blade tops above the stream (y = 0)
const DEG = Math.PI / 180;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ geometry accumulator
// attributes: position, normal (computed), color (linear rgb tint / baked occlusion),
// aAux = (flute coordinate in metres | sway weight, kind, crest jag in metres, metres below the crest
// for blades whose teeth are cut per pixel, else 1000)
// kinds: 0 rock, 1 bark, 2 petal, 3 floor / stream, 4 root
class Geo {
  constructor() { this.p = []; this.c = []; this.a = []; this.idx = []; this.n = 0; }
  v(x, y, z, r, g, b, fl, kind, top = 0, below = 1000) { this.p.push(x, y, z); this.c.push(r, g, b); this.a.push(fl, kind, top, below); return this.n++; }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  get tris() { return this.idx.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aAux', new THREE.Float32BufferAttribute(this.a, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeVertexNormals();
    return g;
  }
}

// ------------------------------------------------------------------ the fin generator
// A lofted lens-section limestone blade: knife crest with real teeth, every tooth carried down
// the flanks as a buttress between runnels (flutes are geometry here, finer ones are shaded).
// o: len, y0, y1, tTop, tBase, nA, rows (0 crest .. 1 base), toothDepth, toothVar, endDrop,
//    grow, flute, bow, tPow, top (crest weight for per-instance jag), peakAt (-1..1 or undefined)
// xf(x,y,z) -> [x,y,z] optional transform.  Returns { peak:[x,y,z] } (highest tooth).
function finGeo(g, o, rng, xf) {
  const nA = o.nA, rows = o.rows, nR = rows.length;
  const crest = new Float32Array(nA + 1), ridge = new Float32Array(nA + 1);
  // control points alternate tooth / notch
  const ctrl = [];
  let col = 0, isPeak = rng.chance(0.5), last = 0;
  const maxStep = o.toothStep || 2;
  while (col <= nA) {
    let drop;
    if (isPeak) { drop = rng.range(0, o.toothVar); last = drop; }
    else drop = last + rng.range(0.45, 1) * o.toothDepth;
    ctrl.push({ col, drop, r: isPeak ? 1 : 0 });
    col += rng.int(1, maxStep); isPeak = !isPeak;
  }
  if (ctrl[ctrl.length - 1].col < nA) ctrl.push({ col: nA, drop: last + o.toothDepth, r: 0 });
  // the main tooth: the peak nearest to peakAt gets drop 0
  const want = ((o.peakAt ?? rng.range(-0.45, 0.45)) * 0.5 + 0.5) * nA;
  let best = null;
  for (const c of ctrl) if (c.r === 1 && (!best || Math.abs(c.col - want) < Math.abs(best.col - want))) best = c;
  if (!best) { best = ctrl[Math.min(ctrl.length - 1, 1)]; best.r = 1; }
  for (let i = 0, k = 0; i <= nA; i++) {
    while (k < ctrl.length - 2 && ctrl[k + 1].col <= i) k++;
    const a = ctrl[k], b = ctrl[Math.min(k + 1, ctrl.length - 1)];
    const t = b.col > a.col ? Math.min(1, Math.max(0, (i - a.col) / (b.col - a.col))) : 0;
    const s = -1 + (2 * i) / nA;
    crest[i] = lerp(a.drop, b.drop, t) + Math.pow(Math.abs(s), o.endPow || 2.4) * o.endDrop;
    ridge[i] = lerp(a.r, b.r, t);
  }
  const off = crest[best.col]; for (let i = 0; i <= nA; i++) crest[i] = Math.max(0, crest[i] - off) + (i === best.col ? 0 : 0.05);
  const bow = o.bow || 0, grow = o.grow ?? 0.2, kind = o.kind || 0, ph = rng.range(0, 6.28);
  const put = (x, y, z, sh, fl, top, below) => {
    const q = xf ? xf(x, y, z) : [x, y, z];
    return g.v(q[0], q[1], q[2], sh, sh, sh, fl, kind, top, below);
  };
  for (const side of [1, -1]) {
    const base = g.n;
    for (let j = 0; j < nR; j++) {
      const v = rows[j];
      for (let i = 0; i <= nA; i++) {
        const s = -1 + (2 * i) / nA;
        const cy = o.y1 - crest[i];
        const y = cy + (o.y0 - cy) * v;
        const plan = Math.sqrt(Math.max(0, 1 - s * s));
        const x = s * o.len * 0.5 * (1 + grow * v);
        let t = (o.tTop + (o.tBase - o.tTop) * Math.pow(v, o.tPow || 0.7)) * plan;
        const gs = sstep(0, 0.1, v) * (1 - 0.45 * v) * (o.flute ?? 0.5);
        t *= 1 - (1 - ridge[i]) * gs;
        t *= 1 + 0.12 * Math.sin(v * 9 + s * 5 + ph + side);
        const z = side * 0.5 * t + bow * (1 - s * s) + (o.lean || 0) * (1 - v);
        const sh = (0.66 + 0.34 * ridge[i]) * (1 - 0.1 * v);
        put(x, y, z, j === 0 ? 1 : sh, x, j === 0 ? (o.top || 0) : 0, o.cut ? cy - y : 1000);
      }
    }
    const W = nA + 1;
    for (let j = 0; j < nR - 1; j++) for (let i = 0; i < nA; i++) {
      const a = base + j * W + i, b = a + 1, c = b + W, d = a + W;
      if (side > 0) g.quad(a, d, c, b); else g.quad(a, b, c, d);
    }
  }
  const sp = -1 + (2 * best.col) / nA;
  const pk = [sp * o.len * 0.5, o.y1, bow * (1 - sp * sp) + (o.lean || 0)];
  const crestY = (x) => {                        // crest height at local x (before xf)
    const f = Math.min(nA, Math.max(0, ((x / (o.len * 0.5)) * 0.5 + 0.5) * nA)), i = Math.min(nA - 1, Math.floor(f));
    return o.y1 - lerp(crest[i], crest[i + 1], f - i);
  };
  return { peak: xf ? xf(pk[0], pk[1], pk[2]) : pk, crestY };
}

// rigid transform helper: yaw about Y, then translate (plus optional tilt toward local +z)
function placer(px, py, pz, yaw, tilt = 0) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return (x, y, z) => { const zz = z + y * tilt; return [px + x * c + zz * s, py + y, pz - x * s + zz * c]; };
}

// ------------------------------------------------------------------ the one stone shader
const ROCK_VERT = /* glsl */`
attribute vec3 color;
attribute vec4 aAux;
#ifdef USE_INSTANCING
attribute float aSeed;
#endif
uniform float uTime;
varying vec3 vPos;
varying vec3 vNrm;
varying vec3 vCol;
varying vec4 vAux;
varying float vCut;
varying float vWall;
#include <fog_pars_vertex>
float vhash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 p = position; vec3 n = normal; float seed = 0.0; float fl = aAux.x; float inst = 0.0; float wallF = aAux.z;
  #ifdef USE_INSTANCING
    seed = aSeed; inst = 1.0; wallF = 0.0;
    p.y -= aAux.z * vhash(vec2(floor(position.x * 2.0 + 40.0), seed * 91.7));
    mat3 m = mat3(instanceMatrix);
    vec3 sc = vec3(dot(m[0], m[0]), dot(m[1], m[1]), dot(m[2], m[2]));
    fl *= sqrt(sc.x);
    p = (instanceMatrix * vec4(p, 1.0)).xyz;
    n = m * (n / max(sc, vec3(1e-6)));
  #endif
  float kind = aAux.y;
  if (kind > 1.5 && kind < 2.5) {            // petals tremble
    p += aAux.x * 0.05 * vec3(sin(uTime * 7.3 + p.x * 3.0 + seed * 40.0), sin(uTime * 9.1 + p.z * 2.0), cos(uTime * 6.2 + p.y * 3.0 + seed * 17.0));
  } else if (kind > 3.5) {                   // hanging roots sway
    float w = aAux.x * aAux.x;
    p.x += w * 0.9 * sin(uTime * 0.7 + p.y * 0.07 + p.z * 0.3);
    p.z += w * 0.7 * sin(uTime * 0.9 + p.y * 0.05 + p.x * 0.3 + 1.7);
  } else if (kind > 0.5 && kind < 1.5) {     // pachypodium branches nod in gusts
    p.x += aAux.x * 0.04 * sin(uTime * 2.3 + p.z * 0.4 + seed * 30.0);
  }
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vPos = wp.xyz; vNrm = mat3(modelMatrix) * n; vCol = color; vAux = vec4(fl, kind, floor(seed * 1024.0 + 0.5) / 1024.0, inst); vCut = aAux.w; vWall = wallF;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const ROCK_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uDeep, uGreen, uStone, uHazeCol, uCream, uCam, uDeepFill, uPortalCol;
uniform float uTime, uTop, uHaze, uPocket, uWet, uBandLo, uPocketAir, uFogTop, uTerm;
uniform vec4 uShadow[8];
uniform vec4 uMist;          // bottom y, top y, density, ramp width
uniform vec3 uMistCol;
uniform vec4 uMistSlot;      // the mist down in the fissure, which no sun reaches: its colour, and its density (per metre)
uniform vec4 uSlotSeg;       // the fissure's axis in plan: (x, z) of its head and of its foot
float mistR(float y, float s, float w){ float t = clamp((y - s) / w, 0.0, 1.0); return w * 0.5 * t * t + max(y - s - w, 0.0); }
float mistF(float y, float top){ return mistR(y, uMist.x, uMist.w) - mistR(y, top - uMist.w, uMist.w); }
float mistAmt(vec3 cam, vec3 pos, float dist, float top, float k){      // top: where the layer ends above this point (it billows); k: its density
  float dy = pos.y - cam.y;
  float dens = clamp(min((cam.y - uMist.x) / uMist.w, (top - cam.y) / uMist.w), 0.0, 1.0);
  float mean = abs(dy) < 0.05 ? dens : (mistF(pos.y, top) - mistF(cam.y, top)) / dy;
  return 1.0 - exp(-k * dist * max(mean, 0.0));
}
varying vec3 vPos;
varying vec3 vNrm;
varying vec3 vCol;
varying vec4 vAux;
varying float vCut;
varying float vWall;
#include <fog_pars_fragment>
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash22(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){ return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.13 + 7.1) + 0.15 * vnoise(p * 4.7 + 3.3); }
// the same, each octave fading to its mean once its cells are smaller than a few pixels (w: noise units under one pixel)
float fbmF(vec2 p, float w){
  return 0.55 * mix(0.5, vnoise(p), 1.0 - smoothstep(0.2, 0.6, w)) + 0.3 * mix(0.5, vnoise(p * 2.13 + 7.1), 1.0 - smoothstep(0.2, 0.6, w * 2.13)) + 0.15 * mix(0.5, vnoise(p * 4.7 + 3.3), 1.0 - smoothstep(0.2, 0.6, w * 4.7));
}
// gradient noise: unlike the value noise above, its slopes show no lattice (the lit and shaded sides of the mist's billows are taken from slopes)
float gnoise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 ga = hash22(i) * 2.0 - 1.0, gb = hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, gc = hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, gd = hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  return 0.5 + 0.7 * mix(mix(dot(ga, f), dot(gb, f - vec2(1.0, 0.0)), u.x), mix(dot(gc, f - vec2(0.0, 1.0)), dot(gd, f - vec2(1.0, 1.0)), u.x), u.y);
}
float gfbm(vec2 p){ return 0.55 * gnoise(p) + 0.3 * gnoise(mat2(0.8, 0.6, -0.6, 0.8) * p * 2.13 + 7.1) + 0.15 * gnoise(mat2(0.6, 0.8, -0.8, 0.6) * p * 4.7 + 3.3); }
// solution pits: a round hollow in most cells; x = how far inside one we are, y = height inside it (-1 bottom .. 1 top)
vec2 pits(vec2 p){
  vec2 g = floor(p), f = fract(p), o = hash22(g);
  float h = fract(o.x * 7.3 + o.y * 3.1);
  float r = 0.06 + 0.3 * h * h;                              // mostly small, a few three times the size
  vec2 d = f - (r + 0.04 + (0.92 - 2.0 * r) * o);            // anywhere in the cell a whole hollow fits: no rows
  float m = 1.0 - smoothstep(r * 0.5, r, length(d * vec2(1.0, 0.75 + 0.5 * o.y)));
  return vec2(m * step(0.45, fract(o.y * 5.7 + o.x)), clamp(d.y / r, -1.0, 1.0));
}
void main(){
  // the blade's own number is the same at its three corners but not bit for bit across a face once interpolated: it is snapped back
  // here, or every hash made from it flickers from pixel to pixel (a screen of dots over the stone)
  float kind = vAux.y, seed = floor(vAux.z * 1024.0 + 0.5) / 1024.0;
  if (vCut < 60.0) {                          // far blades: the teeth of the crest are cut per pixel
    float xx = vAux.x * 0.23 + seed * 53.0, x2 = xx * 2.7 + 0.37;
    float p1 = (1.0 - abs(fract(xx) - 0.5) * 2.0) * (0.45 + 0.55 * hash2(vec2(floor(xx), seed * 7.0)));
    float p2 = (1.0 - abs(fract(x2) - 0.5) * 2.0) * (0.3 + 0.55 * hash2(vec2(floor(x2), seed * 3.0)));
    float D = 4.0 + 6.0 * fract(seed * 13.7);
    if (vCut < D * (1.0 - max(p1, p2))) discard;
  }
  vec3 N = normalize(vNrm + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) N = -N;
  vec3 Ng = N;                                              // the face itself, before the flutes turn the normal
  vec3 toCam = uCam - vPos;
  float dist = length(toCam);
  vec3 V = toCam / max(dist, 1e-3);
  float y = vPos.y, X = vAux.x;
  float isRock = 1.0 - step(0.5, kind);
  float pxm = fwidth(X) + fwidth(y);                           // metres of stone under one pixel: nothing finer than that is drawn (no screen of dots, no moire)
  float fluteFade = isRock * (1.0 - smoothstep(30.0, 150.0, dist));
  float nearFade = isRock * (1.0 - smoothstep(18.0, 70.0, dist));
  float closeFade = isRock * (1.0 - smoothstep(6.0, 22.0, dist));
  float slot = 1.0 - smoothstep(58.5, 65.5, uCam.y);          // 1 once the eye is down in the fissure: there the stone is read from 3 m, not from 30
  float nearS = isRock * (1.0 - smoothstep(9.0, 30.0, dist));  // and wherever a face is within a few metres of the eye (the street between the blades): the same close reading
  float slotW = max(slot, smoothstep(0.0, 0.011, uMistSlot.a) * step(0.5, vWall));   // (the walls of the fissure are read that way from the moment the lens tips over the lip)
  float near = max(slotW, nearS);
  float down = smoothstep(0.42, 0.85, abs(V.y));               // looking down (or up) a wall its flutes foreshorten into rays: there the beds carry the wall, not the flutes
  vec3 sunH = normalize(vec3(uSun.x, 0.0, uSun.z) + vec3(1e-4, 0.0, 0.0));
  // the walls of the fissure and the canyon (and the ledges that stand out of them, vWall = 2) are read end-on in the dive and as a backdrop from the
  // floor: on them the runnels run unbroken from top to bottom, the beds show only in broken lengths and nothing closes into a cell
  float wallK = step(0.5, vWall), ledgeK = step(1.5, vWall);
  // ---- bedding: the limestone lies in beds of unequal thickness, 2 to 9 m. Each bedding plane is eaten back into a dark slit, the top edge of the
  // bed below it is a lit lip, and every bed has its own tone, its own flutes and a damp dark foot: the wall is a stack of courses.
  // The beds do not run through: every 6 to 10 m a vertical master joint cuts the wall and the beds step up or down across it.
  float colX = X * 0.12 + seed * 5.0 + 0.35 * vnoise(vec2(y * 0.045 + seed * 2.0, floor(X * 0.12 + seed * 5.0 + 0.5) * 1.7));
  float colF = fract(colX), colD = min(colF, 1.0 - colF);
  float bedF = y * 0.3 + 2.0 * vnoise(vec2(seed * 3.3 + 0.7, y * 0.066)) + 0.4 * vnoise(vec2(X * 0.05 + seed * 3.0, y * 0.03)) + 0.1 * vnoise(vec2(X * 0.83 + seed * 7.0, y * 0.21)) + mix(0.9, 0.1, wallK) * hash2(vec2(floor(colX), seed * 3.1 + 1.0));
  float bedId = floor(bedF), bfr = bedF - bedId, bd = min(bfr, 1.0 - bfr), ju = 1.0 - bfr;
  float bh = hash2(vec2(bedId, seed * 3.7 + 2.0)), bh2 = hash2(vec2(bedId * 1.7 + 5.0, seed * 9.1));
  float bw = fwidth(bedF);
  float jw = max(0.016, 1.2 * bw);
  float jointFade = isRock * (1.0 - smoothstep(60.0, 190.0, dist));
  float jOpen = 0.6 + 0.4 * smoothstep(0.3, 0.6, vnoise(vec2(X * 0.27 + seed, bedId * 3.7)));           // the slit gapes and narrows along a blade, it never closes
  jOpen = mix(jOpen, smoothstep(0.42, 0.6, vnoise(vec2(X * 0.19 + 5.0, bedId * 3.7 + 1.0))) * (1.0 - 0.75 * down), wallK);   // on a wall it shows in lengths, and looking down the wall hardly at all
  float jointS = (1.0 - smoothstep(jw * 0.5, jw * 1.5, bd)) * jointFade * jOpen * min(1.0, 0.03 / jw + 0.45);
  float jointT = (1.0 - smoothstep(0.0, 0.045, bd)) * isRock * (1.0 - smoothstep(40.0, 160.0, dist));     // over the tops: a soft line, as the beds read from afar
  float lipW = max(0.035, 2.2 * bw);
  float lip = smoothstep(jw * 0.9, jw * 1.8, ju) * (1.0 - smoothstep(lipW * 0.7, lipW * 1.7, ju)) * jointFade * jOpen * min(1.0, 0.05 / lipW + 0.3);
  float foot = (1.0 - smoothstep(0.0, 0.3, bfr)) * jointFade;                                             // the foot of each bed, set back under nothing, damp: darker
  float bd2 = abs(bfr - (0.3 + 0.4 * hash2(vec2(bedId, seed * 5.3 + 3.0))));                              // one parting inside some of the beds, at its own height, in lengths
  float jointM = 0.3 * (1.0 - smoothstep(jw * 1.0, jw * 3.0, bd2)) * nearFade * step(0.5, bh) * smoothstep(0.45, 0.6, vnoise(vec2(X * 0.3 + seed, bedId * 0.71 + 2.0)));
  float cw = max(0.006, 0.15 * fwidth(X));
  float crack = (1.0 - smoothstep(cw * 0.6, cw * 1.8, colD)) * jointFade * (1.0 - 0.8 * wallK) * smoothstep(0.36, 0.56, vnoise(vec2(floor(colX + 0.5) * 5.3 + seed, y * 0.17)));   // the master joint shows as a crack only in lengths
  float joint = max(max(mix(0.3 * jointT, 0.78 * jointS, max(near, 0.6 * jointFade)), jointM), 0.5 * crack) * (1.0 - 0.6 * down);
  // ---- flutes (rillenkarren): razor crests, narrow dark runnels, flat flanks between them. They run straight down and start
  // afresh in every bed, so no stripe is longer than a bed is thick.
  float fu = X * 2.1 + seed * 37.0 + mix(2.6, 1.2, wallK) * vnoise(vec2(X * 0.33 + seed * 11.0, y * 0.045)) + 1.1 * (bh - 0.5) * (1.0 - wallK);
  float massive = (1.0 - smoothstep(0.13, 0.2, bh2)) * near * (1.0 - wallK * down);                      // a bed in six is massive: smooth pale stone with hardly a flute on it
  float sw = sin(fu), ridge = 1.0 - abs(sw), slope1 = -sign(sw) * cos(fu);
  vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), N) + vec3(1e-4, 0.0, 0.0));
  float a1 = fluteFade * (1.0 - 0.3 * down * (1.0 - wallK)) * (1.0 - 0.6 * massive);
  N = normalize(N + T * slope1 * 0.85 * a1);
  float bedFl = mix(1.0, 0.35 + 0.9 * bh2, near) * (0.55 + 0.45 * smoothstep(0.0, 0.5, bfr));           // some beds are massive, some cut to ribbons; the flutes are sharpest under the top of a bed
  bedFl = mix(bedFl, 0.7 + 0.3 * bh2, wallK) * (1.0 - massive);
  float fu2 = fu * 3.3 + 6.283 * bh2 * (1.0 - wallK) + 1.3 * vnoise(vec2(X * 1.1 + seed * 5.0, y * mix(0.11, 0.05, wallK)));
  float sw2 = sin(fu2), ridge2 = 1.0 - abs(sw2), slope2 = -sign(sw2) * cos(fu2);
  // (on a wall seen end-on a pixel covers metres of height but only centimetres along the wall: there the flutes fade by their own width on screen, not by the pixel's footprint)
  float a2 = nearFade * bedFl * mix((1.0 - smoothstep(0.05, 0.16, pxm)) * (1.0 - 0.4 * down), 1.0 - smoothstep(0.9, 2.0, fwidth(fu2)), wallK);
  N = normalize(N + T * slope2 * mix(0.45, 0.9, nearS) * a2);
  float fu3 = fu * 8.7 + 6.283 * bh * (1.0 - wallK) + 2.0 * vnoise(vec2(X * 2.3 + 3.0, y * mix(0.31, 0.08, wallK) + seed * 7.0));
  float sw3 = sin(fu3), ridge3 = 1.0 - abs(sw3), slope3 = -sign(sw3) * cos(fu3);
  float a3 = closeFade * bedFl * mix((1.0 - smoothstep(0.018, 0.055, pxm)) * (1.0 - 0.7 * down), 1.0 - smoothstep(0.9, 2.0, fwidth(fu3)), wallK);
  N = normalize(N + T * slope3 * mix(0.3, 0.6, nearS) * a3);
  // the flank of each flute turned to the bright side of the sky is lit, the other dark, and the crest between them is a hard line
  float sK = dot(T, sunH); sK = (sK < 0.0 ? -1.0 : 1.0) * max(abs(sK), 0.55);
  float flank = clamp((slope1 * 0.6 * a1 + slope2 * 0.55 * a2 + slope3 * 0.3 * a3) * sK, -1.0, 1.0);
  float e1 = max(0.045, 1.3 * fwidth(fu)), e2 = max(0.07, 1.3 * fwidth(fu2));
  float crest = max((1.0 - smoothstep(0.0, e1, 1.0 - ridge)) * a1 * min(1.0, 0.09 / e1),
                    (1.0 - smoothstep(0.0, e2, 1.0 - ridge2)) * a2 * min(1.0, 0.14 / e2) * 0.8);
  // solution hollows, in clusters: honeycombed patches a few metres across, clean stone between them (drawn only while a hollow is wider than a pixel)
  vec2 pt = pits(vec2(X, y) * 1.9 + seed * 17.0);
  float pm = smoothstep(0.5, 0.68, vnoise(vec2(X * 0.31 + seed * 9.0, y * 0.27 + 5.0)));
  // the large hollows of a honeycombed face (tafoni, a hand to a forearm across), in patches; they read from ten metres
  vec2 pt0 = pits(vec2(X * 0.83 + y * 0.19, y * 0.9 - X * 0.11) + seed * 23.0);
  float pm0 = smoothstep(0.5 - 0.12 * down, 0.64 - 0.12 * down, vnoise(vec2(X * 0.16 + seed * 5.0, y * 0.13 + 11.0)));
  float pk = closeFade * (0.35 + 0.65 * near) * (1.0 - smoothstep(0.015, 0.05, pxm)), pk0 = near * nearFade * (1.0 - smoothstep(0.05, 0.16, pxm));
  float pit = max(pt.x * pm * pk, pt0.x * pm0 * pk0);
  float pitLit = max(pt.x * pt.y * pm * pk, pt0.x * pt0.y * pm0 * pk0);      // the upper lip of a hollow is dark, its floor catches light
  float plunge = max(slotW * smoothstep(7.0, 24.0, uCam.y), nearS);        // on the way down the fissure and along the street the walls are read from 3 m; from the canyon floor they are a backdrop again
  float gMin = mix(0.4, 0.34, plunge);
  // some runnels are cut deep: seen from inside the fissure their floors are the darkest thing on the wall, in broken lengths
  float fidR = floor(fu / 3.14159);
  float deepRun = (1.0 - smoothstep(0.04, 0.13 + 0.6 * fwidth(fu), ridge)) * step(0.36, hash2(vec2(fidR, seed * 3.0 + 5.0)))
    * smoothstep(0.3 - 0.16 * wallK, 0.5 - 0.16 * wallK, vnoise(vec2(fidR * 7.3 + seed, y * mix(0.11, 0.035, wallK) + bh * 9.0 * (1.0 - wallK)))) * plunge * fluteFade * (1.0 - 0.6 * down * (1.0 - wallK));
  float grooveAO = mix(1.0, gMin + (1.0 - gMin) * smoothstep(0.0, 0.3, ridge), a1)
    * mix(1.0, 0.5 + 0.5 * smoothstep(0.0, 0.34, ridge2), a2 * (0.6 + 0.4 * nearS))
    * mix(1.0, 0.72 + 0.28 * smoothstep(0.0, 0.4, ridge3), a3)
    * (1.0 + 0.5 * flank * (0.5 + 0.5 * near))
    * (1.0 - mix(0.45, 0.6, nearS) * pit - 0.26 * pitLit) * (1.0 - joint) * (1.0 - 0.22 * foot * (0.4 + 0.6 * near) * (1.0 - 0.5 * down)) * (1.0 + mix(0.6 + 0.5 * down, 0.5 - 0.32 * down, wallK) * lip)
    * mix(0.78 + 0.3 * vnoise(vec2(X * 0.5 + seed * 20.0, y * 0.02)), 1.0, fluteFade);
  // ---- albedo: grey limestone in courses, mottling of the same grain both ways, grey and orange lichen crusts, rust running
  // down from the bedding planes, moss in patches
  float n1 = fbm(vec2(X * 0.21 + seed * 13.0, y * 0.17));
  float n2 = fbmF(vec2(X * 0.5 + seed * 5.0, y * mix(0.11, 0.34, wallK)), pxm * 0.5);
  float m1 = fbmF(vec2(X * 0.8 + seed * 7.0, y * 0.8 + 2.0), pxm * 0.8);
  float m2 = mix(0.5, vnoise(vec2(X * 3.9 + 1.0, y * 3.9 + seed * 3.0)), 1.0 - smoothstep(0.05, 0.16, pxm));
  float m3 = mix(0.5, vnoise(vec2(X * 17.0 + 5.0, y * 17.0)), 1.0 - smoothstep(0.012, 0.04, pxm));
  vec3 alb = uStone * (0.74 + 0.5 * n1);
  alb *= mix(1.0, (0.76 + 0.48 * m1 + 0.25 * down * (m1 - 0.5)) * (0.86 + 0.28 * m2), nearFade) * mix(1.0, 0.88 + 0.24 * m3, closeFade);
  alb *= mix(1.0, 0.86 + 0.28 * bh, jointFade * (0.5 + 0.5 * near));                                         // every bed its own grey
  alb *= 1.0 + 0.14 * massive;
  alb *= mix(vec3(1.0), (0.84 + 0.3 * bh) * mix(vec3(1.07, 1.0, 0.9), vec3(0.93, 0.98, 1.1), bh2), wallK * jointFade);   // on the walls the strata differ more, some warmer, some bluer
  alb *= mix(1.0, 0.72, smoothstep(0.5, 0.85, n2) * isRock);
  float lichN = fbmF(vec2(X * 0.55 + seed * 3.0, y * 0.5 + 9.0), pxm * 0.55) + (0.1 * (m2 - 0.5) + 0.05 * (m3 - 0.5)) * nearFade;
  float lich = smoothstep(0.65 - 0.02 * nearS, 0.74 - 0.06 * nearS, lichN) * smoothstep(uTop - 30.0, uTop - 6.0, y) * isRock;
  float lichO = step(0.42, fract(seed * 7.31 + n1 + 0.35 * floor(lichN * 9.0)));                          // orange crusts and grey ones, side by side
  alb = mix(alb, mix(vec3(0.58, 0.3, 0.09), vec3(0.42, 0.44, 0.40), lichO) * (0.8 + 0.4 * m2), lich * mix(0.6, 0.72, nearS));
  float lgN = fbmF(vec2(X * 0.9 + seed * 4.0, y * 0.9 + 3.0), pxm * 0.9) + 0.08 * (m2 - 0.5);
  float lichG = smoothstep(0.585, 0.635, lgN) * smoothstep(0.4, 0.6, vnoise(vec2(X * 0.13 + 9.0, y * 0.11 + seed * 6.0))) * jointFade * (1.0 - smoothstep(0.12, 0.3, pxm));
  alb = mix(alb, uStone * vec3(1.5, 1.56, 1.42) * (0.85 + 0.3 * m2), lichG * 0.55);                        // pale grey lichen crusts, a hand to an arm across
  float rustN = vnoise(vec2(X * 1.05 + seed * 3.0 + 0.25 * vnoise(vec2(y * 0.9, seed)), bedId * 5.1 + 0.6));
  float rust = smoothstep(0.6, 0.8, rustN) * bfr * bfr * (1.0 - 0.5 * lip) * jointFade;                    // iron bleeding out of a bedding plane and running a metre or two down the bed below
  alb = mix(alb, vec3(0.4, 0.2, 0.085) * (0.75 + 0.5 * m1), rust * 0.6);
  float mossH = 1.0 - smoothstep(8.0, 58.0, y);
  float mossN = fbmF(vec2(X * 0.17 + seed * 3.0, y * 0.17 + 4.0), pxm * 0.17) + 0.3 * (m1 - 0.5) + 0.16 * (m2 - 0.5) + 0.12 * mossH + 0.07 * (1.0 - smoothstep(0.0, 0.12, bfr)) * near;
  mossN += wallK * (0.45 * smoothstep(0.3, 0.8, Ng.y) + 0.1 * (1.0 - smoothstep(1.0, 8.0, y)));          // on a wall it lies on whatever is turned up to the sky (the ledges) and climbs from the damp foot
  float moss = smoothstep(mix(0.55, 0.59, wallK), mix(0.71, 0.67, wallK), mossN + 0.07 * (m3 - 0.5)) * step(0.001, mossH) * isRock;          // soft-edged cushions, thickest in the hollows
  alb = mix(alb, mix(vec3(0.045, 0.105, 0.04), vec3(0.13, 0.215, 0.06), m2) * (0.7 + 0.6 * m3), moss * 0.88);
  alb *= mix(vCol, vec3(0.45 + 0.55 * vCol.r), wallK * (1.0 - ledgeK));                                    // (the walls' ribs are in their shape: their baked shade is halved, or it reads as streaks)
  alb *= 1.0 - 0.3 * wallK * (1.0 - smoothstep(1.0, 8.0, y + 4.0 * (m1 - 0.5)));                           // the foot of a wall is damp and dark
  if (kind > 0.5 && kind < 1.5) {             // pachypodium: silver bark studded with rows of tubercles and their spines (vCol = shade, around, along)
    vec2 q = vec2(vCol.g * 9.0, vCol.b * 6.5); q.x += 0.5 * floor(q.y);
    vec2 c = fract(q) - 0.5; float d = length(c * vec2(1.0, 1.15));
    float knob = 1.0 - smoothstep(0.1, 0.46, d);
    alb = vec3(0.40, 0.385, 0.37) * vCol.r * (0.62 + 0.5 * knob + 0.6 * knob * c.y) * (0.85 + 0.3 * n2);
    alb = mix(alb, vec3(0.05, 0.04, 0.035), (1.0 - smoothstep(0.03, 0.13, d)) * 0.9 * step(0.5, vCol.r));
    N = normalize(N + (T * c.x + vec3(0.0, 1.0, 0.0) * c.y) * knob * 0.9);
  }
  if (kind > 3.5) {                           // fig roots: brown bark in long twisted ridges
    float br = vnoise(vec2((vPos.x + vPos.z * 0.7) * 15.0 + y * 1.1, y * 0.9)), br2 = vnoise(vec2((vPos.x - vPos.z) * 31.0, y * 5.0));
    alb = vCol * vec3(0.25, 0.16, 0.085) * (0.3 + 1.2 * br) * (0.7 + 0.6 * br2);
    N = normalize(N + T * (br - 0.5) * 1.5);
  }
  alb = mix(alb, alb * 0.45, uWet * isRock);
  // ---- the sun rule: gold only in the top band, violet sky light below, green in the depths
  float bandN = vnoise(vPos.xz * 0.035) * 7.0;
  float bandK = bandN + 40.0 * slot * (1.0 - smoothstep(35.0, 110.0, length(vPos.xz)));   // from the floor the keyhole's own walls stay in shade: the ring is the light there
  float band = smoothstep(uBandLo - mix(7.0, 2.5, uTerm) + bandK, uBandLo + mix(4.0, 2.0, uTerm) + bandK, y);
  float cloud = smoothstep(0.30, 0.62, fbm(vPos.xz * 0.0042 + vec2(uTime * 0.045, uTime * 0.02)));
  float gust = smoothstep(0.28, 0.7, fbm(vPos.xz * 0.019 + vec2(uTime * 0.27, uTime * 0.11)));          // smoke haze drifting across the low sun at 15 m/s dapples the gold on the crowns
  float sunVis = band * mix(mix(0.22, 0.6, max(slot, uTerm)), 1.0, cloud) * mix(mix(0.5, 1.0, gust), 1.0, max(slot, uTerm)) * (1.0 - step(2.5, vWall));   // (a ledge on the wall that faces away from the sun is in that wall's shade)
  for (int i = 0; i < 8; i++) {
    vec4 c = uShadow[i];
    vec3 d = vPos - c.xyz;
    float along = -dot(d, uSun);
    float perp = length(d + uSun * along);
    float r = max(c.w, 1e-3);
    sunVis *= 1.0 - 0.8 * step(0.0005, c.w) * step(0.0, along) * (1.0 - smoothstep(r * 0.45, r * 1.5 + max(along, 0.0) * 0.03, perp));
  }
  float ndl = dot(N, uSun);
  float dif = clamp(ndl * 0.9 + 0.1, 0.0, 1.0);
  dif = dif * (0.35 + 0.65 * dif) * 1.12;
  dif = mix(dif, clamp(dot(Ng, uSun) * 0.95 + 0.05, 0.0, 1.0) * (0.75 + 0.25 * dif), 0.7 * slot);   // seen from the canyon floor the gold lies on the sunward wall as one band, not as stripes on every flute
  // dawn: the low sun lies flat on every face turned to it and not at all on the others: one clear terminator down each blade
  dif = mix(dif, smoothstep(-0.02, 0.14, dot(Ng, uSun)) * (0.66 + 0.34 * dif) * 1.05, uTerm);
  float fres = 1.0 - max(dot(N, V), 0.0); fres = fres * fres * fres;
  float depth = 1.0 - smoothstep(4.0, uTop - 18.0, y);
  float slotAO = grooveAO;
  float aoTop = mix(mix(0.66, 0.3, vAux.w), 1.0, smoothstep(uTop - 38.0, uTop + 1.0, y));
  float stoneL = max(dot(uStone, vec3(0.333)), 1e-3);
  float lum = dot(alb, vec3(0.333)) / stoneL;
  vec3 albR = mix(vec3(lum), alb / stoneL, 0.85 * near);
  float form = 0.5 + 0.5 * dot(N, vec3(0.305, 0.79, -0.53));   // the sky strip and the bounce off the lit tops give the shade its form
  vec3 skyFill = uSky * (0.5 + 1.05 * form);
  vec3 deepFill = uDeepFill * (0.5 + 1.0 * form);
  vec3 amb = mix(skyFill * aoTop, deepFill * 0.85, depth * 0.92) * albR;
  vec3 shade = amb * slotAO * 1.35;
  shade += uGreen * uPocket * 0.035 * moss * form;
  vec3 col = shade;
  // the razor crest of every flute catches the sky (and the sun, where the sun reaches): a hard lit edge beside the dark runnel
  float crestK = crest * (1.0 - 0.75 * moss) * (1.0 - joint) * (1.0 - 0.6 * pit);
  col += crestK * (amb * mix(0.75, 1.15, near) + alb * uSunCol * sunVis * smoothstep(-0.35, 0.25, dot(Ng, uSun)) * 0.55);
  col += alb * uSunCol * sunVis * dif * grooveAO;
  col += uSunCol * (0.30 + 0.5 * lum) * fres * sunVis * smoothstep(-0.35, 0.35, ndl) * 0.8;
  float back = max(dot(-V, uSun), 0.0);         // looking toward the sun every edge burns
  col += uSunCol * fres * sunVis * back * back * (0.35 + 0.65 * smoothstep(-0.6, 0.1, ndl)) * 0.9 * isRock;
  col += alb * uSunCol * 0.05 * band;
  // the gold that comes down off the lit top of the sunward wall: a warm wash high on the wall across from it, gone by the time it nears the floor
  col += alb * uSunCol * 0.075 * wallK * slot * smoothstep(uBandLo - 14.0, uBandLo + 16.0, y) * (1.0 - band * smoothstep(-0.02, 0.14, dot(Ng, uSun))) * (0.6 + 0.4 * form);
  col += uWet * uSky * 2.0 * fres * isRock * mix(1.0, 0.3, slot);   // from inside the fissure every flute flank is at a grazing angle: the wet sheen would stripe the whole wall white
  // first rains: thin threads of water slide down some of the runnels, beads of light running along them
  float fid = floor(fu / 3.14159);
  float tw = max(0.07, 1.5 * fwidth(fu));
  float thread = (1.0 - smoothstep(tw * 0.6, tw, abs(fu - (fid + 0.5) * 3.14159))) * step(mix(0.45, 0.8, slot), hash2(vec2(fid, seed * 3.0 + 2.0)));
  thread *= 0.4 + 0.6 * smoothstep(0.2, 0.9, sin(y * 1.7 + uTime * 3.2 + fid * 2.4));
  col += uWet * (uSky * 1.5 + uSunCol * 0.25 * sunVis) * isRock * fluteFade * thread * (0.12 + 0.88 * smoothstep(34.0, 66.0, y)) * mix(1.0, 0.3, slot);
  col = mix(col, vec3(0.0062, 0.005, 0.0175) * (1.0 + 2.0 * band),   // deep violet: after the grade about #17132A, the darkest tone on the wall
    max(deepRun, 0.3 * crack * plunge) * (1.0 - 0.6 * moss));
  vec3 pAlb = alb; float waterK = 0.0;
  if (kind > 1.5 && kind < 2.5) {             // pachypodium petals (vCol = along the petal, across, -): cream, yellow at the throat, the light coming through
    float pr = vCol.r, pa = abs(vCol.g * 2.0 - 1.0);
    vec3 pc = mix(vec3(0.95, 0.72, 0.2), uCream, smoothstep(0.12, 0.42, pr)) * (0.86 + 0.14 * smoothstep(0.0, 0.5, pa)) * (1.0 - 0.18 * smoothstep(0.75, 1.0, pa * pr));
    float lit = 0.3 + 0.5 * max(ndl, 0.0) + 0.45 * max(-ndl, 0.0);
    col = pc * (uSky * (1.5 + 1.1 * (N.y * 0.5 + 0.5)) + uSunCol * sunVis * lit * 0.8 + 0.16);
    pAlb = pc * 0.5;
  } else if (kind > 2.5 && kind < 3.5) {      // slot floor: wet black earth under leaf litter and moss, emerald glints far off, the stream
    float g = fbm(vPos.xz * 0.09);
    float canopy = smoothstep(0.42, 0.7, g);
    float nearG = 1.0 - smoothstep(16.0, 50.0, dist);
    vec2 lp = vPos.xz * 4.6, lo = hash22(floor(lp));
    vec2 ld = fract(lp) - (0.25 + 0.5 * lo); float la = lo.x * 6.283;
    ld = vec2(ld.x * cos(la) - ld.y * sin(la), ld.x * sin(la) + ld.y * cos(la));
    float leafM = (1.0 - smoothstep(0.7, 1.0, length(ld / vec2(0.36, 0.17)))) * step(0.25, lo.y);
    vec2 lp2 = vPos.xz * 9.7 + 13.0, lo2 = hash22(floor(lp2));
    vec2 ld2 = fract(lp2) - (0.25 + 0.5 * lo2);
    float leafM2 = (1.0 - smoothstep(0.6, 1.0, length(ld2 / vec2(0.3, 0.3)))) * step(0.5, lo2.y);
    vec3 leafC = mix(vec3(0.15, 0.085, 0.03), vec3(0.34, 0.24, 0.07), fract(lo.x * 9.7)) * (0.75 + 0.6 * (1.0 - smoothstep(0.0, 0.035, abs(ld.y))));
    float mossG = smoothstep(0.46, 0.6, fbm(vPos.xz * 0.45 + 3.0));
    vec3 earth = (uDeep * 2.4 + vec3(0.03, 0.026, 0.02)) * (0.3 + 0.45 * g) * (0.7 + 0.6 * vnoise(vPos.xz * 3.1));
    vec3 ground = mix(earth, vec3(0.04, 0.115, 0.045) * (0.5 + 1.0 * vnoise(vPos.xz * 7.0)), mossG * 0.85);
    vec3 gl = uDeepFill * 3.0 + uGreen * uPocket * 0.12;
    ground = mix(ground, leafC * gl, max(leafM, leafM2 * 0.7) * nearG * 0.9);
    pAlb = mix(vec3(0.05), leafC, leafM * nearG);
    col = ground + uGreen * uPocket * (0.05 + 0.5 * canopy * fbm(vPos.xz * 0.6 + uTime * 0.03)) * (1.0 - 0.8 * nearG);
    float wob = (vnoise(vec2(vAux.x * 0.35, vPos.z * 0.13 + vPos.x * 0.07)) - 0.5) * 2.2;
    float water = 1.0 - smoothstep(2.2, 3.4, abs(vAux.x + wob) + (1.0 - vCol.r) * 99.0);
    float rip = vnoise(vec2(vAux.x * 1.7, (vPos.z + vPos.x) * 0.5 - uTime * 0.9)) * vnoise(vec2(vAux.x * 4.0 + 3.0, (vPos.z - vPos.x) * 0.9 - uTime * 1.6));
    float strip = (1.0 - smoothstep(0.1, 1.25, abs(vAux.x + wob + (rip - 0.25) * 2.6))) * (0.25 + 0.75 * smoothstep(0.04, 0.3, rip));
    vec3 wcol = mix(uDeep * 1.0 + uGreen * uPocket * 0.06 + vec3(0.0, 0.012, 0.02) + uSky * 0.07, mix(uHazeCol, uSunCol * 0.4, 0.35) * (0.35 + 1.5 * rip), strip);
    col = mix(col, wcol, water);
    pAlb = mix(pAlb, vec3(0.02 + 1.5 * strip * strip), water); waterK = water;       // the portal's light rides the same rocking strip as the sky's, broken into glints
  }
  // ---- the portal's own light on the keyhole, the roots and the banks (the world sets its colour; black by default)
  vec3 toP = vec3(0.0, 4.5, 0.0) - vPos; float dP = length(toP);
  float plR = (1.0 - smoothstep(30.0, 80.0, dP)) / (1.0 + dP * dP * 0.012) * (0.3 + 0.7 * max(dot(N, toP / max(dP, 1e-3)), 0.0));   // stone warms only within a few metres of the ring
  float plW = (1.0 - smoothstep(70.0, 175.0, dP)) / (1.0 + dP * dP * 0.0005);                                                         // the water carries it far up the canyon
  col += pAlb * uPortalCol * mix(plR, plW, waterK);
  // ---- the emerald air of the pocket, when the eye and the stone are both down in it
  float pocketAir = (1.0 - exp(-dist * 0.011)) * (1.0 - smoothstep(12.0, 52.0, y)) * (1.0 - smoothstep(24.0, 62.0, uCam.y)) * uPocket;
  col = mix(col, uGreen * 0.3 + uDeep * 1.2, pocketAir * uPocketAir);
  // ---- dawn: white mist lying in the slots (an analytic layer between uMist.x and uMist.y). Seen from above it is a sea:
  // its top billows, the low sun lights the sunward slope of every billow and the blades lay long shadows across it.
  float toSun = max(dot(-V, sunH), 0.0);
  if (uMist.z > 0.0) {
    vec2 drift = vec2(uTime * 0.016, -uTime * 0.01);
    float farUp = (uMist.w + clamp(uCam.y - uMist.y - 8.0, 0.0, 13.0)) * smoothstep(60.0, 320.0, dist);   // seen from above, far off, only the teeth stand out of it
    float bF = fbm(vPos.xz * 0.047 + drift * 3.0) + 0.5 * vnoise(vPos.xz * 0.16 - drift * 8.0);          // the billows: the waterline wavers round every blade
    float mTop = uMist.y + uMist.w * 0.8 * (fbm(vPos.xz * 0.011 + drift) - 0.5) + 1.5 * (bF - 0.75) + farUp;
    // the stone, the roots and the floor of the fissure and the canyon: no sun reaches the mist that lies between those walls, so it is violet shade (not
    // a lit sea) and thin enough to read the walls through, fading them with depth
    // (so is everything else that stands within the fissure's own footprint; the world turns this on as the lens comes to the lip, uMistSlot.a > 0)
    vec2 sab = uSlotSeg.zw - uSlotSeg.xy;
    float sT = clamp(dot(vPos.xz - uSlotSeg.xy, sab) / max(dot(sab, sab), 1e-3), -0.08, 1.08);
    float sD = length(vPos.xz - uSlotSeg.xy - sab * sT);
    float slotK = max(max(wallK, 1.0 - smoothstep(14.0, 24.0, sD)), max(step(3.5, kind), step(2.5, kind) * (1.0 - step(3.5, kind)))) * smoothstep(0.0, 0.011, uMistSlot.a);
    float mst = mistAmt(uCam, vPos, dist, mTop, mix(uMist.z, uMistSlot.a, slotK));
    float inside = 1.0 - smoothstep(uMist.y - 9.0, uMist.y - 1.0, uCam.y);          // the eye down in the layer: the mist in a slot is in shade, violet, deeper below
    vec3 mCol = uMistCol * (0.6 + 0.4 * smoothstep(uMist.x, uMist.y, y)) * (0.9 + 0.4 * toSun * toSun) * mix(vec3(1.0), vec3(0.62, 0.56, 0.86), inside);
    mCol = mix(mCol, uMistSlot.rgb * (0.82 + 0.3 * smoothstep(uMist.x, uMist.y, y)), slotK);
    float above = smoothstep(1.0, 7.0, uCam.y - uMist.y) * step(y, uCam.y - 0.5) * (1.0 - slotK);
    if (above > 0.0) {
      float tq = clamp((uCam.y - uMist.y - farUp) / max(uCam.y - y, 0.5), 0.0, 1.0);
      vec2 Q = uCam.xz + (vPos.xz - uCam.xz) * tq;                                  // where the eye's ray enters the sea
      float dq = dist * tq, fine = 1.0 - smoothstep(22.0, 70.0, dq);
      vec2 Q2 = Q + sunH.xz * 2.0;
      float b0 = gfbm(Q * 0.047 + drift * 3.0) + 0.5 * gnoise(Q * 0.16 - drift * 8.0) + 0.3 * fine * gnoise(Q * 0.45 + drift * 14.0);
      float b1 = gfbm(Q2 * 0.047 + drift * 3.0) + 0.5 * gnoise(Q2 * 0.16 - drift * 8.0) + 0.3 * fine * gnoise(Q2 * 0.45 + drift * 14.0);
      float seaK = 1.0 - smoothstep(110.0, 380.0, dq);                                // far off the billows merge into the haze
      float lit = clamp(0.5 - (b1 - b0) * 5.0, 0.0, 1.0);                             // the slope of each billow turned to the low sun is lit, the other in shade
      // the long shadows of the blades: bars lying away from the sun, each sharp where it starts and thinning to its tip
      float al = dot(Q, sunH.xz), ac = dot(Q, vec2(-sunH.z, sunH.x));
      float cx = floor(ac / 13.0), fx = ac / 13.0 - cx;
      float ty = -al / 95.0 + hash2(vec2(cx, 3.0));
      float t = fract(ty);
      vec2 hc = hash22(vec2(cx, floor(ty)));
      float wd = (0.16 + 0.2 * hc.y) * (1.0 - 0.7 * t);
      float bar = (1.0 - smoothstep(wd * 0.35, wd, abs(fx - 0.5 - 0.3 * (hc.x - 0.5)))) * (1.0 - smoothstep(0.45, 0.95, t)) * smoothstep(0.0, 0.06, t) * step(0.22, hc.x) * (0.25 + 0.5 * smoothstep(30.0, 110.0, dq));   // (soft, and faint near the eye: the mist is smooth)
      vec3 sea = uMistCol * mix(vec3(0.64, 0.6, 0.88), vec3(1.14, 1.05, 0.96) + uSunCol * 0.035, lit * (1.0 - 0.85 * bar)) * (0.86 + 0.2 * b0);
      mCol = mix(mCol, mix(uMistCol * (0.92 + 0.2 * toSun * toSun), sea, seaK), above);
    }
    // stone that stands in the mist loses its fine lines before it loses its shape: no grid of joints and flutes shows through the veil
    col = mix(col, amb * 1.05, smoothstep(0.08, 0.45, mst) * isRock * (1.0 - slotK));
    col = mix(col, mCol, mst);
  }
  // ---- haze: gold toward the sun, thicker with distance (the world's own fog comes after)
  float hz = 1.0 - exp(-uHaze * dist * mix(1.0, 0.55, smoothstep(40.0, 110.0, y)));
  vec3 hazeCol = mix(uHazeCol * 0.62 + uSky * 0.55, uHazeCol * 1.05 + uSunCol * 0.12, toSun * toSun);
  col = mix(col, hazeCol, hz);
  gl_FragColor = vec4(col, 1.0);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    // seen from the pocket its green air lies low: the upper walls and the towers stand clear of it
    fogF *= mix(1.0, uFogTop, smoothstep(9.0, 32.0, y) * (1.0 - smoothstep(24.0, 62.0, uCam.y)));
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogF);
  #endif
}`;

// ------------------------------------------------------------------ the sifaka
// One 1.0 m animal (crown to heel) in a rest pose: standing, +Y up, belly +Z, the hips at the origin, legs and arms
// hanging straight down. It is cut into bones that the vertex shader turns about joints that all lie on straight lines
// (so they need no attributes): 0 torso, 1 thigh, 2 shin, 8 foot, 3 upper arm, 4 forearm, 9 hand, 7 head, 5 tail (laid
// along a curve), 6 infant on the back. The pose itself (sixteen angles an animal) is worked out on the CPU, see RIG.
const RIG = { hipX: 0.058, Lt: 0.25, Ls: 0.24, shX: 0.085, shY: 0.33, La: 0.165, Lf: 0.165, neckY: 0.405, tail: 0.62 };
function sifakaGeometry() {
  const P = [], C = [], B = [], I = [], lofts = []; let n = 0;
  // Decken's sifaka: creamy white all over (a faint gold wash on the shoulders and thighs, a greyer belly), bare black face, hands and feet
  const cream = [0.74, 0.715, 0.63], pale = [0.8, 0.785, 0.715], belly = [0.6, 0.585, 0.56], gold = [0.74, 0.66, 0.5], dark = [0.028, 0.025, 0.027], grey = [0.3, 0.285, 0.28], amber = [0.95, 0.5, 0.06];
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const vert = (x, y, z, c, bone, side, tl = 0, tuft = -1) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); B.push(bone, side, tl, tuft); return n++; };
  // a lofted tube: rings = [{ c, a (first half axis), b (second half axis), col (angle 0..2pi, cos, sin) -> colour, tl }], closed by a point at each end.
  // fur: { h (how far the coat stands off), len (how far a lock lies along the limb), flow (1: the way the rings run, -1: against them), per (locks a cell), from, to (rings) }
  const loft = (rings, sides, bone, side, fur = null) => {
    const start = n;
    for (const r of rings) for (let i = 0; i < sides; i++) {
      const an = (i / sides) * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an);
      vert(r.c[0] + r.a[0] * ca + r.b[0] * sa, r.c[1] + r.a[1] * ca + r.b[1] * sa, r.c[2] + r.a[2] * ca + r.b[2] * sa, typeof r.col === 'function' ? r.col(an, ca, sa) : r.col, bone, side, r.tl || 0);
    }
    for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) { const a = start + j * sides + i, b = start + j * sides + ((i + 1) % sides); I.push(a, b, b + sides, a, b + sides, a + sides); }
    const f = rings[0], l = rings[rings.length - 1], fc = typeof f.col === 'function' ? f.col(0, 1, 0) : f.col, lc = typeof l.col === 'function' ? l.col(0, 1, 0) : l.col;
    const c0 = vert(f.c[0], f.c[1], f.c[2], fc, bone, side, f.tl || 0), c1 = vert(l.c[0], l.c[1], l.c[2], lc, bone, side, l.tl || 0), ls = start + (rings.length - 1) * sides;
    for (let i = 0; i < sides; i++) { I.push(c0, start + ((i + 1) % sides), start + i); I.push(c1, ls + i, ls + ((i + 1) % sides)); }
    if (fur) lofts.push({ start, nr: rings.length, sides, bone, side, fur });
  };
  const ringY = (x, y, z, rx, rz, col, tl) => ({ c: [x, y, z], a: [rx, 0, 0], b: [0, 0, rz], col, tl });       // a ring lying level (limbs, torso): angle 0 = +X, 90 deg = +Z (the belly side)
  const ringZ = (x, y, z, rx, ry, col) => ({ c: [x, y, z], a: [rx, 0, 0], b: [0, ry, 0], col });               // a ring standing across Z (head, feet): 90 deg = up
  // ---- torso: a long back with a slight arch, narrow hips, a deep chest
  const bodyCol = (y) => (an, ca, sa) => { const front = sstep(0.25, 0.85, sa), sh = sstep(0.2, 0.34, y) * (1 - sstep(-0.1, 0.5, sa)); return mix3(mix3(mix3(cream, pale, sstep(0.3, -0.6, sa)), gold, 0.3 * sh), belly, front * 0.8); };
  const TB = [[-0.085, 0.03, 0.035, -0.02], [-0.045, 0.088, 0.09, -0.02], [0.03, 0.104, 0.114, -0.01], [0.12, 0.106, 0.122, 0.004], [0.21, 0.1, 0.112, 0.004], [0.29, 0.092, 0.092, -0.012], [0.345, 0.078, 0.07, -0.02], [0.385, 0.062, 0.06, -0.016], [0.42, 0.052, 0.052, -0.004]];
  loft(TB.map(([y, rx, rz, zc]) => ringY(0, y, zc, rx, rz, bodyCol(y))), 12, 0, 1, { h: 0.016, len: 0.042, flow: -1, per: 3 });
  // ---- head (bone 7, turns at the neck): rings run from the nose back: a short black muzzle, the bare black face, then the white ruff standing out round it and the crown
  const HC = [0, 0.478, 0.012];
  const muz = [0.085, 0.078, 0.08], HR = [[0.1, 0.008, 0.006, -0.034, dark], [0.093, 0.024, 0.018, -0.032, muz], [0.078, 0.032, 0.027, -0.026, muz], [0.066, 0.05, 0.05, -0.006, dark], [0.06, 0.06, 0.06, -0.002, dark],
    [0.055, 0.074, 0.072, 0.0, pale], [0.036, 0.094, 0.088, 0.003, pale], [0.006, 0.097, 0.09, 0.005, pale], [-0.034, 0.084, 0.08, 0.004, cream], [-0.064, 0.05, 0.048, 0.0, cream], [-0.08, 0.012, 0.012, -0.004, cream]];
  loft(HR.map(([z, rx, ry, dy, col]) => ringZ(HC[0], HC[1] + dy, HC[2] + z, rx, ry, col)), 10, 7, 1, { h: 0.016, len: 0.034, flow: 1, per: 2, from: 5 });
  for (const s of [-1, 1]) {
    // eyes: amber with a dark pupil, set forward in the mask; ears: small and black, half hidden in the ruff
    const ex = s * 0.031, ey = HC[1] + 0.017, ez = HC[2] + 0.066, e0 = vert(ex, ey, ez + 0.008, dark, 7, s);
    const ring = n; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; vert(ex + Math.cos(a) * 0.008, ey + Math.sin(a) * 0.008, ez + 0.007, amber, 7, s); }
    const ring2 = n; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; vert(ex + Math.cos(a) * 0.021, ey + Math.sin(a) * 0.019, ez - 0.004, amber, 7, s); }
    for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; I.push(e0, ring + k, ring + k2, ring + k, ring2 + k, ring2 + k2, ring + k, ring2 + k2, ring + k2); }
    loft([ringZ(s * 0.088, HC[1] + 0.03, HC[2] + 0.012, 0.015, 0.019, dark), ringZ(s * 0.108, HC[1] + 0.044, HC[2] + 0.008, 0.008, 0.011, dark)], 5, 7, s);
  }
  // ---- legs: heavy thighs, long thin shins, long dark feet
  const limbCol = (inner, base) => (an, ca, sa) => mix3(base, belly, 0.6 * sstep(0.2, 0.9, inner * -ca) + 0.25 * sstep(0.2, 0.9, sa));
  for (const s of [-1, 1]) {
    const x = s * RIG.hipX, lc = limbCol(s, mix3(cream, gold, 0.22));
    loft([ringY(x, 0.05, 0, 0.056, 0.07, lc), ringY(x * 1.1, -0.04, 0.0, 0.074, 0.094, lc), ringY(x * 1.08, -0.13, 0.002, 0.064, 0.078, lc), ringY(x, -0.25, 0, 0.036, 0.04, limbCol(s, cream))], 8, 1, s, { h: 0.02, len: 0.05, flow: 1, per: 2 });
    loft([ringY(x, -0.235, 0, 0.035, 0.039, limbCol(s, cream)), ringY(x, -0.32, -0.008, 0.031, 0.036, limbCol(s, cream)), ringY(x, -0.42, -0.002, 0.022, 0.024, limbCol(s, cream)), ringY(x, -0.492, 0, 0.018, 0.02, grey)], 8, 2, s, { h: 0.012, len: 0.035, flow: 1, per: 2, to: 2 });
    loft([ringZ(x, -0.49, -0.03, 0.02, 0.022, dark), ringZ(x, -0.5, 0.03, 0.027, 0.019, dark), ringZ(x, -0.506, 0.085, 0.026, 0.013, dark), ringZ(x, -0.51, 0.13, 0.014, 0.007, dark)], 6, 8, s);
    const ax = s * RIG.shX, ac = limbCol(s, mix3(cream, gold, 0.16));
    loft([ringY(ax * 0.96, 0.35, 0, 0.036, 0.042, ac), ringY(ax, 0.26, 0, 0.031, 0.035, ac), ringY(ax, 0.165, 0, 0.025, 0.027, limbCol(s, cream))], 8, 3, s, { h: 0.013, len: 0.04, flow: 1, per: 1 });
    loft([ringY(ax, 0.175, 0, 0.025, 0.027, limbCol(s, cream)), ringY(ax, 0.09, 0.002, 0.022, 0.025, limbCol(s, cream)), ringY(ax, 0.0, 0, 0.016, 0.017, grey)], 8, 4, s, { h: 0.011, len: 0.034, flow: 1, per: 1, to: 1 });
    loft([ringY(ax, 0.008, 0, 0.017, 0.015, dark), ringY(ax, -0.035, 0.002, 0.02, 0.012, dark), ringY(ax, -0.07, 0.012, 0.014, 0.009, dark), ringY(ax, -0.085, 0.026, 0.008, 0.006, dark)], 6, 9, s);
  }
  // ---- tail: long and furred, thickest a third of the way down, tapering; rings carry only their offset, the shader lays them along a curve (tl = 0..1)
  const tr = [];
  for (let j = 0; j <= 10; j++) { const tl = j / 10, r = (0.024 + 0.014 * Math.sin(Math.min(1, tl * 1.5) * Math.PI * 0.75) - 0.016 * tl * tl) * (j === 10 ? 0.45 : 1); tr.push(ringY(0, 0, 0, r, r, mix3(pale, cream, tl), tl)); }
  loft(tr, 8, 5, 1, { h: 0.026, len: 0.075, flow: 1, per: 3 });
  // ---- infant: a small pale bump clinging to the back (collapsed unless the instance carries one)
  const ir = [];
  for (let j = 0; j <= 4; j++) { const a = (j / 4) * Math.PI; ir.push(ringY(0, 0.2 - Math.cos(a) * 0.085, -0.105, Math.sin(a) * 0.055 + 0.003, Math.sin(a) * 0.05 + 0.003, j > 2 ? pale : cream)); }
  loft(ir, 6, 6, 1);
  // ---- normals of the skin (the tail's rings all lie at the origin until the shader lays them along its curve, so its normals are set by hand: straight out from the axis)
  const N = new Float32Array(n * 3);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { N[k] += nx; N[k + 1] += ny; N[k + 2] += nz; }
  }
  for (let i = 0; i < n; i++) {
    let x = N[i * 3], y = N[i * 3 + 1], z = N[i * 3 + 2];
    if (B[i * 4] === 5) { x = P[i * 3]; y = 0; z = P[i * 3 + 2]; if (Math.hypot(x, z) < 1e-5) { x = 0; z = 0; y = B[i * 4 + 2] > 0.5 ? -1 : 1; } }
    const l = Math.hypot(x, y, z) || 1; N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l;
  }
  const NN = Array.from(N);
  // ---- the coat: locks of fur standing off the skin, lying the way the hair grows (aBone.w: 0 at the root of a lock, 1 at its tip). They break the outline
  // into a soft, tufted edge: longest in the ruff, on the haunches and down the tail
  let sd = 12345; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd & 0xffff) / 65536; };
  const lock = (c, nrm, flow, wdir, h, len, wd, col, bone, side, tl, tlTip) => {
    const k = 0.9 + 0.2 * rnd(), cb = [col[0] * 0.9 * k, col[1] * 0.9 * k, col[2] * 0.9 * k], ct = [Math.min(0.9, col[0] * 1.08 * k), Math.min(0.9, col[1] * 1.08 * k), Math.min(0.9, col[2] * 1.08 * k)];
    const a = vert(c[0] - wdir[0] * wd - nrm[0] * 0.004, c[1] - wdir[1] * wd - nrm[1] * 0.004, c[2] - wdir[2] * wd - nrm[2] * 0.004, cb, bone, side, tl, 0);
    const b = vert(c[0] + wdir[0] * wd - nrm[0] * 0.004, c[1] + wdir[1] * wd - nrm[1] * 0.004, c[2] + wdir[2] * wd - nrm[2] * 0.004, cb, bone, side, tl, 0);
    const t = vert(c[0] + nrm[0] * h + flow[0] * len, c[1] + nrm[1] * h + flow[1] * len, c[2] + nrm[2] * h + flow[2] * len, ct, bone, side, tlTip, 1);
    for (let q = 0; q < 3; q++) NN.push(nrm[0], nrm[1], nrm[2]);
    I.push(a, b, t);
  };
  for (const L of lofts) {
    const { start, nr, sides, bone, side, fur } = L, j0 = fur.from || 0, j1 = Math.min(nr - 1, fur.to ?? nr - 1);
    for (let j = j0; j < j1; j++) for (let i = 0; i < sides; i++) for (let q = 0; q < fur.per; q++) {
      const ia = start + j * sides + i, ib = start + j * sides + ((i + 1) % sides), ic = ib + sides, id = ia + sides, u = 0.15 + 0.7 * rnd(), v = 0.1 + 0.8 * rnd();
      const at = (arr, st, k) => (arr[ia * st + k] * (1 - u) + arr[ib * st + k] * u) * (1 - v) + (arr[id * st + k] * (1 - u) + arr[ic * st + k] * u) * v;
      const col = [at(C, 3, 0), at(C, 3, 1), at(C, 3, 2)]; if (col[0] + col[1] + col[2] < 0.9) continue;                 // bare skin carries no fur
      const c = [at(P, 3, 0), at(P, 3, 1), at(P, 3, 2)], nr3 = [at(NN, 3, 0), at(NN, 3, 1), at(NN, 3, 2)], nl = Math.hypot(nr3[0], nr3[1], nr3[2]) || 1;
      nr3[0] /= nl; nr3[1] /= nl; nr3[2] /= nl;
      { let mx = 0, my = 0, mz = 0; for (let w = 0; w < sides; w++) { const q = (start + j * sides + w) * 3; mx += P[q]; my += P[q + 1]; mz += P[q + 2]; } if (nr3[0] * (c[0] - mx / sides) + nr3[1] * (c[1] - my / sides) + nr3[2] * (c[2] - mz / sides) < 0) { nr3[0] = -nr3[0]; nr3[1] = -nr3[1]; nr3[2] = -nr3[2]; } }   // outward
      const k = 0.7 + 0.6 * rnd(), wd = 0.016 + 0.01 * rnd();
      if (bone === 5) {                                      // the tail: out from its axis and on down it
        const tl = B[ia * 4 + 2] * (1 - v) + B[id * 4 + 2] * v, r = Math.hypot(c[0], c[2]) || 1e-3, ex = c[0] / r, ez = c[2] / r, taper = 1 - 0.55 * tl;
        const a = vert(c[0] - ez * wd, 0, c[2] + ex * wd, col, 5, 1, tl, 0), b = vert(c[0] + ez * wd, 0, c[2] - ex * wd, col, 5, 1, tl, 0), t = vert(ex * (r + fur.h * k * taper), 0, ez * (r + fur.h * k * taper), [Math.min(0.9, col[0] * 1.08), Math.min(0.9, col[1] * 1.08), Math.min(0.9, col[2] * 1.08)], 5, 1, Math.min(1, tl + (fur.len * k) / RIG.tail), 1);
        for (let w = 0; w < 3; w++) NN.push(ex, 0, ez); I.push(a, b, t);
        continue;
      }
      const fl = [P[id * 3] - P[ia * 3], P[id * 3 + 1] - P[ia * 3 + 1], P[id * 3 + 2] - P[ia * 3 + 2]], fll = (Math.hypot(fl[0], fl[1], fl[2]) || 1) * fur.flow;
      const wv = [P[ib * 3] - P[ia * 3], P[ib * 3 + 1] - P[ia * 3 + 1], P[ib * 3 + 2] - P[ia * 3 + 2]], wl = Math.hypot(wv[0], wv[1], wv[2]) || 1;
      // longer on the haunch (the back of the thigh), at the elbow and in the ruff
      let hk = 1; if (bone === 1 && nr3[2] < 0.1) hk = 1.5; if (bone === 7 && j <= 6) hk = 1.35; if (bone === 0 && c[1] < 0.02) hk = 1.3;
      lock(c, nr3, [fl[0] / fll, fl[1] / fll, fl[2] / fll], [wv[0] / wl, wv[1] / wl, wv[2] / wl], fur.h * k * hk, fur.len * k, wd, col, bone, side, 0, 0);
    }
  }
  // the ruff itself: a ring of long white locks standing out round the bare face
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2 + 0.2, ca = Math.cos(a), sa = Math.sin(a), low = sa < -0.5 ? 0.6 : 1;
    lock([HC[0] + ca * 0.071, HC[1] + sa * 0.069, HC[2] + 0.052], [ca * 0.8, sa * 0.8, 0.6], [ca * 0.8, sa * 0.8, -0.6], [-sa, ca, 0], 0.01, 0.03 * low * (0.8 + 0.4 * rnd()), 0.021, pale, 7, 1, 0, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aBone', new THREE.Float32BufferAttribute(B, 4));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(NN, 3));
  g.setIndex(I);
  return g;
}

const SIFAKA_VERT = /* glsl */`
attribute vec3 color;
attribute vec4 aBone;       // bone, side (-1 | 1), fraction along the tail, -
attribute vec4 aPosYaw;     // hips (hero-local) and yaw
attribute vec4 aP1;         // hip, knee, ankle, knees turned out
attribute vec4 aP2;         // shoulder, elbow, grip, elbows turned out
attribute vec4 aP3;         // lean back, toe-in, head yaw, head pitch
attribute vec4 aP4;         // tail: angle at its root, curl, sideways sweep; left-right difference of the limbs
attribute vec2 aEx;         // size of this animal (times uSize), seed (negative: it carries an infant)
uniform float uTime, uSize;
varying vec3 vPos;
varying vec3 vNrm;
varying vec3 vCol;
varying vec3 vObj;
varying float vTuft;
#include <fog_pars_vertex>
// rX: turn in the sagittal plane, positive = forward (a hanging limb swings toward +Z); rY: yaw; rA: turn about a unit axis
vec3 rX(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, v.y * c + v.z * s, -v.y * s + v.z * c); }
vec3 rY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
vec3 rA(vec3 v, vec3 k, float a){ float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }
void main(){
  float bone = aBone.x, side = aBone.y;
  vec3 p = position, n = normal;
  vObj = position;
  if ((bone > 0.5 && bone < 2.5) || (bone > 7.5 && bone < 8.5)) {            // leg: thigh, shin, foot
    float H = aP1.x - 0.45 * aP4.w * side, K = aP1.y, F = aP1.z;
    vec3 hip = vec3(side * ${RIG.hipX}, 0.0, 0.0), knee = hip - vec3(0.0, ${RIG.Lt}, 0.0), ank = knee - vec3(0.0, ${RIG.Ls}, 0.0);
    if (bone > 7.5) { p = rX(p - ank, F) + ank; n = rX(n, F); }
    if (bone > 1.5) { p = rX(p - knee, K) + knee; n = rX(n, K); }
    p = rX(p - hip, H); n = rX(n, H);
    vec3 ax = normalize(rX(vec3(0.0, -${RIG.Lt}, 0.0), H) + rX(vec3(0.0, -${RIG.Ls}, 0.0), H + K) + vec3(0.0, -1e-4, 0.0));   // hip to ankle: the knee swings out about it, the foot stays where it is
    p = rA(p, ax, -side * aP1.w); n = rA(n, ax, -side * aP1.w);
    p = rY(p, -side * aP3.y) + hip; n = rY(n, -side * aP3.y);
  } else if ((bone > 2.5 && bone < 4.5) || bone > 8.5) {                      // arm: upper arm, forearm, hand
    float S = aP2.x + aP4.w * side, E = aP2.y, G = aP2.z;
    vec3 sh = vec3(side * ${RIG.shX}, ${RIG.shY}, 0.0), el = sh - vec3(0.0, ${RIG.La}, 0.0), wr = el - vec3(0.0, ${RIG.Lf}, 0.0);
    if (bone > 8.5) { p = rX(p - wr, G) + wr; n = rX(n, G); }
    if (bone > 3.5) { p = rX(p - el, E) + el; n = rX(n, E); }
    p = rX(p - sh, S); n = rX(n, S);
    vec3 ax = normalize(rX(vec3(0.0, -${RIG.La}, 0.0), S) + rX(vec3(0.0, -${RIG.Lf}, 0.0), S + E) + vec3(0.0, -1e-4, 0.0));
    p = rA(p, ax, side * aP2.w); n = rA(n, ax, side * aP2.w);
    p = rY(p, -side * aP3.y * 1.8) + sh; n = rY(n, -side * aP3.y * 1.8);
  } else if (bone > 6.5 && bone < 7.5) {                                      // head
    vec3 nk = vec3(0.0, ${RIG.neckY}, 0.0);
    p = rY(rX(p - nk, aP3.w), aP3.z) + nk; n = rY(rX(n, aP3.w), aP3.z);
  } else if (bone > 4.5 && bone < 5.5) {                                      // tail, laid along an arc of a circle
    float tl = aBone.z, phi0 = aP4.x, kap = aP4.y;
    kap = abs(kap) < 0.02 ? 0.02 : kap;
    float ph = phi0 + kap * tl;
    vec2 c = ${RIG.tail} / kap * vec2(-sin(ph) + sin(phi0), -cos(ph) + cos(phi0));
    vec2 perp = vec2(sin(ph), cos(ph));
    float dz = position.z;
    p = vec3(position.x + aP4.z * tl * tl, -0.035 + c.x + perp.x * dz, -0.078 + c.y + perp.y * dz);
    n = vec3(normal.x, perp.x * normal.z - cos(ph) * normal.y, perp.y * normal.z + sin(ph) * normal.y);
    vObj = vec3(position.x, -0.1 - tl * ${RIG.tail}, position.z);
  } else if (bone > 5.5 && bone < 6.5) {                                      // infant
    p = mix(vec3(0.0, 0.2, -0.06), p, step(aEx.y, -0.0001));
  }
  p = rX(p, aP3.x); n = rX(n, aP3.x);
  p *= uSize * aEx.x;
  p = rY(p, aPosYaw.w) + aPosYaw.xyz; n = rY(n, aPosYaw.w);
  vPos = p; vNrm = n; vCol = color; vTuft = aBone.w;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SIFAKA_FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uGreen, uHazeCol, uCam, uPortalCol;
uniform float uBandLo, uHaze, uPocket, uFurKey, uFurLift, uFurBand;
uniform vec4 uMist;          // bottom y, top y, density, ramp width
uniform vec3 uMistCol;
uniform vec4 uMistSlot;      // the mist down in the fissure, which no sun reaches: its colour, and its density (per metre)
float mistR(float y, float s, float w){ float t = clamp((y - s) / w, 0.0, 1.0); return w * 0.5 * t * t + max(y - s - w, 0.0); }
float mistF(float y, float top){ return mistR(y, uMist.x, uMist.w) - mistR(y, top - uMist.w, uMist.w); }
float mistAmt(vec3 cam, vec3 pos, float dist, float top, float k){      // top: where the layer ends above this point (it billows); k: its density
  float dy = pos.y - cam.y;
  float dens = clamp(min((cam.y - uMist.x) / uMist.w, (top - cam.y) / uMist.w), 0.0, 1.0);
  float mean = abs(dy) < 0.05 ? dens : (mistF(pos.y, top) - mistF(cam.y, top)) / dy;
  return 1.0 - exp(-k * dist * max(mean, 0.0));
}
varying vec3 vPos;
varying vec3 vNrm;
varying vec3 vCol;
varying vec3 vObj;
varying float vTuft;
#include <fog_pars_fragment>
float sh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(sh2(i), sh2(i + vec2(1.0, 0.0)), f.x), mix(sh2(i + vec2(0.0, 1.0)), sh2(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main(){
  vec3 N = normalize(vNrm + vec3(0.0, 1e-5, 0.0));
  float lock = step(-0.5, vTuft), tip = max(vTuft, 0.0);     // a lock of the coat (its normal is the skin's under it), and how far along it
  if (!gl_FrontFacing && lock < 0.5) N = -N;
  vec3 toCam = uCam - vPos; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  // fur: locks lying down the body (they turn the light), finer streaks only where the animal is near enough to show them
  float nearK = 1.0 - smoothstep(6.0, 34.0, dist);
  float slot = 1.0 - smoothstep(58.5, 65.5, uCam.y);          // down in the fissure the strip of sky is the only light: bright crown, back and shoulders, violet-grey flanks
  float f0 = sn(vec2(vObj.x * 9.0 + vObj.z * 7.0, vObj.y * 2.4 + 1.7));
  float f1 = sn(vec2(vObj.x * 31.0 + vObj.z * 23.0, vObj.y * 5.0)), f2 = sn(vec2(vObj.x * 77.0 - vObj.z * 61.0, vObj.y * 11.0 + 3.0));
  float fur = 0.4 * f0 + 0.35 * f1 * (0.3 + 0.7 * nearK) + 0.25 * f2 * nearK - 0.45;
  float lumA = dot(vCol, vec3(0.333));
  float furry = smoothstep(0.08, 0.3, lumA) * (1.0 - smoothstep(0.1, 0.3, vCol.r - vCol.b - 0.25));      // bare black skin and the eyes have no coat
  N = normalize(N + vec3(fur, 0.4 * fur, -fur) * 0.7 * furry);
  float sunVis = smoothstep(uBandLo - 4.0 - uFurBand, uBandLo + 5.0 - uFurBand, vPos.y);
  float ndl = dot(N, uSun);
  float fres = 1.0 - max(dot(N, V), 0.0);
  float up = N.y * 0.5 + 0.5;
  vec3 alb = vCol * (1.0 + 0.9 * fur * furry) * (1.0 - 0.2 * (1.0 - tip) * lock);    // a lock is darker at its root: the coat has depth
  // on the tops and in the street the animal is lit by the scene: the side turned to the low sun and the bright sky round it is pale and warm,
  // the other side falls to the violet of the stone's own shade at about half the value; the sun itself only above the band it reaches
  vec3 Lk = normalize(vec3(uSun.x, max(uSun.y, 0.0) + 0.55, uSun.z));
  float sideK = smoothstep(-0.45, 0.65, dot(N, Lk));
  vec3 ambT = mix(uSky * (0.7 + 0.6 * up), uSky * (1.1 + 1.3 * up) + uHazeCol * 0.3, sideK) * uFurLift;
  ambT += uSunCol * sunVis * smoothstep(-0.1, 0.8, ndl) * 0.42;
  // in the slot and the pocket: a cream key from the strip of sky on whatever is turned up to it, the underside left in violet (or green) shade
  vec3 keyC = vec3(1.0, 0.93, 0.8) * uFurKey;
  vec3 ambS = uSky * (0.2 + 0.5 * up) + keyC * (0.16 + 0.84 * up * up * up) * 0.62 + uGreen * uPocket * 0.07 * (1.0 - up);
  vec3 col = alb * mix(ambT, ambS, slot);
  // the rim of lit fur: rose or gold on the sun side, a thin line of sky on the other; in the slot it lies along whatever edge is turned to the sky.
  // The tips of the locks on the sun side let the light through.
  float rim = fres * fres * (0.6 + 0.6 * f1 * (0.3 + 0.7 * nearK));
  vec3 rimT = uSunCol * (0.1 + 0.8 * sunVis) * smoothstep(-0.5, 0.25, ndl) * 0.9 + uSky * 0.8 * uFurLift;
  col += furry * rim * mix(rimT, (uSky * 0.7 + keyC * 0.75) * (0.25 + 1.0 * up), slot);
  col += furry * lock * tip * alb * mix(uSunCol * (0.06 + 0.5 * sunVis) * smoothstep(-0.6, 0.2, ndl) + uSky * 0.5 * sideK, keyC * 0.3 * up, slot);
  col += (1.0 - furry) * vCol * step(0.4, vCol.r) * (0.35 + 0.5 * up);                                    // the eyes catch the light
  vec3 toP = vec3(0.0, 4.5, 0.0) - vPos; float dP = length(toP);
  float pl = (1.0 - smoothstep(70.0, 150.0, dP)) / (1.0 + dP * dP * 0.0035) * (0.35 + 0.65 * max(dot(N, toP / max(dP, 1e-3)), 0.0));
  col += (alb + furry * rim * 0.5) * uPortalCol * pl * 2.8;
  float inSlot = (1.0 - smoothstep(uMist.y - 4.0, uMist.y + 1.0, vPos.y)) * smoothstep(0.0, 0.011, uMistSlot.a);                                 // an animal under the top of the layer is down between the walls: the mist there is in shade
  col = mix(col, mix(uMistCol * 0.9 * mix(vec3(1.0), vec3(0.62, 0.56, 0.86), 1.0 - smoothstep(uMist.y - 9.0, uMist.y - 1.0, uCam.y)), uMistSlot.rgb, inSlot), mistAmt(uCam, vPos, dist, uMist.y, mix(uMist.z, uMistSlot.a, inSlot)));
  float hz = 1.0 - exp(-uHaze * dist);
  col = mix(col, uHazeCol * 0.7 + uSky * 0.5, hz);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- the poses. A pose is sixteen numbers: [hip, knee, ankle, knees out,  shoulder, elbow, grip, elbows out,  lean back, toe-in, head yaw, head pitch,
// tail angle, tail curl, tail sweep, left-right difference]. Angles turn a hanging limb forward (toward the belly) when positive.
// The clinging poses are solved from where the hands and feet must be (on the root, the wall or the tooth the animal holds), so they close on something.
const ik2 = (L1, L2, ty, tz, kneeFwd) => {                 // two bones hanging from a joint reach the point (ty up, tz forward): [first angle, second angle]
  const D = Math.min(L1 + L2 - 0.004, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(ty, tz))), phi = Math.atan2(tz, -ty);
  const al = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)))), ga = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2))));
  return kneeFwd ? [phi + al, -(Math.PI - ga)] : [phi - al, Math.PI - ga];
};
const clingPose = (o) => {
  const [H, K] = ik2(RIG.Lt, RIG.Ls, o.foot[0], o.foot[1], true), [S, E] = ik2(RIG.La, RIG.Lf + 0.03, o.hand[0] - RIG.shY, o.hand[1], false);
  const F = Math.max(-0.9, Math.min(1.5, (o.sole ?? Math.PI / 2) - H - K));
  return [H, K, F, o.kneesOut, S, E, o.grip, o.elbowsOut, o.lean, o.toeIn, 0, 0, o.tail[0], o.tail[1], 0, 0];
};
// where the hips sit against what the animal holds (in body lengths: back from it along the belly's direction, up from the anchor) and its pose there
const SUP = {
  root: { back: 0.172, up: -0.2, pose: clingPose({ foot: [-0.13, 0.118], hand: [0.4, 0.128], kneesOut: 0.95, elbowsOut: 0.5, grip: 1.3, lean: 0.05, toeIn: 0.26, tail: [-0.42, 1.25] }) },
  wall: { back: 0.132, up: 0.0, pose: clingPose({ foot: [-0.1, 0.112], hand: [0.4, 0.118], kneesOut: 1.15, elbowsOut: 0.9, grip: 0.5, lean: 0.0, toeIn: 0.0, tail: [-0.3, 0.9] }) },
  tip: { back: 0.07, up: 0.075, pose: clingPose({ foot: [-0.09, 0.07], hand: [0.03, 0.112], kneesOut: 0.9, elbowsOut: 0.35, grip: 0.9, lean: -0.1, toeIn: 0.2, tail: [-0.5, 1.5] }) },
  hop: { back: 0, up: 0.33, pose: clingPose({ foot: [-0.31, 0.012], hand: [0.14, 0.1], sole: 0, kneesOut: 0.3, elbowsOut: 1.0, grip: 0.3, lean: -0.08, toeIn: -0.1, tail: [-1.1, 0.7] }) },
};
const AIR = {
  push: [0.22, -0.12, -0.8, 0.18, 0.9, 0.5, 0.3, 0.7, 0.66, 0.04, 0, 0.1, -0.8, 0.7, 0, 0],
  tuck: [1.5, -1.8, 0.25, 0.7, 1.5, 0.8, 0.3, 1.1, 0.1, 0.0, 0, 0, -1.9, 1.0, 0, 0],
  reach: [1.36, -0.55, -0.25, 0.45, 1.1, 0.9, 0.2, 0.8, 0.56, 0.1, 0, -0.2, -2.3, 0.9, 0, 0],
  hop: [0.85, -1.2, 0.1, 0.45, 1.3, 0.6, 0.2, 1.2, 0.05, -0.1, 0, 0, -1.5, 0.5, 0, 0],
};
const KEYS = [0, 0.15, 0.43, 0.76, 1];
// the pose at fraction f of a leap from one hold to another: off the hold, the push, the tuck and turn, the reach feet-first, onto the next hold
function flightPose(out, f, supA, supB, hop) {
  let A, B, t;
  if (hop) { const S0 = SUP.hop.pose; t = Math.sin(Math.PI * Math.max(0, Math.min(1, f))); for (let k = 0; k < 16; k++) out[k] = S0[k] + (AIR.hop[k] - S0[k]) * t; return out; }
  const seq = [SUP[supA].pose, AIR.push, AIR.tuck, AIR.reach, SUP[supB].pose];
  let i = 0; while (i < 3 && f > KEYS[i + 1]) i++;
  A = seq[i]; B = seq[i + 1]; t = sstep(0, 1, (f - KEYS[i]) / (KEYS[i + 1] - KEYS[i]));
  for (let k = 0; k < 16; k++) out[k] = A[k] + (B[k] - A[k]) * t;
  return out;
}
export const _sifakaLab = { RIG, SUP, AIR, flightPose, sifakaGeometry };

// ------------------------------------------------------------------ build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('stone-knives-hero') : ctx.rng;
  const t0 = 0;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map((h) => new THREE.Color(h));
  const [cStone, cGold, cViolet, cHaze, cGreen, cDeep, cCream] = pal;
  const hour = opts.hour || 'gold';            // gold | dawn | noon | blue
  const weather = opts.weather || 'dry';       // dry | rain

  // ---- light (hero-local). Default: sun 12 degrees up, due west = -X (on the left when flying -Z)
  const sun = new THREE.Vector3(-0.975, 0.21, 0.07);
  let sunCol = new THREE.Color(cGold.r * 2.6, cGold.g * 2.25, cGold.b * 1.4), sky = cViolet.clone().lerp(new THREE.Color(0.075, 0.075, 0.085), 0.22), bandLo = TOP - 13, haze = 0.0009, hazeCol = cHaze.clone();
  if (hour === 'dawn') { sun.set(0.96, 0.2, 0.18); sunCol = new THREE.Color('#ffc9a0').multiplyScalar(2.2); sky.lerp(new THREE.Color('#6d6f9a'), 0.5); haze = 0.0016; hazeCol.lerp(new THREE.Color('#f3e6e0'), 0.6); }
  if (hour === 'noon') { sun.set(-0.25, 0.95, 0.15); sunCol = new THREE.Color('#fff4e0').multiplyScalar(2.3); sky = new THREE.Color('#5b6c94'); bandLo = TOP - 34; haze = 0.0007; hazeCol = new THREE.Color('#cfdcec'); }
  if (hour === 'blue') { sun.set(0.9, 0.3, 0.3); sunCol = new THREE.Color('#9fb4ff').multiplyScalar(0.7); sky = new THREE.Color('#27305c'); bandLo = TOP - 22; haze = 0.0012; hazeCol = new THREE.Color('#4a5688'); }
  if (opts.sunDir) sun.copy(opts.sunDir.isVector3 ? opts.sunDir : new THREE.Vector3().fromArray(opts.sunDir));
  sun.normalize();
  if (opts.haze !== undefined) haze = opts.haze;

  const shadows = []; for (let i = 0; i < 8; i++) shadows.push(new THREE.Vector4(0, 0, 0, 0));
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(U, {
    uSun: { value: sun }, uSunCol: { value: sunCol }, uSky: { value: sky }, uDeep: { value: cDeep }, uGreen: { value: cGreen },
    uStone: { value: cStone.clone().multiplyScalar(0.92) }, uHazeCol: { value: hazeCol }, uCream: { value: cCream },
    uCam: { value: new THREE.Vector3(0, 100, 300) }, uTime: { value: 0 }, uTop: { value: TOP }, uHaze: { value: haze },
    uPocket: { value: opts.pocket ?? 1 }, uWet: { value: weather === 'rain' ? 0.6 : 0 }, uBandLo: { value: bandLo },
    uShadow: { value: shadows }, uSize: { value: 1 }, uFurKey: { value: 1 }, uFurLift: { value: 1 }, uFurBand: { value: 0 },
    uDeepFill: { value: new THREE.Color().copy(cDeep).multiplyScalar(2.4).add(cGreen.clone().multiplyScalar(0.3 * (opts.pocket ?? 1))).add(sky.clone().multiplyScalar(0.4)) },   // the light in the depths (a world may set it)
    uMist: { value: new THREE.Vector4(30, 64, 0, 10) }, uMistCol: { value: new THREE.Color(0.86, 0.8, 0.8) }, uMistSlot: { value: new THREE.Vector4(0.2, 0.14, 0.31, 0) }, uSlotSeg: { value: new THREE.Vector4(0, 0, 0, 1) },
    uPortalCol: { value: new THREE.Color(0, 0, 0) }, uPocketAir: { value: 0.55 }, uFogTop: { value: 1 }, uTerm: { value: 0 },   // the portal's light, the strength of the pocket's green air, how much scene fog the upper walls keep (a world sets them)
  });
  const rockMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, fog: true, side: THREE.DoubleSide });
  const root = new THREE.Group(); root.name = 'stone-knives-hero';

  // ---- layout. Exit heading h (north-east), p = its right-hand normal; portal at the origin.
  const ang = (35 + rng.range(-4, 4)) * DEG;
  const hx = Math.sin(ang), hz = -Math.cos(ang), px = Math.cos(ang), pz = Math.sin(ang);
  const C1 = [-70 * hx, -70 * hz];                         // start of the straight 70 m run-in
  const BR = opts.bend ?? 170;                                          // the canyon swings north-east in one long arc of this radius, so the portal shows from far up it
  const xc = C1[0] - BR * (1 - Math.cos(ang));              // x of the canyon / fissure further south
  const arcP = (f) => { const a = ang * f; return [C1[0] + BR * (px - Math.cos(a)), C1[1] + BR * (pz - Math.sin(a))]; };   // on the arc: heading a east of north
  const zArc = arcP(0)[1];                                  // where the bend begins
  const lineCtl = [
    [xc - 1.6, 306], [xc - 1.3, 290], [xc - 0.6, 262], [xc + 0.6, 236], [xc - 0.4, 205], [xc, Math.max(172, zArc + 22)], arcP(0),
    arcP(0.25), arcP(0.5), arcP(0.75), [C1[0], C1[1]], [-35 * hx, -35 * hz], [0, 0], [26 * hx, 26 * hz], [52 * hx, 52 * hz],
  ].map((q) => new THREE.Vector3(q[0], 0, q[1]));
  const lineCurve = new THREE.CatmullRomCurve3(lineCtl, false, 'centripetal');
  const lineLen = lineCurve.getLength(), NS = Math.ceil(lineLen / 1.5);
  const cl = [];                                           // centreline samples of the fissure and canyon
  const tv = new THREE.Vector3(), tt = new THREE.Vector3(), o3 = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) {
    lineCurve.getPointAt(i / NS, tv); lineCurve.getTangentAt(i / NS, tt);
    const s = (i / NS) * lineLen, dO = Math.hypot(tv.x, tv.z);
    let hw = 3.35 + 5.65 * sstep(0, 1, (284 - tv.z) / 66);
    hw = lerp(8, hw, sstep(8, 38, dO));
    hw *= 0.25 + 0.75 * sstep(0, 9, s);                    // the fissure closes to a V under the lip
    cl.push({ x: tv.x, z: tv.z, tx: tt.x, tz: tt.z, nx: -tt.z, nz: tt.x, hw, s });
  }
  // the bats' alcove: the right wall steps back over 30 m and returns in one face turned up the canyon, with the cave mouth in it
  let iPortal0 = 0; { let bd = 1e9; for (let i = 0; i < cl.length; i++) { const d = cl[i].x * cl[i].x + cl[i].z * cl[i].z; if (d < bd) { bd = d; iPortal0 = i; } } }
  const sCave = cl[iPortal0].s - (opts.caveBack ?? 100), CAVE_D = 6.2;
  const notch = (s, y) => CAVE_D * sstep(sCave - 34, sCave - 5, s) * (1 - sstep(sCave - 0.2, sCave + 0.4, s)) * (1 - sstep(15, 24, y));
  const slotDist = (x, z) => {                             // distance to the slot wall line (negative inside)
    let best = 1e9;
    for (let i = 0; i < cl.length; i += 2) { const c = cl[i], d = Math.hypot(x - c.x, z - c.z) - c.hw; if (d < best) best = d; }
    return best;
  };

  // ---- the upper line: crest causeway, six bounds, two dropping bounds, the lip
  const lip = new THREE.Vector3(cl[0].x + 0.2, 68, 303.5);
  const bAng = (opts.approach ?? 11) * DEG + rng.range(-1, 1) * DEG;
  const dx = Math.sin(bAng), dz = -Math.cos(bAng);          // approach direction (north, a touch east)
  const UP_LEN = 204;
  const entry = new THREE.Vector3(lip.x - dx * UP_LEN, 81.5, lip.z - dz * UP_LEN);
  const onLine = (s, lat = 0, y = TOP) => new THREE.Vector3(entry.x + dx * s - dz * lat, y, entry.z + dz * s + dx * lat);   // lat > 0 = right (east)
  const gaps = [];
  for (let i = 0; i < 6; i++) gaps.push(rng.range(12, 16));
  // The bounds go DOWN among the blades: a short crest, two long dropping leaps off its end, then six bounds along a street between fins
  // that stand 12 to 15 m over the eye (their crowns in the sun, their bodies in violet shade), through a notch between two cross-set
  // blades (the gate, between the sixth and seventh landings) and on, level, to the lip of the fissure. The fourth bound is flown in
  // company; its top is at path fraction 0.17 for every seed.
  const CE = opts.crestEnd ?? 24;                           // where the crest causeway ends (metres along the upper line)
  const LAND_S = [CE, 47, 68, 86, 105, 122, 139, 156, 179.5, UP_LEN], LAND_Y = [TOP + 0.6, TOP - 7.4, TOP - 12.4, TOP - 13.8, TOP - 14.2, TOP - 13.7, TOP - 13.0, TOP - 12.2, 66.4, 67.1];
  const NL = LAND_S.length - 1, CO = 3;                    // the last landing is the lip; the bound flown in company goes from landing CO to CO + 1
  const landings = [];
  for (let i = 0; i <= NL; i++) {
    const free = i > 0 && i < NL && i !== CO && i !== CO + 1, g = gaps[i % 6];
    landings.push({ s: LAND_S[i] + (free ? (g - 14) * 0.4 : 0), lat: i === 0 || i === NL ? 0 : rng.range(-0.9, 0.9) * (i === NL - 1 ? 0.66 : 1), y: LAND_Y[i] + (i > 0 && i < NL - 1 ? rng.range(-0.4, 0.4) : 0) });
  }
  for (const L of landings) L.pos = onLine(L.s, L.lat, L.y);
  const lineInfo = (x, z) => {                              // s along and lateral offset from the upper line
    const rx = x - entry.x, rz = z - entry.z;
    return { s: rx * dx + rz * dz, lat: -rx * dz + rz * dx };
  };
  await ctx.yield?.();

  // ---- hero blades: two sculpted variants (instanced), the crest causeway, landing tips
  const HROWS = [0, 0.03, 0.075, 0.15, 0.28, 0.48, 0.74, 1];
  const heroVar = [];
  for (let k = 0; k < 2; k++) {
    const g = new Geo();
    const r = finGeo(g, { len: 12, y0: 16, y1: TOP, tTop: 0.12, tBase: 5.6, nA: 26, rows: HROWS, toothDepth: 2.6 + k * 0.9, toothVar: 1.6,
      endDrop: 8 + k * 5, toothStep: 2, grow: 0.22, flute: 0.85, bow: k ? 0.5 : -0.3, peakAt: k ? 0.25 : -0.1 }, rng);
    heroVar.push({ geo: g.build(), peak: r.peak, crestY: r.crestY, bow: k ? 0.5 : -0.3, tris: g.tris, list: [] });
  }
  const yawAlong = Math.atan2(-dz, dx);                    // fin length along the approach direction
  const heroTips = [];                                      // every hero tooth an animal may use
  const addHero = (k, tip, yaw, sx, sz) => {               // seat variant k so its main tooth is exactly at tip
    const hv = heroVar[k], c = Math.cos(yaw), s = Math.sin(yaw);
    const lx = hv.peak[0] * sx, lz = hv.peak[2] * sz;
    const x = tip.x - (lx * c + lz * s), z = tip.z - (-lx * s + lz * c);
    hv.list.push({ x, y: tip.y - TOP, z, yaw, sx, sz, seed: rng() });
    const li = lineInfo(tip.x, tip.z);
    const y0 = tip.y - TOP;
    // perch(d): a point on this fin's crest d metres (local, unscaled) along from the main tooth
    const perch = (d) => {
      const xl = Math.max(-5.6, Math.min(5.6, hv.peak[0] + d)), zl = hv.bow * (1 - (xl / 6) ** 2);
      return new THREE.Vector3(x + xl * sx * c + zl * sz * s, hv.crestY(xl) + y0, z - xl * sx * s + zl * sz * c);
    };
    heroTips.push({ pos: tip.clone(), s: li.s, lat: li.lat, perch });
  };
  landings.forEach((L, i) => {
    if (i === 0) return;
    const across = i % 2 === 1 && i > 2 ? 1 : 0;           // the first two stand end-on, so the long drop to them is down their crests
    addHero(i % 2, L.pos, yawAlong + (across ? Math.PI / 2 + rng.range(-0.35, 0.35) : rng.range(-0.3, 0.3)), rng.range(0.75, 1.15), rng.range(0.9, 1.2));
  });
  // the third bound is flown in company: tips beside landings 2 and 3 for the animal that flies 2.3 m to our left and 6 m ahead,
  // for one further out on the left and for one on the right ([metres along past the landing, metres to the side])
  const ESC = [[4.4, -2.4], [10.5, -6.3], [9.6, 4.3]];
  const escortTips = ESC.map(([ds, lat], j) => [CO, CO + 1].map((i) => onLine(landings[i].s + ds, lat + landings[i].lat * 0.5, landings[i].y + 0.15 - 0.35 * j)));
  const companions = escortTips[0];
  escortTips.forEach((pr, j) => pr.forEach((c, i) => addHero((i + j) % 2, c, yawAlong + rng.range(-0.12, 0.12), j ? 0.9 : 0.8, 0.8)));
  // the gate: two blades set across the street, their crests falling to a notch the line passes through
  const gateS = (landings[6].s + landings[7].s) / 2 + 1.5;
  // (on a rare visit the right-hand blade of the gate is the one that shears: the world builds it as a stump and a loose top, see anchors.shear)
  let shearSpot = null;
  for (const side of [-1, 1]) {
    const sx = rng.range(1.05, 1.2), tip = onLine(gateS + side * 0.8, side * (3.3 + 6.5 * sx), TOP + rng.range(2.5, 4.5)), yaw = yawAlong + Math.PI / 2 + rng.range(-0.08, 0.08) + (side > 0 ? 0 : Math.PI);
    if (opts.rare && side > 0) { rng(); const q = onLine(gateS + 4, 6.1, 0); shearSpot = { x: q.x, z: q.z, yaw: yawAlong - Math.PI / 2, yCut: landings[6].y + 4.6, s: gateS + 4, lat: 6.1 }; continue; }
    addHero(side > 0 ? 0 : 1, tip, yaw, sx, 1.25);
  }
  const nLandTips = heroTips.length;
  // neighbours in the corridor beside the line
  for (let s = -8; s < UP_LEN + 6; s += 15.5) for (const side of [-1, 1]) for (let row = 0; row < 2; row++) {
    const street = s > CE - 2;                             // beside the crest they stay under the eye; beside the street they stand to their full height
    if (!rng.chance(street ? (row ? 0.62 : 0.86) : row ? 0.5 : 0.62)) continue;
    const lat = side * ((street ? 6.5 : 5.6) + row * 7.6 + rng.range(-0.8, 1.6)), ss = s + rng.range(-5, 5) + row * 6;
    const hFull = TOP + rng.range(-2.2, 1.6), hLow = 79 - 0.6 + rng.range(-2.5, 0);
    const tip = onLine(ss, lat, street ? hFull + (row ? 0 : rng.range(0, 1.5)) : Math.min(hFull, hLow));
    if (street && Math.abs(ss - gateS) < 9) continue;
    if (row === 0 && lat > 0 && Math.abs(ss - (landings[6].s + 4)) < 7) continue;   // the place of the blade a world may shear (4 m past the sixth landing, 5.8 m to the right)
    if (slotDist(tip.x, tip.z) < 7) continue;
    let ok = true;
    for (const t of heroTips) if (t.pos.distanceTo(tip) < 6.5) ok = false;
    if (!ok) continue;
    const sx = rng.range(0.7, 1.3);
    let rel = rng.chance(0.3) ? Math.PI / 2 - 0.2 + rng.range(-0.2, 0.2) : rng.range(-0.25, 0.25);
    if (Math.abs(lat) - Math.abs(Math.sin(rel)) * 7.4 * sx - 1.6 < 2.6) rel = rng.range(-0.1, 0.1);
    addHero(rng.int(0, 1), tip, yawAlong + rel + (rng.chance(0.5) ? Math.PI : 0), sx, rng.range(0.8, 1.25));
  }
  const mtx = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const instMesh = (geo, list) => {
    const m = new THREE.InstancedMesh(geo, rockMat, list.length);
    const seeds = new Float32Array(list.length);
    list.forEach((it, i) => {
      e3.set(0, it.yaw, 0); q4.setFromEuler(e3); v3.set(it.x, it.y, it.z); s3.set(it.sx, it.sy || 1, it.sz);
      mtx.compose(v3, q4, s3); m.setMatrixAt(i, mtx); seeds[i] = it.seed;
    });
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; root.add(m);
    return m;
  };
  let triCount = 0;
  const parts = { blades: [], mid: null, far: null, fixed: null, plants: null, plantList: [], sifakas: null };
  for (const hv of heroVar) { parts.blades.push(instMesh(hv.geo, hv.list)); triCount += hv.tris * hv.list.length; }
  await ctx.yield?.();

  // ---- everything that is built once (not instanced) goes into one mesh: crest, cathedral, walls, floor
  let S = new Geo();
  const CM = (CE - 3) / 2, CH = (CE + 5) / 2;               // the crest runs from 4 m behind the entry to 1 m past its last tooth
  const crestMid = onLine(CM, 0, 0);
  const crestXf = placer(crestMid.x, 0, crestMid.z, yawAlong);
  const crest = finGeo(S, { len: CE + 5, y0: 16, y1: TOP + 0.6, tTop: 0.14, tBase: 7, nA: Math.round((CE + 5) * 1.26), rows: HROWS, toothDepth: 1.25, toothVar: 0.55,
    endDrop: 5, endPow: 6, toothStep: 2, grow: 0.08, flute: 0.9, bow: 0.25, peakAt: 0.9 }, rng, crestXf);
  const crestAt = (s) => { const q = crestXf(s - CM, crest.crestY(s - CM), 0.25 * (1 - ((s - CM) / CH) ** 2)); return new THREE.Vector3(q[0], q[1], q[2]); };

  // ---- the blade field: mid fins and far needles on a jittered joint grid
  const jAng = bAng + rng.range(-7, 7) * DEG;
  const ax = Math.sin(jAng), az = -Math.cos(jAng), cx = Math.cos(jAng), cz = Math.sin(jAng);
  const yawJ = Math.atan2(-az, ax);
  const TH = opts.towerHeight ?? 104, TUP = TH - 104;      // the Cathedral's height (the brief's 104 m; a world may raise it so the landmark reads from 500 m)
  const towers = [{ x: px * 19.5, z: pz * 19.5, h: TH }, { x: -px * 19.5, z: -pz * 19.5, h: TH - 3.5 + rng.range(-1.5, 1.5) }];
  const spires = [
    { x: hx * 44 - px * 30, z: hz * 44 - pz * 30, h: 93 + TUP * 0.6 + rng.range(-3, 3) },
    { x: hx * 30 + px * 46, z: hz * 30 + pz * 46, h: 90 + TUP * 0.6 + rng.range(-3, 3) },
    { x: -hx * 14 - px * 52, z: -hz * 14 - pz * 52, h: 87 + TUP * 0.6 + rng.range(-2, 3) },
  ];
  const zone = (x, z) => {                                  // 0 none, 1 mid, 2 far
    const li = lineInfo(x, z), over = Math.max(0, -10 - li.s, li.s - (UP_LEN + 8));
    const dApp = Math.hypot(li.lat, over), dO = Math.hypot(x, z), dS = slotDist(x, z);
    for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < 19) return 0;
    for (const t of spires) if (Math.hypot(x - t.x, z - t.z) < 13) return 0;
    const ex = (x - xc * 0.4) / 400, ez = (z - 120) / 525;
    if (ex * ex + ez * ez > 1) return 0;
    const mid = dApp < 92 || dO < 150 || dS < 52;
    if (mid) return dS < 10.5 || (dApp < 17.5 && over === 0) ? 0 : 1;
    return dS < 17 ? 0 : 2;
  };
  const midList = [], farList = [];
  const grid = async (pu, pw, tier, list) => {
    let row = 0;
    for (let w = -620; w <= 620; w += pw) {
      if ((row++ & 1) === 1) await ctx.yield?.();
      const stag = (Math.round(w / pw) & 1) * pu * 0.5 + rng.range(-2, 2);
      for (let u = -700; u <= 700; u += pu) {
        const uu = u + stag + rng.range(-0.3, 0.3) * pu, ww = w + rng.range(-0.22, 0.22) * pw;
        const x = uu * ax + ww * cx, z = 120 + uu * az + ww * cz;
        if (zone(x, z) !== tier) continue;
        const cross = rng.chance(0.24);
        list.push({ x, z, y: rng.range(-2.4, 1.8) + (rng.chance(0.06) ? rng.range(1.5, 4) : 0), yaw: yawJ + (cross ? 78 * DEG : 0) + rng.range(-0.16, 0.16) + (rng.chance(0.5) ? Math.PI : 0),
          sx: (tier === 1 ? rng.range(0.7, 1.45) : rng.range(0.75, 1.5)) * (cross ? 0.7 : 1), sz: rng.range(0.8, 1.3), seed: rng() });
      }
    }
  };
  await grid(17, 9, 1, midList);
  await ctx.yield?.();
  await grid(24, 11.5, 2, farList);
  {
    const g = new Geo();
    finGeo(g, { len: 12, y0: 12, y1: TOP, tTop: 0.2, tBase: 7.5, nA: 5, rows: [0, 0.2, 1], toothDepth: 2.5, toothVar: 1.5, endDrop: 9, toothStep: 1, grow: 0.25, flute: 0.3, top: 2.5, cut: true }, rng);
    parts.mid = instMesh(g.build(), midList); triCount += g.tris * midList.length;
    const f = new Geo();
    finGeo(f, { len: 19, y0: 30, y1: TOP, tTop: 0.3, tBase: 10.5, nA: 3, rows: [0, 1], toothDepth: 2.5, toothVar: 2, endDrop: 11, toothStep: 1, grow: 0.3, flute: 0, top: 4.5, tPow: 0.85, cut: true }, rng);
    parts.far = instMesh(f.build(), farList); triCount += f.tris * farList.length;
  }
  await ctx.yield?.();

  // generic tapered tube through points (Vector3[]), ring radius r(i); used for roots, branches, the bridge
  const tubeAlong = (G, pts, rad, sides, kind, col, flOf, squash = 1) => {
    const start = G.n, d = new THREE.Vector3(), b1 = new THREE.Vector3(), b2 = new THREE.Vector3(), ref = new THREE.Vector3();
    for (let i = 0; i < pts.length; i++) {
      d.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      ref.set(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0);
      b1.crossVectors(d, ref).normalize(); b2.crossVectors(d, b1).normalize();
      const r = rad(i), tw = i * 0.5;
      for (let k = 0; k < sides; k++) {
        const a = (k / sides) * Math.PI * 2 + tw, ca = Math.cos(a) * r, sa = Math.sin(a) * r * squash;
        const c = typeof col === 'function' ? col(i, k) : col;
        G.v(pts[i].x + b1.x * ca + b2.x * sa, pts[i].y + b1.y * ca + b2.y * sa, pts[i].z + b1.z * ca + b2.z * sa, c[0], c[1], c[2], flOf(i, k), kind);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) {
      const a = start + i * sides + k, b = start + i * sides + ((k + 1) % sides);
      G.quad(a, b, b + sides, a + sides);
    }
  };

  // ---- the Cathedral: two towers and three lesser spires, each a fused sheaf of tall blades
  const yawH = Math.atan2(-hz, hx);
  const TROWS = [0, 0.02, 0.05, 0.1, 0.18, 0.3, 0.46, 0.66, 0.84, 1];
  const towerTops = [];
  const sheaf = (cx0, cz0, hTop, nF, rad, guard) => {
    const a0 = rng.range(0, 6.28);
    for (let k = 0; k < nF; k++) {
      const main = k === 0;
      const h = main ? hTop : k === 1 ? hTop - rng.range(3, 7) : hTop - rng.range(5, 12) - k * rng.range(2.2, 4.2);
      const len = main ? rng.range(21, 25) : k === 1 ? rng.range(17, 21) : rng.range(11, 18), tBase = main ? rng.range(12, 14) : rng.range(7, 10.5);
      const wing = guard && k === 1;
      const rel = main ? rng.range(-0.25, 0.25) : wing ? 90 * DEG + rng.range(-0.25, 0.25) : (rng.chance(0.5) ? 0 : 78 * DEG) + rng.range(-0.4, 0.4);
      const a = a0 + (k / Math.max(1, nF - 1)) * 6.28 + rng.range(-0.3, 0.3), r = main || wing ? 0 : rad * rng.range(0.55, 1);
      let fx = cx0 + Math.cos(a) * r, fz = cz0 + Math.sin(a) * r;
      if (guard) {                                          // keep the 16 m keyhole open
        const lat = fx * px + fz * pz, sgn = Math.sign(cx0 * px + cz0 * pz) || 1;
        const ext = Math.abs(Math.sin(rel)) * len * 0.5 * 1.35 + Math.abs(Math.cos(rel)) * tBase * 0.5;
        const need = 8.8 + ext - lat * sgn;
        if (need > 0) { fx += px * need * sgn; fz += pz * need * sgn; }
      }
      const res = finGeo(S, { len, y0: -1.5, y1: h, tTop: 0.25, tBase, nA: 14, rows: TROWS, toothDepth: main ? 7 : 5, toothVar: 3.5,
        endDrop: h * (main ? 0.5 : 0.42), endPow: main ? 1.25 : 1.5, toothStep: 2, grow: 0.34, flute: 0.72, bow: rng.range(-0.8, 0.8),
        peakAt: rng.range(-0.25, 0.25), tPow: 0.8 }, rng, placer(fx, 0, fz, yawH + rel, rng.range(-0.035, 0.035)));
      if (main) towerTops.push(new THREE.Vector3(res.peak[0], res.peak[1], res.peak[2]));
    }
  };
  towers.forEach((t) => sheaf(t.x, t.z, t.h, 7, 8.5, true));
  await ctx.yield?.();
  spires.forEach((t) => sheaf(t.x, t.z, t.h, 4, 6, false));
  // the towers go to the card on their own, so no single step of the build carries all the fixed stone
  await ctx.yield?.();
  { const m = new THREE.Mesh(S.build(), rockMat); m.frustumCulled = false; root.add(m); parts.towers = m; triCount += S.tris; S = new Geo(); }
  await ctx.yield?.();
  // the rock bridge 25 m over the stream, seen from below
  {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const t = -1 + i / 8; pts.push(new THREE.Vector3(px * t * 18 + hx * 1.5, 28.2 + 2.6 * (1 - t * t) + 0.5 * Math.sin(i * 1.7), pz * t * 18 + hz * 1.5)); }
    tubeAlong(S, pts, (i) => { const t = -1 + i / 8; return 2.7 * (1 + 0.55 * t * t) * (1 + 0.12 * Math.sin(i * 2.3)); }, 8, 0,
      (i, k) => { const sh = 0.7 + 0.3 * Math.abs(Math.sin(k * 2.4 + i)); return [sh, sh, sh]; }, (i, k) => i * 2.2 + k * 0.4, 1.7);
  }

  // ---- fissure and canyon walls: two long fluted fins facing each other across the slot
  const n2 = ctx.noise?.n2 || (() => 0);
  const WV = [1, 0.86, 0.7, 0.54, 0.4, 0.28, 0.18, 0.1, 0.045, 0];      // 1 = stream level, 0 = crest
  const BACK = [[5, 1.5], [20, 4.0], [46, 7.0]];                          // [metres below crest, metres further back]
  const wallTop = new Float32Array(cl.length), wallR = new Float32Array(cl.length);
  { let col = 0, drop = 0, pk = true;
    while (col < cl.length) {
      const nxt = Math.min(cl.length, col + rng.int(1, 3));
      const d1 = pk ? rng.range(0, 2.2) : drop + rng.range(1.5, 5) + (rng.chance(0.12) ? rng.range(5, 11) : 0);
      for (let i = col; i < nxt; i++) { const t = (i - col) / (nxt - col); wallTop[i] = lerp(drop, d1, t); wallR[i] = pk ? t : 1 - t; }
      drop = d1; col = nxt; pk = !pk;
    } }
  const wallRec = [[], []];
  for (const side of [-1, 1]) {
    await ctx.yield?.();
    const base = S.n, W = WV.length + BACK.length;
    for (let i = 0; i < cl.length; i++) {
      const c = cl[i], k = side > 0 ? i : (i + 57) % cl.length;
      const top = lerp(65.5, TOP + 1.2 * n2(c.s * 0.03, side * 9), sstep(2, 17, c.s)) - wallTop[k] * sstep(4, 20, c.s);
      const r = wallR[k];
      for (let j = 0; j < W; j++) {
        let y, o, sh;
        if (j < WV.length) {
          const v = WV[j]; y = top + (-1.5 - top) * v;
          o = c.hw + 0.3 + 1.7 * Math.pow(1 - v, 1.6) + 1.8 * (n2(c.s * 0.045 + side * 31, y * 0.05) * 0.5 + 0.5) + 1.5 * (1 - r) * sstep(0, 0.1, v);
          if (side > 0) o += notch(c.s, y);
          if (v === 0) o += 0.5;
          sh = (0.62 + 0.38 * r) * (1 - 0.1 * v);
        } else { const b = BACK[j - WV.length]; y = top - b[0]; o = c.hw + 3.2 + b[1] + 1.5 * r; sh = 0.8; }
        if (j < WV.length) wallRec[side > 0 ? 1 : 0].push(y, o);
        S.v(c.x + c.nx * o * side, y, c.z + c.nz * o * side, sh, sh, sh, c.s, 0, 1);
      }
    }
    for (let i = 0; i < cl.length - 1; i++) for (let j = 0; j < W - 1; j++) {
      const a = base + i * W + j, b = a + W;
      if (side > 0) S.quad(a, b, b + 1, a + 1); else S.quad(a, a + 1, b + 1, b);
    }
  }
  // ---- floor: the stream down the slot (kind 3, colour.r = 1) over a wide dark forest floor
  {
    const base = S.n, LAT = [-1.15, -0.5, 0, 0.5, 1.15];
    for (let i = 0; i < cl.length; i += 2) { const c = cl[i]; for (const l of LAT) { const o = l * (c.hw + 2.5 + (l > 1 ? notch(c.s, 0) : 0)); S.v(c.x + c.nx * o, -0.2 + Math.abs(l) * 0.9, c.z + c.nz * o, 1, 1, 1, o, 3); } }
    const rowsN = Math.ceil(cl.length / 2);
    for (let i = 0; i < rowsN - 1; i++) for (let j = 0; j < 4; j++) { const a = base + i * 5 + j; S.quad(a, a + 5, a + 6, a + 1); }
    const cc = S.v(xc * 0.4, -1.4, 120, 0, 0, 0, 99, 3), ring = S.n;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.2832; S.v(xc * 0.4 + Math.cos(a) * 450, -1.4, 120 + Math.sin(a) * 580, 0, 0, 0, 99, 3); }
    for (let i = 0; i < 28; i++) S.tri(cc, ring + ((i + 1) % 28), ring + i);
  }
  await ctx.yield?.();

  // a point on the real wall surface: sample i of the centreline, side -1 | 1, nearest row to height y
  const wallPoint = (i, side, y, out = new THREE.Vector3()) => {
    i = Math.max(0, Math.min(cl.length - 1, Math.round(i)));
    const rec = wallRec[side > 0 ? 1 : 0], b = i * WV.length * 2; let bj = 0, bd = 1e9;
    for (let j = 0; j < WV.length; j++) { const d = Math.abs(rec[b + j * 2] - y); if (d < bd) { bd = d; bj = j; } }
    const c = cl[i], o = rec[b + bj * 2 + 1];
    return out.set(c.x + c.nx * o * side, rec[b + bj * 2], c.z + c.nz * o * side);
  };
  // the wall's distance from the centreline at sample i and height y (between the rows of the mesh)
  const wallOff = (i, side, y) => {
    i = Math.max(0, Math.min(cl.length - 1, Math.round(i)));
    const rec = wallRec[side > 0 ? 1 : 0], b = i * WV.length * 2;
    for (let j = 0; j < WV.length - 1; j++) { const y0 = rec[b + j * 2], y1 = rec[b + j * 2 + 2]; if (y <= y1 || j === WV.length - 2) { const t = Math.max(0, Math.min(1, (y - y0) / Math.max(1e-3, y1 - y0))); return lerp(rec[b + j * 2 + 1], rec[b + j * 2 + 3], t); } }
    return rec[b + 1];
  };
  const wallAt = (i, side, y, out = new THREE.Vector3(), lift = 0) => {
    i = Math.max(0, Math.min(cl.length - 1, Math.round(i)));
    const c = cl[i], o = wallOff(i, side, y) - lift;
    return out.set(c.x + c.nx * o * side, y, c.z + c.nz * o * side);
  };
  const clIndexNear = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < cl.length; i++) { const d = (cl[i].x - x) ** 2 + (cl[i].z - z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; };
  const iPortal = clIndexNear(0, 0);

  // the stone built so far goes to the card now and the roots follow in a mesh of their own, so neither step of the build is long
  { const m = new THREE.Mesh(S.build(), rockMat); m.frustumCulled = false; root.add(m); parts.fixed = m; triCount += S.tris; S = new Geo(); }
  await ctx.yield?.();
  // ---- strangler-fig roots: tapered, twisted cables down the walls and off the bridge (kind 4, they sway)
  const rootCol = (i, k) => { const sh = 0.75 + 0.5 * ((k * 7 + i * 3) % 5) / 5; return [sh, sh * 0.95, sh * 0.9]; };
  const wallRoot = (i, side) => {
    const c = cl[i], top = wallRec[side > 0 ? 1 : 0][i * WV.length * 2 + (WV.length - 2) * 2];
    const yTop = top - rng.range(0, 6), yBot = rng.range(-1, 14), n = 14, pts = [], r0 = rng.range(0.1, 0.19), wig = rng.range(0, 6.28), slide = rng.range(-2.2, 2.2);
    for (let j = 0; j < n; j++) {                           // the cable lies on the wall, standing off it in slack loops
      const t = j / (n - 1), y = lerp(yTop, yBot, t);
      const al = slide * t + 0.35 * Math.sin(t * 7 + wig), ii = i + al / 1.5;
      const o = Math.min(wallOff(ii, side, y), wallOff(ii, side, y + 5), wallOff(ii, side, y - 5)) - r0 * 0.7 - 0.22 * (0.5 + 0.5 * Math.sin(t * 9 + wig)) * Math.sin(t * Math.PI);
      pts.push(new THREE.Vector3(c.x + c.nx * o * side + c.tx * al, y, c.z + c.nz * o * side + c.tz * al));
    }
    tubeAlong(S, pts, (j) => r0 * (1 - 0.6 * (j / (n - 1))) + 0.03, 7, 4, rootCol, (j) => 0.3 * Math.sin((j / (n - 1)) * Math.PI));
    return pts;
  };
  const keyRoots = [];
  for (let k = 0; k < 54; k++) {
    const zone3 = k < 30 ? k % 3 : k < 40 ? 2 : 0;                       // fissure, canyon, keyhole
    let i = zone3 === 0 ? rng.int(8, 60) : zone3 === 1 ? rng.int(60, iPortal - 30) : iPortal - rng.int(5, 28);
    i = Math.max(4, Math.min(cl.length - 2, i));
    const side = k % 2 ? 1 : -1, pts = wallRoot(i, side);
    if (zone3 === 2 && side < 0) keyRoots.push(pts);
    if (k % 14 === 13) await ctx.yield?.();
  }
  // ---- the flight line (the world flies exactly this). It is laid out here because the lead animal's way down the fissure is hung along it.
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const LP = landings.map((L) => L.pos);
  const LIFT = opts.entryLift ?? 6;                          // the ride opens high over the sea of blades and comes down onto the crest
  const fly = [entry.clone().add(V(0, LIFT, 0)), crestAt(CE * 0.34).add(V(0, 1.5 + LIFT * 0.6, 0)), crestAt(CE * 0.68).add(V(0, 0.95, 0)), LP[0].clone().add(V(0, 0.9, 0))];
  for (let k = 1; k <= NL; k++) {
    const a = LP[k - 1], b = LP[k], fall = Math.max(0, a.y - b.y);
    fly.push(a.clone().lerp(b, 0.5 - Math.min(0.12, fall * 0.012)).add(V(0, 0.9 + (k < NL - 1 ? 1.6 : 2.2) + fall * 0.16, 0)), b.clone().add(V(0, 0.9, 0)));
  }
  const iDive = fly.length;                                 // the first point of the dive
  const clAt = (s, y) => { const c = cl[Math.max(0, Math.min(cl.length - 1, Math.round(s / 1.5)))]; return V(c.x, y, c.z); };
  const sPortal = cl[iPortal].s;
  { const a = cl[1], b = cl[Math.min(cl.length - 1, Math.round(82 / 1.5))]; U.uSlotSeg.value.set(a.x, a.z, b.x, b.z); }   // the fissure's axis in plan (for its mist)
  fly.push(clAt(14, 55), clAt(34, 34), clAt(56, 16), clAt(74, 9), clAt(100, 5.6), clAt(140, 4.6), clAt(190, 4.2), clAt(sPortal - 70, 4.2), clAt(sPortal - 35, 4.4), V(0, 4.5, 0));
  // the same curve the world's path is (kit makePath: centripetal Catmull-Rom by arc length), so the script below can be keyed to where the lens will be
  const flyCurve = new THREE.CatmullRomCurve3(fly, false, 'centripetal', 0.5); flyCurve.arcLengthDivisions = Math.max(400, fly.length * 60);
  const flyLen = flyCurve.getLength();
  const arcNear = (p, from) => {                             // metres along the flight line nearest to a point, searching forward
    let best = 1e12, ba = from;
    for (let i = Math.floor((from / flyLen) * 2400); i <= 2400; i++) { flyCurve.getPointAt(i / 2400, tv); const d = tv.distanceToSquared(p); if (d < best) { best = d; ba = (i / 2400) * flyLen; } else if (best < 1 && d > best + 900) break; }
    return ba;
  };
  const arcLand = []; { let from = 0; for (let k = 0; k <= NL; k++) { from = arcNear(fly[3 + 2 * k], from); arcLand.push(from); } }
  await ctx.yield?.();
  // the dive: the lens leaves the lip at T = 19 s and is at the bottom of the fissure at 23.5; it keeps that speed for 2.25 s more (the world's clock agrees)
  const arcLip = arcLand[NL], arcBottom = arcNear(fly[iDive + 3], arcLip), VD = (arcBottom - arcLip) / 4.5;
  const lensArc = (T) => arcLip + (T - 19) * VD;
  const T55 = 19 + (0.55 * flyLen - arcLip) / VD;            // when the lens is at path fraction 0.55
  const timing = { uLand: arcLand.map((a) => a / flyLen), uLip: arcLip / flyLen, uBottom: arcBottom / flyLen, uOut: (arcBottom + 2.25 * VD) / flyLen, tOut: 25.75 };
  // ---- the near faces of the street. Between the dropping leaps and the lip the eye is 3 to 8 m from the flanks of the blades for a fifth of
  // the flight, so those faces are furnished: `holds` are real points on the hero blades' flanks (taken from their meshes) that face the flight
  // line a few metres off, in sight of an eye coming down the street and clear of every other blade. Ledges with Pachypodium stand on some,
  // animals cling to others and leap between them (the street's own, on wall time), and three drop across the street under the hawk.
  let sdS = (Math.floor(Math.abs(entry.x * 631 + bAng * 7717)) % 9973) + 7;
  const sr = () => { sdS = (sdS * 16807) % 2147483647; return (sdS & 0xffff) / 65536; };       // a generator of its own: nothing drawn here moves anything else
  const HVP = [{ bow: -0.3, endDrop: 8 }, { bow: 0.5, endDrop: 13 }];
  const insideBlade = (x, y, z, margin) => {              // is the point inside a hero blade (the lens of the fin worked out, a little generous)
    for (let k = 0; k < 2; k++) {
      const pr = HVP[k];
      for (const it of heroVar[k].list) {
        const X = x - it.x, Z = z - it.z; if (X * X + Z * Z > 150) continue;
        const c = Math.cos(it.yaw), sn = Math.sin(it.yaw), xl = (X * c - Z * sn) / it.sx, zl = (X * sn + Z * c) / it.sz, yl = y - it.y;
        const cy = TOP - pr.endDrop * Math.pow(Math.min(1.2, Math.abs(xl / 6)), 2.4) - 0.8;
        if (yl > cy || yl < 16) continue;
        const v = (cy - yl) / (cy - 16), sN = xl / (6 * (1 + 0.22 * v)); if (Math.abs(sN) >= 1) continue;
        if (Math.abs(zl - pr.bow * (1 - sN * sN)) < 0.5 * (0.12 + 5.48 * Math.pow(v, 0.7)) * Math.sqrt(1 - sN * sN) + margin / it.sz) return true;
      }
    }
    return false;
  };
  const eyeTab = [];                                        // the flight line as far as the lip: [metres along the upper line, x, y, z]
  for (let i = 0; i <= 320; i++) { flyCurve.getPointAt(Math.min(1, ((i / 320) * arcLip) / flyLen), tv); eyeTab.push([lineInfo(tv.x, tv.z).s, tv.x, tv.y, tv.z]); }
  const eyeAt = (s, out) => { let i = 0; while (i < eyeTab.length - 2 && eyeTab[i + 1][0] < s) i++; const a = eyeTab[i], b = eyeTab[i + 1], t = Math.max(0, Math.min(1, (s - a[0]) / Math.max(1e-3, b[0] - a[0]))); return out.set(lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)); };
  const holds = [];
  {
    const W = 27, R = HROWS.length, p = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Vector3(), e = new THREE.Vector3(), o2 = new THREE.Vector3();
    for (let k = 0; k < 2; k++) {
      const hv = heroVar[k], PA = hv.geo.attributes.position.array, NA = hv.geo.attributes.normal.array;
      let nb = 0;
      for (const it of hv.list) {
        const l0 = lineInfo(it.x, it.z); if (l0.s < 14 || l0.s > UP_LEN + 8 || Math.abs(l0.lat) > 20) continue;
        if (++nb % 3 === 0) await ctx.yield?.();
        const c = Math.cos(it.yaw), sn = Math.sin(it.yaw);
        const vw = (i, out) => { const x = PA[i * 3] * it.sx, z = PA[i * 3 + 2] * it.sz; return out.set(it.x + x * c + z * sn, it.y + PA[i * 3 + 1], it.z - x * sn + z * c); };
        for (let sd = 0; sd < 2; sd++) for (let col = 2; col <= 24; col++) for (const dh of [0.3, 1.5, 2.7]) {
          const base = sd * R * W + col, other = (1 - sd) * R * W + col;
          vw(base + 3 * W, p); const li = lineInfo(p.x, p.z);
          if (li.s < 27 || li.s > UP_LEN - 3 || Math.abs(li.lat) < 3.2 || Math.abs(li.lat) > 9.5) continue;
          const yT = eyeAt(li.s, e).y + dh;
          let j = 1; while (j < R - 2 && it.y + PA[(base + (j + 1) * W) * 3 + 1] > yT) j++;
          const ya = it.y + PA[(base + j * W) * 3 + 1], yb = it.y + PA[(base + (j + 1) * W) * 3 + 1]; if (yT > ya || yT < yb) continue;
          const t = (ya - yT) / Math.max(1e-3, ya - yb), ia = (base + j * W) * 3, ib = (base + (j + 1) * W) * 3;
          vw(base + j * W, p).lerp(vw(base + (j + 1) * W, q), t);
          const nx = lerp(NA[ia], NA[ib], t) / it.sx, ny = lerp(NA[ia + 1], NA[ib + 1], t), nz = lerp(NA[ia + 2], NA[ib + 2], t) / it.sz;
          n.set(nx * c + nz * sn, ny, -nx * sn + nz * c).normalize();
          vw(other + j * W, o2).lerp(vw(other + (j + 1) * W, q), t); if (n.dot(o2.sub(p)) > 0) n.negate();     // outward: away from the blade's other flank
          if (Math.abs(n.y) > 0.5) continue;
          const lp = lineInfo(p.x, p.z); if (Math.abs(lp.lat) < 3.3 || Math.abs(lp.lat) > 9) continue;
          eyeAt(lp.s - 9, e); q.subVectors(e, p).normalize(); const vis = n.dot(q); if (vis < 0.3) continue;
          if (insideBlade(p.x + n.x * 0.6, p.y + n.y * 0.6, p.z + n.z * 0.6, 0.25)) continue;
          let seen = true;
          for (const f of [0.3, 0.55, 0.8]) { q.set(p.x + n.x * 0.5, p.y, p.z + n.z * 0.5).lerp(e, f); if (insideBlade(q.x, q.y, q.z, 0)) { seen = false; break; } }
          if (!seen) continue;
          holds.push({ p: p.clone(), n: n.clone(), s: lp.s, lat: lp.lat, dh, vis });
        }
      }
    }
  }
  await ctx.yield?.();
  const usedHolds = [];
  const pickHold = (sT, side, o = {}) => {                 // the best free hold near sT metres along the line, on one side of it
    let best = null, bc = 1e9;
    for (const h of holds) {
      if (Math.sign(h.lat) !== side || (o.dh !== undefined && Math.abs(h.dh - o.dh) > 0.5)) continue;
      const al = Math.abs(h.lat), ds = Math.abs(h.s - sT); if (al < (o.latMin ?? 3.5) || al > (o.latMax ?? 8) || ds > (o.reach ?? 5)) continue;
      let ok = true; for (const u of usedHolds) if (u.p.distanceToSquared(h.p) < (o.apart ?? 3.4) ** 2) { ok = false; break; }
      if (!ok) continue;
      const cost = ds * 0.6 + Math.abs(al - (o.lat ?? 4.8)) - 2.5 * h.vis;
      if (cost < bc) { bc = cost; best = h; }
    }
    if (best) usedHolds.push(best);
    return best;
  };
  const faceOf = (h) => Math.atan2(-h.n.x, -h.n.z);         // an animal on a hold has its belly to the stone
  const freeOf = (h, apart) => { for (const u of usedHolds) if (u.p.distanceToSquared(h.p) < apart * apart) return false; return true; };
  // a leap between two holds: the outward bow it needs (same side: the animal kicks off the face and sails out; across the street: none) and whether it is clear of stone
  const leapClear = (A, B, out) => {
    const same = Math.sign(A.lat) === Math.sign(B.lat), mx = A.n.x + B.n.x, mz = A.n.z + B.n.z, ml = Math.hypot(mx, mz);
    if (same && ml < 0.6) return false;
    out.bx = same ? (mx / ml) * 1.5 : 0; out.bz = same ? (mz / ml) * 1.5 : 0;
    for (let f = 0.14; f < 0.9; f += 0.12) {
      const k4 = 4 * f * (1 - f); tv.set(A.p.x + A.n.x * 0.45, A.p.y, A.p.z + A.n.z * 0.45).lerp(o3.set(B.p.x + B.n.x * 0.45, B.p.y, B.p.z + B.n.z * 0.45), f);
      if (insideBlade(tv.x + out.bx * k4, tv.y + 1.0 * k4, tv.z + out.bz * k4, 0.3)) return false;
    }
    if (same && Math.min(Math.abs(lineInfo(A.p.x + out.bx, A.p.z + out.bz).lat), Math.abs(lineInfo(B.p.x + out.bx, B.p.z + out.bz).lat)) < 2.6) return false;   // the bow stays off the flight line
    return true;
  };
  // the three that drop toward the lip under the hawk: in the air when the lens is at path fraction 0.305, 9 to 16 m ahead of it (placed first: they have
  // the pick of the holds), then on to a hold beside the lip, where they wait for us before they go down
  const dropPlan = [];
  {
    flyCurve.getPointAt(0.305, tv); const sCam = lineInfo(tv.x, tv.z).s, bw = { bx: 0, bz: 0 };
    for (let j = 0; j < 3; j++) {
      const sA = sCam + 6.5 + 3.4 * j; let best = null, bc = 1e9;
      for (const A of holds) {
        if (Math.abs(A.s - sA) > 5 || Math.abs(A.lat) > 8.6 || A.dh < 1 || !freeOf(A, 2.4)) continue;
        for (const B of holds) {
          const d2 = B.p.distanceToSquared(A.p);
          if (B.s < A.s + 3 || B.s > A.s + 10.5 || d2 < 30 || d2 > 150 || Math.abs(B.lat) > 8.6 || B.dh > 2 || !freeOf(B, 2.4)) continue;
          const cross = Math.sign(B.lat) !== Math.sign(A.lat);
          const cost = Math.abs(A.s - sA) * 0.5 + (Math.abs(A.lat) + Math.abs(B.lat)) * 0.4 - 2 * (A.vis + B.vis) + (cross ? 0 : 2.5);
          if (cost < bc && leapClear(A, B, bw)) { bc = cost; best = [A, B, bw.bx, bw.bz]; }
        }
      }
      if (!best) continue;
      usedHolds.push(best[0], best[1]);
      let Cc = null, cc = 1e9;
      for (const h of holds) { if (h.s < UP_LEN - 9 || h.s > UP_LEN - 1.5 || Math.abs(h.lat) > 7.8 || !freeOf(h, 2.4) || !leapClear(best[1], h, bw)) continue; const c = Math.abs(h.lat) * 0.3 + h.dh * 0.6 - h.vis + Math.abs(h.s - UP_LEN + 5) * 0.15 + (Math.sign(h.lat) === Math.sign(best[1].lat) ? 1.5 : 0); if (c < cc) { cc = c; Cc = { h, bx: bw.bx, bz: bw.bz }; } }
      if (Cc) usedHolds.push(Cc.h);
      dropPlan.push({ A: best[0], B: best[1], bx: best[2], bz: best[3], C: Cc, sCam, j });
    }
  }
  // where the street's own animals live: a hold, and a second one 4.5 to 9.5 m further along on the same side (they never cross the flight line)
  const streetPairs = [];
  {
    const bw = { bx: 0, bz: 0 };
    for (const sT of [73.5, 95, 102, 122, 144, 158, 172]) {
      let A = null, bc = 1e9;
      for (const h of holds) {
        const al = Math.abs(h.lat), ds = Math.abs(h.s - sT); if (ds > 4.5 || al < 3.6 || al > 7.4 || !freeOf(h, 3.6)) continue;
        const cost = ds * 0.7 + Math.abs(al - 4.9) + Math.abs(h.dh - 1.5) * 0.4 - 2.5 * h.vis;
        if (cost < bc) { bc = cost; A = h; }
      }
      if (!A) continue;
      usedHolds.push(A);
      let B = null, bs = -1e9, bx = 0, bz = 0;
      for (const h of holds) {
        if (Math.sign(h.lat) !== Math.sign(A.lat) || Math.abs(h.lat) < 3.6 || !freeOf(h, 3)) continue;
        const d = h.p.distanceTo(A.p); if (d < 4.5 || d > 9.5 || h.s < A.s - 1.5 || h.s > A.s + 8.5) continue;
        const sc = h.vis * 2 + (h.s - A.s) * 0.1 - Math.abs(d - 7) * 0.3;
        if (sc > bs && leapClear(A, h, bw)) { bs = sc; B = h; bx = bw.bx; bz = bw.bz; }
      }
      if (B) usedHolds.push(B);
      streetPairs.push({ A, B, bx, bz });
    }
  }
  // ledges: a bracket of the blade's own stone standing out of the face, a flat top with a knife lip, corbelled back into the wall below
  const ledgePlants = [];
  const ledge = (h, Wd, D) => {
    const hl = Math.hypot(h.n.x, h.n.z) || 1, nx = h.n.x / hl, nz = h.n.z / hl, ux = -nz, uz = nx, NR = 7, top = [], lipR = [], und = [];
    const P = (a, o, y, sh) => S.v(h.p.x + ux * a + nx * o, h.p.y + y, h.p.z + uz * a + nz * o, sh, sh, sh, h.s * 0.7 + a + o * 0.6, 0);
    const c0 = P(0, -0.4, 0.03, 0.95);
    for (let i = 0; i <= NR; i++) {
      const a = -1 + (2 * i) / NR, ca = Math.sqrt(Math.max(0, 1 - a * a)), jag = 1 + 0.2 * Math.sin(i * 2.7 + h.s);
      top.push(P(a * Wd * 0.5, -0.4 + (D + 0.4) * ca * jag, -0.07 * ca + 0.05 * Math.sin(i * 1.9 + h.s), 1.0));
      lipR.push(P(a * Wd * 0.5, -0.4 + (D + 0.4) * ca * jag * 0.95, -0.2 - 0.12 * ca, 0.6));
      und.push(P(a * Wd * 0.4, -0.4, -0.55 - 0.8 * ca, 0.46));
    }
    for (let i = 0; i < NR; i++) { S.tri(c0, top[i], top[i + 1]); S.quad(top[i], lipR[i], lipR[i + 1], top[i + 1]); S.quad(lipR[i], und[i], und[i + 1], lipR[i + 1]); }
    return { x: h.p.x + nx * D * 0.42, y: h.p.y - 0.02, z: h.p.z + nz * D * 0.42 };
  };
  {
    let side = sr() < 0.5 ? 1 : -1, k = 0;
    for (let sT = 49 + 3 * sr(); sT < UP_LEN - 5; sT += 8 + 4 * sr()) {
      const dh = k % 3 === 2 ? 0.3 : k % 3 ? 1.5 : 2.7, h = pickHold(sT, side, { dh, lat: 5, latMin: 3.9, apart: 3.8, reach: 4 }) || pickHold(sT, -side, { dh, lat: 5, latMin: 3.9, apart: 3.8, reach: 4 });
      side = -side; k++;
      if (!h) continue;
      const big = sr() < 0.4, q = ledge(h, big ? 2.3 : 1.6 + 0.5 * sr(), big ? 1.0 : 0.75), sc = (big ? 0.72 : 0.5) + 0.22 * sr();
      ledgePlants.push({ x: q.x, y: q.y - 0.12 * sc, z: q.z, yaw: sr() * 6.28, sx: sc * 0.9, sy: sc * (1.05 + 0.2 * sr()), sz: sc * 0.9, seed: sr() });
    }
  }
  // the picture at path fraction 0.16: one wide ledge in the middle of the view, 11 to 17 m ahead of the lens, and on it a bottle tree
  // (a Pachypodium twice the size of the others, in flower) with a seedling beside it
  {
    const uS = opts.ledgeU ?? 0.16, C = flyCurve.getPointAt(uS), F = flyCurve.getPointAt(Math.min(1, uS + 26 / flyCurve.getLength())).sub(C).normalize();
    let best = null, bs = -1e9;
    for (const [dMax, fwMin, dyMax, apart] of [[20.5, 0.885, 0.15, 2.6], [24, 0.85, 0.2, 1.6], [28, 0.8, 0.26, 1.2]]) {
      for (const h of holds) {
        const vx = h.p.x - C.x, vy = h.p.y - C.y, vz = h.p.z - C.z, d = Math.hypot(vx, vy, vz);
        if (d < 11 || d > dMax || !freeOf(h, apart)) continue;
        const fw = (vx * F.x + vy * F.y + vz * F.z) / d, facing = -(h.n.x * vx + h.n.y * vy + h.n.z * vz) / d;
        if (fw < fwMin || facing < 0.18 || Math.abs(vy / d - F.y + 0.02) > dyMax) continue;
        const sc = fw * 14 + facing * 3 - Math.abs(d - 15) * 0.2 - Math.abs(vy / d - F.y + 0.02) * 12;
        if (sc > bs) { bs = sc; best = h; }
      }
      if (best) break;
    }
    if (best) {
      usedHolds.push(best);
      const q = ledge(best, 4.4, 2.0), hl = Math.hypot(best.n.x, best.n.z) || 1, ux = -best.n.z / hl, uz = best.n.x / hl;
      ledgePlants.push({ x: q.x - ux * 0.35, y: q.y - 0.22, z: q.z - uz * 0.35, yaw: 2.2, sx: 2.1, sy: 2.3, sz: 2.1, seed: 0.53 });
      ledgePlants.push({ x: q.x + ux * 1.4, y: q.y - 0.08, z: q.z + uz * 1.4, yaw: 0.6, sx: 0.55, sy: 0.66, sz: 0.55, seed: 0.19 });
      parts.bigLedge = q;
    }
  }
  await ctx.yield?.();
  // ---- the lead animal's way down: aerial roots hanging clear of the walls, a little over two metres to either side of the flight line. It reaches each
  // one about 12 m ahead of the lens, clings there flank-on to us (belly to the root, hands and feet on it) until we are within 5 m, and drops to the
  // next. The last one it holds as the lens passes path fraction 0.55, eight metres off; then it springs up to the wall and watches us go by underneath.
  const leadDive = [];                                      // { pos (the root, at the animal's chest), face (yaw: belly to the root), tArr, tLeave }
  let leadPerch = null;
  let sd0 = (Math.floor(Math.abs(lip.x * 977 + ang * 3301)) % 9973) + 1;
  const lr = () => { sd0 = (sd0 * 16807) % 2147483647; return (sd0 & 0xffff) / 65536; };       // a generator of its own
  {
    const HOLD = 0.36, DUR = 0.56, D0 = 5.0, sched = [];
    let tArr = T55 - 0.32, tLeave = T55 + 0.17, arc = lensArc(T55) + 8.4;
    sched.push({ tArr, tLeave, arc, last: true });
    for (let n = 0; n < 9; n++) {
      const tl = tArr - DUR - 0.03 * (n % 2), a = lensArc(tl) + D0, ta = tl - HOLD;
      if (a - arcLip < 9 || ta < 18.7) break;
      sched.unshift({ tArr: ta, tLeave: tl, arc: a, last: false }); tArr = ta;
    }
    let side = sched.length % 2 ? -1 : 1;                   // the last root hangs on the left
    sched.forEach((h, n) => {
      flyCurve.getPointAt(Math.min(1, h.arc / flyLen), tv);
      const iw = clIndexNear(tv.x, tv.z), c = cl[iw], lat = side * (h.last ? 2.3 : 2.0 + 0.3 * lr()), y = Math.max(4.4, tv.y - (h.last ? 0.5 : 1.1) + 0.5 * (lr() - 0.5));
      const pos = new THREE.Vector3(tv.x + c.nx * lat, y, tv.z + c.nz * lat);
      const bx = c.nx * side * 0.95 + c.tx * 0.3, bz = c.nz * side * 0.95 + c.tz * 0.3;       // belly to the root from the flight line's side, turned a little down the fissure: we see its flank and back
      leadDive.push({ pos, face: Math.atan2(bx, bz), tArr: h.tArr, tLeave: h.tLeave, last: h.last });
      // its root: from the wall high above, out over the slot and straight down past the animal's hands
      const yT = y + 20 + 6 * lr(), top = wallAt(iw, side, yT), pts = [], below = 5 + 5 * lr(), r0 = 0.1 + 0.03 * lr();
      for (let j = 0; j <= 3; j++) { const q = j / 3, e = 1 - (1 - q) * (1 - q); pts.push(new THREE.Vector3(lerp(top.x, pos.x, e), lerp(yT, y + 9, q) + 1.2 * Math.sin(q * Math.PI), lerp(top.z, pos.z, e))); }
      for (let j = 1; j <= 8; j++) pts.push(new THREE.Vector3(pos.x + 0.03 * Math.sin(j * 1.9 + n), Math.max(-0.4, y + 9 - ((9 + below) * j) / 8), pos.z + 0.03 * Math.cos(j * 2.3 + n)));
      tubeAlong(S, pts, (j) => r0 * (1 - 0.03 * j) + 0.02, 6, 4, rootCol, (j) => (j > 9 ? 0.12 * (j - 9) : 0));
      if (h.last) { const ip = Math.min(cl.length - 2, iw + 5), yP = Math.min(y + 11, wallRec[side > 0 ? 1 : 0][ip * WV.length * 2 + (WV.length - 2) * 2] - 3); leadPerch = { pos: wallAt(ip, side, yP, new THREE.Vector3(), 0.05), face: Math.atan2(cl[ip].nx * side, cl[ip].nz * side) }; }
      side = -side;
    });
  }
  // an aerial root that drops clear of the left wall 21 m short of the ring: the animal that got there first waits on it
  const waitRoot = new THREE.Vector3(-hx * 21.5 - px * 4.5, 5.6, -hz * 21.5 - pz * 4.5);
  {
    const iw = clIndexNear(waitRoot.x, waitRoot.z), top = wallAt(iw, -1, 36), pts = [];
    for (let j = 0; j <= 4; j++) { const t = j / 4, e = 1 - (1 - t) * (1 - t); pts.push(new THREE.Vector3(lerp(top.x, waitRoot.x, e), lerp(36, 25, t) + 1.5 * Math.sin(t * Math.PI), lerp(top.z, waitRoot.z, e))); }
    for (let j = 1; j <= 7; j++) { const y = 25 - (25.4 * j) / 7; pts.push(new THREE.Vector3(waitRoot.x + 0.05 * Math.sin(j * 1.9), y, waitRoot.z + 0.05 * Math.cos(j * 2.3))); }
    tubeAlong(S, pts, (j) => 0.2 - 0.004 * j + (j > 10 ? 0.06 * (j - 10) : 0), 7, 4, rootCol, () => 0);
  }
  // ---- the fallen blade: a fin that toppled across the canyon 52 m short of the ring and wedged between the walls, 9 to 12 m over the stream. It lies
  // leaning back toward whoever comes down the canyon: its toothed crest uppermost and nearest, its fluted underside turned to us, moss on its back, fig
  // roots hanging from its foot. Part of the troop sits along the crest (the troop, 10).
  let arch = null;
  {
    let sdA = (Math.floor(Math.abs(lip.x * 541 + ang * 9127)) % 9973) + 3;
    const ar = () => { sdA = (sdA * 16807) % 2147483647; return (sdA & 0xffff) / 65536; };     // a generator of its own
    const arng = { range: (a, b) => a + (b - a) * ar(), chance: (q) => ar() < q, int: (a, b) => a + Math.floor(ar() * (b - a + 1)) };
    const sA = sPortal - (opts.archBack ?? 52.5), c = cl[Math.max(0, Math.min(cl.length - 1, Math.round(sA / 1.5)))], LEN = 2 * (c.hw + 3.6), HB = 5.6, aT = 0.45, ca = Math.cos(aT), sa = Math.sin(aT), yC = opts.archY ?? 12.3, TILT = 0.06, BOW = 0.35;
    // local (x along the blade = across the canyon, y from its foot to its crest, z through it) to hero space: the crest line passes over the stream at yC
    const xf = (x, y, z) => { const h = y - HB; return [c.x + c.nx * x - c.tx * ca * h + c.tx * sa * z, yC + x * TILT + sa * h + ca * z, c.z + c.nz * x - c.tz * ca * h + c.tz * sa * z]; };
    const res = finGeo(S, { len: LEN, y0: 0, y1: HB, tTop: 0.18, tBase: 1.5, nA: 24, rows: [0, 0.035, 0.1, 0.22, 0.45, 0.74, 1], toothDepth: 1.0, toothVar: 0.45, endDrop: 0.7, endPow: 6, toothStep: 2, grow: 0, flute: 0.8, bow: BOW, peakAt: 0.12 }, arng, xf);
    const crestPt = (x) => { const sN = x / (LEN * 0.5), q = xf(x, res.crestY(x), BOW * (1 - sN * sN)); return new THREE.Vector3(q[0], q[1], q[2]); };
    const footPt = (x) => { const sN = x / (LEN * 0.5), q = xf(x, 0, BOW * (1 - sN * sN) - 0.5); return new THREE.Vector3(q[0], q[1], q[2]); };
    for (const x0 of [-7.6, -5.2, 4.4, 6.6, 8.3]) {          // fig roots hanging from its foot, clear of the flight line
      const top = footPt(x0), len = 2.2 + 3.4 * ar(), r0 = 0.07 + 0.05 * ar(), wig = ar() * 6.28, pts = [];
      for (let j = 0; j < 8; j++) { const t = j / 7; pts.push(new THREE.Vector3(top.x + 0.12 * Math.sin(t * 6 + wig), top.y + 0.3 - len * t, top.z + 0.12 * Math.cos(t * 5 + wig))); }
      tubeAlong(S, pts, (j) => r0 * (1 - 0.6 * (j / 7)) + 0.02, 5, 4, rootCol, (j) => 0.5 * (j / 7));
    }
    arch = { s: sA, center: new THREE.Vector3(c.x, yC, c.z), across: new THREE.Vector3(c.nx, 0, c.nz), along: new THREE.Vector3(c.tx, 0, c.tz), halfWidth: c.hw, crestPt, footPt, face: Math.atan2(-c.tx, -c.tz) };
  }
  for (let k = 0; k < 15; k++) {                            // off the underside of the bridge, never across the portal
    const central = k >= 10, lat = central ? rng.range(-6, 6) : (k % 2 ? 1 : -1) * rng.range(9.2, 16.5);
    const len = central ? rng.range(3.5, 8.5) : rng.range(11, 23), y0 = 27.5 + 2.2 * (1 - (lat / 18) ** 2) - 1.6, r0 = central ? 0.07 : rng.range(0.09, 0.16);
    const fwd = 1.5 + rng.range(-2.4, 2.4), pts = [], wig = rng.range(0, 6.28);
    for (let j = 0; j < 9; j++) { const t = j / 8; pts.push(new THREE.Vector3(px * lat + hx * fwd + 0.15 * Math.sin(t * 6 + wig), y0 - len * t, pz * lat + hz * fwd + 0.15 * Math.cos(t * 5 + wig))); }
    tubeAlong(S, pts, (j) => r0 * (1 - 0.65 * (j / 8)) + 0.02, 5, 4, rootCol, (j) => 0.85 * (j / 8));
  }
  await ctx.yield?.();
  const staticMesh = new THREE.Mesh(S.build(), rockMat); staticMesh.frustumCulled = false; root.add(staticMesh); parts.roots = staticMesh;
  triCount += S.tris;
  await ctx.yield?.();

  // ---- Pachypodium: silver bottle trunks studded with spined tubercles, stubby arms, white pinwheel flowers; on the blade crests.
  // Kind 1 carries (shade, around 0..1, metres along) in its colour for the tubercle lattice of the shader, kind 2 (along the petal, across).
  {
    const G = new Geo(), UPV = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), b1 = new THREE.Vector3(), b2 = new THREE.Vector3(), q = new THREE.Vector3();
    // a tube with a doubled seam so the "around" coordinate never wraps; returns the frame at its last ring
    const limb = (pts, rad, sides, sway, along0 = 0) => {
      const start = G.n; let along = along0;
      for (let i = 0; i < pts.length; i++) {
        if (i) along += pts[i].distanceTo(pts[i - 1]);
        d.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        b1.crossVectors(d, Math.abs(d.y) > 0.92 ? q.set(1, 0, 0) : UPV).normalize(); b2.crossVectors(d, b1).normalize();
        for (let k = 0; k <= sides; k++) {
          const a = (k / sides) * Math.PI * 2, r = rad(i) * (1 + 0.07 * Math.sin(k * 2.1 + i * 1.7) + 0.05 * Math.sin(k * 5.3 - i * 2.9));
          G.v(pts[i].x + (b1.x * Math.cos(a) + b2.x * Math.sin(a)) * r, pts[i].y + (b1.y * Math.cos(a) + b2.y * Math.sin(a)) * r, pts[i].z + (b1.z * Math.cos(a) + b2.z * Math.sin(a)) * r,
            0.86 + 0.14 * Math.sin(i * 1.3 + k), k / sides, along, sway(i), 1);
        }
      }
      const W = sides + 1;
      for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < sides; k++) { const a = start + i * W + k; G.quad(a, a + 1, a + 1 + W, a + W); }
    };
    // a dark spine pair: two thin blades standing off the bark
    const spine = (p, n, len, sway) => {
      b1.crossVectors(n, UPV).normalize(); b2.crossVectors(n, b1).normalize();
      for (const [e, w] of [[b1, 0.02], [b2, 0.02]]) {
        const a = G.v(p.x + e.x * w, p.y + e.y * w, p.z + e.z * w, 0.3, 0, 0, sway, 1), b = G.v(p.x - e.x * w, p.y - e.y * w, p.z - e.z * w, 0.3, 0, 0, sway, 1);
        const c = G.v(p.x + n.x * len, p.y + n.y * len + len * 0.25, p.z + n.z * len, 0.3, 0, 0, sway, 1);
        G.tri(a, b, c);
      }
    };
    const TR = [0.2, 0.3, 0.39, 0.43, 0.41, 0.33, 0.24, 0.17, 0.13], TY = [-0.3, 0.0, 0.3, 0.62, 0.95, 1.28, 1.58, 1.83, 2.02];
    const tp = TR.map((r, i) => new THREE.Vector3(0.06 * Math.sin(i * 0.9), TY[i], 0.05 * Math.cos(i * 1.1)));
    limb(tp, (i) => TR[i], 10, (i) => 0.1 * i * i / 64);
    for (let i = 1; i < 8; i++) for (let k = 0; k < 6; k++) {              // spines up the trunk in a spiral
      const a = k * 1.047 + i * 0.55, n = new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)).normalize(), y = TY[i] + 0.12 * Math.sin(k * 2.3);
      const rr = TR[i] * 0.98; spine(new THREE.Vector3(tp[i].x + Math.cos(a) * rr, y, tp[i].z + Math.sin(a) * rr), n, 0.1 + 0.03 * ((i + k) % 3), 0.1 * i * i / 64);
    }
    const petal = (fc, e1, e2, up, R, ang, f) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const ax = e1.x * ca + e2.x * sa, ay = e1.y * ca + e2.y * sa, az = e1.z * ca + e2.z * sa;       // along the petal
      const sx = -e1.x * sa + e2.x * ca, sy = -e1.y * sa + e2.y * ca, sz = -e1.z * sa + e2.z * ca;    // across it
      const P = (al, ac, lift) => { const l = lift + ac * 0.22 * al * R;                              // the pinwheel twist: one edge of each petal rides up over its neighbour
        return G.v(fc.x + ax * al * R + sx * ac * R + up.x * l, fc.y + ay * al * R + sy * ac * R + up.y * l, fc.z + az * al * R + sz * ac * R + up.z * l, al, ac * 1.2 + 0.5, f, 1, 2); };
      const c0 = P(0.04, 0, -0.01), l1 = P(0.5, -0.3, 0.07 * R), r1 = P(0.5, 0.3, 0.07 * R), l2 = P(0.86, -0.4, 0.05 * R), r2 = P(0.86, 0.4, 0.05 * R), t = P(1.06, 0.05, -0.1 * R);
      G.tri(c0, l1, r1); G.quad(l1, l2, r2, r1); G.tri(l2, t, r2);
    };
    for (let b = 0; b < 5; b++) {
      const a = b * 1.31 + 0.4, out = 0.26 + 0.1 * (b % 2), up = 0.42 + 0.2 * (b % 3);
      const p0 = new THREE.Vector3(tp[8].x * 0.5, 1.86, tp[8].z * 0.5), p3 = new THREE.Vector3(Math.cos(a) * out * 1.8, 1.9 + up, Math.sin(a) * out * 1.8);
      const p1 = p0.clone().lerp(p3, 0.34).add(new THREE.Vector3(Math.cos(a) * 0.12, -0.07, Math.sin(a) * 0.12)), p2 = p0.clone().lerp(p3, 0.7).add(new THREE.Vector3(Math.cos(a) * 0.06, 0.0, Math.sin(a) * 0.06));
      limb([p0, p1, p2, p3], (i) => [0.13, 0.115, 0.095, 0.07][i], 6, (i) => 0.3 + i * 0.23, 1.9);
      for (let k = 0; k < 3; k++) { const aa = a + k * 2.1, pm = p1.clone().lerp(p2, 0.3 + 0.3 * k); spine(pm, new THREE.Vector3(Math.cos(aa), 0.3, Math.sin(aa)).normalize(), 0.09, 0.6); }
      for (let f = 0; f < 2; f++) {                         // two five-petalled flowers per arm, tilted outward
        const fc = p3.clone().add(new THREE.Vector3(Math.cos(a + f * 2.2) * 0.08 * f, 0.07 + 0.05 * f, Math.sin(a + f * 2.2) * 0.08 * f)), R = 0.2 - 0.04 * f;
        const tilt = new THREE.Vector3(Math.cos(a + f) * 0.55, 1, Math.sin(a + f) * 0.55).normalize(), e1 = new THREE.Vector3().crossVectors(tilt, new THREE.Vector3(0.3, 0.1, 0.9)).normalize(), e2 = new THREE.Vector3().crossVectors(tilt, e1);
        for (let k = 0; k < 5; k++) petal(fc, e1, e2, tilt, R, (k / 5) * 6.2832 + f * 0.6, 0);
      }
    }
    const list = [];
    heroTips.forEach((t, i) => {
      const nPl = rng.chance(i < nLandTips ? 0.5 : 0.62) ? 1 : 0;
      for (let k = 0; k < nPl; k++) {
        const q = t.perch((rng.chance(0.5) ? 1 : -1) * rng.range(1.7, 4.2)), sc = rng.range(0.5, 1.25);
        list.push({ x: q.x, y: q.y - 0.1, z: q.z, yaw: rng.range(0, 6.28), sx: sc * rng.range(0.7, 0.95), sy: sc * rng.range(1, 1.25), sz: sc * rng.range(0.7, 0.95), seed: rng() });
      }
    });
    // one always stands on the third landing's blade, 3.5 m along its crest on the right of the line, and one beside the tip the right-hand escort lands on
    { const t3 = heroTips[CO], a = t3.perch(3.5), b = t3.perch(-3.5), rt = (q) => (q.x - t3.pos.x) * -dz + (q.z - t3.pos.z) * dx, q = rt(a) > rt(b) ? a : b;
      list.push({ x: q.x, y: q.y - 0.1, z: q.z, yaw: 1.1, sx: 1.25, sy: 1.6, sz: 1.25, seed: 0.37 });
      const q2 = heroTips[NL + 5].perch(2.4); list.push({ x: q2.x, y: q2.y - 0.1, z: q2.z, yaw: 4.0, sx: 1.05, sy: 1.3, sz: 1.05, seed: 0.71 }); }
    for (let k = 0; k < 5; k++) { const q = crestAt(6 + k * 7.5 + rng.range(-2, 2)); const sc = rng.range(0.6, 1.1); list.push({ x: q.x - dz * 0.55 * (k % 2 ? 1 : -1), y: q.y - 3.2 - rng.range(0, 1.5), z: q.z + dx * 0.55 * (k % 2 ? 1 : -1), yaw: rng.range(0, 6.28), sx: sc, sy: sc, sz: sc, seed: rng() }); }
    for (const lp of ledgePlants) list.push(lp);              // the ones on the ledges of the street's near faces
    if (list.length) { parts.plants = instMesh(G.build(), list); parts.plantList = list; triCount += G.tris * list.length; }
  }

  // ---- the troop. Every leap is a parabola between two fixed anchors; at rest the hips are a constant offset from the anchor
  // (SUP: back from it along the belly's direction, up from it), so hands and feet cannot slide. Times are in seconds of a
  // 40 s journey (T = 40 u): camera lands on tip k (1..6) at 4 + 1.667 k, tip 7 at 16.4, lip at 19.
  const TL = landings.map((L) => (19 * L.s) / UP_LEN);     // the lens flies the upper line at one speed and is on the lip at 19 s
  const tCam = (s) => {
    if (s <= landings[0].s) return (TL[0] * s) / landings[0].s;
    for (let k = 1; k < landings.length; k++) if (s <= landings[k].s) return lerp(TL[k - 1], TL[k], (s - landings[k - 1].s) / (landings[k].s - landings[k - 1].s));
    return 19 + (s - UP_LEN) / 12;
  };
  const troop = [];
  const mk = (script) => { const a = { ev: [], script, seed: rng.range(0.05, 1), period: 0, home: null, idx: 0 }; troop.push(a); return a; };
  const wrapPi = (a) => ((a + Math.PI * 3) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  // o.supA / o.supB: what it holds before and after ('tip' | 'root' | 'wall'); o.faceA / o.faceB: which way its belly is turned there (yaw). Without them
  // it launches backward off a tip (three-quarters on to whoever follows), turns in the air, lands belly-first and at once turns back round.
  const leap = (an, t, a, b, o = {}) => {
    let ddx = b.x - a.x, ddz = b.z - a.z; const dh = Math.hypot(ddx, ddz), d3 = a.distanceTo(b);
    if (dh < 1e-3) { ddx = 0; ddz = 1; } else { ddx /= dh; ddz /= dh; }
    const dur = o.dur ?? Math.min(1.5, Math.max(0.45, d3 / 12.5)), r01 = o.own ? sr : rng;     // (the animals of the street draw from a generator of their own, so the rest of the troop is as it was)
    const turn = o.turn ?? (r01() < 0.5 ? 1 : -1), yawOut = Math.atan2(-ddx, -ddz) + (o.hop ? 0 : turn * (0.35 + 0.45 * r01()));
    const yawA = o.faceA ?? yawOut, faced = o.faceA !== undefined || o.faceB !== undefined;
    const yawB = faced ? yawA + wrapPi((o.faceB ?? yawOut + Math.PI) - yawA) : yawA + Math.PI * turn;
    an.ev.push({ t, dur, a, b, bx: o.bx || 0, bz: o.bz || 0, lean: o.lean || 0, arc: o.arc ?? 0.3 + d3 * 0.095, hop: !!o.hop, yawA: o.hop ? o.yawHop : yawA, yawB: o.hop ? o.yawHop : yawB, supA: o.hop ? 'hop' : o.supA || 'tip', supB: o.hop ? 'hop' : o.supB || 'tip' });
    return t + dur;
  };
  // down the fissure, wall to wall. The camera dives from the lip (T = 19) to the canyon (T = 23.5); the flight time of each leap is worked
  // into its landing, so an animal leaves every hold `D0` metres ahead of the lens and none drops back beside it (the lead animal alone is
  // nearer). On a wall it clings belly to the stone, so from the lens it is seen flank-on; it kicks off backward and turns in the air.
  const DIVE = [[0, 0, 68], [0.2, 14, 55], [0.5, 34, 34], [0.8, 56, 16], [1, 74, 9], [1.27, 100, 5.6], [1.7, 140, 4.6]];   // share of the dive, metres along the fissure, height of the flight line
  const diveAt = (fr) => { for (let k = 1; k < DIVE.length; k++) if (fr <= DIVE[k][0] || k === DIVE.length - 1) { const a = DIVE[k - 1], b = DIVE[k], t = Math.max(0, Math.min(1, (fr - a[0]) / (b[0] - a[0]))); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; } return [0, 68]; };
  const ricochet2 = (an, t, from, side, D0, own = false) => {
    let prev = from, k = 0, face;
    for (let n = 0; n < 26; n++) {
      const hold = 0.2 + 0.06 * (n % 3), j1 = (lr() - 0.5) * 1.2, j2 = lr() * 3 - 1.6;
      let dur = 0.6, b = null, fr = 0, ii = 0;
      for (let it = 0; it < 3; it++) {
        const frCam = (Math.max(18.6, t) + dur + hold - 19) / 4.5;
        fr = Math.min(1.3, Math.max(0.05 + 0.012 * n, frCam + D0 / 96));
        const [sW, yPath] = diveAt(fr);
        ii = Math.max(0, Math.min(cl.length - 1, Math.round(sW / 1.5 + j1)));
        b = wallAt(ii, side, Math.max(4.5, yPath - 2.4 + j2), new THREE.Vector3(), 0.05);
        dur = Math.min(0.9, Math.max(0.42, prev.distanceTo(b) / 22));
      }
      const fb = Math.atan2(cl[ii].nx * side, cl[ii].nz * side);
      t = leap(an, t, prev, b, { dur, arc: 0.35 + prev.distanceTo(b) * 0.03, supA: k ? 'wall' : 'tip', faceA: k ? face : undefined, supB: 'wall', faceB: fb, own }) + hold;
      prev = b; side = -side; face = fb; k++;
      if (fr >= 1.3) break;
    }
  };
  const count = Math.max(18, Math.min(30, Math.round(opts.troop ?? 24)));
  // 1 the lead animal: sideways hops along the crest 8 m ahead, then one tip ahead of us all the way, then down the hanging roots
  {
    const lead = mk(true), yawHop = Math.atan2(dz, -dx);
    let prev = crestAt(9.5), t = 0.1;
    const nH = Math.max(3, Math.round((CE - 11) / 1.3)), hopT = (TL[0] - 0.55) / nH;
    // (it starts where its dance used to be after `H0` hops, 16 m along the crest, hopping on the spot there until then: in the opening frame it stands whole in
    // the lower middle of the picture and not at its foot; from path fraction 0.02 on nothing is changed)
    const H0 = Math.min(nH - 2, opts.leadHop ?? 5);
    { const p0 = crestAt(9.5 + ((CE - 11) / nH) * H0); for (let tt = 0.1; tt + 0.24 < 0.1 + hopT * H0; tt += 0.28) leap(lead, tt, p0, p0, { dur: 0.2, arc: 0.3, hop: true, yawHop, turn: 1 }); }
    for (let j = 1; j <= nH; j++) { const nx = crestAt(9.5 + ((CE - 11) / nH) * j); if (j > H0) leap(lead, t, prev, nx, { dur: Math.min(0.22, hopT * 0.8), arc: 0.24, hop: true, yawHop }); else rng(); t += hopT; prev = nx; }
    leap(lead, TL[0] - 0.3, prev, LP[1], { dur: 1.15 });
    for (let k = 1; k < NL - 1; k++) leap(lead, TL[k] - 0.5, LP[k], LP[k + 1], { dur: 1.1 });
    leap(lead, Math.min(TL[NL - 1] - 0.5, 15.9), LP[NL - 1], LP[NL], { dur: 1.0 });
    let from = LP[NL], sup = 'tip', face;
    leadDive.forEach((h, k) => {
      const dur = k === 0 ? Math.min(0.8, h.tArr - 18.1) : h.tArr - leadDive[k - 1].tLeave, d = from.distanceTo(h.pos);
      leap(lead, h.tArr - dur, from, h.pos, { dur, arc: 0.3 + d * 0.02, supA: sup, faceA: face, supB: 'root', faceB: h.face });
      from = h.pos; sup = 'root'; face = h.face;
    });
    if (leadPerch && leadDive.length) leap(lead, leadDive[leadDive.length - 1].tLeave, from, leadPerch.pos, { dur: 0.8, arc: 1.3, supA: 'root', faceA: face, supB: 'wall', faceB: leadPerch.face });
    lead.size = 1.3;
  }
  const nb = heroTips.slice(nLandTips).sort((a, b) => a.s - b.s); nb.forEach((t) => { t.used = false; });
  const nextTip = (from, sideSign) => {
    let best = null;
    for (const t of nb) { const ds = t.s - from.s; if (ds > 5 && ds < 24 && (sideSign === 0 || Math.sign(t.lat) === sideSign) && t.pos.distanceTo(from.pos) < 22 && (!best || ds < best.s - from.s)) best = t; }
    return best;
  };
  // 2 the third bound is flown in company: the companion 2.3 m to our left and 6 m ahead, feet-first as we reach the top of
  // the bound; one more out on the left and one on the right, each a beat behind the other
  {
    const Tm = (TL[CO] + TL[CO + 1]) / 2, plan = [[-0.95, 1.3, 1.75], [-0.8, 1.3, 1.6], [-0.6, 1.25, 1.5]];
    escortTips.forEach((pr, j) => {
      const c = mk(true); if (j === 0) c.size = 1.25; let t = leap(c, Tm + plan[j][0], pr[0], pr[1], { dur: plan[j][1], arc: plan[j][2] });
      let cur = { pos: pr[1], s: landings[CO + 1].s + ESC[j][0], lat: ESC[j][1] };
      for (let k = 0; k < 3; k++) { const n = nextTip(cur, Math.sign(ESC[j][1])) || nextTip(cur, 0); if (!n) break; t = leap(c, t + 0.75 + 0.2 * j, cur.pos, n.pos); cur = n; }
    });
  }
  // 3 the relay: animals on the tips beside the line that leap on ahead as we come up behind them
  const nRelay = Math.round(count * 0.4);
  for (const side of [-1, 1, -1]) for (const tip of nb) {
    if (troop.length >= 2 + nRelay) break;
    if (tip.used || Math.sign(tip.lat) !== side || tip.s < 16 || tip.s > 150) continue;
    tip.used = true;
    const a = mk(true); let cur = tip, t = Math.max(0.3, tCam(tip.s - rng.range(11, 17)));
    for (let k = 0; k < 4; k++) { const n = nextTip(cur, side) || nextTip(cur, 0); if (!n) break; t = leap(a, t, cur.pos, n.pos) + rng.range(0.7, 1.3); cur = n; }
    if (!a.ev.length) a.home = { p: tip.pos.clone(), yaw: rng.range(0, 6.28), sup: 'tip' };
    else if (cur.s > 150) { const t0 = Math.max(t, 15.2 + rng.range(0, 2)), ah = rng.range(0.16, 0.24); ricochet2(a, t0, cur.pos, side, ah * 80); }
  }
  // 4 the cascade: bodies dropping off the last tips into the fissure as we take the two falling bounds
  {
    const late = nb.filter((t) => t.s > 150 && !t.used);
    for (let j = 0; j < 4; j++) {
      const a = mk(true), tip = late[j % Math.max(1, late.length)], from = tip ? tip.perch(j < late.length ? 0 : 2.6) : LP[NL - 1].clone();
      const t0 = 14.7 + j * 0.55 + rng.range(0, 0.3);
      ricochet2(a, t0, from, j % 2 ? 1 : -1, 9.5 + 2.6 * j);
    }
  }
  // 5 the one that got there first: hugging the aerial root beside the ring, facing us over it, lit by the portal, tail hanging
  const waiting = waitRoot.clone();
  let waitIdx = -1;
  {
    const w = mk(true), bx = -hx * 0.6 - px * 0.75, bz = -hz * 0.6 - pz * 0.75;   // it clings on the stream side of the root, its belly to the root and half turned back up the canyon to us
    w.home = { p: new THREE.Vector3(waitRoot.x, waitRoot.y + 0.5, waitRoot.z), yaw: Math.atan2(bx, bz), sup: 'root' };
    w.size = 1.7; w.hang = 1; waitIdx = troop.length - 1;
  }
  // 6 everyone else: ambient leapers going back and forth between two crest points, on wall time
  {
    let guard = 0;
    while (troop.length < Math.min(count, 25) && guard++ < 200) {
      const t1 = rng.pick(nb); if (!t1) break;
      const others = nb.filter((t) => t !== t1 && t.pos.distanceTo(t1.pos) > 6.5 && t.pos.distanceTo(t1.pos) < 19);
      const A = t1.perch(rng.chance(0.5) ? -rng.range(2.2, 3.6) : rng.range(2.2, 3.6)), B = others.length ? rng.pick(others).perch(rng.range(-3.4, 3.4)) : t1.perch(0);
      if (A.distanceTo(B) < 3) continue;
      const a = mk(false); a.period = rng.range(5, 9.5);
      leap(a, 0.6, A, B); leap(a, 0.6 + a.period * 0.5, B, A);
    }
  }
  for (let j = 0; j < 4 && j < troop.length; j++) troop[(j * 5 + 3) % troop.length].infant = true;
  // 7 the street's own (on wall time): each clings flank-on to a near face, leaps to a second hold on the same side and back
  const streetIdx = { loop: [], drop: [] };
  const mkS = (script) => { const a = { ev: [], script, seed: 0.05 + 0.95 * sr(), period: 0, home: null, idx: 0 }; troop.push(a); return a; };
  streetPairs.forEach((pr) => {
    if (troop.length >= 33) return;
    const a = mkS(false); a.size = 1.2 + 0.1 * sr(); streetIdx.loop.push(troop.length - 1);
    if (!pr.B) { a.home = { p: pr.A.p.clone(), yaw: faceOf(pr.A), sup: 'wall' }; return; }
    a.period = 4.6 + 2.2 * sr();
    const d = pr.A.p.distanceTo(pr.B.p), o = { dur: Math.min(1.15, Math.max(0.7, d / 8.5)), arc: 0.9 + d * 0.06, supA: 'wall', supB: 'wall', own: true, bx: pr.bx, bz: pr.bz };
    leap(a, 0.5, pr.A.p, pr.B.p, { ...o, faceA: faceOf(pr.A), faceB: faceOf(pr.B) });
    leap(a, 0.5 + a.period * 0.5, pr.B.p, pr.A.p, { ...o, faceA: faceOf(pr.B), faceB: faceOf(pr.A) });
  });
  // 8 the three that drop toward the lip under the hawk (in the air as the lens passes path fraction 0.305), wait beside the lip and go on down into the fissure
  dropPlan.forEach((dp) => {
    const a = mkS(true); a.size = 1.3; streetIdx.drop.push(troop.length - 1);
    const dur = 1.25, d = dp.A.p.distanceTo(dp.B.p);
    let tl = leap(a, tCam(dp.sCam) - dur * (0.4 + 0.11 * dp.j), dp.A.p, dp.B.p, { dur, arc: 0.7 + d * 0.05, bx: dp.bx, bz: dp.bz, supA: 'wall', faceA: faceOf(dp.A), supB: 'wall', faceB: faceOf(dp.B), own: true }), last = dp.B;
    if (dp.C) {                                               // then across the street in front of the lens (in the air at path fraction 0.34), the last leap before the fissure
      flyCurve.getPointAt(0.34, tv); const s34 = lineInfo(tv.x, tv.z).s, d2 = dp.B.p.distanceTo(dp.C.h.p), du2 = Math.min(1.45, Math.max(0.9, d2 / 13));
      tl = leap(a, Math.max(tl + 0.25, tCam(s34) - du2 * (0.42 + 0.17 * dp.j)), dp.B.p, dp.C.h.p, { dur: du2, arc: 0.9 + d2 * 0.05, bx: dp.C.bx, bz: dp.C.bz, supA: 'wall', faceA: faceOf(dp.B), supB: 'wall', faceB: faceOf(dp.C.h), own: true }); last = dp.C.h; }
    ricochet2(a, Math.max(tl + 0.4, 17.9 + 0.4 * dp.j), last.p, Math.sign(last.lat) || 1, 11 + 3 * dp.j, true);
  });
  // 9 the ones that cross close in front of the lens (their own generator; placed last, on holds nobody else has). Each is in the middle of its
  // leap, legs first, a set distance down the line of sight as the lens passes a given path fraction: one across the gap on the first dropping
  // leap, one across the street before the lip, and the diver, which goes down the fissure wall to wall a few metres ahead of the lens
  const TUh = [[0, 0]]; arcLand.forEach((a, k) => TUh.push([a / flyLen, TL[k]])); TUh.push([timing.uBottom, 23.5], [timing.uOut, timing.tOut], [0.9, 36.2], [1, 40]);
  const tOfU = (u) => { for (let i = 1; i < TUh.length; i++) if (u <= TUh[i][0]) { const a = TUh[i - 1], b = TUh[i]; return a[1] + ((b[1] - a[1]) * (u - a[0])) / Math.max(1e-6, b[0] - a[0]); } return 40; };
  const GP = opts.gazePoi || { at: [0, 108, 0], from: 0, to: 0.3, weight: 0.55 }, AHEAD = opts.lookAhead ?? 26;
  const gazeAt = (u, P, D) => {                             // where the lens is and which way it looks (the engine's rule: at the line a little ahead, drawn toward the Cathedral)
    flyCurve.getPointAt(u, P); flyCurve.getPointAt(Math.min(1, u + AHEAD / flyLen), D); D.sub(P).normalize();
    const fw = (GP.to - GP.from) * 0.3, w = sstep(GP.from, GP.from + fw, u) * (1 - sstep(GP.to - fw, GP.to, u)) * GP.weight * sstep(0, 0.04, u);
    if (w > 0.001) { tv.set(GP.at[0], GP.at[1], GP.at[2]).sub(P).normalize(); D.multiplyScalar(1 - w).addScaledVector(tv, w).normalize(); }
  };
  const crossIdx = [], gP = new THREE.Vector3(), gD = new THREE.Vector3();
  const crossOnHolds = (uS, D, drop, tol) => {
    gazeAt(uS, gP, gD); const M = gP.clone().addScaledVector(gD, D); M.y -= drop;
    const sM = lineInfo(M.x, M.z).s, bw = { bx: 0, bz: 0 }; let best = null, bc = tol;
    for (const A of holds) {
      if (Math.abs(A.s - sM) > 9 || !freeOf(A, 2.4)) continue;
      for (const B of holds) {
        if (B.lat * A.lat > 0 || Math.abs(B.s - sM) > 9 || B.s < A.s - 1.5) continue;
        const d = A.p.distanceTo(B.p); if (d < 6.5 || d > 15.5) continue;
        const arc = 0.9 + d * 0.06, err = Math.hypot((A.p.x + B.p.x) / 2 - M.x, ((A.p.y + B.p.y) / 2 + arc - M.y) * 1.3, (A.p.z + B.p.z) / 2 - M.z);
        if (err < bc && freeOf(B, 2.4) && leapClear(A, B, bw)) { bc = err; best = { A, B, arc, d, err }; }
      }
    }
    if (!best) return null;
    usedHolds.push(best.A, best.B);
    const a = mkS(true), dur = Math.min(1.3, Math.max(0.85, best.d / 10.5)); a.size = 1.3; crossIdx.push(troop.length - 1);
    const tl = leap(a, tOfU(uS) - dur * 0.5, best.A.p, best.B.p, { dur, arc: best.arc, supA: 'wall', faceA: faceOf(best.A), supB: 'wall', faceB: faceOf(best.B), own: true });
    return { a, tl, B: best.B, err: best.err };
  };
  // where no pair of holds will do, the flanks themselves are found: out from a point on the line of sight to the first stone on either hand
  const flankHit = (bx, bz, y, side) => {
    const ex = -dz * side, ez = dx * side;
    if (insideBlade(bx + ex * 1.2, y, bz + ez * 1.2, 0.1)) return -1;
    for (let t = 1.45; t <= 11; t += 0.25) if (insideBlade(bx + ex * t, y, bz + ez * t, 0)) { let a = t - 0.25, b = t; for (let k = 0; k < 5; k++) { const m = (a + b) / 2; if (insideBlade(bx + ex * m, y, bz + ez * m, 0)) b = m; else a = m; } return a; }
    return -1;
  };
  const flankAt = (bx, bz, y, side) => {
    const t = flankHit(bx, bz, y, side); if (t < 0) return null;
    const ex = -dz * side, ez = dx * side, t1 = flankHit(bx + dx * 0.5, bz + dz * 0.5, y, side), t2 = flankHit(bx - dx * 0.5, bz - dz * 0.5, y, side);
    const n = new THREE.Vector3(-ex, 0, -ez);
    if (t1 > 0 && t2 > 0 && Math.abs(t1 - t2) < 1.2) { const tx = dx + ex * (t1 - t2), tz = dz + ez * (t1 - t2), l = Math.hypot(tx, tz); n.set(-tz / l, 0, tx / l); if (n.x * ex + n.z * ez > 0) n.negate(); }
    const p = new THREE.Vector3(bx + ex * (t - 0.05), y, bz + ez * (t - 0.05)), li = lineInfo(p.x, p.z);
    return { p, n, s: li.s, lat: li.lat, vis: 1, dh: 1, off: t };
  };
  const crossOnFlanks = (uS, D, drop) => {
    gazeAt(uS, gP, gD); const M = gP.clone().addScaledVector(gD, D); M.y -= drop;
    const bw = { bx: 0, bz: 0 }, s0 = sr() < 0.5 ? 1 : -1;
    for (const [da, db] of [[-1.5, 2.5], [-3, 1], [0, 4], [-0.5, 1.5], [-4, 3]]) for (const sA of [s0, -s0]) for (const dy of [0, -0.8, 0.8]) {
      const A = flankAt(M.x + dx * da, M.z + dz * da, M.y - 1.2 + dy, sA), B = A && flankAt(M.x + dx * db, M.z + dz * db, M.y - 2.0 + dy, -sA);
      if (!A || !B || !freeOf(A, 2.2) || !freeOf(B, 2.2)) continue;
      const d = A.p.distanceTo(B.p); if (d < 5.5 || d > 16 || !leapClear(A, B, bw)) continue;
      const arc = 0.9 + d * 0.06, fS = Math.min(0.62, Math.max(0.38, A.off / (A.off + B.off)));    // it is on the line of sight at this fraction of its leap
      usedHolds.push(A, B);
      const a = mkS(true), dur = Math.min(1.3, Math.max(0.85, d / 10.5)); a.size = 1.3; crossIdx.push(troop.length - 1);
      const tl = leap(a, tOfU(uS) - dur * fS, A.p, B.p, { dur, arc, supA: 'wall', faceA: faceOf(A), supB: 'wall', faceB: faceOf(B), own: true });
      return { a, tl, B, err: 0 };
    }
    return null;
  };
  const crossAt = (uS, D, drop) => (troop.length < 37 ? crossOnHolds(uS, D, drop, 1.6) || crossOnFlanks(uS, D, drop) : null);
  crossAt(opts.crossU?.[0] ?? 0.08, 7.0, 0.3);
  await ctx.yield?.();
  { const c = crossAt(opts.crossU?.[1] ?? 0.34, 6.8, 0.2); if (c && c.B.s > 150) ricochet2(c.a, Math.max(c.tl + 0.5, 18.6), c.B.p, Math.sign(c.B.lat) || 1, 15, true); }
  await ctx.yield?.();
  // the diver: mid-leap 6.8 m down the line of sight at path fractions 0.405, 0.43, 0.455, 0.48 and 0.505, lying back across the slot, feet to the wall it is going to
  {
    const US = opts.diveU || [0.405, 0.43, 0.455, 0.48, 0.505], DD = 6.8, DUR = 0.5, ARC = 0.45, Ms = US.map((u) => { gazeAt(u, gP, gD); return gP.clone().addScaledVector(gD, DD); });
    const K = Ms.length, Ps = [], side0 = sr() < 0.5 ? 1 : -1;
    for (let k = 0; k <= K; k++) {
      const q = k === 0 ? Ms[0].clone().multiplyScalar(1.5).addScaledVector(Ms[1], -0.5) : k === K ? Ms[K - 1].clone().multiplyScalar(1.5).addScaledVector(Ms[K - 2], -0.5) : Ms[k - 1].clone().add(Ms[k]).multiplyScalar(0.5);
      const side = k % 2 ? -side0 : side0, i = clIndexNear(q.x, q.z), y = Math.max(4.5, q.y - ARC), top = wallRec[side > 0 ? 1 : 0][i * WV.length * 2 + (WV.length - 2) * 2];
      Ps.push({ p: wallAt(i, side, Math.min(y, top - 1.2), new THREE.Vector3(), 0.05), face: Math.atan2(cl[i].nx * side, cl[i].nz * side) });
    }
    const a = mkS(true); a.size = 1.3; crossIdx.push(troop.length - 1);
    for (let k = 0; k < K; k++) leap(a, tOfU(US[k]) - DUR * 0.5, Ps[k].p, Ps[k + 1].p, { dur: DUR, arc: ARC, lean: 0.7, supA: 'wall', faceA: Ps[k].face, supB: 'wall', faceB: Ps[k + 1].face, own: true });
  }
  // 10 the ones on the fallen blade (added last, so every other animal is as it was): five sit along its crest over the stream, three with their backs to us and
  // their tails hanging free in front of its underside, all turning their heads to watch whoever comes down the canyon; one more leaps back and forth along it
  const archIdx = [];
  if (arch) {
    for (const [x, dyaw, size] of [[-7.0, 0.8, 1.4], [-4.9, Math.PI - 0.55, 1.5], [3.3, Math.PI + 0.7, 1.55], [5.3, -0.7, 1.4], [7.4, Math.PI - 0.3, 1.35]]) {
      const a = mkS(true); a.home = { p: arch.crestPt(x), yaw: arch.face + dyaw, sup: 'tip' }; a.size = size; a.hang = 1; archIdx.push(troop.length - 1);
    }
    for (const [x0, x1, per] of [[-2.9, 1.3, 5.4]]) {
      const a = mkS(false), A = arch.crestPt(x0), B = arch.crestPt(x1); a.size = 1.35; a.period = per; archIdx.push(troop.length - 1);
      leap(a, 0.5, A, B, { own: true, dur: 0.62, arc: 1.0 }); leap(a, 0.5 + per * 0.5, B, A, { own: true, dur: 0.62, arc: 1.0 });
    }
  }
  troop.forEach((an) => { an.asym = (((an.seed * 7919) % 1) - 0.5) * 0.3; });
  await ctx.yield?.();

  // ---- sifaka mesh: one instanced draw; the pose of every animal (sixteen angles) is worked out here each frame and laid on the bones in the vertex shader
  const N = troop.length;
  const sGeo = new THREE.InstancedBufferGeometry();
  { const b = sifakaGeometry(); for (const k of Object.keys(b.attributes)) sGeo.setAttribute(k, b.attributes[k]); sGeo.setIndex(b.index); triCount += (b.index.count / 3) * N; }
  sGeo.instanceCount = N;
  const posYaw = new Float32Array(N * 4), pA = [0, 1, 2, 3].map(() => new Float32Array(N * 4));
  const dyn = (arr, name) => { const at = new THREE.InstancedBufferAttribute(arr, 4); at.setUsage(THREE.DynamicDrawUsage); sGeo.setAttribute(name, at); return at; };
  const aPosYaw = dyn(posYaw, 'aPosYaw'), aPs = pA.map((arr, k) => dyn(arr, 'aP' + (k + 1)));
  { const ex = new Float32Array(N * 2); troop.forEach((an, i) => { ex[i * 2] = an.size || 1; ex[i * 2 + 1] = an.infant ? -an.seed : an.seed; }); sGeo.setAttribute('aEx', new THREE.InstancedBufferAttribute(ex, 2)); }
  const sifMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SIFAKA_VERT, fragmentShader: SIFAKA_FRAG, fog: true, side: THREE.DoubleSide });
  const sifakas = new THREE.Mesh(sGeo, sifMat); sifakas.frustumCulled = false; root.add(sifakas); parts.sifakas = sifakas;

  const st = { x: 0, y: 0, z: 0, yaw: 0, crouch: 0, air: 0, pose: new Float32Array(16) };
  const P0 = { x: 0, y: 0, z: 0, yaw: 0, sup: 'tip' }, P1 = { x: 0, y: 0, z: 0, yaw: 0, sup: 'tip' };
  const seat = (a, yaw, sup, size, o) => { const s = SUP[sup]; o.x = a.x - Math.sin(yaw) * s.back * size; o.y = a.y + s.up * size; o.z = a.z - Math.cos(yaw) * s.back * size; o.yaw = yaw; o.sup = sup; return o; };
  const poseAt = (e, end, o, size) => (end ? seat(e.b, e.yawB, e.supB, size, o) : seat(e.a, e.yawA, e.supA, size, o));   // hips clinging before (end = 0) or after (1) leap e
  const evaluate = (an, T, time) => {
    const size = (an.size || 1) * U.uSize.value, pz = st.pose;
    st.crouch = 0; st.air = 0;
    let supA = 'tip', supB = null, kb = 0;
    if (!an.ev.length) { seat(an.home.p, an.home.yaw, an.home.sup, size, P0); st.x = P0.x; st.y = P0.y; st.z = P0.z; st.yaw = P0.yaw; supA = an.home.sup; }
    else {
      const ev = an.ev; let i = -1;
      for (let k = 0; k < ev.length; k++) { if (ev[k].t <= T) i = k; else break; }
      if (i < 0) { poseAt(ev[0], 0, P0, size); st.x = P0.x; st.y = P0.y; st.z = P0.z; st.yaw = P0.yaw; st.crouch = sstep(ev[0].t - 0.2, ev[0].t, T); supA = ev[0].supA; }
      else {
        const e = ev[i], tl = T - e.t;
        if (tl < e.dur) {
          const f = tl / e.dur; poseAt(e, 0, P0, size); poseAt(e, 1, P1, size);
          st.x = lerp(P0.x, P1.x, f) + e.bx * 4 * f * (1 - f); st.z = lerp(P0.z, P1.z, f) + e.bz * 4 * f * (1 - f); st.y = lerp(P0.y, P1.y, f) + e.arc * 4 * f * (1 - f);
          st.yaw = lerp(P0.yaw, P1.yaw, sstep(0.12, 0.62, f));
          flightPose(pz, f, e.supA, e.supB, e.hop); if (e.lean) pz[8] += e.lean * sstep(0.1, 0.35, f) * (1 - sstep(0.7, 0.95, f)); st.air = sstep(0, 0.15, f) * (1 - sstep(0.8, 1, f)) * (e.hop ? 0.4 : 1); supA = null;
        } else {
          poseAt(e, 1, P0, size);
          const nx = ev[i + 1], since = tl - e.dur;
          st.crouch = 1 - sstep(0, 0.28, since); supA = e.supB;
          if (nx) {
            poseAt(nx, 0, P1, size);
            const early = e.supB === 'tip' && nx.supA === 'tip';   // on a tip it turns round as soon as it has landed, so whoever follows sees its face and not its back
            const ts = early ? e.t + e.dur + 0.1 : Math.max(e.t + e.dur, nx.t - 0.55), te = early ? Math.min(ts + 0.42, Math.max(ts + 0.02, nx.t - 0.2)) : Math.max(ts + 0.02, nx.t - 0.2), k = sstep(ts, te, T);
            st.x = lerp(P0.x, P1.x, k); st.z = lerp(P0.z, P1.z, k); st.y = lerp(P0.y, P1.y, k) + (e.hop ? 0 : 0.1 * 4 * k * (1 - k));
            st.yaw = P0.yaw + wrapPi(P1.yaw - P0.yaw) * k; st.crouch = Math.max(st.crouch, sstep(nx.t - 0.2, nx.t, T));
            supB = nx.supA; kb = k;
          } else { st.x = P0.x; st.y = P0.y; st.z = P0.z; st.yaw = P0.yaw; }
        }
      }
    }
    if (supA) { const A = SUP[supA].pose, B = supB ? SUP[supB].pose : A; for (let k = 0; k < 16; k++) pz[k] = A[k] + (B[k] - A[k]) * kb; }
    // what makes it alive: the crouch before and after a leap, breath, the tail streaming and whipping in the air and swaying at rest
    const c = st.crouch, rest = 1 - st.air, sd = an.seed;
    pz[0] += 0.1 * c; pz[1] -= 0.14 * c; pz[4] += 0.12 * c + rest * 0.04 * Math.sin(time * 1.3 + sd * 40); pz[8] += 0.09 * c * rest;
    pz[12] += st.air * 0.2 * Math.sin(time * 9 + sd * 9) + rest * 0.07 * Math.sin(time * 1.3 + sd * 40);
    pz[13] += st.air * 0.6 * Math.sin(time * 7 + sd * 5) + rest * 0.25 * Math.sin(time * 0.9 + sd * 20);
    pz[14] = st.air * 0.2 * Math.sin(time * 8 + sd * 3) + rest * 0.07 * Math.sin(time * 1.1 + sd * 13);
    if (an.hang) { pz[12] = 0.2 * Math.sin(time * 1.6 + sd * 9) - 0.1; pz[13] = 0.55 + 0.35 * Math.sin(time * 1.6 + sd * 9 - 1.0); pz[14] = 0.1 * Math.sin(time * 0.9 + sd * 5); }
    pz[15] = rest * an.asym;
    return size;
  };

  // ---- anchors (hero-local)
  const anchors = {
    portalSeat: { position: V(0, 4.5, 0), facing: V(-hx, 0, -hz), radius: 7 },
    heading: V(hx, 0, hz),
    entry: { position: entry.clone(), direction: V(dx, 0, dz) },
    crest: [crestAt(0), crestAt(CE)],
    landings: LP.map((p) => p.clone()),
    companionTips: companions.map((p) => p.clone()),
    flyThrough: fly,
    timing,                                                 // path fractions of the landings, the lip and the bottom of the dive, and how long the lens keeps its diving speed (uOut at tOut seconds)
    lip: lip.clone(),
    fissure: [clAt(3, 68), clAt(74, 9)],
    canyon: cl.filter((c, i) => i % 8 === 0).map((c) => ({ x: c.x, z: c.z, halfWidth: c.hw })),
    towerTops, towers: towers.map((t) => V(t.x, t.h, t.z)), spires: spires.map((t) => V(t.x, t.h, t.z)),
    bridge: { center: V(hx * 1.5, 28, hz * 1.5), underside: 25.3, span: V(px, 0, pz) },
    waitingSifaka: waiting.clone(), waitingIndex: waitIdx,
    arch: arch ? { s: arch.s, center: arch.center.clone(), across: arch.across.clone(), along: arch.along.clone(), halfWidth: arch.halfWidth, crest: [-8, -6, -4, -2, 0, 2, 4, 6, 8].map((x) => arch.crestPt(x)), foot: [-8, -6, -4, -2, 0, 2, 4, 6, 8].map((x) => arch.footPt(x)), animals: archIdx } : null,   // the fallen blade across the canyon
    shear: shearSpot,                                       // rare visits: where the blade that shears stands ({ x, z, yaw (its length across the street), yCut, s, lat }), else null
    streetAnimals: streetIdx, crossers: crossIdx,                               // indices of the animals that live on the near faces of the street (time-looped) and of the three that drop under the hawk
    escortTips: escortTips.map((pr) => pr.map((p) => p.clone())),
    cave: (() => { const i = Math.round(sCave / 1.5), c = cl[i], o = c.hw + 2.3 + CAVE_D * 0.5; return { s: sCave, position: V(c.x + c.nx * o, 7.2, c.z + c.nz * o), normal: V(-c.tx, 0, -c.tz), right: V(c.nx, 0, c.nz), width: CAVE_D * 0.62, height: 5.2 }; })(),
    sunDir: sun.clone(),
    viewpoints: [entry.clone(), LP[2].clone().add(V(0, 16, 0)), clAt(40, 30), clAt(sPortal - 60, 4.5)],
  };

  let progress = -1;
  const camL = new THREE.Vector3(), nearD = new Float32Array(5), nearI = new Int32Array(5);
  const hero = {
    object: root,
    radius: 78, height: 104, center: V(0, 66, 0), fieldExtent: { center: V(xc * 0.4, 0, 120), radiusX: 400, radiusZ: 525 },
    anchors, uniforms: U, troopCount: N, triangles: Math.round(triCount),
    roles: { lead: 0, escorts: [1, 2, 3], waiting: waitIdx },
    // for the world: the meshes by role (to hide what cannot be seen), the mid fins (to wedge trees in the slots), the stone
    // material and the fin generator (extra blades in the same stone), the landing times of the troop script
    parts, midFins: midList, rockMaterial: rockMat, landingTimes: TL.slice(), wallPoint, wallAt, wallOff, notch, centreline: cl, top: TOP,
    makeFin(o, xf) { const g = new Geo(); const r = finGeo(g, o, rng, xf); return { geometry: g.build(), peak: r.peak, triangles: g.tris }; },
    hidePlant(i) { const m = parts.plants; if (!m) return; mtx.makeScale(0, 0, 0); m.setMatrixAt(i, mtx); m.instanceMatrix.needsUpdate = true; },
    ground: true, groundY: -2.5,
    setProgress(u) { progress = Math.max(0, Math.min(1, u)); },
    setShadow(i, pos, radius = 1) { if (i >= 0 && i < 3) shadows[i].set(pos.x, pos.y, pos.z, radius); },
    sifakaPosition(i, out = new THREE.Vector3()) { return out.set(posYaw[i * 4], posYaw[i * 4 + 1], posYaw[i * 4 + 2]); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) { root.updateWorldMatrix(true, false); camL.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(camL); U.uCam.value.copy(camL); }
      const Ts = progress >= 0 ? progress * 40 : time % 26;
      nearD.fill(1e9); nearI.fill(-1);
      for (let i = 0; i < N; i++) {
        const an = troop[i], size = evaluate(an, an.script ? Ts : (time + an.seed * 7) % an.period, time), pz = st.pose;
        posYaw[i * 4] = st.x; posYaw[i * 4 + 1] = st.y; posYaw[i * 4 + 2] = st.z; posYaw[i * 4 + 3] = st.yaw;
        const ex = camL.x - st.x, ey = camL.y - (st.y + 0.45 * size), ez = camL.z - st.z, d = ex * ex + (camL.y - st.y) ** 2 + ez * ez;
        // the head: at rest it turns to watch the lens when that is near (as far as a neck goes), otherwise it looks about; in the air it looks where it is going
        const rest = 1 - st.air, cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), lx = ex * cy - ez * sy, lz = ex * sy + ez * cy;
        const look = rest * (1 - sstep(900, 3000, d)), sd = an.seed;
        const idleYaw = 0.7 * Math.sin(time * 0.7 + sd * 50) * sstep(0.3, 0.9, Math.sin(time * 0.23 + sd * 31) * 0.5 + 0.5);
        pz[10] = lerp(idleYaw * rest, Math.max(-1.5, Math.min(1.5, Math.atan2(lx, lz))), look);
        pz[11] += look * (Math.max(-0.5, Math.min(0.7, Math.atan2(ey, Math.hypot(ex, ez) + 1e-3))) - pz[8]);
        for (let k = 0; k < 4; k++) { const a = pA[k]; a[i * 4] = pz[k * 4]; a[i * 4 + 1] = pz[k * 4 + 1]; a[i * 4 + 2] = pz[k * 4 + 2]; a[i * 4 + 3] = pz[k * 4 + 3]; }
        if (d < 4900 && d < nearD[4]) { let k = 4; while (k > 0 && nearD[k - 1] > d) { nearD[k] = nearD[k - 1]; nearI[k] = nearI[k - 1]; k--; } nearD[k] = d; nearI[k] = i; }
      }
      aPosYaw.needsUpdate = true; for (const a of aPs) a.needsUpdate = true;
      for (let k = 0; k < 5; k++) {                          // soft shadows of the five nearest animals (slots 3..7)
        const n = nearI[k], s = shadows[3 + k];
        if (n >= 0) s.set(posYaw[n * 4], posYaw[n * 4 + 1] + 0.2, posYaw[n * 4 + 2], 0.42); else s.set(0, 0, 0, 0);
      }
    },
    dispose() {},
    _lab: { tOfU, gazeAt, troop, evaluate: (i, T, time) => { const size = evaluate(troop[i], T, time); return { ...st, pose: Array.from(st.pose), size }; }, leadDive, leadPerch, T55, lensArc, flyCurve, flyLen, pA, posYaw, sGeo, holds, usedHolds, ledgePlants, streetPairs, dropPlan, insideBlade, tCam, lineInfo },
  };
  hero.counts = { heroBlades: heroVar.map((h) => h.list.length), mid: midList.length, far: farList.length, staticTris: S.tris };
  hero.buildMs = 0 - t0;
  hero.update(0, 0, null);
  return hero;
}
