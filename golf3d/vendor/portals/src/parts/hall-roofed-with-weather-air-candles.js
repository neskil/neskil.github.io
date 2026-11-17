// hall-roofed-with-weather: THE CANDLES (the air builder's part).
// About fifteen hundred candles of three kinds (beeswax tapers, tallow dips, stubs) ride the hall's air the way leaves
// ride a mill pool: they go ROUND in skeins on five or seven nested oval tracks that circle the whole hall, on one
// long narrow loop low over the table (THE LOW STREAM, below), and on two small rings that turn close round the
// hearth's column and rise as they turn (a slow helix that hands its candles back down outside). A skein is GATHERED
// AT KNOTS, two or three to a lap (one on a hearth ring): about half of a stream's candles ride in the fifth of its
// length round its knots, and the stretches between are thin. Every candle keeps its own place across its skein,
// bobs a little on its own, and carries its flame and a small halo with it; one in six lets a drop of wax fall now
// and then (fewer where few may: see FALLING WAX below).
//
// CLEAR AIR, BY CONSTRUCTION. A track is laid as a closed line, then eased away from the flown route where it would
// come near it (it rises over the route or dips under it), so the streams wind through the room round the way we
// fly. Then every candidate candle draws all its dice, and its WHOLE TRACK (every place it can ever be: its lap, its
// own place across the skein, its bob, its sway in the draught, its whole length of wax) is counted against the
// flown line and the tube behind the entry; a candidate that could come nearer than the rule is not dealt. The count
// takes, at each point of the lap, the line's samples that stand within the rule, the skein's half thickness, the
// bob, the sway and 1.5 m more of the track's middle line there: every other sample is further than the rule from
// every candle of the skein, so the design's 3.0 m holds for every candle against the whole line. (A larger candle
// is asked for more air than the rule, moreAir below: that extra is counted against those listed samples only.)
// The count of the nearest kept candle is handed back (clear.nearest, metres from the lens's line to its wax).
//
// HEAD ROOM, BY CONSTRUCTION. No flame's top stands nearer than 1.5 m under the lowest the cloud's skin can ever hang
// (the cloud's own law holds that floor, CLOUD_LOW): the tracks' middle lines are laid and eased under a ceiling set
// from it, and the deal counts every candle's own top over its whole lap (clear.top).
//
// FALLING WAX IS A BODY: nothing thins it toward the lens. A drop is dealt only to a candle whose whole lap, seen in
// plan, stays 2 m and its sway clear of the flown line wherever that line lies under the candle's foot (and outside
// the tube behind the entry). A drop leaves from its candle's foot as drawn and ends on what stands under it: the
// hall's own floor, dishes, benches, kerb and logs, surveyed once at the build from the hall as built.
//
// A candle's place on its lap, its bob and the beat of its sway go by the world's clock (a lap is a closed line: any
// clock is a place on it). How far it sways toward +x is how far inside the storm's band it stands: the band is the
// declared weather, and its place goes by u.
import * as THREE from 'three';
import { HALL, HEARTH, GALLERY, TABLE, ENTRY } from './hall-roofed-with-weather-plan.js';
import { CLOUD_LOW } from './hall-roofed-with-weather-air-cloud.js';

const TAU = Math.PI * 2;
export const CLEAR = 3.0;                 // the design's rule: no candle can come within 3.0 m of the flown line
const TUBE = 9.0, TUBE_BACK = 30;         // nor inside the 9 m tube of the last 30 m behind the entry
const M = 384;                            // samples of one lap of a track
const BOB = 0.3, SWAY = 0.55;             // the most a candle moves off its own ring: its bob, and its sway in the draught
const Y_LO = 10;                          // the foot of the candles' band of the room (design, section 4)
// The band's top is set by the cloud: no flame's top nearer than 1.5 m under the lowest its skin can hang. HEAD: the
// most that stands over a candle's middle (its bob, half the longest taper, the wick's gap, the tallest flame).
const FLAME_TOP = CLOUD_LOW - 1.5, HEAD = BOB + 1.0 + 0.04 + 0.42;
const topLine = (R) => FLAME_TOP - HEAD - 0.85 * R;       // the highest a track's middle line may run (R: its skein's half thickness)
const flameOf = (kind) => (kind === 0 ? 0.34 : kind === 1 ? 0.31 : 0.27) * 1.1 * 1.1;     // a flame's greatest height on its wick, by the candle's kind
const DRIP_AIR = 2.0;                     // a falling drop keeps this much air, in plan, from the flown line where it lies under the drop
// THE LOW STREAM (the lead's word): one long narrow loop that runs low over the table's bends each side of the low
// pass (the route's lowest stretch, at x -16.5), its middle line swelling between about y 7 and y 12.4, so that
// stretch is flown between two lanes of candles about the lens's own height. The rig's three low lights stand along its middle.
export const LOW = { x: -16.5, z: -74, ax: 6.6, az: 38, y: 9.7, R: 1.7, top: 13.9, floor: 7 };
// A larger candle is asked for more air than the rule's 3.0 m, by its length and its width (a 2 m taper 2.9 m more),
// so that the largest bodies pass furthest off. The extra is counted against the line's samples near the candle's
// own track only (the deal's list, below); the design's 3.0 m holds for every candle against the whole line.
export const moreAir = (len, rad) => Math.max(1.6 * len - 0.3, 6 * rad - 0.6, 0);
const lerp = (a, b, t) => a + (b - a) * t, clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// The flown line as samples [x, y, z, clear]: the route itself every `step` metres (clear = the rule's 3.0 m) and the
// level axis behind the entry (clear = the tube's 9 m).
export function sampleRoute(path, step) {
  const out = [], p = new THREE.Vector3(), n = Math.ceil(path.length / step);
  for (let i = 0; i <= n; i++) { path.posAtDist(Math.min(path.length, i * step), p); out.push(p.x, p.y, p.z, CLEAR); }
  const t0 = path.startTangent, h = Math.hypot(t0.x, t0.z) || 1;
  for (let d = step; d <= TUBE_BACK; d += step) out.push(ENTRY.x - (t0.x / h) * d, ENTRY.y, ENTRY.z - (t0.z / h) * d, TUBE);       // (the plan's ENTRY, where the route begins)
  return new Float32Array(out);
}

// ---- the tracks as laid (before they are eased off the route): closed lines of M points
function ovalTrack(o) {
  const c = new Float32Array(M * 3);
  for (let m = 0; m < M; m++) {
    const a = (m / M) * TAU, cs = Math.cos(a), sn = Math.sin(a), wob = 1 + o.wob * Math.sin(3 * a + o.p1);
    c[m * 3] = o.cx + o.ax * Math.sign(cs) * Math.pow(Math.abs(cs), 0.82) * wob;
    c[m * 3 + 1] = o.y + o.h1 * Math.sin(2 * a + o.p2) + o.h2 * Math.sin(3 * a + o.p3);
    c[m * 3 + 2] = o.cz + o.az * Math.sign(sn) * Math.pow(Math.abs(sn), 0.82) * wob;
  }
  return c;
}
function helixTrack(o) {
  const c = new Float32Array(M * 3), RISE = 0.62;
  for (let m = 0; m < M; m++) {
    const s = m / M; let a, r, y;
    if (s < RISE) { const q = s / RISE; a = o.a0 + o.dir * TAU * o.turns * q; r = o.r0 + 0.7 * Math.sin(q * Math.PI); y = lerp(o.y0, o.y1, sstep(0, 1, q) * 0.6 + q * 0.4); }
    else { const q = (s - RISE) / (1 - RISE); a = o.a0 + o.dir * TAU * (o.turns + (Math.ceil(o.turns) - o.turns) * q); r = o.r0 + o.out * Math.pow(Math.sin(q * Math.PI), 0.8); y = lerp(o.y1, o.y0, sstep(0, 1, q)); }
    c[m * 3] = HEARTH.x + r * Math.cos(a); c[m * 3 + 1] = y; c[m * 3 + 2] = HEARTH.z + r * Math.sin(a);
  }
  return c;
}

