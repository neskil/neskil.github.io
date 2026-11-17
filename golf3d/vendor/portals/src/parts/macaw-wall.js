// THE CLAY LICK: hero set piece for "macaw-wall" (the wall and its flush).
//
// A 300 m x 40 m river-cut clay cliff, banded red / ochre / grey, fluted by rain gullies, with one
// leaning buttress, an overhanging cap, a forest-edge fringe and dead snags on the rim, talus at the
// foot. About 600 large macaws (three species, always in pairs) cling to the upper third like a
// tapestry, about 200 small green parrots sit below them, and pairs queue in the rim snags. They bob
// at the clay, flare, turn and make short flutters; clay crumbs trickle. A harpy eagle comes over the
// rim from behind; its shadow slides down and along the face and the wall empties ahead of it in a
// wave travelling 60 m/s: every bird drops, opens (0.6 s blend, no pop) and drives out across the
// camera's bow, dust puffing off the bare clay and a few feathers spinning down. The birds then
// gather into a wheel about 180 m across over the river.
//
// ORIENTATION  origin = centre of the cliff foot at water level, +Y up. The cliff runs along X
//              (-150..150); its face looks toward +Z (the river). The camera is meant to run along
//              it in the -X direction, 22 m out (z = 22), so the wall is on its right.
// SIZE         hero.extent = { length: 300, height: ~40, depth: ~40 } is the real size of the cliff.
//              hero.radius / hero.center describe the STAGE in front of the scarlet band where the
//              flush crosses (that is what the part viewer orbits), not the whole cliff. The wheel
//              reaches about z = 23..133, x = -150..30, y = 12..40.
// COST         about 125-140k triangles (cliff 27k, rim/snags/talus 14k, macaws 132 each, small
//              parrots 44 each, shadows + dust 3k, harpy 0.2k), 7 draw calls, no lights, ~150 ms build.
//              hero.stats = { macaws, parrots, laneBirds, triangles, cast, buildMs }.
//
// DRIVING IT   One clock: the flush clock te (seconds), te = T - flushAt, T = u x duration.
//                hero.setProgress(u)   call every frame with the world's u (T = u x opts.duration)
//                hero.setFlushTime(te) the same thing in seconds relative to the burst
//              te < -1.4: everyone perched. te -1.4..2: the wave runs out from x = 45 both ways at
//              60 m/s. te 0: harpy 16 m over the eye line at x = 14. te 0.8..7: the lanes cross the bow;
//              each bird then blends onto the wheel over about 6 s.
//              Until one of the two is called the piece loops a demo (keyed to time and to the
//              viewer camera's bearing, so stills from different sides show different moments).
//              Ambient motion (bobs, flares, flutters, crumbs, wind) uses the time given to update().
//              hero.harpyAt(te, out) -> local position of the harpy; hero.shadowAt(te, out) -> where its
//              shadow lies on the face (a good POI); hero.eyeAt(te, out) -> the eye line the lanes use.
//
// OPTS         palette    7 hex strings, brief order [clay, scarlet, blue, yellow, green, ochre-brown, cream]
//              sunDir     [x,y,z] TOWARD the sun, local space (default: 14 deg up, three-quarters behind
//                         a camera travelling -X: [0.84, 0.24, 0.485]). Shadows on the face are baked from it.
//              sunColor ('#FFD9A0'), sunIntensity (2.7), skyColor (cool fill), groundColor (bounce)
//              shadowLineY  height (m) below which the wall is still in the far bank's blue shadow (7)
//              hour       'dawn' | 'day' | 'golden' presets for the above (explicit opts win); 'golden'
//                         also seats a smaller second sitting of birds
//              weather    'dry' | 'rain' (darker, wetter wall)
//              cast       'mixed' | 'red' | 'blue' | 'green' (default: chosen by seed)
//              density    400..800 total birds (default by seed, about 800)
//              duration   world seconds (40), flushAt  world second of the burst (12.4 = u 0.31)
//              eyeLine    [[te, x, y, z], ...] local-space camera line during the flush (sample your real path
//                         every 0.5-1 s from te -7 to 13). Every wall macaw is given a lane: a point in the
//                         moving eye frame, ahead and a little left of the line, that it flies through at its
//                         own moment between laneFrom (0.8) and laneTo (7.0) seconds. About 50 pass 2.8-5 m
//                         from the lens, about 110 at 5-10.5 m, the rest 10-36 m out (hero.stats.laneBirds
//                         counts the first two shells). hero.birdAt(k, te, out) gives macaw k's position.
//              track      the wheel: { loop: [[x,y,z], ...] closed control points of a loop flown at `speed`
//                         (14 m/s), refPoint [x,y,z] + teRef: the body of the flock is nearest refPoint at
//                         te = teRef, sigma: its half length in metres, bulk: its share of the macaws }.
//                         Without it an ellipse from wheelCenter (-60, 25, 78) and wheelRadius ([90, 55]).
//              floorY     lowest height a flying bird may reach (1.7): water level plus a little
//              skein      { pairs, route: 48 x [x,y,z], t0, dt, join: [te, seconds], shape(te) }: `pairs` pairs of macaws (the
//                         body of the wheel) leave it at `join` for a line of their own, fly it a little ahead of the lens and
//                         settle pair by pair on perches handed over with hero.setPerches (see SK in buildHero). hero.skein,
//                         hero.skeinAt(te, out): the middle of the skein's line; a good POI
//              early      { pairs, x0, x1, xFull, thin, t0, xw, wave, jitter, line, keep, hold }: an early flight: pairs that leave the wall long before
//                         the flush, cross the lens's bow and circle over the river in front of the wall until it (see buildHero)
//              extraSlots how many more macaws the world may seat elsewhere for good with hero.setExtras
//              lead       how many macaws the world flies itself with hero.setLead (its opening pair)
//              backBirds  how many macaws are back on the wall at stage 2 (320)
//   hero.setStage(0 | 1 | 2): everything | only the skein and the extras (the forest hides the rest) | the wall filled again
//              harpy      false to leave the eagle (not its shadow logic) out
//              harpyAt    (te, out) => Vector3: replaces the eagle's flight line (the rare stoop); harpyEnd: te at which it fades (12.5)
//              scare      (te) => metres: birds within about 2.6x this of the eagle are pushed out of its way (0 = off)
//              waterY     water level (0): the fallen blocks at the foot stand in it, wet to that line, with foam round them
//   also on the hero: wheelAt(s, lat, hy, out) point on the wheel s metres along it; track (with sRef, length)
//
// ANCHORS (local space, THREE.Vector3 unless noted)
//   flyThrough   ordered points of the default eye line (>= 9 m from clay everywhere, 22 m off the face)
//   eyeLine      the same with times: [te, x, y, z]
//   buttress     tip of the leaning buttress (the close pass, about 9 m from the eye line)
//   scarletBand  centre of the main macaw band on the face; bandNormal its outward normal
//   waveOrigin   where the flush wave starts; harpyOver: harpy position at te = 0
//   wheelCenter, wheelRadius ([rx, rz])
//   rim          array of points along the rim lip (seat your forest behind them, z < their z)
//   foot         array of points along the waterline of the cliff (for eddies / foam)
//   snags        tips of the dead rim trees
//   viewpoints   { approach, alongWall, flush, wheel }: { position, look }
//   portalSeat   { position, facing }: only a suggestion; in the brief the portal is in the kapok,
//                not here. It sits over the river beyond the wheel, facing back toward the wall.
//   sunDir       unit vector toward the sun in use
//
// LIGHTING     Everything is a ShaderMaterial lit from opts (sunDir, sunColor, skyColor), in LOCAL
//              space, so it ignores scene lights but takes scene fog (Fog or FogExp2). Linear HDR:
//              sunlit clay peaks about 1.0, sunlit scarlet about 1.4, backlit wings about 2 (bloom).
//              Match your key light to anchors.sunDir. The foot of the wall below shadowLineY takes
//              no sun; hero.setShadowLine(y) lets it creep down. hero.setLight({sunColor, skyColor,
//              groundColor, sunIntensity}) retints at run time (sunDir is baked).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#B5472A', '#E3261B', '#1F5FBF', '#F5C518', '#2F5E2E', '#8A6A45', '#EAE3D2'];
const LEN = 300, HALF = 150, HT = 40;
const WAVE_X = 45, WAVE_T = -1.4, WAVE_V = 60;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const DEMO_LOOP = 26;

