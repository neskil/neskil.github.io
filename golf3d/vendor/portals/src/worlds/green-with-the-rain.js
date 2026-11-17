// GREEN WITH THE RAIN: a late autumn afternoon over an old northern city beaten from one thin sheet of copper.
// A shower crosses the roofs as a single line, penny-bright ahead of it and verdigris behind, and reaches the
// cathedral dome (half ancient mint, half blazing new metal) just as the sun gets under the cloud.
//
// Style: repousse copper. Everything is a hollow shell of hammer flats shaded by the one metal routine exported by
// the hero part (src/parts/green-with-the-rain.js): no lights, no fog, no shadow maps, no full-screen pass.
// Tone is the hammer, a line is a standing seam or a rivet row, shadow is rain shadow, distance is patina.
//
// Flight (+Z is the course; flying +Z, screen left / port is +X):
//   0-190 m   the gables, level at y 38: roofs of big flats, six spires, gulls on the rain line, the canal at z 120
//   190-275   down between two spires into Coppersmiths' Row
//   275-450   the Row: facades 7 m either side, fretted windows over gilt leaves; the line overtakes us in the bend
//   450-555   the cathedral square and the climb over the lindens, the seam dead centre; jackdaws lift; the slot
//   last 60 m dead straight at 58 degrees through the armillary's equatorial hoop (the exit portal, tilted)
//
// Variations by seed: metal (penny / re-sheeted salmon / old chocolate), hour (afternoon, dawn, day, golden, dusk
// via ctx.vary.hour), weather (shower / drizzle / squall), cast (jackdaws and gulls / pale pigeons), the new half
// to port. Rare event (ctx.vary.rare): the last sheet, a 12 m panel swung by the hoist and laid on the seam.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, makeStyle, metalMaterial, skyMaterial, makeRain, rodMesh, SheetBuilder, storyTimeAt, PALETTE, STYLE_GLSL,
} from '../parts/green-with-the-rain.js';

const TAU = Math.PI * 2;
// the Row's centre line: eases 16 m to port (+X) by z 360 and back to the axis at z 450
const rowX = (z) => { const k = clamp((z - 275) / 175, 0, 1), s = Math.sin(Math.PI * k); return 16 * s * s; };
// the brief's pace(u): hurry over the gables, linger on the climb
const PACE = (u) => lerp(lerp(lerp(lerp(1.25, 1.15, smoothstep(0.27, 0.31, u)), 1.05, smoothstep(0.40, 0.44, u)), 0.7, smoothstep(0.68, 0.73, u)), 0.95, smoothstep(0.90, 0.93, u));

