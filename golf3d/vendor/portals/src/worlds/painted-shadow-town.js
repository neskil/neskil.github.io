// WHERE THE LIGHT IS PAINTED ON: a crooked town of painted canvas flats, after the Caligari set designers (1920).
// Everything is in the brief's course coordinates (+Z is the course; y = 0 on the floor cloth at z 160; x < 0 is the brief's "port",
// which is the RIGHT of a camera flying +Z). The hero part (src/parts/painted-shadow-town.js) is the upper street z 150..524 and the
// style kit; this file builds the rest of the town out of the same cloth: the lower street (sheared so the canyon is revealed at
// the kink), the ground cloth, the square behind the wall (its tower, north row and west side), the roofs (whole houses in rows down
// the hill, a steep black roof behind each gable front), the stair street, the exit square and the exit flat.
// Also here: the tower at the kink (the lower street's destination, with the one lit window and the white shaft across the road), the
// side lane off the canyon, the lamp-post boards, the houses' furniture (black roofs, trapezoid windows, doors, painted light on walls
// and floor) and the backcloth's few thin spokes. THE THIRD TONE: g = 2 is chalk white, painted light the dye does not take (lit
// windows, one shaft in each view); everything else is black, grey and chalk under the reel's dye.
// THE GREAT TOWER (z 482, 128 m, twice the walls) is the town's one landmark: it stands where the canyon ends, three lit windows and a white
// shaft on its face, a white path along the floor to its door, and behind its needle a burst of chalk-white wedges brushed on the backcloth
// (laid out along the sight lines from the street, so it stands round the needle from there). The canyon's walls stand open as wings so it is
// seen whole from the kink to the gate; the door flat with the black kite is the gate at its side.
// THE JOURNEY (u): 0 lower street with the kink tower dead ahead, 0.16 past its face, 0.2 the kink and the canyon, 0.25 up the middle of
// the street at the great tower, 0.34 over the black wedge with the side lane open to starboard and the tower beside it, 0.43 risen on the
// starboard side, the tower whole and the gate beside it, 0.487 through the black kite (the reel's first cut: rose on most seeds), 0.52 the
// square and its tower, 0.61 the tower's face, 0.665 the reel turns blue-green, 0.70 the cat's house under the burst, 0.75 the cat, 0.8 the
// cleft, then the drop.
// No lights, no fog, no textures; post is flat, so a colour written is the colour shown. Every event hangs on u.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, STYLE, STYLE_GLSL, G, PALETTE, STREET, Buf, makePanel, emitSkin, paintOnto, floorPanels, ownRng,
  canvasMaterial, paintMaterial, boardMaterial, ribbonMaterial, ragMaterial } from '../parts/painted-shadow-town.js';

const STR = 12;                                              // floats per panel vertex in the part (pos3, pan2, belly, met2, bay2, z, T)
const GATE_Z = 100, SHEAR = 0.32, cxL = (z) => Math.max(0, 150 - z) * SHEAR;   // centre line of the lower street: it runs in from starboard and kinks left at z 150
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const litW = (seed, pr) => (h1(seed * 6.137 + 1.7) < pr ? 2 : 1);   // a lit window: chalk white, painted light (the third tone); the others take the dye
const h1 = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
const pl = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return pts[pts.length - 1][1]; };

// the stair street: from z 560 it falls 70 m in 120 m to a small raked square and the exit flat at z 690
const STAIR = { z0: 560, z1: 686, top: STREET.rise(540), fall: 70, hw: (z) => pl(z, [[540, 10], [600, 11], [680, 13], [692, 12]]) };
const stairY = (z) => STAIR.top - STAIR.fall * Math.min(1, Math.max(0, (z - STAIR.z0) / (STAIR.z1 - STAIR.z0)));
// the ground cloth outside the streets (0.4 m under the street floor so the two never fight)
const SQ0 = STREET.rise(540) - 70 - 0.4;                     // the square's cloth
const groundY = (x, z) => (z < 545 ? STREET.rise(Math.min(z, 540)) - 0.4 : stairY(z) - 0.4);

// give a panel its own unfolded paint coordinates (z, T) so 'zt' shapes can cross floor and wall in one sweep outside the hero street
function reT(p, fn) {
  let z0 = 1e9, z1 = -1e9, t0 = 1e9, t1 = -1e9; const v = p.v;
  for (let o = 0; o < v.length; o += STR) { const zt = fn(v[o], v[o + 1], v[o + 2]); v[o + 10] = zt[0]; v[o + 11] = zt[1];
    z0 = Math.min(z0, zt[0]); z1 = Math.max(z1, zt[0]); t0 = Math.min(t0, zt[1]); t1 = Math.max(t1, zt[1]); }
  p.bbZT = [z0, t0, z1, t1]; return p;
}
// a pull from (z0,T0) to (z1,T1), w0 wide at the start and w1 at the end, in (z, T)
const pull = (z0, T0, z1, T1, w0, w1, g, seed) => { const dx = z1 - z0, dy = T1 - T0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return { space: 'zt', g, seed, dir: [dx / l, dy / l], pts: [[z0 - nx * w0 / 2, T0 - ny * w0 / 2], [z1 - nx * w1 / 2, T1 - ny * w1 / 2], [z1 + nx * w1 / 2, T1 + ny * w1 / 2], [z0 + nx * w0 / 2, T0 + ny * w0 / 2]] }; };

// THE HAND: contour pulls, barred kite windows, fans and leaning doors, laid on one flat in its own metres ('ab')
function makeHand(rng, cut, detail, pause, hr) {
  const K = { lit: 0.55, roof: 1, door: 1 };   // this hand's habits where it is working now: how many windows are lit, how many black roofs and doors are laid (few in the streets flown at arm's length)
  const rot = (x, y, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]; };
  const fan = (buf, p, cx, cy, ang, len, g, seed, nmin = 3, nmax = 7) => {          // 3 to 7 tapering pulls splayed from one point, never parallel
    const n = rng.int(nmin, nmax), spread = rng.range(0.7, 1.5);
    for (let i = 0; i < n; i++) {
      const a = ang + (n > 1 ? (i / (n - 1) - 0.5) : 0) * spread + rng.range(-0.08, 0.08), l = len * rng.range(0.45, 1), w = l * rng.range(0.07, 0.13) + 0.12, dx = Math.cos(a), dy = Math.sin(a);
      paintOnto(buf, [p], { space: 'ab', g, seed: seed + i * 1.7, dir: [dx, dy], pts: [[cx - dy * w / 2 - dx * 0.2, cy + dx * w / 2 - dy * 0.2], [cx + dy * w / 2 - dx * 0.2, cy - dx * w / 2 - dy * 0.2], [cx + dx * l, cy + dy * l]] });
    }
  };
  const windowOn = (buf, p, a, b, s, seed, kind = cut) => {
    const hw = rng.range(0.9, 1.5) * s, hu = (kind === 'rhomb' ? rng.range(1.5, 2.3) : rng.range(1.0, 1.8)) * s, hd = (kind === 'rhomb' ? hu / s : rng.range(2.0, 3.4)) * s, tilt = rng.sign() * rng.range(0.1, 0.38);
    const R = (x, y) => rot(a + x, b + y, a, b, tilt);
    const pts = kind === 'splinter' ? [R(-hw * rng.range(0.5, 1), -hd * 0.8), R(hw, -hd * rng.range(0.2, 0.7)), R(hw * rng.range(-0.6, 0.3), hu)] : [R(0, -hd), R(hw, 0), R(0, hu), R(-hw, 0)];
    paintOnto(buf, [p], { space: 'ab', g: litW(seed, K.lit * 0.73), seed, dir: [Math.sin(tilt) * 0.3 + 0.2, 1], pts });
    const half = (y) => hw * Math.max(0, 1 - (y > 0 ? y / hu : -y / hd)), bw = (0.2 + 0.1 * rng()) * Math.max(0.6, s * 0.75);
    const bar = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * bw / 2, ny = dx / l * bw / 2;
      paintOnto(buf, [p], { space: 'ab', g: 0, seed: seed + x0, dir: [dx, dy], pts: [R(x0 - nx, y0 - ny), R(x1 - nx * 0.6, y1 - ny * 0.6), R(x1 + nx * 0.6, y1 + ny * 0.6), R(x0 + nx, y0 + ny)] }); };
    if (kind !== 'splinter') {
      const o1 = rng.range(-0.3, 0.3) * hw, o2 = rng.range(-0.3, 0.3) * hw; bar(o1, -hd * (1 - Math.abs(o1) / hw) * 0.96, o2, hu * (1 - Math.abs(o2) / hw) * 0.96);
      if (rng.chance(0.65)) { const y1 = rng.range(-0.3, 0.1) * hd, y2 = rng.range(-0.1, 0.35) * hu; bar(-half(y1) * 0.97, y1, half(y2) * 0.97, y2); }
    } else bar(-hw * 0.2, -hd * 0.6, hw * 0.25, hu * 0.6);
    if (rng() < 0.5 * detail) { const c = rng.pick([R(0, -hd), R(hw, 0), R(-hw, 0)]); fan(buf, p, c[0], c[1], Math.atan2(c[1] - b, c[0] - a + 1e-3) + rng.range(-0.5, 0.5), rng.range(2.2, 5) * s, rng.chance(0.8) ? 0 : 1, seed + 40); }
  };
  const contour = (buf, p, seed, k = 1) => {                                        // black pulls along the gable knives and one side
    const ol = p.outline, cw = (0.26 + 0.3 * rng()) * Math.max(0.45, k);
    for (const [e0, e1] of [[2, 3], [3, 4], rng.chance(0.5) ? [4, 0] : [1, 2]]) {
      const P = ol[e0], Q = ol[e1], dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, w1 = cw * rng.range(0.7, 1.5), w2 = cw * rng.range(0.5, 1.8);
      paintOnto(buf, [p], { space: 'ab', g: 0, seed: seed + e0, dir: [ux, uy], pts: [[P[0] - ux - nx * 0.4, P[1] - uy - ny * 0.4], [Q[0] + ux - nx * 0.4, Q[1] + uy - ny * 0.4], [Q[0] + ux * 0.3 + nx * w2, Q[1] + uy * 0.3 + ny * w2], [P[0] - ux * 0.3 + nx * w1, P[1] - uy * 0.3 + ny * w1]] });
    }
  };
  const gableLight = (buf, p, seed) => {                                             // light brushed on a gable: chalk under the knife edge
    const ol = p.outline, lf = rng.chance(0.5), sh = ol[lf ? 4 : 2], ap = ol[3], dn = rng.range(0.25, 0.6);
    paintOnto(buf, [p], { space: 'ab', g: 1, seed: seed + 50, pts: [[ap[0], ap[1] + 1], [sh[0] + (lf ? -1 : 1), sh[1]], [sh[0] + (lf ? 1 : -1) * p.w * rng.range(0.25, 0.6), sh[1] - p.hTop * dn * rng.range(0.4, 1)], [ap[0] + (lf ? 1 : -1) * p.w * rng.range(0.05, 0.3), ap[1] - p.hTop * dn * 0.35]] });
  };
  const door = (buf, p, seed, s) => {                                                // a tall leaning painted door with a chalk fan at its foot
    const dw = rng.range(2, 3) * s, dh = rng.range(5, 7.5) * s, a0 = p.w * rng.range(0.12, 0.7), sk = rng.sign() * rng.range(0.12, 0.3) * dh, y0 = 1.2 + Math.max(0, p.w * Math.sin(0.16));
    paintOnto(buf, [p], { space: 'ab', g: 0, seed: seed + 30, dir: [sk, dh], pts: [[a0, y0 - 2], [a0 + dw, y0 - 2], [a0 + dw + sk, y0 + dh * rng.range(0.75, 0.95)], [a0 + sk - 0.2 * s, y0 + dh]] });
    fan(buf, p, a0 + dw * 0.5, y0 + 0.3, Math.PI / 2 - Math.sign(sk) * rng.range(0.5, 1.1), rng.range(3, 6) * s, 1, seed + 31, 3, 5);
  };
  // a whole house front: contour, windows climbing out of rank, a door or a fan. s = size of its marks, nw = windows
  const dress = async (buf, p, seed, { k = 1, s = 1.3, nw = 3, light = 0.4, doors = 0.5 } = {}) => {
    contour(buf, p, seed, k); await pause();
    if (light && rng.chance(light)) gableLight(buf, p, seed);
    const body = Math.min(p.hL, p.hR); let a = p.w * rng.range(0.3, 0.7), drift = rng.sign();
    for (let j = 0; j < nw; j++) {
      const b = body * (0.22 + 0.7 * (j + rng.range(0.2, 0.8)) / nw);
      a += drift * rng.range(0.1, 0.3) * p.w; if (a < p.w * 0.2 || a > p.w * 0.8) { drift = -drift; a = Math.min(p.w * 0.78, Math.max(p.w * 0.22, a)); }
      windowOn(buf, p, a, b, s * rng.range(0.75, 1.2), seed + 10 + j * 3.3); if (j & 1) await pause();
    }
    await pause();
    if (rng.chance(doors)) door(buf, p, seed, s);
    else if (rng() < 0.6 * detail) fan(buf, p, p.w * rng.range(0.1, 0.9), rng.range(1, 4), Math.PI / 2 + rng.range(-0.7, 0.7), rng.range(4, 9) * Math.max(0.4, k), rng.chance(0.7) ? 0 : 1, seed + 32);
  };
  // ---- THE FILM'S OWN FURNITURE (drawn from hr, a stream of its own, so the seed's layout above is untouched) ----
  const pab = (buf, p, x0, y0, x1, y1, w0, w1, g, seed) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;   // one pull in the flat's own metres
    return paintOnto(buf, [p], { space: 'ab', g, seed, dir: [dx / l, dy / l], pts: [[x0 - nx * w0 / 2, y0 - ny * w0 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x0 + nx * w0 / 2, y0 + ny * w0 / 2]] }); };
  // a black roof on the knife gable, its eave crooked, one slope caught by a chalk pull (light that fits no source)
  const roofOn = (buf, p, seed, g = 0) => {
    const ol = p.outline, L = ol[4], R = ol[2], A = ol[3], dL = hr.range(0.2, 2.6), dR = hr.range(0.2, 2.6);
    paintOnto(buf, [p], { space: 'ab', g, seed: seed + 60, dir: [R[0] - L[0], R[1] - L[1] + 1.5], pts: [[L[0] - 1.2, L[1] - dL], [R[0] + 1.2, R[1] - dR], [A[0], A[1] + 1.2]] });
    const lf = hr.chance(0.5), S = lf ? L : R, w = hr.range(0.5, 1.1) * Math.max(0.6, p.w / 12), ix = (lf ? 1 : -1) * w * 1.3;
    pab(buf, p, S[0] + ix, S[1] - (lf ? dL : dR) * 0.4 + 0.3, A[0] + ix * 0.4, A[1] - w * 2.2, w, w * 0.25, 1, seed + 61);
    if (hr.chance(0.6)) pab(buf, p, L[0] - 0.5, L[1] - dL - 0.5, R[0] + 0.5, R[1] - dR - 0.5, hr.range(0.3, 0.7), hr.range(0.3, 0.7), 1, seed + 62);   // the eave line
  };
  // a skewed trapezoid window: chalk pane, a crooked black cross, a black reveal on two sides, and sometimes its light spilled down the wall
  const trapWin = (buf, p, a, b, s, seed, spill = 0.45, pane = 1) => {
    const hw = hr.range(1.1, 1.7) * s, hh = hr.range(1.5, 2.3) * s, tilt = hr.sign() * hr.range(0.08, 0.3), R = (x, y) => rot(a + x, b + y, a, b, tilt);
    const BL = [-hw * hr.range(0.8, 1.1), -hh * hr.range(0.8, 1.1)], BR = [hw * hr.range(0.8, 1.1), -hh * hr.range(0.6, 1.1)], TR = [hw * hr.range(0.55, 1.1), hh * hr.range(0.7, 1.1)], TL = [-hw * hr.range(0.5, 1.05), hh * hr.range(0.8, 1.15)];
    const mix = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t], sd = hr.sign();
    if (hr.chance(spill)) { const len = hr.range(3, 7.5) * s, dx = sd * hr.range(0.3, 0.9) * len, sp = hr.range(1.2, 2.2);   // the painted light under the sill
      paintOnto(buf, [p], { space: 'ab', g: 1, seed: seed + 5, dir: [dx, -len], pts: [R(BL[0] * 0.9, BL[1]), R(BR[0] * 0.9, BR[1]), R(BR[0] * sp + dx, BR[1] - len), R(BL[0] * sp + dx, BL[1] - len * hr.range(0.6, 1))] }); }
    paintOnto(buf, [p], { space: 'ab', g: pane >= 2 ? 2 : pane >= 1 ? litW(seed, K.lit) : pane, seed, dir: [0.2, 1], pts: [R(BL[0], BL[1]), R(BR[0], BR[1]), R(TR[0], TR[1]), R(TL[0], TL[1])] });
    const bw = (0.26 + 0.12 * hr()) * Math.max(0.6, s * 0.8), bar = (P, Q, k = 1) => { const p0 = R(P[0], P[1]), p1 = R(Q[0], Q[1]); pab(buf, p, p0[0], p0[1], p1[0], p1[1], bw * k, bw * k * 0.7, 0, seed + P[0] + 3); };
    bar(mix(BL, BR, hr.range(0.35, 0.65)), mix(TL, TR, hr.range(0.35, 0.65))); bar(mix(BL, TL, hr.range(0.35, 0.7)), mix(BR, TR, hr.range(0.3, 0.65)));
    const o = bw * 0.9;                                                               // the reveal: thick black down one side and under the sill
    if (sd > 0) bar([TL[0] - o, TL[1] + o], [BL[0] - o, BL[1] - o * 1.5], 2.2); else bar([TR[0] + o, TR[1] + o], [BR[0] + o, BR[1] - o * 1.5], 2.2);
    bar([BL[0] - o * 2, BL[1] - o], [BR[0] + o * 2, BR[1] - o], 1.8);
  };
  // light brushed on a wall: one great chalk shape falling from high on one side to the foot
  const wallLight = (buf, p, seed) => {
    const body = Math.min(p.hL, p.hR), lf = hr.chance(0.5), a0 = p.w * (lf ? hr.range(-0.05, 0.3) : hr.range(0.45, 0.75)), wt = p.w * hr.range(0.1, 0.22), wb = p.w * hr.range(0.2, 0.4), sk = hr.range(-0.3, 0.3) * p.w;
    paintOnto(buf, [p], { space: 'ab', g: 1, seed: seed + 65, dir: [sk * 0.5, -1], pts: [[a0, body * hr.range(0.7, 1.0)], [a0 + wt, body * hr.range(0.6, 0.95)], [a0 + sk + wb, -1], [a0 + sk, -1]] });
  };
  // a house door at street level: black, leaning, a chalk jamb on the wrong side and a step
  const houseDoor = (buf, p, seed, s, a0 = p.w * hr.range(0.15, 0.7)) => {
    const dw = hr.range(2.4, 3.4) * s, dh = hr.range(5.5, 8) * s, sk = hr.sign() * hr.range(0.1, 0.24) * dh, y0 = 0.6 + Math.max(0, p.w * Math.sin(0.16));
    paintOnto(buf, [p], { space: 'ab', g: 0, seed: seed + 30, dir: [sk, dh], pts: [[a0, y0 - 2], [a0 + dw, y0 - 2], [a0 + dw * 0.9 + sk, y0 + dh * hr.range(0.8, 0.95)], [a0 + sk, y0 + dh]] });
    const e = sk > 0 ? a0 + dw + 0.3 * s : a0 - 0.3 * s; pab(buf, p, e, y0 - 1, e + sk * 0.95, y0 + dh * 0.9, 0.5 * s, 0.25 * s, 1, seed + 33);
    pab(buf, p, a0 - 0.8 * s, y0 + 0.2, a0 + dw + 0.8 * s, y0 + 0.5, 0.7 * s, 0.4 * s, 1, seed + 34);
    return a0 + dw * 0.5;
  };
  // a whole crooked HOUSE: light or roof, contour, a door, trapezoid windows in two crooked rows, kite windows above
  const house = async (buf, p, seed, { s = 1.4, k = 1, roof = 0.6, light = 0.5, doors = 0.6, rows = 2, kites = 1 } = {}) => {
    const body = Math.min(p.hL, p.hR); let lit = false;
    if (hr.chance(light)) { wallLight(buf, p, seed); lit = true; }
    if (hr.chance(roof)) roofOn(h1(seed * 3.77 + 0.3) < K.roof ? buf : null, p, seed); else if (!lit) gableLight(buf, p, seed);
    contour(buf, p, seed, k); await pause();
    let da = -1; if (hr.chance(doors)) da = houseDoor(h1(seed * 5.31 + 0.7) < K.door ? buf : null, p, seed, s);
    const cols = Math.max(1, Math.min(3, Math.round(p.w / (5.2 * s))));
    for (let r = 0; r < rows; r++) { const b = Math.min(body * 0.8, (r === 0 ? 5.2 : 13.5) * s + hr.range(-1, 1) * s) + (r === 0 ? 1.5 : 0);
      for (let c = 0; c < cols; c++) { const a = p.w * (c + 0.5 + hr.range(-0.18, 0.18)) / cols; if (r === 0 && da >= 0 && Math.abs(a - da) < 3.4 * s) continue;
        if (hr.chance(0.85)) trapWin(buf, p, a, b + hr.range(-0.9, 0.9) * s, s * hr.range(0.8, 1.15), seed + 100 + r * 17 + c * 5.3); }
      await pause(); }
    const y0 = Math.min(body * 0.85, 19 * s);
    for (let j = 0; j < kites; j++) { if (body - y0 < 4) break; windowOn(buf, p, p.w * hr.range(0.25, 0.75), y0 + (body - y0) * (j + hr.range(0.3, 0.8)) / kites, s * hr.range(0.8, 1.15), seed + 10 + j * 3.3); }
  };
  return { K, fan, windowOn, contour, gableLight, door, dress, pab, roofOn, trapWin, wallLight, houseDoor, house };
}

