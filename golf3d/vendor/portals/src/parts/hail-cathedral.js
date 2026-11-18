// THE GREAT ILLUMINATION: hero set piece of "hail-cathedral".
//
// What it is
//   The updraft vault of a supercell seen from inside: a hollow, corkscrewing nave of cloud 2 km wide and
//   3 km tall whose wall is a helical lattice of cauliflower buttresses, narrowing to an 800 m throat. On cue a
//   discharge is born low in the wall and runs up the corkscrew, lighting the buttresses from inside one after
//   another like a procession of windows; as it passes camera height a branching channel walks across the nave
//   80 m in front of the lens and hangs, and a wave of teal and violet light climbs through the herd of
//   hailstones (lobed onions of clear and milky ice). Three companion stones ride beside the lens and sparkle
//   with freeze-sparks.
//
// Size and frame
//   Origin at the base centre of the vault, +Y up the axis. True size: anchors.vaultRadius (1000 m),
//   anchors.vaultHeight (3000 m), throat radius 400 m at the top. `radius`/`height`/`center` returned are
//   VIEWING hints (the part viewer orbits inside the nave; height is negative so it looks up the axis), not
//   the bounding size. The object must only be
//   translated (no rotation / scale): the stone herd wraps in world space around whichever camera renders it.
//
// opts
//   palette        hex array from the brief (default built in)
//   glow           hex of the permanent wall glow (default '#1f5a58')
//   growth         0..1 initial hail growth (default 0.72; 0 = pea 0.25 m, 1 = 3 m)
//   scrollSpeed    m/s the wall pattern slides downward (default 55); sells the 8 km climb
//   herdFollow     0..1 how much of the camera's motion the herd shares (default 0.88)
//   companions     false to drop the three lens-anchored hero stones and their sparks
//   crawler        strength of the wall glow that follows the gaze (default 3.6; 0 = off)
//
// Hooks (all on the returned hero)
//   setProgress(p) 0..1 THE GREAT ILLUMINATION, key it to path u (brief: 17-21 s). 0-0.8 the head climbs
//                  2.5 km up the corkscrew (it passes camera height near p 0.45); 0.16-0.42 a fainter fork hangs far
//                  off in the wall glow; 0.36-0.45 the channel grows tip first, hangs to 0.7 and fades by 0.84; wake
//                  and stone wave die away by 1. Until this is
//                  called the piece auto-plays the event every 10 s (viewer only).
//   setGrowth(g)   0..1 hailstone size / lobes / onion layers.      setFall(f) 0..1 herd stalls and falls away.
//   setScroll(m)   take over the wall scroll (metres).              setFocus(yLocal) height the event centres on
//   placeChannel(worldPos, worldAcross) seat the nave-crossing channel yourself (else 80 m ahead of the camera).
//   uniforms       the shared uniform table (uAmbHi/uAmbLo stone ambient, uWallGain, uCream / uPurple wall tints,
//                  uStri depth of the corkscrew striation, uBack the cloud colour seen through clear ice (set it to the fog colour), uTopAt height (0..1) where the light from the throat begins, ...).
//
// anchors (local space)
//   axisBottom / axisTop       ends of the nave axis.
//   flyThrough                 safe camera line up the nave: drifts to 150 m off one wall and back (>= 100 m clear).
//   viewpoints                 good stations {position, lookAt} for the Illumination.
//   illumination               {from, to}: relative heights (to the focus) the head travels between.
//   throat                     {position, radius}: where the nave ends; fog should hide it.
//   portalSeat                 {position, facing}: just above the throat on the axis, facing down the nave. The
//                              brief seats the real exit in act three; use this only if the world ends here.
//   clearRadius                radius (m) from the axis that is always free of wall at the base (720).
//
// Cost: about 155k triangles (wall 61k, veil 2k, stones 94k, channel 1k, caps) + 5k point sprites, 16 draw calls,
//   one 256x256 baked texture, no lights. Lighting: none needed; it is self-lit (permanent teal glow, cream
//   from above) and ignores scene lights. Honours scene fog (brief: purple-grey #2b2547, ~600 m visibility).
//   Wants bloom (threshold ~0.9): channel core, lit windows, stone rims and sparks are HDR 2-8.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#1d2e2c', '#2b2547', '#6a5aa8', '#9fe0d0', '#0b1c52', '#fff3da', '#ff5a3c'];
const VAULT_R = 1000, VAULT_H = 3000, THROAT_R = 400, LAP = 1500;
const TAU = Math.PI * 2;

// ---------- baked tileable cloud texture: R cauliflower height, GB its gradient, A wisps ----------
async function bakeCloudTexture(rng, pause) {
  const S = 256, Hh = new Float32Array(S * S), W = new Float32Array(S * S);
  const octs = [[5, 1.0], [11, 0.5], [23, 0.27], [47, 0.12]];        // the last: fine cauliflower grain for the detail normal
  for (const [n, amp] of octs) {
    const pts = new Float32Array(n * n * 2);
    for (let i = 0; i < pts.length; i++) pts[i] = 0.15 + 0.7 * rng();
    for (let y = 0; y < S; y++) {
      const fy = (y / S) * n, iy = Math.floor(fy);
      for (let x = 0; x < S; x++) {
        const fx = (x / S) * n, ix = Math.floor(fx);
        let best = 9;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const cx = ((ix + i) % n + n) % n, cy = ((iy + j) % n + n) % n, k = (cy * n + cx) * 2;
          const dx = ix + i + pts[k] - fx, dy = iy + j + pts[k + 1] - fy, d = dx * dx + dy * dy;
          if (d < best) best = d;
        }
        const b = Math.max(0, 1 - best / 0.72);
        Hh[y * S + x] += amp * Math.sqrt(b);
      }
      if ((y & 31) === 31) await pause();
    }
  }
  // wisps: periodic value noise fbm
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  let wa = 1, wn = 0;
  for (const n of [4, 8, 16, 32]) {
    const L = lat(n);
    for (let y = 0; y < S; y++) {
      const fy = (y / S) * n, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < S; x++) {
        const fx = (x / S) * n, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx);
        const x1 = (ix + 1) % n, y1 = (iy + 1) % n;
        const a = L[iy * n + ix], b = L[iy * n + x1], c = L[y1 * n + ix], d = L[y1 * n + x1];
        W[y * S + x] += wa * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
    }
    await pause();
    wn += wa; wa *= 0.55;
  }
  let lo = 1e9, hi = -1e9;
  for (let i = 0; i < Hh.length; i++) { lo = Math.min(lo, Hh[i]); hi = Math.max(hi, Hh[i]); }
  await pause();
  const data = new Uint8Array(S * S * 4), nh = (x, y) => (Hh[((y + S) % S) * S + ((x + S) % S)] - lo) / (hi - lo);
  await pause();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (x === 0 && (y & 63) === 63) await pause();
    const i = (y * S + x) * 4, h = nh(x, y);
    const gx = (nh(x + 1, y) - nh(x - 1, y)) * 6, gy = (nh(x, y + 1) - nh(x, y - 1)) * 6;
    data[i] = Math.round(h * 255);
    data[i + 1] = Math.round(Math.min(1, Math.max(0, 0.5 + gx)) * 255);
    data[i + 2] = Math.round(Math.min(1, Math.max(0, 0.5 + gy)) * 255);
    data[i + 3] = Math.round(Math.min(1, Math.max(0, W[y * S + x] / wn)) * 255);
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// ---------- GLSL shared by wall and veil ----------
const GLSL_WALL_COMMON = /* glsl */`
  #define PI2 6.28318530718
  uniform sampler2D uTex;
  uniform float uScroll, uNC, uNRH, uNR, uRH, uBulge, uH, uR0, uR1, uTw, uTau;
  uniform vec2 uSeed;
  float prof(float t){ return mix(uR0, uR1, smoothstep(0.52, 1.0, t)) * (1.0 + 0.10 * smoothstep(0.22, 0.0, t)); }
  vec2 h2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  vec2 canonC(vec2 ic){ float k = floor(ic.x / uNC); return vec2(ic.x - k * uNC, ic.y + k * uNRH); }
  // F1, F2, nearest cell centre (unwrapped lattice coords); idc = canonical cell id
  vec4 cells(vec2 c, out vec2 idc){
    vec2 ic = floor(c), fc = c - ic; float f1 = 9.0, f2 = 9.0; vec2 bc = vec2(0.0); idc = vec2(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)); vec2 cc = canonC(ic + g); vec2 r = h2(cc + uSeed);
      vec2 o = g + 0.5 + (r - 0.5) * 0.62; float d = length(o - fc);
      if (d < f1) { f2 = f1; f1 = d; bc = ic + o; idc = cc; } else if (d < f2) { f2 = d; }
    }
    return vec4(f1, f2, bc);
  }
  // lattice coords of a wall point: x = column around the nave, y = helical row
  // (columns lean against the rows by uTau turns per lap, so the whole lattice corkscrews)
  vec2 latt(float th, float y){ float a = th / PI2, yp = y + uScroll; return vec2(a * uNC + yp * uTw, yp / uRH - a * uNRH); }
  // inverse: lattice coords -> (angle, local height)
  vec2 unlatt(vec2 c){ float yp = (c.y + c.x * uNRH / uNC) * uRH / (1.0 + uTau); return vec2((c.x - yp * uTw) / uNC * PI2, yp - uScroll); }
  // pillow profile: steep at the seams between cells, round on top
  float pillow(vec4 ce){ float b = 1.0 - clamp((ce.y - ce.x) / 0.8, 0.0, 1.0); return 1.0 - b * b * (0.6 + 0.4 * b); }
  // some cells are thin recessed bays between the buttresses: the windows
  float thinOf(vec2 idc){ return smoothstep(0.56, 0.86, h2(idc + uSeed + 7.3).x); }
  // the seams between buttresses wander like the edges of cauliflower lobes instead of running straight (periodic in the lattice)
  vec2 lwarp(vec2 c){ vec2 q = vec2(c.x / uNC * 3.0, c.y);
    return c + (vec2(textureLod(uTex, q, 3.0).a, textureLod(uTex, q + vec2(0.37, 0.61), 3.0).a) - 0.5) * 0.9; }
`;

