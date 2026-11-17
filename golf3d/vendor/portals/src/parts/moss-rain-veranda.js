// THE LONG RAIN: hero set piece. THE MIRROR HALL: a dark temple hall with one whole side missing and a black
// lacquer floor that doubles the wet garden, leaf for leaf, with the row of veranda posts between the two.
//
// WHAT IT IS (local frame: origin at the centre of the floor, +Y up, floor surface at y = 0, garden ground y = -5)
//   +Z is the OPEN GARDEN SIDE ("front"). The camera of the brief enters by the doorway in the back wall (z = -56)
//   and leaves over the veranda toward +Z, so in a world that runs down -Z set hero.object.rotation.y = Math.PI.
//   Hall 112 x 96 m (x -56..56, z -56..40), coffered ceiling at 26 m; veranda z 40..56 with eight round posts 2 m
//   thick every 16 m (x = +-8, +-24, +-40, +-56, so the path runs between the two centre posts); rafters and tiled
//   eave to z = 68 (edge 20 m up) and a big hipped tile roof (ridge 58 m). Side walls of ink-washed paper screens,
//   back wall with a 16 x 18 m doorway. On the building: bead curtain of eave drips, two rain chains into stone
//   basins, pebble gutter, shoe stone with sandals, open black-and-white umbrella, half-rolled bamboo blind, two
//   bronze wind bells; on the floor a cushion, a tea bowl and a thread of incense; two swallows that skim the lacquer.
//   A light GARDEN PROXY (maples at the gutter, moss bank, hydrangeas, pond sheet, earthen wall, cedars, sky shell,
//   fine rain) is built by default so the mirror has something to show; switch it off and register the real garden.
//
// THE MIRROR (no render target, no stencil; works with any camera, including the portal preview camera)
//   1. opaque pass, renderOrder 50: the floor rectangle paints the reflected rain sky (no depth write);
//   2. renderOrder 60: y-flipped twins of everything worth reflecting draw behind the floor plane. Their materials
//      are patched to discard above the floor plane and wherever the eye ray does not cross the floor rectangle;
//   3. transparent pass, renderOrder -200: transparent twins (rain, drips, incense: rain rises in the floor);
//   4. renderOrder -100: the lacquer film (tint, alpha 0.85 looking down .. 0.15 grazing, board seams, stuck
//      leaves, ring film at the wet outer edge) blends over the twins and writes depth, sealing the floor.
//   hero.mirror.add(meshOrGroup, { live })  registers world geometry: it patches the material IN PLACE (the patch
//      chains onBeforeCompile and is a no-op for un-mirrored objects, so the same material keeps serving the real
//      mesh) and adds a twin sharing geometry and material. Works with MeshStandard/Lambert/Basic, ShaderMaterial,
//      InstancedMesh and Points, provided the vertex shader's main() is its last function and the projection is a
//      perspective one. `live: true` re-syncs the twin's matrix every frame (moving things). Call before first render.
//   hero.mirror.patch(material), .remove(twin), .setEnabled(bool), .root (Group), .uniforms.
//   IMPORTANT: real geometry that lies BELOW the floor plane and can be seen through the floor from inside (garden
//      ground, moss, pond, gutter: anything out to ~150 m beyond the veranda) must have hero.mirror.patch(material)
//      applied too: the same patch makes un-mirrored fragments below the plane discard where the eye ray crosses the
//      floor rectangle, so the real garden never shows (or blocks the twins) through the lacquer. All of the hero's
//      own materials are already patched. Fallback if a material cannot be patched: keep it out from under the rays.
//   Keep every real opaque object at renderOrder < 50 and real transparent ones at renderOrder > -100.
//
// LIGHT IN THE RAIN (all of it uniforms of the one solid shader, so it costs no lights and no extra programs)
//   uSunA/uSunP/uSun: a break in the cloud lets silver light down in slowly drifting pools (sunPool() in GLSL; six may
//   be staged by the world through uniforms.uSunP = (x, z, radius, strength)). Everything out of doors is lit by them,
//   leaves glow, rain brightens, water glints. Each staged pool has its own shaft, a soft-edged ribbon that turns about
//   the light's slant to face the eye (`beams`, opts.beams = which pools; uniforms.uBeam its strength), and faint upright
//   slices (`shafts`, uShaft) show the drifting ones; both are twinned in the floor. uLamps[5]/uLampCol: small warm flames that light what is near them ([0] is the hall's paper lamp;
//   the world owns 1..4). K.FLAME is the surface kind of a lit paper window. uSeam/uStrata/uSkyK shape the sky: a dark layered deck, a silver seam under its edge low over the wall.
//
// OPTS
//   backOpen  true: the three centre bays of the back wall stand open (the world hangs its own sliding screens there).
//   courtShafts true: four more shaft slices behind the hall (z -64 .. -106) for the world's courts.
//   uSwallow / uMirrorOff   the journey's u at which the swallows start their pass (default 0.29) and the twins hide (0.47).
//   palette   7 hex [timber, lacquer, deep green, moss, new leaf, pearl sky, accent blue] (brief palette by default)
//   season    'june' | 'november' | 'february'   (default: by seed, june most often). November: crimson leaves, red
//             accent; February: bare maples, snow caps, slow flakes instead of drips.
//   hour      'day' | 'dawn' | 'golden' | 'night' (default ctx.vary.hour, else day): only the sky colour and level.
//   side      +1 | -1 (default by seed): which way the hall is handed. Moving toward +Z, side +1 puts the cushion and
//             the moss bank on the camera's LEFT (local +X) and the umbrella, near rain chain and pond on its RIGHT.
//   rain      0.4..1.5 weight of drips and rain (default by seed)
//   garden    true: build the garden proxy.   sky: true: build the pearl sky shell (set false with a world sky).
//   rainField true: the hero's own fine rain outside the eave (twinned).   doorScreens true: closed paper screens
//             in the back doorway (set false when the world's corridor and sliding screens stand there).
//   mist      proxy mist density (default 0.0032 with the sky shell, else 0: let scene fog do it).
//
// LIVE CONTROLS
//   setProgress(u)   the journey's u: swallows cross mid-hall over 0.08 of u from opts.uSwallow (about 22 m ahead of a
//                    camera a third of the way across, so the four birds sit on the bright part of the floor); twins
//                    are hidden after opts.uMirrorOff. Until it is called the piece idles (swallows cross every ~9 s).
//   setSwallows(k)   0..1 directly (k < 0 or > 1 hides them).   opts.swallowScale (default 2.2: wings 5.7 m).
//   setSky(zenith, horizon, level)   colours (hex or Color) and brightness of the sky that lights every material of
//                    the piece and shows in the floor.   setMist(density, color).
//
// ANCHORS (local space)
//   entry        { position (0,7,-56), facing +Z }: centre of the doorway in the back wall.
//   flyThrough   camera line: doorway -> across the lacquer at 6.5 m -> between the centre posts -> through the eave
//                drips -> down beside the near rain chain into the garden (clearance > 6 m everywhere).
//   mirrorFrame  { position, lookAt }: THE frame, two thirds across (five posts, garden above and below).
//   postsFront   the eight post centres.   opening { min, max }: the garden opening.   eaveEdge { z, y }.
//   swallowCross where the birds skim.   cushion, teaBowl, incense, umbrella, sandals, blind, windBells[2].
//   rainChains   [{ top, basin }] (index 0 is the near one, 9.5 m off the centre line).   dripLine [a, b].
//   gardenExit   point 46 m out in the garden where the path can turn.   portalHint: no portal belongs to the hall;
//                the brief's portal is the teahouse window, far out in the garden (direction only).
//   maples       trunk positions of the proxy maples (empty with garden: false).
//
// SIZE   footprint 136 x 136 m with the eaves (radius 80 reported), ridge 58 m above the floor, floor 5 m above the
//        garden. The proxy garden reaches z = 500.
// COST   ~120k triangles with proxy and twins in June (~95k in February, ~75k with garden: false), 17 draw calls
//        (11 meshes + 6 twins), no lights, no render targets, no textures, build ~200 ms.
// LIGHT  Wants none: every material is a self-lit ShaderMaterial (linear HDR, scene fog honoured). The light is the
//        rain sky: it enters by the opening and falls off into the room, so timber is black against the garden with
//        a pearl sheen on wet and polished edges. Give the world a pale green-grey fog and expose for the garden.
// WORLD  opts.path: the camera path in LOCAL space (ground is kept under it, nothing is planted in its way).
//        opts.extend(kit): called before the meshes are built so the world can add its own corridor, garden and
//        props into the hero's four batches (same shader, same mirror, no extra draw calls). api.hillAt, api.pondM.
//        uniforms.uCorr = (court wall x, court glow, glow of the screens ahead, z of the opening wave) lights z < -56.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const PAL = ['#0D0F0D', '#0A1611', '#1E4A2C', '#4F8F2B', '#93C83F', '#C7D1CD', '#5A7FCC'];
const HW = 56, ZB = -56, ZH = 40, ZV = 56, ZE = 68, CEIL = 26, EAVE = 20, GY = -5, OVR = 68;
const PI = Math.PI;
const POSTS_X = [-56, -40, -24, -8, 8, 24, 40, 56];
const DRIP_N = 56, DRIP_DX = 2.4, DRIP_X0 = -66;
const SGX0 = -214, SGZ0 = 68, SGN = 428, SGM = 364;       // the grid of shade the moss mounds lay on the ground, 1 m cells

// ---------------------------------------------------------------- small geometry kit
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
function M(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}
const C = (hex) => new THREE.Color(hex);
const mixC = (a, b, t) => a.clone().lerp(b, t);

// box with every edge chamfered (44 flat triangles): edges catch the pearl sheen
function chamferBox(w, h, d, ch) {
  const hx = w / 2, hy = h / 2, hz = d / 2; ch = Math.min(ch, hx * 0.45, hy * 0.45, hz * 0.45);
  const V = (sx, sy, sz, f) => f === 0 ? [sx * hx, sy * (hy - ch), sz * (hz - ch)] : f === 1 ? [sx * (hx - ch), sy * hy, sz * (hz - ch)] : [sx * (hx - ch), sy * (hy - ch), sz * hz];
  const tris = [], S = [-1, 1];
  const quad = (a, b, c, e) => { tris.push(a, b, c, a, c, e); };
  for (const s of S) {
    quad(V(s, -1, -1, 0), V(s, 1, -1, 0), V(s, 1, 1, 0), V(s, -1, 1, 0));
    quad(V(-1, s, -1, 1), V(1, s, -1, 1), V(1, s, 1, 1), V(-1, s, 1, 1));
    quad(V(-1, -1, s, 2), V(1, -1, s, 2), V(1, 1, s, 2), V(-1, 1, s, 2));
    for (const t of S) {
      quad(V(-1, s, t, 1), V(1, s, t, 1), V(1, s, t, 2), V(-1, s, t, 2));   // edges along x
      quad(V(s, -1, t, 0), V(s, 1, t, 0), V(s, 1, t, 2), V(s, -1, t, 2));   // edges along y
      quad(V(s, t, -1, 0), V(s, t, 1, 0), V(s, t, 1, 1), V(s, t, -1, 1));   // edges along z
      for (const u of S) tris.push(V(s, t, u, 0), V(s, t, u, 1), V(s, t, u, 2));
    }
  }
  const n = tris.length, P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromArray(tris[i]); b.fromArray(tris[i + 1]); c.fromArray(tris[i + 2]);
    nn.copy(b).sub(a).cross(_p.copy(c).sub(a)).normalize();
    let flip = nn.dot(_p.copy(a).add(b).add(c)) < 0;
    if (flip) { nn.negate(); const t = tris[i + 1]; tris[i + 1] = tris[i + 2]; tris[i + 2] = t; }
    for (let k = 0; k < 3; k++) { P.set(tris[i + k], (i + k) * 3); N[(i + k) * 3] = nn.x; N[(i + k) * 3 + 1] = nn.y; N[(i + k) * 3 + 2] = nn.z; }
  }
  return bare(P, N);
}
// makeBatch().add() reads only the position and normal arrays, so the plain shapes that are made by the hundred skip
// BufferGeometry altogether: a box and an open tapered tube are written straight from a template (cut on first use, inside build)
const bare = (P, N) => ({ attributes: { position: { array: P }, normal: { array: N } }, index: null, dispose() {} });
// a triangle soup (9 numbers a triangle) with flat face normals, as the batch reads it: no THREE geometry is built for it
function soup(pos) {
  const P = new Float32Array(pos), N = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 9) {
    const ax = P[i] - P[i + 3], ay = P[i + 1] - P[i + 4], az = P[i + 2] - P[i + 5], cx = P[i + 6] - P[i + 3], cy = P[i + 7] - P[i + 4], cz = P[i + 8] - P[i + 5];
    let nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
    N[i] = N[i + 3] = N[i + 6] = nx; N[i + 1] = N[i + 4] = N[i + 7] = ny; N[i + 2] = N[i + 5] = N[i + 8] = nz;
  }
  return bare(P, N);
}
let BOXT = null;
function box(w, h, d) {
  if (!BOXT) { const g0 = new THREE.BoxGeometry(1, 1, 1), g = g0.toNonIndexed(); BOXT = [new Float32Array(g.attributes.position.array), new Float32Array(g.attributes.normal.array)]; g0.dispose(); g.dispose(); }
  const src = BOXT[0], P = new Float32Array(108);
  for (let i = 0; i < 108; i += 3) { P[i] = src[i] * w; P[i + 1] = src[i + 1] * h; P[i + 2] = src[i + 2] * d; }
  return bare(P, BOXT[1]);
}
const RING = {};
function tube(rTop, rBot, h, sides) {
  let t = RING[sides];
  if (!t) { t = RING[sides] = new Float32Array((sides + 1) * 2); for (let i = 0; i <= sides; i++) { t[i * 2] = Math.sin(i / sides * 6.283185307); t[i * 2 + 1] = Math.cos(i / sides * 6.283185307); } }
  const P = new Float32Array(sides * 18), N = new Float32Array(sides * 18), sl = (rBot - rTop) / Math.max(h, 1e-6), nl = 1 / Math.hypot(1, sl), hy = h / 2;
  for (let i = 0, o = 0; i < sides; i++) {
    const x0 = t[i * 2], z0 = t[i * 2 + 1], x1 = t[i * 2 + 2], z1 = t[i * 2 + 3];
    for (let k = 0; k < 6; k++, o += 3) {                       // top i, bottom i, top i+1, bottom i, bottom i+1, top i+1
      const nxt = k === 2 || k > 3, top = k === 0 || k === 2 || k === 5, x = nxt ? x1 : x0, z = nxt ? z1 : z0, r = top ? rTop : rBot;
      P[o] = x * r; P[o + 1] = top ? hy : -hy; P[o + 2] = z * r; N[o] = x * nl; N[o + 1] = sl * nl; N[o + 2] = z * nl;
    }
  }
  return bare(P, N);
}
const lathe = (pts, sides) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(p[0], 0.0001), p[1])), sides);
// tapered limb from a to b (open cylinder)
function limbM(a, b) {
  const d = _s.copy(b).sub(a), len = d.length();
  _q.setFromUnitVectors(_p.set(0, 1, 0), d.normalize());
  return { m: new THREE.Matrix4().compose(new THREE.Vector3().copy(a).add(b).multiplyScalar(0.5), _q, new THREE.Vector3(1, 1, 1)), len };
}

// merges parts into one geometry with position, normal, color (linear) and surf = [kind, gloss, exposure, sway]
function makeBatch(hint = 0) {                       // hint: about how many vertices it will hold; one block then takes them all and build() copies nothing
  // parts are written straight into large blocks (no arrays per part, little for the collector); build() joins the blocks once
  const blocks = []; let total = 0, cap = 0, count = 0, P, N, Cc, S, size = Math.max(1024, hint | 0);
  const nm = new THREE.Matrix3(), v = new THREE.Vector3();
  const open = (n) => {
    if (cap) blocks.push([P, N, Cc, S, count]);
    cap = Math.max(size, n); size = Math.min(size * 4, 65536); count = 0;
    P = new Float32Array(cap * 3); N = new Float32Array(cap * 3); Cc = new Float32Array(cap * 3); S = new Float32Array(cap * 4);
  };
  return {
    get triangles() { return (total + count) / 3; },
    add(geo, m, col, surf, o) {
      const src = geo.attributes.position.array, sn = geo.attributes.normal.array, ix = geo.index ? geo.index.array : null, n = ix ? ix.length : src.length / 3;
      if (count + n > cap) { total += count; open(n); }
      const e = m ? m.elements : null, q = m ? nm.getNormalMatrix(m).elements : null;
      const jit = o && o.jit != null ? o.jit : 1, grad = o && o.grad, fn = o && o.fn;
      const g0 = grad ? grad[0] : 0, gk = grad ? 1 / (grad[1] - grad[0]) : 0, ga = grad ? grad[2] : 1, gb = grad ? grad[3] - grad[2] : 0;
      const cr = col.r, cg = col.g, cb = col.b, s0 = surf[0], s1 = surf[1], s2 = surf[2], s3 = surf[3] || 0;
      const fC = fn ? Cc.subarray(count * 3) : null, fS = fn ? S.subarray(count * 4) : null;
      for (let i = 0; i < n; i++) {
        const s = (ix ? ix[i] : i) * 3, j = (count + i) * 3, w = (count + i) * 4;
        let x = src[s], y = src[s + 1], z = src[s + 2], nx = sn[s], ny = sn[s + 1], nz = sn[s + 2];
        if (e) {
          const ax = e[0] * x + e[4] * y + e[8] * z + e[12], ay = e[1] * x + e[5] * y + e[9] * z + e[13]; z = e[2] * x + e[6] * y + e[10] * z + e[14]; x = ax; y = ay;
          const bx = q[0] * nx + q[3] * ny + q[6] * nz, by = q[1] * nx + q[4] * ny + q[7] * nz; nz = q[2] * nx + q[5] * ny + q[8] * nz; nx = bx; ny = by;
          const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
        }
        P[j] = x; P[j + 1] = y; P[j + 2] = z; N[j] = nx; N[j + 1] = ny; N[j + 2] = nz;
        let k = jit; if (grad) { const t = (y - g0) * gk; k *= ga + gb * (t < 0 ? 0 : t > 1 ? 1 : t); }
        Cc[j] = cr * k; Cc[j + 1] = cg * k; Cc[j + 2] = cb * k;
        S[w] = s0; S[w + 1] = s1; S[w + 2] = s2; S[w + 3] = s3;
        if (fn) { v.set(nx, ny, nz); fn(i, x, y, z, v, fC, fS); }
      }
      count += n;
      geo.dispose();
    },
    build() {
      if (cap) blocks.push([P, N, Cc, S, count]);
      const one = blocks.length === 1, nv = total + count;
      const oP = one ? P.subarray(0, nv * 3) : new Float32Array(nv * 3), oN = one ? N.subarray(0, nv * 3) : new Float32Array(nv * 3), oC = one ? Cc.subarray(0, nv * 3) : new Float32Array(nv * 3), oS = one ? S.subarray(0, nv * 4) : new Float32Array(nv * 4);
      let at = 0;
      if (!one) for (const q of blocks) { const c = q[4]; oP.set(q[0].subarray(0, c * 3), at * 3); oN.set(q[1].subarray(0, c * 3), at * 3); oC.set(q[2].subarray(0, c * 3), at * 3); oS.set(q[3].subarray(0, c * 4), at * 4); at += c; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(oP, 3)); g.setAttribute('normal', new THREE.BufferAttribute(oN, 3));
      g.setAttribute('color', new THREE.BufferAttribute(oC, 3)); g.setAttribute('surf', new THREE.BufferAttribute(oS, 4));
      blocks.length = 0; total = 0; cap = 0; count = 0; P = N = Cc = S = null;
      return g;
    },
  };
}

// surface kinds of the solid shader
// (the second surf value is gloss, except: NEEDLE tint, KOI variety 0..2, CONIFER 0 at the stem .. 1 at the hanging edge;
//  BARK takes surf.w = -1 for a limb whose grain runs along z; CONIFER takes surf.w = -0.5..0 to thin the mist on a near
//  rank; FLORET, NEEDLE, KOI and ICE read the colour attribute as noted)
const K = { WOODY: 0, WOODX: 1, WOODZ: 2, STONE: 3, PLASTER: 4, TILE: 5, MOSS: 6, METAL: 7, PEBBLE: 8, CLOTH: 9, BLIND: 10, WATER: 11, PAPER: 12, PAPERLIT: 13, FLOW: 14, THATCH: 15, BARK: 16,
  FLORET: 17, NEEDLE: 18, KOI: 19, CONIFER: 20, FROND: 21, DOME: 22, ICE: 23, FLAME: 24, FEATHER: 25, EARTH: 26, GHOST: 27 };
// a thing that lies DEEPER in the mist (the earthen wall, its roof, the woods behind) carries its weight w as surf.w = -2 - w:
// a positive surf.w is sway in the vertex shader, and walls and far woods stand still
const MW = (w) => -2 - w;

