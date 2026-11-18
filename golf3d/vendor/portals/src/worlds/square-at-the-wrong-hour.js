// THE SQUARE AT THE WRONG HOUR (after Giorgio de Chirico).  A port town with nobody in it, in thin dry oil: white arcades
// whose arches are solid black, an ochre square that tips up toward us, a sky in two flat bands, and ruled shadows four
// times too long, each at its own angle, each moving with its own hour.  +Z is the course.
//   z -40..163   the upper terrace (y 0), arcade A along its port side (we fly down its loggia), the red brick parapet
//   z 163..403   the square: a ramp rising 9 degrees from y -24.4 to y 13.5, walled by arcades B (starboard) and C (port)
//   z 411..531   the hero: the cube of a hundred arches (src/parts), entered by its central arch
//   z 531..631   the last court (a block cropped by the port edge, the cube's pierced shadow, the pair's shadows walking ahead of us, two
//                empty plinths) and the end wall: two low wings of six black arches and between them a pavilion 38 m tall
//                whose one great arch, 18 m by 24 m, is the lit one: the portal fills it; two red chimneys stand clear of it
// Flat pigment (post.flat): a hex written is the hex shown.  Four unlit materials from the hero's style, no lights.
// The shadows are the cast.  Each place has a clock of its own (one uHour per group of shadows, the same shader), and every
// clock is a one-way creep read from the metres we have flown, never from the world's clock: the forecourt's long shadow
// reaches arcade A and climbs it, the loggia's rank of tongues lengthens and swings on down it with us, nobody's shadow
// lies 40 m along our course from its head to the empty plinth and its raised arm lowers from the parapet to the plinth, the square's
// long fingers from chimneys we never see creep outward, the room's ranks of light slide, the pair walk into the lit arch.
// THE INSIDES are green-black and nothing else.  The loggia is solid green-black on wall, vault and floor, lit only by ochre
// tongues on the floor, one to an arch, and the standing arches of light they throw on its back wall.
// The cube's room is the picture in negative: ruled in white in shade under every tier (once we are inside), its floor
// carrying the front's arches as ranks of ochre light and long tongues from every lit arch of the flanks' second tier,
// each at an angle of its own, both flanks carrying tall standing arches of light on the blind tier, and the piers of the upper tiers small
// leaning arches of light between the arches of sky; it holds two empty plinths, a plaster ball 9 m across and a red cone
// 15 m tall.
// THE ROUTE crosses the square on an S: out of the end arch, diagonally to starboard along nobody's shadow, head first to
// its feet at the empty plinth, low past the plinth, between the ball and the cone, back to port under the cube (the gaze
// across to arcade C), then into the central arch, a swing to port through the room and back to its axis for the back arch,
// and a rise of 5 m through the court to the middle of the great arch.  Bird shadows come from behind over the ochre, pass
// under us, run up the ramp and up the white piers of the cube's two lower tiers and go out in its black arches (thirty-six
// in the edition of birds; the one great shadow and a dozen strays after it in the other).  Two more red chimneys stand
// far off behind the blocks, one on either side of the town.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, makeStyle, makeMasonryBuilder, makeShadowBuilder, makeFlock, archCell, steppedBand, addCubeShadow, addFigure, addTongue, cubeScaleAt, PALETTE, POST } from '../parts/square-at-the-wrong-hour.js';

const TAU = Math.PI * 2;
const SLOPE = 37.9 / 240;                         // the square rises 9 degrees
const rampY = (z) => (z <= 163 ? -24.4 : z >= 403 ? 13.5 : -24.4 + (z - 163) * SLOPE);
const TOP = 13.5, CUBE_Z = 471, END_Z = 631, DURATION = 40;
const AGREE_ANG = 0.62;      // the one sun every shadow in the town swings round to in the rare hour that agrees (rad, 0 = +Z, toward +X)
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// A wall that truly shrinks: it runs from p0 to p1 (world [x, z]), `K` times as large at p1 as at p0, so every ruled
// line on it runs to a point of the building's own.  Face space: a = metres along (0..R, bays shrink with the scale),
// b = up, e = out of the wall.  flip: the face looks the other way (a then runs from p1 to p0).  base(x, z) = ground.
function taperedFace(p0, p1, K, flip, base) {
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dx = (p1[0] - p0[0]) / L, dz = (p1[1] - p0[1]) / L;
  const kap = K < 0.999 ? -Math.log(K) / 1 : 0, R = K < 0.999 ? L * kap / (1 - K) : L;      // R: so that the near bay is true size
  const sOf = (run) => (kap ? Math.exp(-kap * run / R) : 1);
  const dOf = (run) => (kap ? L * (1 - sOf(run)) / (1 - K) : run);
  const nx = flip ? dz : -dz, nz = flip ? -dx : dx;
  const X = { R, L, K, flip, n: [nx, nz], dir: [dx, dz], sOf, dOf };
  X.run = (a) => (flip ? R - a : a);
  X.xf = (a, b, e) => {
    const run = flip ? R - a : a, s = sOf(run), d = dOf(run), fx = p0[0] + dx * d, fz = p0[1] + dz * d;
    return [fx + nx * e * s, base(fx, fz) + b * s, fz + nz * e * s];
  };
  X.at = (run, b = 0, e = 0) => X.xf(flip ? R - run : run, b, e);
  return X;
}
// the face across one end of such a building: `W` metres wide from the main face back into it, looking along the run
// (far = true) or against it.  Its own face space is right-handed whichever way the building runs.
function endFace(X, far, W) {
  const out = (X.flip ? !far : far) ? 1 : -1, a0 = far ? (X.flip ? 0 : X.R) : (X.flip ? X.R : 0);
  // candidates: a2 -> e = -a2 or e = a2 - W; take the one whose (a, b, e) frame is right-handed in face space
  const m = out > 0 ? (a2) => -a2 : (a2) => a2 - W;
  return { R: W, xf: (a2, b, e2) => X.xf(a0 + out * e2, b, m(a2)), eOf: m };
}

// One arcade front: bays of the module (pier on a stepped base, three-step impost, arch struck a little flat, reveal),
// a string course, a plain storey with one small square black window a bay, a cornice whose line overshoots the corners.
async function arcadeFront(b, X, o, pause) {
  const cell = X.R / o.bays, T = o.T, pierHalf = cell * 0.5 - o.hw;
  b.xf = X.xf;
  for (let i = 0; i < o.bays; i++) {
    const open = o.open ? o.open(i) : !o.blind;
    archCell(b, i * cell, 0, cell, o.strY, o.hw, o.jamb, o.rise, T, o.seg, o.side, false, !!o.inner && open, !open, 0);
    if (i % 3 === 2) await pause();
  }
  const ih = o.impostH ?? 0.5, ip = o.impost ?? 0.28;
  for (let p = 0; p <= o.bays; p++) {
    const pa0 = p === 0 ? 0 : p * cell - pierHalf, pa1 = p === o.bays ? X.R : p * cell + pierHalf, e0 = p === 0, e1 = p === o.bays;
    steppedBand(b, pa0, pa1, o.jamb - ih * 3, T, [[ih, ip], [ih, ip * 2], [ih, ip * 3]], { noLeft: e0, noRight: e1 });
    steppedBand(b, pa0, pa1, 0, T, [[0.9, 0.5], [0.5, 0.28], [0.3, 0.12]], { noLeft: e0, noRight: e1 });
    if (p % 3 === 2) await pause();
  }
  // string course (it straddles the joint between the arcade and the storey) and the storey with its windows
  b.box(-0.25, X.R + 0.25, o.strY - 0.45, o.strY + 0.35, 0, 0.3, { rule: [0, 0, 1, 0] });
  if (o.top > o.strY) {
    const wy0 = o.winY, wy1 = o.winY + o.win, rows = [o.strY, wy0, wy1, o.top];
    for (let i = 0; i < o.bays; i++) {
      const c = (i + 0.5) * cell, cols = [i * cell, c - o.win * 0.5, c + o.win * 0.5, (i + 1) * cell];
      windowCell(b, cols, rows, 0.5, o.side);
      if (i % 6 === 5) await pause();
    }
    b.box(-0.3, X.R + 0.3, o.top - 1.5, o.top - 0.9, 0, 0.3, { rule: [0, 0, 1, 0] });
    b.box(-0.6, X.R + 0.6, o.top - 0.9, o.top, 0, 0.75, { rule: [0, 0, 1, 0] });
  }
}
// a 3 x 3 patch of wall with a black window sunk in its middle; every edge shared whole with its neighbours
function windowCell(b, cols, rows, depth, side) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    if (r === 1 && c === 1) continue;
    b.quad([cols[c], rows[r], 0], [cols[c + 1], rows[r], 0], [cols[c + 1], rows[r + 1], 0], [cols[c], rows[r + 1], 0], [0, 0, 1], {});
  }
  const [x0, x1] = [cols[1], cols[2]], [y0, y1] = [rows[1], rows[2]];
  b.quad([x0, y0, -depth], [x1, y0, -depth], [x1, y1, -depth], [x0, y1, -depth], [0, 0, 1], { tone: 2 });
  b.quad([x0, y0, -depth], [x0, y0, 0], [x0, y1, 0], [x0, y1, -depth], [1, 0, 0], side > 0 ? { tone: 2 } : {});
  b.quad([x1, y0, -depth], [x1, y0, 0], [x1, y1, 0], [x1, y1, -depth], [-1, 0, 0], side > 0 ? {} : { tone: 2 });
  b.quad([x0, y1, -depth], [x1, y1, -depth], [x1, y1, 0], [x0, y1, 0], [0, -1, 0], { tone: 2 });
  b.quad([x0, y0, -depth], [x1, y0, -depth], [x1, y0, 0], [x0, y0, 0], [0, 1, 0], {});
}
// a plain wall with rows of small square black windows (the blocks behind the arcades)
function windowWall(b, X, o) {
  b.xf = X.xf;
  const cw = X.R / o.cols, rh = (o.top - o.y0) / o.rows;
  if (o.y0 > 0) b.quad([0, 0, 0], [X.R, 0, 0], [X.R, o.y0, 0], [0, o.y0, 0], [0, 0, 1], {});
  for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) {
    const cx = (c + 0.5) * cw, y = o.y0 + r * rh + rh * 0.42;
    windowCell(b, [c * cw, cx - o.win * 0.5, cx + o.win * 0.5, (c + 1) * cw], [o.y0 + r * rh, y, y + o.win, o.y0 + (r + 1) * rh], 0.6, o.side);
  }
  if (o.y0 > 0) b.box(-0.2, X.R + 0.2, o.y0 - 0.4, o.y0 + 0.4, 0, 0.3, { rule: [0, 0, 1, 0] });
  b.box(-0.5, X.R + 0.5, o.top - 1.1, o.top, 0, 0.7, { rule: [0, 0, 1, 0] });
}
// lathe-turned things (chimneys, the cone, the ball) carry the masonry material's attributes with smooth normals,
// so the two tones split on one clean terminator.  Their uv is METRES ON THE THING'S OWN SURFACE (round it: the girth at its
// widest; up it: the arc of a ball, the slant of a cone), so that the solids' short flecks are measured on the thing itself
function styled(g, sun, tone, swap = 2) {
  const P = g.parameters, ball = g.type === 'SphereGeometry', r0 = P.radiusBottom ?? P.radius, r1 = ball ? r0 : P.radiusTop ?? 0;
  const girth = TAU * Math.max(r0, r1), slant = ball ? 1 : Math.hypot(r0 - r1, P.height) / P.height;
  const n = g.attributes.position.count, s = new Float32Array(n * 3), t = new Float32Array(n * 2), a = new Float32Array(n * 4), e = new Float32Array(n * 4), uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    s.set(sun, i * 3); t[i * 2] = tone; t[i * 2 + 1] = swap; a.set([0, 0, 0, -1], i * 4); e.set([1e3, 1e3, 1e3, 1e3], i * 4);
    const y = g.attributes.position.getY(i);
    uv[i * 2] = g.attributes.uv.getX(i) * girth; uv[i * 2 + 1] = ball ? r0 * Math.asin(Math.min(Math.max(y / r0, -1), 1)) : y * slant;
  }
  g.setAttribute('aSun', new THREE.BufferAttribute(s, 3)); g.setAttribute('aTone', new THREE.BufferAttribute(t, 2));
  g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aArch', new THREE.BufferAttribute(a, 4)); g.setAttribute('aEdge', new THREE.BufferAttribute(e, 4));
  g.deleteAttribute('uv');
  return g;
}
// The shadow of an arcade: its piers and the wall over its arches thrown along the builder's angle, the arches left as
// arches of ochre light lying on the ground.  at(run) -> [x, y, z, scale] under the wall; heights in the wall's own metres,
// k metres of ground for every metre of height.  o.from, o.to: bays (all by default).
function arcadeShade(sb, at, R, bays, o) {      // o.tiers, o.tier: rows of arches one over another, o.tier metres apart
  const cell = R / bays, seg = o.seg || 8, div = o.div || 1, tiers = o.tiers || 1, full = tiers > 1 ? tiers * o.tier : o.top;
  const P = (a, lo, hi) => { const w = at(a); return [w[0], w[1], w[2], lo * w[3] * o.k, hi * w[3] * o.k]; };
  for (let i = o.from ?? 0; i < (o.to ?? bays); i++) {
    const c = (i + 0.5) * cell;
    sb.thrown([P(i * cell, 0, full), P(c - o.hw, 0, full)], div); sb.thrown([P(c + o.hw, 0, full), P((i + 1) * cell, 0, full)], div);
    for (let j = 0; j < tiers; j++) {
      const arch = [], y0 = j * (o.tier || 0), y1 = tiers > 1 ? (j + 1) * o.tier : o.top;
      for (let q = 0; q <= seg; q++) { const t = Math.PI * (1 - q / seg); arch.push(P(c + o.hw * Math.cos(t), y0 + o.jamb + o.rise * Math.sin(t), y1)); }
      sb.thrown(arch, div);
    }
  }
}
const sunOf = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];

// ---- THE COURSE DRAWN OFF THE ARCH (cure 5) -------------------------------------------------------------------------
// Between DRAWN.from and DRAWN.to metres of route the lens does not fly the spline.  It flies a line drawn at the build by
// its own turn along the route: DRAWN.turn is that turn in radians a route metre, one figure for every 3 m of route from the
// first metre to the last, straight between the figures.  The line starts at the spline's own place and heading, has the
// spline's own height at every route metre (posAtDist asks the spline for it), and ends on the spline's own place and
// heading: what the figures leave at the end (their rounding, under a thousandth of a millimetre as they were fitted) is
// shared out evenly along the stretch, and were more than 5 cm or 0.005 rad ever left (a changed spline, a changed kit) the
// spline is flown as it stands and the page's console says so.
// Each of its steps in plan is the plan run of one route step at the spline's own rise, made a little longer by a share
// eased in and out along the stretch (DRAWN.longer on the mean): the line that clears the arch is 0.298 m longer than the
// spline's 51 m, and the lens flies it in the spline's own time.  So a route metre inside the stretch is up to 1.012 m of
// ground, and every place after the stretch lies 0.298 m further along the ground than its route metre says.
// Its heading is the line's own: in plan the drawn turn, in pitch the spline's own rise over the line's own run (within
// 0.35 degrees of the pitch of the line as flown, and that far only within a quarter metre of the spline's own points,
// where the kit's route metre is uneven).
// Outside the stretch the four answers named below are the spline's own, so every place of the lens before it and after
// it keeps its route metre.  The gaze is the engine's: it looks at the course some way ahead and is eased, so the picture
// turns toward the drawn line some way before the lens reaches the stretch and keeps a trace of it a little way after.
// WHAT STAYS THE SPLINE'S inside the stretch: the course's curve, points, nearestXZ, distanceTo and isClear, the kit's own,
// up to 0.47 m off the line flown.  Nothing in this world asks them; whoever does must not trust them inside the stretch.
// WHY: the spline turns in through the third arch of arcade A on a slant and passes that arch's near jamb at 1.93 m and its
// far jamb at 1.67 m.  The drawn line passes both at 2.13 m, and its turn has no jump (the spline's jumps at each of its points).
// It is a law of the place: the arcade stands where it stands on every build, and nothing here takes a random number.
const DRAWN = { from: 45, to: 96, longer: 0.0058477582,
  turn: [0.012471237869, 0.015359623477, 0.010747533849, 0.013091085931, 0.027580456356, 0.042176714578, 0.043381057053, -0.005084283143, -0.054952926535, -0.060866589185, -0.059907891509, -0.056346201449, -0.042362593471, -0.005105667295, 0.009877401984, -0.000246661886, -0.014083462112, -0.009255051017] };
