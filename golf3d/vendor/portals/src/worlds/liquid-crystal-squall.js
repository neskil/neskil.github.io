// The Liquid-Crystal Squall: a squall off a headland, at noon, dawn or night by the edition, told on the glass of a
// segment display.
//
// THE FAINT STANDING SHAPES ARE THE GLASS'S OWN UNLIT SEGMENTS, EVERY STATION STANDING FOR GOOD. A segment is
// dark by the world's clock (the time given to update()) and by its own place (its station in its chain), and
// by nothing else: not u, not the lens, not a seed, not a wall clock. The device is our own invention, after
// no product, maker, game or character; nothing is lettered; nothing is carried with the camera. Built on our
// older engine and kit as they are (kit: makePath only).
//
// HOW THE WORLD IS LAID OUT. The course runs toward -Z; d is metres down-course (z = -d), x is to the right,
// the sea is y 0. Everything is placed in these DESIGN coordinates under one root group; an edition may mirror
// the whole world (root.scale.x = -1, path points mirrored), and then the shadow's fixed WORLD vector is used
// mirrored in the clearance sums (cast.x * mx). Every segment is one station of the one shader in
// ../parts/liquid-crystal-squall.js (makeStyle): ghost when off, dark with an offset shadow when on, where the
// sky or its own pane is behind it (over the sea and ink only the dark station shows).
// update() sets the clock uniform from the time it is given and nothing else.
// TWO REGISTERS IN EVERY VIEW: the sky is the glass's ground; below the sea line THE SEA IS PRINTED WHOLE in the
// sea's ink (the kit's sea is a pane), and on it lie foam streaks and glints of the ground tone, level dashes laid
// by place in steps, the finest nearest the line. INK IS NEVER HOLED: free-standing ghosts and shadow copies are
// drawn under the printed panes, so ink covers them: an unlit segment shows (as a whisper, about 2 % under the
// ground) only where it has sky behind it, and a crest column, which stands wholly below the lowest eye of the line, shows
// only its dark crest on the sea. THE LARGE SHAPES AGAINST THE SKY (her unlit leaves, the wheel's unlit wedges,
// the unlit bird stations, the trees' unlit leans, the ring's unlit arcs) are the faintest the glass has, 1 % under the ground with no darkened neighbour, and
// none of them shows before a printed pane or the sun. What hangs ON a pane (strata, scrub, the tower's bands)
// keeps its ghost and shadow in that pane's ink. The shadow copy hugs its shape (0.17 m aside and down, 0.2 m
// back); clouds and the flats that face along X carry a slanted back vector, fixed at build. Chains of many
// columns step on phases that are formulas of their place; the single chains (wheel, ring, leaves, bolts) on
// fixed numbers; a coming segment comes before the going one goes.
// THE WEATHER, BY PLACE. The calm at the entry. THE HEART on the berth leg: four clean ranks of rain standing to
// starboard of the course beyond the tower, three dark lozenges to a column. THE SKY IS CLEAR OF DARK round the
// ship, the tower and the sun: a few cloud stairs stand high and far to the sides, placed only where no sight
// line to the ship (up to the end of the sweep), to the tower (up to its berth) or to the sun (from the whole
// line) passes near them.
// THE BREAK IS A PRINTED SUNSET in the third ink only (panes: always on, flat, never shaded, by place): a half
// sun stands on the sea line 240 m beyond the ring with four bars over it; LONG LEVEL BANDS of the same ink
// stand low in the sky 1500 m off, right round the horizon the line looks at, longest and closest near the
// sun, shorter, thinner and fewer away from it and upward, ground between them, none over 12.5 degrees up;
// and on the water under the sun lies A PATH OF SHORT BROKEN LEVEL STROKES of the same ink, widening from the
// sun's foot to the last leg. The dark ship, tower, birds and land stand before it; chains of large gulls
// (petrels in that edition) stand before the sun.
// EVERY LAND STANDS IN THE SEA: at each flat's foot a wash of the sea's ink in a ragged line, a line of foam on
// the water and a surf line of crest segments; the skerry, the islet and the gate rock are stepped faces, the
// nearer lower.
// WHAT STANDS WHERE ALONG THE LINE (by place, at any value of the clock; THE LINE NEVER ENTERS HER RIG: it stands
// 25 m and more from every part of her nearest leaf under 36 m up, and rounds her stern): the headland's layered
// flats; the whole ship clear of the headland with the tower to starboard of the course and the half sun beyond
// the skerry; the bow-on barque 50 m before her bowsprit tip; the whole ship from broad on her port bow; the
// tower and its wheel from the berth, 100 m off, rain beyond it; the whole ship broadside from 87 m abeam, the
// islet, the ring and the sun astern of her; her whole length from her port quarter on the sweep; then down the
// last leg from 16.5 m up, the skerry and the islet to one side, the ring ahead with the half sun and its gulls
// beside it, a pair of buoys as a gate, and last the gate rock with its tree close beside the ring. Her leaves
// switch at once (a thousandth of a second); every other chain keeps its eighth. Her furl is a ripple: at most
// two of her twenty sails are furled at any value of the clock. Buoy topmarks are plain diamonds.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero, LCS_PALETTE } from '../parts/liquid-crystal-squall.js';

const DEG = Math.PI / 180;
// GAP m of open sea added before her; the ring brought -RUN m nearer (RUN is negative); LEAD m added before d 0; the sweep is flown EYE_HI m up
const GAP = 45, RUN = -9, LEAD = 4.5, EYE_HI = 8.5;
const SHIP = { x: -50, z: -289 - GAP, yaw: 25 * DEG };          // midships; bow toward the entry and 25 degrees to its right
const RING = { x: -191.3 - RUN, y: 9, z: -375 - GAP };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// THE BERTH: the line stands off her. Leg 1 leaves the course line DRIFT_D m down it and settles BERTH m to
// starboard of it, so her port side is passed at 38 m and more from the nearest leaf; the sweep (radius SWEEP_R)
// rounds her stern and ends on the last leg's line, 25 m and more astern of the nearest leaf's spanker boom (28 m of the upright leaf's).
const BERTH = 29.4, DRIFT_D = [200, 264], SWEEP_R = 44;

// the route in design coordinates: points every 20 m on straights, every 10 degrees on arcs (the brief's legs,
// with GAP m more open sea before her, the berth above, the sweep round her stern and the one last leg to the ring)
function routePoints() {
  const P = [];
  for (let d = 0; d <= DRIFT_D[0]; d += 20) P.push([0, 7, d ? -d : LEAD]);
  for (const f of [0.25, 0.5, 0.75, 1]) { const d = DRIFT_D[0] + (DRIFT_D[1] - DRIFT_D[0]) * f; P.push([BERTH * smooth(DRIFT_D[0], DRIFT_D[1], d), 7, -d]); }
  // the berth line (x BX) runs on to the sweep; THE SWEEP ROUNDS HER STERN: a left-hand quarter circle of radius
  // SWEEP_R, rising to EYE_HI m, that ends heading -X on the last leg's line (z = RING.z), 25 m and more astern of
  // the nearest leaf's spanker boom (28 m of the upright leaf's). The line never enters her rig: she is seen from her quarter across open sea.
  const BX = 29.487, Z1 = -(RING.z + SWEEP_R);
  for (let d = DRIFT_D[1] + 20; d < Z1 - 12; d += 20) P.push([BX, 7, -d]);
  P.push([BX, 7, -Z1]);
  for (let a = 10; a <= 90; a += 10) {                     // leg 2: the sweep, points every 10 degrees
    const th = a * DEG, k = smooth(0.05, 0.75, a / 90);
    P.push([BX - SWEEP_R + SWEEP_R * Math.cos(th), 7 + (EYE_HI - 7) * k, -Z1 - SWEEP_R * Math.sin(th)]);
  }
  // leg 3: dead straight toward -X on z = RING.z to the ring: astern of her the eye rises to 16.5 m for the view
  // down the exit run, then sinks to 9 m by the 112th metre and runs level
  const x0 = BX - SWEEP_R, LL = x0 - RING.x;
  for (let s = 20; s < LL - 8; s += 20) P.push([x0 - s, 9 + 7.5 * smooth(-12, 34, s) * (1 - smooth(44, 112, s)), RING.z]);
  P.push([RING.x, 9, RING.z]);
  return P;
}

// nominal speeds (m/s) against metres flown: from pace(u) alone, nothing is keyed to them. Slowest off her bow,
// abeam of her and round her quarter; quicker down the last leg
const SPEED = [[0, 17], [80, 17], [112, 14.5], [190, 14.5], [218, 11.5], [290, 11.5], [305, 12.5], [350, 12.5], [368, 11],
  [450, 11], [470, 13.5], [505, 13.5], [525, 14], [555, 14], [578, 17], [640, 17]];
function speedAt(d) {
  for (let i = 1; i < SPEED.length; i++) if (d <= SPEED[i][0]) { const a = SPEED[i - 1], b = SPEED[i]; return a[1] + (b[1] - a[1]) * smooth(a[0], b[0], d); }
  return 17;
}

// the editions: inks, ground by hour, mirror, birds. Chosen once at build from ctx.rng and ctx.vary.
const INKS = { std: [LCS_PALETTE[4], LCS_PALETTE[5], LCS_PALETTE[6]], violet: ['#5B5FA6', '#D4473A', '#EDE26A'] };
const GROUNDS = { noon: LCS_PALETTE[0], dawn: '#C8BC8E', night: '#A6CDBF' };

