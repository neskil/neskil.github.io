// THE LAST LIT WINDOWS, hero set piece: the face of the last house of humankind. A pyramid of plain grey metal,
// 2400 m on a side and leaning back at 72 degrees, whose only feature is its windows: embrasures 1.6 m by 2.6 m on a
// 4 m by 6 m grid, each with a room behind it and, as often as not, somebody standing at the sill. Cut into the face
// 160 m up is the open gallery where the exit gateway stands, with its crowd.
//
// ANTIALIASING (declared once, polish round 1, second part): on the face two new lines are widened by the footprint
// of a pixel on the face (fw, wY: the screen derivatives of the face's own coordinates): the lit edge of a rib, and
// the car's light in a shaft; as every window's edge is (boxCov, winCov, archCov).
//
// MAP OF THIS FILE
//   1. constants        PYR (the pyramid), GAL (the gallery cut), GATE (the great gate at the base)
//   2. makeShared       the one set of light and air uniforms every material of this world reads, and NL_GLSL, the
//                       chunk that goes with it: nlSky (sky colour by direction), nlFog (distance fog plus ground haze,
//                       both toward that sky colour), nlLight (amber key from the face with a rim, red pits, pale lights)
//   3. window texture   one texel per window: two lit patterns (r, g) a window drifts between, warmth (b), a hash (a)
//   4. FACE shader      far field: the texture's own mip chain (no moire by construction). Near field: an exact box
//                       filter of the embrasure, the shutter, the reveal of the wall, a watcher at the sill on a plane
//                       half a metre inside (parallax), and the room by interior mapping (back wall, floor, lamp)
//   5. gallery          shell, parapet, tiers, arch and dais, hanging lamps, the crowd
//   6. buildHero
// Local space == world space of the world file: pyramid centred on the origin, the flight is over the +Z face.
import * as THREE from 'three';

export const PYR = { half: 1200, slope: 0.325, apex: 3693 };
// the gallery: its floor and ceiling, its back wall; the wall of the face is `wall` metres thick where the gallery opens
// through it, between piers (the face's own blank piers, 48 m apart) and under a lintel whose foot is at `head`
export const GAL = { x0: 290, x1: 532, y0: 160, y1: 194, zBack: 1104, head: 190, wall: 7 };
export const GAL_PIERS = [[290, 296], [336, 344], [384, 392], [432, 440], [480, 488], [524, 532]];      // the last one is the wall the arch stands in
export const GATE = { x: 30, w: 14, h: 34 };
// the hall of the watch, a rule of the house: it takes the rooms of one whole bay (36 m between two piers, the piers
// 48 m apart) on the three floors under the second open floor (96 to 114 m; the open floor at 120 m is its roof), and
// the bay is one of those that stand between the great gate and the gallery's first mouth: which, the 'balconies'
// stream deals (its first draw)
export const hallOfWatch = (rng) => ({ x: 48 * rng.int(Math.floor(GATE.x / 48) + 1, Math.floor(GAL.x0 / 48) - 1) + 28, y: 105, hw: 18, hh: 9 });
export const faceZ = (y) => PYR.half - PYR.slope * y;
const lin = (hex) => new THREE.Color(hex);

// ------------------------------------------------------------------------------------------------ 2. shared light
export function makeShared(opts = {}) {
  const amber = lin('#FFC46B'), red = lin('#A3211B'), pale = lin('#DDEBFF'), blue = lin('#3C66E0');
  const U = {
    uTime: { value: 0 },
    uKeyCol: { value: amber.clone().multiplyScalar(1.1) },
    uKeyAt: { value: new THREE.Vector3(850, 1350, -910) },                 // where the light of the face comes from
    uAmb: { value: new THREE.Color(0.006, 0.006, 0.011) },
    uPit: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -1000, 0, 1)) },      // xyz, reach
    uPitCol: { value: [0, 1, 2, 3].map(() => red.clone().multiplyScalar(3.2)) },
    uPale: { value: [0, 1, 2].map(() => new THREE.Vector4(0, -1000, 0, 1)) },        // xyz, reach
    uPaleCol: { value: [0, 1, 2].map(() => new THREE.Color(0, 0, 0)) },
    uSkyZen: { value: new THREE.Color(0.0021, 0.0019, 0.0034) },
    uSkyHor: { value: new THREE.Color(0.013, 0.013, 0.024) },
    uHaze: { value: new THREE.Color(0.105, 0.056, 0.02) },             // amber air in front of the face
    uFog: { value: new THREE.Vector4(0.0006, 0.0011, 26, 0.00022) },   // exp2 density, ground haze per metre, its scale height, the face's own density
    uPyrDir: { value: new THREE.Vector2(0, -1) },
    uRingCol: { value: pale.clone().multiplyScalar(1.0) },
    uGlowMap: { value: null }, uGlowBox: { value: new THREE.Vector4(-760, 1360, 1 / 1280, 1 / 800) },
    uRes: { value: new THREE.Vector2(1280, 720) },                     // the drawing buffer, for whatever must stay a pixel wide
  };
  if (opts.fog) U.uFog.value.fromArray(opts.fog);
  return { uniforms: U, colors: { amber, red, pale, blue } };
}

export const NL_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uKeyCol, uKeyAt, uAmb, uSkyZen, uSkyHor, uHaze, uRingCol;
uniform vec3 uPitCol[4];
uniform vec4 uPit[4];
uniform vec4 uPale[3]; uniform vec3 uPaleCol[3];
uniform vec4 uFog; uniform vec2 uPyrDir;
float nlH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float nlH3(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float nlN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(nlH(i), nlH(i + vec2(1.0, 0.0)), f.x), mix(nlH(i + vec2(0.0, 1.0)), nlH(i + vec2(1.0, 1.0)), f.x), f.y); }
float nlN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  float a = mix(mix(nlH3(i), nlH3(i + vec3(1.,0.,0.)), f.x), mix(nlH3(i + vec3(0.,1.,0.)), nlH3(i + vec3(1.,1.,0.)), f.x), f.y);
  float b = mix(mix(nlH3(i + vec3(0.,0.,1.)), nlH3(i + vec3(1.,0.,1.)), f.x), mix(nlH3(i + vec3(0.,1.,1.)), nlH3(i + vec3(1.,1.,1.)), f.x), f.y);
  return mix(a, b, f.z); }
