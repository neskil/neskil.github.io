// HERO SET PIECE for "gale-in-green-glass": THE SHIP. Our own three-masted full-rigged ship, built 6 times life, a model
// that is alive: tarred hull, thread rigging, ochre paper sails, a lit stern with built quarter galleries, a carved
// taffrail and a great lantern, and inside her stern the cabin with a gilt
// frame on its forward bulkhead. No name, no figurehead, no flag, no lettering, no numerals, nothing living.
//
// LOCAL SPACE (and, in the world, the world's own frame): mean sea y 0, keel on x 0, bow toward -Z, port (the weather
// side) is -X, starboard (the lee) +X. Taffrail z 26, stem head z -154. The picture's centre is P = (0, 15, 0) on the
// cabin's forward bulkhead; the line of the last flight is the z axis through P.
//
// HOW SHE MOVES: one law by the world clock, the same for every visitor (motionAt below; its two phases are dealt by the
// seed from a stream of their own, motionPhases): she rolls ABOUT THE
// LINE x 0, y 15 (2.5 degrees to lee plus 1.5 times a sine of 11 s: never over 4, never under 1) and pitches ABOUT P
// (2 degrees times a sine of 9 s). No heave, yaw or surge. Everything of her is a child of one group that turns about P.
//
// THE CANVAS IS NOT BUILT. The bulkhead has a hole at P (9.66 by 7.71, so that at her 4 degrees of roll its edge never
// crosses the upright opening of 9 by 6.9) and the gilt frame stands round it (sight 8.3 by 6.1: 0.35 m inside the
// opening at the sides, 0.40 m above and below, SHIP.sight, so that the frame, which rolls and pitches with her
// while the opening stands upright, never bares an edge of it; its moulding sloping outward and astern); the world's
// exit opening stands in the hole.
// HER STERN STANDS OPEN: the middle of her stern is one casement, 11.2 by 10.2, with nothing in it (SHIP.casement).
// Nothing here is on, in or before it. NOTHING OF THE CABIN STANDS INSIDE THE OPENING'S OUTLINE as it is seen from any
// place of the last SHIP.sightFrom metres of the line, at her greatest roll: every thing of the cabin is stood by
// one rule (keepX below): the table, the chair, the hanging lamp with its glow.
//
// LIGHT BY PLACE: every face inside the cabin volume (x -15 to 15, y 8 to 22, z 0 to 24) is lit by the cabin's own lamp
// and by green daylight through the stern windows; every face outside by the key and the green fill the world hands in
// (setLight). The materials are this file's own shaders; they read no scene light.
//
// RETURNS { object, radius, height, center, anchors, uniforms, info, setLight(o), update(dt, time, camera), dispose() }.
// OPTS: palette (the brief's eight colours), rain (0 or 1: rain running on the stern panes). HER STORM CANVAS IS THE SAME
// ON EVERY SEED: main and fore lower topsails, the reefed fore course, the fore topmast staysail and the reefed spanker.
import * as THREE from 'three';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
export const SHIP = {
  P: [0, 15, 0], sternZ: 26, stemZ: -154, transomZ: 24, transomOut: 25.2,
  deckY: 9, railY: 16.5, fcDeckY: 17, fcRailY: 23, poopDeckY: 22.5, poopRailY: 29, stemHeadY: 26,
  poopBreakZ: -14, fcBreakZ: -116, keelY: -12,
  cabin: { x0: -15, x1: 15, y0: 8, y1: 21, z0: 0, z1: 24 },
  // THE OPENING (the canvas, the join sheet's rect 9 by 6.9), half sizes; the gilt frame's sight, half sizes: 0.35 m
  // inside the opening at the sides and 0.40 m above and below (8.3 by 6.1), as the join sheet has it; the frame's
  // moulding is frameWide broad
  opening: { hx: 4.5, hy: 3.45 }, sight: { hx: 4.15, hy: 3.05 }, frameWide: 1.1,
  // the last metres of the line from which the opening's outline is kept free of every thing of the cabin (keepX),
  // and the clear way kept outside that outline
  sightFrom: 150, outlineClear: 0.3,
  // THE PICTURE LAMP over the gilt frame: a brass trough picLamp.half metres to either side of the line's plane, its
  // middle picLamp.y high and picLamp.z metres abaft the forward bulkhead (4 m and more from the line), of radius picLamp.r
  picLamp: { y: 19.95, z: 1.35, half: 3.6, r: 0.3 },
  // HER OPEN STERN (CASEMENT): the middle of her stern is one open casement. Its measures hold the canvas's whole
  // outline, at her greatest roll and pitch, for an eye anywhere on the last 150 m of the line (which stands up to
  // 8 m over the last line at their beginning): half the opening at 4 degrees of roll (4.73 by 3.76), the transom's
  // rise and fall at 2 degrees of pitch (0.88 m), the high eye's share at the transom (1.34 m), and room to spare:
  // 11.2 m wide, from the locker seat's top (10.2) to 20.4 under the gallery's walk. No glass, bar or sash in it.
  casement: { x0: -5.6, x1: 5.6, y0: 10.2, y1: 20.4 },
  masts: [{ z: -122, truck: 168, k: 168 / 180 }, { z: -62, truck: 180, k: 1 }, { z: -8, truck: 150, k: 150 / 180 }],
  yardYs: [60, 90, 112, 138, 158], yardLens: [96, 84, 76, 58, 44], brace: 38 * DEG, cock: 6 * DEG,
  topY: 66, channelX: 23.5, channelY: 17,
  // the flame of the great lantern on the taffrail; the hub of her wheel
  lantern: [0, 36.2, 27], wheel: [0, 26.9, 18.2],
  // HER THREE STERN LANTERNS (their flames): the great one amidships and a smaller one on each quarter of the taffrail
  lanterns: [[0, 36.2, 27, 1], [-12.6, 33.6, 26.3, 0.72], [12.6, 33.6, 26.3, 0.72]],
  // her two farthest ends: the jib-boom's end and the spanker boom's end (her length over all lies between them)
  jibEnd: [0, 50, -206], boomEnd: [14, 38, 40],
};
// places of her the world's look may hold (each a measure of the ship, none typed in the world)
SHIP.stemHead = [0, SHIP.stemHeadY, SHIP.stemZ];
SHIP.tops = SHIP.masts.map((m) => [0, SHIP.topY, m.z]);
SHIP.mainTopsail = [0, (SHIP.yardYs[0] + SHIP.yardYs[1]) / 2, SHIP.masts[1].z - 4.2];
{ const { y0, y1 } = SHIP.casement; SHIP.sternWindow = [0, (y0 + y1) / 2, SHIP.transomZ]; }
// the five lights of her stern: the open casement in the middle (SHIP.casement), and two glazed lights a side between it
// and her quarters, parted by piers STERN_PIER wide (the outer light the narrower, as her stern draws in)
const STERN_PIER = 0.9;
const STERN_WINDOWS = (() => { const w = SHIP.casement.x1, c = SHIP.cabin.x1, m = w + STERN_PIER + (c - w - 2 * STERN_PIER) * 0.56; return [[-c, -m - STERN_PIER], [-m, -w - STERN_PIER], [-w, w], [w + STERN_PIER, m], [m + STERN_PIER, c]]; })();
const STERN_PIERS = [0, 1, 2, 3].map((k) => (STERN_WINDOWS[k][1] + STERN_WINDOWS[k + 1][0]) / 2);

// THE ONE LAW OF HER MOTION, by the world clock (radians). roll: to lee (starboard down). pitch: bow up when positive.
// MOTION is its measure (degrees and seconds). Its two phases are DEALT, from one stream of their own
// ('gale-ship:motion'): motionPhases() is the one place they are drawn, and everything that goes with her motion (the
// hull, the sea's rim round her bow, the spray of each plunge, the things that slide in the cabin) reads those two.
export const MOTION = { heel: 2.5, roll: 1.5, rollPer: 11, pitch: 2, pitchPer: 9 };
export function motionPhases(core, seed) {
  const r = core.makeRng(core.hashSeed('gale-ship:motion:' + seed));
  return [r.range(0, TAU), r.range(0, TAU)];
}
export function motionAt(time, ph) {
  return { roll: (MOTION.heel + MOTION.roll * Math.sin(TAU * time / MOTION.rollPer + ph[0])) * DEG, pitch: MOTION.pitch * DEG * Math.sin(TAU * time / MOTION.pitchPer + ph[1]) };
}
// THE OUTLINE'S RULE (the join sheet: nothing of the cabin inside the opening's outline as seen from any place of the
// last SHIP.sightFrom metres of the line, at the worst of her roll and of every swing). On those metres the eye is in
// her keel's upright plane (x 0), so from SHIP.sightFrom metres off the outline's side is seen, z metres abaft the
// canvas, at hx (1 - z / sightFrom) from that plane, and a nearer eye sees it nearer the plane. keepX: the least
// distance from that plane, to either hand, at which a thing may have its middle when it stands z metres abaft the
// canvas and y high and reaches r metres toward the plane: outside the outline by SHIP.outlineClear when her
// greatest roll about the line carries it inboard.
export function keepX(z, y, r = 0) {
  const roll = (MOTION.heel + MOTION.roll) * DEG;
  return (SHIP.opening.hx * (1 - z / SHIP.sightFrom) + SHIP.outlineClear + r + Math.abs(y - SHIP.P[1]) * Math.sin(roll)) / Math.cos(roll);
}

