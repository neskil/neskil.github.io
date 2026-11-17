// HERO SET PIECE for "ember-moon-tide" (The Ember Moon, 4.5 billion years ago).
// "The Moon answering the sea": the coal-red young Moon (8 degrees wide, cracked, rafted, thin crescent) over
// THE GATE: a patch of black glass crust that the tide tears into plates. Two slabs rear 28 m either side of
// the flight line with their glowing ribbed, dripping undersides toward the camera, a third plate tips and
// founders, a dozen more rock and flood, a fountain throws heavy gold arcs along the lead at left.
// The exit TENT (wreckage: a 100 x 54 m slab overtopping a shorter, steeper one that props it, a broken plate
// fallen across the far end, all on one black raft) is exported as buildTent().
//
// FRAME   origin = flight line at sea level in the middle of the gate, +Y up. The camera arrives from +Z flying
//         toward -Z; the Moon stands dead ahead in local -Z, centre 6 degrees up. Sea level is local y = 0.
// SIZE    crust patch an ellipse 152 x 178 m (centre z +14), sea disc 260 m, gate crests 28 m, fountain ~50 m.
//         Reported radius 130, height 34 (the viewer's orbit); patchRadius 180.
// OPTS    palette  (7 hex strings, brief order)      detail   0.6..1 (thins drops, drips, spatter, embers)
//         moon     false to leave the Moon out (if the world draws its own with MOON_GLSL)
//         moonPhase 'crescent' | 'half' | 'unlit' (default seeded: mostly crescent)
//         crust    'glass' | 'ash' | 'young' (default seeded: mostly glass)
//         seaRadius (default 260; pass 0 to drop the sea disc and float the plates on the world's own sea)
// PROGRESS hero.setProgress(p), p 0..1, NEVER wall clock: 0 = closed black crust, hairline red joints, the Moon's
//         glitter road on the glass; 0.1-0.3 joints widen to metres of light, the tipper (the plate on the line at
//         z +100) stands 40 degrees, hinge yawed 12 degrees so its far-left corner is highest and its glass top turns
//         to the arriving camera; by 0.5 it has flooded from the right and is under;
//         0.2-0.6 the two gate slabs rear to 28 m; 0.6-0.85 the gate at full height (fly through here), fountains
//         up from 0.3-0.5; 0.55-1 other plates flood and sink, the floor turns gold with black skin.
//         For the brief: p = (u - 0.36) / 0.30 (u 0.42 tipper up, 0.50 under, 0.58 gate, 0.66 gold).
//         Until setProgress() is called the piece plays itself on a 40 s loop (for the set-piece viewer only).
//         hero.setEarthGlow(g) 0..1 warms the Moon's rafts (#5A1A16 -> #7A2418); otherwise progress drives it.
// ANCHORS (local) flyThrough: camera line at 16 m through the gate, eases 6 m left then right, >= 14 m from the
//         gate slabs at p >= 0.6 (do not cross z +150..+50 before p 0.5: the tipper stands there);
//         gateLeft / gateRight: the two crest tips at full height; tipper: centre of the tipping plate;
//         fountain (+ fountainHeight), fountain2: fountain bases; moonDir: unit vector to the Moon;
//         patchCentre, patchRadiusX/Z: the ellipse of crust this piece replaces (leave the world's plates out of
//         it, or let them overlap its rim by a few metres); viewpoints: three good cameras (fov 22).
//         buildTent() returns its own anchors: portalSeat {position, facing}, mouth, crest, flyThrough, viewpoints.
// ALSO    hero.uniforms.moon (uMoonDir/uMoonRight/uMoonUp are kept in WORLD space by update(); uEarthGlow, uMoonT),
//         hero.uniforms.shared (uTime, uSeaY, uOpen, uFount...), hero.moon / sea / fountains / plates / slabMaterial.
// COST    hero ~93k triangles, 23 draw calls (18 plates, Moon, sea, fountain drops + cores, drips), no lights,
//         one 384 px RGBA8 texture, build ~0.5 s in yielded steps. Tent ~32k triangles, 4 draw calls.
// LIGHT   self-lit: every material is a ShaderMaterial carrying the brief's three sources (the sea's glow from
//         below, the Moon's red reflection and key from uMoonDir, the cool crescent rim from ahead-left) and scene
//         fog; scene lights are ignored. Wants a night sky (#08070A), bloom about 0.8 on values above 1.2, and a
//         thin garnet haze. Hottest values ~3 (wall feet, fountain cores, lead cores); the open sea stays under 1.
// EXPORTS buildHero, buildTent, MOON_GLSL (the Moon as a GLSL function of a disc uv, for a sky or a reflection),
//         makeSlabGeometry (thick-edged plate from any outline), makeSlabMaterial, makeFountains, bakeMoonTexture.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PALETTE = ['#08070A', '#2A1418', '#8E1F14', '#E8611C', '#FFC65A', '#FFF3D0', '#B9B4C8'];
const MOON_ELEV = 6 * Math.PI / 180, MOON_HALF = 4 * Math.PI / 180;
const FREEBOARD = 1.2, THICK = 4.0, TIP_YAW = 12 * Math.PI / 180;

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1.,0.)), f.x), mix(hash21(i+vec2(0.,1.)), hash21(i+vec2(1.,1.)), f.x), f.y); }
float fbm3(vec2 p){ float a = .5, s = 0.; s += a*vnoise(p); p = p*2.03+17.1; a *= .5; s += a*vnoise(p); p = p*2.01+9.7; a *= .5; s += a*vnoise(p); return s / .875; }
// crust that froze in polygons: x = distance to the nearest cell centre, y = 0 on the joint between two cells rising into each, z = the cell's own random number
// (polish 3) Not every joint is open: four in ten pairs of neighbours froze together, so the net is irregular blocks of one
// to four cells with cracks that end at junctions, not a honeycomb. The pair's number is symmetric (the sum of the two cells).
vec3 voro(vec2 p){ vec2 i = floor(p), f = fract(p); float f1 = 9., f2 = 9., id = 0.; vec2 c1 = vec2(0.), c2 = vec2(0.);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), c = i + g;
    float d = length(g + 0.12 + 0.76 * vec2(hash21(c), hash21(c + 17.3)) - f);
    if (d < f1) { f2 = f1; c2 = c1; f1 = d; c1 = c; id = hash21(c + 5.7); } else if (d < f2) { f2 = d; c2 = c; } }
  float fused = step(hash21(c1 + c2 + 0.37), 0.40);
  return vec3(f1, mix(f2 - f1, 1., fused), mix(id, hash21(c1 + c2 + 9.1), fused * 0.5)); }
`;

// The tide: one swell, crest line across the heading (-Z), everything rides it. uSwell = (crest distance along -Z in
// WORLD space, amplitude m, half width foot to crest m, rake = metres of crest shift per metre of +x). Amplitude 0 = flat.
export const SWELL_GLSL = /* glsl */`
uniform vec4 uSwell;
float swellS(vec2 xz){ return -xz.y - uSwell.x + uSwell.w * xz.x; }
float swellH(vec2 xz){ return uSwell.y * 0.5 * (1. + cos(3.14159265 * clamp(swellS(xz) / max(uSwell.z, 1.), -1., 1.))); }
`;
const noSwell = () => ({ value: new THREE.Vector4(0, 0, 625, 0) });

// The Moon as a function of a point on its disc (uv in -1..1, +v up). Returns rgb (linear HDR) and coverage.
// Needs: uMoonTex (R crack distance, G raft field, B slow mottle, A fine grain), uMoonT (seconds),
// uEarthGlow 0..1, uMoonSun (unit vec3 in the Moon's frame: x right, y up, z toward us), uMoonCol[6].
export const MOON_GLSL = /* glsl */`
uniform sampler2D uMoonTex; uniform float uMoonT; uniform float uEarthGlow; uniform vec3 uMoonSun;
uniform vec3 uMoonCol[6]; // ember, crack, raft cold, raft warm, crescent cool, crescent hot
uniform vec4 uMoonScar;   // rare event: disc uv of a strike (xy), scar radius in disc units (z), spark 0..1 (w)
vec4 moonShade(vec2 uv, float lod){
  float r2 = dot(uv, uv);
  float r = sqrt(max(r2, 0.));
  float nz = sqrt(max(1. - r2, 0.));
  vec3 n = vec3(uv, nz);
  // heat shimmer on the lowest degree of the disc
  float low = smoothstep(-0.70, -1.0, uv.y);
  vec2 w = uv + low * vec2(sin(uv.y * 70. + uMoonT * 2.3) * 0.012, sin(uv.x * 46. - uMoonT * 1.7) * 0.006);
  // sphere mapping: texture radius follows the angle from the disc centre, so features crowd toward the limb
  float rr = clamp(length(w), 0., 0.9995);
  float k = rr < 1e-3 ? 1. : asin(rr) / rr;
  float dr = uMoonT * 0.0016, cd = cos(dr), sd = sin(dr);                 // the face drifts a few degrees in a flight
  vec2 tuv = mat2(cd, -sd, sd, cd) * (w * k) * (0.5 / 1.5708) * 0.94 + 0.5;
  vec4 t = textureLod(uMoonTex, tuv, lod);
  float limb = 0.22 + 0.78 * pow(max(nz, 0.), 0.6);
  // cracks open and heal: the width threshold breathes with a phase that varies slowly across the face
  float ph = t.b * 6.2832 * 2.;
  float open = 0.5 + 0.5 * sin(uMoonT * 0.21 + ph);
  float wdt = mix(0.02, 0.11, open * open);
  float crack = 1. - smoothstep(wdt * 0.25, wdt, t.r);
  float halo = 1. - smoothstep(0., wdt * 3.2 + 0.05, t.r);
  // rafts of new crust: threshold drifts a little so their shores creep
  float rth = 0.47 + 0.03 * sin(uMoonT * 0.13 + ph * 0.5);
  float raft = smoothstep(rth, rth + 0.035, t.g);
  float shore = smoothstep(rth - 0.10, rth, t.g) * (1. - raft);
  crack *= 1. - raft * 0.85; halo *= 1. - raft;
  vec3 ember = uMoonCol[0] * (0.50 + 0.55 * t.a + 0.55 * t.b);
  ember += uMoonCol[1] * halo * 0.12 * (0.4 + open);
  ember += uMoonCol[1] * shore * 0.30;
  vec3 raftC = mix(uMoonCol[2], uMoonCol[3], uEarthGlow) * (0.55 + 0.5 * t.a);
  vec3 col = mix(ember, raftC, raft * 0.95);
  col += uMoonCol[1] * crack * (0.35 + 1.1 * open);
  // a strike on the dark face: the crust founders outward from the point, ragged at its edge, hot in the middle
  float sdist = length(uv - uMoonScar.xy), sr = max(uMoonScar.z, 1e-4);
  float scar = (1. - smoothstep(sr * 0.5, sr, sdist + (t.a - 0.5) * sr * 0.7)) * step(1e-3, uMoonScar.z);
  col = mix(col, uMoonCol[1] * (0.9 + 0.9 * t.b) + uMoonCol[5] * 0.5 * (1. - smoothstep(0., sr * 0.5, sdist)), scar * (1. - 0.45 * raft));
  col += uMoonCol[1] * 0.5 * scar * (1. - smoothstep(0., 0.05, abs(sdist - sr * 0.8 + (t.a - 0.5) * sr * 0.7)));
  col += uMoonCol[5] * 3.0 * uMoonScar.w * exp(-sdist * sdist / 0.0016);
  col *= limb;
  // sunlit part: fixed sun direction, bone-violet run hot at the limb
  float sun = max(dot(n, uMoonSun), 0.);
  float cres = smoothstep(0.0, 0.42, sun);
  vec3 cc = mix(uMoonCol[4], uMoonCol[5], smoothstep(0.25, 0.9, sun)) * (0.55 + 1.5 * sun) * (0.8 + 0.4 * t.a) * mix(0.42, 1.0, clamp(-uMoonSun.z / 0.7, 0., 1.));
  col = mix(col, cc, cres);
  float cov = 1. - smoothstep(0.985, 1.0, r);
  return vec4(col, cov);
}
`;

function moonColours(pal) {
  const c = (h) => new THREE.Color(h);
  return [c(pal[2]).multiplyScalar(1.05), c(pal[3]).multiplyScalar(1.25), c('#5A1A16').multiplyScalar(0.8),
    c('#7A2418').multiplyScalar(1.1), c(pal[6]).multiplyScalar(1.0), c(pal[5]).multiplyScalar(1.25)];
}

// ---------------------------------------------------------------- the Moon's face, baked once (512 RGBA8)
// R: distance to the nearest crack (two nets), G: raft field (rafts above ~0.5), B: slow mottle / phase, A: grain.
export async function bakeMoonTexture(ctx, size = 512) {
  const rng = ctx.rng.fork('moonface'), nz = ctx.noise;
  const mk = (G) => { const a = new Float32Array(G * G * 3); for (let i = 0; i < G * G; i++) { a[i * 3] = 0.12 + 0.76 * rng(); a[i * 3 + 1] = 0.12 + 0.76 * rng(); a[i * 3 + 2] = rng(); } return a; };
  const G1 = 9 + rng.int(0, 3), G2 = 23 + rng.int(0, 5), G3 = 10 + rng.int(0, 2);
  const T1 = mk(G1), T2 = mk(G2), T3 = mk(G3);
  const ox = rng.range(0, 50), oy = rng.range(0, 50);
  const out = [0, 0, 0];
  const vor = (T, G, u, v) => { // F1, F2 (in cell units) and the nearest cell's random value
    const x = u * G, y = v * G, cx = Math.floor(x), cy = Math.floor(y);
    let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j; if (gx < 0 || gy < 0 || gx >= G || gy >= G) continue;
      const k = (gy * G + gx) * 3, dx = gx + T[k] - x, dy = gy + T[k + 1] - y, d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; id = T[k + 2]; } else if (d < f2) f2 = d;
    }
    out[0] = Math.sqrt(f1); out[1] = Math.sqrt(f2); out[2] = id;
  };
  const data = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    if (py % 5 === 0) await ctx.yield();
    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size, v = (py + 0.5) / size;
      const wx = nz.n2(u * 5 + ox, v * 5 + oy) * 0.022, wy = nz.n2(u * 5 + oy + 9, v * 5 + ox) * 0.022; // warp so edges are not ruled
      const uu = clamp(u + wx, 0, 0.9999), vv = clamp(v + wy, 0, 0.9999);
      vor(T1, G1, uu, vv); const d1 = out[1] - out[0];
      vor(T2, G2, uu, vv); const d2 = (out[1] - out[0]) * 0.75 + 0.07;
      vor(T3, G3, uu, vv); const isRaft = out[2] < 0.42, d3 = out[1] - out[0];
      const mott = 0.5 + 0.5 * nz.fbm2(u * 3.1 + ox, v * 3.1 - oy, 3);
      const grain = 0.5 + 0.5 * nz.fbm2(u * 26 - ox, v * 26 + oy, 3);
      const raft = isRaft ? 0.44 + d3 * 0.9 + (grain - 0.5) * 0.16 : 0.30 - d3 * 0.3 + (grain - 0.5) * 0.10;
      const o = (py * size + px) * 4;
      data[o] = clamp(Math.min(d1, d2) * 1.5, 0, 1) * 255;
      data[o + 1] = clamp(raft, 0, 1) * 255;
      data[o + 2] = clamp(mott, 0, 1) * 255;
      data[o + 3] = clamp(grain, 0, 1) * 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// Shared Moon uniforms (the slabs' glass skin reflects the same Moon the sky shows).
function makeMoonUniforms(tex, pal, phase) {
  const sun = phase === 'half' ? new THREE.Vector3(-0.95, -0.28, 0.06) : phase === 'unlit' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(-0.50, -0.56, -0.70);
  return {
    uMoonTex: { value: tex }, uMoonT: { value: 0 }, uEarthGlow: { value: 0 }, uMoonSun: { value: sun.normalize() },
    uMoonCol: { value: moonColours(pal) }, uMoonScar: { value: new THREE.Vector4(0.2, 0.2, 0, 0) },
    uMoonDir: { value: new THREE.Vector3(0, Math.sin(MOON_ELEV), -Math.cos(MOON_ELEV)) },
    uMoonRight: { value: new THREE.Vector3(1, 0, 0) }, uMoonUp: { value: new THREE.Vector3(0, Math.cos(MOON_ELEV), Math.sin(MOON_ELEV)) },
  };
}

function buildMoon(moonU, dist) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...moonU, uDist: { value: dist }, uHalf: { value: Math.tan(MOON_HALF) * dist * 1.3 } },
    transparent: true, depthWrite: false, fog: false,
    vertexShader: /* glsl */`
      uniform vec3 uMoonDir, uMoonRight, uMoonUp; uniform float uDist, uHalf; varying vec2 vUv;
      void main(){ vUv = position.xy;
        vec3 wp = cameraPosition + uMoonDir * uDist + (uMoonRight * position.x + uMoonUp * position.y) * uHalf;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      ${MOON_GLSL}
      void main(){ vec2 uv = vUv * 1.3; vec4 m = moonShade(uv, 0.);
        // a faint ember halo just outside the limb so the disc sits in thin vapour, not cut out of card
        float r = length(uv);
        float halo = exp(-max(r - 0.985, 0.) * 13.) * (1. - smoothstep(1.2, 1.3, r));
        vec3 hc = uMoonCol[0] * 0.22 * halo;
        gl_FragColor = vec4(mix(hc, m.rgb, m.a), max(m.a, halo * 0.55)); }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -0.5; mesh.name = 'emberMoon';
  return mesh;
}

