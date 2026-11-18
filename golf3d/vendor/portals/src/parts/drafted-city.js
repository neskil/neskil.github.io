// THE DRAFTED CITY: hero set piece "The Spire and the Compass".
//
// A 600 m stepped tower that is ruled into existence floor by floor as a blueprint line drawing, and a
// 300 m cream draughtsman's compass that walks the sheet, swings a leg over the hoist, lifts off and
// scribes the red exit ring beyond the crown. Everything is edges: one instanced ribbon-line system
// (camera-facing quads, minimum pixel width, dashes by arc length, travelling bright tip), paper-coloured
// fill boxes that only write depth and carry the 45 degree hatching, and a second "hidden edge" pass of
// the structural lines (reversed depth test, dashed, 20 %).
//
// SIZE     radius ~330 m (plaza 130 m radius, compass stands up to 200 m east), height 600 m (compass hinge
//          reaches ~840 m when it scribes the ring). Origin = centre of the Spire's base, +Y up, front +Z
//          (the camera arrives from +Z, i.e. "north" in the brief is -Z).
// COST     ~40-50k triangles, 4 draw calls (fills, lines, hidden lines, paper sheet), build ~40 ms, no lights.
// LIGHTING none: all materials are unlit ShaderMaterials writing linear HDR (white line 1.6, construction
//          0.5, cream 1.4, red 2.0) and they respect scene.fog. Wants a Prussian-blue background, tight low
//          bloom (threshold ~1, small radius) and fog toward #1E5A94.
// OPTS     palette    7 hex strings (brief order: paper dark, paper mid, paper pale, line white,
//                     construction blue, instrument cream, red)
//          progress   initial progress 0..1 (default 0.63, the "one image"); the world calls setProgress(u)
//          sheet      true: include the hero's own 1.8 km paper disc (grid, grain, plaza); pass false when
//                     the world has its own ground
//          hoistLine  true: draw the red dash-dot hoist centre-line along anchors.flyThrough
//          cast       'gothic': piers, pinnacles and flying buttresses ruled as arcs on every tier; 'drums': a round
//                     tower of stacked drums (ruled arcs, radial columns, same tiers and clearances); default ziggurat
//          night      true: window squares fill in on the finished faces a second behind the draw-front
// PROGRESS hero.setProgress(u) with the world's path u (0..1, seconds = 40 u in the brief). Everything
//          scripted hangs on it: compass walk 0.04-0.40, lift and swing over the cage 0.44-0.635 (leg passes
//          the north face at u 0.62), rise 0.635-0.815, needle on the centre-cross 0.815, lead once round
//          0.825-0.90 (ring drawn with it; the compass leans up and to the right of the ring and its two knee
//          joints open 37 m, uBow, so both legs stand apart and meet far above it), finials 0.885-0.95 (the
//          draw-front must have closed the crown by then), compass lifted off the path axis 0.955-1. The plaza
//          (kerbs, paving rings, trees) is ruled 0.17-0.27. hero.update() adds a slow sway of the hinge.
//          The tower's draw-front follows the brief's cage height minus 14 m (anchors.drawFrontAt(u));
//          override it with hero.setDrawFront(y) (metres, local) to slave it to the real camera height,
//          or setDrawFront(null) to return to the built-in curve. Only derrick slewing uses time.
//          hero.setGhost(k) multiplies the brightness of the ghost construction lines (default 1).
// ANCHORS  (local space)
//          portalSeat   { position, normal, radius: 7 }: centre of the red ring (y 578, 52 m from the axis
//                       on the +X+Z diagonal); normal = direction of travel through it (60 degrees up).
//          flyThrough   ordered Vector3 list: the hoist spiral (2/3 turn anticlockwise, 30 m off the
//                       faces, y 30 to 445) then the straight 154 m at 60 degrees to the ring. >= 11 m
//                       clear of all tower lines; the compass leg passes ~35 m above it at u 0.62.
//          hoistStart   first point of flyThrough (where the trolley catches the hoist line).
//          viewpoints   entry (the ghost Spire from the avenue), climb (the one image), crown (nose up).
//          compassStand needle point of the compass's last stance on the paper; scribed: centre+radius of
//                       the red circle it leaves on the sheet (make it a plaza); plazaRadius; ringCentre.
//          tiers        [{y0,y1,half}] of the Spire for placing terraces / shadows; drawFrontAt(u).
// STYLE    see the hand-off note at the bottom of this file.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#0B2A4A', '#12406E', '#1E5A94', '#F3F7FB', '#9FC2E0', '#F1E6C8', '#E63A2E'];
const FLOOR = 3.8, LEG = 300;
// line ranks (weight class) and styles
const HEAVY = 0, MED = 1, FAINT = 2, SOLID = 0, DASH = 1, DASHDOT = 2;
// colour indices
const WHITE = 0, CONS = 1, CREAM = 2, RED = 3, DETAIL = 4;
// groups: which parameter draws the segment on / which transform it takes
const G_F = 0, G_U = 1, G_LEGA = 2, G_LEGB = 3, G_HEAD = 4, G_DERRICK = 5, G_FRONT = 6, G_STUB = 7;
const KNEE = 46 + (289 - 46) * 2 / 16;      // the legs' knee joint sits on the third rung (see uBow)
const NEVER = 1e9;

// Collects line segments. 14 floats each: A(3) B(3) S(width, style+4*rank, colour, group) T(b0, b1, fadeAt, extra)
function makeLines() {
  const hid = [], vis = [];
  const L = {
    hid, vis, w: [0.24, 0.13, 0.08], col: WHITE, rank: HEAVY, style: SOLID, grp: G_F, hidden: false, extra: 0, fade: NEVER,
    set(o) { Object.assign(L, o); return L; },
    seg(ax, ay, az, bx, by, bz, b0 = -1, b1 = -0.5) {
      (L.hidden ? hid : vis).push(ax, ay, az, bx, by, bz, L.w[L.rank] * (L.wScale || 1), L.style + 4 * L.rank, L.col, L.grp, b0, b1, L.fade, L.extra);
    },
    // polyline through pts [[x,y,z],...], drawn progressively from b0 to b1
    poly(pts, b0 = -1, b1 = -0.5, closed = false) {
      const n = pts.length - (closed ? 0 : 1);
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        L.seg(a[0], a[1], a[2], b[0], b[1], b[2], lerp(b0, b1, i / n), lerp(b0, b1, (i + 1) / n));
      }
    },
    // circle of radius r about c in the plane spanned by unit vectors e1, e2
    circle(c, e1, e2, r, n, b0 = -1, b1 = -0.5, a0 = 0, a1 = Math.PI * 2) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = lerp(a0, a1, i / n), ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        pts.push([c[0] + e1[0] * ca + e2[0] * sa, c[1] + e1[1] * ca + e2[1] * sa, c[2] + e1[2] * ca + e2[2] * sa]);
      }
      L.poly(pts, b0, b1);
    },
  };
  return L;
}

// The brief's cage height at world progress u, and the draw-front 14 m beneath it.
function cageY(u) {
  const t = u * 40;
  if (t < 17) return 10 + 20 * smoothstep(14, 17, t);
  if (t < 34.5) return lerp(30, 445, (t - 17) / 17.5);
  return lerp(445, 578, clamp((t - 34.5) / 5.5, 0, 1));
}
function drawFrontAt(u) {
  const t = u * 40;
  if (t < 16.4) return -5;
  if (t < 36) return cageY(u) - 14;
  return lerp(cageY(0.9) - 14, 592, smoothstep(0, 1, (t - 36) / 2.4) * 0.5 + 0.5 * clamp((t - 36) / 2.4, 0, 1));
}

function tierSpec(rng) {
  const j = (a) => Math.round((a + rng.range(-2, 2)) * 0.5) * 2;
  const ys = [0, 120, 240, 360, 450, 520, 560];
  const half = [48, j(39), j(31), 24, j(15), 12];
  return half.map((h, i) => ({ y0: ys[i], y1: ys[i + 1], half: h }));
}

// Faces anticlockwise from above: +Z (front), +X, -Z, -X. Point on a face = N*half + T*s.
const FN = [[0, 1], [1, 0], [0, -1], [-1, 0]], FT = [[1, 0], [0, -1], [-1, 0], [0, 1]];
const sqFace = (f, h, s) => [FN[f][0] * h + FT[f][0] * s, FN[f][1] * h + FT[f][1] * s], onFace = sqFace;
// the 'drums' cast: the same four "faces", each bent into a quarter of a circle of radius h
const roundFace = (f, h, s) => {
  const a = clamp(s / Math.max(h, 1e-6), -1.5, 1.5) * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
  return [(FN[f][0] * c + FT[f][0] * sn) * h, (FN[f][1] * c + FT[f][1] * sn) * h];
};
const roundTan = (f, h, s) => { const a = clamp(s / Math.max(h, 1e-6), -1.5, 1.5) * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a); return [-FN[f][0] * sn + FT[f][0] * c, -FN[f][1] * sn + FT[f][1] * c]; };

