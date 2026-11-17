// A Sea of Loose Coin: the hall and the sea (hero set piece). A long barrel hall of riveted steel under two strips of
// roof glazing; inside it a fortune kept as a sea of loose gold coin: dunes, troughs, cones under the spouts, a sink
// where the coin drains away, one diving tower with a springboard standing in the coin, a ruled depth scale up the
// west wall and one beside the door (marks alone: no numeral, no letter), and a round vault door standing open in the
// north bulkhead. Our own drawing from real things: train sheds, gasholders, grain spouts, dunes at the angle of rest,
// bank vault doors, caged lamps. Nothing lettered, no figure. The world sets neither portal.drawWithin nor portal.drawIn.
// Axes: x east, y up, z south; the flight goes north (minus z). Floor plates y 0. Hall x -32..32, z 215..-150.
import * as THREE from 'three';

export const HALL = { hw: 32, wallH: 16, crown: 46, zS: 215, zN: -150, bay: 12, catY: 21, railY: 27 };
export const SINK = { x: -15, z: -47, rim: 17, throat: 2, rimY: 8, depth: 13 };
export const DOOR = { x: 0, y: 12, z: -150, r: 4.3 };
export const CURTAIN = { x: -2, z0: -110, z1: -96, y: 30 };
// the first fall's spout: where its axis stands along the hall and how far out from the east wall
export const FIRST = { z: 109, out: 8.5 };
// places of the plan the flown line is laid through. The entry, and where its low trough ends (r6: under the
// springboard, see BOARD; the first fall is passed 29 m before it, its stream within 2.8 m of its axis).
// (r6) THE SPRINGBOARD stands across the entry trough's far end: BOARD.z is where its board crosses over the line. The
// trough runs level under it and ends 4 m north of it; the climb begins there. The wide view (r6): 8 m over the sea's
// highest crests, at the place of the plan where the line has come round onto the hall's axis
export const BOARD = { z: 80 };
export const ENTRY = { x: 19, y: 7, z: 148, end: BOARD.z - 4 };
export const WIDE = { x: 3, y: 29, z: 26 };
// the door's bank: north of this the coin lies low before the round door
export const BANK = { z: -118 };
// the sink's rim is tilted: its low lip faces the wide view, its high lip stands on the far side (2.5 m under and
// over the rim's middle height), so the funnel shows its far wall to the line coming down the hall
{ const dx = WIDE.x - SINK.x, dz = WIDE.z - SINK.z, d = Math.hypot(dx, dz); SINK.tilt = 2.5; SINK.tx = -dx / d; SINK.tz = -dz / d; }
// the crane's grab: it hangs over the west side from the crab on the bridge (its ropes' head at y 29.3), 8 m long
export const GRAB = { x: -18, y: 29.3, hang: 8 };
// the roof strips' middles and the height they stand at; the day sun's lean (east and south per metre of height): it
// stands so that the west strip's light falls into the sink's throat, and 17 degrees south of overhead
export const STRIP = { x: 4, y: 45.6 };
export const SUN_DAY = [(-STRIP.x - SINK.x) / (STRIP.y - (SINK.rimY - SINK.depth)), 0.3];
const REST = 0.625;
// the caged lamps: how far over a walkway's deck the glass hangs and how far out from the wall it stands; one at every
// rib along the catwalks, one at every panel line along the gallery on the north bulkhead
export const LAMP = { up: 2.3, out: 0.55 };
// the round ports of the east wall: their height, the frame's half breadth, its opening's half breadth, its depth
export const PORT = { y: 14.2, half: 1.3, open: 0.98, deep: 0.7 };

const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- the sea's height: a pure function of place and seed
// route: places every 2 m of the flown line, [x, y, z, w, depth, flown] with w the half width of the trough's floor
// there and depth how far the coin lies under the line; the first places lie on the entry axis behind the entry (the
// trough runs open behind us). The coin under the line is 3.15 m below it in the entry trough (5.1 m from the saddle on)
// and rises from there no steeper than the angle of rest: the route's trough, saddle and lane. In the entry trough the
// long dune's slip face is the left wall: it stands 3 m from the line and rises to the dune's crest.
export function makeSea(core, seed, route) {
  const R = (name) => core.makeRng(core.hashSeed(name + ':' + seed));
  const rd = R('dunes'), rs = R('spouts'), noise = core.makeNoise(core.hashSeed('sea:' + seed));
  const ridges = [];
  for (let zc = 200 + rd.range(-8, 8); zc > -160; zc -= rd.range(42, 56)) {
    ridges.push({ z: zc, H: rd.range(14.5, 19.5), a: rd.range(5, 12), k: rd.range(0.05, 0.085), ph: rd.range(0, 6.28), n: rd.range(0, 90), back: rd.range(0.3, 0.42), south: rd.chance(0.78) });
  }
  // the long dune beside the entry trough: its slip face is the trough's west wall
  const long = { H: rd.range(16.5, 19), x: rd.range(-4.5, -1.5), a: rd.range(1.5, 3), ph: rd.range(0, 6.28) };
  // six spouts, three a side, staggered about 45 m apart; the first (east, at the entry trough) stands where the plan puts it
  const spouts = [];
  const eastZ = [FIRST.z, 64 + rs.range(-4, 4), 19 + rs.range(-5, 5)], westZ = [86 + rs.range(-5, 5), 41 + rs.range(-5, 5), -4 + rs.range(-4, 4)];
  for (let i = 0; i < 3; i++) spouts.push({ side: 1, x: 26, z: eastZ[i], H: i === 0 ? 9.5 : rs.range(11, 14.5), out: i === 0 ? FIRST.out : rs.range(6, 8) });
  for (let i = 0; i < 3; i++) spouts.push({ side: -1, x: -32 + rs.range(6.5, 8.5), z: westZ[i], H: rs.range(11.5, 15), out: 0 });
  for (const s of spouts) { if (s.side < 0) s.out = 32 + s.x; else s.x = 32 - s.out; }
  // the crane's bite: under the grab's track, south of the sink
  const bite = { x: GRAB.x, z: rd.range(4, 30), r: 6.5, d: 4.2 };
  // a great heap against the west wall behind the third west spout's cone (the wall with no ports): its place along the
  // wall, its length and its height dealt by a stream of its own, so the seed deals how deep each rib there is buried
  const rh = R('heaps'), heaps = [{ x: -33.2, z: spouts[5].z + rh.range(-6, 6), half: rh.range(6, 12), H: rh.range(19, 25.5) }];
  // coin banked high into the two corners where the north bulkhead meets the walls, either side of the round door: their
  // heights from the same stream
  const corners = [[33, rh.range(21, 26)], [-33, rh.range(17, 22)]];
  const zOf = route.map((p) => p[2]);
  const raw = (x, z) => {
    let e = Math.exp(1.1 * (3.2 + 1.3 * noise.n2(x * 0.03, z * 0.03)));
    for (const r of ridges) {
      const dz = z - (r.z + r.a * Math.sin(x * r.k + r.ph));
      const Hc = r.H * (0.66 + 0.34 * (0.5 + 0.5 * noise.n2(x * 0.045 + r.n, r.n * 3.1)));
      // (r6) a crest is rounded over about 3.5 m (it was a sharp edge that the mesh drew in steps), and a face's slope
      // varies along it between 0.8 and 1 of its own (never steeper than the angle of rest), so no face is a flat plane
      const d = Math.sqrt(dz * dz + 12) - 1.48;
      const steep = (dz > 0) === r.south, warp = 0.9 + 0.1 * noise.n2(x * 0.09 + r.n, z * 0.09);
      e += Math.exp(1.1 * (Hc - (steep ? REST : r.back) * warp * d));
    }
    {
      const dx = x - (long.x + long.a * Math.sin(z * 0.06 + long.ph)), d = Math.sqrt(dx * dx + 12) - 1.48;
      e += Math.exp(1.1 * (long.H - (dx > 0 ? REST : 0.3) * d - 40 * (1 - sst(62, 86, z))));
    }
    // (r6) slump lobes: the loose coin lies in soft swells half a metre high and some 8 m across
    let y = Math.log(e) / 1.1 + 0.28 * noise.n2(x * 0.13 + 40, z * 0.13 - 17);
    // (r6) THE MARGINS: toward each wall the dune field comes down at the angle of rest to a margin (about 10 m at the
    // wall, some 2.5 m more or less along the hall in long swells), so that the coin's line along a wall runs nearly
    // level between the ribs (the heaps that stood high against the walls drew a stair from rib to rib: they are gone,
    // the west wall's great heap and the corner drifts with them). The spouts' cones and the curtain's ridge are poured
    // on top of it
    const wl = 10 + 2.6 * noise.n2(z * 0.045, x > 0 ? 7.3 : -4.1) + REST * (HALL.hw - Math.abs(x));
    if (wl < y + 4) y = -Math.log(Math.exp(-0.9 * y) + Math.exp(-0.9 * wl)) / 0.9;
    let c = Math.exp(1.1 * y);
    for (const s of spouts) { const rho = Math.sqrt((x - s.x) ** 2 + (z - s.z) ** 2 + 0.5) - 0.7; c += Math.exp(1.1 * (s.H - REST * rho)); }
    // the ridge under the last fall's curtain
    { const dzc = Math.max(0, CURTAIN.z0 - z, z - CURTAIN.z1), rho = Math.sqrt((x - CURTAIN.x) ** 2 + dzc * dzc + 0.5) - 0.7; c += Math.exp(1.1 * (9.6 - REST * rho)); }
    return Math.log(c) / 1.1;
  };
  const h = (x, z) => {
    let y = raw(x, z);
    // level ground about the sink, so its rim stands at one height
    const sr = Math.hypot(x - SINK.x, z - SINK.z);
    // the apron: low ground is raised to the rim's level in a band of 9 m round the rim, the same all round
    // (r6) higher ground comes down to the rim at the angle of rest, as loose coin stands about a hole it runs into (it
    // came down inside the same 9 m band: a cliff of coin wherever a dune stood beside the sink)
    if (sr < SINK.rim + 45) {
      const lvl = SINK.rimY + SINK.tilt * Math.max(-1.4, Math.min(1.4, ((x - SINK.x) * SINK.tx + (z - SINK.z) * SINK.tz) / SINK.rim)) + 0.5 * noise.n2(x * 0.07, z * 0.07);
      if (y < lvl) y = lerp(y, lvl, sst(SINK.rim + 9, SINK.rim + 2, sr));
      const cone = lvl + REST * Math.max(0, sr - SINK.rim - 2);
      if (cone < y + 3) y = -Math.log(Math.exp(-2.5 * y) + Math.exp(-2.5 * cone)) / 2.5;
    }
    // the crane's bite: a clean scooped bowl
    const br = Math.hypot(x - bite.x, z - bite.z);
    if (br < bite.r * 1.6) y -= bite.d * sst(bite.r * 1.5, 0, br) * sst(bite.r * 1.6, bite.r, br) * 1.15;
    // its rim, thrown up round the bowl
    if (br < bite.r * 2.3) y += 0.6 * Math.exp(-(((br - bite.r * 1.45) / 1.3) ** 2));
    // the route's trough: the coin 3.15 m under the line (5.1 m from the saddle on), rising at the angle of rest
    let lo = 0, hi = zOf.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (zOf[m] > z) lo = m; else hi = m; }
    const i0 = Math.max(0, lo - 22), i1 = Math.min(route.length - 1, lo + 22);
    let cap = 1e9;
    for (let i = i0; i <= i1; i++) {
      // (r6) the trough's floor is a round hollow: its sides leave the floor level and steepen to the angle of rest
      // over some 8 m (they met the floor in a hard crease)
      const p = route[i], d = Math.hypot(x - p[0], z - p[2]), dd = Math.max(0, d - p[3]), c = p[1] - p[4] + (x < p[0] ? REST : 0.6) * (Math.sqrt(dd * dd + 16) - 4);
      if (c < cap) cap = c;
    }
    if (cap < y + 3) y = -Math.log(Math.exp(-1.6 * y) + Math.exp(-1.6 * cap)) / 1.6 - 0.12;
    // the round door's bank: before the door and its open plug the coin lies against the north bulkhead up to about
    // y 6.5; either side of them it banks up toward the walls at the angle of rest
    // (r6) its planes meet in round joins and it meets the sea softly (they met in hard creases)
    if (z < BANK.z + 14) {
      const sm = (t) => Math.sqrt(t * t + 6.25) - 2.5;
      const c = 6.5 + REST * sm(Math.max(0, x - 7, -19 - x)) + 0.55 * sm(Math.max(0, z + 146)) + REST * Math.max(0, z - BANK.z);
      if (c < y + 3) y = -Math.log(Math.exp(-1.2 * y) + Math.exp(-1.2 * c)) / 1.2;
    }
    // the sink: a funnel to a throat in the floor, its rim bitten in arcs
    if (sr < SINK.rim + 2.5) {
      const th = Math.atan2(z - SINK.z, x - SINK.x), rim = SINK.rim + 0.9 * Math.abs(Math.sin(th * 3.5 + 1.3)) - 0.5;
      const ry = SINK.rimY + SINK.tilt * (Math.cos(th) * SINK.tx + Math.sin(th) * SINK.tz), dp = ry - SINK.rimY + SINK.depth;
      const f = sr > SINK.throat ? ry - dp * (1 - (sr - SINK.throat) / (rim - SINK.throat)) : SINK.rimY - SINK.depth - (SINK.throat - sr) * 4;
      if (f < y) y = f;
    }
    return y;
  };
  return { h, ridges, spouts, bite, long, noise, heaps };
}

