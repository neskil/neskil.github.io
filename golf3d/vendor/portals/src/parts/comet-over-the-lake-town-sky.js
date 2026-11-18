// comet-over-the-lake-town, part SKY: the real twilight, the first stars and THE COMET, each written once as a
// function of direction (and of the world's clock) in GLSL, so that the dome, the far shell and every sheet of still
// water (which asks the same functions about the MIRRORED ray) show the same sky. Nothing here reads the lens except
// to stand at the far plane round whichever camera draws it, and to filter by the pixel's footprint.
import * as THREE from 'three';

const DEG = Math.PI / 180;
export const dirOf = (az, el) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG));

// ------------------------------------------------------------------ the twilight (no cloud, no moon)
export const SKY_GLSL = /* glsl */`
uniform vec3 uSunH, uZen, uMidB, uHorB, uGreen, uGold, uOrange, uSlate, uPink;
uniform float uStarGain, uSkyTime;
vec3 twSky(vec3 d) {
  float h = d.y, hh = max(h, 0.0), e = hh*57.3;                 // e: degrees up (near enough under 40)
  vec2 f = d.xz/max(length(d.xz), 1e-4);
  float ca = dot(f, uSunH.xz);
  float w = smoothstep(-0.35, 1.0, ca); w *= w;                  // toward the set sun
  float anti = 1.0 - smoothstep(-0.8, 0.15, ca);                       // away from it: the earth's own shadow rising
  vec3 c = mix(uMidB, uZen, 1.0 - exp(-hh*2.6));
  c = mix(c, uHorB, exp(-e/7.0)*0.8);
  float es = max(e - 6.5*w, 0.0);                                // the glow stands over the crater's rim, not under it
  c = mix(c, uGreen, exp(-es/19.0)*w*0.9);                       // green-blue over the gold
  c = mix(c, uGold, exp(-es/8.5)*w*0.97);                        // pale gold over the orange
  c = mix(c, uOrange, exp(-es/3.6)*w*w);                         // orange on the horizon itself
  float pe = (e - 8.0)/4.5;
  c = mix(c, uPink, exp(-pe*pe)*anti*0.62);                      // the pink band
  c = mix(c, uSlate, exp(-e/3.4)*anti*0.9);                      // over the slate-blue shadow band
  return c*mix(1.0, 0.6, 1.0 - smoothstep(-0.25, 0.0, h));
}
float twH13(vec3 p) { p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
// the first stars: px is the pixel's footprint in radians, so a star is never thinner than a pixel and never shimmers
float twStars(vec3 d, float px) {
  vec3 p = d*64.0, id = floor(p);
  float hs = twH13(id);
  vec3 j = vec3(twH13(id + 7.1), twH13(id + 13.7), twH13(id + 29.3)) - 0.5;
  vec3 v = p - (id + 0.5 + j*0.55);
  float r = max(0.085, px*64.0*1.25), k = 0.085/r;
  float on = step(0.9, hs), mag = (hs - 0.9)*10.0; mag = 0.25 + 0.75*mag*mag;
  float tw = 0.82 + 0.18*sin(uSkyTime*(0.9 + hs*2.0) + hs*90.0);
  float high = smoothstep(0.16, 0.62, d.y);
  return on*mag*tw*high*k*k*exp(-dot(v, v)/(r*r));
}`;

