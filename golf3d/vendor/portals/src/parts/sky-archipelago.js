// THE CROWN ISLAND: hero set piece for the world "sky-archipelago" (Archipelago of Air).
//
// A floating island 400 m across shaped like a brimming crown: a round lake 300 m wide fills its
// top and spills through twelve notches in a low turf rim, so twelve 25 m waterfalls drop from the
// overhanging edge in a ring of white columns and fray into mist 300 m below. Under the rim the
// island narrows to a 160 m keel of banded rock (an inverted mountain with fangs and root curtains),
// leaving an open ring-shaped gallery 120 m wide between the falling water and the keel. In the
// middle of the lake stands a 60 m rock spire pierced by a round 16 m hole: the portal's seat.
// Coral frond-spiral trees and teal gourd trees (clusters of lobed bulbs) stand on the rim; a few skerries
// break the lake; root curtains tipped with glowing seed lanterns (round cream-gold teardrops) hang underneath.
// The rock: banded strata on the cliffs (broad beds take over from the fine strata where those would be smaller than
// a pixel, so a far island stays layered); on the ceilings the beds show as a few soft terraces with hair seams that fade out.
// That is the rock from further off than 98 m from the eye. Nearer than 49 m a rock face is drawn with the live version's
// pattern instead (crisp strata, each with its own tone and a full dark joint, a grain of lozenges 3 m by 1 m like
// brickwork, radial ribs on what faces down), and from 49 m to 98 m the two are mixed (liveRock() and THE HAND-OVER).
// THE SPOUT: the Crown drinks the cloud sea. A slowly twisting rope of cloud (three strands round a core) climbs
// from the floor of an eye in the deck into the tip of the keel, and what it brings up winds on round the keel in
// two bands (the draught; its puffs fade out within 120-270 m of the camera, so from the gallery none lies on the
// rock like paste). The eye and its spiral arms belong to the world's cloud sea, not to this piece.
//
// SPACE     +Y up, front = +Z (the final approach flies toward -Z, straight at the spire).
//           ORIGIN = centre of the lake AT THE WATERLINE (y = 0 is the lake surface; the island floats, so
//           this is its "base" plane). Rim turf rises to about +8, spire top about +60, underside of the
//           rim -10..-45, keel tip about -250, falls dissolve between -200 and -300. Put y = 0 wherever the
//           lake should be (the brief: 300 m or more above the cloud sea).
// SIZE      radius ~215 m (falls and mist reach r = 230), height ~370 m (y -310 .. +62). center = (0,-60,0).
//           ground: false (it floats); groundY = -300 is where the mist ends / a cloud sea should lie.
// COST      ~130k triangles, 7 draw calls, no lights, no textures, no render targets. Build ~300-400 ms, in steps:
//           buildHero is async and awaits ctx.yield() inside every loop (no step over ~15 ms).
// LIGHT     Rock, turf, trees and roots are MeshStandardMaterial: they take the scene's lights (wants one
//           warm directional key about 35 degrees up from behind-left of the final approach, i.e. from
//           (-0.5, 0.57, 0.65), plus a hemisphere). On top of that the piece adds its own "cloud-sea bounce":
//           downward-facing rock glows soft blue into pink (opts.bounce). Lake, falls and mist are unlit
//           shaders that need the sun vector: pass opts.sunDir (world space, toward the sun) or leave it
//           out and the piece adopts the first DirectionalLight of the scene it is added to. Every shader
//           honours scene fog. Falls and lake foam peak around 1.3-1.6 (they bloom gently).
//
// OPTS      palette     7 hex strings in brief order [sky blue, pale blue, cream, pink, teal, purple, yellow]
//           sunDir      [x,y,z] | Vector3, world space, toward the sun;  sunColor hex (default '#fff1d6')
//           skyTop, skyHorizon   hex colours of the sky (default palette[0], palette[1]); the lake mirrors skyTop and
//                       lakeHorizon (default skyHorizon: pass something deeper to keep the water deep under a pale sky)
//           lakeGain    brightness gain of the lake's body (default 1)
//           turfGain    brightness gain of the turf (and of whatever takes kit.turfTint: the world's grass) (default 1)
//           flowerColor hex | Color: the colour of the flowered drifts on the turf (default palette yellow). Under a low rosy sun
//                       and violet sky light pass a greener yellow with no blue in it, brighter than 1, or the drifts go brown
//           portalColor hex (default '#fff0c8'), portalGlow 0..3 (default 1): the streak laid on the lake
//                       under the hole and the light it throws on the rock of the hole
//           bounce      0..2 strength of the blue-pink under-glow (default 1)
//           mist        0..1.5 mist opacity gain (default 1)
//           seaY        local height of the cloud sea's top round the Crown (default -297): the falls' boils stand
//                       on it and the mist fades out below it
//           eyeY        local height of the floor of the eye under the keel, where the spout starts (default seaY - 60)
//           spout       0..1 opacity gain of the spout and the draught (default 1)
//           cloudShade  hex: the shade colour of mist, spout and draught (default '#7f96e2'; pass the sky's cloud shade)
//
// GLOW      the portal's streak on the lake and its light in the hole swell with nearness: 45% while the camera given to
//           update() is further than 640 m from the hole, 100% within 400 m (update() without a camera: fully on).
//           hero.uniforms exposes { uTime, uSun, uSunCol, uPortalGlow, uPortalCol, uBounce, uBounceA, uBounceB, uMist, uSpout }
//           (uBounceA / uBounceB: the colours of the under-glow where the rock is open to the sea / deep in).
// KIT       hero.kit lends the world the piece's own makers, so the other islands are made of the same stuff:
//           rockMaterial(), floraMaterial, rockTint(x,y,z,out), turfTint(x,z,out), meadowTint(lx,lz,out) (adds the flowered
//           drifts the rock material paints on turf; no grass takes it now: the blades keep the turf's own colour), beginFlora(), await endFlora(pause),
//           addTree(x,y,z,h,frond,rng,rich), addRoot(x,y,z,len,rng,pink,thick,bud), tube(), ribbon(), topHeight(x,z).
//
// ANCHORS   (all local space; angles are measured from +Z toward +X, so x = r sin a, z = r cos a)
//           portalSeat   { position (0,10,0), facing (0,0,1), radius 7, holeRadius 8 }: the 14 m portal
//                        fills the hole through the spire and faces the approach.
//           flyThrough   ordered Vector3 list, the brief's line: in between two falls at -150 degrees,
//                        a quarter turn through the gallery at y ~ -68 (falls on the right, keel on the
//                        left), out between two falls at -60 degrees, climbing turn outside the ring,
//                        over the rim at (0,10,205) and 250 m straight and level at y = 10 into the hole.
//                        At least 20 m clear of rock, roots, trees and fall cores everywhere.
//           gapIn, gapOut   the two points of that line that lie in the ring of falls.
//           rimCrest     (0,10,205): where the lake, spire and portal come into view.
//           viewpoints   { far, below, gallery, crest }: good camera positions.
//           lookAt       (0,10,0) the hole;  center (0,-60,0) the middle of the whole piece.
//           falls        12 x { angle, width, lip: Vector3, foot: Vector3, out: Vector3 } (out = unit
//                        outward direction); foot is where the water has become mist (y ~ -290).
//           spireTop     tip of the spire.  keelTip  lowest rock.
//           spout        { foot, tip }: where the spout leaves the cloud sea (at eyeY) and where it enters the keel.
//           landSites    ~40 x Vector3 on the rim turf, clear of the channels, the approach lane and the
//                        hero's own trees: seats for kit vegetation or creatures.
//           lakeRadius 150, rimRadius 200, keelRadius 80, galleryY -68, mistY -300, sunDirDefault.
import * as THREE from 'three';
import { clamp, lerp, smoothstep as sst } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2f6fe0', '#9fd8ff', '#fff3e0', '#ff8fb0', '#2fb89a', '#6a4a8a', '#ffd23f'];
const TAU = Math.PI * 2, R_RIM = 200, N_FALLS = 12, FALL_T = 7.8, HOLE_R = 8, HOLE_Y = 10, NT = 240, GLOW_FAR = 640, GLOW_NEAR = 400;
const wrapA = (a) => a - TAU * Math.round(a / TAU);

const GLSL_NOISE = /* glsl */`
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fb2(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fb3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vn3(p); p = p * 2.07 + 11.3; a *= 0.5; } return s / 0.875; }
// the flowered drifts of a meadow: a few lobes 8 to 20 m across where the flowers thicken, each breaking up toward its edge into
// loose clumps 3 to 4 m across and single plants, with green still showing inside it (two finer turns of the same field, three
// and eight times as fine). Sines only, so the same field can be worked out on the CPU (driftAt below, kit.meadowTint; no
// grass takes it now: the blades keep the turf's own colour). fpx = metres of ground under a pixel: the finer turns go before they alias.
// A drift's edge is a clear line with clumps along it, 0.12 of the field's range wide as live's edge is, not a wash of half flower,
// half turf; and never thinner than a pixel and a half (h grows with the field's change across a pixel), so far off it softens
// and does not crawl as the eye moves
float driftF(vec2 p, float fpx){
  vec2 q = vec2(0.8 * p.x + 0.6 * p.y, 0.8 * p.y - 0.6 * p.x);
  float a = q.x * 0.13 + 1.4 * sin(q.y * 0.057 + 1.0) + 0.6, b = q.y * 0.115 + 1.4 * sin(q.x * 0.049 + 2.0) + 2.1;
  float c = sin(q.x * 0.31 + 1.1 * sin(q.y * 0.19 + 0.7)) * sin(q.y * 0.27 + 1.1 * sin(q.x * 0.23 + 3.0));
  float d = sin(q.x * 0.93 + 1.3 * sin(q.y * 0.57 + 1.9)) * sin(q.y * 0.81 + 1.3 * sin(q.x * 0.69 + 0.4));
  float e = sin(q.x * 2.6 + 1.7 * sin(q.y * 1.4 + 2.2)) * sin(q.y * 2.3 + 1.7 * sin(q.x * 1.9 + 5.1));
  float f = 0.5 + 0.34 * sin(a) * sin(b) + 0.13 * c + 0.17 * d * (1.0 - smoothstep(0.9, 2.6, fpx)) + 0.1 * e * (1.0 - smoothstep(0.3, 0.9, fpx));
  float h = max(0.06, 0.75 * fwidth(f));
  return smoothstep(0.74 - h, 0.74 + h, f);
}
`;
// driftF on the CPU (x, z in the local frame of the mesh that carries the turf): 0 plain turf .. 1 the middle of a drift
function driftAt(x, z) {
  const qx = 0.8 * x + 0.6 * z, qz = 0.8 * z - 0.6 * x;
  const a = qx * 0.13 + 1.4 * Math.sin(qz * 0.057 + 1.0) + 0.6, b = qz * 0.115 + 1.4 * Math.sin(qx * 0.049 + 2.0) + 2.1;
  const c = Math.sin(qx * 0.31 + 1.1 * Math.sin(qz * 0.19 + 0.7)) * Math.sin(qz * 0.27 + 1.1 * Math.sin(qx * 0.23 + 3.0));
  const d = Math.sin(qx * 0.93 + 1.3 * Math.sin(qz * 0.57 + 1.9)) * Math.sin(qz * 0.81 + 1.3 * Math.sin(qx * 0.69 + 0.4));
  const e = Math.sin(qx * 2.6 + 1.7 * Math.sin(qz * 1.4 + 2.2)) * Math.sin(qz * 2.3 + 1.7 * Math.sin(qx * 1.9 + 5.1));
  return sst(0.68, 0.8, 0.5 + 0.34 * Math.sin(a) * Math.sin(b) + 0.13 * c + 0.17 * d + 0.1 * e);
}
const DRIFT_K = 0.75;       // how far the thick of a drift goes over to the flower colour (shader and meadowTint alike)

