// The Night the Kurbits Grew: a midsummer white night painted on pine boards in Dalecarlian kurbits style.
// Everything is a separate double-loaded brush stroke (the hero part's stroke shader) on bare painted boards.
// Nothing is lit; post is flat (no tone map), so every pixel is a pot colour or the ground coat.
import * as THREE from 'three';
import { makePath, bell } from '../kit/core.js';
import * as K from '../parts/kurbits-night.js';

const PI = Math.PI, TAU = PI * 2;
const { POT, KIND } = K;
const { RED, OCHRE, CHALK, SOOT, BLUE, GREEN } = POT;
const HERO_AT = [0, 0, 330];
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// pace: lingering on the lake, a little quicker in the street, hurrying up the spiral, easing into the ring
function pace(u) {
  return 0.65 + 0.15 * sstep(0.15, 0.2, u) + 0.45 * sstep(0.3, 0.37, u) - 0.35 * sstep(0.86, 0.94, u);
}

// blossom discs to steer round: world centre, horizontal azimuth of the sheet, radius
function fallbackDiscs() {
  const out = [];
  for (let i = 0; i < K.TIER_Y.length; i++) {
    const reach = K.TIER_REACH[i], k = reach / 60, R = 27 * k, xb = reach - 25.5 * k, al = (i - 1) * PI / 4;
    for (const sg of [1, -1]) out.push({ x: -Math.cos(al) * xb * sg, y: K.TIER_Y[i] + 17 * k + 2.5, z: Math.sin(al) * xb * sg, r: R });
  }
  return out;
}

// the route: lake, street, a veer out to the east of the urn, one and a quarter turns round the stem
// (pushed out round every blossom rim), a hook in from the west and 70 m dead straight, 60 degrees up, into the ring
function buildRoute(discs, ringAt, ringAxis) {
  const H = [];                                             // horizontal points [x, z, kind]
  const lead = [[0, 0], [0, 40], [0, 80], [0, 120], [0, 160], [0, 195], [0, 225], [0, 255], [8, 281], [27, 300]];
  for (const p of lead) H.push([p[0], p[1], 0]);
  const E = [ringAt[0] - ringAxis[0] * 70, ringAt[1] - ringAxis[1] * 70, ringAt[2] - ringAxis[2] * 70];
  const rho = 26, hc = [E[0], E[2] + rho];                  // the hook's centre (heading +X at E)
  const f0 = -0.33, f1 = 2.5 * PI, n = 46;
  const spiral = [];
  for (let i = 0; i <= n; i++) spiral.push(f0 + (f1 - f0) * i / n);
  const radiusAt = (f, y) => {
    let r = 60 - 8 * sstep(PI, 2.5 * PI, f) - 6 * (1 - sstep(-0.33, 0.5, f));
    for (const d of discs) {
      const dr = Math.hypot(d.x, d.z), az = Math.atan2(d.z, d.x);
      let da = (f - az) % TAU; if (da > PI) da -= TAU; if (da < -PI) da += TAU;
      const dy = (y - d.y) / (d.r + 12);
      if (Math.abs(dy) >= 1 || Math.abs(da) > 1.1) continue;
      const need = dr + d.r * Math.sqrt(1 - dy * dy * 0.8) + 14;
      const w = Math.exp(-da * da / 0.16) * (1 - dy * dy);
      r = Math.max(r, r + (need - r) * Math.min(w * 1.6, 1));
    }
    return r;
  };
  let ys = spiral.map((f) => 22 + 250 * (f - f0) / (f1 - f0));
  let pts = null, yE = E[1];
  for (let pass = 0; pass < 3; pass++) {
    const P = H.map((p) => [p[0], p[1]]);
    const i0 = P.length;
    for (let i = 0; i < spiral.length; i++) { const f = spiral[i], r = radiusAt(f, ys[i]); P.push([r * Math.cos(f), HERO_AT[2] + r * Math.sin(f)]); }
    for (const a of [1.25, 1.5, 1.75]) P.push([hc[0] + rho * Math.sin(a * PI), hc[1] - rho * Math.cos(a * PI)]);
    P.push([E[0], E[2]]);
    // heights: level over the lake, up the three baselines, then one steady slope solved to arrive at E, steepening at the hook
    const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const s0 = S[i0 - 2], sE = S[P.length - 1], yStreet = (z) => 4 + 7 * sstep(170, 215, z) + 5.5 * sstep(222, 258, z) + 5.5 * sstep(262, 296, z);
    const y0 = yStreet(P[i0 - 2][1]);
    const rise = (slope) => { let y = y0, out = [];
      for (let i = 0; i < P.length; i++) {
        if (i <= i0 - 2) { out.push(yStreet(P[i][1])); continue; }
        const sm = (S[i] + S[i - 1]) / 2, k = slope * sstep(s0, s0 + 50, sm), kk = k + (1.732 - k) * sstep(sE - 60, sE - 4, sm);
        y += kk * (S[i] - S[i - 1]); out.push(y);
      } return out; };
    let lo = 0.3, hi = 1.2, Y = null;
    for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; Y = rise(mid); if (Y[Y.length - 1] > yE) hi = mid; else lo = mid; }
    ys = Y.slice(i0, i0 + spiral.length);
    pts = P.map((p, i) => [p[0], Y[i], p[1]]);
  }
  pts[pts.length - 1] = E;
  for (const k of [23.3, 46.6]) pts.push([E[0] + ringAxis[0] * k, E[1] + ringAxis[1] * k, E[2] + ringAxis[2] * k]);
  pts.push(ringAt.slice());
  return pts;
}