function buildSpire(L, rng, tiers, V) {
  const always = [-100, -99];
  const onFace = V.round ? roundFace : sqFace, tanAt = V.round ? roundTan : (f) => FT[f];
  // one side of a horizontal outline at height y: a straight rule, or (drums) a ruled arc
  const side = (f, h, s0, s1, y, b0, b1) => {
    const n = V.round ? 6 : 1;
    for (let i = 0; i < n; i++) {
      const p = onFace(f, h, lerp(s0, s1, i / n)), q = onFace(f, h, lerp(s0, s1, (i + 1) / n));
      L.seg(p[0], y, p[1], q[0], y, q[1], lerp(b0, b1, i / n), lerp(b0, b1, (i + 1) / n));
    }
  };
  tiers.forEach((t, ti) => {
    const h = t.half, nF = Math.max(1, Math.round((t.y1 - t.y0) / FLOOR)), fh = (t.y1 - t.y0) / nF;
    const nb = Math.max(3, Math.round((2 * h) / V.bay)), bw = (2 * h) / nb, bwA = bw * (V.round ? 0.785 : 1);
    t.nF = nF; t.fh = fh; t.nb = nb;
    // ghost construction: corner lines and the tier's top outline, there before anything is drawn
    // (medium weight at double width: above the draw-front the tower is still an idea, and the idea must read)
    L.set({ grp: G_F, rank: MED, col: CONS, style: SOLID, hidden: false, fade: t.y0, wScale: 2 });
    for (let f = 0; f < 4; f++) {
      const [x, z] = onFace(f, h, h), [x2, z2] = onFace(f, h, -h);
      L.seg(x, t.y0, z, x, t.y1 + 3, z, ...always);
      L.set({ fade: t.y1 - 12, style: DASH }); side(f, h, -h, h, t.y1, ...always); L.set({ fade: t.y0, style: SOLID });
    }
    L.set({ wScale: 1 });
    // heavy corner columns and medium bay columns, pulled up with the front (clipped in y by the shader)
    L.set({ rank: HEAVY, col: WHITE, hidden: true, fade: NEVER });
    for (let f = 0; f < 4; f++) { const [x, z] = onFace(f, h, h); L.seg(x, t.y0 - 0.6, z, x, t.y1 + 0.7, z, t.y0, t.y1); }
    L.set({ rank: MED });
    for (let f = 0; f < 4; f++) for (let i = 1; i < nb; i++) {
      const s = -h + i * bw, [x, z] = onFace(f, h, s);
      const major = i % V.pier === 0;
      L.set({ rank: major ? MED : FAINT, col: major ? WHITE : DETAIL, hidden: major, extra: major ? bwA * V.pier : bwA });
      L.seg(x, t.y0, z, x, t.y1, z, t.y0 + 1.5, t.y1 + 1.5);
      if (major && V.paired) { const [xb, zb] = onFace(f, h, s + 0.9); L.set({ hidden: false, extra: 1.6 }); L.seg(xb, t.y0, zb, xb, t.y1, zb, t.y0 + 2.5, t.y1 + 2.5); }
    }
    L.set({ extra: 0 });
    // floors: every V.belt-th is a slow heavy outline ruled round the tower, the rest arrive as quick lines
    for (let k = 0; k <= nF; k++) {
      const y = t.y0 + k * fh, heavy = k % V.belt === 0 || k === nF, os = heavy ? 0.9 : 0.45;
      L.set({ rank: heavy ? HEAVY : MED, col: heavy ? WHITE : DETAIL, hidden: heavy, style: SOLID, extra: heavy ? -fh * V.belt : -fh, wScale: heavy ? 1.25 : 1 });
      for (let f = 0; f < 4; f++) {
        if (heavy) side(f, h, -h - os, h + os, y, y + f * 3.2, y + f * 3.2 + 3.6);
        else side(f, h, -h - os, h + os, y, y + 0.6 + f * 0.5, y + 2.6 + f * 0.5);
      }
      L.set({ wScale: 1, extra: 0 });
      if (k === nF) break;
      // window ticks stamped along the floor in a travelling row
      L.set({ rank: FAINT, col: DETAIL, hidden: false, extra: Math.max(1.2, 2 * bwA * V.winW) });
      const wy0 = y + fh * 0.26, wy1 = y + fh * 0.8;
      for (let f = 0; f < 4; f++) for (let i = 0; i < nb; i++) {
        const sc = -h + (i + 0.5) * bw, b0 = y + 1.2 + 3.0 * ((f + (i + 0.5) / nb) / 4), b1 = b0 + 0.5;
        if (ti === 0 && k < 3) continue;   // the arcade lives here
        const hw = bw * V.winW;
        if (V.win === 0) { const [x, z] = onFace(f, h, sc); L.seg(x, wy0, z, x, wy1, z, b0, b1); continue; }
        const p = onFace(f, h, sc - hw), q = onFace(f, h, sc + hw);
        L.seg(p[0], wy0, p[1], p[0], wy1, p[1], b0, b1);
        L.seg(q[0], wy0, q[1], q[0], wy1, q[1], b0 + 0.15, b1 + 0.15);
        if (V.win === 2) L.seg(p[0], wy1, p[1], q[0], wy1, q[1], b0 + 0.3, b1 + 0.3);
      }
    }
    L.set({ extra: 0 });
    // diagonal bracing on some tiers (medium), one X per mega-bay
    if (V.braced[ti] && !V.round) {
      L.set({ rank: MED, col: DETAIL, hidden: false });
      const mb = Math.max(1, Math.round(nb / V.pier)), mw = (2 * h) / mb, mh = fh * V.belt * 2;
      for (let f = 0; f < 4; f++) for (let i = 0; i < mb; i++) for (let y = t.y0; y < t.y1 - mh * 0.5; y += mh) {
        const y1 = Math.min(t.y1, y + mh), a = onFace(f, h + 0.05, -h + i * mw), b = onFace(f, h + 0.05, -h + (i + 1) * mw);
        L.seg(a[0], y, a[1], b[0], y1, b[1], y, y1); L.seg(b[0], y, b[1], a[0], y1, a[1], y + 1, y1 + 1);
      }
    }
    // parapet: balusters round the terrace edge, then a row of elevation-symbol trees
    L.set({ rank: FAINT, col: DETAIL, hidden: false });
    const nBal = Math.round((2 * h) / 2.4);
    for (let f = 0; f < 4; f++) {
      L.set({ extra: 2.0 });
      for (let i = 0; i <= nBal; i++) { const [x, z] = onFace(f, h, -h + (i / nBal) * 2 * h); L.seg(x, t.y1, z, x, t.y1 + 1.3, z, t.y1 + 4 + f, t.y1 + 5 + f); }
      L.set({ rank: MED, col: WHITE, extra: 0 }); side(f, h, -h - 0.4, h + 0.4, t.y1 + 1.3, t.y1 + 5 + f, t.y1 + 8 + f); L.set({ rank: FAINT, col: DETAIL });
    }
    const next = tiers[ti + 1];
    if (next && V.buttress) {                 // flying buttresses ruled as arcs: a construction chord, then the heavy arc
      const rise = (h - next.half) * 2.6;
      for (let f = 0; f < 4; f++) {
        const a = onFace(f, h, h), b = onFace(f, next.half, next.half), pts = [];
        for (let i = 0; i <= 8; i++) { const k = i / 8, w0 = (1 - k) * (1 - k), w1 = 2 * k * (1 - k), w2 = k * k; pts.push([a[0] * w0 + a[0] * w1 + b[0] * w2, t.y1 + rise * (0.75 * w1 + w2), a[1] * w0 + a[1] * w1 + b[1] * w2]); }
        L.set({ rank: FAINT, col: CONS, style: DASH, hidden: false, fade: t.y1 + rise + 10 }); L.seg(a[0], t.y1, a[1], b[0], t.y1 + rise, b[1], t.y1 + 1, t.y1 + 5);
        L.set({ rank: HEAVY, col: WHITE, style: SOLID, fade: NEVER }); L.poly(pts, t.y1 + 5, t.y1 + rise + 5);
      }
      L.set({ rank: FAINT, col: DETAIL });
    }
    if (next && h - next.half >= 5) {
      const rm = (h + next.half) * 0.5, nT = Math.max(2, Math.round((2 * rm) / V.treeGap));
      for (let f = 0; f < 4; f++) for (let i = 0; i < nT; i++) {
        const s = -rm + ((i + 0.5) / nT) * 2 * rm, [x, z] = onFace(f, rm, s), r = rng.range(1.5, 2.4) * (1 + ti * 0.06), st = rng.range(2.4, 3.6);
        const b0 = t.y1 + 9 + 6 * ((f + i / nT) / 4);
        L.set({ rank: MED, col: WHITE }); L.seg(x, t.y1, z, x, t.y1 + st, z, b0, b0 + 0.6);
        const tl = tanAt(f, rm, s); L.set({ rank: FAINT, col: WHITE }); L.circle([x, t.y1 + st + r, z], [tl[0], 0, tl[1]], [0, 1, 0], r, 9, b0 + 0.6, b0 + 2.2, -Math.PI / 2, Math.PI * 1.5);
      }
    }
  });
  // gothic cast: piers standing off each tier with pinnacles, a straight strut and a ruled arc flying to the wall
  if (V.gothic) tiers.forEach((t, ti) => {
    const h = t.half, ho = ti === 0 ? h + 13 : tiers[ti - 1].half - 1.2;
    if (ho - h < 4) return;
    const ph = Math.min((t.y1 - t.y0) * 0.42, 44), ya = t.y0 + ph, yb = ya + (ho - h) * 1.25;
    for (let f = 0; f < 4; f++) for (const sf of [-0.62, 0, 0.62]) {
      const s = sf * h, a = onFace(f, ho, s), b0 = t.y0 + 2 + f;
      L.set({ grp: G_F, rank: MED, col: WHITE, style: SOLID, hidden: false, fade: NEVER });
      L.seg(a[0], t.y0, a[1], a[0], ya + 4, a[1], b0, ya + 4);
      const c = onFace(f, ho + 0.9, s), d = onFace(f, ho - 0.9, s);
      L.set({ rank: FAINT }); L.seg(c[0], ya + 4, c[1], a[0], ya + 11, a[1], ya + 4, ya + 8); L.seg(d[0], ya + 4, d[1], a[0], ya + 11, a[1], ya + 5, ya + 9);
      L.seg(c[0], ya + 4, c[1], d[0], ya + 4, d[1], ya + 4, ya + 5);
      const w = onFace(f, h, s);
      L.set({ rank: MED }); L.seg(a[0], ya + 3, a[1], w[0], yb + 3, w[1], ya + 6, yb + 6);
      const pts = [];
      for (let i = 0; i <= 8; i++) { const k = i / 8, r = ho - (ho - h) * Math.sin(k * Math.PI / 2), q = onFace(f, r, s); pts.push([q[0], ya - 3 + (yb + 4 - ya) * (1 - Math.cos(k * Math.PI / 2)), q[1]]); }
      L.set({ rank: HEAVY, wScale: 1.5 }); L.poly(pts, ya + 2, yb + 4); L.set({ wScale: 1 });
      L.set({ rank: FAINT, col: CONS, style: DASH, fade: yb + 10 }); L.seg(a[0], ya - 3, a[1], w[0], ya - 3, w[1], t.y0, t.y0 + 4); L.set({ style: SOLID, fade: NEVER });
    }
  });
  // base arcade: tall arches on every face, a larger portal on the front
  const t0 = tiers[0], na = V.arches;
  for (let f = 0; f < 4; f++) for (let i = 0; i < na; i++) {
    const aw = (2 * t0.half) / na, sc = -t0.half + (i + 0.5) * aw, big = f === 0 && i === (na - 1) / 2;
    const r = aw * (big ? 0.44 : 0.36), sp = big ? 9.5 : 6.5;
    const c = onFace(f, t0.half + 0.1, sc), tl = tanAt(f, t0.half, sc), rr = r * (V.round ? 0.8 : 1);
    const a = [c[0] - tl[0] * rr, c[1] - tl[1] * rr], b = [c[0] + tl[0] * rr, c[1] + tl[1] * rr];
    L.set({ rank: big ? HEAVY : MED, col: WHITE, hidden: false });
    L.seg(a[0], 0, a[1], a[0], sp, a[1], 0.5, sp); L.seg(b[0], 0, b[1], b[0], sp, b[1], 0.5, sp);
    L.circle([c[0], sp, c[1]], [tl[0], 0, tl[1]], [0, 1, 0], rr, 10, sp, sp + rr + 2, Math.PI, 0);
    L.set({ rank: FAINT, col: CONS, style: DASHDOT }); L.seg(c[0], -0.5, c[1], c[0], sp + r + 2.5, c[1], 0, sp + r); L.set({ style: SOLID });
  }
  // crown: hipped lantern, mast and aerial ticks
  const tc = tiers[tiers.length - 1], hc = tc.half, yc = tc.y1;
  L.set({ rank: HEAVY, col: WHITE, hidden: true });
  const apex = yc + 15;
  for (let f = 0; f < 4; f++) {
    const [x, z] = onFace(f, hc * 0.72, hc * 0.72), [x2, z2] = onFace(f, hc * 0.72, -hc * 0.72);
    L.seg(x2, yc + 1.3, z2, x, yc + 1.3, z, yc + 2, yc + 5);
    if (V.crown === 0) L.seg(x, yc + 1.3, z, 0, apex, 0, yc + 3, apex + 2);
    else { L.seg(x, yc + 1.3, z, x * 0.45, yc + 9, z * 0.45, yc + 3, yc + 9); L.seg(x * 0.45, yc + 9, z * 0.45, x2 * 0.45, yc + 9, z2 * 0.45, yc + 9, yc + 11); L.seg(x * 0.45, yc + 9, z * 0.45, 0, apex, 0, yc + 10, apex + 2); }
  }
  L.set({ rank: MED, hidden: false }); L.seg(0, apex, 0, 0, apex + 10, 0, apex + 2, apex + 6);
  L.set({ rank: FAINT }); for (let i = 0; i < 3; i++) L.seg(-1.6 + i * 0.4, apex + 3 + i * 2.4, 0, 1.6 - i * 0.4, apex + 3 + i * 2.4, 0, apex + 4, apex + 6);
}

