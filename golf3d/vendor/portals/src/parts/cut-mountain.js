// THE CUT MOUNTAIN: hero set piece for the world "cut-mountain".
//
// A hand-coloured copperplate of an equatorial stratovolcano cut in half like a diagram. The west half
// is a living mountain in engraved bands (wax palms, cloud forest, paramo, ash, snow); the east half is
// gone and its place is a cream page ruled like a ledger: a soil band with roots under the fringe, beds of
// ash, lava, scoria and columnar rock, dykes, altitude rules, pen script, the conduit with its vermilion
// thread, three waterfalls running down the paper as bundles of engraved lines, and seven ruled boxes
// (orchid, hummingbird, butterfly, tapir, beetle, cinchona, cock-of-the-rock) whose specimens take their
// wash, lift off the paper and leave their outlines behind. The tapir walks a ledge ruled out of its box.
// Round 3: the face is a coloured section. The cone's beds carry bold flat tints over an unconformity; below it lies an
// older folded country (limestone courses with ammonites, sandstone, shale, red marl, coal) on granite. Two dark caves
// (stalactites, a pool, oilbirds circling in the mouth), four burrows (armadillos, snakes), two ground-sloth skeletons,
// a side conduit of moving lava with its glow, and four more plates (frog, toucan, fern, quetzal) lower on the face.
// anchors.boxes lists all eleven plates; `layout` gives the caves, residents, falls and the vent.
//
// LOCAL SPACE  origin = volcano axis at ground level, +Y up. NORTH is -Z, EAST is +X.
//   The cut plane is x = 0. Living half: x < 0. The page faces +X and spans z -860..860.
//   The "front" (+Z) is the south side, where the journey enters; the seam climbs from (0,0,860) to the
//   crater lip. Do not rotate the object unless you also rotate opts.sun (the hatching is lit in local space).
// SIZE  radius 860 m (ground apron to 1250 m), crater lip about 444 m, snow horns to about 462 m.
// COST  about 190k triangles, 14 draw calls, no lights, no textures. Build about 250 ms.
// LIGHT It is an unlit print: every material is the 'plate' ShaderMaterial family below and reads no
//   scene lights. Tone is hatching chosen from one fixed sun (opts.sun, default south-east, 38 degrees up).
//   Wants bloom off (or threshold above 1), no fog (scene fog is honoured, scaled by opts.fog, default 0.12),
//   a cream or ruled paper sky. Paper is written at about 0.8 linear.
//
// OPTS
//   palette   [paper, ink, half-tone, sap green, verditer, gamboge, vermilion] hex strings (brief default)
//   ink       'sepia' (default) | 'sanguine' (afternoon, buff paper, sun south-west) | 'blueblack' (first light)
//   sun       [x,y,z] local direction TO the sun; default from `ink`
//   wash      [near, far] metres: colour is complete inside `near` and gone beyond `far` (default [45,150])
//   fog       0..1 share of scene fog to apply (default 0.12; the style states depth by losing colour)
//   bloom     'puya' | 'frailejon' | null: which paramo plant flowers (seeded if absent)
//   rare      true: the volcano wakes (conduit wash runs to the top, plume thickens) (seeded 1 in 9 if absent)
//   snowDrop  metres the snowline comes down (fresh snow among the frailejones); pageTone 0..1 half-tone on the page
//
// ROUND 4   the fly-through enters from the south-east at (128, 26, 950), facing the section; hero.toLegacy(u) and
//   hero.fromLegacy(uL) convert between u on that line and u on the older, shorter one (every u quoted below is the
//   older one; hero.legacyLength is its length). A lava stream runs from a breach in the lip down the living flank
//   (uFlow on the ground material; hero.flowAt(x, z) gives metres outside its edge, so plants keep off it).
// PROGRESS  hero.setProgress(u) with the journey u (0..1). It stages the seven specimens against the camera
//   line (orchid 0.335, hummingbird 0.37, butterfly 0.40, tapir 0.43, beetle 0.485, and on the upper page, seen
//   from out over the drop, cinchona 0.575 and cock-of-the-rock 0.615; each box sits a few metres ahead of anchors.boxes[i].u) and raises
//   the conduit wash. UNTIL setProgress IS CALLED the piece runs a demonstration loop on its own clock so the
//   viewer shows it alive: call setProgress every frame in the world. hero.setSpecimen(i, p) drives one
//   directly (p 0 outline only, 0.3 fully washed, 0.3..1 lifting off and leaving, 1 gone or settled).
//   hero.setShadows(a, b): two Vector3 (local) whose shadows are hatched on the page (the condors).
//
// ANCHORS (local space)
//   portalSeat   { position, facing, tilt }: centre of the 14 m ring in the crater-lip notch; facing is the
//                unit normal pointing back down the approach (the ring is tilted 22 degrees), tilt in radians.
//   flyThrough   ordered Vector3 list: palm aisle, west over the living flank, out over the cut edge, north
//                along the page 17 m off it, up the knife ridge, last 60 m straight at 22 degrees into the
//                notch. At least 8 m above the hero's ground and plants were kept 9 m off this line.
//   seamFoot     where the south slope meets the page at ground level.
//   boxes        [{ name, position, size, u }]: centres of the seven specimen boxes on the page.
//   falls        [{ top, foot }]: the three waterfalls on the page (top is on the fringed edge).
//   crater       centre of the crater floor; plumeTop: where the ash plume ends.
//   passionflowers  where the hummingbird goes (on the cut edge).
//   viewpoints   { aisle, page, ridge, notch }: camera positions that compose the piece.
//   Also returned: heightAt(x, z) of the living ground (0 on the paper plain) and zones (metres); groundAt (raw
//   height function), samples (301 spaced points of the camera line), materials { ground, plant }, sites, S (inks).
//   Specimen boxes sit level with the camera line at u 0.335, 0.372, 0.425, 0.485; each wakes over u - 0.06 .. u + 0.04.
//
// STYLE (for the world coder to match)  see PLATE_FRAG: hatch(coord, fwidth(coord), basePeriod, maxPeriod, tone)
//   picks a line period per pixel in octaves of fwidth and fades odd lines in or out between octaves, so
//   lines stay 1-3 px wide and 7-14 px apart and are fixed to the surface. Tone picks up to three layers:
//   contour (>0.15), fall-line or second coordinate (>0.45), diagonal cross-hatch (>0.72). Colour is
//   paper * mix(1, wash, a) with a = seep(camera distance, distance to nearest line), ink goes over it and
//   turns to the half-tone ink beyond 150 m. Import PLATE_COMMON and plateUniforms from this file to reuse.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const R = 860, LIP = 444, R0 = 44, KP = 0.95, APRON = 1250;
const NOTCH_X = -14, PITCH = (22 * Math.PI) / 180;
const DEF_PALETTE = ['#F1E7CF', '#3A2A1D', '#8C6B4A', '#6F8A3C', '#5F8F8E', '#D8A531', '#C6452B'];

// ---------------------------------------------------------------- shared GLSL
export const PLATE_COMMON = /* glsl */ `
uniform vec3 uPaper, uInk, uHalf, uSun, uShade;
uniform vec2 uWash;
uniform float uTime, uFog, uResY;
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
// Stable engraved lines on coordinate c. fw = fwidth(c) taken by the caller. Returns (ink, distance to
// the nearest line as 0..1 of half a period).
vec2 hatchL(float c, float fw, float base, float maxP, float tone, float lmin){
  fw = max(fw, 1e-6);
  float l = max(log2(max(6.0*fw/base, 1e-4)), lmin);
  float lo = floor(l), f = l - lo;
  float P = base*exp2(lo);
  float t = c/P;
  float k = floor(t+0.5);
  float dn = abs(t-k);
  float dpx = dn*P/fw;
  float w = mix(1.0, 1.0-f, step(0.5, mod(k, 2.0)));
  float hw = (0.3 + 0.85*tone)*w;
  float ink = (1.0 - smoothstep(hw-0.55, hw+0.55, dpx))*smoothstep(0.0, 0.25, w);
  float farK = smoothstep(maxP*0.5, maxP, P);
  return vec2(mix(ink, tone*0.5, farK), min(dn*2.0, 1.0));
}
vec2 hatch(float c, float fw, float base, float maxP, float tone){ return hatchL(c, fw, base, maxP, tone, -12.); }
// antialiased line of half-width hw px on coordinate c at c = 0
float lineAA(float c, float fw, float hw){ return 1.0 - smoothstep(hw-0.5, hw+0.5, abs(c)/max(fw,1e-6)); }
float seep(float dist, float lineD){
  float s = 1.0 - smoothstep(uWash.x, uWash.y, dist);
  return smoothstep(lineD*0.8, lineD*0.8+0.2, s*1.05);
}
vec3 plate(vec3 wash, float washA, float ink, float dist){
  vec3 inkc = mix(uInk, uHalf, smoothstep(150., 700., dist));
  vec3 c = uPaper*mix(vec3(1.), wash, clamp(washA,0.,1.));
  return mix(c, inkc, clamp(ink,0.,1.));
}
`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';
// fragment tail: writes gl_FragColor from vec3 col and applies the scaled scene fog
const FRAG_END = /* glsl */ `
  gl_FragColor = vec4(col, 1.0);
  vec3 preFog = gl_FragColor.rgb;
  #include <fog_fragment>
  gl_FragColor.rgb = mix(preFog, gl_FragColor.rgb, uFog);
`;

const lin = (hex) => new THREE.Color(hex);
const thin = (c, k) => new THREE.Color(1, 1, 1).lerp(c, k);

function inkSetup(opts, rng) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map(lin);
  let paper = pal[0].clone(), ink = pal[1].clone(), half = pal[2].clone();
  let sun = [0.56, 0.62, 0.55];
  if (opts.ink === 'sanguine') { paper = lin('#EBD9B4'); ink = lin('#7A2E1E'); half = lin('#B0705A'); sun = [-0.56, 0.5, 0.66]; }
  else if (opts.ink === 'blueblack') { paper = lin('#E9E6D8'); ink = lin('#1C2634'); half = lin('#66758A'); sun = [0.78, 0.3, 0.55]; }
  if (opts.sun) sun = opts.sun;
  const k = 0.82 / Math.max(paper.r, paper.g, paper.b);       // paper sits near 0.8, never clips
  paper.multiplyScalar(Math.min(1, k));
  return { pal, paper, ink, half, sun: new THREE.Vector3(sun[0], sun[1], sun[2]).normalize(),
    green: thin(pal[3], 0.78), verd: thin(pal[4], 0.6), gamb: thin(pal[5], 0.8), verm: thin(pal[6], 0.92),
    olive: thin(pal[3].clone().lerp(pal[5], 0.45), 0.7), ash: thin(pal[2], 0.35), rngTint: rng.range(-0.04, 0.04) };
}

export function plateUniforms(S, opts = {}) {
  const w = opts.wash || [45, 150];
  return {
    uPaper: { value: S.paper }, uInk: { value: S.ink }, uHalf: { value: S.half }, uSun: { value: S.sun },
    uShade: { value: S.verd }, uWash: { value: new THREE.Vector2(w[0], w[1]) }, uTime: { value: 0 },
    uFog: { value: opts.fog ?? 0.12 }, uResY: { value: 900 },
  };
}

function plateMaterial(shared, extra, vert, frag, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...extra },
    vertexShader: vert, fragmentShader: frag, fog: true, side: o.side ?? THREE.FrontSide,
    vertexColors: !!o.vertexColors,
  });
}

// ---------------------------------------------------------------- the ground of the living half
function makeHeight(noise, V) {
  const e = Math.exp(-KP), pr = (r) => (Math.exp((-KP * r) / R) - e) / (1 - e), p0 = pr(R0);
  const tanP = Math.tan(PITCH);
  const lineY = (z) => 440 - (Math.max(z, R0 - 12) - R0) * tanP;       // the final approach, climbing north
  function heightAt(x, z) {
    const r = Math.hypot(x, z), ang = Math.atan2(z, Math.max(-x, 1e-3));
    const a = pr(Math.max(r, R0)) / p0;
    let h = LIP * 0.5 * (a + Math.sqrt(a * a + 0.0009)) + 1.2 * smoothstep(R * 0.7, R * 1.1, r);
    // barrancas: radial gullies, strongest on the middle slopes
    const mid = smoothstep(70, 220, r) * (1 - smoothstep(620, 900, r));
    // (round 4) the spine of the upper ridge is one clean arete: gullies and ribs die out toward the seam there, so that the
    // herd on the crest and the camera line beside it keep the same footing on every visit
    const arete = 1 - 0.88 * Math.exp(-(x * x) / 1800) * smoothstep(105, 150, r) * (1 - smoothstep(335, 390, r));
    h += mid * arete * (15 * noise.fbm2(ang * V.gul + V.o1, r * 0.0035, 3) + 5 * noise.n2(ang * V.gul * 3.3, r * 0.011 + V.o2));
    // rock ribs near the top
    h += 7 * arete * smoothstep(260, 120, r) * smoothstep(R0 - 6, R0 + 30, r) * Math.max(0, noise.n2(ang * 9 + V.o2, r * 0.02));
    // apron undulation
    h += smoothstep(600, 900, r) * 3.5 * noise.fbm2(x * 0.006 + V.o1, z * 0.006, 3);
    // the knife crest along both seams
    h += 7 * Math.exp(-(x * x) / 900) * smoothstep(R0 + 30, 160, r) * (1 - smoothstep(700, 860, r));
    // crater lip and bowl
    const lipN = 6 * noise.n2(ang * 2.6 + V.o1, 3.7) * Math.exp(-((r - R0) * (r - R0)) / 500);
    h += lipN;
    if (r < R0) { const q = r / R0; h -= 46 * (1 - q * q) * (1 - 0.35 * q * q) - 3 * noise.n2(x * 0.08, z * 0.08); }
    // two snow horns flanking the notch
    for (let i = 0; i < 2; i++) {
      const hx = i ? NOTCH_X - 12.5 : NOTCH_X + 12, hz = R0 + (i ? -1 : 2), d2 = (x - hx) * (x - hx) + (z - hz) * (z - hz) * 0.55;
      h += (i ? V.horn1 : V.horn0) * 1.55 * Math.exp(-d2 / 46) + 6 * Math.exp(-d2 / 190);
    }
    // the notch: a trough cut under the final approach
    if (z > 0 && z < 130) {
      const side = 1 - smoothstep(6.5, 10.5, Math.abs(x - NOTCH_X));
      const floor = lineY(z) - 8.2 + 0.6 * noise.n2(x * 0.3, z * 0.3);
      if (side > 0 && h > floor) h = lerp(h, floor, side);
    }
    return h;
  }
  return { heightAt, lineY };
}

// the lava stream on the living flank (see TERRAIN_FRAG): metres outside its edge at (x, z), negative inside it
function flowEdge(x, z, rEnd, wk) {
  const r = Math.hypot(x, z);
  if (x >= 0 || r < 40 || r > rEnd + 10) return 1e9;
  const aF = 0.56 + 0.836 * smoothstep(44, 230, r) + 0.035 * Math.sin(r * 0.043 + 1) + 0.015 * Math.sin(r * 0.117);
  const w = (3.2 + 2.6 * smoothstep(60, 260, r) + 1.2 * Math.sin(r * 0.05 + 2)) * wk * Math.sqrt(clamp((rEnd - r) / 40, 0, 1));
  return Math.abs(Math.atan2(z, Math.max(-x, 1e-3)) - aF) * r - w;
}

// (round 11) the rule of the rock ribs, the same as in TERRAIN_FRAG. Returns for a point of the living half: k (which rib),
// dl (metres across the fall line from the rib's line, positive to windward), on (0..1: the rib stands here), hw (half width
// of its rock), v1 and v2 (the rib's own two numbers), qd (the comb's density there, lines per radian times 2 pi).
function makeRibField(ribU, HF) {
  const TAU = 6.2831853;
  return (x, z) => {
    const r = Math.hypot(x, z), ang = Math.atan2(z, Math.max(-x, 1e-3)), sA = 1.5707963 - Math.abs(ang), eS = Math.exp(-sA / 0.3);
    const q = 31 * ang + 15.9 * Math.sign(ang) * (eS - 0.00532) + 0.8 * Math.sin(ang * 5.3 + ribU.y) + ribU.x;
    const qd = 31 + 53 * eS + 4.24 * Math.cos(ang * 5.3 + ribU.y), k = Math.floor(q / TAU + 0.5), dl = ((q - TAU * k) / qd) * r;
    const v1 = 0.5 + 0.5 * Math.sin(k * 2.399963 + ribU.z), v2 = 0.5 + 0.5 * Math.sin(k * 4.118 + ribU.w);
    const seg = Math.sin(r * 0.085 + TAU * v2) - lerp(-2, 0.15, smoothstep(0.35, 0.8, sA)), h = HF.heightAt(x, z);
    const d0 = (x + 2) * (x + 2) + (z - 46) * (z - 46), d1 = (x + 26.5) * (x + 26.5) + (z - 43) * (z - 43);
    const offNotch = z > 0 ? 1 - (1 - smoothstep(66, 74, z)) * (1 - smoothstep(6, 8.5, Math.abs(x + 14))) : 1;
    const on = smoothstep(0, 2.5, h - 360 - 24 * v1) * smoothstep(0, 0.2, seg) * (r >= 52 ? 1 : 0) * smoothstep(120, 200, Math.min(d0, d1)) * offNotch * (x < -0.05 ? 1 : 0);
    return { k, dl, on, hw: Math.min(2.1 + 1.5 * v2, (1.9 * r) / qd), v1, v2, qd, r, ang, h };
  };
}