float nlF(vec2 p){ return 0.54*nlN(p) + 0.29*nlN(p*2.03 + 17.3) + 0.17*nlN(p*4.1 + 31.7); }
// colour of the night in a direction: black overhead, a cold band at the horizon, amber air toward the face
vec3 nlSky(vec3 d){
  float e = max(d.y, 0.0);
  float hl = length(d.xz);
  float tp = max(dot(d.xz/max(hl, 1e-4), uPyrDir), 0.0);
  vec3 c = uSkyZen + uSkyHor*exp(-e*10.0) + uHaze*(0.3*tp + 0.7*tp*tp*tp)*exp(-e*2.2)*smoothstep(0.0, 0.05, hl);
  // the fire country: its dull red lies low under the smoke on every bearing but the house's, uneven, slowly creeping
  vec2 dn = d.xz/max(hl, 1e-4);
  float lay = 0.45 + 0.55*nlN(dn*2.6 + vec2(uTime*0.013, 7.0)) + 0.35*(nlN(dn*9.0 - vec2(3.0, uTime*0.021)) - 0.5);
  float away = 1.0 - smoothstep(0.1, 0.95, tp);
  return c + vec3(0.065, 0.0095, 0.007)*(away*smoothstep(0.0, 0.05, hl)*max(lay, 0.0)*(exp(-e*7.0) + 0.36*exp(-e*2.2)));
}
float nlFogAmount(vec3 P, float dens){
  vec3 v = P - cameraPosition; float dist = length(v);
  float f1 = 1.0 - exp(-dist*dist*dens*dens);
  float H = uFog.z, y0 = max(cameraPosition.y, 0.0), y1 = max(P.y, 0.0), dy = y1 - y0;
  float sdy = dy >= 0.0 ? max(dy, 0.5) : min(dy, -0.5);
  float mean = mix(exp(-0.5*(y0 + y1)/H), H*(exp(-y0/H) - exp(-y1/H))/sdy, step(0.5, abs(dy)));
  float f2 = 1.0 - exp(-uFog.y*dist*mean);
  return 1.0 - (1.0 - f1)*(1.0 - f2);
}
vec3 nlFog(vec3 col, vec3 P){
  vec3 v = P - cameraPosition; vec3 d = v/max(length(v), 1e-3);
  return mix(col, nlSky(d), nlFogAmount(P, uFog.x));
}
// the light of the Night Land on a surface: amber from the face (falling off with distance from it) and its rim on
// whatever turns its edge to it, red from the nearest pits, the pale lights (dome, ring crossing, gallery)
float nlKeyFall(vec3 P){
  vec2 q = max(abs(P.xz) - vec2(1200.0), 0.0);
  float d = length(q);
  return 1.0/(1.0 + d*d/(650.0*650.0));
}
vec3 nlKey(vec3 P, vec3 N, vec3 V, vec3 alb, float rimK){
  vec3 L = normalize(uKeyAt - P);
  float fall = nlKeyFall(P);
  float nl = max(dot(N, L), 0.0);
  float fr = 1.0 - max(dot(N, V), 0.0);
  float rim = fr*fr; rim = rim*rim*fr*nl*nl;
  return alb*(uAmb + uKeyCol*(nl*fall*0.42)) + uKeyCol*rim*rimK*fall;
}
vec3 nlPits(vec3 P, vec3 N, vec3 V, vec3 alb, float rimK){
  vec3 c = vec3(0.0); float fr = 1.0 - max(dot(N, V), 0.0);
  for (int i = 0; i < 4; i++) {
    vec3 dl = uPit[i].xyz - P; float r2 = dot(dl, dl);
    float a = 1.0/(1.0 + r2/(uPit[i].w*uPit[i].w));
    float w = 0.3 + 0.7*max(dot(N, dl)*inversesqrt(r2 + 1e-3), 0.0);
    c += (alb + 0.25*rimK*fr*fr)*uPitCol[i]*a*w;
  }
  return c;
}
vec3 nlPales(vec3 P, vec3 N, vec3 V, vec3 alb, float rimK){
  vec3 c = vec3(0.0); float fr = 1.0 - max(dot(N, V), 0.0);
  for (int i = 0; i < 3; i++) {
    vec3 dl = uPale[i].xyz - P; float r2 = dot(dl, dl);
    float a = 1.0/(1.0 + r2/(uPale[i].w*uPale[i].w));
    float w = 0.3 + 0.7*max(dot(N, dl)*inversesqrt(r2 + 1e-3), 0.0);
    c += (alb + 0.2*rimK*fr*fr)*uPaleCol[i]*a*w;
  }
  return c;
}
// how the lights of the face thin with height: full to 150 m, four fifths at 250 m, 37 in 100 at 600 m, embers (12 in 100) at 1100 m, out by 1600 m
float nlHeightDim(float y){ return exp(-max(y - 150.0, 0.0)/450.0)*(1.0 - smoothstep(1100.0, 1600.0, y)); }
// the ring: distance outside it (m), the way that points out from it, and its slow pulses travelling round
float nlRingD(vec2 p){
  vec2 q = abs(p) - vec2(1200.0);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 220.0;
}
vec2 nlRingN(vec2 p){
  vec2 q = abs(p) - vec2(1200.0);
  vec2 g = max(q.x, q.y) < 0.0 ? (q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) : normalize(max(q, 0.0) + 1e-5);
  return g*vec2(p.x < 0.0 ? -1.0 : 1.0, p.y < 0.0 ? -1.0 : 1.0);
}
float nlRingPulse(vec2 p){
  float a = atan(p.y, p.x + 1e-5);
  float node = mod(a*5.0 - uTime*0.19, 6.2831853) - 3.14159265;
  return 0.78 + 0.16*sin(a*37.0 - uTime*0.45) + 0.45*exp(-node*node*30.0);
}
// the clear light of the ring on whatever stands within a few metres of it (the tube lies half a metre over the ground)
vec3 nlRing(vec3 P, vec3 N, vec3 alb){
  float rd = nlRingD(P.xz); vec2 g = nlRingN(P.xz);
  vec3 dl = vec3(-g.x*rd, 0.5 - P.y, -g.y*rd); float r2 = dot(dl, dl);
  return alb*uRingCol*(1.3*nlRingPulse(P.xz)*(0.25 + 0.75*max(dot(N, dl)*inversesqrt(r2 + 1e-3), 0.0))/(1.0 + r2/60.0));
}
vec3 nlLight(vec3 P, vec3 N, vec3 V, vec3 alb, float rimK){
  return nlKey(P, N, V, alb, rimK) + nlPits(P, N, V, alb, rimK) + nlPales(P, N, V, alb, rimK) + nlRing(P, N, alb);
}
`;

// ------------------------------------------------------------------------------------------------ 3. window texture
// One texel per window, TW x TH windows (the face is 600 wide; 512 floors reach 3072 m, far above where the lights go out).
// r, g: brightness in the window's two states (0 = dark); b: warmth (0 amber .. 1 pale); a: a hash for phase and watcher.
const TW = 1024, TH = 512;
async function makeWindowTexture(ctx, opts) {
  const rng = opts.rng, noise = ctx.noise, lit = opts.lit ?? 0.7;
  const data = new Uint8Array(TW * TH * 4);
  const DW = 12, DH = 10;                                   // a district: 48 m by 60 m
  const nDx = Math.ceil(TW / DW), nDy = Math.ceil(TH / DH), dist = new Float32Array(nDx * nDy), warm = new Float32Array(nDx * nDy), keep = new Float32Array(nDx * nDy);
  for (let j = 0; j < nDy; j++) for (let i = 0; i < nDx; i++) {
    // clouds of light: a slow field of wakefulness, with whole districts asleep
    const n = noise.fbm2(i * 0.11 + 3.1, j * 0.17 - 7.7, 3), n2 = noise.n2(i * 0.031 - 11, j * 0.05 + 5);
    let f = lit + 0.42 * n + 0.2 * n2;
    const h = rng();
    if (h < 0.1 + (0.7 - lit) * 0.5) f *= 0.12; else if (h < 0.24) f *= 0.5; else if (h > 0.9) f = Math.max(f, 0.92);
    const y = (j + 0.5) * DH * 6;                          // metres up the face: fewer lit, floor by floor, until the dark
    f *= 1 - 0.75 * Math.min(1, Math.max(0, (y - 420) / 1150));
    dist[j * nDx + i] = Math.min(0.97, Math.max(0.02, f));
    warm[j * nDx + i] = rng() < 0.16 ? rng.range(0.5, 1) : rng.range(0, 0.22);
    keep[j * nDx + i] = rng();
  }
  let k = 0;
  const dAt = (i, j) => dist[Math.min(nDy - 1, Math.max(0, j)) * nDx + ((i % nDx) + nDx) % nDx];
  for (let j = 0; j < TH; j++) {
    const dj = Math.floor(j / DH) * nDx, gj = j / DH - 0.5, j0 = Math.floor(gj), fj = gj - j0;
    for (let i = 0; i < TW; i++, k += 4) {
      const d = dj + Math.floor(i / DW);
      const a = rng(), b = rng(), c = rng(), e = rng();
      // districts shade into their neighbours (ragged, window by window); one bright hall in ten keeps its own hard edge
      let f = dist[d];
      if (keep[d] < 0.9 || f < 0.6) { const gi = i / DW - 0.5 + (e - 0.5) * 0.5, i0 = Math.floor(gi), fi = gi - i0; f = (dAt(i0, j0) * (1 - fi) + dAt(i0 + 1, j0) * fi) * (1 - fj) + (dAt(i0, j0 + 1) * (1 - fi) + dAt(i0 + 1, j0 + 1) * fi) * fj; }
      // the two states agree four times in five: the wall changes slowly
      const litA = a < f, litB = c < 0.8 ? litA : b < f;
      // most lamps are low, a few are bright; a wakeful district burns brighter than a drowsy one
      const lum = (b < 0.5 ? 0.14 + 0.36 * b : b < 0.9 ? 0.32 + (b - 0.5) : 0.72 + (b - 0.9) * 2.8) * Math.min(1.1, 0.5 + 0.7 * f);
      const br = Math.max(24, Math.min(255, Math.floor(255 * lum)));
      data[k] = litA ? br : 0; data[k + 1] = litB ? br : 0;
      data[k + 2] = Math.floor(255 * Math.min(1, Math.max(0, warm[d] + (c - 0.5) * 0.3)));
      data[k + 3] = Math.floor(e * 255.99);
    }
    if ((j & 15) === 15) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = Math.min(8, ctx.renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------------------------------------------ 4. the face
const FACE_VS = /* glsl */`
attribute vec3 aF;                       // x along the face from its centre (m), y up (m), z: which of the four faces
varying vec3 vW; varying vec3 vF;
void main(){
  vF = aF; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const FACE_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform sampler2D uWin; uniform vec2 uTex; uniform vec4 uGal; uniform vec3 uGate, uMetal, uLamp, uPaleLamp;
uniform vec2 uGreet;                     // the greeting wave: height it has reached (m), strength
uniform float uWinE, uWake, uGalK, uDim;
uniform vec3 uDimLamp, uWatch; uniform vec4 uPort;
uniform vec4 uCity;                     // polish round 1: two offsets dealt from the 'cities' stream, the share of bays with a great embrasure, the share of piers with a shaft
varying vec3 vW; varying vec3 vF;
float gDim;
// THE WATCH (a rule of the house, on every visit): the floors between the great gate and the great gallery, from the
// ground to six floors over the gallery's lintel, are the night watch's quarters, and the watch keeps its lamps lit
float watchK(vec2 p){ return (1.0 - smoothstep(uWatch.y, uWatch.y + 80.0, abs(p.x - uWatch.x)))*(1.0 - smoothstep(uWatch.z, uWatch.z + 60.0, p.y)); }
float boxCov(float x, float w, float a, float b){ return clamp((min(x + 0.5*w, b) - max(x - 0.5*w, a))/max(w, 1e-5), 0.0, 1.0); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
// polish round 1 (P3e): how much of a pixel a window covers, by its kind: a box (x0..x1, y0..y1 of its cell), a pair of
// small ones side by side, or a round one 2.6 m across
// second part (G3b): the head of a street's opening is an arch: round, 1.4 m in radius, springing at 4.18 m
float archCov(vec2 p, vec2 w){
  vec2 q = vec2((p.x - 0.5)*4.0, max(p.y*6.0 - 4.18, 0.0)); float aw = max(w.x*4.0, w.y*6.0)*0.5 + 1e-3;
  return 1.0 - smoothstep(1.4 - aw, 1.4 + aw, length(q));
}
float winCov(vec2 p, vec2 w, vec4 b, float small, float rnd){
  float box = boxCov(p.x, w.x, b.x, b.y)*boxCov(p.y, w.y, b.z, b.w);
  float two = (boxCov(p.x, w.x, 0.14, 0.4) + boxCov(p.x, w.x, 0.6, 0.86))*boxCov(p.y, w.y, 0.4, 0.62);
  vec2 q = (p - vec2(0.5, 0.4667))*vec2(4.0, 6.0); float aw = max(w.x*4.0, w.y*6.0)*0.5 + 1e-3;
  return mix(mix(box, two, small), 1.0 - smoothstep(1.3 - aw, 1.3 + aw, length(q)), rnd);
}
// one point of light for a block of windows: k = log2 of the block's size in windows, per axis
float farPoint(vec2 c, vec2 k){
  vec2 sz = exp2(k), bc = c/sz, bi = floor(bc), bf = bc - bi;
  vec4 t = textureLod(uWin, (bi + 0.5)*sz/uTex, min(k.x, k.y));
  float mean = 0.5*(t.r + t.g);
  mean += gDim*clamp(1.0 - mean*2.6, 0.0, 1.0);          // the night lamps of the rooms asleep
  vec2 jk = smoothstep(vec2(0.0), vec2(1.0), k);
  float h = nlH(bi + k*17.0), h2 = nlH(bi + k.yx*23.0 + 5.5), h3 = nlH(bi*1.7 + k*5.0 + 11.0);
  // far off, the light of a floor runs together along it: each point is drawn out along its row (a weave of faint
  // lines; single windows only nearer), and at least half the blocks carry their light, so that upward and far along
  // the face thins smoothly and never into loose dots
  float p = mix(1.0, clamp(mean*2.4 + 0.5, 0.5, 1.0), max(jk.x, jk.y));
  vec2 q = bf - 0.5 - (vec2(h, h2) - 0.5)*0.55*jk; q.y += 0.0333*(1.0 - jk.y);
  return step(h3, p)*(mean/p)*0.1733*2.86*mix(1.0, 0.64, jk.x)*exp(-q.x*q.x*mix(9.0, 1.0, jk.x) - q.y*q.y*9.0);
}
// The three strata of smoke lie against the face as bars (300 to 380 m, 620 to 700 m, 980 to 1040 m up, some 160 m deep,
// ragged, drifting west): how much of the light of a point F of the face reaches an eye in the direction V through them.
// It is worked out along the line of sight, so it is right for any eye: from far below a bar is black across the windows
// and the rows above it show again, dimmer.
float smokeT(vec3 F, vec3 V, float dist){
  float gk = max(V.z + 0.325*V.y, 1e-3), vy = abs(V.y) < 1e-3 ? 1e-3 : V.y, tau = 0.0;
  float xw = F.x + uTime*3.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float wob = 36.0*(nlN(vec2(xw/230.0, fi*9.1)) - 0.5) + 14.0*(nlN(vec2(xw/60.0, fi*3.3 + 5.0)) - 0.5);
    float h0 = (i == 0 ? 300.0 : i == 1 ? 620.0 : 980.0) + wob, h1 = h0 + (i == 2 ? 60.0 : 80.0) + 0.5*wob;
    float dn = 0.3 + 1.6*smoothstep(0.25, 0.75, nlN(vec2(xw/520.0, fi*5.7 + 2.0)));
    float deep = 160.0*(0.6 + 0.8*nlN(vec2(xw/340.0, fi*2.9 + 7.0)));
    float sa = (h0 - F.y)/vy, sb = (h1 - F.y)/vy;
    float s0 = max(min(sa, sb), 0.0), s1 = min(max(sa, sb), min(dist, deep/gk));
    tau += dn*0.012*max(s1 - s0, 0.0);
  }
  return 0.42 + 0.58*exp(-tau);
}
void main(){
  float fx = vF.x, fy = vF.y, face = vF.z, f0 = 1.0 - step(0.5, face);
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye/max(dist, 1e-3);
  vec2 c = vec2((fx + 1200.0)/4.0 + face*211.0, fy/6.0);
  vec2 fw = max(fwidth(c), vec2(1e-5));
  vec2 pc = vec2((fx + 1200.0)/240.0, fy/300.0), pw = max(fwidth(pc), vec2(1e-6));
  vec2 ci = floor(c), cf = c - ci;
  // the bays of the wall: every twelfth and thirteenth column is a blank pier of plate, every tenth floor an open gallery
  // with a rail and people along it
  float rib = 1.0 - step(1.5, mod(ci.x, 12.0));
  // the mouths of the great gallery: the bays between the piers, from its floor to the lintel
  if (f0*step(uGal.x, fx)*step(fx, uGal.y)*step(uGal.z, fy)*step(fy, uGal.w)*(1.0 - rib) > 0.5) discard;
  float band = (1.0 - step(0.5, mod(ci.y, 10.0)))*step(5.0, ci.y)*(1.0 - rib);
  vec2 e0 = c - 0.5*fw, e1 = c + 0.5*fw;
  float ribFar = clamp((floor(e1.x/12.0)*2.0 + clamp(fract(e1.x/12.0)*12.0, 0.0, 2.0) - floor(e0.x/12.0)*2.0 - clamp(fract(e0.x/12.0)*12.0, 0.0, 2.0))/fw.x, 0.0, 1.0);
  vec4 tn = textureLod(uWin, (ci + 0.5)/uTex, 0.0);
  vec4 tb = textureLod(uWin, c/uTex, 3.2);
  vec2 cc = vec2((ci.x + 0.5 - face*211.0)*4.0 - 1200.0, (ci.y + 0.5)*6.0);
  float wq = f0*watchK(cc), wqF = f0*watchK(vec2(fx, fy)), hN = nlH(ci + 53.1);
  gDim = mix(uDim*0.09, 0.3, wqF);
  float hd = nlHeightDim(fy);
  // ---- POLISH ROUND 1 (P3): THE CITIES. The house is many cities, one above another: a city is ten storeys (60 m) high,
  // its lowest storey its street (the open floor that was there); a bay is 48 m. kfl: the storey within its city.
  float kfl = mod(ci.y, 10.0), cityJ = floor(ci.y/10.0), bayI = floor(ci.x/12.0);
  // a stretch of a city (240 m of it, about one in seven) sleeps; none in the watch's quarters
  float sleepK = step(nlH(vec2(floor(ci.x/60.0), cityJ)*1.7 + uCity.yx + 3.0), 0.14)*(1.0 - step(0.02, wq));
  float cityOn = 1.0 - sleepK;
  // (b) a great embrasure: in one bay in so many of a city (the share and which: the 'cities' stream), the rooms of the
  // three storeys under the next city's street are one hall open to the night, as the hall of the watch is; none in
  // the watch's quarters (its own hall is there), none in the lowest city, none within 60 m of the face's edge
  vec2 eC = vec2((bayI*12.0 + 7.0 - face*211.0)*4.0 - 1200.0, cityJ*60.0 + 45.0);
  float eOn = step(nlH(vec2(bayI, cityJ)*1.31 + uCity.xy), uCity.z)*step(0.5, cityJ)*(1.0 - step(0.02, f0*watchK(eC)))*step(60.0, (1200.0 - 0.325*(eC.y + 9.0)) - abs(eC.x));
  float embZ = eOn*step(abs(cc.x - eC.x), 20.0)*step(abs(cc.y - eC.y), 10.0), embZF = eOn*step(abs(fx - eC.x), 20.0)*step(abs(fy - eC.y), 10.0);
  // ---- the plate: seams of the great plates, panel lines; close by, the joint of every bay and floor, a course of rivets
  // over each joint, the runs of an age of weather; a wash of the light of its own windows and a little of the night's
  vec2 pf = 0.5 - abs(fract(pc) - 0.5);
  float seam = max(1.0 - smoothstep(0.0, 1.5*pw.x + 0.0011, pf.x), 1.0 - smoothstep(0.0, 1.5*pw.y + 0.0009, pf.y))*clamp(0.0035/(max(pw.x, pw.y) + 0.0035), 0.0, 1.0);
  vec2 sc = pc*10.0, sf = 0.5 - abs(fract(sc) - 0.5), sw = pw*10.0;
  float fine = max(1.0 - smoothstep(0.0, 1.5*sw.x + 0.004, sf.x), 1.0 - smoothstep(0.0, 1.5*sw.y + 0.004, sf.y))*clamp(0.02/(max(sw.x, sw.y) + 0.02) - 0.3, 0.0, 1.0);
  float tone = 0.7 + 0.6*nlH(floor(pc) + face*13.0) + 0.1*(nlH(floor(sc)) - 0.5)*clamp(0.02/(max(sw.x, sw.y) + 0.02), 0.0, 1.0);
  float mpp = max(fw.x*4.0, fw.y*6.0), kc = 1.0 - smoothstep(0.08, 0.5, mpp);          // metres of wall to a pixel
  vec2 jf = 0.5 - abs(cf - 0.5);
  float joint = max(1.0 - smoothstep(0.0, 1.5*fw.x + 0.008, jf.x), 1.0 - smoothstep(0.0, 1.5*fw.y + 0.006, jf.y))*kc;
  float rivet = (1.0 - smoothstep(0.03, 0.06, length(vec2((fract(cf.x*8.0) - 0.5)*0.5, cf.y*6.0 - 0.2))))*(1.0 - smoothstep(0.02, 0.07, mpp));
  float run = smoothstep(0.5, 0.85, nlN(vec2(fx*2.7, ci.y*5.7 + face)))*(0.25 + 0.75*fract(cf.y + 0.75))*kc;
  float ledge = (1.0 - step(0.5, mod(ci.y, 10.0)))*step(5.0, ci.y)*(1.0 - smoothstep(0.0, 0.012 + fw.y, abs(cf.y - 0.1)))*kc;
  float spill = (0.5*(tb.r + tb.g) + gDim*clamp(1.0 - 1.3*(tb.r + tb.g), 0.0, 1.0))*hd;
  float fa = face*1.5707963;
  vec3 N = vec3(sin(fa)*0.951, 0.3091, cos(fa)*0.951);
  vec3 metal = uMetal*tone*(1.0 - 0.55*seam - 0.3*fine)*(1.0 + 0.3*rib)*(1.0 - 0.5*joint)*(1.0 - 0.32*run)*(1.0 + 0.6*rivet + 0.5*ledge);
  // two pipes run up every pier, clipped to it at each floor
  float xr = (mod(ci.x, 12.0) + cf.x)*4.0, pd = min(abs(xr - 1.5), abs(xr - 6.8)), pwd = 0.22 + fw.x*4.0;
  float pipe = rib*kc*(1.0 - smoothstep(0.2, pwd + 0.04, pd));
  metal *= 1.0 + pipe*(1.1*(1.0 - clamp(pd/0.24, 0.0, 1.0)) - 0.4) - 0.3*rib*kc*(smoothstep(0.24, 0.3, pd) - smoothstep(0.3, 0.8, pd)) + 0.5*pipe*step(cf.y, 0.05);
  // polish round 1 (P3c): the ribs (the piers, 8 m wide) stand out from the plate: the plate beside a rib lies in its
  // shade, the rib's own edges catch the light, and seen aslant the rib shows its flank (0.9 m deep) over the plate
  // beside it; and the plate is stained by the water of ages under every street, in runs up to 25 m long
  float dRib = min(xr - 8.0, 48.0 - xr), dEdge = min(xr, 8.0 - xr);
  metal *= (1.0 - 0.34*(1.0 - rib)*exp(-max(dRib, 0.0)/1.7))*(1.0 + 0.4*rib*exp(-max(dEdge, 0.0)/(0.3 + fw.x*4.0)));
  // (second part, G4c: on all four faces, by the view along each face's own length and out from it. G4b, ANTIALIASING:
  // the rib's lit edge above is widened by a pixel's footprint, fw.x; so is the car's light in a shaft below, by wY.)
  float vxl = V.x*cos(fa) - V.z*sin(fa), vzl = V.x*sin(fa) + V.z*cos(fa);
  float flankW = min(0.9*abs(vxl)/max(vzl, 0.05), 1.2), flank = (1.0 - rib)*(vxl < 0.0 ? step(xr - 8.0, flankW) : step(48.0 - xr, flankW));
  float stain = smoothstep(0.5, 0.9, nlN(vec2(fx*0.8 + face*31.0, cityJ*7.0)))*exp(-(60.0 - mod(fy, 60.0))/25.0)*(1.0 - rib);
  metal *= 1.0 - 0.38*stain;
  // the night's own light on the plate (what the land's fires and the ring send up, and the eye grown used to the dark),
  // the amber thrown back by the swept ground at its foot, and the glow of its own windows in the air before it
  // (the plate is seen wherever its windows are: the night's glow stays on it far above where the lamps thin, a step
  // lighter than the sky; the fire country reddens its lower flank; far off the bloom of its windows lies between them)
  vec3 night = vec3(0.2, 0.21, 0.27)*(0.32 + 0.68*hd) + vec3(0.2, 0.12, 0.05)*exp(-max(fy, 0.0)/90.0)*uWake + vec3(0.07, 0.016, 0.012)*exp(-max(fy, 0.0)/500.0);
  vec3 col = metal*(night + uLamp*spill*(0.3 + 0.22*rib + 0.3*(1.0 - kc))) + nlPits(vW, N, V, metal, 0.0) + nlPales(vW, N, V, metal, 0.0);
  col += metal*(night*0.25 + uLamp*spill*0.5)*flank;
  // ---- which cells carry a window: none on the lowest two floors, in the frame of the gate or in the frame of the gallery
  float gateZ = f0*(1.0 - step(uGate.y + 4.0, abs(cc.x - uGate.x)))*(1.0 - step(uGate.z + 5.0, cc.y));
  float galZ = f0*step(uGal.x - 2.0, cc.x)*step(cc.x, uGal.y + 2.0)*step(uGal.z - 1.0, cc.y)*step(cc.y, uGal.w + 6.0);
  float portZ = f0*step(abs(cc.x - uPort.x), uPort.z + 2.0)*step(abs(cc.y - uPort.y), uPort.w + 1.0);
  float wm = step(12.0, cc.y)*(1.0 - gateZ)*(1.0 - galZ)*(1.0 - portZ)*(1.0 - embZ)*(1.0 - rib);
  // ---- the window. Near: an exact box filter of the embrasure. Far: the wall is a field of points, one for each block
  // of 2^k windows (k from the size of a pixel, taken per axis), carrying the block's light from the texture's mip chain
  float wx = smoothstep(0.28, 0.6, fw.x), wy = smoothstep(0.28, 0.6, fw.y), wfar = max(wx, wy);
  float tri = abs(fract(tn.a + uTime*0.03 + nlH(ci)*0.37)*2.0 - 1.0);
  float st = smoothstep(0.47, 0.53, tri);
  // a bay of an open floor is lit when its lamp is lit in either state: no brighter than a window, and as often dark
  float open = mix(mix(step(0.01, tn.r), step(0.01, tn.g), st), step(0.01, tn.r + tn.g), band);
  float bN = max(tn.r, tn.g)*mix(1.0, 0.75, band);
  // polish round 1 (P3a): a city's street is lit along its whole length where the city wakes (a lamp to every bay)
  // (second part, G3a: not along its whole length: in stretches of 12 m, about three in five; the rest is as it was,
  // lit bay by bay or dark. A street's bay is a wider opening than a window, so its light is held to 0.55.)
  float stOn = step(0.4, nlH(vec2(floor(ci.x/3.0), cityJ) + 47.0)), stK = mix(1.0, 0.55, band);
  float mineS = band*cityOn*stOn*(1.0 - open);          // (G4d: a street's bay that this round lit, and live did not)
  open = max(open, band*cityOn*stOn); bN = max(bN, 0.4*band*cityOn*stOn);
  // a room asleep keeps a low night lamp, two rooms in three (bluer than the evening's lamps); in the watch's quarters
  // nearly every room keeps a full one
  float dimOn = (1.0 - open)*step(hN, mix(uDim, 0.9, wq));
  open = max(open, dimOn);
  bN = mix(bN, mix(0.06, 0.2 + 0.4*fract(hN*7.3), wq), dimOn);
  float dimK = mix(1.0, mix(0.3, 1.0, wq), dimOn);
  // rooms of unlike widths: a slit, a common window, a broad one
  float wv = nlH(ci + 91.7), wh = mix(wv < 0.22 ? 0.11 : wv < 0.8 ? 0.2 : 0.34, 0.44, band);
  // polish round 1 (P3e, P3a): windows of unlike kinds by storey. The storey over a street has tall hall windows; the
  // fifth and sixth storeys of a city have rows of small ones, two to a room; the storey under a street has round
  // ones; the street itself is a taller storey, open from the sill to 5.6 m
  float tallK = step(0.5, kfl)*step(kfl, 1.5), smallK = step(4.5, kfl)*step(kfl, 6.5), roundK = step(8.5, kfl);
  wh = mix(wh, 0.3, tallK);
  wh = mix(wh, 0.35, band);                 // (second part, G3b: a pier 1.2 m wide between the street's openings; it was 0.5 m)
  float wx0 = 0.5 - wh, wx1 = 0.5 + wh, wy0 = mix(0.25, 0.17, tallK), wy1 = mix(mix(0.6833, 0.93, band), 0.87, tallK);
  vec4 wbox = vec4(wx0, wx1, wy0, wy1);
  float covFull = winCov(cf, fw, wbox, smallK, roundK)*mix(1.0, archCov(cf, fw), band);
  float covOpen = covFull*open;
  vec2 lod = min(max(log2(fw*3.2), vec2(0.0)), vec2(12.0)), l0 = floor(lod), lf = lod - l0;
  float bF = mix(mix(farPoint(c, l0), farPoint(c, l0 + vec2(1.0, 0.0)), lf.x), mix(farPoint(c, l0 + vec2(0.0, 1.0)), farPoint(c, l0 + vec2(1.0)), lf.x), lf.y);
  float h1 = nlH(ci + 7.3), h2 = nlH(ci + 31.7), h3 = fract(tn.a*7.13 + h1);
  // life: each lamp breathes, somebody crosses in front of it now and then and all but hides it; far off, a scintillation
  // (the house is awake and watching: a window changes its state about every 17 s)
  float cross1 = smoothstep(0.86, 0.97, sin(uTime*(0.5 + 0.9*h2) + h1*40.0));
  float flN = 0.86 + 0.14*sin(uTime*(1.3 + 2.9*h1) + tn.a*40.0) - 0.7*cross1;
  float flF = 0.72 + 0.6*nlN3(vec3(c*0.21, uTime*0.9)) + 0.24*(nlN3(vec3(c*0.045 + 9.0, uTime*0.45)) - 0.5);
  float bright = bN*flN;
  // lamps carried along a floor, room to room
  float fl = ci.y, lh = nlH(vec2(fl, 3.0)), ldir = lh > 0.5 ? 1.0 : -1.0;
  float lx = mod(lh*97.0 + uTime*ldir*(0.25 + 0.3*nlH(vec2(fl, 9.0))) - ci.x + 15.5, 31.0) - 15.5;
  bright *= 1.0 + 1.3*step(0.62, nlH(vec2(fl, 5.0)))*exp(-lx*lx*1.6);
  // the greeting (rare): a front of brightness climbing the rows
  float gz = uGreet.x - fy;
  float greet = 1.0 + uGreet.y*smoothstep(-30.0, 0.0, gz)*(0.35 + 0.9*exp(-max(gz, 0.0)/90.0));
  float gK = mix(greet*uWake, 1.0, mineS);             // (G4d: what this round lit burns steadily and takes no part in the greeting)
  bright *= gK*mix(1.0, 0.4, sleepK);                    // (polish round 1, P3c: where a city sleeps its lamps are low)
  vec3 wcol = mix(uLamp, uPaleLamp, tn.b);
  wcol = mix(wcol, mix(uDimLamp, wcol, wq), dimOn);
  float E = uWinE*mix(0.45, 1.0, smoothstep(0.03, 0.2, fw.x));
  vec3 win = wcol*(E*bright*hd*stK);
  float litCov = covOpen*wm*(1.0 - wfar);
  // ---- wherever a window is more than a point: the reveal of the wall (0.7 m of plate at the sill and the jambs), the
  // people standing at the sill, the room behind (interior mapping: back wall, floor line, a lamp, a doorway)
  float wI = (1.0 - wfar)*f0*wm*open;
  if (wI > 0.001 && covFull > 0.001) {
    vec3 D = -V; float dz = max(-D.z, 0.02);
    vec2 l0 = vec2(cf.x*4.0, cf.y*6.0);
    // the room: x 0.15..3.85 (an open floor runs on behind its posts), y 0.6..5.7, depth 0.7..6.6
    float tb1 = 6.6/dz;
    float tx = D.x > 0.0 ? (3.85 - l0.x)/max(D.x, 1e-4) : (0.15 - l0.x)/min(D.x, -1e-4);
    tx = mix(tx, 1e5, band);
    float ty = D.y > 0.0 ? (5.7 - l0.y)/max(D.y, 1e-4) : (0.6 - l0.y)/min(D.y, -1e-4);
    float t = min(tb1, min(tx, ty));
    vec3 hp = vec3(l0 + D.xy*t, dz*t);
    vec3 lp = vec3(2.0 + (h3 - 0.5)*1.5, 4.85, 3.3);
    vec3 dl = hp - lp; dl.x = mix(dl.x, mod(dl.x + 2.0, 4.0) - 2.0, band);              // a lamp to every bay of an open floor
    float I = 1.0/(1.0 + dot(dl, dl)*0.16);
    float isBack = step(tb1, t + 1e-4), isFloor = (1.0 - isBack)*step(ty, t + 1e-4)*step(D.y, 0.0), isCeil = (1.0 - isBack)*step(ty, t + 1e-4)*step(0.0, D.y);
    vec3 tint = mix(vec3(0.74, 0.6, 0.45), vec3(0.5, 0.5, 0.52), h2);
    vec3 alb = tint*(0.55 + 0.3*isBack);
    alb *= 1.0 - 0.35*isBack*step(hp.y, 1.9);                                               // a dado
    float door = isBack*step(abs(mod(hp.x, 4.0) - (0.9 + 2.2*h1)), 0.5)*step(hp.y, 3.0);    // a doorway to the room behind
    alb = mix(alb, vec3(0.05, 0.04, 0.035), door*0.9);
    alb = mix(alb, vec3(0.16, 0.12, 0.09), isFloor);
    alb = mix(alb, tint*0.8, isCeil);
    vec3 room = wcol*alb*(0.07 + 1.15*I);
    // the lamp itself
    vec3 dv = vec3(D.x, D.y, dz), wv = lp - vec3(l0, 0.0);
    float pr = dot(wv, dv), dp2 = max(dot(wv, wv) - pr*pr, 0.0);
    room += wcol*(3.2*exp(-dp2/0.016) + 0.25*exp(-dp2/0.5))*step(pr, t + 0.3);
    // somebody at the sill, on a plane 0.3 m inside the wall: black against the room; along an open floor, up to three to a bay
    vec2 pp = l0 + D.xy*(0.3/dz);
    float who = max(step(0.42, h2), band);
    float lean = clamp(V.x, -1.0, 1.0)*0.09;                                                // they turn toward whoever passes
    float pxm = mix(2.0 + (h1 - 0.5)*0.9, 2.0 + (h1 - 0.5)*0.5, band), sway = 0.02*sin(uTime*(0.6 + h3) + h1*30.0);
    float sdp = min(length(pp - vec2(pxm + lean + sway, 2.33)) - 0.14, sdBox(pp - vec2(pxm + lean*0.4, 1.55), vec2(0.23, 0.5)) - 0.07);
    float side = h3 > 0.5 ? 1.0 : -1.0, lifts = step(0.8, h1);
    float raise = lifts*(0.25 + 0.75*(1.0 - smoothstep(40.0, 85.0, dist)))*(0.85 + 0.15*sin(uTime*1.7 + h3*20.0));
    vec2 hand = vec2(pxm + side*(0.33 + 0.06*raise), 1.72 + 0.72*raise);
    vec2 sh = vec2(pxm + side*0.22, 2.02), ab = hand - sh; float hh = clamp(dot(pp - sh, ab)/max(dot(ab, ab), 1e-4), 0.0, 1.0);
    sdp = min(sdp, length(pp - sh - ab*hh) - 0.055);
    // a second, smaller one beside the first in some windows
    float kid = step(0.78, h3)*(1.0 - band);
    sdp = min(sdp, mix(9.0, min(length(pp - vec2(pxm - side*0.55, 1.92)) - 0.11, sdBox(pp - vec2(pxm - side*0.55, 1.45), vec2(0.15, 0.34)) - 0.05), kid));
    for (int k = 0; k < 2; k++) {
      float hk = fract(h1*7.3 + float(k)*0.37 + h2), xk = (k == 0 ? 0.72 : 3.28) + (hk - 0.5)*0.5;
      float sk = min(length(pp - vec2(xk + lean, 2.3 + 0.1*(hk - 0.5))) - 0.14, sdBox(pp - vec2(xk + lean*0.4, 1.55), vec2(0.23, 0.5)) - 0.07);
      sdp = min(sdp, mix(9.0, sk, band*step(0.3, hk)));
    }
    float aa = max(fw.x*4.0, fw.y*6.0)*0.75 + 0.004;
    float pm = who*(1.0 - smoothstep(-aa, aa, sdp));
    room = mix(room, wcol*0.012, pm);
    // polish round 1 (P3a), second part (G3b): along a street a lamp hangs in every bay, on a cord from the arch, a
    // metre inside the piers, at its own height (3.1 to 4.3 m) and a little off the middle, in the house's amber; and
    // people walk both ways, about one to every nine metres each way, a metre and a half inside the piers
    vec2 pl = l0 + D.xy*(1.0/dz); float lc = floor(pl.x/4.0), lh1 = nlH(vec2(ci.x + lc, ci.y) + 13.0), lh2 = nlH(vec2(ci.x + lc, ci.y) + 29.0);
    vec2 lq = vec2(pl.x - lc*4.0 - 2.0 - (lh1 - 0.5)*1.2, pl.y - 3.1 - 1.2*lh2); float ls2 = dot(lq, lq);
    float cord = band*cityOn*(1.0 - smoothstep(0.015, 0.03 + aa, abs(lq.x)))*step(0.0, lq.y);
    room = mix(room, wcol*0.03, cord);
    float lampA = band*cityOn*(2.6*exp(-ls2/0.012) + 0.3*exp(-ls2/0.2));
    vec2 pk = l0 + D.xy*(1.6/dz); float Xa = ci.x*4.0 + pk.x, sdw = 9.0;
    for (int k = 0; k < 2; k++) {
      float fk = float(k), dirk = 1.0 - 2.0*fk, sk2 = (Xa - dirk*uTime*(1.1 + 0.2*fk))/9.0 + fk*0.37, ck = floor(sk2), hk2 = nlH(vec2(ck, ci.y + fk*17.0));
      float xk2 = (sk2 - ck - 0.5)*9.0 - (hk2 - 0.5)*5.0, bob = 0.03*sin(uTime*6.0 + hk2*30.0);
      float sw2 = min(length(vec2(xk2, pk.y - 2.3 - bob)) - 0.14, sdBox(vec2(xk2, pk.y - 1.45 - bob), vec2(0.21, 0.6)) - 0.06);
      sdw = min(sdw, mix(9.0, sw2, step(0.4, hk2)));
    }
    room = mix(room, wcol*0.02, band*(1.0 - smoothstep(-aa, aa, sdw)));
    float lg = length(pp - hand - vec2(side*0.03, 0.1));
    room += who*lifts*uPaleLamp*(4.5*exp(-lg*lg/0.006) + 0.5*exp(-lg*lg/0.09));
    // the reveal: the thickness of the wall seen through the opening, lit by the room (the sill most, the head least)
    vec2 rv = l0 + D.xy*(0.7/dz);
    float inner = winCov(rv/vec2(4.0, 6.0), fw, wbox, smallK, roundK)*mix(1.0, archCov(rv/vec2(4.0, 6.0), fw), band);
    vec3 reveal = uMetal*tone*wcol*(0.6 + 1.0*step(rv.y, 1.5) - 0.35*step(4.1, rv.y));
    room = mix(reveal, room, inner);
    win = mix(win, room*((0.55 + 0.9*bN)*dimK*flN*gK*hd*stK), wI);
    win += uLamp*(lampA*inner*hd*wI);                  // (G4d: the street's own lamps, steady, outside the greeting)
  }
  // the shutter: plain plate a shade darker, set back under its head
  float shut = covFull*(1.0 - open)*wm*(1.0 - wfar);
  col = mix(col, metal*(night*0.45 + uLamp*spill*0.07)*(0.55 + 0.45*smoothstep(0.6, 0.683, 0.683 - cf.y + 0.6)), shut);
  col = mix(col, win, litCov);
  // far off. Seen aslant, an embrasure in a wall 0.7 m thick shows less of its room and more of its lit reveal: the face
  // at a grazing angle is a soft sheen, not rows of bright bars
  float ca = cos(fa), sa = sin(fa), cn = max(dot(V, N), 0.03);
  float tX = abs(V.x*ca - V.z*sa)/cn, tY = abs(dot(V, vec3(-sa*0.3091, 0.951, -ca*0.3091)))/cn;
  float aslant = mix(0.3, 1.0, clamp(1.0 - 0.7*tX/1.6, 0.0, 1.0)*clamp(1.0 - 0.7*tY/2.6, 0.0, 1.0));
  float farK = hd*greet*uWake*wfar*step(12.0, fy)*(1.0 - gateZ)*(1.0 - galZ)*(1.0 - portZ)*(1.0 - embZF)*(1.0 - 0.92*ribFar)*aslant*mix(1.0, 0.4, sleepK);
  float dkF = clamp(1.0 - 1.3*(tb.r + tb.g), 0.0, 1.0)*(1.0 - wqF);
  col += mix(mix(uLamp, uPaleLamp, tb.b*0.6), uDimLamp, 0.45*dkF)*(1.3*uWinE*farK*bF*flF);
  // polish round 1 (P3a): far off, a city's street is a line of light along the face where the city wakes, broken at the ribs
  float yb = mod(fy, 60.0), wY = max(fwidth(fy), 1e-4);
  float lineC = clamp((min(yb + 0.5*wY, 5.58) - max(yb - 0.5*wY, 1.5))/wY, 0.0, 1.0)*step(60.0, fy);
  col += mix(uLamp, uPaleLamp, 0.3)*(1.3*uWinE*0.1733*0.12*lineC*(farK/max(greet*uWake, 1e-3))*cityOn*smoothstep(0.35, 0.65, nlN(vec2(c.x*0.21, cityJ*3.7))));   // (second part, G3a: 0.12 for 0.5, and broken into stretches)
  // the corner of the house: the last plate of each face catches the night's glow, a pale line up its edge
  float edgeD = (1200.0 - 0.325*fy) - abs(fx);
  col += vec3(0.02, 0.022, 0.03)*((0.3 + 0.7*hd)*(1.0 - smoothstep(0.0, 2.5 + 1.5*fwidth(fx), edgeD)));
  // polish round 1 (P3d): lights rising and falling in a few shafts. One rib in so many (the share and which: the 'cities'
  // stream) carries a shaft of glass 0.8 m wide up its middle, from the ground to the top of its lit cities (300 to
  // 800 m); a car's light goes up it and down again, once in 90 to 210 s
  float shOn = step(nlH(vec2(bayI, 19.0) + uCity.xy), uCity.w)*rib*(1.0 - gateZ)*(1.0 - galZ);
  float shTop = 300.0 + 500.0*nlH(vec2(bayI, 23.0)), shPer = 90.0 + 120.0*nlH(vec2(bayI, 29.0));
  float dyc = fy - shTop*(0.5 - 0.5*cos(6.2832*(uTime/shPer + nlH(vec2(bayI, 31.0)))));
  col += uPaleLamp*(shOn*boxCov(xr, max(fw.x*4.0, 1e-4), 3.6, 4.4)*hd*(0.06*step(fy, shTop)*(0.6 + 0.4*step(0.5, fract(fy/6.0))) + 2.6*exp(-dyc*dyc/(6.0 + wY*wY))));
  // light spilled on the sill and round the embrasure, close by: it shows the plate its joints
  float halo = (1.0 - wfar)*wm*open*bright*hd*exp(-max(sdBox(cf - vec2(0.5, 0.4667), vec2(wh, 0.2167)), 0.0)*20.0)*(1.0 - covFull);
  col += metal*uLamp*halo*1.5;
  // ---- the great gate: two leaves of ribbed plate standing open on the lit hall within
  float gx = fx - uGate.x, gw = fwidth(fx);
  float inGate = f0*(1.0 - smoothstep(uGate.y - gw, uGate.y + gw, abs(gx)))*(1.0 - smoothstep(uGate.z - gw, uGate.z + gw, fy));
  float gap = boxCov(gx, gw, -1.1, 1.1);
  vec3 leaf = metal*(vec3(0.012) + uPaleLamp*(1.1*exp(-abs(gx)*0.7) + 0.2*exp(-abs(gx)*0.2)));
  leaf *= (0.7 + 0.3*step(0.14, fract(fy/2.8333)))*(0.85 + 0.15*step(0.08, fract(abs(gx)/1.75)));
  vec3 hall = uPaleLamp*(1.5 + 2.4*exp(-fy/12.0))*(0.8 + 0.2*step(0.5, fract(fy/5.6667)));
  col = mix(col, mix(leaf, hall, gap), inGate);
  float gfr = f0*(1.0 - inGate)*exp(-max(sdBox(vec2(gx, fy - uGate.z*0.5), vec2(uGate.y, uGate.z*0.5)), 0.0)*0.16);
  col += metal*uPaleLamp*gfr*0.5;
  // ---- the second great opening, passed on the climb: the hall of the watch, three floors high and a bay wide, open to
  // the night along its whole front behind a rail: a lit ceiling with its beams, lamps hung in a row, a back wall of doors
  // in tiers, and the watch standing at the rail
  // (polish round 1, P3b: the same hall is drawn for a great embrasure, at its own place, on any face; the hall of the
  // watch is drawn exactly as before)
  vec4 HP = uPort; float hOn = f0, eS = 0.0, hWarm = 0.55, eK = 0.0;
  if (embZF > 0.5) { HP = vec4(eC, 18.0, 9.0); hOn = 1.0; eS = bayI*13.0 + cityJ*7.0; hWarm = 0.05 + 0.3*nlH(vec2(bayI, cityJ) + 61.0); eK = 1.0; }    // (second part, G3a: in the house's amber)
  vec2 so = vec2(fx - HP.x, fy - HP.y);
  float inP = hOn*(1.0 - smoothstep(HP.z - gw, HP.z + gw, abs(so.x)))*(1.0 - smoothstep(HP.w - gw, HP.w + gw, abs(so.y)));
  if (inP > 0.001) {
    vec3 D = -V; float dz = max(-D.z, 0.02);
    float tb1 = 18.0/dz;
    float tx = D.x > 0.0 ? (HP.z - so.x)/max(D.x, 1e-4) : (-HP.z - so.x)/min(D.x, -1e-4);
    float ty = D.y > 0.0 ? (HP.w - so.y)/max(D.y, 1e-4) : (-HP.w - so.y)/min(D.y, -1e-4);
    float t = min(tb1, min(tx, ty));
    vec3 hp = vec3(so + D.xy*t, dz*t);
    float isBack = step(tb1, t + 1e-4), isY = (1.0 - isBack)*step(ty, t + 1e-4), isCeil = isY*step(0.0, D.y), isFloor = isY*step(D.y, 0.0);
    vec3 dl = hp - vec3(0.0, HP.w - 2.0, 13.0); dl.x = mod(hp.x + 3.0, 6.0) - 3.0;      // a lamp every 6 m, 2 m under the ceiling, 13 m inside
    float I = 1.0/(1.0 + dot(dl, dl)*0.03);
    vec3 alb = vec3(0.4, 0.39, 0.37);
    vec2 bc = vec2(hp.x/3.0, (hp.y + HP.w)/6.0), bf = fract(bc);
    float dh = nlH(floor(bc) + 71.0);
    float door = isBack*step(abs(bf.x - 0.5), 0.22)*step(bf.y, 0.62)*step(0.08, bf.y);
    alb = mix(alb, mix(vec3(0.27, 0.26, 0.245), vec3(0.5, 0.48, 0.44), step(0.55, dh)), door);
    alb *= 1.0 - 0.4*isBack*step(bf.y, 0.06);
    alb = mix(alb, vec3(0.13, 0.11, 0.095)*(0.92 + 0.08*step(0.04, fract(hp.x/3.0))), isFloor);
    alb = mix(alb, vec3(0.5, 0.47, 0.42)*(1.0 - 0.5*step(fract(hp.z/4.5), 0.12)), isCeil);
    vec3 hallC = mix(uLamp, uPaleLamp, hWarm);
    vec3 hall2 = hallC*alb*(0.12 + 0.95*I);
    vec2 pp = so + D.xy*(1.0/dz);
    // the watch at the rail: small and many, in knots and gaps, of unlike heights
    float pcx = pp.x/0.8, ph2 = nlH(vec2(floor(pcx), 77.0 + eS));
    float pxm = (fract(pcx) - 0.5)*0.8 - (ph2 - 0.5)*0.34 - 0.03*sin(uTime*(0.5 + ph2) + ph2*40.0), pym = (pp.y + HP.w)/(0.84 + 0.24*fract(ph2*7.3));
    float sdp = min(length(vec2(pxm, pym - 1.62)) - 0.13, sdBox(vec2(pxm, pym - 0.78), vec2(0.2, 0.72)) - 0.05);
    float aaP = gw*0.75 + 0.01;
    float man = step(0.2 + 0.6*nlN(vec2(floor(pcx)*0.29, 5.0)), ph2)*(1.0 - smoothstep(-aaP, aaP, sdp));
    float lift = step(0.86, ph2)*(0.8 + 0.2*sin(uTime*1.7 + ph2*20.0));
    float lgd = length(vec2(pxm - 0.3, pym - 1.5 - 0.6*lift));
    float rail = 1.0 - smoothstep(0.03, 0.06 + gw, abs(so.y + HP.w - 1.15));
    hall2 = mix(hall2, uLamp*0.012, max(man, rail*0.6));
    hall2 += uPaleLamp*step(0.86, ph2)*(2.2*exp(-lgd*lgd/0.008) + 0.2*exp(-lgd*lgd/0.1));
    // (second part, G3a: an embrasure is no brighter than the windows round it (0.4 of the hall of the watch), and piers
    // 0.9 m wide stand in its opening every 6 m)
    float pierE = eK*(1.0 - smoothstep(0.45 - gw, 0.45 + gw, abs(mod(so.x, 6.0) - 3.0)));
    col = mix(col, hall2*(hd*mix(1.0, 0.4, eK)), inP*(1.0 - pierE));
  }
  col += metal*mix(uLamp, uPaleLamp, hWarm)*(hOn*(1.0 - inP)*0.14*exp(-max(sdBox(so, HP.zw), 0.0)*mix(0.22, 1.2, step(0.5, embZF))));
  // ---- the light of the great gallery on the wall round its mouths and on the piers between them
  float gsd = sdBox(vec2(fx - 0.5*(uGal.x + uGal.y), fy - 0.5*(uGal.z + uGal.w)), vec2(0.5*(uGal.y - uGal.x), 0.5*(uGal.w - uGal.z)));
  col += metal*uLamp*(f0*uGalK*exp(-max(gsd, 0.0)*0.09));
  // ---- the smoke that lies against the face, then the air between
  float T = mix(1.0, smokeT(vW, V, dist), f0);
  col = col*T + vec3(0.007, 0.0055, 0.005)*(1.0 - T);
  col = mix(col, nlSky(-V), nlFogAmount(vW, uFog.w));
  gl_FragColor = vec4(col, 1.0);
}`;

function faceGeometry() {
  const NX = 24, NY = 32, pos = [], aF = [], idx = [];
  for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), base = pos.length / 3;
    for (let j = 0; j <= NY; j++) {
      // rows are closer together low down, where the flight is
      const y = PYR.apex * Math.pow(j / NY, 1.6), z = faceZ(y), hw = z;
      for (let i = 0; i <= NX; i++) {
        const x = -hw + 2 * hw * (i / NX);
        pos.push(x * ca + z * sa, y, -x * sa + z * ca); aF.push(x, y, f);
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const p = base + j * (NX + 1) + i, q = p + NX + 1;
      idx.push(p, p + 1, q, p + 1, q + 1, q);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(aF, 3)); g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// ------------------------------------------------------------------------------------------------ 5. the gallery
// A tiny mesh builder: quads and boxes with a colour and a kind (0 plain plate, 1 the tiered back wall, 2 floor, 3 emissive).
class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; this.k = []; this.i = []; }
  quad(a, b, c, d, col, kind = 0) {       // a, b, c, d counter-clockwise seen from the front
    const base = this.p.length / 3, u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const q of [a, b, c, d]) { this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.k.push(kind); }
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  box(x0, y0, z0, x1, y1, z1, col, kind = 0) {
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, kind); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, kind);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, kind); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, kind);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, kind); this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, kind);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.k, 1));
    g.setIndex(this.i); g.computeBoundingSphere();
    return g;
  }
}

const GAL_LIGHT = /* glsl */`
uniform vec3 uLampP[14]; uniform vec3 uLampC, uGalAmb, uPortalC; uniform vec3 uPortalP;
vec3 galLight(vec3 P, vec3 N, vec3 V, vec3 alb, float gloss){
  vec3 c = alb*uGalAmb;
  vec3 R = reflect(-V, N);
  for (int i = 0; i < 14; i++) {
    vec3 dl = uLampP[i] - P; float r2 = dot(dl, dl), inv = inversesqrt(r2 + 1e-3);
    float a = 1.0/(1.0 + r2*0.005);
    c += alb*uLampC*a*(0.3 + 0.7*max(dot(N, dl)*inv, 0.0));
    float sp = max(dot(R, dl*inv), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    c += uLampC*gloss*sp*a;
  }
  vec3 dp = uPortalP - P; float p2 = dot(dp, dp);
  c += alb*uPortalC*(0.3 + 0.7*max(dot(N, dp)*inversesqrt(p2 + 1e-3), 0.0))/(1.0 + p2*0.004);
  return c;
}`;
const GAL_VS = /* glsl */`
attribute vec3 color; attribute float aKind;
varying vec3 vW, vN, vC; varying float vK;
void main(){
  vC = color; vK = aKind; vN = normal;
  vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const GAL_FS = /* glsl */`
precision highp float;
${NL_GLSL}
${GAL_LIGHT}
uniform vec3 uLamp, uPaleLamp; uniform vec4 uArch;      // the arch in the east wall: z centre, y of the spring line, radius, y of its foot
varying vec3 vW, vN, vC; varying float vK;
float boxCov(float x, float w, float a, float b){ return clamp((min(x + 0.5*w, b) - max(x - 0.5*w, a))/max(w, 1e-5), 0.0, 1.0); }
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 toEye = cameraPosition - vW; vec3 V = toEye/max(length(toEye), 1e-3);
  if (dot(N, V) < 0.0) N = -N;
  if (vK > 4.5 && vK < 5.5) {                                         // the east wall: cut the arch out of it
    vec2 q = vec2(abs(vW.z - uArch.x), vW.y);
    float inA = q.y < uArch.y ? step(q.x, uArch.z)*step(uArch.w, q.y) : step(length(vec2(q.x, q.y - uArch.y)), uArch.z);
    if (inA > 0.5) discard;
  }
  vec3 alb = vC; float gloss = 0.0; vec3 emis = vec3(0.0);
  if (vK > 0.5 && vK < 1.5) {                             // the back wall: tiers of inner windows
    vec2 c = vec2(vW.x/4.0, (vW.y - 160.0)/6.5), fw = max(fwidth(c), vec2(1e-5));
    vec2 ci = floor(c), cf = c - ci;
    float h = nlH(ci + 3.1), h2 = nlH(ci + 17.0);
    float cov = boxCov(cf.x, fw.x, 0.31, 0.69)*boxCov(cf.y, fw.y, 0.3, 0.74)*step(ci.y, 4.5);
    float lit = step(0.32, h)*(0.6 + 0.4*h2)*(0.88 + 0.12*sin(uTime*(1.2 + 2.0*h2) + h*40.0));
    vec2 pp = (cf - vec2(0.5, 0.3))*vec2(4.0, 6.5);       // a watcher in the opening
    float who = step(0.45, h2)*(1.0 - smoothstep(0.0, 0.05, min(length(pp - vec2((h - 0.5)*0.8, 0.95)) - 0.13, max(abs(pp.x - (h - 0.5)*0.8) - 0.22, pp.y - 0.78))));
    emis = mix(uLamp, uPaleLamp, step(0.85, h))*(1.15*lit*cov*(1.0 - 0.95*who)*(0.6 + 0.7*cf.y));
    alb *= 1.0 - 0.5*cov;
  } else if (vK > 1.5 && vK < 2.5) {                      // the floor: plates, worn and bright
    vec2 g = vW.xz/4.0, gf = 0.5 - abs(fract(g) - 0.5), gw = max(fwidth(g), vec2(1e-5));
    float ln = max(1.0 - smoothstep(0.0, 1.5*gw.x + 0.006, gf.x), 1.0 - smoothstep(0.0, 1.5*gw.y + 0.006, gf.y))*clamp(0.05/(max(gw.x, gw.y) + 0.05), 0.0, 1.0);
    alb *= (0.9 + 0.2*nlH(floor(g)))*(1.0 - 0.4*ln);
    gloss = 0.5*(0.6 + 0.4*nlN(vW.xz*0.7));
  } else if (vK > 2.5 && vK < 3.5) {
    emis = vC*4.0; alb = vec3(0.0);
  } else if (vK > 6.5) {                                  // the wall of the face in section: five plates thick, jointed at every floor
    float dp = (1200.0 - 0.325*vW.y) - vW.z;
    float l1 = 0.5 - abs(fract(dp/1.4) - 0.5), lw = fwidth(dp/1.4), l2 = 0.5 - abs(fract(vW.y/6.0) - 0.5), hw = fwidth(vW.y/6.0);
    float ln = max(1.0 - smoothstep(0.0, 1.5*lw + 0.02, l1), 0.7*(1.0 - smoothstep(0.0, 1.5*hw + 0.006, l2)));
    alb *= (0.8 + 0.35*nlH(floor(vec2(dp/1.4, vW.y/6.0))))*(1.0 - 0.55*ln);
    gloss = 0.15;
  }
  vec3 col = galLight(vW, N, V, alb, gloss) + emis;
  gl_FragColor = vec4(nlFog(col, vW), 1.0);
}`;

// A standing figure: robe, shoulders, head, one arm and (for some) a lamp in the hand. Local: feet at the origin,
// facing +Z. aPart: 0 body, 1 head, 2 arm at the shoulder, 3 arm at the hand, 4 lamp.
export function figureGeometry() {
  const p = [], n = [], k = [], idx = [];
  const ring = (y, rx, rz) => [[rx, y, 0], [0, y, rz], [-rx, y, 0], [0, y, -rz]];
  const add = (v, nn, part) => { p.push(v[0], v[1], v[2]); const l = Math.hypot(nn[0], nn[1], nn[2]) || 1; n.push(nn[0] / l, nn[1] / l, nn[2] / l); k.push(part); return p.length / 3 - 1; };
  const r0 = ring(0, 0.27, 0.2), r1 = ring(1.36, 0.25, 0.13);
  const a0 = r0.map((v) => add(v, [v[0], 0.1, v[2]], 0)), a1 = r1.map((v) => add(v, [v[0], 0.35, v[2]], 0));
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(a0[i], a0[j], a1[j], a0[i], a1[j], a1[i]); }
  const neck = add([0, 1.5, 0], [0, 1, 0], 0);
  for (let i = 0; i < 4; i++) idx.push(a1[i], a1[(i + 1) % 4], neck);
  const hc = [0, 1.61, 0.01], hr = 0.115;
  const hv = [[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]].map((d) => add([hc[0] + d[0] * hr, hc[1], hc[2] + d[2] * hr], d, 1));
  const ht = add([hc[0], hc[1] + hr * 1.2, hc[2]], [0, 1, 0], 1), hb = add([hc[0], hc[1] - hr * 1.2, hc[2]], [0, -1, 0], 1);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(hv[i], hv[j], ht, hv[j], hv[i], hb); }
  // the arm: a thin quad from the shoulder; the vertex shader swings its far end
  const s0 = add([0.19, 1.36, 0], [1, 0, 0.3], 2), s1 = add([0.27, 1.3, 0], [1, 0, 0.3], 2), h0 = add([-0.035, 0, 0], [1, 0, 0.3], 3), h1 = add([0.035, 0, 0], [1, 0, 0.3], 3);
  idx.push(s0, s1, h1, s0, h1, h0);
  const l = [[-0.07, -0.02, 0], [0.07, -0.02, 0], [0.07, 0.16, 0], [-0.07, 0.16, 0]].map((v) => add(v, [0, 0, 1], 4));
  idx.push(l[0], l[1], l[2], l[0], l[2], l[3]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(k, 1)); g.setIndex(idx);
  return g;
}
// pose shared by the figure and by whatever it holds (the armoured men's discs): the turn toward the traveller, the arm
export const FIG_POSE = /* glsl */`
attribute vec4 aPos;       // x, y, z, the way the figure faces
attribute vec4 aVar;       // height scale, hash, colour seed, carries a lamp
uniform vec3 uEye; uniform float uWave;
float figYaw(){
  vec2 toC = uEye.xz - aPos.xz; float dC = length(toC);
  float yawC = atan(toC.x, toC.y + 1e-4);
  float dy = mod(yawC - aPos.w + 3.14159265, 6.2831853) - 3.14159265;
  return aPos.w + dy*(1.0 - smoothstep(22.0, 75.0, dC))*0.9*uWave;
}
float figRaise(){
  float h = aVar.y, dC = length(uEye.xz - aPos.xz);
  return uWave*(1.0 - smoothstep(9.0, 38.0, dC))*(0.55 + 0.45*fract(h*7.7)) + 0.07*sin(uTime*(1.1 + h) + h*50.0);
}
vec3 figHand(float raise){
  float h = aVar.y;
  float th = mix(0.75, 2.75, clamp(raise, 0.0, 1.0)) + 0.1*sin(uTime*2.3 + h*31.0)*raise;
  return vec3(0.23, 1.33, 0.0) + 0.6*vec3(0.12*sin(th), -cos(th), sin(th));
}
vec3 figPlace(vec3 p, float yaw){
  float h = aVar.y;
  float sw = sin(uTime*(0.7 + 0.6*fract(h*3.3)) + h*40.0);
  p.x += 0.035*sw*p.y; p.z += 0.02*cos(uTime*0.9 + h*17.0)*p.y;
  p *= aVar.x;
  float cy = cos(yaw), sy = sin(yaw);
  return vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy) + aPos.xyz;
}`;
const FIG_VS = (indoor) => /* glsl */`
${NL_GLSL}
${indoor ? GAL_LIGHT : ''}
${FIG_POSE}
attribute float aPart;
uniform vec3 uLampHand; uniform float uArmour;
varying vec3 vCol; varying vec3 vEmis; varying vec3 vWp;
void main(){
  float h = aVar.y;
  float yaw = figYaw(), raise = figRaise();
  vec3 p = position;
  float lampOn = step(0.5, aVar.w);
  vec3 hand = figHand(raise);
  if (aPart > 2.5 && aPart < 3.5) p += hand;
  if (aPart > 3.5) p = hand + p*lampOn*(1.0 - uArmour);
  if (aPart > 0.5 && aPart < 1.5) p.z += 0.03*raise;
  vec3 wp = figPlace(p, yaw);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 N = normalize(vec3(normal.x*cy + normal.z*sy, normal.y, -normal.x*sy + normal.z*cy));
  vec3 toE = cameraPosition - wp; vec3 V = toE/max(length(toE), 1e-3);
  // cloth: greys, browns, dull blues, a few pale; the head a shade of skin. The men at the ring are in grey armour.
  float cs = aVar.z;
  vec3 cloth = mix(mix(vec3(0.075, 0.07, 0.07), vec3(0.12, 0.085, 0.06), step(0.35, cs)), mix(vec3(0.06, 0.075, 0.105), vec3(0.2, 0.18, 0.16), step(0.88, cs)), step(0.62, cs));
  vec3 alb = aPart > 0.5 && aPart < 1.5 ? vec3(0.3, 0.2, 0.15) : cloth*(0.7 + 0.5*fract(h*13.0));
  alb = mix(alb, vec3(0.13, 0.137, 0.155)*(0.8 + 0.4*fract(h*13.0)), uArmour);
  // an armoured man stands in the cold clear light of the disc in his own right hand
  vec3 self = uArmour*alb*vec3(0.72, 0.83, 1.0)*(0.1 + 0.75*max(dot(normalize(normal), vec3(0.64, 0.3, 0.7)), 0.0));
  ${indoor ? 'vCol = galLight(wp, N, V, alb, 0.0) + alb*uLampHand*lampOn*raise*0.6;' : 'vCol = nlLight(wp, N, V, alb, 0.8) + self;'}
  vEmis = aPart > 3.5 ? uLampHand*3.5 : vec3(0.0);
  vWp = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;
const FIG_FS = /* glsl */`
precision highp float;
${NL_GLSL}
varying vec3 vCol; varying vec3 vEmis; varying vec3 vWp;
void main(){ gl_FragColor = vec4(nlFog(vCol + vEmis, vWp), 1.0); }`;
// figures: [[x, y, z, facing, scale, hash, colour seed, lamp], ...]
export function makeFigures(shared, list, opts = {}) {
  const g0 = figureGeometry(), g = new THREE.InstancedBufferGeometry();
  g.index = g0.index; for (const k of ['position', 'normal', 'aPart']) g.setAttribute(k, g0.attributes[k]);
  const n = list.length, aPos = new Float32Array(n * 4), aVar = new Float32Array(n * 4);
  let cx = 0, cy = 0, cz = 0;
  list.forEach((f, i) => { aPos.set([f[0], f[1], f[2], f[3]], i * 4); aVar.set([f[4], f[5], f[6], f[7]], i * 4); cx += f[0] / n; cy += f[1] / n; cz += f[2] / n; });
  let r = 0; for (const f of list) r = Math.max(r, Math.hypot(f[0] - cx, f[1] - cy, f[2] - cz));
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); g.setAttribute('aVar', new THREE.InstancedBufferAttribute(aVar, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), r + 3);
  const uniforms = { ...shared.uniforms, ...(opts.uniforms || {}), uEye: { value: new THREE.Vector3(0, -1e4, 0) }, uWave: { value: opts.wave ?? 1 },
    uLampHand: { value: new THREE.Color(opts.lamp || '#FFD79A') }, uArmour: { value: opts.armour ? 1 : 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: FIG_VS(!!opts.indoor), fragmentShader: FIG_FS, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, mat); mesh.name = opts.name || 'figures';
  return { mesh, uniforms, count: n, triangles: n * (g0.index.count / 3), aPos: g.attributes.aPos, aVar: g.attributes.aVar, sphere: g.boundingSphere };
}

const LAMP_XS = [0, 1, 2, 3, 4, 5, 6].map((i) => GAL.x0 + (i + 0.5) * (GAL.x1 - 8 - GAL.x0) / 7);
const ARCH = { x: 524, z: 1125, foot: 163, spring: 179, r: 10 };
function buildGallery(ctx, shared, hu, opts) {
  const { x0, x1, y0, y1 } = GAL, zB = GAL.zBack, zF0 = faceZ(y0), zF1 = faceZ(y1), xE = ARCH.x;
  const A = new Acc(), metal = [0.16, 0.175, 0.2], dark = [0.07, 0.075, 0.09], floorC = [0.2, 0.2, 0.21];
  A.quad([x0, y0, zF0], [x1, y0, zF0], [x1, y0, zB], [x0, y0, zB], floorC, 2);                       // floor
  A.quad([x0, y1, zB], [x1, y1, zB], [x1, y1, zF1], [x0, y1, zF1], metal, 0);                         // ceiling
  A.quad([x0, y0, zB], [x1, y0, zB], [x1, y1, zB], [x0, y1, zB], metal, 1);                           // back wall, tiers of windows
  A.quad([x0, y0, zF0], [x0, y0, zB], [x0, y1, zB], [x0, y1, zF1], metal, 0);                         // west end
  A.quad([xE, y0, zB], [xE, y0, zF0], [xE, y1, zF1], [xE, y1, zB], metal, 5);                         // east end, with the arch cut out of it
  // the niche behind the arch
  A.quad([x1, ARCH.foot, zB + 4], [x1, ARCH.foot, zF1 - 2], [x1, y1 - 3, zF1 - 2], [x1, y1 - 3, zB + 4], dark, 0);
  A.quad([xE, ARCH.foot, ARCH.z - ARCH.r - 1], [x1, ARCH.foot, ARCH.z - ARCH.r - 1], [x1, y1 - 3, ARCH.z - ARCH.r - 1], [xE, y1 - 3, ARCH.z - ARCH.r - 1], dark, 0);
  A.quad([x1, ARCH.foot, ARCH.z + ARCH.r + 1], [xE, ARCH.foot, ARCH.z + ARCH.r + 1], [xE, y1 - 3, ARCH.z + ARCH.r + 1], [x1, y1 - 3, ARCH.z + ARCH.r + 1], dark, 0);
  A.quad([xE, ARCH.foot, ARCH.z + ARCH.r + 1], [x1, ARCH.foot, ARCH.z + ARCH.r + 1], [x1, ARCH.foot, ARCH.z - ARCH.r - 1], [xE, ARCH.foot, ARCH.z - ARCH.r - 1], floorC, 2);
  // the moulding of the arch: two piers and a ring of voussoir-less plain plate, standing 0.7 m proud of the wall
  const xm = xE - 0.7, ro = ARCH.r + 2.6;
  A.box(xm, y0, ARCH.z - ro, xE, ARCH.spring, ARCH.z - ARCH.r, metal, 0); A.box(xm, y0, ARCH.z + ARCH.r, xE, ARCH.spring, ARCH.z + ro, metal, 0);
  const NS = 18;
  for (let i = 0; i < NS; i++) {
    const a0 = Math.PI * i / NS, a1 = Math.PI * (i + 1) / NS;
    const P = (a, r, x) => [x, ARCH.spring + Math.sin(a) * r, ARCH.z + Math.cos(a) * r];
    A.quad(P(a0, ARCH.r, xm), P(a1, ARCH.r, xm), P(a1, ro, xm), P(a0, ro, xm), metal, 0);              // face
    A.quad(P(a0, ARCH.r, xE), P(a1, ARCH.r, xE), P(a1, ARCH.r, xm), P(a0, ARCH.r, xm), dark, 0);       // soffit
    A.quad(P(a0, ro, xm), P(a1, ro, xm), P(a1, ro, xE), P(a0, ro, xE), metal, 0);                      // back
  }
  // the dais: seven broad steps up to the gateway
  for (let k = 0; k < 7; k++) A.box(500 + 2 * k, y0, 1109 + k * 0.5, xE, y0 + (k + 1) * 3 / 7, 1141 - k * 0.5, [0.24, 0.24, 0.25], 2);
  // the wall the gallery opens through: the piers between its mouths and the lintel over them, cut through 7 m of plate
  const TW_ = GAL.wall, hd = GAL.head, zFh = faceZ(hd), cut = [0.3, 0.31, 0.34];
  for (const [a, b] of GAL_PIERS) {
    for (const x of [a, b]) A.quad([x, y0, zF0], [x, y0, zF0 - TW_], [x, hd, zFh - TW_], [x, hd, zFh], cut, 7);
    A.quad([a, y0, zF0 - TW_], [b, y0, zF0 - TW_], [b, hd, zFh - TW_], [a, hd, zFh - TW_], metal, 0);
  }
  A.quad([x0, hd, zFh], [x1, hd, zFh], [x1, hd, zFh - TW_], [x0, hd, zFh - TW_], cut, 7);                 // the lintel's soffit
  A.quad([x0, hd, zFh - TW_], [x1, hd, zFh - TW_], [x1, y1, zF1 - TW_], [x0, y1, zF1 - TW_], metal, 0);   // and its inner face
  // parapet along the open front, and the ledges of the tiers along the back wall
  A.box(x0, y0, zF0 - 0.9, x1, y0 + 1.2, zF0, metal, 0);
  const tiers = [];
  for (let k = 1; k <= 4; k++) { const y = y0 + 6.5 * k; tiers.push(y); A.box(x0, y - 0.4, zB, xE, y, zB + 2.4, metal, 0); A.box(x0, y, zB + 2.2, xE, y + 1.0, zB + 2.4, dark, 0); }
  // fourteen hanging lamps: a rod, a cap, a lantern
  const lamps = [];
  for (const z of [zB + 9, zB + 27]) for (const x of LAMP_XS) {
    const drop = z > zB + 20 ? 8.5 : 10.5, yb = y1 - drop;
    lamps.push(new THREE.Vector3(x, yb + 0.6, z));
    A.box(x - 0.07, yb + 1.3, z - 0.07, x + 0.07, y1, z + 0.07, dark, 6); A.box(x - 0.6, yb + 1.2, z - 0.6, x + 0.6, yb + 1.45, z + 0.6, dark, 6);
    A.box(x - 0.42, yb, z - 0.42, x + 0.42, yb + 1.2, z + 0.42, [1.0, 0.62, 0.25], 3);
  }
  const uniforms = { ...shared.uniforms, uLamp: hu.uLamp, uPaleLamp: hu.uPaleLamp,
    uLampP: { value: lamps }, uLampC: { value: new THREE.Color(1.0, 0.6, 0.24).multiplyScalar(0.36 * (opts.galLight ?? 1)) }, uGalAmb: { value: new THREE.Color(0.045, 0.027, 0.012) },
    uPortalP: { value: new THREE.Vector3(519, 171, 1125) }, uPortalC: { value: new THREE.Color(0.72, 0.83, 1.0).multiplyScalar(0.55) },
    uArch: { value: new THREE.Vector4(ARCH.z, ARCH.spring, ARCH.r, ARCH.foot) } };
  const vs = GAL_VS.replace('vec4 wp = modelMatrix*vec4(position, 1.0);', `vec3 pp = position;
  if (aKind > 2.5 && aKind < 3.5 || aKind > 5.5 && aKind < 6.5) { float hang = ${y1.toFixed(1)} - pp.y; pp.x += hang*0.03*sin(uTime*0.83 + pp.x*0.045); pp.z += hang*0.022*sin(uTime*0.61 + pp.x*0.07 + 1.3); }
  vec4 wp = modelMatrix*vec4(pp, 1.0);`).replace('attribute vec3 color;', 'uniform float uTime; attribute vec3 color;');
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: GAL_FS, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(A.geometry(), mat); mesh.name = 'gallery';
  // ---- the crowd
  const rng = opts.streams.crowd, list = [], N = Math.round((opts.crowd ?? 2400));
  const person = (x, y, z, face) => list.push([x, y, z, face, rng.range(0.9, 1.1) * (rng.chance(0.12) ? 0.68 : 1), rng(), rng(), rng.chance(0.3) ? 1 : 0]);
  const nPar = Math.round(N * 0.17), nTier = Math.round(N * 0.17), nFloor = N - nPar - nTier;
  for (let i = 0; i < nPar; i++) person(rng.range(x0 + 1, xE - 1), y0, zF0 - 1.5 - rng.range(0, 1.4) * rng(), rng.range(-0.5, 0.5));
  for (let i = 0; i < nTier; i++) { const t = rng.pick(tiers); person(rng.range(x0 + 1, xE - 2), t, zB + rng.range(0.9, 1.8), rng.range(-0.4, 0.4)); }
  let guard = 0;
  while (list.length < N && guard++ < N * 20) {
    // thickest toward the open front and toward the gateway; the dais and the way up to it are kept clear
    const x = x0 + 2 + (xE - x0 - 4) * Math.pow(rng(), 0.8), z = zB + 3.2 + (zF0 - 3.2 - zB - 3.2) * Math.pow(rng(), 0.75);
    if (x > 496 && z > 1107 && z < 1143) continue;
    if (x > 430 && Math.abs(z - 1125) < 3.2 + (x - 430) * 0.012) continue;
    person(x, y0, z, rng.chance(0.6) ? rng.range(-0.9, 0.9) : rng.range(0.6, 2.4));
  }
  // nobody stands inside a pier: whoever fell there steps to the nearer side of it
  for (const f of list) if (f[2] > zF0 - TW_ - 0.8) for (const [a, b] of GAL_PIERS) if (f[0] > a - 0.7 && f[0] < b + 0.7) f[0] = f[0] - a < b - f[0] && a - 4 > x0 ? a - 0.7 - 2.5 * f[5] : b + 0.7 + 2.5 * f[5];
  const crowd = makeFigures(shared, list, { indoor: true, name: 'crowd', uniforms: { uLampP: uniforms.uLampP, uLampC: uniforms.uLampC, uGalAmb: uniforms.uGalAmb, uPortalP: uniforms.uPortalP, uPortalC: uniforms.uPortalC } });
  return { mesh, crowd, uniforms, lamps, triangles: A.i.length / 3 + crowd.triangles };
}

// ------------------------------------------------------------------------------------------------ 5b. balconies
// The making of the house in the watch's quarters (between the great gate and the great gallery): before one bay in
// two of each open floor stands a long balcony of plate with a rail, and here and there before a single room a small
// one; people of the house stand on them, some with lamps. Which bays and which rooms: the seed's (its own stream).
const BAL_FS = /* glsl */`
precision highp float;
${NL_GLSL}
uniform vec3 uLamp;
varying vec3 vW, vN, vC; varying float vK;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  // lit by the rooms: the deck by its own floor, the underside by the floor below, the rail's inner face by the room behind
  float fl = 0.88 + 0.12*sin(uTime*1.3 + vW.x*0.7);
  vec3 col = vC*(vec3(0.05, 0.053, 0.068) + uLamp*((0.5*max(N.y, 0.0) + 0.42*max(-N.y, 0.0) + 0.5*max(-N.z, 0.0) + 0.04*max(N.z, 0.0) + 0.12*abs(N.x))*fl));
  gl_FragColor = vec4(nlFog(col, vW), 1.0);
}`;
function buildBalconies(shared, hu, rng, PORT) {
  const A = new Acc(), plate = [0.3, 0.31, 0.34], dark = [0.16, 0.17, 0.2], list = [];
  const deck = (xa, xb, y, deep, people) => {
    const zf = faceZ(y), z1 = zf + deep;
    A.box(xa, y - 0.35, zf - 0.3, xb, y, z1, plate, 0);
    A.box(xa, y, z1 - 0.12, xb, y + 1.05, z1, dark, 0);                                   // the rail
    A.box(xa, y, zf, xa + 0.12, y + 1.05, z1, dark, 0); A.box(xb - 0.12, y, zf, xb, y + 1.05, z1, dark, 0);
    for (let i = 0; i < people; i++) list.push([rng.range(xa + 0.5, xb - 0.5), y, zf + rng.range(0.55, deep - 0.45), rng.range(-0.6, 0.6), rng.range(0.9, 1.1) * (rng.chance(0.12) ? 0.68 : 1), rng(), rng(), rng.chance(0.45) ? 1 : 0]);
  };
  // the long ones: the open floors are every tenth (60, 120, 180 m); the bays stand between piers 48 m apart
  const xW = GATE.x - 60, xE = GAL.x1;
  for (const y of [60, 120, 180]) for (let x = Math.ceil(xW / 48) * 48; x + 48 <= xE + 1; x += 48) {
    const here = rng.chance(1 / 2), n = rng.int(7, 15);
    if (!here || (y > GAL.y0 - 12 && x + 48 > GAL.x0 - 2)) continue;                      // none across the gallery's own mouths
    deck(x + 9, x + 47, y + 1.3, 2.8, n);
  }
  // the small ones: a single room's, on any floor of the watch but the open ones
  for (let i = 0; i < 110; i++) {
    const col = rng.int(Math.ceil((xW + 1200) / 4), Math.floor((xE + 1200) / 4) - 1), fl = rng.int(3, Math.floor((GAL.y1 + 36) / 6)), n = rng.int(1, 2);
    const x = col * 4 - 1200, y = fl * 6;
    if (col % 12 < 2 || fl % 10 === 0) continue;                                          // not on a pier, not on an open floor
    if (Math.abs(x + 2 - GATE.x) < GATE.w / 2 + 6 && y < GATE.h + 8) continue;
    if (x + 4 > GAL.x0 - 4 && y + 6 > GAL.y0 - 4 && y < GAL.y1 + 8) continue;
    if (Math.abs(x + 2 - PORT.x) < PORT.hw + 4 && Math.abs(y + 3 - PORT.y) < PORT.hh + 4) continue;
    deck(x + 0.5, x + 3.5, y + 1.4, 1.7, n);
  }
  const mesh = new THREE.Mesh(A.geometry(), new THREE.ShaderMaterial({ uniforms: { ...shared.uniforms, uLamp: hu.uLamp }, vertexShader: GAL_VS, fragmentShader: BAL_FS, side: THREE.DoubleSide }));
  mesh.name = 'balconies';
  const people = makeFigures(shared, list, { name: 'balcony-people', wave: 1 });
  return { mesh, people, triangles: A.i.length / 3 + people.triangles };
}

// ------------------------------------------------------------------------------------------------ 6. buildHero
// opts: { shared, streams ({ windows, crowd }: the seeded streams), lit (share of windows lit, 0.35 .. 0.85), crowd (people in the gallery), galLight (0..1) }
export async function buildHero(ctx, opts = {}) {
  if (!opts.streams) opts = { ...opts, streams: { windows: ctx.rng.fork('windows'), crowd: ctx.rng.fork('crowd') } };
  const own = !opts.shared, shared = opts.shared || makeShared();
  const group = new THREE.Group(); group.name = 'last-house';
  const tex = await makeWindowTexture(ctx, { lit: opts.lit ?? 0.7, rng: opts.streams.windows });
  await ctx.yield();
  const cityRng = opts.streams.cities || ctx.core.makeRng(ctx.core.hashSeed('cities:' + ctx.seed));
  const balRng = opts.streams.balconies || ctx.core.makeRng(ctx.core.hashSeed('balconies:' + ctx.seed)), PORT = hallOfWatch(balRng);
  const hu = {
    ...shared.uniforms,
    uWin: { value: tex }, uTex: { value: new THREE.Vector2(TW, TH) },
    uGal: { value: new THREE.Vector4(GAL.x0, GAL_PIERS[5][0], GAL.y0, GAL.head) }, uGate: { value: new THREE.Vector3(GATE.x, GATE.w / 2, GATE.h) },
    uMetal: { value: new THREE.Color('#5F656E') }, uLamp: { value: new THREE.Color('#FFC46B') }, uPaleLamp: { value: new THREE.Color('#FFE3B4') },
    uGreet: { value: new THREE.Vector2(-1000, 0) }, uWinE: { value: 3.0 }, uWake: { value: 1 }, uGalK: { value: 0.36 * (opts.galLight ?? 1) },
    // the night lamps: two rooms asleep in three keep one (a rule of the house, at every hour); their colour
    uDim: { value: 2 / 3 }, uDimLamp: { value: new THREE.Color(0.56, 0.7, 1.0) },
    // the watch's quarters: centre and half breadth along the face (from 60 m west of the gate to the gallery's east end), their top
    uWatch: { value: new THREE.Vector3(0.5 * (GATE.x - 60 + GAL.x1), 0.5 * (GAL.x1 - GATE.x + 60), GAL.y1 + 36) },
    uPort: { value: new THREE.Vector4(PORT.x, PORT.y, PORT.hw, PORT.hh) },
    // polish round 1 (P3): the cities' own deal, from their own stream: two offsets that say which bays have a great
    // embrasure, which ribs a shaft, which stretches sleep; one bay in eight has an embrasure, one rib in six a shaft
    uCity: { value: new THREE.Vector4(cityRng.range(0, 97), cityRng.range(0, 97), 1 / 8, 1 / 6) },
  };
  const faceMat = new THREE.ShaderMaterial({ uniforms: hu, vertexShader: FACE_VS, fragmentShader: FACE_FS });
  const face = new THREE.Mesh(faceGeometry(), faceMat); face.name = 'face'; group.add(face);
  await ctx.yield();
  const gal = buildGallery(ctx, shared, hu, opts);
  group.add(gal.mesh); group.add(gal.crowd.mesh);
  await ctx.yield();
  const bal = buildBalconies(shared, hu, balRng, PORT);
  group.add(bal.mesh); group.add(bal.people.mesh);
  await ctx.yield();
  const eye = new THREE.Vector3();
  return {
    object: group, radius: 150, height: 210, center: new THREE.Vector3(330, 150, 1150),
    anchors: { portal: new THREE.Vector3(520, 171, 1125), gate: new THREE.Vector3(GATE.x, 0, PYR.half), arch: ARCH, lamps: gal.lamps },
    shared, uniforms: hu, gallery: gal, texture: tex,
    triangles: 4 * 24 * 32 * 2 + gal.triangles + bal.triangles, balconies: bal,
    setGreet(height, strength) { hu.uGreet.value.set(height, strength); },
    update(dt, time, camera) {
      eye.setFromMatrixPosition(camera.matrixWorld);
      gal.crowd.uniforms.uEye.value.copy(eye); bal.people.uniforms.uEye.value.copy(eye);
      if (own) { shared.uniforms.uTime.value = time; const l = Math.hypot(eye.x, eye.z) || 1; shared.uniforms.uPyrDir.value.set(-eye.x / l, -eye.z / l); }
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