// Fixed stage geometry shared by the drawing and the choreography.
function stage(rng, tiers) {
  const D2R = Math.PI / 180, phiR = 45 * D2R, phiS = -59.8 * D2R, phi0 = 60.2 * D2R;
  const C = new THREE.Vector3(Math.sin(phiR) * 52, 578, Math.cos(phiR) * 52);
  const S = new THREE.Vector3(Math.sin(phiS) * 45, 445, Math.cos(phiS) * 45);
  const n = C.clone().sub(S).normalize();                         // travel direction through the ring (60 deg up)
  const e1 = new THREE.Vector3(0, 1, 0).cross(n).normalize(), e2 = n.clone().cross(e1).normalize();
  const halfAt = (y) => { let h = tiers[0].half; for (const t of tiers) h = lerp(h, t.half, smoothstep(t.y0 + 4, t.y0 + 44, y)); return h; };
  const fly = [];
  for (let i = 0; i <= 16; i++) {
    const k = i / 16, y = lerp(30, 445, k), phi = lerp(phi0, phi0 + 240 * D2R, k);
    const r = lerp(halfAt(y) + 30, 45, smoothstep(390, 445, y));
    fly.push(new THREE.Vector3(Math.sin(phi) * r, y, Math.cos(phi) * r));
  }
  fly.push(S.clone().lerp(C, 0.34), S.clone().lerp(C, 0.67), C.clone());
  // compass stances on the paper: it walks P0,P1 -> P1,P2 -> P2,P3
  const P3 = new THREE.Vector3(197, 0, -66), dir = new THREE.Vector3(0.35, 0, 0.937).normalize(), step = 180;
  const P = [3, 2, 1, 0].map((k) => P3.clone().addScaledVector(dir, step * k));
  return { C, S, n, e1, e2, fly, P, step, sgn0: rng.chance(0.5) ? 1 : -1, sgn1: -1, sweepR: 295, sweepY: 204 };
}

function buildPlaza(L, rng, tiers, G, V, opts) {
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1], C = G.C.toArray(), e1 = G.e1.toArray(), e2 = G.e2.toArray();
  const always = [-1, -0.5];
  const onFace = V.round ? roundFace : sqFace;
  // the idea of the tower: four construction lines from the base corners to the red centre-cross
  L.set({ grp: G_U, rank: MED, col: CONS, style: SOLID, hidden: false, fade: NEVER, wScale: 2.4 });
  // (they stop 13 m short of the centre-cross, at the guide circle, and sink back once the ring is scribed: nothing
  // is ruled across the opening we fly into)
  L.set({ fade: 0.9 });
  for (let f = 0; f < 4; f++) {
    const [x, z] = onFace(f, 48, 48), dl = Math.hypot(C[0] - x, C[1], C[2] - z), k = 1 - 13 / dl;
    L.seg(x, 0, z, x + (C[0] - x) * k, C[1] * k, z + (C[2] - z) * k, ...always);
  }
  L.set({ fade: NEVER });
  L.set({ rank: FAINT, style: SOLID, fade: 0.22, wScale: 1 }); L.circle([0, 0.15, 0], X, Z, 130, 72, ...always);
  // the destination, marked long before the lead scribes it: a heavy red centre-cross in a dashed red ghost circle,
  // with a construction circle and four witness ticks round it
  const ringPt = (a, r) => [0, 1, 2].map((k) => C[k] + (e1[k] * Math.cos(a) + e2[k] * Math.sin(a)) * r);
  // (the guide circle is 28 m in radius and drawn firmly, so the way out is legible from far down the hoist)
  L.set({ rank: MED, col: CONS, style: DASHDOT, fade: 0.9, wScale: 3.6 }); L.circle(C, e1, e2, 28, 56, ...always);
  L.set({ rank: FAINT, style: SOLID, wScale: 1.5 }); L.circle(C, e1, e2, 15, 40, ...always);
  for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2 + Math.PI / 4, p0 = ringPt(a, 12.5), p1 = ringPt(a, 33); L.seg(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], ...always); }
  // a second red centre-line: from the crown's mast out to the centre-cross
  { const tcr = tiers[tiers.length - 1]; L.set({ rank: MED, col: RED, style: DASHDOT, fade: 0.9, wScale: 1.7 }); L.seg(0, tcr.y1 + 15, 0, C[0], C[1], C[2], ...always); L.set({ col: CONS, style: SOLID, wScale: 1.5, rank: FAINT }); }
  L.set({ rank: MED, col: RED, style: DASH, fade: 0.9, wScale: 1.3 }); L.circle(C, e1, e2, 7, 36, ...always);
  L.set({ rank: HEAVY, col: RED, style: SOLID, fade: 0.9, wScale: 1.25 });
  for (const a of [0, Math.PI / 2]) { const p0 = ringPt(a, -7.6), p1 = ringPt(a, 7.6); L.seg(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], ...always); }
  L.set({ fade: NEVER });
  // the ring the lead scribes (u 0.825-0.90), heavy red with a fine inner line
  L.set({ rank: HEAVY, wScale: 1.7 }); L.circle(C, e1, e2, 7, 56, 0.825, 0.9);
  L.set({ rank: FAINT, wScale: 1 }); L.circle(C, e1, e2, 6.45, 40, 0.83, 0.905);
  // finials: construction chord first, then the heavy curve reaching up from each crown corner to cradle the ring
  const tc = tiers[tiers.length - 1];
  for (let f = 0; f < 4; f++) {
    const [x, z] = onFace(f, tc.half, tc.half), aC = Math.atan2(-(G.e2.x * C[0] + G.e2.z * C[2]), -(G.e1.x * C[0] + G.e1.z * C[2])), a = aC + [-0.38, -1.3, 0.38, 1.3][f];
    const end = [0, 1, 2].map((k) => C[k] + (e1[k] * Math.cos(a) + e2[k] * Math.sin(a)) * 8.4);
    const far = Math.hypot(end[0] - x, end[2] - z), ctl = [x * 1.25, tc.y1 + 16 + far * 0.45, z * 1.25], pts = [];
    for (let i = 0; i <= 14; i++) { const k = i / 14, w0 = (1 - k) * (1 - k), w1 = 2 * k * (1 - k), w2 = k * k; pts.push([x * w0 + ctl[0] * w1 + end[0] * w2, tc.y1 * w0 + ctl[1] * w1 + end[1] * w2, z * w0 + ctl[2] * w1 + end[2] * w2]); }
    // (ruled while the lead is still going round, heroU 0.885-0.94, as soon as the crown is closed beneath them)
    L.set({ rank: FAINT, col: CONS, style: DASH, fade: 0.95, wScale: 1.4 }); L.seg(x, tc.y1, z, end[0], end[1], end[2], 0.845, 0.88);
    L.set({ rank: HEAVY, col: WHITE, style: SOLID, fade: NEVER, wScale: 2.0 }); L.poly(pts, 0.885 + f * 0.006, 0.925 + f * 0.006);
    // the tip curls round the rim (along the ring's tangent, upward), never into the opening
    const q = pts[14], tg = [0, 1, 2].map((k) => -e1[k] * Math.sin(a) + e2[k] * Math.cos(a)), sg = tg[1] < 0 ? -1 : 1;
    L.set({ rank: HEAVY, wScale: 1.3 }); L.seg(q[0], q[1], q[2], q[0] + tg[0] * sg * 4, q[1] + tg[1] * sg * 4, q[2] + tg[2] * sg * 4, 0.925 + f * 0.006, 0.94 + f * 0.006);
    // a small ball finial and a cross-tick near each tip
    L.set({ rank: MED, wScale: 1.2 }); L.circle([q[0] + tg[0] * sg * 5.1, q[1] + tg[1] * sg * 5.1, q[2] + tg[2] * sg * 5.1], e1, e2, 1.1, 8, 0.94 + f * 0.006, 0.952 + f * 0.006);
    const m = pts[11]; L.seg(m[0] - e1[0] * 1.5, m[1], m[2] - e1[2] * 1.5, m[0] + e1[0] * 1.5, m[1], m[2] + e1[2] * 1.5, 0.918 + f * 0.006, 0.925 + f * 0.006);
    L.set({ wScale: 1 });
  }
  // plaza: kerbs, centre-lines, steps round the base, paving ticks and a ring of elevation-symbol trees
  L.set({ rank: HEAVY, col: WHITE, wScale: 1 }); L.circle([0, 0.15, 0], X, Z, 130, 96, 0.17, 0.235);
  L.set({ rank: MED, col: DETAIL }); L.circle([0, 0.15, 0], X, Z, 123, 96, 0.185, 0.25);
  // paving rings set out inside the kerb
  L.set({ rank: FAINT }); L.circle([0, 0.15, 0], X, Z, 98, 72, 0.2, 0.26); L.set({ style: DASH }); L.circle([0, 0.15, 0], X, Z, 76, 64, 0.21, 0.27); L.set({ style: SOLID });
  L.set({ rank: MED, col: RED, style: DASHDOT });
  L.seg(-150, 0.2, 0, 150, 0.2, 0, 0.12, 0.2); L.seg(0, 0.2, 150, 0, 0.2, -150, 0.1, 0.18);
  L.set({ rank: MED, col: DETAIL, style: SOLID });
  for (const hs of [52, 56.5]) {
    if (V.round) L.circle([0, 0.15, 0], X, Z, hs, 40, 0.3, 0.34);
    else for (let f = 0; f < 4; f++) { const a = onFace(f, hs, -hs - 0.5), b = onFace(f, hs, hs + 0.5); L.seg(a[0], 0.15, a[1], b[0], 0.15, b[1], 0.3 + f * 0.01, 0.33 + f * 0.01); }
  }
  L.set({ rank: FAINT });
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r0 = i % 3 ? 104 : 92; L.seg(c * r0, 0.15, s * r0, c * 114, 0.15, s * 114, 0.2 + 0.06 * i / 72, 0.215 + 0.06 * i / 72); }
  const nT = V.plazaTrees;
  for (let i = 0; i < nT; i++) {
    const a = ((i + 0.5) / nT) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), x = c * 118, z = s * 118;
    if (Math.abs(x) < 9 || Math.abs(z) < 9) continue;                       // keep the axes open
    const r = rng.range(3.2, 4.6), st = rng.range(4.5, 6.5), b0 = 0.195 + 0.06 * i / nT;
    L.set({ rank: MED, col: WHITE }); L.seg(x, 0, z, x, st, z, b0, b0 + 0.008);
    L.set({ rank: FAINT }); L.circle([x, st + r, z], [-s, 0, c], Y, r, 11, b0 + 0.008, b0 + 0.03, -Math.PI / 2, Math.PI * 1.5);
  }
  // dimension line up the tower's left side: it grows with the front; witness lines and arrow ticks at each setback
  const dx = -tiers[0].half - 18, dz = tiers[0].half + 4;
  L.set({ grp: G_F, rank: MED, col: CONS }); L.seg(dx, 0, dz, dx, tiers[tiers.length - 1].y1, dz, 0, tiers[tiers.length - 1].y1);
  for (const t of [{ y1: 0, half: tiers[0].half }, ...tiers]) {
    const y = t.y1;
    L.set({ rank: FAINT }); L.seg(-t.half - 2, y, dz, dx - 5, y, dz, y, y + 5);
    L.set({ rank: MED }); L.seg(dx - 1.6, y - 1.6, dz, dx + 1.6, y + 1.6, dz, y + 4, y + 6);
  }
  // what the compass leaves on the sheet: one red circle (a plaza to be) and the dashed trace of the needle's swing
  const P = G.P, a0 = Math.atan2(P[0].z - P[1].z, P[0].x - P[1].x), a1 = Math.atan2(P[1].z - P[2].z, P[1].x - P[2].x);
  L.set({ grp: G_U, rank: HEAVY, col: RED, style: SOLID }); L.circle([P[1].x, 0.2, P[1].z], X, Z, G.step, 96, 0.04, 0.16, a0, a0 + G.sgn0 * Math.PI * 2);
  L.set({ rank: MED }); L.seg(P[1].x - 5, 0.2, P[1].z, P[1].x + 5, 0.2, P[1].z, 0.035, 0.04); L.seg(P[1].x, 0.2, P[1].z - 5, P[1].x, 0.2, P[1].z + 5, 0.035, 0.04);
  L.set({ rank: FAINT, col: CONS, style: DASH, fade: 0.55 }); L.circle([P[2].x, 0.2, P[2].z], X, Z, G.step, 48, 0.25, 0.4, a1, a1 + G.sgn1 * Math.PI);
  L.set({ style: SOLID, fade: NEVER });
  if (opts.hoistLine) { L.set({ rank: MED, col: RED, style: DASHDOT }); L.poly(G.fly.map((p) => [p.x, p.y + 3.2, p.z]), 0.3, 0.42); L.set({ style: SOLID }); }
}