export default {
  id: 'kurbits-night',
  name: 'The Night the Kurbits Grew',
  category: 'sky',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, density = vary.density || 1;
    const scene = new THREE.Scene();
    // ---- seeded edition: ground coat (also the hour), flower cast, weather, herd
    const hour = vary.hour || 'any';
    const coat = hour === 'night' ? 1 : hour === 'dawn' ? 2 : rng.pick([0, 0, 1, 2]);
    const cast = rng.pick(['gourd', 'bell', 'rose']);
    const weather = rng.pick(['still', 'pollen', 'breeze']);
    const ochreHerd = rng.chance(0.4);
    const rare = !!vary.rare;
    const pots = K.POTS.slice();
    if (coat === 1) pots[0] = '#18233A';
    if (coat === 2) pots[0] = '#D0BD92';
    scene.background = new THREE.Color(pots[0]);
    const breeze = weather === 'breeze' ? 1 : 0;
    const style = K.makeStyle(pots, { rankStep: 150, breeze });
    const mat = K.strokeMaterial(style);
    // extra clocks: same program, own uniforms (wave rows repaint in turn; wings beat on a fast idle clock)
    const sub = (o = {}) => { const s = K.makeStyle(pots, { rankStep: 150, breeze, ...o }); return { style: s, mat: K.strokeMaterial(s) }; };
    await ctx.yield();

    // ---- the boards: lake laid flat, a wall round the viewer, a lid overhead
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000).rotateX(-PI / 2), K.boardMaterial(style, { mode: 0, plank: 14 }));
    lake.position.set(0, 0, 300); scene.add(lake);
    const WR = 1000, lidY = WR * Math.tan(50 * PI / 180);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, lidY + 400, 64, 6, true).translate(0, (lidY - 400) / 2, 0),
      K.boardMaterial(style, { mode: 1, plank: 2, far: true, knots: 1.7, knotSize: 2 }));
    const lid = new THREE.Mesh(new THREE.CircleGeometry(WR, 64).rotateX(PI / 2).translate(0, lidY, 0), K.boardMaterial(style, { mode: 2, plank: 2, far: true, knots: 1.7, knotSize: 2 }));
    const dome = new THREE.Group(); dome.add(wall, lid);
    for (const m of [wall, lid]) { m.frustumCulled = false; m.renderOrder = -1; }
    scene.add(dome);
    await ctx.yield();

    // ---- the hero: the kurbits on the green
    let hero = null, heroErr = '';
    if (typeof K.buildHero === 'function') {
      try { hero = await K.buildHero(ctx, { palette: pots, style, cast, stem: coat === 2 ? 'red' : 'blue', backdrop: false, detail,
        // the top tier's blossoms wait for us: they are laid as we pass between them, so the ring is first seen whole, clear of them;
        // the fifth tier's liner and dots land as we pass its rim (30 to 32 s); the stem reaches the top and the crown is begun
        // by 30 s (its first twelve petals at once, eighteen by u 0.93, the last on arrival), so the ring is on the lid
        // above the tiers for the whole last third of the flight; the seventh tier's fans wait until we have looked up at it
        schedule: { tiers: K.SCHEDULE.tiers.map((t, i) => (i === 7 ? [31, 39.3, 40.5, 36.9] : i === 6 ? [t[0], 37.6, 38.6, 35.6] : i === 4 ? [t[0], 29, 32] : t)), crown: [30, 41.55], crownKnots: [[0, 0], [11, 0.12], [17, 0.8], [23, 1]] } }); }
      catch (e) { heroErr = String(e && e.message || e); hero = null; }
    }
    if (hero && hero.object) { hero.object.position.set(HERO_AT[0], HERO_AT[1], HERO_AT[2]); scene.add(hero.object); hero.object.updateMatrixWorld(true); }
    await ctx.yield();
    const A = (hero && hero.anchors) || {};
    const ringAt = [0, 410, 330], ringAxis = [0.5, 0.8660254, 0];
    const yStreet = (z) => 4 + 8 * sstep(165, 205, z) + 5.5 * sstep(215, 250, z) + 5.5 * sstep(258, 292, z);
    let route;
    if (A.flyThrough && A.flyThrough.length > 20) {
      // the artist's line round the stem (hero space), joined to the lake and the street
      // (the street rises a little above the baselines and holds the axis past the third one, so that the urn is looked
      // down on between two house fronts; then it swings out east of the urn to meet the spiral)
      route = [[0, 4, 0], [0, 4, 45], [0, 4, 90], [0, 4, 135], [0, 4.6, 170], [0, 9, 200], [0, 16, 228], [0, 22.5, 256], [1, 25.5, 282], [6, 27, 296], [22, 29, 312], [42, 31, 332]];
      const fly = A.flyThrough;
      for (let i = 2; i < fly.length - 1; i++) {
        const p = fly[i], ph = Math.atan2(p.z, p.x);
        if (i < 12 && (ph < 0.42 || p.y < 30)) continue;      // join the spiral a little north of east
        route.push([p.x + HERO_AT[0], p.y + HERO_AT[1], p.z + HERO_AT[2]]);
      }
    } else {
      const discs = fallbackDiscs().map((d) => ({ ...d, y: d.y + HERO_AT[1], x: d.x + HERO_AT[0] }));
      route = buildRoute(discs, ringAt, ringAxis);
    }
    const path = makePath(route);
    const entryPose = path.frameAt(0).clone();                 // the engine's own entry pose: where the mount waits while u is 0
    await ctx.yield();
    // journey seconds at u (the painter's timetable is in journey seconds)
    const JT = new Float32Array(129); { let acc = 0; for (let i = 1; i <= 128; i++) { acc += 1 / pace((i - 0.5) / 128); JT[i] = acc; } for (let i = 0; i <= 128; i++) JT[i] *= 42 / acc; }
    const journey = (u) => { const x = Math.min(Math.max(u, 0), 1) * 128, i = Math.min(Math.floor(x), 127); return JT[i] + (JT[i + 1] - JT[i]) * (x - i); };
    const clockAt = (u) => journey(u) + 5.5 * (1 - sstep(0, 0.2, u));

    // ---- books. "south": sheets that keep their fronts to us (group turned to face -Z at rest);
    // "bill": sheets that turn freely; "flat": fixed sheets.
    const south = K.makeStrokeBook(), bill = K.makeStrokeBook(), flat = K.makeStrokeBook();
    const faced = (x, y, z, face = 0.61, base = {}) => K.sheet(south, [0, 0, 0], [1, 0, 0], [0, 1, 0], { face, piv: [-x, y, -z], rank: 99, ...base });
    const turning = (book, x, y, z, base = {}) => K.sheet(book, [0, 0, 0], [1, 0, 0], [0, 1, 0], { face: 7, piv: [x, y, z], rank: 99, ...base });
    const T = 'tear', D = 'dot';                                 // strips: D (8 segments) for small strokes
    // the midsummer sun rests on the far shore 40 degrees to port of the entry course, 5 degrees up. Nothing tall may
    // stand in its lane: the sight lines to it from the lake course (z 0 to 112), widened by the sun's own radius
    const SUN = [868, 112, 1034];
    const inSunLane = (x, z, hw) => {
      for (let zc = 0; zc <= 112; zc += 4) {
        if (z - zc < 5) continue;
        const d = Math.hypot(x, z - zc);
        if (Math.abs(Math.atan2(x, z - zc) - Math.atan2(SUN[0], SUN[2] - zc)) < 0.085 + hw / d) return true;
      }
      return false;
    };
    // the three baselines: ochre ground bands with a chalk dot row, each 6 m higher than the last
    const BASE = [[200, 6], [245, 12], [290, 18]];
    const hsh = (a, b = 0) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };   // a fixed seed for a new stroke (no rng draw)
    for (const [bz, by] of BASE) {
      // the band itself, laid flat under the row and pulled with a broad brush outward from the street: for every 34 m two
      // overlapping ochre pulls, each with a fat rounded head and a dry, streaky tail that lets the boards through, the
      // nearer one loaded with green or chalk along its near edge. The first pull beside the street is a narrow one (the
      // house fronts there stand on their own foot bands). From the climb the village stands on three ochre stripes.
      const G = K.sheet(flat, [0, by - 0.9, bz - 1], [1, 0, 0], [0, 0, -1], { rank: 99 });
      for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) {
        const x0 = sx * (12 + k * 34), ang = sx > 0 ? 0 : PI, nar = k === 0 ? 0.55 : k === 1 ? 0.8 : 1;
        G.put({ x: x0, y: 0.9 * nar, ang, len: 41, wid: 3.5 * nar, kind: KIND.S, c3: 0.012 * sx, a: OCHRE, b: (k + (sx > 0 ? 0 : 1)) % 2 ? CHALK : GREEN, split: 0.25 * sx, coat: 0, seed: hsh(bz, x0), dry: 0.75, strip: T });
        if (k < 6) G.put({ x: x0 + sx * 7, y: -1.2 * nar, ang, len: 34, wid: 3.0 * nar, kind: KIND.S, c3: -0.012 * sx, a: OCHRE, b: OCHRE, coat: 0, seed: hsh(bz + 3, x0), dry: 0.9, strip: D });
      }
      for (let x = -246; x < 240; x += 34) {
        if (Math.abs(x + 17) < 20) continue;                 // the street
        const S = faced(x + 17, by, bz, 0.25);
        // (beside the street the house fronts stand on their own foot bands: no standing pull there, only its dot row)
        const pull = { x: -19, y: -1.6, ang: 0, len: 38, wid: 3.3, kind: KIND.S, c3: 0.05, a: OCHRE, b: x % 3 ? CHALK : GREEN, split: 0.3, coat: 0, seed: rng(), dry: 0.8, strip: T };
        if (Math.abs(x + 17) > 60) S.put(pull);
        for (let d = 0; d < 6; d++) S.put({ x: -16 + d * 6.2, y: -2.2, ang: PI / 2, len: 1.1 - d * 0.05, wid: 1.1 - d * 0.05, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.6, seed: rng(), dry: 0 });
      }
    }
    // houses in frontal elevation: a Falu-red wall of four broad flat strokes standing square on the baseline, full-height
    // chalk corner boards, a closed gable under the soot roof line, an upright ochre door in a chalk frame, and square
    // windows, each a chalk liner frame with a liner cross over a dark pane (thirteen rng draws per house, as before)
    function house(x, by, z, w, h) {
      const S = faced(x, by, z, 0.61), wh = h * 0.66, R = []; for (let k = 0; k < 13; k++) R.push(rng());
      let si = 0; const sd = () => { const v = (R[si % 13] + 0.31 * Math.floor(si / 13)) % 1; si++; return v; };
      const line = (x0, y0, x1, y1, wid, o = {}) => S.put({ x: x0, y: y0, ang: Math.atan2(y1 - y0, x1 - x0), len: Math.hypot(x1 - x0, y1 - y0), wid, kind: KIND.LINER, a: CHALK, coat: 2, seed: sd(), dry: 0.25, strip: D, rank: 4, ...o });
      for (let k = 0; k < 4; k++) S.put({ x: -w / 2 + (k + 0.5) * w / 4, y: 0, ang: PI / 2, len: wh + 0.9, wid: w / 4 * 1.8, kind: KIND.LINER, a: RED, b: RED, coat: 0, seed: sd(), dry: 0.3, strip: T });
      const gl = (h - wh) / 0.73;                              // the gable: a teardrop whose widest part lies along the eave
      S.put({ x: 0, y: wh - 0.27 * gl, ang: PI / 2, len: gl, wid: w * 1.1, kind: KIND.TEAR, a: RED, b: RED, coat: 0, seed: sd(), dry: 0.15, strip: T });
      S.put({ x: -w / 2 - 1.2, y: wh - 0.8, ang: Math.atan2(h - wh + 1, w / 2 + 1.2), len: Math.hypot(h - wh + 1, w / 2 + 1.2) + 0.6, wid: 1.3, kind: KIND.S, a: SOOT, b: SOOT, coat: 2, seed: sd(), dry: 0.5, mirror: true, strip: T });
      for (const sx of [-1, 1]) line(sx * (w / 2 - 0.25), 0, sx * (w / 2 - 0.25), wh - 0.3, 0.85, { coat: 1, rank: 6, dry: 0.4 });
      const dw = 2.1, dh = Math.max(h * 0.36, 3.6);            // the door: upright, ochre, in a chalk frame
      S.put({ x: 0, y: 0, ang: PI / 2, len: dh + 0.3, wid: dw * 1.25, kind: KIND.LINER, a: OCHRE, b: OCHRE, coat: 1, seed: sd(), dry: 0.2, strip: D, rank: 8 });
      line(-dw / 2 - 0.1, 0, -dw / 2 - 0.1, dh, 0.3); line(dw / 2 + 0.1, 0, dw / 2 + 0.1, dh, 0.3); line(-dw / 2 - 0.3, dh, dw / 2 + 0.3, dh, 0.3);
      S.put({ x: dw * 0.28, y: dh * 0.45, ang: PI / 2, len: 0.42, wid: 0.42, kind: KIND.DOT, a: SOOT, coat: 2, z: 0.1, rank: 2.5, seed: sd(), dry: 0 });
      const win = (cx, cy, ws) => {                            // a square window: dark pane, chalk frame, liner cross
        S.put({ x: cx, y: cy - ws * 0.56, ang: PI / 2, len: ws * 1.12, wid: ws * 1.12, kind: KIND.DOT, a: BLUE, b: SOOT, split: 0.2, coat: 1, rank: 5, seed: sd(), dry: 0 });
        const q = ws / 2, e = 0.16;
        line(cx - q - e, cy - q, cx + q + e, cy - q, 0.36); line(cx - q - e, cy + q, cx + q + e, cy + q, 0.36);
        line(cx - q, cy - q, cx - q, cy + q, 0.36); line(cx + q, cy - q, cx + q, cy + q, 0.36);
        line(cx, cy - q, cx, cy + q, 0.2, { z: 0.1, rank: 3 }); line(cx - q, cy, cx + q, cy, 0.2, { z: 0.1, rank: 3 });
      };
      const ws = Math.min(2.3, w * 0.2), wy = Math.max(wh * 0.56, ws / 2 + 1.5);
      for (const sx of [-1, 1]) win(sx * w * 0.3, wy, ws);
      if (h >= 11) win(0, wh + (h - wh) * 0.3, ws * 0.62);     // an attic light in the taller gables
      S.put({ x: w * 0.22, y: h * 0.86, ang: PI / 2, len: h * 0.2, wid: 1.4, kind: KIND.S, a: SOOT, b: RED, coat: 1, seed: sd(), strip: T, rank: 6 });   // chimney
      // it stands on its baseline: one broad ochre pull across the wall's foot, fat-headed, green along its lower edge,
      // running out dry past the far corner, with a row of chalk dots along it
      S.put({ x: -w / 2 - 3.5, y: -0.75, z: 0.3, ang: 0, len: w + 8, wid: 2.9, kind: KIND.S, c3: 0.015, a: OCHRE, b: GREEN, split: -0.3, coat: 2, seed: hsh(x, z), dry: 0.7, strip: T });
      for (let d = 0; d < 5; d++) S.put({ x: (d - 2) * (w + 2) / 5, y: -1.2, z: 0.4, ang: PI / 2, len: 0.9, wid: 0.9, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.6, seed: 0.5, dry: 0 });
      return [x - w * 0.22, by + h * 1.06, z];
    }
    const chimneys = [];
    const HOUSES = [[0, 19, 12, 11], [0, -19, 13, 12], [0, 47, 11, 9.5], [0, -49, 12, 10], [0, -142, 12, 13], [0, -82, 11, 11],
      [1, 18.5, 12, 13], [1, -19, 11, 10], [1, 46, 13, 11], [1, -45, 11, 12.5], [1, 76, 11, 9], [1, -110, 12, 11],
      [2, 19, 12, 12, 6], [2, -18.5, 12, 14], [2, 68, 11, 10], [2, 112, 12, 11]];   // (the last house to port of the street stands 6 m back on its band, so it and the urn are both whole from the saddle)
    for (const [row, x, w, h, dz = 0] of HOUSES) chimneys.push(house(x, BASE[row][1], BASE[row][0] + dz, w, h));
    await ctx.yield();
    // the white church, plain, with a blue onion cap of two C-strokes
    {
      const S = faced(-66, 18, 290, 0.61);
      for (let k = 0; k < 3; k++) S.put({ x: -6 + k * 6, y: k % 2 ? 15 : 0.2, ang: k % 2 ? -PI / 2 : PI / 2, len: 15, wid: 8.4, kind: KIND.S, a: CHALK, b: CHALK, coat: 0, seed: rng(), dry: 0.3, strip: T });
      S.put({ x: 0, y: 13, ang: PI / 2, len: 10, wid: 6.2, kind: KIND.S, a: CHALK, b: CHALK, coat: 1, seed: rng(), dry: 0.2, strip: T });
      S.put({ x: 0, y: 21.5, ang: 0.25, len: 9.5, wid: 3.4, kind: KIND.C, c1: 2.6, a: BLUE, b: CHALK, split: 0.3, coat: 2, seed: rng(), mirror: true });
      S.put({ x: 0, y: 27.5, ang: PI / 2, len: 3.2, wid: 0.5, kind: KIND.LINER, a: SOOT, coat: 2, seed: rng(), rank: 5 });
      S.put({ x: -1.1, y: 29.4, ang: 0, len: 2.2, wid: 0.5, kind: KIND.LINER, a: SOOT, coat: 2, seed: rng(), rank: 5 });
      S.put({ x: 0, y: 0.2, ang: PI / 2, len: 5.5, wid: 2.6, kind: KIND.S, a: BLUE, b: SOOT, split: 0.5, coat: 2, seed: rng(), strip: T, rank: 8 });
      for (const wx of [-5.5, 5.5]) S.put({ x: wx, y: 6, ang: PI / 2, len: 4, wid: 1.5, kind: KIND.TEAR, a: BLUE, b: SOOT, coat: 2, seed: rng(), strip: T, rank: 5 });
    }
    // birches along the baselines: a chalk S trunk with soot ticks and a mirrored fan of green teardrops
    const nBirch = Math.round(60 * Math.min(density, 1.15));
    for (let i = 0; i < nBirch; i++) {
      const row = i % 3, side = i % 2 ? 1 : -1, slot = Math.floor(i / 6);
      let x = side * (31 + slot * 21 + rng.range(-4, 4) + row * 7);
      const H = rng.range(20, 30), lean = breeze * 0.12;
      if (x > 0 && inSunLane(x, BASE[row][0] + 5, H * 0.3)) x = -(x + 10.5);   // a birch in the sun's lane stands on the starboard side instead
      const S = faced(x, BASE[row][1], BASE[row][0] + 5, 0.4);
      S.put({ x: 0, y: -1, ang: PI / 2 - lean, len: H, wid: 2.0, kind: KIND.S, c3: 0.1 * side, a: CHALK, b: CHALK, coat: 0, seed: rng(), dry: 0.5, strip: D });
      for (let k = 0; k < 3; k++) S.put({ x: -0.8, y: 2 + k * H * 0.14, ang: 0.2, len: 1.5, wid: 0.5, kind: KIND.LINER, a: SOOT, coat: 2, rank: 2.5, seed: rng(), strip: D });
      for (let k = 0; k < 4; k++) { const f = k / 3;
        S.put({ x: 0.3 + lean * H * (0.4 + 0.5 * f), y: H * (0.42 + 0.5 * f), ang: 0.55 - 1.25 * (1 - f) + 0.5 * f, len: H * (0.36 - 0.14 * f), wid: H * 0.115, kind: KIND.TEAR, c1: -0.5,
          a: GREEN, b: k % 2 ? CHALK : OCHRE, split: 0.3, coat: 1, seed: rng(), anim: 2.5 + 3 * breeze, mirror: true, strip: D, rank: k % 2 ? 9 : 30 }); }
      S.put({ x: lean * H, y: H * 0.9, ang: PI / 2 - lean, len: H * 0.2, wid: H * 0.09, kind: KIND.TEAR, a: GREEN, b: CHALK, split: 0.2, coat: 1, seed: rng(), anim: 2, strip: D });
      if (i % 12 === 0) await ctx.yield();
    }
    // roadside flowers down the street, nodding in turn; reeds at the shore; a fence of chalk ticks; the boat
    const nFl = Math.round(22 * detail * Math.min(density, 1.2));
    for (let j = 0; j < nFl; j++) for (const sx of [-1, 1]) {
      const z = 196 + j * (100 / nFl) + (sx > 0 ? 2 : 0), S = turning(bill, sx * 8.6, yStreet(z) - 7.6, z, { rank: 3 }), ph = (j * 0.09) % 1, hot = (j + (sx > 0 ? 1 : 0)) % 2;
      S.put({ x: 0, y: 0, ang: PI / 2, len: 2.7, wid: 0.5, kind: KIND.S, c1: 0.25, a: GREEN, b: GREEN, coat: 0, seed: ph, anim: 7, strip: D });
      S.put({ x: 0.1, y: 0.7, ang: 0.5, len: 1.5, wid: 0.6, kind: KIND.TEAR, c1: 0.7, a: GREEN, b: CHALK, split: 0.3, coat: 1, seed: ph, mirror: true, strip: D });
      S.put({ x: 0.3, y: 2.3, ang: PI / 2, len: 1.5, wid: 1.5, kind: KIND.DOT, a: hot ? RED : OCHRE, b: CHALK, split: 0.4, coat: 2, seed: rng(), dry: 0 });
    }
    for (let i = 0; i < Math.round(46 * detail); i++) {
      const x = (i % 2 ? 1 : -1) * (11 + rng.range(0, 190)), S = faced(x, 0.2, rng.range(178, 194), 0.4, { rank: 4 });
      for (let k = 0; k < 4; k++) { const r = { x: (k - 1.5) * 1.3 + rng.range(-0.4, 0.4), y: 0, ang: PI / 2 + rng.range(-0.25, 0.25), len: rng.range(3, 6.5), wid: 0.55, kind: KIND.TEAR, c1: rng.range(-0.5, 0.5),
        a: GREEN, b: k % 2 ? OCHRE : GREEN, coat: 1, seed: rng(), anim: 3 + 3 * breeze, strip: D };
        if (i % 5 !== 4) S.put(r); }                           // (every fifth clump is left out: its strokes went into the ground bands)
    }
    for (const sx of [-1, 1]) for (let c = 0; c < 4; c++) {
      const S = faced(sx * (31 + c * 26), 6, 198.5, 0.25, { rank: 3 });
      for (let k = 0; k < 9; k++) S.put({ x: -10 + k * 2.4, y: 0.3, ang: PI / 2, len: 2.3, wid: 0.6, kind: KIND.TEAR, a: CHALK, b: CHALK, coat: 2, z: 0.6, seed: rng(), strip: D });
      S.put({ x: -11, y: 1.7, ang: 0, len: 22, wid: 0.35, kind: KIND.LINER, a: CHALK, coat: 2, z: 0.7, seed: rng() });
    }
    {
      const S = faced(-36, 0.4, 187, 0.5, { rank: 9 });
      S.put({ x: -6.5, y: 2.6, ang: -0.55, len: 14, wid: 2.9, kind: KIND.C, c1: 1.1, a: RED, b: CHALK, split: -0.2, coat: 1, seed: rng() });
      S.put({ x: -6.3, y: 2.9, ang: -0.3, len: 13, wid: 0.4, kind: KIND.LINER, c1: 0.6, a: SOOT, coat: 2, seed: rng(), rank: 4 });
      S.put({ x: 1, y: 2.2, ang: 1.2, len: 7.5, wid: 0.4, kind: KIND.LINER, a: OCHRE, coat: 2, seed: rng(), rank: 4 });
    }
    await ctx.yield();
    // the red horses: bigger than any house, side-on in elevation, turning their fronts toward us
    const herdOchre = ochreHerd && coat !== 2;                  // on the cream coat the herd is always Falu red
    const hBody = herdOchre ? OCHRE : RED, hTrim = herdOchre ? RED : BLUE;
    function horse(x, z, H, m) {
      const s = H / 16, S = faced(x, 0, z, 0.55);
      const P = (r) => S.put({ seed: rng(), strip: r.kind === KIND.TEAR || r.kind === KIND.S ? T : undefined, ...r, x: r.x * m * s, y: r.y * s, len: r.len * s, wid: r.kind === KIND.LINER ? r.wid : r.wid * s,
        ang: m > 0 ? r.ang : PI - r.ang, c1: (r.c1 || 0) * m, c2: (r.c2 || 0) * m, c3: (r.c3 || 0) * m, split: (r.split || 0) * m, a: m > 0 ? r.a : (r.b ?? r.a), b: m > 0 ? (r.b ?? r.a) : r.a });
      const body = { a: hBody, b: hBody, coat: 0, dry: 0.3 };
      P({ ...body, x: -11, y: 11.5, ang: 0.28, len: 22, wid: 10, kind: KIND.C, c1: -0.56 });
      P({ ...body, x: -7.5, y: 7.6, ang: PI / 2, len: 9.6, wid: 9.6, kind: KIND.DOT });
      P({ ...body, x: 6.5, y: 8, ang: PI / 2, len: 9, wid: 9, kind: KIND.DOT });
      P({ ...body, x: 5.2, y: 12, ang: 1.08, len: 14, wid: 8.4, kind: KIND.S, c3: 0.06 });
      const hs = rng(), nod = { x: 10.4, y: 25.6, ang: -0.74, c1: -0.25, anim: 5, seed: hs };
      P({ ...body, x: 10.2, y: 21.3, ang: PI / 2, len: 5.8, wid: 5.8, kind: KIND.DOT, dry: 0.1 });
      P({ ...body, ...nod, len: 9.4, wid: 5.6, kind: KIND.DOT, strip: 'stroke', dry: 0.1 });
      P({ ...body, x: 9.5, y: 26.0, ang: 1.95, len: 4.2, wid: 1.9, kind: KIND.TEAR });
      P({ ...body, x: 11.5, y: 26.6, ang: 1.4, len: 4.0, wid: 1.8, kind: KIND.TEAR });
      P({ ...body, x: 6.4, y: 10.5, ang: -PI / 2 + 0.03, len: 10.6, wid: 3.8, kind: KIND.S });
      P({ ...body, x: 9.6, y: 10.8, ang: -0.95, len: 10, wid: 3.6, kind: KIND.TEAR, c1: -1.3, anim: 5 });
      P({ ...body, x: -5.8, y: 10.5, ang: -PI / 2 + 0.1, len: 10.6, wid: 3.9, kind: KIND.S });
      P({ ...body, x: -11.3, y: 10.6, ang: -PI / 2 - 0.24, len: 10.8, wid: 3.8, kind: KIND.S });
      P({ x: -11.6, y: 15.2, ang: -2.3, len: 11, wid: 2.8, kind: KIND.C, c1: 1.0, a: hBody, b: SOOT, split: 0.3, coat: 0, anim: 3 });
      const trim = { a: hTrim, b: CHALK, split: 0.15, coat: 2, rank: 9 };
      for (let k = 0; k < 3; k++) P({ ...trim, x: -1.5 + k * 1.6, y: 17.4, ang: -PI / 2 + (k - 1) * 0.5, len: 6.4, wid: 2.7, kind: KIND.TEAR });
      for (let k = 0; k < 5; k++) P({ ...trim, x: 6.6 + Math.cos(1.08) * (2.5 + k * 2.3) - 2.9, y: 12.5 + Math.sin(1.08) * (2.5 + k * 2.3) + 1.6, ang: 3.3, len: 3.6, wid: 1.5, kind: KIND.TEAR, rank: 6 });
      for (let k = 0; k < 7; k++) P({ x: 2.6, y: 15.4 - k * 1.25, ang: PI / 2, len: 0.95, wid: 0.95, kind: KIND.DOT, a: CHALK, coat: 2, rank: 3, dry: 0 });
      for (let k = 0; k < 6; k++) P({ x: -12 + k * 1.5, y: 14.6 + 1.7 * Math.sin(k * 0.5), ang: PI / 2, len: 0.9 - k * 0.06, wid: 0.9 - k * 0.06, kind: KIND.DOT, a: CHALK, coat: 2, rank: 3, dry: 0 });
      P({ x: -8.5, y: 10.5, ang: 0.5, len: 9, wid: 0.4, kind: KIND.LINER, c1: 1.3, c2: 4.6, a: CHALK, coat: 2, rank: 5, anim: 1 });
      for (let k = 0; k < 3; k++) P({ ...trim, x: -5.5, y: 11, ang: 1.0 + k * 0.75, len: 3.6, wid: 1.5, kind: KIND.TEAR, rank: 6 });
      P({ ...nod, x: 11.3, y: 26.0, len: 7.4, wid: 0.4, kind: KIND.LINER, a: CHALK, coat: 2, rank: 6, dry: 0 });
      P({ x: 14.6, y: 19.4, ang: 0.75, len: 3.4, wid: 0.4, kind: KIND.LINER, c1: 0.5, a: CHALK, coat: 2, rank: 5, dry: 0 });
      P({ x: 12.1, y: 22.3, ang: PI / 2, len: 1.1, wid: 1.1, kind: KIND.DOT, a: SOOT, coat: 2, rank: 5, dry: 0 });
      P({ x: -12.3, y: 15.9, ang: 0.28, len: 19, wid: 0.4, kind: KIND.LINER, c1: -0.56, a: CHALK, coat: 2, rank: 99, dry: 0 });
      for (let k = 0; k < 4; k++) P({ x: -13 + k * 6.6, y: 0.5 + (k % 2) * 0.6, ang: 0.6, len: 5.6, wid: 1.2, kind: KIND.C, c1: -1.2, a: CHALK, b: BLUE, split: 0.2, coat: 2, z: 1.2, rank: 7, anim: 3 });
    }
    // spread so that no two silhouettes merge from the entry: far ones nearer the axis, near ones outside them
    const HERD = [[60, 132, 15, 1], [31, 174, 16, 1], [186, 150, 22, 1], [150, 72, 24, 1],
      [-46, 100, 17, -1], [-34, 170, 17, -1], [-142, 150, 24, -1], [-112, 46, 19, -1], [-152, 86, 22, -1]];
    for (const h of HERD) horse(h[0], h[1], h[2], h[3]);
    await ctx.yield();
    // the far shore: a frieze of green teardrop spruces and ochre haycocks 1.4 km off all round (full strength, few strokes)
    for (let i = 0; i < 120; i++) {
      const az = (i / 120) * TAU, S = turning(bill, 1400 * Math.sin(az), 0, 300 + 1400 * Math.cos(az));
      S.put({ x: i % 2 ? -40 : 40, y: 9, ang: i % 2 ? 0 : PI, len: 80, wid: 20, kind: KIND.S, c3: 0.04, a: i % 3 ? GREEN : OCHRE, b: i % 3 ? OCHRE : GREEN, split: 0.4, coat: 0, seed: rng(), dry: 0.5, strip: 'pip' });
      S.put({ x: -20 + rng.range(-6, 6), y: 12, ang: PI / 2, len: rng.range(52, 84), wid: 25, kind: KIND.TEAR, a: GREEN, b: i % 4 ? GREEN : CHALK, split: 0.45, coat: 1, seed: rng(), dry: 0.4, strip: 'pip' });
      if (i % 2) S.put({ x: 16, y: 12, ang: PI / 2, len: rng.range(36, 56), wid: 19, kind: KIND.TEAR, a: GREEN, b: OCHRE, split: 0.55, coat: 1, seed: rng(), dry: 0.4, strip: 'pip' });
      else S.put({ x: 18, y: 13, ang: PI / 2, len: 26, wid: 28, kind: KIND.DOT, a: OCHRE, b: CHALK, split: 0.6, coat: 1, seed: rng(), dry: 0, strip: D });
    }
    // the midsummer sun: a chalk disc ringed by twelve ochre C-strokes, resting on the far shore; it gives no light
    {
      const S = turning(bill, SUN[0], SUN[1], SUN[2]);
      if (coat !== 1) S.put({ x: 0, y: -48, ang: PI / 2, len: 96, wid: 96, kind: KIND.DOT, a: CHALK, b: CHALK, coat: 0, seed: 0.3, dry: 0 });
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = coat === 1 ? 54 : 78;
        S.put({ x: Math.cos(a) * r, y: Math.sin(a) * r, ang: a + PI / 2 - 0.5, len: 39, wid: 19, kind: KIND.C, c1: 1.0, a: OCHRE, b: coat === 1 ? RED : CHALK, split: 0.35, coat: 1, seed: rng(), anim: 2 }); }
      if (coat === 1) for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * TAU; S.put({ x: Math.cos(a) * 84, y: Math.sin(a) * 84 - 6.5, ang: PI / 2, len: 13, wid: 13, kind: KIND.DOT, a: OCHRE, coat: 1, seed: rng(), dry: 0 }); }
    }
    // the cornice where wall meets lid: one Falu-red band between two rows of chalk dots (rides with the wall)
    const corn = K.makeStrokeBook();
    for (let i = 0; i < 48; i++) {
      const az = (i / 48) * TAU, Rc = 960, S = K.sheet(corn, [Rc * Math.sin(az), lidY * 0.96, Rc * Math.cos(az)], [Math.cos(az), 0, -Math.sin(az)], [0, 1, 0], { rank: 99 });
      S.put({ x: i % 2 ? -72 : 72, y: 0, ang: i % 2 ? 0 : PI, len: 144, wid: 84, kind: KIND.S, a: RED, b: RED, coat: 0, seed: rng(), dry: 0.4, strip: D });
      for (let d = 0; d < 3; d++) for (const sy of [-1, 1]) S.put({ x: (d - 1) * 42, y: sy * 70 - 13, ang: PI / 2, len: 26, wid: 26, kind: KIND.DOT, a: CHALK, coat: 1, seed: rng(), dry: 0, strip: 'pip' });   // (ten-sided: they are never more than 40 pixels across)
    }
    await ctx.yield();
    // ---- waves: rows of white-crested C-strokes that repaint themselves in turn (four row clocks), and chimney smoke
    const W = [0, 1, 2, 3].map(() => ({ ...sub(), book: K.makeStrokeBook() }));
    const WP = 8;
    {
      // each row is drawn in elevation, the way the style draws everything: its strokes stand on sheets leaning back
      // from the viewer (nearly flat in the lane under the wings, steeper to either side), chalk crest over a blue belly.
      // Rows repaint from the middle outward; odd rows are near rows only (distance means fewer strokes).
      const LEAN = [1.4, 1.1, 0.8];
      let row = 0, n = 0;
      for (let z = -34; z < 180; z += 5.5, row++) {
        const book = W[row % 4].book, off = (row % 2) * 4.2, reach = row % 2 ? 67 : row % 8 ? 120 : 360;
        const sh = LEAN.map((L) => K.sheet(book, [0, 0.35, z], [1, 0, 0], [0, Math.cos(L), Math.sin(L)]));
        for (let x = -360 + off; x < 360; x += (Math.abs(x) < 120 ? 6.3 : 30)) {
          const near = Math.abs(x) < 120, xx = x + rng.range(-1.2, 1.2), jz = rng.range(-0.8, 0.8), sd = rng(), tj = rng.range(0, 0.25);
          if (Math.abs(x) > reach || rng() > detail) continue;
          const ax = Math.abs(xx + 2.3), S = sh[ax < 7.5 ? 0 : ax < 16 ? 1 : 2];
          // (in the lane under the bird the crest takes two thirds of the brush, so the blue wing fans read against it; to either side the blue belly does)
          S.put({ x: xx, y: 0, z: jz, ang: 0.56, len: near ? 5.7 : 10, wid: near ? 1.65 : 3, kind: KIND.C, c1: -1.12, a: ax < 16 ? CHALK : BLUE, b: ax < 16 ? BLUE : CHALK, split: ax < 16 ? -0.05 : 0.05, coat: 1,
            rank: row % 2 ? 0.45 : row % 4 === 2 ? 0.9 : 7, seed: sd, t0: Math.abs(xx) / 360 * 2.4 + tj, dur: 0.4, dry: 0.4, anim: 2, strip: ax < 20 ? T : D });
          if (++n % 300 === 0) await ctx.yield();
        }
      }
      [0, 1, 3, 6, 7, 9, 12, 13].forEach((ci, j) => {
        const c = chimneys[ci], S = turning(W[j % 4].book, c[0], c[1], c[2], { rank: 8 });
        for (let k = 0; k < 3; k++) S.put({ x: (k - 1) * 0.8, y: k * 4.6, ang: PI / 2, len: 5.6, wid: 1.6 + k * 0.7, kind: KIND.S, c3: (k % 2 ? -0.45 : 0.45), a: CHALK, b: SOOT, split: 0.55, coat: 1, seed: rng(), t0: 0.6 + k * 1.5, dur: 0.6, dry: 0.9, strip: T });
      });
    }
    // four white swans of six strokes each, riding the lake
    const swanBook = K.makeStrokeBook();
    [[-12, 58, 1], [11, 104, -1], [-14, 139, 1], [10, 171, -1]].forEach(([x, z, m]) => {
      const S = turning(swanBook, x, 0.3, z, { rank: 9 }), P = (r) => S.put({ seed: rng(), ...r, x: r.x * m, ang: m > 0 ? r.ang : PI - r.ang, c1: (r.c1 || 0) * m, c3: (r.c3 || 0) * m, split: m > 0 ? (r.split || 0) : -(r.split || 0) - 1e-6 });
      P({ x: 2.6, y: 1.3, ang: PI, len: 6.6, wid: 3.2, kind: KIND.TEAR, a: CHALK, b: CHALK, coat: 0, dry: 0.3, strip: T });
      P({ x: 1.6, y: 2.2, ang: 2.5, len: 4.4, wid: 1.9, kind: KIND.TEAR, c1: 0.6, a: CHALK, b: BLUE, split: 0.5, coat: 1, anim: 3, strip: T });
      P({ x: 2.2, y: 1.6, ang: 1.2, len: 5.2, wid: 1.0, kind: KIND.S, c3: 0.5, a: CHALK, b: CHALK, coat: 1, anim: 2, strip: T });
      P({ x: 3.6, y: 5.3, ang: PI / 2, len: 1.3, wid: 1.3, kind: KIND.DOT, a: CHALK, coat: 1, dry: 0 });
      P({ x: 4.4, y: 6.1, ang: -0.5, len: 1.4, wid: 0.5, kind: KIND.TEAR, a: OCHRE, b: SOOT, split: 0.5, coat: 2, strip: T });
      P({ x: -4, y: 0.4, ang: 0.45, len: 8, wid: 1.4, kind: KIND.C, c1: -0.9, a: CHALK, b: BLUE, coat: 2, z: 0.5, anim: 3, strip: T });
    });
    // the lake seen from the climb: once we have left it (the paint clocks below stand at -1 until the street) it is
    // painted over as a whole field, in elevation like the village beside it: rows of standing C-strokes, a chalk crest
    // over a blue belly, each keeping its front to us, rows further off larger and wider apart (fewer strokes, never
    // paler ones); every row repaints itself from the middle outward on one of four clocks. No rng draw is made here.
    const LK = [0, 1, 2, 3].map(() => ({ ...sub(), book: K.makeStrokeBook() }));
    {
      let row = 0, n = 0;
      for (let z = 172; z > -235; row++) {
        const sc = 1 + Math.max(0, 60 - z) / 160, half = 40 + 250 * Math.sqrt(Math.max(1 - ((z - 40) / 262) ** 2, 0)), step = 17.5 * sc, book = LK[row % 4].book;
        for (let x = -half + (row % 2) * step * 0.5; x < half; x += step) {
          const h1 = hsh(x, z), h2 = hsh(z, x + 7);
          if (h2 > detail + 0.02) continue;
          const edge = (half - Math.abs(x)) / step;
          if (edge < 3 && hsh(x + 3, z + 1) > 0.4 + 0.2 * edge) continue;                 // the rows fray toward their ends: no line where the field stops
          const xx = x + (h1 - 0.5) * 3 * sc, S = turning(book, xx, 0.2, z + (h2 - 0.5) * 2.4 * sc), L = 14.5 * sc * (0.9 + 0.2 * h2);
          S.put({ x: -L * 0.46, y: 0.3, ang: 0.56, len: L, wid: 4.7 * sc, kind: KIND.C, c1: -1.12, a: BLUE, b: CHALK, split: 0.22, coat: 1, seed: h1,
            t0: Math.abs(xx) / 290 * 1.5 + h2 * 0.2, dur: 0.4, dry: 0.45, anim: 2, strip: D });
          if (++n % 300 === 0) await ctx.yield();
        }
        z -= 12.3 * sc;
      }
    }
    await ctx.yield();
    // ---- stroke birds: flat side views of fourteen teardrops; wings re-fan on a fast idle clock
    const fl = sub();
    function bird(S, bx, by, sc, m, col, o = {}) {
      const P = (r) => S.put({ seed: o.seed ?? 0.5, t0: o.t0, strip: D, rank: o.rank ?? 6, coat: 1, ...r, x: bx + r.x * m * sc, y: by + r.y * sc, len: r.len * sc, wid: r.wid * sc,
        ang: m > 0 ? r.ang : PI - r.ang, c1: (r.c1 || 0) * m, split: m > 0 ? (r.split || 0) : -(r.split || 0) - 1e-6, anim: (r.anim || 0) * (o.flap ?? 1) });
      if (!o.perched) for (let k = 0; k < 3; k++) P({ x: 0.45, y: 0.2, ang: 0.75 + k * 0.24, len: 1.6, wid: 0.5, kind: KIND.TEAR, c1: 0.7, anim: 20, a: col, b: col, coat: 0 });
      P({ x: 1.0, y: 0, ang: PI, len: 2.3, wid: 0.95, kind: KIND.TEAR, a: CHALK, b: col, split: -0.25 });
      P({ x: 1.05, y: -0.2, ang: PI / 2, len: 0.72, wid: 0.72, kind: KIND.DOT, a: col, dry: 0 });
      P({ x: 1.6, y: 0.2, ang: -0.15, len: 0.62, wid: 0.27, kind: KIND.TEAR, a: OCHRE, b: OCHRE, coat: 2 });
      for (let k = 0; k < 3; k++) P({ x: -1.05, y: 0.05, ang: PI + (k - 1) * 0.34, len: 1.35, wid: 0.46, kind: KIND.TEAR, a: k === 1 ? col : (col === BLUE ? RED : BLUE), b: CHALK, split: o.load ?? 0.2 });
      for (let k = 0; k < 5; k++) P({ x: 0.25 - k * 0.13, y: 0.25, ang: 1.2 + k * 0.29, len: 1.95 - k * 0.13, wid: 0.62, kind: KIND.TEAR, c1: 1.0, anim: 20, a: col === BLUE ? BLUE : (k % 2 ? col : BLUE), b: CHALK, split: o.load ?? 0.25, coat: 2 });
    }
    const birdCols = [RED, BLUE, OCHRE];
    const FLOCKS = [[0, 96, 13, 12, 0.16], [0, 330, 92, 62, -0.1], [0, 330, 84, 150, 0.09], [0, 330, 76, 236, -0.11], [0, 330, 70, 318, 0.1]];
    const perFlock = Math.max(4, Math.round(8 * Math.min(density, 1.25)));
    const flocks = FLOCKS.map(([cx, cz, R, y, w], gi) => {
      const book = K.makeStrokeBook(), ph = rng() * TAU;
      for (let i = 0; i < perFlock; i++) {
        const S = turning(book, R + rng.range(-9, 9), rng.range(-3.5, 3.5), rng.range(-16, 16), { rank: 6 });
        bird(S, 0, 0, 1.6, w > 0 ? 1 : -1, birdCols[(i + gi) % 3], { seed: rng.range(0.3, 0.9) });
      }
      return { book, cx, cz, y, w, ph, g: null };
    });
    // the escort: seven stroke birds that fly with us on the open side of the climb, strung out ahead of and beside the
    // port wing at different distances [degrees left of the gaze, degrees above it, metres]; each is its own small book,
    // placed from the camera in update() and drifting slowly forward and back against us
    const ESC = [[-40, 2, 30], [-31, 11, 38], [-23, 4, 50], [-36, 18, 58], [-17, 13, 66], [-27, -3, 44], [-43, 10, 34]];
    const escort = ESC.map((e, i) => {
      const book = K.makeStrokeBook(), S = turning(book, 0, 0, 0, { rank: 6 });
      bird(S, 0, 0, 1.5, -1, birdCols[i % 3], { seed: 0.3 + 0.6 * ((i * 0.37) % 1), load: 0.45 });   // seen small: the colour takes most of each feather, chalk its edge
      return { e, i, book, g: null };
    });
    // company for the ring: a dozen stroke birds wheeling round it in the ring's own plane (flat side views, so we see
    // them whole as we come up the axis), a few metres on our side of the petals; and a mirrored pair that is painted
    // on the top of its rim as the petals land
    const ringHold = new THREE.Group(); ringHold.position.set(ringAt[0], ringAt[1], ringAt[2]);
    ringHold.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ringAxis[0], ringAxis[1], ringAxis[2]));
    const ringBook = K.makeStrokeBook(), nRing = Math.max(10, Math.round(12 * Math.min(density, 1.25)));
    for (let i = 0; i < nRing; i++) {
      const a = (i + 0.35 * (i % 2)) / nRing * TAU, R = 23 + 15 * ((i * 0.618) % 1), ca = Math.cos(a), sa = Math.sin(a);
      const S = K.sheet(ringBook, [ca * R, -1.5 - 4 * ((i * 0.382) % 1), sa * R], [sa, 0, -ca], [ca, 0, sa], { rank: 6 });
      bird(S, 0, 0, 2.2, 1, birdCols[i % 3], { seed: 0.3 + 0.6 * ((i * 0.27) % 1) });
    }
    {
      const ax = new THREE.Vector3(ringAxis[0], ringAxis[1], ringAxis[2]), up = new THREE.Vector3(0, 0, 1).cross(ax).normalize();
      const o = new THREE.Vector3(ringAt[0], ringAt[1], ringAt[2]).addScaledVector(up, 18.6).addScaledVector(ax, -1.2);
      const S = K.sheet(flat, [o.x, o.y, o.z], [0, 0, 1], [up.x, up.y, up.z], { rank: 6 });
      for (const m of [1, -1]) bird(S, -m * 4.3, 0, 2.2, m, OCHRE, { t0: 38.3 + (m > 0 ? 0 : 0.5), flap: 0.1, perched: true, seed: 0.41, rank: 6 });
    }
    // pairs settle on every finished blossom, mirrored left and right (they are painted on when its last dot lands)
    if (A.tiers) A.tiers.forEach((t, ti) => t.blossoms.forEach((c, bi) => {
      const S = turning(bill, c.x + HERO_AT[0], c.y + HERO_AT[1] + t.radius * 0.93, c.z + HERO_AT[2], { rank: 5 });
      for (const m of [1, -1]) bird(S, -m * 4.2, 0, 2.3, m, birdCols[(ti + bi) % 3], { t0: t.done + 0.5 + (m > 0 ? 0 : 0.5), flap: 0.1, perched: true, seed: rng(), rank: 5 });
    }));
    // ---- company for the climb, by rules of the place (streams of their own, drawing from no other)
    const newRng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const rShoot = newRng('kurbits-shoots'), rBird = newRng('kurbits-company'), rGreen = newRng('kurbits-green'), rLake = newRng('kurbits-lake');
    const pv0 = new THREE.Vector3(), pv1 = new THREE.Vector3();
    // where the course first comes as far north as z (the share of the way flown there), found by walking the course
    const reachZ = (z) => { let q = 0; while (q < 1 && path.pointAt(q, pv0).z < z) q += 1 / 2048; return q; };
    const offCourse = (x, y, z) => path.distanceTo(x, y, z);
    // Side shoots. Every tier from the fifth to the seventh carries, on the sheet set square to it (where its sprig is, the one side
    // of the stem its own blossoms and its neighbours' leave free), two mirrored pairs of side shoots: a lower pair 4 m
    // above the tier's knot reaching nine tenths of the tier's reach, an upper pair 30 m above it reaching six tenths,
    // each an arm with leaflets, a liner and a dot row, a half-open flower a quarter of a blossom across (the lower pair the
    // tier's own flower, the upper pair the next tier's), and a long tendril with a dot row springing out beyond it.
    // Nothing of a shoot comes nearer the course than 7 m, and its flower's round stays 12 m off it (so that it is a
    // flower beyond the wing and never a mass under the rider): the arm is shortened until that is so.
    // Each is laid on in the four seconds after its tier's arms and leaves (from half a second past the first entry of
    // the tier's own row in the painter's timetable; the upper pair a second later), the mirror image half a step behind.
    if (A.tiers && K.PAINT) {
      const { FLOWERS, liner, tendril } = K.PAINT, sch = hero.schedule;
      for (let i = 4; i < 7; i++) {                             // (the top tier carries none: they would stand in the last straight's view of the crown)
        const t = A.tiers[i], k = t.reach / 60, nx = t.normal.x, nz = t.normal.z;
        for (let w = 0; w < 2; w++) {
          const y0 = t.y + (w ? 30 : 4), kind = A.tiers[Math.min(i + w, 7)].flower, Rb = 0.25 * t.radius, rise = 9 * k;
          let rb = t.reach * (w ? 0.6 : 0.9);
          for (let n = 0; n < 12; n++) {                        // the 7 m rule (both sides of the stem)
            const d = Math.min(offCourse(HERO_AT[0] + nx * rb, y0 + rise, HERO_AT[2] + nz * rb), offCourse(HERO_AT[0] - nx * rb, y0 + rise, HERO_AT[2] - nz * rb));
            if (d >= Rb + 12) break;
            rb -= 2.5;
          }
          const ts = sch.tiers[i][0] + 0.5 + 0.9 * w, tp = ts + 4.2, vary = { warm: rShoot.chance(0.5), n: 7, n2: 5, n3: 9, n4: 7 };
          const S = K.sheet(flat, [HERO_AT[0], y0, HERO_AT[2]], [nx, 0, nz], [0, 1, 0], { rank: 4 });
          // the arm: out from the stem and up under the flower
          const ex = rb - 0.35 * Rb, ey = rise - 0.75 * Rb, dx = ex - 1.5, c = 0.9, g = Math.atan2(ey, dx), L = Math.hypot(dx, ey) * (c / 2) / Math.sin(c / 2);
          const arm = { x: 1.5, y: 0, ang: g - c / 2, len: L, c1: c, wid: 3.0 * k, kind: KIND.S, a: BLUE, b: CHALK, split: -0.15, coat: 0, rank: 9, seed: rShoot(), dur: 0.8, dry: 0.6 };
          S.put({ ...arm, t0: ts, mirror: true, mirrorLag: 0.3 });
          S.put(liner({ ...arm, x: 2.2, y: -1, wid: 0.45, len: L * 0.94, kind: KIND.LINER, a: SOOT, b: SOOT, split: 0, coat: 2, rank: 3, z: 0.1, seed: rShoot(), t0: tp - 0.9, mirror: true, mirrorLag: 0.3, strip: T }));
          for (let j = 0; j < 3; j++) { const q = K.strokePoint(arm, 0.3 + j * 0.22);
            S.put({ x: q[0], y: q[1], ang: q[2] + (j % 2 ? -1.0 : 0.9), len: (8 - j * 1.4) * k, wid: (2.8 - j * 0.4) * k, kind: KIND.TEAR, c1: j % 2 ? 0.6 : -0.6, a: j % 2 ? OCHRE : GREEN, b: CHALK, split: 0.25, coat: 0, rank: 4,
              seed: rShoot(), t0: ts + 0.6 + j * 0.25, mirror: true, mirrorLag: 0.3, strip: D }); }
          for (let j = 0; j < 5; j++) { const q = K.strokePoint(arm, 0.14 + j * 0.15), sz = 1.3 * k * (1 - j * 0.09);
            S.put({ x: q[0], y: q[1] - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.4, z: 0.2, seed: rShoot(), t0: tp - 0.4 + j * 0.25, dur: 0.12, dry: 0, mirror: true, mirrorLag: 0.12 }); }
          // the tendril beyond the flower, with its dot row: shortened until its whole coil is 7 m clear of the course
          let tl = 0.42 * t.reach;
          for (let n = 0; n < 10; n++) {
            const tx = rb + 0.5 * Rb + 0.75 * tl;
            if (Math.min(offCourse(HERO_AT[0] + nx * tx, y0 + rise + 0.3 * tl, HERO_AT[2] + nz * tx), offCourse(HERO_AT[0] - nx * tx, y0 + rise + 0.3 * tl, HERO_AT[2] - nz * tx)) >= 7 + 0.3 * tl) break;
            tl *= 0.8;
          }
          const tq = { x: rb + 0.45 * Rb, y: rise - 0.5 * Rb, ang: 0.5, sgn: 1, len: tl, c1: 1.0, c2: 4.6, a: w ? SOOT : CHALK, wid: 0.42, rank: 3.5 };
          S.put({ ...tendril(rShoot, tq), t0: tp - 0.6, mirror: true, mirrorLag: 0.35 });
          for (let j = 0; j < 4; j++) { const q = K.strokePoint(tq, 0.08 + j * 0.1), sz = 1.2 * k * (1 - j * 0.1);
            S.put({ x: q[0] + 1.6, y: q[1] - 1.8 - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: w ? CHALK : OCHRE, coat: 2, rank: 2.4, z: 0.2, seed: rShoot(), t0: tp + 0.2 + j * 0.25, dur: 0.12, dry: 0, mirror: true, mirrorLag: 0.12 }); }
          // the half-open flowers: each keeps its face to us, turning on its own upright axis
          for (const sg of [1, -1]) {
            const B = turning(bill, HERO_AT[0] + sg * nx * rb, y0 + rise, HERO_AT[2] + sg * nz * rb, { rank: 4 }), F = { g: [], p: [], l: [], d: [], s: [] }, lag = sg > 0 ? 0 : 0.2;
            FLOWERS[kind](F, 0, 0, Rb * (kind === 'tulip' ? 0.8 : kind === 'bell' ? 0.84 : kind === 'peacock' ? 0.92 : 1), PI / 2 + sg * 0.3, rShoot, vary);
            const lay = (list, ta, tb, o) => list.forEach((r, j) => B.put({ ...r, ...o, strip: r.kind === KIND.DOT ? undefined : r.len > 6 ? T : D, t0: ta + lag + (tb - ta) * j / Math.max(list.length, 1) }));
            lay(F.p, ts + 0.9, tp - 0.7, { rank: 4 });
            lay(F.l.filter((r, j) => j % 3 === 0), tp - 0.7, tp + 0.1, { rank: 2.5 });
          }
        }
        await ctx.yield();
      }
    }
    // Great leaves over the course. The fifth, sixth and seventh tiers throw a third pair of scroll leaves, in the plane set
    // square to the next tier above (the one plane its neighbours leave free at that height): from the stem 8 m above
    // the tier's knot each arches out past the tier's reach, where the course winds, its tip uncurling, leaflets down
    // its back, a liner vein, a tendril and a dot row; it is shortened until no part of it is nearer the course than
    // 7 m. Laid on after the tier's own leaves (two and a half seconds past the first entry of its timetable row).
    if (A.tiers && K.PAINT) for (let i = 4; i < 7; i++) {      // (not the top tier: its leaf would hang across the last straight, before the crown)
      const t = A.tiers[i], al = t.angle + 0.75 * PI, lx = -Math.cos(al), lz = Math.sin(al), y0 = t.y + 8, ts = hero.schedule.tiers[i][0] + 2.5;
      const S = K.sheet(flat, [HERO_AT[0], y0, HERO_AT[2]], [lx, 0, lz], [0, 1, 0], { rank: 6 });
      let L = 1.3 * t.reach;
      for (let n = 0; n < 9; n++) {                             // (measured on the leaf's spine with a middling coil; the leaf itself is dealt once, below)
        const spine = { x: 1.5, y: 0, ang: 0.62, len: L, c1: -0.5, c2: -4.85 };
        let near = 1e9;
        for (let q = 0.3; q <= 1.001; q += 0.07) { const p = K.strokePoint(spine, q);
          near = Math.min(near, offCourse(HERO_AT[0] + lx * p[0], y0 + p[1], HERO_AT[2] + lz * p[0]), offCourse(HERO_AT[0] - lx * p[0], y0 + p[1], HERO_AT[2] - lz * p[0])); }
        if (near >= 7 + 0.08 * L + 2.5) break;
        L *= 0.9;
      }
      const F = { s: [], l: [], d: [] };
      K.PAINT.scrollLeaf(F, 1.5, 0, 0.62, L, 1, rShoot, { leaflets: 5 });
      F.s.forEach((r, j) => S.put({ ...r, t0: ts + (j ? 0.7 + j * 0.2 : 0), mirror: true, mirrorLag: 0.35 }));
      F.l.forEach((r, j) => S.put({ ...r, t0: ts + 2.6 + j * 0.5, mirror: true, mirrorLag: 0.35 }));
      F.d.forEach((r, j) => S.put({ ...r, t0: ts + 3.6 + j * 0.25, mirror: true, mirrorLag: 0.12 }));
    }
    await ctx.yield();
    // A wreath round the crown, in the ring's own plane, beyond its tendrils and dot rows: twelve great comma leaves
    // with a liner vein each, a red bud and a chalk dot between every two, mirrored left and right, laid on in pairs
    // from the foot of the ring upward once the crown's sepals are down (from two seconds past the crown's first petal).
    {
      const ax = new THREE.Vector3(ringAxis[0], ringAxis[1], ringAxis[2]), up = new THREE.Vector3(0, 0, 1).cross(ax).normalize();
      const S = K.sheet(flat, [ringAt[0] - ax.x * 0.6, ringAt[1] - ax.y * 0.6, ringAt[2] - ax.z * 0.6], [0, 0, 1], [up.x, up.y, up.z], { rank: 7 }), c0 = hero ? hero.schedule.crown[0] : 30;
      for (let k = 0; k < 12; k++) {
        const phi = PI / 2 + ((k + 0.5) / 12 - 0.5) * TAU, sg = Math.cos(phi) >= 0 ? 1 : -1, pr = Math.min(k, 11 - k), t0 = c0 + 2 + pr * 0.5 + (k < 6 ? 0 : 0.25), cx = Math.cos(phi), cy = Math.sin(phi);
        S.put({ x: cx * 31, y: cy * 31, ang: phi + 0.5 * sg, len: 16, wid: 5.6, kind: KIND.TEAR, c1: -0.75 * sg, a: GREEN, b: pr % 2 ? OCHRE : CHALK, split: 0.25 * sg, coat: 1, seed: rShoot(), t0, dry: 0.7, anim: 0.6, strip: D });
        S.put({ x: cx * 32.5, y: cy * 32.5, ang: phi + 0.42 * sg, len: 11, wid: 0.42, kind: KIND.LINER, c1: -0.6 * sg, a: SOOT, coat: 2, rank: 4, z: 0.1, seed: rShoot(), t0: t0 + 0.45, dur: 0.4, dry: 0.5, strip: D });
        const ph2 = phi - (TAU / 24) * sg;
        S.put({ x: Math.cos(ph2) * 30.5, y: Math.sin(ph2) * 30.5, ang: ph2, len: 7.5, wid: 3.4, kind: KIND.TEAR, a: RED, b: CHALK, split: 0.15 * sg, coat: 1, seed: rShoot(), t0: t0 + 0.7, dry: 0.5, strip: D });
        S.put({ x: Math.cos(ph2) * 40, y: Math.sin(ph2) * 40 - 0.75, ang: PI / 2, len: 1.5, wid: 1.5, kind: KIND.DOT, a: CHALK, coat: 2, rank: 3, seed: rShoot(), t0: t0 + 1, dur: 0.12, dry: 0 });
      }
      // and on the lid's boards beyond the wreath an outer round, the same rule larger: eight great comma leaves 40 m
      // long springing outward from 46 m, green into white, each with its liner vein, a chalk tendril coiling out
      // between every two and a row of five dots tapped outward beside it; laid on in pairs after the wreath
      for (let k = 0; k < 8; k++) {
        const phi = PI / 2 + ((k + 0.5) / 8 - 0.5) * TAU, sg = Math.cos(phi) >= 0 ? 1 : -1, pr = Math.min(k, 7 - k), t0 = c0 + 3.5 + pr * 0.6 + (k < 4 ? 0 : 0.3), cx = Math.cos(phi), cy = Math.sin(phi);
        S.put({ x: cx * 46, y: cy * 46, ang: phi + 0.4 * sg, len: 40, wid: 10, kind: KIND.TEAR, c1: -0.95 * sg, a: GREEN, b: CHALK, split: 0.3 * sg, coat: 1, seed: rShoot(), t0, dur: 0.6, dry: 0.75, anim: 0.5, strip: 'stroke' });
        S.put({ x: cx * 49, y: cy * 49, ang: phi + 0.34 * sg, len: 30, wid: 0.5, kind: KIND.LINER, c1: -0.8 * sg, a: SOOT, coat: 2, rank: 4, z: 0.1, seed: rShoot(), t0: t0 + 0.7, dur: 0.5, dry: 0.5, strip: 'tear' });
        const ph2 = phi - (TAU / 16) * sg;
        S.put({ ...K.PAINT.tendril(rShoot, { x: Math.cos(ph2) * 47, y: Math.sin(ph2) * 47, ang: ph2 - 0.3 * sg, sgn: sg, len: 27, a: CHALK, wid: 0.5 }), t0: t0 + 1.2 });
        for (let j = 0; j < 5; j++) { const r = 52 + j * 6.5, sz = 2.6 * (1 - j * 0.12), pd = ph2 + 0.1 * sg;
          S.put({ x: Math.cos(pd) * r, y: Math.sin(pd) * r - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: j % 2 ? OCHRE : CHALK, coat: 2, rank: 3, seed: rShoot(), t0: t0 + 1.9 + j * 0.25, dur: 0.12, dry: 0 }); }
      }
    }
    // Of the forty stroke birds a dozen and more fly with the climb: the escort's seven and these eight, which keep to
    // the lane between the blossoms' reach and the course, 14 to 60 m ahead of us and 2 to 9 m inward of the course at
    // different depths, weaving and changing places, so that they cross before the blossoms we are coming to. They join
    // as the course rises above the urn's mouth and leave as it turns in for the last straight (heights of the course,
    // read where we are). Flat side views of fourteen teardrops, two to three times 3 m.
    const climbBirds = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const book = K.makeStrokeBook(), S = turning(book, 0, 0, 0, { rank: 6 });
      bird(S, 0, 0, 1.9 + 0.13 * i, i % 2 ? 1 : -1, birdCols[(i + 1) % 3], { seed: rBird.range(0.3, 0.9), load: 0.35 });
      return { i, book, g: null, lead: 14 + 6 * i + rBird.range(0, 5), out: -(2 + 0.8 * i + rBird.range(0, 2)), amp: rBird.range(1.5, 3.5), w: rBird.range(0.5, 0.9), ph: rBird() * TAU, hi: rBird.range(-5, 8) };
    });
    const cb = { p: new THREE.Vector3(), r: new THREE.Vector3() };
    await ctx.yield();
    // The green goes on beyond its round, north of the third baseline: further rings of grass round the urn, each ring
    // a quarter further out than the last, their C-strokes standing in elevation (as the waves do) and growing with
    // the ring, so that further means fewer and larger; a flower by every fourth tuft of the three nearest rings and a
    // fence of chalk ticks round the green's rim. They are laid on ring by ring, outward, from the moment the course
    // crosses the third baseline (the painter reaches the green as we do).
    const passZ = (z) => { const q = reachZ(z); return K.journeyClock(q, 42) + 5.5 * (1 - sstep(0, 0.2, q)); };
    {
      const tg = passZ(BASE[2][0]), north = BASE[2][0] + 10;
      let k = 0, n = 0;
      for (let r = 68; r < 260; r = r * 1.24 + 5, k++) {
        const L = 5 + 0.06 * r, step = 2.1 * L + 4, cnt = Math.round(TAU * r / step), ph = rGreen() * TAU;
        for (let j = 0; j < cnt; j++) {
          const phi = ph + (j / cnt) * TAU, x = Math.cos(phi) * r, z = HERO_AT[2] + Math.sin(phi) * r, h1 = rGreen(), h2 = rGreen(), t0 = tg + k * 0.45 + ((j * 0.618) % 1) * 0.4;
          if (z < north || h2 > detail + 0.25) continue;
          const S = turning(bill, x + (h1 - 0.5) * 0.3 * L, 0.2, z, { rank: 99 }), l = L * (0.85 + 0.3 * h2);
          S.put({ x: -l * 0.46, y: 0.3, ang: 0.56, len: l, wid: 0.3 * l, kind: KIND.C, c1: -1.12, a: GREEN, b: h1 < 0.25 ? OCHRE : h1 < 0.55 ? CHALK : GREEN, split: 0.22, coat: 1, seed: h1, t0, dur: 0.4, dry: 0.5, anim: 0.4, strip: D });
          if (k < 3 && j % 4 === 0) {                          // a flower: three strokes and a dot, nodding
            const f = 1 + 0.35 * k, hot = (j / 4 + k) % 2;
            S.put({ x: 0.4 * l, y: 0, ang: PI / 2, len: 2.9 * f, wid: 0.55 * f, kind: KIND.S, c1: 0.25, a: GREEN, b: GREEN, coat: 0, seed: h2, anim: 7, t0: t0 + 0.3, strip: D });
            // its two leaves stand either side of the flower's own stem (x = 0.4 l on the tuft's sheet), mirror images of each other about it
            const leaf = { x: 0.4 * l + 0.1, y: 0.8 * f, ang: 0.5, len: 1.6 * f, wid: 0.65 * f, kind: KIND.TEAR, c1: 0.7, a: GREEN, b: CHALK, split: 0.3, coat: 1, seed: h2, t0: t0 + 0.45, strip: D };
            S.put(leaf);
            S.put({ ...leaf, x: 0.4 * l - 0.1, ang: PI - leaf.ang, c1: -leaf.c1, split: -leaf.split, seed: (h2 * 7.31 + 0.137) % 1 });
            S.put({ x: 0.4 * l + 0.3, y: 2.5 * f, ang: PI / 2, len: 1.7 * f, wid: 1.7 * f, kind: KIND.DOT, a: hot ? RED : OCHRE, b: CHALK, split: 0.4, coat: 2, seed: h1, t0: t0 + 0.6, dry: 0, strip: D });
          }
          if (++n % 60 === 0) await ctx.yield();
        }
      }
      for (let j = 0; j < 9; j++) {                            // the fence round the rim
        const phi = (j + 0.5) / 9 * PI, S = turning(bill, Math.cos(phi) * 63, 0.2, HERO_AT[2] + Math.sin(phi) * 63, { rank: 3 });
        if (HERO_AT[2] + Math.sin(phi) * 63 < north) continue;
        for (let q = 0; q < 5; q++) S.put({ x: -5 + q * 2.5, y: 0.2, ang: PI / 2, len: 2.4, wid: 0.65, kind: KIND.TEAR, a: CHALK, b: CHALK, coat: 2, z: 0.6, seed: rGreen(), t0: tg - 0.6 + j * 0.1 + q * 0.06, strip: D });
        S.put({ x: -6.2, y: 1.7, ang: 0, len: 12.4, wid: 0.35, kind: KIND.LINER, a: CHALK, coat: 2, z: 0.7, seed: rGreen(), t0: tg - 0.2 + j * 0.1, strip: D });
      }
    }
    await ctx.yield();
    // The far band is a frieze: at every fourth place round it a great spruce stands (few strokes, large), except in the sun's lane.
    for (let i = 0; i < 120; i += 4) {
      const az = ((i + 2) / 120) * TAU, x = 1400 * Math.sin(az), z = 300 + 1400 * Math.cos(az), h = rGreen.range(150, 200), sd = rGreen();
      if (inSunLane(x, z, 60)) continue;
      const S = turning(bill, x, 0, z);
      S.put({ x: 0, y: 10, ang: PI / 2, len: h, wid: 0.36 * h, kind: KIND.TEAR, a: GREEN, b: i % 8 ? GREEN : CHALK, split: 0.45, coat: 1, seed: sd, dry: 0.45, strip: D });
      S.put({ x: 0.2 * h, y: 10, ang: PI / 2 + 0.12, len: 0.62 * h, wid: 0.3 * h, kind: KIND.TEAR, a: GREEN, b: OCHRE, split: 0.5, coat: 1, seed: sd * 0.7 + 0.1, dry: 0.45, mirror: true, strip: D });
    }
    // From the foot of each blossom of the first tier (below it there is only the green) a pair of pendants hangs: a long tendril that coils at its
    // end, five comma leaves down it by turns to either side, growing smaller, a red bud near its tip and a dot row
    // tapped out beside it, laid on as we come up the street (from the moment the course crosses the first baseline,
    // the second blossom's pendants 1.4 s after the first's); shortened until it hangs 7 m clear of the course.
    let pendants = 0;
    if (A.tiers && K.PAINT) for (let i = 0; i < 1; i++) for (const c of A.tiers[i].blossoms) {
      const t = A.tiers[i], R = t.radius, fx = c.x + HERO_AT[0], fy = c.y + HERO_AT[1] - 0.9 * R, fz = c.z + HERO_AT[2];
      let len = 1.5 * R;
      for (let n = 0; n < 10 && offCourse(fx, fy - 0.6 * len, fz) < 7 + 0.5 * len; n++) len *= 0.85;
      const S = turning(bill, fx, fy, fz, { rank: 4 }), t0 = passZ(BASE[0][0]) + 1.4 * pendants++;
      const tq = { x: 1.2, y: 0.5, ang: -1.2, sgn: -1, len, c1: -0.5, c2: -5.2, a: i % 2 ? SOOT : CHALK, wid: 0.42 };
      S.put({ ...K.PAINT.tendril(rShoot, tq), t0, mirror: true, mirrorLag: 0.4 });
      for (let j = 0; j < 5; j++) { const q = K.strokePoint(tq, 0.08 + j * 0.11), f = 1 - 0.13 * j, sd = j % 2 ? 1 : -1;
        S.put({ x: q[0], y: q[1], ang: q[2] + sd * 0.95, len: 0.36 * len * f, wid: 0.13 * len * f, kind: KIND.TEAR, c1: -sd * 0.7, a: j === 4 ? RED : GREEN, b: j % 2 ? OCHRE : CHALK, split: 0.25 * sd, coat: 1, rank: 5,
          seed: rShoot(), t0: t0 + 0.4 + j * 0.45, anim: 1.5, mirror: true, mirrorLag: 0.15, strip: D }); }
      for (let j = 0; j < 4; j++) { const q = K.strokePoint(tq, 0.1 + j * 0.14), sz = 1.5 * (1 - j * 0.14);
        S.put({ x: q[0] + 2.4, y: q[1] - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: i % 2 ? CHALK : OCHRE, coat: 2, rank: 2.4, z: 0.2, seed: rShoot(), t0: t0 + 2.6 + j * 0.25, dur: 0.12, dry: 0, mirror: true, mirrorLag: 0.12 }); }
    }
    await ctx.yield();
    // What lives on every blossom that turns its face to us (the top tier's stand as they are laid). As the course comes by, the painter goes round its rim once more: a round of chalk
    // dots tapped out four a second from the foot up either side, begun a
    // second and a half before the course is nearest the blossom. And off its heart, once the blossom is painted, two
    // short rows of pollen dots are tapped out (eight dots, two seconds) and drift up and away, one row while the other
    // drifts, turn and turn about, for as long as we are in the world. Every tier's ochre rows and its chalk rows are a
    // piece of their own with a clock of their own (HP[2 i] and HP[2 i + 1]): they begin four tenths of a second after
    // the tier's own last dot (from: the vine's state t.done, as the rim's round above waits on it).
    const HP = [];
    if (A.tiers) for (let i = 0; i < 7; i++) for (const q of [0, 1]) HP.push({ ...sub(), book: K.makeStrokeBook(), g: null, q, from: A.tiers[i].done + 0.4 });
    if (A.tiers) for (let i = 0; i < 7; i++) for (const c of A.tiers[i].blossoms) {
      const t = A.tiers[i], R = t.radius, cx = c.x + HERO_AT[0], cy = c.y + HERO_AT[1], cz = c.z + HERO_AT[2];
      let un = 0, dn = 1e9;
      for (let q = 0; q <= 1; q += 0.002) { const d = path.pointAt(q, pv0).distanceToSquared(pv1.set(cx, cy, cz)); if (d < dn) { dn = d; un = q; } }
      const tn = Math.max(K.journeyClock(un, 42) - 1.5, t.done + 0.4), S = turning(bill, cx, cy, cz, { rank: 3 }), nd = 9;
      for (let j = 0; j < nd; j++) {
        const phi = -PI / 2 + (j + 0.5) / nd * PI, sz = R * 0.075 * (1 - 0.05 * j), rr = R * 1.0;
        S.put({ x: Math.cos(phi) * rr, y: Math.sin(phi) * rr - sz * 0.5, z: 0.6, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.4, seed: rLake(), t0: tn + j * 0.25, dur: 0.12, dry: 0, mirror: true, mirrorLag: 0.12 });
      }
      if (c === t.blossoms[0]) await ctx.yield();
      HP.slice(2 * i, 2 * i + 2).forEach((h, q) => {
        const P = turning(h.book, cx, cy, cz, { rank: 3 }), tilt = rLake.range(0.5, 1.1) * (q ? -1 : 1), sz = R * 0.085;
        for (let j = 0; j < 8; j++) P.put({ x: Math.sin(tilt) * (1 + j) * sz * 1.9, y: R * 0.12 + Math.cos(tilt) * (1 + j) * sz * 1.9 + 0.3 * Math.sin(j * 1.3), z: 1.5, ang: PI / 2, len: sz * (1 - 0.07 * j), wid: sz * (1 - 0.07 * j),
          kind: KIND.DOT, a: q ? CHALK : OCHRE, coat: 2, seed: rLake(), t0: j * 0.25, dur: 0.12, dry: 0, strip: 'pip' });
      });
    }
    // The first tier's blossoms each carry their mirrored pair of stroke birds, settled on the rim's two flanks since
    // the blossom was finished; they lift off across the petals as the course comes by (from three seconds before it
    // is nearest the blossom) and settle again when we have passed.
    const rimBirds = [];
    if (A.tiers) for (const c of A.tiers[0].blossoms) {
      const t = A.tiers[0], R = t.radius, cx = c.x + HERO_AT[0], cy = c.y + HERO_AT[1], cz = c.z + HERO_AT[2];
      let un = 0, dn = 1e9;
      for (let q = 0; q <= 1; q += 0.002) { const d = path.pointAt(q, pv0).distanceToSquared(pv1.set(cx, cy, cz)); if (d < dn) { dn = d; un = q; } }
      const book = K.makeStrokeBook(), S = turning(book, cx, cy, cz, { rank: 6 }), col = birdCols[rimBirds.length % 3], seed = rBird.range(0.3, 0.9);
      for (const sx of [-1, 1]) bird(S, sx * 0.86 * R, -0.42 * R, 3, sx, col, { seed, load: 0.35, t0: t.done + 0.4 });
      rimBirds.push({ book, g: null, tn: K.journeyClock(un, 42) });
    }
    await ctx.yield();
    // A long petal is met alone and close by on the climb (the bell's flaring strokes, the tulip's three great teardrops:
    // one and a half blossom-radii long, reaching out past the blossom's round). On the tiers that are painted while we
    // climb past them (the fourth and up) every such petal gets its vein and seeds straight after it is laid, not only
    // at the end with the tier's other liners: a chalk liner drawn down the petal's own line in one pull and three
    // soot dots tapped along it from the head, so that the petal reads as a petal while the rest of the flower is
    // still going on. The petal's line is the flower's own drawing asked for again without its seeded wobble (no
    // stream is drawn from for that), its moment its place in the tier's row of the timetable; all on a sheet that
    // lies on the tier's own and turns with the blossom.
    if (A.tiers && K.PAINT && hero && hero.schedule.facts) {
      const still = () => 0.5;
      still.range = (lo, hi) => (lo + hi) / 2;
      A.tiers.forEach((t, i) => {
        const f = hero.schedule.facts[i];
        if (i < 3 || !f) return;
        const F = { g: [], p: [], l: [], d: [], s: [] };
        K.PAINT.FLOWERS[t.flower](F, f.at[0], f.at[1], f.R, f.dir, still, f.vary);
        const O = [HERO_AT[0], HERO_AT[1] + t.y, HERO_AT[2]], S = K.sheet(flat, O, f.sheetX, [0, 1, 0], { piv: O, face: -1 });
        const step = (t.petals[1] - t.petals[0]) / (F.g.length + F.p.length), tw = f.turns ? { turn: f.at[0] } : {};
        F.p.forEach((r, j) => {
          if (r.kind === KIND.DOT || r.len < 1.4 * f.R) return;
          const tp = t.petals[0] + (F.g.length + j) * step, sl = Math.sin(r.lift || 0);
          S.put({ x: r.x, y: r.y, z: (r.z || 0) + 0.5, ang: r.ang, len: r.len, c1: r.c1, c2: r.c2, c3: r.c3, lift: r.lift, kind: KIND.LINER, wid: 0.45, a: CHALK, coat: 2, rank: 3, dry: 0.5, dur: 0.45,
            seed: rShoot(), ...tw, t0: tp + 0.25, mirror: true, mirrorLag: step * 0.5, strip: 'tear' });
          for (let k = 0; k < 3; k++) { const q = 0.2 + 0.14 * k, pt = K.strokePoint(r, q), sz = f.R * 0.07 * (1 - 0.15 * k);
            S.put({ x: pt[0], y: pt[1] - sz * 0.5, z: (r.z || 0) + sl * q * r.len + 0.7, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: SOOT, coat: 2, rank: 2.2, seed: rShoot(), ...tw,
              t0: tp + 0.7 + k * 0.25, dur: 0.12, dry: 0, mirror: true, mirrorLag: 0.12 }); }
        });
      });
    }
    await ctx.yield();
    // The lake field does not end at an edge: beyond its last strokes the rows go on outward in seven widening rounds,
    // each a row's gap beyond the last, its strokes a fifth larger and set further apart, and more of them left out
    // (the brush running out of paint), as far as the lake is seen from the climb; none stands north of the shore.
    for (let m = 1, g = 1, sc = 1.6; m <= 7; m++, sc *= 1.2) {
      g += 13 * sc / 276;
      const ax = 290 * g, bz = 262 * g, cnt = Math.round(TAU * 276 * g / (20 * sc));
      for (let j = 0; j < cnt; j++) {
        const th = (j + rLake.range(-0.25, 0.25) + 0.5 * (m % 2)) / cnt * TAU, x = ax * Math.cos(th), z = 40 + bz * Math.sin(th) + rLake.range(-6, 6) * sc, h1 = rLake(), keep = rLake();
        if (z > 170 || keep > 0.95 - 0.09 * m) continue;
        const S = turning(LK[(j + m) % 4].book, x, 0.2, z), L = 14.5 * sc * (0.9 + 0.2 * h1);
        S.put({ x: -L * 0.46, y: 0.3, ang: 0.56, len: L, wid: 4.7 * sc, kind: KIND.C, c1: -1.12, a: BLUE, b: CHALK, split: 0.22, coat: 1, seed: h1, t0: Math.min(Math.abs(x) / 290 * 1.5, 3) + h1 * 0.2, dur: 0.4, dry: 0.45, anim: 2, strip: D });
      }
    }
    // The lake's own company: a skein of six great stroke birds in flat side view, wheeling 20 m up round a place on the
    // course 60 m ahead of us as we cross the water; where the first horse stands beside the course the wheel stays, and
    // we pass under it (the lake's flock of eight keeps its round nearer the shore). A bird faces the way it flies: each
    // is baked twice on the one pivot, beak to its sheet's right and the mirror image of that, beak to its left, and
    // update() shows one of the two (by the bird's own way round the wheel, taken across the course at the wheel's centre).
    // The mirror image is the same bird laid the other way round by the bird routine (m = -1), with the same seed; its
    // re-fanning amount is negated with it (flap: m), which the stroke shader reads as "re-fan as the mirror image of the
    // twin", so the two images are mirror images of each other at every moment of the beat.
    const skeinStop = reachZ(Math.min(...HERD.filter((h) => Math.abs(h[0]) < 70).map((h) => h[1]))) * path.length;
    const SKEIN = { R: 25, rate: 0.14 };                        // the wheel: its radius in metres, its turn in radians a second
    const skeinBirds = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + rBird.range(-0.05, 0.05), y = rBird.range(-3, 3) + (i % 3) * 2.5, seed = rBird.range(0.3, 0.9);
      const books = [1, -1].map((m) => {
        const book = K.makeStrokeBook(), S = turning(book, Math.cos(a) * SKEIN.R, y, Math.sin(a) * SKEIN.R, { rank: 6 });
        bird(S, 0, 0, 2.5 + 0.2 * (i % 3), m, birdCols[i % 3], { seed, load: 0.3, flap: m });
        return book;
      });
      skeinBirds.push({ a, books, g: null });
    }
    // Each feather of our mount trails a dry streak: a thin, broken pull of chalk from the feather's tip back along
    // the wind, painted afresh every 0.83 s of the world's clock (the beat's own rate) and gone within half a second (feather by feather).
    const TR = sub();
    await ctx.yield();
    // ---- our mount: a painted bird round the camera (neck and head low centre, a nine-feather wing in each lower corner)
    const mount = new THREE.Group(); mount.matrixAutoUpdate = false; mount.frustumCulled = false;
    const mBody = K.makeStrokeBook();
    {
      const S = K.sheet(mBody, [0, -2.45, -3.2], [1, 0, 0], [0, 0.1, -0.995], { rank: 99 });
      S.put({ x: 0, y: 0, ang: PI / 2, len: 2.5, wid: 0.8, kind: KIND.S, c3: 0.22, a: RED, b: CHALK, split: 0, coat: 0, seed: 0.37, dry: 0.5, anim: 1.5 });
      for (let k = 0; k < 4; k++) S.put({ x: 0, y: 0.35 + k * 0.5, ang: PI / 2, len: 0.14, wid: 0.14, kind: KIND.DOT, a: CHALK, coat: 2, seed: 0.5, dry: 0 });
    }
    // the body and tail lie under and behind the saddle, below the bottom edge of the frame: they are seen only from
    // behind, through the previous world's portal, where they make the neck and the two fans one bird. A blue-into-chalk
    // shoulder stroke from each wing root down to a fat red-into-chalk teardrop body, and a flat
    // tail fan of five blue-into-chalk teardrops (heads at the tips) with a liner and a dot row, spread from under the
    // neck's foot. Their own group: it does not bank with the bird, and sinks out of the way as the saddle is reached.
    const mTail = K.makeStrokeBook();
    {
      // (these sheets face a viewer a few metres behind and above; from the saddle the whole group has sunk out of sight)
      const B = K.sheet(mTail, [0, -2.9, -4.9], [1, 0, 0], [0, -0.42, 0.91], { rank: 99, strip: T });
      B.put({ x: 0, y: -0.1, ang: PI / 2, len: 2.7, wid: 3.0, kind: KIND.TEAR, a: RED, b: CHALK, split: 0, coat: 0, seed: 0.44, dry: 0.3 });
      for (const sx of [1, -1]) {                               // a shoulder stroke from each wing root down to the body
        const X = new THREE.Vector3(-sx * 1.7, -0.3, 0.5).normalize(), Y = new THREE.Vector3(0, 0.35, 0.93).cross(X).normalize();
        const Sh = K.sheet(mTail, [sx * 2.0, -2.85, -4.9], X.toArray(), Y.toArray(), { rank: 99, strip: T });
        Sh.put({ x: -0.45, y: 0, ang: 0, len: 2.5, wid: 1.25, kind: KIND.TEAR, a: BLUE, b: CHALK, split: 0.05 * sx, coat: 1, seed: 0.27 + 0.2 * sx, dry: 0.3 });
      }
      const Tl = K.sheet(mTail, [0, -2.75, -3.0], [1, 0, 0], [0, 0.14, 0.99], { rank: 99, strip: T });
      for (let k = 0; k < 5; k++) { const a = PI / 2 + (k - 2) * 0.34, R = 2.2 - 0.12 * Math.abs(k - 2);
        Tl.put({ x: Math.cos(a) * R, y: Math.sin(a) * R, ang: a + PI, len: R - 0.25, wid: 0.62, kind: KIND.TEAR, a: BLUE, b: CHALK, split: 0, coat: k % 2, seed: 0.13 + k * 0.17, dry: 0.25 }); }
      Tl.put({ x: 0, y: 0.45, ang: PI / 2, len: 1.0, wid: 0.04, kind: KIND.LINER, a: SOOT, coat: 2, seed: 0.6, dry: 0 });
      for (let k = 0; k < 3; k++) Tl.put({ x: (k - 1) * 0.3, y: 0.42 - 0.05 * Math.abs(k - 1), ang: PI / 2, len: 0.15, wid: 0.15, kind: KIND.DOT, a: CHALK, coat: 2, seed: 0.5, dry: 0, strip: D });
    }
    const tailG = mTail.bake(mat); tailG.matrixAutoUpdate = false; tailG.frustumCulled = false; scene.add(tailG);
    // the head: its own small sheet at the neck's end, leaning back to show its face to the rider, every mark on one coat
    // (stacked by a few centimetres only, so nothing slides apart): a fat red-into-chalk teardrop that starts inside the
    // neck's end, an ochre beak on its tip, a soot eye in a chalk ring, a blue-and-chalk collar and a crest of three
    // blue-into-chalk teardrops like the wing feathers. It nods on the wing beat.
    const HEAD = { y: -2.2, z: -5.69, tilt: 0.8, k: 0.88 };
    const mHead = K.makeStrokeBook();
    {
      const S0 = K.sheet(mHead, [0, 0, 0], [1, 0, 0], [0, 1, 0], { rank: 99, coat: 1, strip: T }), hk = HEAD.k;
      const S = { put: (r) => S0.put({ ...r, x: r.x * hk, y: r.y * hk, len: r.len * hk, wid: r.wid * hk }) };
      const dir = PI / 2 - 0.35, cx = Math.cos(dir), cy = Math.sin(dir), at = (d, n = 0) => [d * cx - n * cy, -0.3 + d * cy + n * cx];
      S.put({ x: 0, y: -0.3, ang: dir, len: 1.4, wid: 1.05, kind: KIND.TEAR, a: RED, b: CHALK, split: 0.1, seed: 0.6, dry: 0.25 });
      S.put({ x: -0.56, y: -0.02, ang: -0.62, len: 1.2, wid: 0.34, kind: KIND.C, c1: 1.05, a: BLUE, b: CHALK, split: 0.1, z: 0.1, seed: 0.42, dry: 0.3 });
      const tip = at(1.22);
      S.put({ x: tip[0], y: tip[1], ang: dir - 0.3, len: 0.62, wid: 0.34, kind: KIND.TEAR, a: OCHRE, b: OCHRE, z: 0.1, seed: 0.2, dry: 0.1 });
      const eye = at(0.56, -0.07);
      S.put({ x: eye[0], y: eye[1] - 0.2, ang: PI / 2, len: 0.4, wid: 0.4, kind: KIND.DOT, a: CHALK, z: 0.1, seed: 0.5, dry: 0, strip: D });
      S.put({ x: eye[0], y: eye[1] - 0.105, ang: PI / 2, len: 0.21, wid: 0.21, kind: KIND.DOT, a: SOOT, z: 0.2, seed: 0.5, dry: 0, strip: D });
      const crown = at(0.5, 0.3);
      for (let k = 0; k < 3; k++) { const a = dir + 0.95 + k * 0.42, L = 0.82 - 0.1 * k;
        S.put({ x: crown[0] + Math.cos(a) * L, y: crown[1] + Math.sin(a) * L, ang: a + PI, len: L, wid: 0.3, kind: KIND.TEAR, a: BLUE, b: CHALK, split: 0, z: 0.1 + 0.03 * k, seed: 0.15 + k * 0.2, dry: 0.2 }); }
    }
    const headG = mHead.bake(mat); headG.position.set(0, HEAD.y, HEAD.z); headG.rotation.x = -HEAD.tilt; mount.add(headG);
    // each wing: an open fan of nine fat teardrop feathers, blue into chalk, heads at the tips, on a sheet leaning back
    // from the camera so the feathers show their faces; one soot quill liner inside each, a chalk dot at each covert.
    // Every feather is its own small group turning about the wing root, so the fan opens and closes feather by feather.
    const WING = { R: 2.6, a0: -0.05, pitch: 0.178, tilt: 1.2, x: 2.0, y: -2.8, z: -4.9 };
    const wings = [1, -1].map((sx) => {
      const g = new THREE.Group(); g.position.set(sx * WING.x, WING.y, WING.z); g.rotation.x = -WING.tilt; mount.add(g);
      const feathers = [];
      for (let k = 0; k < 9; k++) {
        const book = K.makeStrokeBook(), S = K.sheet(book, [0, 0, 0], [sx, 0, 0], [0, 1, 0], { rank: 99, strip: T });
        const R = WING.R - 0.07 * Math.abs(k - 4), len = R - 0.6;
        S.put({ x: R, y: 0, ang: PI, len, wid: 0.47, kind: KIND.TEAR, a: BLUE, b: CHALK, split: 0, coat: k % 2, seed: 0.11 + k * 0.09, dry: 0.22 });
        S.put({ x: R - 0.34, y: -0.03, ang: PI + 0.03, len: len * 0.52, wid: 0.035, kind: KIND.LINER, c1: -0.08, a: SOOT, coat: 2, seed: 0.3 + k * 0.07, dry: 0 });
        S.put({ x: 1.15, y: -0.08, ang: PI / 2, len: 0.16, wid: 0.16, kind: KIND.DOT, a: CHALK, coat: 2, seed: 0.5, dry: 0 });
        const fg = book.bake(mat); g.add(fg); feathers.push(fg);
        const tb = K.makeStrokeBook(), St = K.sheet(tb, [0, 0, 0], [sx, 0, 0], [0, 1, 0], { rank: 99, strip: T }), fa = WING.a0 + k * WING.pitch;
        St.put({ x: R - 0.05, y: 0, z: -0.04, ang: -PI / 2 - 0.75 * fa, len: 1.5 + 0.1 * k, wid: 0.2, kind: KIND.TEAR, c1: 0.25, a: CHALK, b: BLUE, split: 0.2, coat: 0, seed: 0.21 + k * 0.083, t0: 0.28 + k * 0.035, dur: 0.22, dry: 1 });
        fg.add(tb.bake(TR.mat));
      }
      return { g, sx, feathers };
    });
    // the bird is alive from the moment we are in the saddle (fully so on the climb, act 0..1): the wings beat, each one
    // sweeps and lifts on its own slow phase, the fan closes and opens, the head turns toward the blossoms and back; a
    // wing may be raised (upP port, upS starboard) to stand large beside the neck. Everything is keyed to u as well as
    // to time, so no two moments of the flight show the same pose.
    const wingPose = (time, u = 0, act = 0, upP = 0, upS = 0) => {
      const ph = time * TAU * 1.2 + u * 33, beat = Math.sin(ph), on = u > 0 ? 0.4 + 0.6 * act : 0;
      for (const w of wings) {
        const sweep = on * (0.1 + 0.2 * Math.sin(u * 41 + w.sx * 1.3 + 0.35 * time)), lift = on * (0.04 + 0.11 * Math.sin(u * 29 + 2 + w.sx + 0.27 * time));
        const fold = 1 - on * 0.34 * (0.5 + 0.5 * Math.sin(u * 53 + w.sx * 2 + 0.4 * time));
        const raise = w.sx > 0 ? upS : upP;                    // a raised wing stands up beside the neck and shows its whole face
        w.g.rotation.x = -WING.tilt + 0.07 * beat + lift + raise; w.g.position.y = WING.y + 0.08 * beat; w.g.rotation.z = w.sx * (sweep + 0.5 * raise);
        w.g.rotation.y = -w.sx * (u > 0 ? 0.05 + 0.4 * Math.sin(ph - 0.3) : 0);     // the beat itself: the whole fan up in one moment, down in the next
        for (let k = 0; k < 9; k++) w.feathers[k].rotation.z = w.sx * (WING.a0 + k * WING.pitch * fold * (0.84 + 0.16 * Math.sin(ph - 0.6 - k * 0.3)));
      }
      const nod = Math.sin(ph - 0.9), turn = on * (0.42 * Math.sin(u * 45 + 1) + 0.08 * Math.sin(time * 0.7)) + 0.3 * sstep(0.045, 0.075, u) * (1 - sstep(0.088, 0.112, u));
      headG.rotation.x = -HEAD.tilt + 0.07 * nod + act * 0.1 * Math.sin(u * 61); headG.position.y = HEAD.y + 0.05 * beat; headG.rotation.z = 0.04 * nod + turn;
    };
    wingPose(0);
    mount.add(mBody.bake(mat)); scene.add(mount);
    await ctx.yield();
    // ---- pollen: drifting dot rows (a pollen night streams them across the course in ribbons)
    const pollenBook = K.makeStrokeBook(), pv = new THREE.Vector3();
    const nPollen = Math.round((weather === 'pollen' ? 130 : 56) * detail * density);
    for (let i = 0; i < nPollen; i++) {
      path.pointAt(rng.range(0.02, 0.97), pv);
      const a = rng() * TAU, d = rng.range(9, 46), S = turning(pollenBook, pv.x + Math.cos(a) * d, Math.max(pv.y + rng.range(-12, 16), 2.5), pv.z + Math.sin(a) * d, { rank: 2.2, face: 9 });   // face 9: turning freely as 7 does, and a medium to the stroke program (its dots thin by size within 2.5 m of the lens and are gone at 0.8 m)
      const n = rng.int(5, 9), sz = rng.range(0.45, 0.85), tilt = rng.range(-0.5, 0.5), pot = rng() < 0.6 ? CHALK : OCHRE;
      for (let k = 0; k < n; k++) S.put({ x: (k - n / 2) * sz * 2.1 * Math.cos(tilt), y: (k - n / 2) * sz * 2.1 * Math.sin(tilt) + 0.3 * Math.sin(k * 1.3), ang: PI / 2, len: sz * (1 - 0.07 * k), wid: sz * (1 - 0.07 * k), kind: KIND.DOT, a: pot, coat: 1, seed: rng(), dry: 0 });
    }
    // ---- the rare event: the petals take wing (a flock of stroke birds waiting under the boards until 30 s)
    const rareBook = K.makeStrokeBook();
    if (rare) for (let i = 0; i < Math.round(160 * Math.max(detail, 0.8)); i++) {
      const a = rng() * TAU, r = rng.range(18, 44), S = turning(rareBook, Math.cos(a) * r, rng.range(0, 150), Math.sin(a) * r, { rank: 8 }), sd = rng.range(0.3, 0.9), col = rng() < 0.6 ? RED : rng() < 0.5 ? OCHRE : BLUE;
      S.put({ x: 2.4, y: 0, ang: PI, len: 5.4, wid: 2.2, kind: KIND.TEAR, a: CHALK, b: col, split: -0.2, coat: 1, seed: sd, strip: D });
      for (let k = 0; k < 2; k++) S.put({ x: 0.7 - k * 0.7, y: 0.4, ang: 1.1 + k * 0.5, len: 5, wid: 1.8, kind: KIND.TEAR, c1: 1.0, anim: 20, a: col, b: CHALK, split: 0.25, coat: 2, seed: sd, strip: D });
      if (i % 80 === 79) await ctx.yield();
    }
    await ctx.yield();
    // ---- bake the books (one stroke program for everything)
    const southG = south.bake(mat); southG.rotation.y = PI; scene.add(southG);
    await ctx.yield();
    scene.add(bill.bake(mat));
    if (flat.count) scene.add(flat.bake(mat));
    dome.add(corn.bake(mat));
    await ctx.yield();
    for (const w of W) { scene.add(w.book.bake(w.mat)); await ctx.yield(); }
    for (const w of LK) { scene.add(w.book.bake(w.mat)); await ctx.yield(); }
    const swans = swanBook.bake(mat); scene.add(swans);
    for (const h of HP) { h.g = h.book.bake(h.mat); scene.add(h.g); }
    for (const b of rimBirds) { b.g = b.book.bake(fl.mat); scene.add(b.g); }
    for (const f of flocks) { f.g = f.book.bake(fl.mat); scene.add(f.g); }
    const ringG = ringBook.bake(fl.mat); ringHold.add(ringG); scene.add(ringHold);
    const skein = new THREE.Group(); scene.add(skein);
    for (const b of skeinBirds) { b.g = b.books.map((k) => k.bake(fl.mat)); skein.add(b.g[0], b.g[1]); b.g[1].visible = false; }
    for (const b of escort) { b.g = b.book.bake(fl.mat); scene.add(b.g); }
    for (const b of climbBirds) { b.g = b.book.bake(fl.mat); scene.add(b.g); }
    const pollen = pollenBook.bake(mat); scene.add(pollen);
    const rareG = rareBook.bake(fl.mat); rareG.position.set(HERO_AT[0], -400, HERO_AT[2]); scene.add(rareG);
    await ctx.yield();

    const paceFn = typeof K.journeyPace === 'function' ? K.journeyPace : pace;
    const clockOf = (u) => (typeof K.journeyClock === 'function' ? K.journeyClock(u, 42) : journey(u)) + 5.5 * (1 - sstep(0, 0.2, u));
    const cam = new THREE.Vector3(), poiV = new THREE.Vector3(HERO_AT[0], 100, HERO_AT[2]), poiW = new THREE.Vector3(ringAt[0], ringAt[1], ringAt[2]);
    // where the gaze rests, a pure function of u (the engine blends it with the course ahead). Lake: the vine ahead, with
    // one look out to port at the nearest horse and the sun. Street: down on the urn between the house fronts. First turn, heading west then south round the north side: the
    // village and the lake, a flat picture below. South-west side: level, past the stem to the far shore and the sun.
    // Then up at the tiers being painted, and at last the ring (the PULLS below hold single blossoms whole on the way).
    const GAZE = { below: new THREE.Vector3(0, -46, 212), p: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() };
    const STREET_AIM = [0.237, 0.25, 0.253, 0.266, new THREE.Vector3(0, 11.5, 330), 29.5, 2];
    // The looks of the climb, keyed: [u, degrees to starboard of the course (24 m ahead) at that u, degrees above level].
    // They are turned into one compass bearing that runs on round the stem without a break, and both bearing and elevation
    // are drawn through the keys as monotone cubics, so the gaze turns evenly from look to look: no look is snapped to,
    // none is dropped at once (the engine turns the camera toward the gaze at 2.6 a second, and a gaze that jumps is a whip).
    const LOOKS = [[0.262, 19, -17], [0.3, 52, 18], [0.33, 80, 26], [0.36, 66, 16], [0.38, 80, 8], [0.4, 84, -3], [0.43, 32, -16], [0.47, 24, -19], [0.5, 12, -21], [0.525, 3, -25],
      [0.545, 6, -25], [0.61, 38, -7], [0.65, 30, 16], [0.69, 44, 16], [0.74, 66, 46], [0.778, 82, 29], [0.84, 80, 56], [0.87, 80, 66], [0.9, 68, 60], [0.925, 12, 54], [0.945, 0, 60]];
    const tierAt = (i, j, dy = 0) => { const c = A.tiers ? A.tiers[i].blossoms[j] : new THREE.Vector3(0, K.TIER_Y[i] + 15, 0); return new THREE.Vector3(c.x + HERO_AT[0], c.y + HERO_AT[1] + dy, c.z + HERO_AT[2]); };
    const aim = { a: new THREE.Vector3(), t: new THREE.Vector3(), r: new THREE.Vector3(), v: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
    const TAN = (deg) => Math.tan(deg * PI / 180), DEG = PI / 180;
    const courseAz = (u) => { path.pointAt(u, aim.r); path.posAtDist(u * path.length + 24, aim.a); return Math.atan2(aim.a.x - aim.r.x, aim.a.z - aim.r.z) / DEG; };
    {
      // bearings, unwrapped: the course's bearing is followed in small steps from the first key on (it turns to starboard, so it falls)
      let u = LOOKS[0][0], az = courseAz(u);
      for (const q of LOOKS) {
        while (u < q[0] - 1e-9) { const un = Math.min(u + 0.002, q[0]), d = courseAz(un) - courseAz(u); az += d - 360 * Math.round(d / 360); u = un; }
        q[3] = az - q[1];
      }
    }
    // a monotone cubic through the keys (column c), flat at both ends
    const cubic = (c) => {
      const n = LOOKS.length, m = new Array(n).fill(0), dl = [];
      for (let i = 0; i < n - 1; i++) dl.push((LOOKS[i + 1][c] - LOOKS[i][c]) / (LOOKS[i + 1][0] - LOOKS[i][0]));
      for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : 2 * dl[i - 1] * dl[i] / (dl[i - 1] + dl[i]);
      return (u) => {
        if (u <= LOOKS[0][0]) return LOOKS[0][c]; if (u >= LOOKS[n - 1][0]) return LOOKS[n - 1][c];
        let i = 0; while (u > LOOKS[i + 1][0]) i++;
        const h = LOOKS[i + 1][0] - LOOKS[i][0], t = (u - LOOKS[i][0]) / h, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * LOOKS[i][c] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * LOOKS[i + 1][c] + (t3 - t2) * h * m[i + 1];
      };
    };
    const lookAz = cubic(3), lookEl = cubic(2);
    // the engine mixes the gaze (weight 0.65) with the course 24 m ahead: the point to look at is solved so that the mix is
    // the look itself. Over the last tenth the engine's weight fades and the solving is let go (u 0.87 to 0.93: the gaze
    // then simply rests on the ring), so the hook into the last straight is taken gently by both cameras.
    const solveLook = (u, g, out) => {
      const az = lookAz(u) * DEG, el = lookEl(u) * DEG, ce = Math.cos(el), ws = 0.65;
      aim.t.set(Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce);
      path.posAtDist(Math.min(Math.max(u, 0), 1) * path.length + 24, aim.a); aim.a.sub(g).normalize();
      const c = aim.t.dot(aim.a), lam = (1 - ws) * c + Math.sqrt(Math.max(ws * ws - (1 - ws) * (1 - ws) * (1 - c * c), 0));
      out.copy(aim.t).multiplyScalar(lam).addScaledVector(aim.a, -(1 - ws)).normalize();
      return out.lerp(aim.t, sstep(0.87, 0.93, u)).normalize();
    };
    const gazeAt = (u) => {
      const g = GAZE.p; path.pointAt(Math.min(Math.max(u, 0), 1), g);
      const kN = sstep(0.268, 0.306, u);                                             // from the street's own gaze to the looks of the climb
      if (kN < 1) {
        // lake and street: the vine ahead, one look out to port at the nearest horse and the sun, then down on the urn between the house fronts
        const dStem = Math.hypot(g.x - HERO_AT[0], g.z - HERO_AT[2]);
        const kS = sstep(0.27, 0.36, u), kU = sstep(0.14, 0.21, u) * (1 - sstep(0.24, 0.3, u));
        const lift = Math.min(dStem * 0.18, 60) * (1 - kS) + 15 * kS;
        const kX = 18 * sstep(0.232, 0.257, u) * (1 - sstep(0.273, 0.318, u));   // passing the urn the gaze leads a little, so it goes by to starboard of the head
        const kL = sstep(0.045, 0.075, u) * (1 - sstep(0.088, 0.112, u));          // on the lake the gaze goes out to port, to the nearest horse and the sun, and comes back
        poiV.set(HERO_AT[0] + kX + 520 * kL, (g.y + lift) * (1 - kU) - 6 * kU, HERO_AT[2] + 0.4 * kX);
        const q = STREET_AIM, k = sstep(q[0], q[1], u) * (1 - sstep(q[2], q[3], u));   // the street's end: the urn whole at the right, the last house whole at the left
        if (k > 0) {
          GAZE.a.copy(poiV).sub(g).normalize();
          const w = 0.65 * bell(u, 0.03, 0.97, 0.1);
          path.posAtDist(u * path.length + 24, aim.a); aim.a.sub(g).normalize();
          aim.t.copy(q[4]).sub(g).normalize(); aim.r.crossVectors(aim.t, aim.up).normalize(); aim.v.crossVectors(aim.r, aim.t);
          aim.t.addScaledVector(aim.r, -TAN(q[5])).addScaledVector(aim.v, -TAN(q[6])).normalize();
          const c = aim.t.dot(aim.a), lam = (1 - w) * c + Math.sqrt(Math.max(w * w - (1 - w) * (1 - w) * (1 - c * c), 0));
          GAZE.b.copy(aim.t).multiplyScalar(lam).addScaledVector(aim.a, -(1 - w)).normalize();
          poiV.copy(g).addScaledVector(GAZE.a.lerp(GAZE.b, k).normalize(), 120);
        }
        if (kN <= 0) return poiV;
      }
      solveLook(u, g, GAZE.b);
      if (kN < 1) { GAZE.a.copy(poiV).sub(g).normalize(); GAZE.b.copy(GAZE.a.lerp(GAZE.b, kN).normalize()); }
      return poiV.copy(g).addScaledVector(GAZE.b, 120);
    };
    let clock = clockOf(0);
    const rollM = new THREE.Matrix4(), seatM = new THREE.Matrix4(), sinkM = new THREE.Matrix4(), entryAt = new THREE.Vector3().setFromMatrixPosition(entryPose);
    const drift = weather === 'pollen' ? 15 : 5;
    // the ride belongs to the picture: its seat in the frame, its heading and its bank are keyed to u, so that head and
    // wings sit left, right, low and lower from moment to moment, clear of the blossom the moment is about
    // [u, x (m to starboard), y, z, yaw (+ turns the head to port), roll (+ lifts the starboard wing), port wing raised, starboard wing raised]
    const SEAT = [[0, 0, 0, 0, 0, 0, 0, 0], [0.03, 0, 0, 0, 0, 0, 0, 0], [0.08, 0.9, 0.1, 0, 0, -0.1, 0, 0], [0.16, 0, -0.3, 0, 0, 0, 0, 0], [0.25, -0.9, -0.35, 0, 0, -0.08, 0, 0],
      [0.34, -1.5, -0.15, 0.6, 0.05, -0.2, 0.5, 0], [0.43, -1.1, 0.1, 0, 0.05, -0.1, 0, 0], [0.52, -0.4, 0, 0, -0.05, 0.1, 0, 0.2], [0.61, -1.2, -0.3, 0, 0.05, 0.1, 0, 0],
      [0.632, -1.3, -0.25, 0, 0.05, 0.05, 0, 0], [0.652, 0.9, -0.2, 0, -0.03, 0, 0.2, 0], [0.7, -1.5, 0, 0, 0.1, 0, 0, 0], [0.745, 1.2, -0.1, 0, -0.05, 0.05, 0, 0], [0.79, 0, -0.3, 0, 0, 0.1, 0, 0], [0.835, -1, 0, 0, 0.08, -0.1, 0, 0],
      [0.87, 1.5, -0.1, 0.5, -0.04, -0.1, 0.3, 0], [0.895, 1.5, -0.1, 0.5, -0.04, -0.1, 0.3, 0], [0.935, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0]];
    const seat = [0, 0, 0, 0, 0, 0, 0];
    const seatAt = (u) => {
      let k = 1; while (k < SEAT.length - 1 && u > SEAT[k][0]) k++;
      const a = SEAT[k - 1], b = SEAT[k], f = sstep(a[0], b[0], u);
      for (let j = 0; j < 7; j++) seat[j] = a[j + 1] + (b[j + 1] - a[j + 1]) * f;
      return seat;
    };
    // between the third tier's two blossoms the head keeps to bare board: the seat's side-step is a rule of the place,
    // worked out once, here, every 2 m of the route, for the camera the flight has there (the engine's own rule: the gaze
    // mixed with the course 24 m ahead, followed at 2.6 a second, so about a third of a second behind the pose): of the
    // places across the saddle, the one nearest the table's number at which the head is clear of every painted blossom,
    // of the pair of birds settled on it and of the stem; neighbours along the route never differ by more than 0.2 m,
    // and the answer is eased over 6 m of route to either side. update() reads it by u and by nothing else.
    const DISCS = A.tiers ? A.tiers.flatMap((t) => t.blossoms.flatMap((c) => [{ c: new THREE.Vector3(c.x + HERO_AT[0], c.y + HERO_AT[1], c.z + HERO_AT[2]), r: t.radius, t0: t.petals[0] },
      { c: new THREE.Vector3(c.x + HERO_AT[0], c.y + HERO_AT[1] + t.radius * 0.93 + 2, c.z + HERO_AT[2]), r: 7, t0: t.done + 0.5 }])) : [];   // (and of the pair of birds settled on each)
    const SIDE = { ds: 2, i0: 0, n: 0, x: new Float32Array(1), places: 27, reach: 2.6 };
    {
      const L = path.length, ds = SIDE.ds, i0 = 0, i1 = Math.floor(L / ds), n = i1 - i0 + 1, NP = SIDE.places;
      const cost = new Float32Array(n * NP), from = new Int8Array(n * NP), tab = new Float32Array(n);
      const p = new THREE.Vector3(), a = new THREE.Vector3(), d = new THREE.Vector3(), t0 = new THREE.Vector3(), t1 = new THREE.Vector3(), r = new THREE.Vector3(), up = new THREE.Vector3(), v = new THREE.Vector3();
      const m = new THREE.Matrix4(), inv = new THREE.Matrix4(), q = new THREE.Quaternion(), qc = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
      const poseAt = (s) => {                                   // the engine's pose at s metres of route (no sway)
        const u = s / L; path.posAtDist(s, p); path.posAtDist(s + 24, a); d.subVectors(a, p).normalize();
        const w = 0.65 * bell(u, 0.03, 0.97, 0.1) * sstep(0, 0.04, u) * (1 - sstep(0.93, 0.985, u));
        if (w > 0.001) { v.copy(gazeAt(u)).sub(p).normalize(); d.multiplyScalar(1 - w).addScaledVector(v, w).normalize(); }
        path.tangentAtDist(s, t0); path.tangentAtDist(s + 24, t1);
        const bank = Math.min(Math.max(-(t0.z * t1.x - t0.x * t1.z) * 0.55, -0.28), 0.28) * 0.2;
        r.crossVectors(d, aim.up).normalize(); up.copy(aim.up).addScaledVector(r, bank).normalize();
        m.lookAt(p, a.copy(p).add(d), up); q.setFromRotationMatrix(m);
      };
      // what the head could cover, as seen by an eye turned as qq: the discs (side, height, half-width as slopes) and the stem
      const seen = (qq, D) => {
        inv.compose(p, qq, one).invert();
        DISCS.forEach((dc, j) => { v.copy(dc.c).applyMatrix4(inv); const o = D[j];
          if (D.clk < dc.t0 || v.z > -2) { o[2] = -1; return; } o[0] = v.x / -v.z; o[1] = v.y / -v.z; o[2] = dc.r / Math.max(v.length(), 1); });
        v.set(HERO_AT[0], p.y, HERO_AT[2]).applyMatrix4(inv);
        D.sx = v.z < -2 ? v.x / -v.z : 9; D.sw = 5.5 / Math.max(v.length(), 1);
      };
      const clear = (D, hx, hy, hr) => { let c = Math.abs(hx - D.sx) - D.sw - hr; for (const o of D) if (o[2] > 0) c = Math.min(c, Math.hypot(hx - o[0], hy - o[1]) - o[2] - hr); return c; };
      const short = (c) => (c >= 0.06 ? 0 : (0.06 - c) * 40);
      const D = DISCS.map(() => [0, 0, -1]);
      poseAt(i0 * ds); qc.copy(q);
      for (let i = 0; i < n; i++) {
        for (let k = 1; k <= 4; k++) {                          // the camera follows the pose: four steps of half a metre
          const s = (i0 + i - 1) * ds + k * ds / 4, dt = (ds / 4) / (L / 42 * paceFn(s / L));
          poseAt(s); qc.slerp(q, 1 - Math.exp(-dt * 2.6));
        }
        const u = (i0 + i) * ds / L, clk = clockOf(u), st = seatAt(u);
        D.clk = clk; seen(qc, D);                               // as flown: the eye a third of a second behind the pose
        const hz = 5.69 - st[2], hy = (-1.85 + st[1]) / hz, hr = 0.1;
        tab[i] = st[0];
        for (let j = 0; j < NP; j++) {
          const x = -SIDE.reach + 0.2 * j, hx = x / hz;
          const here = short(clear(D, hx, hy, hr)) + 0.15 * Math.abs(x - st[0]);
          let best = 1e9, bk = 0;
          if (i === 0) best = 0;
          else for (let k = -1; k <= 1; k++) { const jj = j + k; if (jj < 0 || jj >= NP) continue; const cc = cost[(i - 1) * NP + jj] + 0.02 * Math.abs(k); if (cc < best) { best = cc; bk = k; } }
          cost[i * NP + j] = best + here; from[i * NP + j] = bk;
        }
        if (i % 30 === 29) await ctx.yield();
      }
      const raw = new Float32Array(n); let j = 0;
      for (let k = 1; k < NP; k++) if (cost[(n - 1) * NP + k] < cost[(n - 1) * NP + j]) j = k;
      for (let i = n - 1; i >= 0; i--) { raw[i] = -SIDE.reach + 0.2 * j - tab[i]; j += from[i * NP + j]; }
      // eased over 6 m of route to either side (the step it adds to the table's number is what is kept)
      const x = new Float32Array(n);
      for (let i = 0; i < n; i++) { let acc = 0, wsum = 0; for (let k = -3; k <= 3; k++) { const w = 4 - Math.abs(k), ii = Math.min(Math.max(i + k, 0), n - 1); acc += raw[ii] * w; wsum += w; } x[i] = acc / wsum; }
      SIDE.i0 = i0; SIDE.n = n; SIDE.x = x;
    }
    const sideAt = (u) => {
      const f = Math.min(Math.max(u * path.length / SIDE.ds - SIDE.i0, 0), SIDE.n - 1), i = Math.min(Math.floor(f), SIDE.n - 2);
      return SIDE.x[i] + (SIDE.x[i + 1] - SIDE.x[i]) * (f - i);
    };
    return {
      scene, path, duration: 42, pace: paceFn,
      camera: { fov: 62, near: 0.5, far: 5000, lookAhead: 24, bank: 0.2 },
      pois: [{ at: (t, u) => gazeAt(u), from: 0.03, to: 0.97, weight: 0.65, fade: 0.1 }],
      // the ring's heart: one flat pot colour while the next world is not there (chalk; ochre on the cream coat), no glow, no halo
      portal: { shape: 'circle', radius: 7, tilt: true, blendDistance: 25, color: pots[CHALK], style: 'ring', glow: 0, halo: false, veil: pots[coat === 2 ? OCHRE : CHALK], revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      heroError: heroErr,
      update(dt, time, camera, u) {
        clock = clockOf(u);
        style.uniforms.uFree.value = sstep(0.28, 0.33, u);        // the village turns its fronts right round while it is behind us
        style.uniforms.uTurn.value = sstep(0.265, 0.315, u);     // and the blossoms turn on their stalks to face the rider, from the urn on
        if (hero) { hero.setClock(clock); hero.update(dt, time, camera); }
        else { style.setClock(clock); style.update(dt, time, camera, ctx.renderer); }
        W.forEach((w, k) => { w.style.setClock(((time + k * (WP / 4)) % WP) - 0.05); w.style.update(dt, time, camera, ctx.renderer); });
        LK.forEach((w, k) => { w.style.setClock(u < 0.2 ? -1 : ((time + k * (WP / 4) + 1) % WP) - 0.05); w.style.update(dt, time, camera, ctx.renderer); });
        fl.style.setClock(clock); fl.style.update(dt, time * 9, camera, ctx.renderer);
        TR.style.setClock(u > 0 ? ((time * 1.2) % 1) / 1.2 : -1); TR.style.update(dt, time, camera, ctx.renderer);   // the trails are drawn out in time, at the beat's own rate, on the world's clock alone
        // the hearts' pollen: a tier's rows show nothing until the painter's clock has reached their start (the tier's blossoms painted). From then each
        // row is tapped out, drifts up and away and is tapped out again on a four-second round of the world's clock (the two rows half a round apart);
        // the first tapping is counted from that start on the painter's clock, so a row reads the lesser of the two
        HP.forEach((h) => { const f = ((time + 2 * h.q) % 4) / 4; h.style.setClock(Math.min(f * 4, clock - h.from) - 0.05); h.style.update(dt, time, camera, ctx.renderer); h.g.position.set((h.q ? -5 : 5) * f, 12 * f, 0); });
        camera.getWorldPosition(cam);
        // the lid comes down to meet us on the climb, so the cornice crosses the upper frame and the lid's planks show; it is back in its place for the ring
        dome.position.set(cam.x, cam.y - 700 * sstep(0.3, 0.58, u) * (1 - 0.3 * sstep(0.62, 0.7, u) - 0.28 * sstep(0.67, 0.7, u)) * (1 - sstep(0.74, 0.86, u)), cam.z);
        // seen through the previous world's portal (u exactly 0) the bird waits at the entry pose, whole, not at the portal camera
        const act = sstep(0.3, 0.36, u) * (1 - sstep(0.86, 0.93, u));
        // the bird banks about its own back (not about the camera), and rides a little higher as it does, so the low wing stays in frame
        const st = seatAt(u), roll = st[4] + act * 0.05 * Math.sin(time * 0.5), yaw = st[3];
        const kH = sstep(0.31, 0.335, u) * (1 - sstep(0.9, 0.93, u));
        st[0] += sideAt(u) * kH;
        const cr = Math.cos(roll), sr = Math.sin(roll), py = -2.8;
        rollM.set(cr, -sr, 0, sr * py, sr, cr, 0, py - cr * py + 2.0 * Math.abs(sr), 0, 0, 1, 0, 0, 0, 0, 1);
        seatM.makeRotationY(yaw).setPosition(st[0], st[1], st[2]);
        mount.matrix.copy(u === 0 ? entryPose : camera.matrixWorld).multiply(seatM).multiply(rollM); mount.matrixWorldNeedsUpdate = true;
        // the body and tail show while the viewer stands off behind the waiting bird, and sink under the frame as the saddle is reached
        if (u === 0) { const k = 1 - sstep(1, 2.6, cam.distanceTo(entryAt)); sinkM.makeTranslation(0, -2.2 * k, 0); tailG.matrix.copy(entryPose).multiply(sinkM); }
        else { sinkM.makeTranslation(0, -2.2, 0); tailG.matrix.copy(camera.matrixWorld).multiply(sinkM); }
        tailG.matrixWorldNeedsUpdate = true;
        wingPose(time, u, act, st[5], st[6]);
        // the escort keeps its places in the frame's open side; it comes in from the port quarter as the climb begins and falls back there before the ring
        const kE = sstep(0.305, 0.352, u) * (1 - sstep(0.88, 0.93, u));
        for (const b of escort) {
          const i = b.i, az = (b.e[0] - 60 * (1 - kE) + 2.5 * Math.sin(time * 0.23 + i * 1.7) + 4.5 * Math.sin(u * 31 + i * 2.4)) * PI / 180;
          const el = (b.e[1] + 1.5 * Math.sin(time * 0.31 + i * 2.3) + 3.5 * Math.sin(u * 23 + i * 1.1)) * PI / 180;
          const d = b.e[2] * (1 + 0.15 * Math.sin(time * 0.17 + i * 2.1) + 0.2 * Math.sin(u * 19 + i));
          b.g.position.set(d * Math.sin(az) * Math.cos(el), d * Math.sin(el), -d * Math.cos(az) * Math.cos(el)).applyMatrix4(camera.matrixWorld);
        }
        // the eight in the lane: where the course is, so many metres on, so many inward toward the stem, a weave and a slow change of depth
        {
          const yc = path.pointAt(u, cb.p).y, on = sstep(22, 44, yc) * (1 - sstep(335, 349, yc));
          for (const b of climbBirds) {
            const s = u * path.length + b.lead + 6 * Math.sin(time * 0.13 + b.ph);
            path.posAtDist(s, cb.p);
            cb.r.set(cb.p.x - HERO_AT[0], 0, cb.p.z - HERO_AT[2]).normalize();   // outward from the stem
            const side = b.out + b.amp * Math.sin(time * b.w + b.ph) + 70 * (1 - on);
            b.g.position.copy(cb.p).addScaledVector(cb.r, side); b.g.position.y += b.hi + 2.5 * Math.sin(time * 0.7 * b.w + 2 * b.ph) - 40 * (1 - on);
          }
        }
        for (const f of flocks) { f.g.position.set(f.cx, f.y + 2.5 * Math.sin(time * 0.4 + f.ph), f.cz); f.g.rotation.y = f.ph + f.w * time; }
        for (const b of rimBirds) { const k = sstep(b.tn - 3, b.tn - 0.8, clock) * (1 - sstep(b.tn + 4, b.tn + 8, clock)); b.g.position.set(0, k * (12 + 1.5 * Math.sin(time * 1.3)), 0); }
        ringG.rotation.y = 0.2 * time;
        const sw = Math.min(u * path.length + 60, skeinStop);     // the wheel's place: metres of route
        path.posAtDist(sw, cb.p); skein.position.set(cb.p.x, 21 + 2 * Math.sin(time * 0.31), cb.p.z); skein.rotation.y = 0.9 + SKEIN.rate * time;
        // A skein bird faces the way it flies. Its place on the wheel is at the angle ph, so it stands d metres further along the course than
        // the wheel's centre (the course's heading there: cb.r, level over the lake), and the wheel carries it across the course at -rate d
        // metres a second toward the course's right-hand side: its beak is to that side. The shader keeps its sheet square to us, the sheet's
        // own right at our right hand: that is the course's right-hand side while the bird is ahead of us on the course and the course's left
        // once we are beyond the bird's own place along it (our metres of route against the wheel's and d), where the mirror image is the one
        // whose beak is to the bird's side. The flat is turned over in one step (one of its two baked images for the other) when either reverses.
        path.tangentAtDist(sw, cb.r);
        for (const b of skeinBirds) {
          const ph = b.a - skein.rotation.y, d = SKEIN.R * (cb.r.x * Math.cos(ph) + cb.r.z * Math.sin(ph));
          const right = -SKEIN.rate * d > 0, fore = sw + d > u * path.length;
          b.g[0].visible = right === fore; b.g[1].visible = right !== fore;
        }
        swans.position.set(1.5 * Math.sin(time * 0.21), 0, 9 * Math.sin(time * 0.13));
        pollen.position.set(drift * Math.sin(time * 0.21), 0.4 * drift * Math.sin(time * 0.17 + 1), drift * Math.cos(time * 0.15));
        // The rare flock, by a rule of the place: its stage is read from u alone and its turn from the world's clock; it reads nothing of the lens.
        // A bird of it is a body, kept off the lens by its place: at every stage and every clock of the turn a bird's pivot stands 8.4 m or more
        // from every point of the route (a bird reaches 5.8 m from its pivot). The group's own place, lean and scale carry the dealt pivots:
        // it waits under the boards as a column drawn in to 0.45 of its dealt radii (8 to 20 m from the stem: the route passes the urn 28 m from
        // the stem, 25 to 32 m up), rises with u 0.64 to 0.74 until the column's floor stands at 154 m (its highest pivot is then 13.8 m under
        // the cone y = 394 - 1.732 r, which lies 16 m under the last straight and more under the hook) and opens to its dealt radii as the floor
        // climbs from 40 to 150 m. u 0.74 to 0.8: the tower is gathered up flat under the cone (its 150 m of dealt heights to 6 m) and at the last
        // leans over to the ring's axis (30 degrees): a wheel round the stem 294 m up, square to the ring's axis. u 0.79 to 0.86: the wheel sails
        // up beside the last straight, parallel to it, 58 m off the ring's axis on the stem's side (its rim 14 m from the straight's line), until
        // it stands 9 m beyond the route's end; u 0.85 to 0.9: it swings in over the ring, beyond the end of the route; u 0.89 to 0.92: it sinks
        // onto the ring's own plane. That is the settled round: every bird 18 m or more from the ring's axis, the pivots from 5 m this side of
        // the ring's plane to 1 m beyond it (a bird stands 5.4 m tall on its pivot, so the birds lie about the plane), turning about the ring's axis.
        if (rare) {
          const k = sstep(0.64, 0.74, u), w = sstep(0.74, 0.8, u), fy = -170 + 324 * k, sr = 0.45 + 0.55 * sstep(40, 150, fy);
          const a = -105.46 + 114.46 * sstep(0.79, 0.86, u) - 14 * sstep(0.89, 0.92, u), b = 58 * (1 - sstep(0.85, 0.9, u));   // the wheel's own place: metres along the ring's axis from the ring, metres off it on the stem's side
          rareG.position.set(HERO_AT[0] + (ringAt[0] + a * ringAxis[0] + b * ringAxis[1] - HERO_AT[0]) * w, fy + (ringAt[1] + a * ringAxis[1] - b * ringAxis[0] - fy) * w, HERO_AT[2]);
          rareG.rotation.set(0, time * 0.22 + k * 2, -w * w * w * PI / 6, 'ZYX'); rareG.scale.set(sr, 1 - 0.96 * w, sr);
        }
      },
      dispose() { if (hero && hero.dispose) hero.dispose(); },
    };
  },
};
