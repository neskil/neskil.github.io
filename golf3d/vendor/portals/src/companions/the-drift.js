// The Drift: the air of the world you have just left comes through the portal with you.
//
// About three hundred small particles, in the last world's own kind (snowflakes, embers, petals,
// bubbles, leaves, star glints, seed fluff, golden dust) and tinted with its portal colour (s.prev.color).
//
// How it moves.
//   - at the crossing they pour out of the portal around the viewer in a turning vortex, overtake
//     the eye and open into a wide ring 7-18 m ahead that leaves the middle of the picture clear
//   - then each one lets go of the journey in its own time: it slows, hangs in the new world's air
//     (snow sinks, embers and bubbles rise, petals and leaves tumble down, fluff floats), shrinks
//     as if melting, and is overtaken past the edge of the frame. After twelve seconds none are left
//   - over the last 60 m of a world the air ahead condenses again, now in THIS world's kind and
//     portal colour, a few at first then all of them; they run ahead and wind into a wreath that
//     spirals in round the portal's rim, one after another: those are the ones that come out the far side
//   - nothing at all is shown in the first world of a journey (there is no world behind you yet)
//
//   - it answers the flight: the faster you fly the sooner each one is left behind (s.speed), in a bend
//     they swing to the outside and lag it (s.turn), and the whole cloud trails a turn of the gaze
//
// Positions are a function of s.entered, s.remaining and the world clock; only three smoothed numbers
// (pace clock, turn, gaze) are stored, and they restart cleanly at every crossing.
// Cost: ONE draw call, 300 instanced quads (600 triangles), all motion in the vertex shader, shapes
// drawn in the fragment shader (no textures). CPU: three path samples and ~20 uniforms per frame.
import * as THREE from 'three';

const N = 300;
const LIFE = 12;         // seconds the drift lingers after a crossing
const GATHER = 60;       // metres before the portal at which the air starts to condense
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// kind: [shader id, base colour, how much of the portal tint, vertical drift m/s, wander m, spin, tumble, emissive, halo, size]
const KINDS = {
  mote:   [0, '#ffe9b0', 0.55,  0.06, 0.40, 0.0, 0.0, 2.6, 1.00, 0.80],
  snow:   [1, '#f2f8ff', 0.30, -0.42, 0.45, 0.5, 0.5, 0.9, 0.40, 1.20],
  ember:  [2, '#ff5a10', 0.22,  0.60, 0.50, 0.0, 0.0, 3.4, 1.30, 0.78],
  petal:  [3, '#ffb3cc', 0.40, -0.30, 0.65, 0.9, 0.85, 0.45, 0.16, 1.35],
  bubble: [4, '#cfefff', 0.45,  0.50, 0.30, 0.0, 0.0, 0.7, 0.22, 1.50],
  leaf:   [5, '#d99a2e', 0.35, -0.34, 0.65, 0.8, 0.85, 0.35, 0.10, 1.45],
  spark:  [6, '#ffffff', 0.60,  0.00, 0.22, 0.2, 0.0, 3.6, 1.20, 0.85],
  fluff:  [7, '#ffeccf', 0.60,  0.12, 0.60, 0.25, 0.0, 0.45, 0.30, 1.60],
};
// which kind a world leaves in the air: a few by name, then by whole words of its id, then by its category
const BY_ID = { 'shaken-globe': 'snow', 'the-calving': 'snow', 'monarch-sanctuary': 'petal', 'ink-dragon': 'mote', 'neon-monsoon': 'spark', 'chandelier-city': 'spark', 'glowwood': 'spark', 'lemon-cliffs': 'petal' };
const W = (words) => new RegExp('(^|-)(' + words + ')(-|$)');
const WORDS = [
  [W('snow|snowbound|ice|frost|glacier|fjord|winter|aurora|hail'), 'snow'],
  [W('lantern|lanterns|forge|fire|lava|volcano|ember|embers|candle|furnace|engine'), 'ember'],
  [W('garden|blossom|cherry|petal|petals|flower|flowers|meadow|orchard|paper'), 'petal'],
  [W('kelp|reef|sea|ocean|sunken|tempest|tide|tideline|lagoon|deep|shore|rain|sounding'), 'bubble'],
  [W('wood|woods|redwood|forest|grove|jungle|savanna|falls|valley|autumn|green'), 'leaf'],
  [W('orbit|star|stars|neon|glass|nebula|crystal|storm|inside|night|moon'), 'spark'],
  [W('cloud|clouds|sky|wind|turtle|doors|archipelago|murmuration'), 'fluff'],
  [W('library|canyon|table|stair|stairway|dune|desert|dust|attic|erg|gilded|shadow'), 'mote'],
];
const BY_CATEGORY = { alien: 'spark', bizarre: 'fluff', city: 'spark', domestic: 'mote', interior: 'mote', ocean: 'bubble', sky: 'fluff', wilderness: 'leaf' };
function kindFor(id, category) {
  const s = String(id || '');
  if (BY_ID[s]) return KINDS[BY_ID[s]];
  for (const [re, k] of WORDS) if (re.test(s)) return KINDS[k];
  return KINDS[BY_CATEGORY[category] || 'mote'];
}

