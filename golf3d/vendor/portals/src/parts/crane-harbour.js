// CRANE HARBOUR hero: "The herd at the water".
// Twelve ship-to-shore gantry cranes on one quay. Six working cranes stand over a 400 m container
// ship with their booms lowered across her like giraffes drinking: two trolleys and two spreaders per
// crane (twelve spreaders) hoist and land boxes in a staggered rhythm, one landing about every 1.5 s.
// Six idle cranes further east raise their 70 m booms from flat to 80 degrees one after another.
//
// LOCAL SPACE  origin on the quay edge at the middle of the crane line, +Y up, +X east along the quay
// (toward the brief's sun), +Z = water (front). Quay top y = 0, water about y = -2.5 (not built here).
// Local = brief coordinates minus anchors.worldOffset [580, 0, 0]: put hero.object at (580, 0, 0).
//   cranes       local x = -390 -325 -260 -195 -130 -65 (working, 0..5) and 40 110 180 250 320 390 (idle, 6..11)
//   rails        z = -5 (waterside legs) and z = -35 (landside legs); clear height under portal beams 22 m
//   booms        hinge at z = -2, y = 54.2, tip at z = +68; apex 80 m; raised tip about 123 m
//   ship         x = -428 .. -22 (bow east), z = 3 .. 64, main deck y = 20, stacks to 46 m; 26 bays from x = -390 on a 13 m
//                pitch, so every fifth bay lies under a working crane; bays 18-22 (beside the ridden trolley) stop at 38 m
//
// OPTS
//   palette      7 hex strings (brief palette): [zenith, mid blue, haze, silhouette black, sodium orange,
//                sun cream, crane red]
//   apron        true: build a wet quay slab z -72..0 (pass false if the world lays its own asphalt at y = 0;
//                the cope, quay wall, fenders, bollards and crane rails are always built)
//   fill         0.3: strength of the built-in cold skylight fill (albedo * steel-blue added as emissive so shadow
//                sides never go dead black); pass 0 if the world's own lights do all the filling
//   journeySeconds  40: seconds that setProgress(1) stands for (boom wave timing 8 s + 2.5 s * i, 9 s each)
//   moored       true: mooring lines from the ship to the bollards; false when the ship will ccast off (setShipOffset)
//   frost        0: hoarfrost on the container tops, 0..1 (a uniform; winter mornings)
//   craneFlood   { value: Color }: the cranes' own sodium floods on their legs, sills, bogies and boom girders (black = off)
//   mute         { value: 0..1 }: takes the chroma out of unlit container paint (night and dusk looks)
//   glint        { value: Color }: sky colour mirrored in the rain pools on container roofs
//   boomLamps    0.6: brightness of the rows of walkway lamps along the booms (0 = none)
//   hullGlow     0.3: strength of the pools of lamp light on the ship's seaward side under her overside work lamps
//   hull         { sky, sun, sunDir, time, sea }: uniforms ({ value }) for the shell plating's own light: sky fill (Color), the low
//                sun raking along the plates (Color, and its direction as a Vector3), seconds, and the sea's rippling light (Color)
//
// EXPORTS  Geo (the box-soup geometry builder) and makeBoxMaterial(mosaic, dom, domW, FILL, X) so the world can build
//   its yard stacks from the same containers. X = { frost, flood, front, grid } adds the world's flood-mast lighting.
//   hero.look = { mosaic, dom, domW, livery, FROST, FILL, boomMax, lay, craneX, C, PERIOD } shares the palette choices.
//
// PROGRESS / HOOKS
//   hero.setProgress(u)        u = 0..1 along the world's path. Drives the idle boom wave (crane 6 starts at
//                              8 s of 40, the last stands tall at 29.5 s). Until it is first called the wave
//                              runs as a looping demo so the piece is alive in the part viewer.
//   hero.setRide(z, y) / hero.setRide(null)   lock crane 4's (the brief's "crane 5", local x = -130) sea
//                              trolley to z and its spreader underside to height y, so the camera can hang
//                              under it; its land trolley is hidden while riding.
//   hero.setBoom(i, radians | null)           override any boom (rare "salute" event).
//   hero.setSalute(k)                         0..1: the working cranes stop work (sea trolleys run home, carried boxes
//                              are put away) so their booms can be raised with setBoom.
//   hero.setShipOffset(dz)                    slide the ship, her boxes, window lights and lamps dz metres off the quay.
//   hero.craneState(i, s, time)               -> { z, y, loaded } for crane i (0..5), spreader s (0 sea, 1 land):
//                              the same function the animation uses (period 18 s, ambient loop on time).
//   hero.boomAngle(i)                         current angle in radians of crane i.
//   hero.setCycle(i, cycles | null)           drive working crane i's sea spreader from the world (cycles = whole cycles
//                              plus phase 0..1) instead of the clock, so a box can be keyed to the camera's progress.
//   hero.look.DECK = { flood: {value: Color}, grid }   work lights on the ship's lashing bridges: set flood.value to light
//                              the deck stacks in amber pools (night and dusk looks); black = off.
//
// ANCHORS (local space)
//   worldOffset  [580,0,0]     add to local to get brief coordinates
//   portalSeat   { position (390, 9, -20), normal (-1,0,0) }  centre of the 14 m ring between the legs of
//                              the last crane, facing back down the nave; the sun should sit behind it on +X
//   flyThrough   ordered points: hoist foot, hoist top, boom end, swoop down the far flank, round the bow,
//                into the nave, down the nave to the portal. >= 6 m from every solid built here.
//   hoistFoot / hoistTop / boomEnd   the ride line of crane 4 (camera hangs about 2 m under the spreader)
//   naveStart / naveEnd        the centreline under the six idle cranes (y = 9, z = -20)
//   bowTip, sternTip, funnelTop, bridgeTop, whistle   places for the world's plume, flags and gulls
//   cranes       [{ x, working }]   crane positions;  deckTop: highest stack top
//   viewpoints   hoistTop (looking +X at the rising booms), quarter (three-quarter view from the water)
//
// SIZE the line is 950 m long (x -475..475, also returned as hero.extent); `radius` 260 is a viewing radius so an
// orbit frames the whole herd; height 80 m (123 m with booms raised).  COST about 110k triangles, 10 draw calls, build about 200 ms,
// no lights of its own.  LIGHTING: MeshStandardMaterials with vertex colour, made to be seen against a low
// sun on +X (silhouettes with a rim) with cold hemisphere fill; lamps and beacons are additive HDR sprites.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#1B2740', '#3F5873', '#8C9FB2', '#14181F', '#FF9A2E', '#FFE2A8', '#C8321E'];
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const sm5 = (t) => { t = sat(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// a private generator for detail added after release: it keeps the seeded stream, and so every seed's layout, as it was
export const lcg = (s) => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;

// ---------- flat-shaded triangle soup builder with vertex colours ----------
export class Geo {
  constructor(rng) { this.p = []; this.n = []; this.c = []; this.rng = rng; this.jit = 0.07; }
  _tri(a, b, c, col) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    this.c.push(col[0], col[1], col[2], col[0], col[1], col[2], col[0], col[1], col[2]);
  }
  quad(a, b, c, d, col) { this._tri(a, b, c, col); this._tri(a, c, d, col); }
  tint(col, k = 1) { const j = (1 + (this.rng() - 0.5) * 2 * this.jit) * k; return [col.r * j, col.g * j, col.b * j]; }
  // prism between a and b with a chamfered rectangular section w (side) x h (up), optional taper at b
  beam(a, b, w, h, col, o = {}) {
    const w2 = o.w2 ?? w, h2 = o.h2 ?? h, ch = o.ch ?? 0.16, caps = o.caps ?? true, c = this.tint(col, o.k ?? 1);
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const d = [dx / L, dy / L, dz / L];
    let up = o.up || (Math.abs(d[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0]);
    let s = [up[1] * d[2] - up[2] * d[1], up[2] * d[0] - up[0] * d[2], up[0] * d[1] - up[1] * d[0]];
    const sl = Math.hypot(s[0], s[1], s[2]) || 1; s = [s[0] / sl, s[1] / sl, s[2] / sl];
    const u = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const ring = (q, ww, hh) => {
      const x = ww / 2, y = hh / 2, k = ch > 0 ? ch * Math.min(ww, hh) : 0;
      const sec = k > 0 ? [[x, -y + k], [x, y - k], [x - k, y], [-x + k, y], [-x, y - k], [-x, -y + k], [-x + k, -y], [x - k, -y]]
        : [[x, -y], [x, y], [-x, y], [-x, -y]];
      return sec.map(([sx, sy]) => [q[0] + s[0] * sx + u[0] * sy, q[1] + s[1] * sx + u[1] * sy, q[2] + s[2] * sx + u[2] * sy]);
    };
    const A = ring(a, w, h), B = ring(b, w2, h2), N = A.length, g = o.grime ?? 0;
    const cb = g ? [c[0] * (1 - g), c[1] * (1 - g), c[2] * (1 - g)] : c;
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      if (g) { this._tri(A[i], B[i], B[j], c); this._tri(A[i], B[j], A[j], cb); const m = this.c.length; for (const q of [m - 18, m - 9, m - 3]) { this.c[q] = cb[0]; this.c[q + 1] = cb[1]; this.c[q + 2] = cb[2]; } }
      else this.quad(A[i], B[i], B[j], A[j], c);
    }
    if (caps) for (let i = 1; i < N - 1; i++) { this._tri(A[0], A[i], A[i + 1], c); this._tri(B[0], B[i + 1], B[i], c); }
    return this;
  }
  box(cx, cy, cz, sx, sy, sz, col, o = {}) { return this.beam([cx, cy - sy / 2, cz], [cx, cy + sy / 2, cz], sx, sz, col, { ch: 0, ...o, up: [0, 0, 1] }); }
  // cylinder / cone between a and b
  cyl(a, b, r, r2, n, col, o = {}) {
    const c = this.tint(col, o.k ?? 1), dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const d = [dx / L, dy / L, dz / L], up = Math.abs(d[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
    let s = [up[1] * d[2] - up[2] * d[1], up[2] * d[0] - up[0] * d[2], up[0] * d[1] - up[1] * d[0]];
    const sl = Math.hypot(s[0], s[1], s[2]) || 1; s = [s[0] / sl, s[1] / sl, s[2] / sl];
    const u = [d[1] * s[2] - d[2] * s[1], d[2] * s[0] - d[0] * s[2], d[0] * s[1] - d[1] * s[0]];
    const A = [], B = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU, cs = Math.cos(t), sn = Math.sin(t);
      A.push([a[0] + (s[0] * cs + u[0] * sn) * r, a[1] + (s[1] * cs + u[1] * sn) * r, a[2] + (s[2] * cs + u[2] * sn) * r]);
      B.push([b[0] + (s[0] * cs + u[0] * sn) * r2, b[1] + (s[1] * cs + u[1] * sn) * r2, b[2] + (s[2] * cs + u[2] * sn) * r2]);
    }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; this.quad(A[i], B[i], B[j], A[j], c); }
    if (o.caps ?? true) for (let i = 1; i < n - 1; i++) { this._tri(A[0], A[i], A[i + 1], c); this._tri(B[0], B[i + 1], B[i], c); }
    return this;
  }
  get tris() { return this.p.length / 9; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- crane dimensions (crane-local: x along quay, z toward water, origin on quay midway between rails) ----------
const CR = {
  legX: 13.5, legZ: 15, portalY: 23.6, topY: 58, girderY: 54.2, girderX: 4.2, hingeZ: 18, boomLen: 70,
  backZ: -40, apexY: 80, apexZ: 13, trolleyY: 52.3, railZ: -20,
};

// fixed frame of one crane
async function buildCraneFrame(rng, C, pause) {
  const G = new Geo(rng), { legX: LX, legZ: LZ, portalY: PY, topY: TY, girderY: GY, girderX: GX } = CR;
  const red = C.red, dark = C.dark, grey = C.grey, white = C.white, yel = C.yellow, r0 = rng, xr = lcg(7717);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * LX, z = sz * LZ;
    // bogies: equaliser beams and wheel trucks
    G.beam([x - 7.5, 3.1, z], [x + 7.5, 3.1, z], 1.5, 1.3, red, { ch: 0.25 });
    for (const bx of [-5.2, 5.2]) {
      G.beam([x + bx - 2.6, 1.9, z], [x + bx + 2.6, 1.9, z], 1.25, 1.1, dark, { ch: 0.25 });
      G.box(x + bx, 2.6, z, 0.9, 0.9, 1.0, red);
      for (const wx of [-1.7, -0.6, 0.6, 1.7]) {
        G.cyl([x + bx + wx, 0.62, z - 0.32], [x + bx + wx, 0.62, z + 0.32], 0.5, 0.5, 10, dark, { k: 0.7 });
        G.cyl([x + bx + wx, 0.62, z - 0.42], [x + bx + wx, 0.62, z + 0.42], 0.24, 0.24, 6, grey, { k: 1.25 });       // hubs
      }
      G.box(x + bx, 1.25, z + sz * 0.72, 4.9, 0.5, 0.08, yel, { k: 0.8 });                                            // wheel guard
      G.rng = xr;
      for (let k = 0; k < 6; k++) {                                                                                   // hazard stripes on the guard
        const x0 = x + bx - 2.3 + k * 0.8, zf = z + sz * 0.77, col = G.tint(dark, 1.2);
        const a = [x0, 1.0, zf], b = [x0 + 0.36, 1.0, zf], c = [x0 + 0.66, 1.5, zf], d = [x0 + 0.3, 1.5, zf];
        if (sz > 0) G.quad(a, b, c, d, col); else G.quad(b, a, d, c, col);
      }
      for (const wx of [-1.7, -0.6, 0.6, 1.7]) G.cyl([x + bx + wx, 0.62, z - sz * 0.38], [x + bx + wx, 0.62, z - sz * 0.3], 0.62, 0.62, 8, grey, { k: 0.8 });   // wheel flanges
      for (const wx of [-1.15, 1.15]) { G.box(x + bx + wx, 1.2, z - sz * 0.66, 0.7, 0.55, 0.14, grey, { k: 0.9 }); G.box(x + bx + wx, 1.5, z, 0.3, 0.3, 1.36, yel, { k: 0.7 }); }   // axle boxes, spring seats
      G.box(x + bx, 2.55, z - sz * 0.68, 2.2, 0.6, 0.2, grey, { ch: 0.2, k: 1.1 });                                    // gearbox cover
      G.rng = r0;
      G.box(x + bx, 3.05, z, 1.5, 0.5, 1.9, dark, { k: 1.5 });                                                        // equaliser pin housing
    }
    G.box(x, 4.3, z + sz * 1.05, 1.6, 1.1, 0.5, grey, { ch: 0.1 });                                                   // travel motor
    G.cyl([x + sx * 7.2, 3.9, z], [x + sx * 7.2, 4.9, z], 0.09, 0.09, 5, dark, { k: 1.5 });                            // beacon post
    for (const ex of [-7.9, 7.9]) { G.box(x + ex, 3.1, z, 0.5, 1.5, 1.7, yel); G.box(x + ex * 1.03, 2.2, z, 0.35, 0.5, 0.8, dark);
      const e = Math.sign(ex); G.rng = xr;                                                                                        // sprung buffer and a rail clamp
      G.cyl([x + ex + e * 0.25, 3.3, z], [x + ex + e * 0.9, 3.3, z], 0.2, 0.2, 6, grey, { k: 1.2, caps: false });
      G.cyl([x + ex + e * 0.9, 3.3, z], [x + ex + e * 1.02, 3.3, z], 0.42, 0.42, 8, dark, { k: 1.5 });
      G.box(x + ex * 0.93, 0.75, z, 0.5, 1.1, 0.5, dark, { k: 1.6 }); G.box(x + ex * 0.93, 0.28, z, 0.7, 0.3, 0.9, yel, { k: 0.6 }); G.rng = r0; }
    // ladder from the sill walkway down to the quay at the outer end of each bogie
    { const lx = x + sx * 6.6, lz = z + sz * 0.95; G.rng = xr;
      for (const e of [-0.26, 0.26]) G.beam([lx + e, 0.5, lz], [lx + e, 6.2, lz], 0.07, 0.07, yel, { ch: 0, caps: false });
      for (let y = 0.9; y < 6.1; y += 0.65) G.beam([lx - 0.26, y, lz], [lx + 0.26, y, lz], 0.05, 0.05, yel, { ch: 0, caps: false }); G.rng = r0; }
    // legs: tapered box columns in three lifts with flange collars
    G.beam([x, 3.7, z], [x, PY - 1, z], 2.5, 2.9, red, { w2: 2.2, h2: 2.5, grime: 0.22, caps: false });
    G.beam([x, PY - 1, z], [x, TY, z], 2.2, 2.5, red, { w2: 1.8, h2: 2.0, caps: false });
    for (const cy of [8, PY - 2.2, PY + 1.6, 40, TY - 1.2]) G.box(x, cy, z, 2.75, 0.35, 3.1, red, { k: 0.8 });
    // knee braces under the portal beam (above 17 m, well outside the nave line)
    G.beam([x, PY - 6.5, z - sz * 1.2], [x, PY - 0.8, z - sz * 7], 0.8, 0.8, red, { ch: 0.2, caps: false });
    G.beam([x - sx * 1.2, PY - 6.5, z], [x - sx * 6.5, PY - 0.8, z], 0.8, 0.8, red, { ch: 0.2, caps: false });
  }
  await pause();
  for (const s of [-1, 1]) {
    // sill beams along the rails, portal beams and top beams
    G.beam([-LX, 5.0, s * LZ], [LX, 5.0, s * LZ], 1.7, 2.3, red, { grime: 0.2 });
    G.beam([-LX, PY, s * LZ], [LX, PY, s * LZ], 1.6, 2.2, red);
    G.beam([s * LX, PY, -LZ], [s * LX, PY, LZ], 1.8, 2.3, red);
    G.beam([s * LX, TY, -LZ], [s * LX, TY, LZ], 1.5, 1.9, red);
    G.beam([-LX, TY + 1.6, s * LZ], [LX, TY + 1.6, s * LZ], 1.5, 2.0, red);
    // big diagonals in the side frames (tubes), with a pair of struts
    G.cyl([s * LX, PY + 1.2, -LZ + 1], [s * LX, TY - 1.2, LZ - 1], 0.62, 0.62, 8, red, { caps: false });
    G.cyl([s * LX, PY + 1.2, LZ - 1], [s * LX, 41, 0.6], 0.42, 0.42, 6, red, { caps: false });
    G.cyl([s * LX, TY - 1.0, -LZ + 1], [s * LX, 41, -0.6], 0.42, 0.42, 6, red, { caps: false });
    // hazard chevrons on both faces of the sill beams, a walkway and handrail along the top
    for (const f of [-1, 1]) {
      const zf = s * LZ + f * 0.87;
      for (let k = 0; k < 20; k++) {
        const x0 = -11.5 + k * 1.15, col = G.tint(k % 2 ? dark : yel, k % 2 ? 1.3 : 1.05);
        const a = [x0, 3.95, zf], b = [x0 + 1.15, 3.95, zf], c = [x0 + 1.75, 4.8, zf], d = [x0 + 0.6, 4.8, zf];
        if (f > 0) G.quad(a, b, c, d, col); else G.quad(b, a, d, c, col);
      }
    }
    G.box(0, 6.2, s * LZ, 23, 0.08, 2.1, grey, { k: 0.7 });
    for (const [xa, xb] of (s > 0 ? [[-11, -6.2], [0, 11]] : [[-11, 0.8], [9.2, 11]])) {
      const zr = s * (LZ + 0.98);
      G.beam([xa, 7.3, zr], [xb, 7.3, zr], 0.09, 0.09, yel, { ch: 0, caps: false });
      G.beam([xa, 6.75, zr], [xb, 6.75, zr], 0.06, 0.06, yel, { ch: 0, caps: false });
      for (let xq = xa; xq <= xb + 0.01; xq += (xb - xa) / Math.max(1, Math.round((xb - xa) / 2.4))) G.beam([xq, 6.2, zr], [xq, 7.3, zr], 0.08, 0.08, yel, { ch: 0, caps: false });
    }
    // access ladder up the east leg to the portal level
    if (s > 0) { const lx = LX + 1.4, lz = s * LZ;
      for (const e of [-0.28, 0.28]) G.beam([lx, 6.3, lz + e], [lx, PY - 1.2, lz + e], 0.07, 0.07, yel, { ch: 0, caps: false });
      for (let y = 6.8; y < PY - 1.4; y += 0.75) G.beam([lx, y, lz - 0.28], [lx, y, lz + 0.28], 0.05, 0.05, yel, { ch: 0, caps: false }); }
    // hangers from the top cross beams down to the trolley girders
    for (const z of [-LZ, LZ]) G.beam([s * GX * 1.25, TY + 1, z], [s * GX * 1.05, GY + 1.2, z], 0.7, 0.9, red, { caps: false });
    // fixed trolley girder (backreach + inboard span) with cross ribs and a walkway outside
    G.beam([s * GX, GY, CR.backZ], [s * GX, GY, CR.hingeZ - 0.4], 1.35, 2.6, red, { ch: 0.12 });
    G.box(s * (GX + 1.45), GY + 1.0, (CR.backZ + CR.hingeZ) / 2, 1.3, 0.12, CR.hingeZ - CR.backZ - 1, grey, { k: 0.8 });
    G.beam([s * (GX + 2.05), GY + 2.1, CR.backZ + 0.5], [s * (GX + 2.05), GY + 2.1, CR.hingeZ - 1], 0.09, 0.09, yel, { ch: 0, caps: false });
    for (let z = CR.backZ + 0.5; z < CR.hingeZ; z += 4.7) G.beam([s * (GX + 2.05), GY + 1.0, z], [s * (GX + 2.05), GY + 2.1, z], 0.08, 0.08, yel, { ch: 0, caps: false });
    for (let z = CR.backZ + 3; z < CR.hingeZ - 1; z += 5.5) G.box(s * GX, GY, z, 1.55, 2.75, 0.22, red, { k: 0.82 });
    // hinge cheeks
    G.box(s * (GX + 0.9), GY + 0.2, CR.hingeZ - 0.2, 0.35, 3.4, 3.0, red, { k: 0.85 });
    // A-frame: front legs, back legs, tie rods to the backreach
    G.beam([s * 5.2, TY + 2.4, LZ], [s * 1.6, CR.apexY, CR.apexZ], 1.3, 1.5, red, { w2: 0.9, h2: 1.1, caps: false });
    G.beam([s * 5.2, TY + 2.4, -LZ], [s * 1.6, CR.apexY - 0.4, CR.apexZ - 1.2], 1.1, 1.3, red, { w2: 0.8, h2: 1.0, caps: false });
    G.cyl([s * 1.6, CR.apexY - 0.6, CR.apexZ - 1], [s * GX, GY + 1.5, CR.backZ + 2], 0.3, 0.3, 6, red, { caps: false });
    G.beam([s * 4.1, 66, 14.6], [s * 4.2, 65.2, -9.4], 0.5, 0.5, red, { ch: 0.2, caps: false });
  }
  await pause();
  // girder ties, backreach end frame, plan bracing
  for (let z = CR.backZ + 1; z < CR.hingeZ; z += 9.5) G.beam([-GX, GY + 1.0, z], [GX, GY + 1.0, z], 0.6, 0.7, red, { ch: 0.2, caps: false });
  G.beam([-GX - 0.7, GY - 0.4, CR.backZ], [GX + 0.7, GY - 0.4, CR.backZ], 1.0, 3.0, red);
  G.box(0, GY - 2.6, CR.backZ - 0.3, 10.5, 1.4, 0.5, yel, { k: 0.9 });
  // A-frame head: cross beams, sheave house, mast
  G.beam([-1.9, CR.apexY, CR.apexZ], [1.9, CR.apexY, CR.apexZ], 1.5, 1.6, red);
  G.beam([-4.3, 66, 14.6], [4.3, 66, 14.6], 0.6, 0.6, red, { caps: false });
  G.beam([-4.3, 65.2, -9.4], [4.3, 65.2, -9.4], 0.6, 0.6, red, { caps: false });
  for (const sx of [-1, 1]) G.cyl([sx * 0.9, CR.apexY + 0.9, CR.apexZ - 1.2], [sx * 0.9, CR.apexY + 0.9, CR.apexZ + 1.2], 1.15, 1.15, 10, dark, { k: 1.3 });
  G.cyl([0, CR.apexY + 0.8, CR.apexZ - 0.8], [0, CR.apexY + 5.2, CR.apexZ - 0.8], 0.16, 0.1, 5, grey);
  G.box(0, CR.apexY + 1.0, CR.apexZ - 0.8, 3.4, 0.12, 2.4, grey);
  // machinery house on the backreach: body, roof, vents, door, window band
  const hz = -27, hy = GY + 1.6;
  G.box(0, hy + 3.4, hz, 12.4, 6.8, 17, white, { ch: 0.03 });
  G.beam([0, hy + 7.0, hz - 8.9], [0, hy + 7.0, hz + 8.9], 13.2, 0.5, grey, { ch: 0.3 });
  G.beam([0, hy + 7.5, hz - 8.2], [0, hy + 7.5, hz + 8.2], 6.5, 0.6, grey, { ch: 0.3, k: 0.9 });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) G.box(s * 6.25, hy + 4.4, hz - 6 + k * 4, 0.12, 1.5, 2.2, dark, { k: 1.4 });
    G.box(s * 6.25, hy + 1.3, hz + 7, 0.12, 2.3, 1.1, red, { k: 0.8 });
    G.box(s * 3.5, hy + 8.2, hz - 4, 1.6, 1.0, 1.6, grey, { k: 0.8 });
  }
  G.box(0, hy + 0.1, hz, 13.6, 0.2, 18.4, grey, { k: 0.7 });
  // lashing / transfer platform at portal level (between the legs, above the nave) with rails
  G.box(0, PY + 0.95, 0.5, 19, 0.5, 23, grey, { k: 0.75 });
  for (const s of [-1, 1]) {
    G.beam([s * 9.4, PY + 2.2, -11], [s * 9.4, PY + 2.2, 12], 0.1, 0.1, yel, { ch: 0, caps: false });
    for (let z = -11; z <= 12; z += 4.6) G.beam([s * 9.4, PY + 1.2, z], [s * 9.4, PY + 2.2, z], 0.09, 0.09, yel, { ch: 0, caps: false });
    G.beam([s * 9.6, PY + 0.2, -9], [s * LX, PY + 0.2, -9], 0.5, 0.6, red, { caps: false });
    G.beam([s * 9.6, PY + 0.2, 9], [s * LX, PY + 0.2, 9], 0.5, 0.6, red, { caps: false });
  }
  await pause();
  // stair tower up the landside-east leg, lift shaft up the landside-west leg
  const sxp = LX + 1.9, szp = -LZ;
  for (let k = 0; k < 11; k++) {
    const y0 = 5.5 + k * 4.5, d = k % 2 ? -1 : 1;
    G.beam([sxp, y0, szp - d * 2.6], [sxp, y0 + 4.5, szp + d * 2.6], 1.0, 0.16, grey, { ch: 0, caps: false, k: 0.8 });
    G.box(sxp, y0 + 4.5, szp + d * 3.1, 1.3, 0.14, 1.2, grey, { k: 0.7 });
    G.beam([sxp + 0.55, y0 + 1.1, szp - d * 2.6], [sxp + 0.55, y0 + 5.6, szp + d * 2.6], 0.07, 0.07, yel, { ch: 0, caps: false });
  }
  G.beam([-LX - 2.2, 6, -LZ], [-LX - 2.2, 56, -LZ], 1.7, 1.9, grey, { ch: 0.1, k: 0.85 });
  for (let y = 9; y < 56; y += 6.5) G.box(-LX - 2.2, y, -LZ, 1.85, 0.25, 2.05, dark, { k: 1.5 });
  G.box(-LX - 2.2, 57, -LZ, 2.4, 1.8, 2.6, white);
  // cable reel on the waterside sill, electrical house on the landside sill, number board
  G.cyl([-3, 7.2, LZ - 1.4], [-3, 7.2, LZ + 1.4], 2.6, 2.6, 14, yel, { k: 0.85 });
  G.cyl([-3, 7.2, LZ - 1.55], [-3, 7.2, LZ + 1.55], 0.7, 0.7, 8, dark);
  for (const e of [-1, 1]) {
    G.cyl([-3, 7.2, LZ + e * 1.4], [-3, 7.2, LZ + e * 1.52], 2.9, 2.9, 14, yel, { k: 0.5 });
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; G.beam([-3, 7.2, LZ + e * 1.56], [-3 + Math.cos(a) * 3.0, 7.2 + Math.sin(a) * 3.0, LZ + e * 1.56], 0.22, 0.06, yel, { ch: 0, caps: false, k: 0.9 }); }
  }
  for (let k = 0; k < 9; k++) G.cyl([-3, 7.2, LZ - 1.2 + k * 0.3], [-3, 7.2, LZ - 1.08 + k * 0.3], 2.66, 2.66, 14, dark, { k: 1.1, caps: false });
  // reel stand, drive, hub caps and the trailing cable dropping through its guide into the quay slot
  G.rng = xr;
  for (const e of [-1, 1]) { G.beam([-5.6, 6.3, LZ + e * 1.75], [-3, 7.3, LZ + e * 1.75], 0.3, 0.3, red, { ch: 0.15, caps: false }); G.beam([-0.4, 6.3, LZ + e * 1.75], [-3, 7.3, LZ + e * 1.75], 0.3, 0.3, red, { ch: 0.15, caps: false });
    G.cyl([-3, 7.2, LZ + e * 1.56], [-3, 7.2, LZ + e * 1.86], 0.5, 0.42, 8, grey, { k: 1.2 }); }
  G.box(-0.6, 6.9, LZ + 2.3, 1.3, 1.1, 0.9, grey, { ch: 0.12, k: 0.9 });
  G.beam([-5.62, 7.0, LZ + 0.2], [-6.3, 1.2, LZ + 0.9], 0.16, 0.16, dark, { ch: 0, caps: false, k: 1.3 });
  G.box(-6.3, 0.9, LZ + 0.9, 0.7, 1.0, 0.7, yel, { k: 0.7 }); G.box(-6.3, 0.2, LZ + 0.9, 1.1, 0.3, 1.0, dark, { k: 1.5 });
  G.rng = r0;
  G.box(5, 7.6, -LZ, 7.5, 3.0, 2.8, grey, { ch: 0.05, k: 1.15 });
  G.box(5, 9.25, -LZ, 8.0, 0.25, 3.2, grey);
  G.rng = xr;
  for (const f of [-1, 1]) { const zf = -LZ + f * 1.43;
    G.box(2.4, 7.35, zf, 0.95, 2.1, 0.08, dark, { k: 1.5 }); G.box(2.72, 7.4, zf + f * 0.04, 0.08, 0.3, 0.06, yel);
    for (let q = 0; q < 3; q++) for (let l = 0; l < 4; l++) G.box(4.4 + q * 1.5, 7.9 + l * 0.22, zf, 1.1, 0.1, 0.1, dark, { k: 1.7 });
    G.box(5, 6.3, zf, 7.3, 0.28, 0.07, yel, { k: 0.8 }); }
  G.box(8.9, 7.6, -LZ, 0.1, 1.7, 1.5, dark, { k: 1.6 }); G.cyl([7.4, 9.4, -LZ], [7.4, 10.3, -LZ], 0.3, 0.3, 6, grey, { k: 0.8 });
  G.rng = r0;
  G.box(0, PY, LZ + 0.86, 5.0, 1.5, 0.12, white);
  // flood lamp housings under the portal beams
  for (const sx of [-1, 1]) for (const z of [-8, 8]) G.box(sx * (LX - 1.3), PY - 1.45, z, 0.9, 0.5, 1.4, dark, { k: 1.3 });
  return G;
}