// ------------------------------------------------------------------ the comet: a train of star-points under one broad dust fan, a hair of gas, slow meteors
// q is the direction in degrees on the plane that touches the sky at the middle of the train: x to the right, y up.
export const COMET_GLSL = /* glsl */`
uniform vec3 uC0, uCR, uCU;
uniform vec4 uPiece[15];            // xy: place (degrees), z: brightness, w: a phase of its own
uniform vec4 uBead[3];              // xy: where it comes away, z: period, w: offset
uniform vec4 uMet[20];               // x: seconds it takes (also its period), y: offset, z: a number of its own
uniform vec2 uMetFrom[3];           // the lowest pieces, where the falling bits come away
uniform vec2 uTrainDir;             // along the train, toward its low end
uniform float uTime, uPieceN, uCometGain, uMetGain, uKink, uMetFloor, uMetCurve, uApart, uStorm, uMetN;
const vec2 AG = vec2(0.581, 0.814);  // the tails' way: up and to the right, away from the set sun
const vec2 AP = vec2(0.814, -0.581);
const vec2 AD = vec2(0.731, 0.682);  // each piece's own tail leans a little toward the dust fan
float cmH(float n) { n = fract(n*0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float cmN(float x) { float i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f); return mix(cmH(i), cmH(i + 1.0), f); }
float cmSq(float x) { return x*x; }
vec3 cmTails(vec2 q, float px) {
  float s = dot(q, AG), t = dot(q, AP);
  // the gas: ONE thin straight thread of pale blue, the lesser of the two tails; it runs straight away from the set sun and stands a little apart
  // from the dust fan (which leans away from it), with a faint slow ripple travelling down it
  float sk = mod(uTime*0.45 + uKink, 38.0) - 4.0, ks = s - sk;
  float tg = t - 0.12*exp(-ks*ks/6.8)*sin(ks*1.25);
  float wg = 0.035 + 0.004*max(s, 0.0) + px*0.65;
  float g = exp(-tg*tg/(wg*wg));
  float fg = smoothstep(0.6, 3.6, s)*(1.0 - smoothstep(9.0, 30.0, s))*(0.7 + 0.3*cmN(s*0.8 - uTime*0.22));
  vec3 c = vec3(0.27, 0.53, 1.0)*g*fg*0.6;                             // a pale blue, plainly bluer than the cream fan at every size
  // the dust: a broad soft banded fan that rises from the WHOLE length of the train. It has no point of its own:
  // its lines run back to a place far behind the train, and it begins along the train's own line.
  vec2 nn = vec2(uTrainDir.y, -uTrainDir.x), AQ = vec2(AD.y, -AD.x);
  float e = dot(q, nn)/max(dot(AD, nn), 0.2);                        // how far along the dust's way, past the train's line
  float ep = max(e, 0.0);
  vec2 va = q + AD*11.0; float ra = length(va) + 1e-3;
  float ph = atan(dot(va, AQ), max(dot(va, AD), 1e-3))*57.3;
  float pc = 4.5 + 0.45*ep, dw = 10.5 + 0.3*ep, a = (ph - pc)/dw;       // (the fan's middle line leans away from the gas thread, so the thread stands clear of its edge)
  float prof = max(1.0 - a*a, 0.0); prof *= prof*(0.72 + 0.55*(1.0 - smoothstep(-0.85, 0.25, a)));
  float rad = smoothstep(0.1, 3.4, e)*(1.0 - smoothstep(3.0, 26.0, ep))*(0.42 + 0.58/(1.0 + ep*0.12));
  float u = ph*0.5 - ra*0.85, fu = px*(0.5*57.3/ra + 0.85);         // the bands' line, and a pixel's reach across them
  float st = 0.5*cmN(u*1.6) + 0.32*cmN(u*3.9 + 7.0)*(1.0 - smoothstep(0.2, 0.6, fu*3.9)) + 0.18*cmN(u*8.7 + 3.0)*(1.0 - smoothstep(0.2, 0.6, fu*8.7));
  float fs = px*57.3/ra;                                             // a pixel's reach across the fine streaks
  float streak = mix(0.56 + 0.88*cmN(ph*0.9 + 11.0), 1.0, smoothstep(0.3, 0.8, fs*0.9));
  float striae = mix(1.0, 0.5 + 1.05*st, smoothstep(1.0, 8.0, ep))*streak;
  c += vec3(1.0, 0.83, 0.55)*prof*rad*striae*0.98;
  return c;
}
vec3 cmTrain(vec2 q, float px) {
  vec2 hv = vec2(dot(q, uTrainDir)/(5.2 + 4.2*uApart), dot(q, vec2(uTrainDir.y, -uTrainDir.x))/(1.7 + 1.3*uApart)); float hd = dot(hv, hv);
  vec3 c = vec3(0.72, 0.85, 1.0)*(0.15*exp(-hd) + 0.05*exp(-hd*0.22));   // the head's own soft glow, round the whole train
  for (int i = 0; i < 15; i++) {
    vec4 P = uPiece[i];
    float b = P.z*step(float(i) + 0.5, uPieceN)*(0.7 + 0.3*sin(uTime*(0.9 + P.w*1.3) + P.w*40.0));
    vec2 v = q - (P.xy*(1.0 + 0.09*sin(uTime*0.45 + P.w*9.0) + 0.8*uApart) + vec2(uTrainDir.y, -uTrainDir.x)*(P.w - 0.5)*2.6*uApart);      // the pieces creep apart and back, breathing; by the beat they drift well apart
    float d2 = dot(v, v), s = dot(v, AD), t = dot(v, vec2(AD.y, -AD.x));
    float core = exp(-d2/(0.0009 + px*px*0.45));                     // a small hard star-point
    float glow = exp(-d2/(0.008 + 0.02*P.z + 0.07*uApart));          // a soft glow of its own, wider as the pieces part
    float w = 0.03 + 0.035*max(s, 0.0) + px*0.55;
    float tail = exp(-t*t/(w*w))*smoothstep(-0.04, 0.25, s)*exp(-max(s, 0.0)/(2.4 + 5.5*P.z));   // its own fine streak, feeding the fan
    c += b*(vec3(1.0, 0.97, 0.88)*core*(2.6 + 4.4*P.z*P.z) + vec3(0.8, 0.9, 1.0)*glow*(0.2*P.z + 0.28*uApart) + vec3(1.0, 0.93, 0.78)*tail*0.4);
  }
  for (int k = 0; k < 3; k++) {                                     // a bead comes away, flares softly, slides back, fades
    vec4 B = uBead[k];
    float a = fract((uTime + B.w)/B.z);
    vec2 v = q - (B.xy*(1.0 + 0.8*uApart) + uTrainDir*2.4*a + vec2(0.0, -0.1*a));
    float env = smoothstep(0.0, 0.1, a)*(1.0 - smoothstep(0.45, 1.0, a))*(0.5 + 0.9*exp(-cmSq((a - 0.13)/0.07)));
    c += vec3(1.0, 0.95, 0.84)*env*(1.6*exp(-dot(v, v)/(0.004 + px*px*0.8)) + 0.3*exp(-dot(v, v)/0.03));
  }
  return c;
}
vec3 cmMeteors(vec2 q, float px) {
  vec3 c = vec3(0.0);
  for (int k = 0; k < 20; k++) {
    vec4 M = uMet[k];
    float tt = (uTime + M.y)/M.x, n = floor(tt), a = (tt - n)*mix(2.3, 1.15, step(10.5, float(k)));   // the first eleven are out for under half their round (three to six at once); the nine the shower adds stay out longer. The rate is each meteor's own, never the shower's amount, so none slows or runs back as the shower comes on
    float h1 = cmH(n*7.31 + M.z*19.7), h2 = cmH(n*3.17 + M.z*5.3 + 1.7), h3 = cmH(n*1.93 + M.z*11.1 + 4.1), h4 = cmH(n*5.71 + M.z*3.3 + 9.2);
    vec2 from = mix(mix(uMetFrom[0], uMetFrom[1], step(0.34, h1)), uMetFrom[2], step(0.67, h1)) *0.2 + vec2(13.0 - 37.0*h2, 0.3 + 10.0*h4);   // scattered over a third of the sky
    from.y += uMetFloor + uMetCurve*from.x*from.x;                               // every one begins above THE ONE FLOOR (that elevation's line in this plane bows up to the sides)
    vec2 dir = from/max(length(from), 1.0), nd = vec2(dir.y, -dir.x);             // away from the radiant, the broken head: rising all its way, never down toward the rim
    float big = h3*h3;
    vec2 v = q - (from + dir*(4.0 + 11.0*big)*(0.8*a + 0.2*a*a));
    float env = smoothstep(0.04, 0.3, a)*(1.0 - smoothstep(0.9, 1.0, a));
    float b = (env + 0.85*exp(-cmSq((a - 0.9)/0.045)))*(0.22 + 1.0*h1*h1)*step(a, 1.2)*step(float(k) + 0.5, uMetN)*(1.0 + 0.5*uStorm);   // born faint, brightens, burns out with a soft swell
    float s = -dot(v, dir), t = dot(v, nd), d2 = dot(v, v);
    float L = (1.2 + 12.0*big)*(0.35 + 0.65*env), sc = clamp(s/L, 0.0, 1.0), w = 0.11*(1.0 - sc) + 0.025 + px*0.65;
    float trail = exp(-t*t/(w*w))*smoothstep(-0.12, 0.2, s)*cmSq(1.0 - sc);
    vec2 b1 = v + dir*L*0.3 - nd*0.05, b2 = v + dir*L*0.52 + nd*0.04, b3 = v + dir*L*0.74 - nd*0.02;
    float bw = 0.016 + px*px;
    float beads = 0.7*exp(-dot(b1, b1)/bw) + 0.5*exp(-dot(b2, b2)/bw) + 0.35*exp(-dot(b3, b3)/bw);
    vec3 col = mix(vec3(1.0, 0.86, 0.58), vec3(0.78, 1.0, 0.86), step(0.5, h2));   // pale gold or green-white, never red
    c += col*b*(1.8*exp(-d2/(0.012 + px*px)) + 0.26*exp(-d2/0.07) + 1.0*trail + 0.8*env*beads*big);
  }
  return c;
}
// the whole comet for a direction d (unit); pxd: the pixel's footprint in degrees
vec3 cometAt(vec3 d, float pxd) {
  float z = dot(d, uC0);
  if (z < 0.35) return vec3(0.0);
  vec2 q = vec2(dot(d, uCR), dot(d, uCU))/z*57.2958;
  float px = clamp(pxd, 0.0, 1.5);
  vec3 c = (cmTails(q, px) + cmTrain(q, px))*uCometGain + cmMeteors(q, px)*uMetGain;
  c *= smoothstep(-37.0, -29.0, q.x)*(1.0 - smoothstep(32.0, 48.0, q.x))*(1.0 - smoothstep(38.0, 48.0, q.y));   // nothing reaches the patch's edge
  return c*smoothstep(0.03, 0.14, d.y);
}`;