// half breadth of the hull at its widest, by station (the plan the sea's collar and the flecks read too)
export function halfBeam(z) {
  if (z > 26 || z < -154) return 0;
  if (z >= -10) return 22 - 5 * Math.pow(Math.min(1, (z + 10) / 34), 1.7);
  if (z >= -110) return 22;
  return 22 * Math.sqrt(Math.max(0, 1 - Math.pow((-110 - z) / 44, 2.4)));
}
const railAt = (z) => {
  const s = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const fc = SHIP.fcRailY + (SHIP.stemHeadY - SHIP.fcRailY) * s(-130, -154, z);
  return SHIP.railY + (SHIP.poopRailY - SHIP.railY) * s(SHIP.poopBreakZ - 3, SHIP.poopBreakZ, z) + (fc - SHIP.railY) * s(SHIP.fcBreakZ + 3, SHIP.fcBreakZ, z);
};
const keelAt = (z) => (z <= -6 ? SHIP.keelY : SHIP.keelY + 19 * Math.pow((z + 6) / 30, 2));
// one section of the hull: girth share t (0 at the rail, 1 at the keel) -> [x, y] on the starboard side
function sectionAt(z, t) {
  const yt = railAt(z), yb = keelAt(z), b = halfBeam(z);
  const aft = Math.min(1, Math.max(0, (z + 6) / 30)), fwd = Math.min(1, Math.max(0, (-100 - z) / 54));
  const ym = Math.min(yt - 2, 6 + 6 * aft + 9 * fwd * fwd), y = yt - (yt - yb) * t;
  const p = 3.2 - 1.3 * aft - 1.5 * fwd;
  let s;
  if (y >= ym) { const k = (y - ym) / Math.max(1e-3, yt - ym); s = 1 - 0.07 * k * k; }
  else { const k = Math.min(1, (ym - y) / Math.max(1e-3, ym - yb)); s = Math.pow(Math.max(0, 1 - Math.pow(k, p)), 1 / p); }
  return [b * s, y];
}
// the stem's rake and forefoot: metres a point at height y is carried aft of the stem head's station
const stemAft = (y) => (y >= 0 ? 4 * (1 - Math.min(1, y / 26)) : 4 + 20 * Math.pow(Math.min(1, -y / 12), 2));
const bowWarp = (z, y) => { const w = Math.min(1, Math.max(0, (-110 - z) / 44)); return z + w * w * stemAft(y); };

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ------------------------------------------------------------------ a small mesh writer: position, normal, colour, kind
// kinds the ship's shader knows: 0 matt paint or tarred wood, 1 hull planking (par: metres of girth below the rail),
// 2 deck planking, 3 gilt, 4 a glow (par: strength), 5 the chequered floor cloth, 6 the chart (colour r, g carry its
// own coordinates), 7 panelled wood (par: panel size), 8 a furled paper roll (par: metres along the roll)
class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.m = []; this.i = []; this.col = [1, 1, 1]; this.kind = 0; this.par = 0; this.count = 0; }
  color(c) { this.col = c; return this; }
  mat(kind, par = 0) { this.kind = kind; this.par = par; return this; }
  vert(x, y, z, nx, ny, nz, par = this.par) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(this.col[0], this.col[1], this.col[2]); this.m.push(this.kind, par);
    return this.count++;
  }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // a flat face through four points, counter-clockwise as seen from its front
  face(a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz); this.vert(b[0], b[1], b[2], nx, ny, nz); this.vert(c[0], c[1], c[2], nx, ny, nz); this.vert(d[0], d[1], d[2], nx, ny, nz);
    this.quad(i0, i0 + 1, i0 + 2, i0 + 3); return this;
  }
  // an axis-aligned box; skip: letters of the faces to leave out, among x X y Y z Z (small letter: the low side)
  box(x0, y0, z0, x1, y1, z1, skip = '') {
    if (!skip.includes('X')) this.face([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    if (!skip.includes('x')) this.face([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    if (!skip.includes('Y')) this.face([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (!skip.includes('y')) this.face([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (!skip.includes('Z')) this.face([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    if (!skip.includes('z')) this.face([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    return this;
  }
  // a round or many-sided bar from a to b, radius r0 at a and r1 at b, smooth normals; caps close its ends
  tube(a, b, r0, r1 = r0, sides = 8, caps = false) {
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], L = Math.hypot(ax, ay, az) || 1, dx = ax / L, dy = ay / L, dz = az / L;
    let ux = dy * 0 - dz * 1, uy = dz * 0 - dx * 0, uz = dx * 1 - dy * 0;
    if (Math.hypot(ux, uy, uz) < 0.05) { ux = 1; uy = 0; uz = 0; }
    const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux, i0 = this.count;
    for (let k = 0; k <= sides; k++) {
      const an = k / sides * TAU, c = Math.cos(an), s = Math.sin(an), nx = ux * c + vx * s, ny = uy * c + vy * s, nz = uz * c + vz * s;
      this.vert(a[0] + nx * r0, a[1] + ny * r0, a[2] + nz * r0, nx, ny, nz); this.vert(b[0] + nx * r1, b[1] + ny * r1, b[2] + nz * r1, nx, ny, nz);
    }
    for (let k = 0; k < sides; k++) { const q = i0 + k * 2; this.i.push(q, q + 2, q + 3, q, q + 3, q + 1); }
    if (caps) for (const [e, r, sg] of [[a, r0, -1], [b, r1, 1]]) {
      const c0 = this.vert(e[0], e[1], e[2], dx * sg, dy * sg, dz * sg);
      for (let k = 0; k <= sides; k++) { const an = k / sides * TAU, c = Math.cos(an), s = Math.sin(an); this.vert(e[0] + (ux * c + vx * s) * r, e[1] + (uy * c + vy * s) * r, e[2] + (uz * c + vz * s) * r, dx * sg, dy * sg, dz * sg); }
      for (let k = 0; k < sides; k++) { if (sg > 0) this.i.push(c0, c0 + 1 + k, c0 + 2 + k); else this.i.push(c0, c0 + 2 + k, c0 + 1 + k); }
    }
    return this;
  }
  // a squared timber from a to b: w across (horizontal), h in the plane of the timber and the vertical
  beam(a, b, w, h) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let sx = dz, sz = -dx; const sl = Math.hypot(sx, sz);
    if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    const tx = dx / L, ty = dy / L, tz = dz / L, ux = sz * ty, uy = sx * tz - sz * tx, uz = -sx * ty;
    const P = (e, s, u) => [e[0] + sx * s * w / 2 + ux * u * h / 2, e[1] + uy * u * h / 2, e[2] + sz * s * w / 2 + uz * u * h / 2];
    this.face(P(a, 1, -1), P(b, 1, -1), P(b, 1, 1), P(a, 1, 1)); this.face(P(b, -1, -1), P(a, -1, -1), P(a, -1, 1), P(b, -1, 1));
    this.face(P(a, -1, 1), P(a, 1, 1), P(b, 1, 1), P(b, -1, 1)); this.face(P(a, 1, -1), P(a, -1, -1), P(b, -1, -1), P(b, 1, -1));
    this.face(P(a, -1, -1), P(a, 1, -1), P(a, 1, 1), P(a, -1, 1)); this.face(P(b, 1, -1), P(b, -1, -1), P(b, -1, 1), P(b, 1, 1));
    return this;
  }
  // a turned piece: rings [metres along, radius] from a toward b (unit steps of the axis a->b), smooth, closed at both ends
  lathe(a, b, rings, sides = 8) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1, d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L, (b[2] - a[2]) / L];
    for (let k = 0; k < rings.length - 1; k++) {
      const p = [a[0] + d[0] * rings[k][0], a[1] + d[1] * rings[k][0], a[2] + d[2] * rings[k][0]], q = [a[0] + d[0] * rings[k + 1][0], a[1] + d[1] * rings[k + 1][0], a[2] + d[2] * rings[k + 1][0]];
      this.tube(p, q, Math.max(rings[k][1], 0.001), Math.max(rings[k + 1][1], 0.001), sides, false);
    }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 2));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
  // the same geometry, with a hand-back to the page between its buffers (no step of the build is long)
  async buildY(ctx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await ctx.yield();
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3)); await ctx.yield();
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 2)); await ctx.yield();
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
}

// ------------------------------------------------------------------ a tileable noise picture for brush, grain and crease
async function noiseTexture(ctx) {
  const N = 256, data = new Uint8Array(N * N * 4);
  const h = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const val = (x, y, per, s) => {
    const fx = x * per / N, fy = y * per / N, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const a = h(x0 % per, y0 % per, s), b = h((x0 + 1) % per, y0 % per, s), c = h(x0 % per, (y0 + 1) % per, s), d = h((x0 + 1) % per, (y0 + 1) % per, s);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (x === 0 && y % 2 === 1) await ctx.yield();
    const o = (y * N + x) * 4;
    data[o] = 255 * (0.5 * val(x, y, 8, 1) + 0.3 * val(x, y, 16, 2) + 0.2 * val(x, y, 32, 3));
    data[o + 1] = 255 * (0.45 * val(x, y, 32, 4) + 0.35 * val(x, y, 64, 5) + 0.2 * h(x, y, 6));
    data[o + 2] = 255 * (0.6 * val(x, y, 4, 7) + 0.4 * val(x, y, 8, 8));
    data[o + 3] = 255 * val(x, y, 128, 9);
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------ the moth's shade (the world draws the moth on the glass)
// THE MOTH ON THE GLASS: MOTH.len metres long (a sixth of the vault's width), on the OUTSIDE of the vault on the lamp's
// upper side; the world finds its place from the lamp's and her main topsail's (MOTH_AT there) and it walks MOTH.walk
// metres each way along the bottle from there. THE LAMP THROWS ITS SHADOW INTO THE BOTTLE: a point is in
// the dusk where the straight line from it to the lamp's flame goes out through the glass under the moth's body or
// its wings, soft at the edge because the flame is broad; MOTH.dusk of the lamp's light goes. THE MOTH RESTS: its
// wings lie swept back in one broad arrowhead, MOTH.rest of its length to either side, and stir a little and slowly
// (every MOTH.flap seconds, MOTH.stir radians at the wing's root, MOTH.breathe of its length at the shade's side).
export const MOTH = { len: 83, walk: 65, cycle: 64, flap: 9, dusk: 0.6, R: 250, rest: 0.42, stir: 0.1, breathe: 0.06 };
export const MOTH_GLSL = /* glsl */`
  uniform vec3 uVMid, uVAxis, uMothN, uMothT, uLampAt; uniform vec4 uMoth;
  float mothShade(vec3 w){
    vec3 d = normalize(uLampAt - w), rel = w - uVMid;
    vec3 q = rel - uVAxis * dot(rel, uVAxis), dq = d - uVAxis * dot(d, uVAxis);
    float a = max(dot(dq, dq), 1e-5), b = dot(q, dq), c = dot(q, q) - ${(MOTH.R * MOTH.R).toFixed(1)};
    vec3 h = rel + d * ((-b + sqrt(max(b * b - a * c, 0.))) / a);
    vec2 m = vec2(dot(h, uVAxis) - uMoth.x, dot(h, uMothT)) / ${MOTH.len.toFixed(1)};
    float body = 1. - smoothstep(.5, 1.3, length(m / vec2(.5, .14)));
    float wings = 1. - smoothstep(.55, 1.25, length((m - vec2(.02, 0.)) / vec2(.42, ${MOTH.rest.toFixed(2)} + ${MOTH.breathe.toFixed(2)} * uMoth.y)));
    return 1. - ${MOTH.dusk.toFixed(2)} * step(0., dot(h, uMothN)) * max(body, wings * .85);
  }`;
// ------------------------------------------------------------------ the shared light block and the ship's own shader
const F2 = (v) => v.toFixed(2), SW = STERN_WINDOWS;
const LIGHT_GLSL = /* glsl */`
  uniform float uTime, uFogDen, uCaus, uRoll;
  uniform vec3 uKeyDir, uKeyCol, uSky, uGround, uFogCol, uLamp, uLampCol, uLampAx, uLampE1;
  uniform vec2 uNet;
  uniform sampler2D uNoise;
  uniform mat4 uShipInv;
  ${MOTH_GLSL}
  float caus(vec2 p, float t){
    vec2 q = p * .085; q += .9 * vec2(sin(q.y * 1.7 + t * .5), sin(q.x * 1.9 - t * .43));
    float a = sin(q.x * 3.1 + t * .31) * sin(q.y * 2.7 - t * .27);
    float c = clamp(1. - abs(a) * 2.2, 0., 1.); return c * c * c;
  }
  // the vault's light on an outside face: the key from the lamp beyond the glass and the green fill, so shade is green
  vec3 vaultLight(vec3 N, float shade){
    float d = clamp(dot(N, uKeyDir) * .78 + .22, 0., 1.);
    return mix(uGround, uSky, N.y * .5 + .5) + uKeyCol * d * d * shade;
  }
  // warm light by place on her stern: her three lanterns (SHIP.lanterns), and the spill of the five windows on the wall round them
  vec3 sternGlow(vec3 Lp, vec3 Nl){
    float lan = 0.;
    ${SHIP.lanterns.map((q) => `{ vec3 tl = vec3(${q[0].toFixed(1)}, ${q[1].toFixed(1)}, ${q[2].toFixed(1)}) - Lp; float d2 = dot(tl, tl); lan += ${q[3].toFixed(2)} * clamp(dot(Nl, tl / sqrt(max(d2, 1e-4))) * .6 + .4, 0., 1.) / (1. + d2 / 30.); }`).join('\n    ')}
    // the windows' spill: strongest on the wall between and round them, reaching the gallery sides and the counter below
    float nearWin = (1. - smoothstep(${F2(SHIP.casement.y1 - 0.9)}, ${F2(SHIP.casement.y1 + 6.6)}, Lp.y)) * smoothstep(1., ${F2(SHIP.casement.y0 + 0.3)}, Lp.y) * (1. - smoothstep(${F2(SHIP.cabin.x1 + 2)}, ${F2(SHIP.cabin.x1 + 9)}, abs(Lp.x)));
    float win = smoothstep(23.2, 24.8, Lp.z) * nearWin * exp(-max(Lp.z - 25.2, 0.) / 4.) * (.55 + .45 * clamp(Nl.z, 0., 1.));
    return uLampCol * (lan * 1.2 + win * .3);
  }
  // a bar of a lattice: 1 on the bar (g counts the bars), w its half width as a share of the spacing
  float latBar(float g, float w){ return 1. - smoothstep(w, w * 1.8, abs(fract(g + .5) - .5)); }
  // the cabin's light on an inside face (ship space): the swinging lamp, falling off over 30 m (a warm gold room), and a
  // little green day from astern
  vec3 cabinLight(vec3 Lp, vec3 Nl){
    vec3 toL = uLamp - Lp; float d = length(toL); vec3 ld = toL / max(d, 1e-3);
    float att = pow(clamp(1. - d / 30., 0., 1.), 1.2) * 1.6 + .2;
    float ndl = clamp(dot(Nl, ld) * .62 + .38, 0., 1.);
    // the deck beams' shadow on the planks between them swings with the lamp
    float up = step(21.9, Lp.y) * step(.5, -Nl.y);
    float zr = Lp.z + (uLamp.z - Lp.z) * .29; float bm = abs(fract((zr - 13.) / 3.4286 + .5) - .5) * 3.4286;
    att *= 1. - .6 * up * (1. - smoothstep(.55, .95, bm));
    // THE LAMP'S OWN SHADOWS, which swing with it: its foot shades a cone below it, its cap a wider one above it, and
    // the four posts of its cage throw four thin bars across the walls, the floor and the table
    float along = -dot(ld, uLampAx); vec3 rad = -ld - uLampAx * along;
    float ang = atan(dot(rad, uLampE1), dot(rad, cross(uLampAx, uLampE1)) + 1e-5);
    float post = (1. - smoothstep(.03, .07, abs(fract((ang - .4) / 1.5708 + .5) - .5))) * (1. - smoothstep(.6, .85, abs(along)));
    att *= 1. - .7 * smoothstep(.93, .975, along) - .45 * smoothstep(.5, .75, -along) - .5 * post;
    float day = (.2 + .8 * clamp(Nl.z, 0., 1.)) * exp(-max(24. - Lp.z, 0.) / 20.);
    // GREEN DAY THROUGH THE STERN WINDOWS lies in bars on whatever faces up (the floor cloth, the table, the seats): the
    // five windows' light slanting forward and down, crossed by the shadows of their lattice (none in the open middle
    // window); it shifts athwart as she rolls
    float yw = Lp.y + (24.6 - Lp.z) * .6, ax = abs(Lp.x + uRoll * 14.);
    float inY = smoothstep(${F2(SHIP.casement.y0)}, ${F2(SHIP.casement.y0 + 0.3)}, yw) * (1. - smoothstep(${F2(SHIP.casement.y1 - 0.3)}, ${F2(SHIP.casement.y1)}, yw));
    float w0 = 1. - smoothstep(${F2(SW[2][1] - 0.3)}, ${F2(SW[2][1])}, ax), w1 = smoothstep(${F2(SW[3][0])}, ${F2(SW[3][0] + 0.2)}, ax) * (1. - smoothstep(${F2(SW[3][1] - 0.2)}, ${F2(SW[3][1])}, ax)), w2 = smoothstep(${F2(SW[4][0])}, ${F2(SW[4][0] + 0.2)}, ax) * (1. - smoothstep(${F2(SW[4][1] - 0.2)}, ${F2(SW[4][1])}, ax));
    float lat = max(max(latBar((ax - ${F2(SW[3][0])}) / ${F2((SW[3][1] - SW[3][0]) / 4)}, .13) * w1, latBar((ax - ${F2(SW[4][0])}) / ${F2((SW[4][1] - SW[4][0]) / 4)}, .13) * w2), latBar((yw - ${F2(SHIP.casement.y0)}) / ${F2((SHIP.casement.y1 - SHIP.casement.y0) / 6)}, .1) * (w1 + w2));
    float pool = step(.6, Nl.y) * inY * (w0 + (w1 + w2) * (1. - .9 * lat)) * exp(-max(24.6 - Lp.z, 0.) / 30.);
    // the corners of the room gather less light: where two of its six faces meet, both darken toward the join
    vec3 an = abs(Nl);
    float cx = smoothstep(0., 1.6, 15. - abs(Lp.x)), cy = smoothstep(0., 1.6, min(Lp.y - 8., 22. - Lp.y)), cz = smoothstep(0., 1.6, min(Lp.z, 24. - Lp.z));
    float corner = mix(1., cx, 1. - an.x) * mix(1., cy, 1. - an.y) * mix(1., cz, 1. - an.z);
    // the lamp's own colour, a fifth of it let go toward white (the cabin is not all one orange), and the green day
    vec3 lampC = mix(uLampCol, vec3(dot(uLampCol, vec3(.333))), .22);
    // THE PICTURE LAMP's warm pool: down the forward bulkhead from the trough over the frame, on the frame, the
    // panelling beside it and the floor cloth before it
    vec3 tp = vec3(0., ${SHIP.picLamp.y.toFixed(2)}, ${SHIP.picLamp.z.toFixed(2)}) - Lp; tp.x *= .45; float dp2 = dot(tp, tp);
    float picl = clamp(dot(Nl, normalize(tp)) * .6 + .4, 0., 1.) * 1.7 / (1. + dp2 / 9.) * (1. - smoothstep(${(SHIP.picLamp.y - 0.1).toFixed(2)}, ${(SHIP.picLamp.y + 0.3).toFixed(2)}, Lp.y));
    return (lampC * att * ndl * (1. - .4 * pool) + uSky * (day * 1.5 + .08) + uSky * vec3(.8, 1.15, 1.) * pool * 4.5) * (.42 + .58 * corner) + uLampCol * vec3(1., .86, .6) * picl;
  }
  // 1 inside the cabin volume, 0 outside, blending across the stern wall's thickness
  float inCabin(vec3 Lp){
    return step(abs(Lp.x), 15.03) * step(7.97, Lp.y) * step(Lp.y, 22.2) * step(-.03, Lp.z) * (1. - smoothstep(24.05, 25.15, Lp.z));
  }
  vec3 haze(vec3 col, float dist){ float f = 1. - exp(-uFogDen * uFogDen * dist * dist); return mix(col, uFogCol, clamp(f, 0., 1.)); }
`;
const SHIP_VERT = /* glsl */`
  attribute vec3 aCol; attribute vec2 aMat;
  uniform mat4 uShipInv;
  varying vec3 vCol, vN, vW, vL, vNl; varying vec2 vMat;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
    vL = (uShipInv * w).xyz; vNl = mat3(uShipInv) * vN;
    vCol = aCol; vMat = aMat;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const SHIP_FRAG = /* glsl */`
  precision highp float;
  ${LIGHT_GLSL}
  uniform vec3 uOchre, uCopper, uPlaster, uTar;
  varying vec3 vCol, vN, vW, vL, vNl; varying vec2 vMat;
  float lineAt(float g, float w){ float f = fwidth(g); return 1. - smoothstep(w, w + max(f, 1e-4) * 1.5, abs(fract(g + .5) - .5)); }
  void main(){
    float kind = vMat.x, par = vMat.y;
    vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-3);
    vec3 N = normalize(vN), Nl = normalize(vNl);
    if (dot(N, V) < 0.) { N = -N; Nl = -Nl; }
    vec3 alb = vCol, emis = vec3(0.); float gloss = 0., shade = 1., shin = 22.;
    vec4 n1 = texture2D(uNoise, vL.zy * .021 + vL.x * .013), n2 = texture2D(uNoise, vL.xz * .067 + vL.y * .031);
    if (kind < .5) {
      alb *= .82 + .36 * n1.g;
    } else if (kind < 1.5) {
      // hull planking, TARRED BLACK: par is the strake's number from the rail and the share down it. Each plank has
      // its own tone and its butts; old tar has gathered under every step; one ochre band (the second strake), a thin
      // plaster line under it; the two wales worn paler on their lower edges; a stained copper-green bottom
      float strake = floor(par), within = fract(par);
      float tone = texture2D(uNoise, vec2(vL.z * .0045 + strake * .37, strake * .113)).r;
      alb *= .55 + .9 * tone;
      float butt = lineAt(vL.z / 16. + fract(strake * .381), .006); alb *= 1. - .6 * butt;
      alb *= 1. - .45 * (1. - smoothstep(0., .1, within));
      float wale = (1. - step(.5, abs(strake - 3.))) + (1. - step(.5, abs(strake - 5.)));
      alb += vec3(.035, .03, .022) * wale * smoothstep(.8, 1., within) * (.4 + n2.g);
      float band = 1. - step(.5, abs(strake - 1.));
      alb = mix(alb, uOchre * (.62 + .5 * tone) * (1. - .3 * butt), band * .96);
      alb = mix(alb, uPlaster * .6, (1. - step(.5, abs(strake - 2.))) * (1. - smoothstep(.08, .12, within)) * .85);
      float wl = vL.y + 2.2 * (n1.b - .5);
      alb = mix(alb, uCopper * (.55 + .8 * n2.g), 1. - smoothstep(.2, 2.4, wl));
      alb = mix(alb, uPlaster * .8, .55 * n2.r * exp(-(wl - 3.2) * (wl - 3.2) / 3.));
      // a hard varnish over the tar
      gloss = 2.6; shin = 90.;
    } else if (kind < 2.5) {
      // deck planking: seams 1.2 m apart along the keel, staggered butts; par: metres from the weather bulwark
      float g = vL.x / 1.2, pl = floor(g);
      alb *= (.74 + .5 * texture2D(uNoise, vec2(vL.z * .006 + pl * .29, pl * .17)).r) * (1. - .55 * lineAt(g, .04));
      alb *= 1. - .35 * lineAt(vL.z / 14. + fract(pl * .437), .005);
      shade = .35 + .65 * smoothstep(3.5, 7.5, par);
    } else if (kind < 3.5) {
      // old gilt, worn dark in the hollows (the picture frame's own gilt blazes: it gives more light than it takes);
      // on the picture frame a row of small square cuts round its flat and a row of
      // beads round its outer round (the frame is the only gilt thing on the forward bulkhead)
      float along = abs(Nl.x) > abs(Nl.y) ? vL.y : vL.x;
      float outw = max(abs(vL.x) - ${SHIP.sight.hx.toFixed(2)}, abs(vL.y - 15.) - ${SHIP.sight.hy.toFixed(2)}), onFrame = step(vL.z, 1.) * step(-.2, vL.z);
      float dent = lineAt(along / .34, .22) * smoothstep(.3, .34, outw) * (1. - smoothstep(.58, .62, outw));
      float bead = lineAt(along / .17, .12) * smoothstep(.84, .88, outw) * (1. - smoothstep(.98, 1.02, outw));
      float hollow = 1. - smoothstep(0., .1, abs(outw - .25)) + 1. - smoothstep(0., .08, abs(outw - .66));
      alb *= (.66 + .5 * n2.g) * (1. - onFrame * (.45 * dent + .4 * bead + .35 * clamp(hollow, 0., 1.)));
      emis = alb * (.6 + 1.45 * onFrame); gloss = 1.8;
    } else if (kind < 4.5) {
      emis = vCol * par; alb = vec3(0.);
      if (par < 3.5) {
        // a lit window: small panes in a lattice of bars, brighter low down where the lamp stands behind
        vec2 q = abs(Nl.z) > .7 ? vL.xy : vL.zy;
        float bars = max(lineAt(q.x / .93, .07), lineAt(q.y / .95, .07));
        emis = vCol * par * (.3 + .22 * n2.g + .16 * (1. - smoothstep(11., 19., vL.y))) * (1. - .3 * bars);
      }
    } else if (kind < 5.5) {
      // the floor cloth: squares of 3 m, tarred black and plaster white, a painted weave
      vec2 q = vL.xz / 3.; vec2 fq = max(fwidth(q), vec2(1e-4));
      vec2 tri = abs(fract(q * .5) - .5) * 2.;
      vec2 sq = smoothstep(.5 - fq, .5 + fq, tri);
      float chk = sq.x + sq.y - 2. * sq.x * sq.y;
      alb = mix(uTar * 1.6, uPlaster * .82, chk) * (.8 + .4 * n2.g);
    } else if (kind < 6.5) {
      // the chart: coasts and lines only (no letters, no figures): land by a contour of noise, rhumb lines from two roses
      vec2 c = vCol.rg; float land = texture2D(uNoise, c * .37 + .21).r + .35 * texture2D(uNoise, c * 1.3).g;
      float fwl = max(fwidth(land), 1e-4);
      float coast = 1. - smoothstep(0., fwl * 2.5, abs(land - .62));
      float isLand = smoothstep(.62 - fwl, .62 + fwl, land);
      vec2 r1 = c - vec2(.28, .34), r2 = c - vec2(.74, .66);
      float a1 = atan(r1.y, r1.x + 1e-5) * 2.546, a2 = atan(r2.y, r2.x + 1e-5) * 2.546;
      float rh = max(lineAt(a1, .012) * smoothstep(.02, .06, length(r1)), lineAt(a2, .012) * smoothstep(.02, .06, length(r2)));
      alb = vec3(.74, .66, .47) * (.85 + .3 * n2.g);
      alb = mix(alb, vec3(.6, .5, .3), isLand * .55); alb = mix(alb, vec3(.5, .2, .1), rh * .5 * (1. - isLand)); alb = mix(alb, vec3(.12, .09, .06), coast * .85);
      float edge = min(min(c.x, 1. - c.x), min(c.y, 1. - c.y)); alb *= .75 + .25 * smoothstep(0., .04, edge);
    } else if (kind < 7.5) {
      // panelled wood: raised panels of par metres with a dark bevel
      vec2 q = abs(Nl.z) > .7 ? vL.xy : (abs(Nl.x) > .7 ? vL.zy : vL.xz);
      vec2 f = abs(fract(q / max(par, .1)) - .5) * 2.; float m = max(f.x, f.y);
      float stile = smoothstep(.8, .84, m), bevel = smoothstep(.66, .72, m) * (1. - smoothstep(.76, .8, m));
      float grain = texture2D(uNoise, q * vec2(.19, .013) + floor(q.x / max(par, .1)) * .37).g;
      alb *= (.7 + .34 * texture2D(uNoise, q * vec2(.011, .09)).r + .3 * grain) * (1. + .2 * stile - .5 * bevel);
      gloss = .45;
    } else {
      // a furled sail: a paper roll with creases, a gasket every 5 m
      alb *= (.7 + .55 * n1.r) * (1. - .7 * lineAt(par / 5., .05)); emis = alb * .1;
    }
    float cab = inCabin(vL);
    // the moth's dusk takes the lamp's light where its shadow lies
    vec3 outL = vaultLight(N, shade * mothShade(vW)) + sternGlow(vL, Nl);
    // the net of light from the glass crawls over what faces the lamp
    outL += uKeyCol * uCaus * caus(vec2(vW.z + vW.x * .4, vW.y * 1.3 + vW.x * .5) + uNet, uTime) * clamp(dot(N, uKeyDir) + .35, 0., 1.);
    vec3 inL = cabinLight(vL, Nl);
    vec3 col = alb * mix(outL, inL, cab);
    // a thin varnish glint
    vec3 Vl = mat3(uShipInv) * V, ldl = normalize(uLamp - vL + vec3(0., 1e-4, 0.));
    float spOut = pow(clamp(dot(reflect(-uKeyDir, N), V), 0., 1.), shin), spIn = pow(clamp(dot(reflect(-ldl, Nl), Vl), 0., 1.), shin);
    col += gloss * mix(spOut * uKeyCol * .12, spIn * uLampCol * .5, cab) * (.4 + alb * 2.);
    // old gilt in the cabin catches the swinging lamp in a broad travelling sheen
    if (kind > 2.5 && kind < 3.5) col += cab * alb * uLampCol * pow(clamp(dot(Nl, normalize(ldl + Vl)), 0., 1.), 10.) * .8;
    // varnish takes the green of the glass on its gloss, most at a grazing eye
    col += uSky * gloss * (1. - cab) * (.035 + .3 * pow(1. - clamp(dot(N, V), 0., 1.), 3.));
    col += emis;
    gl_FragColor = vec4(haze(col, dist * (1. - cab)), 1.);
  }`;

// ------------------------------------------------------------------ the cabin (x -15 to 15, y 8 to 22, z 0 to 24) and the gilt frame
const BEAM_PITCH = 24 / 7, BEAM_Z0 = 13;
// THE CABIN'S HANGING LAMP: its hook under the middle deck beam (BEAM_Z0 abaft the canvas, CABIN_LAMP.y high), its
// flame CABIN_LAMP.drop under the hook; it swings up to CABIN_LAMP.swing degrees athwartships; its glow is a card
// CABIN_LAMP.card metres across that turns to the eye. THE HOOK STANDS SO FAR TO PORT (CABIN_LAMP.x) that at the
// inboard end of the lamp's swing the whole card stands outside the opening's outline (keepX).
const CABIN_LAMP = { y: 21, z: BEAM_Z0, drop: 3.55, swing: 25, card: 5.5 };
CABIN_LAMP.x = -(keepX(CABIN_LAMP.z, CABIN_LAMP.y - CABIN_LAMP.drop * Math.cos(CABIN_LAMP.swing * DEG), CABIN_LAMP.card / 2) + CABIN_LAMP.drop * Math.sin(CABIN_LAMP.swing * DEG));
// THE TABLE (its inboard edge TABLE.x0) and THE CHAIR at its after end stand outboard of the same outline
const TABLE = { x0: 5.5, x1: 14, z0: 7, z1: 17, top: 12.5 };
// a moulding swept round a rectangle: profile points [metres out from the inner edge, metres proud], inner half sizes hx, hy
function mouldingInto(g, cx, cy, z0, hx, hy, prof) {
  const corner = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  for (let k = 0; k < 4; k++) {
    const a = corner[k], b = corner[(k + 1) % 4];
    for (let j = 0; j < prof.length - 1; j++) {
      const p = prof[j], q = prof[j + 1];
      const A = [cx + a[0] * (hx + p[0]), cy + a[1] * (hy + p[0]), z0 + p[1]], B = [cx + b[0] * (hx + p[0]), cy + b[1] * (hy + p[0]), z0 + p[1]];
      const C = [cx + b[0] * (hx + q[0]), cy + b[1] * (hy + q[0]), z0 + q[1]], D = [cx + a[0] * (hx + q[0]), cy + a[1] * (hy + q[0]), z0 + q[1]];
      g.face(A, B, C, D);
    }
  }
}
// (cabinInto, sternInto, sternWorkInto and quarterGalleryInto hand the page back between their pieces: ctx.yield)
async function cabinInto(g, C, ctx) {
  const cb = SHIP.cabin, P = SHIP.P, y0 = cb.y0, yc = 22;
  // the floor cloth
  g.color([1, 1, 1]).mat(5).face([cb.x0, y0, cb.z1], [cb.x1, y0, cb.z1], [cb.x1, y0, cb.z0], [cb.x0, y0, cb.z0]);
  // the deckhead: pale planks between seven dark beams 1.4 m deep (undersides y 21)
  g.color(C.deckhead).mat(0).face([cb.x0, yc, cb.z0], [cb.x1, yc, cb.z0], [cb.x1, yc, cb.z1], [cb.x0, yc, cb.z1]);
  g.color(C.beam).mat(0);
  for (let k = -3; k <= 3; k++) { const z = BEAM_Z0 + k * BEAM_PITCH; g.box(cb.x0, 21, z - 0.55, cb.x1, yc + 0.4, z + 0.55, 'YxX'); }
  g.box(cb.x0, 20.4, cb.z0, cb.x0 + 0.7, yc, cb.z1, 'xY').box(cb.x1 - 0.7, 20.4, cb.z0, cb.x1, yc, cb.z1, 'XY');
  // the side walls, panelled, each with a plain door to the quarter gallery
  g.color(C.panel).mat(7, 3);
  g.face([cb.x0, y0, cb.z0], [cb.x0, y0, cb.z1], [cb.x0, yc, cb.z1], [cb.x0, yc, cb.z0]);
  g.face([cb.x1, y0, cb.z1], [cb.x1, y0, cb.z0], [cb.x1, yc, cb.z0], [cb.x1, yc, cb.z1]);
  g.color(C.trim).mat(7, 1.6);
  for (const sx of [-1, 1]) g.box(sx > 0 ? 14.75 : -15, y0, 17.2, sx > 0 ? 15 : -14.75, 17.6, 21, sx > 0 ? 'X' : 'x');
  // the forward bulkhead round a hole: the opening's own half sizes turned through her greatest roll, and 0.1 m (the
  // upright opening stands free inside it, under the frame's moulding, however she rolls)
  const rollMax = (MOTION.heel + MOTION.roll) * DEG, O = SHIP.opening, fo = SHIP.sight.hx + SHIP.frameWide;
  const hx = O.hx * Math.cos(rollMax) + O.hy * Math.sin(rollMax) + 0.1, hy = O.hy * Math.cos(rollMax) + O.hx * Math.sin(rollMax) + 0.1;
  g.color(C.panel).mat(7, 2.5);
  g.face([cb.x0, y0, 0], [P[0] - hx, y0, 0], [P[0] - hx, yc, 0], [cb.x0, yc, 0]);
  g.face([P[0] + hx, y0, 0], [cb.x1, y0, 0], [cb.x1, yc, 0], [P[0] + hx, yc, 0]);
  g.face([P[0] - hx, y0, 0], [P[0] + hx, y0, 0], [P[0] + hx, P[1] - hy, 0], [P[0] - hx, P[1] - hy, 0]);
  g.face([P[0] - hx, P[1] + hy, 0], [P[0] + hx, P[1] + hy, 0], [P[0] + hx, yc, 0], [P[0] - hx, yc, 0]);
  // a dado rail and a cornice across the bulkhead and the sides
  g.color(C.trim).mat(0);
  g.box(cb.x0, 10.6, 0, P[0] - fo - 0.05, 11, 0.22, 'z').box(P[0] + fo + 0.05, 10.6, 0, cb.x1, 11, 0.22, 'z');
  g.box(cb.x0, 20.2, 0, cb.x1, 20.9, 0.3, 'z');
  await ctx.yield();
  // BUILT MOULDINGS: along both side walls a dado rail, a cornice and a pilaster under every deck beam; on the forward
  // bulkhead a pilaster at each side of the frame (5.3 m and more from the line) and a plinth along the foot
  for (const sx of [-1, 1]) {
    const xa = sx > 0 ? 14.72 : -15, xb = sx > 0 ? 15 : -14.72, skip = sx > 0 ? 'X' : 'x';
    g.color(C.trim).mat(0).box(xa, 10.6, cb.z0, xb, 11, 17.2, skip).box(xa, 20.2, cb.z0, xb, 20.9, cb.z1, skip).box(xa, y0, cb.z0, xb, 8.7, 17.2, skip);
    for (let k = -3; k <= 3; k++) { const z = BEAM_Z0 + k * BEAM_PITCH; if (z < 16.6) g.box(sx > 0 ? 14.82 : -15, 11, z - 0.4, sx > 0 ? 15 : -14.82, 20.2, z + 0.4, skip); }
    // (each pilaster stands 0.55 m outside the frame's outer edge, SHIP.sight.hx + SHIP.frameWide)
    const px = sx * (fo + 0.55);
    g.box(px - 0.32, 11, 0, px + 0.32, 20.2, 0.26, 'z').box(px - 0.42, 19.5, 0, px + 0.42, 20.2, 0.36, 'z').box(px - 0.42, 11, 0, px + 0.42, 11.6, 0.36, 'z');
  }
  g.box(-8, y0, 0, 7.6, 8.7, 0.24, 'zy');
  // the door to port of the frame
  g.color(C.trim).mat(0).box(-12.6, y0, 0, -8, 19, 0.25, 'zy');
  g.color(C.door).mat(7, 2.1).box(-12.2, y0, 0.25, -8.4, 18.6, 0.4, 'zy');
  g.color(C.gilt).mat(3).box(-8.95, 12.6, 0.4, -8.6, 12.95, 0.75);
  await ctx.yield();
  // the rack of plain rolled charts to starboard of it
  g.color(C.trim).mat(0);
  g.box(7.6, 10.2, 0, 13.4, 19.2, 0.3, 'z');
  for (let r = 0; r <= 4; r++) g.box(7.6, 10.2 + r * 2.15, 0.3, 13.4, 10.5 + r * 2.15, 1.9, 'z');
  for (let c = 0; c <= 3; c++) g.box(7.6 + c * 1.83, 10.2, 0.3, 7.9 + c * 1.83, 19.1, 1.9, 'z');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const n = 1 + ((r * 3 + c) * 5) % 3;
    for (let k = 0; k < n; k++) {
      const x = 8.45 + c * 1.83 + k * 0.42, y = 10.85 + r * 2.15 + (k % 2) * 0.36, len = 1.7 + ((r + c * 2 + k) % 3) * 0.25, rr = 0.2 + ((r + k) % 2) * 0.04;
      g.color(mul(C.paper, 0.75 + 0.1 * ((r + c + k) % 3))).mat(0).tube([x, y, 0.35], [x, y, 0.35 + len], rr, rr, 7, true);
    }
  }
  // THE GILT FRAME: its sight (SHIP.sight, 8.3 by 6.1) is one sharp edge 0.02 m before the canvas plane; from that edge
  // the moulding slopes OUTWARD both ways (forward behind the canvas, and astern to an outer 10.5 by 8.3, 0.6 m proud),
  // so no part of it is nearer the line than the sight's own edge: 3.05 m, and a hair under that at the worst of her
  // 2 degrees of pitch
  await ctx.yield();
  g.color(C.gilt).mat(3);
  mouldingInto(g, P[0], P[1], 0, SHIP.sight.hx, SHIP.sight.hy, [[0.05, -0.1], [0, 0.02], [0.1, 0.24], [0.2, 0.24], [0.3, 0.3], [0.62, 0.34], [0.86, 0.52], [0.98, 0.6], [1.1, 0.5], [1.1, 0]]);
  // THE PICTURE LAMP: a brass trough on two arms from the bulkhead over the frame, open below, a slot of light in it
  {
    const L = SHIP.picLamp;
    g.color(C.gilt).mat(0).tube([P[0] - L.half, L.y, L.z], [P[0] + L.half, L.y, L.z], L.r, L.r, 8, true);
    for (const sx of [-1, 1]) g.tube([P[0] + sx * L.half * 0.6, L.y + 0.12, 0.02], [P[0] + sx * L.half * 0.6, L.y + 0.12, L.z], 0.07, 0.07, 6);
    g.color(C.lamp).mat(4, 4.2).box(P[0] - L.half + 0.12, L.y - L.r - 0.05, L.z - 0.17, P[0] + L.half - 0.12, L.y - L.r + 0.01, L.z + 0.17);
  }
  // the table to starboard (top y 12.5), the settee to port, a locker seat under the stern windows
  g.color(C.table).mat(0).box(TABLE.x0, TABLE.top - 0.5, TABLE.z0, TABLE.x1, TABLE.top, TABLE.z1);
  for (const [x, z] of [[6.3, 7.8], [13.2, 7.8], [6.3, 16.2], [13.2, 16.2]]) g.box(x - 0.45, y0, z - 0.45, x + 0.45, 12, z + 0.45, 'yY');
  g.box(6.3, 9.2, 7.6, 13.2, 9.7, 8.0).box(6.3, 9.2, 16.0, 13.2, 9.7, 16.4);
  // a chair drawn up to the table's after end, in the middle of its breadth, its back toward the stern lights: seat,
  // four legs, a back of two posts and two rails. Every part of it stands outboard of the table's inboard edge.
  {
    const cx = (TABLE.x0 + TABLE.x1) / 2, za = TABLE.z1 + 0.4, zb = za + 1.8;
    g.color(C.table).mat(0).box(cx - 0.9, 10.3, za, cx + 0.9, 10.6, zb);
    for (const x of [cx - 0.8, cx + 0.8]) for (const z of [za + 0.1, zb - 0.1]) g.box(x - 0.1, y0, z - 0.1, x + 0.1, 10.3, z + 0.1, 'yY');
    for (const x of [cx - 0.8, cx + 0.8]) g.box(x - 0.1, 10.6, zb - 0.2, x + 0.1, 13.5, zb, 'y');
    g.box(cx - 0.8, 12.9, zb - 0.18, cx + 0.8, 13.4, zb - 0.02).box(cx - 0.8, 11.7, zb - 0.18, cx + 0.8, 12.1, zb - 0.02);
  }
  g.color(C.panel).mat(7, 1.5).box(-15, y0, 4, -10, 10.6, 20, 'xy');
  g.color(C.cloth).mat(0).box(-14.9, 10.6, 4.2, -10.2, 11.5, 19.8, 'xy').box(-14.9, 11.5, 4.2, -13.4, 15, 19.8, 'xy');
  g.color(C.panel).mat(7, 1.5).box(-15, y0, 21.4, 15, 10.2, 24, 'Zy');
}

// ------------------------------------------------------------------ the stern: the wall with five tall windows, mouldings, taffrail, lantern, galleries
const xoAt = (y) => { const yt = railAt(24), yb = keelAt(24); return sectionAt(24, Math.min(1, Math.max(0, (yt - y) / (yt - yb))))[0]; };
async function sternInto(g, C, panes, ctx) {
  const zi = SHIP.transomZ, zo = SHIP.transomOut, W = SHIP.casement, cb = SHIP.cabin;
  const marks = [keelAt(24), 8, W.y0, W.y1, 22, railAt(24)], ys = [];
  for (let k = 0; k < marks.length - 1; k++) { const n = Math.ceil((marks[k + 1] - marks[k]) / 0.9); for (let j = 0; j < n; j++) ys.push(marks[k] + (marks[k + 1] - marks[k]) * j / n); }
  ys.push(marks[marks.length - 1]);
  for (let r = 0; r < ys.length - 1; r++) {
    if (r % 6 === 5) await ctx.yield();
    const ya = ys[r], yb = ys[r + 1], xa = xoAt(ya), xb = xoAt(yb), inWin = ya >= W.y0 - 1e-6 && yb <= W.y1 + 1e-6;
    const spans = [];
    if (!inWin) spans.push([-1, 1, null, null]);
    else { spans.push([-1, 0, null, STERN_WINDOWS[0][0]]); for (let k = 0; k < 4; k++) spans.push([0, 0, STERN_WINDOWS[k][1], STERN_WINDOWS[k + 1][0]]); spans.push([0, 1, STERN_WINDOWS[4][1], null]); }
    for (const sp of spans) {
      const x0a = sp[2] ?? -xa, x0b = sp[2] ?? -xb, x1a = sp[3] ?? xa, x1b = sp[3] ?? xb;
      const hi = ya >= 22 - 1e-6 && yb <= 27.3, lo = yb <= 9.8;
      // the counter under the windows is planked: each plank's lower edge stands 0.14 m proud, a real seam under it
      const lap = lo ? 0.14 : 0;
      g.color(hi ? C.sternBand : lo ? C.counter : C.hull).mat(hi ? 7 : lo ? 1 : 0, hi ? 2.6 : 8.5).face([x0a, ya, zo + lap], [x1a, ya, zo + lap], [x1b, yb, zo], [x0b, yb, zo]);
      if (lo) g.face([x0b, yb, zo], [x1b, yb, zo], [x1b, yb, zo + lap], [x0b, yb, zo + lap]);
      if (ya >= cb.y0 - 1e-6 && yb <= 22 + 1e-6) {
        const c0a = Math.max(x0a, cb.x0), c0b = Math.max(x0b, cb.x0), c1a = Math.min(x1a, cb.x1), c1b = Math.min(x1b, cb.x1);
        if (c1a > c0a) g.color(C.panel).mat(7, 2.2).face([c1a, ya, zi], [c0a, ya, zi], [c0b, yb, zi], [c1b, yb, zi]);
      }
    }
  }
  // the reveals of the five windows; glazing bars and panes in four of them: the middle one is OPEN, nothing across it
  await ctx.yield();
  for (let k = 0; k < 5; k++) {
    const [x0, x1] = STERN_WINDOWS[k];
    g.color(C.trim).mat(0);
    g.face([x0, W.y0, zo], [x0, W.y0, zi], [x0, W.y1, zi], [x0, W.y1, zo]).face([x1, W.y0, zi], [x1, W.y0, zo], [x1, W.y1, zo], [x1, W.y1, zi]);
    g.face([x0, W.y0, zi], [x1, W.y0, zi], [x1, W.y0, zo], [x0, W.y0, zo]).face([x0, W.y1, zo], [x1, W.y1, zo], [x1, W.y1, zi], [x0, W.y1, zi]);
    if (k === 2) continue;
    g.color(C.tarLit).mat(0);
    for (let j = 1; j < 4; j++) { const x = x0 + (x1 - x0) * j / 4; g.box(x - 0.09, W.y0, 24.5, x + 0.09, W.y1, 24.74, 'yY'); }
    for (let j = 1; j < 6; j++) { const y = W.y0 + (W.y1 - W.y0) * j / 6; g.box(x0, y - 0.09, 24.5, x1, y + 0.09, 24.74, 'xX'); }
    panes.push([x0, W.y0, x1, W.y1, 24.62, 0]);
  }
  // pilasters on the piers, two lines of old gilt, the taffrail
  await ctx.yield();
  g.color(C.tarLit).mat(0);
  for (const x of STERN_PIERS) g.box(x - 0.34, W.y0 - 0.4, zo, x + 0.34, W.y1 + 0.4, zo + 0.32, 'z');
  g.color(C.gilt).mat(3);
  for (const y of [W.y0 - 0.75, W.y1 + 0.45]) { const x = xoAt(y + 0.15) + 0.05; g.box(-x, y, zo, x, y + 0.3, zo + 0.34, 'z'); }
  { const x = xoAt(27.3) + 0.05; g.box(-x, 27.2, zo, x, 27.45, zo + 0.3, 'z'); }
  g.color(C.tarLit).mat(0); { const x = xoAt(29) + 0.5; g.box(-x, 28.7, 23, x, 29.6, 26.4); }
  // the three stern lanterns' iron crooks on the taffrail (a post, an arm bent aft over the stern, two stays down to
  // the rail): each lantern HANGS from its crook's hook, LANTERN_SWING.hang times its size over its flame, in a frame of
  // its own (lanternGeo), so that it can swing; SHIP.lanterns has each flame and its size
  for (const [x, y, z, k] of SHIP.lanterns) {
    const hy = y + LANTERN_SWING.hang * k, zp = z - 2.4 * k;
    g.color(C.tar).mat(0).tube([x, 29.6, zp], [x, hy + 0.9 * k, zp], 0.3 * k, 0.2 * k, 6).tube([x, hy + 0.9 * k, zp], [x, hy + 1.1 * k, z - k], 0.2 * k, 0.16 * k, 6).tube([x, hy + 1.1 * k, z - k], [x, hy + 0.1 * k, z], 0.16 * k, 0.1 * k, 6, true);
    g.color(C.iron).mat(0);
    for (const sx of [-1, 1]) g.tube([x, y, zp], [x + sx * 3.4 * k, 29.6, zp - 0.2], 0.08, 0.08, 4);
  }
}

// THE STERN'S CARVED WORK, built: the gallery over the windows (a walk on scrolled brackets, a rail on turned balusters),
// the quarter pieces (bead and reel up each corner of the stern, a plain scroll at the head of each: no figure), the
// lattice of the quarter galleries' windows as real bars. Its lowest part, the walk's underside (GALLERY.y0), is 6.2 m
// over the last line; nothing of it is before the open middle window.
const GALLERY = { y0: 21.2, y1: 21.6, out: 2.3, rail: 24.1, pitch: 0.95 };
const BALUSTER = [[0, 0.21], [0.16, 0.21], [0.34, 0.09], [0.86, 0.25], [1.25, 0.2], [1.66, 0.08], [2.0, 0.12], [2.22, 0.2], [2.5, 0.2]];
async function sternWorkInto(g, C, ctx) {
  const zo = SHIP.transomOut, G = GALLERY, hw = xoAt(G.y1) + 0.25, zr = zo + G.out;
  // the walk, its edge moulding, the brackets under it at the piers and the corners
  g.color(C.tarLit).mat(7, 1.4).box(-hw, G.y0, zo, hw, G.y1, zr, 'z');
  g.color(C.gilt).mat(3).box(-hw - 0.08, G.y0 + 0.08, zr, hw + 0.08, G.y1 - 0.06, zr + 0.14, 'z');
  for (const x of [-hw + 0.5, ...STERN_PIERS, hw - 0.5]) {
    g.color(C.tarLit).mat(0);
    let prev = null;
    for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 0.5, p = [x, G.y0 - 1.9 + 1.9 * Math.sin(a), zo + 0.2 + (G.out - 0.5) * (1 - Math.cos(a))]; if (prev) g.tube(prev, p, 0.3 - 0.012 * k, 0.3 - 0.012 * (k + 1), 6); prev = p; }
    g.color(C.gilt).mat(3).lathe([x, G.y0 - 2.5, zo + 0.25], [x, G.y0 - 1.9, zo + 0.25], [[0, 0.02], [0.2, 0.26], [0.45, 0.3], [0.6, 0.18]], 6);
    await ctx.yield();
  }
  // the rail and its turned balusters: across the stern, and the two short returns to the wall
  const baluster = (x, z) => g.lathe([x, G.y1, z], [x, G.rail, z], BALUSTER, 6);
  g.color(C.carved).mat(0);
  const nAcross = Math.round((2 * hw - 0.8) / G.pitch);
  for (let k = 0; k <= nAcross; k++) { baluster(-hw + 0.4 + (2 * hw - 0.8) * k / nAcross, zr - 0.3); if (k % 6 === 5) await ctx.yield(); }
  for (const sx of [-1, 1]) for (let k = 1; k <= 2; k++) baluster(sx * (hw - 0.4), zr - 0.3 - k * 0.66);
  await ctx.yield();
  g.color(C.tarLit).mat(0).box(-hw, G.rail, zr - 0.6, hw, G.rail + 0.34, zr).box(-hw, G.rail, zo, -hw + 0.6, G.rail + 0.34, zr - 0.6).box(hw - 0.6, G.rail, zo, hw, G.rail + 0.34, zr - 0.6);
  // the quarter pieces: bead and reel up each corner, following the stern's own outline; a plain scroll at each head
  for (const sx of [-1, 1]) {
    g.color(C.gilt).mat(3);
    for (let y = 9.6; y < 20.4; y += 1.8) {
      const a = [sx * (xoAt(y) + 0.1), y, zo + 0.3], b = [sx * (xoAt(y + 1.8) + 0.1), y + 1.8, zo + 0.3];
      g.lathe(a, b, [[0, 0.24], [0.3, 0.5], [0.62, 0.24], [0.9, 0.34], [1.2, 0.34], [1.5, 0.24], [1.83, 0.24]], 7);
    }
    let sp = null;
    for (let k = 0; k <= 14; k++) { const a = -Math.PI / 2 + k / 14 * Math.PI * 2.4, r = 1.5 * (1 - k / 20), p = [sx * (xoAt(27) - 0.4 + Math.cos(a) * r * 0.2), 26.4 + Math.sin(a) * r, zo + 0.5 + Math.cos(a) * r]; if (sp) g.tube(sp, p, 0.36 * (1 - k / 26), 0.36 * (1 - (k + 1) / 26), 6); sp = p; }
    await ctx.yield();
  }
}

// ------------------------------------------------------------------ the hull: skin, rail cap, bulwarks, decks, breaks, stem and scroll
const deckAt = (z) => (z > SHIP.poopBreakZ ? SHIP.poopDeckY : z > SHIP.fcBreakZ ? SHIP.deckY : SHIP.fcDeckY);
// half breadth of the hull's skin at height y, station z
const breadthAt = (z, y) => { const zz = Math.min(z, 24), yt = railAt(zz), yb = keelAt(zz); return sectionAt(zz, Math.min(1, Math.max(0, (yt - y) / (yt - yb))))[0]; };
// THE QUARTER GALLERIES, BUILT (one a side): a glazed bay that swells out of her quarter over QG.swell metres and runs
// aft to the transom, QG.out metres proud. Between a lower and an upper gilt moulding a row of lights, lit from within,
// parted by gilt mullions; over them a roof turned in a quarter round with gilt ribs and a finial; under them a drop
// that draws in and down to a turned pendant; its after end closed and glazed. Nothing of it is within 15 m of the line.
const QG = { z0: 6.5, z1: SHIP.transomOut, out: 3.6, swell: 8, low: 10.5, sill: 11.4, head: 19, top: 19.9, roof: 4.4, drop: 5.8 };
async function quarterGalleryInto(g, C, sx, ctx) {
  const NZ = 9, zc = QG.z0 + 0.62 * (QG.z1 - QG.z0), prof = [];
  // the profile up the bay: [height, share of the projection, share of the bay's length]
  for (let k = 0; k <= 5; k++) { const t = k / 5; prof.push([QG.low - QG.drop * (1 - t), Math.pow(t, 1.5), 0.3 + 0.7 * Math.sqrt(t)]); }
  prof.push([QG.sill, 1, 1], [QG.head, 1, 1], [QG.top, 1, 1]);
  for (let k = 1; k <= 5; k++) { const a = k / 5 * Math.PI / 2; prof.push([QG.top + QG.roof * Math.sin(a), Math.cos(a), 1 - 0.3 * Math.sin(a)]); }
  const NJ = prof.length - 1, proj = (z) => QG.out * Math.sin(Math.PI / 2 * Math.min(1, (z - QG.z0) / QG.swell));
  const at = (i, j, lift = 0) => { const z0 = QG.z0 + (QG.z1 - QG.z0) * i / NZ, [y, f, gz] = prof[j], z = zc + (z0 - zc) * gz; return [sx * (breadthAt(z, y) - 0.15 + proj(z0) * f + lift), y, z]; };
  const inner = (j) => { const [y, , gz] = prof[j], z = zc + (QG.z1 - zc) * gz; return [sx * (breadthAt(z, y) - 0.3), y, z]; };
  for (let j = 0; j < NJ; j++) {
    const band = j < 5 ? 0 : j === 5 || j === 7 ? 1 : j === 6 ? 2 : 3;
    if (band === 0) g.color(C.sternBand).mat(7, 1.3); else if (band === 1) g.color(C.gilt).mat(3); else if (band === 2) g.color(C.lamp).mat(4, 3.2); else g.color(C.roof).mat(0);
    for (let i = 0; i < NZ; i++) g.face(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
    // the after end, closed (glazed between the mouldings)
    g.face(at(NZ, j), inner(j), inner(j + 1), at(NZ, j + 1));
  }
  // gilt: the four mouldings round the bay, a mullion between every two lights, ribs down the drop and over the roof
  await ctx.yield();
  g.color(C.gilt).mat(3);
  for (const [j, r] of [[5, 0.34], [6, 0.2], [7, 0.2], [8, 0.36]]) for (let i = 0; i < NZ; i++) g.tube(at(i, j, 0.08), at(i + 1, j, 0.08), r, r, 5, i === NZ - 1);
  for (let i = 1; i <= NZ; i++) g.tube(at(i, 6, 0.06), at(i, 7, 0.06), 0.25, 0.25, 5);
  for (const i of [1, 3, 5, 7, 9]) for (let j = 0; j < 5; j++) g.tube(at(i, j, 0.05), at(i, j + 1, 0.05), 0.08 + 0.02 * j, 0.1 + 0.02 * j, 5);
  for (const i of [0, 2, 4, 6, 8, 9]) for (let j = 8; j < NJ; j++) g.tube(at(i, j, 0.05), at(i, j + 1, 0.05), 0.13, 0.11, 5);
  // the pendant under the drop and the finial on the roof, turned
  const foot = at(5, 0), head = at(5, NJ);
  g.lathe([foot[0] + sx * 0.3, foot[1] + 0.3, foot[2]], [foot[0] + sx * 0.3, foot[1] - 1.9, foot[2]], [[0, 0.5], [0.3, 0.3], [0.7, 0.62], [1.2, 0.45], [1.6, 0.14], [1.9, 0.03]], 8);
  g.lathe([head[0] + sx * 0.5, head[1] - 0.2, head[2]], [head[0] + sx * 0.5, head[1] + 1.7, head[2]], [[0, 0.5], [0.3, 0.28], [0.8, 0.6], [1.2, 0.4], [1.7, 0.03]], 8);
}
function hullStations() {
  const zs = [SHIP.transomOut, 24];
  for (let z = 21; z > -108; z -= 2.5) zs.push(z);
  for (let z = -108; z > -150; z -= 2) zs.push(z);
  zs.push(-150, -151.5, -152.8, -153.6, -154);
  for (const zb of [SHIP.poopBreakZ, SHIP.fcBreakZ]) zs.push(zb + 0.02, zb - 0.02, zb - 3, zb + 3 - 6 * (zb === SHIP.poopBreakZ ? 1 : 0));
  return [...new Set(zs)].sort((a, b) => b - a);
}
// THE SKIN IS BUILT IN STRAKES: STRAKES.n planks from the rail to the keel at every station, each an equal share of that
// station's girth (so they narrow toward her ends as planks do). Every strake stands STRAKES.lap metres proud at its lower
// edge and steps back to the next one: a real step that catches the light. The wales (STRAKES.wales, counted from the
// rail) stand STRAKES.wale proud along their whole depth. par carries the strake's number and the share down it.
const STRAKES = { n: 24, lap: 0.16, top: 0.02, wale: 0.42, wales: [3, 5] };
function strakeRow(z) {
  const zz = Math.min(z, 24), NSMP = 48, smp = []; let girth = 0;
  for (let j = 0; j <= NSMP; j++) { const p = sectionAt(zz, j / NSMP); if (j) girth += Math.hypot(p[0] - smp[j - 1][0], p[1] - smp[j - 1][1]); smp.push([p[0], p[1], girth]); }
  const row = []; let j = 0;
  for (let k = 0; k <= STRAKES.n; k++) {
    const want = girth * k / STRAKES.n; while (j < NSMP - 1 && smp[j + 1][2] < want) j++;
    const a = smp[j], b = smp[j + 1], t = Math.min(1, Math.max(0, (want - a[2]) / Math.max(1e-6, b[2] - a[2]))), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    // outward in the section's own plane: square to the girth
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (nx < 0) { nx = -nx; ny = -ny; }
    row.push([x, y, nx, ny]);
  }
  return row;
}
async function hullInto(g, C, ctx) {
  const zs = hullStations(), rows = [], NZ = zs.length;
  for (let i = 0; i < NZ; i++) { rows.push(strakeRow(zs[i])); if (i % 8 === 7) await ctx.yield(); }
  await ctx.yield();
  const proud = (k, low) => (STRAKES.wales.includes(k) ? STRAKES.wale : low ? STRAKES.lap : STRAKES.top);
  // the point of strake k at station i: its upper edge (low 0) or its lower edge (low 1)
  const at = (i, k, low) => { const b = rows[i][k + low], o = proud(k, low), x = b[0] + b[2] * o, y = b[1] + b[3] * o; return [x, y, zs[i] > 24 ? zs[i] : bowWarp(zs[i], y)]; };
  g.color(C.hull).mat(1);
  for (const sx of [-1, 1]) for (let k = 0; k < STRAKES.n; k++) {
    const base = g.count;
    for (let i = 0; i < NZ; i++) {
      const a = at(i, k, 0), b = at(i, k, 1), a0 = at(Math.max(0, i - 1), k, 0), a1 = at(Math.min(NZ - 1, i + 1), k, 0);
      const ux = a1[0] - a0[0], uy = a1[1] - a0[1], uz = a1[2] - a0[2], vx = b[0] - a[0], vy = b[1] - a[1], vz = b[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-6) { nx = rows[i][k][2]; ny = rows[i][k][3]; nz = 0; } else { const sg = (nx >= 0 ? 1 : -1) / l; nx *= sg; ny *= sg; nz *= sg; }
      g.vert(a[0] * sx, a[1], a[2], nx * sx, ny, nz, k + 0.002); g.vert(b[0] * sx, b[1], b[2], nx * sx, ny, nz, k + 0.998);
    }
    for (let i = 0; i < NZ - 1; i++) { const q = base + i * 2; g.quad(q, q + 2, q + 3, q + 1); }
    await ctx.yield();
    // the step back from this strake's lower edge to the next one's upper edge
    if (k < STRAKES.n - 1) for (let i = 0; i < NZ - 1; i++) {
      const a = at(i, k, 1), b = at(i + 1, k, 1), c = at(i + 1, k + 1, 0), d = at(i, k + 1, 0);
      if (Math.hypot(a[0] - d[0], a[1] - d[1]) < 0.01) continue;
      g.mat(1, k + 0.999).face([a[0] * sx, a[1], a[2]], [b[0] * sx, b[1], b[2]], [c[0] * sx, c[1], c[2]], [d[0] * sx, d[1], d[2]]);
    }
    await ctx.yield();
  }
  await ctx.yield();
  // the rail's own top edge at every station (the rail cap, the bulwark and the deck are hung from it)
  const railRow = zs.map((z, i) => { const b = rows[i][0]; return [b[0], b[1], z > 24 ? z : bowWarp(z, b[1])]; });
  // rail cap, inner bulwark and deck between each pair of stations
  for (let i = 0; i < NZ - 1; i++) {
    const zA = zs[i], zB = zs[i + 1], zm = (zA + zB) / 2, dy = deckAt(zm);
    const A = railRow[i], B = railRow[i + 1], zdA = zA > 24 ? zA : bowWarp(zA, dy), zdB = zB > 24 ? zB : bowWarp(zB, dy);
    const inA = Math.max(0, breadthAt(zA, dy) - 0.9), inB = Math.max(0, breadthAt(zB, dy) - 0.9), capA = Math.max(0, A[0] - 0.9), capB = Math.max(0, B[0] - 0.9);
    for (const sx of [-1, 1]) {
      // a rounded moulding along the rail's outer edge, and the rail cap inside it
      if (Math.hypot(B[0] - A[0], B[2] - A[2]) > 0.2) g.color(C.tarLit).mat(0).tube([A[0] * sx + sx * 0.12, A[1] + 0.05, A[2]], [B[0] * sx + sx * 0.12, B[1] + 0.05, B[2]], 0.3, 0.3, 6);
      g.color(C.tarLit).mat(0).face([A[0] * sx, A[1], A[2]], [B[0] * sx, B[1], B[2]], [capB * sx, B[1], B[2]], [capA * sx, A[1], A[2]]);
      g.color(C.bulwark).mat(0).face([capA * sx, A[1], A[2]], [capB * sx, B[1], B[2]], [inB * sx, dy, zdB], [inA * sx, dy, zdA]);
    }
    g.color(C.deck).mat(2);
    const i0 = g.vert(-inA, dy, zdA, 0, 1, 0, 0); g.vert(inA, dy, zdA, 0, 1, 0, 2 * inA); g.vert(inB, dy, zdB, 0, 1, 0, 2 * inB); g.vert(-inB, dy, zdB, 0, 1, 0, 0);
    g.quad(i0, i0 + 1, i0 + 2, i0 + 3);
    if (i % 4 === 3) await ctx.yield();
  }
  await ctx.yield();
  // the breaks of the poop and the forecastle: panelled bulkheads with a plain door each side
  for (const [zb, ya, yb, face] of [[SHIP.poopBreakZ, SHIP.deckY, SHIP.poopDeckY, -1], [SHIP.fcBreakZ, SHIP.deckY, SHIP.fcDeckY, 1]]) {
    const w = breadthAt(zb, ya) - 0.9;
    g.color(C.bulwark).mat(7, 3.2).face([-w, ya, zb], [w, ya, zb], [w, yb, zb], [-w, yb, zb]);
    g.color(C.door).mat(7, 1.6);
    for (const x of [-9, 9]) g.box(x - 1.9, ya, zb - 0.15, x + 1.9, ya + 6.6, zb + 0.15);
    g.color(C.tarLit).mat(0).box(-w, yb - 0.5, zb - 0.6, w, yb + 0.25, zb + 0.6);
    // ladders
    for (const x of [-15, 15]) for (let k = 0; k < 9; k++) { const y = ya + (yb - ya) * (k + 0.5) / 9, zo = face * (0.5 + (9 - k) * 0.42); g.box(x - 1.6, y - 0.12, zb + zo - 0.5, x + 1.6, y + 0.12, zb + zo + 0.5); }
  }
  // the stem timber from the forefoot to the head, and a plain scroll at the head (no figure)
  await ctx.yield();
  g.color(C.tarLit).mat(0);
  let prev = null;
  for (let y = -11; y <= 26.01; y += 2.2) { const p = [0, y, -154 + stemAft(y) - 0.55]; if (prev) g.tube(prev, p, 0.75, 0.75, 6); prev = p; }
  let sp = null;
  for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + k / 16 * Math.PI * 2.6, r = 3.1 * (1 - k / 22), p = [0, 28.6 + Math.sin(a) * r, -156.6 - Math.cos(a) * r]; if (sp) g.tube(sp, p, 0.75 * (1 - k / 30), 0.75 * (1 - (k + 1) / 30), 6); sp = p; }
  g.color(C.gilt).mat(3).tube([-0.8, 28.6, -156.6], [0.8, 28.6, -156.6], 0.7, 0.7, 8, true);
  // sternpost and rudder under the counter
  // (the rudder's stock runs up into the counter)
  g.color(C.tar).mat(0).box(-0.6, -12, 18, 0.6, keelAt(24) + 0.3, 24.6).box(-0.45, -12, 24.6, 0.45, 0, 28.4);
  // THE RUDDER HEAD stands plain over the boil: pale oak (never a dark post in the foam), bound with two iron straps
  g.color(C.trim).mat(0).box(-0.55, 0, 24.6, 0.55, 5, 28.2).box(-0.4, 5, 24.6, 0.4, keelAt(24) + 0.5, 25.9);
  g.color(C.iron).mat(0).box(-0.63, 1.6, 24.6, 0.63, 2.1, 27.6).box(-0.63, 3.6, 24.6, 0.63, 4.1, 27.2);
}

// ------------------------------------------------------------------ the plan of the rig: every spar's ends, read by spars, sails and rigging alike
const addS = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mixP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function rigPlan() {
  const sb = Math.sin(SHIP.brace), cbr = Math.cos(SHIP.brace), sc = Math.sin(SHIP.cock), cc = Math.cos(SHIP.cock);
  // along a yard from its weather arm to its lee arm: braced 38 degrees to the keel (lee arm aft), cock-billed 6 (lee arm down)
  const yd = [sb * cc, -sc, cbr * cc];
  const lenK = [0.94, 1, 0.76];
  const masts = SHIP.masts.map((m, mi) => {
    const s = (m.truck - 66) / 114;
    const yards = SHIP.yardYs.map((Y, i) => {
      const y = i === 0 ? 60 - 19 * (1 - s) : 66 + (Y - 66) * s, half = SHIP.yardLens[i] * lenK[mi] / 2, c = [0, y, m.z - 2.6];
      return { c, half, lee: addS(c, yd, half), wx: addS(c, yd, -half), r: 1.25 * Math.sqrt(half / 48), furled: true };
    });
    return { z: m.z, truck: m.truck, yards, topY: 66, capY: yards[2].c[1] + 7, deckY: deckAt(m.z) };
  });
  // the canvas that stands, on every seed: the two lower topsails and the reefed fore course (their yards carry no roll)
  masts[0].yards[1].furled = false; masts[1].yards[1].furled = false; masts[0].yards[0].furled = false;
  const sprit = { a: [0, 24, -150], b: SHIP.jibEnd }, spAt = (z) => mixP(sprit.a, sprit.b, (-150 - z) / 56);
  return {
    masts, yd, sprit, spAt,
    striker: { a: spAt(-170), b: [0, 19, -170] },
    boom: { a: [0, 38, -5.6], b: SHIP.boomEnd }, gaff: { a: [0, 62, -5.6], b: [9.5, 77, 24] },
  };
}
// (a hand-back after each mast's body and after each of its yards: no step of the build is long)
async function sparsInto(g, C, R, ctx) {
  const tube = (a, b, r0, r1, n = 10) => g.tube(a, b, r0, r1, n, true);
  for (const m of R.masts) {
    await ctx.yield();
    const z = m.z, ty = m.yards;
    g.color(C.spar).mat(0);
    // lower mast, topmast (doubled at the top), topgallant and royal mast, truck
    tube([0, m.deckY - 1, z], [0, m.topY + 7, z], 2.3, 1.9, 12);
    tube([0, m.topY - 5, z - 2.4], [0, m.capY, z - 2.4], 1.55, 1.2, 10);
    tube([0, m.capY - 6, z - 4.4], [0, m.truck, z - 4.4], 1.0, 0.42, 8);
    tube([0, m.truck, z - 4.4], [0, m.truck + 0.9, z - 4.4], 0.8, 0.5, 8);
    for (let k = 0; k < 5; k++) { const y = m.deckY + 6 + k * (m.topY - m.deckY - 12) / 4; g.color(C.tarLit).tube([0, y, z], [0, y + 0.7, z], 2.42 - k * 0.07, 2.42 - k * 0.07, 12); }
    // the lower top: a platform with a rim; the cap above; the crosstrees
    g.color(C.spar).box(-6.6, m.topY - 0.3, z - 6.2, 6.6, m.topY + 0.3, z + 3.6).box(-6.6, m.topY + 0.3, z - 6.2, 6.6, m.topY + 1.1, z - 5.7).box(-1.2, m.topY + 6.2, z - 4.2, 1.2, m.topY + 7.2, z + 1.6);
    g.box(-5.2, m.capY - 6.6, z - 5.6, 5.2, m.capY - 6.1, z - 1.2).box(-0.9, m.capY - 1, z - 5.6, 0.9, m.capY, z - 1.4);
    for (const x of [-5, 5]) g.box(x - 0.25, m.capY - 6.6, z - 7.4, x + 0.25, m.capY - 6.1, z + 0.4);
    // under the top: two trestletrees along the keel and three crosstrees athwart, their ends tapered; a rail round
    // the top's after edge and sides; three spreaders at the topmast crosstrees; a gilt ball at the truck
    for (const x of [-1.9, 1.9]) g.beam([x, m.topY - 0.8, z - 6.6], [x, m.topY - 0.8, z + 4], 0.5, 0.9);
    for (const dz of [-4.6, -1.2, 2.2]) for (const sx of [-1, 1]) g.tube([0, m.topY - 0.75, z + dz], [sx * 7, m.topY - 0.55, z + dz], 0.42, 0.22, 6, true);
    g.color(C.tarLit);
    for (const sx of [-1, 1]) { g.tube([sx * 6.4, m.topY + 0.3, z - 5.8], [sx * 6.4, m.topY + 3.3, z - 5.8], 0.1, 0.1, 5).tube([sx * 6.4, m.topY + 0.3, z + 3.3], [sx * 6.4, m.topY + 3.3, z + 3.3], 0.1, 0.1, 5).tube([sx * 6.4, m.topY + 3.3, z - 5.8], [sx * 6.4, m.topY + 3.3, z + 3.3], 0.12, 0.12, 5); }
    g.tube([-6.4, m.topY + 3.3, z + 3.3], [6.4, m.topY + 3.3, z + 3.3], 0.12, 0.12, 5);
    g.color(C.spar);
    for (const dz of [-7, -4.2, -1.4]) for (const sx of [-1, 1]) g.tube([0, m.capY - 6.35, z + dz], [sx * 6.6, m.capY - 6.2, z + dz - 0.8], 0.3, 0.14, 6, true);
    g.color(C.gilt).mat(3).lathe([0, m.truck + 0.9, z - 4.4], [0, m.truck + 2.3, z - 4.4], [[0, 0.2], [0.3, 0.62], [0.7, 0.75], [1.1, 0.6], [1.4, 0.05]], 8);
    g.color(C.spar).mat(0);
    // yards, each with its furled paper roll unless its sail is set
    for (let i = 0; i < ty.length; i++) {
      await ctx.yield();
      const y = ty[i], off = [0, -1.6, -1.6, -3.2, -3.2][i];
      const c = [y.c[0], y.c[1], y.c[2] + off], a = addS(c, R.yd, -y.half), b = addS(c, R.yd, y.half);
      g.color(C.spar).mat(0); tube(c, a, y.r, y.r * 0.42, 8); tube(c, b, y.r, y.r * 0.42, 8);
      g.box(c[0] - y.r * 1.3, c[1] - y.r * 1.2, c[2], c[0] + y.r * 1.3, c[1] + y.r * 1.2, c[2] + 2.4);
      y.c = c; y.wx = a; y.lee = b;
      // a block under each yard arm (the brace's and the lift's), turned
      for (const e of [a, b]) g.color(C.spar).mat(0).lathe([e[0], e[1] - y.r * 0.3, e[2]], [e[0], e[1] - y.r * 0.3 - 1.25, e[2]], [[0, 0.1], [0.22, 0.44], [0.95, 0.44], [1.25, 0.12]], 8);
      if (!y.furled) continue;
      // the furled sail: a lumpy roll of paper along the yard, bound by a gasket of line at every second lump
      const n = 22; let prev = null, pr = 0;
      for (let k = 0; k <= n; k++) {
        const t = -0.92 + 1.84 * k / n, rr = y.r * (1.25 - 0.45 * Math.abs(t)) * (0.84 + 0.32 * (((k * 7 + i * 3) % 5) / 4));
        const p = addS(addS(c, R.yd, y.half * t), [0, 1, 0], y.r * 0.75 + rr * 0.55);
        if (prev) g.color(C.roll).mat(8, (k + i * 2.3) * y.half * 1.84 / n).tube(prev, p, pr, rr, 8, k === 1 || k === n);
        if (prev && k % 2 === 0 && k < n) g.color(C.rope).mat(0).tube(addS(p, R.yd, -0.22), addS(p, R.yd, 0.22), rr * 1.07 + 0.05, rr * 1.07 + 0.05, 8);
        prev = p; pr = rr;
        if (k % 4 === 3) await ctx.yield();
      }
    }
  }
  // bowsprit and jib-boom, cap, dolphin striker; spanker boom and gaff
  await ctx.yield();
  g.color(C.spar).mat(0);
  tube([0, 20, -141.5], R.spAt(-180), 2.1, 1.5, 12); tube(R.spAt(-172), R.sprit.b, 1.15, 0.6, 10);
  g.box(-1.5, R.spAt(-178)[1] - 1.6, -179, 1.5, R.spAt(-178)[1] + 2.4, -178);
  tube(R.striker.a, R.striker.b, 0.5, 0.3, 6);
  tube(R.boom.a, R.boom.b, 1.0, 0.7, 8); tube(R.gaff.a, R.gaff.b, 0.85, 0.5, 8);
  g.box(-1.3, 37.2, -6.6, 1.3, 38.8, -5.2).box(-1.2, 61.2, -6.6, 1.2, 62.8, -5.2);
  // the spanker's reef, rolled along the boom
  let prev = null, pr = 0;
  for (let k = 0; k <= 9; k++) { const rr = 0.85 * (0.85 + 0.3 * ((k * 3) % 4) / 3), p = addS(mixP(R.boom.a, R.boom.b, 0.06 + 0.8 * k / 9), [0, 1, 0], 1.2); if (prev) g.color(C.roll).mat(8, k * 4.1).tube(prev, p, pr, rr, 8, k === 1 || k === 9); prev = p; pr = rr; }
}

// ------------------------------------------------------------------ the canvas: paper sails, each a bellied sheet with its own phase
// corners: head at the weather end, head at the lee end, clew to lee, clew to weather (a staysail gives its head twice)
const SAIL_FOLD = 0.34, SAIL_FOLDS = [[1, 0.34, 1], [1, 0.67, -1], [0, 0.52, 1]];
// (a hand-back every few rows of a sheet: no step of the build is long)
async function sailInto(S, cn, o, ctx) {
  const [hw, hl, cl, cw] = cn, NU = o.nu || 48, NV = o.nv || 32, base = S.p.length / 3, tight = o.tight ? 0.3 : 1;
  const e1 = [hl[0] - hw[0] + cl[0] - cw[0], hl[1] - hw[1] + cl[1] - cw[1], hl[2] - hw[2] + cl[2] - cw[2]], e2 = [cw[0] - hw[0] + cl[0] - hl[0], cw[1] - hw[1] + cl[1] - hl[1], cw[2] - hw[2] + cl[2] - hl[2]];
  let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1;
  // the belly goes down the wind (toward the lee and a little aft of the beam)
  const sgn = (n[0] * 0.86 + n[2] * 0.5 >= 0 ? 1 : -1) / nl; n = [n[0] * sgn, n[1] * sgn, n[2] * sgn];
  const wHead = Math.hypot(hl[0] - hw[0], hl[1] - hw[1], hl[2] - hw[2]), wFoot = Math.hypot(cl[0] - cw[0], cl[1] - cw[1], cl[2] - cw[2]);
  const depth = (Math.hypot(cw[0] - hw[0], cw[1] - hw[1], cw[2] - hw[2]) + Math.hypot(cl[0] - hl[0], cl[1] - hl[1], cl[2] - hl[2])) / 2;
  const belly = o.belly ?? 0.11 * Math.max(wHead, wFoot), roach = o.roach ?? 0.05 * depth, grid = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    if (i === 0 && j % 3 === 2) await ctx.yield();
    // THE LEECHES ARE ROUND: each side of the sheet is cut in a hollow curve between its head and its clew (SAIL_LEECH
    // of the sheet's width at the middle of its depth), so no edge of a sail is a ruled line
    const u = i / NU, v = j / NV, uc = 0.5 + (u - 0.5) * (1 - SAIL_LEECH * 2 * Math.sin(Math.PI * v)), a = mixP(hw, hl, uc), b = mixP(cw, cl, uc), q = mixP(a, b, v);
    const w = Math.pow(Math.sin(Math.PI * u), 0.8) * Math.pow(v, 0.6);
    // THE PAPER WAS FOLDED and keeps its folds: two down the sheet and one across it (o.folds, shares of the sheet),
    // mountain and valley by turns, SAIL_FOLD metres high where the sheet is free, and a small crumple between them
    let fold = 0;
    (o.folds || SAIL_FOLDS).forEach(([along, at, sg]) => { const d = Math.abs((along ? u : v) - at) / 0.03; if (d < 1) fold += sg * (1 - d) * SAIL_FOLD; });
    fold += 0.05 * Math.sin(u * 41 + v * 13) * Math.sin(v * 37 - u * 17);
    const bw = belly * w + fold * Math.min(1, w * 3) * tight;
    grid.push([q[0] + n[0] * bw, q[1] + n[1] * bw + roach * Math.sin(Math.PI * u) * v * v, q[2] + n[2] * bw]);
    S.uv.push((u - 0.5) * (wHead + (wFoot - wHead) * v), v * depth);
    // free cloth flutters: the leeches and the foot away from the clews
    const free = Math.max(Math.pow(v, 3) * Math.sin(Math.PI * u), Math.pow(Math.abs(2 * u - 1), 6) * Math.sin(Math.PI * v));
    S.a.push(o.phase, w * tight, free * tight, o.reef ? o.reef : 0); S.d.push(n[0], n[1], n[2]);
  }
  const G = (i, j) => grid[Math.min(NV, Math.max(0, j)) * (NU + 1) + Math.min(NU, Math.max(0, i))];
  await ctx.yield();
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    if (i === 0 && j % 4 === 3) await ctx.yield();
    const p = G(i, j), a = G(i - 1, j), b = G(i + 1, j), c = G(i, j - 1), d = G(i, j + 1);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    const sg = (nx * n[0] + ny * n[1] + nz * n[2] >= 0 ? 1 : -1) / l;
    S.p.push(p[0], p[1], p[2]); S.n.push(nx * sg, ny * sg, nz * sg);
  }
  await ctx.yield();
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const q = base + j * (NU + 1) + i; S.i.push(q, q + NU + 1, q + NU + 2, q, q + NU + 2, q + 1); }
}
const SAIL_LEECH = 0.035;
async function sailsGeometry(R, rng, ctx) {
  const S = { p: [], n: [], uv: [], a: [], d: [], i: [] }, up = (p, k) => [p[0], p[1] + k, p[2]];
  const square = (mast, i, o) => { const hy = mast.yards[i], fy = mast.yards[i - 1]; return sailInto(S, [up(addS(hy.c, R.yd, -hy.half * 0.95), -hy.r), up(addS(hy.c, R.yd, hy.half * 0.95), -hy.r), up(addS(fy.c, R.yd, fy.half * 0.96), 1.6), up(addS(fy.c, R.yd, -fy.half * 0.96), 1.6)], o, ctx); };
  await square(R.masts[1], 1, { phase: rng.range(0, 6.28), reef: 7 });
  await ctx.yield();
  await square(R.masts[0], 1, { phase: rng.range(0, 6.28), reef: 7 });
  await ctx.yield();
  { const y = R.masts[0].yards[0]; await sailInto(S, [up(addS(y.c, R.yd, -y.half * 0.95), -y.r), up(addS(y.c, R.yd, y.half * 0.95), -y.r), [22.5, 27, -100], [-19.5, 27, -147]], { phase: rng.range(0, 6.28), reef: 9, belly: 7 }, ctx); }
  await ctx.yield();
  { const top = [0, R.masts[0].capY - 1, R.masts[0].z - 3.4], low = R.spAt(-197); await sailInto(S, [mixP(low, top, 0.8), mixP(low, top, 0.8), [9, 35, -129], mixP(low, top, 0.07)], { phase: rng.range(0, 6.28), nu: 30, nv: 22, belly: 2.4, roach: -1.2, tight: true, folds: [[1, 0.5, 1], [0, 0.4, -1], [0, 0.72, 1]] }, ctx); }
  await ctx.yield();
  await sailInto(S, [[0, 60.6, -5.2], mixP(R.gaff.a, R.gaff.b, 0.95), addS(mixP(R.boom.a, R.boom.b, 0.86), [0, 1, 0], 2.4), [0, 40.6, -5.2]], { phase: rng.range(0, 6.28), nu: 36, nv: 28, belly: 3.2, roach: 0, reef: 0 }, ctx);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(S.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(S.n, 3));
  await ctx.yield();
  g.setAttribute('aUV', new THREE.Float32BufferAttribute(S.uv, 2)); g.setAttribute('aSail', new THREE.Float32BufferAttribute(S.a, 4)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(S.d, 3));
  await ctx.yield();
  g.setIndex(S.i); return g;
}

const SAIL_VERT = /* glsl */`
  attribute vec2 aUV; attribute vec4 aSail; attribute vec3 aDir;
  uniform float uTime;
  varying vec3 vN, vW; varying vec2 vUV; varying vec4 vS; varying float vWave;
  void main(){
    float ph = aSail.x, t = uTime;
    // the belly breathes 0.6 m; a shiver runs down the cloth; the storm canvas shivers along its free leeches and foot
    float breathe = .6 * aSail.y * (.55 * sin(t * 1.3 + ph) + .45 * sin(t * 2.17 + ph * 1.7 + aUV.x * .05));
    float sh = t * 7.3 + aUV.y * .55 - aUV.x * .12 + ph;
    float fl = t * 9.7 + aUV.y * .9 + ph;
    float push = breathe + .22 * aSail.y * sin(sh) + aSail.z * (.75 * sin(fl) + .4 * sin(t * 15.1 + aUV.x * 1.3));
    vWave = .5 * aSail.y * cos(sh) + aSail.z * cos(fl);
    vec4 w = modelMatrix * vec4(position + aDir * push, 1.);
    vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vUV = aUV; vS = aSail;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const SAIL_FRAG = /* glsl */`
  precision highp float;
  ${LIGHT_GLSL}
  uniform vec3 uPaper, uPaperThru;
  varying vec3 vN, vW; varying vec2 vUV; varying vec4 vS; varying float vWave;
  float lineAt(float g, float w){ float f = fwidth(g); return 1. - smoothstep(w, w + max(f, 1e-4) * 1.5, abs(fract(g + .5) - .5)); }
  void main(){
    vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-3);
    vec3 N = normalize(vN); if (dot(N, V) < 0.) N = -N;
    vec2 q = vUV;
    float cr = texture2D(uNoise, q * .011).r, fine = texture2D(uNoise, q * .083).g, fold = texture2D(uNoise, q * .0037 + .3).b;
    float crease = 1. - smoothstep(0., .035, abs(fold - .5));
    // cloths 3.6 m wide sewn side by side; reef bands across; the dark of doubled paper
    float seam = lineAt(q.x / 3.6, .025);
    float rd = max(vS.w, 1.);
    float band = step(.5, vS.w) * (exp(-(q.y - rd) * (q.y - rd) * 2.) + exp(-(q.y - 2. * rd) * (q.y - 2. * rd) * 2.));
    // reef points: cords hanging under each band, one to a half cloth, drumming on the paper
    float cell = floor(q.x / 1.8), drum = .16 * sin(uTime * 11. + cell * 2.4 + vS.x) + .1 * sin(uTime * 17. + cell * 1.3 + vS.x * 1.7);
    float px = abs(fract(q.x / 1.8) - .5) * 1.8 - drum * step(.5, vS.w);
    float below = min(mod(q.y - rd, rd), 99.) ;
    float pt = step(.5, vS.w) * step(rd, q.y) * step(q.y, 2. * rd + 2.6) * (1. - smoothstep(.07, .16, abs(px))) * (1. - smoothstep(2.2, 2.6, below));
    float dark = clamp(seam * .55 + band * .6 + pt * .85 + crease * .25, 0., 1.);
    // the paper was folded once and keeps its facets
    vec2 fq = q * .0037 + .3; float f0 = fold, fx = texture2D(uNoise, fq + vec2(.006, 0.)).b, fy = texture2D(uNoise, fq + vec2(0., .006)).b;
    float facet = (fx - f0) * 9. + (fy - f0) * 6. + (cr - .5) * .5;
    float nl = dot(N, uKeyDir) + .06 * vWave + .34 * facet;
    float front = clamp(nl * .7 + .3, 0., 1.), thru = clamp(-nl * 1.3 + .12, 0., 1.);
    vec3 alb = uPaper * (.78 + .44 * cr) * (.92 + .16 * fine) * (1. - .3 * dark);
    float edge = min(min(vS.y * 6., 1.), 1.);
    float ms = mothShade(vW);   // the moth's dusk on the canvas
    vec3 col = alb * (mix(uGround, uSky, N.y * .5 + .5) * (1.25 + .5 * facet) + uKeyCol * front * front * 1.9 * ms);
    // the lamp behind the sheet: the paper glows through, seams, bands, cords and creases dark on it
    col += uKeyCol * uPaperThru * thru * 1.3 * (1. - .8 * dark) * (.7 + .6 * cr) * ms;
    // the net of light the seeds of the glass throw crawls over the paper, on its lit face and through it
    col += alb * uKeyCol * uCaus * caus(vec2(vW.z + vW.x * .4, vW.y * 1.3 + vW.x * .5) + uNet, uTime) * (front + .6 * thru);
    // glue along the seams and the bands: a hard gloss where the lamp finds it
    float glue = clamp(seam + band * .7, 0., 1.), spg = pow(clamp(dot(reflect(-uKeyDir, N), V), 0., 1.), 30.);
    col += uKeyCol * spg * (.05 + .7 * glue);
    gl_FragColor = vec4(haze(col, dist), 1.);
  }`;

// ------------------------------------------------------------------ the rigging: thread as three-sided tubes that thrum, ratlines among them
// one rope from a to b: r its radius, sag metres of hang at mid span, thrum metres of hum at mid span, slow: a slack
// swing, saw: it runs through a block and saws to and fro with her roll. Each ring has a fourth corner on the first, so
// the twist of the thread can be laid round it without a break (aRun: metres along, share round, saw).
function ropeInto(Q, a, b, r, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1, n = o.n || Math.max(2, Math.min(12, Math.round(L / 7)));
  const tx = dx / L, ty = dy / L, tz = dz / L;
  let ux = tz, uy = 0, uz = -tx; let ul = Math.hypot(ux, uz);
  if (ul < 0.05) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
  const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
  const sag = o.sag || 0, thr = o.thrum ?? 0.15, ph = Q.rng.range(0.01, 6.28), base = Q.p.length / 3, slow = o.slow ? -1 : 1;
  Q.segs.push([a, b, r, sag, thr]);
  for (let k = 0; k <= n; k++) {
    const t = k / n, w = Math.sin(Math.PI * t), cx = a[0] + dx * t, cy = a[1] + dy * t - sag * 4 * t * (1 - t), cz = a[2] + dz * t;
    for (let j = 0; j < 4; j++) {
      const an = (j % 3) * 2.0944, c = Math.cos(an), sn = Math.sin(an);
      Q.p.push(cx, cy, cz); Q.o.push(ux * c + vx * sn, uy * c + vy * sn, uz * c + vz * sn, r); Q.t.push(ux * thr * w, uy * thr * w, uz * thr * w, ph * slow); Q.r.push(L * t, j / 3, o.saw ? 1 : 0);
    }
  }
  for (let k = 0; k < n; k++) for (let j = 0; j < 3; j++) { const q = base + k * 4 + j; Q.i.push(q, q + 4, q + 5, q, q + 5, q + 1); }
}
// (a yield after each mast's rigging: no step of the build is long)
async function riggingGeometry(R, rng, info, ctx) {
  const Q = { p: [], o: [], t: [], r: [], i: [], rng, segs: [] }, feet = [], RAT = { first: 3, step: 2.4, r: 0.05 };
  const rope = (a, b, r, o) => ropeInto(Q, a, b, r, o);
  const foot = (sx, z) => [sx * (halfBeam(z) + 1.5), railAt(z) + 0.5, z];
  for (let mi = 0; mi < R.masts.length; mi++) {
    const m = R.masts[mi];
    const Y = m.yards, zt = m.z - 2.4, zg = m.z - 4.4;
    for (const sx of [-1, 1]) {
      const lee = sx > 0, gang = [];
      // six lower shrouds a side, 3.5 m apart, 0.35 m thick; the lee ones hang slack and swing
      for (let k = 0; k < 6; k++) {
        const a = foot(sx, m.z + 1 + k * 3.5), b = [sx * 1.9, m.topY - 1.5, m.z - 0.6 + 0.3 * k];
        rope(a, b, 0.175, lee ? { sag: 0.9, thrum: 0.45, slow: true } : { thrum: 0.15 }); gang.push([a, b]); feet.push(a);
      }
      await ctx.yield();
      // the ratlines: a thin line across the gang every RAT.step metres of height, from RAT.first over the channel to
      // the futtocks, each hanging a little between the first and the last shroud
      const A = gang[0], B = gang[5]; let nRat = 0;
      for (let y = A[0][1] + RAT.first; y < A[1][1] - 4; y += RAT.step) {
        if (++nRat % 8 === 0) await ctx.yield();
        const ta = (y - A[0][1]) / (A[1][1] - A[0][1]), tb = (y - B[0][1]) / (B[1][1] - B[0][1]);
        rope(mixP(A[0], A[1], ta), mixP(B[0], B[1], tb), RAT.r, { n: 3, sag: 0.18, thrum: 0.03 });
      }
      await ctx.yield();
      // the futtock shrouds from the rim of the top in to the mast under it; topmast shrouds from the rim of the top
      // (with their own ratlines), topgallant shrouds from the crosstrees
      const tm = [];
      for (let j = 0; j < 4; j++) {
        const rim = [sx * 6.4, m.topY + 0.3, zt - 1.6 + j * 1.5], head = [sx * 1.3, m.capY - 6.3, zt];
        rope(rim, head, 0.12, { thrum: 0.1 }); rope([sx * 6.4, m.topY - 0.3, rim[2]], [sx * 2.1, m.topY - 9, m.z + 0.2 * j], 0.11, { thrum: 0.05 }); tm.push([rim, head]);
      }
      await ctx.yield();
      for (let y = m.topY + 3; y < m.capY - 9; y += RAT.step) { const t = (y - tm[0][0][1]) / (tm[0][1][1] - tm[0][0][1]); rope(mixP(tm[0][0], tm[0][1], t), mixP(tm[3][0], tm[3][1], t), RAT.r, { n: 2, sag: 0.1, thrum: 0.03 }); }
      for (let j = 0; j < 2; j++) rope([sx * 5, m.capY - 6.2, zg - 0.8 + j * 2], [sx * 0.8, Y[3].c[1] + 6, zg], 0.09, { thrum: 0.08 });
      // three backstays a side
      const heads = [[sx * 1.2, m.capY - 1, zt], [sx * 0.8, Y[3].c[1] + 7, zg], [sx * 0.5, m.truck - 3, zg]];
      for (let j = 0; j < 3; j++) { const a = foot(sx, m.z + 24.5 + j * 3.2); rope(a, heads[j], 0.15, lee ? { sag: 1.2, thrum: 0.4, slow: true } : { thrum: 0.2 }); feet.push(a); }
      await ctx.yield();
    }
    // stays down the centre line to the mast ahead or the bowsprit
    const ahead = mi > 0 ? R.masts[mi - 1] : null;
    const ends = ahead ? [[0, mi === 1 ? 20 : 30, ahead.z + 2.6], [0, ahead.topY + 4.5, ahead.z + 1.2], [0, ahead.capY - 3, ahead.z - 1.4], [0, ahead.yards[3].c[1] + 3, ahead.z - 3.6]]
      : [R.spAt(-166), R.spAt(-197), R.spAt(-203), R.sprit.b];
    rope([0, m.topY - 1, m.z - 2], ends[0], 0.2, { thrum: 0.2 }); rope([0, m.capY - 1, zt - 1], ends[1], 0.15, { thrum: 0.2 });
    rope([0, Y[3].c[1] + 7, zg - 0.8], ends[2], 0.11, { thrum: 0.18 }); rope([0, m.truck - 3, zg - 0.4], ends[3], 0.09, { thrum: 0.18 });
    // lifts to the mast above each yard; braces aft (the mizzen's lead forward)
    for (let i = 0; i < Y.length; i++) {
      await ctx.yield();
      const y = Y[i], up = [0, y.c[1] + y.half * 0.42, y.c[2] + 0.8];
      rope(y.wx, up, 0.08, { thrum: 0.1 }); rope(y.lee, up, 0.08, { thrum: 0.1 });
      // a footrope hanging under each half of the yard
      rope(y.wx, [y.c[0], y.c[1] - y.r, y.c[2] + 1.2], 0.07, { sag: 1.5, thrum: 0.2, slow: true }); rope(y.lee, [y.c[0], y.c[1] - y.r, y.c[2] + 1.2], 0.07, { sag: 1.5, thrum: 0.2, slow: true });
      const to = mi === 2 ? R.masts[1] : R.masts[mi + 1];
      for (const [arm, sx] of [[y.wx, -1], [y.lee, 1]]) {
        const b = i === 0 ? (mi === 1 ? foot(sx, 4) : mi === 0 ? foot(sx, -70) : foot(sx, -30)) : [sx * 0.9, y.c[1] * 0.82, to.z + (mi === 2 ? 2.6 : -3)];
        rope(arm, b, 0.085, sx > 0 ? { sag: 1.6, thrum: 0.5, slow: true, saw: true } : { thrum: 0.3, saw: true });
      }
    }
    await ctx.yield();
  }
  // sheets of the canvas that stands
  const sheet = (a, b) => rope(a, b, 0.1, { thrum: 0.25, saw: true });
  sheet([22.5, 27, -100], foot(1, -84)); sheet([-19.5, 27, -147], [-14, 24, -150]);
  sheet([9, 35, -129], foot(1, -121));
  // spanker: sheet, topping lift, peak halliard, vangs
  sheet(R.boom.b, [8, 29.7, 25.6]); rope(R.boom.b, [0, 71, -7], 0.09, { sag: 1, thrum: 0.3 }); rope(R.gaff.b, [0, R.masts[2].capY - 2, -9.6], 0.09, { thrum: 0.2 });
  rope(R.gaff.b, [-19.5, 29.7, 20], 0.08, { thrum: 0.3 }); rope(R.gaff.b, [19.5, 29.7, 21], 0.08, { sag: 1.5, thrum: 0.5, slow: true });
  // the bowsprit's gear: bobstays, the martingale stay and its back ropes, guys and shrouds
  rope(R.spAt(-178), [0, 3, -150.6], 0.2, { thrum: 0.12 }); rope(R.spAt(-166), [0, 8, -151.6], 0.18, { thrum: 0.1 });
  rope(R.striker.b, R.sprit.b, 0.13, { thrum: 0.15 }); rope(R.striker.b, R.spAt(-178), 0.1, { thrum: 0.05 });
  for (const sx of [-1, 1]) { rope(R.striker.b, [sx * 9.5, 21.5, -146.5], 0.1, { thrum: 0.12 }); rope(R.sprit.b, [sx * 13, 24, -147], 0.1, { thrum: 0.2 }); rope(R.spAt(-178), [sx * 12, 20.5, -146], 0.14, { thrum: 0.1 }); }
  info.ropes = Q.segs; info.shroudFeet = feet;
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(Q.p, 3)); g.setAttribute('aRope', new THREE.Float32BufferAttribute(Q.o, 4));
  await ctx.yield();
  g.setAttribute('aThr', new THREE.Float32BufferAttribute(Q.t, 4));
  g.setAttribute('aRun', new THREE.Float32BufferAttribute(Q.r, 3)); g.setIndex(Q.i);
  return { ropes: g };
}

// THE ONE READING OF THE PICTURE IN THIS FILE (the guide's rule for thin lines): thread is never drawn narrower than a
// pixel and a half, and then carries its true share of that width as its strength (never under ROPE_FLOOR, so the rig
// stays the darkest thing against the glass however far off). The braces and sheets saw through their blocks with her
// roll (the roll law's own 11 s), which shows as the thread's twist running to and fro.
const ROPE_FLOOR = 0.5;
const ROPE_VERT = /* glsl */`
  attribute vec4 aRope, aThr; attribute vec3 aRun; uniform float uTime, uPxH;
  varying vec3 vN, vW; varying float vCover, vTw;
  void main(){
    // every rope hums at its own pitch; a slack one (marked by a negative phase) swings slowly instead
    float ph = abs(aThr.w), slow = step(aThr.w, -1e-4);
    float f = mix(5.5 + 3. * fract(ph * 7.31), .9 + .5 * fract(ph * 3.7), slow);
    vec4 w = modelMatrix * vec4(position + aThr.xyz * sin(uTime * f + ph), 1.);
    float dist = length(cameraPosition - w.xyz), px = 2. / (projectionMatrix[1][1] * max(uPxH, 1.));
    float r = max(aRope.w, .75 * px * dist);
    vCover = aRope.w / r;
    // the twist: one turn in ten radii of the thread; a sawing rope's twist runs 1.2 m each way with her roll
    vTw = (aRun.x + aRun.z * (1.2 * sin(uTime * ${(TAU / MOTION.rollPer).toFixed(5)} + ph) + .12 * sin(uTime * 2.3 + ph))) / (10. * aRope.w) + aRun.y;
    vN = normalize(mat3(modelMatrix) * aRope.xyz);
    w.xyz += vN * r; vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const ROPE_FRAG = /* glsl */`
  precision highp float;
  ${LIGHT_GLSL}
  uniform vec3 uThread;
  varying vec3 vN, vW; varying float vCover, vTw;
  void main(){
    float dist = length(cameraPosition - vW);
    // three strands laid up: shown where a strand is wider than a pixel
    float strand = .5 + .5 * sin(vTw * 18.85), fw = fwidth(vTw * 3.);
    vec3 col = uThread * vaultLight(normalize(vN), 1.) * mix(1., .55 + .7 * strand, 1. - smoothstep(.25, .8, fw));
    float f = 1. - exp(-uFogDen * uFogDen * dist * dist);
    gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0., 1.) * .45), clamp(${ROPE_FLOOR.toFixed(2)} + vCover * 1.3 * ${(1 - ROPE_FLOOR).toFixed(2)}, 0., 1.));
  }`;
// the pennant and a parted buntline: ribbons streaming down the wind in a travelling wave
const FLAG_VERT = /* glsl */`
  attribute vec3 aCol; attribute vec3 aFlag;
  uniform float uTime;
  varying vec3 vCol, vW; varying float vSh;
  void main(){
    // aFlag: metres along from the hoist, metres across, phase. The wave grows from the hoist and runs out to the fly.
    float s = aFlag.x, grow = 1. - exp(-s * .16), ph = s * .62 - uTime * 10.5 + aFlag.z;
    float a = sin(ph) + .45 * sin(ph * 2.3 + 1.7), da = cos(ph) + 1.03 * cos(ph * 2.3 + 1.7);
    vec3 p = position + vec3(-.5, 0., .86) * grow * 1.5 * a + vec3(0., 1., 0.) * grow * (1.3 * sin(ph * .6 + 2.) + .9 * sin(uTime * 1.7 + aFlag.z) - .06 * s);
    vSh = da * grow; vCol = aCol;
    vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const FLAG_FRAG = /* glsl */`
  precision highp float;
  ${LIGHT_GLSL}
  varying vec3 vCol, vW; varying float vSh;
  void main(){
    float lit = clamp(.62 + .38 * vSh, 0., 1.);
    vec3 col = vCol * (mix(uGround, uSky, .7) * 1.5 + uKeyCol * lit * 1.1);
    gl_FragColor = vec4(haze(col, length(cameraPosition - vW)), 1.);
  }`;
function flagGeometry(R, C, phases) {
  const p = [], c = [], a = [], ix = [];
  const ribbon = (at, len, w0, w1, col, ph, n) => {
    const base = p.length / 3;
    for (let k = 0; k <= n; k++) {
      const s = len * k / n, w = w0 + (w1 - w0) * k / n;
      for (const sg of [-1, 1]) { p.push(at[0] + 0.86 * s, at[1] + sg * w / 2, at[2] + 0.5 * s); c.push(col[0], col[1], col[2]); a.push(s, sg * w / 2, ph); }
    }
    for (let k = 0; k < n; k++) { const q = base + k * 2; ix.push(q, q + 2, q + 3, q, q + 3, q + 1); }
  };
  // a plain plaster-white pennant, 30 m, at the main truck; a parted buntline streaming from the main upper topsail yard
  ribbon([0, R.masts[1].truck - 1.6, R.masts[1].z - 4.4], 30, 2.6, 0.5, C.plaster, phases[0], 48);
  const y = R.masts[1].yards[2]; ribbon(addS(y.c, R.yd, y.half * 0.55), 17, 0.3, 0.3, C.tarLit, phases[1], 30);
  // her two flag halyards, bare (she flies no flag), blown out in long bights from the gaff's peak and the fore truck
  ribbon(R.gaff.b, 24, 0.22, 0.22, C.rope, phases[2], 40);
  ribbon([0, R.masts[0].truck - 2, R.masts[0].z - 3.6], 20, 0.22, 0.22, C.rope, phases[3], 34);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(c, 3)); g.setAttribute('aFlag', new THREE.Float32BufferAttribute(a, 3)); g.setIndex(ix);
  return g;
}

// ------------------------------------------------------------------ what stands on her decks and sides
function boatInto(g, C, cx, cy, cz, len, beam, depth, open) {
  const NS = 9, NG = 5, rows = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, w = beam / 2 * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.55), row = [];
    for (let j = 0; j <= NG; j++) { const a = j / NG * Math.PI / 2; row.push([w * Math.cos(a), -depth * Math.sin(a) * (0.75 + 0.25 * Math.sin(Math.PI * t))]); }
    rows.push(row);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < NS; i++) for (let j = 0; j < NG; j++) {
    const z0 = cz - len / 2 + len * i / NS, z1 = cz - len / 2 + len * (i + 1) / NS, a = rows[i][j], b = rows[i + 1][j], c = rows[i + 1][j + 1], d = rows[i][j + 1];
    g.color(j === 0 ? C.tarLit : C.boat).mat(0).face([cx + sx * a[0], cy + a[1], z0], [cx + sx * b[0], cy + b[1], z1], [cx + sx * c[0], cy + c[1], z1], [cx + sx * d[0], cy + d[1], z0]);
  }
  const zAt = (i) => cz - len / 2 + len * i / NS;
  if (!open) {
    // a canvas cover laced over it
    g.color(C.cover).mat(0);
    for (let i = 0; i < NS; i++) { const a = rows[i][0][0], b = rows[i + 1][0][0]; g.face([cx - a, cy + 0.05, zAt(i)], [cx + a, cy + 0.05, zAt(i)], [cx + b, cy + 0.05, zAt(i + 1)], [cx - b, cy + 0.05, zAt(i + 1)]); }
    return;
  }
  // an open boat: a rounded gunwale, five thwarts, bottom boards, a pair of oars lashed along the thwarts
  g.color(C.tarLit).mat(0);
  for (const sx of [-1, 1]) for (let i = 0; i < NS; i++) g.tube([cx + sx * rows[i][0][0], cy, zAt(i)], [cx + sx * rows[i + 1][0][0], cy, zAt(i + 1)], 0.16, 0.16, 6);
  g.color(C.deck).mat(0);
  for (const i of [2, 3, 4, 5, 6, 7]) { const w = rows[i][0][0] - 0.1; g.box(cx - w, cy - 0.95, zAt(i) - 0.38, cx + w, cy - 0.8, zAt(i) + 0.38); }
  g.box(cx - beam * 0.2, cy - depth * 0.82, zAt(1), cx + beam * 0.2, cy - depth * 0.78, zAt(NS - 1), 'y');
  g.color(C.trim).mat(0);
  for (const dx of [-0.7, 0.75]) { g.tube([cx + dx, cy - 0.68, zAt(1) + 1], [cx + dx, cy - 0.68, zAt(NS - 2)], 0.11, 0.11, 6, true).box(cx + dx - 0.07, cy - 0.74, zAt(NS - 2), cx + dx + 0.07, cy - 0.5, zAt(NS - 2) + 2.6); }
}
// (gearInto and headInto hand the page back between their pieces: ctx.yield)
async function gearInto(g, C, R, feet, rng, ctx) {
  const D = SHIP.deckY, PD = SHIP.poopDeckY, FD = SHIP.fcDeckY;
  // three hatches with gratings, a deckhouse with a funnel, the two boats on skids over the main hatch
  for (const z of [-34, -78, -104]) { g.color(C.tarLit).mat(0).box(-5.5, D, z - 4.5, 5.5, D + 1.5, z + 4.5, 'yY'); g.color(C.deck).mat(7, 0.9).box(-5.5, D + 1.5, z - 4.5, 5.5, D + 1.6, z + 4.5, 'y'); }
  g.color(C.bulwark).mat(7, 2.6).box(-7, D, -98, 7, D + 6.2, -86, 'y'); g.color(C.tarLit).mat(0).box(-7.6, D + 6.2, -98.6, 7.6, D + 6.8, -85.4);
  g.color(C.tar).mat(0).tube([3.5, D + 6.8, -95], [3.5, D + 11, -95], 0.6, 0.6, 8, true);
  for (const z of [-56, -40]) { g.color(C.tarLit).mat(0).box(-11, D, z - 0.5, 11, D + 0.6, z + 0.5).box(-11, D + 0.6, z - 0.4, -10.2, D + 4, z + 0.4).box(10.2, D + 0.6, z - 0.4, 11, D + 4, z + 0.4).box(-11, D + 4, z - 0.5, 11, D + 4.6, z + 0.5); }
  await ctx.yield();
  boatInto(g, C, -5.2, D + 7.6, -48, 24, 6.4, 3, false); await ctx.yield(); boatInto(g, C, 5.2, D + 7.6, -48, 24, 6.4, 3, true);
  await ctx.yield();
  // capstan on the forecastle; bitts; catheads with their anchors
  g.color(C.tarLit).mat(0).lathe([0, FD, -134], [0, FD + 3, -134], [[0, 2.2], [0.25, 2.2], [0.5, 1.75], [1.6, 1.3], [2.6, 1.45], [3, 1.9]], 12).tube([0, FD + 3, -134], [0, FD + 3.9, -134], 2.3, 2.3, 12, true);
  // six whelps up the capstan's barrel, a gilt boss on its drumhead
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, c = Math.cos(a), sn = Math.sin(a); g.beam([c * 2.0, FD + 0.45, -134 + sn * 2.0], [c * 1.75, FD + 2.9, -134 + sn * 1.75], 0.45, 0.5); }
  g.color(C.gilt).mat(3).lathe([0, FD + 3.9, -134], [0, FD + 4.3, -134], [[0, 0.9], [0.2, 0.8], [0.4, 0.05]], 10);
  g.color(C.tarLit).mat(0);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.tube([Math.cos(a) * 2.2, FD + 3.45, -134 + Math.sin(a) * 2.2], [Math.cos(a) * 5.4, FD + 3.45, -134 + Math.sin(a) * 5.4], 0.2, 0.16, 5); }
  for (const sx of [-1, 1]) {
    g.color(C.tarLit).mat(0).beam([sx * 8, FD + 5.2, -137], [sx * 19, FD + 6.4, -143], 1.3, 1.3);
    for (const z of [-24, -110]) for (const dz of [-1.2, 1.2]) g.color(C.tarLit).tube([sx * 16.5, D, z + dz], [sx * 16.5, D + 2.6, z + dz], 0.55, 0.55, 8, true);
  }
  // fife rails round each mast with pins; coils of line on the bulwarks
  await ctx.yield();
  for (const m of R.masts) {
    const y = m.deckY;
    g.color(C.tarLit).mat(0);
    for (const sx of [-1, 1]) g.box(sx * 4.6 - 0.35, y, m.z - 4, sx * 4.6 + 0.35, y + 3.6, m.z - 3.3).box(sx * 4.6 - 0.35, y, m.z + 3.3, sx * 4.6 + 0.35, y + 3.6, m.z + 4);
    g.box(-5, y + 3.2, m.z + 3.2, 5, y + 3.8, m.z + 4.1).box(-5, y + 3.2, m.z - 4.1, -4.2, y + 3.8, m.z + 4.1).box(4.2, y + 3.2, m.z - 4.1, 5, y + 3.8, m.z + 4.1);
    g.color(C.rope);
    for (let k = 0; k < 7; k++) { const x = -4.2 + k * 1.4; g.tube([x, y + 1.9, m.z + 4.2], [x, y + 3.2, m.z + 4.2], 0.55, 0.42, 7, true); }
  }
  await ctx.yield();
  g.color(C.rope).mat(0);
  for (let z = -108; z < -18; z += 5.4 + rng.range(0, 3.6)) for (const sx of [-1, 1]) { const x = sx * (breadthAt(z, 13) - 1.25), r = rng.range(0.8, 1.15); g.tube([x, 13.2, z], [x - sx * 0.5, 13.2, z], r, r, 9, true); }
  // channels, and at the foot of every shroud and backstay: two turned deadeyes with three lanyards rove between
  // them, and an iron chain plate down to the wale
  const DEADEYE = [[0, 0.34], [0.1, 0.6], [0.34, 0.6], [0.44, 0.34]];
  for (let fi = 0; fi < feet.length; fi++) {
    if (fi % 4 === 0) await ctx.yield();
    const f = feet[fi], sx = Math.sign(f[0]), xi = f[0] - sx * 1.5;
    g.color(C.tarLit).mat(0).box(Math.min(xi, f[0] + sx * 0.5), f[1] - 0.75, f[2] - 1.75, Math.max(xi, f[0] + sx * 0.5), f[1] - 0.35, f[2] + 1.75);
    g.color(C.spar).mat(0).lathe([f[0] - 0.22, f[1] - 0.1, f[2]], [f[0] + 0.22, f[1] - 0.1, f[2]], DEADEYE, 10).lathe([f[0] - 0.22, f[1] + 1.95, f[2]], [f[0] + 0.22, f[1] + 1.95, f[2]], DEADEYE, 10);
    g.color(C.rope).mat(0);
    for (const dz of [-0.3, 0, 0.3]) g.tube([f[0] + sx * 0.24, f[1] + 0.05, f[2] + dz], [f[0] + sx * 0.24, f[1] + 1.8, f[2] + dz], 0.05, 0.05, 4);
    g.color(C.iron).mat(0).beam([f[0], f[1] - 0.6, f[2]], [sx * breadthAt(f[2], f[1] - 6) + sx * 0.5, f[1] - 6, f[2] - 0.5], 0.3, 0.2);
  }
  // water casks lashed beside the deckhouse, three a side, hooped; the bell in its belfry at the break of the forecastle
  await ctx.yield();
  const CASK = [[0, 0.01], [0.03, 0.78], [0.6, 0.98], [1.2, 1.05], [1.8, 0.98], [2.37, 0.78], [2.4, 0.01]];
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const x = sx * 9.6, z = -97 + k * 2.4;
    g.color(C.cask).mat(0).lathe([x, D, z], [x, D + 2.4, z], CASK, 10);
    g.color(C.iron).mat(0);
    for (const h of [0.45, 1.95]) g.tube([x, D + h, z], [x, D + h + 0.12, z], 1.0, 1.0, 10);
  }
  g.color(C.tarLit).mat(0).box(-1.9, FD, -117.5, -1.5, FD + 4.2, -117.1).box(1.5, FD, -117.5, 1.9, FD + 4.2, -117.1).box(-2.2, FD + 4.2, -117.6, 2.2, FD + 4.7, -117);
  g.color(C.gilt).mat(3).lathe([0, FD + 4.2, -117.3], [0, FD + 2.6, -117.3], [[0, 0.08], [0.15, 0.3], [0.7, 0.5], [1.3, 0.82], [1.45, 0.9], [1.5, 0.86]], 10);
  // the binnacle's lit glass, toward the wheel
  await ctx.yield();
  g.color(C.lamp).mat(4, 4).box(-0.5, PD + 2.5, 17.2, 0.5, PD + 3.3, 17.26);
  // on the poop: a skylight glowing from the cabin below, a companion, the binnacle and the wheel's stand, mooring bitts
  g.color(C.tarLit).mat(0).box(-3.6, PD, 5, 3.6, PD + 1.2, 12.5, 'y');
  g.color(C.lamp).mat(4, 1.5).face([-3.6, PD + 1.2, 12.5], [0, PD + 2.6, 12.5], [0, PD + 2.6, 5], [-3.6, PD + 1.2, 5]).face([3.6, PD + 1.2, 5], [0, PD + 2.6, 5], [0, PD + 2.6, 12.5], [3.6, PD + 1.2, 12.5]);
  g.color(C.tarLit).mat(0).box(-0.12, PD + 2.5, 4.9, 0.12, PD + 2.75, 12.6);
  for (let k = 0; k < 4; k++) { const z = 5 + k * 2.5; g.face([-3.62, PD + 1.2, z + 0.12], [0, PD + 2.66, z + 0.12], [0, PD + 2.66, z - 0.12], [-3.62, PD + 1.2, z - 0.12]).face([3.62, PD + 1.2, z - 0.12], [0, PD + 2.66, z - 0.12], [0, PD + 2.66, z + 0.12], [3.62, PD + 1.2, z + 0.12]); }
  g.color(C.bulwark).mat(7, 1.8).box(-2.6, PD, -4, 2.6, PD + 5.2, 1.4, 'y'); g.color(C.tarLit).mat(0).box(-3, PD + 5.2, -4.4, 3, PD + 5.7, 1.8);
  g.color(C.panel).mat(0).box(-0.9, PD, 15.4, 0.9, PD + 3.6, 17.2, 'y'); g.color(C.gilt).mat(3).tube([0, PD + 3.6, 16.3], [0, PD + 4.5, 16.3], 0.9, 0.5, 10, true);
  g.color(C.tarLit).mat(0).box(-0.7, PD, 19.6, 0.7, PD + 3.3, 21.4, 'y');
  for (const sx of [-1, 1]) for (const dz of [-1.2, 1.2]) g.tube([sx * 13, PD, 20 + dz], [sx * 13, PD + 2.4, 20 + dz], 0.5, 0.5, 8, true);
}
// THE HEAD, built: two head rails a side sweeping from her stem to her catheads with their timbers between, the
// gammoning that lashes the bowsprit to the stem, and an anchor catted at each cathead (ring, tapered stock, shank,
// two curved arms with their flukes, the cat tackle)
const HEAD = { cat: [19, 23.4, -143], crown: [16.4, 10, -139] };
async function headInto(g, C, R, ctx) {
  const bez = (a, c, b, t) => [0, 1, 2].map((i) => (1 - t) * (1 - t) * a[i] + 2 * (1 - t) * t * c[i] + t * t * b[i]);
  for (const sx of [-1, 1]) {
    const X = (p) => [p[0] * sx, p[1], p[2]];
    const up = [[0.4, 27.2, -155.6], [13.5, 24.6, -154.5], [halfBeam(-140) + 0.5, 22.6, -140]], low = [[0.4, 21.5, -155.2], [12.5, 19.4, -153.8], [halfBeam(-142) + 0.4, 18.6, -142]];
    for (const [rail, r] of [[up, 0.34], [low, 0.3]]) {
      g.color(C.tarLit).mat(0);
      for (let k = 0; k < 12; k++) g.tube(X(bez(...rail, k / 12)), X(bez(...rail, (k + 1) / 12)), r, r, 6, k === 11);
    }
    // the head timbers between the rails, and a gilt bead along the upper rail's outside
    for (const t of [0.22, 0.42, 0.62, 0.82]) g.color(C.tarLit).mat(0).beam(X(bez(...low, t)), X(bez(...up, t)), 0.34, 0.34);
    g.color(C.gilt).mat(3);
    for (let k = 1; k < 12; k += 2) { const p = bez(...up, k / 12); g.tube(X([p[0] + 0.3, p[1], p[2]]), X([p[0] + 0.42, p[1], p[2]]), 0.2, 0.2, 6, true); }
    await ctx.yield();
    // the anchor: shank from its ring under the cathead down to the crown; the stock across the ring end; two arms
    // curving from the crown, each ending in a fluke
    const ring = [HEAD.cat[0] - 0.6, HEAD.cat[1] - 1.6, HEAD.cat[2]], crown = HEAD.crown;
    const sd = [crown[0] - ring[0], crown[1] - ring[1], crown[2] - ring[2]], sl = Math.hypot(...sd), su = sd.map((v) => v / sl);
    g.color(C.iron).mat(0).tube(X(ring), X(crown), 0.42, 0.55, 8, true);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, b = (k + 1) / 10 * TAU; g.tube(X([ring[0], ring[1] + 0.9 + Math.cos(a) * 0.9, ring[2] + Math.sin(a) * 0.9]), X([ring[0], ring[1] + 0.9 + Math.cos(b) * 0.9, ring[2] + Math.sin(b) * 0.9]), 0.13, 0.13, 5); }
    const st = addS(ring, su, 1.3);
    g.color(C.spar).mat(0).tube(X(st), X([st[0] + 4.6, st[1] + 0.5, st[2] + 0.3]), 0.6, 0.3, 8, true).tube(X(st), X([st[0] - 2.2, st[1] - 0.25, st[2] - 0.15]), 0.6, 0.42, 8, true);
    for (const dz of [-1, 1]) {
      g.color(C.iron).mat(0);
      let prev = crown, tip = crown;
      for (let k = 1; k <= 5; k++) { const a = k / 5 * 1.25, p = [crown[0] - su[0] * 4.6 * (1 - Math.cos(a)), crown[1] - su[1] * 4.6 * (1 - Math.cos(a)), crown[2] + dz * 4.6 * Math.sin(a)]; g.tube(X(prev), X(p), 0.5 - 0.04 * k, 0.5 - 0.04 * (k + 1), 7, k === 5); prev = p; tip = p; }
      // the fluke: a flat palm on the arm's end
      const f0 = [tip[0] - su[0] * 1.9, tip[1] - su[1] * 1.9, tip[2] + dz * 0.2];
      g.face(X([tip[0] - 1.1, tip[1], tip[2] + dz * 0.5]), X(f0), X([tip[0] + 1.1, tip[1], tip[2] + dz * 0.5]), X([tip[0], tip[1] + su[1] * 0.9, tip[2] + dz * 1.5]));
    }
    // the cat tackle from the cathead's end to the ring: two parts of line and a block
    g.color(C.rope).mat(0).tube(X([HEAD.cat[0] - 0.4, HEAD.cat[1] - 0.5, HEAD.cat[2]]), X([ring[0], ring[1] + 1.8, ring[2]]), 0.1, 0.1, 5);
    g.color(C.spar).mat(0).lathe(X([ring[0], ring[1] + 2.5, ring[2]]), X([ring[0], ring[1] + 1.5, ring[2]]), [[0, 0.1], [0.2, 0.4], [0.8, 0.4], [1, 0.1]], 8);
    await ctx.yield();
  }
  // the gammoning: nine turns of line round the bowsprit over the stem
  await ctx.yield();
  g.color(C.rope).mat(0);
  for (let k = 0; k < 9; k++) { const z = -146.4 - k * 0.42, c = R.spAt(z), c2 = R.spAt(z - 0.4); g.tube(c, c2, 2.28, 2.28, 12); g.tube(c, [0, 21.5, z + 0.4], 0.2, 0.2, 5); }
}
// the wheel (its axle along the keel) and the cabin's hanging lamp, each in its own frame so it can turn
function wheelGeo(C) {
  const g = new Geo(); g.color(C.panel).mat(0);
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, b = (k + 1) / 16 * TAU; g.beam([Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0], [Math.cos(b) * 2.5, Math.sin(b) * 2.5, 0], 0.45, 0.4); }
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.tube([0, 0, 0], [Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0], 0.2, 0.13, 6, true); }
  g.color(C.gilt).mat(3).tube([0, 0, -0.5], [0, 0, 0.5], 0.6, 0.6, 10, true);
  return g.build();
}
// a sea coat on its hook (local: the hook is the origin, the coat hangs down -y, its back to the bulkhead at z 0)
function coatGeo(C) {
  const g = new Geo(); g.color(C.coat).mat(0);
  const rings = [[-0.3, 0.55, 0.3], [-0.9, 1.3, 0.42], [-2.6, 1.25, 0.46], [-4.6, 1.42, 0.5], [-6.6, 1.6, 0.44]];
  // the body: an oval tube from the collar to the hem, its width and depth by height
  for (let k = 0; k < rings.length - 1; k++) {
    const a = rings[k], b = rings[k + 1], N = 10, i0 = g.count;
    for (let j = 0; j <= N; j++) { const an = j / N * TAU, c = Math.cos(an), sn = Math.sin(an); g.vert(c * a[1], a[0], 0.5 + sn * a[2], c, 0.1, sn); g.vert(c * b[1], b[0], 0.5 + sn * b[2], c, 0.1, sn); }
    for (let j = 0; j < N; j++) { const q = i0 + j * 2; g.quad(q, q + 2, q + 3, q + 1); }
  }
  // two sleeves hanging from the shoulders, the collar, the loop on the hook, three buttons
  for (const sx of [-1, 1]) g.tube([sx * 1.25, -1.0, 0.5], [sx * 1.75, -4.4, 0.62], 0.44, 0.34, 8, true);
  g.tube([-0.5, -0.25, 0.5], [0.5, -0.25, 0.5], 0.34, 0.34, 8, true);
  g.color(C.rope).tube([0, 0, 0.2], [0, -0.3, 0.45], 0.06, 0.06, 5);
  g.color(C.gilt).mat(3);
  for (let k = 0; k < 3; k++) g.tube([0.25, -1.6 - k * 0.9, 0.97], [0.25, -1.6 - k * 0.9, 1.03], 0.11, 0.11, 7, true);
  g.color(C.iron).mat(0).tube([0, 0.1, 0], [0, 0.1, 0.3], 0.07, 0.07, 5).tube([0, 0.1, 0.3], [0, 0.32, 0.36], 0.07, 0.05, 5, true);
  return g.build();
}
// one stern lantern in its own frame (the hook it hangs by is the origin, its flame LANTERN_SWING.hang below; built
// for the great one, the others are scaled by their size): a shackle, a gilt finial, a cap, a six-sided lit cage with
// six bars, a foot with a drop under it
const LANTERN_SWING = { hang: 4.5, gain: 4, pitch: 2.5, lag: 0.8 };
function lanternGeo(C) {
  const g = new Geo(), y = -LANTERN_SWING.hang, y0 = y - 1.3, y1 = y + 1.3;
  g.color(C.tar).mat(0).tube([0, y0 - 1, 0], [0, y0 - 0.5, 0], 0.08, 0.5, 6, true).tube([0, y0 - 0.5, 0], [0, y0, 0], 0.5, 1.15, 6).tube([0, y1, 0], [0, y1 + 1.4, 0], 1.3, 0.12, 6, true);
  g.color(C.lamp).mat(4, 4).tube([0, y0, 0], [0, y1, 0], 1.1, 1.1, 6);
  g.color(C.iron).mat(0).tube([0, y1 + 2.6, 0], [0, 0, 0], 0.07, 0.07, 5);
  for (let j = 0; j < 6; j++) { const a = j / 6 * TAU, c = Math.cos(a) * 1.13, sn = Math.sin(a) * 1.13; g.tube([c, y0, sn], [c, y1, sn], 0.07, 0.07, 4); }
  g.color(C.gilt).mat(3).lathe([0, y1 + 1.4, 0], [0, y1 + 2.6, 0], [[0, 0.1], [0.3, 0.34], [0.6, 0.12], [0.9, 0.26], [1.2, 0.02]], 7);
  return g.build();
}
function lampGeo(C) {
  const g = new Geo();
  g.color(C.tar).mat(0).tube([0, 0, 0], [0, -2.5, 0], 0.07, 0.07, 5);
  g.color(C.gilt).mat(3).tube([0, -2.5, 0], [0, -2.9, 0], 0.12, 0.75, 8).tube([0, -4.1, 0], [0, -4.5, 0], 0.7, 0.3, 8, true);
  for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; g.tube([Math.cos(a) * 0.68, -2.9, Math.sin(a) * 0.68], [Math.cos(a) * 0.68, -4.1, Math.sin(a) * 0.68], 0.05, 0.05, 4); }
  g.color(C.lamp).mat(4, 5).tube([0, -3.05, 0], [0, -4.05, 0], 0.5, 0.56, 8, true);
  return g.build();
}