const FOG_FADE = /* glsl */`
  float fogFade(){
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 1.0;
    #endif
  }
`;

const WALL_VERT = /* glsl */`
  ${GLSL_WALL_COMMON}
  varying vec2 vC; varying vec3 vN; varying vec3 vT; varying vec3 vP; varying float vDisp; varying vec3 vV; varying float vSl;
  #include <fog_pars_vertex>
  vec3 wallPos(float th, float y, out float disp){
    vec2 c = latt(th, y); vec2 idc; vec4 ce = cells(lwarp(c), idc);
    float h = pillow(ce), thin = thinOf(idc);
    h = mix(h, h * h * (3.0 - 2.0 * h), 0.7);                              // rounded crowns and soft valleys: cauliflower, not ridges
    vec4 ta = textureLod(uTex, vec2(c.x / uNC * 8.0, c.y), 4.3);          // mips coarser than the mesh spacing: soft lumps, no spikes
    vec4 tb = textureLod(uTex, vec2(c.x / uNC * 5.0, c.y * 3.0), 5.0);
    vec4 tm = textureLod(uTex, vec2(c.x / uNC * 13.0, c.y * 2.0) + 0.21, 4.7);  // a middle size of billow, to break the long ridges
    disp = h * uBulge * (1.0 - 0.72 * thin) + (ta.r - 0.45) * 135.0 * (0.3 + 0.7 * h) * (1.0 - 0.5 * thin) + (tb.a - 0.5) * 90.0 + (tm.r - 0.45) * 60.0 * (0.35 + 0.65 * h);
    float tt = y / uH; disp *= smoothstep(0.0, 0.05, tt) * (1.0 - smoothstep(0.88, 0.995, tt)) * min(1.0, prof(tt) / uR0);   // buttresses shrink with the throat
    float r = prof(y / uH) - disp;
    return vec3(cos(th) * r, y, sin(th) * r);
  }
  void main(){
    float th = uv.x * PI2, y = uv.y * uH, d0, d1, d2;
    vec3 p = wallPos(th, y, d0);
    vec3 pa = wallPos(th + 0.014, y, d1);
    vec3 pb = wallPos(th, y + 14.0, d2);
    vec3 n = normalize(cross(pb - p, pa - p));
    vec3 inward = -vec3(cos(th), 0.0, sin(th));
    if (dot(n, inward) < 0.0) n = -n;
    vSl = 1.0 - dot(n, inward);                                            // how steep the flank is here
    n = normalize(mix(n, inward, 0.74));                                   // cloud, not rock: more than half way back to the smooth tube
    vN = n; vT = vec3(-sin(th), 0.0, cos(th)); vP = p; vC = latt(th, y); vDisp = d0;
    vV = cameraPosition - (modelMatrix * vec4(p, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const WALL_FRAG = /* glsl */`
  ${GLSL_WALL_COMMON}
  uniform vec4 uHead[5]; uniform vec3 uHeadCol[5];
  uniform vec3 uDeep, uPurple, uGlow, uCream, uViolet, uTeal;
  uniform float uFrontY, uWakeI, uV0, uWallGain, uTime, uStri, uTopAt;
  varying vec2 vC; varying vec3 vN; varying vec3 vT; varying vec3 vP; varying float vDisp; varying vec3 vV; varying float vSl;
  #include <fog_pars_fragment>
  void main(){
    vec2 idc; vec4 ce = cells(lwarp(vC), idc);
    float h = pillow(ce), thin = thinOf(idc);
    float edge = ce.y - ce.x;
    float crease = 1.0 - smoothstep(0.0, 0.2, edge);
    vec2 rnd = h2(idc + uSeed + 7.3);
    vec4 ta = texture2D(uTex, vec2(vC.x / uNC * 16.0, vC.y));
    vec4 tb = texture2D(uTex, vec2(vC.x / uNC * 5.0, vC.y * 3.0));
    vec4 tc = texture2D(uTex, vec2(vC.x / uNC * 48.0, vC.y * 3.0) + 0.37);
    // detail normal from baked gradients
    vec3 N = normalize(vN); vec3 T = normalize(vT - N * dot(vT, N)); vec3 B = cross(N, T);
    vec4 td = texture2D(uTex, vec2(vC.x / uNC * 30.0, vC.y * 1.9) + 0.61);
    float crown = 1.0 - smoothstep(0.08, 0.36, vSl);                             // on steep flanks the stretched grain would read as gullies in rock: keep it for the crowns
    vec2 g = ((ta.gb - 0.5) * 1.5 + (td.gb - 0.5) * 0.75 + (tc.gb - 0.5) * 0.25) * (0.25 + 0.75 * crown);   // three sizes of cauliflower billow
    N = normalize(N - (T * g.x + B * g.y) * 0.46);
    float t = vP.y / uH;
    float th = atan(vP.z, vP.x);
    vec3 inward = -vec3(cos(th), 0.0, sin(th));
    // permanent glow: purple murk low, teal through the middle, cream pouring from the throat
    vec3 amb = mix(uPurple * 0.55 + uDeep * 0.35, uGlow * 1.25, smoothstep(0.0, 0.42, t));
    amb = mix(amb, uCream * 0.62, pow(smoothstep(uTopAt, 1.0, t), 2.2));
    float grain = mix(0.84, (0.7 + 0.32 * ta.r) * (0.8 + 0.3 * td.r) * (0.9 + 0.2 * tc.r), 0.3 + 0.7 * crown);
    float relief = mix(0.7, 1.0, smoothstep(0.0, 0.75, h)) * grain * (1.0 - 0.3 * thin);   // creases stay above a third of the lit value
    float top = clamp(dot(N, normalize(vec3(0.0, 1.0, 0.0) + inward * 0.35)), -1.0, 1.0);
    float face = clamp(dot(N, inward), 0.0, 1.0);
    float stri = 1.0 - uStri + uStri * sin((vC.y * 5.0 + tb.a * 1.6) * PI2);        // corkscrew plates
    stri = mix(stri, 1.0, 0.7 * smoothstep(0.3, 0.9, h));                            // ... which melt away over the crests of the billows
    float side = dot(N, normalize(T * sign(uNRH) + vec3(0.0, 0.35, 0.0) + inward * 0.45));   // fill swirling round the nave: form from below too
    float lightK = 0.26 + 0.55 * max(top, 0.0) + 0.55 * smoothstep(-0.5, 0.9, side) + 0.1 * face;
    lightK = mix(lightK, 0.8, 0.72);                                         // light scatters round inside cloud: soft terminators
    vec3 col = amb * relief * stri * lightK;
    col += uDeep * 0.10 * (1.0 - relief);
    col += (uPurple * 0.55 + uViolet * 0.03) * (1.0 - clamp(relief * lightK, 0.0, 1.0));   // coloured shadow: the folds go violet, not black
    vec3 pale = mix(uGlow * 2.2, uTeal, 0.5);
    float puff = max(top, 0.0); puff = puff * puff * smoothstep(0.15, 0.9, h);
    col += pale * puff * (0.2 + 0.8 * t) * (0.3 + 0.5 * ta.r);                // daylight from the throat lands on the tops of the billows
    float ndv = abs(dot(N, normalize(vV)));
    float lining = pow(1.0 - ndv, 2.5) + 0.35 * pow(1.0 - ndv, 1.2);
    col += mix(amb, pale, 0.4) * lining * (1.0 + 0.7 * ta.a);
    col += uTeal * (1.0 - ndv) * (1.0 - ndv) * 0.3 * (1.0 - smoothstep(0.6, 0.9, t));   // light scattered out of the rims of the buttresses: they glow where rock would crease                 // silver lining: billows glow at their limbs like backlit vapour
    col += amb * (0.35 * pow(1.0 - h, 3.0) + 0.5 * thin * (0.4 + 0.6 * h)) * (0.4 + 1.2 * tb.a);   // permanent glow seeping through seams and bays
    // cell centre in local space (for buttress-by-buttress light)
    vec2 un = unlatt(ce.zw);
    float thc = un.x, yc = un.y;
    vec3 pc = vec3(cos(thc), 0.0, sin(thc)) * prof(clamp(yc / uH, 0.0, 1.0)) * 0.92; pc.y = yc;
    float seam = 0.05 + 0.95 * pow(1.0 - h, 2.2);
    float bay = (0.3 + 0.7 * smoothstep(0.0, 0.5, h)) * (0.15 + 1.5 * ta.a * ta.a) * (0.4 + 1.1 * tc.r) * (0.75 + 0.5 * stri);
    float lantern = mix(seam * (0.6 + 0.8 * tb.a), bay * 1.15, thin);
    float vein = pow(crease, 4.0) * (0.4 + 1.2 * tb.a);
    vec3 em = vec3(0.0);
    for (int i = 0; i < 5; i++) {
      float I = uHead[i].w; if (I <= 0.001) continue;
      float dq = distance(mix(vP, pc, 0.6), uHead[i].xyz);
      float df = distance(vP, uHead[i].xyz);
      float fall = exp(-dq * dq / (540.0 * 540.0)) * (0.6 + 0.8 * rnd.y);
      float nearv = exp(-df * df / (300.0 * 300.0));
      em += uHeadCol[i] * I * (fall * lantern * 0.22 + nearv * vein * 0.8 + nearv * nearv * lantern * 0.4);
      em += uHeadCol[i] * I * fall * (0.03 + 0.075 * ta.a) * (0.45 + 0.55 * h) * (i >= 2 ? 1.0 : 0.3);   // and swells softly through the body of the cloud
      em += vec3(1.0, 0.95, 1.0) * I * nearv * nearv * pow(crease, 9.0) * 0.25;
    }
    // wake: windows stay lit behind the climbing head, one buttress after another
    float dv = ce.w - uV0; dv -= uNR * floor(dv / uNR + 0.5);
    float lag = uFrontY - (yc - dv * uRH) - (rnd.y - 0.5) * 220.0;
    float wake = smoothstep(-40.0, 140.0, lag) * exp(-max(lag, 0.0) / 1050.0) * exp(-dv * dv / 2.2) * uWakeI;
    vec3 wcol = mix(uViolet * 1.15, uGlow * 3.2 + uTeal * 0.25, smoothstep(0.3, 0.75, rnd.y));
    em += wcol * wake * (lantern * 0.42 + vein * 0.32) * (0.92 + 0.08 * sin(uTime * 2.3 + rnd.x * 40.0));
    col = mix(col, uCream * 0.6 * (0.75 + 0.3 * ta.r + 0.25 * tb.a), smoothstep(0.84, 0.99, t));   // the throat dissolves into the oculus
    col = (col + em) * uWallGain;
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

const VEIL_VERT = /* glsl */`
  varying vec2 vUv; varying vec3 vP; varying vec3 vWP;
  uniform float uH, uR0, uR1;
  #include <fog_pars_vertex>
  void main(){
    vUv = uv; vP = position;
    vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const VEIL_FRAG = /* glsl */`
  uniform sampler2D uTex; uniform float uScroll, uTime, uH;
  uniform vec4 uHead[5]; uniform vec3 uHeadCol[5];
  uniform vec3 uPurple, uGlow, uCream;
  varying vec2 vUv; varying vec3 vP; varying vec3 vWP;
  #include <fog_pars_fragment>
  void main(){
    float sc = uScroll * 1.7 / 900.0;
    float a = texture2D(uTex, vec2(vUv.x * 5.0 + vUv.y * 2.0, vUv.y * 3.3 + sc)).a;
    float b = texture2D(uTex, vec2(vUv.x * 13.0 - vUv.y * 5.0 + uTime * 0.004, vUv.y * 8.0 + sc * 1.6)).a;
    float w = smoothstep(0.50, 0.80, a * 0.65 + b * 0.5);
    float t = vUv.y;
    vec3 col = mix(uPurple * 0.9, uGlow * 1.7, smoothstep(0.0, 0.45, t));
    col = mix(col, uCream * 0.7, pow(smoothstep(0.7, 1.0, t), 2.0));
    for (int i = 0; i < 5; i++) { float d = distance(vP, uHead[i].xyz); col += uHeadCol[i] * uHead[i].w * 0.12 * exp(-d * d / (600.0 * 600.0)); }
    float dc = distance(cameraPosition, vWP);
    float alpha = w * 0.27 * smoothstep(90.0, 420.0, dc) * smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.94, t);
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }
`;

// ---------- hailstones ----------
const STONE_COMMON = /* glsl */`
  uniform float uTime, uGrowth, uFall, uFollow, uFrontY, uStoneI, uOriginY;
  uniform vec3 uOrigin;
  mat3 rotAxis(vec3 a, float ang){
    float s = sin(ang), c = cos(ang), oc = 1.0 - c;
    return mat3(oc*a.x*a.x + c, oc*a.x*a.y + a.z*s, oc*a.z*a.x - a.y*s,
                oc*a.x*a.y - a.z*s, oc*a.y*a.y + c, oc*a.y*a.z + a.x*s,
                oc*a.z*a.x + a.y*s, oc*a.y*a.z - a.x*s, oc*a.z*a.z + c);
  }
  float growOf(vec4 rnd){ return clamp(uGrowth + (rnd.x - 0.5) * 0.22, 0.0, 1.0); }
  float sizeOf(float g, vec4 rnd){ return mix(0.125, 1.5, pow(g, 1.25)) * (0.72 + 0.56 * rnd.w); }
  // centre of a lens companion: a view-space seat with a slow wander
  vec3 companionCentre(vec3 seat, vec4 rnd){
    float p = rnd.y * 6.2832;
    vec3 cv = seat + vec3(sin(uTime * 0.41 + p), sin(uTime * 0.33 + p * 1.7), sin(uTime * 0.29 + p * 2.3)) * vec3(0.55, 0.4, 0.8);
    vec3 c = cameraPosition + cv * mat3(viewMatrix);
    c.y -= uFall * uFall * 45.0;
    return c;
  }
  // centre of a herd stone: a box of stones wrapped around the camera, sharing most of its motion
  vec3 herdCentre(vec3 base, vec4 rnd, vec3 axis, vec3 box, float keepOut, out float fade){
    vec3 drift = axis * vec3(3.0, 1.6, 3.0) * uTime * (0.4 + rnd.z);
    drift += vec3(sin(uTime * 0.23 + rnd.y * 9.0), sin(uTime * 0.31 + rnd.x * 7.0), cos(uTime * 0.27 + rnd.w * 8.0)) * 2.2;
    vec3 rel = mod(base * box + drift - cameraPosition * (1.0 - uFollow), box) - 0.5 * box;
    vec3 e = 1.0 - abs(rel) / (0.5 * box);
    fade = smoothstep(0.0, 0.16, min(e.x, min(e.y, e.z)));
    float d = length(rel);
    rel *= max(d, keepOut) / max(d, 0.001);
    rel.y -= uFall * uFall * (220.0 + 380.0 * rnd.y);
    rel.xz += normalize(rel.xz + 0.001) * uFall * 140.0 * rnd.z;
    return cameraPosition + rel;
  }
  // travelling wave of the Great Illumination (local height of the front in uFrontY)
  float pulseOf(float worldY, vec4 rnd){
    float lag = uFrontY - (worldY - uOrigin.y) - (rnd.y - 0.5) * 160.0;
    return smoothstep(-30.0, 70.0, lag) * exp(-max(lag, 0.0) / 420.0) * uStoneI;
  }
