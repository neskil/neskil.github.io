// THE TURNING NIGHT: hero set piece "The Sky Wheel and its drain".
//
// WHAT IT IS
//   1. A full sky dome painted in impasto oil strokes that never stop moving. Every dash is a real
//      procedural brushstroke (capsule with ragged bristle ends and a ridge/furrow height profile)
//      advected along a flow field: a slow rotation of the whole sky about the zenith, eleven star
//      whirlpools whose concentric rings counter-rotate, and the Sky Wheel, a double spiral 75 x 30
//      degrees up and to the left of the valley axis. A fat orange crescent hangs dead ahead, 14
//      degrees up, inside a halo of three rings of radial dashes.
//   2. The drain: setDrain(0..1) opens a sink at the moon. The Wheel slides 20 degrees toward it and
//      pulls out into a feeding arm, star rings shear into the current, the halo spins up.
//   3. The moon gate: real geometry round the 14 m exit portal. A painted hoop, three rings of radial
//      dash strokes stepped out toward the camera as a funnel (the halo "lifted off the dome"), orbiting
//      flecks, and (with drain) a double spiral of 1400 big strokes that pours down a 300 m funnel
//      round the approach line into the ring.
//   4. A mirror: the same sky function sampled along the reflected ray and broken into horizontal
//      dashes (hero.makeMirrorMaterial() for the world's river; a preview lake is built by default).
//
// SPACE  Origin = crest of the far hill directly under the portal, +Y up. The camera arrives from +Z
//   flying toward -Z, climbing 14 degrees. The dome is at infinity (it follows the camera passed to
//   update()), so only the gate has a place: portal centre (0,13,0), tilted 14 degrees.
//   radius 20 m / height 34 m describe the gate rings; the drain funnel reaches 300 m back along the
//   approach line and up to ~75 m from it (never nearer than 7.5 m to that line).
//
// ANCHORS (local space, plain arrays)
//   portalSeat   { position, normal (unit, toward the incoming camera), pitchDeg: 14, radius: 7 }
//                use portal { shape:'circle', radius:7, tilt:true } with the last path leg along approachDir.
//   approachDir  unit direction of the final climb (0, sin14, -cos14). It points exactly at the moon.
//   flyThrough   ordered points down the approach line, 290 m out -> portal centre. Everything the
//                hero builds stays at least 7.5 m from this line.
//   haloMatchDistance  44: metres out at which the 14 m portal exactly fills the dome's inner halo ring.
//   moonDir, wheelDir  unit directions on the dome (wheelDir is where the reveal should look).
//   stars        [{ dir, radius (rad), spin (+1/-1), period (s) }] the eleven whirlpools.
//   riverLevel   suggested y of the mirror relative to the crest (-78).
//
// PROGRESS (never wall-clock)
//   hero.setProgress(u)  maps the world's path u: drain = smoothstep(0.70,0.93,u), arrive = smoothstep(0.88,0.97,u)
//   hero.setDrain(x)     0..1 sink strength (sky spirals into the halo, funnel strokes appear)
//   hero.setArrive(x)    0..1 crescent slides round the rim, thins and vanishes; dome halo hands over
//                        to the real rings. Drive it so that it reaches ~0.8 about 44 m from the portal.
//   hero.flowAt(dir, out) CPU copy of the sky velocity field: tangent velocity (rad/s) at a unit
//                        direction, so crows and smoke can ride the same current (dir += out*dt; normalize).
//   hero.makeMirrorMaterial({ dim, rowHeight }) ShaderMaterial for any horizontal (world +Y) water
//                        plane; shares the sky uniforms, so it drains with the sky.
//   hero.uniforms        the shared uniform table (uDrain, uArrive, uGain, uBump, uSync, uWeave ...).
//   hero.setDrain(x, accum)  accum (optional): seconds of drain integrated along the path, a pure function
//                        of u supplied by the world, so ring spin-up never depends on flight speed.
//   hero.setSync(x)      0..1 rare event: every star whirlpool and every ring turns the same way (a second
//                        baked field), the rings all go chrome yellow, and the Wheel slides 15 degrees down
//                        toward the village roofs like a breaking wave.
//   uWeave               canvas-weave frequency in radians per pixel (the world sets it from the buffer size).
//
// OPTS  palette (7 hex: ultramarine, cobalt, cerulean, chrome yellow, viridian, cypress black-green, orange),
//   mirror (default true: preview lake at riverLevel; pass false in the world and use makeMirrorMaterial),
//   drain / arrive (initial values), gate (default true), stream (default 1400 funnel strokes),
//   gateGlow (default 1: multiplier on the emissive of the three gate rings).
//
// COST  about 30k triangles, 3 draw calls (dome, strokes, mirror), two 512 px data textures, ~120 ms build.
//   The dome fragment shader is the cost: 18 stroke tests + 5 texture taps per pixel.
//
// LIGHT  Expects none. Colour is pigment; the only shading is a view-space "gallery light" from
//   (-0.6, 0.6, 0.5) raking the paint relief. Star cores, moon, halo and gate are emissive (2-5) and
//   bloom; everything else stays under 0.8. Scene fog is respected by gate and mirror; the dome only
//   takes a little fog colour at the horizon. Wants a night grade: bloom threshold ~0.9, exposure ~1.1.
//
// STYLE (for the world coder to match): a stroke is a capsule in (along, across) coordinates;
//   it is cut where |along| > 1 - 0.3*hash(bristle index) (ragged ends, 8 bristles across), its height
//   is tnProf(across) = dome + cosine bristle ridges + raised edges, the across-slope tilts the
//   normal about the stroke axis, and shade = 0.62 + 0.75*N.L plus a pow-40 varnish glint with
//   L fixed in VIEW space. One flat pigment per stroke, value jitter +-18 %, 2.5 % orange flecks.
import * as THREE from 'three';