export default {
  id: 'green-with-the-rain',
  name: 'Green With the Rain',
  category: 'city',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.6, 1), density = clamp(vary.density || 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- the edition (chosen once, from its own stream so that it does not disturb the layout) ----------
    const vr = rng.fork('edition');
    const metalEd = vr.pick(['penny', 'penny', 'salmon', 'chocolate', 'penny', 'salmon', 'chocolate']);
    const weather = vr.pick(['shower', 'shower', 'drizzle', 'squall', 'shower', 'squall', 'drizzle']);
    const cast = vr.chance(0.3) ? 'pigeons' : 'jackdaws';
    const mirror = vr.chance(0.25);                    // the new half to port: the rain meets the resist first
    let hour = vary.hour && vary.hour !== 'any' ? vary.hour : vr.pick(['afternoon', 'afternoon', 'afternoon', 'golden', 'dawn', 'day']);
    const rare = !!vary.rare;
    // base age of the city's sheet: penny 0.25, new salmon 0.05, old chocolate 0.47 (the ramp's stops)
    const AGE0 = metalEd === 'salmon' ? 0.05 : metalEd === 'chocolate' ? 0.46 : 0.25;
    const AGEV = metalEd === 'chocolate' ? 0.05 : 0.1;
    // the hour only moves the tinning of the sky (and of everything tinned): rose at dawn, bright by day, warm at
    // the golden hour, blue pewter at dusk; copper's own states never change
    const TIN = { afternoon: PALETTE[6], dawn: '#C2B6B4', day: '#C6CBCA', golden: '#BDB7AA', night: '#8D98A6' }[hour] || PALETTE[6];
    const palette = PALETTE.slice(); palette[6] = TIN;
    const style = makeStyle({ palette });
    const U = style.uniforms;
    const metal = metalMaterial(style);
    // the hour shapes the break under the cloud: paler at dawn, wide and white by day, broad deep copper at the golden
    // hour, a dim rose bar at dusk
    {
      const sw = { afternoon: [1, 1], dawn: [1, 1.1], day: [1.5, 1.6], golden: [1.7, 2.2], night: [0.9, 0.9] }[hour] || [1, 1];
      U.uSlotW.value.set(sw[0], sw[1]);
      const c0 = new THREE.Color(PALETTE[0]), c5 = new THREE.Color(PALETTE[5]), ct = new THREE.Color(TIN), sc = U.uSlotCol.value;
      const mixc = (a, b, k, g) => sc.set(lerp(a.r, b.r, k) * g, lerp(a.g, b.g, k) * g, lerp(a.b, b.b, k) * g);
      if (hour === 'dawn') mixc(c0, ct, 0.5, 1.2); else if (hour === 'day') mixc(c5, ct, 0.7, 1.3); else if (hour === 'golden') mixc(c0, c5, 0.25, 1.2); else if (hour === 'night') mixc(c0, ct, 0.45, 0.95); else mixc(c0, c5, 0.45, 1.25);
    }
    // the weather: a sharp shower line, a soft slow drizzle (green comes like breath on a window), or a squall
    U.uSoft.value = weather === 'drizzle' ? 5.5 : 0.5;
    // in the Row's bend the line runs 2.8 s ahead of itself along the port wall, so that the wall is seen to green
    // while we pass (from the street the line's shape cannot be seen)
    U.uBulge.value.set(11, 19, 368, 46); U.uBulgeA.value = 2.8;
    const gustK = weather === 'squall' ? 1.5 : weather === 'drizzle' ? 0.6 : 1;

    // ---------- the path ----------
    const pts = [[0, 38, 0], [0, 38, 60], [0, 38, 125], [0, 37.6, 180], [0, 33, 212], [0, 20, 250], [0.3, 11.6, 283]];
    for (const z of [305, 330, 360, 390, 420]) pts.push([rowX(z), 10, z]);
    pts.push([0, 10, 450], [0, 23, 487], [0, 45, 520], [0, 64, 541], [0, 81, 558], [0, 93.7, 566], [0, 106.4, 574], [0, 119.2, 582], [0, 132, 590]);
    const path = makePath(pts);
    await ctx.yield();

    // ---------- the hero ----------
    const hero = await buildHero(ctx, { palette, detail, style, sky: false, rain: false, paving: false, cast, lastSheet: rare });
    hero.object.position.set(0, 0, 590); hero.object.rotation.y = Math.PI;
    if (mirror) hero.object.scale.x = -1;
    scene.add(hero.object);
    await ctx.yield();

    // every sheet of the city goes through one of these; chunks keep the frustum culling useful
    const chunks = [];
    const flush = (sb, name) => {
      if (!sb.n) return null;
      const m = new THREE.Mesh(sb.geometry(), metal); m.name = name; scene.add(m); chunks.push(m); return m;
    };
    const ageOf = (x, z, id) => AGE0 + AGEV * (id - 0.3);
    const h2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const noise = ctx.noise;
    // far ground rises into low hills so that farther rooflines stack up, each paler and greener
    const hillY = (x, z) => { const r = Math.hypot(x, z - 300); return 85 * smoothstep(520, 1700, r) * (0.55 + 0.45 * noise.fbm2(x * 0.0011, z * 0.0011, 3)); };

    // ---------- the ground: paving of sheet, flats uneven in size, seams and rivet rows in the shader ----------
    // one lattice of cells of size fl over [x0,x1] x [z0,z1]; skip(xc, zc) leaves holes; corners are jittered
    const pave = async (sb, x0, z0, x1, z1, fl, yFn, skip, age, jit = 0.22) => {
      const nx = Math.round((x1 - x0) / fl), nz = Math.round((z1 - z0) / fl);
      const P = (i, j) => {
        const edge = i === 0 || j === 0 || i === nx || j === nz;
        const x = x0 + i * fl + (edge ? 0 : (h2(i + x0, j * 1.7 + z0) - 0.5) * fl * jit * 2), z = z0 + j * fl + (edge ? 0 : (h2(i * 1.3 + 7 + x0, j + z0) - 0.5) * fl * jit * 2);
        return [x, yFn ? yFn(x, z) : 0, z, x, z];
      };
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const xc = x0 + (i + 0.5) * fl, zc = z0 + (j + 0.5) * fl;
          if (skip && skip(xc, zc)) continue;
          sb.ageFn = (x, y, z, id) => [age(xc, zc, id), 0];
          sb.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j));
        }
        if (i % 5 === 4) await ctx.yield();
      }
      sb.ageFn = null;
    };
    const inNear = (x, z) => x > -160 && x < 160 && z > -80 && z < 672;
    const inMid = (x, z) => x > -480 && x < 480 && z > -240 && z < 1200;
    const inCanal = (x, z) => z > 108 && z < 132;
    const paveAge = (x, z, id) => Math.min(AGE0 + 0.14 + AGEV * 0.5 * (id - 0.5) + (id > 0.965 ? 0.04 : 0), 0.5);
    {
      // the Row's street bed and the cathedral square: the finest paving, 1.4 m and 2.2 m flats
      let sb = new SheetBuilder(rng, 24000); sb.set(0.4); sb.seam = 2.8;
      const nzs = 180, nxs = 13;
      for (let j = 0; j < nzs; j++) {
        const za = 196 + (254 * j) / nzs, zb = 196 + (254 * (j + 1)) / nzs;
        for (let i = 0; i < nxs; i++) {
          const xa = -9.1 + i * 1.4, xb = xa + 1.4, jx = (ii, jj) => (ii === 0 || ii === nxs ? 0 : (h2(ii, jj) - 0.5) * 0.45);
          const A = [rowX(za) + xa + jx(i, j), 0.1, za, xa, za], B = [rowX(zb) + xa + jx(i, j + 1), 0.1, zb, xa, zb];
          const C = [rowX(zb) + xb + jx(i + 1, j + 1), 0.1, zb, xb, zb], Dd = [rowX(za) + xb + jx(i + 1, j), 0.1, za, xb, za];
          sb.ageFn = (x, y, z, id) => [paveAge(x, z, id), 0];
          sb.quad(A, B, C, Dd);
        }
        if (j % 30 === 29) await ctx.yield();
      }
      flush(sb, 'street');
      sb = new SheetBuilder(rng, 30000); sb.set(0.4); sb.seam = 4.4;
      // the square is laid in rings of colour round the cathedral: browner bands every 22 m
      const sqAge = (x, z, id) => paveAge(x, z, id) + (Math.abs(((Math.hypot(x, z - 590) + 4) % 22) - 11) < 1.6 ? 0.1 : 0) - 0.05;
      await pave(sb, -78, 450, 78, 671, 2.6, null, (x, z) => Math.hypot(x, z - 590) < 38.6, sqAge);
      flush(sb, 'square');
      await ctx.yield();
      // the near city's streets and yards, 4 m flats
      sb = new SheetBuilder(rng, 30000); sb.set(0.4); sb.seam = 4;
      const street = (x, z) => z > 198 && z < 448 && Math.abs(x - rowX(z)) < 7;
      await pave(sb, -160, -80, 160, 675, 5, (x, z) => -0.3, (x, z) => inCanal(x, z) || street(x, z) || (z > 452 && Math.abs(x) < 75), paveAge);
      flush(sb, 'near-ground');
      await ctx.yield();
      sb = new SheetBuilder(rng, 30000); sb.set(0.4); sb.seam = -4;
      await pave(sb, -480, -240, 480, 1200, 16, null, (x, z) => inNear(x, z) || (inCanal(x, z) && false), paveAge, 0.15);
      flush(sb, 'mid-ground');
      await ctx.yield();
      sb = new SheetBuilder(rng, 16000); sb.set(0.5); sb.seam = -4;
      await pave(sb, -2800, -720, 2800, 3200, 80, hillY, inMid, (x, z, id) => AGE0 + 0.2 + 0.1 * id, 0.2);
      flush(sb, 'far-ground');
      await ctx.yield();
    }
    // ---------- a street facade: fretted windows over fire-gilt leaves, sills, doors, rain shadow under the eaves ----------
    // drawn on the house's local +Z wall (right = local +X). Records shutters and signs for the things that swing.
    const shutters = [], signs = [];
    const facade = (sb, T, L, H, hd, o) => {
      const nb = Math.max(1, Math.round(L / 5)), bw = L / nb, cw = bw / 4, nr = 16, rh = H / nr, hl = L / 2;
      const P = (x, y, d, u, v) => T(x, y, hd - d, u === undefined ? x + hl : u, v === undefined ? H - y : v);
      const f0 = sb.ageFn;
      for (let b = 0; b < nb; b++) {
        const bx = -hl + b * bw, door = o.door !== false && rng() < 0.4;
        sb.seam = -2.5 * rh;   // a lap every two and a half courses: the green hangs from these and from the eave
        for (let r = 0; r < nr; r++) for (let c = 0; c < 4; c++) {
          const mid = c === 1 || c === 2, st0 = r >= 1 && r <= 3, st1 = r >= 6 && r <= 8, st2 = r >= 11 && r <= 13;
          if (mid && (st0 || st1 || st2)) continue;
          sb.shelter = r === nr - 1 ? 0.9 : r === nr - 2 ? 0.4 : mid && (r === 5 || r === 10) ? 0.45 : 0;
          const x0 = bx + c * cw, x1 = x0 + cw, y0 = r * rh, y1 = y0 + rh;
          sb.quad(P(x0, y0, 0), P(x1, y0, 0), P(x1, y1, 0), P(x0, y1, 0));
        }
        for (let s = 0; s < 3; s++) {
          const x0 = bx + cw, x1 = bx + 3 * cw, y0 = (1 + s * 5) * rh, y1 = y0 + 3 * rh, dp = 0.45, isDoor = s === 0 && door;
          // the reveal: the sheet turned in, dry and brown
          sb.ageFn = null; sb.set(0.5, 0.85, 0, 0); sb.seam = -3;
          sb.quad(P(x0, y0, 0), P(x0, y0, dp), P(x0, y1, dp), P(x0, y1, 0)); sb.quad(P(x1, y0, dp), P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, dp));
          sb.quad(P(x0, y1, dp), P(x1, y1, dp), P(x1, y1, 0), P(x0, y1, 0)); sb.quad(P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, dp), P(x0, y0, dp));
          if (isDoor) {
            // a door of four panels, one leaf ajar, dry brown in its recess
            sb.set(0.45, 0.7, 0, 0);
            const xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
            sb.quad(P(x0, y0, dp), P(xm, y0, dp), P(xm, ym, dp), P(x0, ym, dp)); sb.quad(P(x0, ym, dp), P(xm, ym, dp), P(xm, y1, dp), P(x0, y1, dp));
            sb.quad(P(xm, y0, dp), P(x1, y0, dp + 0.5), P(x1, ym, dp + 0.5), P(xm, ym, dp)); sb.quad(P(xm, ym, dp), P(x1, ym, dp + 0.5), P(x1, y1, dp + 0.5), P(xm, y1, dp));
          } else {
            const shut = rng() < 0.24;
            if (shut) {
              // closed shutters: two leaves of plain sheet meeting on a seam
              sb.set(Math.min(o.age + 0.1, 0.5), 0.3, 0, 0); sb.seam = 1.25;
              for (let jj = 0; jj < 3; jj++) for (let i = 0; i < 2; i++) {
                const xa = lerp(x0, x1, i / 2), xb = lerp(x0, x1, (i + 1) / 2), ya = lerp(y0, y1, jj / 3), yb = lerp(y0, y1, (jj + 1) / 3);
                sb.quad(P(xa, ya, 0.12, xa - x0, y1 - ya), P(xb, ya, 0.12, xb - x0, y1 - ya), P(xb, yb, 0.12, xb - x0, y1 - yb), P(xa, yb, 0.12, xa - x0, y1 - yb));
              }
            } else {
              // the fire-gilt leaf behind, in hand-sized flats that glint in turn (it sits in the recess, so it is dim
              // until a flat catches the sky)
              sb.set(0, 0.8, 1, 0);
              for (let jj = 0; jj < 3; jj++) for (let i = 0; i < 2; i++) {
                const xa = lerp(x0, x1, i / 2), xb = lerp(x0, x1, (i + 1) / 2), ya = lerp(y0, y1, jj / 3), yb = lerp(y0, y1, (jj + 1) / 3);
                sb.quad(P(xa, ya, dp - 0.04), P(xb, ya, dp - 0.04), P(xb, yb, dp - 0.04), P(xa, yb, dp - 0.04));
              }
              // the punched fretwork in front of it: a lattice of strip, a mullion and a transom
              sb.set(Math.min(o.age + 0.1, 0.5), 0.25, 0, 0); const was = sb.facets; sb.facets = false;
              const bar = (xa, ya, xb, yb, w) => { const dx = xb - xa, dy = yb - ya, l = Math.hypot(dx, dy) || 1, px = (-dy / l) * w, py = (dx / l) * w; sb.quad(P(xa - px, ya - py, 0.05), P(xb - px, yb - py, 0.05), P(xb + px, yb + py, 0.05), P(xa + px, ya + py, 0.05)); };
              const W = x1 - x0, Hh = y1 - y0, pitch = W / 2.5, bwid = 0.13;
              for (let a = -Hh + pitch * 0.5; a < W; a += pitch) {
                const ex = a >= 0 ? a : 0, ey = a >= 0 ? 0 : -a, fx = a + Hh <= W ? a + Hh : W, fy = a + Hh <= W ? Hh : W - a;
                bar(x0 + ex, y0 + ey, x0 + fx, y0 + fy, bwid); bar(x1 - fx, y0 + fy, x1 - ex, y0 + ey, bwid);
              }
              bar((x0 + x1) / 2, y0, (x0 + x1) / 2, y1, 0.09); bar(x0, lerp(y0, y1, 0.62), x1, lerp(y0, y1, 0.62), 0.09);
              sb.facets = was;
            }
            // a rolled sill
            sb.set(Math.min(o.age + 0.05, 0.5), 0, 0, 0); sb.seam = -1;
            sb.tube([P(x0 - 0.2, y0 - 0.05, -0.12), P(x1 + 0.2, y0 - 0.05, -0.12)], 0.13, 4);
            if (o.swing && s > 0 && !shut && rng() < 0.4) { const sg = rng() < 0.5 ? -1 : 1, xh = sg < 0 ? x0 : x1; shutters.push({ p: P(xh, y0, -0.04), d: P(xh + sg, y0, -0.04), n: P(xh, y0, -1.04), h: y1 - y0, w: (x1 - x0) / 2, age: o.age }); }
          }
          sb.set(0.25, 0, 0, 0); sb.ageFn = f0;
        }
        // a string course between the storeys
        sb.seam = -1; sb.shelter = 0;
        sb.tube([P(bx, 5 * rh, -0.1), P(bx + bw, 5 * rh, -0.1)], 0.16, 4);
        if (o.swing && rng() < 0.3) { const yy = (rng() < 0.5 ? 5.25 : 10.25) * rh; signs.push({ p: P(bx + bw * 0.5, yy, 0), n: P(bx + bw * 0.5, yy, -1), age: o.age }); }
      }
      sb.shelter = 0;
    };
    // ---------- a gabled house of sheet ----------
    // o: x, z, y (ground), yaw, L (along the ridge), D (across), eave, ridge, fl (flat size), lod (0 near, 1 middle,
    // 2 far: one flat per slope), gable ('step' | 'scroll' | 'plain'), age. Local frame: X along the ridge, Z across.
    const gilt = [];                                     // [x, y, z, size] finials for the weathercocks to stand on
    const ridges = [];                                   // [a, b] ridge lines near the path, where the drops hop
    const isOld = (x, z) => 0.55 * (0.5 + 0.5 * Math.sin(x * 0.021 + 1.3) * Math.sin(z * 0.017 + 0.4)) + 0.45 * h2(x * 0.173, z * 0.091) > 0.65 && !(Math.abs(x) < 46 && z < 105);
    const house = (sb, o) => {
      const cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0), y0 = o.y || 0;
      const T = (lx, y, lz, u, v) => [o.x + lx * cy + lz * sy, y0 + y, o.z - lx * sy + lz * cy, u, v];
      const L = o.L, Dp = o.D, hl = L / 2, hd = Dp / 2, eave = o.eave, ridge = o.ridge, fl = o.fl, lod = o.lod;
      const rise = ridge - eave, sl = Math.hypot(hd, rise), ov = lod < 2 ? 0.55 : 0;     // the eaves overhang
      const hAge = o.age, hid = rng();
      const st = (shel) => { sb.shelter = shel; };
      sb.ageFn = (x, y, z, id) => [Math.min(hAge + AGEV * 0.3 * (id - 0.5) + (id > 0.975 ? 0.05 : 0), o.far ? 0.95 : 0.5), 0];
      // walls (the top course is kept dry and brown by the eaves: rain shadow)
      const wall = (ax, az, bx, bz, len) => {
        const wk = lod === 0 ? 1.3 : 2.1, nu = lod === 2 ? 1 : Math.max(1, Math.round(len / (fl * wk))), nv = lod === 2 ? 1 : Math.max(2, Math.round(eave / (fl * wk)));
        sb.seam = -2.4;
        for (let j = 0; j < nv; j++) {
          st(lod < 2 && j === nv - 1 ? 0.9 : 0);
          for (let i = 0; i < nu; i++) {
            const s0 = i / nu, s1 = (i + 1) / nu, ya = (eave * j) / nv, yb = (eave * (j + 1)) / nv;
            sb.quad(T(lerp(ax, bx, s0), ya, lerp(az, bz, s0), s0 * len, eave - ya), T(lerp(ax, bx, s1), ya, lerp(az, bz, s1), s1 * len, eave - ya),
              T(lerp(ax, bx, s1), yb, lerp(az, bz, s1), s1 * len, eave - yb), T(lerp(ax, bx, s0), yb, lerp(az, bz, s0), s0 * len, eave - yb));
          }
        }
        st(0);
      };
      if (o.front) facade(sb, T, L, eave, hd, o); else wall(-hl, hd, hl, hd, L);
      wall(hl, -hd, -hl, -hd, L);
      // the two slopes: flats uneven in size, standing seams every 0.6 m and rivet rows drawn by the material
      const nu = lod === 2 ? 1 : Math.max(2, Math.round(L / fl)), nv = lod === 2 ? 1 : Math.max(2, Math.round(sl / fl));
      const ju = (i, j, sd) => (i === 0 || i === nu ? 0 : (h2(i + hid * 91, j + sd * 13) - 0.5) * 0.5 / nu);
      const jv = (i, j, sd) => (j === 0 || j === nv ? 0 : (h2(i * 1.7 + hid * 37, j + sd * 29) - 0.5) * 0.5 / nv);
      sb.seam = lod === 0 ? 0.6 : 1.2;
      // on the roofs each flat keeps more of its own colour, so the hammer's work can be counted from the air
      if (lod < 2) sb.ageFn = (x, y, z, id) => [Math.min(hAge + AGEV * 0.8 * (id - 0.5) + (id > 0.965 ? 0.06 : 0), 0.5), 0];
      // an old city: here and there a roof was never re-sheeted and stands chalk mint, in loose neighbourhoods
      if (lod < 2 && isOld(o.x, o.z)) sb.ageFn = (x, y, z, id) => [0.85 + 0.09 * id, 0];
      for (const sd of [1, -1]) {
        const dent = lod === 0 && rng() < 0.3 ? [rng(), rng()] : null;       // a dent the hammer left
        sb.grid(nu, nv, (s, t) => {
          const i = Math.round(s * nu), j = Math.round(t * nv), ss = s + ju(i, j, sd), tt = t + jv(i, j, sd);
          const k = 1 - tt + (tt === 0 ? ov / sl : 0);
          let sag = 0; if (dent) sag = -0.22 * Math.exp(-((ss - dent[0]) ** 2 + (tt - dent[1]) ** 2) * 30) * (i > 0 && i < nu && j > 0 && j < nv ? 1 : 0);
          return T(sd * (-hl + ss * L), eave + rise * (1 - k) + sag, sd * hd * k, ss * L, k * sl);
        });
      }
      if (lod === 2) {
        sb.seam = -3;
        for (const e of [1, -1]) sb.quad(T(e * hl, 0, e * hd, 0, eave + rise), T(e * hl, 0, -e * hd, Dp, eave + rise), T(e * hl, eave, -e * hd, Dp, rise), T(e * hl, eave + rise, 0, hd, 0)),
          sb.quad(T(e * hl, 0, e * hd, 0, eave + rise), T(e * hl, eave + rise, 0, hd, 0), T(e * hl, eave, e * hd, 0, rise));
        sb.ageFn = null; return;
      }
      sb.ageFn = (x, y, z, id) => [Math.min(hAge + AGEV * 0.3 * (id - 0.5) + (id > 0.975 ? 0.05 : 0), 0.5), 0];
      // gable ends: a parapet sheet standing proud of the roof, crow-stepped or scrolled; its back shows brown
      const steps = o.gable === 'plain' ? 0 : Math.max(3, Math.round(hd / 1.5));
      const top = (q) => {                                // parapet height at q = 0..1 across the depth
        const a = 1 - Math.abs(2 * q - 1);
        if (o.gable === 'step') return eave + rise * Math.min(1, (Math.floor(a * steps) + 1) / steps) + 0.35;
        if (o.gable === 'scroll') return eave + rise * a + 0.6 + 0.8 * Math.abs(Math.sin(a * Math.PI * 2.5)) * (1 - a * 0.5);
        return eave + rise * a;
      };
      const plain = o.gable === 'plain', ncol = plain ? Math.max(2, Math.round(Dp / (fl * (lod ? 2.2 : 1.3)))) : steps * 2;
      const yb0 = plain ? 0 : Math.max(0, eave - 1.2);         // below the eaves a party wall is hidden by its neighbour
      sb.seam = -2.4;
      for (const e of [1, -1]) {
        const x = e * (hl + (plain ? 0 : 0.12));
        for (let c = 0; c < ncol; c++) {
          const q0 = c / ncol, q1 = (c + 1) / ncol, za = e * (hd - q0 * Dp), zb = e * (hd - q1 * Dp);
          const ha = o.gable === 'step' ? top((q0 + q1) / 2) : top(q0), hb = o.gable === 'step' ? ha : top(q1), hm = Math.max(ha, hb);
          const rows = plain ? Math.max(1, Math.round(hm / (fl * (lod ? 2.6 : 1.5)))) : clamp(Math.round((hm - yb0) / (fl * 1.5)), 1, 3);
          for (let r = 0; r < rows; r++) {
            const f0 = r / rows, f1 = (r + 1) / rows, a0 = lerp(yb0, ha, f0), b0 = lerp(yb0, hb, f0), a1 = lerp(yb0, ha, f1), b1 = lerp(yb0, hb, f1);
            sb.quad(T(x, a0, za, q0 * Dp, hm - a0), T(x, b0, zb, q1 * Dp, hm - b0), T(x, b1, zb, q1 * Dp, hm - b1), T(x, a1, za, q0 * Dp, hm - a1));
          }
        }
        if (!plain) for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
          const za = e * (hd - (c / 2) * Dp), zb = e * (hd - ((c + 1) / 2) * Dp), ya = (yb0 * r) / 2, yb = (yb0 * (r + 1)) / 2;
          sb.quad(T(x, ya, za, c * hd, eave - ya), T(x, ya, zb, (c + 1) * hd, eave - ya), T(x, yb, zb, (c + 1) * hd, eave - yb), T(x, yb, za, c * hd, eave - yb));
        }
      }
      if (lod === 0) {
        // rolled beads along both eaves, a chimney with its pot, a gilt ball on one gable
        const ek = 1 + ov / sl, ey = eave - rise * (ov / sl);
        sb.seam = -1; st(0);
        for (const sd of [1, -1]) sb.tube([T(-hl, ey, sd * hd * ek), T(0, ey, sd * hd * ek), T(hl, ey, sd * hd * ek)], 0.16, 4);
        sb.tube([T(-hl, ridge + 0.05, 0), T(0, ridge + 0.05, 0), T(hl, ridge + 0.05, 0)], 0.14, 4);
        ridges.push([T(-hl, ridge + 0.22, 0), T(hl, ridge + 0.22, 0)]);
        if (o.chimney !== false) {
          const cx = (rng() - 0.5) * L * 0.6, cz = (rng() < 0.5 ? -1 : 1) * hd * 0.3, cb = eave + rise * 0.6, ct = ridge + 0.7 + rng() * 0.9, w = 0.42;
          sb.seam = -1.5;
          const c4 = [[-w, -w], [w, -w], [w, w], [-w, w]];
          for (let k = 0; k < 4; k++) { const a = c4[k], b = c4[(k + 1) % 4]; sb.quad(T(cx + b[0], cb, cz + b[1], 0, ct - cb), T(cx + a[0], cb, cz + a[1], 1.1, ct - cb), T(cx + a[0], ct, cz + a[1], 1.1, 0), T(cx + b[0], ct, cz + b[1], 0, 0)); }
          sb.tube([T(cx, ct - 0.1, cz), T(cx, ct + 0.7, cz)], (k) => (k ? 0.2 : 0.28), 5);
        }
        if (o.gable !== 'plain') { const e = rng() < 0.5 ? 1 : -1, p = T(e * (hl + 0.12), top(0.5) + 0.5, 0); gilt.push([p[0], p[1], p[2], 0.34 + rng() * 0.2]); }
      }
      sb.ageFn = null;
    };
    // a fire-gilt ball (finials, spire tops): an octahedron of eight hand-sized flats on a short stem
    const giltBall = (sb, x, y, z, r) => {
      const a0 = sb.age, k0 = sb.kind, f0 = sb.ageFn; sb.ageFn = null; sb.set(0, 0, 1, 0); sb.seam = -1;
      const E = [[r, 0, 0], [0, 0, -r], [-r, 0, 0], [0, 0, r]];
      for (let k = 0; k < 4; k++) {
        const a = E[k], b = E[(k + 1) % 4];
        sb.quad([x + a[0], y, z + a[2]], [x + b[0], y, z + b[2]], [x, y + r * 1.15, z]);
        sb.quad([x + b[0], y, z + b[2]], [x + a[0], y, z + a[2]], [x, y - r * 1.15, z]);
      }
      sb.tube([[x, y - r * 2.2, z], [x, y - r * 1.0, z]], r * 0.22, 4);
      sb.set(a0, 0, k0, 0); sb.ageFn = f0;
    };
    // ---------- spires: a square tower of flats, an eight-sided spire (one twisted like barley sugar), a gilt ball ----------
    const SPIRES = [[-44, 232, 64, 1], [46, 224, 72, 0], [-88, 78, 56, 0], [104, 50, 66, 0], [-150, 158, 52, 0], [74, 166, 58, 0], [-128, 330, 60, 0], [118, 372, 54, 0]];
    const spire = (sb, sx, sz, hTot, twist) => {
      const w = 4.6, hT = hTot * 0.44, sAge = AGE0 + 0.06 + rng() * 0.08;
      sb.ageFn = (x, y, z, id) => [Math.min(sAge + AGEV * 0.3 * (id - 0.5) + (id > 0.975 ? 0.05 : 0), 0.5), 0];
      const c4 = [[-w, w], [w, w], [w, -w], [-w, -w]];
      for (let k = 0; k < 4; k++) {
        const a = c4[k], b = c4[(k + 1) % 4], nv = Math.round(hT / 2.2);
        sb.seam = -2.4;
        for (let j = 0; j < nv; j++) for (let i = 0; i < 4; i++) {
          const s0 = i / 4, s1 = (i + 1) / 4, ya = (hT * j) / nv, yb = (hT * (j + 1)) / nv;
          const louvre = j >= nv - 3 && j < nv - 1 && (i === 1 || i === 2);          // the belfry opening: sheltered brown
          sb.shelter = j === nv - 1 ? 0.9 : louvre ? 0.75 : 0;
          const inset = louvre ? 0.45 : 0, nx = (b[1] - a[1]) / (2 * w), nz = -(b[0] - a[0]) / (2 * w);
          const P = (s, y) => [sx + lerp(a[0], b[0], s) + nx * inset, y, sz + lerp(a[1], b[1], s) + nz * inset, s * 2 * w, hT - y];
          sb.quad(P(s0, ya), P(s1, ya), P(s1, yb), P(s0, yb));
        }
      }
      sb.shelter = 0;
      // cornice bead and four corner pinnacles
      sb.tube(c4.map((c) => [sx + c[0] * 1.08, hT, sz + c[1] * 1.08]), 0.3, 4, true);
      for (const c of c4) { sb.tube([[sx + c[0], hT, sz + c[1]], [sx + c[0], hT + 4.5, sz + c[1]]], (k) => (k ? 0.05 : 0.5), 4); }
      // the spire: 8 sides, courses of flats that narrow to the top
      const R0 = w * 1.02, nC = 11, hS = hTot - hT;
      const SP = (k, t, u) => { const a = ((k + 0.5) / 8) * TAU + twist * t * 2.6, r = R0 * (1 - t) + 0.12; return [sx + r * Math.sin(a), hT + hS * t, sz + r * Math.cos(a), u, hS * (1 - t)]; };
      sb.seam = 0.6;
      if (h2(sx * 0.37, sz * 0.11) > 0.3) sb.ageFn = (x, y, z, id) => [0.86 + 0.08 * id, 0];      // most spires are old chalk mint
      for (let j = 0; j < nC; j++) for (let k = 0; k < 8; k++) {
        const t0 = j / nC, t1 = (j + 1) / nC, u0 = k * 3.4, u1 = k * 3.4 + 3.4 * (1 - t0);
        if (j < 5) { const m0 = SP(k + 0.5, t0, (u0 + u1) / 2), m1 = SP(k + 0.5, t1, (u0 + u1) / 2); sb.quad(SP(k, t0, u0), m0, m1, SP(k, t1, u0)); sb.quad(m0, SP(k + 1, t0, u1), SP(k + 1, t1, u1), m1); }
        else sb.quad(SP(k, t0, u0), SP(k + 1, t0, u1), SP(k + 1, t1, u1), SP(k, t1, u0));
      }
      sb.ageFn = null;
      giltBall(sb, sx, hTot + 1.5, sz, 1.05);
      gilt.push([sx, hTot + 2.8, sz, 1.5]);
    };
    {
      const sb = new SheetBuilder(rng, 16000);
      for (const s of SPIRES) { await ctx.yield(); spire(sb, s[0], s[1], s[2], s[3]); await ctx.yield(); }
      flush(sb, 'spires');
    }
    const nearSpire = (x, z, r) => { for (const s of SPIRES) if (Math.abs(x - s[0]) < r + 5 && Math.abs(z - s[1]) < r + 5) return true; return false; };

    // ---------- the gables: terraces of steep roofs, ridges at 20 to 30 m, under the first 190 m of the flight ----------
    {
      const rows = []; for (let z = -62; z < 100; z += 19) rows.push(z); for (let z = 147; z < 190; z += 19) rows.push(z);
      let sb = new SheetBuilder(rng, 30000), sbm = new SheetBuilder(rng, 16000), nrow = 0, hn = 0;
      for (const zr of rows) {
        let x = -152 + rng() * 4; const rowEave = 12 + rng() * 4.5, rowRise = 7.5 + rng() * 3;
        while (x < 150) {
          const cross = rng() < 0.14, wide = cross ? 7.5 + rng() * 3 : 8 + rng() * 6.5;
          const xc = x + wide / 2, near = Math.abs(xc) < 46;
          const eave = rowEave + (rng() - 0.5) * 2.6, riseH = rowRise + (rng() - 0.5) * 2.2 + (cross ? 1.5 : 0);
          let ridge = eave + riseH; if (Math.abs(xc) < 16) ridge = Math.min(ridge, 28.6); ridge = Math.min(ridge, 30);
          const o = { x: xc, z: zr + (rng() - 0.5) * 1.2, yaw: cross ? Math.PI / 2 : 0, L: cross ? 11.5 + rng() * 1.5 : wide, D: cross ? wide : 10.5 + rng() * 1.5,
            eave: Math.min(eave, ridge - 5), ridge, fl: near ? 2.3 : 3.2, lod: near ? 0 : 1, gable: rng() < 0.62 ? 'step' : rng() < 0.6 ? 'scroll' : 'plain', age: AGE0 + (rng() - 0.5) * 0.15 };
          // the houses facing us across the canal carry the Row's fronts: fretted windows over gilt leaves, sills, doors
          if (zr === 147 && !cross && Math.abs(xc) < 78) { o.front = true; o.yaw = Math.PI; o.lod = 0; o.fl = 2.3; o.chimney = false; }
          // the quay before the canal is left open on the axis, and the row behind it kept low, so the canal shows
          if (zr === 71 && Math.abs(xc) < 56) { o.eave = 6.5 + (o.eave - rowEave); o.ridge = o.eave + 6; }
          const skip = nearSpire(xc, zr, 7) || (rng() < 0.05 && Math.abs(xc) > 20) || (zr === 90 && Math.abs(xc) < 62);
          if (!skip) house(near ? sb : sbm, o);
          if (++hn % 2 === 0) await ctx.yield();
          x += wide + 0.5 + (rng() < 0.12 ? 3.5 : 0);
        }
        nrow++;
        await ctx.yield();
        if (nrow % 2 === 0) { flush(sb, 'gables'); sb = new SheetBuilder(rng, 30000); }
      }
      flush(sb, 'gables'); flush(sbm, 'gables-side');
      await ctx.yield();
    }
    {
      // a slim beacon turret on the open quay: one gilt weathercock stands close under the flight
      const sb = new SheetBuilder(rng.fork('quay'), 700), tx = 10.5, tz = 97, w = 1.05, hT = 17, hTot = 23.5, tAge = AGE0 + 0.07;
      sb.ageFn = (x, y, z, id) => [Math.min(tAge + AGEV * 0.3 * (id - 0.5), 0.5), 0];
      const c4 = [[-w, w], [w, w], [w, -w], [-w, -w]];
      sb.seam = -2.4;
      for (let k = 0; k < 4; k++) {
        const a = c4[k], b = c4[(k + 1) % 4], nv = 8;
        for (let j = 0; j < nv; j++) {
          const ya = (hT * j) / nv, yb = (hT * (j + 1)) / nv; sb.shelter = j === nv - 1 ? 0.9 : 0;
          sb.quad([tx + a[0], ya, tz + a[1], 0, hT - ya], [tx + b[0], ya, tz + b[1], 2 * w, hT - ya], [tx + b[0], yb, tz + b[1], 2 * w, hT - yb], [tx + a[0], yb, tz + a[1], 0, hT - yb]);
        }
      }
      sb.shelter = 0;
      sb.tube(c4.map((c) => [tx + c[0] * 1.3, hT, tz + c[1] * 1.3]), 0.16, 4, true);
      const hS = hTot - hT, SP = (k, t) => { const a2 = ((k + 0.5) / 8) * TAU, r = w * 1.25 * (1 - t) + 0.08; return [tx + r * Math.sin(a2), hT + hS * t, tz + r * Math.cos(a2), k * 0.9, hS * (1 - t)]; };
      sb.seam = 0.6;
      for (let j = 0; j < 4; j++) for (let k = 0; k < 8; k++) sb.quad(SP(k, j / 4), SP(k + 1, j / 4), SP(k + 1, (j + 1) / 4), SP(k, (j + 1) / 4));
      sb.ageFn = null;
      giltBall(sb, tx, hTot + 0.6, tz, 0.5);
      gilt.push([tx, hTot + 1.2, tz, 1.5, 1.22]);    // turned broadside to the flight
      flush(sb, 'quay-turret');
    }
    // ---------- Coppersmiths' Row: a street 14 m wide between facades 22 m tall, bending to port and back ----------
    const rowPipes = [];
    {
      for (const side of [1, -1]) {
        let sb = new SheetBuilder(rng, 40000), z = 200 + rng() * 2, n = 0;
        while (z < 440) {
          const L = Math.min(9 + rng() * 2.5, 449 - z), zc = z + L / 2, phi = Math.atan((rowX(zc + 0.5) - rowX(zc - 0.5)));
          const Dp = 14 + rng() * 2, eave = 20.5 + rng() * 3, ridge = eave + 6.5 + rng() * 2.5, off = 7 + Dp / 2;
          house(sb, { x: rowX(zc) + side * off * Math.cos(phi), z: zc - side * off * Math.sin(phi), yaw: -side * Math.PI / 2 + phi, L, D: Dp, eave, ridge,
            fl: 1.7, lod: 0, gable: rng() < 0.7 ? 'step' : 'scroll', age: AGE0 + (rng() - 0.5) * 0.1, front: true, swing: true });
          if (n % 2 === (side > 0 ? 0 : 1) && z > 262 && z + L < 440) rowPipes.push([side, z + L + 0.22, eave]);
          z += L + 0.45; n++;
          await ctx.yield();
          if (n % 8 === 0) { flush(sb, 'row'); sb = new SheetBuilder(rng, 40000); }
        }
        flush(sb, 'row');
      }
      // the terraces behind the Row, either side, out to the middle city
      let sb = new SheetBuilder(rng, 30000), k = 0;
      for (let zr = 207; zr < 430; zr += 19) {
        for (const side of [1, -1]) {
          let d = 27 + rng() * 3;
          while (d < 150) {
            const cross = rng() < 0.3, wide = cross ? 8 + rng() * 3 : 8 + rng() * 6, xc = rowX(zr) + side * (d + wide / 2);
            const eave = 11 + rng() * 7, ridge = Math.min(eave + 6.5 + rng() * 4.5, 31), nearish = d < 60;
            if (!nearSpire(xc, zr, 7) && Math.abs(xc) < 158) house(sb, { x: xc, z: zr + (rng() - 0.5), yaw: cross ? Math.PI / 2 : 0, L: cross ? 12 : wide, D: cross ? wide : 11 + rng() * 1.5, eave, ridge,
              fl: nearish ? 2.2 : 3, lod: 1, gable: rng() < 0.6 ? 'step' : 'plain', age: AGE0 + (rng() - 0.5) * 0.09 });
            d += wide + 0.5 + (rng() < 0.1 ? 4 : 0);
          }
          await ctx.yield();
        }
        await ctx.yield();
        if (++k % 4 === 0) { flush(sb, 'row-back'); sb = new SheetBuilder(rng, 30000); }
      }
      flush(sb, 'row-back');
    }

    // ---------- things in the Row: rolled downpipes with scrolled spouts, the tinsmith's handcart, ladders, sheets ----------
    // (their own little generator, so the city's random sequence stays exactly as it was)
    {
      const fr = Object.assign(() => (fr.s = (fr.s * 16807) % 2147483647) / 2147483647, { s: 48271 + Math.abs((Number(ctx.seed) || 0) % 1000), range: (a, b) => a + (b - a) * fr() });
      const sb = new SheetBuilder(fr, 12000), threads = [];
      const frame = (z0) => { const phi = Math.atan(rowX(z0 + 0.5) - rowX(z0 - 0.5)), x0 = rowX(z0), ax = Math.sin(phi), az = Math.cos(phi), lx = Math.cos(phi), lz = -Math.sin(phi);
        return (al, la, y) => [x0 + ax * al + lx * la, y, z0 + az * al + lz * la]; };
      // a flat whose face is turned away from the point c (so the bright side is the one we see)
      const oq = (c, a, b, cc, d) => {
        const q = d || cc, nx = (cc[1] - a[1]) * (q[2] - b[2]) - (cc[2] - a[2]) * (q[1] - b[1]), ny = (cc[2] - a[2]) * (q[0] - b[0]) - (cc[0] - a[0]) * (q[2] - b[2]), nz = (cc[0] - a[0]) * (q[1] - b[1]) - (cc[1] - a[1]) * (q[0] - b[0]);
        const out = nx * (a[0] + cc[0] - 2 * c[0]) + ny * (a[1] + cc[1] - 2 * c[1]) + nz * (a[2] + cc[2] - 2 * c[2]);
        if (out >= 0) sb.quad(a, b, cc, d); else if (d) sb.quad(d, cc, b, a); else sb.quad(cc, b, a);
      };
      const box = (Q, a0, a1, l0, l1, y0, y1, top = true) => {
        const c = Q((a0 + a1) / 2, (l0 + l1) / 2, (y0 + y1) / 2), P = (i, j, k) => Q(i ? a1 : a0, j ? l1 : l0, k ? y1 : y0);
        oq(c, P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)); oq(c, P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1));
        oq(c, P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)); oq(c, P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1));
        if (top) oq(c, P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1));
      };
      // downpipes: one at every second party wall, hopper head under the eave, three straps, a scrolled shoe; under
      // each shoe a tinned gully dish, and a thread of water (a tin rod that only runs once it has rained there)
      let np = 0;
      for (const [side, zb, eave] of rowPipes) {
        const Q = frame(zb), s = side, top = eave - 0.55;
        sb.set(AGE0 + fr.range(-0.04, 0.06), 0, 0, 0); sb.seam = -2.4;
        sb.tube([Q(0, s * 6.66, top), Q(0, s * 6.66, top - 0.75)], (k) => (k ? 0.17 : 0.3), 5);
        const ys = [top - 0.75, top * 0.66, top * 0.36, 3.6];
        sb.tube([...ys.map((y) => Q(0, s * 6.66, y)), Q(0, s * 6.62, 3.1), Q(0, s * 6.42, 2.76), Q(0, s * 6.12, 2.64), Q(0, s * 5.9, 2.7), Q(0, s * 5.82, 2.85)], 0.15, 4);
        for (const y of [top * 0.8, top * 0.5, 4.0]) sb.tube([Q(0, s * 6.66, y + 0.09), Q(0, s * 6.66, y - 0.09)], 0.21, 4);
        sb.set(0.1, 0, 2, 0); sb.seam = -1;
        const c = Q(0, s * 5.8, 0.15);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, b = ((k + 1) / 6) * TAU; oq([c[0], -5, c[2]], c, [c[0] + 0.85 * Math.cos(a), 0.15, c[2] + 0.85 * Math.sin(a)], [c[0] + 0.85 * Math.cos(b), 0.15, c[2] + 0.85 * Math.sin(b)]); }
        const m = Q(0, s * 5.82, 2.8); threads.push(m[0], m[1], m[2], c[0], 0.16, c[2], 0.085, 2);
        if (++np % 6 === 0) await ctx.yield();
      }
      // the handcart: a tray on two strip wheels, two shafts, loaded with bright offcuts of new sheet and two rolls
      const cart = (z0, la0, turn) => {
        const F = frame(z0), ct = Math.cos(turn) * 1.3, st = Math.sin(turn) * 1.3, Q = (al, la, y) => F(al * ct - la * st, la0 + al * st + la * ct, 0.1 + (y - 0.1) * 1.3);
        sb.set(AGE0 + 0.08, 0, 0, 0); sb.seam = -1; sb.facets = true;
        box(Q, -1.7, 1.7, -0.85, 0.85, 0.98, 1.16); box(Q, -1.7, 1.7, -0.85, -0.8, 1.16, 1.62, false); box(Q, -1.7, 1.7, 0.8, 0.85, 1.16, 1.62, false); box(Q, -1.7, -1.65, -0.85, 0.85, 1.16, 1.62, false);
        for (const w of [-1, 1]) {
          const ring = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; ring.push(Q(0.82 * Math.cos(a) - 0.2, w * 1.0, 0.92 + 0.82 * Math.sin(a))); }
          sb.tube(ring, 0.07, 4, true);
          for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI; sb.tube([Q(0.8 * Math.cos(a) - 0.2, w * 1.0, 0.92 + 0.8 * Math.sin(a)), Q(-0.8 * Math.cos(a) - 0.2, w * 1.0, 0.92 - 0.8 * Math.sin(a))], 0.04, 3); }
          sb.tube([Q(1.7, w * 0.7, 1.07), Q(3.1, w * 0.6, 1.32)], 0.05, 4); sb.tube([Q(1.55, w * 0.7, 0.98), Q(1.65, w * 0.72, 0.12)], 0.05, 4);
        }
        sb.tube([Q(-0.2, -1.0, 0.92), Q(-0.2, 1.0, 0.92)], 0.06, 4);
        // the load
        for (let k = 0; k < 16; k++) {
          sb.set(0.0 + 0.05 * fr(), 0, 0, 1);
          const al = fr.range(-1.3, 1.2), la = fr.range(-0.5, 0.5), y = 1.2 + k * 0.05, w = fr.range(0.5, 1.0), h = fr.range(0.35, 0.7), yaw = fr.range(0, TAU), tl = k > 10 ? fr.range(0.7, 1.25) : fr.range(-0.12, 0.3);
          const cy = Math.cos(yaw), sy = Math.sin(yaw), up = Math.sin(tl) * h * 2, fl = Math.cos(tl) * h;
          const P = (i, j) => Q(al + (i * w) * cy - (j * fl) * sy, la + (i * w) * sy + (j * fl) * cy, y + (j > 0 ? up : 0));
          const cc = Q(al, la, y - 3); if (k % 3 === 2) oq(cc, P(-1, -1), P(1, -1), P(0.2, 1)); else oq(cc, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1));
        }
        sb.set(0.02, 0, 0, 1); sb.tube([Q(-1.2, -0.45, 1.95), Q(0.9, -0.3, 2.0)], 0.2, 6); sb.tube([Q(-0.9, 0.35, 1.9), Q(1.3, 0.5, 1.98)], 0.16, 6);
      };
      const ladder = (z0, side, len) => {
        const Q = frame(z0), s = side; sb.set(AGE0 + 0.1, 0, 0, 0); sb.seam = -1;
        const at = (k, w) => Q(w * 0.3, s * lerp(4.9, 6.55, k), lerp(0.12, len, k));
        for (const w of [-1, 1]) sb.tube([at(0, w), at(1, w)], 0.075, 4);
        for (let y = 0.45; y < len - 0.2; y += 0.42) sb.tube([at(y / len, -1), at(y / len, 1)], 0.045, 3);
      };
      // sheets of new copper leaning on a wall
      const lean = (z0, side, n) => { const Q = frame(z0), s = side; for (let k = 0; k < n; k++) { sb.set(0.0 + 0.06 * fr(), 0, 0, 1); sb.seam = -1; sb.facets = true;
        const a0 = -1.1 + k * 0.25 + fr.range(-0.2, 0.2), w = fr.range(1.6, 2.3), h = fr.range(1.5, 2.4), ft = 6.0 - k * 0.14;
        oq(Q(a0 + w / 2, s * 9, 1), Q(a0, s * ft, 0.13), Q(a0 + w, s * ft, 0.13), Q(a0 + w, s * (ft + 0.45), 0.13 + h), Q(a0, s * (ft + 0.45), 0.13 + h)); } };
      cart(283, -4.3, 0.12); ladder(309, 1, 7.6); lean(296, -1, 3);
      await ctx.yield();
      cart(413, -4.4, -0.2); ladder(428, -1, 6.8); lean(371, -1, 4); lean(336, 1, 2); ladder(352, -1, 7.2);
      await ctx.yield();
      flush(sb, 'row-things');
      await ctx.yield();
      const th = rodMesh(threads, style, fr); th.name = 'row-threads'; scene.add(th);
      await ctx.yield();
    }

    // ---------- the cathedral square: tall houses with fretted fronts round three sides ----------
    {
      for (const side of [1, -1]) {
        const sb = new SheetBuilder(rng, 40000);
        // the Row's mouth: two corner houses facing the square, then the long sides
        let x = 24;
        while (x < 54) { const L = Math.min(10 + rng() * 3, 56 - x); house(sb, { x: side * (x + L / 2), z: 448 - 6.5, yaw: 0, L, D: 13, eave: 19 + rng() * 3, ridge: 28 + rng() * 2.5, fl: 2.2, lod: 1, gable: 'step', age: AGE0 + (rng() - 0.5) * 0.1 }); x += L + 0.5; }
        let z = 441;
        while (z < 650) {
          const L = 10 + rng() * 3.5, Dp = 14 + rng() * 2, eave = 19 + rng() * 4.5, off = (z > 520 ? 62 : 55 + 7 * smoothstep(495, 520, z)) + Dp / 2;
          house(sb, { x: side * off, z: z + L / 2, yaw: -side * Math.PI / 2, L, D: Dp, eave, ridge: eave + 7 + rng() * 2.5, fl: 2.4, lod: 1,
            gable: rng() < 0.6 ? 'step' : 'scroll', age: AGE0 + (rng() - 0.5) * 0.1, front: true, door: true, chimney: rng() < 0.6 });
          z += L + 0.5;
          await ctx.yield();
        }
        flush(sb, 'square-side');
      }
      const sb = new SheetBuilder(rng, 30000);
      for (let x = -76; x < 76;) { const L = 10 + rng() * 4; house(sb, { x: x + L / 2, z: 684, yaw: Math.PI, L, D: 14, eave: 18 + rng() * 5, ridge: 27 + rng() * 5, fl: 2.4, lod: 1, gable: 'step', age: AGE0 + (rng() - 0.5) * 0.1 }); x += L + 0.5; }
      // and the streets of terraces beside and beyond the square, as far as the near ground goes
      for (let zr = 462; zr < 664; zr += 19) for (const side of [1, -1]) {
        let d = 80 + rng() * 2;
        while (d < 150) { const wide = 8 + rng() * 6, eave = 11 + rng() * 7; house(sb, { x: side * (d + wide / 2), z: zr, yaw: 0, L: wide, D: 11.5, eave, ridge: Math.min(eave + 7 + rng() * 4, 31), fl: 3, lod: 1, gable: rng() < 0.6 ? 'step' : 'plain', age: AGE0 + (rng() - 0.5) * 0.09 }); d += wide + 0.5; }
        if (side < 0) await ctx.yield();
      }
      flush(sb, 'square-back');
      await ctx.yield();
    }
    // ---------- the middle city (3 to 4 m flats) and the far city (one flat per slope), paler and greener with distance ----------
    {
      const tiles = new Map();
      const tile = (x, z, size, cap) => { const k = Math.floor(x / size) + ':' + Math.floor(z / size) + ':' + size; let sb = tiles.get(k); if (!sb) { sb = new SheetBuilder(rng, cap); tiles.set(k, sb); } return sb; };
      const cell = 46 / Math.sqrt(detail);
      let n = 0;
      for (let z = -120; z < 1200; z += cell) {
        for (let x = -480; x < 480; x += cell) {
          const xc = x + cell * (0.3 + 0.4 * rng()), zc = z + cell * (0.3 + 0.4 * rng()), r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
          if (inNear(xc, zc) || (xc > -176 && xc < 176 && zc > -96 && zc < 688) || inCanal(xc, zc + 8) || inCanal(xc, zc - 8)) continue;
          if (r4 < 0.08) continue;
          const L = 14 + r1 * 12, eave = 9 + r2 * 8;
          house(tile(xc, zc, 240, 12000), { x: xc, z: zc, yaw: (r3 < 0.5 ? 0 : Math.PI / 2) + (r4 - 0.5) * 0.3, L, D: 10 + r2 * 3, eave, ridge: eave + 6 + r1 * 4, fl: 4.6, lod: 1, gable: 'plain', age: AGE0 + 0.03 + (r3 - 0.5) * 0.1 });
          if (++n % 16 === 0) await ctx.yield();
        }
      }
      const fcell = 80;
      for (let z = -320; z < 2200; z += fcell) {
        for (let x = -2000; x < 2000; x += fcell) {
          const r = Math.hypot(x, z - 400), r0 = rng(), r1 = rng(), r2 = rng(), r3 = rng();
          if (r > 1560 || inMid(x + 40, z + 40)) continue;
          const dAge = 0.22 * smoothstep(400, 1600, r), nh = r0 < 0.15 ? 1 : 3, yaw = r1 < 0.5 ? 0 : Math.PI / 2;
          for (let k = 0; k < nh; k++) {
            const xc = x + 40 + (k - 1) * (yaw ? 22 : 4) + (r2 - 0.5) * 20, zc = z + 40 + (k - 1) * (yaw ? 4 : 22) + (r3 - 0.5) * 20, tower = nh === 1 && r2 < 0.5;
            const eave = tower ? 30 + r3 * 26 : 10 + ((r2 * 7 + k * 3.3) % 9);
            house(tile(xc, zc, 700, 4000), { x: xc, z: zc, y: hillY(xc, zc) - 1, yaw, far: true, L: tower ? 11 : 34 + r3 * 26, D: tower ? 11 : 13 + r2 * 4, eave, ridge: eave + (tower ? 16 : 8 + r3 * 4), fl: 20, lod: 2, gable: 'plain', age: AGE0 + 0.04 + dAge + (r1 - 0.5) * 0.08 });
          }
          if (++n % 25 === 0) await ctx.yield();
        }
      }
      for (const [k, sb] of tiles) { flush(sb, 'city-' + k); await ctx.yield(); }
    }
    // ---------- the canal: tinned sheet 20 m wide crossing at z 120, quay walls, two sheet barges ----------
    const barges = [];
    {
      const sb = new SheetBuilder(rng, 8000); sb.set(0.1, 0, 2, 0); sb.seam = -5;
      const tinAge = () => [0.1, 0];
      // long facets that shiver: flats 5 m long and 2.4 m across
      const nx = 64, nz = 10;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const P = (ii, jj) => { const e = jj === 0 || jj === nz; return [-160 + ii * 5 + (e ? 0 : (h2(ii, jj + 40) - 0.5) * 3), -1.6, 108 + jj * 2.4 + (e ? 0 : (h2(ii + 9, jj) - 0.5) * 1.0), ii * 5, jj * 2.4]; };
        sb.ageFn = tinAge; sb.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j));
      }
      for (const sd of [1, -1]) for (let i = 0; i < 16; i++) {
        const xa = sd * (160 + i * 20), xb = sd * (180 + i * 20), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
        sb.quad([x0, 0.4, 110, x0, 0], [x0, 0.4, 130, x0, 20], [x1, 0.4, 130, x1, 20], [x1, 0.4, 110, x1, 0]);
      }
      // quay walls of copper, dry and brown under their coping bead
      sb.set(Math.min(AGE0 + 0.15, 0.5), 0.55, 0, 0); sb.ageFn = null; sb.seam = -2.4;
      for (let i = 0; i < 80; i++) {
        const x0 = -160 + i * 4, x1 = x0 + 4;
        sb.quad([x0, -1.7, 108, x0, 1.4], [x1, -1.7, 108, x1, 1.4], [x1, -0.25, 108, x1, 0], [x0, -0.25, 108, x0, 0]);
        sb.quad([x1, -1.7, 132, x1, 1.4], [x0, -1.7, 132, x0, 1.4], [x0, -0.25, 132, x0, 0], [x1, -0.25, 132, x1, 0]);
      }
      sb.set(AGE0 + 0.1, 0, 0, 0); sb.seam = -1;
      sb.tube([[-160, -0.2, 108], [0, -0.2, 108], [160, -0.2, 108]], 0.22, 4); sb.tube([[-160, -0.2, 132], [0, -0.2, 132], [160, -0.2, 132]], 0.22, 4);
      flush(sb, 'canal');
      const nb = density > 1.1 ? 3 : 2;
      for (let b = 0; b < nb; b++) {
        const bb = new SheetBuilder(rng, 3000);
        house(bb, { x: 0, z: 0, y: -1.75, yaw: 0, L: 17 + rng() * 5, D: 4.6, eave: 1.0, ridge: 2.1, fl: 1.5, lod: 0, gable: 'plain', age: AGE0 + 0.1, chimney: true });
        const m = new THREE.Mesh(bb.geometry(), metal); m.name = 'barge'; m.frustumCulled = false; scene.add(m);
        barges.push({ m, x0: [-34, 22, 70][b], z: [114.5, 125, 115][b], v: [1.1, -0.8, 0.7][b] });
      }
      await ctx.yield();
    }
    let life = null;
    // ---------- THE THINGS THAT SWING: one more material (the same metal routine, a vertex stage that hinges) ----------
    // aMove = (kind, phase, amplitude, speed): 0 a leaf trembling on its wire, 1 a weathercock, 2 a sign or shutter,
    // 3 a leaf that has let go, 4 a gull whose wing plates hinge at the spine. Everything turns about its local Y.
    const mU = Object.assign({ uSpin: { value: weather === 'squall' ? 1 : 0 }, uWind: { value: 0.35 } }, U);
    const moverMat = new THREE.ShaderMaterial({
      uniforms: mU, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aFlat, aState, aMove; attribute vec3 aSurf; attribute float aWing, aTint;
        uniform float uTime, uGust, uFront, uSpin, uWind, uPx; uniform vec2 uRainN; uniform vec3 uKeyDir;
        varying vec3 vP, vN, vT, vSurf; varying vec4 vFlat, vState; varying float vTone;
        void main(){
          float kind = aMove.x, ph = aMove.y, amp = aMove.z, spd = aMove.w; vTone = 1.;
          mat4 mm = modelMatrix*instanceMatrix;
          vec3 o = mm[3].xyz;
          float w = (uFront - dot(uRainN, o.xz))/6.5;
          float ang = amp*(0.35 + uGust)*sin(uTime*spd + ph*6.283);
          vec3 drift = vec3(0.);
          vec3 p = position, n = normal;
          if (kind > 0.5 && kind < 1.5) ang += uWind + 2.5*smoothstep(-2.5, 1.0, w) + uSpin*uTime*(1.5 + 2.*ph);
          if (kind > 2.5 && kind < 3.5) {
            float cyc = fract(uTime*spd*0.035 + ph);
            ang = uTime*spd + ph*40.;
            drift = vec3(uRainN.x*7.*cyc + 1.3*sin(uTime*1.1 + ph*31.)*cyc, -amp*cyc, uRainN.y*7.*cyc + 1.3*cos(uTime*0.9 + ph*17.)*cyc);
          }
          if (kind > 3.5 && kind < 4.5) {
            float a = aWing*(0.12 + amp*sin(uTime*spd + ph*6.283));
            float ca = cos(a), sa = sin(a);
            p.xy = vec2(p.x*ca - p.y*sa, p.x*sa + p.y*ca); n.xy = vec2(n.x*ca - n.y*sa, n.x*sa + n.y*ca);
            ang = 0.;
            // the hinge shows: the wing plate on the pale-sky side is bright, the other in pewter, the fold between
            float sg = dot(mm[0].xyz, uKeyDir) < 0. ? -1. : 1.;
            vTone = 0.98 + 0.30*aWing*sg - 0.16*(1. - abs(aWing));
          }
          if (kind > 4.5) {
            // a drop hopping on a ridge: only where the line has passed
            float hop = abs(sin(uTime*spd + ph*6.283));
            drift.y = amp*hop; ang = ph*20.; p *= smoothstep(0., 0.6, w)*(0.45 + 0.55*hop);
          }
          if (kind < 0.5 || (kind > 2.5 && kind < 3.5) || kind > 4.5) {
            // a leaf never falls below 1.6 px
            float need = 1.6*uPx*length(o + drift - cameraPosition)/max(projectionMatrix[1][1], 1e-3);
            p *= clamp(need/0.28, 1., 5.);
          }
          float c = cos(ang), s = sin(ang);
          p = vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c); n = vec3(n.x*c + n.z*s, n.y, -n.x*s + n.z*c);
          vec4 wp = mm*vec4(p, 1.); wp.xyz += drift;
          mat3 m3 = mat3(mm);
          vec3 wn = m3*n; float wl = dot(wn, wn); vN = wl > 1e-10 ? wn*inversesqrt(wl) : vec3(0., 1., 0.);
          vec3 t0 = vec3(vN.z, 0., -vN.x); float tl = dot(t0, t0); vT = tl > 1e-6 ? t0*inversesqrt(tl) : vec3(1., 0., 0.);
          vP = wp.xyz; vFlat = vec4(aFlat.xyz, fract(aFlat.w + ph*7.31)); vSurf = aSurf;
          vState = vec4(clamp(aState.x + aTint, 0., 1.), aState.yzw);
          gl_Position = projectionMatrix*viewMatrix*wp;
        }`,
      fragmentShader: STYLE_GLSL + /* glsl */`
        varying vec3 vP, vN, vT, vSurf; varying vec4 vFlat, vState; varying float vTone;
        void main(){
          vec3 dv = cameraPosition - vP; float dist = max(length(dv), 1e-3); vec3 V = dv/dist;
          float fw = max(length(dFdx(vP)), length(dFdy(vP)));
          vec3 N = vN; float nl = dot(N, N); N = nl > 1e-8 ? N*inversesqrt(nl) : vec3(0., 1., 0.);
          vec3 T = vT - N*dot(vT, N); float tl = dot(T, T); T = tl > 1e-8 ? T*inversesqrt(tl) : gwTangent(N);
          vec4 m = gwMetal(vP, N, T, V, vFlat, vState, vSurf, fw, dist, gl_FrontFacing);
          gl_FragColor = vec4(gwFinish(m.rgb*vTone, m.a), 1.);
        }`,
    });
    // an instanced set of one swinging thing; list items: { m: Matrix4, move: [kind, phase, amp, speed], tint }
    const movers = (geo, list, name) => {
      const n = list.length; if (!n) return null;
      const mesh = new THREE.InstancedMesh(geo, moverMat, n), mv = new Float32Array(n * 4), tn = new Float32Array(n);
      for (let i = 0; i < n; i++) { mesh.setMatrixAt(i, list[i].m); mv.set(list[i].move, i * 4); tn[i] = list[i].tint || 0; }
      geo.setAttribute('aMove', new THREE.InstancedBufferAttribute(mv, 4)); geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tn, 1));
      if (!geo.getAttribute('aWing')) geo.setAttribute('aWing', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count), 1));
      mesh.frustumCulled = false; mesh.name = name; scene.add(mesh); return mesh;
    };
    const _m4 = new THREE.Matrix4(), _vx = new THREE.Vector3(), _vy = new THREE.Vector3(), _vz = new THREE.Vector3(), _vo = new THREE.Vector3();
    const basis = (o, x, y, z) => new THREE.Matrix4().makeBasis(_vx.set(x[0], x[1], x[2]), _vy.set(y[0], y[1], y[2]), _vz.set(z[0], z[1], z[2])).setPosition(o[0], o[1], o[2]);
    {
      // weathercocks, banners and arrows: fire-gilt plate on a staff, turning together as the gust front passes
      const vane = (cock) => {
        const g = new SheetBuilder(rng, 400); g.set(0, 0, 1, 0); g.seam = -1; g.facets = false;
        const q = (a, b, c, d) => g.quad([0, a[1], a[0]], [0, b[1], b[0]], [0, c[1], c[0]], d ? [0, d[1], d[0]] : undefined);
        g.tube([[0, -0.4, 0], [0, 1.25, 0]], 0.045, 4);
        q([-0.95, 1.2], [0.75, 1.2], [0.75, 1.29], [-0.95, 1.29]); q([0.7, 1.05], [1.15, 1.245], [0.7, 1.44]);          // the arrow
        if (cock) {
          q([-0.12, 1.29], [0.42, 1.29], [0.5, 1.72], [-0.2, 1.7]); q([-0.12, 1.29], [-0.2, 1.7], [-0.78, 2.12]); q([-0.12, 1.29], [-0.78, 2.12], [-0.85, 1.6]);
          q([0.3, 1.7], [0.5, 1.72], [0.62, 2.14], [0.42, 2.18]); q([0.62, 2.14], [0.82, 2.02], [0.6, 1.98]); q([0.42, 2.18], [0.62, 2.14], [0.52, 2.36]);
        } else { q([-0.95, 1.29], [-0.1, 1.29], [-0.1, 1.86], [-0.95, 1.86]); q([-0.95, 1.29], [-0.95, 1.86], [-1.4, 1.95]); q([-0.95, 1.29], [-1.4, 1.38], [-0.95, 1.5]); }
        return g.geometry();
      };
      const want = Math.round(60 * density), cand = gilt.filter((f) => Math.abs(f[0]) < 90).sort((a, b) => Math.abs(a[0]) + (a[3] > 1 ? -200 : 0) - Math.abs(b[0]) - (b[3] > 1 ? -200 : 0));
      const la = [], lb = [];
      for (let i = 0; i < Math.min(want, cand.length); i++) {
        const f = cand[i], s = f[3] > 1 ? 2.6 : 0.95 + f[3];
        const coin = rng() < 0.5;
        (f[4] || coin ? la : lb).push({ m: new THREE.Matrix4().makeRotationY(f[4] || 0).scale(_vx.set(s, s, s)).setPosition(f[0], f[1] + (f[3] > 1 ? 0 : 0.4), f[2]), move: [1, rng(), 0.22, 0.7 + rng() * 0.6] });
      }
      movers(vane(true), la, 'weathercocks'); movers(vane(false), lb, 'banners');
      await ctx.yield();
      // signs over the Row: a bracket of rod and a hanging plate of sheet, no lettering. (round 7) The plate is a TRADE cut from sheet: a boot,
      // a fish, a key, a kettle, a bell, a hat, an anchor: old dark copper with a rolled bead of fire-gilt round its outline, dealt by the
      // sign's order in the Row. Live's round plate is still walked below for its draws alone (it is not shown); the new flats are
      // numbered on a stream of their own
      const sg = new SheetBuilder(rng, 400); sg.set(Math.min(AGE0 + 0.1, 0.5), 0, 0.25, 0); sg.seam = -1;
      sg.tube([[0, 0, 0], [0, 2.0, 0]], 0.055, 4); sg.tube([[-0.9, 0.15, 0], [-0.45, 0.5, 0], [0, 1.2, 0]], 0.035, 4);
      for (let k = 0; k < 8; k++) {
        const a0 = (k / 8) * TAU, a1 = ((k + 1) / 8) * TAU, R = 0.62, r = 0.26, cx = -0.95, cyy = 1.3;
        const O = (a, rr, zz) => [cx + rr * Math.cos(a) * 1.0, cyy + rr * Math.sin(a) * 0.8, zz];
        sg.quad(O(a0, r, 0.09), O(a0, R, 0), O(a1, R, 0), O(a1, r, 0.09)); sg.quad(O(a0, r, 0.09), O(a1, r, 0.09), [cx, cyy, 0.16]);
      }
      const sl = [];
      for (const sn of signs.slice(0, 26)) {
        const n = [sn.n[0] - sn.p[0], 0, sn.n[2] - sn.p[2]], nl = Math.hypot(n[0], n[2]) || 1; n[0] /= nl; n[2] /= nl;
        sl.push({ m: basis(sn.p, [0, 1, 0], n, [n[2], 0, -n[0]]), move: [2, rng(), 0.3, 1.1 + rng() * 0.8], tint: (rng() - 0.5) * 0.1 });
      }
      {
        const sr = ctx.core.makeRng(ctx.core.hashSeed('signs:' + ctx.seed)), BL = 2.5, K = 1.6, PX = -(0.3 + 0.62 * K), PY = BL - 0.85;      // the bracket's length; the plate's scale and its middle under the bracket
        const loop = (cu, cv, r0, n) => Array.from({ length: n }, (_, k) => [cu + r0 * Math.cos(k / n * TAU), cv + r0 * Math.sin(k / n * TAU)]);
        const arc = (cu, cv, r0, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => [cu + r0 * Math.cos(a0 + (a1 - a0) * k / n), cv + r0 * Math.sin(a0 + (a1 - a0) * k / n)]);
        const band = (cu, cv, ro, ri, a0, a1, n) => { const o = arc(cu, cv, ro, a0, a1, n), i = arc(cu, cv, ri, a0, a1, n); return o.slice(1).map((_, k) => [i[k], o[k], o[k + 1], i[k + 1]]); };
        // each trade in the plate's own plane, [out from the wall, up], in units of the plate (about 1.24 tall): flats (each convex), the
        // beaded outline (closed loops; `open` for a line that is not), and where it hangs from the bracket
        const TRADES = [
          { hang: [[-0.2, 0.62], [0.02, 0.62]],      // a boot
            rims: [[[-0.30, -0.62], [-0.10, -0.62], [-0.10, -0.52], [0.05, -0.52], [0.05, -0.58], [0.50, -0.58], [0.50, -0.40], [0.36, -0.26], [0.08, -0.15], [0.08, 0.50], [0.13, 0.50], [0.13, 0.62], [-0.35, 0.62], [-0.35, 0.50], [-0.30, 0.50]]],
            flats: [[[-0.30, -0.15], [0.08, -0.15], [0.08, 0.50], [-0.30, 0.50]], [[-0.35, 0.50], [0.13, 0.50], [0.13, 0.62], [-0.35, 0.62]], [[-0.30, -0.52], [0.50, -0.52], [0.50, -0.40], [0.36, -0.26], [0.08, -0.15], [-0.30, -0.15]], [[-0.30, -0.62], [-0.10, -0.62], [-0.10, -0.52], [-0.30, -0.52]], [[0.05, -0.58], [0.50, -0.58], [0.50, -0.52], [0.05, -0.52]]] },
          { hang: [[-0.12, 0.26], [0.24, 0.24]],      // a fish
            rims: [[[0.60, 0], [0.43, 0.20], [0.24, 0.25], [0.0, 0.48], [-0.10, 0.25], [-0.24, 0.20], [-0.33, 0.04], [-0.62, 0.32], [-0.53, 0], [-0.62, -0.32], [-0.33, -0.04], [-0.24, -0.20], [0.0, -0.26], [0.02, -0.43], [0.19, -0.26], [0.43, -0.20]]],
            flats: [[[0.60, 0], [0.43, 0.20], [0.07, 0.30], [-0.24, 0.20], [-0.36, 0], [-0.24, -0.20], [0.07, -0.30], [0.43, -0.20]], [[-0.31, 0], [-0.53, 0], [-0.62, 0.32]], [[-0.31, 0], [-0.62, -0.32], [-0.53, 0]], [[-0.10, 0.24], [0.24, 0.24], [0.0, 0.48]], [[0.0, -0.24], [0.19, -0.24], [0.02, -0.43]]] },
          { hang: [[0, 0.62]],      // a key
            rims: [loop(0, 0.34, 0.28, 8), loop(0, 0.34, 0.14, 8), [[-0.055, -0.62], [0.27, -0.62], [0.27, -0.50], [0.055, -0.50], [0.055, -0.42], [0.21, -0.42], [0.21, -0.32], [0.055, -0.32], [0.055, 0.07], [-0.055, 0.07]]],
            flats: [...band(0, 0.34, 0.28, 0.14, 0, TAU, 8), [[-0.055, -0.62], [0.055, -0.62], [0.055, 0.08], [-0.055, 0.08]], [[0.055, -0.62], [0.27, -0.62], [0.27, -0.50], [0.055, -0.50]], [[0.055, -0.42], [0.21, -0.42], [0.21, -0.32], [0.055, -0.32]], [[-0.1, 0.02], [0.1, 0.02], [0.1, 0.08], [-0.1, 0.08]]] },
          { hang: [[0, 0.60]],      // a kettle
            rims: [[[0.34, -0.05], [0.30, 0.14], [0.14, 0.24], [0.08, 0.32], [0.035, 0.32], [0.035, 0.40], [-0.035, 0.40], [-0.035, 0.32], [-0.08, 0.32], [-0.14, 0.24], [-0.30, 0.14], [-0.34, -0.05], [-0.28, -0.34], [0.28, -0.34]], [[0.30, -0.18], [0.50, 0.10], [0.54, 0.22], [0.33, -0.02]]],
            flats: [[[0.34, -0.05], [0.30, 0.14], [0.14, 0.24], [-0.14, 0.24], [-0.30, 0.14], [-0.34, -0.05], [-0.28, -0.34], [0.28, -0.34]], [[-0.12, 0.24], [0.12, 0.24], [0.08, 0.32], [-0.08, 0.32]], [[-0.035, 0.32], [0.035, 0.32], [0.035, 0.40], [-0.035, 0.40]], [[0.30, -0.18], [0.50, 0.10], [0.54, 0.22], [0.33, -0.02]], ...band(0, 0.22, 0.38, 0.32, 0.3, Math.PI - 0.3, 6)] },
          { hang: [[0, 0.62]],      // a bell
            rims: [[[0.05, 0.62], [-0.05, 0.62], [-0.05, 0.50], [-0.10, 0.50], [-0.22, 0.30], [-0.28, -0.22], [-0.46, -0.44], [0.46, -0.44], [0.28, -0.22], [0.22, 0.30], [0.10, 0.50], [0.05, 0.50]], [[0, -0.44], [0.09, -0.53], [0, -0.62], [-0.09, -0.53]]],
            flats: [[[-0.05, 0.50], [0.05, 0.50], [0.05, 0.62], [-0.05, 0.62]], [[-0.10, 0.50], [0.10, 0.50], [0.22, 0.30], [-0.22, 0.30]], [[-0.22, 0.30], [0.22, 0.30], [0.28, -0.22], [-0.28, -0.22]], [[-0.28, -0.22], [0.28, -0.22], [0.46, -0.44], [-0.46, -0.44]], [[0, -0.44], [0.09, -0.53], [0, -0.62], [-0.09, -0.53]]] },
          { hang: [[-0.15, 0.48], [0.15, 0.48]],      // a hat
            rims: [[[-0.54, -0.44], [0.54, -0.44], [0.54, -0.31], [0.27, -0.31], [0.31, 0.48], [-0.31, 0.48], [-0.27, -0.31], [-0.54, -0.31]], { open: [[-0.275, -0.16], [0.275, -0.16]] }],
            flats: [[[-0.27, -0.31], [0.27, -0.31], [0.31, 0.48], [-0.31, 0.48]], [[-0.54, -0.44], [0.54, -0.44], [0.54, -0.31], [-0.54, -0.31]]] },
          { hang: [[0, 0.62]],      // an anchor
            rims: [loop(0, 0.50, 0.12, 8), [[-0.28, 0.25], [0.28, 0.25], [0.28, 0.33], [-0.28, 0.33]], { open: [[-0.05, 0.25], [-0.05, -0.56]] }, { open: [[0.05, 0.25], [0.05, -0.56]] }, { open: arc(0, -0.16, 0.46, Math.PI * 1.1, Math.PI * 1.9, 8) }, { open: arc(0, -0.16, 0.36, Math.PI * 1.1, Math.PI * 1.9, 8) },
              [[-0.56, -0.34], [-0.36, -0.14], [-0.32, -0.36]], [[0.56, -0.34], [0.32, -0.36], [0.36, -0.14]]],
            flats: [...band(0, 0.50, 0.12, 0.06, 0, TAU, 8), [[-0.05, -0.56], [0.05, -0.56], [0.05, 0.40], [-0.05, 0.40]], [[-0.28, 0.25], [0.28, 0.25], [0.28, 0.33], [-0.28, 0.33]], ...band(0, -0.16, 0.46, 0.36, Math.PI * 1.1, Math.PI * 1.9, 8), [[-0.56, -0.34], [-0.36, -0.14], [-0.32, -0.36]], [[0.56, -0.34], [0.32, -0.36], [0.36, -0.14]]] },
        ];
        TRADES.forEach((tr, ti) => {
          const g = new SheetBuilder(sr, 400); g.set(Math.min(AGE0 + 0.1, 0.5), 0, 0.25, 0); g.seam = -1;
          const P = (q) => [PX + q[1] * K, PY + q[0] * K, 0];
          g.tube([[0, 0, 0], [0, BL, 0]], 0.055, 4); g.tube([[-0.9, 0.15, 0], [-0.45, 0.5, 0], [0, 1.2, 0]], 0.035, 4);
          for (const h of tr.hang) g.tube([[0, PY + h[0] * K, 0], P(h)], 0.022, 4);
          g.set(0.5, 0, 0, 0);      // the plate: old dark copper
          for (let f of tr.flats) {
            let ar = 0; for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length]; ar += a[0] * b[1] - b[0] * a[1]; }
            if (ar < 0) f = f.slice().reverse();      // one winding for every flat
            for (let i = 1; i < f.length - 1; i += 2) { if (i + 2 < f.length) g.quad(P(f[0]), P(f[i]), P(f[i + 1]), P(f[i + 2])); else g.quad(P(f[0]), P(f[i]), P(f[i + 1])); }
          }
          g.set(0, 0, 1, 0);      // its rolled bead: fire-gilt, a thin line
          for (const rm of tr.rims) { if (rm.open) g.tube(rm.open.map(P), 0.028, 4); else g.tube(rm.map(P), 0.028, 4, true); }
          movers(g.geometry(), sl.filter((_, i) => i % TRADES.length === ti), 'signs-' + ti);
        });
      }
      // open shutters that swing on their hinges
      const sh = new SheetBuilder(rng, 200); sh.set(Math.min(AGE0 + 0.08, 0.5), 0, 0.25, 0); sh.seam = 0.5;
      for (let j = 0; j < 3; j++) sh.quad([0, j / 3, 0, 0, 1 - j / 3], [1, j / 3, 0, 1, 1 - j / 3], [1, (j + 1) / 3, 0, 1, 1 - (j + 1) / 3], [0, (j + 1) / 3, 0, 0, 1 - (j + 1) / 3]);
      const shl = [];
      for (const st of shutters.slice(0, 60)) {
        const d = [st.d[0] - st.p[0], 0, st.d[2] - st.p[2]], n = [st.n[0] - st.p[0], 0, st.n[2] - st.p[2]], c = 0.92, s2 = 0.39;
        const x = [(d[0] * c + n[0] * s2) * st.w, 0, (d[2] * c + n[2] * s2) * st.w], z = [-x[2], 0, x[0]];
        shl.push({ m: basis(st.p, x, [0, st.h, 0], z), move: [2, rng(), 0.22, 0.9 + rng() * 0.9], tint: (rng() - 0.5) * 0.1 });
      }
      movers(sh.geometry(), shl, 'shutters');
      await ctx.yield();
      // lindens: a trunk of rolled sheet with a soldered seam, wires, and a hollow crown of stamped leaves
      const trees = [];
      for (let k = 0; k < 10; k++) for (const sd of [1, -1]) { trees.push([sd * 12.5, 462 + k * 8.6, 1]); trees.push([sd * (k < 7 ? 44 : 51), 462 + k * 8.6, 1]); }
      for (let k = 0; k < Math.round(12 * density); k++) trees.push([-66 + k * 12.4 + rng() * 3, k % 2 ? 101.5 : 137.5, 0.9]);
      const tb = new SheetBuilder(rng, 8000), leaves = [], nL = Math.round(200 * detail);
      const lg = new THREE.BufferGeometry();
      {
        const P = [0, 0, 0, -0.25, 0.22, 0.08, 0, 0.58, 0, 0, 0, 0, 0, 0.58, 0, 0.25, 0.22, 0.08], N = [], F = [], S = [], Su = [];
        for (let v = 0; v < 6; v++) { const l = v < 3 ? -1 : 1; N.push(l * 0.3, 0, 0.954); F.push(P[v * 3], P[v * 3 + 1] - 0.27, 0.2, 0); S.push(0.04, 0, 0.25, P[v * 3 + 1] > 0.1 ? 0.6 : 0.15); Su.push(P[v * 3], P[v * 3 + 1], -1); }
        lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        lg.setAttribute('aFlat', new THREE.Float32BufferAttribute(F, 4)); lg.setAttribute('aState', new THREE.Float32BufferAttribute(S, 4)); lg.setAttribute('aSurf', new THREE.Float32BufferAttribute(Su, 3));
      }
      const Y = new THREE.Vector3(), X = new THREE.Vector3(), Z = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
      for (const t of trees) {
        const [tx, tz, ts] = t, cyy = 7.6 * ts, r = 3.7 * ts;
        tb.set(Math.min(AGE0 + 0.2, 0.5), 0, 0, 0); tb.seam = 1.1;
        tb.tube([[tx, 0, tz], [tx + 0.1, 2.4 * ts, tz], [tx, 4.9 * ts, tz]], (k) => 0.4 - k * 0.07, 5);
        tb.seam = -1;
        for (let b = 0; b < 5; b++) { const a = (b / 5) * TAU + rng(), e = 0.5 + rng() * 0.5; tb.tube([[tx, 4.6 * ts, tz], [tx + Math.cos(a) * r * 0.5, cyy - 0.4, tz + Math.sin(a) * r * 0.5], [tx + Math.cos(a) * r * 0.9 * e, cyy + r * 0.55 * (1.1 - e), tz + Math.sin(a) * r * 0.9 * e]], 0.1, 4); }
        for (let i = 0; i < nL; i++) {
          const a = rng() * TAU, cz = rng() * 1.5 - 0.5, sr = Math.sqrt(Math.max(1 - cz * cz, 0)), rr = r * (0.82 + 0.22 * rng());
          const px = tx + Math.cos(a) * sr * rr, py = cyy + cz * rr * 0.82, pz = tz + Math.sin(a) * sr * rr, sc = 0.85 + rng() * 0.6;
          Y.set(Math.cos(a) * sr + rng() - 0.5, cz - 0.6 + rng() - 0.5, Math.sin(a) * sr + rng() - 0.5).normalize();
          X.crossVectors(Y, UP); if (X.lengthSq() < 1e-4) X.set(1, 0, 0); X.normalize(); Z.crossVectors(X, Y);
          const fall = rng() < 0.1;
          leaves.push({ m: new THREE.Matrix4().makeBasis(X.multiplyScalar(sc), Y.multiplyScalar(sc), Z.multiplyScalar(sc)).setPosition(px, py, pz),
            move: fall ? [3, rng(), py - 0.3, 1.4 + rng() * 2.2] : [0, rng(), 0.45 + rng() * 0.45, 2.2 + rng() * 2.8], tint: rng() * 0.24 });
        }
        if (trees.indexOf(t) % 3 === 2) await ctx.yield();
      }
      flush(tb, 'lindens'); movers(lg, leaves, 'leaves');
      await ctx.yield();
    }
    // drops hopping on the ridges (tinned shot in a squall): snips of tin that jump where the line has passed
    {
      const hg = new THREE.BufferGeometry(), r = 0.11;
      hg.setAttribute('position', new THREE.Float32BufferAttribute([-r, 0, 0, 0, -r, 0, r, 0, 0, -r, 0, 0, r, 0, 0, 0, r * 1.6, 0], 3));
      hg.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      hg.setAttribute('aFlat', new THREE.Float32BufferAttribute(new Float32Array(24), 4)); hg.setAttribute('aSurf', new THREE.Float32BufferAttribute(new Float32Array(18).fill(-1), 3));
      const hs = new Float32Array(24); for (let v = 0; v < 6; v++) { hs[v * 4] = 0.1; hs[v * 4 + 2] = 2; } hg.setAttribute('aState', new THREE.Float32BufferAttribute(hs, 4));
      const hl = [], nH = ridges.length ? Math.round((weather === 'squall' ? 2200 : 1300) * detail) : 0, amp = weather === 'squall' ? 0.9 : 0.45;
      for (let i = 0; i < nH; i++) {
        const rg = ridges[Math.floor(rng() * ridges.length)], k = rng(), a = rng() * TAU;
        hl.push({ m: new THREE.Matrix4().makeRotationY(a).setPosition(lerp(rg[0][0], rg[1][0], k), rg[0][1], lerp(rg[0][2], rg[1][2], k)), move: [5, rng(), amp * (0.5 + rng()), 5 + rng() * 5] });
      }
      movers(hg, hl, 'hops');
      await ctx.yield();
    }
    // ---------- gulls cut from tinned sheet: they ride the air just ahead of the rain line and cross our bow twice ----------
    {
      const P = [], N = [], Wg = [];
      const tri = (a, b, c, w) => {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); Wg.push(w); }
      };
      const head = [0, 0.06, 0.62], spine = [0, 0.14, 0.1], tail = [0, 0.05, -0.72];
      for (const s of [-1, 1]) {
        const side = [s * 0.15, -0.07, 0.1];
        tri(head, spine, side, 0); tri(spine, tail, side, 0);
        const r0 = [s * 0.08, 0.11, 0.32], r1 = [s * 0.08, 0.09, -0.2], m0 = [s * 0.78, 0.11, 0.36], m1 = [s * 0.72, 0.09, -0.14], tip = [s * 1.5, 0.11, -0.28];
        tri(r0, m0, m1, s); tri(r0, m1, r1, s); tri(m0, tip, m1, s);
      }
      const nv = P.length / 3, F = new Float32Array(nv * 4), S = new Float32Array(nv * 4), Su = new Float32Array(nv * 3);
      for (let v = 0; v < nv; v++) { F[v * 4 + 2] = 0.3; F[v * 4 + 3] = Math.floor(v / 3) * 0.13; S[v * 4] = 0.1; S[v * 4 + 2] = 2; Su[v * 3 + 2] = -1; }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      gg.setAttribute('aFlat', new THREE.BufferAttribute(F, 4)); gg.setAttribute('aState', new THREE.BufferAttribute(S, 4)); gg.setAttribute('aSurf', new THREE.BufferAttribute(Su, 3));
      gg.setAttribute('aWing', new THREE.Float32BufferAttribute(Wg, 1));
      const nG = Math.max(24, Math.round(40 * density)), list = [], G = [];
      for (let i = 0; i < nG; i++) {
        const cross = i < 12;
        G.push({ ci: i, s0: cross ? 30 + rng() * 60 : 10 + rng() * 300, ahead: 4 + rng() * 22, h: 31 + rng() * 15, ph: rng() * TAU, cross, fw: 13 + rng() * 13, up: -1.5 + rng() * 6.5, dl: rng() * 0.9, sc: cross ? 1.7 + rng() * 0.5 : 1.2 + rng() * 0.5, roll: 0,
          pos: new THREE.Vector3(), prev: new THREE.Vector3(0, -999, 0), dir: new THREE.Vector3(0.34, 0, 0.94) });
        list.push({ m: new THREE.Matrix4(), move: [4, rng(), 0.3 + rng() * 0.3, 5 + rng() * 3] });
      }
      const gulls = movers(gg, list, 'gulls'); gulls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const cam = new THREE.Vector3(), tgt = new THREE.Vector3(), d = new THREE.Vector3(), X = new THREE.Vector3(), Yv = new THREE.Vector3(), M = new THREE.Matrix4();
      // one gull's place at one instant, written into p: the clock time, the story time t, the rain front Fr, our own place cam and its
      // reach camS along the line are that instant's. keep: the instant is this call's own and the gull's roll is kept; for an earlier
      // instant nothing kept is written
      const place = (g, p, time, t, Fr, cam, camS, keep) => {
        const n = U.uRainN.value, dx = n.y, dz = -n.x;     // along the line, toward +Z
        const s = camS + g.s0 + 9 * Math.sin(time * 0.17 + g.ph), a = Fr + g.ahead + 5 * Math.sin(time * 0.31 + g.ph * 2);
        p.set(n.x * a + dx * s, g.h + 2.5 * Math.sin(time * 0.4 + g.ph), n.y * a + dz * s);
        if (g.cross) {
          // the two bow crossings: port to starboard over the gables at 4 s, and back as we go down to the Row
          const k1 = smoothstep(2.3, 3.5, t) * (1 - smoothstep(5.6, 6.6, t)), k2 = smoothstep(9.6, 10.4, t - g.dl) * (1 - smoothstep(12.6, 13.6, t - g.dl));
          const q1 = clamp((t - g.dl - 2.9) / 2.6, 0, 1), q2 = clamp((t - g.dl - 9.9) / 2.9, 0, 1);
          if (keep) g.roll = Math.max(0.85 * k1, 0.6 * k2);
          if (k1 > 0) {
            // a loose line astern of its leader, from high to port down to low to starboard, none behind another:
            // at story second 4 it lies right across the frame, half of it below the horizon against the roofs
            const f = (g.ci + 0.5) / 10, dep = 22 + 10 * (((g.ci * 5) % 12) / 11);
            tgt.set(lerp(-30, 30, f) * dep / 27 - 10.5 * (t - 4.3), cam.y + lerp(-9.0, -1.5, f) + 0.7 * Math.sin(time * 1.1 + g.ph), cam.z + dep);
            p.lerp(tgt, k1);
          }
          if (k2 > 0) { tgt.set(lerp(-34, 34, q2), cam.y + g.up + 4 + 3 * Math.sin(q2 * 3.1), cam.z + g.fw + 6 + 12 * q2); p.lerp(tgt, k2); }
        }
        { const dc = p.distanceTo(cam); if (dc < 13) p.y += (13 - dc) * 1.2; }      // never in our face
      };
      const cam0 = new THREE.Vector3();
      let uWas = 0;     // the place (u) of the last call of update: it starts at the entry, so the opening of a flight and the world seen through a portal (u 0) are no jump
      life = (dt, time, camera, u) => {
        const t = style.storyTime || 0, n = U.uRainN.value, Fr = U.uFront.value, dx = n.y, dz = -n.x;     // along the line, toward +Z
        cam.setFromMatrixPosition(camera.matrixWorld);
        const camS = cam.x * dx + cam.z * dz;
        const kd = 1 - Math.pow(1 - 0.25, dt * 60);     // the heading eases by the clock step (0.25 a frame at 60 a second): the same turn on any screen, none while the clock stands
        // a jump of place (a still, a visitor set down mid-route) is told from a step of flight by the place's own step since the last call
        // and by nothing else. A flight's longest step in one frame is 0.05 s (the engine's largest clock step) x 2.5 (the viewer's Pace) x 5
        // (the hurry to a portal) x 1.25 (the pace at its fastest) / 40 s (the duration) = 0.02 of the route (0.0005 at 60 frames a second
        // and the world's own pace): 0.05 is two and a half times that. The frame of a crossing brings only what the flight overshot the
        // portal by, one frame's flight of the world before at most (a jump there would need 33 m in that one frame).
        // At a jump the ease has no course to follow (the step between the two calls is the jump itself), so every gull's heading is put
        // outright on its course in a flight there, at any clock step: its place now less its place one frame of flight earlier, both
        // from place(), the earlier with the clock a sixtieth of a second back, the story time and the rain front of the place a frame's
        // flight back along the route (pace(u) / 60 of the 40 s), and our own place less the route's own step over that frame
        const jump = Math.abs(u - uWas) > 0.05; uWas = u;
        let time0 = 0, t0 = 0, Fr0 = 0, camS0 = 0;
        if (jump) {
          const u0 = u - PACE(u) / (60 * 40);
          time0 = time - 1 / 60; t0 = storyTimeAt(u0); Fr0 = 6.5 * t0 - 11;     // (the front is the style's own: setStoryTime in the part)
          cam0.copy(cam).sub(path.pointAt(u, d)).add(path.pointAt(u0, d)); camS0 = cam0.x * dx + cam0.z * dz;
        }
        for (let i = 0; i < nG; i++) {
          const g = G[i];
          place(g, g.pos, time, t, Fr, cam, camS, true);
          if (jump) { place(g, d, time0, t0, Fr0, cam0, camS0, false); d.subVectors(g.pos, d); if (d.lengthSq() > 1e-6) g.dir.copy(d.normalize()); }
          else if (kd > 0 && g.prev.y > -900) { d.subVectors(g.pos, g.prev); if (d.lengthSq() > 1e-6) g.dir.lerp(d.normalize(), kd).normalize(); }
          g.prev.copy(g.pos);
          X.set(g.dir.z, 0, -g.dir.x); if (X.lengthSq() < 1e-6) X.set(1, 0, 0); X.normalize(); Yv.crossVectors(g.dir, X);
          if (g.roll > 0.01) {            // wheeling across the bow they bank their backs to us
            const sgn = X.x * (cam.x - g.pos.x) + X.z * (cam.z - g.pos.z) > 0 ? 1 : -1, cr = Math.cos(g.roll), sr = Math.sin(g.roll) * sgn;
            d.copy(Yv).multiplyScalar(cr).addScaledVector(X, sr); X.multiplyScalar(cr).addScaledVector(Yv, -sr); Yv.copy(d);
          }
          M.makeBasis(X, Yv, g.dir).scale(d.set(g.sc, g.sc, g.sc)).setPosition(g.pos); gulls.setMatrixAt(i, M);
        }
        gulls.instanceMatrix.needsUpdate = true;
      };
      await ctx.yield();
    }
//@@RARE

    // ---------- the tin sky and the rain ----------
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 20), skyMaterial(style));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    const rainK = weather === 'squall' ? 1.5 : weather === 'drizzle' ? 0.75 : 1;
    const rain = makeRain(style, rng, { count: Math.round(6000 * detail * rainK), box: [150, 110, 150], length: weather === 'drizzle' ? 1.6 : weather === 'squall' ? 4.2 : 3.2 });
    scene.add(rain);
    const fringe = makeRain(style, rng, { count: Math.round(2300 * detail), box: [1100, 460, 1100], length: 36, near: 150 });
    scene.add(fringe);
    // a second, small box round the camera: the wires that cross the frame in front of the walls once the line is past
    const rr = Object.assign(() => (rr.s = (rr.s * 16807) % 2147483647) / 2147483647, { s: 7919 });
    const rainNear = makeRain(style, rr, { count: Math.round(1200 * detail * rainK), box: [44, 30, 64], length: weather === 'drizzle' ? 1.4 : weather === 'squall' ? 3.4 : 2.6 });
    scene.add(rainNear);
    await ctx.yield();

    // ---------- the flight ----------
    const seam = new THREE.Vector3(0, 70, 565);
    const _cp = new THREE.Vector3();
    // the climb's gaze: a target that goes up the seam to the lantern and on to the foot of the hoop, so that the
    // dome's two halves fill the lower half of the frame while the break lights them (keys: u, y, z; Hermite)
    const GZ = [[0.70, 70, 565], [0.76, 68, 565], [0.82, 68, 566], [0.875, 93, 589], [0.92, 114, 590], [0.96, 126, 590], [1.0, 132, 590]];
    const _gz = new THREE.Vector3();
    const gazeAt = (time, u) => {
      let i = 0; while (i < GZ.length - 2 && u > GZ[i + 1][0]) i++;
      const a = GZ[i], b = GZ[i + 1], p = GZ[Math.max(i - 1, 0)], n = GZ[Math.min(i + 2, GZ.length - 1)];
      const h = b[0] - a[0], t = clamp((u - a[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
      const out = [0, 0];
      for (let k = 1; k <= 2; k++) {
        const m0 = (b[k] - p[k]) / Math.max(b[0] - p[0], 1e-4) * h, m1 = (n[k] - a[k]) / Math.max(n[0] - a[0], 1e-4) * h;
        out[k - 1] = (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * m1;
      }
      return _gz.set(0, out[0], out[1]);
    };
    return {
      scene, path, duration: 40, pace: PACE,
      camera: { fov: 62, near: 0.3, far: 5200 },
      pois: [{ at: seam, from: 0.55, to: 0.80, weight: 0.5 }, { at: gazeAt, from: 0.715, to: 0.99, fade: 0.14, weight: 0.92 }],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#F1E2C0', glow: 0.5 },
      post: { exposure: 1, bloom: { strength: 0.3, radius: 0.5, threshold: 1.0 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.12, grain: 0.012, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        style.tick(time, ctx.renderer);
        hero.setProgress(u);
        U.uGust.value *= gustK;
        hero.update(dt, time, camera);
        _cp.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(_cp);
        for (const b of barges) b.m.position.set(b.x0 + ((time * b.v) % 40), 0, b.z);
        if (life) life(dt, time, camera, u);
      },
      dispose() {},
    };
  },
};