// the hinged boom: origin at the hinge pin, runs out along +z
function buildBoom(rng, C) {
  const G = new Geo(rng), GX = CR.girderX, L = CR.boomLen, red = C.red, yel = C.yellow, grey = C.grey, dark = C.dark;
  for (const s of [-1, 1]) {
    // twin box girders tapering to the tip, with rib plates
    G.beam([s * GX, 0, 0.4], [s * GX, 0.35, L], 1.35, 2.6, red, { w2: 1.1, h2: 1.7, ch: 0.12 });
    for (let z = 4; z < L - 2; z += 5.5) { const t = z / L; G.box(s * GX, t * 0.35, z, 1.5 - 0.25 * t, 2.75 - 0.9 * t, 0.22, red, { k: 0.82 }); }
    // walkway and handrail on the outside
    G.box(s * (GX + 1.35), 1.0, L / 2, 1.1, 0.1, L - 2, grey, { k: 0.8 });
    G.beam([s * (GX + 1.9), 2.1, 1], [s * (GX + 1.9), 2.1, L - 1], 0.09, 0.09, yel, { ch: 0, caps: false });
    for (let z = 1; z < L; z += 4.6) G.beam([s * (GX + 1.9), 1.0, z], [s * (GX + 1.9), 2.1, z], 0.08, 0.08, yel, { ch: 0, caps: false });
    // forestay lugs
    for (const z of [30, 60]) { G.beam([s * GX, 1.0, z - 1.4], [s * GX, 4.0, z], 0.5, 0.9, red, { caps: false }); G.beam([s * GX, 1.0, z + 1.4], [s * GX, 4.0, z], 0.5, 0.9, red, { caps: false }); }
    // hinge knuckle
    G.cyl([s * (GX - 0.9), 0, 0], [s * (GX + 0.7), 0, 0], 1.25, 1.25, 10, dark, { k: 1.3 });
  }
  // ties between the girders and zig-zag plan bracing: the lattice seen from below
  let flip = 1;
  for (let z = 3; z < L - 3; z += 6.6) {
    G.beam([-GX, 1.05, z], [GX, 1.05, z], 0.55, 0.6, red, { ch: 0.2, caps: false });
    G.beam([-GX * flip, 1.1, z], [GX * flip, 1.1, z + 6.6], 0.3, 0.3, red, { ch: 0, caps: false, k: 0.9 });
    flip = -flip;
  }
  for (const z of [30, 60]) G.beam([-GX, 3.9, z], [GX, 3.9, z], 0.5, 0.5, red, { ch: 0.2, caps: false });
  // head: end frame, buffers, beacon post
  G.beam([-GX - 0.8, 0.3, L], [GX + 0.8, 0.3, L], 1.0, 2.2, red);
  for (const s of [-1, 1]) G.box(s * GX, -0.9, L - 0.6, 0.9, 0.9, 1.3, yel);
  G.box(0, -1.1, L + 0.3, 8.0, 0.9, 0.3, yel, { k: 0.9 });
  G.cyl([0, 1.2, L], [0, 4.6, L], 0.14, 0.09, 5, grey);
  return G;
}

