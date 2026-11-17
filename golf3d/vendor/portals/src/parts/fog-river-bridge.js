// FOG RIVER BRIDGE hero: "The Bridge in the Fog River".
// A 2.7 km vermilion Art Deco suspension bridge standing in a flowing river of fog: two stepped, fluted
// 230 m towers, 1 m main cables, suspenders every 15 m, a 7.6 m truss deck 63-68 m above the water, six
// lanes of headlit traffic, sodium lamps, a painters' cradle under the truss, tower beacons and flags,
// a container ship passing beneath as a mast and funnel that cut a wake in the fog top, and the fog
// river itself (a displaced, sun-lit sheet with the towers' shadows lying across it).
//
// LOCAL SPACE  origin on the water under midspan, +Y up, the bridge runs along X, +Z is the front (the
//   sunlit side the camera flies on). THE JOURNEY RUNS TOWARD -X: first tower at x = +640, second tower
//   (the portal tower) at x = -640, so that the sun (default direction [-0.6, 0.7, 0.4]) stands high and
//   to the LEFT on the final approach. Anchorages at x = +-985, viaduct ends at x = +-1350.
//   deck      road surface y = deckY(x) = 63 + 5 * (1 - (x/1350)^2)  (68 at midspan, 66.9 at the towers);
//             truss planes and cable planes at z = +-15; bottom chord 8 m under the road
//   cables    saddles at y = 226, lowest point 71.5 at midspan (cableY(x) is exported on the hero)
//   towers    legs centred on z = +-15, 21 m clear between them above the road; first strut above the
//             road has its underside at y = 104; tops at 230, beacons at ~236
//   fog       top at fogTop (default ~82) +- amp, valley floor ~38 inside gaps. hero.fog.heightAt(x, z)
//             is the same function the shaders use (local space, current time). The sheet is shaded as cauliflower
//             heads (three scales of blended cells; within ~1 km of the bridge the two larger scales also lift the sheet,
//             fog.liftAt, by up to ~8 m) lit as a scatterer: a wide terminator broken by wisps, a pale luminous shade, a warm rim
//             on what leans to the sun, veils drawn out down the wind; valleys and gaps are cooler but their heads still reach
//             the sun. uniforms.uRelief (0..1, set by the world per look) is the relief of the open top under a low sun: the
//             troughs of the big billows and the gaps between heads fall into the shade colour, level fog stands lower on
//             the terminator, far fog pales toward the shade and a third, 110 m look toward the sun gives the big billows long
//             shadows. Both main cables throw a curved shadow across the sheet (a little wider than true), each tower one long
//             band 17 to 23 m wide to the lee side (its legs are solids 14 m deep along the bridge), soft at the edges.
//             Steel fades into it from ~20 m above its top. It is not drawn from inside the fog, melts into the haze beyond 2 km,
//             and round ship 0 in the valley the fog stands at uniforms.uShipDip (46.5 m): mast, radar and funnel top
//             (the world lowers it to 37.5: the top tier, wheelhouse and bridge wings too); forward of her house it never
//             lies under her cargo. A valley's floor carries half the top's billows (the world sets its level, uFg.z, to 26).
//             Within ~140 m of the eye a fourth, finer scale of heads is shaded (cotton, folds, streaks torn down the wind on
//             a valley floor), and inside the 10 m core cells the sheet shades itself: each vertex looks 16 m and 40 m toward
//             the sun and darkens where a (2.6x exaggerated) head stands in the way. uniforms.uShadeK (0..1, the world sets
//             it per look) deepens that relief on the open top for a high sun.
//             Rifts: setRift(i, x, z, rx, rz) places up to four ellipses (uniforms.uRift, xz centre and half-axes in m) and
//             uniforms.uRiftK (0..1, the world's) opens them: inside one the sheet falls to -12 m in a funnel whose rim
//             wanders with the flow, its lower wall thins into veils (the world's water shows through), the slab fog is
//             clear down to y = 0 and fog.riftAt(x, z) (0 fog .. 1 open) mirrors it for the world (heads, boats). The
//             towers' and cables' shadows are joined by the suspenders' ladder of stripes within 750 m of the eye, and
//             uniforms.uPG (xz centre, radius, strength) / uPGc (colour) lay a pool of light on the fog (the world's portal).
//             Suspenders and cradle ropes (1 px ribbons) write depth and are drawn before every fog sprite (renderOrder -0.5):
//             far mist is never painted over them. Anything transparent that must show THROUGH them is drawn before them.
//
// OPTS
//   palette   7 hex strings: [vermilion paint, fog lit white, fog shadow blue, concrete, dark hull/asphalt,
//             sodium/headlight amber, beacon red]
//   hour      'dawn' | 'day' | 'golden' | 'night' (default ctx.vary.hour, 'any' -> 'day'): lamp, headlight
//             and window levels and the towers' warm floodlighting. Changes uniforms only.
//   wet       0..1 (default by seed 0.2..0.6): fog-wet sheen on paint and asphalt
//   season    'summer' | 'winter': winter adds a cold frost bloom on upward faces of the steel
//   fog       true: build the fog river sheet (1 call, ~160k triangles). false if the world brings its own;
//             the bridge materials still drown in the same analytic fog slab either way.
//   fogTop    mean height of the fog top (default 78..88 by seed); fogAmp billow height (default 6..10)
//   ships     2: 0, 1 or 2 container ships (air draft 57 m, 2.5 m under the truss). Ship 0 passes under the
//             main span through the fog valley (driven by setProgress); ship 1 waits at anchors.shipStart
//             for the opening "loom past" (move it with setShip).
//   traffic   true; density follows ctx.vary.density
//   sunDir    [x, y, z] toward the sun (default [-0.6, 0.7, 0.4]); sun / sky colours via hero.setLight
//
// HOOKS
//   hero.setProgress(u)      u = 0..1 along the world's path: moves ship 0 along its track so that it is
//                            under the deck at u ~ 0.62, and opens the fog valley under the main span as the
//                            camera arrives (fully open from u = 0.45). Before the first call both run as a
//                            looping demo on world time.
//                            From u = 0.6 a second clearing opens round the portal tower so the roadway, the
//                            traffic and the portal are in clear air for the approach (closed in the demo).
//   hero.setGap(x, z, radius, strength)   place the fog valley yourself (strength 0..1); setGap2(...) the clearing
//                            at the portal tower. Both are plain uniforms: animate them freely.
//   hero.setShip(i, x, z, headingRad)     place a ship yourself (heading 0 = bow toward -Z)
//   hero.setLight({ sunDir, sun, fogLit, fogShade })   re-light the fog sheet, ribbons and slab fog
//   hero.fog = { heightAt(x, z), liftAt(x, z), surfaceAt(x, z), immersion }   heightAt is the field every shader drowns in;
//                            surfaceAt adds the heads' real height on the drawn sheet (within ~1 km of the bridge).
//                            immersion 0..1 = how deep the camera passed to update() is
//                            inside the fog (use it to thicken scene.fog and grey the sky when blind)
//   hero.uniforms            every shared uniform (uFg, uFg2, uGap, uShip, uSun, ...)
//   hero.deckY(x), hero.cableY(x)
//   FOG_GLSL (named export)  the fog height field and slab fog as GLSL, for the world's own shaders: spread
//                            hero.uniforms into the material and call frbSlab(colour, worldPosition).
//
// ANCHORS (local space)
//   portalSeat   { position (-640, 78.5, 0), normal (+1, 0, 0) }: centre of the 14 m portal between the legs
//                of the second tower, 11.6 m above the road, facing back up the roadway (+X)
//   flyThrough   ordered points of a safe line (>= 6 m from every solid): blind start in the fog beside
//                ship 1, climb out, the first tower, the dive along the +Z main cable, the drop into the fog
//                valley beside and below the truss past the cradle, the pull-up over the cable, the roadway
//                centreline, the portal
//   cableDive    [start, end] of the cable sweep (8 m outboard of the +Z cable)
//   underDeck    point level with the bottom chord beside the cradle;  cradle: the cradle's rest position
//   gap          centre of the fog valley;  shipStart, shipTrack [from, to] (ship 0, u = 0 -> 1)
//   funnelTop    the top of a ship's funnel in the ship's own space (for a plume)
//   towerTops    4 leg tops (beacons);  flagTips (2 flag poles);  saddles (cable crests);  pylonTops (4 anchorage pylons)
//   viewpoints   postcard (three-quarter from the front), axis (down the roadway through both towers),
//                valley (from the fog valley up at the deck and first tower)
//
// SIZE  length 2700 (x = -1350..1350), width 34, height 236 (flag tips 247). `radius` (290) and `center`
//   (-330, 150, 0) only frame the part viewer on the portal tower and the fog valley; use hero.length (2700)
//   for the true extent. The fog sheet reaches +-6 km.
// COST  about 240k triangles (160k of them the fog sheet, 5 m cells over the valley under the main span), 16 draw calls (each ship carries a radar and a lights mesh), 6 programs, no lights, one 64x64
//   noise texture. Build ~300 ms on the shared test machine. Call hero.update(dt, time, camera) every frame.
// PER SEED  paint hue, tower style (four struts with stepped finials / three taller portals with masts),
//   setbacks, flute pitch, fog height, billow size, flow direction, valley place, cradle place, ship colours,
//   flag colours, traffic.
// LIGHT  a cold clear morning: one warm-white DirectionalLight (3-3.5) from opts.sunDir and a blue
//   HemisphereLight (~1). All steel is MeshStandardMaterial (lit by the world's lights); the fog sheet,
//   suspenders and glows are ShaderMaterials lit from uSun / uSunCol / uFogLit / uFogShade and honour
//   scene.fog. Bloom on: lamps, headlights and beacons are HDR 3-7.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const XT = 640, XA = 985, XE = 1350, ZC = 15, SAD = 226, TOP = 230, TRUSS = 8;
export const deckY = (x) => 63 + 5 * (1 - (x / XE) * (x / XE));
export function cableY(x) {
  const ax = Math.abs(x);
  if (ax <= XT) { const t = ax / XT; return 71.5 + (SAD - 71.5) * t * t; }
  if (ax <= XA) { const s = (ax - XT) / (XA - XT); return SAD + (66.6 - SAD) * s - 48 * s * (1 - s); }
  return 66.6 - 8.6 * Math.min(1, (ax - XA) / 30);
}
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------- geometry accumulator: flat-shaded quads with metre uvs, colour, surface kind and glow ----------
// kinds: 0 riveted steel plate, 1 fluted steel, 2 road, 3 railing (pickets), 4 concrete, 5 lamp (emissive),
//        6 smooth paint, 7 window band (emissive pattern), 8 container stacks, 9 ship's house (porthole rows)
class Geo {
  constructor(rnd, cap = 30000) {
    this.rnd = rnd; this.n = 0; this.cap = cap; this.jit = 0.06;
    this.P = new Float32Array(cap * 3); this.N = new Float32Array(cap * 3); this.C = new Float32Array(cap * 3);
    this.U = new Float32Array(cap * 2); this.S = new Float32Array(cap * 2);
  }
  grow() {
    const cap = this.cap * 2;
    for (const k of ['P', 'N', 'C']) { const a = new Float32Array(cap * 3); a.set(this[k]); this[k] = a; }
    for (const k of ['U', 'S']) { const a = new Float32Array(cap * 2); a.set(this[k]); this[k] = a; }
    this.cap = cap;
  }
  // a, b, c, d: corners in order round the quad; hint: any vector on the outward side (fixes the winding)
  quad(a, b, c, d, col, kind = 0, glow = 0, hint = null, tone = 1) {
    if (this.n + 6 > this.cap) this.grow();
    let ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) { const t = b; b = d; d = t; nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    // wall uv: u along the horizontal tangent, v = height; floors: u = x, v = z
    let tx = 1, tz = 0; const flat = Math.abs(ny) > 0.75;
    if (!flat) { const h = Math.hypot(nx, nz) || 1; tx = -nz / h; tz = nx / h; }
    const k = tone * (1 + this.jit * (this.rnd() - 0.5) * 2);
    const r = col[0] * k, g = col[1] * k, bl = col[2] * k;
    const vs = [a, b, c, a, c, d], per = Array.isArray(glow);
    if (per && vs[1] !== arguments[1]) glow = [glow[0], glow[3], glow[2], glow[1]];
    const gi = [0, 1, 2, 0, 2, 3];
    for (let i = 0; i < 6; i++) {
      const p = vs[i], o = this.n * 3, o2 = this.n * 2;
      this.P[o] = p[0]; this.P[o + 1] = p[1]; this.P[o + 2] = p[2];
      this.N[o] = nx; this.N[o + 1] = ny; this.N[o + 2] = nz;
      this.C[o] = r; this.C[o + 1] = g; this.C[o + 2] = bl;
      this.U[o2] = flat ? p[0] : p[0] * tx + p[2] * tz; this.U[o2 + 1] = flat ? p[2] : p[1];
      this.S[o2] = kind; this.S[o2 + 1] = per ? glow[gi[i]] : glow;
      this.n++;
    }
  }
  // axis-aligned box; faces: bit mask +x 1, -x 2, +y 4, -y 8, +z 16, -z 32 (default all)
  box(cx, cy, cz, sx, sy, sz, col, kind = 0, glow = 0, faces = 63) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    if (faces & 1) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, kind, glow, [1, 0, 0]);
    if (faces & 2) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, kind, glow, [-1, 0, 0]);
    if (faces & 4) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, kind, glow, [0, 1, 0], 1.06);
    if (faces & 8) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, kind, glow, [0, -1, 0], 0.8);
    if (faces & 16) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, kind, glow, [0, 0, 1]);
    if (faces & 32) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, kind, glow, [0, 0, -1]);
  }
  // box beam between two points (4 sides, optional end caps); w across, h in the "up" plane
  beam(a, b, w, h, col, kind = 0, caps = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let sx, sy, sz;
    if (Math.abs(dy) > 0.999 * L) { sx = 1; sy = 0; sz = 0; } else { sx = -dz; sy = 0; sz = dx; const l = Math.hypot(sx, sz); sx /= l; sz /= l; }
    let tx = sy * dz - sz * dy, ty = sz * dx - sx * dz, tz = sx * dy - sy * dx; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const hw = w / 2, hh = h / 2, c = (p, i, j) => [p[0] + sx * hw * i + tx * hh * j, p[1] + sy * hw * i + ty * hh * j, p[2] + sz * hw * i + tz * hh * j];
    const A = [c(a, -1, -1), c(a, 1, -1), c(a, 1, 1), c(a, -1, 1)], B = [c(b, -1, -1), c(b, 1, -1), c(b, 1, 1), c(b, -1, 1)];
    const S = [sx, sy, sz], T = [tx, ty, tz], neg = (v) => [-v[0], -v[1], -v[2]];
    this.quad(A[0], B[0], B[1], A[1], col, kind, 0, neg(T), 0.82);
    this.quad(A[1], B[1], B[2], A[2], col, kind, 0, S);
    this.quad(A[2], B[2], B[3], A[3], col, kind, 0, T, 1.05);
    this.quad(A[3], B[3], B[0], A[0], col, kind, 0, neg(S));
    if (caps) { this.quad(A[0], A[1], A[2], A[3], col, kind, 0, [-dx, -dy, -dz]); this.quad(B[0], B[1], B[2], B[3], col, kind, 0, [dx, dy, dz]); }
  }
  // extrude a plan profile [[x,z],...] (around cx,cz) from y0 to y1, scaling from (k0) to (k1); cap: add a lid at y1
  tier(prof0, prof1, cx, cz, y0, y1, col, kind = 0, cap = true) {
    const n = prof0.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = prof0[i], b = prof0[j], c = prof1[j], d = prof1[i];
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      this.quad([cx + a[0], y0, cz + a[1]], [cx + b[0], y0, cz + b[1]], [cx + c[0], y1, cz + c[1]], [cx + d[0], y1, cz + d[1]], col, kind, 0, [mx, 0.0001, mz]);
    }
    if (cap) for (let i = 0; i < n; i += 2) {
      const b = prof1[i], c = prof1[(i + 1) % n], d = prof1[(i + 2) % n];
      this.quad([cx, y1, cz], [cx + b[0], y1, cz + b[1]], [cx + c[0], y1, cz + c[1]], [cx + d[0], y1, cz + d[1]], col, kind, 0, [0, 1, 0], 1.06);
    }
  }
  get triangles() { return this.n / 3; }
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.slice(0, n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, n * 3), 3));
    g.setAttribute('aUv', new THREE.BufferAttribute(this.U.slice(0, n * 2), 2));
    g.setAttribute('aS', new THREE.BufferAttribute(this.S.slice(0, n * 2), 2));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  // toGeometry() for the big zones, in steps that each hand the frame back: a yield after every attribute copy, and the
  // bounds worked out here over the raw array in the same arithmetic as three's computeBoundingSphere() and
  // computeBoundingBox() (box of the points, its centre, the furthest point from it), so the result is the same geometry.
  async toGeometrySteps(ctx) {
    const g = new THREE.BufferGeometry(), n = this.n, STEP = 2500;
    // views of the filled part of each array, not copies: the same numbers, and no 10 MB of new arrays for the collector
    g.setAttribute('position', new THREE.BufferAttribute(this.P.subarray(0, n * 3), 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.BufferAttribute(this.N.subarray(0, n * 3), 3)); await ctx.yield();
    g.setAttribute('color', new THREE.BufferAttribute(this.C.subarray(0, n * 3), 3)); await ctx.yield();
    g.setAttribute('aUv', new THREE.BufferAttribute(this.U.subarray(0, n * 2), 2));
    g.setAttribute('aS', new THREE.BufferAttribute(this.S.subarray(0, n * 2), 2)); await ctx.yield();
    if (n === 0) { g.computeBoundingSphere(); g.computeBoundingBox(); return g; }
    const P = g.attributes.position.array;
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let a = 0; a < n; a += STEP) {
      for (let i = a * 3, e = Math.min(a + STEP, n) * 3; i < e; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2];
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z); x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
      }
      await ctx.yield();
    }
    const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5, cz = (z0 + z1) * 0.5;
    let r2 = 0;
    for (let a = 0; a < n; a += STEP) {
      for (let i = a * 3, e = Math.min(a + STEP, n) * 3; i < e; i += 3) {
        const dx = cx - P[i], dy = cy - P[i + 1], dz = cz - P[i + 2];
        r2 = Math.max(r2, dx * dx + dy * dy + dz * dz);
      }
      await ctx.yield();
    }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
    g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
    return g;
  }
}