// The compass: two identical legs (local y from the point at 0 to the hinge at 300, x across the 6 m bar,
// z through it) and a head with a knurled handle. Each part takes its own matrix in the vertex shader.
function buildCompass(L, rng) {
  const loop = (y, hx, hz, b = [-1, -0.5]) => { L.seg(-hx, y, -hz, hx, y, -hz, ...b); L.seg(hx, y, -hz, hx, y, hz, ...b); L.seg(hx, y, hz, -hx, y, hz, ...b); L.seg(-hx, y, hz, -hx, y, -hz, ...b); };
  const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
  for (const grp of [G_LEGA, G_LEGB]) {
    L.set({ grp, col: CREAM, rank: HEAVY, style: SOLID, hidden: false, fade: NEVER, wScale: 2.0 });
    const y0 = 46, y1 = 289, hx = 3, hz = 1.3;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {            // the double-line bar and its taper to the socket
      L.set({ rank: sz > 0 ? HEAVY : MED });
      L.seg(sx * hx, y0, sz * hz, sx * hx, KNEE, sz * hz); L.seg(sx * hx, KNEE, sz * hz, sx * hx, y1, sz * hz);
      L.seg(sx * hx, y0, sz * hz, sx * 1.1, 27, sz * 0.7);
    }
    L.set({ rank: MED, wScale: 1.6 });
    const nR = 16;
    for (let i = 0; i <= nR; i++) loop(lerp(y0, y1, i / nR), hx, hz);
    loop(27, 1.1, 0.7); loop(31, 1.5, 0.85);
    L.set({ rank: FAINT, wScale: 1.6 });
    for (let i = 0; i < nR; i++) for (const sz of [-1, 1]) {         // lattice between the rungs
      const a = lerp(y0, y1, i / nR), b = lerp(y0, y1, (i + 1) / nR), s = i % 2 ? 1 : -1;
      L.seg(-hx * s, a, sz * hz, hx * s, b, sz * hz);
    }
    // thumb-wheel on the outer side, a third of the way up
    L.set({ rank: MED });
    L.circle([hx + 6.5, 112, 0], X, Y, 6.5, 20); L.circle([hx + 6.5, 112, 0], X, Y, 2.2, 10);
    L.set({ rank: FAINT }); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); L.seg(hx + 6.5 + c * 5.2, 112 + s * 5.2, 0, hx + 6.5 + c * 6.5, 112 + s * 6.5, 0); }
    L.seg(-hx, 112, 0, hx + 0.5, 112, 0);
    L.set({ rank: MED }); L.circle([0, KNEE, 0], X, Y, 4.6, 14); L.circle([0, KNEE, 0], X, Y, 1.4, 8);
    if (grp === G_LEGA) {                                             // the needle
      L.set({ rank: HEAVY, wScale: 1.6 }); L.seg(0, 0, 0, 0, 27, 0);
      L.set({ rank: MED }); L.seg(-0.9, 9, 0, 0.9, 9, 0); L.seg(-0.7, 27, 0, 0, 3, 0); L.seg(0.7, 27, 0, 0, 3, 0);
    } else {                                                          // the lead in its holder: the red that scribes
      L.set({ rank: MED, wScale: 1.6 }); loop(22, 1.3, 0.8); loop(16, 1.2, 0.75);
      for (const sx of [-1, 1]) L.seg(sx * 1.2, 16, 0, sx * 1.1, 27, 0);
      L.seg(1.3, 19, 0, 4.2, 19, 0); L.circle([4.2, 19, 0], X, Y, 1.3, 8);
      L.set({ rank: HEAVY, col: RED, wScale: 1.8 }); L.seg(0, 0, 0, 0, 16, 0);
      L.set({ rank: MED }); L.seg(-0.85, 16, 0, 0, 0.5, 0); L.seg(0.85, 16, 0, 0, 0.5, 0);
    }
  }
  // head: hinge discs on both faces, pivot screw, knurled handle with a ball end
  L.set({ grp: G_HEAD, col: CREAM, rank: HEAVY, wScale: 2.0 });
  for (const z of [-1.7, 1.7]) {
    L.set({ rank: HEAVY }); L.circle([0, 0, z], X, Y, 10.5, 28);
    L.set({ rank: MED }); L.circle([0, 0, z], X, Y, 7.2, 22); L.circle([0, 0, z], X, Y, 2.1, 10);
    L.seg(-1.5, -1.5, z, 1.5, 1.5, z);
  }
  L.set({ rank: FAINT, wScale: 1.6 });
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); L.seg(c * 10.5, s * 10.5, -1.7, c * 10.5, s * 10.5, 1.7); }
  L.set({ rank: HEAVY, wScale: 1.8 });
  for (const sx of [-1, 1]) { L.seg(sx * 2.6, 10, 0, sx * 2.6, 44, 0); L.seg(0, 10, sx * 2.6, 0, 44, sx * 2.6); }
  L.set({ rank: FAINT, wScale: 1.6 });
  for (let y = 12; y <= 42; y += 2.5) L.circle([0, y, 0], X, Z, 2.6, 8);
  L.set({ rank: MED }); L.circle([0, 44, 0], X, Z, 3.4, 10); L.circle([0, 10, 0], X, Z, 3.6, 10);
  L.circle([0, 48.5, 0], X, Y, 4.2, 14); L.circle([0, 48.5, 0], Z, Y, 4.2, 14);
  L.set({ wScale: 1 });
}

// Four line derricks that ride the draw-front (placed, hopped and slewed in the vertex shader).
function buildDerricks(L) {
  for (let i = 0; i < 4; i++) {
    L.set({ grp: G_DERRICK, col: WHITE, rank: HEAVY, style: SOLID, hidden: false, fade: NEVER, extra: i, wScale: 1.25 });
    L.seg(0, 0, 0, 0, 12, 0); L.seg(0, 9, 0, 14, 15, 0);
    L.set({ wScale: 1.1 });
    L.seg(0, 12, 0, 14, 15, 0); L.seg(0, 12, 0, -4.5, 7.5, 0); L.seg(-4.5, 7.5, 0, 0, 6, 0); L.seg(-1.6, 0, 0, 1.6, 0, 0);
    L.set({ rank: MED, wScale: 1.2 });
    L.seg(14, 15, 0, 14, 3.5, 0); L.seg(13.2, 3.5, 0, 14.8, 3.5, 0);
    for (let k = 1; k < 6; k++) { const a = k / 6; L.seg(14 * a, lerp(9, 15, a), 0, 14 * (a + 0.08), lerp(12, 15, a + 0.08), 0); }
  }
  L.set({ extra: 0, wScale: 1 });
}

// The draw-front itself: the slab outline being ruled round just under the cage. Unit footprint, placed at the
// front and scaled to the tier in the vertex shader; a second copy is the stroke in hand with its bright tip.
function buildFront(L, V) {
  const F = V.round ? roundFace : sqFace, n = V.round ? 6 : 1;
  for (const tip of [0, 1, 2]) {       // 0 the outline, 1 and 2 two pens going round it half a turn apart
    L.set({ grp: G_FRONT, col: tip ? CREAM : WHITE, rank: HEAVY, style: SOLID, hidden: false, fade: NEVER, extra: tip, wScale: tip ? 2.6 : 1.6 });   // (the stroke in hand is the instrument's: cream)
    for (let f = 0; f < 4; f++) for (let i = 0; i < n; i++) {
      const p = F(f, 1, -1 + (2 * i) / n), q = F(f, 1, -1 + (2 * (i + 1)) / n);
      L.seg(p[0], 0, p[1], q[0], 0, q[1], (f + i / n) / 4, (f + (i + 1) / n) / 4);
    }
  }
  // column stubs standing above the slab in hand, each being pulled up with a bright tip (heights in metres)
  L.set({ grp: G_STUB, col: WHITE, rank: MED, style: SOLID, hidden: false, fade: NEVER, extra: 0, wScale: 2 });
  let k = 0;
  for (let f = 0; f < 4; f++) for (const sf of [-1, -0.5, 0, 0.5]) {
    const q = F(f, 0.985, sf * 0.985), hgt = 4.5 + 3.5 * ((k * 7) % 5) / 4;
    L.seg(q[0], 0, q[1], q[0], hgt, q[1], (k * 0.618) % 1, 0); k++;
  }
  L.set({ extra: 0, wScale: 1, grp: G_F });
}