// ---------------------------------------------------------------- the sea's mesh: a grid in bands along the hall
export async function buildSeaMesh(ctx, sea, material, step = 0.8, form = null) {
  const H = HALL, nx = Math.round(2 * H.hw / step), nz = Math.round((H.zS - H.zN) / step), W = nx + 1;
  const dx = 2 * H.hw / nx, dz = (H.zS - H.zN) / nz;
  const Y = new Float32Array(W * (nz + 1));
  for (let j = 0; j <= nz; j++) {
    const z = H.zS - j * dz;
    for (let i = 0; i <= nx; i++) Y[j * W + i] = sea.h(-H.hw + i * dx, z);
    if (j % 5 === 4) await ctx.yield();
  }
  const at = (i, j) => Y[Math.min(nz, Math.max(0, j)) * W + Math.min(nx, Math.max(0, i))];
  const bil = (fi, fj) => {
    const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    return lerp(lerp(at(i, j), at(i + 1, j), u), lerp(at(i, j + 1), at(i + 1, j + 1), u), v);
  };
  // for each vertex on a steep face: how far its crest stands above it (the slips' lanes run down from there)
  const crest = new Float32Array(W * (nz + 1));
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      let fi = i, fj = j, y0 = at(i, j), top = y0;
      for (let s = 0; s < 44; s++) {
        const gx = (bil(fi + 1, fj) - bil(fi - 1, fj)) / (2 * dx), gz = (bil(fi, fj + 1) - bil(fi, fj - 1)) / (2 * dz), g = Math.hypot(gx, gz);
        if (g < 0.33) break;
        fi += gx / g; fj += gz / g;
        if (fi < 0 || fi > nx || fj < 0 || fj > nz) break;
        top = bil(fi, fj);
      }
      crest[j * W + i] = Math.max(0, top - y0);
    }
    if (j % 5 === 4) await ctx.yield();
  }
  // how much of the hall each vertex sees (a crest all of it, a trough's floor less: the horizon in eight directions
  // out to 15 m), and how far it stands proud of the coin about it (a crest)
  const lit = new Float32Array(W * (nz + 1) * 2), STEPS = [1.6, 3.2, 5.6, 9.6, 15];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const y0 = at(i, j); let occ = 0;
      for (let d = 0; d < 8; d++) {
        const a = d * 0.7854 + 0.2, cx = Math.cos(a) / dx, cz = Math.sin(a) / dz; let ms = 0;
        for (const st of STEPS) { const sl = (bil(i + cx * st, j + cz * st) - y0) / st; if (sl > ms) ms = sl; }
        occ += ms / Math.sqrt(1 + ms * ms);
      }
      const k = (j * W + i) * 2;
      // (r6) FORM: a face turned to the hall's light (form: the way to it) keeps what it sees; a face turned from it
      // keeps as little as 0.62 of it
      let turn = 1;
      if (form) {
        const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * dx), gz = -(at(i, j + 1) - at(i, j - 1)) / (2 * dz), l = Math.hypot(gx, gz, 1);
        turn = 0.62 + 0.42 * Math.min(1, Math.max(0, (-gx * form[0] + form[1] - gz * form[2]) / l));
      }
      lit[k] = (1 - occ / 8) * turn;
      lit[k + 1] = Math.min(1, Math.max(0, 1.2 * (y0 - (at(i - 3, j) + at(i + 3, j) + at(i, j - 3) + at(i, j + 3)) / 4)));
    }
    if (j % 8 === 7) await ctx.yield();
  }
  const litAt = (x, z) => { const fi = Math.min(nx, Math.max(0, (x + H.hw) / dx)), fj = Math.min(nz, Math.max(0, (H.zS - z) / dz)); return lit[(Math.round(fj) * W + Math.round(fi)) * 2]; };
  // bands along the hall; one band ends at the way in (z 148), so the coin north of it is a band of its own
  const group = new THREE.Group(), jE = Math.round((H.zS - 148) / dz), rows = Math.ceil((nz - jE) / 9), cuts = [0, jE];
  for (let j = jE + rows; j < nz; j += rows) cuts.push(j);
  cuts.push(nz);
  for (let b = 0; b < cuts.length - 1; b++) {
    const j0 = cuts[b], j1 = cuts[b + 1], nr = j1 - j0;
    if (nr <= 0) continue;
    const pos = new Float32Array(W * (nr + 1) * 3), nor = new Float32Array(W * (nr + 1) * 3), cr = new Float32Array(W * (nr + 1)), lt = new Float32Array(W * (nr + 1) * 2), idx = new Uint32Array(nx * nr * 6);
    for (let j = j0; j <= j1; j++) for (let i = 0; i <= nx; i++) {
      const k = (j - j0) * W + i, y = at(i, j);
      pos[k * 3] = -H.hw + i * dx; pos[k * 3 + 1] = y; pos[k * 3 + 2] = H.zS - j * dz;
      const gx = (at(i + 1, j) - at(i - 1, j)) / (2 * dx), gz = -(at(i, j + 1) - at(i, j - 1)) / (2 * dz), l = Math.hypot(gx, gz, 1);
      nor[k * 3] = -gx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = -gz / l;
      cr[k] = crest[j * W + i]; lt[k * 2] = lit[(j * W + i) * 2]; lt[k * 2 + 1] = lit[(j * W + i) * 2 + 1];
    }
    let q = 0;
    for (let j = 0; j < nr; j++) for (let i = 0; i < nx; i++) {
      const a = j * W + i, c = a + W;
      idx[q++] = a; idx[q++] = a + 1; idx[q++] = c; idx[q++] = a + 1; idx[q++] = c + 1; idx[q++] = c;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aCrest', new THREE.BufferAttribute(cr, 1)); g.setAttribute('aLit', new THREE.BufferAttribute(lt, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new THREE.Mesh(g, material); m.name = 'sea'; group.add(m);
    await ctx.yield();
  }
  return { group, Y, W, nx, nz, dx, dz, bil, crest, litAt };
}

// ---------------------------------------------------------------- steel: riveted plate, lit by the hall by place
// A plate 4.8 m by 2.4 m: lapped seams, rows of rivet heads (8 cm at 30 cm pitch), a little rust at the seams.
async function makePlateTexture(ctx, rng) {
  const W = 512, Hh = 256, px = W / 4.8, Z = new Float32Array(W * Hh), rust = new Float32Array(W * Hh);
  const dome = (x, y, cx, cy, r) => { const d = Math.hypot(x - cx, y - cy) / r; return d < 1 ? Math.sqrt(1 - d * d) : 0; };
  for (let j = 0; j < Hh; j++) {
    for (let i = 0; i < W; i++) {
      const x = i / px, y = j / px;
      // the lap: the plate above overlaps the one below along the bottom edge; the next plate along overlaps at the side
      let z = 0.5 * sst(0.2, 0.26, y) + 0.4 * sst(0.2, 0.26, x);
      const rx = (Math.round((x - 0.15) / 0.3) * 0.3) + 0.15, ry = (Math.round((y - 0.15) / 0.3) * 0.3) + 0.15;
      if (y < 0.3) z += 0.9 * dome(x, y, rx, 0.11, 0.04);
      if (x < 0.3) z += 0.9 * dome(x, y, 0.11, ry, 0.04);
      Z[j * W + i] = z;
      rust[j * W + i] = Math.max(sst(0.34, 0.2, y) * sst(0.0, 0.1, y), sst(0.34, 0.2, x)) * (0.35 + 0.65 * rng());
    }
    if (j % 64 === 63) await ctx.yield();
  }
  const data = new Uint8Array(W * Hh * 4);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, zl = Z[j * W + (i + W - 1) % W], zr = Z[j * W + (i + 1) % W], zd = Z[((j + Hh - 1) % Hh) * W + i], zu = Z[((j + 1) % Hh) * W + i];
    const gx = -(zr - zl) * 2.2, gy = -(zu - zd) * 2.2, l = Math.hypot(gx, gy, 1);
    data[k * 4] = Math.round(255 * (0.5 + 0.5 * gx / l)); data[k * 4 + 1] = Math.round(255 * (0.5 + 0.5 * gy / l));
    data[k * 4 + 2] = Math.round(255 * rust[k]); data[k * 4 + 3] = Math.round(255 * Math.min(1, Z[k]));
  }
  const tex = new THREE.DataTexture(data, W, Hh, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

export function makeSteelMaterial(U, plate, HALL_GLSL, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, tPlate: { value: plate }, uRust: { value: new THREE.Color('#7a4a32') }, uPolish: { value: o.polish || 0 } },
    side: o.side ?? THREE.FrontSide, vertexColors: true,
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        #ifdef USE_INSTANCING
          w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vN = normalize(mat3(modelMatrix) * normal);
        #endif
        vW = w.xyz; vUv = uv; vCol = color;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vCol;
      uniform sampler2D tPlate; uniform vec3 uRust; uniform float uPolish;
      ${HALL_GLSL}
      void main() {
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
        // a lattice girder's web: chords and crossed diagonals, the rest open (uv.y above 100 marks a web)
        float web = step(100.0, vUv.y); vec2 lu = vec2(vUv.x, vUv.y - 100.0 * web);
        float bars = max(step(lu.y, 0.14) + step(0.86, lu.y), max(step(abs(fract(lu.x / 1.5 + lu.y) - 0.5), 0.07), step(abs(fract(lu.x / 1.5 - lu.y) - 0.5), 0.07)));
        vec4 t = texture2D(tPlate, vUv / vec2(4.8, 2.4));
        vec3 T = abs(N.z) > 0.7 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
        vec3 B = normalize(cross(N, T)); B *= (B.x + B.y) < 0.0 ? -1.0 : 1.0;
        float pl = (1.0 - web) * (1.0 - uPolish);
        vec3 n = normalize(N + (T * (t.r * 2.0 - 1.0) + B * (t.g * 2.0 - 1.0)) * 0.9 * pl);
        vec3 alb = mix(vCol, uRust * 0.5, t.b * 0.6 * pl);
        vec3 LE = vec3(4.0 - vW.x, 45.0 - vW.y, 0.0); float dE = max(length(LE), 1.0); LE /= dE;
        vec3 LW = vec3(-4.0 - vW.x, 45.0 - vW.y, 0.0); float dW = max(length(LW), 1.0); LW /= dW;
        vec3 E = uStripE * clamp(dot(n, LE), 0.0, 1.0) * (7.0 / (dE + 6.0)) + uStripW * clamp(dot(n, LW), 0.0, 1.0) * (7.0 / (dW + 6.0));
        E += uBounce * (0.75 - 0.45 * n.y) * exp(-max(vW.y - 5.0, 0.0) / 11.0) * 3.6;
        E += uSteel * 2.2 + uLampCol * 0.06 * exp(-abs(vW.y - 21.0) / 7.0);
        // the pool of warm light round each caged lamp: along the catwalks (one at every rib) and along the gallery on the
        // north bulkhead (one at every panel line)
        vec3 lw = vec3(sign(vW.x) * ${(HALL.hw - LAMP.out).toFixed(2)}, ${(HALL.catY + LAMP.up).toFixed(2)}, floor((vW.z - 5.0) / 12.0 + 0.5) * 12.0 + 5.0) - vW;
        vec3 lg = vec3(clamp(floor(vW.x / 6.4 + 0.5), -4.0, 4.0) * 6.4, ${(DOOR.y + 14.7 + LAMP.up).toFixed(2)}, ${(HALL.zN + LAMP.out).toFixed(2)}) - vW;
        E += uLampCol * (1.1 / (1.0 + dot(lw, lw) * 0.4) + 1.1 / (1.0 + dot(lg, lg) * 0.4));
        E += (uStripE + uStripW) * 0.07 * abs(n.z) * smoothstep(-6.0, 30.0, vW.y);
        vec3 dd = vec3(0.0, 12.0, -150.0) - vW; float d2 = dot(dd, dd);
        E += uDoorCol * clamp(dot(n, dd * inversesqrt(max(d2, 1.0))), 0.0, 1.0) * min(1.5, 90.0 / (d2 + 20.0));
        // the sun through the roof strips (the same patches as on the coin), and the warm light off the lit coin under the falls
        E += uKeyCol * (sunAt(vW) * clamp(dot(n, uKeyDir), 0.0, 1.0) * 3.2) + hallWarm(vW) * 4.0;
        float ndv = clamp(dot(n, V), 0.0, 1.0); float fr = 1.0 - ndv; fr = fr * fr * fr * fr * fr;
        float rough = mix(0.42, 0.14, uPolish);
        vec3 f0 = mix(vec3(0.045), vCol, uPolish);
        vec3 col = alb * E * 0.6 * (1.0 - 0.9 * uPolish) + (f0 + (1.0 - f0) * fr * 0.5) * hallSky(vW, reflect(-V, n), rough);
        // the sea's warm light on the end bulkheads, strongest low down
        col += uBounce * abs(N.z) * exp(-max(vW.y - 6.0, 0.0) / 12.0) * 0.22 * (1.0 - web) * (step(vW.z, -148.0) + step(213.0, vW.z));
        col = hallAir(col, vW);
        if (web > 0.5 && bars < 0.5) discard;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// a small builder of flat quads and boxes into one geometry: position, normal, uv in metres, colour
export function makeBag() {
  const P = [], Nn = [], UV = [], C = [], I = [];
  const bag = {
    quad(a, b, c, d, col, uv) {
      // a, b, c, d counter-clockwise seen from the front; uv: [[u,v] x 4] in metres
      const k = P.length / 3, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], l = Math.hypot(n[0], n[1], n[2]) || 1;
      for (const [q, t] of [[a, 0], [b, 1], [c, 2], [d, 3]]) { P.push(q[0], q[1], q[2]); Nn.push(n[0] / l, n[1] / l, n[2] / l); UV.push(uv[t][0], uv[t][1]); C.push(col[0], col[1], col[2]); }
      I.push(k, k + 1, k + 2, k, k + 2, k + 3);
    },
    // an axis box from min to max, all six faces outward
    box(x0, y0, z0, x1, y1, z1, col) {
      const u = (a, b) => [[0, 0], [a, 0], [a, b], [0, b]];
      bag.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, u(z1 - z0, y1 - y0));
      bag.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, u(z1 - z0, y1 - y0));
      bag.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, u(x1 - x0, y1 - y0));
      bag.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, u(x1 - x0, y1 - y0));
      bag.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, u(x1 - x0, z1 - z0));
      bag.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, u(x1 - x0, z1 - z0));
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(UV), 2)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
      g.setIndex(I); g.computeBoundingSphere();
      return g;
    },
    count() { return I.length / 3; },
  };
  return bag;
}
export { makePlateTexture };

