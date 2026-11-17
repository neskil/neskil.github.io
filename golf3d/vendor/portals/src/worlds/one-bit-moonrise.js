// THE ONE-BIT MOON. A night sea in two inks and no grey: we sail a small lugger out of a black cove as an enormous
// moon lifts from the water, and every sail, seabird and cloud is drawn as the opposite of whatever lies behind it.
// Everything visible is made from the one makeStyle instance of ../parts/one-bit-moonrise.js: land() facets, ink()
// cut-outs, figure() exclusive-or, line() keylines, and the dome that draws sky and sea. No lights, no fog, no pass.
//
// MAP. +Z is the entry axis (north); east, the brief's +x, is world -X so that "right" in the brief is right on
// the screen. E(bx, y, bz) turns the brief's coordinates into world ones. The hero is placed by rotation only.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle } from '../parts/one-bit-moonrise.js';

const DEG = Math.PI / 180;
const PALETTE = ['#0B0B10', '#F3F0E6', '#1A0F02', '#FFB648', '#06140C', '#9CF5B0'];
const EYE = 3.2, DURATION = 42;
const ARCH = { half: 7.5, crown: 12, x: -212, z: 308.8 };                 // the opening in the skerry: 15 m wide, 12 m high
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------------------------------------
// LAND: designed one-bit rock. Every mass is a few large BLOCKS: a plan polygon on the water, each
// side a single battered plane, cut off by one sloping cap plane. Every facet is therefore planar
// and its ink is decided where it is drawn, by the azimuth of its side against the moon (12 degrees
// east of north): within 55 degrees white, beyond 100 black, and a short side turned to 62, 78 or
// 94 degrees is the one narrow patterned turn (75, 50, 25 per cent). Blocks stand into each other;
// the depth buffer cuts the joins as straight lines. Normals are written per facet (flat).
// ---------------------------------------------------------------------------------------------
const Y0 = -0.8;
const makeLand = () => ({ pos: [], nor: [], cell: [], keys: [] });
function facet(L, pts, n, cell = 0.2) {                                                // a planar polygon as a fan, wound to face along n
  const a = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    let b = pts[i], c = pts[i + 1];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) { const t = b; b = c; c = t; }
    L.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let k = 0; k < 3; k++) { L.nor.push(n[0], n[1], n[2]); L.cell.push(cell); }
  }
}
// plan: [[x, z], ...] convex. o.batter: lean of every side (radians) or one per side; cap: y = o.h + o.gx (x - at.x) + o.gz (z - at.z);
// o.key: the sides whose top edge carries a keyline (the edges that part black land from black sky)
function block(L, plan, o) {
  const n = plan.length; let cx = 0, cz = 0; for (const p of plan) { cx += p[0] / n; cz += p[1] / n; }
  const N = [];
  for (let i = 0; i < n; i++) {
    const p = plan[i], q = plan[(i + 1) % n]; let ex = q[0] - p[0], ez = q[1] - p[1]; const l = Math.hypot(ex, ez) || 1; ex /= l; ez /= l;
    let nx = ez, nz = -ex; if (nx * (p[0] - cx) + nz * (p[1] - cz) < 0) { nx = -nx; nz = -nz; }
    const b = Array.isArray(o.batter) ? o.batter[i] : (o.batter ?? 0.14), cb = Math.cos(b);
    N.push([nx * cb, Math.sin(b), nz * cb]);
  }
  const at = o.at || [cx, cz], gx = o.gx ?? 0, gz = o.gz ?? 0, top = [];
  for (let i = 0; i < n; i++) {                                           // each corner climbs the line where its two sides meet
    const A = N[(i + n - 1) % n], B = N[i], p = plan[i];
    let ax = A[1] * B[2] - A[2] * B[1], ay = A[2] * B[0] - A[0] * B[2], az = A[0] * B[1] - A[1] * B[0];
    if (Math.abs(ay) < 1e-3) { ax = -B[0] * B[1]; ay = 1 - B[1] * B[1]; az = -B[2] * B[1]; }
    ax /= ay; az /= ay;
    const t = Math.max((o.h + gx * (p[0] - at[0]) + gz * (p[1] - at[1]) - Y0) / Math.max(1 - gx * ax - gz * az, 0.25), 1.2);
    top.push([p[0] + ax * t, Y0 + t, p[1] + az * t]);
  }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (o.skip && o.skip.includes(i)) continue; facet(L, [[plan[i][0], Y0, plan[i][1]], [plan[j][0], Y0, plan[j][1]], top[j], top[i]], N[i], Array.isArray(o.cell) ? o.cell[i] : o.cell); }
  const cl = Math.hypot(gx, 1, gz); facet(L, top, [-gx / cl, 1 / cl, -gz / cl]);
  for (const i of (o.key || [])) { const j = (i + 1) % n; L.keys.push([[top[i][0], top[i][1] + 0.15, top[i][2]], [top[j][0], top[j][1] + 0.15, top[j][2]]]); }
  return { top, N };
}
// the direction of travel along a side whose outward normal stands `az` degrees from north toward the west (+X)
const sideDir = (az) => [Math.cos(az * DEG), -Math.sin(az * DEG)];
// the wall the arch is cut through: front and back each one plane with the opening in it, the opening's lining
// carried through the rock (its south jamb faces the moon and is white, the crown turns through the patterns)
function archWall(L, xF, xB, z0, R, H, SL = 0.09) {                       // SL: the top's slope along the rock
  const r = ARCH.half, yc = ARCH.crown - r, K = 16, out = [[-r, Y0], [-r, yc]];
  for (let q = 1; q < K; q++) { const an = Math.PI - (q / K) * Math.PI; out.push([Math.cos(an) * r, yc + Math.sin(an) * r]); }
  out.push([r, yc], [r, Y0]);
  const m = out.length, bound = out.map((_, i) => { const t = i / (m - 1); const a = -R + 2 * R * (t - 0.25) / 0.5; return t < 0.25 ? [-R, Y0 + (H - SL * R - Y0) * t / 0.25] : (t < 0.75 ? [a, H + SL * a] : [R, H + SL * R - (H + SL * R - Y0) * (t - 0.75) / 0.25]); });
  for (const [x, nx] of [[xF, xF > xB ? 1 : -1], [xB, xF > xB ? -1 : 1]]) for (let i = 0; i < m - 1; i++) {
    const P = (q) => [x, q[1], z0 + q[0]];
    facet(L, [P(out[i]), P(out[i + 1]), P(bound[i + 1])], [nx, 0, 0]); facet(L, [P(out[i]), P(bound[i + 1]), P(bound[i])], [nx, 0, 0]);
  }
  for (let i = 0; i < m - 1; i++) {
    const a = out[i], b = out[i + 1]; let na = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(na, ny) || 1; na /= l; ny /= l;
    if (na * (0 - (a[0] + b[0]) / 2) + ny * (yc - (a[1] + b[1]) / 2) < 0) { na = -na; ny = -ny; }
    facet(L, [[xF, a[1], z0 + a[0]], [xF, b[1], z0 + b[0]], [xB, b[1], z0 + b[0]], [xB, a[1], z0 + a[0]]], [0, ny, na]);
  }
  facet(L, [[xF, H - SL * R, z0 - R], [xF, H + SL * R, z0 + R], [xB, H + SL * R, z0 + R], [xB, H - SL * R, z0 - R]], [0, 1 / Math.hypot(1, SL), -SL / Math.hypot(1, SL)]);
  L.keys.push([[xF, H - SL * R + 0.15, z0 - R], [xF, H + SL * R + 0.15, z0 + R]]);
  return out.map((q) => [xF, q[1], z0 + q[0]]);
}
function landGeometry(L) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.nor, 3));
  g.setAttribute('aCell', new THREE.Float32BufferAttribute(L.cell, 1));
  return g;
}