`;

const STONE_VERT = /* glsl */`
  ${STONE_COMMON}
  attribute vec3 aBase; attribute vec4 aRnd; attribute vec3 aAxis; attribute float aLobe;
  uniform vec3 uBox; uniform float uKeepOut, uClearR;
  varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying vec4 vRnd; varying float vPulse; varying float vGrow;
  #include <fog_pars_vertex>
  void main(){
    float g = growOf(aRnd), size = sizeOf(g, aRnd), fade = 1.0;
    #ifdef COMPANION
      size *= 0.62;
      vec3 centre = companionCentre(aBase, aRnd);
    #else
      vec3 centre = herdCentre(aBase, aRnd, aAxis, uBox, uKeepOut, fade);
      float rad = length(centre.xz - uOrigin.xz);
      fade *= 1.0 - smoothstep(uClearR - 120.0, uClearR, rad);
    #endif
    float lobeAmt = smoothstep(0.1, 0.75, g);
    vec3 squash = vec3(1.0, 0.82 + 0.3 * aRnd.z, 1.0 - 0.15 * aRnd.x);
    vec3 lp = position * (1.0 + aLobe * lobeAmt) * squash;
    mat3 R = rotAxis(aAxis, uTime * (0.25 + 0.9 * aRnd.x) + aRnd.y * 6.2832);
    vec3 n = normalize(mix(position, normal, lobeAmt) / squash);
    vN = R * n; vObj = lp; vRnd = aRnd; vGrow = g;
    vW = centre + R * lp * size * fade;
    vPulse = pulseOf(centre.y, aRnd);
    vec4 mvPosition = viewMatrix * vec4(vW, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const STONE_SHADE = /* glsl */`
  uniform vec3 uAmbHi, uAmbLo, uRim, uTeal, uViolet, uBack;
  uniform vec4 uHead[5]; uniform vec3 uHeadCol[5];
  // translucent onion of clear and milky ice. t = 0 at the centre of the silhouette, 1 at its limb
  vec3 shadeIce(vec3 N, vec3 V, vec3 W, float frost, vec4 rnd, float grow, float pulse){
    float ndv = clamp(dot(N, V), 0.0, 1.0), t = sqrt(max(0.0, 1.0 - ndv * ndv));
    float layers = 1.5 + floor(grow * 3.0 + 0.5);
    float ring = 0.5 + 0.5 * sin((t * t * layers + frost * 0.14 + rnd.y) * 6.2832);
    float bandK = smoothstep(0.3, 0.8, grow) * (1.0 - smoothstep(14.0, 60.0, length(cameraPosition - W)));   // small or far stones stay plain milky ice
    float milky = mix(0.4, 1.0, mix(0.55 + 0.1 * frost, smoothstep(0.22, 0.78, ring), 0.2 + 0.8 * bandK));
    float core = smoothstep(0.62, 0.08, t);
    milky = max(milky * (0.55 + 0.45 * frost), core * (0.75 + 0.25 * frost));
    float fres = pow(1.0 - ndv, 3.0);
    vec3 hemi = mix(uAmbLo, uAmbHi, N.y * 0.5 + 0.5);
    vec3 col = hemi * (0.07 + 0.5 * milky) + uAmbHi * (0.12 * (1.0 - milky) * (1.0 - ndv) + 0.42 * milky);
    col += uBack * (1.0 - milky) * 0.6 * (0.35 + 0.65 * ndv);       // clear ice shows the cloud behind it, not black
    col += uRim * fres * (0.8 + 0.6 * frost);                       // every stone carries a pale rim
    vec3 pcol = mix(uTeal, uViolet, step(0.5, rnd.z));
    col += pcol * pulse * (0.06 + 0.45 * milky + 1.3 * fres);        // the wave of light, thrown back teal / violet
    vec3 Rf = reflect(-V, N);
    for (int i = 0; i < 2; i++) {
      float I = uHead[i].w; if (I <= 0.001) continue;
      vec3 L = uHead[i].xyz + vec3(uOrigin.x, uOrigin.y, uOrigin.z) - W; float d = length(L); L /= d;
      float att = 1.0 / (1.0 + d * d / (i == 0 ? 640000.0 : 22500.0));
      float wrap = max(dot(N, L) * 0.6 + 0.4, 0.0);
      float back = pow(max(dot(-N, L), 0.0), 2.0) * (1.0 - milky * 0.5);
      col += uHeadCol[i] * I * att * (0.07 * wrap * (0.3 + milky) + 0.12 * back + 1.4 * pow(max(dot(Rf, L), 0.0), 60.0));
    }
    return col;
  }
`;

const STONE_FRAG = /* glsl */`
  uniform sampler2D uTex; uniform vec3 uOrigin;
  ${STONE_SHADE}
  varying vec3 vN; varying vec3 vW; varying vec3 vObj; varying vec4 vRnd; varying float vPulse; varying float vGrow;
  #include <fog_pars_fragment>
  void main(){
    vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
    float frost = texture2D(uTex, vObj.xy * 0.37 + vObj.z * vec2(0.23, 0.31) + vRnd.xy).r;
    #ifdef COMPANION
      vec4 f2 = texture2D(uTex, vObj.zx * 1.3 + vObj.y * vec2(0.4, 0.7) + vRnd.zw);
      N = normalize(N + (f2.g - 0.5) * 0.35 * cross(N, vec3(0.0, 1.0, 0.0)) + (f2.b - 0.5) * 0.35 * cross(N, vec3(1.0, 0.0, 0.0)));
      frost = mix(frost, f2.r, 0.4);
    #endif
    gl_FragColor = vec4(shadeIce(N, V, vW, frost, vRnd, vGrow, vPulse), 1.0);
    #include <fog_fragment>
  }
`;

// far stones: shaded sphere impostors
const IMP_VERT = /* glsl */`
  ${STONE_COMMON}
  attribute vec4 aRnd; attribute vec3 aAxis;
  uniform vec3 uBox; uniform float uVH, uClearR;
  varying vec4 vRnd; varying float vPulse; varying float vGrow; varying float vA; varying vec3 vW;
  #include <fog_pars_vertex>
  void main(){
    float g = growOf(aRnd), size = sizeOf(g, aRnd), fade;
    vec3 centre = herdCentre(position, aRnd, aAxis, uBox, 0.0, fade);
    float rad = length(centre.xz - uOrigin.xz);
    fade *= 1.0 - smoothstep(uClearR - 120.0, uClearR, rad);
    vec4 mvPosition = viewMatrix * vec4(centre, 1.0);
    float dist = -mvPosition.z;
    fade *= smoothstep(45.0, 90.0, length(mvPosition.xyz));
    float px = size * 2.3 * projectionMatrix[1][1] * uVH * 0.5 / max(dist, 1.0);
    vA = fade * clamp(px / 1.6, 0.0, 1.0);
    gl_PointSize = max(px, 1.6);
    gl_Position = projectionMatrix * mvPosition;
    if (fade < 0.01 || dist < 1.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vRnd = aRnd; vGrow = g; vW = centre; vPulse = pulseOf(centre.y, aRnd);
    #include <fog_vertex>
  }
`;
const IMP_FRAG = /* glsl */`
  uniform vec3 uOrigin;
  ${STONE_SHADE}
  varying vec4 vRnd; varying float vPulse; varying float vGrow; varying float vA; varying vec3 vW;
  #include <fog_pars_fragment>
  void main(){
    vec2 q = gl_PointCoord * 2.0 - 1.0; q.y = -q.y;
    float lob = 1.0 - 0.14 * (0.5 + 0.5 * sin(atan(q.y, q.x) * (3.0 + floor(vRnd.x * 4.0)) + vRnd.y * 20.0));
    float r2 = dot(q, q) / (lob * lob); if (r2 > 1.0) discard;
    vec3 nv = vec3(q / lob, sqrt(1.0 - r2));
    vec3 N = normalize(nv * mat3(viewMatrix)), V = normalize(cameraPosition - vW);
    vec3 col = shadeIce(N, V, vW, 0.5 + 0.3 * sin(vRnd.w * 30.0 + q.x * 5.0), vRnd, vGrow, vPulse);
    gl_FragColor = vec4(col, vA);
    #include <fog_fragment>
  }
`;

// freeze-sparks on the companions
const SPARK_VERT = /* glsl */`
  ${STONE_COMMON}
  attribute vec3 aBase; attribute vec4 aRnd; attribute vec3 aAxis; attribute float aLobe; attribute vec2 aSeed;
  uniform float uVH, uSparkI;
  varying float vA;
  #include <fog_pars_vertex>
  void main(){
    float g = growOf(aRnd), size = sizeOf(g, aRnd) * 0.62;
    vec3 centre = companionCentre(aBase, aRnd);
    float lobeAmt = smoothstep(0.1, 0.75, g);
    vec3 squash = vec3(1.0, 0.82 + 0.3 * aRnd.z, 1.0 - 0.15 * aRnd.x);
    mat3 R = rotAxis(aAxis, uTime * (0.25 + 0.9 * aRnd.x) + aRnd.y * 6.2832);
    vec3 nrm = R * normalize(position);
    vec3 w = centre + R * (position * (1.0 + aLobe * lobeAmt) * squash) * size * 1.03;
    float cyc = uTime * (0.35 + 0.5 * aSeed.x) + aSeed.y * 17.0, ph = fract(cyc);
    float on = step(0.45, fract(sin(floor(cyc) * 12.9898 + aSeed.y * 78.233) * 43758.5453));
    float facing = smoothstep(-0.1, 0.35, dot(nrm, normalize(cameraPosition - w)));
    vA = smoothstep(0.0, 0.3, ph) * smoothstep(1.0, 0.45, ph) * on * facing * uSparkI * smoothstep(0.25, 0.6, g);
    vec4 mvPosition = viewMatrix * vec4(w, 1.0);
    gl_PointSize = clamp((0.16 + 0.22 * aSeed.x) * size * projectionMatrix[1][1] * uVH * 0.5 / max(-mvPosition.z, 0.5), 2.0, 64.0);
    gl_Position = projectionMatrix * mvPosition;
    if (vA < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    #include <fog_vertex>
  }
`;
const SPARK_FRAG = /* glsl */`
  varying float vA;
  #include <fog_pars_fragment>
  ${FOG_FADE}
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0;
    float core = exp(-r * r * 26.0);
    float star = exp(-abs(d.x) * 46.0 - abs(d.y) * 7.0) + exp(-abs(d.y) * 46.0 - abs(d.x) * 7.0);
    float a = (core * 6.0 + star * 2.2) * (1.0 - smoothstep(0.7, 1.0, r)) * vA;
    gl_FragColor = vec4(vec3(1.0, 0.98, 0.95) * a * fogFade(), 1.0);
  }
`;

// ---------- the nave-crossing channel ----------
const BOLT_VERT = /* glsl */`
  attribute vec3 aTan; attribute float aSide; attribute float aAlong; attribute float aW;
  uniform float uWidth, uPxAng;
  varying float vSide; varying float vAlong; varying float vW; varying float vCoreW;
  #include <fog_pars_vertex>
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 tw = normalize(mat3(modelMatrix) * aTan);
    vec3 vd = cameraPosition - wp.xyz; float dist = length(vd); vd /= dist;
    vec3 sd = normalize(cross(tw, vd));
    float want = uWidth * aW, w = max(want, dist * uPxAng * 3.0) * 4.0;      // four times wider than the old ribbon: room for the sheath
    vCoreW = clamp(max(0.11 * want, dist * uPxAng * 0.9) / w, 0.008, 0.6);
    wp.xyz += sd * aSide * w;
    vSide = aSide; vAlong = aAlong; vW = 0.12 + 0.88 * aW;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const BOLT_FRAG = /* glsl */`
  uniform float uGrow, uFade, uTime; uniform vec3 uCore, uHalo;
  varying float vSide; varying float vAlong; varying float vW; varying float vCoreW;
  #include <fog_pars_fragment>
  ${FOG_FADE}
  void main(){
    float x = abs(vSide);
    float core = 1.0 - smoothstep(vCoreW * 0.6, vCoreW * 1.5, x);
    float xi = min(x * 4.0, 1.0);
    float glow = pow(1.0 - xi, 2.6) + 0.17 * (1.0 - x) * (1.0 - x) * (0.5 + 0.5 * vW);   // inner glow + the wide sheath
    float vis = 1.0 - smoothstep(uGrow - 0.035, uGrow, vAlong);
    float tip = smoothstep(uGrow - 0.14, uGrow - 0.02, vAlong) * vis;
    float shimmer = 0.86 + 0.14 * sin(uTime * 7.0 + vAlong * 37.0);
    vec3 col = (uCore * core * (2.6 + 2.4 * tip) + uHalo * glow * (0.26 + 0.9 * tip)) * vis * uFade * shimmer * vW;
    gl_FragColor = vec4(col * fogFade(), 1.0);
  }
`;

// ---------- geometry builders ----------
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const profJS = (t) => (VAULT_R + (THROAT_R - VAULT_R) * sstep(0.52, 1.0, t)) * (1 + 0.10 * (1 - sstep(0.0, 0.22, t)));

function makeTubeGrid(nu, nv, radiusScale) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  let k = 0, q = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu, v = j / nv, th = u * TAU, r = profJS(v) * radiusScale;
    pos[k++] = Math.cos(th) * r; pos[k++] = v * VAULT_H; pos[k++] = Math.sin(th) * r;
    uv[q++] = u; uv[q++] = v;
  }
  const idx = new Uint16Array(nu * nv * 6); k = 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, VAULT_H / 2, 0), 2200);
  return g;
}

function randUnit(rng, out = new THREE.Vector3()) {
  const z = rng.range(-1, 1), a = rng.range(0, TAU), s = Math.sqrt(1 - z * z);
  return out.set(Math.cos(a) * s, z, Math.sin(a) * s);
}

// lobed hailstone: `position` stays the unit sphere, aLobe carries the knobbly growth, normal is the lobed normal
function makeStoneGeo(rng, noise, detail, nLobes) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position, n = pos.count, lobe = new Float32Array(n), dirs = new Float32Array(n * 3);
  const lobes = [];
  for (let i = 0; i < nLobes; i++) lobes.push({ d: randUnit(rng), w: rng.range(0.32, 0.62), a: rng.range(0.14, 0.34) });
  const off = rng.range(0, 50), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let d = 0;
    for (const L of lobes) {
      const ang = Math.acos(Math.min(1, Math.max(-1, v.dot(L.d)))) / L.w;
      if (ang < 1) d = Math.max(d, L.a * Math.sqrt(1 - ang * ang));
    }
    d += 0.035 * noise.n3(v.x * 2.6 + off, v.y * 2.6, v.z * 2.6) + (detail > 3 ? 0.012 * noise.n3(v.x * 7 + off, v.y * 7, v.z * 7) : 0);
    lobe[i] = d; dirs[i * 3] = v.x; dirs[i * 3 + 1] = v.y; dirs[i * 3 + 2] = v.z;
    pos.setXYZ(i, v.x * (1 + d), v.y * (1 + d), v.z * (1 + d));
  }
  g.computeVertexNormals();
  g.setAttribute('position', new THREE.BufferAttribute(dirs, 3));
  g.setAttribute('aLobe', new THREE.BufferAttribute(lobe, 1));
  return g;
}

function instanceStones(base, count, rng, seatFn) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.attributes.position);
  g.setAttribute('normal', base.attributes.normal);
  g.setAttribute('aLobe', base.attributes.aLobe);
  const aBase = new Float32Array(count * 3), aRnd = new Float32Array(count * 4), aAxis = new Float32Array(count * 3), v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const s = seatFn ? seatFn(i) : [rng(), rng(), rng()];
    aBase.set(s, i * 3);
    aRnd.set([rng(), rng(), rng(), rng()], i * 4);
    randUnit(rng, v); aAxis.set([v.x, v.y, v.z], i * 3);
  }
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(aBase, 3));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(aRnd, 4));
  g.setAttribute('aAxis', new THREE.InstancedBufferAttribute(aAxis, 3));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// branching channel as camera-facing ribbons. Local frame: runs along X, forks hang down and forward.
function makeBoltGeo(rng) {
  const strips = [];
  const displace = (a, b, iters, amp) => {
    let pts = [a, b];
    for (let it = 0; it < iters; it++) {
      const next = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const m = pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5);
        const seg = pts[i + 1].clone().sub(pts[i]).normalize();
        const off = randUnit(rng); off.addScaledVector(seg, -off.dot(seg));
        m.addScaledVector(off, amp * rng.range(0.45, 1));
        next.push(m, pts[i + 1]);
      }
      pts = next; amp *= 0.56;
    }
    return pts;
  };
  const span = 1700, kA = 0.74;
  const trunk = displace(new THREE.Vector3(-span / 2, rng.range(30, 90), rng.range(-40, 40)), new THREE.Vector3(span / 2, rng.range(-70, 10), rng.range(-40, 40)), 7, 150);
  // keep the middle of the trunk near the seat so it really crosses in front of the lens
  const mid = trunk[trunk.length >> 1].clone();
  for (let i = 0; i < trunk.length; i++) { const w = Math.sin((i / (trunk.length - 1)) * Math.PI); trunk[i].y -= mid.y * w; trunk[i].z -= mid.z * w; }
  strips.push({ pts: trunk, a0: 0, a1: kA, w0: 1, w1: 0.8 });
  const nb = rng.int(9, 11);
  for (let b = 0; b < nb; b++) {
    const central = b % 2 === 0, half = trunk.length >> 1;       // half the forks sit where the lens is, at lens scale
    const fi = central ? half + rng.int(-11, 11) : rng.int(12, trunk.length - 20), from = trunk[fi], len = central ? rng.range(35, 150) : rng.range(120, 420);
    const dir = new THREE.Vector3(rng.range(0.1, 0.9), rng.range(-1, 0.45), rng.range(-0.8, 0.5)).normalize();
    const a0 = (fi / (trunk.length - 1)) * kA, a1 = Math.min(1, a0 + (len / span) * kA * 1.3);
    const br = displace(from.clone(), from.clone().addScaledVector(dir, len), 4, len * 0.17);
    strips.push({ pts: br, a0, a1, w0: 0.62, w1: 0.16 });
    if (rng.chance(0.65)) {
      const si = rng.int(4, br.length - 5), sl = len * rng.range(0.3, 0.55);
      const sd = dir.clone().add(randUnit(rng).multiplyScalar(0.8)).normalize();
      const s0 = a0 + (a1 - a0) * (si / (br.length - 1));
      strips.push({ pts: displace(br[si].clone(), br[si].clone().addScaledVector(sd, sl), 3, sl * 0.18), a0: s0, a1: Math.min(1, s0 + (sl / span) * kA * 1.3), w0: 0.36, w1: 0.1 });
    }
  }
  let nv = 0, ni = 0; for (const s of strips) { nv += s.pts.length * 2; ni += (s.pts.length - 1) * 6; }
  const pos = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), side = new Float32Array(nv), along = new Float32Array(nv), wid = new Float32Array(nv);
  const idx = new Uint16Array(ni); let vi = 0, ii = 0; const t = new THREE.Vector3();
  for (const s of strips) {
    const n = s.pts.length, v0 = vi;
    for (let i = 0; i < n; i++) {
      t.copy(s.pts[Math.min(n - 1, i + 1)]).sub(s.pts[Math.max(0, i - 1)]).normalize();
      const f = i / (n - 1);
      for (let k = 0; k < 2; k++) {
        pos.set([s.pts[i].x, s.pts[i].y, s.pts[i].z], vi * 3); tan.set([t.x, t.y, t.z], vi * 3);
        side[vi] = k ? 1 : -1; along[vi] = s.a0 + (s.a1 - s.a0) * f; wid[vi] = s.w0 + (s.w1 - s.w0) * f; vi++;
      }
    }
    for (let i = 0; i < n - 1; i++) { const a = v0 + i * 2; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ii); ii += 6; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
  g.setAttribute('aW', new THREE.BufferAttribute(wid, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('hail-cathedral-hero'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const hueJit = rng.range(-0.025, 0.025);
  for (const c of pal) c.offsetHSL(hueJit, 0, 0);
  const [cDeep, cPurple, cViolet, cRim, , cCream] = pal;
  const cGlow = new THREE.Color(opts.glow || '#1f5a58').offsetHSL(hueJit, 0, 0);
  const V3 = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);

  // per-seed vault: handedness of the corkscrew, how many buttresses around, how many helical strands
  const hand = rng.sign(), NC = rng.int(17, 22), NR = rng.pick([3, 4, 4, 5]), RH = LAP / NR, NRH = NR * hand;
  const bulge = rng.range(150, 185), V0 = 0.5 + rng.int(0, NR - 1);
  const tau = rng.range(0.45, 0.8);

  const object = new THREE.Group(); object.name = 'hail-cathedral-hero';
  const pause = async () => { await ctx.yield?.(); };
  const tex = await bakeCloudTexture(rng.fork('tex'), pause);
  await pause();

  const heads = [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, -1e5, 0, 0));
  const hsl = {}; cViolet.getHSL(hsl);
  const cBolt = new THREE.Color().setHSL(hsl.h, 0.85, 0.6);            // the palette violet, saturated for emitted light
  const lightning = V3(cBolt);
  const headCols = [lightning.clone(), new THREE.Vector3(0.75, 0.7, 1.0), lightning.clone(), V3(cViolet).lerp(V3(cRim), 0.45), lightning.clone().lerp(new THREE.Vector3(0.75, 0.7, 1.0), 0.15)];
  const U = {
    uTime: { value: 0 }, uTex: { value: tex }, uScroll: { value: 0 },
    uNC: { value: NC }, uNRH: { value: NRH }, uNR: { value: NR }, uRH: { value: RH }, uBulge: { value: bulge },
    uTw: { value: hand * tau * NC / LAP }, uTau: { value: tau }, uH: { value: VAULT_H }, uR0: { value: VAULT_R }, uR1: { value: THROAT_R }, uSeed: { value: new THREE.Vector2(rng.range(0, 40), rng.range(0, 40)) },
    uHead: { value: heads }, uHeadCol: { value: headCols },
    uDeep: { value: V3(cDeep) }, uPurple: { value: V3(cPurple) }, uGlow: { value: V3(cGlow) }, uCream: { value: V3(cCream) },
    uViolet: { value: V3(cBolt, 0.9) }, uTeal: { value: V3(cRim, 0.85).lerp(V3(cGlow, 2.2), 0.4) },
    uFrontY: { value: -1e5 }, uWakeI: { value: 0 }, uV0: { value: V0 }, uWallGain: { value: 1 }, uStri: { value: 0.22 }, uTopAt: { value: 0.62 },
    uGrowth: { value: opts.growth ?? 0.72 }, uFall: { value: 0 }, uFollow: { value: opts.herdFollow ?? 0.88 }, uStoneI: { value: 0 },
    uOrigin: { value: new THREE.Vector3() },
    uAmbHi: { value: V3(cGlow, 1.6).lerp(V3(cCream, 0.55), 0.4) }, uAmbLo: { value: V3(cPurple, 0.75).lerp(V3(cGlow), 0.3) }, uRim: { value: V3(cRim, 1.5) },
    uVH: { value: 540 }, uSparkI: { value: 1 }, uBack: { value: V3(cPurple, 0.6).lerp(V3(cGlow), 0.5) },
    uWidth: { value: 4.5 }, uPxAng: { value: 0.002 }, uGrow: { value: 0 }, uFade: { value: 0 },
    uCore: { value: new THREE.Vector3(1.0, 0.94, 1.0) }, uHalo: { value: V3(cViolet, 2.4).lerp(new THREE.Vector3(1, 1, 1.4), 0.12) },
  };
  const mkU = (extra = {}) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U, extra);

  // ---- the vault wall: one opaque inside-out tube, displaced and lit in the shader ----
  const wall = new THREE.Mesh(makeTubeGrid(224, 176, 1), new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG,
  }));
  wall.frustumCulled = false; wall.name = 'vault-wall'; object.add(wall);
  await pause();

  // ---- one veil of wisps inside it, sliding at another rate for parallax ----
  const veil = new THREE.Mesh(makeTubeGrid(48, 20, 0.74), new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG,
  }));
  veil.frustumCulled = false; veil.renderOrder = 1; veil.name = 'vault-veil'; object.add(veil);
  // ---- the two ends: a cream oculus pouring light down the throat, purple murk below ----
  const capMat = (cIn, cOut) => new THREE.ShaderMaterial({
    uniforms: mkU({ uIn: { value: cIn }, uOut: { value: cOut } }), fog: true, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vQ; \n#include <fog_pars_vertex>\n void main(){ vQ = position.xy; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition; \n#include <fog_vertex>\n }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uIn, uOut; uniform float uScroll, uTime; varying vec2 vQ; \n#include <fog_pars_fragment>\n
      void main(){ float r = length(vQ); float a = atan(vQ.y, vQ.x) / 6.28318;
        float w = texture2D(uTex, vec2(a * 3.0 + r * 0.6 + uTime * 0.006, r * 1.5 - uScroll / 2600.0)).a;
        float w2 = texture2D(uTex, vQ * 0.9 + vec2(uTime * 0.004, 0.0)).r;
        vec3 col = mix(uIn, uOut, pow(smoothstep(0.0, 1.0, r + (w - 0.5) * 0.6), 0.7)) * (0.72 + 0.3 * w2 + 0.3 * w);
        gl_FragColor = vec4(col, 1.0); \n#include <fog_fragment>\n }`,
  });
  const capGeo = new THREE.CircleGeometry(1, 48);
  const oculus = new THREE.Mesh(capGeo, capMat(V3(cCream, 2.6), V3(cCream, 0.6)));
  oculus.rotation.x = Math.PI / 2; oculus.position.y = VAULT_H - 4; oculus.scale.setScalar(THROAT_R * 1.04); oculus.name = 'oculus'; object.add(oculus);
  const floor = new THREE.Mesh(capGeo, capMat(V3(cPurple, 0.3).lerp(V3(cDeep, 0.5), 0.5), V3(cPurple, 0.42)));
  floor.rotation.x = -Math.PI / 2; floor.position.y = 4; floor.scale.setScalar(VAULT_R * 1.12); floor.name = 'murk-floor'; object.add(floor);
  await ctx.yield?.();

  // ---- hailstones ----
  const stoneMat = (box, keepOut, companion) => new THREE.ShaderMaterial({
    uniforms: mkU({ uBox: { value: new THREE.Vector3(box, box, box) }, uKeepOut: { value: keepOut }, uClearR: { value: 700 } }),
    defines: companion ? { COMPANION: 1 } : {}, fog: true, vertexShader: STONE_VERT, fragmentShader: STONE_FRAG,
  });
  const addStones = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.name = name; object.add(m); return m; };
  const srng = rng.fork('stones');
  const nearMat = stoneMat(76, 11, false), herdMat = stoneMat(340, 10, false);
  for (let k = 0; k < 3; k++) { addStones(instanceStones(makeStoneGeo(srng, noise, 3, srng.int(12, 18)), 16, srng), nearMat, 'stones-near-' + k); await pause(); }
  await ctx.yield?.();
  for (let k = 0; k < 2; k++) { addStones(instanceStones(makeStoneGeo(srng, noise, 1, srng.int(6, 9)), 450, srng), herdMat, 'stones-herd-' + k); await pause(); }
  await ctx.yield?.();

  // far herd: 4800 impostor sprites
  {
    const N = 4800, p = new Float32Array(N * 3), r = new Float32Array(N * 4), a = new Float32Array(N * 3), v = new THREE.Vector3();
    for (let i = 0; i < N; i++) { p.set([srng(), srng(), srng()], i * 3); r.set([srng(), srng(), srng(), srng()], i * 4); randUnit(srng, v); a.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aRnd', new THREE.BufferAttribute(r, 4)); g.setAttribute('aAxis', new THREE.BufferAttribute(a, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: mkU({ uBox: { value: new THREE.Vector3(840, 840, 840) }, uClearR: { value: 700 } }),
      fog: true, transparent: true, depthWrite: false, vertexShader: IMP_VERT, fragmentShader: IMP_FRAG,
    }));
    pts.frustumCulled = false; pts.renderOrder = 2; pts.name = 'stones-far'; object.add(pts);
  }
  await pause();

  // the three companions, seated in view space beside the lens, and their freeze-sparks
  const companions = [];
  if (opts.companions !== false) {
    const seats = [[-4.3, -1.7, -6.6], [4.8, 1.35, -7.8], [1.7, -2.5, -10.5]].map((s) => [s[0] + srng.range(-0.4, 0.4), s[1] + srng.range(-0.25, 0.25), s[2] + srng.range(-0.6, 0.6)]);
    const compMat = stoneMat(1, 0, true);
    const NS = 70, sp = { position: [], aBase: [], aRnd: [], aAxis: [], aLobe: [], aSeed: [] };
    for (let k = 0; k < 3; k++) {
      const base = makeStoneGeo(srng, noise, 7, srng.int(24, 34));
      const geo = instanceStones(base, 1, srng, () => seats[k]);
      geo.attributes.aRnd.setX(0, 0.5 + 0.2 * (k - 1)); geo.attributes.aRnd.setW(0, 0.55 + 0.2 * srng());
      companions.push(addStones(geo, compMat, 'companion-' + k));
      const P = base.attributes.position, L = base.attributes.aLobe, R = geo.attributes.aRnd, A = geo.attributes.aAxis;
      for (let i = 0; i < NS; i++) {
        const j = srng.int(0, P.count - 1);
        sp.position.push(P.getX(j), P.getY(j), P.getZ(j)); sp.aLobe.push(L.getX(j)); sp.aBase.push(...seats[k]);
        sp.aRnd.push(R.getX(0), R.getY(0), R.getZ(0), R.getW(0)); sp.aAxis.push(A.getX(0), A.getY(0), A.getZ(0)); sp.aSeed.push(srng(), srng());
      }
      await ctx.yield?.();
    }
    const g = new THREE.BufferGeometry(), sizes = { position: 3, aBase: 3, aRnd: 4, aAxis: 3, aLobe: 1, aSeed: 2 };
    for (const k in sp) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(sp[k]), sizes[k]));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const sparks = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: mkU(), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG,
    }));
    sparks.frustumCulled = false; sparks.renderOrder = 4; sparks.name = 'freeze-sparks'; object.add(sparks);
  }

  // ---- the channel that walks across the nave ----
  const channel = new THREE.Mesh(makeBoltGeo(rng.fork('bolt')), new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG,
  }));
  channel.frustumCulled = false; channel.renderOrder = 3; channel.visible = false; channel.name = 'nave-channel'; object.add(channel);
  // a fainter fork far off in the wall glow, a moment before the channel: the same strips, its own growth and fade
  const U2 = { uGrow: { value: 0 }, uFade: { value: 0 } };
  const farFork = new THREE.Mesh(channel.geometry, new THREE.ShaderMaterial({
    uniforms: mkU(U2), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG,
  }));
  farFork.frustumCulled = false; farFork.renderOrder = 3; farFork.visible = false; farFork.scale.setScalar(0.5); farFork.name = 'far-fork'; object.add(farFork);
  await ctx.yield?.();

  // ---------- animation state ----------
  const scrollSpeed = opts.scrollSpeed ?? 55;
  const REL_FROM = -1400, REL_TO = 1100;
  const st = { manualP: null, manualScroll: null, focus: null, focusLatched: false, focusY: VAULT_H * 0.45, chanLatched: false, chanManual: false, chanY: 0, chanCamY: 0, farLatched: false, farY: 0, farCamY: 0, prevCam: new THREE.Vector3(1e9, 0, 0) };
  const _o = new THREE.Vector3(), _c = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _m = new THREE.Matrix4(), _s = new THREE.Vector2();
  const phases = [rng.range(0, 6), rng.range(0, 6), rng.range(0, 6), rng.range(0, 6)];
  const setHead = (i, y, row, intensity) => {
    const yp = y + U.uScroll.value, th = ((yp / RH - row) / NRH) * TAU, r = profJS(Math.min(1, Math.max(0, y / VAULT_H))) * 0.9;
    heads[i].set(Math.cos(th) * r, y, Math.sin(th) * r, intensity);
  };
  const _q = new THREE.Quaternion();
  const seat = (mesh, camLocal, camera, ahead, lift) => {
    camera.getWorldQuaternion(_q);                             // behind a portal only the world matrix is set
    _f.set(0, 0, -1).applyQuaternion(_q); _f.y = Math.min(0.75, Math.max(-0.75, _f.y)); _f.normalize();
    _r.set(1, 0, 0).applyQuaternion(_q); _r.y = 0; if (_r.lengthSq() < 1e-4) _r.set(1, 0, 0); _r.normalize();
    _u.crossVectors(_r, _f).normalize();                       // up-ish, perpendicular to both
    mesh.position.copy(camLocal).addScaledVector(_f, ahead).addScaledVector(_u, lift);
    _f.crossVectors(_r, _u);                                   // local +Z
    mesh.quaternion.setFromRotationMatrix(_m.makeBasis(_r, _u, _f));
  };
  const latchChannel = (camLocal, camera) => { seat(channel, camLocal, camera, 80, 6); st.chanY = channel.position.y; st.chanCamY = camLocal.y; st.chanLatched = true; };
  const latchFar = (camLocal, camera) => { seat(farFork, camLocal, camera, 340, 40); st.farY = farFork.position.y; st.farCamY = camLocal.y; st.farLatched = true; };

  function update(dt, time, camera) {
    U.uTime.value = time;
    U.uScroll.value = st.manualScroll ?? time * scrollSpeed;
    object.updateWorldMatrix(true, false); _o.setFromMatrixPosition(object.matrixWorld); U.uOrigin.value.copy(_o);
    if (camera) {
      camera.getWorldPosition(_c).sub(_o);
      ctx.renderer?.getDrawingBufferSize?.(_s);
      const vh = _s.y > 0 ? _s.y : 540;
      U.uVH.value = vh; U.uPxAng.value = 1 / (camera.projectionMatrix.elements[5] * vh * 0.5);
    }
    // progress of the Great Illumination
    let p = st.manualP;
    if (p === null) { const a = ((time + 1.1) % 10) / 5; p = a < 1 ? a : 0; }
    const jumped = camera && _c.distanceTo(st.prevCam) > 200; st.prevCam.copy(_c);
    if (p <= 0 || jumped) { st.focusLatched = false; st.farLatched = false; if (!st.chanManual) st.chanLatched = false; }
    if (p > 0 && !st.focusLatched) { st.focusY = st.focus ?? _c.y; st.focusLatched = true; }
    const e = Math.min(1, p / 0.8), ee = e * 0.7 + 0.3 * e * e * (3 - 2 * e);
    const frontY = st.focusY + REL_FROM + (REL_TO - REL_FROM) * ee;
    const env = sstep(0, 0.07, p) * (1 - sstep(0.74, 0.93, p));
    const wakeEnv = sstep(0, 0.05, p) * (1 - sstep(0.8, 1.0, p));
    U.uFrontY.value = p > 0 ? frontY : -1e5; U.uWakeI.value = wakeEnv; U.uStoneI.value = wakeEnv;
    setHead(0, frontY, V0, 3.6 * env);
    // the channel: grows tip first over ~350 ms, hangs, fades over ~600 ms
    const grow = Math.min(1, Math.max(0, (p - 0.36) / 0.09)) * 1.06, fade = p > 0.36 ? 1 - sstep(0.7, 0.84, p) : 0;
    // the far fork: born at 0.16, grown by 0.24, gone by 0.42 as the channel takes over
    const grow2 = Math.min(1, Math.max(0, (p - 0.16) / 0.08)) * 1.06, fade2 = p > 0.16 ? 0.5 * (1 - sstep(0.33, 0.43, p)) : 0;
    if (fade2 > 0.002 && camera) {
      if (!st.farLatched) latchFar(_c, camera);
      farFork.position.y = st.farY + (_c.y - st.farCamY) * 0.8;
      farFork.visible = true; U2.uGrow.value = grow2; U2.uFade.value = fade2;
    } else farFork.visible = false;
    if (fade > 0.002 && camera) {
      if (!st.chanLatched) latchChannel(_c, camera);
      if (!st.chanManual) channel.position.y = st.chanY + (_c.y - st.chanCamY) * U.uFollow.value;
      channel.visible = true; U.uGrow.value = grow; U.uFade.value = fade;
      heads[1].set(channel.position.x, channel.position.y, channel.position.z, 1.6 * fade * Math.min(1, grow * 1.6));
    } else { channel.visible = false; heads[1].w = 0; }
    // ambient crawlers: slow swells of light wandering the wall, so the nave never goes dark
    const s2 = 0.5 - 0.5 * Math.cos(time * 0.9 + phases[0]), s3 = 0.5 - 0.5 * Math.cos(time * 0.63 + phases[1]);
    setHead(2, VAULT_H * (0.16 + 0.5 * (0.5 + 0.5 * Math.sin(time * 0.11 + phases[2]))), V0 + 2, 5.0 * s2 * s2);
    setHead(3, VAULT_H * (0.42 + 0.42 * (0.5 + 0.5 * Math.sin(time * 0.07 + phases[3]))), V0 + 1, 4.2 * s3 * s3);
    // a third crawler keeps to the wall the camera is looking at, wandering about its height: a violet swell always in frame
    if (camera) {
      camera.getWorldDirection(_f);
      const s4 = 0.5 - 0.5 * Math.cos(time * 0.52 + phases[2] * 1.7);
      const y4 = Math.min(VAULT_H * 0.96, Math.max(60, _c.y + 520 * _f.y + 250 * Math.sin(time * 0.2 + phases[3])));
      const th4 = Math.atan2(_f.z, _f.x + 1e-6) + 0.6 * Math.sin(time * 0.17 + phases[1]), r4 = profJS(y4 / VAULT_H) * 0.9;
      heads[4].set(Math.cos(th4) * r4, y4, Math.sin(th4) * r4, (opts.crawler ?? 3.6) * (0.3 + 0.7 * s4 * s4) * (1 - sstep(0.74, 0.9, _c.y / VAULT_H)));   // not in the pale throat
    }
    U.uSparkI.value = 0.65 + 0.35 * wakeEnv;
  }

  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const hero = {
    // viewer hints only: a small orbit low on the axis, height negative so the part viewer looks UP the nave
    object, radius: 100, height: -1600, center: P(0, 1900, 0),
    ground: false, groundY: 0,
    anchors: {
      vaultRadius: VAULT_R, vaultHeight: VAULT_H, clearRadius: 720, corkscrew: { hand, columns: NC, strands: NR, lapRise: LAP },
      axisBottom: P(0, 0, 0), axisTop: P(0, VAULT_H, 0),
      flyThrough: [P(0, 80, 0), P(0, 520, 0), P(170, 1000, 110), P(480, 1500, 300), P(170, 2100, 90), P(0, 2600, 0), P(0, 2950, 0)],
      viewpoints: [
        { position: P(120, 1250, 80), lookAt: P(0, 1750, -300) },       // up the axis at ~55 degrees: the head climbing
        { position: P(480, 1500, 300), lookAt: P(-700, 1350, -400) },   // off one wall, across the nave
        { position: P(0, 1700, 0), lookAt: P(600, 900, 300) },          // looking down: the wake of lit windows
      ],
      illumination: { from: REL_FROM, to: REL_TO },
      throat: { position: P(0, VAULT_H, 0), radius: THROAT_R },
      portalSeat: { position: P(0, VAULT_H + 60, 0), facing: P(0, -1, 0) },
    },
    uniforms: U, channel, companions,
    setProgress(p) { st.manualP = Math.min(1, Math.max(0, p)); },
    setGrowth(g) { U.uGrowth.value = Math.min(1, Math.max(0, g)); },
    setFall(f) { U.uFall.value = Math.min(1, Math.max(0, f)); },
    setScroll(m) { st.manualScroll = m; },
    setFocus(y) { st.focus = y; },
    placeChannel(worldPos, worldAcross) {
      object.updateWorldMatrix(true, false); _o.setFromMatrixPosition(object.matrixWorld);
      channel.position.copy(worldPos).sub(_o);
      _r.copy(worldAcross).normalize(); _u.set(0, 1, 0); _f.crossVectors(_r, _u).normalize(); _u.crossVectors(_f, _r);
      channel.quaternion.setFromRotationMatrix(_m.makeBasis(_r, _u, _f));
      st.chanManual = true; st.chanLatched = true;
    },
    update,
    dispose() {},
  };
  return hero;
}