function lineGeometry(list, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ib = new THREE.InstancedInterleavedBuffer(list, 14);
  g.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  g.setAttribute('aS', new THREE.InterleavedBufferAttribute(ib, 4, 6));
  g.setAttribute('aT', new THREE.InterleavedBufferAttribute(ib, 4, 10));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 400, 0), 1400);
  return g;
}

const LINE_VERT = /* glsl */`
  attribute vec3 aA, aB; attribute vec4 aS, aT;
  uniform float uF, uU, uTime, uHidden, uRound, uBow, uGhost; uniform vec2 uRes; uniform mat4 uM[3]; uniform vec3 uTier[6]; uniform vec3 uCol[5];
  varying float vS, vLen, vEdge, vHalf, vStyle, vTip, vAlpha, vMpp, vCrawl, vHead; varying vec3 vCol;
  #include <fog_pars_vertex>
  float halfAt(float y) { float h = uTier[0].z; for (int i = 1; i < 6; i++) h = mix(h, uTier[i].z, step(uTier[i].x, y)); return h; }
  void main() {
    float grp = aS.w, rank = floor(aS.y / 4. + 0.01), style = aS.y - rank * 4.;
    float P = grp < 0.5 ? uF : uU;
    float p = clamp((P - aT.x) / max(aT.y - aT.x, 1e-4), 0., 1.);
    vec3 A = aA, B = aB; float alpha = 1.;
    if (grp > 1.5 && grp < 4.5) {
      mat4 M = grp < 2.5 ? uM[0] : (grp < 3.5 ? uM[1] : uM[2]);
      if (grp < 3.5) {
        // the legs' knee joints open outwards (uBow metres at the knee), so the two legs stand apart on screen
        // even when their points are only the ring's radius from each other
        A.x += uBow * (A.y < ${KNEE.toFixed(4)} ? A.y / ${KNEE.toFixed(4)} : (300. - A.y) / ${(300 - KNEE).toFixed(4)});
        B.x += uBow * (B.y < ${KNEE.toFixed(4)} ? B.y / ${KNEE.toFixed(4)} : (300. - B.y) / ${(300 - KNEE).toFixed(4)});
      }
      A = (M * vec4(A, 1.)).xyz; B = (M * vec4(B, 1.)).xyz; p = 1.;
    } else if (grp > 6.5) {
      // column stubs pulled up from the slab in hand, each with its travelling tip
      float h = halfAt(uF - 0.35);
      A = vec3(A.x * h, uF - 0.3, A.z * h); B = vec3(B.x * h, uF - 0.3 + B.y, B.z * h);
      alpha = smoothstep(1., 6., uF) * (1. - smoothstep(548., 556., uF));
      p = 0.25 + 0.74 * fract(uF / 22.8 + aT.x);
    } else if (grp > 5.5) {
      // the slab outline at the draw-front; the stroke in hand goes once round for every four floors
      float h = halfAt(uF - 0.35);
      A = vec3(A.x * h, uF - 0.3, A.z * h); B = vec3(B.x * h, uF - 0.3, B.z * h);
      alpha = smoothstep(1., 6., uF) * (1. - smoothstep(556., 561., uF));
      p = 1.;
      if (aT.w > 0.5) { p = clamp((fract(uF / 15.2 + 0.5 * step(1.5, aT.w)) - aT.x) / max(aT.y - aT.x, 1e-4), 0., 1.); if (p >= 0.9999) alpha = 0.; }
    } else if (grp > 4.5) {
      // derricks: stand on the newest floor at the corners, hop floor to floor, slew the jib
      float i = aT.w, yq = floor(uF / 3.8) * 3.8, hop = fract(uF / 3.8);
      float hT = halfAt(yq - 2.), big = mix(1., 1.5, smoothstep(20., 45., hT));    // larger on the wide lower tiers
      A *= big; B *= big;
      float h = (hT - 3.) * mix(1., 0.7071, uRound);
      // (the jib works over the slab, slewing 80 degrees either side of the diagonal: it never swings out at the cage)
      float ang = i * 1.5708 + 3.927 + 1.1 * sin(uTime * 0.6 + i * 2.1) + 0.3 * sin(uTime * 1.7 + i);
      float c = cos(ang), s = sin(ang);
      vec3 base = vec3((i < 0.5 || i > 2.5 ? 1. : -1.) * h, yq, (i < 1.5 ? 1. : -1.) * h);
      base.y += 1.4 * sin(min(hop * 2., 1.) * 3.1416);
      A = base + vec3(A.x * c - A.z * s, A.y, A.x * s + A.z * c);
      B = base + vec3(B.x * c - B.z * s, B.y, B.x * s + B.z * c);
      p = 1.; alpha = smoothstep(4., 12., uF) * (1. - smoothstep(548., 556., uF));
    }
    float span = grp < 0.5 ? 26. : 0.035;
    if (grp < 5.5) alpha *= 1. - 0.9 * smoothstep(aT.z, aT.z + span, P);
    vec3 E = mix(A, B, p);
    vec4 vA = modelViewMatrix * vec4(A, 1.), vE = modelViewMatrix * vec4(E, 1.);
    float nearZ = -0.4;
    bool cull = p <= 0. || alpha <= 0.003 || (vA.z > nearZ && vE.z > nearZ);
    if (vA.z > nearZ) vA = mix(vE, vA, (nearZ - vE.z) / max(vA.z - vE.z, 1e-4));
    else if (vE.z > nearZ) vE = mix(vA, vE, (nearZ - vA.z) / max(vE.z - vA.z, 1e-4));
    vec4 cA = projectionMatrix * vA, cE = projectionMatrix * vE;
    vec2 sA = cA.xy / max(cA.w, 1e-4) * uRes * 0.5, sE = cE.xy / max(cE.w, 1e-4) * uRes * 0.5;
    vec2 d = sE - sA; float dl = length(d); d = dl > 1e-3 ? d / dl : vec2(1., 0.);
    vec2 nrm = vec2(-d.y, d.x);
    vec4 mv = mix(vA, vE, position.x);
    vec4 c4 = mix(cA, cE, position.x);
    float w = max(c4.w, 1e-3);
    float pxPerM = uRes.y * 0.5 * projectionMatrix[1][1] / w;
    float wpx = aS.x * pxPerM;
    float minPx = rank < 0.5 ? 2.0 : (rank < 1.5 ? 1.5 : 1.15);
    bool cream = aS.z > 1.5 && aS.z < 2.5;
    if (cream) minPx = rank < 0.5 ? 3.0 : (rank < 1.5 ? 1.8 : 1.15);   // the compass must stay an instrument at 300 m
    float wd = max(wpx, minPx);
    // lines thinner than their minimum keep their width but give up brightness, so facades never fuse to white
    float thin = clamp(wpx / minPx, 0., 1.);
    float dim = rank < 0.5 ? clamp(thin * 2.4, 0.46, 1.) : (rank < 1.5 ? clamp(thin * 2.2, 0.05, 1.) : clamp(thin * 2.2, 0.03, 1.));
    if (aS.z > 0.5 && aS.z < 1.5) dim = max(dim, 0.6);      // sparse construction lines keep their strength: the ghost must read from afar
    if (cream) dim = max(dim, rank < 0.5 ? 0.9 : (rank < 1.5 ? 0.5 : 0.2));
    alpha *= dim;
    // tower detail gives way when its neighbours close up on screen (aT.w = spacing in metres, negative for
    // horizontal lines, whose spacing is foreshortened when we look down the face): the fill's tone takes over
    if (grp < 0.5 && abs(aT.w) > 0.01) {
      float sp = abs(aT.w) * pxPerM;
      if (aT.w < 0.) { vec3 vd = normalize((modelMatrix * vec4(E, 1.)).xyz - cameraPosition + vec3(0., 1e-4, 0.)); sp *= sqrt(max(1. - vd.y * vd.y, 0.)); }
      alpha *= mix(rank < 0.5 ? 0.3 : 0., 1., smoothstep(4.5, 13., sp));
    }
    float dist = -mv.z;
    if (rank > 1.5) alpha *= 1. - 0.6 * smoothstep(900., 2600., dist);
    // close to the cage the tower's detail steps back, so the slab outline and the tick row carry the foreground
    float nearK = mix(0.3, 1., smoothstep(12., 28., dist)) * (rank > 1.5 ? mix(0.55, 1., smoothstep(30., 90., dist)) : 1.);
    if (grp < 0.5 && rank > 0.5) alpha *= nearK;
    float hw = wd * 0.5 + 1.0;
    c4.xy += (nrm * position.y * hw + d * (position.x * 2. - 1.) * min(wd * 0.5, 2.)) / (uRes * 0.5) * w;
    gl_Position = cull ? vec4(2., 2., 2., 1.) : c4;
    vEdge = position.y * hw; vHalf = wd * 0.5;
    vLen = length(B - A) * p; vS = position.x * vLen;
    vStyle = uHidden > 0.5 ? 1. : style;
    vTip = (p < 0.999 && (grp < 1.5 || grp > 5.5)) ? 1. : 0.;
    // the stroke in hand at the draw-front (cream, the instrument's line) ends in a red head: the pen's point
    vHead = (grp > 5.5 && grp < 6.5 && aT.w > 0.5) ? 1. : 0.;
    vCrawl = (uHidden < 0.5 && style > 0.5) ? 1. : 0.;
    // (hidden edges are a near thing: far below us they would stack into grey bands seen through the slab)
    float hid = 0.2 * (1. - smoothstep(60., 150., dist)) * nearK * mix(0.4, 1., smoothstep(90., 130., dist));
    // of the tower only the few floors just under the draw-front show through: further down, the dashes of floor
    // after floor line up into bands
    if (grp < 0.5) hid *= 1. - smoothstep(8., 34., uF - mix(A.y, E.y, position.x));
    vAlpha = alpha * (uHidden > 0.5 ? hid : 1.);
    vMpp = 1. / max(pxPerM, 1e-4);
    vCol = uCol[int(aS.z + 0.5)];
    if (grp > 0.5 && grp < 1.5 && aS.z > 0.5 && aS.z < 1.5) vCol *= uGhost;     // the idea of the tower, firmer when the world asks
    vec4 mvPosition = mv;
    #include <fog_vertex>
  }`;