// ------------------------------------------------------------------ the storm's ribbons, for every sheet of still water
// The same law as the storm's own mesh in the sky (below), asked about a direction: so a paddy, a pond or the leat holds each
// meteor that stands over it, at its mirrored place. (Goes after COMET_GLSL, whose uniforms and plane it uses.)
export const STORM_GLSL = /* glsl */`
uniform vec4 uRibA[56], uRibB[56];  // A: where it begins (degrees from the radiant), length, brightness; B: period, phase, rank, tone (+2: a slow bright one)
uniform vec2 uRibBox;               // the field's lowest height in the plane, and the square of its widest reach
vec3 cmStormAt(vec3 d, float pxd) {
  if (uStorm < 0.002) return vec3(0.0);
  float z = dot(d, uC0);
  if (z < 0.2) return vec3(0.0);
  vec2 q = vec2(dot(d, uCR), dot(d, uCU))/z*57.2958;
  if (q.y < uRibBox.x || dot(q, q) > uRibBox.y) return vec3(0.0);
  float px = clamp(pxd, 0.0, 1.5);
  vec3 c = vec3(0.0);
  for (int k = 0; k < 56; k++) {
    vec4 A = uRibA[k], B = uRibB[k];
    float a = fract((uTime + B.y)/B.x)*1.25, slow = step(1.5, B.w);
    vec2 dir = A.xy/max(length(A.xy), 1.0);
    float run = (4.0 + 1.6*A.z)*(1.0 - 0.4*slow)*(0.8*a + 0.2*a*a);
    vec2 v = q - (A.xy + dir*run);
    float dx = -dot(v, dir), t = dot(v, vec2(dir.y, -dir.x));                       // degrees behind the head, and off its line
    float env = smoothstep(0.03, 0.25, a)*(1.0 - smoothstep(0.86, 1.0, a));
    float L = A.z*(0.35 + 0.65*env), w = 0.07 + 0.08*A.w, wv = w + px*0.7, tv = t/wv;
    float ac = max(1.0 - tv*tv, 0.0); ac *= ac*w/wv;                                // a pixel wider than the ribbon holds it thinner, never brighter
    float tail = clamp(1.0 - dx/max(L, 0.05), 0.0, 1.0)*step(0.0, dx); tail *= tail;
    float headG = exp(-dx*dx/(0.02 + px*px));
    float tw = 0.3*w + px*0.7, train = slow*0.3*step(0.0, dx)*clamp(1.0 - dx/max(run, 0.3), 0.0, 1.0)*max(1.0 - abs(t)/tw, 0.0)*(0.3*w/tw);
    vec3 col = mix(vec3(1.0, 0.86, 0.58), vec3(0.78, 1.0, 0.86), step(0.5, B.w - 2.0*slow));
    c += col*(env*smoothstep(B.z*0.95, B.z*0.95 + 0.05, uStorm)*A.w)*(ac*(0.9*tail + 1.8*headG) + train);
  }
  return c*uMetGain*smoothstep(0.03, 0.14, d.y);
}`;