const VERT = /* glsl */`
attribute vec4 aSeed;   // a: when it lets go, b: how far ahead, c: how far off the centre line, e: free
attribute vec4 aB;      // angle round the line of flight, phase, glitter, size
uniform float uTime, uT, uSlip, uTurn, uMode, uRemain, uD2, uVis, uGrav, uWander, uSpin, uTumble, uSize, uPx, uLife;
uniform vec3 uP0, uP1, uP2, uRight, uUp, uFwd, uBase, uTint, uCam, uCamF;
uniform float uTintK;
varying vec2 vUv; varying vec3 vCol; varying vec4 vS; varying float vA, vFlat, vDet, vHot, vFun;
float sst(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }   // smoothstep that may run downhill
void main(){
  float a = aSeed.x, b = aSeed.y, c = aSeed.z, e = aSeed.w, ph = aB.y;
  float Dmax = 7.0 + 11.0 * b;
  float lead, latK, twist, alpha, air, melt = 0.0, loose = 0.0;
  vHot = 0.0;
  if (uMode < 0.5) {
    // ---- the drift: out of the portal, round the viewer, then left behind one by one ----
    float T = 2.4 + (uLife - 2.0) * a;                      // when the eye overtakes this one
    float x = clamp(uT / T, 0.0, 1.0);
    float tl = max(uT - 1.3 * a, 0.0);                      // they come through in a stream, not all at once
    float rise = 1.0 - pow(1.0 - min(tl / (1.1 + 1.1 * e), 1.0), 3.0);
    float fall = pow(max(0.0, (uSlip - 0.7) / (T - 0.7)), 1.7);   // uSlip: the clock run at the speed of the flight
    lead = Dmax * (0.22 + 0.78 * rise) - (Dmax + 4.0) * fall;
    latK = 0.30 + 0.70 * rise;
    twist = (1.0 - rise) * (1.0 - rise) * 2.4;
    alpha = sst(0.0, 0.25 + 0.4 * e, uT - 1.3 * a) * mix(0.55, 1.0, rise) * (1.0 - 0.35 * x * x) * (1.0 - sst(0.93, 1.0, x));
    air = max(0.0, tl - 0.6) * (0.4 + 0.6 * x);
    melt = x; loose = x;
    vHot = (1.0 - rise) * 0.8;
  } else {
    // ---- the gathering: condense out of the air, run ahead, wind into the portal ----
    float start = 60.0 - 36.0 * a;
    float k = clamp((start - uRemain) / start, 0.0, 1.0);
    lead = mix(5.0 + 8.0 * b, 11.5 + 8.5 * b, k);
    latK = mix(1.2, 0.55, k);
    twist = -k * k * 2.6;
    alpha = sst(0.0, 0.14, k);
    air = -(1.0 - k) * (1.0 - k) * 2.5;                      // each settles into place against its own drift
    melt = 1.0 - sst(0.0, 0.3, k);
    loose = 1.0 - k;
    vHot = k * k;
  }
  // the last metres before the portal: a wreath that winds in round the rim, one after another (never a ball in its middle)
  float fun = sst(0.0, 24.0, uRemain - lead);
  lead += (a - 0.5) * 6.0 * (1.0 - fun) * uMode;
  twist -= (1.0 - fun) * 3.0 * uMode;
  float toPortal = uRemain - lead;
  alpha *= sst(0.0, 4.0, toPortal);
  vHot = max(vHot, (1.0 - fun) * uMode);
  vFun = mix(1.0, fun, uMode);
  lead = min(lead, uRemain);
  // position on the path (a parabola through the eye, D2/2 ahead and D2 ahead)
  float t = lead / uD2;
  vec3 p = uP0 * ((t - 0.5) * (t - 1.0) * 2.0) + uP1 * (-4.0 * t * (t - 1.0)) + uP2 * (t * (t - 0.5) * 2.0);
  // ...drawn most of the way onto the (lagging) line of sight, so the clear middle of the ring is the middle of
  // the PICTURE when the gaze rests on a set piece, yet the cloud trails a turn of the head instead of being glued
  // to it; near the portal the path wins and leads them in
  p = mix(p, uCam + uCamF * lead, 0.78 * fun);
  // in a bend they swing to the outside and lag it, the loose ones most
  p -= uRight * uTurn * max(lead, 0.0) * 0.35 * (0.3 + 0.7 * loose);
  // a ring round the line of flight, never on it: no nearer than about 20 degrees to the line of sight
  float th = aB.x + twist;
  float R = (0.27 + 0.48 * c) * Dmax * latK;
  R = max(R, (0.36 + 0.14 * e) * max(lead, 1.5) * (1.0 - uMode));
  R = mix(R, mix(2.7 + 2.5 * c, R, fun), uMode);
  p += (uRight * cos(th) + uUp * (sin(th) * 0.74 + 0.10)) * R;
  // the new world's air takes them: sink or rise, and wander
  p.y += uGrav * air * (0.6 + 0.8 * e);
  float w1 = uTime * (0.55 + 0.5 * ph) + ph * 40.0, w2 = uTime * (0.43 + 0.4 * e) + e * 31.0;
  p += (uRight * sin(w1) + vec3(0.0, 0.6, 0.0) * sin(w2) + uFwd * 0.5 * cos(w1 * 0.7 + 1.3)) * uWander * (0.35 + 0.65 * fun);
  p += uRight * sin(w2 * 2.3) * uTumble * 0.18;                // flutter of the flat ones

  float glit = step(0.84, aB.z);                              // a few are always plain motes of light
  vS = vec4(e, ph, glit, c);
  vec3 col = mix(uBase, uTint, uTintK + (ph - 0.5) * 0.3);
  vCol = mix(col * (0.8 + 0.4 * e), uTint, glit);
  float spin = aB.x * 3.0 + uTime * uSpin * (0.5 + e) * (ph > 0.5 ? 1.0 : -1.0) + sin(w1) * 0.5;
  vFlat = mix(1.0, max(0.36, abs(cos(uTime * (0.9 + a) * 1.5 + ph * 30.0))), uTumble * (1.0 - glit));
  float cs = cos(spin), sn = sin(spin);
  vUv = vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs);

  float size = (0.050 + 0.062 * aB.w) * mix(uSize, 0.75, glit) * (1.0 - 0.45 * melt) * 2.5;
  vec4 clip = projectionMatrix * (viewMatrix * vec4(p, 1.0));
  float sy = size * projectionMatrix[1][1];
  float pxl = uPx * clip.w;                                     // one pixel, in clip units
  sy = clamp(sy, 4.2 * pxl, 0.075 * clip.w);
  float sx = sy * projectionMatrix[0][0] / projectionMatrix[1][1];
  vDet = sst(7.0, 16.0, sy / pxl);                       // enough pixels to draw the real shape
  vA = alpha * uVis * sst(1.0, 3.0, clip.w);
  clip.xy += position.xy * vec2(sx, sy);
  if (vA < 0.004) clip = vec4(0.0, 0.0, -2.0, 1.0);
  gl_Position = clip;
}`;