// ---------------------------------------------------------------- a thick-edged plate from an outline
// outline: [[x,z],...] closed, about 0.5-1.2 m between points, in the plate's own frame (pivot at 0,0).
// Local y: top skin at +FREEBOARD, bottom at FREEBOARD-THICK, so local y = 0 is the waterline of a plate at rest.
// aSlab = (part, e, s): part 0 top / 1 lip+wall / 2 underside; e = metres in from the edge (top, underside) or
// height fraction 0 bottom..1 top (wall); on the underside s = o.ribDir, the angle of its ribs from local +x; s = rib profile, 0 in the groove between two cooling ribs, 1 on a rib's crest (ribs are ~1 m wide).
export function makeSlabGeometry(outline, o = {}) {
  const ribDir = o.ribDir ?? 0, rng = o.rng, thick = o.thick ?? THICK, top = o.freeboard ?? FREEBOARD, bot = top - thick, ribW = o.ribW ?? 1.0;
  let P = outline.map((p) => [p[0], p[1]]);
  let area = 0; const N = P.length;
  for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; area += a[0] * b[1] - b[0] * a[1]; }
  if (area < 0) P.reverse();
  let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= N; cz /= N;
  // outward normals and arc length
  const nx = new Float32Array(N), nzv = new Float32Array(N), arc = new Float32Array(N); let per = 0;
  for (let i = 0; i < N; i++) {
    const a = P[(i + N - 1) % N], b = P[(i + 1) % N]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    nx[i] = tz; nzv[i] = -tx; arc[i] = per; const c = P[i]; per += Math.hypot(b[0] - c[0], b[1] - c[1]);
  }
  const nRib = Math.max(3, Math.round(per / ribW));
  const pos = [], att = [], idx = [];
  const ring = (fn) => { const s = pos.length / 3; for (let i = 0; i < N; i++) fn(i); return s; };
  const put = (x, y, z, part, e, s) => { pos.push(x, y, z); att.push(part, e, s); };
  const stitch = (a, b) => { for (let i = 0; i < N; i++) { const j = (i + 1) % N; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); } };
  const ringW = (fn) => { const s = pos.length / 3, m = o.shaderRibs ? N + 1 : N; for (let i = 0; i < m; i++) fn(i % N, i); return s; };
  const stitchW = (a, b) => { if (!o.shaderRibs) return stitch(a, b); for (let i = 0; i < N; i++) idx.push(a + i, a + i + 1, b + i, a + i + 1, b + i + 1, b + i); };
  const fanTo = (a, c) => { for (let i = 0; i < N; i++) idx.push(a + i, a + (i + 1) % N, c); };
  const parts = [];
  // per-point lip chips (cut-backs of the glass lip) and rib phase
  const chip = new Float32Array(N), ribIn = new Float32Array(N), wob = new Float32Array(N), ribF = new Float32Array(N);
  let ci = 0, cd = 0;
  for (let i = 0; i < N; i++) {
    if (ci <= 0 && rng() < 0.05) { ci = 1 + Math.floor(rng() * 4); cd = 0.15 + rng() * 0.5; }
    chip[i] = ci > 0 ? cd * (0.6 + 0.4 * rng()) : rng() * 0.05; ci--;
    const sr = (arc[i] / per) * nRib; const f = Math.abs(Math.sin(sr * Math.PI)); // 0 in the groove, 1 on the rib crest
    ribIn[i] = o.shaderRibs ? 0.1 : (1 - f) * 0.32; ribF[i] = o.shaderRibs ? -1 : f; wob[i] = (rng() - 0.5) * 0.12;
  }
  const inset = (i, d) => { // toward the centroid, never past it
    const p = P[i], dx = cx - p[0], dz = cz - p[1], l = Math.hypot(dx, dz) || 1, k = Math.min(d, l * 0.92) / l; return [p[0] + dx * k, p[1] + dz * k];
  };
  const off = (i, d) => [P[i][0] - nx[i] * d, P[i][1] - nzv[i] * d]; // d metres inward along the outline normal
  // --- top skin: edge ring, three inset rings, centre
  let i0 = idx.length;
  const TR = [0.0, 0.7, 2.4, 7.0];
  const tr = TR.map((d, k) => ring((i) => { const q = k === 0 ? off(i, chip[i]) : inset(i, d + chip[i]); put(q[0], top - (k === 0 ? 0.05 : 0) + (k > 1 ? wob[i] * 0.5 : 0), q[1], 0, d, ribF[i]); }));
  for (let k = 0; k < tr.length - 1; k++) stitch(tr[k], tr[k + 1]);
  put(cx, top, cz, 0, 30, 0); fanTo(tr[tr.length - 1], pos.length / 3 - 1);
  parts.push([i0, idx.length, 0]);
  // --- lip and wall: one smooth strip down the side. rows: [y, inward offset, rib amount, v]
  i0 = idx.length;
  const ROWS = [[top - 0.05, 0.0, 0, 1.0], [top - 0.14, -0.05, 0, 0.97], [top - 0.30, 0.03, 0, 0.93], [top - 0.36, 0.30, 0.5, 0.90],
    [top - 1.3, 0.22, 1, 0.66], [top - 2.3, 0.10, 1, 0.42], [top - 3.2, 0.34, 0.8, 0.2], [bot, 0.85, 0.4, 0.0]];
  const M = o.shaderRibs ? N + 1 : N;
  const wr = ROWS.map((r, k) => ringW((i, ii) => { const d = r[1] + (k < 3 ? chip[i] : Math.max(chip[i] - 0.2, 0) * 0.4) + ribIn[i] * r[2] + (k > 2 ? wob[i] : 0); const q = off(i, d); put(q[0], (k < 4 ? r[0] : top - (top - r[0]) * (thick / THICK)) + (k > 3 && k < 7 ? wob[(i * 7) % N] : 0), q[1], 1, r[3], o.shaderRibs ? -1 - (ii < N ? arc[ii] : per) / per * nRib : ribF[i]); }));
  for (let k = 0; k < wr.length - 1; k++) stitchW(wr[k], wr[k + 1]);
  parts.push([i0, idx.length, 1]);
  // --- underside: edge ring, two inset rings, centre; sags a little toward the middle
  i0 = idx.length;
  const UR = [0.85, 2.5, 8.0];
  const ur = UR.map((d, k) => ring((i) => { const q = k === 0 ? off(i, d + ribIn[i] * 0.4 + wob[i]) : inset(i, d); put(q[0], bot - (k > 0 ? 0.15 + wob[i] : 0), q[1], 2, d, ribDir); }));
  for (let k = 0; k < ur.length - 1; k++) stitch(ur[k], ur[k + 1]);
  put(cx, bot - 0.3, cz, 2, 30, ribDir); fanTo(ur[ur.length - 1], pos.length / 3 - 1);
  parts.push([i0, idx.length, 2]);
  // orient each part: top faces +Y, underside -Y, wall away from the centroid
  for (const [a, b, kind] of parts) {
    let s = 0;
    for (let t = a; t < Math.min(b, a + 600); t += 3) {
      const A = idx[t] * 3, B = idx[t + 1] * 3, C = idx[t + 2] * 3;
      const ux = pos[B] - pos[A], uy = pos[B + 1] - pos[A + 1], uz = pos[B + 2] - pos[A + 2], vx = pos[C] - pos[A], vy = pos[C + 1] - pos[A + 1], vz = pos[C + 2] - pos[A + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      s += kind === 0 ? fy : kind === 2 ? -fy : fx * (pos[A] - cx) + fz * (pos[A + 2] - cz);
    }
    if (s < 0) for (let t = a; t < b; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSlab', new THREE.Float32BufferAttribute(att, 3));
  g.setIndex(pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  g.computeVertexNormals();
  g.userData = { centre: [cx, cz], perimeter: per, tris: idx.length / 3 };
  return g;
}

// ---------------------------------------------------------------- slab material (self-lit, fogged, instancing-safe)
// shared: { uTime, uSeaY, uOpen } uniform objects driven by the hero; moonU from makeMoonUniforms().
// o.heat: underside heat (1 = glowing ribbed ceiling, 0.1 = cooled garnet-black with only drip lines lit),
// o.ash: grey ash dusting on the top skin 0..1, o.rough: glass roughness (0.06 = long glitter road),
// o.threads: 1 = old raft top with long red joints and cooling spatter (the tent's floor),
// o.wallHeat: 0..1 how hot the edge walls run (tent 0.42), o.mirror: strength of the Moon's reflection (uniform uMirror),
// o.drip: 1 = the tent's cooled undersides (rock in slabs, gold light through the joints; uniform uDrip), o.stretch: how much
// shorter the underside's coordinate runs along local z (0.42 on the tent's side slabs, seen along their length),
// uVent (uniform, vec4 world x, z, radius, strength): one place where the shut skin is lit from below,
// o.sheen: how much of the night sky and horizon glow the glass skin mirrors (uniform uSheen, 0 in the viewer),
// o.uniforms / o.xformPars / o.xformMain: a world's own per-plate motion, GLSL run on lp, n, lpos and open before the swell lifts the vertex.
export function makeSlabMaterial(moonU, shared, pal, o = {}) {
  const c = (h, k = 1) => ({ value: new THREE.Color(h).multiplyScalar(k) });
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsLib.fog, ...moonU, ...(o.uniforms || {}), uTime: shared.uTime, uSeaY: shared.uSeaY, uOpen: shared.uOpen, uSwell: shared.uSwell || (shared.uSwell = noSwell()),
      uHeat: { value: o.heat ?? 1 }, uAsh: { value: o.ash ?? 0 }, uRough: { value: o.rough ?? 0.06 }, uRibW: { value: o.ribW ?? 1 }, uThreads: { value: o.threads ?? 0 }, uWallHeat: { value: o.wallHeat ?? 1 }, uMirror: { value: o.mirror ?? 1 }, uSheen: { value: o.sheen ?? 0 }, uDrip: { value: o.drip ?? 0 }, uStretch: { value: o.stretch ?? 1 },
      uCrescent: { value: new THREE.Vector3(-0.55, 0.25, -0.8).normalize() }, uLamp: { value: new THREE.Vector4(0, 0, 0, 0) },
      uFire: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 1, 0)) }, uStars: { value: o.stars ?? 0 }, uVent: { value: new THREE.Vector4(0, 0, 1, 0) },      // (polish 4) what the glass mirrors beside the Moon: up to four fountains (x, z, height, strength) and the stars
      uBlack: c(pal[0]), uGarnet: c(pal[1]), uRed: c(pal[2]), uOrange: c(pal[3]), uGold: c(pal[4]), uCream: c(pal[5]), uCool: c(pal[6]) },
    vertexShader: /* glsl */`
      attribute vec3 aSlab; varying vec3 vWorld, vN, vSlab, vLocal, vNl; varying float vSeaY, vOpen;
      uniform float uSeaY, uOpen, uTime;
      #include <fog_pars_vertex>
      ${SWELL_GLSL}
      ${o.xformPars || ''}
      void main(){
        vec4 lp = vec4(position, 1.); vec3 n = normal; vec3 lpos = position; float open = uOpen;
        ${o.xformMain || ''}
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
        #endif
        vec4 wp = modelMatrix * lp; float lift = swellH(wp.xz); wp.y += lift; vSeaY = uSeaY + lift; vOpen = open;
        vWorld = wp.xyz; vN = mat3(modelMatrix) * n; vSlab = aSlab; vLocal = lpos; vNl = normal;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uSeaY, uOpen, uHeat, uAsh, uRough, uRibW, uThreads, uWallHeat, uMirror, uSheen, uDrip, uStretch; uniform vec3 uCrescent, uMoonDir, uMoonRight, uMoonUp; uniform vec4 uLamp; uniform vec4 uFire[4]; uniform float uStars; uniform vec4 uVent;
      uniform vec3 uBlack, uGarnet, uRed, uOrange, uGold, uCream, uCool;
      varying vec3 vWorld, vN, vSlab, vLocal, vNl; varying float vSeaY, vOpen;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      ${MOON_GLSL}
      vec3 moonMirror(vec3 R, float lod){ // the Moon seen along a reflected ray
        float d = dot(R, uMoonDir); if (d <= 0.) return vec3(0.);
        vec2 uv = vec2(dot(R, uMoonRight), dot(R, uMoonUp)) / ${Math.sin(MOON_HALF).toFixed(5)};
        if (dot(uv, uv) >= 1.) return vec3(0.);
        vec4 m = moonShade(uv, lod); return m.rgb * m.a; }
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 Vv = cameraPosition - vWorld; vec3 V = Vv / max(length(Vv), 1e-3);
        // With antialiasing on, a far plate thinner than a pixel is shaded at the pixel's centre, which can lie far outside
        // the triangle: its varyings are then extrapolated, and an edge distance of minus many metres sent exp() to infinity
        // (one such sample turned the whole picture white through the resolve and the glow). So every varying that feeds
        // exp() or an unbounded sum is clamped to the range it has inside a triangle (use e and openC below, never
        // vSlab.y or vOpen directly), and the result is bounded. KEEP THIS: tools/dt/aacheck.mjs tests it.
        float h = vWorld.y - vSeaY, part = vSlab.x, e = max(vSlab.y, 0.), rib = vSlab.z, openC = clamp(vOpen, 0., 1.);
        float seaLit = exp(-max(h, 0.) / 7.);
        // rib coordinates and how fast they run across the screen, taken here, outside every branch: ribs finer than
        // about three pixels melt into their mean instead of shimmering
        float cua = cos(vSlab.z), sua = sin(vSlab.z);
        float lzS = vLocal.z * uStretch;      // (polish 5) the tent's side slabs are seen along their length, at a glancing angle: their crust broke in slabs longer that way (uStretch 0.42), so from the approach the net reads as polygons and not as parallel strokes
        vec2 uq = vec2(cua * vLocal.x + sua * lzS, -sua * vLocal.x + cua * lzS);          // underside: ribs run along uq.x
        vec2 uc = uq / 7.0 + (vec2(vnoise(uq * 0.045 + 3.), vnoise(uq * 0.045 + 41.)) - .5) * 1.3;     // underside: slabs of crust about 7 m across, their joints bent
        float uFw = fwidth(uc.x) + fwidth(uc.y), uKeep = 1. - smoothstep(0.16, 0.45, uFw), uKeepB = 1. - smoothstep(0.06, 0.17, uFw);
        float wAx = abs(vNl.x) > abs(vNl.z) ? vLocal.z : vLocal.x;      // (polish 4) along the wall, from the position alone: the fluted walls' normals swing from rib to rib, and a tangent taken from them tore the blocks into vertical streaks
        vec2 wq = vec2(wAx / 2.0, vLocal.y / 1.3);                                                     // wall: fracture blocks about 2 m by 1.3 m
        float wFw = fwidth(wq.x) + fwidth(wq.y), wKeepB = 1. - smoothstep(0.38, 0.95, wFw);      // (polish 4) the blocks hold to about 350 m: their joints widen to the pixel (below), so a far wall is still broken rock and not an even orange band
        float wKeep = 1. - smoothstep(0.22, 0.55, fwidth(vSlab.z));
        vec3 Rt0 = reflect(-V, N); float fs0 = 0.22 + 0.78 * (1. - clamp(dot(N, V), 0., 1.)) * (1. - clamp(dot(N, V), 0., 1.));
        vec2 sFw = fwidth(vec2(Rt0.x / max(abs(Rt0.z), 0.35), Rt0.y / max(length(Rt0.xz), 0.2)) * 85.);      // (polish 4) the mirrored stars: how wide a pixel is in their cells
        float eFw = min(fwidth(vSlab.y), 8.);      // (polish 5) how many metres of the rim coordinate one pixel covers: a shut joint thinner than the pixel is not drawn as a ruled line
        float tFw = min((fwidth(vLocal.x) + fwidth(vLocal.z)) / 9.0, 0.5);      // (polish 5) the top skin's sheets: how much of a sheet one pixel covers                                                                    // drip lines (the tent): how wide a pixel is across them
        float gGain = 0.7;
        if (rib < -0.5) { // ribs from the perimeter coordinate: columns of unequal width, not every joint alight, fading before they alias
          float rcw = -rib - 1.; rcw += 0.32 * sin(rcw * 1.7) + 0.24 * sin(rcw * 0.61 + 2.);
          gGain = 0.12 + 0.88 * hash21(vec2(floor(rcw), 3.)); rib = mix(0.62, abs(sin(rcw * 3.14159)), wKeep); }
        rib = clamp(rib, 0., 1.);
        vec3 col;
        if (part < 0.5) {
          // black glass skin: a rough mirror for the Moon (the glitter road), glow bleeding in from every edge
          vec2 q = vLocal.xz;
          float n1 = fbm3(q * 0.33), n2 = vnoise(q * 2.3);
          vec3 pn = vec3(vnoise(q * 1.3 + 3.1) - .5 + (vnoise(q * 6.1) - .5) * .6, 0., vnoise(q * 1.3 + 11.7) - .5 + (vnoise(q * 6.1 + 5.) - .5) * .6);
          float tw = uTime * 0.55 + vnoise(q * 0.7 + 9.) * 12.; pn += vec3(sin(tw), 0., cos(tw * 0.83 + 1.7)) * 0.24;   // heat off the crust: the glitter shimmers in place
          vec3 vT = voro(q / 9.0 + (vec2(vnoise(q * 0.05 + 3.), vnoise(q * 0.05 + 41.)) - .5) * 1.6 + (vec2(vnoise(q * 0.31 + 7.), vnoise(q * 0.31 + 23.)) - .5) * 0.30);   // sheets about 9 m across, edges wandering     // the skin froze in sheets about 6 m across
          vec3 fn = vec3(hash21(vec2(vT.z, 1.)) - .5, 0., hash21(vec2(vT.z, 2.)) - .5);                    // each at its own slight tilt
          float fsl = clamp(length(N.xz) / max(N.y, 0.05), 0., 1.);
          vec3 n = normalize(N + (pn * uRough + fn * 0.045) * (1. - 0.7 * uAsh));
          vec3 R = reflect(-V, n);
          float fres = 0.22 + 0.78 * pow(1. - clamp(dot(n, V), 0., 1.), 3.);
          float ml = max(dot(R, uMoonDir), 0.);
          float dv = length(Vv);
          col = uBlack * 1.1 + uGarnet * 0.05 * (0.6 + 0.8 * n1);
          vec3 mm = moonMirror(R, 2.5); mm = mix(mm, min(mm, uRed * 1.1), smoothstep(450., 1100., dv));      // (polish 4) far off the mirror keeps the Moon's red and drops its white limb: a pale half disc on the horizon read as a stray dome
          col += (mm * 1.15 + uMoonCol[0] * 0.30 * pow(ml, 160.)) * fres * (1. - 0.8 * uAsh) * uMirror;
          col += uCool * 0.05 * fres * max(dot(reflect(-V, N), uCrescent), 0.);
          { // (polish 4) THE BLACK MIRROR. Glass mirrors whatever stands over it, not the Moon alone: under every fountain a
            // column of gold glitter runs toward us (the rough skin breaks it, as it breaks the Moon's road), and where the
            // glass looks up past the Moon it carries the stars, each sheet shifting them by its own tilt.
            float rl = max(length(R.xz), 1e-3); vec2 rh = R.xz / rl; float tanE = max(R.y, 0.) / rl; float fireK = 0.;
            for (int i = 0; i < 4; i++) {
              vec2 fd = uFire[i].xy - vWorld.xz; float fl = max(length(fd), 1.); vec2 fdn = fd / fl;
              float sd = rh.x * fdn.y - rh.y * fdn.x, wA = 0.010 + 7. / fl, top = uFire[i].z / fl;
              fireK += exp(-min(sd * sd / (wA * wA), 30.)) * step(0., dot(rh, fdn)) * (1. - smoothstep(top * 0.35, top * 1.1, tanE)) * uFire[i].w * (1. - smoothstep(900., 1500., fl));
            }
            col += (uOrange * 0.5 + uGold * 1.5 + uCream * 0.5) * min(fireK, 1.5) * fres * (1. - 0.8 * uAsh) * uMirror;
            vec3 Rt = reflect(-V, normalize(N + fn * 0.06)); float rz = max(length(Rt.xz), 0.2);
            vec2 suv = vec2(Rt.x / max(abs(Rt.z), 0.35), Rt.y / rz) * 85.; vec2 sid = floor(suv), sf = fract(suv) - 0.5;
            float sh = hash21(sid + 3.1), sb = sh * sh; sb *= sb; sb *= sb;
            vec2 so = (vec2(hash21(sid + 7.7), hash21(sid + 19.3)) - 0.5) * 0.6;
            float sr = clamp(0.8 * (sFw.x + sFw.y), 0.09, 0.30);
            col += mix(vec3(1., 0.86, 0.74), vec3(0.80, 0.84, 1.0), hash21(sid + 5.)) * sb * step(0.60, sh) * (1. - smoothstep(sr * 0.4, sr, length(sf - so))) * min(1., 0.10 / sr + 0.2)
              * 1.1 * uStars * fs0 * smoothstep(0.02, 0.10, Rt.y) * (1. - uAsh) * (0.35 + 0.65 * (1. - openC));
          }
          vec3 Rs = reflect(-V, N); float fs = 0.22 + 0.78 * pow(1. - clamp(dot(N, V), 0., 1.), 3.);                    // from the smooth normal: a sheen, not a glitter
          // the skin is not one sheet of glass: flow bands and patches of duller crust take the horizon's garnet glow differently
          float streak = vnoise(q * vec2(0.07, 0.45) + 31.), gloss = (0.22 + 1.0 * n1 * n1 + 0.45 * streak * streak) * (0.45 + 1.1 * vT.z);
          col += (uBlack * 0.6 + (uGarnet * 0.85 + uRed * 0.07) * (0.15 + 0.85 * exp(-max(Rs.y, 0.) / 0.22))) * fs * uSheen * gloss * (1. - 0.6 * uAsh);
          // crazing: a net of fine cooling cracks, dull red while the crust is hot, never thinner than a pixel
          float cw = max(0.022 + dv * 0.00016, 0.7 * tFw);      // (polish 5) never thinner than the pixel's footprint: at a glancing angle the net is soft bands, not hairlines
          float craze = (1. - smoothstep(cw * 0.35, cw, vT.y)) * min(1., 0.022 / cw + 0.04) * smoothstep(0.6, 3.0, e) * (0.15 + 0.85 * smoothstep(0.35, 0.6, vnoise(q * 0.045 + 17.))) * (0.35 + 0.65 * smoothstep(0.3, 0.55, vnoise(q * 0.4 + 61.)));      // crazed in patches, each crack broken along its length
          float glowIn = exp(-max(vT.y, 0.) / 0.07) * smoothstep(0.6, 3.0, e) * (0.10 + 0.55 * fsl) * openC;          // a standing plate is hot inside: its joints shine
          col = mix(col, uBlack * 0.5, 0.5 * clamp(craze, 0., 1.)) + (uRed * (0.20 + 0.45 * openC + 0.9 * fsl * openC) + uOrange * 0.55 * fsl * openC) * craze * (0.4 + 0.6 * n2) * (1. - 0.7 * uAsh) + uRed * 0.30 * glowIn * (0.5 + n2);
          // fissures: in patches the skin has torn along the sheets' edges and the melt shines up through it, orange to gold
          float fis = (1. - smoothstep(cw * 1.2, cw * 4.5 + 0.02, vT.y)) * smoothstep(0.30, 0.62, vnoise(q * 0.06 + 71.)) * smoothstep(0.8, 3.5, e) * min(1., 0.05 / cw + 0.25);
          col += (uOrange * 0.85 + uGold * 0.5 * n2) * fis * (0.03 + 0.97 * openC * openC) * (1. - 0.7 * uAsh) * (1. - fsl) * (1. - fsl);      // (a standing plate keeps its dull red net: wide gold seams made it a giraffe)
          { // (polish 5) ONE LIT THING ON THE DARK FLOOR OF THE OPENING: a place where the skin has thinned over a welling of the melt
            // and its sheets are outlined in orange and gold (uVent: world x, z, radius, strength; 0 everywhere but the world's crust)
            vec2 vd = vWorld.xz - uVent.xy; float vk = exp(-min(dot(vd, vd) / max(uVent.z * uVent.z, 1.), 30.)) * uVent.w * (1. - openC) * (1. - 0.7 * uAsh);
            float vnet = (1. - smoothstep(0.02, 0.085, vT.y)) + 0.85 * exp(-max(vT.y, 0.) / 0.26);
            col += ((uOrange * 0.95 + uGold * 0.60 * n2) * vnet * (0.55 + 0.45 * sin(uTime * 0.8 + vT.z * 30.)) + uRed * 0.30 + uOrange * 0.10 * n1) * min(vk * 1.6, 1.) * smoothstep(0.3, 2.0, e);
          }
          col += uCool * (0.012 + 0.10 * smoothstep(0.72, 1.0, hash21(vec2(vT.z, 5.))) * fs0) * max(dot(N, uCrescent) + 0.35, 0.) * (0.5 + n1);      // the crescent's cool light: a glint on the sheets that face it (polish 4: it was an even wash, and the black mirror read as a grey pane)
          col = mix(col, uCool * 0.16 * (0.5 + n1), uAsh * smoothstep(0.8, 4., e));
          { // the tent's ring lays a road of cool glitter on its raft (uLamp.w is 0 on every other plate)
            vec3 Ld = uLamp.xyz - vWorld; float ld2 = dot(Ld, Ld); vec3 L = Ld / sqrt(max(ld2, 1e-4));
            float sp = max(dot(R, L), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
            col += uCool * uLamp.w * (3.0 * sp * fres + 0.035 * max(L.y, 0.) + 0.010) / (1. + ld2 / 5000.);
          }
          float jv = smoothstep(0.42, 0.80, vnoise(q * 0.19 + 13.)), jh = smoothstep(0.62, 0.9, vnoise(q * 0.47 + 29.)) * jv;      // (polish 4) a joint is not a ruled line: it glows in stretches, with hot spots where the melt stands close under it
          float lineK = mix(1. - smoothstep(0.07, 0.30, eFw), 1., openC), bleedK = mix(1. - smoothstep(0.35, 1.5, eFw), 1., openC);      // (polish 5) seen flat across the frame a shut joint was a straight red rule on the dark glass: it fades before it is thinner than the pixel
          float bleed = exp(-e / 1.25) * (0.05 + 0.30 * jv * (1. - openC) * bleedK + 0.95 * openC);
          col += mix(uRed, uOrange, exp(-e / 0.35)) * bleed * 1.2 * (0.6 + 0.8 * n2);
          col += (uRed * (0.05 + 1.3 * jv * jv + 0.9 * openC) + (uOrange * 0.9 + uGold * 0.5) * jh * (1. - openC)) * smoothstep(0.30, 0.0, e) * lineK;      // hairline joint, always
          if (uThreads > 0.01) { // an old raft: long red joints
            float jn = smoothstep(0.012, 0.0, abs(fbm3(q * 0.03 + 3.3) - 0.5));
            col += uRed * 0.45 * jn * uThreads * smoothstep(1.0, 4.0, e);
            col += (uRed * 0.50 + uOrange * 0.22) * exp(-e / 4.5) * uThreads * (0.45 + 0.9 * n1);      // (polish 5) the raft's shore is hot: its light reaches some metres in over the glass, so the dark island sits in the sea it floats on and is not a cut-out laid on it
          }
          { // spatter that has landed, cooling from white through red to black (everywhere once the crust has opened)
            vec2 cq = q / 4.4, ci = floor(cq), cf = fract(cq) - 0.5;
            float hh = hash21(ci), rr = 0.05 + 0.13 * hash21(ci + 7.);
            vec2 off = vec2(hash21(ci + 3.), hash21(ci + 5.)) * 0.5 - 0.25;
            float age = fract(hh * 7. + uTime * 0.05), spot = (1. - smoothstep(rr * 0.6, rr, length(cf - off))) * step(0.78, hh);
            vec3 sc = uOrange * 0.9;      // (no white-hot phase: one white dot on a dark plate, flattened by the view, read as a dash) sc = mix(sc, uRed * 0.45, smoothstep(0.08, 0.3, age)); sc = mix(sc, uBlack, smoothstep(0.3, 0.8, age));
            col = mix(col, sc, spot * max(uThreads, 0.65 * openC));
          }
          // flooding: the melt laps up a tilted plate in tongues that wander a metre or two and breathe, a wet sheen behind them
          float fh = clamp(0.7 * fsl, 0.035, 0.3);       // the advancing line stays a line on a nearly level plate
          float lapN = fbm3(q * 0.21 + 5.) - 0.5 + 0.35 * (vnoise(q * 0.9 + 2.) - 0.5);
          float hF = h - min(fsl, 0.3) * (lapN * 5.5 + 0.5 + 0.45 * sin(uTime * 0.9 + n1 * 9.) + 0.25 * sin(uTime * 1.7 + q.x * 0.4));
          float lapOn = smoothstep(0.03, 0.10, fsl);
          float fhL = max(fh, tFw * 9. * (0.35 + 2. * min(fsl, 0.3)));
          vec3 lapC = mix(uOrange * 0.78 + uGold * 0.12, uGold * 1.05 + uCream * 0.25, n2 * n2);
          col = mix(col, lapC, smoothstep(fh * 0.5, -fh * 0.5, hF) * lapOn);
          col += uOrange * 0.36 * smoothstep(0.3 + 1.2 * fsl, 0.0, hF) * (0.6 + 0.8 * n2) + (uGold * 0.9 + uCream * 0.55) * (1. - smoothstep(0., fhL, abs(hF))) * min(1., fh / fhL + 0.15);      // (polish 5) the lapping line is never thinner than the pixel's footprint: on a flooding plate seen flat it was a white hairline wandering across the rock
        } else if (part < 1.5) {
          // the wall: black glass lip, dark red ribbed band, orange, white-gold foot at the waterline
          float v = e;
          vec3 vW = voro(wq);
          // (polish 4) THE WALL IS ROCK: fracture blocks of dark crust, each with its own shade and a smooth grain, the melt's light
          // in every joint (white-gold and wide at the foot, a red thread under the lip); the face itself glows only in its
          // lowest quarter. It was an even orange bar with a stretched, blocky noise on it, which close up read as a smear.
          float jw = 0.05 + 0.13 * (1. - v);
          float jwE = max(jw, 0.9 * min(wFw, 2.));
          float joint = mix(0.30, (1. - smoothstep(jwE * 0.35, jwE, vW.y)) * min(1., jw / jwE + 0.15), wKeepB), blockV = mix(0.5, vW.z, wKeepB);
          float groove = joint, gr = joint, face = 1. - joint;
          float rk = fbm3(vec2(wAx * 0.9, vLocal.y * 1.4) + blockV * 17.);
          float rkH = fbm3(vec2(wAx * 0.31, vLocal.y * 0.45) + 3.);      // (polish 5) the heat climbs the face as one wavering field: taken block by block, the white foot ended in a staircase
          float heat = smoothstep(0.05, 1.0, (1. - v) * 0.85 + (rkH - .5) * 0.34);
          float stretch = smoothstep(0.30, 0.68, vnoise(vec2((vLocal.x - vLocal.z) * 0.085, 3.7)));          // whole stretches of a wall have cooled: it is not one even bar of light
          heat *= 1. - 0.40 * smoothstep(4., 22., h);                                                         // an edge lifted high above the melt has cooled: orange, not white
          heat = max(heat * uWallHeat * (0.58 + 0.52 * stretch), smoothstep(1.5, 0.0, h) * 0.88 * (0.5 + 0.5 * uWallHeat));
          vec3 g = mix(uRed * 0.5, uOrange * 1.0, smoothstep(0.25, 0.58, heat));
          g = mix(g, uGold * 1.5, smoothstep(0.6, 0.86, heat));
          g = mix(g, uCream * 1.55 + uGold * 0.35, smoothstep(0.9, 1.0, heat));      // (polish 5: was cream at 2.3; the foot of a wall seen end-on clipped to flat white boxes with a stepped outline)
          float crust = face * (1. - smoothstep(0.66, 0.96, heat)) * (0.74 + 0.26 * blockV);
          vec3 rock = (uGarnet * 0.60 + uRed * 0.10) * (0.35 + 1.1 * rk) * (0.55 + 0.9 * blockV) + g * 0.09 + uCool * 0.035 * max(dot(N, uCrescent), 0.) * blockV;
          g = mix(g * (1. + 0.8 * gr), rock, crust);
          g += uGold * 0.12 * seaLit * max(-N.y + 0.3, 0.);
          vec3 R = reflect(-V, N);
          vec3 lip = uBlack * 1.4 + uMoonCol[0] * 0.9 * pow(max(dot(R, uMoonDir), 0.), 30.)
            + uCool * 0.55 * max(dot(N, uCrescent), 0.) * (0.4 + 0.6 * pow(1. - clamp(dot(N, V), 0., 1.), 2.))
            + uGold * 0.9 * max(-N.y, 0.) * seaLit + uRed * 0.25 * groove + uRed * 0.50 * (1. - openC) * (1. - smoothstep(35., 120., length(Vv)));      // (polish 3) while the crust is shut a joint is a red hairline, not a black bar
          col = mix(g, lip, smoothstep(0.895, 0.93, v));
        } else {
          // underside: a ceiling of crust that froze in slabs about 7 m across and is coming apart: dark polygons, each at
          // its own tilt, the melt shining through every joint (white-gold where it has just left the sea, dull red toward
          // the lip), finer cracks in patches. No ruled ribs: seen close it must read as broken rock, not as stripes.
          vec3 vA = voro(uc), vB = voro(uc * 2.7 + 7.3);
          float patchy = fbm3(uq * 0.045 + 7.3);
          float grade = mix(1.30, 0.30, smoothstep(0., 24., h));                           // hottest where it has just left the melt
          float heat = uHeat * grade * (0.40 + 1.25 * smoothstep(0.18, 0.82, patchy)), hk = clamp(heat, 0., 1.4);
          float wA = 0.035 + 0.075 * hk, wB = 0.05 + 0.07 * hk;
          float uPx = 0.9 * min(uFw, 0.5), wAe = max(wA, uPx), wBe = max(wB, uPx * 2.7);      // (polish 5) a joint is never thinner than the pixel's footprint: seen far off or at a glancing angle it is a wider, dimmer band, not a bright hairline (the foot of the gate read as white scratches)
          float cA = (1. - smoothstep(wAe * 0.3, wAe, vA.y)) * min(1., wA / wAe + 0.12);                                                  // the wide joints between slabs
          float cB = (1. - smoothstep(wBe * 0.3, wBe, vB.y)) * min(1., wB / wBe + 0.12) * smoothstep(0.38, 0.62, vnoise(uq * 0.08 + 5.) + hk * 0.25) * uKeepB;   // finer cracks, in patches
          float halo = exp(-max(vA.y, 0.) / (0.06 + 0.07 * hk));
          float crack = mix(0.20, max(cA, cB * 0.6) + 0.30 * halo, uKeep);               // far off, the net melts into its mean
          float facet = mix(0.6, 0.30 + 0.60 * vA.z + 0.35 * vB.z * uKeepB + 0.17 * (1. - uKeepB), uKeep);                             // every polygon froze at its own tilt and takes the sea's light differently
          float T = heat * (0.16 * facet + 1.05 * crack) + 0.42 * facet * smoothstep(1.0, 2.1, heat);      // (polish 5) where it has just left the melt the rock itself still glows: the joints are brighter lines on orange, not white lines on black
          col = (uGarnet * 0.42 + uRed * 0.05) * (0.35 + 0.9 * facet) * (0.75 + 0.5 * vnoise(uq * 2.3));
          col = mix(col, uRed * 0.80, smoothstep(0.10, 0.34, T));
          col = mix(col, uOrange * 0.95, smoothstep(0.34, 0.68, T));
          col = mix(col, uGold * 1.12, smoothstep(0.70, 1.15, T));
          col = mix(col, mix(uGold * 1.25 + uOrange * 0.2, uCream * 1.6, uKeepB * smoothstep(0.5, 1.0, cA)), smoothstep(1.3, 2.0, T));      // (polish 5) white only in the body of a wide joint seen close: a fine crack or a far one stops at gold (white hairlines at the foot of the gate read as scratches)
          col += uOrange * 0.07 * seaLit * facet;
          // the ring's cool light on the rock round it (the tent only: uLamp.w is 0 elsewhere)
          vec3 Ld = uLamp.xyz - vWorld; float ld2 = dot(Ld, Ld);
          col += uCool * uLamp.w * (0.25 + 0.9 * facet) * (1. - 0.6 * crack) * max(dot(N, Ld) / sqrt(max(ld2, 1e-4)), 0.) / (1. + ld2 / 900.);
          if (uDrip > 0.01) { // (polish 5) THE TENT'S UNDERSIDES ARE ROCK WITH LIGHT COMING THROUGH. The weeping threads of polish 3 and 4
            // read, close, as a stretched texture of parallel scratches. They are gone. The cooled ceiling is the broken crust it
            // is everywhere else (slabs about 7 m across, each at its own tilt, a grain at two scales), and the melt behind it
            // shows through the wide joints as gold, joint by joint, each breathing slowly on its own, with a soft halo on the
            // rock either side; the sea's light climbs the faces from the foot.
            float br = 0.5 + 0.5 * sin(uTime * 0.6 + vA.z * 40. + patchy * 9.);
            float lit = smoothstep(0.34, 0.74, vnoise(uq * 0.11 + 19.) + 0.22 * br - 0.10) * mix(0.30, 1., smoothstep(0.10, 0.36, abs(dot(N, V))));
            float jwT = 0.070, jwE = max(jwT, uPx), cT = (1. - smoothstep(jwE * 0.25, jwE, vA.y)) * min(1., jwT / jwE + 0.12) * uKeep;                 // joints about half a metre wide
            float seamH = exp(-max(vA.y, 0.) / 0.17) * uKeep;                                           // and a metre of their light on the rock either side
            float fine = (1. - smoothstep(0.02, 0.07, vB.y)) * uKeepB;                                  // the second scale: hair fractures across each slab, dark
            float grainR = fbm3(uq * 0.9 + vA.z * 31.), pit = vnoise(uq * 4.3 + vA.z * 9.);
            col *= (0.40 + 1.05 * vA.z) * (0.46 + 0.95 * grainR) * (0.74 + 0.52 * pit * pit * uKeepB) * (1. - 0.60 * fine);
            col = mix(col, uBlack * 0.5, 0.75 * cT);
            col += ((uRed * 0.62 + uOrange * 0.50) * cT * (0.45 + 0.75 * patchy) + (uOrange * 0.45 + uGold * 1.00) * cT * lit
              + (uRed * 0.40 + uOrange * 0.34) * seamH * lit + uRed * 0.13 * seamH) * uDrip * smoothstep(0.5, 2.5, e);
            col += (uOrange * 0.055 + uGold * 0.025) * (0.3 + vA.z) * exp(-max(h, 0.) / 16.) * uDrip;
          }
          col += uOrange * 0.9 * exp(-e / 1.4) * clamp(heat + 0.25, 0., 1.);
          col += uGold * 0.16 * seaLit * max(-N.y, 0.) + uCream * 2.0 * smoothstep(0.4, 0.0, h);
        }
        gl_FragColor = vec4(clamp(col, 0., 40.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the patch: plates that fit edge to edge
// A power diagram (weighted Voronoi) of ~18 seeds clipped to an ellipse: convex cells whose shared borders are
// the same line for both neighbours, then one smooth warp (sines the sea shader can repeat) plus fine jag.
function clipPoly(poly, ax, az, c) { // keep points with ax*x + az*z <= c
  const out = []; const n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n], dp = ax * p[0] + az * p[1] - c, dq = ax * q[0] + az * q[1] - c;
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}

function layoutPatch(ctx, rng) {
  const j = (a) => rng.range(-a, a);
  const gz = j(5), mirror = rng.chance(0.5) ? 1 : -1;      // which side of the line the fountain lead and big neighbours fall
  const S = [ // x, z, weight, role
    [-40 + j(2), gz + j(3), 0, 'gateL'], [40 + j(2), gz + j(3), 0, 'gateR'], [j(1.5), gz, -480, 'corridor'], [-36 + j(4), 104 + j(5), 40, 'tipper'],
    [-55 + j(8), -78 + j(8), 0, ''], [6 + j(8), -84 + j(8), 0, ''], [62 + j(8), -74 + j(8), 0, ''], [-116 + j(8), -42 + j(8), 0, ''], [116 + j(8), -36 + j(8), 0, ''],
    [-120 + j(6), 34 + j(8), 0, ''], [120 + j(6), 38 + j(8), 0, ''], [-112 + j(6), 96 + j(8), 0, ''], [84 + j(6), 90 + j(8), 0, ''],
    [-52 + j(8), 166 + j(6), 0, ''], [50 + j(8), 162 + j(6), 0, ''], [j(10), -148 + j(6), 0, ''], [-92 + j(8), -128 + j(6), 0, ''], [96 + j(8), -122 + j(6), 0, ''], [32 + j(5), 114 + j(6), 0, ''],
  ];
  const RX = 152, RZ = 178, CZ = 14, bound = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 1 + j(0.035); bound.push([Math.cos(a) * RX * r, CZ + Math.sin(a) * RZ * r]); }
  // warp: three sines per axis, repeated in the sea shader (uWarp)
  const W = []; for (let k = 0; k < 3; k++) W.push([rng.range(0.035, 0.06) * (k + 1), rng.range(0, 6.28), rng.range(1.6, 2.6) / (k + 1), rng.range(0.035, 0.06) * (k + 1), rng.range(0, 6.28), rng.range(1.6, 2.6) / (k + 1)]);
  const warp = (x, z) => { let dx = 0, dz = 0; for (const w of W) { dx += Math.sin(z * w[0] + w[1]) * w[2]; dz += Math.sin(x * w[3] + w[4]) * w[5]; } return [x + dx, z + dz]; };
  const nz = ctx.noise, plates = [];
  for (let i = 0; i < S.length; i++) {
    let poly = bound.slice(); const si = S[i];
    for (let k = 0; k < S.length && poly.length > 2; k++) {
      if (k === i) continue; const sk = S[k];
      const ax = 2 * (sk[0] - si[0]), az = 2 * (sk[1] - si[1]);
      const c = sk[0] * sk[0] + sk[1] * sk[1] - si[0] * si[0] - si[1] * si[1] - sk[2] + si[2];
      poly = clipPoly(poly, ax, az, c);
    }
    if (poly.length < 3) continue;
    const role = si[3], sp = role === 'gateL' || role === 'gateR' || role === 'tipper' ? 0.6 : role === 'corridor' ? 1.2 : 2.2;
    const pts = [];
    for (let e = 0; e < poly.length; e++) {
      const a = poly[e], b = poly[(e + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / sp));
      for (let t = 0; t < n; t++) {
        const x = a[0] + (b[0] - a[0]) * t / n, z = a[1] + (b[1] - a[1]) * t / n, w = warp(x, z);
        pts.push([w[0] + nz.n2(w[0] * 0.075 + 11, w[1] * 0.075) * 2.6 + nz.n2(w[0] * 0.31, w[1] * 0.31) * 0.7 + nz.n2(w[0] * 1.3 + 40, w[1] * 1.3) * 0.16, w[1] + nz.n2(w[0] * 0.075, w[1] * 0.075 + 23) * 2.6 + nz.n2(w[0] * 0.31 + 90, w[1] * 0.31 + 20) * 0.7 + nz.n2(w[0] * 1.3, w[1] * 1.3 + 70) * 0.16]);
      }
    }
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, cx = 0, cz = 0;
    for (const p of pts) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minZ = Math.min(minZ, p[1]); maxZ = Math.max(maxZ, p[1]); cx += p[0]; cz += p[1]; }
    cx /= pts.length; cz /= pts.length;
    plates.push({ role, seed: [si[0], si[1], si[2]], pts, cx, cz, minX, maxX, minZ, maxZ });
  }
  return { plates, seeds: S, warp: W, mirror, gz };
}

// ---------------------------------------------------------------- the sea under the patch
// Emissive melt: orange mean, ~35% black feather skin that freezes and tears, white-gold only in the joints
// between plates (the same power diagram, repeated here) and along tears, so the open sea never clips.
function buildSea(layout, shared, pal, radius) {
  const NS = layout.seeds.length;
  const c = (h, k = 1) => ({ value: new THREE.Color(h).multiplyScalar(k) });
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true,
    uniforms: { ...THREE.UniformsLib.fog, uTime: shared.uTime, uOpen: shared.uOpen, uGold2: shared.uGold2, uRadius: { value: radius }, uSwell: shared.uSwell || (shared.uSwell = noSwell()),
      uSeeds: { value: layout.seeds.map((s) => new THREE.Vector3(s[0], s[1], s[2])) },
      uWarpA: { value: layout.warp.map((w) => new THREE.Vector3(w[0], w[1], w[2])) }, uWarpB: { value: layout.warp.map((w) => new THREE.Vector3(w[3], w[4], w[5])) },
      uBlack: c(pal[0]), uGarnet: c(pal[1]), uRed: c(pal[2]), uOrange: c(pal[3]), uGold: c(pal[4]), uCream: c(pal[5]) },
    vertexShader: /* glsl */`
      varying vec2 vP; varying vec3 vWorld;
      #include <fog_pars_vertex>
      ${SWELL_GLSL}
      void main(){ vP = position.xz; vec4 wp = modelMatrix * vec4(position, 1.); wp.y += swellH(wp.xz); vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uOpen, uGold2, uRadius; uniform vec3 uSeeds[${NS}]; uniform vec3 uWarpA[3]; uniform vec3 uWarpB[3];
      uniform vec3 uBlack, uGarnet, uRed, uOrange, uGold, uCream;
      varying vec2 vP; varying vec3 vWorld;
      #include <fog_pars_fragment>
      ${NOISE_GLSL}
      void main(){
        vec2 p = vP, u = p;
        for (int k = 0; k < 3; k++) { u.x -= sin(p.y * uWarpA[k].x + uWarpA[k].y) * uWarpA[k].z; u.y -= sin(p.x * uWarpB[k].x + uWarpB[k].y) * uWarpB[k].z; }
        float b1 = 1e9, b2 = 1e9; vec2 s1 = vec2(0.), s2 = vec2(1., 0.);
        for (int i = 0; i < ${NS}; i++) { vec3 s = uSeeds[i]; vec2 d = u - s.xy; float pd = dot(d, d) - s.z;
          if (pd < b1) { b2 = b1; s2 = s1; b1 = pd; s1 = s.xy; } else if (pd < b2) { b2 = pd; s2 = s.xy; } }
        float bd = (b2 - b1) / (2. * max(length(s2 - s1), 1.));
        float er = length(vec2(u.x / 152., (u.y - 14.) / 178.));
        float inPatch = 1. - smoothstep(0.84, 0.93, er);
        bd = mix(40., bd, inPatch);
        // the melt: slow bright streams
        vec2 fl = p * 0.045 + uTime * vec2(0.035, 0.012);
        float m1 = fbm3(fl), m2 = fbm3(fl * 2.7 - uTime * vec2(0.02, 0.05) + 4.);
        vec3 melt = mix(uRed * 0.55 + uOrange * 0.16, uOrange * 0.72 + uGold * 0.14, smoothstep(0.3, 0.85, m1 * 0.55 + m2 * 0.55));
        // skin: black feathers that freeze across open melt and tear again
        vec2 sp = p * 0.085 + uTime * vec2(0.05, 0.018);
        float sk = fbm3(sp) * 0.7 + fbm3(sp * 3.1 + 7. - uTime * 0.03) * 0.3;
        float feather = vnoise(p * vec2(0.55, 2.1) + sk * 6.) * 0.10 + vnoise(p * 3.7) * 0.04;
        float th = 0.54 - 0.06 * uGold2 + 0.035 * sin(uTime * 0.23 + m1 * 9.);
        float sd = sk + feather - th;                     // < 0 skin, > 0 open
        float skin = 1. - smoothstep(-0.015, 0.015, sd);
        float tear = exp(-abs(sd) * 160.) + smoothstep(0.02, 0.0, abs(fract(sk * 11. + feather * 4.) - 0.5)) * skin * 0.35;
        // joints and leads between plates: white-gold, widening as the crust opens
        float lead = (1. - smoothstep(0.15, 0.8 + 2.2 * uOpen, bd)) * (1. - 0.85 * uGold2);
        skin *= 1. - lead;
        vec3 skinC = uBlack * 1.5 + uGarnet * 0.22 * (0.5 + m2) + uRed * 0.25 * smoothstep(0.05, 0.0, -sd);
        vec3 col = mix(melt, skinC, skin * 0.96);
        col += (uOrange * 1.1 + uGold * 0.9) * tear * (1. - lead);
        col = mix(col, mix(uOrange * 1.0 + uGold * 0.4, uGold * 1.5 + uCream * 0.6, lead * lead * lead), lead * 0.9);
        float a = 1. - smoothstep(0.90, 1.0, length(p) / uRadius);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const g = new THREE.RingGeometry(0.01, radius, 72, 14); g.rotateX(-Math.PI / 2);   // rings, so the disc can bend over the swell
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'meltSea'; mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------- fountains: heavy ballistic arcs of runny melt
// list: [{ x, y, z, height }] in the parent's frame. Two draw calls for any number of fountains.
// shared.uTime drives them; shared.uResY (drawing buffer height) keeps far drops at least 2 px wide.
const FOG_FADE = /* glsl */`
  float fogK = 0.;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      fogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      fogK = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif`;
export function makeFountains(list, shared, pal, rng, detail = 1) {
  const c = (h, k = 1) => ({ value: new THREE.Color(h).multiplyScalar(k) });
  const per = Math.round(600 * detail), n = list.length * per;
  const base = new Float32Array(n * 4), rnd = new Float32Array(n * 4);
  for (let f = 0; f < list.length; f++) for (let i = 0; i < per; i++) {
    const k = (f * per + i) * 4, F = list[f];
    base[k] = F.x; base[k + 1] = F.y ?? 0; base[k + 2] = F.z; base[k + 3] = F.height;
    rnd[k] = rng(); rnd[k + 1] = rng(); rnd[k + 2] = rng(); rnd[k + 3] = rng();
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 4));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = n;
  const uni = { ...THREE.UniformsLib.fog, uTime: shared.uTime, uResY: shared.uResY, uFount: shared.uFount, uSwell: shared.uSwell || (shared.uSwell = noSwell()), uOrange: c(pal[3]), uGold: c(pal[4]), uCream: c(pal[5]), uRed: c(pal[2]) };
  const drops = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: uni, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aBase, aRnd; uniform float uTime, uResY, uFount; varying vec2 vC; varying float vAge, vSz;
      #include <fog_pars_vertex>
      ${SWELL_GLSL}
      void main(){
        const float G = 9.8;
        float jet = floor(aRnd.z * 5.), jr = fract(sin(jet * 12.9898 + aBase.x) * 43758.5453);   // five wandering jets throw the arcs
        float H = aBase.w * (0.74 + 0.26 * jr) * (0.84 + 0.16 * aRnd.x);
        float v0 = sqrt(2. * G * max(H, 0.1)), T = 2. * v0 / G;
        float t = fract(uTime / T + aRnd.y) * T, te = uTime - t;
        float br = (0.88 + 0.12 * (0.5 + 0.5 * sin(te * 1.885 + aBase.x))) * uFount;   // height breathes at 0.3 Hz, set at launch
        v0 *= br;
        float fat = step(0.72, aRnd.w);                                                 // one drop in four is a fat gob of melt
        float ang = jet * 1.2566 + jr * 3. + sin(te * 0.5 + jet) * 0.35 + (aRnd.w - 0.5) * 0.20;       // each jet throws one sheet
        float vh = (0.09 + 0.20 * fract(jr * 7.3) + 0.05 * (aRnd.x - 0.5)) * v0;       // heavy low arcs
        vec3 vel0 = vec3(cos(ang) * vh, v0, sin(ang) * vh);
        vec3 p = aBase.xyz + vel0 * t - vec3(0., 0.5 * G * t * t, 0.);
        vec3 vel = vel0 - vec3(0., G * t, 0.);
        float alive = step(aBase.y - 0.5, p.y) * step(0.02, uFount) * smoothstep(0.0, 0.05, t / T);   // nothing piles up at the vent
        vec4 wb = modelMatrix * vec4(aBase.xyz, 1.); vec4 wq = modelMatrix * vec4(p, 1.); wq.y += swellH(wb.xz);
        vec4 mv = viewMatrix * wq;
        vec2 dir = (viewMatrix * modelMatrix * vec4(vel, 0.)).xy; float sp = length(dir);
        dir = sp > 1e-3 ? dir / sp : vec2(0., 1.);
        float px = -mv.z * 2. / (projectionMatrix[1][1] * max(uResY, 100.));
        float land = smoothstep(0.955, 1.0, t / T);                                    // the last instant: it spreads where it lands
        float w = max((0.14 + 0.36 * aRnd.y * aRnd.w + 0.75 * fat * aRnd.y) * (0.6 + 0.4 * aBase.w / 50.) * (1. + 3.5 * land), px * (1. + 0.6 * fat)) * alive;
        float len = (w + clamp(sp * (0.16 + 0.10 * fat), 0.1, 7.0) * (1. - 0.8 * land)) * alive;
        dir = normalize(mix(dir, vec2(1., 0.), land * 0.999) + vec2(0., 1e-4));
        mv.xy += dir * position.y * len + vec2(dir.y, -dir.x) * position.x * w;
        vC = position.xy; vAge = t / T; vSz = land;
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uOrange, uGold, uCream, uRed; varying vec2 vC; varying float vAge, vSz;
      #include <fog_pars_fragment>
      void main(){
        float hy = vC.y * 0.5 + 0.5;                                   // 0 tail .. 1 head: a teardrop along its velocity
        float d = (1. - smoothstep(0.35, 1.0, abs(vC.x) / mix(0.3, 1.0, hy * hy))) * (1. - smoothstep(0.8, 1.0, hy)) * mix(0.15, 1.0, hy * hy);
        vec3 col = mix(uCream * 1.6 + uGold * 0.8, uGold * 2.0, smoothstep(0.0, 0.3, vAge));
        col = mix(col, uOrange * 1.6, smoothstep(0.5, 0.85, vAge)); col = mix(col, uRed * 1.2, smoothstep(0.88, 0.96, vAge) * (1. - vSz));
        col = mix(col, uGold * 1.5 + uCream * 0.5, vSz * (1. - vSz) * 3.);                // a splash of gold as it lands
        ${FOG_FADE}
        gl_FragColor = vec4(col * d * 0.7 * (1. - fogK), 1.);
      }`,
  }));
  drops.frustumCulled = false; drops.name = 'fountainDrops'; drops.renderOrder = 3;
  // core ribbons: three tapered streams per fountain, turned to the camera about the vertical
  const SEG = 14, pos = [], cb = [], cr = [], idx = [];
  for (let f = 0; f < list.length; f++) for (let r = 0; r < 3; r++) {
    const F = list[f], lean = rng() * 6.283, ph = rng() * 10, tall = 0.62 + 0.3 * rng(), s0 = pos.length / 3;
    for (let i = 0; i <= SEG; i++) for (let sd = -1; sd <= 1; sd += 2) { pos.push(sd, i / SEG, 0); cb.push(F.x, F.y ?? 0, F.z, F.height * tall); cr.push(lean, ph, r); }
    for (let i = 0; i < SEG; i++) { const a = s0 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('aBase', new THREE.Float32BufferAttribute(cb, 4)); cg.setAttribute('aRnd', new THREE.Float32BufferAttribute(cr, 3)); cg.setIndex(idx);
  const cores = new THREE.Mesh(cg, new THREE.ShaderMaterial({
    uniforms: uni, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aBase; attribute vec3 aRnd; uniform float uTime, uFount; varying vec2 vUv; varying float vH, vPh;
      #include <fog_pars_vertex>
      ${SWELL_GLSL}
      void main(){
        float v = position.y, br = (0.88 + 0.12 * (0.5 + 0.5 * sin(uTime * 1.885 + aBase.x - v * 2.5))) * uFount;
        float H = aBase.w * br * br;
        vec3 lean = vec3(cos(aRnd.x), 0., sin(aRnd.x));
        vec3 p = aBase.xyz + vec3(0., v * H, 0.) + lean * (v * v * aBase.w * 0.10 + sin(v * 5. - uTime * 2.6 + aRnd.y) * 0.5 * v);
        vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
        float w = mix(7.0, 0.7, pow(clamp(v, 0., 1.), 0.5)) * (0.45 + 0.55 * aBase.w / 50.) * (1. - 0.25 * aRnd.z) * step(0.02, uFount);
        vec4 wb = modelMatrix * vec4(aBase.xyz, 1.); vec4 wp = modelMatrix * vec4(p, 1.); wp.y += swellH(wb.xz); wp.xyz += right * position.x * w;
        vUv = vec2(position.x, v); vH = aBase.w; vPh = aRnd.y;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uOrange, uGold, uCream; varying vec2 vUv; varying float vH, vPh;
      #include <fog_pars_fragment>
      float h1(float x){ return fract(sin(x * 127.1) * 43758.5453); }
      float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
      void main(){
        float prof = 1. - vUv.x * vUv.x; prof *= prof;
        float flow = 0.55 + 0.45 * n1(vUv.y * vH * 0.35 - uTime * 4.5 + vPh * 3.) * (0.6 + 0.4 * n1(vUv.x * 2. + vUv.y * 9. + vPh));
        vec3 col = mix(uCream * 1.5 + uGold * 0.9, uGold * 1.6, smoothstep(0.0, 0.6, vUv.y)); col = mix(col, uOrange * 1.3, smoothstep(0.6, 1.0, vUv.y));
        float a = 0.80 * prof * flow * (1. - smoothstep(0.7, 1.0, vUv.y)) * smoothstep(0.0, 0.03, vUv.y);
        ${FOG_FADE}
        gl_FragColor = vec4(col * a * (1. - fogK), 1.);
      }`,
  }));
  cores.frustumCulled = false; cores.name = 'fountainCores'; cores.renderOrder = 3;
  const group = new THREE.Group(); group.add(drops, cores); group.name = 'fountains';
  return group;
}