// ------------------------------------------------------------------ the two looks (always dusk)
const LOOKS = {
  early: { zen: '#10265c', midB: '#33588f', horB: '#6382ac', green: '#86b8a8', gold: '#f2ca8a', orange: '#f28c42', slate: '#40507a', pink: '#cc8e98',
    stars: 0.55, comet: 0.92, met: 1.5, lamps: 1.1 },
  deep: { zen: '#060f2e', midB: '#16326c', horB: '#2c4a80', green: '#46868e', gold: '#cfa066', orange: '#d86a2e', slate: '#243154', pink: '#86607a',
    stars: 1.25, comet: 1.3, met: 1.75, lamps: 1.1 },
};
export const SUN_AZ = -18, SUN_EL = -9, TRAIN_AZ = 2, TRAIN_EL = 19;

// the comet's make-up, dealt once from a stream of its own
function dealComet(rng, dn) {
  const N = Math.round(9 + 6 * dn), sl = 11 * DEG, td = [-Math.cos(sl), -Math.sin(sl)], nn = [td[1], -td[0]];
  const pieces = [], K = N > 11 ? 5 : 3, fr = K === 5 ? [0.1, 0.27, 0.5, 0.66, 0.9] : [0.2, 0.47, 0.83], brightAt = new Set();
  for (let k = 0; k < K; k++) brightAt.add(Math.round((fr[k] + rng.range(-0.03, 0.03)) * (N - 1)));   // the bright pieces are dealt by count: three or five, set unevenly along the train
  for (let i = 0; i < N; i++) {
    const jit = rng.range(-0.34, 0.34), tau = -1 + (2 * (i + 0.5 + jit)) / N, r1 = rng(), r2 = rng(), r3 = rng();
    const mid = 1 - Math.pow(Math.min(1, Math.abs(tau)), 0.7);
    const b = brightAt.has(i) ? 0.84 + 0.16 * r1 : 0.17 + 0.26 * mid * (0.6 + 0.6 * r1);   // three or five, plainly brighter than the rest
    const bow = 0.1 * (tau * tau - 0.33) + (r2 - 0.5) * 0.03;      // beads on one line
    pieces.push({ x: td[0] * 4.0 * tau + nn[0] * bow, y: td[1] * 4.0 * tau + nn[1] * bow, b, ph: r3, tau });
  }
  const low = pieces.slice().sort((a, b) => a.y - b.y).slice(0, 3);
  const bright = pieces.slice().sort((a, b) => b.b - a.b).slice(0, 3);
  const beads = bright.map((p) => new THREE.Vector4(p.x, p.y, rng.range(17, 26), rng.range(0, 30)));
  const mets = [];
  for (let k = 0; k < 20; k++) { const per = rng.range(11, 19); mets.push(new THREE.Vector4(per, rng() * per, rng(), 0)); }   // each meteor's round, and where in its own round it begins
  const arr = []; for (let i = 0; i < 15; i++) { const p = pieces[i]; arr.push(p ? new THREE.Vector4(p.x, p.y, p.b, p.ph) : new THREE.Vector4(0, 0, 0, 0)); }
  const kink = rng.range(0, 38);                                 // the gas thread's kink starts at a dealt place
  return { N, kink, pieces: arr, beads, mets, from: low.map((p) => new THREE.Vector2(p.x, p.y)), trainDir: new THREE.Vector2(td[0], td[1]) };
}