const LINE_FRAG = /* glsl */`
  uniform float uTime; uniform vec3 uHeadCol;
  varying float vS, vLen, vEdge, vHalf, vStyle, vTip, vAlpha, vMpp, vCrawl, vHead; varying vec3 vCol;
  #include <fog_pars_fragment>
  void main() {
    float a = vAlpha * (1. - smoothstep(vHalf - 0.45, vHalf + 0.75, abs(vEdge)));
    if (vStyle > 0.5) {
      // dashes cut by arc length; the period doubles with distance so a dash never falls under ~5 px.
      // Drawn dashes (construction and centre-lines) creep along their line: the hand is still at work.
      float base = vStyle > 1.5 ? 5.0 : 2.6;
      float per = base * exp2(max(0., ceil(log2(max(vMpp * 9. / base, 1e-3)))));
      float f = fract((vS - vCrawl * uTime * 0.22 * per) / per);
      float on = vStyle > 1.5 ? max(step(f, 0.58), step(0.74, f) * step(f, 0.84)) : step(f, 0.6);
      a *= on;
    }
    if (a < 0.004) discard;
    // the travelling tip: the last 3 m (never less than ~5 px) of a line still being ruled is brighter
    float tip = vTip * (1. - smoothstep(0., max(3. + 5. * vHead, vMpp * (5. + 5. * vHead)), vLen - vS));
    vec3 col = mix(vCol * (1. + 1.7 * tip), uHeadCol, vHead * smoothstep(0.15, 0.6, tip));
    gl_FragColor = vec4(col, a);
    #include <fog_fragment>
  }`;

function lineMaterial(U, hidden) {
  return new THREE.ShaderMaterial({
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, fog: true, transparent: true, depthWrite: false,
    depthTest: true, depthFunc: hidden ? THREE.GreaterDepth : THREE.LessEqualDepth,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uF: U.uF, uU: U.uU, uTime: U.uTime, uRes: U.uRes, uM: U.uM, uTier: U.uTier, uCol: U.uCol, uRound: U.uRound, uBow: U.uBow, uGhost: U.uGhost, uHeadCol: U.uHeadCol, uHidden: { value: hidden ? 1 : 0 } },
  });
}