const TERRAIN_VERT = /* glsl */ `
attribute vec3 aTone;
varying vec3 vPos; varying vec3 vNrm; varying float vDist; varying vec3 vTone;
${FOG_V}
void main(){
  vPos = position; vNrm = normal; vTone = aTone;
  vec4 mvPosition = modelViewMatrix*vec4(position,1.);
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const TERRAIN_FRAG = /* glsl */ `
varying vec3 vPos; varying vec3 vNrm; varying float vDist; varying vec3 vTone;
uniform vec3 uGreen, uOlive, uAsh, uGamb, uVerm; uniform float uAshFall, uSnowDrop; uniform vec4 uFlow;     // uFlow: end radius, on, width, -
uniform vec4 uRib;                // the rock ribs' seeded phases (see ribField below)
${PLATE_COMMON}
${FOG_F}
void main(){
  vec3 n = normalize(vNrm + vec3(0., 1e-4, 0.));
  float r = length(vPos.xz);
  float h = vPos.y;
  float ang = atan(vPos.z, max(abs(vPos.x), 1e-3));
  // (round 12) derivatives that cannot jump from one triangle of the ground to the next: the lens's own ray through this
  // pixel and its neighbours (the same whatever it lands on), carried onto the ground's smooth normal. dPx and dPy are the
  // metres of ground between this pixel and the next across and down. They take the place of fwidth() within 110 m of the
  // horns (kS below), where the hatch period used to change at every edge of the mesh and showed it as a seam.
  vec3 Vd = normalize(vPos - cameraPosition + vec3(0., 1e-5, 0.));
  vec3 dVx = dFdx(Vd), dVy = dFdy(Vd);
  float nV = dot(n, Vd); nV = nV < 0. ? min(nV, -0.12) : max(nV, 0.12);
  vec3 dPx = vDist*(dVx - Vd*(dot(n, dVx)/nV)), dPy = vDist*(dVy - Vd*(dot(n, dVy)/nV));
  // ---- the lava stream (round 4): out of a breach in the lip west of the notch and down the south flank beside the seam.
  // It is drawn as the print draws fire: a vermilion wash over a gamboge thread, a firm outline, dark crossed levees.
  // dFl: metres across the stream; dE: metres outside its edge. The same curve is flowEdge() in the code below.
  float aF = 0.56 + 0.836*smoothstep(44., 230., r) + 0.035*sin(r*0.043 + 1.) + 0.015*sin(r*0.117);
  float dFl = (ang - aF)*r;
  float fdF = max(fwidth(dFl), 1e-4);
  float wF = (3.2 + 2.6*smoothstep(60., 260., r) + 1.2*sin(r*0.05 + 2.))*uFlow.z*sqrt(clamp((uFlow.x - r)/40., 0., 1.));
  float wE = max(wF, 2.4*fdF*step(r, uFlow.x - 6.));                 // never under five pixels wide, however far off
  float onF = step(40., r)*step(r, uFlow.x)*step(vPos.x, 0.)*uFlow.y;
  float dE = abs(dFl) - wE;
  float inF = (1. - smoothstep(-0.5*fdF, 0.5*fdF, dE))*onF;
  float zn = (vnoise(vPos.xz*0.02) - 0.5)*26. + (vnoise(vPos.xz*0.11) - 0.5)*8.;
  float hz = h + zn;
  float hs = hz + uSnowDrop*(0.6 + 0.8*vnoise(vPos.xz*0.035 + 4.));
  float forest = 1. - smoothstep(175., 200., hz);
  float paramo = smoothstep(175., 200., hz)*(1. - smoothstep(300., 322., hz));
  float arenal = smoothstep(300., 322., hz)*(1. - smoothstep(368., 388., hs));
  float snow = smoothstep(368., 388., hs)*smoothstep(0.35, 0.6, n.y + 0.25*vnoise(vPos.xz*0.07));
  // (round 11) rock ribs break through the snow down the fall line: the mountain's own rock, by a rule of the ground that
  // is the same on every side of the cone. A rib's line is a fall line (q = 2 pi k, closer together toward the two seams,
  // where the crest is); it stands from its own foot (360 to 384 m up) to the lip, unbroken near the seams and in lengths
  // further round; its rock lies a little to windward of the line and the snow drifts against its lee. ribField() in the
  // code below is the same rule, and the rib bodies of the world stand on it.
  float sA = 1.5707963 - abs(ang);
  float eS = exp(-sA/0.3);
  float rq0 = 31.*ang + 15.9*sign(ang)*(eS - 0.00532) + 0.8*sin(ang*5.3 + uRib.y) + uRib.x;
  float rqd = 31. + 53.*eS + 4.24*cos(ang*5.3 + uRib.y);
  float rk = floor(rq0/6.2831853 + 0.5);
  float rdl = (rq0 - 6.2831853*rk)/rqd*r;                              // metres across the fall line, positive to windward
  float rv1 = 0.5 + 0.5*sin(rk*2.399963 + uRib.z), rv2 = 0.5 + 0.5*sin(rk*4.118 + uRib.w);
  float rseg = sin(r*0.085 + 6.2831853*rv2) - mix(-2., 0.15, smoothstep(0.35, 0.8, sA));
  float rhw = min(2.1 + 1.5*rv2, 1.9*r/rqd);
  vec2 hn0 = vPos.xz - vec2(-2., 46.), hn1 = vPos.xz - vec2(-26.5, 43.);
  float hornD = min(dot(hn0, hn0), dot(hn1, hn1));                     // metres squared from the nearer horn's top, on the map
  float offHorn = smoothstep(120., 200., hornD);
  float kS = 1. - smoothstep(12100., 22500., hornD);                   // 1 within 110 m of the horns, 0 beyond 150 m
  float hornZ = 1. - smoothstep(480., 760., hornD);                    // a horn's own body: within 22 to 27 m of its top
  float offNotch = 1. - step(0., vPos.z)*(1. - smoothstep(66., 74., vPos.z))*(1. - smoothstep(6., 8.5, abs(vPos.x + 14.)));     // the floor of the notch itself stays snow
  // (its edge is ragged and its width uneven, as rock breaks; the bodies of the world stand on its middle)
  float rdlN = rdl - 0.8 + (vnoise(vPos.xz*0.3 + 9.) - 0.5)*1.5;
  float rhwN = rhw*(0.82 + 0.4*vnoise(vec2(r*0.09, rk*3.7)));
  float fdl = clamp(fwidth(rdlN), 1e-4, 0.5*rhwN);
  float rib = (1. - smoothstep(rhwN - 0.5*fdl, rhwN + 0.5*fdl, abs(rdlN)))*smoothstep(0., 2.5, h - 360. - 24.*rv1)*smoothstep(0., 0.2, rseg)
    *step(52., r)*offHorn*offNotch*step(vPos.x, -0.05);
  // the two horns of the notch are snow horns: snow lies on their steep faces too, within 18 to 30 m of each top
  snow = max(snow, (1. - smoothstep(330., 900., hornD))*smoothstep(368., 388., hs));
  snow *= 1. - rib;
  arenal *= 1. - rib;
  snow *= 1. - (1. - smoothstep(3., 15., dE))*onF;                    // no snow lies beside the stream
  float plain = smoothstep(830., 900., r);
  float ndl = clamp(dot(n, uSun), 0., 1.);
  // (round 12) the two horns of the notch are a light horn and a shaded horn: the one that stands on the far side of the
  // notch from the sun shows us the faces the sun is on, the one on the sun's side the faces turned from it. hornE: +1 on
  // the east horn's body, -1 on the west horn's.
  float hornE = dot(hn0, hn0) < dot(hn1, hn1) ? 1. : -1.;
  ndl = clamp(ndl - 0.3*hornE*(uSun.x < 0. ? -1. : 1.)*hornZ, 0., 1.);
  float shade = 1. - smoothstep(0.25, 0.85, ndl);
  // (round 12) tone is line on the forest ground as on the rest of the mountain, near and far: bare paper and a firm
  // contour where a fold of the ground faces the sun, contour and fall-line hachures where it turns from it, and the
  // hachures joined into lines that cross the contours in the hollows and under the densest stands (vTone, from the
  // ground itself and from where the crowns stand). The green wash lies over the lines as it did. The numbers are the
  // steps of the scale below: 0.3 is where the contour is whole and no hachure has begun (lA, lB), 0.62 where the
  // hachures are whole, 0.82 where they are nearly joined.
  float hol = clamp(vTone.x, 0., 1.), stand = clamp(vTone.y, 0., 1.), turned = clamp(vTone.z, 0., 1.);
  float forestK = forest*(1. - plain);
  float base = forest*0.12 + paramo*0.3 + arenal*0.1;
  base = mix(base, 0.2, plain);
  float rock = max((1.-snow)*smoothstep(368., 388., hz), rib);
  float tuft = paramo + 0.6*forest;                   // grass still stands through fresh snow
  forest *= 1. - snow; paramo *= 1. - snow;
  // (on a horn's snow the shade runs the whole scale: paper in the light, contours, hachures, and crossed lines in the lee)
  float tone = clamp(base + rock*0.3 + rib*0.3 + shade*(1. - forestK)*(0.46 - 0.08*snow - 0.14*rock - 0.1*paramo - 0.06*arenal + 0.04*forest + 0.5*snow*hornZ)
    + forestK*(1. - snow)*(0.18 + 0.32*turned + 0.52*max(hol, stand)), 0., 0.88);
  // (round 11) the arenal is pale ash, the palest ground of the mountain bar the snow: a faint contour rule and stipple, no hatching
  tone = mix(tone, min(tone, 0.15 + 0.1*shade), arenal);
  // burr: a fixed low-frequency wobble of the coordinates
  float burr = vnoise(vPos.xz*0.045) - 0.5;
  float cA = h + burr*2.2;
  float axS = max(abs(vPos.x), 1e-3), sgX = vPos.x < 0. ? -1. : 1.;
  float fa = mix(fwidth(ang), (abs(axS*dPx.z - vPos.z*sgX*dPx.x) + abs(axS*dPy.z - vPos.z*sgX*dPy.x))/max(axS*axS + vPos.z*vPos.z, 1.), kS);
  float rq = exp2(floor(log2(max(r, 4.))*1.5)/1.5);
  float band = floor(log2(max(r, 4.))*1.5);
  float cB = ang*rq + band*1.7 + burr*1.5;
  float fB = fa*rq;
  float cC = (vPos.x + vPos.z)*0.7071 + h*0.9 + burr*2.;
  float fwA = mix(fwidth(h), abs(dPx.y) + abs(dPy.y), kS);
  float fwC = mix(fwidth((vPos.x + vPos.z)*0.7071 + h*0.9), abs(dot(dPx, vec3(0.7071, 0.9, 0.7071))) + abs(dot(dPy, vec3(0.7071, 0.9, 0.7071))), kS);
  // where the fourth density is the fall line crossing the contour and not a third direction: the forest, the horns' snow
  float crossK = max(forest*(1. - plain), snow*hornZ);
  float joined = crossK*smoothstep(0.7, 0.86, tone);
  vec2 hA = hatch(cA, fwA, 2.5, 220., tone);
  // (on the forest ground the crossing lines are finer and closer than the contours they cross, and stay in lengths:
  // a second, lighter set over the first, as the engraver lays it, not a net of equal lines)
  vec2 hB = hatch(cB, fB*(1. - 0.4*joined*forestK), 1.6, 150., tone*(0.55 + 0.3*joined*(1. - forestK)));
  vec2 hC = hatch(cC, fwC, 2.0, 150., tone);
  // a horn's hachures run down the horn's own fall lines, round its own top. The coordinate is the bearing round the top
  // in 256ths of a turn and the base period is one of them, so every period the hatch can pick divides the turn and the
  // lines meet themselves where the bearing wraps.
  vec2 hv = hornE > 0. ? hn0 : hn1;
  float angH = atan(hv.y, hv.x + (abs(hv.x) + abs(hv.y) < 1e-4 ? 1e-4 : 0.));
  float faH = (abs(hv.x*dPx.z - hv.y*dPx.x) + abs(hv.x*dPy.z - hv.y*dPy.x))/max(dot(hv, hv), 0.04);
  float cBh = angH*40.743665;
  vec2 hBh = hatch(cBh, faH*40.743665, 1., 1e9, tone*(0.55 + 0.3*joined));
  float brkH = smoothstep(0.42, 0.56, vnoise(vec2(cBh*0.9 + 3.1, h*0.35)));
  // far away the contours give way to fall-line hachures, as on a hachure map
  // (round 12: not on the forest ground, which keeps its four densities far off too; there the hatch itself thins to a
  // half-tone where its lines would be closer than the print can hold)
  float farA = smoothstep(5., 30., 6.*max(fwA, 1e-6))*(1. - forestK);
  float lA = smoothstep(0.1, 0.3, tone)*(1. - 0.72*farA);
  float lB = smoothstep(0.42 - 0.3*farA, 0.62 - 0.3*farA, tone), lC = smoothstep(0.72, 0.9, tone)*(0.65 - 0.3*forest)*(1. - crossK);
  // the spine of the knife crest stays pale (contours only): the herd runs along it and must read against it
  float spine = exp(-vPos.x*vPos.x/240.)*(1. - plain)*smoothstep(150., 200., hz);
  lB *= 1. - 0.9*spine; lC *= 1. - spine;
  // hachures are short strokes: break them along the fall line at the scale of the line period
  float ocB = log2(max(6.0*max(fB, 1e-6)/1.6, 1e-4));
  float loB = floor(ocB), fBk = ocB - loB, PB = 1.6*exp2(loB);
  float brk0 = smoothstep(0.45, 0.6, vnoise(vec2(cB/PB*0.7 + 3.1, h/(PB*6.))));
  float brk1 = smoothstep(0.45, 0.6, vnoise(vec2(cB/PB*0.35 + 3.1, h/(PB*12.))));
  float brk = mix(brk0, brk1, fBk);
  brk = mix(brk, 1., joined*(1. - 0.35*forestK));                      // in the deepest shade the strokes join into lines
  float hachB = mix(hB.x*brk, hBh.x*mix(brkH, 1., joined), hornZ);
  float steep = 1. - plain*(1. - smoothstep(0.03, 0.12, 1. - n.y));
  float cP = vPos.z + burr*5.;
  vec2 hP = hatch(cP, fwidth(vPos.z), 3.0, 200., 0.25);
  float pbrk = smoothstep(0.45, 0.6, vnoise(vec2(vPos.x*0.05, cP*0.33)));
  float ink = 1. - (1. - hA.x*lA*steep)*(1. - hachB*lB*steep)*(1. - hC.x*lC*steep*0.8);
  float inkRock = max(hA.x*lA, hatch(cA, fwA*0.55, 2.5, 220., min(tone*1.4, 1.)).x*smoothstep(0.3, 0.75, shade));
  ink *= 1. - 0.4*arenal;
  ink = mix(ink, inkRock*steep, rock);
  ink = mix(ink, max(ink, hC.x*0.85), rib);                           // a rib's own ground is crossed: dark rock in the snow
  ink = max(ink, hP.x*pbrk*(1. - steep)*0.8);
  // near detail that fades to nothing with distance: tussock ticks, ash stipple, sastrugi strokes
  float pxm = max(mix(max(fwidth(vPos.x), fwidth(vPos.z)), max(abs(dPx.x) + abs(dPy.x), abs(dPx.z) + abs(dPy.z)), kS), 1e-5);
  float nearK = 1. - smoothstep(0.08, 0.3, pxm);
  float tick = hatch(cB, fB, 0.7, 1e9, 0.25).x*step(0.5, vnoise(vec2(cB*1.6, h*1.9)))*step(0.35, vnoise(vPos.xz*0.6));
  vec2 dg = vec2(cB, h*1.6)/0.45; vec2 di = floor(dg);
  float dd = length(fract(dg) - 0.5 - 0.35*(vec2(h21(di), h21(di + 3.)) - 0.5));
  float stip = (1. - smoothstep(0.1, 0.2, dd))*step(0.45, h21(di + 9.));
  // (round 12) on the rare visit the ash lies on the snow as stipple, thicker to leeward (the wind goes west-north-west,
  // as the spindrift does) and in the lee of every rib, never as a hatch or a flat grey: three sizes of the same stipple,
  // each fixed to the ground, hand over to one another with distance. ashD: the share of its cells that carry a dot.
  float lee = smoothstep(-0.1, 0.45, dot(n.xz, vec2(-0.82, -0.57)));
  float ashD = uAshFall*snow*clamp(0.28 + 0.55*lee + 0.3*(1. - smoothstep(0.5, 7., -rdlN))*step(rdlN, 0.)*smoothstep(0., 2.5, h - 360. - 24.*rv1), 0., 0.92);
  float stipA = (1. - smoothstep(0.1, 0.2, dd))*step(h21(di + 9.), ashD);
  float cW = vPos.x*0.8 - vPos.z*0.6 + burr*3.;
  float fwW = mix(fwidth(vPos.x*0.8 - vPos.z*0.6), abs(dPx.x*0.8 - dPx.z*0.6) + abs(dPy.x*0.8 - dPy.z*0.6), kS);
  float sast = hatch(cW, fwW, 1.3, 1e9, 0.12).x*step(0.5, vnoise(vec2(cW*0.9, (vPos.x*0.6 + vPos.z*0.8)*0.12)));
  ink = max(ink, nearK*steep*max(max(tick*tuft*(1. - 0.3*snow)*0.85, max(stip*arenal, stipA)*0.8), sast*snow*0.75));
  // (round 11) further off the ash keeps a coarser stipple, fixed to the ground like the first
  vec2 dg2 = vec2(cB, h*1.6)/1.7; vec2 di2 = floor(dg2);
  float dd2 = length(fract(dg2) - 0.5 - 0.4*(vec2(h21(di2 + 5.), h21(di2 + 8.)) - 0.5));
  float stip2 = (1. - smoothstep(0.1, 0.17, dd2))*step(0.3, h21(di2 + 2.));
  float stip2A = (1. - smoothstep(0.1, 0.17, dd2))*step(h21(di2 + 2.), ashD);
  ink = max(ink, max(stip2*arenal, stip2A)*0.62*smoothstep(0.07, 0.22, pxm)*(1. - smoothstep(0.35, 1.1, pxm)));
  vec2 dg3 = vec2(cB, h*1.6)/6.5; vec2 di3 = floor(dg3);
  float dd3 = length(fract(dg3) - 0.5 - 0.4*(vec2(h21(di3 + 4.), h21(di3 + 7.)) - 0.5));
  ink = max(ink, (1. - smoothstep(0.1, 0.17, dd3))*step(h21(di3 + 1.), ashD)*0.55*smoothstep(0.35, 1.0, pxm)*(1. - smoothstep(2.2, 5., pxm)));
  // snow: a few firm form lines even in light (every other contour, in lengths that begin and end on a firm edge)
  float sn7 = vnoise(vPos.xz*0.05 + 7.), fs7 = clamp(fwidth(sn7), 1e-4, 0.08);
  ink = max(ink, snow*hatch(cA, fwA, 5., 220., 0.34).x*0.8*smoothstep(0.6 - fs7, 0.6 + fs7, sn7));
  // the stream: levees in close crossed lines, a firm edge, crust drifting down on the wash, flow lines with travelling dashes
  float lev = (1. - smoothstep(max(2.2, 1.5*fdF), max(4.5, 3.*fdF), dE))*step(0., dE)*onF;
  float levInk = 1. - (1. - hatch(cA, fwA, 1.2, 220., 0.9).x)*(1. - hatch(cC, fwC, 1.0, 150., 0.8).x);
  ink = max(ink*(1. - inF), max(lev*levInk, lineAA(dE, fdF, 1.4)*onF));
  float tF = r - uTime*2.4;
  float crN = vnoise(vec2(dFl*0.3, tF*0.1)) + 0.35*vnoise(vec2(dFl*0.9 + 4., tF*0.33));
  // (every boundary in the stream is a drawn edge one pixel soft: flat washes laid side by side, the rafts of crust in crossed lines)
  float crW = clamp(fwidth(crN), 1e-4, 0.02);
  float crust = smoothstep(0.82 - crW, 0.82 + crW, crN)*inF;
  float crEdge = lineAA(crN - 0.82, crW, 1.1)*inF*(1. - smoothstep(0.25, 0.6, fdF));
  float fkF = floor(dFl/0.9 + 0.5);
  float fline = lineAA((dFl/0.9 - fkF)*0.9, fdF, 0.55)*step(0.45, fract(tF/(6. + 3.*h11(fkF)) + h11(fkF + 3.)))*inF*(1. - smoothstep(0.15, 0.45, fdF));
  ink = max(ink, max(crust*levInk*0.9, max(crEdge*0.8, fline*0.5*(1. - crust))));
  float coA = abs(dFl) + 0.7*(vnoise(vec2(dFl*0.5, tF*0.2)) - 0.5) - 0.4*wE, coW = clamp(fwidth(coA), 1e-4, 0.12);
  float coreF = (1. - smoothstep(-coW, coW, coA))*inF*(1. - crust);
  float bkA = dE + 2.6*vnoise(vPos.xz*0.21) - 5.2, bkW = clamp(fwidth(bkA), 1e-4, 0.2);
  float vermA = max(inF*(1. - 0.72*crust), (1. - smoothstep(-bkW, bkW, bkA))*step(0., dE)*onF*0.3);   // the baked ground beside it takes a thin red wash
  float gambA = coreF*(0.74 + 0.26*step(0.2, sin(r*0.6 - uTime*2. + 2.*vnoise(vec2(dFl*0.4, r*0.1)))));
  // (round 12) no soft-edged tone on the snow: the shade on snow and summit rock is two flat washes, each ending on a firm
  // edge one pixel wide, and the shadow patches of the open snowfields are flat with firm edges (none on the horns)
  float fsh = clamp(fwidth(shade), 1e-4, 0.15);
  float shadeQ = 0.5*smoothstep(0.3 - fsh, 0.3 + fsh, shade) + 0.42*smoothstep(0.72 - fsh, 0.72 + fsh, shade);
  float pn = vnoise(vPos.xz*0.09 + 2.), fpn = clamp(fwidth(pn), 1e-4, 0.08);
  float shPatch = 0.34*smoothstep(0.56 - fpn, 0.56 + fpn, pn)*snow*(1. - hornZ);
  vec3 wash = forest*mix(vec3(1.), uGreen, 0.78) + paramo*uOlive + arenal*mix(vec3(1.), uAsh, 0.6) + (snow + rock)*mix(vec3(1.), uShade*mix(vec3(1.), uShade, 0.6), max(shadeQ, shPatch));
  wash = mix(wash, uShade, shade*0.35*(1. - snow)*(1. - 0.5*arenal));
  wash = mix(wash, mix(vec3(1.), uHalf/max(uPaper, vec3(0.05)), 0.5)*mix(vec3(1.), uShade, 0.5*shade), rib);
  float lineD = min(hA.y, mix(1., hB.y, lB));
  float wa = seep(vDist, fract(lineD + 0.2));
  // far off the zones keep a thin flat tint (the second plate), cooled toward verditer
  float farT = smoothstep(uWash.x, uWash.y*1.2, vDist)*(1. - plain);
  wash = mix(wash, mix(wash, uShade, 0.45), farT);
  wa = max(wa, 0.5*farT*(1. - snow));
  // (round 12: falling ash is the stipple above; it lays no hatch and no grey wash)
  vec3 pc = uPaper*mix(vec3(1.), wash, clamp(wa, 0., 1.));
  pc = mix(pc, uVerm*vec3(1.3, 1.5, 1.2), clamp(vermA, 0., 1.));
  pc = mix(pc, uGamb*vec3(1.25, 1.3, 1.0), clamp(gambA, 0., 1.));
  vec3 col = mix(pc, mix(uInk, uHalf, smoothstep(150., 700., vDist)), clamp(ink, 0., 1.));
  ${FRAG_END}
}`;

// ---------------------------------------------------------------- the page (the cut face) and the paper plain
const PAGE_VERT = /* glsl */ `
attribute float aTop;
varying vec3 vPos; varying float vTop; varying float vDist;
${FOG_V}
void main(){
  vPos = position; vTop = aTop;
  vec4 mvPosition = modelViewMatrix*vec4(position,1.);
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const PAGE_LIB = /* glsl */ `
// pen script in letter units: row pitch 1.4, letter body 0.3 high, a slanted hand of arches, cups and
// minims with the odd ascender and descender. fxs, fys = units per pixel.
float script(vec2 q, float fxs, float fys){
  float row = floor(q.y/1.4); float yy = q.y - row*1.4;
  float xs = q.x - (yy - 0.6)*0.35;
  float wi = floor(xs/3.4); float wf = xs - wi*3.4;
  float hw = h21(vec2(wi, row));
  float on = step(0.12, wf)*step(wf, 3.4*(0.5 + 0.48*hw))*step(0.16, hw);
  on *= step(0.34, h21(vec2(floor(q.x/38.), row*1.7 + 3.)));
  float lf = fract(xs/0.42);
  float lh = h21(vec2(floor(xs/0.42), row*3.1 + 0.7));
  float arch = sin(3.14159*lf);
  float c = lh < 0.5 ? 0.5 + 0.3*arch : 0.8 - 0.3*arch;
  float ink = lineAA(yy - c, fys*(1. + 1.8*abs(cos(3.14159*lf))), 0.55);
  float bx = (0.5 - abs(lf - 0.5))*0.42;
  float top = lh > 0.78 ? 1.25 : 0.82, bot = lh < 0.12 ? 0.08 : 0.48;
  float minim = lineAA(bx, fxs, 0.55)*step(bot, yy)*step(yy, top);
  float fine = max(ink*step(0.4, yy)*step(yy, 0.9), minim);
  float lod = smoothstep(0.07, 0.2, max(fys, fxs*0.6));
  float band = step(0.48, yy)*step(yy, 0.84)*0.3;
  return mix(fine, band, lod)*on*(1. - smoothstep(0.4, 0.9, fys));
}
float fibre(vec2 p, float px){
  float a = 1. - smoothstep(0.04, 0.3, px);
  return 0.05*(vnoise(p*0.021) - 0.5) + 0.03*(vnoise(p*0.4 + 9.) - 0.5)*(1. - smoothstep(0.5, 3., px))
       + a*0.09*(vnoise(p*vec2(2.2, 26.)) - 0.5) + a*0.05*(vnoise(p*vec2(31., 3.)) - 0.5);
}
// foxing: brown age spots, (amount)
float foxing(vec2 p){
  vec2 g = p/41.; vec2 id = floor(g); vec2 f = fract(g);
  float hh = h21(id + 17.);
  vec2 c = vec2(h21(id), h21(id + 5.3))*0.7 + 0.15;
  float rad = (0.012 + 0.05*hh*hh);
  float d = length(f - c);
  float halo = 1. - smoothstep(rad*0.2, rad*2.4, d + 0.01*vnoise(p*0.9));
  return step(0.45, hh)*(0.5*halo + 0.5*(1. - smoothstep(rad*0.3, rad, d)));
}
`;

// The cut face, drawn as an illustrated section. Read from the top edge down: a fringe of hair roots, a band of soil
// with tree roots going down through it, then the cone's own beds, each engraved as its rock (ash, lava, cinders,
// columnar basalt, lapilli, old soil) under a flat tint that holds at any distance; an unconformity; under it the old
// country in folded beds (limestone in courses with ammonites, ochre sandstone, dark shale, red marl, conglomerate,
// coal) on a granite floor. Across the beds: three dykes with a vermilion thread, a side conduit of live lava with
// drifting crust and a baked halo, caves (dark vaults with stalactites and a pool, or pale burrow chambers with
// their tunnels) for the residents that the hero builds as figures; then the ledger's rules, ticks and script, the
// ruled boxes of the plates with a little ground and sky inside each, the tapir's ledge, three waterfalls and two
// condor shadows.
const NBOX = 11, NCAVE = 6;
const PAGE_FRAG = /* glsl */ `
varying vec3 vPos; varying float vTop; varying float vDist;
uniform vec4 uBox[${NBOX}]; uniform vec4 uFall[3]; uniform vec4 uShadow[2]; uniform vec4 uDyke[3]; uniform vec4 uLedge;
uniform vec4 uCave[${NCAVE}]; uniform vec4 uLava;        // uCave: centre, radii (ry < 0: a pale burrow chamber); uLava: x at y = 0, lean, half width, lava level
uniform float uConduit, uLip, uPageTone; uniform vec3 uVerm; uniform vec3 uFlower; uniform vec3 uSoil; uniform vec3 uGambP;
${PLATE_COMMON}
${PAGE_LIB}
${FOG_F}
float dotGrid(vec2 g, float dens){
  vec2 i = floor(g); vec2 c = fract(g) - 0.5 - 0.5*(vec2(h21(i), h21(i + 3.)) - 0.5);
  return (1. - smoothstep(0.14, 0.24, length(c)))*step(h21(i + 9.), dens);
}
void main(){
  vec2 p = vec2(-vPos.z, vPos.y);
  float depth = vTop - p.y;
  vec2 fw2 = fwidth(p);
  float fx = max(fw2.x, 1e-5), fy = max(fw2.y, 1e-5), px = max(fx, fy);
  float fd = max(fwidth(depth), 1e-5);
  float inside = step(-860., p.x)*step(p.x, 860.)*step(0., p.y);
  // ---- the cone's beds lie parallel to the flanks
  float sN = vnoise(vec2(p.x*0.008, depth*0.02));
  float cS = depth + 16.*sN + 0.03*abs(p.x);
  float fS = max(fwidth(cS), 1e-5);
  // ---- the old country under the cone: an unconformity, folded beds, a granite floor
  float yU = 0.6*vTop + 9. + 12.*(vnoise(vec2(p.x*0.017, 5.)) - 0.5);
  float cU = p.y - yU;
  float fU = max(fwidth(cU), 1e-5);
  float cF = p.y + 20.*sin(p.x*0.021 + 0.6) + 8.*sin(p.x*0.057 + 2.) + 0.07*p.x + 2.*(vnoise(p*0.05) - 0.5);
  float fF = max(fwidth(cF), 1e-5);
  float yG = 13. + 9.*vnoise(vec2(p.x*0.012, 9.));
  // ---- conduit
  float cu = 10.*sin(p.y*0.012 + 1.)*(1. - smoothstep(120., uLip - 60., p.y));
  float wc = mix(15., 5.5, clamp(p.y/uLip, 0., 1.)) + 16.*smoothstep(uLip - 80., uLip - 30., p.y);
  float dc = abs(p.x - cu) - wc;
  float fdc = max(fwidth(dc), 1e-5);
  // ---- magma chamber
  vec2 mc = (p - vec2(0., 26.))/vec2(150., 44.);
  float dm = (length(mc) - 1.)*44.;
  float fdm = max(fwidth(dm), 1e-5);
  // ---- the side conduit: a feeder that leaves the chamber and climbs to a vent on the flank
  float lvx = uLava.x + uLava.y*p.y + 5.*sin(p.y*0.045 + 1.) + 1.6*sin(p.y*0.13 + 2.);
  float b1 = (p.y - uLava.w*0.5)/9., b2 = (p.y - uLava.w*0.82)/6.;
  float lw = max(uLava.z*(1. + 0.3*sin(p.y*0.09)) + 6.*exp(-b1*b1) + 4.5*exp(-b2*b2), 3.*fx);      // from the valley it is still a red line
  float dl = abs(p.x - lvx)*0.94 - lw;
  float fpt = max(fwidth(p.x*0.7 - p.y), 1e-5);
  float fsh = max(fwidth(p.x + p.y), 1e-5);
  float ink = 0.; float vermA = 0.; float gambA = 0.;
  vec3 tint = vec3(1.); float tintK = 0.;
  float nearP = 1. - smoothstep(0.1, 0.3, px);                     // marks of half a metre resolve
  // ---- soil: a band under the edge, its base wavering
  float soilD = 3.6 + 3.2*vnoise(vec2(p.x*0.09, 3.));
  float deep = smoothstep(soilD, soilD + 0.5, depth)*inside;
  float inSoil = step(0.3, depth)*(1. - deep)*inside;
  float soilInk = mix(0.22, dotGrid(vec2(p.x, depth)/0.3, 0.55)*0.8, 1. - smoothstep(0.05, 0.16, px));
  ink = max(ink, max(soilInk, lineAA(depth - soilD, fd, 1.1))*inSoil);
  float old = (1. - smoothstep(-0.5*fU, 0.5*fU, cU))*deep;         // 1 in the old country
  float lightBed = 0.; float bodyInk = 0.;
  if (cU > 0.) {
    // ---- the cone: thin beds, each engraved as its rock, under bold flat tints
    float cT = cS + 0.7*(vnoise(p*0.3) - 0.5);
    float bs = cT/6.2 + 0.26*sin(cT*0.23 + 1.3);
    float bk = floor(bs), bf = bs - bk;
    float bt = h11(bk*1.37 + 5.3);
    float bedLod = 1. - smoothstep(0.05, 0.14, fS*0.22);              // a bed is at least seven pixels thick
    vec2 q = vec2(p.x, cT);
    float bedInk = 0.; vec3 bedTint = vec3(1.);
    if (bt < 0.24) {                 // ash and tuff: pale paper, a sparse stipple; the script is written here
      bedInk = mix(0.04, dotGrid(q/0.6, 0.3)*0.75, nearP); lightBed = 1.;
      bedTint = mix(vec3(1.), uGambP, 0.2);
    } else if (bt < 0.45) {          // lava: close diagonal hatching broken by cooling cracks
      float cr = (fract(q.x/2.7 + 0.35*vnoise(vec2(bk*3.1, q.y*0.5))) - 0.5)*2.7;
      bedInk = max(hatch(q.x*0.75 + q.y, fx*0.75 + fS, 0.4, 40., 0.42).x*0.85, lineAA(cr, fx, 0.8)*step(0.35, h11(floor(q.x/2.7) + bk*7.))*nearP);
      bedTint = mix(vec3(1.), uShade, 0.78);
    } else if (bt < 0.6) {           // scoria: a bed of cinders, each drawn round
      vec2 g = q/0.8; g.x += 0.5*floor(g.y) + 0.35*vnoise(vec2(g.y*0.7, bk));
      vec2 gi = floor(g); vec2 gc = fract(g) - 0.5 - 0.4*(vec2(h21(gi + 1.), h21(gi + 4.)) - 0.5);
      float gr = 0.1 + 0.18*h21(gi + 6.);
      float ga = atan(gc.y, gc.x + 1e-5)/6.2832 + h21(gi + 8.);
      bedInk = mix(0.14, lineAA((length(gc) - gr)*0.8, px, 0.7)*step(0.3, h21(gi + 2.))*step(0.3, fract(ga)), nearP);
      bedTint = mix(vec3(1.), uVerm, 0.4)*mix(vec3(1.), uHalf, 0.25);
    } else if (bt < 0.76) {          // columnar basalt: joints standing across the bed, stepped
      float cc = q.x + 0.3*sin(q.y*1.9 + bk*2.);
      float ci = floor(cc/0.9);
      float jn = lineAA((fract(cc/0.9) - 0.5)*0.9, fx + 0.6*fS, 0.6)*step(0.2, h21(vec2(ci, bk)));
      float sp = lineAA((fract(q.y/1.4 + h21(vec2(ci, bk + 2.))) - 0.5)*1.4, fS, 0.5)*step(0.5, h21(vec2(ci, floor(q.y/1.4) + bk)));
      bedInk = mix(0.14, max(jn, sp*0.8), nearP);
      bedTint = mix(vec3(1.), uShade, 0.55)*mix(vec3(1.), uHalf, 0.4);
    } else if (bt < 0.9) {           // lapilli: short dashes lying along the bed
      bedInk = hatch(q.y, fS, 0.5, 40., 0.22).x*step(0.5, vnoise(vec2(q.x*1.5, q.y*4.)))*0.8; lightBed = 0.6;
      bedTint = mix(vec3(1.), uGambP, 0.62);
    } else {                         // an old soil: close dark stipple under a wash
      bedInk = mix(0.2, dotGrid(q/0.33, 0.75)*0.85, nearP);
      bedTint = uSoil*vec3(0.9, 0.88, 0.8);
    }
    bedInk = max(bedInk, lineAA(min(bf, 1. - bf)*6.2, fS, 1.0)*0.85);
    bedInk = mix(0.07, bedInk, bedLod);
    // far off the thin beds give way to thick ones, each with a flat tint of its own
    float bedLine = hatchL(cS, fS, 28., 1e9, 0.3, 0.).x;
    float tbk = floor((cS + 1.2)/28.); float tbh = h11(tbk*2.31 + 1.7);
    vec3 farTint = tbh < 0.3 ? mix(vec3(1.), uShade, 0.8) : tbh < 0.55 ? mix(vec3(1.), uGambP, 0.6) : tbh < 0.74 ? mix(vec3(1.), uVerm, 0.38) : tbh < 0.9 ? mix(vec3(1.), uHalf, 0.5) : uSoil;
    bodyInk = max(bedLine*0.75, bedInk);
    tint = mix(farTint, bedTint, bedLod);
    // pigment pools along the foot of each bed
    tintK = 0.78 + 0.2*(1. - smoothstep(0.02, 0.3, bf))*bedLod;
  } else {
    // ---- the old country: folded beds
    float fs = cF/9.5 + 0.22*sin(cF*0.19 + 0.8);
    float fk = floor(fs), ff = fs - fk;
    float ft = h11(fk*1.71 + 2.3);
    vec2 q = vec2(p.x, cF);
    float nearF = 1. - smoothstep(0.12, 0.32, max(px, fF));
    float fInk = 0.; vec3 fTint = vec3(1.);
    if (p.y < yG) {                  // granite: a scatter of small crosses
      vec2 g = p/2.2; vec2 gi = floor(g); vec2 gc = fract(g) - 0.5 - 0.3*(vec2(h21(gi), h21(gi + 3.)) - 0.5);
      float cr = max(lineAA(gc.x*2.2, px, 0.6)*step(abs(gc.y), 0.16), lineAA(gc.y*2.2, px, 0.6)*step(abs(gc.x), 0.16))*step(0.45, h21(gi + 7.));
      fInk = mix(0.1, cr*0.8, nearF); fTint = mix(vec3(1.), uVerm, 0.26)*mix(vec3(1.), uGambP, 0.25);
      ff = 0.5;
    } else if (ft < 0.26) {          // limestone: coursed blocks
      float crs = floor(q.y/2.4);
      float course = lineAA((fract(q.y/2.4) - 0.5)*2.4, fF, 0.55);
      float jx = q.x/4.4 + 0.5*mod(crs, 2.) + 0.2*h11(crs);
      float joint = lineAA((fract(jx) - 0.5)*4.4, fx, 0.55)*step(0.25, h21(vec2(floor(jx), crs)));
      fInk = mix(0.07, max(course, joint)*0.7, nearF); fTint = mix(vec3(1.), uShade, 0.5);
    } else if (ft < 0.46) {          // sandstone: stipple and cross-bedding
      float xb = hatch(q.x*0.5 + q.y, fx*0.5 + fF, 0.9, 30., 0.2).x*step(0.5, vnoise(vec2(q.x*0.2, floor(q.y/2.)*3.)));
      fInk = mix(0.08, max(dotGrid(q/0.5, 0.35)*0.7, xb*0.7), nearF); fTint = mix(vec3(1.), uGambP, 0.72);
    } else if (ft < 0.62) {          // shale: close ruling along the bed, the dark band of the section
      fInk = hatch(q.y, fF, 0.45, 60., 0.55).x*0.85; fTint = mix(vec3(1.), uShade, 0.62)*mix(vec3(1.), uHalf, 0.6);
    } else if (ft < 0.8) {           // red marl: broken dashes and nodules
      float nd = dotGrid(q/1.3, 0.3);
      fInk = mix(0.06, max(hatch(q.y, fF, 0.9, 30., 0.2).x*step(0.55, vnoise(vec2(q.x*0.9, q.y*3.)))*0.75, nd*0.6), nearF); fTint = mix(vec3(1.), uVerm, 0.46);
    } else if (ft < 0.92) {          // conglomerate: pebbles
      vec2 g = q/1.1; g.x += 0.5*floor(g.y);
      vec2 gi = floor(g); vec2 gc = fract(g) - 0.5 - 0.4*(vec2(h21(gi + 1.), h21(gi + 4.)) - 0.5);
      fInk = mix(0.12, lineAA((length(gc*vec2(1., 1.5)) - 0.14 - 0.2*h21(gi + 6.))*1.1, px, 0.7)*step(0.25, h21(gi + 2.)), nearF); fTint = mix(vec3(1.), uHalf, 0.55);
    } else {                         // a coal seam between two partings
      float seam = step(0.22, ff)*step(ff, 0.78);
      fInk = max(hatch(q.x + q.y, fx + fF, 0.5, 60., 0.85).x, hatch(q.x - q.y, fx + fF, 0.5, 60., 0.7).x)*0.92*seam + (1. - seam)*dotGrid(q/0.5, 0.3)*0.6*nearF;
      fTint = mix(mix(vec3(1.), uGambP, 0.3), vec3(0.5, 0.47, 0.5), seam);
    }
    fInk = max(fInk, lineAA(min(ff, 1. - ff)*9.5, fF, 1.1)*0.85);
    // ammonites lie in the limestone and the sandstone
    float ai = floor(q.x/17. + 0.37*fk);
    float ah = h21(vec2(ai, fk*3.1 + 1.));
    vec2 av = vec2(q.x - (ai + 0.5 + 0.3*(h11(ai*1.3 + fk) - 0.5) - 0.37*fk)*17., (ff - 0.5)*9.5);
    float ar = length(av), aR = 1.7 + 2.2*ah;
    float aOn = step(0.4, h21(vec2(ai + 5., fk)))*step(ft, 0.46)*step(yG, p.y)*(1. - smoothstep(0.3, 0.6, px));
    float aIn = (1. - smoothstep(aR - px, aR + px, ar))*aOn;
    float ath = atan(av.y, av.x + 1e-5)/6.2832;
    float aw = log2(max(ar, 0.02)/aR)*1.7 - ath*(ah < 0.5 ? -1. : 1.);
    float whorl = lineAA((fract(aw + 0.5) - 0.5)*ar*0.41, px, 0.8);
    float ribs = lineAA((fract(ath*26. + 0.5) - 0.5)*ar*0.2417, px, 0.5)*step(0.35, fract(aw));
    float aInk = max(max(whorl, ribs*0.75), lineAA(ar - aR, px, 1.3))*smoothstep(0.03*aR, 0.1*aR, ar);
    fInk = mix(fInk, aInk, aIn); fTint = mix(fTint, mix(vec3(1.), uGambP, 0.16), aIn);
    bodyInk = fInk; tint = fTint;
    tintK = 0.8 + 0.18*(1. - smoothstep(0.02, 0.3, ff));
  }
  // the unconformity: one heavy wavering line with a row of pebbles under it
  float unc = max(lineAA(cU, fU, 1.6), dotGrid(vec2(p.x, cU)/0.9, 0.5)*step(cU, 0.)*step(-2.7, cU)*nearP*0.8)*deep;
  bodyInk = max(bodyInk, unc);
  float open = smoothstep(0., 3., dc)*smoothstep(0., 3., dm);
  ink = max(ink, bodyInk*deep*open*0.78);
  tintK *= deep*open*(1. - 0.6*smoothstep(700., 1700., vDist));
  tint = mix(tint, uSoil, inSoil); tintK = max(tintK, inSoil*0.95);
  // ---- hair roots and small tree roots: down through the soil and into the beds, with rootlets
  float rc = p.x/2.6; float ri = floor(rc); float rh = h11(ri + 31.);
  float rlen = soilD + (2. + 9.*rh*rh)*step(0.3, rh);
  float rx = (fract(rc) - 0.5)*2.6 - (h11(ri + 7.) - 0.5)*1.2 - 0.35*sin(depth*0.9 + rh*20.) - 0.15*sin(depth*2.7 + rh*9.);
  float root = lineAA(rx, fx, mix(2.2, 0.6, clamp(depth/rlen, 0., 1.)))*step(depth, rlen)*step(0.25, depth);
  float rt = depth - abs(rx)*1.1; float rk = floor(rt/0.8);
  float rootlet = lineAA((fract(rt/0.8) - 0.5)*0.54, max(fd, fx), 0.5)*step(abs(rx), 0.25 + 0.7*h11(rk + ri*3.))*step(depth, rlen*0.9)*step(0.4, depth);
  ink = max(ink, max(root, rootlet*0.8)*inside*(1. - smoothstep(0.1, 0.28, fx)));
  // ---- conduit walls, flow lines, the vermilion fill with its gamboge thread
  float inC = (1. - smoothstep(-0.5, 0.5, dc))*step(2., depth)*inside;
  float inM = (1. - smoothstep(-0.5, 0.5, dm))*inside;
  ink = max(ink, max(lineAA(dc, fdc, 1.1)*step(2., depth), lineAA(dm, fdm, 1.1)*(1. - inC))*inside);
  float flow = hatch(p.x - cu, fx, 2.2, 30., 0.2).x*inC*(1. - inM);
  float swirl = hatch(dm + 6.*sin(atan(mc.y, mc.x + 1e-4)*5.), fdm*1.5, 5., 60., 0.25).x*inM;
  ink = max(ink, max(flow, swirl)*0.7);
  float lvl = uConduit*(uLip - 40.);
  float below = 1. - smoothstep(lvl - 6., lvl + 6., p.y + 5.*vnoise(vec2(p.x*0.2, uTime*0.3)));
  float thread = lineAA(p.x - cu, fx, max(1.0, 1.4/fx))*inC*below;
  vermA = max(inM*0.8, inC*below*0.62);
  gambA = max(thread*0.9, inM*smoothstep(0.52, 0.7, vnoise(mc*5. + vec2(uTime*0.05, 0.)))*0.8);
  // ---- dykes: sheets of the same rock rising across the beds, each with its thread
  for (int i = 0; i < 3; i++) {
    vec4 D = uDyke[i];
    float dx = p.x - D.x - (p.y - D.y)*D.z - 1.3*sin(p.y*0.06 + D.x);
    float dn = abs(dx)*0.89 - D.w;
    float on = step(46., p.y)*smoothstep(soilD + 1., soilD + 4., depth)*inside;
    float m = (1. - smoothstep(-0.5*px, 0.5*px, dn))*on;
    ink *= 1. - m; tintK *= 1. - m;
    ink = max(ink, lineAA(dn, px, 0.9)*on*(1. - smoothstep(0.5, 2., px)));
    float fl = lineAA((fract(dx/0.45 + 0.5) - 0.5)*0.45, fx + 0.5*fy, 0.5)*step(0.45, vnoise(vec2(floor(dx/0.45 + 0.5)*3.3 + D.x, p.y*0.35)));
    ink = max(ink, fl*m*0.6*nearP);
    vermA = max(vermA, max(m*0.3, lineAA(dx, fx + 0.5*fy, max(1.0, 0.07/px))*on*0.75));
  }
  // ---- the side conduit: live lava under a drifting crust, the wall rock baked round it
  {
    float lon = step(0.6, depth)*inside;
    float lvlS = uLava.w + 2.5*(vnoise(vec2(p.x*0.3, uTime*0.4)) - 0.5);
    float live = 1. - smoothstep(-1.5, 1.5, p.y - lvlS);
    float lin = (1. - smoothstep(-0.5*px, 0.5*px, dl))*lon;
    float halo = (1. - smoothstep(0., 12., dl))*step(0., dl)*lon*live;
    ink *= 1. - lin; tintK *= 1. - lin*live;
    float rk2 = dl/2.6 - uTime*0.06;
    float ring = lineAA((fract(rk2) - 0.5)*2.6, px, 0.6)*step(0.4, vnoise(vec2(p.y*0.4, floor(rk2)*7.)))*halo*(1. - smoothstep(0.15, 0.5, px));
    float crustN = vnoise(vec2((p.x - lvx)*0.4, (p.y - uTime*2.2)*0.24)) + 0.3*vnoise(vec2((p.x - lvx)*1.3, (p.y - uTime*2.2)*0.8));
    // (round 4) seen whole and near from the new line: every boundary a drawn edge, the rafts of crust in crossed lines, the
    // baked wall a flat thin wash with a broken rim, the gamboge core a second flat wash
    float crW = max(fwidth(crustN), 1e-4);
    float crust = smoothstep(0.76 - crW, 0.76 + crW, crustN)*lin*live;
    float crustEdge = lineAA(crustN - 0.76, crW, 1.1)*lin*live;
    float crH = 1. - (1. - hatch(p.x*0.7 - p.y, fpt, 0.55, 300., 0.85).x)*(1. - hatch(p.x*0.7 + p.y, fpt, 0.7, 200., 0.7).x);
    float void2 = lin*(1. - live);
    ink = max(ink, max(max(lineAA(dl, px, 1.4)*lon, ring*0.65), max(crust*crH*0.9, crustEdge*0.8)));
    ink = max(ink, void2*hatch(p.x*0.7 - p.y, fpt, 0.7, 40., 0.5).x*0.7);
    float coA = dl + lw*(0.52 + 0.3*(vnoise(vec2((p.x - lvx)*0.5, p.y*0.3 - uTime*0.6)) - 0.5)), coW = max(fwidth(coA), 1e-4);
    float core = (1. - smoothstep(-coW, coW, coA))*live*lin;
    float bkA = dl - 4.5 - 4.*vnoise(p*0.27), bkW = max(fwidth(bkA), 1e-4);
    float baked = (1. - smoothstep(-bkW, bkW, bkA))*step(0., dl)*lon*live;
    vermA = max(vermA*(1. - lin), max(lin*live*(1. - 0.75*crust), baked*0.3));
    gambA = max(gambA*(1. - lin), core*(1. - crust)*(0.72 + 0.28*step(0.2, sin(p.y*0.5 - uTime*2. + 2.*vnoise(p*0.3)))));
  }
  // ---- altitude rules, ticks, zone lines, scale poles
  vec2 rl = hatchL(p.y, fy, 10., 1e9, 0.12, -2.);
  float major = lineAA((fract(p.y/50. + 0.5) - 0.5)*50., fy, 0.9);
  float tick = lineAA((fract(p.x/5. + 0.5) - 0.5)*5., fx, 0.5)*step(fract(p.y/10.)*10., 1.1)*(1. - smoothstep(0.25, 0.7, px));
  float zy = min(min(abs(p.y - 60.), abs(p.y - 190.)), min(abs(p.y - 310.), abs(p.y - 380.)));
  float zline = lineAA(zy, fy, 0.8)*step(0.4, fract(p.x/10.));
  float pole = step(abs(abs(p.x) - 74.), 2.6)*step(mod(floor(p.y/50.), 2.), 0.5);
  pole = max(pole, lineAA(abs(abs(p.x) - 74.) - 2.6, fx, 0.7));
  float bar = step(abs(p.y - 5.), 2.)*step(mod(floor(p.x/100.), 2.), 0.5);
  bar = max(bar, lineAA(abs(p.y - 5.) - 2., fy, 0.7));
  float ledger = max(max(rl.x*0.55, major*0.8), max(tick*0.7, zline))*step(1.5, depth)*inside;
  ledger *= max(smoothstep(-1., 2., dc), 0.35)*smoothstep(-1., 2., dl);
  ink = max(ink, ledger);
  ink = max(ink, max(pole*step(3., depth), bar*step(4., depth))*inside*0.92);
  // ---- script: small rows between the rules, large rows naming the zones; it keeps to the pale beds of the cone
  float para = step(0.34, vnoise(p*vec2(0.011, 0.03) + 3.));
  float sm = script(p/0.893, fx/0.893, fy/0.893)*para;
  vec2 pl = (p - vec2(0., 2.))/1.8;
  float lgOn = step(0.8, h11(floor(pl.y/1.4) + 11.));
  float lg = script(pl, fx/1.8, fy/1.8)*lgOn;
  float clearTxt = smoothstep(2., 8., dc)*smoothstep(1., 6., dm)*smoothstep(2., 6., dl)*smoothstep(soilD + 1., soilD + 3., depth)*inside*smoothstep(3., 6., abs(abs(p.x) - 74.));
  clearTxt *= lightBed*(1. - old);
  ink = max(ink, max(sm*0.85, lg)*clearTxt);
  // ---- the page in half-tone (afternoon print: the sun is behind the cut)
  ink = max(ink, uPageTone*hatch(p.x*0.7 - p.y + 3.*vnoise(p*0.03), fpt, 0.9, 500., 0.22).x*0.55*step(1.5, depth)*inside);
  // ---- caves and burrows
  for (int i = 0; i < ${NCAVE}; i++) {
    vec4 C = uCave[i];
    float ry = abs(C.w), dark = step(0., C.w);
    vec2 v = (p - C.xy)/vec2(C.z, ry);
    float a = atan(v.y, v.x + 1e-5);
    float wob = 0.12*sin(a*3. + C.x) + 0.06*sin(a*7. + C.y*0.3);
    float d = (length(v) - 1. - wob)*ry;
    float dCh = d;
    // a burrow's tunnel climbs from its chamber to the surface
    float ty = p.y - C.y;
    float td = abs(p.x - (C.x + C.z*0.55 + ty*0.55 + 0.8*sin(ty*0.5 + C.x)))*0.87 - 0.85;
    float inTun = step(td, dCh)*step(0., ty)*(1. - dark);
    d = mix(min(d, mix(1e3, td, step(0., ty)*step(0.2, depth))), d, dark);
    float m = (1. - smoothstep(-0.5*px, 0.5*px, d))*inside*step(0.2, depth);
    // the dark vault: stalactites, stalagmites, a pool
    float hx = clamp(v.x, -0.98, 0.98);
    float arc = sqrt(1. - hx*hx)*ry;
    float sx = p.x/1.7 + C.x*0.37; float kc = floor(sx); float tw = 1. - 2.*abs(fract(sx) - 0.5);
    float sl = (0.7 + 0.55*arc*h11(kc*1.9 + 2.))*step(0.3, h11(kc + 5.));
    float sg = (0.5 + 0.4*arc*h11(kc*2.3 + 9.))*step(0.45, h11(kc + 8.));
    float fromRoof = (C.y + arc) - p.y, fromFloor = p.y - (C.y - arc);
    float form = max((sl*tw - fromRoof)/sqrt(1. + 1.4*sl*sl), (sg*tw - fromFloor)/sqrt(1. + 1.4*sg*sg));
    float inForm = smoothstep(-0.5*px, 0.5*px, form);
    float pool = step(p.y, C.y - 0.55*ry)*(1. - inForm);
    float vault = max(hatch(length(v)*ry + 0.7*vnoise(p*0.5), px, 0.55, 80., 0.7).x, hatch(p.x*0.7 - p.y, fpt, 0.7, 80., 0.4).x*0.6);
    float ripple = lineAA((fract(p.y/0.7) - 0.5)*0.7, fy, 0.5)*step(0.5, fract(p.x/3. + h11(floor(p.y/0.7)) + uTime*0.15))*nearP;
    float formInk = max(lineAA(form, px, 0.9), lineAA((fract(sx*4.) - 0.5)*0.42, fx, 0.45)*0.45*nearP);
    float inkD = mix(mix(vault, ripple*0.75, pool), formInk, inForm);
    vec3 tintD = mix(mix(vec3(0.24, 0.3, 0.42), mix(vec3(1.), uShade, 0.9), pool), mix(vec3(1.), uGambP, 0.2), inForm);
    // the burrow (round 4): a hollow in the earth and engraved as one, never a blank: arcs that follow its wall, closest
    // and crossed under the roof, an umber wash that pools there, a floor of straw left pale and strewn with dry strokes;
    // the tunnel is ringed across like a shaft in shade
    float roof = smoothstep(-0.35, 0.75, v.y);
    float wallK = 1. - smoothstep(0.3, 2.4, -dCh);
    float toneB = clamp(0.2 + 0.5*roof + 0.3*wallK, 0., 0.92);
    float arcsB = hatch(dCh + 0.35*vnoise(p*0.7), px, 0.34, 30., toneB).x;
    float crossB = hatch(p.x*0.7 + p.y, fsh, 0.5, 30., toneB).x*smoothstep(0.45, 0.8, toneB);
    float straw = step(v.y, -0.38 + 0.1*sin(p.x*1.3 + C.x));
    float nest = hatch(p.x*0.35 + p.y, fx*0.35 + fy, 0.35, 20., 0.3).x*step(0.4, vnoise(p*vec2(1.4, 3.)));
    float ringT = hatch(ty + 0.5*(p.x - C.x), fy + 0.5*fx, 0.4, 30., 0.62).x;
    float inkL = mix(mix(1. - (1. - arcsB)*(1. - crossB*0.8), nest*0.75, straw), ringT*0.85, inTun);
    vec3 tintL = mix(mix(uSoil*mix(vec3(1.), uHalf, 0.25 + 0.4*roof), mix(vec3(1.), uGambP, 0.55), straw), uSoil*mix(vec3(1.), uHalf, 0.5), inTun);
    float rim = dotGrid(p/0.33, 0.7)*(1. - smoothstep(0.2, 1.5, d))*step(0., d)*nearP*(1. - dark);
    ink = mix(ink, mix(inkL, inkD, dark), m);
    vermA *= 1. - m; gambA *= 1. - m;
    tint = mix(tint, mix(tintL, tintD, dark), m); tintK = mix(tintK, 1., m);
    ink = max(ink, max(lineAA(d, px, 0.9 + 0.6*dark)*step(0.2, depth)*inside, rim*0.8));
  }
  // ---- the tapir's ledge: a strip of blank paper climbing out of its box, ruled below, ticked like a ground line
  float lx = p.x - uLedge.x;
  float ly = (p.y - uLedge.y - lx*uLedge.z)*0.9;
  float lon = step(0., lx)*step(lx, uLedge.w)*inside;
  float strip = lon*step(0., ly)*(1. - smoothstep(4.3, 4.6, ly))*(1. - smoothstep(uLedge.w - 6., uLedge.w, lx));
  ink *= 1. - strip; tintK *= 1. - strip; vermA *= 1. - strip; gambA *= 1. - strip;
  float fl2 = fy + fx*abs(uLedge.z);
  ink = max(ink, max(lineAA(ly, fl2, 1.0), lineAA(ly - 4.45, fl2, 0.5)*0.6)*lon);
  float ltk = lineAA((fract(lx/0.5) - 0.5)*0.5 + ly*0.6, fx + fy, 0.5)*step(ly, 0.)*step(-0.3 - 0.5*h11(floor(lx/0.5)), ly);
  ink = max(ink, ltk*lon*0.8*(1. - smoothstep(0.1, 0.3, px)));
  // ---- condor shadows: hatched patches
  for (int i = 0; i < 2; i++) {
    vec2 sq = p - uShadow[i].xy; sq = vec2(sq.x*0.82 + sq.y*0.57, -sq.x*0.57 + sq.y*0.82);
    float d = length(sq*vec2(1., 3.2))/max(uShadow[i].z, 0.01);
    float m = (1. - smoothstep(0.75, 1.05, d))*uShadow[i].w*inside;
    ink = max(ink, m*hatch(p.x + p.y, fsh, 0.5, 40., 0.6).x);
  }
  // ---- the plates: inside a double rule a little picture ground (a line of turf, a ruled sky), a caption under each
  float capM = 0.;
  float skyRule = hatchL(p.y, fy, 0.45, 1e9, 0.1, -3.).x;
  for (int i = 0; i < ${NBOX}; i++) {
    vec4 B = uBox[i];
    vec2 bq = abs(p - B.xy) - B.zw;
    float d = max(bq.x, bq.y);
    float keep = smoothstep(-0.2, 0.3, d), inB = 1. - keep;
    float base = B.y - B.w*0.72, by = (p.y - (B.y - B.w))/max(2.*B.w, 0.1);
    float turf = step(p.y, base);
    float gtk = lineAA((fract(p.x/0.5) - 0.5)*0.5 + (p.y - base)*0.4, fx + fy, 0.5)*turf*step(base - 0.3 - 0.5*h11(floor(p.x/0.5) + B.x), p.y)*nearP;
    float skyK = smoothstep(0.45, 1., by);
    ink = mix(ink, max(gtk*0.8, skyRule*skyK*0.3), inB); vermA *= keep; gambA *= keep;
    tint = mix(tint, mix(mix(vec3(1.), uShade, 0.34*skyK), mix(vec3(1.), uSoil, 0.7), turf), inB); tintK = mix(tintK, 1., inB);
    float fb = bq.x > bq.y ? fx : fy;
    ink = max(ink, max(lineAA(d, fb, 1.3), lineAA(d + 0.45, fb, 0.5)));
    // baseline rule inside the box: the altitude rule the specimen stands on
    ink = max(ink, lineAA(p.y - base, fy, 0.6)*step(d, 0.)*0.7);
    vec2 cq = abs(p - vec2(B.x, B.y - B.w - 1.55)) - vec2(B.z, 1.05);
    capM = max(capM, (1. - smoothstep(-0.1, 0.2, max(cq.x, cq.y)))*step(0.1, B.z));
  }
  capM *= inside;
  ink = mix(ink, script((p + vec2(3.3, 0.45))/0.72, fx/0.72, fy/0.72)*0.9, capM);
  tintK *= 1. - capM; vermA *= 1. - capM; gambA *= 1. - capM;
  // ---- waterfalls, drawn in line (round 4): a narrow ribbon under a thin verditer wash, close flow lines with travelling
  // dashes, two firm drawn edges (the one away from the sun doubled and shaded), stipple where the water strikes a ledge
  for (int i = 0; i < 3; i++) {
    vec4 F = uFall[i];
    float hwf = max(F.w*(0.5 + 0.28*clamp((F.y - p.y)/max(F.y - F.z, 1.), 0., 1.)), 1.6*fx);
    float du = p.x - F.x - 0.9*sin(p.y*0.11 + F.x);
    float on = step(F.z, p.y)*step(p.y, F.y + 1.5);
    float m = (1. - smoothstep(hwf, hwf + 0.5*px + 0.2, abs(du)))*on;
    float lee = smoothstep(0.2, 0.85, du/hwf);
    ink *= 1. - m; vermA *= 1. - m; gambA *= 1. - m;
    tint = mix(tint, mix(vec3(1.), uShade, 0.45 + 0.35*lee), m); tintK = mix(tintK, 0.92, m);
    float t = du/hwf*3.5;
    float k = floor(t + 0.5);
    float lpx = abs(t - k)*hwf/3.5/fx;
    float nearLines = (1. - smoothstep(0.3, 0.9, fx/hwf*3.5));
    float sp = 11. + 5.*h11(k + F.x);
    float dash = step(0.3, fract((p.y + uTime*sp)/(7. + 4.*h11(k*3.1 + F.x)) + h11(k + 9.)));
    float lines = (1. - smoothstep(0.45, 1.2, lpx))*dash*nearLines;
    float shadeF = hatch(du*0.8 + p.y*0.25, fx*0.8 + fy*0.25, 0.22, 20., 0.5).x*lee*nearLines;
    float edge = 1. - smoothstep(0.7, 1.7, abs(abs(du) - hwf)/fx);
    float edge2 = (1. - smoothstep(0.4, 1.1, abs(du - hwf - 0.45)/fx))*step(0.3, fract((p.y + uTime*13.)/9.))*nearLines;
    ink = max(ink, max(max(lines*0.8, shadeF*0.7)*m, max(edge, edge2*0.7)*on));
    // rising stipple at the foot and at each ledge the water strikes on its way down
    float lk = floor((F.y - p.y)/43. + 0.3);
    float ly2 = (F.y - p.y) - (lk + 0.7)*43.;
    vec2 lq = vec2(du, ly2)/vec2(hwf*2.6, hwf*1.9);
    vec2 sq = (p - vec2(F.x, F.z))/vec2(hwf*3.2, hwf*2.6);
    float mound = max(1. - smoothstep(0.5, 1., length(sq)), (1. - smoothstep(0.4, 1., length(lq)))*step(0.5, lk + 1.)*step(F.z + 20., p.y));
    vec2 dg = vec2(p.x, p.y - uTime*1.6)/0.8; vec2 di = floor(dg);
    float dd = length(fract(dg) - 0.5 - 0.3*(vec2(h21(di), h21(di + 7.)) - 0.5));
    float spray = (1. - smoothstep(0.1, 0.2, dd))*step(h21(di + 2.), mound)*(1. - smoothstep(0.2, 0.5, px));
    ink = mix(ink, spray*0.8, mound*step(F.z, p.y + 0.01)*step(0.1, mound)*inside*on);
  }
  // ---- the fringed top edge and the section's ground line
  float fid = floor(p.x/0.38); float fh = h11(fid);
  float flen = 0.5 + 3.2*fh*fh;
  float fl = lineAA((fract(p.x/0.38) - 0.5)*0.38 + 0.08*sin(depth*2. + fh*6.), fx, 0.55)*step(depth, flen);
  float fringe = mix(fl, step(depth, 1.3)*0.55, smoothstep(0.12, 0.3, fx));
  ink = max(ink, fringe*inside);
  ink = max(ink, lineAA(depth - 0.3, fd, 1.3)*inside);
  // passionflowers on the edge
  vec2 pf = p - uFlower.xy;
  vec2 pg = pf/1.3; vec2 pid = floor(pg);
  vec2 pc = fract(pg) - 0.5 - 0.3*(vec2(h21(pid + 1.), h21(pid + 4.)) - 0.5);
  float petal = 0.22 + 0.07*cos(atan(pc.y, pc.x + 1e-4)*5.);
  float fm = step(length(pf*vec2(1., 2.2)), uFlower.z)*step(0.45, h21(pid + 8.))*step(0.3, depth)*(1. - smoothstep(0.3, 0.8, px));
  float flw = (1. - smoothstep(petal - 0.03, petal + 0.03, length(pc)))*fm;
  vermA = max(vermA, flw);
  ink = max(ink*(1. - flw), lineAA(length(pc) - petal, px/1.3, 0.5)*fm);
  // ---- compose
  float fox = foxing(p);
  vec3 paperTint = vec3(1.) - fibre(p, px) - fox*0.2*vec3(0.25, 0.5, 0.85);
  float below0 = 1. - inside;                       // the riser under the plain: plain paper
  ink *= 1. - below0;
  // (round 4) seen whole from the palm valley the beds take a second pass of the same wash, so the section keeps its colour small
  tint = mix(tint, tint*tint, 0.8*smoothstep(170., 430., vDist));
  vec3 col = uPaper*paperTint*mix(vec3(1.), tint, clamp(tintK, 0., 1.)*inside);
  col = mix(col, uVerm*vec3(1.3, 1.5, 1.2)*(0.9 + 0.1*paperTint), clamp(vermA, 0., 1.)*inside);
  col = mix(col, uGambP*vec3(1.25, 1.3, 1.0), clamp(gambA, 0., 1.)*inside);
  vec3 inkc = mix(uInk, uHalf, smoothstep(150., 700., vDist));
  col = mix(col, inkc, clamp(ink, 0., 1.));
  ${FRAG_END}
}`;

const PLAIN_FRAG = /* glsl */ `
varying vec3 vPos; varying float vTop; varying float vDist;
${PLATE_COMMON}
${PAGE_LIB}
${FOG_F}
void main(){
  vec2 p = vPos.xz;
  vec2 fw2 = fwidth(p);
  float fx = max(fw2.x, 1e-5), fz = max(fw2.y, 1e-5), px = max(fx, fz);
  float r = length(p);
  // ledger ruling of the plain, a plate mark, and a soft ruled shadow line at the foot of the page
  float ink = hatchL(p.x, fx, 20., 1e9, 0.1, 0.).x*0.5;
  ink = max(ink, hatchL(p.y, fz, 100., 1e9, 0.1, 0.).x*0.35);
  vec2 pm = abs(p - vec2(560., 0.)) - vec2(520., 1010.);
  float dpm = max(pm.x, pm.y);
  ink = max(ink, max(lineAA(dpm, px, 1.0), lineAA(dpm + 6., px, 0.5)*0.7));
  ink = max(ink, script(vec2(-p.y, p.x - 30.)/5., fz/5., fx/5.)*step(p.x, 110.)*step(40., p.x)*step(abs(p.y), 700.));
  ink *= 1. - smoothstep(1100., 1240., r);
  vec3 paperTint = vec3(1.) - fibre(p, px) - foxing(p + 300.)*0.2*vec3(0.25, 0.5, 0.85);
  vec3 col = uPaper*paperTint;
  vec3 inkc = mix(uInk, uHalf, smoothstep(150., 700., vDist));
  col = mix(col, inkc, clamp(ink, 0., 1.));
  ${FRAG_END}
}`;

// ---------------------------------------------------------------- geometry of ground, page and plain
function ringRadii() {
  const NR = 118, NI = 26, rr = [];
  for (let i = 0; i <= NR; i++) rr.push(i <= NI ? 124 * (i / NI) : 124 + (APRON - 124) * Math.pow((i - NI) / (NR - NI), 1.15));
  // (round 12) the ground is finer through the lip, the two horns and the notch: a ring every 2 m from 20 to 84 m out from
  // the axis (the horns are 7 m across at half height; rings 4.8 m apart cut them into a few long facets), paid for on the
  // flat apron beyond 900 m, where every other ring goes
  const out = [];
  for (const r of rr) {
    if (r > 19 && r < 86) continue;
    if (r > 900 && r < APRON - 1 && r - out[out.length - 1] < 22) continue;
    out.push(r);
  }
  for (let r = 20; r < 84.5; r += 2) out.push(r);
  return out.sort((a, b) => a - b);
}

async function buildGround(ctx, HF, rr, sun) {
  const NA = 166, NR = rr.length - 1, nv = (NR + 1) * (NA + 1);
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), idx = new Uint32Array(NR * NA * 6);
  // (round 12) aTone: what the forest ground's tone is chosen from besides the sun. x: how far the ground lies in a hollow
  // (the mean height 14 m round it, less its own; the barrancas are 30 to 110 m across); y: how thickly the forest's
  // crowns stand over it (filled in by the hero once they are scattered); z: how far the ground is turned from the sun,
  // measured against the lie of the flank round it (below). Only where the forest can be (330 to 900 m out).
  const tone = new Float32Array(nv * 3), HD = 14;
  let k = 0;
  for (let i = 0; i <= NR; i++) {
    const r = rr[i];
    for (let j = 0; j <= NA; j++) {
      const s = (j / NA) * 2 - 1, as = Math.abs(s);
      const th = (Math.PI / 2) * (0.6 * s + 0.4 * Math.sign(s) * (1 - (1 - as) * (1 - as)));
      const seam = j === 0 || j === NA;
      const x = seam ? 0 : -r * Math.cos(th), z = seam ? r * Math.sign(s) : r * Math.sin(th);
      let y = HF.heightAt(x, z);
      if (r > 330 && r < 900 && y < 215) {
        const xm = Math.min(x, -0.5), lap = (HF.heightAt(Math.min(xm + HD, -0.2), z) + HF.heightAt(xm - HD, z) + HF.heightAt(xm, z + HD) + HF.heightAt(xm, z - HD)) / 4 - HF.heightAt(xm, z);
        tone[k] = smoothstep(0.35, 2.4, lap);
      }
      if (seam) y = Math.max(y, 0.3);
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; k += 3;
    }
    if (i % 2 === 0) await ctx.yield();
  }
  await ctx.yield();
  // normals from the grid itself (one height sample per vertex)
  const W = NA + 1;
  for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) {
    const a = (i * W + Math.max(j - 1, 0)) * 3, b = (i * W + Math.min(j + 1, NA)) * 3;
    const c = (Math.max(i - 1, 0) * W + j) * 3, d = (Math.min(i + 1, NR) * W + j) * 3, o = (i * W + j) * 3;
    const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2];
    const bx = pos[d] - pos[c], by = pos[d + 1] - pos[c + 1], bz = pos[d + 2] - pos[c + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-6) { nx = 0; ny = 1; nz = 0; } else { const sgn = ny < 0 ? -1 / l : 1 / l; nx *= sgn; ny *= sgn; nz *= sgn; }
    nrm[o] = nx; nrm[o + 1] = ny; nrm[o + 2] = nz;
  }
  await ctx.yield();
  // (round 12) which ground of the forest faces the sun and which is turned from it is told by the folds of the flank,
  // not by the flank's own bearing: a corner's lie toward the sun is set against the mean lie of the ground four corners
  // round it each way (some 45 m: the width of half a barranca, so that one wall of a fold is light and the other shaded).
  // Turned by 0.08 and more of the sun's cosine it is wholly in shade: a quarter of the forest ground is, on every bearing
  // of the sun, and somewhat under half is turned at all.
  for (let i = 0; i <= NR; i++) {
    if (rr[i] < 330 || rr[i] > 900) continue;
    for (let j = 0; j <= NA; j++) {
      const o = (i * W + j) * 3;
      if (pos[o + 1] > 215) continue;
      let sx = 0, sy = 0, sz = 0;
      for (let a = Math.max(i - 4, 0); a <= Math.min(i + 4, NR); a++) for (let b = Math.max(j - 4, 0); b <= Math.min(j + 4, NA); b++) { const q = (a * W + b) * 3; sx += nrm[q]; sy += nrm[q + 1]; sz += nrm[q + 2]; }
      const l = Math.hypot(sx, sy, sz) || 1;
      tone[o + 2] = smoothstep(0, 0.08, (sx * sun.x + sy * sun.y + sz * sun.z) / l - (nrm[o] * sun.x + nrm[o + 1] * sun.y + nrm[o + 2] * sun.z));
    }
    if (i % 8 === 0) await ctx.yield();
  }
  k = 0;
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('aTone', new THREE.BufferAttribute(tone, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

function buildPage(HF, rr) {
  // columns sit exactly on the ground's seam vertices so the fringed top edge never cracks
  const zs = [];
  for (let i = rr.length - 1; i > 0; i--) zs.push(rr[i]);
  for (let i = 0; i < rr.length; i++) zs.push(-rr[i]);
  const n = zs.length, pos = new Float32Array(n * 6), top = new Float32Array(n * 2), idx = [];
  for (let i = 0; i < n; i++) {
    const z = zs[i], t = Math.max(HF.heightAt(0, z), 0.3);
    pos.set([0, -14, z, 0, t, z], i * 6); top[i * 2] = t; top[i * 2 + 1] = t;
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTop', new THREE.BufferAttribute(top, 1));
  g.setIndex(idx);
  return g;
}

function buildPlain() {
  const N = 64, pos = [0, 0, 0], idx = [], top = [0];
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI; pos.push(Math.sin(a) * APRON, 0, Math.cos(a) * APRON); top.push(0); }
  for (let i = 1; i <= N; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTop', new THREE.Float32BufferAttribute(top, 1));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the camera line
function makeFlyThrough(HF) {
  const H = (z) => HF.heightAt(0, z);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const g = (x, z, up) => V(x, HF.heightAt(Math.min(x, 0), z) + up, z);
  const c22 = Math.cos(PITCH), s22 = Math.sin(PITCH), RUN = 62;
  const end = V(NOTCH_X, 440, R0), start = V(NOTCH_X, 440 - RUN * s22, R0 + RUN * c22);
  const yEdge = Math.max(H(694) + 11, HF.heightAt(-15, 713) + 13);
  // the run along the page: one even climb between its two ends, never nearer than 8 m under the edge
  const yA = Math.max(H(622) - 10, yEdge + 3), yB = Math.max(H(458) - 11, yA + 40);
  const pageY = (z) => Math.max(yEdge + 3, Math.min(lerp(yA, yB, (622 - z) / 164), H(z) - 8));
  // (round 4) the entry stands further east and heads north-north-west, so that the first picture looks at the cut face
  // nearly square on: the banded section fills the middle of the frame from the seam foot to the summit, the lava
  // stream comes down the flank above its edge, and the palms part either side of it. NEW counts the entry points.
  const E0 = V(128, 26, 950), ED = V(-0.485, 0, -0.875).normalize(), NEW = 4;
  const pts = [
    // the palm aisle, level at 26 m: 70 m straight, then round to the west over the corner of the plain
    E0, E0.clone().addScaledVector(ED, 34), E0.clone().addScaledVector(ED, 70), V(54, 26.5, 861),
    // one climbing curve west over the living flank and back north-east
    g(-16, 826, 20), g(-41, 784, 19), g(-38, 744, 19), V(-15, yEdge, 713),
    // out over the cut edge and north along the page, 17 m off it, climbing with its fringed top 8 to 14 m above us:
    // the forest edge, its roots and vines stay in the upper part of the frame and the section lies at eye level
    // (round 3: the run stands off 21 to 27 m so that the section is read as a diagram, not grazed; then it swings out
    // to 50 m over the drop and turns back in toward the face, which is then seen square on with all its detail)
    V(4, yEdge + 1, 694), V(15, yEdge + 2, 664), V(21, pageY(622), 622),
    V(24, pageY(585), 585), V(26, pageY(545), 545), V(31, pageY(505), 505), V(43, Math.max(H(468) - 9, pageY(505) + 12), 468),
    // up past the fringed edge and out over the paper drop, so that the whole upper cone stands in
    // profile; then back across the knife crest and up its living side, the herd between us and the precipice
    V(50, H(431) - 3, 431), V(34, H(392) + 5, 392), V(22, H(360) + 10, 360), V(1, H(326) + 11, 326),
    g(-13, 290, 10), g(-15, 244, 10), g(-12, 196, 11), g(-9, 154, 14), V(-11, Math.max(HF.heightAt(-11, 127) + 10, start.y - 17), 127),
    // the last 62 m straight at 22 degrees into the notch
    start, start.clone().lerp(end, 0.5), end,
  ];
  // the page section never dips: each point at least as high as the one before
  for (let i = NEW + 5; i < pts.length - 3; i++) pts[i].y = Math.max(pts[i].y, pts[i - 1].y + 0.5);
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.arcLengthDivisions = Math.max(400, pts.length * 60);
  let samples = curve.getSpacedPoints(300);
  // clearance asserted at build: a control point is lifted once per pass by the worst deficit among the
  // samples nearest to it (8 m over the living ground)
  for (let pass = 0; pass < 3; pass++) {
    const lift = new Float32Array(pts.length); let bad = false;
    for (const q of samples) {
      if (q.x > 0.5) continue;
      const def = 8 - (q.y - HF.heightAt(q.x, q.z));
      if (def <= 0) continue;
      let bi = 0, bd = 1e9;
      for (let i = 1; i < pts.length - 3; i++) { const d = pts[i].distanceToSquared(q); if (d < bd) { bd = d; bi = i; } }
      if (bi > 0) { lift[bi] = Math.max(lift[bi], def + 0.5); bad = true; }
    }
    if (!bad) break;
    for (let i = 1; i < pts.length - 3; i++) pts[i].y += lift[i];
    curve.updateArcLengths(); samples = curve.getSpacedPoints(300);
  }
  // Everything staged on this line was keyed to u along the line as it was before round 4, whose first leg was shorter.
  // 'Legacy u' is u along that older line: the two agree in place from the first point on the flank (pts[NEW]) onward,
  // and the entry leg is mapped linearly. toLegacy(u) and fromLegacy(uL) convert; Lold is the older line's length.
  const lenTo = (P, k) => { const c = new THREE.CatmullRomCurve3(P, false, 'centripetal'), a = c.getLengths((P.length - 1) * 40); return a[k * 40]; };
  const D0 = lenTo(pts, NEW), D0old = lenTo([V(60, 26, 970), V(46, 26, 913), V(24, 27.5, 868)].concat(pts.slice(NEW)), 3);
  const length = curve.getLength(), Lold = length - D0 + D0old;
  const toLegacy = (u) => { const d = u * length; return d >= D0 ? (d - D0 + D0old) / Lold : (d * D0old) / (D0 * Lold); };
  const fromLegacy = (uL) => { const d = uL * Lold; return d >= D0old ? (d - D0old + D0) / length : (d * D0) / (D0old * length); };
  return { pts, samples, start, end, length, Lold, toLegacy, fromLegacy };
}

// ---------------------------------------------------------------- a small mesh accumulator for plants
function makeAcc() { return { pos: [], nrm: [], uv: [], col: [], info: [], edge: [], wide: [], idx: [], n: 0 }; }
function vtx(A, p, n, u, v, col, tone, sway, maxP, kind = 0, edge = 0, w = null) {
  A.pos.push(p[0], p[1], p[2]); A.nrm.push(n[0], n[1], n[2]); A.uv.push(u, v); A.col.push(col.r, col.g, col.b);
  A.info.push(tone, sway, maxP, kind); A.edge.push(edge);
  if (w) A.wide.push(w[0], w[1], w[2]); else A.wide.push(0, 0, 0);
  return A.n++;
}
function accGeometry(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(A.nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(A.col, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(A.info, 4));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(A.edge, 1));
  g.setAttribute('aWide', new THREE.Float32BufferAttribute(A.wide, 3));
  g.setIndex(A.idx);
  return g;
}
// tube along +Y-ish: centre(t) -> [x,y,z], rad(t); rings hatch along v = height
function accTube(A, centre, rad, sides, segs, col, tone, sway, maxP, thin) {
  const base = A.n;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = centre(t), r = rad(t);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a);
      vtx(A, [c[0] + cx * r, c[1], c[2] + cz * r], [cx, 0.08, cz], a * Math.max(r, 0.2), c[1], col, tone, sway * t, maxP, 0, 0, thin ? [cx * r, 0, cz * r] : null);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * (sides + 1) + j, b = a + 1, c = a + sides + 1, d = c + 1;
    A.idx.push(a, c, b, b, c, d);
  }
}
// ribbon through pts with half-widths; `side` is the direction of the width
// kind: 1 a plain blade, 3 a feather (barbs), 6 half a pinnate frond (rachis on its -1 edge), 7 a whole pinnate frond
function accRibbon(A, pts, hw, side, col, tone, sway0, sway1, maxP, uvs = 1, kind = 1) {
  const base = A.n; let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    if (i > 0) len += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
    const tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2];
    let nx = side[1] * tz - side[2] * ty, ny = side[2] * tx - side[0] * tz, nz = side[0] * ty - side[1] * tx;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const w = hw[i], t = i / (pts.length - 1), sw = sway0 + (sway1 - sway0) * t;
    vtx(A, [p[0] - side[0] * w, p[1] - side[1] * w, p[2] - side[2] * w], [nx, ny, nz], -w * uvs, len * uvs, col, tone, sw, maxP, kind, -1);
    vtx(A, [p[0] + side[0] * w, p[1] + side[1] * w, p[2] + side[2] * w], [nx, ny, nz], w * uvs, len * uvs, col, tone, sw, maxP, kind, 1);
  }
  for (let i = 0; i < pts.length - 1; i++) { const a = base + i * 2; A.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
}
// lumpy dome: contour hatch along v = height
function accDome(A, rx, ry, sides, rings, lump, rng, col, tone, maxP, sway, kind = 0) {
  const base = A.n, lp = [];
  for (let j = 0; j < sides; j++) lp.push(1 + lump * (rng() - 0.5) * 2);
  for (let i = 0; i < rings; i++) {
    const e = (i / rings) * Math.PI * 0.5, ce = Math.cos(e), se = Math.sin(e);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * Math.PI * 2 + i * 0.35, l = lp[j % sides] * (1 + (i % 2 ? lump * 0.5 : 0));
      const x = Math.cos(a) * ce * rx * l, z = Math.sin(a) * ce * rx * l, y = se * ry * (0.9 + 0.2 * lp[(j + i) % sides]);
      vtx(A, [x, y, z], [Math.cos(a) * ce, se * 0.9 + 0.1, Math.sin(a) * ce], a * rx, y, col, tone, sway * se, maxP, kind);
    }
  }
  const topI = vtx(A, [0, ry * 1.02, 0], [0, 1, 0], 0, ry, col, tone, sway, maxP, kind);
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * (sides + 1) + j, b = a + 1, c = a + sides + 1, d = c + 1;
    A.idx.push(a, c, b, b, c, d);
  }
  const lr = base + (rings - 1) * (sides + 1);
  for (let j = 0; j < sides; j++) A.idx.push(lr + j, topI, lr + j + 1);
}