// ---------------------------------------------------------------- the hall's shell
export const archY = (x) => HALL.wallH + (HALL.crown - HALL.wallH) * Math.sqrt(Math.max(0, 1 - (x / HALL.hw) ** 2));
const ARCH_X = [-32, -31.6, -30.5, -28.5, -25.5, -22, -18, -14, -10, -6.5, -1.5, 1.5, 6.5, 10, 14, 18, 22, 25.5, 28.5, 30.5, 31.6, 32];
const PLATE = [0.047, 0.07, 0.1], RIB = [0.022, 0.032, 0.046], DARK = [0.024, 0.03, 0.04];
// a plain caged lamp (a well-glass fitting): a short arm from the wall, a cap, the glass jar, four cage bars and a foot
// plate. (x, y, z): the jar's middle; (ax, az): the way from the wall into the hall
export function cagedLamp(bag, glow, x, y, z, ax, az) {
  const r = 0.13, h = 0.22, o = LAMP.out;
  bag.box(Math.min(x, x - ax * o) - 0.03 * Math.abs(az), y + h + 0.06, Math.min(z, z - az * o) - 0.03 * Math.abs(ax), Math.max(x, x - ax * o) + 0.03 * Math.abs(az), y + h + 0.12, Math.max(z, z - az * o) + 0.03 * Math.abs(ax), DARK);
  bag.box(x - 0.19, y + h, z - 0.19, x + 0.19, y + h + 0.07, z + 0.19, DARK);
  glow.box(x - r, y - h, z - r, x + r, y + h, z + r, [1, 1, 1]);
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) bag.box(x + dx * 0.17 - 0.012, y - h - 0.05, z + dz * 0.17 - 0.012, x + dx * 0.17 + 0.012, y + h, z + dz * 0.17 + 0.012, DARK);
  bag.box(x - 0.19, y - h - 0.07, z - 0.19, x + 0.19, y - h - 0.04, z + 0.19, DARK);
}
// the catwalks' lamps: one at every rib on each wall, on the wall over the walkway; none where the coin lies over the
// walkway (the stretch a heap buries stays buried)
export function catwalkLamps(hAt) {
  const out = [];
  for (let z = HALL.zS - 6; z > HALL.zN; z -= HALL.bay) for (const sx of [-1, 1]) if (hAt(sx * 29.7, z) < HALL.catY + 1) out.push([sx * (HALL.hw - LAMP.out), HALL.catY + LAMP.up, z, -sx]);
  return out;
}

export function buildShell(steel, steelWeb, glassMat, o = {}) {
  const H = HALL, L = H.zS - H.zN, bag = makeBag(), web = makeBag(), glass = makeBag(), group = new THREE.Group();
  const arc = [0];
  for (let i = 1; i < ARCH_X.length; i++) arc.push(arc[i - 1] + Math.hypot(ARCH_X[i] - ARCH_X[i - 1], archY(ARCH_X[i]) - archY(ARCH_X[i - 1])));
  // walls and floor
  bag.quad([H.hw, 0, H.zN], [H.hw, 0, H.zS], [H.hw, H.wallH, H.zS], [H.hw, H.wallH, H.zN], PLATE, [[0, 0], [L, 0], [L, H.wallH], [0, H.wallH]]);
  bag.quad([-H.hw, 0, H.zS], [-H.hw, 0, H.zN], [-H.hw, H.wallH, H.zN], [-H.hw, H.wallH, H.zS], PLATE, [[0, 0], [L, 0], [L, H.wallH], [0, H.wallH]]);
  // roof sheeting between the ribs; the two strips of glazing either side of the crown
  for (let i = 0; i < ARCH_X.length - 1; i++) {
    const x0 = ARCH_X[i], x1 = ARCH_X[i + 1], y0 = archY(x0), y1 = archY(x1), glazed = Math.abs(Math.abs((x0 + x1) / 2) - 4) < 1;
    (glazed ? glass : bag).quad([x0, y0, H.zS], [x0, y0, H.zN], [x1, y1, H.zN], [x1, y1, H.zS], PLATE, [[0, arc[i]], [L, arc[i]], [L, arc[i + 1]], [0, arc[i + 1]]]);
  }
  // purlins along the hall
  for (let i = 1; i < ARCH_X.length - 1; i++) { const x = ARCH_X[i], y = archY(x) - 0.32; bag.box(x - 0.14, y - 0.3, H.zN, x + 0.14, y, H.zS, RIB); }
  // wall ribs every 12 m (deep plate girders) and the roof's lattice ribs standing on them
  for (let z = H.zS - 6; z > H.zN; z -= H.bay) {
    for (const s of [-1, 1]) bag.box(s > 0 ? H.hw - 1.3 : -H.hw, 0, z - 0.24, s > 0 ? H.hw : -H.hw + 1.3, H.wallH, z + 0.24, RIB);
    for (let i = 0; i < ARCH_X.length - 1; i++) {
      const x0 = ARCH_X[i], x1 = ARCH_X[i + 1], y0 = archY(x0), y1 = archY(x1);
      const n0 = inward(x0), n1 = inward(x1), D = 1.7;
      const a = [x0, y0, z], b = [x1, y1, z], c = [x1 + n1[0] * D, y1 + n1[1] * D, z], d = [x0 + n0[0] * D, y0 + n0[1] * D, z];
      web.quad(a, b, c, d, RIB, [[arc[i], 100], [arc[i + 1], 100], [arc[i + 1], 101], [arc[i], 101]]);
      // the inner chord's flange
      bag.quad([d[0], d[1], z + 0.2], [d[0], d[1], z - 0.2], [c[0], c[1], z - 0.2], [c[0], c[1], z + 0.2], RIB, [[0, 0], [0.4, 0], [0.4, 3], [0, 3]]);
    }
  }
  // catwalks with a tube rail along each wall at y 21 (never out over the coin); the crane rails on brackets at y 27
  for (const s of [-1, 1]) {
    const xi = s * 29.7, xo = s * 31.4;
    bag.box(Math.min(xi, xo), H.catY - 0.12, H.zN, Math.max(xi, xo), H.catY, H.zS, DARK);
    for (const yy of [0.55, 1.1]) bag.box(xi - 0.05, H.catY + yy - 0.05, H.zN, xi + 0.05, H.catY + yy + 0.05, H.zS, DARK);
    for (let z = H.zS - 1.2; z > H.zN; z -= 2.4) bag.box(xi - 0.045, H.catY, z - 0.045, xi + 0.045, H.catY + 1.1, z + 0.045, DARK);
    const rx = s * 28.6;
    bag.box(rx - 0.3, H.railY - 0.7, H.zN, rx + 0.3, H.railY, H.zS, DARK);
    for (let z = H.zS - 6; z > H.zN; z -= H.bay) bag.box(Math.min(rx, s * 30.4), H.railY - 1.5, z - 0.2, Math.max(rx, s * 30.4), H.railY - 0.7, z + 0.2, DARK);
  }
  // the caged lamps along the catwalks
  if (o.lamps && o.glow) for (const [x, y, z, ax] of o.lamps) cagedLamp(bag, o.glow, x, y, z, ax, 0);
  const shell = new THREE.Mesh(bag.geometry(), steel); shell.name = 'shell'; shell.frustumCulled = false;
  const webs = new THREE.Mesh(web.geometry(), steelWeb); webs.name = 'ribs'; webs.frustumCulled = false;
  const glazing = new THREE.Mesh(glass.geometry(), glassMat); glazing.name = 'glazing'; glazing.frustumCulled = false;
  group.add(shell, webs, glazing);
  // the end bulkheads: flat riveted plate, the north one with the round doorway
  const outline = new THREE.Shape();
  outline.moveTo(-H.hw, 0); outline.lineTo(H.hw, 0);
  for (let i = ARCH_X.length - 1; i >= 0; i--) outline.lineTo(ARCH_X[i], archY(ARCH_X[i]));
  outline.lineTo(-H.hw, 0);
  const south = new THREE.ShapeGeometry(outline, 4), northShape = outline.clone();
  const hole = new THREE.Path(); hole.absarc(DOOR.x, DOOR.y, DOOR.r + 0.25, 0, Math.PI * 2, true); northShape.holes.push(hole);
  const north = new THREE.ShapeGeometry(northShape, 24);
  for (const g of [south, north]) { const n = g.attributes.position.count, col = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.set(PLATE, i * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  const sM = new THREE.Mesh(south, steel); sM.rotation.y = Math.PI; sM.position.z = H.zS; sM.name = 'bulkhead-south';
  const nM = new THREE.Mesh(north, steel); nM.position.z = H.zN; nM.name = 'bulkhead-north';
  group.add(sM, nM);
  return { group, tris: bag.count() + web.count() + glass.count() };
}
// the inward normal of the arch at x (toward the hall's middle)
function inward(x) {
  const e = 0.05, x0 = Math.max(-HALL.hw, x - e), x1 = Math.min(HALL.hw, x + e), dy = archY(x1) - archY(x0), dx = x1 - x0, l = Math.hypot(dx, dy) || 1;
  // the tangent turned to point down and in
  let nx = dy / l, ny = -dx / l;
  if (Math.abs(x) > HALL.hw - 0.2) { nx = -Math.sign(x); ny = 0; }
  return [nx, ny];
}

export function makeGlassMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fragmentShader: /* glsl */`varying vec3 vW; uniform vec3 uStripE, uStripW;
      void main() {
        // mullions: a transom every 3 m, two bars along the strip
        float bz = smoothstep(0.04, 0.09, abs(fract(vW.z / 3.0) - 0.5));
        float bx = smoothstep(0.05, 0.12, abs(fract((abs(vW.x) - 1.5) / 1.6667) - 0.5));
        vec3 c = (vW.x > 0.0 ? uStripE : uStripW) * 0.36;
        gl_FragColor = vec4(c * mix(0.06, 1.0, min(1.0 - (1.0 - bz) , 1.0) * mix(0.1, 1.0, bx) + 0.0), 1.0);
      }`,
  });
}