// ---------------------------------------------------------------- the hero
const ss = smoothstep;
export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng.fork('ember-moon-hero');
  const phase = opts.moonPhase ?? (rng() < 0.64 ? 'crescent' : rng() < 0.5 ? 'half' : 'unlit');
  const crust = opts.crust ?? (rng() < 0.6 ? 'glass' : rng() < 0.5 ? 'ash' : 'young');
  const seaRadius = opts.seaRadius ?? 260;
  const root = new THREE.Group(); root.name = 'emberMoonTide';

  const moonTex = await bakeMoonTexture(ctx, 384);
  const moonU = makeMoonUniforms(moonTex, pal, phase);
  const moonLocal = { dir: moonU.uMoonDir.value.clone(), right: moonU.uMoonRight.value.clone(), up: moonU.uMoonUp.value.clone() };
  await ctx.yield();
  let moon = null;
  if (opts.moon !== false) { moon = buildMoon(moonU, 4500); root.add(moon); }

  const shared = { uTime: { value: 0 }, uSeaY: { value: 0 }, uOpen: { value: 0 }, uGold2: { value: 0 }, uResY: { value: 1080 }, uFount: { value: 0 }, uSwell: noSwell() };
  const slabMat = makeSlabMaterial(moonU, shared, pal, { heat: 1, ash: crust === 'ash' ? 0.8 : 0, rough: crust === 'young' ? 0.09 : 0.06, ribW: 1 });
  const thick = crust === 'ash' ? 8 : crust === 'young' ? 4.5 : 6.5;      // (polish 4) a slab edge is a wall of rock, not a card

  const layout = layoutPatch(ctx, rng);
  await ctx.yield();
  const plates = [], gate = {};
  for (const pl of layout.plates) {
    const role = pl.role, w = pl.maxX - pl.minX;
    // each plate has its own frame: local +x is the direction that rears (r), ribs and drip lines run along it
    const k = { role, sh: rng.range(0.04, 0.10), bobW: 6.283 / rng.range(5, 8), bobP: rng.range(0, 6.283), bobA: rng.range(0.2, 0.45),
      tiltBob: rng.range(0.008, 0.022), bobAx: rng.range(0, 6.283), ang: 0, p0: 0.2, sink: 0, ps: 2, drift: [0, 0], px: pl.cx, pz: pl.cz, rx: 1, rz: 0, L: 0 };
    let hinge = -1;
    if (role === 'gateL' || role === 'gateR') {
      const phi = rng.range(46, 60) * Math.PI / 180;
      k.rx = (role === 'gateL' ? 1 : -1) * Math.cos(phi); k.rz = Math.sin(phi); hinge = 3;
      k.sh = 0.03; k.bobA = 0.12; k.tiltBob = 0.006; gate[role] = { k, pl };
    } else if (role === 'tipper') {
      k.rx = -Math.cos(TIP_YAW); k.rz = -Math.sin(TIP_YAW); k.px = pl.cx - k.rx * w * 0.16; k.pz = pl.cz - k.rz * w * 0.16; k.sh = 0.03;   // hinge yawed: its far-left corner stands highest (clear of the Moon), so its glass top turns to the arriving camera as a face, not edge-on
    } else if (role === 'corridor') {
      k.rx = 0; k.rz = rng.chance(0.5) ? 1 : -1; k.ang = rng.range(0.05, 0.12); k.sink = 9; k.ps = 0.1; k.sh = 0.12;
    } else {
      const a = rng.range(0, 6.283), far = Math.hypot(pl.cx, pl.cz);
      k.rx = Math.cos(a); k.rz = Math.sin(a); k.ang = rng.range(0.05, 0.24); k.p0 = rng.range(0.1, 0.45);
      const d = rng.range(2, 9) / Math.max(far, 1); k.drift = [pl.cx * d, pl.cz * d];
      if (rng.chance(0.36)) { k.sink = rng.range(7, 11); k.ps = rng.range(0.55, 0.82); }
      if (Math.abs(pl.cx) < 48 && pl.cz < -40) { k.sink = 11; k.ps = 0.33; k.ang = Math.min(k.ang, 0.09); }      // the plates on the line beyond the gate go under early: the lane behind the gate is open melt, never a dark bar across it
    }
    if (hinge >= 0) { // hinge at the plate's far end along -r; the crest rises to ~28 m
      let lo = 1e9, hi = -1e9;
      for (const q of pl.pts) { const d = (q[0] - pl.cx) * k.rx + (q[1] - pl.cz) * k.rz; lo = Math.min(lo, d); hi = Math.max(hi, d); }
      k.px = pl.cx + k.rx * (lo + hinge); k.pz = pl.cz + k.rz * (lo + hinge); k.L = hi - lo - hinge;
      k.ang = Math.min(Math.asin(clamp(rng.range(27, 30) / k.L, 0, 0.6)), 0.5);
    }
    const psi = -Math.atan2(k.rz, k.rx), cs = Math.cos(psi), sn = Math.sin(psi);
    k.qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), psi);
    const outline = pl.pts.map((q) => { const dx = q[0] - k.px, dz = q[1] - k.pz; return [dx * cs - dz * sn, dx * sn + dz * cs]; });
    const geo = makeSlabGeometry(outline, { rng, thick, ribW: thick / 4, ribDir: hinge >= 0 ? Math.atan2(cs, -sn) : 0, shaderRibs: !(role === 'gateL' || role === 'gateR' || role === 'tipper') });
    const mesh = new THREE.Mesh(geo, slabMat); mesh.name = 'plate-' + (role || plates.length);
    mesh.position.set(k.px, 0, k.pz); mesh.frustumCulled = false;
    root.add(mesh); plates.push({ mesh, k, pl });
    if (hinge >= 0) { gate[role].mesh = mesh; gate[role].outline = outline; gate[role].centre = geo.userData.centre; }
    await ctx.yield();
  }

  const gateList = [gate.gateL, gate.gateR].filter(Boolean);
  const drips = buildDrips(gateList, shared, pal, rng, detail, FREEBOARD - thick); root.add(drips.mesh);
  let sea = null;
  if (seaRadius > 0) { sea = buildSea(layout, shared, pal, seaRadius); root.add(sea); }
  const fx = -80 + rng.range(-5, 5), fz = -78 + rng.range(-8, 8), fH = rng.range(46, 58);
  const fList = [{ x: fx, y: 0, z: fz, height: fH }, { x: 96 + rng.range(-8, 8), y: 0, z: -92 + rng.range(-8, 8), height: rng.range(20, 30) }];
  const fountains = makeFountains(fList, shared, pal, rng, detail); root.add(fountains);
  await ctx.yield();

  // ---- motion: everything below is a pure function of progress p and time
  let progress = -1, earthGlow = -1;
  const qMain = new THREE.Quaternion(), qBob = new THREE.Quaternion(), axis = new THREE.Vector3(), bufSize = new THREE.Vector2();
  const DEG = Math.PI / 180;
  const ZAX = new THREE.Vector3(0, 0, 1);
  const pose = (P, p, t) => {
    const k = P.k, m = P.mesh, open = ss(0.03, 0.35, p);
    let ang = 0, y = Math.sin(t * k.bobW + k.bobP) * k.bobA * open, dx = 0, dz = 0, s = 1 - k.sh * ss(0.05, 0.5, p);
    if (k.role === 'gateL' || k.role === 'gateR') {
      ang = k.ang * ss(0.20, 0.60, p) * (1 - 0.10 * ss(0.86, 1, p));
    } else if (k.role === 'tipper') {
      ang = (40 * ss(0.02, 0.22, p) + 24 * ss(0.24, 0.5, p)) * DEG; y -= 75 * ss(0.22, 0.5, p); dx = 14 * ss(0.2, 0.5, p);
    } else {
      ang = k.ang * ss(k.p0, k.p0 + 0.3, p) * (1 + 1.2 * ss(k.ps, k.ps + 0.22, p));
      y -= k.sink * ss(k.ps, k.ps + 0.22, p); dx = k.drift[0] * ss(0.1, 0.7, p); dz = k.drift[1] * ss(0.1, 0.7, p);
    }
    qMain.setFromAxisAngle(ZAX, ang);
    axis.set(Math.cos(k.bobAx), 0, Math.sin(k.bobAx)); qBob.setFromAxisAngle(axis, Math.sin(t * k.bobW * 0.83 + k.bobP * 1.7) * k.tiltBob * open);
    m.quaternion.copy(qBob).multiply(k.qYaw).multiply(qMain); m.position.set(k.px + dx, y, k.pz + dz); m.scale.set(s, 1, s);
  };
  const update = (dt, time, camera) => {
    // without setProgress() the piece plays itself (viewer only): rise 0-18 s, hold, fall back by 40 s
    const tt = time % 40, p = progress >= 0 ? progress : clamp(Math.min(tt / 17.6, (40 - tt) / 12), 0, 1);
    shared.uTime.value = time; moonU.uMoonT.value = time;
    shared.uOpen.value = ss(0.03, 0.42, p); shared.uGold2.value = ss(0.42, 0.85, p); shared.uFount.value = ss(0.28, 0.5, p);
    moonU.uEarthGlow.value = earthGlow >= 0 ? earthGlow : ss(0.15, 1, p);
    root.updateWorldMatrix(true, false);
    shared.uSeaY.value = root.matrixWorld.elements[13];
    moonU.uMoonDir.value.copy(moonLocal.dir).transformDirection(root.matrixWorld);
    moonU.uMoonRight.value.copy(moonLocal.right).transformDirection(root.matrixWorld);
    moonU.uMoonUp.value.copy(moonLocal.up).transformDirection(root.matrixWorld);
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(bufSize); shared.uResY.value = bufSize.y; }
    for (let i = 0; i < plates.length; i++) pose(plates[i], p, time);
    for (let i = 0; i < gateList.length; i++) { const m = gateList[i].mesh; m.updateMatrix(); drips.uGateM.value[i].copy(m.matrix); }
  };
  update(0, 0, null);

  const gl = gate.gateL, gr = gate.gateR;
  const crest = (g) => { if (!g) return new THREE.Vector3(); const k = g.k, c = Math.cos(k.ang), sn = Math.sin(k.ang); return new THREE.Vector3(k.px + k.rx * (k.L * c - FREEBOARD * sn), k.L * sn + FREEBOARD * c, k.pz + k.rz * (k.L * c - FREEBOARD * sn)); };
  const tip = plates.find((P) => P.k.role === 'tipper');
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    flyThrough: [V(0, 16, 240), V(-2, 16, 130), V(-6, 16, 55), V(0, 16, 0), V(5, 16, -55), V(1, 16, -130), V(0, 16, -240)],
    gateLeft: crest(gl), gateRight: crest(gr),
    tipper: tip ? V(tip.pl.cx, 0, tip.pl.cz) : V(0, 0, 100),
    fountain: V(fx, 0, fz), fountainHeight: fH, fountain2: V(fList[1].x, 0, fList[1].z),
    moonDir: moonLocal.dir.clone(), patchRadiusX: 152, patchRadiusZ: 178, patchCentre: V(0, 0, 14),
    viewpoints: [{ position: V(0, 16, 200), target: V(0, 20, 0) }, { position: V(-2, 16, 100), target: V(0, 18, -40) }, { position: V(60, 9, 150), target: V(-20, 14, 0) }],
  };
  return {
    object: root, radius: 130, height: 34, center: new THREE.Vector3(0, 10, 0), anchors, patchRadius: 180,
    update, dispose() {}, ground: false, groundY: 0,
    setProgress(p) { progress = clamp(p, 0, 1); }, setEarthGlow(g) { earthGlow = clamp(g, 0, 1); },
    uniforms: { moon: moonU, shared }, moon, sea, fountains, plates: plates.map((P) => P.mesh), slabMaterial: slabMat, variant: { phase, crust },
  };
}

