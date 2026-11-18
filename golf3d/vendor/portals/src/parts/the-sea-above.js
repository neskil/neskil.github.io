// THE BREACH: hero set piece for "The Sea Above".
//
// A blue whale (opts.length: 34 m by default, 44 m in its world) dives DOWN out of the sea that hangs where the sky should be, falls steeply ~58 m toward
// the wheat, levels out and then climbs a long shallow line back to the ceiling, keeping its belly and the
// planform of its flukes turned toward the side the camera flies on. It re-enters with a crown of thin translucent
// water fingers hanging from a ring of foam round the hole, under a light veil of mist that rains upward. Water leaves its flanks, flippers and flukes in threads
// that break at once into beads and a fizz of spray, all falling up into the ceiling; a sheath of water is dragged out of the exit hole; ripple rings and
// foam spread over a local patch of the sea ceiling around both holes.
//
// LOCAL SPACE  origin on the ground under the lowest point of the arc, +Y up. The whale travels from -X to +X in
//   (roughly) the XY plane: exit hole above x = -spanIn, lowest point above x = 0, re-entry above x = spanOut.
//   Sea ceiling at y = opts.ceilingY (120). Nothing touches the ground: the piece hangs between y ~ 58 and the
//   ceiling. `radius`, `height` and `center` are framing hints; the true extent is in anchors.bounds.
//
// PROGRESS  hero.setProgress(u), u in 0..1 (pass null to return to the built-in loop):
//   0.00 whale is inside the sea, the ceiling begins to bulge downward
//   ~0.06 snout breaks out of the ceiling            (anchors.timing.exit)
//   ~0.31 lowest point, body level                   (anchors.timing.nadir)
//   ~0.73 snout re-enters, crown splash starts       (anchors.timing.enter)
//   0.86 flukes gone; 0.86..1 the crown rains upward and the rings die away
//   Everything (whale, sheath, crown, rain, rings) derives from this one value; only ambient shimmer and the
//   flow of water along the trails use wall-clock time. If setProgress is never called the piece loops by
//   itself every opts.duration seconds. While the whale is wholly back in the sea (before exit - 0.03 and at
//   1) update() sets every draw count of the piece to zero: it stays in the scene, compiled, and costs nothing.
//   While it is out, the pieces that show nothing at that moment are left undrawn in the same way (gate()): the sheath
//   and the crown while they are flat, the splash drops outside their ten seconds, the trails before any skin is out.
//
// ANCHORS (local space; transform with hero.object.matrixWorld)
//   ceilingY      height of the sea ceiling
//   bounds        { radius, top, bottom, ceilingPatch: [halfX, halfZ] } true extent of the piece
//   exitPoint     where the whale leaves the ceiling;  entryPoint  where it re-enters (crown)
//   nadir         lowest point of the whale's spine
//   viewSide      +1 / -1: the side (sign of local z) the camera line stays on; it never crosses the whale's plane
//   flyThrough    ordered camera line, 16 points: an oblique approach from behind and to the side while the
//                 whale dives (the dive is seen in profile, dead ahead and above), a swing in behind its shoulder
//                 at the nadir, then the climb flown WITH the whale (the table CHASE, in metres for a 44 m whale and
//                 scaled with the whale's length): 34 m behind its middle and 37 m to the side at the nadir,
//                 closing to 24.5 m behind, 23.5 m to the side and 12.5 m below in the middle of the climb (the whale
//                 fills the upper half of the frame and the land stays in view under it), dropping back to 35 m by the re-entry; past the
//                 hole at ~40 m to the side, then a swing out to the camera's side that curves back while it climbs steadily
//                 (AFTER) to a level run 7.5 m under the ceiling whose last 90 m are straight. Steepest climb under 20 degrees.
//   cues          { exit, nadir, enter }: the points of that line where the lens should be at timing.exit, .nadir
//                 and .enter. Drive progress linearly in metres flown between them (and on past enter).
//   flyDirection  unit heading of the first leg;  exitDirection  unit heading of the level run
//   portalSeat    { position, facing }: the end of the level run, facing back along it
//   viewpoints    three good camera positions ({ position, lookAt })
//   timing        { exit, nadir, enter, gone } progress values of the beats above
// LIVE STATE  hero.state = { head, mid, tail: Vector3 (local), airborne: 0..1, progress } is refreshed every
//   update(): use them for the whale's shadow on the wheat.
// PURE READINGS (they set nothing, so a gaze can ask them at any progress)  hero.poseAt(p, head, mid, tail) fills the given
//   Vector3s (local) with the whale's snout, middle and flukes at progress p; hero.crownAt(p) is the crown's own clock at p:
//   under 0 before the snout goes back in, 0..1 while the crown stands (full height near 0.26), past 1 once it has fallen.
//
// OPTS  palette (brief palette), ceilingY 120, length 34 (every size scales with it), drop (56..62, seeded),
//   spanIn (52..60, seeded: horizontal run of the dive), spanOut (170..180, seeded: horizontal run of the climb),
//   (the camera line is laid for the whale that is built: there is one length)
//   viewSide 1, duration 24 (nominal seconds for progress 0..1; scales the splash clocks and the self-loop),
//   detail 1 (scales the droplet counts), lite false (a third of the water, coarser meshes),
//   calf false: true adds a 15 m calf that follows the same kind of arc beside its mother, slightly later
//   (hero.calf, a second piece built with lite; it shares the mother's clock and light),
//   ceiling 'full' | 'decal' | false: 'full' draws a translucent patch of sea ceiling (for viewing alone),
//   'decal' draws only its foam, rings and sun glitter (lay it 0.3 m under the world's ceiling), false draws none.
//   sunDir (Vector3 toward the sun), sunColor, skyColor, groundColor, crownHeight (19..24 m, seeded).
//   skin { top, belly }: hex colours that replace the palette-derived slate blue back and the throat / belly tone;
//   skin { back: [[r, g, b], [r, g, b]], under: [r, g, b] } gives the two back tones and the belly as linear rgb, used as given.
//   hero.setLight({ sunDir, sunColor, skyColor, groundColor }) changes them later.
//   ctx.yield, when present, is awaited between the pieces so that no build step is long.
//
// WORLD HOOK  hero.sea = { uTime, uSiteA, uSiteB } + the exported SEA_GLSL (seaH) let a world draw its own endless ceiling
//   with exactly this piece's swell, bulge and ripple rings; use ceiling: 'decal' and put that surface 0.3 m above ceilingY.
//
// COST  ~72k triangles while the whale is out (17k with lite; none while it is in the sea), 8 draw calls
//   (15 with the calf), no lights, no textures, ~100 ms build spread over several steps.
// LIGHTING  self-lit ShaderMaterials (linear HDR, scene fog honoured): a sun from above (through the
//   water), aqua sky light from the ceiling, a bounce from the wheat on the belly, moving
//   caustics on up-facing skin. Wants a bright aqua ceiling behind it and pale haze; water glints
//   reach ~2-4 so they bloom at threshold ~0.9.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0a3f6a', '#1f8fb8', '#8fe0e8', '#f2d27a', '#c99a3a', '#5a3f1a', '#ff5a3a'];
const NP = 72;

// ---------------------------------------------------------------------------------------------
// whale anatomy (fractions of body length): [t, half width, top, bottom]
// ---------------------------------------------------------------------------------------------
const PROFILE = [
  [0, 0.0005, 0.0005, 0.0005], [0.006, 0.016, 0.006, 0.010], [0.025, 0.034, 0.013, 0.022],
  [0.08, 0.052, 0.022, 0.040], [0.17, 0.066, 0.034, 0.058], [0.28, 0.072, 0.046, 0.066],
  [0.40, 0.070, 0.054, 0.061], [0.52, 0.062, 0.054, 0.051], [0.65, 0.046, 0.046, 0.040],
  [0.78, 0.027, 0.035, 0.030], [0.88, 0.013, 0.025, 0.022], [0.95, 0.007, 0.014, 0.012],
  [1.0, 0.004, 0.005, 0.005],
];
function prof(t, col) {
  const K = PROFILE; let i = 0;
  while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const k0 = K[Math.max(i - 1, 0)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(i + 2, K.length - 1)];
  const h = k2[0] - k1[0], u = clamp((t - k1[0]) / h, 0, 1);
  const m1 = ((k2[col] - k0[col]) / (k2[0] - k0[0])) * h, m2 = ((k3[col] - k1[col]) / (k3[0] - k1[0])) * h;
  const u2 = u * u, u3 = u2 * u;
  return 1.12 * Math.max(0.0004, (2 * u3 - 3 * u2 + 1) * k1[col] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[col] + (u3 - u2) * m2);
}
// mouth line as an angle (0..1 of a turn from the dorsal mid-line), also used by the skin shader
const mouthLine = (t) => lerp(0.19, 0.165, smoothstep(0, 0.1, t)) + smoothstep(0.12, 0.2, t) * 0.075;