export default {
  id: 'painted-shadow-town',
  name: 'Where the Light Is Painted On',
  category: 'artists',
  placeKind: 'city',
  after: 'the Caligari set designers, Warm, Reimann and Röhrig, 1920',
  weirdness: 0.7,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    // ---- the seed's choices, drawn once and in a fixed order ----
    const hour = vary.hour || 'any';
    const reelPick = rng.pick(['rose', 'rose', 'roofs', 'long']);          // most reels turn rose in the square behind the wall
    const reel = hour === 'night' ? 'rose' : (hour === 'golden' || hour === 'dawn') ? 'long' : hour === 'day' ? 'roofs' : reelPick;
    const gusts = rng.pick([3, 3, 3, 1, 5]);                                // weather: three gusts, light air (the slow belly and one soft breath in the canyon), or a hard draught
    const cast = rng.chance(0.62) ? 'thorn' : 'pole';                        // thorn trees or bare forked poles
    const figuresOn = rng.chance(0.8);
    const rare = !!vary.rare;
    const gustTimes = gusts === 5 ? [0.1, 0.2225, 0.286, 0.421, 0.6] : gusts === 3 ? [0.2225, 0.286, 0.421] : [0.2225, 0.421];   // fronts overtake the camera at about u 0.29 and 0.385 in the canyon and 0.56 in the square (0.15 and 0.75 too in a hard draught)
    const xr = ownRng(((ctx.seed | 0) || 1) * 7919 + 71);                    // marks added later draw from here, so ctx.rng's order (the seed's layout) is unchanged

    const scene = new THREE.Scene(); scene.background = new THREE.Color('#D9D2BF');
    const hero = await buildHero(ctx, { palette: PALETTE, detail, reel, gusts, gustTimes, loose: rare, figures: figuresOn, density: dens, gaps: [[-1, 0, 200], [1, 270, 314], [1, 458, 524]] });
    hero.object.rotation.y = Math.PI; hero.object.position.set(0, 0, STREET.zc);      // world = the brief's course coordinates
    scene.add(hero.object);
    const town = hero.street;                                               // everything else is added here, in course coordinates
    const V = hero.variation, U = hero.uniforms;
    // (made straight after the hero, with no pause between, so they share this build's own uniform set)
    const matCanvas = canvasMaterial({ seam: 1.83, tacks: 0, cut: 0 }), matGround = canvasMaterial({ seam: 6, tacks: 1, cut: 0, side: THREE.FrontSide });
    const matPaint = paintMaterial({ cut: 0 }), matBoard = boardMaterial(), matRibbon = ribbonMaterial();
    await ctx.yield();
    const hr = ownRng(((ctx.seed | 0) || 1) * 7919 + 173);                   // the houses' own stream
    const hand = makeHand(rng.fork('hand'), V.cut, detail, () => ctx.yield(), hr);
    const skin = new Buf(false, 24576); await ctx.yield();
    const paint = new Buf(true, 180224); await ctx.yield();                 // sized so that neither ever has to grow (growing copies everything in one step)
    const paintR = new Buf(true, 147456); await ctx.yield(); const groundBuf = new Buf(false, 24576); await ctx.yield();   // paintR: the roofs' paint, a mesh of its own so no buffer grows too big to handle in one step
    // boards (flat pigment) and ribbons collect into one buffer each
    const bp = [], bg = [], bi = [], rp = [], rs = [], rg = [], ri = [];
    const cs = []; for (let i = 0; i < 8; i++) cs.push(new THREE.Vector3());
    const bquad = (a, b, c, d, g) => { const i = bg.length; for (const q of [a, b, c, d]) { bp.push(q.x, q.y, q.z); bg.push(g); } bi.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    const board = (A, B, W, D, w, t, g, ge = g) => {                         // a board from A to B, w wide along W, t deep along D; ge = pigment of its +W edge
      for (let i = 0; i < 8; i++) cs[i].copy(i & 4 ? B : A).addScaledVector(W, (i & 1 ? 0.5 : -0.5) * w).addScaledVector(D, (i & 2 ? 0.5 : -0.5) * t);
      bquad(cs[0], cs[1], cs[5], cs[4], g); bquad(cs[2], cs[6], cs[7], cs[3], g); bquad(cs[0], cs[4], cs[6], cs[2], g); bquad(cs[1], cs[3], cs[7], cs[5], ge); bquad(cs[0], cs[2], cs[3], cs[1], g); bquad(cs[4], cs[5], cs[7], cs[6], g);
    };
    const _rt = new THREE.Vector3(), ribbon = (A, B, hw, g) => { const i = rg.length; _rt.subVectors(B, A).normalize(); for (const P of [A, B]) for (const s of [-1, 1]) { rp.push(P.x, P.y, P.z); rs.push(_rt.x, _rt.y, _rt.z, s * hw); rg.push(g); } ri.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); };
    // loose knives of cloth (offcuts tacked to a flat's edge): they always stir, and stream when a gust front passes
    const gp = [], ga = [], gn = [], gg = [], gi = [], _g0 = new THREE.Vector3();
    let ragQuiet = false;                                                   // offcuts drawn from the seed but not hung
    const rag = (anchor, down, across, flapN, len, wid, g, ph) => { if (ragQuiet) return; const b = gg.length, rows = 4, amp = len * (0.24 + 0.16 * ph);
      for (let r = 0; r <= rows; r++) { const t = r / rows, w = wid * (1 - t) * 0.5;
        for (const sgn of [-1, 1]) { _g0.copy(anchor).addScaledVector(down, len * t).addScaledVector(across, sgn * w + (sgn > 0 ? 0 : wid * 0.25 * t)); gp.push(_g0.x, _g0.y, _g0.z); ga.push(t, ph, amp, sgn); gn.push(flapN.x, flapN.y, flapN.z); gg.push(g); } }
      for (let r = 0; r < rows; r++) { const k = b + r * 2; gi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } };
    const ragsOn = (p, n, rr, scale = 1, gFix = -1, lo = 0.72, hi = 0.97, fn = 0.8, fu = 0.5) => { for (let i = 0; i < n; i++) { const lf = rr.chance(0.5), a = p.w * (lf ? rr.range(0.02, 0.3) : rr.range(0.7, 0.98)), b = (lf ? p.hL : p.hR) * rr.range(lo, hi);
      const A = p.at(a, b).addScaledVector(p.n, 0.18), dn = p.V.clone().negate().addScaledVector(p.U, rr.range(-0.35, 0.35)).normalize(), fl = p.n.clone().multiplyScalar(fn).addScaledVector(p.U, fu);
      rag(A, dn, p.U, fl, rr.range(4, 9) * scale, rr.range(1.3, 2.6) * scale, gFix >= 0 ? gFix : rr.pick([0.03, 0.03, 0.42, 1]), rr()); } };
    const ragRng = rng.fork('rags');
    const edgeOf = (p, g = 0.2) => { const o = p.outline; for (let e = 0; e < 5; e++) { const P = o[e], Q = o[(e + 1) % 5];   // the 10 cm edge of a flat
      bquad(p.at(P[0], P[1], cs[0]), p.at(Q[0], Q[1], cs[1]), p.at(Q[0], Q[1], cs[2]).addScaledVector(p.n, -0.1), p.at(P[0], P[1], cs[3]).addScaledVector(p.n, -0.1), g); } };

    // ---- the course: lower street, kink, canyon, over the wedge, up the wall, through the kite, back lane, roofs, the drop ----
    const fy = STREET.rise, toC = (v) => [-v.x, v.y, STREET.zc - v.z], kc = toC(hero.anchors.kite.position);
    const DIVE = 38 * Math.PI / 180, dv = new THREE.Vector3(0, -Math.sin(DIVE), Math.cos(DIVE));
    const EXIT = new THREE.Vector3(0, stairY(690) + 15.5, 702), back = (m) => [EXIT.x - dv.x * m, EXIT.y - dv.y * m, EXIT.z - dv.z * m];
    const pts = [];
    for (const [z, h] of [[4, 2.5], [36, 3.1], [64, 3.6], [92, 3.6], [120, 3.4]]) pts.push([cxL(z) + (z > 100 ? 0.8 : 0), fy(z) + h, z]);
    pts.push([3.2, fy(152) + 3.2, 152], [3.4, fy(196) + 3.6, 196], [-2.6, fy(248) + 4.2, 248], [2.5, fy(292) + 2.0, 292], [3.5, 21, 316],   // wall to wall up the canyon, over the wedge at 2 m,
      [8, 40, 342], [11, 51.5, 370], kc,                          // then up to the kite's own height, so the door flat is met level and not from underneath [kc[0] - 7, kc[1] + 1, kc[2] + 12],
      // THE SQUARE behind the wall: out of the kite and straight across it at the tower, round in front of its face, back over the square to the cleft
      [-30, 50, 436], [-50, 46, 450], [-72, 42, 464], [-93, 40, 477], [-101, 42, 490], [-100, 45.5, 504], [-93, 48.5, 514], [-80, 51.5, 520], [-60, 55, 524], [-40, 58, 528.5], [-22, 60.5, 536], [-8, 62.5, 548], [-1.5, 61.5, 566], back(110), back(75), back(40), [EXIT.x, EXIT.y, EXIT.z]);
    const path = makePath(pts);
    const pathClear = (x, y, z, r) => path.distanceTo(x, y, z) > r;
    await ctx.yield();

    { let i = 0; for (const p of hero.panels) if (!p.door && !p.rock && !p.loose && !p.step) {     // offcuts on the canyon's flats: at the shoulders, and low where we pass them (one flat in three)
      ragQuiet = (i++ % 3) !== 0;
      if (p.layer === 1) { if (ragRng.chance(0.7)) ragsOn(p, 1, ragRng, 0.9); ragsOn(p, ragRng.int(1, 2), ragRng, 0.8, -1, 0.08, 0.5); }
      else if (ragRng.chance(0.75)) ragsOn(p, 1, ragRng, 0.55, -1, 0.45, 0.95); }
      ragQuiet = false; }

    // ---- the canyon's flats made houses: black roofs on the knives, a row of trapezoid windows and doors at street level, light on the walls ----
    hand.K.lit = 0.2; hand.K.roof = 0.5; hand.K.door = 0.55;
    { let i = 0; const doorP = hero.panels.find((p) => p.door);
      for (const p of hero.panels) { i++; if (p.door || p.backdrop) continue;
        const k = p.k || 1, s = (1.3 * Math.pow(k, 1.5) + 0.12) * 1.2, seed = 9000 + i * 13.1, body = Math.min(p.hL, p.hR);
        if (p.step) {                                                       // the street's far end: grey roofs and grey windows on chalk from the front; from behind, as we rise out of the lane, their ghosts in the linen
          if (hr.chance(0.8)) hand.roofOn(paint, p, seed); const n = hr.int(1, 2), sw = Math.max(1.05, s);
          if (body > 9 && p.w > 4) for (let j = 0; j < n; j++) hand.trapWin(paint, p, p.w * (j + 0.5 + hr.range(-0.15, 0.15)) / n, body * hr.range(0.4, 0.7), sw * Math.min(1, p.w / (n * 4.4 * sw)), seed + 5 + j * 3.1, 0, 0);
          await ctx.yield(); continue; }
        const quiet = p.zmid > 204 && p.zmid < 268;                           // (no black roof or door on the flats that stand at the frame's edge where the tower first shows whole)
        if (hr.chance(p.layer ? 0.5 : 0.7)) hand.roofOn(quiet ? null : paint, p, seed);
        if (!p.layer) { if (hr.chance(0.5)) hand.trapWin(paint, p, p.w * hr.range(0.25, 0.75), Math.min(body * 0.6, 6.5 * s + 1.5), s * 1.1, seed + 3, 0.7); }
        else { const n = hr.int(1, 2); for (let j = 0; j < n; j++) hand.trapWin(j ? null : paint, p, p.w * (j + 0.5 + hr.range(-0.2, 0.2)) / n, Math.min(body * 0.5, hr.range(5.5, 9) * s + 1.5), s * hr.range(1, 1.3), seed + 5 + j * 3.1, 0.6);
          if (hr.chance(0.3)) hand.houseDoor(quiet || (p.side > 0 && p.zmid > 256 && p.zmid < 310) ? null : paint, p, seed, s * 0.9); }
        await ctx.yield(); }
      // THE DOOR FLAT, the street's destination: a black roof, and painted light bursting from the black kite in tapering chalk rays
      const O3 = new THREE.Vector3(doorP.O[0], doorP.O[1], doorP.O[2]), dK = new THREE.Vector3(kc[0], kc[1], kc[2]).sub(O3), ka = dK.dot(doorP.U), kb = dK.dot(doorP.V);
      hand.roofOn(null, doorP, 9900, 0);                                     // (no roof laid: the gate is a dark house front beside the tower, the kite the one black shape on it)
      hand.trapWin(paint, doorP, ka - 9.5, 12, 1.7, 9902, 0, 2); await ctx.yield(); hand.trapWin(paint, doorP, ka + 9, 21, 1.5, 9905, 0, 2); await ctx.yield();
      hand.fan(paint, doorP, ka + 0.5, kb - 17.5, -Math.PI / 2 + 0.2, 13, 1, 9907, 5, 6); await ctx.yield();
      const nr = 11; for (let j = 0; j < nr; j++) { const th = (j + hr.range(0.15, 0.85)) / nr * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), r0 = 1.3 / (Math.abs(c) / 7 + (sn > 0 ? sn / 8 : -sn / 16)) + 1.2, len = hr.range(9, 21) * (sn < -0.3 ? 1.3 : 1);
        hand.pab(null, doorP, ka + c * r0, kb + sn * r0, ka + c * (r0 + len * 0.6), kb + sn * (r0 + len * 0.6), hr.range(2.2, 4.4) * 0.7, 0.05, 2, 9910 + j * 1.7); if (j % 3 === 2) await ctx.yield(); }
      await ctx.yield(); }

    { const o7 = ownRng(((ctx.seed | 0) || 1) * 7919 + 881), handO = makeHand(o7, V.cut, detail, () => ctx.yield(), o7); let best = null, bs = 0, i = 0;
      for (const p of hero.panels) { i++; if (p.door || p.backdrop || p.layer !== 1 || !(p.zmid > 205 && p.zmid < 336) || p.O[1] < -100) continue;
        const body = Math.min(p.hL, p.hR), sc = p.side < 0 && p.zmid > 232 && p.zmid < 262 ? p.w * body : 0; if (sc > bs) { bs = sc; best = p; }
        if (p.w > 8) { handO.fan(paint, p, p.w * o7.range(0.15, 0.85), o7.range(1, 3), Math.PI / 2 + o7.range(-0.5, 0.5), Math.min(body * 0.7, o7.range(10, 17)), 1, 9620 + i * 3.1, 4, 6); await ctx.yield(); } }
      if (best) { const p = best, body = Math.min(p.hL, p.hR), R = Math.min(p.w * 0.4, body * 0.24, 6.2), a0 = p.w * 0.5, b0 = Math.min(body * 0.56, 15), ph = o7.range(0, 6.283), n = 11;
        let px = a0 + Math.cos(ph) * R, py = b0 + Math.sin(ph) * R;
        for (let j = 1; j <= n; j++) { const r = R * (1 - j / (n + 1.5)), a = ph + j * 1.32 + o7.range(-0.12, 0.12), qx = a0 + Math.cos(a) * r, qy = b0 + Math.sin(a) * r, dx = qx - px, dy = qy - py, l = Math.hypot(dx, dy) || 1, ov = 0.35;
          handO.pab(paint, p, px - dx / l * ov, py - dy / l * ov, qx + dx / l * ov, qy + dy / l * ov, 1.9 - 0.1 * j, 1.6 - 0.1 * j, 2, 9660 + j * 1.7); px = qx; py = qy; if (j % 4 === 3) await ctx.yield(); } }
      await ctx.yield(); }

    // ---- THE GATE TOWER: the lower street's destination. A crooked tower house 95 m tall standing on two legs across the street's end;
    //      the road runs under it and the canyon is revealed through it. Dark, black-spired, its windows chalk: a silhouette on the backcloth ----
    { const gz = GATE_Z, gx = cxL(gz), yaw = 1.26, Ug = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), W = 31, gy = fy(gz);
      const Ox = gx - Ug.x * W / 2, Oz = gz - Ug.z * W / 2;
      const T1 = makePanel({ O: [Ox, gy + 15.5, Oz], side: -1, yaw, lean: 0.05, roll: -0.04, w: W, hL: 26, hR: 31, hTop: 79, apex: 0.46, xl: -5.5, xr: -6.5, br: 1.2, nu: 8, nv: 12, step: 0, phase: hr() });
      const P = null, q = (p, pts, g, seed, dir) => paintOnto(P, [p], { space: 'ab', g, seed, dir, pts });   // (not laid: the tower at the kink took its place; its draws are still taken)
      hand.pab(P, T1, 28, 31, 2, 5, 6.5, 2, 1, 9950.5);                                           // one chalk shaft brushed across the whole front
      await ctx.yield(); hand.roofOn(P, T1, 9952); await ctx.yield(); hand.contour(P, T1, 9953, 2); await ctx.yield();
      hand.pab(P, T1, -1, 0.9, W + 1, 2.1, 2.6, 2, 0, 9954.5);                                    // the black lintel over the road
      q(T1, [[22.5, 1], [29.5, 1.5], [27.2, 24]], 0, 9955.5, [0.05, 1]);                          // a black wedge with no source up one side
      await ctx.yield();
      hand.trapWin(P, T1, 9.2, 15, 2.5, 9960, 0); hand.trapWin(P, T1, 19.6, 19, 2.2, 9963, 0); await ctx.yield();
      hand.windowOn(P, T1, 14, 41, 2.3, 9966, 'kite'); await ctx.yield(); hand.windowOn(P, T1, 14.6, 57, 1.4, 9969, 'kite'); await ctx.yield();     // chalk kites in the black spire
      hand.fan(P, T1, 4.5, 3, 1.25, 12, 0, 9975, 3, 4); hand.fan(P, T1, 14, 30, -1.4, 9, 1, 9977, 3, 5);
      await ctx.yield(); ragQuiet = true;
      for (let j = 0; j < 5; j++) rag(T1.at(8.5 + j * 3.4 + hr.range(-1, 1), 0.6).addScaledVector(T1.n, 0.15), new THREE.Vector3(hr.range(-0.2, 0.2), -1, 0).normalize(), T1.U, T1.n, hr.range(2.6, 4.6), hr.range(1.2, 2), hr.pick([0.03, 0.03, 1]), hr());
      ragQuiet = false; await ctx.yield();
      for (const [a0, w, hL, hR, roll, sd] of [[-0.6, 8.2, 19, 18.2, 0.05, 1], [23.2, 8.4, 18, 19.4, -0.06, -1]]) {     // its two legs, splayed
        const o = new THREE.Vector3(Ox, 0, Oz).addScaledVector(Ug, a0), tx = o.x - cxL(o.z);
        const L = makePanel({ O: [o.x + 0.25 * Math.cos(yaw) * -1, STREET.floorY(tx, o.z) - 1.6, o.z + 0.25 * Math.sin(yaw)], side: -1, yaw: yaw + sd * 0.07, lean: 0.03, roll, w, hL, hR, hTop: Math.max(hL, hR) + 0.6, apex: 0.5, xl: 0.3, xr: 0.3, br: 0, nu: 2, nv: 4, step: 0, phase: hr() });
        const ie = sd > 0 ? w - 1 : 1;                                                           // the inner edge: a chalk jamb; a black leaning door; one small window
        hand.pab(P, L, ie, -1, ie + sd * 0.5, 19, 1.5, 0.9, 1, 9980.5 + a0);
        q(L, [[w * 0.3 - sd * 1.6, -1], [w * 0.3 - sd * 1.6 + 3, -1], [w * 0.3 - sd * 1.6 + 3.5, 7.6], [w * 0.3 - sd * 1.6 + 0.9, 8.6]], 0, 9982.5 + a0, [0.1, 1]);
        hand.trapWin(P, L, w * 0.5 - sd * 0.8, 13, 1.25, 9984 + a0, 0); hand.contour(P, L, 9986 + a0, 1.2);
        await ctx.yield(); }
      // the bent finial board on the spire
      const A = T1.at(W * 0.46, 77).addScaledVector(T1.n, -0.2), M = A.clone().addScaledVector(T1.V, 7).addScaledVector(T1.U, 1.8), B = M.clone().addScaledVector(T1.V, 5).addScaledVector(T1.U, -2.8);
      await ctx.yield(); }

    // ---- THE LAMP POSTS: crooked cut-out boards, unlit; their light is paint, a burst of chalk pulls on the cloth at the foot ----
    const lampAt = [];
    { const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), Yv = new THREE.Vector3(0, 1, 0), P = (x, y, z) => new THREE.Vector3(x, y, z);
      const lamp = (x, y, z, h, k, sd) => {
        const A = P(x, y - 0.4, z), M = P(x + sd * 0.55 * k, y + h * 0.56, z), B = P(x - sd * 0.5 * k, y + h, z), C = P(x - sd * 2.3 * k, y + h + 0.7 * k, z);
        board(A, M, X, Z, 0.42 * k, 0.1, 0.03, 1); board(M, B, X, Z, 0.32 * k, 0.1, 0.03, 1); board(B, C, Yv, Z, 0.26 * k, 0.1, 0.03, 1);
        board(P(x - 0.9 * k, y - 0.1, z), P(x + 0.9 * k, y + 0.25, z), Yv, Z, 0.5 * k, 0.12, 0.03, 1);                        // the foot
        const L0 = C.clone().add(P(0, -0.25 * k, 0)), L1 = L0.clone().add(P(sd * 0.25 * k, -2.3 * k, 0));
        board(L0.clone().add(P(0, 0.5 * k, 0)), L0, X, Z, 2.0 * k, 0.1, 0.03); board(L0, L1, X, Z, 1.5 * k, 0.1, 0.03);            // cap and frame
        for (const dz of [-0.09, 0.09]) board(L0.clone().add(P(0, -0.25 * k, dz)), L1.clone().add(P(0, 0.3 * k, dz)), X, Z, 1.0 * k, 0.04, 1);   // the chalk pane, both faces
        board(L1, L1.clone().add(P(0, -0.6 * k, 0)), X, Z, 0.5 * k, 0.1, 0.03);
      };
      const spots = [[119, -11.5, 8.6, 1.25], [166, 10.4, 10, 1.4], [207, 9.2, 7.4, 1], [271, -6.2, 6.6, 0.9], [343, 6.1, 5.6, 0.75]];
      for (let j = 0; j < spots.length; j++) { const [z, T, h, k] = spots[j], x = cxL(z) + T, y = STREET.floorY(T, z);
        lamp(x, y, z, h, k, Math.sign(T)); lampAt.push([z, T, k]); }
      lamp(-39, groundY(-39, 462), 462, 12, 1.8, -1); lamp(-97, groundY(-97, 452), 452, 11, 1.7, 1); lamp(-72, groundY(-72, 546), 546, 10, 1.6, -1); lamp(-12.5, stairY(676), 676, 8.5, 1.3, 1); lamp(13, stairY(640), 640, 8, 1.3, -1);
      await ctx.yield(); }

    // ---- THE LOWER STREET (z -45..150): the same forced perspective, sheared so it runs in from starboard and kinks left into the canyon ----
    const lower = [], lowFloors = floorPanels(-120, 150), shearYaw = -Math.atan(SHEAR);
    for (const f of lowFloors) { const v = f.v; for (let o = 0; o < v.length; o += STR) v[o] += cxL(v[o + 2]); }
    const crossAt = { '-1': [26, 62], '1': [40] };                        // three gables that lean right over the road and cross above it
    let rhombFlat = null;
    for (const side of [-1, 1]) for (const layer of [1, 0]) {
      let z = -86 + rng.range(0, 5), zig = rng.sign();
      while (z < 141) {
        const zc = Math.max(0, z), H = pl(z, [[-90, 15], [40, 17], [110, 27], [150, 31]]);        // low crooked houses at the entry, so the tower and the canyon loom over them
        const w = Math.min(rng.range(8.5, 14.5) * (layer ? 1.15 : 1), 152 - z);
        const cross = layer === 1 && crossAt[side].some((q) => q >= z && q < z + w);
        const lean = cross ? rng.range(0.4, 0.46) - 0.16 : layer ? rng.range(0.12, 0.2) : rng.range(0.09, 0.15);
        zig = -zig; const yaw = zig * rng.range(0.09, layer ? 0.2 : 0.3) + shearYaw;
        const hTop = cross ? rng.range(44, 50) * 0.47 : H * (layer ? rng.range(0.78, 1.04) : rng.range(0.42, 0.62));
        const knife = rng.range(0.16, 0.34) * hTop, tilt = rng.range(0.12, 0.3) * rng.sign();
        const hL = hTop - knife * (1 + tilt), hR = hTop - knife * (1 - tilt);
        const set = layer ? rng.range(1.6, 3.6) : rng.range(-0.3, 0.5), zO = side > 0 ? z : z + w * Math.cos(yaw);
        const x = cxL(zO) + side * (STREET.hw(zc) + set), roll = rng.sign() * rng.range(0.09, 0.16);
        const nu = 2 * Math.max(1, Math.round(w / 4.2)), nv = 2 * Math.max(2, Math.min(7, Math.round(hTop / 9)));
        const br = rng.range(-0.5, 0.5), gap = Math.max(0, w * Math.sin(roll) + br - side * w * 0.0577);
        const p = makePanel({ O: [x, STREET.floorY(x - cxL(zO), zO) - 0.9 - gap, zO], side, yaw, lean, roll, w, hL, hR, hTop, apex: rng.chance(0.5) ? rng.range(0.06, 0.3) : rng.range(0.7, 0.94),
          xl: rng.range(-0.3, 1.4), xr: rng.range(-0.3, 1.4), br, nu, nv, step: 0, phase: rng() });
        reT(p, (X, Y, Z) => [Z, STREET.T(side, X - cxL(Z), Y, Z)]);
        p.layer = layer; p.zmid = z + w * 0.5; p.cross = cross; if (!(side < 0 && p.zmid > 116)) lower.push(p);    // none on the port side near the kink: the tower stands free there
        if (side < 0 && layer === 1 && !cross && z + w * 0.5 > 12 && !rhombFlat) rhombFlat = p;
        z += w * Math.cos(yaw) + rng.range(-0.8, 1.3);
        if (lower.length % 6 === 5) await ctx.yield();
      }
    }
    await ctx.yield();
    const allLow = lower.concat(lowFloors), lowShapes = [];
    { // the chalk road, carried back down the lower street from where the canyon's road begins
      let z = hero.road0[0], T = hero.road0[1], sgn = Math.sign(T) || 1, i = 0;
      const vs = [[z, T]];
      while (z > -112) { const z1 = z - rng.range(30, 44), T1 = -sgn * (STREET.hw(Math.max(0, z1)) + rng.range(0.8, 2.6)); vs.push([z1, T1]); z = z1; T = T1; sgn = -sgn; }
      let k = 1; while (k < vs.length && vs[k][0] > 72) k++;
      const s0 = Math.sign(vs[k - 1][1]) || 1; vs.length = k; vs.push([44, -s0 * 13.5], [-27, s0 * 9.5], [-62, -s0 * 17], [-112, s0 * 18]);
      for (let j = 0; j + 1 < vs.length; j++) { const [za, Ta] = vs[j], [zb, Tb] = vs[j + 1];
        lowShapes.push(pull(za + (za - zb) * 0.06, Ta + (Ta - Tb) * 0.06, zb - (za - zb) * 0.06, Tb - (Ta - Tb) * 0.06, 5, 5, 1, 900 + (i++) * 7.3)); }
      // beside it at the entry, a black fan of four tapering pulls brushed up the street from one point, and a wedge off the other wall
      for (let j = 0; j < 4; j++) { const a = s0 * (0.05 + 0.2 * j) + xr.range(-0.04, 0.04), l = xr.range(9, 17) * (1 - 0.12 * j), w = 0.5 + l * 0.055;
        lowShapes.push(pull(1.5, s0 * 6.6, 1.5 + Math.cos(a) * l, s0 * 6.6 + Math.sin(a) * l, w, 0.02, 0, 936.5 + j * 1.7)); }
      lowShapes.push(pull(13, -s0 * 6.5, 30, -s0 * (STREET.hw(30) + 22), 4.6, 0.02, 0, 944.5));
      // the opening's one shaft: across the road and up the starboard wall, 60 m ahead of the entry
      lowShapes.push(pull(47, -7.5, 67, STREET.hw(60) + 36, V.broad ? 6.5 : 5, 1.3, 2, 931.5));
      // a black wedge with no source, across the road and up the port wall
      pull(92 + rng.range(-3, 3), 6, 121, -(STREET.hw(120) + rng.range(26, 34)), rng.range(6.5, 9), 0.02, 0, 933.5);   // (drawn, not laid: the street's end is the tower's)
      lowShapes.push(pull(-6, -9, -19, -(STREET.hw(0) + rng.range(14, 20)), 3.4, 0.02, 0, 935.5));
      const n = V.broad ? 1 : 3;
      for (let j = 0; j < n; j++) { const z = V.broad ? 128 : [58, 98, 134][j], side = j === 1 ? 1 : -1, run = rng.sign() * rng.range(6, 16);
        lowShapes.push(pull(z, -side * rng.range(1, 6), z + run, side * (STREET.hw(z) + rng.range(16, 30)), V.broad ? rng.range(3.5, 5) : rng.range(1.4, 2.6), 0.4, 1, 940 + j * 3.7)); }
    }
    for (let i = 0; i < lowShapes.length; i++) { paintOnto(paint, allLow, lowShapes[i]); if (i % 2 === 1) await ctx.yield(); }
    { // at the kink, where the street turns into the canyon: one shaft across the road and up the starboard wall, a black wedge beside it (they cross from the lower street's flats onto the canyon's)
      const mouth = hero.panels.filter((p) => p.side > 0 && p.zmid < 190).concat(hero.floors), hk = STREET.hw(158);
      for (const sh of [pull(140, -5.5, 164, hk + 17, 6.5, 2.6, 1, 946.5), pull(171, hk - 2, 160, hk + 25, 5.5, 0.3, 0, 948.5), pull(150, hk + 1, 143, hk + 20, 3.6, 0.3, 0, 949.5)]) { paintOnto(paint, allLow, sh); paintOnto(paint, mouth, sh); await ctx.yield(); } }
    { const fl = lowFloors.concat(hero.floors);                             // light spilled from the house doors across the floor cloth: chalk shapes that fit no lamp
      for (let j = 0; j < 14; j++) { const z = -74 + j * 25 + hr.range(-6, 6), side = j & 1 ? 1 : -1, hwz = STREET.hw(Math.max(0, z)), k = hwz / 13;
        paintOnto(paint, fl, pull(z, side * (hwz + 1.5), z + hr.range(-9, 9) * k, side * hr.range(0.5, 4.5) * k, hr.range(1.6, 2.6) * k, hr.range(4, 7) * k, 1, 9700 + j * 3.3));
        if (j & 1) await ctx.yield(); } }
    { const fl = lowFloors.concat(hero.floors);                             // the painted floor: long tapering pulls of chalk and black running up the street, out of true with it
      for (let j = 0; j < 22; j++) { const z = -84 + j * 17 + hr.range(-5, 5), side = hr.sign(), k = STREET.hw(Math.max(0, z)) / 13, T0 = side * hr.range(2.5, 11) * k, len = hr.range(30, 58) * k, g = j % 3 === 1 ? 0 : 1;
        if (z + len > 276 && z < 330) continue;                             // the wedge's floor is its own
        paintOnto(paint, fl, pull(z, T0, z + len, T0 * hr.range(0.2, 0.7) + hr.range(-1.5, 1.5) * k, (g ? hr.range(1.0, 1.7) : hr.range(0.7, 1.2)) * k, 0.05, g, 9600 + j * 3.3));
        if (j % 3 === 2) await ctx.yield(); } }
    for (const [z, T, k] of lampAt) { const pan = z < 150 ? lowFloors : hero.floors, n = 6, a0 = hr.range(0, 6.283);      // each lamp's painted light, and a shadow that fits nothing
      for (let j = 0; j < n; j++) { const a = a0 + (j + hr.range(-0.25, 0.25)) / n * 6.283, l = hr.range(3.2, 7.5) * k; paintOnto(paint, pan, pull(z + Math.cos(a) * 0.5, T + Math.sin(a) * 0.5, z + Math.cos(a) * l, T + Math.sin(a) * l, hr.range(0.8, 1.3) * k, 0.04, 1, 9800 + z + j * 1.7)); }
      const a = hr.range(0, 6.283); paintOnto(paint, pan, pull(z, T, z + Math.cos(a) * 10 * k, T + Math.sin(a) * 10 * k, 0.5 * k, 2.4 * k, 0, 9850 + z)); await ctx.yield(); }
    for (let i = 0; i < lower.length; i++) {
      const p = lower[i], seed = 1000 + i * 13.1;
      if (p === rhombFlat) { hand.contour(paint, p, seed); hand.windowOn(paint, p, p.w * 0.5, Math.min(p.hL, p.hR) * 0.66, 3.4, seed + 5, 'rhomb'); }
      else if (p.layer) await hand.house(paint, p, seed, { s: 1.45, roof: p.cross ? 0 : 0.6, light: p.cross ? 1 : 0.5, doors: 0.35, rows: 2, kites: Math.max(1, Math.round(rng.range(1.6, 3.8) * dens * 0.6)) });
      else await hand.house(paint, p, seed, { s: 1.3, roof: 0.75, light: 0.35, doors: 0.8, rows: 1, kites: Math.round(rng.range(0.8, 2.2) * dens * 0.4) });
      emitSkin(skin, p); edgeOf(p); ragQuiet = i % 3 !== 0; if (p.layer && ragRng.chance(0.45)) ragsOn(p, 1, ragRng, 0.8); if (ragRng.chance(0.7)) ragsOn(p, 1, ragRng, p.layer ? 0.7 : 0.5, -1, p.layer ? 0.1 : 0.45, p.layer ? 0.5 : 0.95); ragQuiet = false;
      await ctx.yield();
    }
    for (const f of lowFloors) emitSkin(groundBuf, f);
    hand.K.lit = 0.55; hand.K.roof = 1; hand.K.door = 1;
    await ctx.yield();

    // ---- THE GROUND CLOTH outside the streets: the same tacked scenic canvas, sewn in 6 m widths, out to the backcloth ----
    const GX = [-700, -420, -260, -170, -115, -80, -55, -35, -18, 0, 18, 35, 55, 80, 115, 170, 260, 420, 700], grounds = [], farGrounds = [];
    for (let zs = -360; zs < 1040; zs += 60) {
      const rows = 10, cols = GX.length - 1, v = new Float32Array((rows + 1) * (cols + 1) * STR), tri = [];
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
        const z = zs + j * 6, x = GX[i], o = (j * (cols + 1) + i) * STR;
        v[o] = x; v[o + 1] = groundY(x, z); v[o + 2] = z; v[o + 3] = z / 6; v[o + 4] = x / 6; v[o + 5] = (i & 1) && !(j & 1) && Math.abs(x) < 100 ? 0.4 * h1(z * 3.3 + i * 5.9) : 0;
        v[o + 6] = z; v[o + 7] = x; v[o + 8] = 6; v[o + 9] = 6; v[o + 10] = z; v[o + 11] = x;
      }
      const triF = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1, t = zs >= 900 || zs < -240 || i < 1 || i >= cols - 1 ? triF : tri;
        if ((i + j) & 1) t.push(a, c, b, b, c, d); else t.push(a, d, b, a, c, d); }
      grounds.push({ v, tri, n: { x: 0, y: 1, z: 0 }, side: 0, phase: h1(zs * 0.37 + 5), rock: 0, loose: 0, step: 0, code: 0, floor: true, bbZT: [zs, -700, zs + 60, 700], bbAB: [0, 0, 0, 0] });
      if (triF.length) farGrounds.push({ v, tri: triF, n: { x: 0, y: 1, z: 0 }, side: 0, phase: h1(zs * 0.37 + 5), rock: 0, loose: 0, step: 1, code: 0, floor: true, bbZT: [zs, -700, zs + 60, 700], bbAB: [0, 0, 0, 0] });
    }
    for (const f of grounds) emitSkin(groundBuf, f);
    await ctx.yield();
    for (const f of farGrounds) emitSkin(groundBuf, f);
    await ctx.yield();

    // ---- THE KINK TOWER: the lower street's destination. A crooked tower 84 m tall standing at the outside of the kink, dead ahead from the
    //      first frame, where the port wall of the canyon's mouth would be: four flats leaning together, a black spire on each, ONE lit window
    //      high on the face we come at, and a shaft of painted light (chalk white) brushed down that face and on across the road toward us ----
    const KT = { x: -24, z: 179, hw: 12 };
    { const tw = ownRng(((ctx.seed | 0) || 1) * 7919 + 523), handT = makeHand(tw, V.cut, detail, () => ctx.yield(), tw);
      const gy = fy(KT.z) - 0.4, w = 2 * KT.hw + 0.5, taper = 0.03, dl = 0.085, c = 0.39, s = 0.92;
      const faces = [[c, -s, 0, dl], [s, c, dl, 0], [-c, s, 0, -dl], [-s, -c, -dl, 0]];              // outward normal (x, z), lean, roll: the whole tower leans 5 degrees over the canyon's mouth
      for (let f = 0; f < 4; f++) { const [nx, nz, ln, rl] = faces[f], seed = 9950 + f * 37.3;
        const p = makePanel({ O: [KT.x + nx * KT.hw - nz * w / 2, gy - 3.2, KT.z + nz * KT.hw + nx * w / 2], side: 1, yaw: Math.atan2(nz, -nx), lean: ln - taper, roll: rl, w,
          hL: 60 + tw.range(-4, 3), hR: 60 + tw.range(-4, 3), hTop: 104 + tw.range(-3, 3), apex: 0.5 + tw.range(-0.14, 0.14), xl: -2, xr: -2, br: 0, nu: 6, nv: 12, step: 0, phase: tw() });
        const body = Math.min(p.hL, p.hR), q = (pts, g, sd, dir) => paintOnto(paint, [p], { space: 'ab', g, seed: sd, dir, pts });
        if (f === 0) { handT.pab(paint, p, w * 0.56, 38, w * 0.4, -1, 3.8, 8.5, 2, seed + 0.5);            // the shaft: from under the lit window to the foot, and on across the road (below)
          const F = p.at(w * 0.4, 0), sh = pull(F.z + 3, F.x - cxL(F.z) - 1.2, 88, 11, 8.5, 2.8, 2, 9948.5);
          paintOnto(paint, lowFloors.concat(hero.floors, grounds.filter((g) => g.bbZT[0] >= 120 && g.bbZT[0] < 240)), sh); await ctx.yield(); }
        if (f === 1) { q([[12.5, 1], [19.5, 1.5], [16.6, body * 0.72]], 0, seed + 1.5, [0.05, 1]); handT.pab(paint, p, 3, 10, 9.5, body * 0.84, 3.6, 1, 1, seed + 0.7); }   // a black wedge with no source, a pull of light beside it
        await ctx.yield(); handT.roofOn(paint, p, seed + 2); await ctx.yield(); handT.contour(paint, p, seed + 3, 2.2); await ctx.yield();
        if (f === 0) { handT.houseDoor(paint, p, seed, 2.3, w * 0.1); await ctx.yield(); handT.trapWin(paint, p, w * 0.57, 45, 3.5, seed + 20, 0, 2); await ctx.yield();          // the black door, the ONE lit window,
          handT.trapWin(paint, p, w * 0.25, 27, 2, seed + 23, 0, 0.999); await ctx.yield(); handT.trapWin(paint, p, w * 0.77, 18, 1.9, seed + 26, 0, 0.999); }   // and two that are not
        if (f === 1) { handT.trapWin(paint, p, w * 0.3, 21, 2, seed + 20, 0.5, 0.999); await ctx.yield(); handT.trapWin(paint, p, w * 0.68, 36, 2.1, seed + 23, 0, 0.999); await ctx.yield(); handT.fan(paint, p, w * 0.75, 2, 1.4, 12, 0, seed + 70, 3, 5); }
        await ctx.yield();
        if (f < 2) handT.windowOn(paint, p, w * p.apex * 0.8 + w * 0.1, body + (p.hTop - body) * 0.4, 2, seed + 60.2, 'kite');                       // a chalk kite in the black of the spire
        emitSkin(skin, p); edgeOf(p); if (f < 2) ragsOn(p, 2, tw, 1.4, -1, 0.3, 0.9);
        if (f === 0) { const A = p.at(w * p.apex, p.hTop - 1).addScaledVector(p.n, -0.3), M = A.clone().addScaledVector(p.V, 8).addScaledVector(p.U, 2.2), B = M.clone().addScaledVector(p.V, 6).addScaledVector(p.U, -3.4);
          board(A, M, p.U, p.n, 1.2, 0.14, 0.03, 1); board(M, B, p.U, p.n, 0.9, 0.14, 0.03, 1); }             // the bent finial board
        await ctx.yield(); }
    }

    // ---- THE GREAT TOWER: the town's one landmark, standing where the canyon ends (the street runs to its foot; the door flat is the gate at its
    //      side). 120 m tall, twice the height of the walls, four flats leaning together with a black needle on each; three lit windows in chalk
    //      white on the face we come at, a shaft of painted light down that face and on along the floor cloth toward us, and behind the needle,
    //      brushed on the backcloth, a burst of chalk-white wedges: light painted AT it, as the film paints light, with no lamp anywhere ----
    const GT = { x: 9, z: 482, hw: 12, tip: new THREE.Vector3() };
    { const tg = ownRng(((ctx.seed | 0) || 1) * 7919 + 661), handG = makeHand(tg, V.cut, detail, () => ctx.yield(), tg);
      const gy = fy(GT.z) - 0.4, w = 2 * GT.hw + 0.5, taper = 0.034, dl = 0.065, c = -0.3, s = 0.954;
      const faces = [[c, -s, 0, dl], [s, c, dl, 0], [-c, s, 0, -dl], [-s, -c, -dl, 0]];              // outward normal (x, z), lean, roll: face 0 looks down the street, face 3 at the square
      for (let f = 0; f < 4; f++) { const [nx, nz, ln, rl] = faces[f], seed = 9800 + f * 37.3;
        const p = makePanel({ O: [GT.x + nx * GT.hw - nz * w / 2, gy - 3.2, GT.z + nz * GT.hw + nx * w / 2], side: 1, yaw: Math.atan2(nz, -nx), lean: ln - taper, roll: rl, w,
          hL: 71 + tg.range(-3, 3), hR: 71 + tg.range(-3, 3), hTop: 128 + tg.range(-2, 3), apex: 0.5 + tg.range(-0.1, 0.1), xl: -2.6, xr: -2.6, br: 0, nu: 6, nv: 14, step: 0, phase: tg() });
        const body = Math.min(p.hL, p.hR), q = (pts, g, sd, dir) => paintOnto(paint, [p], { space: 'ab', g, seed: sd, dir, pts });
        if (f === 0) { p.at(w * p.apex, p.hTop, GT.tip);
          q([[w * 0.02, body * 0.99], [w * 0.5, body * 1.02], [w * 0.64, -1], [w * 0.04, -1]], 1, seed + 0.3, [0.06, -1]);   // light brushed down half the face: the tower stands pale against the dark walls
          handG.pab(paint, p, w * 0.52, 55, w * 0.45, -1, 2.4, 5.6, 2, seed + 0.5);                     // the shaft: from under the great window to the foot,
          const F = p.at(w * 0.45, 0), sh = pull(F.z + 2, F.x, 336, 1.2, 6.4, 2.0, 2, 9796.5);         // and on down the street's floor cloth: the white path to its door
          paintOnto(paint, hero.floors.concat(grounds.filter((g) => g.bbZT[2] > 400 && g.bbZT[0] < 520)), sh); await ctx.yield(); }
        if (f === 3) { q([[12.5, 1], [19, 1.5], [16.4, body * 0.7]], 0, seed + 1.5, [0.05, 1]); handG.pab(paint, p, 3, 10, 8.5, body * 0.84, 3.2, 0.9, 1, seed + 0.7); }   // a black wedge with no source, a pull of light beside it
        await ctx.yield(); handG.roofOn(paint, p, seed + 2); await ctx.yield(); handG.contour(paint, p, seed + 3, 2.2); await ctx.yield();
        if (f === 0) { handG.houseDoor(paint, p, seed, 2.1, w * 0.06); await ctx.yield();
          handG.trapWin(paint, p, w * 0.53, 61, 3.4, seed + 20, 0, 2); await ctx.yield();               // the three lit windows, skewed, out of rank
          handG.trapWin(paint, p, w * 0.77, 41, 2.1, seed + 23, 0, 2); await ctx.yield(); handG.trapWin(paint, p, w * 0.22, 26, 2.1, seed + 26, 0, 2); }
        if (f === 3) { handG.trapWin(paint, p, w * 0.3, 24, 2, seed + 20, 0.5, 2); await ctx.yield(); handG.trapWin(paint, p, w * 0.64, 44, 2.2, seed + 23, 0, 0.999); await ctx.yield(); handG.fan(paint, p, w * 0.75, 2, 1.4, 12, 0, seed + 70, 3, 5); }
        if (f === 1 || f === 2) handG.trapWin(paint, p, w * 0.5, 40, 2.2, seed + 20, 0, 0.999);
        await ctx.yield();
        if (f === 0 || f === 3) { const ka = w * (0.1 + 0.8 * p.apex), kb = body + (p.hTop - body) * 0.3, kt = f ? -0.12 : 0.14, R = (x, y) => [ka + x * Math.cos(kt) - y * Math.sin(kt), kb + x * Math.sin(kt) + y * Math.cos(kt)];
          q([R(0, -5.6), R(2.2, 0), R(0, 3.4), R(-2.2, 0)], f ? 1 : 2, seed + 60.2, [0.2, 1]); handG.pab(paint, p, R(0.2, -5)[0], R(0.2, -5)[1], R(-0.2, 3)[0], R(-0.2, 3)[1], 0.5, 0.35, 0, seed + 61.2); }   // a kite in the black of the needle, with its one crooked bar
        emitSkin(skin, p); edgeOf(p); if (f === 0 || f === 3) { ragsOn(p, 2, tg, 1.4, -1, 0.3, 0.9); ragsOn(p, 3, ownRng(((ctx.seed | 0) || 1) * 7919 + 663 + f), 2.3, -1, 0.5, 0.97); }   // long offcuts of cloth stream from its shoulders
        if (f === 0) { const A = p.at(w * p.apex, p.hTop - 1).addScaledVector(p.n, -0.3), M = A.clone().addScaledVector(p.V, 9).addScaledVector(p.U, 2.4), B = M.clone().addScaledVector(p.V, 7).addScaledVector(p.U, -3.8);
          board(A, M, p.U, p.n, 1.3, 0.14, 0.03, 1); board(M, B, p.U, p.n, 1.0, 0.14, 0.03, 1); }             // the bent finial board
        await ctx.yield(); }
      // the burst behind the needle: tapering wedges of chalk white brushed on the backcloth, laid out as seen from the middle of the street
      // (each corner is carried along its sight line onto the cloth, so from the street they stand round the needle; from elsewhere they lie askew)
      const E0 = new THREE.Vector3(1, 9, 257), d0 = GT.tip.clone().add(new THREE.Vector3(0, -15, 0)).sub(E0).normalize(), rt = new THREE.Vector3().crossVectors(d0, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(rt, d0);
      const tentR = (y) => (y < 200 ? 700 : Math.max(0, 700 * (320 - y) / 120)), _v = new THREE.Vector3();
      const cast = (ax, ay) => { _v.copy(d0).addScaledVector(rt, Math.tan(ax)).addScaledVector(up, Math.tan(ay)); let a = 0, b = 2600;
        for (let i = 0; i < 36; i++) { const t = (a + b) / 2, x = E0.x + _v.x * t, y = E0.y + _v.y * t, z = E0.z + _v.z * t; if (Math.hypot(x, z - STREET.zc) < 0.955 * tentR(y)) a = t; else b = t; }
        return new THREE.Vector3(E0.x + _v.x * a, E0.y + _v.y * a, E0.z + _v.z * a); };
      const wedge = (a0, a1, r0, r1, hw0) => { const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);   // from r0 out to r1 (radians of sight), base hw0 wide
        const P0 = cast(c0 * r0 - s0 * hw0, s0 * r0 + c0 * hw0), P1 = cast(c0 * r0 + s0 * hw0, s0 * r0 - c0 * hw0), P2 = cast(c1 * r1, s1 * r1); bquad(P0, P1, P2, P2, 2); };
      const nb = 9; let th = tg.range(0, 0.5);
      for (let j = 0; j < nb; j++) { th += 6.283 / nb * tg.range(0.72, 1.28); const dn = Math.sin(th) < -0.82;      // (none straight down: the tower stands there)
        const long = j % 4 === 1, len = (long ? tg.range(0.36, 0.5) : tg.range(0.14, 0.24)) * (dn ? 0.5 : 1), hw0 = tg.range(0.026, 0.04) * (long ? 1.25 : 1), bend = tg.range(-0.07, 0.07);
        wedge(th, th + bend, 0.012, len, hw0);
        if (tg.chance(0.6)) wedge(th + tg.sign() * tg.range(0.2, 0.3), th + bend * 2, 0.02, len * tg.range(0.4, 0.62), hw0 * 0.42);   // a second, thinner pull splayed beside it
        await ctx.yield(); }
      for (let j = 0; j < 5; j++) wedge(j * 1.257 + 0.4, j * 1.257 + 1.5, -0.03, 0.05, 0.035);                // the heart of it, an uneven knot of chalk
    }

    // ---- THE SECOND STREET: the west side of the square, low painted fronts facing it across 130 m of floor cloth ----
    const second = [];
    { let z = 420 + rng.range(0, 4), zig = rng.sign(), i = 0;
      while (z < 566) {
        const w = rng.range(13, 20); zig = -zig; const yaw = zig * rng.range(0.1, 0.28), gy = groundY(-154, z), hTop = rng.range(44, 58) * 0.6, knife = rng.range(0.16, 0.3) * hTop, tilt = rng.range(0.12, 0.3) * rng.sign();
        const roll = rng.sign() * rng.range(0.09, 0.15), p = makePanel({ O: [-154 + rng.range(-2.5, 2.5), gy - 1.5 - Math.abs(w * Math.sin(roll)), z + w * Math.cos(yaw)], side: -1, yaw, lean: rng.range(0.09, 0.15), roll, w,
          hL: hTop - knife * (1 + tilt), hR: hTop - knife * (1 - tilt), hTop, apex: rng.chance(0.5) ? rng.range(0.06, 0.3) : rng.range(0.7, 0.94), xl: rng.range(-0.3, 1.2), xr: rng.range(-0.3, 1.2), br: rng.range(-0.5, 0.5),
          nu: 2 * Math.max(1, Math.round(w / 4.2)), nv: 2 * Math.max(2, Math.min(6, Math.round(hTop / 9))), step: 0, phase: rng() });
        ragsOn(p, ragRng.int(2, 3), ragRng, 1.1); second.push(p); await hand.house(paint, p, 2000 + i * 13.1, { s: 1.5, roof: 0.65, light: 0.6, doors: 0.7, rows: 2, kites: Math.max(2, Math.round(rng.range(4, 6.4) * dens * 0.5)) });
        emitSkin(skin, p); edgeOf(p); z += w * Math.cos(yaw) + rng.range(-0.6, 1); i++;
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- THE SQUARE behind the wall (x -150..-14, z 428..562): out of the kite the town opens. A crooked tower 95 m tall stands at its far
    //      corner against the pale backcloth, four flats leaning together with a knife gable each; a north row of house fronts; the floor
    //      cloth painted with the road to the tower door, one chalk shaft that runs across the floor and up the tower, wedges with no source ----
    const sq = ownRng(((ctx.seed | 0) || 1) * 7919 + 311), handS = makeHand(sq, V.cut, detail, () => ctx.yield(), sq);
    const skinS = new Buf(false, 8192); await ctx.yield();
    const paintS = new Buf(true, 32768); await ctx.yield();
    const TOWER = { x: -126, z: 500, hw: 11.5 }, sqTracks = [], sqTrees = [];
    { const gy = groundY(TOWER.x, TOWER.z), dl = 0.1, taper = 0.036, w = 2 * TOWER.hw + 0.5;
      const faces = [[0.8, -0.6, 0, dl], [0.6, 0.8, dl, 0], [-0.8, 0.6, 0, -dl], [-0.6, -0.8, -dl, 0]];   // outward normal (x, z), lean, roll: the whole tower leans 6 degrees to the north-east
      for (let f = 0; f < 4; f++) { const [nx, nz, ln, rl] = faces[f], seed = 9100 + f * 37.3;
        const p = makePanel({ O: [TOWER.x + nx * TOWER.hw - nz * w / 2, gy - 3.2, TOWER.z + nz * TOWER.hw + nx * w / 2], side: 1, yaw: Math.atan2(nz, -nx), lean: ln - taper, roll: rl, w,
          hL: 66 + sq.range(-5, 3), hR: 66 + sq.range(-5, 3), hTop: 98 + sq.range(-3, 3), apex: 0.5 + sq.range(-0.12, 0.12), xl: -2.4, xr: -2.4, br: 0, nu: 6, nv: 12, step: 0, phase: sq() });
        const body = Math.min(p.hL, p.hR), q = (pts, g, sd, dir) => paintOnto(paintS, [p], { space: 'ab', g, seed: sd, dir, pts });
        if (f === 0) handS.pab(paintS, p, 15.5, -1, 4.5, body * 0.93, 6, 2.2, 2, seed + 0.5);              // the chalk shaft, come across the floor and on up the face
        if (f === 1) q([[13, 1], [20, 1.5], [17.4, body * 0.7]], 0, seed + 1.5, [0.05, 1]);                // a black wedge with no source
        if (f === 3) handS.pab(paintS, p, 3, 8, 15, body * 0.8, 4.5, 1.2, 1, seed + 0.5);
        await ctx.yield(); handS.roofOn(paintS, p, seed + 2); await ctx.yield(); handS.contour(paintS, p, seed + 3, 2.2); await ctx.yield();
        const da = f === 0 ? handS.houseDoor(paintS, p, seed, 2.5, w * 0.3) : -1;                          // the black door in the face we come at
        for (let r = 0; r < 3; r++) { const b = body * (0.26 + 0.27 * r) + sq.range(-2, 2);
          for (let c = 0; c < 2; c++) { const a = w * (0.3 + 0.42 * c + sq.range(-0.05, 0.05)) - b * 0.02; if (r === 0 && da >= 0 && Math.abs(a - da) < 5) continue;
            if (sq.chance(0.88)) handS.trapWin(paintS, p, a, b, 2.25 * sq.range(0.85, 1.15), seed + 20 + r * 7 + c * 3.1, 0.3); }
          await ctx.yield(); }
        handS.windowOn(paintS, p, w * p.apex * 0.8 + w * 0.1, body + (p.hTop - body) * 0.42, 2.1, seed + 60, 'kite');   // a chalk kite in the black of each gable
        if (f & 1) handS.fan(paintS, p, w * sq.range(0.2, 0.8), 2, 1.3 + sq.range(-0.4, 0.4), 13, 0, seed + 70, 3, 5);
        emitSkin(skinS, p); edgeOf(p); ragsOn(p, 2, sq, 1.5, -1, 0.3, 0.9);
        if (f === 0) { const A = p.at(w * p.apex, p.hTop - 1).addScaledVector(p.n, -0.3), M = A.clone().addScaledVector(p.V, 8).addScaledVector(p.U, 2), B = M.clone().addScaledVector(p.V, 6).addScaledVector(p.U, -3.2);
          board(A, M, p.U, p.n, 1.2, 0.14, 0.03, 1); board(M, B, p.U, p.n, 0.9, 0.14, 0.03, 1); }           // the bent finial board
        await ctx.yield(); }
    }
    { // the north row: house fronts 35 to 50 m tall facing the square, the sea of ridges behind them
      let x = -24 - sq.range(0, 4), i = 0;
      while (x > -150) { const w = sq.range(14, 21), gy = groundY(x, 568), hTop = sq.range(56, 72) - gy + 1.5, kn = sq.range(0.22, 0.36), tl = sq.range(0.12, 0.3) * sq.sign(), yaw = -Math.PI / 2 + sq.range(-0.22, 0.22), roll = sq.sign() * sq.range(0.09, 0.14), cx = x - w / 2;
        const p = makePanel({ O: [cx - Math.sin(yaw) * w / 2, gy - 1.5 - Math.abs(w * Math.sin(roll)), 568 + sq.range(-4, 4) - Math.cos(yaw) * w / 2], side: 1, yaw, lean: sq.range(0.06, 0.12), roll, w, hL: hTop * (1 - kn * (1 + tl)), hR: hTop * (1 - kn * (1 - tl)), hTop,
          apex: sq.chance(0.5) ? sq.range(0.1, 0.34) : sq.range(0.66, 0.9), xl: sq.range(-0.3, 1.2), xr: sq.range(-0.3, 1.2), br: 0, nu: 2 * Math.max(1, Math.round(w / 4.2)), nv: 2 * Math.max(2, Math.min(6, Math.round(hTop / 9))), step: 0, phase: sq() });
        await handS.house(paintS, p, 9300 + i * 13.1, { s: 2, roof: 0.8, light: 0.45, doors: 0.75, rows: 2, kites: 1 });
        emitSkin(skinS, p); edgeOf(p); if (sq.chance(0.5)) ragsOn(p, 1, sq, 1.2); x -= w * 0.97 + sq.range(-0.5, 1); i++; await ctx.yield(); }
    }
    { // the square's floor cloth: the road to the tower door, the shaft, wedges with no source, spikes of black grass, each lamp's burst
      const gq = (z0, x0, z1, x1, w0, w1, g, seed) => paintOnto(paintS, grounds, pull(z0, x0, z1, x1, w0, w1, g, seed));
      const road = [[430, -17], [453, -60], [469, -38], [489, -93], [494.5, -117]], ex = 0.05;
      for (let j = 0; j + 1 < road.length; j++) { const [za, xa] = road[j], [zb, xb] = road[j + 1]; gq(za - (zb - za) * ex, xa - (xb - xa) * ex, zb + (zb - za) * ex, xb + (xb - xa) * ex, 4.4, 4.4, 1, 9400 + j * 7.3); }
      gq(489, -93, 532, -66, 4, 4, 1, 9431.3); gq(532, -66, 561, -98, 4, 3.2, 1, 9438.6); await ctx.yield();
      gq(490.5, -120.5, 458, -84, 5.8, 12.5, 2, 9440.5);                                                      // the shaft: it lies across the floor and runs on up the tower's face
      gq(440, -100, 517, -63, 10, 0.4, 0, 9442.5); gq(476, -142, 436, -112, 7.5, 0.3, 0, 9444.5); gq(556, -40, 520, -112, 6, 0.3, 0, 9446.5); await ctx.yield();
      gq(548, -134, 506, -146, 2.2, 6.5, 1, 9448.5); gq(446, -30, 478, -22, 2, 5.5, 1, 9450.5);
      for (const [lz, lx, k] of [[462, -39, 1.8], [452, -97, 1.7], [546, -72, 1.6]]) { const a0 = sq.range(0, 6.283);
        for (let j = 0; j < 6; j++) { const a = a0 + (j + sq.range(-0.25, 0.25)) / 6 * 6.283, l = sq.range(3.5, 8) * k; gq(lz + Math.cos(a) * 0.6, lx + Math.sin(a) * 0.6, lz + Math.cos(a) * l, lx + Math.sin(a) * l, sq.range(0.9, 1.4) * k, 0.04, 1, 9460 + lz + j * 1.7); }
        await ctx.yield(); }
      const nG = Math.round(70 * detail);
      for (let i = 0; i < nG; i++) { const z = sq.range(430, 560), x = sq.range(-148, -16), ng = sq.int(3, 6), a0 = sq.range(0, 6.283), g = sq.chance(0.75) ? 0 : 1;
        for (let j = 0; j < ng; j++) { const ga = a0 + (j / ng - 0.5) * sq.range(1, 1.8), gl = sq.range(1.4, 4.2), ca = Math.cos(ga), sa = Math.sin(ga);
          paintOnto(paintS, grounds, { space: 'zt', g, seed: 9500 + i * 3.1 + j, dir: [ca, sa], pts: [[z - sa * 0.16, x + ca * 0.16], [z + sa * 0.16, x - ca * 0.16], [z + ca * gl, x + sa * gl]] }); }
        if (i % 10 === 9) await ctx.yield(); }
      // thorn trees on the square (their boards are placed with the rest of the flora), each with a painted shadow pointing its own way
      for (let i = 0; i < 16; i++) { let x, z, ok = false; for (let t = 0; t < 8 && !ok; t++) { x = sq.range(-146, -18); z = sq.range(434, 558); ok = Math.hypot(x - TOWER.x, z - TOWER.z) > 20 && path.nearestXZ(x, z).dist > 9; }
        const s = sq.range(1.3, 2.3), a = sq.range(0, 6.283), l = sq.range(7, 15) * s * 0.6, da = Math.cos(a), db = Math.sin(a); sqTrees.push([x, z, s]);
        paintOnto(paintS, grounds, { space: 'zt', g: 0, seed: 9700 + i * 3.1, dir: [da, db], pts: [[z - db * 0.5 * s, x + da * 0.5 * s], [z + db * 0.5 * s, x - da * 0.5 * s], [z + da * l, x + db * l]] }); }
      await ctx.yield();
      // slot tracks across the floor for the cloaked cut-outs
      const tk = (x0, z0, x1, z1, k) => sqTracks.push({ A: new THREE.Vector3(x0, groundY(x0, z0) + 0.15, z0), B: new THREE.Vector3(x1, groundY(x1, z1) + 0.15, z1), M: null, km: 0.5, s0: sq(), rate: sq.range(0.8, 1.8) * sq.sign(), k, flip: sq.sign() });
      tk(-30, 446, -92, 478, 2.4); tk(-104, 470, -62, 520, 2.4); tk(-50, 486, -108, 492, 2.2); tk(-140, 452, -112, 482, 2.2); tk(-40, 552, -120, 546, 2.4); tk(-70, 500, -44, 536, 2.2); tk(-136, 530, -100, 556, 2.2);
    }
    await ctx.yield();

    // ---- THE ROOFS: a sea of knife ridges, each a flat standing in the ground cloth, parted by the streets, the lane and the cleft ----
    const ridges = [], nRidge = Math.round(340 * Math.min(1, 0.7 + 0.3 * detail)), _q = new THREE.Vector3();
    const u76 = 0.75, catC = path.pointAt(u76, new THREE.Vector3()), catT = path.tangentAt(u76, new THREE.Vector3()), catH = new THREE.Vector3(catT.x, 0, catT.z).normalize(), catL = new THREE.Vector3(catH.z, 0, -catH.x);
    const catSpot = catC.clone().addScaledVector(catH, 9.5).addScaledVector(catL, 6.5);          // where the cat stands at u 0.76: 6.5 m to starboard, a little ahead
    for (let tries = 0; ridges.length < nRidge && tries < 6000; tries++) {
      if (tries % 8 === 7) await ctx.yield();
      const x = rng.range(-250, 250), z = rng.range(318, 742), w = rng.range(12, 24), top = rng.range(55, 75), yawR = rng.range(-0.6, 0.6), kn = rng.range(0.3, 0.5), tl = rng.range(0.12, 0.3) * rng.sign();
      const lean = rng.range(0.05, 0.15), roll = rng.sign() * rng.range(0.09, 0.16), apex = rng.chance(0.5) ? rng.range(0.1, 0.34) : rng.range(0.66, 0.9), ph = rng();
      if (z < 532 && Math.abs(x) < STREET.hw(z) + 13 + (x < 0 ? Math.max(0, STREET.bay(z)) : 0) + w * 0.4) continue;      // the canyon
      if (x > -172 && x < -8 && z > 402 && z < 582) continue;                                                               // the square behind the wall, its west side and its north row
      if (z >= 520 && Math.abs(x) < 12 + w * 0.45) continue;                                                              // the cleft and the stair street
      if (z > 672 && Math.abs(x) < 34) continue;                                                                          // the square and the exit flat
      if (Math.hypot(x - catSpot.x, z - catSpot.z) < 26) continue;
      let ok = true; for (const r of ridges) if (Math.abs(r.x - x) + Math.abs(r.z - z) < 15) { ok = false; break; }
      if (!ok) continue;
      const gy = groundY(x, z), sink = z > 560 ? (STAIR.top - stairY(z)) * 0.8 : 0, hTop = top - sink - gy + 1.5, yaw = -Math.PI / 2 + yawR;
      const p = makePanel({ O: [x - Math.sin(yaw) * w / 2, gy - 1.5 - Math.abs(w * Math.sin(roll)), z - Math.cos(yaw) * w / 2], side: 1, yaw, lean, roll, w, hL: hTop * (1 - kn * (1 + tl)), hR: hTop * (1 - kn * (1 - tl)), hTop, apex,
        xl: 0.4, xr: 0.4, br: 0, nu: 2, nv: 4, step: path.nearestXZ(x, z).dist > 135 ? 1 : 0, phase: ph });
      for (const [a, b] of [[0, 0.6], [0.5, 0.6], [1, 0.6], [apex, 1], [0, 0.85], [1, 0.85]]) { p.at(a * w, b * hTop, _q); if (!pathClear(_q.x, _q.y, _q.z, 9)) { ok = false; break; } }
      if (!ok) continue;
      for (let o = 5; o < p.v.length; o += STR) p.v[o] *= 3;                 // a 6 by 12 m bay of cloth bellies further than a small one
      p.x = x; p.z = z; ridges.push(p);
    }
    await ctx.yield();
    // (the scattered knife ridges of the first build are not laid any more: their draws are still taken, so the seed's layout of everything after them is unchanged)
    const RG = null; ragQuiet = true;
    for (let i = 0; i < ridges.length; i++) {
      const p = ridges[i], seed = 3000 + i * 13.1, near = !p.step, body = Math.min(p.hL, p.hR);
      hand.contour(RG, p, seed, near ? 1.3 : 2.2);
      const gl = rng.chance(near ? 0.55 : 0.3), roofed = hr.chance(near ? 0.72 : 0.6) && (!near || (i % 5) < 3);
      if (near && hr.chance(0.3)) hand.wallLight(RG, p, seed);
      if (roofed) hand.roofOn(RG, p, seed); else if (gl || near) hand.gableLight(RG, p, seed);
      const nw = near ? rng.int(1, 3) : 1;
      for (let j = 0; j < nw; j++) { const wa = p.w * rng.range(0.25, 0.75), wb = body * rng.range(0.5, 0.92), ws = (near ? 1.5 : 2.3) * rng.range(0.8, 1.25);
        if (!near) hand.trapWin(RG, p, wa, Math.min(wb, body - 5), ws * 1.3, seed + 10 + j * 3.3, 0, 0);
        else if ((j & 1) === 0) hand.trapWin(RG, p, wa, Math.min(wb, body - 5), ws * 1.25, seed + 10 + j * 3.3, 0.6); else hand.windowOn(RG, p, wa, wb, ws, seed + 10 + j * 3.3); }
      if (near) { const gb = body + (p.hTop - body) * 0.3, ga = p.w * (0.3 + 0.4 * p.apex); if (i & 1) handS.trapWin(RG, p, ga, gb, 1.9, seed + 77, 0, roofed ? 1 : 1); else handS.windowOn(RG, p, ga, gb, 1.9, seed + 77, 'kite'); }
      if (p.step) { if (ragRng.chance(0.6 * detail)) ragsOn(p, 1, ragRng, 1.7, 0.42); } else ragsOn(p, ragRng.int(3, 5), ragRng, 1.7, -1, 0.6, 0.97, 0.35, 0.95);         // the roofs' offcuts flap along the ridge, across our way
      if (rng.chance(0.3) || (near && hr.chance(0.7))) {                     // a bent chimney board on the shoulder
        const lf = rng.chance(0.5), A = p.at(p.w * (lf ? 0.14 : 0.86), (lf ? p.hL : p.hR) * 0.96).addScaledVector(p.n, -0.25), h = rng.range(3.5, 7), kx = rng.sign() * rng.range(0.6, 1.4);
        const M = A.clone().addScaledVector(p.V, h * 0.6).addScaledVector(p.U, kx), B = M.clone().addScaledVector(p.V, h * 0.5).addScaledVector(p.U, -kx * 1.3), g = p.step ? 0.42 : 0.03;
      }
      if (i % 12 === 11) await ctx.yield();
    }
    ragQuiet = false;
    await ctx.yield();

    // ---- THE ROOFS, as the film builds them: FEW, BIG, PLAIN. Whole crooked houses, each a painted gable front with a steep black roof
    //      behind it, a bent chimney and one or two lit windows, standing in rows that step down the hill beside the stair street, with
    //      quiet floor cloth between them so every house parts from its neighbour as a silhouette. (The scattered ridges are gone.) ----
    const rf = ownRng(((ctx.seed | 0) || 1) * 7919 + 907), handN = makeHand(rf, V.cut, detail, () => ctx.yield(), rf);
    const _n3 = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
    // a roof, two side walls, a back wall and a chimney behind any gable front p: d = depth of the house, far = painted distance (grey on chalk)
    const roofBehind = (p, d, rr, far = 0, chim = 1) => {
      const gR = far ? 0.45 : 0.03, gW = far ? 0.9 : 0.42, gW2 = far ? 0.84 : 0.35;
      const bk = new THREE.Vector3(-p.n.x, 0, -p.n.z).normalize(), ol = p.outline, A = ol[3], L = ol[4], R = ol[2], fw = 1.3;
      const ext = (S, k) => { const dx = S[0] - A[0], dy = S[1] - A[1], l = Math.hypot(dx, dy) || 1; return [S[0] + dx / l * k, S[1] + dy / l * k]; };
      const eL = ext(L, 2), eR = ext(R, 2);
      const FA = p.at(A[0], A[1] + 0.4).addScaledVector(p.n, fw), FL = p.at(eL[0], eL[1]).addScaledVector(p.n, fw), FR = p.at(eR[0], eR[1]).addScaledVector(p.n, fw);
      const sh = rr.range(-0.14, 0.14) * p.w, dr = rr.range(0.02, 0.14) * d;                     // the ridge runs out of true and sags to the rear
      const RA = FA.clone().addScaledVector(bk, d + fw).addScaledVector(p.U, sh); RA.y -= dr;
      const RL = FL.clone().addScaledVector(bk, d * rr.range(0.9, 1.06) + fw).addScaledVector(p.U, sh * 0.4); RL.y -= dr * 0.5;
      const RR = FR.clone().addScaledVector(bk, d * rr.range(0.9, 1.06) + fw).addScaledVector(p.U, sh * 0.4); RR.y -= dr * 0.5;
      const lf = rr.chance(0.5), FX = lf ? FL : FR, RX = lf ? RL : RR, lit = rr(), gP = far ? 0.92 : 0.62;   // one slope black, the other pale: a folded flat's two faces differ only by their paint
      bquad(FA, RA, RL, FL, lf ? gP : gR); bquad(FA, FR, RR, RA, lf ? gR : gP);
      { _e1.subVectors(RA, FA); _e2.subVectors(FX, FA); _n3.crossVectors(_e1, _e2).normalize(); if (_n3.y < 0) _n3.negate(); _n3.multiplyScalar(0.14);
        bquad(FX.clone().add(_n3), RX.clone().add(_n3), RX.clone().lerp(RA, 0.07).add(_n3), FX.clone().lerp(FA, 0.05).add(_n3), gR); }              // light brushed on one slope: a tapering wedge along the ridge, fitting no source
      if (lit < 0.66) { const FY = lf ? FR : FL, RY = lf ? RR : RL;                              // on the black slope
        _e1.subVectors(RA, FA); _e2.subVectors(FY, FA); _n3.crossVectors(_e1, _e2).normalize(); if (_n3.y < 0) _n3.negate(); _n3.multiplyScalar(0.14);
        const t0 = rr.range(0.04, 0.12), t1 = rr.range(0.34, 0.62);
        bquad(FA.clone().add(_n3), RA.clone().add(_n3), RA.clone().lerp(RY, t1).add(_n3), FA.clone().lerp(FY, t0).add(_n3), far ? 1 : lit < 0.16 ? 2 : 1); }
      const dn = new THREE.Vector3(0, -0.9, 0);                                                 // the roof's front edge: chalk on the wrong side, black on the other
      bquad(FA, FL, FL.clone().add(dn), FA.clone().add(dn), lf ? gR : 1); bquad(FA, FR, FR.clone().add(dn), FA.clone().add(dn), lf ? 1 : gR);
      const b0 = p.at(0, -3), b1 = p.at(p.w, -3), tL = p.at(L[0], L[1]), tR = p.at(R[0], R[1]);                 // the walls
      const rb0 = b0.clone().addScaledVector(bk, d), rb1 = b1.clone().addScaledVector(bk, d), rtL = tL.clone().addScaledVector(bk, d), rtR = tR.clone().addScaledVector(bk, d);
      rb0.y = Math.min(rb0.y, groundY(rb0.x, rb0.z) - 2); rb1.y = Math.min(rb1.y, groundY(rb1.x, rb1.z) - 2); rtL.y -= dr * 0.5; rtR.y -= dr * 0.5;
      bquad(b0, tL, rtL, rb0, gW); bquad(b1, tR, rtR, rb1, gW2); bquad(rb0, rb1, rtR, rtL, gW); bquad(rtL, rtR, RA, RA, gW);
      if (chim) { const t = rr.range(0.3, 0.7), s = rr.range(0.3, 0.6), cl = rr.chance(0.5), SX0 = cl ? FL : FR, SX1 = cl ? RL : RR;       // a bent chimney board
        const C = FA.clone().lerp(RA, t).lerp(SX0.clone().lerp(SX1, t), s), h = rr.range(7, 11), kx = rr.sign() * rr.range(0.8, 1.7);
        const M = C.clone().add(new THREE.Vector3(0, h * 0.6, 0)).addScaledVector(p.U, kx), B = M.clone().add(new THREE.Vector3(0, h * 0.45, 0)).addScaledVector(p.U, -kx * 1.4);
        C.y -= 2.5; board(C, M, p.U, bk, 1.9, 1.3, gR, far ? 0.9 : 1); board(M, B, p.U, bk, 1.5, 1.3, gR, far ? 0.9 : 1); }
      if (!far) { const nr = rr.int(3, 4);                                                      // offcuts of cloth tacked under the eaves: they stir always and stream in a gust
        for (let j = 0; j < nr; j++) { const ev = j & 1, t = rr.range(0.06, 0.94), A0 = (ev ? FL : FR).clone().lerp(ev ? RL : RR, t); A0.y -= 0.5;
          rag(A0, new THREE.Vector3(rr.range(-0.25, 0.25), -1, rr.range(-0.25, 0.25)).normalize(), bk, p.U.clone().multiplyScalar(ev ? -0.9 : 0.9).addScaledVector(bk, 0.4), rr.range(6, 10), rr.range(2.2, 3.4), rr.pick([0.03, 1, 0.42, 1, 0.03]), rr()); } }
      return Math.max(FA.y, RA.y);
    };
    // one whole house standing in the ground cloth, its gable front turned to face down the course (toward the eye flying up it)
    const houseAt = async (x, z, w, d, eave, top, yawR, seed, far = 0) => {
      const gy = groundY(x, z), yaw = -Math.PI / 2 + yawR, roll = rf.sign() * rf.range(0.05, 0.11), tl = rf.range(0.1, 0.3) * rf.sign(), apex = rf.range(0.36, 0.64), lean = rf.range(0.03, 0.1), ph = rf();
      const p = makePanel({ O: [x - Math.sin(yaw) * w / 2, gy - 1.5 - Math.abs(w * Math.sin(roll)), z - Math.cos(yaw) * w / 2], side: 1, yaw, lean, roll, w, hL: eave * (1 + tl * 0.4), hR: eave * (1 - tl * 0.4), hTop: top, apex,
        xl: 0.5, xr: 0.5, br: 0, nu: 2 * Math.max(2, Math.round(w / 4.5)), nv: 2 * Math.max(2, Math.min(6, Math.round(top / 9))), step: far, phase: ph });
      let ok = true; for (const [a, b] of [[0, 0.6], [1, 0.6], [apex, 1.25], [0.5, 0.9]]) { p.at(a * w, b * top, _q); if (!pathClear(_q.x, _q.y, _q.z, 10)) ok = false; }
      p.at(apex * w, top, _q).addScaledVector(p.n, -d); if (!pathClear(_q.x, _q.y, _q.z, 10)) ok = false;
      const nwin = w > 20 ? 3 : 2, ws = Math.min(2.5, w / 9), litAt = Math.floor(rf() * nwin), doorOn = rf.chance(0.45), kite = rf.chance(0.7), spare = rf.chance(0.35);
      if (!ok) return null;
      handN.contour(paintR, p, seed, 1.7); await ctx.yield();
      let da = -99; if (doorOn) { da = handN.houseDoor(paintR, p, seed, ws * 0.85); await ctx.yield(); }
      for (let c = 0; c < nwin; c++) { const a = w * (c + 0.5 + rf.range(-0.12, 0.12)) / nwin, b = eave * (da > -50 && Math.abs(a - da) < 3.2 * ws ? 0.74 : rf.range(0.46, 0.62));
        if (c !== litAt && spare && nwin > 2) continue;                                          // (some fronts carry only their lit window: plain)
        handN.trapWin(paintR, p, a, b, ws * rf.range(0.85, 1.1), seed + 20 + c * 5.3, c === litAt ? 0.8 : 0.2, c === litAt ? 2 : 1); await ctx.yield(); }
      if (kite) handN.windowOn(paintR, p, w * (0.2 + 0.6 * apex), eave + (top - eave) * 0.33, ws * 0.8, seed + 60, 'kite');
      emitSkin(skin, p); edgeOf(p, far ? 0.6 : 0.2); roofBehind(p, d, rf, far);
      return p;
    };
    const hillHouses = [], hillAt = {};
    { let i = 0;                                                               // three rows of three on each side of the stair street, stepping down the hill,
      for (const side of [-1, 1]) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = side * (56 + c * 33 + rf.range(-4, 4)), z = 590 + r * 36 + (c & 1) * 13 + rf.range(-4, 4), w = rf.range(17, 23), d = rf.range(17, 23), eave = rf.range(14, 19), top = eave + rf.range(15, 21);
        const p = await houseAt(x, z, w, d, eave, top, rf.range(-0.22, 0.22) - side * 0.12, 3000 + (i++) * 13.1); if (p) { hillHouses.push(p); hillAt[side + ',' + r + ',' + c] = p.at(p.w * p.apex, p.hTop + 0.6); } await ctx.yield(); }
      for (const [x, z, yo = 0] of [[-52, 716], [-88, 712], [50, 714], [86, 718],                          // four on the square beside the exit flat,
        [54, 560], [88, 571], [122, 558], [152, 574],                                               // a row along the brow of the hill east of the cleft,
        [44, 452], [80, 468], [118, 446], [58, 392], [98, 400], [150, 500], [112, 524],
        [-62, 158, -0.4], [-98, 190, -0.4], [-72, 222, -0.3], [-118, 140, -0.5]]) {                    // and four beyond the kink tower, turned to face down the lower street          // and the quarter east of the canyon, seen over its low houses
        const w = rf.range(17, 24), d = rf.range(17, 23), eave = rf.range(15, 21), top = eave + rf.range(16, 22);
        const p = await houseAt(x + rf.range(-3, 3), z + rf.range(-3, 3), w, d, eave, top, yo + rf.range(-0.25, 0.25), 3000 + (i++) * 13.1); if (p) hillHouses.push(p); await ctx.yield(); }
    }
    // lines of cloth knives strung from gable to gable along the rows and across the stair street: they stir always and stream in a gust
    const bunting = (A, B, n, sag, k0) => { if (!A || !B) return; const dir = B.clone().sub(A).normalize(), fl = new THREE.Vector3(-dir.z, 0, dir.x);
        const pt = (t) => { const q = A.clone().lerp(B, t); q.y -= sag * 4 * t * (1 - t); return q; };
        for (let j = 1; j < n; j++) { const q = pt(j / n); if (!pathClear(q.x, q.y - 2.5, q.z, 9)) return; }
        let last = A.clone();
        for (let j = 1; j <= n; j++) { const q = pt(j / n); ribbon(last, q, 0.05, 0.03); last = q;
          if (j < n) rag(q, new THREE.Vector3(rf.range(-0.15, 0.15), -1, rf.range(-0.15, 0.15)).normalize(), dir, fl, rf.range(4, 6.2), rf.range(2.4, 3.4), [2, 0.03, 1, 0.03][(j + k0) & 3], rf()); } };
    { for (const side of [-1, 1]) for (let r = 0; r < 3; r++) { bunting(hillAt[side + ',' + r + ',0'], hillAt[side + ',' + r + ',1'], 6, 3, r); bunting(hillAt[side + ',' + r + ',1'], hillAt[side + ',' + r + ',2'], 6, 3.5, r + side + 1);
        if (r < 2) bunting(hillAt[side + ',' + r + ',' + (r & 1)], hillAt[side + ',' + (r + 1) + ',' + (r & 1)], 6, 3, r + 2); }
      for (let r = 0; r < 3; r++) bunting(hillAt['-1,' + r + ',0'], hillAt['1,' + r + ',0'], 13, 9, r);
    }
    await ctx.yield();

    // ---- THE SIDE LANE: at z 270..314 the starboard wall of the canyon is open (the hero stands those flats out of sight), and over the
    //      black wedge the eye turns into a lane that runs east: house fronts down both sides, a tall front closing it with one lit window,
    //      house-tops stacked behind against the backcloth, a chalk road and a shaft of light on the cloth, cut-outs crossing ----
    { let i = 0; const LN = [[40, 263, Math.PI, 16, 18], [72, 259, Math.PI, 17, 20], [38, 321, 0, 17, 19], [70, 325, 0, 15, 22],
        [98, 292, Math.PI / 2, 26, 26], [128, 266, Math.PI / 2, 35, 28], [126, 320, Math.PI / 2, 39, 26], [160, 295, Math.PI / 2, 52, 30]];
      for (const [x, z, yo, eave, tp] of LN) { await houseAt(x, z, rf.range(19, 23), rf.range(17, 21), eave, eave + tp, yo + rf.range(-0.14, 0.14), 4300 + (i++) * 13.1, 0); await ctx.yield(); }
      const gl = grounds.filter((g) => g.bbZT[2] > 240 && g.bbZT[0] < 345), gq = (z0, x0, z1, x1, w0, w1, g, seed) => paintOnto(paint, gl, pull(z0, x0, z1, x1, w0, w1, g, seed));
      gq(289, 9, 300, 46, 5, 4.6, 1, 4401.5); await ctx.yield(); gq(300, 46, 283, 82, 4.6, 4.2, 1, 4403.5); await ctx.yield(); gq(283, 82, 291, 96, 4.2, 3.6, 1, 4405.5); await ctx.yield();   // the chalk road runs in from the canyon's
      gq(294, 90, 277, 26, 2.2, 8, 2, 4407.5); await ctx.yield();                                    // a shaft of painted light from the end house's foot, down the lane toward us
      gq(318, 30, 286, 66, 7, 0.3, 0, 4409.5); await ctx.yield(); gq(268, 88, 300, 62, 5, 0.3, 0, 4411.5); await ctx.yield();        // wedges with no source
      for (const [x0, z0, x1, z1, k, st] of [[30, 280, 58, 306, 2.3], [52, 274, 96, 300, 2.2], [86, 308, 60, 284, 2.2], [cxL(104) - 10, 104, cxL(128) - 5.5, 128, 1.9, 1], [cxL(136) + 10, 136, cxL(112) + 6, 112, 1.9, 1]])
        sqTracks.push({ A: new THREE.Vector3(x0, (st ? STREET.floorY(x0 - cxL(z0), z0) : groundY(x0, z0)) + 0.15, z0), B: new THREE.Vector3(x1, (st ? STREET.floorY(x1 - cxL(z1), z1) : groundY(x1, z1)) + 0.15, z1), M: null, km: 0.5, s0: rf(), rate: rf.range(0.8, 1.6) * rf.sign(), k, flip: rf.sign() });
    }
    await ctx.yield();

    // ---- THE STAIR STREET's walls: tall flats on both sides of the drop, gables leaning in ----
    const flanks = [], flankAp = {};
    for (const side of [-1, 1]) { let z = (side < 0 ? 560 : 538) + rng.range(0, 4), zig = rng.sign(), i = 0;
      while (z < 700) {
        const w = rng.range(12, 18); zig = -zig; const yaw = zig * rng.range(0.08, 0.22), gy = stairY(z + w) - 1.5, py = path.nearestXZ(0, z + w * 0.5).y;
        const hTop = Math.min(66, Math.max(30, py - gy + rng.range(5, 15))), knife = rng.range(0.18, 0.34) * hTop, tilt = rng.range(0.12, 0.3) * rng.sign(), roll = rng.sign() * rng.range(0.09, 0.15);
        const zO = side > 0 ? z : z + w * Math.cos(yaw), x = side * (STAIR.hw(z) + rng.range(2.4, 4)), FK = 0.6;
        const p = makePanel({ O: [x, gy - Math.abs(w * Math.sin(roll)), zO], side, yaw, lean: rng.range(0.07, 0.11), roll, w, hL: (hTop - knife * (1 + tilt)) * FK, hR: (hTop - knife * (1 - tilt)) * FK, hTop: hTop * FK,
          apex: rng.chance(0.5) ? rng.range(0.06, 0.3) : rng.range(0.7, 0.94), xl: rng.range(-0.3, 1.2), xr: rng.range(-0.3, 1.2), br: 0, nu: 2 * Math.max(1, Math.round(w / 4.2)), nv: 2 * Math.max(2, Math.min(7, Math.round(hTop / 9))), step: 0, phase: rng() });
        const open = z + w * 0.5 < 580;                                      // the cleft's mouth stays open where we come in over the square: these are drawn from the seed but not built
        ragQuiet = open; ragsOn(p, ragRng.int(2, 3), ragRng, 1.2); ragQuiet = false; if (!open) flanks.push(p);
        await hand.house(open ? null : paint, p, 4000 + side * 500 + i * 13.1, { s: 1.8, roof: 0.45, light: 0.45, doors: 0.3, rows: 2, kites: Math.max(1, Math.round(rng.range(2, 4.4) * dens * 0.5)) });
        if (!open) { emitSkin(skin, p); edgeOf(p); roofBehind(p, rf.range(15, 20), rf, 0); const ap = p.at(p.w * p.apex, p.hTop + 0.5); if (flankAp[side] && (i & 1)) bunting(flankAp[side], ap, 5, 2.5, i); flankAp[side] = ap; } z += w * Math.cos(yaw) + rng.range(-0.6, 1); i++;
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- the town beyond the square: the three raked rows of great far flats of the first build are drawn from the seed and not laid;
    //      the far town is rows of whole houses painted grey on chalk (below), so no horizon shows bare ----
    { let i = 0;
      for (const [zr, t0, t1] of [[736, -12, 12], [782, 16, 40], [842, 44, 72]]) { let x = -300 + rng.range(0, 20);
        while (x < 300) { const w = rng.range(30, 52), hTop = rng.range(t0, t1) - SQ0, kn = rng.range(0.22, 0.4), tl = rng.range(0.12, 0.3) * rng.sign(), yaw = -Math.PI / 2 + rng.range(-0.3, 0.3), roll = rng.sign() * rng.range(0.09, 0.14);
          if (zr < 760 && Math.abs(x + w / 2) < 30) { x += w; continue; }
          const p = makePanel({ O: [x + w, SQ0 - 2 - w * 0.15, zr + rng.range(-8, 8)], side: 1, yaw, lean: rng.range(0.04, 0.1), roll, w, hL: hTop * (1 - kn * (1 + tl)), hR: hTop * (1 - kn * (1 - tl)), hTop, apex: rng.chance(0.5) ? rng.range(0.1, 0.34) : rng.range(0.66, 0.9), xl: 0.5, xr: 0.5, br: 0, nu: 2, nv: 4, step: 1, phase: rng() });
          hand.contour(RG, p, 4500 + i * 13.1, 3); hand.roofOn(RG, p, 4500 + i * 13.1);
          const nw = rng.int(1, 3); for (let j = 0; j < nw; j++) hand.windowOn(RG, p, w * rng.range(0.25, 0.75), hTop * rng.range(0.35, 0.6), 3.2 * rng.range(0.8, 1.3), 4510 + i * 13.1 + j * 3.3);
          const body = Math.min(p.hL, p.hR), nt = Math.max(2, Math.round(w / 12)); for (let j = 0; j < nt; j++) hand.trapWin(RG, p, w * (j + 0.5 + hr.range(-0.2, 0.2)) / nt, body * hr.range(0.3, 0.75), hr.range(3.2, 4.6), 4520 + i * 13.1 + j * 3.3, 0.4, 0);
          if (hr.chance(0.5)) hand.pab(RG, p, w * hr.range(0.1, 0.9), -1, w * hr.range(0.1, 0.9), body * hr.range(0.6, 1), hr.range(5, 9), 0.2, 0, 4530 + i * 13.1);
          x += w * rng.range(0.8, 1.05); i++;
          if (i % 6 === 5) await ctx.yield(); } } }
    await ctx.yield();

    { let i = 0; const E = Math.PI * 1.5, Wd = Math.PI * 0.5;                                // the far town: rows beyond the square, down both sides of the hill, west of the square and east of the canyon
      const spots = [];
      for (const [zr, x0, dx] of [[748, -172, 38], [800, -196, 43], [856, -214, 47]]) for (let x = x0; x < -x0 + 1; x += dx) if (zr > 760 || Math.abs(x) > 34) spots.push([x, zr, 0]);
      for (const sd of [-1, 1]) for (const zr of [588, 634, 680, 724]) { spots.push([sd * 162, zr + (sd > 0 ? 9 : 0), 0]); spots.push([sd * 204, zr + 22, 0]); }
      for (const [x, z] of [[-196, 432], [-204, 478], [-198, 524], [-206, 570], [-240, 404], [-246, 452], [-242, 500], [-250, 548], [-190, 372], [-232, 348]]) spots.push([x, z, E]);
      for (const [x, z] of [[176, 380], [182, 440], [190, 506], [226, 410], [232, 474], [222, 548]]) spots.push([x, z, 0]);
      for (const [x, z, yw] of spots) { const w = rf.range(18, 26), d = rf.range(18, 24), eave = rf.range(15, 22), top = eave + rf.range(16, 24);
        await houseAt(x + rf.range(-5, 5), z + rf.range(-5, 5), w, d, eave, top, yw + rf.range(-0.25, 0.25), 4600 + (i++) * 13.1, 1); await ctx.yield(); } }
    await ctx.yield();

    // ---- THE EXIT FLAT: a house front lying back square to the drop, a black kite door in it, at the tip of a chalk shaft ----
    const vF = new THREE.Vector3(0, Math.cos(DIVE), Math.sin(DIVE)), SQ = stairY(700) - 0.4;      // up the flat; the square's cloth
    const exitC = EXIT.clone().addScaledVector(dv, 0.7), exitO = exitC.clone().add(new THREE.Vector3(19, 0, 0)).addScaledVector(vF, -25);
    const exitFlat = makePanel({ O: [exitO.x, exitO.y, exitO.z], side: 1, yaw: -Math.PI / 2, lean: -DIVE, roll: -0.1, w: 38, hL: 44, hR: 50, hTop: 60, apex: 0.34, xl: 1, xr: 0.6, br: 0, nu: 8, nv: 10, step: 0, phase: rng() });
    const unfold = (X, Y, Z) => { const d = (Y - SQ) / vF.y; return [Z + d * (1 - vF.z), X]; };  // the flat hinged down onto the square: one (z, T) sheet with the ground
    reT(exitFlat, unfold);
    const kiteAB = [_q.copy(exitC).sub(exitO).dot(exitFlat.U), _q.dot(exitFlat.V)], zK = unfold(exitC.x, exitC.y, exitC.z)[0];
    const SH = { z0: 550, x0: 7.5, z1: zK - 3, x1: 0, w0: 9.5, w1: 5 };                          // the shaft that pours down the stairs into the door
    const shX = (z) => SH.x0 + (SH.x1 - SH.x0) * (z - SH.z0) / (SH.z1 - SH.z0), shW = (z) => SH.w0 + (SH.w1 - SH.w0) * (z - SH.z0) / (SH.z1 - SH.z0);
    const exitSheet = grounds.filter((g) => g.bbZT[2] > 530 && g.bbZT[0] < 760).concat([exitFlat]);
    paintOnto(paint, exitSheet, pull(SH.z0, SH.x0, SH.z1, SH.x1, SH.w0, SH.w1, 2, 5001.5));
    paintOnto(paint, exitSheet, pull(684, -15, zK + 14, -9, 5, 0.02, 0, 5003.5));                 // a black wedge from the square up the flat
    { const [a, b] = kiteAB, c = Math.cos(0.21), s = Math.sin(0.21), R = (x, y) => [a + x * c - y * s, b + x * s + y * c];   // the kite, 23 m tall, leaning 12 degrees
      paintOnto(paint, [exitFlat], { space: 'ab', g: 0, seed: 5005.5, dir: [0.3, 1], pts: [R(0, -19), R(11, 0), R(0, 12), R(-11, 0)] });
      await ctx.yield();
      hand.contour(paint, exitFlat, 5010, 1.6);
      hand.windowOn(paint, exitFlat, 5, 34, 1.6, 5020); hand.windowOn(paint, exitFlat, 33, 39, 1.4, 5023); hand.windowOn(paint, exitFlat, 32.5, 14, 1.3, 5026); hand.windowOn(paint, exitFlat, 5.5, 12, 1.2, 5029);
      hand.fan(paint, exitFlat, a + 9, b - 13, 1.9, 9, 0, 5031, 3, 4); await ctx.yield();
      const nr = 10; for (let j = 0; j < nr; j++) { const th = (j + hr.range(0.2, 0.8)) / nr * Math.PI * 2, cc = Math.cos(th), sn = Math.sin(th);     // painted light bursting from the door, as from the kite of the canyon
        if (sn < -0.75) continue;                                              // (the shaft pours in from below)
        const r0 = 1.22 / (Math.abs(cc) / 11 + (sn > 0 ? sn / 12 : -sn / 19)) + 1, len = hr.range(8, 17), P0 = R(cc * r0, sn * r0), P1 = R(cc * (r0 + len), sn * (r0 + len));
        hand.pab(paint, exitFlat, P0[0], P0[1], P1[0], P1[1], hr.range(2.4, 4.2), 0.05, 1, 5040 + j * 1.7); if (j % 3 === 2) await ctx.yield(); } }
    emitSkin(skin, exitFlat); edgeOf(exitFlat); ragsOn(exitFlat, 3, ragRng, 1.3);
    await ctx.yield();

    // ---- THE STAIRS: 90 real treads, each a tilted wedge of board, the shaft painted down them, ribbon rails ----
    { const nT = 90, run = (STAIR.z1 - STAIR.z0) / nT, riseT = STAIR.fall / nT, P = (x, y, z) => new THREE.Vector3(x, y, z);
      for (let i = 0; i < nT; i++) {
        const z0 = STAIR.z0 + i * run, z1 = z0 + run + 0.05, y = STAIR.top - i * riseT, hwS = STAIR.hw(z0) + 5, t = (i & 1 ? 1 : -1) * rng.range(0.12, 0.34), g = (i & 1 ? 0.36 : 0.47) + rng.range(-0.03, 0.03);
        const yAt = (x) => y + t * x / hwS, xs = [-hwS, Math.max(-hwS, shX(z0) - shW(z0) / 2), Math.min(hwS, shX(z0) + shW(z0) / 2), hwS], xe = [-hwS, Math.max(-hwS, shX(z1) - shW(z1) / 2), Math.min(hwS, shX(z1) + shW(z1) / 2), hwS];
        for (let k = 0; k < 3; k++) bquad(P(xs[k], yAt(xs[k]), z0), P(xe[k], yAt(xe[k]), z1), P(xe[k + 1], yAt(xe[k + 1]), z1), P(xs[k + 1], yAt(xs[k + 1]), z0), k === 1 ? 2 : g);
        // the riser, and a knife of black brushed where it meets the tread below
        bquad(P(-hwS, yAt(-hwS), z1), P(hwS, yAt(hwS), z1), P(hwS, y - riseT - 0.5, z1), P(-hwS, y - riseT - 0.5, z1), 0.05);
        const sd = i & 1 ? 1 : -1, d0 = rng.range(0.7, 1.05);
        bquad(P(-sd * hwS, yAt(-sd * hwS) + 0.03, z0), P(sd * hwS, yAt(sd * hwS) + 0.03, z0), P(sd * hwS, yAt(sd * hwS) + 0.03, z0 + 0.06), P(-sd * hwS, yAt(-sd * hwS) + 0.03, z0 + d0), 0.03);
      }
      for (const side of [-1, 1]) { let last = null;                          // rails on leaning posts
        for (let i = 0; i <= nT; i += 6) { const z = STAIR.z0 + i * run + 0.6, x = side * (STAIR.hw(z) - 0.6), base = P(x, STAIR.top - i * riseT - 0.4, z), top = P(x + rng.range(-0.5, 0.5), base.y + 2.6, z + rng.range(-0.6, 0.6));
          board(base, top, P(0, 0, 1), P(1, 0, 0), 0.22, 0.07, 0.03, 1); if (last) { ribbon(last, top, 0.05, 0.03); ribbon(last.clone().lerp(base, 0.45), top.clone().lerp(base, 0.4), 0.04, 0.03); } last = top; } }
    }
    await ctx.yield();

    { const laneSide = hero.panels.filter((p) => p.lane).concat(hero.floors), hwz = STREET.hw, Tc = -(hwz(479) + 15);
      paintOnto(paint, laneSide, pull(429, -1, 452, -(hwz(452) + 16), 5, 9, 0, 6200.3));                               // a black wedge from the road up the wall,
      paintOnto(paint, laneSide, pull(450, -(hwz(450) + 21), 503, -(hwz(503) + 7), 11.5, 0.6, 0, 6200.5));            // then down along it the way the lane runs
      paintOnto(paint, laneSide, pull(497, -1, 487, -(hwz(487) + 30), 1.2, 4.2, 1, 6201.5));                         // a shaft
      { const zc = 476, T0 = -(hwz(zc) + 24); paintOnto(paint, laneSide, { space: 'zt', g: 0, seed: 6202.5, dir: [0.25, 1], pts: [[zc - 1, T0 + 7.5], [zc + 4.2, T0], [zc + 1, T0 - 4.5], [zc - 4.2, T0]] }); }   // a black kite over it
      await ctx.yield(); }
    // ---- paint on the ground cloth: the lane's own chalk road, and wedges and shafts lying among the roofs ----
    { let z = 372, T = -22, sgn = -1, i = 0;
      while (z < 540) { const z1 = z + rng.range(22, 34), T1 = sgn < 0 ? rng.range(-55, -48) : rng.range(-24, -17);
        paintOnto(paint, grounds, pull(z - 1.5, T - (T1 - T) * 0.05, z1 + 1.5, T1 + (T1 - T) * 0.05, 3.6, 3.6, 1, 6000 + (i++) * 7.3)); z = z1; T = T1; sgn = -sgn; }
      paintOnto(paint, grounds, pull(430 + rng.range(-6, 6), -18, 462, -56, 7.5, 0.02, 0, 6050.5));
      await ctx.yield();
      for (let j = 0; j < 16; j++) {
        const x = rng.range(-190, 190), zz = rng.range(300, 660), ang = rng.range(0, Math.PI * 2), len = rng.range(40, 95), w = rng.range(4, 10), g = rng.chance(0.5) ? 0 : 1;
        if (Math.abs(x) < 26 && zz < 545) continue;
        paintOnto(paint, grounds, pull(zz, x, zz + Math.cos(ang) * len, x + Math.sin(ang) * len, w, g ? w * 0.3 : 0.02, g, 6100 + j * 5.1));
        if (j % 4 === 3) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- the cat's ridge: a flat square across the course, its knife running down toward us, ending 6.5 m to starboard ----
    const polyGeo = (polys) => { const fp = [], fg = [], fi = [];           // flat cut-out pieces: [points, pigment, z] fanned from their centroids
      for (const [ptsP, g, z = 0] of polys) { const b = fg.length; let cx = 0, cy = 0; for (const q of ptsP) { cx += q[0]; cy += q[1]; } fp.push(cx / ptsP.length, cy / ptsP.length, z); fg.push(g);
        for (const q of ptsP) { fp.push(q[0], q[1], z); fg.push(g); } for (let i = 0; i < ptsP.length; i++) fi.push(b, b + 1 + i, b + 1 + (i + 1) % ptsP.length); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(fg, 1)); geo.setIndex(fi); return geo; };
    const cat = new THREE.Group(), catParts = {}, catA = new THREE.Vector3(), catB = new THREE.Vector3(), catBasis = new THREE.Matrix4();
    { const w = 16, gy = groundY(catSpot.x, catSpot.z) - 1.5, hR = catC.y - 2.3 - gy, hTop = hR + 3.6, yaw = Math.atan2(-catH.z, catH.x);
      const O = catSpot.clone().addScaledVector(catL, w - 2);
      const p = makePanel({ O: [O.x, gy, O.z], side: 1, yaw, lean: 0.03, roll: 0, w, hL: hR - 7, hR, hTop, apex: 0.08, xl: 0.5, xr: 0.8, br: 0, nu: 4, nv: 6, step: 0, phase: rng() });
      handS.wallLight(paintS, p, 7020); handS.contour(paintS, p, 7000, 1.6); handS.houseDoor(paintS, p, 7030, 2, w * 0.2); handS.trapWin(paintS, p, w * 0.7, 8, 2, 7040, 0.6); handS.trapWin(paintS, p, w * 0.32, hR * 0.5, 2.1, 7043, 0); handS.trapWin(paintS, p, w * 0.68, hR * 0.58, 1.9, 7046, 0.5); handS.windowOn(paintS, p, w * 0.5, hR * 0.84, 1.7, 7010);
      emitSkin(skin, p); edgeOf(p);
      const e0 = [w * 0.08 + 1.5, hTop], e1 = [w + 0.8, hR], at = (t, out) => p.at(e0[0] + (e1[0] - e0[0]) * t, e0[1] + (e1[1] - e0[1]) * t, out).addScaledVector(p.n, 0.14);
      at(0.05, catA); at(0.86, catB);
      const ex = catB.clone().sub(catA).normalize(), ey = new THREE.Vector3().crossVectors(p.n, ex).normalize(); catBasis.makeBasis(ex, ey, p.n.clone());
      // the flat cat: black board, a chalk edge under the belly (the wrong side), no eye; legs and tail are hinged pieces
      const K = 1.62, S = (pp) => pp.map((q) => [q[0] * K, q[1] * K]);
      const part = (name, polys, px, py) => { const m = new THREE.Mesh(polyGeo(polys.map(([pp, g, z]) => [S(pp), g, z])), matBoard); m.position.set(px * K, py * K, 0); m.frustumCulled = false; cat.add(m); catParts[name] = m; };
      part('body', [[[[-1.0, 0.1], [-0.92, 0.42], [-0.4, 0.58], [0.2, 0.52], [0.72, 0.42], [0.95, 0.22], [0.8, -0.04], [0.2, -0.02], [-0.5, -0.05]], 0.02, 0],
        [[[-0.5, -0.05], [0.2, -0.02], [0.8, -0.04], [0.74, 0.04], [0.2, 0.06], [-0.48, 0.03]], 1, 0.012],
        [[[0.72, 0.2], [0.9, 0.62], [0.99, 0.42], [1.14, 0.68], [1.27, 0.3], [1.2, 0.1], [0.95, 0.02]], 0.02, 0.006]], 0, 0.66);
      const leg = [[[-0.1, 0.06], [0.1, 0.06], [0.05, -0.68], [-0.07, -0.68]], 0.02, 0], legE = [[[0.05, 0.02], [0.1, 0.06], [0.05, -0.68], [0.01, -0.68]], 1, 0.012];
      part('l0', [leg], -0.72, 0.7); part('l1', [leg, legE], -0.56, 0.7); part('l2', [leg], 0.5, 0.68); part('l3', [leg, legE], 0.68, 0.68);
      part('tail', [[[[0.04, -0.08], [-0.02, 0.1], [-0.62, 0.44], [-0.58, 0.28]], 0.02, 0], [[[-0.62, 0.44], [-0.58, 0.28], [-0.44, 1.02], [-0.56, 1.05]], 0.02, 0]], -0.93, 0.98);
      cat.matrixAutoUpdate = false; cat.frustumCulled = false; town.add(cat);
    }

    // ---- FLORA: thorn trees (or bare forked poles), profile boards with one chalk edge on the wrong side; each painted shadow points its own way ----
    const treeGeo = (() => { const tr = rng.fork('tree'), polys = [];
      const limb = (x0, y0, ang, len, w0, w1, depth) => {
        const dx = Math.sin(ang), dy = Math.cos(ang), nx = dy, ny = -dx, x1 = x0 + dx * len, y1 = y0 + dy * len;
        polys.push([[[x0 - nx * w0 / 2, y0 - ny * w0 / 2], [x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2]], 0.02, 0]);
        polys.push([[[x0 + nx * w0 * 0.2, y0 + ny * w0 * 0.2], [x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 + nx * w1 * 0.15, y1 + ny * w1 * 0.15]], 1, 0.015]);
        if (cast === 'thorn') { const n = depth ? 4 : 2; for (let i = 0; i < n; i++) { const t = (i + tr.range(0.3, 0.9)) / n, sd = i & 1 ? 1 : -1, a = ang + sd * tr.range(0.7, 1.3), l = tr.range(1.1, 2.6) * (depth ? 1 : 0.8), bx = x0 + dx * len * t, by = y0 + dy * len * t;
          polys.push([[[bx - dx * 0.22, by - dy * 0.22], [bx + dx * 0.22, by + dy * 0.22], [bx + Math.sin(a) * l, by + Math.cos(a) * l]], 0.02, 0]); } }
        if (depth < 2) { const k = cast === 'thorn' ? 2 + (depth === 0 ? 1 : 0) : 2; for (let i = 0; i < k; i++) limb(x1, y1, ang + (i - (k - 1) / 2) * tr.range(0.55, 0.9) + tr.range(-0.12, 0.12), len * tr.range(0.5, 0.72), w1, w1 * 0.45, depth + (cast === 'thorn' ? 1 : 2)); }
        else polys.push([[[x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 + dx * 1.6, y1 + dy * 1.6]], 0.02, 0]);
      };
      limb(0, -0.6, 0.3, cast === 'thorn' ? 5.2 : 7, 0.8, 0.5, 0); return polyGeo(polys); })();
    const nTree0 = Math.round(120 * dens * Math.min(1, 0.6 + 0.4 * detail)), nTree = nTree0 + sqTrees.length, trees = new THREE.InstancedMesh(treeGeo, matBoard, nTree), tSway = new Float32Array(nTree * 2);
    { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pp = new THREE.Vector3();
      for (let i = 0; i < nTree0; i++) {
        const zone = i % 8 < 2 ? 0 : i % 8 < 4 ? 1 : 2, side = rng.sign(); let x, y, z, T, s = rng.range(0.5, 1.5);
        if (zone === 0) { z = i % 16 < 2 ? rng.range(-70, -34) : rng.range(26, 146) * 0.89; T = side * (STREET.hw(Math.max(0, z)) - rng.range(0.3, 2.6)); x = cxL(z) + T; y = STREET.floorY(T, z); }
        else if (zone === 1) { z = rng.range(158, 276); T = side * (STREET.hw(z) - rng.range(0.2, 1)); x = T; y = STREET.floorY(T, z); s = rng.range(0.45, 0.8); if (side < 0 && z < 204) { T = -T; x = T; y = STREET.floorY(T, z); } }
        else { z = rng.range(596, 698); T = side * (STAIR.hw(Math.min(z, 680)) + rng.range(-1.5, 1.5)) * (z > 684 ? rng.range(0.5, 1.1) : 1); x = T; y = stairY(z); s = rng.range(0.6, 1.3); }
        const flip = rng.sign(), lean = rng.range(-0.12, 0.26) * (zone === 2 ? 1 : -side * flip);
        e.set(rng.range(-0.06, 0.06), rng.range(-0.45, 0.45), lean); q.setFromEuler(e); sc.set(s * flip, s, s); pp.set(x, y - 0.2, z); m4.compose(pp, q, sc); trees.setMatrixAt(i, m4);
        tSway[i * 2] = rng(); tSway[i * 2 + 1] = 0.035;
        if (zone < 2) { const pan = zone ? hero.floors : lowFloors, a = rng.range(0, Math.PI * 2), l = rng.range(5, 11) * s, da = Math.cos(a), db = Math.sin(a);     // its painted shadow, and spikes of black grass
          paintOnto(paint, pan, { space: 'zt', g: 0, seed: 8000 + i * 3.1, dir: [da, db], pts: [[z - db * 0.45 * s, T + da * 0.45 * s], [z + db * 0.45 * s, T - da * 0.45 * s], [z + da * l, T + db * l]] });
          const ng = rng.int(3, 6); for (let j = 0; j < ng; j++) { const ga = rng.range(0, Math.PI * 2), gl = rng.range(0.7, 1.9), gz = z + rng.range(-1.6, 1.6), gT = T + rng.range(-1.2, 1.2), ca = Math.cos(ga), sa = Math.sin(ga);
            paintOnto(paint, pan, { space: 'zt', g: 0, seed: 8500 + i * 3.1 + j, dir: [ca, sa], pts: [[gz - sa * 0.09, gT + ca * 0.09], [gz + sa * 0.09, gT - ca * 0.09], [gz + ca * gl, gT + sa * gl]] }); } }
        if (i % 10 === 9) await ctx.yield();
      }
      for (let j = 0; j < sqTrees.length; j++) { const [x, z, s] = sqTrees[j], i = nTree0 + j, flip = sq.sign();
        e.set(sq.range(-0.06, 0.06), sq.range(-1.4, 1.4), sq.range(-0.22, 0.22)); q.setFromEuler(e); sc.set(s * flip, s, s); pp.set(x, groundY(x, z) - 0.2, z); m4.compose(pp, q, sc); trees.setMatrixAt(i, m4); tSway[i * 2] = sq(); tSway[i * 2 + 1] = 0.035; }
      treeGeo.setAttribute('aSway', new THREE.InstancedBufferAttribute(tSway, 2)); trees.frustumCulled = false; town.add(trees); }
    { // spikes of black brush and flecks of chalk on the floor cloth beside the course, so the cloth under us is never bare
      const n = Math.round(110 * detail);
      for (let i = 0; i < n; i++) {
        const z = -60 + (i + rng()) * 370 / n, T = rng.sign() * rng.range(2.2, 9.5), pan = z < 150 ? lowFloors : hero.floors, ng = rng.int(3, 6), a0 = rng.range(0, Math.PI * 2), g = rng.chance(0.75) ? 0 : 1;
        for (let j = 0; j < ng; j++) { const ga = a0 + (j / ng - 0.5) * rng.range(1, 1.8), gl = rng.range(0.8, 2.4), ca = Math.cos(ga), sa = Math.sin(ga);
          paintOnto(paint, pan, { space: 'zt', g, seed: 8800 + i * 3.1 + j, dir: [ca, sa], pts: [[z - sa * 0.1, T + ca * 0.1], [z + sa * 0.1, T - ca * 0.1], [z + ca * gl, T + sa * gl]] }); }
        if (i % 12 === 11) await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- seven more crooked footbridges (the canyon has seven): one over the lower street, three over the back lane, three over the stairs ----
    const myBridges = [], _Y = new THREE.Vector3(0, 1, 0), _dn = new THREE.Vector3(0, -1, 0);
    const bridge = (A, B, k) => {
      for (let t = 0; t <= 1; t += 0.125) { _q.lerpVectors(A, B, t); if (!pathClear(_q.x, _q.y, _q.z, 7.5)) { A.y += 5; B.y += 5; break; } }
      const km = rng.range(0.3, 0.7), M = A.clone().lerp(B, km); M.z += rng.sign() * rng.range(1.5, 4) * k; M.y += rng.range(-1.5, 1.5) * k;
      const wd = 1.6 * k, rail = 1.3 * k;
      for (const [P, Q] of [[A, M], [M, B]]) {
        const d = Q.clone().sub(P).normalize(), W = new THREE.Vector3().crossVectors(_Y, d).normalize(), D = new THREE.Vector3().crossVectors(d, W).normalize();
        board(P.clone().addScaledVector(d, -0.3), Q.clone().addScaledVector(d, 0.3), W, D, wd, 0.22 * k, 0.03, 1);
        const np = Math.max(2, Math.round(P.distanceTo(Q) / 3.4)); let last = null;
        for (let j = 0; j <= np; j++) { const base = P.clone().lerp(Q, j / np).addScaledVector(W, wd * 0.5), top = base.clone().addScaledVector(D, rail).addScaledVector(d, rng.range(-0.3, 0.3) * rail);
          board(base.clone().addScaledVector(D, -0.3), top, d, W, 0.14 * k, 0.05, 0.03); if (last) ribbon(last, top, 0.04, 0.03); last = top; }
        ribbon(P.clone().addScaledVector(W, -wd * 0.5).addScaledVector(D, rail * 0.9), Q.clone().addScaledVector(W, -wd * 0.5).addScaledVector(D, rail * 0.9), 0.04, 0.03);
        const nr = Math.max(1, Math.round(P.distanceTo(Q) / 5 * detail)), fl = new THREE.Vector3().crossVectors(d, _dn).normalize();
        for (let i = 0; i < nr; i++) rag(P.clone().lerp(Q, (i + rng.range(0.2, 0.8)) / nr).addScaledVector(_dn, 0.1), _dn.clone().addScaledVector(d, rng.range(-0.25, 0.25)).normalize(), d, fl, rng.range(2.6, 6) * k, rng.range(0.8, 1.6) * k, rng.chance(0.7) ? 0.03 : 0.42, rng());
      }
      myBridges.push({ A, M, B, km, k });
    };
    { const P = (x, y, z) => new THREE.Vector3(x, y, z), hwS = (z) => STAIR.hw(z) + 3.2;
      bridge(P(-10.5, fy(172) + 30, 172), P(STREET.hw(156) + 2, fy(156) + 24, 156), 1.25);
      bridge(P(-117, 74, 508), P(-88, 62, 566), 1.5); bridge(P(-138, 58, 497), P(-153, 47, 522), 1.3); bridge(P(-31, 47, 513), P(-14, 52, 498), 1.3);   // tower to the north row, tower to the west side, the cat's house to the wall
      bridge(P(-hwS(590), stairY(590) + 15, 590), P(hwS(590), stairY(590) + 18, 586), 1.5); bridge(P(-hwS(624), stairY(624) + 17, 622), P(hwS(624), stairY(624) + 14.5, 627), 1.5);
      bridge(P(-hwS(655), stairY(655) + 14, 657), P(hwS(655), stairY(655) + 17, 652), 1.5);
      bridge(P(-(STREET.hw(395) + STREET.bay(395) + 1), fy(395) + 19.5, 395), P(STREET.hw(389) + 1.5, fy(389) + 21.5, 389), 1.2);
      bridge(P(48, fy(270) + 15, 266), P(52, fy(316) + 18, 318), 1.4); }                            // (the last: across the mouth of the side lane, where the wall is open)
    await ctx.yield();

    // ---- FAUNA: cloaked cut-outs on slot tracks along the bridges and across the stairs, backs turned, rocking as they slide ----
    let stairFigs = null; const figTracks = [];
    if (figuresOn) {
      const geo = polyGeo([[[[-0.62, 0], [-0.2, 0.07], [0.15, 0], [0.66, 0.06], [0.44, 1.2], [0.3, 1.82], [-0.26, 1.86], [-0.44, 1.25]], 0.02, 0], [[[-0.17, 1.84], [0.2, 1.82], [0.25, 2.1], [0.04, 2.27], [-0.19, 2.12]], 0.02, 0],
        [[[-0.62, 0], [-0.5, 0.02], [-0.37, 1.25], [-0.44, 1.25]], 1, -0.015], [[[-0.62, 0], [-0.5, 0.02], [-0.37, 1.25], [-0.44, 1.25]], 1, 0.015]]);
      const nS = Math.max(8, Math.round(14 * dens)), n = nS + myBridges.length * 2 + sqTracks.length, sway = new Float32Array(n * 2);
      for (let i = 0; i < nS; i++) { const tread = 8 + Math.floor((i + rng()) * 78 / nS), z = STAIR.z0 + (tread + 0.5) * (STAIR.z1 - STAIR.z0) / 90, hwS = STAIR.hw(z) - 1.6, y = STAIR.top - tread * STAIR.fall / 90 - 0.25;
        figTracks.push({ A: new THREE.Vector3(-hwS, y, z), B: new THREE.Vector3(hwS, y, z), M: null, km: 0.5, s0: rng(), rate: rng.range(1.6, 3.4) * rng.sign(), k: rng.range(1.5, 2), flip: rng.sign() }); }
      for (let i = 0; i < myBridges.length * 2; i++) { const b = myBridges[i >> 1]; figTracks.push({ A: b.A, B: b.B, M: b.M, km: b.km, s0: rng(), rate: rng.range(1.2, 2.6) * rng.sign(), k: 1.35 * b.k, flip: rng.sign() }); }
      for (const t of sqTracks) figTracks.push(t);
      for (let i = 0; i < n; i++) { sway[i * 2] = rng(); sway[i * 2 + 1] = rng.range(0.06, 0.11); }
      geo.setAttribute('aSway', new THREE.InstancedBufferAttribute(sway, 2));
      stairFigs = new THREE.InstancedMesh(geo, matBoard, n); stairFigs.frustumCulled = false; town.add(stairFigs);
    }

    // ---- the backcloth's great splinters: spokes of grey and black distemper brushed up the tent to its peak, a burst with no sun in it ----
    { const tentR = (y) => (y < 200 ? 700 : Math.max(0, 700 * (320 - y) / 120)), tp = (th, y) => new THREE.Vector3(Math.sin(th) * tentR(y) * 0.972, y, STREET.zc + Math.cos(th) * tentR(y) * 0.972);
      const n = 15; let th = hr.range(0, 0.4);
      for (let j = 0; j < n; j++) { th += (6.283 / n) * hr.range(0.7, 1.3);
        const w = hr.range(0.1, 0.24) * 0.4, yb = hr.range(20, 120), yt = hr.range(296, 311), d1 = hr.range(-0.3, 0.3), d2 = hr.range(-0.35, 0.35), g = j % 6 === 0 ? 0.42 : 0.62;
        if (j % 3 !== 0) continue;                                             // (the backcloth is the one quiet, pale thing in every view: gables and the tower stand against it)
        let prev = null; const seg = (y, c, hw2) => { const A = tp(c - hw2, y), B = tp(c + hw2, y); if (prev) bquad(prev[0], A, B, prev[1], g); prev = [A, B]; };
        for (let k = 0; k <= 4; k++) { const t = k / 4; seg(yb + (200 - yb) * t, th + d1 * (1 - t), w * 0.5 * (0.02 + 0.98 * t)); }
        for (let k = 1; k <= 5; k++) { const t = k / 5; seg(200 + (yt - 200) * t, th + d2 * t, w * 0.5 * (1 - 0.6 * t) / Math.max(0.12, 1 - 0.9 * t * (yt - 200) / 120)); }
      }
      await ctx.yield(); }

    // ---- the meshes: one of cloth, one of ground cloth, one of paint, one of boards, one of ribbons ----
    const skinMesh = new THREE.Mesh(skin.geometry(), matCanvas); skinMesh.frustumCulled = false; town.add(skinMesh);
    await ctx.yield();
    const groundMesh = new THREE.Mesh(groundBuf.geometry(), matGround); groundMesh.frustumCulled = false; town.add(groundMesh);
    await ctx.yield();
    const paintMesh = new THREE.Mesh(paint.geometry(), matPaint); paintMesh.frustumCulled = false; paintMesh.renderOrder = 2; town.add(paintMesh);
    await ctx.yield();
    const skinMeshS = new THREE.Mesh(skinS.geometry(), matCanvas); skinMeshS.frustumCulled = false; town.add(skinMeshS);
    const paintMeshS = new THREE.Mesh(paintS.geometry(), matPaint); paintMeshS.frustumCulled = false; paintMeshS.renderOrder = 2; town.add(paintMeshS);
    await ctx.yield();
    const paintMeshR = new THREE.Mesh(paintR.geometry(), matPaint); paintMeshR.frustumCulled = false; paintMeshR.renderOrder = 2; town.add(paintMeshR);
    await ctx.yield();
    { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(bg, 1)); geo.setIndex(bi);
      const boards = new THREE.Mesh(geo, matBoard); boards.frustumCulled = false; town.add(boards);
      const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rgeo.setAttribute('aSide', new THREE.Float32BufferAttribute(rs, 4)); rgeo.setAttribute('aG', new THREE.Float32BufferAttribute(rg, 1)); rgeo.setIndex(ri);
      const ribbons = new THREE.Mesh(rgeo, matRibbon); ribbons.frustumCulled = false; town.add(ribbons); }
    await ctx.yield();

    { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); geo.setAttribute('aRag', new THREE.Float32BufferAttribute(ga, 4)); geo.setAttribute('aFlap', new THREE.Float32BufferAttribute(gn, 3)); geo.setAttribute('aG', new THREE.Float32BufferAttribute(gg, 1)); geo.setIndex(gi);
      const rags = new THREE.Mesh(geo, ragMaterial()); rags.frustumCulled = false; town.add(rags); }
    // chalk that the draught shakes off the flats: chips drifting up the course past the camera, everywhere, thicker in a hard draught
    const uCam = { value: new THREE.Vector3() };
    { const n = Math.round((gusts === 5 ? 2200 : gusts === 3 ? 1500 : 1100) * detail), pos = new Float32Array(n * 9), sd = new Float32Array(n * 12), fr = rng.fork('flakes');
      for (let i = 0; i < n; i++) { const a0 = fr.range(0, 6.283), s0 = fr(), s1 = fr(), s2 = fr(), s3 = fr();
        for (let c = 0; c < 3; c++) { const a = a0 + c * 2.094 + fr.range(-0.5, 0.5), r = c === 0 ? 1.5 : fr.range(0.5, 0.9), o = (i * 3 + c) * 3, q = (i * 3 + c) * 4;
          pos[o] = Math.cos(a) * r; pos[o + 1] = Math.sin(a) * r; sd[q] = s0; sd[q + 1] = s1; sd[q + 2] = s2; sd[q + 3] = s3; } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
      const drift = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uCam },
        vertexShader: STYLE_GLSL + /* glsl */`attribute vec4 aSeed; uniform vec3 uCam;
          void main(){
            vec3 box = vec3(44., 30., 70.);
            float ph = aSeed.w, sp = 5. + 6. * fract(ph * 7.3);
            vec3 w = aSeed.xyz * box + vec3(1.2 * sin(uTime * 0.7 + ph * 40.), -0.5 * uTime * (0.4 + fract(ph * 3.1)) + 0.6 * sin(uTime * 1.3 + ph * 20.), uTime * sp);
            vec3 c = uCam + mod(w - uCam, box) - 0.5 * box;
            vec4 mv = modelViewMatrix * vec4(c, 1.);
            float px = abs(mv.z) * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
            float s = max(0.08 + 0.15 * fract(ph * 13.7), 1.6 * px) * smoothstep(1.2, 3., abs(mv.z));
            float a1 = uTime * (3. + 5. * ph) + ph * 50., a2 = uTime * (2. + 3. * fract(ph * 5.3));
            vec3 q = vec3(position.x * cos(a1), position.y, position.x * sin(a1)); q.yz = vec2(q.y * cos(a2) - q.z * sin(a2), q.y * sin(a2) + q.z * cos(a2));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(c + q * s, 1.);
          }`,
        fragmentShader: STYLE_GLSL + `void main(){ gl_FragColor = vec4(distemper(1.), 1.); }` }));
      drift.frustumCulled = false; town.add(drift); }
    await ctx.yield();

    // ---- flight ----
    const size = new THREE.Vector2(), catPos = new THREE.Vector3(), catM = new THREE.Matrix4(), catS = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _sc = new THREE.Vector3(), _pp = new THREE.Vector3();
    const catPoi = catB.clone().lerp(catA, 0.12).add(new THREE.Vector3(0, 1.4, 0));
    const pace = (u) => 0.62 + 0.55 * ss(0.05, 0.17, u) - 0.45 * ss(0.495, 0.53, u) * (1 - ss(0.76, 0.82, u));   // slow in, linger across the square, round the tower and past the cat
    const setCat = (u, time) => {
      const s = ss(0.62, 0.762, u), on = u > 0.45 ? 1 : 0, walk = s > 0 && s < 1 ? 1 : 0, ph = u * 1500;
      catPos.lerpVectors(catA, catB, s); catS.set(on, on, on);
      catM.copy(catBasis).setPosition(catPos); cat.matrix.copy(catM).scale(catS); cat.matrixWorldNeedsUpdate = true;
      const arch = ss(0.758, 0.78, u);
      catParts.body.scale.set(1 - 0.08 * arch, 1 + 0.4 * arch + 0.04 * Math.sin(ph * 2) * walk, 1);
      catParts.l0.rotation.z = 0.5 * Math.sin(ph) * walk; catParts.l1.rotation.z = -0.5 * Math.sin(ph) * walk;
      catParts.l2.rotation.z = -0.5 * Math.sin(ph + 0.6) * walk; catParts.l3.rotation.z = 0.5 * Math.sin(ph + 0.6) * walk;
      catParts.tail.rotation.z = 0.28 * Math.sin(u * 700) + 0.16 * Math.sin(time * 2.3) - 0.5 * arch;
    };
    const _dd = new THREE.Vector3();
    const setFigs = (u) => {
      if (!stairFigs) return;
      for (let i = 0; i < figTracks.length; i++) { const t = figTracks[i]; let s = (t.s0 + u * t.rate) % 2; if (s < 0) s += 2; if (s > 1) s = 2 - s; s = 0.08 + 0.84 * s;
        if (!t.M) { _pp.lerpVectors(t.A, t.B, s); _dd.subVectors(t.B, t.A); }
        else if (s < t.km) { _pp.lerpVectors(t.A, t.M, s / t.km); _dd.subVectors(t.M, t.A); } else { _pp.lerpVectors(t.M, t.B, (s - t.km) / (1 - t.km)); _dd.subVectors(t.B, t.M); }
        if (t.M) _pp.y += 0.12 * t.k;
        _qq.setFromAxisAngle(_Y, Math.atan2(-_dd.z, _dd.x)); _sc.set(t.k * t.flip, t.k, t.k); _m4.compose(_pp, _qq, _sc); stairFigs.setMatrixAt(i, _m4); }
      stairFigs.instanceMatrix.version++;
    };
    setCat(0, 0); setFigs(0);
    const pois = [
      { at: new THREE.Vector3(KT.x + 3, 58, KT.z - 8), from: 0, to: 0.11, weight: 0.68 },                // the tower at the kink, whole, from the first frame
      { at: new THREE.Vector3(KT.x + 4, 40, KT.z - 10), from: 0.11, to: 0.2, weight: 0.6 },
      { at: new THREE.Vector3(GT.x - 2, 92, GT.z), from: 0.195, to: 0.3, weight: 0.62 },                 // up the canyon at the stair of bridges and the gables crossing over them               // its lit window and the shaft down its face as we pass it
      { at: new THREE.Vector3(70, fy(292) + 36, 296), from: 0.3, to: 0.365, weight: 0.42 },               // into the side lane, as we cross the wedge
      { at: new THREE.Vector3(GT.x - 14, 70, GT.z), from: 0.385, to: 0.47, weight: 0.6 },            // the kite ahead while we climb to it
      { at: new THREE.Vector3(TOWER.x, 80, TOWER.z), from: 0.5, to: 0.58, weight: 0.6 },                // the tower across the square, whole
      { at: new THREE.Vector3(TOWER.x, 52, TOWER.z), from: 0.58, to: 0.64, weight: 0.6 },               // its door, windows and the shaft up its face
      { at: new THREE.Vector3(79, 98, 617), from: 0.655, to: 0.72, weight: 0.75 },                   // the cat on its ridge, and over the roofs the burst on the backcloth, seen askew from the square                    // the cat's house across the square's north end
      { at: catPoi, from: 0.72, to: 0.765, weight: 0.5 },                                               // the cat's house and the cat on its ridge
      { at: EXIT.clone(), from: 0.765, to: 0.84, weight: 0.75 },                                        // down the cleft over the house-tops, not up at the cloth
    ];
    if (rare && hero.anchors.loosePanel) { const lp = toC(hero.anchors.loosePanel); pois.push({ at: new THREE.Vector3(lp[0] - 4, lp[1] + 34, lp[2] + 5), from: 0.16, to: 0.27, weight: 0.5 }); }   // the flat that comes loose
    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.3, far: 2400, lookAhead: 22, sway: 0.5, bank: 0.9, nearThrough: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#EEE7D4', glow: 0.3, tilt: true, revealDistance: 440, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0.25, grain: 0.05 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        ctx.renderer.getDrawingBufferSize(size); U.uViewH.value = size.y;
        hero.setProgress(u); hero.update(dt, time, camera);
        uCam.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(U.uToCourse.value);
        setCat(u, time); setFigs(u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