// trolley: origin at the rail level centre; operator cab hangs below on the +x side
function buildTrolley(rng, C) {
  const G = new Geo(rng), red = C.red, dark = C.dark, grey = C.grey, white = C.white, yel = C.yellow;
  G.box(0, -0.2, 0, 10.6, 0.9, 7.2, grey, { ch: 0.08, k: 0.8 });
  for (const s of [-1, 1]) {
    G.beam([s * 4.2, -0.1, -4.1], [s * 4.2, -0.1, 4.1], 1.7, 1.3, red, { ch: 0.2 });
    for (const z of [-3.2, 3.2]) G.cyl([s * 3.6, 0.6, z], [s * 4.8, 0.6, z], 0.55, 0.55, 8, dark);
    G.beam([s * 3.3, -0.8, -2.6], [s * 3.3, -0.8, 2.6], 0.5, 0.7, dark, { k: 1.3, caps: false });
  }
  G.box(0, 0.9, -0.6, 4.6, 1.5, 3.4, white, { ch: 0.1 });
  for (const z of [-2.2, 2.2]) G.cyl([-2.8, -0.7, z], [2.8, -0.7, z], 0.75, 0.75, 10, dark, { k: 1.25 });
  // cab hanger and cab with a sloped glass front
  G.beam([3.9, -0.6, 2.2], [3.9, -2.2, 2.6], 0.5, 0.5, red, { ch: 0, caps: false });
  G.beam([6.3, -0.6, 2.2], [6.3, -2.2, 2.6], 0.5, 0.5, red, { ch: 0, caps: false });
  G.box(5.1, -3.5, 2.6, 3.0, 2.6, 3.4, white, { ch: 0.1 });
  G.box(5.1, -2.1, 2.6, 3.3, 0.25, 3.8, red);
  G.box(5.1, -3.6, 4.33, 2.5, 1.7, 0.1, dark, { k: 0.6 });
  G.box(5.1, -4.75, 3.2, 2.4, 0.12, 2.0, dark, { k: 0.6 });
  G.box(5.1, -4.9, 2.6, 3.4, 0.2, 3.8, red, { k: 0.85 });
  return G;
}