// ---- ease one track off the flown line. c: the line as laid; R: the skein's half thickness; route: coarse samples.
// A point nearer the line than its need is pushed away from it (more up or down than sideways), the push is smoothed
// along the lap so the stream bends and does not kink, and the room's own bounds are kept. A bounded number of turns.
async function easeOff(ctx, c, R, route, turns, yLo = Y_LO + R + 1.1, yHi = topLine(R)) {
  const d = new Float32Array(M * 3), t = new Float32Array(M * 3), nr = route.length / 4;
  const xMax = HALL.x1 - 2.6 - R, zMin = HALL.zHigh + 3.2 + R, zMax = GALLERY.z0 - 2.6 - R, yMin = yLo, yMax = yHi;
  // (the line's samples in blocks of eight, each with a ball that holds them and their needs: a point outside a
  // block's ball is near none of its samples, so the count below is the same count, only shorter)
  const B = 8, nb = Math.ceil(nr / B), blk = new Float32Array(nb * 4);
  for (let b = 0; b < nb; b++) {
    const j0 = b * B, j1 = Math.min(nr, j0 + B); let sx = 0, sy = 0, sz = 0, rad = 0;
    for (let j = j0; j < j1; j++) { sx += route[j * 4]; sy += route[j * 4 + 1]; sz += route[j * 4 + 2]; }
    sx /= j1 - j0; sy /= j1 - j0; sz /= j1 - j0;
    for (let j = j0; j < j1; j++) rad = Math.max(rad, Math.hypot(route[j * 4] - sx, route[j * 4 + 1] - sy, route[j * 4 + 2] - sz) + route[j * 4 + 3] + 2.2 + R * 0.75);
    blk[b * 4] = sx; blk[b * 4 + 1] = sy; blk[b * 4 + 2] = sz; blk[b * 4 + 3] = rad * rad;
  }
  for (let it = 0; it < turns; it++) {
    for (let m = 0; m < M; m++) {
      if ((m & 127) === 0) await ctx.yield();
      const x = c[m * 3] + d[m * 3], y = c[m * 3 + 1] + d[m * 3 + 1], z = c[m * 3 + 2] + d[m * 3 + 2];
      let px = 0, py = 0, pz = 0;
      for (let b = 0; b < nb; b++) {
       const ex = x - blk[b * 4], ey = y - blk[b * 4 + 1], ez = z - blk[b * 4 + 2]; if (ex * ex + ey * ey + ez * ez >= blk[b * 4 + 3]) continue;
       for (let j = b * B, j1 = Math.min(nr, j + B); j < j1; j++) {
        const dx = x - route[j * 4], dy = y - route[j * 4 + 1], dz = z - route[j * 4 + 2], need = route[j * 4 + 3] + 2.2 + R * 0.75;
        const q = dx * dx + dy * dy + dz * dz; if (q >= need * need) continue;
        const l = Math.sqrt(q), k = (need - l) / need;
        // over the line or under it: the side it is on, unless the room's band has no place for it there
        const ry = route[j * 4 + 1], under = ry - need >= yMin, over = ry + need <= yMax;
        let side = dy >= 0 ? 1 : -1; if (side < 0 && !under && over) side = 1; else if (side > 0 && !over && under) side = -1;
        let ux = dx * 0.7, uy = side * Math.max(Math.abs(dy), 0.6) * 1.5, uz = dz * 0.7;
        if (!under && !over) { uy = 0; ux = dx; uz = dz; if (Math.hypot(ux, uz) < 0.3) { ux = x > 0 ? -1 : 1; uz = 0; } }   // neither: it goes round, sideways
        const ul = Math.hypot(ux, uy, uz);
        if (ul < 0.4) { ux = 0; uz = 0; uy = route[j * 4 + 1] < 24 ? 1 : -1; } else { ux /= ul; uy /= ul; uz /= ul; }
        px += ux * k; py += uy * k; pz += uz * k;
       }
      }
      const pl = Math.hypot(px, py, pz); if (pl > 1) { px /= pl; py /= pl; pz /= pl; }
      d[m * 3] += px * 1.1; d[m * 3 + 1] += py * 1.1; d[m * 3 + 2] += pz * 1.1;
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let m = 0; m < M; m++) { const a = ((m + M - 1) % M) * 3, b = ((m + 1) % M) * 3; for (let k = 0; k < 3; k++) t[m * 3 + k] = 0.5 * d[m * 3 + k] + 0.25 * (d[a + k] + d[b + k]); }
      d.set(t);
    }
    for (let m = 0; m < M; m++) {
      d[m * 3] = clamp(c[m * 3] + d[m * 3], -xMax, xMax) - c[m * 3];
      d[m * 3 + 1] = clamp(c[m * 3 + 1] + d[m * 3 + 1], yMin, yMax) - c[m * 3 + 1];
      d[m * 3 + 2] = clamp(c[m * 3 + 2] + d[m * 3 + 2], zMin, zMax) - c[m * 3 + 2];
    }
  }
  for (let i = 0; i < M * 3; i++) c[i] += d[i];
  return c;
}
// ---- a laid line made even by its own length, with its plan normal at every point (the way across the skein)
function finish(c) {
  const cum = new Float32Array(M + 1);
  for (let m = 0; m < M; m++) { const a = m * 3, b = ((m + 1) % M) * 3; cum[m + 1] = cum[m] + Math.hypot(c[b] - c[a], c[b + 1] - c[a + 1], c[b + 2] - c[a + 2]); }
  const len = cum[M], out = new Float32Array(M * 3), n = new Float32Array(M * 2);
  for (let m = 0, j = 0; m < M; m++) {
    const s = (m / M) * len; while (j < M - 1 && cum[j + 1] < s) j++;
    const f = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]), a = j * 3, b = ((j + 1) % M) * 3;
    for (let k = 0; k < 3; k++) out[m * 3 + k] = lerp(c[a + k], c[b + k], f);
  }
  for (let m = 0; m < M; m++) {
    const a = ((m + M - 1) % M) * 3, b = ((m + 1) % M) * 3, tx = out[b] - out[a], tz = out[b + 2] - out[a + 2], l = Math.hypot(tx, tz) || 1;
    n[m * 2] = tz / l; n[m * 2 + 1] = -tx / l;
  }
  return { c: out, n, len };
}