function drawnOff(base) {
  const D0 = DRAWN.from, D1 = DRAWN.to, K = DRAWN.turn, NK = K.length, H = 0.02, n = Math.round((D1 - D0) / H);
  const X = new Float64Array(n + 1), Y = new Float64Array(n + 1), Z = new Float64Array(n + 1), PSI = new Float64Array(n + 1), CL = new Float64Array(n), SL = new Float64Array(n);
  const v = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) Y[i] = base.posAtDist(D0 + i * H, v).y;
  for (let i = 0; i < n; i++) { SL[i] = (Y[i + 1] - Y[i]) / H; CL[i] = Math.sqrt(1 - SL[i] * SL[i]); }
  const kAt = (f) => { const x = f * (NK - 1), i = Math.min(NK - 2, Math.floor(x)); return K[i] + (K[i + 1] - K[i]) * (x - i); };
  const scAt = (i) => 1 + DRAWN.longer * 2 * Math.pow(Math.sin(Math.PI * (i + 0.5) / n), 2);      // (eased in and out: the lens's speed has no jump)
  base.posAtDist(D0, v); base.tangentAtDist(D0, t);
  let psi = Math.atan2(t.x, t.z), x = v.x, z = v.z; X[0] = x; Z[0] = z; PSI[0] = psi;
  for (let i = 0; i < n; i++) {
    const ka = kAt(i / n), km = kAt((i + 0.5) / n), kb = kAt((i + 1) / n), pm = psi + (ka + km) * 0.25 * H, sc = scAt(i);
    x += CL[i] * Math.sin(pm) * H * sc; z += CL[i] * Math.cos(pm) * H * sc; psi += (ka + kb) * 0.5 * H; X[i + 1] = x; Z[i + 1] = z; PSI[i + 1] = psi;
  }
  base.posAtDist(D1, v); base.tangentAtDist(D1, t);
  const ex = x - v.x, ez = z - v.z, epsi = psi - Math.atan2(t.x, t.z);
  if (Math.hypot(ex, ez) > 0.05 || Math.abs(epsi) > 0.005) { console.warn('square-at-the-wrong-hour: DRAWN no longer fits the spline; the spline is flown as it stands'); return base; }
  for (let i = 0; i <= n; i++) { X[i] -= ex * i / n; Z[i] -= ez * i / n; PSI[i] -= epsi * i / n; }
  // the course the engine flies: the kit's own, with four of its answers (posAtDist, tangentAtDist, pointAt, tangentAt) taken, inside the
  // stretch, from the one table in plan and from the spline in height; its other answers are left as the kit made them (see above)
  const path = Object.assign({}, base, {
    drawn: { from: D0, to: D1, miss: Math.hypot(ex, ez), missTurn: epsi },
    posAtDist(d, out = new THREE.Vector3()) {
      base.posAtDist(d, out);                                    // (the height is the spline's own everywhere)
      if (d <= D0 || d >= D1) return out;
      const f = (d - D0) / H, i = Math.min(n - 1, Math.floor(f)), a = f - i;
      out.x = X[i] + (X[i + 1] - X[i]) * a; out.z = Z[i] + (Z[i + 1] - Z[i]) * a;
      return out;
    },
    tangentAtDist(d, out = new THREE.Vector3()) {
      base.tangentAtDist(d, out);                                // (inside the stretch: the spline's own rise over the line's own run)
      if (d <= D0 || d >= D1) return out;
      const f = (d - D0) / H, i = Math.min(n - 1, Math.floor(f)), a = f - i, ps = PSI[i] + (PSI[i + 1] - PSI[i]) * a;
      const run = Math.sqrt(1 - out.y * out.y) * scAt(f - 0.5);
      return out.set(run * Math.sin(ps), out.y, run * Math.cos(ps)).normalize();
    },
    pointAt(u, out = new THREE.Vector3()) { return path.posAtDist(u * base.length, out); },
    tangentAt(u, out = new THREE.Vector3()) { return path.tangentAtDist(u * base.length, out); },
  });
  return path;
}