const DEF_PALETTE = ['#0B1A4A', '#2348A8', '#7FB2E5', '#F6D54A', '#1E4E5A', '#14261E', '#F08A24'];
const PMAX = 1.75, FN = 512, VMAX = 0.1, TAU = Math.PI * 2;
const PITCH = 14 * Math.PI / 180;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// azimuthal-equidistant sky chart: p = (dir.xz / |dir.xz|) * zenithAngle
function dirToP(d, out) {
  const th = Math.acos(Math.max(-1, Math.min(1, d.y))), h = Math.hypot(d.x, d.z) || 1e-6;
  out.x = d.x / h * th; out.y = d.z / h * th; return out;
}
function pToDir(px, py, out) {
  const th = Math.hypot(px, py) || 1e-6, s = Math.sin(th);
  return out.set(s * px / th, Math.cos(th), s * py / th);
}
function dirFromAzEl(azDeg, elDeg) { // az measured from -Z (the valley axis), positive toward +X
  const a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180;
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

// ---- the baked part of the flow field: sky rotation + waves + eleven star whirlpools ----
async function bakeField(rng, moonP, wheelP, wheelEx, wheelEy, hand, ctx) {
  const vx = new Float32Array(FN * FN), vy = new Float32Array(FN * FN);
  const sv = new Float32Array(FN * FN), par = new Uint8Array(FN * FN);
  const turn = rng.range(0.009, 0.014) * rng.sign();
  const waves = [];
  for (let i = 0; i < 5; i++) {
    const a = rng.range(0, TAU), k = rng.range(2.4, 6.0);
    waves.push({ kx: Math.cos(a) * k, ky: Math.sin(a) * k, ph: rng.range(0, TAU), A: rng.range(0.006, 0.011) / k });
  }
  const step = 2 * PMAX / FN;
  for (let j = 0; j < FN; j++) {
    const py = -PMAX + (j + 0.5) * step;
    for (let i = 0; i < FN; i++) {
      const px = -PMAX + (i + 0.5) * step;
      let x = -py * turn, y = px * turn;
      for (let w = 0; w < 5; w++) { const W = waves[w], c = W.A * Math.cos(W.kx * px + W.ky * py + W.ph); x += c * W.ky; y -= c * W.kx; }
      const o = j * FN + i; vx[o] = x; vy[o] = y;
    }
    if (j % 8 === 7) await ctx.yield();
  }
  // place the stars: big ones first, rejection sampled, neighbours counter-rotate
  const stars = [], radii = [];
  for (let i = 0; i < 11; i++) radii.push(rng.range(0.052, 0.122));
  radii.sort((a, b) => b - a);
  for (let i = 0; i < 11; i++) {
    const R = radii[i];
    let best = null;
    for (let t = 0; t < 400 && !best; t++) {
      const th = Math.sqrt(rng.range(0.25 * 0.25, 1.36 * 1.36));
      let phi = rng.range(0, TAU);
      if (rng.chance(0.62)) phi = -Math.PI / 2 + rng.range(-1.25, 1.25); // most of them ahead of the flight
      const x = Math.cos(phi) * th, y = Math.sin(phi) * th;
      if (Math.hypot(x - moonP.x, y - moonP.y) < 0.36 + R) continue;
      const dx = x - wheelP.x, dy = y - wheelP.y;
      const lx = (dx * wheelEx.x + dy * wheelEx.y) / 0.62, ly = (dx * wheelEy.x + dy * wheelEy.y) / 0.30;
      if (lx * lx + ly * ly < (1 + R * 2) * (1 + R * 2)) continue;
      let ok = true;
      for (const s of stars) if (Math.hypot(x - s.x, y - s.y) < (R + s.R) * 1.3 + 0.03) { ok = false; break; }
      if (ok) best = { x, y };
    }
    if (!best) continue;
    let spin = rng.sign(), nd = 1e9;
    for (const s of stars) { const d = Math.hypot(best.x - s.x, best.y - s.y); if (d < nd) { nd = d; spin = -s.spin; } }
    stars.push({ x: best.x, y: best.y, R, n: R > 0.085 ? 4 : 3, spin, period: rng.range(9, 20) });
  }
  const wx = vx.slice(), wy = vy.slice();          // the "in step" field: every ring of every star turns with the Wheel
  for (const s of stars) {
    const om = TAU / s.period, ext = s.R * 2.4, Rc = s.R / s.n;
    const i0 = Math.max(0, Math.floor((s.x - ext + PMAX) / step)), i1 = Math.min(FN - 1, Math.ceil((s.x + ext + PMAX) / step));
    const j0 = Math.max(0, Math.floor((s.y - ext + PMAX) / step)), j1 = Math.min(FN - 1, Math.ceil((s.y + ext + PMAX) / step));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = -PMAX + (i + 0.5) * step - s.x, dy = -PMAX + (j + 0.5) * step - s.y, r = Math.hypot(dx, dy);
      if (r > ext) continue;
      const xr = r * s.n / s.R; let g, k = Math.min(s.n - 1, Math.floor(xr));
      if (xr < s.n) { const sn = Math.sin(Math.PI * xr); g = Math.sign(sn) * Math.sqrt(Math.abs(sn)); }
      else { const t = (xr - s.n) / 1.1; g = ((s.n % 2) ? -1 : 1) * 1.7 * t * Math.exp(-t); }
      const o = j * FN + i, sp = s.spin * om * g;
      vx[o] += -dy * sp; vy[o] += dx * sp;
      const sq = hand * om * 1.5 * Math.abs(g);
      wx[o] += -dy * sq; wy[o] += dx * sq;
      const st = r < Rc ? 1 - 0.25 * r / Rc : 0.75 * Math.max(0, 1 - (r - Rc) / (1.25 * s.R - Rc));
      if (st > sv[o]) { sv[o] = st; par[o] = (k % 2) ? 255 : 0; }
    }
  }
  const data = new Uint8Array(FN * FN * 4);
  for (let o = 0; o < FN * FN; o++) {
    data[o * 4] = 128 + Math.round(Math.max(-1, Math.min(1, vx[o] / VMAX)) * 127);
    data[o * 4 + 1] = 128 + Math.round(Math.max(-1, Math.min(1, vy[o] / VMAX)) * 127);
    data[o * 4 + 2] = Math.round(sv[o] * 255);
    data[o * 4 + 3] = par[o];
    if (o % 16384 === 16383) await ctx.yield();
  }
  const data2 = new Uint8Array(FN * FN * 4);
  for (let o = 0; o < FN * FN; o++) {
    data2[o * 4] = 128 + Math.round(Math.max(-1, Math.min(1, wx[o] / VMAX)) * 127);
    data2[o * 4 + 1] = 128 + Math.round(Math.max(-1, Math.min(1, wy[o] / VMAX)) * 127);
    data2[o * 4 + 3] = 255;
    if (o % 16384 === 16383) await ctx.yield();
  }
  const mkTex = (d) => {
    const tex = new THREE.DataTexture(d, FN, FN, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = false; tex.needsUpdate = true;
    return tex;
  };
  return { tex: mkTex(data), tex2: mkTex(data2), vx, vy, stars };
}

// ---- GLSL shared by the dome and the mirror: the painted sky as a function of direction ----
const GLSL_SKY = /* glsl */`
#define TN_CELL 0.022
#define TN_LIFE 1.6
#define TN_PMAX 1.75
uniform sampler2D uField, uField2;
uniform float uTime, uDrain, uArrive, uWheelHand, uCresAng, uGain, uSync, uWeave;
uniform vec2 uMoonP, uWheelP, uWheelEx, uWheelEy;
uniform vec3 uMoonDir, uMoonX, uMoonY, uSpin;
uniform vec3 uPal[7];

vec4 tnHash4(vec2 p){ vec4 p4 = fract(p.xyxy*vec4(.1031,.1030,.0973,.1099)); p4 += dot(p4, p4.wzxy+33.33); return fract((p4.xxyz+p4.yzzw)*p4.zywx); }
float tnHash1(float n){ return fract(sin(n*12.9898)*43758.5453); }
// brush relief across a stroke (a = -1..1): dome + bristle ridges + raised edges
float tnProf(float a, float id){ float a2 = a*a; return (1.0-a2*a2)*0.55 + 0.22*cos(a*9.0+id*37.0) + 0.23*smoothstep(0.5,0.9,abs(a)); }
float tnSlope(float a, float id){ return (tnProf(a+0.1,id)-tnProf(a-0.1,id))*5.0; }
vec2 tnFieldUv(vec2 p){ return clamp(p/(2.0*TN_PMAX)+0.5, 0.002, 0.998); }

vec2 tnWheelLocal(vec2 p, float side, out float fall){
  vec2 c = uWheelP + uWheelEx*side*0.25*(1.0-0.45*uDrain);
  vec2 d = p - c; vec2 dl = vec2(dot(d,uWheelEx)/0.30, dot(d,uWheelEy)/0.19);
  fall = exp(-dot(dl,dl)*0.9); return dl;
}
// sky velocity in chart space (rad/s): baked rotation + waves + stars, the Wheel, the moon sink
vec2 tnVel(vec2 p, out vec4 f){
  f = texture2D(uField, tnFieldUv(p));
  vec2 fv = mix(f.rg, texture2D(uField2, tnFieldUv(p)).rg, uSync);      // rare event: the stars fall into step
  vec2 v = (fv*255.0 - 128.0)/127.0*0.1*(1.0-0.4*uDrain);
  for (int s = 0; s < 2; s++){
    float fall; vec2 dl = tnWheelLocal(p, s == 0 ? -1.0 : 1.0, fall);
    vec2 vl = uWheelHand*0.262*vec2(-dl.y,dl.x) - 0.05*dl;
    v += (uWheelEx*vl.x*0.30 + uWheelEy*vl.y*0.19)*fall;
  }
  vec2 dm = p - uMoonP; float rm = length(dm)+1e-4; vec2 rn = dm/rm;
  float k = uDrain*smoothstep(0.02,0.12,rm);
  v += k*(-rn*0.045*(0.4+0.5/(rm+0.4)) + vec2(-rn.y,rn.x)*uWheelHand*0.105/(rm+0.4));
  float sp = length(v); if (sp > 0.13) v *= 0.13/sp;
  return v;
}

void tnLayer(vec2 p, vec2 v, vec2 fd, float sp, float ph, float seed, inout float bestZ, inout vec2 bestC, inout float bestA, inout vec2 bestD, inout vec4 bestH){
  float cyc = floor(ph), fr = ph - cyc; cyc = mod(cyc, 61.0);
  float grow = smoothstep(0.0, 0.42, 1.0 - abs(2.0*fr-1.0));
  vec2 q = (p - v*(fr-0.5)*TN_LIFE)/TN_CELL;
  vec2 ic = floor(q);
  float hl = 0.62*(1.0+5.0*sp);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 cell = ic + vec2(float(i), float(j));
    vec4 h = tnHash4(cell + vec2(seed*37.7 + cyc*5.13, cyc*9.71 - seed*11.3));
    vec2 d = q - (cell + 0.5 + (h.xy-0.5)*0.6);
    vec2 sd = normalize(fd + vec2(-fd.y,fd.x)*(h.z-0.5)*0.45);
    float L = min(1.05, hl*(0.75+0.5*h.w))*grow, W = 0.20*(0.7+0.6*h.z)*(0.4+0.6*grow);
    float l = dot(d,sd)/max(L,1e-3), a = dot(d, vec2(-sd.y,sd.x))/W;
    float al = abs(l), aa = abs(a);
    if (aa < 1.0 && al < 1.0){
      float en = 1.0 - 0.3*tnHash1(floor(a*4.0+4.0) + h.x*71.0);
      float z = fract(h.x*7.13 + h.y*3.71);
      if (al < en && aa < 1.0 - 0.45*pow(al/en, 5.0) && z > bestZ){ bestZ = z; bestC = p - d*TN_CELL; bestA = a; bestD = sd; bestH = h; }
    }
  }
}

// one flat pigment per stroke, chosen at the stroke centre
vec3 tnPigment(vec2 cp, vec4 h, out float em){
  em = 0.0;
  vec4 f = texture2D(uField, tnFieldUv(cp));
  float e = 1.5708 - length(cp);
  vec3 ultra = uPal[0], cobalt = uPal[1], cer = uPal[2], yel = uPal[3], vir = uPal[4], org = uPal[6];
  vec3 white = vec3(0.78,0.82,0.74);
  float r = h.x;
  vec3 c = r < 0.50 ? cobalt : (r < 0.72 ? mix(ultra, cobalt, 0.5)*1.25 : (r < 0.93 ? cer : mix(cobalt, vir, 0.6)*1.3));
  if (r > 0.988) c = org*0.7;
  float hb = smoothstep(0.30, 0.04, e);
  if (h.y < hb*0.85) c = mix(vir*1.6, cer, fract(h.z*3.7));
  // the Sky Wheel: two interlocked spiral lobes of cerulean and white
  float wf = 0.0, arm = 0.0, rr = 1.0;
  for (int s = 0; s < 2; s++){
    float sd = s == 0 ? -1.0 : 1.0, fall; vec2 dl = tnWheelLocal(cp, sd, fall);
    if (fall > wf){ wf = fall; rr = length(dl);
      arm = sin(atan(dl.y,dl.x) - uWheelHand*uTime*0.262 + uWheelHand*4.2*log(rr+0.08) + sd*1.57); }
  }
  if (h.y < smoothstep(0.10,0.45,wf)){
    c = arm > 0.0 ? (h.z < 0.6 ? white : mix(cer, white, 0.4)) : (h.z < 0.5 ? cobalt*1.15 : cer*0.9);
    if (rr < 0.30 && h.z < 0.75){ c = mix(white, yel, 0.45 + 0.4*smoothstep(0.2,0.05,rr)); em = 0.5*smoothstep(0.3,0.08,rr); }
  }
  // feeding arm from the Wheel to the moon while draining
  vec2 ab = uMoonP - uWheelP; float t = clamp(dot(cp-uWheelP,ab)/dot(ab,ab), 0.0, 1.0);
  float ds = length(cp - uWheelP - ab*t);
  float rm = length(cp - uMoonP);
  float feed = uDrain*max(exp(-ds*ds/0.014), 0.55*exp(-rm*2.2));
  if (h.w < feed*0.75) c = h.x < 0.45 ? white : (h.x < 0.8 ? cer : yel);
  // stars: yellow-white core, rings alternating chrome yellow and pale cerulean
  float s = f.b;
  if (s > 0.74){ c = mix(yel, white*1.1, smoothstep(0.84,1.0,s)*0.7); em = 1.3 + 2.4*smoothstep(0.8,1.0,s); }
  else if (h.y < smoothstep(0.0,0.22,s)*1.2){
    vec3 a = mix(yel, white, 0.25), b = mix(cer, white, 0.55);
    bool warm = f.a > 0.5 || h.w < uSync*1.1;
    vec3 sc = warm ? (h.z < 0.8 ? a : b) : (h.z < 0.6 ? b : a);
    c = mix(mix(cer, white, 0.2), sc, smoothstep(0.03,0.22,s));
    em = (warm ? 1.0 + 0.5*uSync : 0.45)*smoothstep(0.12,0.7,s);
  }
  // the halo's glow stains nearby strokes yellow-green
  c = mix(c, mix(yel, vir*2.0, 0.35), 0.3*smoothstep(0.34,0.08,rm));
  return c*(0.82+0.36*h.w);
}

// moon crescent and its three rings of radial dashes, painted over the strokes
void tnMoon(vec3 dir, inout vec3 alb, inout vec3 emis, inout vec3 bump, inout float mask){
  float cm = dot(dir, uMoonDir);
  if (cm < 0.9) return;
  vec2 m = vec2(dot(dir,uMoonX), dot(dir,uMoonY));
  float r = acos(min(cm,1.0)); float ang = atan(m.y, m.x);
  vec3 yel = uPal[3], org = uPal[6], yg = mix(uPal[3], uPal[4]*2.2, 0.3);
  vec3 t3 = normalize(cross(uMoonDir, dir) + vec3(1e-5,0.0,0.0));
  float hand = 1.0 - smoothstep(0.25, 0.9, uArrive);
  emis += yg*0.07*smoothstep(0.30,0.05,r)*hand;
  for (int k = 0; k < 3; k++){
    float fk = float(k), N = 46.0 + 10.0*fk, r0 = 0.158 + 0.049*fk, hl = 0.016 - 0.0015*fk;
    float an = (ang + uSpin[k] + 6.2832*4.0)/(6.2832/N); float cell = mod(floor(an), N); float fa = fract(an);
    vec4 h = tnHash4(vec2(cell, 7.0+fk*13.0));
    float a = (fa-0.5)*2.0/(0.5+0.22*h.x);
    float l = (r - r0 - hl - (h.y-0.5)*0.007)/(hl*(0.75+0.5*h.z));
    if (abs(a) < 1.0 && abs(l) < 1.0 - 0.3*tnHash1(floor(a*3.0+3.0)+h.w*53.0) && hand > 0.01){
      vec3 c = mix(yg, h.w < 0.3 ? yel : yg*0.9, 0.6)*(0.8+0.4*h.z);
      float E = (1.5 - 0.33*fk)*(0.8+0.35*uDrain)*hand;
      alb = mix(alb, c, hand); emis = mix(emis, c*E*(0.6+0.5*tnProf(a,h.w)), hand);
      bump = t3*tnSlope(a,h.w); mask = 1.0;
    }
  }
  // crescent: disc minus the hollow in which the portal grows; slides round the rim with uArrive
  vec2 mp = normalize(m + vec2(1e-6,0.0))*r;
  float R0 = mix(0.060, 0.172, uArrive), thin = pow(1.0-uArrive, 1.4);
  float ca = uCresAng + uArrive*3.9; vec2 off = vec2(cos(ca), sin(ca))*0.031*thin;
  float R1 = R0 + 0.021*thin;
  float d1 = length(mp - off);
  if (r > R0 && d1 < R1 && thin > 0.01){
    float w = (d1 - (R1-0.05))*190.0;
    float hh = 0.5+0.5*cos(w) ; float sl = -sin(w)*1.2;
    vec3 c = mix(org, yel, smoothstep(0.012,0.0,r-R0)*0.6 + 0.25*hh);
    alb = c; emis = c*(2.4+1.2*hh); bump = normalize(cross(t3, dir))*sl; mask = 1.0;
  } else {
    emis += org*0.5*exp(-max(d1-R1,0.0)*38.0)*thin*step(R0, r);
  }
}

// albedo of the painted sky toward dir; emis = HDR glow, bump = relief gradient (local space)
vec3 tnPaint(vec3 dir, out vec3 emis, out vec3 bump, out float mask){
  float th = acos(clamp(dir.y,-1.0,1.0));
  vec2 az = normalize(dir.xz + vec2(1e-5,0.0));
  vec2 p = az*th;
  vec4 f; vec2 v = tnVel(p, f);
  float sp = length(v); vec2 fd = v/max(sp,1e-4);
  float bestZ = -1.0, bestA = 0.0; vec2 bestC = p, bestD = fd; vec4 bestH = vec4(0.0);
  float ph = uTime/TN_LIFE;
  tnLayer(p, v, fd, sp, ph, 0.0, bestZ, bestC, bestA, bestD, bestH);
  tnLayer(p, v, fd, sp, ph+0.5, 1.0, bestZ, bestC, bestA, bestD, bestH);
  float e = 1.5708 - th, hb = smoothstep(0.30,0.04,e);
  vec3 alb; emis = vec3(0.0); bump = vec3(0.0); mask = 0.0;
  if (bestZ >= 0.0){
    float em; alb = tnPigment(bestC, bestH, em);
    float sl = tnSlope(bestA, bestH.w);
    vec2 g = vec2(-bestD.y, bestD.x)*sl;
    vec3 eth = vec3(az.x*cos(th), -sin(th), az.y*cos(th)), eph = vec3(-az.y, 0.0, az.x);
    bump = eth*dot(g,az) + eph*dot(g, vec2(-az.y,az.x));
    emis = alb*em*(0.7+0.5*tnProf(bestA,bestH.w)); mask = 1.0;
  } else {
    alb = mix(uPal[0]*1.15, uPal[4]*0.9, hb*0.6);     // ultramarine ground between the dashes
    alb += uPal[3]*0.25*smoothstep(0.3,0.9,f.b);
  }
  float core = smoothstep(0.80,1.0,f.b);
  emis += (uPal[3]*1.6 + vec3(1.2))*core*core*1.3 + uPal[3]*0.22*f.b*f.b;        // white centre of each star
  tnMoon(dir, alb, emis, bump, mask);
  return alb;
}
`;

const GLSL_LIGHT = /* glsl */`
// view-space gallery light on paint relief
vec3 tnGallery(vec3 alb, vec3 emis, vec3 nv, float mask){
  vec3 L = normalize(vec3(-0.6,0.6,0.5));
  float d = clamp(dot(nv,L), 0.0, 1.0);
  float shade = 0.62 + 0.75*d;
  float spec = pow(max(dot(nv, normalize(L+vec3(0.0,0.0,1.0))), 0.0), 40.0)*mask;
  return alb*shade + spec*vec3(0.30,0.36,0.50) + emis*(0.75+0.45*d);
}
`;

const DOME_VS = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;   // a vertex exactly beside a level camera (see the world guide)
  gl_Position = p.xyww;
}`;
const DOME_FS = /* glsl */`
varying vec3 vDir;
uniform mat3 uL2W; uniform float uBump;
#ifdef USE_FOG
uniform vec3 fogColor;
#endif
${GLSL_SKY}
${GLSL_LIGHT}
void main(){
  vec3 dir = normalize(vDir);
  vec3 emis, bump; float mask;
  vec3 alb = tnPaint(dir, emis, bump, mask);
  vec3 n = normalize(-dir - bump*uBump);
  vec3 nv = normalize(mat3(viewMatrix)*(uL2W*n));
  vec3 col = tnGallery(alb, emis, nv, mask)*uGain;
  #ifdef USE_FOG
    col = mix(col, fogColor, 0.35*smoothstep(0.10,-0.03,dir.y));
  #endif
  col *= 0.93 + 0.07*sin(gl_FragCoord.x*uWeave)*sin(gl_FragCoord.y*uWeave);     // canvas tooth, fixed to the screen
  gl_FragColor = vec4(col, 1.0);
}`;

const MIRROR_VS = /* glsl */`
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const MIRROR_FS = /* glsl */`
varying vec3 vW;
uniform mat3 uL2W; uniform float uRowH, uDim;
#include <fog_pars_fragment>
${GLSL_SKY}
void main(){
  vec3 I = normalize(vW - cameraPosition);
  vec3 R = transpose(uL2W)*reflect(I, vec3(0.0,1.0,0.0));
  float el = asin(clamp(abs(R.y), 0.0, 1.0)), az = atan(R.x, -R.z);
  float rowf = el/uRowH, row = floor(rowf);
  vec4 hr = tnHash4(vec2(row, 3.0));
  float shiver = sin(uTime*(1.2+hr.x*1.6) + row*1.7)*0.006 + sin(uTime*0.5 + row*0.37)*0.010;
  float cw = 0.045 + 0.05*hr.y;
  float azs = (az + shiver + hr.z*6.2832)/cw, ci = floor(azs);
  vec4 hc = tnHash4(vec2(ci, row));
  float l = (azs - ci - 0.5)*2.0/(0.6+0.38*hc.x), a = (rowf - row - 0.5)*2.0/(0.66+0.3*hc.y);
  vec3 col = uPal[0]*0.55 + uPal[5]*0.25;                 // dark water between the dashes
  if (abs(a) < 1.0 && abs(l) < 1.0 - 0.25*tnHash1(floor(a*3.0+3.0) + hc.z*31.0)){
    float elc = (row+0.5)*uRowH + sin(uTime*0.9 + ci*2.3 + row)*uRowH*0.35;
    float azc = (ci+0.5)*cw - hr.z*6.2832 - shiver;
    vec3 dc = vec3(sin(azc)*cos(elc), sin(elc), -cos(azc)*cos(elc));
    vec3 emis, bump; float mask;
    vec3 alb = tnPaint(dc, emis, bump, mask);
    col = (mix(alb, uPal[1], 0.12)*(0.72+0.4*tnProf(a,hc.w)) + emis*0.6)*uDim*uGain;
  }
  col *= 0.93 + 0.07*sin(gl_FragCoord.x*uWeave)*sin(gl_FragCoord.y*uWeave);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- real strokes: the moon gate rings, hoop, flecks and the drain funnel ----
const STROKE_VS = /* glsl */`
attribute vec4 aA, aB, aC;   // aA: type, angle|s0, radius|armAngle, z|offset   aB: halfLen, halfWid, hash, spin group   aC: rgb, emissive
uniform vec4 uSpin4; uniform float uFlow, uDrain, uHand;
varying vec2 vUv; varying vec4 vCol; varying float vId; varying vec3 vSideV, vAxisV;
#include <fog_pars_vertex>
vec3 polar(float r, float a, float z){ return vec3(cos(a)*r, sin(a)*r, z); }
vec3 stream(float u, float a0, float off){
  float w = 1.0-u, z = 300.0*pow(w,1.35);
  float r = 8.3 + z*0.2 + off*(3.0+46.0*w);
  return polar(r, a0 + uHand*(7.0*u + 3.0*u*u*u), z+0.3);
}
void main(){
  float type = aA.x, l = position.x, hl = aB.x, hw = aB.y, hs = aB.z, g = aB.w, sc = 1.0;
  float sp = g < 0.5 ? uSpin4.x : (g < 1.5 ? uSpin4.y : (g < 2.5 ? uSpin4.z : (g < 3.5 ? uSpin4.w : uSpin4.x*(hs-0.5)*1.6)));
  vec3 P, P2;
  if (type < 0.5){ float an = aA.y + sp; P = polar(aA.z + l*hl, an, aA.w); P2 = polar(aA.z + l*hl + 0.2, an, aA.w); }
  else if (type < 1.5){ float an = aA.y + sp + l*hl/aA.z; P = polar(aA.z, an, aA.w); P2 = polar(aA.z, an+0.02, aA.w); }
  else {
    float u = fract(aA.y + uFlow*(0.75+0.5*hs)), uu = clamp(u + l*hl/380.0, 0.0, 1.0);
    P = stream(uu, aA.z, aA.w); P2 = stream(uu+0.002, aA.z, aA.w);
    sc = smoothstep(hs*0.75, hs*0.75+0.2, uDrain)*smoothstep(0.0,0.05,u)*(1.0-smoothstep(0.955,0.995,u));
    hw *= mix(1.0, 0.5, u);
  }
  vec4 wp = modelMatrix*vec4(P,1.0);
  vec3 ax = normalize((modelMatrix*vec4(P2,1.0)).xyz - wp.xyz);
  vec3 toC = cameraPosition - wp.xyz; float dist = length(toC);
  vec3 side = normalize(cross(ax, toC/dist));
  hw = max(hw, dist*0.0022);
  wp.xyz += side*position.y*hw*sc;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = sc < 0.01 ? vec4(2.0,2.0,2.0,1.0) : projectionMatrix*mvPosition;
  vUv = position.xy; vCol = aC; vId = hs;
  vSideV = mat3(viewMatrix)*side; vAxisV = mat3(viewMatrix)*ax;
  #include <fog_vertex>
}`;
const STROKE_FS = /* glsl */`
varying vec2 vUv; varying vec4 vCol; varying float vId; varying vec3 vSideV, vAxisV;
uniform float uDrain, uGain, uWeave;
#include <fog_pars_fragment>
float tnHash1(float n){ return fract(sin(n*12.9898)*43758.5453); }
float tnProf(float a, float id){ float a2 = a*a; return (1.0-a2*a2)*0.55 + 0.22*cos(a*9.0+id*37.0) + 0.23*smoothstep(0.5,0.9,abs(a)); }
float tnSlope(float a, float id){ return (tnProf(a+0.1,id)-tnProf(a-0.1,id))*5.0; }
${GLSL_LIGHT}
void main(){
  float a = vUv.y, al = abs(vUv.x);
  float en = 1.0 - 0.28*tnHash1(floor(a*4.0+4.0) + vId*71.0);
  if (al > en || abs(a) > 1.0 - 0.45*pow(al/en, 5.0)) discard;
  vec3 sv = normalize(vSideV), nf = normalize(cross(sv, normalize(vAxisV)));
  if (nf.z < 0.0) nf = -nf;
  vec3 nv = normalize(nf - sv*tnSlope(a, vId)*0.9);
  float pr = tnProf(a, vId);
  vec3 emis = vCol.rgb*vCol.a*(0.6+0.5*pr)*(1.0+0.2*uDrain);
  float wv = 0.93 + 0.07*sin(gl_FragCoord.x*uWeave)*sin(gl_FragCoord.y*uWeave);
  gl_FragColor = vec4(tnGallery(vCol.rgb, emis, nv, 1.0)*uGain*wv, 1.0);
  #include <fog_fragment>
}`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('turning-night-hero') : ctx.rng;
  const hexes = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PALETTE;
  // per-seed pigment shift: the blues lean violet or green, the yellow warmer or more lemon
  const hueB = rng.range(-0.018, 0.018), hueY = rng.range(-0.012, 0.012), val = rng.range(-0.03, 0.04);
  const pal = hexes.slice(0, 7).map((h, i) => new THREE.Color(h).offsetHSL((i === 3 || i === 6) ? hueY : hueB, 0, i < 3 ? val : 0));

  // ---- layout on the dome ----
  const hand = rng.sign();
  const moonDir = new THREE.Vector3(0, Math.sin(PITCH), -Math.cos(PITCH));
  const moonX = new THREE.Vector3(1, 0, 0), moonY = new THREE.Vector3().crossVectors(moonX, moonDir).normalize();
  const wheelDir0 = dirFromAzEl(-rng.range(32, 41), rng.range(33, 38));
  const moonP = dirToP(moonDir, new THREE.Vector2()), wheelP0 = dirToP(wheelDir0, new THREE.Vector2());
  const wheelEy = wheelP0.clone().normalize(), wheelEx = new THREE.Vector2(-wheelEy.y, wheelEy.x);
  const field = await bakeField(rng, moonP, wheelP0, wheelEx, wheelEy, hand, ctx);
  await ctx.yield();

  const U = {
    uField: { value: field.tex }, uTime: { value: 0 }, uDrain: { value: 0 }, uArrive: { value: 0 },
    uWheelHand: { value: hand }, uCresAng: { value: rng.range(-0.9, 0.2) }, uGain: { value: 1.15 },
    uMoonP: { value: moonP }, uWheelP: { value: wheelP0.clone() }, uWheelEx: { value: wheelEx }, uWheelEy: { value: wheelEy },
    uMoonDir: { value: moonDir }, uMoonX: { value: moonX }, uMoonY: { value: moonY }, uSpin: { value: new THREE.Vector3() },
    uPal: { value: pal }, uL2W: { value: new THREE.Matrix3() }, uBump: { value: 0.85 },
    uSpin4: { value: new THREE.Vector4() }, uFlow: { value: 0 }, uHand: { value: hand },
    uField2: { value: field.tex2 }, uSync: { value: 0 }, uWeave: { value: 1.5708 },
  };
  const withFog = (extra) => Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, extra || {});

  const root = new THREE.Group(); root.name = 'the-turning-night-hero';

  // ---- dome ----
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    uniforms: withFog(), vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide,
    depthWrite: false, depthTest: true, fog: true,
  }));
  dome.renderOrder = -0.9; dome.frustumCulled = false; dome.name = 'sky-wheel-dome';
  root.add(dome);

  // ---- mirror ----
  const RIVER_Y = -78;
  function makeMirrorMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: withFog({ uRowH: { value: o.rowHeight ?? 0.010 }, uDim: { value: o.dim ?? 0.8 } }),
      vertexShader: MIRROR_VS, fragmentShader: MIRROR_FS, fog: true,
    });
  }
  let mirror = null;
  if (opts.mirror !== false) {
    const g = new THREE.CircleGeometry(2600, 64); g.rotateX(-Math.PI / 2);
    mirror = new THREE.Mesh(g, makeMirrorMaterial()); mirror.position.y = RIVER_Y; mirror.name = 'preview-mirror';
    root.add(mirror);
  }
  await ctx.yield();

  // ---- moon gate + drain funnel: instanced impasto strokes ----
  const gate = new THREE.Group(); gate.name = 'moon-gate';
  gate.position.set(0, 13, 0); gate.rotation.x = PITCH;      // local +Z -> the approach line
  root.add(gate);
  if (opts.gate !== false) {
    const A = [], B = [], C = [];
    const yel = pal[3], org = pal[6], cer = pal[2], cob = pal[1];
    const yg = pal[3].clone().lerp(pal[4].clone().multiplyScalar(2.2), 0.3);
    const white = new THREE.Color(0.78, 0.82, 0.74);
    const tmp = new THREE.Color(), swhite = new THREE.Color(0.56, 0.62, 0.6);
    const push = (type, a, b, c, hl, hw, group, col, em) => {
      const j = 0.82 + 0.36 * rng();
      A.push(type, a, b, c); B.push(hl, hw, rng(), group); C.push(col.r * j, col.g * j, col.b * j, em);
    };
    const RN = [60, 68, 76], RR = [8.75, 11.6, 15.0], RL = [1.0, 1.1, 1.3], RZ = [0.4, 8, 20], RW = [0.26, 0.3, 0.36], RE = [1.45, 1.15, 0.9].map((e) => e * (opts.gateGlow ?? 1));
    for (let k = 0; k < 3; k++) for (let i = 0; i < RN[k]; i++) {
      const col = rng.chance(0.3) ? tmp.copy(yel) : (rng.chance(0.12) ? tmp.copy(white) : tmp.copy(yg));
      push(0, (i + rng.range(-0.22, 0.22)) / RN[k] * TAU, RR[k] + rng.range(-0.25, 0.25), RZ[k] + rng.range(-0.5, 0.5),
        RL[k] * rng.range(0.75, 1.2), RW[k] * rng.range(0.8, 1.25), k, col, RE[k] * rng.range(0.8, 1.15));
    }
    for (let i = 0; i < 36; i++) push(1, (i + rng.range(-0.2, 0.2)) / 36 * TAU, 7.32 + rng.range(-0.05, 0.05), 0.15, 0.8, 0.2 * rng.range(0.85, 1.2), 3,
      rng.chance(0.55) ? org : yel, rng.range(1.3, 1.9));
    for (let i = 0; i < 30; i++) push(1, (i + rng.range(-0.3, 0.3)) / 30 * TAU, 7.66 + rng.range(-0.05, 0.08), 0.3, 0.7, 0.13 * rng.range(0.85, 1.2), 3,
      rng.chance(0.5) ? cer : white, rng.range(0.3, 0.8));
    for (let i = 0; i < 150; i++) {
      const r = rng.range(9.5, 22);
      push(1, rng.range(0, TAU), r, (r - 8) * 1.6 + rng.range(-2, 3), rng.range(0.5, 1.2), rng.range(0.12, 0.2), 4,
        rng.pick([cer, cer, white, yel, cob]), rng.chance(0.3) ? rng.range(0.6, 1.4) : 0.1);
    }
    const NS = Math.max(0, Math.min(4000, opts.stream ?? 1400));
    for (let i = 0; i < NS; i++) {
      const r = rng(), col = r < 0.38 ? cer : r < 0.58 ? swhite : r < 0.78 ? cob : r < 0.95 ? yel : org;
      push(2, rng(), (i % 2) * Math.PI + rng.gauss() * 0.38, Math.pow(rng(), 1.6), rng.range(1.6, 3.8), rng.range(0.3, 0.62), 9,
        col, (col === yel || col === org) ? rng.range(0.7, 1.2) : 0.0);
    }
    const base = new THREE.PlaneGeometry(2, 2, 6, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4));
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 4));
    geo.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
    geo.instanceCount = A.length / 4;
    const strokes = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: withFog(), vertexShader: STROKE_VS, fragmentShader: STROKE_FS, side: THREE.DoubleSide, fog: true,
    }));
    strokes.frustumCulled = false; strokes.name = 'gate-strokes'; strokes.renderOrder = 1;
    gate.add(strokes);
  }
  await ctx.yield();

  // ---- state ----
  let drain = Math.min(1, Math.max(0, opts.drain ?? 0));
  let arrive = Math.min(1, Math.max(0, opts.arrive ?? 0));
  let spinBoost = 6 * drain * drain, flowBoost = 0.35 * drain, sync = 0;
  const wheelAngle = wheelDir0.angleTo(moonDir), wheelNow = new THREE.Vector3();
  const breakDir = dirFromAzEl(-9, 15), wq = new THREE.Vector3();        // low over the left-quay roofs
  const tv = new THREE.Vector3(), tp = new THREE.Vector2();
  function applyState() {
    U.uDrain.value = drain; U.uArrive.value = arrive;
    const t = drain * drain * (3 - 2 * drain) * Math.min(1, (20 * Math.PI / 180) / wheelAngle);
    const sA = Math.sin(wheelAngle);
    wheelNow.copy(wheelDir0).multiplyScalar(Math.sin((1 - t) * wheelAngle) / sA).addScaledVector(moonDir, Math.sin(t * wheelAngle) / sA).normalize();
    if (sync > 0) {                       // the Wheel breaks over the village: 15 degrees down toward the roofs
      const ang = Math.max(1e-3, wheelNow.angleTo(breakDir)), t2 = sync * sync * (3 - 2 * sync) * Math.min(1, (15 * Math.PI / 180) / ang), s2 = Math.sin(ang);
      wq.copy(wheelNow).multiplyScalar(Math.sin((1 - t2) * ang) / s2).addScaledVector(breakDir, Math.sin(t2 * ang) / s2).normalize();
      wheelNow.copy(wq);
    }
    U.uSync.value = sync;
    dirToP(wheelNow, U.uWheelP.value);
  }
  applyState();

  // CPU copy of tnVel: tangent velocity (rad/s) of the sky current at a unit direction
  function flowAt(dir, out = new THREE.Vector3()) {
    dirToP(dir, tp);
    const px = tp.x, py = tp.y;
    const fi = Math.min(FN - 1, Math.max(0, Math.floor((px / (2 * PMAX) + 0.5) * FN))), fj = Math.min(FN - 1, Math.max(0, Math.floor((py / (2 * PMAX) + 0.5) * FN)));
    const k0 = 1 - 0.4 * drain;
    let vx = field.vx[fj * FN + fi] * k0, vy = field.vy[fj * FN + fi] * k0;
    const wp = U.uWheelP.value;
    for (let s = -1; s <= 1; s += 2) {
      const cx = wp.x + wheelEx.x * s * 0.25 * (1 - 0.45 * drain), cy = wp.y + wheelEx.y * s * 0.25 * (1 - 0.45 * drain);
      const dx = px - cx, dy = py - cy, lx = (dx * wheelEx.x + dy * wheelEx.y) / 0.30, ly = (dx * wheelEy.x + dy * wheelEy.y) / 0.19;
      const fall = Math.exp(-(lx * lx + ly * ly) * 0.9), ux = (hand * 0.262 * -ly - 0.05 * lx) * 0.30 * fall, uy = (hand * 0.262 * lx - 0.05 * ly) * 0.19 * fall;
      vx += wheelEx.x * ux + wheelEy.x * uy; vy += wheelEx.y * ux + wheelEy.y * uy;
    }
    const mx = px - moonP.x, my = py - moonP.y, rm = Math.hypot(mx, my) + 1e-4, nx = mx / rm, ny = my / rm;
    const k = drain * sstep(0.02, 0.12, rm), kin = 0.045 * (0.4 + 0.5 / (rm + 0.4)), ksw = hand * 0.105 / (rm + 0.4);
    vx += k * (-nx * kin - ny * ksw); vy += k * (-ny * kin + nx * ksw);
    const sp = Math.hypot(vx, vy); if (sp > 0.13) { vx *= 0.13 / sp; vy *= 0.13 / sp; }
    const th = Math.hypot(px, py) || 1e-6, ax = px / th, ay = py / th, ct = Math.cos(th), st = Math.sin(th);
    const gr = vx * ax + vy * ay, gt = (-vx * ay + vy * ax) * (st / th);
    return out.set(ax * ct * gr - ay * gt, -st * gr, ay * ct * gr + ax * gt);
  }

  const ax = new THREE.Vector3(0, -Math.sin(PITCH), Math.cos(PITCH));    // from the portal back toward the camera
  const seat = new THREE.Vector3(0, 13, 0);
  const arr = (v) => [v.x, v.y, v.z];
  const anchors = {
    portalSeat: { position: arr(seat), normal: arr(ax), pitchDeg: 14, radius: 7 },
    approachDir: [0, Math.sin(PITCH), -Math.cos(PITCH)],
    flyThrough: [290, 220, 150, 90, 44, 0].map((d) => arr(seat.clone().addScaledVector(ax, d))),
    haloMatchDistance: 44,
    moonDir: arr(moonDir), wheelDir: arr(wheelDir0),
    stars: field.stars.map((s) => ({ dir: arr(pToDir(s.x, s.y, new THREE.Vector3())), radius: s.R, spin: s.spin, period: s.period })),
    riverLevel: RIVER_Y,
  };

  return {
    object: root, radius: 20, height: 34, center: new THREE.Vector3(0, 13, 0), anchors,
    ground: false, groundY: RIVER_Y,
    uniforms: U, dome, gate, mirror, makeMirrorMaterial, flowAt,
    setDrain(x, accum) {
      drain = Math.min(1, Math.max(0, x));
      // spin-up and funnel flow are functions of the drain (or of its integral along the path), never of dt
      if (accum === undefined) { spinBoost = 6 * drain * drain; flowBoost = 0.35 * drain; } else { spinBoost = 0.9 * accum; flowBoost = 0.05 * accum; }
      applyState();
    },
    setSync(x) { sync = Math.min(1, Math.max(0, x)); applyState(); },
    setArrive(x) { arrive = Math.min(1, Math.max(0, x)); applyState(); },
    setProgress(u) { arrive = sstep(0.88, 0.97, u); this.setDrain(sstep(0.70, 0.93, u)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      const s0 = hand * (time * 0.10 + spinBoost * 1.0), s1 = -hand * (time * 0.13 + spinBoost * 1.3), s2 = hand * (time * 0.16 + spinBoost * 1.6);
      U.uSpin4.value.set(s0, s1, s2, -hand * time * 0.07);
      U.uSpin.value.set(-s0, -s1, -s2);
      U.uFlow.value = time * 0.15 + flowBoost;
      root.updateMatrixWorld();
      U.uL2W.value.setFromMatrix4(root.matrixWorld);
      if (camera) { tv.setFromMatrixPosition(camera.matrixWorld); if (tv.lengthSq() === 0) tv.copy(camera.position); root.worldToLocal(tv); dome.position.copy(tv); }
    },
    dispose() { /* everything is reachable from object */ },
  };
}