// ---------------------------------------------------------------- GLSL
const NOISE = /* glsl */`
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;
// the rain sky as a function of a local-space direction (garden = +z): used by the floor, the shell and the lights
const SKYFN = /* glsl */`
uniform vec3 uZen, uHor, uSeam, uStrata, uSunDir; uniform vec4 uSkyK;
vec3 rainSky(vec3 d){
  float el = clamp(d.y, 0., 1.);
  float hz = length(d.xz) + 1e-4, fz = d.z / hz, fwd = 0.5 + 0.5 * fz;
  float az = atan(d.x, abs(d.z) < 1e-5 ? 1e-5 : d.z);
  float cl = vn3(vec3(d.xz / (el + 0.25) * 1.6 + vec2(uTime * 0.012, 0.), uTime * 0.01));
  // THE DECK: dark blue-grey rain cloud in long torn layers that slide slowly, greyer gaps between them
  float st = vn3(vec3(az * 1.6 + uTime * 0.006, el * 8.5, 2.3)) * 0.55 + vn3(vec3(az * 4.3 - uTime * 0.009, el * 19., 7.1)) * 0.3 + cl * 0.15;
  float bars = smoothstep(0.33, 0.56, st);
  vec3 deck = mix(uHor * 0.94, uStrata * (0.78 + 0.44 * cl), clamp((0.66 + 0.34 * bars) * uSkyK.y, 0., 1.));
  deck *= 1. - 0.2 * smoothstep(0.45, 0.95, el);
  // rain veils: slanted darker curtains hanging from the cloud and drifting sideways across it
  float sl = az * 2.4 + el * 2.9;
  float v1 = vn3(vec3(sl * 1.5 + uTime * 0.03, el * 1.4, 1.5 + uTime * 0.008));
  float v2 = vn3(vec3(sl * 5.3 + uTime * 0.05, el * 3.1, 6.));
  float veil = smoothstep(0.36, 0.76, v1 * 0.72 + v2 * 0.28);
  deck *= (0.92 + 0.16 * cl) * (1. - 0.26 * veil * smoothstep(0.01, 0.1, el) * (1. - 0.5 * smoothstep(0.5, 0.9, el)));
  // THE SEAM: under the deck's torn edge, low over the wall and the cedars, the cloud stands clear of the horizon and one
  // slot of silver light shows, brightest ahead and just under the edge, sinking into the haze below it
  float edge = 0.185 + 0.05 * (vn3(vec3(az * 2.1, 1., uTime * 0.01)) - 0.5) + 0.07 * (st - 0.45);
  float open = 1. - smoothstep(edge - 0.03, edge + 0.035, el);
  float glow = (0.34 + 0.66 * fwd * fwd) * (0.72 + 0.5 * vn3(vec3(az * 7., el * 26., 4. + uTime * 0.02))) * mix(0.42, 1., smoothstep(0., 0.15, el));
  vec3 c = mix(deck, uHor * 1.06 + uSeam * glow * uSkyK.x, open);
  c += uSeam * 0.1 * uSkyK.x * fwd * exp(-(el - edge) * (el - edge) * 55.) * (1. - open);   // the edge of the deck is lit from beneath
  c *= 1. + 0.14 * fz * (1. - el);
  // the break in the cloud, where the shafts come down from
  float bk = max(dot(d, uSunDir), 0.); bk = bk * bk * bk; bk = bk * bk; bk = bk * bk;
  c += uSeam * bk * uSkyK.z * (0.5 + 0.7 * cl);
  return c;
}`;
// where the cloud break lets light down: slow drifting pools of silver light and three that are staged (uSunP: x, z, radius, strength)
const SUNFN = /* glsl */`
uniform vec4 uSunA, uSunP[6];
float sunPool(vec2 xz){
  vec2 q = xz * 0.0085 + uSunA.w * vec2(0.004, 0.0015) + 3.3;
  float n = vn3(vec3(q, 3.7)) * 0.7 + vn3(vec3(q * 2.3 + 5.1, 1.2)) * 0.3;
  float k = smoothstep(0.53, 0.7, n);
  for (int i = 0; i < 6; i++) { vec2 dd = (xz - uSunP[i].xy) / max(uSunP[i].z, 1.); k = max(k, uSunP[i].w * exp(-dot(dd, dd) * 1.6) * (0.75 + 0.5 * n)); }
  return clamp(k, 0., 1.) * uSunA.z * max(smoothstep(74., 96., xz.y), step(xz.y, -57.5) * smoothstep(13., 18., abs(xz.x)));
}`;

const SOLID_VS = /* glsl */`
attribute vec3 color; attribute vec4 surf;
uniform mat4 uInv; uniform float uTime;
varying vec3 vP, vN, vC, vV; varying vec4 vS; varying float vD, vMr;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  if (surf.w > 0.) {
    float ph = dot(floor(position.xz * 0.07), vec2(1.7, 2.3));
    p.z += sin(uTime * 0.9 + ph) * surf.w; p.x += sin(uTime * 0.63 + ph * 1.3) * surf.w * 0.4;
  }
  // shade in the hall's own space, so a mesh the world moves about (a fish, a heron, a tipping bamboo) is lit where it is
  float mir = determinant(mat3(modelMatrix)) < 0. ? -1. : 1.;
  mat4 rel = uInv * modelMatrix;
  vec3 pl = (rel * vec4(p, 1.)).xyz; pl.y *= mir;
  vec3 nl = mat3(rel) * normal; nl.y *= mir;
  vP = pl; vN = nl; vC = color; vS = surf; vMr = mir < 0. ? 1. : 0.;
  vec3 camL = (uInv * vec4(cameraPosition, 1.)).xyz; camL.y *= mir;
  vV = camL - pl;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  vD = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SOLID_FS = /* glsl */`
uniform vec3 uSky, uMistCol, uMoss, uMossRim, uPine, uGap, uSun, uSunDir, uSeam, uStrata, uLampCol; uniform float uMist, uTime, uSnow; uniform vec4 uCorr, uPond, uLamps[5], uPatch; uniform vec3 uHallK; uniform sampler2D uShade;
varying vec3 vP, vN, vC, vV; varying vec4 vS; varying float vD, vMr;
#include <fog_pars_fragment>
${NOISE}
${SUNFN}
// packed cells: x = 0 on the seam between two neighbours, rising toward each centre; yz = offset from the centre; w = a number of the cell's own
vec4 cushion(vec2 q){
  vec2 ci = floor(q), cf = fract(q), c1 = vec2(0.);
  float m1 = 9., m2 = 9., hc = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), hv = vec2(h21(ci + o), h21(ci + o + 3.7)), c = o + 0.1 + 0.8 * hv - cf;
    float d = dot(c, c);
    if (d < m1) { m2 = m1; m1 = d; c1 = c; hc = fract(hv.x * 7.31 + hv.y * 3.17); } else if (d < m2) m2 = d;
  }
  return vec4(sqrt(m2) - sqrt(m1), -c1, hc);
}
// one rain ring per cell, thin, fading as it spreads: xy = slope of the ripple, z = its crest
vec3 rainRing(vec2 xz, float sc, float rate, float fw, float seed){
  vec2 q = xz / sc + seed, id = floor(q);
  vec2 f = fract(q) - 0.5 - (vec2(h21(id), h21(id + 5.3)) - 0.5) * 0.55;
  float ph = fract(uTime * rate + h21(id + 1.7)), r = length(f) + 1e-4;
  float lw = 0.011 + fw / sc, x = (r - ph * (0.16 + 0.24 * h21(id + 2.9))) / lw;
  float amp = (1. - ph) * (1. - ph) * (1. - smoothstep(0.05, 0.22, fw / sc)) * step(0.25, h21(id + 8.1));
  return vec3(f / r * x * exp(-x * x) * amp, exp(-x * x * 3.) * amp);
}
float mistAt(float d){ float md = uMist * d * 0.62; return 1. - exp(-md * md); }
// one cedar of a far rank, drawn on a long card (c counts trees along it, yh is metres above the garden floor): a spire of
// drooping tiers, each widening down to its hem, on a bare stem; every tree its own height, in clumps with gaps between
float spire(float c, float yh, float hLo, float hHi, float sp){
  float id = floor(c), hx = h11(id * 1.37 + 0.7), H = mix(hLo, hHi, hx * hx);
  float x = (fract(c) - 0.5 - (h11(id + 4.4) - 0.5) * 0.44) * sp;
  float t = clamp(yh / max(H, 1.), 0., 1.), tier = fract(yh / (H * 0.085) + hx * 3.);
  float w = H * 0.064 * pow(1. - t, 0.85) * (0.6 + 0.55 * (1. - tier)) * step(0.13 + 0.1 * hx, t) + H * 0.007 * (1. - t) + 0.2;
  float clump = smoothstep(0.36, 0.62, vn3(vec3(id * 0.17, hLo * 0.37, 2.3)));          // they stand in clumps, with gaps the light comes through
  return step(abs(x), w) * step(yh, H) * step(mix(0.08, 0.93, clump), h11(id + 8.8));
}
// what still water shows: the rain cloud, the walled garden's cedars and earthen wall, and (in the world, uPond.y) the
// teahouse with its lit round window, the pine limb and its bamboo props, all as soft dark smears
vec3 gardenEnv(vec3 p, vec3 r, float vd){
  r.y = abs(r.y) + 0.015; r = normalize(r);
  float rx = abs(r.x) < 1e-4 ? 1e-4 : r.x, rz = abs(r.z) < 1e-4 ? 1e-4 : r.z;
  float tx = ((rx > 0. ? 211. : -211.) - p.x) / rx, tz = ((rz > 0. ? 430. : 68.) - p.z) / rz;
  float t = max(min(tx, tz), 0.), sideW = step(tx, tz), garden = max(sideW, step(0., rz));
  float yh = p.y + r.y * t, al = mix(p.x + r.x * t, p.z + r.z * t, sideW);
  float lum = dot(uSky, vec3(0.4));
  // the sky as the water sees it: the dark deck above, the silver seam under its edge
  float cln = vn3(vec3(r.xz / (r.y + 0.25) * 1.6 + vec2(uTime * 0.012, 0.), uTime * 0.01));
  vec3 col = mix(uMistCol * 1.06 + uSeam * (0.3 + 0.6 * smoothstep(-0.2, 0.9, r.z)) * mix(0.45, 1., smoothstep(0., 0.15, r.y)),
    mix(uMistCol * 0.94, uStrata, 0.66) * (0.78 + 0.44 * cln), smoothstep(0.15, 0.23, r.y + (cln - 0.5) * 0.07));
  vec3 ced = vec3(0.016, 0.05, 0.028) * lum;
  float c2 = al / 31. + 7.7, c1 = al / 27. + 0.3;
  float s2 = ${GY.toFixed(1)} + mix(74., 112., h11(floor(c2))) * clamp(1. - abs(fract(c2) - 0.5) * 2.1, 0., 1.);
  float s1 = ${GY.toFixed(1)} + mix(70., 108., h11(floor(c1))) * clamp(1. - abs(fract(c1) - 0.5) * 2.3, 0., 1.);
  float y2 = p.y + r.y * t * 1.15, y1 = p.y + r.y * t * 1.05;
  col = mix(col, mix(ced * 1.5, uMistCol, clamp(mistAt(vd + t * 1.15) + 0.25 + smoothstep(40., 110., y2) * 0.5, 0., 1.)), (1. - smoothstep(s2 - 5., s2 + 5., y2)) * garden);
  col = mix(col, mix(ced, uMistCol, clamp(mistAt(vd + t * 1.05) + smoothstep(40., 110., y1) * 0.5, 0., 1.)), (1. - smoothstep(s1 - 5., s1 + 5., y1)) * garden);
  vec3 wallC = mix(vec3(0.10, 0.10, 0.07) * lum * 1.6, vec3(0.012, 0.014, 0.016), max(smoothstep(${(GY + 23).toFixed(1)}, ${(GY + 24.6).toFixed(1)}, yh), 1. - garden));
  col = mix(col, mix(wallC, uMistCol, mistAt(vd + t)), 1. - smoothstep(mix(46., ${(GY + 25).toFixed(1)}, garden), mix(56., ${(GY + 27).toFixed(1)}, garden), yh));
  if (uPond.y > 0.5) {
    float ax = -40. * uPond.x, rl = max(length(r.xz), 1e-3);
    float tt = (392. - p.z) / rz;
    if (rz > 0. && tt > 0.) {                                       // the teahouse, its window the palest thing in the pond
      float xh = p.x + r.x * tt - ax, yy = p.y + r.y * tt;
      float roof = 12. + 20. * pow(clamp((36. - abs(xh)) / 20., 0., 1.), 0.82);
      vec3 tc = mix(vec3(0.03, 0.045, 0.026), vec3(0.15, 0.155, 0.13), 1. - smoothstep(10.6, 12.6, yy)) * lum * 1.6;
      tc = mix(tc, uGap.b > uGap.g ? vec3(0.8, 0.9, 0.86) : vec3(0.72, 0.92, 0.78), 1. - smoothstep(5.4, 8.6, length(vec2(xh, yy - 2.6))));
      col = mix(col, mix(tc, uMistCol, mistAt(vd + tt)), (1. - smoothstep(roof - 2.5, roof + 2.5, yy)) * (1. - smoothstep(33., 38., abs(xh))));
    }
    float th = (16.3 - p.y) / r.y;                                  // the trained limb and its needle pads, overhead
    float lxh = p.x + r.x * th - ax, lzh = p.z + r.z * th;
    float ml = (1. - smoothstep(2.2, 7., abs(lxh))) * smoothstep(243., 252., lzh) * (1. - smoothstep(380., 388., lzh)) * (0.5 + 0.5 * vn3(vec3(lxh * 0.4, lzh * 0.3, 3.)));
    col = mix(col, mix(vec3(0.005, 0.016, 0.01), uMistCol, mistAt(vd + th)), ml * 0.92);
    for (int k = 0; k < 2; k++) {                                   // the two rows of bamboo props
      float tp = (ax + (k == 0 ? -8. : 8.) - p.x) / rx;
      float zh = p.z + r.z * tp, j = clamp(floor((zh - 252.) / 16. + 0.5), 0., 8.);
      float dz = abs(zh - (252. + 16. * j)) * abs(r.x) / rl;
      float mp = (1. - smoothstep(0.32, 0.8 + 0.012 * max(tp, 0.), dz)) * (1. - smoothstep(13., 15.5, p.y + r.y * tp)) * step(0., tp);
      col = mix(col, mix(vec3(0.016, 0.03, 0.012), uMistCol, mistAt(vd + max(tp, 0.))), mp * 0.88);
    }
  }
  return col;
}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 v = normalize(vV + vec3(0., 1e-5, 0.));
  float back = step(dot(n, v), 0.);
  if (back > 0.5) n = -n;
  float kind = floor(vS.x + 0.5), gloss = vS.y, ex = vS.z;
  float dome = step(21.5, kind) * step(kind, 22.5);
  if (dome > 0.5) kind = 6.;
  float fwPx = fwidth(vP.x), fwPy = fwidth(vP.y), fwPz = fwidth(vP.z);
  float fwP = fwidth(vC.x) * 8. + fwidth(vC.y) * 18., fwXZ = fwPx + fwPz;
  vec3 alb = vC, emis = vec3(0.), p = vP;
  float sunK = ex > 0.01 ? sunPool(p.xz - uSunA.xy * (p.y - (${GY.toFixed(1)}))) : 0.;
  float mossCap = 1., glintK = 1., thru = 0., skyGl = 1.;
  vec3 snowTint = vec3(1.);
  float ndv0 = clamp(dot(n, v), 0., 1.);
  if (kind < 2.5) {                                   // timber, grain along y / x / z
    vec3 q = kind < 0.5 ? p.xzy : (kind < 1.5 ? p.yzx : p.xyz);
    float g = vn3(vec3(q.xy * 4., q.z * 0.3)), g2 = vn3(vec3(q.xy * 15., q.z * 1.2));
    float ring = abs(fract(g * 5. + q.x * 1.1) - 0.5) * 2.;
    alb *= 0.6 + 0.5 * g + 0.4 * g2 * ring;
    gloss *= 0.65 + 0.6 * g2;
  } else if (kind < 3.5) {                            // stone: grain and pits, pale lichen rosettes, dark wet streaks down the faces, moss on the ledges
    float s = vn3(p * 2.6), b = vn3(p * 0.45 + 7.);
    float nearK = 1. - smoothstep(0.03, 0.2, fwXZ);
    float gr = mix(0.5, vn3(p * 11.) * 0.6 + vn3(p * 29.) * 0.4, nearK);
    float wall = 1. - smoothstep(0.3, 0.75, abs(n.y));
    alb *= (0.68 + 0.56 * s) * (0.7 + 0.6 * gr) * (1. - 0.45 * nearK * smoothstep(0.7, 0.82, vn3(p * 17. + 3.)));
    alb = mix(alb, vec3(0.30, 0.36, 0.30), smoothstep(0.58, 0.72, b + s * 0.15) * 0.6);
    // rain runs down the upright faces in dark, glossy streaks that keep their place
    float streak = smoothstep(0.48, 0.72, vn3(vec3(p.x * 2.3 + p.z * 1.7, p.y * 0.2, p.z * 2.3 - p.x * 1.1)) + (gr - 0.5) * 0.12) * wall * ex;
    alb *= 1. - 0.5 * streak;
    // lichen: grey-green and ochre rosettes with crinkled rims, each its own size
    vec2 lq = abs(n.y) > 0.62 ? p.xz : (abs(n.x) > abs(n.z) ? p.zy : p.xy);
    vec4 lc = cushion(lq * 0.85 + 11.3);
    float lr = length(lc.yz), lrad = 0.14 + 0.24 * lc.w;
    float lich = (1. - smoothstep(lrad - 0.06, lrad, lr + (gr - 0.5) * 0.1 + (s - 0.5) * 0.06)) * step(0.42, lc.w) * (1. - 0.6 * streak) * (1. - smoothstep(0.35, 1.2, fwXZ));
    vec3 lcol = mix(vec3(0.25, 0.29, 0.23), vec3(0.32, 0.27, 0.12), step(0.82, lc.w));
    alb = mix(alb, lcol * (0.7 + 0.5 * gr) * (0.62 + 0.55 * smoothstep(0., lrad, lr)), lich * 0.82);
    float ms = smoothstep(0.3, 0.8, n.y) * smoothstep(0.35, 0.6, vn3(p * 0.8 + 3.)) * ex * (1. - 0.85 * smoothstep(0.56, 0.7, gloss));
    alb = mix(alb, uMoss * (0.6 + 0.8 * s) * (0.75 + 0.5 * gr), ms);
    gloss *= (1. - ms) * (1. - 0.75 * lich) * mix(0.5, 1., max(streak, 1. - wall)) * (0.75 + 0.5 * gr);
    glintK = 0.3;
  } else if (kind < 4.5) {                            // plaster / earth wall, rain streaked
    float st = vn3(vec3(p.x * 0.9, p.y * 0.06, p.z * 0.9)), s = vn3(p * 1.7);
    alb *= (0.8 + 0.25 * s) * (1. - 0.3 * smoothstep(0.5, 0.85, st) * ex);
  } else if (kind < 5.5) {                            // roof tile: round cover tiles running down the slope
    float ax = step(abs(n.x), abs(n.z));
    float t = mix(p.z, p.x, ax) / 1.5, u = mix(p.x, p.z, ax) / 2.1;
    float f = fract(t) - 0.5, ft = floor(t);
    float hump = 1. - smoothstep(0.18, 0.5, abs(f));
    float cu = u + h11(ft) ;
    alb *= (0.4 + 0.6 * hump) * (0.75 + 0.5 * h21(vec2(ft, floor(cu)))) * (0.7 + 0.3 * smoothstep(0., 0.2, fract(cu)));
    n = normalize(n + mix(vec3(0., 0., 1.), vec3(1., 0., 0.), ax) * f * hump * 1.1);
    alb = mix(alb, uMoss * 0.5, (1. - hump) * smoothstep(0.5, 0.7, vn3(p * 0.35)) * 0.6);
    gloss *= 0.45 + 0.55 * hump;
  } else if (kind < 6.5) {                            // moss: dark creases, bright crowns, frayed rim, drop glints
    // The real mounds (dome) are humps of their own, each with a soft quilting of big cushions, vivid on the crown and
    // near black where it meets its neighbours. The ground between them is a carpet of small soft tufts with shallow
    // creases, well below a stepping stone in size, lying dark in the shade the mounds lay on it (uShade).
    float s = vn3(p * 2.2), s2 = vn3(p * 9.), ny0 = n.y, gnd = 1. - dome;
    float lp = vn3(p * 0.1 + 2.), lp2 = vn3(p * 0.33 + 9.);
    float s4t = mix(0.5, vn3(p * 41.), 1. - smoothstep(0.015, 0.07, fwXZ));
    float topK = smoothstep(0.3, 0.75, ny0) * mix(1., 0.45, dome);
    // the slow patches, each in drifts of its own: moss that is wetter and darker, and paler new growth
    // (all of this belongs to the cushions and to the HILLSIDE's own ground, by a rule of place: the slope that falls from the
    // veranda's edge to the stone lantern's line, and the hill where it stands, as it stood before the way was cut, 1.5 to 4 m
    // over the garden's floor. The pond's shore by the stepping stones, the ground before the teahouse and the moss on the
    // thatch keep the look they had)
    float hillG = max(smoothstep(1.5, 4., 30. * smoothstep(-15., 150., p.x * uPond.x + (p.z - 230.) * 0.15) * smoothstep(80., 190., p.z)),
      smoothstep(${(ZE - 2).toFixed(1)}, ${(ZE + 4).toFixed(1)}, p.z) * (1. - smoothstep(184., 196., p.z)));
    float plc = max(dome, hillG);
    float wetP = smoothstep(0.55, 0.7, vn3(vec3(p.xz * 0.043 + uPatch.xy, 1.3)) * 0.72 + lp2 * 0.28) * plc;
    float paleP = smoothstep(0.56, 0.72, vn3(vec3(p.xz * 0.057 + uPatch.zw, 6.1)) * 0.76 + s * 0.24) * (1. - wetP) * plc;
    // velvet: every cushion is a pile of small soft heads, dark between them, each catching the sky on its own crown
    vec2 tq = p.xz + p.y * vec2(0.83, 0.56) + (vec2(vn3(p * 1.9 + 4.), vn3(p * 1.9 + 15.)) - 0.5) * 0.42 + (vec2(s2, vn3(p * 9. + 7.)) - 0.5) * 0.12;   // warped, so the heads never lie in rows
    float lodT = 1. - smoothstep(0.05, 0.22, fwXZ);
    // the heads are of two sizes, and a slow noise of the place says which grow where
    vec4 tf = mix(cushion(tq * 5.3 + 1.7), cushion(tq * 2.7 + 8.3), smoothstep(0.4, 0.6, vn3(vec3(p.xz * 0.21 + 7.3, 2.6)) * 0.8 + lp2 * 0.2));
    float tuft = mix(0.5, clamp(tf.x * 1.7 + (s4t - 0.5) * 0.5, 0., 1.), lodT);
    vec2 wq = p.xz + (vec2(lp2, vn3(p * 0.41 + 3.)) - 0.5) * mix(3.4, 1.5, gnd) + (vec2(s, vn3(p * 2.2 + 5.)) - 0.5) * mix(0.55, 0.3, gnd);
    float csc = mix(1., 2.7, gnd);
    vec4 ca = cushion(wq * 0.55 * csc), cb = cushion(wq * 0.23 * csc + 3.3);
    float lodA = 1. - smoothstep(0.55, 1.7, fwXZ * 1.15 * csc), lodB = 1. - smoothstep(0.55, 1.7, fwXZ * 0.5 * csc), onB = step(0.5, cb.w);
    float pA = mix(0.5, clamp(ca.x * 1.6, 0., 1.) * (0.55 + 0.45 * ca.w), lodA);
    float pB = mix(0.55, clamp(cb.x * 1.65, 0., 1.) * (0.75 + 0.5 * cb.w), lodB) * onB;
    float big = step(pA, pB), ch = mix(ca.w, cb.w, big);
    float seam = (1. - smoothstep(0., 0.17, abs(pA - pB))) * onB * lodA;
    float hh = mix(1., clamp(max(pA, pB), 0., 1.), topK);
    float fz = mix(0.5, vn3(p * 23.), 1. - smoothstep(0.03, 0.12, fwXZ));
    float hg = clamp(hh + ((s2 - 0.5) * 0.55 + (fz - 0.5) * 0.35) * gnd * topK, 0., 1.);       // the ground's tufts are frayed: no clean line runs between them
    float sh0 = texture2D(uShade, (p.xz - vec2(${(SGX0 - 0.5).toFixed(1)}, ${(SGZ0 - 0.5).toFixed(1)})) / vec2(${SGN.toFixed(1)}, ${SGM.toFixed(1)})).r, sh = dome > 0.5 ? 0. : sh0;
    float vall = smoothstep(0., mix(0.85, 0.5, dome), hg);
    float mom = dome * step(0.4, gloss); gloss = mix(gloss, 0.2, dome);     // a great low cushion that others ride on and crowd: they lay their shade on it
    // the crease's own share of the shade (1 where no crease is): the seam where two cushions meet, the shade the mounds lay on the
    // ground and on each other, the flank's foot. Whatever is laid over the moss below yields to it: nearly black in the creases
    float crK = (1. - 0.7 * seam * topK * dome) * (1. - 0.93 * sh * sh * (3. - 2. * sh))
      * (1. - 0.8 * dome * smoothstep(0.8, 1., sh0) * (1. - smoothstep(0.5, 0.86, ny0)))
      * (1. - mom * max(0.62 * smoothstep(0.3, 0.8, sh0), 0.8 * smoothstep(0.35, 0.9, sh0)));               // a crease, nearly black, where two cushions meet; a great low cushion lies in the shade of those that crowd it, deepest where they stand thickest
    float occ = mix(mix(0.6, 0.05, dome), 1., vall) * crK;
    // a hollow: the hill's ground in the skirt of shade round whatever stands on it (mounds, rocks, hydrangeas, the lantern; the
    // shade grid, the same from every eye). It takes no lift, lies wet and dark, and no pale growth stands in it
    float holl = (1. - dome) * hillG * smoothstep(0.05, 0.45, sh0);
    float sideK = smoothstep(0.3, 0.93, ny0), s3 = fz, s4 = mix(0.5, vn3(p * 57.), 1. - smoothstep(0.012, 0.05, fwXZ));
    float crown = mix(smoothstep(0.5, 1., hg) * 0.38, smoothstep(0.45, 0.95, hh) * 0.5 + smoothstep(0.82, 0.995, ny0), dome);
    float detK = max(lodA, lodB);
    alb *= (0.5 + 0.5 * s + 0.42 * s2) * (0.78 + 0.44 * s3) * (0.8 + 0.4 * s4) * mix(0.1, 1.08, sideK) * mix(0.5, 1.2, smoothstep(0.2, 0.8, lp)) * mix(0.8, 1., dome);
    alb = mix(alb, alb * vec3(0.5, 0.82, 0.8), (1. - lp) * 0.55);                // cooler, deeper drifts
    alb = mix(alb * vec3(0.4, 0.8, 0.9), alb, sideK);                            // dark green beneath
    alb *= mix(vec3(1.), mix(vec3(0.62, 0.86, 0.88), vec3(1.3, 1.12, 0.7), ch), topK * detK * mix(0.6, 1., dome));   // every cushion its own green
    alb *= mix(1., (0.74 + 0.4 * smoothstep(0., 0.9, tuft)) * mix(1., 0.86 + 0.28 * tf.w, lodT) * (0.9 + 0.2 * s4t), plc);        // the heads, and the soft dark between them
    alb *= mix(1., mix(mix(1., 1.42, hillG * (1. - holl)), mix(0.55, 1.72, smoothstep(0.72, 0.98, ny0)), dome), crK);                // vivid on the crown only, falling to dark green down the flank; the lift yields to the crease and to the hollow
    alb = mix(alb, alb * vec3(0.64, 0.84, 0.78), max(wetP, holl) * 0.85);
    alb = mix(alb, alb * vec3(1.3, 1.2, 0.78) + uMossRim * 0.035, paleP * 0.8 * crK * (1. - holl));
    vec3 hi = mix(alb * 1.2, uMossRim * (0.7 + 0.55 * s) * (0.8 + 0.4 * s3), 0.3 + 0.4 * smoothstep(0.3, 0.7, lp2));
    alb = mix(mix(alb * mix(vec3(0.66, 0.8, 0.78), vec3(0.3, 0.5, 0.5), dome), alb, vall), hi, crown * 0.85) * occ;
    vec2 slope = mix(ca.yz * lodA * 1.7, cb.yz * lodB * 1.1, big) * (1. - smoothstep(0.1, 0.9, hh)) * mix(0.22 * (1. - 0.85 * uSnow), 1., dome);
    n = normalize(n + vec3(slope.x, 0., slope.y) * topK + vec3(tf.y, 0., tf.z) * (0.45 * plc * lodT * (1. - smoothstep(0.1, 0.8, tuft)) * smoothstep(0.1, 0.5, ny0)));
    float rimK = pow(1. - ndv0, 3.);
    alb += uMossRim * (rimK * mix(0.07, 0.3, dome) + (1. - ndv0) * (1. - ndv0) * 0.2 * dome * (0.5 + tuft) * crK) * (0.4 + s2) * (0.7 + 0.6 * s4) * smoothstep(0.05, 0.5, ny0);    // the soft rim, lit from behind; the nap of the velvet
    skyGl = mix(1., 0.22, plc);                                                                  // no sheet of sheen on a cushion: only beads and fine glints
    if (dome > 0.5 && (back > 0.5 || ndv0 < 0.5 * (vn3(p * 3.1) * 0.52 + vn3(p * 9.7) * 0.3 + s3 * 0.18) - 0.06)) discard;   // frayed edge
    // under snow the ground is one soft blanket: faint blue-grey dimples where the creases were, a few crowns standing clear
    float show = smoothstep(0.62, 0.9, hh) * step(0.8, ch) * topK * detK;
    mossCap = dome > 0.5 ? mix(1., smoothstep(0.15, 0.55, hh), topK * lodA) : 1. - 0.9 * show;
    snowTint = mix(vec3(1.), vec3(0.76, 0.83, 0.94), gnd * (1. - vall) * 0.7 * detK) * mix(vec3(1.), vec3(0.62, 0.7, 0.84), gnd * sh * 0.75);
    vec2 bq = p.xz * 6.5;                                                                       // water beads on the crowns: small, sparse, the colour of the sky
    float bead = (1. - smoothstep(0.08, 0.2, length(fract(bq) - 0.5))) * step(mix(0.965, 0.99, smoothstep(5., 26., vD)) - 0.03 * wetP, h21(floor(bq)));
    emis += (uSky * vec3(0.86, 1., 1.1) * 1.05 + uSun * sunK * 1.4) * bead * (0.35 + 0.65 * hh * hh) * smoothstep(0.25, 0.7, ny0) * (1. - sh) * (1. - smoothstep(0.12, 0.5, fwXZ));
    vec2 gq = tq * 6.3;                                                                          // fine wet glints that come and go as the drops gather and fall
    float gh = h21(floor(gq)), tw = 0.5 + 0.5 * sin(uTime * (0.6 + 1.7 * gh) + gh * 40.); tw *= tw; tw *= tw;
    emis += uSky * vec3(0.84, 1., 1.06) * 0.5 * (1. - smoothstep(0.06, 0.2, length(fract(gq) - 0.5))) * step(mix(0.95, 0.84, wetP), gh) * tw
      * smoothstep(0.3, 0.75, ny0) * (1. - sh) * (1. - smoothstep(0.05, 0.2, fwXZ)) * (1. - uSnow) * plc;
    alb = mix(alb, alb * vec3(1.25, 1.12, 0.72), sunK * 0.6 * smoothstep(0.2, 0.8, ny0));          // moss in the light turns gold-green
    alb *= 1. - 0.62 * uSnow;                                                                     // February: what the snow leaves bare is dark and wet
  } else if (kind < 7.5) {                            // bronze with verdigris
    float verd = smoothstep(0.4, 0.75, vn3(p * 1.3));
    alb = mix(alb, vec3(0.08, 0.2, 0.16), verd * 0.7); gloss *= 1. - 0.6 * verd;
  } else if (kind < 8.5) {                            // pebbles, with splash rings under the drip line
    vec2 q = p.xz * 1.25, id = floor(q), f = fract(q);
    float md = 9., hid = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), c = o + vec2(h21(id + o), h21(id + o + 3.7)) - f;
      float d = dot(c, c);
      if (d < md) { md = d; hid = h21(id + o + 9.); }
    }
    float pl = smoothstep(0.12, 0.5, fwXZ * 1.25);
    alb *= mix((0.3 + 0.7 * (1. - smoothstep(0.06, 0.42, md))) * (0.55 + 0.9 * hid), 0.62, pl);
    gloss *= mix(1. - smoothstep(0.06, 0.42, md), 0.5, pl);
    float cx = floor((p.x - ${DRIP_X0.toFixed(1)}) / ${DRIP_DX.toFixed(1)} + 0.5) * ${DRIP_DX.toFixed(1)} + ${DRIP_X0.toFixed(1)};
    // where the eave's beads land: thin rings of two sizes that fade as they spread, like those on the pond
    float rr = length(vec2(p.x - cx, p.z - ${(ZE + 0.3).toFixed(1)})), h0 = h11(cx), rlw = 0.016 + fwXZ * 0.3;
    float ph = fract(uTime * 0.9 + h0), ph2 = fract(uTime * 0.63 + h0 * 7.3 + 0.5);
    float rg = (1. - smoothstep(0., rlw, abs(rr - ph * (0.7 + 0.9 * h0)))) * (1. - ph) * (1. - ph)
      + 0.7 * (1. - smoothstep(0., rlw, abs(rr - ph2 * (0.45 + 0.8 * fract(h0 * 5.7))))) * (1. - ph2) * (1. - ph2);
    emis += uSky * 0.75 * rg * min(1., 0.03 / rlw + 0.2) * (1. - uSnow);
  } else if (kind < 9.5) {                            // cloth, oiled paper
    alb *= 0.85 + 0.3 * vn3(p * 12.);
  } else if (kind < 10.5) {                           // bamboo blind
    float sl = fract(p.y * 2.2);
    alb *= 0.15 + 0.85 * smoothstep(0., 0.14, sl) * (1. - smoothstep(0.84, 1., sl));
    alb *= 1. - 0.7 * (1. - smoothstep(0.02, 0.05, abs(fract(p.x / 3.2) - 0.5)));
  } else if (kind < 11.5) {                           // still water with rain rings
    // dark green-black water: thin rings of several sizes bend what it mirrors; pearl only where it looks at the cloud
    float fw = fwXZ * 0.5, wet = 1. - 0.7 * uSnow;
    float pool = step(0.3, gloss) * step(gloss, 0.7), rsc = mix(1., 0.34, pool);     // a rain pool in the moss (gloss 0.5 marks it): its rings are small
    vec3 r1 = rainRing(p.xz, 3.1 * rsc, 0.55, fw, 0.), r2 = rainRing(p.xz, 6.7 * rsc, 0.31, fw, 4.7), r3 = rainRing(p.xz, 1.7 * rsc, 0.8, fw, 9.1);
    vec2 wob = (vec2(vn3(vec3(p.xz * 0.7, uTime * 0.45)), vn3(vec3(p.xz * 0.7 + 9., uTime * 0.45))) - 0.5) * 0.05;
    n = normalize(n + vec3(r1.x + r2.x + r3.x * 0.6, 0., r1.y + r2.y + r3.y * 0.6) * 1.3 * wet + vec3(wob.x, 0., wob.y));
    float Fw = 0.03 + 0.97 * pow(1. - clamp(dot(n, v), 0., 1.), 4.2);
    vec3 env = gardenEnv(p, reflect(-v, n), vD);
    float spk = vn3(vec3(p.xz * 2.7, uTime * 1.6)) * vn3(vec3(p.xz * 6.9 + 7., uTime * 2.3));
    emis += mix(vec3(0.007, 0.019, 0.014) * dot(uSky, vec3(0.6)), env, Fw) + uSky * (r1.z + r2.z + r3.z * 0.5) * 0.09 * wet
      + uSun * sunK * (smoothstep(0.5, 0.64, spk) * 0.8 + (r1.z + r2.z) * 0.6 + 0.035) * (1. - smoothstep(0.2, 0.9, fw));
    alb = vec3(0.); gloss = 0.;
    if (pool > 0.5) {
      // A small dark water lying in a hollow (colour attribute x: 0 in its middle, 1 about where the water ends, more on
      // the wet moss round it). Looking down into it one sees the near-black of the creases and a little moss through the
      // shallows; it gives back the cloud only at a grazing angle. Its edge is cut by a clamped noise, never a straight run.
      float en = vC.x + clamp((vn3(vec3(p.xz * 0.9, 2.)) - 0.5) * 0.52 + (vn3(vec3(p.xz * 3.1, 6.)) - 0.5) * 0.2, -0.36, 0.36);
      if (en > 1.3 + 0.34 * vn3(vec3(p.xz * 6.1, 9.))) discard;
      float water = 1. - smoothstep(0.96, 1.04, en), lum = dot(uSky, vec3(0.6));
      vec3 deep = (vec3(0.005, 0.015, 0.01) + uMoss * 0.045 * smoothstep(0.5, 1., en) * (0.4 + 0.9 * vn3(p * 6.3))) * lum;
      vec3 wcol = mix(deep, env, Fw) + uSky * (r1.z + r2.z + r3.z * 0.5) * 0.13 * wet
        + uSun * sunK * ((r1.z + r2.z) * 0.6 + 0.035) * (1. - smoothstep(0.2, 0.9, fw));
      emis = wcol * water;
      alb = uMoss * 0.17 * (0.55 + 0.9 * vn3(p * 7.1)) * (1. - water);          // the wet rim of moss round it: darker than any cushion
      gloss = 0.12 * (1. - water);
    }
  } else if (kind < 13.5) {                           // ink-washed paper screen (colour attribute = panel coords)
    float pu = vC.x, pv = vC.y, pi = floor(vC.z * 32. + 0.5), w = pi + pu;
    float m1 = vn3(vec3(w * 1.3, pv * 3.2, 1.)), m2 = vn3(vec3(w * 3.1, pv * 7., 5.));
    float wash = smoothstep(0.35, 0.75, m1 * 0.7 + m2 * 0.3) * smoothstep(0.05, 0.5, pv);
    float y0 = 0.6 + 0.16 * sin(w * 1.7 + 1.) + 0.07 * sin(w * 4.3);
    float tuft = smoothstep(0.45, 0.7, vn3(vec3(w * 7., pv * 11., 9.)));
    float ink = (1. - smoothstep(0., 0.15, abs(pv - y0))) * tuft;
    ink = max(ink, (1. - smoothstep(0.004, 0.012, abs(pv - y0 + 0.012 * sin(w * 23.)))) * 0.9);
    alb = vec3(0.50, 0.55, 0.51) * (1. - 0.35 * wash);
    alb = mix(alb, vec3(0.02, 0.025, 0.03), clamp(ink, 0., 1.) * 0.88);
    float fe = min(min(pu, 1. - pu) * 8., min(pv, 1. - pv) * 18.);
    float frame = 1. - smoothstep(0.3 - fwP - 1e-4, 0.3 + fwP + 1e-4, fe);
    vec2 pc = vec2((pu - (mod(pi, 2.) < 0.5 ? 0.9 : 0.1)) * 8., (pv - 0.42) * 18.);
    float pr = length(pc), pull = (1. - smoothstep(0.5, 0.56, pr)) * smoothstep(0.3, 0.36, pr);
    float lsh = smoothstep(0.47, 0.6, vn3(vec3(pu * 2.6 + pi * 3.1 + 0.25 * sin(uTime * 1.9 + pi), pv * 5.5 + 0.12 * sin(uTime * 2.6 + pi * 1.3), 1.)) * 0.6 + vn3(vec3(pu * 7.5 + pi, pv * 16., 4.)) * 0.4);
    emis = alb * uSky * uHallK.y * 1.5 * (1. - 0.42 * lsh * smoothstep(0.12, 0.5, pv)) * (0.7 + 0.3 * pv) * (0.85 + 0.3 * vn3(vec3(pu * 0.7 + pi, pv, uTime * 0.6)));
    alb = mix(alb, vec3(0.006), max(frame, pull)); emis *= 1. - max(frame, pull);
    gloss = mix(0.04, 0.7, frame);
  } else if (kind < 14.5) {                           // water running down a rain chain
    float a = atan(n.z, n.x + 1e-5);
    float s = vn3(vec3(a * 1.5, p.y * 0.7 + uTime * 6., 2.)), s2 = vn3(vec3(a * 4., p.y * 2.2 + uTime * 9., 7.));
    alb = vec3(0.03); emis = uSky * (0.2 + 2.8 * s * s * s2); gloss = 1.;
  } else if (kind < 15.5) {                           // thatch: combed straw in courses, mossed and wet
    float st = vn3(vec3(p.x * 5., p.y * 0.6, p.z * 5.)), co = fract(p.y * 0.55 + vn3(p * 0.35) * 0.5);
    alb *= (0.5 + 0.7 * st) * (0.6 + 0.4 * smoothstep(0., 0.25, co));
    float ms = smoothstep(0.42, 0.62, vn3(p * 0.22 + 5.) * 0.7 + vn3(p * 1.1) * 0.3) * ex;
    alb = mix(alb, uMoss * (0.45 + 0.8 * st), ms * 0.85); gloss *= 0.5;
  } else if (kind < 16.5) {                           // pine bark: long plates between dark furrows, rust and lichen
    float limbK = step(vS.w, -0.5);
    vec3 q = limbK > 0.5 ? p.xyz : p.xzy;             // q.z runs along the grain
    vec2 an = abs(limbK > 0.5 ? n.xy : n.xz) + 1e-3;
    float wA = smoothstep(0.3, 0.7, an.x / (an.x + an.y));
    float fl = vn3(vec3(q.xy * 6., q.z * 1.3)), tone = vn3(q * vec3(1.2, 1.2, 0.35) + 4.);
    float wv = (vn3(q * vec3(0.7, 0.7, 0.45) + 1.7) - 0.5) * 1.5;     // the plates wander: long, narrow, never a net of tiles
    vec4 pa = cushion(vec2(q.y * 4.2 + wv, q.z * 0.5)), pb = cushion(vec2(q.x * 4.2 + 5.1 + wv, q.z * 0.5 + 2.7));
    float fur = (1. - smoothstep(0.015, 0.07 + 0.22 * fl, mix(pb.x, pa.x, wA))) * (1. - smoothstep(0.08, 0.3, fwXZ));
    alb *= mix(0.84, 1.14, mix(pb.w, pa.w, step(0.5, wA)));
    alb *= (0.55 + 0.55 * fl) * (0.8 + 0.4 * vn3(vec3(q.xy * 17., q.z * 2.2))) * mix(0.72, 1.3, tone) * (1. - 0.55 * fur);
    alb = mix(alb, alb * vec3(1.4, 0.9, 0.68), smoothstep(0.45, 0.8, tone) * 0.6);
    alb = mix(alb, vec3(0.28, 0.36, 0.27), (1. - fur) * smoothstep(0.62, 0.8, vn3(p * 0.9 + 2.) * 0.7 + fl * 0.3) * 0.6);
    alb = mix(alb, uMoss * (0.5 + 0.5 * fl), smoothstep(0.35, 0.8, n.y) * smoothstep(0.4, 0.65, vn3(p * 0.7 + 8.)) * ex);
    gloss *= 1. - 0.8 * fur;
  } else if (kind < 17.5) {                           // hydrangea head: a mass of small four-petalled florets
    vec3 g = p * 2.7, gi = floor(g);
    float hh = h31(gi);
    vec3 d3 = fract(g) - 0.5 - (vec3(hh, h31(gi + 3.1), h31(gi + 7.7)) - 0.5) * 0.4;
    vec3 t1 = normalize(cross(n, vec3(0.31, 0.9, 0.23)) + vec3(1e-4, 0., 0.)), t2 = cross(n, t1);
    vec2 d2 = vec2(dot(d3, t1), dot(d3, t2));
    float rr = length(d2), th = atan(d2.y, d2.x + 1e-5) + hh * 6.283;
    float edge = 0.27 + 0.17 * abs(cos(th * 2.));
    float pet = 1. - smoothstep(edge - 0.07, edge, rr);
    if (ndv0 < 0.36 && pet < 0.5) discard;            // a scalloped outline, not a ball
    vec3 fc = mix(alb, alb * vec3(1.5, 1.15, 1.) + vec3(0.03, 0.02, 0.05), hh);
    fc = mix(fc, vec3(0.3, 0.42, 0.22), step(0.88, h31(gi + 11.)));
    alb = mix(alb * 0.18, fc * (0.7 + 0.55 * rr / edge), pet);
    alb = mix(alb, vec3(0.5, 0.52, 0.4), (1. - smoothstep(0.03, 0.07, rr)) * 0.8);
    gloss = 0.3 * pet;
  } else if (kind < 18.5) {                           // pine pad: tufts of needles (colour attribute = pad coordinates, y = the pad's own number; y > 1.5 marks an upright fan card)
    float farK = smoothstep(0.3, 0.9, fwXZ), seed = fract(vC.y);
    float lit = smoothstep(-0.15, 0.3, v.y);          // seen from above the tops are lit; from below they are dark, with light in the needle tips
    float tip = 0.;
    if (vC.y > 1.5) {                                 // fans of needles standing along the pad's ribs: its thickness and bristling outline in side view
      float cu = vC.x * 3.5 + seed * 13.;
      float c1 = floor(cu), c2 = floor(cu + 0.5);
      vec2 f1 = vec2(fract(cu) - 0.5, (vC.z - 0.1 - 0.14 * h11(c1 + 1.3)) * 2.2), f2 = vec2(fract(cu + 0.5) - 0.5, (vC.z - 0.1 - 0.14 * h11(c2 + 7.1)) * 2.2);
      float r1 = length(f1), r2 = length(f2), a1 = atan(f1.x, f1.y + 1e-5), a2 = atan(f2.x, f2.y + 1e-5);
      float R1 = (0.8 + 0.55 * h11(c1 + 5.)) * (0.62 + 0.38 * abs(sin(a1 * 7. + c1))), R2 = (0.8 + 0.55 * h11(c2 + 9.)) * (0.62 + 0.38 * abs(sin(a2 * 7. + c2)));
      float ray1 = max(step(0.42, abs(sin(a1 * 14. + c1 * 3.))), step(r1, 0.22)), ray2 = max(step(0.42, abs(sin(a2 * 14. + c2 * 5.))), step(r2, 0.22));
      float m1 = step(abs(a1), 1.7) * step(r1, R1) * mix(ray1, 1., farK), m2 = step(abs(a2), 1.7) * step(r2, R2) * mix(ray2, 1., farK);
      if (max(m1, m2) * (1. - smoothstep(0.82, 1., abs(vC.x))) < 0.5) discard;
      tip = m1 > 0.5 ? r1 / R1 : r2 / R2;
      alb = uPine * vS.y * (0.5 + 0.75 * tip) * (0.75 + 0.5 * vn3(p * 1.3));
      emis += uPine * uSky * 0.3 * tip;
    } else {
      float rad = length(vC.xz), ang = atan(vC.z, vC.x + 1e-5);
      vec2 tq = p.xz * 0.85, ti = floor(tq), tf = fract(tq) - 0.5;
      float th1 = h21(ti);
      tf -= (vec2(th1, h21(ti + 4.1)) - 0.5) * 0.5;
      float ta = atan(tf.y, tf.x + 1e-5), st1 = 0.3 + 0.3 * abs(sin(ta * 5.5 + th1 * 6.283)), k1 = length(tf) / st1;
      vec2 tq2 = tq + 0.5, ti2 = floor(tq2), tf2 = fract(tq2) - 0.5;
      float th2 = h21(ti2 + 9.);
      tf2 -= (vec2(th2, h21(ti2 + 2.3)) - 0.5) * 0.5;
      float tb = atan(tf2.y, tf2.x + 1e-5), st2 = 0.3 + 0.3 * abs(sin(tb * 5.5 + th2 * 6.283)), k2 = length(tf2) / st2;
      float kk = min(k1, k2), ray = abs(sin((k1 < k2 ? ta : tb) * 10. + (k1 < k2 ? th1 : th2) * 40.));
      // each tuft a solid heart and then separate needles, the sky between them; the pad's outline ragged and spiky
      float cut = mix(0.52 + 0.8 * ray * ray, 3., farK);
      float rimR = 0.62 + 0.36 * abs(sin(ang * 4.5 + seed * 40.)) * (0.62 + 0.38 * sin(ang * 13. + seed * 90.));
      if (rad > rimR + 0.12 * farK || (rad > 0.15 && kk > cut)) discard;
      tip = smoothstep(0.45, 1.1, kk);
      alb = uPine * vS.y * (0.5 + 0.55 * ray * (1. - farK) + 0.3 * farK) * (0.7 + 0.5 * vn3(p * 1.3));
      alb = mix(alb, alb * vec3(1.5, 1.5, 1.1) + uMossRim * 0.05, tip * 0.7);   // fresh tips
      alb *= 1. + 0.5 * smoothstep(0.4, 0.85, rad);
      float br = (1. - smoothstep(0.022, 0.05 + fwXZ * 0.25, abs(sin(ang * 2.5 + seed * 20.)) * rad)) * (1. - smoothstep(0.5, 0.78, rad)) * (1. - farK);
      alb = mix(alb * mix(0.42, 1., lit), vec3(0.1, 0.08, 0.055), br * (1. - lit));          // branchlets under the pad
      emis += uPine * uSky * 0.5 * tip * (1. - lit) * (1. - br);
    }
    vec2 dq = p.xz * 3.6;                                                                   // a drop on a needle tip
    emis += uSky * vec3(0.9, 1., 1.08) * 1.3 * (1. - smoothstep(0.12, 0.3, length(fract(dq) - 0.5))) * step(0.965, h21(floor(dq))) * smoothstep(0.5, 0.9, tip) * (1. - farK);
    gloss = 0.3;
  } else if (kind < 19.5) {                           // koi (colour attribute = body coordinates): white, ink, slate
    float ty = floor(vS.y + 0.5);
    float m = vn3(vC * vec3(1.1, 1.1, 0.7) + ty * 7.3) * 0.75 + vn3(vC * 2.6 + 3. + ty * 5.1) * 0.25;
    float thr = ty < 0.5 ? 0.56 : (ty < 1.5 ? 0.6 : 0.55);
    float pt = smoothstep(thr - 0.02, thr + 0.02, m);
    vec3 white = vec3(0.66, 0.68, 0.64), ink = vec3(0.004, 0.005, 0.007), slate = vec3(0.045, 0.085, 0.19), verm = vec3(0.74, 0.07, 0.016), gold = vec3(0.8, 0.3, 0.03);
    alb = mix(ty < 0.5 ? white : (ty < 1.5 ? ink : gold), ty < 0.5 ? verm : (ty < 1.5 ? slate : white), pt);
    float sc = abs(fract(vC.z * 2.4 + 0.5 * floor(atan(vC.y, vC.x + 1e-5) * 3.)) - 0.5);
    alb *= 0.84 + 0.32 * sc;
    alb = mix(alb, white * 0.9, (1. - smoothstep(-0.5, -0.1, vC.y)) * 0.5);
    gloss = 0.95;
  } else if (kind < 20.5) {                           // cedar boughs: ragged hanging hems, lighter toward the tips
    float ed = vS.y, cn = vn3(p * vec3(0.16, 0.1, 0.16)), cn2 = vn3(p * 0.47);
    if (ed > 0.6 + 0.42 * (cn2 * 0.6 + cn * 0.4)) discard;
    if (p.y > 127. + 30. * vn3(vec3(p.x * 0.045, p.y * 0.1, p.z * 0.045))) discard;       // the tallest lose their tops in the cloud
    alb *= (0.5 + 0.8 * cn) * (0.7 + 0.55 * cn2) * mix(0.5, 1.3, ed) * mix(1., 0.4, back);
    gloss = 0.1; sunK *= 0.2;                           // the ranks stand dark against the seam: the break's light hardly reaches them
  } else if (kind > 26.5) {                           // a far rank of cedars on one long card (colour attribute = metres along, metres up, the rank's number)
    float m = max(spire(vC.x / 14. + vC.z * 17.3, vC.y, vS.y * 0.6, vS.y * 1.36, 14.), spire(vC.x / 19. + vC.z * 31.7 + 0.5, vC.y, vS.y * 0.74, vS.y * 1.62, 19.));
    if (m < 0.5) discard;
    alb = vec3(0.03, 0.075, 0.045) * (0.55 + 0.6 * vn3(vec3(vC.x * 0.21, vC.y * 0.13, vC.z * 9.)));
    gloss = 0.; sunK *= 0.2;
  } else if (kind > 25.5) {                           // the garden's earthen wall, rammed in lifts and streaked by rain, and the tiled cap that sheds water down it
    float sideW = step(abs(n.z), abs(n.x)), al = mix(p.x, p.z, sideW), hh = p.y - (${GY.toFixed(1)}), fwA = fwXZ + fwPy, fwL = mix(fwPx, fwPz, sideW);
    if (abs(n.y) > 0.3) {                             // the cap: round cover tiles running down the slope, moss in the valleys, water sliding over them
      float t = al / 1.6, f = fract(t) - 0.5, ft = floor(t), lodC = 1. - smoothstep(0.3, 1., fwL / 1.6);
      float hump = mix(0.56, 1. - smoothstep(0.18, 0.5, abs(f)), lodC), cu = hh * 0.9 + h11(ft);
      alb *= (0.4 + 0.6 * hump) * mix(1., (0.75 + 0.5 * h21(vec2(ft, floor(cu)))) * (0.7 + 0.3 * smoothstep(0., 0.2, fract(cu))), lodC * (1. - smoothstep(0.2, 0.7, fwA)));
      alb = mix(alb, uMoss * 0.42, smoothstep(0.5, 0.7, vn3(p * 0.3)) * 0.5 * (1. - 0.6 * hump));
      gloss = (0.05 + 0.2 * hump) * (0.5 + 1.2 * vn3(vec3(al * 0.8, hh * 1.4 + uTime * 2.4, 3.)));
      float capSn = uSnow * smoothstep(0.3, 0.55, vn3(p * 0.21 + 2.) + 0.25);
      alb = mix(alb, vec3(0.72, 0.77, 0.82), capSn); gloss *= 1. - capSn;
    } else {
      float reach = 24. - hh, wob = vn3(vec3(al * 0.045, hh * 0.05, 3.));
      float lift = hh / 2.7 + (wob - 0.5) * 0.5, li = floor(lift), lfr = fract(lift);
      float tone = 0.7 + 0.56 * h11(li * 1.7 + 3.1 + floor(al / 61. + 0.5) * 0.37);                // each lift its own earth, in formwork bays
      float lam = vn3(vec3(al * 0.22, hh * 2.6, 1.)), nearK = 1. - smoothstep(0.05, 0.3, fwA);
      float grit = mix(0.5, vn3(vec3(al * 2.3, hh * 2.3, 5.)) * 0.6 + vn3(vec3(al * 7., hh * 7., 2.)) * 0.4, nearK);
      float joint = (1. - smoothstep(0.03, 0.1, min(lfr, 1. - lfr))) * (1. - smoothstep(0.25, 0.9, fwA));
      alb *= tone * (0.7 + 0.55 * lam) * (0.75 + 0.5 * grit) * (1. - 0.4 * joint);
      // rain: the band under the eave always wet, dark tongues running down from it, each its own length; a damp green foot
      float c1 = vn3(vec3(al * 0.31, 2., 7.)), c2 = vn3(vec3(al * 1.4, hh * 0.05, 4.));
      float tongue = smoothstep(0.3, 0.6, c1 * 0.62 + c2 * 0.38) * (1. - smoothstep(3. + 20. * c1, 8. + 26. * c1, reach + (c2 - 0.5) * 6.));
      float wet = clamp(max(tongue, (1. - smoothstep(0.5, 4., reach + (c2 - 0.5) * 2.5)) * 0.85), 0., 1.);
      alb *= 1. - 0.62 * wet;
      float foot = 1. - smoothstep(0.5, 6.5, hh + (vn3(vec3(al * 0.13, 1., 2.)) - 0.5) * 5.);
      alb = mix(alb, uMoss * 0.32 * (0.6 + 0.8 * lam), foot * 0.75);
      // the water itself: bright threads sliding down the wet face, and a faint shiver of the whole sheet
      float tc = al / 0.9, tid = floor(tc), tx = fract(tc) - 0.5 - (h11(tid + 3.3) - 0.5) * 0.6, fwT = fwL / 0.9;
      float thread = (1. - smoothstep(0.03, 0.06 + fwT, abs(tx))) * step(0.45, h11(tid + 9.1))
        * smoothstep(0.5, 0.95, fract(hh * 0.11 + uTime * (0.5 + 0.4 * h11(tid)) + h11(tid + 5.) * 7.)) * (1. - smoothstep(0.15, 0.6, fwT));
      emis += uSky * (0.5 * thread + 0.04 * vn3(vec3(al * 0.5, hh * 0.3 + uTime * 1.6, 3.))) * (1. - smoothstep(2., 14., reach)) * (1. - uSnow);
      gloss = 0.05 + 0.45 * wet;
    }
  } else if (kind > 24.5) {                           // feathers: the sky's light comes through a spread wing, so its underside is pale
    thru = 0.9; gloss = 0.12;
  } else if (kind > 23.5) {                           // a flame behind paper: the one warm thing in the rain
    float fl = sin(uTime * 11. + p.x * 3.1) * sin(uTime * 7.3 + p.z * 2.7) * 0.22 + vn3(vec3(p.xy * 1.7, uTime * 3.1)) * 0.3;
    emis = vC * (0.95 + 0.75 * (0.6 + fl)) * mix(1., 0.5, vMr); alb = vec3(0.); gloss = 0.;
  } else if (kind > 22.5) {                           // February: a skin of ice on the pond (colour attribute x = how freely it may form here)
    // sheets with thin broken edges and dark leads between them; grey-blue and half clear, the cloud and cedars lying in it
    float im = vn3(vec3(p.xz * 0.021, 1.)) * 0.58 + vn3(vec3(p.xz * 0.068 + 3., 4.)) * 0.3 + vn3(vec3(p.xz * 0.29, 7.)) * 0.12 + (vC.x - 1.) * 0.6;
    float e2 = im - 0.47 + (vn3(vec3(p.xz * 1.1, 2.)) - 0.5) * 0.045 + (vn3(vec3(p.xz * 3.7, 5.)) - 0.5) * 0.02;
    float lead = abs(vn3(vec3(p.xz * 0.043 + 11., 2.)) - 0.5) - 0.008 - 0.022 * vn3(vec3(p.xz * 0.017, 9.)) + (vn3(vec3(p.xz * 0.9, 8.)) - 0.5) * 0.012;
    if (e2 < 0. || lead < 0.) discard;
    float thk = smoothstep(0., 0.1, e2) * smoothstep(0., 0.03, lead);
    float crack = (1. - smoothstep(0.003, 0.009, abs(vn3(vec3(p.xz * 0.16 + 5., 3.)) - 0.5))) * (1. - smoothstep(0.1, 0.5, fwXZ));
    float dust = smoothstep(0.5, 0.72, vn3(vec3(p.xz * 0.085 + 2., 6.)) * 0.62 + vn3(vec3(p.xz * 0.8, 1.)) * 0.38) * thk;
    alb = mix(vec3(0.045, 0.07, 0.085), vec3(0.3, 0.37, 0.45), thk) * (0.8 + 0.4 * vn3(vec3(p.xz * 0.45, 3.)));
    alb = mix(alb, vec3(0.56, 0.63, 0.71), max(crack * 0.6, dust * 0.8));
    float Fi = 0.05 + 0.95 * pow(1. - ndv0, 3.6);
    emis += gardenEnv(p, reflect(-v, n), vD) * Fi * (1. - 0.75 * dust) * mix(1., 0.72, thk);
    gloss = 0.;
  } else {                                            // fronds and broad leaves
    alb *= (0.72 + 0.5 * vn3(p * 5.)) * mix(1., 0.6, back);
  }
  if ((kind < 10.5 || kind > 11.5) && (kind < 18.5 || kind > 19.5) && kind < 22.5) {   // snow caps (February)
    float snE = n.y + (vn3(p * 0.5) - 0.5) * 0.4, sn = uSnow * ex * smoothstep(0.3, 0.7, snE);
    // on the moss the snow lies in caps with an edge: bare patches and the cushions' sides stay dark and wet
    if (kind > 5.5 && kind < 6.5) sn = uSnow * ex * smoothstep(0.4, 0.58, snE) * mix(1., 0.1 + 0.9 * smoothstep(0.34, 0.5, vn3(p * 0.16 + 4.)), dome) * mossCap;
    alb = mix(alb, vec3(0.74, 0.79, 0.83) * (0.84 + 0.22 * vn3(p * 1.3)) * snowTint * mix(vec3(0.56, 0.68, 0.9), vec3(1.), smoothstep(0.55, 0.97, n.y)), sn); gloss *= 1. - sn; emis *= 1. - sn;
  }
  float up = mix(n.y * 0.5 + 0.5, 0.5 + 0.5 * abs(n.y), thru), inside = 1. - ex;
  vec3 Lg = vec3(clamp(p.x, -50., 50.), 9., 64.) - p;
  float dg = max(length(Lg), 1e-3); Lg /= dg;
  float Eg = 1. / (1. + dg * dg / 2600.);
  float kd = max(dot(n, Lg) * 0.5 + 0.5, 0.); kd *= kd;
  // indoors the timber is left to fall black: the rain light only grazes it, and the sheen below carries the form
  vec3 light = uSky * inside * (Eg * (kd * 1.0 + 0.4 * (1. - up) + 0.05) + 0.016);
  // the hall: its paper side walls glow, and the room holds a little warm light of its own
  float hall = inside * step(-56.7, p.z), wx = 56. - abs(p.x);
  light += uSky * vec3(1.1, 0.98, 0.82) * hall * (uHallK.x * (0.55 + 0.45 * up) + uHallK.y * (0.25 + 0.75 * max(n.x * sign(p.x), 0.)) / (1. + wx * wx / 900.));
  light += uSky * ex * (0.16 + 0.84 * up * up) + uMoss * ex * (1. - up) * 0.33 * dot(uSky, vec3(0.5));
  light += uSun * ex * sunK * (0.22 + 0.78 * max(dot(n, uSunDir), 0.));
  for (int i = 0; i < 5; i++) {                       // lantern flames
    vec3 dl = uLamps[i].xyz - p; float d2l = dot(dl, dl);
    light += uLampCol * uLamps[i].w / (1.7 + d2l * 0.02) * (0.35 + 0.65 * max(dot(n, dl * inversesqrt(d2l + 1e-3)), 0.));
  }
  // the corridor behind the hall: glow of the court-side paper (brighter where the panels stand open) and of the screens ahead
  float inC = step(p.z, -55.5) * inside;
  vec3 L2 = vec3(uCorr.x - p.x, (8. - p.y) * 0.3, 0.);
  float d2 = max(length(L2), 1e-3); L2 /= d2;
  float E2 = inC * uCorr.y * (0.3 + 0.7 * (1. - smoothstep(uCorr.w - 6., uCorr.w + 6., p.z))) * smoothstep(-174., -160., p.z) / (1. + d2 * d2 / 200.);
  float k2 = max(dot(n, L2) * 0.6 + 0.4, 0.);
  float inV = inC * step(p.z, -166.4);                // the vestibule, lit by its own paper windows
  light += uSky * (E2 * (k2 * k2 + 0.03) * 0.22 + inC * uCorr.z * (0.018 + 0.03 * abs(n.x) + 0.05 * max(n.y, 0.)) + inV * uCorr.z * (0.04 + 0.2 * max(n.y, 0.) + 0.09 * abs(n.x)));
  vec3 col = alb * light;
  float f0 = kind > 6.5 && kind < 7.5 ? 0.3 : 0.04;
  float F = f0 + (1. - f0) * pow(clamp(1. - dot(n, v), 0., 1.), 2.1);
  vec3 r = reflect(-v, n);
  float seeO = inside * smoothstep(0.25, 0.95, dot(r, Lg)) * min(Eg * 3., 1.);
  float seeS = ex * smoothstep(-0.15, 0.45, r.y);
  float seeC = E2 * 2.2 * smoothstep(0.35, 0.95, dot(r, L2));
  // the gap ahead lies along the polished boards as a streak of its own colour; edges turned to it take a pearl rim
  float gapK = exp(-p.x * p.x / 5.), seeG = inC * uCorr.z * smoothstep(0.8, 0.995, r.z) * mix(0.3, 1.5, gapK)
    * (0.5 + 1.0 * vn3(vec3(p.x * 1.7, p.z * 0.2 - uTime * 1.2, uTime * 0.8)));     // the gap's light shivers on the boards as the rain crosses it
  col += gloss * F * (uSky * (seeO * mix(0.9, 0.42, hall) * mix(vec3(1.), vec3(1.12, 0.96, 0.74), hall) + seeS * 0.7 * mix(1., 0.15, 1. - glintK) * skyGl + seeC) + mix(uSky, uGap, gapK * 0.85) * seeG * 0.8) + uSky * gloss * inC * uCorr.z * 0.16 * pow(1. - ndv0, 4.) + emis;
  float sg = max(dot(r, uSunDir), 0.); sg *= sg; sg *= sg;
  col += uSun * sunK * gloss * sg * sg * 1.3 * glintK;                                 // wet things glint where the light comes down
  // lacquer gives back the garden, and only a ghost of the room: the ceiling's double fades with distance from the opening
  col *= mix(1., mix(0.86, 0.4 * mix(1., 0.16 + 0.84 * smoothstep(-36., 38., p.z), smoothstep(13., 21., p.y)), inside), vMr);
  float mw = vS.w < -1.5 ? -2. - vS.w : vS.w;          // (a value below -1.5 is the coded weight, -2.1 to -2.6, of a thing deeper in the mist: see MW)
  float md = uMist * vD * ((kind > 19.5 && kind < 20.5) || kind > 25.5 ? 1. + clamp(mw, -0.9, 0.6) : 1.);     // the near rank of cedars stands dark out of the mist; the woods behind lie deeper in it
  col = mix(col, uMistCol, 1. - exp(-md * md));
  col = mix(col, uMistCol * 1.06, step(26.5, kind) * clamp(mw, 0., 0.6) * 1.25);      // the woods behind the near rank pale into the mist's own colour
  col = mix(col, mix(uMistCol, uStrata, 0.4 + 0.55 * smoothstep(52., 100., p.y)), smoothstep(60., 128., p.y) * 0.88 * step(0.5, ex));          // tall things lose their tops in the dark deck
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

function fogged(uniforms) { return Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), uniforms); }

// ---------------------------------------------------------------- mirror patch (see header)
const MIR_VS_DECL = /* glsl */`
uniform mat4 uMirInv; uniform vec4 uMirWet;
varying vec4 vMirP;
`;
const MIR_VS_MAIN = /* glsl */`
  {
    float mrW = gl_Position.w;
    vec3 mrV = vec3((gl_Position.x + projectionMatrix[2][0] * mrW) / projectionMatrix[0][0], (gl_Position.y + projectionMatrix[2][1] * mrW) / projectionMatrix[1][1], -mrW);
    vec3 mrL = (uMirInv * vec4((mrV - viewMatrix[3].xyz) * mat3(viewMatrix), 1.)).xyz;
    float mrOn = determinant(mat3(modelMatrix)) < 0. ? 1. : 0.;
    vMirP = vec4(mrL, mrOn);
    if (mrOn > 0.5) {
      vec3 mrC = (uMirInv * vec4(cameraPosition, 1.)).xyz;
      float mrT = mrC.y / max(mrC.y - mrL.y, 1e-3);
      vec2 mrH = mix(mrC.xz, mrL.xz, clamp(mrT, 0., 1.));
      float mrK = smoothstep(uMirWet.x, uMirWet.y, mrH.y) * uMirWet.z * mrW;
      gl_Position.x += sin(mrH.x * 1.9 + mrH.y * 0.7 + uMirWet.w * 2.3) * mrK;
      gl_Position.y += sin(mrH.x * 1.3 - uMirWet.w * 1.7) * mrK * 1.6;
    }
  }
