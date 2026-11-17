// DRAGON KITE LOFT: hero set piece: "The Hundred-Segment Dragon" (which is also the vehicle).
//
// A Weifang centipede dragon kite at six times life size: 120 discs of painted silk, 5 m across on bamboo
// hoops, 5.8 m apart, joined by three lines. Each disc carries a 10 m bamboo cross-spar lashed across its
// upper third, tipped with upright pheasant plumes 2.5 m tall and dyed hemp tufts. Every disc is painted in
// woodblock manner: overlapping scales (ground, scallop band, gilt edge, black keyline), a gilt rim with
// pearls and a centre roundel, shifting from scallop-heavy at the tail to gilt-heavy at the head. The discs
// lie tilted back on 120 A-frame trestles "like roof tiles, dull side up"; a wave front stands them up,
// turns them to the light and lifts them to the snake curve, plumes springing; then the whole body hauls
// away down the loft and the last disc (k = 0) stays locked 3.5 m ahead of and 4.3 m below the eye.
// The carved head is not built (it has already gone out through the gable).
//
// LOCAL SPACE = THE BRIEF'S LOFT COORDINATES (metres). Origin on the floor on the loft axis at z = 0, +Y up,
// the dragon runs toward -Z (the viewer rides it looking -Z; "front" of the piece faces +Z, back at the eye).
// Put hero.object at the loft origin with no rotation. Station s (metres down the loft): z = -6 - s.
//   eye curve     eye(s) = ( snakeX(s), eyeY(s), -6 - s ),  s = 0 .. 764   (entry z -6, portal z -770)
//   snakeX(s)     8 sin(2 pi s / 210) x envelope (0 before s 150, 1 from 220 to 500, 0 after 620); +X = right
//   eyeY(s)       12 until s 72, 17.6 by s 144, then 17.6 +- 1.6 with a 3.4 m dip through the dye room
//                 (s 310) and a 1 m sink through the second rack (s 634, kept shallow so the moon gate holds the centre)
//                 (lowered from the brief's 20 so the far body never hides the moon gate, which is at 18),
//                 18 for the last 60 m
//   body          disc centres sit on eye(s) - 4.3 m; trestles stand on the floor under snakeX(s)
//   disc k        k = 0 (tail, the one we ride) .. 119 (head end); rest station r = 75.5 + 5.8 k;
//                 station = max(r, sEye + 3.5 + 5.8 k); stations past s 757..764 shrink to nothing (the portal)
//   wave front    runs from s 210 at u 0 to s 75.5 at u 0.094 and on; each disc takes ~14 m of front travel
//                 to stand, with a small overshoot. Until the haul begins the body that is already aloft hovers
//                 up to 7 m above the curve (higher the further behind the front), so from the finishing floor
//                 it stands as a rising chain of lit arcs; it settles onto the curve as the line takes the strain
// The same curve is written once in JS (hero.snake) and once in GLSL (hero.glsl.curve) for the world's use.
//
// opts
//   palette      7 hex strings, brief order: cream paper, bamboo gold, timber brown, vermilion, viridian,
//                gilt, sky blue
//   livery       'vermilion' (vermilion ground, viridian scallops) | 'azure' (azure and white) |
//                'black' (black and gold). Default: per seed (vermilion half the time)
//   mood         'afternoon' (default) | 'lantern' | 'rain' | 'gold' | 'snow': preset for the self light
//                (see Lighting). 'lantern' also lights a flame inside every disc
//   lantern      0..1.5 override of the flame inside each disc
//   motif        0 spiral pearl | 1 ringed sun | 2 eight-petal flower (centre roundel; default per seed)
//   trestles     true: build the 120 trestles (set false if the world builds its own)
//   dust         true: dust that jumps off the trestle line as the wave front passes
//   pathLength   764: metres of eye travel that setProgress(u) maps u 0..1 onto
//
// anchors (local space)
//   entry        eye(0): where the camera path starts, looking -Z
//   flyThrough   ordered eye points, one every 8 m (s 0..764): feed straight to makePath. Clearance: the body
//                and its spars stay inside a tunnel 11 m wide and 9 m high centred 2.5 m below this line
//   portalSeat   { position (0, 18, -770), normal (0, 0, 1), radius 7 }: the moon gate; the last 60 m of the
//                eye curve is straight and level into it
//   tailRest     centre of the ridden disc while it lies on its trestle (s 75.5)
//   waveStart    where the standing wave is at u = 0 (s 210, body height)
//   rackDips     two points 3.5 m above the eye at the two dips (s 293, s 634): hang the racks here
//   headRack     ( x +9, y 0, z -430 ) floor seat for the head rack, 8 m right of the eye at s 424
//   bendPosts    four points 8 m outside the crest of each bend at floor level (posts pass close there)
//   viewpoints   { ride, wave, flank }: { position, target } pairs for judging stills
//   sunDir       unit vector TOWARD the key light of the current mood (the right wall, high)
//
// handle extras
//   setProgress(u, sEye)   THE WORLD MUST CALL THIS EVERY FRAME with the path progress u (0..1). Optional
//                sEye = the eye's true station (-6 - cameraLocal.z): pass it and the ridden disc is locked to
//                the camera exactly. Until it is called the piece self-plays (u = time / 36, looping).
//   setLight({ sunDir, sun, sky, roof, gable, ambient, floor, lantern, gain })   colours are THREE.Color,
//                hex strings or [r,g,b] linear; see Lighting. setMood(name) applies a preset.
//   snake        { x(s), eyeY(s), eye(s, out), body(s, out), discStation(k, sEye), restStation(k),
//                front(u), tailStation(sEye), Z0, R0, SPACING, COUNT, LENGTH }
//   glsl.curve   GLSL source of snakeX / eyeY / bodyAt for kites that must react to the passing tail
//   uniforms     shared: uEye (eye station), uFront (wave front station), uTime, light colours, and the world's
//                zones (ZONES): uGalK (> 0: the lantern gallery of s 456-568 shuts out the day and lights a flame
//                in every disc that passes under its deck), uBay / uBayCol (the shaft of the open roof bay)
//   livery, motif, mood   what the seed (or opts) chose
//
// Size: radius 15 / height 16 are a VIEW size for the orbit viewer (centred on the body at s 300); the true
// extent is x +-14, y 0..26, z -81..-770 (bounds). Cost: about 118k triangles (dragon 99k, trestles 14k, lines
// 3.6k, dust 1.5k), 5 draw calls (2 dragon, lines, trestles, dust), no lights, no textures, ~70 ms build.
// ground: false (the piece spans 700 m of loft floor that the world builds).
// Lighting: SELF LIT. Every material here is a ShaderMaterial with an analytic rig in local space, so the
// piece needs no scene lights and ignores them: a paper sun wall (uSunDir/uSun, right and high), a cool
// left wall (uSky), roof-lights from above (uRoof), the blue gable ahead (uGable, the backlight that makes
// the silk glow from behind), brown ambient and a floor bounce. Silk transmits whatever is behind it, so
// discs read as stained glass from the eye; gilt takes a tinted specular up to ~3 for bloom. Scene fog is
// honoured (warm pale dust is right). Match the room to the mood with setLight.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PAL = ['#F4EBD6', '#D9B36A', '#3B2A1E', '#D8381E', '#1F8A6B', '#E8B93A', '#8FC4F0'];
const Z0 = -6, R0 = 75.5, SP = 5.8, COUNT = 120, LEN = 764, DROP = 4.3, LEAD = 3.5;
const FRONT0 = 210, FRONT_U = 0.094, RISE = 14, HI = 3, DIP1 = 310, DIP2 = 634, HOVER = 7, DIPW = 46, DIPD = 3.4;
// zones of the loft the world builds round the body (stations): the dye room, the lantern gallery under its drying deck
export const ZONES = { dye: [266, 358], gallery: [456, 568], deckY: 25.5, bay: 631 };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- the snake curve (JS twin of GLSL below)
const snakeX = (s) => 8 * Math.sin(TAU * s / 210) * smoothstep(150, 220, s) * (1 - smoothstep(500, 620, s));
function eyeY(s) {
  let y = 12 + 5.6 * smoothstep(72, 144, s);
  y += 1.6 * Math.sin(TAU * (s - 160) / 230) * smoothstep(170, 240, s) * (1 - smoothstep(600, 680, s));
  const a = (s - DIP1) / DIPW, b = (s - DIP2) / 30;
  y -= DIPD * Math.exp(-a * a) + 1.0 * Math.exp(-b * b);
  return lerp(y, 18, smoothstep(650, 704, s));
}
const frontAt = (u) => FRONT0 - (FRONT0 - R0) * (u / FRONT_U);
export const GLSL_CURVE = /* glsl */`
const float DK_Z0 = ${Z0.toFixed(1)}, DK_R0 = ${R0.toFixed(1)}, DK_SP = ${SP.toFixed(1)};
float snakeX(float s){ return 8.*sin(6.2831853*s/210.)*smoothstep(150.,220.,s)*(1.-smoothstep(500.,620.,s)); }
float eyeY(float s){
  float y = 12. + 5.6*smoothstep(72.,144.,s);
  y += 1.6*sin(6.2831853*(s-160.)/230.)*smoothstep(170.,240.,s)*(1.-smoothstep(600.,680.,s));
  float a = (s-${DIP1.toFixed(1)})/${DIPW.toFixed(1)}, b = (s-${DIP2.toFixed(1)})/30.;
  y -= ${DIPD.toFixed(1)}*exp(-a*a) + 1.0*exp(-b*b);
  return mix(y, 18., smoothstep(650.,704.,s));
}
vec3 bodyAt(float s){ return vec3(snakeX(s), eyeY(s) - ${DROP.toFixed(1)}, DK_Z0 - s); }
`;
// Everything that places a disc, shared by the dragon, the lines and (partly) the trestles and dust.
const GLSL_DISC = /* glsl */`
uniform float uEye, uFront, uTime;
${GLSL_CURVE}
float dkHash(float k){ return fract(sin(k*12.9898 + 4.137)*43758.5453); }
// wave time of a rest station: 0 before the front arrives, ~1 when the disc has stood (half a second)
float dkWave(float r){ return max(0., (r - uFront)/${RISE.toFixed(1)}); }
float dkLift(float t){ return (1. - exp(-4.2*t)*cos(5.6*t))*smoothstep(0., .35, t); }
// c centre, R right, U up, N the face normal looking back at the eye; inf = (lift, moving, scale, waveTime)
void discState(float k, out vec3 c, out vec3 R, out vec3 U, out vec3 N, out vec4 inf){
  float rnd = dkHash(k);
  float r = DK_R0 + DK_SP*k;
  float st = max(r, uEye + ${LEAD.toFixed(1)} + DK_SP*k);
  float t = dkWave(r);
  float e = dkLift(t);
  float mv = smoothstep(0., 22., st - r);
  vec3 fly = bodyAt(st);
  vec3 tg = normalize(bodyAt(st + 1.5) - bodyAt(st - 1.5));
  vec3 side = normalize(cross(tg, vec3(0., 1., 0.)));
  float far = smoothstep(0., 22., k);
  float amp = mix(.25, 1.2, far);
  float ph = uTime*(.85 + .35*mv) - k*.55 + rnd*1.3;
  fly += side*sin(ph)*amp + vec3(0., 1., 0.)*sin(ph*1.31 + 1.7)*amp*.55;
  // aloft but not yet hauling: the body hovers above the curve, higher the further behind the wave front
  float hov = (1. - mv)*smoothstep(10., 170., r - uFront);
  fly.y += hov*(${HOVER.toFixed(1)} + 4.*(1. - smoothstep(20., 70., uEye)) + 1.1*sin(uTime*.7 - r*.021)); fly.x += hov*1.6*sin(uTime*.43 - r*.013);
  vec3 rest = vec3(snakeX(r), 3.45, DK_Z0 - r);
  c = mix(rest, fly, e);
  vec3 N0 = -tg, U0 = cross(N0, side);
  float pitch = mix(1.22, .15 + .05*sin(ph*1.7 + rnd*6.), min(e, 1.2));
  float roll = sin(ph + 1.2)*(.07 + .09*far)*clamp(e, 0., 1.);
  N = N0*cos(pitch) + U0*sin(pitch);
  vec3 U1 = U0*cos(pitch) - N0*sin(pitch);
  R = side*cos(roll) + U1*sin(roll);
  U = U1*cos(roll) - side*sin(roll);
  inf = vec4(e, mv, 1. - smoothstep(757., 764., st), t);
}
`;
// The analytic light rig, shared by every material of the piece (all in the hero's local space).
export const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSun, uSky, uRoof, uGable, uAmb, uFloor, uCam;
uniform float uGain;
vec3 dkDiffuse(vec3 n){
  float s = clamp(dot(n, uSunDir)*.62 + .38, 0., 1.); s *= s;
  float l = clamp(-n.x*sign(uSunDir.x)*.5 + .5, 0., 1.);
  float g = clamp(-n.z*.6 + .4, 0., 1.);
  return uSun*s + uSky*l*l + uRoof*clamp(n.y*.5 + .5, 0., 1.) + uGable*g*g*.6 + uFloor*clamp(-n.y*.5 + .5, 0., 1.) + uAmb;
}
// soft bars of roof-light: one band of paper per 16 m bay (0 under a truss .. 1 under the middle of a band)
float dkBars(float z){ float c = .5 + .5*cos(6.2831853*(z - 10.)/16.); return c*c*(3. - 2.*c); }
float dkSpec(vec3 n, vec3 v, float p){
  vec3 h = uSunDir + v; h = h/max(length(h), 1e-4);
  return pow(max(dot(n, h), 0.), p);
}
float dkH21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
// ZONES. uGalK > 0: the lantern gallery exists (flame light under the drying deck, daylight shut out).
// uBay = (x0, x1 across the sunward roof slope, z centre, half length) of the open roof bay; uBayCol its light.
uniform vec4 uBay; uniform vec3 uBayCol; uniform float uGalK;
float dkGal(vec3 p){
  float s = -6. - p.z;
  return smoothstep(450., 462., s)*(1. - smoothstep(560., 574., s))*(1. - smoothstep(25.1, 25.9, p.y))*step(1e-3, uGalK);
}
// how much of the shaft of sky light from the open bay reaches p (traced back along the light to the roof slope)
float dkBay(vec3 p){
  float sg = uSunDir.x < 0. ? -1. : 1.;
  float t = (46. - p.y - p.x*sg*.9375)/max(uSunDir.y + abs(uSunDir.x)*.9375, .05);
  vec3 h = p + uSunDir*max(t, 0.);
  float hx = h.x*sg;
  return smoothstep(uBay.x - 1., uBay.x + 1., hx)*(1. - smoothstep(uBay.y - 1., uBay.y + 1., hx))*(1. - smoothstep(uBay.w - 2., uBay.w + 1.5, abs(h.z - uBay.z)));
}
float dkVn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(dkH21(i), dkH21(i + vec2(1., 0.)), f.x), mix(dkH21(i + vec2(0., 1.)), dkH21(i + vec2(1., 1.)), f.x), f.y);
}
`;

// ---------------------------------------------------------------- geometry helpers
// One growing geometry: position, normal, uv and aP = (part id, t along, side, extra).
function makeGeo() {
  const g = { pos: [], nor: [], uv: [], ap: [], idx: [], n: 0 };
  g.v = (x, y, z, nx, ny, nz, u, v, p0, p1, p2, p3) => {
    g.pos.push(x, y, z); g.nor.push(nx, ny, nz); g.uv.push(u, v); g.ap.push(p0, p1, p2, p3); return g.n++;
  };
  g.tri = (a, b, c) => { g.idx.push(a, b, c); };
  g.quad = (a, b, c, d) => { g.idx.push(a, b, c, a, c, d); };
  g.build = (instanced) => {
    const geo = instanced ? new THREE.InstancedBufferGeometry() : new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uv, 2));
    geo.setAttribute('aP', new THREE.Float32BufferAttribute(g.ap, 4));
    geo.setIndex(g.n > 65535 ? new THREE.Uint32BufferAttribute(g.idx, 1) : new THREE.Uint16BufferAttribute(g.idx, 1));
    return geo;
  };
  return g;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3();
// A round tube through pts (array of Vector3) with radii[i]; uv = (around 0..1, metres along).
// ref is a vector never parallel to the tube; closed joins the ends; pfn(i) gives aP for ring i.
function addTube(g, pts, radii, sides, ref, closed, pfn) {
  const n = pts.length, rings = [];
  let along = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i], pa = pts[closed ? (i + n - 1) % n : Math.max(0, i - 1)], pb = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    _t.subVectors(pb, pa).normalize();
    _a.crossVectors(ref, _t).normalize(); _b.crossVectors(_t, _a).normalize();
    if (i > 0) along += p.distanceTo(pts[i - 1]);
    const ap = pfn ? pfn(i) : [1, 0, 0, 0], r = radii[i], ring = [];
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nx = _a.x * ca + _b.x * sa, ny = _a.y * ca + _b.y * sa, nz = _a.z * ca + _b.z * sa;
      ring.push(g.v(p.x + nx * r, p.y + ny * r, p.z + nz * r, nx, ny, nz, j / sides, along, ap[0], ap[1], ap[2], ap[3]));
    }
    rings.push(ring);
  }
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const r0 = rings[i], r1 = rings[(i + 1) % n];
    for (let j = 0; j < sides; j++) g.quad(r0[j], r0[j + 1], r1[j + 1], r1[j]);
  }
  return along;
}
// A small cord wrap: a torus of radius rad round the axis ax at centre c.
function addWrap(g, c, ax, rad, thick, segs, sides, part) {
  const pts = [], rr = [];
  _a.set(0.31, 0.77, 0.55).cross(ax).normalize(); _b.crossVectors(ax, _a).normalize();
  const u = _a.clone(), w = _b.clone();
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * TAU;
    pts.push(new THREE.Vector3().copy(c).addScaledVector(u, Math.cos(a) * rad).addScaledVector(w, Math.sin(a) * rad)); rr.push(thick);
  }
  addTube(g, pts, rr, sides, ax, true, () => [part, 0, 0, 0]);
}

// One disc in its own space: x right, y up, z back toward the eye. Parts: 0 silk, 1 bamboo, 2 cord,
// 3 plume, 4 hemp tuft. hi = the ridden disc and its two neighbours (seen from 3.5 m).
function buildDisc(hi) {
  const g = makeGeo();
  const segs = hi ? 64 : 24, RS = 2.47;
  // silk membrane (the belly and its normal are made in the vertex shader)
  const rr = hi ? [0.14, 0.28, 0.42, 0.56, 0.7, 0.82, 0.92, 1] : [0.36, 0.7, 1];
  const c0 = g.v(0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0), rings = [];
  for (const r of rr) {
    const ring = [];
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * TAU, x = Math.cos(a) * r, y = Math.sin(a) * r;
      ring.push(g.v(x * RS, y * RS, 0, 0, 0, 1, x * RS / 2.5, y * RS / 2.5, 0, r, 0, 0));
    }
    rings.push(ring);
  }
  for (let j = 0; j < segs; j++) g.tri(c0, rings[0][j], rings[0][(j + 1) % segs]);
  for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < segs; j++) {
    const k = (j + 1) % segs; g.quad(rings[i][j], rings[i + 1][j], rings[i + 1][k], rings[i][k]);
  }
  // bamboo hoop
  const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  const hp = [], hr = [];
  for (let j = 0; j < segs; j++) { const a = (j / segs) * TAU; hp.push(new THREE.Vector3(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0)); hr.push(0.078); }
  addTube(g, hp, hr, hi ? 8 : 4, Z, true, () => [1, 0, 0, 0.3]);
  // cross-spar, bowed back and up toward its tips, tapering
  const sp = [], sr = [], ns = hi ? 18 : 8;
  const sparAt = (x, out) => { const q = x / 5; return out.set(x, 0.85 + 0.22 * q * q, 0.11 + 0.3 * q * q); };
  for (let i = 0; i <= ns; i++) { const x = -5 + (10 * i) / ns; sp.push(sparAt(x, new THREE.Vector3())); sr.push(lerp(0.088, 0.044, Math.abs(x) / 5)); }
  addTube(g, sp, sr, hi ? 8 : 5, Y, false, () => [1, 0, 0, 0.7]);
  // lashings: spar to hoop, line knots on the hoop, the hoop's scarf joint, bindings at the spar tips
  const ws = hi ? 12 : 5, wd = hi ? 5 : 3, cx = Math.sqrt(2.5 * 2.5 - 0.85 * 0.85);
  for (const s of [-1, 1]) {
    const c = sparAt(s * cx, new THREE.Vector3()); c.z *= 0.5;
    addWrap(g, c, X, 0.15, 0.04, ws, wd, 2);
    if (hi) addWrap(g, c, new THREE.Vector3(0.75, 0.66 * s, 0).normalize(), 0.16, 0.035, ws, wd, 2);
    if (hi) addWrap(g, c, new THREE.Vector3(0.75, -0.66 * s, 0).normalize(), 0.16, 0.035, ws, wd, 2);
    const tip = sparAt(s * 4.9, new THREE.Vector3());
    addWrap(g, tip, X, 0.085, 0.04, ws, wd, 2);
    if (hi) addWrap(g, sparAt(s * 4.7, new THREE.Vector3()), X, 0.09, 0.03, ws, wd, 2);
  }
  for (const deg of hi ? [90, 210, 330, 262, 270, 278] : []) {
    const a = (deg * Math.PI) / 180;
    addWrap(g, new THREE.Vector3(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0), new THREE.Vector3(-Math.sin(a), Math.cos(a), 0), 0.115, 0.04, ws, wd, 2);
  }
  // pheasant plumes (three to a tip) and a dyed hemp tuft under them
  const np = hi ? 14 : 8;
  const PL = [[0.02, -0.05, 2.5, 0.12], [0.3, 0.14, 2.1, 0.95], [-0.24, 0.1, 1.85, -0.85]];
  for (const s of [-1, 1]) {
    const tip = sparAt(s * 4.92, new THREE.Vector3());
    PL.forEach((P, pi) => {
      const dir = _a.set(Math.sin(P[0]) * s, Math.cos(P[0]), P[1]).normalize().clone();
      const wa = new THREE.Vector3(dir.y, -dir.x, 0).normalize().multiplyScalar(Math.cos(P[3])).addScaledVector(Z, Math.sin(P[3]));
      const nn = new THREE.Vector3().crossVectors(wa, dir).normalize();
      let prev = null;
      for (let i = 0; i <= np; i++) {
        const t = i / np, bow = t * t * 0.28 * P[2];
        _c.copy(tip).addScaledVector(dir, P[2] * t); _c.x += s * bow; _c.z += bow * 0.4;
        const a0 = g.v(_c.x - wa.x * 0.19, _c.y - wa.y * 0.19, _c.z - wa.z * 0.19, nn.x, nn.y, nn.z, -1, t, 3, t, s, (pi + 1) / 3);
        const a1 = g.v(_c.x + wa.x * 0.19, _c.y + wa.y * 0.19, _c.z + wa.z * 0.19, nn.x, nn.y, nn.z, 1, t, 3, t, s, (pi + 1) / 3);
        if (prev) g.quad(prev[0], prev[1], a1, a0);
        prev = [a0, a1];
      }
    });
    const tp = [], tr = [], nt = hi ? 5 : 2, TR = [0.06, 0.15, 0.19, 0.2, 0.2, 0.19];
    for (let i = 0; i <= nt; i++) { const t = i / nt; tp.push(new THREE.Vector3(tip.x + s * 0.06, tip.y - 0.08 - t * 1.05, tip.z + 0.02)); tr.push(hi ? TR[i] : [0.06, 0.17, 0.2][i]); }
    addTube(g, tp, tr, hi ? 10 : 5, X, false, (i) => [4, i / nt, s, 0]);
  }
  return g;
}

// One A-frame trestle: two side frames with a sloping rail the disc lies on, tied by rails and a brace.
// Space: x across the path, z back toward the eye, feet on y = 0. aP = (5, beam tint, 0, 0).
function buildTrestle(rng) {
  const g = makeGeo();
  const beam = (ax, ay, az, bx, by, bz, w, d, ref) => {
    const A = new THREE.Vector3(ax, ay, az), B = new THREE.Vector3(bx, by, bz), len = A.distanceTo(B);
    const t = new THREE.Vector3().subVectors(B, A).normalize();
    const u = new THREE.Vector3().crossVectors(ref, t).normalize(), v = new THREE.Vector3().crossVectors(t, u).normalize();
    const tint = rng(), sh = rng() * 7;
    const P = (e, su, sv) => new THREE.Vector3().copy(e ? B : A).addScaledVector(t, e ? 0.06 : -0.06).addScaledVector(u, su * w * 0.5).addScaledVector(v, sv * d * 0.5);
    const face = (p0, p1, p2, p3, n, len2) => {
      const i0 = g.v(p0.x, p0.y, p0.z, n.x, n.y, n.z, 0, sh, 5, tint, 0, 0), i1 = g.v(p1.x, p1.y, p1.z, n.x, n.y, n.z, 1, sh, 5, tint, 0, 0);
      const i2 = g.v(p2.x, p2.y, p2.z, n.x, n.y, n.z, 1, sh + len2, 5, tint, 0, 0), i3 = g.v(p3.x, p3.y, p3.z, n.x, n.y, n.z, 0, sh + len2, 5, tint, 0, 0);
      g.quad(i0, i1, i2, i3);
    };
    const nu = u.clone().negate(), nv = v.clone().negate();
    face(P(0, 1, -1), P(0, 1, 1), P(1, 1, 1), P(1, 1, -1), u, len);
    face(P(0, -1, 1), P(0, -1, -1), P(1, -1, -1), P(1, -1, 1), nu, len);
    face(P(0, 1, 1), P(0, -1, 1), P(1, -1, 1), P(1, 1, 1), v, len);
    face(P(0, -1, -1), P(0, 1, -1), P(1, 1, -1), P(1, -1, -1), nv, len);
    face(P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), P(1, -1, -1), t, 0.3);
  };
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Zv = new THREE.Vector3(0, 0, 1);
  for (const s of [-1, 1]) {
    const x = s * 1.55;
    beam(x * 1.1, 0, -2.45, x, 4.12, -1.8, 0.24, 0.3, X);          // tall front leg
    beam(x * 1.1, 0, 2.6, x, 2.62, 2.05, 0.24, 0.3, X);            // short rear leg
    beam(x, 2.28, 2.55, x, 4.02, -2.2, 0.2, 0.26, X);              // the sloping rail the disc lies on
    beam(x, 1.75, -2.14, x, 1.2, 2.33, 0.16, 0.2, X);              // side brace
  }
  beam(-2.0, 3.72, -1.86, 2.0, 3.72, -1.86, 0.22, 0.3, Zv);        // top rail
  beam(-1.9, 2.2, 2.14, 1.9, 2.2, 2.14, 0.2, 0.26, Zv);            // rear rail
  beam(-1.85, 0.95, -2.28, 1.85, 0.95, -2.28, 0.18, 0.24, Zv);     // stretcher
  beam(-1.5, 1.05, -2.2, 1.5, 3.5, -1.95, 0.14, 0.18, Zv);         // diagonal brace
  void Y;
  return g;
}

// ---------------------------------------------------------------- the dragon's shaders
const DRAGON_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aK;
attribute vec4 aP;
${GLSL_DISC}
varying vec2 vUv; varying vec4 vP; varying vec3 vN; varying vec3 vPos; varying vec4 vS;
void main(){
  vec3 c, R, U, N; vec4 inf;
  discState(aK, c, R, U, N, inf);
  float lift = clamp(inf.x, 0., 1.), mv = inf.y, rnd = dkHash(aK);
  vec3 p = position, n = normal;
  float part = aP.x;
  if (part < .5) {
    // the silk bellies back toward the eye in flight and sags a little on the trestle
    float rr = dot(p.xy, p.xy)/6.25;
    float b = mix(-.1, .4 + .09*sin(uTime*2.3 + aK*1.7) + .14*mv, lift);
    b += .035*sin(uTime*8.5 + p.x*2.6 + p.y*1.9 + aK)*(.3 + mv)*lift;
    p.z += b*(1. - rr);
    n = normalize(vec3(2.*b*p.x/6.25, 2.*b*p.y/6.25, 1.));
  }
  vec3 wl = c + (R*p.x + U*p.y + N*p.z)*inf.z;
  vec3 nl = normalize(R*n.x + U*n.y + N*n.z);
  if (part > 2.5) {
    // plumes and tufts: droop at rest, spring as the disc stands, stream and tremble in the haul
    float t = aP.y, t2 = t*t, ph = rnd*40. + aP.w*9. + aP.z*2.;
    float sprung = sin(inf.w*8.)*exp(-inf.w*1.6)*step(0.001, inf.w);
    if (part < 3.5) {
      wl += vec3(0., -1., 0.)*t2*1.1*(1. - lift)*inf.z;
      wl += N*(t2*(.22 + .95*mv) + t*sprung*.9)*inf.z - U*t2*.3*mv*inf.z;
      wl += R*sin(uTime*11.5 + ph + t*4.)*t2*(.05 + .11*mv) + N*sin(uTime*15.3 + ph*1.7 + t*5.)*t2*.09*mv;
    } else {
      wl += vec3(0., -1., 0.)*t*.5*(1. - lift)*inf.z;
      wl += N*(t2*(.12 + 1.1*mv) + t*sprung*.4)*inf.z + U*t2*.35*mv*inf.z;
      wl += R*sin(uTime*9. + ph + t*3.)*t*(.04 + .07*mv);
    }
  }
  vUv = uv; vP = aP; vN = nl; vPos = wl; vS = vec4(inf.x, mv, aK, rnd);
  vec4 mvPosition = modelViewMatrix*vec4(wl, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
  #ifdef USE_FOG
    vFogDepth *= 1. - .42*lift*(1. - mv);      // the standing wave reads through the dust of the finishing floor
  #endif
}`;