// ---------------------------------------------------------------- the hero: hall, sea, falls, sink, door
// opts: { coins (the coin module), route (places of the flown line), path, hour, forks, stream (a named stream of
// the seed), detail, density, rare }
export async function buildHero(ctx, opts = {}) {
  const C = opts.coins, F = opts.forks, St = opts.stream, object = new THREE.Group(), updaters = [];
  const U = C.makeHallUniforms(opts.hour, { sunDay: SUN_DAY, grabX: GRAB.x });
  const sea = makeSea(ctx.core, ctx.seed, opts.route);
  await ctx.yield();
  // the gold's tone between red-gold and pale gold, and a share of silver (up to one coin in twelve on some seeds)
  const tone = F.tone(), gold = new THREE.Color().setRGB(1.0, lerp(0.62, 0.72, tone), lerp(0.2, 0.3, tone));
  const silverOn = F.tone() < 0.4, silverShare = F.tone() * 0.083 * (silverOn ? 1 : 0);
  const tabs = C.makeReliefTables(64);
  await ctx.yield();
  const pack = await C.makePackTexture(ctx, F.pack, tabs, 512);
  const faceTex = C.makeCoinFaceTexture(tabs);
  await ctx.yield();
  // the rare visit's silver fan lies on a seeded dune of the flown hall: one draw picks the ridge among those whose crest
  // lines, with the fan on their backs, lie whole between the entry and the door, a second a point along it; it lies
  // on the ridge's long back, half the ridge's height from its crest and as wide
  const inHall = sea.ridges.filter((r) => r.z + r.a + r.H < ENTRY.z && r.z - r.a - r.H > HALL.zN), fanOf = inHall.length ? inHall : sea.ridges;
  const fr = fanOf[Math.min(fanOf.length - 1, Math.floor(F.rare() * fanOf.length))], fanX = F.rare.range(-HALL.hw + 10, HALL.hw - 10);
  const fan = new THREE.Vector4(fanX, fr.z + fr.a * Math.sin(fanX * fr.k + fr.ph) + (fr.south ? -1 : 1) * fr.H * 0.5, fr.H * 0.5, opts.rare ? 1 : 0);
  const skin = C.makeSkinMaterial(U, faceTex, { gold, silver: new THREE.Color().setRGB(0.92, 0.93, 0.95), silverShare, sink: SINK, fan, arm: St('sink-arms')() * 6.2832 });
  // (r6) the way to the hall's light that the sea's faces are told apart by, the same at every hour: the sky's light as
  // it comes down the hall from the door's end, 38 degrees from overhead and square to the hall (so the two banks of
  // the line's own trough stand alike: with any light from a side one bank stood lit and one in shade, a hard straight
  // line under the flight). A dune's face toward the way in stands in shade, its top and its back in the light
  const formDir = [0, 0.783, -0.622];
  const seaMesh = await buildSeaMesh(ctx, sea, skin, 0.8, formDir);
  object.add(seaMesh.group);
  const plate = await makePlateTexture(ctx, F.plate);
  const steel = makeSteelMaterial(U, plate, C.HALL_GLSL), steelWeb = makeSteelMaterial(U, plate, C.HALL_GLSL, { side: THREE.DoubleSide });
  const glassMat = makeGlassMaterial(U);
  const S = seaMesh, hAt = (x, z) => S.bil((x + HALL.hw) / S.dx, (HALL.zS - z) / S.dz);
  // the lamps' glass: one mesh for every caged lamp of the hall, lit warm at every hour (brighter at night)
  const glow = makeBag(), lampAt = catwalkLamps(hAt);
  const shell = buildShell(steel, steelWeb, glassMat, { lamps: lampAt, glow });
  object.add(shell.group);
  await ctx.yield();
  const parts = { U, sea, seaMesh, pack, faceTex, gold, silverShare, steel, steelWeb, plate, tabs, object, updaters };
  // ---- the falls: six spouts pouring always, and the last fall's curtain from a slotted trough on the axis
  const coinO = { gold, silver: new THREE.Color().setRGB(0.92, 0.93, 0.95), silverShare };
  const fallMat = C.makeFallMaterial(U, faceTex, { ...coinO, v0: 2 }), curtMat = C.makeFallMaterial(U, faceTex, { ...coinO, v0: 2 });
  const k = (opts.detail ?? 1) * Math.min(1.15, opts.density ?? 1), bag = makeBag();
  // where each spout's flowing body stands in its own run is dealt by a stream of the bodies: one draw a spout
  const bodies = St('bodies');
  // how a fall is drawn is fixed here, by place: a fall the line passes within 8 m of is all real discs, many of them,
  // and nothing else; the others stand off, carry fewer discs and a flowing body behind them
  const flown = opts.route.filter((p) => p[5] > 0);
  const lineDist = (x, z) => { let m = 1e9; for (const p of flown) { const d = Math.hypot(p[0] - x, p[2] - z); if (d < m) m = d; } return m; };
  for (let i = 0; i < sea.spouts.length; i++) {
    const sp = sea.spouts[i], mouth = [sp.x, 24.4, sp.z], first = i === 0, foot = hAt(sp.x, sp.z) - 0.3, close = lineDist(sp.x, sp.z) < 8, seed = bodies();
    const f = await buildFall(ctx, C, parts, { mouth, r: first ? 1.4 : 1.0, fan: first ? 0.42 : 0.75, count: Math.round((close ? 12000 : 2600) * k), rng: St('fall-' + i), material: fallMat });
    object.add(f.mesh);
    if (!close) {
      const sm = C.makeSheetMaterial(U, pack, { gold, speed: 10, seed, top: 1.0, bottom: 0.75, height: 24.4 - foot, half: 2.1 });
      object.add(buildSheets(parts, { mouth, foot, half: 2.1, turn: 0.3 + i, material: sm }));
    }
    // the spout: a riveted square pipe down from the haunch to a nozzle, as on a grain elevator
    const sgn = sp.side, x0 = sgn * 30.6, y0 = 27.6, x1 = sp.x, y1 = 25.6, w0 = 0.95, w1 = 0.8, z = sp.z;
    const A = (x, y, w, dz, dy) => [x, y + dy * w, z + dz * w];
    for (const [dz, dy, dz2, dy2] of [[-1, 1, 1, 1], [1, -1, -1, -1], [1, 1, 1, -1], [-1, -1, -1, 1]]) {
      const a = A(x0, y0, w0, dz, dy), b2 = A(x1, y1, w1, dz, dy), c2 = A(x1, y1, w1, dz2, dy2), d = A(x0, y0, w0, dz2, dy2);
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (sgn > 0) bag.quad(a, d, c2, b2, PLATE, [[0, 0], [1.9, 0], [1.9, len], [0, len]]); else bag.quad(a, b2, c2, d, PLATE, [[0, 0], [0, len], [1.9, len], [1.9, 0]]);
    }
    const nw = first ? 1.6 : 1.1;
    bag.box(x1 - nw, 24.4, z - nw, x1 + nw, 26.5, z + nw, PLATE);
    bag.box(x1 - nw - 0.15, 24.3, z - nw - 0.15, x1 + nw + 0.15, 24.55, z + nw + 0.15, RIB);
    await ctx.yield();
  }
  {
    // the last fall's curtain: real discs alone, the whole sheet of them (the line passes 1.5 m behind it)
    const Cc = CURTAIN;
    const f = await buildFall(ctx, C, parts, { curtain: true, mouth: [Cc.x, Cc.y - 0.1, 0], z0: Cc.z0, z1: Cc.z1, thick: 1.0, count: Math.round(24000 * k), rng: St('curtain'), material: curtMat, v0: 2 });
    object.add(f.mesh);
    // the slotted trough under the roof, hung on rods from the ribs
    bag.box(Cc.x - 0.9, Cc.y, Cc.z0 - 0.6, Cc.x + 0.9, Cc.y + 1.3, Cc.z1 + 0.6, PLATE);
    bag.box(Cc.x - 1.05, Cc.y - 0.12, Cc.z0 - 0.7, Cc.x + 1.05, Cc.y + 0.1, Cc.z1 + 0.7, RIB);
    for (const z of [Cc.z0 + 1, (Cc.z0 + Cc.z1) / 2, Cc.z1 - 1]) for (const x of [Cc.x - 0.8, Cc.x + 0.8]) bag.box(x - 0.06, Cc.y + 1.3, z - 0.06, x + 0.06, archY(x) - 0.3, z + 0.06, DARK);
  }
  const works = new THREE.Mesh(bag.geometry(), steel); works.name = 'spouts'; works.frustumCulled = false; object.add(works);
  await ctx.yield();
  // ---- real coins lying near the route
  const lyingMat = C.makeLyingMaterial(U, faceTex, coinO);
  const lying = await buildLying(ctx, C, parts, { stream: St, route: flown, count: Math.round(40000 * k), material: lyingMat });
  object.add(lying.group);
  // ---- slips: tongues of real discs down the steepest faces along the line; and real discs circling down the sink
  {
    const sites = await findSlips(hAt, flown, sea, F.slips, ctx);
    await ctx.yield();
    const slipMat = C.makeSlipMaterial(U, faceTex, coinO);
    const slips = await buildSlips(ctx, C, parts, { sites, hAt, stream: St, per: Math.round(2200 * k), material: slipMat });
    object.add(slips.group);
    for (let i = 0; i < 4; i++) {
      const t = sites[i];
      if (t) { skin.uniforms.uSlipA.value[i].set(t.x, t.z, t.dx, t.dz); skin.uniforms.uSlipB.value[i].set(t.len, t.hw, t.period, t.offset); }
      else skin.uniforms.uSlipB.value[i].set(0, 1, 8, 0);
    }
    parts.slips = sites;
    await ctx.yield();
    const sinkMat = C.makeSinkDiscMaterial(U, faceTex, { ...coinO, sink: SINK });
    const sd = buildSinkDiscs(C, { rng: St('sink'), count: Math.round(14000 * k), material: sinkMat });
    object.add(sd.mesh);
    await ctx.yield();
  }
  // ---- the round door, the crane, the ports, the dust at the feet of the first fall and the curtain
  const polished = makeSteelMaterial(U, plate, C.HALL_GLSL, { polish: 0.72, side: THREE.DoubleSide });
  object.add(buildDoor(steel, polished));
  // THE SPRINGBOARD on its diving tower, one only, and THE DEPTH SCALES: (r6) one as a gauge staff standing in the
  // coin of the entry trough's east bank, its face to the way in; one on the north bulkhead beside the round door's ring
  {
    const at = towerPlace(flown), sb = buildSpringboard(steel, steelWeb, at, hAt, St('board'));
    object.add(sb.group); updaters.push(sb.update);
    const sc = makeBag(), staff = staffPlace(), sy = hAt(staff.x - staff.ax * 3.5, staff.z - staff.az * 3.5) - 1;
    depthScale(sc, staff.x, staff.z, staff.ax, staff.az);
    // its back: two round posts behind the strip's edges, a cap, one raking stay down into the coin behind it
    for (const sgn of [-1, 1]) tube(sc, [staff.x - staff.ax * 0.1 + staff.az * sgn * 0.5, 0, staff.z - staff.az * 0.1 - staff.ax * sgn * 0.5], [staff.x - staff.ax * 0.1 + staff.az * sgn * 0.5, HALL.wallH + 0.25, staff.z - staff.az * 0.1 - staff.ax * sgn * 0.5], 0.09, [0.62, 0.65, 0.69], 8);
    tube(sc, [staff.x - staff.ax * 0.1 + staff.az * 0.62, HALL.wallH + 0.2, staff.z - staff.az * 0.1 - staff.ax * 0.62], [staff.x - staff.ax * 0.1 - staff.az * 0.62, HALL.wallH + 0.2, staff.z - staff.az * 0.1 + staff.ax * 0.62], 0.09, [0.62, 0.65, 0.69], 8);
    tube(sc, [staff.x - staff.ax * 0.15, 12, staff.z - staff.az * 0.15], [staff.x - staff.ax * 3.5, sy, staff.z - staff.az * 3.5], 0.07, [0.62, 0.65, 0.69], 6);
    depthScale(sc, DOOR.x + SCALE.door, HALL.zN, 0, 1);
    const scales = new THREE.Mesh(sc.geometry(), steelWeb); scales.name = 'depth-scales'; scales.frustumCulled = false; object.add(scales);
    parts.tower = { at, staff, tris: sb.tris, scaleTris: sc.count() };
  }
  // THE CRANE'S BRIDGE STANDS STILL, quiet background, at a place the seed deals (the crane stream's first draw) inside
  // the stretches of the hall where it can stand: every z at which the whole flown line lies 14 m and more from its two
  // girders (y 27.3 to 29.3, 2.1 m either side of the bridge's middle) and nothing else stands at the rails' height (a
  // spout's pipe 7 m either side, the curtain's trough, the door's gallery), north of the entry plane; stretches under
  // 20 m do not count. If none is left it stands at the south end stop behind the entry.
  const gY0 = GRAB.y - 2, gY1 = GRAB.y, gHalf = 2.1;
  const quiet = (zc) => zc <= ENTRY.z - gHalf && zc >= HALL.zN + 8 && (zc > CURTAIN.z1 + 7 || zc < CURTAIN.z0 - 7) && sea.spouts.every((sp) => Math.abs(sp.z - zc) >= 7)
    && flown.every((p) => Math.hypot(Math.max(0, Math.abs(p[2] - zc) - gHalf), Math.max(0, gY0 - p[1], p[1] - gY1)) >= 14);
  const runs = []; let run = null;
  for (let zc = HALL.zS - 4; zc >= HALL.zN + 4; zc -= 0.5) { if (quiet(zc)) { if (run) run[1] = zc; else run = [zc, zc]; } else if (run) { runs.push(run); run = null; } }
  if (run) runs.push(run);
  // (r6) of those stretches it takes the ones north of the sink where there are any (before the round door, where it
  // stands across the end of the hall in the wide view and gives the end wall its depth); behind the entry, where it
  // stood on more than half the seeds, it was seldom seen
  const all = runs.filter((r) => r[0] - r[1] >= 20), north = all.filter((r) => r[0] < SINK.z - SINK.rim), stands = north.length ? north : all, total = stands.reduce((a, r) => a + r[0] - r[1], 0);
  const craneAt = (u) => { let t = u * total; for (const r of stands) { if (t <= r[0] - r[1]) return r[0] - t; t -= r[0] - r[1]; } return HALL.zS - 4; };
  // the grab's thread of coin ends under the coin by place: 1 m below the coin under the grab where the bridge stands
  const crane = buildCrane(steelWeb, F.crane, { C, material: fallMat, count: Math.round(1500 * k), discRng: St('grab'), place: craneAt, low: (zc) => Math.min(hAt(GRAB.x, zc - 1), hAt(GRAB.x, zc), hAt(GRAB.x, zc + 1)) });
  object.add(crane.group); updaters.push(crane.update);
  parts.crane = { z: crane.group.position.z, stands };
  // the bridge's shadow lies where the bridge stands
  U.uSun.value.z = crane.group.position.z;
  // the three round ports high in the east wall, each in the middle of a wall bay: the glass sits at the back of a deep
  // frame of plate standing 0.7 m proud of the wall, riveted round its face, with a steel ring round the glass; they
  // throw no beam
  const portMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(U.uStripE.value.x * 0.1, U.uStripE.value.y * 0.1, U.uStripE.value.z * 0.1) });
  const portZ = [F.crane.range(60, 100), F.crane.range(-20, 20), F.crane.range(-110, -60)].map((z) => Math.round((z - 11) / HALL.bay) * HALL.bay + 11);
  const ringG = new THREE.TorusGeometry(0.88, 0.13, 8, 28); ringG.rotateY(Math.PI / 2);
  const fb = makeBag();
  for (const z of portZ) {
    const y = PORT.y, a = PORT.half, b = PORT.open, x1 = HALL.hw, x0 = x1 - PORT.deep;
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), portMat); d.rotation.y = -Math.PI / 2; d.position.set(x1 - 0.03, y, z); d.name = 'port'; object.add(d);
    const ring = new THREE.Mesh(ringG, steel); ring.position.set(x1 - 0.1, y, z); ring.name = 'port-ring'; object.add(ring);
    fb.box(x0, y + b, z - a, x1, y + a, z + a, PLATE); fb.box(x0, y - a, z - a, x1, y - b, z + a, PLATE);
    fb.box(x0, y - b, z - a, x1, y + b, z - b, PLATE); fb.box(x0, y - b, z + b, x1, y + b, z + a, PLATE);
    // rivet heads round the frame's face, five a side
    for (let i = 0; i < 5; i++) {
      const t = -a + 0.15 + i * (2 * a - 0.3) / 4, e = (a + b) / 2;
      for (const [py, pz] of [[y + e, z + t], [y - e, z + t], [y + t, z + e], [y + t, z - e]]) fb.box(x0 - 0.035, py - 0.045, pz - 0.045, x0, py + 0.045, pz + 0.045, RIB);
    }
  }
  const frames = new THREE.Mesh(fb.geometry(), steel); frames.name = 'port-frames'; object.add(frames);
  // the end wall's dress: the gallery over the door with a row of the same caged lamps; then all the lamps' glass
  object.add(buildDress(steel, glow));
  const lampMat = new THREE.MeshBasicMaterial({ color: opts.hour === 'night' ? new THREE.Color().setRGB(4.6, 3.3, 1.6) : new THREE.Color().setRGB(4.0, 2.7, 1.1) });
  const glass = new THREE.Mesh(glow.geometry(), lampMat); glass.name = 'lamp-glass'; glass.frustumCulled = false; object.add(glass);
  await ctx.yield();
  {
    // the warm light the lit coin throws back under a fall: the three falls nearest the line carry it, a fall the
    // line passes within 8 m of more strongly
    const cm = (CURTAIN.z0 + CURTAIN.z1) / 2, feet = [...sea.spouts.map((sp) => [sp.x, sp.z]), [CURTAIN.x, cm]].map(([x, z]) => [x, z, lineDist(x, z)]).sort((a, b) => a[2] - b[2]);
    for (let i = 0; i < 3; i++) U.uWarm.value[i].set(feet[i][0], hAt(feet[i][0], feet[i][1]) + 1.5, feet[i][1], feet[i][2] < 8 ? 0.5 : 0.35);
  }
  if (opts.fx) {
    const fx = opts.fx, time = U.uTime;
    {
      // a small warm halo round every caged lamp: along the catwalks and along the gallery over the door
      const lp = [...lampAt.map(([x, y, z]) => [x, y, z]), ...DRESS.lamps.map((x) => [x, DRESS.lampY, HALL.zN + LAMP.out])];
      const lamps = fx.makeGlows({ rng: St('lamps'), positions: lp, color: '#ffc27a', size: opts.hour === 'night' ? 1.8 : 1.5, intensity: opts.hour === 'night' ? 2.6 : 1.9, time });
      object.add(lamps.object); updaters.push((dt, t, cam) => lamps.update(dt, t, cam));
    }
    const f0 = sea.spouts[0], cm = (CURTAIN.z0 + CURTAIN.z1) / 2;
    for (const [c, box, rng] of [[[f0.x, hAt(f0.x, f0.z) + 2, f0.z], [9, 5, 9], F.dust], [[CURTAIN.x, hAt(CURTAIN.x, cm) + 2, cm], [5, 6, CURTAIN.z1 - CURTAIN.z0 + 2], St('dust-curtain')]]) {
      const dust = fx.makeParticles({ rng, preset: 'dust', follow: false, center: c, box, count: Math.round(420 * (opts.detail ?? 1)), size: [0.012, 0.035], colors: ['#ffe9a6', '#d9a62e', '#ffd070'], intensity: 1.1, time });
      object.add(dust.object); updaters.push((dt, t, cam) => dust.update(dt, t, cam));
    }
  }
  if (opts.more) await opts.more(parts);
  return {
    object, radius: 190, height: 46, center: new THREE.Vector3(0, 12, 30), anchors: { door: new THREE.Vector3(DOOR.x, DOOR.y, DOOR.z) },
    sea, U, parts, fall: { x: sea.spouts[0].x, y: hAt(sea.spouts[0].x, sea.spouts[0].z), z: sea.spouts[0].z },
    update(dt, time, camera) { U.uTime.value = time; for (const f of updaters) f(dt, time, camera); },
    dispose() { pack.dispose(); faceTex.dispose(); plate.dispose(); },
    ground: false,
  };
}