// ------------------------------------------------------------------ panes (glass with rain running, a warm veil) and flame glows
const PANE_VERT = /* glsl */`
  attribute vec3 aPane; varying vec3 vW; varying vec3 vPane;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vPane = aPane; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PANE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime, uRain, uFogDen; uniform vec3 uLampCol, uFogCol; uniform sampler2D uNoise;
  varying vec3 vW; varying vec3 vPane;
  void main(){
    // rain runs down the glass in threads that wander: columns of noise sliding down on the clock
    vec2 q = vPane.xy;
    float col = texture2D(uNoise, vec2(q.x * .09, .37)).g;
    float run = texture2D(uNoise, vec2(q.x * .23 + col * .3, q.y * .035 + uTime * (.05 + .05 * col))).r;
    float thread = smoothstep(.56, .7, run) * smoothstep(.35, .6, texture2D(uNoise, vec2(q.x * .61, q.y * .05 + uTime * .11)).g);
    float bead = smoothstep(.72, .8, texture2D(uNoise, q * .31 + vec2(0., uTime * .013)).g);
    float wet = clamp(thread * (.45 + .55 * uRain) + bead * .25, 0., 1.);
    float dist = length(cameraPosition - vW), f = exp(-uFogDen * uFogDen * dist * dist);
    vec3 glow = uLampCol * (.3 + .08 * texture2D(uNoise, q * .05).b) * vPane.z;
    vec3 c = glow * (1. - .35 * wet) + vec3(.5, .62, .55) * wet * .22;
    float a = .1 + .3 * wet;
    gl_FragColor = vec4(c * f, a * f);
  }`;