const DRAGON_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uGround, uScallop, uGilt, uKey, uCream, uBamboo, uCord, uPlumeA, uPlumeB, uTuft, uFlame;
uniform float uLantern, uMotif, uTime, uTrans, uBars, uEye;
varying vec2 vUv; varying vec4 vP; varying vec3 vN; varying vec3 vPos; varying vec4 vS;

// what gilt, lacquer and wet paint see of the room
vec3 dkEnv(vec3 r){
  float s = max(dot(r, uSunDir), 0.);
  float g = max(-r.z, 0.), l = max(-r.x, 0.);
  return uSun*s*s*s*1.6 + uRoof*max(r.y, 0.) + uGable*g*g + uSky*l*l + uAmb;
}
// the painted disc: returns albedo, a = how much of it is gilt
vec4 dkPaint(vec2 p, float k, float rnd, float fw){
  float g = k/119.;
  float r = length(p);
  float th = atan(p.y, p.x + step(r, 1e-5)*1e-4);
  float aR = fw*1.5;
  // overlapping scales, upper rows over lower ones
  float S = mix(3.3, 4.3, rnd);
  vec2 q = p*S + vec2(rnd*3., .15);
  float jt = floor(q.y/.36) + 1., d = 1., found = 0., cdy = 0.;
  vec2 cid = vec2(0.);
  for (int i = 0; i < 3; i++) {
    float j = jt - float(i), off = .5*mod(j, 2.);
    float cx = floor(q.x - off + .5) + off;
    vec2 dv = q - vec2(cx, j*.36);
    float dd = length(dv)*2.;
    if (found < .5 && dd < 1.) { d = dd; found = 1.; cid = vec2(cx, j); cdy = dv.y; }
  }
  float aF = fw*S*1.7, aS = min(aF, .11), aB = min(aF, .3);
  float fine = 1. - smoothstep(.12, .5, aF);          // keylines and gilt edges, while they are wider than a pixel
  float h1 = dkH21(cid*1.37 + rnd*17.), h2 = dkH21(cid*2.11 + 9.1 + rnd*5.);
  float bandGilt = step(h1, smoothstep(.1, 1., g)*.85);
  float grScal = step(h2, (1. - g)*.36);
  vec3 gcol = mix(uGround, uScallop*.9, grScal)*mix(.7, 1.06, smoothstep(.2, .72, d));
  vec3 bandC = mix(uScallop, uGilt, bandGilt);
  vec3 alb = gcol;
  float gilt = 0.;
  float spine = (1. - smoothstep(.055, .055 + aS*.5, length(vec2(q.x - cid.x, (cdy + .27)*.7))))*fine;   // a gilt drop on each scale
  alb = mix(alb, uGilt, spine*.8); gilt = spine*.8;
  alb = mix(alb, uKey, smoothstep(.7 - aS, .7, d)*fine);
  float bnd = smoothstep(.735 - aB, .735, d);
  alb = mix(alb, mix(mix(bandC, uGilt, .25)*.86, bandC, fine), bnd); gilt = mix(gilt, mix(.25, bandGilt, fine), bnd);
  float gl = smoothstep(.87 - aS, .87, d)*fine;
  alb = mix(alb, uGilt, gl); gilt = max(gilt, gl);
  float ky = smoothstep(.94 - aS, .94, d)*fine;
  alb = mix(alb, uKey, ky); gilt *= 1. - ky;
  // far away the scales melt into their average instead of shimmering
  float lod = smoothstep(.6, 1.8, aF);
  vec3 gAvg = mix(uGround, uScallop*.9, (1. - g)*.36)*.9;
  vec3 avg = gAvg*.6 + mix(uScallop, uGilt, smoothstep(.1, 1., g)*.85)*.22 + uGilt*.1 + uKey*.08;
  alb = mix(alb, avg, lod); gilt = mix(gilt, .1 + .2*g, lod);
  // centre roundel: spiral pearl, ringed sun or eight-petal flower
  float m0 = smoothstep(-.15, .15, sin(th*3. + r*40. + rnd*6.));
  vec3 rc0 = mix(uScallop, uGilt, m0);
  float m1 = step(.5, fract(r*13.5))*(.6 + .4*step(0., cos(th*12.)));
  vec3 rc1 = mix(uGround, uCream, m1);
  float pet = smoothstep(.0, aR + .004, .25*(.5 + .5*abs(cos(th*4.))) - r);
  vec3 rc2 = mix(uScallop*.8, mix(uCream, uGround, smoothstep(.02, .16, r)*.75), pet);
  float w1 = 1. - min(abs(uMotif - 1.), 1.), w2 = step(1.5, uMotif);
  vec3 rc = mix(mix(rc0, rc1, w1), rc2, w2);
  float rg = mix(mix(m0, 0., w1), 0., w2);
  float pearl = 1. - smoothstep(.055, .055 + aR, r);
  rc = mix(rc, uGround, pearl*(1. - w2)); rg *= 1. - pearl;
  float inR = 1. - smoothstep(.275 - aR, .275, r);
  alb = mix(alb, rc, inR); gilt = mix(gilt, rg, inR);
  float ring = smoothstep(.265 - aR, .265, r)*(1. - smoothstep(.315, .315 + aR, r));
  alb = mix(alb, uGilt, ring); gilt = max(gilt, ring);
  float kl = (1. - smoothstep(.005, .005 + aR, abs(r - .262))) + (1. - smoothstep(.005, .005 + aR, abs(r - .32))) + (1. - smoothstep(.004, .004 + aR, abs(r - .07)))*(1. - w2);
  // gilt rim with pearls
  float rim = smoothstep(.85 - aR, .85, r);
  float an = th/6.2831853*36.;
  vec2 pc = vec2((fract(an) - .5)*(6.2831853*.915/36.), r - .915);
  float pd = length(pc)/.034;
  float prl = 1. - smoothstep(.7, .7 + aR*30., pd);
  float prk = (1. - smoothstep(1., 1. + aR*30., pd))*(1. - prl);
  vec3 rimc = mix(uGilt, mix(uGround, uScallop, step(.5, fract(floor(an)*.5 + .25))), prl);
  rimc = mix(rimc, uKey, prk);
  alb = mix(alb, rimc, rim); gilt = mix(gilt, 1. - prl - prk, rim);
  kl += (1. - smoothstep(.006, .006 + aR, abs(r - .852))) + (1. - smoothstep(.005, .005 + aR, abs(r - .975)));
  kl = clamp(kl, 0., 1.)*(1. - smoothstep(.02, .06, fw));
  alb = mix(alb, uKey, kl); gilt *= 1. - kl;
  return vec4(alb, clamp(gilt, 0., 1.));
}