// ---------------------------------------------------------------- the exit tent
// Two unequal slabs thrown together (the left 54 m up the slope and about 100 m long, 43 m high; the right 41 m and
// about 66 m long, propping it) on one unbroken black raft, about 54 m wide at the sea.
// Origin: centre of the tent floor at sea level; the mouth faces +Z, the portal sits toward the far (-Z) end.
// opts.hero: the object buildHero() returned, to share its Moon uniforms and clock (otherwise the tent bakes
// its own Moon and, unless opts.moon === false, shows it). opts.palette, opts.detail as for the hero.
// anchors: portalSeat { position, facing }, mouth, crest, flyThrough (>= 9 m from rock), viewpoints.
export async function buildTent(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEF_PALETTE;
  const rng = ctx.rng.fork('ember-moon-tent'), nz = ctx.noise;
  const root = new THREE.Group(); root.name = 'emberTent';
  let moonU, uTime, ownMoon = false, moonLocal = null;
  if (opts.hero && opts.hero.uniforms) { moonU = opts.hero.uniforms.moon; uTime = opts.hero.uniforms.shared.uTime; }
  else {
    ownMoon = true; moonU = makeMoonUniforms(await bakeMoonTexture(ctx, 384), pal, opts.moonPhase ?? 'crescent'); uTime = { value: 0 };
    moonLocal = { dir: moonU.uMoonDir.value.clone(), right: moonU.uMoonRight.value.clone(), up: moonU.uMoonUp.value.clone() };
    if (opts.moon !== false) root.add(buildMoon(moonU, 4500));
  }
  await ctx.yield();
  const shared = { uTime, uSeaY: { value: 0 }, uOpen: { value: 0.6 }, uSwell: opts.hero && opts.hero.uniforms ? opts.hero.uniforms.shared.uSwell : noSwell() };
  const slabMat = makeSlabMaterial(moonU, shared, pal, { heat: 0.30, rough: 0.06, wallHeat: 0.42, drip: 1, stretch: 0.42 });
  const backMat = makeSlabMaterial(moonU, shared, pal, { heat: 0.30, rough: 0.06, wallHeat: 0.42, drip: 1 });      // (polish 5) the back plate faces us: its crust is not stretched. It shares the side slabs' lamp and sheen uniforms, which the world sets
  backMat.uniforms.uLamp = slabMat.uniforms.uLamp; backMat.uniforms.uSheen = slabMat.uniforms.uSheen;
  const raftMat = makeSlabMaterial(moonU, shared, pal, { heat: 0.4, rough: 0.07, threads: 1 });
  const LEN = 90 + rng.range(-4, 4), PINCH = rng.range(-0.012, 0.012);
  const jag = (x, z, s) => [x + nz.n2(x * 0.07 + s, z * 0.07) * 2.2 + nz.n2(x * 0.5, z * 0.5 + s) * 0.35, z + nz.n2(x * 0.07, z * 0.07 + s + 30) * 2.2 + nz.n2(x * 0.5 + s, z * 0.5) * 0.35];
  // WRECKAGE, NOT A HUT: two slabs of unequal size thrown together. The left one is the longer and taller (54 m up
  // the slope, leaning 52 degrees, overhanging the mouth); the right one is shorter and steeper and props its
  // broken crest against the left one's underside, so the apex is off-centre and steps down toward the mouth.
  // Each outline: hinge edge on the raft (local x = 0), a ragged crest given as fractions of the width along the
  // length, corners knocked off, and chips at three scales.
  const chip = (x, z, s) => [x + nz.n2(x * 0.07 + s, z * 0.07) * 2.4 + nz.n2(x * 0.21 + s, z * 0.21 + 11) * 1.1 + nz.n2(x * 0.6, z * 0.6 + s) * 0.4,
    z + nz.n2(x * 0.07, z * 0.07 + s + 30) * 2.4 + nz.n2(x * 0.21 + 17, z * 0.21 + s) * 1.1 + nz.n2(x * 0.6 + s, z * 0.6) * 0.4];
  const broken = (wid, zA, zB, prof, sp, s) => {      // prof: [[t 0..1 from zA to zB, crest as a fraction of wid], ...]
    const C = [[0, zA]]; for (const q of prof) C.push([wid * q[1], zA + (zB - zA) * q[0]]); C.push([0, zB]);
    const P = [];
    for (let e = 0; e < C.length; e++) { const a = C[e], b = C[(e + 1) % C.length], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / sp));
      for (let t = 0; t < n; t++) { const f = t / n; P.push(chip(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, s)); } }
    return P;
  };
  const slabs = [];
  const SPEC = [
    { name: 'tentLeft', wid: 54, lean: 52, x: -30, yaw: -0.09, zA: -LEN / 2, zB: LEN / 2 + 10, seed: 10,
      prof: [[0, 0.84], [0.16, 0.97], [0.42, 1.0], [0.54, 0.91], [0.64, 0.97], [0.73, 0.72], [0.78, 0.40], [0.85, 0.50], [0.93, 0.20]], ribDir: 0.3 },
    { name: 'tentRight', wid: 41 - rng.range(0, 2), lean: 58, x: 23.5, yaw: Math.PI + 0.07, zA: LEN / 2 + 3, zB: -0.2 * LEN, seed: 110,
      prof: [[0, 0.72], [0.22, 0.93], [0.5, 1.0], [0.63, 0.86], [0.72, 0.52], [0.80, 0.60], [0.90, 0.26]], ribDir: -0.4 },
  ];
  for (const S of SPEC) {
    const geo = makeSlabGeometry(broken(S.wid, S.zA, S.zB, S.prof, 0.9, S.seed), { rng, ribW: 1, ribDir: S.ribDir, shaderRibs: true });
    const m = new THREE.Mesh(geo, slabMat); m.name = S.name; m.frustumCulled = false;
    // splayed a few degrees: the mouth is wider than the far end, so each slab shows a face, not just its edge
    m.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), S.yaw + PINCH).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), S.lean * Math.PI / 180));
    m.position.set(S.x, 1.0, 0); root.add(m); slabs.push(m);
    await ctx.yield();
  }
  // a third plate, broken across, fallen against the far end: its dark underside is the backdrop the portal sits against
  const bw = 70 + rng.range(-3, 3), bh = 44 + rng.range(-2, 2);
  const back = new THREE.Mesh(makeSlabGeometry(broken(bh, -bw / 2, bw / 2, [[0, 0.72], [0.28, 1.0], [0.60, 0.93], [0.72, 0.70], [1, 0.80]], 1.1, 140), { rng, ribW: 1, ribDir: 1.15, shaderRibs: true }), backMat); back.name = 'tentBack'; back.frustumCulled = false;
  back.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2 + 0.16 + rng.range(-0.04, 0.04)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 52 * Math.PI / 180));
  back.position.set(3 + rng.range(-1.5, 1.5), 1.0, -LEN / 2 - 20); root.add(back); slabs.push(back);
  await ctx.yield();
  // the raft: one unbroken plate, an oval about 150 x 180 m
  const RXr = 74 + rng.range(-4, 6), RZr = 100 + rng.range(-4, 6), ro = [];
  for (let i = 0; i < 230; i++) { const a = (i / 230) * 6.2832, r = 1 + nz.n2(Math.cos(a) * 1.7 + 5, Math.sin(a) * 1.7) * 0.13; ro.push(jag(Math.cos(a) * RXr * r, -2 + Math.sin(a) * (RZr + 8 + (Math.sin(a) > 0 ? 46 : 0)) * r, 9)); }      // (polish 3) longer toward the mouth: its burning shore is under and behind us by u 0.87, not a band across the bottom of the frame
  const raft = new THREE.Mesh(makeSlabGeometry(ro, { rng, shaderRibs: true }), raftMat); raft.name = 'tentRaft'; raft.frustumCulled = false; root.add(raft);
  await ctx.yield();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V(0, 9.2, -LEN / 2 + 8), facing: V(0, 0, 1) },
    mouth: V(0, 0, LEN / 2), crest: V(0, 41, 0),
    flyThrough: [V(0, 16, 330), V(0, 15, 190), V(0, 11, LEN / 2 + 30), V(0, 9.2, 10), V(0, 9.2, -LEN / 2 + 8)],
    viewpoints: [{ position: V(0, 16, 390), target: V(0, 12, 0) }, { position: V(0, 10, 110), target: V(0, 10, -40) }],
  };
  const update = (dt, time) => {
    root.updateWorldMatrix(true, false);
    shared.uSeaY.value = root.matrixWorld.elements[13];
    const b = Math.sin(time * 0.9) * 0.12; raft.position.y = b; slabs[0].position.y = 1.0 + b; slabs[1].position.y = 1.0 + b * 0.9; slabs[2].position.y = 1.0 + b; // the whole raft rides the sea
    if (ownMoon) { uTime.value = time; moonU.uMoonT.value = time;
      moonU.uMoonDir.value.copy(moonLocal.dir).transformDirection(root.matrixWorld); moonU.uMoonRight.value.copy(moonLocal.right).transformDirection(root.matrixWorld); moonU.uMoonUp.value.copy(moonLocal.up).transformDirection(root.matrixWorld); }
  };
  update(0, 0);
  return { object: root, radius: 60, height: 42, center: V(0, 14, 0), anchors, update, dispose() {}, ground: false, groundY: 0, slabs, raft };
}