// Deco plan: a rectangle (half sizes a along x, b along z) with twice-stepped corners, CCW seen from above
function decoProfile(a, b, s) {
  const q = [[a, b - 2 * s], [a - s, b - 2 * s], [a - s, b - s], [a - 2 * s, b - s], [a - 2 * s, b], [-(a - 2 * s), b]];
  // quadrant 1 runs from (a, .) up to (., b); mirror into the other three in CCW order
  const out = [];
  out.push([a, -(b - 2 * s)], ...q.slice(0, 5));                                  // +x face, then the +x+z corner
  out.push([-(a - 2 * s), b], [-(a - 2 * s), b - s], [-(a - s), b - s], [-(a - s), b - 2 * s], [-a, b - 2 * s]);   // +z face, -x+z corner
  out.push([-a, -(b - 2 * s)], [-(a - s), -(b - 2 * s)], [-(a - s), -(b - s)], [-(a - 2 * s), -(b - s)], [-(a - 2 * s), -b]);   // -x face, -x-z corner
  out.push([a - 2 * s, -b], [a - 2 * s, -(b - s)], [a - s, -(b - s)], [a - s, -(b - 2 * s)]);   // -z face, +x-z corner
  return out;
}

// ---------- shared GLSL: the fog river as a height field + the slab fog every surface drowns in ----------
// All positions are HERO-LOCAL (uInv takes world to local), so the hero may be moved or turned.
export const FOG_GLSL = /* glsl */`
uniform sampler2D uFN;
uniform vec4 uFg;      // x mean top, y billow amp, z valley floor, w time
uniform vec4 uFg2;     // x gap threshold, y wake strength, z density (1/m), w flow speed (m/s)
uniform vec4 uGap;     // xz centre, z radius, w strength (the valley under the main span)
uniform vec4 uGap2;    // the same for the clearing at the portal tower
uniform vec4 uShip;    // xz of ship 0, zw unit heading
uniform vec2 uFlow; uniform float uShipDip;   // uShipDip: the level the fog stands at round ship 0 in the valley
uniform vec3 uFogLit; uniform vec3 uFogShade; uniform vec3 uCam; uniform float uCamH;
uniform vec4 uRift[4]; // rifts torn in the river down to the water: xz centre, zw half-axes (m)
uniform float uRiftK;  // 0 closed .. 1 open
uniform float uInK;    // tone of the fog seen from inside it (1; the world deepens it for the blind arrival)
vec3 frbN(vec2 p) { vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f); return textureLod(uFN, (i + f + .5) / 64., 0.).rgb; }
float frbShipK = 0.;      // set by frbH: how far its point lies in the fog that stands round ship 0 (0..1)
float frbRiftK = 0.;      // set by frbH: how far its point lies inside a rift (0 fog .. 1 open water)
// a rift's rim wanders and breaks into bays and tongues that drift with the flow (q is the advected point)
float frbRift(vec2 p, vec2 q) {
  vec2 w = frbN(q * .0052 + 2.9).rg - .5;
  float w2 = (frbN(q * .019 + 6.1).b - .5) * .34 + (frbN(q * .033 + 1.7).r - .5) * .12, r = 0.;      // 50 m bays and 30 m tongues
  for (int i = 0; i < 4; i++) {
    vec2 d = (p - uRift[i].xy) / max(uRift[i].zw, vec2(1.));
    r = max(r, 1. - smoothstep(.38, 1.04, length(d + w * .42) + w2));
  }
  return r * uRiftK;
}
float frbH(vec2 p) {
  vec2 q = p - uFlow * (uFg.w * uFg2.w);
  vec2 a = vec2(dot(q, vec2(-uFlow.y, uFlow.x)), dot(q, uFlow) * .6);          // billows drawn out along the flow
  float rr = max(abs(p.x) * .55, abs(p.y));
  float f3 = 1. - smoothstep(600., 1400., rr);
  float far = 1. + 1.1 * smoothstep(1300., 3000., rr) + 1.3 * smoothstep(3000., 5600., rr);   // far banks pile higher and break the skyline
  float n = frbN(a * .0033).r * .5 + frbN(a * .0085 + 3.7).g * .32 + (frbN(a * .021 + 9.1).b - .5) * .18 * f3 + .09;
  float g = frbN(q * .00105 + 11.3).b;
  float gaps = smoothstep(uFg2.x, uFg2.x + .16, g);
  vec2 d = (p - uGap.xy) / vec2(uGap.z, uGap.z * 1.7);
  vec2 d2 = (p - uGap2.xy) / vec2(uGap2.z, uGap2.z * 1.7);
  float v = max(gaps, max(uGap.w * (1. - smoothstep(.45, 1., length(d))), uGap2.w * (1. - smoothstep(.45, 1., length(d2)))));
  float b = (n * 2. - 1.) * far;
  float h = mix(uFg.x + uFg.y * b, uFg.z + uFg.y * .5 * b, v);      // (a valley's floor lies flatter than the top: half its billows)
  // cauliflower: rounded heads with creases between them, real height near the bridge
  h += (frbN(a * .0125 + 5.3).g - .5) * 15. * (1. - .5 * v) * (1. - smoothstep(900., 1900., rr));          // 80 m lumps with real height near the bridge (half in a valley: its floor is many heads, not one dome)
  vec2 r = p - uShip.xy;
  float along = -dot(r, uShip.zw), lat = dot(r, vec2(-uShip.w, uShip.z));
  float beh = max(along, 0.), w = 7. + beh * .16;
  float fade = exp(-beh / 320.) * smoothstep(-30., 8., along) * (1. - smoothstep(46., 64., h)) * uFg2.y;
  float rim = (abs(lat) - w * 1.9) / (w * .8);
  h += (-exp(-lat * lat / (w * w)) + .55 * exp(-rim * rim)) * fade * 5.;
  // the fog stands higher round the ship in the valley: only her mast, radar and funnel top clear it
  vec2 hs = (p - uShip.xy + uShip.zw * 12.) / 62.;
  float k1 = uFg2.y * min(1.4 * exp(-dot(hs, hs)), 1.) * (1. - smoothstep(54., 70., h));
  h = mix(h, uShipDip + (n - .5) * 5., k1);
  // ... and forward of her house it never lies lower than her deck cargo (a long patch over the hull)
  vec2 rs = p - uShip.xy;
  vec2 hf = vec2(dot(rs, uShip.zw) - 100., dot(rs, vec2(-uShip.w, uShip.z))) / vec2(125., 44.);
  float k2 = uFg2.y * min(1.5 * exp(-dot(hf, hf)), 1.) * (1. - smoothstep(54., 70., h));
  h = mix(h, max(h, uShipDip - 2.5 + 4. * smoothstep(33., 37., uShipDip) + (n - .5) * 4.), k2);
  frbShipK = max(k1, k2);      // (a low dip still covers her tallest stacks, 34 m)
  frbRiftK = frbRift(p, q);
  h = mix(h, -12., frbRiftK);  // in a rift the river's top falls away to the water (the sheet thins out on the way down)
  return h;
}
float frbFogAmount(vec3 lp) {
  float H = frbH(lp.xz), rk = frbRiftK;
  float lo = min(uCam.y, lp.y), span = max(abs(uCam.y - lp.y), .5);
  float fr = .5 * (clamp((H - lo) / span, 0., 1.) + clamp((uCamH - lo) / span, 0., 1.));
  float f = 1. - exp(-uFg2.z * distance(uCam, lp) * fr);
  // seen from above, whatever stands below the fog top is drowned; from inside the fog only distance drowns it
  float cin = clamp((uCamH - uCam.y + 4.) / 10., 0., 1.);
  float Hn = H + (frbN(lp.xz * .09 + uFg.w * .05).r - .5) * 7.;                       // a broken, wispy drowning edge
  // with the camera in clear air (above the river, or low in a valley of it) the sight line to anything that stands above
  // its own fog top runs through air: only a breath of haze is left on it, however far off it is
  f *= 1. - .9 * (1. - cin) * smoothstep(Hn + 4., Hn + 45., lp.y);
  float edge = 1. - smoothstep(Hn - 2., Hn + mix(7., 26., smoothstep(150., 700., distance(uCam, lp))) + 6. * frbShipK, lp.y);      // (round ship 0 the bank is soft: her upper tiers fade into it over 13 m)                              // legs, cables and masts fade into the river with depth: a veil from ~20 m above its top
  return max(f, .95 * edge * edge * (1. - cin)) * (1. - .94 * smoothstep(.1, .38, rk) * (1. - cin));      // (seen from inside the fog a rift is as drowned as all else)      // in a rift the air is clear down to the water
}
vec3 frbFogColor() { float sunny = smoothstep(-16., 6., uCam.y - uCamH); return mix((uFogShade * .82 + uFogLit * .1) * uInK, mix(uFogShade, uFogLit, .66), sunny); }
vec3 frbSlab(vec3 col, vec3 lp) { return mix(col, frbFogColor(), frbFogAmount(lp)); }
`;
// cauliflower: every cell of a jittered grid carries a pillow; the nearest few are blended, so the gaps between heads
// are soft folds, not ruled creases. frbDome returns (height 0 gap .. 1 head, uphill direction). frbLift is the real
// height (m) the two larger scales of heads add to the sheet near the bridge (mirrored by fog.liftAt in JS).
export const DOME_GLSL = /* glsl */`
vec3 frbDome(vec2 p) {
  vec2 ip = floor(p), fp = p - ip; float ws = 0., hs = 0.; vec2 gs = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = textureLod(uFN, (ip + g + .5) / 64., 0.).rb * .8 + .1;
    vec2 r = g + o - fp; float d = dot(r, r), w = exp(-d * 7.5);
    ws += w; hs += w * (1. - d * 2.3); gs += w * r;
  }
  ws = max(ws, 1e-5);
  return vec3(max(hs / ws, 0.), gs / ws);
}
float frbLift(vec2 p) {
  float k = 1. - smoothstep(520., 1100., max(abs(p.x) * .55, abs(p.y)));
  if (k <= 0.) return 0.;
  vec2 q = p - uFlow * (uFg.w * uFg2.w * 1.2);
  vec2 wq = q + (frbN(q * .011 + 4.4).rg - .5) * 46.;
  float h1 = frbDome(wq / 66.).x, h2 = frbDome((wq + (frbN(q * .034 + 8.1).gb - .5) * 15.) / 24. + 31.7).x;
  return ((h1 - .55) * 11. + (h2 - .55) * 7.) * k;
}
`;
const MOVE_GLSL = /* glsl */`
float frbDeckY(float x) { float t = x / 1350.; return 63. + 5. * (1. - t * t); }
float frbWrap(float x) { return mod(x + 1350., 2700.) - 1350.; }
`;