const LANTERN_HALO = 16;
const GLOW_VERT = /* glsl */`
  uniform float uTime; uniform vec2 uPh; varying vec2 vUv; varying float vFl;
  void main(){
    vec4 c = modelMatrix * vec4(0., 0., 0., 1.);
    float s = length(modelMatrix[0].xyz);
    vFl = .82 + .1 * sin(uTime * 9.1 + uPh.x) + .08 * sin(uTime * 14.3 + uPh.y);   // each flame's two phases are dealt (the stream 'glows')
    vec4 mv = viewMatrix * c; mv.xy += position.xy * s * (.92 + .08 * vFl);
    vUv = position.xy; gl_Position = projectionMatrix * mv;
  }`;
const GLOW_FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uLampCol; varying vec2 vUv; varying float vFl;
  void main(){
    float r = clamp(length(vUv) * 2., 0., 1.);
    float core = exp(-r * r * 40.), halo = (1. - r) * (1. - r) * (1. - r) * .5;
    gl_FragColor = vec4(uLampCol * (core * 5. + halo) * vFl, 1.);
  }`;

// WATER FROM THE LEE SCUPPERS: at SCUPPERS.zs along her lee side the deck's water spills through the bulwark's foot and
// falls to the sea in a thin sheet that the wind drags aft; it gushes as she rolls down to lee (the roll law's own 11 s)
// and thins as she comes back. Ribbons of the ship: they roll with her.
const SCUPPERS = { zs: [-104, -92, -80, -68, -56, -44, -32, -22], y: 9.5, out: 2.4, drop: 11, aft: 1.6, wide: [0.5, 1.1] };
function scupperGeometry() {
  const p = [], a = [], ix = [], N = 9;
  SCUPPERS.zs.forEach((z, si) => {
    const x0 = breadthAt(z, SCUPPERS.y) + 0.12, base = p.length / 3;
    for (let k = 0; k <= N; k++) {
      const t = k / N, w = SCUPPERS.wide[0] + (SCUPPERS.wide[1] - SCUPPERS.wide[0]) * t, x = x0 + SCUPPERS.out * t, y = SCUPPERS.y - SCUPPERS.drop * t * t, zc = z + SCUPPERS.aft * t * t;
      for (const sg of [-1, 1]) { p.push(x, y, zc + sg * w / 2); a.push(sg * 0.5, t, si * 0.37, SCUPPERS.drop * t * t); }
    }
    for (let k = 0; k < N; k++) { const q = base + k * 2; ix.push(q, q + 2, q + 3, q, q + 3, q + 1); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aRun', new THREE.Float32BufferAttribute(a, 4)); g.setIndex(ix);
  return g;
}
const WATER_VERT = /* glsl */`
  attribute vec4 aRun; varying vec4 vRun; varying vec3 vW;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vRun = aRun; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_FRAG = /* glsl */`
  precision highp float;
  ${LIGHT_GLSL}
  uniform vec3 uPlaster;
  varying vec4 vRun; varying vec3 vW;
  void main(){
    // threads of white running down the sheet on the clock, each scupper its own; the gush follows her roll
    float run = texture2D(uNoise, vec2(vRun.x * .5 + vRun.z, vRun.w * .07 - uTime * .42)).r, fine = texture2D(uNoise, vec2(vRun.x * 1.7 + vRun.z * 3., vRun.w * .21 - uTime * 1.1)).g;
    float gush = .45 + .55 * clamp((uRoll - .0175) / .0524, 0., 1.);
    float edge = 1. - smoothstep(.25, .5, abs(vRun.x)), ends = smoothstep(0., .06, vRun.y) * (1. - smoothstep(.75, 1., vRun.y));
    float a = edge * ends * gush * smoothstep(.3, .62, run * .65 + fine * .45);
    vec3 col = uPlaster * (mix(uGround, uSky, .7) * 1.4 + uKeyCol * (.35 + .5 * fine));
    gl_FragColor = vec4(haze(col, length(cameraPosition - vW)), a * .85);
  }`;