`;
const MIR_FS_DECL = /* glsl */`
uniform mat4 uMirInv; uniform vec4 uMirRect;
varying vec4 vMirP;
`;
const MIR_FS_MAIN = /* glsl */`
  if (vMirP.w > 0.5) {
    if (vMirP.y > -0.01) discard;
    vec3 mrC = (uMirInv * vec4(cameraPosition, 1.)).xyz;
    if (mrC.y < 0.01) discard;
    vec2 mrH = mix(mrC.xz, vMirP.xz, mrC.y / max(mrC.y - vMirP.y, 1e-4));
    if (mrH.x < uMirRect.x || mrH.y < uMirRect.y || mrH.x > uMirRect.z || mrH.y > uMirRect.w) discard;
  } else if (vMirP.y < -0.01) {
    vec3 mrC = (uMirInv * vec4(cameraPosition, 1.)).xyz;
    if (mrC.y > 0.01) {
      vec2 mrH = mix(mrC.xz, vMirP.xz, mrC.y / max(mrC.y - vMirP.y, 1e-4));
      if (mrH.x > uMirRect.x - 0.08 && mrH.y > uMirRect.y - 0.08 && mrH.x < uMirRect.z + 0.08 && mrH.y < uMirRect.w + 0.08) discard;
    }
  }