// ---------------------------------------------------------------- plants: one instanced 'plate' material
const PLANT_VERT = /* glsl */ `
attribute vec3 aCol; attribute vec4 aInfo; attribute float aEdge; attribute vec3 aWide; attribute vec4 aInst;
uniform float uTime, uResY; uniform vec2 uWind; uniform vec2 uGrow;
varying vec2 vUv; varying vec3 vCol; varying vec3 vN; varying vec3 vNv; varying vec3 vVp; varying vec4 vInfo;
varying float vEdge; varying float vDist; varying float vTone; varying float vSnow;
${FOG_V}
void main(){
  float isDrift = step(4.2, aInfo.w)*step(aInfo.w, 4.5);            // a rock's snowdrift is folded away where no snow lies
  // (round 12) uGrow: the size of every plant of this material (x), and of those marked aInst.w = -1 (y), as a share of
  // its own: each grows from, or shrinks to, the point it stands on (the hero's growth uniforms; 1 where nothing grows)
  float gk = aInst.w < -0.5 ? uGrow.y : uGrow.x;
  vec4 wp = instanceMatrix*vec4(position*mix(1., aInst.w, isDrift)*gk, 1.);
  float g = sin(uTime*1.1 + wp.x*0.045 + wp.z*0.03 + aInst.y)*(0.6 + 0.4*sin(uTime*0.37 + wp.z*0.011))
          + 0.25*sin(uTime*3.1 + aInst.y*7. + position.y);
  wp.xz += uWind*g*aInfo.y;
  wp.y -= abs(g)*aInfo.y*0.12;
  vec4 mvPosition = modelViewMatrix*wp;
  float dist = length(mvPosition.xyz);
  mat3 im = mat3(instanceMatrix);
  vec3 wv = im*aWide*gk; float wl = length(wv);
  if (wl > 1e-5) {
    float pxm = dist*2.0/(projectionMatrix[1][1]*uResY);
    mvPosition.xyz += mat3(modelViewMatrix)*wv*(max(1., 0.8*pxm/wl) - 1.);
  }
  vN = im*normal; vNv = mat3(modelViewMatrix)*vN; vVp = mvPosition.xyz;
  // (round 12) aInst.z: 0..1 thins the wash toward paper; under 0 it turns the plant's own green, toward gamboge down to
  // -1 and toward verditer from -1 to -2, so that plants of one mesh are not all one green
  vec3 hueC = aInst.z < -1. ? mix(aCol, aCol*vec3(0.8, 0.98, 1.1), clamp(-aInst.z - 1., 0., 1.)) : mix(aCol, aCol*vec3(1.1, 1.02, 0.66), clamp(-aInst.z, 0., 1.));
  vUv = uv; vCol = aInst.z >= 0. ? mix(aCol, vec3(1.), aInst.z) : hueC; vInfo = aInfo; vEdge = aEdge; vDist = dist; vTone = aInst.x; vSnow = max(aInst.w, 0.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

// One fragment shader for every plant and animal. vInfo.w is the kind of surface:
//   0 solid (trunks, boughs, bodies): rings, then a second and a third direction as it darkens
//   1 blade   3 feather: a midrib, an outline and strokes slanting one way only (never a grid)
//   2 foliage: rows of small arcs      4 rock: contour and one diagonal, snow lying on what faces up (vSnow)
//   5 coat: broken strokes along the body      6, 7 pinnate frond (half, whole): near the camera the ribbon is
//   cut into leaflets, each with its outline and midvein; far off it falls back to the slanting strokes
const PLANT_FRAG = /* glsl */ `
varying vec2 vUv; varying vec3 vCol; varying vec3 vN; varying vec3 vNv; varying vec3 vVp; varying vec4 vInfo;
varying float vEdge; varying float vDist; varying float vTone; varying float vSnow;
uniform float uFarTint;
${PLATE_COMMON}
${FOG_F}
void main(){
  float ff = gl_FrontFacing ? 1. : -1.;
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.))*ff;
  vec3 nv = normalize(vNv + vec3(0., 0., 1e-4))*ff;
  float ndl = clamp(dot(n, uSun), 0., 1.);
  float shade = 1. - smoothstep(0.15, 0.85, ndl);
  float kind = vInfo.w;
  float isBlade = step(0.5, kind)*step(kind, 1.5), isFol = step(1.5, kind)*step(kind, 2.5), isFea = step(2.5, kind)*step(kind, 3.5);
  float isRock = step(3.5, kind)*step(kind, 4.5), isFur = step(4.5, kind)*step(kind, 5.5), isHalfF = step(5.5, kind)*step(kind, 6.5);
  float isFrond = step(5.5, kind), thinK = max(max(isBlade, isFea), isFrond);
  // every derivative is taken here, before anything is discarded
  float fu = fwidth(vUv.x), fv = fwidth(vUv.y), fc = fwidth(vUv.x + vUv.y), fe = max(fwidth(vEdge), 1e-5);
  float across = mix(abs(vEdge), 0.5*(vEdge + 1.), isHalfF);        // 0 on the midrib or rachis, 1 on the margin
  float fa = fe*mix(1., 0.5, isHalfF);
  float slant = mix(0.8, 0.45, isFea);
  float cL = vUv.y - slant*across;
  float fL = max(fv + slant*fa, 1e-6);
  // snow lies on whatever faces up (rocks only)
  float cap = smoothstep(0.52, 0.72, n.y + 0.3*(vnoise(vUv*1.7 + 3.) - 0.5))*vSnow*isRock;
  cap = max(cap, step(4.2, kind)*isRock*vSnow);
  float tone = vInfo.x + vTone + shade*mix(0.42, 0.18, thinK) + isFol*(1. - smoothstep(-0.5, 0.15, n.y))*0.3;
  tone = mix(tone, mix(vInfo.x + vTone + 0.15 + shade*0.45, 0.05, cap), isRock);
  tone = clamp(tone, 0., 1.);
  vec2 hA = hatch(vUv.y, fv, 0.3, vInfo.z, tone);
  vec2 hB = hatch(vUv.x, fu, 0.3, vInfo.z, tone);
  vec2 hC = hatch(vUv.x + vUv.y, fc, 0.3, vInfo.z, tone);
  vec2 hL = hatch(cL, fL, 0.3, vInfo.z, tone);
  float lA = smoothstep(0.1, 0.3, tone), lB = smoothstep(0.45, 0.65, tone), lC = smoothstep(0.75, 0.92, tone);
  float brk = step(0.4, vnoise(vUv*vec2(4., 1.3)));
  float ink = 1. - (1. - hA.x*lA)*(1. - hB.x*lB*brk)*(1. - hC.x*lC*0.75);
  // rock: contours and one diagonal on the dark side, a few strokes on the snow
  float rockInk = 1. - (1. - hA.x*lA)*(1. - hC.x*smoothstep(0.5, 0.7, tone)*0.85);
  ink = mix(ink, rockInk, isRock);
  // coat: strokes that run along the body, broken into hairs
  float hair = step(0.4, vnoise(vec2(vUv.x*8., vUv.y*2.6)));
  ink = mix(ink, hB.x*smoothstep(0.05, 0.25, tone)*hair, isFur);
  // blades and feathers
  float narrow = smoothstep(0.3, 0.8, fe)*(1. - smoothstep(0.2, 0.4, tone));   // a pale leaf a few pixels wide keeps its paper
  float midrib = lineAA(across, fa, mix(1.0, 0.75, isFea))*(1. - narrow);
  float margin = lineAA(1. - abs(vEdge), fe, 1.1)*(1. - 0.7*narrow);
  float thinInk = max(max(hL.x*smoothstep(0.03, 0.2, tone), midrib*0.9), margin);
  // pinnate fronds near the camera: leaflets
  float Pl = 0.34;
  float lodF = smoothstep(5., 10., Pl/fL)*isFrond;
  float tl = cL/Pl; float tk = floor(tl + 0.5); float td = abs(tl - tk);
  float lw = mix(0.5, 0.4*(1. - 0.72*across*across), lodF);
  float leafEdge = lineAA((td - lw)*Pl, fL, 0.8)*step(0.07, across);
  float leafVein = lineAA(td*Pl, fL, 0.45)*0.6*step(0.05 + 0.3*h11(tk), across);
  thinInk = mix(thinInk, max(max(leafEdge, leafVein), midrib), lodF);
  ink = mix(ink, thinInk, thinK);
  if (lodF > 0.02 && td > lw && across > 0.09) discard;
  float rim = 1. - abs(dot(nv, normalize(-vVp + vec3(0., 0., 1e-5))));
  ink = max(ink, smoothstep(0.7, 0.88, rim)*(1. - thinK)*(0.9 - 0.5*isFol));
  // foliage: rows of small arcs, the engraver's leaf masses; near the camera the outline of a mass breaks into leaves
  vec2 sg = vUv/0.8 + vec2(0., 0.31*sin(vUv.x*1.9)); sg.x += 0.5*floor(sg.y);
  vec2 sc = fract(sg) - vec2(0.5, 0.12 + 0.2*h21(floor(sg)));
  float sd = (length(sc) - 0.43)*0.8;
  float fuv = max(fu, fv);
  float folNear = isFol*(1. - smoothstep(0.05, 0.14, fuv));
  if (folNear > 0.5 && rim > 0.6 + 0.22*h21(floor(sg) + 3.) && sd > -0.03) discard;
  float arcs = lineAA(sd, fuv, 0.4 + 0.35*tone)*max(step(0.0, sc.y), folNear*smoothstep(0.55, 0.7, rim))*(1. - smoothstep(0.1, 0.24, fuv));
  ink = max(ink*(1. - 0.45*isFol), arcs*isFol);
  float wa = seep(vDist, fract(mix(hA.y, hL.y, thinK) + 0.25));
  vec3 wash = vCol*mix(vec3(1.), uShade, shade*0.3);           // shade is a verditer glaze: black stays black
  wash = mix(wash, vec3(1.), cap);
  // beyond the island of watercolour the print keeps one flat tint, the second plate: a thin verditer that sets the far
  // ranks back from the near ones, and their ink thins toward the half-tone with it
  float farK = smoothstep(uWash.x*0.9, uWash.y*1.25, vDist)*uFarTint*(1. - isRock);
  float crownK = max(thinK, isFol);
  vec3 farT = mix(mix(vec3(1.), vCol, 0.5), mix(vec3(1.), uShade, 0.62)*mix(vec3(1.), vCol, 0.55), crownK);
  farT = mix(farT, vec3(1.), 0.4*smoothstep(220., 650., vDist));
  ink *= 1. - 0.12*farK;
  vec3 inkc = mix(uInk, uHalf, max(smoothstep(150., 700., vDist), 0.25*farK));
  vec3 pc = uPaper*mix(vec3(1.), wash, clamp(wa, 0., 1.))*mix(vec3(1.), farT, farK*(1. - cap)*(1. - 0.7*clamp(wa, 0., 1.)));
  vec3 col = mix(pc, inkc, clamp(ink, 0., 1.));
  ${FRAG_END}
}`;

function palmGeometry(rng, S) {
  const A = makeAcc(), trunk = thin(S.pal[2], 0.5), leaf = S.green.clone().multiplyScalar(0.8);
  const lean = rng.range(-1.2, 1.2), H = 50;
  accTube(A, (t) => [lean * t * t, H * t, 0.6 * lean * Math.sin(t * 2.4)], (t) => 0.55 - 0.2 * t + 0.12 * Math.exp(-t * 14), 6, 4, trunk, 0.2, 0.9, 70, true);
  const top = [lean, H, 0.6 * lean * Math.sin(2.4)];
  for (let f = 0; f < 9; f++) {
    const a = (f / 9) * Math.PI * 2 + rng.range(-0.2, 0.2), up = rng.range(0.15, 1.0), L = rng.range(5.6, 7.4);
    const dx = Math.cos(a), dz = Math.sin(a), pts = [], hw = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, out = L * (Math.sin(t * 1.45) / Math.sin(1.45)), y = up * L * 0.55 * t - L * 0.62 * t * t * (1.2 - 0.5 * up);
      pts.push([top[0] + dx * out, top[1] + y + 0.4, top[2] + dz * out]);
      hw.push((0.25 + 1.0 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.12))) * (1 - 0.5 * t));
    }
    accRibbon(A, pts, hw, [-dz, 0, dx], leaf, 0.5, 1.2, 4.5, 26, 1, 7);
  }
  return accGeometry(A);
}
// a patch of cloud-forest canopy in many small leaf masses at staggered heights. near: twenty small masses with a
// trunk, mossy boughs, hanging moss and a tank bromeliad; far: four larger ones
function crownGeometry(rng, S, near) {
  const A = makeAcc(), greens = [S.green.clone().multiplyScalar(0.92), S.green.clone().lerp(S.olive, 0.5), S.green.clone().lerp(S.verd, 0.3)];
  const bark = thin(S.pal[2], 0.6), moss = S.olive.clone().lerp(S.verd, 0.35), lumps = near ? 20 : 4, cs = [];
  for (let k = 0; k < lumps; k++) {
    const n0 = A.n, a = (k / lumps) * 6.283 + rng.range(-0.4, 0.4), d = k === 0 ? 0.6 : rng.range(near ? 1.5 : 2.4, near ? 6.3 : 5);
    const r = near ? rng.range(0.9, 1.6) : rng.range(3.3, 4.8), ox = Math.cos(a) * d, oz = Math.sin(a) * d;
    const oy = near ? rng.range(3.2, 7.8) - d * 0.3 : rng.range(1.6, 4.4) - d * 0.25;
    accDome(A, r, r * (near ? rng.range(0.8, 1.15) : rng.range(0.7, 1.0)), near ? 6 : 5, near && k < 3 ? 3 : 2, 0.3, rng, greens[k % 3], 0.34 + 0.08 * (k % 3), near ? 2.4 : 3.6, 0.8, 2);
    for (let i = n0; i < A.n; i++) { A.pos[i * 3] += ox; A.pos[i * 3 + 1] += oy; A.pos[i * 3 + 2] += oz; A.uv[i * 2] += k * 7.3; }
    cs.push([ox, oy, oz, r]);
  }
  if (near) {
    accTube(A, (t) => [0.3 * Math.sin(t * 3), -2 + 8.5 * t, 0.2 * t], (t) => 0.5 - 0.28 * t, 5, 2, bark, 0.55, 0.1, 30, false);
    for (let b = 0; b < 3; b++) {                         // boughs out to three of the masses, moss on their upper side
      const c = cs[1 + b * 3], y0 = 2.2 + b * 0.9;
      accTube(A, (t) => [c[0] * t, lerp(y0, c[1] + 0.2, t * t), c[2] * t], (t) => 0.26 - 0.14 * t, 4, 2, b === 1 ? moss : bark, 0.5, 0.2, 30, false);
      for (let k = 0; k < 2; k++) {                       // moss beards
        const t = 0.45 + 0.35 * k, len = rng.range(0.9, 2.0), q = [c[0] * t, lerp(y0, c[1] + 0.2, t * t) - 0.15, c[2] * t];
        accRibbon(A, [q, [q[0], q[1] - len, q[2]]], [0.17, 0.02], [c[2] > 0 ? 0.8 : -0.8, 0, 0.6], moss, 0.4, 0.05, 0.5, 8, 3);
      }
    }
    const c = cs[4], q = [c[0] * 0.6, lerp(3.1, c[1] + 0.2, 0.36) + 0.1, c[2] * 0.6];      // a tank bromeliad with its vermilion heart
    for (let l = 0; l < 6; l++) {
      const la = (l / 6) * 6.283, lx = Math.cos(la), lz = Math.sin(la), heart = l === 5;
      accRibbon(A, [q, [q[0] + lx * (heart ? 0.1 : 0.7), q[1] + (heart ? 1.1 : 0.8), q[2] + lz * (heart ? 0.1 : 0.7)]], [0.15, 0.02], [-lz, 0, lx], heart ? S.verm : S.green, heart ? 0.2 : 0.4, 0.02, 0.2, 6, 3);
    }
  }
  return accGeometry(A);
}
// frailejon (Espeletia): a short column buried in a shaggy skirt of dead leaves under a woolly silver rosette
// (round 11) redrawn so that it reads at speed and from above: the rosette is a star of broad pale leaves, left as paper
// and silver wash inside a firm outline (no strokes on it but in shade), the column and its skirt are the dark under it.
// It takes the same draws in the same order as before, so every shape after it in the stream is dealt as it was.
function frailejonGeometry(rng, S, bloom, near) {
  const A = makeAcc(), col = thin(S.pal[2], 0.62), dead = thin(S.pal[2], 0.85), silver = thin(S.pal[4], 0.2), tip = bloom ? S.gamb : thin(S.pal[3], 0.3);
  const H = 1.5;
  // (round 12: the far form's column has three sides, not five; it is never seen from under 36 m)
  accTube(A, (t) => [0.05 * Math.sin(t * 3), H * t, 0], (t) => (near ? 0.22 : 0.38 - 0.1 * t), near ? 5 : 3, 1, near ? col : dead, near ? 0.62 : 0.55, 0.1, 8, true);
  if (near) for (let tier = 0; tier < 2; tier++) for (let f = 0; f < 6; f++) {
    const a = ((f + tier * 0.5) / 6) * Math.PI * 2 + rng.range(-0.2, 0.2), dx = Math.cos(a), dz = Math.sin(a), y0 = H - 0.1 - tier * 0.56, o = rng.range(0.42, 0.56);
    accRibbon(A, [[dx * 0.12, y0, dz * 0.12], [dx * o, y0 - rng.range(0.55, 0.75), dz * o]], [0.2, 0.05], [-dz, 0, dx], tier ? col : dead, 0.5 + 0.1 * tier, 0.02, 0.12, 6, 2.2);
  }
  const nL = near ? 11 : 7;
  for (let f = 0; f < nL; f++) {
    const tier = f % 3, a = (f / nL) * Math.PI * 2 + rng.range(-0.2, 0.2), dx = Math.cos(a), dz = Math.sin(a);
    const e = [0.1, 0.5, 1.0][tier] + rng.range(-0.08, 0.08), L = [1.2, 1.02, 0.72][tier], ce = Math.cos(e), se = Math.sin(e);
    const pts = near ? [[dx * 0.06, H - 0.05, dz * 0.06], [dx * L * ce * 0.5, H + L * se * 0.56 + 0.08, dz * L * ce * 0.5], [dx * L * ce, H + L * se, dz * L * ce]]
      : [[dx * 0.06, H - 0.05, dz * 0.06], [dx * L * ce, H + L * se, dz * L * ce]];
    accRibbon(A, pts, near ? [0.1, 0.25, 0.03] : [0.31, 0.04], [-dz, 0, dx], tier === 2 ? tip : silver, -0.06 + 0.05 * tier, 0.15, 0.45, 6, 2.2);
  }
  if (near && bloom) for (let f = 0; f < 3; f++) {        // yellow daisies on woolly stalks
    const a = f * 2.1 + rng.range(-0.3, 0.3), dx = Math.cos(a) * 0.35, dz = Math.sin(a) * 0.35;
    accRibbon(A, [[0, H, 0], [dx * 0.6, H + 0.75, dz * 0.6], [dx, H + 1.0, dz]], [0.025, 0.025, 0.13], [-dz, 0, dx], S.gamb, 0.2, 0.2, 0.6, 6, 3);
  }
  return accGeometry(A);
}
// a rock outcrop: three fused, sheared lumps and a low drift of snow (or ash) trailing downwind of it (+X, -Z)
function rockGeometry(rng, S) {
  const A = makeAcc(), grey = thin(S.pal[2].clone().lerp(S.pal[1], 0.5), 0.62);
  const lump = (rx, ry, sides, ox, oy, oz, sx, sz, shear, tone, kind = 4) => {
    const n0 = A.n;
    accDome(A, rx, ry, sides, 2, 0.42, rng, grey, tone, 6, 0, kind);
    for (let i = n0; i < A.n; i++) {
      const x = A.pos[i * 3], y = A.pos[i * 3 + 1], z = A.pos[i * 3 + 2];
      A.pos[i * 3] = x * sx + y * shear + ox; A.pos[i * 3 + 1] = y + oy; A.pos[i * 3 + 2] = z * sz - y * shear * 0.6 + oz; A.uv[i * 2] += n0 * 0.37;
    }
  };
  lump(0.62, 0.85, 6, 0, 0, 0, 1.25, 0.85, 0.3, 0.34);
  lump(0.42, 0.55, 6, -0.55, -0.04, 0.3, 1.0, 1.2, -0.3, 0.4);
  lump(0.3, 0.4, 5, 0.5, -0.03, -0.42, 1.1, 0.9, 0.2, 0.3);
  lump(0.55, 0.13, 5, 1.25, -0.03, -0.75, 2.3, 0.75, 0, 0.0, 4.3);      // the drift in its lee
  return accGeometry(A);
}
function puyaGeometry(rng, S, bloom, near) {
  const A = makeAcc(), col = bloom ? thin(S.pal[4], 0.9) : thin(S.pal[3].clone().lerp(S.pal[2], 0.5), 0.6), leaf = thin(S.pal[4].clone().lerp(S.pal[3], 0.5), 0.5);
  if (near) {
    // the close specimen: a spiky rosette of stiff narrow leaves as wide as the tower is tall, a woolly club broken
    // by whorls of bracts (blue-green flowers when it blooms) that stand out from its outline
    const club = (t) => [0.12 * Math.sin(t * 2.2), 0.5 + 3.5 * t, 0], crad = (t) => 0.1 + 0.42 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.86 + 0.14)), 1.5) * (0.35 + 0.65 * t);
    for (let f = 0; f < 17; f++) {
      const a = (f / 17) * Math.PI * 2 + rng.range(-0.15, 0.15), dx = Math.cos(a), dz = Math.sin(a), tier = f % 3;
      const L = [1.9, 1.55, 1.1][tier] * rng.range(0.88, 1.1), up = [0.35, 0.8, 1.25][tier];
      accRibbon(A, [[dx * 0.08, 0.15, dz * 0.08], [dx * L * 0.5, 0.15 + up * 0.62, dz * L * 0.5], [dx * L, 0.15 + up * (tier ? 1 : 0.55), dz * L]], [0.13, 0.1, 0.012], [-dz, 0, dx],
        tier === 2 ? leaf.clone().lerp(S.green, 0.4) : leaf, 0.2 + 0.1 * tier, 0.03, 0.22, 8, 2.5);
    }
    accTube(A, club, crad, 7, 5, bloom ? thin(S.pal[3], 0.55) : col, 0.45, 0.25, 4, true);
    for (let w = 0; w < 7; w++) for (let b = 0; b < 5; b++) {
      const t = 0.2 + 0.11 * w, c = club(t), r = crad(t), a = (b / 5) * Math.PI * 2 + w * 0.7 + rng.range(-0.2, 0.2), dx = Math.cos(a), dz = Math.sin(a), out = rng.range(0.3, 0.5);
      accRibbon(A, [[c[0] + dx * r * 0.8, c[1], c[2] + dz * r * 0.8], [c[0] + dx * (r + out), c[1] + out * 0.8, c[2] + dz * (r + out)]], [0.1, 0.015], [-dz, 0, dx],
        bloom ? thin(S.pal[4], 1).multiplyScalar(0.9) : thin(S.pal[2], 0.75), bloom ? 0.3 : 0.5, 0.2 * t, 0.3 * t, 6, 3);
    }
    return accGeometry(A);
  }
  accTube(A, (t) => [0.12 * Math.sin(t * 2.2), 0.4 + 3.6 * t, 0], (t) => 0.12 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.86 + 0.14)), 1.5) * (0.35 + 0.65 * t), 5, 3, col, 0.5, 0.25, 10, true);
  for (let f = 0; f < 6; f++) {
    const a = (f / 6) * Math.PI * 2 + rng.range(-0.3, 0.3), dx = Math.cos(a), dz = Math.sin(a);
    accRibbon(A, [[dx * 0.1, 0.1, dz * 0.1], [dx * 1.25, rng.range(0.5, 1.0), dz * 1.25]], [0.2, 0.03], [-dz, 0, dx], leaf, 0.3, 0.05, 0.3, 8, 2);
  }
  return accGeometry(A);
}
function cushionGeometry(rng, S) {
  const A = makeAcc();
  accDome(A, 1.5, 0.95, 6, 2, 0.2, rng, S.green, 0.3, 9, 0);
  return accGeometry(A);
}

// rejection-sample plant sites on the living half inside a height zone, keeping the camera line clear
function scatter(rng, HF, fly, n, o) {
  const out = [], sm = fly.samples;
  for (let tries = 0; out.length < n && tries < n * 14; tries++) {
    let x, z;
    const r = Math.sqrt(lerp(o.rMin * o.rMin, o.rMax * o.rMax, rng()));
    if (rng() < o.seam) {
      x = -(o.edge + Math.abs(rng.gauss()) * o.seamW);
      if (-x > r * 0.9) continue;
      z = Math.sqrt(r * r - x * x) * (rng() < o.south ? 1 : -1);
    } else { const th = rng.range(-1.5, 1.5); x = -r * Math.cos(th) - o.edge; z = r * Math.sin(th); }
    const y = HF.heightAt(x, z), yz = y + 14 * (rng() - 0.5);
    if (yz < o.lo || yz > o.hi) continue;
    if (z > 0 && z < 135 && Math.abs(x - NOTCH_X) < 11 + o.rad) continue;       // the notch stays clear
    const s = rng.range(o.s0, o.s1), top = y + o.h * s + (o.low ? -0.5 : 4);
    let ok = true;
    for (let i = 0; i < sm.length; i++) {
      const p = sm[i];
      if (p.y < y - 3 || p.y > top + 5) continue;
      const dx = p.x - x, dz = p.z - z, c = (o.low ? 3.5 : 9) + o.rad * s;
      if (dx * dx + dz * dz < c * c) { ok = false; break; }
    }
    if (ok) out.push({ x, y, z, s, rot: rng() * Math.PI * 2, tone: rng.range(-0.08, 0.1), ph: rng() * 6.28 });
  }
  return out;
}

function instancePlants(geo, mat, sites, sink, whiten) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, sites.length));
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), qUp = new THREE.Quaternion(), ax = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const inst = new Float32Array(Math.max(1, sites.length) * 4);
  sites.forEach((p, i) => {
    q.setFromAxisAngle(ax, p.rot); if (p.up) q.premultiply(qUp.setFromUnitVectors(ax, p.up)); sc.setScalar(p.s); ps.set(p.x, p.y - sink * p.s, p.z);
    m.setMatrixAt(i, M.compose(ps, q, sc));
    inst.set([p.tone + (p.dark || 0), p.ph, whiten ? whiten(p) : 0, p.snow || 0], i * 4);
  });
  m.count = sites.length;
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
  m.instanceMatrix.needsUpdate = true;
  m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- specimens: flat figures built from 'leaves'
// A leaf is a strip along a spine with a width profile that closes at both ends, so |edge| -> 1 is its
// outline and the hatching follows its form. Page frame: a = north (-Z), b = up, layers stack along +X.
const NFIG = 18;      // plates 0..NBOX-1, one shared id for every resident that stays put, then the flyers
const SPEC_VERT = /* glsl */ `
attribute vec3 aCol; attribute vec4 aSpec; attribute vec3 aPivot; attribute float aEdge; attribute float aW;
uniform float uP[${NFIG}]; uniform vec4 uOff[${NFIG}]; uniform float uD[${NFIG}]; uniform vec3 uCtr[${NFIG}]; uniform vec2 uPose[${NFIG}];   // uPose: tilt in the page, scale
uniform float uTime, uOutline;
varying vec2 vUv; varying vec3 vCol; varying float vEdge; varying float vP; varying float vTone; varying float vDist;
${FOG_V}
void main(){
  int k = int(aSpec.x + 0.5); float type = aSpec.y;
  float p = uP[k]; vec4 off = uOff[k]; float d = uD[k]; vec3 ctr = uCtr[k]; float tilt = uPose[k].x; float scl = uPose[k].y;
  if (uOutline > 0.5) { p = 0.; off = vec4(0.); d = 0.; tilt = 0.; }
  float lift = smoothstep(0.3, 0.5, p), open = smoothstep(0.06, 0.3, p);
  float stride = 1.6*scl;
  vec3 rel = position - aPivot;
  if (type > 0.5 && type < 1.5) {            // wing beating out of the page (about the north axis)
    float a = aW*sin(uTime*34. + aSpec.z)*lift;
    float c = cos(a), s = sin(a);
    rel = vec3(rel.x*c - rel.y*s, rel.x*s + rel.y*c, rel.z);
  } else if (type > 1.5 && type < 2.5) {     // wing case: swings up in the page, then tilts out of it
    float a = aW*open, c = cos(a), s = sin(a);
    rel = vec3(rel.x, rel.y*c - rel.z*s, rel.y*s + rel.z*c);
    rel.x += abs(rel.y)*0.35*open;
  } else if (type > 2.5 && type < 3.5) {     // leg: the foot is pinned through stance
    float ph = fract(d/stride + aSpec.z);
    float sw = clamp((ph - 0.65)/0.35, 0., 1.);
    float fwd = ph < 0.65 ? (0.5 - ph/0.65) : (-0.5 + sw*sw*(3. - 2.*sw));
    rel.z -= fwd*0.65*stride*aW;              // travel is toward -Z (north, with the camera)
    rel.y += 0.24*scl*sin(3.14159*sw)*aW*step(0.65, ph);
  } else if (type > 3.5 && type < 4.5) {     // petal: unfolds from the bud
    float a = aW*(1. - open), c = cos(a), s = sin(a);
    rel = vec3(rel.x, rel.y*c - rel.z*s, rel.y*s + rel.z*c)*mix(0.4, 1., open);
  } else if (type > 4.5 && type < 5.5) {     // hind wing: hidden under the case, then whirring
    float a = aW*(0.5 + 0.5*sin(uTime*30. + aSpec.z))*lift, c = cos(a), s = sin(a);
    rel = vec3(rel.x*c + abs(rel.z)*s, rel.y, rel.z*c)*open;
  } else if (type > 5.5 && type < 6.5) {     // a butterfly's wing: opens and closes slowly off the paper
    float a = aW*(0.12 + 0.88*(0.5 + 0.5*sin(uTime*2.7 + aSpec.z)))*lift, c = cos(a), s = sin(a);
    rel = vec3(rel.x*c + abs(rel.z)*s, rel.y, rel.z*c);
  } else if (type > 6.5 && type < 7.5) {     // sway or nod in the plane of the page
    float a = aW*sin(uTime*1.6 + aSpec.z)*open, c = cos(a), s = sin(a);
    rel = vec3(rel.x, rel.y*c - rel.z*s, rel.y*s + rel.z*c);
  } else if (type > 7.5) {                   // a slow wing of a bird drawn from above: it lifts off the paper and falls back
    float a = aW*(0.5 + 0.5*sin(uTime*7. + aSpec.z))*lift, c = cos(a), s = sin(a);
    rel = vec3(rel.x*c - rel.y*s, rel.x*s + rel.y*c, rel.z);
  }
  vec3 pos = aPivot + rel;
  if (type < 0.5) pos.y += 0.035*scl*sin(d/stride*12.566)*step(1e-4, d);   // a walker's back rises twice a stride
  vec3 q = pos - ctr;
  float ct = cos(tilt), st = sin(tilt);
  q = vec3(q.x, q.y*ct - q.z*st, q.z*ct + q.y*st);                          // tilt in the page: north goes up
  float cy = cos(off.w), sy = sin(off.w);
  q = vec3(q.x*cy + q.z*sy, q.y, -q.x*sy + q.z*cy);
  pos = ctr + q + off.xyz;
  vUv = uv; vCol = aCol; vEdge = aEdge; vP = uOutline > 0.5 ? 1. : p; vTone = aSpec.w;
  vec4 mvPosition = modelViewMatrix*vec4(pos, 1.);
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix*mvPosition;
  if (uOutline < 0.5 && p <= 0.001) gl_Position = vec4(0., 0., 3., 1.);
  if (uOutline > 0.5 && aSpec.x > ${NBOX}.0 - 0.5) gl_Position = vec4(0., 0., 3., 1.);       // residents leave no outline behind
  #include <fog_vertex>
}`;

const SPEC_FRAG = /* glsl */ `
varying vec2 vUv; varying vec3 vCol; varying float vEdge; varying float vP; varying float vTone; varying float vDist;
uniform float uOutline;
${PLATE_COMMON}
${FOG_F}
void main(){
  float fe = fwidth(vEdge), fu = fwidth(vUv.x), fv = fwidth(vUv.y);
  float edge = lineAA(1. - abs(vEdge), fe, 1.25);
  vec3 col;
  if (uOutline > 0.5) {
    if (edge < 0.25) discard;
    col = mix(uPaper, uInk, edge*0.8);
  } else {
    if (vP <= 0.001) discard;
    float tone = clamp(vTone + 0.3*(0.5 - 0.5*vEdge), 0., 1.);
    vec2 hA = hatch(vUv.y, fv, 0.05, 4., tone);
    vec2 hB = hatch(vUv.x, fu, 0.07, 4., tone);
    float hair = step(0.35, vnoise(vec2(vUv.x*5., vUv.y*40.)));
    float lA = smoothstep(0.1, 0.3, tone), lB = smoothstep(0.8, 0.95, tone);
    float ink = 1. - (1. - hA.x*lA*hair)*(1. - hB.x*lB*0.8);
    ink = max(ink, edge)*smoothstep(0., 0.12, vP);
    float s = smoothstep(0.03, 0.3, vP)*1.05;
    float wa = smoothstep(hA.y*0.8, hA.y*0.8 + 0.2, s)*smoothstep(-0.97, -0.8, vEdge);
    col = plate(vCol, wa, ink, 0.);
  }
  ${FRAG_END}
}`;

function makeFig() { return { pos: [], uv: [], col: [], spec: [], piv: [], edge: [], w: [], idx: [], n: 0 }; }
const _crv = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()]);
// spine: [[a,b],...]; wf(t) half-width; o: { id, layer, col, tone, type, pivot:[a,b], phase, wgt:(t)=>number, n }
function leaf(F, org, spine, wf, o) {
  const n = o.n || 9, base = F.n, sc = F.s || 1, fl = F.flip || 1;
  _crv.points = spine.map((p) => new THREE.Vector3(p[0], p[1], 0)); _crv.curveType = 'centripetal'; _crv.updateArcLengths();
  const L = _crv.getLength(), piv = o.pivot || spine[0], x = 0.07 + (o.layer || 0) * 0.012 * sc;
  const P = new THREE.Vector3(), T = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n; _crv.getPointAt(t, P); _crv.getTangentAt(t, T);
    const w = Math.max(0.004, wf(t)), nx = -T.y, ny = T.x, wg = o.wgt ? o.wgt(t) : 1;
    for (let s = -1; s <= 1; s += 2) {
      const a = (P.x + nx * w * s) * fl * sc, b = (P.y + ny * w * s) * sc;
      F.pos.push(org[0] + x, org[1] + b, org[2] - a); F.uv.push(t * L, s * w); F.col.push(o.col.r, o.col.g, o.col.b);
      F.spec.push(o.id, o.type || 0, o.phase || 0, o.tone ?? 0.3); F.piv.push(org[0] + x, org[1] + piv[1] * sc, org[2] - piv[0] * fl * sc);
      F.edge.push(s); F.w.push(wg); F.n++;
    }
  }
  for (let i = 0; i < n; i++) { const a = base + i * 2; F.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
}
function figGeometry(F) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(F.pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(F.uv, 2));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(F.col, 3));
  g.setAttribute('aSpec', new THREE.Float32BufferAttribute(F.spec, 4));
  g.setAttribute('aPivot', new THREE.Float32BufferAttribute(F.piv, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(F.edge, 1));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(F.w, 1));
  g.setIndex(F.idx);
  return g;
}
const spindle = (w, k = 0.6) => (t) => w * Math.pow(Math.sin(Math.PI * t), k);
const white = new THREE.Color(1, 1, 1);

const FIGURES = {
  orchid(F, org, id, S, rng) {
    const g = S.green, v = S.verm;
    leaf(F, org, [[-0.04, 0], [-0.3, 0.5], [-0.62, 1.05]], spindle(0.17, 0.8), { id, col: g, tone: 0.35, layer: 0 });
    leaf(F, org, [[0.05, 0], [0.36, 0.45], [0.66, 0.86]], spindle(0.15, 0.8), { id, col: g, tone: 0.45, layer: 0 });
    leaf(F, org, [[0.0, 0], [0.12, 0.3], [0.2, 0.52]], spindle(0.1, 0.8), { id, col: g, tone: 0.5, layer: 1 });
    leaf(F, org, [[0, 0], [0.07, 0.7], [0.02, 1.25], [0.06, 1.62]], () => 0.022, { id, col: g, tone: 0.7, layer: 1 });
    const c = [0.06, 1.62], sep = (t) => 0.025 + 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 2.2)), 0.8) * (t < 0.455 ? 1 : 0);
    [90, 215, 325].forEach((deg, i) => {
      const a = (deg * Math.PI) / 180 + rng.range(-0.08, 0.08), L = i ? 1.3 : 1.05, dx = Math.cos(a), dy = Math.sin(a);
      const bend = i === 0 ? 0 : (i === 1 ? -0.14 : 0.14);
      leaf(F, org, [c, [c[0] + dx * L * 0.4, c[1] + dy * L * 0.4], [c[0] + dx * L * 0.8 + bend, c[1] + dy * L * 0.8 - Math.abs(bend)], [c[0] + dx * L + bend * 2, c[1] + dy * L - Math.abs(bend) * 2.4]],
        sep, { id, col: v, tone: 0.3, layer: 2 + i, type: 4, pivot: c, wgt: () => (i === 0 ? 0 : i === 1 ? -2.0 : 2.0), n: 12 });
    });
    leaf(F, org, [[c[0] - 0.02, c[1] - 0.02], [c[0] + 0.02, c[1] - 0.16]], spindle(0.05), { id, col: S.gamb, tone: 0.2, layer: 5, type: 4, pivot: c, wgt: () => 0, n: 5 });
  },
  hummingbird(F, org, id, S, rng) {
    const g = S.green, vd = S.verd, sh = [-0.02, 1.32];
    // far wing, tail, body, head, bill, near wing
    for (let w = 0; w < 2; w++) for (let i = 0; i < 5; i++) {
      const a = (w ? 2.05 : 1.55) + i * 0.17, L = (w ? 1.0 : 0.85) * (0.72 + 0.28 * Math.sin((i / 4) * Math.PI * 0.8 + 0.6));
      leaf(F, org, [sh, [sh[0] + Math.cos(a) * L * 0.5, sh[1] + Math.sin(a) * L * 0.5 + 0.03], [sh[0] + Math.cos(a) * L, sh[1] + Math.sin(a) * L]], spindle(0.075, 0.5),
        { id, col: vd, tone: w ? 0.5 : 0.7, layer: w ? 6 + i : i * 0.2, type: 1, pivot: sh, phase: w ? 0 : 0.5, wgt: () => (w ? 1.0 : -0.9), n: 6 });
    }
    [[-0.72, 0.12], [-0.56, 0.02], [-0.88, 0.3]].forEach((tp, i) =>
      leaf(F, org, [[-0.3, 0.84], [(tp[0] - 0.3) / 2, (tp[1] + 0.84) / 2 + 0.03], tp], spindle(0.075, 0.5), { id, col: g, tone: 0.75, layer: 2 + i * 0.2, n: 6 }));
    leaf(F, org, [[-0.4, 0.72], [-0.12, 1.1], [0.06, 1.4], [0.2, 1.66]], spindle(0.25, 0.7), { id, col: g, tone: 0.45, layer: 3, n: 10 });
    leaf(F, org, [[0.1, 1.5], [0.26, 1.68], [0.44, 1.8]], spindle(0.15, 0.6), { id, col: g, tone: 0.6, layer: 4, n: 7 });
    leaf(F, org, [[0.38, 1.76], [0.9, 2.02], [1.5, 2.36]], (t) => 0.034 * (1 - 0.8 * t), { id, col: white, tone: 0.95, layer: 5, n: 6 });
    leaf(F, org, [[0.27, 1.72], [0.3, 1.74]], spindle(0.03), { id, col: white, tone: 1, layer: 5.5, n: 4 });
  },
  tapir(F, org, id, S, rng) {
    const br = thin(S.pal[2], 0.75), dk = thin(S.pal[1], 0.5);
    const legW = (t) => (0.2 - 0.09 * t) * (t > 0.9 ? Math.sqrt(Math.max(0, (1 - t) / 0.1)) : 1) + 0.03 * Math.exp(-Math.pow((t - 0.5) / 0.1, 2));
    const leg = (hx, ph, far) => leaf(F, org, [[hx, 0.98], [hx + (far ? 0.05 : -0.04), 0.5], [hx, 0.0]], legW,
      { id, col: far ? dk : br, tone: far ? 0.9 : 0.55, layer: far ? 0 : 4, type: 3, pivot: [hx, 0.98], phase: ph, wgt: (t) => Math.pow(t, 1.25), n: 8 });
    leg(-0.62, 0.75, true); leg(0.92, 0.5, true);
    leaf(F, org, [[1.28, 1.5], [1.42, 1.32]], spindle(0.05), { id, col: dk, tone: 0.9, layer: 1, n: 4 });
    leaf(F, org, [[1.3, 1.22], [0.6, 1.36], [-0.3, 1.33], [-1.0, 1.36]], (t) => 0.6 * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * t)), 0.42), { id, col: br, tone: 0.5, layer: 2, n: 12 });
    leaf(F, org, [[-0.7, 1.45], [-1.3, 1.6], [-1.75, 1.48], [-2.12, 1.14]], (t) => 0.4 * Math.pow(Math.sin(Math.PI * (0.1 + 0.85 * t)), 0.6) * (1 - 0.45 * t), { id, col: br, tone: 0.42, layer: 3, n: 10 });
    leaf(F, org, [[-2.0, 1.22], [-2.2, 1.02], [-2.3, 0.84]], spindle(0.09, 0.5), { id, col: dk, tone: 0.85, layer: 3.5, n: 6 });
    leaf(F, org, [[-1.3, 1.82], [-1.2, 2.0], [-1.16, 2.14]], spindle(0.09, 0.6), { id, col: white, tone: 0.15, layer: 3.6, n: 5 });
    leaf(F, org, [[-1.72, 1.56], [-1.7, 1.58]], spindle(0.035), { id, col: white, tone: 1, layer: 3.7, n: 4 });
    leg(-0.78, 0.25, false); leg(0.8, 0.0, false);
  },
  beetle(F, org, id, S, rng) {
    const ol = S.gamb, dk = thin(S.pal[1], 0.6), wg = thin(S.pal[4], 0.3);
    for (let s = -1; s <= 1; s += 2) {
      leaf(F, org, [[0.1 * s, 1.0], [0.62 * s, 0.98], [1.15 * s, 0.72]], spindle(0.3, 0.5), { id, col: wg, tone: 0.12, layer: 1, type: 5, pivot: [0.1 * s, 1.0], phase: s, wgt: () => 0.7, n: 8 });
      [[1.22, 0.5, 0.25], [1.05, 0.62, -0.05], [0.85, 0.7, -0.5]].forEach((lg, i) =>
        leaf(F, org, [[0.2 * s, lg[0]], [(0.2 + lg[1] * 0.55) * s, lg[0] + 0.14], [(0.2 + lg[1]) * s, lg[0] + lg[2]]], (t) => 0.04 * (1 - 0.6 * t), { id, col: white, tone: 0.95, layer: 0.2 * i, n: 6 }));
    }
    leaf(F, org, [[0, 0.08], [0, 0.55], [0, 1.02]], spindle(0.3, 0.55), { id, col: dk, tone: 0.8, layer: 2, n: 8 });
    for (let s = -1; s <= 1; s += 2)
      leaf(F, org, [[0.1 * s, 1.02], [0.2 * s, 0.55], [0.08 * s, 0.04]], spindle(0.2, 0.5), { id, col: ol, tone: 0.3, layer: 3, type: 2, pivot: [0.12 * s, 1.02], wgt: () => 0.95 * s, n: 9 });
    leaf(F, org, [[0, 0.96], [0, 1.2], [0, 1.44]], spindle(0.31, 0.5), { id, col: dk, tone: 0.9, layer: 4, n: 8 });
    leaf(F, org, [[0.03, 1.36], [0.16, 1.75], [0.12, 2.05], [-0.02, 2.24]], (t) => 0.075 * (1 - 0.7 * t), { id, col: white, tone: 1, layer: 5, n: 9 });
    leaf(F, org, [[-0.04, 1.4], [-0.16, 1.6], [-0.14, 1.82]], (t) => 0.05 * (1 - 0.7 * t), { id, col: white, tone: 1, layer: 4.5, n: 6 });
  },
  // a glasswing butterfly: clear panes in rust borders, its wings opening and closing off the paper
  butterfly(F, org, id, S, rng) {
    const rust = S.gamb.clone().lerp(S.verm, 0.5), dk = thin(S.pal[1], 0.6), pane = thin(S.pal[4], 0.18);
    for (let s = -1; s <= 1; s += 2) {
      const fw = [[0.06 * s, 1.5], [0.7 * s, 1.95], [1.45 * s, 2.3]], hwg = [[0.06 * s, 1.3], [0.6 * s, 0.95], [1.0 * s, 0.45]];
      const o6 = { id, type: 6, pivot: [0, 1.4], phase: 0, wgt: () => 1.1, n: 9 };
      leaf(F, org, hwg, spindle(0.36, 0.55), { ...o6, col: rust, tone: 0.55, layer: 0 });
      leaf(F, org, hwg.map((q) => [q[0] * 0.84 + 0.04 * s, q[1] + 0.04]), spindle(0.2, 0.6), { ...o6, col: pane, tone: 0.12, layer: 0.5 });
      leaf(F, org, fw, spindle(0.44, 0.55), { ...o6, col: rust, tone: 0.5, layer: 1 });
      leaf(F, org, fw.map((q) => [q[0] * 0.86 + 0.05 * s, q[1] - 0.02]), spindle(0.27, 0.6), { ...o6, col: pane, tone: 0.12, layer: 2 });
      leaf(F, org, [[0.03 * s, 1.72], [0.2 * s, 2.1], [0.42 * s, 2.3]], () => 0.02, { id, col: dk, tone: 0.9, layer: 3, n: 5 });
    }
    leaf(F, org, [[0, 0.95], [0, 1.4], [0, 1.78]], spindle(0.085, 0.5), { id, col: dk, tone: 0.85, layer: 3, n: 7 });
  },
  // a sprig of cinchona: opposite leaves on a bowed stem, a panicle of pink flowers unfolding at its tip
  cinchona(F, org, id, S, rng) {
    const g = S.green, pink = thin(S.pal[6], 0.5), st = thin(S.pal[2], 0.8), top = [0.25, 1.9];
    leaf(F, org, [[-0.5, 0.05], [-0.2, 0.75], [0.1, 1.4], top], () => 0.03, { id, col: st, tone: 0.7, layer: 0, n: 8 });
    [[-0.36, 0.4], [-0.1, 0.98], [0.14, 1.5]].forEach((nd, i) => {
      for (let s = -1; s <= 1; s += 2) {
        const L = 0.95 - i * 0.18, a = s > 0 ? 0.35 - i * 0.1 : 2.6 + i * 0.12;
        leaf(F, org, [nd, [nd[0] + Math.cos(a) * L * 0.5, nd[1] + Math.sin(a) * L * 0.5 + 0.08], [nd[0] + Math.cos(a) * L, nd[1] + Math.sin(a) * L]], spindle(0.2 - i * 0.03, 0.7),
          { id, col: g, tone: 0.3 + (s > 0 ? 0.12 : 0), layer: 1 + i, type: 7, pivot: nd, phase: i * 1.3 + s, wgt: () => 0.09, n: 8 });
      }
    });
    for (let k = 0; k < 9; k++) {
      const a = 0.5 + (k / 8) * 2.2, L = 0.34 + 0.11 * ((k * 7) % 3), tp = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L + 0.1];
      leaf(F, org, [top, [(top[0] + tp[0]) / 2, (top[1] + tp[1]) / 2 + 0.03], tp], (t) => 0.02 + (t > 0.45 ? 0.075 * Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.45) / 0.55)), 0.7) : 0),
        { id, col: pink, tone: 0.25, layer: 4 + k * 0.1, type: 4, pivot: top, wgt: () => (k % 2 ? 0.9 : -0.9), n: 8 });
    }
  },
  // an Andean cock-of-the-rock on a mossy perch: vermilion, with the disc of a crest that hides its bill
  cockrock(F, org, id, S, rng) {
    const v = S.verm, dk = thin(S.pal[1], 0.75), grey = thin(S.pal[4], 0.3), br = thin(S.pal[2], 0.7);
    leaf(F, org, [[-1.3, 0.42], [-0.3, 0.5], [0.6, 0.4], [1.3, 0.52]], (t) => 0.09 - 0.03 * t, { id, col: br, tone: 0.6, layer: 0, n: 8 });
    leaf(F, org, [[-0.42, 0.9], [-0.75, 0.62], [-1.0, 0.3]], spindle(0.17, 0.5), { id, col: dk, tone: 0.9, layer: 1, n: 6 });
    for (let s = 0; s < 2; s++) leaf(F, org, [[-0.1 + s * 0.22, 0.86], [-0.06 + s * 0.22, 0.52]], () => 0.025, { id, col: br, tone: 0.9, layer: 1.5, n: 4 });
    leaf(F, org, [[-0.5, 0.78], [-0.12, 1.12], [0.22, 1.5], [0.4, 1.8]], spindle(0.4, 0.6), { id, col: v, tone: 0.3, layer: 2, n: 10 });
    leaf(F, org, [[-0.52, 0.86], [-0.2, 1.0], [0.08, 1.3]], spindle(0.2, 0.5), { id, col: dk, tone: 0.92, layer: 3, type: 7, pivot: [0.08, 1.3], phase: 1, wgt: () => 0.12, n: 7 });
    leaf(F, org, [[-0.3, 1.02], [-0.12, 1.2]], spindle(0.13, 0.5), { id, col: grey, tone: 0.12, layer: 3.5, n: 5 });
    const nk = [0.3, 1.7], o7 = { id, type: 7, pivot: nk, phase: 0, wgt: () => 0.16 };
    leaf(F, org, [[0.2, 1.7], [0.42, 1.95], [0.62, 2.05]], spindle(0.2, 0.5), { ...o7, col: v, tone: 0.25, layer: 4, n: 7 });
    leaf(F, org, [[0.3, 1.86], [0.62, 2.3], [0.98, 2.02]], spindle(0.22, 0.45), { ...o7, col: v, tone: 0.4, layer: 5, n: 9 });
    leaf(F, org, [[0.5, 1.98], [0.52, 2.0]], spindle(0.04), { ...o7, col: white, tone: 1, layer: 6, n: 4 });
  },
  // ---- round 3: more plates and the residents of the section
  // a harlequin toad on a leaf: gamboge with black blotches, its throat pulsing
  frog(F, org, id, S, rng) {
    const y = S.gamb, dk = thin(S.pal[1], 0.75), g = S.green;
    leaf(F, org, [[-1.7, 0.1], [-0.5, 0.3], [0.8, 0.27], [1.75, 0.06]], spindle(0.2, 0.6), { id, col: g, tone: 0.42, layer: 0, n: 9 });
    leaf(F, org, [[-0.55, 0.78], [-1.2, 0.72], [-0.75, 0.42], [-1.3, 0.36]], (t) => 0.15 * (1 - 0.55 * t), { id, col: y, tone: 0.55, layer: 1, n: 10 });
    const br = { id, type: 7, pivot: [-0.4, 0.5], phase: 0.4, wgt: () => 0.035 };
    leaf(F, org, [[-0.9, 0.6], [-0.35, 0.95], [0.3, 1.06], [0.8, 1.0]], spindle(0.42, 0.55), { ...br, col: y, tone: 0.28, layer: 2, n: 10 });
    [[-0.45, 0.98, 0.12], [0.0, 1.14, 0.1], [0.3, 0.9, 0.09], [-0.2, 0.74, 0.08]].forEach((q, i) =>
      leaf(F, org, [[q[0] - 0.14, q[1]], [q[0] + 0.14, q[1] + 0.03]], spindle(q[2], 0.5), { ...br, col: dk, tone: 0.95, layer: 2.5 + i * 0.05, n: 5 }));
    leaf(F, org, [[0.7, 0.86], [1.0, 0.8], [1.2, 0.92]], spindle(0.12, 0.6), { id, col: white, tone: 0.1, layer: 2.8, type: 7, pivot: [0.9, 1.0], phase: 0, wgt: () => 0.12, n: 6 });
    leaf(F, org, [[0.55, 1.0], [0.95, 1.15], [1.3, 1.08]], spindle(0.27, 0.5), { ...br, col: y, tone: 0.3, layer: 3, n: 7 });
    leaf(F, org, [[0.92, 1.3], [0.98, 1.31]], spindle(0.1), { ...br, col: white, tone: 1, layer: 4, n: 4 });
    leaf(F, org, [[0.55, 0.82], [0.62, 0.5], [1.0, 0.36]], (t) => 0.11 * (1 - 0.45 * t), { id, col: y, tone: 0.45, layer: 3.5, n: 7 });
  },
  // a grey-breasted mountain toucan on a perch: slate blue, a great gamboge and vermilion bill
  toucan(F, org, id, S, rng) {
    const bl = thin(S.pal[4], 0.9), dk = thin(S.pal[1], 0.75), br = thin(S.pal[2], 0.7), v = S.verm, y = S.gamb, ol = thin(S.pal[3].clone().lerp(S.pal[2], 0.4), 0.8);
    leaf(F, org, [[-1.4, 0.42], [-0.3, 0.5], [0.6, 0.4], [1.4, 0.52]], (t) => 0.09 - 0.03 * t, { id, col: br, tone: 0.6, layer: 0, n: 8 });
    leaf(F, org, [[-0.42, 0.95], [-0.85, 0.5], [-1.1, 0.02]], spindle(0.17, 0.5), { id, col: ol, tone: 0.7, layer: 1, type: 7, pivot: [-0.42, 0.95], phase: 2, wgt: () => 0.07, n: 7 });
    leaf(F, org, [[-0.5, 0.74], [-0.42, 0.6]], spindle(0.1, 0.5), { id, col: v, tone: 0.3, layer: 1.2, n: 4 });
    for (let s = 0; s < 2; s++) leaf(F, org, [[-0.1 + s * 0.22, 0.86], [-0.06 + s * 0.22, 0.52]], () => 0.025, { id, col: br, tone: 0.9, layer: 1.5, n: 4 });
    leaf(F, org, [[-0.5, 0.8], [-0.12, 1.14], [0.22, 1.52], [0.38, 1.84]], spindle(0.4, 0.6), { id, col: bl, tone: 0.3, layer: 2, n: 10 });
    leaf(F, org, [[-0.55, 0.9], [-0.22, 1.04], [0.06, 1.36]], spindle(0.21, 0.5), { id, col: ol, tone: 0.75, layer: 3, type: 7, pivot: [0.06, 1.36], phase: 1, wgt: () => 0.1, n: 7 });
    const nk = [0.3, 1.72], o7 = { id, type: 7, pivot: nk, phase: 0, wgt: () => 0.14 };
    leaf(F, org, [[0.18, 1.72], [0.4, 1.96], [0.6, 2.06]], spindle(0.21, 0.5), { ...o7, col: dk, tone: 0.9, layer: 4, n: 7 });
    leaf(F, org, [[0.52, 2.08], [1.05, 2.16], [1.62, 1.96]], (t) => 0.15 * (1 - 0.6 * t * t), { ...o7, col: y, tone: 0.2, layer: 5, n: 8 });
    leaf(F, org, [[0.54, 1.97], [1.05, 2.0], [1.55, 1.92]], (t) => 0.07 * (1 - 0.5 * t), { ...o7, col: v, tone: 0.3, layer: 5.5, n: 7 });
    leaf(F, org, [[0.5, 2.03], [0.53, 2.04]], spindle(0.045), { ...o7, col: white, tone: 1, layer: 6, n: 4 });
  },
  // a golden-headed quetzal: green over a vermilion belly, tail streamers swaying under the perch
  quetzal(F, org, id, S, rng) {
    const g = S.green, gd = thin(S.pal[3].clone().lerp(S.pal[4], 0.5), 0.95), v = S.verm, br = thin(S.pal[2], 0.7);
    leaf(F, org, [[-1.2, 2.0], [-0.2, 2.06], [0.6, 1.98], [1.3, 2.08]], (t) => 0.08 - 0.03 * t, { id, col: br, tone: 0.6, layer: 0, n: 8 });
    for (let k = 0; k < 3; k++) leaf(F, org, [[-0.2, 2.2], [-0.3 - k * 0.07, 1.3], [-0.2 - k * 0.18, 0.15 + k * 0.45]], spindle(0.1 - k * 0.012, 0.5),
      { id, col: k === 1 ? gd : g, tone: 0.5 + 0.1 * k, layer: 1 + k * 0.2, type: 7, pivot: [-0.2, 2.2], phase: k * 0.7, wgt: (t) => 0.1 * t, n: 9 });
    for (let s = 0; s < 2; s++) leaf(F, org, [[-0.05 + s * 0.16, 2.2], [-0.02 + s * 0.16, 2.02]], () => 0.022, { id, col: br, tone: 0.9, layer: 1.7, n: 4 });
    leaf(F, org, [[-0.26, 2.08], [-0.1, 2.5], [0.1, 2.95], [0.2, 3.2]], spindle(0.36, 0.6), { id, col: v, tone: 0.3, layer: 2, n: 10 });
    leaf(F, org, [[-0.34, 2.2], [-0.24, 2.6], [-0.02, 3.02]], spindle(0.24, 0.5), { id, col: g, tone: 0.55, layer: 3, type: 7, pivot: [-0.02, 3.02], phase: 1, wgt: () => 0.08, n: 8 });
    const nk = [0.15, 3.1], o7 = { id, type: 7, pivot: nk, phase: 0, wgt: () => 0.13 };
    leaf(F, org, [[0.08, 3.08], [0.24, 3.32], [0.4, 3.42]], spindle(0.2, 0.5), { ...o7, col: gd, tone: 0.45, layer: 4, n: 7 });
    leaf(F, org, [[0.38, 3.42], [0.56, 3.4], [0.68, 3.33]], (t) => 0.05 * (1 - 0.6 * t), { ...o7, col: S.gamb, tone: 0.3, layer: 5, n: 5 });
    leaf(F, org, [[0.33, 3.44], [0.35, 3.45]], spindle(0.04), { ...o7, col: white, tone: 1, layer: 6, n: 4 });
  },
  // a tree fern: a crozier still rolled up beside an open frond
  fern(F, org, id, S, rng) {
    const g = S.green, br = thin(S.pal[2], 0.75), go = S.gamb.clone().lerp(S.green, 0.5), ox = -0.55;
    const sp = [[ox - 0.5, 0], [ox - 0.52, 0.8], [ox - 0.45, 1.6]];
    for (let i = 0; i <= 11; i++) { const a = Math.PI - i * 0.6, r = 0.55 * Math.pow(0.86, i); sp.push([ox + 0.15 + r * Math.cos(a), 2.3 + r * Math.sin(a)]); }
    leaf(F, org, sp, (t) => 0.1 * (1 - 0.75 * t), { id, col: br, tone: 0.6, layer: 1, type: 7, pivot: [ox - 0.5, 0], phase: 0, wgt: (t) => 0.04 * t, n: 34 });
    const rach = (t) => [ox + 0.15 + 1.1 * t * t, 2.9 * t - 0.5 * t * t];
    leaf(F, org, [rach(0), rach(0.33), rach(0.66), rach(1)], (t) => 0.035 * (1 - 0.6 * t), { id, col: br, tone: 0.7, layer: 2, n: 10 });
    for (let k = 1; k <= 8; k++) for (let sd = -1; sd <= 1; sd += 2) {
      const t = k / 9, q = rach(t), L = 0.75 * (1 - 0.55 * t), a = sd > 0 ? 0.3 + 0.35 * t : 2.6 - 0.2 * t, cx = Math.cos(a), sy = Math.sin(a);
      leaf(F, org, [q, [q[0] + cx * L * 0.5, q[1] + sy * L * 0.5 + 0.05], [q[0] + cx * L, q[1] + sy * L]], spindle(0.12 * (1 - 0.45 * t), 0.7),
        { id, col: k % 2 ? g : go, tone: 0.35 + (sd > 0 ? 0.1 : 0), layer: 3 + k * 0.1, type: 7, pivot: q, phase: k * 0.6 + sd, wgt: () => 0.07, n: 6 });
    }
  },
  // a hairy armadillo in its burrow: nine bands of shell, a pink snout, its head lifting to sniff
  armadillo(F, org, id, S, rng) {
    const sh = thin(S.pal[2], 0.55).lerp(S.verm, 0.12), pk = thin(S.pal[6], 0.35), dk = thin(S.pal[1], 0.6);
    leaf(F, org, [[-0.95, 0.5], [-1.5, 0.34], [-2.0, 0.12]], (t) => 0.1 * (1 - 0.8 * t), { id, col: pk, tone: 0.5, layer: 0, type: 7, pivot: [-0.95, 0.5], phase: 1, wgt: () => 0.08, n: 7 });
    for (const hx of [-0.62, 0.52]) leaf(F, org, [[hx, 0.42], [hx + 0.05, 0.02]], () => 0.07, { id, col: dk, tone: 0.8, layer: 0.5, n: 4 });
    const back = (t) => 0.42 + 0.62 * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * t)), 0.7);
    for (let k = 0; k < 9; k++) {
      const t = k / 8, x = -1.0 + 1.9 * t, top = back(t);
      leaf(F, org, [[x - 0.03, 0.32], [x + 0.02, (top + 0.32) / 2], [x, top]], spindle(0.15, 0.35), { id, col: sh, tone: 0.3 + 0.1 * (k % 2), layer: 1 + k * 0.1, type: 7, pivot: [0, 0.3], phase: 0.3, wgt: () => 0.012, n: 6 });
    }
    const o7 = { id, type: 7, pivot: [0.9, 0.6], phase: 0, wgt: () => 0.1 };
    leaf(F, org, [[0.85, 0.62], [1.25, 0.5], [1.62, 0.3]], spindle(0.17, 0.5), { ...o7, col: pk, tone: 0.3, layer: 2.2, n: 7 });
    leaf(F, org, [[1.0, 0.76], [1.02, 0.98], [1.08, 1.08]], spindle(0.07, 0.5), { ...o7, col: pk, tone: 0.5, layer: 2.4, n: 5 });
    leaf(F, org, [[1.24, 0.6], [1.26, 0.61]], spindle(0.03), { ...o7, col: white, tone: 1, layer: 2.6, n: 4 });
    for (const hx of [-0.7, 0.6]) leaf(F, org, [[hx, 0.42], [hx - 0.04, 0.0]], () => 0.08, { id, col: pk, tone: 0.5, layer: 2.1, n: 4 });
  },
  // a snake coiled in its chamber, head raised and swaying, tongue out
  snake(F, org, id, S, rng) {
    const g = S.green.clone().lerp(S.gamb, 0.35), pts = [];
    for (let i = 0; i <= 16; i++) { const a = i * 0.7, r = 1.25 - 0.06 * i; pts.push([Math.cos(a) * r * 1.15, 0.55 + Math.sin(a) * r * 0.42 - 0.012 * i]); }
    const hd = { id, type: 7, pivot: [0, 0.95], phase: 0 };
    leaf(F, org, pts.concat([[0.0, 0.95], [0.25, 1.3], [0.62, 1.45]]), (t) => 0.13 * Math.min(1, 0.25 + 3 * t) * (t > 0.95 ? 1.3 : 1), { ...hd, col: g, tone: 0.45, layer: 1, wgt: (t) => 0.12 * clamp((t - 0.86) / 0.14, 0, 1), n: 64 });
    leaf(F, org, [[0.7, 1.46], [0.95, 1.5], [1.12, 1.6]], () => 0.016, { ...hd, col: S.verm, tone: 0.3, layer: 2, wgt: () => 0.12, n: 4 });
    leaf(F, org, [[0.5, 1.5], [0.52, 1.51]], spindle(0.03), { ...hd, col: white, tone: 1, layer: 2.2, wgt: () => 0.12, n: 4 });
  },
  // an oilbird (guacharo) drawn from above, head to the north: cinnamon with white spots, its wings rowing off the paper
  oilbird(F, org, id, S, rng) {
    const c = S.gamb.clone().lerp(S.verm, 0.4).lerp(thin(S.pal[2], 0.8), 0.3), c2 = c.clone().multiplyScalar(0.72);
    for (let k = -1; k <= 1; k++) leaf(F, org, [[-0.5, 0], [-1.1, k * 0.14], [-1.55, k * 0.26]], spindle(0.1, 0.5), { id, col: c2, tone: 0.5, layer: 0.5 + 0.1 * (k + 1), n: 5 });
    for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 6; i++) {
      const a = s * (1.3 + i * 0.21), L = 1.75 - 0.13 * i, sh = [0.2 - i * 0.09, s * 0.08], o8 = { id, type: 8, pivot: [0.1, 0], phase: 0, wgt: () => -0.95 * s };
      leaf(F, org, [sh, [sh[0] + Math.cos(a) * L * 0.5, sh[1] + Math.sin(a) * L * 0.5], [sh[0] + Math.cos(a) * L, sh[1] + Math.sin(a) * L]], spindle(0.13, 0.5), { ...o8, col: i % 2 ? c : c2, tone: 0.4, layer: 1 + i * 0.1, n: 6 });
      if (i % 2 === 0) leaf(F, org, [[sh[0] + Math.cos(a) * L * 0.55, sh[1] + Math.sin(a) * L * 0.55], [sh[0] + Math.cos(a) * L * 0.62, sh[1] + Math.sin(a) * L * 0.62]], spindle(0.06), { ...o8, col: white, tone: 0.02, layer: 1.8, n: 4 });
    }
    leaf(F, org, [[-0.7, 0], [0, 0.01], [0.6, 0]], spindle(0.23, 0.6), { id, col: c, tone: 0.35, layer: 2, n: 8 });
    leaf(F, org, [[0.5, 0], [0.8, 0.01], [1.0, 0]], spindle(0.15, 0.5), { id, col: c, tone: 0.3, layer: 2.2, n: 6 });
    leaf(F, org, [[0.95, 0], [1.1, 0.01], [1.2, -0.02]], (t) => 0.04 * (1 - 0.7 * t), { id, col: white, tone: 1, layer: 2.4, n: 4 });
  },
  // the skeleton of a great ground sloth lying in its bed: bone left as paper inside a dark line
  skeleton(F, org, id, S, rng) {
    const bone = new THREE.Color(1, 0.97, 0.9), dk = thin(S.pal[1], 0.75);
    const o = (layer, n = 5) => ({ id, col: bone, tone: 0.08, layer, n });
    const knob = (w) => (t) => w * (0.7 + 0.6 * (2 * t - 1) * (2 * t - 1)) * Math.sqrt(Math.min(1, 12 * t, 12 * (1 - t)));
    const sp = (t) => [2.6 - 5.6 * t, 1.55 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - 1.1 * t * t * t];
    for (let k = 0; k <= 24; k++) {                              // vertebrae: neck, back, tail
      const t = k / 24, q = sp(t), q2 = sp(Math.min(1, t + 0.02)), q1 = sp(Math.max(0, t - 0.02)), dx = q2[0] - q1[0], dy = q2[1] - q1[1], l = Math.hypot(dx, dy) || 1, ux = dy / l, uy = -dx / l;
      const h = 0.22 * (1 - 0.7 * clamp((t - 0.6) / 0.4, 0, 1)) * (t < 0.12 ? 0.7 : 1);
      leaf(F, org, [[q[0] - ux * h * 0.5, q[1] - uy * h * 0.5], [q[0] + ux * h, q[1] + uy * h]], spindle(0.085, 0.4), o(1, 4));
    }
    for (let k = 0; k < 9; k++) {                                // ribs
      const q = sp(0.2 + k * 0.036), d = 0.03 * k;
      leaf(F, org, [[q[0], q[1] - 0.05], [q[0] + 0.14, q[1] - 0.55], [q[0] - 0.05, q[1] - 1.0 + d], [q[0] - 0.3, q[1] - 1.15 + d]], (t) => 0.045 * (1 - 0.5 * t), o(0.5, 7));
    }
    leaf(F, org, [[2.5, 1.62], [3.05, 1.55], [3.55, 1.3]], spindle(0.3, 0.6), o(2, 8));                 // skull
    leaf(F, org, [[2.7, 1.3], [3.1, 1.14], [3.5, 1.1]], (t) => 0.09 * (1 - 0.4 * t), o(1.5, 6));          // jaw
    leaf(F, org, [[2.95, 1.62], [2.98, 1.63]], spindle(0.07), { id, col: dk, tone: 1, layer: 2.5, n: 4 });
    leaf(F, org, [[1.5, 1.9], [1.25, 1.32]], spindle(0.2, 0.5), o(1.2, 6));                                // shoulder blade
    leaf(F, org, [[1.3, 1.34], [1.52, 0.76]], knob(0.1), o(2, 6)); leaf(F, org, [[1.52, 0.76], [1.3, 0.2]], knob(0.075), o(2.1, 6));
    leaf(F, org, [[-1.0, 1.78], [-1.5, 1.46], [-1.92, 1.3]], spindle(0.34, 0.5), o(1.2, 8));              // pelvis
    leaf(F, org, [[-1.4, 1.38], [-1.14, 0.72]], knob(0.13), o(2, 6)); leaf(F, org, [[-1.14, 0.72], [-1.46, 0.2]], knob(0.09), o(2.1, 6));
    for (const [fx, fy] of [[1.3, 0.2], [-1.46, 0.2]]) for (let c = 0; c < 3; c++)                         // claws
      leaf(F, org, [[fx, fy], [fx + 0.3, fy - 0.08 - c * 0.05], [fx + 0.55 - c * 0.08, fy - 0.2]], (t) => 0.05 * (1 - 0.8 * t), o(2.3 + c * 0.1, 5));
  },
};

// ---------------------------------------------------------------- ash plume and spindrift: engraved puffs
const PUFF_VERT = /* glsl */ `
attribute vec3 aBase; attribute vec3 aVel; attribute vec4 aSeed;
uniform float uTime, uPlume;
varying vec2 vQ; varying float vLife; varying float vSeed; varying float vDist; varying float vKind;
${FOG_V}
void main(){
  float life = fract(uTime*aSeed.w + aSeed.x);
  float drift = step(aSeed.y, 1.);                         // 1: spindrift off the lip, 0: a curl of the plume
  vec3 c = aBase + aVel*life*mix(uPlume, 1., drift)
    + vec3(sin(life*5. + aSeed.x*40.), 0.3*sin(life*7. + aSeed.x*11.), cos(life*4. + aSeed.x*23.))*life*aSeed.z*0.45;
  float size = (aSeed.y + aSeed.z*life)*mix(uPlume, 1., drift)*smoothstep(0., 0.07, life)*(1. - smoothstep(0.8, 1., life));
  vec4 mvPosition = modelViewMatrix*vec4(c, 1.);
  mvPosition.xy += position.xy*size*vec2(1. + 1.5*drift, 1. - 0.6*drift);
  vQ = position.xy; vLife = life; vSeed = aSeed.x; vDist = length(mvPosition.xyz); vKind = drift;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */ `
varying vec2 vQ; varying float vLife; varying float vSeed; varying float vDist; varying float vKind;
uniform vec3 uGlow;
${PLATE_COMMON}
${FOG_F}
void main(){
  float d = length(vQ);
  float fd = max(fwidth(d), 1e-5);
  float fq = max(fwidth(vQ.x + vQ.y), 1e-5);
  float fy = max(fwidth(vQ.y), 1e-5);
  float ang = atan(vQ.y, vQ.x + 1e-5);
  // spindrift: a wisp of short level strokes and stipple streaming off the snow, thinning to nothing at its edge
  float body = 1. - smoothstep(0.25, 1., d);
  // (round 12) a ribbon is separate fine lines, never a bar: its rows are picked in octaves from the pixel's own size, as
  // the hatching's lines are, so that a ribbon seen small draws fewer of its rows (its neighbours stay six pixels and
  // more apart, the odd rows thinning out toward the next octave), and each line is cut out of what lies behind it with
  // a margin of paper two pixels wide, not laid on a whole ribbon of paper.
  float lr = max(log2(max(48.*fy, 1e-4)), 0.);
  float lo = floor(lr), fr = lr - lo, PR = exp2(lo);
  float tr = clamp(vQ.y, -1., 1.)*8./PR, kr = floor(tr + 0.5);
  float wr = mix(1., 1. - fr, step(0.5, mod(kr, 2.)));
  float row = kr*PR;
  float dash = step(1. - 0.75*body, vnoise(vec2(vQ.x*6. - vLife*9. + row*3.7, row*1.3 + vSeed*31.)))*step(0.3, wr);
  float lineC = (tr - kr)*PR/8.;
  float wisp = lineAA(lineC, fy, 0.8)*dash;
  float ribbon = lineAA(lineC, fy, 2.8)*dash;
  // plume: a curl with a scalloped rim, a spiral stroke and shading on its underside
  float rim = 0.9 + 0.05*sin(ang*6. + vSeed*30.) + 0.03*sin(ang*11. + vSeed*70.) - d;
  float low = 1. - smoothstep(-0.6, 0.4, vQ.y + vQ.x*0.5);
  float ink = lineAA(rim, fd, 1.0 + 1.2*low);
  float c = d*2.3 + ang/6.28318 - vLife*2.2 + vSeed*9.;
  float curl = lineAA((abs(fract(c) - 0.5))/2.3, fd, 0.6)*step(d, 0.72)*smoothstep(0.08, 0.2, d);
  curl *= step(0.25, fract(ang/6.28318*3. + vSeed*5. + d));
  float sh = hatch(vQ.x - vQ.y, fq, 0.05, 1., 0.42).x*low*smoothstep(0.2, 0.55, d);
  ink = max(max(ink, curl*0.8), sh*0.8);
  if (vKind > 0.5 ? (wisp < 0.4 && ribbon < 0.5) : rim < 0.) discard;
  // the second plate: a flat grey-brown on the side away from the sun, at any distance; the crater's light on the youngest curls
  vec3 ashT = mix(vec3(1.), uShade*vec3(0.92, 0.86, 0.84), 0.3 + 0.62*low);
  ashT = mix(ashT, uGlow, (1. - smoothstep(0.04, 0.42, vLife))*(0.55 + 0.45*low));
  vec3 col = plate(ashT, 1. - vKind, mix(ink, 0.75*step(0.4, wisp), vKind), vDist);
  ${FRAG_END}
}`;

function buildPuffs(rng, HF, S, shared, rare) {
  const base = [], vel = [], seed = [];
  const floorY = HF.heightAt(-10, -4), nP = rare ? 84 : 56;
  for (let i = 0; i < nP; i++) {
    base.push(-12 + rng.range(-9, 5), floorY + 6, -6 + rng.range(-10, 10));
    vel.push(-95 - rng() * 60, 255 + rng() * 85, -25 - rng() * 40);
    seed.push(i / nP + rng() * 0.01, 9, rng.range(52, 92), rng.range(0.019, 0.024));
  }
  // (round 12) no spindrift is born where it would stream across the ring. The wind takes every ribbon west-north-west,
  // so one born east of the straight line from the foot of the last run to the ring's centre (x = NOTCH_X) crosses it, and
  // one born just west of it lies half across the disc. So a ribbon's base stands at least 12 m west of that line (the
  // ring's 7 m radius, the 2 m a ribbon reaches east of its base while it is still small, and 3 m to spare): one that falls
  // nearer is moved the same distance beyond that margin, unless it sits on the head of a horn 13.5 m and more above the
  // ring's centre (the ring's radius, a ribbon's half height of 4.5 m and 2 m to spare), where it streams over the ring.
  const MARG = 12, zRing = R0 - 14, zFoot = R0 + 62 * Math.cos(PITCH) + 14;
  const clearBase = (x, z, lift) => {
    if (z > zRing && z < zFoot && x > NOTCH_X - MARG && HF.heightAt(x, z) + lift < 440 + 13.5) x = 2 * (NOTCH_X - MARG) - x;
    return x;
  };
  for (let i = 0; i < 16; i++) {                       // spindrift off the lip and the horns
    const a = rng.range(-1.2, 1.5), r = R0 + rng.range(-2, 5), z = r * Math.sin(a), x = clearBase(-r * Math.cos(a), z, 1.5);
    base.push(x, HF.heightAt(x, z) + 1.5, z);
    vel.push(-32 - rng() * 20, 5 + rng() * 6, -22 - rng() * 14);
    seed.push(rng(), 0.6, rng.range(3.5, 7), rng.range(0.11, 0.2));
  }
  // (round 5) long ribbons streaming west off the heads of the two horns, and low ones across the snow either side of the
  // last run into the notch. They draw from a stream of their own.
  const sr = makeRng(0x9e3779b1);
  let nX = 0;
  for (let h = 0; h < 2; h++) for (let i = 0; i < 4; i++, nX++) {
    const z = R0 + (h ? -1 : 2) + sr.range(-1, 4), x = clearBase((h ? NOTCH_X - 12.5 : NOTCH_X + 12) + sr.range(-2.5, 1), z, 0.6);
    base.push(x, HF.heightAt(x, z) + 0.6, z);
    vel.push(-34 - sr() * 16, 2 + sr() * 5, -3 - sr() * 9);
    seed.push(sr(), 0.95, sr.range(6.5, 10), sr.range(0.1, 0.16));
  }
  for (let i = 0; i < 10; i++, nX++) {
    const right = i % 2 === 0, x0 = right ? sr.range(-6, -2.5) : sr.range(-34, -24), z = sr.range(58, 108), x = clearBase(x0, z, 1.1);
    base.push(x, HF.heightAt(x, z) + 1.1, z);
    vel.push(-15 - sr() * 9, 5.5 + sr() * 2.5, -8 - sr() * 5);
    seed.push(sr(), 0.8, sr.range(3, 5), sr.range(0.12, 0.2));
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3));
  g.setAttribute('aVel', new THREE.InstancedBufferAttribute(new Float32Array(vel), 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seed), 4));
  g.instanceCount = nP + 16 + nX;
  const mat = plateMaterial(shared, { uPlume: { value: rare ? 1.5 : 1 }, uGlow: { value: thin(S.pal[6], rare ? 0.85 : 0.65) } }, PUFF_VERT, PUFF_FRAG);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return { mesh: m, top: new THREE.Vector3(-110, floorY + 230 * (rare ? 1.5 : 1), -45) };
}