// ---------------------------------------------------------------- falls: real discs on the clock, sheets behind them
// o: { curtain, mouth [x,y,z], r, z0, z1, thick, count, fan, v0, rng }
export async function buildFall(ctx, C, P, o) {
  const n = o.count, rng = o.rng, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4), aD = new Float32Array(n * 4);
  const S = P.seaMesh, hAt = (x, z) => S.bil((x + HALL.hw) / S.dx, (HALL.zS - z) / S.dz), v0 = o.v0 ?? 2, my = o.mouth[1];
  for (let i = 0; i < n; i++) {
    let sx, sz, vx, vz;
    if (o.curtain) { const t = (rng() + rng() + rng()) * 2 / 3 - 1; sx = o.mouth[0] + (rng() - 0.5) * o.thick * (1 - 0.7 * t * t); sz = (o.z0 + o.z1) / 2 + t * (o.z1 - o.z0) * 0.53; vx = (rng() - 0.5) * 0.16; vz = (rng() - 0.5) * 0.6; }
    else { const a = rng() * 6.2832, rr = o.r * Math.sqrt(rng()), sp = o.fan * (0.25 + rr / o.r) * (0.6 + 0.8 * rng()); sx = o.mouth[0] + rr * Math.cos(a); sz = o.mouth[2] + rr * Math.sin(a); vx = Math.cos(a) * sp; vz = Math.sin(a) * sp; }
    let t = 1.6;
    for (let k = 0; k < 4; k++) { const drop = Math.max(0.2, my - hAt(sx + vx * t, sz + vz * t)); t = (-v0 + Math.sqrt(v0 * v0 + 19.6 * drop)) / 9.8; }
    const lx = sx + vx * t, lz = sz + vz * t;
    const gx = (hAt(lx + 0.5, lz) - hAt(lx - 0.5, lz)), gz = (hAt(lx, lz + 0.5) - hAt(lx, lz - 0.5)), g = Math.hypot(gx, gz), slope = Math.min(0.7, g);
    const ra = rng() * 6.2832, dxr = g > 0.03 ? -gx / g : Math.cos(ra), dzr = g > 0.03 ? -gz / g : Math.sin(ra);
    const dist = slope > 0.25 ? 0.5 + 3.2 * rng() * rng() : 0.15 + 0.6 * rng();
    aA.set([sx, my, sz, rng()], i * 4); aB.set([vx, vz, t, 0.5 + dist * 0.5], i * 4); aC.set([dxr, dzr, slope, dist], i * 4);
    aD.set([rng(), (6 + 6 * rng()) * (rng() < 0.5 ? -1 : 1), 0.94 + 0.12 * rng(), 0.03 + 0.12 * rng() * rng()], i * 4);
    if (i % 2000 === 1999) await ctx.yield();
  }
  const g = new THREE.InstancedBufferGeometry().copy(C.makeDiscGeometry());
  for (const [name, arr] of [['aA', aA], ['aB', aB], ['aC', aC], ['aD', aD]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
  g.instanceCount = n;
  const cz = o.curtain ? (o.z0 + o.z1) / 2 : o.mouth[2], rad = o.curtain ? 16 : 14;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(o.mouth[0], my - 10, cz), rad);
  const mesh = new THREE.Mesh(g, o.material); mesh.name = 'fall-discs';
  return { mesh };
}

// the flowing body of a fall that stands off from the line: three upright quads through the cone fall's axis
export function buildSheets(P, o) {
  const bag = makeBag(), W = [0, 0, 0], top = o.mouth[1], foot = o.foot;
  for (let k = 0; k < 3; k++) {
    const a = o.turn + k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a), hw = o.half, mx = o.mouth[0], mz = o.mouth[2];
    bag.quad([mx - c * hw, foot, mz - s * hw], [mx + c * hw, foot, mz + s * hw], [mx + c * hw, top, mz + s * hw], [mx - c * hw, top, mz - s * hw], W, [[-hw, top - foot], [hw, top - foot], [hw, 0], [-hw, 0]]);
  }
  const mesh = new THREE.Mesh(bag.geometry(), o.material); mesh.name = 'fall-sheets';
  return mesh;
}

// coins lying on the sea beside the line: real discs (15 cm) at every tilt, some on edge, in sixteen bands of equal
// length along the line. A band's share of the discs follows how near the line passes over the coin there (as one over
// the square of the clear height, taken at the deepest the line's own trough is cut and more): the entry trough and
// the door's end hold most and alike, the high level few. Where the coin stands beside the line (the long dune's face
// in the entry trough) more lie on that side.
// Every band is drawn at every distance; each band has a stream of its own (o.stream).
export async function buildLying(ctx, C, P, o) {
  const S = P.seaMesh, hAt = (x, z) => S.bil((x + HALL.hw) / S.dx, (HALL.zS - z) / S.dz), route = o.route, n = o.count;
  const geo = C.makeDiscGeometry(), group = new THREE.Group(), NB = 16, ranges = [];
  let sum = 0, cut = 0;
  for (const p of route) cut = Math.max(cut, p[4]);
  for (let b = 0; b < NB; b++) {
    const i0 = Math.floor(route.length * b / NB), i1 = Math.max(i0 + 1, Math.floor(route.length * (b + 1) / NB)); let c = 0;
    for (let i = i0; i < i1; i++) c += Math.max(cut, route[i][1] - hAt(route[i][0], route[i][2]));
    const w = 1 / ((c / (i1 - i0)) ** 2); sum += w; ranges.push([i0, i1, w, route[i0][2] > ENTRY.end]);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), nrm = new THREE.Vector3(), axis = new THREE.Vector3(), pos = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), q2 = new THREE.Quaternion();
  for (let b = 0; b < ranges.length; b++) {
    const [i0, i1, w, near] = ranges[b], rng = o.stream('lying-' + b), per = Math.max(1, Math.round(n * w / sum));
    const mesh = new THREE.InstancedMesh(geo, o.material, per), ids = new Float32Array(per), opn = new Float32Array(per);
    for (let i = 0; i < per; i++) {
      const p = route[i0 + Math.floor(rng() * (i1 - i0))], u = rng(), side = rng() < (near ? 0.64 : 0.5) ? -1 : 1;
      // (r6) they lie right up to the line's own foot (a bare strip 0.4 m wide under the line, with the thickest of
      // them either side of it, stood as a hard straight seam down the trough)
      const d = (near ? 8.7 * Math.pow(u, 1.25) : 10 * Math.pow(u, 1.5)) * side, along = (rng() - 0.5) * 2.2;
      const x = Math.max(-31.5, Math.min(31.5, p[0] + d)), z = p[2] + along, y = hAt(x, z);
      nrm.set(-(hAt(x + 0.4, z) - hAt(x - 0.4, z)) / 0.8, 1, -(hAt(x, z + 0.4) - hAt(x, z - 0.4)) / 0.8).normalize();
      const pick = rng(), tilt = pick < 0.72 ? rng() * 0.36 : pick < 0.93 ? 0.36 + rng() * 0.5 : 1.2 + rng() * 0.35, az = rng() * 6.2832;
      axis.set(Math.cos(az), 0, Math.sin(az)); q.setFromUnitVectors(Y, nrm); q2.setFromAxisAngle(axis, tilt); q.multiply(q2);
      const size = C.COIN_R * (0.94 + 0.12 * rng());
      pos.set(x, y + 0.012 + size * Math.sin(tilt) * 0.7, z); sc.set(size, size, size);
      m4.compose(pos, q, sc); mesh.setMatrixAt(i, m4); ids[i] = rng(); opn[i] = sst(0.45, 0.95, S.litAt(x, z));
      if (i % 700 === 699) await ctx.yield();
    }
    mesh.geometry = geo.clone(); mesh.geometry.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1));
    mesh.geometry.setAttribute('aOpen', new THREE.InstancedBufferAttribute(opn, 1));
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.name = 'lying-coins';
    group.add(mesh);
    await ctx.yield();
  }
  return { group };
}