export default {
  id: 'liquid-crystal-squall',
  name: 'The Liquid-Crystal Squall',
  category: 'ocean',
  weirdness: 0.6,
  media: ['water', 'air', 'open'],
  async build(ctx) {
    const vary = ctx.vary || {}, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    // ---- the edition: every draw from the seed happens in build(), in this fixed order ----------------------
    const er = ctx.rng.fork('edition');
    // (the one-ink edition is taken out: with the sea printed whole in its ink, land and sun of the same ink would
    // not stand off it; its share of the draw goes to the first inks, and the draw itself is still made)
    const inkDraw = er.pick(['std', 'std', 'std', 'violet', 'violet', 'teal']), inkKey = inkDraw === 'teal' ? 'std' : inkDraw;
    const hourDraw = er.pick(['noon', 'noon', 'dawn', 'night']);
    const mirror = er.chance(0.5), petrels = er.chance(0.4);
    const hour = vary.hour === 'dawn' || vary.hour === 'golden' ? 'dawn' : vary.hour === 'night' ? 'night' : vary.hour === 'day' ? 'noon' : hourDraw;
    const mx = mirror ? -1 : 1;
    const hex = [GROUNDS[hour], LCS_PALETTE[1], LCS_PALETTE[2], LCS_PALETTE[3], ...INKS[inkKey]];
    const style = makeStyle(ctx, { palette: hex }), pal = style.palette;
    const edition0 = { inks: inkKey, hour, mirror, petrels, rare: !!vary.rare };
    const TEAL = 1, ORANGE = 2, YELLOW = 3, FAR = 4;        // tones: the pane ink behind a segment; +4 a far thing

    const scene = new THREE.Scene();
    scene.background = pal.ground.clone();                 // the sky is the glass's ground (scene.background, no dome); the sea below it is a printed pane
    const root = new THREE.Group(); root.name = 'lcs-root'; root.scale.x = mx; scene.add(root);
    root.add(style.sea(5200));

    // ---- the route, and a table of it every 2 m (design coordinates) -----------------------------------------
    const RP = routePoints();
    const dpath = makePath(RP), path = makePath(RP.map((p) => [p[0] * mx, p[1], p[2]]));
    const NR = Math.ceil(dpath.length / 2), RT = new Float32Array((NR + 1) * 3), RTAN = new Float32Array((NR + 1) * 3);
    { const v = new THREE.Vector3();
      for (let i = 0; i <= NR; i++) {
        dpath.posAtDist(Math.min(i * 2, dpath.length), v); RT[i * 3] = v.x; RT[i * 3 + 1] = v.y; RT[i * 3 + 2] = v.z;
        dpath.tangentAtDist(Math.min(i * 2, dpath.length), v); RTAN[i * 3] = v.x; RTAN[i * 3 + 1] = v.y; RTAN[i * 3 + 2] = v.z;
      } }
    await ctx.yield();
    const segD2 = (i, x, y, z) => {                        // squared distance from a point to route piece i..i+1
      const ax = RT[i * 3], ay = RT[i * 3 + 1], az = RT[i * 3 + 2], bx = RT[i * 3 + 3] - ax, by = RT[i * 3 + 4] - ay, bz = RT[i * 3 + 5] - az;
      const t = Math.min(1, Math.max(0, ((x - ax) * bx + (y - ay) * by + (z - az) * bz) / Math.max(bx * bx + by * by + bz * bz, 1e-6)));
      const dx = ax + bx * t - x, dy = ay + by * t - y, dz = az + bz * t - z; return dx * dx + dy * dy + dz * dz;
    };
    const coarse = new Float32Array(Math.floor(NR / 4) + 1);
    function routeDist(x, y, z) {                          // least distance from a point to the flown line
      let cm = Infinity;
      for (let c = 0; c < coarse.length; c++) { const i = c * 12, dx = RT[i] - x, dy = RT[i + 1] - y, dz = RT[i + 2] - z, d = dx * dx + dy * dy + dz * dz; coarse[c] = d; if (d < cm) cm = d; }
      const lim = Math.pow(Math.sqrt(cm) + 12, 2); let best = Infinity;
      for (let c = 0; c < coarse.length; c++) {
        if (coarse[c] > lim) continue;
        for (let i = Math.max(0, c * 4 - 4), e = Math.min(NR - 1, c * 4 + 4); i <= e; i++) { const d = segD2(i, x, y, z); if (d < best) best = d; }
      }
      return Math.sqrt(best);
    }
    function nearXZ(x, z) {                                // the route's nearest table point on the chart: { i, dist }
      let best = Infinity, bi = 0;
      for (let i = 0; i <= NR; i++) { const dx = RT[i * 3] - x, dz = RT[i * 3 + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      return { i: bi, dist: Math.sqrt(best) };
    }
    // facing: a free-standing shape's normal is the route's tangent at its nearest point (it faces up-course)
    const yawAt = (i) => Math.atan2(-RTAN[i * 3], -RTAN[i * 3 + 2]);
    // ---- law 3: the least distance from the route of every corner, and of its shadow copy, of every shape built
    // within reach of the route (crests under 16 m, land, tower and wheel, buoys, birds, ring, bolts, the nearest
    // foam and sun strokes, the parts of her leaves under 36 m up); not measured: far crests, rain, clouds, every foam step but the glints, the further sun strokes, the sun and its bands
    const hairAt = (m, yaw, k) => { m.elements[12] += Math.sin(yaw) * k; m.elements[14] += Math.cos(yaw) * k; return m; };   // a station pushed k m along its own normal: no two stations of a chain share a plane
    const clearance = { least: Infinity, what: '', by: {} };   // by: the least distance of each kind of thing
    const cast = style.uniforms.uCast.value, backLen = style.uniforms.uBack.value;
    const _p = new THREE.Vector3(), _b = new THREE.Vector3();
    const noteD = (d, what) => {
      const k = what.replace(/ (d?\d+|left|right)\b/g, '');
      if (!(clearance.by[k] <= d)) clearance.by[k] = d;
      if (d < clearance.least) { clearance.least = d; clearance.what = what; }
      return d;
    };
    // corners of a flat geometry, with the midpoints of edges over 3 m (local xyz list)
    function cornersOf(geo) {
      const p = geo.attributes.position, ix = geo.index.array, out = [];
      for (let i = 0; i < p.count; i++) out.push(p.getX(i), p.getY(i), p.getZ(i));
      for (let t = 0; t < ix.length; t += 3) for (let e = 0; e < 3; e++) {
        const a = ix[t + e], b = ix[t + (e + 1) % 3], dx = p.getX(b) - p.getX(a), dy = p.getY(b) - p.getY(a), dz = p.getZ(b) - p.getZ(a);
        const n = Math.floor(Math.hypot(dx, dy, dz) / 3);
        for (let k = 1; k <= n; k++) { const f = k / (n + 1); out.push(p.getX(a) + dx * f, p.getY(a) + dy * f, p.getZ(a) + dz * f); }
      }
      return out;
    }
    // least distance of one instance (its corners and its shadow copy's) from the route, in design coordinates
    function instDist(corners, matrix, back) {
      let least = Infinity;
      { const e = matrix.elements, bx = back[0], by = back[1], bz = back[2];      // the back vector at its own length, as the shader takes it
        _b.set(e[0] * bx + e[4] * by + e[8] * bz, e[1] * bx + e[5] * by + e[9] * bz, e[2] * bx + e[6] * by + e[10] * bz).multiplyScalar(backLen); }
      for (let i = 0; i < corners.length; i += 3) {
        _p.set(corners[i], corners[i + 1], corners[i + 2]).applyMatrix4(matrix);
        least = Math.min(least, routeDist(_p.x, _p.y, _p.z), routeDist(_p.x + cast.x * mx + _b.x, _p.y + cast.y + _b.y, _p.z + cast.z + _b.z));
      }
      return least;
    }
    const BACK = [0, 0, -1], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
    const place = (x, y, z, yaw = 0, sx = 1, sy = 1, roll = 0) => { E.set(0, yaw, roll, 'YXZ'); Q.setFromEuler(E); S1.set(sx, sy, 1); return M.compose(_p.set(x, y, z), Q, S1); };
    const keelDist = (x, z) => {                           // metres from her keel line (stern to bowsprit tip) on the chart
      const kx = Math.sin(SHIP.yaw), kz = Math.cos(SHIP.yaw), s = Math.min(80, Math.max(-56, (x - SHIP.x) * kx + (z - SHIP.z) * kz));
      return Math.hypot(x - SHIP.x - kx * s, z - SHIP.z - kz * s);
    };
    // ---- a kind of segment: collect its stations, then make one batch (three passes on the same buffers) ------
    const kinds = [];
    function kind(name, geo, over = false) {                // over: it hangs ON a printed pane (its ghost and shadow are that ink's)
      const corners = cornersOf(geo), mats = [], specs = [];
      const k = {
        name, geo, corners, count: 0,
        // put one station; what = its name for the clearance table; check false only for things built far from the route
        put(matrix, spec, what, check = true) {
          if (check) noteD(instDist(corners, matrix, spec.back || BACK), what);
          for (let i = 0; i < 16; i++) mats.push(matrix.elements[i]);
          specs.push(spec); k.count++;
        },
        dist(matrix, back = BACK) { return instDist(corners, matrix, back); },
        async build() {
          const b = style.segments(geo, Math.max(1, k.count), { name, over });
          const m = new THREE.Matrix4();
          for (let i = 0; i < k.count; i++) { m.fromArray(mats, i * 16); b.add(m, specs[i]); if (i % 500 === 499) await ctx.yield(); }
          root.add(b.finish()); k.batch = b; mats.length = 0; specs.length = 0;
          await ctx.yield();
          return b;
        },
      };
      kinds.push(k); return k;
    }
    const FOR_GOOD = [1, 2];

    // ---- printed panes: flat ink, one merged mesh; the flats, the tower and the leg-1 buoys printed 0.3 m out of
    // register with what hangs on them; the ring's pair in register -------------------------------------------
    const pn = style.panes('lcs-panes');
    let rawPoly = null, rawQuad = null;                    // the pane builder's own poly and quad, unmeasured: for every foam step but the glints and for the far sky
    {                                                      // every pane drawn through pn.quad and pn.poly is measured against the route as it is drawn
      const check = (pts, what = 'printed pane') => {
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 3));
          for (let k = 0; k < n; k++) { const f = k / n; noteD(routeDist(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f), what); }
        }
      };
      const q0 = pn.quad, p0 = pn.poly; rawPoly = p0; rawQuad = q0;
      pn.quad = (a, b, c, d, col) => { check([a, b, c, d]); return q0(a, b, c, d, col); };
      pn.poly = (pts, col, what) => { check(pts, what); return p0(pts, col); };
    }
    const fr = ctx.rng.fork('flats');
    // THE SEA IS PRINTED WHOLE in the sea's ink, from the nearest water to the sea line (the kit's sea pane). On it
    // lie FOAM STREAKS: level dashes of the ground tone with pointed ends, few and thin, laid by place in five
    // steps of distance from the line (the first the glints; a stepped print, never a gradient): the nearer the line the finer and
    // shorter the dash, and the eye's own distance thins the far ones toward the sea line. They lie across the
    // course; in the exit quarter (to port of x CROSS_X and down-course of z CROSS_Z, where the last leg runs
    // toward -X) they lie across that leg, so the sea of the last leg is streaked as the sea of the first is.
    // (The draws the old bands made from this fork are still made, in their order: the land keeps its place.)
    const CROSS_X = -38, CROSS_Z = -350 - GAP;
    for (let k = -6; k <= 27 + Math.ceil(GAP / 28); k++) {
      const cut = -k * 28 - 6 < CROSS_Z;
      let x = (cut ? CROSS_X + 14 : -700 - RUN) + fr.range(0, cut ? 30 : 120);
      while (x < 520) { const x1 = Math.min(x + fr.range(110, 320), 600); x = x1 + fr.range(7, 16); }
    }
    const hashP = (a, b) => { const q = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return q - Math.floor(q); };
    // (the first step is the glints: the finest dashes, close under the line)
    // each step: from and to (m from the line), row pitch, dash width, least length and more, least gap and more, height above the sea
    const FOAM = [[0, 34, 7, 0.45, 2.5, 4, 9, 16, 0.16], [0, 70, 14, 1.1, 7, 12, 12, 22, 0.15], [70, 260, 28, 1.7, 26, 40, 34, 70, 0.4], [260, 1100, 84, 3.6, 110, 170, 120, 260, 1.2], [1100, 2500, 252, 8, 380, 500, 260, 520, 2.6]];
    for (let s = 0; s < FOAM.length; s++) {
      const [d0, d1, pitch, w, l0, l1, g0, g1, y] = FOAM[s], R = d1 + 40;
      for (let along = 0; along < 2; along++) {            // 0: dashes along x in rows of z; 1: the exit quarter, along z in rows of x
        const a0 = along ? -195 - R : -425 - R, a1 = along ? CROSS_X : 10 + R, b0 = along ? -425 - R : -195 - R, b1 = along ? CROSS_Z : 35 + R;
        for (let r = Math.ceil(a0 / pitch); r * pitch < a1; r++) {
          const a = r * pitch + 3 + 2 * s;
          let b = b0 + (l0 + g0) * hashP(r, 3 + s + 5 * along), j = 0;
          while (b < b1) {
            const e = b + l0 + l1 * hashP(r + 0.37 * s, 7 + j), m = (b + e) / 2, x = along ? a : m, z = along ? m : a;
            if ((x < CROSS_X && z < CROSS_Z) === !!along) {
              const dd = nearXZ(x, z).dist, h = w / 2;
              if (dd >= d0 && dd < d1) {
                (s === 0 ? pn.poly : rawPoly)(along
                  ? [[a + h, y, e], [a, y, e - h], [a, y, b + h], [a + h, y, b], [a + w, y, b + h], [a + w, y, e - h]]
                  : [[b, y, a + h], [b + h, y, a], [e - h, y, a], [e, y, a + h], [e - h, y, a + w], [b + h, y, a + w]], pal.ground, 'foam glint under the line');
              }
            }
            b = e + g0 + g1 * hashP(r - 0.61 * s, 31 + j); j++;
          }
          if ((r & 3) === 0) await ctx.yield();
        }
      }
    }
    await ctx.yield();
    { let low = Infinity; for (let i = 0; i <= NR; i++) low = Math.min(low, RT[i * 3 + 1]); noteD(low, 'the sea'); }      // the lowest point of the line's own table above the sea
    const strataK = kind('strata', style.lozenge(12, 0.9), true), tuftK = kind('scrub', style.shape([[-1.5, 0], [-1.25, 0.9], [-0.75, 0.5], [-0.3, 1.5], [0.2, 0.6], [0.7, 1.25], [1.1, 0.45], [1.5, 0.8], [1.5, 0]]), true);
    const surfK = kind('surf', style.chevron(3.6, 1.1, 0.5));
    // the wind-bent tree: a leaning trunk that forks, and three separate pads of foliage combed to leeward with
    // ground between them (one geometry of four outlines: they are one station together)
    const treeK = kind('tree', (() => {
      const parts = [
        [[-0.45, 0], [0.45, 0], [0.85, 2.3], [1.75, 3.7], [3.7, 4.9], [3.5, 5.4], [1.75, 4.5], [1.35, 6.9], [0.85, 6.9], [0.95, 4.3], [0.2, 2.5]],
        [[2.7, 5.5], [5.9, 5.6], [7.1, 6.2], [5.3, 6.8], [3.2, 6.6]],
        [[0.0, 7.0], [2.7, 7.0], [4.9, 7.5], [3.2, 8.3], [0.9, 8.1]],
        [[2.2, 9.1], [4.4, 9.1], [6.0, 9.5], [4.2, 10.1], [2.6, 9.9]],
      ].map((o) => style.shape(o));
      const pos = [], idx = [];
      for (const g of parts) { const o = pos.length / 3; pos.push(...g.attributes.position.array); for (const i of g.index.array) idx.push(o + i); g.dispose(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
      return g;
    })());
    // an orange flat: a wall of ink standing across the course from O, running W metres along U, facing N.
    // What hangs on it stands 0.7 m in front; its shadow copy floats half a metre off the ink, a hand's breadth aside.
    // near: the flat's first twelve metres from the route are stepped down (so its near end is never one tall
    // post beside the line), and on a long flat that stepped end carries its own short strata and scrub. bk: the shadow's back vector for what hangs on it; a flat
    // that faces along X (the axis of the fixed cast) carries a slanted one, so the copy still lands
    // before the ink and a hand's breadth to one side, in the plain and in the mirrored edition alike.
    function flat(name, O, U, N, W, H, low, treeAt, near = false, bk = BACK) {
      const crag = []; for (let i = 0; i < W / 6 + 2; i++) crag.push(fr.range(-1.5, 0));
      const top = (s) => {
        const c = crag[Math.floor(Math.max(0, s) / 6)], t = s < 30 ? low : low + (H - low) * (0.45 * smooth(30, 35, s) + 0.55 * smooth(39, 46, s));
        return (t + c) * (1 - 0.5 * smooth(W - 15, W, s)) * (near ? (s < 6 ? 0.36 : s < 12 ? 0.68 : 1) : 1);
      };
      const reg = 0.3 * (fr.chance(0.5) ? 1 : -1), yaw = Math.atan2(N[0], N[1]);
      const P3 = (s, y, f = 0) => [O[0] + U[0] * s + N[0] * f, y, O[1] + U[1] * s + N[1] * f];
      for (let s = 0; s < W; s += 3) {
        const s1 = Math.min(W, s + 3);
        pn.quad(P3(s + reg, 0), P3(s1 + reg, 0), P3(s1 + reg, top(s1) + 0.2), P3(s + reg, top(s) + 0.2), pal.orange);
      }
      // THE FOOT STANDS IN THE SEA: a line of foam (the ground tone) lies on the water before the face, in dashes
      // with pointed ends, and over it a surf line of crest segments stands 1.3 m before the ink, two stations
      // to a place (low and high), one dark, changing twice a second on the place's own phase
      for (let s = 0.5, j = 0; s < W - 2; j++) {
        const l = Math.min(W - s, 7 + 5 * hashP(O[0] + O[1], 3 + j)), s1 = s + l, f1 = 2.3 + 1.4 * hashP(O[1] - O[0], 17 + j), fm = f1 / 2;
        pn.poly([P3(s, 0.17, fm + 0.9), P3(s + 1.2, 0.17, 0.95), P3(s1 - 1.2, 0.17, 0.95), P3(s1, 0.17, fm + 0.9), P3(s1 - 1.2, 0.17, f1 * 0.6 + 0.9), P3(s + 1.2, 0.17, f1 * 0.6 + 0.9)], pal.ground);
        s = s1 + 0.8 + 1.2 * hashP(O[0], 29 + j);
      }
      // and the wash: the sea's ink stands against the rock's foot in a ragged line of laps 0.5 to 1.9 m high,
      // printed 0.25 m before the face, so the land's lower edge is never one straight line
      for (let s = 0, j = 0; s < W - 0.5; j++) {
        const l = Math.min(W - s, 2.2 + 2.6 * hashP(O[1] + O[0], 51 + j)), h = 0.5 + 1.4 * hashP(O[0] - O[1], 61 + j);
        pn.poly([P3(s, 0, 0.25), P3(s + l, 0, 0.25), P3(s + l * 0.72, h * 0.8, 0.25), P3(s + l * 0.4, h, 0.25), P3(s + l * 0.12, h * 0.55, 0.25)], pal.teal);
        s += l;
      }
      for (let s = 2.4, j = 0; s < W - 2; s += 4.3, j++) {
        const p = P3(s, 0, 1.3), ph = (p[0] * 0.35 - p[2] * 0.937) / 7.2 + 0.37 * j;
        for (let i = 0; i < 2; i++) surfK.put(hairAt(place(p[0], 0.3 + i * 1.05, p[2], yaw), yaw, 0.01 * i), { chain: [i, 2, 2, ph], dark: [2, 0], tone: 0 }, name + ' surf');
      }
      const minTop = (s, h) => Math.min(top(s - h), top(s - h / 2), top(s), top(s + h / 2), top(s + h));
      let row = 0;
      for (let y = 4; y < H; y += 4, row++) {                 // strata: bars 12 m long every 4 m of height
        for (let s = 7.5 + (row % 3) * 5.3 + fr.range(0, 2); s + 6.5 < W; s += 15.5 + fr.range(0, 1.5)) {
          if (minTop(s, 6.3) < y + 1.5) continue;
          const p = P3(s, y, 0.7);
          strataK.put(place(p[0], p[1], p[2], yaw), { dark: FOR_GOOD, tone: ORANGE, back: bk }, name + ' strata');
        }
      }
      for (let y = 6.6; y < H; y += 4) {            // and between the rows short bars, laid by a formula of the place
        for (let j = 0, s = 4 + 7 * hashP(O[1] + y, 3); s + 3.2 < W; s += 9 + 9 * hashP(O[1] + y, 11 + j), j++) {
          if (minTop(s, 3) < y + 1.5) continue;
          const p = P3(s, y, 0.7);
          strataK.put(place(p[0], p[1], p[2], yaw, 0.45, 0.8), { dark: FOR_GOOD, tone: ORANGE, back: bk }, name + ' strata');
        }
      }
      for (let y = 2.3; y < H; y += 2.1) {                   // cracks 3.6 m long between the rows, all over a small face (the skerry's, the islet's, the gate rock's)
        for (let j = 0, s = 2.5 + 5 * hashP(O[0] + y, 5); s + 2 < (W < 40 ? W : near ? 0 : 15); s += 6 + 6 * hashP(O[0] + y, 13 + j), j++) {
          if (minTop(s, 2) < y + 1.2) continue;
          const p = P3(s, y, 0.7);
          strataK.put(place(p[0], p[1], p[2], yaw, 0.3, 0.6), { dark: FOR_GOOD, tone: ORANGE, back: bk }, name + ' strata');
        }
      }
      if (near && W >= 40) {                                  // THE STEPPED NEAR END OF A LONG FLAT IS DRAWN TOO: short strata on every 1.6 m of its height, a tuft under each step's edge
        for (let y = 1.9; y < low; y += 1.6) {
          for (let s = 1.5 + 2.2 * hashP(O[1] + y, 23), k = 0; s < 12.6; s += 3.3 + 2.6 * hashP(O[1] + y, 37 + k), k++) {
            const sc = 0.2 + 0.14 * hashP(O[1] - y, 41 + k);
            if (minTop(s, 6 * sc + 0.3) < y + 0.9) continue;
            const p = P3(s, y, 0.7);
            strataK.put(place(p[0], p[1], p[2], yaw, sc, 0.55), { dark: FOR_GOOD, tone: ORANGE, back: bk }, name + ' strata');
          }
        }
        for (const s of [3.1, 9.2]) {
          const y = minTop(s, 1.3) - 2.0;
          if (y < 1.4) continue;
          const p = P3(s, y, 0.7);
          tuftK.put(place(p[0], p[1], p[2], yaw, 0.75, 0.75), { dark: FOR_GOOD, tone: ORANGE, back: bk }, name + ' scrub');
        }
      }
      row = 0;
      for (let y = 4; y < H; y += 4, row++) {                 // scrub: tufts 3 m across every 8 m, on the ledges
        for (let s = 3 + (row % 2) * 4 + fr.range(0, 2); s + 2 < W; s += 8) {
          const keep = fr.chance(0.62);
          if (!keep || minTop(s, 1.7) < y + 2.5) continue;
          const p = P3(s, y + 0.45, 0.7);
          const fl = fr.chance(0.5) ? 1 : -1;
          tuftK.put(place(p[0], p[1], p[2], yaw, fl), { dark: FOR_GOOD, tone: ORANGE, back: [bk[0] * fl, bk[1], bk[2]] }, name + ' scrub');
        }
      }
      if (treeAt != null) {                                     // a wind-bent tree on the crest: three stations of lean 9 degrees apart, one dark
        const p = P3(treeAt, minTop(treeAt, 0.6) + 0.25, 0.7), ph = p[0] * 0.13 + p[2] * 0.07;
        for (let i = 0; i < 3; i++) treeK.put(hairAt(place(p[0], p[1], p[2], yaw, 1, 1, -i * 9 * DEG), yaw, 0.01 * i), { chain: [i, 3, 1, ph], dark: [3, 1], tone: FAR, back: bk }, name + ' tree');
      }
      return top;
    }
    // the headland: five flats across the course left of leg 1; the first 30 m of each top is held low
    const HEAD = [[40, 12, 12], [58, 18, 14], [76, 26, 16], [94, 34, 18], [112, 22, 15]];
    for (let i = 0; i < 5; i++) {
      const [d, H, low] = HEAD[i], W = Math.round(fr.range(60, 120));
      flat('headland flat d' + d, [-10, -d], [-1, 0], [0, 1], W, H, low, i === 2 ? 20 : i === 4 ? 14 : null, true);
      await ctx.yield();
    }
    await ctx.yield();
    // THE SKERRY: rock in the sea to port of the last leg, between her stern and the ring. Each land is
    // stepped faces across the leg, one before another, the nearer lower and nearer the line (near ends 13 m and
    // more from it), so it has depth from the leg and from the sweep alike; every foot has its surf and lapping band
    const SKB = [cast.x * mx / backLen, 0, -(backLen + cast.x * mx) / backLen];     // local: x along the wall, z its normal (world X, the cast's axis)
    const SKX = RING.x + 72, SKZ = RING.z + 13;
    flat('skerry face 1', [SKX, SKZ], [0, 1], [1, 0], 22, 8, 8, null, false, SKB);
    await ctx.yield();
    flat('skerry face 2', [SKX - 6, SKZ + 4], [0, 1], [1, 0], 30, 17, 17, null, false, SKB);
    await ctx.yield();
    flat('skerry face 3', [SKX - 12, SKZ + 9], [0, 1], [1, 0], 27, 26, 26, 8, true, SKB);
    await ctx.yield();
    // the islet before the ring: three faces, the middle one with the wind-bent tree whole on its crest
    flat('islet face 1', [RING.x + 31, SKZ + 1], [0, 1], [1, 0], 18, 8, 8, null, false, SKB);
    flat('islet face 2', [RING.x + 26, SKZ + 4], [0, 1], [1, 0], 28, 15, 15, 4, false, SKB);
    flat('islet face 3', [RING.x + 21, SKZ + 10], [0, 1], [1, 0], 26, 22, 22, null, false, SKB);
    await ctx.yield();
    // THE GATE ROCK: the one large near shape of the last leg, beside the ring on the skerry's side of its axis:
    // three stepped faces across the leg, the nearer lower and nearer the axis (near ends 11 m and more off it,
    // the last 2 m short of the ring's plane and 5 m clear of its rim), seated in the sea with wash, foam and
    // surf, a wind-bent tree whole on its middle crest. The ring's buoys stand up the leg from it (below).
    const GATE = { x: RING.x + 12, z: RING.z + 11 };
    flat('gate rock face 1', [GATE.x, GATE.z], [0, 1], [1, 0], 14, 9, 9, null, false, SKB);
    flat('gate rock face 2', [GATE.x - 5, GATE.z + 2.5], [0, 1], [1, 0], 22, 16, 16, 4, false, SKB);
    await ctx.yield();
    flat('gate rock face 3', [GATE.x - 10, GATE.z + 5.5], [0, 1], [1, 0], 30, 22, 22, null, false, SKB);
    await ctx.yield();
    // ---- the lighthouse: an orange pane 69 m tall facing the entry, four dark bands, a dark lantern cage. It
    // stands to starboard of the berth leg, 46 m off the line: the line passes between the ship and the tower,
    // and from the berth the tower stands alone, no dark cloud round it, the printed bands low behind it ----------
    const barK = kind('bars', style.bar(1, 1), true);
    const LS = 1.15, LH = { x: 76, z: -360 - GAP }, lhw = (y) => 4.5 - 1.9 * y / 50;      // LS: the tower's scale on the brief's 60 m
    {
      const z = LH.z, x = LH.x + 0.3 * mx, o = pal.orange, q = (a, y0, b, y1) => pn.quad([x - a * LS, y0 * LS, z], [x + a * LS, y0 * LS, z], [x + b * LS, y1 * LS, z], [x - b * LS, y1 * LS, z], o);
      q(4.5, 0, 2.6, 50); q(3.7, 50, 3.7, 51.6); q(2.5, 51.6, 2.5, 57);
      pn.poly([[x - 3.1 * LS, 57 * LS, z], [x + 3.1 * LS, 57 * LS, z], [x, 60.2 * LS, z]], o);
      for (const y of [8, 18.5, 29, 39.5]) {
        barK.put(place(LH.x, (y + 2.2) * LS, z + 0.7, 0, (2 * lhw(y + 4.4) - 1.2) * LS, 4.4 * LS), { dark: FOR_GOOD, tone: ORANGE }, 'lighthouse band');
        // and the same bands on its seaward face: no side of the tower is a plain slab
        barK.put(place(LH.x, (y + 2.2) * LS, z - 0.7, 0, (2 * lhw(y + 4.4) - 1.2) * LS, 4.4 * LS), { dark: FOR_GOOD, tone: ORANGE, back: [0, 0, 1] }, 'lighthouse band');
      }
      for (const y of [52.2, 56.4]) barK.put(place(LH.x, y * LS, z + 0.7, 0, 4.6 * LS, 0.6 * LS), { dark: FOR_GOOD, tone: ORANGE }, 'lantern cage');
      for (const dx of [-2.05, -1.02, 0, 1.02, 2.05]) barK.put(place(LH.x + dx * LS, 54.3 * LS, z + 0.7, 0, 0.5 * LS, 3.6 * LS), { dark: FOR_GOOD, tone: ORANGE }, 'lantern cage');
    }
    // her beam: twelve flat wedges lying level round the lantern, three dark 120 degrees apart, stepping every 0.75 s
    {
      const R = 30 * LS, r = 5 * LS, pts = []; for (let i = 0; i <= 6; i++) { const a = (-14 + 28 * i / 6) * DEG; pts.push([R * Math.sin(a), R * Math.cos(a)]); }
      pts.push([r * Math.sin(14 * DEG), r * Math.cos(14 * DEG)], [-r * Math.sin(14 * DEG), r * Math.cos(14 * DEG)]);
      const g = style.shape(pts); g.rotateX(-Math.PI / 2);
      const wedgeK = kind('beam', g);
      for (let i = 0; i < 12; i++) wedgeK.put(place(LH.x, 54 * LS, LH.z + 0.35, i * 30 * DEG), { chain: [i, 12, 1 / 0.75, 0.61], dark: [4, 0], tone: FAR, back: [0, 0, 0] }, 'beam wedge');
    }
    // ---- channel buoys: orange panes 2.5 by 5 m, a dark band, a dark topmark in three stations of tilt -----------
    // the topmark is a seamark's diamond (two cones base to base) sitting on the pane's head: no stem, no barb
    const topK = kind('topmark', style.shape([[0, -0.2], [0.7, 0.65], [0, 1.5], [-0.7, 0.65]]));
    function buoy(x, z, N, name) {
      const yaw = Math.atan2(N[0], N[1]), ux = Math.cos(yaw), uz = -Math.sin(yaw), r = 0.3 * mx * (N[1] ? 1 : 0);
      const P3 = (s, y, f = 0) => [x + ux * s + N[0] * f, y, z + uz * s + N[1] * f];
      pn.quad(P3(-1.25 + r, 0.2), P3(1.25 + r, 0.2), P3(0.8 + r, 5.2), P3(-0.8 + r, 5.2), pal.orange);
      let p = P3(0, 2.7, 0.25);                               // hung close on so small a pane: its shadow copy stands a hand's breadth before the ink
      barK.put(place(p[0], p[1], p[2], yaw, 1.05, 1.0), { dark: FOR_GOOD, tone: ORANGE, back: N[0] ? SKB : BACK }, name + ' band');
      p = P3(0, 5.3, 0.7);
      const ph = x * 0.21 + z * 0.09;
      for (let i = 0; i < 3; i++) topK.put(hairAt(place(p[0], p[1], p[2], yaw, 1, 1, (i - 1) * 9 * DEG), yaw, 0.01 * i), { chain: [i, 3, 1, ph], dark: [3, 1], tone: 0 }, name + ' topmark');
    }
    const BUOY_D = [27, 72, 120, 172, 198];               // the first pair stands 27 m in; the third beyond the last headland flat, clear of it
    for (const d of BUOY_D) { buoy(9, -d, [0, 1], 'buoy d' + d + ' right'); buoy(-9, -d, [0, 1], 'buoy d' + d + ' left'); }
    // the ring's pair: a gate 11 m either side of the last leg, 54 m before the ring, between the skerry and the islet
    const RB = [RING.x + 54, 11];
    buoy(RB[0], RING.z - RB[1], [1, 0], 'ring buoy right'); buoy(RB[0], RING.z + RB[1], [1, 0], 'ring buoy left');
    // ---- THE BREAK IN THE WEATHER IS A PRINTED SUNSET, in the third ink only. Panes: always on, flat, no gradient,
    // by place. (1) A low half sun standing on the sea line 240 m beyond the ring and to starboard of its axis,
    // square to the last leg, with four level bars of the same ink
    // above it, each shorter and thinner than the one below, ground between them. Nothing of it stands within
    // 200 m of the route.
    const SUN = { x: RING.x - 240, z: RING.z - 105, r: 120, ux: 0, uz: 1 };      // ux, uz: the level direction in its plane
    {
      const S3 = (q, y) => [SUN.x + SUN.ux * q, y, SUN.z + SUN.uz * q], pts = [S3(0, 0)];
      for (let i = 0; i <= 36; i++) { const a = Math.PI * i / 36; pts.push(S3(SUN.r * Math.cos(a), SUN.r * Math.sin(a))); }
      rawPoly(pts, pal.yellow);
      for (const [yr, hr, lr] of [[1.09, 0.085, 0.66], [1.21, 0.06, 0.48], [1.31, 0.042, 0.31], [1.39, 0.028, 0.15]]) {
        const y = yr * SUN.r, k = hr * SUN.r / 2, hl = lr * SUN.r;
        rawPoly([S3(hl, y), S3(hl - k, y - k), S3(-hl + k, y - k), S3(-hl, y), S3(-hl + k, y + k), S3(hl - k, y + k)], pal.yellow);
      }
    }
    await ctx.yield();
    // (2) LONG LEVEL BANDS of the same ink, low in the sky, standing on a circle 1500 m about the middle of the
    // course: right round the horizon the line looks at, longest and closest together near the sun's bearing,
    // shorter, thinner and fewer away from it and upward, ground between the rows, none over twelve and a half
    // degrees up from any point of the line.
    // Each is a level strip with pointed ends, laid along the circle by a formula of its own row and number.
    {
      const BC = [-40, -340], BR = 1500, th0 = Math.atan2(BC[0] - SUN.x, BC[1] - SUN.z);      // the sun's bearing from BC, from -Z toward -X
      const B3 = (th, y) => [BC[0] - BR * Math.sin(th), y, BC[1] - BR * Math.cos(th)];
      // each row: degrees up, degrees thick, its reach either side of the sun's bearing, its greatest length (degrees)
      const ROWS = [[1.6, 1.0, 170, 36], [3.3, 0.95, 150, 30], [5.0, 0.85, 125, 26], [6.8, 0.72, 95, 22], [8.6, 0.58, 62, 18], [10.4, 0.45, 34, 14]];
      for (let j = 0; j < ROWS.length; j++) {
        const [el, tk, reach, L0] = ROWS[j];
        let ph = -reach + 6 * hashP(j, 2.5), n = 0;
        while (ph < reach - 3) {
          const a = Math.min(1, Math.abs(ph) / 150);
          const L = Math.min(reach - ph, L0 * (1 - 0.5 * a) * (0.7 + 0.6 * hashP(j + 0.3, n)));
          const t = BR * Math.tan(tk * DEG) * (1 - 0.42 * a) * (0.85 + 0.3 * hashP(n, j + 7)), y = 7 + BR * Math.tan((el + 0.3 * (hashP(n + 0.7, j) - 0.5)) * DEG);
          const tip = Math.min(L / 2.2, (t * 1.6 / BR) / DEG), N = Math.max(1, Math.ceil((L - 2 * tip) / 3));
          const A = (th0 + ph * DEG), Bn = (th0 + (ph + L) * DEG), A1 = A + tip * DEG, B1 = Bn - tip * DEG;
          rawPoly([B3(A, y), B3(A1, y - t / 2), B3(A1, y + t / 2)], pal.yellow);
          for (let i = 0; i < N; i++) {
            const p = A1 + (B1 - A1) * i / N, q = A1 + (B1 - A1) * (i + 1) / N;
            rawQuad(B3(p, y - t / 2), B3(q, y - t / 2), B3(q, y + t / 2), B3(p, y + t / 2), pal.yellow);
          }
          rawPoly([B3(Bn, y), B3(B1, y + t / 2), B3(B1, y - t / 2)], pal.yellow);
          ph += L + (2.5 + 8 * a) * (0.7 + 0.6 * hashP(n + 0.11, j + 3)); n++;
        }
      }
    }
    await ctx.yield();
    // (3) ON THE WATER UNDER THE SUN, A PATH OF SHORT BROKEN LEVEL STROKES of the same ink: rows across a line from
    // the sun's foot to the last leg, the path widening all the way from the sun, the strokes finer and the rows
    // closer the nearer they lie to the route (three steps, by place). None among the lands of the last leg,
    // none under the ring or its buoys. The nearest step is measured against the route like any pane.
    {
      const T = [-55, RING.z], ax = T[0] - SUN.x, az = T[1] - SUN.z, AL = Math.hypot(ax, az), ux = ax / AL, uz = az / AL, vx = -uz, vz = ux;
      for (let s = 16, r = 0; s < AL + 10; r++) {
        const cx = SUN.x + ux * s, cz = SUN.z + uz * s, dd = nearXZ(cx, cz).dist, st = dd < 70 ? 0 : dd < 260 ? 1 : 2;
        const w = [1.1, 1.9, 3.4][st], h = w / 2, y = [0.22, 0.5, 1.4][st], half = 16 + 0.085 * s, end = half * (0.8 + 0.4 * hashP(r, 2.5));
        const P = (q, k) => [cx + vx * q + ux * k, y, cz + vz * q + uz * k];
        for (let b = -half * (0.8 + 0.4 * hashP(r, 1.5)), j = 0; b < end; j++) {
          const e = Math.min(b + [5, 8, 13][st] * (0.7 + 1.1 * hashP(r + 0.3, j)), end + 4), x = cx + vx * (b + e) / 2, z = cz + vz * (b + e) / 2;
          const off = (z > RING.z + 8 && x < -90) || Math.hypot(x - RING.x, z - RING.z) < 15 + (e - b) / 2 || (Math.abs(x - RING.x - 54) < 4 + (e - b) / 2 && Math.abs(Math.abs(z - RING.z) - 11) < 4);
          if (!off && e - b > 2 * w) (st === 0 ? pn.poly : rawPoly)([P(b, h), P(b + h, 0), P(e - h, 0), P(e, h), P(e - h, w), P(b + h, w)], pal.yellow, 'sun stroke under the line');
          b = e + [7, 6, 8][st] * (0.6 + 1.2 * hashP(r - 0.2, j + 9));
        }
        s += [9, 13, 21][st] * (0.85 + 0.3 * hashP(r, 7));
      }
    }
    await ctx.yield();
    // ---- the ring: sixteen arc segments standing in the sea, 22 m across with a 14 m opening, every fourth dark --
    {
      const pts = [], h = 9.2 * DEG;
      for (let i = 0; i <= 5; i++) { const a = -h + 2 * h * i / 5; pts.push([11 * Math.sin(a), 11 * Math.cos(a)]); }
      for (let i = 5; i >= 0; i--) { const a = -h + 2 * h * i / 5; pts.push([7.15 * Math.sin(a), 7.15 * Math.cos(a)]); }
      const ringK = kind('ring', style.shape(pts));
      for (let i = 0; i < 16; i++) ringK.put(place(RING.x, RING.y, RING.z, 90 * DEG, 1, 1, (i + 0.5) * 22.5 * DEG), { chain: [i, 16, 1 / 0.75, 0.23], dark: [4, 0], tone: FAR }, 'ring arc');
    }
    const paneMesh = pn.build(); root.add(paneMesh);
    await ctx.yield();

    // ---- the hero: the barque, seven leaves, made with the same style ----------------------------------------
    const hero = await buildHero(ctx, { style, palette: hex, detail, stage: false });
    hero.object.position.set(SHIP.x, 0, SHIP.z); hero.object.rotation.y = SHIP.yaw;
    root.add(hero.object); hero.object.updateMatrix();
    await ctx.yield();
    {                                                      // her corners and shadow copies against the route (design coordinates)
      // one leaf at a time, a yield between leaves. clearancePoints applies the WORLD cast; mirrored, the shadow
      // copy's x shifts the other way by 2 * cast.x
      for (let leaf = 0; leaf < 7; leaf++) {
        const cp = hero.clearancePoints(hero.object.matrix, leaf);
        await ctx.yield();
        for (let i = 0; i < cp.length; i += 3) {
          const sh = (i / 3) & 1, x = cp[i] - (sh && mx < 0 ? 2 * cast.x : 0);
          if (cp[i + 1] < 36) noteD(routeDist(x, cp[i + 1], cp[i + 2]), sh ? 'barque leaf (shadow copy)' : 'barque leaf');   // the route never rises above 17 m
          if (i % 6000 === 5997) await ctx.yield();
        }
        await ctx.yield();
      }
    }
    // ---- where the sea is not: land, tower, buoys and the ring keep their own ground --------------------------
    const BUOYS = [...BUOY_D.flatMap((d) => [[9, -d], [-9, -d]]), [RB[0], RING.z - RB[1]], [RB[0], RING.z + RB[1]]];
    function onLand(x, z, m) {
      if (x < -10 + m && x > -135 - m && z < -36 + m && z > -116 - m) return true;                    // the headland
      if (x < SKX + 4 + m && x > SKX - 15 - m && z > SKZ - 2 - m && z < SKZ + 40 + m) return true;                    // the skerry
      if (x < RING.x + 35 + m && x > RING.x + 18 - m && z > SKZ - 1 - m && z < SKZ + 40 + m) return true;            // the islet
      if (x < GATE.x + 4 + m && x > GATE.x - 13 - m && z > GATE.z - 2 - m && z < GATE.z + 40 + m) return true;     // the gate rock
      if (Math.hypot(x - LH.x, z - LH.z) < 7 * LS + m) return true;                                   // the lighthouse
      if (Math.abs(x - RING.x) < 3 + m && Math.abs(z - RING.z) < 13 + m) return true;                 // the ring
      for (const b of BUOYS) if (Math.hypot(x - b[0], z - b[1]) < (b[0] > -100 ? 3.2 : 11) + m) return true;   // the ring's pair keeps a wider clear sea
      return false;
    }
    // no crest column in the sight line of a buoy from up-course: 26 m of clear sea before each pane
    const inSight = (x, z) => {
      for (const b of BUOYS) {
        if (b[0] > -100 ? (Math.abs(x - b[0]) < 3.6 && z > b[1] && z < b[1] + 26) : (Math.abs(z - b[1]) < 3.6 && x > b[0] && x < b[0] + 26)) return true;
      }
      return false;
    };
    // ---- crest columns: a chevron at five heights, one dark, stepping twice a second; the phase is a formula of
    // the place, so the dark crests travel toward the headland as wave lines. THEY STAND ON THE INK: every station
    // of every column is under 6 m, below the lowest eye, so a crest always has the printed sea behind it, and the
    // sea (a pane) covers its unlit stations and its shadow copy: only the dark crest shows. SIZE BY PLACE: a
    // column's chevron is as wide as its distance from the line allows (0.19 of it, to 4.5 m), so the crests
    // nearest the line are the smallest; half the sites of the old grid are left bare ---------------------------
    const crestK = kind('crests', style.chevron(4.5, 1.3, 0.55));
    const WAVE = { x: -0.35, z: 0.937, step: 7.2 };          // wave lines run toward the headland; 7.2 m to a step
    const farR = 150 + 170 * detail * detail;
    let nCol = 0;
    for (let iz = -28; iz <= 60 + Math.ceil(GAP / 12); iz++) {
      for (let ix = -64 - Math.ceil(RUN / 9); ix <= 40; ix++) {
        const x = ix * 9 + (iz & 1) * 4.5, z = -iz * 12 - 1;
        const nr = nearXZ(x, z);
        if (nr.dist < 8 || nr.dist > farR) continue;
        const far = nr.dist > 150;
        if (far && ((ix & 1) || (iz & 1) || (((ix >> 1) + (iz >> 1)) & 1))) continue;   // beyond 150 m: every other site of an 18 by 24 m grid, three stations, twice the size
        if (!far && (nr.dist > 85 ? ((ix & 1) || (iz & 1)) : ((ix + iz) & 1))) continue;   // within 85 m every other site; from 85 m out one in four (things further from the line are drawn with fewer segments, by place)
        if (keelDist(x, z) < 14.3 || onLand(x, z, 2.3) || inSight(x, z)) continue;
        if (Math.abs(x - LH.x) < 7 * LS && z > LH.z && z < LH.z + 60) continue;      // none close before the tower's printed foot
        const gap = 0.5, yaw = yawAt(nr.i), n = far ? 3 : 5;
        const p = -(x * WAVE.x + z * WAVE.z) / WAVE.step, sc = far ? 2 : Math.min(1, nr.dist / 23.6);
        if (nr.dist < 16) {                                  // law 3 by place: a column any station of which comes within 5 m is not placed
          let least = Infinity;
          for (let i = 0; i < n; i++) least = Math.min(least, crestK.dist(place(x, (0.35 + i * gap) * sc, z, yaw, sc, sc)));
          if (least < 5) continue;
        }
        for (let i = 0; i < n; i++) {
          crestK.put(hairAt(place(x, (0.35 + i * gap) * sc, z, yaw, sc, sc), yaw, 0.01 * sc * i), { chain: [i, n, 2, p], dark: [n, 0], tone: TEAL + (far ? FAR : 0) }, 'crest column', nr.dist < 16);
        }
        if (++nCol % 150 === 0) await ctx.yield();
      }
      await ctx.yield();
    }
    // ---- rain: A FEW CLEAN RANKS in the heart of the squall, by place to starboard of the course and beyond the
    // tower as the line sees it, so no rank stands across the ship or the tower from any point of the line. A rank
    // is a row of columns 7 m apart standing across the course; a column is nine lozenges, 2.4 m apart from 2 to
    // 21 m up, three of them dark, falling one station twice a second on the place's own phase
    const lozV = style.lozenge(1.8, 0.5); lozV.rotateZ(Math.PI / 2);
    const rainK = kind('rain', lozV);
    const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
    const rainKeep = Math.min(1, density * detail * 1.2);
    // (every rank stands to starboard of the tower and no further down-course than it: no line of sight from the
    // route to the tower or to the ship passes through a rank)
    const RANKS = [-285 - GAP, -310 - GAP, -335 - GAP, -360 - GAP];
    for (let r = 0; r < RANKS.length; r++) {
      for (let j = 0; j < 9; j++) {
        const x = 104 + 3.5 * (r & 1) + j * 7, z = RANKS[r];
        if (hash(j, r) > rainKeep) continue;                 // density thins the ranks, never which stations are dark
        const nr = nearXZ(x, z), yaw = yawAt(nr.i), p = x * 0.37 + z * 0.61;   // the phase is the place's own number: no two columns fade at one instant
        for (let i = 0; i < 9; i++) rainK.put(place(x, 2 + i * 2.4, z, yaw, 2, 1.2), { chain: [i, 9, -2, p], dark: [3, 0], tone: 0 }, 'rain column', false);
      }
    }
    await ctx.yield();
    // ---- gulls (or petrels), as chains: stations 7 m apart (petrels 5.5 m), each holding two wing poses; every third station is
    // dark and the dark birds step together twice a second, the wing pose alternating. ONE RULE: no station of a
    // chain, wingtip or shadow, within 8 m of the route; a chain stops where it would break it -----------------
    // (the second pose is a shallow down-stroke, 0.32 of the first turned over (0.45 on the placed chains): the two together at one station
    // read as one bird with a beating wing, never as a cross)
    const birdK = kind(petrels ? 'petrels' : 'gulls', style.shape([[-2.5, 0.6], [-1.3, 1.05], [0, 0.3], [1.3, 1.05], [2.5, 0.6], [1.35, 0.5], [0.4, -0.1], [0, -0.55], [-0.4, -0.1], [-1.35, 0.5]]));
    const gr = ctx.rng.fork('birds');
    const nChains = Math.round(14 * density * (0.7 + 0.3 * detail));
    const bsx = petrels ? 0.72 : 1, bsy = petrels ? 0.7 : 1, bstep = petrels ? 5.5 : 7;
    const _t = new THREE.Vector3(), _q = new THREE.Vector3();
    for (let c = 0; c < nChains; c++) {
      // every draw for this chain is made here, whatever becomes of it
      const dr = 24 + (c * (dpath.length - 49)) / Math.max(1, nChains - 1) + (c ? gr.range(-5, 5) : 0), side0 = (gr() < 0.5 ? -1 : 1), off = gr.range(11, 24), ang = gr.range(14, 40) * DEG;
      const h0 = petrels ? gr.range(5, 15) : gr.range(9, 34), rise = gr.range(-0.5, 0.9), nSt = petrels ? gr.int(13, 17) : gr.int(9, 12);
      for (let attempt = 0; attempt < 2; attempt++) {
        const side = attempt ? -side0 : side0;
        dpath.posAtDist(Math.min(dr, dpath.length - 1), _q); dpath.tangentAtDist(Math.min(dr, dpath.length - 1), _t);
        const tl = Math.max(Math.hypot(_t.x, _t.z), 1e-4), tx = _t.x / tl, tz = _t.z / tl, rx = -tz * side, rz = tx * side;   // right (or left) of the course
        let x = _q.x + rx * off, y = Math.max(h0, _q.y + (c ? 2 : 1.5)), z = _q.z + rz * off;
        if (c === 0) { x = 11.3; y = 9.6; z = -37; }           // the first chain: centre 11.3 m right of the line at d 37 (nearest wingtip about 9 m), 9.6 m up, running away ahead and right
        const a = c === 0 ? 20 * DEG : ang, s0 = c === 0 ? 1 : side;
        const dx = tx * Math.cos(a) + (-tz * s0) * Math.sin(a), dz = tz * Math.cos(a) + (tx * s0) * Math.sin(a);
        const ph = x * 0.11 + z * 0.07, st = [];
        for (let s = 0; s < nSt; s++) {
          const px = x + dx * bstep * s, py = Math.min(40, Math.max(4.5, y + (c === 0 ? 0.55 : rise) * s)), pz = z + dz * bstep * s;
          if (keelDist(px, pz) < 42 || (py < 40 && onLand(px, pz, 3.5))) break;
          const yaw = yawAt(nearXZ(px, pz).i);
          if (birdK.dist(place(px, py, pz, yaw, bsx, bsy)) < 8 || birdK.dist(place(px, py, pz, yaw, bsx, -bsy * 0.7)) < 8) break;
          st.push([px, py, pz, yaw]);
        }
        if (st.length < 5 && attempt === 0 && c > 0) continue;          // too short on this side: try the other
        for (let s = 0; s < st.length; s++) for (let q = 0; q < 2; q++) {
          const [px, py, pz, yaw] = st[s], ci = 6 + ((s % 3) * 4 + q * 3) % 6;       // dark when the clock's step is s (mod 3) and q (mod 2)
          birdK.put(place(px, py, pz, yaw, bsx, q ? -bsy * 0.32 : bsy), { chain: [ci, 1000, 2, ph], dark: [6, 0], tone: FAR }, 'bird chain ' + c);
        }
        break;
      }
      await ctx.yield();
    }
    // chains laid by place (no draw): larger birds; each stops where the one rule would be broken, and its phase is
    // the same formula of its place as every other chain's
    const placedChain = (x0, y0, z0, sx, sy, sz, n, k, what) => {
      const ph = x0 * 0.11 + z0 * 0.07, st = [];
      for (let i = 0; i < n; i++) {
        const px = x0 + sx * i, py = y0 + sy * i, pz = z0 + sz * i, yaw = yawAt(nearXZ(px, pz).i);
        if (keelDist(px, pz) < 42 || birdK.dist(place(px, py, pz, yaw, bsx * k, bsy * k)) < 8 || birdK.dist(place(px, py, pz, yaw, bsx * k, -bsy * 0.7 * k)) < 8) break;
        st.push([px, py, pz, yaw]);
      }
      for (let i = 0; i < st.length; i++) for (let q = 0; q < 2; q++) {
        const [px, py, pz, yaw] = st[i], ci = 6 + ((i % 3) * 4 + q * 3) % 6;
        birdK.put(place(px, py, pz, yaw, bsx * k, (q ? -bsy * 0.45 : bsy) * k), { chain: [ci, 1000, 2, ph], dark: [6, 0], tone: FAR }, what);
      }
    };
    // the ring's chain: running away from the last leg on the break's side, 38 degrees off it, centres 16 m and more
    // off the line (nearest wingtip 10.6 m with gulls), climbing: from the leg its birds stand apart on a slant, never one behind another
    placedChain(RING.x + 47, 12.5, RING.z - 16.5, -7, 0.9, -5.5, 11, 2.5, 'ring bird chain');
    // the exit run's chain: the largest birds, coming in across the break from far to starboard toward the last leg
    // (its last centre 26 m short of the line on the chart, nearest wingtip about 25 m), above the eye: seen from the leg they stand apart across the sky, never
    // one behind another
    placedChain(RING.x + 72, 24, RING.z - 80, -4, 0.4, 9, 7, 3, 'exit bird chain');
    // the reveal's chain: over the open sea between the headland and her, to starboard of the course, climbing away
    placedChain(14.5, 16, -150 - GAP * 0.5, 1.2, 1.3, -8, 10, 2, 'reveal bird chain');
    // the heart's chain: large gulls (petrels in that edition) climbing away down-course over the open sea beyond the sweep, to port of the tower as the berth sees it
    placedChain(10, 22, -395 - GAP, -6, 2, -8, 8, 3, 'heart bird chain');
    // the sun's chain: large gulls (petrels in that edition) on a slant before the half sun, beyond the ring and to starboard of its axis
    placedChain(RING.x - 33, 16, RING.z - 16, -9, 2.2, -6.5, 9, 3, 'sun bird chain');
    // ---- cloud bars: A CLEAR SKY ROUND THE SHIP, THE TOWER AND THE SUN. A few stairs of flat lozenges (four
    // stations 12 m apart, one dark, stepping every 1.5 s) stand high and to the sides BY PLACE: a stair is placed
    // only where no end or middle of any of its stations stands within CLEAR degrees of the ship and her fan (from
    // every 6 m of the line up to the end of the sweep, after which she lies astern), of the tower and its wheel
    // (from the line up to the tower's own berth) or of the half sun and its bars (from the whole line). No lid,
    // no low tier, and none close over the line: every stair's centre stands 230 m and more from the line on the chart
    // (its nearest station end about 190 m).
    const cloudK = kind('clouds', style.lozenge(65, 7));
    const CLB = [2.5 * mx, -2.5, -1];                      // so large and far a shape drops its copy a little further, fixed
    const CLEAR = 2 * DEG;
    const KEEPOUT = [[SHIP.x, 32, SHIP.z, 62, 236], [LH.x, 40, LH.z, 46, 178], [SUN.x, 0.7 * SUN.r, SUN.z, 1.05 * SUN.r, NR]];      // x, y, z, radius, the last table point it is seen from   // spheres: the ship and her fan, the tower and its wheel, the sun and its bars
    const sightClear = (x, y, z) => {
      for (let i = 0; i <= NR; i += 3) {
        const ex = RT[i * 3], ey = RT[i * 3 + 1], ez = RT[i * 3 + 2], dx = x - ex, dy = y - ey, dz = z - ez, dl = Math.hypot(dx, dy, dz);
        for (const k of KEEPOUT) {
          if (i > k[4]) continue;
          const tx = k[0] - ex, ty = k[1] - ey, tz = k[2] - ez, tl = Math.hypot(tx, ty, tz);
          const c = (dx * tx + dy * ty + dz * tz) / Math.max(dl * tl, 1e-6);
          if (Math.acos(Math.min(1, Math.max(-1, c))) < Math.asin(Math.min(0.95, k[3] / Math.max(tl, 1))) + CLEAR) return false;
        }
      }
      return true;
    };
    const cands = [];
    for (let iz = -16; iz <= 4; iz++) {
      for (let ix = -11; ix <= 8; ix++) {
        const x = ix * 58 + 29 * (iz & 1) + 11, z = iz * 58 - 7, nr = nearXZ(x, z);
        if (nr.dist < 230 || nr.dist > 520) continue;       // none close over the line: every stair's centre 230 m and more from it on the chart
        const h = hashP(ix * 1.31, iz * 0.77), len = 40 + 50 * hashP(ix, iz + 40), lvl = [58, 84, 112][Math.floor(h * 2.999)];
        const yaw = yawAt(nr.i), ux = Math.cos(yaw), uz = -Math.sin(yaw), dirn = hashP(ix + 9, iz) < 0.5 ? 1 : -1;
        let ok = true;
        for (let i = 0; i < 4 && ok; i++) {
          const o = (i - 1.5) * 12.1 * dirn, y = lvl + 10.5 - i * 7;
          for (const e of [-0.5, 0, 0.5]) if (!sightClear(x + ux * (o + e * len), y, z + uz * (o + e * len))) { ok = false; break; }
        }
        if (ok) cands.push([hashP(ix * 3.1 + 0.5, iz * 1.7), x, z, lvl, len, yaw, dirn, nr.dist]);
      }
      await ctx.yield();
    }
    cands.sort((a, b) => a[0] - b[0]);
    const nCloud = Math.min(cands.length, Math.round(16 * (0.6 + 0.4 * detail)));
    for (let c = 0; c < nCloud; c++) {
      const [, x, z, lvl, len, yaw, dirn, dist] = cands[c], ux = Math.cos(yaw), uz = -Math.sin(yaw), ph = x * 0.013 + z * 0.021;
      for (let i = 0; i < 4; i++) {
        const o = (i - 1.5) * 12.1 * dirn;
        cloudK.put(place(x + ux * o, lvl + 10.5 - i * 7, z + uz * o, yaw, len / 65, 1), { chain: [i, 4, 1 / 1.5, ph], dark: [4, 0], tone: FAR, back: CLB }, 'cloud bar', false);
      }
    }
    await ctx.yield();
    // ---- the rare event, black lightning: five forked ghost bolts 90 m tall stand in the squall, each 25 m or
    // more from the route; on the clock one goes dark for half a second every four seconds -----------------------
    if (vary.rare) {
      const strip = (pts, w0, w1) => {                       // a polyline thickened across x: an outline up one side and down the other
        const o = [], n = pts.length;
        for (let i = 0; i < n; i++) o.push([pts[i][0] + (w0 + (w1 - w0) * i / (n - 1)) / 2, pts[i][1]]);
        for (let i = n - 1; i >= 0; i--) o.push([pts[i][0] - (w0 + (w1 - w0) * i / (n - 1)) / 2, pts[i][1]]);
        return style.shape(o);
      };
      const a = strip([[1, 0], [-5, 17], [4, 33], [-4, 52], [5, 70], [0, 90]], 2, 4.2), b = strip([[15, 9], [9, 20], [4, 33]], 2, 2.6);
      const pa = a.attributes.position, pb = b.attributes.position, pos = new Float32Array((pa.count + pb.count) * 3);
      pos.set(pa.array, 0); pos.set(pb.array, pa.count * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex([...a.index.array, ...Array.from(b.index.array, (i) => i + pa.count)]);
      a.dispose(); b.dispose();
      const boltK = kind('bolts', g);
      const SPOTS = [[110, -300 - GAP], [150, -355 - GAP], [128, -425 - GAP], [176, -285 - GAP], [150, -475 - GAP]];   // among and beyond the rain ranks, to starboard of the tower
      for (let i = 0; i < 5; i++) {
        const [x, z] = SPOTS[i], nr = nearXZ(x, z);
        if (nr.dist < 25) continue;
        boltK.put(place(x, 2, z, yawAt(nr.i), i & 1 ? -1 : 1), { chain: [i * 8, 40, 2, 0], dark: [40, 0], tone: 0 }, 'bolt');
      }
    }
    for (const k of kinds) await k.build();

    const V = (x, y, z) => new THREE.Vector3(x * mx, y, z);
    edition0.clouds = nCloud; edition0.cloudSites = cands.length;
    const post = { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } };
    return {
      scene, path, duration: 42,
      pace: (u) => speedAt(u * dpath.length) / 13.4,                // nominal: from u alone
      title: 'The Liquid-Crystal Squall',
      camera: { fov: 62, near: 0.3, far: 4000, sway: 0.5, bank: 0.3 },
      pois: [                                                // fixed points, never functions
        { at: V(-60, 12, -70), from: 0.035, to: 0.155, weight: 0.5 },          // the headland's layered flats
        { at: V(SHIP.x, 34, SHIP.z), from: 0.15, to: 0.375, weight: 0.5 },         // the barque
        { at: V(SHIP.x + 10, 22, SHIP.z + 22), from: 0.29, to: 0.385, weight: 0.6 },    // her bow, as the line begins to stand off
        { at: V(SHIP.x + 17, 25, SHIP.z + 36), from: 0.365, to: 0.495, weight: 0.92 },   // her fore rig, from broad on her port bow
        { at: V(LH.x + 4, 40, LH.z), from: 0.47, to: 0.555, fade: 0.25, weight: 0.9 },   // the heart of the squall: the tower and its wheel, rain beyond it to starboard
        { at: V(4.4, 14, SHIP.z - 19.8), from: 0.53, to: 0.62, fade: 0.25, weight: 0.95 },   // a point 14 m up, 25 m in from the berth, abeam of her: passing it turns the gaze to her evenly
        { at: V(SHIP.x + 6, 28, SHIP.z + 14), from: 0.585, to: 0.665, weight: 0.95 },     // her whole port side, from abeam
        { at: V(SHIP.x - 3, 27, SHIP.z + 9), from: 0.655, to: 0.75, weight: 0.95 },      // her whole length from her port quarter, as the line rounds her stern
        { at: V(RING.x, 12, RING.z - 8), from: 0.74, to: 0.83, weight: 0.5 },      // down the last leg: the skerry, the ring, the break
        { at: V(RING.x - 40, 15, RING.z - 22), from: 0.81, to: 0.93, weight: 0.4 }, // the ring, its gulls and the break
      ],
      portal: { shape: 'circle', radius: 7, color: hex[6], glow: 0, frame: 0, blendDistance: 25 },   // a bare opening: the ring is its frame
      post, ride: 'none', style: 'none', companion: 'none',
      clearance,                                             // { least, what }: law 3, measured at build for the shapes within reach of the route named above; the kinds listed there as not measured are not
      edition: edition0,
      update(dt, time) { style.update(dt, time); },         // the world's clock and nothing else: no u, no camera
      dispose() { hero.dispose(); for (const k of kinds) if (k.batch) for (const m of k.batch.meshes) m.dispose(); },   // the instanced meshes' own buffers (the engine frees geometries and materials)
    };
  },
};