// ---------- small geometry accumulators ----------
function makeAcc() { return { p: [], c: [], m: [], idx: [], n: 0 }; }
function accAttributes(acc, mixName, mixSize) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3));
  g.setAttribute(mixName, new THREE.Float32BufferAttribute(acc.m, mixSize));
  g.setIndex(acc.idx);
  return g;
}
// vertex normals and bounds straight on the typed arrays (several times quicker than the library's attribute-by-attribute pass),
// handing the page back every thousand triangles
async function finishGeometry(g, pause) {
  const pos = g.attributes.position.array, idx = g.index.array, nv = pos.length, nor = new Float32Array(nv);
  for (let t = 0; t < idx.length; t += 3) {
    if (pause && t % 3000 === 0 && t) await pause(0.3);
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
  }
  if (pause) await pause();
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < nv; i += 3) {
    if (pause && i % 9000 === 0 && i) await pause(1.2);
    const l = Math.sqrt(nor[i] * nor[i] + nor[i + 1] * nor[i + 1] + nor[i + 2] * nor[i + 2]) || 1; nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l;
    const x = pos[i], y = pos[i + 1], z = pos[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (pause) await pause();
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  let r2 = 0;
  for (let i = 0; i < nv; i += 3) { const dx = pos[i] - cx, dy = pos[i + 1] - cy, dz = pos[i + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(nv ? cx : 0, nv ? cy : 0, nv ? cz : 0), nv ? Math.sqrt(r2) : 0);
  return g;
}
// attributes, then (after handing the page back) normals and bounds: short steps instead of one long one
async function accGeometry(acc, mixName, mixSize, pause) {
  if (!pause) return finishGeometry(accAttributes(acc, mixName, mixSize), null);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.p, 3)); await pause(1.3);
  g.setAttribute('color', new THREE.Float32BufferAttribute(acc.c, 3)); await pause(1.0);
  g.setAttribute(mixName, new THREE.Float32BufferAttribute(acc.m, mixSize));
  g.setIndex(acc.idx); await pause(2.0);
  return finishGeometry(g, pause);
}
// index a (cols x rows) vertex grid that starts at vertex `base`; wrapU closes the columns
function gridIndex(acc, base, cols, rows, wrapU, wrapV, flip) {
  const nu = wrapU ? cols : cols - 1, nv = wrapV ? rows : rows - 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const i1 = (i + 1) % cols, j1 = (j + 1) % rows;
    const a = base + j * cols + i, b = base + j * cols + i1, c = base + j1 * cols + i1, d = base + j1 * cols + i;
    if (flip) acc.idx.push(a, b, c, a, c, d); else acc.idx.push(a, c, b, a, d, c);
  }
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('crown-island');
  const N = ctx.noise;
  // pause(w): a point where the page may be handed back; w = roughly what the work since the last such point costs (ms on the
  // slow shared test machine; default 0.4). On its own the piece hands the page back at every one of them (the engine only
  // waits when a few ms have passed); a world may pass opts.pause / opts.rest to batch them with its own (rest = hand back now)
  const pause = opts.pause || (() => ctx.yield()), rest = opts.rest || (() => ctx.yield());
  const pal = (opts.palette && opts.palette.length >= 5 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  while (pal.length < 7) pal.push(new THREE.Color(DEFAULT_PALETTE[pal.length]));
  const [cSky, cHaze, cCream, cPink, cTeal, cRock, cYellow] = pal;
  const tmpC = new THREE.Color();

  // ---------- per-seed character ----------
  const S = {
    o: [rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(0, 90)],
    keelD: rng.range(238, 266),                         // depth of the keel tip
    keelPow: rng.range(0.7, 0.95),                      // blunt .. pointed keel
    tipX: rng.range(-34, 34), tipZ: rng.range(-34, 34), // the keel leans
    hum: rng.range(0.8, 1.25),                          // how hilly the rim is
    spH: rng.range(57, 66), spW: rng.range(17.5, 20), spLean: rng.range(4, 9) * rng.sign(),
    sh: rng.range(0.42, 0.66), shW: rng.range(8, 12),   // the spire's shoulder prong: height fraction, width
    strata: rng.range(0.13, 0.19), warm: rng.range(0, 1),
  };
  S.shX = -Math.sign(S.spLean) * rng.range(8, 12);
  const falls = [];
  for (let k = 0; k < N_FALLS; k++) falls.push({ a: wrapA((k + 0.5) * TAU / N_FALLS + rng.range(-0.02, 0.02)), w: rng.range(22, 28), seed: rng.range(0, 50) });

  // ---------- the top as a function ----------
  function chanAt(th, r) {          // 1 inside a spillway channel, 0 on land; channels funnel open toward the lake
    let best = 0;
    const funnel = 1 + 1.5 * sst(188, 154, r);
    for (const f of falls) {
      const d = Math.abs(wrapA(th - f.a)) * R_RIM, half = f.w * 0.5 * funnel;
      if (d < half * 1.3 + 2) best = Math.max(best, 1 - sst(half * 0.8, half * 1.3 + 2, d));
    }
    return best;
  }
  function landH(r, th) {           // rim land height before the channels are cut
    const x = Math.sin(th) * r, z = Math.cos(th) * r;
    const shoreR = 151 + 5 * N.fbm2(x * 0.012 + S.o[0], z * 0.012 + S.o[1], 3);
    let hum = 2.8 + S.hum * (2.4 * N.fbm2(x * 0.021 + S.o[2], z * 0.021, 4) + 4.2 * Math.max(0, N.fbm2(x * 0.008 + S.o[3], z * 0.008 + 5, 3)));
    hum = Math.max(1.3, hum) + 1.5 * sst(185, 197, r);
    if (z > 0) hum = lerp(hum, Math.min(hum, 2.4), 1 - sst(12, 30, Math.abs(x)));     // keep the approach lane low
    return -5 + (5 + hum) * sst(-6, 12, r - shoreR);
  }
  function topH(r, th) { const h = landH(r, th), c = chanAt(th, r); return lerp(h, Math.min(h, -2.2), c); }

  // ---------- underside profile: trumpet ceiling into an inverted cone, sampled by arc length ----------
  function rUnder(y) {
    const tk = clamp((-46 - y) / (S.keelD - 46), 0, 1);
    return 80 * Math.pow(1 - tk, S.keelPow) + 118 * Math.pow(1 - clamp((-10 - y) / 38, 0, 1), 2.2);
  }
  const NU = 48, prof = [];
  {
    const fine = [], M = 600; let len = 0;
    for (let k = 0; k <= M; k++) {
      const y = lerp(-10, -S.keelD, k / M), r = rUnder(y);
      if (k) len += Math.hypot(r - fine[k - 1].r, y - fine[k - 1].y);
      fine.push({ r, y, s: len });
    }
    let q = 1;
    for (let k = 0; k <= NU; k++) {
      const s = len * Math.pow(k / NU, 1.08);
      while (q < M && fine[q].s < s) q++;
      const a = fine[q - 1], b = fine[q], f = clamp((s - a.s) / Math.max(1e-6, b.s - a.s), 0, 1);
      const tr = b.r - a.r, ty = b.y - a.y, tl = Math.hypot(tr, ty) || 1;
      prof.push({ r: lerp(a.r, b.r, f), y: lerp(a.y, b.y, f), s, nr: -ty / tl, ny: tr / tl });
    }
  }

  // ---------- island: one closed polar grid (rim land, cliff, ceiling, keel) ----------
  const thetas = new Float32Array(NT);
  for (let i = 0; i < NT; i++) { const u = (i / NT) * TAU; thetas[i] = u - (0.62 / 12) * Math.sin(12 * u - Math.PI); }   // denser at the channels
  const R_TOP = [132, 140, 146, 150, 153, 156, 159, 163, 168, 174, 180, 186, 191, 195, 198, 199.6];
  const CLIFF = [[200.9, 0.2], [201.3, 0.5], [200.5, 0.8]];
  const isl = makeAcc();
  const rockTint = (x, y, z, out) => {
    const n = 0.5 + 0.5 * N.fbm3(x * 0.013 + S.o[4], y * 0.02, z * 0.013, 3);
    out.copy(cRock).lerp(cCream, 0.3 + 0.32 * n);
    out.r *= 1 + 0.12 * S.warm; out.b *= 1 - 0.1 * S.warm;
    return out;
  };
  const turfGain = opts.turfGain ?? 1;
  const turfTint = (x, z, out) => {
    const n = 0.5 + 0.5 * N.fbm2(x * 0.03 + S.o[5], z * 0.03, 3);
    out.copy(cTeal).multiplyScalar(0.62 + 0.4 * n); out.g += 0.03 * (1 - n); out.r += 0.02; out.b += 0.05;
    return out.multiplyScalar(turfGain);
  };
  // the turf colour with the drifts included (unused by the world's grass since the blades went back to the turf's own colour): `out` holds turfTint(...) already; (lx, lz) is the point in the
  // local frame of the mesh that carries the turf (the rock material shades the same drift there)
  const cFlowerMean = (opts.flowerColor ? new THREE.Color(opts.flowerColor) : cYellow.clone()).multiplyScalar(0.85);
  const meadowTint = (lx, lz, out) => out.lerp(cFlowerMean, DRIFT_K * driftAt(lx, lz));
  const pushV = (acc, x, y, z, col, m0, m1) => { acc.p.push(x, y, z); acc.c.push(col.r, col.g, col.b); acc.m.push(m0, m1); acc.n++; };
  for (let j = 0; j < R_TOP.length; j++) for (let i = 0; i < NT; i++) {
    if (i % 60 === 0) await pause(0.7);
    const r = R_TOP[j], th = thetas[i], x = Math.sin(th) * r, z = Math.cos(th) * r;
    const h = topH(r, th), c = chanAt(th, r);
    let rock = Math.max(sst(197.2, 199.6, r), c, sst(0.4, -0.6, h) * 0.6);     // turf runs to within a couple of metres of the lip
    turfTint(x, z, tmpC);
    if (h < 0.9) tmpC.lerp(cCream, 0.55 * sst(0.9, 0.1, h)).multiplyScalar(lerp(1, 0.55, sst(0.2, -1.5, h)));   // pale shore, wet below the line
    if (rock > 0.5) rockTint(x, h, z, tmpC).multiplyScalar(c > 0.3 ? 0.6 : 1);
    pushV(isl, x, h, z, tmpC, rock, 1);
  }
  await pause();
  for (let j = 0; j < CLIFF.length; j++) for (let i = 0; i < NT; i++) {
    if (i % 80 === 0) await pause(1.4);
    const th = thetas[i], x0 = Math.sin(th), z0 = Math.cos(th), ye = topH(199.6, th), f = CLIFF[j][1];
    const y = lerp(ye, -10, f), r = CLIFF[j][0] + 1.3 * N.n3(x0 * 60, y * 0.3, z0 * 60);
    rockTint(x0 * r, y, z0 * r, tmpC);
    if (z0 > 0.8) tmpC.lerp(cCream, 0.65 * sst(0.8, 0.9, z0));         // the cliff under the approach lane is warm, pale stone: it shows between the hanging vines
    pushV(isl, x0 * r, y, z0 * r, tmpC, 1, 1);
  }
  const ridgeI = new Float64Array(NT);             // the ribs' ridge depends on the bearing alone: once per column
  for (let i = 0; i < NT; i++) { if (i % 60 === 0) await pause(0.2); ridgeI[i] = N.ridged2(Math.sin(thetas[i]) * 5.5 + S.o[3], Math.cos(thetas[i]) * 5.5 + S.o[5], 3); }
  for (let k = 0; k <= NU; k++) for (let i = 0; i < NT; i++) {
    if (i % 60 === 0) await pause();
    const pr = prof[k], th = thetas[i], x0 = Math.sin(th), z0 = Math.cos(th);
    const tk = clamp((-46 - pr.y) / (S.keelD - 46), 0, 1), ramp = sst(0, 14, pr.s);
    const px = x0 * pr.r, pz = z0 * pr.r;
    const amp = lerp(4.5, 17, sst(-22, -70, pr.y)) * (1 - 0.6 * tk * tk);
    let d = amp * N.fbm3(px * 0.011 + S.o[0], pr.y * 0.011, pz * 0.011 + S.o[1], 4) + 3.2 * N.fbm3(px * 0.05, pr.y * 0.05 + S.o[2], pz * 0.05, 3);
    d += 3.0 * Math.sin(pr.y * 0.33 + 3 * N.n2(th * 2, pr.y * 0.02)) * sst(-44, -64, pr.y) * (1 - tk);     // terraces on the keel
    const ridge = ridgeI[i], ribK = sst(-10.3, -13, pr.y) * sst(-78, -44, pr.y);
    d += 16 * (ridge - 0.35) * ribK;                                                          // ribs radiating from the keel, out to the rim
    d *= ramp;
    const r = Math.max(0.6, pr.r + pr.nr * d), y = pr.y + pr.ny * d * (pr.y > -40 ? 1 : 0.5);
    const x = x0 * r + S.tipX * tk * tk, z = z0 * r + S.tipZ * tk * tk;
    rockTint(x, y, z, tmpC);
    const ao = lerp(1, 0.62, sst(150, 86, pr.r) * sst(-80, -30, pr.y)) * (1 - 0.3 * sst(0.5, 0.14, ridge) * ribK);       // the ceiling darkens toward the keel and in the troughs between its ribs
    pushV(isl, x, y, z, tmpC, 1, ao);
  }
  await pause();
  gridIndex(isl, 0, NT, R_TOP.length + CLIFF.length + NU + 1, true, false, false);
  await rest();
  const rowU0 = (R_TOP.length + CLIFF.length) * NT;                 // first underside vertex
  const underAt = (k, i, out) => { const o = (rowU0 + k * NT + ((i % NT) + NT) % NT) * 3; return out.set(isl.p[o], isl.p[o + 1], isl.p[o + 2]); };
  await ctx.yield();

  // ---------- rock blobs: fangs under the island, skerries in the lake ----------
  // taper 1 = a hanging fang; blunt 0..0.5 = how much of a stub its broken tip keeps (0 = a point)
  function blob(acc, cx, cy, cz, rx, ry, rz, taper, shade, cols = 12, rows = 8, blunt = 0) {
    const base = acc.n, f = 1.1 / Math.max(rx, rz), cut = -1 + 0.5 * blunt, tiltX = blunt * Math.sin(cx * 1.7), tiltZ = blunt * Math.cos(cz * 1.3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const phi = (j / (rows - 1)) * Math.PI, th = (i / cols) * TAU;
      let sy = Math.cos(phi);
      const k = Math.sin(phi) * lerp(1, (blunt + (1 - blunt) * Math.pow((sy + 1) / 2, 0.8)) * 1.35, taper) * (j === rows - 1 ? 0 : 1);
      const sx = k * Math.sin(th), sz = k * Math.cos(th);
      if (taper && blunt > 0 && sy < cut) sy = cut + 0.25 * (sx * tiltX + sz * tiltZ);                 // the break: a tilted flat end
      const n = (1 + (taper ? 0.55 : 0.42) * N.fbm3(cx * 0.37 + sx * rx * f, cy * 0.37 + sy * 1.2, cz * 0.37 + sz * rz * f, 3))
        * (taper ? 1 + 0.16 * N.n3(cx + sx * 2.9, cy * 0.2 + sy * ry * 0.55, cz + sz * 2.9) : 1);          // flutes and knuckles down its length
      const x = cx + sx * rx * n, y = cy + sy * ry * (taper ? 1 : n), z = cz + sz * rz * n;
      pushV(acc, x, y, z, rockTint(x, y, z, tmpC).multiplyScalar(shade), 1, shade);
    }
    gridIndex(acc, base, cols, rows, true, false, false);
  }
  const fangRng = rng.fork('fangs'), _p = new THREE.Vector3(), _q = new THREE.Vector3();
  for (let n = 0; n < 78; n++) {
    await pause();
    const k = fangRng.int(4, NU - 8), i = fangRng.int(0, NT - 1);
    underAt(k, i, _p);
    const rr = Math.hypot(_p.x, _p.z), near = sst(150, 95, rr);
    const len = fangRng.range(5, 12) + near * fangRng.range(2, 24), rad = fangRng.range(1.6, 3.4) + near * fangRng.range(0.5, 3.6);
    blob(isl, _p.x, _p.y - len * 0.72, _p.z, rad, len, rad, 1, lerp(0.95, 0.72, near), 12, 9, (n * 7) % 5 < 3 ? 0.14 + 0.07 * ((n * 3) % 5) : 0);
  }
  await pause();
  const islandGeo = await accGeometry(isl, 'aMix', 2, pause);
  await rest();

  // ---------- the spire: a torus-topology grid wrapped round the hole ----------
  const spHalf = (y) => S.spW * Math.pow(clamp(1 - (y + 5) / (S.spH + 5), 0, 1), 0.75) + 5 * Math.exp(-(y + 5) / 6);
  const spLeanAt = (y) => S.spLean * Math.pow(Math.max(y, 0) / S.spH, 2);
  const shH = S.spH * S.sh, shDir = Math.sign(S.shX);
  const inSpire = (x, y) => {
    if (y < -6 || y > S.spH) return false;
    if (Math.abs(x - spLeanAt(y)) < spHalf(y)) return true;
    if (y < shH) return Math.abs(x - S.shX - shDir * 0.36 * Math.max(y, 0)) < S.shW * Math.pow(1 - (y + 5) / (shH + 5), 0.7);
    return false;
  };
  const NS = 128, NP = 64, rho = new Float32Array(NS);
  for (let t = 0; t < NS; t++) {
    if (t % 4 === 0) await pause();
    const a = (t / NS) * TAU, dx = Math.sin(a), dy = Math.cos(a);
    let last = HOLE_R + 2;
    for (let r = HOLE_R + 2; r < 92; r += 0.5) if (inSpire(dx * r, HOLE_Y + dy * r)) last = r;
    let lo = last, hi = last + 0.5;
    for (let b = 0; b < 8; b++) { const mid = (lo + hi) / 2; if (inSpire(dx * mid, HOLE_Y + dy * mid)) lo = mid; else hi = mid; }
    rho[t] = Math.max(lo, HOLE_R + 5);
  }
  for (let pass = 0; pass < 2; pass++) { const c = rho.slice(); for (let t = 0; t < NS; t++) rho[t] = 0.25 * c[(t + NS - 1) % NS] + 0.5 * c[t] + 0.25 * c[(t + 1) % NS]; }
  const sp = makeAcc();
  const spireTop = new THREE.Vector3(0, 0, 0);
  // the section runs from the wall of the hole (cp = -1) out to the silhouette (cp = +1) and back; its samples crowd toward
  // the hole (the 1.6 power), so the rock the camera passes last is made of small even quads, not long radial slivers
  for (let t = 0; t < NS; t++) { await pause(0.6); for (let p = 0; p < NP; p++) {
    const a = (t / NS) * TAU, dx = Math.sin(a), dy = Math.cos(a), ph = (p / NP) * TAU;
    const cp = Math.cos(ph), spn = Math.sin(ph), span = rho[t] - HOLE_R;
    const ex = Math.sign(cp) * Math.pow(Math.abs(cp), 0.85), ez = Math.sign(spn) * Math.pow(Math.abs(spn), 0.8);
    let radial = HOLE_R + span * Math.pow(0.5 + 0.5 * ex, 1.6);
    let x = dx * radial, y = HOLE_Y + dy * radial;
    const B = lerp(10.5, 2.0, Math.pow(sst(-6, S.spH, y), 0.8)) * (1 + 0.2 * N.n2(x * 0.06 + S.o[3], y * 0.06));
    let z = B * ez;
    let d = 2.3 * N.fbm3(x * 0.05 + S.o[4], y * 0.05, z * 0.05 + S.o[5], 4) + 0.8 * N.fbm3(x * 0.21, y * 0.21 + S.o[0], z * 0.21, 2)
      + 0.7 * Math.sin(y * 1.05 + 2.5 * N.n3(x * 0.04, y * 0.04, z * 0.04));
    const lip = sst(HOLE_R + 3.2, HOLE_R + 0.3, radial);                 // the rock right round the hole stays smooth and true
    d *= 1 - 0.75 * lip;
    radial += cp * (cp < 0 ? -Math.abs(d) : d);
    x = dx * radial; y = HOLE_Y + dy * radial; z += spn * d * 0.8;
    // true-scale banding, a wet waterline, and a dark damp lip round the hole so the portal sits in a calm, darker ring
    rockTint(x, y, z, tmpC).multiplyScalar(lerp(0.5, 1, sst(0.2, 2.4, y)) * lerp(1, 0.5, sst(HOLE_R + 2.6, HOLE_R + 0.4, radial)));
    pushV(sp, x, y, z, tmpC, 1, lerp(1, 0.72, lip));
    if (y > spireTop.y) spireTop.set(x, y, z);
  } }
  await pause();
  gridIndex(sp, 0, NP, NS, true, true, true);
  await pause(2.5);
  // skerries: low rocks in the lake, clear of the approach lane (|x| < 22, z > -25)
  const skRng = rng.fork('skerries'), nSk = skRng.int(6, 10);
  for (let n = 0; n < nSk; n++) {
    const a = skRng.range(0, TAU), r = n < 3 ? skRng.range(30, 50) : skRng.range(64, 138);
    let x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 34) x = (x < 0 ? -1 : 1) * skRng.range(36, 60);
    const s = skRng.range(1.6, 3.8) * (n < 3 ? 1.35 : 1);
    blob(sp, x, s * 0.25, z, s * skRng.range(0.9, 1.5), s * skRng.range(0.9, 2.1), s * skRng.range(0.9, 1.5), 0, 1, 14, 9);
    if (skRng.chance(0.6)) blob(sp, x + s * 1.4, s * 0.05, z + skRng.range(-s, s), s * 0.6, s * 0.7, s * 0.7, 0, 1);
    await pause();
  }
  await pause();
  const spireGeo = await accGeometry(sp, 'aMix', 2, pause);
  await pause();
  {                                   // moss on the ledges and in a broken collar round the hole, wet band at the waterline
    const pos = spireGeo.attributes.position, nor = spireGeo.attributes.normal, col = spireGeo.attributes.color, mix = spireGeo.attributes.aMix;
    for (let i = 0; i < pos.count; i++) {
      if (i % 100 === 0) await pause(0.5);
      const x = pos.getX(i), y = pos.getY(i), rh = Math.hypot(x, y - HOLE_Y);
      const collar = sst(HOLE_R + 1.4, HOLE_R + 2.6, rh) * sst(HOLE_R + 9, HOLE_R + 4, rh) * sst(-0.15, 0.35, N.fbm2(x * 0.16 + S.o[2], y * 0.16 + S.o[4], 3) + 0.25 * nor.getY(i));
      const k = Math.max(sst(0.62, 0.9, nor.getY(i)) * sst(1.5, 4, y), 0.8 * collar * sst(1.5, 4, y));
      if (k <= 0) continue;
      turfTint(pos.getX(i) * 4, pos.getZ(i) * 4, tmpC);
      col.setXYZ(i, lerp(col.getX(i), tmpC.r, k), lerp(col.getY(i), tmpC.g, k), lerp(col.getZ(i), tmpC.b, k));
      mix.setX(i, 1 - 0.85 * k);
    }
  }
  await pause();

  // ---------- shared uniforms ----------
  const sunDefault = new THREE.Vector3(-0.5, 0.57, 0.65).normalize();
  const toV3 = (v, d) => (v ? (v.isVector3 ? v.clone() : new THREE.Vector3(v[0], v[1], v[2])).normalize() : d.clone());
  const glowBase = opts.portalGlow ?? 1;
  const U = {
    uTime: { value: 0 },
    uSun: { value: toV3(opts.sunDir, sunDefault) },
    uSunCol: { value: new THREE.Color(opts.sunColor || '#fff1d6') },
    uSkyTop: { value: new THREE.Color(opts.skyTop || cSky) },
    uSkyHor: { value: new THREE.Color(opts.skyHorizon || cHaze) },
    uLakeHor: { value: new THREE.Color(opts.lakeHorizon || opts.skyHorizon || cHaze) }, uLakeGain: { value: opts.lakeGain ?? 1 },
    uBounceA: { value: cHaze.clone() }, uBounceB: { value: cPink.clone() }, uBounce: { value: opts.bounce ?? 1 },
    uPortalCol: { value: new THREE.Color(opts.portalColor || '#fff0c8') }, uPortalGlow: { value: glowBase },
    uPortalPos: { value: new THREE.Vector3(0, HOLE_Y, 0) },
    uFlower: { value: opts.flowerColor ? new THREE.Color(opts.flowerColor) : cYellow.clone() }, uStrata: { value: S.strata },
    uRock: { value: cRock.clone().lerp(cCream, 0.3).lerp(cPink, 0.12) },
    uShallow: { value: cTeal.clone().lerp(cHaze, 0.35) }, uDeep: { value: cSky.clone().multiplyScalar(0.5).lerp(cTeal, 0.25) },
    uWhite: { value: cCream.clone().lerp(new THREE.Color(1, 1, 1), 0.85) },
    uCloudShade: { value: new THREE.Color(opts.cloudShade || '#7f96e2') },
    uSpire: { value: new THREE.Vector4(S.spH, S.spW, S.spLean, 0) },
    uMist: { value: opts.mist ?? 1 },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---------- rock + turf material: standard lighting, procedural strata, bump, cloud-sea bounce ----------
  // makeRockMat(false) gives the same look without the portal's light: for the world's other islands (own local frames)
  const noGlow = { value: 0 };
  const makeRockMat = (portal) => {
  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  rockMat.onBeforeCompile = (sh) => {
    for (const k of ['uBounceA', 'uBounceB', 'uBounce', 'uPortalCol', 'uPortalGlow', 'uPortalPos', 'uFlower', 'uStrata']) sh.uniforms[k] = (k === 'uPortalGlow' && !portal) ? noGlow : U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aMix; varying vec2 vMix; varying vec3 vLP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMix = aMix; vLP = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_NOISE + /* glsl */`
        uniform vec3 uBounceA, uBounceB, uPortalCol, uPortalPos, uFlower; uniform float uBounce, uPortalGlow, uStrata;
        varying vec2 vMix; varying vec3 vLP; float gH;
        // ROCK NEAR THE EYE. liveRock() is the rock pattern of the live version (eval4), its lines letter for letter: every
        // stratum has its own tone and every joint is a full dark line along its whole length; the grain is three octaves of
        // lozenges (3 m by 1.05 m, 1.5 m by 0.5 m, 0.7 m by 0.25 m: brickwork between the joints) at full strength; the
        // close-range grain (cells 53 cm by 29 cm, three octaves) is in full within 26 m and gone by 80 m; radial ribs lie on
        // every face that looks down, a keel's flank included. Nothing in it is faded, swapped or left out by the size of a
        // pixel: only by distance in metres. It is the whole of the rock nearer than 49 m and has a falling share of it from
        // 49 m out to 98 m (THE HAND-OVER in the block below); beyond 98 m it is not drawn, so its own far fades (the grain
        // from 260 m, the strata from 350 m) never come into play. (P, sid, sf, vd, mott and the three weights of side,
        // ceiling and top come from the block below: the strata are laid by the same coordinates in both patterns.)
        void liveRock(vec3 P, float sid, float sf, float vd, float mott, float flatk, float ceilk, float topk, out vec3 rockC, out float gRock){
          float farK = smoothstep(350.0, 900.0, vd);
          float tone = mix(h11(sid), 0.5, 0.7 * farK), ledge = mix(smoothstep(0.0, 0.14, sf) * (1.0 - smoothstep(0.82, 1.0, sf)), 1.0, farK);
          float grain = mix(0.5, fb3(P * vec3(0.33, 0.95, 0.33)), 1.0 - smoothstep(260.0, 620.0, vd));
          float fine = mix(0.5, fb3(P * vec3(1.9, 3.4, 1.9) + 7.0), 1.0 - smoothstep(26.0, 80.0, vd));   // close-range grain
          vec2 rd = P.xz / max(length(P.xz), 1e-3);
          float rib = fb3(vec3(rd * 8.0, length(P.xz) * 0.045));
          vec3 sideC = mix(vec3(0.66, 0.58, 0.80), vec3(1.30, 1.14, 0.96), mix(tone * tone, tone, 0.45)) * (0.58 + 0.42 * ledge) * (0.72 + 0.56 * grain) * (0.88 + 0.24 * fine);
          vec3 ceilC = mix(vec3(0.82, 0.76, 0.96), vec3(1.12, 0.98, 0.98), smoothstep(0.25, 0.75, mott)) * (0.66 + 0.5 * smoothstep(0.3, 0.7, rib)) * (0.9 + 0.2 * grain);
          vec3 topC = mix(vec3(0.92, 0.80, 0.88), vec3(1.28, 1.14, 0.98), smoothstep(0.2, 0.8, mott + 0.4 * (tone - 0.5))) * (0.8 + 0.4 * grain) * (0.9 + 0.2 * fine);
          rockC = sideC * (1.0 - flatk) + ceilC * ceilk + topC * topk;
          gRock = (ledge * (1.5 + tone * 0.8) + grain * 1.3 + fine * 0.55) * (1.0 - flatk) + (rib * 1.5 + mott * 1.1 + grain * 0.7) * ceilk + (mott * 1.4 + grain * 1.1 + fine * 0.5) * topk;
        }`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          float rk = vMix.x; vec3 P = vLP;
          float wv = fb3(P * 0.017);
          float sc = P.y * uStrata + wv * 3.0 + fb3(P * 0.07) * 0.7;      // bands lie near level: a slow roll, never a swirl
          float sid = floor(sc), sf = fract(sc);
          float vd = length(vViewPosition), aw = fwidth(sc), fpx = max(length(dFdx(P)), length(dFdy(P)));
          float fmn = min(length(dFdx(P)), length(dFdy(P)));     // metres to a pixel ACROSS the line of sight: how near the rock is, however steeply it is seen
          // (from here down to rockC: this version's own, smoother pattern. It is the whole of the rock beyond 98 m from the
          // eye and shares it with liveRock() from 98 m in to 49 m; nearer than 49 m none of it is drawn. So what the notes
          // below say of a face beside the lane (the mottle that takes the grain's place, the two lattices of the close-range
          // grain and its fall to a quarter, the ribs left out on a keel's flank, the terraces of a ceiling) is what this
          // pattern does by the size of a pixel, and it shows only from 49 m out, in the share this pattern has there)
          float farK = max(smoothstep(350.0, 900.0, vd), smoothstep(0.3, 0.75, aw)), bedK = 1.0 - smoothstep(1.5, 3.75, aw);     // (aw: strata to a pixel, so a rim seen edge-on never speckles)
          // the fine strata fade with distance (they would shimmer), and broad beds five strata thick take over from them: a far
          // island is still layered rock, in a few wide bands, never a smooth cone
          float sc2 = sc * 0.2 + 0.37, sf2 = fract(sc2), bed = mix(0.5, h11(floor(sc2) + 31.0), 0.75 * bedK);
          // the joint between two strata is a dark line; a slow mask of its own fades about half of every joint's length out to a
          // faint ledge, so a cliff is never ruled with lines of one even weight
          float jm = smoothstep(0.34, 0.66, vn3(P * vec3(0.045, 0.02, 0.045) + floor(sc + 0.18) * 7.3 + 3.0));
          float joint = mix(1.0, smoothstep(0.0, 0.14, sf) * (1.0 - smoothstep(0.82, 1.0, sf)), 0.28 + 0.72 * jm);
          float tone = mix(h11(sid), bed, max(farK, 0.22)), ledge = mix(joint, mix(0.75, 0.5 + 0.5 * smoothstep(0.0, 0.12, sf2) * (1.0 - smoothstep(0.86, 1.0, sf2)), bedK), farK);
          // grain fades out with distance (to its mean) before it gets smaller than a pixel: far cliffs stay clean, not speckled
          // (and by its size on screen, the fine octaves first: a cliff seen far off or edge-on is banded, never salt and pepper)
          vec3 gp = P * vec3(0.33, 0.95, 0.33);
          // (every octave is gone before its cells are under four pixels: finer than that the bump below, whose slopes are worked
          // out once for each 2 x 2 block of pixels, turns a cliff into coarse blocks, as a low-resolution texture would)
          // (and at the other end: where one cell of the grain, a lozenge 3 m by 1 m, would stand a dozen pixels tall and more, a
          // flank beside the lane, however steeply it is seen, it gives way to a broad soft mottle three times as coarse: close rock
          // is soft bands and patches, not a weave of dashes; the close-range grain below carries the fine texture there)
          float grainN = mix(mix(vn3(gp), fb3(gp), 1.0 - smoothstep(0.03, 0.1, fpx)), 0.5 + 0.6 * (vn3(gp * 0.3 + 4.0) - 0.5), 0.85 * (1.0 - smoothstep(0.05, 0.16, fmn)));
          float grain = mix(0.5, grainN, (1.0 - smoothstep(260.0, 620.0, vd)) * (1.0 - smoothstep(0.14, 0.45, fpx)));
          // close-range grain: cells 53 cm by 29 cm, for rock whose pixels hold 3 to 10 cm. Where a cell stands five pixels tall and
          // more (a keel flank within 25 m of the lane) one lattice of them reads as rows of dashes, a weave: so the field is two
          // lattices of unlike pitch laid over each other (no rows), and it fades to a quarter of its strength as the cells grow
          // on screen: the near flank is left to its bands and its mottle
          vec3 fq = P * vec3(1.9, 3.4, 1.9) + 7.0;
          float fineN = 0.5 * (vn3(fq) + vn3(fq * 0.73 + 3.1));
          float fine = mix(0.5, mix(fineN, fb3(fq), 1.0 - smoothstep(0.012, 0.035, fpx)), (1.0 - smoothstep(26.0, 80.0, vd)) * (1.0 - smoothstep(0.035, 0.1, fpx)) * (0.25 + 0.75 * smoothstep(0.03, 0.09, fmn)));
          float wny = dot(normalize(vNormal), vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]));
          float flatk = smoothstep(0.5, 0.88, abs(wny)), ceilk = flatk * step(wny, 0.0), topk = flatk - ceilk;
          vec2 rd = P.xz / max(length(P.xz), 1e-3);
          float rib = fb3(vec3(rd * 13.0, length(P.xz) * 0.11 + P.y * 0.2)), mott = fb3(P * 0.06 + 5.0);    // (the height term: no streaks drawn down a flare)
          // the ribs belong to true ceilings: on the sloping flank of a keel they run down across the strata as vertical joints (a
          // woven, brick-like wall at close range), so there they are left out while a pixel is under 7 cm of rock across and are
          // back where it is 14
          rib = mix(0.5, rib, max(smoothstep(0.8, 0.95, -wny), smoothstep(0.07, 0.14, fmn)));
          // cliffs: banded strata. Ceilings: pale stone with soft radial ribs (it is lit from below by the cloud sea).
          // Rock that faces the sky (rims, ledges): warm and light, so no island wears a slate-grey collar.
          vec3 sideC = mix(vec3(0.66, 0.58, 0.80), vec3(1.30, 1.14, 0.96), mix(tone * tone, tone, 0.45)) * (0.58 + 0.42 * ledge) * (0.72 + 0.56 * grain) * (0.88 + 0.24 * fine);
          vec3 ceilC = mix(vec3(0.82, 0.76, 0.96), vec3(1.12, 0.98, 0.98), smoothstep(0.25, 0.75, mott)) * (0.7 + 0.42 * smoothstep(0.3, 0.7, rib)) * (0.9 + 0.2 * grain);
          // seen from below the beds are a few soft terraces: each bed a faint step, lit along the edge that stands proud and in soft
          // shade on the other side, with a hair seam between (under two pixels wide at any range). A slow mask, different for each
          // seam, fades most of every seam out along its length: a worked ceiling, never a drawn maze
          float cw = max(aw, 1e-4), csd = sf - step(0.5, sf), cad = abs(csd);              // csd: signed distance to the nearest seam, in beds
          float cmask = smoothstep(0.4, 0.72, vn(P.xz * 0.045 + floor(sc + 0.5) * 3.7 + 8.0));
          float cK = ceilk * (1.0 - smoothstep(0.2, 0.5, cw)) * cmask, cline = 1.0 - smoothstep(0.0, 1.6 * cw, cad);
          float cstep = mix(-0.7, 1.0, smoothstep(-cw, cw, csd)) * exp(-cad / 0.12);
          ceilC *= (0.93 + 0.14 * tone) * (0.88 + 0.24 * fine) * (1.0 - 0.15 * cK * cline) * (1.0 + 0.1 * cK * cstep);
          vec3 topC = mix(vec3(0.92, 0.80, 0.88), vec3(1.28, 1.14, 0.98), smoothstep(0.2, 0.8, mott + 0.4 * (tone - 0.5))) * (0.8 + 0.4 * grain) * (0.9 + 0.2 * fine);
          vec3 rockC = sideC * (1.0 - flatk) + ceilC * ceilk + topC * topk;
          // THE HAND-OVER, by the fragment's distance from the eye in metres (vd): a way of drawing by distance, as the far
          // fades above are (nothing is placed, hidden or timed by it). Nearer than 49.1 m the rock is liveRock() alone:
          // crisp banded strata with the brick-like grain. From 49.1 m to 98.3 m the two patterns are mixed, one smoothstep.
          // Beyond 98.3 m the rock is this version's pattern above alone, as it was. The two distances come from the size of
          // live's grain: the finest of its three octaves has cells 0.71 m by 0.246 m (1 / 0.95 m across the bands, twice
          // divided by 2.07), and 98.3 m = 400 x 0.246 m is where one such band is one four-hundredth of the distance (about
          // the smallest detail a screen shows: further off that octave cannot be told apart and reads as speckle), 49.1 m
          // where it is one two-hundredth.
          // Why: the pattern above takes its fine detail away by the size of a pixel (fpx, fmn), not by distance. On a face
          // steeper than 60 degrees 20 m from the eye (a pixel is 2.2 cm of rock on a screen 1080 lines tall) that left 15%
          // of the grain under a soft mottle with cells 10 m by 3.5 m, a quarter of the close-range grain (3% where the face
          // is seen 75 degrees aslant), every joint down to 28% of its depth over about half its length, each stratum's tone
          // drawn 22% toward its bed's, and no ribs on a keel's flank: a smear where live is crisp.
          // (turf takes none of it: where rk is 0 the rock's colour has no weight and liveRock() is not worked out)
          float nearK = 1.0 - smoothstep(49.1, 98.3, vd);
          vec3 nearC = rockC; float nearG = 0.0;
          if (nearK > 0.0 && rk > 0.0) liveRock(P, sid, sf, vd, mott, flatk, ceilk, topk, nearC, nearG);
          rockC = mix(rockC, nearC, nearK);
          // turf: the fine fields are looked up on turned, warped coordinates (no square noise cells in the foreground) and each
          // fades to its mean before it is smaller than a pixel ALONG THE GROUND (fpx: a meadow skimmed at a low angle has pixels a
          // metre deep, and under a low sun fine noise there breaks into a checker of lit and dark pixels)
          vec2 tq = mat2(0.8, 0.6, -0.6, 0.8) * P.xz + 0.7 * vec2(vn(P.xz * 0.9 + 5.0), vn(P.xz * 0.9 + 9.0));
          float nearT = 1.0 - smoothstep(30.0, 110.0, vd), midT = (1.0 - smoothstep(90.0, 300.0, vd)) * (1.0 - smoothstep(0.5, 1.6, fpx));
          float m1 = mix(vn(P.xz * 0.11 + 1.7), fb2(P.xz * 0.11), midT);
          float m2 = mix(0.5, mix(vn(tq * 0.95 + 3.0), fb2(tq * 0.95 + 3.0), 1.0 - smoothstep(0.05, 0.16, fpx)), nearT * (1.0 - smoothstep(0.16, 0.5, fpx)));
          float closeT = smoothstep(12.0, 35.0, vd);                     // the finest field is for the middle distance: right under the camera the grass itself carries the detail
          float m3 = mix(0.5, fb2(tq * 2.3 + 2.0), (1.0 - smoothstep(30.0, 70.0, vd)) * closeT * (1.0 - smoothstep(0.04, 0.14, fpx)));
          vec3 tc = diffuseColor.rgb * (0.72 + 0.56 * m1) * (0.8 + 0.4 * m2) * (0.88 + 0.24 * m3);
          // the flowered drifts: lobes of the flower colour that break into clumps at their edges (the grass on them keeps the turf's own colour)
          tc = mix(tc, uFlower * (0.7 + 0.3 * m2), ${DRIFT_K.toFixed(2)} * driftF(P.xz, fpx));
          diffuseColor.rgb = mix(tc, diffuseColor.rgb * rockC, rk) * vMix.y;
          float gRock = (ledge * (1.5 + tone * 0.8) + grain * 1.3 + fine * 0.55) * (1.0 - flatk) + (rib * 1.5 + mott * 1.1 + grain * 0.7) * ceilk + (mott * 1.4 + grain * 1.1 + fine * 0.5) * topk;
          gH = mix(m2 * 0.24 + m3 * 0.14, mix(gRock + 0.3 * cK * cstep, nearG, nearK), rk);     // the bump's height is handed over with the colour (49.1 m to 98.3 m)
        }`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          vec3 sp = -vViewPosition, dpx = dFdx(sp), dpy = dFdy(sp);
          float hx = dFdx(gH), hy = dFdy(gH);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 g = sign(det) * (hx * r1 + hy * r2);
          float kb = (1.0 - 0.6 * smoothstep(0.3, 1.2, max(length(dpx), length(dpy)))) / (1.0 + length(sp) * 0.009);
          normal = normalize(abs(det) * normal - kb * g + normal * 1e-12);
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        {
          vec3 wn = inverseTransformDirection(normal, viewMatrix);
          float dn = clamp(0.35 - wn.y * 0.65, 0.0, 1.0);
          // light thrown up by the cloud sea: pale blue where the underside is open to it, turning pink where it is deep in
          // (under a keel, far down a root-hung flank). Downward faces GLOW with it; walls only take a tint in their shade.
          float deep = clamp((1.0 - vMix.y) * 2.7, 0.0, 1.0);
          float bk = clamp(max(smoothstep(-15.0, -190.0, vLP.y) * 0.8, deep * 0.92) + 0.14 * smoothstep(0.2, 0.9, dn), 0.0, 1.0);
          vec3 bc = mix(uBounceA, uBounceB, bk);
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2));
          totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(lum * 1.2), 0.5) * bc * dn * uBounce * mix(0.8, 1.05, smoothstep(0.55, 1.0, dn));
          vec3 pd = uPortalPos - vLP;
          totalEmissiveRadiance += diffuseColor.rgb * uPortalCol * (uPortalGlow * min(2.4 / (1.0 + dot(pd, pd) * 0.02), 0.8));
        }`);
  };
  return rockMat;
  };
  const rockMat = makeRockMat(true);
  const island = new THREE.Mesh(islandGeo, rockMat);
  const spire = new THREE.Mesh(spireGeo, rockMat);

  // ---------- the lake: sky mirror, ripples, shallows, channel flow, spire mirror, portal streak ----------
  const R_LAKE = [0.01, 14, 30, 50, 72, 94, 114, 130, 140, 146, 150, 153, 156, 160, 166, 174, 182, 190, 196, 199.5, 201.2];
  const lk = { p: [], s: [], idx: [], n: 0 };
  for (let j = 0; j < R_LAKE.length; j++) for (let i = 0; i < NT; i++) {
    if (i % 60 === 0) await pause();
    const th = thetas[i], r0 = R_LAKE[j], r = r0 < 196 ? r0 : lerp(r0 - 3, r0, sst(0.4, 0.9, chanAt(th, 199)));   // the disc only reaches the lip inside a channel
    lk.p.push(Math.sin(th) * r, 0, Math.cos(th) * r);
    lk.s.push(r0 < 132 ? -5 : topH(Math.min(r0, 199.6), th), r0 < 140 ? 0 : chanAt(th, Math.min(r0, 199.6)));
  }
  await pause();
  gridIndex(lk, 0, NT, R_LAKE.length, true, false, false);
  await pause();
  const lakeGeo = new THREE.BufferGeometry();
  lakeGeo.setAttribute('position', new THREE.Float32BufferAttribute(lk.p, 3));
  lakeGeo.setAttribute('aShore', new THREE.Float32BufferAttribute(lk.s, 2));
  lakeGeo.setIndex(lk.idx);
  lakeGeo.computeBoundingSphere();
  await rest();
  const VERT_HEAD = /* glsl */`
    varying vec3 vLP; varying vec3 vCamL;
    #include <fog_pars_vertex>
    void localCam(){ vCamL = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; }`;
  const lakeMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...fogU(), uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyTop: U.uSkyTop, uSkyHor: U.uLakeHor, uLakeGain: U.uLakeGain, uDeep: U.uDeep, uShallow: U.uShallow,
      uWhite: U.uWhite, uRock: U.uRock, uPortalCol: U.uPortalCol, uPortalGlow: U.uPortalGlow, uPortalPos: U.uPortalPos, uSpire: U.uSpire },
    vertexShader: VERT_HEAD + /* glsl */`
      attribute vec2 aShore; varying vec2 vShore;
      void main(){
        vLP = position; vShore = aShore; localCam();
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uPortalGlow, uLakeGain; uniform vec4 uSpire;
      uniform vec3 uSun, uSunCol, uSkyTop, uSkyHor, uDeep, uShallow, uWhite, uRock, uPortalCol, uPortalPos;
      varying vec3 vLP; varying vec3 vCamL; varying vec2 vShore;
      #include <fog_pars_fragment>
      void main(){
        vec3 Vv = vCamL - vLP; float dist = length(Vv); vec3 V = Vv / dist;
        vec2 p = vLP.xz; float rr = length(p), land = vShore.x, chan = vShore.y;
        float lipk = chan * smoothstep(168.0, 200.0, rr);
        vec2 g = vec2(0.0);
        for (int i = 0; i < 7; i++) {
          float fi = float(i); vec2 d = vec2(cos(fi * 2.4 + 0.7), sin(fi * 2.4 + 0.7));
          float ph = dot(p, d) * 0.17 * pow(1.6, fi) + uTime * (0.8 + 0.3 * fi) + 1.5 * vn(p * 0.045 * (1.0 + fi) + fi * 7.3);
          g += d * cos(ph) / (1.0 + fi * 0.5) * (fi < 4.5 ? 1.0 : 1.0 / (1.0 + dist * 0.015));     // the two finest sets of ripples only near the camera
        }
        g += (vec2(vn(p * 1.4 + uTime * 0.5), vn(p * 1.4 + 9.0 - uTime * 0.4)) - 0.5) * 2.2 / (1.0 + dist * 0.02);
        float amp = 0.07 / (1.0 + dist * 0.0025) + 0.012 + 0.1 * lipk;
        vec3 Nn = normalize(vec3(-g.x * amp, 1.0, -g.y * amp));
        vec3 R = reflect(-V, Nn); R.y = abs(R.y) + 0.001; R = normalize(R);
        vec3 sky = mix(uSkyHor * 1.05, uSkyTop, pow(clamp(R.y, 0.0, 1.0), 0.6));
        float sd = max(dot(R, uSun), 0.0);
        sky += uSunCol * (pow(sd, 350.0) * 10.0 + pow(sd, 24.0) * 0.2);
        // the spire, mirrored as a camera-facing profile
        vec2 rh = R.xz; float rl = max(length(rh), 1e-3); vec2 nh = rh / rl;
        float ts = -dot(p, nh) / rl;
        if (ts > 0.0) {
          vec3 Q = vLP + R * ts; float y = Q.y, H = uSpire.x;
          vec2 perp = vec2(nh.y, -nh.x); float lat = dot(Q.xz, perp);
          float halfw = uSpire.y * pow(clamp(1.0 - (y + 5.0) / (H + 5.0), 0.0, 1.0), 0.75) + 5.0 * exp(-(y + 5.0) / 6.0);
          float thick = mix(10.5, 2.0, pow(smoothstep(-6.0, H, y), 0.8));
          float weff = length(vec2(halfw * nh.y, thick * nh.x));
          float off = lat + g.x * 1.5 - uSpire.z * pow(max(y, 0.0) / H, 2.0) * perp.x;
          float inside = step(0.0, y) * smoothstep(weff, weff - 1.5, abs(off));
          float hole = (1.0 - smoothstep(6.5, 8.5, length(vec2(lat / max(abs(nh.y), 0.05), y - 10.0)))) * smoothstep(0.35, 0.6, abs(nh.y));
          sky = mix(sky, uRock * (0.5 + 0.5 * clamp(y / H, 0.0, 1.0)), inside * (1.0 - hole) * 0.6 * (0.55 + 0.45 * smoothstep(-1.2, 1.2, g.x + g.y)));      // a broken mirror: the ripples tear it
        }
        // the portal's glow laid on the water
        vec3 pc = uPortalPos - vLP; float tp = max(dot(pc, R), 0.0); vec3 cl = pc - R * tp; float d2 = dot(cl.xz, cl.xz) * 2.2 + cl.y * cl.y * 0.5;
        sky += uPortalCol * uPortalGlow * (exp(-d2 / 45.0) * 1.9 + exp(-d2 / 400.0) * 0.08);
        float F = 0.04 + 0.96 * pow(clamp(1.0 - dot(Nn, V), 0.0, 1.0), 3.0);
        float dk = clamp(-land / 5.0, 0.0, 1.0);
        vec3 body = mix(uShallow, uDeep, smoothstep(0.08, 0.95, dk)) * (0.4 + 0.6 * max(uSun.y, 0.2)) * uLakeGain;
        body = mix(body, uShallow * 0.9, 0.5 * lipk);
        vec3 col = mix(body, sky, F);
        // foam: shoreline lap, streaks racing down the channels, white lip
        float shf = smoothstep(-1.1, -0.1, land) * (1.0 - chan) * smoothstep(0.3, 0.7, vn(p * 0.9 + uTime * 0.2) + 0.4 * sin(land * 5.0 - uTime * 1.3));
        float ang = atan(p.x, p.y);
        float st = fb2(vec2(ang * rr * 0.45, rr * 0.16 - uTime * (0.9 + 2.2 * lipk)));
        float cf = chan * smoothstep(156.0, 199.0, rr) * smoothstep(0.62 - 0.4 * lipk, 0.9 - 0.4 * lipk, st + lipk * 0.25);
        cf = max(cf, lipk * smoothstep(192.0, 200.5, rr));
        float sr = length(p / vec2(uSpire.y + 4.0, 12.5));
        float spf = smoothstep(0.86, 1.0, sr) * (1.0 - smoothstep(1.0, 1.22, sr)) * smoothstep(0.35, 0.75, vn(p * 0.6 - uTime * 0.25));
        float foam = clamp(max(max(shf * 0.8, spf * 0.6), cf), 0.0, 1.0);
        col = mix(col, uWhite * uSunCol * (0.7 + 0.75 * max(uSun.y, 0.3)), foam);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  await pause();

  // ---------- the twelve falls: two parabolic sheets each, eroding into strands and then into nothing ----------
  const NUF = 8, NVF = 36, fl = { p: [], uv: [], fs: [], idx: [], n: 0 };
  const fallR = (tt) => 199.4 + 3.4 * tt, fallY = (tt) => -0.05 - 4.9 * tt * tt;
  for (let k = 0; k < N_FALLS; k++) for (let L = 0; L < 2; L++) {
    await pause(0.8);
    const f = falls[k], base = fl.n;
    for (let j = 0; j <= NVF; j++) for (let i = 0; i <= NUF; i++) {
      const v = j / NVF, u = (i / NUF) * 2 - 1, tt = v * FALL_T;
      const r = fallR(tt) + L * (0.8 + 5 * v) - 1.6 * (1 - u * u) * L, hw = f.w * 0.5 * (1 + 0.2 * v - 0.36 * v * v) * (L ? 0.82 : 1);     // full width to half way down, then drawing in to a plume
      const th = f.a + (u * hw) / r;
      fl.p.push(Math.sin(th) * r, fallY(tt), Math.cos(th) * r); fl.uv.push(u, v); fl.fs.push(f.seed + L * 3.7, L, f.w); fl.n++;
    }
    gridIndex(fl, base, NUF + 1, NVF + 1, false, false, false);
  }
  await pause();
  const fallGeo = new THREE.BufferGeometry();
  fallGeo.setAttribute('position', new THREE.Float32BufferAttribute(fl.p, 3));
  fallGeo.setAttribute('aUV', new THREE.Float32BufferAttribute(fl.uv, 2));
  fallGeo.setAttribute('aFS', new THREE.Float32BufferAttribute(fl.fs, 3));
  fallGeo.setIndex(fl.idx);
  fallGeo.computeBoundingSphere();
  const fallMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyHor: U.uSkyHor, uWhite: U.uWhite },
    vertexShader: VERT_HEAD + /* glsl */`
      uniform float uTime; attribute vec2 aUV; attribute vec3 aFS; varying vec2 vUV; varying vec3 vFS; varying vec2 vOut;
      void main(){
        vec3 pos = position; float v = aUV.y; vec2 od = normalize(position.xz);
        pos.xz += (vec2(od.y, -od.x) * sin(uTime * 0.31 + aFS.x) * 5.0 + od * sin(uTime * 0.23 + aFS.x * 2.0) * 4.0) * v * v;
        vLP = pos; vUV = aUV; vFS = aFS; vOut = od; localCam();
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime; uniform vec3 uSun, uSunCol, uSkyHor, uWhite;
      varying vec3 vLP; varying vec3 vCamL; varying vec2 vUV; varying vec3 vFS; varying vec2 vOut;
      #include <fog_pars_fragment>
      void main(){
        float u = vUV.x, v = vUV.y, et = uTime - v * ${FALL_T.toFixed(1)};
        float n1 = fb2(vec2(u * 3.0 + vFS.x * 13.0, et * 1.5 + vFS.x * 5.0));
        float n2 = fb2(vec2(u * 9.0 + vFS.x * 7.0, et * 4.0));
        float n3 = vn(vec2(u * 26.0 + vFS.x * 3.0, et * 9.0));
        float n = n1 * 0.5 + n2 * 0.32 + n3 * 0.18;
        float edge = 1.0 - smoothstep(0.5, 1.0, abs(u) + (n2 - 0.5) * 0.5);
        // a fall close by and seen along its own sheet (the gallery, where one stands beside the lane): its strands lie one behind
        // another and close up into a flat white band. There it is thinned: more air between the strands, so it reads as water
        vec3 Vv = vCamL - vLP; float dC = max(length(Vv), 1e-3); vec3 Vn = Vv / dC;
        float facing = abs(Vn.x * vOut.x + Vn.z * vOut.y) / max(length(vOut), 1e-3);
        float glance = (1.0 - smoothstep(0.12, 0.5, facing)) * (1.0 - smoothstep(60.0, 130.0, dC));
        float er = mix(0.05, 0.7, pow(clamp(v, 0.0, 1.0), 0.75)) + 0.2 * glance * smoothstep(0.0, 0.08, v);
        float a = smoothstep(er, er + 0.13, n + (1.0 - abs(u)) * 0.12) * edge;       // distinct strands with air between them, not a veil
        a = mix(a, edge, 1.0 - smoothstep(0.0, 0.05, v));
        a *= (1.0 - smoothstep(0.64, 0.96, v)) * mix(1.0, 0.7, vFS.y) * (1.0 - 0.2 * glance);
        if (a < 0.004) discard;
        float lit = clamp(dot(normalize(vec3(vOut.x, 0.3, vOut.y)), uSun) * 0.6 + 0.5, 0.0, 1.0);
        float strand = smoothstep(0.3, 0.72, n2 * 0.55 + n3 * 0.45);
        vec3 col = mix(uSkyHor * 0.62 + 0.16, uWhite * mix(vec3(1.0), uSunCol, 0.45) * 1.32, clamp(lit * (0.42 + 0.58 * strand) + 0.14 * strand, 0.0, 1.0));
        col += mix(vec3(1.0), uSunCol, 0.4) * pow(max(dot(-Vn, uSun), 0.0), 3.0) * 0.4 * strand;
        gl_FragColor = vec4(col, a * 0.97);
        #include <fog_fragment>
      }`,
  });
  const fallMesh = new THREE.Mesh(fallGeo, fallMat);
  await rest();
  fallMesh.renderOrder = 2;

  // ---------- mist: soft camera-facing puffs where the falls come apart, a faint ring below, spray at the lips ----------
  const ms = { p: [], c: [], ps: [], idx: [], n: 0 }, mRng = rng.fork('mist');
  const puff = (x, y, z, size, op) => {
    for (let q = 0; q < 4; q++) { ms.p.push(x, y, z); ms.c.push(q & 1 ? 1 : -1, q & 2 ? 1 : -1); ms.ps.push(size, mRng.range(0, 1), op); }
    ms.idx.push(ms.n, ms.n + 1, ms.n + 3, ms.n, ms.n + 3, ms.n + 2); ms.n += 4;
  };
  const seaY = opts.seaY ?? -297;                       // local height of the cloud sea's top round the Crown
  const OPS = [0.22, 0.32, 0.4, 0.44, 0.42, 0.34, 0.24];
  for (const f of falls) {
    for (let m = 0; m < 7; m++) {
      const y = -150 - m * 26 + mRng.range(-8, 8), r = fallR(Math.sqrt(-y / 4.9)) + mRng.range(-4, 8), a = f.a + mRng.range(-0.03, 0.03) * (1 + m * 0.4);
      puff(Math.sin(a) * r, y, Math.cos(a) * r, 22 + m * 8.5 + mRng.range(-4, 8), OPS[m]);
    }
    for (const sgn of [-1, 1]) { const a = f.a + (sgn * f.w * 0.25) / R_RIM; puff(Math.sin(a) * 202.5, -5, Math.cos(a) * 202.5, mRng.range(11, 15), 0.3); }
  }
  for (let n = 0; n < 30; n++) { const a = mRng.range(0, TAU), r = mRng.range(196, 240), sz = mRng.range(100, 160); puff(Math.sin(a) * r, seaY + mRng.range(-15, 21), Math.cos(a) * r, sz * 0.62, 0.07); }
  // where each fall meets the cloud sea: a boil of spray standing on the deck, so the water visibly lands in cloud
  const fRng = rng.fork('feet');
  for (const f of falls) for (let m = 0; m < 3; m++) {
    const a = f.a + fRng.range(-0.05, 0.05), r = fallR(7.8) + fRng.range(-10, 22);
    puff(Math.sin(a) * r, seaY + 6 + m * 16 + fRng.range(-6, 6), Math.cos(a) * r, (62 - m * 12 + fRng.range(-6, 10)) * 0.72, 0.3 - m * 0.04);
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.Float32BufferAttribute(ms.p, 3));
  mistGeo.setAttribute('aCorner', new THREE.Float32BufferAttribute(ms.c, 2));
  mistGeo.setAttribute('aPS', new THREE.Float32BufferAttribute(ms.ps, 3));
  mistGeo.setIndex(ms.idx);
  const mistMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogU(), uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyHor: U.uSkyHor, uWhite: U.uWhite, uMist: U.uMist, uPink: U.uBounceB, uCloudShade: U.uCloudShade, uSeaY: { value: seaY } },
    vertexShader: VERT_HEAD + /* glsl */`
      uniform float uTime; attribute vec2 aCorner; attribute vec3 aPS; varying vec2 vC; varying vec3 vPS; varying float vDist; varying float vFY;
      void main(){
        vec3 c = position; c.y += sin(uTime * 0.21 + aPS.y * 6.0) * aPS.x * 0.04;
        vLP = c; vC = aCorner; vPS = aPS; localCam();
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        vDist = -mvPosition.z;
        mvPosition.xy += aCorner * aPS.x * (1.0 + 0.06 * sin(uTime * 0.3 + aPS.y * 9.0));
        vFY = c.y + aCorner.y * aPS.x * viewMatrix[1][1];        // height of this corner: the puff fades where it sinks into the cloud sea
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uMist, uSeaY; uniform vec3 uSun, uSunCol, uSkyHor, uWhite, uPink, uCloudShade;
      varying vec3 vLP; varying vec3 vCamL; varying vec2 vC; varying vec3 vPS; varying float vDist; varying float vFY;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vC, vC); if (r2 > 1.0) discard;
        float soft = (1.0 - r2) * (1.0 - r2);
        float n = fb2(vC * 1.7 + vPS.y * 31.0 + vec2(uTime * 0.03, uTime * 0.07));
        float a = soft * smoothstep(0.2, 0.75, n + soft * 0.35) * vPS.z * uMist * smoothstep(50.0, 200.0, vDist) * smoothstep(uSeaY - 14.0, uSeaY + 34.0, vFY);
        vec3 Vn = normalize(vCamL - vLP);
        vec3 col = mix(mix(uCloudShade, uWhite, 0.5), uWhite * mix(vec3(1.0), uSunCol, 0.18) * 1.08, clamp(vC.y * 0.55 + 0.44 + (n - 0.5) * 0.5, 0.0, 1.0));   // white heads, cloud-shade bellies
        col += vec3(0.3) * pow(max(dot(-Vn, uSun), 0.0), 2.0);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mist = new THREE.Mesh(mistGeo, mistMat);
  mist.frustumCulled = false; mist.renderOrder = 3;
  await pause();

  // ---------- the spout: the Crown drinks the cloud sea ----------
  // This is how the lake stays brim-full. Under the keel the world's cloud sea sinks into a dark eye with three bright arms
  // winding into it (the world's deck draws those: see opts.eyeY). From the middle of the eye a ROPE of cloud climbs into the
  // tip of the keel: three strands that carry the three arms on upward, twisted round each other, narrowing as they rise,
  // their puffs climbing all the time; and the DRAUGHT: two bands of cloud that carry on up round the keel in a slow helix as
  // far as the gallery under the rim. All of it moves in the vertex shader (one draw call, ~270 quads).
  const eyeY = opts.eyeY ?? seaY - 60, spTip = new THREE.Vector2(S.tipX, S.tipZ), spFoot = spTip.clone().multiplyScalar(1.45);
  const sq = { c: [], ps: [], sp: [], idx: [], n: 0 }, sRng = rng.fork('spout');
  const spPuff = (size, op, s0, a0, rj, kind) => {
    for (let q = 0; q < 4; q++) { sq.c.push(q & 1 ? 1 : -1, q & 2 ? 1 : -1); sq.ps.push(size, sRng.range(0, 1), op); sq.sp.push(s0, a0, rj, kind); }
    sq.idx.push(sq.n, sq.n + 1, sq.n + 3, sq.n, sq.n + 3, sq.n + 2); sq.n += 4;
  };
  for (let n = 0; n < 144; n++) spPuff(sRng.range(11, 18), sRng.range(0.62, 0.86), (Math.floor(n / 3) + sRng.range(0, 0.9)) / 48, (n % 3) * (TAU / 3), sRng.range(0.85, 1.15), 0);   // three strands
  for (let n = 0; n < 40; n++) spPuff(sRng.range(9, 14), sRng.range(0.5, 0.7), (n + sRng.range(0, 0.9)) / 40, sRng.range(0, TAU), sRng.range(0, 0.45), 0);                             // the core they wind round
  for (let n = 0; n < 84; n++) spPuff(sRng.range(14, 25), sRng.range(0.44, 0.62), (n + sRng.range(0, 0.9)) / 84, (n % 2) * Math.PI + sRng.range(-0.32, 0.32), sRng.range(0.58, 0.74), 2);
  const spoutGeo = new THREE.BufferGeometry();
  spoutGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(sq.n * 3), 3));
  spoutGeo.setAttribute('aCorner', new THREE.Float32BufferAttribute(sq.c, 2));
  spoutGeo.setAttribute('aPS', new THREE.Float32BufferAttribute(sq.ps, 3));
  spoutGeo.setAttribute('aSp', new THREE.Float32BufferAttribute(sq.sp, 4));
  spoutGeo.setIndex(sq.idx);
  U.uSpout = { value: opts.spout ?? 1 };
  const spoutMat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogU(), uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyHor: U.uSkyHor, uWhite: U.uWhite, uSpout: U.uSpout, uPink: U.uBounceB, uCloudShade: U.uCloudShade,
      uSpA: { value: new THREE.Vector4(spFoot.x, spFoot.y, spTip.x, spTip.y) }, uSpB: { value: new THREE.Vector4(eyeY, -S.keelD, -66, S.keelPow) } },
    vertexShader: VERT_HEAD + /* glsl */`
      uniform float uTime; uniform vec4 uSpA, uSpB; uniform vec3 uSun;
      attribute vec2 aCorner; attribute vec3 aPS; attribute vec4 aSp;
      varying vec2 vC; varying vec3 vPS; varying float vDist; varying vec2 vSF; varying float vTr;
      void main(){
        float kind = aSp.w, s, y, r, ang, fade, size = aPS.x; vec2 ax; vTr = 0.0;
        vec2 foot = uSpA.xy, tip = uSpA.zw; float y0 = uSpB.x, y1 = uSpB.y;
        if (kind < 0.5) {                       // the rope: strands start on the bearings of the deck's three arms and turn with them
          vTr = 1.0;
          s = fract(aSp.x + uTime * 0.028);
          float e = pow(max(s, 0.0), 0.62);
          y = mix(y0, y1 + 7.0, s);
          ax = mix(foot, tip, e) + vec2(sin(uTime * 0.17 + s * 5.0), cos(uTime * 0.13 + s * 4.0)) * 4.0 * sin(3.14159 * s);
          r = mix(21.0, 3.0, e) * aSp.z;
          ang = aSp.y - 0.6 + uTime * 0.1 + 9.5 * pow(max(s, 0.0), 1.25);
          size *= mix(1.2, 0.42, e);
          fade = smoothstep(0.0, 0.05, s) * (1.0 - smoothstep(0.93, 1.0, s));
        } else {                                // the draught: what the spout brings up winds on round the keel in two bands
          s = fract(aSp.x + uTime * 0.013);
          y = mix(y1 + 3.0, uSpB.z, s);
          float tk = clamp((-46.0 - y) / max(-46.0 - y1, 1.0), 0.0, 1.0);
          size *= mix(0.5, 1.2, s);
          r = 80.0 * pow(max(1.0 - tk, 0.0), uSpB.w) + size * (0.5 + aSp.z);   // stands off the rock by more than its radius: no hard cut where puff meets stone
          ax = tip * tk * tk;
          ang = aSp.y + s * 9.4 + uTime * 0.05;
          fade = smoothstep(0.0, 0.07, s) * (1.0 - smoothstep(0.8, 1.0, s));
        }
        vec2 od = vec2(sin(ang), cos(ang));
        vec3 c = vec3(ax.x + od.x * r, y, ax.y + od.y * r);
        vLP = c; vC = aCorner; vPS = aPS; localCam();
        vSF = vec2(dot(od, uSun.xz / max(length(uSun.xz), 1e-3)), fade);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
        vDist = -mvPosition.z;
        mvPosition.xy += aCorner * size * (1.0 + 0.06 * sin(uTime * 0.3 + aPS.y * 9.0));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uSpout; uniform vec3 uSun, uSunCol, uSkyHor, uWhite, uPink, uCloudShade;
      varying vec3 vLP; varying vec3 vCamL; varying vec2 vC; varying vec3 vPS; varying float vDist; varying vec2 vSF; varying float vTr;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vC, vC); if (r2 > 1.0) discard;
        float soft = (1.0 - r2) * (1.0 - r2);
        float n = fb2(vC * 1.9 + vPS.y * 31.0 + vec2(uTime * 0.05, -uTime * 0.09));
        float a = soft * smoothstep(0.18, 0.7, n + soft * 0.4) * vPS.z * uSpout * vSF.y * smoothstep(16.0, 64.0, vDist);
        a *= mix(0.85 * smoothstep(120.0, 270.0, vDist), 1.0, vTr);       // the draught is a sight from outside the ring; from the gallery it would lie on the keel like paste
        // a body of cloud, not a veil: the rope is white on its sunward side and on every head, in deep cloud shade on its lee
        // and bellies, so each strand turns; the draught is softer (a lilac lee, never a dark blot against the rock)
        float lit = smoothstep(0.2, 0.86, vC.y * (0.3 + 0.14 * vTr) + 0.42 + 0.1 * vTr + vSF.x * (0.44 - 0.16 * vTr) + (n - 0.5) * 0.5);
        vec3 shade = mix(uCloudShade, uWhite, 0.3 - 0.2 * vTr);
        vec3 col = mix(shade, uWhite * mix(vec3(1.0), uSunCol, 0.4) * (1.1 + 0.12 * vTr), lit);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const spout = new THREE.Mesh(spoutGeo, spoutMat);
  spout.frustumCulled = false; spout.renderOrder = 3; spout.name = 'spout';
  await pause();

  // ---------- flora: root curtains under the island, frond-spiral trees and bulb-trees on the rim (one mesh) ----------
  let fa = makeAcc();
  const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3(), cA = new THREE.Color(), cB = new THREE.Color();
  // c0 may be an array of colours, one per ring (then c1 is ignored); lobes > 0 flutes the section into `nl` lobes
  function tube(pts, rad, sides, c0, c1, sw0, sw1, phase, lobes = 0, nl = 4) {
    const base = fa.n, n = pts.length, ramp = Array.isArray(c0);
    for (let j = 0; j < n; j++) {
      const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)], t = j / (n - 1);
      _t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      _u.set(1, 0, 0); if (Math.abs(_t.x) > 0.9) _u.set(0, 0, 1);
      _w.crossVectors(_t, _u).normalize(); _u.crossVectors(_w, _t);
      if (ramp) tmpC.copy(c0[j]); else tmpC.copy(c0).lerp(c1, t);
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * TAU, rr = rad[j] * (lobes ? 1 + lobes * Math.cos(nl * ang + phase) : 1), cx = Math.cos(ang) * rr, sx = Math.sin(ang) * rr;
        pushV(fa, pts[j][0] + _u.x * cx + _w.x * sx, pts[j][1] + _u.y * cx + _w.y * sx, pts[j][2] + _u.z * cx + _w.z * sx, tmpC, lerp(sw0, sw1, t * t), phase);
      }
    }
    gridIndex(fa, base, sides, n, true, false, true);
  }
  function ribbon(pts, wid, sx, sz, c0, c1, sw0, sw1, phase) {
    const base = fa.n, n = pts.length;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), w = wid[j]; tmpC.copy(c0).lerp(c1, t);
      pushV(fa, pts[j][0] - sx * w, pts[j][1] - w * 0.25, pts[j][2] - sz * w, tmpC, lerp(sw0, sw1, t), phase);
      pushV(fa, pts[j][0] + sx * w, pts[j][1] - w * 0.25, pts[j][2] + sz * w, tmpC, lerp(sw0, sw1, t), phase);
    }
    gridIndex(fa, base, 2, n, false, false, false);
  }
  // roots: curtains of 5-11 along a contour of the ceiling or keel, long by the keel, short under the outer rim
  const rRng = rng.fork('roots'), rootDark = cRock.clone().lerp(new THREE.Color(0.16, 0.1, 0.08), 0.6);
  for (let cN = 0; cN < 42; cN++) {
    await pause();
    const k = cN < 30 ? rRng.int(5, 19) : rRng.int(20, 33), i0 = rRng.int(0, NT - 1), count = rRng.int(5, 11), step = rRng.range(0.5, 1.1);
    underAt(k, i0, _p);
    const near = sst(165, 100, Math.hypot(_p.x, _p.z)), baseLen = lerp(rRng.range(8, 14), rRng.range(24, 46), near);
    cA.copy(rootDark); cB.copy(cTeal).lerp(cPink, rRng.range(0.1, 0.9)).lerp(cCream, 0.25).multiplyScalar(0.66);
    for (let m = 0; m < count; m++) {
      const fi = i0 + m * step, ia = Math.floor(fi);
      underAt(k, ia, _p).lerp(underAt(k, ia + 1, _q), fi - ia);
      const len = baseLen * rRng.range(0.55, 1.2), ph = rRng.range(0, TAU), dx = rRng.range(-2.5, 2.5), dz = rRng.range(-2.5, 2.5), th0 = rRng.range(0.55, 1.0) * (0.6 + len / 40), wob = len * rRng.range(0.015, 0.045);
      const pts = [], rad = [];
      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        pts.push([_p.x + dx * t * t + wob * t * Math.sin(t * 6 + ph), _p.y + 1.2 - len * t, _p.z + dz * t * t + wob * t * Math.cos(t * 5 + ph)]);
        rad.push(lerp(th0, 0.1, Math.pow(t, 0.8)));
      }
      tube(pts, rad, 3, cA, cB, 0, len * 0.07, ph);
    }
  }
  // trees on the rim land
  const tRng = rng.fork('trees'), trees = [], landSites = [];
  const siteOk = (x, z, r, th) => topH(r, th) > 1.5 && chanAt(th, r) < 0.01 && chanAt(th, r - 7) < 0.01 && chanAt(th + 0.03, r) < 0.01 && chanAt(th - 0.03, r) < 0.01 && !(z > 0 && Math.abs(x) < 36);
  for (let tries = 0; tries < 900 && trees.length < 104; tries++) {
    if (tries % 10 === 0) await pause();
    const th = tRng.range(0, TAU), r = tRng.range(160, 194), x = Math.sin(th) * r, z = Math.cos(th) * r;
    if (!siteOk(x, z, r, th) || N.n2(x * 0.017 + S.o[1], z * 0.017 + S.o[4]) < -0.25) continue;
    if (trees.some((q) => (q.x - x) ** 2 + (q.z - z) ** 2 < 30)) continue;
    trees.push({ x, z, y: topH(r, th), frond: tRng.chance(0.6), h: tRng.range(8, 16) });
  }
  for (let tries = 0; tries < 600 && landSites.length < 40; tries++) {
    if (tries % 10 === 0) await pause();
    const th = tRng.range(0, TAU), r = tRng.range(158, 195), x = Math.sin(th) * r, z = Math.cos(th) * r;
    if (!siteOk(x, z, r, th) || trees.some((q) => (q.x - x) ** 2 + (q.z - z) ** 2 < 64)) continue;
    landSites.push(new THREE.Vector3(x, topH(r, th), z));
  }
  // one hanging root (tip sways): for the gourd trees' tendrils and for the world's other islands. thick scales its girth;
  // bud > 0 hangs a seed lantern of that radius from the tip (pale gold, bright enough to glow a little)
  // (a vertex colour above 1 is a lamp: the flora material lights it only a little and lets it glow by that colour instead)
  const budC = [new THREE.Color(0.34, 0.22, 0.13), new THREE.Color(1.3, 0.86, 0.36), new THREE.Color(1.9, 1.5, 0.8), new THREE.Color(1.5, 1.0, 0.45), new THREE.Color(0.4, 0.26, 0.2)];
  const addRoot = (x, y, z, len, r, pink = 0.5, thick = 1, bud = 0) => {
    const ph = r.range(0, TAU), dx = r.range(-2.5, 2.5), dz = r.range(-2.5, 2.5), th0 = r.range(0.4, 0.75) * (0.6 + len / 40) * thick, wob = len * r.range(0.015, 0.045);
    cA.copy(rootDark); cB.copy(cTeal).lerp(cPink, pink).lerp(cCream, 0.1).multiplyScalar(0.6);
    const pts = [], rad = [], tipR = Math.min(0.1, th0 * 0.5);
    for (let s = 0; s <= 6; s++) {
      const t = s / 6;
      pts.push([x + dx * t * t + wob * t * Math.sin(t * 6 + ph), y + 1.2 - len * t, z + dz * t * t + wob * t * Math.cos(t * 5 + ph)]);
      rad.push(lerp(th0, tipR, Math.pow(t, 0.8)));
    }
    tube(pts, rad, 3, cA, cB, -1e-4, -len * 0.07, ph);      // (a negative sway marks a root as THIN for the flora material: see its far fade)
    if (bud > 0) {
      const e = pts[6], bp = [], br = [];
      for (let s = 0; s < 5; s++) { const t = s / 4; bp.push([e[0], e[1] + bud * (0.5 - 2.6 * t), e[2]]); br.push(bud * (0.12 + Math.sin(Math.PI * Math.pow(t, 0.75)) * 0.95)); }
      tube(bp, br, 6, budC, null, -len * 0.07, -len * 0.07, ph);
    }
  };
  const trunkC = cCream.clone().lerp(cRock, 0.55).multiplyScalar(0.7);
  const addTree = (T, tRng) => {
    const h = T.h, ph = tRng.range(0, TAU), lx = tRng.range(-0.22, 0.22) * h, lz = tRng.range(-0.22, 0.22) * h;
    const at = (t) => [T.x + lx * t * t, T.y - 0.6 + h * t, T.z + lz * t * t];
    if (T.frond) {
      tube([at(0), at(0.25), at(0.5), at(0.75), at(1)], [0.055 * h, 0.042 * h, 0.034 * h, 0.027 * h, 0.012 * h], 5, trunkC, cA.copy(cPink).multiplyScalar(0.7), 0, h * 0.035, ph);
      const nF = tRng.int(9, 11), hue = tRng.range(0, 1);
      cA.copy(cPink).lerp(cRock, 0.12 * hue).lerp(cCream, 0.12); cB.copy(cPink).lerp(cCream, 0.4 + 0.3 * hue);
      for (let f = 0; f < nF; f++) {
        const tf = 0.48 + 0.52 * (f / (nF - 1)), o = at(tf), ang = f * 2.4 + ph, L = h * (0.62 - 0.36 * (tf - 0.48) / 0.52), ox = Math.sin(ang), oz = Math.cos(ang);
        const pts = [], wid = [];
        for (let s = 0; s <= 4; s++) {
          const t = s / 4, curl = t * t * t;
          pts.push([o[0] + ox * L * (t - 0.22 * curl), o[1] + L * (0.42 * Math.sin(t * 2.3) - 0.5 * t * t + 0.16 * curl), o[2] + oz * L * (t - 0.22 * curl)]);
          wid.push(L * 0.2 * Math.sin(Math.PI * (0.12 + 0.86 * t)) + 0.05);
        }
        ribbon(pts, wid, oz, -ox, cA, cB, h * 0.035 * tf, h * 0.035 * tf + L * 0.06, ph);
      }
    } else {
      // a gourd tree: a cluster of lobed, waisted bulbs with a dark cap and a pale belly, on short stalks round the crown of
      // a bent trunk; T.rich (near the camera) gets more bulbs, finer bulbs and a trailing tendril
      const rich = T.rich ? 1 : 0, hb = h * 0.62, top = [T.x + lx * 0.4, T.y - 0.6 + hb, T.z + lz * 0.4];
      tube([at(0), [T.x + lx * 0.1, T.y + hb * 0.4, T.z + lz * 0.1], [T.x + lx * 0.3, T.y + hb * 0.8, T.z + lz * 0.3], top], [0.04 * h, 0.03 * h, 0.024 * h, 0.02 * h], rich ? 6 : 4, trunkC, cA.copy(cTeal).multiplyScalar(0.5), 0, h * 0.02, ph);
      const hue = tRng.range(0, 1), nB = rich ? tRng.int(5, 7) : 4, rings = rich ? 8 : 6, sides = rich ? 10 : 7;
      cA.copy(cTeal).multiplyScalar(0.5 + 0.16 * hue); cB.copy(cTeal).lerp(cHaze, 0.5).lerp(cYellow, 0.14 + 0.26 * hue);
      const ramp = [];
      for (let s = 0; s < rings; s++) {              // bottom -> top: shaded base, pale belly, body colour, dark cap
        const t = s / (rings - 1), c = new THREE.Color().copy(cA).lerp(cB, sst(0, 0.22, t) * (1 - 0.75 * sst(0.3, 0.74, t)));
        ramp.push(c.multiplyScalar(lerp(1, 0.42, sst(0.72, 0.9, t))));
      }
      let big = null;
      for (let b = 0; b < nB; b++) {
        const ang = ph + b * 2.4, rad = b === 0 ? 0 : h * (0.15 + 0.035 * b) * tRng.range(0.85, 1.15), R = h * (b === 0 ? 0.2 : lerp(0.14, 0.085, b / nB)) * tRng.range(0.9, 1.12);
        const bx = top[0] + Math.sin(ang) * rad, bz = top[2] + Math.cos(ang) * rad, by = top[1] + (b === 0 ? h * 0.02 : -h * (0.05 + 0.06 * b) * tRng.range(0.8, 1.2));
        if (b > 0) tube([[top[0], top[1] - h * 0.02 * b, top[2]], [lerp(top[0], bx, 0.6), by + R * 2.5, lerp(top[2], bz, 0.6)], [bx, by + R * 2.05, bz]], [0.014 * h, 0.011 * h, 0.009 * h], 3, trunkC, cA, h * 0.02, h * 0.026, ph);
        const pts = [], rr = [];
        for (let s = 0; s < rings; s++) {
          const t = s / (rings - 1), body = Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.86)), 0.7) * (1.08 - 0.5 * sst(0.3, 0.86, t));
          pts.push([bx, by + R * 2.2 * t, bz]); rr.push(R * Math.max(body, t > 0.7 ? lerp(0.24, 0.07, sst(0.7, 1, t)) : 0.03));
        }
        tube(pts, rr, sides, ramp, null, h * 0.02, h * 0.03, ph + b, 0.11, 4);
        if (b === 0 || (rich && b === 2)) big = [bx, by, bz, R];
      }
      if (rich && big) addRoot(big[0], big[1] - 1.1, big[2], h * tRng.range(0.22, 0.4), tRng, 0.2 + 0.6 * hue, 0.45);
    }
  };
  for (let n = 0; n < trees.length; n++) { await pause(0.55); addTree(trees[n], tRng); }
  // vines down the face of the spire either side of the hole (never across it: the portal's opening stays clear)
  {
    const vRng = rng.fork('vines'), faceZ = (y) => lerp(10.5, 2.0, Math.pow(sst(-6, S.spH, y), 0.8)) * 1.12 + 1.5;
    for (let n = 0; n < 34; n++) {
      const sgn = n % 2 ? 1 : -1, y0 = HOLE_Y + vRng.range(1, 15), xin = Math.sqrt(Math.max(0, (HOLE_R + 1.3) ** 2 - Math.min(HOLE_R + 1.3, Math.abs(y0 - 7 - HOLE_Y)) ** 2));
      const x0 = sgn * (Math.max(xin, HOLE_R * 0.55) + vRng.range(0.4, 4.5)), len = vRng.range(4, 12), ph = vRng.range(0, TAU);
      if (!inSpire(x0 * 1.12, y0) || !inSpire(x0 * 1.12, y0 - len * 0.6)) continue;
      const pts = [], rad = [];
      for (let q = 0; q <= 7; q++) { const t = q / 7, y = y0 - len * t; pts.push([x0 + 0.5 * Math.sin(t * 5 + ph) * t, y, faceZ(y) + 0.5 * t]); rad.push(lerp(0.2, 0.05, t)); }
      cA.copy(rootDark); cB.copy(cTeal).lerp(cPink, vRng.range(0.1, 0.8)).lerp(cCream, 0.15).multiplyScalar(0.7);
      tube(pts, rad, 3, cA, cB, 0, len * 0.03, ph);
    }
  }
  await pause();
  // the gallery's own dressing: curtains of long lantern-tipped roots from the ribbed ceiling above the fly-through
  // (bearings -155 to -55 degrees: the whole arc the lane runs under), so the ceiling is hung with them all the way round the gallery
  {
    const gRng = rng.fork('gallery-roots');
    for (let cN = 0; cN < 16; cN++) {
      await pause();
      const k = gRng.int(2, 8), i0 = Math.round((gRng.range(205, 305) / 360) * NT), count = gRng.int(5, 9), pink = gRng.range(0.15, 0.9), baseLen = gRng.range(9, 20);
      for (let m = 0; m < count; m++) {
        underAt(k + (m % 2), i0 + m, _p);
        addRoot(_p.x, _p.y - 0.6, _p.z, baseLen * gRng.range(0.6, 1.2), gRng, pink, 0.9, gRng.chance(0.6) ? gRng.range(0.4, 0.62) : 0);
      }
    }
  }
  await pause();
  const floraGeo = await accGeometry(fa, 'aSway', 2, pause);
  const floraMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, side: THREE.DoubleSide });
  floraMat.onBeforeCompile = (sh) => {
    for (const k of ['uTime', 'uBounceA', 'uBounceB', 'uBounce']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aSway; uniform float uTime; varying vec3 vFP; varying float vThin;')
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
        vFP = position; vThin = step(aSway.x, -5e-5);
        transformed.xz += aSway.x * (vec2(sin(uTime * 0.9 + aSway.y), cos(uTime * 0.7 + aSway.y * 1.7)) + 0.5 * vec2(sin(uTime * 0.31 + position.x * 0.02), sin(uTime * 0.27 + position.z * 0.02)));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_NOISE + '\nuniform vec3 uBounceA, uBounceB; uniform float uBounce; varying vec3 vFP; varying float vThin; vec3 lampE;')
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {                                                   // living skin: soft mottling and pale speckles (gourds, fronds, roots alike)
          float mo = vn3(vFP * 0.8 + 3.0), spk = smoothstep(0.7, 0.86, vn3(vFP * 2.7));
          diffuseColor.rgb *= 0.84 + 0.3 * mo;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.55 + 0.05, spk * 0.5);
          // roots are thinner than a pixel from 150 m on: there they pale toward the stone behind them, so a far rim hung with
          // them is a soft fringe and never a band of dark speckle
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.55, 0.7), 0.65 * vThin * smoothstep(150.0, 300.0, length(vViewPosition)));
          // a seed lantern (vertex colour above 1): an amber-to-cream glow that keeps its form, not a surface the key light can blow out
          float lmx = max(max(vColor.r, vColor.g), vColor.b), lampK = smoothstep(1.0, 1.25, lmx);
          lampE = vColor.rgb * (0.72 * lampK * (0.9 + 0.2 * mo));
          diffuseColor.rgb = mix(diffuseColor.rgb, vColor.rgb * (0.22 / max(lmx, 1e-3)), lampK);
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * mix(vec3(0.16), mix(uBounceA, uBounceB, smoothstep(-15.0, -150.0, vFP.y)) * 0.6 * uBounce, smoothstep(-2.0, -10.0, vFP.y)) + lampE;
        {                                                   // a thin rim of sky light, so rounded forms turn
          float rimk = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
          totalEmissiveRadiance += diffuseColor.rgb * uBounceA * (rimk * rimk * rimk * 0.55);
        }`);
  };
  const flora = new THREE.Mesh(floraGeo, floraMat);
  await rest();

  // ---------- assemble, anchors ----------
  const root = new THREE.Group();
  root.name = 'crown-island';
  root.add(island, spire, lake, flora, fallMesh, mist, spout);
  const pol = (r, deg, y) => new THREE.Vector3(Math.sin(deg * Math.PI / 180) * r, y, Math.cos(deg * Math.PI / 180) * r);
  const flyThrough = [
    pol(335, -173, -58), pol(264, -161, -62), pol(205, -150, -66), pol(162, -134, -68), pol(143, -115, -70), pol(140, -97, -70), pol(151, -80, -68),
    pol(205, -60, -62), pol(262, -45, -48), pol(305, -30, -28), pol(318, -16, -8), pol(300, -5, 5),
    new THREE.Vector3(0, 10, 255), new THREE.Vector3(0, 10, 205), new THREE.Vector3(0, 10, 110), new THREE.Vector3(0, 10, 0),
  ];
  const keelTip = underAt(NU, 0, new THREE.Vector3());
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, HOLE_Y, 0), facing: new THREE.Vector3(0, 0, 1), radius: 7, holeRadius: HOLE_R },
    flyThrough, gapIn: flyThrough[2].clone(), gapOut: flyThrough[7].clone(), rimCrest: new THREE.Vector3(0, 10, 205),
    viewpoints: { far: pol(600, -168, -150), below: pol(400, -172, -120), gallery: pol(141, -100, -70), crest: new THREE.Vector3(0, 12, 212) },
    lookAt: new THREE.Vector3(0, HOLE_Y, 0), center: new THREE.Vector3(0, -60, 0),
    falls: falls.map((f) => {
      const out = new THREE.Vector3(Math.sin(f.a), 0, Math.cos(f.a));
      return { angle: f.a, width: f.w, out, lip: out.clone().multiplyScalar(200.5), foot: out.clone().multiplyScalar(fallR(7.7)).setY(-290) };
    }),
    spireTop, keelTip, landSites,
    spout: { foot: new THREE.Vector3(spFoot.x, eyeY, spFoot.y), tip: new THREE.Vector3(spTip.x, -S.keelD, spTip.y) },
    lakeRadius: 150, rimRadius: R_RIM, keelRadius: 80, galleryY: -68, mistY: -300, sunDirDefault: sunDefault.clone(),
  };

  // ---------- per-frame ----------
  let sunWorld = opts.sunDir ? U.uSun.value.clone() : null, sunTries = 0;
  const _qt = new THREE.Quaternion(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const hero = {
    object: root, radius: 215, height: 372, center: anchors.center.clone(), anchors, uniforms: U,
    // KIT for the rest of the archipelago: the same rock and flora look on geometry in its own local frame (y = 0 at the turf).
    //   rockMaterial()  MeshStandardMaterial wanting attributes color + aMix (x: 0 turf .. 1 rock, y: ambient occlusion 0..1)
    //   beginFlora() ... addTree(x, y, z, height, frond?, rng) / addRoot(x, y, z, length, rng, pink) / tube / ribbon ... endFlora() -> geometry for floraMaterial
    //   topHeight(x, z) local height of the Crown's rim land (-999 off the island)
    kit: {
      rockMaterial: () => makeRockMat(false), floraMaterial: floraMat, rockTint, turfTint, meadowTint,
      beginFlora() { fa = makeAcc(); }, async endFlora(pauseFn) { const acc = fa; fa = makeAcc(); return accGeometry(acc, 'aSway', 2, pauseFn); }, floraVertices: () => fa.n,
      addTree(x, y, z, h, frond, r, rich) { addTree({ x, y, z, h, frond, rich }, r); }, addRoot, tube, ribbon,
      topHeight(x, z) { const r = Math.hypot(x, z); return r > 199 ? -999 : r < 133 ? -5 : topH(r, Math.atan2(x, z)); },
    },
    ground: false, groundY: -300,
    update(dt, time, camera) {
      U.uTime.value = time;
      // the portal's streak on the lake and its light in the hole swell as the eye comes nearer: 45% beyond GLOW_FAR metres from
      // the hole, full within GLOW_NEAR (no camera given: fully on)
      // (and the lake's sheet is a level face turned up: no ray from under its plane reaches it, so it is drawn only for an eye
      // above that plane: the same picture, 9,600 triangles fewer on the way up to the rim)
      if (camera) {
        root.updateWorldMatrix(true, false); root.worldToLocal(_a.setFromMatrixPosition(camera.matrixWorld));
        U.uPortalGlow.value = glowBase * (0.45 + 0.55 * sst(GLOW_FAR, GLOW_NEAR, _a.distanceTo(U.uPortalPos.value)));
        lake.visible = _a.y > -2;
      }
      if (!sunWorld && sunTries < 5) {             // adopt the scene's sun if the world did not pass one
        sunTries++;
        let s = root; while (s.parent) s = s.parent;
        let light = null; s.traverse((o) => { if (!light && o.isDirectionalLight) light = o; });
        if (light) { light.getWorldPosition(_a); light.target.getWorldPosition(_b); if (_a.sub(_b).lengthSq() > 1e-6) sunWorld = _a.clone().normalize(); }
      }
      if (sunWorld) U.uSun.value.copy(sunWorld).applyQuaternion(root.getWorldQuaternion(_qt).invert());
    },
    dispose() {},
  };
  return hero;
}