// spreader: origin at the underside centre (twist-lock plane); 12.2 m long along x
function buildSpreader(rng, C) {
  const G = new Geo(rng), yel = C.yellow, dark = C.dark, red = C.red;
  for (const s of [-1, 1]) {
    G.beam([-5.9, 0.3, s * 1.05], [5.9, 0.3, s * 1.05], 0.34, 0.5, yel, { ch: 0.15 });
    G.beam([s * 6.0, 0.3, -1.25], [s * 6.0, 0.3, 1.25], 0.5, 0.6, yel, { ch: 0.15 });
    for (const z of [-1, 1]) {
      // corner flippers and twist-lock housings
      G.beam([s * 6.15, 0.5, z * 1.3], [s * 6.5, -0.45, z * 1.5], 0.3, 0.12, dark, { ch: 0, k: 1.4 });
      G.box(s * 5.85, 0.05, z * 1.1, 0.4, 0.35, 0.4, dark, { k: 1.2 });
    }
    G.beam([s * 2.0, 0.3, -1.05], [s * 2.0, 0.3, 1.05], 0.3, 0.4, yel, { ch: 0.1, caps: false });
  }
  G.box(0, 0.75, 0, 3.6, 0.6, 2.0, yel, { ch: 0.12, k: 0.9 });
  // headblock with sheaves
  G.box(0, 1.45, 0, 3.0, 0.8, 1.5, red, { ch: 0.15 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G.cyl([sx * 1.25, 1.95, sz * 0.5], [sx * 1.25, 1.95, sz * 0.75], 0.42, 0.42, 8, dark, { k: 1.3 });
  return G;
}

// driverless flat truck under the land spreader: origin on the ground, long axis x
function addTruck(G, x, z, C) {
  G.box(x, 1.25, z, 14.6, 0.5, 2.9, C.white, { ch: 0.2, k: 0.7 });
  G.box(x + 7.0, 1.05, z, 0.6, 0.7, 2.7, C.yellow);
  G.box(x - 7.0, 1.05, z, 0.6, 0.7, 2.7, C.yellow);
  for (const wx of [-5.2, -3.9, 3.9, 5.2]) for (const s of [-1, 1]) G.cyl([x + wx, 0.6, z + s * 0.95], [x + wx, 0.6, z + s * 1.45], 0.6, 0.6, 8, C.dark, { k: 0.7 });
  G.box(x, 0.8, z, 6.5, 0.5, 1.4, C.dark, { k: 1.2 });
}

// ---------- the ship ----------
const SHIP = { x0: -428, x1: -22, zc: 33.5, hb: 30.5, keel: -7, deck: 18.4, hatch: 20, pitch: 13, bay0: -390, nBays: 26, rowW: 2.5, nRows: 23 };
const shipFl = (v) => sstep(0.25, 1, v);
const shipBd = (s) => Math.max(0.012, (0.86 + 0.14 * sstep(0, 0.07, s)) * (s > 0.83 ? Math.pow(Math.max(0, 1 - Math.pow((s - 0.83) / 0.17, 2.4)), 0.9) : 1));
const shipBw = (s) => Math.max(0.012, (0.25 + 0.75 * sstep(0, 0.16, s)) * (s > 0.74 ? Math.max(0, 1 - Math.pow((s - 0.74) / 0.24, 1.7)) : 1));
const shipDk = (s) => SHIP.deck + 3.4 * sstep(0.885, 0.9, s);
const shipHalfAtX = (x) => SHIP.hb * shipBd((x - SHIP.x0) / (SHIP.x1 - SHIP.x0));

async function buildShip(rng, C, GL, lay, pause) {
  const S = SHIP, G = new Geo(rng), NS = 64, hull = C.hull;
  // lofted hull, smooth normals
  const pos = [], col = [], idx = [], NL = 12;
  const stat = (i) => { const t = i / NS; return THREE.MathUtils.lerp(t, 0.5 - 0.5 * Math.cos(Math.PI * t), 0.55); };
  const ring = (s, sgn) => {
    const dk = shipDk(s), ys = [S.keel, -6.3, -4.6, -2.6, 0.75, 1.0, 4.5, 8.5, 12.5, 16, dk - 1.3, dk], out = [];
    const streak = 0.86 + 0.28 * hash1(Math.floor(s * 90) + (sgn > 0 ? 7 : 3));
    for (let j = 0; j < NL; j++) {
      const y = ys[j], v = (y - S.keel) / (dk - S.keel), bil = v < 0.12 ? Math.sqrt(1 - (1 - v / 0.12) ** 2) : 1;
      const hb = S.hb * THREE.MathUtils.lerp(shipBw(s), shipBd(s), shipFl(v)) * bil;
      const x = S.x0 + s * (S.x1 - S.x0) - (1 - shipFl(v)) * 9 * sstep(0.86, 1, s) + (1 - v) * 7 * (1 - sstep(0, 0.1, s));
      pos.push(x, y, S.zc + sgn * hb);
      let c;
      if (y < 0.9) c = [C.antifoul.r * streak, C.antifoul.g * streak, C.antifoul.b * streak];
      else { const k = (j === NL - 2 ? 1.5 : 0.9 + 0.2 * hash1(j * 3.3)) * streak; c = [hull.r * k, hull.g * k, hull.b * k]; }
      col.push(c[0], c[1], c[2]);
      out.push([x, y, S.zc + sgn * hb]);
    }
    return out;
  };
  const tops = [];
  for (const sgn of [1, -1]) {
    const base = pos.length / 3; let prev = null;
    for (let i = 0; i <= NS; i++) {
      const r = ring(stat(i), sgn);
      if (sgn > 0) tops.push([r[NL - 1]]); else tops[i].push(r[NL - 1]);
      if (i === 0) (sgn > 0 ? (lay._tr = [r]) : lay._tr.push(r));
      if (prev) for (let j = 0; j < NL - 1; j++) {
        const a = base + (i - 1) * NL + j, b = base + i * NL + j;
        if (sgn > 0) idx.push(a, b, b + 1, a, b + 1, a + 1); else idx.push(a, b + 1, b, a, a + 1, b + 1);
      }
      prev = r;
    }
  }
  let hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  hullGeo.setIndex(idx); hullGeo.computeVertexNormals(); hullGeo = hullGeo.toNonIndexed();
  await pause();
  // deck plate and transom
  const dc = C.deck;
  for (let i = 1; i <= NS; i++) G.quad(tops[i - 1][0], tops[i][0], tops[i][1], tops[i - 1][1], G.tint(dc, 0.8 + 0.3 * hash1(i)));
  const [tS, tP] = lay._tr;
  for (let j = 0; j < NL - 1; j++) G.quad(tP[j], tS[j], tS[j + 1], tP[j + 1], G.tint(hull, j === NL - 2 ? 1.5 : 1));
  // bulwark rail along both sides and rust streaks on the flat of the side
  const rust = new THREE.Color('#5a3222');
  for (const sgn of [-1, 1]) {
    for (let i = 1; i <= NS; i++) { const a = tops[i - 1][sgn > 0 ? 0 : 1], b = tops[i][sgn > 0 ? 0 : 1]; if (Math.abs(a[1] - b[1]) < 0.5) G.beam([a[0], a[1] + 1.1, a[2] - sgn * 0.2], [b[0], b[1] + 1.1, b[2] - sgn * 0.2], 0.12, 0.12, C.white, { ch: 0, caps: false, k: 0.8 }); }
    for (let k = 0; k < 46; k++) {
      const x = -400 + rng() * 300, len = 3 + rng() * 9, w = 0.25 + rng() * 0.5, z = S.zc + sgn * (S.hb + 0.04), y1 = S.deck - 0.2;
      const a = [x - w, y1, z], b = [x + w, y1, z], c = [x + w * 0.3, y1 - len, z], d = [x - w * 0.3, y1 - len, z];
      if (sgn > 0) G.quad(a, d, c, b, G.tint(rust, 0.5 + rng() * 0.5)); else G.quad(a, b, c, d, G.tint(rust, 0.5 + rng() * 0.5));
    }
    // anchor in its pocket near the bow
    G.box(-52, 12.5, S.zc + sgn * (shipHalfAtX(-52) - 0.6), 3.2, 4.2, 1.2, C.dark, { ch: 0.25, k: 1.2 });
    // pilot door and a row of scuppers
    G.box(-230, 4.2, S.zc + sgn * (S.hb + 0.03), 2.4, 2.8, 0.1, C.dark, { k: 0.7 });
    // paint on the flat of the side: a pale sheer stripe under the deck edge, draft marks, a load line, tug push marks
    { const r0 = G.rng, zf = S.zc + sgn * (S.hb + 0.06); G.rng = lcg(4421 + sgn);
      for (let x = -398; x < -96; x += 15.1) G.box(x + 7.4, 15.6, zf, 14.9, 0.55, 0.08, C.white, { k: 0.55 });
      for (const dx of [-392, -246, -104]) for (let q = 0; q < 9; q++) G.box(dx, 1.7 + q * 1.15, zf, q % 2 ? 0.55 : 0.9, 0.3, 0.08, C.white, { k: 0.8 });
      G.box(-239, 5.4, zf, 2.6, 0.22, 0.08, C.white, { k: 0.8 }); G.box(-239, 5.4, zf, 0.22, 2.2, 0.08, C.white, { k: 0.8 });
      for (const tx of [-352, -150]) { G.box(tx, 6.5, zf, 0.25, 5.0, 0.08, C.white, { k: 0.7 }); G.box(tx, 8.8, zf, 3.0, 0.25, 0.08, C.white, { k: 0.7 }); }
      G.rng = r0; }
  }
  await pause();
  // hatch covers, lashing bridges
  const cols = [];
  for (let k = 0; k < S.nBays; k++) {
    if (k % 6 === 5) await pause();
    const x = S.bay0 + k * S.pitch;
    if (k === lay.bridgeBay || k === lay.funnelBay) continue;
    const hw = Math.min(S.hb - 2.2, shipHalfAtX(x + 6.5) - 2.4);
    G.box(x, (S.deck + S.hatch) / 2, S.zc, 12.5, S.hatch - S.deck, hw * 2, C.deck, { k: 1.25 });
    for (const e of [-1, 1]) if (hw > 12) {
      const bx = x + e * 6.5;
      G.box(bx, S.hatch + 6.5, S.zc, 0.45, 13, hw * 2 + 1.5, C.grey, { k: 0.75 });
      G.box(bx, S.hatch + 13.1, S.zc, 0.9, 0.2, hw * 2 + 2.6, C.yellow, { k: 0.7 });
    }
    const crane = k % 5 === 0 ? k / 5 : -1, base = 8.4 + 1.5 * Math.sin(k * 0.9 + lay.hOff) + (rng() - 0.5);
    const slope = rng.range(-0.25, 0.25), row = [];
    for (let r = 0; r < S.nRows; r++) {
      const dz = (r - 11) * S.rowW;
      if (Math.abs(dz) + 1.25 > hw) { row.push(0); continue; }
      let t;
      if (crane >= 0) t = Math.round(THREE.MathUtils.clamp(1.5 + (r / 22) * 4.5 * (lay.fromQuay[crane] ? 1 : -1) + (lay.fromQuay[crane] ? 0 : 4.5) + rng.range(-0.8, 0.8), 1, 6));
      else t = Math.round(THREE.MathUtils.clamp(base + slope * (r - 11) * 0.2 + rng.range(-0.9, 0.9) - (Math.abs(r - 11) > 9 ? 1 : 0), 4, k >= 18 && k <= 22 ? (k <= 19 ? 7 : 6) + Math.floor(hash1(k * 7.3 + Math.floor(r / 4) * 3.1 + 0.7) * 2.99) : k > 22 ? 8 : 10));   // lower beside and ahead of the ridden trolley: the view east stays open
      row.push(t);
      cols.push({ x, z: S.zc + dz, y: S.hatch, t, seed: k * 31.7 + r * 5.13 + lay.hOff * 9 });
    }
    if (crane >= 0) lay.rowTiers[crane] = row;
  }
  await pause();
  // ----- superstructure (bridge island) -----
  const bx = S.bay0 + lay.bridgeBay * S.pitch, wh = C.white;
  let y = S.deck; const nDeck = 11;
  for (let d = 0; d < nDeck; d++) {
    const wz = d === 0 ? 56 : d < nDeck - 1 ? 44 - (d % 2) * 1.2 : 30, lx = d < nDeck - 1 ? 11.6 - (d % 2) * 0.8 : 9, h = d === 0 ? 4 : 3.3;
    G.box(bx, y + h / 2, S.zc, lx, h, wz, wh, { ch: 0.04, k: 0.95 + 0.1 * (d % 2) });
    G.box(bx, y + h, S.zc, lx + 1.4, 0.22, wz + 1.6, wh, { k: 0.7 });
    if (d > 0 && d < nDeck - 1) for (const f of [-1, 1]) {
      // window bands: lit panes on the glow mesh, dark band behind
      G.box(bx + f * (lx / 2 + 0.03), y + 1.9, S.zc, 0.06, 1.0, wz - 4, C.dark, { k: 0.8 });
      for (let w = 0; w < 14; w++) if (rng() < 0.42) GL.box(bx + f * (lx / 2 + 0.09), y + 1.9, S.zc - wz / 2 + 3.5 + w * ((wz - 7) / 13), 0.06, 0.8, 1.3, C.lampWarm, { k: 0.6 + rng() * 0.8 });
    }
    y += h;
  }
  // wheelhouse with wings, glass band, monkey island, radar mast
  G.box(bx, y + 1.7, S.zc, 9.5, 3.4, 40, wh, { ch: 0.05 });
  G.box(bx, y + 0.2, S.zc, 7.0, 0.5, 65, wh, { k: 0.85 });
  for (const s of [-1, 1]) { G.box(bx, y + 1.5, S.zc + s * 30.5, 6.4, 2.6, 4.0, wh, { ch: 0.08 }); G.beam([bx, y - 6, S.zc + s * 22], [bx, y - 0.1, S.zc + s * 30], 0.5, 0.5, wh, { caps: false, k: 0.8 }); }
  for (const f of [-1, 1]) { G.box(bx + f * 4.78, y + 2.2, S.zc, 0.06, 1.3, 38, C.dark, { k: 0.7 }); GL.box(bx + f * 4.83, y + 2.2, S.zc, 0.05, 1.0, 36, C.lampCool, { k: 0.22 }); }
  G.box(bx, y + 3.55, S.zc, 10.6, 0.3, 42, wh, { k: 0.75 });
  const my = y + 3.7;
  G.beam([bx, my, S.zc], [bx, my + 11, S.zc], 1.6, 1.6, wh, { w2: 0.7, h2: 0.7, ch: 0.2 });
  G.beam([bx, my + 5, S.zc - 5], [bx, my + 5, S.zc + 5], 0.4, 0.4, wh, { caps: false });
  G.beam([bx, my + 8.2, S.zc - 3], [bx, my + 8.2, S.zc + 3], 0.3, 0.3, wh, { caps: false });
  for (const s of [-1, 1]) { G.box(bx, my + 5.6, S.zc + s * 4.2, 0.5, 0.5, 3.4, wh, { k: 1.1 }); G.cyl([bx - 2.5, my, S.zc + s * 9], [bx - 2.5, my + 2.4, S.zc + s * 9], 1.3, 1.1, 10, wh); }
  lay.bridgeTop = [bx, my + 11, S.zc]; lay.bridgeY = y;
  await pause();
  // ----- engine casing and funnel -----
  const fx = S.bay0 + lay.funnelBay * S.pitch;
  G.box(fx, S.deck + 13, S.zc, 11.5, 26, 30, wh, { ch: 0.04, k: 0.9 });
  for (let d = 1; d < 8; d++) G.box(fx, S.deck + d * 3.3, S.zc, 12.6, 0.2, 31.5, wh, { k: 0.7 });
  for (let d = 1; d < 8; d++) for (const f of [-1, 1]) for (let w = 0; w < 8; w++) if (rng() < 0.25) GL.box(fx + f * 5.82, S.deck + d * 3.3 - 1.4, S.zc - 12 + w * 3.4, 0.06, 0.8, 1.2, C.lampWarm, { k: 0.5 + rng() * 0.7 });
  const fy = S.deck + 26;
  G.beam([fx, fy, S.zc], [fx - 1.2, fy + 13, S.zc], 9, 13, C.funnel, { w2: 7, h2: 10, ch: 0.3 });
  G.beam([fx - 0.45, fy + 5, S.zc], [fx - 0.75, fy + 8.2, S.zc], 8.4, 12.2, C.accent, { w2: 7.9, h2: 11.4, ch: 0.3, caps: false, k: 0.75 });
  for (const s of [-1, 0, 1]) G.cyl([fx - 1.2, fy + 13, S.zc + s * 2.6], [fx - 1.6, fy + 15.6, S.zc + s * 2.6], 0.85, 0.75, 8, C.dark);
  lay.funnelTop = [fx - 1.6, fy + 15.6, S.zc]; lay.whistle = [fx + 2.5, fy + 9, S.zc];
  // forecastle: breakwater, winches, foremast; stern: winches, staff
  const fcx = -62 + (S.pitch === 13 ? 0 : 0), fdk = S.deck + 3.4;
  for (const s of [-1, 1]) {
    G.beam([-55, S.hatch + 1.6, S.zc + s * 0.4], [-60, S.hatch + 1.6, S.zc + s * (shipHalfAtX(-60) - 1)], 0.4, 3.2, C.deck, { k: 1.4, ch: 0 });
    G.cyl([-47, fdk + 1.2, S.zc + s * 5 - 2.2], [-47, fdk + 1.2, S.zc + s * 5 + 2.2], 1.2, 1.2, 10, C.grey);
    G.box(-47, fdk + 0.5, S.zc + s * 5, 3.4, 1.0, 5.4, C.dark, { k: 1.4 });
    G.cyl([-420, S.deck + 1.2, S.zc + s * 12 - 2.2], [-420, S.deck + 1.2, S.zc + s * 12 + 2.2], 1.2, 1.2, 10, C.grey);
    G.box(-420, S.deck + 0.5, S.zc + s * 12, 3.4, 1.0, 5.4, C.dark, { k: 1.4 });
  }
  G.beam([-38, fdk, S.zc], [-38, fdk + 13, S.zc], 0.9, 0.9, wh, { w2: 0.4, h2: 0.4, ch: 0.2 });
  G.beam([-38, fdk + 9, S.zc - 2.5], [-38, fdk + 9, S.zc + 2.5], 0.25, 0.25, wh, { caps: false });
  G.beam([-426, S.deck, S.zc], [-427.5, S.deck + 6, S.zc], 0.2, 0.2, wh, { ch: 0, caps: false });
  lay.foremast = [-38, fdk + 13, S.zc];
  // mooring lines to the quay bollards (thin rope prisms)
  const rope = new THREE.Color('#9a8f78');
  const line = (ax, ay, az, bxq) => G.beam([ax, ay, az], [bxq, 0.9, -1.2], 0.2, 0.2, rope, { ch: 0, caps: false });
  if (lay.moored !== false) { line(-34, fdk + 0.6, S.zc - shipHalfAtX(-34), -12); line(-36, fdk + 0.6, S.zc - shipHalfAtX(-36), -18);
  line(-50, fdk + 0.6, 6.5, -76); line(-417, S.deck + 0.6, 6.5, -452); line(-421, S.deck + 0.6, 7.5, -446); line(-405, S.deck + 0.6, 3.2, -372); }
  await pause();
  // ----- later additions to the island and the casing, from private streams (the seeded layout above stays as it was):
  // window rows on every face, railings on the open decks, zig-zag stairs aft, orange lifeboats in davits, wing rails, a signal yard
  { const r0 = G.rng, g0 = GL.rng, pr = lcg(7741); G.rng = lcg(7743); GL.rng = lcg(7745);
    const orange = new THREE.Color('#d8541a'), glass = new THREE.Color('#22303f');
    let yy = S.deck;
    for (let d = 0; d < nDeck; d++) {
      const wz = d === 0 ? 56 : d < nDeck - 1 ? 44 - (d % 2) * 1.2 : 30, lx = d < nDeck - 1 ? 11.6 - (d % 2) * 0.8 : 9, h = d === 0 ? 4 : 3.3;
      if (d > 0 && d < nDeck - 1) {
        for (const f of [-1, 1]) {
          for (let w = 0; w < 13; w++) if (pr() < 0.5) GL.box(bx + f * (lx / 2 + 0.09), yy + 1.9, S.zc - wz / 2 + 3.5 + (w + 0.5) * ((wz - 7) / 13), 0.06, 0.8, 1.2, pr() < 0.8 ? C.lampWarm : C.lampCool, { k: 0.5 + pr() * 0.7 });
          // the end faces, the ones the basin sees: a glass band and lit cabins
          G.box(bx, yy + 1.9, S.zc + f * (wz / 2 + 0.03), lx - 2.2, 1.0, 0.06, glass, { k: 1 });
          for (let w = 0; w < 5; w++) if (pr() < 0.62) GL.box(bx - 3.6 + w * 1.8, yy + 1.9, S.zc + f * (wz / 2 + 0.09), 1.2, 0.8, 0.06, C.lampWarm, { k: 0.5 + pr() * 0.8 });
        }
      }
      if (d < nDeck - 1) for (const f of [-1, 1]) {
        const rx = bx + f * (lx / 2 + 0.62), top = yy + h;
        G.beam([rx, top + 1.15, S.zc - wz / 2 - 0.7], [rx, top + 1.15, S.zc + wz / 2 + 0.7], 0.16, 0.16, wh, { ch: 0, caps: false, k: 0.62 });
        for (let q = 0; q <= 10; q++) { const z = S.zc - wz / 2 - 0.7 + q * (wz + 1.4) / 10; G.beam([rx, top + 0.1, z], [rx, top + 1.15, z], 0.14, 0.14, wh, { ch: 0, caps: false, k: 0.6 }); }
      }
      if (d > 0 && d < nDeck - 1) for (const s of [-1, 1]) {          // stairs down the aft face, a flight per deck, alternating
        const sx = bx - lx / 2 - 0.36, z0 = S.zc + s * (wz / 2 - 6.5), dir = d % 2 ? 1 : -1;
        G.beam([sx, yy + 0.2, z0 - dir * 2.4], [sx, yy + h + 0.1, z0 + dir * 2.4], 0.5, 0.9, C.grey, { ch: 0, k: 1.1, up: [1, 0, 0] });
      }
      yy += h;
    }
    await pause();
    // lifeboats: two a side under davits at the fourth deck, orange hulls with a paler canopy
    const ly = S.deck + 4 + 3.3 * 2.4;
    for (const s of [-1, 1]) {
      const lz = S.zc + s * (22 + 3.6);
      G.beam([bx - 5.4, ly, lz], [bx + 5.4, ly, lz], 3.3, 2.6, orange, { ch: 0.32, up: [0, 1, 0] });
      G.beam([bx - 3.6, ly + 1.5, lz], [bx + 3.6, ly + 1.5, lz], 2.5, 1.0, orange, { ch: 0.3, up: [0, 1, 0], k: 1.25 });
      for (const e of [-3.4, 3.4]) { G.beam([bx + e, ly + 4.4, S.zc + s * 21.5], [bx + e, ly + 4.0, lz + s * 0.6], 0.35, 0.35, wh, { ch: 0, caps: false, k: 0.7 }); G.beam([bx + e, ly + 4.0, lz], [bx + e, ly + 1.9, lz], 0.14, 0.14, C.dark, { ch: 0, caps: false }); }
      G.box(bx, ly - 1.75, S.zc + s * 24, 11.8, 0.25, 5.2, wh, { k: 0.7 });
    }
    // bridge wings: rails round the open wings, a signal yard on the mast with lamps
    const by = lay.bridgeY;
    for (const s of [-1, 1]) for (const f of [-1, 1]) {
      G.beam([bx + f * 3.4, by + 1.55, S.zc + s * 20.5], [bx + f * 3.4, by + 1.55, S.zc + s * 28.4], 0.16, 0.16, wh, { ch: 0, caps: false, k: 0.62 });
      for (let q = 0; q < 4; q++) G.beam([bx + f * 3.4, by + 0.45, S.zc + s * (20.5 + q * 2.6)], [bx + f * 3.4, by + 1.55, S.zc + s * (20.5 + q * 2.6)], 0.14, 0.14, wh, { ch: 0, caps: false, k: 0.6 });
    }
    G.beam([bx - 0.4, by + 3.7 + 9.4, S.zc - 6.5], [bx - 0.4, by + 3.7 + 9.4, S.zc + 6.5], 0.3, 0.3, wh, { ch: 0, caps: false });
    G.box(bx + 1.4, by + 3.7 + 6.1, S.zc, 1.0, 1.1, 1.0, C.grey, { k: 1.1 });                                  // the radar's pedestal (the world turns the scanner)
    for (const s of [-1, 1]) G.cyl([bx + 2.4, by + 3.7, S.zc + s * 14], [bx + 2.4, by + 3.7 + 1.9, S.zc + s * 14], 0.9, 0.75, 8, wh);
    // engine casing: window bands on all four faces, a dark cap on the funnel, ventilator cowls
    for (let d = 1; d < 8; d++) {
      const cy = S.deck + d * 3.3 - 1.4;
      for (const f of [-1, 1]) { G.box(fx + f * 5.79, cy, S.zc, 0.06, 0.95, 27, glass, { k: 1 }); G.box(fx, cy, S.zc + f * 15.04, 9, 0.95, 0.06, glass, { k: 1 });
        for (let w = 0; w < 4; w++) if (pr() < 0.5) GL.box(fx - 3 + w * 2, cy, S.zc + f * 15.1, 1.2, 0.75, 0.06, C.lampWarm, { k: 0.5 + pr() * 0.7 });
        for (let w = 0; w < 8; w++) if (pr() < 0.3) GL.box(fx + f * 5.86, cy, S.zc - 11.5 + w * 3.3, 0.06, 0.75, 1.2, C.lampWarm, { k: 0.5 + pr() * 0.7 }); }
    }
    G.beam([fx - 0.95, fy + 10.2, S.zc], [fx - 1.22, fy + 13.1, S.zc], 7.6, 10.9, C.dark, { w2: 7.2, h2: 10.3, ch: 0.3, k: 0.9 });
    for (const s of [-1, 1]) { G.cyl([fx + 4, fy, S.zc + s * 11], [fx + 4, fy + 3.2, S.zc + s * 11], 0.8, 0.8, 8, wh); G.box(fx + 4.6, fy + 3.5, S.zc + s * 11, 2.2, 1.5, 1.8, wh, { ch: 0.2 }); }
    G.rng = r0; GL.rng = g0; }
  await pause();
  const sg = G.build();
  await pause();
  sg.deleteAttribute('uv');
  return { hullGeo, deckGeo: sg, cols };
}

// ---------- quay: cope, wall, fenders, bollards, crane rails, optional wet apron ----------
function buildQuay(rng, C, apron, craneX) {
  const G = new Geo(rng), X0 = -475, X1 = 475, conc = C.concrete, dark = C.dark;
  G.jit = 0.1;
  for (let x = X0; x < X1; x += 19) {
    const xb = Math.min(X1, x + 19);
    if (apron) for (const [za, zb] of [[-72, -52], [-52, -36], [-36, -4], [-4, -2.6]]) G.quad([x, 0, za], [x, 0, zb], [xb, 0, zb], [xb, 0, za], G.tint(C.asphalt, 0.85 + 0.3 * rng()));
    G.beam([x + 0.05, -0.25, -1.3], [xb - 0.05, -0.25, -1.3], 2.6, 1.1, conc, { ch: 0.12, caps: false, up: [0, 1, 0] });
    G.quad([x, -0.8, 0], [xb, -0.8, 0], [xb, -2.2, 0], [x, -2.2, 0], G.tint(conc, 0.6));
    G.quad([x, -2.2, 0], [xb, -2.2, 0], [xb, -6, 0], [x, -6, 0], G.tint(conc, 0.28));
    if (apron) G.quad([xb, 0, -72], [x, 0, -72], [x, -4, -72], [xb, -4, -72], G.tint(conc, 0.5));
  }
  if (apron) {
    G.quad([X0, 0, -72], [X0, 0, 0], [X0, -6, 0], [X0, -6, -72], G.tint(conc, 0.5)); G.quad([X1, 0, 0], [X1, 0, -72], [X1, -6, -72], [X1, -6, 0], G.tint(conc, 0.5));
    G.jit = 0.03;
    for (const z of [-42, -47, -52, -57, -62, -67]) for (let x = X0 + 4; x < X1 - 20; x += 24) G.quad([x, 0.04, z - 0.1], [x, 0.04, z + 0.1], [x + 15, 0.04, z + 0.1], [x + 15, 0.04, z - 0.1], G.tint(C.yellow, 0.32));
    G.quad([X0, 0.04, -3.6], [X0, 0.04, -3.2], [X1, 0.04, -3.2], [X1, 0.04, -3.6], G.tint(C.yellow, 0.7));
  }
  G.jit = 0.07;
  for (const z of [-5, -35]) {
    G.beam([X0, 0.03, z], [X1, 0.03, z], 1.2, 0.06, dark, { ch: 0, caps: false, k: 0.8 });
    G.beam([X0, 0.1, z], [X1, 0.1, z], 0.22, 0.2, C.grey, { ch: 0.25, caps: false, k: 1.3 });
  }
  for (let x = X0 + 8; x < X1; x += 16) {
    G.cyl([x, -4.0, 0.75], [x, -0.7, 0.75], 0.85, 0.85, 9, dark, { k: 0.8 });
    G.box(x, -2.3, 0.15, 1.2, 3.0, 0.3, dark, { k: 1.2 });
  }
  for (let x = X0 + 5; x < X1; x += 21.5) {
    if (Math.abs(x - 6) < 16) continue;
    G.cyl([x, 0.3, -1.2], [x, 0.95, -1.2], 0.42, 0.34, 8, C.yellow, { k: 0.7 });
    G.cyl([x, 0.95, -1.2], [x, 1.2, -1.2], 0.6, 0.5, 8, C.yellow, { k: 0.8 });
  }
  const truckSpots = [];
  for (let i = 0; i < 6; i++) { addTruck(G, craneX[i], craneX.lane[i], C); truckSpots.push([craneX[i], 1.5, craneX.lane[i]]); }
  return { G, truckSpots };
}

// cold skylight fill built into the materials (albedo * uFill added as emissive) so shadow sides go steel-blue, not black
// mode 1 (crane frames) and 2 (booms) also take the crane's own sodium floods, worked out in the piece's local space:
// the four lamps under the portal beams light the legs, sills and bogies below them (the upper works stay silhouettes),
// and the lamps along a boom wash its girders, so a rising neck reads at night.
function addFill(mat, FILL, CRF, mode = 0) {
  if (mode) mat.defines = { ...(mat.defines || {}), CH_LOCAL: mode };
  mat.customProgramCacheKey = () => 'ch-fill-' + mode;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFill = FILL;
    if (!mode) {
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uFill;');
      return;
    }
    sh.uniforms.uCrF = CRF;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFl; varying vec3 vFn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFl = position; vFn = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill; uniform vec3 uCrF; varying vec3 vFl; varying vec3 vFn;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uFill;
        {
          vec3 fnn = normalize(vFn + vec3(0.0, 1e-4, 0.0));
        #if CH_LOCAL == 1
          vec3 fq = vec3(abs(vFl.x), vFl.y, abs(vFl.z));
          vec3 fnf = fnn * vec3(vFl.x < 0.0 ? -1.0 : 1.0, 1.0, vFl.z < 0.0 ? -1.0 : 1.0);
          vec3 fL = vec3(12.2, 21.75, 8.0) - fq; float fd2 = dot(fL, fL); vec3 fLd = fL * inversesqrt(max(fd2, 1e-3));
          float fl = (0.12 + 0.88 * max(dot(fnf, fLd), 0.0)) * smoothstep(-0.3, 0.4, fLd.y) / (1.0 + fd2 / 170.0);
          fl += (0.5 - 0.5 * fnf.y) * 0.2 * (1.0 - smoothstep(3.0, 26.0, vFl.y));          // amber thrown back up by the wet apron
        #else
          float fdz = abs(fract((vFl.z - 8.0) / 10.0 + 0.5) - 0.5) * 10.0;
          float fl = (0.1 + 0.9 / (1.0 + fdz * fdz / 5.0)) * (0.4 + 0.6 * abs(fnn.y)) * 0.26 * step(0.5, vFl.z);
        #endif
          totalEmissiveRadiance += diffuseColor.rgb * uCrF * fl;
        }`);
  };
  return mat;
}

// ---------- the ship's shell plating: a hull that is never a black blank. Its paint is lifted to a real albedo, broken into
// strakes and plates with seams and rust weeps, and it takes three lights of its own on top of the scene's: the sky's fill,
// the low sun raking along the plates (a wrapped term, so the flank that lies along the sun still catches it on every
// dished plate), and the sea's light rippling up the side from the waterline ----------
function makeHullMaterial(FILL, HU) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.46, metalness: 0.05 });
  mat.customProgramCacheKey = () => 'ch-hull';
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFill = FILL; sh.uniforms.uHSky = HU.sky; sh.uniforms.uHSun = HU.sun; sh.uniforms.uHDir = HU.sunDir; sh.uniforms.uHT = HU.time; sh.uniforms.uHSea = HU.sea;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHw; varying vec3 vHn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHw = (modelMatrix * vec4(position, 1.0)).xyz; vHn = mat3(modelMatrix) * normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform vec3 uFill, uHSky, uHSun, uHDir, uHSea; uniform float uHT; varying vec3 vHw; varying vec3 vHn;
      float chH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float chV(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(chH(i), chH(i+vec2(1.0,0.0)), f.x), mix(chH(i+vec2(0.0,1.0)), chH(i+vec2(1.0,1.0)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float hY = vHw.y, hFw = fwidth(vHw.x) + fwidth(vHw.y) + fwidth(vHw.z);
        float hS = hY / 2.6, hRow = floor(hS), hU = (vHw.x + vHw.z * 0.6) / 11.0 + hRow * 0.37;
        float hPl = chH(vec2(floor(hU), hRow));
        float hSeam = min(abs(fract(hS) - 0.5) * 2.6, abs(fract(hU) - 0.5) * 11.0);
        float hTop = step(0.9, hY);                                             // above the boot-topping
        diffuseColor.rgb = diffuseColor.rgb * mix(1.5, 2.5, hTop) + vec3(0.009, 0.013, 0.02) * hTop;
        diffuseColor.rgb *= (0.8 + 0.4 * hPl) * (1.0 - 0.45 * (1.0 - smoothstep(0.03, 0.09 + hFw, hSeam)) * (1.0 - smoothstep(0.02, 0.2, hFw)));
        // rust weeping down from the scuppers and the sheer line, salt bloom over the waterline
        float hW = chV(vec2(vHw.x * 0.55 + vHw.z * 0.3, 3.0)), hW2 = chV(vec2(vHw.x * 2.3 + vHw.z, hY * 0.12));
        float hRust = smoothstep(0.55, 0.8, hW) * smoothstep(0.3, 0.75, hW2) * smoothstep(2.0, 16.0, hY) * hTop;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.085, 0.04), 0.6 * hRust);
        float hSalt = (1.0 - smoothstep(0.9, 3.4 + 2.0 * chV(vec2(vHw.x * 0.21, 1.0)), hY)) * hTop;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.22, 0.24), 0.3 * hSalt);
        diffuseColor.rgb *= 1.0 - 0.35 * (1.0 - smoothstep(-2.6, -1.4, hY));             // the wet, weeded foot of the boot-topping`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 hN = normalize(vHn + vec3(0.0, 1e-4, 0.0));
          float hDish = 0.55 + 0.9 * chV(vec2((vHw.x + vHw.z * 0.6) * 0.16, vHw.y * 0.4));       // plates dished between the frames catch the raking light
          float hWrap = max(dot(hN, normalize(vec3(uHDir.x, 0.0, uHDir.z) + vec3(1e-4, 0.0, 0.0))) + 0.72, 0.0) / 1.72;
          vec3 hE = diffuseColor.rgb * (uFill + uHSky * (0.62 + 0.38 * hN.y) + uHSun * hWrap * hWrap * hDish);
          vec3 hV = normalize(cameraPosition - vHw + vec3(0.0, 1e-4, 0.0));
          float hF = 1.0 - min(abs(dot(hN, hV)), 1.0); hF = hF * hF * hF;
          hE += uHSun * (0.2 * hF * (0.35 + 0.65 * hDish) + 0.008 * hWrap * hDish) * step(0.9, vHw.y);    // gloss paint mirrors the gold horizon where the eye looks along the side
          // the sea's light: bright nets that ripple up the side and die out by the sheer
          float hA = chV(vec2(vHw.x * 0.11 + uHT * 0.21, vHw.y * 0.3 - uHT * 0.35));
          float hNet = 1.0 - abs(sin((vHw.x + vHw.z) * 0.42 + 5.0 * hA + uHT * 0.9));
          float hNet2 = 1.0 - abs(sin((vHw.x - vHw.z) * 0.17 - 4.0 * hA - uHT * 0.6 + vHw.y * 0.5));
          float hUp = exp(-max(vHw.y + 2.5, 0.0) / 6.5);
          hE += (diffuseColor.rgb + vec3(0.035)) * uHSea * (0.3 + 1.8 * hNet * hNet * hNet + 1.0 * hNet2 * hNet2 * hNet2 * hNet2) * hUp * (0.6 - 0.4 * hN.y);
          totalEmissiveRadiance += hE;
        }`);
  };
  return mat;
}

// ---------- containers: one unit box per column, cells / corrugation / doors drawn in the shader ----------
export function makeBoxMaterial(mosaic, dom, domW, FILL, X = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.15 });
  const uFrost = X.frost || { value: 0 }, uMute = X.mute || { value: 0 }, uGl = X.glint || { value: new THREE.Color(0, 0, 0) };
  if (X.flood) mat.defines = { ...(mat.defines || {}), CH_FLOOD: '' };
  if (X.deck) mat.defines = { ...(mat.defines || {}), CH_DECK: '' };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFrost = uFrost; sh.uniforms.uMute = uMute; sh.uniforms.uGl = uGl;
    if (X.flood) { sh.uniforms.uFlood = X.flood; sh.uniforms.uFront = X.front; sh.uniforms.uGrid = X.grid; sh.uniforms.uHeadB = X.head || { value: new THREE.Vector4(0, 0, 1, 0) }; }
    if (X.deck) { sh.uniforms.uDeckCol = X.deck.flood; sh.uniforms.uDeck = X.deck.grid; }
    sh.uniforms.uFill = FILL; sh.uniforms.uMos = { value: mosaic }; sh.uniforms.uDom = { value: new THREE.Vector2(dom, domW) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aDim; attribute float aSeed; varying vec3 vWp; varying vec3 vBox; varying vec3 vBN; flat varying vec3 vDim; flat varying float vSeed;')
      .replace('#include <begin_vertex>', 'vec3 transformed = position * aDim; vBox = transformed; vBN = normal; vDim = aDim; vSeed = aSeed;\n#ifdef USE_INSTANCING\n vWp = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\n vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uMos[6]; uniform vec2 uDom; uniform vec3 uFill; uniform vec3 uGl; uniform float uFrost; uniform float uMute; varying vec3 vWp;
        #ifdef CH_FLOOD
        uniform vec3 uFlood; uniform vec2 uFront; uniform vec4 uGrid; uniform vec4 uHeadB;
        #endif
        #ifdef CH_DECK
        uniform vec3 uDeckCol; uniform vec3 uDeck;
        #endif
        varying vec3 vBox; varying vec3 vBN; flat varying vec3 vDim; flat varying float vSeed;
        float chash(float n){ n = floor(n*64.0+0.5)/64.0; return fract(sin(mod(n, 311.0)*12.9898+4.137)*4375.85453); }
        float ch2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float cvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(ch2(i), ch2(i+vec2(1.0,0.0)), f.x), mix(ch2(i+vec2(0.0,1.0)), ch2(i+vec2(1.0,1.0)), f.x), f.y); }
        float cWet = 0.0; float cPud = 0.0;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float nT = max(1.0, floor(vDim.y/2.591 + 0.5));
          float tier = clamp(floor(vBox.y/2.591), 0.0, nT-1.0);
          float twenty = step(0.6, chash(vSeed*1.7 + tier*3.1));
          float seg = twenty * step(0.0, vBox.x);
          float h = chash(vSeed + tier*17.3 + seg*5.7), h2 = chash(vSeed*2.3 + tier*7.1 + seg*1.9);
          vec3 bc = uMos[int(min(5.0, floor(h2*6.0)))];
          if (h < uDom.y) bc = uMos[int(uDom.x)];
          bc *= 0.85 + 0.3*chash(h*91.0 + 0.37);
          bc *= min(1.0, 0.36 / max(bc.r, max(bc.g, bc.b)));
          // far stacks: pull the mosaic together (toward the dominant colour and steel blue) so it never turns to confetti
          // night and dusk: unlit paint loses its chroma, so blue boxes under blue skylight go to steel, not to primary blue
          { float lum = dot(bc, vec3(0.3, 0.5, 0.2)); bc = mix(bc, lum * vec3(0.84, 0.98, 1.16), uMute); }
          float farK = smoothstep(40.0, 210.0, length(vViewPosition));
          vec3 domC = uMos[int(uDom.x)]; domC *= min(1.0, 0.3 / max(domC.r, max(domC.g, domC.b)));
          bc = mix(bc, mix(domC, vec3(0.05, 0.098, 0.17), 0.45), 0.7 * farK);
          bc = mix(bc, vec3(0.045, 0.088, 0.15), 0.45 * farK * (1.0 - step(0.5, vBN.y)));
          { float fl2 = dot(bc, vec3(0.3, 0.5, 0.2)); bc *= mix(1.0, clamp(0.085 / max(fl2, 0.02), 0.62, 1.5), 0.65 * farK); }
          float ly = vBox.y - tier*2.591;
          float lx = twenty > 0.5 ? abs(vBox.x) : vBox.x + vDim.x*0.5;      // along the box
          float len = twenty > 0.5 ? vDim.x*0.5 : vDim.x;
          vec3 an = abs(vBN);
          float shade = 1.0;
          float fw = fwidth(vBox.x)*22.4 + fwidth(vBox.z)*22.4 + fwidth(vBox.y)*8.0;
          float fine = 1.0 - smoothstep(0.5, 2.2, fw);
          float seam = smoothstep(0.0, 0.07, ly) * smoothstep(0.0, 0.07, 2.591-ly) * smoothstep(0.0, 0.07, lx) * smoothstep(0.0, 0.07, len-lx);
          float nearK = 1.0 - farK;
          if (an.z > 0.5) {
            // long sides: corrugation that fades by its own footprint on screen, rails and posts, corner castings, grime and rust runs
            float fineS = 1.0 - smoothstep(0.8, 2.6, fwidth(vBox.x)*22.4);
            float c = sin(vBox.x*22.4);
            shade *= 1.0 - fineS*0.27*smoothstep(-0.3, 0.6, c);
            float post = smoothstep(0.22, 0.16, lx) + smoothstep(len-0.22, len-0.16, lx) + smoothstep(0.2, 0.14, ly) + smoothstep(2.39, 2.45, ly);
            shade = mix(shade, 0.8, clamp(post, 0.0, 1.0)*max(fine, fineS));
            float ccast = (smoothstep(0.2, 0.17, lx) + smoothstep(len-0.2, len-0.17, lx)) * (smoothstep(0.16, 0.13, ly) + smoothstep(2.43, 2.46, ly));
            bc = mix(bc, vec3(0.2, 0.21, 0.22), clamp(ccast, 0.0, 1.0)*0.7*fine);
            vec2 gp = vec2(vBox.x*2.1 + h*50.0, ly*0.5 + tier*3.7);
            float gr = cvn(gp), run = smoothstep(0.72, 0.95, cvn(vec2(vBox.x*5.5 + h*31.0, ly*0.5 + tier))) * (1.0 - smoothstep(0.1, 1.9, 2.591-ly)) * step(0.45, chash(h*17.0));
            shade *= mix(1.0, 0.88 + 0.2*gr, nearK) * (1.0 - 0.12*nearK*smoothstep(0.6, 0.0, ly));
            bc = mix(bc, vec3(0.17, 0.075, 0.04), run*0.4*nearK);
            // operator's panel: a pale block on some boxes
            float lg = step(0.55, chash(h*33.0)) * step(len*0.12, lx) * step(lx, len*0.42) * step(1.2, ly) * step(ly, 2.0);
            bc = mix(bc, vec3(0.5,0.53,0.56), lg*0.5*max(fine, fineS));
          } else if (an.x > 0.5) {
            float lz = vBox.z + vDim.z*0.5;
            float bars = smoothstep(0.035, 0.015, abs(fract(lz/0.61 + 0.5) - 0.5)*0.61);
            float mid = smoothstep(0.03, 0.01, abs(lz - vDim.z*0.5));
            shade *= 1.0 - fine*(0.3*bars + 0.5*mid);
            shade *= 1.0 - fine*0.15*smoothstep(0.3,0.6,sin(ly*20.0))*step(vBN.x, 0.0);
            float hinge = smoothstep(0.05, 0.03, abs(fract(ly/0.62 + 0.5) - 0.5)*0.62) * (smoothstep(0.12, 0.09, lz) + smoothstep(vDim.z-0.12, vDim.z-0.09, lz));
            shade *= 1.0 - fine*0.4*clamp(hinge, 0.0, 1.0);
            shade *= mix(1.0, 0.85 + 0.25*cvn(vec2(lz*2.3 + h*40.0, ly*0.6 + tier*3.7)), nearK);
          } else {
            // roofs: pressed ribs across the width, side rails and corner castings, a bowed middle where rain pools, rust blooms
            float lz = vBox.z + vDim.z*0.5, ez = min(lz, vDim.z - lz), ex = min(lx, len - lx);
            float fwx = fwidth(vBox.x), fwz = fwidth(vBox.z);
            float ribF = 1.0 - smoothstep(0.8, 2.6, fwx*15.7);
            float inner = smoothstep(0.12, 0.18 + fwz, ez) * smoothstep(0.24, 0.32 + fwx, ex);
            shade *= 0.84 - ribF*0.2*smoothstep(-0.2, 0.7, sin(lx*15.7))*inner;
            float railK = 1.0 - smoothstep(0.1, 0.13 + fwz, ez) * smoothstep(0.2, 0.24 + fwx, ex);
            shade = mix(shade, 0.56, railK*0.75*step(0.5, vBN.y));
            float ccast = (1.0 - smoothstep(0.17, 0.2 + fwx, ex)) * (1.0 - smoothstep(0.15, 0.18 + fwz, ez));
            bc = mix(bc, vec3(0.2, 0.21, 0.22), ccast*0.75*nearK);
            vec2 rp = vec2(vBox.x, vBox.z) + h*37.0;
            float n1 = cvn(rp*vec2(0.38, 1.1)), n2 = cvn(rp*vec2(0.22, 2.4) + 7.0), n3 = cvn(rp*vec2(1.7, 2.9) + 19.0);
            float bow = smoothstep(1.0, 0.25, abs(lz/vDim.z - 0.5)*2.0);
            float pud = bow * smoothstep(0.42, 0.66, n1*0.45 + n2*0.55) * inner * (0.75 + 0.25*smoothstep(0.7, -0.2, sin(lx*15.7))*ribF);
            float rust = smoothstep(0.58, 0.86, n3*0.6 + n1*0.25 + 0.3*(1.0 - smoothstep(0.0, 0.5, min(ez, ex)))) * step(0.3, chash(h*13.0));
            bc = mix(bc, vec3(0.085, 0.034, 0.018), rust*0.6*mix(0.35, 1.0, nearK));
            bc *= mix(1.0, 0.7, pud) * mix(1.0, 0.84 + 0.32*n2, nearK);
            cPud = step(0.5, vBN.y) * pud * mix(0.3, 1.0, nearK);
            cWet = step(0.5, vBN.y) * min(1.0, 0.4 + 0.3*chash(h*7.0) + 0.55*pud);
            // hoarfrost lies in patches, thickest on the rib crests
            bc = mix(bc, vec3(0.6, 0.69, 0.78), uFrost * step(0.5, vBN.y) * (0.3 + 0.3*chash(h*5.0) + 0.3*smoothstep(0.3, 0.7, n3) + 0.1*pud) * (0.8 + 0.2*ribF*smoothstep(-0.2, 0.7, sin(lx*15.7))));
          }
          shade *= mix(1.0, mix(0.4, 1.0, seam), 0.25 + 0.75*fine);
          shade *= 1.0 - 0.1 * farK * (1.0 - fine) * step(0.5, sin(vBox.x * 5.6));
          diffuseColor.rgb = bc * shade;
        }`)
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 1.0 - 0.75 * uMute;\n#ifdef CH_FLOOD\n{ float oc = vBN.y > 0.5 ? 1.0 : smoothstep(9.0, 14.5, vWp.y); reflectedLight.directDiffuse *= oc; reflectedLight.directSpecular *= oc; }\n#endif')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.13 + 0.3 * uMute, cWet);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * uFill;
        { float cfr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); cfr *= cfr; totalEmissiveRadiance += uGl * cPud * (0.05 + 0.95 * cfr * cfr); }
        #ifdef CH_FLOOD
        {
          float on = clamp((vWp.x - uFront.x) * uFront.y / 40.0, 0.0, 1.0);
          vec2 q = vec2((fract((vWp.x - uGrid.x)/uGrid.y + 0.5) - 0.5)*uGrid.y, (fract((vWp.z - uGrid.z)/uGrid.w + 0.5) - 0.5)*uGrid.w);
          float pool = 1.0 / (1.0 + dot(q, q) / 300.0);
          float up = vBN.y > 0.5 ? 1.0 : 0.12 + 0.24*smoothstep(0.0, 15.0, vWp.y);
          // under sodium light paint loses its hue: at night every box answers the floods, blue ones too
          vec3 fa = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.4, 0.45, 0.15)) * 1.5 + 0.02), 0.65 * uMute);
          // light thrown back up the walls by the lit, wet asphalt, and the straddle carrier's work lights travelling with it
          float bnc = vBN.y > 0.5 ? 0.0 : (1.0 - smoothstep(0.0, 11.0, vWp.y)) * 0.4 * uMute;
          totalEmissiveRadiance += fa * uFlood * on * (0.1 + 0.9*pool) * (up + bnc);
          vec2 hq = (vWp.xz - uHeadB.xy) / vec2(11.0, uHeadB.z * 0.6); float hp = min(uHeadB.w, 0.6) / (1.0 + dot(hq, hq) * dot(hq, hq));
          totalEmissiveRadiance += fa * vec3(1.0, 0.6, 0.26) * hp * (vBN.y > 0.5 ? 0.0 : 1.2) * (1.0 - smoothstep(3.0, 14.0, vWp.y));
          totalEmissiveRadiance += diffuseColor.rgb * uFill * 0.8 * uMute;
        }
        #endif
        #ifdef CH_DECK
        {
          float px = (fract((vWp.x - uDeck.x) / uDeck.y + 0.5) - 0.5) * uDeck.y;
          float pool = 1.0 / (1.0 + px * px / 80.0);
          float up = vBN.y > 0.5 ? 1.0 : 0.2 + 0.3 * smoothstep(uDeck.z - 16.0, uDeck.z, vWp.y);
          totalEmissiveRadiance += diffuseColor.rgb * uDeckCol * (0.3 + 0.7 * pool) * up;
        }
        #endif`);
    if (X.flood) sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', '#include <fog_fragment>\n#ifdef USE_FOG\n gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 0.42 * smoothstep(170.0, 520.0, vFogDepth));\n#endif');
  };
  return mat;
}