// ---------------------------------------------------------------- slips: tongues of real discs beside the line
// Where: every steep face along the whole line is a candidate by tests in space alone: at the angle of rest for 5.5 m
// and more (the lowest 11 m of a longer face), its middle 5.5 to 15.5 m from the line, its lip 4 m and its foot 3 m
// and more from it, clear of the sink and of the spouts' cones. Four carry real discs: the tallest faces in order, no
// two within four bays of the hall of each other. Each has its own period and place in the world's clock, dealt by the
// seed; its coin breaks away through most of the period, thickest at its start, so a slip is never bare, and lies a
// few seconds in the fan before it goes under.
// hAt(x, z): the built surface. flown: the line's places every 2 m. Returns up to four { x, y, z (the lip), dx, dz (the
// way down), len, hw, period, offset }.
export async function findSlips(hAt, flown, sea, rng, ctx) {
  // every slip's width, period and place in the clock are dealt first, whatever faces are found
  const deal = []; for (let i = 0; i < 4; i++) deal.push([rng(), rng(), rng()]);
  const lineAt = (z) => {
    let i = 0; while (i < flown.length - 2 && flown[i + 1][2] > z) i++;
    const a = flown[i], b = flown[i + 1], t = Math.min(1, Math.max(0, (a[2] - z) / Math.max(1e-6, a[2] - b[2])));
    return lerp(a[0], b[0], t);
  };
  const toLine = (x, z) => { let m = 1e9; for (const p of flown) { const d = Math.hypot(p[0] - x, p[2] - z); if (d < m) m = d; } return m; };
  const grad = (x, z) => [(hAt(x + 0.6, z) - hAt(x - 0.6, z)) / 1.2, (hAt(x, z + 0.6) - hAt(x, z - 0.6)) / 1.2];
  const clearOf = (x, z) => Math.hypot(x - SINK.x, z - SINK.z) > SINK.rim + 3 && Math.abs(x) < 29 && sea.spouts.every((sp) => Math.hypot(x - sp.x, z - sp.z) > 6.5);
  const cands = []; let row = 0;
  for (let z = flown[0][2]; z >= flown[flown.length - 1][2]; z -= 2) {
    const lx = lineAt(z);
    for (let off = -15.5; off <= 15.5; off += 1.5) {
      if (Math.abs(off) < 4.5) continue;
      const x = lx + off;
      if (!clearOf(x, z)) continue;
      const [gx, gz] = grad(x, z), g = Math.hypot(gx, gz); if (g < 0.42) continue;
      // up to the lip, then down to the foot
      let ux = x, uz = z;
      for (let k = 0; k < 26; k++) { const [ax, az] = grad(ux, uz), a = Math.hypot(ax, az); if (a < 0.36) break; ux += ax / a * 0.5; uz += az / a * 0.5; }
      let fx = ux, fz = uz;
      for (let k = 0; k < 44; k++) { const [ax, az] = grad(fx, fz), a = Math.hypot(ax, az); if (a < 0.22 && k > 3) break; fx -= ax / Math.max(a, 1e-3) * 0.5; fz -= az / Math.max(a, 1e-3) * 0.5; }
      let len = Math.hypot(fx - ux, fz - uz); if (len < 5.5) continue;
      const dx = (fx - ux) / len, dz = (fz - uz) / len, tall = hAt(ux, uz) - hAt(fx, fz);
      if (len > 11) { ux = fx - dx * 11; uz = fz - dz * 11; len = 11; }
      const y0 = hAt(ux, uz), y1 = hAt(fx, fz), fall = (y0 - y1) / len; if (fall < 0.36) continue;
      const mx = (ux + fx) / 2, mz = (uz + fz) / 2, lat = toLine(mx, mz);
      if (lat < 5.5 || lat > 15.5 || !clearOf(ux, uz) || !clearOf(fx, fz) || !clearOf(fx + dx * 3, fz + dz * 3)) continue;
      if (toLine(fx, fz) < 3 || toLine(ux, uz) < 4) continue;
      cands.push({ x: ux, y: y0, z: uz, dx, dz, len, mx, mz, tall });
    }
    if (ctx && ++row % 10 === 0) await ctx.yield();
  }
  cands.sort((a, b) => b.tall - a.tall);
  const picked = [], apart = 4 * HALL.bay;
  for (const c of cands) { if (picked.length < 4 && picked.every((q) => Math.hypot(c.mx - q.mx, c.mz - q.mz) > apart)) picked.push(c); }
  picked.forEach((t, i) => { t.hw = 1.5 + 0.75 * deal[i][0]; t.period = 8 + 2.5 * deal[i][1]; t.offset = deal[i][2] * t.period; });
  return picked;
}

// the discs of the slips: one mesh a slip, 1000 times the detail for every 10 m of face, drawn at every distance; each
// slip's discs come from a stream of their own (o.stream)
export async function buildSlips(ctx, C, P, o) {
  const group = new THREE.Group(), hAt = o.hAt;
  // the cubic of each disc's own course on the face: through its start and its resting place, the two free numbers by
  // least squares at five places between (one matrix for all)
  const F5 = [1, 2, 3, 4, 5].map((j) => j / 6); let g00 = 0, g01 = 0, g11 = 0;
  for (const f of F5) { const u = f - f * f * f, v = f * f - f * f * f; g00 += u * u; g01 += u * v; g11 += v * v; }
  const gd = g00 * g11 - g01 * g01;
  for (let si = 0; si < o.sites.length; si++) {
    const t = o.sites[si], rng = o.stream('slip-' + si);
    const n = Math.min(Math.round(o.per * 1.6), Math.round(o.per * t.len / 10)), px = -t.dz, pz = t.dx;
    const aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4), aD = new Float32Array(n * 4), aP = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const w0 = (rng() + rng() - 1) * t.hw, s0 = t.len * 0.42 * Math.pow(rng(), 1.6), s1 = t.len * (0.86 + 0.2 * rng()) + 2.6 * rng();
      const run = s1 - s0, drift = w0 * (0.5 + 1.2 * rng());
      const x0 = t.x + t.dx * s0 + px * w0, z0 = t.z + t.dz * s0 + pz * w0, y0 = hAt(x0, z0);
      const D = hAt(x0 + t.dx * run + px * drift, z0 + t.dz * run + pz * drift) - y0; let r0 = 0, r1 = 0;
      for (const f of F5) { const f3 = f * f * f, y = hAt(x0 + t.dx * run * f + px * drift * f * f, z0 + t.dz * run * f + pz * drift * f * f) - y0 - D * f3; r0 += y * (f - f3); r1 += y * (f * f - f3); }
      const ca = (g11 * r0 - g01 * r1) / gd, cb = (g00 * r1 - g01 * r0) / gd, cc = D - ca - cb;
      const T = Math.min(t.period - 3.2, 1.4 + run * 0.24 + 0.5 * rng());
      aA.set([x0, y0, z0, t.offset + t.period * 0.8 * Math.pow(rng(), 1.3)], i * 4); aB.set([t.dx * run, t.dz * run, px * drift, pz * drift], i * 4);
      aC.set([ca, cb, cc, T], i * 4);
      aD.set([rng(), Math.max(2, Math.round(run * (0.6 + 0.6 * rng()))) * (rng() < 0.5 ? -1 : 1), 0.94 + 0.12 * rng(), 0.012 + 0.03 * rng() * rng()], i * 4);
      aP[i] = t.period;
      if (i % 500 === 499) await ctx.yield();
    }
    const g = new THREE.InstancedBufferGeometry().copy(C.makeDiscGeometry());
    for (const [name, arr] of [['aA', aA], ['aB', aB], ['aC', aC], ['aD', aD]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 1));
    g.instanceCount = n;
    const mid = new THREE.Vector3(t.x + t.dx * t.len * 0.55, hAt(t.x + t.dx * t.len * 0.55, t.z + t.dz * t.len * 0.55), t.z + t.dz * t.len * 0.55);
    g.boundingSphere = new THREE.Sphere(mid, t.len * 0.6 + 6);
    const mesh = new THREE.Mesh(g, o.material); mesh.name = 'slip-discs'; group.add(mesh);
    await ctx.yield();
  }
  return { group };
}

// the sink's discs: seven lanes of the flow, joined at the rim and (a third of them) half way down; all of them drawn
// at every distance, from a stream of their own
export function buildSinkDiscs(C, o) {
  const n = o.count, rng = o.rng, aA = new Float32Array(n * 4), aD = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const inner = i % 3 === 2, R0 = inner ? 7 + 2.2 * rng() : 14.6 + rng(), lane = Math.floor(rng() * 7);
    aA.set([lane * 6.2832 / 7 + (rng() + rng() - 1) * 0.3 + 1.1 * Math.log(15.6 / R0), rng(), R0, rng()], i * 4);
    aD.set([(1.2 + 2.2 * rng()) * (rng() < 0.5 ? -1 : 1), 0.94 + 0.12 * rng(), 0.01 + 0.02 * rng() * rng()], i * 3);
  }
  const g = new THREE.InstancedBufferGeometry().copy(C.makeDiscGeometry());
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aD', new THREE.InstancedBufferAttribute(aD, 3));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(SINK.x, 2, SINK.z), 19);
  const mesh = new THREE.Mesh(g, o.material); mesh.name = 'sink-discs';
  return { mesh };
}

// ---------------------------------------------------------------- THE END WALL'S DRESS
// On the north bulkhead, by the bulkhead's own plan (upright ribs every 6.4 m from x -28.8, ring beams at y 22.4 and
// 33): a gallery on brackets with a tube rail, its underside 14.2 m over the door's centre, and over it a row of the
// catwalks' caged lamps on the wall, one at every panel line. A wall walkway and its lamps, nothing more: no pipe, no
// upright with cross pieces, nothing that leads down toward the coin or juts out over it beyond the gallery's deck.
// Nothing of it stands nearer than 14 m to the line.
export const DRESS = { deck: DOOR.y + 14.7, x: 27, panel: 6.4, lamps: [-25.6, -19.2, -12.8, -6.4, 0, 6.4, 12.8, 19.2, 25.6], lampY: DOOR.y + 14.7 + LAMP.up };
export function dressBoxes() {
  const zB = HALL.zN, D = DRESS;
  return [['bulkhead gallery', -D.x, D.deck - 0.5, zB, D.x, D.deck + 1.25, zB + 2.0],
    ...D.lamps.map((x) => ['bulkhead lamp', x - 0.15, D.lampY - 0.25, zB, x + 0.15, D.lampY + 0.3, zB + LAMP.out + 0.15])];
}
export function tube(bag, a, b, r, col, sides = 8) {
  const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(ax[0], ax[1], ax[2]) || 1, d = ax.map((v) => v / L);
  const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map((v) => v / ul);
  const w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const P = (q, t) => { const c = Math.cos(t) * r, sn = Math.sin(t) * r; return [q[0] + u[0] * c + w[0] * sn, q[1] + u[1] * c + w[1] * sn, q[2] + u[2] * c + w[2] * sn]; };
  for (let i = 0; i < sides; i++) {
    const t0 = (i / sides) * 6.2832, t1 = ((i + 1) / sides) * 6.2832, p = 6.2832 * r / sides;
    bag.quad(P(a, t0), P(a, t1), P(b, t1), P(b, t0), col, [[i * p, 0], [(i + 1) * p, 0], [(i + 1) * p, L], [i * p, L]]);
  }
}
// glow: the bag every lamp's glass goes into
export function buildDress(steel, glow) {
  const group = new THREE.Group(), bag = makeBag(), zB = HALL.zN, D = DRESS, y = D.deck;
  bag.box(-D.x, y - 0.12, zB + 0.6, D.x, y, zB + 1.9, PLATE);
  for (let x = -D.x + 0.2; x < D.x; x += D.panel / 2) bag.box(x - 0.06, y - 0.5, zB + 0.6, x + 0.06, y - 0.12, zB + 1.85, RIB);
  for (const dy of [0.55, 1.1]) tube(bag, [-D.x, y + dy, zB + 1.85], [D.x, y + dy, zB + 1.85], 0.04, DARK, 6);
  for (let x = -D.x + 0.2; x < D.x; x += 2.4) bag.box(x - 0.035, y, zB + 1.815, x + 0.035, y + 1.1, zB + 1.885, DARK);
  for (const x of D.lamps) cagedLamp(bag, glow, x, D.lampY, zB + LAMP.out, 0, 1);
  const solid = new THREE.Mesh(bag.geometry(), steel); solid.name = 'bulkhead-dress'; solid.frustumCulled = false; group.add(solid);
  return group;
}