export default {
  id: 'square-at-the-wrong-hour',
  name: 'The Square at the Wrong Hour',
  category: 'artists',
  placeKind: 'city',
  after: 'Giorgio de Chirico, 1888 to 1978',
  weirdness: 0.55,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const scene = new THREE.Scene();
    // ---- the edition: colourway, hour, cast (seeded once) -------------------------------------------------------
    const vr = rng.fork('edition');
    const V = {
      rose: vr.chance(0.34),
      hour: vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'night' : 'afternoon',      // the hour is the viewer's hint and nothing else
      cast: vr.pick(['two', 'standing', 'seated']),
      flock: vr.chance(0.24) ? 'one' : 'birds',
      solids: vr.chance(0.4) ? 'cubeSteps' : 'ballCone',
      rare: !!vary.rare,
    };
    const LEN = V.hour === 'golden' ? 1.5 : 1;          // golden: shadows six times too long instead of four
    const style = makeStyle(PALETTE), U = style.uniforms;
    const wallTone = V.rose ? 1 : 0;
    const sky = V.hour === 'night' ? style.makeSky({ band: [15, 19], low: U.uGreen.value, high: U.uInk.value, line: 2, lineColor: U.uYellow.value })
      : style.makeSky({ band: V.hour === 'golden' ? [26, 30] : [14, 18] });
    scene.add(sky);
    // The town is built with port at -X, as the brief gives it; three.js looking down +Z has -X to starboard, so the whole
    // town is mirrored once here (the renderer flips the winding for a mirrored object) and the path is given mirrored.
    const town = new THREE.Group(); town.name = 'town'; town.scale.x = -1; scene.add(town);
    scene.background = U.uYellow.value.clone();
    const ochre = style.flatMaterial('uOchre', { side: THREE.DoubleSide });
    await ctx.yield();
    // ---- THE COURSE (given here, before the town: every moment of the flight below is keyed to a PLACE on it, in metres flown) ----
    const spline = makePath([
      [0, 8.6, 19.5], [0, 8.5, 36], [2.6, 7.6, 54], [7.2, 6.6, 66.5], [12.4, 5.8, 75.4], [18.95, 5.1, 82.2], [23.6, 5, 89.5], [25.4, 5, 104], [25.4, 5, 118],
      [25.3, 5, 138], [24, 5, 160], [23.5, 5, 180], [16, 5, 206], [5, 4.6, 232], [-8, 1.5, 256], [-17, -1.2, 277], [-17, 1.5, 298], [-10, 4.6, 318],
      [3, 8, 336], [9, 12, 354], [6, 16.4, 376], [1, 19.5, 395], [0, 20.5, 412], [5, 20.5, 432], [13, 20.5, 452], [16, 20.5, 472], [11, 20.5, 494], [3.5, 20.5, 512], [0, 20.5, 526], [0, 20.6, 540], [0, 22, 560], [0, 25.5, 596], [0, 25.5, END_Z],
    ]);
    // (cure 5) the lens flies the spline everywhere but from DRAWN.from to DRAWN.to metres of route, on its way in through the third arch of
    // arcade A and a little way down the loggia: there, the line drawn off that arch's jambs (DRAWN, above)
    const path = drawnOff(spline);
    // PL: the course's length in route metres (the spline's own; the stretch drawn off the arch is 0.298 m longer on the ground, DRAWN
    // above).  Every key below is a place in route metres, which the remarks below call metres flown.  atM(123.4) turns
    // 'when the lens has flown 123.4 m' into the path's own fraction for the engine and the shaders, which take u (uU gates
    // the tongues and swaps lit and shade); update() works in metres flown throughout.
    const PL = path.length, atM = (m) => m / PL, lens = new THREE.Vector3();
    // mAt(z): the route metre at which the course comes abeam of a THING that stands at world z (the course runs on in +Z all the way;
    // found on the course itself, by bisection).  What is counted between two things of the place is counted between two of these.
    const mAt = (z) => { let lo = 0, hi = PL; for (let i = 0; i < 30; i++) { const mid = (lo + hi) * 0.5; if (path.posAtDist(mid, lens).z < z) lo = mid; else hi = mid; } return (lo + hi) * 0.5; };

    // ---- the ground: ochre only.  Terrace, the drop, the tipped square, the level top, and the plain all round -----
    {
      const W = 190, prof = [[-160, 0], [163, 0], [163, -24.4], [403, TOP], [800, TOP], [800, -24.6]], pos = [], idx = [];
      for (const [z, y] of prof) pos.push(-W, y, z, W, y, z);
      for (let i = 0; i + 1 < prof.length; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 3, i * 2, i * 2 + 3, i * 2 + 2);
      for (const sx of [-W, W]) {      // the two flanks, down to the plain
        const base = pos.length / 3; for (const [z, y] of prof) pos.push(sx, y, z, sx, -24.6, z);
        for (let i = 0; i + 1 < prof.length; i++) idx.push(base + i * 2, base + i * 2 + 1, base + i * 2 + 3, base + i * 2, base + i * 2 + 3, base + i * 2 + 2);
      }
      const b0 = pos.length / 3; pos.push(-W, 0, -160, W, 0, -160, W, -24.6, -160, -W, -24.6, -160); idx.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const groundMesh = new THREE.Mesh(g, ochre); groundMesh.name = 'ground'; groundMesh.frustumCulled = false; town.add(groundMesh);
      const plain = new THREE.Mesh(new THREE.CircleGeometry(3200, 40), ochre); plain.rotation.x = -Math.PI / 2; plain.position.set(0, -24.5, 300); plain.name = 'plain'; town.add(plain);
    }
    const masonry = style.masonry = style.masonryMaterial({ course: [1.0, 2.6] });
    const brick = style.masonryMaterial({ course: [0.3, 0.9] });
    const addMasonry = (b, name, mat = masonry) => { const m = new THREE.Mesh(b.build(), mat); m.name = name; m.frustumCulled = false; town.add(m); return m; };
    const flat0 = () => 0, flatTop = () => TOP, onRamp = (x, z) => rampY(z);
    const seg = detail < 0.8 ? 10 : 14;

    // ---- ARCADE A: the loggia we fly down.  Face at x -17.7, twelve bays from z 58, truly shrinking to 0.725 ---------
    const XA = taperedFace([-17.7, 58], [-19.43, 161], 0.725, true, flat0);
    const A = { bays: 12, hw: 4.1, jamb: 11.1, rise: 3.9, T: 1.8, seg, side: 1, strY: 17.4, top: 22.6, winY: 19.0, win: 1.5, inner: true, D: 9, W: 12.6 };
    const sunA = sunOf(rng.range(1.75, 2.15), 0.6);         // from the terrace side and behind us: A's face and every pier flank toward us lit
    {
      const b = makeMasonryBuilder(); b.sun = sunA; b.tone = wallTone; b.innerTone = 4;
      await arcadeFront(b, XA, A, ctx.yield);
      await ctx.yield();
      // inside: back wall, vault and floor in green-black
      const eB = -(A.T + A.D), R = XA.R;
      b.quad([0, 0, eB], [R, 0, eB], [R, A.strY, eB], [0, A.strY, eB], [0, 0, 1], { tone: 4 });
      b.quad([0, A.strY - 0.02, eB], [R, A.strY - 0.02, eB], [R, A.strY - 0.02, 0], [0, A.strY - 0.02, 0], [0, -1, 0], { tone: 4 });
      b.quad([0, 0.07, eB], [R, 0.07, eB], [R, 0.07, -0.02], [0, 0.07, -0.02], [0, 1, 0], { tone: 4 });
      // THE LOGGIA IS DRAWN (seen only from inside; from outside all of this is green-black on green-black): on the back wall a
      // blind black arch answers every open one, between ruled pilasters under a ruled band; a ruled rib crosses the vault at
      // every pier; the floor is ruled lengthwise in three lines that run to the loggia's own point
      {
        const cellA = R / A.bays, ew = eB + 0.03, ink = { tone: 5 }, nW = [0, 0, 1], nh = 3.3, nj = 8.6, nr = 3.0, ns = 10;
        for (let i = 0; i < A.bays; i++) {
          const c = (i + 0.5) * cellA;
          for (let q = 0; q < ns; q++) {
            const t0 = Math.PI * (1 - q / ns), t1 = Math.PI * (1 - (q + 1) / ns), x0 = c + nh * Math.cos(t0), x1 = c + nh * Math.cos(t1);
            b.quad([x0, 0.07, ew], [x1, 0.07, ew], [x1, nj + nr * Math.sin(t1), ew], [x0, nj + nr * Math.sin(t0), ew], nW, { tone: 2 });
          }
        }
        for (let p = 0; p <= A.bays; p++) {
          const a = Math.min(Math.max(p * cellA, 0.5), R - 0.5);
          for (const sg of [-1, 1]) b.quad([a + sg * 0.8 - 0.14, 0.07, ew], [a + sg * 0.8 + 0.14, 0.07, ew], [a + sg * 0.8 + 0.14, 14.2, ew], [a + sg * 0.8 - 0.14, 14.2, ew], nW, ink);
          b.quad([a - 1.25, nj - 0.5, ew + 0.01], [a + 1.25, nj - 0.5, ew + 0.01], [a + 1.25, nj, ew + 0.01], [a - 1.25, nj, ew + 0.01], nW, ink);
          b.quad([a - 0.2, A.strY - 0.06, eB], [a + 0.2, A.strY - 0.06, eB], [a + 0.2, A.strY - 0.06, -0.02], [a - 0.2, A.strY - 0.06, -0.02], [0, -1, 0], ink);
        }
        b.quad([0, 14.2, ew], [R, 14.2, ew], [R, 14.6, ew], [0, 14.6, ew], nW, ink);
        {
          const ei = -A.T - 0.03, nI = [0, 0, -1], ph = cellA * 0.5 - A.hw, H = (a0, a1, y0, y1) => b.quad([a0, y0, ei], [a1, y0, ei], [a1, y1, ei], [a0, y1, ei], nI, ink);
          for (let p = 0; p <= A.bays; p++) {
            const a0 = Math.max(p * cellA - ph, 0), a1 = Math.min(p * cellA + ph, R);
            if (p > 0) H(a0 + 0.08, a0 + 0.22, 1.7, A.jamb - 1.5); if (p < A.bays) H(a1 - 0.22, a1 - 0.08, 1.7, A.jamb - 1.5);
            for (const y of [0.9, 1.4, 1.7 - 0.14, A.jamb - 1.5, A.jamb - 0.14]) H(a0, a1, y, y + 0.14);
          }
          for (let i = 0; i < A.bays; i++) {
            const c = (i + 0.5) * cellA, n = 12;
            for (let q = 0; q < n; q++) {
              const t0 = Math.PI * (1 - q / n), t1 = Math.PI * (1 - (q + 1) / n), r0 = 0.3, r1 = 0.46;
              b.quad([c + (A.hw + r0) * Math.cos(t0), A.jamb + (A.rise + r0) * Math.sin(t0), ei], [c + (A.hw + r0) * Math.cos(t1), A.jamb + (A.rise + r0) * Math.sin(t1), ei],
                [c + (A.hw + r1) * Math.cos(t1), A.jamb + (A.rise + r1) * Math.sin(t1), ei], [c + (A.hw + r1) * Math.cos(t0), A.jamb + (A.rise + r1) * Math.sin(t0), ei], nI, ink);
            }
          }
        }
        for (const fe of [0.25, 0.5, 0.75]) { const e = eB * fe; b.quad([0, 0.09, e - 0.1], [R, 0.09, e - 0.1], [R, 0.09, e + 0.1], [0, 0.09, e + 0.1], [0, 1, 0], ink); }
        await ctx.yield();
      }
      // the two ends: a blind arch toward the entry, the open end arch (6.5 m wide in the world) toward the square
      for (const far of [false, true]) {
        const E = endFace(XA, far, A.W); b.xf = E.xf;
        archCell(b, 0, 0, A.W, A.top, 4.5, 10.6, 4.3, 1.8, seg + 4, far ? -1 : 1, false, far, !far, 0);
        steppedBand(b, 0, A.W * 0.5 - 4.5, 10.6 - 1.5, 1.8, [[0.5, 0.28], [0.5, 0.56], [0.5, 0.84]], { noLeft: true });
        steppedBand(b, A.W * 0.5 + 4.5, A.W, 10.6 - 1.5, 1.8, [[0.5, 0.28], [0.5, 0.56], [0.5, 0.84]], { noRight: true });
        steppedBand(b, 0, A.W * 0.5 - 4.5, 0, 1.8, [[0.9, 0.5], [0.5, 0.28], [0.3, 0.12]], { noLeft: true });
        steppedBand(b, A.W * 0.5 + 4.5, A.W, 0, 1.8, [[0.9, 0.5], [0.5, 0.28], [0.3, 0.12]], { noRight: true });
        b.box(-0.6, A.W + 0.6, A.top - 0.9, A.top, 0, 0.75, { rule: [0, 0, 1, 0] });
        b.box(-0.25, A.W + 0.25, A.strY - 0.45, A.strY + 0.35, 0, 0.3, { rule: [0, 0, 1, 0] });
      }
      await ctx.yield();
      addMasonry(b, 'arcade-A');
      await ctx.yield();
    }

    // ---- ARCADES B (starboard) and C (port): the walls of the square, each shrinking to its own point ---------------
    const XB = taperedFace([88, 163], [62, 403], 0.4, false, onRamp), XC = taperedFace([-82, 163], [-68, 403], 0.36, true, onRamp);
    const sunB = sunOf(-1.2 + rng.range(-0.12, 0.12), 0.5), sunC = sunOf(-2.2 + rng.range(-0.12, 0.12), 0.55);
    const Bo = { bays: 24, hw: 5.2, jamb: 12.5, rise: 4.9, T: 1.6, seg, side: -1, strY: 20, top: 28, winY: 22.4, win: 1.9, blind: true, impostH: 0.6, impost: 0.32 };
    const Co = { bays: 21, hw: 5.9, jamb: 14.5, rise: 5.5, T: 1.6, seg, side: 1, strY: 23.5, top: 33, winY: 26.4, win: 2.2, blind: true, impostH: 0.7, impost: 0.36 };
    for (const [X, o, sun, name] of [[XB, Bo, sunB, 'arcade-B'], [XC, Co, sunC, 'arcade-C']]) {
      const b = makeMasonryBuilder(); b.sun = sun; b.tone = wallTone;
      await arcadeFront(b, X, o, ctx.yield);
      await ctx.yield();
      const E = endFace(X, false, 14); b.xf = E.xf;      // the near end, cropped by the frame as we drop into the square
      b.quad([0, -6, 0], [14, -6, 0], [14, o.top, 0], [0, o.top, 0], [0, 0, 1], { edge: [o.side < 0 ? 1 : 0, o.side > 0 ? 1 : 0, 0, 0] });
      b.box(-0.6, 14.6, o.top - 0.9, o.top, 0, 0.75, { rule: [0, 0, 1, 0] });
      await ctx.yield();
      addMasonry(b, name);
      await ctx.yield();
    }

    // ---- THE END WALL: fifteen arches 16 m tall (the brief's eleven and two more at each end, so that the wall leaves the
    // picture on both sides from the moment we come out of the cube), all black niches but the middle one, open on the portal
    // (the outside round: the lit arch was a small hole in a low wall.  The wall is now two low wings of six black arches and,
    // between them, a PAVILION 45 m wide and 38 m tall that stands 2.5 m proud of them: one great arch 18 m wide and 24 m high,
    // the lit one, between two broad piers, under a storey of five small square black windows.  The portal fills the arch.)
    const WALL_H = 112.5, PAV = { hw: 9, jamb: 15, rise: 8.7, strY: 29, top: 38, out: 2.5, T: 4.1 };
    const sunE = sunOf(Math.PI + rng.range(-0.5, 0.5), 0.5);
    {
      const b = makeMasonryBuilder(); b.sun = sunE; b.tone = 0;
      const sideE = rng.chance(0.5) ? 1 : -1, wing = { bays: 6, hw: 6, jamb: 8, rise: 5.7, T: 1.6, seg: seg + 4, side: sideE, strY: 16, top: 16, blind: true, inner: false };
      for (const [x0, x1] of [[WALL_H, 22.5], [-22.5, -WALL_H]]) {
        const X = taperedFace([x0, END_Z - 0.3], [x1, END_Z - 0.3], 1, false, flatTop);
        await arcadeFront(b, X, wing, ctx.yield);
        b.box(-0.7, X.R + 0.7, 15.2, 16, 0, 0.8, { rule: [0, 0, 1, 0] });
        const E = endFace(X, x0 < 0, 6); b.xf = E.xf; b.quad([0, 0, 0], [6, 0, 0], [6, 16, 0], [0, 16, 0], [0, 0, 1], {});
        await ctx.yield();
      }
      const XP = taperedFace([22.5, END_Z - 0.3 - PAV.out], [-22.5, END_Z - 0.3 - PAV.out], 1, false, flatTop), R = XP.R, P = PAV;
      b.xf = XP.xf;
      archCell(b, 0, 0, R, P.strY, P.hw, P.jamb, P.rise, P.T, seg + 12, sideE, false, false, false, 0);
      const pw = R * 0.5 - P.hw;
      for (const [p0, p1, o] of [[0, pw, { noLeft: true }], [R - pw, R, { noRight: true }]]) {
        steppedBand(b, p0, p1, P.jamb - 2.4, P.T, [[0.8, 0.42], [0.8, 0.84], [0.8, 1.26]], o);
        steppedBand(b, p0, p1, 0, P.T, [[1.5, 0.8], [0.8, 0.45], [0.5, 0.2]], o);
      }
      b.box(-0.4, R + 0.4, P.strY - 0.7, P.strY + 0.5, 0, 0.45, { rule: [0, 0, 1, 0] });
      for (let i = 0; i < 5; i++) { const c = (i + 0.5) * R / 5; windowCell(b, [i * R / 5, c - 1.4, c + 1.4, (i + 1) * R / 5], [P.strY, P.strY + 3.2, P.strY + 6, P.top], 0.6, sideE); }
      b.box(-0.45, R + 0.45, P.top - 2.2, P.top - 1.4, 0, 0.45, { rule: [0, 0, 1, 0] });
      b.box(-0.9, R + 0.9, P.top - 1.4, P.top, 0, 1.1, { rule: [0, 0, 1, 0] });
      await ctx.yield();
      for (const far of [false, true]) {      // its two flanks, from the ground up (the wings meet them)
        const E = endFace(XP, far, 9); b.xf = E.xf;
        b.quad([0, 0, 0], [9, 0, 0], [9, P.top, 0], [0, P.top, 0], [0, 0, 1], { edge: [far ? 0 : 1, far ? 1 : 0, 0, 0] });
        b.box(-0.9, 9.9, P.top - 1.4, P.top, 0, 1.1, { rule: [0, 0, 1, 0] });
      }
      addMasonry(b, 'end-wall');
      await ctx.yield();
    }

    // ---- SIX PLAIN BLOCKS behind the arcades, five white and one red, each sheared to its own point -----------------
    const blockDefs = [
      { p0: [116, 148], p1: [104, 232], top: 60, K: 0.74, flip: false, depth: 34, cols: 7, rows: 6, swap: atM(12.5) },      // (swaps: each while its block is in the picture: this one 12.5 m in, over the forecourt at z 32)
      { p0: [103, 292], p1: [93, 372], top: 56, K: 0.62, flip: false, depth: 30, cols: 6, rows: 5, swap: atM(206.2), red: true },      // (206.2 m: over the square at z 217, the red block ahead to starboard)
      { p0: [-110, 172], p1: [-101, 252], top: 66, K: 0.68, flip: true, depth: 36, cols: 6, rows: 6, swap: atM(223.6) },      // (223.6 m: at z 233, abeam of the port block)
      { p0: [-95, 284], p1: [-86, 372], top: 54, K: 0.8, flip: true, depth: 30, cols: 7, rows: 5, swap: atM(265.3) },      // (265.3 m: at z 269, as we pass the plinth)
      { p0: [112, 520], p1: [103, 622], top: 44, K: 0.7, flip: false, depth: 30, cols: 7, rows: 4, swap: 2 },
      { p0: [-64, 556], p1: [-46, 631.5], top: 58, K: 0.78, flip: true, depth: 34, cols: 5, rows: 5, swap: atM(568.6) },      // the last court's block: tall, cropped hard by the port edge of the frame (568.6 m: at z 557, as we come abeam of it)
    ];
    const blockSuns = [];
    {
      const b = makeMasonryBuilder();
      for (const d of blockDefs) {
        const y0 = rampY(d.p0[1]) - 2, X = taperedFace(d.p0, d.p1, d.K, d.flip, () => y0);
        // its own false sun: the face toward the square lit on three, in shade on three, and never two alike
        const faceAz = Math.atan2(X.n[0], X.n[1]), lit = rng.chance(0.55), az = faceAz + (lit ? rng.range(-1.1, 1.1) : Math.PI + rng.range(-1.0, 1.0));
        b.sun = sunOf(az, rng.range(0.35, 0.75)); b.tone = d.red ? 1 : 0; b.swap = d.swap; blockSuns.push(az);
        const side = rng.chance(0.5) ? 1 : -1;
        windowWall(b, X, { cols: d.cols, rows: d.rows, y0: 9, top: d.top, win: 2.3, side });
        await ctx.yield();
        windowWall(b, endFace(X, false, d.depth), { cols: 3, rows: d.rows, y0: 9, top: d.top, win: 2.3, side });
        await ctx.yield();
      }
      b.swap = 2;
      await ctx.yield();
      addMasonry(b, 'blocks');
      await ctx.yield();
    }

    // ---- the red brick parapet at the terrace's edge, the empty plinth, the solids left on the square, the chimneys ---
    const TB = [6, 128], TC = [-2, 133];      // the terrace's block and cone (town x)
    const BALL = [10, 293], CONE = [25, 296], BLOCK = [-14, 344], BALL2 = [-19, 353];      // (town x: starboard is +)
    const plinth = [24, 264], plinthY = rampY(264);
    const RBALL = [-34, 475, 4.6], RCONE = [15, 498, 4.0], CPL = [15.5, 618];      // the room's ball and cone [town x, z, radius]; the court's two plinths [x, z]
    {
      const b = makeMasonryBuilder(); b.sun = [0.35, 0.6, 0.7]; b.tone = 1;
      b.xf = (a, bb, e) => [150 - a, bb, 162.4 - e];
      b.box(0, 300, 0, 2.15, -0.6, 0, { back: true, rule: [0, 0, 0, 0] });
      b.box(-0.1, 300.1, 2.15, 2.4, -0.72, 0.12, { back: true, rule: [0, 0, 1, 0] });
      addMasonry(b, 'parapet', brick);
      const p = makeMasonryBuilder(); p.sun = sunOf(Math.PI + rng.range(0.35, 0.9) * (rng.chance(0.5) ? 1 : -1), 0.7); p.tone = 0;      // lit toward us, one flank in shade
      p.solid = true;      // (the plinths, the blocks, the cube and the steps: free-standing solids, dragged in the solids' short flecks)
      p.xf = (a, bb, e) => [plinth[0] - a, plinthY + bb, plinth[1] - e];
      p.box(-2.5, 2.5, -1.2, 0.6, -2.5, 2.5, { back: true, rule: [0, 0, 0, 1], skip: { bottom: true } });
      p.box(-2.0, 2.0, 0.6, 5.4, -2.0, 2.0, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true, top: true } });
      p.box(-2.25, 2.25, 5.4, 5.8, -2.25, 2.25, { back: true, rule: [0, 0, 1, 0] });
      p.box(-2.55, 2.55, 5.8, 6.3, -2.55, 2.55, { back: true, rule: [0, 0, 1, 0] });
      // the cast: a cube and three steps, when the edition asks for them instead of the ball and the cone
      if (V.solids === 'cubeSteps') {
        p.sun = sunOf(rng.range(0.4, 1.2), 0.6);
        p.xf = (a, bb, e) => { const c = Math.cos(0.5), s = Math.sin(0.5); return [BALL[0] + a * c + e * s, rampY(BALL[1]) - 0.5 + bb, BALL[1] - a * s + e * c]; };
        p.box(-1.6, 1.6, 0, 3.7, -1.6, 1.6, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true } });
        p.tone = 1; p.sun = sunOf(rng.range(-1.4, -0.6), 0.6);
        p.xf = (a, bb, e) => [CONE[0] - a, rampY(CONE[1]) - 0.6 + bb, CONE[1] - e];
        for (let i = 0; i < 3; i++) p.box(-2.4, 2.4, 0, 2.4 - i * 0.8, -2.4 + i * 1.6, -0.8 + i * 1.6, { back: true, rule: [0, 0, 0, 1], skip: { bottom: true } });
      }
      // under the cube, on the ramp: a white block left askew (its plaster ball is with the turned things below)
      p.sun = sunOf(2.2, 0.6); p.tone = 0;
      p.xf = (a, bb, e) => { const c = Math.cos(0.45), sn = Math.sin(0.45); return [BLOCK[0] + a * c + e * sn, rampY(BLOCK[1]) - 0.6 + bb, BLOCK[1] - a * sn + e * c]; };
      p.box(-2.4, 2.4, 0, 5.4, -2.4, 2.4, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true } });
      p.sun = sunOf(2.8, 0.6); p.tone = 0;
      p.xf = (a, bb, e) => { const c = Math.cos(0.27), sn = Math.sin(0.27); return [TB[0] + a * c + e * sn, bb, TB[1] - a * sn + e * c]; };
      p.box(-2.2, 2.2, 0, 4.6, -2.2, 2.2, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true } });
      // IN THE ROOM (the cube's inside): two more empty plinths stand either side of the back arch, each lit by a sun of its own
      const ROOM_Y = TOP + 0.25;
      for (const sx of [-1, 1]) {
        p.sun = sx > 0 ? sunOf(Math.PI + 0.6, 0.7) : sunOf(Math.PI - 0.95, 0.5); p.tone = 0;
        const pc = Math.cos(0.5 * sx), ps = Math.sin(0.5 * sx);
        p.xf = (a, bb, e) => [sx * 12.2 - (a * pc + e * ps), ROOM_Y + bb, 524.6 - (e * pc - a * ps)];
        p.box(-2.3, 2.3, 0, 1.0, -2.3, 2.3, { back: true, rule: [0, 0, 0, 1], skip: { bottom: true } });
        p.box(-1.75, 1.75, 1.0, 8.3, -1.75, 1.75, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true, top: true } });
        p.box(-2.0, 2.0, 8.3, 8.7, -2.0, 2.0, { back: true, rule: [0, 0, 1, 0] });
        p.box(-2.3, 2.3, 8.7, 9.2, -2.3, 2.3, { back: true, rule: [0, 0, 1, 0] });
      }
      // IN THE COURT: two empty plinths before the piers of the great arch, each lit by a sun of its own
      for (const sx of [-1, 1]) {
        p.sun = sunOf(sx > 0 ? 0.95 : Math.PI - 0.25, 0.6); p.tone = 0;      // (one shows us its shade face and its ruled joints, the other its lit one)
        const pc = Math.cos(0.6 * sx), ps = Math.sin(0.6 * sx);
        p.xf = (a, bb, e) => [sx * CPL[0] - (a * pc + e * ps), TOP + bb, CPL[1] - (e * pc - a * ps)];
        p.box(-2.7, 2.7, 0, 1.2, -2.7, 2.7, { back: true, rule: [0, 0, 0, 1], skip: { bottom: true } });
        p.box(-2.05, 2.05, 1.2, 9.4, -2.05, 2.05, { back: true, rule: [0, 1, 0, 0], skip: { bottom: true, top: true } });
        p.box(-2.35, 2.35, 9.4, 9.9, -2.35, 2.35, { back: true, rule: [0, 0, 1, 0] });
        p.box(-2.7, 2.7, 9.9, 10.5, -2.7, 2.7, { back: true, rule: [0, 0, 1, 0] });
      }
      addMasonry(p, 'plinth');
      await ctx.yield();
      const parts = [], sunR = sunOf(1.45 + rng.range(0.3, 1.0) * 0.6, 0.5), sunR2 = sunOf(-1.45 + rng.range(-1.0, -0.3) * 0.6, 0.5);      // each chimney half lit, half in shade, from opposite sides
      const put = (g, x, y, z) => { g.translate(x, y, z); parts.push(g); };
      // (two thick chimneys, one either side of the lit arch: tall over the wall as we come into the court; at the sill the nearer is
      // cropped by the top of the frame and the further stands whole, cap and all)
      put(styled(new THREE.CylinderGeometry(4.4, 6.6, 58, 32, 1, true), sunR, 1), -53, TOP + 29, 652);
      put(styled(new THREE.CylinderGeometry(5.1, 5.1, 2.2, 32, 1, false), sunR, 1), -53, TOP + 58, 652);
      put(styled(new THREE.CylinderGeometry(3.6, 5.4, 44, 32, 1, true), sunR2, 1), 61, TOP + 22, 666);
      put(styled(new THREE.CylinderGeometry(4.3, 4.3, 2.0, 32, 1, false), sunR2, 1), 61, TOP + 44, 666);
      // (two more red chimneys far off, one behind the blocks on either side of the town: red brick over a wall, on the yellow band
      // and up into the green, in the views out of the loggia and across the square)
      for (const [cx, cz, h, r0, r1, az] of [[172, 200, 122, 4.4, 7.2, 2.95], [-135, 420, 132, 4.2, 7.0, 0.8]]) {
        put(styled(new THREE.CylinderGeometry(r0, r1, h, 28, 1, true), sunOf(az, 0.5), 1), cx, -24.6 + h * 0.5, cz);
        put(styled(new THREE.CylinderGeometry(r0 + 0.75, r0 + 0.75, 2.4, 28, 1, false), sunOf(az, 0.5), 1), cx, -24.6 + h, cz);
      }
      if (V.solids === 'ballCone') {
        put(styled(new THREE.SphereGeometry(2.4, 40, 24), sunOf(rng.range(0.5, 1.2), 0.7), 0), BALL[0], rampY(BALL[1]) + 2.4, BALL[1]);
        put(styled(new THREE.ConeGeometry(2.0, 7, 40, 1, false), sunOf(rng.range(-1.3, -0.6), 0.6), 1), CONE[0], rampY(CONE[1]) + 3.2, CONE[1]);
      }
      put(styled(new THREE.ConeGeometry(2.0, 6.6, 40, 1, false), sunOf(-2.2, 0.6), 1), TC[0], 3.3, TC[1]);
      // ... and out on the room's floor the still life again, out of scale: a plaster ball 7 m across and a red cone 12 m tall
      put(styled(new THREE.SphereGeometry(RBALL[2], 40, 24), sunOf(2.3, 0.6), 0), RBALL[0], ROOM_Y + RBALL[2], RBALL[1]);
      put(styled(new THREE.ConeGeometry(RCONE[2], 15, 40, 1, false), sunOf(-2.5, 0.5), 1), RCONE[0], ROOM_Y + 7.5, RCONE[1]);
      put(styled(new THREE.SphereGeometry(2.3, 40, 24), sunOf(-0.9, 0.7), 0), BALL2[0], rampY(BALL2[1]) + 2.3, BALL2[1]);
      const round = new THREE.Mesh(mergeGeometries(parts), masonry); round.name = 'turned'; round.frustumCulled = false; town.add(round);
      for (const g of parts) g.dispose();
      await ctx.yield();
    }

    // ---- THE HERO: the cube of a hundred arches, front toward us at z 411 on the level top ---------------------------
    // (the room's ranks from the front wall and its standing lights appear when the lens has flown 383.7 m, at z 379, 32 m before
    // the front face; the loggia's when it has flown 44.5 m, at z 63, turning in at the third arch.  The ten tongues of the
    // flanks' arches have no gate: they lie on the room's floor for the whole flight)
    const ROOM_GATE = atM(383.7), LOGGIA_GATE = atM(44.5);
    const hero = await buildHero(ctx, { style, apron: false, sky: false, shadow: false, detail, flock: V.flock === 'birds', flockRun: 200, flockLoop: true, flockSize: 2.8, floorFold: [0, 1, 68, SLOPE], tongueGate: ROOM_GATE });
    hero.object.position.set(0, TOP, CUBE_Z); hero.object.rotation.y = Math.PI; town.add(hero.object);
    await ctx.yield();
    // the hero is turned half round, so its shadows take the agreed angle half a turn on
    const roomHour = { value: 0 }, heroShadowMat = style.shadowMaterial(); heroShadowMat.uniforms = { ...U, uAgreeAng: { value: Math.PI }, uHour: roomHour, uFloorFold: { value: new THREE.Vector4(0, 1, 68, SLOPE) } };      // (nobody's second shadow lies down the ramp in front of the pier)      // the black room's own hour
    hero.object.traverse((o) => { if (o.name === 'shadows-and-tongues') o.material = heroShadowMat; });

    // THE CLOCKS' STARTS: the hour each place's clock shows before the journey moves it, drawn once from a stream of the clocks'
    // own (the seed and a name: it draws from no other stream).  Drawn here, before the shadows are laid: the square's folded shadows
    // are solved from the square's own start
    const clockRng = ctx.core.makeRng(ctx.core.hashSeed('clocks:' + ctx.seed));
    // (the loggia's start: its tongues are drawn at their arches' own proportion for hour 0, and the hour comes through that at the middle
    // of the loggia, a quarter of an hour early or late: a band as wide as the square's)
    const CLOCK = { town: clockRng.range(-0.04, 0.04), fore: clockRng.range(-0.13, 0.13), square: clockRng.range(-0.26, 0.26), cube: clockRng.range(-0.3, 0.3),
      loggia: clockRng.range(-0.76, -0.24), room: clockRng.range(0, 0.46), pair: clockRng.range(0, TAU), figure: clockRng.range(-0.25, 0.25) };
    // ---- SHADOWS: the weather and the clock.  Ruled, opaque, one colour, each at its own angle, each creeping --------
    // angle 0 = +Z, positive toward +X (clockwise from above).  Two thirds swing clockwise, one third the other way.
    const hourOf = (sb, angle, o = {}) => {
      sb.kind = 0; sb.angle = angle; sb.gate = 0; sb.fold = o.fold || null; sb.foldDir = o.foldDir || [0, 1, 0]; sb.lift = o.lift ?? 0.04;
      sb.swing = (o.swing ?? rng.range(0.05, 0.14) * (rng.chance(0.67) ? 1 : -1)) * (o.k ?? 1); sb.stretch = o.stretch ?? rng.range(0.22, 0.5);
    };
    const shadowMat = style.shadow || (style.shadow = style.shadowMaterial());
    const sw = makeShadowBuilder(), sr = makeShadowBuilder(), sh = makeShadowBuilder();      // world levels, the ramp's own plane, the hero's space
    const sf = makeShadowBuilder(), sp = makeShadowBuilder(), sg = makeShadowBuilder(), sl = makeShadowBuilder();      // the forecourt, the pair, nobody's shadow, the loggia's tongues
    // THE WRONG HOUR RUNS AT ITS OWN RATE IN EACH PLACE: every group of shadows has a clock of its own (the same shader, its
    // own uHour), which runs while we are there to see it and hardly at all before and after
    const hourMat = (ang = null) => { const m = style.shadowMaterial(), h = { value: 0 }; m.uniforms = { ...U, uHour: h }; if (ang !== null) m.uniforms.uAgreeAng = { value: ang }; m.hour = h; return m; };
    const foreMat = hourMat(), loggiaMat = hourMat(), squareMat = hourMat(), pairMat = hourMat(), figMat = hourMat(), cubeShMat = hourMat(Math.PI);
    const cosR = Math.cos(Math.atan(SLOPE)), rl = (z) => (z - 163) / cosR;                    // world z -> metres up the ramp
    // (hero space) the cube's shadow: the length of the square toward us, well off its axis, folding down the ramp; it shortens
    // (it rakes 80 degrees off the axis, not the brief's 20: at 20 the threshold, nobody's shadow and the chase would all lie in the dark)
    sh.fold = [0, 1, 68]; sh.foldDir = [0, -SLOPE, 1];
    sh.kind = 0; sh.angle = -0.9; sh.swing = -0.1; sh.stretch = -0.14; sh.gate = 0; sh.lift = 0.05;      // (52 degrees off the axis: our own line and the threshold stay in the light until the last 40 m)
    arcadeShade(sh, (a) => [-60.4 + a * 120.8 / 120, 0, 60.4, 1], 120, 5, { hw: 8, jamb: 12, rise: 7.5, tiers: 5, tier: 24, k: 1.3 * (LEN > 1 ? 1.15 : 1), div: 10, seg: 8 });
    void addCubeShadow;
    // (terrace) the 60 m shadow that comes in from starboard off an unseen caster, with a chimney's finger beyond it
    const foldA = [-XA.n[0], -XA.n[1], -(XA.n[0] * -17.7 + XA.n[1] * 58) - 0.07];      // the shadow reaches arcade A's face and climbs it
    // (a ruled band 9 m wide whose tip slides across the ochre and stops short of A; only the finger beyond it reaches the foot
    // of the pier between the first two bays and starts up its white face: the wall above and beside it stays white)
    hourOf(sf, -1.22, { swing: 0.1, stretch: 0.3 });
    arcadeShade(sf, (a) => [52, 0, 14 + a, 1], 48, 4, { hw: 4.2, jamb: 9, rise: 4, top: 14.6, k: 3.3 });
    hourOf(sf, -1.22, { swing: 0.1, stretch: 0.3, fold: foldA });
    sf.thrown([[52, 0, 42.2, 44, 66], [52, 0, 43.9, 44, 66]], 24);
    // A SHADOW CLIMBS ONLY WHERE A FACE STANDS.  The fold plane runs the whole length of arcade A, across its open arches as well
    // as its piers, and the forecourt's hour slides the finger along it: so the forecourt's own material is told the front it
    // climbs, in the numbers arcade A is built from (XA: its first corner, its run and its taper; A: a bay, an arch's half width,
    // springing, rise and segments, the string course).  The shadow's shader then draws the folded part only where that front's
    // face stands behind it (a pier, the wall over an arch); over an open mouth it is not drawn, and the finger ends on the
    // terrace at the threshold: the loggia's floor beyond it is green-black already.  It asks no clock, no place of the lens and
    // no seed; it has its own program (the define), so every other shadow is drawn by the shader it had.
    { const c0 = XA.at(0, 0, 0);
      foreMat.defines = { FACE_BOUND: 1 };
      foreMat.uniforms.uFaceO = { value: new THREE.Vector4(c0[0], c0[2], XA.dir[0], XA.dir[1]) };
      foreMat.uniforms.uFaceS = { value: new THREE.Vector4((1 - XA.sOf(XA.R)) / XA.L, XA.R, XA.R / A.bays, A.seg) };
      foreMat.uniforms.uFaceA = { value: new THREE.Vector4(A.hw, A.jamb, A.rise, A.strY) }; }
    // (terrace) a second caster nobody sees, further on and at another hour; the parapet's own ruled band
    hourOf(sf, -1.9, { swing: -0.1, stretch: 0.3 });
    arcadeShade(sf, (a) => [78, 0, 96 + a, 1 - a * 0.004], 54, 5, { hw: 3.9, jamb: 9, rise: 3.9, top: 17, k: 2.6 * LEN });
    hourOf(sf, -1.0, { swing: 0.1, stretch: 0.3 });
    { const c = Math.cos(0.27), sn = Math.sin(0.27), h = 2.2, P = (a, e) => [TB[0] + a * c + e * sn, 0, TB[1] - a * sn + e * c];
      for (const [p0, p1] of [[P(-h, -h), P(h, -h)], [P(h, -h), P(h, h)], [P(h, h), P(-h, h)], [P(-h, h), P(-h, -h)]]) sf.thrown([[...p0, 0, 17 * LEN], [...p1, 0, 17 * LEN]], 1); }
    hourOf(sf, -2.05, { swing: -0.09, stretch: 0.3 });
    sf.shape([TC[0], 0, TC[1]], [[0, -2.0, 2.0], [25 * LEN, 0, 0.02]]);
    hourOf(sf, Math.PI - 0.45, { swing: 0.08, stretch: 0.35 });
    sf.thrown([[-150, 0, 162.4, 0, 9.6 * LEN], [150, 0, 162.4, 0, 9.6 * LEN]], 1);
    // (court) THE PAIR: two figures' shadows from starboard, feet outside the picture, each a ruled person 50 m long and more
    // (the same silhouette as nobody's shadow: coat, sloping shoulders, round head, a hanging arm).
    // Their hour runs only in the court: they swing round like the hands of a clock and lengthen ahead of us, across the
    // lower third of the picture, leaning together, until the two heads lie on the lit sill as we cross it.
    // (angle and length at hour h: a0 + swing h, L0 (1 + stretch h); drawn in true proportion for h 0.4)
    // (staggered: the far one's shoulders lie beside the near one's waist, so the two never merge into one cross)
    // (fix: they lay across the court and passed under the lens as two paddles.  Now they lie along our own line, 24 m long, side
    // by side, heads inclined together, and walk ahead of us: whole in the picture until their heads cross the lit sill)
    // (second fix: 24 m long and 4 m ahead of the lens they were two paddles.  They are 13 m long now and keep 15 m ahead of us,
    // small and whole in the picture, until their heads cross the lit sill and they go in before us)
    for (const [foot, a0, swing, near] of [[[-5.6, TOP, 562], 0.095, -0.07, true], [[5.8, TOP, 563.6], -0.085, 0.07, false]]) {
      sp.kind = 0; sp.angle = a0; sp.swing = swing; sp.stretch = 0; sp.gate = 0; sp.fold = null; sp.lift = 0.06;
      addFigure(sp, foot, near ? 30 : 28, { wide: 1.12, shoulders: 0.15, hem: 0.05, neckW: 0.036, tilt: near ? 0.22 : -0.2, armSide: near ? -1 : 1, armOut: 0.3, head: near ? [0.078, 0.072] : [0.075, 0.07], step: 1 });
    }
    // (court) an arcade nobody sees throws its shadow in from starboard: a row of arches of light lying toward our line
    hourOf(sw, -1.75, { swing: 0.09, stretch: 0.22 });
    arcadeShade(sw, (a) => [58, TOP, 566 + a, 1 - a * 0.0045], 66, 5, { hw: 4.6, jamb: 7.5, rise: 4.6, top: 15, k: 2.9 * (LEN > 1 ? 1.15 : 1) });
    // (court) the cropped block's own long shadow, lying into the court from port, and the short one the cube leaves behind it
    hourOf(sw, 1.1, { swing: 0.09, stretch: 0.2 });
    arcadeShade(sw, (a) => [-60 + a * 14 / 59.7, TOP, 573 + a * 58 / 59.7, 1 - a * 0.005], 59.7, 4, { hw: 5, jamb: 6.5, rise: 5, top: 13.5, k: 2.8 * (LEN > 1 ? 1.15 : 1) });
    hourOf(sw, 1.0, { swing: -0.07, stretch: 0.05 });
    arcadeShade(sw, (a) => [-42 + a, TOP, 531.2, 1], 84, 5, { hw: 4.3, jamb: 7.6, rise: 4.0, tiers: 5, tier: 16.8, k: 0.6 * (LEN > 1 ? 1.04 : 1) });
    {
      const RY = TOP + 0.25;
      hourOf(sw, Math.PI + 0.5, { swing: 0.1, stretch: 0.2, lift: 0.1 });
      { const rows = []; for (let i = 0; i <= 12; i++) { const t = -1 + 2 * i / 12, w = RBALL[2] * Math.sqrt(Math.max(1 - t * t, 0)); rows.push([(1 + t) * 14 + 0.6, -w, w]); } sw.shape([RBALL[0], RY, RBALL[1]], rows); }
      hourOf(sw, Math.PI - 0.7, { swing: -0.1, stretch: 0.2, lift: 0.1 });
      sw.shape([RCONE[0], RY, RCONE[1]], [[0, -RCONE[2], RCONE[2]], [38, 0, 0.03]]);
      for (const sx of [-1, 1]) { hourOf(sw, Math.PI - 0.32 * sx, { swing: 0.07 * sx, stretch: 0.15, lift: 0.1 }); sw.thrown([[sx * 11.6 - 2.3, RY, 523.1, 0, 24], [sx * 11.6 + 2.3, RY, 523.1, 0, 24]], 1); }
      // (court) the two plinths' ruled shadows, four times too long, opening toward us like a V
      for (const sx of [-1, 1]) { hourOf(sw, sx * (Math.PI / 2 + (sx > 0 ? 0.5 : 0.28)), { swing: 0.06 * sx, stretch: 0.12, lift: 0.07 }); sw.thrown([[sx * (CPL[0] + 1.6), TOP, CPL[1] - 3.2, 0, 34 * (LEN > 1 ? 1.1 : 1)], [sx * (CPL[0] + 1.6), TOP, CPL[1] + 3.2, 0, 34 * (LEN > 1 ? 1.1 : 1)]], 1); }
    }
    await ctx.yield();
    // (square) the terrace's own shadow across the low end, with the taller one of arcade A's end; C's wedge along the port side
    hourOf(sr, 0.36, { swing: 0.15, stretch: -0.3 });
    sr.thrown([[-150, 0, 0, 0, 44 * LEN], [150, 0, 0, 0, 44 * LEN]], 1);
    // (a chimney nobody sees, slender and capped: it enters the reveal from the bottom of the frame and points up the square.
    // It lies at an angle of its own now, 12 degrees to port of the axis: nobody's shadow lies along our course, where it lay)
    hourOf(sr, -0.22, { swing: 0.15, stretch: -0.3 });
    sr.thrown([[-25.3, 0, 0, 0, 86 * LEN], [-21.3, 0, 0, 0, 86 * LEN]], 1);
    sr.thrown([[-26.2, 0, 0, 86 * LEN, 90.5 * LEN], [-20.4, 0, 0, 86 * LEN, 90.5 * LEN]], 1);
    hourOf(sr, 1.9, { swing: -0.08, stretch: 0.4 });
    arcadeShade(sr, (run) => { const w = XC.at(run, 0, 0.3); return [w[0], 0, rl(w[2]), XC.sOf(run)]; }, XC.R, Co.bays, { hw: Co.hw, jamb: Co.jamb, rise: Co.rise, top: 25, k: 1.5 * LEN });
    // (square) a shadow mass along the far half of B, whose face is lit: the hour is wrong
    hourOf(sr, -2.0, { swing: 0.1, stretch: 0.4 });
    arcadeShade(sr, (run) => { const w = XB.at(run, 0, 0.3); return [w[0], 0, rl(w[2]), XB.sOf(run)]; }, XB.R, Bo.bays, { hw: Bo.hw, jamb: Bo.jamb, rise: Bo.rise, top: 21, k: 1.7 * LEN, from: 9 });
    // (square) TWO ARCADES NOBODY SEES throw their shadows in from either side, well into the picture and each at its own hour:
    // one from port below the plinth, one from starboard under the cube; rows of arches of light lying toward our line
    hourOf(sr, 1.27, { swing: 0.12, stretch: 0.3 });
    arcadeShade(sr, (a) => [-57 + a * 0.06, 0, rl(262 + a), 1 - a * 0.004], 62, 5, { hw: 4.3, jamb: 7.6, rise: 4.2, top: 13.4, k: 2.35 * LEN });
    hourOf(sr, -1.12, { swing: -0.1, stretch: 0.25 });
    arcadeShade(sr, (a) => [62 - a * 0.1, 0, rl(200 + a), 1 - a * 0.005], 56, 5, { hw: 4.0, jamb: 7.0, rise: 3.9, top: 12.6, k: 2.15 * LEN });
    // (square) a second chimney nobody sees, slender and capped: its shadow comes in from starboard under the cube and lies across
    // our line as we swing back to port, pointing at the block and the ball
    hourOf(sr, -1.1, { swing: 0.1, stretch: 0.25 });
    { const a = -1.1, px = Math.cos(a), pz = -Math.sin(a), cx = 40, cz = rl(331), L = 46 * LEN;
      sr.thrown([[cx - px * 1.9, 0, cz - pz * 1.9, 0, L], [cx + px * 1.9, 0, cz + pz * 1.9, 0, L]], 1);
      sr.thrown([[cx - px * 2.8, 0, cz - pz * 2.8, L, L + 3.2], [cx + px * 2.8, 0, cz + pz * 2.8, L, L + 3.2]], 1); }
    // (square) a white block and a plaster ball left under the cube, with their shadows four times too long
    hourOf(sr, 2.75, { stretch: 0.3, k: 3.5 });
    { const c = Math.cos(0.45), sn = Math.sin(0.45), cx = BLOCK[0], cz = BLOCK[1], h = 2.4, P = (a, e) => [cx + a * c + e * sn, 0, rl(cz - a * sn + e * c)];
      for (const [p0, p1] of [[P(-h, -h), P(h, -h)], [P(h, -h), P(h, h)], [P(h, h), P(-h, h)], [P(-h, h), P(-h, -h)]]) sr.thrown([[...p0, 0, 19 * LEN], [...p1, 0, 19 * LEN]], 1); }
    hourOf(sr, -2.6, { stretch: 0.3, k: 3.5 });
    { const rows = []; for (let i = 0; i <= 12; i++) { const t = -1 + 2 * i / 12, w = 2.3 * Math.sqrt(Math.max(1 - t * t, 0)); rows.push([(1 + t) * 9.2 * LEN + 0.3, -w, w]); } sr.shape([BALL2[0], 0, rl(BALL2[1])], rows); }
    // (square) the plinth's own block shadow, at an hour of its own
    hourOf(sr, Math.PI - 1.0, { swing: -0.4, stretch: 0.2 });      // (it swings away from the figure's feet: a strip of ochre stays between them)
    sr.thrown([[plinth[0] - 2.5, 0, rl(plinth[1] - 2.5), 0, 9 * LEN], [plinth[0] + 2.5, 0, rl(plinth[1] - 2.5), 0, 9 * LEN]], 1);
    sr.thrown([[plinth[0] + 2.5, 0, rl(plinth[1] - 2.5), 0, 9 * LEN], [plinth[0] + 2.5, 0, rl(plinth[1] + 2.5), 0, 9 * LEN]], 1);
    // (square) NOBODY'S SHADOW, lying from the plinth's foot toward us, head first, ALONG OUR COURSE (the brief: "we fly along the
    // figure's shadow, head first, 40 m to its feet, and pass the plinth"): one ruled person (legs, a long coat widest at the
    // sloping shoulders, neck, round head) and one arm that lowers, in a mesh of its own whose foot is the plinth's foot.
    // Its axis runs from the plinth's foot to the place where the course comes down over the square (the course's own point at
    // z 232, town x -5), and it is 40 m long: the lens comes over its head there and flies its length to the feet, the plinth
    // 12 m to starboard.  Thin, as a shadow four times too long is: 6 m across the shoulders.  It creeps as every shadow does
    // (update(): 8 percent longer for an hour of the square's clock, and it swings about the foot).
    const FIG_HEAD = [-5, 232], figFoot = [plinth[0] - 2.9, 0, rl(plinth[1] - 0.8)];
    const FIG_ANG = Math.atan2(FIG_HEAD[0] - figFoot[0], rl(FIG_HEAD[1]) - figFoot[2]), FIG_L = 40 * (LEN > 1 ? 1.08 : 1);
    {
      const figAng = 0, O = [0, 0, 0], armSide = 1; sg.own = true;      // (drawn along its own +z; its pivot turns it to FIG_ANG, so that it lengthens along its own length)      // (when the hour agrees the whole figure is turned as one rigid shape, in update())
      const at = (a, len, al, ac) => [Math.sin(a) * al * len + Math.cos(a) * ac * len, 0, Math.cos(a) * al * len - Math.sin(a) * ac * len];
      const one_ = (f, len, a, seated) => {
        sg.kind = 0; sg.angle = a; sg.swing = 0; sg.stretch = 0; sg.gate = 0; sg.fold = null; sg.lift = 0.07;
        addFigure(sg, f, len, seated ? { arm: false, seated, wide: 0.7 } : { arm: false, wide: 1, shoulders: 0.075, hem: 0.04, neckW: 0.022, head: [0.06, 0.045], stance: 1.0 });      // (sloping shoulders, a narrow hem, feet apart: seen along its length it reads as a person, where a coat 12 m broad lay as a black wedge)
        // THE ARM, a ribbon as thick as the neck at the end of the shoulder, lowered on the figure's own hour.  It comes down ON THE
        // COAT SIDE, toward the false sun, as an arm lowered in front of the body does: its shadow never swings out through the
        // level of the shoulders.  Raised beside the head at hour 0 (0.62 rad off the body's axis), it shortens into the shoulder
        // (at hour 0.5 it points at the sun and has no length), and comes out again down the coat, hanging 2.85 rad off the
        // axis at hour 1.  The shadow's own shader does it: the ribbon's angle turns 0.91 rad toward the coat while its length
        // runs from +1 through 0 to -1.  Off the shoulder line by 54 degrees at the least (the raised pose itself), at every hour.
        const bt = seated ? 0.6 : 0.7, sh0 = at(a, len, bt - 0.012, armSide * (seated ? 0.05 : 0.066)), w = (seated ? 0.02 : 0.022) * len;
        sg.angle = a + armSide * 0.62; sg.swing = armSide * (2.85 - 0.62 - Math.PI); sg.stretch = -2;      // (raised well clear of the head, so that side-on the gap between arm and head shows)
        sg.shape([f[0] + sh0[0], 0, f[2] + sh0[2]], [[-0.006 * len, -w, w], [0.1 * len, -w * 0.95, w * 0.95], [0.19 * len, -w * 0.9, w * 0.9], [0.235 * len, -w * 0.3, w * 0.3]]);
      };
      if (V.cast === 'seated') one_(O, FIG_L * 1.1, figAng, true);
      else {
        one_(O, FIG_L, figAng, false);
        if (V.cast === 'two') { const f2 = at(figAng, FIG_L, 0.03, 0.2); one_(f2, FIG_L * 0.84, figAng - 0.05, false); }
      sg.own = false;
      }
    }
    // (square) the solids' shadows, four times their length
    hourOf(sr, -1.45, { stretch: 0.3, k: 2 });
    if (V.solids === 'ballCone') { const rows = []; for (let i = 0; i <= 12; i++) { const t = -1 + 2 * i / 12; rows.push([(1 + t) * 9.6 * LEN + 0.3, -2.4 * Math.sqrt(Math.max(1 - t * t, 0)), 2.4 * Math.sqrt(Math.max(1 - t * t, 0))]); } sr.shape([BALL[0], 0, rl(BALL[1])], rows); }
    else sr.shape([BALL[0], 0, rl(BALL[1])], [[0, -2.1, 2.1], [14.8 * LEN, -2.1, 2.1]]);
    hourOf(sr, 2.5, { stretch: 0.3, k: 3.5 });
    if (V.solids === 'ballCone') sr.shape([CONE[0], 0, rl(CONE[1])], [[0, -2.0, 2.0], [28 * LEN, 0, 0.02]]);
    else sr.shape([CONE[0], 0, rl(CONE[1])], [[0, -2.4, 2.4], [3.2 * LEN, -2.4, 2.4], [3.2 * LEN, -2.4, 0.8], [6.4 * LEN, -2.4, 0.8], [6.4 * LEN, -2.4, -0.8], [9.6 * LEN, -2.4, -0.8]]);
    // (square) MORE RULED SHADOWS FROM CASTERS NOBODY SEES, from both sides (the brief's motifs: "the ruled shadow four times too
    // long", "the shadow whose caster is outside the picture"), so that the open ochre beside our course is ruled all the way
    // from the parapet to the plinth and on to the turn under the cube.  Opaque, one colour, 4 cm above the floor like the rest; each at an angle of its own and
    // creeping by the square's hour.  The new ones draw their swing and stretch (the brief's law: 3 to 8 degrees, two thirds one
    // way; a quarter to a half longer) from a stream of their own, the seed and a name.
    {
      const sq = ctx.core.makeRng(ctx.core.hashSeed('square-shadows:' + ctx.seed)), G = LEN > 1 ? 1.12 : 1;
      const law = (ang, o = {}) => hourOf(sr, ang, { swing: sq.range(0.05, 0.14) * (sq.chance(0.67) ? 1 : -1), stretch: sq.range(0.22, 0.5), ...o });
      // a chimney's shadow: a slender bar from `near` to `far` metres along the builder's angle from (x, ramp z), and its cap
      const chimney = (x, cz, near, far, div = 1, hw = 1.7, cap = 0.9) => {
        const px = Math.cos(sr.angle), pz = -Math.sin(sr.angle);
        sr.thrown([[x - px * hw, 0, cz - pz * hw, near, far], [x + px * hw, 0, cz + pz * hw, near, far]], div);
        sr.thrown([[x - px * (hw + cap), 0, cz - pz * (hw + cap), far, far + 3], [x + px * (hw + cap), 0, cz + pz * (hw + cap), far, far + 3]], Math.max(1, div >> 3));
      };
      // the unseen starboard arcade (z 200 to 256) carries a chimney at its low end: a finger on its roofline, at the arcade's own
      // sun, pointing across the low square toward the head of nobody's shadow; it stops 7 m short of it at its longest
      hourOf(sr, -1.12, { swing: -0.1, stretch: 0.25 });
      chimney(61.4, rl(206), 26, 46 * G);
      // ... and the unseen port arcade (z 262 to 324) one at its low end: a finger pointing at our course past the plinth
      hourOf(sr, 1.27, { swing: 0.12, stretch: 0.3 });
      chimney(-56.7, rl(267), 30.5, 44 * G);
      // a chimney on arcade B: its finger runs from B's foot out across the open square, cap at its end.  Where along B it
      // stands and which way it points are its own two draws (a stream of its own, the seed and a name): anywhere along B's
      // foot, and within 35 degrees either way of straight out from B's face (the bound the room's tongues lean by: the brief's
      // false suns "disagree by up to 70 degrees").  The two are drawn again, up to forty times (a plain number, the room's
      // tongues'), while a corner of its cap would lie off the ramp beyond either end of B at either end of the square's hour;
      // and, in the rare edition where the hour agrees, while its whole length would pass B's upper end as it swings up the ramp
      // to the one sun with every other shadow of the square.  A seed for which no draw passes lays no finger.  Its swing and
      // stretch are the brief's law from the shadows' stream (law's angle is set below).  It falls where it falls.
      {
        const fg = ctx.core.makeRng(ctx.core.hashSeed('square-finger:' + ctx.seed)), f0 = XB.at(0, 0, 0.55), f1 = XB.at(XB.R, 0, 0.55);
        const out = Math.atan2(-(rl(f1[2]) - rl(f0[2])), f1[0] - f0[0]);      // (square to B's foot, into the square, in the ramp's frame)
        law(0);
        const HW = 1.7, CAP = 0.9, LONG = 46 * G + 3, h0 = CLOCK.square, h1 = CLOCK.square + 1;      // chimney's own half width and cap; bar and cap; the square's hour as this seed's crossing starts and ends it
        const capZ = (zr, a, h) => zr + Math.cos(a + sr.swing * h) * LONG * (1 + sr.stretch * h);      // the middle of the cap's end, metres up the ramp, at hour h
        const side = (a, h) => (HW + CAP) * Math.abs(Math.sin(a + sr.swing * h));      // ... and how much further up or down the ramp its corners lie
        for (let tries = 0; tries < 40; tries++) {
          const at = XB.at(fg.range(0, XB.R), 0, 0.55), a = out + fg.range(-35, 35) * Math.PI / 180, zr = rl(at[2]);
          const lo = Math.min(capZ(zr, a, h0) - side(a, h0), capZ(zr, a, h1) - side(a, h1)), hi = Math.max(capZ(zr, a, h0) + side(a, h0), capZ(zr, a, h1) + side(a, h1));
          if (lo < rl(f0[2]) || hi > rl(f1[2])) continue;
          if (V.rare && zr + LONG * (1 + sr.stretch * h1) > rl(f1[2])) continue;      // (swinging from its own angle to AGREE_ANG it passes straight up the ramp)
          sr.angle = a; chimney(at[0], zr, 0, 46 * G, 1, HW, CAP);
          break;
        }
      }
      // ... and two that FOLD UP THE FOOT OF ARCADE B: chimneys nobody sees stand out on the square's starboard side and throw the
      // other way, to B: each a bar across the bare ochre at B's foot and up the shaft of a pier (the sixth and the ninth), cap and
      // all, never wider than the shaft.  Each is SOLVED FROM THE SEED'S OWN HOUR (the square's clock runs from CLOCK.square to an
      // hour later while we cross from the parapet to the top of the ramp): its tip stands at the wall's foot when that hour
      // starts and its cap ends under the pier's impost when it ends, so on every seed it climbs the pier while we cross.  Two
      // unknowns, where the caster stands and how long the shadow is, from those two ends, with the swing and the stretch it drew;
      // at the hour's end it lies up the middle of the shaft.
      {
        const b0 = XB.at(0, 0, 0.55), b1 = XB.at(XB.R, 0, 0.55);
        let tx = b1[0] - b0[0], tz = rl(b1[2]) - rl(b0[2]); const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
        const fold = [tz, -tx, tz * b0[0] - tx * rl(b0[2])];      // (the wall's own plane in the ramp's frame)
        const h0 = CLOCK.square, h1 = CLOCK.square + 1;      // the square's hour as this seed's crossing starts it and ends it
        for (const [p, ang] of [[5, 1.2], [8, 1.02]]) {
          const run = p * XB.R / Bo.bays, pier = XB.at(run, 0, 0.55), sc = XB.sOf(run), shaft = (XB.R / Bo.bays - 2 * Bo.hw) * sc;
          law(ang, { fold, foldDir: [0, cosR, SLOPE * cosR] });
          // toward: metres toward the wall for a metre along the shadow at hour h;  grow: its length at hour h for a metre drawn
          const toward = (h) => fold[0] * Math.sin(ang + sr.swing * h) + fold[1] * Math.cos(ang + sr.swing * h), grow = (h) => 1 + sr.stretch * h;
          const climb = (Bo.jamb - 3 * Bo.impostH) * sc - 0.6;      // the shaft: from the wall's foot to under the impost
          // tip L (bar and cap) and the caster's distance P from the wall:  L grow(h0) toward(h0) = P  and  L grow(h1) toward(h1) = P + climb
          const tip = climb / (grow(h1) * toward(h1) - grow(h0) * toward(h0)), P = tip * grow(h0) * toward(h0), back = P / toward(h1), a1 = ang + sr.swing * h1;
          chimney(pier[0] - Math.sin(a1) * back, rl(pier[2]) - Math.cos(a1) * back, 3, tip - 3, 32, shaft * 0.3, shaft * 0.17);
        }
        sr.fold = null; sr.foldDir = [0, 1, 0];
      }
    }
    await ctx.yield();
    // (loggia) tongues of ochre light through A's arches onto the black floor and up the black back wall: a rank, one to an arch,
    // each 0.72 of its arch wide, all leaning on down the loggia (7 to 17 degrees), each with its own reach, swing and stretch
    {
      const cell = XA.R / A.bays, p0 = XA.at(0, 0, -(A.T + A.D)), p1 = XA.at(XA.R, 0, -(A.T + A.D));
      let tx = p1[0] - p0[0], tz = p1[2] - p0[2]; const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
      let nx = -tz, nz = tx; if (nx > 0) { nx = -nx; nz = -nz; }
      const fold = [nx, nz, nx * p0[0] + nz * p0[2] - 0.09];
      for (let i = 0; i < A.bays; i++) {
        const lean = rng.range(0.12, 0.55) * (rng.chance(0.5) ? 1 : -1), k = rng.range(0.55, 0.95), swing = rng.range(0.05, 0.14) * (rng.chance(0.67) ? 1 : -1), stretch = rng.range(0.2, 0.45), skip = rng.chance(0.2);
        void skip;      // (from the sixth bay on every arch throws its tongue: the far half of the loggia is never all black)
        const fwd = i >= 5;      // from the sixth bay on the tongues lean on down the loggia, so they lie where we are looking
        sl.kind = 1; sl.angle = -Math.PI / 2 + 0.13 + Math.abs(lean) * 0.3; sl.swing = swing * 1.6; sl.stretch = stretch; sl.gate = LOGGIA_GATE; sl.fold = fold; sl.foldDir = [0, 1, 0]; sl.lift = 0.05;
        const ac = (i + 0.5) * cell, base = [], n = 10;
        for (let j = 0; j <= n; j++) {
          const t = Math.PI * (1 - j / n), a = ac + A.hw * 0.72 * Math.cos(t), top = A.jamb + A.rise * Math.sin(t), f = XA.xf(a, 0.07, -A.T - 0.04), s = XA.sOf(XA.run(a));
          base.push([f[0], f[1], f[2], 0, top * s * (fwd ? Math.max(k, 0.75) : k) * 1.5]);
        }
        sl.thrown(base, 22);
        if (i % 3 === 2) await ctx.yield();
      }
    }
    await ctx.yield();
    const swGeo = sw.build();
    await ctx.yield();
    const worldShadows = new THREE.Mesh(swGeo, shadowMat); worldShadows.frustumCulled = false; worldShadows.name = 'shadows'; town.add(worldShadows);
    const loggiaTongues = new THREE.Mesh(sl.build(), loggiaMat); loggiaTongues.frustumCulled = false; loggiaTongues.name = 'loggia-tongues'; town.add(loggiaTongues);
    const foreShadows = new THREE.Mesh(sf.build(), foreMat); foreShadows.frustumCulled = false; foreShadows.name = 'forecourt-shadows'; town.add(foreShadows);
    const pairShadows = new THREE.Mesh(sp.build(), pairMat); pairShadows.frustumCulled = false; pairShadows.name = 'the-pair'; town.add(pairShadows);
    const ramp = new THREE.Group(); ramp.position.set(0, -24.4, 163); ramp.rotation.x = -Math.atan(SLOPE); town.add(ramp);
    const rampShadows = new THREE.Mesh(sr.build(), squareMat); rampShadows.frustumCulled = false; rampShadows.name = 'ramp-shadows'; ramp.add(rampShadows);
    const figure = new THREE.Mesh(sg.build(), figMat); figure.frustumCulled = false; figure.name = 'nobodys-shadow';
    const figPivot = new THREE.Group(); figPivot.position.set(figFoot[0], 0, figFoot[2]); figPivot.rotation.y = FIG_ANG; ramp.add(figPivot); figPivot.add(figure);
    const cubeShadow = new THREE.Mesh(sh.build(), cubeShMat); cubeShadow.frustumCulled = false; cubeShadow.name = 'cube-shadow'; hero.object.add(cubeShadow);
    // (room, hero space) STANDING ARCHES OF LIGHT ON THE TWO FLANKS: four to a wall, thrown from nowhere across the last metres of
    // the floor and up the black wall, each a whole arch of ochre as tall as the blind tier, sliding along the wall with the
    // room's hour, no two at one angle.  The room in negative: the walls carry ranks of light as the squares outside carry
    // ranks of shadow.  (Gated like the ranks from the front wall: they appear when the lens is 32 m from the front face.)
    {
      const fl = makeShadowBuilder(), q = 58, bx = q * 0.3 / 120, nl = Math.hypot(1, bx), dW = q * 0.85 / nl, sOf = (z) => 1 - 0.3 * (60 - z) / 120;
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {
        const zc = -42 + i * 26.5 + sg * 3.5, sc = sOf(zc), hw = 7.4 * sc, jamb = 9.2 * sc, rise = 7.2 * sc, n = [sg / nl, -bx / nl];
        const lean = ((i + (sg > 0 ? 1 : 0)) % 2 ? 1 : -1) * (0.2 + 0.05 * i), off = 20;
        fl.kind = 1; fl.angle = sg * (Math.PI / 2 - lean); fl.swing = sg * (lean > 0 ? -0.3 : 0.3); fl.stretch = 0; fl.gate = ROOM_GATE; fl.lift = 0.06; fl.own = true;
        fl.fold = [n[0], n[1], dW - 0.09]; fl.foldDir = [0, 1, 0];
        const zs = zc - Math.tan(lean) * off, base = [], N = 12;      // the feet stand off the wall, so the arch slides along it as its angle swings
        for (let k = 0; k <= N; k++) {
          const t = Math.PI * (1 - k / N), z = zs + hw * Math.cos(t), fx = sg * (q * sOf(z) - off), top = jamb + rise * Math.sin(t);
          let near = 1e9;
          for (const h of [0, 0.5, 1]) { const an = fl.angle + fl.swing * h, den = n[0] * Math.sin(an) + n[1] * Math.cos(an); near = Math.min(near, (dW - 0.09 - n[0] * fx - n[1] * z) / Math.max(den, 0.2)); }
          base.push([fx, 0.25, z, near - 0.3, near + top]);
        }
        fl.thrown(base, 16);
      }
      // ... and LEANING ARCHES OF LIGHT ON THE PIERS of the second and third tiers of the back wall and both flanks, between the
      // arches of sky: each a whole small arch of ochre standing on the black, rocking a few degrees about its foot with the
      // room's hour like the hand of a clock, no two together.  (Each is drawn in its wall's own plane: the fold line is the wall.)
      const piers = [];      // [nx, nz, d, x, z, scale, index, half width]
      for (let p = 1; p <= 4; p++) piers.push([0, -1, q, (-60 + 24 * p) * 0.7, -q, 0.7, p, 2.5 / 0.7]);
      for (const sg of [-1, 1]) for (let p = 1; p <= 4; p++) { const sc = Math.exp(Math.log(0.7) / 120 * 24 * p), z = 60 - (1 - sc) * 400; piers.push([sg / nl, -bx / nl, dW, sg * q * sc, z, sc, p + (sg > 0 ? 1 : 2), 4.4]); }
      for (const [nx, nz, d, px, pz, sc, pi, hwF] of piers) for (let j = 1; j <= 2; j++) {
        if (j === 2 && pi % 2 === 0) continue;
        const sgn = (pi + j) % 2 ? 1 : -1, hw = hwF * sc, jamb = 8.4 * sc, y0 = (24 * j + 2.4) * sc - 1.0, dl = 0.4;
        fl.kind = 1; fl.angle = Math.atan2(nx, nz) - 0.16 * sgn; fl.swing = 0.34 * sgn; fl.stretch = 0; fl.gate = ROOM_GATE; fl.lift = 0; fl.own = true;
        fl.fold = [nx, nz, d - 0.09]; fl.foldDir = [0, 1, 0];
        const rows = [[dl + 1.0, -hw, hw], [dl + 1.0 + jamb, -hw, hw]];
        for (let k = 1; k <= 8; k++) { const t = (k / 8) * Math.PI / 2; rows.push([dl + 1.0 + jamb + hw * Math.sin(t), -hw * Math.cos(t), hw * Math.cos(t)]); }
        fl.shape([px - nx * (dl + 0.09), y0, pz - nz * (dl + 0.09)], rows);
      }
      const flank = new THREE.Mesh(fl.build(), heroShadowMat); flank.frustumCulled = false; flank.name = 'flank-light'; hero.object.add(flank);
    }
    // (room, hero space) THE LIT ARCHES OF THE FLANKS THROW THEIR TONGUES (the brief: "ruled tongues of ochre light up to 90 m long on
    // the black floor at angles that disagree").  The floor's ranks all come from the front wall at one angle.  The arches of sky
    // of the two flanks' second tier throw their own outlines long across them: EVERY arch of that tier, five to a flank, by ONE
    // LAW.  For each arch alike:
    //   its lean off the square of its wall is drawn within 35 degrees either way (the brief's false suns "disagree by up to 70 degrees");
    //   its throw is drawn: the crown of its light lies between half and the whole of the brief's 90 m from the wall's foot when the
    //     room's hour is full;
    //   it creeps as the brief has every shadow creep (hourOf's law: 3 to 8 degrees of swing, two thirds one way; a quarter to a half
    //     longer for an hour); it has no gate: it lies on the room's floor for the whole flight, as the room's ball and cone
    //     stand there for the whole flight (the floor stands a quarter of a metre over the level top behind the front wall's
    //     arches: an eye lower than the floor cannot see it, an eye higher than it sees it through the ground arches); and it
    //     keeps its own angle when the hour agrees, as the flanks' standing lights do (it is cut to the room at its own angles);
    //   it is drawn again until it lies whole on the floor at both ends of the room's hour (no light leaves the room or climbs a wall:
    //     the room's own walls, inRoom); an arch for which forty draws find no such tongue throws none.
    // All from a stream of their own (the seed and a name).  They fall where they fall.
    {
      const rt = ctx.core.makeRng(ctx.core.hashSeed('room-tongues:' + ctx.seed)), tb = makeShadowBuilder(), SA = hero.anchors.smallArch, kap = -Math.log(0.7) / 120;
      const inRoom = (x, z) => z > -53.5 && z < 55 && Math.abs(x) < 49.3 + 0.145 * z - 2.5;
      const flankFoot = (sg) => (a) => { const z = 60 - (1 - Math.exp(-kap * a)) * 400, sc = cubeScaleAt(z); return [sg * 57.95 * sc, 0.25, z, sc]; };
      const hw = SA.hw / SA.stretch, crown = 24 + SA.jamb + SA.rise, LEAN = 35 * Math.PI / 180, REACH = 90;
      for (const sg of [-1, 1]) for (let bay = 0; bay < 5; bay++) {
        const footOf = flankFoot(sg), ac = (bay + 0.5) * 24, inward = -sg * Math.PI / 2;
        for (let tries = 0; tries < 40; tries++) {
          const lean = rt.range(-LEAN, LEAN), reach = rt.range(0.5, 1) * REACH, swing = rt.range(0.05, 0.14) * (rt.chance(0.67) ? 1 : -1), stretch = rt.range(0.22, 0.5);
          const k = reach / (crown * footOf(ac)[3] * (1 + stretch));
          let ok = true;
          for (let j = 0; j <= 12 && ok; j++) {
            const t = Math.PI * (1 - j / 12), f = footOf(ac + hw * Math.cos(t)), far = (24 + SA.jamb + SA.rise * Math.sin(t)) * f[3] * k, near = 24 * f[3] * k;
            for (const h of [0, 0.5, 1]) for (const l of [near, far]) { const an = inward + lean + swing * h, d = l * (1 + stretch * h); if (!inRoom(f[0] + Math.sin(an) * d, f[2] + Math.cos(an) * d)) ok = false; }
          }
          if (!ok) continue;
          tb.kind = 1; tb.angle = inward + lean; tb.swing = swing; tb.stretch = stretch; tb.gate = 0; tb.own = true; tb.lift = 0.05; tb.fold = null; tb.foldDir = [0, 1, 0];
          addTongue(tb, footOf, ac, hw, 24, SA.jamb, SA.rise, k, 12);
          break;
        }
      }
      const roomTongues = new THREE.Mesh(tb.build(), heroShadowMat); roomTongues.frustumCulled = false; roomTongues.name = 'room-tongues'; hero.object.add(roomTongues);
    }
    await ctx.yield();

    // ---- THE FAUNA: shadows of birds and nothing else ------------------------------------------------------------------
    const nBirds = Math.max(12, Math.round(36 * (detail < 0.8 ? 0.7 : 1))), one = V.flock === 'one';
    // every bird's shadow is thrown long, like every shadow here (it lies foreshortened under us); the one great bird keeps its
    // wings spread and its tips nearly still, so that it is a clean ruled bird at every pose
    // (near our own line a bird's shadow is as long as it is across: thrown long it lay in splinters in the lower corners)
    const LONG = { long: 1, foldK: 0.25, tipK: 0.1 }, GREAT = { tipK: 0.08, foldK: 0.22, long: 1.25 };
    // THE BEATS' STARTS: where in its wing beat (and, for those that come round, where in its round) a bird's shadow begins, for the
    // birds that had a typed start: the lone bird, the great shadow, the three gliders on the cube's face, the loggia's strays.
    // One stream of their own (the seed and a name), drawn here once and in this order.
    const beatRng = ctx.core.makeRng(ctx.core.hashSeed('beats:' + ctx.seed));
    // THE LAW OF A SHADOW'S SPEED (the great shadow and the strays that follow it): a function of where IT is.  A bird flies level
    // at 40 m/s under a false sun that stands atan(1/4) up (the town's shadows are four times as long as their casters), so its
    // shadow runs 40 m/s on level ochre, 40 sin(e) / sin(e + rise) on a floor that rises away from it (24.8 m/s up the square's
    // 9 degrees) and 40 tan(e) = 10 m/s up a wall.  PACE_K: those two as shares of 40, for the flock's shader (the ramp's counted level).
    const SUN_UP = Math.atan(1 / 4), shadowSpeed = (rise) => 40 * Math.sin(SUN_UP) / Math.sin(SUN_UP + rise);
    const PACE_K = [shadowSpeed(Math.atan(SLOPE)) * cosR / 40, shadowSpeed(Math.PI / 2) / 40];
    const BEAT = { lone: beatRng.range(0, TAU), great: beatRng.range(0, TAU), face: [0, 1, 2].map(() => [beatRng.range(0, TAU), beatRng()]), loggia: beatRng() };
    // (1) one bird's shadow alone, at arm's length, sliding down the lit face of the pier by the arch we enter
    const lone = makeFlock(style, [{ start: [0, 0, -7.6], heading: 0, fold: 7.5, climb: 0, side: 1, delay: 0, phase: BEAT.lone, size: 2.6 }], { wallN: [0, 0, -1], cell: [1, 1], arch: [0, 0, 0], near: 1 });
    {
      const cell = XA.R / A.bays, o = XA.at(3 * cell - (cell * 0.5 - A.hw) - 0.05, 0, -1.2);
      lone.matrixAutoUpdate = false; lone.matrix.makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0)).setPosition(o[0], o[1], o[2]);
      lone.name = 'lone-bird'; town.add(lone);
    }
    // (2) the flock crossing the square and running into arcade B's black arches (in the ramp's own plane)
    const cosT = cosR, sinT = SLOPE * cosR;
    const toRamp = (w) => [w[0], 0, rl(w[2])];
    const bFoot0 = toRamp(XB.at(0)), bFoot1 = toRamp(XB.at(XB.R));
    const bT = new THREE.Vector3(bFoot1[0] - bFoot0[0], 0, bFoot1[2] - bFoot0[2]).normalize();
    let sqLen = 1; const sqBirds = [];
    for (let i = 0; i < (one ? 1 : Math.round(nBirds * 0.55)); i++) {
      const bay = rng.int(2, 8), cellB = XB.R / Bo.bays, onPier = rng.chance(0.4), run = (bay + (onPier ? 0 : 0.5)) * cellB + (onPier ? 0 : rng.range(-2.5, 2.5));
      const tgt = toRamp(XB.at(run, 0, 0.35)), s = XB.sOf(run);
      const st = one ? [-40, 0, rl(215)] : [rng.range(-48, -4), 0, rl(rng.range(186, 226))];      // (below nobody's shadow: none crosses it)
      const dx = tgt[0] - st[0], dz = tgt[2] - st[2], fold = Math.hypot(dx, dz);
      const b = { start: st, heading: Math.atan2(dx, dz), fold, climb: onPier ? rng.range(5, 10) * s : 1, side: rng.chance(0.5) ? 1 : -1, delay: one ? 0 : rng.range(0, 90), phase: rng.range(0, TAU), size: one ? 30 : rng.range(4.8, 6.4) * 1.15 };      // (seen from 25 m up, and thrown long like every shadow here: larger than the rest)
      sqBirds.push(b); sqLen = Math.max(sqLen, fold + b.climb + 11 + b.delay);
    }
    const sqFlock = makeFlock(style, sqBirds, { wallOrigin: bFoot0, wallT: [bT.x, 0, bT.z], wallN: [-bT.z, 0, bT.x], wallUp: [0, cosT, sinT], cell: [1, 1], arch: [0, 0, 0], beat: one ? 0.7 : 2, ...(one ? GREAT : { long: 1.0 }) });
    sqFlock.name = 'square-flock'; ramp.add(sqFlock);
    // (3) the chase is the hero's own flock (or, in the edition with one great shadow, a single bird 30 m across)
    let chaseOne = null, great = null;
    if (one) {
      // (straight up our own line and into the black of the central arch, its wing tips up the two piers)
      // (it overtakes to one side of us, on the side away from the plinth, where we see it whole)
      // Its line runs from hero (-17, 262) to the central arch's foot at hero (0.5, 60); it STARTS on that line abeam of the head of
      // nobody's shadow (world z 232, where the course comes down over the square 32 m short of the plinth).  Its speed is the
      // law's (PACE_K): slower up the ramp than on the level, slower again up the cube's face (THE GREAT SHADOW'S RUN, below).
      const gz = CUBE_Z - FIG_HEAD[1], gx = -17 + 17.5 * (262 - gz) / 202, gFold = Math.hypot(0.5 - gx, gz - 60);
      great = { x: gx, z: gz };
      chaseOne = makeFlock(style, [{ start: [gx, 0, gz], heading: Math.atan2(0.5 - gx, 60 - gz), fold: gFold, climb: 40, side: 1, delay: 0, phase: BEAT.great, size: 30 }],
        { floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [24, 24], arch: [8, 12, 7.5], beat: 0.7, top: 10.4, paceK: PACE_K, ...GREAT });
      chaseOne.name = 'chase-one'; hero.object.add(chaseOne);
    }
    // ... and, with the hero's flock, the birds that keep to our own line: from behind, 7 m under us, up the ramp and up the two
    // piers of the central arch (hero space, like the hero's own)
    const nearBirds = [], figPier = hero.anchors.figurePier || 0;      // (no bird climbs the pier that carries nobody's shadow)
    for (let i = 0; i < Math.round(nBirds * 0.6); i++) {      // (in every edition: beside the one great shadow too)
      // (lanes: each keeps 6 to 12 m to one side of our line and goes to the pier on its own side, evenly spaced along the run, so
      // none passes under the lens as a wedge and no two share a spot)
      const nN = Math.round(nBirds * 0.6), sgn = (rng.chance(0.5), i % 2 ? 1 : -1), px = sgn * (rng.range(9.2, 14.8) + (sgn * figPier > 0 ? 24 : 0)), dz = rng.range(150, 215), sx0 = 7 + sgn * (7 + (rng.range(-5, 11) + 5) / 16 * 3);
      const tier = rng.int(0, 2), climb = tier * 24 + 12 + rng.range(-6, 0.5);
      nearBirds.push({ start: [sx0, 0, 60 + dz], heading: Math.atan2(px - sx0, -dz), fold: Math.hypot(px - sx0, dz), climb, side: rng.chance(0.6) ? -sgn : sgn, delay: (((i * 5) % Math.max(nN, 1)) + rng.range(0, 75) / 75 * 0.6) / Math.max(nN, 1), phase: rng.range(0, TAU), size: rng.range(2.5, 3.2) * 2.0 });
    }
    // (the chase comes round again: with the camera held the birds still overtake, wave after wave)
    // (each bird's delay was drawn as a share of the loop)
    let nearLen = 1; for (const b of nearBirds) nearLen = Math.max(nearLen, b.fold + b.climb + 11 + 30);
    for (const b of nearBirds) b.delay *= nearLen;
    const nearFlock = makeFlock(style, nearBirds, { floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [24, 24], arch: [8, 12, 7.5], loop: nearLen, ...LONG, long: 1.15, top: 0 });
    nearFlock.name = 'chase-near'; hero.object.add(nearFlock);
    // THE CHASE AS A SEEN EVENT (the brief: "the flock's shadows come from behind at 40 m/s, pass 7 m under us and race up the ramp;
    // we climb after them at 9 degrees; they run up the cube's white piers and go out in its black arches").  New birds, each
    // from a stream of their own (the seed and a name); a bird is a shadow on its own straight line over the ochre to the foot
    // of a pier, up the middle of the pier to an arch of the two lower tiers and out in it: nothing of it reads the lens (near: 1).
    // The lines are laid by the place: they start behind the plinth and fan to the four piers either side of the central arch (the
    // two that flank it and the next one out on each side), an even pick among them; none to the pier that carries nobody's shadow.
    const chasePiers = [12, 36, -12, -36].filter((x) => x !== figPier);      // hero x of the piers' middles (hero +x is the town's port)
    const chaseBirds = (cr, n, start) => {
      const bs = [];
      for (let i = 0; i < n; i++) {
        const st = start(cr), px = cr.pick(chasePiers) + cr.range(-0.7, 0.7), dz = st[1] - 60;
        bs.push({ start: [st[0], 0, st[1]], heading: Math.atan2(px - st[0], -dz), fold: Math.hypot(px - st[0], dz), climb: cr.int(0, 1) * 24 + 12 + cr.range(-4, 0.5), side: cr.chance(0.5) ? 1 : -1, delay: 0, phase: cr.range(0, TAU), size: cr.range(5.0, 6.4) });
      }
      return bs;
    };
    const CHASE_WALL = { floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [24, 24], arch: [8, 12, 7.5], near: 1, ...LONG, long: 1.15 };
    let greatStrays = null, chaseStream = null, chaseLoop = 1;
    if (one) {
      // the edition with one great shadow: A FEW STRAYS FOLLOW IT.  They leave from round the great one's start, beside nobody's
      // shadow, each a little after it (12 to 110 m of its run behind), and run by the same law of speed, each where IT is.
      const cr = ctx.core.makeRng(ctx.core.hashSeed('great-strays:' + ctx.seed));
      const bs = chaseBirds(cr, 12, (r) => [great.x + r.range(-9, 16), great.z + r.range(-6, 14)]);
      for (let i = 0; i < bs.length; i++) bs[i].delay = 12 + (i + cr.range(0, 0.8)) * 8.2;
      greatStrays = makeFlock(style, bs, { ...CHASE_WALL, paceK: PACE_K, top: 48 }); greatStrays.name = 'great-strays'; hero.object.add(greatStrays);
    } else {
      // the edition of 36 birds: 36 more in a loose stream that never stops, at 40 m/s, out of the terrace's own shadow at the foot
      // of the square (z 168 to 182: inside it at every hour) and up the square under our course
      const cr = ctx.core.makeRng(ctx.core.hashSeed('chase-stream:' + ctx.seed));
      const bs = chaseBirds(cr, 36, (r) => [r.range(-50, 10), CUBE_Z - r.range(168, 182)]);
      for (const b of bs) chaseLoop = Math.max(chaseLoop, b.fold + b.climb + 11 + 20);
      for (let i = 0; i < bs.length; i++) bs[i].delay = (i + cr.range(0, 0.7)) * chaseLoop / bs.length;
      chaseStream = makeFlock(style, bs, { ...CHASE_WALL, loop: chaseLoop, top: 48 }); chaseStream.name = 'chase-stream'; hero.object.add(chaseStream);
    }
    // (4) the flock overtaking a last time in the court: up the end wall and out in its arches, most of them in the lit one
    let ctLen = 1; const ctBirds = [];
    for (let i = 0; i < (one ? 1 : nBirds); i++) {
      const near = one || rng.chance(0.7), arch = near ? 7 : rng.pick([5, 9, 4, 10]), sgn = rng.chance(0.5) ? 1 : -1;
      const px0 = WALL_H - (arch + 0.5) * 15 + sgn * rng.range(6.6, 8.2) * (near ? 0.85 : 1), px = one ? -Math.abs(px0) : px0, st = [one ? -16 : px * 0.5 + rng.range(-16, 16), TOP, rng.range(536, 566)];
      const dx = px - st[0], dz = END_Z - 0.3 - st[2], fold = Math.hypot(dx, dz), cl0 = one ? 9 : rng.range(2.5, 9.5);      // (those for the lit arch run in over its sill and go out)
      const b = { start: st, heading: Math.atan2(dx, dz), fold, climb: near ? -11 : cl0, side: -sgn * -1, delay: one ? 0 : rng.range(0, 60), phase: rng.range(0, TAU), size: one ? 16 : rng.range(2.3, 3.0) * 1.5 };
      ctBirds.push(b); ctLen = Math.max(ctLen, fold + b.climb + 11 + b.delay);
    }
    const ctFlock = makeFlock(style, ctBirds, { wallOrigin: [WALL_H, TOP, END_Z - 0.3], wallT: [-1, 0, 0], wallN: [0, 0, -1], cell: [15, 200], arch: [6, 8, 5.7], beat: one ? 0.7 : 2, top: 15.2, ...(one ? GREAT : LONG) });
    ctFlock.name = 'court-flock'; town.add(ctFlock);
    // (5) strays, on loops of their own so no view ever sits still.  They keep near our own line, come out of one black shape
    // and go out in another: over the forecourt into A's arches, up the square from the terrace's shadow into the mass along B,
    // over the last court from the cube's shadow into the end wall's niches.
    const strays = [], strayLen = [];
    const strayFlock = (parent, name, n, wallT, make, big = 2, extra = {}) => {
      const bs = []; let len = 1;
      for (let i = 0; i < n; i++) {
        const [st, tgt, own] = make(i), dx = tgt[0] - st[0], dz = tgt[2] - st[2];
        const d = { start: st, heading: Math.atan2(dx, dz), fold: Math.hypot(dx, dz), climb: -11, side: 0, delay: 0, phase: rng.range(0, TAU), size: rng.range(2.4, 3.0) * big };
        if (extra.climbs) { d.climb = 6 + (rng.range(6, 30) - 6) * 2; d.side = rng.chance(0.5) ? 1 : -1; }      // (up to the third tier of the cube)
        if (own) Object.assign(d, own);
        bs.push(d); len = Math.max(len, d.fold + d.climb + 15);
      }
      const loop = Math.max(len, n * (extra.spacing ?? 4.5)); for (let i = 0; i < n; i++) bs[i].delay = (i + rng.range(0, 0.7)) * loop / n;
      const fl = makeFlock(style, bs, { wallT, wallUp: [0, 0, 0], cell: [1, 1], arch: [0, 0, 0], loop, ...LONG, ...(extra.flock || {}) }); fl.name = name; parent.add(fl); strays.push(fl); strayLen.push(loop);
    };
    const nS = Math.max(8, Math.round(12 * detail));      // fewer and larger, near our own line: five or six in every view
    // (the forecourt's go into A's fourth to eighth arches: clear of the long shadow's tip and of the arch we enter by)
    strayFlock(town, 'strays-forecourt', Math.max(12, Math.round(28 * detail)), [0.93, 0, 0.36], () => { const w = XA.at((rng.int(0, 4) + 3.5) * (XA.R / A.bays), 0, 0.3); return [[rng.range(-9, 30), 0, rng.range(-30, -4)], [w[0], 0, w[2]]]; }, 2.4, { flock: { long: 1.3, near: 0.8 } });
    strayFlock(ramp, 'strays-square', nS, [0.95, 0, -0.3], () => [[rng.range(8, 44), 0, rng.range(3, 30)], [rng.range(45, 58), 0, rl(rng.range(306, 388))]], 2.6, { flock: { long: 1.0 } });
    strayFlock(town, 'strays-court', Math.max(10, Math.round(24 * detail)), [1, 0, 0], () => { const arch = rng.pick([3, 4, 5, 9, 10, 11]); return [[rng.range(-34, 34), TOP, rng.range(532, 540)], [WALL_H - (arch + 0.5) * 15 + rng.range(-3.5, 3.5), TOP, END_Z - 0.5]]; }, 1.9, { flock: { long: 1.2 } });
    strayFlock(hero.object, 'strays-chase', Math.max(20, Math.round(80 * detail)), [1, 0, 0], (i) => { const a = rng.range(-14, 26), z0 = 60 + rng.range(175, 240), pk = rng.pick([1, -1, 1, -1, 3, -3]), o = rng.range(-2.6, 2.6), sd = i % 2 ? 1 : -1, lane = (Math.floor(i / 2) * 5) % 8;
      void a; return [[sd * (11 + lane * 1.7) + 6, 0, z0], [sd * (Math.abs(pk) === 3 || lane > 4 || sd * figPier > 0 ? 36 : 12) + o, 0, 60]]; }, 3.0,
      { climbs: true, spacing: 4.2, flock: { top: 0, long: 1.15, floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallN: [0, 0, 1], wallUp: [0, 1, 0], cell: [24, 24], arch: [8, 12, 7.5] } });      // up the square on our own line and up the cube's piers, out in its arches
    const rampAdd = () => strayFlock(hero.object, 'strays-ramp', Math.max(16, Math.round(42 * detail)), [1, 0, 0], (i) => {
      const port = i % 2 === 0, st = port ? [rng.range(27, 46), 0, rng.range(150, 186)] : [rng.range(-36, -19), 0, rng.range(88, 122)];
      const px = rng.pick(port ? [12, 36, 36, 60] : [-12, -36, -36, -12]) + rng.range(-2.4, 2.4);      // (none crosses our own line: a shadow under the lens is a wedge)
      return [st, [Math.abs(px - figPier) < 4 ? px * 3 : px, 0, 60]]; }, 3.1,
      { climbs: true, spacing: 3.2, flock: { top: 0, long: 1.15, floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallN: [0, 0, 1], wallUp: [0, 1, 0], cell: [24, 24], arch: [8, 12, 7.5] } });
    const crossAdd = () => strayFlock(ramp, 'strays-cross', Math.max(8, Math.round(12 * detail)), [bT.x, 0, bT.z], () => {
      const cellB = XB.R / Bo.bays, run = rng.int(1, 8) * cellB, tgt = toRamp(XB.at(run, 0, 0.35)), sB = XB.sOf(run);
      return [[rng.range(-62, -24), 0, rl(rng.range(178, 226))], tgt, { climb: rng.range(6, 16) * sB, side: rng.chance(0.5) ? 1 : -1 }];
    }, 2.3, { flock: { wallOrigin: bFoot0, wallN: [-bT.z, 0, bT.x], wallUp: [0, cosT, sinT], top: 24, long: 1.0 } });
    // (6) and down the loggia: seen only where they cross a tongue of light
    {
      const bs = []; let len = 1;
      for (let i = 0; i < Math.round(9 * detail); i++) {
        const d = { start: [-24 + rng.range(-2.6, 2.6), 0.1, 166], heading: Math.PI + rng.range(-0.02, 0.02), fold: 108, climb: -11, side: 0, delay: i * 15 + rng.range(0, 10), phase: rng.range(0, TAU), size: rng.range(2.2, 2.7) };
        bs.push(d); len = Math.max(len, d.fold + 4);
      }
      const loop = Math.max(len, bs.length * 15); for (let i = 0; i < bs.length; i++) bs[i].delay = (i + BEAT.loggia) * loop / bs.length;
      const fl = makeFlock(style, bs, { wallUp: [0, 0, 0], cell: [1, 1], arch: [0, 0, 0], loop }); fl.name = 'loggia-strays'; town.add(fl); strays.push(fl); strayLen.push(loop);
    }
    crossAdd();      // (last, so that it draws from the seed after everything else)
    rampAdd();       // (and this after that)
    // (7) in the room: bird shadows cross the boarded floor to the back wall, climb it between the arches and go out in them
    // (they show on the half-dark now that the room is drawn; from outside they are green-black on green-black)
    strayFlock(hero.object, 'room-climbers', Math.max(14, Math.round(40 * detail)), [1, 0, 0], () => [[rng.range(-30, 30), 0.25, rng.range(-25, 35)], [rng.pick([-25.2, -8.4, 8.4, 25.2]) + rng.range(-1.5, 1.5), 0.25, -58]], 2.6,
      { climbs: true, spacing: 4, flock: { long: 1.2, near: 0.85, wallOrigin: [-42, 0.25, -58], wallN: [0, 0, 1], wallUp: [0, 1, 0], cell: [16.8, 16.8], arch: [5.6, 8, 5], top: 80 } });
    // (8) ON THE CUBE'S WHITE FACE only three, each whole: wings spread, as wide as a pier, gliding straight up the middle of a pier
    // from the ramp to the cornice; never on the pier that carries nobody's shadow, never across an arch, never two on one pier
    const faceBirds = [], FACE_LOOP = 190;
    for (const [i, px] of [[0, figPier ? -figPier : 12], [1, 36], [2, -36]]) faceBirds.push({ start: [px, 0, 110], heading: Math.PI, fold: 50, climb: 119, side: 0, delay: (i + BEAT.face[i][1]) * FACE_LOOP / 3, phase: BEAT.face[i][0], size: 7 });      // (one in each third of the round, at a place of its own in it)
    const faceFlock = makeFlock(style, faceBirds, { floorFold: [0, 1, 68, SLOPE], wallOrigin: [-60, 0, 60], wallT: [1, 0, 0], wallN: [0, 0, 1], cell: [24, 24], arch: [8, 12, 7.5], loop: FACE_LOOP, top: 116, beat: 1.1, foldK: 0.12, tipK: 0.05, long: 1, near: 1 });
    faceFlock.name = 'face-birds'; hero.object.add(faceFlock);
    await ctx.yield();

    // ---- the one lit arch: flat Naples yellow until, from inside the black room, a ruled edge crosses it and it opens ----
    const coverU = { uC: U.uYellow, uOpen: { value: 0 } };
    {
      const sh2 = new THREE.Shape(); sh2.moveTo(-9.3, -0.2); sh2.lineTo(9.3, -0.2); sh2.lineTo(9.3, PAV.jamb); sh2.absellipse(0, PAV.jamb, 9.3, 9.2, 0, Math.PI, false, 0); sh2.lineTo(-9.3, -0.2);
      const cover = new THREE.Mesh(new THREE.ShapeGeometry(sh2, 24), new THREE.ShaderMaterial({
        uniforms: coverU, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uC; uniform float uOpen; varying vec2 vP; void main(){ if (vP.y + .45 * vP.x < -4.8 + 36. * uOpen) discard; gl_FragColor = vec4(uC, 1.); }',
      }));
      cover.position.set(0, TOP, END_Z - 0.12); cover.rotation.y = Math.PI; cover.name = 'lit-arch'; town.add(cover);
    }

    // ---- THE FLIGHT ------------------------------------------------------------------------------------------------
    const cubeLook = new THREE.Vector3(0, TOP + 50, 411), figLook = new THREE.Vector3(0, 24, 390), portLook = new THREE.Vector3(62, 24, 400), outLook = new THREE.Vector3();
    // THE GAZE.  Every window is a place on the course (metres flown, atM) and every target is worked out inside its own function.
    const pois = [
      // 67.4 to 144.5 m (z 81 to z 157, the length of the loggia past its third arch): we look out through its arches at the
      // terrace, the parapet and the cube; the target flies the route abeam of the lens
      { at: (time, u) => path.pointAt(u, outLook).add(OUT), from: atM(67.4), to: atM(144.5), weight: 0.5 },
      // 144.5 to 199.1 m (z 157, the end arch, to z 211 over the drop): the cube's face
      { at: () => cubeLook, from: atM(144.5), to: atM(199.1), weight: 0.35 },
      // 186.3 to 247.3 m (z 199 to z 253, the run down to nobody's shadow): the gaze stays up the square, the cube over it
      { at: () => figLook, from: atM(186.3), to: atM(247.3), weight: 0.6 },
      // 298.6 to 369.3 m (z 302 to z 365, the swing back to port under the cube): across to the port arcade, whose face plunges away
      { at: () => portLook, from: atM(298.6), to: atM(369.3), weight: 0.5 },
      // in the room the gaze lifts to the rows of arches of sky: first toward the port corner (420.7 to 481.7 m, z 414 to z 473),
      // then over the back arch (481.7 to 533.1 m, z 473 to z 522)
      { at: () => roomLookA, from: atM(420.7), to: atM(481.7), weight: 0.14 }, { at: () => roomLookB, from: atM(481.7), to: atM(533.1), weight: 0.17 }];
    const OUT = new THREE.Vector3(-160, 0, 100), roomLookA = new THREE.Vector3(46, 60, 524), roomLookB = new THREE.Vector3(-10, 58, 531);
    // THE PACE, by places (m = metres flown): faster from z 51 to z 79 (the swing into the loggia), slower from z 153 to z 187 (out
    // of the end arch and over the drop: the linger), faster from z 392 to z 431 (the ramp's top and the break-through), slower
    // from z 516 to z 548 (the back arch and into the court), a little faster from z 567 to z 612 (the run to the sill)
    const pace = (ur) => { const m = ur * PL; return 1.1 + 0.15 * sstep(31.7, 63.8, m) - 0.45 * sstep(140.6, 174.8, m) + 0.6 * sstep(397.6, 437.3, m) - 0.6 * sstep(527.0, 559.0, m) + 0.2 * sstep(578.2, 623.0, m); };
    // "the hour agrees" (rare): at u 0.5 every shadow in the town swings round to one sun, holds a tenth of the path, and they part
    const agreeAng = AGREE_ANG, agreeSun = new THREE.Vector3(-Math.sin(agreeAng) * 0.8, 0.6, -Math.cos(agreeAng) * 0.8);
    U.uSunAll.value.copy(agreeSun); U.uAgreeAng.value = agreeAng; heroShadowMat.uniforms.uAgreeAng.value = cubeShMat.uniforms.uAgreeAng.value = agreeAng + Math.PI;
    const heroMasonry = style.masonryMaterial({ course: [1.0, 2.6] });
    heroMasonry.uniforms.uSunAll = { value: new THREE.Vector3(-agreeSun.x, agreeSun.y, -agreeSun.z) };
    hero.object.traverse((o) => { if (o.name === 'cube') o.material = heroMasonry; });
    // (the 36 run up the cube's white piers and go out in its black arches, as the brief has them: they were cut at the cube's foot.
    // Nothing of them is cast above the two lower tiers, 48 m)
    if (hero.flock) { hero.flock.material.uniforms.uLong.value = 1.4; hero.flock.material.uniforms.uNear.value = 0.9; hero.flock.material.uniforms.uTop.value = 48; }
    // THE GREAT SHADOW'S RUN (the edition with one shadow 30 m across): a law of the place, no table of moments.
    // Its speed is a function of where IT is (the law above, in the flock's own shader: PACE_K).  It leaves its start when the
    // lens comes abeam of the plinth (the course's metre at the plinth's z).  From there on what moves it is the journey: the
    // metres a thing at 40 m/s covers while the lens flies on at its own speed (the course's length over the duration, times
    // the pace there), summed once here at half-metre steps.  So where it lies under us follows from the two speeds, its own
    // where it is and the lens's where we are; held at a place it holds.  The strays that follow it run by the same.
    // THE COURT ON THE COURSE: the route metres at the cube's back arch (z 531) and at the sill of the lit arch (z 631)
    const COURT = [mAt(CUBE_Z + 60), mAt(END_Z)];
    // THE LOGGIA ON THE COURSE: the route metres abeam of arcade A's first arch and of its last (XA runs from z 58 to z 161)
    const LOGGIA = [mAt(58), mAt(161)];
    // THE SQUARE ON THE COURSE: the route metres at the parapet (z 163, the terrace's edge) and at the top of the ramp (z 403)
    const SQUARE = [mAt(163), mAt(403)];
    // THE ROOM ON THE COURSE: the route metres at the cube's front face (z 411) and at its back face (z 531)
    const ROOM = [mAt(CUBE_Z - 60), mAt(CUBE_Z + 60)];
    // THE PLINTH ON THE COURSE: the route metre abeam of the empty plinth (z 264), at the feet of nobody's shadow
    const PLINTH_M = mAt(plinth[1]);
    const lensSpeed = (() => { let inv = 0; for (let i = 0; i < 256; i++) inv += 1 / pace((i + 0.5) / 256); return (m) => PL / DURATION * pace(m / PL) * inv / 256; })();
    let greatM0 = PL, greatRun = null;
    if (great) {
      let lo = 0, hi = PL; for (let i = 0; i < 24; i++) { const mid = (lo + hi) * 0.5; if (path.posAtDist(mid, lens).z < plinth[1]) lo = mid; else hi = mid; }
      greatM0 = (lo + hi) * 0.5;
      const n = Math.ceil((PL - greatM0) * 2) + 1;
      greatRun = new Float32Array(n);
      for (let i = 1; i < n; i++) greatRun[i] = greatRun[i - 1] + 40 / lensSpeed(greatM0 + (i - 0.5) * 0.5) * 0.5;
    }
    const greatAt = (m) => { if (m < greatM0) return -1; const x = Math.min((m - greatM0) * 2, greatRun.length - 1.001), i = Math.floor(x); return greatRun[i] + (greatRun[i + 1] - greatRun[i]) * (x - i); };

    return {
      scene, path, duration: DURATION, pace, pois,
      camera: { fov: 62, near: 0.3, far: 4200, bank: 0, sway: 0 },      // verticals are always plumb: no banking, no drift
      portal: { shape: 'arch', width: 18, height: 24, color: '#E9C75A', frame: 0, revealDistance: 420, blendDistance: 25 },
      post: POST, ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, ur) {
        const m = ur * PL;      // metres flown: every key below is a place on the course
        path.posAtDist(m, lens);      // where the lens is on the route (the course itself, never the camera's matrix)
        // THE MEDIUM: time moves, and the hour is the journey.  Every shadow and tongue creeps ONE WAY by its hour, and every hour
        // is a function of the metres flown and of nothing else (never of the world's clock): held at a place the shadows hold,
        // flown again they creep again, and none ever runs back.  Each place has a clock of its own, which runs while we are
        // there, counted between two THINGS of the place as the course meets them: the forecourt from the course's start to the
        // loggia's first arch, the loggia from its first arch to its last, the square from the parapet to the top of the ramp, the
        // black room from its front face to its back face (and a tenth of an hour before it, from the course's start to that front
        // face), the court (from 514.2 m, z 504).  Each starts from an hour of its own, drawn once (CLOCK, above), so the hour is
        // wrong differently in every place and on every seed.
        const hour = CLOCK.town + 0.45 * sstep(25.3, 154.0, m) + 0.1 * sstep(154.0, 514.2, m) + 0.45 * sstep(514.2, PL, m);
        hero.setProgress(ur, hour);
        const squareRun = sstep(SQUARE[0], SQUARE[1], m);      // the square's hour, from the parapet to the top of the ramp
        foreMat.hour.value = CLOCK.fore + sstep(0, LOGGIA[0], m);      // (the forecourt's hour: from the course's start to the loggia's first arch)
        squareMat.hour.value = CLOCK.square + squareRun;
        cubeShMat.hour.value = CLOCK.cube + squareRun;      // (the cube's own hour: it starts apart from the square's; its shadow shortens)
        loggiaMat.hour.value = CLOCK.loggia + sstep(LOGGIA[0], LOGGIA[1], m);      // the light comes down the loggia as we do: one hour of creep over the loggia's own length, from its first arch to its last
        roomHour.value = Math.min(Math.max(CLOCK.room + 0.1 * sstep(0, ROOM[0], m) + 0.44 * sstep(ROOM[0], ROOM[1], m), 0), 1);      // (the tongues are cut to the room for hours 0 to 1)
        // the pair lean together and apart once over the court's own length (from the cube's back arch to the sill, as the course
        // meets them), from a lean of their own
        pairMat.hour.value = 0.5 + 0.5 * Math.sin(CLOCK.pair + (m - COURT[0]) * TAU / (COURT[1] - COURT[0]));
        // NOBODY'S SHADOW lies its full length along our course and creeps as every shadow does: 8 percent longer for an hour of
        // the square's clock, and it swings 5 degrees about the plinth's foot, one way, while we cross the square; when the hour
        // agrees (rare: from 293.2 to 314.1 m, z 297 to z 316, the turn under the cube, until 383.7 to 404.5 m, the ramp's top)
        // it is turned whole to the agreed sun.
        const agree = V.rare ? sstep(293.2, 314.1, m) * (1 - sstep(383.7, 404.5, m)) : 0;
        const figLen = 1 + 0.08 * squareMat.hour.value;
        figure.scale.set(1, 1, figLen);
        figure.rotation.y = 0.09 * (CLOCK.figure + squareRun - 0.5) * (1 - agree) + (agreeAng - FIG_ANG) * agree;
        // THE ARM LOWERS EVENLY ON THE WAY DOWN TO THE SHADOW AND ALONG IT: its hour is an even ramp of the metres flown between two
        // things on the course, 0 (raised) at the parapet, where the square and the figure come into view, 1 (hanging) abeam of the
        // plinth at the figure's feet.  So the lowering begins in view, ahead of us, and is done as we pass the plinth (the brief:
        // "the figure's shadow, whose raised arm lowers by u 0.5").  It reads the metres flown and nothing else.
        figMat.hour.value = Math.min(Math.max((m - SQUARE[0]) / (PLINTH_M - SQUARE[0]), 0), 1);
        hero.update(dt, time, camera);
        // (the eye takes a moment in the dark: over the first metres inside, from the front face at z 405 to z 424, green-black
        // opens into the half-dark and its drawing; from outside, and once we are out by the back arch at z 533, every interior
        // stays solid green-black)
        const inCube = lens.z < 533 ? sstep(405, 424, lens.z) : 0;
        heroMasonry.uniforms.uDeep.value.copy(style.ink).lerp(style.deep, inCube);
        // the pair fly the route: their feet keep 19 m ahead of the lens along the court's straight (from z 543 on) until the sill
        pairShadows.position.z = Math.min(Math.max(lens.z + 19 - 562, 0), 39);
        sky.follow(camera);
        U.uAgree.value = agree;
        // the fauna, keyed to places: the lone bird (it starts down the pier when the lens has flown 41.3 m, at z 60, and slides
        // 7 m while we fly 28.8), the flock over the square (from 108.6 m, z 121 in the loggia, to 268.8 m, z 273 past the plinth)
        lone.setRun(Math.max(0, (m - 41.3) / 28.8) * 7);
        sqFlock.setRun(m < 108.6 ? -1 : (m - 108.6) / 160.2 * sqLen);      // (already mid-square as we come out of the end arch)
        // (the one great bird leaves its start as we pass the plinth, overtakes beside us and draws ahead up the ramp by the law above)
        // (the birds: a stream that never stops, up the square on our own line and up the cube's piers, from the reveal on; it runs
        // with the clock alone, at the brief's 40 m/s; the great shadow keeps its own law, greatAt)
        const stream = time * 40, chase = one ? greatAt(m) : stream;
        if (one) { chaseOne.setRun(chase); greatStrays.setRun(chase); } else { hero.setFlock(chase); chaseStream.setRun(time * 40); }
        nearFlock.setRun(stream);
        faceFlock.setRun(time * 24);      // (the three gliders on the cube's face: on the clock alone, at their own 24 m/s)
        // the last overtaking: from 514.2 m (z 504, in the room) over 64 m of flight for the one great shadow; from 536.6 m (z 526,
        // the back arch) over 96.1 m for the flock
        ctFlock.setRun(one ? (m < 514.2 ? -1 : (m - 514.2) / 64.0 * ctLen) : m < 536.6 ? -1 : (m - 536.6) / 96.1 * ctLen);
        for (let i = 0; i < strays.length; i++) strays[i].setRun((time * 40) % strayLen[i]);
        coverU.uOpen.value = sstep(450.1, 498.2, m);      // the lit arch opens while we cross the room, from z 443 to z 489
      },
      dispose() { heroShadowMat.dispose(); heroMasonry.dispose(); hero.dispose(); },
    };
  },
};