// Paper-coloured faces of the Spire: they hide what is behind (so hidden edges can be dashed) and carry the
// hatching. Tops follow the draw-front in the vertex shader, so the tower is a solid only below it.
function buildFills(tiers, U, pal, round) {
  const pos = [], nor = [], aT = [], idx = [];
  const quad = (pts, n, tr) => {
    const b = pos.length / 3;
    for (const p of pts) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); aT.push(tr[0], tr[1], tr[2], p[3]); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  tiers.forEach((t, i) => {
    const h = t.half - 0.6, nh = tiers[i + 1] ? tiers[i + 1].half : 0, tr = [t.y0, t.y1, nh];
    if (round) {
      // drums: each quarter in six facets with radial normals, and a 24-sided cap
      const NS = 6, b0 = pos.length / 3;
      for (let f = 0; f < 4; f++) for (let k = 0; k <= NS; k++) {
        const a = roundFace(f, h, -h + (2 * h * k) / NS);
        for (const top of [0, 1]) { pos.push(a[0], top ? t.y1 : t.y0, a[1]); nor.push(a[0] / h, 0, a[1] / h); aT.push(tr[0], tr[1], tr[2], top); }
      }
      for (let f = 0; f < 4; f++) for (let k = 0; k < NS; k++) { const b = b0 + (f * (NS + 1) + k) * 2; idx.push(b, b + 2, b + 3, b, b + 3, b + 1); }
      const c0 = pos.length / 3;                 // (a fan from one rim vertex: every vertex then carries the radius)
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; pos.push(Math.sin(a) * h, t.y1, Math.cos(a) * h); nor.push(0, 1, 0); aT.push(tr[0], tr[1], tr[2], 1); }
      for (let k = 1; k < 23; k++) idx.push(c0, c0 + k, c0 + k + 1);
      return;
    }
    for (let f = 0; f < 4; f++) {
      const a = onFace(f, h, -h), b = onFace(f, h, h);
      quad([[a[0], t.y0, a[1], 0], [b[0], t.y0, b[1], 0], [b[0], t.y1, b[1], 1], [a[0], t.y1, a[1], 1]], [FN[f][0], 0, FN[f][1]], tr);
    }
    quad([[-h, t.y1, h, 1], [h, t.y1, h, 1], [h, t.y1, -h, 1], [-h, t.y1, -h, 1]], [0, 1, 0], tr);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aTier', new THREE.Float32BufferAttribute(aT, 4));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 300, 0), 320);
  const m = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uF: U.uF, uP0: { value: pal[0] }, uP1: { value: pal[1] }, uP2: { value: pal[2] }, uInk: { value: pal[3] }, uCons: { value: pal[4] }, uCream: { value: pal[5] }, uNight: U.uNight, uRound: U.uRound },
    vertexShader: /* glsl */`
      attribute vec4 aTier; uniform float uF;
      varying vec3 vP, vN, vWP; varying float vNext, vTop, vOpen, vHalfT, vTierY;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        float top = clamp(uF - 0.35, aTier.x, aTier.y);
        if (aTier.w > 0.5) p.y = top;
        if (uF - 0.35 <= aTier.x) p = vec3(0., aTier.x, 0.);
        vP = p; vN = normal; vNext = aTier.z; vTop = top; vOpen = step(top, aTier.y - 0.05); vHalfT = length(position.xz); vTierY = aTier.y;
        vWP = (modelMatrix * vec4(p, 1.)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uP0, uP1, uP2, uInk, uCons, uCream; uniform float uF, uNight, uRound;
      varying vec3 vP, vN, vWP; varying float vNext, vTop, vOpen, vHalfT, vTierY;
      #include <fog_pars_fragment>
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      // 45 degree hatching whose spacing doubles with distance (octaves cross-fade, lines stay ~6 px apart)
      float hatch(float q, float fw) {
        float base = 1.3, lv = log2(max(9. * fw / base, 1.)), l0 = floor(lv), fr = lv - l0;
        float s0 = base * exp2(l0), s1 = s0 * 2.;
        float d0 = abs(fract(q / s0 + 0.5) - 0.5) * s0, d1 = abs(fract(q / s1 + 0.5) - 0.5) * s1;
        float w = fw * 0.75;
        float h0 = 1. - smoothstep(w * 0.5, w * 1.5, d0), h1 = 1. - smoothstep(w * 0.5, w * 1.5, d1);
        return mix(h0, h1, smoothstep(0.35, 1., fr));
      }
      float rule(float d, float fw) { return 1. - smoothstep(fw * 0.6, fw * 1.6, abs(d)); }
      void main() {
        vec3 n = normalize(vN);
        bool cap = n.y > 0.5;
        float rad = max(length(vP.xz), 1e-3);
        // along-the-wall coordinate: straight faces, or the arc of a drum
        float t = uRound > 0.5 ? atan(vP.x, vP.z + (abs(vP.x) + abs(vP.z) < 1e-5 ? 1e-5 : 0.)) * rad : (abs(n.x) > 0.5 ? vP.z : vP.x);
        vec2 fc = cap ? vP.xz : vec2(t, vP.y);
        float q1 = (fc.x + fc.y) * 0.7071, q2 = (fc.x - fc.y) * 0.7071;
        vec3 fP = fwidth(vP);
        float fwW = max(max(fwidth(q1), fwidth(q2)), 1e-4), fwR = max((fP.x + fP.y + fP.z) * 0.6, 1e-4);
        float fw = (uRound > 0.5 && !cap) ? fwR : fwW;     // (the arc coordinate has a seam: use the position's own derivative)
        float mx = (uRound > 0.5 && !cap) ? vP.x - vP.z : fc.x;
        float mott = 0.5 + 0.25 * sin(mx * 0.021 + 1.3) * sin(fc.y * 0.017 + vP.z * 0.01) + 0.25 * sin(mx * 0.11 + fc.y * 0.07);
        float grain = hash(floor(vec2(mx, fc.y) * 3.)) - 0.5;
        // the conventional light falls from the upper left: faces turned from it (+X and -Z here) are hatched
        float shaded = cap ? 0. : smoothstep(0.2, 0.45, (n.x - n.z) * 0.7071);
        // a flat wash: faces to the light are pale, faces turned from it are the dark of the sheet, so the near face
        // is a tone and not a cage to be seen through; far below us the finished tower pales with distance
        float dC = length(vWP - cameraPosition);
        vec3 paper = cap ? mix(uP1, uP2, 0.26) : mix(mix(uP1, uP2, 0.45), uP0, shaded);
        paper *= 0.92 + 0.14 * mott + 0.05 * grain;
        paper = mix(paper, uP2, 0.45 * smoothstep(250., 1200., dC));
        float ink = 0.;
        vec3 col = paper;
        if (cap) {
          // terraces: cast shade of the tier above, cross-hatched
          float foot = uRound > 0.5 ? rad : max(abs(vP.x), abs(vP.z));
          float sh = step(abs(vP.x + vP.z), 2. * vNext) * step(-vNext, vP.x) * step(vP.z, vNext) * step(0.5, vNext);
          sh *= step(foot, 400.) * step(vNext, foot);
          ink = sh * max(hatch(q1, fwW), hatch(q2, fwW)) * step(0.01, uF - 3. - vTop) * (1. - vOpen);
          col = mix(paper, uInk * 0.6, ink * 0.6);
          // the slab in hand is a floor plan being drafted: the column grid in construction blue with a column
          // square at every node, the core in a double-ruled wall, cross-hatched, with its lift banks and stair, a
          // corridor round it and partitions out to the edge, an upstand and a margin line inside the edge, and the
          // footprint of the next setback set out in dashes
          vec2 f2 = max(fwidth(vP.xz), vec2(1e-4)); float f1 = max(f2.x, f2.y);
          vec2 gd = abs(fract(vP.xz / 6. + 0.5) - 0.5) * 6., gd2 = abs(fract(vP.xz / 12. + 0.5) - 0.5) * 12.;
          float grid = max(rule(gd.x, f2.x), rule(gd.y, f2.y)) * (1. - smoothstep(0.5, 1.6, f1));
          float hE = uRound > 0.5 ? vHalfT : vHalfT * 0.7071;           // the slab's half-width
          float ch = uRound > 0.5 ? vHalfT * 0.34 : vHalfT * 0.24;      // the core's
          float core = foot - ch;
          float fcr = max(fwidth(core), 1e-4);
          float coreL = max(rule(core, fcr * 1.3), rule(core + 0.9, fcr));
          float dg = min(abs(vP.x - vP.z), abs(vP.x + vP.z)) * 0.7071;
          float diag = rule(dg, max(fwidth(dg), 1e-4)) * step(core, 0.) * step(fract((vP.x + vP.z) * 0.25), 0.6);
          float marg = foot - hE + 2.4;
          float margL = max(rule(marg, fcr) * 0.7, rule(marg - 1.5, fcr) * 0.5);
          float stair = step(core, -1.) * rule(abs(fract(vP.x / 1.1 + 0.5) - 0.5) * 1.1, f2.x) * step(abs(vP.z), 2.2) * (1. - smoothstep(0.15, 0.5, f2.x));
          // columns: a small square at every node of the grid when near (every second node further off)
          float near1 = 1. - smoothstep(0.35, 1.1, f1), nearC = 1. - smoothstep(60., 95., dC);
          float colSq = mix(rule(max(gd2.x, gd2.y) - 0.75, f1), rule(max(gd.x, gd.y) - 0.6, f1), nearC) * step(0.5, core) * step(marg, -0.5) * near1;
          // lift shafts: two banks of cars inside the core
          float bz = abs(abs(vP.z) - ch * 0.6) - ch * 0.22, bx = abs(vP.x) - ch * 0.72, bank = max(bz, bx);
          float cw = max(ch * 0.36, 0.5);
          float lift = max(rule(bank, f1), rule((0.5 - abs(fract(vP.x / cw) - 0.5)) * cw, f2.x) * step(bank, 0.)) * step(core, -0.3) * near1;
          float liftX = rule(abs(abs(fract(vP.x / cw) - 0.5) * cw - abs(abs(vP.z) - ch * 0.6) * (cw / max(ch * 0.44, 0.1))), f1 * 1.2) * step(bank, 0.) * step(core, -0.3) * near1;
          // the core's walls are poche: cross-hatched between the shafts
          float coreHat = max(hatch(q1, fwW), hatch(q2, fwW)) * step(core, -0.9) * step(0.3, bank) * step(2.6, abs(vP.z));
          // a corridor round the core, and partitions from it out to the margin, one every other bay
          float corr = core - 3.2;
          float corrL = rule(corr, fcr) * step(marg, -1.);
          float part = (abs(vP.z) > abs(vP.x) ? rule(gd2.x, f2.x) : rule(gd2.y, f2.y)) * step(0., corr) * step(marg, 0.) * (1. - uRound) * (1. - smoothstep(0.5, 1.6, f1));
          // the next setback's footprint, dashed
          float sb = foot - vNext;
          float along = uRound > 0.5 ? atan(vP.x, vP.z + (abs(vP.x) + abs(vP.z) < 1e-5 ? 1e-5 : 0.)) * vNext : (abs(vP.x) > abs(vP.z) ? vP.z : vP.x);
          float setL = rule(sb, fcr * 1.3) * step(fract(along / 3.2), 0.55) * step(0.5, vNext) * step(vNext, hE - 3.5);
          col = mix(col, uCons * 0.75, clamp(max(grid * 0.26, coreHat * 0.42), 0., 1.) * vOpen);
          col = mix(col, uCons * 1.25, setL * 0.8 * vOpen);
          float white = max(max(max(coreL, margL), max(diag * 0.6, stair * 0.6)), max(max(colSq * 0.85, lift * 0.75), max(liftX * 0.45, max(corrL * 0.5, part * 0.42))));
          col = mix(col, uInk * 1.05, clamp(white, 0., 1.) * 0.8 * vOpen);
        } else {
          // hatching falls down the shaded faces just behind the front, with a ragged leading edge
          float edge = uF - 2. - 4. * (0.5 + 0.5 * sin(q1 * 0.83) * sin(q1 * 0.29 + 2.));
          float hatchInk = shaded * hatch(q1, fw) * smoothstep(0., 2.5, edge - vP.y);
          ink = 0.;
          // where the ruled floors and ticks have closed up on screen, their tone is carried here instead
          float fy = max(fP.y, 1e-4);
          float fl = abs(fract(vP.y / 3.8 + 0.5) - 0.5) * 3.8;
          float far = smoothstep(0.9, 2.0, fy);
          float tone = mix((1. - smoothstep(fy * 0.5, fy * 1.5, fl)) * 0.5 * smoothstep(0.45, 0.9, fy), 0.2, far) * step(vP.y, uF - 3.);
          ink = max(ink, tone * (1. - 0.6 * uNight));
          col = mix(paper, uInk * 0.6, ink);
          // (the hatching is ruled in construction blue, well under the white outline: shade, not more line)
          // Near the cage it is ruled firmly in pale ink; far below it sinks to a tone. Under the edge of each
          // finished terrace a second direction crosses it: cast shade
          float nearH = 1. - smoothstep(180., 350., dC);
          float xh = hatch(q2, fw) * smoothstep(vTierY - 12., vTierY - 9., vP.y) * step(vTierY, uF - 3.) * mix(0.75, 1., shaded);
          col = mix(col, mix(uCons * 0.85, uInk * 0.75, nearH), max(hatchInk, xh) * mix(0.45, 0.7, nearH));
        }
        if (uNight > 0.5 && !cap) {
          // night shift: window squares fill in a second behind the draw-front
          vec2 wc = vec2(t / 3.2, vP.y / 3.8), id = floor(wc), wf = abs(fract(wc) - 0.5);
          float wfw = max(fwidth(wc.x), fwidth(wc.y));
          float sq = (1. - smoothstep(0.22 - wfw, 0.22 + wfw, wf.x)) * (1. - smoothstep(0.26 - wfw, 0.26 + wfw, wf.y));
          // once the squares close up on screen their random lighting goes to its mean, or it turns to pixel noise
          float wk = smoothstep(0.14, 0.5, wfw);
          // near to, a lit window is drawn: ruled outline, mullion cross, a thin wash inside
          float inner = (1. - smoothstep(0.18 - wfw, 0.18 + wfw, wf.x)) * (1. - smoothstep(0.215 - wfw, 0.215 + wfw, wf.y));
          float mull = max(1. - smoothstep(wfw * 0.5, wfw * 1.6 + 0.012, wf.x), 1. - smoothstep(wfw * 0.5, wfw * 1.6 + 0.012, wf.y));
          float drawn = sq * max(max(1. - inner, mull * 0.75), 0.3);
          sq = mix(drawn, sq, smoothstep(0.035, 0.08, wfw));
          sq = mix(sq, 0.14, wk);
          // (the face normal is rounded before it seeds the hash: an interpolated 0.9999 would turn into pixel noise)
          float rr = hash(id + (uRound > 0.5 ? vec2(0.) : floor(n.xz + 0.5) * 3.));
          float on = mix(step(0.3, rr), 0.7, wk) * smoothstep(0., 3., uF - 6. - 14. * mix(fract(rr * 7.3), 0.5, wk) - vP.y);
          vec3 wcol = mix(uCream, uCons * 1.15, mix(smoothstep(0.3, 0.7, fract(rr * 5.3)), 0.5, wk));
          col = mix(col, wcol * mix(0.8 + 0.45 * fract(rr * 13.7), 1.05, wk), sq * on * 0.85);
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 1; mesh.frustumCulled = false;
  return mesh;
}

// The hero's own piece of paper: grain, exposure mottling, 10 m / 50 m grid, one fold crease, soft edge.
function buildSheet(U, pal) {
  const g = new THREE.CircleGeometry(900, 48); g.rotateX(-Math.PI / 2);
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uP0: { value: pal[0] }, uP1: { value: pal[1] }, uP2: { value: pal[2] }, uInk: { value: pal[4] } },
    vertexShader: /* glsl */`
      varying vec3 vP;
      #include <fog_pars_vertex>
      void main() { vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uP0, uP1, uP2, uInk; varying vec3 vP;
      #include <fog_pars_fragment>
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
      float grid(vec2 p, float s, vec2 fw) { vec2 d = abs(fract(p / s + 0.5) - 0.5) * s; vec2 l = 1. - smoothstep(fw * 0.4, fw * 1.4, d); return max(l.x, l.y); }
      void main() {
        vec2 p = vP.xz; float r = length(p);
        vec2 fw = max(fwidth(p), vec2(1e-4)); float f = max(fw.x, fw.y);
        float mott = vnoise(p * 0.004) * 0.6 + vnoise(p * 0.013 + 7.) * 0.3 + vnoise(p * 0.06) * 0.1;
        vec3 col = mix(uP0, uP1, 0.1 + 0.55 * mott);
        col *= 0.94 + 0.12 * vnoise(p * 1.7) * (1. - smoothstep(0.3, 1.5, f));
        float minor = grid(p, 10., fw * 0.7) * (1. - smoothstep(0.4, 1.6, f)) * 0.1;
        float major = grid(p, 50., fw * 0.7) * (1. - smoothstep(3., 12., f)) * 0.17;
        col = mix(col, uInk * 0.5, max(minor, major));
        // an old fold: a pale ridge with a darker valley beside it
        float c1 = p.x + 318., c2 = p.y - 262.;
        float fold = exp(-c1 * c1 * 0.08) - 0.6 * exp(-(c1 - 2.5) * (c1 - 2.5) * 0.05) + exp(-c2 * c2 * 0.08) - 0.6 * exp(-(c2 + 2.5) * (c2 + 2.5) * 0.05);
        col *= 1. + 0.55 * fold * (1. - smoothstep(1.5, 6., f));
        gl_FragColor = vec4(col, 1. - smoothstep(700., 895., r));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.position.y = -0.3; mesh.renderOrder = 0;
  return mesh;
}

// Compass choreography: where its two points are and which way its hinge leans, as a function of u.
function makeChoreography(G) {
  const A = new THREE.Vector3(), B = new THREE.Vector3(), hint = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), t3 = new THREE.Vector3(), e = new THREE.Vector3(), up = new THREE.Vector3(), H = new THREE.Vector3();
  const xa = new THREE.Vector3(), ya = new THREE.Vector3(), za = new THREE.Vector3();
  const P = G.P, C = G.C, ss = (a, b, x) => smoothstep(a, b, x);
  const swing = (out, pivot, from, ang) => { const dx = from.x - pivot.x, dz = from.z - pivot.z, c = Math.cos(ang), s = Math.sin(ang); return out.set(pivot.x + dx * c - dz * s, 0, pivot.z + dx * s + dz * c); };
  const th0 = Math.atan2(P[2].z - P[3].z, P[2].x - P[3].x), th1 = th0 - 255.6 * Math.PI / 180 - (th0 - 69.6 * Math.PI / 180);
  const sweepB = (out, s) => {            // lead lifted off the paper and swung round the needle, north about, over the hoist
    const k = ss(0, 0.4, s), th = lerp(th0, th1, ss(0, 1, s)), r = lerp(G.step, G.sweepR, k);
    return out.set(P[3].x + Math.cos(th) * r, G.sweepY * k, P[3].z + Math.sin(th) * r);
  };
  const K1A = new THREE.Vector3(175, 300, -20), K1B = new THREE.Vector3(45, 445, -100), K1H = new THREE.Vector3(0.55, 0.75, 0.2);
  const away = G.n.clone().multiplyScalar(0.55).add(new THREE.Vector3(0, 0.5, 0)).addScaledVector(new THREE.Vector3(-G.n.z, 0, G.n.x).normalize(), 0.66);
  // while it scribes the ring the compass stands nearly upright on the tilted circle, so that from the hoist its
  // two legs run up the picture and converge far above the ring (not end-on behind it)
  // (it leans well across the picture, up and to the right of the ring: -e1 is screen-right from the hoist, e2 up)
  const HF = G.n.clone().multiplyScalar(Math.cos(1.0)).addScaledVector(G.e1, -0.62 * Math.sin(1.0)).addScaledVector(G.e2, 0.78 * Math.sin(1.0)).normalize(), dirH = new THREE.Vector3();
  const BOW = 37; let bow = 0, now = 0;
  const bez = (out, a, b, c, k) => out.set(0, 0, 0).addScaledVector(a, (1 - k) * (1 - k)).addScaledVector(b, 2 * k * (1 - k)).addScaledVector(c, k * k);
  function state(u) {
    hint.copy(UP); bow = 0;
    if (u < 0.235) {                               // lead goes one and a half times round the needle at P1
      A.copy(P[1]); swing(B, P[1], P[0], G.sgn0 * Math.PI * 3 * clamp((u - 0.04) / 0.18, 0, 1));
    } else if (u < 0.42) {                         // needle steps half a turn round the lead at P2
      B.copy(P[2]); swing(A, P[2], P[1], G.sgn1 * Math.PI * ss(0.25, 0.4, u));
      A.y = 26 * Math.sin(Math.PI * ss(0.25, 0.4, u));
    } else if (u < 0.635) {
      A.copy(P[3]); sweepB(B, clamp((u - 0.44) / 0.195, 0, 1));
    } else if (u < 0.825) {                        // lifted off the paper, rising and turning point-down onto the centre-cross
      const lin = clamp((u - 0.635) / 0.18, 0, 1), k = (1 - Math.pow(1 - lin, 1.7)) * ss(0, 0.12, lin);
      bez(A, P[3], K1A, C, k);
      sweepB(t1, 1); t2.copy(C).addScaledVector(G.e1, 7); bez(B, t1, K1B, t2, k);
      bez(hint, UP, K1H, HF, k).normalize();
      bow = BOW * ss(0.25, 0.95, lin);
    } else {                                       // lead once round (0.825-0.90), then away up and to the right
      const a = Math.PI * 2 * clamp((u - 0.825) / 0.075, 0, 1), k = ss(0.955, 1.0, u), off = 620 * k * k;
      A.copy(C).addScaledVector(away, off);
      B.copy(C).addScaledVector(G.e1, Math.cos(a) * (7 + 60 * k)).addScaledVector(G.e2, Math.sin(a) * (7 + 60 * k)).addScaledVector(away, off * 1.04);
      hint.copy(HF); bow = BOW;
    }
  }
  // matrices for needle leg, lead leg and head from the two points and the lean
  function apply(u, M, time = 0) {
    state(u); now = time;
    // the hand that holds it is never quite still: the hinge drifts a few metres about its lean
    hint.x += 0.011 * Math.sin(now * 0.83) + 0.005 * Math.sin(now * 2.1); hint.z += 0.011 * Math.cos(now * 0.61); hint.normalize();
    e.copy(B).sub(A); const d = e.length();
    if (d < 1e-3) e.set(1, 0, 0); else e.multiplyScalar(1 / d);
    up.copy(hint).addScaledVector(e, -hint.dot(e));
    if (up.lengthSq() < 1e-6) up.set(0, 1, 0).addScaledVector(e, -e.y);
    up.normalize();
    // with its points close together the instrument may lean along the line between them (the lead is let out a
    // little to suit): the hinge then follows the hint itself, not only its part square to the points
    dirH.copy(up).lerp(hint, 1 - smoothstep(10, 80, d)).normalize();
    H.copy(A).add(B).multiplyScalar(0.5).addScaledVector(dirH, Math.sqrt(Math.max(LEG * LEG - d * d * 0.25, 1)));
    za.copy(e).cross(dirH).normalize();
    ya.copy(H).sub(A); const la = ya.length() / LEG; ya.normalize(); xa.copy(ya).cross(za).negate(); M[0].makeBasis(xa, ya.multiplyScalar(la), za).setPosition(A);
    ya.copy(H).sub(B); const lb = ya.length() / LEG; ya.normalize(); xa.copy(ya).cross(za); M[1].makeBasis(xa, ya.multiplyScalar(lb), za).setPosition(B);
    xa.copy(dirH).cross(za); M[2].makeBasis(xa, dirH, za).setPosition(H);
    return H;
  }
  return { apply, A, B, get bow() { return bow; } };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('drafted-city-hero') : ctx.rng;
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE;
  const pal = hex.map((h) => new THREE.Color(h));
  const tiers = tierSpec(rng);
  // per-seed draughtsmanship: bay rhythm, belt courses, window symbol, bracing, crown, planting
  const V = {
    bay: rng.range(5.4, 7.2), pier: rng.pick([2, 3, 4]), paired: rng.chance(0.5), belt: rng.pick([3, 4, 4, 5]),
    win: rng.pick([0, 1, 1, 2]), winW: rng.range(0.16, 0.26), braced: tiers.map((t, i) => i > 0 && rng.chance(0.4)),
    crown: rng.pick([0, 1]), buttress: rng.chance(0.5), arches: rng.pick([5, 7]), treeGap: rng.range(7, 11), plazaTrees: rng.pick([36, 44, 52]),
  };
  V.gothic = opts.cast === 'gothic'; V.round = opts.cast === 'drums';
  if (V.round) { V.buttress = false; V.paired = false; }
  const G = stage(rng, tiers);
  const L = makeLines();
  buildSpire(L, rng, tiers, V);
  await ctx.yield?.();
  buildPlaza(L, rng, tiers, G, V, { hoistLine: !!opts.hoistLine });
  buildCompass(L, rng);
  buildDerricks(L);
  buildFront(L, V);
  await ctx.yield?.();

  const nHid = L.hid.length / 14, nAll = nHid + L.vis.length / 14;
  const data = new Float32Array(nAll * 14); data.set(L.hid, 0); data.set(L.vis, L.hid.length);
  const col = [
    pal[3].clone().multiplyScalar(1.6), pal[4].clone().multiplyScalar(0.62), pal[5].clone().multiplyScalar(1.4),
    pal[6].clone().multiplyScalar(2.0), pal[3].clone().lerp(pal[4], 0.35).multiplyScalar(0.95),
  ];
  const U = {
    uF: { value: 0 }, uU: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
    uM: { value: [new THREE.Matrix4(), new THREE.Matrix4(), new THREE.Matrix4()] },
    uTier: { value: tiers.map((t) => new THREE.Vector3(t.y0, t.y1, t.half)) }, uCol: { value: col }, uNight: { value: opts.night ? 1 : 0 }, uRound: { value: V.round ? 1 : 0 }, uBow: { value: 0 }, uGhost: { value: 1 },
    uHeadCol: { value: pal[6].clone().multiplyScalar(2.0) },      // the pen's point: draughtsman's red, a few metres of it
  };
  const object = new THREE.Group(); object.name = 'drafted-city-hero';
  const fills = buildFills(tiers, U, pal, V.round); object.add(fills);
  if (opts.sheet !== false) object.add(buildSheet(U, pal));
  const gAll = lineGeometry(data, nAll), gHid = lineGeometry(data, nHid);
  gHid.setAttribute('aA', gAll.getAttribute('aA')); gHid.setAttribute('aB', gAll.getAttribute('aB'));
  gHid.setAttribute('aS', gAll.getAttribute('aS')); gHid.setAttribute('aT', gAll.getAttribute('aT'));
  const lines = new THREE.Mesh(gAll, lineMaterial(U, false)); lines.renderOrder = 3; lines.frustumCulled = false;
  const hidden = new THREE.Mesh(gHid, lineMaterial(U, true)); hidden.renderOrder = 2; hidden.frustumCulled = false;
  object.add(hidden, lines);

  const chor = makeChoreography(G);
  let progress = opts.progress ?? 0.63, frontOverride = null;
  const size = new THREE.Vector2();
  function refresh() {
    U.uU.value = progress;
    U.uF.value = frontOverride ?? drawFrontAt(progress);
    chor.apply(progress, U.uM.value, U.uTime.value);
    U.uBow.value = chor.bow;
  }
  refresh();

  const eye = (x, y, z, tx, ty, tz) => ({ position: new THREE.Vector3(x, y, z), target: new THREE.Vector3(tx, ty, tz) });
  const anchors = {
    portalSeat: { position: G.C.clone(), normal: G.n.clone(), radius: 7 },
    ringCentre: G.C.clone(),
    flyThrough: G.fly.map((p) => p.clone()),
    hoistStart: G.fly[0].clone(),
    viewpoints: {
      entry: eye(0, 10, 520, 0, 300, 0),
      climb: eye(G.fly[7].x, G.fly[7].y, G.fly[7].z, 0, G.fly[7].y - 40, 0),
      crown: eye(G.S.x, G.S.y, G.S.z, G.C.x, G.C.y, G.C.z),
    },
    compassStand: G.P[3].clone(),
    scribed: { center: G.P[1].clone(), radius: G.step },
    plazaRadius: 130,
    tiers: tiers.map((t) => ({ y0: t.y0, y1: t.y1, half: t.half })),
    round: V.round,
    drawFrontAt,
  };

  return {
    object, radius: 330, height: 600, center: new THREE.Vector3(0, 290, 0), anchors,
    ground: false, groundY: 0,
    setProgress(u) { progress = clamp(u, 0, 1); refresh(); },
    setDrawFront(y) { frontOverride = y == null ? null : y; refresh(); },
    setGhost(k) { U.uGhost.value = k; },
    get progress() { return progress; },
    update(dt, time, camera) {
      U.uTime.value = time; refresh();
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); if (size.x > 0) U.uRes.value.copy(size); }
    },
    dispose() { gHid.dispose(); },
  };
}