// ---------------------------------------------------------------- (round 11) the arenal's cushions and the rock of the summit
// an Azorella cushion, the green boulder of the arenal: three fused mounds of unequal size, each ringed by its own contours
// and outlined, a tone darker where it meets the ash, no two the same green. About 3.4 m across and 1.3 m high at scale 1.
function azorellaGeometry(rng, S) {
  const A = makeAcc(), greens = [S.green.clone(), S.green.clone().lerp(S.olive, 0.5), S.green.clone().lerp(S.gamb, 0.2)];
  const lobe = (rx, ry, sides, rings, ox, oz, col, tone) => {
    const n0 = A.n;
    accDome(A, rx, ry, sides, rings, 0.2, rng, col, tone, 9, 0, 0);
    for (let i = n0; i < A.n; i++) {
      const y = A.pos[i * 3 + 1];
      A.pos[i * 3] += ox; A.pos[i * 3 + 1] = y - 0.1; A.pos[i * 3 + 2] += oz; A.uv[i * 2] += n0 * 0.37; A.uv[i * 2 + 1] = y * 1.6;
      if (y < 0.16 * ry) A.info[i * 4] += 0.32;                  // a dark foot where the cushion meets the ground
    }
  };
  lobe(1.5, 1.4, 9, 3, 0, 0, greens[0], 0.2);
  lobe(1.0, 1.0, 7, 2, 1.25, 0.5, greens[1], 0.27);
  lobe(0.8, 0.85, 6, 2, -1.0, 0.85, greens[2], 0.18);
  return accGeometry(A);
}

