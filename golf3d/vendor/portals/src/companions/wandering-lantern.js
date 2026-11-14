// The Wandering Lantern: one vermilion paper sky-lantern that drifts a few metres ahead and a little
// above the eye line, bobbing on thermals with its paper tails streaming behind. Its flame shows as
// a hot spot through the paper, three moths circle it, embers trail back toward the viewer. In the
// middle of each world it rises, pirouettes and crosses over the top of the view to the other side
// and back; over the last 60 m it gathers itself onto the path and slips through the portal first,
// flaring in the portal's colour; on the far side it drops back in from above, swinging, in a burst
// of sparks. Underwater the same mesh becomes a pulsing glowing jellyfish with a shoal of three fry.
// No lights: emissive paper, an additive halo and sparks. Two draw calls, about 1,500 triangles.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

const NA = 32, NV = 14, RIBBONS = 8, SEG = 14, MOTHS = 3, SPARKS = 30;

// ---------- one merged mesh: paper body (shaped in the shader), frame, flame, tails, moths ----------
// aPart: 0 paper body, 1 bamboo frame, 2 flame, 3 tails / tentacles, 4 moths / fry
function buildGeometry() {
  const pos = [], nor = [], uv = [], part = [], rib = [], idx = [];
  let n = 0;
  const vert = (p, nn, u, v, pt, r0 = 0, r1 = 0, r2 = 0, r3 = 0) => {
    pos.push(p[0], p[1], p[2]); nor.push(nn[0], nn[1], nn[2]); uv.push(u, v); part.push(pt); rib.push(r0, r1, r2, r3);
    return n++;
  };
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);

  // paper body: a grid the vertex shader wraps into the lantern (or the jelly's bell)
  const b0 = n;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) vert([0, 0, 0], [0, 1, 0], i / NA, j / NV, 0);
  for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) {
    const a = b0 + j * (NA + 1) + i;
    quad(a, a + 1, a + NA + 2, a + NA + 1);
  }

  // a lathe around the y axis from a profile [[r, y], ...]
  const lathe = (prof, seg, pt, capLow) => {
    const s0 = n;
    for (let j = 0; j < prof.length; j++) {
      const [r, y] = prof[j], pj = prof[Math.max(0, j - 1)], nj = prof[Math.min(prof.length - 1, j + 1)];
      let ny = -(nj[0] - pj[0]), nr = nj[1] - pj[1]; const l = Math.hypot(ny, nr) || 1; ny /= l; nr /= l;
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * TAU, c = Math.cos(a), s = Math.sin(a);
        vert([c * r, y, s * r], [c * nr, ny, s * nr], i / seg, j / (prof.length - 1), pt, j / (prof.length - 1));
      }
    }
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) {
      const a = s0 + j * (seg + 1) + i; quad(a, a + 1, a + seg + 2, a + seg + 1);
    }
    if (capLow) {
      const c = vert([0, prof[0][1], 0], [0, -1, 0], 0.5, 0, pt);
      for (let i = 0; i < seg; i++) idx.push(c, s0 + i, s0 + i + 1);
    }
  };
  // the bamboo hoop at the mouth (a torus as a lathe of a small circle)
  const hoop = [];
  for (let k = 0; k <= 5; k++) { const a = (k / 5) * TAU; hoop.push([0.15 + Math.cos(a) * 0.013, -0.30 + Math.sin(a) * 0.013]); }
  lathe(hoop, 20, 1, false);
  // burner cup, and the knot at the crown
  lathe([[0.012, -0.315], [0.04, -0.305], [0.044, -0.272], [0.03, -0.268]], 8, 1, true);
  lathe([[0.05, 0.332], [0.034, 0.35], [0.014, 0.372], [0.0, 0.376]], 8, 1, false);
  // two crossed wires holding the burner
  const box = (x0, x1, y0, y1, z0, z1) => {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    const f = [[0, 3, 2, 1, 0, 0, -1], [4, 5, 6, 7, 0, 0, 1], [0, 1, 5, 4, 0, -1, 0], [3, 7, 6, 2, 0, 1, 0], [0, 4, 7, 3, -1, 0, 0], [1, 2, 6, 5, 1, 0, 0]];
    for (const q of f) { const nn = [q[4], q[5], q[6]]; quad(vert(c[q[0]], nn, 0, 0, 1), vert(c[q[1]], nn, 0, 0, 1), vert(c[q[2]], nn, 0, 0, 1), vert(c[q[3]], nn, 0, 0, 1)); }
  };
  box(-0.15, 0.15, -0.304, -0.296, -0.004, 0.004);
  box(-0.004, 0.004, -0.304, -0.296, -0.15, 0.15);

  // the flame: a teardrop over the burner (the jelly's glowing heart)
  const fl = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6; fl.push([0.036 * Math.sin(Math.PI * Math.pow(t, 0.62)) + 0.001, -0.272 + 0.14 * t]); }
  lathe(fl, 8, 2, false);

  // tails: strips the vertex shader hangs from the hoop and lets stream in the wind
  for (let r = 0; r < RIBBONS; r++) {
    const s0 = n;
    for (let k = 0; k <= SEG; k++) { const s = k / SEG; vert([0, 0, 0], [0, 1, 0], 0, s, 3, r, s, -1); vert([0, 0, 0], [0, 1, 0], 1, s, 3, r, s, 1); }
    for (let k = 0; k < SEG; k++) { const a = s0 + k * 2; quad(a, a + 1, a + 3, a + 2); }
  }

  // moths: two triangular wings sharing the body line
  for (let m = 0; m < MOTHS; m++) {
    const f = vert([0, 0, -0.7], [0, 1, 0], 0.5, 0, 4, m, 0), b = vert([0, 0, 0.6], [0, 1, 0], 0.5, 1, 4, m, 0);
    const l = vert([-1, 0, 0.25], [0, 1, 0], 0, 0.5, 4, m, 1), r = vert([1, 0, 0.25], [0, 1, 0], 1, 0.5, 4, m, 1);
    idx.push(f, b, l, f, r, b);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 4));
  g.setIndex(idx);
  return g;
}