// ---------- shared GLSL ----------
const GLSL_NOISE = /* glsl */`
float mwHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mwHash1(float p){ return fract(sin(p * 91.3458) * 47453.5453); }
vec3 mwHash3(float p){ return fract(sin(vec3(p * 12.9898, p * 78.233, p * 39.425)) * vec3(43758.5453, 24634.6345, 35734.7341)); }
float mwNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mwHash(i), mwHash(i + vec2(1., 0.)), f.x), mix(mwHash(i + vec2(0., 1.)), mwHash(i + vec2(1., 1.)), f.x), f.y); }
float mwFbm(vec2 p){ return 0.5 * mwNoise(p) + 0.25 * mwNoise(p * 2.03 + 7.1) + 0.125 * mwNoise(p * 4.1 + 3.3) + 0.0625 * mwNoise(p * 8.3 + 1.7); }
`;
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol;
uniform float uShadowY, uWaterY;
float mwSunLine(vec3 p){ return smoothstep(uShadowY - 1.5, uShadowY + 3.0, p.y + 1.2 * sin(p.x * 0.11) + 0.8 * sin(p.x * 0.37 + 1.3)); }
vec3 mwAmbient(vec3 n){ return mix(uGndCol, uSkyCol, clamp(n.y * 0.5 + 0.5, 0., 1.)); }
`;
// the flush clock shared by birds, shadows and dust: where a released bird is, tau seconds after release
const GLSL_FLIGHT = /* glsl */`
uniform float uTe, uTime, uBack;
uniform vec4 uScare, uTrk, uRt, uSkL, uSkQ, uHold, uHoldR;
uniform vec3 uHoldP;
float mwGo(float tau){ return tau * tau / (tau + 0.5); }
float mwDip(float tau){ float k = tau / 0.45; return -1.3 * k * exp(1.0 - k); }
// the wheel is a closed loop flown at one speed: uLoop = 24 points spaced evenly along it (a uniform Catmull-Rom spline runs
// through them), uTrk.z = its length in metres, uTrk.w = m/s (uTrk.x = the lowest a flying bird goes); s = metres along it, lat = metres to the left of travel
uniform vec3 uLoop[24];
vec3 mwLoopPt(float f){
  float i = floor(f), t = f - i;
  vec3 p0 = uLoop[int(mod(i + 23.0, 24.0))], p1 = uLoop[int(mod(i, 24.0))], p2 = uLoop[int(mod(i + 1.0, 24.0))], p3 = uLoop[int(mod(i + 2.0, 24.0))];
  return 0.5 * (2.0 * p1 + (p2 - p0) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (3.0 * p1 - p0 - 3.0 * p2 + p3) * t * t * t);
}
vec3 mwWheel(float s, float lat, float hy){
  float P = max(uTrk.z, 1.0), f = mod(s, P) / P * 24.0;
  vec3 c = mwLoopPt(f), d = mwLoopPt(f + 0.25) - c;
  vec2 o = normalize(vec2(d.z, -d.x) + vec2(1e-5, 0.0));
  return vec3(c.x + o.x * lat, c.y + hy, c.z + o.y * lat);
}
// the skein's line: an open route of 48 points, point k being where the line is at flush time uRt.x + k * uRt.y (it is the
// world's own camera line, so a bird that flies it some seconds ahead of the clock stays that far ahead of the lens)
uniform vec3 uRoute[48];
vec3 mwRoutePt(float f){
  f = clamp(f, 0.0, 46.999);
  float i = floor(f), t = f - i;
  vec3 p0 = uRoute[int(max(i - 1.0, 0.0))], p1 = uRoute[int(i)], p2 = uRoute[int(min(i + 1.0, 47.0))], p3 = uRoute[int(min(i + 2.0, 47.0))];
  return 0.5 * (2.0 * p1 + (p2 - p0) * t + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t + (3.0 * p1 - p0 - 3.0 * p2 + p3) * t * t * t);
}
`;

// ---------- tiny indexed mesh builder (position + aPart, optional colour) ----------
class Mini {
  constructor() { this.p = []; this.a = []; this.c = []; this.i = []; }
  get n() { return this.p.length / 3; }
  v(x, y, z, a0 = 0, a1 = 0, a2 = 0, a3 = 0, col = null) {
    this.p.push(x, y, z); this.a.push(a0, a1, a2, a3);
    if (col) this.c.push(col.r, col.g, col.b); else this.c.push(1, 1, 1);
    return this.p.length / 3 - 1;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // rings: [{z, y, rx, ry, a:[4], col}], first and last may have rx = 0 (apex fan). Axis = +Z.
  loft(rings, sides) {
    let prev = null;
    for (const r of rings) {
      const a = r.a || [0, 0, 0, 0];
      let cur;
      if (!(r.rx > 0)) cur = [this.v(r.x || 0, r.y || 0, r.z, a[0], a[1], a[2], a[3], r.col)];
      else { cur = []; for (let k = 0; k < sides; k++) { const t = (k / sides) * Math.PI * 2 + (r.twist || 0); cur.push(this.v((r.x || 0) + Math.cos(t) * r.rx, (r.y || 0) + Math.sin(t) * r.ry, r.z, a[0], a[1], a[2], a[3], r.col)); } }
      if (prev) for (let k = 0; k < sides; k++) {
        const k1 = (k + 1) % sides;
        if (prev.length === 1 && cur.length > 1) this.tri(prev[0], cur[k1], cur[k]);
        else if (cur.length === 1 && prev.length > 1) this.tri(prev[k], prev[k1], cur[0]);
        else if (cur.length > 1) this.quad(prev[k], prev[k1], cur[k1], cur[k]);
      }
      prev = cur;
    }
  }
  build(withColor = false) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.a, 4));
    if (withColor) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

// merge Mini-style pieces placed by a matrix into flat arrays (for the static decor mesh)
function pushTransformed(dst, mini, m, sway = 0, aux = null) {      // aux = [kind, scale of the ring coordinate, hash] (slumped blocks)
  const base = dst.p.length / 3, v = new THREE.Vector3();
  for (let k = 0; k < mini.p.length; k += 3) {
    v.set(mini.p[k], mini.p[k + 1], mini.p[k + 2]).applyMatrix4(m);
    dst.p.push(v.x, v.y, v.z); dst.c.push(mini.c[k], mini.c[k + 1], mini.c[k + 2]);
    dst.s.push(sway * mini.a[(k / 3) * 4]);
    if (aux) dst.x.push(aux[0], aux[1] * mini.a[(k / 3) * 4], aux[2]); else dst.x.push(0, 0, 0);
  }
  for (const i of mini.i) dst.i.push(base + i);
}

// ---------- the cliff: a heightfield z = face(x, y), built once and sampled for perches and shadows ----------
function makeFace(noise, rng) {
  const sx = rng.range(0, 900), xb = rng.range(55, 58), xb2 = rng.range(-95, -60), bw = rng.range(5.6, 7.0);
  const fl = rng.range(0.042, 0.058), ledge = rng.range(0.44, 0.58);
  const topH = (x) => { const e = smoothstep(HALF, 92, Math.abs(x)); return HT * (0.14 + 0.86 * e) * (0.94 + 0.07 * noise.n2(x * 0.013 + sx, 3.3)); };
  const raw = (x, y) => {
    const H = topH(x), vv = clamp(y / H, 0, 1);
    let z = 7 * Math.pow(1 - vv, 1.3) + 2.6 * Math.pow(1 - vv, 6);
    z += 3.2 * noise.n2(x * 0.011 + sx, 9.1);
    const w = x * fl + 0.5 * noise.n2(x * 0.02 + sx, y * 0.035);
    const g1 = 1 - Math.abs(noise.n2(w + sx, 7.7 + y * 0.004));
    z += 3.0 * (g1 * g1 - 0.5) * (0.3 + 0.7 * vv);
    const g2 = 1 - Math.abs(noise.n2(x * 0.17 + sx, 2.2 + y * 0.012));
    z += 0.8 * (g2 * g2 - 0.5) * vv;
    const ph = y * ledge + 0.9 * noise.n2(x * 0.03 + sx, y * 0.1 + 5), f = ph - Math.floor(ph);
    z += 0.5 * (0.5 - f) * smoothstep(0, 0.14, f);
    z += 1.1 * smoothstep(0.84, 0.96, vv);
    const prof = smoothstep(0, 0.12, vv) * (1 - smoothstep(0.5, 0.92, vv));
    const d1 = (x - xb) / bw, d2 = (x - xb2) / 8.5;
    z += 9.0 * Math.exp(-d1 * d1) * prof * (1 + 0.12 * noise.n2(x * 0.3, y * 0.3));
    z += 4.5 * Math.exp(-d2 * d2) * prof;
    z += 0.3 * noise.fbm2(x * 0.31 + sx, y * 0.31, 3);
    return z;
  };
  return { raw, topH, xb, xb2 };
}

const CLIFF_VERT = /* glsl */`
attribute vec2 aBake;
varying vec3 vP, vN; varying vec2 vBake;
#include <common>
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vBake = aBake;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CLIFF_FRAG = /* glsl */`
varying vec3 vP, vN; varying vec2 vBake;
uniform vec3 uClay, uOchre, uGrey, uSoil, uPale;
uniform float uWet, uHarpyOn, uBandY, uSeedF;
uniform vec3 uHarpy, uHarpyW, uHarpyF, uCamL;
uniform float uHarpyFlap;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
float mwHarpyShadow(vec3 p){
  vec3 d = uHarpy - p; float t = dot(d, uSunDir);
  vec3 o = d - uSunDir * t;
  float a = dot(o, uHarpyW), b = dot(o, uHarpyF);
  float d1 = length(vec2(a / (2.2 + 0.7 * uHarpyFlap), (b - 0.15) / 0.8));
  float d2 = length(vec2(a / 0.7, (b + 0.5) / 1.7));
  float s = min(d1, d2);
  return 1.0 - 0.9 * smoothstep(1.3, 0.55, s) * step(0.0, t) * uHarpyOn;
}
// relief the mesh is too coarse to carry (metres out of the face): rain flutes three metres apart with rills between them, hard
// beds that stand out as ledges with an undercut beneath, and hollows the birds have dug into the soft bands. cav = how deep in
// a hollow this point lies (0..1); fine fades the rills out with distance
float mwRelief(vec2 q, float y, float fine, out float cav){
  float fl = abs(mwNoise(vec2(q.x * 0.31, y * 0.045 + 3.0)) * 2.0 - 1.0);
  float h = 0.6 * fl * (2.0 - fl);
  float rl = abs(mwNoise(vec2(q.x * 1.25 + 9.0, y * 0.09)) * 2.0 - 1.0); h += 0.17 * rl * fine;
  float bc = y * 0.62 + 0.9 * mwNoise(vec2(q.x * 0.035, y * 0.2 + 7.0)), bf = fract(bc), hard = step(0.42, mwHash1(floor(bc) + 5.0));
  h += hard * 0.34 * smoothstep(0.0, 0.11, bf) * (1.0 - 0.7 * smoothstep(0.5, 1.0, bf));
  vec2 hc = vec2(q.x / 3.4, y / 2.6), hi = floor(hc), hf = fract(hc) - 0.5 - 0.3 * (vec2(mwHash(hi + 3.1), mwHash(hi + 7.7)) - 0.5);
  float hr = length(hf * vec2(3.4, 2.6)) / (0.5 + 0.6 * mwHash(hi + 1.3));
  cav = step(0.6, mwHash(hi + 9.9)) * (1.0 - smoothstep(0.3, 1.0, hr));
  return h - 0.75 * cav;
}
void main(){
  vec3 n0 = normalize(vN + vec3(0., 0., 1e-5));
  vec2 q = vec2(vP.x + 0.6 * vP.z, vP.y);
  float h = vP.y + 0.012 * vP.x + 1.5 * mwNoise(vec2(q.x * 0.045, vP.y * 0.22));
  float b = h * 0.36 + uSeedF, bi = floor(b), bf = fract(b);
  float r = mix(mwHash1(bi), mwHash1(bi + 1.0), smoothstep(0.74, 1.0, bf));
  vec3 alb = mix(uClay, uOchre, smoothstep(0.55, 0.85, r));
  float ty = vP.y - uWaterY, toe0 = smoothstep(9.0, 3.0, ty), dC = distance(uCamL, vP);
  alb = mix(alb, uGrey, smoothstep(0.86, 0.96, r) * (1.0 - 0.6 * toe0));
  alb = mix(alb, uClay * vec3(0.66, 0.6, 0.62), smoothstep(0.22, 0.04, r));
  alb *= 0.88 + 0.24 * mwHash1(floor(h * 3.1));
  float g = mwFbm(q * vec2(1.3, 2.6));
  float gx = mwFbm((q + vec2(0.18, 0.0)) * vec2(1.3, 2.6)) - g, gy = mwFbm((q + vec2(0.0, 0.12)) * vec2(1.3, 2.6)) - g;
  alb *= (0.76 + 0.46 * g) * (0.9 + 0.2 * mwNoise(q * vec2(9.0, 15.0)));
  float st = mwNoise(vec2(q.x * 2.3, vP.y * 0.035)) * mwNoise(vec2(q.x * 0.31, vP.y * 0.03 + 3.0));
  alb *= 1.0 - 0.34 * smoothstep(0.3, 0.62, st) * (0.55 + 0.45 * uWet);
  // paler, freshly scraped clay where the birds feed
  float band = smoothstep(9.0, 3.0, abs(vP.y - uBandY));
  float pock = smoothstep(0.62, 0.8, mwNoise(q * vec2(0.9, 1.5) + 11.0));
  alb = mix(alb, uPale, 0.25 * band * pock);
  // close range: thin laminations, pits and fine cracks (fade before they could alias)
  float nearK = 1.0 - smoothstep(16.0, 55.0, dC);
  float lam = mwNoise(vec2(q.x * 0.5, vP.y * 8.0)), pit = mwNoise(q * vec2(4.0, 6.0)) * mwNoise(q * vec2(11.0, 15.0) + 3.0);
  float crk = smoothstep(0.08, 0.0, abs(mwNoise(q * vec2(1.7, 0.9) + 21.0) - 0.5)) * smoothstep(0.4, 0.7, mwNoise(q * 0.5 + 5.0));
  alb *= 1.0 - nearK * (0.2 * smoothstep(0.5, 0.8, lam) + 0.38 * smoothstep(0.25, 0.55, pit) + 0.45 * crk - 0.1);
  gy += nearK * (lam - 0.5) * 0.35;
  // the toe of the wall: thin beds standing out as ledges, each jointed into blocks of its own tone, the seams and joints dark;
  // wet and dark at the waterline with a pale line of dried silt above it (fades with distance before the beds could alias)
  float toe = toe0 * (1.0 - smoothstep(70.0, 150.0, dC));
  float bedC = vP.y * 2.9 + 1.3 * mwNoise(vec2(q.x * 0.21, vP.y * 0.6)) + 0.4 * mwNoise(q * vec2(1.1, 0.4) + 7.0), bedF = fract(bedC), bedH = mwHash1(floor(bedC) + 3.0);
  float ledge = smoothstep(0.0, 0.16, bedF) * (1.0 - smoothstep(0.84, 1.0, bedF));
  float jc = q.x * (0.36 + 0.5 * bedH) + 13.0 * bedH + 0.5 * mwNoise(vec2(q.x * 0.9, bedC)), jf = fract(jc);
  float joint = 1.0 - smoothstep(0.0, 0.07, min(jf, 1.0 - jf)), blockT = mwHash1(floor(jc) + 17.0 * floor(bedC));
  alb = mix(alb, alb * (0.6 + 0.6 * blockT) * vec3(0.95, 0.88, 0.84), toe);
  alb *= 1.0 - toe * (0.6 * (1.0 - ledge) + 0.5 * joint * ledge);
  gy += toe * (0.5 - bedF) * 0.8 * ledge;
  float top = smoothstep(0.5, 0.85, n0.y);
  // ledges, flutes and hollows, lit by the raking sun (they fade before they could alias, the rills first)
  float relK = (1.0 - smoothstep(190.0, 360.0, dC)) * (1.0 - 0.8 * toe0), fineK = 1.0 - smoothstep(45.0, 120.0, dC), re = max(0.07, dC * 0.0026), cav, cv2;
  float h0 = mwRelief(q, vP.y, fineK, cav), sx = clamp((mwRelief(q + vec2(re, 0.0), vP.y, fineK, cv2) - h0) / re, -1.6, 1.6), sy = clamp((mwRelief(q, vP.y + re, fineK, cv2) - h0) / re, -1.6, 1.6);
  gx += relK * sx * 0.62; gy += relK * sy * 0.62;
  alb *= 1.0 - relK * (0.5 * cav + 0.12 * (0.6 - h0));
  alb = mix(alb, uSoil * (0.7 + 0.6 * g), top);
  float tn = mwNoise(vec2(q.x * 0.55, 3.0)), foot = smoothstep(2.4, 0.2, ty), wetL = smoothstep(1.0, 0.25, ty + 0.5 * tn);
  alb *= mix(1.0, 0.62, foot) * mix(1.0, 0.7, uWet) * mix(1.0, 0.6, wetL);
  alb = mix(alb, uPale * 0.75, 0.3 * smoothstep(0.2, 0.0, abs(ty - 1.15 - 0.5 * tn)) * toe0);
  vec3 n = normalize(n0 + vec3(-gx * 1.3, -gy * 1.3, 0.0) * (1.0 - top));
  float nl = max(dot(n, uSunDir), 0.0);
  // the baked cast shadows (gullies, the buttress): one clear edge, a little ragged with the clay, instead of a soft smear; in
  // them the wall is lit by the sunlit clay opposite and by the sky, so a shadow is deep red-violet, never a black patch
  float cshd = smoothstep(0.3, 0.62, vBake.x + 0.22 * (g - 0.47) + 0.1 * (mwNoise(q * vec2(0.7, 1.1) + 31.0) - 0.5));
  float vis = cshd * mwSunLine(vP) * mwHarpyShadow(vP) * (1.0 - 0.55 * relK * cav * step(0.0, sx + 0.35 * sy));
  vec3 col = alb * (uSunCol * nl * vis + mwAmbient(n) * vBake.y);
  col += alb * (uClay * uSunCol * 0.3 + uSkyCol * 0.22) * (1.0 - cshd) * mwSunLine(vP) * vBake.y;          // warm bounce and sky in the gullies
  vec3 vdir = normalize(uCamL - vP + vec3(0., 1e-4, 0.));
  col += uSkyCol * (0.05 * foot + 0.12 * uWet) * (0.04 + 0.96 * (1.0 - max(dot(vdir, n), 0.0)));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

async function buildCliff(face, L, U, ctx) {
  const NX = 280, NY = 44, rimBack = [1.2, 4, 10, 22], rimUp = [0.55, 0.95, 0.7, -2.5];
  const rows = NY + 2 + rimBack.length, cols = NX + 1, dx = LEN / NX;
  const gz = new Float32Array(cols * (NY + 1)), Hc = new Float32Array(cols);
  for (let i = 0; i < cols; i++) {
    await ctx.yield();
    const x = -HALF + i * dx; Hc[i] = face.topH(x); for (let j = 0; j <= NY; j++) gz[i * (NY + 1) + j] = face.raw(x, (j / NY) * Hc[i]);
  }
  const topAt = (x) => { const f = clamp((x + HALF) / dx, 0, NX - 1e-4), i = Math.floor(f), t = f - i; return Hc[i] * (1 - t) + Hc[i + 1] * t; };
  // bilinear face depth; v > 1 (above the rim) returns -1e3 (nothing there)
  const zAt = (x, y) => {
    if (x < -HALF || x > HALF) return -1e3;
    const f = clamp((x + HALF) / dx, 0, NX - 1e-4), i = Math.floor(f), t = f - i;
    const H = Hc[i] * (1 - t) + Hc[i + 1] * t, v = y / H; if (v > 1 || v < 0) return -1e3;
    const g = Math.min(v * NY, NY - 1e-4), j = Math.floor(g), s = g - j, a = i * (NY + 1) + j, b = a + NY + 1;
    return (gz[a] * (1 - s) + gz[a + 1] * s) * (1 - t) + (gz[b] * (1 - s) + gz[b + 1] * s) * t;
  };
  const pos = new Float32Array(cols * rows * 3), bake = new Float32Array(cols * rows * 2), idx = [];
  for (let i = 0; i < cols; i++) {
    await ctx.yield();                                            // the sun is traced from every vertex of the column
    const x = -HALF + i * dx, H = Hc[i], zTop = gz[i * (NY + 1) + NY];
    for (let r = 0; r < rows; r++) {
      let y, z, vis = 1, ao = 1;
      if (r === 0) { y = -3; z = gz[i * (NY + 1)] + 2.5; vis = 0; ao = 0.6; }
      else if (r <= NY + 1) {
        const j = r - 1; y = (j / NY) * H; z = gz[i * (NY + 1) + j];
        let pen = 0;
        for (let s = 1; s <= 34; s++) {
          const qx = x + L.x * s, qy = y + L.y * s, qz = z + L.z * s;
          const zf = zAt(qx, qy); if (zf < -900) { if (qx < -HALF || qx > HALF || qy > topAt(qx)) break; continue; }
          pen = Math.max(pen, zf - qz - 0.02 * s);
        }
        vis = 1 - smoothstep(0.0, 0.8, pen);
        let zb = 0, nb = 0; for (let k = -4; k <= 4; k++) { const ii = i + k; if (ii < 0 || ii >= cols) continue; zb += gz[ii * (NY + 1) + j]; nb++; }
        ao = clamp(0.84 + 0.3 * (z - zb / nb), 0.42, 1.12);
      } else { const k = r - NY - 2; y = H + rimUp[k] + 0.25 * Math.sin(x * 0.7 + k); z = zTop - rimBack[k]; ao = 0.9; }
      const o = (i * rows + r) * 3; pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
      bake[(i * rows + r) * 2] = vis; bake[(i * rows + r) * 2 + 1] = ao;
    }
  }
  await ctx.yield();
  for (let i = 0; i < NX; i++) for (let r = 0; r < rows - 1; r++) { const a = i * rows + r, b = a + rows; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aBake', new THREE.BufferAttribute(bake, 2));
  geo.setIndex(idx);
  await ctx.yield();
  geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: CLIFF_VERT, fragmentShader: CLIFF_FRAG, fog: true });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  // outward normal of the face (finite differences on the real function)
  const normalAt = (x, y, out) => { const e = 0.6, zx = (face.raw(x + e, y) - face.raw(x - e, y)) / (2 * e), zy = (face.raw(x, y + e) - face.raw(x, Math.max(0, y - e))) / (2 * e); return out.set(-zx, -zy, 1).normalize(); };
  return { mesh, zAt, topAt, normalAt, tris: idx.length / 3 };
}

// ---------- rim fringe, hanging drapes, dead snags, talus (one static mesh, wind in the shader) ----------
const DECOR_VERT = /* glsl */`
attribute vec3 aCol, aAux; attribute float aSway;
varying vec3 vP, vN, vC, vAux; varying float vSw;
uniform float uTime;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position; float w = aSway;
  p.x += w * (0.16 * sin(uTime * 1.3 + position.x * 0.35 + position.y * 0.6) + 0.06 * sin(uTime * 2.9 + position.z * 1.7 + position.x));
  p.z += w * 0.12 * sin(uTime * 1.1 + position.x * 0.5 + 1.7);
  vP = p; vN = normal; vC = aCol; vSw = aSway; vAux = aAux;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DECOR_FRAG = /* glsl */`
varying vec3 vP, vN, vC, vAux; varying float vSw;
uniform vec3 uCamL, uBlkClay, uBlkOchre;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 fdx = dFdx(vP), fdy = dFdy(vP);
  float leaf = step(0.001, vSw);
  float m = mwNoise(vP.xy * 2.6 + vP.z * 1.9), m2 = mwNoise(vP.xz * 7.0 + vP.y * 5.0);
  float line = mwSunLine(vP);
  vec3 col;
  if (vAux.x > 1.5) {
    // a slumped block of the cliff: flat broken faces, its own tilted bedding, cracks; dark and wet at the waterline
    vec3 toC = uCamL - vP, V = toC / max(length(toC), 1e-3);
    vec3 fn = normalize(cross(fdx, fdy) + vec3(0., 1e-6, 0.)); if (dot(fn, V) < 0.0) fn = -fn;
    // beds a third of a metre thick, square to the block's own axis: red clay, ochre, here and there a pale one; dark seams
    float hb = vAux.y * 2.1 + vAux.z * 31.0 + 0.5 * m + 0.25 * mwNoise(vP.xz * 0.9 + 9.0), bi = floor(hb), bf = fract(hb), r = mwHash1(bi + vAux.z * 57.0), r2 = mwHash1(bi * 1.7 + 3.0);
    vec3 alb = mix(uBlkClay, uBlkOchre, 0.75 * step(0.78, r)) * (0.86 + 0.2 * r2);
    alb = mix(alb, uBlkOchre * 1.2 + 0.04, step(0.95, r));
    alb *= 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.14, bf) * (1.0 - smoothstep(0.86, 1.0, bf)));
    alb *= 0.9 + 0.2 * m2;
    alb *= 1.0 - 0.5 * smoothstep(0.03, 0.0, abs(mwNoise(vP.xz * 0.6 + vP.y * 0.8 + 5.0) - 0.5));        // a crack or two
    float ty = vP.y - uWaterY, tn = mwNoise(vP.xz * 0.9 + 2.0), wet = smoothstep(0.95, 0.75, ty + 0.3 * tn);
    alb *= mix(1.0, 0.22, wet);                                                                          // dark and wet to the last high water
    alb = mix(alb, uBlkOchre * 1.2 + 0.05, 0.4 * smoothstep(0.08, 0.0, abs(ty + 0.3 * tn - 0.99)));     // and a pale line of dried silt above it
    float nl = max(dot(fn, uSunDir), 0.0), ao = 0.55 + 0.45 * smoothstep(-0.2, 1.4, ty);
    vec3 amb = mwAmbient(fn); amb = mix(amb, vec3(dot(amb, vec3(0.3, 0.55, 0.15))), 0.55) * (0.85 + 0.75 * max(fn.y, 0.0));
    col = alb * (uSunCol * nl * max(line, 0.3) * 0.9 + (amb * 1.15 + uBlkClay * 0.3 * max(-fn.z, 0.0) * (0.3 + 0.7 * line)) * ao);
    col += uSkyCol * 0.2 * wet * pow(1.0 - max(dot(V, fn), 0.0), 2.0);
  } else {
    vec3 alb = vC * mix(0.85 + 0.3 * m, 0.55 + 0.6 * m + 0.35 * m2 * m2, leaf);
    n = normalize(n + leaf * 0.5 * vec3(m - 0.5, m2 - 0.3, 0.5 - m2));
    float nl = max(dot(n, uSunDir), 0.0);
    col = alb * (uSunCol * nl * line + mwAmbient(n));
    col += leaf * alb * vec3(0.9, 1.0, 0.35) * uSunCol * 0.22 * max(dot(-n, uSunDir), 0.0) * line;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
// pale foam round each fallen block and trailing downstream of it (downstream is -X): a broken collar, a wake of drawn-out
// streaks and two wavering shear lines. One quad per block; vQ = (metres downstream of the block, metres across, hash, block radius)
const FOAM_VERT = /* glsl */`
attribute vec4 aQ;
varying vec4 vQ; varying vec3 vP;
#include <common>
#include <fog_pars_vertex>
void main(){
  vQ = aQ; vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FOAM_FRAG = /* glsl */`
varying vec4 vQ; varying vec3 vP;
uniform float uTime; uniform vec3 uFoam;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
void main(){
  float x = vQ.x, y = vQ.y, h = vQ.z, R = vQ.w, t = uTime;
  float rd = length(vec2(x, y)), n1 = mwNoise(vec2(x * 0.55 - t * 0.8 + h * 30.0, y * 1.5 + h * 7.0)), n2 = mwNoise(vec2(x * 1.9 - t * 1.5, y * 4.5 + h * 3.0));
  float n3 = mwNoise(vec2(x, y) * 1.7 + vec2(t * 0.35, -t * 0.2) + h * 20.0);
  float collar = smoothstep(0.95, 0.1, abs(rd - R * 1.42 - 0.2)) * smoothstep(0.1, 0.4, n3);       // the ring of foam stands clear of the block's own waterline
  float w = R * (0.75 + 0.1 * max(x, 0.0)), down = smoothstep(-0.3 * R, 0.8 * R, x) * (1.0 - smoothstep(0.45 * (3.5 + 2.5 * R), 3.5 + 2.5 * R, x));
  float wake = exp(-(y * y) / max(w * w, 0.01) * 1.6) * smoothstep(0.34, 0.7, n1) * (0.45 + 0.55 * n2);
  float sh = abs(abs(y) - w * 0.95 + 0.35 * sin(x * 0.8 - t * 1.4 + h * 6.0));
  float shear = smoothstep(0.26, 0.0, sh) * smoothstep(0.25, 0.6, n1 + 0.15);
  float a = clamp(1.3 * collar + down * (0.95 * wake + 0.8 * shear), 0.0, 0.9);
  a *= smoothstep(R * 0.92, R * 1.05, rd) * (1.0 - smoothstep(0.75 * (1.6 * R + 0.8), 1.6 * R + 0.8, abs(y)));
  if (a < 0.01) discard;
  vec3 fa = mix(uGndCol, uSkyCol, 0.8);
  vec3 col = uFoam * (uSunCol * 0.5 * mwSunLine(vP) + mix(fa, vec3(dot(fa, vec3(0.3, 0.55, 0.15))), 0.5) * 1.5);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

function tubeInto(mini, pts, radii, sides, col, sway = 0) {
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3();
  let prev = null;
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    T.subVectors(b, a).normalize(); ref.set(0, 0, 1); if (Math.abs(T.z) > 0.9) ref.set(1, 0, 0);
    N.crossVectors(T, ref).normalize(); B.crossVectors(T, N);
    const cur = [], r = radii[k];
    for (let s = 0; s < sides; s++) { const t = (s / sides) * Math.PI * 2, c = Math.cos(t) * r, d = Math.sin(t) * r; cur.push(mini.v(pts[k].x + N.x * c + B.x * d, pts[k].y + N.y * c + B.y * d, pts[k].z + N.z * c + B.z * d, sway, 0, 0, 0, col)); }
    if (prev) for (let s = 0; s < sides; s++) { const s1 = (s + 1) % sides; mini.quad(prev[s], prev[s1], cur[s1], cur[s]); }
    prev = cur;
  }
}

async function buildDecor(rng, noise, face, cliff, pal, U, ctx, waterY = 0) {
  const dst = { p: [], c: [], s: [], x: [], i: [] }, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const green = new THREE.Color(pal[4]), clay = new THREE.Color(pal[0]), bark = new THREE.Color(pal[5]), cream = new THREE.Color(pal[6]);
  const C = (base, l, hue = 0) => { const c = base.clone(); c.offsetHSL(hue, 0, 0); return c.multiplyScalar(l); };
  // leafy clumps along the lip and a taller rank behind it
  const clump = (x, y, z, w, h, d) => {
    const mini = new Mini(), hue = rng.range(-0.045, 0.05), l = rng.range(0.5, 1.05), tw = rng.range(0, 6);
    const ring = (yy, r, lum) => ({ z: yy, rx: r * rng.range(0.85, 1.15), ry: r * rng.range(0.85, 1.15), x: rng.range(-0.12, 0.12), y: rng.range(-0.12, 0.12), twist: tw + rng.range(-0.2, 0.2), a: [yy, 0, 0, 0], col: C(green, l * lum, hue) });
    mini.loft([ring(-0.2, 0.75, 0.45), ring(0.35, 1.05, 0.75), ring(0.8, 0.78, 1.1), { z: 1.0, rx: 0, x: rng.range(-0.3, 0.3), y: rng.range(-0.3, 0.3), a: [1, 0, 0, 0], col: C(green, l * 1.35, hue + 0.02) }], 8);
    // the loft axis is +Z: stand it up (z -> y)
    m.compose(V3(x, y, z), q.setFromEuler(e.set(-Math.PI / 2, 0, rng.range(0, 6.28), 'YXZ')), V3(w, d, h));
    pushTransformed(dst, mini, m, 0.9);
  };
  const rim = [];
  for (let x = -HALF + 1, k = 0; x < HALF - 1; x += rng.range(1.1, 1.8), k++) {
    if ((k & 7) === 0) await ctx.yield();
    const H = cliff.topAt(x), zt = cliff.zAt(x, H * 0.999);
    rim.push(V3(x, H, zt));
    if (rng.chance(0.86)) { const s = rng.range(0.9, 2.0); clump(x, H + 0.1, zt - rng.range(0.4, 2.4), s * rng.range(1.2, 1.9), s * rng.range(0.6, 1.2), s * rng.range(1.0, 1.5)); }
    if (rng.chance(0.5)) { const s = rng.range(2.5, 5.0); clump(x + rng.range(-1, 1), H + 0.4, zt - rng.range(4, 13), s * rng.range(1.0, 1.4), s * rng.range(0.8, 1.5), s); }
  }
  await ctx.yield();
  // hanging drapes of vine over the lip
  for (let k = 0; k < 46; k++) {
    const x = rng.range(-HALF + 12, HALF - 12), H = cliff.topAt(x), len = rng.range(2, 7.5), w = rng.range(0.18, 0.6), mini = new Mini(), col = C(green, rng.range(0.5, 1.0), rng.range(-0.03, 0.03));
    let pa = null, pb = null;
    for (let s = 0; s <= 3; s++) {
      const y = H + 0.4 - (s / 3) * len, zz = Math.max(cliff.zAt(x, Math.min(y, H * 0.999)), -900 + 0) + 0.3 + 0.25 * s, ww = w * (1 - 0.2 * s);
      const a = mini.v(x - ww, y, zz + 0.1, s / 3, 0, 0, 0, col), b = mini.v(x + ww, y - rng.range(0, 0.5), zz, s / 3, 0, 0, 0, col);
      if (pa !== null) mini.quad(pa, pb, b, a); pa = a; pb = b;
    }
    pushTransformed(dst, mini, m.identity(), 0.8);
  }
  await ctx.yield();
  // dead snags leaning out over the face: perches for the queueing pairs
  const perches = [], snagTips = [], nSnag = rng.int(7, 10);
  for (let k = 0; k < nSnag; k++) {
    const x = lerp(-118, 118, (k + rng.range(0.15, 0.85)) / nSnag), H = cliff.topAt(x), zt = cliff.zAt(x, H * 0.999), mini = new Mini();
    const hgt = rng.range(7, 12), lean = rng.range(0.15, 0.45), bend = rng.range(-0.25, 0.25), col = C(bark.clone().lerp(cream, 0.35), rng.range(0.7, 1.0));
    const pts = [], rad = [];
    for (let s = 0; s <= 5; s++) { const t = s / 5; pts.push(V3(x + bend * hgt * t * t, H - 1 + hgt * t, zt - 1.2 + lean * hgt * t * (0.4 + 0.6 * t))); rad.push(0.34 * (1 - 0.8 * t) + 0.03); }
    tubeInto(mini, pts, rad, 6, col);
    snagTips.push(pts[5].clone());
    const nb = rng.int(3, 5);
    for (let b = 0; b < nb; b++) {
      const t0 = rng.range(0.42, 0.92), o = pts[Math.round(t0 * 5)], ang = rng.range(-1.1, 1.1) + (b % 2 ? 0 : Math.PI * 0.0), bl = rng.range(2.2, 4.6), up = rng.range(0.15, 0.6);
      const dir = V3(Math.sin(ang), 0, Math.cos(ang)), bp = [], br = [];
      for (let s = 0; s <= 3; s++) { const t = s / 3; bp.push(V3(o.x + dir.x * bl * t, o.y + up * bl * t * (0.5 + 0.5 * t), o.z + dir.z * bl * t)); br.push(0.13 * (1 - 0.75 * t) + 0.02); }
      tubeInto(mini, bp, br, 5, col);
      for (let s = 0; s < 2; s++) { const t = rng.range(0.3, 0.95), p = bp[0].clone().lerp(bp[3], t); p.y = o.y + up * bl * t * (0.5 + 0.5 * t) + 0.1; perches.push({ p, n: V3(-dir.z * (s ? 1 : -1), 0, dir.x * (s ? 1 : -1)).lerp(V3(0, 0, 1), 0.5).normalize(), t: V3(dir.x, 0, dir.z) }); }
    }
    pushTransformed(dst, mini, m.identity(), 0);
  }
  await ctx.yield();
  // talus: a jumble of slumped clay blocks at the foot, 1-3 m of each standing out of the water: angular, flat-faced, leaning
  // on the toe, a smaller one or two fallen further out. (The old loop's random draws are kept so every later draw is unchanged.)
  const foot = [], blocks = [], blockTops = [];
  for (let x = -HALF + 6; x < HALF - 6; x += rng.range(2.5, 7)) { foot.push(V3(x, 0, cliff.zAt(x, 0.01) + 2.5)); for (let k = 0; k < 34; k++) rng(); }
  const tr = ctx.core && ctx.core.makeRng ? ctx.core.makeRng('macaw-talus:' + ctx.seed) : rng;
  // one block: a four-cornered prism broken off the face, its beds square to its own axis; a little narrower at its top, the top
  // itself a tilted break. Half its width is about 0.9 * sx; a third of it stands under water
  const tq = ctx.core && ctx.core.makeRng ? ctx.core.makeRng('macaw-talus2:' + ctx.seed) : rng;
  const block = (x, z, h, lean, roll) => {
    // five or six uneven corners, a waist, a top a good deal narrower and broken on a slant: a lump of bank, not a crate
    const mini = new Mini(), tw = tr.range(0, 6.28), taper = tr.range(0.7, 0.95) * tq.range(0.55, 0.92), ox = tr.range(-0.16, 0.16), oy = tr.range(-0.16, 0.16), rings = [];
    const nk = tq() < 0.4 ? 6 : 5, tiltA = tq.range(0, 6.28), tilt = tq.range(0.06, 0.24), lob = []; for (let k = 0; k < nk; k++) lob.push(tq.range(0.74, 1.16));
    for (const [zz, r] of [[0, 1], [0.52, tr.range(0.95, 1.07)], [1, taper]]) {
      const ring = [];
      for (let k = 0; k < nk; k++) {
        const src = k < 4 ? tr : tq, t = tw + k * 6.2832 / nk + src.range(-0.22, 0.22), rr = r * 1.3 * src.range(0.84, 1.14) * lob[k];
        ring.push(mini.v(ox * zz + Math.cos(t) * rr, oy * zz + Math.sin(t) * rr, zz > 0.9 ? zz + src.range(-0.13, 0.05) + tilt * Math.cos(t - tiltA) : zz, zz));
      }
      rings.push(ring);
    }
    for (let j = 0; j < 2; j++) for (let k = 0; k < nk; k++) { const k1 = (k + 1) % nk; mini.quad(rings[j][k], rings[j][k1], rings[j + 1][k1], rings[j + 1][k]); }
    for (let k = 1; k < nk - 1; k++) mini.tri(rings[2][0], rings[2][k], rings[2][k + 1]);
    const sx = h * tr.range(0.3, 0.52), sy = h * tr.range(0.26, 0.44), sink = tr.range(0.26, 0.4), yaw = tr.range(0, 6.28);
    m.compose(V3(x, waterY - sink * h, z), q.setFromEuler(e.set(-Math.PI / 2 + lean, roll, yaw)), V3(sx, sy, h));
    pushTransformed(dst, mini, m, 0, [2, h, tr()]);
    const R = 0.5 * (sx + sy) * 1.0;
    blocks.push({ x: x + 0.3 * h * Math.sin(roll), z: z + 0.3 * h * Math.sin(lean), r: R, h });
    if (h > 1.7 && Math.abs(lean) < 0.4 && Math.abs(roll) < 0.4) blockTops.push({ p: V3(ox, oy, 0.99).applyMatrix4(m), r: Math.min(sx, sy) * taper * 0.9, x });
  };
  // in heaps: a big one fallen against the toe, one to three smaller ones tumbled off it toward the river, at every angle
  for (let x = -HALF + 5, k = 0; x < HALF - 5; k++) {
    if ((k & 7) === 0) await ctx.yield();
    const near = x > -70 && x < 134, z0 = cliff.zAt(x, Math.max(waterY, 0) + 0.01);
    block(x, z0 + tr.range(0.3, 1.2), tr.range(2.1, near ? 4.3 : 3.0), tr.range(-0.5, 0.1), tr.range(-0.35, 0.35));
    const more = near ? tr.int(1, 3) : tr.int(0, 1);
    for (let j = 0; j < more; j++) block(x + tr.range(-2.4, 2.4), z0 + tr.range(1.9, 3.3) + 1.8 * j, tr.range(1.2, 2.8) * (1 - 0.2 * j), tr.range(-0.65, 0.65), tr.range(-0.65, 0.65));
    x += near ? tr.range(2.6, 5.2) : tr.range(4, 8.5);
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(dst.p, 3)); await ctx.yield();
  geo.setAttribute('aCol', new THREE.Float32BufferAttribute(dst.c, 3)); await ctx.yield();
  geo.setAttribute('aSway', new THREE.Float32BufferAttribute(dst.s, 1));
  geo.setAttribute('aAux', new THREE.Float32BufferAttribute(dst.x, 3)); await ctx.yield();
  geo.setIndex(dst.i); geo.computeVertexNormals();
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: DECOR_VERT, fragmentShader: DECOR_FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  // the foam: one quad lying on the water per block
  const fp = [], fq = [], fi = [];
  for (const b of blocks) {
    const L = 3.5 + 2.5 * b.r, W = 1.6 * b.r + 0.8, up = 1.6 * b.r + 1.1, k = fp.length / 3, hs = tr();
    for (const [dx, dz] of [[up, -W], [up, W], [-L, W], [-L, -W]]) { fp.push(b.x + dx, waterY + 0.035, b.z + dz); fq.push(-dx, dz, hs, b.r); }
    fi.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('aQ', new THREE.Float32BufferAttribute(fq, 4)); fgeo.setIndex(fi);
  return { mesh, perches, snagTips, rim, foot, blocks, blockTops, foamGeo: fgeo, tris: dst.i.length / 3 + fi.length / 3 };
}

// ---------- birds: geometry in the bird frame (nose +Z, back +Y, wings along X) ----------
// aPart = (part id, side, s, c): 0 body, 1 head, 2 bill, 3 wing (s = metres from the shoulder, c = chord 0..1), 4 tail (s = 0..1)
const MACAW = {
  sides: 6, rows: [0, 0.45, 1], camber: 0.018,
  rings: [[-0.20, -0.005, 0, 0, 0], [-0.13, 0, 0.046, 0.04, 0], [-0.02, 0, 0.076, 0.07, 0], [0.10, 0.006, 0.08, 0.078, 0], [0.19, 0.024, 0.056, 0.056, 0], [0.235, 0.034, 0, 0, 0]],
  // the head is its own rounder form (7 sides) over the end of the neck; the bill a deep hooked upper mandible
  head: { sides: 7, rings: [[0.186, 0.03, 0, 0], [0.208, 0.034, 0.05, 0.05], [0.252, 0.043, 0.066, 0.068], [0.296, 0.039, 0.05, 0.056], [0.32, 0.03, 0, 0]] },
  beak: [[0.292, 0.03, 0.04, 0.05], [0.342, 0.024, 0.035, 0.045], [0.384, -0.012, 0.019, 0.027], [0.372, -0.07, 0, 0]], beakSides: 5,
  shoulder: [0.07, 0.035, 0.105], span: [0, 0.14, 0.28, 0.42, 0.54, 0.64], lead: [0.04, 0.068, 0.06, 0.0, -0.09, -0.2], chord: [0.25, 0.33, 0.34, 0.3, 0.23, 0.11],
  tailZ: -0.15, tail: [[-0.01, -0.014, 0.54, 0.028], [0.01, 0.014, 0.54, 0.028], [-0.028, -0.045, 0.33, 0.032], [0.028, 0.045, 0.33, 0.032]],
  elbow: 0.25, chordM: 0.2, neck: [0.02, 0.19], flap: 3.7,
};
const PARROT = {
  sides: 4, rows: [0, 0.5, 1], camber: 0.008,
  rings: [[-0.10, 0, 0, 0, 0], [-0.05, 0, 0.03, 0.027, 0], [0.035, 0.003, 0.043, 0.04, 0], [0.095, 0.018, 0.033, 0.035, 1], [0.13, 0.01, 0, 0, 1]],
  beak: null,
  shoulder: [0.036, 0.016, 0.05], span: [0, 0.11, 0.22], lead: [0.02, 0.03, -0.06], chord: [0.1, 0.11, 0.02],
  tailZ: -0.07, tail: [[0, 0, 0.13, 0.04]],
  elbow: 0.09, chordM: 0.1, neck: [0.01, 0.07], flap: 6.2,
};
const HARPY = {
  sides: 6, rows: [0, 0.5, 1], camber: 0.04,
  rings: [[-0.42, 0, 0, 0, 0], [-0.28, 0, 0.09, 0.08, 0], [-0.05, 0, 0.16, 0.15, 0], [0.18, 0.01, 0.15, 0.14, 0], [0.3, 0.03, 0.09, 0.09, 0], [0.38, 0.05, 0.085, 0.09, 1], [0.44, 0.04, 0.05, 0.06, 1], [0.47, 0.02, 0, 0, 1]],
  beak: [[0.45, 0.035, 0.03, 0.035], [0.5, 0.01, 0.018, 0.022], [0.51, -0.04, 0, 0]],
  shoulder: [0.13, 0.06, 0.16], span: [0, 0.25, 0.5, 0.74, 0.9, 1.0], lead: [0.06, 0.1, 0.1, 0.05, -0.04, -0.2], chord: [0.42, 0.48, 0.48, 0.44, 0.36, 0.12],
  tailZ: -0.3, tail: [[-0.03, -0.07, 0.42, 0.08], [0.03, 0.07, 0.42, 0.08], [-0.09, -0.2, 0.38, 0.07], [0.09, 0.2, 0.38, 0.07]],
  elbow: 0.42, chordM: 0.45, neck: [0.03, 0.3], flap: 1.5,
};
function birdGeometry(P) {
  const g = new Mini(), nR = P.rows.length, nS = P.span.length, [shx, shy, shz] = P.shoulder;
  // a loft whose vertices carry where they sit round the ring: aPart = (part, across -1..1, z, up -1..1), for the markings
  const loftP = (rings, sides, part) => {
    let prev = null;
    for (const r of rings) {
      let cur;
      if (!(r[2] > 0)) cur = [g.v(0, r[1], r[0], r[4] ?? part, 0, r[0], 0)];
      else { cur = []; for (let k = 0; k < sides; k++) { const t = (k / sides) * Math.PI * 2 + (sides % 2 ? Math.PI / 2 : 0); cur.push(g.v(Math.cos(t) * r[2], r[1] + Math.sin(t) * r[3], r[0], r[4] ?? part, Math.cos(t), r[0], Math.sin(t))); } }
      if (prev) for (let k = 0; k < sides; k++) {
        const k1 = (k + 1) % sides;
        if (prev.length === 1 && cur.length > 1) g.tri(prev[0], cur[k1], cur[k]);
        else if (cur.length === 1 && prev.length > 1) g.tri(prev[k], prev[k1], cur[0]);
        else if (cur.length > 1) g.quad(prev[k], prev[k1], cur[k1], cur[k]);
      }
      prev = cur;
    }
  };
  loftP(P.rings, P.sides, 0);
  if (P.head) loftP(P.head.rings, P.head.sides, 1);
  if (P.beak) loftP(P.beak, P.beakSides || 4, 2);
  for (const side of [1, -1]) {
    const id = [];
    for (let j = 0; j < nS; j++) for (let r = 0; r < nR; r++) {
      const s = P.span[j], c = P.rows[r];
      id.push(g.v(side * (shx + s), shy + P.camber * Math.sin(Math.PI * c) * (1 - s / P.span[nS - 1]), shz + P.lead[j] - P.chord[j] * c, 3, side, s, c));
    }
    for (let j = 0; j < nS - 1; j++) for (let r = 0; r < nR - 1; r++) {
      const a = id[j * nR + r], b = id[(j + 1) * nR + r], c = id[(j + 1) * nR + r + 1], d = id[j * nR + r + 1];
      if (side > 0) g.quad(a, b, c, d); else g.quad(a, d, c, b);
    }
  }
  for (const [x0, x1, len, w] of P.tail) {
    let pa = null, pb = null; const sg = x1 === 0 ? 0 : Math.sign(x1);
    for (let k = 0; k <= 2; k++) {
      const t = k / 2, x = x0 + (x1 - x0) * t, hw = w * (1 - 0.86 * t * t), z = P.tailZ - len * t;
      const a = g.v(x - hw, 0.004 - 0.01 * t, z, 4, sg, t, 0), b = g.v(x + hw, 0.004 - 0.01 * t, z, 4, sg, t, 1);
      if (pa !== null) g.quad(pa, pb, b, a); pa = a; pb = b;
    }
  }
  return g.build();
}

const BIRD_VERT = /* glsl */`
attribute vec4 aPart;
#ifndef HARPY
attribute vec4 iA, iN, iV, iW, iC, iS, iP; attribute vec3 iQ;
#endif
uniform vec3 uSh, uCamL; uniform vec2 uNeck;
uniform float uElbow, uChordM, uFlapHz;
uniform vec3 uHarpy, uHarpyW, uHarpyF; uniform float uHarpyPh, uHarpyOn;
uniform vec4 uSolo;                                                        // a bird flown from outside (HARPY): species, size, beat amplitude, bank
varying vec3 vN, vBN, vPL, vInfo; varying vec4 vPart;
#include <common>
#include <fog_pars_vertex>
${GLSL_NOISE}
${GLSL_FLIGHT}
vec3 mwFly(float te){
#ifndef HARPY
  te = mix(te, -30.0, uBack * step(iS.w, -0.5));                          // the wall fills again: the clock runs back for every bird that is not of the skein
  float tau = max(te - iA.w, 0.0), seed = iV.w; vec3 h = mwHash3(seed + 3.7);
  vec3 L = iA.xyz + iN.xyz * (0.9 * (1.0 - exp(-tau * 3.0))) + iV.xyz * mwGo(tau) + vec3(0., mwDip(tau) - iS.z * (1.0 - exp(-tau * 1.1)), 0.);
  float wob = sin(te * 0.31 + h.x * 40.0);
  vec3 Wp = mwWheel(iW.x + uTrk.w * iW.w * te, iW.y + 1.2 * sin(te * 0.43 + h.z * 30.0), iW.z + 0.9 * wob + 0.6 * sin(te * 0.37 + h.x * 20.0));
  vec3 p = mix(L, Wp, smoothstep(iS.y, iS.y + 5.9, tau));
  if (iA.w < -6.0) {
    // a bird of the early flight (released long before the flush): past the lens it joins a ring that circles over the river in
    // front of the wall, low in the east and high in the west, and goes up into the wheel with everyone else when the wall bursts
    float ha = uHoldP.x + (h.x - 0.5) * uHoldP.y + uHold.w * (0.85 + 0.3 * h.y) * te, hr = 0.72 + 0.5 * h.z;     // (a crescent of the ring, uHoldP.y rad long, about uHoldP.x at the flush)
    vec3 Hp = uHold.xyz + vec3(uHoldR.x * hr * sin(ha), uHoldR.z * (h.y - 0.5) - uHoldR.w * sin(ha) - uHoldP.z * cos(ha) + 1.2 * sin(te * 0.5 + h.z * 20.0), uHoldR.y * hr * cos(ha));
    p = mix(mix(L, Hp, smoothstep(iS.y, iS.y + 4.5, tau)), Wp, smoothstep(-0.5, 6.0, te - 1.5 * h.z));
  }
  p.y = mix(p.y, max(p.y, uTrk.x + 0.5 * h.y), smoothstep(0.6, 1.6, tau));                 // never under the water
  if (iS.w >= 0.0) {
    // a bird of the skein: it leaves the wheel for the skein's line and flies it a little ahead of the lens, in its own place (hp
    // is shared by the two mates), until its turn comes to settle on its perch in the kapok
    vec3 hp = mwHash3((abs(iC.z) - 1.0) * 913.7 + 2.3);
    float lead = uSkL.x + iS.w * uSkL.y, f = (te + lead - uRt.x) / max(uRt.y, 1e-3);
    vec3 c = mwRoutePt(f), d = mwRoutePt(f + 0.3) - c;
    vec2 o = normalize(vec2(-d.z, d.x) + vec2(1e-5, 0.0));                                    // to the right of travel
    float lat = uSkQ.x + (hp.y - 0.5) * uSkQ.y + 0.55 * sign(iC.z) + 0.5 * sin(te * 0.6 + hp.x * 30.0) + 0.3 * wob;
    float up = uSkQ.z + (hp.z - 0.5) * uSkQ.w - uSkL.z * lead + 0.3 * (h.z - 0.5) + 0.35 * sin(te * 0.9 + hp.x * 9.0);
    vec3 Rp = c + vec3(o.x * lat, up, o.y * lat);
    p = mix(p, Rp, smoothstep(uRt.z, uRt.z + uRt.w, te + 1.5 * (hp.x - 0.5)));
    float land = smoothstep(iP.w - 1.7, iP.w, te);
    p = mix(p, iP.xyz + vec3(0., 1.1 * sin(3.1416 * land) * (1.0 - land), 0.), land);
  }
  vec3 sv = p - uScare.xyz; float sl = length(sv);                        // the flock parts round a stooping eagle
  p += sv / max(sl, 0.2) * uScare.w * (1.0 - smoothstep(0.0, max(uScare.w * 2.6, 0.01), sl));
  return p;
#else
  return uHarpy;
#endif
}
void main(){
  vec3 p = position;
#ifndef HARPY
  float seed = iV.w; vec3 h = mwHash3(seed);
  float teB = mix(uTe, -30.0, uBack * step(iS.w, -0.5));
  float landed = smoothstep(iP.w - 0.55, iP.w + 0.1, uTe), there = step(iP.w - 3.0, uTe);     // settling on the second perch; flying to it
  float tau = teB - iA.w, air = smoothstep(0.0, 0.6, tau) * (1.0 - landed);
  float tt = uTime + h.x * 50.0;
  float flare = smoothstep(0.5, 0.86, sin(tt * (0.5 + 0.4 * h.y)) * sin(tt * 0.163 + h.z * 9.0));
  float per = 3.3 + 4.0 * h.z, hopT = fract(tt / per) * per, hk = clamp(hopT / 1.6, 0.0, 1.0);
  float hop = step(0.01, iC.w) * smoothstep(0.0, 0.1, hk) * (1.0 - smoothstep(0.9, 1.0, hk)) * (1.0 - air);
  float open = max(air, max(flare * 0.8, hop));
  float ph = h.x * 6.283 + 6.2832 * uFlapHz * (0.9 + 0.2 * h.y) * mix(tt * 1.25, tau, step(0.0, tau) * (1.0 - landed));
  float amp = mix(0.5, mix(1.0, 0.46 + 0.34 * h.y, smoothstep(0.5, 5.0, tau)), air);
  // once it is up and away a bird misses a few beats now and then and rides on set wings: no two neighbours hold one pose
  float glide = smoothstep(0.5, 0.9, sin(tau * (0.8 + 0.7 * h.z) + h.x * 40.0)) * smoothstep(3.5, 6.5, tau) * (1.0 - smoothstep(iP.w - 2.5, iP.w - 1.0, uTe));
  amp *= 1.0 - 0.82 * glide;
  amp = mix(amp, 1.0, smoothstep(iP.w - 1.6, iP.w - 0.5, uTe) * air);                          // braking: deep beats as it comes in to the limb
  float sk = step(0.0, iS.w) * smoothstep(uRt.z, uRt.z + uRt.w, uTe);                          // 1 on a bird of the skein once it is on its line
  float size = iC.y, tws = sign(iC.z);
#else
  float air = 1.0, open = 1.0, ph = uHarpyPh, amp = uSolo.z, size = uSolo.y, tt = uTime, glide = 0.0; vec3 h = vec3(0.3);
#endif
  float fold = 1.0 - open;
  float A = 0.1 + 0.1 * glide + amp * sin(ph), B = 0.55 * amp * sin(ph - 1.1) - 0.12;
  float id = aPart.x;
  if (id > 2.5 && id < 3.5) {
    float side = aPart.y, s = aPart.z, s1 = min(s, uElbow), s2 = max(s - uElbow, 0.0);
    float yrel = p.y - uSh.y;
    vec3 fl = vec3(side * (uSh.x + s1 * cos(A) + s2 * cos(A + B)), uSh.y + yrel + s1 * sin(A) + s2 * sin(A + B), p.z + 0.08 * s * cos(ph) * amp);
    float cm = aPart.w * uChordM;
    vec3 fo = vec3(side * (uSh.x * 0.96 + 0.012 + 0.03 * (1.0 - aPart.w)), uSh.y + 0.012 - cm * 0.5, uSh.z + 0.03 - s * 0.66 - cm * 0.15);
    p = mix(fl, fo, fold);
  } else if (id > 3.5) {
    float t = aPart.z;
    p.x *= 1.0 + 0.25 * air * t;
    p.y += t * (0.02 * sin(ph + t * 2.5) * air - 0.03 * fold);
  } else if (id > 0.5) {
    float peck = (1.0 - air) * 0.75 * smoothstep(0.1, 1.0, sin(tt * (1.1 + 0.9 * h.y) + h.z * 6.0)) * step(0.25, h.z);
    vec2 q = vec2(p.y - uNeck.x, p.z - uNeck.y); float cs = cos(peck), sn = sin(peck);
    p.y = uNeck.x + q.x * cs - q.y * sn; p.z = uNeck.y + q.x * sn + q.y * cs;
  }
  p.y += 0.014 * sin(ph + 3.14) * air;
  vec3 P0 = mwFly(uTe);
#ifndef HARPY
  vec3 n = normalize(mix(iN.xyz, iQ, there) + vec3(0., 0., 1e-4));
  vec3 upW = normalize(vec3(0., 1., 0.) - n * n.y + vec3(1e-3, 1e-3, 0.));
  vec3 tw = cross(upW, n);
  float roll = iN.w + (1.0 - air) * 0.22 * sin(tt * 0.23 + h.y * 20.0);
  vec3 Fp = upW * cos(roll) + tw * sin(roll);
  vec3 P1 = mwFly(uTe + 0.08), P2 = mwFly(uTe + 0.38);
  vec3 Ff = normalize(P1 - P0 + n * 1e-3), Fa = normalize(P2 - P1 + n * 1e-3);
  // (the skein flies banked a little toward us, who are behind it: we see the colours of its backs, not wings edge on)
  float bank = clamp((Ff.z * Fa.x - Ff.x * Fa.z) * 6.0 + 0.2 * sin(tt * 0.83 + h.z * 30.0) + sk * 0.34 * sin(tt * 0.5 + h.x * 9.0), -1.0, 1.0);
  vec3 Rf = normalize(cross(vec3(0., 1., 0.), Ff) + vec3(1e-4, 0., 1e-4));
  vec3 Uf = normalize(vec3(0., 1., 0.) + Rf * bank);
  vec3 F = normalize(mix(Fp, Ff, air) + n * 1e-3);
  vec3 Ub = normalize(mix(n, Uf, air) + tw * (tws * 0.9 * sin(air * 3.1416)));
  vec3 base = P0 + n * (0.09 * size) + hop * iC.w * (n * sin(3.1416 * hk) + tw * (0.7 * tws * sin(6.2832 * hk)) + vec3(0., 0.3 * sin(6.2832 * hk) + 0.2 * sin(3.1416 * hk), 0.));
  float dC = distance(base, uCamL), nf = smoothstep(mix(0.8, 1.6, air), mix(1.6, 4.5, air), dC) * step(0.001, iC.y);
  vInfo = vec3(iC.x, mix(mix(iS.x, 1.0, there), 1.0, air), air);
  float fat = 1.0 + clamp(dC - 12.0, 0.0, 280.0) / mix(50.0, 72.0, air);
#else
  vec3 F = normalize(uHarpyF + vec3(0., 0., 1e-4));
  vec3 Ub = normalize(vec3(0., 1., 0.) + uHarpyW * (uSolo.w + 0.12 * sin(ph * 0.11)));
  vec3 base = P0; float dC = distance(base, uCamL), nf = uHarpyOn * smoothstep(0.8, 1.6, dC);
  vInfo = vec3(uSolo.x, 1.0, 1.0);
  float fat = 1.0 + clamp(dC - 12.0, 0.0, 280.0) / 100.0;
#endif
  vec3 R = normalize(cross(Ub, F) + vec3(1e-5, 0., 0.));
  vec3 Uo = cross(F, R);
  vec3 lp = base + (R * p.x + Uo * p.y + F * p.z) * (size * nf * fat);
  vN = R * normal.x + Uo * normal.y + F * normal.z;
  vBN = normal; vPL = lp; vPart = aPart;
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BIRD_FRAG = /* glsl */`
varying vec3 vN, vBN, vPL, vInfo; varying vec4 vPart;
uniform vec3 uRed, uBlue, uYel, uGrn, uCream, uCamL;
uniform float uSpanLen;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
void main(){
  float sc = vInfo.x, id = vPart.x, s = vPart.z, c = vPart.w;
  bool top = gl_FrontFacing;
  vec3 bn = normalize(vBN + vec3(0., 1e-5, 0.));
  float sp = s / uSpanLen;
  float isWing = step(2.5, id) * step(id, 3.5), isTail = step(3.5, id), isHead = step(0.5, id) * step(id, 1.5), isBill = step(1.5, id) * step(id, 2.5);
  vec3 dark = vec3(0.025, 0.025, 0.03);
  vec3 sky = mix(uBlue, vec3(0.08, 0.42, 0.85), 0.45);
  vec3 alb;
  // ---- feathers, in wing coordinates (sp 0 at the shoulder .. 1 at the tip, c 0 at the leading .. 1 at the trailing edge) ----
  // nineteen flight feathers, each ending in its own rounded tip (a scalloped trailing edge, slotted into fingers at the hand),
  // with a dark shaft, each lying over its neighbour; three rows of coverts as overlapping scales. Every term fades out with
  // distance before it could alias, so it is there on the birds near the lens and gone on the far flock
  float fi = (sp + 0.2 * smoothstep(0.45, 1.0, sp) * (c - 0.55)) * 19.0, fwS = fwidth(sp), fwC = fwidth(c);
  float fK = (1.0 - smoothstep(0.3, 0.75, fwidth(fi))) * isWing, fKc = (1.0 - smoothstep(0.3, 0.75, fwS * 30.0)) * isWing;
  float ff = fract(fi), fc = abs(ff - 0.5) * 2.0;
  float cTip = 1.0 - mix(0.07, 0.4, smoothstep(0.5, 0.92, sp)) * fc * fc * fK;
  if (isWing > 0.5 && c > cTip) discard;
  float cov = 0.5 - 0.14 * sp, flight = smoothstep(cov - 0.015, cov + 0.015, c) * isWing;
  float shaft = 1.0 - smoothstep(0.04, 0.15, fc), tipD = smoothstep(cTip - 0.32, cTip - 0.03, c) * mix(0.5, 1.0, smoothstep(0.3, 0.7, sp));
  vec3 navy = vec3(0.012, 0.018, 0.06);
  float cr = clamp(c / max(cov, 0.05), 0.0, 0.999) * 3.0, row = floor(cr), fy = cr - row;
  float cu = sp * (30.0 - 4.0 * row) + 0.5 * row, fx = fract(cu) - 0.5;
  float rim = smoothstep(0.6, 1.0, length(vec2(fx * 2.0, fy)));
  float barb = mix(mix(1.0, 1.0 - 0.5 * rim + 0.12 * (1.0 - fy), fKc), mix(1.0, (0.74 + 0.4 * ff) * (1.0 - 0.45 * shaft), fK), flight);
  barb *= 1.0 - 0.45 * isWing * (1.0 - smoothstep(0.1, 0.3, fwC)) * (1.0 - smoothstep(0.0, 0.04, abs(c - cov)));     // the shadow under the greater coverts
  // a tail streamer is one feather: its shaft and its two vanes
  float tK = (1.0 - smoothstep(0.12, 0.4, fwC)) * isTail;
  barb = mix(barb, 1.0 - tK * (0.35 * (1.0 - smoothstep(0.04, 0.13, abs(c - 0.5))) + 0.12 * step(0.5, c)), isTail);
  // body plumage: a fine lie of feathers
  float bK = (1.0 - smoothstep(0.004, 0.012, fwidth(s))) * (1.0 - isWing) * (1.0 - isTail) * (1.0 - isBill);
  float plume = 1.0 - bK * 0.3 * (mwNoise(vec2((vPart.y + vPart.w) * 6.0, s * 90.0)) - 0.4);
  float sd = abs(vPart.y), upH = vPart.w;                                 // on head and bill: how far round to the side, how far up
  float face = smoothstep(0.3, 0.55, sd) * smoothstep(-0.8, -0.35, upH) * (1.0 - smoothstep(0.35, 0.75, upH)) * smoothstep(0.236, 0.256, s);
  float eyeD = length(vec2((s - 0.27) / 0.016, (upH - 0.22) / 0.26)), eye = (1.0 - smoothstep(0.85, 1.05, eyeD)) * step(0.3, sd);
  float lines = step(0.45, fract(upH * 5.0 + s * 30.0));
  if (sc < 1.5) {                                                          // scarlet (0) and red-and-green (1)
    vec3 red = sc < 0.5 ? uRed : uRed * vec3(0.78, 0.5, 0.7);
    vec3 bandC = sc < 0.5 ? uYel : uGrn * vec3(0.9, 1.55, 0.9);
    alb = red * plume;
    alb = mix(alb, sky, (1.0 - isWing) * (1.0 - isTail) * smoothstep(-0.07, -0.13, s));         // pale blue rump
    if (isWing > 0.5) {
      // lesser coverts red, the band across the median and greater rows grading through green into the blue of the flight
      // feathers, which go dusky toward their tips
      float e1 = cov * 0.36, grade = smoothstep(cov - 0.17, cov + 0.05, c);
      vec3 w = mix(red, bandC, smoothstep(e1 - 0.02, e1 + 0.03, c));
      w = mix(w, mix(bandC, uBlue, 0.55) * vec3(0.8, 1.1, 0.9), smoothstep(0.0, 0.6, grade));
      w = mix(w, mix(uBlue * 1.15, navy, 0.85 * tipD), smoothstep(0.6, 1.0, grade));
      alb = top ? w * barb : mix(red * 0.88, vec3(0.74, 0.27, 0.06) * mix(1.0, 0.6, tipD), smoothstep(0.4, 0.95, c)) * barb;
    }
    if (isTail > 0.5) alb = mix(red, uBlue, max(smoothstep(0.62, 0.95, s), 0.75 * step(0.5, abs(vPart.y)) * step(s, 0.5) * (top ? 1.0 : 0.0))) * barb;
    if (isHead > 0.5) {                                                    // a bare pale face (lined with tiny red feathers on the red-and-green), a pale-ringed dark eye
      alb = mix(red * plume, mix(uCream, red, sc < 0.5 ? 0.0 : 0.45 * lines), face);
      alb = mix(alb, mix(dark, vec3(0.75, 0.7, 0.4), smoothstep(0.5, 0.8, eyeD)), eye);
    }
    if (isBill > 0.5) alb = mix(uCream * 0.95, dark, max(smoothstep(-0.1, -0.5, upH), smoothstep(0.36, 0.378, s) * step(upH, 0.3)));   // horn above, dark below and at the hook
  } else if (sc < 2.5) {                                                   // blue-and-yellow
    vec3 gold = uYel * vec3(1.0, 0.82, 0.6);
    alb = mix(gold, sky, smoothstep(-0.25, 0.2, bn.y)) * plume;
    if (isWing > 0.5) alb = (top ? mix(mix(sky * vec3(0.85, 1.12, 0.95), sky, smoothstep(0.08, 0.3, c)), mix(uBlue * vec3(0.7, 0.8, 1.05), navy, 0.85 * tipD), flight) : mix(gold, gold * mix(0.62, 0.4, tipD), smoothstep(cov - 0.05, cov + 0.25, c))) * barb;
    if (isTail > 0.5) alb = (top ? mix(sky, uBlue * 0.8, s) : gold * 0.85) * barb;
    if (isHead > 0.5) {
      alb = mix(gold, sky, smoothstep(-0.35, 0.15, upH)) * plume;
      alb = mix(alb, uGrn * vec3(0.9, 1.7, 0.9), smoothstep(0.262, 0.285, s) * smoothstep(0.3, 0.6, upH));       // green forehead
      alb = mix(alb, uCream * (0.7 + 0.3 * lines), face);                                                      // white face lined with black
      alb = mix(alb, dark, smoothstep(-0.55, -0.8, upH) * smoothstep(0.236, 0.262, s));                        // black throat
      alb = mix(alb, mix(dark, vec3(0.75, 0.75, 0.5), smoothstep(0.5, 0.8, eyeD)), eye);
    }
    if (isBill > 0.5) alb = dark * 1.6;
  } else if (sc < 4.5) {                                                   // mealy (3) and blue-headed (4) parrots
    vec3 grn = uGrn * vec3(1.0, 1.6, 0.9);
    alb = mix(grn * 0.8, grn * 1.25, smoothstep(-0.4, 0.5, bn.y));
    if (isWing > 0.5) alb = mix(grn, mix(uBlue, dark, 0.3), smoothstep(0.45, 0.8, c) * smoothstep(0.2, 0.6, sp)) * barb;
    if (isTail > 0.5) alb = mix(grn, uYel * 0.8, smoothstep(0.6, 1.0, s));
    if (isHead > 0.5) alb = sc > 3.5 ? uBlue * 1.15 : mix(grn * 1.2, uCream * 0.7, 0.25);
  } else {                                                                 // harpy: slate above, white below, barred
    vec3 slate = vec3(0.09, 0.1, 0.12), white = uCream * 0.95;
    float bars = smoothstep(0.35, 0.65, abs(fract(s * (isTail > 0.5 ? 2.5 : 5.0)) - 0.5) * 2.0);
    alb = mix(white, slate, smoothstep(-0.2, 0.3, bn.y));
    alb = mix(alb, slate * 0.6, smoothstep(0.16, 0.2, s) * smoothstep(0.34, 0.3, s) * (1.0 - isWing) * (1.0 - isTail) * (1.0 - isHead));   // chest band
    if (isWing > 0.5) alb = (top ? slate * (0.8 + 0.4 * bars) : mix(white, slate, 0.8 * bars * smoothstep(0.25, 0.6, c))) * barb;
    if (isTail > 0.5) alb = mix(top ? slate : white, slate * 0.5, bars * 0.85);
    if (isHead > 0.5) alb = vec3(0.4, 0.41, 0.43);
    if (isBill > 0.5) alb = dark;
  }
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); if (!top) n = -n;
  float d = dot(n, uSunDir), nl = max(d, 0.0) * 0.82 + 0.18 * (d * 0.5 + 0.5);
  float vis = vInfo.y * mwSunLine(vPL);
  float thin = max(isWing, isTail);
  vec3 col = alb * (uSunCol * nl * vis + mwAmbient(n) * 1.15);
  // light through the feathers: the vanes of the flight feathers glow, their shafts and overlaps stay dark
  col += thin * alb * uSunCol * max(-d, 0.0) * vis * (0.5 + 1.2 * flight * (1.0 - 0.6 * shaft * fK)) * vec3(1.12, 1.0, 0.8);
  vec3 V = normalize(uCamL - vPL + vec3(0., 1e-4, 0.));
  float gl = pow(max(dot(reflect(-uSunDir, n), V), 0.0), 18.0);
  col += uSunCol * vis * gl * (0.04 + 0.3 * isBill + 0.05 * isHead);      // a little gloss: the bill is polished horn
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// soft dark smudge each clinging bird throws on the clay (fades as it lets go)
const SHADOW_VERT = /* glsl */`
attribute vec4 iA, iN, iC; attribute vec2 iS;
uniform float uTe, uBack; uniform vec3 uSunDir;
varying vec2 vUv; varying float vA;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 n = iN.xyz;
  vec3 upW = normalize(vec3(0., 1., 0.) - n * n.y + vec3(1e-3, 1e-3, 0.)), tw = cross(upW, n);
  vec3 dl = -(uSunDir - n * dot(uSunDir, n));
  float size = iC.y, air = smoothstep(0.0, 0.5, mix(uTe, -30.0, uBack) - iA.w);
  vec3 dn = normalize(dl / max(length(dl), 0.3) - upW * 0.55), pw = normalize(cross(n, dn));   // always raking down-wall, away from the sun
  vec3 c = iA.xyz + n * 0.2 + dn * (0.86 * size);
  vec3 lp = c + (pw * position.y * 0.36 + dn * position.x * 1.05) * size;
  vUv = position.xy; vA = (1.0 - air) * iS.x * step(iC.w, 1.5);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADOW_FRAG = /* glsl */`
varying vec2 vUv; varying float vA;
uniform vec3 uShadeCol;
#include <common>
#include <fog_pars_fragment>
void main(){
  float a = smoothstep(1.0, 0.6, length(vUv * vec2(1.0, 1.0 + 0.5 * (vUv.x * 0.5 + 0.5)))) * (0.76 - 0.36 * (vUv.x * 0.5 + 0.5)) * vA;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uShadeCol, a);
  #include <fog_fragment>
}`;

// dust puffs keyed to each release, crumbs trickling down the face, a few feathers
const DUST_VERT = /* glsl */`
attribute vec4 dA, dN; attribute vec2 dS;
uniform float uTe, uTime; uniform vec3 uCamL;
varying vec2 vUv; varying vec3 vK; varying vec3 vPL;
#include <common>
#include <fog_pars_vertex>
${GLSL_NOISE}
void main(){
  float type = dN.w; vec3 h = mwHash3(dS.x);
  vec3 c = dA.xyz; float size = dS.y, alpha = 0.0, rot = h.z * 6.283; vec2 asp = vec2(1.0);
  if (type < 0.5) {
    float age = uTe - dA.w - 0.05 - 0.25 * h.x, k = clamp(age / 3.4, 0.0, 1.0), on = step(0.0, age);
    float o = 1.5 * (1.0 - exp(-max(age, 0.0) * 1.6));
    c += dN.xyz * (0.2 + o) + on * vec3(-0.5 * age * (0.4 + h.y), 0.3 * o - 0.3 * age * k, 0.15 * age);
    size *= 0.6 + 2.9 * sqrt(k); alpha = on * (1.0 - k) * (1.0 - k) * smoothstep(0.0, 0.04, k) * 0.95;
    rot += age * (h.y - 0.5);
  } else if (type < 1.5) {
    float per = 2.2 + 2.6 * h.x, f = fract(uTime / per + h.y), fall = f * f * (5.0 + 7.0 * h.z);
    c += dN.xyz * (0.1 + 0.6 * f) + vec3(0.25 * (h.z - 0.5) * f, -fall, 0.);
    alpha = smoothstep(0.0, 0.06, f) * (1.0 - smoothstep(0.7, 1.0, f)) * 0.9;
    size = max(size, distance(c, uCamL) * 0.0024);
  } else if (type > 2.5) {                                   // a trickle of clay dust from where a bird is feeding: a soft wisp that falls and thins
    float per = 3.0 + 3.0 * h.x, f = fract(uTime / per + h.y), gone = smoothstep(dA.w - 0.3, dA.w + 0.4, uTe);
    c += dN.xyz * (0.25 + 0.5 * f) + vec3(0.5 * (h.z - 0.5) * f, -f * (2.5 + 3.5 * h.z), 0.);
    alpha = smoothstep(0.0, 0.12, f) * (1.0 - f) * 0.5 * (1.0 - gone); asp = vec2(0.55 + 0.5 * f, 1.5); rot = 0.0;
    size *= 0.7 + 1.1 * f;
  } else {
    float age = uTe - dA.w - 0.4 - h.x, k = clamp(age / 9.0, 0.0, 1.0), on = step(0.0, age);
    c += dN.xyz * (1.0 + 3.0 * k) + on * vec3(1.2 * sin(age * 1.3 + h.y * 6.0), -1.0 * age + 0.3 * sin(age * 2.6 + h.z * 6.0), 0.8 * cos(age * 1.1 + h.y * 4.0));
    alpha = on * (1.0 - smoothstep(0.85, 1.0, k)); rot += age * 3.0; asp = vec2(1.0, 0.3 + 0.25 * sin(age * 4.0 + h.x * 6.0));
    size = max(size, distance(c, uCamL) * 0.003);
  }
  vec2 q = position.xy * asp; float cs = cos(rot), sn = sin(rot);
  q = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs) * size * step(0.002, alpha);
  vUv = position.xy; vK = vec3(type, alpha, h.x); vPL = c;
  vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
  mvPosition.xy += q;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DUST_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vK; varying vec3 vPL;
uniform vec3 uDust, uRed;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_LIGHT}
void main(){
  float r = length(vUv), a; vec3 alb;
  if (vK.x < 0.5) { a = smoothstep(1.0, 0.15, r) * (0.55 + 0.45 * mwNoise(vUv * 2.3 + vK.z * 31.0)); alb = uDust; }
  else if (vK.x < 1.5) { a = smoothstep(1.0, 0.5, r) * 0.85; alb = uDust * 0.6; }
  else if (vK.x > 2.5) { a = smoothstep(1.0, 0.1, r) * (0.5 + 0.5 * mwNoise(vUv * vec2(2.0, 1.2) + vK.z * 17.0)); alb = uDust * 1.05; }
  else { a = smoothstep(1.0, 0.8, r); alb = uRed * (0.7 + 0.3 * step(abs(vUv.y), 0.12)); }
  a *= vK.y; if (a < 0.004) discard;
  vec3 col = alb * (uSunCol * 0.55 * mwSunLine(vPL) + mix(uGndCol, uSkyCol, 0.6));
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

const HOURS = {
  dawn: { sunDir: [0.84, 0.24, 0.485], sunColor: '#FFD9A0', sunIntensity: 2.25, skyColor: '#86AEC6', groundColor: '#6E5A48', shadowLineY: 5, sitting: 1 },
  day: { sunDir: [0.62, 0.6, 0.5], sunColor: '#FFF2DE', sunIntensity: 3.0, skyColor: '#9CC0DC', groundColor: '#7A6650', shadowLineY: -20, sitting: 1 },
  golden: { sunDir: [-0.84, 0.21, 0.5], sunColor: '#FFB45E', sunIntensity: 2.7, skyColor: '#8E9CC0', groundColor: '#70523C', shadowLineY: 3, sitting: 0.62 },
};
const DEFAULT_EYE = [[-6.4, 116, 6, 22], [-4.4, 84.4, 9, 22], [-2, 46, 12.5, 22], [0, 14, 14, 22], [3.6, -50.8, 14, 22], [5, -74, 13.6, 27], [6.4, -95, 12.5, 40], [9, -128, 8, 72], [12, -160, 4.5, 112]];

export async function buildHero(ctx, opts = {}) {
  const t0 = 0;
  const rng = ctx.rng.fork ? ctx.rng.fork('macaw-wall') : ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice(0, 7);
  const hour = HOURS[opts.hour] || HOURS.dawn, rain = opts.weather === 'rain';
  const L = new THREE.Vector3().fromArray(opts.sunDir || hour.sunDir).normalize();
  const duration = opts.duration ?? 40, flushAt = opts.flushAt ?? 12.4;
  const cast = opts.cast || rng.pick(['mixed', 'mixed', 'mixed', 'red', 'blue', 'green']);
  const eyeLine = (opts.eyeLine || DEFAULT_EYE).map((e) => e.slice());
  // the wheel: a closed loop over the river (see mwWheel). opts.track = { loop: [[x,y,z], ...] closed control points, speed m/s,
  // refPoint [x,y,z] + teRef: the middle of the flock is nearest that point at flush time teRef, sigma: its spread in metres along
  // the loop, bulk: the share of macaws in that body (the rest and the small parrots are strung round the whole wheel) }
  const TK = { loop: null, speed: 14, refPoint: null, teRef: 9, sigma: 60, bulk: 0.55, ...(opts.track || {}) };
  const NL = 24, LOOP = [];
  {
    const wc = opts.wheelCenter || [-60, 25, 78], wr = opts.wheelRadius || [90, 55];
    const ctl = (TK.loop || Array.from({ length: 16 }, (_, k) => [wc[0] + Math.cos(-k / 16 * 6.2832) * wr[0], wc[1] + 2.5 * Math.sin(k / 16 * 12.566), wc[2] + Math.sin(-k / 16 * 6.2832) * wr[1]])).map((q) => new THREE.Vector3(q[0], q[1], q[2]));
    const cv = new THREE.CatmullRomCurve3(ctl, true, 'centripetal'); cv.arcLengthDivisions = 600;
    TK.length = cv.getLength();
    for (let k = 0; k < NL; k++) LOOP.push(cv.getPointAt(k / NL));
  }
  const TKP = TK.length;
  const loopPt = (f, out) => {
    const i = Math.floor(f), t = f - i, p0 = LOOP[(i + NL - 1) % NL], p1 = LOOP[i % NL], p2 = LOOP[(i + 1) % NL], p3 = LOOP[(i + 2) % NL], t2 = t * t, t3 = t2 * t;
    const w0 = 0.5 * (-t + 2 * t2 - t3), w1 = 0.5 * (2 - 5 * t2 + 3 * t3), w2 = 0.5 * (t + 4 * t2 - 3 * t3), w3 = 0.5 * (-t2 + t3);
    return out.set(p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3, p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3, p0.z * w0 + p1.z * w1 + p2.z * w2 + p3.z * w3);
  };
  const lq = new THREE.Vector3(), lq2 = new THREE.Vector3();
  TK.sRef = 0;
  if (TK.refPoint) { const rp = lq2.fromArray(TK.refPoint); let bd = 1e9; for (let k = 0; k < NL * 20; k++) { const d = loopPt(k / 20, lq).distanceToSquared(rp); if (d < bd) { bd = d; TK.sRef = k / 20 / NL * TKP; } } }
  const WC = new THREE.Vector3(), WR = [0, 0];
  { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of LOOP) { WC.add(q); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); } WC.divideScalar(NL); WR[0] = (x1 - x0) / 2; WR[1] = (z1 - z0) / 2; }
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmp3 = new THREE.Vector3();

  // ----- shared uniforms -----
  const LU = {
    uSunDir: { value: L.clone() }, uSunCol: { value: col(opts.sunColor || hour.sunColor, opts.sunIntensity ?? hour.sunIntensity) },
    uSkyCol: { value: col(opts.skyColor || hour.skyColor).lerp(col('#cfc8e6'), 0.25).multiplyScalar(1.0) }, uGndCol: { value: col(opts.groundColor || hour.groundColor, 0.26) },
    uShadowY: { value: opts.shadowLineY ?? hour.shadowLineY }, uWaterY: { value: opts.waterY ?? 0 },
  };
  // the skein: SK.pairs pairs of macaws that leave the wheel for a line of their own (SK.route: 48 points, point k being where
  // the line is at flush time SK.t0 + k * SK.dt; the world gives its own camera line), fly it a little ahead of the lens and settle
  // one pair after another on perches the world hands over later (hero.setPerches). SK.join = [te, seconds]: when they leave the
  // wheel. SK.shape(te) -> [lead of the tail in seconds, more lead at the head, metres lower per second of lead, lateral centre
  // (m to the right of travel), lateral width, height over the line, spread in height]
  const SK = { pairs: 0, route: null, t0: 0, dt: 1, join: [1e6, 1], shape: () => [1, 1, 0, 0, 8, 2, 4], ...(opts.skein || {}) };
  const ROUTE = []; for (let k = 0; k < 48; k++) { const q = SK.route ? SK.route[Math.min(k, SK.route.length - 1)] : [0, 0, 0]; ROUTE.push(new THREE.Vector3(q[0], q[1], q[2])); }
  const FU = {
    uTe: { value: -10 }, uTime: { value: 0 }, uBack: { value: 0 }, uScare: { value: new THREE.Vector4(0, -999, 0, 0) },
    uTrk: { value: new THREE.Vector4(opts.floorY ?? 1.7, 0, TKP, TK.speed) }, uLoop: { value: LOOP }, uRoute: { value: ROUTE },
    uRt: { value: new THREE.Vector4(SK.t0, SK.dt, SK.join[0], SK.join[1]) }, uSkL: { value: new THREE.Vector4(1, 1, 0, 0) }, uSkQ: { value: new THREE.Vector4(0, 8, 2, 4) },
    uCamL: { value: new THREE.Vector3(0, 1e4, 0) },
    uHold: { value: new THREE.Vector4(48, 29, 52, 0.35) }, uHoldR: { value: new THREE.Vector4(58, 27, 5, 5) }, uHoldP: { value: new THREE.Vector3(0, 6.2832, 0) },
  };
  if (opts.early && opts.early.hold) { const H = opts.early.hold; FU.uHold.value.set(H.center[0], H.center[1], H.center[2], H.omega ?? 0.35); FU.uHoldR.value.set(H.rx ?? 58, H.rz ?? 27, H.spread ?? 5, H.tilt ?? 5); FU.uHoldP.value.set(H.phase ?? 0, H.span ?? 6.2832, H.dip ?? 0); }
  const skShape = (te) => SK.shape(te);
  const routePt = (f, out) => {
    f = clamp(f, 0, 46.999); const i = Math.floor(f), t = f - i, p0 = ROUTE[Math.max(i - 1, 0)], p1 = ROUTE[i], p2 = ROUTE[Math.min(i + 1, 47)], p3 = ROUTE[Math.min(i + 2, 47)], t2 = t * t, t3 = t2 * t;
    const w0 = 0.5 * (-t + 2 * t2 - t3), w1 = 0.5 * (2 - 5 * t2 + 3 * t3), w2 = 0.5 * (t + 4 * t2 - 3 * t3), w3 = 0.5 * (-t2 + t3);
    return out.set(p0.x * w0 + p1.x * w1 + p2.x * w2 + p3.x * w3, p0.y * w0 + p1.y * w1 + p2.y * w2 + p3.y * w3, p0.z * w0 + p1.z * w1 + p2.z * w2 + p3.z * w3);
  };
  const HU = {
    uHarpy: { value: new THREE.Vector3(0, 500, 0) }, uHarpyW: { value: new THREE.Vector3(0, 0, 1) }, uHarpyF: { value: new THREE.Vector3(-1, 0, 0) },
    uHarpyFlap: { value: 1 }, uHarpyOn: { value: 0 }, uHarpyPh: { value: 0 }, uSolo: { value: new THREE.Vector4(5, 1, 0.42, 0) },
  };
  const clay = col(pal[0]); clay.offsetHSL(rng.range(-0.012, 0.012), 0, rng.range(-0.02, 0.02));
  const CU = {
    uRed: { value: col(pal[1]) }, uBlue: { value: col(pal[2]) }, uYel: { value: col(pal[3]) }, uGrn: { value: col(pal[4]) }, uCream: { value: col(pal[6], 0.82) },
  };
  const mk = (extra) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...LU, ...FU, ...HU, ...CU, ...extra });

  const root = new THREE.Group(); root.name = 'macaw-wall';

  // ----- cliff -----
  await ctx.yield();
  const face = makeFace(noise, rng);
  const bandY = HT * 0.72;
  const cliff = await buildCliff(face, L, mk({
    uClay: { value: clay.clone().lerp(col(pal[6]), 0.07) }, uOchre: { value: col(pal[5]).lerp(col(pal[3]), 0.14).multiplyScalar(1.0) }, uGrey: { value: col(pal[5]).lerp(col(pal[6]), 0.5).lerp(col('#8c8c94'), 0.35) },
    uSoil: { value: col(pal[4]).lerp(col(pal[5]), 0.5).multiplyScalar(0.5) }, uPale: { value: clay.clone().lerp(col(pal[6]), 0.5) },
    uWet: { value: rain ? 1 : 0 }, uBandY: { value: bandY }, uSeedF: { value: rng.range(0, 50) },
  }), ctx);
  root.add(cliff.mesh);
  await ctx.yield();
  const decor = await buildDecor(rng, noise, face, cliff, pal, mk({ uBlkClay: { value: clay.clone().lerp(col(pal[6]), 0.05) }, uBlkOchre: { value: col(pal[3]).lerp(col(pal[5]), 0.72).lerp(clay, 0.15) } }), ctx, opts.waterY ?? 0);
  root.add(decor.mesh);
  const foam = new THREE.Mesh(decor.foamGeo, new THREE.ShaderMaterial({ uniforms: mk({ uFoam: { value: col(pal[6], 0.95) } }), vertexShader: FOAM_VERT, fragmentShader: FOAM_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  foam.frustumCulled = false; foam.renderOrder = 2; root.add(foam);
  await ctx.yield();

  const visAt = (x, y, z) => {
    let pen = 0;
    for (let s = 1; s <= 30; s++) {
      const qx = x + L.x * s, qy = y + L.y * s, qz = z + L.z * s, zf = cliff.zAt(qx, qy);
      if (zf < -900) { if (qx < -HALF || qx > HALF || qy > cliff.topAt(qx)) break; continue; }
      pen = Math.max(pen, zf - qz - 0.02 * s);
    }
    return 1 - smoothstep(0, 0.8, pen);
  };
  const eyeAt = (te, out = new THREE.Vector3()) => {
    const E = eyeLine, n = E.length;
    let k = 0; while (k < n - 2 && te > E[k + 1][0]) k++;
    const a = E[k], b = E[k + 1], t = (te - a[0]) / Math.max(b[0] - a[0], 1e-3);
    return out.set(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t);
  };

  // ----- perches -----
  const sitting = hour.sitting, total = Math.round(clamp(opts.density ?? rng.range(720, 800), 400, 800) * sitting);
  let nSmall = Math.min(cast === 'green' ? Math.round(total * 0.62) : Math.round(total * 0.25), cast === 'green' ? 500 : 200);
  let nMacaw = Math.min(total - nSmall, 680); nMacaw -= nMacaw % 2;
  const taken = new Set(), key = (x, y) => Math.round(x / 0.5) + ':' + Math.round(y / 0.72);
  const mkPerch = (x, y) => { const z = cliff.zAt(x, y), n = cliff.normalAt(x, y, new THREE.Vector3()); n.y = clamp(n.y, -0.2, 0.45); n.z = Math.max(n.z, 0.35); n.normalize(); return { pos: new THREE.Vector3(x, y, z), n, wall: true, vis: visAt(x, y, z + 0.15) }; };
  const speciesOf = (x, y) => {
    const f = clamp(0.5 + 0.5 * noise.n2(x * 0.018 + 77, y * 0.06) + rng.range(-0.22, 0.22), 0, 0.999);
    const w = cast === 'red' ? [0.58, 0.94] : cast === 'blue' ? [0.12, 0.2] : cast === 'green' ? [0.5, 0.8] : [0.44, 0.67];
    return f < w[0] ? 0 : f < w[1] ? 1 : 2;
  };
  const macawP = [], snagN = Math.min(decor.perches.length - (decor.perches.length % 2), 44, nMacaw), wallN = nMacaw - snagN;
  for (let tries = 0; macawP.length < wallN && tries < wallN * 30; tries++) {
    if ((tries & 31) === 31) await ctx.yield();
    let x, y, grp = 0;
    const pk = rng();
    if (pk < 0.2) { grp = 2; x = face.xb + clamp(rng.gauss() * 3.3, -8, 8); y = cliff.topAt(x) * rng.range(0.15, 0.6); }
    else if (pk < 0.58) {                                            // rows of pairs along the ledges, from the lower bands up to the lip
      grp = 1; x = lerp(-28, 72, Math.pow(rng(), 0.75));
      y = cliff.topAt(x) * clamp(0.58 + 0.19 * rng.gauss(), 0.2, 0.93); y = Math.round(y / 1.55) * 1.55 + rng.range(-0.22, 0.22);
    } else {
      x = rng.range(-134, 134);
      const m = 0.5 + 0.5 * noise.n2(x * 0.025 + 40, 1.7);
      if (rng() > 0.22 + 0.78 * m * m) continue;
      const vc = (cast === 'green' ? 0.8 : 0.7) + 0.05 * noise.n2(x * 0.02, 8.8);
      y = cliff.topAt(x) * clamp(vc + (cast === 'green' ? 0.06 : 0.11) * rng.gauss(), 0.46, 0.93);
    }
    const gap = rng.range(0.52, 0.66), k1 = key(x, y), y2 = y + rng.range(-0.12, 0.12), k2 = key(x + gap, y2);
    if (k1 === k2 || taken.has(k1) || taken.has(k2) || Math.abs(x) > 138) continue;
    taken.add(k1); taken.add(k2);
    const sp = speciesOf(x, y), a = mkPerch(x, y), b = mkPerch(x + gap, y2);
    a.sp = b.sp = sp; a.grp = b.grp = grp; b.mate = a;
    macawP.push(a, b);
  }
  // the east shoulder (x 94..128): the first clay the approach closes on. opts.eastPairs more pairs sit there in rows along its
  // ledges; they have a generator of their own, so that no other bird moves, and never join the early flight
  {
    const sr = ctx.core.makeRng('macaw-east:' + ctx.seed), nE = Math.round((opts.eastPairs ?? 0) * sitting);
    const w = cast === 'red' ? [0.58, 0.94] : cast === 'blue' ? [0.12, 0.2] : cast === 'green' ? [0.5, 0.8] : [0.44, 0.67];
    for (let k = 0, tries = 0; k < nE && tries < nE * 30; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      const x = lerp(95, 129, Math.pow(sr(), 1.25)), H = cliff.topAt(x);
      let y = H * clamp(0.52 + 0.2 * sr.gauss(), 0.2, 0.9); y = Math.round(y / 1.55) * 1.55 + sr.range(-0.22, 0.22);
      const gap = sr.range(0.52, 0.66), k1 = key(x, y), y2 = y + sr.range(-0.12, 0.12), k2 = key(x + gap, y2);
      if (k1 === k2 || taken.has(k1) || taken.has(k2)) continue;
      taken.add(k1); taken.add(k2);
      const f = clamp(0.5 + 0.5 * noise.n2(x * 0.018 + 77, y * 0.06) + sr.range(-0.22, 0.22), 0, 0.999), sp = f < w[0] ? 0 : f < w[1] ? 1 : 2, a = mkPerch(x, y), b = mkPerch(x + gap, y2);
      a.sp = b.sp = sp; a.grp = b.grp = 3; b.mate = a;
      macawP.push(a, b); k++;
    }
  }
  const nWallMacaw = macawP.length;
  for (let k = 0; k < snagN; k++) {
    const s = decor.perches[k], mate = k % 2 ? macawP[macawP.length - 1] : null;
    macawP.push({ pos: s.p.clone(), n: s.n.clone(), wall: false, vis: 1, sp: mate ? mate.sp : speciesOf(s.p.x, 50), mate });
  }
  // a few pairs stand on the fallen blocks nearest the eye line, for scale
  {
    const tops = decor.blockTops.filter((b) => b.x > -30 && b.x < 96).sort((a, b) => b.r - a.r).slice(0, 14).filter((b, i) => i % 2 === 0);
    tops.forEach((b, bi) => {
      const sp = cast === 'blue' ? 2 : cast === 'red' ? bi % 2 : bi % 3, gap = Math.min(0.62, b.r * 0.9);
      for (let k = 0; k < 2; k++) {
        const pos = b.p.clone().add(tmp.set((k - 0.5) * gap, 0.2, 0.3 * b.r)), n = new THREE.Vector3((k - 0.5) * 0.5, 0, 1).normalize();
        macawP.push({ pos, n, wall: false, vis: visAt(pos.x, pos.y, pos.z + 0.3), sp, mate: k ? macawP[macawP.length - 1] : null, grp: 0 });
      }
    });
    // and on the blocks under the east shoulder, which the approach turns over
    if ((opts.eastPairs ?? 0) > 0) decor.blockTops.filter((b) => b.x >= 96 && b.x < 132).sort((a, b) => b.r - a.r).slice(0, 3).forEach((b, bi) => {
      const sp = cast === 'blue' ? 2 : cast === 'red' ? bi % 2 : (bi + 1) % 3, gap = Math.min(0.62, b.r * 0.9);
      for (let k = 0; k < 2; k++) {
        const pos = b.p.clone().add(tmp.set((k - 0.5) * gap, 0.2, 0.3 * b.r)), n = new THREE.Vector3((k - 0.5) * 0.5 + 0.5, 0, 1).normalize();
        macawP.push({ pos, n, wall: false, vis: visAt(pos.x, pos.y, pos.z + 0.3), sp, mate: k ? macawP[macawP.length - 1] : null, grp: 0 });
      }
    });
  }
  const nBlockBirds = macawP.length - nWallMacaw - snagN;
  await ctx.yield();
  const smallP = [];
  for (let tries = 0; smallP.length < nSmall && tries < nSmall * 30; tries++) {
    if ((tries & 31) === 31) await ctx.yield();
    const x = rng.range(-128, 128), m = 0.5 + 0.5 * noise.n2(x * 0.03 + 11, 5.1);
    if (rng() > 0.2 + 0.8 * m) continue;
    const y = cliff.topAt(x) * clamp(0.36 + 0.09 * rng.gauss(), 0.16, 0.52), k1 = key(x, y);
    if (taken.has(k1)) continue; taken.add(k1);
    const p = mkPerch(x, y); p.sp = noise.n2(x * 0.04 + 5, 2.2) + rng.range(-0.5, 0.5) > 0.1 ? 4 : 3; smallP.push(p);
  }
  await ctx.yield();

  // ----- per-bird flight plan -----
  // Every wall macaw is given a lane: a point in the moving eye frame (ahead and a little left of the eye line, at eye level
  // give or take) that it flies through at its own moment te = teP. Lanes come in three shells: about 70 birds 2.8-5 m from
  // the lens, about 120 at 5-10.5 m, the rest 10-36 m out, with the moments spread over te 0.8..7 so that every instant of
  // the burst has birds at every distance. A bird sheds most of its height in the first second (the drop), then drives level.
  const E = new THREE.Vector3(), E2 = new THREE.Vector3(), fw = new THREE.Vector3(), Vr = new THREE.Vector3(), Tg = new THREE.Vector3();
  const LANE_T0 = opts.laneFrom ?? 0.8, LANE_T1 = opts.laneTo ?? 7.0;
  const passPoint = (teP, cls, out) => {
    eyeAt(teP, E); eyeAt(teP + 0.3, E2); fw.subVectors(E2, E).setY(0); if (fw.lengthSq() < 1e-6) fw.set(-1, 0, 0); fw.normalize();
    let r, be, up;
    if (cls === 0) { r = rng.range(2.8, 5); be = rng.range(-0.12, 0.7); up = rng.range(-0.5, 1.0); }
    else if (cls === 1) { r = rng.range(5, 10.5); be = rng.range(-0.22, 0.8); up = rng.range(-1.1 - 0.14 * (r - 5), 0.15 * r); }
    else { r = rng.range(10.5, 36); be = rng.range(-0.4, 0.95); up = clamp(rng.range(-0.25, 0.22) * r, -7, 9); }
    const c = Math.cos(be) * r, s = Math.max(Math.sin(be) * r, -8);                      // s: metres to the LEFT of the eye line
    return out.set(E.x + fw.x * c + fw.z * s, E.y + up, E.z + fw.z * c - fw.x * s);
  };
  const KO = opts.keepOff || null, Kq = new THREE.Vector3(), Kc = new THREE.Vector3();
  const lensAt = (te, out) => { const E0 = KO.line, n0 = E0.length; let k = 0; while (k < n0 - 2 && te > E0[k + 1][0]) k++; const a = E0[k], b = E0[k + 1], t = clamp((te - a[0]) / Math.max(b[0] - a[0], 1e-3), -1, 2);
    return out.set(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t); };
  const solveLane = (A, n, rel, cls, k, teGiven, ptGiven) => {
    const tb = LANE_T0 + (LANE_T1 - LANE_T0) * ((k * 0.61803399 + 0.31) % 1);
    for (let j = 0; j < (KO ? 40 : 26); j++) {
      const teP = teGiven ?? (j === 0 ? tb : j < 6 ? clamp(tb + rng.range(-0.8, 0.8), LANE_T0, LANE_T1) : rng.range(LANE_T0, LANE_T1)), tc = teP - rel;
      if (tc < 1.3) { if (teGiven !== undefined) return null; continue; }
      if (ptGiven) Tg.copy(ptGiven); else passPoint(teP, cls, Tg);
      const e3 = 1 - Math.exp(-3 * tc), g = tc * tc / (tc + 0.5), dip = -1.3 * (tc / 0.45) * Math.exp(1 - tc / 0.45);
      const D = clamp((A.y - Tg.y) * 0.92, 0, 40), dr = 1 - Math.exp(-1.1 * tc);
      Vr.copy(Tg).sub(A).addScaledVector(n, -0.9 * e3); Vr.y -= dip - D * dr; Vr.divideScalar(g);
      const sp = Vr.length();
      if (sp > 8 && sp < 23 && Vr.z > 0.6) {
        // opts.keepOff = { line: [[te, x, y, z], ...] the lens itself, dist }: no bird's way from the wall to its lane may come nearer the lens than that
        let ok = true;
        if (KO) for (let q = 0.3; q < tc + 0.6 && ok; q += 0.2) {
          const gq = q * q / (q + 0.5), kq = q / 0.45;
          Kq.copy(A).addScaledVector(n, 0.9 * (1 - Math.exp(-3 * q))).addScaledVector(Vr, gq); Kq.y += -1.3 * kq * Math.exp(1 - kq) - D * (1 - Math.exp(-1.1 * q));
          if (Kq.distanceTo(lensAt(rel + q, Kc)) < KO.dist) ok = false;
        }
        if (ok) return { V: Vr.clone(), tc, D, teP, pt: Tg.clone() };
      }
      if (teGiven !== undefined) return null;
    }
    return null;
  };
  let lanes = 0, pairK = 0;
  const nPairs = Math.ceil((macawP.length - nBlockBirds) / 2), nA = Math.round(Math.min(24, nPairs * 0.11)), nB = Math.round(Math.min(56, nPairs * 0.26));
  const plan = (p, small) => {
    const A = p.pos, n = p.n, mate = p.mate;
    p.rel = mate ? mate.rel + rng.range(0.03, 0.2) : WAVE_T + Math.abs(A.x - WAVE_X) / WAVE_V + rng.range(0, 0.45) + (1 - Math.min(A.y / HT, 1)) * 0.25;
    p.b0 = mate ? mate.b0 : 1.6 + rng.range(0, 0.9); p.D = 0;
    p.V = mate ? mate.V.clone().add(tmp.set(rng.range(-0.5, 0.5), rng.range(0, 0.35), rng.range(-0.5, 0.5)))
      : new THREE.Vector3(n.x - rng.range(0.1, 0.75), rng.range(0.05, 0.4), Math.max(n.z, 0.5)).normalize().multiplyScalar(rng.range(10.5, 14.5));
    if (!small) {
      let s = null;
      if (mate && mate.laneS) {                                                            // the mate flies 0.7 m off its partner's wing
        const o = mate.laneS; tmp.copy(o.pt).add(tmp2.set(rng.range(-0.5, 0.5), rng.range(-0.15, 0.4), rng.range(0.55, 0.9) * (rng() < 0.5 ? -1 : 1)));
        s = solveLane(A, n, p.rel, mate.cls, 0, o.teP + rng.range(0.05, 0.16), tmp);
      }
      if (!s) { p.cls = mate ? mate.cls : (pairK < nA ? 0 : pairK < nA + nB ? 1 : 2); s = solveLane(A, n, p.rel, p.cls, pairK * 2 + (mate ? 1 : 0)); } else p.cls = mate.cls;
      if (!mate) pairK++;
      if (s) { p.V = s.V; p.D = s.D; p.b0 = s.tc + 0.4; p.laneS = s; if (p.cls < 2) lanes++; }
    }
    const bulk0 = !small && (mate ? mate.bulk0 : rng() < TK.bulk), bulk = !small && !!p.sk; p.bulk0 = bulk0; p.bulk = bulk;      // the skein is the body of the wheel
    p.ws = mate ? mate.ws : rng.range(0.965, 1.035);
    p.sAt = mate ? mate.sAt - rng.range(0.5, 1.5) : bulk ? TK.sRef + clamp(rng.gauss(), -2.3, 2.3) * TK.sigma : rng() * TKP;      // metres along the wheel at te = teRef
    p.s0 = p.sAt - TK.speed * p.ws * TK.teRef;
    p.lat = mate ? mate.lat + rng.range(-0.9, 0.9) : small ? rng.range(-10, 12) : clamp(rng.gauss() * 4, -8, 9);
    p.hy = mate ? mate.hy + rng.range(-0.4, 0.4) : small ? rng.range(-5, 3) : clamp(rng.gauss() * 2.6, -4, 7);
    p.cf = mate ? clamp(mate.cf + rng.range(0.002, 0.008), 0, 1) : rng(); p.cf = -1; p.perch = null; p.pn = null; p.landT = 1e6;
    p.seed = rng.range(1, 900); p.size = small ? rng.range(1.35, 1.65) : rng.range(1.12, 1.3);
    p.roll = clamp(rng.gauss() * 0.17, -0.35, 0.35);                  // heads up, tails hanging down the wall
    p.twist = mate ? -mate.twist : rng.sign(); p.pairH = mate ? mate.pairH : (p.seed * 0.618034) % 1; p.hop = p.wall && rng.chance(p.grp ? 0.3 : 0.1) ? rng.range(0.8, 2.1) : 0;      // metres out from the clay on its flutters
  };
  const instanced = (base, list) => {
    const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
    for (const k of ['position', 'normal', 'aPart']) g.setAttribute(k, base.attributes[k]);
    const N = list.length, a = new Float32Array(N * 4), nn = new Float32Array(N * 4), v = new Float32Array(N * 4), w = new Float32Array(N * 4), c = new Float32Array(N * 4), s = new Float32Array(N * 4), pp = new Float32Array(N * 4), pq = new Float32Array(N * 3);
    list.forEach((p, i) => {
      a.set([p.pos.x, p.pos.y, p.pos.z, p.rel], i * 4); nn.set([p.n.x, p.n.y, p.n.z, p.roll], i * 4); v.set([p.V.x, p.V.y, p.V.z, p.seed], i * 4);
      w.set([p.s0, p.lat, p.hy, p.ws], i * 4); c.set([p.sp, p.size, p.twist * (1 + 0.999 * p.pairH), p.hop], i * 4); s.set([p.vis, p.b0, p.D, p.cf], i * 4);
      pp.set([p.pos.x, p.pos.y, p.pos.z, 1e6], i * 4); pq.set([p.n.x, p.n.y, p.n.z], i * 3);
    });
    const I = (arr, n) => new THREE.InstancedBufferAttribute(arr, n);
    g.setAttribute('iA', I(a, 4)); g.setAttribute('iN', I(nn, 4)); g.setAttribute('iV', I(v, 4)); g.setAttribute('iW', I(w, 4)); g.setAttribute('iC', I(c, 4)); g.setAttribute('iS', I(s, 4)); g.setAttribute('iP', I(pp, 4)); g.setAttribute('iQ', I(pq, 3));
    g.instanceCount = N; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-30, 20, 60), 400);
    return g;
  };
  // the same flight the vertex shader flies (without its small wobbles): where bird p is at flush time te
  const wheelAt = (s, lat, hy, out) => {
    const f = (((s % TKP) + TKP) % TKP) / TKP * NL;
    loopPt(f, out); loopPt(f + 0.25, lq).sub(out);
    const l = Math.hypot(lq.x, lq.z) || 1;
    out.x += lq.z / l * lat; out.y += hy; out.z += -lq.x / l * lat;
    return out;
  };
  const wq = new THREE.Vector3(), rq = new THREE.Vector3(), rq2 = new THREE.Vector3();
  const flyAt = (p, te, out = new THREE.Vector3()) => {
    const tau = Math.max(te - p.rel, 0), g = tau * tau / (tau + 0.5), k = tau / 0.45;
    out.copy(p.pos).addScaledVector(p.n, 0.9 * (1 - Math.exp(-3 * tau))).addScaledVector(p.V, g); out.y += -1.3 * k * Math.exp(1 - k) - p.D * (1 - Math.exp(-1.1 * tau));
    out.lerp(wheelAt(p.s0 + TK.speed * p.ws * te, p.lat, p.hy, wq), smoothstep(p.b0, p.b0 + 5.9, tau));
    out.y = lerp(out.y, Math.max(out.y, (opts.floorY ?? 1.7) + 0.25), smoothstep(0.6, 1.6, tau));
    if (p.cf >= 0) {
      const sh = skShape(te), lead = sh[0] + p.cf * sh[1], f = (te + lead - SK.t0) / SK.dt;
      routePt(f, rq); routePt(f + 0.3, rq2).sub(rq); const l = Math.hypot(rq2.x, rq2.z) || 1, lat = sh[3] + (p.hpy - 0.5) * sh[4] + 0.55 * p.twist, up = sh[5] + (p.hpz - 0.5) * sh[6] - sh[2] * lead;
      rq.x += -rq2.z / l * lat; rq.z += rq2.x / l * lat; rq.y += up;
      out.lerp(rq, smoothstep(SK.join[0], SK.join[0] + SK.join[1], te + 1.5 * (p.hpx - 0.5)));
      if (p.perch) out.lerp(p.perch, smoothstep(p.landT - 1.7, p.landT, te));
    }
    return out;
  };

  // ----- bird meshes -----
  // the skein: SK.pairs pairs taken evenly from along the wall, half of them red birds where the cast has them and half
  // blue-and-yellow. They come first in the instance list, then the extras (pairs the world seats elsewhere: hero.setExtras),
  // then everyone else, so that once the forest hides the sky only the skein and the extras are drawn
  const pairsAll = []; for (let k = 0; k + 1 < nWallMacaw; k += 2) pairsAll.push(k);
  const nSk = Math.min(pairsAll.length, Math.max(0, Math.round(SK.pairs))), skein = [], others = [];
  const chosen = new Set(), reds = pairsAll.filter((k) => (macawP[k].sp ?? 2) < 1.5), blues = pairsAll.filter((k) => !((macawP[k].sp ?? 2) < 1.5));
  const nRed = Math.min(reds.length, Math.max(nSk - blues.length, Math.round(nSk * 0.5))), evenly = (list, n) => { for (let j = 0; j < n; j++) chosen.add(list[Math.floor((j + 0.5) * list.length / n)]); };
  if (nSk > 0) { evenly(reds, nRed); evenly(blues, Math.min(blues.length, nSk - nRed)); }
  for (const k of chosen) { macawP[k].sk = true; macawP[k + 1].sk = true; }
  for (let i = 0; i < macawP.length; i++) { if ((i & 31) === 0) await ctx.yield(); plan(macawP[i], false); }
  await ctx.yield();
  smallP.forEach((p) => plan(p, true));
  // ----- the small parrots are kept off the lens by place -----
  // A small parrot has no lane: its launch is a free draw, and nothing else holds its way against the lens. Here the whole way of each one
  // (the wall, the flush, the blend onto the wheel: the shader's own law mwFly; its wobbles are counted as the box they can fill) is
  // held against the lens's own line, the lens at the same flush time: opts.keepOff.long where the world hands one of four points or more (the line carried on to the
  // small parrots' last drawn moment), opts.keepOff.line otherwise. A parrot whose way stays RC off it (KEEP and
  // the body's own margin, below) is not touched. One that comes nearer is lifted UP and over the lens by the least climb that clears: its launch V.y is raised (its
  // height hy on the wheel instead, if it is more on the wheel than on its launch by then) and nothing else of it, so in plan it
  // crosses the bow where it did. Nothing is drawn from the generator here. A lift has a most: what is added to a parrot's V.y (m/s) or
  // to its hy (m), all its rounds together, is never more than LIFT (10: about twice the most any parrot of seeds 1 to 40 is raised, 4.79
  // m/s on its launch: a count of this world's notes, held by no line); a round that would pass it is not made, and what earlier
  // rounds gave that parrot stays. A parrot the block leaves nearer than RC (its
  // six rounds are spent, a lift has no hold on it at its nearest moment, or the lift it needs is over the most or is not a number) is
  // counted in parrotsNear as [parrot, its least distance, the flush time of it]: the count is handed out in stats, and the build
  // writes one warning that names them
  const parrotsNear = [];
  if (KO && KO.line.length > 3) {
    const KL = KO.long && KO.long.length > 3 ? KO.long : KO.line, kn = KL.length, kt0 = KL[0][0], kt1 = KL[kn - 1][0], kdt = (kt1 - kt0) / (kn - 1);
    // RC is held on the body's own origin (`base` in the shader). KEEP is for the body's middle, the mean of its skin as drawn, which stands
    // up to 0.11 m off that origin (wings and bob, at the largest size): RC is KEEP, that 0.11 m and 6 cm to spare
    const KEEP = 2.5, RC = KEEP + 0.17, VMAX = 100, LIFT = 10, flY = (opts.floorY ?? 1.7) + 0.25;
    const Lc = new THREE.Vector3(), Pw = new THREE.Vector3(), G = { h: 0, dy: 0, B: 0, w: 0, g: 0 }, iv = [];
    // the lens at flush time te: a Catmull-Rom spline through the line's points (they stand half a second apart)
    const lensC = (te, out) => {
      const f = clamp((te - kt0) / kdt, 0, kn - 1), i = Math.min(Math.floor(f), kn - 2), t = f - i, t2 = t * t, t3 = t2 * t;
      const a = KL[Math.max(i - 1, 0)], b = KL[i], c = KL[i + 1], d = KL[Math.min(i + 2, kn - 1)];
      const w0 = 0.5 * (-t + 2 * t2 - t3), w1 = 0.5 * (2 - 5 * t2 + 3 * t3), w2 = 0.5 * (t + 4 * t2 - 3 * t3), w3 = 0.5 * (-t2 + t3);
      return out.set(a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3, a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3, a[3] * w0 + b[3] * w1 + c[3] * w2 + d[3] * w3);
    };
    // parrot p against the lens at te. G.h: how far off it is on the level, G.dy: its middle over the lens, G.B: the half-height of its
    // wobble (1.2 m either way along the wheel's lateral and 1.5 m in height, by its share w of the wheel). Returns the least distance of that box
    const gapAt = (p, te) => {
      const tau = Math.max(te - p.rel, 0), g = tau * tau / (tau + 0.5), k = tau / 0.45, w = smoothstep(p.b0, p.b0 + 5.9, tau);
      Pw.copy(p.pos).addScaledVector(p.n, 0.9 * (1 - Math.exp(-3 * tau))).addScaledVector(p.V, g); Pw.y += -1.3 * k * Math.exp(1 - k) - p.D * (1 - Math.exp(-1.1 * tau));
      wheelAt(p.s0 + TK.speed * p.ws * te, p.lat, p.hy, wq); const ll = Math.hypot(lq.x, lq.z) || 1, ox = lq.z / ll, oz = -lq.x / ll;      // (lq: the wheel's heading there, as wheelAt leaves it)
      Pw.lerp(wq, w); const low = Pw.y < flY + 0.25; Pw.y += (Math.max(Pw.y, flY) - Pw.y) * smoothstep(0.6, 1.6, tau); Pw.addScaledVector(p.n, 0.09 * p.size);
      lensC(te, Lc);
      const dx = Pw.x - Lc.x, dz = Pw.z - Lc.z, dO = dx * ox + dz * oz, nx = dx - dO * ox, nz = dz - dO * oz, hO = Math.max(Math.abs(dO) - 1.2 * w, 0);
      G.h = Math.sqrt(nx * nx + nz * nz + hO * hO); G.dy = Pw.y - Lc.y; G.B = 1.5 * w + (low ? 0.25 : 0); G.w = w; G.g = g;
      const v = Math.max(Math.abs(G.dy) - G.B, 0); return Math.sqrt(G.h * G.h + v * v);
    };
    for (const p of smallP) {
      const from = Math.max(p.rel, kt0); let m = 1e9, tm = from, sum = 0;
      // (no step is longer than the gap left over RC at 100 m/s, more than bird and lens can close: no pass is stepped over)
      const scan = () => { m = 1e9; for (let te = from; te <= kt1;) { const d = gapAt(p, te); if (d < m) { m = d; tm = te; } te += Math.max(0.01, (d - RC) / VMAX); } };
      scan();
      for (let round = 0; m < RC && round < 6; round++) {
        gapAt(p, tm); const onV = G.w < 0.5, kS = onV ? (1 - G.w) * G.g : G.w;      // what one unit of the push lifts it by at its nearest moment
        if (kS < 0.05) break;
        // at every moment its way is over or under the lens (level distance under RC), the lifts k (metres at its nearest moment) that
        // would leave it inside RC there; the least lift that clears is the upper end of the run of such stretches that holds k = 0
        iv.length = 0;
        const bar = (te) => { gapAt(p, te); const lam = (onV ? (1 - G.w) * G.g : G.w) / kS; if (G.h < RC && lam > 1e-4) { const r = Math.sqrt(RC * RC - G.h * G.h); iv.push([(-r - G.dy - G.B) / lam, (r - G.dy + G.B) / lam]); } };
        bar(tm); for (let te = from; te <= kt1; te += Math.max(0.01, (G.h - RC) / VMAX)) bar(te);
        iv.sort((a, b) => a[0] - b[0]);
        let lift = 0; for (const q of iv) if (q[0] <= lift && q[1] > lift) lift = q[1];
        lift += 0.01;
        if (!(sum + lift / kS <= LIFT)) break;
        sum += lift / kS;
        if (onV) p.V.y += lift / kS; else p.hy += lift / kS;
        scan();
      }
      if (m < RC) parrotsNear.push([smallP.indexOf(p), +m.toFixed(3), +tm.toFixed(2)]);
    }
    if (parrotsNear.length) console.warn('macaw-wall (the part): ' + parrotsNear.length + ' small parrot(s) are left nearer the lens than ' + RC + ' m by the block that keeps them off it (parrot: metres at flush time): ' + parrotsNear.map((q) => q[0] + ': ' + q[1] + ' at ' + q[2]).join(', '));
  }
  // ----- the early flight -----
  // opts.early = { pairs, x0, x1 (the stretch of wall they are taken from), t0, xw, wave, jitter (a wave of take-offs that starts at
  // x = xw at flush time t0 and runs along the wall at `wave` m/s, each pair up to `jitter` s late), line: [[te, x, y, z], ...] (the
  // lens), keep (m), hold: { center, rx, rz, spread, tilt, omega } }. `pairs` pairs of wall macaws (never of the skein, never the
  // buttress birds) leave the wall long before the flush, cross the lens's bow 10 to 45 m off and above it, and circle over the
  // river in front of the wall (the ring in mwFly) until the flush. Planned with a generator of its own, after everyone else, so
  // that no other bird's plan changes
  let nEarly = 0;
  const EA = opts.early || null;
  if (EA && EA.pairs > 0 && EA.line && EA.line.length > 1) {
    const er = ctx.core.makeRng('macaw-early:' + ctx.seed), EL = EA.line, nE = EL.length, C0 = new THREE.Vector3(), C1 = new THREE.Vector3(), Tp = new THREE.Vector3(), Kp = new THREE.Vector3(), Kl = new THREE.Vector3(), Ve = new THREE.Vector3();
    const keep = EA.keep ?? 9;
    const lens = (te, out) => { let k = 0; while (k < nE - 2 && te > EL[k + 1][0]) k++; const a = EL[k], b = EL[k + 1], t = clamp((te - a[0]) / Math.max(b[0] - a[0], 1e-3), 0, 1); return out.set(a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t); };
    const solve = (A, n, rel, teP, Tg) => {
      const tc = teP - rel; if (tc < 1.3) return null;
      const e3 = 1 - Math.exp(-3 * tc), g = tc * tc / (tc + 0.5), dip = -1.3 * (tc / 0.45) * Math.exp(1 - tc / 0.45), D = clamp((A.y - Tg.y) * 0.92, 0, 40), dr = 1 - Math.exp(-1.1 * tc);
      Ve.copy(Tg).sub(A).addScaledVector(n, -0.9 * e3); Ve.y -= dip - D * dr; Ve.divideScalar(g);
      const sp = Ve.length(); if (sp < 9 || sp > 22 || Ve.z < 0.6) return null;
      for (let q = 0.3; q < tc + 1.6; q += 0.2) {
        const gq = q * q / (q + 0.5), kq = q / 0.45;
        Kp.copy(A).addScaledVector(n, 0.9 * (1 - Math.exp(-3 * q))).addScaledVector(Ve, gq); Kp.y += -1.3 * kq * Math.exp(1 - kq) - D * (1 - Math.exp(-1.1 * q));
        if (Kp.distanceTo(lens(rel + q, Kl)) < keep) return null;
      }
      return { V: Ve.clone(), D, tc };
    };
    const cand = pairsAll.filter((k) => { const p = macawP[k]; return !p.sk && p.grp !== 2 && p.grp !== 3 && p.pos.x > EA.x0 && p.pos.x < EA.x1 && macawP[k + 1] && macawP[k + 1].mate === p && (p.pos.x > (EA.xFull ?? -1e9) || er() < (EA.thin ?? 1)); });
    er.shuffle(cand);
    for (let ci = 0; ci < cand.length && nEarly < EA.pairs; ci++) {
      if ((ci & 7) === 0) await ctx.yield();
      const a = macawP[cand[ci]], b = macawP[cand[ci] + 1];
      let rel = EA.t0 + Math.abs(a.pos.x - EA.xw) / EA.wave + er.range(0, EA.jitter);
      let s = null, teP = 0;
      for (let j = 0; j < 24 && !s; j++) {
        teP = EA.pass ? er.range(EA.pass[0], EA.pass[1]) : rel + er.range(2.3, 4.8);
        lens(teP, C0); lens(teP + 0.3, C1).sub(C0).setY(0); if (C1.lengthSq() < 1e-6) C1.set(1, 0, 0); C1.normalize();
        const near = er() < 0.35, BX = EA.box, c = BX ? er.range(BX.c[0], near ? lerp(BX.c[0], BX.c[1], 0.4) : BX.c[1]) : near ? er.range(3, 18) : er.range(-4, 48), lt = BX ? er.range(BX.lt[0], BX.lt[1]) * (near ? 0.5 : 1) : near ? er.range(-4, 14) : er.range(-8, 38), up = BX ? er.range(BX.up[0], near ? lerp(BX.up[0], BX.up[1], 0.5) : BX.up[1]) : near ? er.range(3, 9) : er.range(3, 16);
        if (c * c + lt * lt + up * up < (keep + 1.5) * (keep + 1.5)) continue;
        Tp.set(C0.x + C1.x * c + C1.z * lt, C0.y + up, C0.z + C1.z * c - C1.x * lt);            // lt: metres to the LEFT of the lens's line
        if (EA.pass) { const sp = EA.speed || [12, 19]; rel = teP - (a.pos.distanceTo(Tp) / er.range(sp[0], sp[1]) + 0.45); }      // (timed back from the crossing: it leaves the clay when it must to be there)
        s = solve(a.pos, a.n, rel, teP, Tp);
      }
      if (!s) continue;
      a.rel = rel; a.V = s.V; a.D = s.D; a.b0 = s.tc + 0.3; a.early = true;
      const rel2 = rel + er.range(0.05, 0.22); Tp.x += er.range(-0.5, 0.5); Tp.y += er.range(-0.1, 0.4); Tp.z += er.range(0.55, 0.9) * er.sign();
      const s2 = solve(b.pos, b.n, rel2, teP + er.range(0.05, 0.16), Tp);
      b.rel = rel2; b.early = true;
      if (s2) { b.V = s2.V; b.D = s2.D; b.b0 = s2.tc + 0.3; } else { b.V = s.V.clone().add(Tp.set(er.range(-0.5, 0.5), er.range(0, 0.35), er.range(-0.5, 0.5))); b.D = s.D; b.b0 = a.b0; }
      nEarly++;
    }
  }
  const frac = (x) => x - Math.floor(x), hash3 = (q) => [frac(Math.sin(q * 12.9898) * 43758.5453), frac(Math.sin(q * 78.233) * 24634.6345), frac(Math.sin(q * 39.425) * 35734.7341)];
  for (let k = 0; k < macawP.length; k++) {
    const a = macawP[k];
    if (a.sk && !a.mate) {                                             // cf: 0 = the tail of the skein, nearest the lens .. 1 = its head
      const b = macawP[k + 1], j = skein.length / 2; a.cf = (j + 0.25 + 0.5 * a.pairH) / Math.max(nSk, 1); b.cf = a.cf;
      const hp = hash3((Math.abs(a.twist * (1 + 0.999 * a.pairH)) - 1) * 913.7 + 2.3); a.hpx = b.hpx = hp[0]; a.hpy = b.hpy = hp[1]; a.hpz = b.hpz = hp[2];
      skein.push(a, b);
    } else if (!a.sk) others.push(a);
  }
  // (the pairs along the skein are shuffled once, so that no stretch of it is all birds from one end of the wall)
  { const sr = ctx.core.makeRng('macaw-skein:' + ctx.seed), cfs = []; for (let j = 0; j < skein.length; j += 2) cfs.push(skein[j].cf); sr.shuffle(cfs); for (let j = 0; j < skein.length; j += 2) { skein[j].cf = cfs[j / 2]; skein[j + 1].cf = cfs[j / 2]; } }
  const nExtra = Math.max(0, opts.extraSlots | 0), extras = [];
  for (let k = 0; k < nExtra; k++) extras.push({ pos: new THREE.Vector3(0, -500, 0), n: new THREE.Vector3(0, 0, 1), rel: 1e6, V: new THREE.Vector3(), seed: 7.3 + k * 3.71, roll: 0, s0: 0, lat: 0, hy: 0, ws: 1, sp: 0, size: 0, twist: k % 2 ? -1 : 1, pairH: frac((k >> 1) * 0.618034 + 0.31), hop: 0, vis: 1, b0: 1e6, D: 0, cf: -1 });
  const macawOrder = skein.concat(extras, others), nFront = skein.length + extras.length;
  await ctx.yield();
  const birdMat = (P, extra = {}) => new THREE.ShaderMaterial({
    uniforms: mk({ uSh: { value: new THREE.Vector3().fromArray(P.shoulder) }, uNeck: { value: new THREE.Vector2(P.neck[0], P.neck[1]) }, uElbow: { value: P.elbow }, uChordM: { value: P.chordM },
      uFlapHz: { value: P.flap }, uSpanLen: { value: P.span[P.span.length - 1] } }),
    vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide, ...extra });
  const macawBase = birdGeometry(MACAW), parrotBase = birdGeometry(PARROT);
  const macaws = new THREE.Mesh(instanced(macawBase, macawOrder), birdMat(MACAW)); macaws.frustumCulled = false; macaws.renderOrder = 1; root.add(macaws);
  const parrots = new THREE.Mesh(instanced(parrotBase, smallP), birdMat(PARROT)); parrots.frustumCulled = false; parrots.renderOrder = 1; root.add(parrots);
  await ctx.yield();

  const statics = [cliff.mesh, decor.mesh, foam]; let dustMesh = null;
  // shadows on the clay (wall birds only)
  const wallBirds = macawP.slice(0, nWallMacaw).concat(smallP);
  {
    const N = wallBirds.length, g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const a = new Float32Array(N * 4), nn = new Float32Array(N * 4), c = new Float32Array(N * 4), s = new Float32Array(N * 2);
    wallBirds.forEach((p, i) => { a.set([p.pos.x, p.pos.y, p.pos.z, p.rel], i * 4); nn.set([p.n.x, p.n.y, p.n.z, 0], i * 4); c.set([p.sp, p.sp > 2.5 ? 0.5 : p.size, 0, 0], i * 4); s.set([p.vis, 0], i * 2); });
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iN', new THREE.InstancedBufferAttribute(nn, 4));
    g.setAttribute('iC', new THREE.InstancedBufferAttribute(c, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(s, 2));
    g.instanceCount = N;
    const m = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTe: FU.uTe, uSunDir: LU.uSunDir, uShadeCol: { value: clay.clone().multiplyScalar(0.1).lerp(col('#0a1420'), 0.4) } },
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 0.5; root.add(mesh); statics.push(mesh);
  }

  // dust, crumbs, feathers
  {
    const dA = [], dN = [], dS = [];
    for (const p of wallBirds) { dA.push(p.pos.x, p.pos.y, p.pos.z, p.rel); dN.push(p.n.x, p.n.y, p.n.z, 0); dS.push(rng.range(0, 99), p.sp > 2.5 ? rng.range(0.3, 0.5) : rng.range(0.55, 0.95)); }
    const nCr = Math.round(260 * (ctx.quality?.detail ?? 1));
    for (let k = 0; k < nCr; k++) {
      const p = k < nCr * 0.6 && nWallMacaw ? macawP[rng.int(0, nWallMacaw - 1)] : mkPerch(rng.range(-130, 130), rng.range(8, 34));
      dA.push(p.pos.x + rng.range(-0.4, 0.4), p.pos.y - rng.range(0, 1.5), p.pos.z, 0); dN.push(p.n.x, p.n.y, p.n.z, 1); dS.push(rng.range(0, 99), rng.range(0.035, 0.07));
    }
    const feeders = macawP.slice(0, nWallMacaw).filter((p) => p.grp > 0), nWisp = Math.round(Math.min(110, feeders.length * 0.45) * (ctx.quality?.detail ?? 1));
    for (let k = 0; k < nWisp; k++) { const p = feeders[(k * 7) % feeders.length]; dA.push(p.pos.x + rng.range(-0.3, 0.3), p.pos.y - rng.range(0.2, 0.8), p.pos.z, p.rel); dN.push(p.n.x, p.n.y, p.n.z, 3); dS.push(rng.range(0, 99), rng.range(0.45, 0.8)); }
    const reds = macawP.slice(0, nWallMacaw).filter((p) => p.sp < 1.5);
    for (let k = 0; k < 40 && reds.length; k++) { const p = rng.pick(reds); dA.push(p.pos.x, p.pos.y, p.pos.z, p.rel); dN.push(p.n.x, p.n.y, p.n.z, 2); dS.push(rng.range(0, 99), rng.range(0.07, 0.11)); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('dA', new THREE.InstancedBufferAttribute(new Float32Array(dA), 4)); g.setAttribute('dN', new THREE.InstancedBufferAttribute(new Float32Array(dN), 4));
    g.setAttribute('dS', new THREE.InstancedBufferAttribute(new Float32Array(dS), 2)); g.instanceCount = dS.length / 2;
    const m = new THREE.ShaderMaterial({ uniforms: mk({ uDust: { value: clay.clone().lerp(col(pal[6]), 0.35).multiplyScalar(0.9) } }),
      vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 3; root.add(mesh); statics.push(mesh); dustMesh = mesh;
  }

  // the harpy
  if (opts.harpy !== false) {
    const m = birdMat(HARPY, { defines: { HARPY: 1 } });
    const mesh = new THREE.Mesh(birdGeometry(HARPY), m); mesh.frustumCulled = false; mesh.renderOrder = 1; root.add(mesh); statics.push(mesh);
  }
  // birds flown from outside (opts.lead = how many): the same macaw, each placed by hero.setLead(i, position, heading, wing phase,
  // 0..1 shown, bank, species). The world's opening pair
  const leads = [];
  for (let k = 0; k < (opts.lead | 0); k++) {
    const U = { uHarpy: { value: new THREE.Vector3(0, -500, 0) }, uHarpyW: { value: new THREE.Vector3(0, 0, 1) }, uHarpyF: { value: new THREE.Vector3(-1, 0, 0) }, uHarpyPh: { value: 0 }, uHarpyOn: { value: 0 },
      uSolo: { value: new THREE.Vector4(0, 1.25, 0.85, 0) } };
    const m = birdMat(MACAW, { defines: { HARPY: 1 } }); Object.assign(m.uniforms, U);
    const mesh = new THREE.Mesh(macawBase, m); mesh.frustumCulled = false; mesh.renderOrder = 1; root.add(mesh); leads.push({ U, mesh });
  }
  const harpyAt = opts.harpyAt ? opts.harpyAt : (te, out = new THREE.Vector3()) => te < 0 ? out.set(14 - 25 * te, 30 - 7 * te, 22 + 13.5 * te) : out.set(14 - 25 * te, 30 + 0.35 * te * te, 22 + 0.8 * te * te);
  const shadowAt = (te, out = new THREE.Vector3()) => {
    harpyAt(te, tmp3);
    for (let s = 0; s < 160; s++) { out.copy(tmp3).addScaledVector(L, -s); const zf = cliff.zAt(out.x, out.y); if (zf > -900 && out.z <= zf) return out; if (out.y < 0) break; }
    return null;
  };

  // ----- anchors -----
  const xb = face.xb, yb = cliff.topAt(xb) * 0.3;
  const center = V3(-10, 17, 46);
  const anchors = {
    flyThrough: eyeLine.map((e) => V3(e[1], e[2], e[3])), eyeLine,
    buttress: V3(xb, yb, cliff.zAt(xb, yb)),
    scarletBand: V3(0, cliff.topAt(0) * 0.72, cliff.zAt(0, cliff.topAt(0) * 0.72)), bandNormal: V3(0, 0, 1),
    waveOrigin: V3(WAVE_X, bandY, cliff.zAt(WAVE_X, bandY)), harpyOver: harpyAt(0),
    wheelCenter: WC.clone(), wheelRadius: WR.slice(),
    rim: decor.rim, foot: decor.foot, snags: decor.snagTips,
    viewpoints: {
      approach: { position: V3(140, 3, 235), look: V3(20, 22, 0) },
      alongWall: { position: V3(84, 9, 22), look: V3(20, 20, 4) },
      flush: { position: V3(14, 14, 22), look: V3(-40, 22, 6) },
      wheel: { position: V3(-95, 12, 40), look: WC.clone() },
    },
    portalSeat: { position: V3(-175, 14, 118), facing: V3(0.9, 0, -0.44).normalize() },
    sunDir: L.clone(),
  };

  // ----- clock -----
  let teManual = null, stage = 0; const harpyEnd = opts.harpyEnd ?? 12.5, backN = opts.backBirds ?? 320;
  const camL = new THREE.Vector3(), TAU = Math.PI * 2;
  const tris = cliff.tris + decor.tris + (macawBase.index.count / 3) * macawP.length + (parrotBase.index.count / 3) * smallP.length;
  const hero = {
    object: root,
    radius: 14, height: HT, center,
    extent: { length: LEN, height: HT, depth: 40 },
    anchors, ground: true, groundY: 0,
    eventSeconds: duration, flushAt,
    stats: { macaws: macawP.length, parrots: smallP.length, parrotsNear: parrotsNear.length, laneBirds: lanes, early: nEarly * 2, triangles: Math.round(tris), cast, buildMs: 0 },
    setProgress(u) { teManual = u * duration - flushAt; },
    setFlushTime(te) { teManual = te; },
    setShadowLine(y) { LU.uShadowY.value = y; },
    setLight(o = {}) {
      if (o.sunColor) LU.uSunCol.value.set(o.sunColor).multiplyScalar(o.sunIntensity ?? 2.7);
      if (o.skyColor) LU.uSkyCol.value.set(o.skyColor).lerp(col('#cfc8e6'), 0.25).multiplyScalar(1.0);
      if (o.groundColor) LU.uGndCol.value.set(o.groundColor).multiplyScalar(0.26);
    },
    harpyAt, shadowAt, eyeAt, wheelAt, track: TK,
    skein, skeinAt: (te, out = new THREE.Vector3()) => { const sh = skShape(te), lead = sh[0] + 0.5 * sh[1]; routePt((te + lead - SK.t0) / SK.dt, out); out.y += sh[5] - sh[2] * lead; return out; },
    setStage(k) { stage = k; },
    // perches for the skein, two to a pair, mates next to each other: [{ p: Vector3, n: Vector3 (the way the bird's back faces), t: flush
    // time at which the skein's line passes nearest }]. The head of the skein takes the earliest
    setPerches(list) {
      const g = macaws.geometry, iP = g.attributes.iP, iQ = g.attributes.iQ, nP = Math.floor(list.length / 2);
      if (!nP) return;
      const order = []; for (let j = 0; j < skein.length; j += 2) order.push(j); order.sort((a, b) => skein[b].cf - skein[a].cf);
      const slots = []; for (let j = 0; j < nP; j++) slots.push(j); slots.sort((a, b) => list[a * 2].t - list[b * 2].t);
      order.forEach((j, rank) => {
        const sl = slots[Math.min(rank, nP - 1) % nP], wrap = rank >= nP ? 0.8 : 0;
        for (let m = 0; m < 2; m++) {
          const bird = skein[j + m], q = list[sl * 2 + m]; let lt = q.t;
          for (let it = 0; it < 4; it++) { const sh = skShape(lt); lt = q.t - (sh[0] + bird.cf * sh[1]) + 0.3; }
          bird.perch = q.p.clone(); bird.perch.y += wrap; bird.pn = q.n.clone(); bird.landT = lt;
          iP.setXYZW(j + m, bird.perch.x, bird.perch.y, bird.perch.z, lt); iQ.setXYZ(j + m, q.n.x, q.n.y, q.n.z);
          g.attributes.iC.setW(j + m, q.hop ?? 0);
        }
      });
      iP.needsUpdate = true; iQ.needsUpdate = true; g.attributes.iC.needsUpdate = true;
    },
    // pairs seated elsewhere for good (opts.extraSlots of them at most): [{ p, n, sp (0 scarlet, 1 red-and-green, 2 blue-and-yellow), size, hop }]
    setExtras(list) {
      const g = macaws.geometry, A = g.attributes, i0 = skein.length;
      list.slice(0, extras.length).forEach((q, k) => {
        const i = i0 + k, e = extras[k];
        A.iA.setXYZW(i, q.p.x, q.p.y, q.p.z, 1e6); A.iN.setXYZW(i, q.n.x, q.n.y, q.n.z, q.roll ?? 0); A.iP.setXYZW(i, q.p.x, q.p.y, q.p.z, 1e6); A.iQ.setXYZ(i, q.n.x, q.n.y, q.n.z);
        A.iC.setXYZW(i, q.sp ?? 0, q.size ?? 1.25, e.twist * (1 + 0.999 * e.pairH), q.hop ?? 0); A.iS.setXYZW(i, 1, 1e6, 0, -1);
      });
      for (const k of ['iA', 'iN', 'iP', 'iQ', 'iC', 'iS']) A[k].needsUpdate = true;
    },
    setLead(i, pos, fwd, phase, on, bank = 0, sp = 0) {
      const L = leads[i]; if (!L) return;
      L.U.uHarpy.value.copy(pos); L.U.uHarpyF.value.copy(fwd); L.U.uHarpyW.value.set(0, 1, 0).cross(fwd).normalize();
      L.U.uHarpyPh.value = phase; L.U.uHarpyOn.value = on; L.U.uSolo.value.x = sp; L.U.uSolo.value.w = bank; L.mesh.visible = on > 0.001;
    },
    birds: macawP, birdAt: (k, te, out) => flyAt(macawP[k], te, out),
    faceZ: (x, y) => cliff.zAt(x, y), rimY: (x) => cliff.topAt(x),
    update(dt, time, camera) {
      FU.uTime.value = time;
      root.updateWorldMatrix(true, false);
      camL.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(camL); FU.uCamL.value.copy(camL);
      let te = teManual;
      if (te === null) {
        const az = Math.atan2(camL.x - center.x, camL.z - center.z), azp = (((az + 0.5) % TAU) + TAU) % TAU;
        te = ((((time + 2 * azp + 16.02) % DEMO_LOOP) + DEMO_LOOP) % DEMO_LOOP) - 4;
      }
      FU.uTe.value = te;
      { const sh = skShape(te); FU.uSkL.value.set(sh[0], sh[1], sh[2], 0); FU.uSkQ.value.set(sh[3], sh[4], sh[5], sh[6]); }
      // stage 0: everything. 1: the forest hides the wall and the sky, so only the skein and the extras are drawn. 2: the wall has
      // filled again (the small parrots stay away: at that range they are confetti; so does the dust)
      const st = stage;
      FU.uBack.value = st === 2 ? 1 : 0;
      for (const o of statics) o.visible = st !== 1;
      if (dustMesh) dustMesh.visible = st === 0;
      parrots.visible = st === 0;
      macaws.geometry.instanceCount = st === 0 ? macawOrder.length : st === 1 ? Math.max(nFront, 1) : Math.min(macawOrder.length, nFront + backN);
      harpyAt(te, HU.uHarpy.value); harpyAt(te + 0.1, tmp);
      HU.uHarpyF.value.subVectors(tmp, HU.uHarpy.value).normalize();
      HU.uHarpyW.value.set(0, 1, 0).cross(HU.uHarpyF.value).normalize();
      HU.uHarpyOn.value = smoothstep(-9, -8, te) * (1 - smoothstep(harpyEnd - 1.5, harpyEnd, te));
      if (opts.scare) { const k = opts.scare(te); FU.uScare.value.set(HU.uHarpy.value.x, HU.uHarpy.value.y, HU.uHarpy.value.z, k); }
      const ph = te * 5.2; HU.uHarpyPh.value = ph; HU.uHarpyFlap.value = 0.5 + 0.5 * Math.cos(0.42 * Math.sin(ph));
    },
    dispose() {},
  };
  hero.stats.buildMs = Math.round(0 - t0);
  return hero;
}