// ---------------------------------------------------------------- THE SPRINGBOARD on its diving tower
// One tower of white enamel pipe (a swimming bath's) standing in the coin: four splayed legs sunk into the coin, struts
// and crossed braces, a ladder with round rungs up its back (the west side), a railed platform, and ONE long springboard
// on a fulcrum, pale aqua like a real board, jutting east. It is built jutting north and turned a quarter into place.
// (r6) THE HIGH BOARD OVER THE DEEP END. The tower stands on the long dune's flank WEST of the entry trough at the
// trough's far end, and its board juts EAST right across the trough, over the line: it is seen side-on, dead ahead,
// from the first frame, and the line flies under it before it climbs. Its measures: where the board crosses the line
// (BOARD.z), how far east of the line its tip lies, how far over the line its top stands, how far the board juts
// beyond the fulcrum, the platform's half breadth and half length, the board's breadth and thickness. Everything of
// it stands 5 m and more from the line: the board 15.8 m over it, the nearest leg 6 m and more west of it.
export const TOWER = { z: BOARD.z, east: 2, above: 16, jut: 10, hx: 1.8, hz: 2.1, wide: 1.9, thick: 0.16 };
// ITS PLACE BY RULE: the line's own place where it crosses BOARD.z gives the tip (TOWER.east east of it) and the
// board's height (TOWER.above over it); the platform's middle stands TOWER.jut + TOWER.hz west of the tip.
// flown: the line's places [x, y, z] every 2 m, going north
export function towerPlace(flown) {
  const T = TOWER;
  let i = 0; while (i < flown.length - 2 && flown[i + 1][2] > T.z) i++;
  const a = flown[i], b = flown[i + 1], t = Math.min(1, Math.max(0, (a[2] - T.z) / Math.max(1e-6, a[2] - b[2])));
  const lx = a[0] + (b[0] - a[0]) * t, ly = a[1] + (b[1] - a[1]) * t;
  return { x: lx + T.east - T.jut - T.hz, z: T.z, top: ly + T.above, tip: lx + T.east, lineX: lx, lineY: ly };
}
// THE BOARD'S MOTION LAW: it turns about the fulcrum by 0.011 rad either way (its tip 10 cm up and down), a sine of
// the world's clock with a period of 5 to 7 s and a phase, both dealt by the board's own stream (two draws)
export function buildSpringboard(steel, steel2, at, hAt, rng) {
  const T = TOWER, group = new THREE.Group(), bag = makeBag(), bb = makeBag(), X = at.x, Z = at.z, yB = at.top, yD = yB - 0.35;
  // white enamel pipe, the braces a shade greyer; the board pale aqua on every face (it is seen from beneath)
  const PLATE = [0.80, 0.82, 0.84], RIB = [0.62, 0.65, 0.69], DARK = [0.74, 0.76, 0.79], PLANK = [0.26, 0.66, 0.64], GREEN = [0.30, 0.74, 0.72];
  const period = rng.range(5, 7), ph = rng() * 6.2832;
  // the legs' feet stand 1 m under the lowest coin about the tower
  let low = 1e9;
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) low = Math.min(low, hAt(X + dx * (T.hz + 1.5), Z + dz * (T.hz + 1.5)));
  const y0 = low - 1, tall = yD - y0, bat = 1 / 12, bax = 1 / 18;
  const leg = (sx, sz, y) => [X + sx * (T.hx + (yD - y) * bax), y, Z + sz * (T.hz + (yD - y) * bat)];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube(bag, leg(sx, sz, y0), leg(sx, sz, yD), 0.2, PLATE, 8);
  // struts round the tower at every panel line, crossed braces in every panel of its four sides
  const np = Math.max(2, Math.round(tall / 3.2)), lv = [];
  for (let i = 0; i <= np; i++) lv.push(y0 + 1 + (tall - 1) * i / np);
  for (let i = 0; i <= np; i++) for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
    if (i > 0) tube(bag, leg(a[0], a[1], lv[i]), leg(b[0], b[1], lv[i]), 0.085, RIB, 6);
    if (i < np) { tube(bag, leg(a[0], a[1], lv[i]), leg(b[0], b[1], lv[i + 1]), 0.06, RIB, 6); tube(bag, leg(b[0], b[1], lv[i]), leg(a[0], a[1], lv[i + 1]), 0.06, RIB, 6); }
  }
  // the platform's deck and its tube rails: open in the middle of the north side where the board leaves, and of the
  // south side where the ladder lands
  bag.box(X - T.hx - 0.15, yD - 0.1, Z - T.hz - 0.15, X + T.hx + 0.15, yD, Z + T.hz + 0.15, PLATE);
  const rx = T.hx + 0.1, rz = T.hz + 0.1;
  for (const sx of [-1, 1]) {
    for (const dz of [-rz, 0, rz]) tube(bag, [X + sx * rx, yD, Z + dz], [X + sx * rx, yD + 1.1, Z + dz], 0.04, DARK, 6);
    tube(bag, [X + sx * (T.wide / 2 + 0.25), yD, Z - rz], [X + sx * (T.wide / 2 + 0.25), yD + 1.1, Z - rz], 0.04, DARK, 6);
    for (const dy of [0.55, 1.1]) {
      tube(bag, [X + sx * rx, yD + dy, Z - rz], [X + sx * rx, yD + dy, Z + rz], 0.04, DARK, 6);
      tube(bag, [X + sx * rx, yD + dy, Z - rz], [X + sx * (T.wide / 2 + 0.25), yD + dy, Z - rz], 0.04, DARK, 6);
      tube(bag, [X + sx * rx, yD + dy, Z + rz], [X + sx * 0.5, yD + dy, Z + rz], 0.04, DARK, 6);
    }
  }
  // the ladder up the south side: two stiles, a round rung every 0.3 m, a stay to the tower at every panel line
  const lz = (y) => Z + T.hz + (yD - y) * bat + 0.3;
  for (const sx of [-1, 1]) {
    tube(bag, [X + sx * 0.32, y0, lz(y0)], [X + sx * 0.32, yD + 1.1, lz(yD + 1.1)], 0.045, DARK, 6);
    for (let i = 1; i <= np; i++) tube(bag, [X + sx * 0.32, lv[i], lz(lv[i])], [X + sx * 0.32, lv[i], lz(lv[i]) - 0.3], 0.03, DARK, 6);
  }
  for (let y = y0 + 0.35; y < yD + 0.05; y += 0.35) tube(bag, [X - 0.32, y, lz(y)], [X + 0.32, y, lz(y)], 0.028, DARK, 6);
  // the fulcrum by the platform's north edge and the board's anchor at its back
  const zf = Z - T.hz + 0.25, root = 0.9 + T.hz - 0.25, len = T.jut + 0.25;
  const hw = T.wide / 2, th = T.thick;
  for (const sx of [-1, 1]) bag.box(X + sx * (hw + 0.12) - 0.06, yD, zf - 0.15, X + sx * (hw + 0.12) + 0.06, yD + 0.3, zf + 0.15, RIB);
  tube(bag, [X - hw - 0.18, yD + 0.2, zf], [X + hw + 0.18, yD + 0.2, zf], 0.12, RIB, 8);
  bag.box(X - hw - 0.05, yD, Z + 0.7, X + hw + 0.05, yD + 0.3, Z + 0.95, RIB);
  // the board about its fulcrum: T.wide broad, T.thick thick, its tip drooping 0.28 m; its plank's uv lie in a plate's plain middle
  const top = (zz) => (zz < 0 ? -0.28 * (zz / len) ** 2 : 0), uvp = (a, b) => [[1.0, 0.8 + a], [1.5, 0.8 + a], [1.5, 0.8 + b], [1.0, 0.8 + b]], N = 14;
  for (let i = 0; i < N; i++) {
    const z0 = root - (root + len) * i / N, z1 = root - (root + len) * (i + 1) / N, a0 = top(z0), a1 = top(z1), u = uvp(i / N, (i + 1) / N);
    bb.quad([-hw, a0, z0], [hw, a0, z0], [hw, a1, z1], [-hw, a1, z1], GREEN, u);
    bb.quad([hw, a0 - th, z0], [-hw, a0 - th, z0], [-hw, a1 - th, z1], [hw, a1 - th, z1], PLANK, u);
    for (const sx of [-1, 1]) bb.quad([sx * hw, a0 - th, z0], [sx * hw, a0, z0], [sx * hw, a1, z1], [sx * hw, a1 - th, z1], GREEN, u);
  }
  for (const zz of [root, -len]) bb.quad([-hw, top(zz) - th, zz], [hw, top(zz) - th, zz], [hw, top(zz), zz], [-hw, top(zz), zz], GREEN, uvp(0, 0.05));
  const tower = new THREE.Mesh(bag.geometry(), steel); tower.name = 'dive-tower'; tower.frustumCulled = false;
  const board = new THREE.Mesh(bb.geometry(), steel2); board.name = 'springboard'; board.frustumCulled = false;
  // the quarter turn about the platform's middle, laid into the geometry itself: what was built jutting north
  // (minus z) now juts east (plus x); the fulcrum goes with it and the board springs about the axis across it (z)
  const R = new THREE.Matrix4().makeRotationY(-Math.PI / 2);
  tower.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(X, 0, Z).multiply(R).multiply(new THREE.Matrix4().makeTranslation(-X, 0, -Z)));
  board.geometry.applyMatrix4(R);
  board.position.set(X + (Z - zf), yB, Z);
  group.add(tower, board);
  const update = (dt, time) => { board.rotation.z = 0.011 * Math.sin(time * 6.2832 / period + ph); };
  update(0, 0);
  return { group, update, tris: bag.count() + bb.count(), y0, yD };
}
// ---------------------------------------------------------------- THE DEPTH SCALES
// A broad strip of white enamel plate (1.2 m) riveted up a wall from the floor plates to the roof's springing, with
// black marks from its left edge: a short one every metre, a longer one every five, the longest every ten. No numeral,
// no letter, no sign. SCALE.door: how far east of the door's axis the second stands (clear of the ring's outer step).
// (x, z): the strip's middle on the wall's face; (ax, az): the way out of the wall into the hall
export const SCALE = { half: 0.6, door: 7.6 };
// (r6) THE GAUGE STAFF: a depth scale standing free in the coin, as a river gauge stands in a stream: STAFF.out east
// of the entry axis, STAFF.in north of the entry plane, its face turned toward the way in (the entry point)
export const STAFF = { out: 6, in: 24 };
export function staffPlace() {
  const x = ENTRY.x + STAFF.out, z = ENTRY.z - STAFF.in, dx = ENTRY.x - x, dz = ENTRY.z - z, d = Math.hypot(dx, dz);
  return { x, z, ax: dx / d, az: dz / d };
}
export function depthScale(bag, x, z, ax, az) {
  const W = SCALE.half, H = HALL.wallH, ENAMEL = [0.78, 0.79, 0.76], BLACK = [0.012, 0.012, 0.014], tx = az, tz = -ax;
  const P = (s, y, e) => [x + ax * e + tx * s, y, z + az * e + tz * s], flat = [[1, 1], [1, 1], [1, 1], [1, 1]];
  bag.quad(P(-W, 0, 0.04), P(0, 0, 0.04), P(0, H, 0.04), P(-W, H, 0.04), ENAMEL, [[0.02, 0], [0.02 + W, 0], [0.02 + W, H], [0.02, H]]);
  bag.quad(P(0, 0, 0.04), P(W, 0, 0.04), P(W, H, 0.04), P(0, H, 0.04), ENAMEL, [[0.02 + W, 0], [0.02, 0], [0.02, H], [0.02 + W, H]]);
  for (const s of [-W, W]) bag.quad(P(s, 0, s < 0 ? 0 : 0.04), P(s, 0, s < 0 ? 0.04 : 0), P(s, H, s < 0 ? 0.04 : 0), P(s, H, s < 0 ? 0 : 0.04), ENAMEL, flat);
  for (let m = 1; m < H; m++) {
    const long = m % 10 === 0 ? 2 * W - 0.24 : m % 5 === 0 ? 0.55 : 0.3, t = m % 10 === 0 ? 0.1 : m % 5 === 0 ? 0.07 : 0.05;
    bag.quad(P(-W + 0.12, m - t, 0.05), P(-W + 0.12 + long, m - t, 0.05), P(-W + 0.12 + long, m + t, 0.05), P(-W + 0.12, m + t, 0.05), BLACK, flat);
  }
}