// ---------------------------------------------------------------- drips: melt falling off the reared undersides
// Each drip starts at a point of a gate slab's underside (in that slab's own frame, carried by uGateM[i]),
// falls under gravity to the sea and starts again. One additive draw call.
function buildDrips(gates, shared, pal, rng, detail, bot) {
  const per = Math.round(120 * detail), n = gates.length * per;
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 2);
  for (let gi = 0; gi < gates.length; gi++) {
    const pts = gates[gi].outline, c = gates[gi].centre;
    for (let i = 0; i < per; i++) {
      const q = pts[Math.floor(rng() * pts.length)], f = 0.04 + 0.9 * rng() * rng(), k = (gi * per + i) * 4;
      a0[k] = q[0] + (c[0] - q[0]) * f; a0[k + 1] = bot - 0.2; a0[k + 2] = q[1] + (c[1] - q[1]) * f; a0[k + 3] = gi;
      a1[(gi * per + i) * 2] = rng(); a1[(gi * per + i) * 2 + 1] = rng();
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aStart', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(a1, 2)); g.instanceCount = n;
  const c = (h, k = 1) => ({ value: new THREE.Color(h).multiplyScalar(k) });
  const uGateM = { value: [new THREE.Matrix4(), new THREE.Matrix4()] };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, uTime: shared.uTime, uResY: shared.uResY, uGateM, uSwell: shared.uSwell || (shared.uSwell = noSwell()), uOrange: c(pal[3]), uGold: c(pal[4]), uCream: c(pal[5]) },
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aStart; attribute vec2 aRnd; uniform mat4 uGateM[2]; uniform float uTime, uResY; varying vec2 vC; varying float vAge, vDim;
      #include <fog_pars_vertex>
      ${SWELL_GLSL}
      void main(){
        vec4 s0 = aStart.w < 0.5 ? uGateM[0] * vec4(aStart.xyz, 1.) : uGateM[1] * vec4(aStart.xyz, 1.);
        float hgt = max(s0.y, 0.);
        float T = sqrt(2. * hgt / 9.8) + 0.25 + aRnd.y * 1.6;          // fall time plus a wait while the bead gathers
        float t = fract(uTime / max(T, 0.3) + aRnd.x) * T - (0.25 + aRnd.y * 1.6);
        float fall = max(t, 0.);
        vec3 p = s0.xyz - vec3(0., 4.9 * fall * fall, 0.);
        float alive = step(2.0, hgt) * step(0., p.y) * smoothstep(0., 0.25, t) * step(0.4, fract(aRnd.x * 7.31 + aRnd.y * 3.7));      // (polish 5) a bead is not seen until it falls: the waiting ones were a sparkle of white points on the rock
        vec4 wq = modelMatrix * vec4(p, 1.); wq.y += swellH(wq.xz);
        vec4 mv = viewMatrix * wq;
        float px = -mv.z * 2. / (projectionMatrix[1][1] * max(uResY, 100.));
        float w = max(0.10 + 0.07 * aRnd.x, px * 1.3) * alive;
        float len = (0.45 + 9.8 * fall * 0.09) * alive;                // a drop with a short tail, not a streak
        vec3 upv = (viewMatrix * modelMatrix * vec4(0., 1., 0., 0.)).xyz;
        mv.xyz += upv * position.y * len; mv.x += position.x * w;
        vC = position.xy; vAge = clamp(fall * 0.6, 0., 1.); vDim = clamp((0.10 + 0.07 * aRnd.x) / max(w, 1e-4), 0.2, 1.) * (0.4 + 0.6 * aRnd.y);
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uOrange, uGold, uCream; varying vec2 vC; varying float vAge, vDim;
      #include <fog_pars_fragment>
      void main(){
        float d = vDim * (1. - vC.x * vC.x) * smoothstep(-1.0, -0.72, vC.y) * (1. - smoothstep(-0.6, 1.0, vC.y)) * 0.9;      // a drop: bright head below, a tail fading upward
        vec3 col = mix(uGold * 1.5 + uCream * 0.3, uGold * 1.1 + uOrange * 0.5, smoothstep(0.0, 0.5, vAge)); col = mix(col, uOrange * 1.2, smoothstep(0.5, 1.0, vAge));
        ${FOG_FADE}
        gl_FragColor = vec4(col * d * (1. - fogK), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'gateDrips'; mesh.renderOrder = 3;
  return { mesh, uGateM };
}