void main(){
  vec3 V = uCam - vPos; float dist = length(V); V /= max(dist, 1e-4);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  float fwx = fwidth(vUv.x);
  float fw = max(fwx + fwidth(vUv.y), 1e-5);
  float part = vP.x, k = vS.z, rnd = vS.w, lift = clamp(vS.x, 0., 1.);
  float ndv = abs(dot(N, V));
  float gal = dkGal(vPos), bay = dkBay(vPos);
  vec3 col;
  if (part < .5) {
    vec2 p = vUv; float r = length(p);
    vec4 pt = dkPaint(p, k, rnd, fw);
    vec3 alb = pt.rgb; float gilt = pt.a;
    // print mottle, brush drag and the weave of the silk
    alb *= .88 + .22*dkVn(p*vec2(9., 31.) + rnd*50.);
    float wv = sin(p.x*560.)*sin(p.y*560.);
    alb *= 1. + .09*wv*(1. - smoothstep(.1, .5, fw*560.));
    // bamboo ribs and the spar seen as shadows inside the lit disc
    float sw = max(fw*1.5, .006);
    float ribs = (1. - smoothstep(.011, .011 + sw, abs(p.x))) + (1. - smoothstep(.011, .011 + sw, abs(p.y + .12)));
    ribs += 1. - smoothstep(.03, .03 + sw*1.5, abs(p.y - .34 - .022*p.x*p.x));
    ribs = clamp(ribs, 0., 1.);
    // crinkled leaf normal for the gilt
    vec2 gn = vec2(dkVn(p*64. + 3.) - .5, dkVn(p*64. + 17.) - .5)*(1. - smoothstep(.01, .05, fw));
    vec3 Ng = normalize(N + vec3(gn.x, gn.y, 0.)*1.3);
    float bar = dkBars(vPos.z);
    vec3 front = alb*(dkDiffuse(N) + uRoof*(bar - .5)*.5);
    vec3 back = dkDiffuse(-N) + uRoof*(bar - .45)*uBars;
    vec3 tcol = (alb*alb*1.5 + alb*.3)*mix(1., .5, gilt);
    col = front*.38 + tcol*back*uTrans*(1. - .72*ribs);
    vec3 leaf = uGilt*(dkEnv(reflect(-V, Ng))*1.25 + uSun*dkSpec(Ng, V, 30.)*2.2);
    col += leaf*gilt*(.5 + .5*lift);
    col += uSun*.05*pow(max(1. - ndv, 0.), 3.);
    // under the drying deck the daylight is shut out; in the open bay the shaft of sky light goes through the silk
    col *= mix(1., .26, gal*(1. - .6*uLantern));
    float wrapB = clamp(dot(N, uSunDir)*.5 + .5, 0., 1.);
    col += uBayCol*bay*(alb*wrapB*.7 + tcol*(1. - .72*ribs)*(1.25 - wrapB) + leaf*gilt*.35);
    // lantern festival, and the lantern gallery on any day: a flame inside every disc
    float fl = .86 + .14*sin(uTime*7. + k*2.3)*sin(uTime*11.3 + k);
    vec2 lp = p - vec2(0., -.08);
    float lanE = max(uLantern, gal*uGalK);
    col += lanE*fl*lift*(tcol*uFlame*1.5*exp(-r*r*2.4) + uFlame*2.6*exp(-dot(lp, lp)*60.)*(1. - .6*ribs));
    col *= mix(.62, 1., lift)*(1. + .7*lift*(1. - vS.y));      // a small sun switching on as it stands
    // from the finishing floor the far chain already aloft glows through its silk, so the wave is read at once
    col += tcol*(uSun + uRoof)*lift*smoothstep(50., 120., dist)*(1. - smoothstep(30., 75., uEye))*(1. - .6*ribs)*.8;
  } else if (part < 1.5) {
    float al = vUv.y;
    float node = abs(fract(al/.62 + vP.w*3.) - .5)*.62;
    float nd = 1. - smoothstep(.012, .012 + max(fw, .02), node);
    vec3 a = uBamboo*(.78 + .3*dkVn(vec2(vUv.x*5., al*.8)))*(.9 + .2*dkVn(vec2(vUv.x*37., al*2.3)));
    a = mix(a, a*vec3(.72, .95, .5), .4*dkVn(vec2(al*.35, 3. + k)));
    a = mix(a, uKey*1.6 + a*.25, nd*.75);
    col = a*dkDiffuse(N) + uSun*dkSpec(N, V, 38.)*.45 + uBamboo*(uSun + uRoof)*.3*pow(max(1. - ndv, 0.), 3.);
  } else if (part < 2.5) {
    vec3 a = uCord*(.72 + .38*sin(vUv.y*95. + vUv.x*6.2831853));
    col = a*dkDiffuse(N) + uCord*uSun*.2*pow(max(1. - ndv, 0.), 2.);
  } else if (part < 3.5) {
    float x = vUv.x, t = vUv.y, ax = abs(x);
    float w = smoothstep(0., .1, t)*(1. - t*t*t*t*t)*.92 + .06;
    w *= .9 + .1*step(.3, fract(t*21. + vP.w*7.));
    if (ax > w + fwx) discard;
    float bars = smoothstep(.3, .62, fract(t*12. - ax*.9 + vP.w*.37));
    vec3 a = mix(uPlumeA, uPlumeB, bars);
    a *= .82 + .26*sin(ax*38. + t*90.)*(1. - smoothstep(.1, .5, fw*38.));
    a = mix(a, uCream*.85, (1. - smoothstep(.05, .13, ax))*.75);
    a = mix(a, uTuft, (1. - smoothstep(.0, .14, t))*.8);
    col = a*(dkDiffuse(N)*.5 + dkDiffuse(-N)*.6) + uSun*.06*pow(max(1. - ndv, 0.), 2.);
  } else {
    float t = vUv.y;
    float st = dkVn(vec2(vUv.x*46., t*2.5 + rnd*9.));
    if (t > .7 && st > (1. - t)*3.4) discard;
    vec3 a = uTuft*(.55 + .6*st);
    a = mix(a, uGilt, (1. - smoothstep(.0, .1, t))*.9);
    col = a*(dkDiffuse(N)*.6 + dkDiffuse(-N)*.6);
  }
  // bamboo, cord, plumes and tufts: lantern-lit under the deck, flaring in the shaft of the open bay
  if (part > .5) col = col*mix(1., .3, gal) + col*uFlame*1.9*gal*uGalK + col*uBayCol*bay*1.6;
  gl_FragColor = vec4(col*uGain, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- lines, trestles, dust
const LINE_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aL;            // disc k, fraction to disc k+1, which line (0 top, 1, 2), ribbon side
${GLSL_DISC}
uniform vec3 uCam; uniform float uTwang;
varying float vW; varying float vF; varying vec3 vPos;
vec3 dkAttach(float k, float li, out vec2 st){
  vec3 c, R, U, N; vec4 inf; discState(k, c, R, U, N, inf);
  float a = 1.5707963 + li*2.0943951;
  st = vec2(clamp(inf.x, 0., 1.), inf.z);
  return c + (R*cos(a) + U*sin(a))*2.5*inf.z;
}
void main(){
  vec2 s0, s1;
  vec3 A = dkAttach(aL.x, aL.z, s0), B = dkAttach(aL.x + 1., aL.z, s1);
  float f = aL.y, bow = 4.*f*(1. - f);
  vec3 p = mix(A, B, f);
  p.y -= mix(mix(.3, .9, step(.5, aL.z)), .1, min(s0.x, s1.x))*bow;
  p += vec3(sin(uTime*47. + aL.x*1.3 + aL.z*2.), cos(uTime*53. + aL.x), 0.)*bow*(.015 + .2*uTwang);
  vec3 dir = B - A; dir /= max(length(dir), 1e-4);
  vec3 toCam = uCam - p; float dist = length(toCam);
  vec3 side = cross(dir, toCam); side /= max(length(side), 1e-4);
  float w = max(.03, dist*.0015);
  p += side*aL.w*w*min(s0.y, s1.y);
  vW = clamp(.03/w, 0., 1.); vF = f; vPos = p;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const LINE_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uCream, uFlame;
varying float vW; varying float vF; varying vec3 vPos;
void main(){
  vec3 a = uCream*vec3(.5, .44, .32)*(1. + .25*sin(vF*260.));
  vec3 col = a*(uSun*.4 + uRoof*.7 + uSky*.35 + uAmb)*mix(.6, 1., vW);
  float gal = dkGal(vPos), bay = dkBay(vPos);
  col = col*mix(1., .3, gal) + col*uFlame*1.6*gal*uGalK + a*uBayCol*bay;
  gl_FragColor = vec4(col*uGain, 1.);
  #include <fog_fragment>
}`;
const TRESTLE_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute float aK;
attribute vec4 aP;
${GLSL_DISC}
varying vec2 vUv; varying vec4 vP; varying vec3 vN; varying vec3 vPos; varying float vLift;
void main(){
  float r = DK_R0 + DK_SP*aK, t = dkWave(r);
  vec3 tg = bodyAt(r + 1.5) - bodyAt(r - 1.5); tg.y = 0.; tg = normalize(tg);
  float yaw = (dkHash(aK + 50.) - .5)*.1;
  vec3 back = -tg*cos(yaw) + cross(tg, vec3(0., 1., 0.))*sin(yaw);
  vec3 side = cross(vec3(0., 1., 0.), back);
  // the empty trestle rocks after its disc leaves
  float rock = .05*sin(t*9.)*exp(-t*1.1)*step(.001, t);
  float cr = cos(rock), sr = sin(rock);
  vec3 p = position, n = normal;
  p.yz = vec2(p.y*cr - p.z*sr, p.z*cr + p.y*sr);
  n.yz = vec2(n.y*cr - n.z*sr, n.z*cr + n.y*sr);
  vec3 wl = vec3(snakeX(r), 0., DK_Z0 - r) + side*p.x + vec3(0., p.y, 0.) + back*p.z;
  vN = side*n.x + vec3(0., n.y, 0.) + back*n.z;
  vUv = uv; vP = aP; vPos = wl; vLift = clamp(dkLift(t), 0., 1.);
  vec4 mvPosition = modelViewMatrix*vec4(wl, 1.);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const TRESTLE_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uTimber, uBamboo, uFlame;
varying vec2 vUv; varying vec4 vP; varying vec3 vN; varying vec3 vPos; varying float vLift;
void main(){
  vec3 V = uCam - vPos; V /= max(length(V), 1e-4);
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float tint = vP.y;
  vec3 a = uTimber*(1.25 + 1.1*tint);
  a *= .62 + .7*dkVn(vec2(vUv.x*13. + tint*30., vUv.y*1.5));
  a *= .9 + .2*dkVn(vec2(vUv.x*55. + tint*9., vUv.y*5.));
  float e = 1. - smoothstep(0., .13, min(vUv.x, 1. - vUv.x));
  a = mix(a, uBamboo*.75, e*.5);                      // worn gold arrises
  float ndv = max(dot(N, V), 0.);
  vec3 col = a*dkDiffuse(N) + uBamboo*(uSun + uRoof)*.1*pow(max(1. - ndv, 0.), 3.);
  col *= .5 + .5*smoothstep(0., 1.8, vPos.y);         // falls into shadow toward the floor
  col *= mix(.62, 1., max(vLift, 1. - smoothstep(1.8, 3.2, vPos.y)));   // shade under the lying disc
  float gal = dkGal(vPos), bay = dkBay(vPos);
  col = col*mix(1., .28, gal) + a*uFlame*.5*gal*uGalK*(.5 + .5*N.y) + a*uBayCol*bay*clamp(dot(N, uSunDir)*.6 + .4, 0., 1.);
  gl_FragColor = vec4(col*uGain, 1.);
  #include <fog_fragment>
}`;
const DUST_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aD;
${GLSL_DISC}
uniform vec3 uCam; uniform float uPx;
varying float vA;
void main(){
  float r = position.x, ts = max(0., (r - uFront)/28.);
  vec3 base = vec3(snakeX(r) + (position.y - .5)*5.4, 3. + position.z*1.4, DK_Z0 - r + (aD.x - .5)*5.8);
  vec3 dir = vec3(position.y - .5, .5 + aD.y, aD.x - .5)*1.6;
  vec3 p = base + dir*(1. - exp(-ts*2.4))*2.4;
  p += vec3(sin(uTime*.7 + aD.x*30.)*.3, ts*.3, ts*1.4)*smoothstep(0., .5, ts);
  vA = smoothstep(0., .06, ts)*exp(-ts*.8)*step(.001, ts);
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mvPosition;
  gl_PointSize = vA < .01 ? 0. : clamp(aD.z*uPx/max(-mvPosition.z, .5), 0., 64.);
  #include <fog_vertex>
}`;
const DUST_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_LIGHT}
uniform vec3 uCream;
varying float vA;
void main(){
  vec2 q = gl_PointCoord*2. - 1.;
  float d = dot(q, q);
  if (d > 1.) discard;
  float a = (1. - d)*(1. - d)*vA*.34;
  gl_FragColor = vec4(uCream*(uSun*.55 + uRoof*.5 + uAmb)*uGain, a);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- light presets (linear multipliers)
export const MOODS = {
  afternoon: { sunDir: [0.78, 0.58, -0.22], sun: ['#ffe4b4', 1.55], sky: ['#a9c2e6', 0.36], roof: ['#f6dfae', 0.58], gable: [null, 0.78], ambient: ['#5a4230', 0.3], floor: ['#d9b36a', 0.16], lantern: 0 },
  lantern: { sunDir: [0.6, 0.7, -0.38], sun: ['#5f86d8', 0.5], sky: ['#4a6fc8', 0.36], roof: ['#5078d0', 0.42], gable: ['#3f6fe0', 0.95], ambient: ['#1c2a55', 0.45], floor: ['#c8783a', 0.12], lantern: 1 },
  rain: { sunDir: [0.5, 0.82, -0.28], sun: ['#d9dde0', 0.7], sky: ['#c4ccd4', 0.5], roof: ['#d5d9dc', 0.62], gable: ['#c9d2da', 0.7], ambient: ['#4a4744', 0.36], floor: ['#9a968c', 0.12], lantern: 0 },
  gold: { sunDir: [-0.86, 0.3, -0.22], sun: ['#ffb45a', 1.5], sky: ['#c9b7a8', 0.3], roof: ['#f0c890', 0.36], gable: [null, 0.6], ambient: ['#5a3a22', 0.3], floor: ['#e09848', 0.2], lantern: 0 },
  snow: { sunDir: [0.7, 0.66, -0.26], sun: ['#eef2f8', 1.02], sky: ['#cfdcf0', 0.5], roof: ['#e8eef6', 0.6], gable: ['#dfe8f4', 0.8], ambient: ['#4c5058', 0.38], floor: ['#c8d0dc', 0.2], lantern: 0 },
};

const toColor = (c, k = 1) => {
  const o = new THREE.Color();
  if (c && c.isColor) o.copy(c); else if (Array.isArray(c)) o.setRGB(c[0], c[1], c[2]); else o.set(c);
  return o.multiplyScalar(k);
};

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('hundred-segment-dragon') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map((h) => new THREE.Color(h));
  const [cCream, cBamboo, cTimber, cVerm, cVirid, cGilt, cSky] = pal;
  const pathLength = opts.pathLength ?? LEN;

  // per-seed cast: livery, roundel motif, plume colours, a little hue drift
  const livery = opts.livery ?? rng.pick(['vermilion', 'vermilion', 'azure', 'black']);
  const motif = opts.motif ?? rng.int(0, 2);
  const mood0 = MOODS[opts.mood] ? opts.mood : 'afternoon';
  const drift = (c, dh, ds = 0, dl = 0) => new THREE.Color().copy(c).offsetHSL(dh, ds, dl);
  const hue = rng.range(-0.012, 0.012);
  const L = {
    vermilion: { ground: drift(cVerm, hue), scallop: drift(cVirid, hue * 2), tuft: drift(cVerm, 0.01, 0, -0.03), cord: drift(cVerm, 0, -0.1, -0.2) },
    azure: { ground: drift(cSky, 0.02 + hue, 0.1, -0.33), scallop: drift(cCream, 0, 0, 0.02), tuft: drift(cSky, 0.02, 0.1, -0.25), cord: drift(cSky, 0.03, 0, -0.45) },
    black: { ground: new THREE.Color('#2b1b15'), scallop: drift(cGilt, hue, 0, -0.04), tuft: drift(cVerm, hue), cord: new THREE.Color('#1a100c') },
  }[livery] || null;
  const liv = L || { ground: cVerm, scallop: cVirid, tuft: cVerm, cord: drift(cVerm, 0, -0.1, -0.2) };
  const plumeTan = drift(cBamboo, rng.range(-0.025, 0.015), 0.08, rng.range(-0.1, -0.02));
  const plumeDark = drift(cTimber, 0, 0, -0.05);

  // shared uniforms: one object, referenced by every material
  const U = {
    uEye: { value: 0 }, uFront: { value: FRONT0 }, uTime: { value: 0 }, uTwang: { value: 0 }, uPx: { value: 400 },
    uCam: { value: new THREE.Vector3(0, 12, 0) },
    uSunDir: { value: new THREE.Vector3(0.78, 0.58, -0.22).normalize() },
    uSun: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uRoof: { value: new THREE.Color() },
    uGable: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() }, uFloor: { value: new THREE.Color() },
    uGain: { value: 1 }, uLantern: { value: 0 }, uTrans: { value: 1.05 }, uBars: { value: 0.9 }, uMotif: { value: motif },
    uFlame: { value: new THREE.Color(1.0, 0.5, 0.16) },
    uBay: { value: new THREE.Vector4(0, 0, 0, -9) }, uBayCol: { value: new THREE.Color(0, 0, 0) }, uGalK: { value: 0 },
    uGround: { value: liv.ground }, uScallop: { value: liv.scallop }, uGilt: { value: cGilt.clone() },
    uKey: { value: new THREE.Color('#150d09') }, uCream: { value: cCream.clone() }, uBamboo: { value: cBamboo.clone() },
    uCord: { value: liv.cord }, uPlumeA: { value: plumeTan }, uPlumeB: { value: plumeDark }, uTuft: { value: liv.tuft },
    uTimber: { value: cTimber.clone() },
  };
  let mood = mood0;
  function setLight(o = {}) {
    if (o.sunDir) { const d = o.sunDir; U.uSunDir.value.set(d.x ?? d[0], d.y ?? d[1], d.z ?? d[2]).normalize(); }
    if (o.sun) U.uSun.value.copy(toColor(o.sun));
    if (o.sky) U.uSky.value.copy(toColor(o.sky));
    if (o.roof) U.uRoof.value.copy(toColor(o.roof));
    if (o.gable) U.uGable.value.copy(toColor(o.gable));
    if (o.ambient) U.uAmb.value.copy(toColor(o.ambient));
    if (o.floor) U.uFloor.value.copy(toColor(o.floor));
    if (o.lantern !== undefined) U.uLantern.value = o.lantern;
    if (o.gain !== undefined) U.uGain.value = o.gain;
  }
  function setMood(name) {
    const m = MOODS[name] || MOODS.afternoon; mood = MOODS[name] ? name : 'afternoon';
    const col = (e) => toColor(e[0] || cSky, e[1]);
    setLight({ sunDir: m.sunDir, sun: col(m.sun), sky: col(m.sky), roof: col(m.roof), gable: col(m.gable), ambient: col(m.ambient), floor: col(m.floor), lantern: m.lantern });
  }
  setMood(mood0);
  if (opts.lantern !== undefined) U.uLantern.value = opts.lantern;

  const object = new THREE.Group(); object.name = 'hundred-segment-dragon';
  const mk = (vs, fs, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra,
  });
  const addMesh = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; object.add(m); return m; };
  let triangles = 0;

  // the dragon: the ridden disc and its two neighbours in fine geometry, the other 117 lighter
  const dragonMat = mk(DRAGON_VS, DRAGON_FS, { side: THREE.DoubleSide });
  const parts = {};
  for (const hi of [true, false]) {
    const g = buildDisc(hi), geo = g.build(true);
    const n = hi ? HI : COUNT - HI, ks = new Float32Array(n);
    for (let i = 0; i < n; i++) ks[i] = hi ? i : i + HI;
    geo.setAttribute('aK', new THREE.InstancedBufferAttribute(ks, 1));
    geo.instanceCount = n;
    triangles += (g.idx.length / 3) * n;
    parts[hi ? 'near' : 'body'] = addMesh(geo, dragonMat);
    await ctx.yield?.();
  }

  // the three lines, as camera-facing ribbons between the hoops
  {
    const SEG = 5, aL = [], idx = [];
    let v = 0;
    for (let li = 0; li < 3; li++) for (let k = 0; k < COUNT - 1; k++) for (let i = 0; i <= SEG; i++) {
      aL.push(k, i / SEG, li, -1, k, i / SEG, li, 1);
      if (i < SEG) idx.push(v, v + 1, v + 3, v, v + 3, v + 2);
      v += 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(v * 3), 3));
    geo.setAttribute('aL', new THREE.Float32BufferAttribute(aL, 4));
    geo.setIndex(idx);
    triangles += idx.length / 3;
    parts.lines = addMesh(geo, mk(LINE_VS, LINE_FS, { side: THREE.DoubleSide }));
  }
  await ctx.yield?.();

  // trestles
  if (opts.trestles !== false) {
    const g = buildTrestle(rng.fork ? rng.fork('trestle') : rng), geo = g.build(true);
    const ks = new Float32Array(COUNT); for (let i = 0; i < COUNT; i++) ks[i] = i;
    geo.setAttribute('aK', new THREE.InstancedBufferAttribute(ks, 1));
    geo.instanceCount = COUNT;
    triangles += (g.idx.length / 3) * COUNT;
    parts.trestles = addMesh(geo, mk(TRESTLE_VS, TRESTLE_FS));
  }
  await ctx.yield?.();

  // dust jumping off the line as the wave front passes (only the stretch still on its trestles at u = 0)
  if (opts.dust !== false) {
    const n = Math.round(1500 * detail), pos = new Float32Array(n * 3), aD = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rng.range(R0 - 4, FRONT0 + 10); pos[i * 3 + 1] = rng(); pos[i * 3 + 2] = rng();
      aD[i * 4] = rng(); aD[i * 4 + 1] = rng(); aD[i * 4 + 2] = rng.range(0.25, 0.8); aD[i * 4 + 3] = rng();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aD', new THREE.Float32BufferAttribute(aD, 4));
    const pts = new THREE.Points(geo, mk(DUST_VS, DUST_FS, { transparent: true, depthWrite: false }));
    pts.frustumCulled = false; pts.renderOrder = 3; object.add(pts); parts.dust = pts;
    triangles += n;
  }

  // ---- the curve for the world, and anchors
  const snake = {
    Z0, R0, SPACING: SP, COUNT, LENGTH: LEN, DROP, LEAD,
    x: snakeX, eyeY,
    eye: (s, out = new THREE.Vector3()) => out.set(snakeX(s), eyeY(s), Z0 - s),
    body: (s, out = new THREE.Vector3()) => out.set(snakeX(s), eyeY(s) - DROP, Z0 - s),
    restStation: (k) => R0 + SP * k,
    discStation: (k, sEye) => Math.max(R0 + SP * k, sEye + LEAD + SP * k),
    tailStation: (sEye) => Math.max(R0, sEye + LEAD),
    front: frontAt,
  };
  const flyThrough = [];
  for (let s = 0; s < LEN; s += 8) flyThrough.push(snake.eye(s));
  flyThrough.push(snake.eye(LEN));
  const crest = (s) => new THREE.Vector3(snakeX(s) + Math.sign(snakeX(s)) * 8, 0, Z0 - s);
  const anchors = {
    entry: snake.eye(0),
    flyThrough,
    portalSeat: { position: new THREE.Vector3(0, 18, Z0 - LEN), normal: new THREE.Vector3(0, 0, 1), radius: 7 },
    tailRest: new THREE.Vector3(snakeX(R0), 3.45, Z0 - R0),
    waveStart: snake.body(FRONT0),
    rackDips: [snake.eye(DIP1).add(new THREE.Vector3(0, 3.5, 0)), snake.eye(DIP2).add(new THREE.Vector3(0, 3.5, 0))],
    headRack: new THREE.Vector3(snakeX(424) + 8, 0, -430),
    bendPosts: [262.5, 367.5, 472.5, 577.5].map(crest),
    viewpoints: {
      ride: { position: snake.eye(382), target: snake.body(382 + LEAD + SP * 4).add(new THREE.Vector3(0, 3, 0)) },
      wave: { position: new THREE.Vector3(-14, 11, Z0 - 60), target: snake.body(150) },
      flank: { position: new THREE.Vector3(snakeX(300) + 26, 15, Z0 - 285), target: snake.body(310) },
    },
    sunDir: U.uSunDir.value,
  };

  // ---- progress
  let driven = false;
  function apply(u, sEye) {
    U.uEye.value = sEye ?? u * pathLength;
    U.uFront.value = frontAt(u);
    // the line snaps taut at u 0.01 and hums afterwards
    const a = (u - 0.01) / 0.004;
    U.uTwang.value = u < 0.01 ? Math.exp(-a * a) : Math.exp(-(u - 0.01) * 70);
  }
  apply(0);
  const _cam = new THREE.Vector3(), _sz = new THREE.Vector2();
  const view = { radius: 15, height: 16, center: new THREE.Vector3(snakeX(300), 13, Z0 - 300) };

  return {
    object, radius: view.radius, height: view.height, center: view.center, anchors,
    ground: false, groundY: 0,
    bounds: new THREE.Box3(new THREE.Vector3(-14, 0, Z0 - LEN), new THREE.Vector3(14, 26, Z0 - R0 + 5)),
    triangles: Math.round(triangles), drawCalls: object.children.length,
    snake, glsl: { curve: GLSL_CURVE }, uniforms: U, parts, livery, motif,
    get mood() { return mood; },
    setProgress(u, sEye) { driven = true; apply(clamp(u, 0, 1), sEye); },
    setLight, setMood,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) apply((time / 36) % 1);
      if (camera) {
        object.updateWorldMatrix(true, false);
        _cam.setFromMatrixPosition(camera.matrixWorld);
        U.uCam.value.copy(object.worldToLocal(_cam));
        const h = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_sz).y : 900;
        U.uPx.value = 0.5 * h * camera.projectionMatrix.elements[5];
      }
    },
    dispose() {},
  };
}