export function makeTwilight(rng, opts = {}) {
  const look = LOOKS[opts.deep ? 'deep' : 'early'], C = (h) => new THREE.Color(h);
  const sunH = new THREE.Vector3(Math.sin(SUN_AZ * DEG), 0, -Math.cos(SUN_AZ * DEG));
  const c0 = dirOf(TRAIN_AZ, TRAIN_EL), cr = new THREE.Vector3(Math.cos(TRAIN_AZ * DEG), 0, Math.sin(TRAIN_AZ * DEG));
  const cu = new THREE.Vector3(0, 1, 0).addScaledVector(c0, -c0.y).normalize();
  const deal = dealComet(rng, opts.dn ?? 0.5);
  const U = {
    uSunH: { value: sunH }, uZen: { value: C(look.zen) }, uMidB: { value: C(look.midB) }, uHorB: { value: C(look.horB) }, uGreen: { value: C(look.green) },
    uGold: { value: C(look.gold) }, uOrange: { value: C(look.orange) }, uSlate: { value: C(look.slate) }, uPink: { value: C(look.pink) },
    uStarGain: { value: look.stars }, uSkyTime: { value: 0 },
    uC0: { value: c0 }, uCR: { value: cr }, uCU: { value: cu }, uPiece: { value: deal.pieces }, uBead: { value: deal.beads }, uMet: { value: deal.mets },
    uMetFrom: { value: deal.from }, uTrainDir: { value: deal.trainDir }, uTime: { value: 0 }, uPieceN: { value: deal.N },
    uCometGain: { value: look.comet }, uMetGain: { value: look.met }, uKink: { value: deal.kink }, uMetFloor: { value: 14 }, uMetCurve: { value: 0 }, uApart: { value: 0 }, uStorm: { value: 0 }, uMetN: { value: 11 },
    uRibA: { value: Array.from({ length: 56 }, () => new THREE.Vector4()) }, uRibB: { value: Array.from({ length: 56 }, () => new THREE.Vector4(10, 0, 2, 0)) }, uRibBox: { value: new THREE.Vector2(0, 1) },
  };
  const FAR_VERT = /* glsl */`
    varying vec3 vDir;
    void main() { vDir = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
  // the dome: twilight and stars, drawn at the far plane after the land (so hidden sky costs nothing)
  const dome = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({
    name: 'LakeTownSky', uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: FAR_VERT,
    fragmentShader: /* glsl */`
      precision highp float; varying vec3 vDir;
      ${SKY_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float px = length(fwidth(d));
        vec3 c = twSky(d) + vec3(0.86, 0.92, 1.0)*twStars(d, px)*uStarGain;
        c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)))*43758.5453) - 0.5)*0.004;   // no banding in the long gradient
        gl_FragColor = vec4(max(c, 0.0), 1.0);
      }` }));
  dome.frustumCulled = false; dome.renderOrder = 50; dome.name = 'twilight';
  // the comet's shell: one patch of the far sky, additive, depth-tested so the land hides it
  const g = new THREE.BufferGeometry(), P = [];
  const AZ = [-36, 84], EL = [3, 66], NA = 9, NE = 6, idx = [];
  for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const d = dirOf(AZ[0] + (AZ[1] - AZ[0]) * i / NA, EL[0] + (EL[1] - EL[0]) * j / NE); P.push(d.x, d.y, d.z); }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(idx);
  const comet = new THREE.Mesh(g, new THREE.ShaderMaterial({
    name: 'LakeTownComet', uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexShader: FAR_VERT,
    fragmentShader: /* glsl */`
      precision highp float; varying vec3 vDir;
      ${COMET_GLSL}
      void main() { vec3 d = normalize(vDir); gl_FragColor = vec4(cometAt(d, length(fwidth(d))*57.2958), 1.0); }` }));
  comet.frustumCulled = false; comet.renderOrder = 60; comet.name = 'comet';
  // THE STORM (the comet comes apart): a shower from ONE RADIANT, the comet's broken head (the middle of the train, q = 0). Each ribbon lies on a ray of
  // its own from the radiant (at an angle dealt within 80 degrees either hand of straight up) and runs out along it, so every one rises and the whole fans up and out
  // from beside the train; it begins where the whole of it, tail and all, stands above THE SHOWER'S FLOOR (an elevation the world gives once, from the ground: see
  // setFloor) and no nearer the train's middle than 1.2 degrees, or a dealt way farther out (8 degrees at most). Lengths 2 to 14 degrees, brightness four to one; five are
  // slow and bright and leave a thin train that fades back to where they began. How many are out is uStorm, which the world drives by metres flown.
  const sr = rng.fork('storm'), NS = 56, sP = [], sA = new Float32Array(NS * 16), sB = [], sI = [], ribs = [];
  for (let k = 0; k < NS; k++) {
    const slow = k % 11 === 5, th = sr.range(-62, 62) * DEG, off = sr(), l0 = sr(), b0 = sr(), per = slow ? sr.range(17, 24) : sr.range(9, 20), ph = sr() * per, tone = sr();
    const len = slow ? 9 + 5 * l0 : 2 + 12 * Math.pow(l0, 2.2), kind = (tone < 0.5 ? 0 : 1) + (slow ? 2 : 0);
    ribs.push({ th, off: 8 * off * off, len, bright: slow ? 1 : 1 / (1 + 3 * b0), slow });   // (off: how far past its first clear place it begins: within 8 degrees, so the rays start beside the train)
    for (const c of [[0, -1], [1, -1], [1, 1], [0, 1]]) { sP.push(c[0], c[1], 0); sB.push(per, ph, (k + 0.5) / NS, kind); }
    sI.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
    U.uRibB.value[k].set(per, ph, (k + 0.5) / NS, kind);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3)); sg.setAttribute('aA', new THREE.BufferAttribute(sA, 4)); sg.setAttribute('aB', new THREE.Float32BufferAttribute(sB, 4)); sg.setIndex(sI);
  const storm = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    name: 'LakeTownStorm', uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      attribute vec4 aA, aB;                 // aA: where it begins (degrees from the radiant), its length, its brightness; aB: period, phase, rank, tone (and 2 more for a slow bright one)
      uniform vec3 uC0, uCR, uCU; uniform float uTime, uStorm;
      varying vec2 vUv; varying vec4 vM; varying vec3 vT;
      void main() {
        float a = fract((uTime + aB.y)/aB.x)*1.25, slow = step(1.5, aB.w);               // out for four fifths of its round
        vec2 dir = aA.xy/max(length(aA.xy), 1.0), nd = vec2(dir.y, -dir.x);               // away from the radiant
        float run = (4.0 + 1.6*aA.z)*(1.0 - 0.4*slow)*(0.8*a + 0.2*a*a);
        vec2 head = aA.xy + dir*run;
        float env = smoothstep(0.03, 0.25, a)*(1.0 - smoothstep(0.86, 1.0, a));
        float L = aA.z*(0.35 + 0.65*env) + 0.35, w = 0.07 + 0.08*aA.w;
        float Lq = mix(L, max(L, run + 0.35), slow);                                      // a slow one's ribbon reaches back to where it began, for its thin train
        vec2 q = head + dir*(0.35 - Lq*position.x) + nd*w*position.y;
        float vis = env*smoothstep(aB.z*0.95, aB.z*0.95 + 0.05, uStorm)*aA.w;
        vUv = position.xy; vM = vec4(vis, aB.w - 2.0*slow, 0.35/Lq, Lq); vT = vec3(L - 0.35, slow, run);
        vec3 d = uC0 + (uCR*q.x + uCU*q.y)/57.2958;
        vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*d, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4;
        gl_Position = vis > 0.001 ? p.xyww : vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      precision highp float; uniform float uMetGain; varying vec2 vUv; varying vec4 vM; varying vec3 vT;
      void main() {
        float ac = 1.0 - vUv.y*vUv.y; ac *= ac;
        float dx = (vUv.x - vM.z)*vM.w;                                                   // degrees behind the head
        float tail = clamp(1.0 - dx/max(vT.x, 0.05), 0.0, 1.0)*step(0.0, dx); tail *= tail;
        float headG = exp(-dx*dx/0.02);
        float train = vT.y*0.3*step(0.0, dx)*clamp(1.0 - dx/max(vT.z, 0.3), 0.0, 1.0)*(1.0 - smoothstep(0.1, 0.45, abs(vUv.y)));   // the thin train of a slow bright one
        vec3 col = mix(vec3(1.0, 0.86, 0.58), vec3(0.78, 1.0, 0.86), step(0.5, vM.y));   // pale gold or green-white, never red
        gl_FragColor = vec4(col*vM.x*(ac*(0.9*tail + 1.8*headG) + train)*uMetGain, 1.0);
      }` }));
  storm.frustumCulled = false; storm.renderOrder = 61; storm.name = 'meteor storm';
  // THE TWO FLOORS, each an elevation in the sky (degrees), the same from every place; the world gives them once, from the ground. F: the calm loop meteors'
  // floor (its line in the comet's plane bows up to the sides). FS: the shower's floor; each ribbon of the storm is set on its ray above it.
  const s0 = Math.sin(TRAIN_EL * DEG), k0 = Math.cos(TRAIN_EL * DEG);
  const elOf = (qx, qy) => { const x = qx * DEG, y = qy * DEG; return Math.asin((s0 + k0 * y) / Math.sqrt(1 + x * x + y * y)) / DEG; };   // the true elevation of a place of the comet's plane
  const toQ = (az, el) => { const a = az * DEG, e = el * DEG, dx = Math.sin(a) * Math.cos(e), dy = Math.sin(e), dz = Math.cos(a) * Math.cos(e), dot = dy * s0 + dz * k0; return [dx / dot / DEG, (dy * k0 - dz * s0) / dot / DEG]; };   // a bearing off the comet's and an elevation, as a place of the comet's plane
  const azOf = (qx, qy) => Math.atan2(qx * DEG, k0 - s0 * qy * DEG) / DEG;   // the bearing, off the comet's, of a place of the comet's plane
  const envAt = (a) => { const t1 = Math.min(1, Math.max(0, (a - 0.03) / 0.22)), t2 = Math.min(1, Math.max(0, (a - 0.86) / 0.14)); return t1 * t1 * (3 - 2 * t1) * (1 - t2 * t2 * (3 - 2 * t2)); };
  const setFloor = (F, FS = F, FW = 41) => {
    const yAt = (x) => { let lo = -40, hi = 85; for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (elOf(x, m) < F) lo = m; else hi = m; } return hi; };
    const inAt = (vx, vy) => { for (let t = 1.2; t < 60; t += 0.25) if (elOf(vx * t, vy * t) >= FS + 0.3) return t; return -1; };   // where a ray from the radiant first stands above the shower's floor
    const y0 = yAt(0); let curve = 0; for (let x = 4; x <= 48; x += 2) curve = Math.max(curve, (yAt(x) - y0) / (x * x));
    U.uMetFloor.value = y0; U.uMetCurve.value = curve;
    let low = 1e9, wide = 0;
    ribs.forEach((r, k) => {
      const run = (4 + 1.6 * r.len) * (r.slow ? 0.6 : 1); let back = 0, kS = -1, ux = 0, uy = 1;
      for (let a = 0.03; a <= 1; a += 0.02) back = Math.max(back, r.len * (0.35 + 0.65 * envAt(a)) + 0.35 - run * (0.8 * a + 0.2 * a * a));   // how far its tail ever reaches behind where it began
      // its ray leaves the radiant at its own dealt angle off straight up (within 80 degrees either hand); it begins where its whole tail has cleared the shower's
      // floor, or a dealt way farther out; it must rise all its way and end inside the shower's field (FW degrees either hand of the comet's bearing), or its angle is drawn in a fifth
      for (let t = 0, ph = (r.th / (62 * DEG)) * 80 * DEG; t < 14 && kS < 0; t++, ph *= 0.8) {
        const vx = Math.sin(ph), vy = Math.cos(ph), tin = inAt(vx, vy), st = tin + back + r.off, en = st + run;
        if (tin > 0 && elOf(vx * en, vy * en) >= FS + 0.3 && en * DEG <= (k0 * vy) / s0 && Math.abs(azOf(vx * en, vy * en)) <= FW) { kS = st; ux = vx; uy = vy; }
      }
      if (kS < 0) { ux = 0; uy = 1; kS = Math.max(1.2, inAt(0, 1)) + back + r.off; }     // (straight up from the radiant always clears)
      for (let v = 0; v < 4; v++) sA.set([ux * kS, uy * kS, r.len, r.bright], (k * 4 + v) * 4);
      U.uRibA.value[k].set(ux * kS, uy * kS, r.len, r.bright);
      low = Math.min(low, uy * (kS - back)); wide = Math.max(wide, kS + run + 1);
    });
    U.uRibBox.value.set(low - 1.5, (wide + 2) * (wide + 2)); sg.attributes.aA.needsUpdate = true;
  };
  setFloor(30);
  // a copy of the twilight on the CPU, for the fog and the lights
  const lin = (k) => U[k].value, tmp = new THREE.Color();
  const colorAt = (d, out = new THREE.Color()) => {
    const h = d.y, hh = Math.max(h, 0), e = hh * 57.3, l = Math.hypot(d.x, d.z) || 1e-4, ca = (d.x * sunH.x + d.z * sunH.z) / l;
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    let w = ss(-0.35, 1, ca); w *= w; const anti = ss(0.15, -0.8, ca), pe = (e - 8) / 4.5, es = Math.max(e - 6.5 * w, 0);
    out.copy(lin('uMidB')).lerp(lin('uZen'), 1 - Math.exp(-hh * 2.6)).lerp(lin('uHorB'), Math.exp(-e / 7) * 0.8).lerp(lin('uGreen'), Math.exp(-es / 19) * w * 0.9)
      .lerp(lin('uGold'), Math.exp(-es / 8.5) * w * 0.97).lerp(lin('uOrange'), Math.exp(-es / 3.6) * w * w).lerp(lin('uPink'), Math.exp(-pe * pe) * anti * 0.62)
      .lerp(lin('uSlate'), Math.exp(-e / 3.4) * anti * 0.9);
    return out.multiplyScalar(1 - 0.4 * ss(0, -0.25, h));
  };
  return { U, dome, comet, storm, look, deal, colorAt, sunH, c0, tmp, setFloor, update(time) { U.uTime.value = time; U.uSkyTime.value = time; },
    beat(apart, stormAmt) { U.uApart.value = apart; U.uStorm.value = stormAmt; U.uMetN.value = 11 + 9 * stormAmt; } };   // the journey's one turn, driven by the world from metres flown
}