// HAND-OFF: HOW THE STYLE IS DONE (so the world can match it)
// - Lines: instanced quads, one per segment (attributes: two end points, width in metres, style
//   solid/dashed/dash-dot, rank heavy/medium/faint, colour index, birth and completion values). The vertex
//   shader shortens the segment to its drawn fraction, expands it to a screen-facing ribbon never thinner
//   than 2.0 / 1.5 / 1.15 px (by rank) plus a 1 px antialias skirt, and dims lines that are thinner than
//   their minimum instead of letting them add up. The fragment shader cuts dashes by arc length (period
//   doubling with distance), brightens the last 3 m while the line is still being ruled (the travelling
//   tip), and fades construction lines once their fadeAt value is passed.
// - Colours (linear, premultiplied by intensity): white x1.6, construction blue x0.5, cream x1.4, red x2.0,
//   detail white-blue x0.95. Heavy 0.24 m, medium 0.13 m, faint 0.08 m (compass lines are 1.6-2x).
// - Faces: paper colour (mix of palette 0 and 1), depth-writing, hatched at 45 degrees on faces turned
//   from the upper-left light (+X and -Z here), cross-hatched in cast shade; hatch spacing steps in octaves
//   from fwidth so it stays ~6 px apart. Hidden edges: the structural lines drawn again with GreaterDepth,
//   dashed, at 20 %. Tower detail lines carry their spacing and fade when neighbours close to under ~6 px
//   on screen; the faces' tone takes over. The slab outline at the draw-front (group 6) follows uF.