const FRAG = /* glsl */`
uniform float uKind, uEmis, uGlow, uDay, uTime;
uniform vec3 uLight, uExtraFill, uTint;
varying vec2 vUv; varying vec3 vCol; varying vec4 vS; varying float vA, vFlat, vDet, vHot, vFun;
float sst(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }   // smoothstep that may run downhill
const float PI = 3.14159265;
void main(){
  vec2 q = vUv * 2.5; q.x /= vFlat;                 // the body lives inside |q| < 1, the halo outside
  float r = length(q), r0 = length(vUv) * 2.5, ang = atan(q.y, q.x);
  float edge = 1.0 - sst(1.9, 2.5, r0);
  float halo = exp(-r0 * r0 * 1.1) * edge;
  float soft = sst(0.85, 0.25, r) * 0.85;    // what every kind looks like from far away
  float kind = mix(uKind, 0.0, vS.z);
  float body = soft, shade = 1.0, spec = 0.0, glow = uGlow, emis = uEmis;
  vec3 alb = vCol;
  if (kind < 0.5) {                                 // mote of light
    body = sst(0.62, 0.22, r);
    float tw = 0.7 + 0.3 * sin(uTime * (2.0 + 3.0 * vS.x) + vS.y * 40.0);
    emis = max(uEmis, 2.2) * tw; glow = max(uGlow, 0.8) * tw;
  } else if (kind < 1.5) {                          // snowflake: six arms, two barbs on each
    float af = mod(ang + PI / 6.0, PI / 3.0) - PI / 6.0;
    vec2 f = r * vec2(cos(af), sin(af));
    float arm = sst(0.12, 0.05, abs(f.y)) * sst(1.0, 0.92, f.x);
    float b1 = sst(0.09, 0.03, abs(abs(f.y) - (f.x - 0.40) * 0.85)) * sst(0.38, 0.42, f.x) * sst(0.66, 0.60, f.x);
    float b2 = sst(0.08, 0.03, abs(abs(f.y) - (f.x - 0.68) * 0.85)) * sst(0.66, 0.70, f.x) * sst(0.90, 0.84, f.x);
    float hex = sst(0.30, 0.22, f.x);
    body = mix(soft, max(max(arm, hex), max(b1, b2)), vDet);
    shade = 1.0 - 0.25 * sst(0.2, 0.0, f.x) * vDet;
    spec = 0.35 * arm * pow(0.5 + 0.5 * sin(uTime * 2.3 + vS.y * 50.0), 6.0);
  } else if (kind < 2.5) {                          // ember: a hot grain that breathes
    float fl = 0.65 + 0.35 * sin(uTime * (5.0 + 6.0 * vS.x) + vS.y * 60.0) * sin(uTime * 1.7 + vS.x * 20.0);
    body = sst(0.55, 0.18, r);
    alb = mix(vCol, vec3(1.0, 0.86, 0.5), sst(0.4, 0.0, r) * 0.8);
    emis = uEmis * fl; glow = uGlow * fl;
  } else if (kind < 3.5) {                          // petal: wider at the lip, a notch in it, a darker claw
    float w = 0.66 * sqrt(max(0.0, 1.0 - q.y * q.y)) * (0.72 + 0.30 * q.y);
    float notch = sst(0.26, 0.18, length(q - vec2(0.0, 1.02)));
    float sh = sst(0.07, -0.05, abs(q.x) - w) * (1.0 - notch);
    body = mix(soft, sh, vDet);
    shade = mix(0.62, 1.12, sst(-1.0, 0.6, q.y)) * (1.0 - 0.14 * sst(0.07, 0.0, abs(q.x)) * vDet) * (0.55 + 0.45 * vFlat);
    alb = mix(alb, vec3(1.0, 0.96, 0.94), sst(0.0, 1.0, q.y) * 0.45);
  } else if (kind < 4.5) {                          // bubble: a thin bright skin, a window light, a low reflection
    float ring = sst(0.17, 0.0, abs(r - 0.82));
    float fill = sst(1.0, 0.86, r) * 0.10;
    float hl = sst(0.24, 0.05, length(q - vec2(-0.36, 0.40)));
    float arc = sst(0.10, 0.0, abs(r - 0.60)) * sst(0.35, 0.95, dot(q / max(r, 0.001), vec2(0.6, -0.8)));
    body = mix(soft * 0.6, clamp(ring * 0.72 + fill + hl + arc * 0.5, 0.0, 1.0), vDet);
    alb = mix(vCol, vCol.gbr, 0.30 + 0.30 * sin(ang * 2.0 + vS.y * 20.0 + uTime * 0.7));
    spec = (hl * 1.6 + arc * 0.35 + ring * 0.25) * vDet + 0.25 * soft * (1.0 - vDet);
    shade = 1.15;
  } else if (kind < 5.5) {                          // leaf: a pointed lens with a midrib and a stalk
    float w = 0.52 * (1.0 - q.y * q.y) * (1.0 - 0.25 * q.y);
    float sh = sst(0.06, -0.04, abs(q.x) - w) * step(abs(q.y), 1.0);
    float stalk = sst(0.06, 0.02, abs(q.x)) * sst(-1.45, -1.35, q.y) * sst(-0.9, -1.0, q.y);
    body = mix(soft, max(sh, stalk), vDet);
    float veins = sst(0.05, 0.0, abs(q.x)) + 0.5 * sst(0.07, 0.0, abs(fract((q.y - abs(q.x) * 0.9) * 2.6) - 0.5) - 0.38);
    shade = (1.0 - 0.22 * clamp(veins, 0.0, 1.0) * vDet) * (0.55 + 0.45 * vFlat) * mix(0.8, 1.1, sst(-1.0, 1.0, q.x + q.y));
    alb = mix(vCol, vCol * vec3(1.25, 0.62, 0.30), vS.x * 0.8);
    alb = mix(alb, vCol * vec3(0.50, 0.95, 0.30), step(0.62, vS.y) * 0.75);   // a third are still green       // every leaf its own stage of autumn
  } else if (kind < 6.5) {                          // star glint: a hard core and a four-point flare
    float tw = 0.55 + 0.45 * sin(uTime * (2.4 + 3.6 * vS.x) + vS.y * 50.0);
    vec2 aq = abs(vUv * 2.5);
    float flare = (exp(-aq.x * 7.0 - aq.y * 0.9) + exp(-aq.y * 7.0 - aq.x * 0.9)) * edge;
    body = sst(0.45, 0.12, r);
    emis = uEmis * (0.6 + 0.6 * tw); glow = uGlow * (0.5 + flare * 2.2 * tw);
    spec = flare * tw * 0.9;
  } else {                                          // seed fluff: a parasol of filaments over a hanging seed
    vec2 g = q - vec2(0.0, 0.25);
    float gr = length(g), ga = atan(g.y, g.x);
    float sp = pow(abs(cos(ga * 5.5 + vS.y * 6.0)), 18.0);
    float fil = sp * sst(0.95, 0.80, gr) * sst(0.06, 0.2, gr) * (0.55 + 0.45 * sst(0.5, 0.9, gr));
    float tips = sst(0.14, 0.02, abs(gr - 0.84)) * pow(abs(cos(ga * 5.5 + vS.y * 6.0)), 5.0);
    float stalk = sst(0.045, 0.015, abs(q.x)) * step(q.y, 0.25) * sst(-1.25, -1.15, q.y);
    float seedd = sst(0.16, 0.08, length((q - vec2(0.0, -1.25)) * vec2(1.0, 0.55)));
    float sh = max(max(fil * 0.55, tips * 0.7), max(stalk * 0.7, seedd));
    body = mix(soft * 0.75, max(sh, sst(0.14, 0.05, gr)), vDet) * 0.8;
    alb = mix(vCol, vCol * vec3(0.55, 0.42, 0.30), seedd * vDet);
    glow = uGlow * (0.6 + 0.4 * (1.0 - vDet));
  }
  body = clamp(body, 0.0, 1.0);
  // lit by the world it is in now, glowing a little of its own; warmer and brighter near a portal
  float hot = 1.0 + min(vHot, 1.0) * 0.8;
  vec3 lit = alb * shade * (uLight + uExtraFill + emis * hot * mix(1.0, 0.55, uDay));
  // by day a thin edge in the old world's colour, deepened, holds a pale thing against a pale sky
  float rimBand = body * (1.0 - sst(0.35, 0.9, body));
  lit = mix(lit, mix(lit * vec3(0.42, 0.40, 0.50), uTint * 0.45 * (uLight + uExtraFill), 0.6), rimBand * uDay * 0.9);
  // ...and by night a ring of it: the halo is the old world's colour outright; halos thin where they crowd at the portal
  vec3 add = uTint * halo * glow * hot * (1.0 - 0.6 * (1.0 - vFun)) * mix(0.62, 0.22, uDay) + vec3(spec) * (uLight * 0.6 + 0.5);
  float al = body * mix(0.92, 1.0, uDay);
  gl_FragColor = vec4((lit * al + add) * vA, al * vA);   // premultiplied: halo adds, body covers
}`;