// ---- THE TRACKS a seed deals: five or seven nested ovals and the hearth's two rising rings. An oval's half width
// across the hall and its mean height are set for each (LAY); then the height is clamped to where the candles' band
// has room for the stream's swells: of seven, three then ride at about one mean height high in the band and three
// low in it (of five, two and two), and the streams cross through one another in places. One die deals which way
// round the whole pool turns.
export async function layTracks(ctx, rng, rngRound, path) {
  const coarse = sampleRoute(path, 2);
  await ctx.yield();
  const seven = rng() < 0.5, dir = rngRound() < 0.5 ? 1 : -1;
  const LAY = seven
    ? [[27, 16.5], [26, 29.5], [19.5, 36], [19, 23], [17.5, 13.6], [11, 30], [9.5, 18]]
    : [[26.5, 19], [24.5, 33.5], [18.5, 13.5], [15.5, 27.5], [9.5, 21]];
  const tracks = []; let outer = null;
  for (let k = 0; k < LAY.length; k++) {
    const [ax, y] = LAY[k], R = seven ? rng.range(1.15, 1.5) : rng.range(1.35, 1.75);     // a skein is a narrow river: under 3.5 m across
    const o = { cx: rng.range(-0.8, 0.8), cz: -68 - (27 - ax) * 1.3 + rng.range(-1.5, 1.5), ax: ax - 0.4 * R + 1, az: 34 + (ax - 9.5) * 2.4 - R * 0.5, y: y + rng.range(-0.8, 0.8),
      h1: rng.range(3.2, 5.0), h2: rng.range(1.2, 2.2), wob: rng.range(0.06, 0.1), p1: rng() * TAU, p2: rng() * TAU, p3: rng() * TAU };
    // THE TWO OUTERMOST STREAMS run along the same long walls, one over the other. They rise and fall AS ONE (the upper
    // takes the lower's two swells), so the bare stone between them stays open all along a wall. Their long swell is
    // set, not dealt: lowest at the low end of the -x wall (where the upper one must pass under the way in) and
    // highest at that wall's high end, and the other way along the +x wall, so along a whole long wall each of them
    // climbs or sinks by several metres and the string along a wall does not lie level. Their short swell (three a
    // lap: one whole wave along each long wall) is a metre higher than the other streams', and its phase is dealt
    // within an eighth of a turn only: there it is down where the long swell is lowest, beside the way in, and it
    // falls with the long swell across the high end wall.
    if (k === 0) { o.h2 += 1; o.p2 = 0; o.p3 = 0.75 * Math.PI + (o.p3 % Math.PI) / 4; outer = o; } else if (k === 1) { o.h1 = outer.h1; o.h2 = outer.h2; o.p2 = outer.p2; o.p3 = outer.p3; }
    // (each stream rises and falls by several metres in two and three long swells a lap; its middle height is kept where the band has room for them)
    o.y = clamp(o.y, Y_LO + R + 1.1 + 0.8 * (o.h1 + o.h2), topLine(R) - 0.8 * (o.h1 + o.h2));
    const speed = rng.range(0.6, 1.0), dClumps = rng(), clumps = k === 1 || dClumps >= 0.5 ? 3 : 2, psi = rng() * TAU, amp = rng.range(0.9, 0.95);
    const c = ovalTrack(o);
    // TWO OF THE STREAMS COME DOWN LOW over the open floor between the table's far end and the high end wall, and keep
    // a rise and fall of their own there: their two swells, half as high, from their low line up (the second one's
    // are turned by half a turn, so it climbs across the high end wall where the outermost sinks). So no string along that
    // wall lies level. The outermost comes down sooner than the other, while its line still runs along the long
    // wall: further on, its line turns in under the flown line's climb and its half circle, and must be under them
    // by then. Its dip is therefore laid before the easing as well as after it (the easing finds it already under the
    // flown line there, and leaves it under).
    const low = k === 0 ? 6 : k === (seven ? 4 : 2) ? 7.6 : 0, sw = o.h1 + o.h2, turn = k === 0 ? 0 : Math.PI;
    const dip = () => {
      for (let m = 0; m < M; m++) {
        const a = (m / M) * TAU, wave = o.h1 * Math.sin(2 * a + turn) + o.h2 * Math.sin(3 * a + turn + o.p3 % Math.PI);
        const b = k === 0 ? sstep(TABLE.z1 + 34, TABLE.z1 + 8, c[m * 3 + 2]) : sstep(TABLE.z1 + 6, TABLE.z1 - 16, c[m * 3 + 2]);
        c[m * 3 + 1] = lerp(c[m * 3 + 1], Math.min(c[m * 3 + 1], low + 0.5 * (wave + sw)), b);
      }
    };
    if (k === 0) dip();
    for (let i = 0; i < 4; i++) { await easeOff(ctx, c, R, coarse, 9); await ctx.yield(); }
    if (low) dip();
    const f = finish(c);
    tracks.push({ ...f, R, rate: dir * speed / f.len, clumps, psi, amp, main: true, lead: k === 1, weight: f.len * Math.pow(R / 1.5, 1.2) });
    await ctx.yield();
  }
  const main = tracks.reduce((a, t) => a + t.weight, 0), a0 = rng() * TAU;
  {                                                 // the low stream
    const o = { cx: LOW.x, cz: LOW.z + rng.range(-1, 1), ax: LOW.ax, az: LOW.az, y: LOW.y, h1: rng.range(1.6, 2.1), h2: rng.range(0.5, 0.8), wob: 0.03, p1: rng() * TAU, p2: rng() * TAU, p3: rng() * TAU };
    const c = ovalTrack(o), speed = rng.range(0.6, 0.9), psi = rng() * TAU;
    for (let i = 0; i < 3; i++) { await easeOff(ctx, c, LOW.R, coarse, 8, LOW.floor, LOW.top - LOW.R * 0.85); await ctx.yield(); }
    const f = finish(c);
    tracks.push({ ...f, R: LOW.R, rate: dir * speed / f.len, clumps: 2, psi, amp: 0.86, main: false, low: true, weight: main * 0.24 });
    await ctx.yield();
  }
  for (let k = 0; k < 2; k++) {
    const o = k === 0 ? { a0, dir, turns: 2.25, r0: 5.6, out: 6.4, y0: 12.8, y1: 27.5 } : { a0: a0 + Math.PI + rng.range(-0.5, 0.5), dir, turns: 2.25, r0: 7.5, out: 5.6, y0: 14.2, y1: 26 };
    const c = helixTrack(o), R = 1.25;
    for (let i = 0; i < 3; i++) { await easeOff(ctx, c, R, coarse, 8); await ctx.yield(); }
    const f = finish(c);
    tracks.push({ ...f, R, rate: rng.range(0.6, 0.85) / f.len, clumps: 1, psi: rng() * TAU, amp: 0.88, main: false, weight: main * 0.05 });
    await ctx.yield();
  }
  return { tracks, seven, dir };
}