export async function buildHero(ctx, opts = {}) {
  const pal = opts.palette || ['#5FA07E', '#17392B', '#3F7F72', '#ECE6D6', '#14110F', '#C99A4A', '#B8862E', '#FFB45A'];
  const C = {
    hull: lin('#342d26'), tar: lin('#5c5247'), tarLit: lin('#6e6252'), ochre: lin(pal[5]), gilt: lin(pal[6]), plaster: lin(pal[3]), lamp: lin(pal[7]),
    copper: lin('#5c9079'), deck: lin('#7a6850'), panel: lin('#8f7d5f'), trim: lin('#a8926c'), door: lin('#7c6a4c'), beam: lin('#5e4c36'),
    deckhead: lin('#bfb49a'), bulwark: lin('#8a7a52'), boat: lin('#cfc8b4'), cover: lin('#a89468'), rope: lin('#8c7a52'), table: lin('#62402a'), cloth: lin('#235040'), paper: lin('#dcc391'), roll: lin('#c79a4c'), spar: lin('#5e5244'), carved: lin('#6b5334'), iron: lin('#2b2a28'), cask: lin('#8a6a40'), coat: lin('#33465c'), sternBand: lin('#4f3d22'), roof: lin('#6d7f76'), counter: lin('#1f4a44'),
  };
  // every stream this file draws from, taken once, in one fixed order, each from the world's seed and a name
  const fork = (name) => ctx.core.makeRng(ctx.core.hashSeed('gale-ship:' + name + ':' + ctx.seed));
  const rSails = fork('sails'), rGear = fork('gear'), rRig = fork('rigging'), rClock = fork('clock');
  // the two phases of her motion (roll, pitch), from their own stream
  const MPH = motionPhases(ctx.core, ctx.seed);
  // the phases of the things that work on the world clock (wheel, cabin lamp, coat, pennant, buntline, dividers, the two
  // flag halyards): dealt, never typed
  const CK = []; for (let k = 0; k < 12; k++) CK.push(rClock.range(0, TAU));
  const noise = await noiseTexture(ctx);
  const U = {
    uTime: { value: 0 }, uFogDen: { value: 0.0011 }, uCaus: { value: 0.5 }, uRoll: { value: 0 },
    // the moth's shade: the world hands these in (setLight: moth = { mid, axis, n, t, lamp }) and moves uMoth each frame
    uVMid: { value: new THREE.Vector3(0, 56, -50) }, uVAxis: { value: new THREE.Vector3(0.47, 0, -0.883).normalize() }, uMothN: { value: new THREE.Vector3(0, 1, 0) }, uMothT: { value: new THREE.Vector3(1, 0, 0) },
    uLampAt: { value: new THREE.Vector3(-315, 506, -761) }, uMoth: { value: new THREE.Vector4(1e5, 0, 0, 0) },
    uKeyDir: { value: new THREE.Vector3(-0.35, 0.5, -0.79).normalize() }, uKeyCol: { value: new THREE.Color('#FFD9A0').multiplyScalar(0.95) },
    uSky: { value: new THREE.Color('#6FB592').multiplyScalar(0.4) }, uGround: { value: new THREE.Color('#2C5F56').multiplyScalar(0.36) },
    uFogCol: { value: new THREE.Color('#4E8F74') }, uLamp: { value: new THREE.Vector3(CABIN_LAMP.x, CABIN_LAMP.y - CABIN_LAMP.drop, CABIN_LAMP.z) }, uLampCol: { value: new THREE.Color(pal[7]).multiplyScalar(2.8) },
    uNoise: { value: noise }, uShipInv: { value: new THREE.Matrix4() }, uLampAx: { value: new THREE.Vector3(0, -1, 0) }, uLampE1: { value: new THREE.Vector3(1, 0, 0) }, uNet: { value: new THREE.Vector2() }, uRain: { value: opts.rain ? 1 : 0 },
    uOchre: { value: new THREE.Color(pal[5]) }, uCopper: { value: new THREE.Color().fromArray(C.copper) }, uPlaster: { value: new THREE.Color(pal[3]) }, uTar: { value: new THREE.Color().fromArray(C.tar) },
  };
  const shipMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHIP_VERT, fragmentShader: SHIP_FRAG, side: THREE.DoubleSide });
  const paneMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: PANE_VERT, fragmentShader: PANE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  // one material to a flame: each carries its own two dealt phases of flicker (a stream of their own)
  const rGlow = fork('glows');
  const glowMatOf = () => new THREE.ShaderMaterial({ uniforms: { ...U, uPh: { value: new THREE.Vector2(rGlow.range(0, TAU), rGlow.range(0, TAU)) } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  const object = new THREE.Group(), rig = new THREE.Group(), body = new THREE.Group();
  // the rig turns about P; the body carries every piece in ship coordinates
  rig.position.fromArray(SHIP.P); body.position.set(-SHIP.P[0], -SHIP.P[1], -SHIP.P[2]); rig.add(body); object.add(rig);
  const add = (geo, mat, order = 0, name = '') => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; body.add(m); return m; };
  const info = { triangles: 0 };
  const count = (g) => { info.triangles += (g.index ? g.index.count : g.attributes.position.count) / 3; return g; };

  // ---- the cabin and the stern
  const panes = [];
  { const g = new Geo(); await cabinInto(g, C, ctx); await ctx.yield(); await sternInto(g, C, panes, ctx); await ctx.yield(); await sternWorkInto(g, C, ctx); await ctx.yield(); for (const sx of [-1, 1]) { await quarterGalleryInto(g, C, sx, ctx); await ctx.yield(); } add(count(await g.buildY(ctx)), shipMat, 0, 'cabin and stern'); }
  await ctx.yield();
  {
    const p = [], a = [], ix = [];
    panes.forEach((q, k) => {
      const [x0, y0, x1, y1, z, side] = q, o = k * 4;
      if (side === 0) p.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
      a.push(x0 + k * 31, y0, 1, x1 + k * 31, y0, 1, x1 + k * 31, y1, 1, x0 + k * 31, y1, 1); ix.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aPane', new THREE.Float32BufferAttribute(a, 3)); g.setIndex(ix);
    add(count(g), paneMat, 2, 'panes');
  }
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  { const g = new Geo(); await hullInto(g, C, ctx); await ctx.yield(); add(count(await g.buildY(ctx)), shipMat, 0, 'hull'); }
  await ctx.yield();
  const R = rigPlan();
  { const g = new Geo(); await sparsInto(g, C, R, ctx); await ctx.yield(); add(count(await g.buildY(ctx)), shipMat, 0, 'spars'); }
  await ctx.yield();
  const sailMat = new THREE.ShaderMaterial({ uniforms: { ...U, uPaper: { value: new THREE.Color('#D8B978') }, uPaperThru: { value: new THREE.Color('#E3B866').multiplyScalar(0.62) } },
    vertexShader: SAIL_VERT, fragmentShader: SAIL_FRAG, side: THREE.DoubleSide });
  add(count(await sailsGeometry(R, rSails, ctx)), sailMat, 0, 'sails');
  await ctx.yield();
  const uPxH = { value: 450 };
  const ropeMat = new THREE.ShaderMaterial({ uniforms: { ...U, uPxH, uThread: { value: new THREE.Color('#2a231c') } }, vertexShader: ROPE_VERT, fragmentShader: ROPE_FRAG, transparent: true });
  const flagMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: FLAG_VERT, fragmentShader: FLAG_FRAG, side: THREE.DoubleSide });
  await ctx.yield();
  { const rg = await riggingGeometry(R, rRig, info, ctx); await ctx.yield(); add(count(rg.ropes), ropeMat, 1, 'ropes'); await ctx.yield(); add(count(flagGeometry(R, C, [CK[6], CK[7], CK[9], CK[10]])), flagMat, 0, 'pennant'); }
  await ctx.yield();
  { const g = new Geo(); await gearInto(g, C, R, info.shroudFeet, rGear, ctx); await ctx.yield(); await headInto(g, C, R, ctx); await ctx.yield(); const built = await g.buildY(ctx); await ctx.yield(); add(count(built), shipMat, 0, 'deck gear'); }
  await ctx.yield();
  // things that turn in their own frames: the wheel, the hanging lamp, the chart on the table, the dividers
  const wheel = new THREE.Mesh(count(wheelGeo(C)), shipMat); wheel.position.fromArray(SHIP.wheel); wheel.frustumCulled = false; wheel.name = 'wheel'; body.add(wheel);
  await ctx.yield();
  const lamp = new THREE.Group(); lamp.position.set(CABIN_LAMP.x, CABIN_LAMP.y, CABIN_LAMP.z); body.add(lamp);
  { const m = new THREE.Mesh(count(lampGeo(C)), shipMat); m.frustumCulled = false; m.name = 'lamp'; lamp.add(m); }
  const lampGlow = new THREE.Mesh(glowGeo, glowMatOf()); lampGlow.position.set(0, -CABIN_LAMP.drop, 0); lampGlow.scale.setScalar(CABIN_LAMP.card); lampGlow.frustumCulled = false; lampGlow.renderOrder = 3; lampGlow.name = 'lamp glow'; lamp.add(lampGlow);
  const chart = new THREE.Group(); chart.position.set(9.75, 12.56, 12); body.add(chart);
  { const g = new Geo(); g.mat(6); const v = (x, z, a, b) => { g.color([a, b, 0]); return g.vert(x, 0, z, 0, 1, 0); }; const i0 = v(-3.1, 2.2, 0, 0); v(3.1, 2.2, 1, 0); v(3.1, -2.2, 1, 1); v(-3.1, -2.2, 0, 1); g.quad(i0, i0 + 1, i0 + 2, i0 + 3);
    const m = new THREE.Mesh(count(g.build()), shipMat); m.frustumCulled = false; m.name = 'chart'; chart.add(m); }
  const dividers = new THREE.Group(); dividers.position.set(12.2, 12.6, 9.4); body.add(dividers);
  { const g = new Geo(); g.color(C.gilt).mat(3).tube([0, 2.2, 0], [-0.55, 0, 0.2], 0.09, 0.02, 5).tube([0, 2.2, 0], [0.55, 0, -0.2], 0.09, 0.02, 5).tube([0, 2.1, 0], [0, 2.5, 0], 0.14, 0.14, 6, true);
    const m = new THREE.Mesh(count(g.build()), shipMat); m.frustumCulled = false; m.name = 'dividers'; dividers.add(m); }
  await ctx.yield();
  // the coat on its hook on the port side wall, between the forward bulkhead and the settee (12 m and more from the line)
  const coat = new THREE.Group(); coat.position.set(SHIP.cabin.x0 + 0.05, 19.3, 2.2); coat.rotation.y = Math.PI / 2; coat.scale.setScalar(0.85); body.add(coat);
  { const m = new THREE.Mesh(count(coatGeo(C)), shipMat); m.frustumCulled = false; m.name = 'coat'; coat.add(m); }
  const waterMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  await ctx.yield();
  add(count(scupperGeometry()), waterMat, 2, 'scupper water');
  await ctx.yield();
  const _lp = new THREE.Vector3(), _ax = new THREE.Vector3(), _e1 = new THREE.Vector3(), _m3 = new THREE.Matrix3();
  // a warm halo round each lantern's flame (LANTERN_HALO metres across for the great one, the others by their size)
  // and the lantern itself, hung from its crook's hook in a frame of its own, the halo with it
  const lanterns = [], lanternG = count(lanternGeo(C));
  for (const [x, y, z, k] of SHIP.lanterns) {
    const h = new THREE.Group(); h.position.set(x, y + LANTERN_SWING.hang * k, z); h.scale.setScalar(k); body.add(h); lanterns.push({ h, k });
    const b = new THREE.Mesh(lanternG, shipMat); b.frustumCulled = false; b.name = 'lantern'; h.add(b);
    const m = new THREE.Mesh(glowGeo, glowMatOf()); m.position.set(0, -LANTERN_SWING.hang, 0); m.scale.setScalar(LANTERN_HALO); m.frustumCulled = false; m.renderOrder = 3; m.name = 'lantern glow'; h.add(m);
  }

  await ctx.yield();
  const _size = new THREE.Vector2(), _e = new THREE.Euler(0, 0, 0, 'ZXY');
  const pose = (time) => { const mo = motionAt(time, MPH); _e.set(mo.pitch, 0, -mo.roll); rig.quaternion.setFromEuler(_e); return mo; };
  pose(0);
  return {
    object, radius: 120, height: 180, center: new THREE.Vector3(0, 62, -64), ground: false,
    anchors: {
      painting: new THREE.Vector3(0, 15, 0), lineStart: new THREE.Vector3(0, 15, 80), sternWindow: new THREE.Vector3().fromArray(SHIP.sternWindow), sternWindowHalf: [(SHIP.casement.x1 - SHIP.casement.x0) / 2, (SHIP.casement.y1 - SHIP.casement.y0) / 2],
      stemHead: new THREE.Vector3(0, 26, -154), mainTruck: new THREE.Vector3(0, 180, -62), lampHook: new THREE.Vector3(CABIN_LAMP.x, CABIN_LAMP.y, CABIN_LAMP.z),
    },
    uniforms: U, info, motion: MPH,
    // the world hands in its light: any of keyDir, keyCol, sky, ground, fogCol (THREE.Color or Vector3), fogDen, caus
    setLight(o) {
      if (o.moth) { U.uVMid.value.copy(o.moth.mid); U.uVAxis.value.copy(o.moth.axis); U.uMothN.value.copy(o.moth.n); U.uMothT.value.copy(o.moth.t); U.uLampAt.value.copy(o.moth.lamp); }
      if (o.keyDir) U.uKeyDir.value.copy(o.keyDir).normalize(); if (o.keyCol) U.uKeyCol.value.copy(o.keyCol); if (o.sky) U.uSky.value.copy(o.sky);
      if (o.ground) U.uGround.value.copy(o.ground); if (o.fogCol) U.uFogCol.value.copy(o.fogCol); if (o.fogDen != null) U.uFogDen.value = o.fogDen; if (o.caus != null) U.uCaus.value = o.caus;
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      const mo = pose(time); U.uRoll.value = mo.roll;
      object.updateMatrixWorld(true); U.uShipInv.value.copy(body.matrixWorld).invert();
      ctx.renderer.getDrawingBufferSize(_size); uPxH.value = _size.y;
      // the wheel works a few spokes to and fro; the lamp swings up to 25 degrees athwartships (7.5 s) and a little fore and aft
      wheel.rotation.z = 0.5 * Math.sin(time * 0.83 + CK[0]) + 0.22 * Math.sin(time * 2.1 + CK[1]);
      lamp.rotation.z = CABIN_LAMP.swing * DEG * (0.62 + 0.38 * Math.sin(TAU * time / 23 + CK[2])) * Math.sin(TAU * time / 7.5 + CK[3]);
      lamp.rotation.x = 6 * DEG * Math.sin(TAU * time / 9 + CK[4]);
      lamp.updateMatrixWorld(true); _lp.set(0, -CABIN_LAMP.drop, 0); lamp.localToWorld(_lp); U.uLamp.value.copy(_lp).applyMatrix4(U.uShipInv.value);
      // the lamp's own frame in ship space (its hanging axis and one side of its cage): its foot, cap and four posts
      // throw shadows that swing with it
      _m3.setFromMatrix4(lamp.matrixWorld); _ax.set(0, -1, 0).applyMatrix3(_m3); _e1.set(1, 0, 0).applyMatrix3(_m3); _m3.setFromMatrix4(U.uShipInv.value);
      U.uLampAx.value.copy(_ax).applyMatrix3(_m3).normalize(); U.uLampE1.value.copy(_e1).applyMatrix3(_m3).normalize();
      // HER THREE STERN LANTERNS SWING BY HER OWN LAW (motionAt, read a beat behind her, the smaller ones a shorter
      // beat): each keeps to the plumb at her mean heel and over-swings her roll and her pitch about it
      for (const { h, k } of lanterns) {
        const ml = motionAt(time - LANTERN_SWING.lag * k, MPH), heel = MOTION.heel * DEG;
        h.rotation.z = heel + LANTERN_SWING.gain * (ml.roll - heel); h.rotation.x = -LANTERN_SWING.pitch * ml.pitch;
      }
      // the coat swings on its hook a beat behind the roll (5 degrees each way) with a small quick sway of its own
      coat.rotation.z = 5 * DEG * Math.sin(TAU * (time - 0.9) / MOTION.rollPer + MPH[0]) + 1.2 * DEG * Math.sin(TAU * time / 4.7 + CK[5]);
      // the chart slides 0.8 m to and fro a beat behind the roll; the dividers rock on their points
      chart.position.x = 9.75 + 0.4 * Math.sin(TAU * (time - 1.4) / MOTION.rollPer + MPH[0]); chart.rotation.y = 0.05 * Math.sin(TAU * (time - 2) / MOTION.rollPer + MPH[0]);
      dividers.rotation.z = 0.1 * Math.sin(TAU * (time - 0.6) / MOTION.rollPer + MPH[0]) + 0.03 * Math.sin(time * 2.3 + CK[8]);
    },
    dispose() { noise.dispose(); },
  };
}