// TEST: the screenshot harness shows one world only, where the drift is (by design) invisible. Set this
// to a previous world, e.g. { id: 'aurora-fjord', category: 'wilderness', color: '#f0ffff' }, and
// path fraction u stands in for the clock (u 0.01 = 1 s after the crossing). Must be null when shipped.
const TEST = null;

export default {
  id: 'the-drift', name: 'The Drift',
  async build(ctx) {
    const { rng } = ctx;
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const seed = new Float32Array(N * 4), sb = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      // "when it lets go" is stratified so the cloud thins evenly over the twelve seconds
      seed[i * 4] = Math.pow((i + rng()) / N, 0.85); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = Math.pow(rng(), 0.8); seed[i * 4 + 3] = rng();
      // a little more of them to the sides than above and below, so the horizon line stays readable
      let th = rng() * Math.PI * 2; th -= 0.22 * Math.sin(2 * th);
      sb[i * 4] = th; sb[i * 4 + 1] = rng(); sb[i * 4 + 2] = rng(); sb[i * 4 + 3] = Math.pow(rng(), 1.6);
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(sb, 4));
    geo.instanceCount = N;

    const V = () => ({ value: new THREE.Vector3() }), F = (v = 0) => ({ value: v });
    const U = {
      uTime: F(), uT: F(), uSlip: F(), uTurn: F(), uMode: F(), uRemain: F(1000), uD2: F(20), uVis: F(1), uLife: F(LIFE),
      uGrav: F(), uWander: F(), uSpin: F(), uTumble: F(), uSize: F(1), uPx: F(2 / 1080), uKind: F(), uEmis: F(1), uGlow: F(1), uDay: F(0.5), uTintK: F(0.5),
      uP0: V(), uP1: V(), uP2: V(), uRight: V(), uUp: V(), uFwd: V(), uCam: V(), uCamF: V(),
      uBase: { value: new THREE.Color() }, uTint: { value: new THREE.Color() }, uLight: { value: new THREE.Color(0.7, 0.7, 0.7) },
      uExtraFill: ctx.fill,
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.visible = false;
    const object = new THREE.Group(); object.name = 'the-drift'; object.add(mesh);

    const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), P2 = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0), size = new THREE.Vector2(), hsl = { h: 0, s: 0, l: 0 }, tint = new THREE.Color(), lightC = new THREE.Color();
    const gaze = new THREE.Vector3(), gazeNow = new THREE.Vector3();
    let lookId = null, lookColor = null, night = 0.32;
    let slip = 0, turn = 0, lastEnt = -1, live = false;
    const setLook = (id, category, color) => {
      if (id === lookId && color === lookColor) return;
      lookId = id; lookColor = color;
      const K = kindFor(id, category);
      U.uKind.value = K[0]; U.uBase.value.set(K[1]); U.uTintK.value = K[2]; U.uGrav.value = K[3]; U.uWander.value = K[4];
      U.uSpin.value = K[5]; U.uTumble.value = K[6]; U.uEmis.value = K[7]; U.uGlow.value = K[8]; U.uSize.value = K[9];
      night = K[7] < 1 ? 0.24 : 0.32;                       // things that do not glow stay under the scene's own lamps
      // portal colours are pale creams: keep the hue, deepen it until it reads as a colour on a small thing
      tint.set(color || '#9fd0ff').getHSL(hsl);
      tint.setHSL(hsl.h, hsl.s > 0.04 ? Math.min(1, hsl.s * 1.5 + 0.3) : hsl.s, Math.min(0.66, Math.max(0.42, hsl.l * 0.8)));
      U.uTint.value.copy(tint);
    };

    return {
      object,
      update(dt, time, s) {
        const prev = s.prev || TEST;
        if (!prev || !s.path || !s.camera) { mesh.visible = false; live = false; return; }
        const ent = (TEST && !s.prev) ? s.u * 100 : s.entered, rem = s.remaining;
        const drifting = ent < LIFE + 0.8;
        const gathering = !drifting && rem < GATHER;
        if (!drifting && !gathering) { mesh.visible = false; live = false; return; }
        // the drift ignores presence on purpose (it IS the arrival); the gathering fades with it when another companion takes over
        const vis = drifting ? 1 : s.presence * sstep(LIFE + 0.8, LIFE + 3.0, ent);
        if (vis < 0.004) { mesh.visible = false; return; }
        mesh.visible = true;
        if (drifting) setLook(prev.id, prev.category, prev.color);
        else setLook(s.world && s.world.id, s.world && s.world.category, s.portalColor);
        U.uMode.value = drifting ? 0 : 1; U.uT.value = Math.max(0, ent); U.uRemain.value = Math.max(0, rem); U.uVis.value = vis; U.uTime.value = time;
        // a short piece of the path ahead; it ends at the portal, so everything that runs ahead runs into it
        const D2 = Math.min(20, Math.max(1, rem)); U.uD2.value = D2;
        s.ahead(0, P0); s.ahead(D2 * 0.5, P1); s.ahead(D2, P2);
        fwd.subVectors(P2, P0);
        if (fwd.lengthSq() < 0.04) s.camera.getWorldDirection(fwd);
        fwd.normalize();
        right.crossVectors(fwd, Y); if (right.lengthSq() < 1e-4) right.set(1, 0, 0); right.normalize();
        up.crossVectors(right, fwd).normalize();
        U.uP0.value.copy(P0); U.uP1.value.copy(P1); U.uP2.value.copy(P2); U.uFwd.value.copy(fwd); U.uRight.value.copy(right); U.uUp.value.copy(up);
        // how it answers the journey. A jump in the clock (a crossing, or the screenshot harness) starts these afresh
        const jump = !live || ent < lastEnt - 1e-4 || ent > lastEnt + 0.25;
        lastEnt = ent; live = true;
        // speed: the faster the flight, the sooner the air is left behind (the clock for falling back runs at the flight's pace)
        const pace = Math.min(1.3, Math.max(0.75, Math.sqrt((s.speed || 14) / 14)));
        slip = jump ? ent * pace : slip + dt * pace;
        // turn: they swing wide in a bend, a moment late
        const tn = Math.min(0.6, Math.max(-0.6, s.turn || 0));
        turn = jump ? tn : turn + (tn - turn) * (1 - Math.exp(-dt * 3));
        // gaze: the cloud trails a turn of the head and has parallax against the world
        s.camera.getWorldPosition(U.uCam.value); s.camera.getWorldDirection(gazeNow);
        if (jump) gaze.copy(gazeNow); else gaze.lerp(gazeNow, 1 - Math.exp(-dt * 1.8)).normalize();
        U.uCamF.value.copy(gaze); U.uSlip.value = slip; U.uTurn.value = turn;
        // the light of the world it is in now
        const L = s.light;
        if (L && L.has) {
          lightC.copy(L.key).multiplyScalar(L.keyIntensity * 0.45).add(L.ambient);
          const lum = lightC.r * 0.2126 + lightC.g * 0.7152 + lightC.b * 0.0722, want = Math.min(1.15, Math.max(night, lum));
          lightC.multiplyScalar(want / Math.max(lum, 1e-3));
          U.uDay.value = sstep(0.3, 1.2, L.level);
        } else { lightC.setScalar(0.6); U.uDay.value = 0.5; }
        U.uLight.value.copy(lightC);
        ctx.renderer.getDrawingBufferSize(size); U.uPx.value = 2 / Math.max(240, size.y);
      },
    };
  },
};