// The rock of the ribs, drawn as the plate draws rock. A rib is a chain of rough masses along a fall line, each a ball of
// rock cut by joint planes into flat facets of unequal size. Every facet has its own direction of stroke, so the light picks
// whole planes: a facet turned to the light is ruled openly one way, one in half light is ruled close, one turned away is
// crossed under the verditer of the shade. An arete between two facets is a firm line where the rock turns sharply and a
// broken hairline where it hardly turns; the foot, where the rock stands in the ground, is a tone darker; snow lies on what
// faces up toward the head, above the snowline only.
// Vertex data: uv = (stroke coordinate, bedding coordinate) in metres; aCol = metres from each of the triangle's three edges;
// aWide = the weight of the line along each of those edges (-1 none: the two faces lie in one plane); aInfo = (cross-stroke
// coordinate, height in the rock 0..1, the facet's own turn to the light, the triangle's least height in metres);
// aEdge = metres above the ground the rock stands in.
const RIB_VERT = /* glsl */ `
attribute vec3 aCol; attribute vec4 aInfo; attribute vec3 aWide; attribute float aEdge;
varying vec2 vUv; varying vec3 vBar; varying vec3 vEw; varying vec3 vN; varying vec4 vInfo;
varying float vDist; varying float vFoot; varying float vY;
uniform float uRibGrow;                          // (round 12) 0: sunk out of sight under the ground, 1: standing
${FOG_V}
void main(){
  vec4 mvPosition = modelViewMatrix*vec4(position.x, position.y - (1. - uRibGrow)*14., position.z, 1.);
  vN = normal; vUv = uv; vBar = aCol; vEw = aWide; vInfo = aInfo; vFoot = aEdge; vY = position.y;
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIB_FRAG = /* glsl */ `
varying vec2 vUv; varying vec3 vBar; varying vec3 vEw; varying vec3 vN; varying vec4 vInfo;
varying float vDist; varying float vFoot; varying float vY;
uniform float uRibAsh, uRibSnow;                 // falling ash on the snow of the heads; the height the snow begins at
${PLATE_COMMON}
${FOG_F}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  // every derivative first
  float fs = max(fwidth(vUv.x), 1e-5), fx = max(fwidth(vInfo.x), 1e-5), fuv = max(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-5);
  vec3 fbar = max(fwidth(vBar), vec3(1e-5));
  float foot = 1. - smoothstep(0.05, 1.1, vFoot), ffo = clamp(fwidth(foot), 1e-4, 0.3);
  float hf = clamp(vInfo.y, 0., 1.);
  // one fixed light, the plate's own: what is turned to it is ruled openly, half light is ruled close, what is turned
  // away or stands in the ground is crossed. So every rib is a dark mass with one lighter flank.
  float l = dot(n, normalize(uSun + vec3(0., 0.25, 0.))) + vInfo.z - 0.5*foot - 0.28;
  float fl = 0.6*ffo + 0.02;
  float lit = smoothstep(0.62 - fl, 0.62 + fl, l), dark = 1. - smoothstep(0.08 - fl, 0.08 + fl, l), mid = (1. - lit)*(1. - dark);
  // snow lies on the facets that face up, more of them toward the head, down to a ragged line: never on a wall of the rock
  float capA = 1.3*n.y - 0.78 + 0.9*(hf - 0.7) + 0.25*(vnoise(vUv*1.1 + 7.) - 0.5);
  float fca = clamp(fwidth(capA), 1e-4, 0.5);
  float cap = smoothstep(-fca, fca, capA)*smoothstep(uRibSnow - 6., uRibSnow + 6., vY);
  // strokes; from far off, where a facet is only a few strokes wide, the ruling gives way to an even half-tone, one flat
  // step to each of the three lights, so that a rib far up the slope still stands dark on the ash and the snow
  float str = hatch(vUv.x, fs*0.75, 0.36, 0.5, mix(0.42, 0.9, 1. - lit)).x;
  float crs = hatch(vInfo.x, fx*0.75, 0.36, 0.5, 0.82).x;
  float bc = vUv.y + 0.22*vnoise(vec2(vUv.x*0.55, vUv.y*0.4 + 2.)), fbc = max(fwidth(bc), 1e-5);
  float bed = hatch(bc, fbc, 0.5, 1.4, 0.2).x*step(0.24, vnoise(vec2(bc*1.3 + 3., vUv.x*0.3)));
  float ck = vnoise(vec2(vUv.x*0.5 + 11., vInfo.x*0.5 + vUv.y*0.21)), fck = clamp(fwidth(ck), 1e-4, 0.5);
  float crack = lineAA(ck - 0.5, fck, 0.75)*(1. - smoothstep(0.1, 0.25, fck))*0.85;
  float ink = lit*max(str*0.8, bed*0.7) + mid*max(str, bed*0.5) + dark*(1. - (1. - str)*(1. - crs*0.92));
  ink = max(ink, crack);
  // aretes: all of them hairlines when the facet is only a few pixels across
  vec3 eb = vBar/fbar;
  float facePx = vInfo.w/max(max(fbar.x, fbar.y), fbar.z);
  float small = 1. - smoothstep(5., 14., facePx);
  vec3 ew = clamp(vEw, 0., 1.);
  vec3 hw = mix(vec3(0.12), vec3(0.5), ew)*mix(1., 0.6, small);
  float hair = step(0.34, vnoise(vec2(vUv.y*1.9, 3.7)));
  vec3 el = (1. - smoothstep(hw - 0.5, hw + 0.5, eb))*step(vec3(-0.5), vEw)*mix(vec3(0.4*hair), vec3(1.), smoothstep(vec3(0.2), vec3(0.6), ew));
  float edges = max(max(el.x, el.y), el.z);
  ink = max(ink, edges);
  ink = mix(ink, max(edges*0.8, lineAA(capA, fca, 0.8)*0.8), cap);
  // (round 12) falling ash lies on the snow of the heads as stipple, as it does on the snowfields: no grey wash
  vec2 ag = vUv*2.4; vec2 ai = floor(ag);
  float ad = length(fract(ag) - 0.5 - 0.35*(vec2(h21(ai), h21(ai + 3.)) - 0.5));
  ink = max(ink, (1. - smoothstep(0.11, 0.2, ad))*step(h21(ai + 9.), 0.6*uRibAsh)*cap*0.78*(1. - smoothstep(0.1, 0.28, fuv*2.4)));
  // the wash is the ink of the visit, thinned, under the verditer of the shade on what is turned away
  vec3 hT = uHalf/max(uPaper, vec3(0.05));
  vec3 tint = mix(vec3(1.), hT, dark*0.92 + mid*0.74 + lit*0.5);
  tint *= mix(vec3(1.), uShade, dark*0.6 + mid*0.25);
  tint = mix(tint, vec3(1.), cap);
  vec3 col = plate(tint, 1., ink, vDist);
  ${FRAG_END}
}`;
// a ball of twelve or forty-two corners (an icosahedron, or one divided once), with the face across each edge of every face
function icoBall(level) {
  const t = (1 + Math.sqrt(5)) / 2, un = (p) => { const l = Math.hypot(p[0], p[1], p[2]); return [p[0] / l, p[1] / l, p[2] / l]; };
  const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(un);
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let l = 0; l < level; l++) {
    const mid = new Map(), nf = [];
    const m = (a, b) => { const k = a < b ? a * 4096 + b : b * 4096 + a; if (!mid.has(k)) { mid.set(k, v.length); v.push(un([v[a][0] + v[b][0], v[a][1] + v[b][1], v[a][2] + v[b][2]])); } return mid.get(k); };
    for (const [a, b, c] of f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  const own = new Map(), adj = f.map(() => [-1, -1, -1]);
  f.forEach((q, i) => { for (let e = 0; e < 3; e++) { const a = q[(e + 1) % 3], b = q[(e + 2) % 3], k = a < b ? a * 4096 + b : b * 4096 + a, o = own.get(k); if (o) { adj[i][e] = o[0]; adj[o[0]][o[1]] = i; } else own.set(k, [i, e]); } });
  return { v, f, adj };
}
// one rough mass of rock, in world space. P = { c: [x, y, z] its middle, r: [rx, ry, rz], cuts (how many joint planes are
// drawn at random), planes: [[nx, ny, nz, h]] (joints that are given), rough, taper (how far it narrows to its head),
// lean: [dx, dz] (metres its head stands off its foot), tilt: [about x, about z], yaw, teeth: [height, frequency] (a toothed
// crest along x) }. Below its middle it goes straight down into the ground, so no underside ever shows.
// G = { y, sx, sz, x, z, H }: the ground it stands in as a plane through (x, y, z) with slopes sx and sz, and the height of
// the whole rock (for the snow on its head); dip: its bedding.
const rockHash = (k) => { const s = Math.sin(k * 12.9898) * 43758.5453; return s - Math.floor(s); };
function rockBlob(A, rng, ico, P, G, dip) {
  const TAU = Math.PI * 2, nv = ico.v.length, pts = new Array(nv), cx = P.c[0], cy = P.c[1], cz = P.c[2], rx = P.r[0], ry = P.r[1], rz = P.r[2], rough = P.rough ?? 0.2;
  const lob = [];
  for (let i = 0; i < 3; i++) { const a = rng() * TAU, e = rng.range(-0.8, 0.8); lob.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), rng() * TAU, rng.range(2.2, 3.6)]); }
  const planes = (P.planes || []).map((q) => { const l = Math.hypot(q[0], q[1], q[2]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3]]; });
  for (let i = 0, n = P.cuts ?? 6; i < n; i++) { const a = rng() * TAU, my = rng.range(-0.25, 0.8), k = Math.sqrt(1 - my * my); planes.push([Math.cos(a) * k, my, Math.sin(a) * k, rng.range(0.5, 0.8)]); }
  const tl = P.tilt || [0, 0], c0 = Math.cos(tl[0]), s0 = Math.sin(tl[0]), c1 = Math.cos(tl[1]), s1 = Math.sin(tl[1]), yw = P.yaw ?? 0, cw = Math.cos(yw), sw = Math.sin(yw);
  const taper = P.taper ?? 0, lean = P.lean || [0, 0], teeth = P.teeth || [0, 1], tph = rng() * TAU;
  for (let i = 0; i < nv; i++) {
    const d = ico.v[i];
    let x = d[0], y = d[1], z = d[2], k = 1;
    if (y < 0) { const s = 1 / Math.max(Math.hypot(x, z), 0.45); x *= s; z *= s; }
    for (const q of lob) k += (rough / 3) * Math.sin(q[4] * (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) + q[3]);
    k += rough * 0.4 * (rng() - 0.5);
    x *= k; y *= k; z *= k;
    for (const q of planes) { const t = x * q[0] + y * q[1] + z * q[2] - q[3]; if (t > 0) { x -= q[0] * t; y -= q[1] * t; z -= q[2] * t; } }
    const tp = 1 - taper * smoothstep(-0.35, 1, y), hk = clamp(0.5 + 0.5 * y, 0, 1);
    x *= rx * tp; z *= rz * tp;
    y *= ry * (1 + teeth[0] * Math.sin(x * teeth[1] + tph) * smoothstep(0, 0.6, y));
    const y1 = y * c0 - z * s0, z1 = y * s0 + z * c0, x2 = x * c1 - y1 * s1, y2 = x * s1 + y1 * c1;
    const x3 = x2 + lean[0] * hk * hk, z3 = z1 + lean[1] * hk * hk;
    pts[i] = [cx + x3 * cw - z3 * sw, cy + y2, cz + x3 * sw + z3 * cw];
  }
  const nf = ico.f.length, fn = new Array(nf);
  for (let i = 0; i < nf; i++) {
    const q = ico.f[i], a = pts[q[0]], b = pts[q[1]], c = pts[q[2]];
    const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const nl = Math.hypot(nx, ny, nz);
    fn[i] = nl < 1e-6 ? null : [nx / nl, ny / nl, nz / nl, nl];
  }
  const foot = (p) => p[1] - (G.y + G.sx * (p[0] - G.x) + G.sz * (p[2] - G.z));
  for (let i = 0; i < nf; i++) {
    const N = fn[i], q = ico.f[i];
    if (!N || (ico.v[q[0]][1] < -0.6 && ico.v[q[1]][1] < -0.6 && ico.v[q[2]][1] < -0.6)) continue;      // (its underside, deep in the ground)
    const tri = [pts[q[0]], pts[q[1]], pts[q[2]]];
    if (foot(tri[0]) < -0.4 && foot(tri[1]) < -0.4 && foot(tri[2]) < -0.4) continue;                    // (and what lies under the ground)
    // the facet's own frame, taken from its normal alone, so that faces lying in one plane are ruled as one
    const key = Math.round(N[0] * 40) * 131.3 + Math.round(N[1] * 40) * 17.7 + Math.round(N[2] * 40) * 7.1 + cx * 3.3 + cy * 1.7;
    // (the strokes run down the fall of the facet, a little out of true; the crossing lines lie aslant over them)
    const sg = rockHash(key) < 0.5 ? -1 : 1, phi = sg * (0.08 + 0.3 * rockHash(key + 1.3)), ph2 = phi + sg * (0.85 + 0.25 * rockHash(key + 2.7));
    const o1 = 3 * rockHash(key + 4.1), o2 = 3 * rockHash(key + 5.9), lj = 0.2 * (rockHash(key + 7.3) - 0.5);
    let sx = N[2], sy = 0, sz = -N[0], sl = Math.hypot(sx, sz);
    if (sl < 0.15) { sx = 1 - N[0] * N[0]; sy = -N[0] * N[1]; sz = -N[0] * N[2]; sl = Math.hypot(sx, sy, sz); }
    sx /= sl; sy /= sl; sz /= sl;
    const tx = N[1] * sz - N[2] * sy, ty = N[2] * sx - N[0] * sz, tz = N[0] * sy - N[1] * sx;
    const ca = Math.cos(phi), sa = Math.sin(phi), cb = Math.cos(ph2), sb = Math.sin(ph2);
    const alt = [0, 0, 0], wgt = [0, 0, 0];
    for (let e = 0; e < 3; e++) {
      const a = tri[(e + 1) % 3], b = tri[(e + 2) % 3], M = fn[ico.adj[i][e]];
      alt[e] = N[3] / Math.max(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), 1e-5);
      const turn = M ? Math.acos(clamp(N[0] * M[0] + N[1] * M[1] + N[2] * M[2], -1, 1)) : 1;
      wgt[e] = turn < 0.1 ? -1 : smoothstep(0.15, 0.65, turn);
    }
    const least = Math.min(alt[0], alt[1], alt[2]), i0 = A.n;
    for (let e = 0; e < 3; e++) {
      const p = tri[e], ps = p[0] * sx + p[1] * sy + p[2] * sz, pt = p[0] * tx + p[1] * ty + p[2] * tz, ft = foot(p);
      vtx(A, p, N, ps * ca + pt * sa + o1, p[1] + dip[0] * p[0] + dip[1] * p[2], { r: e === 0 ? alt[0] : 0, g: e === 1 ? alt[1] : 0, b: e === 2 ? alt[2] : 0 },
        ps * cb + pt * sb + o2, clamp(ft / G.H, 0, 1), lj, least, Math.max(ft, 0), wgt);
    }
    A.idx.push(i0, i0 + 1, i0 + 2);
  }
}

// ---------------------------------------------------------------- the hero
// The seven plates, in the order they pass. u: the journey position its moment is staged for; ahead: how far up
// the camera line (m) its box then lies, so that the figure wakes inside the frame and not abeam; s: how much
// larger than life; half: half-size of its ruled box before scaling. Three are passive: they take their wash,
// stir on the paper and stay (the butterfly flutters up as we pass).
const SPECS = [
  { name: 'orchid', u: 0.335, ahead: 34, s: 2.8, half: [1.6, 1.9] },
  { name: 'hummingbird', u: 0.372, ahead: 20, s: 2.3, half: [2.4, 1.9] },
  { name: 'butterfly', u: 0.412, ahead: 0, s: 2.0, half: [2.0, 1.9] },
  { name: 'tapir', u: 0.43, ahead: 30, s: 2.4, half: [2.3, 1.6] },
  { name: 'beetle', u: 0.468, ahead: 34, s: 2.3, half: [1.7, 1.9] },
  { name: 'cinchona', u: 0.575, ahead: 14, s: 2.2, half: [1.7, 1.9] },
  { name: 'cockrock', u: 0.615, ahead: 14, s: 2.3, half: [1.8, 1.9] },
  // round 3: a second row of plates lower on the face (z: where on the page; dy: metres from the camera line)
  { name: 'frog', z: 628, dy: -16, s: 3.0, half: [2.0, 1.15], lead: 0.1 },
  { name: 'toucan', z: 554, dy: -19, s: 2.8, half: [1.8, 1.55], lead: 0.1 },
  { name: 'fern', z: 528, dy: -21, s: 3.0, half: [1.9, 1.9], lead: 0.1 },
  { name: 'quetzal', z: 506, dy: -24, s: 3.0, half: [1.6, 2.2], lead: 0.1 },
];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('cut-mountain-hero'), noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const S = inkSetup(opts, rng);
  const V = { gul: rng.range(4.2, 6.6), o1: rng.range(0, 50), o2: rng.range(0, 50), horn0: rng.range(12, 18), horn1: rng.range(11, 17) };
  const rare = opts.rare ?? rng.chance(1 / 9);
  const bloom = opts.bloom !== undefined ? opts.bloom : rng.pick(['puya', 'frailejon', null]);
  const HF = makeHeight(noise, V), rr = ringRadii(), H0 = (z) => Math.max(HF.heightAt(0, z), 0.3);
  const shared = plateUniforms(S, opts);
  const group = new THREE.Group(); group.name = 'cut-mountain-hero';

  // (round 11) the rock ribs' rule: phases from a stream of their own
  const ribR = makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x1b873593) >>> 0), ribU = new THREE.Vector4(ribR() * 6.2831853, ribR() * 6.2831853, ribR() * 6.2831853, ribR() * 6.2831853);
  const ribField = makeRibField(ribU, HF);
  // ground of the living half
  const groundMat = plateMaterial(shared, { uGreen: { value: S.green }, uOlive: { value: S.olive }, uAsh: { value: S.ash },
    uGamb: { value: S.gamb }, uAshFall: { value: rare ? 1 : 0 }, uSnowDrop: { value: opts.snowDrop || 0 },
    uVerm: { value: S.verm }, uFlow: { value: new THREE.Vector4(rare ? 610 : 480, 1, rare ? 1.35 : 1, 0) }, uRib: { value: ribU } }, TERRAIN_VERT, TERRAIN_FRAG);
  const flowAt = (x, z) => flowEdge(x, z, rare ? 610 : 480, rare ? 1.35 : 1);
  const offFlow = (p) => flowAt(p.x, p.z) > 3.5 + (p.s || 1), offFlowWide = (p) => flowAt(p.x, p.z) > 10;       // nothing grows in the stream
  const ground = new THREE.Mesh(await buildGround(ctx, HF, rr, S.sun), groundMat); ground.frustumCulled = false; group.add(ground);
  await ctx.yield();

  // layout on the page
  const fly = makeFlyThrough(HF), LEN = fly.Lold, sI = (i) => Math.round(fly.fromLegacy(i / 300) * 300);       // staging runs in legacy u
  const gr = makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x51ed27) >>> 0), fr = makeRng((((ctx.seed ?? 1) >>> 0) ^ 0x2f6e2b1) >>> 0);       // shapes draw from their own stream: the sites keep theirs
  const lineAt = (u, out) => { const f = clamp(fly.fromLegacy(u), 0, 1) * 300, k = Math.min(299, Math.floor(f)); return out.lerpVectors(fly.samples[k], fly.samples[k + 1], f - k); };
  const _q = new THREE.Vector3(), _q0 = new THREE.Vector3();
  // the camera line over the page run: its height at a given z, and the u at which it is level with that z
  const iAtZ = (z) => { let b = 100, bd = 1e9; for (let i = sI(80); i < sI(215); i++) { const d = Math.abs(fly.samples[i].z - z); if (d < bd) { bd = d; b = i; } } return b; };
  const yLine = (z) => fly.samples[iAtZ(z)].y, uAtZ = (z) => fly.toLegacy(iAtZ(z) / 300);
  const boxes = SPECS.map((sp, i) => {
    const bu = sp.z !== undefined ? uAtZ(sp.z) : sp.u + sp.ahead / LEN, q = lineAt(bu, _q), z = q.z, hw = sp.half[0] * sp.s, hh = sp.half[1] * sp.s;
    if (i < 4) rng();
    const y = sp.dy !== undefined ? q.y + sp.dy : Math.min(q.y - 2, H0(z) - 5.5 - hh, H0(z + hw) - 5.5 - hh, H0(z - hw) - 5.5 - hh);
    return { name: sp.name, u: sp.u ?? bu, s: sp.s, bu, z, y, hw, hh, base: y - hh * 0.72, tilt: 0, lead: sp.lead ?? 0.045, kind: 'plate' };
  });
  // the tapir's ledge: a strip of blank paper that leaves its box and climbs with the camera line
  const tp = boxes[3], LEDGE = 24;
  { const a = lineAt(tp.bu + tp.hw / LEN, _q0), b = lineAt(tp.bu + (tp.hw + LEDGE) / LEN, _q); tp.tilt = Math.atan2(b.y - a.y, Math.max(a.z - b.z, 1)); }
  const zAt = (u) => fly.samples[Math.round(fly.fromLegacy(u) * 300)].z;
  // waterfalls run down free columns of the face: south of the run, between the toucan's plate and the tapir's, north of the beetle's
  const fz = [792 + rng.range(-14, 10), tp.z + tp.hw + 5 + rng.range(-0.5, 0.5), boxes[4].z - boxes[4].hw - 6.5 + rng.range(-0.5, 0.5)];
  const falls = fz.map((z, i) => ({ z, top: H0(z) - 0.4, foot: 0, hw: [1.7, 2.0, 2.4][i] * rng.range(0.9, 1.15) }));
  const hb = boxes[1];
  const flower = new THREE.Vector3(0, H0(hb.z - 9) - 1.6, hb.z - 9);
  // three dykes cross the section between the plates, each carrying a thread of the conduit's vermilion
  const dykes = [[0.402, 0.46, 0.75], [0.4265, 0.36, 0.6], [0.53, 0.52, 0.7]].map(([u, lean, hw]) => { const q = lineAt(u, _q); return new THREE.Vector4(-q.z, q.y - 2, lean, hw); });
  const craterFloor = HF.heightAt(-1, 0);
  // caves and burrows (page shader) and who lives in them (figures). dy: metres from the camera line; top: metres under the edge
  const caves = [
    { z: zAt(0.386), dy: -23, rx: 15, ry: 8, dark: 1 },          // the guacharo cave under the hummingbird's plate
    { z: 398, top: 39, rx: 14.5, ry: 8.5, dark: 1 },            // a second vault high on the face, seen from out over the drop
    { z: zAt(0.349), top: 10.5, rx: 5.6, ry: 3.3, dark: 0 },     // burrows in the upper beds
    { z: zAt(0.4285), top: 11.5, rx: 4.8, ry: 3.1, dark: 0 },
    { z: 470, top: 12.5, rx: 5.6, ry: 3.3, dark: 0 },
    { z: 396, top: 12, rx: 4.8, ry: 3.1, dark: 0 },
  ].map((c) => ({ ...c, y: c.top !== undefined ? H0(c.z) - c.top : yLine(c.z) + c.dy }));
  // the side conduit: its vent on the flank at z = 436, leaning back toward the chamber as it goes down
  const VENT_Z = 436, ventTop = H0(VENT_Z), LEAN = -0.3;
  const lavaU = new THREE.Vector4(-VENT_Z - LEAN * ventTop, LEAN, 3.4, ventTop - 12);
  // residents: figures that stay on the paper. Those that keep still share one id; each flyer has its own
  const ST = NBOX, res = [
    { name: 'armadillo', id: ST, z: caves[2].z + 0.4, base: caves[2].y - caves[2].ry * 0.66, s: 2.0, flip: 1 },
    { name: 'snake', id: ST, z: caves[3].z, base: caves[3].y - caves[3].ry * 0.74, s: 1.9, flip: 1 },
    { name: 'armadillo', id: ST, z: caves[4].z - 0.4, base: caves[4].y - caves[4].ry * 0.66, s: 2.0, flip: -1 },
    { name: 'snake', id: ST, z: caves[5].z, base: caves[5].y - caves[5].ry * 0.74, s: 1.9, flip: -1 },
    { name: 'skeleton', id: ST, z: 567, base: yLine(567) - 13.5, s: 2.4, flip: 1 },
    { name: 'skeleton', id: ST, z: 368, base: H0(368) - 52, s: 3.2, flip: 1 },
  ];
  const flyers = [];
  for (let k = 0; k < 6; k++) {
    const c = caves[k < 4 ? 0 : 1], f = { name: 'oilbird', id: ST + 1 + k, z: c.z + (fr() - 0.5) * c.rx * 0.5, base: c.y + (fr() - 0.3) * c.ry * 0.3, s: 1.7 + 0.5 * fr(), flip: 1,
      ay: c.ry * (0.16 + 0.2 * fr()), az: c.rx * (0.22 + 0.3 * fr()), w: (0.45 + 0.4 * fr()) * (k % 2 ? -1 : 1), ph: fr() * 6.28 };
    res.push(f); flyers.push(f);
  }
  const far4 = new THREE.Vector4(0, -999, 0, 0);
  const pageU = {
    uBox: { value: Array.from({ length: NBOX }, (_, i) => (boxes[i] ? new THREE.Vector4(-boxes[i].z, boxes[i].y, boxes[i].hw, boxes[i].hh) : far4.clone())) },
    uFall: { value: falls.map((f) => new THREE.Vector4(-f.z, f.top, f.foot, f.hw)) },
    uShadow: { value: [new THREE.Vector4(0, -99, 3, 0), new THREE.Vector4(0, -99, 3, 0)] },
    uConduit: { value: 0.4 }, uLip: { value: craterFloor }, uVerm: { value: S.verm }, uPageTone: { value: opts.pageTone || 0 },
    uFlower: { value: new THREE.Vector3(-flower.z, flower.y, 4.5) }, uSoil: { value: thin(S.olive.clone().lerp(S.pal[2], 0.45), 0.75) },
    uDyke: { value: dykes }, uLedge: { value: new THREE.Vector4(-tp.z + tp.hw, tp.base, Math.tan(tp.tilt), LEDGE) },
    uCave: { value: caves.map((c) => new THREE.Vector4(-c.z, c.y, c.rx, c.dark ? c.ry : -c.ry)) },
    uLava: { value: lavaU }, uGambP: { value: S.gamb },
  };
  const page = new THREE.Mesh(buildPage(HF, rr), plateMaterial(shared, pageU, PAGE_VERT, PAGE_FRAG)); page.frustumCulled = false; group.add(page);
  if (opts.plain !== false) { const plain = new THREE.Mesh(buildPlain(), plateMaterial(shared, {}, PAGE_VERT, PLAIN_FRAG)); plain.frustumCulled = false; group.add(plain); }
  await ctx.yield();

  // plants of the four zones, thickest along the seams where the camera flies
  const plantMat = plateMaterial(shared, { uWind: { value: new THREE.Vector2(0.55, -0.32) }, uFarTint: { value: 1 }, uGrow: { value: new THREE.Vector2(1, 1) } }, PLANT_VERT, PLANT_FRAG, { side: THREE.DoubleSide });
  // (round 12) three more of the same material, each with a size of its own (uGrow) that the world sets from the eye's
  // distance on the map from the mountain's axis: the upper mountain's fine plants (up), the plain frailejones that stand
  // for the fine ones while the eye is far off (far, its second number), and whatever of the valley is put away as the
  // upper mountain comes out (out). Nothing but uGrow differs; wind and far tint are shared.
  const plantLike = (x, y) => plateMaterial(shared, { uWind: plantMat.uniforms.uWind, uFarTint: plantMat.uniforms.uFarTint, uGrow: { value: new THREE.Vector2(x, y) } }, PLANT_VERT, PLANT_FRAG, { side: THREE.DoubleSide });
  const plantUp = plantLike(1, 1), plantFar = plantLike(1, 1), plantOut = plantLike(1, 1), ribGrow = { value: 1 };
  const thinN = (n) => Math.round(n * (0.5 + 0.5 * detail));
  // (round 4) as the line swings in over the forest (u 0.12 to 0.21) the gaze is on the smoking lip: no wax palm stands in that sight
  const lipSight = (p) => {
    // (round 11) eyes every 1.9 m of the route (half a sample), over the stretch the old eleven-metre eyes stood on
    for (let i = 36; i <= 63; i += 0.5) {
      const i0 = Math.floor(i), c = _q.lerpVectors(fly.samples[i0], fly.samples[Math.min(i0 + 1, 300)], i - i0), dx = p.x - c.x, dz = p.z - c.z, sx = -14 - c.x, sz = 44 - c.z, sl = Math.hypot(sx, sz);
      const along = (dx * sx + dz * sz) / sl, cross = (dx * sz - dz * sx) / sl;
      if (along > 0 && along < 95 && Math.abs(cross) < 0.15 * along + 1.5) return false;
    }
    return true;
  };
  const palms = scatter(rng, HF, fly, 196, { rMin: 690, rMax: 1120, lo: -5, hi: 64, seam: 0.5, south: 0.8, seamW: 60, edge: 3, rad: 5, h: 54, s0: 0.84, s1: 1.2 }).filter(lipSight);
  await ctx.yield();
  group.add(instancePlants(palmGeometry(rng, S), plantMat, palms, 0.5));
  await ctx.yield();
  const crowns = scatter(rng, HF, fly, 760, { rMin: 400, rMax: 730, lo: 56, hi: 196, seam: 0.4, south: 0.75, seamW: 70, edge: 6, rad: 8, h: 8, s0: 0.6, s1: 1.45 }).filter(offFlowWide);
  // the canopy patches nearest the camera line are built in small leaf masses with boughs; the rest stay simple
  const lineDist = (p) => { let b = 1e9; for (let i = sI(34); i < sI(200); i += 2) { const q = fly.samples[i], dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  crowns.forEach((p) => { p.ld = lineDist(p); });
  const byDist = crowns.slice().sort((p, q) => p.ld - q.ld), nNear = Math.min(150, byDist.findIndex((p) => p.ld > 85) < 0 ? 150 : byDist.findIndex((p) => p.ld > 85));
  const nearCr = byDist.slice(0, nNear), farCr = byDist.slice(nNear);
  nearCr.forEach((p) => { p.s = Math.min(p.s, 1.15); });
  await ctx.yield();
  // (round 12) the ground under the densest stands carries the darkest of its four densities of line: every corner of
  // the forest ground's mesh is told how much crown stands within 20 m of it on the map (each crown counted by its size,
  // whole within 6 m and fading to nothing at 20: the reach of a 14 m crown's shade on a slope), and the ground reads that
  // as shade from where a crown and a half's worth stand over it, whole at three. It is a rule of where the trees are,
  // nothing else.
  {
    const cell = new Map(), key = (i, j) => (i + 512) * 2048 + (j + 512), gp = ground.geometry.attributes.position, gt = ground.geometry.attributes.aTone;
    for (const c of crowns) { const k = key(Math.floor(c.x / 20), Math.floor(c.z / 20)); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(c); }
    for (let v = 0; v < gp.count; v++) {
      const x = gp.getX(v), z = gp.getZ(v), r2 = x * x + z * z;
      if (r2 < 330 * 330 || r2 > 900 * 900) continue;
      const i0 = Math.floor(x / 20), j0 = Math.floor(z / 20); let sum = 0;
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
        const list = cell.get(key(i, j)); if (!list) continue;
        for (const c of list) sum += c.s * (1 - smoothstep(6, 20, Math.hypot(c.x - x, c.z - z)));
      }
      gt.setY(v, smoothstep(1.6, 3.0, sum));
    }
    gt.needsUpdate = true;
  }
  await ctx.yield();
  group.add(instancePlants(crownGeometry(gr, S, true), plantMat, nearCr, 1.6));
  await ctx.yield();
  group.add(instancePlants(crownGeometry(gr, S, false), plantMat, farCr, 1.6));
  for (let k = 0; k < 12; k++) rng();
  await ctx.yield();
  const frail = scatter(rng, HF, fly, 1080, { rMin: 205, rMax: 440, lo: 186, hi: 318, seam: 0.5, south: 0.8, seamW: 38, edge: 1.2, rad: 1, h: 3.2, s0: 0.75, s1: 1.5, low: 1 }).filter(offFlow);
  const ridgeDist = (p) => { let b = 1e9; for (let i = sI(150); i < sI(270); i += 2) { const q = fly.samples[i], dx = q.x - p.x, dz = q.z - p.z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  await ctx.yield();
  frail.forEach((p) => { p.ld = ridgeDist(p); });
  const frNear = frail.filter((p) => p.ld < 36).sort((p, q) => p.ld - q.ld).slice(0, 380), nearSet = new Set(frNear);
  const frNearGeo = frailejonGeometry(gr, S, bloom === 'frailejon', true);
  const frNearMesh = instancePlants(frNearGeo, plantMat, frNear, 0.1); group.add(frNearMesh);
  await ctx.yield();
  const frFarGeo = frailejonGeometry(gr, S, bloom === 'frailejon', false);
  // (round 12) the plain form stands on the fine ones' sites too, in this same mesh, marked (snow: -1) so that the world
  // can fold those away as the fine ones come out (see plantFar above); it was a mesh of its own in round 11
  group.add(instancePlants(frFarGeo, plantFar, frail.filter((p) => !nearSet.has(p)).concat(frNear.map((p) => ({ ...p, snow: -1 }))), 0.1));
  frNearMesh.material = plantUp;
  for (let k = 0; k < 18; k++) rng();
  const puya = scatter(rng, HF, fly, 170, { rMin: 205, rMax: 440, lo: 190, hi: 318, seam: 0.6, south: 0.8, seamW: 45, edge: 1.5, rad: 1, h: 4, s0: 0.8, s1: 1.25, low: 1 }).filter(offFlow);
  puya.forEach((p) => { p.ld = ridgeDist(p); });
  const puNear = puya.filter((p) => p.ld < 42).sort((p, q) => p.ld - q.ld).slice(0, 46), puSet = new Set(puNear);
  group.add(instancePlants(puyaGeometry(gr, S, bloom === 'puya', true), plantMat, puNear, 0.1));
  await ctx.yield();
  group.add(instancePlants(puyaGeometry(rng, S, bloom === 'puya', false), plantMat, puya.filter((p) => !puSet.has(p)), 0.1));
  await ctx.yield();
  const cush = scatter(rng, HF, fly, thinN(300), { rMin: 130, rMax: 250, lo: 300, hi: 392, seam: 0.5, south: 0.8, seamW: 40, edge: 1.5, rad: 1.5, h: 1, s0: 0.5, s1: 1.6, low: 1 }).filter(offFlow);
  await ctx.yield();
  const rocks = scatter(rng, HF, fly, 150, { rMin: 48, rMax: 150, lo: 376, hi: 470, seam: 0.5, south: 0.8, seamW: 35, edge: 2, rad: 2, h: 1.5, s0: 0.7, s1: 2.6, low: 1 }).filter(offFlow);
  rocks.forEach((p) => { p.rock = 1; p.snow = 1; p.rot = 0.5 + gr.range(-0.5, 0.5); p.s *= 1.3; });
  const cushGeo = cushionGeometry(rng, S);
  await ctx.yield();
  group.add(instancePlants(rockGeometry(gr, S), plantMat, rocks, 0.12));
  await ctx.yield();
  // ------------------------------------------------------------ (round 11) the upper mountain, by rules of the ground
  // Everything placed below is placed by a rule of the ground's own height and slope and of the distance, on the map, from
  // the route's line. Each kind draws from a stream of its own, made from the world's seed after every stream above.
  const r11 = (c) => makeRng((((ctx.seed ?? 1) >>> 0) ^ c) >>> 0), SM = fly.samples, upper = [], upperFar = [];
  // the route's last leg as a line on the map: from where it stands furthest out over the drop to its end in the notch
  let iLeg = 300; while (iLeg > 1 && SM[iLeg - 1].x < 45) iLeg--;
  const legBox = [1e9, -1e9, 1e9, -1e9];
  for (let i = iLeg; i <= 300; i++) { const p = SM[i]; legBox[0] = Math.min(legBox[0], p.x); legBox[1] = Math.max(legBox[1], p.x); legBox[2] = Math.min(legBox[2], p.z); legBox[3] = Math.max(legBox[3], p.z); }
  // distance on the map from (x, z) to that line (exact, to its segments), where along it, and which side (left: the living side)
  const routeNear = (x, z, reach = 60) => {
    if (x < legBox[0] - reach || x > legBox[1] + reach || z < legBox[2] - reach || z > legBox[3] + reach) return { d: 1e3, i: iLeg, left: 1 };
    let b = 1e18, bi = iLeg, bs = 1;
    for (let i = iLeg; i < 300; i++) {
      const a = SM[i], c = SM[i + 1], ex = c.x - a.x, ez = c.z - a.z, t = clamp(((x - a.x) * ex + (z - a.z) * ez) / (ex * ex + ez * ez), 0, 1);
      const px = a.x + ex * t - x, pz = a.z + ez * t - z, d = px * px + pz * pz;
      if (d < b) { b = d; bi = i + t; bs = ex * (z - a.z) - ez * (x - a.x); }
    }
    return { d: Math.sqrt(b), i: bi, left: bs < 0 ? 1 : -1 };
  };
  const routeY = (i) => { const k = Math.min(299, Math.floor(i)); return lerp(SM[k].y, SM[k + 1].y, i - k); };
  const slopeAt = (x, z) => [(HF.heightAt(x + 1.5, z) - HF.heightAt(x - 1.5, z)) / 3, (HF.heightAt(x, z + 1.5) - HF.heightAt(x, z - 1.5)) / 3];
  const inNotch = (x, z, m) => z > 0 && z < 135 && Math.abs(x - NOTCH_X) < m;
  const cellOf = (x, z, w) => Math.floor(x / w + 4096) * 8192 + Math.floor(z / w + 4096);

  // -- frailejones over the whole paramo band (190 to 310 m), all round the living half: one rule of the ground's height,
  // seven times denser within 12 m of the route's line than 42 m and more from it; none on the line itself, none in the
  // stream, none where one stands already. (A new scatter, dealt from its own stream; the 1,080 of the site stay.)
  {
    const fq = r11(0x4cf5ad43), taken = new Set(frail.map((p) => cellOf(p.x, p.z, 2.4))), add = [];
    const band = (h) => smoothstep(188, 200, h) * (1 - smoothstep(300, 314, h));
    for (let t = 0; t < 12600; t++) {
      if (t % 1400 === 1399) await ctx.yield();
      const r = Math.sqrt(lerp(195 * 195, 455 * 455, fq())), th = fq.range(-1.5, 1.5), x = -r * Math.cos(th) - 2.5, z = r * Math.sin(th), u = fq();
      const y = HF.heightAt(x, z), b = band(y + 12 * (fq() - 0.5));
      if (u > b || taken.has(cellOf(x, z, 2.4))) continue;
      const rn = routeNear(x, z), near = 1 - smoothstep(12, 42, rn.d);
      if (rn.d < 3 || u > b * (0.07 + 0.93 * near)) continue;
      taken.add(cellOf(x, z, 2.4));
      add.push({ x, y, z, s: fq.range(0.75, 1.3) * (1 + 0.12 * near), rot: fq() * 6.2832, tone: fq.range(-0.08, 0.1), ph: fq() * 6.28, ld: rn.d });
    }
    const all = add.filter(offFlow).slice(0, 760);
    const nr = all.filter((p) => p.ld < 26).sort((p, q) => p.ld - q.ld).slice(0, 100), nrSet = new Set(nr);
    const m0 = instancePlants(frNearGeo.clone(), plantUp, nr, 0.1), m1 = instancePlants(frFarGeo.clone(), plantUp, all.filter((p) => !nrSet.has(p)), 0.1);
    group.add(m0, m1); upper.push(m0, m1);
    frail.r11 = all;
    // the site's own 380 fine frailejones by the line are drawn fine while the eye is near the mountain (with the rest of the
    // upper detail) and in the plain form, on the same sites, while it is far off down the valley (round 12: the plain
    // form is part of the site's far mesh above, and is folded away by its size, not switched)
    upper.push(frNearMesh);
  }
  await ctx.yield();

  // -- Azorella cushions over the whole arenal band (310 to 380 m), all round the living half: a rule of the ground's
  // height and slope (none on the steepest ground), eleven times more of them, and larger, beside the route's line than
  // far from it; they lie to the slope. The vicunas' trail (6.5 to 15.5 m left of the line) stays open ash.
  let cushNear = [], cushFar = [];
  {
    const cq = r11(0x5a827999), taken = new Set(), add = [];
    const band = (h) => smoothstep(308, 318, h) * (1 - smoothstep(372, 382, h));
    const trail = (rn) => rn.left > 0 && rn.d > 6.5 && rn.d < 15.5;
    const upOf = (g) => new THREE.Vector3(-g[0], 1, -g[1]).normalize();
    const old = cush.filter((p) => { p.rn = routeNear(p.x, p.z); return !trail(p.rn); });
    for (const p of old) { taken.add(cellOf(p.x, p.z, 4)); p.ld = p.rn.d; if (p.ld < 60) p.up = upOf(slopeAt(p.x, p.z)); }
    for (let t = 0; t < 2100; t++) {
      if (t % 700 === 699) await ctx.yield();
      const r = Math.sqrt(lerp(120 * 120, 262 * 262, cq())), th = cq.range(-1.5, 1.5), x = -r * Math.cos(th) - 2.5, z = r * Math.sin(th), u = cq();
      const y = HF.heightAt(x, z), b = band(y + 8 * (cq() - 0.5));
      if (u > b || inNotch(x, z, 13) || taken.has(cellOf(x, z, 4))) continue;
      const g = slopeAt(x, z), sl = Math.hypot(g[0], g[1]), rn = routeNear(x, z), near = 1 - smoothstep(10, 36, rn.d);
      if (rn.d < 4 || trail(rn) || u > b * (1 - smoothstep(0.8, 1.2, sl)) * (0.09 + 0.91 * near)) continue;
      taken.add(cellOf(x, z, 4));
      add.push({ x, y, z, s: cq.range(0.55, 0.95) * (1 + 0.5 * near) * (1.1 - 0.3 * smoothstep(0.5, 0.9, sl)), rot: cq() * 6.2832, tone: cq.range(-0.08, 0.1), ph: cq() * 6.28, ld: rn.d, up: upOf(g) });
    }
    const all = old.concat(add.filter(offFlow));
    cushNear = all.filter((p) => p.ld < 34).sort((p, q) => p.ld - q.ld).slice(0, 120);
    const nrSet = new Set(cushNear); cushFar = all.filter((p) => !nrSet.has(p));
    const m0 = instancePlants(azorellaGeometry(r11(0x6ed9eba1), S), plantUp, cushNear, 0.25), m1 = instancePlants(cushGeo, plantMat, cushFar, 0.25);
    group.add(m0, m1); upper.push(m0);
  }
  await ctx.yield();

  // -- the rock ribs: bodies of rock standing on the ground's own rib rule (ribField, the same rule the ground is drawn
  // by). Each rib's fall line is found from the rule; rock masses stand along it wherever the rule says the rib is out of
  // the snow, their long axes down the slope, a broken crest 1.5 to 4 m proud. Nothing is stood from a place on the route:
  // the line only limits how high a head may stand under it (6.5 m clear) and where the finer masses are spent.
  const ribSites = [];
  {
    const rq = r11(0x7f4a7c15), ICO = [icoBall(0), icoBall(1)], A = makeAcc(), TAU = 6.2831853, dip = [rq.range(-0.28, 0.28), rq.range(-0.28, 0.28)];
    const qOf = (ang) => { const sA = 1.5707963 - Math.abs(ang), eS = Math.exp(-sA / 0.3); return 31 * ang + 15.9 * Math.sign(ang) * (eS - 0.00532) + 0.8 * Math.sin(ang * 5.3 + ribU.y) + ribU.x; };
    const k0 = Math.ceil(qOf(-1.5707) / TAU), k1 = Math.floor(qOf(1.5707) / TAU);
    let made = 0;
    for (let k = k0; k <= k1; k++) {
      // the bearing of this rib's line (q rises steadily with the bearing), by halving
      let lo = -1.5707, hi = 1.5707;
      for (let it = 0; it < 28; it++) { const m = 0.5 * (lo + hi); if (qOf(m) < TAU * k) lo = m; else hi = m; }
      const ang0 = 0.5 * (lo + hi);
      for (let r = 55 + rq() * 3; r < 215; ) {
        const ang = ang0 + 0.8 / r, x = -r * Math.cos(ang), z = r * Math.sin(ang), f = ribField(x, z);
        if (f.h < 352) break;
        const rn = routeNear(x, z, 150), fine = rn.d < 140, stepL = fine ? rq.range(3.4, 4.8) : rq.range(5.6, 7.4);
        if (f.on < 0.6 || flowAt(x, z) < 6) { r += 2.5; continue; }
        const rx = f.hw * rq.range(0.85, 1.1), rz = (fine ? rq.range(3.0, 4.2) : rq.range(3.6, 4.6)), y = f.h;
        if (x + rx > -2.5) { r += stepL; continue; }
        const g = slopeAt(x, z), sl = (HF.heightAt(-(r - 1.5) * Math.cos(ang), (r - 1.5) * Math.sin(ang)) - HF.heightAt(-(r + 1.5) * Math.cos(ang), (r + 1.5) * Math.sin(ang))) / 3;
        // how high it may stand: lower at its foot, where it comes out of the ash, and never within 6.5 m of the route's line
        let top = rq.range(1.2, 3.2) * (0.55 + 0.45 * smoothstep(0, 14, f.h - 360 - 24 * f.v1));
        // (beside the line the crest stands up to within 10 to 12 m of it, so that there is always rock close under the wing)
        const gap = Math.max(0, rn.d - Math.max(rx, 2.6)), clr = routeY(rn.i) - y;
        if (rn.d < 14) top = Math.max(top, Math.min(7.5, clr - rq.range(9.5, 12)) * (1 - smoothstep(8, 14, rn.d)));
        if (gap < 6.5) top = Math.min(top, clr - Math.sqrt(6.5 * 6.5 - gap * gap));
        if (top < 0.9) { r += stepL; continue; }
        // (round 12) the vicunas' trail lies on the ground 11 m to the left of the route's line. Where a mass on the ash
        // (below 380 m) would reach within 1.6 m of the middle of that trail (a lane 3.2 m wide: two animals abreast), it
        // is trodden down to a slab 0.15 m proud of the ash, which they run over: the rib still crosses the trail, drawn
        // on the ground and as slabs, but does not wall it. The same draws are made for it, so no other mass changes.
        if (rn.left > 0 && y < 380) {
          const kS = Math.min(299, Math.floor(rn.i)), hx = SM[kS + 1].x - SM[kS].x, hz = SM[kS + 1].z - SM[kS].z, cA = Math.abs((x / r) * hx + (z / r) * hz) / (Math.hypot(hx, hz) || 1);
          const across = Math.hypot(Math.max(rz, 0.6 * top) * Math.sqrt(Math.max(0, 1 - cA * cA)), Math.max(rx, 0.45 * top) * cA);
          if (Math.abs(rn.d - 11) < across + 1.6) top = 0.15;
        }
        // (a head that stands high is a broad crag, never a needle)
        const ry = top / 0.7, fx = x / r, fz = z / r, rxx = Math.max(rx, 0.45 * top), rzz = Math.max(rz, 0.6 * top);
        rockBlob(A, rq, ICO[fine ? 1 : 0], { c: [x, y - 0.3 * ry, z], r: [rxx, ry, rzz], cuts: fine ? 7 : 3, rough: fine ? 0.2 : 0.26, taper: rq.range(0.05, 0.3),
          lean: [rq.range(-0.3, 0.3), -0.12 * ry], tilt: [0.85 * Math.atan(Math.max(sl, 0)), rq.range(-0.12, 0.12)], yaw: Math.atan2(-fx, fz) + rq.range(-0.14, 0.14) },
          { y, sx: g[0], sz: g[1], x, z, H: top }, dip);
        ribSites.push({ x, y, z, rx, rz, top, k });
        if (++made % 5 === 0) await ctx.yield();
        r += stepL;
      }
    }
    const ribMat = plateMaterial(shared, { uRibAsh: groundMat.uniforms.uAshFall, uRibSnow: { value: 378 - 0.9 * (opts.snowDrop || 0) }, uRibGrow: ribGrow }, RIB_VERT, RIB_FRAG);
    await ctx.yield();
    const ribs = new THREE.Mesh(accGeometry(A), ribMat); ribs.frustumCulled = false; ribs.name = 'ribs';
    group.add(ribs); upper.push(ribs);
  }
  await ctx.yield();

  // specimens: outlines stay on the paper, the live figures wake with progress
  const F = makeFig(), ctr = [], figs = [];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    F.s = b.s; F.flip = b.name === 'tapir' ? -1 : 1;                   // the tapir is drawn facing north, the way it will walk
    FIGURES[b.name](F, [0, b.base, b.z + (b.name === 'tapir' ? 0.45 * b.s : 0)], i, S, gr);
    ctr[i] = new THREE.Vector3(0.1, b.base + 1.1 * b.s, b.z); figs[i] = b;
    await ctx.yield();                                                 // one figure at a time
  }
  for (const r of res) {
    F.s = r.s; F.flip = r.flip;
    FIGURES[r.name](F, [0, r.base, r.z], r.id, S, fr);
    if (!figs[r.id]) { ctr[r.id] = new THREE.Vector3(0.1, r.base, r.z); figs[r.id] = { ...r, kind: r.id > ST ? 'flyer' : 'static', bu: 0, hw: 0, hh: 0, tilt: 0 }; }
    await ctx.yield();
  }
  for (let i = 0; i < NFIG; i++) if (!figs[i]) { ctr[i] = new THREE.Vector3(0, -999, 0); figs[i] = { name: 'none', kind: 'none', s: 1 }; }
  const figGeo = figGeometry(F), N7 = NFIG;
  await ctx.yield();
  const specU = { uP: { value: figs.map(() => 0) }, uD: { value: figs.map(() => 0) }, uCtr: { value: ctr },
    uOff: { value: figs.map(() => new THREE.Vector4()) }, uPose: { value: figs.map((b) => new THREE.Vector2(0, b.s)) } };
  const outlineMat = plateMaterial(shared, { ...specU, uOutline: { value: 1 } }, SPEC_VERT, SPEC_FRAG, { side: THREE.DoubleSide });
  const liveMat = plateMaterial(shared, { ...specU, uOutline: { value: 0 } }, SPEC_VERT, SPEC_FRAG, { side: THREE.DoubleSide });
  const outlines = new THREE.Mesh(figGeo, outlineMat), live = new THREE.Mesh(figGeo, liveMat);
  outlines.position.x = -0.03; outlines.frustumCulled = false; live.frustumCulled = false; live.renderOrder = 1;
  group.add(outlines, live);
  await ctx.yield();

  const puffs = buildPuffs(rng, HF, S, shared, rare); group.add(puffs.mesh);
  await ctx.yield();

  // ------------------------------------------------------------ animation
  let progress = -1, shadowsSet = false;
  const manual = figs.map(() => null), size = new THREE.Vector2(), tmp = new THREE.Vector3();
  const ss = (a, b, x) => smoothstep(a, b, x);
  // Each figure is staged against the camera line (fly.samples) so that its moment happens ahead of the camera,
  // inside the frame: it takes its wash while its box is still 40 to 60 m off, and leaves the paper 20 to 35 m ahead.
  function animate(i, u, time) {
    const b = figs[i], off = specU.uOff.value[i], c = ctr[i]; let p = 0, d = 0, tilt = 0;
    off.set(0, 0, 0, 0);
    if (b.kind === 'none') p = 0;
    else if (b.kind === 'static') p = 0.62;       // residents: always in wash, stirring where they lie
    else if (b.kind === 'flyer') {                // oilbirds rowing round their vault, turning with their course
      const ang = time * b.w + b.ph;
      p = 0.62;
      off.set(0.25 + 0.15 * Math.sin(ang * 1.7), b.ay * Math.sin(ang), -b.az * Math.cos(ang), 0);
      tilt = Math.atan2(b.ay * Math.cos(ang) * b.w, -b.az * Math.sin(ang) * b.w);
    } else if (b.name === 'orchid') {                    // opens, then leans out of the page toward us on its stem
      const w = ss(0.29, 0.316, u), o = ss(0.314, 0.337, u);
      p = 0.3 * w + 0.7 * o;
      off.set(7.5 * o, (0.6 + 0.16 * Math.sin(time * 1.3)) * o, 1.5 * o, -0.75 * o);
    } else if (b.name === 'hummingbird') {        // lifts off, hangs, darts up to the passionflowers on the edge
      const w = ss(0.326, 0.35, u), hov = ss(0.349, 0.359, u), e = ss(0.353, 0.402, u);
      p = 0.3 * w + 0.25 * hov + 0.45 * e;
      off.set(1.6 * hov + 5.5 * Math.sin(Math.PI * e) + 0.14 * Math.sin(time * 2.9) * hov,
        (flower.y - 0.5 - (b.base + 2.3 * b.s)) * e + 0.2 * Math.sin(time * 2.3) * hov,
        (flower.z + 3.4 - b.z) * e + 0.16 * Math.sin(time * 1.7 + 1) * hov, -0.6 * hov * (1 - 0.6 * e));
    } else if (b.name === 'tapir') {              // stands whole in its plate, then walks out of it and up its ledge, north
      const w = ss(0.385, 0.412, u), tau = Math.max(0, u - 0.42);
      d = Math.min(0.35 * LEN * (tau - 0.004 * (1 - Math.exp(-tau / 0.004))), b.hw * 0.95 + LEDGE - 6.5);
      const dl = Math.min(d, b.hw * 0.95), run = d - dl, k = clamp(run / 3, 0, 1);
      tilt = b.tilt * k;
      p = 0.3 * w + Math.min(0.6, tau * 40);
      off.set(0.06 * Math.min(1, d), run * Math.sin(b.tilt) + 1.1 * b.s * (1 / Math.cos(tilt) - 1), -(dl + run * Math.cos(b.tilt)), 0);
    } else if (b.name === 'beetle') {             // raises its wing cases, whirs out across the bow and away north-east
      const w = ss(0.428, 0.458, u), tau = Math.max(0, u - 0.468), k = ss(0, 0.012, tau);
      p = 0.3 * w + 0.1 * ss(0.458, 0.468, u) + 0.6 * ss(0, 0.02, tau);
      const ahead = 34 - 13.5 * ss(0, 0.02, tau) + 22 * ss(0.03, 0.055, tau) + 120 * ss(0.05, 0.12, tau);
      const q = lineAt(u + ahead / LEN, _q), q0 = lineAt(b.bu, _q0);
      if (tau > 0) off.set(0.6 * k + q.x * ss(0, 0.03, tau) + 420 * Math.max(0, tau - 0.03), (q.y - q0.y) + 1.5 * ss(0, 0.02, tau) + 11 * ss(0.025, 0.055, tau) + 0.6 * Math.sin(time * 3.1) * k, q.z - c.z, -1.1 * ss(0, 0.02, tau));
    } else {                                      // the passive plates take their wash and stir; the butterfly flutters up as we pass
      const w = ss(b.bu - b.lead - 0.03, b.bu - b.lead, u), alive = ss(b.bu - b.lead, b.bu - b.lead + 0.015, u);
      p = 0.3 * w + 0.3 * alive;
      if (b.name === 'butterfly') {
        const k = ss(b.bu - 0.022, b.bu + 0.03, u);
        off.set(0.5 * alive + 5 * k, 0.3 * Math.sin(time * 3.1) * alive + 8 * k, -9 * k, -0.4 * alive);
      } else off.set(0.25 * alive, 0, 0, 0);
    }
    if (manual[i] !== null) { p = manual[i]; off.set(0, 0, 0, 0); d = 0; tilt = 0; }
    specU.uP.value[i] = p; specU.uD.value[i] = d; specU.uPose.value[i].x = tilt;
  }
  function update(dt, time, camera) {
    shared.uTime.value = time;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); shared.uResY.value = Math.max(64, size.y); }
    const u = progress >= 0 ? fly.toLegacy(progress) : 0.26 + 0.34 * ((time / 26) % 1);          // demonstration loop until driven
    for (let i = 0; i < N7; i++) animate(i, u, time);
    pageU.uConduit.value = rare ? lerp(0.2, 1.06, ss(0.15, 0.9, u)) : 0.42 + 0.07 * Math.sin(time * 0.23);
    lavaU.w = rare ? lerp(ventTop * 0.5, ventTop + 3, ss(0.2, 0.6, u)) : ventTop - 12 + 2.5 * Math.sin(time * 0.21);
    if (!shadowsSet) for (let k = 0; k < 2; k++) {
      const z = 740 - ((time * 22 + k * 30) % 620), s = pageU.uShadow.value[k];
      s.set(-z, H0(z) - 24 - k * 9 + 3 * Math.sin(time * 0.5 + k), 3.4 - k * 0.5, 0.85);
    }
  }
  function setShadow(k, p) {
    const s = pageU.uShadow.value[k];
    if (!p || p.x <= 0.2 || S.sun.x <= 0.05) { s.w = 0; return; }
    tmp.copy(p).addScaledVector(S.sun, -p.x / S.sun.x);
    s.set(-tmp.z, tmp.y, 2.2 + p.x * 0.05, clamp(1.1 - p.x / 60, 0, 0.9));
  }
  function setShadows(a, b) { shadowsSet = true; setShadow(0, a); setShadow(1, b); }
  update(0, 0, null);

  const s22 = Math.sin(PITCH), c22 = Math.cos(PITCH);
  const anchors = {
    portalSeat: { position: fly.end.clone(), facing: new THREE.Vector3(0, -s22, c22), tilt: PITCH },
    flyThrough: fly.pts.map((p) => p.clone()),
    seamFoot: new THREE.Vector3(0, 0, R),
    boxes: boxes.map((b) => ({ name: b.name, position: new THREE.Vector3(0, b.y, b.z), size: new THREE.Vector2(b.hw * 2, b.hh * 2), u: b.u })),
    falls: falls.map((f) => ({ top: new THREE.Vector3(0, f.top, f.z), foot: new THREE.Vector3(0, f.foot, f.z) })),
    crater: new THREE.Vector3(-10, craterFloor, 0), plumeTop: puffs.top,
    passionflowers: flower.clone(),
    viewpoints: {
      aisle: new THREE.Vector3(60, 26, 970), page: new THREE.Vector3(150, 190, 430),
      ridge: new THREE.Vector3(4, H0(240) + 9, 240), notch: fly.start.clone(),
    },
  };
  return {
    object: group, radius: R, height: 462, center: new THREE.Vector3(0, 190, 0), anchors,
    update, dispose() {}, ground: false, groundY: 0,
    setProgress(u) { progress = clamp(u, 0, 1); },
    setSpecimen(i, p) { manual[i] = p; },
    setShadows,
    heightAt: (x, z) => (x > 0 ? 0 : HF.heightAt(x, z)),
    zones: { palms: [0, 60], cloudForest: [60, 190], paramo: [190, 310], arenal: [310, 380], snow: [380, 462] },
    uniforms: shared, rare, bloom, S, groundAt: HF.heightAt, samples: fly.samples,
    materials: { ground: groundMat, plant: plantMat, plantOut },
    grow: { up: plantUp.uniforms.uGrow.value, far: plantFar.uniforms.uGrow.value, out: plantOut.uniforms.uGrow.value, rib: ribGrow }, sites: { palms, crowns, frail, puya, frailNew: frail.r11, cushNear, cushFar, ribs: ribSites, rocks },
    upperDetail: upper, upperFar, ribField, routeNear,
    layout: { caves, residents: res, falls, ventZ: VENT_Z, ventTop, lean: LEAN },
    toLegacy: fly.toLegacy, fromLegacy: fly.fromLegacy, legacyLength: fly.Lold, flowAt,
  };
}

// helpers for the world coder: build more 'plate' geometry in the same family
export const plateKit = { makeAcc, vtx, accGeometry, accTube, accRibbon, accDome, instancePlants, plateMaterial, thin, rockGeometry, PLANT_FRAG, PAGE_LIB, FOG_V, FOG_F, FRAG_END };