// body-space point on the skin: x = side, y = dorsal, z = -distance behind the snout
function skin(t, th, L, out) {
  const w = prof(t, 1), top = prof(t, 2), bot = prof(t, 3);
  const sx = Math.sin(th), cy = Math.cos(th);
  const eT = lerp(0.72, 1.0, smoothstep(0.12, 0.34, t)), eB = lerp(0.8, 1.0, smoothstep(0.5, 0.8, t));
  let x = w * Math.sign(sx) * Math.pow(Math.abs(sx), 0.92);
  let y = cy >= 0 ? top * Math.pow(cy, eT) : -bot * Math.pow(-cy, eB);
  const thd = Math.min(th, Math.PI * 2 - th);                       // angle from the dorsal line
  // splash guard in front of the blowholes and the single rostral ridge
  y += 0.011 * Math.exp(-(((t - 0.165) / 0.022) ** 2)) * Math.exp(-((thd / 0.42) ** 2));
  y += 0.0035 * Math.exp(-((thd / 0.15) ** 2)) * (1.0 - smoothstep(0.11, 0.17, t)) * smoothstep(0, 0.02, t);
  // lower lip: the jaw is a little wider than the rostrum that sits in it
  const d = thd / (Math.PI * 2) - mouthLine(t);
  const lip = 0.0036 * Math.exp(-(((d - 0.022) / 0.02) ** 2)) * (1.0 - smoothstep(0.17, 0.23, t)) * smoothstep(0.0, 0.03, t);
  const r = Math.hypot(x, y) || 1; x += (x / r) * lip; y += (y / r) * lip;
  // tail-stock keels (the peduncle is a tall blade)
  const keel = smoothstep(0.7, 0.9, t) * 0.003 * Math.pow(Math.abs(cy), 6);
  y += Math.sign(cy) * keel;
  return out.set(x * L, y * L, -t * L);
}