// a candle's place on its ring at lap share s (0..1): the track's line at s, plus the candle's own place across the skein
function ringAt(tr, s, ou, ov, out) {
  const f = (s - Math.floor(s)) * M, m = Math.floor(f) % M, q = f - Math.floor(f), b = (m + 1) % M, c = tr.c, n = tr.n;
  out[0] = lerp(c[m * 3], c[b * 3], q) + lerp(n[m * 2], n[b * 2], q) * ou;
  out[1] = lerp(c[m * 3 + 1], c[b * 3 + 1], q) + ov;
  out[2] = lerp(c[m * 3 + 2], c[b * 3 + 2], q) + lerp(n[m * 2 + 1], n[b * 2 + 1], q) * ou;
  return out;
}
// ---- THE DEAL. Every candidate draws all its dice (its own streams: place, kind, drip) BEFORE its test; then its
// whole ring is counted against the flown line: at every point of its lap, the nearest that its wax (a standing length
// of wax with its width, its bob, its sway and a slack for the count's own step) can come to any sample of the line.
// A bounded search: at most four candidates for every candle wanted. Two more counts for every kept candle: its own
// flame's top over its whole lap (the head room under the cloud), and whether it MAY DRIP: its whole lap, in plan,
// against every sample of the line that lies under its foot (a drop falls through every height below the foot).
export async function dealCandles(ctx, o) {
  const { tracks, path, S, dealt } = o;
  const fine = sampleRoute(path, 0.4), nf = fine.length / 4;
  await ctx.yield();
  // a drop's air in plan from a sample of the line: the rule's 2 m (the tube's own 9 m behind the entry), the candle's
  // sway and lean, and a slack for the count's own step
  const dripNeed = new Float32Array(nf); for (let j = 0; j < nf; j++) dripNeed[j] = (fine[j * 4 + 3] > CLEAR + 0.1 ? TUBE : DRIP_AIR) + SWAY + 0.2 + 0.5;
  const FB = 16, nfb = Math.ceil(nf / FB), fblk = new Float32Array(nfb * 3), nq = new Float32Array(nf), dq = new Float32Array(nf);
  for (const tr of tracks) {                       // per track: the samples of the line that a candle of its skein could come near,
    const far = tr.R + BOB + SWAY + 1.5, start = new Int32Array(M + 1), idx = [], dStart = new Int32Array(M + 1), dIdx = [];      // and those a drop from it could fall near
    for (let j = 0; j < nf; j++) { nq[j] = (fine[j * 4 + 3] + far) ** 2; dq[j] = (dripNeed[j] + tr.R) ** 2; }
    for (let b = 0; b < nfb; b++) {                // (blocks of sixteen samples, each with a circle in plan that holds them and their needs)
      const j0 = b * FB, j1 = Math.min(nf, j0 + FB); let sx = 0, sz = 0, rad = 0;
      for (let j = j0; j < j1; j++) { sx += fine[j * 4]; sz += fine[j * 4 + 2]; }
      sx /= j1 - j0; sz /= j1 - j0;
      for (let j = j0; j < j1; j++) rad = Math.max(rad, Math.hypot(fine[j * 4] - sx, fine[j * 4 + 2] - sz) + Math.sqrt(Math.max(nq[j], dq[j])));
      fblk[b * 3] = sx; fblk[b * 3 + 1] = sz; fblk[b * 3 + 2] = rad * rad;
    }
    let top = -Infinity;
    for (let m = 0; m < M; m++) {
      const x = tr.c[m * 3], y = tr.c[m * 3 + 1], z = tr.c[m * 3 + 2]; if (y > top) top = y;
      for (let b = 0; b < nfb; b++) {
        const ex = x - fblk[b * 3], ez = z - fblk[b * 3 + 1]; if (ex * ex + ez * ez >= fblk[b * 3 + 2]) continue;
        for (let j = b * FB, j1 = Math.min(nf, j + FB); j < j1; j++) {
          const dx = x - fine[j * 4], dy = y - fine[j * 4 + 1], dz = z - fine[j * 4 + 2], pl = dx * dx + dz * dz;
          if (pl + dy * dy < nq[j]) idx.push(j);
          if (pl < dq[j]) dIdx.push(j);
        }
      }
      start[m + 1] = idx.length; dStart[m + 1] = dIdx.length;
      if (m % 48 === 47) await ctx.yield();
    }
    tr.nearStart = start; tr.nearIdx = Int32Array.from(idx); tr.dripStart = dStart; tr.dripIdx = Int32Array.from(dIdx); tr.top = top;
  }
  const total = Math.round(1500 * dealt.density), most = total * 4, wSum = tracks.reduce((a, t) => a + t.weight, 0);
  const K = S.kinds, C = S.candles, D = S.drips;
  const wT = K.range(0.42, 0.52), wD = K.range(0.1, 0.16), keepFar = dealt.detail >= 1 ? 1 : Math.pow(dealt.detail, 1.6);
  const A = { trk: new Uint8Array(total), s0: new Float32Array(total), ou: new Float32Array(total), ov: new Float32Array(total), kind: new Uint8Array(total),
    len: new Float32Array(total), rad: new Float32Array(total), seed: new Float32Array(total), bobA: new Float32Array(total), bobF: new Float32Array(total),
    bobP: new Float32Array(total), tiltX: new Float32Array(total), tiltZ: new Float32Array(total), tint: new Float32Array(total), drip: new Uint8Array(total),
    dripT: new Float32Array(total), dripP: new Float32Array(total), dripD: new Float32Array(total) };
  let n = 0, tried = 0, nearest = Infinity, tube = Infinity, refused = 0, top = -Infinity;
  for (; tried < most && n < total; tried++) {
    if (tried % 12 === 11) await ctx.yield();
    // -- all of this candidate's dice
    const dTrack = C() * wSum, dS = C(), dR = C(), dTh = C(), dBobA = C(), dBobF = C(), dBobP = C(), dSeed = C(), dThin = C();
    const dKind = K(), dLen = K(), dRad = K(), dTint = K(), dTiltA = K(), dTiltD = K();
    const dDrip = D(), dPeriod = D(), dPhase = D();
    let ti = 0; for (let acc = 0; ti < tracks.length - 1; ti++) { acc += tracks[ti].weight; if (dTrack < acc) break; }
    const tr = tracks[ti];
    const s0 = dS + (tr.amp / (TAU * tr.clumps)) * Math.sin(TAU * tr.clumps * dS + tr.psi);     // (the stream's knots: half of its candles in a fifth of its length)
    const rr = tr.R * Math.pow(dR, 0.65), ou = rr * Math.cos(dTh * TAU), ov = rr * Math.sin(dTh * TAU) * 0.85;
    const kind = dKind < wT ? 0 : dKind < wT + wD ? 1 : 2;
    const len = kind === 0 ? lerp(1.2, 2.0, dLen) : kind === 1 ? lerp(0.7, 1.2, dLen) : lerp(0.3, 0.5, dLen);
    const rad = kind === 0 ? lerp(0.085, 0.11, dRad) : kind === 1 ? lerp(0.12, 0.165, dRad) : lerp(0.16, 0.215, dRad);
    const tilt = (kind === 1 ? 0.11 : 0.05) * dTiltA, hl = len / 2, more = moreAir(len, rad);
    // -- the count: its whole ring against the flown line
    let ok = true, mine = Infinity, mineTube = Infinity; const c = tr.c, nn = tr.n, st = tr.nearStart, ix = tr.nearIdx;
    for (let m = 0; m < M && ok; m++) {
      if (st[m + 1] === st[m]) continue;
      const x = c[m * 3] + nn[m * 2] * ou, y = c[m * 3 + 1] + ov, z = c[m * 3 + 2] + nn[m * 2 + 1] * ou;
      for (let q = st[m]; q < st[m + 1]; q++) {
        const j = ix[q] * 4, dx = x - fine[j], dz = z - fine[j + 2], dy = Math.max(0, Math.abs(fine[j + 1] - y) - hl);
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) - rad - BOB - SWAY - 0.35;
        const tubeHere = fine[j + 3] > CLEAR + 0.1;
        if (d < fine[j + 3] + (tubeHere ? 0 : more)) { ok = false; break; }
        if (tubeHere) { if (d < mineTube) mineTube = d; } else if (d < mine) mine = d;
      }
    }
    // -- the head room: its own flame's top at the highest place of its lap (the tracks' ceiling keeps it; this counts it)
    const bob = lerp(0.12, BOB, dBobA), topMine = tr.top + ov + bob + hl + 0.04 + flameOf(kind);
    if (!ok || topMine > FLAME_TOP) { refused++; continue; }
    // a slower machine goes without some of the candles of a stream whose track has no sample of the flown route in its
    // list above (it comes nowhere near the route): the hearth's two rings on every deal, and on some deals an oval too
    // (the innermost, or the upper outer one where only the tube behind the entry is near it). Every other stream
    // takes all its candles
    if (mine === Infinity && dThin >= keepFar) continue;
    // -- may it drip? its whole lap in plan against the line, wherever the line lies under its foot
    let may = 1; const ds = tr.dripStart, di = tr.dripIdx;
    for (let m = 0; m < M && may; m++) {
      if (ds[m + 1] === ds[m]) continue;
      const x = c[m * 3] + nn[m * 2] * ou, foot = c[m * 3 + 1] + ov + bob - hl, z = c[m * 3 + 2] + nn[m * 2 + 1] * ou;
      for (let q = ds[m]; q < ds[m + 1]; q++) {
        const j = di[q] * 4, tubeHere = fine[j + 3] > CLEAR + 0.1;
        if (fine[j + 1] - (tubeHere ? TUBE : 0) > foot) continue;      // the line (or the tube's under side) lies over the foot here: a drop falls away from it
        const dx = x - fine[j], dz = z - fine[j + 2], need = dripNeed[di[q]];
        if (dx * dx + dz * dz < need * need) { may = 0; break; }
      }
    }
    A.trk[n] = ti; A.s0[n] = s0; A.ou[n] = ou; A.ov[n] = ov; A.kind[n] = kind; A.len[n] = len; A.rad[n] = rad; A.seed[n] = dSeed;
    A.bobA[n] = bob; A.bobF[n] = lerp(0.35, 0.8, dBobF); A.bobP[n] = dBobP * TAU;
    A.tiltX[n] = tilt * Math.cos(dTiltD * TAU); A.tiltZ[n] = tilt * Math.sin(dTiltD * TAU); A.tint[n] = dTint;
    A.drip[n] = may; A.dripD[n] = dDrip; A.dripT[n] = lerp(5, 11, dPeriod); A.dripP[n] = dPhase;
    if (mine < nearest) nearest = mine; if (mineTube < tube) tube = mineTube; if (topMine > top) top = topMine;
    n++;
  }
  // one candle in six lets wax fall, each by its own die (drawn at its turn); where fewer than that may, all that may
  let mayDrip = 0, drips = 0; for (let i = 0; i < n; i++) mayDrip += A.drip[i];
  const pDrip = Math.min(1, n / (6 * Math.max(1, mayDrip)));
  for (let i = 0; i < n; i++) { A.drip[i] = A.drip[i] && A.dripD[i] < pDrip ? 1 : 0; drips += A.drip[i]; }
  return { n, A, clear: { nearest, tube, top, flameTop: FLAME_TOP, tried, refused, wanted: total, rule: CLEAR, mayDrip, drips } };
}
// ---- the wax: one small mesh (seven sides, four rings, a sunk top and a foot), shaped per candle in the vertex
// shader by its kind: a slender tapering TAPER, a thicker crooked lumpy DIP, a wide STUB with a collar of spilt wax
// and a frozen run or two down its side. position = (unit circle x, share of height 0..1, unit circle z).
function waxGeometry() {
  const SIDES = 7, V = [0, 0.45, 0.84, 1], pos = [], nor = [], idx = [];
  for (let r = 0; r < V.length; r++) for (let i = 0; i < SIDES; i++) { const a = (i / SIDES) * TAU; pos.push(Math.cos(a), V[r], Math.sin(a)); nor.push(Math.cos(a), 0, Math.sin(a)); }
  for (let r = 0; r < V.length - 1; r++) for (let i = 0; i < SIDES; i++) { const a = r * SIDES + i, b = r * SIDES + (i + 1) % SIDES, c = a + SIDES, d = b + SIDES; idx.push(a, c, b, b, c, d); }
  const top = pos.length / 3; pos.push(0, 0.985, 0); nor.push(0, 1, 0);
  for (let i = 0; i < SIDES; i++) idx.push(top, (V.length - 1) * SIDES + (i + 1) % SIDES, (V.length - 1) * SIDES + i);
  const foot = pos.length / 3; pos.push(0, 0, 0); nor.push(0, -1, 0);
  for (let i = 0; i < SIDES; i++) idx.push(foot, i, (i + 1) % SIDES);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

const GLSL_STORM = /* glsl */`
uniform vec2 uBand;                                   // the storm band's leading and trailing edge (x, metres), from the plan
float stormAtX(float x){ float a=clamp((uBand.x-x)/10.,0.,1.), b=clamp((x-uBand.y)/10.,0.,1.), s=min(a,b); return s*s*(3.-2.*s); }
`;

function waxMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false,
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aA, aB;        // aA: kind, length, radius, seed; aB: tilt x, tilt z, tint, -
      varying vec3 vN, vW; varying vec4 vK; varying vec2 vC;   // vK: kind, share of height, length, tint; vC: its place round the candle
      void main(){
        vC=position.xz;
        float kind=aA.x, len=aA.y, rad=aA.z, seed=aA.w, v=position.y, ang=atan(position.z, position.x+1e-5);
        float r=rad;
        if(kind<.5) r*=1.-.3*v;
        else if(kind<1.5) r*=1.04-.36*v+.07*sin(v*8.+seed*40.)+.05*sin(ang*2.+seed*17.+v*3.);
        else { float run=step(.6,sin(ang*1.+seed*31.))+step(.8,sin(ang*2.+seed*11.)); r*=1.+.2*smoothstep(.6,.86,v)*(1.-smoothstep(.9,1.,v))+.16*run*smoothstep(.15,.5,v)+.05*sin(ang*3.+seed*9.); }
        float capK=step(.9,abs(normal.y));
        vec3 q=vec3(position.x*r*(1.-capK), (v-.5)*len, position.z*r*(1.-capK));
        if(kind>.5&&kind<1.5) q.xz+=vec2(sin(v*2.4+seed*20.),cos(v*1.9+seed*33.))*len*.035;      // a dip is a little crooked
        q.xz+=aB.xy*q.y;                                                                             // its own lean
        vec3 w=aPos+q; vW=w;
        vN=normalize(vec3(normal.x, normal.y+.12*(1.-capK), normal.z));
        vK=vec4(kind, v, len, aB.z);
        gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFogCol, uFill, uWarm, uCold; uniform float uFogDen, uFlash;
      ${GLSL_STORM}
      varying vec3 vN, vW; varying vec4 vK; varying vec2 vC;
      void main(){
        vec3 n=normalize(vN); float kind=vK.x, v=clamp(vK.y,0.,1.), d=(1.-v)*vK.z;       // d: metres below the flame
        // honey beeswax tapers, dull tallow-yellow dips, darker and yellower stubs: none ivory, none white
        vec3 wax=kind<.5?mix(vec3(.68,.45,.16),vec3(.76,.53,.21),vK.w):kind<1.5?mix(vec3(.62,.52,.24),vec3(.69,.57,.27),vK.w):mix(vec3(.54,.41,.16),vec3(.61,.47,.2),vK.w);
        // one or two frozen runs of wax down its side, and the lip of melted wax round its top
        float ang=atan(vC.y,vC.x+1e-5), sd=vK.w*40.;
        float r1=smoothstep(.93,.985,cos(ang-sd))*step(.34+.3*fract(sd*.37),v), r2=smoothstep(.95,.99,cos(ang-sd*1.7-2.1))*step(.55+.3*fract(sd*.61),v)*step(.5,fract(sd*.23));
        float run=max(r1,r2), lip=smoothstep(.9,.95,v);
        float own=.62/(1.+d*d*10.)+.15/(1.+d*d*1.2);                                      // its own flame: strong at the top, darkening down its length
        vec3 light=uFill*(.7+.3*n.y)+uWarm*(.5-.25*n.y)+vec3(1.,.62,.24)*own*(.55+.45*clamp(n.y*.4+.8,0.,1.));
        light*=1.+.24*run+.18*lip-.22*(1.-lip)*smoothstep(.82,.9,v);                      // runs and lip stand proud; a thin shade under the lip
        light+=uCold*uFlash*stormAtX(vW.x)*(.15+.85*clamp(n.y,0.,1.));
        vec3 col=wax*light+vec3(1.,.5,.14)*(exp(-d*7.)*.38);                                 // the wax glows through just under the flame
        float f=1.-exp(-uFogDen*uFogDen*dot(vW-cameraPosition,vW-cameraPosition));
        gl_FragColor=vec4(mix(col,uFogCol,f),1.);
      }`,
  });
}
// ---- the flame and its halo: two quads a candle (the halo first), one draw, added light. The flame is a teardrop
// that stands on its wick; under the storm's band it leans toward +x and streams, and rights itself after. A flame
// too far to fill a few pixels is drawn that wide and as much dimmer, so the far streams neither vanish nor shimmer.
function flameGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -0.5, 0, 1, 0.5, 0, 1, 0.5, 1, 1, -0.5, 1, 1], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  return g;
}
function flameMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aA, aB;
      uniform float uTime, uPx, uFogDen;
      ${GLSL_STORM}
      varying vec2 vUv; varying vec4 vK;                 // vK: part (0 halo, 1 flame), seed, gain, air
      void main(){
        float len=aA.y, seed=aA.w, part=position.z;
        vec3 axis=normalize(vec3(aB.x,1.,aB.y)), base=aPos+axis*(len*.5+.04);
        float st=stormAtX(base.x), gust=.7+.3*sin(uTime*1.7+base.z*.11+base.x*.07+seed*6.), lean=st*gust*.45;
        float fl=sin(uTime*9.+seed*30.)*.5+sin(uTime*23.+seed*11.)*.3+sin(uTime*3.1+seed*5.)*.6;
        float h=(aA.x>1.5?.27:aA.x>.5?.31:.34)*(1.+.1*sin(uTime*13.+seed*17.))*(1.+.22*lean), w=.16;
        vec3 up=normalize(vec3(lean+fl*.035,1.,fl*.02)), mid=base+up*h*.45;
        vec4 mv=viewMatrix*vec4(mid,1.);
        float depth=max(-mv.z,.1), px=uPx/depth, gain=1.;
        if(part<.5){
          mv.xy+=position.xy*1.25*(1.+.07*fl); gl_Position=projectionMatrix*mv; vUv=position.xy;
          gain=.85+.15*sin(uTime*7.+seed*50.);
        } else {
          float sc=max(1.,2.6/max(h*px,1e-3)); gain=clamp(2./(sc*sc),.17,1.);
          vec3 toCam=cameraPosition-mid, right=cross(up,toCam); float rl=length(right); right=rl>1e-3?right/rl:vec3(1.,0.,0.);
          float y=position.y;
          vec3 p=base+up*(y*h*sc-(sc-1.)*h*.5)+right*(position.x*w*sc+fl*.03*y*y)+vec3(lean,0.,0.)*(y*y*h*.15);
          gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); vUv=position.xy;
        }
        float fd=uFogDen*depth; vK=vec4(part,seed,gain,mix(1.,exp(-fd*fd),.7));
      }`,
    fragmentShader: /* glsl */`
      uniform float uHalo; varying vec2 vUv; varying vec4 vK;
      void main(){
        vec3 col;
        if(vK.x<.5){ float r2=dot(vUv,vUv); col=vec3(1.,.55,.2)*(exp(-r2*4.2)*(1.-smoothstep(.6,1.,r2))*uHalo*vK.z); }
        else {
          vec2 p=vec2(vUv.x*2.,clamp(vUv.y,1e-4,1.-1e-4));
          float w=1.8*pow(p.y,.45)*pow(1.-p.y,.75), d=abs(p.x)/max(w,1e-3);
          float body=1.-smoothstep(.3,1.,d), core=(1.-smoothstep(0.,.62,d))*smoothstep(.04,.34,p.y);
          col=mix(vec3(1.,.4,.07),vec3(1.,.88,.55),core)*body;
          col=mix(col,vec3(.12,.24,.9)*body,(1.-smoothstep(.02,.2,p.y))*.8);
          col*=2.6*vK.z;
        }
        gl_FragColor=vec4(col*vK.w,1.);
      }`,
  });
}
// ---- falling wax: a short pale streak under a candle, now and then; it falls to what stands under it and is gone.
// aD: the drop's lower end and its length now (0 = nothing falls). A body: nothing here thins it toward the lens
// (the deal keeps it off the flown line by place). One too far to fill a pixel and a half is drawn that wide and as
// much fainter, as the flames are.
function dripMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aD; uniform float uPx, uFogDen; varying vec3 vK;
      void main(){
        vec4 mv=viewMatrix*vec4(aD.xyz,1.); float depth=max(-mv.z,.1), w=max(.055,1.6*depth/uPx);
        vec3 upv=(viewMatrix*vec4(0.,1.,0.,0.)).xyz;
        mv.xyz+=vec3(position.x*w,0.,0.)+upv*(position.y*aD.w);
        gl_Position=projectionMatrix*mv; float fd=uFogDen*depth;
        vK=vec3(position.xy, step(.01,aD.w)*min(1.,.055/w*1.6)*mix(1.,exp(-fd*fd),.7));
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vK;
      void main(){ float a=(1.-abs(vK.x)*2.)*(1.-vK.y)*(.35+.65*smoothstep(.0,.25,vK.y)); gl_FragColor=vec4(vec3(1.,.83,.56)*(1.5*a*vK.z),1.); }`,
  });
}
// ---- WHAT STANDS UNDER A DROP: the height of the highest solid thing over every place of the plan, read once at the
// build from the hall as its builder built it (root: the hall's object: floor, table, dishes, benches, kerb, logs,
// stores), so a drop ends on what is there and no number of another builder's is copied here. A grid of CELL metres;
// every triangle's corners are entered, and the cells a larger triangle covers; then each cell takes the highest of
// itself and its eight neighbours (a drop beside an edge ends on the taller thing: early, never late). Steam, flame
// and glass (whatever is drawn without writing depth) are not stood on. -> { at(x, z) }
const CELL = 0.25;
export async function surveyGround(ctx, root) {
  const X0 = HALL.x0, Z0 = HALL.zHigh, nx = Math.ceil((HALL.x1 - HALL.x0) / CELL), nz = Math.ceil((HALL.zLow - HALL.zHigh) / CELL), h = new Float32Array(nx * nz), INV = 1 / CELL;
  const v = new THREE.Vector3(), mw = new THREE.Matrix4(); let W = new Float32Array(3 * 4096), work = 0;
  // (only what stands where a candle can be over it: the tracks keep 2.6 m and more off the side walls, the high end
  // wall and the gallery's front, and a candle leaves its ring by under a metre; so what lies within a metre of those is left out)
  const xr = HALL.x1 - 1.0, zr0 = HALL.zHigh + 1.0, zr1 = GALLERY.z0 - 0.5;
  const meshes = []; root.updateMatrixWorld(true); root.traverse((ob) => { if (ob.isMesh && ob.visible) meshes.push(ob); });
  for (const ob of meshes) {
    const mat = Array.isArray(ob.material) ? ob.material[0] : ob.material, g = ob.geometry, pa = g && g.attributes.position;
    if (!pa || !mat || mat.transparent || mat.depthWrite === false) continue;
    const ix = g.index ? g.index.array : null, nt = Math.floor((ix ? ix.length : pa.count) / 3), copies = ob.isInstancedMesh ? ob.count : 1;
    const plain = pa.isBufferAttribute && !pa.isInterleavedBufferAttribute && pa.itemSize === 3 && !pa.normalized ? pa.array : null;
    if (W.length < pa.count * 3) W = new Float32Array(pa.count * 3);
    for (let k = 0; k < copies; k++) {
      if (ob.isInstancedMesh) { ob.getMatrixAt(k, mw); mw.premultiply(ob.matrixWorld); } else mw.copy(ob.matrixWorld);
      const e = mw.elements;
      for (let i = 0, o = 0; i < pa.count; i++, o += 3) {
        let x, y, z; if (plain) { x = plain[o]; y = plain[o + 1]; z = plain[o + 2]; } else { v.fromBufferAttribute(pa, i); x = v.x; y = v.y; z = v.z; }
        W[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; W[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; W[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      }
      work += pa.count;
      for (let t = 0; t < nt; t++) {
        const a = (ix ? ix[t * 3] : t * 3) * 3, b = (ix ? ix[t * 3 + 1] : t * 3 + 1) * 3, c = (ix ? ix[t * 3 + 2] : t * 3 + 2) * 3;
        const ax = W[a], az = W[a + 2], bx = W[b], bz = W[b + 2], qx = W[c], qz = W[c + 2];
        const xa = Math.min(ax, bx, qx), xb = Math.max(ax, bx, qx), za = Math.min(az, bz, qz), zb = Math.max(az, bz, qz);
        if (xa > xr || xb < -xr || za > zr1 || zb < zr0) continue;
        const ay = W[a + 1], by = W[b + 1], qy = W[c + 1];
        const i0 = Math.max(0, Math.floor((xa - X0) * INV)), i1 = Math.min(nx - 1, Math.floor((xb - X0) * INV)), j0 = Math.max(0, Math.floor((za - Z0) * INV)), j1 = Math.min(nz - 1, Math.floor((zb - Z0) * INV));
        if (i1 === i0 && j1 === j0) { const y = Math.max(ay, by, qy), o = j0 * nx + i0; if (y > h[o]) h[o] = y; continue; }       // all in one cell: its highest corner
        let i = Math.floor((ax - X0) * INV), j = Math.floor((az - Z0) * INV); if (i >= 0 && j >= 0 && i < nx && j < nz && ay > h[j * nx + i]) h[j * nx + i] = ay;
        i = Math.floor((bx - X0) * INV); j = Math.floor((bz - Z0) * INV); if (i >= 0 && j >= 0 && i < nx && j < nz && by > h[j * nx + i]) h[j * nx + i] = by;
        i = Math.floor((qx - X0) * INV); j = Math.floor((qz - Z0) * INV); if (i >= 0 && j >= 0 && i < nx && j < nz && qy > h[j * nx + i]) h[j * nx + i] = qy;
        const det = (bz - qz) * (ax - qx) + (qx - bx) * (az - qz);
        if (Math.abs(det) > 1e-7) {                                           // the cells whose middle lies in the triangle, at its height there
          const k1x = (bz - qz) / det, k1z = (qx - bx) / det, k2x = (qz - az) / det, k2z = (ax - qx) / det;
          for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
            const px = X0 + (i + 0.5) * CELL - qx, pz = Z0 + (j + 0.5) * CELL - qz, l1 = k1x * px + k1z * pz, l2 = k2x * px + k2z * pz, l3 = 1 - l1 - l2;
            if (l1 >= -0.02 && l2 >= -0.02 && l3 >= -0.02) { const y = l1 * ay + l2 * by + l3 * qy; if (y > h[j * nx + i]) h[j * nx + i] = y; }
          }
          work += (i1 - i0 + 1) * (j1 - j0 + 1);
        }
        if ((work += 4) > 150000) { work = 0; await ctx.yield(); }
      }
    }
  }
  await ctx.yield();
  const out = new Float32Array(nx * nz);                                      // each cell: the highest of itself and its neighbours
  for (let j = 0; j < nz; j++) {
    const ja = Math.max(0, j - 1), jb = Math.min(nz - 1, j + 1);
    for (let i = 0; i < nx; i++) {
      let y = 0;
      for (let b = ja; b <= jb; b++) for (let a = Math.max(0, i - 1), a1 = Math.min(nx - 1, i + 1); a <= a1; a++) if (h[b * nx + a] > y) y = h[b * nx + a];
      out[j * nx + i] = y;
    }
    if (j % 170 === 169) await ctx.yield();
  }
  return { at: (x, z) => { const i = Math.floor((x - X0) * INV), j = Math.floor((z - Z0) * INV); return i < 0 || j < 0 || i >= nx || j >= nz ? 0 : out[j * nx + i]; }, cells: nx * nz };
}
// ---- THE CANDLES, put together. o: { path, S, dealt, haze (Color), fogDensity, bandAt(x, u) (how far inside the storm's
// band a place is), landAt(x, z) (the height of what stands under a place: surveyGround's) }
// -> { object, n, clear, tracks, glows [{ x, y, z, w }], riders (three of them), uniforms, update(dt, time, u, camera, renderer), triangles, drawCalls }
export async function buildCandles(ctx, o) {
  const T = await layTracks(ctx, o.S.tracks, o.S.round, o.path), tracks = T.tracks;
  const D = await dealCandles(ctx, { tracks, path: o.path, S: o.S, dealt: o.dealt }), n = D.n, A = D.A;
  const U = {
    uTime: { value: 0 }, uBand: { value: new THREE.Vector2(-300, -360) }, uPx: { value: 400 }, uFogCol: { value: o.haze.clone() }, uFogDen: { value: o.fogDensity },
    uFill: { value: new THREE.Color(0.07, 0.062, 0.085) }, uWarm: { value: new THREE.Color(0.2, 0.115, 0.05) }, uCold: { value: new THREE.Color(0.17, 0.19, 0.3) },
    uFlash: { value: 0 }, uHalo: { value: 0.048 },
  };
  const pos = new Float32Array(n * 3), aA = new Float32Array(n * 4), aB = new Float32Array(n * 4), dripOf = [];
  for (let i = 0; i < n; i++) {
    aA[i * 4] = A.kind[i]; aA[i * 4 + 1] = A.len[i]; aA[i * 4 + 2] = A.rad[i]; aA[i * 4 + 3] = A.seed[i];
    aB[i * 4] = A.tiltX[i]; aB[i * 4 + 1] = A.tiltZ[i]; aB[i * 4 + 2] = A.tint[i];
    if (A.drip[i]) dripOf.push(i);
  }
  const posAttr = new THREE.InstancedBufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
  const attA = new THREE.InstancedBufferAttribute(aA, 4), attB = new THREE.InstancedBufferAttribute(aB, 4);
  const dress = (g) => { g.setAttribute('aPos', posAttr); g.setAttribute('aA', attA); g.setAttribute('aB', attB); g.instanceCount = n; return g; };
  const wax = new THREE.Mesh(dress(waxGeometry()), waxMaterial(U)); wax.frustumCulled = false; wax.name = 'candle-wax';
  const flames = new THREE.Mesh(dress(flameGeometry()), flameMaterial(U)); flames.frustumCulled = false; flames.renderOrder = 8; flames.name = 'candle-flames';
  const nd = dripOf.length, dArr = new Float32Array(Math.max(1, nd) * 4), dAttr = new THREE.InstancedBufferAttribute(dArr, 4); dAttr.setUsage(THREE.DynamicDrawUsage);
  const dg = new THREE.InstancedBufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); dg.setIndex([0, 1, 2, 0, 2, 3]);
  dg.setAttribute('aD', dAttr); dg.instanceCount = Math.max(1, nd);
  const drips = new THREE.Mesh(dg, dripMaterial(U)); drips.frustumCulled = false; drips.renderOrder = 8; drips.name = 'candle-drips';
  const object = new THREE.Group(); object.name = 'candles'; object.add(wax, flames, drips);
  await ctx.yield();

  // the streams' thickest parts (the middle of each knot). glows: the oval tracks' clumps, the highest tracks
  // first (the cloud takes its gold from the first twelve); riders: the leading track's three clumps, a third of a lap
  // apart (the rig's three high lights go round with them)
  const meanY = (tr) => { let a = 0; for (let m = 0; m < M; m++) a += tr.c[m * 3 + 1]; return a / M; };
  const glows = [], riders = [], lows = [], order = tracks.filter((t) => t.main).sort((a, b) => meanY(b) - meanY(a));
  const clump = (tr, j) => ({ tr, s: (Math.PI - tr.psi) / (TAU * tr.clumps) + j / tr.clumps, x: 0, y: 24, z: -60, w: 1 });
  for (const tr of order) for (let j = 0; j < tr.clumps; j++) { const g = clump(tr, j); glows.push(g); if (tr.lead) riders.push(g); }
  for (const tr of tracks) if (tr.low) for (let j = 0; j < tr.clumps; j++) lows.push(clump(tr, j));       // the low stream's two

  const q = [0, 0, 0], G = 5.4, size = new THREE.Vector2(), bandAt = o.bandAt, landAt = o.landAt;
  // a candle's middle as drawn at clock t: its place on its ring, its bob, its sway toward +x in the draught
  const placeAt = (i, t, u, out) => {
    const tr = tracks[A.trk[i]]; ringAt(tr, A.s0[i] + tr.rate * t, A.ou[i], A.ov[i], out);
    const b = A.bobA[i], w = t * A.bobF[i] + A.bobP[i];
    let x = out[0] + 0.3 * b * Math.sin(w * 0.7 + 1.3);
    x += bandAt(x, u) * 0.5 * (0.5 + 0.5 * Math.sin(t * 0.45 + A.seed[i] * 40));
    out[0] = x; out[1] += b * Math.sin(w); out[2] += 0.3 * b * Math.cos(w * 0.6);
    return out;
  };
  function update(dt, time, u, camera, renderer) {
    U.uTime.value = time;
    renderer.getDrawingBufferSize(size); U.uPx.value = camera.projectionMatrix.elements[5] * size.y * 0.5;
    for (let i = 0; i < n; i++) { placeAt(i, time, u, q); pos[i * 3] = q[0]; pos[i * 3 + 1] = q[1]; pos[i * 3 + 2] = q[2]; }
    posAttr.needsUpdate = true;
    // the drops. Each leaves from its candle's foot as the wax shader draws it (the middle as it stood when the drop
    // left, half the length down the candle's own lean, a dip's crook), falls, and ends on what stands under it: the
    // streak shortens into the thing it lands on and is gone. (In the storm's draught it leans with its candle's sway.)
    for (let k = 0; k < nd; k++) {
      const i = dripOf[k], P = A.dripT[i], ph = (time + A.dripP[i] * P) / P, tau = (ph - Math.floor(ph)) * P, hl = A.len[i] * 0.5, sd = A.seed[i];
      placeAt(i, time - tau, u, q);
      const crook = A.kind[i] === 1 ? A.len[i] * 0.035 : 0, x = q[0] + crook * Math.sin(sd * 20) - A.tiltX[i] * hl, z = q[2] + crook * Math.cos(sd * 33) - A.tiltZ[i] * hl;
      const foot = q[1] - hl, head = foot - 0.5 * G * tau * tau, len = clamp(G * tau * 0.05, 0.16, 0.8), land = landAt(x, z);
      dArr[k * 4] = x; dArr[k * 4 + 1] = Math.max(head, land); dArr[k * 4 + 2] = z;
      dArr[k * 4 + 3] = land < foot - 0.3 ? clamp(head + len - land, 0, len) : 0;           // (nothing falls where a thing stands as high as the foot)
    }
    dAttr.needsUpdate = true;
    for (const g of glows) { ringAt(g.tr, g.s + g.tr.rate * time, 0, 0, q); g.x = q[0]; g.y = q[1]; g.z = q[2]; }
    for (const g of lows) { ringAt(g.tr, g.s + g.tr.rate * time, 0, 0, q); g.x = q[0]; g.y = q[1]; g.z = q[2]; }
  }
  update(0, 0, 0, new THREE.PerspectiveCamera(60, 16 / 9, 0.3, 1200), ctx.renderer);
  return { object, n, clear: D.clear, tracks, seven: T.seven, dir: T.dir, glows, riders, lows, uniforms: U, update, triangles: n * (7 * 6 + 14 + 4) + nd * 2, drawCalls: 3 };
}