// MeshStandardMaterial with the bridge's surface kinds, slab fog and optional vertex motion (mode: 0 static, 1 cars, 2 flags)
function makeSteel(U, mode = 0, extra = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, metalness: 0.12, ...extra });
  mat.defines = { ...(mat.defines || {}), FRB_MODE: mode };
  mat.onBeforeCompile = (sh) => {
    for (const k of Object.keys(U)) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec2 aUv; attribute vec2 aS; uniform mat4 uInv; uniform vec4 uFg; uniform vec3 uPerp; uniform float uPx;
        varying vec3 vLp; varying vec2 vUvM; varying vec2 vS; varying vec2 vUpFlat;
        #if FRB_MODE == 1
        attribute vec2 aCar;
        #endif
        #if FRB_MODE == 2
        attribute vec3 aFlag;
        #endif
        ${MOVE_GLSL}`)
      .replace('#include <begin_vertex>', `vec3 transformed = position;
        #if FRB_MODE == 1
        float cx = frbWrap(aCar.x + aCar.y * uFg.w);
        transformed.x += cx; transformed.y += frbDeckY(transformed.x);
        #endif
        #if FRB_MODE == 2
        float fw = sin(aFlag.x * 7. - uFg.w * 5.2 + aFlag.y) + .45 * sin(aFlag.x * 15. - uFg.w * 8.3 + aFlag.y * 2.);
        transformed += uPerp * (fw * aFlag.z * aFlag.x);
        transformed.y += (.35 * sin(aFlag.x * 5. - uFg.w * 3.7 + aFlag.y) - .9 * aFlag.x) * aFlag.z * aFlag.x;
        #endif
        if (aS.x > 5.5 && aS.x < 6.5 && aS.y > .01) {      // main cables: never thinner than ~1.5 px
          float cd = distance(cameraPosition, (modelMatrix * vec4(position, 1.)).xyz);
          transformed += normal * max(cd * uPx * .75 - aS.y, 0.);
        }
        vLp = (uInv * (modelMatrix * vec4(transformed, 1.))).xyz; vUvM = aUv; vS = aS;
        vUpFlat = vec2(normal.y, step(.75, abs(normal.y)));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLp; varying vec2 vUvM; varying vec2 vS; varying vec2 vUpFlat;
        uniform vec4 uLook;    // x wet, y frost, z flute pitch (m), w bounce
        uniform vec4 uLamps;   // x lamp level, y window level, z tower flood, w beacon
        uniform vec3 uPrimer; uniform vec3 uWarm; uniform vec3 uSkyCol; uniform vec3 uSun; uniform vec4 uStrutLo; uniform vec4 uStrutHi;
        float frbRough = .6; vec3 frbEmit = vec3(0.); float frbOcc = 1.; float frbUnder = 0.; float frbSunK = 1.;
        float frbSeam(float v, float period) { return (.5 - abs(fract(v / period) - .5)) * period; }
        // a dark line of half-width h at distance d from its centre, box-filtered over a pixel footprint fw
        float frbLine(float d, float h, float fw) { return (1. - smoothstep(h - .5 * fw - 1e-4, h + .5 * fw, d)) * min(1., 2. * h / max(fw, 1e-3)); }
        ${FOG_GLSL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float kind = vS.x; vec2 m = vUvM; vec2 fw2 = fwidth(m); float fw = max(fw2.x, fw2.y);
          float aa = 1. - smoothstep(.12, .7, fw);
          vec3 wn = textureLod(uFN, vec2(m.x * .013 + m.y * .0006, m.y * .0019), 0.).rgb;
          vec3 pn = textureLod(uFN, vLp.xy * .0052 + vec2(.31, .77), 0.).rgb;
          vec3 c = diffuseColor.rgb;
          if (kind < 1.5 || (kind > 5.5 && kind < 6.5)) {
            c *= .8 + .3 * mix(.5, wn.r, 1. - smoothstep(.5, 2., fw)) + .1 * (textureLod(uFN, vec2(m.x * .035 + .5, m.y * .008), 0.).g * 2. - 1.) * (1. - smoothstep(.15, .5, fw));
            float prim = smoothstep(.68, .74, pn.b) * step(kind, 1.5);
            c = mix(c, uPrimer, prim * .55);                                    // red-lead primer where the painters have been
            c *= 1. + .16 * (1. - smoothstep(.22, .3, pn.g));                              // fresh coats
            frbRough = mix(.62, .3, uLook.x * (.6 + .4 * wn.g));
            c = mix(c, vec3(.74, .8, .86), uLook.y * smoothstep(.4, .9, vUpFlat.x) * (.45 + .5 * wn.b));
            if (kind > 5.5 && vS.y > .01) c *= 1. - .4 * (1. - smoothstep(.3, .5 + fw, frbSeam(m.x, 15.)));   // cable bands
          }
          if (kind < .5 || (kind > 5.5 && kind < 6.5 && vS.y < .01)) {
            float sy = frbSeam(m.y, 3.2), sx = frbSeam(m.x + floor(m.y / 3.2) * 1.3, 2.6);
            float seam = max(frbLine(sy, .07, fw2.y), .4 * frbLine(sx, .05, fw2.x));
            vec2 pid = floor(vec2((m.x + floor(m.y / 3.2) * 1.3) / 2.6, m.y / 3.2));
            c *= mix(1., .9 + .2 * textureLod(uFN, (pid + .5) / 64., 0.).g, 1. - smoothstep(.25, .9, fw));
            // close to the eye (the truss beside and over the flight) the plates carry more: deeper seams, prouder rivets, a slow
            // weathering streak down each plate; gone by 120 m, so nothing shimmers far off
            float nearD = 1. - smoothstep(60., 120., distance(uCam, vLp));
            c *= 1. - (.36 + .24 * nearD) * seam;
            float riv = (1. - smoothstep(.14, .2, sy)) * smoothstep(.07, .1, sy) * step(.5, fract(m.x / .32));
            c *= 1. + (.22 + .2 * nearD) * riv * (1. - smoothstep(.02, .09, fw));
            c *= 1. + (textureLod(uFN, vec2(m.x * .021 + .37, m.y * .0031), 0.).b - .5) * .18 * nearD * (1. - smoothstep(.2, .8, fw));
          } else if (kind < 1.5) {
            float f = abs(fract(m.x / uLook.z) - .5) * 2.;
            float fa = 1. - smoothstep(.1, .42, fw2.x / uLook.z);
            c *= mix(.86, mix(.42, 1.15, smoothstep(.06, .62, f)), fa);
            vec3 gn = cross(dFdx(vLp), dFdy(vLp)); gn = gn / max(length(gn), 1e-6);
            float sunT = clamp(dot(uSun.xz, vec2(-gn.z, gn.x)) * 1.8, -1., 1.);
            c *= 1. - .42 * fa * sunT * sin((fract(m.x / uLook.z) - .5) * 6.2832);
            c *= 1. - .25 * frbLine(frbSeam(m.y, 6.4), .07, fw2.y);
          } else if (kind < 2.5) {
            float z = abs(m.y);
            float dash = step(fract(m.x / 12.), .28);
            float ln = frbLine(abs(z - 3.5), .09, fw2.y) * dash + frbLine(abs(z - 7.), .09, fw2.y) * dash + frbLine(abs(z - 10.1), .1, fw2.y);
            float mid = frbLine(abs(z - .28), .1, fw2.y);
            float aaR = 1. - smoothstep(.3, 1.6, fw);
            c *= .8 + .35 * wn.g - .12 * (1. - smoothstep(.3, .9, abs(fract(z / 3.5) - .5) * 2.)) ;
            c = mix(c, vec3(.56, .55, .5), clamp(ln, 0., 1.) * aaR * .9);
            c = mix(c, vec3(.62, .42, .06), mid * aaR * .9);
            frbRough = mix(.9, .34, uLook.x);
          } else if (kind < 3.5) {
            float bar = step(fract(m.x / .34), .3), rail = step(.86, vS.y) + step(vS.y, .1);
            float posts = step(fract(m.x / 3.75), .06);
            if (max(max(bar, rail), posts) < .5) { if (fw2.x < .16) discard; c *= .7; }
          } else if (kind < 4.5) {
            c *= .8 + .34 * wn.g;
            c *= 1. - .14 * frbLine(frbSeam(m.y, 1.5), .04, fw2.y);
            c *= mix(.78, 1., smoothstep(0., 30., vLp.y));
            frbRough = .92;
          } else if (kind < 5.5) {
            frbEmit = vColor.rgb * vS.y * uLamps.x;
          } else if (kind > 6.5 && kind < 7.5) {
            vec2 cell = vec2(m.x / 1.7, m.y / 2.9), id = floor(cell), fc = fract(cell);
            float lit = step(.42, textureLod(uFN, (id + .5) / 64., 0.).r);
            float win = step(.16, fc.x) * step(fc.x, .84) * step(.3, fc.y) * step(fc.y, .78) * (1. - vUpFlat.y);
            c = mix(c, vec3(.03, .05, .07), win);
            frbEmit = uWarm * win * lit * vS.y * uLamps.y * (1. - smoothstep(.3, 1.5, fw) * .6);
            frbRough = mix(.6, .2, win);
          } else if (kind > 7.5 && kind < 8.5) {
            vec2 cs = mix(vec2(12.4, 2.7), vec2(2.5, 12.4), vUpFlat.y);
            vec2 cell = m / cs, id = floor(cell), fc = fract(cell);
            vec3 h = textureLod(uFN, (id + vec2(.5 + floor(vLp.x * .0001), .5)) / 64., 0.).rgb;
            vec3 k = h.r < .28 ? vec3(.36, .08, .05) : h.r < .5 ? vec3(.04, .1, .22) : h.r < .68 ? vec3(.05, .25, .24) : h.r < .84 ? vec3(.5, .33, .07) : vec3(.42, .43, .44);
            float gap = smoothstep(.0, .03, fc.x) * (1. - smoothstep(.97, 1., fc.x)) * smoothstep(0., .05, fc.y) * (1. - smoothstep(.95, 1., fc.y));
            float corr = .9 + .1 * step(.5, fract(m.x / .3)) * (1. - vUpFlat.y) * (1. - smoothstep(.05, .2, fw));
            c = k * (.75 + .5 * h.g) * mix(.35, 1., gap) * corr;
            frbRough = .7;
          } else if (kind > 8.5) {
            // a ship's house: rows of small portholes (about one in four lit), plate seams, rust weeping from the ports
            float px = m.x / 2.6, row = (m.y - 15.) / 5.6, fx = fract(px), fy = fract(row);
            vec3 ph = textureLod(uFN, (vec2(floor(px), floor(row)) + .5) / 64., 0.).rgb;
            float port = (1. - smoothstep(.13, .13 + fw2.x * .5 + .02, abs(fx - .5))) * (1. - smoothstep(.058, .058 + fw2.y * .2 + .01, abs(fy - .62)));
            port *= step(.12, ph.b) * (1. - vUpFlat.y);
            c *= .86 + .2 * wn.g;
            c *= 1. - .1 * frbLine(frbSeam(m.y - 15., 2.8), .04, fw2.y) - .06 * frbLine(frbSeam(m.x, 5.2), .03, fw2.x);
            c *= 1. - .14 * (1. - smoothstep(.1, .2, abs(fx - .5))) * step(fy, .55) * smoothstep(.1, .55, fy) * step(.5, ph.g);
            c = mix(c, vec3(.03, .05, .07), port);
            frbEmit = uWarm * port * step(.74, ph.r) * vS.y * uLamps.y * (1. - smoothstep(.3, 1.5, fw) * .5);
            frbRough = mix(.55, .2, port);
          }
          if (kind < 1.5 || (kind > 5.5 && kind < 6.5)) {
            float dkY = 63. + 5. * (1. - vLp.x * vLp.x / 1822500.);
            float under = (1. - smoothstep(12.2, 15.3, abs(vLp.z))) * step(vLp.y, dkY - .6) * step(dkY - 9.6, vLp.y);
            frbUnder = under;
            // the soffit and everything between the trusses stands in the deck's own shade: the sun reaches it only where it
            // slants in under the slab, and then through the lattice
            float sdk = (dkY - .9 - vLp.y) / max(uSun.y, .05);
            float deckSh = 1. - smoothstep(13., 17., abs(vLp.z + uSun.z * sdk));
            frbSunK = 1. - under * mix(.55, .92, deckSh);
            frbOcc = (1. - .26 * smoothstep(.5, .9, -vUpFlat.x)) * (1. - .5 * under);
            // the towers: each tier stands lighter than the one below, shade gathers under every strut and ledge
            float tw = step(600., abs(vLp.x)) * step(abs(vLp.x), 680.) * step(58., vLp.y);
            vec4 dLo = uStrutLo - vec4(vLp.y), dHi = vec4(vLp.y) - uStrutHi;
            vec4 below = exp(-max(dLo, 0.) / 4.5) * step(0., dLo), above = exp(-max(dHi, 0.) / 9.) * step(0., dHi);
            float legs = 1. - smoothstep(5.5, 7., abs(abs(vLp.z) - 15.));
            float tone = mix(.8, 1.06, smoothstep(70., 228., vLp.y)) * (1. - .3 * legs * max(max(below.x, below.y), max(below.z, below.w))) * (1. + .1 * max(max(above.x, above.y), max(above.z, above.w)));
            frbOcc *= mix(1., tone, tw);
            // the reveals of the tower portals (the legs' inner faces and where the struts meet them) see less sky
            frbOcc *= 1. - .24 * (1. - smoothstep(.9, 1.9, abs(abs(vLp.z) - 10.9))) * step(600., abs(vLp.x)) * step(abs(vLp.x), 680.) * step(70., vLp.y);
            c *= frbOcc;
          }
          diffuseColor.rgb = c;
        }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = frbRough;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += frbEmit + diffuseColor.rgb * uSkyCol * .05;
        totalEmissiveRadiance += diffuseColor.rgb * mix(uFogLit, uFogShade, .6 * frbUnder) * (uLook.w * (1. - .35 * frbUnder)) * (.5 - .5 * vUpFlat.x) * (1. - .65 * smoothstep(70., 250., vLp.y)) * mix(1., .6, smoothstep(95., 125., vLp.y));
        totalEmissiveRadiance += diffuseColor.rgb * uWarm * uLamps.z * exp(-max(vLp.y - 66., 0.) / 85.) * step(vS.x, 1.5) * step(52., vLp.y);`)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directDiffuse *= frbSunK; reflectedLight.directSpecular *= frbSunK;')
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb = frbSlab(gl_FragColor.rgb, vLp);\n#include <fog_fragment>');
  };
  mat.customProgramCacheKey = () => 'frb-steel-' + mode;
  return mat;
}

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// thin things (suspenders, ropes, poles): view-facing ribbons that never get thinner than ~1.4 px
function makeRibbonMat(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U }, fog: true, transparent: true, depthWrite: true,      // they write depth and are drawn before every fog sprite, so far mist is never painted over a near suspender
    vertexShader: /* glsl */`
      attribute vec3 aT; attribute vec2 aW; attribute vec3 color;
      uniform mat4 uInv; uniform vec3 uCam; uniform float uPx;
      varying vec3 vLp; varying vec3 vCol; varying float vA; varying float vSide;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.);
        vec3 lp = (uInv * wp).xyz; vLp = lp;
        vec3 tw = normalize(mat3(modelMatrix) * aT);
        vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam);
        vec3 sd = cross(tw, toCam); sd = sd / max(length(sd), 1e-4);
        float w = max(aW.y, dist * uPx * 1.05);
        vA = clamp(aW.y / w, .3, 1.); vSide = aW.x; vCol = color;
        wp.xyz += sd * (aW.x * w * .5);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vLp; varying vec3 vCol; varying float vA; varying float vSide;
      uniform vec3 uSunCol; uniform vec3 uSkyCol;
      ${FOG_GLSL}
      #include <fog_pars_fragment>
      void main() {
        float rnd = .55 + .45 * (1. - vSide * vSide);
        vec3 col = vCol * (uSkyCol * .55 + uSunCol * (.25 + .5 * (.5 + .5 * vSide))) * rnd;
        col = frbSlab(col, vLp);
        gl_FragColor = vec4(col, vA);
        #include <fog_fragment>
      }`,
  });
}

// additive halos: lamps, headlights, tail lights, beacons. One call for all of them.
function makeGlowMat(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec2 aOff; attribute vec4 aG; attribute vec2 aCar; attribute vec3 color;
      uniform mat4 uInv; uniform vec4 uLamps; uniform float uPx;
      varying vec2 vOff; varying vec3 vCol;
      ${MOVE_GLSL}
      ${FOG_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        if (aG.w > 1.5) { float cx = frbWrap(aCar.x + aCar.y * uFg.w); p.x += cx; p.y += frbDeckY(p.x); }
        vec4 wp = modelMatrix * vec4(p, 1.);
        vec3 lp = (uInv * wp).xyz;
        float f = frbFogAmount(lp);
        vec4 mvPosition = viewMatrix * wp;
        float dist = length(mvPosition.xyz);
        float s = max(aG.x, dist * uPx * 3.) * (1. + 2.2 * f);
        float pulse = 1.;
        if (aG.y > 0.) { float ph = .5 + .5 * sin(uFg.w * aG.y * 6.2832 + aG.z); pulse = .12 + .88 * ph * ph * ph; }
        float level = aG.w > .5 && aG.w < 1.5 ? uLamps.w : uLamps.x;
        float thin = aG.x / s;
        vCol = color * pulse * level * (1. - f * (1. - .3 * exp(-dist * .0025))) * mix(1., thin * thin, .6) * (1. + 2.2 * f * .3);   // a lamp deep in fog fades out with distance
        vOff = aOff;
        mvPosition.xy += aOff * s;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vOff; varying vec3 vCol;
      #include <fog_pars_fragment>
      void main() {
        float r2 = dot(vOff, vOff);
        float g = max(exp(-r2 * 9.) - .0001, 0.) + .22 * max(exp(-r2 * 2.6) - .0743, 0.);
        gl_FragColor = vec4(vCol * g, 1.);
        #ifdef USE_FOG
        #ifdef FOG_EXP2
        gl_FragColor.rgb *= .4 + .6 * exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        #else
        gl_FragColor.rgb *= 1. - .6 * smoothstep(fogNear, fogFar, vFogDepth);
        #endif
        #endif
      }`,
  });
}