async function buildWhaleGeometry(L, nT = 132, nA = 64, pause = async () => {}) {
  const pos = [], info = [], idx = [];
  const v = new THREE.Vector3();
  const seamPairs = [];
  // ---- body ----
  for (let i = 0; i <= nT; i++) {
    const u = i / nT, t = lerp(u, 0.5 - 0.5 * Math.cos(Math.PI * u), 0.55);
    for (let j = 0; j <= nA; j++) {
      skin(t, (j / nA) * Math.PI * 2, L, v);
      pos.push(v.x, v.y, v.z); info.push(t, j / nA, 0);
    }
    seamPairs.push(i * (nA + 1), i * (nA + 1) + nA);
    await pause();
  }
  await pause();
  for (let i = 0; i < nT; i++) {
    for (let j = 0; j < nA; j++) { const a = i * (nA + 1) + j, b = a + nA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    if (i % 16 === 15) await pause();
  }
  await pause();
  // ---- lofted fins: a closed aerofoil section swept along a span ----
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), Dn = new THREE.Vector3();
  function fin(o) {
    const base = pos.length / 3, first = idx.length;
    const span = new THREE.Vector3(...o.span).normalize();
    const chord = new THREE.Vector3(...(o.chord || [0, 0, 1])); chord.addScaledVector(span, -chord.dot(span)).normalize();
    const thick = new THREE.Vector3().crossVectors(span, chord).normalize();
    const nU = o.nU, nV = o.nV;
    for (let i = 0; i <= nU; i++) {
      const u = i / nU, c = Math.max(0.03, o.chordFn(u)), th = c * o.thick;
      A.set(...o.root).addScaledVector(span, o.len * u).addScaledVector(chord, -o.sweep(u)).addScaledVector(thick, o.bend ? o.bend(u) : 0);
      for (let j = 0; j < nV; j++) {
        const ph = (j / nV) * Math.PI * 2, cx = Math.cos(ph), sy = Math.sin(ph);
        B.copy(A).addScaledVector(chord, cx * 0.5 * c).addScaledVector(thick, sy * 0.5 * th * (0.55 + 0.45 * cx));
        pos.push(B.x, B.y, B.z); info.push(clamp(-B.z / L, 0, 1.1), 0, o.part);
      }
    }
    for (let i = 0; i < nU; i++) for (let j = 0; j < nV; j++) {
      const a = base + i * nV + j, b = base + i * nV + ((j + 1) % nV), c = a + nV, d = b + nV;
      idx.push(a, b, c, b, d, c);
    }
    // make the winding face outward whatever the handedness of this fin
    const i0 = first + (Math.floor(nU / 2) * nV + 1) * 6;
    A.fromArray(pos, idx[i0] * 3); B.fromArray(pos, idx[i0 + 1] * 3); Cc.fromArray(pos, idx[i0 + 2] * 3);
    Dn.subVectors(B, A).cross(Cc.clone().sub(A));
    const mid = new THREE.Vector3(...o.root).addScaledVector(span, o.len * 0.5).addScaledVector(chord, -o.sweep(0.5));
    if (Dn.dot(A.clone().add(B).add(Cc).multiplyScalar(1 / 3).sub(mid)) < 0) {
      for (let k = first; k < idx.length; k += 3) { const tmp = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = tmp; }
    }
  }
  for (const sgn of [1, -1]) {
    await pause();
    // pectoral flipper: long, slender, pointed, swept back and down
    skin(0.245, 2.05, L, v);
    fin({ part: 1, root: [sgn * (v.x - 0.25), v.y + 0.1, v.z], span: [sgn * 0.74, -0.36, -0.57], len: 0.15 * L, nU: 14, nV: 14,
      chordFn: (u) => 0.031 * L * 1.6 * (0.7 + u) * Math.pow(1 - u, 0.75), sweep: (u) => 0.04 * L * u * u, thick: 0.2,
      bend: (u) => 0.012 * L * u * u * sgn });
    await pause();
    // fluke lobe
    fin({ part: 2, root: [0, 0, -0.957 * L], span: [sgn, 0, 0], len: 0.128 * L, nU: 16, nV: 14,
      chordFn: (u) => L * (0.09 * Math.pow(1 - u, 0.75) + 0.003), sweep: (u) => L * (0.03 * u + 0.055 * u * u), thick: 0.14,
      bend: (u) => -0.006 * L * u * u * sgn });
  }
  await pause();
  // small falcate dorsal fin, far back
  fin({ part: 1, root: [0, prof(0.755, 2) * L - 0.08, -0.755 * L], span: [0, 0.88, -0.47], len: 0.017 * L, nU: 6, nV: 10,
    chordFn: (u) => L * (0.034 * Math.pow(1 - u, 0.8) + 0.004), sweep: (u) => L * 0.02 * Math.pow(u, 1.5), thick: 0.2 });

  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  await pause();
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  await pause();
  g.setIndex(idx);
  await pause();
  g.computeVertexNormals();
  await pause();
  const n = g.attributes.normal;
  for (let k = 0; k < seamPairs.length; k += 2) {                 // weld the normals across the dorsal seam
    const a = seamPairs[k], b = seamPairs[k + 1];
    A.fromBufferAttribute(n, a).add(B.fromBufferAttribute(n, b)).normalize();
    n.setXYZ(a, A.x, A.y, A.z); n.setXYZ(b, A.x, A.y, A.z);
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// shared GLSL
// ---------------------------------------------------------------------------------------------
const GLSL_PATH = /* glsl */`
#define NP ${NP}
uniform vec3 uPath[NP];
uniform float uPathStep;
uniform float uHead;
uniform vec4 uRoll;
uniform float uTime;
uniform float uCeil;
uniform float uLen;
vec3 pathPos(float s, out vec3 T) {
  float f = s / uPathStep;
  float fc = clamp(f, 0.0, float(NP - 1) - 0.001);
  int i = int(floor(fc)); float t = fc - float(i);
  vec3 p0 = uPath[max(i - 1, 0)], p1 = uPath[i], p2 = uPath[min(i + 1, NP - 1)], p3 = uPath[min(i + 2, NP - 1)];
  vec3 b = p2 - p0, c = 2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3, d = -p0 + 3.0 * p1 - 3.0 * p2 + p3;
  vec3 pos = 0.5 * (2.0 * p1 + b * t + c * t * t + d * t * t * t);
  T = normalize(0.5 * (b + 2.0 * c * t + 3.0 * d * t * t));
  return pos + T * (f - fc) * uPathStep;
}
// frame along the path: S = whale's right, N = dorsal, T = forward; includes the slow roll
void pathFrame(float s, out vec3 P, out vec3 S, out vec3 N, out vec3 T) {
  P = pathPos(s, T);
  vec3 z = vec3(0.0, 0.0, -1.0);
  S = normalize(z - T * dot(z, T));
  N = cross(T, S);
  float r = uRoll.x + uRoll.y * smoothstep(uRoll.z, uRoll.w, s);
  float c = cos(r), sn = sin(r);
  vec3 S2 = S * c + N * sn; N = N * c - S * sn; S = S2;
}
`;
const GLSL_NOISE = /* glsl */`
float hash11(float n) { return fract(sin(n) * 43758.5453123); }
float hash31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s / 0.9375; }
// animated caustic network, 0..~1.5
float caustic(vec2 uv, float time) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0; vec2 i = p; float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / 0.005), p.y / (cos(i.y + t) / 0.005)));
  }
  c = 1.17 - pow(c / 4.0, 1.4);
  return pow(abs(c), 8.0);
}
`;

// ---------------------------------------------------------------------------------------------
// whale skin
// ---------------------------------------------------------------------------------------------
const WHALE_VERT = /* glsl */`
${GLSL_PATH}
uniform float uBeat;
attribute vec3 aInfo;
varying vec3 vBody; varying vec3 vNb; varying vec3 vInfo; varying vec3 vWN; varying vec3 vWT; varying vec3 vWP;
varying float vLocalY; varying float vS;
#include <fog_pars_vertex>
void main() {
  float d = -position.z;
  float s = uHead - d;
  vec3 P, S, N, T; pathFrame(s, P, S, N, T);
  // slow dorso-ventral swimming wave growing toward the flukes
  float k = d / uLen, ph = uTime * uBeat - k * 3.2;
  float fy = uLen * 0.045 * k * k * sin(ph);
  float df = 0.045 * (2.0 * k * sin(ph) - 3.2 * k * k * cos(ph));
  vec3 lp = P + S * position.x + N * (position.y + fy);
  vec3 nb = normalize(vec3(normal.x, normal.y, normal.z + df * normal.y));
  vec3 ln = S * nb.x + N * nb.y + T * nb.z;
  vBody = position; vNb = normal; vInfo = aInfo; vLocalY = lp.y; vS = s;
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vWP = wp.xyz; vWN = mat3(modelMatrix) * ln; vWT = mat3(modelMatrix) * T;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WHALE_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uSkinA, uSkinB, uBelly, uSeaTint;
uniform float uTime, uCeil, uLen, uSeed, uExitS, uEnterS;
varying vec3 vBody; varying vec3 vNb; varying vec3 vInfo; varying vec3 vWN; varying vec3 vWT; varying vec3 vWP;
varying float vLocalY; varying float vS;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main() {
  vec3 N = normalize(vWN); vec3 V = normalize(cameraPosition - vWP);
  float t = vInfo.x, th = vInfo.y, part = vInfo.z;
  float isBody = 1.0 - step(0.5, part);
  vec3 q = vBody * (30.0 / uLen) + uSeed;
  float m1 = fbm3(q * 0.55), m2 = fbm3(q * 2.1 + 7.0), m3 = vnoise(q * 8.0);
  // slate blue with the pale mottling of a blue whale, darker along the back
  vec3 alb = mix(uSkinA, uSkinB, smoothstep(0.35, 0.72, m1) * 0.8);
  float spots = smoothstep(0.56, 0.74, m2) * (0.4 + 0.6 * m1);
  alb = mix(alb, uSkinB * 1.7 + 0.03, spots * 0.6);
  alb *= 0.82 + 0.36 * m3;
  float ventral = (1.0 - smoothstep(-0.6, 0.2, normalize(vNb).y));
  alb = mix(alb, uBelly * (0.7 + 0.6 * m1) * (0.72 + 0.5 * smoothstep(0.3, 0.7, m2)) + spots * 0.1, ventral * mix(0.3, 0.7, isBody));
  alb *= mix(1.0, 0.72, smoothstep(0.5, 0.95, normalize(vNb).y) * isBody);
  // throat pleats: grooves from chin to navel
  float a = abs(th - 0.5) * 2.0;                                    // 0 at the belly line, 1 on the back
  float zone = isBody * (1.0 - smoothstep(0.48, 0.62, a)) * (1.0 - smoothstep(0.50, 0.60, t)) * smoothstep(0.012, 0.05, t);
  float pk = th * 6.28318 * 58.0;
  float aa = clamp(1.7 - fwidth(pk) * 0.8, 0.0, 1.0);
  float groove = smoothstep(0.25, 0.95, sin(pk));
  alb *= 1.0 - zone * groove * 0.62 * aa;
  vec3 circ = normalize(cross(normalize(vWT), N));
  N = normalize(N + circ * cos(pk) * 0.6 * zone * aa);
  // mouth line, lip and eye
  float a2 = min(th, 1.0 - th);
  float thm = mix(0.19, 0.165, smoothstep(0.0, 0.1, t)) + smoothstep(0.12, 0.2, t) * 0.075;
  float mouth = isBody * (1.0 - smoothstep(0.001, 0.007, abs(a2 - thm))) * step(t, 0.203) * smoothstep(0.0, 0.012, t);
  float lip = isBody * (1.0 - smoothstep(0.008, 0.035, a2 - thm)) * step(thm, a2) * step(t, 0.2);
  alb = mix(alb, alb * 1.5 + 0.03, lip * 0.5);
  alb *= 1.0 - 0.8 * mouth;
  float eyeD = length(vec2((t - 0.207) * uLen, (a2 - 0.262) * 11.0));
  alb = mix(alb, vec3(0.01, 0.012, 0.016), isBody * (1.0 - smoothstep(0.10, 0.17, eyeD)));
  alb = mix(alb, alb * 1.6, isBody * (1.0 - smoothstep(0.2, 0.34, eyeD)) * smoothstep(0.14, 0.2, eyeD) * 0.6);
  // light: sun through the water, aqua from the sea above, gold bounce off the wheat below
  float ndl = dot(N, uSunDir);
  float wrap = clamp(ndl * 0.75 + 0.25, 0.0, 1.0);
  vec3 hemi = mix(uGroundCol * 1.05 + uSkyCol * 0.32, uSkyCol, smoothstep(-0.9, 0.9, N.y));
  float ca = caustic(vWP.xz * 0.055 + vWP.y * 0.01, uTime * 0.5);
  vec3 col = alb * (hemi * 0.8 + uSunCol * wrap * (0.4 + 0.9 * ca * smoothstep(-0.1, 0.6, N.y)));
  float sub = 1.0 - smoothstep(0.0, 1.2, vLocalY - uCeil);
  // wet sheen
  vec3 H = normalize(V + uSunDir); float nh = max(dot(N, H), 0.0);
  col += sub * uSunCol * (pow(nh, 140.0) * 1.1 + pow(nh, 24.0) * 0.04) * (0.5 + 0.5 * m3) * smoothstep(-0.1, 0.2, ndl);
  float fr = pow(max(1.0 - max(dot(N, V), 0.0), 0.0), 3.5);
  vec3 env = mix(uGroundCol * 1.5, uSkyCol * 1.25, smoothstep(-0.35, 0.35, reflect(-V, N).y));
  col += sub * env * fr * 0.2;
  // white water still sliding off skin that has just left the sea
  float outside = smoothstep(uExitS, uExitS + 3.0, vS) * (1.0 - smoothstep(uEnterS - 2.0, uEnterS + 1.0, vS));
  float fresh = outside * exp(-max(vS - uExitS, 0.0) / 70.0);
  float streak = vnoise(vec3(th * 44.0, t * uLen * 0.55 + uTime * 1.6, uSeed));
  float run = smoothstep(0.66, 0.92, streak) * (0.2 + 0.8 * fresh) * outside;
  float seam = outside * ((1.0 - smoothstep(0.0, 4.0, vS - uExitS)) + (1.0 - smoothstep(0.0, 5.0, uEnterS - vS)));
  col = mix(col, vec3(0.75, 0.92, 1.0) * 1.1, clamp(run * 0.28 + seam * (0.4 + 0.6 * streak) * 0.8, 0.0, 1.0));
  // going back in, the skin within a few metres of the sea is veiled by the white water of the crown: pale flukes, not dark shards
  col = mix(col, vec3(0.8, 0.93, 1.0) * (0.78 + 0.3 * streak), 0.55 * smoothstep(uEnterS - 16.0, uEnterS - 5.0, vS) * (1.0 - smoothstep(0.0, 6.0, uCeil - vLocalY)));
  // parts still inside the sea above: a soft blue shape
  float depth = max(vLocalY - uCeil, 0.0);
  col = mix(col, uSeaTint * (0.7 + 0.5 * ca), smoothstep(0.0, 1.5, depth) * 0.6 + (1.0 - exp(-depth * 0.25)) * 0.4);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------
// sea ceiling patch (also used as a foam / ring / glitter decal under the kit's ceiling)
// ---------------------------------------------------------------------------------------------
const GLSL_SEA = /* glsl */`
uniform float uTime;
uniform vec4 uSiteA;   // x, z, seconds since the snout crossed, bulge depth
uniform vec4 uSiteB;
float ringH(vec2 p, vec4 site) {
  float t = site.z; if (t < -3.0) return 0.0;
  float r = length(p - site.xy), tp = max(t, 0.0);
  float Rw = 5.0 + 7.5 * tp;
  float env = exp(-tp * 0.17) * smoothstep(0.0, 0.6, tp);
  float q = (r - Rw) / (9.0 + 2.5 * tp);
  float h = 1.5 * env * sin((r - Rw) * 0.5) * exp(-q * q);
  h += 0.7 * env * sin(r * 1.1 - tp * 6.0) * exp(-r / (5.0 + 2.5 * tp));
  float b = smoothstep(-2.4, 0.0, t) * (1.0 - smoothstep(0.8, 3.4, t));
  return h - site.w * b * exp(-r * r / 70.0);
}
float seaH(vec2 p) {
  float h = 0.55 * sin(p.x * 0.045 + uTime * 0.5) + 0.4 * sin(dot(p, vec2(0.031, 0.052)) - uTime * 0.42 + 1.7)
          + 0.22 * sin(dot(p, vec2(-0.09, 0.07)) + uTime * 0.8);
  return h + ringH(p, uSiteA) + ringH(p, uSiteB);
}`;
const SEA_VERT = /* glsl */`
${GLSL_SEA}
uniform float uCeil;
varying vec3 vLP; varying vec3 vWP;
#include <fog_pars_vertex>
void main() {
  vec3 lp = vec3(position.x, uCeil + seaH(position.xz), position.z);
  vLP = lp;
  vec4 wp = modelMatrix * vec4(lp, 1.0); vWP = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SEA_FRAG = /* glsl */`
${GLSL_SEA}
${GLSL_NOISE}
uniform vec3 uSunDir, uSunCol, uDeepCol, uAquaCol, uReflCol;
uniform vec2 uExtent; uniform float uBase, uMid;
uniform mat4 modelMatrix;
varying vec3 vLP; varying vec3 vWP;
#include <fog_pars_fragment>
float foamAt(vec2 p, vec4 site, float n) {
  float t = site.z; if (t < -1.0) return 0.0;
  float r = length(p - site.xy), tp = max(t, 0.0);
  float churn = exp(-r * r / (30.0 + 55.0 * tp)) * smoothstep(-0.6, 0.4, t) * exp(-max(tp - 1.2, 0.0) * 0.42);
  churn *= 0.3 + 0.7 * smoothstep(1.5, 5.5 + 2.5 * tp, r);         // a ring of foam round the hole, not a white lid over it
  float Rw = 5.0 + 7.5 * tp;
  float q = (r - Rw) / (8.0 + 2.0 * tp);
  float crest = smoothstep(0.55, 1.0, sin((r - Rw) * 0.5 + 1.2)) * exp(-q * q) * exp(-tp * 0.3) * smoothstep(0.0, 0.5, tp);
  return clamp(churn * (0.3 + 0.9 * n) + crest * (0.3 + 0.9 * n), 0.0, 1.0);
}
void main() {
  vec2 p = vLP.xz; float e = 0.7;
  float h0 = seaH(p), hx = seaH(p + vec2(e, 0.0)), hz = seaH(p + vec2(0.0, e));
  vec3 n = vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e);
  vec2 w = p * 0.33;
  n.xz += 0.11 * vec2(sin(w.x * 1.3 + uTime * 1.1 + 1.7 * sin(w.y * 0.9 - uTime * 0.3)), cos(w.y * 1.1 - uTime * 0.9 + 1.7 * sin(w.x * 1.2)));
  n.xz += 0.09 * (vec2(vnoise(vec3(p * 0.9, uTime * 0.6)), vnoise(vec3(p * 0.9 + 31.0, uTime * 0.6))) - 0.5);
  vec3 nW = normalize(mat3(modelMatrix) * normalize(n));
  vec3 V = normalize(cameraPosition - vWP);
  vec3 nF = dot(nW, V) < 0.0 ? -nW : nW;
  float ndv = max(dot(nF, V), 0.0);
  float F = 0.03 + 0.97 * pow(max(1.0 - ndv, 0.0), 5.0);
  // looking into lit water: turquoise, with the caustic net drifting over it
  // the caustic net and the sun are the world's job when this patch is only a decal (uBase 0)
  float ca = 0.0, ca2 = 0.0;
  if (uBase > 0.5) { ca = caustic(p * 0.021 + n.xz * 0.25, uTime * 0.45); ca2 = caustic(p * 0.0083 - n.xz * 0.2 + 3.1, uTime * 0.3); }
  vec3 trans = mix(uDeepCol, uAquaCol, clamp(0.3 + ca * 0.8 + ca2 * 0.5 + h0 * 0.12, 0.0, 1.0));
  trans += uSunCol * (ca * 0.28 + ca2 * 0.12);
  // the sun seen through the surface
  vec3 R = refract(-V, nF, 0.75);
  float sg = max(dot(R, uSunDir * sign(R.y + 1e-4)), 0.0);
  vec3 sunT = uBase * uSunCol * (pow(sg, 500.0) * 5.0 + (pow(sg, 60.0) * 0.45 + pow(sg, 8.0) * 0.06) * (0.35 + 1.3 * ca));
  vec3 col = mix(trans + sunT, uReflCol, F * 0.85);
  float fn = fbm3(vec3(p * 0.45, uTime * 0.5));
  float foam = max(foamAt(p, uSiteA, fn), foamAt(p, uSiteB, fn));
  col = mix(col, vec3(1.0, 1.04, 1.06) * (1.0 + 0.5 * fn), foam);
  vec2 ed = abs(p - vec2(uMid, 0.0)) / uExtent;
  float edge = 1.0 - smoothstep(0.55, 1.0, length(ed * ed * vec2(1.0, 1.0)) * 1.05 + 0.25 * max(ed.x, ed.y));
  float full = mix(0.6, 0.96, F);
  float alpha = max(full * uBase, foam * 0.95) * edge;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------
// water leaving the whale: ribbons and droplets that trail back along its path and fall UP
// ---------------------------------------------------------------------------------------------
const GLSL_TRAIL = /* glsl */`
// att: body-space attach point (x, y, distance behind snout); a: how far back along the path the
// water was shed (metres). Returns the local position of that water now.
vec3 trailAt(vec3 att, float a, float rise, float spread, float seed, out float emitY) {
  float s = uHead - att.z - a;
  vec3 P, S, N, T; pathFrame(s, P, S, N, T);
  vec3 off = S * att.x + N * att.y;
  vec3 e = P + off;
  emitY = e.y;
  vec3 o = normalize(off + vec3(1e-4));
  float wob = sin(a * 0.21 + seed * 40.0 + uTime * 0.8) * 0.5 + sin(a * 0.47 + seed * 17.0 - uTime * 1.3) * 0.25;
  return e + o * (0.12 + spread * a * 0.16) + S * (wob * a * 0.06)
       + vec3(0.0, rise * a * a, 0.0) + T * (a * 0.12 * exp(-a * 0.05));
}`;
const RIBBON_VERT = /* glsl */`
${GLSL_PATH}
${GLSL_TRAIL}
attribute vec4 aPar;   // trail length, rise, spread, width
attribute vec3 aUV;    // f along 0..1, side -1/1, seed
varying vec3 vUV; varying float vAlpha; varying float vA;
#include <fog_pars_vertex>
void main() {
  float f = aUV.x, a = pow(f, 1.25) * aPar.x;
  float eY, eY2;
  vec3 p = trailAt(position, a, aPar.y, aPar.z, aUV.z, eY);
  vec3 p2 = trailAt(position, a + 0.4, aPar.y, aPar.z, aUV.z, eY2);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 wt = normalize(mat3(modelMatrix) * (p2 - p));
  vec3 side = normalize(cross(wt, normalize(cameraPosition - wp.xyz)));
  float wdt = aPar.w * (0.25 + 0.75 * smoothstep(0.0, 0.3, f)) * (1.0 + a * 0.09);
  wp.xyz += side * aUV.y * wdt;
  vUV = aUV; vA = a;
  vAlpha = smoothstep(0.0, 0.04, f) * pow(max(1.0 - f, 0.0), 2.1) * (1.0 - smoothstep(uCeil - 3.5, uCeil - 0.4, eY)) * (1.0 - smoothstep(uCeil - 3.0, uCeil + 0.4, p.y));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIBBON_FRAG = /* glsl */`
uniform vec3 uWaterA, uWaterB; uniform float uTime;
varying vec3 vUV; varying float vAlpha; varying float vA;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main() {
  float x = vUV.y, seed = vUV.z;
  float flow = vA * 0.22 - uTime * 2.4;
  float n = vnoise(vec3(x * 2.2 + seed * 13.0, flow, seed * 7.0));
  float n2 = vnoise(vec3(x * 6.0 + seed * 5.0, flow * 2.3, 3.0));
  // not a sheet: each ribbon is a thread or two of water that is whole only where it leaves the skin and breaks at once into
  // beads that run up it, with a fizz of fine spray between the threads
  float thread = pow(max(0.5 + 0.5 * sin(x * 6.5 + seed * 30.0 + n * 5.0), 0.0), 6.0);
  float beads = smoothstep(0.5, 0.74, vnoise(vec3(seed * 31.0 + x * 1.5, flow * 7.0, 1.7)));
  float fizz = smoothstep(0.7, 0.9, vnoise(vec3(x * 9.0 + seed * 3.0, flow * 15.0, seed * 11.0)));
  float gaps = smoothstep(0.22, 0.55, n + (1.0 - vUV.x) * 0.4);
  float young = 1.0 - smoothstep(0.0, 0.22, vUV.x);
  float alpha = vAlpha * (1.0 - x * x) * gaps * (0.55 * thread * mix(beads, 1.0, young) * (0.45 + 0.55 * n2) + 0.15 * fizz * (1.0 - young));
  vec3 col = mix(uWaterA, uWaterB, clamp(thread * 0.8 + fizz * 0.5 + 0.15, 0.0, 1.0)) * (0.9 + 1.2 * n2 * n2 * n2 * thread);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  #include <fog_fragment>
}`;
const DROP_FRAG = /* glsl */`
uniform vec3 uWaterA, uWaterB; uniform float uTime;
varying vec2 vQ; varying float vAlpha; varying float vSeed;
#include <fog_pars_fragment>
void main() {
  float d = length(vQ * 2.0);
  float body = (1.0 - smoothstep(0.25, 1.0, d));
  float tw = pow(0.5 + 0.5 * sin(uTime * (5.0 + vSeed * 9.0) + vSeed * 60.0), 6.0);
  vec3 col = mix(uWaterA, uWaterB, 0.45 + 0.5 * (1.0 - smoothstep(0.0, 0.6, d))) * (0.85 + 2.4 * tw);
  gl_FragColor = vec4(col, vAlpha * body * 0.7);
  #include <fog_fragment>
}`;
const GLSL_QUAD = /* glsl */`
// stretched camera-facing streak: 'position.xy' is the quad corner
vec4 streak(vec3 lp, vec3 lvel, float size, float stretch) {
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vec3 along = normalize(mat3(modelMatrix) * lvel + vec3(0.0, 1e-4, 0.0));
  vec3 side = normalize(cross(along, normalize(cameraPosition - wp.xyz)));
  wp.xyz += along * position.y * size * stretch + side * position.x * size * 0.62;
  return wp;
}`;
const TRAILDROP_VERT = /* glsl */`
${GLSL_PATH}
${GLSL_TRAIL}
${GLSL_QUAD}
uniform float uFlow;
attribute vec3 aAtt; attribute vec4 aPar; attribute vec4 aSeed;   // phase, seed, scatter angle, speed
varying vec2 vQ; varying float vAlpha; varying float vSeed;
#include <fog_pars_vertex>
void main() {
  float A = aPar.x;
  float tau = fract(uTime * uFlow * aSeed.w / A + aSeed.x);
  float a = tau * A;
  float eY, eY2;
  vec3 p = trailAt(aAtt, a, aPar.y, aPar.z, aSeed.y, eY);
  vec3 p2 = trailAt(aAtt, a + 0.35, aPar.y, aPar.z, aSeed.y, eY2);
  vec3 sc = vec3(cos(aSeed.z), sin(aSeed.z * 1.7) * 0.5, sin(aSeed.z));
  p += sc * a * 0.11 * (0.3 + aSeed.y);
  float alive = smoothstep(0.0, 0.04, tau) * (1.0 - smoothstep(0.75, 1.0, tau))
              * (1.0 - smoothstep(uCeil - 3.0, uCeil - 0.4, eY)) * (1.0 - smoothstep(uCeil - 1.5, uCeil + 0.3, p.y));
  float size = aPar.w * (0.6 + 0.4 * alive);
  vec4 wp = streak(p, p2 - p, size * step(0.01, alive), 1.15 + 0.95 * aSeed.y);   // beads, a little drawn out, not streaks
  vQ = position.xy; vAlpha = alive; vSeed = aSeed.y;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// ballistic splash drops thrown out of the two holes and pulled back up into the ceiling
const SPLASHDROP_VERT = /* glsl */`
${GLSL_QUAD}
uniform vec3 uSitePos[2]; uniform vec3 uSiteAxis[2]; uniform float uSiteClock[2];
uniform float uG, uCeil, uR0;
attribute vec4 aLaunch;   // angle, speed out, speed down, delay
attribute vec4 aMisc;     // site, size, seed, start radius scale
varying vec2 vQ; varying float vAlpha; varying float vSeed;
#include <fog_pars_vertex>
void main() {
  int k = int(aMisc.x + 0.5);
  float t = uSiteClock[k] - aLaunch.w, tt = max(t, 0.0);
  vec3 rd = vec3(cos(aLaunch.x), 0.0, sin(aLaunch.x));
  vec3 v0 = rd * aLaunch.y + uSiteAxis[k] * aLaunch.z;
  float drag = (1.0 - exp(-tt * 0.35)) / 0.35;
  vec3 p = uSitePos[k] + rd * (uR0 * aMisc.w) + v0 * drag + vec3(0.0, 0.5 * uG * tt * tt, 0.0);
  vec3 vel = v0 * exp(-tt * 0.35) + vec3(0.0, uG * tt, 0.0);
  float alive = step(0.0, t) * (1.0 - smoothstep(uCeil - 1.2, uCeil + 0.2, p.y));
  vec4 wp = streak(p, vel, aMisc.y * step(0.01, alive), 1.5 + 0.09 * length(vel));
  vQ = position.xy; vAlpha = alive; vSeed = aMisc.z;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---------------------------------------------------------------------------------------------
// the water sheet dragged out of the exit hole, and the crown at re-entry (same mesh, two uses)
// ---------------------------------------------------------------------------------------------
const CROWN_VERT = /* glsl */`
uniform vec3 uC, uAxis; uniform vec4 uShape;   // height, base radius, flare, opacity
uniform float uSpikes, uSeed, uCeil;
attribute vec2 aUV;
varying vec2 vUV; varying vec3 vWP; varying vec3 vWN; varying float vJag;
#include <fog_pars_vertex>
void main() {
  float th = aUV.x * 6.28318, v = aUV.y;
  vec3 rd = vec3(cos(th), 0.0, sin(th));
  // many thin fingers of unequal length, on three broad lobes
  float j1 = 0.5 + 0.5 * sin(th * uSpikes + sin(th * 3.0 + uSeed) * 1.3 + uSeed * 7.0);
  float j2 = 0.5 + 0.5 * sin(th * (uSpikes * 1.5 + 1.0) + uSeed * 3.0 + 2.0 * sin(th * 5.0));
  float jag = j1 * (0.55 + 0.45 * j2);
  float lobes = 1.0 + 0.2 * sin(th * 3.0 + uSeed * 3.0) + 0.1 * sin(th * 7.0 + uSeed);
  float h = uShape.x * lobes * v * (0.7 + 0.32 * jag * v);
  float r = uShape.y * (1.0 + 0.9 * exp(-v * 7.0)) + uShape.z * pow(v, 0.65) * lobes * (0.9 + 0.22 * j2 * v);
  vec3 lp = uC + uAxis * h + rd * r;
  lp.y = min(lp.y, uCeil + 0.6);
  vec3 ln = normalize(rd - uAxis * (0.25 + 0.5 * (1.0 - v)));
  vUV = aUV; vJag = jag;
  vec4 wp = modelMatrix * vec4(lp, 1.0); vWP = wp.xyz; vWN = mat3(modelMatrix) * ln;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CROWN_FRAG = /* glsl */`
uniform vec3 uWaterA, uWaterB, uSunDir, uSunCol; uniform vec4 uShape;
uniform float uSpikes, uSeed, uTime;
varying vec2 vUV; varying vec3 vWP; varying vec3 vWN; varying float vJag;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main() {
  float v = vUV.y;
  float n = vnoise(vec3(vUV.x * 70.0, v * 4.0 - uTime * 1.6, uSeed));
  float n2 = vnoise(vec3(vUV.x * 210.0, v * 11.0 - uTime * 2.6, uSeed + 5.0));
  float tip = 0.46 + 0.5 * sqrt(max(vJag, 0.0));                              // how far up this finger reaches
  float edge = v + (n - 0.5) * 0.3;
  float mask = (1.0 - smoothstep(tip - 0.3, tip, edge)) * (1.0 - 0.8 * smoothstep(0.3, 0.95, v));   // a soft, torn upper edge that thins away
  vec3 N = normalize(vWN), V = normalize(cameraPosition - vWP);
  if (dot(N, V) < 0.0) N = -N;
  float fr = pow(max(1.0 - max(dot(N, V), 0.0), 0.0), 2.0);
  float fil = smoothstep(0.35, 0.9, n2) * smoothstep(0.3, 0.75, n);  // filaments of white water running down the sheet
  float bead = smoothstep(tip - 0.3, tip - 0.08, edge) * smoothstep(0.45, 0.8, n2);   // beaded rim breaking into drops
  float foot = (1.0 - smoothstep(0.0, 0.14, v));
  float foam = clamp(fil * 0.7 + bead + foot * 0.7, 0.0, 1.0);
  float sp = pow(max(dot(reflect(-V, N), uSunDir), 0.0), 30.0);
  vec3 col = mix(mix(uWaterA, uWaterB, 0.45), uWaterB, clamp(foam * 0.8 + fr * 0.25, 0.0, 1.0)) + uSunCol * sp * 0.5 + uWaterB * bead * 0.6;
  float alpha = uShape.w * mask * clamp(0.06 + 0.2 * fr + 0.52 * foam, 0.0, 0.72) * (0.6 + 0.4 * smoothstep(0.2, 0.6, n + (1.0 - v) * 0.5));   // a veil: the hole shows through it
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;
const MIST_VERT = /* glsl */`
uniform vec3 uSitePos[2]; uniform vec3 uSiteAxis[2]; uniform float uSiteClock[2];
attribute vec4 aM;    // site, angle, radius 0..1, depth 0..1
attribute vec3 aM2;   // size, seed, delay
varying vec2 vQ; varying float vAlpha; varying float vSeed;
#include <fog_pars_vertex>
void main() {
  int k = int(aM.x + 0.5);
  float t = uSiteClock[k] - aM2.z, tt = max(t, 0.0);
  float env = smoothstep(0.0, 0.7, t) * exp(-max(tt - 1.0, 0.0) * 0.5);
  vec3 rd = vec3(cos(aM.y), 0.0, sin(aM.y));
  vec3 lp = uSitePos[k] + rd * aM.z * (3.5 + 3.4 * tt) + uSiteAxis[k] * aM.w * (5.0 + 9.0 * (1.0 - exp(-tt * 0.7)));
  lp.y += 0.25 * tt * tt;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(lp, 1.0);
  mvPosition.xy += position.xy * aM2.x * (1.0 + 0.45 * tt) * step(0.004, env);
  vQ = position.xy; vAlpha = env; vSeed = aM2.y;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MIST_FRAG = /* glsl */`
uniform vec3 uWaterB; uniform float uTime;
varying vec2 vQ; varying float vAlpha; varying float vSeed;
${GLSL_NOISE}
#include <fog_pars_fragment>
void main() {
  float d = length(vQ * 2.0);
  float n = vnoise(vec3(vQ * 3.0 + vSeed * 20.0, uTime * 0.4 + vSeed * 9.0));
  float a = (1.0 - smoothstep(0.1, 1.0, d + (n - 0.5) * 0.5));
  gl_FragColor = vec4(uWaterB * 0.92, a * a * vAlpha * 0.045);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------------------------
const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
const fract = (x) => x - Math.floor(x);

// the chase beside the climb, in metres for a 44 m whale: [share of the climb, behind the whale's middle, to the side, below it]
const CHASE = [[0, 34, 37, 15], [0.25, 30, 29, 12.5], [0.5, 24.5, 23.5, 12.5], [0.75, 27.5, 26.5, 16.5], [1, 35, 35, 27]];
// and the line on from the re-entry: [metres on, metres out to the camera's side, share of the climb to the level run]
const AFTER = [[38, 7, 0.2], [83, 19, 0.44], [128, 33, 0.68], [173, 45, 0.88], [218, 52.5, 1], [263, 54.5, 1], [308, 54.5, 1]];
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pause = async () => { if (ctx.yield) await ctx.yield(); };
  const pal = DEFAULT_PALETTE.map((h, i) => new THREE.Color((opts.palette && opts.palette[i]) || h));
  const C = opts.ceilingY ?? 120;
  const L = opts.length ?? 34, Ls = L / 32;
  const drop = opts.drop ?? rng.range(56, 62);
  const spanIn = opts.spanIn ?? rng.range(52, 60), spanOut = opts.spanOut ?? rng.range(170, 180);
  const vs = opts.viewSide ?? rng.sign();               // which side (+Z or -Z) the camera watches the dive from
  const T = opts.duration ?? 24;
  const lite = !!opts.lite, kq = (lite ? 0.3 : 1) * (opts.detail ?? ctx.quality?.detail ?? 1);
  const ceilingMode = opts.ceiling === undefined ? 'full' : opts.ceiling;
  const WHALE_SPAN = 0.86;                              // share of progress the whale itself uses
  const root = new THREE.Group(); root.name = 'the-breach';

  // ---- the arc: level in the sea, a steep dive out, then a long shallow climb back in ----
  const zb = rng.range(3, 7) * rng.sign(), yN = C - drop, a = spanIn, b = spanOut;
  const ctrl = [
    [-a - 72, C + 13, -zb * 1.25], [-a - 44, C + 12, -zb * 1.1], [-a - 19, C + 8.5, -zb * 0.9], [-a, C, -zb * 0.7],
    [-a * 0.62, C - drop * 0.52, -zb * 0.35], [-a * 0.3, C - drop * 0.88, -zb * 0.12],
    [0, yN, 0],
    [b * 0.22, C - drop * 0.93, zb * 0.1], [b * 0.5, C - drop * 0.68, zb * 0.3], [b * 0.78, C - drop * 0.32, zb * 0.5],
    [b, C, zb * 0.7], [b + 26, C + 8.5, zb * 0.9], [b + 56, C + 12, zb * 1.1], [b + 86, C + 13, zb * 1.25],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  curve.arcLengthDivisions = 600;
  const pathPts = curve.getSpacedPoints(NP - 1), pathLen = curve.getLength(), pathStep = pathLen / (NP - 1);
  await pause();
  // same evaluation as the shader
  const _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
  function pathAt(s, outP, outT) {
    const f = s / pathStep, fc = clamp(f, 0, NP - 1 - 0.001), i = Math.floor(fc), t = fc - i;
    const p0 = pathPts[Math.max(i - 1, 0)], p1 = pathPts[i], p2 = pathPts[Math.min(i + 1, NP - 1)], p3 = pathPts[Math.min(i + 2, NP - 1)];
    _b.subVectors(p2, p0);
    _c.copy(p0).multiplyScalar(2).addScaledVector(p1, -5).addScaledVector(p2, 4).sub(p3);
    _d.copy(p1).multiplyScalar(3).sub(p0).addScaledVector(p2, -3).add(p3);
    const tan = (outT || new THREE.Vector3()).copy(_b).addScaledVector(_c, 2 * t).addScaledVector(_d, 3 * t * t).normalize();
    outP.copy(p1).multiplyScalar(2).addScaledVector(_b, t).addScaledVector(_c, t * t).addScaledVector(_d, t * t * t).multiplyScalar(0.5);
    return outP.addScaledVector(tan, (f - fc) * pathStep);
  }
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
  await pause();
  let sExit = 0, sEnter = pathLen, sNadir = pathLen / 2, minY = 1e9, prevY = C + 10;
  for (let s = 0, n = 0; s <= pathLen; s += 0.25) {
    const y = pathAt(s, tmpP).y;
    if (prevY >= C && y < C && sExit === 0) sExit = s;
    if (prevY < C && y >= C) sEnter = s;
    if (y < minY) { minY = y; sNadir = s; }
    prevY = y;
    if (++n % 60 === 0) await pause();
  }
  const exitPoint = pathAt(sExit, new THREE.Vector3()); const exitT = new THREE.Vector3(); pathAt(sExit + 2, tmpP, exitT); exitPoint.y = C;
  const entryPoint = pathAt(sEnter, new THREE.Vector3()); const enterT = new THREE.Vector3(); pathAt(sEnter - 2, tmpP, enterT); entryPoint.y = C;
  const nadir = pathAt(sNadir, new THREE.Vector3());

  await pause();
  // ---- progress -> snout position, with hang time at the bottom like a ballistic leap ----
  // the whale's clock: progress <-> metres of its path the snout has swum
  const makeClock = (Lw) => {
    const sA = sExit - 0.9 * Lw, sB = sEnter + 1.9 * Lw, M = 240, tab = new Float32Array(M + 1);
    for (let i = 1; i <= M; i++) {
      const s = lerp(sA, sB, (i - 0.5) / M), y = pathAt(s - 0.45 * Lw, tmpP).y;
      tab[i] = tab[i - 1] + 1 / Math.sqrt(1 - 0.6 * clamp((C - y) / drop, 0, 1));
    }
    const headS = (pw) => {
      const x = clamp(pw, 0, 1) * tab[M]; let i = 0;
      while (i < M - 1 && tab[i + 1] < x) i++;
      return lerp(sA, sB, (i + (x - tab[i]) / (tab[i + 1] - tab[i])) / M);
    };
    const progOf = (s) => {
      const f = clamp((s - sA) / (sB - sA), 0, 1) * M, i = Math.min(M - 1, Math.floor(f));
      return (WHALE_SPAN * lerp(tab[i], tab[i + 1], f - i)) / tab[M];
    };
    return { headS, timing: { exit: progOf(sExit), nadir: progOf(sNadir + 0.45 * Lw), enter: progOf(sEnter), gone: WHALE_SPAN } };
  };
  const clock = makeClock(L), headS = clock.headS, timing = clock.timing;

  await pause();
  // ---- shared uniforms ----
  // the slow roll: belly toward the watching side through the dive, and a little further over on the climb
  const shared = {
    uPath: { value: pathPts }, uPathStep: { value: pathStep }, uHead: { value: headS(0) },
    uRoll: { value: new THREE.Vector4(-vs * rng.range(0.38, 0.55), -vs * rng.range(0.25, 0.4), sNadir - 30, sEnter - 20) },
    uTime: { value: 0 }, uCeil: { value: C }, uLen: { value: L },
  };
  const sunDir = (opts.sunDir ? new THREE.Vector3().copy(opts.sunDir) : new THREE.Vector3(-0.38, 0.84, 0.38)).normalize();
  const white = new THREE.Color(1, 1, 1);
  const light = {
    uSunDir: { value: sunDir },
    uSunCol: { value: new THREE.Color(opts.sunColor || '#fff1d6').multiplyScalar(2.3) },
    uSkyCol: { value: new THREE.Color(opts.skyColor || pal[2]).lerp(white, 0.3).multiplyScalar(0.95) },
    uGroundCol: { value: new THREE.Color(opts.groundColor || pal[3]).multiplyScalar(0.5) },
  };
  const water = { uWaterA: { value: pal[2].clone().lerp(pal[1], 0.15) }, uWaterB: { value: new THREE.Color(1.0, 1.04, 1.07) } };
  const sites = {
    uSitePos: { value: [exitPoint.clone(), entryPoint.clone()] },
    uSiteAxis: { value: [exitT.clone().multiplyScalar(0.75).add(new THREE.Vector3(0, -0.3, 0)).normalize(),
      new THREE.Vector3(-enterT.x * 0.3, -1, -enterT.z * 0.3).normalize()] },
    uSiteClock: { value: [-10, -10] },
  };
  const mats = [];
  const mk = (o) => { const m = new THREE.ShaderMaterial({ fog: true, ...o }); mats.push(m); return m; };
  const add = (mesh, order = 0) => { mesh.frustumCulled = false; mesh.renderOrder = order; root.add(mesh); return mesh; };

  // ---- whale ----
  const hueJit = rng.range(-0.02, 0.03), grey = new THREE.Color(0.085, 0.09, 0.1);
  const skinA = pal[0].clone().lerp(grey, 0.26).offsetHSL(hueJit, 0, 0).multiplyScalar(0.95);
  const skinB = pal[1].clone().lerp(new THREE.Color(0.2, 0.22, 0.24), 0.36).offsetHSL(hueJit, 0, 0).multiplyScalar(0.52);
  const belly = new THREE.Color(0.13, 0.22, 0.33).lerp(pal[3], 0.05);
  if (opts.skin) {                                      // a world can ask for its own blues: { top, belly }
    if (opts.skin.top) { const t = new THREE.Color(opts.skin.top); skinA.copy(t).lerp(grey, 0.12).multiplyScalar(0.82); skinB.copy(t).lerp(pal[1], 0.4).lerp(grey, 0.1).multiplyScalar(0.8); }
    if (opts.skin.belly) belly.set(opts.skin.belly).multiplyScalar(0.62);
    if (opts.skin.back) { skinA.setRGB(...opts.skin.back[0]); skinB.setRGB(...opts.skin.back[1]); }   // the two back tones as linear rgb, used as given
    if (opts.skin.under) belly.setRGB(...opts.skin.under);
  }
  await pause();
  const whaleGeo = lite ? await buildWhaleGeometry(L, 76, 40, pause) : await buildWhaleGeometry(L, 100, 48, pause);
  await pause();
  const whale = add(new THREE.Mesh(whaleGeo, mk({
    uniforms: { ...fogU(), ...shared, ...light, uBeat: { value: rng.range(1.3, 1.7) / Math.sqrt(Ls) },
      uSkinA: { value: skinA }, uSkinB: { value: skinB }, uBelly: { value: belly },
      uSeaTint: { value: pal[1].clone().lerp(pal[2], 0.35).multiplyScalar(0.85) },
      uSeed: { value: rng.range(0, 100) }, uExitS: { value: sExit }, uEnterS: { value: sEnter } },
    vertexShader: WHALE_VERT, fragmentShader: WHALE_FRAG,
  })));
  whale.name = 'whale';
  await pause();

  // ---- ceiling patch ----
  const seaU = { uSiteA: { value: new THREE.Vector4(exitPoint.x, exitPoint.z, -10, 5.5 * Ls) }, uSiteB: { value: new THREE.Vector4(entryPoint.x, entryPoint.z, -10, 3.0 * Ls) } };
  if (ceilingMode) {
    const EX = 0.5 * (a + b) + 100, EZ = 100, cx = 0.5 * (b - a);
    const g = new THREE.PlaneGeometry(EX * 2, EZ * 2, 96, 48).rotateX(-Math.PI / 2).translate(cx, 0, 0);
    const sea = add(new THREE.Mesh(g, mk({
      uniforms: { ...fogU(), uTime: shared.uTime, uCeil: shared.uCeil, ...seaU, uSunDir: light.uSunDir, uSunCol: light.uSunCol,
        uDeepCol: { value: pal[1].clone().lerp(pal[0], 0.25).multiplyScalar(0.8) }, uAquaCol: { value: pal[2].clone().multiplyScalar(0.95) },
        uReflCol: { value: pal[3].clone().lerp(white, 0.45).multiplyScalar(0.7) },
        uExtent: { value: new THREE.Vector2(EX, EZ) }, uMid: { value: cx }, uBase: { value: ceilingMode === 'decal' ? 0 : 1 } },
      vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    })), 1);
    sea.name = 'sea-ceiling';
  }
  await pause();

  // ---- attach points on the whale for shed water ----
  const sv = new THREE.Vector3();
  function attachPoint(out) {
    const k = rng();
    if (k < 0.6) {                                             // back and flanks (the belly stays clean for the pass)
      skin(rng.range(0.04, 0.93), (rng.range(-1.95, 1.95) + Math.PI * 2) % (Math.PI * 2), L, sv);
      out[0] = sv.x * 1.03; out[1] = sv.y * 1.03; out[2] = -sv.z;
    } else if (k < 0.82) {                                     // trailing edge of the flukes
      const u = rng(), sg = rng.sign();
      out[0] = sg * u * 0.128 * L; out[1] = 0.006 * L * u * u; out[2] = L * (1.0 + 0.012 * u + 0.07 * u * u);
    } else {                                                   // flippers
      const u = rng.range(0.25, 1), sg = rng.sign(); skin(0.245, 2.05, L, sv);
      out[0] = sg * (sv.x + 0.74 * 0.15 * L * u); out[1] = sv.y - 0.36 * 0.15 * L * u; out[2] = -sv.z + 0.57 * 0.15 * L * u + 0.04 * L * u * u;
    }
    return out;
  }

  // ---- ribbons ----
  {
    const NR = Math.round(190 * (lite ? 0.3 : 1)), SEG = 22, at = [0, 0, 0];
    const pos = [], par = [], uv = [], idx = [];
    for (let r = 0; r < NR; r++) {
      if (r % 10 === 9) await pause();
      attachPoint(at);
      const wide = rng.chance(0.12);
      const wake = rng.chance(0.1);                               // a few long wisps that follow the path back toward the hole
      const A = (wake ? rng.range(30, 55) : rng.range(9, 20) + (rng.chance(0.25) ? rng.range(3, 8) : 0)) * Ls;
      const rise = (wake ? rng.range(0.02, 0.035) : rng.range(0.1, 0.2)) / Ls, spread = rng.range(0.15, 1);
      const width = (wake ? rng.range(0.12, 0.3) : wide ? rng.range(0.7, 1.3) : rng.range(0.14, 0.5)) * Ls, seed = rng();
      const base = pos.length / 3;
      for (let j = 0; j <= SEG; j++) for (const sd of [-1, 1]) { pos.push(at[0], at[1], at[2]); par.push(A, rise, spread, width); uv.push(j / SEG, sd, seed); }
      for (let j = 0; j < SEG; j++) { const q = base + j * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    await pause();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    await pause();
    g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 4));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3));
    g.setIndex(idx);
    await pause();
    add(new THREE.Mesh(g, mk({ uniforms: { ...fogU(), ...shared, ...water }, vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide })), 3).name = 'water-ribbons';
  }
  await pause();

  const quad = () => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  };
  const inst = (g, name, arr, n) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n));

  // ---- droplets riding the trails ----
  {
    const ND = Math.round(3600 * kq), at = [0, 0, 0], att = [], par = [], seed = [];
    for (let i = 0; i < ND; i++) {
      if (i % 120 === 119) await pause();
      attachPoint(at); att.push(at[0], at[1], at[2]);
      par.push(rng.range(10, 26) * Ls, rng.range(0.09, 0.2) / Ls, rng.range(0.2, 1.6), rng.range(0.1, 0.24) * (rng.chance(0.1) ? 2.2 : 1) * Math.sqrt(Ls));
      seed.push(rng(), rng(), rng() * 6.283, rng.range(0.7, 1.4));
    }
    await pause();
    const g = quad(); g.instanceCount = ND;
    inst(g, 'aAtt', att, 3); inst(g, 'aPar', par, 4); inst(g, 'aSeed', seed, 4);
    await pause();
    add(new THREE.Mesh(g, mk({ uniforms: { ...fogU(), ...shared, ...water, uFlow: { value: 6.5 } }, vertexShader: TRAILDROP_VERT, fragmentShader: DROP_FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide })), 4).name = 'trail-drops';
  }
  await pause();

  // ---- splash drops at both holes ----
  {
    const NS = Math.round(5600 * kq), launch = [], misc = [];
    for (let i = 0; i < NS; i++) {
      if (i % 200 === 199) await pause();
      const entry = i < NS * 0.68;
      if (entry) launch.push(rng() * 6.283, rng.range(1, 6) * Ls, rng.range(9, 20) * (0.55 + 0.45 * rng()) * Ls, Math.pow(rng(), 1.4) * 2.2);   // the crown is a tall coronet: little speed outward, most of it up the axis
      else launch.push(rng() * 6.283, rng.range(0.5, 5.5) * Ls, rng.range(7, 24) * (0.5 + 0.5 * rng()) * Ls, rng() * 2.5);
      misc.push(entry ? 1 : 0, rng.range(0.2, 0.5) * (rng.chance(0.12) ? 1.8 : 1) * Math.sqrt(Ls), rng(), rng.range(0.5, 1.5));
    }
    await pause();
    const g = quad(); g.instanceCount = NS;
    inst(g, 'aLaunch', launch, 4); inst(g, 'aMisc', misc, 4);
    await pause();
    add(new THREE.Mesh(g, mk({ uniforms: { ...fogU(), ...water, ...sites, uTime: shared.uTime, uCeil: shared.uCeil, uG: { value: 7 }, uR0: { value: 3.0 * Ls } },
      vertexShader: SPLASHDROP_VERT, fragmentShader: DROP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide })), 4).name = 'splash-drops';
  }
  await pause();

  // ---- sheath and crown: one curtain mesh, two uses ----
  const crownGeo = new THREE.BufferGeometry();
  {
    const NA = lite ? 96 : 288, NV = lite ? 12 : 14, uv = [], idx = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) uv.push(i / NA, Math.pow(j / NV, 1.15));
    for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const q = j * (NA + 1) + i, r = q + NA + 1; idx.push(q, q + 1, r, q + 1, r + 1, r); }
    await pause();
    crownGeo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2));
    crownGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((NA + 1) * (NV + 1) * 3), 3));
    crownGeo.setIndex(idx);
  }
  const crownMat = (k, spikes) => mk({
    uniforms: { ...fogU(), ...water, uSunDir: light.uSunDir, uSunCol: light.uSunCol, uTime: shared.uTime, uCeil: shared.uCeil,
      uC: { value: sites.uSitePos.value[k] }, uAxis: { value: sites.uSiteAxis.value[k] }, uShape: { value: new THREE.Vector4(0, 3, 0, 0) },
      uSpikes: { value: spikes }, uSeed: { value: rng.range(0, 10) } },
    vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  await pause();
  const sheath = add(new THREE.Mesh(crownGeo, crownMat(0, rng.int(9, 12))), 2); sheath.name = 'exit-sheath';
  await pause();
  // (the crown has a geometry object of its own over the same buffers, so each curtain can be left undrawn while it is flat)
  const crownGeo2 = new THREE.BufferGeometry(); crownGeo2.setAttribute('aUV', crownGeo.attributes.aUV); crownGeo2.setAttribute('position', crownGeo.attributes.position); crownGeo2.setIndex(crownGeo.index);
  const crown = add(new THREE.Mesh(crownGeo2, crownMat(1, rng.int(17, 23))), 2); crown.name = 'crown-splash';
  const crownH = (opts.crownHeight ?? rng.range(19, 24)) * Ls;

  // ---- mist: most of it hangs under the re-entry hole ----
  {
    const NM = lite ? 50 : 230, m = [], m2 = [];
    for (let i = 0; i < NM; i++) { m.push(i % 3 === 0 ? 0 : 1, rng() * 6.283, Math.sqrt(rng()), rng()); m2.push(rng.range(5, 11) * Ls, rng(), rng() * 2.2); }
    const g = quad(); g.instanceCount = lite ? NM : 72;          // all the draws are kept; a thinner veil is shown
    inst(g, 'aM', m, 4); inst(g, 'aM2', m2, 3);
    add(new THREE.Mesh(g, mk({ uniforms: { ...fogU(), ...sites, uWaterB: water.uWaterB, uTime: shared.uTime }, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG,
      transparent: true, depthWrite: false })), 5).name = 'mist';
  }
  await pause();

  // ---- staging: the camera line this piece is composed for (see the header) ----
  // The lens comes in obliquely while the whale dives (the dive is seen broadside, far enough off to sit near the horizon),
  // swings in behind its shoulder at the nadir and then flies the climb with it. The table is in metres for a 44 m whale and
  // scales with the whale (L / 44): [share of the climb, behind the whale's middle, to the side, below]. Near enough for the
  // whale to fill the upper half of the frame, low enough under it that the land stays in the bottom of the picture, dropping
  // back as the whale pulls away into the ceiling. It never crosses under the whale.
  const midAt = (k) => pathAt(headS((k < 0 ? lerp(timing.nadir, timing.exit, -k) : lerp(timing.nadir, timing.enter, k)) / WHALE_SPAN) - 0.45 * L, new THREE.Vector3());
  const yTop = C - 7.5, flyThrough = [], pt = (x, y, z) => { const v = new THREE.Vector3(x, y, z); flyThrough.push(v); return v; };
  const chase = CHASE.map(([k, back, side, below]) => {
    const m = midAt(k), Lq = L / 44; return new THREE.Vector3(m.x - back * Lq, m.y - below * Lq, m.z + side * vs * Lq);
  });
  const camN = chase[0];
  for (const [dx, dz, f] of [[-99, 109, 0], [-81, 76, 0.23], [-60, 45, 0.48], [-33, 19, 0.74]]) pt(camN.x + dx, lerp(14, camN.y, f), camN.z + dz * vs);
  for (const c of chase) flyThrough.push(c);
  const endArc = chase[chase.length - 1];
  // after the crown the line swings out to the camera's side and curves back, climbing steadily all the way (never steeper than
  // 10 degrees) to a level run under the ceiling, so the run sees its end from three angles; the last 90 m are level and straight
  for (const [dx, dz, f] of AFTER) pt(endArc.x + dx, lerp(endArc.y, yTop, f), endArc.z + dz * vs);
  const d0 = flyThrough[1].clone().sub(flyThrough[0]).setY(0).normalize();
  const center = new THREE.Vector3(nadir.x + b * 0.2, nadir.y + 10, nadir.z);     // framing: the whale low in its arc, ceiling above
  const anchors = {
    ceilingY: C, exitPoint, entryPoint, nadir, flyThrough, timing, viewSide: vs,
    cues: { exit: flyThrough[0].clone(), nadir: camN.clone(), enter: endArc.clone() },
    bounds: { radius: Math.max(a, b) + 16, top: C + 2, bottom: nadir.y - 0.08 * L, ceilingPatch: [0.5 * (a + b) + 100, 100] },
    flyDirection: d0.clone(), exitDirection: new THREE.Vector3(1, 0, 0),
    portalSeat: { position: flyThrough[flyThrough.length - 1].clone(), facing: new THREE.Vector3(-1, 0, 0) },
    viewpoints: [
      { position: new THREE.Vector3(b * 0.25, nadir.y - 22, 105 * vs), lookAt: new THREE.Vector3(b * 0.25, C - drop * 0.6, 0) },   // whole arc in profile, from the side
      { position: camN.clone(), lookAt: nadir.clone() },                                                                           // the chase begins
      { position: endArc.clone(), lookAt: entryPoint.clone().add(new THREE.Vector3(0, -8, 0)) },                                   // the crown
    ],
  };

  await pause();
  // ---- the rare one: a calf that follows its mother down and back (opts.calf) ----
  let calf = null;
  if (opts.calf) {
    calf = await buildHero({ ...ctx, rng: rng.fork('calf') }, { ...opts, calf: false, lite: true, ceiling: false, viewSide: vs,
      length: L * 0.44, drop: drop * 0.6, spanIn: a * 0.62, spanOut: b * 0.56, crownHeight: 15 });
    calf.object.position.set(a * 0.1, 0, -15 * vs); calf.object.name = 'calf-breach';
    root.add(calf.object);
  }

  // ---- animation ----
  await pause();
  const state = { head: new THREE.Vector3(), mid: new THREE.Vector3(), tail: new THREE.Vector3(), airborne: 0, progress: 0 };
  let manual = null;
  const shA = sheath.material.uniforms.uShape.value, shB = crown.material.uniforms.uShape.value;
  function apply(p, time) {
    const sH = headS(p / WHALE_SPAN);
    shared.uHead.value = sH; shared.uTime.value = time;
    const cA = (p - timing.exit) * T, cB = (p - timing.enter) * T;
    sites.uSiteClock.value[0] = cA; sites.uSiteClock.value[1] = cB;
    seaU.uSiteA.value.z = cA; seaU.uSiteB.value.z = cB;
    // sheath dragged out of the exit hole: stretches down along the body, thins, snaps back up
    const e = clamp(cA / 3.8, 0, 1);
    shA.set(20 * Ls * Math.sin(Math.PI * Math.pow(e, 0.6)), (2.5 + 0.6 * e) * Ls, (1.6 + 3.2 * e) * Ls, smoothstep(0, 0.04, e) * (1 - smoothstep(0.72, 1, e)));
    // crown at re-entry: thrown out and down, then it falls back up
    const c = clamp(cB / 4.6, 0, 1);
    shB.set(crownH * Math.sin(Math.PI * Math.pow(c, 0.52)), (3.2 + 2.0 * c) * Ls, 15 * Ls * (1 - Math.exp(-3 * c)), smoothstep(0, 0.03, c) * (1 - smoothstep(0.7, 1, c)));
    pathAt(sH, state.head); pathAt(sH - 0.45 * L, state.mid); pathAt(sH - L, state.tail);
    state.airborne = clamp((C - state.mid.y) / 8, 0, 1); state.progress = p;
    if (calf) calf.applyAt(clamp(p * 1.04 - 0.07, 0, 1), time);
  }
  // pure readings (nothing is set): where the whale is at progress p, and the crown's own clock there (under 0 before the snout
  // goes in, 0..1 while the crown stands: full height near 0.26, fallen and gone by 1; it runs on past 1)
  const poseAt = (p, head, mid, tail) => { const sH = headS(clamp(p, 0, 1) / WHALE_SPAN); if (head) pathAt(sH, head); if (mid) pathAt(sH - 0.45 * L, mid); if (tail) pathAt(sH - L, tail); return mid || head || tail; };
  const crownAt = (p) => ((p - timing.enter) * T) / 4.6;
  const rest = (p) => p < timing.exit - 0.03 || p > 0.9995;
  apply(0.44, 0);
  // idle: while the whale is wholly back in the sea nothing of this piece is on screen, so nothing is drawn (the
  // meshes stay in the scene with their shaders compiled; only their draw counts go to zero)
  const lod = [];
  for (const m of root.children) if (m.isMesh) { const g = m.geometry; if (!lod.some((e) => e.g === g)) lod.push({ g, n: g.isInstancedBufferGeometry ? g.instanceCount : -1 }); }
  let idle = false;
  function setIdle(v) {
    if (v === idle) return; idle = v;
    for (const e of lod) { if (e.n >= 0) e.g.instanceCount = v ? 0 : e.n; else e.g.setDrawRange(0, v ? 0 : Infinity); }
  }
  // While the whale is out, the pieces that are flat or still inside the sea at this moment are not drawn either: the sheath only
  // while it is dragged out of the exit hole, the crown only while it stands, the splash drops only for the ten seconds they fly
  // (the first 68 in 100 belong to the re-entry), and the water streaming off the skin only once there is skin outside.
  const piece = (name) => root.children.find((m) => m.name === name), gSplash = piece('splash-drops').geometry, nSplash = gSplash.instanceCount;
  const gTrail = piece('trail-drops').geometry, nTrail = gTrail.instanceCount, gRibbon = piece('water-ribbons').geometry;
  function gate() {
    if (idle) return;
    const cA = sites.uSiteClock.value[0], cB = sites.uSiteClock.value[1], out = cA > -0.2;
    crownGeo.setDrawRange(0, cA > 0 && cA < 3.8 ? Infinity : 0); crownGeo2.setDrawRange(0, cB > 0 && cB < 4.6 ? Infinity : 0);
    gSplash.instanceCount = cA > -0.1 && cA < 11 ? nSplash : cB > -0.1 && cB < 11 ? Math.ceil(nSplash * 0.68) : 0;
    gTrail.instanceCount = out ? nTrail : 0; gRibbon.setDrawRange(0, out ? Infinity : 0);
  }

  return {
    object: root, radius: 0.5 * (a + b) + 10, height: 40, center, anchors, state, timing, calf,
    // for a world that draws its own ceiling: the swell + ring uniforms of GLSL_SEA (exported as SEA_GLSL), so the
    // world's surface and this piece's decal share one height field. Coordinates are this object's local XZ.
    sea: { uTime: shared.uTime, uSiteA: seaU.uSiteA, uSiteB: seaU.uSiteB },
    ground: true, groundY: 0,
    applyAt: apply, poseAt, crownAt,
    setProgress(u) { manual = (u === null || u === undefined) ? null : clamp(u, 0, 1); },
    setLight(o = {}) {
      if (o.sunDir) light.uSunDir.value.copy(o.sunDir).normalize();
      if (o.sunColor) light.uSunCol.value.set(o.sunColor).multiplyScalar(o.sunIntensity ?? 2.3);
      if (o.skyColor) light.uSkyCol.value.set(o.skyColor);
      if (o.groundColor) light.uGroundCol.value.set(o.groundColor);
      if (calf) calf.setLight(o);
    },
    update(dt, time) { const p = manual !== null ? manual : fract(time / T - 0.06); apply(p, time); setIdle(rest(p)); gate(); if (calf) calf.rest(clamp(p * 1.04 - 0.07, 0, 1)); },
    rest(p) { setIdle(rest(p)); gate(); },
    dispose() { whaleGeo.dispose(); crownGeo.dispose(); crownGeo2.dispose(); for (const m of mats) m.dispose(); if (calf) calf.dispose(); },
  };
}

// GLSL of the ceiling height field: `float seaH(vec2 localXZ)`, needs uniforms uTime, uSiteA, uSiteB (hero.sea).
export { GLSL_SEA as SEA_GLSL };