`;
function patchMirror(material, MU) {
  if (!material || material.userData.mossMirror) return material;
  material.userData.mossMirror = true;
  const prev = material.onBeforeCompile, ownKey = Object.prototype.hasOwnProperty.call(material, 'customProgramCacheKey');
  const prevKey = material.customProgramCacheKey, prevSrc = prev ? prev.toString() : '';
  material.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(this, shader, renderer);
    shader.uniforms.uMirInv = MU.uMirInv; shader.uniforms.uMirRect = MU.uMirRect; shader.uniforms.uMirWet = MU.uMirWet;
    const vs = shader.vertexShader, end = vs.lastIndexOf('}');
    shader.vertexShader = MIR_VS_DECL + vs.slice(0, end) + MIR_VS_MAIN + vs.slice(end);
    shader.fragmentShader = MIR_FS_DECL + shader.fragmentShader.replace(/void\s+main\s*\(\s*(void)?\s*\)\s*\{/, (m) => m + MIR_FS_MAIN);
  };
  material.customProgramCacheKey = function () { return (ownKey ? prevKey.call(this) : prevSrc) + '|mossMirror'; };
  material.needsUpdate = true;
  return material;
}

// ---------------------------------------------------------------- floor (mirror base + lacquer film), sky shell
const FLOOR_VS = /* glsl */`
uniform mat4 uInv; varying vec3 vP, vV;
#include <fog_pars_vertex>
void main(){
  vP = position; vV = (uInv * vec4(cameraPosition, 1.)).xyz - position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BASE_FS = /* glsl */`
uniform float uTime; varying vec3 vP, vV;
${NOISE}
${SKYFN}
void main(){
  vec3 v = normalize(vV + vec3(0., 1e-5, 0.));
  gl_FragColor = vec4(rainSky(vec3(-v.x, abs(v.y), -v.z)), 1.);
}`;
const FILM_FS = /* glsl */`
uniform vec3 uSky, uLacquer, uLeafCol, uLeafCol2, uStreak, uLampP, uLampCol; uniform float uTime, uLeafK, uRing;
varying vec3 vP, vV;
#include <fog_pars_fragment>
${NOISE}
void main(){
  vec3 v = normalize(vV + vec3(0., 1e-5, 0.));
  float fr = pow(1. - clamp(v.y, 0., 1.), 2.4);
  float a = mix(0.86, 0.15, fr);
  // boards: along z in the hall, along x on the veranda
  float ver = step(40., vP.z);
  vec2 bq = mix(vec2(vP.x / 2.4, vP.z), vec2(vP.z / 2., vP.x), ver);
  float id = floor(bq.x), fx = fract(bq.x), wx = fwidth(bq.x);
  float bz = (bq.y + h11(id) * 30.) / 30., fz = fract(bz), wz = fwidth(bz);
  float seam = (1. - smoothstep(0., wx * 1.2 + 0.006, min(fx, 1. - fx))) * (1. - smoothstep(0.06, 0.25, wx));
  seam = max(seam, (1. - smoothstep(0., wz * 1.2 + 0.0005, min(fz, 1. - fz))) * (1. - smoothstep(0.004, 0.02, wz)));
  float sill = 1. - smoothstep(0.12, 0.22, abs(abs(vP.z - 40.) - 0.55));
  float bt = h21(vec2(id, floor(bz)));
  float haze = vn3(vec3(vP.xz * 0.07, 1.));
  // ring film where blown rain wets the outer edge
  float zone = smoothstep(46., 55.5, vP.z) * uRing;
  vec2 rq = vP.xz / 2.6, rid = floor(rq);
  vec2 rf = fract(rq) - 0.5 - (vec2(h21(rid), h21(rid + 4.4)) - 0.5) * 0.6;
  float rph = fract(uTime * 0.7 + h21(rid + 1.9));
  float ring = (1. - smoothstep(0., 0.1, abs(length(rf) * 2.6 - rph * 1.2))) * (1. - rph) * zone * step(0.5, h21(rid + 6.));
  // stuck leaves
  vec2 lq = vP.xz / 7., lid = floor(lq), lf = fract(lq) - 0.5;
  float lh = h21(lid + 17.);
  lf -= (vec2(h21(lid + 2.1), h21(lid + 8.7)) - 0.5) * 0.7;
  float la = atan(lf.y, lf.x + 1e-5) + lh * 6.283, lr = length(lf) * 7., lw = fwidth(vP.x) + fwidth(vP.z);
  float ledge = 0.13 + 0.42 * pow(abs(cos(la * 2.5)), 2.2);
  float leaf = (1. - smoothstep(ledge - lw - 1e-4, ledge + lw + 1e-4, lr)) * step(lh, uLeafK * mix(0.03, 0.3, smoothstep(-30., 56., vP.z)));
  float gl = 1. / (1. + (64. - vP.z) * (64. - vP.z) / 2600.);
  vec3 lac = uLacquer * (0.6 + 0.8 * bt) * uSky * 7.5 * (0.3 + 0.7 * gl);
  a = clamp(a + (bt - 0.5) * 0.06 + zone * 0.1 * haze + ring * 0.45, 0.1, 1.);
  a = mix(a, 0.96, max(seam * 0.7, sill * 0.9));
  vec3 col = lac + uSky * (0.008 + 0.03 * haze) * fr * gl / a + uSky * ring * 0.26;
  // The lacquer is polished, not perfect: beyond where it mirrors the opening exactly, the garden's light still lies along it
  // as a long soft streak running toward us, cut by the shadows of the posts and shivering with the rain
  vec3 rr = vec3(-v.x, v.y, -v.z);
  float tz = (56. - vP.z) / max(rr.z, 0.02), yh = rr.y * tz, xh = vP.x + rr.x * tz, over = max(yh - 15., 0.);
  float post = abs(fract((xh - 8.) / 16. + 0.5) - 0.5) * 16.;
  float strk = exp(-over / 30.) * smoothstep(0., 9., over) * step(0.02, rr.z) * (1. - smoothstep(48., 57., abs(xh))) * (0.3 + 0.7 * smoothstep(0.7, 3.2, post))
    * (0.5 + 0.8 * vn3(vec3(xh * 0.12, vP.z * 0.05, 2. + uTime * 0.07))) * (0.8 + 0.4 * vn3(vec3(vP.x * 1.3, vP.z * 0.11 - uTime * 0.4, 5.))) * (1. - ver);
  // and the paper lamp lays a warm glint from its double toward us
  vec3 camL = vP + vV;
  vec2 Lh = uLampP.xz - camL.xz, Ph = vP.xz - camL.xz;
  float dL = max(length(Lh), 1e-3); vec2 dl = Lh / dL;
  float da = dot(Ph, dl) - dL * camL.y / max(camL.y + uLampP.y, 1e-3), pe = Ph.x * dl.y - Ph.y * dl.x, gw = 0.5 + 0.04 * abs(da);
  float glint = exp(-pe * pe / (gw * gw)) * exp(-abs(da) / mix(15., 4., step(0., da))) * step(0.01, camL.y) * (0.75 + 0.5 * vn3(vec3(vP.xz * 0.8, uTime * 2.1)));
  col += (uStreak * strk + uLampCol * glint * 0.65) / a;
  col = mix(col, mix(uLeafCol, uLeafCol2, fract(lh * 37.)) * uSky * (0.12 + 0.5 * gl) + uSky * 0.05 * fr, leaf);
  a = mix(a, 1., leaf);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;
const SHELL_FS = /* glsl */`
uniform float uTime; varying vec3 vP;
${NOISE}
${SKYFN}
void main(){
  vec3 d = normalize(vP + vec3(0., 1e-3, 0.));
  vec3 c = rainSky(d);
  c = mix(uHor * 0.92, c, smoothstep(-0.06, 0.03, d.y));
  gl_FragColor = vec4(c, 1.);
}`;

// ---------------------------------------------------------------- maple sprays (leaf cut-outs), falling water, smoke, birds
const LEAF_VS = /* glsl */`
attribute vec3 color; attribute vec3 aCard;
uniform float uTime;
varying vec2 vUv; varying vec3 vC, vLP; varying float vD, vSeed, vUp, vCells;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  vLP = position;
  float ph = aCard.y, t = fract(uTime * 0.21 + ph);
  float dip = sin(t * 24.) * exp(-t * 7.) * 0.9;
  p.y += (sin(uTime * 1.1 + ph * 6.3) * 0.34 - dip) * aCard.x;
  p.x += sin(uTime * 0.8 + ph * 9.) * 0.26 * aCard.x;
  vUv = uv; vC = color; vSeed = aCard.z; vUp = normal.y; vCells = normal.x;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  vD = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FS = /* glsl */`
uniform vec3 uSky, uMistCol, uSun; uniform float uMist;
varying vec2 vUv; varying vec3 vC, vLP; varying float vD, vSeed, vUp, vCells;
#include <fog_pars_fragment>
${NOISE}
${SUNFN}
vec2 leafCell(vec2 g, float seed){
  vec2 id = floor(g), f = fract(g) - 0.5;
  float hh = h21(id + seed);
  f -= (vec2(h21(id + seed + 1.3), h21(id + seed + 7.1)) - 0.5) * 0.4;
  float ang = atan(f.y, f.x + 1e-5) + hh * 6.283;
  return vec2(step(length(f), 0.2 + 0.3 * pow(abs(cos(ang * 2.5)), 0.7)) * step(0.16, hh), hh);
}
void main(){
  vec2 g = vUv * vCells;
  float lod = smoothstep(0.1, 0.3, sqrt(length(dFdx(g)) * length(dFdy(g))));
  vec2 l1 = leafCell(g, vSeed), l2 = leafCell(g + 0.5, vSeed + 31.);
  float blob = vn3(vec3(vUv * 4. + vSeed, 1.)) * 0.6 + vn3(vec3(vUv * 13. + vSeed, 5.)) * 0.4, hh = mix(l1.x > 0.5 ? l1.y : l2.y, 0.3 + 0.5 * blob, lod);
  float rim = length(vUv - 0.5) * 2. + (vn3(vec3(vUv * 5. + vSeed, 3.)) - 0.5) * 0.6 + (vn3(vec3(vUv * 19. + vSeed, 7.)) - 0.5) * 0.3;
  if (mix(max(l1.x, l2.x), step(0.4, blob), lod) < 0.5 || rim > 0.92) discard;
  vec3 col = vC * (0.5 + 0.9 * hh) * uSky * (0.72 + 0.4 * abs(vUp));
  float sunK = sunPool(vLP.xz - uSunA.xy * (vLP.y - (${GY.toFixed(1)})));
  col += vC * (0.45 + 0.75 * hh) * uSun * sunK * vec3(1.15, 1.05, 0.7);              // a leaf with the light behind it is lit from inside
  float md = uMist * vD;
  col = mix(col, uMistCol, 1. - exp(-md * md));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// stretched billboards that fall: eave beads (accelerating), fine rain (steady), snow flakes (slow, drifting)
const FALL_VS = /* glsl */`
attribute vec4 aO, aQ; attribute vec2 aK;
uniform float uTime, uViewH;
varying vec2 vQ; varying vec3 vK; varying float vSunK;
#include <fog_pars_vertex>
${NOISE}
${SUNFN}
void main(){
  float t = fract(uTime * aQ.x + aQ.y);
  float bead = step(0.5, aK.y) * (1. - step(1.5, aK.y)), flake = step(1.5, aK.y);
  vec3 c = aO.xyz - vec3(0., aO.w * mix(t, t * t, bead), 0.);
  c.x += sin(uTime * 0.8 + aQ.y * 40.) * 1.4 * flake; c.z += cos(uTime * 0.6 + aQ.y * 23.) * 1.1 * flake;
  float len = aQ.w * mix(1., 0.55 + 1.3 * t, bead);
  vec4 mvPosition = viewMatrix * (modelMatrix * vec4(c, 1.));
  vec3 upv = normalize(mat3(viewMatrix) * (modelMatrix * vec4(0., 1., 0., 0.)).xyz);
  vec2 sd = normalize(vec2(upv.y, -upv.x) + vec2(1e-5, 0.));
  mvPosition.xyz += upv * (position.y * len);
  vec4 cp = projectionMatrix * mvPosition;
  // never fat: at least 1.5 px, at most a couple of pixels for rain (more for beads and flakes), and the nearest fade out
  float px = cp.w / max(uViewH * 0.5 * projectionMatrix[1][1], 1.);
  float w = min(max(aQ.z, 1.5 * px), mix(2.1, mix(6., 11., flake), max(bead, flake)) * px);
  float nearK = smoothstep(mix(6., 2.5, max(bead, flake)), mix(20., 8., max(bead, flake)), cp.w);
  cp.xy += sd * vec2(projectionMatrix[0][0], projectionMatrix[1][1]) * (position.x * w);
  gl_Position = cp;
  vQ = vec2(position.x, position.y + 0.5);
  vSunK = sunPool(c.xz - uSunA.xy * (c.y - (${GY.toFixed(1)})));
  vK = vec3(aK.x * min(aQ.z / w, 1.) * nearK * smoothstep(0., 0.04, t) * (1. - smoothstep(0.96, 1., t)), bead, flake);
  #include <fog_vertex>
}`;
const FALL_FS = /* glsl */`
uniform vec3 uSky, uSun;
varying vec2 vQ; varying vec3 vK; varying float vSunK;
#include <fog_pars_fragment>
void main(){
  float ac = 1. - vQ.x * vQ.x * 4.;
  float al = mix(sin(clamp(vQ.y, 0., 1.) * 3.14159), (1. - smoothstep(0.6, 1., vQ.y)) * (0.07 + 0.93 * (1. - smoothstep(0.1, 0.38, vQ.y))) * smoothstep(0., 0.06, vQ.y), vK.y);
  float rr = length(vec2(vQ.x * 2., vQ.y * 2. - 1.));
  float a = mix(clamp(ac, 0., 1.) * clamp(al, 0., 1.), 1. - smoothstep(0.2, 1., rr), vK.z) * vK.x;
  gl_FragColor = vec4(uSky * (mix(0.98, 2.4, vK.y) + 0.45 * vK.z) + uSun * vSunK * 1.5, clamp(a * mix(0.42, 0.9, max(vK.y, vK.z)) * (1. + 0.9 * vSunK), 0., 1.));
  #include <fog_fragment>
}`;
const SHAFT_VS = /* glsl */`
varying vec3 vP; varying float vD;
void main(){
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SHAFT_FS = /* glsl */`
uniform vec3 uSun; uniform float uTime, uShaft;
varying vec3 vP; varying float vD;
${NOISE}
${SUNFN}
void main(){
  float h = vP.y - (${GY.toFixed(1)});
  vec2 foot = vP.xz - uSunA.xy * h;
  float k = sunPool(foot);
  // the light comes down in separate rays: fine streaks that keep their place along the slant, shivering as the rain crosses them
  float ray = vn3(vec3(foot * 0.21, uTime * 0.12)) * 0.6 + vn3(vec3(foot * 0.67 + 9., uTime * 0.22)) * 0.4;
  float a = k * (0.25 + 1.5 * smoothstep(0.35, 0.75, ray)) * smoothstep(0., 9., h) * (1. - smoothstep(48., 100., h)) * (0.6 + 0.4 * smoothstep(0., 60., h));
  a *= smoothstep(7., 30., vD) * (1. - smoothstep(330., 560., vD)) * uShaft;
  gl_FragColor = vec4(uSun * a, 1.);
}`;
// one upright ribbon for each staged pool of light, turned about the light's own slant to face the eye: a soft-edged shaft
// that comes down out of the deck onto its pool, in fine rays that shiver as the rain crosses them
const BEAM_VS = /* glsl */`
attribute float aIdx;
uniform mat4 uInv; uniform vec4 uSunA, uSunP[6];
varying vec4 vB; varying float vD;
void main(){
  vec4 sp = aIdx < 0.5 ? uSunP[0] : (aIdx < 1.5 ? uSunP[1] : (aIdx < 2.5 ? uSunP[2] : (aIdx < 3.5 ? uSunP[3] : (aIdx < 4.5 ? uSunP[4] : uSunP[5]))));
  float mir = determinant(mat3(modelMatrix)) < 0. ? -1. : 1.;
  vec3 camL = (uInv * vec4(cameraPosition, 1.)).xyz; camL.y *= mir;
  vec3 ax = normalize(vec3(uSunA.x, 1., uSunA.y));
  vec3 c = vec3(sp.x, ${GY.toFixed(1)}, sp.y) + ax * (position.y * 132.);
  vec3 sd = cross(ax, camL - c);
  sd /= max(length(sd), 1e-3);
  vec4 mv = modelViewMatrix * vec4(c + sd * (position.x * sp.z * 0.62), 1.);
  vD = -mv.z;
  vB = vec4(position.x, position.y, sp.w * step(-9000., sp.y), aIdx);
  gl_Position = projectionMatrix * mv;
}`;
const BEAM_FS = /* glsl */`
uniform vec3 uSun; uniform float uTime, uBeam;
varying vec4 vB; varying float vD;
${NOISE}
void main(){
  float x = vB.x, t = vB.y;
  float g = exp(-x * x * 3.4) * (1. - smoothstep(0.72, 1., abs(x)));
  float ray = vn3(vec3(x * 5. + vB.w * 17.3, uTime * 0.11, 1.)) * 0.6 + vn3(vec3(x * 13. + vB.w * 5.1, uTime * 0.19, 5.)) * 0.4;
  float a = g * (0.45 + 1.15 * smoothstep(0.3, 0.72, ray)) * smoothstep(0., 0.05, t) * (1. - smoothstep(0.3, 0.85, t)) * (0.5 + 0.5 * smoothstep(0., 0.28, t));
  a *= smoothstep(9., 36., vD) * (1. - smoothstep(380., 620., vD)) * vB.z * uBeam;
  gl_FragColor = vec4(uSun * a, 1.);
}`;
const SMOKE_VS = /* glsl */`
uniform float uTime, uViewH; uniform vec3 uBase;
varying vec3 vQ;
void main(){
  float t = position.y, s = position.x, w1 = t * t;
  vec3 c = uBase + vec3(0., t * 15., 0.);
  c.x += sin(t * 5. - uTime * 0.7) * 0.9 * w1 + sin(t * 13. - uTime * 1.3) * 0.5 * w1 * t;
  c.z += cos(t * 4.3 - uTime * 0.6) * 0.8 * w1 + sin(t * 9. - uTime * 1.1 + 2.) * 0.5 * w1 * t + 1.5 * w1;
  vec4 mv = modelViewMatrix * vec4(c, 1.);
  float hw = mix(0.05, 0.8, w1);
  float w = max(hw, 1.6 * (-mv.z) / max(uViewH * 0.5 * projectionMatrix[1][1], 1.));
  mv.x += s * w;
  vQ = vec3(s, t, hw / w);
  gl_Position = projectionMatrix * mv;
}`;
const SMOKE_FS = /* glsl */`
uniform vec3 uSky; varying vec3 vQ;
void main(){
  float a = (1. - vQ.x * vQ.x) * pow(1. - clamp(vQ.y, 0., 1.), 1.3) * smoothstep(0., 0.03, vQ.y) * 0.55 * vQ.z;
  gl_FragColor = vec4(uSky * 0.9, clamp(a, 0., 1.));
}`;
const BIRD_VS = /* glsl */`
attribute vec3 color; attribute vec4 surf; attribute float aPhase;
uniform float uTime, uFlap;
varying vec3 vC, vN;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float a = (sin(uTime * 17. + aPhase) * 0.75 + 0.12) * uFlap;
  p.y += abs(p.x) * sin(a) * surf.w; p.x *= mix(1., cos(a), surf.w) * mix(1., mix(0.2, 1., uFlap), step(0.001, surf.w));
  vC = color; vN = mat3(instanceMatrix) * normal;
  vec4 mvPosition = modelViewMatrix * (instanceMatrix * vec4(p, 1.));
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FS = /* glsl */`
uniform vec3 uSky; varying vec3 vC, vN;
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  gl_FragColor = vec4(vC * uSky * (0.4 + 0.6 * (n.y * 0.5 + 0.5)), 1.);
  #include <fog_fragment>
}`;

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  let rng = ctx.rng.fork ? ctx.rng.fork('mirror-hall') : ctx.rng;                 // let: the second pass (kit.useRng) deals from a stream of its own
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PAL).map(C);
  const sr = rng();
  const season = opts.season || (sr < 0.5 ? 'june' : sr < 0.76 ? 'november' : 'february');
  const hour = opts.hour || (ctx.vary && ctx.vary.hour && ctx.vary.hour !== 'any' ? ctx.vary.hour : 'day');
  const side = opts.side === -1 || opts.side === 1 ? opts.side : rng.sign();
  const rainW = clamp(opts.rain ?? rng.range(0.65, 1.3), 0.3, 1.6);
  const withGarden = opts.garden !== false, withSky = opts.sky !== false, withRain = opts.rainField !== false;
  const snow = season === 'february' ? 1 : 0;

  // ---- sky and light
  const pearl = pal[5];
  const SKY = {
    day: [pearl.clone().multiplyScalar(1.02), mixC(pearl, C('#a3b7b6'), 0.65).multiplyScalar(0.8)],
    dawn: [mixC(pearl, C('#8fa9d4'), 0.5).multiplyScalar(0.8), mixC(pearl, C('#9fb4c4'), 0.7).multiplyScalar(0.7)],
    golden: [mixC(pearl, C('#ece4c6'), 0.45).multiplyScalar(0.98), mixC(pearl, C('#b4bea4'), 0.6).multiplyScalar(0.72)],      // thin cloud: warmer light, not more of it
    night: [C('#667a9c').multiplyScalar(0.36), C('#52668a').multiplyScalar(0.3)],
  }[hour] || null;
  const zen = SKY ? SKY[0] : pearl.clone(), hor = SKY ? SKY[1] : pearl.clone().multiplyScalar(0.85);
  if (season === 'february') { zen.lerp(C('#d5dde6'), 0.3); hor.lerp(C('#6f7f96'), 0.42); }                  // snow light under a slate sky
  if (season === 'november') { zen.multiplyScalar(0.94); hor.lerp(C('#b0b4a8'), 0.3); }
  const SH = {
    uTime: { value: 0 }, uInv: { value: new THREE.Matrix4() }, uSky: { value: zen.clone() }, uZen: { value: zen }, uHor: { value: hor },
    uMistCol: { value: hor.clone() }, uMist: { value: opts.mist ?? (withSky ? 0.0032 : 0) }, uSnow: { value: snow },
    uMoss: { value: season === 'february' ? mixC(pal[3], C('#5f7a52'), 0.5) : pal[3].clone() }, uMossRim: { value: pal[4].clone() }, uViewH: { value: 450 }, uCorr: { value: new THREE.Vector4(0, 0, 0, -400) },
    uFlap: { value: 1 }, uShade: { value: null }, uPatch: { value: new THREE.Vector4(0, 0, 0, 0) }, uPond: { value: new THREE.Vector4(side, opts.pondScene ? 1 : 0, 0, 0) }, uPine: { value: mixC(pal[2], pal[3], 0.4).multiplyScalar(1.5) }, uGap: { value: zen.clone() },
  };
  // the break in the cloud: where it stands, how strong its light is at this hour, and the look of the sky round it
  const sunDir = new THREE.Vector3(-0.5 * side, 1, 0.45).normalize(), lum = (zen.r + zen.g + zen.b) / 3 * 1.15;
  // [colour of the light, its strength, how much of the garden the pools take, [seam, darkness of the deck, glow of the break]]
  const HK = { day: ['#fff3da', 0.9, 1, [1, 0.96, 0.55]], dawn: ['#dfe9ff', 0.8, 0.85, [0.8, 1, 0.4]], golden: ['#ffe6b4', 1.1, 1.15, [1.2, 1.12, 0.6]], night: ['#9db4ff', 0.5, 0.6, [0.55, 0.9, 0.3]] }[hour] || ['#fff3da', 0.9, 1, [1, 0.92, 0.55]];
  Object.assign(SH, {
    uSunDir: { value: sunDir }, uSunA: { value: new THREE.Vector4(sunDir.x / sunDir.y, sunDir.z / sunDir.y, HK[2], 0) },
    uSunP: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -9999, 1, 0)) }, uSun: { value: C(HK[0]).multiplyScalar(lum * HK[1] * 1.6) },
    uSeam: { value: C(HK[0]).multiplyScalar(lum * 1.02) }, uStrata: { value: mixC(hor, C('#3f5482'), 0.84).multiplyScalar(0.8) }, uSkyK: { value: new THREE.Vector4(HK[3][0], HK[3][1], HK[3][2], side) },
    uLamps: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, -9999, 0, 0)) }, uLampCol: { value: C('#ffb662').multiplyScalar(hour === 'night' ? 0.8 : 1.25) },
    uHallK: { value: new THREE.Vector3(hour === 'night' ? 0.035 : 0.075, hour === 'night' ? 0.34 : 0.5, 0) }, uShaft: { value: 0.035 }, uBeam: { value: 0.2 },
  });
  const MU = { uMirInv: SH.uInv, uMirRect: { value: new THREE.Vector4(-HW + 0.03, ZB + 0.03, HW - 0.03, ZV - 0.03) }, uMirWet: { value: new THREE.Vector4(46, 56, 0.0035, 0) } };
  const pick = (...k) => { const o = {}; for (const n of k) o[n] = SH[n]; return o; };

  await ctx.yield();
  const object = new THREE.Group(); object.name = 'mirror-hall';
  const solidMat = new THREE.ShaderMaterial({ uniforms: fogged(pick('uTime', 'uInv', 'uSky', 'uMistCol', 'uMist', 'uSnow', 'uMoss', 'uMossRim', 'uCorr', 'uPond', 'uPine', 'uGap', 'uShade', 'uSun', 'uSunDir', 'uSunA', 'uSunP', 'uSeam', 'uStrata', 'uLamps', 'uLampCol', 'uHallK', 'uPatch')), vertexShader: SOLID_VS, fragmentShader: SOLID_FS, fog: true, side: THREE.DoubleSide });

  // ---- colours
  const timber = mixC(pal[0], C('#7d5632'), 0.8), timberB = mixC(pal[0], C('#8c6439'), 0.82), timberD = mixC(pal[0], C('#4b3421'), 0.7), ceilC = C('#6e563a');
  const plaster = C('#aab2ab'), stone = C('#5a605a'), tileC = C('#2e3539'), bronze = C('#6a5f45'), pebble = C('#7d837f');
  const accent = season === 'november' ? C('#b8281c') : pal[6].clone();
  const jit = (a = 0.8, b = 1.2) => rng.range(a, b);

  const bi = makeBatch(68000);      // reflected in the floor
  const bo = makeBatch(66000);      // never seen in the floor (roof top, plinth, gutter)
  await ctx.yield();

  // ---------------------------------------------------------------- walls
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 7; i++) bi.add(chamferBox(1.8, CEIL, 1.8, 0.2), M(sx * HW, CEIL / 2, ZB + i * 16), timber, [K.WOODY, 0.6, 0], { jit: jit() });
    bi.add(chamferBox(1.2, 0.7, 96, 0.1), M(sx * (HW - 0.2), 0.36, -8), timber, [K.WOODZ, 0.6, 0]);
    bi.add(chamferBox(1.5, 1.4, 96, 0.15), M(sx * (HW - 0.1), 18.7, -8), timber, [K.WOODZ, 0.6, 0]);
    bi.add(chamferBox(1.5, 1.4, 96, 0.15), M(sx * (HW - 0.1), 25.2, -8), timber, [K.WOODZ, 0.5, 0]);
    bi.add(box(0.3, 5.2, 96), M(sx * (HW + 0.3), 22, -8), plaster, [K.PLASTER, 0.04, 0]);
    for (let i = 0; i < 12; i++) bi.add(box(0.5, 5.1, 0.5), M(sx * (HW + 0.05), 21.95, ZB + 4 + i * 8), timber, [K.WOODY, 0.5, 0]);
    await ctx.yield();
    // ink-washed paper leaves, two to a bay
    for (let i = 0; i < 12; i++) {
      const z0 = ZB + i * 8, idx = (sx < 0 ? 0 : 12) + i;
      bi.add(new THREE.PlaneGeometry(8, 17.3, 2, 2), M(sx * (HW - 0.45), 0.7 + 8.65, z0 + 4, 0, -sx * PI / 2, 0), timber, [K.PAPER, 0.05, 0], {
        fn: (k, x, y, z, v, Cc) => { Cc[k * 3] = clamp((z - z0) / 8, 0, 1); Cc[k * 3 + 1] = clamp((y - 0.7) / 17.3, 0, 1); Cc[k * 3 + 2] = idx / 32; },
      });
    }
    bo.add(box(0.4, 25, 97), M(sx * (HW + 0.7), 7.5, -8), plaster, [K.PLASTER, 0.04, 0.6], { grad: [-5, 20, 0.75, 1] });
    for (let i = 0; i < 7; i++) bo.add(chamferBox(1.2, 25, 1.9, 0.15), M(sx * (HW + 0.75), 7.5, ZB + i * 16), timber, [K.WOODY, 0.5, 0.6]);
    await ctx.yield();
  }
  // back wall with the doorway (x -8..8, 18 m high)
  for (const x of [-40, -24, -8, 8, 24, 40]) bi.add(chamferBox(1.8, CEIL, 1.8, 0.2), M(x, CEIL / 2, ZB), timber, [K.WOODY, 0.6, 0], { jit: jit() });
  bi.add(chamferBox(112, 1.4, 1.5, 0.15), M(0, 18.7, ZB + 0.1), timber, [K.WOODX, 0.6, 0]);
  bi.add(chamferBox(112, 1.4, 1.5, 0.15), M(0, 25.2, ZB + 0.1), timber, [K.WOODX, 0.5, 0]);
  bi.add(box(112, 5.2, 0.3), M(0, 22, ZB - 0.3), plaster, [K.PLASTER, 0.04, 0]);
  const backOpen = !!opts.backOpen;
  for (const x0 of [-56, -40, -24, 8, 24, 40]) {
    if (backOpen && (x0 === -24 || x0 === 8)) continue;
    bi.add(box(14.4, 18, 0.5), M(x0 + 8, 9, ZB - 0.25), timberB, [K.WOODY, 0.35, 0], { jit: jit(0.75, 1.15) });
    for (let k = 1; k < 4; k++) bi.add(chamferBox(0.4, 18, 0.3, 0.06), M(x0 + 0.9 + k * 3.55, 9, ZB + 0.12), timber, [K.WOODY, 0.5, 0]);
    bi.add(chamferBox(14.4, 0.7, 0.9, 0.1), M(x0 + 8, 0.36, ZB + 0.2), timber, [K.WOODX, 0.6, 0]);
    bi.add(chamferBox(14.4, 0.5, 0.5, 0.08), M(x0 + 8, 9.2, ZB + 0.15), timber, [K.WOODX, 0.5, 0]);
  }
  const bw = backOpen ? 32 : 48;
  bo.add(box(bw, 25, 0.4), M(-56 + bw / 2, 7.5, ZB - 0.75), plaster, [K.PLASTER, 0.04, 0.6], { grad: [-5, 20, 0.75, 1] });
  bo.add(box(bw, 25, 0.4), M(56 - bw / 2, 7.5, ZB - 0.75), plaster, [K.PLASTER, 0.04, 0.6], { grad: [-5, 20, 0.75, 1] });
  bo.add(box(backOpen ? 48 : 16, 2, 0.4), M(0, 19, ZB - 0.75), plaster, [K.PLASTER, 0.04, 0.6]);
  if (backOpen) {                                      // lintel over the three open bays, a sill to step over
    bi.add(chamferBox(48, 1.3, 1.5, 0.15), M(0, 14.65, ZB), timber, [K.WOODX, 0.7, 0.1]);
    bi.add(chamferBox(46.4, 0.16, 0.9, 0.05), M(0, 0.05, ZB), timberD, [K.WOODX, 0.8, 0.1]);
  }
  for (const x of POSTS_X) bo.add(chamferBox(1.9, 25, 1.2, 0.15), M(x, 7.5, ZB - 0.8), timber, [K.WOODY, 0.5, 0.6]);
  if (opts.doorScreens !== false) {
    for (let i = 0; i < 2; i++) {
      const x0 = -8 + i * 8;
      bi.add(new THREE.PlaneGeometry(8, 17.3, 2, 2), M(x0 + 4, 0.7 + 8.65, ZB - 0.5), timber, [K.PAPERLIT, 0.05, 0], {
        fn: (k, x, y, z, v, Cc) => { Cc[k * 3] = clamp((x - x0) / 8, 0, 1); Cc[k * 3 + 1] = clamp((y - 0.7) / 17.3, 0, 1); Cc[k * 3 + 2] = (24 + i) / 32; },
      });
    }
    bi.add(chamferBox(16, 0.7, 0.9, 0.1), M(0, 0.36, ZB - 0.5), timber, [K.WOODX, 0.6, 0]);
  }
  await ctx.yield();

  // ---------------------------------------------------------------- coffered ceiling
  bi.add(box(112, 0.4, 96), M(0, CEIL + 0.5, -8), ceilC, [K.WOODX, 0.2, 0]);
  for (let i = 0; i < 7; i++) bi.add(chamferBox(112, 1.6, 1.4, 0.16), M(0, CEIL - 0.6, ZB + i * 16), timber, [K.WOODX, 0.55, 0], { jit: jit(0.85, 1.15) });
  for (const x of [-40, -24, -8, 8, 24, 40]) bi.add(chamferBox(1.4, 1.4, 96, 0.16), M(x, CEIL - 0.5, -8), timber, [K.WOODZ, 0.55, 0], { jit: jit(0.85, 1.15) });
  for (let i = 0; i < 24; i++) if (i % 4 !== 0) bi.add(box(112, 0.4, 0.4), M(0, CEIL + 0.12, ZB + i * 4), timber, [K.WOODX, 0.45, 0]);
  for (let i = 1; i < 28; i++) if (i % 4 !== 2) bi.add(box(0.4, 0.4, 96), M(-HW + i * 4, CEIL + 0.12, -8), timber, [K.WOODZ, 0.45, 0]);
  await ctx.yield();

  // ---------------------------------------------------------------- the opening: lintel, transom bars, veranda posts, rafters
  bi.add(chamferBox(113, 2, 1.7, 0.22), M(0, 21.2, ZH), timber, [K.WOODX, 0.7, 0.05]);
  bi.add(chamferBox(113, 1.2, 1.5, 0.15), M(0, 25.4, ZH), timber, [K.WOODX, 0.5, 0.05]);
  bi.add(box(112, 0.3, 0.35), M(0, 23.6, ZH), timber, [K.WOODX, 0.5, 0.05]);
  for (let i = 0; i < 69; i++) bi.add(box(0.32, 2.6, 0.32), M(-54.4 + i * 1.6, 23.5, ZH), timber, [K.WOODY, 0.5, 0.05]);
  await ctx.yield();
  const postProfile = [[0, 0], [1.2, 0], [1.2, 0.5], [1.06, 0.64], [1.0, 0.85], [1.0, 10], [0.97, 16], [0.93, 19.3], [1.03, 19.45], [1.03, 19.6], [0, 19.6]];
  for (const x of POSTS_X) {
    const j = jit(0.85, 1.15);
    bi.add(lathe(postProfile, 16), M(x, 0, 55, 0, rng() * 6.28, 0), timber, [K.WOODY, 0.8, 0.12], {
      jit: j, fn: (k, px, py, pz, v, Cc, S) => { if (py < 0.63) { Cc[k * 3] = bronze.r; Cc[k * 3 + 1] = bronze.g; Cc[k * 3 + 2] = bronze.b; S[k * 4] = K.METAL; S[k * 4 + 1] = 0.6; } },
    });
    bi.add(chamferBox(2.7, 0.9, 2.7, 0.2), M(x, 20.05, 55), timber, [K.WOODX, 0.6, 0.1]);
    bi.add(chamferBox(6.5, 0.8, 1.3, 0.18), M(x, 20.9, 55), timber, [K.WOODX, 0.6, 0.1]);
    bi.add(chamferBox(1.0, 1.2, 15, 0.15), M(x, 20.9, 47.5), timber, [K.WOODZ, 0.6, 0.08]);
    await ctx.yield();
  }
  bi.add(chamferBox(136, 1.9, 1.5, 0.2), M(0, 22.25, 55), timber, [K.WOODX, 0.65, 0.12]);
  const slope = Math.atan(0.25);
  for (let i = 0; i < 69; i++) bi.add(box(0.6, 0.8, 30.9), M(-OVR + i * 2, 24.15, 53, slope, 0, 0), timber, [K.WOODZ, 0.55, 0.12], { jit: jit(0.8, 1.2) });
  await ctx.yield();
  bi.add(box(136, 0.3, 30.9), M(0, 24.72, 53, slope, 0, 0), ceilC, [K.WOODX, 0.2, 0.1]);
  for (let i = 0; i < DRIP_N; i++) {
    if ((i & 15) === 0) await ctx.yield();
    bi.add(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 10), M(DRIP_X0 + i * DRIP_DX, 20.72, ZE + 0.45, PI / 2, 0, 0), tileC, [K.METAL, 0.8, 0.8], { jit: jit(0.8, 1.3) });
  }
  await ctx.yield();

  // ---------------------------------------------------------------- roof: hipped, concave, corners lifted
  const roofY = (x, z) => {
    const t = Math.min(clamp((OVR - Math.abs(x)) / 40, 0, 1), clamp((OVR - Math.abs(z)) / OVR, 0, 1));
    return 20.9 + 34 * (0.42 * t + 0.58 * Math.pow(t, 2.1)) + 2.4 * smoothstep(0.72, 1, Math.abs(x) / OVR) * smoothstep(0.72, 1, Math.abs(z) / OVR);
  };
  {
    const g = new THREE.PlaneGeometry(OVR * 2, OVR * 2, 56, 56); g.rotateX(-PI / 2);
    await ctx.yield();
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) P.setY(i, roofY(P.getX(i), P.getZ(i)));
    await ctx.yield();
    g.computeVertexNormals();
    await ctx.yield();
    bo.add(g, null, tileC, [K.TILE, 0.75, 1], { fn: (k, x, y, z, v, Cc) => { const n = 0.8 + 0.3 * ctx.noise.n2(x * 0.05, z * 0.05); Cc[k * 3] *= n; Cc[k * 3 + 1] *= n; Cc[k * 3 + 2] *= n; } });
    await ctx.yield();
    // fascia following the lifted edge (front edge is reflected)
    const strip = (ax, sgn, batch) => {
      const pos = [], nor = [], N = 34;
      for (let i = 0; i < N; i++) {
        const a = -OVR + (i / N) * OVR * 2, b = -OVR + ((i + 1) / N) * OVR * 2;
        const pa = ax === 0 ? [a, sgn * OVR] : [sgn * OVR, a], pb = ax === 0 ? [b, sgn * OVR] : [sgn * OVR, b];
        const ya = roofY(pa[0], pa[1]) + 0.05, yb = roofY(pb[0], pb[1]) + 0.05, o = 0.25 * sgn;
        const A = [pa[0] + (ax ? o : 0), 19.9, pa[1] + (ax ? 0 : o)], B = [pb[0] + (ax ? o : 0), 19.9, pb[1] + (ax ? 0 : o)];
        const A2 = [A[0], ya, A[2]], B2 = [B[0], yb, B[2]];
        pos.push(...A, ...B, ...B2, ...A, ...B2, ...A2);
        for (let k = 0; k < 6; k++) nor.push(ax ? sgn : 0, 0, ax ? 0 : sgn);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      batch.add(sg, null, timber, [ax ? K.WOODZ : K.WOODX, 0.6, 0.7]);
    };
    strip(0, 1, bi); strip(0, -1, bo); strip(1, 1, bo); strip(1, -1, bo);
    await ctx.yield();
    // ridge, its end ornaments and the four hip ridges
    bo.add(chamferBox(60, 2.4, 2.6, 0.5), M(0, 55.6, 0), tileC, [K.METAL, 0.7, 1], { jit: 0.8 });
    bo.add(new THREE.CylinderGeometry(0.9, 0.9, 62, 8), M(0, 57, 0, 0, 0, PI / 2), tileC, [K.METAL, 0.8, 1]);
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    for (const sx of [-1, 1]) {
      bo.add(chamferBox(1.4, 6, 3.6, 0.6), M(sx * 30.6, 57.2, 0, 0, 0, -sx * 0.35), tileC, [K.METAL, 0.7, 1], { jit: 0.9 });
      bo.add(chamferBox(1.0, 3, 2.2, 0.4), M(sx * 32.4, 59.8, 0, 0, 0, -sx * 0.9), tileC, [K.METAL, 0.7, 1]);
      for (const sz of [-1, 1]) for (let i = 0; i < 10; i++) {
        const t0 = i / 10, t1 = (i + 1) / 10;
        a.set(sx * lerp(28, OVR, t0), 0, sz * lerp(0, OVR, t0)); a.y = roofY(a.x, a.z) + 0.6;
        b.set(sx * lerp(28, OVR, t1), 0, sz * lerp(0, OVR, t1)); b.y = roofY(b.x, b.z) + 0.6;
        const L = limbM(a, b);
        bo.add(new THREE.CylinderGeometry(1.0, 1.0, L.len * 1.04, 7), L.m, tileC, [K.METAL, 0.75, 1], { jit: jit(0.8, 1.1) });
      }
      await ctx.yield();
    }
  }
  // soffits at the sides and back, plinth, under-floor, gutter
  for (const sx of [-1, 1]) {
    bo.add(box(11.2, 0.3, 136), M(sx * 62.4, 19.95, 0), timberD, [K.WOODZ, 0.2, 0.3]);
    for (let i = 0; i < 26; i++) bo.add(box(11, 0.7, 0.6), M(sx * 62.4, 19.5, -OVR + 2 + i * 4), timber, [K.WOODX, 0.4, 0.3]);
    bo.add(box(1, 5, 113), M(sx * (HW + 0.6), -2.5, 0), stone, [K.STONE, 0.3, 0.6], { grad: [-5, 0, 0.7, 1] });
    const pg = new THREE.PlaneGeometry(16, 150, 3, 24); pg.rotateX(-PI / 2);
    bo.add(pg, M(sx * 65, GY + 0.06, 0), pebble, [K.PEBBLE, 0.4, 0.9]);
    await ctx.yield();
  }
  bo.add(box(114, 0.3, 11.2), M(0, 19.95, -62.4), timberD, [K.WOODX, 0.2, 0.3]);
  for (let i = 0; i < 28; i++) bo.add(box(0.6, 0.7, 11), M(-54 + i * 4, 19.5, -62.4), timber, [K.WOODZ, 0.4, 0.3]);
  bo.add(box(114, 5, 1), M(0, -2.5, ZB - 0.6), stone, [K.STONE, 0.3, 0.6], { grad: [-5, 0, 0.7, 1] });
  bo.add(chamferBox(113.4, 1.4, 1.0, 0.15), M(0, -0.73, ZV + 0.1), timber, [K.WOODX, 0.75, 0.4]);
  bo.add(box(112, 3.7, 0.4), M(0, -3.2, ZV - 1.6), timberD, [K.WOODX, 0.2, 0.3], { grad: [-5, -1, 0.5, 1] });
  for (let i = 0; i <= 14; i++) {
    bo.add(chamferBox(0.9, 3.4, 0.9, 0.1), M(-HW + i * 8, -3.1, ZV - 0.4), timber, [K.WOODY, 0.5, 0.4]);
    bo.add(chamferBox(1.7, 0.5, 1.7, 0.18), M(-HW + i * 8, -4.75, ZV - 0.4), stone, [K.STONE, 0.4, 0.8], { jit: jit() });
  }
  await ctx.yield();
  {
    const pg = new THREE.PlaneGeometry(150, 17, 30, 4); pg.rotateX(-PI / 2);
    bo.add(pg, M(0, GY + 0.08, 65.2), pebble, [K.PEBBLE, 0.4, 0.9]);
    const pb = new THREE.PlaneGeometry(150, 14, 20, 2); pb.rotateX(-PI / 2);
    bo.add(pb, M(0, GY + 0.06, -64), pebble, [K.PEBBLE, 0.4, 0.9]);
    let x = -74;
    while (x < 74) {                                   // curb stones between gutter and moss
      const w = rng.range(2.6, 5.2);
      bo.add(chamferBox(w - 0.25, rng.range(0.8, 1.3), rng.range(1.2, 1.8), 0.25), M(x + w / 2, GY + 0.35, 74 + rng.range(-0.2, 0.2), 0, rng.range(-0.06, 0.06), 0), stone, [K.STONE, 0.5, 1], { jit: jit(0.7, 1.25) });
      x += w;
    }
  }
  await ctx.yield();

  // ---------------------------------------------------------------- things left on the veranda and the floor
  const ux = -16 * side;
  // shoe stone and wooden sandals
  bo.add(chamferBox(9.5, 2.7, 5.2, 0.55), M(ux, GY + 1.3, 59.9, 0, 0.05 * side, 0), stone, [K.STONE, 0.55, 0.75], { jit: 1.1 });
  const indigo = C('#27314f');
  for (const s of [-1, 1]) {
    const gx = ux + s * 0.75 + 0.6, gz = 59.6 + s * 0.25, ry = 0.12 * s - 0.2, top = GY + 2.65;
    bo.add(chamferBox(0.95, 0.22, 2.1, 0.07), M(gx, top + 0.75, gz, 0, ry, 0), timberB, [K.WOODZ, 0.7, 0.6], { jit: 1.6 });
    for (const t of [-0.5, 0.45]) bo.add(box(0.95, 0.66, 0.24), M(gx + Math.sin(ry) * t, top + 0.33, gz + Math.cos(ry) * t, 0, ry, 0), timberB, [K.WOODX, 0.5, 0.6], { jit: 1.4 });
    for (const t of [-1, 1]) bo.add(box(0.1, 0.1, 0.95), M(gx + t * 0.2, top + 0.95, gz + 0.35, 0.25, ry + t * 0.42, 0), indigo, [K.CLOTH, 0.2, 0.6]);
  }
  // open umbrella drying on its rim: vermilion oiled paper, a white ring, vermilion (the one red thing on the veranda)
  const umb = new THREE.Vector3(-15 * side, 0, 49);
  const umbDrips = [], cast = opts.cast || {};
  {
    const tilt = 1.18, yaw = rng.range(-0.5, 0.5) + (side > 0 ? 0.3 : PI - 0.3);
    const m0 = M(0, 0, 0, 0, yaw, tilt);
    let lo = 1e9;
    for (let i = 0; i < 24; i++) { _p.set(Math.cos(i / 24 * 6.283) * 4.3, -1.95, Math.sin(i / 24 * 6.283) * 4.3).applyMatrix4(m0); lo = Math.min(lo, _p.y); }
    _p.set(0, -6.4, 0).applyMatrix4(m0); lo = Math.min(lo, _p.y - 0.2);
    const m = M(umb.x, -lo, umb.z, 0, yaw, tilt), inv = m.clone().invert(), q = new THREE.Vector3();
    for (let i = 0; i < 24; i++) { const d = new THREE.Vector3(Math.cos(i / 24 * 6.283) * 4.3, -1.95, Math.sin(i / 24 * 6.283) * 4.3).applyMatrix4(m); if (d.y < 2.2 && d.y > 0.3) umbDrips.push(d); }
    const white = C('#c9cdc4'), black = C('#c22f17');
    bi.add(lathe([[0.02, 0.22], [0.45, 0.02], [1.4, -0.42], [2.2, -0.83], [2.35, -0.91], [2.9, -1.2], [3.05, -1.28], [4.3, -1.95]], 40), m, black, [K.CLOTH, 0.75, 0.2], {
      fn: (k, x, y, z, v, Cc) => {
        q.set(x, y, z).applyMatrix4(inv); const r = Math.hypot(q.x, q.z), rib = 0.86 + 0.14 * Math.abs(Math.cos(Math.atan2(q.z, q.x) * 20));
        const c = r > 2.28 && r < 2.97 ? white : black; Cc[k * 3] = c.r * rib; Cc[k * 3 + 1] = c.g * rib; Cc[k * 3 + 2] = c.b * rib;
      },
    });
    await ctx.yield();
    bi.add(new THREE.CylinderGeometry(0.11, 0.13, 6.6, 7), m.clone().multiply(M(0, -3.1, 0)), C('#5d6a4a'), [K.WOODY, 0.6, 0.2]);
    bi.add(new THREE.CylinderGeometry(0.34, 0.4, 0.5, 10), m.clone().multiply(M(0, -0.1, 0)), C('#101112'), [K.CLOTH, 0.6, 0.2]);
    bi.add(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 10), m.clone().multiply(M(0, -2.6, 0)), C('#101112'), [K.CLOTH, 0.6, 0.2]);
    for (let i = 0; i < 20; i++) {                    // struts from the runner to the ribs
      const an = (i / 20) * 6.283, L = limbM(_p.set(Math.cos(an) * 0.3, -2.6, Math.sin(an) * 0.3).clone(), new THREE.Vector3(Math.cos(an) * 2.6, -1.05, Math.sin(an) * 2.6));
      bi.add(new THREE.CylinderGeometry(0.035, 0.035, L.len, 4), m.clone().multiply(L.m), C('#6b7355'), [K.WOODY, 0.4, 0.2]);
    }
    umb.y = -lo;
  }
  if (cast.cape) {                                     // a straw rain cape and a sedge hat hung to dry on a rack, further along the veranda
    const cp = new THREE.Vector3(31 * side, 0, 49);
    const straw = C('#b3a475'), ry = rng.range(-0.25, 0.25) + (side > 0 ? 0.25 : -0.25), rack = (dx, dy, dz) => _p.set(dx, dy, dz).applyMatrix4(M(cp.x, 0, cp.z, 0, ry, 0)).clone();
    for (const sx of [-2.3, 2.3]) { const a = rack(sx, 0, 0); bi.add(chamferBox(0.34, 6.6, 0.34, 0.06), M(a.x, 3.3, a.z, 0, ry, 0), timberB, [K.WOODY, 0.6, 0.2]); bi.add(chamferBox(0.5, 0.3, 1.7, 0.06), M(a.x, 0.15, a.z, 0, ry, 0), timberB, [K.WOODZ, 0.6, 0.2]); }
    bi.add(chamferBox(5.6, 0.3, 0.3, 0.06), M(cp.x, 6.2, cp.z, 0, ry, 0), timberB, [K.WOODX, 0.6, 0.2]);
    for (let k = 0; k < 4; k++) {                      // four overlapping skirts of straw, widest at the hem
      const y1 = 6.35 - k * 1.05, y0 = y1 - 1.9, r1 = 0.75 + k * 0.42, r0 = r1 + 0.75;
      bi.add(lathe([[r0, y0], [r0 - 0.12, y0 + 0.3], [r1, y1], [r1 - 0.25, y1]], 18), M(cp.x, 0, cp.z, 0, ry, 0, 1, 1, 0.34), straw, [K.THATCH, 0.2, 0.2], { jit: jit(0.85, 1.2), grad: [y0, y1, 0.75, 1.1] });
    }
    for (let i = 0; i < 9; i++) umbDrips.push(rack(-2 + i * 0.5, 1.45, (i % 2 ? 0.7 : -0.7)));
    const hp = rack(3.3, 4.6, 0.25);
    bi.add(lathe([[0.02, 0.85], [0.5, 0.6], [1.9, 0], [1.84, -0.06], [0.45, 0.48], [0.02, 0.7]], 20), M(hp.x, hp.y, hp.z, 0.2, ry, -1.25 * (side > 0 ? 1 : -1)), C('#a89a6c'), [K.THATCH, 0.3, 0.2], { jit: 1.1 });
  }
  await ctx.yield();
  // cushion, tea bowl, incense
  const cush = new THREE.Vector3(9.6 * side, 0, 11.5), bowl = new THREE.Vector3(cush.x - 1.9 * side, 0, 16.4), inc = new THREE.Vector3(cush.x + 2.2 * side, 0, 16.9);
  bi.add(chamferBox(4.7, 0.75, 4.7, 0.32), M(cush.x, 0.375, cush.z, 0, rng.range(-0.2, 0.2), 0), C('#5d4a94'), [K.CLOTH, 0.08, 0], { grad: [0, 0.75, 0.5, 1.1] });
  bi.add(new THREE.SphereGeometry(0.22, 8, 6), M(cush.x, 0.72, cush.z, 0, 0, 0, 1, 0.5, 1), pearl.clone().multiplyScalar(0.5), [K.CLOTH, 0.2, 0]);
  bi.add(lathe([[0, 0], [0.36, 0], [0.4, 0.12], [0.6, 0.5], [0.66, 0.95], [0.6, 0.95], [0.54, 0.52], [0, 0.44]], 18), M(bowl.x, 0.24, bowl.z, 0, 0, 0, 1.25, 1.25, 1.25), C('#93a69a'), [K.CLOTH, 0.9, 0], { jit: 1.0 });
  bi.add(chamferBox(3.6, 0.24, 2.6, 0.09), M(bowl.x, 0.12, bowl.z, 0, 0.2 * side, 0), C('#b8271a'), [K.CLOTH, 0.95, 0]);        // a vermilion lacquer tray
  bi.add(chamferBox(3.9, 0.12, 2.9, 0.05), M(bowl.x, 0.06, bowl.z, 0, 0.2 * side, 0), C('#0c0c0d'), [K.CLOTH, 0.95, 0]);
  bi.add(new THREE.CircleGeometry(0.56, 16), M(bowl.x, 1.12, bowl.z, -PI / 2, 0, 0, 1.25, 1.25, 1.25), mixC(pal[4], pal[3], 0.4), [K.CLOTH, 0.9, 0]);
  // a paper floor lamp beside the cushion: four slim posts, a box of lit paper, the one flame in the room (and its double in the lacquer)
  const lampP = new THREE.Vector3(cush.x + 5.4 * side, 0, 9.5);
  {
    const lc = C('#ffb25e').multiplyScalar(0.62);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) bi.add(chamferBox(0.16, 5.2, 0.16, 0.03), M(lampP.x + dx * 0.78, 2.6, lampP.z + dz * 0.78), timberD, [K.WOODY, 0.6, 0]);
    for (const y of [1.5, 4.9]) bi.add(chamferBox(1.9, 0.16, 1.9, 0.04), M(lampP.x, y, lampP.z), timberD, [K.WOODX, 0.6, 0]);
    bi.add(box(1.46, 3.3, 1.46), M(lampP.x, 3.2, lampP.z), lc, [K.FLAME, 0, 0]);
    bi.add(chamferBox(2.2, 0.14, 2.2, 0.04), M(lampP.x, 5.25, lampP.z), timberD, [K.WOODX, 0.6, 0]);
    SH.uLamps.value[0].set(lampP.x, 3.4, lampP.z, hour === 'night' ? 1.3 : 0.75);
  }
  bi.add(lathe([[0, 0], [0.5, 0], [0.58, 0.1], [0.5, 0.26], [0.12, 0.2], [0, 0.22]], 14), M(inc.x, 0, inc.z), C('#56605a'), [K.STONE, 0.6, 0]);
  bi.add(new THREE.CylinderGeometry(0.035, 0.045, 1.7, 5), M(inc.x, 1.05, inc.z, 0.06, 0, 0.04), C('#4a5046'), [K.WOODY, 0.3, 0]);
  // half-rolled bamboo blind at the far end of the veranda, bronze wind bells at the eave corners
  const blindX = 48 * side;
  {
    const g = new THREE.PlaneGeometry(13.6, 9, 8, 6);
    const swayFn = (k, x, y, z, v, Cc, S) => { S[k * 4 + 3] = (21.2 - y) * 0.03; };
    bi.add(g, M(blindX, 16.7, 55.95), C('#6d785a'), [K.BLIND, 0.25, 0.3], { fn: swayFn });
    bi.add(new THREE.CylinderGeometry(0.75, 0.75, 13.8, 10), M(blindX, 12.1, 56, 0, 0, PI / 2), C('#6d785a'), [K.BLIND, 0.25, 0.3, 0.27], { jit: 0.85 });
  }
  const bells = [];
  for (const sx of [-1, 1]) {
    const bx = sx * 65.2, by = 17.2, bz = ZE - 0.9;
    bi.add(box(0.08, 3.2, 0.08), M(bx, by + 3.3, bz), bronze, [K.METAL, 0.4, 0.6, 0.03]);
    bi.add(lathe([[0, 1.7], [0.3, 1.66], [0.52, 1.2], [0.6, 0.4], [0.82, 0], [0.74, 0], [0.52, 0.4], [0, 1.4]], 12), M(bx, by, bz, 0, 0, 0, 1.3, 1.3, 1.3), bronze, [K.METAL, 0.65, 0.6, 0.06], { jit: 1.3 });
    bi.add(box(0.7, 2.6, 0.05), M(bx, by - 2.2, bz, 0, 0.4, 0), pearl.clone().multiplyScalar(0.55), [K.CLOTH, 0.1, 0.6, 0.45]);
    bells.push(new THREE.Vector3(bx, by, bz));
  }
  await ctx.yield();
  // rain chains of linked cups, running water sleeve, stone basins
  const chainX = [-9.5 * side, 58 * side], chains = []; let cupG = null;
  for (const cx of chainX) {
    const cz = ZE + 0.35, top = 20.3, bot = GY + 1.7;
    const cup = [[0.15, -0.3], [0.2, -0.28], [0.42, 0.18], [0.47, 0.22], [0.4, 0.2], [0.17, -0.2]];
    for (let y = top - 0.6, k = 0; y > bot + 0.3; y -= 0.86, k++) {
      bi.add(cupG || (cupG = lathe(cup, 8)), M(cx, y, cz, 0, k * 0.8, 0), bronze, [K.METAL, 0.7, 0.75], { jit: jit(0.85, 1.4) });
      bi.add(box(0.07, 0.46, 0.07), M(cx, y - 0.5, cz), bronze, [K.METAL, 0.6, 0.75]);
    }
    bi.add(new THREE.CylinderGeometry(0.12, 0.14, top - bot, 6, 1, true), M(cx, (top + bot) / 2, cz), pearl, [K.FLOW, 1, 0.8]);
    bo.add(lathe([[0, GY], [2.0, GY], [2.35, GY + 0.45], [2.45, GY + 1.5], [2.15, GY + 1.72], [1.95, GY + 1.5], [0, GY + 1.4]], 18), M(cx, 0, cz), stone, [K.STONE, 0.5, 1], { jit: 1.1 });
    const wg = new THREE.CircleGeometry(1.98, 18); wg.rotateX(-PI / 2);
    bo.add(wg, M(cx, GY + 1.6, cz), pal[1], [K.WATER, 1, 1]);
    chains.push({ top: new THREE.Vector3(cx, top, cz), basin: new THREE.Vector3(cx, GY + 1.6, cz) });
    await ctx.yield();
  }

  // ---------------------------------------------------------------- garden proxy (opts.garden): what the mirror shows
  const ga = makeBatch(withGarden ? 110000 : 0), gb = makeBatch(withGarden ? Math.round(720000 * clamp(detail, 0.4, 1)) : 0);            // ga is reflected, gb is not (it lies below the floor plane)
  const lf = { P: [], N: [], C: [], UV: [], A: [], I: [] };
  const maples = [];
  const gardenExit = new THREE.Vector3(-12 * side, GY + 6.8, 114);
  // the pond lies on the -side half and runs the length of the garden; the hill rises on the +side half. With
  // opts.path (a makePath in LOCAL space) the ground is kept under the camera and nothing is planted in its way.
  const nz = ctx.noise, dens = clamp(ctx.vary?.density ?? 1, 0.7, 1.3), lp = opts.path || null;
  const pondM = (x, z) => (1 - smoothstep(-52, -30, x * side)) * smoothstep(-196, -170, x * side) * smoothstep(100, 125, z) * (1 - smoothstep(364, 384, z));
  const hillAt = (x, z) => {
    let h = GY + 30 * smoothstep(-15, 150, x * side + (z - 230) * 0.15) * smoothstep(80, 190, z)
      + (2.4 * nz.fbm2(x * 0.012, z * 0.012, 3) + 1.5 * (0.5 + 0.5 * nz.n2(x * 0.034 + 3, z * 0.034)) * (1 - pondM(x, z))) * smoothstep(76, 110, z) - 3.2 * pondM(x, z);
    if (lp && z > 70) { const n = lp.nearestXZ(x, z); h = Math.min(h, n.y - 6.5 + Math.max(0, n.dist - 9) * 0.6); }
    const pm = pondM(x, z);
    if (pm < 0.2) h = Math.max(h, lerp(GY - 0.15, GY - 3, pm / 0.2));
    return h;
  };
  const fO = [], fQ = [], fK = [];
  const fall = (x, y, z, h, rate, phase, w, len, bright, type) => { fO.push(x, y, z, h); fQ.push(rate, phase, w, len); fK.push(bright, type); };
  const bark = C('#3b332a');
  const leafA = season === 'november' ? C('#a31d15') : pal[4], leafB = season === 'november' ? C('#d9552a') : mixC(pal[3], pal[4], 0.3), leafHi = season === 'november' ? C('#e08a3a') : C('#b6dc55');
  const TINT = { red: [C('#c52d16'), C('#e2542a'), C('#f28a3e')], gold: [C('#d6a01e'), C('#e9bb32'), C('#f4d665')] };
  let leafTint = null;
  const leafCol = () => { const t = leafTint ? TINT[leafTint] : null; return mixC(t ? t[0] : leafA, t ? t[1] : leafB, rng()).lerp(t ? t[2] : leafHi, rng() < 0.22 ? 0.6 : 0).multiplyScalar(rng.range(0.75, 1.1)); };
  // one drooping spray of leaf cut-outs (16 vertices); skipped where it would hang in the camera's way
  const spray = (cx, cy, cz, r, ax, az, col) => {
    if (lp && lp.distanceTo(cx, cy - r * 0.3, cz) < r + 6.5) return;
    const b0 = lf.P.length / 3, ph = rng(), seed = rng() * 50, yaw = rng() * 6.28, cw = Math.cos(yaw), sw = Math.sin(yaw), el = rng.range(0.65, 1), cells = Math.max(3, r * 2.1);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const u = i / 3, v = j / 3, lx = (u - 0.5) * 2 * r, lz = (v - 0.5) * 2 * r * el, d2 = (u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5);
      lf.P.push(cx + lx * cw - lz * sw, cy - d2 * r * 1.15 + lx * ax + lz * az, cz + lx * sw + lz * cw);
      lf.N.push(cells, 1 - d2, 0); lf.C.push(col.r, col.g, col.b); lf.UV.push(u, v); lf.A.push(0.35 + d2 * 2.6, ph, seed);
    }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const a = b0 + j * 4 + i; lf.I.push(a, a + 4, a + 1, a + 1, a + 4, a + 5); }
  };
  const limb = (batch, p0, p1, r0, r1, sides, col, surf, o) => { const L = limbM(p0, p1); batch.add(tube(r1, r0, L.len * 1.03, sides), L.m, col, surf, o); };
  const twig = (p0, p1, r0, r1, sides) => limb(ga, p0, p1, r0, r1, sides, bark, [K.STONE, 0.45, 0.8], { jit: jit(0.75, 1.2) });
  // a maple: sinuous trunk, five or six boughs, many small drooping sprays in layers (bare in February)
  const mapleAt = (x, z, H, lean, y0 = hillAt(x, z) - 0.5, tint = null) => {
    leafTint = season === 'june' && tint ? 'red' : season === 'november' && tint ? 'gold' : null;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e = new THREE.Vector3(), q = new THREE.Vector3();
    maples.push(new THREE.Vector3(x, y0, z));
    a.set(x, y0, z); let r0 = H * 0.03;
    const wob = rng() * 6.28;
    for (let k = 0; k < 6; k++) {
      b.set(a.x + (lean.x + Math.sin(wob + k * 1.3) * 0.16) * H * 0.075, a.y + H * 0.07, a.z + (lean.z + Math.cos(wob + k * 1.7) * 0.12) * H * 0.075);
      twig(a, b, r0 * (k === 0 ? 1.4 : 1), r0 * 0.88, 9);
      a.copy(b); r0 *= 0.88;
    }
    const nb = rng.int(5, 6), az0 = rng() * 6.28;
    for (let k = 0; k < nb; k++) {
      const az = az0 + (k / nb) * 6.28 + rng.range(-0.3, 0.3), el = rng.range(0.12, 0.75), len = H * rng.range(0.3, 0.5);
      const dx = Math.cos(az) * Math.cos(el), dz = Math.sin(az) * Math.cos(el), dy = Math.sin(el);
      b.set(a.x + dx * len * 0.4, a.y + dy * len * 0.55 - k * 0.6, a.z + dz * len * 0.4);
      c.set(a.x + dx * len * 0.75, b.y + dy * len * 0.3, a.z + dz * len * 0.75);
      e.set(a.x + dx * len, c.y + dy * len * 0.08 - len * 0.03, a.z + dz * len);
      twig(a, b, r0 * 0.75, r0 * 0.5, 6); twig(b, c, r0 * 0.5, r0 * 0.3, 5); twig(c, e, r0 * 0.3, r0 * 0.12, 4);
      if (season === 'february') { for (const t of [0.3, 0.7]) { q.copy(b).lerp(e, t); twig(q.clone(), new THREE.Vector3(q.x - dz * len * 0.25 * (t < 0.5 ? 1 : -1), q.y + len * 0.12, q.z + dx * len * 0.25 * (t < 0.5 ? 1 : -1)), r0 * 0.2, r0 * 0.06, 4); } continue; }
      for (let m = 0; m < 9; m++) {
        const t = 0.15 + (m / 8) * 1.0, sd = (m % 2 ? 1 : -1) * rng.range(0.2, 1) * len * 0.2;
        if (t < 0.5) q.copy(b).lerp(c, t * 2); else if (t < 1) q.copy(c).lerp(e, t * 2 - 1); else q.copy(e).addScaledVector(_s.copy(e).sub(c), t - 1);
        const r = H * rng.range(0.085, 0.14) * (1.1 - 0.35 * t);
        spray(q.x - dz * sd, q.y + rng.range(-0.04, 0.07) * H, q.z + dx * sd, r, rng.range(-0.35, 0.35), rng.range(-0.35, 0.35), leafCol().multiplyScalar(0.62 + 0.55 * clamp(((q.y - y0) / H - 0.42) / 0.45, 0, 1)));
      }
    }
    if (season !== 'february') for (let k = 0; k < 7; k++) spray(a.x + rng.range(-0.14, 0.14) * H, a.y + H * rng.range(0.05, 0.3), a.z + rng.range(-0.14, 0.14) * H, H * rng.range(0.09, 0.14), rng.range(-0.3, 0.3), rng.range(-0.3, 0.3), leafCol());
    leafTint = null;
  };
  // ---- shade under and between the cushions: a coarse grid that the ground reads when it is built, after the world's extend
  const SG = { x0: SGX0, z0: SGZ0, n: SGN, m: SGM, c: 1 }, shadeG = new Float32Array(SG.n * SG.m);
  const shade = (x, z, r, k = 1) => {
    const R = r * 1.3 + 0.9, i0 = Math.max(0, Math.floor((x - R - SG.x0) / SG.c)), i1 = Math.min(SG.n - 1, Math.ceil((x + R - SG.x0) / SG.c));
    const j0 = Math.max(0, Math.floor((z - R - SG.z0) / SG.c)), j1 = Math.min(SG.m - 1, Math.ceil((z + R - SG.z0) / SG.c));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = SG.x0 + i * SG.c - x, dz = SG.z0 + j * SG.c - z, v = k * (1 - (dx * dx + dz * dz) / (R * R));
      if (v > 0) shadeG[j * SG.n + i] = Math.min(1, shadeG[j * SG.n + i] + v * 0.75);
    }
  };
  const shadeAt = (x, z) => {
    const fx = clamp((x - SG.x0) / SG.c, 0, SG.n - 1.001), fz = clamp((z - SG.z0) / SG.c, 0, SG.m - 1.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, o = j * SG.n + i;
    return lerp(lerp(shadeG[o], shadeG[o + 1], a), lerp(shadeG[o + SG.n], shadeG[o + SG.n + 1], a), b);
  };
  // a moss cushion: sunk a third into the ground so that neighbours merge; lod 2 is lumpy and finely cut, 0 is for far drifts
  const mossC = () => mixC(pal[3], pal[4], Math.pow(rng(), 1.6) * 0.65);
  const domeG = {}, domeAt = []; let domeN = 0;     // domeAt: every cushion that stands in the garden [x, z, r, base, height], for what is set among them later
  // lod 3 and 4 are the broad low cushions of the last pass (9 and 7 sides, two rings, lumpy): large things that must stay cheap
  const dome = (batch, x, z, r, sy, c, lod = 0, y0 = null, mom = 0) => {
    const cls = lod === 3 ? 3 : lod === 4 ? 4 : lod > 1 && r > 2.4 ? 2 : (lod > 1 && r > 1.3) || (lod === 1 && r > 2.2) ? 1 : 0;      // small cushions need fewer facets even close by
    const vr = lod > 1 ? 1 + (domeN++ % 6) : 0, key = cls * 8 + vr;
    let g = domeG[key];
    if (!g) {                                       // a handful of shapes, cut once and turned and stretched for every cushion
      const s = new THREE.SphereGeometry(1, cls === 3 ? 9 : cls === 4 ? 7 : cls > 1 ? 12 : cls ? 9 : 7, cls > 2 ? 2 : cls > 1 ? 4 : cls ? 3 : 2, 0, PI * 2, 0, PI / 2);
      if (vr) {
        const P = s.attributes.position;
        for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), n = 1 + 0.17 * nz.n3(px * 1.7 + vr * 7.3, py * 1.7, pz * 1.7 + vr * 3.1); P.setXYZ(i, px * n, py * (0.9 + 0.2 * n), pz * n); }
        s.computeVertexNormals();
      }
      g = domeG[key] = s.toNonIndexed(); s.dispose();
    }
    if (y0 == null) { y0 = hillAt(x, z) - r * 0.3; shade(x, z, r); }
    if (batch === gb || batch === ga) domeAt.push([x, z, r, y0, r * sy]);
    batch.add(g, M(x, y0, z, 0, rng() * 6.28, 0, r, r * sy, r * rng.range(0.8, 1.2)), c, [K.DOME, mom ? 0.6 : 0.2, 1], { grad: [y0 + r * 0.3, y0 + r * sy * 0.84, 0.13, 1.1], jit: jit(0.82, 1.2) });
  };
  // a hydrangea: a dark mound of big drooping leaves, eight or so heavy heads of florets each on a collar of leaves
  const leafMid = mixC(pal[2], pal[3], 0.8), hydG = [null, null], hydDark = pal[2].clone().multiplyScalar(0.55), hydC = ['#c4241c', '#e04a3a', '#9a8c74', '#b07684', '#8ea4ea', '#6c62c4'].map(C);
  const hydrangea = (x, z, r, y0 = null, batch = gb) => {
    if (y0 == null) { y0 = hillAt(x, z) - 0.3; shade(x, z, r * 0.9, 0.8); }
    batch.add(hydG[0] || (hydG[0] = new THREE.SphereGeometry(1, 8, 4, 0, PI * 2, 0, PI / 2)), M(x, y0, z, 0, rng() * 6.28, 0, r * 0.86, r * 0.74, r * 0.86), hydDark, [K.FROND, 0.2, 1], { grad: [y0, y0 + r * 0.7, 0.3, 1] });
    const pos = [];
    const leaf = (bx, by, bz, dx, dy, dz, L, w) => {              // from its base along (dx, dy, dz): folded on the midrib, tip drooping
      const sl = Math.hypot(dx, dz) || 1, sx = -dz / sl, sz = dx / sl;
      const mx = bx + dx * L * 0.45, my = by + dy * L * 0.45, mz = bz + dz * L * 0.45;
      const b = [bx, by, bz], t = [bx + dx * L, by + dy * L - L * 0.2, bz + dz * L], m = [mx, my + 0.1 * L, mz];
      const l = [mx + sx * w, my - 0.05 * L, mz + sz * w], q = [mx - sx * w, my - 0.05 * L, mz - sz * w];
      pos.push(...b, ...l, ...m, ...b, ...m, ...q, ...l, ...t, ...m, ...m, ...t, ...q);
    };
    const nl = Math.round(22 * clamp(r / 3, 0.7, 1.3));
    for (let i = 0; i < nl; i++) {
      const an = rng() * 6.28, el = rng.range(0.05, 1.25), ce = Math.cos(el), a2 = an + rng.range(-0.5, 0.5);
      leaf(x + Math.cos(an) * ce * r * 0.8, y0 + Math.sin(el) * r * 0.68, z + Math.sin(an) * ce * r * 0.8, Math.cos(a2) * 0.9, rng.range(-0.1, 0.5), Math.sin(a2) * 0.9, r * rng.range(0.42, 0.6), r * rng.range(0.15, 0.21));
    }
    const feb = season === 'february';
    for (let k = 0; k < (feb ? 6 : 8); k++) {
      const an = rng() * 6.28, el = rng.range(0.3, 1.4), hr = r * rng.range(0.23, 0.33) * (feb ? 0.8 : 1);
      const hx = x + Math.cos(an) * Math.cos(el) * r * 0.92, hy = y0 + Math.sin(el) * r * 0.8 + hr * 0.3, hz = z + Math.sin(an) * Math.cos(el) * r * 0.92;
      const col = feb ? mixC(hydC[0], hydC[1], rng()) : season === 'november' ? mixC(hydC[2], hydC[3], rng() * 0.7) : mixC(accent, rng() < 0.5 ? hydC[4] : hydC[5], rng() * 0.6);
      batch.add(hydG[1] || (hydG[1] = new THREE.SphereGeometry(1, 9, 6)), M(hx, hy, hz, 0, rng() * 6.28, 0, hr, 0.82 * hr, hr), col, [K.FLORET, 0.15, 1, 0.05], { jit: jit(0.85, 1.25) });
      for (let j = 0; j < 4; j++) { const a2 = an + j * 1.57 + rng.range(-0.4, 0.4); leaf(hx, hy - hr * 0.55, hz, Math.cos(a2) * 0.92, -0.25, Math.sin(a2) * 0.92, hr * rng.range(1.5, 2), hr * 0.6); }
    }
    const lg = soup(pos);
    batch.add(lg, null, leafMid, [K.FROND, 0.45, 1, 0.05], { grad: [y0, y0 + r, 0.5, 1.25], jit: jit(0.85, 1.15) });
  };
  // an irregular rounded stone, base at y = 0: rings of a wobbling outline under a slightly tilted crown
  const rockGeo = (r, h, sides = 12, crown = 0.55) => {
    const p1 = rng() * 6.28, p2 = rng() * 6.28, p3 = rng() * 6.28, tilt = rng.range(-0.1, 0.1), ta = rng() * 6.28;
    const prof = [[0.84, 0], [1, 0.3], [0.97, 0.7], [0.82, 0.94], [crown, 1]], pos = [], idx = [];
    for (let k = 0; k < prof.length; k++) for (let i = 0; i < sides; i++) {
      const a = (i / sides) * 6.2832, wob = 1 + 0.13 * Math.sin(a * 2 + p1) + 0.08 * Math.sin(a * 3 + p2) + 0.045 * Math.sin(a * 5 + p3);
      pos.push(Math.cos(a) * r * prof[k][0] * wob, h * prof[k][1] * (1 + tilt * Math.cos(a - ta) * prof[k][1]), Math.sin(a) * r * prof[k][0] * wob);
    }
    pos.push(0, h * 1.02, 0);
    const top = prof.length * sides;
    for (let i = 0; i < sides; i++) {
      const i2 = (i + 1) % sides;
      for (let k = 0; k < prof.length - 1; k++) { const a = k * sides + i, b = k * sides + i2; idx.push(a, a + sides, b, b, a + sides, b + sides); }
      idx.push(top - sides + i, top, top - sides + i2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  // a cedar: straight trunk, tiers of drooping boughs with ragged hems (the shader cuts them), top lost in the cloud
  const cedarCol = pal[2].clone().multiplyScalar(0.8);
  const cedarAt = (x, z, lod, batch = ga, o = {}) => {
    const h = o.h || rng.range(70, 115), r = h * rng.range(0.1, 0.15) * (o.girth || 1), tiers = lod > 1 ? 10 : lod ? 8 : 6, nb = lod > 1 ? 7 : lod ? 6 : 5, n2 = nb * 2, mw = o.mist || 0;
    batch.add(new THREE.CylinderGeometry(r * 0.05, r * 0.17, h * 0.9, 6, 1, true), M(x, GY + h * 0.45, z), bark, [K.CONIFER, 0, 1, mw]);
    const pos = [], edge = [], idx = [], y0 = h * rng.range(0.16, 0.34), rot = rng() * 6.28;
    for (let k = 0; k < tiers; k++) {
      const t = k / (tiers - 1), yt = lerp(y0, h * 0.95, t) + h * 0.06, rr = r * (1 - 0.86 * Math.pow(t, 0.9)) * rng.range(0.85, 1.12), drop = h * 0.09 * (1.25 - 0.5 * t), b0 = pos.length / 3;
      pos.push(0, yt, 0); edge.push(0);
      for (let i = 0; i < n2; i++) {
        const a = rot + k * 0.9 + (i / n2) * 6.2832, tip = i % 2 === 0, q = tip ? rr * rng.range(0.9, 1.15) : rr * 0.62;
        pos.push(Math.cos(a) * q * 0.55, yt - drop * 0.22, Math.sin(a) * q * 0.55); edge.push(0.3);
        pos.push(Math.cos(a) * q, yt - drop * (tip ? rng.range(0.9, 1.25) : 0.6), Math.sin(a) * q); edge.push(1);
      }
      for (let i = 0; i < n2; i++) { const s = b0 + 1 + i * 2, s2 = b0 + 1 + ((i + 1) % n2) * 2; idx.push(b0, s, s2, s, s + 1, s2, s2, s + 1, s2 + 1); }
    }
    const gi = new THREE.BufferGeometry();
    gi.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gi.setAttribute('edge', new THREE.Float32BufferAttribute(edge, 1)); gi.setIndex(idx); gi.computeVertexNormals();
    const g = gi.toNonIndexed(), E = g.attributes.edge.array; gi.dispose();
    batch.add(g, M(x, GY, z), cedarCol, [K.CONIFER, 0, 1, mw], { jit: jit(0.75, 1.2), fn: (i, px, py, pz, v, Cc, S) => { S[i * 4 + 1] = E[i]; } });
  };
  const flatGround = mixC(pal[3], pal[4], 0.12);
  // the garden's ground as it is drawn: a plane of 88 x 75 cells with hillAt at its corners. groundPrep() cuts it (once; the
  // ground is still added to the batch last of all), groundAt(x, z) then reads the drawn surface itself, facet by facet.
  const GND = { nx: 88, nz: 75, dx: 420 / 88, dz: 358 / 75, x0: -210, z0: 72, geo: null };
  const groundPrep = async () => {
    if (GND.geo) return GND.geo;
    const g = new THREE.PlaneGeometry(420, 358, GND.nx, GND.nz); g.rotateX(-PI / 2); g.translate(0, 0, 251);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      if ((i & 127) === 0) await ctx.yield();          // 6800 heights, each one a search along the path
      P.setY(i, hillAt(P.getX(i), P.getZ(i)));
    }
    GND.geo = g; GND.Y = P.array;
    return g;
  };
  const groundAt = (x, z) => {
    const fx = clamp((x - GND.x0) / GND.dx, 0, GND.nx - 1e-6), fz = clamp((z - GND.z0) / GND.dz, 0, GND.nz - 1e-6), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, w = GND.nx + 1, Y = GND.Y;
    const ha = Y[(j * w + i) * 3 + 1], hb = Y[((j + 1) * w + i) * 3 + 1], hc = Y[((j + 1) * w + i + 1) * 3 + 1], hd = Y[(j * w + i + 1) * 3 + 1];
    return a + b <= 1 ? ha + a * (hd - ha) + b * (hb - ha) : hc + (1 - a) * (hb - hc) + (1 - b) * (hd - hc);
  };
  if (withGarden) {
    {
      const flat = (w, d, x, z) => { const fg = new THREE.PlaneGeometry(w, d, 6, 6); fg.rotateX(-PI / 2); gb.add(fg, M(x, GY - 0.03, z), flatGround, [K.MOSS, 0.15, 1], { jit: 0.8 }); };
      flat(900, 480, 0, -167); flat(240, 358, 330, 251); flat(240, 358, -330, 251);
      const wg = new THREE.PlaneGeometry(176, 300, 8, 12); wg.rotateX(-PI / 2);
      gb.add(wg, M(-116 * side, GY - 0.55, 244), pal[1], [K.WATER, 1, 1]);
    }
    await ctx.yield();
    // moss cushions in drifts over the whole garden: sunk, overlapping, sizes from 2 to 14 m
    const nd = Math.round(420 * detail * dens), drifts = [];
    for (let i = 0; i < 30; i++) drifts.push([rng.range(-150, 150), 80 + Math.pow(rng(), 1.4) * 220, rng.range(7, 20)]);
    for (let i = 0; i < nd; i++) {
      if ((i & 15) === 0) await ctx.yield();
      const dr = drifts[i % drifts.length], x = dr[0] + rng.gauss() * dr[2], z = Math.max(77, dr[1] + rng.gauss() * dr[2]);
      const r = 1.2 + Math.pow(rng(), 2.2) * 6;
      if (pondM(x, z) > 0.15 || Math.abs(x) > 200 || z > 420) continue;
      const tz = clamp((z - ZE) / (gardenExit.z - ZE), 0, 1.6);
      if (lp ? lp.nearestXZ(x, z).dist < 7 + r * 0.6 : (Math.abs(x - gardenExit.x * tz) < 8 + r && z < 190)) continue;
      dome(gb, x, z, r, rng.range(0.5, 0.8), mossC(), lp ? 0 : 1);
    }
    await ctx.yield();
    // maples leaning over the gutter
    for (const [mi, sx] of [-66, -50, -35, -20, 19, 33, 48, 63, 77].entries()) {
      const x = sx + rng.range(-4, 4), z = rng.range(79, 97), H = rng.range(30, 45) * (0.9 + 0.1 * dens);
      mapleAt(x, z, H, new THREE.Vector3(clamp(-x * 0.004, -0.2, 0.2) + rng.range(-0.12, 0.12), 0, rng.range(-0.34, -0.1)), undefined, mi === 1 || mi === 4 ? 'red' : null);
      await ctx.yield();
    }
    // hydrangeas along the gutter
    for (let i = 0; i < 12; i++) {
      const x = -72 + i * 13 + rng.range(-3, 3), z = rng.range(76.5, 81), r = rng.range(2.3, 3.4);
      if (Math.abs(x - gardenExit.x * 0.25) < 9) continue;
      hydrangea(x, z, r);
      await ctx.yield();
    }
    // earthen wall with a tiled cap, cedars beyond in three fading rows
    const earth = C('#76735f');
    ga.add(box(424, 24, 3), M(0, GY + 12, 430), earth, [K.EARTH, 0.05, 1, MW(0.1)], { grad: [GY, GY + 24, 0.8, 1] });
    ga.add(chamferBox(426, 1.8, 6.5, 0.5), M(0, GY + 24.9, 430), tileC, [K.METAL, 0.6, 1]);
    for (const sx of [-1, 1]) {
      ga.add(box(3, 24, 360), M(sx * 211, GY + 12, 251), earth, [K.EARTH, 0.05, 1, MW(0.1)], { grad: [GY, GY + 24, 0.8, 1] });
      ga.add(chamferBox(6.5, 1.8, 362, 0.5), M(sx * 211, GY + 24.9, 251), tileC, [K.METAL, 0.6, 1]);
    }
    await ctx.yield();
    // Three ranks stand round the garden's three walled sides, in clumps of unequal trees with gaps between them: the nearest
    // large and dark just behind the wall, the next two further off and paler (surf.w thins the mist on the nearer ranks so
    // that each stands clear of the one behind). The world lays its mist bands between them.
    const RANKS = [[23, 6, -0.72, 88, 134, 1.14], [90, 12, -0.3, 80, 126, 1], [162, 16, -0.14, 76, 132, 0.95]];   // [beyond the wall, scatter, mist, lowest, tallest, girth]
    for (let rk = 0; rk < 3; rk++) {
      const [off, jt, mw, h0, h1, girth] = RANKS[rk], X1 = 211 + off, Z0 = 104, Z1 = 430 + off, L1 = Z1 - Z0, L = L1 * 2 + X1 * 2;
      let t = rng.range(0, 18);
      while (t < L) {
        const leg = t < L1 ? 0 : t < L1 + X1 * 2 ? 1 : 2;                // pond side, far side, hill side
        const x = leg === 0 ? -X1 * side : leg === 1 ? (t - L1 - X1) * side : X1 * side, z = leg === 0 ? Z0 + t : leg === 1 ? Z1 : Z1 - (t - L1 - X1 * 2);
        const lod = rk === 0 ? (leg < 2 ? 2 : 1) : rk === 1 ? (leg < 2 ? 1 : 0) : 0;
        cedarAt(x + rng.range(-jt, jt), z + rng.range(-jt, jt), lod, rk === 0 && leg === 1 ? ga : gb, { h: lerp(h0, h1, Math.pow(rng(), 1.3)), girth, mist: mw });
        t += (rng() < 0.62 ? rng.range(9, 16) : rng.range(30, 58)) * (1 + rk * 0.14);
        await ctx.yield();                                // after every tree: a near one is some thousands of vertices
      }
      await ctx.yield();
    }
  }

  // ---------------------------------------------------------------- the world's own additions go into the same batches
  //   bi: interior, reflected   bo: exterior of the building, not reflected   ga: garden, reflected   gb: garden, not
  //   reflected (everything below the floor plane, and far things the floor cannot show)
  const kit = { rng, side, season, snow, pal, detail, dens, K, M, C, mixC, chamferBox, box, tube, soup, lathe, limbM, makeBatch, bi, bo, ga, gb, spray, limb, twig, mapleAt, leafCol, fall, hillAt, pondM, jit, GY, shade, dome, mossC, hydrangea, rockGeo, cedarAt, shadeAt, domeAt, groundPrep, groundAt, ground: GND,
    useRng: (r) => { const was = rng; rng = r; return was; },      // deal what follows from another stream (and hand back the one in use)
    colors: { timber, timberB, timberD, plaster, stone, tileC, bronze, pebble, accent, bark, pearl } };
  if (opts.extend) await opts.extend(kit);
  if (withGarden) {
    // ---- BEHIND THE GARDEN, second pass. Dealt from a stream of its own, so that nothing above falls differently.
    const r2 = opts.rng2 || makeRng(hashSeed('veranda6-beyond:' + (ctx.seed ?? 0))), was = rng; rng = r2;
    SH.uPatch.value.set(r2.range(0, 60), r2.range(0, 60), r2.range(0, 60), r2.range(0, 60));        // where the moss's wet and pale drifts lie on this visit
    // the wall's cap: a tiled roof of its own, 11 m across under a round ridge, shedding its water down both faces
    const capC = tileC.clone().multiplyScalar(0.9), cs = [K.EARTH, 0.2, 1, MW(0.1)], yr = GY + 28.6, ye = GY + 24.8;
    const roof = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), ox = -(z1 - z0) / L * 5.6, oz = (x1 - x0) / L * 5.6, pos = [];
      for (const sg of [-1, 1]) {
        pos.push(x0, yr, z0, x1, yr, z1, x1 + ox * sg, ye, z1 + oz * sg, x0, yr, z0, x1 + ox * sg, ye, z1 + oz * sg, x0 + ox * sg, ye, z0 + oz * sg);
        pos.push(x0 + ox * sg, ye, z0 + oz * sg, x0 + ox * sg, ye - 0.7, z0 + oz * sg, x1 + ox * sg, ye - 0.7, z1 + oz * sg, x0 + ox * sg, ye, z0 + oz * sg, x1 + ox * sg, ye - 0.7, z1 + oz * sg, x1 + ox * sg, ye, z1 + oz * sg);   // the eave's edge
      }
      ga.add(soup(pos), null, capC, cs);
      const Lm = limbM(_p.set(x0, yr + 0.15, z0).clone(), new THREE.Vector3(x1, yr + 0.15, z1));
      ga.add(tube(0.8, 0.8, Lm.len, 7), Lm.m, capC, [K.METAL, 0.5, 1], { jit: 0.85 });
    };
    roof(-217, 430, 217, 430);
    for (const sx of [-1, 1]) roof(sx * 211, 66, sx * 211, 435);
    await ctx.yield();
    if (!snow) {                                       // and the water coming off its eave, a bead every few metres, wherever the wall stands clear of the hill
      const bead = (x, z) => { const h = ye - 0.6 - hillAt(x, z); if (h > 4) fall(x, ye - 0.6, z, h, r2.range(0.3, 0.5), r2(), 0.2, 0.5, r2.range(0.6, 1), 1); };
      for (let z = 100; z < 424; z += 2.9) for (const sx of [-1, 1]) bead(sx * 205.3, z + r2.range(-0.8, 0.8));
      for (let x = -204; x < 204; x += 2.9) bead(x + r2.range(-0.8, 0.8), 424.3);
    }
    await ctx.yield();
    // more cedars in the near rank along the garden's two long sides, in the gaps of the first dealing and of unlike heights: the
    // tallest stand up into the cloud (the far side's near rank is filled on a card below, like the ranks behind it)
    for (const sx of [-1, 1]) {
      const X1 = 211 + 23, Z0 = 96, Z1 = 430 + 23;
      let t = r2.range(0, 14);
      while (Z0 + t < Z1) {
        cedarAt(sx * (X1 + r2.range(-8, 13)), Z0 + t, sx === -side ? 1 : 0, gb, { h: lerp(62, 172, Math.pow(r2(), 1.6)), girth: r2.range(0.85, 1.3), mist: MW(0.2) });
        t += sx === -side ? r2.range(11, 30) : r2.range(15, 38);
        await ctx.yield();
      }
    }
    // and the two ranks behind it filled out to woods: each a pair of long cards on which the shader stands spires of unlike
    // heights (K.GHOST), paler rank by rank; the trees of the first dealing stand among them
    const card = (x0, z0, x1, z1, base, seed, mw, batch) => {
      batch.add(soup([x0, GY, z0, x1, GY, z1, x1, GY + 178, z1, x0, GY, z0, x1, GY + 178, z1, x0, GY + 178, z0]), null, cedarCol, [K.GHOST, base, 1, MW(mw)],
        { fn: (i, x, y, z, v, Cc) => { Cc[i * 3] = Math.hypot(x - x0, z - z0); Cc[i * 3 + 1] = y - GY; Cc[i * 3 + 2] = seed; } });
    };
    for (const [off, base, mw] of [[31, 104, 0.3], [82, 90, 0.5], [101, 99, 0.6], [151, 94, 0.6], [176, 106, 0.6]]) {
      const X1 = 211 + off, Z1 = 430 + off, seed = r2();
      card(-X1, Z1, X1, Z1, base, seed, mw, ga);
      if (off > 50) for (const sx of [-1, 1]) card(sx * X1, 80, sx * X1, Z1, base, seed + 0.07 * sx, mw, gb);
    }
    rng = was;
    await ctx.yield();
  }
  if (withGarden) {                                    // the ground last, so that it lies dark under and between whatever was planted
    const g = await groundPrep();
    g.computeVertexNormals();
    await ctx.yield();
    const c1 = mixC(pal[3], pal[4], 0.62);
    ga.add(g, null, flatGround, [K.MOSS, 0.15, 1], { fn: (k, x, y, z, v, Cc) => {
      const t = clamp(0.5 + 0.7 * nz.fbm2(x * 0.03, z * 0.03, 2), 0, 1), ao = 1;
      Cc[k * 3] = lerp(flatGround.r, c1.r, t) * ao; Cc[k * 3 + 1] = lerp(flatGround.g, c1.g, t) * ao; Cc[k * 3 + 2] = lerp(flatGround.b, c1.b, t) * ao;
    } });
    await ctx.yield();
  }
  {                                                    // the shade grid as a texture: soft dark hollows round every mound
    const d = new Uint8Array(SG.n * SG.m);
    for (let i = 0; i < SG.n * 2; i++) shadeG[i] = 0;        // the first rows are what everything behind the garden reads: keep them clear
    for (let i = 0; i < d.length; i++) d[i] = Math.round(shadeG[i] * 255);
    const tex = new THREE.DataTexture(d, SG.n, SG.m, THREE.RedFormat, THREE.UnsignedByteType);
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.unpackAlignment = 1; tex.needsUpdate = true;
    SH.uShade.value = tex;
  }

  // ---------------------------------------------------------------- meshes
  const mk = (geo, mat, ro = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = ro; object.add(m); return m; };
  await ctx.yield();
  const inner = mk(bi.build(), solidMat);
  await ctx.yield();
  const outer = mk(bo.build(), solidMat);
  await ctx.yield();
  let triangles = inner.geometry.attributes.position.count / 3 + outer.geometry.attributes.position.count / 3;
  let gardenA = null, gardenB = null, leaves = null, shell = null;
  if (withGarden) {
    gardenA = mk(ga.build(), solidMat);
    await ctx.yield();
    gardenB = mk(gb.build(), solidMat);
    await ctx.yield();
    triangles += gardenA.geometry.attributes.position.count / 3 + gardenB.geometry.attributes.position.count / 3;
    if (lf.I.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(lf.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(lf.N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(lf.C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(lf.UV, 2));
      g.setAttribute('aCard', new THREE.Float32BufferAttribute(lf.A, 3)); g.setIndex(lf.I);
      leaves = mk(g, new THREE.ShaderMaterial({ uniforms: fogged(pick('uTime', 'uSky', 'uMistCol', 'uMist', 'uSun', 'uSunA', 'uSunP')), vertexShader: LEAF_VS, fragmentShader: LEAF_FS, fog: true, side: THREE.DoubleSide }));
      triangles += lf.I.length / 3;
      await ctx.yield();
    }
  }
  if (withSky) {
    shell = mk(new THREE.SphereGeometry(1500, 24, 12), new THREE.ShaderMaterial({
      uniforms: pick('uTime', 'uZen', 'uHor', 'uInv', 'uSeam', 'uStrata', 'uSunDir', 'uSkyK'), side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'uniform mat4 uInv; varying vec3 vP; void main(){ vP = position - (uInv * vec4(cameraPosition, 1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }', fragmentShader: SHELL_FS,
    }), -0.5);
    triangles += 24 * 12 * 2;
  }

  // ---- the floor: mirror base (opaque, resets depth) and lacquer film (transparent, seals depth)
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-HW, 0, ZB, HW, 0, ZB, HW, 0, ZV, -HW, 0, ZV], 3));
  fg.setIndex([0, 2, 1, 0, 3, 2]);
  const base = mk(fg, new THREE.ShaderMaterial({ uniforms: pick('uTime', 'uInv', 'uZen', 'uHor', 'uSeam', 'uStrata', 'uSunDir', 'uSkyK'), vertexShader: FLOOR_VS, fragmentShader: BASE_FS, fog: false, depthWrite: false }), 50);
  const leafCols = season === 'november' ? [C('#9c1d14'), C('#cf4d24')] : [mixC(pal[3], pal[4], 0.5), pal[4].clone()];
  const zl = (zen.r + zen.g + zen.b) / 3;
  const filmU = fogged({ ...pick('uTime', 'uInv', 'uSky', 'uLampCol'), uLampP: { value: new THREE.Vector3(lampP.x, 3.4, lampP.z) },
    uStreak: { value: (season === 'november' ? new THREE.Color(0.5, 0.27, 0.13) : snow ? new THREE.Color(0.5, 0.56, 0.62) : new THREE.Color(0.4, 0.54, 0.3)).multiplyScalar(zl * 0.9) }, uLacquer: { value: pal[1].clone() }, uLeafCol: { value: leafCols[0] }, uLeafCol2: { value: leafCols[1] },
    uLeafK: { value: season === 'november' ? 1.9 : season === 'february' ? 0.12 : 1 }, uRing: { value: snow ? 0.25 : clamp(rainW, 0.4, 1.3) } });
  const film = mk(fg, new THREE.ShaderMaterial({ uniforms: filmU, vertexShader: FLOOR_VS, fragmentShader: FILM_FS, fog: true, transparent: true, depthWrite: true }), -100);
  triangles += 4;
  await ctx.yield();

  // ---- falling water: eave beads, umbrella drips, fine rain or snow
  const beadsPer = Math.max(6, Math.round(11 * detail));
  for (let i = 0; i < DRIP_N; i++) {
    if (snow && i % 3) continue;
    const x = DRIP_X0 + i * DRIP_DX, rate = rng.range(0.3, 0.62) * (snow ? 0.5 : 0.8 + 0.2 * rainW);
    const nb = snow ? 2 : Math.max(2, Math.round(beadsPer * rng.range(0.25, 1) * clamp(rainW, 0.7, 1.15)));
    for (let j = 0; j < nb; j++) fall(x + rng.range(-0.1, 0.1), 20.25, ZE + 0.45, 25.1, rate * rng.range(0.92, 1.08), rng(), rng.range(0.14, 0.2), rng.range(0.34, 0.48), rng.range(0.6, 1), 1);
  }
  for (const d of umbDrips) for (let j = 0; j < 2; j++) fall(d.x, d.y, d.z, d.y - 0.02, rng.range(0.5, 0.8), rng(), 0.13, 0.3, 0.9, 1);
  for (const c of chains) for (let j = 0; j < 6; j++) { const an = rng() * 6.28; fall(c.basin.x + Math.cos(an) * 2.3, c.basin.y + 0.1, c.basin.z + Math.sin(an) * 2.3, 1.6, rng.range(0.9, 1.3), rng(), 0.12, 0.3, 0.8, 1); }
  if (withRain) {
    const n = Math.round((snow ? 900 : 760 * rainW) * detail * (opts.rainCount || 1));
    for (let i = 0; i < n; i++) {
      const x = rng.range(-150, 150), z = ZE + 3 + Math.pow(rng(), 1.4) * (opts.rainDepth || 170);
      if (snow) { const fs = rng.range(0.45, 0.85); fall(x, 66, z, 72, rng.range(0.05, 0.09), rng(), fs, fs, rng.range(0.8, 1), 2); }
      else fall(x, 70, z, 76, rng.range(0.3, 0.4), rng(), 0.07, rng.range(4, 7), rng.range(0.45, 1), 0);
    }
  }
  await ctx.yield();
  const fgI = new THREE.InstancedBufferGeometry();
  fgI.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); fgI.setIndex([0, 1, 2, 0, 2, 3]);
  fgI.setAttribute('aO', new THREE.InstancedBufferAttribute(new Float32Array(fO), 4)); fgI.setAttribute('aQ', new THREE.InstancedBufferAttribute(new Float32Array(fQ), 4));
  fgI.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(fK), 2)); fgI.instanceCount = fK.length / 2;
  const falling = mk(fgI, new THREE.ShaderMaterial({ uniforms: fogged(pick('uTime', 'uSky', 'uViewH', 'uSun', 'uSunA', 'uSunP')), vertexShader: FALL_VS, fragmentShader: FALL_FS, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 2);
  triangles += fK.length;
  await ctx.yield();

  // ---- shafts of light: upright slices across the garden (and three across the courts behind the hall), each showing its cut through the light
  let shafts = null, beams = null;
  if (withGarden) {
    const sp2 = [], si2 = [], quad = (x0, x1, y1, z) => { const b = sp2.length / 3; sp2.push(x0, GY, z, x1, GY, z, x1, y1, z, x0, y1, z); si2.push(b, b + 1, b + 2, b, b + 2, b + 3); };
    for (let i = 0; i < 16; i++) quad(-212, 212, GY + 104, 92 + i * 21);
    if (opts.courtShafts) for (const z of [-64, -78, -92, -106]) quad(-44, 44, GY + 44, z);
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3)); g2.setIndex(si2);
    shafts = mk(g2, new THREE.ShaderMaterial({ uniforms: pick('uTime', 'uSun', 'uSunA', 'uSunP', 'uShaft'), vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), 3);
    triangles += si2.length / 3;
    const bp2 = [], bx2 = [], bi2 = [];
    (opts.beams || [0, 1, 2, 3, 4, 5]).forEach((i, n) => { const b = n * 4; bp2.push(-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0); bx2.push(i, i, i, i); bi2.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const g3 = new THREE.BufferGeometry(); g3.setAttribute('position', new THREE.Float32BufferAttribute(bp2, 3)); g3.setAttribute('aIdx', new THREE.Float32BufferAttribute(bx2, 1)); g3.setIndex(bi2);
    beams = mk(g3, new THREE.ShaderMaterial({ uniforms: pick('uTime', 'uInv', 'uSun', 'uSunA', 'uSunP', 'uBeam'), vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), 3);
    triangles += 12;
  }

  // ---- incense thread
  const sg = new THREE.BufferGeometry(), sp = [], si = [];
  for (let i = 0; i <= 48; i++) { sp.push(-1, i / 48, 0, 1, i / 48, 0); if (i < 48) si.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
  const smoke = mk(sg, new THREE.ShaderMaterial({ uniforms: { ...pick('uTime', 'uSky', 'uViewH'), uBase: { value: new THREE.Vector3(inc.x + 0.07, 1.9, inc.z + 0.1) } }, vertexShader: SMOKE_VS, fragmentShader: SMOKE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 3);
  triangles += 96;

  // ---- two swallows
  const bb = makeBatch();
  {
    const back = cast.wagtails ? C('#1c1f25') : C('#141c32'), belly = cast.wagtails ? C('#d3d9da') : C('#b2babb');
    bb.add(new THREE.SphereGeometry(1, 7, 5), M(0, 0, 0, PI / 2, 0, 0, 0.17, 0.62, 0.15), back, [0, 0, 0, 0], { fn: (k, x, y, z, v, Cc) => { const c = v.y < -0.25 ? belly : back; Cc[k * 3] = c.r; Cc[k * 3 + 1] = c.g; Cc[k * 3 + 2] = c.b; } });
    const wp = [], wn = [];
    for (const s of [-1, 1]) {
      const rf = [s * 0.12, 0.03, 0.24], rb = [s * 0.12, 0.03, -0.14], mf = [s * 0.72, 0.03, 0.04], mb = [s * 0.72, 0.03, -0.24], tip = [s * 1.3, 0.03, -0.52];
      wp.push(...rf, ...rb, ...mf, ...rb, ...mb, ...mf, ...mf, ...mb, ...tip);
      wp.push(s * 0.05, 0, -0.5, s * 0.02, 0, -0.62, s * 0.24, 0, -1.2);
      for (let k = 0; k < 12; k++) wn.push(0, 1, 0);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3));
    bb.add(wg, null, back, [0, 0, 0, 0], { fn: (k, x, y, z, v, Cc, S) => { S[k * 4 + 3] = z < -0.45 && Math.abs(x) < 0.3 ? 0 : clamp((Math.abs(x) - 0.12) / 1.18, 0, 1); } });
  }
  const birdGeo = bb.build();
  birdGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(new Float32Array([0, 1.9]), 1));
  const birds = new THREE.InstancedMesh(birdGeo, new THREE.ShaderMaterial({ uniforms: fogged(pick('uTime', 'uSky', 'uFlap')), vertexShader: BIRD_VS, fragmentShader: BIRD_FS, fog: true, side: THREE.DoubleSide }), 2);
  birds.frustumCulled = false; object.add(birds);
  triangles += 2 * birdGeo.attributes.position.count / 3;
  await ctx.yield();

  // ---------------------------------------------------------------- the mirror
  const mirrorRoot = new THREE.Group(); mirrorRoot.name = 'mirror-twins'; mirrorRoot.scale.set(1, -1, 1); object.add(mirrorRoot);
  const twins = [], invObj = new THREE.Matrix4();
  const syncTwin = (t) => {
    const src = t.userData.src;
    src.updateWorldMatrix(true, false);
    t.matrix.copy(invObj).multiply(src.matrixWorld); t.visible = src.visible;
    if (src.isInstancedMesh) t.count = src.count;
  };
  const addTwin = (src, o = {}) => {
    if (!src) return null;
    if (!src.isMesh && !src.isPoints) { const out = []; src.traverse((ch) => { if (ch.isMesh || ch.isPoints) out.push(addTwin(ch, o)); }); return out; }
    const mats = Array.isArray(src.material) ? src.material : [src.material];
    for (const m of mats) patchMirror(m, MU);
    let t;
    if (src.isInstancedMesh) { t = new THREE.InstancedMesh(src.geometry, src.material, src.count); t.instanceMatrix = src.instanceMatrix; if (src.instanceColor) t.instanceColor = src.instanceColor; }
    else if (src.isPoints) t = new THREE.Points(src.geometry, src.material);
    else t = new THREE.Mesh(src.geometry, src.material);
    t.frustumCulled = false; t.matrixAutoUpdate = false;
    t.renderOrder = mats.some((m) => m.transparent) ? -200 : 60;
    t.userData.src = src; t.userData.live = !!o.live;
    object.updateWorldMatrix(true, false); invObj.copy(object.matrixWorld).invert();
    mirrorRoot.add(t); syncTwin(t); twins.push(t);
    triangles += o.count === false ? 0 : (src.geometry.index ? src.geometry.index.count : src.geometry.attributes.position.count) / 3 * (src.isInstancedMesh ? src.count : 1);
    return t;
  };
  let mirrorOn = true;
  const mirror = {
    root: mirrorRoot, twins, uniforms: MU,
    patch: (m) => patchMirror(m, MU),
    add: addTwin,
    remove(t) { const i = twins.indexOf(t); if (i >= 0) twins.splice(i, 1); mirrorRoot.remove(t); },
    setEnabled(b) { mirrorOn = !!b; },
  };
  addTwin(inner); addTwin(gardenA); addTwin(leaves); addTwin(falling, { count: false }); addTwin(shafts); addTwin(beams); addTwin(smoke); addTwin(birds, { live: true });
  triangles += fK.length;

  // ---------------------------------------------------------------- swallows: one low pass across the lacquer
  const d = side;
  const curve = new THREE.CatmullRomCurve3([[-70 * d, 19, 82], [-48 * d, 11.5, 55], [-31 * d, 5.4, 31], [-13 * d, 2.4, 11], [5 * d, 1.9, 5], [23 * d, 2.8, 10], [39 * d, 7, 31], [48 * d, 12, 55], [60 * d, 20, 80]].map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const bm = new THREE.Matrix4(), br = new THREE.Matrix4(), bp = new THREE.Vector3(), bt = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const bsize = opts.swallowScale ?? 2.2;
  const wagAt = [new THREE.Vector3(-3.6 * d, 0.37, 53.6), new THREE.Vector3(-6.4 * d, 0.37, 52.4)];
  const placeBirds = (k, time) => {
    let vis = 0;
    if (cast.wagtails) {                               // k < 0.7: walking and wagging on the lacquer's edge; then up and out over the garden
      const tf = clamp((k - 0.7) / 0.75, 0, 1);
      SH.uFlap.value = smoothstep(0, 0.06, tf);
      for (let i = 0; i < 2; i++) {
        const t = clamp(tf * 1.25 - i * 0.12, 0, 1), w = wagAt[i], yaw = (i ? -0.5 : 0.4) * d + PI * 0.9 + 0.5 * Math.sin(time * 0.6 + i * 2);
        bp.set(w.x + 0.9 * Math.sin(time * 0.5 + i * 3) + t * (16 + 34 * t) * d * (i ? 1 : 0.7), w.y + t * (5 + 9 * t) + 0.08 * Math.abs(Math.sin(time * 6 + i)) * (1 - t), w.z + 0.5 * Math.sin(time * 0.37 + i) + t * t * 44);
        bm.makeRotationY(lerp(yaw, 0.6 * d, smoothstep(0, 0.25, t)));
        br.makeRotationX((0.22 * Math.sin(time * 9 + i * 1.7) - 0.15) * (1 - smoothstep(0, 0.1, t)) - 0.25 * smoothstep(0, 0.2, t)); bm.multiply(br);
        if (bsize !== 1) bm.scale(_s.set(bsize, bsize, bsize));
        bm.setPosition(bp); birds.setMatrixAt(i, t < 1 ? bm : ZERO);
      }
      birds.instanceMatrix.needsUpdate = true; birds.visible = tf < 1;
      return;
    }
    for (let i = 0; i < 2; i++) {
      const ki = k - i * 0.055;
      if (!(ki > 0 && ki < 1)) { birds.setMatrixAt(i, ZERO); continue; }
      curve.getPoint(ki, bp); curve.getTangent(ki, bt);
      if (i) bp.add(_p.set(2.4 * d, 0.5, -2.6));
      bp.y += Math.sin(time * 2.3 + i * 2) * 0.12;
      bm.lookAt(_p.copy(bp).add(bt), bp, UP);
      br.makeRotationZ(Math.sin(ki * 6.283 + i) * 0.45); bm.multiply(br);
      if (bsize !== 1) bm.scale(_s.set(bsize, bsize, bsize));
      bm.setPosition(bp); birds.setMatrixAt(i, bm); vis++;
    }
    birds.instanceMatrix.needsUpdate = true; birds.visible = vis > 0;
  };

  // ---------------------------------------------------------------- anchors, controls
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    entry: { position: V3(0, 7, ZB), facing: V3(0, 0, 1) },
    flyThrough: [V3(0, 7, -72), V3(0, 7, ZB), V3(0, 6.7, -20), V3(0, 6.5, 12), V3(0, 6.5, 44), V3(0, 6.5, ZV), V3(0, 6.4, ZE + 0.5), V3(-4 * side, 4.5, 84), V3(-9 * side, 2.6, 100), gardenExit.clone()],
    mirrorFrame: { position: V3(0, 6.5, 8), lookAt: V3(0, 5.5, 80) },
    postsFront: POSTS_X.map((x) => V3(x, 0, 55)),
    opening: { min: V3(-HW, 0, ZV), max: V3(HW, EAVE, ZV) }, eaveEdge: { z: ZE, y: EAVE },
    swallowCross: V3(0, 1.9, 6), cushion: cush.clone(), teaBowl: bowl.clone(), incense: V3(inc.x, 1.9, inc.z),
    umbrella: umb.clone(), sandals: V3(ux + 0.6, GY + 3.5, 59.6), blind: V3(blindX, 16, 56), windBells: bells,
    rainChains: chains, dripLine: [V3(DRIP_X0, EAVE + 0.25, ZE + 0.45), V3(-DRIP_X0, EAVE + 0.25, ZE + 0.45)],
    gardenExit, portalHint: { direction: V3(-0.34 * side, 0, 0.94) }, maples,
  };
  let progress = null, swK = null;
  const uSw = opts.uSwallow ?? 0.29, uMirOff = opts.uMirrorOff ?? 0.47;
  const v2 = new THREE.Vector2(), camL = new THREE.Vector3(), v3 = new THREE.Vector3();
  const col = (c) => (c && c.isColor ? c : new THREE.Color(c));

  const api = {
    object, radius: 80, height: 63, center: V3(0, 9, 6), anchors, mirror, ground: false, groundY: GY,
    season, hour, side, rainW, hillAt, pondM, solidMat, triangles: Math.round(triangles), uniforms: SH,
    setProgress(u) { progress = u; swK = (u - uSw) / 0.08; },
    setSwallows(k) { swK = k; },
    setSky(zenith, horizon, level = 1) {
      if (zenith) { SH.uZen.value.copy(col(zenith)).multiplyScalar(level); SH.uSky.value.copy(SH.uZen.value); }
      if (horizon) { SH.uHor.value.copy(col(horizon)).multiplyScalar(level); SH.uMistCol.value.copy(SH.uHor.value); }
    },
    setMist(density, color) { SH.uMist.value = density; if (color) SH.uMistCol.value.copy(col(color)); },
    update(dt, time, camera) {
      SH.uTime.value = time; MU.uMirWet.value.w = time; SH.uSunA.value.w = time;
      object.updateWorldMatrix(true, false);
      invObj.copy(object.matrixWorld).invert(); SH.uInv.value.copy(invObj);
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(v2); if (v2.y > 0) SH.uViewH.value = v2.y; }
      placeBirds(swK != null ? swK : ((time / 9) % 1) * 1.5 - 0.25, time);
      mirrorRoot.visible = mirrorOn && (progress == null || progress < uMirOff);
      if (mirrorRoot.visible) for (const t of twins) { if (t.userData.live) syncTwin(t); else t.visible = t.userData.src.visible; }
    },
    dispose() { if (SH.uShade.value) SH.uShade.value.dispose(); },
  };

  api.update(0, 0, null);
  return api;
}