// ---------- additive lamp sprites (instanced quads), HDR, fog-aware ----------
function makeLampMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
    vertexShader: `
      attribute vec3 iPos; attribute vec3 iCol; attribute vec3 iPar;   // size, blink rate (0 steady), phase
      uniform float uTime; varying vec2 vUv; varying vec3 vCol; varying float vPool;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(iPos, 1.0);
        vPool = step(iPar.x, 0.0);
        float size = max(abs(iPar.x), -mvPosition.z * 0.0045 * (1.0 - vPool));
        float k = min(1.0, (abs(iPar.x) / size)); k = mix(1.0, k, 0.55);          // far lamps keep most of their light
        float bl = 1.0;
        if (iPar.y > 0.0) { float s = sin(uTime * iPar.y + iPar.z); bl = 0.06 + 0.94 * smoothstep(0.35, 0.95, s); }
        vCol = iCol * bl * k; vUv = position.xy * 2.0;
        if (vPool > 0.5) mvPosition = modelViewMatrix * vec4(iPos + vec3(position.x, 0.0, -position.y) * size, 1.0);
        else mvPosition.xy += position.xy * size;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vCol; varying float vPool;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv);
        float a = exp(-r2 * 26.0) + 0.28 * exp(-r2 * 4.5) * (1.0 - smoothstep(0.6, 1.0, r2));
        if (vPool > 0.5) a = exp(-r2 * 3.2) * (1.0 - smoothstep(0.55, 1.0, r2));
        vec3 col = vCol * a;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            float ff = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          col *= 1.0 - 0.8 * ff;
        #endif
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ---------- spreader cycle: lower at src, lift, traverse to dst, lower, release, lift, return ----------
function cyclePath(p, src, dst, yHigh, out) {
  let z, y;
  if (p < 0.13) { z = src.z; y = THREE.MathUtils.lerp(yHigh, src.y, sm5(p / 0.13)); }
  else if (p < 0.17) { z = src.z; y = src.y; }
  else if (p < 0.30) { z = src.z; y = THREE.MathUtils.lerp(src.y, yHigh, sm5((p - 0.17) / 0.13)); }
  else if (p < 0.48) { z = THREE.MathUtils.lerp(src.z, dst.z, sm5((p - 0.30) / 0.18)); y = yHigh; }
  else if (p < 0.61) { z = dst.z; y = THREE.MathUtils.lerp(yHigh, dst.y, sm5((p - 0.48) / 0.13)); }
  else if (p < 0.65) { z = dst.z; y = dst.y; }
  else if (p < 0.78) { z = dst.z; y = THREE.MathUtils.lerp(dst.y, yHigh, sm5((p - 0.65) / 0.13)); }
  else { z = THREE.MathUtils.lerp(dst.z, src.z, sm5((p - 0.78) / 0.22)); y = yHigh; }
  out.z = z; out.y = y; out.loaded = p > 0.15 && p < 0.63;
  return out;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('crane-harbour-hero') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const journey = opts.journeySeconds ?? 40, wantApron = opts.apron !== false;
  const H = (h) => new THREE.Color(h);

  // ----- per-seed look -----
  const livery = rng.pick(['black', 'black', 'blue', 'green']);
  const hullCol = livery === 'black' ? pal[3].clone().lerp(H('#2a3140'), 0.35) : livery === 'blue' ? H('#15294a') : H('#143a33');
  const red = pal[6].clone().offsetHSL(rng.range(-0.012, 0.014), 0, rng.range(-0.04, 0.02));
  const C = {
    red, dark: pal[3].clone().lerp(pal[1], 0.12), grey: pal[1].clone().lerp(H('#6B7680'), 0.55), white: pal[2].clone().lerp(H('#e6e9ec'), 0.45),
    yellow: pal[4].clone().lerp(H('#d9a520'), 0.35).multiplyScalar(0.8), hull: hullCol, antifoul: H('#7A2E22'),
    deck: livery === 'green' ? H('#3b2622') : rng.chance(0.5) ? H('#27382f') : H('#3b2622'), concrete: H('#6f7780'), asphalt: H('#2b333d'),
    funnel: rng.chance(0.5) ? hullCol.clone().lerp(H('#56627a'), 0.3) : pal[2].clone().lerp(H('#e6e9ec'), 0.4), accent: pal[4].clone(),
    lampWarm: pal[4].clone().multiplyScalar(3.2), lampCool: pal[5].clone().multiplyScalar(3.0),
  };
  const mosaic = ['#7A2E22', '#1F4E79', '#2F5D50', '#6B7680', '#C9CED2', '#C8551E'].map(H);
  const craneX = [-390, -325, -260, -195, -130, -65, 40, 110, 180, 250, 320, 390];
  craneX.lane = [0, 1, 2, 3, 4, 5].map((i) => (i === 4 ? -54.5 : rng.pick([-44.5, -49.5, -54.5])));
  const lay = {
    bridgeBay: rng.pick([17, 18, 12]), funnelBay: rng.pick([3, 6, 7]), hOff: rng.range(0, 6.28),
    fromQuay: [0, 1, 2, 3, 4, 5].map(() => rng.chance(0.5)), rowTiers: [], moored: opts.moored !== false,
  };
  const loading = [0, 1, 2, 3, 4, 5].map((i) => i !== 4 && rng.chance(0.4));
  loading[5] = true;                                    // crane 6 loads: its box flies out over the deck and sinks into a cell
  const cycOv = new Array(6).fill(null);
  const boomMax = THREE.MathUtils.degToRad(rng.range(78, 82));

  const root = new THREE.Group(); root.name = 'crane-harbour-hero';
  const FILL = { value: new THREE.Color(0, 0, 0) };
  const CRF = opts.craneFlood || { value: new THREE.Color(0, 0, 0) }, MUTE = opts.mute || { value: 0 }, GLINT = opts.glint || { value: new THREE.Color(0, 0, 0) };
  const steel = addFill(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.08 }), FILL);
  const steelF = addFill(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.08 }), FILL, CRF, 1);
  const steelB = addFill(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.08 }), FILL, CRF, 2);
  const paint = addFill(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05 }), FILL);
  const wet = addFill(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.0 }), FILL);
  const fillC = pal[1].clone().lerp(pal[2], 0.5); fillC.multiplyScalar((opts.fill ?? 0.3) / Math.max(fillC.r, fillC.g, fillC.b));
  FILL.value = fillC;
  const GL = new Geo(rng); GL.jit = 0.0;

  // ----- cranes: frame, boom, trolley, spreader geometries shared by 12 instances -----
  const pause = async () => { await ctx.yield?.(); };
  const frameGeo = await buildCraneFrame(rng, C, pause); await pause();
  const frameG = frameGeo.build(); await pause();
  const boomG = buildBoom(rng, C).build(); await pause();
  const trolleyG = buildTrolley(rng, C).build(), spreaderG = buildSpreader(rng, C).build();
  await ctx.yield?.();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), XA = new THREE.Vector3(1, 0, 0);
  const frames = new THREE.InstancedMesh(frameG, steelF, 12), booms = new THREE.InstancedMesh(boomG, steelB, 12);
  const tintC = new THREE.Color();
  for (let i = 0; i < 12; i++) {
    M.makeTranslation(craneX[i], 0, CR.railZ); frames.setMatrixAt(i, M);
    const k = rng.range(0.82, 1.08); tintC.setRGB(k, k * rng.range(0.94, 1.03), k * rng.range(0.92, 1.04));
    frames.setColorAt(i, tintC); booms.setColorAt(i, tintC);
    // machinery house windows glow faintly, cool
    for (const s of [-1, 1]) for (let w = 0; w < 4; w++) if (rng() < 0.6) GL.box(craneX[i] + s * 6.33, CR.girderY + 6.0, CR.railZ - 33 + w * 4, 0.05, 1.1, 1.8, C.lampCool, { k: 0.35 });
  }
  frames.instanceMatrix.needsUpdate = true; booms.frustumCulled = false;
  const NT = 18, trolleys = new THREE.InstancedMesh(trolleyG, steel, NT), spreaders = new THREE.InstancedMesh(spreaderG, steel, NT);
  trolleys.frustumCulled = false; spreaders.frustumCulled = false;
  root.add(frames, booms, trolleys, spreaders);

  // ----- ship -----
  const GLS = new Geo(rng); GLS.jit = 0.0;
  const ship = await buildShip(rng, C, GLS, lay, pause); await ctx.yield?.();
  const HU = opts.hull || { sky: { value: pal[1].clone().lerp(pal[2], 0.5).multiplyScalar(0.5) }, sun: { value: pal[5].clone().multiplyScalar(0.8) }, sunDir: { value: new THREE.Vector3(1, 0.07, 0) }, time: { value: 0 }, sea: { value: pal[2].clone().multiplyScalar(0.25) } };
  const shipMesh = new THREE.Mesh(ship.deckGeo, paint);
  shipMesh.add(new THREE.Mesh(ship.hullGeo, makeHullMaterial(FILL, HU)));
  root.add(shipMesh);
  // pools of lamp light down the seaward side under the overside work lamps (additive, so the black hull is never a blank wedge)
  { const pp = [], pc = [], pi = [], amb = pal[4], XS = [-13, -7, -3.2, 0, 3.2, 7, 13], YS = [17.0, 15.2, 12.6, 9.0, 4.5, 0.6], zf = SHIP.zc + SHIP.hb + 0.12;
    for (let k = 0; k < 12; k++) { const x0 = -404 + k * 26.5, b = pp.length / 3;
      for (let j = 0; j < YS.length; j++) for (let i = 0; i < XS.length; i++) {
        const d = 17.2 - YS[j], sp = 3.0 + d * 0.75, I = Math.exp(-(XS[i] * XS[i]) / (2 * sp * sp)) * Math.exp(-d / 7.5) * (i === 0 || i === XS.length - 1 || j === YS.length - 1 ? 0 : 1) * (j === 0 ? 0.55 : 1);
        pp.push(x0 + XS[i], YS[j], zf); pc.push(amb.r * I, amb.g * I * 0.92, amb.b * I * 0.8);
      }
      for (let j = 0; j < YS.length - 1; j++) for (let i = 0; i < XS.length - 1; i++) { const a = b + j * XS.length + i, c = a + XS.length; pi.push(a, c, a + 1, a + 1, c, c + 1); } }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3)); pg.setIndex(pi);
    const pm = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color().setScalar(opts.hullGlow ?? 0.3), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false }));
    pm.renderOrder = 1; shipMesh.add(pm); }

  // ----- quay -----
  const quay = buildQuay(rng, C, wantApron, craneX);
  const quayMesh = new THREE.Mesh(quay.G.build(), wet); root.add(quayMesh);
  await ctx.yield?.();

  // ----- containers: deck columns + boxes waiting on platforms and trucks + 12 carried -----
  const extra = [];
  for (let i = 0; i < 6; i++) {
    if (rng.chance(0.6)) extra.push({ x: craneX[i] + rng.pick([-1, 1]) * 0.2, y: CR.portalY + 1.2, z: rng.pick([-12, -27]) + rng.pick([-3.2, 3.2]), t: 1, seed: rng() * 900 });
  }
  const colsAll = ship.cols.concat(extra), NC = colsAll.length + 12, CARRY0 = colsAll.length;
  const boxG = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); boxG.deleteAttribute('uv');
  const aDim = new Float32Array(NC * 3), aSeed = new Float32Array(NC);
  const dom = rng.int(0, 5), domW = rng.range(0.22, 0.4), FROST = opts.frost || { value: 0 }, DECK = { flood: { value: new THREE.Color(0, 0, 0) }, grid: { value: new THREE.Vector3(SHIP.bay0 + 3 * SHIP.pitch + 6.5 + 580, 3 * SHIP.pitch, 46) } },
    boxMat = makeBoxMaterial(mosaic, dom, domW, FILL, { frost: FROST, deck: DECK, mute: MUTE, glint: GLINT });
  const NSHIP = ship.cols.length;
  const boxes = new THREE.InstancedMesh(boxG, boxMat, NC); boxes.frustumCulled = false;
  let deckTop = 0;
  for (let i = 0; i < NC; i++) {
    const c = colsAll[i];
    if (c) { M.makeTranslation(c.x, c.y, c.z); aDim.set([12.19, c.t * 2.591, 2.44], i * 3); aSeed[i] = c.seed; deckTop = Math.max(deckTop, c.y + c.t * 2.591); }
    else { M.makeScale(1e-4, 1e-4, 1e-4); aDim.set([12.19, 2.591, 2.44], i * 3); aSeed[i] = rng() * 900; }
    boxes.setMatrixAt(i, M);
  }
  boxG.setAttribute('aDim', new THREE.InstancedBufferAttribute(aDim, 3)); boxG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  root.add(boxes);

  // ----- cables: hoist falls and folding forestays, rebuilt on the CPU each frame (thin prisms, widened with distance) -----
  const NCAB = NT * 4 + 12 * 8, cabPos = new Float32Array(NCAB * 24), cabNor = new Float32Array(NCAB * 24), cabIdx = [];
  for (let k = 0; k < NCAB; k++) { const b = k * 8; for (let j = 0; j < 4; j++) { const a = b + j, c = b + (j + 1) % 4; cabIdx.push(a, a + 4, c + 4, a, c + 4, c); } }
  const cabG = new THREE.BufferGeometry();
  cabG.setAttribute('position', new THREE.BufferAttribute(cabPos, 3).setUsage(THREE.DynamicDrawUsage));
  cabG.setAttribute('normal', new THREE.BufferAttribute(cabNor, 3).setUsage(THREE.DynamicDrawUsage));
  cabG.setIndex(cabIdx);
  const cables = new THREE.Mesh(cabG, new THREE.MeshStandardMaterial({ color: C.dark.clone().multiplyScalar(1.3), roughness: 0.45, metalness: 0.5 }));
  cables.frustumCulled = false; root.add(cables);
  const camL = new THREE.Vector3(0, 60, 400);
  const SX = [1, 0, -1, 0], SS = [0, 1, 0, -1];
  function setCable(k, ax, ay, az, bx, by, bz, w0) {
    const mx = (ax + bx) / 2 - camL.x, my = (ay + by) / 2 - camL.y, mz = (az + bz) / 2 - camL.z;
    const w = Math.max(w0, Math.sqrt(mx * mx + my * my + mz * mz) * 0.0012);
    let sy = bz - az, sz = -(by - ay); const l = Math.hypot(sy, sz) || 1; sy /= l; sz /= l;
    let o = k * 24;
    for (let e = 0; e < 2; e++) {
      const px = e ? bx : ax, py = e ? by : ay, pz = e ? bz : az;
      for (let j = 0; j < 4; j++) {
        const nx = SX[j], ny = SS[j] * sy, nz = SS[j] * sz;
        cabPos[o] = px + nx * w; cabPos[o + 1] = py + ny * w; cabPos[o + 2] = pz + nz * w;
        cabNor[o] = nx; cabNor[o + 1] = ny; cabNor[o + 2] = nz; o += 3;
      }
    }
  }

  // ----- lamps -----
  const lp = [], lc = [], lpar = [], dynBoom = [], dynSlot = [];
  const lamp = (x, y, z, col, k, size, rate = 0, phase = 0) => { lp.push(x, y, z); lc.push(col.r * k, col.g * k, col.b * k); lpar.push(size, rate, phase); return lp.length / 3 - 1; };
  const sodium = pal[4], cream = pal[5], boomLampK = opts.boomLamps ?? 0.6;
  for (let i = 0; i < 12; i++) {
    const cx = craneX[i], z0 = CR.railZ;
    for (const sx of [-1, 1]) for (const z of [-8, 8]) lamp(cx + sx * (CR.legX - 1.3), CR.portalY - 1.85, z0 + z, sodium, 5.0, 3.4);
    for (const sx of [-1, 1]) for (const z of [-9, 9]) lamp(cx + sx * (CR.legX - 5), 0.08, z0 + z, sodium, 0.3, -36);
    for (const z of [-34, -20, -4, 10]) lamp(cx - CR.girderX - 2.0, CR.girderY + 2.6, z0 + z, cream, 2.2, 1.1);
    for (let k = 1; k < 11; k += 2) lamp(cx + CR.legX + 2.6, 10 + k * 4.5, z0 - CR.legZ, cream, 1.6, 0.8);
    lamp(cx, CR.apexY + 5.4, z0 + CR.apexZ - 0.8, sodium, i < 6 ? 7.5 : 11, i < 6 ? 2.6 : 4.0, rng.range(1.9, 2.5), rng.range(0, TAU));
    dynBoom.push({ i, idx: lamp(0, 0, 0, sodium, i < 6 ? 8.0 : 14, i < 6 ? 2.4 : 5.0, rng.range(1.9, 2.5), rng.range(0, TAU)), y: 4.8, z: CR.boomLen });
    for (const bz of [14, 36, 58]) dynBoom.push({ i, idx: lamp(0, 0, 0, sodium, 3.6, 2.2), y: -1.6, z: bz, x: (bz === 36 ? -1 : 1) * CR.girderX });
    // a row of walkway lamps along each boom, so a rising neck reads as a line of lights at night
    if (boomLampK > 0) for (const bz of (i < 6 ? [18, 38, 58] : [8, 18, 28, 38, 48, 58, 67])) dynBoom.push({ i, idx: lamp(0, 0, 0, sodium, 3.4 * boomLampK, i < 6 ? 1.3 : 2.1), y: 2.5, z: bz, x: CR.girderX + 1.9 });
  }
  for (let j = 0; j < NT; j++) {
    dynSlot.push({ j, idx: lamp(0, 0, 0, cream, 2.6, 1.3), kind: 0 });
    for (const sx of [-1, 1]) dynSlot.push({ j, idx: lamp(0, 0, 0, sodium, 3.4, 0.9, 2.7, j * 1.3 + sx), kind: sx });   // twist-lock lamps blink
  }
  const SL0 = lp.length / 3;
  lamp(lay.bridgeTop[0], lay.bridgeTop[1] + 0.4, lay.bridgeTop[2], cream, 4.5, 1.8);
  lamp(lay.foremast[0], lay.foremast[1] + 0.3, lay.foremast[2], cream, 4.0, 1.5);
  lamp(-427.6, SHIP.deck + 6.2, SHIP.zc, cream, 3.0, 1.3);
  lamp(lay.bridgeTop[0], lay.bridgeY + 1.6, SHIP.zc + 32.8, H('#35ff7a'), 2.5, 1.2); lamp(lay.bridgeTop[0], lay.bridgeY + 1.6, SHIP.zc - 32.8, H('#ff3a2a'), 3.0, 1.2);
  for (const s of [-1, 1]) lamp(lay.funnelTop[0] + 7, lay.funnelTop[1] - 12, SHIP.zc + s * 9, sodium, 4.0, 2.4);
  for (let k = 0; k < 8; k++) for (const s of [-1, 1]) lamp(SHIP.bay0 + (3 + k * 3) * SHIP.pitch + 6.5, SHIP.hatch + 13.6, SHIP.zc + s * 27, sodium, 4.2, 2.1);
  for (let k = 0; k < 6; k++) lamp(SHIP.bay0 + (2 + k * 4) * SHIP.pitch + 6.5, SHIP.hatch + 13.9, SHIP.zc + (k % 2 ? 9 : -9), sodium, 5.0, 0.9, 3.4, k * 1.3);
  for (let k = 0; k < 12; k++) lamp(-404 + k * 26.5, 17.2, SHIP.zc + SHIP.hb + 0.9, sodium, 3.4, 1.5);
  const SL1 = lp.length / 3;
  // travel beacons on the bogies (declared after the ship block so the ship's lamp range SL0..SL1 stays contiguous)
  for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) for (const sz of [-1, 1])
    lamp(craneX[i] + sx * (CR.legX + 7.2), 5.05, CR.railZ + sz * CR.legZ, sodium, 5.0, 0.75, 3.1 + 0.9 * hash1(i * 4.7 + sx + sz * 2.0), hash1(i * 9.1 + sx * 3.0 + sz) * TAU);
  quay.truckSpots.forEach((t, i) => lamp(t[0] + 7.0, t[1] + 0.35, t[2] + 1.1, sodium, 6.0, 1.2, 4.2, i * 1.7));
  const quadG = new THREE.PlaneGeometry(1, 1), lampG = new THREE.InstancedBufferGeometry();
  lampG.index = quadG.index; lampG.setAttribute('position', quadG.getAttribute('position'));
  const iPos = new THREE.InstancedBufferAttribute(new Float32Array(lp), 3).setUsage(THREE.DynamicDrawUsage);
  lampG.setAttribute('iPos', iPos); lampG.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(lc), 3));
  lampG.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(lpar), 3));
  lampG.instanceCount = lp.length / 3;
  const lampMat = makeLampMaterial(), lamps = new THREE.Mesh(lampG, lampMat); lamps.frustumCulled = false; lamps.renderOrder = 5; root.add(lamps);
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const glow = new THREE.Mesh(GL.build(), glowMat); root.add(glow);
  const glowShip = new THREE.Mesh(GLS.build(), glowMat); root.add(glowShip);
  const lpBase = Float32Array.from(lp);
  await ctx.yield?.();

  // ----- kinematics -----
  const PERIOD = 18, phase = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map((k) => k / 12);
  const rowsOK = lay.rowTiers.map((row) => row.map((t, r) => (t > 0 ? r : -1)).filter((r) => r >= 0));
  const platY = CR.portalY + 1.2 + 2.591, HIGH = [49.5, 46];
  const _a = { z: 0, y: 0 }, _b = { z: 0, y: 0 };
  function craneState(i, s, time, out = {}) {
    const tt = s === 0 && cycOv[i] != null ? cycOv[i] : time / PERIOD + phase[i * 2 + s], n = Math.floor(tt), p = tt - n;
    if (s === 0) {
      const ok = rowsOK[i], r = ok[Math.floor(hash1(i * 13.1 + n * 7.7) * ok.length) % ok.length];
      _a.z = SHIP.zc + (r - 11) * SHIP.rowW; _a.y = SHIP.hatch + (lay.rowTiers[i][r] + 1) * 2.591; _b.z = -12; _b.y = platY;
    } else { _a.z = -27; _a.y = platY; _b.z = craneX.lane[i]; _b.y = (i === 4 ? 0 : 1.5) + 2.591; if (!loading[i]) { /* platform -> truck */ } }
    const flip = s === 0 ? loading[i] : loading[i];
    const src = flip ? _b : _a, dst = flip ? _a : _b;
    cyclePath(p, src, dst, HIGH[s], out);
    out.x = craneX[i]; out.restZ = p < 0.4 ? src.z : dst.z; out.restY = (p < 0.4 ? src.y : dst.y) - 2.591;
    return out;
  }
  let progress = 0, progressSet = false, ride = null, rideMix = 0, rideZ = 0, rideY = 47, salute = 0, shipDz = 0, shipDzApplied = 0;
  const boomOv = new Array(12).fill(null), boomAng = new Float32Array(12);
  const st = { z: 0, y: 0, loaded: false, x: 0, restZ: 0, restY: 0 };
  const hingeY = CR.girderY, hingeZ = CR.railZ + CR.hingeZ;
  // forestay anchors: [apex point (crane local y, world z), boom lug distance]
  const STAYS = [{ ay: CR.apexY + 0.3, az: CR.railZ + CR.apexZ, bz: 60 }, { ay: CR.apexY - 1.4, az: CR.railZ + CR.apexZ + 0.6, bz: 30 }];
  for (const s of STAYS) s.len = Math.hypot(hingeY + 4.0 - s.ay, hingeZ + s.bz - s.az) + 0.02;

  function update(dt, time, camera) {
    if (!opts.hull) HU.time.value = time;
    if (camera) { camL.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(camL); }
    lampMat.uniforms.uTime.value = time;
    const tj = (progressSet ? progress : ((time + 10) % 52) / 40) * journey;
    // booms
    for (let i = 0; i < 12; i++) {
      let a = i < 6 ? 0 : boomMax * sm5((tj - (8 + 2.5 * (i - 6))) / 9);
      if (boomOv[i] != null) a = boomOv[i];
      boomAng[i] = a;
      Q.setFromAxisAngle(XA, -a); V.set(craneX[i], hingeY, hingeZ); M.compose(V, Q, ONE); booms.setMatrixAt(i, M);
      const ca = Math.cos(a), sa = Math.sin(a);
      // folding forestays, two links each
      for (let k = 0; k < 2; k++) {
        const S = STAYS[k], by = hingeY + 4.0 * ca + S.bz * sa, bz = hingeZ + S.bz * ca - 4.0 * sa;
        const dy = by - S.ay, dz = bz - S.az, d = Math.hypot(dy, dz), h = Math.sqrt(Math.max(0, S.len * S.len - d * d)) / 2;
        let py = -dz / d, pz = dy / d; if (py < 0) { py = -py; pz = -pz; }
        const ky = (S.ay + by) / 2 + py * h, kz = (S.az + bz) / 2 + pz * h;
        for (let e = 0; e < 2; e++) {
          const sx = e ? 1 : -1, c0 = NT * 4 + i * 8 + k * 4 + e * 2, xm = sx * (1.6 + CR.girderX) / 2;
          setCable(c0, craneX[i] + sx * 1.6, S.ay, S.az, craneX[i] + xm, ky, kz, 0.16);
          setCable(c0 + 1, craneX[i] + xm, ky, kz, craneX[i] + sx * CR.girderX, by, bz, 0.16);
        }
      }
    }
    for (const d of dynBoom) {
      const a = boomAng[d.i], ca = Math.cos(a), sa = Math.sin(a), o = d.idx * 3;
      iPos.array[o] = craneX[d.i] + (d.x || 0); iPos.array[o + 1] = hingeY + d.y * ca + d.z * sa; iPos.array[o + 2] = hingeZ + d.z * ca - d.y * sa;
    }
    // trolleys, spreaders, carried boxes, hoist falls
    for (let j = 0; j < NT; j++) {
      let x, z, y, loaded = false, hide = false, hasBox = false;
      if (j < 12) {
        const i = j >> 1, s = j & 1; craneState(i, s, time, st); x = st.x; z = st.z; y = st.y; loaded = st.loaded; hasBox = true;
        if (s === 0 && salute > 0) { const k = sm5(salute); z += (CR.railZ + 6 - z) * k; y += (47 - y) * k; hasBox = false; }
        if (i === 4) {
          if (ride) { rideMix = 1; rideZ = ride.z; rideY = ride.y; } else if (s === 0 && rideMix > 0) rideMix = Math.max(0, rideMix - dt * 0.4);
          if (rideMix > 0) { if (s === 0) { const k = sm5(rideMix); z += (rideZ - z) * k; y += (rideY - y) * k; loaded = false; hasBox = false; } else if (ride) hide = true; }
        }
        const bi = CARRY0 + j;
        if (hasBox && !hide) { M.makeTranslation(x, loaded ? y - 2.591 : st.restY, loaded ? z : st.restZ); } else M.makeScale(1e-4, 1e-4, 1e-4);
        boxes.setMatrixAt(bi, M);
      } else { x = craneX[j - 6]; z = CR.railZ + 2; y = 47; }
      const sway = hide ? 0 : 0.22 * Math.sin(time * 0.83 + j * 1.9) * (CR.trolleyY - y) / 40;
      if (hide) { M.makeScale(1e-4, 1e-4, 1e-4); trolleys.setMatrixAt(j, M); spreaders.setMatrixAt(j, M); }
      else { M.makeTranslation(x, CR.trolleyY, z); trolleys.setMatrixAt(j, M); M.makeTranslation(x, y, z + sway); spreaders.setMatrixAt(j, M); }
      for (let c = 0; c < 4; c++) {
        const sx = c & 1 ? 1 : -1, sz = c & 2 ? 1 : -1;
        if (hide) setCable(j * 4 + c, 0, -50, 0, 0, -50.1, 0, 0.001);
        else setCable(j * 4 + c, x + sx * 2.6, CR.trolleyY - 0.9, z + sz * 2.2, x + sx * 1.25, y + 2.3, z + sway + sz * 0.62, 0.05);
      }
      for (const d of dynSlot) if (d.j === j) {
        const o = d.idx * 3;
        if (hide) { iPos.array[o + 1] = -500; continue; }
        if (d.kind === 0) { iPos.array[o] = x + 5.1; iPos.array[o + 1] = CR.trolleyY - 5.3; iPos.array[o + 2] = z + 3.4; }
        else { iPos.array[o] = x + d.kind * 6.2; iPos.array[o + 1] = y + 0.75; iPos.array[o + 2] = z + sway; }
      }
    }
    if (shipDz !== shipDzApplied) {
      shipDzApplied = shipDz; shipMesh.position.z = shipDz; glowShip.position.z = shipDz;
      for (let i = 0; i < NSHIP; i++) { const c = colsAll[i]; M.makeTranslation(c.x, c.y, c.z + shipDz); boxes.setMatrixAt(i, M); }
      for (let i = SL0; i < SL1; i++) iPos.array[i * 3 + 2] = lpBase[i * 3 + 2] + shipDz;
    }
    booms.instanceMatrix.needsUpdate = true; trolleys.instanceMatrix.needsUpdate = true; spreaders.instanceMatrix.needsUpdate = true;
    boxes.instanceMatrix.needsUpdate = true; iPos.needsUpdate = true;
    cabG.attributes.position.needsUpdate = true; cabG.attributes.normal.needsUpdate = true;
  }

  // ----- anchors -----
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z), cx4 = craneX[4];
  const anchors = {
    worldOffset: v3(580, 0, 0),
    portalSeat: { position: v3(390, 9, -20), normal: v3(-1, 0, 0) },
    hoistFoot: v3(cx4, 2.5, -55), hoistTop: v3(cx4, 46.5, -55), boomEnd: v3(cx4, 46.5, 60),
    flyThrough: [v3(cx4, 2.5, -55), v3(cx4, 46.5, -55), v3(cx4, 46.5, 60), v3(cx4 + 18, 44, 82), v3(-70, 26, 86), v3(-30, 14, 74), v3(2, 11, 40),
      v3(6, 9.5, 8), v3(14, 9, -10), v3(40, 9, -20), v3(110, 9, -20), v3(180, 9, -20), v3(250, 9, -20), v3(320, 9, -20), v3(390, 9, -20)],
    naveStart: v3(40, 9, -20), naveEnd: v3(390, 9, -20),
    bowTip: v3(SHIP.x1, shipDk(1), SHIP.zc), sternTip: v3(SHIP.x0, SHIP.deck, SHIP.zc),
    funnelTop: v3(...lay.funnelTop), whistle: v3(...lay.whistle), bridgeTop: v3(...lay.bridgeTop),
    cranes: craneX.map((x, i) => ({ x, working: i < 6 })), deckTop,
    viewpoints: { hoistTop: { position: v3(cx4, 46.5, -55), lookAt: v3(250, 70, -10) }, quarter: { position: v3(-520, 60, 230), lookAt: v3(-150, 40, 10) } },
  };

  const radius = 260, center = v3(0, 45, 10);

  update(0, 0, null);
  return {
    object: root, radius, height: 123, center, anchors, update,
    extent: { min: v3(-475, -7, -72), max: v3(475, 123, 68) },
    setProgress(u) { progress = sat(u); progressSet = true; },
    setRide(z, y) { ride = z == null ? null : { z, y }; },
    setBoom(i, a) { boomOv[i] = a; },
    setSalute(k) { salute = sat(k); },
    setShipOffset(dz) { shipDz = dz; },
    look: { mosaic, dom, domW, livery, FROST, FILL, DECK, CRF, MUTE, GLINT, boomMax, lay, craneX, C, PERIOD, shipCols: ship.cols },
    setCycle(i, tt) { cycOv[i] = tt; },
    boomAngle: (i) => boomAng[i], craneState,
    dispose() {},
    ground: true, groundY: -2.5,
  };
}