// the fog river: a displaced sheet, lit like a cloud top, carrying the bridge's shadow
function makeFogMat(U, fine = 1) {
  return new THREE.ShaderMaterial({
    defines: { FRB_FINE: fine ? 1 : 0 },
    uniforms: { ...fogU(), ...U }, fog: true, transparent: true, depthWrite: true, side: THREE.FrontSide,   // the underside is never drawn: from inside the fog the world supplies the view
    vertexShader: /* glsl */`
      varying vec3 vLp; varying vec3 vN; varying float vSh; varying float vRk;
      uniform vec3 uSun;
      ${FOG_GLSL}
      ${DOME_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vec2 p = position.xz; float h = frbH(p), e = 10.;
        float shipK = frbShipK; vRk = frbRiftK;
        float hx = frbH(p + vec2(e, 0.)) - h, hz = frbH(p + vec2(0., e)) - h;
        vN = normalize(vec3(-hx, e, -hz));
        // near the bridge the heads have real height: silhouettes and parallax, not only shading
        // (round the ship the heads keep their shading but lose their height: a gap between two heads would bare her cargo)
        float hl = h + frbLift(p) * (1. - .85 * shipK);
        // under a low sun the heads shade one another: two looks toward the sun (16 m and 40 m), worked out per vertex of
        // the 5-10 m cells, so the shade is a soft dapple with no edge; far off, where the heads have no height, there is none
        float sl = max(length(uSun.xz), 1e-3); vec2 sdir = uSun.xz / sl; float tanE = uSun.y / sl;
        vec2 p1 = p + sdir * 16., p2 = p + sdir * 40.;
        // (the sheet's real relief is gentle, as its shading normal is steeper than its slope: the same exaggeration here)
        float o1 = (frbH(p1) + frbLift(p1) - hl) * 2.6 - 16. * tanE, o2 = (frbH(p2) + frbLift(p2) - hl) * 2.6 - 40. * tanE;
        vec2 p3 = p + sdir * 110.; float o3 = (frbH(p3) + frbLift(p3) - hl) * 2.2 - 110. * tanE;
        vSh = max(max(smoothstep(-8., 17., o1), smoothstep(-8., 21., o2)), .8 * smoothstep(-9., 24., o3)) * (1. - smoothstep(860., 990., abs(p.x))) * (1. - smoothstep(350., 445., abs(p.y)));      // only on the even 5-10 m cells of the core: on the big outer cells it would show their edges
        // ... but never over the eye of a camera that is flying in clear air above the river (no popping through a head)
        float dc = distance(p, uCam.xz), clearAir = 1. - clamp((uCamH - uCam.y + 4.) / 10., 0., 1.);
        h = mix(hl, min(hl, max(h, uCam.y - 4.5 + dc * .4)), clearAir * (1. - smoothstep(20., 70., dc)));
        vec3 lp = vec3(p.x, h, p.y); vLp = lp;
        vec4 mvPosition = modelViewMatrix * vec4(lp, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vLp; varying vec3 vN; varying float vSh; varying float vRk;
      uniform vec3 uSun; uniform vec3 uSunCol; uniform vec4 uStrutY; uniform float uShadeK; uniform float uRelief;
      uniform vec4 uPG; uniform vec3 uPGc;      // the portal's light on the fog under it: xz centre, radius, strength; colour
      ${FOG_GLSL}
      ${DOME_GLSL}
      #include <fog_pars_fragment>
      // a tower's shadow: both legs are solids 14 m deep along the bridge (tapering upward), so under a sun that stands across
      // the bridge they throw one long band 17 to 23 m wide to the lee side, soft at its edges and softer with distance
      float frbLeg(vec3 P, float xT, vec3 S, float zc) {
        float sz = abs(S.z) < 1e-3 ? 1e-3 : S.z;
        float s = (zc - P.z) / sz;
        vec3 Q = P + S * s;
        float soft = 1.6 + s * .009, hw = 7.2 - Q.y * .012;
        return (1. - smoothstep(hw - soft, hw + soft, abs(Q.x - xT))) * step(0., s) * (1. - smoothstep(224., 236., Q.y)) * (1. - smoothstep(900., 2100., s));
      }
      float frbTower(vec3 P, float xT, vec3 S) { return max(frbLeg(P, xT, S, 15.), frbLeg(P, xT, S, -15.)); }
      // the main cables' shadows: two long curves lying across the fog (a little wider than true, so they read)
      float frbCableY(float x) { float ax = abs(x), t = min(ax / 640., 1.), q = clamp((ax - 640.) / 345., 0., 1.); return ax <= 640. ? 71.5 + 154.5 * t * t : 226. - 159.4 * q - 48. * q * (1. - q); }
      float frbCable(vec3 P, vec3 S, float zc) {
        float sz = abs(S.z) < 1e-3 ? 1e-3 : S.z;
        float s = (zc - P.z) / sz; vec3 Q = P + S * s;
        float w = 1.0 + s * .006, d = abs(Q.y - frbCableY(Q.x));
        return step(0., s) * step(abs(Q.x), 985.) * (1. - smoothstep(w, w * 2.4 + .5, d)) * (1. - smoothstep(500., 1500., s));
      }
      // the curtains of suspenders: a ladder of faint stripes between the cable's shadow and the deck's (wider than true, so it reads)
      float frbHarp(vec3 P, vec3 S, float zc) {
        float sz = abs(S.z) < 1e-3 ? 1e-3 : S.z;
        float s = (zc - P.z) / sz; vec3 Q = P + S * s;
        float dk = 63. + 5. * (1. - Q.x * Q.x / 1822500.), st = abs(fract(Q.x / 15. + .5) - .5) * 15., w = .7 + s * .004;
        return step(0., s) * step(abs(Q.x), 985.) * step(dk, Q.y) * step(Q.y, frbCableY(Q.x)) * (1. - smoothstep(w, w * 2.6 + 1.2, st)) * (1. - smoothstep(300., 900., s));
      }
      void main() {
        vec3 toCam = uCam - vLp; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
        vec2 q = vLp.xz - uFlow * (uFg.w * uFg2.w * 1.2);
        float graze = max(abs(V.y), .06);
        float foot = dist * .35 / graze;
        // the heads fade to a smooth sea as their cells shrink under a pixel (they sparkled at grazing angles)
        vec3 hf = vec3(1. - smoothstep(10., 50., foot * .12), 1. - smoothstep(6., 26., foot * .008), 1. - smoothstep(6., 26., foot * .003));
        // the cells are looked up through a slow warp, so the creases between heads wander instead of running straight
        vec2 wq = q + (frbN(q * .011 + 4.4).rg - .5) * 46.;
        vec3 c1 = frbDome(wq / 66.), c2 = frbDome((wq + (frbN(q * .034 + 8.1).gb - .5) * 15.) / 24. + 31.7);
        float h1 = c1.x, h2 = c2.x;                                             // pillow profiles: 1 on the head, 0 in the gaps
        vec2 G = c1.yz * (hf.z * 2.2) + c2.yz * (hf.y * 1.6);                  // uphill slope: flat on the head, steeper at its rim (gentle: fog has no edges)
        float nearK = 1. - smoothstep(50., 260., dist);                         // close to the eye the small heads carry the picture
        float valK0 = (1. - smoothstep(.08, .7, clamp((vLp.y - uFg.z) / max(uFg.x - uFg.z, 1.), 0., 1.2))) * nearK;      // down in a valley beside the eye the small cells' slopes are gentler: vapour, not a creased skin
        #if FRB_FINE == 1
        vec3 c3 = frbDome((wq + (frbN(q * .09 + 2.7).br - .5) * 14.) / 8.5 + 11.3);
        float h3 = c3.x;
        G += c3.yz * (hf.x * (.9 + .7 * nearK) * (1. - .3 * valK0));
        #else
        float h3 = .7;
        #endif
        // fleece: within ~140 m of the eye a fourth, small scale of heads (3.6 m), so the sheet beside the eye is cotton
        float nearF = (1. - smoothstep(35., 140., dist)) * (1. - smoothstep(10., 50., foot * .3)), h4 = .7;
        #if FRB_FINE == 1
        if (nearF > .01) {
          vec3 c4 = frbDome((wq + (frbN(q * .23 + 7.7).rg - .5) * 3.6) / 3.6 + 53.1);
          h4 = c4.x; G += c4.yz * (1.2 * nearF * (1. - (.5 + .2 * uRelief) * valK0));
        }
        #endif
        float fine = frbN(q * .21 + 2.3).g;
        float swell = mix(.45, 1.15, smoothstep(500., 2400., dist));           // far off, where the heads have melted away, the long banks carry the form
        vec3 N = normalize(vec3(vN.x * swell - G.x, vN.y, vN.z * swell - G.y));      // the heads carry the shading; the long swells only a little (they made blotches)
        float hh = clamp((vLp.y - uFg.z) / max(uFg.x - uFg.z, 1.), 0., 1.2);
        float crest = (vLp.y - uFg.x) / max(uFg.y, 1.);                         // -1 troughs .. +1 crests of the big billows
        float cc = clamp(crest, -1., 1.);
        float head = mix(.7, h1, hf.z) * .56 + mix(.7, h2, hf.y) * .3 + mix(.7, h3, hf.x) * .14;   // 0 in the gaps between the heads .. 1 on their tops
        // a faster layer of wisps drawn out down the wind, sliding over the heads
        vec2 qw = vLp.xz - uFlow * (uFg.w * uFg2.w * 1.8);
        vec2 qs = vec2(dot(qw, vec2(-uFlow.y, uFlow.x)), dot(qw, uFlow));
        float wisp = frbN(qs * vec2(.06, .014) + 7.7).r * .6 + frbN(qs * vec2(.15, .035) + 1.3).g * .4;
        // fog is a scatterer: the terminator is wide and broken by the wisps, the shade is luminous, nothing has a ruled edge
        float ndl = dot(N, uSun);
        float topW = smoothstep(.3, .8, hh);
        float sunF = smoothstep(uSun.y - .66 + .3 * uRelief * topW, uSun.y + .6, ndl + (wisp - .5) * mix(.35, .18, smoothstep(250., 900., dist)));      // level fog stands half-way (lower under a low sun: uRelief)      // level fog stands half-way: what leans to the sun is bright, what leans away is in shade
        // creases: each scale of heads dims its own folds a little, so the sheet reads as billows even when the sun is behind the eye
        float midK = smoothstep(150., 400., dist) * (1. - smoothstep(900., 1600., dist));      // deeper folds in the middle distance only: relief under a raking sun, nothing ruled near or far
        float valK = (1. - smoothstep(.08, .7, hh)) * nearK;                    // down in a valley, close to the eye: the folds between the small heads are deep
        float crease = mix(1., mix(.73 - .08 * midK, 1., smoothstep(.06, .7, h1)), hf.z) * mix(1., mix(.81 - .06 * midK - .14 * valK, 1., smoothstep(.06, .7, h2)), hf.y) * mix(1., mix(.86 - .12 * nearK - .06 * valK, 1., smoothstep(0., .85, h3)), hf.x) * mix(1., mix(.8, 1.04, smoothstep(0., .8, h4)), nearF);
        float ao = crease * (.86 + .28 * mix(.5, fine * .4 + wisp * .6, hf.x));
        float hollow = mix(.42, 1., smoothstep(.08, .95, hh));                  // valleys and gaps: cooler, but their heads still reach the sun
        // relief on the open top under a low sun (uRelief, set by the world per look): the troughs of the big billows and the gaps
        // between the heads fall into shade, what leans away from the sun goes deeper
        float trough = (1. - smoothstep(-.75, .4, cc)) * topW;
        float lit = ao * mix(.36 - .14 * uRelief * topW, 1., sunF) * mix(.86, 1., smoothstep(-1., .35, cc)) * hollow * (1. - .34 * uRelief * trough);
        lit *= 1. - .3 * uRelief * topW * (1. - smoothstep(.15, .7, head));
        // down in a valley the tops of the heads stand in the sun and the folds between them fall into cool shade
        lit *= mix(1., mix(.34, 1.15, smoothstep(.2, .8, head)), 1. - smoothstep(.08, .7, hh));
        // close to the eye the sheet is cotton, not a smooth skin: three octaves of soft fluff
        float fluff = frbN(q * .047 + 6.1).r * .5 + frbN(q * .12 + 1.9).g * .32 + frbN(q * .31 + 4.3).b * .18;      // 20 m, 8 m and 3 m
        lit *= mix(1., mix(.44 + 1.12 * fluff, .56 + .88 * fluff, smoothstep(.3, .8, hh)), nearK);
        // the heads' shade on one another (soft, broken by the wisps)
        float selfSh = clamp(vSh * (.6 + .8 * fluff) + (wisp - .5) * .3 * step(.02, vSh), 0., 1.) * smoothstep(30., 150., dist);      // (per vertex of 5 m cells: close to the eye it would show them as facets)
        lit *= 1. - min(.66 * (.6 + .4 * uShadeK) + .2 * valK, .84) * selfSh;
        // thin veils of mist drawn out down the wind lie over the heads and hide their relief in streaks
        float veil = smoothstep(.36, .88, frbN(qs * vec2(.021, .0052) + 3.1).b * .65 + wisp * .35) * mix(.5, .38, smoothstep(250., 900., dist));
        lit = mix(lit, .7 * hollow, veil);
        // down in a valley, close to the eye: bright streaks of mist torn off the heads slide over them down the wind, faster than the heads
        vec2 qf = vLp.xz - uFlow * (uFg.w * uFg2.w * 2.6);
        vec2 qt = vec2(dot(qf, vec2(-uFlow.y, uFlow.x)), dot(qf, uFlow));
        float streak = smoothstep(.48, .74, frbN(qt * vec2(.105, .0105) + 5.9).r * .58 + frbN(qt * vec2(.26, .027) + 2.2).g * .42) * valK * (.4 + .6 * hf.x);
        lit = mix(lit, 1.1, streak * .9);
        // shadows: the deck strip and both towers, projected along the sun onto the fog
        float sy = max(uSun.y, .05);
        float sd = (64. - vLp.y) / sy; vec3 Qd = vLp + uSun * sd; float softd = 3. + sd * .1;      // (a wide penumbra: under a high moon the strip lies close under the deck and would be ruled)
        float sh = step(0., sd) * (1. - smoothstep(16. - softd, 16. + softd, abs(Qd.z))) * step(abs(Qd.x), 1350.) * (1. - smoothstep(60., 220., sd)) * .8;
        sh = max(sh, .96 * max(frbTower(vLp, 640., uSun), frbTower(vLp, -640., uSun)));
        sh = max(sh, .92 * max(frbCable(vLp, uSun, 15.), frbCable(vLp, uSun, -15.)));
        sh = max(sh, .34 * max(frbHarp(vLp, uSun, 15.), frbHarp(vLp, uSun, -15.)) * (1. - smoothstep(300., 750., dist)));      // (faint and soft: a hard ladder of stripes reads as facets on the fog)
        lit *= 1. - .8 * sh;
        // every darkening goes toward a pale, luminous cool shade (bluer in the hollows), never toward grey and never to a dark blot
        vec3 shadeC = mix(mix(uFogShade, uFogLit, .28 - .16 * uRelief * topW), uFogShade, (1. - hollow) * 1.3) * .9;
        // the tone map presses everything above ~0.45 into white, so from above what leans away from the sun goes a little
        // deeper (uShadeK, set by the world per look): still soft and luminous, but the billows get a lit and a shaded side
        float topK = uShadeK * smoothstep(.3, .8, hh);
        float tl = smoothstep(.3 * topK, 1.05, lit);
        // down in a valley, close to the eye, the folds between the small heads fall into a deeper cool shade: cauliflower, not a skin
        float fold = valK * (1. - smoothstep(.15, .7, mix(.7, h2, hf.y) * .42 + mix(.7, h3, hf.x) * .34 + mix(.7, h4, nearF) * .24)) * (1. - .85 * streak) * (1. - .45 * max(uRelief, 1. - uShadeK));      // (under a low sun the folds would read as a creased skin: there the floor is vapour)
        shadeC *= (1. - (.28 + .14 * uRelief) * topK * (1. - tl)) * (1. - .36 * fold) * (1. - .2 * selfSh * valK);
        vec3 col = mix(shadeC, uFogLit * (.86 - .07 * uRelief), tl * (1. - .5 * fold));
        // cotton: close to the eye the gaps between the small heads (8.5 m and 3.6 m) go down in value, most of all in a valley,
        // where the heads also shade one another; the tone map leaves no room for this between the lit and the shade colour
        float cot = mix(.7, h3, hf.x) * .5 + mix(.7, h4, nearF) * .5;
        col *= 1. - nearK * mix(.4, 1., 1. - smoothstep(.08, .7, hh)) * (.32 * (1. - .45 * max(uRelief, 1. - uShadeK)) * (1. - smoothstep(.12, .7, cot)) * (1. - .8 * streak) + .14 * selfSh);
        // a rift's wall is vapour pouring down toward the water: soft, streaked down its fall, cooler with depth, no creases
        float wallK = smoothstep(.04, .26, vRk);
        if (wallK > 0.) {
          vec3 Nw = normalize(vN);
          vec2 tw = vec2(-Nw.z, Nw.x); tw = tw / max(length(tw), 1e-3);
          float sC = dot(vLp.xz, tw), fall = uFg.w * .09;
          float pourN = frbN(vec2(sC * .012, vLp.y * .012 + fall)).r * .6 + frbN(vec2(sC * .03 + 3.3, vLp.y * .026 + fall * 1.7)).g * .4;
          float deep = smoothstep(-6., 62., vLp.y);
          float lw = smoothstep(-.7, .9, dot(Nw, uSun) * .45 + (pourN - .5) * .3);      // (the wall's own facets, 10 m cells on a steep fall, must not show: its light comes mostly from the pour)
          vec3 wc = mix(mix(uFogShade, uFogLit, .3) * mix(.74, .95, deep), uFogLit * mix(.74, .9, deep), lw * (.7 + .3 * pourN));      // light veils: over the dark water a dim veil reads as murk
          wc *= mix(.84, 1.07, fluff) * mix(.9, 1.05, smoothstep(.2, .8, frbN(vec2(sC * .06 + 7.1, vLp.y * .03 + fall * 2.3)).b));      // cotton and streaks: never one smooth pale ramp
          col = mix(col, wc, wallK * .92);
        }
        col = mix(col, mix(uFogShade, uFogLit, .14) * .76, sh * .76);                              // the long soft shadows of the towers and the deck carry the drama
        col += uFogLit * (.16 - .08 * uRelief) * (1. - sunF) * smoothstep(.3, .9, head) * (1. - sh);                // light bleeding through the thin tops
        col += uSunCol * .24 * smoothstep(uSun.y + .04, uSun.y + .5, ndl) * (1. - .5 * veil) * (1. - sh);   // a warm rim on whatever leans toward the sun
        float grz = max(1. - abs(dot(N, V)), 0.);
        float back = max(dot(-V, uSun), 0.); back *= back; back *= back;
        col += uSunCol * .45 * back * grz * clamp(head * 1.2 - .1, 0., 1.) * (1. - sh);           // back-lit rims on the heads
        // fuzz: a brow of fog seen edge-on pales into the mist behind it, so crests have no drawn outline; and down in a
        // valley of the river the far heads recede into a luminous haze, layer behind layer
        vec3 paleC = mix(uFogShade, uFogLit, .7 - .22 * uRelief) * .92;
        col = mix(col, paleC, grz * grz * sqrt(grz) * (.5 - .12 * uRelief) * (1. - .6 * sh) * mix(.4, 1., smoothstep(.08, .7, hh)));
        col = mix(col, mix(uFogShade, uFogLit, .36) * .9, (1. - smoothstep(.1, .85, hh)) * (1. - exp(-max(dist - 60., 0.) / 300.)) * .5);      // a cooler haze than the top's, and later: the floor keeps a value step under its lit heads
        // far off the sheet melts into the horizon haze, and its rim fades out, so there is no ruled line
        #ifdef USE_FOG
        col = mix(col, fogColor, .8 * smoothstep(2000., 5600., dist));
        col = mix(col, fogColor, .5 * smoothstep(.9, 1., 1. - abs(dot(normalize(vN), V))) * smoothstep(150., 600., dist));   // the brow of a bank seen edge-on pales: softer skylines
        #endif
        { vec2 pg = (vLp.xz - uPG.xy) / max(uPG.z, 1.); col += uPGc * (uPG.w * exp(-dot(pg, pg)) * (.4 + .6 * head)); }      // the portal's light lies on the fog under it
        float rimA = 1. - smoothstep(5000., 5950., max(abs(vLp.x) * .97, abs(vLp.z)));
        // seen from inside the fog (the camera below the local fog top) the sheet's far valleys drown like everything else
        float cin = clamp((uCamH - uCam.y + 4.) / 10., 0., 1.);
        col = mix(col, frbFogColor(), cin * (1. - exp(-uFg2.z * dist)));
        // from inside the fog the sheet is not part of the view at all (the world's own gradient stands in): any slope of it
        // that faces a camera below it would otherwise show as a flat patch. It comes in over the last metres of the climb.
        float alpha = smoothstep(2., 16., dist) * rimA * (1. - smoothstep(.5, .98, cin));
        // a rift: the wall thins out toward the water in torn wisps, and the water shows under it
        // (its lower two thirds are veils: the dark water shows through them more and more toward the hole)
        float veilN = frbN(q * .017 + 5.7).r * .55 + wisp * .45;
        alpha *= 1. - smoothstep(.02, .22, vRk) * (1. - smoothstep(8., 70., vLp.y + (veilN - .5) * 54.));
        // ... and its lip is torn into veils drawn out down the wind: no ruled rim, the water shows between the streaks
        float tearN = frbN(qs * vec2(.052, .012) + 9.3).g * .6 + frbN(qs * vec2(.13, .03) + 4.1).r * .4;
        alpha *= 1. - smoothstep(.0, .1, vRk) * (1. - smoothstep(.5, .85, vRk)) * smoothstep(.36, .7, tearN * .7 + wisp * .3) * .88;
        if (alpha < .004) discard;
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
}

// thin-ribbon accumulator (two triangles per segment, expanded toward the eye in the vertex shader)
class Ribbons {
  constructor() { this.P = []; this.T = []; this.W = []; this.C = []; this.I = []; }
  seg(a, b, w, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.hypot(dx, dy, dz) || 1, i = this.P.length / 3;
    for (const p of [a, a, b, b]) { this.P.push(p[0], p[1], p[2]); this.T.push(dx / l, dy / l, dz / l); this.C.push(col[0], col[1], col[2]); }
    this.W.push(-1, w, 1, w, -1, w, 1, w); this.I.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(this.T, 3));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.W, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setIndex(this.I); g.computeBoundingSphere();
    return g;
  }
}

// (a function expression in parentheses: the browser compiles it while it loads the file, not at the first call in build())
export const buildHero = (async function buildHero(ctx, opts = {}) {
  const R = ctx.rng.fork('fog-river-bridge');
  const Rg = R.fork('geo'), Rf = R.fork('fog'), Rt = R.fork('traffic'), Rs = R.fork('ship'), Rl = R.fork('look');
  const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : ['#cb552d', '#f6f1e8', '#8da2c6', '#b3ada0', '#1c2530', '#ffb24a', '#ff3b28'];
  const hourIn = opts.hour ?? vary.hour ?? 'day', hour = ({ dawn: 1, day: 1, golden: 1, night: 1 })[hourIn] ? hourIn : 'day';
  const HOUR = { dawn: [1.0, 1.0, 0.1], day: [0.5, 0.55, 0.0], golden: [0.85, 0.85, 0.07], night: [1.5, 1.4, 0.5] }[hour];
  const density = clamp((vary.density ?? 1), 0.6, 1.4);

  // ----- per-seed look -----
  const paint = new THREE.Color(pal[0]); paint.offsetHSL(Rl.range(-0.012, 0.014), Rl.range(-0.04, 0.05) - 0.07, Rl.range(-0.03, 0.03) - 0.012);
  const PAINT = [paint.r, paint.g, paint.b], PAINT_D = mul(PAINT, 0.8);
  const CONC = lin(pal[3]), DARK = lin(pal[4]), AMBER = lin(pal[5]), BEACON = lin(pal[6]);
  const style = Rl.int(0, 1);                       // 0: four portal struts, stepped pyramid finials; 1: three taller portals, flat caps with masts
  const setback = Rl.range(0.07, 0.1), flute = Rl.range(1.5, 2.1);
  const wet = opts.wet ?? Rl.range(0.2, 0.6), frost = opts.season === 'winter' ? 0.7 : 0;
  const fogTop = opts.fogTop ?? Rf.range(78, 88), fogAmp = opts.fogAmp ?? Rf.range(9, 13), fogFloor = Rf.range(35, 41);
  const flowA = Rf.range(-0.4, 0.4), FLOW = [Math.sin(flowA), -Math.cos(flowA)];      // mostly toward -Z
  const gapX = Rf.range(-70, -10), gapZ = Rf.range(-30, 60), gapR = Rf.range(280, 320);
  const cradleX = -XA + 7.5 * Math.round((Rl.range(40, 100) * 0.4 - 28 + XA) / 7.5) - 1.2, shipX = gapX - Rl.range(95, 125);      // the second painter stands at a truss vertical
  const sunIn = opts.sunDir || [-0.6, 0.7, 0.4], SUN = new THREE.Vector3(sunIn[0], sunIn[1], sunIn[2]).normalize();
  await ctx.yield();

  // ----- the fog field: one 64x64 noise texture read by every shader and by fog.heightAt() -----
  const fnData = new Uint8Array(64 * 64 * 4);
  for (let i = 0; i < fnData.length; i++) fnData[i] = Math.floor(Rf() * 256);
  const fnTex = new THREE.DataTexture(fnData, 64, 64, THREE.RGBAFormat);
  fnTex.wrapS = fnTex.wrapT = THREE.RepeatWrapping; fnTex.magFilter = fnTex.minFilter = THREE.LinearFilter; fnTex.generateMipmaps = false; fnTex.needsUpdate = true;
  await ctx.yield();
  const strutLv = style === 0 ? [[104, 116], [150, 158], [189, 196], [219, 226]] : [[112, 126], [170, 180], [217, 226], [217, 226]];
  const U = {
    uFN: { value: fnTex }, uFg: { value: new THREE.Vector4(fogTop, fogAmp, fogFloor, 0) },
    uFg2: { value: new THREE.Vector4(Rf.range(0.62, 0.7), opts.ships === 0 ? 0 : 1, 0.03, Rf.range(6, 9)) },
    uGap: { value: new THREE.Vector4(gapX, gapZ, gapR, 1) }, uGap2: { value: new THREE.Vector4(-XT + 50, 10, 190, 0) }, uShip: { value: new THREE.Vector4(shipX, 9999, 0, -1) },
    uFlow: { value: new THREE.Vector2(FLOW[0], FLOW[1]) }, uShipDip: { value: 46.5 },
    uFogLit: { value: new THREE.Color(pal[1]).multiplyScalar(0.94) }, uFogShade: { value: new THREE.Color(pal[2]).lerp(new THREE.Color('#ffffff'), 0.2).multiplyScalar(0.8) },
    uCam: { value: new THREE.Vector3(0, 300, 800) }, uCamH: { value: fogTop }, uInv: { value: new THREE.Matrix4() },
    uPerp: { value: new THREE.Vector3(-FLOW[1], 0, FLOW[0]) }, uPx: { value: 0.0011 },
    uLook: { value: new THREE.Vector4(wet, frost, flute, 0.22) }, uLamps: { value: new THREE.Vector4(HOUR[0], HOUR[1], HOUR[2], 1) },
    uPrimer: { value: new THREE.Color('#b0503f') }, uWarm: { value: new THREE.Color('#ffc078').multiplyScalar(2.6) },
    uSun: { value: SUN.clone() }, uSunCol: { value: new THREE.Color('#fff0d8') }, uSkyCol: { value: new THREE.Color('#9db8e6') },
    uStrutY: { value: new THREE.Vector4(...strutLv.map((s) => (s[0] + s[1]) / 2)) }, uShadeK: { value: 0 }, uRelief: { value: 0 },
    uStrutLo: { value: new THREE.Vector4(...strutLv.map((s) => s[0] - 0.8)) }, uStrutHi: { value: new THREE.Vector4(...strutLv.map((s) => s[1] + 1)) },
    uRift: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(1e5, 1e5, 1, 1)) }, uRiftK: { value: 0 }, uInK: { value: 1 },
    uPG: { value: new THREE.Vector4(-XT, 0, 150, 0) }, uPGc: { value: new THREE.Color('#ffe0b0') },
  };
  const fn = (px, py, ch) => {
    const ix = Math.floor(px), iy = Math.floor(py); let fx = px - ix, fy = py - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const x0 = ix & 63, x1 = (ix + 1) & 63, y0 = (iy & 63) * 64, y1 = ((iy + 1) & 63) * 64;
    const a = fnData[(y0 + x0) * 4 + ch], b = fnData[(y0 + x1) * 4 + ch], c = fnData[(y1 + x0) * 4 + ch], d = fnData[(y1 + x1) * 4 + ch];
    return (a + (b - a) * fx + (c + (d - c) * fx - a - (b - a) * fx) * fy) / 255;
  };
  const ss = (a, b, x) => smoothstep(a, b, x);
  let shipKLast = 0;                      // mirrors frbShipK: set by the last fogHeightAt()
  function riftK(x, z, qx, qz) {          // mirrors frbRift() in FOG_GLSL (qx, qz: the advected point)
    const k = U.uRiftK.value, RR = U.uRift.value; if (k <= 0) return 0;
    let near = false;
    for (let i = 0; i < 4; i++) { const R = RR[i]; if (Math.abs(x - R.x) < R.z * 1.52 && Math.abs(z - R.y) < R.w * 1.52) { near = true; break; } }
    if (!near) return 0;
    const wx = fn(qx * 0.0052 + 2.9, qz * 0.0052 + 2.9, 0) - 0.5, wz = fn(qx * 0.0052 + 2.9, qz * 0.0052 + 2.9, 1) - 0.5, w2 = (fn(qx * 0.019 + 6.1, qz * 0.019 + 6.1, 2) - 0.5) * 0.34 + (fn(qx * 0.033 + 1.7, qz * 0.033 + 1.7, 0) - 0.5) * 0.12;
    let r = 0;
    for (let i = 0; i < 4; i++) {
      const R = RR[i], dx = (x - R.x) / Math.max(R.z, 1) + wx * 0.42, dz = (z - R.y) / Math.max(R.w, 1) + wz * 0.42, l = Math.hypot(dx, dz) + w2;
      if (l < 1.04) r = Math.max(r, 1 - ss(0.38, 1.04, l));
    }
    return r * k;
  }
  function fogRiftAt(x, z) { const adv = U.uFg.value.w * U.uFg2.value.w; return riftK(x, z, x - FLOW[0] * adv, z - FLOW[1] * adv); }
  function fogHeightAt(x, z) {            // mirrors frbH() in FOG_GLSL
    const g4 = U.uFg.value, g2 = U.uFg2.value, gp = U.uGap.value, sp = U.uShip.value, adv = g4.w * g2.w;
    const qx = x - FLOW[0] * adv, qz = z - FLOW[1] * adv;
    const ax = qx * -FLOW[1] + qz * FLOW[0], az = (qx * FLOW[0] + qz * FLOW[1]) * 0.6;
    const rr = Math.max(Math.abs(x) * 0.55, Math.abs(z)), f3 = 1 - ss(600, 1400, rr);
    const far = 1 + 1.1 * ss(1300, 3000, rr) + 1.3 * ss(3000, 5600, rr);
    const n = fn(ax * 0.0033, az * 0.0033, 0) * 0.5 + fn(ax * 0.0085 + 3.7, az * 0.0085 + 3.7, 1) * 0.32 + (fn(ax * 0.021 + 9.1, az * 0.021 + 9.1, 2) - 0.5) * 0.18 * f3 + 0.09;
    const g = fn(qx * 0.00105 + 11.3, qz * 0.00105 + 11.3, 2);
    const dx = (x - gp.x) / gp.z, dz = (z - gp.y) / (gp.z * 1.7);
    const gq = U.uGap2.value, ex = (x - gq.x) / gq.z, ez = (z - gq.y) / (gq.z * 1.7);
    const v = Math.max(ss(g2.x, g2.x + 0.16, g), gp.w * (1 - ss(0.45, 1, Math.hypot(dx, dz))), gq.w * (1 - ss(0.45, 1, Math.hypot(ex, ez))));
    const b = (n * 2 - 1) * far;
    let h = lerp(g4.x + g4.y * b, g4.z + g4.y * 0.5 * b, v);
    h += (fn(ax * 0.0125 + 5.3, az * 0.0125 + 5.3, 1) - 0.5) * 15 * (1 - 0.5 * v) * (1 - ss(900, 1900, rr));
    const rx = x - sp.x, rz = z - sp.y, along = -(rx * sp.z + rz * sp.w), lat = rx * -sp.w + rz * sp.z;
    const beh = Math.max(along, 0), w = 7 + beh * 0.16;
    const fade = Math.exp(-beh / 320) * ss(-30, 8, along) * (1 - ss(46, 64, h)) * g2.y;
    const rim = (Math.abs(lat) - w * 1.9) / (w * 0.8);
    h += (-Math.exp(-lat * lat / (w * w)) + 0.55 * Math.exp(-rim * rim)) * fade * 5;
    { const hx2 = rx + sp.z * 12, hz2 = rz + sp.w * 12, sk = g2.y * Math.min(1.4 * Math.exp(-(hx2 * hx2 + hz2 * hz2) / (62 * 62)), 1) * (1 - ss(54, 70, h)); h += (U.uShipDip.value + (n - 0.5) * 5 - h) * sk; shipKLast = sk; }
    { const fa = (rx * sp.z + rz * sp.w - 100) / 125, fl = (rx * -sp.w + rz * sp.z) / 44, sk = g2.y * Math.min(1.5 * Math.exp(-(fa * fa + fl * fl)), 1) * (1 - ss(54, 70, h)); h += (Math.max(h, U.uShipDip.value - 2.5 + 4 * ss(33, 37, U.uShipDip.value) + (n - 0.5) * 4) - h) * sk; if (sk > shipKLast) shipKLast = sk; }
    { const rk = riftK(x, z, qx, qz); if (rk > 0) h += (-12 - h) * rk; }
    return h;
  }
  // mirrors frbDome().x and frbLift() in DOME_GLSL: the real height of the heads near the bridge
  const domeH = (px, py) => {
    const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy; let ws = 0, hs = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const o = ((((iy + j) & 63) * 64) + ((ix + i) & 63)) * 4;
      const rx = i + fnData[o] / 255 * 0.8 + 0.1 - fx, ry = j + fnData[o + 2] / 255 * 0.8 + 0.1 - fy, d = rx * rx + ry * ry, w = Math.exp(-d * 7.5);
      ws += w; hs += w * (1 - d * 2.3);
    }
    return Math.max(hs / Math.max(ws, 1e-5), 0);
  };
  function fogLiftAt(x, z) {
    const k = 1 - ss(520, 1100, Math.max(Math.abs(x) * 0.55, Math.abs(z))); if (k <= 0) return 0;
    const adv = U.uFg.value.w * U.uFg2.value.w * 1.2, qx = x - FLOW[0] * adv, qz = z - FLOW[1] * adv;
    const ax = qx * 0.011 + 4.4, az = qz * 0.011 + 4.4, bx = qx * 0.034 + 8.1, bz = qz * 0.034 + 8.1;
    const wx = qx + (fn(ax, az, 0) - 0.5) * 46, wz = qz + (fn(ax, az, 1) - 0.5) * 46;
    const h1 = domeH(wx / 66, wz / 66), h2 = domeH((wx + (fn(bx, bz, 1) - 0.5) * 15) / 24 + 31.7, (wz + (fn(bx, bz, 2) - 0.5) * 15) / 24 + 31.7);
    return ((h1 - 0.55) * 11 + (h2 - 0.55) * 7) * k;
  }
  await ctx.yield();
  const steel = makeSteel(U, 0);
  await ctx.yield();
  const carMat = makeSteel(U, 1);
  await ctx.yield();
  const flagMat = makeSteel(U, 2, { side: THREE.DoubleSide, roughness: 0.8, metalness: 0 });
  await ctx.yield();
  const ribbonMat = makeRibbonMat(U), glowMat = makeGlowMat(U);
  await ctx.yield();
  const root = new THREE.Group(); root.name = 'fog-river-bridge';
  const zone = [new Geo(Rg, 72000), new Geo(Rg, 48000), new Geo(Rg, 72000)];      // -X end, main span middle, +X end (for culling); sized so that none has to grow (about 66k, 43k and 66k vertices)
  const Z = (x) => zone[x < -330 ? 0 : x > 330 ? 2 : 1];
  const ribbons = new Ribbons();
  const glows = { P: [], O: [], G: [], C: [], K: [], I: [] };
  const addGlow = (x, y, z, size, col, rate = 0, phase = 0, type = 0, car = [0, 0]) => {
    const i = glows.P.length / 3;
    for (const o of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { glows.P.push(x, y, z); glows.O.push(o[0], o[1]); glows.G.push(size, rate, phase, type); glows.C.push(col[0], col[1], col[2]); glows.K.push(car[0], car[1]); }
    glows.I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  await ctx.yield();

  // ----- towers: stepped legs with twice-notched corners, fluted panels with ziggurat heads, corbelled portal struts -----
  const TL = style === 0 ? [6, 60, 116, 158, 196, SAD] : [6, 60, 126, 180, SAD], nT = TL.length - 1;
  const legA = (i) => 7 * (1 - setback * i), legB = (i) => 4.8 * (1 - setback * i);
  const tierOf = (y) => { let i = 0; while (i < nT - 1 && y >= TL[i + 1]) i++; return i; };
  const anchors = { towerTops: [], flagTips: [], saddles: [], pylonTops: [] };
  function strut(G, xT, y0, y1, deco) {
    const i = tierOf(y0 + 0.1), a = legA(i), zi = ZC - legB(i) + 0.4, h = y1 - y0;
    G.box(xT, (y0 + y1) / 2, 0, a * 1.24, h, zi * 2, PAINT, 1, 0, 3 + 4 + 8);
    G.box(xT, y1 + 0.5, 0, a * 1.44, 1.0, zi * 2, PAINT, 0, 0, 15);
    G.box(xT, y0 - 0.4, 0, a * 1.36, 0.8, zi * 2, PAINT, 0, 0, 11);
    if (!deco) return;
    for (let j = 0; j < 3; j++) for (const s of [-1, 1]) {
      const len = zi * (0.44 - 0.125 * j);
      G.box(xT, y0 - 0.8 - 2.4 * (j + 0.5), s * (zi - len / 2), a * 1.2, 2.4, len, PAINT, 0, 0, 3 + 8 + (s > 0 ? 32 : 16));
    }
    G.box(xT, (y0 + y1) / 2, 0, a * 1.24 + 0.7, h * 0.66, zi * 0.52, PAINT, 0, 0, 63);
    G.box(xT, (y0 + y1) / 2, 0, a * 1.24 + 1.3, h * 0.4, zi * 0.27, PAINT, 6, 0, 63);
    for (const s of [-1, 1]) G.box(xT, (y0 + y1) / 2, s * zi * 0.62, a * 1.24 + 0.5, h * 0.8, 0.9, PAINT, 6, 0, 63);
  }
  async function buildTower(xT) {
    const G = Z(xT), dY = deckY(xT);
    for (const sz of [-1, 1]) {
      const cz = sz * ZC;
      for (let i = 0; i < nT; i++) {
        const a = legA(i), b = legB(i), s = 0.6 * (1 - setback * i), pr = decoProfile(a, b, s);
        G.tier(pr, pr, xT, cz, TL[i], TL[i + 1], PAINT, 0, true);
        if (i < nT - 1) {
          const a2 = legA(i + 1), b2 = legB(i + 1);
          const p1 = decoProfile(lerp(a, a2, 0.35), lerp(b, b2, 0.35), s), p2 = decoProfile(lerp(a, a2, 0.7), lerp(b, b2, 0.7), s);
          G.tier(p1, p1, xT, cz, TL[i + 1], TL[i + 1] + 1.8, PAINT, 0, true);
          G.tier(p2, p2, xT, cz, TL[i + 1] + 1.8, TL[i + 1] + 3.8, PAINT, 0, true);
        }
        for (const yb of [TL[i + 1] - 1.1, TL[i + 1] - 2.6]) { const pb = decoProfile(a + 0.3, b + 0.3, s); G.tier(pb, pb, xT, cz, yb, yb + 0.6, PAINT, 6, true); }
        const y0 = TL[i] + (i === 0 ? 3 : 6), y1 = TL[i + 1] - 7, hy = y1 - y0, wz = 2 * (b - 2 * s) * 0.74, wx = 2 * (a - 2 * s) * 0.74;
        for (const d of [-1, 1]) {
          const px = xT + d * (a + 0.05), fm = 60 + (d > 0 ? 1 : 2);
          G.box(px, (y0 + y1) / 2, cz, 0.6, hy, wz, PAINT, 1, 0, fm);
          G.box(px, y1 + 1.1, cz, 0.6, 2.2, wz * 0.66, PAINT, 1, 0, fm);
          G.box(px, y1 + 3.0, cz, 0.6, 1.6, wz * 0.34, PAINT, 1, 0, fm);
          const pz = cz + d * (b + 0.05), fz = 15 + (d > 0 ? 16 : 32);
          G.box(xT, (y0 + y1) / 2, pz, wx, hy, 0.6, PAINT, 1, 0, fz);
          G.box(xT, y1 + 1.1, pz, wx * 0.66, 2.2, 0.6, PAINT, 1, 0, fz);
          G.box(xT, y1 + 3.0, pz, wx * 0.34, 1.6, 0.6, PAINT, 1, 0, fz);
        }
        await ctx.yield();
      }
      // finial, saddle housing and beacon
      const a = legA(nT - 1), b = legB(nT - 1);
      G.box(xT, SAD - 0.6, cz, 2 * a + 3.4, 2.2, 2.8, PAINT_D, 6);
      G.box(xT, SAD + 0.6, cz, 2 * a + 0.9, 1.2, 2 * b + 0.9, PAINT, 0);
      let topY;
      if (style === 0) {
        G.box(xT, SAD + 2.2, cz, 2 * a * 0.74, 2.0, 2 * b * 0.74, PAINT, 1);
        G.box(xT, SAD + 4.0, cz, 2 * a * 0.48, 1.6, 2 * b * 0.48, PAINT, 0);
        topY = SAD + 10.2; G.beam([xT, SAD + 4.8, cz], [xT, topY, cz], 0.4, 0.4, DARK, 6);
      } else {
        G.box(xT, SAD + 2.0, cz, 2 * a * 0.6, 1.6, 2 * b * 0.6, PAINT, 1);
        topY = SAD + 13.5; G.beam([xT, SAD + 2.8, cz], [xT, topY, cz], 0.45, 0.45, DARK, 6);
        G.beam([xT - 1.6, SAD + 8, cz], [xT + 1.6, SAD + 8, cz], 0.22, 0.22, DARK, 6, true);
        G.beam([xT, SAD + 10.5, cz - 1.1], [xT, SAD + 10.5, cz + 1.1], 0.22, 0.22, DARK, 6, true);
      }
      G.box(xT, topY + 0.35, cz, 1.0, 0.8, 1.0, BEACON, 5, 7);
      addGlow(xT, topY + 0.35, cz, 6.5, mul(BEACON, 4.5), 0.4, (xT > 0 ? 0 : 3.1) + (sz > 0 ? 0 : 0.6), 1);
      anchors.towerTops.push(new THREE.Vector3(xT, topY + 0.35, cz)); anchors.saddles.push(new THREE.Vector3(xT, SAD, cz));
      // walkway collar where the sidewalk rounds the leg
      G.box(xT, dY - 0.3, cz + sz * 1.6, 2 * legA(1) + 6, 1.2, 2 * legB(1) + 6.5, PAINT_D, 0);
      await ctx.yield();
    }
    for (const lv of strutLv) { strut(G, xT, lv[0], lv[1], true); await ctx.yield(); }
    strut(G, xT, 49, 57, false);
    const zi = ZC - legB(0) + 0.4;
    for (const [ya, yb] of [[10, 29], [29, 48]]) {
      G.beam([xT, ya, -zi], [xT, yb, zi], 2.6, 1.8, PAINT, 0); G.beam([xT, ya, zi], [xT, yb, -zi], 2.6, 1.8, PAINT, 0);
      G.box(xT, yb, 0, 3.0, 1.6, zi * 2, PAINT, 0, 0, 15);
    }
    // pier and fender
    const pr1 = decoProfile(13, 27, 2.5), pr2 = decoProfile(17, 31, 3);
    G.tier(pr2, pr2, xT, 0, -3, 2.5, CONC, 4, true); G.tier(pr1, pr1, xT, 0, 2.5, 6.4, CONC, 4, true);
  }
  await buildTower(XT); await ctx.yield();
  await buildTower(-XT); await ctx.yield();

  // ----- deck: stiffening truss, floor beams, laterals, sway frames, stringers, road slab, railings -----
  const roadC = [0.075, 0.08, 0.088], walkC = mul(mix3(CONC, PAINT, 0.3), 0.72), railC = PAINT;
  let panel = 0;
  for (let x0 = -XA; x0 < XA - 0.01; x0 += 7.5, panel++) {
    const x1 = x0 + 7.5, G = Z((x0 + x1) / 2), y0 = deckY(x0), y1 = deckY(x1), yt = 0.9, yb = TRUSS;
    for (const z of [-ZC, ZC]) {
      G.beam([x0, y0 - yt, z], [x1, y1 - yt, z], 1.1, 1.1, PAINT, 0);
      G.beam([x0, y0 - yb, z], [x1, y1 - yb, z], 1.1, 1.1, PAINT, 0);
      G.beam([x0, y0 - yb, z], [x0, y0 - yt, z], 0.7, 0.7, PAINT, 6);
      if (panel % 2 === 0) G.beam([x0, y0 - yb, z], [x1, y1 - yt, z], 0.6, 0.6, PAINT, 6); else G.beam([x0, y0 - yt, z], [x1, y1 - yb, z], 0.6, 0.6, PAINT, 6);
    }
    G.beam([x0, y0 - 1.35, -ZC], [x0, y0 - 1.35, ZC], 0.5, 1.5, PAINT_D, 0);
    G.beam([x0, y0 - yb, -ZC], [x0, y0 - yb, ZC], 0.5, 0.6, PAINT_D, 6);
    if (panel % 2 === 0) G.beam([x0, y0 - yb, -ZC], [x1, y1 - yb, ZC], 0.45, 0.45, PAINT_D, 6); else G.beam([x0, y0 - yb, ZC], [x1, y1 - yb, -ZC], 0.45, 0.45, PAINT_D, 6);
    if (panel % 2 === 0) { G.beam([x0, y0 - yb, -ZC], [x0, y0 - 2, 0], 0.4, 0.4, PAINT_D, 6); G.beam([x0, y0 - yb, ZC], [x0, y0 - 2, 0], 0.4, 0.4, PAINT_D, 6); }
    for (const z of [-7.5, 0, 7.5]) G.beam([x0, y0 - 1.15, z], [x1, y1 - 1.15, z], 0.35, 0.9, PAINT_D, 6);
    if (panel % 3 === 2) await ctx.yield();
  }
  await ctx.yield();
  // slab, sidewalks, fascia, railings: one swept cross-section every 15 m over the whole 2.7 km
  for (let x0 = -XE; x0 < XE - 0.01; x0 += 15) {
    const x1 = x0 + 15, G = Z((x0 + x1) / 2), a = deckY(x0), b = deckY(x1);
    const q = (z0, h0, z1, h1, col, kind, hint, glow = 0) => G.quad([x0, a + h0, z0], [x1, b + h0, z0], [x1, b + h1, z1], [x0, a + h1, z1], col, kind, glow, hint);
    q(-10.6, 0, 10.6, 0, roadC, 2, [0, 1, 0]);
    q(-14.7, -0.95, 14.7, -0.95, PAINT_D, 6, [0, -1, 0]);
    for (const s of [-1, 1]) {
      q(s * 10.6, 0, s * 10.6, 0.32, walkC, 4, [-s, 0, 0]);
      q(s * 10.6, 0.32, s * 14.7, 0.32, walkC, 4, [0, 1, 0]);
      q(s * 14.7, 0.32, s * 14.7, -0.95, PAINT, 0, [0, 0, s]);
      q(s * 14.55, 0.32, s * 14.55, 1.65, railC, 3, [0, 0, s], [0, 0, 1, 1]);
      q(s * 14.55, 0.32, s * 14.55, 1.65, railC, 3, [0, 0, -s], [0, 0, 1, 1]);
      q(s * 10.75, 0.32, s * 10.75, 1.1, PAINT, 6, [-s, 0, 0]); q(s * 11.0, 0.32, s * 11.0, 1.1, PAINT, 6, [s, 0, 0]);
      q(s * 10.75, 1.1, s * 11.0, 1.1, PAINT, 6, [0, 1, 0]);
    }
    if (Math.abs(x0 % 150) < 15) await ctx.yield();
  }
  await ctx.yield();

  // ----- main cables (round tubes, banded every suspender), suspenders and hand ropes (ribbons) -----
  const stations = [{ x: -XA - 30, hang: false }];
  for (let j = 0; j <= 23; j++) stations.push({ x: -XA + j * 15, hang: j > 0 && j < 23 });
  for (let j = 1; j <= 84; j++) stations.push({ x: -XT + j * (2 * XT / 85), hang: true });
  for (let j = 0; j <= 23; j++) stations.push({ x: XT + j * 15, hang: j > 0 && j < 23 });
  stations.push({ x: XA + 30, hang: false });
  const SIDES = 8, ropeC = mul(PAINT, 0.92), hangC = mul(PAINT, 0.8), cableR = 0.55;
  for (const cz of [-ZC, ZC]) {
    let prev = null;
    for (let i = 0; i < stations.length; i++) {
      const x = stations[i].x, y = cableY(x);
      const xa = stations[Math.max(i - 1, 0)].x, xb = stations[Math.min(i + 1, stations.length - 1)].x;
      let tx = xb - xa, ty = cableY(xb) - cableY(xa); const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      if (Math.abs(Math.abs(x) - XT) < 0.01) { tx = 1; ty = 0; }
      const ring = [];
      for (let k = 0; k <= SIDES; k++) { const th = (k / SIDES) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th); ring.push([-ty * c, tx * c, s]); }
      const cur = { x, y, ring, u: i * 15 };
      if (prev) {
        const G = Z((prev.x + x) / 2);
        if (G.n + SIDES * 6 > G.cap) G.grow();
        for (let k = 0; k < SIDES; k++) {
          const vs = [[prev, k], [prev, k + 1], [cur, k + 1], [prev, k], [cur, k + 1], [cur, k]];
          for (const [st, kk] of vs) {
            const nrm = st.ring[kk], o = G.n * 3, o2 = G.n * 2, tone = 0.94 + 0.06 * ((k * 5) % 3);
            G.P[o] = st.x + nrm[0] * cableR; G.P[o + 1] = st.y + nrm[1] * cableR; G.P[o + 2] = cz + nrm[2] * cableR;
            G.N[o] = nrm[0]; G.N[o + 1] = nrm[1]; G.N[o + 2] = nrm[2];
            G.C[o] = PAINT[0] * tone; G.C[o + 1] = PAINT[1] * tone; G.C[o + 2] = PAINT[2] * tone;
            G.U[o2] = st.u; G.U[o2 + 1] = kk; G.S[o2] = 6; G.S[o2 + 1] = cableR;
            G.n++;
          }
        }
        // hand ropes above the cable
        for (const dz of [-0.5, 0.5]) ribbons.seg([prev.x, prev.y + 1.3, cz + dz], [x, y + 1.3, cz + dz], 0.05, ropeC);
      }
      for (const dz of [-0.5, 0.5]) ribbons.seg([x, y + 0.45, cz + dz], [x, y + 1.3, cz + dz], 0.06, ropeC);
      if (stations[i].hang) {
        const yd = deckY(x) - 0.4;
        if (y - 0.5 - yd > 0.6) ribbons.seg([x, y - 0.45, cz], [x, yd, cz], 0.3, hangC);
      }
      prev = cur;
      if (i % 9 === 8) await ctx.yield();
    }
    await ctx.yield();
  }

  // ----- anchorages with Deco pylons, approach viaducts, abutments -----
  for (const sx of [-1, 1]) {
    const xA = sx * XA, G = Z(xA), D = deckY(xA);
    const blk = decoProfile(31, 25, 3);
    G.tier(blk, blk, xA + sx * 4, 0, -3, D - 1.2, CONC, 4, true);
    for (const sz of [-1, 1]) {
      const cz = sz * 20.6, steps = [[5.2, 4.6, D - 1.2, D + 16], [4.3, 3.8, D + 16, D + 26], [3.3, 2.9, D + 26, D + 33], [2.2, 1.9, D + 33, D + 36]];
      for (const [a, b, ya, yb] of steps) {
        const pr = decoProfile(a, b, 0.42);
        G.tier(pr, pr, xA, cz, ya, yb, CONC, 4, true);
        if (yb - ya > 5) for (const d of [-1, 1]) for (const r of [-1, 0, 1]) G.box(xA + d * (a + 0.1), (ya + yb) / 2 - 0.6, cz + r * b * 0.42, 0.5, yb - ya - 2.6, b * 0.2, CONC, 4, 0, 60 + (d > 0 ? 1 : 2));
      }
      G.box(xA, D + 36.5, cz, 1.3, 1.0, 1.3, AMBER, 5, 4);
      addGlow(xA, D + 36.5, cz, 4.5, mul(AMBER, 1.8), 0, 0, 0);
      anchors.pylonTops.push(new THREE.Vector3(xA, D + 37, cz));
      await ctx.yield();
    }
    for (let x = XA; x < XE - 0.01; x += 30) {
      const x0 = sx * x, x1 = sx * (x + 30);
      for (const z of [-11.5, 11.5]) G.beam([x0, deckY(x0) - 2.7, z], [x1, deckY(x1) - 2.7, z], 0.9, 3.4, PAINT, 0);
    }
    for (let k = 1; k <= 5; k++) {
      const x = sx * (XA + 31 + k * 60), Dk = deckY(x), pr = decoProfile(2.6, 12.6, 0.8), cap = decoProfile(3.4, 14.4, 0.8);
      G.tier(pr, pr, x, 0, -3, Dk - 6.2, CONC, 4, false); G.tier(cap, cap, x, 0, Dk - 6.2, Dk - 4.4, CONC, 4, true);
    }
    await ctx.yield();
    G.box(sx * (XE + 9), deckY(XE) / 2 - 2, 0, 18, deckY(XE) + 2, 44, CONC, 4);
    await ctx.yield();
  }
  await ctx.yield();

  // ----- sodium lamp standards every 45 m -----
  for (let x = -XE + 22.5; x < XE; x += 45) {
    if (Math.abs(Math.abs(x) - XT) < 13 || Math.abs(Math.abs(x) - XA) < 8) continue;
    const G = Z(x), D = deckY(x);
    for (const s of [-1, 1]) {
      const z = s * 14.2;
      G.beam([x, D + 0.32, z], [x, D + 9.2, z], 0.3, 0.3, PAINT_D, 6);
      G.beam([x, D + 9.0, z], [x, D + 9.6, z - s * 2.5], 0.22, 0.22, PAINT_D, 6);
      G.box(x, D + 9.55, z - s * 2.8, 1.2, 0.26, 0.55, AMBER, 5, 5.5);
      addGlow(x, D + 9.4, z - s * 2.8, 2.8, mul(AMBER, 2.0), 0, 0, 0);
    }
    await ctx.yield();
  }
  await ctx.yield();

  // ----- traffic: six lanes, right-hand running, moved along the cambered deck in the vertex shader -----
  const carCols = [[0.5, 0.51, 0.53], [0.62, 0.62, 0.6], [0.04, 0.045, 0.05], [0.05, 0.09, 0.2], [0.36, 0.05, 0.04], [0.22, 0.25, 0.24], [0.5, 0.42, 0.26], [0.1, 0.2, 0.17]];
  const HEAD = [1, 0.9, 0.72], TAIL = [1, 0.06, 0.03];
  const perLane = opts.traffic === false ? 0 : Math.max(4, Math.round(25 * density * detail));
  const carGeo = new Geo(Rt, Math.max(9000, perLane * 6 * 400)), carAttr = []; carGeo.jit = 0.03;      // sized for about 400 vertices a vehicle, so it does not grow
  const TRAILER = [[0.6, 0.6, 0.58], [0.34, 0.36, 0.39], [0.45, 0.2, 0.1], [0.55, 0.5, 0.4], [0.2, 0.3, 0.4]], MUD = [0.2, 0.19, 0.17], BLACK = [0.035, 0.035, 0.04];
  for (const dir of [-1, 1]) for (let lane = 0; lane < 3; lane++) {
    const z = dir * (1.75 + lane * 3.5), speed = dir * (30 - lane * 3.4), slot = (2 * XE) / perLane;
    let lastPale = -1e5;
    for (let k = 0; k < perLane; k++) {
      const x0 = -XE + (k + Rt.range(0.12, 0.88)) * slot, n0 = carGeo.n, col = Rt.pick(carCols);
      const truck = Rt.chance(lane === 2 ? 0.3 : 0.04);
      let L, yl;
      if (truck) {
        L = Rt.range(9, 13); yl = 1.0; let bc = Rt.pick(TRAILER); const cc = Rt.pick(carCols.slice(0, 2).concat(carCols.slice(3)));
        // a long pale trailer is a blank slab beside the eye: in the two lanes nearest the centreline at most one per 400 m
        if (bc === TRAILER[0]) { if (lane < 2 && x0 - lastPale < 400) bc = TRAILER[1]; else lastPale = x0; }
        const tl = L - 2.8, tx = -dir * 1.3, rear = tx - dir * tl / 2;
        carGeo.box(dir * (L / 2 - 1.2), 1.75, z, 2.4, 2.3, 2.4, cc, 6, 0, 55);
        carGeo.box(dir * (L / 2 - 0.5), 2.2, z, 1.05, 0.9, 2.2, [0.03, 0.04, 0.05], 6, 0, 55);
        carGeo.box(dir * (L / 2 - 1.75), 3.2, z, 1.3, 0.62, 2.2, cc, 6, 0, 55);                         // wind deflector on the cab roof
        carGeo.box(dir * (L / 2 + 0.01), 1.05, z, 0.07, 0.62, 2.1, BLACK, 6, 0, 55);                    // grille and bumper
        carGeo.box(tx, 3.05, z, tl, 2.1, 2.5, bc, 6, 0, 55);                                              // the box: clean above,
        carGeo.box(tx, 1.65, z, tl, 0.7, 2.5, mix3(bc, MUD, 0.5), 6, 0, 51);                              // road grime on its lower third,
        carGeo.box(tx, 1.05, z, tl + 0.04, 0.5, 2.55, mul(bc, 0.4), 6, 0, 51);                            // a dark skirt
        for (let rx = -tl / 2 + 1.2; rx < tl / 2 - 0.4; rx += 2.4) carGeo.box(tx + rx, 2.74, z, 0.11, 2.86, 2.59, mul(bc, 0.7), 6, 0, 55);   // a rib every 2.4 m, over the roof and down both sides
        for (const dz of [-1.14, 0, 1.14]) carGeo.box(rear - dir * 0.02, 2.6, z + dz, 0.06, 2.9, 0.08, BLACK, 6, 0, 55);                   // rear doors: hinges and the seam between them
        for (const dz of [-0.4, 0.4]) carGeo.box(rear - dir * 0.04, 2.3, z + dz, 0.05, 2.3, 0.05, [0.3, 0.31, 0.32], 6, 0, 55);            // lock rods
        carGeo.box(rear - dir * 0.06, 0.72, z, 0.12, 0.16, 2.3, BLACK, 6, 0, 55);                         // under-run bar
        carGeo.box(0, 0.55, z, L - 0.6, 0.5, 2.3, [0.03, 0.03, 0.035], 6, 0, 55);
        for (const wx of [-0.36, -0.22, 0.34]) for (const wz of [-1.18, 1.18]) carGeo.box(wx * L, 0.5, z + wz, 1.0, 1.0, 0.3, [0.02, 0.02, 0.02], 6, 0, 55);
      } else {
        L = Rt.range(4.2, 4.9); yl = 0.78;
        carGeo.box(0, 0.66, z, L, 0.6, 1.85, col, 6, 0, 55);
        const ga = L * 0.3, gb = 0.84, ta = L * 0.17, tb = 0.7, gx = -dir * 0.3;
        carGeo.tier([[ga, -gb], [ga, gb], [-ga, gb], [-ga, -gb]], [[ta, -tb], [ta, tb], [-ta, tb], [-ta, -tb]], gx, z, 0.96, 1.46, [0.03, 0.04, 0.055], 6, false);
        carGeo.box(gx, 1.48, z, ta * 2 + 0.1, 0.06, tb * 2 + 0.06, col, 6, 0, 55);
        for (const wx of [-0.31, 0.31]) for (const wz of [-0.88, 0.88]) carGeo.box(wx * L, 0.34, z + wz, 0.68, 0.68, 0.2, [0.02, 0.02, 0.02], 6, 0, 55);
      }
      for (const dz of [-0.62, 0.62]) {
        carGeo.box(dir * (L / 2 + 0.02), yl, z + dz, 0.06, 0.2, 0.34, HEAD, 5, 7, dir > 0 ? 1 : 2);
        carGeo.box(-dir * (L / 2 + 0.02), yl + 0.08, z + dz, 0.06, 0.16, 0.3, TAIL, 5, 3, dir > 0 ? 2 : 1);
      }
      for (let v = n0; v < carGeo.n; v++) carAttr.push(x0, speed);
      addGlow(dir * (L / 2 + 0.3), yl, z, 2.6, mul(HEAD, 2.4), 0, 0, 2, [x0, speed]);
      addGlow(-dir * (L / 2 + 0.2), yl + 0.1, z, 1.5, mul(TAIL, 1.5), 0, 0, 2, [x0, speed]);
      if (k % 6 === 5) await ctx.yield();
    }
    await ctx.yield();
  }
  await ctx.yield();

  // ----- the painters' cradle: outriggers on the sidewalk, a railed stage on ropes beside the truss, two painters -----
  const crD = deckY(cradleX), crL = 9, crZ = 17.3, GALV = [0.4, 0.42, 0.44];
  {
    const G = Z(cradleX);
    for (const dx of [-2.6, 2.6]) {
      G.beam([cradleX + dx, crD + 0.5, 12.2], [cradleX + dx, crD + 2.0, crZ + 0.3], 0.18, 0.18, GALV, 6, true);
      G.beam([cradleX + dx, crD + 0.32, 13.4], [cradleX + dx, crD + 1.25, 13.4], 0.14, 0.14, GALV, 6);
      G.box(cradleX + dx, crD + 0.67, 11.9, 0.9, 0.7, 1.3, CONC, 4); G.box(cradleX + dx, crD + 1.06, 11.9, 0.7, 0.08, 1.0, PAINT_D, 6);
    }
    G.beam([cradleX - 2.6, crD + 1.3, 12.6], [cradleX + 2.6, crD + 1.3, 12.6], 0.1, 0.1, GALV, 6, true);
  }
  await ctx.yield();
  const crGeo = new Geo(Rg, 2400), crRib = new Ribbons(), WOOD = [0.36, 0.3, 0.2], CREAM = [0.62, 0.6, 0.54];
  crGeo.box(0, -crL, 0, 7.2, 0.14, 1.34, WOOD, 6);
  for (const dz of [-0.66, 0.66]) {
    crGeo.box(0, -crL + 0.14, dz, 7.2, 0.2, 0.05, WOOD, 6);
    crGeo.beam([-3.6, -crL + 1.1, dz], [3.6, -crL + 1.1, dz], 0.07, 0.07, DARK, 6);
    crGeo.beam([-3.6, -crL + 0.6, dz], [3.6, -crL + 0.6, dz], 0.05, 0.05, DARK, 6);
    for (const x of [-3.6, -1.2, 1.2, 3.6]) crGeo.beam([x, -crL, dz], [x, -crL + 1.1, dz], 0.06, 0.06, DARK, 6);
  }
  for (const x of [-2.6, 2.6]) {
    for (const dz of [-0.66, 0.66]) crGeo.beam([x, -crL + 1.1, dz], [x, -crL + 2.1, dz * 0.3], 0.07, 0.07, DARK, 6);
    crGeo.box(x, -crL + 2.1, 0, 0.3, 0.22, 0.5, DARK, 6);
    crRib.seg([x, 0.2, 0], [x, -crL + 2.1, 0], 0.045, [0.5, 0.46, 0.38]);
    crRib.seg([x + 0.12, 0.2, 0], [x + 0.12, -crL + 0.2, 0.7], 0.03, [0.45, 0.42, 0.36]);      // safety line
  }
  crGeo.box(-0.2, -crL + 0.27, 0.3, 0.3, 0.32, 0.3, [0.4, 0.4, 0.42], 6); crGeo.box(-0.2, -crL + 0.44, 0.3, 0.26, 0.03, 0.26, PAINT, 6);
  crGeo.box(2.3, -crL + 0.27, 0.25, 0.3, 0.32, 0.3, [0.4, 0.4, 0.42], 6); crGeo.box(2.3, -crL + 0.44, 0.25, 0.26, 0.03, 0.26, PAINT, 6);
  crGeo.box(-2.9, -crL + 0.4, 0.1, 0.9, 0.5, 0.7, CREAM, 6);                           // folded dust sheets
  await ctx.yield();
  // two painters in pale overalls and hard hats, facing the truss; the second one's roller arm is its own mesh (it moves)
  const OVER = [0.7, 0.68, 0.62], BOOT = [0.05, 0.05, 0.06], SKIN = [0.5, 0.33, 0.24], crArms = [];
  const armGeo = new Geo(Rg, 200); armGeo.jit = 0.02;
  armGeo.beam([0, 0, 0], [0.07, 0.02, -0.3], 0.12, 0.12, OVER, 6, true);               // the arm, from the shoulder: upper arm, forearm, hand
  armGeo.beam([0.07, 0.02, -0.3], [0.06, 0.26, -0.54], 0.1, 0.1, OVER, 6, true);
  armGeo.box(0.06, 0.28, -0.57, 0.09, 0.1, 0.1, SKIN, 6);
  armGeo.beam([0.05, 0.08, -0.36], [0.1, 1.1, -1.7], 0.045, 0.045, WOOD, 6);          // the pole: long enough for the roller to run on the truss vertical
  armGeo.box(0.1, 1.12, -1.74, 0.36, 0.13, 0.13, PAINT, 6);                           // the roller, wet with paint
  const armGeometry = armGeo.toGeometry();
  await ctx.yield();
  for (const [px, lean, hat, moving] of [[-1.5, 1, [0.78, 0.56, 0.05], false], [1.2, -1, [0.72, 0.72, 0.68], true]]) {
    const b = -crL + 0.07;
    const rect = (a, c) => [[a, -c], [a, c], [-a, c], [-a, -c]], octo = (r) => { const o = []; for (let k = 0; k < 8; k++) { const t = (k + 0.5) / 8 * Math.PI * 2; o.push([Math.cos(t) * r, Math.sin(t) * r]); } return o; };
    // a figure, not stacked boxes: legs in a working stance, a torso tapering from the shoulders to the waist and leaning
    // into the work, sloped shoulders, a round head under a brimmed hard hat, arms in two parts with hands
    for (const lx of [-1, 1]) {
      const hip = [px + lx * 0.1, b + 0.9, 0.02], knee = [px + lx * 0.15, b + 0.5, lx * lean > 0 ? -0.1 : 0.03], foot = [px + lx * 0.17, b + 0.13, lx * lean > 0 ? -0.04 : 0.08];
      crGeo.beam(hip, knee, 0.2, 0.2, OVER, 6); crGeo.beam(knee, foot, 0.16, 0.16, OVER, 6);
      crGeo.box(foot[0], b + 0.07, foot[2] - 0.05, 0.17, 0.14, 0.32, BOOT, 6);
    }
    crGeo.tier(rect(0.17, 0.11), rect(0.2, 0.12), px, 0.01, b + 0.84, b + 1.02, OVER, 6, false);          // hips
    crGeo.tier(rect(0.185, 0.115), rect(0.27, 0.14), px, -0.03, b + 1.02, b + 1.47, OVER, 6, false);      // waist to chest
    crGeo.tier(rect(0.27, 0.14), rect(0.1, 0.09), px, -0.06, b + 1.47, b + 1.57, OVER, 6, true);          // sloped shoulders
    crGeo.box(px, b + 1.02, 0.02, 0.43, 0.07, 0.27, BOOT, 6);                          // harness belt
    for (const sx of [-0.11, 0.11]) crGeo.beam([px + sx, b + 1.03, 0.14], [px + sx * 0.6, b + 1.5, 0.11], 0.05, 0.03, BOOT, 6);      // harness straps up the back
    crGeo.tier(octo(0.06), octo(0.06), px, -0.07, b + 1.55, b + 1.62, SKIN, 6, false);                    // neck
    crGeo.tier(octo(0.095), octo(0.115), px, -0.08, b + 1.6, b + 1.71, SKIN, 6, false);                   // head
    crGeo.tier(octo(0.115), octo(0.1), px, -0.08, b + 1.71, b + 1.79, SKIN, 6, true);
    crGeo.tier(octo(0.175), octo(0.175), px, -0.1, b + 1.775, b + 1.8, hat, 6, true);                     // hard hat: brim and crown
    crGeo.tier(octo(0.13), octo(0.12), px, -0.08, b + 1.8, b + 1.87, hat, 6, false);
    crGeo.tier(octo(0.12), octo(0.07), px, -0.08, b + 1.87, b + 1.93, hat, 6, true);
    { const sh = [px - 0.26 * lean, b + 1.46, -0.05], el = [px - 0.33 * lean, b + 1.2, -0.2], hd = [px - 0.3 * lean, b + 1.08, -0.5];      // the resting arm: a hand on the rail
      crGeo.beam(sh, el, 0.12, 0.12, OVER, 6, true); crGeo.beam(el, hd, 0.1, 0.1, OVER, 6, true); crGeo.box(hd[0], hd[1], hd[2] - 0.05, 0.09, 0.08, 0.11, SKIN, 6); }
    if (!moving) {
      const sh = [px + 0.26 * lean, b + 1.46, -0.05], el = [px + 0.36 * lean, b + 1.52, -0.36], hd = [px + 0.4 * lean, b + 1.74, -0.64];
      crGeo.beam(sh, el, 0.12, 0.12, OVER, 6, true); crGeo.beam(el, hd, 0.1, 0.1, OVER, 6, true); crGeo.box(hd[0], hd[1], hd[2], 0.09, 0.1, 0.1, SKIN, 6);
      crGeo.beam([hd[0], hd[1] - 0.25, hd[2] + 0.22], [px + 0.5 * lean, b + 2.5, -1.62], 0.04, 0.04, WOOD, 6);      // the pole reaches the truss
      crGeo.box(px + 0.5 * lean, b + 2.52, -1.66, 0.3, 0.11, 0.11, PAINT, 6);
    } else {
      const arm = new THREE.Mesh(armGeometry, steel); arm.position.set(px + 0.27 * lean, b + 1.45, -0.05); arm.name = 'painter-arm'; crArms.push(arm);
    }
    await ctx.yield();
  }
  // the bay they are working on: primer on the chord and the verticals behind them, the finish coat not yet on
  {
    const G = Z(cradleX), xv = cradleX + 1.2, PRIMER = [0.5, 0.33, 0.29];      // red oxide, paler and duller than the finish coat
    G.box(xv - 1.6, crD - TRUSS, ZC, 9.4, 1.17, 1.17, PRIMER, 6, 0, 63);
    G.box(xv, crD - 4.7, ZC, 0.79, 5.4, 0.79, PRIMER, 6, 0, 51);
    G.box(xv - 7.5, crD - 6.2, ZC, 0.79, 2.6, 0.79, PRIMER, 6, 0, 51);
  }
  await ctx.yield();
  const cradle = new THREE.Group(); cradle.position.set(cradleX, crD + 2.0, crZ);
  const cradleMesh = new THREE.Mesh(crGeo.toGeometry(), steel), cradleRopes = new THREE.Mesh(crRib.toGeometry(), ribbonMat);
  cradleRopes.renderOrder = -0.5; cradle.add(cradleMesh, cradleRopes, ...crArms); root.add(cradle);
  anchors.cradle = new THREE.Vector3(cradleX, crD + 2.0 - crL + 1, crZ);
  await ctx.yield();

  // ----- flags on the towers' top struts, streaming down the fog's flow -----
  const fl = { P: [], N: [], C: [], U: [], S: [], F: [], I: [] };
  const flagA = Rl.pick([[0.1, 0.22, 0.5], [0.62, 0.6, 0.52], [0.06, 0.34, 0.3]]), flagB = Rl.pick([[0.6, 0.58, 0.5], PAINT, AMBER.map((v) => v * 0.7)]);
  const strutTop = strutLv[strutLv.length - 1][1] + 1;
  for (const xT of [-XT, XT]) {
    const G = Z(xT), poleTop = strutTop + 21, len = 11, hgt = 6.4, nx = 12, ny = 4, i0 = fl.P.length / 3, ph = xT > 0 ? 0 : 2.1;
    G.beam([xT, strutTop, 0], [xT, poleTop, 0], 0.42, 0.42, CREAM, 6, true);
    G.box(xT, strutTop + 0.6, 0, 1.6, 1.2, 1.6, PAINT, 0); G.box(xT, poleTop + 0.25, 0, 0.7, 0.5, 0.7, AMBER, 6);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const d = i / nx, v = j / ny, c = Math.abs(v - 0.5) < 0.2 ? flagB : flagA;
      fl.P.push(xT + FLOW[0] * d * len, poleTop - 0.4 - (1 - v) * hgt, FLOW[1] * d * len); fl.N.push(-FLOW[1], 0, FLOW[0]);
      fl.C.push(c[0], c[1], c[2]); fl.U.push(d * len, v * hgt); fl.S.push(6, 0); fl.F.push(d, ph + v * 0.7, 1.25);
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = i0 + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, e = c + 1; fl.I.push(a, b, e, a, e, c); }
    anchors.flagTips.push(new THREE.Vector3(xT, poleTop, 0));
  }
  const flagGeo = new THREE.BufferGeometry();
  flagGeo.setAttribute('position', new THREE.Float32BufferAttribute(fl.P, 3)); flagGeo.setAttribute('normal', new THREE.Float32BufferAttribute(fl.N, 3));
  flagGeo.setAttribute('color', new THREE.Float32BufferAttribute(fl.C, 3)); flagGeo.setAttribute('aUv', new THREE.Float32BufferAttribute(fl.U, 2));
  flagGeo.setAttribute('aS', new THREE.Float32BufferAttribute(fl.S, 2)); flagGeo.setAttribute('aFlag', new THREE.Float32BufferAttribute(fl.F, 3));
  flagGeo.setIndex(fl.I); flagGeo.computeBoundingSphere(); flagGeo.boundingSphere.radius += 6;
  const flags = new THREE.Mesh(flagGeo, flagMat); root.add(flags);
  await ctx.yield();

  // ----- container ships: hull, stacks, a windowed house, radar mast and funnel (bow toward local -Z) -----
  const nShips = clamp(opts.ships ?? 2, 0, 2), ships = [], radars = [];
  if (nShips > 0) {
    const G = new Geo(Rs, 3000), HULL = mul(DARK, 0.85), WHITE = [0.6, 0.6, 0.57], DECKC = [0.1, 0.17, 0.15];
    const st = [-146, -128, -98, -40, 60, 120, 140, 146], hb = [0.6, 9.5, 17.5, 21, 21, 20, 17, 14.5], wl = [0.3, 5, 13, 19.5, 20, 18, 13, 9];
    for (let i = 0; i < 7; i++) {
      for (const s of [-1, 1]) {
        G.quad([s * wl[i], -2, st[i]], [s * wl[i + 1], -2, st[i + 1]], [s * (wl[i + 1] * 0.4 + hb[i + 1] * 0.6), 5, st[i + 1]], [s * (wl[i] * 0.4 + hb[i] * 0.6), 5, st[i]], [0.3, 0.05, 0.04], 6, 0, [s, 0, 0]);
        G.quad([s * (wl[i] * 0.4 + hb[i] * 0.6), 5, st[i]], [s * (wl[i + 1] * 0.4 + hb[i + 1] * 0.6), 5, st[i + 1]], [s * hb[i + 1], 15, st[i + 1]], [s * hb[i], 15, st[i]], HULL, 6, 0, [s, 0, 0]);
        G.quad([s * hb[i], 15, st[i]], [s * hb[i + 1], 15, st[i + 1]], [s * hb[i + 1], 16.3, st[i + 1]], [s * hb[i], 16.3, st[i]], HULL, 6, 0, [s, 0, 0]);
      }
      G.quad([-hb[i], 15, st[i]], [hb[i], 15, st[i]], [hb[i + 1], 15, st[i + 1]], [-hb[i + 1], 15, st[i + 1]], DECKC, 6, 0, [0, 1, 0]);
    }
    G.quad([-hb[7], 16.3, 146], [hb[7], 16.3, 146], [wl[7], -2, 146], [-wl[7], -2, 146], HULL, 6, 0, [0, 0, 1]);
    await ctx.yield();
    for (let z = -112; z < 50; z += 13.4) G.box(0, 15 + 1.35 * Rs.int(3, 7), z, 37.5, 2.7 * Rs.int(3, 7), 12.4, [1, 1, 1], 8, 0, 55);
    for (let z = 99; z < 130; z += 13.4) G.box(0, 15 + 1.35 * 3, z, 32.5, 2.7 * 3, 12.4, [1, 1, 1], 8, 0, 55);
    // lashing bridges between the container bays
    const LASH = [0.09, 0.1, 0.11];
    for (let z = -112 + 6.7; z < 44; z += 13.4) G.box(0, 15 + 6.2, z, 39.4, 12.4, 0.45, LASH, 6, 0, 51);
    await ctx.yield();
    // the house: five tiers stepped back toward the top, a railed walkway round each, rows of small portholes (kind 9)
    const WHITE_D = mul(WHITE, 0.78), GLASS = [0.02, 0.035, 0.05], BOAT = [0.8, 0.25, 0.04];
    const rail = (x0, z0, x1, z1, y, hint) => {
      G.quad([x0, y, z0], [x1, y, z1], [x1, y + 1.1, z1], [x0, y + 1.1, z0], WHITE_D, 3, [0, 0, 1, 1], hint);
      G.quad([x0, y, z0], [x1, y, z1], [x1, y + 1.1, z1], [x0, y + 1.1, z0], WHITE_D, 3, [0, 0, 1, 1], [-hint[0], 0, -hint[2]]);
    };
    const railRing = (cz, y, w, d) => {
      const hx = w / 2, hz = d / 2;
      rail(-hx, cz - hz, hx, cz - hz, y, [0, 0, -1]); rail(-hx, cz + hz, hx, cz + hz, y, [0, 0, 1]);
      rail(-hx, cz - hz, -hx, cz + hz, y, [-1, 0, 0]); rail(hx, cz - hz, hx, cz + hz, y, [1, 0, 0]);
    };
    const tiers = [[15, 20.6, 39, 16], [20.6, 26.2, 37, 14.4], [26.2, 31.8, 34.4, 12.8], [31.8, 37.4, 31.4, 11.4], [37.4, 43, 28, 10]];
    tiers.forEach(([y0, y1, w, d], k) => {
      const cz = 74 + k * 0.7;
      G.box(0, (y0 + y1) / 2, cz, w, y1 - y0, d, WHITE, 9, 1, 51);
      G.box(0, y1 + 0.09, cz, w + 2.6, 0.18, d + 2.0, WHITE_D, 6, 0, 63);
      railRing(cz, y1 + 0.18, w + 2.5, d + 1.9);
    });
    await ctx.yield();
    // the bridge: full-beam wings with bulwarks, the wheelhouse with one continuous dark raked window band
    G.box(0, 43.2, 73, 52, 0.3, 6.6, WHITE_D, 6, 0, 63); G.box(0, 43.95, 73, 52, 1.2, 6.6, WHITE, 6, 0, 51);
    G.box(0, 44.9, 74, 31, 3.8, 8, WHITE, 6, 0, 55);
    { const zf = 70 - 0.06, xa = 15.5;
      G.quad([-xa, 44.6, zf], [xa, 44.6, zf], [xa + 0.1, 46.1, zf - 0.55], [-xa - 0.1, 46.1, zf - 0.55], GLASS, 6, 0, [0, 0, -1]);
      G.quad([-xa, 46.1, zf - 0.55], [xa, 46.1, zf - 0.55], [xa, 46.25, zf], [-xa, 46.25, zf], WHITE_D, 6, 0, [0, 1, -1]);
      for (const s of [-1, 1]) G.quad([s * (xa + 0.06), 44.6, 70], [s * (xa + 0.06), 44.6, 76], [s * (xa + 0.06), 46.1, 76], [s * (xa + 0.06), 46.1, 70], GLASS, 6, 0, [s, 0, 0]);
      for (const s of [-1, 1]) G.box(s * 25.4, 44.9, 73, 0.9, 0.7, 1.6, WHITE_D, 6); }
    G.box(0, 47.0, 74.4, 25, 0.4, 9, WHITE_D, 6); railRing(74.4, 47.2, 24.6, 8.6);
    await ctx.yield();
    // orange lifeboats on davits, one each side
    for (const s of [-1, 1]) {
      const bx = s * 19.2, by = 29.4, bz = 75;
      G.box(bx, by, bz, 2.7, 1.6, 8.6, BOAT, 6); G.box(bx, by + 1.2, bz, 2.1, 0.9, 7.2, BOAT, 6); G.box(bx, by + 1.2, bz - 3.0, 2.14, 0.5, 0.9, GLASS, 6);
      for (const dz of [-3.3, 3.3]) { G.beam([s * 17.2, 26.4, bz + dz], [s * 17.6, 32.6, bz + dz], 0.3, 0.3, WHITE_D, 6); G.beam([s * 17.6, 32.6, bz + dz], [bx + s * 0.4, 31.9, bz + dz], 0.26, 0.26, WHITE_D, 6, true); }
    }
    await ctx.yield();
    // mast: a post with a radar platform, crosstrees, stays and the masthead light (the radar bars turn: separate meshes)
    G.beam([0, 47.2, 74], [0, 57.0, 74], 0.8, 0.8, WHITE, 6, true); G.beam([-5.5, 54.2, 74], [5.5, 54.2, 74], 0.26, 0.26, WHITE, 6, true);
    G.box(0, 50.6, 73, 4.4, 0.22, 3.2, WHITE_D, 6); G.box(0, 51.05, 72.4, 0.5, 0.7, 0.5, WHITE_D, 6);
    for (const s of [-1, 1]) { G.beam([s * 5.5, 54.2, 74], [0, 56.8, 74], 0.1, 0.1, WHITE, 6); G.beam([s * 5.5, 54.2, 74], [s * 9, 47.3, 75.5], 0.08, 0.08, WHITE_D, 6); }
    G.box(0, 57.25, 74, 0.6, 0.6, 0.6, HEAD, 5, 6);
    await ctx.yield();
    // engine casing and the funnel: eight-sided, raked aft, a band in the line's colour, a black top
    const oct = (a, b, dz = 0) => { const o = []; for (let k = 0; k < 16; k++) { const t = (k + 0.5) / 16 * Math.PI * 2; o.push([a * Math.cos(t), b * Math.sin(t) + dz]); } return o; };      // an oval stack, not a box
    const band = Rs.pick([PAINT, AMBER.map((v) => v * 0.6), [0.55, 0.55, 0.5], [0.05, 0.2, 0.3]]);
    G.box(0, 25.5, 92.5, 16, 21, 9, WHITE, 9, 1, 51); G.box(0, 36.1, 92.5, 17.4, 0.2, 10.4, WHITE_D, 6); railRing(92.5, 36.2, 17.2, 10.2);
    G.tier(oct(2.7, 3.7, 0), oct(2.45, 3.4, 1.1), 0, 92.5, 36.2, 45.5, HULL, 6, false);
    G.tier(oct(2.45, 3.4, 1.1), oct(2.35, 3.25, 1.6), 0, 92.5, 45.5, 49.6, band, 6, false);
    G.tier(oct(2.35, 3.25, 1.6), oct(2.3, 3.2, 1.95), 0, 92.5, 49.6, 52.6, [0.02, 0.02, 0.025], 6, true);
    G.tier(oct(2.52, 3.47, 1.1), oct(2.5, 3.45, 1.16), 0, 92.5, 45.5, 46.0, WHITE, 6, false); G.tier(oct(2.42, 3.32, 1.55), oct(2.4, 3.3, 1.6), 0, 92.5, 49.1, 49.6, WHITE, 6, false);      // pale rings edging the band
    G.tier(oct(2.42, 3.32, 1.9), oct(2.42, 3.32, 1.95), 0, 92.5, 52.2, 52.6, [0.05, 0.05, 0.055], 6, false);                                                                          // the cowl's lip
    for (let k = 0; k < 9; k++) G.box(2.7 - k * 0.028, 37.2 + k * 1.0, 92.5 + k * 0.12, 0.12, 0.07, 0.6, WHITE_D, 6);                                                                   // a ladder up its side
    for (const dx of [-0.8, 0.8]) G.beam([dx, 52.6, 94.2], [dx, 54.0, 94.5], 0.5, 0.5, [0.03, 0.03, 0.035], 6, true);
    await ctx.yield();
    // foremast and side lights
    G.beam([0, 16, -134], [0, 34, -134], 0.55, 0.55, WHITE, 6, true); G.box(0, 34.4, -134, 0.6, 0.6, 0.6, HEAD, 5, 5);
    for (const [sx, c] of [[-1, [1, 0.08, 0.04]], [1, [0.1, 1, 0.3]]]) G.box(sx * 26.1, 44.9, 71, 0.25, 0.5, 0.7, c, 5, 4);
    await ctx.yield();
    const shipGeo = G.toGeometry();
    await ctx.yield();
    // per ship: a turning radar bar and her lights as halos (masthead pulsing slowly, steady side lights, foremast)
    const RG = new Geo(Rs, 120); RG.jit = 0;
    RG.box(0, 0, 0, 6.6, 0.36, 0.5, WHITE, 6); RG.box(0, -0.4, 0, 0.5, 0.5, 0.5, WHITE_D, 6);
    const radarGeo = RG.toGeometry();
    const sl = { P: [], O: [], G: [], C: [], K: [], I: [] };
    const shipGlow = (x, y, z, size, col, rate, phase) => {
      const i = sl.P.length / 3;
      for (const o of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { sl.P.push(x, y, z); sl.O.push(o[0], o[1]); sl.G.push(size, rate, phase, 0); sl.C.push(col[0], col[1], col[2]); sl.K.push(0, 0); }
      sl.I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    };
    shipGlow(0, 57.3, 74, 5.2, mul(HEAD, 3.4), 0.28, 0); shipGlow(0, 34.5, -134, 3.6, mul(HEAD, 2.6), 0.28, 1.6);
    shipGlow(-26.3, 44.9, 71, 3.2, [3.2, 0.2, 0.1], 0, 0); shipGlow(26.3, 44.9, 71, 3.2, [0.25, 2.8, 0.8], 0, 0);
    shipGlow(0, 49.5, 96.5, 4.2, mul(AMBER, 1.6), 0, 0);
    const slGeo = new THREE.BufferGeometry();
    slGeo.setAttribute('position', new THREE.Float32BufferAttribute(sl.P, 3)); slGeo.setAttribute('aOff', new THREE.Float32BufferAttribute(sl.O, 2));
    slGeo.setAttribute('aG', new THREE.Float32BufferAttribute(sl.G, 4)); slGeo.setAttribute('color', new THREE.Float32BufferAttribute(sl.C, 3));
    slGeo.setAttribute('aCar', new THREE.Float32BufferAttribute(sl.K, 2)); slGeo.setIndex(sl.I);
    for (let i = 0; i < nShips; i++) {
      const m = new THREE.Mesh(shipGeo, steel); m.name = 'ship' + i; ships.push(m); root.add(m);
      const rd = new THREE.Mesh(radarGeo, steel); rd.position.set(0, 51.75, 72.4); rd.name = 'radar' + i; m.add(rd); radars.push(rd);
      const lg = new THREE.Mesh(slGeo, glowMat); lg.frustumCulled = false; lg.renderOrder = 2; lg.name = 'ship-lights' + i; m.add(lg);
    }
    await ctx.yield();
  }
  anchors.shipStart = new THREE.Vector3(835, 0, 200);
  anchors.funnelTop = new THREE.Vector3(0, 53.4, 94.4);            // in the ship's own space (bow toward -Z)
  anchors.shipTrack = [new THREE.Vector3(shipX, 0, 188), new THREE.Vector3(shipX, 0, -232)];
  const placeShip = (i, x, z, heading) => {
    const m = ships[i]; if (!m) return;
    m.position.set(x, 0, z); m.rotation.y = heading;
    if (i === 0) U.uShip.value.set(x + 72 * Math.sin(heading), z + 72 * Math.cos(heading), -Math.sin(heading), -Math.cos(heading));
  };
  placeShip(0, shipX, 60, 0); placeShip(1, anchors.shipStart.x, anchors.shipStart.z, 0.12);

  // ----- static meshes -----
  for (const G of zone) { const m = new THREE.Mesh(await G.toGeometrySteps(ctx), steel); root.add(m); await ctx.yield(); }
  const ribMesh = new THREE.Mesh(ribbons.toGeometry(), ribbonMat); ribMesh.renderOrder = -0.5; root.add(ribMesh);
  await ctx.yield();
  const carGeometry = await carGeo.toGeometrySteps(ctx); carGeometry.setAttribute('aCar', new THREE.Float32BufferAttribute(carAttr, 2));
  const cars = new THREE.Mesh(carGeometry, carMat); cars.frustumCulled = false; root.add(cars);
  await ctx.yield();
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(glows.P, 3)); glowGeo.setAttribute('aOff', new THREE.Float32BufferAttribute(glows.O, 2));
  glowGeo.setAttribute('aG', new THREE.Float32BufferAttribute(glows.G, 4)); glowGeo.setAttribute('color', new THREE.Float32BufferAttribute(glows.C, 3));
  glowGeo.setAttribute('aCar', new THREE.Float32BufferAttribute(glows.K, 2)); glowGeo.setIndex(glows.I);
  const glowMesh = new THREE.Mesh(glowGeo, glowMat); glowMesh.frustumCulled = false; glowMesh.renderOrder = 2; root.add(glowMesh);
  await ctx.yield();

  // ----- the fog river sheet: fine under the bridge, stretching to 6 km -----
  let fogMesh = null;
  if (opts.fog !== false) {
    // an even core (about 10 m cells) under the bridge and the route, where the heads have real height, with a finer
    // patch (about 5 m) over the valley under the main span, where the flight skims the heads; beyond the core the cells
    // grow by a constant factor out to 6 km
    const fineK = detail >= 1 ? 1 : 0.8;
    const axis = (f0, f1, core, far, nOut) => {
      const fineS = 5.2 / fineK, coreS = 10.4 / fineK, size = (x) => fineS + (coreS - fineS) * smoothstep(0, 170, Math.max(f0 - x, x - f1, 0));
      const up = [], dn = [];
      for (let x = (f0 + f1) / 2; x < core; x += size(x)) up.push(x);
      for (let x = (f0 + f1) / 2 - size((f0 + f1) / 2); x > -core; x -= size(x)) dn.push(x);
      const grow = (from) => {                      // nOut cells whose sizes grow by one factor and end exactly at `far`
        let lo = 1, hi = 1.4;
        for (let k = 0; k < 40; k++) { const g = (lo + hi) / 2; let sum = 0, c = coreS; for (let i = 0; i < nOut; i++) { c *= g; sum += c; } if (sum > far - Math.abs(from)) hi = g; else lo = g; }
        const out = []; let c = coreS, x = Math.abs(from);
        for (let i = 0; i < nOut; i++) { c *= lo; x += c; out.push(x); }
        out[nOut - 1] = far;
        return out;
      };
      const gu = grow(up[up.length - 1]), gd = grow(dn[dn.length - 1]);
      return Float32Array.from([...gd.reverse().map((v) => -v), ...dn.reverse(), ...up, ...gu]);
    };
    const XS = axis(-340, 280, 1010, 6200, Math.round(44 * fineK)), ZS = axis(-70, 230, 460, 6000, Math.round(48 * fineK));
    const NX = XS.length - 1, NZ = ZS.length - 1;
    await ctx.yield();
    const pos = new Float32Array((NX + 1) * (NZ + 1) * 3);
    await ctx.yield();
    const idx = new Uint32Array(NX * NZ * 6);
    await ctx.yield();
    let o = 0;
    for (let j = 0; j <= NZ; j++) {
      const z = ZS[j];
      for (let i = 0; i <= NX; i++) { pos[o++] = XS[i]; pos[o++] = 0; pos[o++] = z; }
      if (j % 10 === 9) await ctx.yield();
    }
    await ctx.yield();
    o = 0;
    for (let j = 0; j < NZ; j++) {
      for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
      if (j % 8 === 7) await ctx.yield();
    }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setIndex(new THREE.BufferAttribute(idx, 1));
    fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, 0), 9000);
    fogMesh = new THREE.Mesh(fg, makeFogMat(U, detail >= 1)); fogMesh.frustumCulled = false; fogMesh.renderOrder = -1; fogMesh.name = 'fog-river'; root.add(fogMesh);
    await ctx.yield();
  }

  // ----- anchors -----
  const pY = deckY(XT) + 11.6;
  anchors.portalSeat = { position: new THREE.Vector3(-XT, pY, 0), normal: new THREE.Vector3(1, 0, 0) };
  anchors.gap = new THREE.Vector3(gapX, fogFloor, gapZ);
  anchors.cableDive = [new THREE.Vector3(560, cableY(560) + 3, 23), new THREE.Vector3(150, cableY(150) + 3, 23)];
  anchors.underDeck = new THREE.Vector3(cradleX - 60, deckY(cradleX) - TRUSS - 6, 30);
  anchors.flyThrough = [
    new THREE.Vector3(905, 44, 300), new THREE.Vector3(872, 60, 258), new THREE.Vector3(800, 122, 150), new THREE.Vector3(710, 186, 62),
    anchors.cableDive[0].clone(), new THREE.Vector3(360, cableY(360) + 3, 23), anchors.cableDive[1].clone(),
    new THREE.Vector3(cradleX + 20, 60, 30), anchors.underDeck.clone(), new THREE.Vector3(-150, 62, 30), new THREE.Vector3(-250, 96, 26),
    new THREE.Vector3(-340, cableY(340) + 11, 15), new THREE.Vector3(-440, 101, 4), new THREE.Vector3(-545, pY + 1.5, 0), anchors.portalSeat.position.clone(),
  ];
  anchors.viewpoints = {
    postcard: { position: new THREE.Vector3(260, 205, 1240), target: new THREE.Vector3(0, 125, 0) },
    axis: { position: new THREE.Vector3(905, 108, 0), target: new THREE.Vector3(-XT, 120, 0) },
    valley: { position: new THREE.Vector3(150, 52, 170), target: new THREE.Vector3(-320, 120, 0) },
  };

  // ----- runtime -----
  const _v = new THREE.Vector3(), _sz = new THREE.Vector2();
  let progress = -1, gapSet = false, gap2Set = false, shipSet = [false, false];
  const api = {
    object: root, radius: 290, height: 236, length: 2 * XE, center: new THREE.Vector3(-330, 150, 0), anchors, ground: false, groundY: 0,
    uniforms: U, deckY, cableY, ships, cradle, fogMesh, look: { style, hour, paint: '#' + paint.getHexString(), fogTop, fogAmp, fogFloor, flow: FLOW, sun: SUN },
    fog: { heightAt: fogHeightAt, liftAt: fogLiftAt, riftAt: fogRiftAt, surfaceAt: (x, z) => { const h = fogHeightAt(x, z); return h + fogLiftAt(x, z) * (1 - 0.85 * shipKLast); }, immersion: 0 },
    setProgress(u) { progress = clamp(u, 0, 1); },
    setGap(x, z, radius, strength = 1) { gapSet = true; U.uGap.value.set(x, z, radius, strength); },
    setGap2(x, z, radius, strength = 1) { gap2Set = true; U.uGap2.value.set(x, z, radius, strength); },
    setShip(i, x, z, heading = 0) { shipSet[i] = true; placeShip(i, x, z, heading); },
    setRift(i, x, z, rx, rz) { U.uRift.value[i].set(x, z, rx, rz); },      // a rift in the river, open down to the water (strength: uniforms.uRiftK)
    setLight(l = {}) {
      if (l.sunDir) U.uSun.value.set(l.sunDir.x ?? l.sunDir[0], l.sunDir.y ?? l.sunDir[1], l.sunDir.z ?? l.sunDir[2]).normalize();
      if (l.sun) U.uSunCol.value.set(l.sun); if (l.sky) U.uSkyCol.value.set(l.sky);
      if (l.fogLit) U.uFogLit.value.set(l.fogLit); if (l.fogShade) U.uFogShade.value.set(l.fogShade);
    },
    update(dt, time, camera) {
      U.uFg.value.w = time;
      U.uInv.value.copy(root.matrixWorld).invert();
      const u = progress >= 0 ? progress : (time / 46) % 1;
      if (!gapSet) U.uGap.value.w = progress >= 0 ? smoothstep(0.2, 0.45, u) : 1;
      if (!gap2Set) U.uGap2.value.w = progress >= 0 ? smoothstep(0.6, 0.8, u) : 0;
      if (!shipSet[0]) placeShip(0, shipX, 188 - 420 * u, 0);
      for (let i = 0; i < radars.length; i++) radars[i].rotation.y = time * 2.3 + i * 1.3;
      cradle.rotation.x = Math.sin(time * 0.83) * 0.022 + Math.sin(time * 0.31 + 1) * 0.012;
      cradle.rotation.z = Math.sin(time * 0.57 + 2) * 0.01;
      for (const a of crArms) a.rotation.x = 0.1 + 0.3 * Math.sin(time * 1.9);      // long strokes up and down the vertical
      if (camera) {
        _v.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(U.uInv.value); U.uCam.value.copy(_v);
        const h = fogHeightAt(_v.x, _v.z); U.uCamH.value = h; api.fog.immersion = clamp((h - _v.y + 4) / 10, 0, 1);
        ctx.renderer.getDrawingBufferSize(_sz);
        U.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 1e-3) * Math.max(_sz.y, 1));
      }
    },
    dispose() { fnTex.dispose(); },
  };
  api.update(0, 0, null);
  return api;
});