export default {
  id: 'one-bit-moonrise',
  name: 'The One-Bit Moon',
  category: 'ocean',
  weirdness: 0.5,
  media: ['water', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    // ---- the seeded look: hour (the moon's stage), phase, cast; the colourway is drawn by makeStyle ----
    const vr = rng.fork('one-bit-vary');
    const hr = vr(), hour = ['dawn', 'day', 'golden', 'night'].includes(vary.hour) ? vary.hour : (hr < 0.5 ? 'night' : (hr < 0.68 ? 'golden' : (hr < 0.85 ? 'dawn' : 'day')));
    const crescent = vr() < 0.22, cast = vr() < 0.6 ? 'lug' : 'lateen', shear = vr() < 0.3, rare = !!vary.rare;
    const S = makeStyle(ctx, { palette: PALETTE, negative: hour === 'day', crescent, density });
    const U = S.uniforms;
    // (true 1) the road keeps the brief's widths, "20 degrees wide, the middle 10 degrees its solid core" (it was narrowed
    // to 17 and 8.5): its fringe of lengthening dashes reaches 12 m further out each side, to where the glitter was.
    const scene = new THREE.Scene();
    scene.background = S.K.clone();
    await ctx.yield();

    // ---- the path: the brief's, east to the right. 420 m, level, eye 3.2 m ----
    const E = (bx, y, bz) => new THREE.Vector3(-bx, y, bz);
    // (polish 1) the course keeps the brief's story but stands off the point (20 m, not 9), and the eye is no longer level:
    // low at the waterline rounding the point and among the fleet, up at masthead height for the terns, 3.2 m for the arch.
    // (polish 2) the second half no longer bears away east with the moon abeam: after the junks we hold the road, standing a
    // little east of its axis, up to masthead height for the terns, and come down it to the arch, which now stands under the moon.
    // (polish 4) THE COURSE IS AN S. The moon no longer stands dead ahead for the whole flight: out of the cove north, then
    // away to the north-east across the road and through the fleet's lane (the moon on the port bow, the great luggers
    // between us and it), round to port under the terns (the moon ahead once, whole), back to the north-west through the
    // moorings (the moon on the starboard bow, the wall ahead to port) and so onto the old last straight and the arch.
    // (polish 5) THE EYE CLIMBS AND THE GAZE LETS GO OF THE MOON. The plan of the S is kept (its turn to port a little
    // tighter, so the run through the moorings is nearer the arch's own axis); the eye now goes up to the mastheads over
    // the turn (8.5 m at u 0.7: the harbour from above) and comes down among the moored hulls; and the gaze is written
    // out still by still (VIEW below) instead of resting on the disc: off it to starboard among the great luggers
    // (0.43), back as one of them stands across it (0.52), on it for the terns (0.61), then toward the arch.
    const path = makePath([[0, 0, 3.2], [-1, 25, 5.0], [-5, 50, 4.6], [-9, 76, 2.4], [-5, 102, 2.1], [10, 126, 2.6], [34, 149, 3.2], [62, 173, 2.4], [92, 200, 2.4], [116, 229, 5], [127, 258, 8], [127, 287, 8.5],
      [120, 309, 5.2], [110, 328, 2.6], [102, 345, 2.5], [95.2, 363, 2.5], [93.3, 381, 2.7], [95, 415, EYE]].map((q) => E(q[0], q[2], q[1])));
    // VIEW: [u, the bearing the eye looks along (degrees east of north; the moon stands on 12), its elevation]. The one
    // point of interest is solved from it each frame, so that the engine's blend of course-ahead and gaze comes out on
    // exactly this line (with the steady camera the gaze pulls a third as hard and the eye keeps nearer the course).
    const VIEW = [[0, -4, 4], [0.08, 2, 7], [0.16, 10, 7], [0.25, 27, 7], [0.34, 28, 7.5], [0.43, 46, 6], [0.52, 15, 9], [0.61, 23, 10], [0.7, -2, 6], [0.79, -6, 9], [0.87, -2, 10], [0.94, 0, 6], [1, 2, 4]];
    const viewAt = (u, c) => { let i = 0; while (i < VIEW.length - 2 && u > VIEW[i + 1][0]) i++; const A = VIEW[i], B = VIEW[i + 1]; return (A[c] + (B[c] - A[c]) * sstep(A[0], B[0], u)) * DEG; };
    const viewDir = (u, out) => { const b = viewAt(u, 1), e = viewAt(u, 2); return out.set(-Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e)); };
    const GW = 0.8, LOOK = 22;
    await ctx.yield();
    // (cure 8) THE COURSE'S WHOLE LINE AND THE BERTH, said once for the law that keeps the birds off it (THE BIRDS' BERTH,
    // in the part, buildTerns). A body is kept off the lens by place,
    // its whole course against this whole line. The line: the path every 0.1 m at the eye's own height, from half a
    // metre before its first point (the engine sets the lens up to 0.45 m short of it after a crossing) to its end,
    // [x, y, z, x, y, z, ...] on the map. BERTH: the metres of clear air between a body's skin at its worst and the line.
    // (fleet 1) where the line begins and how far apart its points lie are named, for THE FLEET'S BERTH reads the line
    // by its route metres (the same two numbers, typed here once).
    const BERTH = 2.0, courseLine = [], COURSE_FROM = -0.5, COURSE_STEP = 0.1;
    { const v = new THREE.Vector3(); for (let s = COURSE_FROM; s <= path.length; s += COURSE_STEP) { path.posAtDist(s, v); courseLine.push(v.x, v.y, v.z); if (courseLine.length % 2400 === 0) await ctx.yield(); } }
    await ctx.yield();
    // the skerry was drawn on the old last straight (the arch at ARCH.x, ARCH.z, entered heading east); SKM sets the whole of
    // it down across the new one: SK(v) takes any point drawn for the old place to where it stands now
    const SKY = 86 * DEG, SKM = new THREE.Matrix4().makeRotationY(SKY);
    { const a0 = new THREE.Vector3(ARCH.x, 0, ARCH.z).applyMatrix4(SKM), a1 = E(95, 0, 415); SKM.setPosition(a1.x - a0.x, 0, a1.z - a0.z); }
    const SK = (v) => v.applyMatrix4(SKM), SK3 = (q) => { const v = new THREE.Vector3(q[0], q[1], q[2]).applyMatrix4(SKM); return q.length > 3 ? [v.x, v.y, v.z, q[3]] : [v.x, v.y, v.z]; };
    const pace = (u) => 1 - 0.15 * sstep(0.38, 0.44, u) * (1 - sstep(0.56, 0.62, u)) + 0.15 * sstep(0.16, 0.2, u) * (1 - sstep(0.29, 0.33, u)) - 0.08 * sstep(0.74, 0.8, u) * (1 - sstep(0.86, 0.9, u));   // (polish 2) no bend to hurry through now: a breath slower under the wall
    // the moon's stage: degrees of the disc's centre above the horizon at second T of the journey. The disc itself swells
    // as it clears the sea (moonHalf: 22 degrees of half-width in the cove, 26 over the fleet, 28.5 over the arch) and goes on
    // climbing to the end (polish 2), so that it stands over the arch's wall in the last stills.
    const moonHalf = (u) => (22 + 4 * sstep(0.1, 0.42, u) + 2.5 * sstep(0.58, 0.9, u)) * DEG;
    const moonEl = hour === 'golden' ? (T) => Math.min(-5 + 0.4 * T, 5) + 5 * sstep(24, 38, T) + 7 * sstep(36.5, 41, T) : (hour === 'dawn' ? (T) => 8.5 - 0.19 * T : (T) => Math.min(1.2 + 0.2 * T, 5) + 5 * sstep(24, 38, T) + 7 * sstep(36.5, 41, T));   // (polish 2) it goes on climbing: it stands over the arch at the end

    // ---- land: the west headland, the point with its daymark, the skerry with its arch. Azimuths of sides are degrees
    //      from north toward the west: on a west side 38 is white, 51 / 66 / 82 the turn in 75 / 50 / 25 per cent, 115 black;
    //      on an east side 302 is white, 286 / 270 / 255 the turn, 210 black. ----
    const fin = (L, x0, z0, sides, xb, o) => {
      const plan = [[x0, z0]]; let x = x0, z = z0;
      for (const [az, len] of sides) { const d = sideDir(az); x += d[0] * len; z += d[1] * len; plan.push([x, z]); }
      plan.push([xb, z], [xb, z0]);
      const f = { plan, ...block(L, plan, { at: [x0, z0], key: [0, 1, 2, 3, 5], ...o }) }; if (L === LH) fins.push(f); else sfins.push(f); return f;
    };
    const quad = (o, a, b, c, d) => { for (const p of [a, b, c, a, c, d]) o.push(p[0], p[1], p[2]); };
    const sfins = [];                                                       // (polish 4) the skerry's blocks, for its own lit windows
    const fins = [];                                                        // the cove's blocks, for the lit windows
    const lr = vr.fork('one-bit-land'), plans = [];                             // forked from the look's own stream: ctx.rng's draws are as before
    const J = (v, d) => v + lr.range(-d, d);
    const LH = makeLand();                                                  // the cove: headland and point, cells 0.13 to 0.3 m
    {
      // the west headland in two tiers, each a row of fins stepping north along the channel: a black south-east face,
      // an east face (50 or 75 per cent: white from the cove, pattern as we pass) and a white north-east face
      const tier = (zA, zB, back, hA, hB, cell) => {
        for (let z0 = zA, k = 0; z0 < zB; k++) {
          const x0 = 84 - (z0 + 30) * 0.285 + back, t = (z0 - zA) / (zB - zA);
          const f = fin(LH, x0, z0, [[J(212, 9), J(13, 2)], [k % 3 === 1 ? 286 : 270, J(2.6, 0.6)], [J(303, 5), J(3.4, 0.8)]], x0 + 34,   // (polish 2) a long black face for the windows, a narrow turn, a sliver of white
            { h: (hA + (hB - hA) * t * t) * J(1, 0.09), gx: J(0.1, 0.05), gz: J(-0.08, 0.2), batter: J(0.14, 0.04), cell });
          plans.push(f.plan); z0 = f.plan[3][1] - J(2, 1);
        }
      };
      tier(85, 168, 0, 12, 9, 0.22); await ctx.yield(); tier(95, 150, 13, 26, 22, 0.22); await ctx.yield();   // (polish 2) the headland begins 85 m in: it stands whole in the entry frame, open sea to its left
      // the point: a low prow that turns from black through 25, 50 and 75 per cent to white as we round it (the daymark
      // stands on it), a shoulder, and behind them the tall mass stepping up to the east
      const prow = fin(LH, -23.2, 96, [[38, 7], [51, 6], [68, 7], [82, 16], [115, 12], [150, 20]], -44, { h: 7.5, gx: -0.2, gz: 0.03, batter: 0.16, cell: [0.12, 0.3, 0.17, 0.14, 0.12, 0.12, 0.12, 0.12], key: [0, 1, 2, 3, 4, 5, 6] });   // cells sized to where each facet is seen from
      const sh = fin(LH, -36, 92, [[66, 3], [82, 4], [104, 16], [125, 10], [158, 16]], -62, { h: 11, gx: -0.12, gz: 0.1, batter: 0.15, cell: 0.14, key: [0, 1, 2, 3] });
      const b2 = fin(LH, -50, 86, [[82, 5], [106, 22], [128, 14], [165, 22]], -76, { h: 16, gx: -0.1, gz: 0.1, batter: 0.13, cell: 0.14, key: [0, 1, 2, 3] });
      const b3 = fin(LH, -72, 80, [[82, 5], [108, 20], [140, 18], [172, 40]], -122, { h: 22, gx: -0.04, gz: 0.08, batter: 0.12, cell: 0.14, key: [0, 1, 2, 3] });
      const b4 = fin(LH, -106, 66, [[100, 16], [160, 20], [176, 50]], -178, { h: 17, gx: 0.1, gz: 0.06, batter: 0.14, cell: 0.14, key: [0, 1, 2, 3] });
      plans.push(prow.plan, sh.plan, b2.plan, b3.plan, b4.plan);
    }
    await ctx.yield();
    // the daymark: a blind tapering tower with a ball on top, standing on the prow
    const dmBase = new THREE.Vector3(-19.5, 7.5 - 0.2 * (-19.5 + 23.2) + 0.03 * (88.2 - 96) - 0.6, 88.2);
    {
      const tower = new THREE.CylinderGeometry(1.5, 2.9, 14, 8, 1).toNonIndexed(); tower.translate(dmBase.x, dmBase.y + 7, dmBase.z);
      const ball = new THREE.IcosahedronGeometry(2.3, 1); ball.translate(dmBase.x, dmBase.y + 15.6, dmBase.z);
      for (const g of [tower, ball]) {
        const p = g.attributes.position.array;
        for (let i = 0; i < p.length; i += 9) {
          const ux = p[i + 3] - p[i], uy = p[i + 4] - p[i + 1], uz = p[i + 5] - p[i + 2], vx = p[i + 6] - p[i], vy = p[i + 7] - p[i + 1], vz = p[i + 8] - p[i + 2];
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l < 1e-9) continue;
          for (let k = 0; k < 9; k++) LH.pos.push(p[i + k]);
          for (let k = 0; k < 3; k++) { LH.nor.push(nx / l, ny / l, nz / l); LH.cell.push(0.2); }
        }
        g.dispose();
      }
    }
    // (polish 2) lit windows: the black faces of the cove carry a village asleep, a few lamps still burning in rows; the
    // back-lit land is no longer black on black with only a keyline to say it is there. White cells laid on the faces.
    const winPos = [], winBlk = [];
    const wr = vr.fork('one-bit-windows'), mdx = -Math.sin(12 * DEG), mdz = Math.cos(12 * DEG);
    const winOn = (list, pick, xf) => {
      for (const f of list) {
        const n = f.plan.length;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, N = f.N[i], out = pick(N); if (!out) continue;   // black faces: lit windows; white faces: dark ones
          const b0 = [f.plan[i][0], Y0, f.plan[i][1]], b1 = [f.plan[j][0], Y0, f.plan[j][1]], t0 = f.top[i], t1 = f.top[j];
          const len = Math.hypot(b1[0] - b0[0], b1[2] - b0[2]); if (len < 7) continue;
          const P = (sa, y) => {
            const bx = b0[0] + (b1[0] - b0[0]) * sa, bz = b0[2] + (b1[2] - b0[2]) * sa, tx = t0[0] + (t1[0] - t0[0]) * sa, ty = t0[1] + (t1[1] - t0[1]) * sa, tz = t0[2] + (t1[2] - t0[2]) * sa;
            const t = (y - Y0) / Math.max(ty - Y0, 0.5); return [bx + (tx - bx) * t + N[0] * 0.08, y + N[1] * 0.08, bz + (tz - bz) * t + N[2] * 0.08];
          };
          const topAt = (sa) => t0[1] + (t1[1] - t0[1]) * sa;
          for (let hgt = Math.max(1, Math.round(len / 6 * wr.range(0.6, 1.2))); hgt > 0; hgt--) {       // houses on this face
            const s0 = wr.range(0.08, 0.8), base = wr.range(2.6, Math.max(3, topAt(s0) * 0.55)), floors = 1 + Math.floor(wr() * 2.6), per = 2 + Math.floor(wr() * 3);
            for (let fl = 0; fl < floors; fl++) for (let k = 0; k < per; k++) {
              const sa = s0 + k * 2.3 / len, y = base + fl * 3.1, lit = wr() < 0.62;
              if (!lit || sa > 0.93 || y + 2.4 > topAt(sa)) continue;
              const ds = 0.55 / len; quad(out, xf(P(sa - ds, y - 0.7)), xf(P(sa + ds, y - 0.7)), xf(P(sa + ds, y + 0.7)), xf(P(sa - ds, y + 0.7)));
            }
          }
        }
      }
    };
    await ctx.yield();
    winOn(fins, (N) => { const md = N[0] * mdx + N[2] * mdz; return md > 0.6 ? winBlk : (md < -0.3 ? winPos : null); }, (q) => q);
    // the skerry: a wall with the arch through it and fins stepping away from it both ways, a plinth at the foot of some,
    // a stack off each end. From the last straight the southern fins show their white faces, the northern ones their
    // black faces with the white as a sliver. w = metres west of the rock's line, a = metres north of the arch.
    await ctx.yield();
    const LS = makeLand(), crestW = [];
    const archOutline = archWall(LS, ARCH.x + 9, ARCH.x - 9, ARCH.z, 13, 15.2);
    {
      const row = (dir, list) => {
        let edge = 12 * dir; const tops = [];
        for (const [lw, taz, lt, lb, h, gap, perch] of list) {
          const azw = J(36, 4), azb = J(118, 8), ext = lw * Math.sin(azw * DEG) + lt * Math.sin(taz * DEG) + lb * Math.sin(azb * DEG);
          edge += gap * dir; const a = dir > 0 ? edge + ext : edge, w = J(3, 1.6);
          const f = fin(LS, ARCH.x + w, ARCH.z + a, [[azw, lw], [taz, lt], [azb, lb]], ARCH.x - 9, { h, gx: J(-0.42, 0.12), gz: J(0, 0.36), batter: J(0.14, 0.05), cell: 0.22 });
          if (perch) tops.push(f.top.slice(0, 4));
          if (h > 16 && lr() < 0.7) { const nose = f.plan[1]; fin(LS, nose[0] - J(5, 1), nose[1] + J(5, 2), [[J(36, 4), J(7, 1)], [82, 2], [J(118, 8), J(6, 1)]], ARCH.x - 9, { h: h * J(0.3, 0.06), gx: -0.25, gz: J(0, 0.2), batter: 0.16, cell: 0.22 }); }
          edge = dir > 0 ? a - 1 : a - ext + 1;
        }
        return tops;
      };
      await ctx.yield();
      const north = row(1, [[13, 66, 3.4, 9, 20, 0, 1], [12, 82, 3, 9, 26, 0, 1], [14, 66, 3.2, 10, 31, 0, 1], [11, 82, 2.8, 8, 20, 0, 1], [9, 66, 2.4, 7, 12, 0, 1], [7, 82, 2, 5, 6.5, 7, 0]]);   // (polish 2) now the west of the arch: the tall side
      await ctx.yield();
      const south = row(-1, [[14, 51, 3.4, 11, 13, 0, 1], [13, 82, 3, 10, 10.5, 0, 1], [11, 66, 2.8, 9, 8, 0, 1], [7, 82, 2, 6, 5, 8, 0]]);   // now the east: low, the moon stands over it
      const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
      for (const t of north.reverse()) for (const p of t) crestW.push(V(p));
      crestW.push(new THREE.Vector3(ARCH.x + 9, 16.3, ARCH.z + 12), new THREE.Vector3(ARCH.x + 9, 14.1, ARCH.z - 12));
      for (const t of south) for (const p of t) crestW.push(V(p));
    }
    // (polish 4) the skerry is back-lit and now seen from the south-east as well, where its tall west end stood black on the
    // black sky with nothing but a broken keyline: its faces toward the approach carry lit windows like the cove's, a
    // gatehouse and its keep asleep over the arch
    { const sv = new THREE.Vector3(); winOn(sfins, (N) => (sv.set(N[0], 0, N[2]).transformDirection(SKM).dot(E(0.35, 0, -0.94)) > 0.25 ? winPos : null), SK3); }
    await ctx.yield();
    const landCove = new THREE.Mesh(landGeometry(LH), S.land({ cell: 0.2, dust: 0.006, course: 3.4, dark: 0.66 })); landCove.frustumCulled = false; scene.add(landCove);
    // (polish 2) the skerry now stands between us and the moon: back-lit, every face we can see is black (drawn courses in
    // white line), parted from the disc by its own outline. Its ink is taken against a direction of its own, down the last
    // straight and from above, so that no grazing face turns to a patterned or white slab beside the arch.
    const skMat = S.land({ cell: 0.22, dust: 0, course: 1.7, joints: 2, dark: 0.55, courseDist: 48 });   // (polish 4) the courses are drawn only within 48 m: further off the wall is a black cut-out with lit windows, and no boat's rig is drawn across line-work
    { const d = path.tangentAt(1).setY(0).normalize(); skMat.uniforms.uMoonDir = { value: new THREE.Vector3(d.x, -1.5, d.z) }; }
    const landSkerry = new THREE.Mesh(landGeometry(LS), skMat); landSkerry.frustumCulled = false; landSkerry.matrixAutoUpdate = false; landSkerry.matrix.copy(SKM); scene.add(landSkerry);
    await ctx.yield();
    // keylines: white ribbons along the blocks' top edges (the hand misses one here and there), the daymark's moonward edge
    const kr = rng.fork('one-bit-keys');
    // (polish 4) the cove's keylines are ROOFLINES. A ruled line along the top of black land on a black sky read as a
    // stray line shooting from the mastheads; drawn as the village's roofs (gables, a flat roof with a parapet, a gap) over
    // its rows of lit windows it is a skyline. The skerry's stay ruled: it is a wall.
    const rf = vr.fork('one-bit-roofs');
    const roofs = (k) => {
      const a = k[0], b = k[1], len = Math.hypot(b[0] - a[0], b[2] - a[2]); if (len < 7) return k;
      const P = (t, h) => [a[0] + (b[0] - a[0]) * t / len, a[1] + (b[1] - a[1]) * t / len + h, a[2] + (b[2] - a[2]) * t / len], pts = [a];
      for (let t = 0; len - t > 0.5;) {
        const w = Math.min(rf.range(3.2, 6), len - t), kind = rf();
        if (w < 2.4 || kind > 0.86) pts.push(P(t + w, 0));
        else if (kind < 0.56) pts.push(P(t + w / 2, rf.range(1.1, 2.4)), P(t + w, 0));
        else { const h = rf.range(0.8, 1.7); pts.push(P(t, h), P(t + w, h), P(t + w, 0)); }
        t += w;
      }
      return pts;
    };
    const keys = [...LH.keys.map((k) => ({ k, cove: true })), ...LS.keys.map((k) => ({ k: k.map(SK3) }))].filter(() => kr() > 0.07).map((o) => (o.cove ? roofs(o.k) : o.k));
    keys.push([[dmBase.x + 2.85, dmBase.y + 1.5, dmBase.z - 0.9], [dmBase.x + 1.6, dmBase.y + 13.6, dmBase.z - 0.5]]);
    { const ring = []; for (let i = 0; i <= 10; i++) { const an = (-0.5 + i / 10) * Math.PI; ring.push([dmBase.x + Math.cos(an) * 2.4, dmBase.y + 15.6 + Math.sin(an) * 2.4, dmBase.z - 0.4]); } keys.push(ring); }   // the ball's moonward limb
    const keyMesh = new THREE.Mesh(S.ribbon(keys, 0.1), S.line()); keyMesh.frustumCulled = false; scene.add(keyMesh);
    {
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(winPos, 3));
      const wm = new THREE.Mesh(wg, S.ink(true, { side: THREE.DoubleSide })); wm.frustumCulled = false; scene.add(wm);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(winBlk, 3));
      const bm = new THREE.Mesh(bg, S.ink(false, { side: THREE.DoubleSide })); bm.frustumCulled = false; scene.add(bm);
      // the daymark's painted hoops: two white bands round the tower, so it is a tower and not a keyline standing alone
      const hoops = [];
      for (const hy of [3.6, 8.4]) { const rr = 2.9 - 1.4 * hy / 14 + 0.06, ring = []; for (let i = 0; i <= 14; i++) { const an = i / 14 * Math.PI * 2; ring.push([dmBase.x + Math.cos(an) * rr, dmBase.y + hy, dmBase.z + Math.sin(an) * rr]); } hoops.push(ring); }
      const hm = new THREE.Mesh(S.ribbon(hoops, 0.55), S.line()); hm.frustumCulled = false; scene.add(hm);
    }
    await ctx.yield();

    // ---- the hero: the moon and what crosses it (sky and sea dome, far islands, fleet, terns) ----
    // (polish 1) the road's apex stands 62 m nearer along its own axis, in the cove's mouth: the road is on the water from the first frame
    const heroPos = E(19 - 62 * Math.sin(12 * DEG), 0, 123 - 62 * Math.cos(12 * DEG)), heroRot = Math.PI - 12 * DEG;
    const toLocal = (v) => v.clone().sub(heroPos).applyAxisAngle(new THREE.Vector3(0, 1, 0), -heroRot);
    const crestL = crestW.map((p) => toLocal(SK(p))).reverse();                 // east end first: the flock gathers there and comes down the road at us
    // (true 1, round 2) THE STRAND'S TRACK, on the map. It flew straight from the crest at the eye, sixty birds end-on in a
    // tube 7 m across, each never under 35 px: a pile. Now the sixty sit along the east fifth of the crest (where the
    // flock's wave starts), leave it climbing to the south-east, come round over the sea east of our course and run in
    // against us along a straight line that lies STRAND_OFF m to starboard of our place at 25 s, parallel to our heading
    // there and 15 m up ("10 m above our stem"), and on astern. They are strung out over six seconds (the first reaches
    // that place at 24 s) and a tube 10 m in radius; far off each is a mark of 8 px ("each 3 to 8 pixels long"), a
    // thread; only close to are they birds. The track is fixed on the map: nothing in it knows where the eye is.
    const STRAND_OFF = 15, STRAND_U = 25 / DURATION;
    const pStrand = path.pointAt(STRAND_U), tStrand = path.tangentAt(STRAND_U).setY(0).normalize(), sStrand = new THREE.Vector3(-tStrand.z, 0, tStrand.x);
    const strandW = pStrand.clone().addScaledVector(sStrand, STRAND_OFF).setY(shear ? 8 : 15);
    const strandL = toLocal(strandW);
    const strandVia = [toLocal(E(215, shear ? 34 : 70, 380)), toLocal(strandW.clone().addScaledVector(tStrand, 90))];
    // the lane crosses the road and our course nearly square, from the open sea in the north-west to the bay behind the
    // point (heading 113 to 126 degrees on the brief's map): from the cove the fleet is strung out left and right of the
    // disc, every lugger seen broadside, and only the handful that are crossing the road stand in front of the moon.
    // We sail through its 110 m between u 0.39 and 0.65; it ends 55 m short of the bend and never comes near the arch.
    const slant = 108 + (rng.range(11, 16) - 13.5) * 2.6, LANE = 110;
    const cross0 = toLocal(E(50, 0, 206));
    // the stretch of the lane that is sailed, in metres from its start: 400 m up the lane from our crossing to 100 m past
    // it. When the full-rigger comes the fleet parts for her: it lies hove-to to port of our course, the nearest lugger
    // 30 m short of the crossing, so nothing stands between us and her canvas.
    const laneWin = rare ? (hour === 'dawn' ? [94, 500] : [0, 406]) : [0, 500], laneKeep = rare ? (hour === 'dawn' ? [130, 474] : [26, 370]) : null;
    // two luggers lying off the skerry north of the last straight, drifting north-west: something sails in the last third
    const sgD = E(-0.78, 0, 0.62).transformDirection(SKM).applyAxisAngle(new THREE.Vector3(0, 1, 0), -heroRot).normalize();
    const stragglers = { slant: Math.atan2(sgD.x, -sgD.z) / DEG, crossing: toLocal(SK(E(117, 0, ARCH.z + 55))).addScaledVector(sgD, 20), length: 170, width: 20, speed: 0.22, place: [[40, 2], [86, -3]], thin: [0, 1e4], astern: 60, allThin: false, keep: null, boatScale: 1 };
    // the terns: few enough to count. A ribbon 26 m thick released over 6 s with a tail, every bird at least 8 px
    // across the wings, a dozen on the near edge two to three times larger; the shearwaters' line flies above the masts
    // (polish 5) FEWER AND LARGER. The fleet is 130 luggers half as large again (13 m), not 200 of 9 m: far off a sail is a
    // shape, not a speck. The terns are 70 birds never under 16 px across the wings, strung out in a long skein: a flight
    // of birds you can count, not a speckle.
    // (true 2) Sails and birds are one solid ink on the moon's disc again (the part's second pass), exclusive-or off it.
    // (true 1) The fleet's files are
    // staggered so its sails interleave seen down the road (the part, WHERE THEY STAND; fleetShift sets the pattern 45 m
    // down the lane). The strand that passes at 25 s is the brief's "strand of sixty" (it was 17): sixty birds near the
    // eye, where the glitter on the water was the only thing between the eye and the moon. (round 2) The ribbon is again
    // the 70 (60) birds it was, drawn exactly as before; the strand's other 43 are added to it (strandExtra) and the
    // sixty are strung out as a thread on a track of their own (THE STRAND'S TRACK above).
    // (cure 8) the course's whole line in the hero's own frame, for THE BIRDS' BERTH (the part, buildTerns): where the
    // course lies on the map, never where the eye is on it
    const courseL = [];
    { const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); for (let i = 0; i < courseLine.length; i += 3) { v.set(courseLine[i], courseLine[i + 1], courseLine[i + 2]).sub(heroPos).applyAxisAngle(up, -heroRot); courseL.push(v.x, v.y, v.z); } }
    await ctx.yield();
    const hero = await buildHero(ctx, { style: S, stragglers, detail, density, duration: DURATION, cast, crescent, fleetCount: 130, boatScale: 1.45, fleetShift: 45,
      slant: hour === 'dawn' ? slant + 180 : slant, crossing: cross0, astern: hour === 'dawn' ? 100 : 412, thin: laneWin, keep: laneKeep, speed: rare ? 0 : 6, allThin: true, length: 1600, ribFar: 120,
      width: LANE, crest: crestL, liftAt: 13.5, ternHeading: E(0.94, 0, 0.34).applyAxisAngle(new THREE.Vector3(0, 1, 0), -heroRot).normalize(), ternHeight: shear ? 46 : 112, ternCount: shear ? 60 : 70, ternRadius: shear ? 3 : 7,
      ternWave: shear ? 12 : 12, ternPx: 16, ternBig: shear ? 5 : 8, strandCount: 17, strandExtra: Math.round(60 * detail * density) - 17, strandVia, strandFrom: 0.11, strandPx: 8, strandWindow: [-1, 5], strandRadius: shear ? 6 : 10, ternTail: shear ? 0.35 : 0.4, ternTailFor: shear ? 20 : 17, strandPoint: strandL, strandAt: 25, strandScale: 2.2, moonEl, course: courseL, berth: BERTH });
    hero.object.position.copy(heroPos); hero.object.rotation.y = heroRot; scene.add(hero.object);
    await ctx.yield();

    // ---- our boat (polish 1): a whole 7 m lugger that sails the course a little ahead of the eye, abeam of it or astern,
    //      so the camera works round her (astern, low beside the hull, up by the masthead) and she is a different shape
    //      in every view; never an overlay fixed to the lens. Boat frame: +x port, +y up (0 = the sea), +z the bow, origin
    //      amidships. Everything exclusive-or. A depth-only copy is drawn first and the ink after it, so that only her
    //      nearest surface flips the picture: she is one clean figure from any side, and her lines flip back on her. ----
    const boat = new THREE.Group(); boat.matrixAutoUpdate = false; scene.add(boat);
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false; boat.add(rig);
    const MASTZ = 0.9, MASTTOP = 9.7, TACKY = 1.9, STEMZ = 3.75;
    const hp = [], sp = [], hl = [], sl = [];                               // hull triangles, sail triangles, hull lines, rig lines
    let rudderAt = 0;                                                       // where the rudder's six corners begin in hp (the skiffs have none)
    {
      const Z = [-3.3, -2.5, -1.2, 0.4, 1.9, 3.0, STEMZ], B = [0.7, 1.02, 1.25, 1.22, 0.95, 0.5, 0.03], SH = [1.3, 1.12, 1.0, 1.02, 1.14, 1.34, 1.62];
      // (true 2) raked ends: the keel is shorter than the sheer, so stem and transom lean out over the water. Both were
      // plumb, and a hull seen from the side ended in a straight upright cut, at the stern a wide one.
      const ZB = [-2.7, -2.3, -1.2, 0.4, 1.9, 2.8, 3.25], zS = (i) => ZB[i] + (Z[i] - ZB[i]) * (SH[i] * 0.74 + 0.35) / (SH[i] + 0.35);
      for (let i = 0; i < 6; i++) {
        for (const s of [-1, 1]) {
          quad(hp, [s * B[i] * 0.55, -0.35, ZB[i]], [s * B[i + 1] * 0.55, -0.35, ZB[i + 1]], [s * B[i + 1], SH[i + 1], Z[i + 1]], [s * B[i], SH[i], Z[i]]);
          hl.push([[s * (B[i] * 0.9 + 0.04), SH[i] * 0.74, zS(i)], [s * (B[i + 1] * 0.9 + 0.04), SH[i + 1] * 0.74, zS(i + 1)]]);          // the strake
        }
        quad(hp, [-B[i], SH[i] - 0.22, Z[i]], [B[i], SH[i] - 0.22, Z[i]], [B[i + 1], SH[i + 1] - 0.22, Z[i + 1]], [-B[i + 1], SH[i + 1] - 0.22, Z[i + 1]]);   // the deck
      }
      quad(hp, [-B[0] * 0.55, -0.35, ZB[0]], [B[0] * 0.55, -0.35, ZB[0]], [B[0], SH[0], Z[0]], [-B[0], SH[0], Z[0]]);      // transom
      rudderAt = hp.length;
      quad(hp, [0, -0.35, -2.72], [0, -0.35, -3.12], [0, 1.25, -3.6], [0, 1.25, -3.28]);                                     // rudder, hung on the raked transom
      for (const [z, b, y] of [[-1.9, 1.1, 0.86], [-0.3, 1.2, 0.82], [1.3, 1.0, 0.88]]) hl.push([[-b, y, z], [b, y, z]]);      // thwarts
      for (const x of [-0.42, 0, 0.42]) hl.push([[x, 0.86, -2.9], [x, 0.84, -0.4], [x * 0.8, 0.92, 2.0]]);                    // planks
      hl.push([[0, 1.0, MASTZ], [0, MASTTOP, MASTZ]]);                                                                        // mast
      hl.push([[0, 1.58, 3.5], [0, 2.02, 5.45]], [[0, 2.02, 5.45], [0, MASTTOP - 0.5, MASTZ]]);                               // bowsprit, forestay
      hl.push([[0, 1.3, -3.4], [0.1, 1.62, -2.2]]);                                                                           // tiller
      for (const s of [-1, 1]) hl.push([[s * 1.2, 1.02, 0.3], [0, MASTTOP - 0.9, MASTZ]]);                                    // shrouds
    }
    {
      // the lugsail, set out to port 30 degrees (the rig group mirrors it when she gybes): d = metres aft of the mast
      const sb = Math.sin(30 * DEG), cb = Math.cos(30 * DEG), TK = [-1.0, TACKY], CW = [3.9, 2.25], PK = [3.3, 9.45], TH = [-1.3, 7.0];
      const sail = (u, v) => {
        const fd = TK[0] + (CW[0] - TK[0]) * u, fy = TK[1] + (CW[1] - TK[1]) * u, hd = TH[0] + (PK[0] - TH[0]) * u, hy = TH[1] + (PK[1] - TH[1]) * u;
        const d = fd + (hd - fd) * v, y = fy + (hy - fy) * v - 0.3 * Math.sin(Math.PI * u) * (1 - v) * (1 - v), bel = 0.5 * Math.sin(Math.PI * Math.min(u * 1.1, 1)) * Math.sin(Math.PI * (0.1 + 0.8 * v));
        return [d * sb + bel * cb, y, MASTZ - d * cb + bel * sb];
      };
      const NU = 6, patch = (v0, v1, nv) => { for (let j = 0; j < nv; j++) for (let i = 0; i < NU; i++) { const a = v0 + (v1 - v0) * j / nv, b = v0 + (v1 - v0) * (j + 1) / nv; quad(sp, sail(i / NU, a), sail((i + 1) / NU, a), sail((i + 1) / NU, b), sail(i / NU, b)); } };
      patch(0, 0.25, 2); patch(0.275, 1, 5);                                                                                   // the reef band: a slit of what lies behind
      for (const u of [0.2, 0.4, 0.6, 0.8]) { const seam = []; for (let j = 0; j <= 6; j++) { const v = 0.3 + 0.68 * j / 6; seam.push(sail(u, v)); } sl.push(seam); }   // cloths
      const y0 = sail(-0.1, 1), y1 = sail(1.08, 1); sl.push([[y0[0] - 0.06, y0[1] + 0.05, y0[2]], [y1[0] - 0.06, y1[1] + 0.05, y1[2]]]);                                // the yard
      // (true 2) reef points: two rows of short ties between the cloths, so that a sail in one ink (black on the disc,
      // white off it) carries its own line-work and reads as a sail at any size, never as a blank pane
      for (const v of [0.46, 0.64]) for (const u of [0.1, 0.3, 0.5, 0.7, 0.9]) sl.push([sail(u, v), sail(u, v - 0.06)]);
      // the jib: tack on the bowsprit end, head on the mast, clew a little out to port
      const JT = [0, 2.05, 5.4], JH = [0, 8.2, MASTZ + 0.25], JC = [0.75, 2.2, 1.55], NJ = 4;
      const jib = (a, b) => { const k = 0.3 * Math.sin(Math.PI * Math.min(a + b, 1)) * Math.sin(Math.PI * b); return [JT[0] + (JH[0] - JT[0]) * a + (JC[0] - JT[0]) * b + k, JT[1] + (JH[1] - JT[1]) * a + (JC[1] - JT[1]) * b, JT[2] + (JH[2] - JT[2]) * a + (JC[2] - JT[2]) * b]; };
      for (let i = 0; i < NJ; i++) for (let j = 0; j < NJ - i; j++) {
        const A = jib(i / NJ, j / NJ), Bq = jib((i + 1) / NJ, j / NJ), C = jib(i / NJ, (j + 1) / NJ); sp.push(...A, ...Bq, ...C);
        if (j < NJ - i - 1) { const D = jib((i + 1) / NJ, (j + 1) / NJ); sp.push(...Bq, ...D, ...C); }
      }
      for (const c of [0.42, 0.7]) { const seam = []; for (let i = 0; i <= 4; i++) seam.push(jib(c * (1 - i / 4), c * i / 4)); sl.push(seam); }   // (true 2) the jib's two seams, parallel to its leech
    }
    const boatInk = S.figure({ gate: true }), boatMask = S.figure({ gate: true });
    boatMask.colorWrite = false; boatMask.depthWrite = true; boatMask.polygonOffset = true; boatMask.polygonOffsetFactor = 1; boatMask.polygonOffsetUnits = 3;
    const boatLine = S.line({ figure: true, gate: true });
    // (true 2) ON THE DISC A FIGURE IS ONE SOLID INK (the brief as amended, 17:50 UTC: "white on the dark and black the
    // instant it crosses the light"). A boat that crosses the moon's disc is painted black there, with her own line-work
    // (ribs, seams, reef points, rigging: exclusive-or lines, so they come out white on her) and the moon's limb as her
    // hard edge; off the disc she is exclusive-or as everywhere (white on the dark, black on the road). Two passes of
    // the same geometry, as the live version drew it: discInk (exclusive-or, not on the disc) and discSolid (the solid
    // ink, only on the disc). The crescent's old moon is 25 per cent: there figures stay exclusive-or.
    const discU = { uK: U.uK, uW: U.uW, uGateP: U.uGateP, uGateN: U.uGateN, uGateDim: U.uGateDim, uMoonDir: U.uMoonDir, uMoonTan: U.uMoonTan, uSolid: { value: crescent ? 0 : 1 } };
    const DISC_VERT = /* glsl */`varying vec3 vGw;
void main(){ vGw = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vGw, 1.0); }`;
    const discFrag = (solid) => /* glsl */`uniform vec3 uK; uniform vec3 uW; uniform vec3 uMoonDir; uniform float uMoonTan; uniform float uSolid; varying vec3 vGw;${S.gateGlsl}
void main(){
  if (obGated(vGw)) discard;
  vec3 d = vGw - cameraPosition; d = d / max(length(d), 1e-4);
  bool onDisc = uSolid > 0.5 && d.y > 0.0 && dot(d, uMoonDir) > inversesqrt(1.0 + uMoonTan * uMoonTan);
  ${solid ? 'if (!onDisc) discard; gl_FragColor = vec4(uK, 1.0);' : 'if (onDisc) discard; gl_FragColor = vec4(uK + uW, 1.0);'}
}`;
    const discInk = new THREE.ShaderMaterial({ uniforms: discU, vertexShader: DISC_VERT, fragmentShader: discFrag(false), side: THREE.DoubleSide, ...S.xorBlend });
    const discSolid = new THREE.ShaderMaterial({ uniforms: discU, vertexShader: DISC_VERT, fragmentShader: discFrag(true), side: THREE.DoubleSide, transparent: true, depthWrite: false });
    // (true 1) "where two sails overlap, the overlap flips back" (off the disc): each boat's depth copy stops her flipping herself, and
    // the boats are drawn one after another from the farthest to the nearest (rankFigs, every frame), each her depth
    // copy, then her ink, then her lines, so a nearer sail flips the farther one behind it and never hides it.
    const figs = [], figP = new THREE.Vector3(), figC = new THREE.Vector3();
    const rankFigs = (camera) => {
      figC.setFromMatrixPosition(camera.matrixWorld);
      for (const f of figs) { if (f.ref.matrixAutoUpdate) figP.copy(f.ref.position); else { if (f.loc) figP.copy(f.loc); else figP.set(0, 0, 0); figP.applyMatrix4(f.ref.matrix); } f.d = figP.distanceToSquared(figC); }
      figs.sort((a, b) => b.d - a.d);
      for (let i = 0; i < figs.length; i++) { const o = 3.1 + i * 0.01; for (const m of figs[i].masks) m.renderOrder = o; for (const m of figs[i].inks) m.renderOrder = o + 0.003; for (const m of figs[i].lines) m.renderOrder = o + 0.006; }
    };
    const boatParts = [], ourFig = { ref: boat, loc: null, masks: [], inks: [], lines: [], d: 0 };
    figs.push(ourFig);
    for (const [arr, parent] of [[hp, boat], [sp, rig]]) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      const mask = new THREE.Mesh(g, boatMask); mask.renderOrder = 3; const ink = new THREE.Mesh(g, discInk); ink.renderOrder = 5; const solid = new THREE.Mesh(g, discSolid); solid.renderOrder = 5;
      mask.frustumCulled = ink.frustumCulled = solid.frustumCulled = false; parent.add(mask, ink, solid); boatParts.push(mask, ink, solid); ourFig.masks.push(mask); ourFig.inks.push(ink, solid);
    }
    for (const [lines, parent, hw] of [[hl, boat, 0.035], [sl, rig, 0.03]]) {
      const m = new THREE.Mesh(S.ribbon(lines, hw), boatLine); m.frustumCulled = false; m.renderOrder = 6; parent.add(m); boatParts.push(m); ourFig.lines.push(m);
    }
    await ctx.yield();
    // ---- more boats from the same lines (polish 1). bake() sets a copy of the lugger down in some frame: o = { x, z,
    //      yaw, scale, side (which way the sail lies), hoist (0.3: the yard lowered, a boat on her mooring) }. ----
    const bake = (T, Ln, o) => {
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw), k = o.scale;
      const pt = (x, y, z, rigged) => { if (rigged) { x *= o.side; y = TACKY + (y - TACKY) * o.hoist; } return [o.x + (x * c + z * s) * k, y * k, o.z + (-x * s + z * c) * k]; };
      for (const [arr, rigged] of [[hp, false], [sp, true]]) for (let i = 0; i < arr.length; i += 3) { const q = pt(arr[i], arr[i + 1], arr[i + 2], rigged); T.push(q[0], q[1], q[2]); }
      // o.seam: the half width (m) of her cloth seams, reef points and jib seams (every rig line but the yard, the fifth)
      for (const [arr, rigged] of [[hl, false], [sl, true]]) arr.forEach((line, i) => Ln.push(line.map((p) => { const q = pt(p[0], p[1], p[2], rigged); if (rigged && o.seam && i !== 4) q.push(o.seam); return q; })));
    };
    // depth copy, ink and lines of one baked set: three draw calls. isBoat: the set is one boat, standing at this point of
    // its parent's frame (or at the parent's own place): it takes its turn among the boats, farthest first (rankFigs).
    // Sets of many small things (the buoys) are drawn before every boat.
    const figureSet = (T, Ln, parent, hw, isBoat = false, loc = null) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(T, 3));
      const mask = new THREE.Mesh(g, boatMask); mask.renderOrder = 3.05; const ink = new THREE.Mesh(g, isBoat ? discInk : boatInk); ink.renderOrder = 3.053;
      const ln = new THREE.Mesh(S.ribbon(Ln, hw), boatLine); ln.renderOrder = 3.056;
      const all = [mask, ink, ln], inks = [ink];
      if (isBoat) { const solid = new THREE.Mesh(g, discSolid); solid.renderOrder = 3.053; all.push(solid); inks.push(solid); }   // a boat is one solid ink on the moon's disc
      for (const m of all) { m.frustumCulled = false; parent.add(m); }
      if (isBoat) figs.push({ ref: parent, loc, masks: [mask], inks, lines: [ln], d: 0 });
      return all;
    };
    // the great luggers: half as large again as ours, close enough that their sails stand over the eye (white on the sky,
    // on the disc one solid black with their own white seams, yard and reef points, the limb a hard curve across the
    // canvas: true 2). (polish 4) They no longer cross the bow: see JUNKS below.
    // Keyed to u like the full-rigger; when she comes (the rare event) they are not there: the sea is hers.
    const mooredBoats = [];
    const junks = new THREE.Group(); junks.matrixAutoUpdate = false; junks.visible = !rare; scene.add(junks);
    const laneW = hero.anchors.fleetLane.direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), heroRot).setY(0).normalize();
    const junk0 = path.pointAt(0.43).setY(0), JU = 0.43;
    const junkRun = (u) => JSPEED * (u - JU) * DURATION;                      // (fleet 1) how far along her track a great lugger is at the share u: said once, for her own sailing and for THE FLEET'S BERTH
    // (polish 4) they no longer cross the bow: they run the north-east leg WITH us (at 4 m/s then; at the fleet's 6 since true 1) on our own heading, and we
    // overhaul them one after another close to port, so that each in turn stands tall between the eye and the moon
    // (u 0.34, 0.43, 0.52), with two more out to starboard. [metres ahead of the eye's place at u 0.43, metres to starboard]
    const junkDir = path.tangentAt(JU).setY(0).normalize();
    // (polish 5) STAGED FOR THE EYE: [m ahead, m to starboard, scale, yaw to port, which way the sail lies]. The first is
    // passed close to port at u 0.34 as before. At 0.43 we go BETWEEN TWO, the gaze off the moon to starboard: the port
    // one's sail broadside and black on the disc's limb, the starboard one's white on the sky. At 0.52 a fourth stands
    // broadside 17 m off between the eye and the moon and hides its middle: the limb is drawn across her canvas.
    // (true 1) AT THE FLEET'S SPEED: "the fleet sailing at 6 m/s" (they ran at 4). Fixed straight tracks on the map, 8.3 to
    // 11.3 m off the beams ("nearest hulls 8 m off each beam"), never keyed to the eye. We overhaul them more slowly, so
    // the first is set 7.6 m further up her track, the second 4.2 m and the fourth 7.6 m further back: each stands where
    // she stood in the still she was staged for (0.34, 0.475, 0.52), and at 0.565 the fourth is 4 m further ahead than she
    // was, her mast and hull in the frame and the moon's limb drawn through her sail.
    // (true 2) WHERE THEY STAND, so that no sail is a slab. Live's fault at u 0.475 and 0.565 (a sail blotting out half the
    // moon, a white pane over the left third) came of overhauling a 16 m sail at 4 to 5 m/s, 8 to 11 m off: she stood
    // large in the frame for four seconds. Mended by where each stands on her fixed straight track, never by holding her
    // off the eye. The first and the second are the brief's own size and distance now ("luggers 9 m long", "nearest
    // hulls 8 m off each beam": 8.4 and 7.1 m long by our lines, passed 7.4 and 7.3 m off): seen from the same bearing
    // they are the same picture at u 0.34 and 0.43, and they pass out of the frame in half the time. The fourth keeps her
    // size and sails a track of her own, due north (ours is 49 degrees east of north there), at the same 6 m/s, her sail
    // to starboard: she comes up on the starboard bow white on the sky (0.475), crosses the disc black, 15.5 m off and
    // broadside (0.52: "goes in white, is black inside and comes out white"), and stands away to port, never nearer
    // than 13.6 m; by 0.565 she is out of the frame and the moon is whole. A sixth number is a track of her own, in
    // degrees east of north; her metres ahead and to starboard are then measured along and across that track.
    // (true 2) UNDER THE MOON, where the glitter was (u 0.655 to 0.745): three more of the fleet's luggers, the brief's
    // size (9 m by our lines), on the fleet's own heading ("the fleet crosses it on a slant from left to right"), 105
    // degrees east of north at 6 m/s. Two sail 42 m apart between us and the skerry; the third crosses 60 m nearer, ahead
    // of our course: on the disc 80 m off at u 0.565, under its middle at 0.61, off its right limb by 0.70. Each "goes
    // in white, is black inside and comes out white" across the disc's foot, and each "drags a wake of six dashes" over
    // the water the glitter lay on. Fixed tracks on the map; nothing in them knows where the eye is.
    const JSPEED = 6, JUNKS = [[-7.9, -7.5, 1.2, 0.05, 1], [12.7, -7.4, 1.01, -0.1, 1], [19.5, 8.3, 1.4, -0.1, -1], [21.4, 34.7, 1.6, 0.3, -1, 0], [80, 17, 1.3, 0.1, 1], [108, 30, 1.2, -0.04, 1], [132, 15, 1.3, 0.06, 1],
      [-43, -195.5, 1.3, 0.12, 1, 105], [-1, -195.5, 1.3, 0.12, 1, 105], [-9.9, -134.8, 1.35, 0.12, 1, 105]];
    const junkGroups = [junks];
    {
      const UPV = new THREE.Vector3(0, 1, 0);
      junks.userData = { dir: junkDir, basis: new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(UPV, junkDir), UPV, junkDir), wp: [], wa: [], wk: [] };
      // (true 1) each is a figure of her own (her sail flips the one behind it), and each drags the fleet's wake: "each
      // drags a wake of six dashes", "wakes shortening astern". The dashes lie along her track, pinned to her, on the water.
      const byHdg = new Map();
      for (const [f, r, scale, yaw, side, hdg] of JUNKS) {
        let g = hdg == null ? junks : byHdg.get(hdg);
        if (!g) {                                                             // a track of her own: a group for that heading, moved along it
          const dir = new THREE.Vector3(-Math.sin(hdg * DEG), 0, Math.cos(hdg * DEG));
          g = new THREE.Group(); g.matrixAutoUpdate = false; g.visible = !rare; scene.add(g); junkGroups.push(g); byHdg.set(hdg, g);
          g.userData = { dir, basis: new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(UPV, dir), UPV, dir), wp: [], wa: [], wk: [] };
        }
        const T = [], Ln = [], x = -r, z = f, d = g.userData;                 // the group's frame: +x port, +z along the track
        bake(T, Ln, { x, z, yaw, scale, side, hoist: 1, seam: 0.045 * scale });
        figureSet(T, Ln, g, 0.05, true, new THREE.Vector3(x, 0, z));
        for (let k = 0; k < 6; k++) for (const t of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { d.wp.push(t[0], 0, t[1]); d.wa.push(x, z, yaw, scale); d.wk.push(k); }
        await ctx.yield();
      }
      const wm = new THREE.ShaderMaterial({ uniforms: { uK: U.uK, uW: U.uW, uPx: U.uPx, uTime: U.uTime, uSeaY: U.uSeaY }, side: THREE.DoubleSide, ...S.xorBlend,
        vertexShader: /* glsl */`attribute vec4 aW; attribute float aK; uniform float uTime; uniform float uPx; uniform float uSeaY;
void main(){
  float k = aW.w;
  float s = (aK + fract(uTime * ${(JSPEED / 3.0).toFixed(3)} / k + aW.x * 0.37)) * 3.0 * k;   // six dashes 3 m apart (by her size), left astern at her own speed
  float hl = 1.1 * k * max(1.0 - s / (18.0 * k), 0.0);                                          // shortening astern, to nothing
  float c = cos(aW.z), sn = sin(aW.z);
  vec2 g = vec2(aW.x - 3.6 * k * sn, aW.y - 3.6 * k * c - s + position.x * hl);                 // from her stern, back along her track
  vec4 wpos = modelMatrix * vec4(g.x, 0.0, g.y, 1.0); wpos.y = uSeaY + 0.05;                   // on the water, not on her: she bobs, the sea does not
  vec4 mv = viewMatrix * wpos;
  vec3 sdv = mat3(modelViewMatrix) * vec3(1.0, 0.0, 0.0);
  float hw = hl > 0.0 ? max(0.2 * k, 1.7 * max(-mv.z, 0.0) / max(uPx, 1.0)) : 0.0;             // (true 2) a stroke 0.4 m wide by her size and never under 3.4 px (it was 0.26 m and 1.5 px, and read as one more of the sea's dashes)
  mv.xyz += sdv * position.z * hw;
  gl_Position = projectionMatrix * mv;
}`, fragmentShader: /* glsl */`uniform vec3 uK; uniform vec3 uW; void main(){ gl_FragColor = vec4(uK + uW, 1.0); }` });
      for (const g of junkGroups) {
        const d = g.userData, wg = new THREE.BufferGeometry();
        wg.setAttribute('position', new THREE.Float32BufferAttribute(d.wp, 3)); wg.setAttribute('aW', new THREE.Float32BufferAttribute(d.wa, 4)); wg.setAttribute('aK', new THREE.Float32BufferAttribute(d.wk, 1));
        const wakes = new THREE.Mesh(wg, wm); wakes.frustumCulled = false; wakes.renderOrder = 2; g.add(wakes);
      }
    }
    await ctx.yield();
    // ---- (polish 4) THINGS IN THE WATER. The sea was rows of dashes and nothing else for the lower third of most stills.
    //      Now the course is buoyed: can buoys with a staff and a topmark (a lamp, a cone or a ball), a band round the body,
    //      rings of ripple round the foot; drift nets as dotted lines of floats running out from some of them; and five
    //      rowing skiffs fishing by lantern, an oarsman in each. All exclusive-or like everything afloat (white on the black
    //      sea, black on the road), built from the same depth-copy, ink and line materials as our boat. ----
    // (r9) THE TWO MOORED HULLS WE PASS BETWEEN (polish 5: THROUGH THE MOORINGS, built with the moorings below), typed
    // ONCE, here, and read by their own build and by the buoys' walk, which deals no buoy between them:
    // [share of the course's length, m ahead of it, m to starboard, yaw off the course, scale]. Today route metres 397.0
    // (6 m to port) and 391.0 (9 m to starboard) of 475.9.
    const HULLS_AT = [[0.79, 21, -6, -0.3, 1.6], [0.79, 15, 9, -2.1, 1.35]];
    // (r9t) THE MOORED BOATS' PLACES, said ONCE, here, and read by their own build ("boats on their moorings", below)
    // and by the buoys' walk, which deals nothing within a berth of a moored boat (byMoored). The typed table is the
    // moorings' own, moved here from their loop with every number as it stood: [the brief's x (east), z, yaw, scale].
    // Eight lie in the cove off both shores and seven off the skerry by the arch; the two on the course (HULLS_AT)
    // follow them: seventeen, numbered 1 to 17 in this order.
    const MOORED_AT = [[-22, 34, 0.5, 1.1], [-31, 58, -0.4, 1.25], [-24, 82, 0.9, 1], [-38, 104, 0.2, 1.2], [21, 46, -0.7, 1.05], [15, 63, 0.4, 1.2], [-52, 70, 1.4, 1.3], [-36, 130, -0.3, 1.1],
      [176, 335, 1.2, 1.2], [192, 289, 1.9, 1.1], [137.4, 272.6, 1.4, 1.25], [197, 330, 2.2, 1], [140, 337, 0.9, 1.15],
      [152, 322, 1.7, 1.45], [195, 278.6, 1.3, 1.35]];
    // the two on the course, by HULLS_AT's row: [x, z on the map, yaw, scale, on the course] (the moorings' own line, moved)
    const onCourse = (u, ahead, lat, yaw, scale) => { const P = new THREE.Vector3(), Tn = new THREE.Vector3(), d = u * path.length + ahead; path.posAtDist(d, P); path.tangentAtDist(d, Tn); const h = Math.hypot(Tn.x, Tn.z) || 1; return [P.x - Tn.z / h * lat, P.z + Tn.x / h * lat, Math.atan2(Tn.x, Tn.z) + yaw, scale, true]; };
    // WHERE EACH IS BUILT, worked out once for both readers: her place on the map (p), her yaw there and her scale.
    // The moorings' own transform, moved: a typed place is the brief's (E); the seven by the arch (z over 250) stand
    // where the skerry now stands (SK) and are turned with it (SKY); the two on the course are placed by the course.
    const MOORED = [...MOORED_AT, ...HULLS_AT.map((h) => onCourse(...h))].map(([bx, bz, yaw, scale, onC]) => { const far = onC || bz > 250; return { p: onC ? new THREE.Vector3(bx, 0, bz) : (far ? SK(E(bx, 0, bz)) : E(bx, 0, bz)), yaw: far && !onC ? yaw + SKY : yaw, scale }; });
    // (r9s) OUR OWN BOAT'S TRACK, said ONCE, here, and read by her own sailing (boatAt, under "the flight" below) and by
    // the buoys' walk, which deals each buoy on the side she does not keep. It stands above the buoys' block because the
    // walk reads it before she sails. The four lines of remark, KEYS with every number and key() are live's, moved here
    // and not changed:
    // where our boat sails, against the eye: [u, metres ahead along the course, metres to starboard]. She leads us out of
    // the cove to port, lies close to starboard as we round the point (her sail broadside on the disc), runs ahead to
    // starboard down the north-east leg (the great luggers have the port side and the moon), crosses ahead onto the disc
    // through the turn, lies close to starboard through the moorings and goes into the arch ahead of us.
    const KEYS = [[0, 24, -6], [0.08, 14, 13], [0.16, 13, 7], [0.25, 18, 5.5], [0.34, 22, 6], [0.43, 34, 0], [0.52, 32, -2], [0.61, 28, -4], [0.7, 30, 5], [0.79, 32, 0], [0.87, 20, 3], [0.94, 23, 1.5], [1, 26, 0]];   // (polish 4) to starboard on the north-east leg (the great luggers have the port side and the moon), to starboard again through the moorings
    const key = (u, c) => { let i = 0; while (i < KEYS.length - 2 && u > KEYS[i + 1][0]) i++; const A = KEYS[i], B = KEYS[i + 1]; return A[c] + (B[c] - A[c]) * sstep(A[0], B[0], u); };
    // (r9s) HER ROUTE METRE when the eye is at the share u of the course: the eye's own metres and her metres ahead; her
    // metres to starboard there are key(u, 2). Said once, for boatAt and for the walk. It rises with u over the whole
    // flight (she never falls back along the course: where her metres ahead shrink fastest, coming out of the moorings,
    // she makes 250 m to the eye's 476), so she is at any route metre once, at one u.
    const boatM = (u) => u * path.length + key(u, 1);
    const flotsam = [], skiffs = [];
    {
      const fr = vr.fork('one-bit-flotsam'), PL = path.length, P = new THREE.Vector3(), Tn = new THREE.Vector3();
      const sets = [0, 1, 2].map(() => ({ T: [], Ln: [] }));
      const at = (s, lat) => { path.posAtDist(s, P); path.tangentAtDist(s, Tn); const h = Math.hypot(Tn.x, Tn.z) || 1; return [P.x - Tn.z / h * lat, P.z + Tn.x / h * lat, Math.atan2(Tn.x, Tn.z)]; };
      const lamp = (Ln, x, y, z, k) => {
        Ln.push([[x, y - 0.36 * k, z, 0], [x, y, z, 0.27 * k], [x, y + 0.36 * k, z, 0]]);
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]]) Ln.push([[x + dx * 0.6 * k, y + dy * 0.6 * k, z + dz * 0.6 * k], [x + dx * 1.0 * k, y + dy * 1.0 * k, z + dz * 1.0 * k]]);
      };
      const ring = (Ln, x, z, r, a0, a1, hw) => { const n = Math.max(5, Math.round(Math.abs(a1 - a0) * 4)), l = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; l.push([x + Math.cos(a) * r, 0.05, z + Math.sin(a) * r * 0.8, hw]); } Ln.push(l); };
      const buoy = (S3, x, z, k, kind) => {
        const { T, Ln } = S3, r0 = 0.55 * k, r1 = 0.3 * k, yt = 1.25 * k;
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832, b = (i + 1) / 6 * 6.2832; quad(T, [x + Math.cos(a) * r0, -0.15, z + Math.sin(a) * r0], [x + Math.cos(b) * r0, -0.15, z + Math.sin(b) * r0], [x + Math.cos(b) * r1, yt, z + Math.sin(b) * r1], [x + Math.cos(a) * r1, yt, z + Math.sin(a) * r1]); }
        Ln.push([[x, yt, z], [x, 2.5 * k, z]]);
        if (kind === 0) lamp(Ln, x, 2.9 * k, z, 0.8 * k);
        else if (kind === 1) Ln.push([[x, 2.1 * k, z, 0.34 * k], [x, 2.85 * k, z, 0]]);
        else Ln.push([[x, 2.3 * k, z, 0], [x, 2.6 * k, z, 0.28 * k], [x, 2.9 * k, z, 0]]);
        const band = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * 6.2832; band.push([x + Math.cos(a) * 0.45 * k, 0.62 * k, z + Math.sin(a) * 0.45 * k, 0.09 * k]); } Ln.push(band);
        const a0 = fr() * 6.2832; ring(Ln, x, z, 1.25 * k, a0, a0 + fr.range(2.2, 3.6), 0.045); ring(Ln, x, z, 2.2 * k, a0 + 2.6, a0 + 2.6 + fr.range(1.6, 3), 0.04); ring(Ln, x, z, 3.3 * k, a0 + 0.8, a0 + 0.8 + fr.range(1, 2), 0.035);
      };
      const SAG = 0.12;                                                      // (r9) the most a net sags off its straight line, as a share of its length: typed once, for net() and for the lit nets' berth in the walk (byLit)
      const net = (S3, x0, z0, x1, z1) => {                                  // a drift net: a sagging dotted line of floats to a small end buoy
        const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.25), nx = -(z1 - z0), nz = x1 - x0, nl = Math.hypot(nx, nz) || 1, sag = fr.range(-SAG, SAG);
        for (let i = 2; i < n; i++) { const t = i / n, o = Math.sin(Math.PI * t) * sag, x = x0 + (x1 - x0) * t + nx * o, z = z0 + (z1 - z0) * t + nz * o, dx = (x1 - x0) / nl * 0.27, dz = (z1 - z0) / nl * 0.27; S3.Ln.push([[x - dx, 0.06, z - dz, 0.13], [x + dx, 0.06, z + dz, 0.13]]); }
        buoy(S3, x1, z1, 0.6, 2);
      };
      // (r9s) THE BUOYS KEEP THE SIDE OUR OWN BOAT DOES NOT KEEP, read from her own track (KEYS, key, boatM: the numbers
      // that sail her). A buoy dealt at route metre s takes the side opposite to where SHE lies when she is at route
      // metre s herself: herU finds the one u at which her route metre is s (boatM rises with u, so 52 halvings of 0
      // to 1 close on it), her metres to starboard there are key(u, 2), and the buoy's side is the other one. As the
      // track stands today she is to port from her start to route metre 35.1, to starboard to 238.6, to port to 339.0
      // and to starboard from there on (touching the course's line at 408.0); those metres are worked out, not typed,
      // and move with KEYS and the course. Where she lies on the course's line itself (0 to starboard: one route
      // metre here and there) the side is what r9 had there, and that is the ONLY reading left of the typed table stb
      // and its lag of 0.05 of the course; the table said "the side our own boat keeps" and did not hold it (to port
      // below 0.12 of the course, where she is 3.5 to 13 m to starboard from route metre 38 on: she sailed through
      // the buoys of the cove's mouth). No clock, no place of the eye, no seed and no lens is asked.
      const stb = (u) => (u < 0.12 ? -1 : (u < 0.57 ? 1 : (u < 0.66 ? -1 : 1)));   // (r9s) r9's typed sides, read only where she lies on the course's line itself (sideAt)
      const herU = (s) => { let a = 0, b = 1; for (let i = 0; i < 52; i++) { const m = (a + b) / 2; if (boatM(m) < s) a = m; else b = m; } return (a + b) / 2; };
      const sideAt = (s) => { const l = key(herU(s), 2); return l > 0 ? -1 : (l < 0 ? 1 : -stb(s / PL - 0.05)); };   // +1: the buoy to starboard, -1: to port
      // (cure 8) THE FOURTH SKIFF'S PLACE: typed 1 m to port of the course she carried the top ray of her lantern (3.3 m over
      // her keel) through the lens's own line, and a world entered through a portal arrives with its clock already running, so
      // she may stand anywhere on her to-and-fro when the eye comes by. She is typed 4.16 m to port, where her whole figure
      // (hull, oars and puddles, oarsman, pole, lantern and rays, wake) through the whole of her to-and-fro, bob, roll and
      // pitch keeps 2.0 m of clear air from the course's whole line (2.013 m, counted by geometry over every phase at once;
      // 4.15 m gives 2.004 m). Her place along the course, yaw and phase stay.
      // (r9) THE SKIFFS AND THE LIT BUOYS ARE PLACES OF THE WORLD. Each row is typed as a share of the course's length plus
      // metres ahead of it, and metres to starboard (minus: to port); the numbers are live's, bit for bit; none is moved.
      // By place (route metres of the 475.9 m course, as they fall today):
      //   skiff 1: route m 20.5, 7.5 m to port: in the cove, on the black water west of the road, between the course and
      //     the west headland's moorings (beat "the entry, out of the cove": "close to port on black water").
      //   skiff 2: route m 175.8, 4.5 m to port: on the north-east leg, between the course and the first great lugger
      //     (beat "under the first great lugger": "between us and her").
      //   skiff 3: route m 217.6, 1.5 m to starboard: in the lane between the two great luggers (beat "between two great
      //     luggers": "a skiff rowing dead ahead"). Her oarsman's head comes within 0.39 m of the course's line: live's,
      //     named and left by the owner's ruling of cure 8.
      //   skiff 4: route m 257.5, 4.16 m to port: on the north-east leg past the two great luggers (beat "the eclipse;
      //     the terns go up"); her berth is the remark above.
      //   skiff 5: route m 363.1, 9 m to port: on the turn back to the north-west, the eye coming down from the mastheads'
      //     height, 5.3 m up there (beat "from mast height, the harbour").
      //   skiff 6: route m 432.0, 3 m to starboard: under the skerry's wall, 44 m short of the course's end at the arch
      //     (beat "under the wall"). Her wake lies 1.86 m under the course's line: live's, named and left (cure 8).
      //   lit buoy 1: route m 52.1, 5 m to port; its net runs out to 20 m to port at route m 57.1: in the cove, between
      //     the course and the west headland (beat "our lugger crosses the bow").
      //   lit buoy 2: route m 133.0, 5 m to port; net to 20 m to port at 138.0: where the course bears away north-east.
      //   lit buoy 3: route m 303.3, 5.5 m to port; net to 20.5 m to port at 308.3: on the turn to port under the terns,
      //     the eye 7.4 m up (beat "the moon again; the terns").
      //   lit buoy 4: route m 367.1, 4 m to starboard; net to 19 m to starboard at 372.1: above the moorings, 24 m before
      //     the nearer of the two moored hulls (beat "from mast height, the harbour").
      const SK_AT = [[0.02, 11, -7.5, 0.4], [0.34, 14, -4.5, 0.3], [0.43, 13, 1.5, -0.5], [0.52, 10, -4.16, -0.3], [0.7, 30, -9, 0.6], [0.87, 18, 3, -0.3]];   // skiffs: [share of the course's length, m ahead of it, m to starboard, yaw off the course]
      const FORE = [[0.08, 14, -5], [0.25, 14, -5], [0.61, 13, -5.5], [0.7, 34, 4]];                                          // lit buoys: [share of the course's length, m ahead of it, m to starboard]
      // each lit buoy's place (q) and the far end of its net (o: 5 m further on, 15 m further out on its own side), said
      // once: read by the walk's berth (byLit) and by their own build after the walk
      const LIT = FORE.map(([u, ahead, lat]) => ({ q: at(u * PL + ahead, lat), o: at(u * PL + ahead + 5, lat + Math.sign(lat) * 15) }));
      // (r9) ONE WALK DEALS THE BUOYS ALONG THE WHOLE COURSE ALIKE: live's stride, distance off the course, sizes, kinds
      // by turn, nets and far marks; (r9s) the side is sideAt's, by our own boat's track, and no longer live's table.
      // What is excepted is excepted by PLACE, in four ways and no other (the fourth is r9t's):
      //   1. no dealt buoy within CLEAR (7 m) along the course of a skiff's place (live's);
      //   2. none between the two moored hulls we pass through: from HULL_CLEAR (9 m) before the nearer hull's place
      //      along the course to 9 m past the further one's (live's own extent, said by the hulls' places, HULLS_AT);
      //   3. none within CLEAR (7 m) on the map of a lit buoy, of its net's end buoy or of anywhere its line of floats
      //      may lie (byLit). A net's sag is dealt after the walk, so the law takes every sag net() can deal: at the
      //      share t of the straight line from the lit buoy to the end buoy the floats lie within SAG x its length x
      //      sin(pi t) of it, on either side. The line is taken in 256 strips, each widened by half a strip along and by
      //      what the sine can rise within half a strip across, so the strips cover that whole lens and the law errs
      //      only by keeping a buoy up to 0.03 m further off than 7 m.
      //   4. (r9t) NO DEALT THING WITHIN CLEAR (7 m) ON THE MAP OF A MOORED BOAT'S KEEL LINE (byMoored): her own length,
      //      stern to stem (KEEL: read from the lugger's hull as built, the rudder's heel to the stem), at her own scale
      //      and yaw, where she is built (MOORED, said once above this block and read by her own build). It is one law
      //      for all seventeen and for every dealt thing: a dealt buoy's place, a far mark's place, and a dealt net,
      //      which is its end buoy and anywhere its line of floats may lie with every sag net() can deal (the lens of
      //      rule 3, taken in the same 256 strips, each a stroke across the net's line widened as there; the law errs
      //      only by keeping a net up to 0.11 m further off than 7 m). As in rule 3 the place is dealt first, with the
      //      draws it always took, and a place inside the berth is left unbuilt. A buoy in the berth is left with its
      //      net and far mark, as by a lit buoy. A far mark in the berth is left and its near buoy stays. A net that
      //      would lie in the berth is not laid and its buoy stays: the buoy is built (its size and arcs drawn) before
      //      its net's place is dealt, so to leave the buoy too would be to deal the net's place before the buoy and
      //      reorder the stream; and the buoy itself stands clear.
      // The far marks and the dealt buoys' own nets are under the fourth only, and under none of the first three, as in
      // live. The law asks no clock, no place of the eye, no seed and no lens, and holds no list of positions.
      const CLEAR = 7, HULL_CLEAR = 9, HULL_M = HULLS_AT.map((h) => h[0] * PL + h[1]), HULL_0 = Math.min(...HULL_M) - HULL_CLEAR, HULL_1 = Math.max(...HULL_M) + HULL_CLEAR;
      const byLit = (x, z) => LIT.some(({ q, o }) => {
        const ex = o[0] - q[0], ez = o[1] - q[1], len = Math.hypot(ex, ez), a = ((x - q[0]) * ex + (z - q[1]) * ez) / len, b = Math.abs((x - q[0]) * ez - (z - q[1]) * ex) / len, N = 256;
        for (let i = 0; i <= N; i++) if (Math.hypot(Math.max(Math.abs(a - len * i / N) - len / (2 * N), 0), Math.max(b - SAG * len * (Math.sin(Math.PI * i / N) + Math.PI / (2 * N)), 0)) < CLEAR) return true;
        return false;
      });
      // (r9t) the moored boats' keel lines on the map, [stern x, z, stem x, z], and the berth's readers (rule 4)
      const KEEL = [0, 0]; for (let i = 2; i < hp.length; i += 3) { KEEL[0] = Math.min(KEEL[0], hp[i]); KEEL[1] = Math.max(KEEL[1], hp[i]); }
      const KEELS = MOORED.map(({ p, yaw, scale }) => { const kx = Math.sin(yaw) * scale, kz = Math.cos(yaw) * scale; return [p.x + kx * KEEL[0], p.z + kz * KEEL[0], p.x + kx * KEEL[1], p.z + kz * KEEL[1]]; });
      const dPS = (x, z, ax, az, bx, bz) => { const ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez, t = l2 > 0 ? Math.min(Math.max(((x - ax) * ex + (z - az) * ez) / l2, 0), 1) : 0; return Math.hypot(x - ax - ex * t, z - az - ez * t); };   // from a place to a stroke, on the map
      // the least distance on the map from the stroke a-b to any moored boat's keel line: 0 where they cross (a place is a stroke of no length)
      const toKeel = (ax, az, bx, bz) => {
        let d = Infinity;
        for (const [cx, cz, dx, dz] of KEELS) {
          const s1 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), s2 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx), s3 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), s4 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
          d = s1 * s2 < 0 && s3 * s4 < 0 ? 0 : Math.min(d, dPS(ax, az, cx, cz, dx, dz), dPS(bx, bz, cx, cz, dx, dz), dPS(cx, cz, ax, az, bx, bz), dPS(dx, dz, ax, az, bx, bz));
        }
        return d;
      };
      const byMoored = (x, z) => toKeel(x, z, x, z) < CLEAR;
      const netByMoored = (q, o) => {                                          // a net from the buoy at q to its end buoy at o, with every sag net() can deal
        const ex = o[0] - q[0], ez = o[1] - q[1], len = Math.hypot(ex, ez), N = 256;
        for (let i = 0; i <= N; i++) { const cx = q[0] + ex * i / N, cz = q[1] + ez * i / N, w = SAG * len * (Math.sin(Math.PI * i / N) + Math.PI / (2 * N)); if (toKeel(cx - ez / len * w, cz + ex / len * w, cx + ez / len * w, cz - ex / len * w) < CLEAR + len / (2 * N)) return true; }
        return false;
      };
      let n = 0;
      for (let s = 34; s < PL - 46; s += fr.range(13, 18)) {
        const u = s / PL, side = sideAt(s), ne = u > 0.29 && u < 0.6;
        if (SK_AT.some((q) => Math.abs(q[0] * PL + q[1] - s) < CLEAR) || (s > HULL_0 && s < HULL_1)) continue;   // by a skiff's place; (polish 5) nor between the two moored hulls we pass through
        const lat = ne ? fr.range(19.5, 23.5) : side * fr.range(8.5, 12), sd = Math.sign(lat), q = at(s, lat), S3 = sets[n % 3], kind = n % 3;   // the great luggers have the port side of the north-east leg
        if (byLit(q[0], q[1])) continue;                                         // (r9) by a lit buoy or its net: the place is dealt first (one draw), and a place inside that berth is left unbuilt
        if (byMoored(q[0], q[1])) continue;                                      // (r9t) by a moored boat: as by a lit buoy, the place is dealt first (the same one draw) and a place inside her berth is left unbuilt
        buoy(S3, q[0], q[1], fr.range(0.9, 1.2), kind);
        if (n % 3 === 1 && u > 0.2) { const o = at(s + fr.range(-6, 10), lat + sd * fr.range(13, 19)); if (!netByMoored(q, o)) net(S3, q[0], q[1], o[0], o[1]); }   // (r9t) a net that would lie in a moored boat's berth is not laid; its buoy stays
        // the far mark of each pair: out on the other side, a larger buoy in the middle distance
        if (u > 0.3) { const o = at(s + fr.range(4, 12), -sd * fr.range(19, 32)); if (!byMoored(o[0], o[1])) buoy(sets[(n + 1) % 3], o[0], o[1], fr.range(1.2, 1.6), (kind + 1) % 3); }   // (r9t) a far mark in a moored boat's berth is left unbuilt; its near buoy stays
        n++;
        if (n % 6 === 0) await ctx.yield();
      }
      LIT.forEach(({ q, o }, i) => { buoy(sets[i % 3], q[0], q[1], 1.15, 0); net(sets[i % 3], q[0], q[1], o[0], o[1]); });   // the four lit buoys (a lamp, size 1.15) and their nets, at their own places
      for (const S3 of sets) { const g = new THREE.Group(); g.userData.ph = fr() * 6.2832; scene.add(g); figureSet(S3.T, S3.Ln, g, 0.045); flotsam.push(g); }
      await ctx.yield();
      for (const [u, ahead, lat, yo] of SK_AT) {
        const q = at(u * PL + ahead, lat), T = [], Ln = [], k = 0.6;
        for (let i = 0; i < hp.length; i += 3) { if (i >= rudderAt && i < rudderAt + 18) continue; T.push(hp[i] * k, hp[i + 1] * k, hp[i + 2] * k); }
        for (const line of hl.slice(0, 15)) Ln.push(line.map((p) => [p[0] * k, p[1] * k, p[2] * k]));
        for (const sg of [-1, 1]) { Ln.push([[sg * 0.7, 0.62, -0.2, 0.04], [sg * 2.5, 0.14, -0.85, 0.05], [sg * 3.05, 0.03, -1.05, 0.17]]); ring(Ln, sg * 3.0, -1.05, 0.55, 0, 6.2832, 0.035); }   // oars and their puddles
        Ln.push([[0, 0.5, -0.45, 0.2], [0, 1.22, -0.6, 0.25], [0, 1.3, -0.6, 0]], [[0, 1.36, -0.6, 0], [0, 1.55, -0.6, 0.17], [0, 1.74, -0.6, 0]]);                                           // the oarsman
        Ln.push([[0, 0.95, 2.0], [0, 2.25, 2.15]]); lamp(Ln, 0, 2.6, 2.15, 0.7);                                                                                                         // the lantern on its pole at the stem
        for (const sg of [-1, 1]) Ln.push([[sg * 0.55, 0.05, -2.1, 0.04], [sg * 1.5, 0.05, -4.6, 0.04]], [[sg * 0.9, 0.05, -5.2, 0.04], [sg * 1.9, 0.05, -7.4, 0.035]]);                 // the wake
        const g = new THREE.Group(); g.position.set(q[0], 0, q[1]); g.rotation.order = 'YXZ'; g.rotation.y = q[2] + yo; g.userData = { ph: fr() * 6.2832, x: q[0], z: q[1], dx: Math.sin(q[2] + yo), dz: Math.cos(q[2] + yo) };
        scene.add(g); figureSet(T, Ln, g, 0.035, true); skiffs.push(g);
        await ctx.yield();
      }
    }
    await ctx.yield();
    // boats on their moorings, yards lowered: in the cove off both shores, and lying off the skerry by the arch. Each
    // rides to a masthead lamp: a white lozenge with four short rays, and under it a broken column of dashes on the water.
    {
      const Ln = [], lampsW = [], dash = [], mr = rng.fork('one-bit-moorings');
      const lampAt = (x, y, z, k, lamps, dashes) => {
        if (lamps) lamps.push([[x, y - 0.36 * k, z, 0], [x, y, z, 0.27 * k], [x, y + 0.36 * k, z, 0]]);                           // the lozenge
        if (lamps) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) lamps.push([[x + dx * 0.6 * k, y + dy * 0.6 * k, z + dz * 0.6 * k], [x + dx * 1.05 * k, y + dy * 1.05 * k, z + dz * 1.05 * k]]);
        if (!dashes) return;
        for (let i = 0; i < 6; i++) { const zz = z - 1.6 - i * 1.6, hl2 = (1.5 - 0.2 * i) * k * mr.range(0.7, 1.1), xx = x + mr.range(-0.3, 0.3); quad(dash, [xx - hl2, 0.05, zz - 0.09], [xx + hl2, 0.05, zz - 0.09], [xx + hl2, 0.05, zz + 0.09], [xx - hl2, 0.05, zz + 0.09]); }
      };
      // (polish 5) THROUGH THE MOORINGS: two of them lie either side of the course at u 0.79 to 0.82, 6 m to port and 9 m to
      // starboard, large: we come down from the mastheads and pass between their hulls, bare masts, shrouds and masthead
      // lamps standing up either side of the arch ahead, the moon behind the starboard one's rigging.
      // (r9t) where each of the seventeen is built (her place, her yaw, her scale) is MOORED's, said once above the
      // buoys' block: the typed table, the two on the course (r9: HULLS_AT) and the skerry's turn for those by the arch
      // ("the five by the arch stand where the skerry now stands", live's remark on the line that stood here)
      for (const { p, yaw, scale } of MOORED) {
        // each rides in a group of her own and rocks on her mooring; her lamp is part of her lines, so it swings with the mast
        const bt = [], bl = [], g = new THREE.Group();
        bake(bt, bl, { x: 0, z: 0, yaw: 0, scale, side: mr() < 0.5 ? 1 : -1, hoist: 0.3 });
        lampAt(0, (MASTTOP + 0.5) * scale, MASTZ * scale, 1.1, bl, false);
        g.position.copy(p); g.rotation.order = 'YXZ'; g.rotation.y = yaw; g.userData.ph = mr() * 6.2832; scene.add(g); figureSet(bt, bl, g, 0.04, true); mooredBoats.push(g);
        const w = new THREE.Vector3(0, 0, MASTZ * scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(p); lampAt(w.x, 0, w.z, 1.1, null, true);
        await ctx.yield();
      }
      // the channel into the arch: withies standing in the water either side of the last straight, a lamp on each
      for (let i = 0; i < 6; i++) {
        const p = SK(E(198 - Math.floor(i / 2) * 13.5, 0, ARCH.z + (i % 2 ? 7.5 : -7.5) + mr.range(-0.6, 0.6))), lean = mr.range(-0.25, 0.25);   // (polish 4) three pairs over the last 41 m: the course now comes in from the south-east across where the outer ones stood
        Ln.push([[p.x, -0.2, p.z], [p.x + lean * 0.5, 2.0, p.z + lean], [p.x + lean, 3.6, p.z + lean * 1.6]], [[p.x + lean * 0.5 - 0.5, 2.2, p.z + lean], [p.x + lean * 0.5 + 0.5, 2.5, p.z + lean]]);
        lampAt(p.x + lean, 4.1, p.z + lean * 1.6, 0.8, lampsW, true);
      }
      const withies = new THREE.Mesh(S.ribbon(Ln, 0.05), S.line()); withies.frustumCulled = false; scene.add(withies);
      const lampMesh = new THREE.Mesh(S.ribbon(lampsW, 0.035), S.line()); lampMesh.frustumCulled = false; scene.add(lampMesh);
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dash, 3));
      const dm = new THREE.Mesh(dg, S.figure()); dm.frustumCulled = false; dm.renderOrder = 2; scene.add(dm);
    }
    await ctx.yield();
    // the bow wave: dashes peeling off both sides of the stem, shortening astern (pinned to the boat, laid on the water)
    const NW = Math.max(8, Math.round(13 * detail));
    {
      const wp = [], wa = [];
      for (const sgn of [-1, 1]) for (let k = 0; k < NW; k++) for (const t of [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]]) { wp.push(t[0], 0, t[1]); wa.push(sgn, (k + (sgn > 0 ? 0.5 : 0)) / NW, rng()); }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('aWake', new THREE.Float32BufferAttribute(wa, 3));
      const wm = new THREE.ShaderMaterial({ uniforms: { uK: U.uK, uW: U.uW, uPx: U.uPx, uTime: U.uTime, uGateP: U.uGateP, uGateN: U.uGateN, uGateDim: U.uGateDim },
        vertexShader: /* glsl */`attribute vec3 aWake; uniform float uTime; uniform float uPx; varying vec3 vGw;
void main(){
  float a = fract(uTime * 0.55 + aWake.y), sgn = aWake.x;
  float len = (1.25 - 1.05 * a) * (0.8 + 0.4 * aWake.z);
  vec2 dir = vec2(sgn * (0.62 - 0.3 * a), -1.0); dir /= max(length(dir), 1e-4);
  vec2 c = vec2(sgn * (0.12 + 3.6 * pow(a, 0.75)), ${(STEMZ - 0.2).toFixed(2)} - 9.5 * a);
  vec2 p2 = c + dir * (position.x - 0.5) * len;
  vec4 mv = modelViewMatrix * vec4(p2.x, 0.05, p2.y, 1.0);
  vGw = (modelMatrix * vec4(p2.x, 0.05, p2.y, 1.0)).xyz;
  vec2 nr = vec2(-dir.y, dir.x);
  vec3 sdv = mat3(modelViewMatrix) * vec3(nr.x, 0.0, nr.y);
  float hw = max(0.085, 1.1 * max(-mv.z, 0.0) / max(uPx, 1.0) * 2.2);
  mv.xyz += sdv * position.z * hw;
  gl_Position = projectionMatrix * mv;
}`, fragmentShader: /* glsl */`uniform vec3 uK; uniform vec3 uW; varying vec3 vGw;${S.gateGlsl}
void main(){ if (obGated(vGw)) discard; gl_FragColor = vec4(uK + uW, 1.0); }`, side: THREE.DoubleSide, ...S.xorBlend });
      const wave = new THREE.Mesh(wg, wm); wave.frustumCulled = false; wave.renderOrder = 4; boat.add(wave); boatParts.push(wave);
    }
    await ctx.yield();

    // ---- kelp: flat white ribbons lying on the black water round the point, bending as each swell row passes ----
    const kelpU = { uInk: U.uW, uPx: U.uPx, uTime: U.uTime };
    {
      // combed weed: a few clumps to starboard, three in the cove below the point and five round its prow. In a clump
      // the ribbons root in a row, lie side by side a good metre apart, lean one way with one bend and swing as one when
      // the swell row passes, so none crosses another; each is a flat band 0.34 m wide at the root, tapering to a point
      const kr2 = rng.fork('one-bit-kelp'), lines = [], along = [], taken = new Set();
      const inPlan = (pl, x, z) => { let s = 0; for (let i = 0; i < pl.length; i++) { const a = pl[i], b = pl[(i + 1) % pl.length], c = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (Math.abs(c) < 1e-9) continue; if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } return true; };
      const rocks = plans.filter((pl) => pl.some((q) => q[0] < 0));
      const wet = (x, z) => { for (const pl of rocks) for (const [ox, oz] of [[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]]) if (inPlan(pl, x + ox, z + oz)) return false; return true; };
      const course = []; for (let i = 0; i <= 80; i++) course.push(path.pointAt(i / 80 * 0.4));
      const clear = (x, z) => { for (const c of course) if (Math.hypot(c.x - x, c.z - z) < 5.2) return false; return true; };
      const sites = [[-3.5, 30, 0.1], [13.5, 45, -0.2], [-2.5, 66, 0.15], [19.5, 85, 0.3], [0.5, 99, 0.4], [-8.5, 27, 0.1], [-14, 40, -0.15], [-9, 53, 0.2], [-10.5, 92, 0.3], [-16.5, 105, 0.45], [-27.5, 111, 0.3], [-22, 124, 0.55], [-38, 120, 0.35]];
      for (const [sx, sz, lean] of sites) {
        const cx = sx + kr2.range(-1.2, 1.2), cz = sz + kr2.range(-1.5, 1.5), a0 = Math.PI / 2 + lean + kr2.range(-0.12, 0.12), bend = kr2.range(-0.05, 0.05) - 0.03;
        const n = Math.max(4, Math.round(kr2.range(6, 9.5) * (0.6 + 0.4 * detail))), gap = kr2.range(1.15, 1.45), ph = kr2();
        for (let j = 0; j < n; j++) {
          const o = (j - (n - 1) / 2) * gap, st = kr2.range(-0.9, 0.9), L = kr2.range(3.6, 5.6), pts = [], al = [];
          let px = cx + Math.sin(a0) * o + Math.cos(a0) * st, pz = cz - Math.cos(a0) * o + Math.sin(a0) * st, a = a0, ok = true;
          for (let i = 0; i <= 8 && ok; i++) { ok = wet(px, pz) && clear(px, pz); pts.push([px, 0.05, pz]); al.push(i / 8 * L / 7, ph, i / 8, i / 8 * L / 7, ph, i / 8); a += bend; px += Math.cos(a) * L / 8; pz += Math.sin(a) * L / 8; }
          if (!ok) continue;
          lines.push(pts); for (const v of al) along.push(v);
        }
        await ctx.yield();
      }
      const kg = S.ribbon(lines, 0.17); kg.setAttribute('aK', new THREE.Float32BufferAttribute(along, 3));
      const km = new THREE.ShaderMaterial({ uniforms: kelpU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform float uPx; uniform float uTime; attribute vec3 aTan; attribute float aSide; attribute float aW; attribute vec3 aK;
void main(){
  vec3 p = position;
  float w = 6.2831853 * (aK.y - uTime / 7.0);                                     // one phase to a clump: it swings together
  p.x += aK.x * aK.x * 0.85 * sin(w);                                              // by metres from the root, so neighbours stay parallel
  p.z += aK.x * aK.x * 0.25 * cos(w);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 t = mat3(modelViewMatrix) * aTan; t = t / max(length(t), 1e-5);
  vec3 v = mv.xyz / max(length(mv.xyz), 1e-5);
  vec3 s = cross(t, v); s = s / max(length(s), 1e-4);
  float hw = max(aW * (1.0 - 0.7 * aK.z), 0.78 * max(-mv.z, 0.0) / max(uPx, 1.0)) * clamp((1.0 - aK.z) * 5.0, 0.0, 1.0);   // a band that tapers to a point
  mv.xyz += s * aSide * hw;
  gl_Position = projectionMatrix * mv;
}`, fragmentShader: /* glsl */`uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }` });
      const kelp = new THREE.Mesh(kg, km); kelp.frustumCulled = false; scene.add(kelp);
    }
    await ctx.yield();

    // ---- gulls (polish 1): two small parties wheeling over the cove's moorings and over the channel to the arch, so the
    //      first and the last stills have wings in them. Flat two-winged marks that face the viewer, three held wing
    //      shapes at three a second with scattered phases, exclusive-or like everything that travels; never under 9 px. ----
    {
      const gr = rng.fork('one-bit-gulls'), gp = [], gc = [], go = [];
      const party = (c, n, r0, r1) => {
        for (let i = 0; i < n; i++) {
          const cx = c.x + gr.range(-6, 6), cy = c.y + gr.range(-4, 5), cz = c.z + gr.range(-6, 6), o = [gr.range(r0, r1), gr() * 6.2832, (gr() < 0.5 ? -1 : 1) * gr.range(0.16, 0.3), gr()];
          for (const sgn of [-1, 1]) for (const v of [[0, 0.16], [sgn, 0.1], [sgn * 0.42, -0.2], [0, 0.16], [sgn * 0.42, -0.2], [0, -0.14]]) { gp.push(v[0], v[1], Math.abs(v[0])); gc.push(cx, cy, cz); go.push(o[0], o[1], o[2], o[3]); }
        }
      };
      party(E(-12, 14, 62), Math.max(7, Math.round(16 * detail)), 9, 30);
      party(SK(E(168, 12, ARCH.z)), Math.max(5, Math.round(12 * detail)), 8, 26);
      // (polish 5) a third party over the moorings, where the eye looks from mast height at u 0.7: wings on the black sky left of the moon
      party(path.pointAt(0.7).add(new THREE.Vector3(-Math.sin(-17 * DEG), 0, Math.cos(-17 * DEG)).multiplyScalar(50)).setY(18), Math.max(5, Math.round(10 * detail)), 6, 20);
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('aC', new THREE.Float32BufferAttribute(gc, 3)); gg.setAttribute('aO', new THREE.Float32BufferAttribute(go, 4));
      const gm = new THREE.ShaderMaterial({ uniforms: { uK: U.uK, uW: U.uW, uPx: U.uPx, uTime: U.uTime, uGateP: U.uGateP, uGateN: U.uGateN, uGateDim: U.uGateDim },
        vertexShader: /* glsl */`attribute vec3 aC; attribute vec4 aO; uniform float uTime; uniform float uPx; varying vec3 vGw;
void main(){
  float an = aO.y + uTime * aO.z;
  vec3 c = aC + vec3(cos(an) * aO.x, 1.6 * sin(an * 2.0 + aO.w * 6.2832), sin(an) * aO.x * 0.7);
  vGw = (modelMatrix * vec4(c, 1.0)).xyz;
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  float shape = mod(floor(uTime * 3.0 + aO.w * 3.0), 3.0);
  float up = shape < 0.5 ? 0.5 : (shape < 1.5 ? 0.2 : -0.38);                 // (polish 2) never level: a level gull is a sliver, a shard
  float sc = max(0.85, 4.5 * max(-mv.z, 0.0) / max(uPx, 1.0));               // half a span: never under 9 px across the wings
  vec2 g = vec2(position.x * (1.0 - 0.25 * abs(up)), position.y + up * position.z);
  float lean = 0.35 * sin(an + 1.0);                                          // banking round the circle
  mv.xy += vec2(g.x * cos(lean) - g.y * sin(lean), g.x * sin(lean) + g.y * cos(lean)) * sc;
  gl_Position = projectionMatrix * mv;
}`, fragmentShader: /* glsl */`uniform vec3 uK; uniform vec3 uW; varying vec3 vGw;${S.gateGlsl}
void main(){ if (obGated(vGw)) discard; gl_FragColor = vec4(uK + uW, 1.0); }`, side: THREE.DoubleSide, ...S.xorBlend });
      const gulls = new THREE.Mesh(gg, gm); gulls.frustumCulled = false; gulls.renderOrder = 2; scene.add(gulls);
    }
    await ctx.yield();

    // ---- the arch: a double halo of dashes marching round the opening at half a metre a second, the outer ring the other way ----
    {
      const r = ARCH.half, yc = ARCH.crown - r, lines = [], arc = [];
      for (const [off, dir] of [[0.9, 1], [2.4, -1]]) {
        const R = r + off, pts = [[-R, 0.1], [-R, yc]]; for (let q = 1; q < 24; q++) { const an = Math.PI - (q / 24) * Math.PI; pts.push([Math.cos(an) * R, yc + Math.sin(an) * R]); } pts.push([R, yc], [R, 0.1]);
        let acc = dir > 0 ? 0 : 1.9; const line = [];
        for (let i = 0; i < pts.length; i++) { if (i) acc += dir * Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); arc.push(acc, acc); line.push(SK3([archOutline[0][0] + 0.3, pts[i][1], ARCH.z + pts[i][0]])); }
        lines.push(line);
      }
      const rg = S.ribbon(lines, 0.3); rg.setAttribute('aArc', new THREE.Float32BufferAttribute(arc, 1));
      const rm = new THREE.ShaderMaterial({ uniforms: kelpU, side: THREE.DoubleSide,
        vertexShader: /* glsl */`uniform float uPx; attribute vec3 aTan; attribute float aSide; attribute float aW; attribute float aArc; varying float vArc;
void main(){
  vArc = aArc;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 t = mat3(modelViewMatrix) * aTan; t = t / max(length(t), 1e-5);
  vec3 v = mv.xyz / max(length(mv.xyz), 1e-5);
  vec3 s = cross(t, v); s = s / max(length(s), 1e-4);
  mv.xyz += s * aSide * max(aW, 1.5 * max(-mv.z, 0.0) / max(uPx, 1.0));
  gl_Position = projectionMatrix * mv;
}`, fragmentShader: /* glsl */`uniform vec3 uInk; uniform float uTime; varying float vArc;
void main(){ if (fract((vArc - 0.5 * uTime) / 3.9) > 0.68) discard; gl_FragColor = vec4(uInk, 1.0); }` });
      const ringMesh = new THREE.Mesh(rg, rm); ringMesh.frustumCulled = false; scene.add(ringMesh);
    }
    await ctx.yield();

    // ---- the rare event, the full-rigger: a three-masted ship 70 m long and 50 m tall that crosses the road ahead
    //      of us from right to left at 19 s, twenty sails and a hull, all exclusive-or. Ship frame: +x the bow. ----
    let ship = null; const shipX0 = new THREE.Vector3(), shipDir = new THREE.Vector3();
    const SHIP_V = 11, SHIP_MORE = 12, shipRun = (u) => SHIP_V * (u * DURATION - 19.5) + SHIP_MORE * Math.max(u * DURATION - 22, 0);   // (fleet 1) her metres along her track at the share u (live's own numbers, moved here from her sailing): for that and for THE FLEET'S BERTH
    const SHIP_HEEL = [0.07, 0.02];                                           // (fleet 1) her heel and its swing, radians (live's own, moved here likewise)
    if (rare) {
      const hp = [], sp = [], cen = [0, 2, 0];
      const quadOut = (a, b, c, d) => {
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const out = n[0] * (a[0] - cen[0]) + n[1] * (a[1] - cen[1]) + n[2] * (a[2] - cen[2]) >= 0;
        for (const p of (out ? [a, b, c, a, c, d] : [a, c, b, a, d, c])) hp.push(p[0], p[1], p[2]);
      };
      const X = [-29, -22, -6, 10, 22, 29.5], B = [3.6, 5.0, 5.6, 5.2, 3.2, 0.05], SH = [8.2, 6.6, 5.4, 5.6, 6.6, 8.0];
      const st = X.map((x, i) => ({ DR: [x, SH[i], B[i]], DL: [x, SH[i], -B[i]], WR: [i === 5 ? 27.5 : x, -1.2, B[i] * 0.75], WL: [i === 5 ? 27.5 : x, -1.2, -B[i] * 0.75] }));
      const mx = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
      const side = (aw, bw, bd, ad) => { quadOut(aw, bw, mx(bw, bd, 0.6), mx(aw, ad, 0.6)); quadOut(mx(aw, ad, 0.68), mx(bw, bd, 0.68), bd, ad); };   // the strake: a line of what lies behind her
      for (let i = 0; i < 5; i++) { const a = st[i], b = st[i + 1]; side(a.WR, b.WR, b.DR, a.DR); side(a.WL, b.WL, b.DL, a.DL); quadOut(a.DR, b.DR, b.DL, a.DL); }
      quadOut(st[0].WL, st[0].WR, st[0].DR, st[0].DL);
      const sq = (a, b, c, d) => { for (const p of [a, b, c, a, c, d]) sp.push(p[0], p[1], p[2]); };
      const bx = Math.sin(40 * DEG), bz = Math.cos(40 * DEG);                                 // the yards braced round 40 degrees
      const square = (mxx, y0, y1, w) => {
        const NU = 4, NV = 2, P = (u, v) => { const ww = w * (1 - 0.14 * v) * (u - 0.5), bel = 1.5 * Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.15 + 0.7 * v));
          return [mxx + bx * ww + bz * bel, y0 + (y1 - y0) * v + 0.7 * Math.sin(Math.PI * u) * (1 - v) * (1 - v), bz * ww - bx * bel]; };
        for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) sq(P(i / NU, j / NV), P((i + 1) / NU, j / NV), P((i + 1) / NU, (j + 1) / NV), P(i / NU, (j + 1) / NV));
      };
      // sails cut so that no two overlap seen from abeam: every sail is one ink, and only the moon's limb and the road divide her
      const rig = [[15, 47, [[9, 19, 20], [20, 27, 17.5], [28, 34, 15], [35, 41, 12.5], [42, 46, 9.5]]], [-2, 50, [[9, 20, 21.5], [21, 28.5, 18.5], [29.5, 36, 16], [37, 43, 13], [44, 49, 10]]],
        [-18, 42, [[18, 25, 15.5], [26, 32, 13], [33, 37.5, 10.5], [38.5, 41.5, 8]]]];
      for (const [mxx, top, sails] of rig) {
        sq([mxx - 0.35, 5.5, 0], [mxx + 0.35, 5.5, 0], [mxx + 0.2, top, 0], [mxx - 0.2, top, 0]);
        for (const [y0, y1, w] of sails) square(mxx, y0, y1, w);
      }
      const tri3 = (a, b, c) => sp.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      tri3([41.5, 11.4, 0.4], [31.5, 9.2, 0.4], [17.6, 43, 0.4]); tri3([29.5, 8.9, 0.4], [24.5, 8.5, 0.4], [18.2, 28, 0.4]);   // three jibs
                                              // two staysails
      sq([-19.2, 8.5, 0.3], [-30.5, 9.5, 2.2], [-31.5, 16.5, 2.4], [-19.2, 15.5, 0.3]);                                                                   // the spanker
      sq([28.5, 7.6, 0], [43, 11.3, 0], [43, 11.9, 0], [28.5, 8.3, 0]);                                                                                 // the bowsprit
      for (let k = 0; k < 7; k++) { const x0 = -33 - k * 8.5, L = 5.5 * (1 - k / 8); for (const z of [-2.5 - k * 0.9, 2.5 + k * 0.9]) sq([x0, 0.06, z - 0.28], [x0 - L, 0.06, z - 0.28], [x0 - L, 0.06, z + 0.28], [x0, 0.06, z + 0.28]); }   // her wake
      ship = new THREE.Group();
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
      const sg2 = new THREE.BufferGeometry(); sg2.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      // (true 2) "twenty sails white outside the disc and black inside it": on the disc she is one solid ink like every
      // boat (she was exclusive-or there, so two of her sails in line flipped back to white inside the disc)
      const hullInk = discInk.clone(); hullInk.uniforms = discU; hullInk.side = THREE.FrontSide;
      const hull = new THREE.Mesh(hg, hullInk), canvas = new THREE.Mesh(sg2, discInk);
      hull.frustumCulled = canvas.frustumCulled = false; hull.renderOrder = canvas.renderOrder = 2; ship.add(hull, canvas);
      for (const g of [hg, sg2]) { const solid = new THREE.Mesh(g, discSolid); solid.frustumCulled = false; solid.renderOrder = 2.001; ship.add(solid); }
      ship.rotation.order = 'YXZ'; scene.add(ship);
      const uS = 19.5 / DURATION, tS = path.tangentAt(uS);
      shipX0.copy(path.pointAt(uS + 84 / path.length)).setY(0); shipDir.set(tS.z, 0, -tS.x).normalize();
      ship.rotation.y = Math.atan2(-shipDir.z, shipDir.x);
      await ctx.yield();
    }

    // ---- the flight ----
    S.setGate(SK(E(212, 0, ARCH.z)), path.tangentAt(1), ARCH.half, ARCH.crown);          // our own boat is never drawn across the exit opening
    const moonFar = heroPos.clone().add(new THREE.Vector3(-Math.sin(12 * DEG), 0.23, Math.cos(12 * DEG)).multiplyScalar(3000));   // the upper disc: the gaze lifts and the horizon sits low in the frame
    const fw = new THREE.Vector3(), lf = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), bP = new THREE.Vector3(), bA = new THREE.Vector3(), bB = new THREE.Vector3(), bT = new THREE.Vector3();
    const mBasis = new THREE.Matrix4(), mRock = new THREE.Matrix4(), mTmp = new THREE.Matrix4();
    // (r9s) where our boat sails, against the eye: KEYS, key() and her route metre (boatM) are said once, above the
    // buoys' block, whose walk reads the same track; her place on the map is worked out here as it always was.
    const boatAt = (u, out) => {
      const d = boatM(u); path.posAtDist(d, out); path.tangentAtDist(d, bT);
      const l = key(u, 2), h = Math.hypot(bT.x, bT.z) || 1; out.x += -bT.z / h * l; out.z += bT.x / h * l; return out;
    };
    // (polish 4) the gaze: one point of interest that travels with the eye. It lies on the moon's bearing (12 degrees east
    // of north, 13 up) for the whole flight and stands 10 degrees east of it, a little higher, from the turn through the
    // moorings (u 0.66 to 0.9: the course runs north-west there; the disc stays whole to starboard, the arch to port).
    // (polish 5) it no longer lies on the moon's bearing: it is the point that brings the eye onto VIEW's line at this u
    const gazeAt = new THREE.Vector3(), gA = new THREE.Vector3(), gD = new THREE.Vector3(), gP = new THREE.Vector3();
    const gaze = (time, u) => {
      u = Math.min(Math.max(u, 0), 1);
      const w = GW * sstep(0, 0.04, u) * (1 - sstep(0.93, 0.985, u)), d = u * path.length;   // the engine lets the gaze go at both ends
      path.posAtDist(d, gazeAt); path.posAtDist(d + LOOK, gA); gA.sub(gazeAt).normalize(); viewDir(u, gD);
      const c = gD.dot(gA), q = (1 - w) * (1 - w) * (c * c - 1) + w * w;
      if (w > 0.05 && q > 0) gP.copy(gD).multiplyScalar((1 - w) * c + Math.sqrt(q)).addScaledVector(gA, -(1 - w)).normalize(); else gP.copy(gD);
      return gazeAt.addScaledVector(gP, 3000);
    };
    // (fleet 1) WHERE OUR OWN BOAT LIES AND HEADS at the share u (bP her place on the map, fw her heading, lf her port
    // hand): live's own three lines, moved here from the flight's update whole, so that her sailing and THE FLEET'S BERTH
    // read one law. Seen through the previous world's portal (u is exactly 0) she waits where the flight will find her:
    // off the first point of the path, on its heading.
    const ownPose = (u) => {
      if (u > 0) { boatAt(u, bP); boatAt(Math.min(u + 0.004, 1.02), bB); boatAt(u - 0.004, bA); fw.subVectors(bB, bA); }
      else { bP.copy(path.start).addScaledVector(path.startTangent, key(0, 1)); bP.x += -path.startTangent.z * key(0, 2); bP.z += path.startTangent.x * key(0, 2); fw.copy(path.startTangent); }
      fw.y = 0; if (fw.lengthSq() < 1e-8) fw.set(0, 0, 1); fw.normalize(); lf.crossVectors(UP, fw);
    };
    // (fleet 1) THE FLEET'S BERTH OF OUR COURSE, laid here once, at build, by place (the law itself is the part's:
    // berthFleet). A DEPARTURE ALLOWED FOR THIS WORLD, by the owner's and the designer's words of 9 October: the fleet's
    // PLACE goes by the journey's seconds ("a boat's place along the lane by the journey's seconds", on the designer's
    // terms a to d: what is not place stays on the world's clock; nothing is placed for a sampled place of the flight, a
    // seed or an entry clock; no law reads the lens; the full-rigger keeps the fleet parting for HER place), as the
    // terns' and the great luggers' does, so where a boat is when we pass is the same on every arrival and can be given
    // its berth at build; the parting round the lens is out of the fleet's shader. The part is told here what it cannot
    // know: the course's line, where our own boat lies on it (her keys), and the tracks of the things a shifted boat
    // must not be set into. Every place below is in the hero's own frame. Nothing is dealt and no stream is read.
    const FLEET_HULL = 8;                                                     // the design: "nearest hulls 8 m off each beam"; the designer: "THE BERTH: the design's 8 m, from the course's line to the nearest side of the HULL at the boat's nearest pass, each beam"
    const FLEET_BODY = 4;                                                     // the owner: "4 m clear of the lens for any part of a boat as drawn"; the designer: "if at that pass any part of the boat as drawn (sail, yard, mast, with her heel) would stand nearer the lens than 4 m, that boat takes as much more as gives it"
    {
      const up = new THREE.Vector3(0, 1, 0), q = new THREE.Vector3(), pv = new THREE.Vector3();
      const loc = (v) => { q.copy(v).sub(heroPos).applyAxisAngle(up, -heroRot); return [q.x, q.z]; }, turn = (v) => { q.copy(v).applyAxisAngle(up, -heroRot); return [q.x, q.z]; };
      // our own hull's corners as built, seen from above ([m to port, m toward the bow]), and how far her stern and her stem lie from her place
      const ourHull = []; let stern = 0, bow = 0;
      for (let i = 0; i < hp.length; i += 3) { ourHull.push([hp[i], hp[i + 2]]); stern = Math.min(stern, hp[i + 2]); bow = Math.max(bow, hp[i + 2]); }
      const baked = (o) => { const T = []; bake(T, [], o); return T.slice(0, hp.length); };   // the hull corners of a boat baked from our lines, in her group's frame
      // the great luggers (not there when the full-rigger comes), each on her own straight track, read back from what
      // was built (her place in her group is what her wake's dashes carry: x, z, yaw, scale, 36 corners a boat)
      const movers = [], statics = [];
      if (!rare) for (const g of junkGroups) {
        const d = g.userData, dir = turn(d.dir);
        for (let i = 0; i < d.wa.length; i += 144) {
          const T = baked({ x: d.wa[i], z: d.wa[i + 1], yaw: d.wa[i + 2], scale: d.wa[i + 3], side: 1, hoist: 1 }), pts = [];
          for (let j = 0; j < T.length; j += 3) pts.push(loc(pv.set(T[j], 0, T[j + 2]).applyMatrix4(d.basis).add(junk0)));
          movers.push({ pts, dir, run: (T) => junkRun(T / DURATION), speed: JSPEED });
        }
      }
      if (ship) {                                                             // the full-rigger's hull on her track, at the least and the most of her heel (her rail leans out over her keel by three quarters of a metre)
        const sh = ship.children[0].geometry.attributes.position.array, c = Math.cos(ship.rotation.y), s = Math.sin(ship.rotation.y), pts = [];
        for (const h of [SHIP_HEEL[0] - SHIP_HEEL[1], SHIP_HEEL[0] + SHIP_HEEL[1]]) for (let j = 0; j < sh.length; j += 3) { const z = sh[j + 1] * Math.sin(h) + sh[j + 2] * Math.cos(h); pts.push(loc(pv.set(shipX0.x + sh[j] * c + z * s, 0, shipX0.z - sh[j] * s + z * c))); }
        movers.push({ pts, dir: turn(shipDir), run: (T) => shipRun(T / DURATION), speed: SHIP_V + SHIP_MORE });
      }
      for (const { p, yaw, scale } of MOORED) {                               // the seventeen on their moorings, as their own build sets them down
        const T = baked({ x: 0, z: 0, yaw: 0, scale, side: 1, hoist: 0.3 }), c = Math.cos(yaw), s = Math.sin(yaw), pts = [];
        for (let j = 0; j < T.length; j += 3) pts.push(loc(pv.set(p.x + T[j] * c + T[j + 2] * s, 0, p.z - T[j] * s + T[j + 2] * c)));
        statics.push(pts);
      }
      // our own boat as she truly lies at the share u of the course: her place and her heading
      const pose = (u, o) => { ownPose(u); const a = loc(bP), f = turn(fw); o.x = a[0]; o.z = a[1]; o.fx = f[0]; o.fz = f[1]; };
      // the steepest any of her keys' columns climbs in a journey second: between two keys the step is a smooth one, at its steepest half as steep again as the straight line
      const rate = (c) => 1.5 * Math.max(...KEYS.slice(1).map((k, i) => Math.abs(k[c] - KEYS[i][c]) / (k[0] - KEYS[i][0]))) / DURATION;
      await hero.fleetBerth({
        hull: FLEET_HULL, body: FLEET_BODY,
        clear: 1,                                                             // metres of water between a shifted boat's hull and any other hull, and between any fleet hull and our own: the most a hull's rail swings sideways on the world's clock beyond the outline it is given here is a moored boat's 0.26 m (0.1 radians at her 2.6 m sheer), and the rest is water that reads as water between two hulls
        grain: 0.25,                                                          // metres: a shift is tried a quarter of a metre at a time (a fiftieth of a hull)
        reach: LANE,                                                          // metres: no boat is shifted further along the lane than the lane is wide
        steps: 240,                                                           // looks a journey second: four to each sixtieth, so a hull closing at 20 m/s moves 0.08 m between two looks and its nearest pass at 8 m is read to 0.2 mm
        duration: DURATION, routeLen: path.length, course: { pts: courseL, from: COURSE_FROM, step: COURSE_STEP },
        // our own boat: her keys at the share u (metres ahead along the course, metres to starboard); how she truly lies;
        // her hull; her stern and stem from her place; the furthest her keys ever set her ahead and to one side (between
        // two keys she never passes either); and how fast those can change
        own: { keys: (u, o) => { o.ahead = key(u, 1); o.side = key(u, 2); }, pose, hull: ourHull, stern, bow, ahead: Math.max(...KEYS.map((k) => k[1])), side: Math.max(...KEYS.map((k) => Math.abs(k[2]))), aheadRate: rate(1), sideRate: rate(2) },
        movers, statics,
      });
      await ctx.yield();
    }
    const roadTan0 = U.uRoadTan.value.clone();
    const roadApex = E(-110 * Math.sin(12 * DEG), 0, -110 * Math.cos(12 * DEG));
    const wHex = '#' + S.W.getHexString();
    return {
      scene, path, duration: DURATION, pace,
      title: hour === 'day' ? 'The One-Bit Moon, Negative Plate' : 'The One-Bit Moon',
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: LOOK, sway: 0.2, bank: 0.12 },
      pois: [{ at: gaze, from: -1, to: 2, fade: 0.1, weight: GW }],
      portal: { shape: 'arch', width: 13.8, height: 15.8, color: wHex, style: 'ring', glow: 0, halo: false, revealDistance: 150, blendDistance: 25 },   // the two inks hold until the last 25 m: the next world's grade does not creep in over the last fifth
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u);
        hero.update(dt, time, camera);
        S.setRoad(roadApex.x, roadApex.z, S.moonAz);                                 // (polish 2) the road's apex stands 110 m astern of the entry, on the moon's bearing through it
        if (hour === 'golden') U.uRoadTan.value.copy(roadTan0).multiplyScalar(0.35 + 0.65 * sstep(0, 10, u * DURATION));   // golden: the road swells from a thread as the rim clears (it lay ahead of us, out of the picture, before)
        U.uMoonTan.value = Math.tan(moonHalf(u));
        // our boat sails the course near the eye (KEYS). Seen through the previous world's portal (u is exactly 0) she
        // waits where the flight will find her: off the first point of the path, on its heading.
        ownPose(u);
        mBasis.makeBasis(lf, UP, fw).setPosition(bP.x, U.uSeaY.value, bP.z);
        // she gybes twice (the sail swings across through the centreline) and lowers her yard coming in to the arch
        const side = 1 - 2 * sstep(0.035, 0.07, u) + 2 * sstep(0.655, 0.7, u),   // (polish 5) the first gybe as she crosses our bow leaving the cove
        hoist = 1 - 0.58 * sstep(0.73, 0.85, u);
        const pitch = -0.035 * Math.sin(time * 1.7) - 0.012 * Math.sin(time * 2.9 + 1), roll = 0.03 * Math.sin(time * 1.1 + 0.6) + 0.07 * side;
        mRock.makeRotationX(pitch).multiply(mTmp.makeRotationZ(roll));
        boat.matrix.multiplyMatrices(mBasis, mRock); boat.matrixWorldNeedsUpdate = true;
        rig.matrix.makeScale(side * (0.93 + 0.07 * Math.sin(time * 0.8)), hoist, 1).setPosition(0, TACKY * (1 - hoist), 0); rig.matrixWorldNeedsUpdate = true;
        for (const g of junkGroups) { const d = g.userData.dir, s = junkRun(u); g.matrix.copy(g.userData.basis).setPosition(junk0.x + d.x * s, U.uSeaY.value + 0.12 * Math.sin(time * 0.9), junk0.z + d.z * s); g.matrixWorldNeedsUpdate = true; }
        for (const g of flotsam) g.position.y = 0.09 * Math.sin(time * 1.25 + g.userData.ph);
        for (const g of skiffs) { const d = g.userData, ph = d.ph, a = 2.5 * Math.sin(time * 0.22 + ph); g.position.set(d.x + d.dx * a, 0.08 * Math.sin(time * 1.3 + ph), d.z + d.dz * a); g.rotation.z = 0.09 * Math.sin(time * 1.5 + ph); g.rotation.x = 0.05 * Math.sin(time * 1.9 + ph * 2); }
        if (camera) rankFigs(camera);
        for (const g of mooredBoats) { const ph = g.userData.ph; g.rotation.z = 0.07 * Math.sin(time * 1.3 + ph) + 0.03 * Math.sin(time * 2.1 + ph * 2); g.rotation.x = 0.035 * Math.sin(time * 1.6 + ph * 3); g.position.y = 0.1 * Math.sin(time * 1.3 + ph + 1); }
        if (ship) {                                                           // the full-rigger, keyed to the journey
          ship.position.copy(shipX0).addScaledVector(shipDir, shipRun(u)); ship.position.y = 0.3 * Math.sin(time * 0.6);
          ship.rotation.x = SHIP_HEEL[0] + SHIP_HEEL[1] * Math.sin(time * 0.5 + 1); ship.rotation.z = 0.012 * Math.sin(time * 0.6 + 2);
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