const FOG_PARS = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
  float fogAmount(float d){
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity * fogDensity * d * d);
    #else
      return smoothstep(fogNear, fogFar, d);
    #endif
  }
#endif`;

// ---------- the lantern ----------
const VERT = /* glsl */`
attribute vec2 aUV; attribute float aPart; attribute vec4 aRib;
uniform float uTime, uForm, uScale, uFlick;
uniform vec3 uWind;
varying vec3 vW, vN; varying vec2 vUV; varying float vPart, vDepth, vAux, vId;
const float TAU = 6.2831853;

// the paper bag (form 0) or the jelly's bell (form 1); a = turn 0..1, v = mouth 0 .. crown 1
vec3 bodyPos(float a, float v){
  float ang = a * TAU;
  float rl = mix(0.15, 0.278, smoothstep(0., 0.62, v)) * sqrt(max(0., 1. - pow(max(0., (v - 0.5) / 0.5), 2.6)));
  rl *= 1. - 0.05 * (1. - abs(cos(ang * 4.)));                      // eight panels between bamboo ribs
  rl *= 1. + 0.014 * sin(uTime * 1.7 + v * 4. + ang * 2.);            // the paper breathes
  float yl = -0.30 + 0.64 * v;
  float c = 0.5 + 0.5 * sin(uTime * 2.2 - v * 1.8); c *= c;           // the bell's pulse
  float h = v * 1.5707;
  float rj = 0.31 * pow(max(cos(h), 0.), 0.72);
  rj *= 1. - 0.24 * c * (1. - v);
  rj *= 1. + 0.06 * cos(ang * 8.) * (1. - v) * (1. - v);
  rj *= 1. - 0.22 * c * (1. - smoothstep(0., 0.22, v));
  float yj = -0.07 + 0.27 * sin(h) * (1. + 0.2 * c);
  float r = mix(rl, rj, uForm);
  return vec3(cos(ang) * r, mix(yl, yj, uForm), sin(ang) * r);
}

void main(){
  vec3 P = position, N = normal; vec3 W; bool world = false;
  vAux = aRib.y; vId = aRib.x;
  if (aPart < 0.5) {
    float e = 0.008;
    P = bodyPos(aUV.x, aUV.y);
    vec3 du = bodyPos(aUV.x + e, aUV.y) - bodyPos(aUV.x - e, aUV.y);
    vec3 dv = bodyPos(aUV.x, min(aUV.y + e, 1.)) - bodyPos(aUV.x, max(aUV.y - e, 0.));
    N = cross(dv, du);
    N = dot(N, N) > 1e-12 ? normalize(N) : vec3(0., 1., 0.);
  } else if (aPart < 1.5) {
    P = mix(P, vec3(0., 0.06, 0.), uForm);                             // the frame folds away underwater
  } else if (aPart < 2.5) {
    float t = aRib.x;
    vec3 q = P - vec3(0., -0.272, 0.);
    q.y *= uFlick * (1. + 0.22 * sin(uTime * 17. + 1.3)) ;
    q.xz += vec2(sin(uTime * 13. + t * 5.), cos(uTime * 11. + t * 4.)) * 0.012 * t * t;
    vec3 heart = vec3(q.x * 2.6, (q.y - 0.07) * 1.5 * (1. + 0.15 * sin(uTime * 2.2)) + 0.07, q.z * 2.6);
    P = mix(q + vec3(0., -0.272, 0.), heart, uForm);
    vAux = t;
  } else if (aPart < 3.5) {
    float i = aRib.x, s = aRib.y, side = aRib.z;
    float odd = mod(i, 2.), jit = fract(i * 0.618);
    // paper: one long streamer, three shorter tails of different lengths, four tassels between them
    float Ll = i < 0.5 ? 1.3 : (i < 2.5 ? (odd > 0.5 ? 0.2 : 0.5) : (i < 4.5 ? (odd > 0.5 ? 0.26 : 0.82) : (odd > 0.5 ? 0.17 : (i < 6.5 ? 0.34 : 0.22))));
    Ll *= 0.92 + 0.16 * jit;
    float wl = (odd > 0.5 ? 0.017 : (Ll > 0.7 ? 0.024 : 0.03)) * (1. - 0.35 * s);
    // jelly: four long tentacles (even) and four frilled oral arms (odd)
    float Lj = odd > 0.5 ? 0.4 + 0.12 * jit : 0.85 + 0.5 * jit;
    float wj = odd > 0.5 ? 0.062 * (0.35 + sin(s * 3.1416)) * (1. + 0.28 * sin(s * 17. - uTime * 3.4 + i))
                         : 0.034 * (1. - 0.5 * s);
    float L = mix(Ll, Lj, uForm) * uScale;
    float w = mix(wl, wj, uForm) * uScale;
    vec3 rootL = bodyPos(i / 8., 0.); rootL.y -= 0.01;
    rootL.xz *= mix(1., odd > 0.5 ? 0.3 : 0.86, uForm);
    vec3 root = (modelMatrix * vec4(rootL, 1.)).xyz;
    vec3 objUp = normalize(modelMatrix[1].xyz);
    vec3 radial = normalize(mat3(modelMatrix) * vec3(rootL.x, 0., rootL.z) + vec3(1e-5));
    vec3 down = normalize(mix(vec3(0., -1., 0.), -objUp, 0.3 + 0.55 * uForm));
    float ph = i * 1.7 + jit * 3.;
    vec3 dir = normalize(down + radial * mix(0.3, 0.16, uForm) * (1. - 0.6 * s) + uWind * (0.3 + 0.8 * s) * (0.8 + 0.4 * jit));
    vec3 t1 = normalize(cross(dir, vec3(0.31, 0.9, 0.23))), t2 = cross(dir, t1);
    float wv = uTime * mix(4.6, 2.4, uForm) * (0.85 + 0.3 * jit) - s * mix(6.4, 5., uForm) + ph;
    vec3 p = root + dir * L * s + (t1 * sin(wv) + t2 * cos(wv * 0.8 + 1.)) * L * s * mix(0.13, 0.11, uForm);
    vec3 bill = normalize(cross(dir, normalize(cameraPosition - p)));
    float tw = ph + s * 3.2 + sin(uTime * 1.3 + ph) * 0.9;
    vec3 fl = t1 * cos(tw) + t2 * sin(tw);
    vec3 wd = normalize(fl + bill * (1.1 + 2.5 * uForm) * (dot(bill, fl) >= 0. ? 1. : -1.));
    W = p + wd * side * w; world = true;
  } else {
    float id = aRib.x, ph = id * 2.1 + 1.3, dirn = mod(id, 2.) < 0.5 ? 1. : -1.;
    float a = dirn * uTime * (1.7 + 0.45 * id) + ph;
    float R = 0.6 + 0.1 * sin(uTime * 0.9 + ph * 2.) + 0.1 * uForm;
    vec3 c = vec3(cos(a) * R, -0.16 + 0.2 * sin(uTime * 1.3 + ph) + 0.09 * sin(a * 2.), sin(a) * R);
    vec3 fwd = dirn * vec3(-sin(a), 0., cos(a)), right = vec3(cos(a), 0., sin(a));
    float flap = sin(uTime * mix(27., 9., uForm) + ph * 3.) * mix(1.1, 0.35, uForm);
    vec3 wing = mix(right * cos(flap) * P.x + vec3(0., 1., 0.) * abs(P.x) * sin(flap),      // a moth's wings beat
                    vec3(0., 1., 0.) * P.x * 0.55 + right * P.z * flap * 0.5, uForm);       // a fry is a little upright diamond that wags
    P = c + (fwd * (-P.z) * mix(1., 1.7, uForm) + wing) * mix(0.09, 0.075, uForm);
  }
  if (!world) W = (modelMatrix * vec4(P, 1.)).xyz;
  vW = W; vN = normalize(mat3(modelMatrix) * N); vUV = aUV; vPart = aPart;
  vec4 mv = viewMatrix * vec4(W, 1.);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform vec3 uKey, uAmb, uKeyDir, uExtraFill, uFlameW;
uniform float uDark, uForm, uFlare, uTime, uFlick, uScale, uLead;
varying vec3 vW, vN; varying vec2 vUV; varying float vPart, vDepth, vAux, vId;
${FOG_PARS}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }

void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN);
  if (vPart > 2.5) N = normalize(cross(dFdx(vW), dFdy(vW)));
  float inside = 0.;
  if (dot(N, V) < 0.) { N = -N; inside = 1.; }
  float ndl = dot(N, uKeyDir);
  vec3 light = uAmb * (0.78 + 0.22 * N.y) + uKey * (max(ndl, 0.) * 0.85 + 0.12);
  float fres = pow(1. - max(dot(N, V), 0.), 2.5);
  // how close this pixel's line of sight passes to the flame: the hot spot seen through the paper
  vec3 oc = uFlameW - cameraPosition; float tt = dot(oc, -V);
  float dray = length(oc + V * tt) / max(uScale, 1e-3);
  float hot = exp(-dray * dray / 0.014);
  float gl = mix(0.3, 1., uDark) * uFlick * (1. + 0.5 * uFlare);
  float form = uForm;

  vec3 alb = vec3(0.5), emi = vec3(0.), trans = vec3(0.);
  if (vPart < 0.5) {
    float v = vUV.y;
    float rb = abs(fract(vUV.x * 8. + 0.5) - 0.5);
    float rib = 1. - smoothstep(0.02, 0.065, rb);
    float fib = 0.82 + 0.18 * vnoise(vec2(vUV.x * 90., v * 22.)) * (0.6 + 0.8 * vnoise(vec2(vUV.x * 14., v * 60.)));
    float trim = max(1. - smoothstep(0.035, 0.055, v), smoothstep(0.925, 0.945, v));
    float gilt = (1. - smoothstep(0.008, 0.02, abs(v - 0.085))) + (1. - smoothstep(0.008, 0.02, abs(v - 0.895)));
    // ---- paper lantern
    vec3 paper = mix(vec3(0.84, 0.27, 0.07), vec3(0.72, 0.07, 0.035), smoothstep(0.05, 0.85, v)) * fib;
    vec3 albL = paper * (1. - 0.72 * rib);
    albL = mix(albL, vec3(0.20, 0.045, 0.03), trim);
    albL = mix(albL, vec3(0.85, 0.6, 0.2), gilt * 0.8);
    albL *= 1. - 0.5 * uLead;                                           // against the portal: a deep vermilion shape
    vec3 glowL = mix(vec3(1.0, 0.50, 0.13) * 2.0, vec3(1.0, 0.13, 0.03) * 0.95, smoothstep(0., 0.8, v));
    glowL *= (1. - 0.82 * rib) * (1. - 0.88 * trim) * (1. - 0.5 * gilt) * fib * (1. + 0.7 * inside);
    glowL *= mix(vec3(1.), vec3(1.3, 0.5, 0.28), uLead);                 // against the portal's bloom: hotter and redder, never cream
    glowL += vec3(1.0, 0.66, 0.28) * mix(1.9, 1.2, uLead) * hot * (1. - 0.6 * rib) * (1. - 0.8 * trim);
    glowL *= 1. - 0.35 * fres;                                           // the rim turns away: a rounder, deeper edge
    vec3 transL = albL * uKey * max(-ndl, 0.) * 0.4;                    // sunlight coming through the far side
    // ---- jelly bell
    float canal = (1. - smoothstep(0.01, 0.06, rb)) * smoothstep(1., 0.55, v);
    float spots = smoothstep(0.62, 0.9, vnoise(vec2(vUV.x * 26., v * 9.)));
    vec3 albJ = vec3(0.035, 0.11, 0.2);
    vec3 glowJ = mix(vec3(0.12, 0.62, 1.0), vec3(1.0, 0.22, 0.70), 1. - smoothstep(0.05, 0.6, v));
    glowJ *= 0.13 + 1.4 * fres + 0.9 * canal + 0.4 * spots + 0.3 * inside;
    glowJ *= 0.75 + 0.45 * (0.5 + 0.5 * sin(uTime * 2.2 - v * 1.8));                // light runs up the bell with each pulse
    glowJ += vec3(1.0, 0.25, 0.7) * 1.5 * hot * hot;
    glowJ = mix(glowJ, vec3(1.0, 0.1, 0.5) * (0.34 + 0.4 * fres + 0.35 * canal + 0.7 * hot), 0.85 * uLead);
    alb = mix(albL, albJ, form); emi = mix(glowL, glowJ * 1.8, form) * gl; trans = transL * (1. - form);
  } else if (vPart < 1.5) {
    alb = vec3(0.17, 0.09, 0.05);
    emi = vec3(1.0, 0.5, 0.15) * 0.5 * gl * (1. - form);
  } else if (vPart < 2.5) {
    alb = vec3(0.);
    vec3 fl = mix(vec3(1.0, 0.86, 0.5) * 7., vec3(1.0, 0.36, 0.06) * 4., smoothstep(0.2, 1., vAux));
    emi = mix(fl, vec3(1.0, 0.3, 0.75) * 2.0, form) * uFlick * (1. + uFlare);
  } else if (vPart < 3.5) {
    float s = vAux;
    vec3 albL = mix(vec3(0.80, 0.12, 0.05), vec3(0.88, 0.62, 0.2), smoothstep(0.9, 0.93, s) * step(vId, 0.5));
    albL *= 1. - 0.4 * uLead;
    vec3 emiL = vec3(1.0, 0.30, 0.07) * (0.10 + 0.6 * (1. - s) * (1. - s)) * gl * mix(vec3(1.), vec3(1.3, 0.5, 0.3), uLead);
    float run = 0.5 + 0.5 * sin(uTime * 3. - s * 9.);
    float ed = 1. - pow(abs(vUV.x * 2. - 1.), 2.);                       // soft-edged, brightest down the middle
    float arm = step(0.5, mod(vId, 2.));
    vec3 emiJ = mix(vec3(1.0, 0.3, 0.8), vec3(0.3, 0.8, 1.0), mix(s, 0.25 * s, arm)) * (0.5 + 1.3 * run * run) * (0.2 + 1.0 * ed) * gl;
    emiJ = mix(emiJ, vec3(1.0, 0.12, 0.5) * (0.25 + 0.5 * ed) * gl, 0.8 * uLead);
    alb = mix(albL, vec3(0.05, 0.14, 0.24), form); emi = mix(emiL, emiJ, form);
    trans = albL * uKey * max(-ndl, 0.) * 0.5 * (1. - form);
  } else {
    alb = mix(vec3(0.82, 0.76, 0.6), vec3(0.6, 0.72, 0.8), form);
    emi = mix(vec3(1.0, 0.62, 0.26) * 1.6, vec3(0.3, 0.9, 1.0) * 1.3, form) * mix(0.4, 1., uDark) * uFlick;
  }
  vec3 col = alb * (light + uExtraFill) + trans + emi;
  #ifdef USE_FOG
    col = mix(col, fogColor, fogAmount(vDepth) * 0.8 * (1. - uLead));
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- halo and sparks: one instanced set of additive sprites ----------
const SPRITE_VERT = /* glsl */`
attribute vec4 aI;                       // kind (0 wide halo, 1 near glow, 2 spark), three random numbers
uniform vec3 uPos, uFlameW, uWind;
uniform float uTime, uScale, uBurst, uForm;
varying vec2 vQ; varying float vK, vA, vDepth;
void main(){
  vec3 c = uPos; float size = 3.4 * uScale, a = 1.;
  if (aI.x > 1.5) {
    float life = mix(1.5, 3.1, aI.y), ph = fract(uTime / life + aI.z), age = ph * life;
    vec3 rd = normalize(vec3(sin(aI.w * 40.), cos(aI.y * 31.) * 0.7 + 0.3, sin(aI.z * 53.)));
    vec3 o = vec3(0., mix(0.34, 0.6, uForm), 0.) * age + uWind * age * (0.45 + 0.7 * aI.w) * mix(1., 0.3, uForm)
           + rd * (0.07 + 0.26 * ph + uBurst * 1.7 * sqrt(ph))
           + vec3(sin(uTime * 2.1 + aI.y * 20.), 0., cos(uTime * 1.7 + aI.z * 20.)) * 0.09 * age;
    c = uFlameW + o * uScale;
    a = smoothstep(0., 0.07, ph) * (1. - ph) * (1. - ph) * (0.55 + 0.45 * sin(uTime * (9. + aI.y * 8.) + aI.z * 30.));
    size = mix(0.04, 0.085, aI.w) * uScale * (1. + 0.8 * uBurst) * mix(1., 1.25, uForm);
  } else if (aI.x > 0.5) { size = 1.15 * uScale; }
  vQ = position.xy * 2.; vK = aI.x; vA = a;
  vec4 mv = viewMatrix * vec4(c, 1.);
  mv.xy += position.xy * size;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const SPRITE_FRAG = /* glsl */`
uniform vec3 uHaloCol, uSparkCol;
uniform float uHalo, uSpark, uForm, uLead;
varying vec2 vQ; varying float vK, vA, vDepth;
${FOG_PARS}
void main(){
  float r = length(vQ);
  if (r > 1.) discard;
  float edge = 1. - smoothstep(0.55, 1., r);
  vec3 col;
  if (vK < 0.5) col = uHaloCol * uHalo * (exp(-r * r * 7.) * 0.55 + exp(-r * r * 26.) * 0.5) * edge;
  else if (vK < 1.5) col = uHaloCol * uHalo * 1.0 * exp(-r * r * 6.) * edge;
  else {
    float core = exp(-r * r * 6.) * edge;
    float ring = mix(0., smoothstep(0.45, 0.75, r) * (1. - smoothstep(0.75, 0.95, r)) * 0.6, uForm);   // bubbles underwater
    col = uSparkCol * uSpark * vA * (core * (1. - 0.6 * uForm) + ring);
  }
  #ifdef USE_FOG
    col *= 1. - fogAmount(vDepth) * 0.8 * (1. - uLead);
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

export default {
  id: 'wandering-lantern', name: 'The Wandering Lantern',
  async build(ctx) {
    const { rng, fill } = ctx;
    const group = new THREE.Group();
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

    const U = {
      ...fogU(), uExtraFill: fill,
      uKey: { value: new THREE.Color(1, 1, 1) }, uKeyDir: { value: new THREE.Vector3(0.4, 0.8, 0.4) }, uAmb: { value: new THREE.Color(0.4, 0.4, 0.4) },
      uDark: { value: 0 }, uForm: { value: 0 }, uFlare: { value: 0 }, uTime: { value: 0 }, uFlick: { value: 1 }, uScale: { value: 1 },
      uWind: { value: new THREE.Vector3(0, 0, 1) }, uFlameW: { value: new THREE.Vector3() }, uLead: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, fog: true });
    const mesh = new THREE.Mesh(buildGeometry(), mat);
    mesh.frustumCulled = false;
    group.add(mesh);

    const sg = new THREE.InstancedBufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    sg.setIndex([0, 1, 2, 0, 2, 3]);
    const ai = [0, 0, 0, 0, 1, 0, 0, 0];
    for (let i = 0; i < SPARKS; i++) ai.push(2, rng.range(0, 1), rng.range(0, 1), rng.range(0, 1));
    sg.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(ai), 4));
    sg.instanceCount = SPARKS + 2;
    const SU = {
      ...fogU(), uPos: { value: new THREE.Vector3() }, uFlameW: U.uFlameW, uWind: U.uWind, uTime: U.uTime, uScale: U.uScale, uForm: U.uForm, uLead: U.uLead,
      uBurst: { value: 0 }, uHalo: { value: 0.1 }, uSpark: { value: 1 },
      uHaloCol: { value: new THREE.Color(1, 0.55, 0.2) }, uSparkCol: { value: new THREE.Color(1, 0.6, 0.25) },
    };
    const smat = new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: true });
    const sprites = new THREE.Mesh(sg, smat); sprites.frustumCulled = false; sprites.renderOrder = 3;
    group.add(sprites);

    const SIZE = 1.3;
    const Y = new THREE.Vector3(0, 1, 0);
    const P = new THREE.Vector3(), P1 = new THREE.Vector3(), Tn = new THREE.Vector3(), Rt = new THREE.Vector3();
    const rel = new THREE.Vector3(), camF = new THREE.Vector3(), lat = new THREE.Vector3(), p2 = new THREE.Vector3();
    const upv = new THREE.Vector3(), Q = new THREE.Quaternion(), Qy = new THREE.Quaternion();
    const WARM_H = new THREE.Color(1.0, 0.55, 0.2), COOL_H = new THREE.Color(0.2, 0.75, 1.0), WARM_S = new THREE.Color(1.0, 0.62, 0.25), COOL_S = new THREE.Color(0.55, 0.95, 1.0), HEART_H = new THREE.Color(1.0, 0.2, 0.65);
    const portal = new THREE.Color('#9fd0ff');
    let lastPortal = '#9fd0ff';
    let worldId = null, side = 1, shrink = 1, formTarget = 0, form = -1;

    const enterWorld = (s) => {
      const w = s.world || {}, id = w.id || '';
      worldId = id;
      let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
      side = (h & 2) ? 1 : -1;
      const media = w.media || [];
      shrink = (w.category === 'interior' || w.category === 'domestic' || media.includes('interior') || media.includes('tiny')) ? 0.7 : 1;
      formTarget = (media.includes('underwater') || /kelp|sunken|undersea|abyss|reef|under-ice|deep|trench/.test(id)) ? 1 : 0;
    };

    // where the lantern is at time tm, in the frame of the path: x to the right, y up, z metres ahead.
    // Stateless, so a frozen frame and a played one agree. Returns the metres it still has to the portal.
    const place = (tm, s, out) => {
      const u = s.u, e = Math.max(s.entered, s.dist / 14);
      const g = 1 - sstep(14, 62, s.remaining), g2 = 1 - sstep(13, 26, s.remaining);
      // drifting: bobbing on thermals, a little above and to one side
      let x = side * (1.95 + 0.45 * Math.sin(tm * 0.23 + 1));
      let y = 1.0 + 0.32 * Math.sin(tm * 0.52) + 0.12 * Math.sin(tm * 1.31 + 2);
      let z = 7.6 + 0.9 * Math.sin(tm * 0.17);
      // playing (keyed to u): rise on a thermal, cross over the top of the view to the far side, and later back
      const c1 = sstep(0.36, 0.47, u), c2 = sstep(0.55, 0.66, u);
      const hump = Math.sin(Math.PI * c1) + Math.sin(Math.PI * c2);
      x *= 1 - 2 * c1 + 2 * c2;
      y += 1.9 * hump + 0.35 * (c1 - c2);
      z += 2.4 * hump + 1.4 * (c1 - c2);
      // leading: one swirl around the line of flight, then onto it and into the portal first
      const sw = tm * 1.5, sr = 2.4 * g * (1 - g);
      x = mix(x, side * mix(1.1, 0.42, g2), g) + Math.cos(sw) * sr;
      y = mix(y, mix(0.75, 0.5, g2), g) + Math.sin(sw) * sr * 0.7;
      z = mix(z, mix(9.5, 12.5, g2), g);                                   // beside the disc, then onto it and through
      // re-forming after a crossing: dropped in from above ahead, spiralling down to its station
      const sc = 1 - sstep(0, 4.5, e), sc2 = sc * sc;
      x += Math.cos(tm * 1.6) * sc2 * 2.0 - side * 1.2 * sc2;
      y += 2.6 * sc2 + Math.sin(tm * 1.6) * sc2 * 0.8;
      z += 3.2 * sc2;
      // arriving or leaving: let go, up and away
      const away = 1 - s.presence;
      y += away * away * 5; z += away * 4; x += side * away * 1.5;
      z += 0.16 * Math.sin(tm * 2.2 - 0.9) * formTarget;                 // the jelly surges with each pulse
      z = Math.max(4.5, z) * (shrink < 1 ? 0.75 : 1);
      const d = Math.min(Math.max(s.dist + z, 0), s.length);
      s.path.posAtDist(d, P1); s.path.tangentAtDist(d, Tn);
      Rt.crossVectors(Tn, Y); if (Rt.lengthSq() < 1e-6) Rt.set(1, 0, 0); Rt.normalize();
      out.copy(P1).addScaledVector(Rt, x * shrink).addScaledVector(Y, y * shrink);
      return s.remaining - z;
    };

    const readLight = (s) => {
      const Lt = s.light, scene = group.parent;
      let dark;
      if (Lt && Lt.has) {
        U.uKey.value.copy(Lt.key).multiplyScalar(Math.min(Lt.keyIntensity, 1.5));
        U.uAmb.value.copy(Lt.ambient);
        const al = lum(U.uAmb.value); if (al > 0.9) U.uAmb.value.multiplyScalar(0.9 / al);
        if (Lt.keyIntensity > 0.01) U.uKeyDir.value.copy(Lt.keyDir); else U.uKeyDir.value.set(0.3, 0.9, 0.3);
        dark = 1 - sstep(0.25, 0.9, Lt.level);
      } else {
        // a world lit only by its own shaders: guess from its fog or background
        let l = 0.3;
        if (scene && scene.fog) l = lum(scene.fog.color); else if (scene && scene.background && scene.background.isColor) l = lum(scene.background);
        dark = 1 - sstep(0.04, 0.4, l);
        U.uKey.value.setRGB(1, 0.96, 0.9).multiplyScalar(0.9 - 0.7 * dark);
        U.uAmb.value.setScalar(0.4 - 0.25 * dark);
        U.uKeyDir.value.set(0.35, 0.85, 0.4);
      }
      U.uKeyDir.value.normalize();
      const full = lum(U.uAmb.value) + lum(U.uKey.value);                      // keep the paper's colour under a fierce sun
      if (full > 1.15) { U.uAmb.value.multiplyScalar(1.15 / full); U.uKey.value.multiplyScalar(1.15 / full); }
      const tot = lum(U.uAmb.value) + 0.5 * lum(U.uKey.value), floor = 0.16;   // never a black cut-out
      if (tot < floor) { const add = floor - tot; U.uAmb.value.r += add; U.uAmb.value.g += add; U.uAmb.value.b += add * 1.1; }
      return dark;
    };

    return {
      object: group,
      update(dt, time, s) {
        if (!s.path) return;
        if (worldId === null || (s.world && s.world.id !== worldId)) enterWorld(s);
        form = form < 0 ? formTarget : form + (formTarget - form) * (1 - Math.exp(-Math.min(dt, 0.1) * 1.6));
        if (Math.abs(form - formTarget) < 0.003) form = formTarget;
        const dark = readLight(s);
        const u = s.u, e = Math.max(s.entered, s.dist / 14), hh = 0.1;
        const g = 1 - sstep(14, 62, s.remaining), g2 = 1 - sstep(13, 26, s.remaining);
        const turn = Math.max(-0.5, Math.min(0.5, s.turn || 0));

        const left = place(time + hh, s, P);
        rel.copy(P);
        place(time, s, P);
        rel.sub(P).multiplyScalar(1 / hh);                                // its own motion within the journey
        const cam = s.camera;
        if (cam) {
          // keep it in the picture but off its centre: turn it about the eye so it never sits on the
          // line of sight, and follows part of the way when the view swings off to look at something
          cam.getWorldDirection(camF);
          lat.subVectors(P, cam.position);
          const dist = lat.length();
          if (dist > 1) {
            lat.multiplyScalar(1 / dist);
            const ca = Math.max(-1, Math.min(1, lat.dot(camF))), th = Math.acos(ca);
            p2.copy(lat).addScaledVector(camF, -ca);
            if (p2.lengthSq() < 1e-5) p2.crossVectors(camF, Y).multiplyScalar(side).addScaledVector(Y, 0.5);
            p2.normalize();
            const lo = 0.17, hi = 0.40;
            let t2 = th;
            if (th < lo) t2 = lo; else if (th > hi) t2 = th - Math.min(th - hi, 0.8);
            t2 = mix(th, t2, 1 - g2);                                       // beside the portal until the last moment
            P.copy(camF).multiplyScalar(Math.cos(t2)).addScaledVector(p2, Math.sin(t2)).multiplyScalar(dist).add(cam.position);
          }
          lat.subVectors(P, cam.position);                                // never in the viewer's face
          const dd = lat.length(), mn = 4.2 * shrink;
          if (dd < mn && dd > 1e-3) P.addScaledVector(lat, (mn - dd) / dd);
        }

        const scale = Math.max(1e-4, SIZE * shrink * mix(1, 1.35, form) * mix(1, 1.45, g) * mix(1, 1.2, g2) * s.presence * sstep(0, 0.9, e) * sstep(-0.4, 1.6, left));
        // attitude: hangs upright under its own heat, the crown lagging behind every move; the jelly leans into its swim
        const sc = 1 - sstep(0, 4.5, e), c1 = sstep(0.36, 0.47, u), c2 = sstep(0.55, 0.66, u);
        const dragX = Math.max(-0.3, Math.min(0.3, -rel.dot(Rt) * 0.07)), dragZ = Math.max(-0.3, Math.min(0.3, -rel.dot(Tn) * 0.07));
        upv.copy(Y)
          .addScaledVector(Rt, dragX + turn * 0.35 + 0.09 * Math.sin(time * 0.9) + sc * 0.45 * Math.sin(time * 3.1))
          .addScaledVector(Tn, dragZ - 0.07 + 0.07 * Math.sin(time * 0.7 + 1) + 0.95 * form)
          .normalize();
        Q.setFromUnitVectors(Y, upv);
        Qy.setFromAxisAngle(Y, time * 0.32 + TAU * (c1 + c2) + side * 2.5 * g);
        mesh.position.copy(P); mesh.quaternion.copy(Q).multiply(Qy); mesh.scale.setScalar(scale);

        // light: brighter in the dark, a swell at the top of each crossing, a flare into and out of the portal
        const hump = Math.sin(Math.PI * c1) + Math.sin(Math.PI * c2);
        const flareIn = s.prev ? 1 - sstep(0, 2.6, s.entered) : 0, flareOut = 1 - sstep(0.5, 16, left);
        const flare = Math.max(flareIn, flareOut);
        U.uTime.value = time; U.uForm.value = form; U.uScale.value = scale; U.uDark.value = dark;
        U.uFlick.value = 0.9 + 0.07 * Math.sin(time * 11.3) + 0.05 * Math.sin(time * 23.7 + 1) + 0.25 * hump;
        U.uFlare.value = flare; U.uLead.value = g;
        if (s.portalColor !== lastPortal) { lastPortal = s.portalColor; portal.set(lastPortal || '#9fd0ff'); }
        U.uFlameW.value.set(0, mix(-0.2, 0.07, form), 0).applyQuaternion(mesh.quaternion).multiplyScalar(scale).add(P);
        // the air it moves through, as its tails and embers feel it: back along the path, outward in a turn
        const spd = Math.min(1.35, Math.max(0.7, (s.speed || 10) / 11));
        U.uWind.value.copy(Tn).multiplyScalar(-spd).addScaledVector(rel, -0.3).addScaledVector(Rt, -turn * 0.6 + 0.4 * Math.sin(time * 0.37 + 0.6) + 0.15 * Math.sin(time * 1.1));   // and a cross-breeze that comes and goes
        if (U.uWind.value.length() > 1.8) U.uWind.value.setLength(1.8);

        // the halo stays modest so the paper keeps its colour (and shrinks against the portal, where the
        // lantern is a dark shape with a hot flame); a crossing goes into the sparks instead
        SU.uPos.value.set(0, mix(-0.02, 0.06, form), 0).applyQuaternion(mesh.quaternion).multiplyScalar(scale).add(P);
        SU.uBurst.value = flare;
        SU.uHalo.value = (0.05 + 0.3 * dark) * (1 + 0.5 * hump + 0.8 * flareIn) * (1 - 0.85 * g) * U.uFlick.value * mix(1, 0.9, form);
        SU.uSpark.value = (1.6 + 2.6 * dark) * (1 + 2 * flare + 0.6 * hump);
        SU.uHaloCol.value.copy(WARM_H).lerp(COOL_H, form * (1 - 0.7 * g)).lerp(portal, 0.4 * flareIn);
        if (form > 0) SU.uHaloCol.value.lerp(HEART_H, form * 0.7 * g);
        SU.uSparkCol.value.copy(WARM_S).lerp(COOL_S, form).lerp(portal, 0.5 * flare);
        group.visible = s.presence > 0.01 && scale > 0.004;
      },
      onSwap() { worldId = null; form = -1; },   // unseen for a moment: take the new world's form at once
    };
  },
};