// ---------------------------------------------------------------- the round door (from real bank vault doors)
// A stepped ring about the doorway with 24 bolt sockets; the door itself a stepped round plug swung fully open on the
// west side, flat against the bulkhead, with its ring of 24 bolts and plain link bars; a massive hinge and a small
// hinge crane. No emblem, no wheel handle, nothing lettered.
const paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
export function buildDoor(steel, polished) {
  const group = new THREE.Group(), BR = [0.74, 0.77, 0.82], MID = [0.36, 0.38, 0.42], V2 = (r, y) => new THREE.Vector2(r, y), zB = HALL.zN;
  // the ring: three deep steps standing 1.5 m proud of the bulkhead, polished
  const ring = paint(new THREE.LatheGeometry([V2(4.3, -0.35), V2(4.3, 1.5), V2(4.75, 1.5), V2(4.75, 1.0), V2(5.3, 1.0), V2(5.3, 0.5), V2(5.9, 0.5), V2(5.9, -0.05)], 72).rotateX(Math.PI / 2), BR);
  const ringM = new THREE.Mesh(ring, polished); ringM.position.set(DOOR.x, DOOR.y, zB); ringM.name = 'door-ring';
  // the plug: 9.6 m across, 2.4 m thick, stepped in three; its face brushed, its stepped rim polished
  const px = -12.9, plug = new THREE.LatheGeometry([V2(0, 0), V2(4.8, 0), V2(4.8, 0.9), V2(4.45, 0.9), V2(4.45, 1.65), V2(4.1, 1.65), V2(4.1, 2.4), V2(3.7, 2.4), V2(3.7, 2.2), V2(0, 2.2)], 72).rotateX(Math.PI / 2);
  { const P = plug.attributes.position, a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) a.set(Math.hypot(P.getX(i), P.getY(i)) > 3.6 ? BR : MID, i * 3); plug.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  const plugM = new THREE.Mesh(plug, polished); plugM.position.set(px, DOOR.y, zB + 0.25); plugM.name = 'door-plug';
  group.add(ringM, plugM);
  // the sockets in the ring; on the plug's face the 24 bolts, each on its link bar from the linkage ring round the boss
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), Zax = new THREE.Vector3(0, 0, 1);
  const sock = new THREE.InstancedMesh(paint(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12).rotateX(Math.PI / 2), [0.012, 0.014, 0.018]), steel, 24);
  const bolts = new THREE.InstancedMesh(paint(new THREE.CylinderGeometry(0.21, 0.21, 1.25, 12), [0.62, 0.64, 0.68]), polished, 24);
  // the bolt work on the plug's inner face (from real vault doors): each bolt slides in a guide block at the rim and is
  // thrown by a link bar, pinned at both ends, from a gear ring that turns about the hub; a dished cover plate over the
  // hub, cap screws round its flange, a machined step between ring and bolts, rivets round the land
  const zf = zB + 2.45, RI = 1.33, RO = 2.5, SK = 0.3;
  const li = [Math.cos(SK) * RI, Math.sin(SK) * RI], LL = Math.hypot(RO - li[0], li[1]);
  const links = new THREE.InstancedMesh(paint(new THREE.BoxGeometry(0.11, LL + 0.16, 0.06), [0.2, 0.21, 0.24]), polished, 24);
  const blocks = new THREE.InstancedMesh(paint(new THREE.BoxGeometry(0.62, 0.36, 0.5), [0.2, 0.21, 0.235]), polished, 24);
  const teeth = new THREE.InstancedMesh(paint(new THREE.BoxGeometry(0.085, 0.1, 0.17), [0.42, 0.44, 0.48]), polished, 54);
  const pins = new THREE.InstancedMesh(paint(new THREE.CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2), [0.66, 0.68, 0.72]), polished, 24 + 24 + 36 + 16);
  const sc3 = new THREE.Vector3(); let np = 0;
  const pin = (x, y, z, r, h) => { m4.compose(p.set(px + x, DOOR.y + y, z), q.identity(), sc3.set(r, r, h)); pins.setMatrixAt(np++, m4); };
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    m4.compose(p.set(DOOR.x + c * 5.02, DOOR.y + s * 5.02, zB + 1.0), q.identity(), one); sock.setMatrixAt(i, m4);
    q.setFromAxisAngle(Zax, a - Math.PI / 2);
    m4.compose(p.set(px + c * 3.05, DOOR.y + s * 3.05, zB + 2.68), q, one); bolts.setMatrixAt(i, m4);
    m4.compose(p.set(px + c * 3.42, DOOR.y + s * 3.42, zf + 0.25), q, one); blocks.setMatrixAt(i, m4);
    // the link: from its pin on the gear ring (a little round from the bolt) to the pin on the bolt's inner end
    const ix = Math.cos(a + SK) * RI, iy = Math.sin(a + SK) * RI, ox = c * RO, oy = s * RO;
    q.setFromAxisAngle(Zax, Math.atan2(oy - iy, ox - ix) - Math.PI / 2);
    m4.compose(p.set(px + (ix + ox) / 2, DOOR.y + (iy + oy) / 2, zf + 0.5), q, one); links.setMatrixAt(i, m4);
    pin(ix, iy, zf + 0.38, 0.07, 0.36); pin(ox, oy, zf + 0.5, 0.075, 0.14);
  }
  for (let i = 0; i < 36; i++) { const a = (i + 0.5) / 36 * Math.PI * 2; pin(Math.cos(a) * 3.9, Math.sin(a) * 3.9, zf + 0.225, 0.055, 0.05); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pin(Math.cos(a) * 1.04, Math.sin(a) * 1.04, zf + 0.16, 0.04, 0.06); }
  for (let i = 0; i < 54; i++) { const a = i / 54 * Math.PI * 2; q.setFromAxisAngle(Zax, a - Math.PI / 2); m4.compose(p.set(px + Math.cos(a) * 1.545, DOOR.y + Math.sin(a) * 1.545, zf + 0.115), q, one); teeth.setMatrixAt(i, m4); }
  sock.name = 'door-sockets'; bolts.name = 'door-bolts'; links.name = 'door-links'; blocks.name = 'door-guides'; teeth.name = 'door-teeth'; pins.name = 'door-pins';
  group.add(sock, bolts, links, blocks, teeth, pins);
  // one turned piece on the face: the dished cover over the hub with its flange, the gear ring's body, the machined step
  const worksG = new THREE.LatheGeometry([V2(0, 0.36), V2(0.4, 0.34), V2(0.7, 0.29), V2(0.92, 0.2), V2(0.98, 0.13), V2(1.1, 0.13), V2(1.1, 0.03), V2(1.16, 0.03), V2(1.16, 0.2), V2(1.5, 0.2), V2(1.5, 0.006),
    V2(2.05, 0.006), V2(2.05, 0.055), V2(2.27, 0.055), V2(2.27, 0.006)], 72).rotateX(Math.PI / 2);
  { const P = worksG.attributes.position, a = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const r = Math.hypot(P.getX(i), P.getY(i)); a.set(r < 1.12 ? [0.6, 0.62, 0.66] : r < 1.52 ? [0.27, 0.28, 0.31] : r > 2.04 ? [0.5, 0.52, 0.56] : MID, i * 3); } worksG.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  const works = new THREE.Mesh(worksG, polished); works.position.set(px, DOOR.y, zf); works.name = 'door-works';
  group.add(works);
  // the hinge: a heavy pin block on the bulkhead beside the ring, two thick arms to the plug's rim; the hinge crane: a
  // post, a jib over the plug, a tie down to it. And the bulkhead's own stiffeners: upright ribs and two ring beams.
  const bag = makeBag();
  bag.box(-7.5, 6.6, zB, -6.1, 17.4, zB + 1.9, RIB);
  for (const y of [8.6, 14.0]) bag.box(-9.2, y, zB + 0.6, -6.3, y + 1.3, zB + 1.7, RIB);
  bag.box(-7.2, 17.4, zB + 0.3, -6.4, 21.2, zB + 1.1, DARK);
  bag.box(-13.6, 20.5, zB + 0.35, -6.4, 21.2, zB + 1.05, DARK);
  bag.box(-13.0, 16.8, zB + 0.6, -12.8, 20.5, zB + 0.8, DARK);
  bag.box(-13.25, 16.5, zB + 0.45, -12.55, 16.9, zB + 0.95, DARK);
  for (let x = -28.8; x < 30; x += 6.4) {
    const top = archY(x) - 0.4;
    if (Math.abs(x) < 7 || (x > -19 && x < -7)) { bag.box(x - 0.22, 19.6, zB, x + 0.22, top, zB + 0.8, RIB); continue; }
    bag.box(x - 0.22, 0, zB, x + 0.22, top, zB + 0.8, RIB);
  }
  for (const y of [22.4, 33]) { const hw = HALL.hw * Math.sqrt(Math.max(0, 1 - ((y - HALL.wallH) / (HALL.crown - HALL.wallH)) ** 2)) - 0.5; bag.box(-hw, y - 0.3, zB, hw, y + 0.3, zB + 0.6, RIB); }
  const hinge = new THREE.Mesh(bag.geometry(), steel); hinge.name = 'door-hinge'; hinge.frustumCulled = false; group.add(hinge);
  return group;
}

// ---------------------------------------------------------------- the overhead travelling crane
// Twin bridge girders on end carriages, a cab hung under them, a crab over the west side (x -18) with a clamshell grab
// on four ropes, swinging a little and dribbling a thin thread of coin. THE BRIDGE STANDS STILL: where along the hall
// is dealt by the seed (the first draw of the crane's stream, handed to o.place; the second is the swing's phase). Only
// the grab sways on the world's clock. Crab, cab and grab keep 14 m and more from the line wherever the bridge stands.
// The thread is real discs alone and runs down to 1 m under the coin beneath the grab (o.low(z) gives that coin).
// o: { C, material (the falls' discs), count, discRng (the discs' own stream), place(u), low(z) }
export function buildCrane(steel, rng, o = {}) {
  const u = rng(), ph2 = rng(), zc = o.place ? o.place(u) : HALL.zS - 4;
  const group = new THREE.Group(), bag = makeBag(), gb = makeBag(), GX = GRAB.x, H = GRAB.hang;
  for (const z of [-1.8, 1.8]) bag.box(-28.3, 27.3, z - 0.3, 28.3, 29.3, z + 0.3, RIB);
  for (const s of [-1, 1]) bag.box(Math.min(s * 27.9, s * 29.3), 27.0, -3.3, Math.max(s * 27.9, s * 29.3), 27.9, 3.3, DARK);
  bag.box(GX - 1.7, GRAB.y, -2.5, GX + 1.7, GRAB.y + 1.3, 2.5, DARK);
  bag.box(-14.6, 24.3, -1.3, -11.8, 27.2, 1.3, PLATE);
  bag.box(-14.7, 26.0, -1.35, -11.7, 26.2, 1.35, RIB);
  // the grab, about its hanging point (0, 0, 0) at the crab: ropes, a head piece, two shells
  const yh = -(H - 2.6), ys = -(H - 1.6), yb = -H;
  for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) gb.box(dx - 0.04, yh, dz - 0.04, dx + 0.04, 0, dz + 0.04, DARK);
  gb.box(-0.7, ys, -0.8, 0.7, yh, 0.8, DARK);
  gb.quad([-1.5, ys, 1.0], [0, yb, 1.0], [0, yb, -1.0], [-1.5, ys, -1.0], RIB, [[0, 0], [2.2, 0], [2.2, 2], [0, 2]]);
  gb.quad([1.5, ys, -1.0], [0, yb, -1.0], [0, yb, 1.0], [1.5, ys, 1.0], RIB, [[0, 0], [2.2, 0], [2.2, 2], [0, 2]]);
  gb.box(-1.5, ys - 0.2, -1.0, 1.5, ys, 1.0, RIB);
  for (const z of [-1.0, 1.0]) { gb.quad([-1.5, ys, z], [1.5, ys, z], [0, yb, z], [0, yb, z], RIB, [[0, 0], [3, 0], [1.5, 1.6], [1.5, 1.6]]); gb.quad([1.5, ys, z], [-1.5, ys, z], [0, yb, z], [0, yb, z], RIB, [[0, 0], [3, 0], [1.5, 1.6], [1.5, 1.6]]); }
  const body = new THREE.Mesh(bag.geometry(), steel); body.name = 'crane';
  const grab = new THREE.Mesh(gb.geometry(), steel); grab.name = 'crane-grab'; grab.position.set(GX, GRAB.y, 0);
  group.add(body, grab);
  // the thread of coin dribbling from the grab: real discs on the clock (the falls' law)
  const top = GRAB.y - H, end = (o.low ? o.low(zc) : 4) - 1, drop = top - end;
  if (o.C && o.material && o.count > 0) {
    const n = o.count, dr = o.discRng, aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), aC = new Float32Array(n * 4), aD = new Float32Array(n * 4);
    const tFall = (-2 + Math.sqrt(4 + 19.6 * drop)) / 9.8;
    for (let i = 0; i < n; i++) {
      const a = dr() * 6.2832, r = 0.22 * Math.sqrt(dr());
      aA.set([GX + r * Math.cos(a), top, r * Math.sin(a), dr()], i * 4); aB.set([(dr() - 0.5) * 0.3, (dr() - 0.5) * 0.3, tFall, 0.02], i * 4);
      aD.set([dr(), (6 + 6 * dr()) * (dr() < 0.5 ? -1 : 1), 0.94 + 0.12 * dr(), 0], i * 4);
    }
    const g = new THREE.InstancedBufferGeometry().copy(o.C.makeDiscGeometry());
    for (const [name, arr] of [['aA', aA], ['aB', aB], ['aC', aC], ['aD', aD]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(GX, (top + end) / 2, 0), drop / 2 + 1);
    const discs = new THREE.Mesh(g, o.material); discs.name = 'crane-stream'; group.add(discs);
  }
  group.position.z = zc;
  const update = (dt, time) => { grab.rotation.z = 0.035 * Math.sin(time * 0.9 + ph2 * 6.2832); grab.rotation.x = 0.025 * Math.sin(time * 0.77 + u * 6.2832); };
  update(0, 0);
  return { group, update };
}
