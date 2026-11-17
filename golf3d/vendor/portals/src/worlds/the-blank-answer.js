// the-blank-answer: a city at night built of boards of coloured cells. Every wall of every block is a board, a
// question or its answer, and the rule of each is seen being found. We come in high over a street of pairs and fly
// it above one long game board on which a small game nobody explains is played ahead of us; an arch across the
// street opens as we come; beyond it a stepped pyramid lights its windows tier after tier; we fly an avenue of houses
// along its flank, climb round its back and come to the gate on its summit from behind: the great frame of the last
// board is the way out. An in-joke of a well known test of machines; a world first. See
// src/parts/the-blank-answer.js for the boards, the rules that make them, the ten colours and how a board is drawn.
// post.flat: the colours written are the colours shown, under the engine's own soft glow (post.bloom), which lifts
// the lit cells off the dark.
//
// THE FORMAT ONLY: flat colours on black, thin joints. Every board, rule and game is made by rule from the visit's
// seed; none is a task, a level or a game of any published set. No lettering stands anywhere: no letter, no digit, no
// pixel lettering, no logo, no name, no sign. Never ten squares in a row of five by two: no board is laid five cells
// by two or two by five, and no board of the city shows more than seven hues at one time (the track shows eight).
//
// Handedness: travelling +Z the viewer's LEFT is +X. The floor is y 0, black glass; the front of what stands on it
// (and a nearer block's ends) has a double under it (the part's `doubled`) and lays its light on the glass before it
// (the part's `spill`). The pyramid's upper
// tiers and the summit gate stand on the pyramid, not on the glass, and have no double: NO DOUBLE OF THE WAY OUT is
// drawn anywhere. The night is shades of one blue-black, none a cell's hue: the zenith (ZENITH), the air a far thing
// sinks into (AIR), the glow where the glass meets the sky (HAZE), the dark of a shaded face (SHADE).
//
// THE UNIT OF EVERY EVENT IS THE ROUTE METRE: s, the metres of route the eye has flown (update writes s = u x L, u being
// the share of the route's own length). WHAT FILLS AS WE COME IS KEYED TO THE METRES FLOWN: a board by place is as far
// solved as the place the eye stands at says, at any pace. Every such law is typed below where its thing is built and
// is the same on every seed. sOfZ(z) is the metres of route at which the eye FIRST passes z: the course runs on in +Z
// as far as the pyramid's back and there turns back, and every place sOfZ is asked for lies on the way out to there.
// sTurn is the metre of route of that turn (where the course's z is greatest): what happens after it is keyed to the
// metres flown past it. NO LAW OF THE WORLD READS THE METRES OF ROUTE STILL TO FLY.
// Nothing is begun, ended, moved, lit, faded or hidden by a typed time, a share of the flight, a seed or the lens.
// What runs on the place's own clock would run the same with no visitor and reads at every phase: a wave has no
// beginning, and a board's share of it (its phase) is dealt with the board or read from where it stands. Within a
// law's span the order in which a board's cells turn is the board's own, dealt with its cells. A look's fade is a
// share of its own span, which is given in route metres.
// THE PLACES AND THE LAWS, where each is typed:
//   the course       COURSE: in high from the left over the street, down along it above the track, through the
//                    arch, left across the square round the pyramid's front corner, along the avenue on its flank,
//                    up and round its back to the right, and back over its summit into the gate from behind
//   the track        TRACK: one game board, 48 cells by 222, on the floor. BY PLACE: the mover's move number is
//                    (s - sGame) / per; sGame is where the eye passes z = GAME_FROM and the last move lands on the goal
//                    when the eye is GAME_AHEAD metres of route short of passing it. The mover is stopped by a bar,
//                    goes back, finds the plate that opens it, five times; a strip along the far edge drains as moves
//                    are spent; at the goal the board turns into its next arrangement over WIN_SPAN metres of route.
//                    BY THE CLOCK: running lights, four rows in every forty of wall cells turned to another hue,
//                    travel up the track.
//   the street       STREET: four pairs of blocks, the question to the left and its answer to the right; an answer
//                    is found BY PLACE from PAIR_LEAD metres of route short of its pair's middle to PAIR_DONE short
//   THE BLANK        the summit gate's front board, seen over the street from the first metre: pale and lit, its great
//                    frame full of lamps at every metre. BY PLACE its carpet takes its colours, from BLANK.from metres
//                    of route flown to BLANK.short metres short of the arch (in the part: laySummit, fillBlank)
//   the arch         WALL: a gatehouse across the street; BY PLACE from WALL_LEAD to WALL_DONE metres short of it what
//                    its closed frames hold is opened, the great frame's inside first: that is the gate we fly through
//   the pyramid      PYR, TIER: four tiers; BY PLACE the frames of a tier's front are opened to lamps behind, tier
//                    after tier, from TIER.lead metres short of the arch, each TIER.step later, over TIER.span
//   the avenue       AVENUE: two rows of houses; BY PLACE a house's windows are opened to lamps behind from
//                    AVENUE.lead metres of route short of its middle, over AVENUE.span
//   the summit gate  GATE: the last board, seen from behind the pyramid; BY PLACE its small frames are opened from
//                    GATE.past metres of route past the turn, over GATE.span. The great frame's inside is open
//                    AT EVERY METRE: it is the way out (the engine's own opening lies GATE.sink metres inside it)
//   the gaze         pois, BY PLACE (their shares of the route are worked out from route metres): toward the game's
//                    mover along the street; held on the pyramid across the square; the course's own along the
//                    avenue; held on the pyramid again from 220 m short of the avenue's end, and carried to the way out round
//                    the turn (GAZE, in metres of route past it)
//   the pace         by the route metre: eased over 250 m past the arch, a little quicker on the last run (QUICK)
//   by the CLOCK     the towers (TOWER_WAVE); the second rows, every stage and pylon and the town's windows
//                    (ROW2.wave); the lamps behind opened frames, which change places (LAMP_WAVE); the far plain
//                    (PLAIN_WAVE); the track's running lights; the stars and the two moons
// CLEAR AIR BY PLACE: every face of every block (the arch beside its gate, the last board beside the way out) is
// counted at the build against the whole course at half a metre (marks.clear: the least, in metres); what lies on the
// floor lies more than 40 m under the lens at every place.
// NAMED AT THE HEAD (section 153): a filter by a pixel's footprint (the boards', the track's and the floor's joints,
// the mean of a far board; see the part); a board's back, drawn dark (which side of it the eye stands on); the air,
// which sinks a far thing toward AIR by its distance from the eye; the far glow, which is read from the direction of
// sight alone (how far it looks from level). `calm` is a typed dimming of a kind of thing (the town, the pyramid's
// carpets, the avenue's walls, the first block of each second row), the same at every metre and on every seed.
// portal.revealDistance is the engine's own law, by the metres of route still to fly: the next place shows in the
// opening over the last 1500 m; the world itself brings nothing on and takes nothing off by the metres still to fly.
// THE VISIT'S DEAL (ctx.vary) says WHAT stands, never when a thing begins: density, how much of the far plain is laid
// with fields; rare, one more tower. The city has no hour.

import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeBoards, laySummit, quilt, PALETTE, FAR_DARK, HOLE, LAST } from '../parts/the-blank-answer.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rad = (d) => d * Math.PI / 180;

// ---- the places
const COURSE = [[112, 118, -110], [98, 112, -50], [82, 104, 8], [64, 94, 62], [44, 84, 115], [22, 74, 168], [2, 65, 222], [-14, 58, 280], [-24, 53, 340], [-24, 49, 402], [-17, 46, 462], [-8, 44.5, 515], [0, 43, 560], [8, 45, 610],
  [65, 48, 690], [185, 60, 755], [320, 84, 820], [430, 84, 885], [495, 66, 955], [520, 56, 1040], [520, 55, 1130], [520, 55, 1220], [520, 57, 1310], [512, 68, 1392], [485, 98, 1470], [435, 142, 1550], [360, 192, 1630],
  [270, 240, 1695], [170, 276, 1730], [75, 293, 1712], [18, 298, 1655], [0, 297, 1580], [0, 295.5, 1480], [0, 294.4, 1380], [0, 294.4, 1300], [0, 294.4, 1250]];
const TRACK = { z0: 212, cell: 3, w: 48, n: 222, left: 72, bars: 5 }, GAME_FROM = 100, GAME_AHEAD = 40, WIN_SPAN = 25;
const STREET = { z0: 196, step: 86, n: 4, x: 102, cells: 11, cell: 7.6, deep: 56 };
const ROW2 = { x: 190, deep: 90, cells: 11, cell: 10, step: 150, z0: 0, z1: 600, wave: 24 }, TOWN = { step: 150, x: 1500, z0: 720, z1: 2400, clear: 700, zc: 1560, low: 600, zl: 1880, mid: [0, 1150] };
// THE AVENUE along the pyramid's flank: two rows of houses face to face, the taller on the outer side; the course runs between them
const AVENUE = { x: 520, half: 75, cell: 6.4, outer: { z0: 930, step: 122, n: 4, w: 16, deep: 60, rows: [14, 24] }, inner: { z0: 955, step: 118, n: 3, w: 12, deep: 50, rows: [8, 13] }, lead: 300, span: 180, calm: 0.8, end: 1420 };
// the pylons of the square before the pyramid: the middle of each one's front (x, z), its side and its height in metres
const PYLONS = [[-86, 845, 22, 120], [86, 845, 22, 120]];
const PAIR_LEAD = 170, PAIR_DONE = 0;
const WALL = { z: 560, cols: 51, rows: 26, cell: 4, door: [13, 0, 25, 21], deep: 40 }, WALL_LEAD = 260, WALL_DONE = 120;     // the gate: the great frame's inside, twenty-five cells wide and twenty-one tall, from the floor
// the pyramid: four tiers, each PYR.rows cells of PYR.cell metres tall; a tier's front PYR.step metres behind the one below
const PYR = { z: 900, cell: 6.4, rows: 10, cols: [88, 72, 56, 40], step: 90, back: 1400, backStep: 40, coarse: 12.8 }, TIER = { lead: 80, step: 60, span: 220 };
// the summit gate: the middle of the way out's frame in its back board (which looks along +Z); the way out itself lies
// GATE.sink metres inside it; the course comes to it from behind the pyramid, heading back toward the street
const GATE = { x: 0, y: 294.4, z: 1280, sink: 30, past: 156, span: 260 }, END = V(0, 294.4, 1250), BLANK = { from: 60, short: 40 }, LOOK = [0, 200, 1200];
// past the turn behind the pyramid (sTurn), in metres of route: where the gaze is carried from the pyramid to the way out and held till; where the pace quickens
const GAZE = { from: -144, to: 176, end: 356 }, QUICK = [376, 496];
const STARS = { n: 800, r: 3500 }, LAMP_WAVE = 14, LAMP = { back: 2, far: 3 };   // LAMP: metres a lamp field stands behind its face (far: in the town), deep enough for the depth buffer at that distance
// the towers: where each stands (x, z), its side in metres and how far it is turned to the course (degrees)
const TOWERS = [[-560, 330, 280, 68], [560, 330, 280, 68], [-900, 860, 280, 55], [900, 860, 280, 55], [-700, 1500, 280, 80], [700, 1500, 280, 80], [600, 1790, 240, 0]], TOWER_RARE = [-1250, 300, 280, 60], TOWER_WAVE = 36;
const PLAIN = { side: 30, gap: 3, plotX: 72, plotZ: 40, x: 1500, z0: -760, z1: 1900 }, PLAIN_WAVE = 40;
const WRITTEN_FULL = ['turn', 'mend', 'rings', 'turn', 'mend', 'stripe'];       // the rules whose boards are written full or nearly
const LIT = ['turn', 'mend'];                                             // the rules whose question is written full too: a board of these is lit at every phase
const AIR = '#1E2760', HAZE = '#3A46A0', SHADE = '#0B0E1C', ZENITH = '#060814';

// ---- the wall's own task: a carpet for its face and, set in it, closed frames, each holding a jumble; the rule: what
// a closed frame holds is opened. The great frame stands on the floor (the glass closes it): its inside is the gate;
// the others stand in mirrored twos, left and right of it.
function wallTask(r) {
  const w = WALL.cols, h = WALL.rows, n = w * h, pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]; r.shuffle(pool); const fc = pool[0], J = [pool[1], pool[2]];
  const before = quilt(r, w, h, pool.slice(3, 6), 0.3), after = before.slice(), ord = new Float32Array(n), frames = [WALL.door.slice()];
  for (let tries = 0; tries < 300 && frames.length < 9; tries++) { const k = r.int(2, 3), x = r.int(2, Math.floor(w / 2) - k - 3), y = r.int(2, h - k - 3);
    if (frames.some(([fx, fy, fw, fh]) => x < fx + fw + 3 && fx < x + k + 3 && y < fy + fh + 3 && fy < y + k + 3)) continue; frames.push([x, y, k, k], [w - x - k, y, k, k]); }
  frames.forEach(([x, y, kw, kh], f) => { const mx = x + (kw - 1) / 2, my = y + (kh - 1) / 2, far = Math.hypot(kw, kh) / 2 + 0.01;
    for (let Y = y - 2; Y <= y + kh + 1; Y++) for (let X = x - 2; X <= x + kw + 1; X++) { if (X < 0 || X >= w || Y < 0 || Y >= h) continue; const q = Y * w + X;
      if (X < x - 1 || X > x + kw || Y < y - 1 || Y > y + kh) { before[q] = 0; after[q] = 0; continue; }                   // a blank cell round the frame
      if (X === x - 1 || X === x + kw || Y === y - 1 || Y === y + kh) { before[q] = fc; after[q] = fc; continue; }
      before[q] = r() < 0.85 ? J[r.int(0, 1)] : 0; after[q] = HOLE;
      const dd = Math.hypot(X - mx, Y - my) / far; ord[q] = f === 0 ? 0.04 + 0.6 * dd : 0.5 + 0.045 * f + 0.08 * dd; } });
  return { before, after, ord };
}

// ---- A FACE OF WINDOWS: a carpet in broad bands and, set in it in rows, closed frames each holding a jumble; found, each
// frame's inside is opened (HOLE) to what stands lit behind it, row after row from the foot. k: a frame's inner side
// in cells; pitch: cells from frame to frame.
function windowTask(r, w, h, fc, J, k = 3, pitch = 7) {
  const pool = [1, 2, 3, 6, 9].filter((c) => c !== fc && c !== J[0] && c !== J[1]); r.shuffle(pool);
  const before = quilt(r, w, h, pool.slice(0, 2), 0.3, 3), after = before.slice(), ord = new Float32Array(w * h), o = k + 2;
  const fit = (n) => Math.max(0, Math.floor((n - (n >= o + 2 ? 2 : 0) - o) / pitch) + 1), nx = fit(w), ny = fit(h), x0 = Math.floor((w - (nx - 1) * pitch - o) / 2), y0 = Math.floor((h - (ny - 1) * pitch - o) / 2);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * pitch, y = y0 + j * pitch, turn = 0.05 + 0.8 * (j + (i + 0.5) / nx) / ny;
    for (let Y = y; Y < y + o; Y++) for (let X = x; X < x + o; X++) { const q = Y * w + X;
      if (X === x || X === x + o - 1 || Y === y || Y === y + o - 1) { before[q] = fc; after[q] = fc; continue; }
      before[q] = r() < 0.85 ? J[r.int(0, 1)] : 0; after[q] = HOLE; ord[q] = turn; } }
  return { before, after, ord };
}
// ---- a tier's task: a carpet for the tier's face and, set in it in mirrored twos, closed frames (hue fc), each
// holding a jumble (the two hues J); the rule, the last board's own: what a closed frame holds is opened. The order
// in which it is found: from the tier's middle outward to its two ends.
function tierTask(r, w, h, fc, J) {
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => c !== fc && c !== J[0] && c !== J[1]); r.shuffle(pool);
  const before = quilt(r, w, h, pool.slice(0, 3), 0.25, 2), after = before.slice(), ord = new Float32Array(w * h), frames = [];
  for (let tries = 0; tries < 200 && frames.length < Math.round(w / 9); tries++) { const k = r.int(3, 4), x = r.int(2, Math.max(2, Math.floor(w / 2) - k - 3)), y = r.int(2, h - k - 2);
    if (frames.some(([fx, fy, fk]) => x < fx + fk + 3 && fx < x + k + 3)) continue; frames.push([x, y, k], [w - x - k, y, k]); }
  frames.forEach(([x, y, k]) => { const mx = x + (k - 1) / 2, my = y + (k - 1) / 2, far = Math.hypot(k, k) / 2 + 0.01, lead = 0.75 * Math.abs(mx - (w - 1) / 2) / (w / 2);
    for (let Y = y - 2; Y <= y + k + 1; Y++) for (let X = x - 2; X <= x + k + 1; X++) { if (X < 0 || X >= w || Y < 0 || Y >= h) continue; const q = Y * w + X;
      if (X < x - 1 || X > x + k || Y < y - 1 || Y > y + k) { before[q] = 0; after[q] = 0; continue; }
      if (X === x - 1 || X === x + k || Y === y - 1 || Y === y + k) { before[q] = fc; after[q] = fc; continue; }
      before[q] = r() < 0.85 ? J[r.int(0, 1)] : 0; after[q] = HOLE; ord[q] = 0.04 + lead + 0.14 * Math.hypot(X - mx, Y - my) / far; } });
  return { before, after, ord };
}

// ---- one arrangement of the track: a corridor up the board crossed by `nd` bars, each bar's plate in a room to one
// side; codes: 0 floor, 1 wall, 2+k bar k, 7+k plate k, 12 the goal. With `play` the mover's whole game is worked out:
// every move's place (a 2 by 2 block's low corner), which moves are a bump at a bar, and at which move each bar opens.
function arrangement(r, nd, play) {
  const W = TRACK.w, N = TRACK.n, code = new Uint8Array(W * N), set = (x, z, c) => { if (x >= 0 && x < W && z >= 0 && z < N) code[z * W + x] = c; };
  const cx = play ? 22 : r.int(12, 32), path = [], bump = [], openAt = [];
  for (let z = 1; z <= N - 2; z++) { set(cx - 1, z, 1); set(cx + 4, z, 1); }
  for (let x = cx - 1; x <= cx + 4; x++) { set(x, 1, 1); set(x, N - 2, 1); }
  let px = cx + 1, pz = 4, last = r() < 0.5 ? -1 : 1;
  const push = (b) => { path.push(px, pz); bump.push(b); }; push(0);
  const walk = (tx, tz) => { while (px !== tx) { px += Math.sign(tx - px); push(0); } while (pz !== tz) { pz += Math.sign(tz - pz); push(0); } };
  for (let k = 0; k < nd; k++) {
    const dz = Math.round(10 + (k + 1) * (N - 30) / (nd + 0.5)) + r.int(-2, 2), sd = k % 2 ? -last : (r() < 0.5 ? -1 : 1), oz = dz - 7, rx0 = sd < 0 ? cx - 9 : cx + 5, plate = sd < 0 ? cx - 6 : cx + 8; last = sd;
    for (let x = cx; x < cx + 4; x++) set(x, dz, 2 + k);
    for (let x = rx0 - 1; x <= rx0 + 8; x++) { set(x, oz - 3, 1); set(x, oz + 4, 1); }
    for (let z = oz - 3; z <= oz + 4; z++) set(sd < 0 ? rx0 - 1 : rx0 + 8, z, 1);
    set(sd < 0 ? cx - 1 : cx + 4, oz, 0); set(sd < 0 ? cx - 1 : cx + 4, oz + 1, 0);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) set(plate + i, oz + j, 7 + k);
    if (play) { walk(cx + 1, dz - 2); push(1); walk(cx + 1, oz); walk(plate, oz); openAt.push(path.length / 2 - 1); walk(cx + 1, oz); }
  }
  const goal = [cx + 1, N - 12]; if (play) walk(goal[0], goal[1]);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) set(goal[0] + i, goal[1] + j, 12);
  // the rest of the board: walls of the same stone, most of them along the track, clear of the corridor and its rooms
  // and their twins mirrored across the board's long middle line
  const lay = (X, Z) => { if (X > cx - 12 && X < cx + 15) return; if (X > 0 && X < W - 1 && Z < N - 2) set(X, Z, 1); };
  for (let k = 0; k < 300; k++) { const x = r.int(1, W / 2 - 1), z = r.int(1, N - 3), along = r() < 0.85, len = r.int(3, along ? 18 : 5);
    for (let i = 0; i < len; i++) { const X = along ? x : x + i, Z = along ? z + i : z; lay(X, Z); lay(W - 1 - X, Z); } }
  return { code, path, bump, openAt, goal };
}

// a plane of thin joints (the floor's), drawn by the pixel's footprint; far off, their mean
function jointPlane(y, step, gain, uJoint, air) {
  const g = new THREE.PlaneGeometry(9000, 9000); g.rotateX(-Math.PI / 2); g.translate(0, y, 500);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uJoint, uAir: { value: air }, uGain: { value: gain }, uStep: { value: step } }, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uJoint; uniform float uAir; uniform float uGain; uniform float uStep; varying vec3 vW;
      void main(){ vec2 g = vW.xz / uStep; vec2 fw = max(fwidth(g), vec2(1e-4)); vec2 d = abs(fract(g - .5) - .5);
        vec2 l = 1. - smoothstep(vec2(.012) - fw * .5, vec2(.012) + fw * .5, d);
        float a = mix(max(l.x, l.y), .05, smoothstep(.12, .6, max(fw.x, fw.y)));
        gl_FragColor = vec4(uJoint * 1.5, a * uGain * exp(-length(vW - cameraPosition) * uAir)); }` }));
  m.frustumCulled = false; m.renderOrder = 2; return m;
}

export default {
  id: 'the-blank-answer',
  name: 'Three Examples and a Blank',
  category: 'bizarre',
  weirdness: 0.8,
  media: ['air', 'open'],
  async build(ctx) {
    const core = ctx.core, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const stream = (name) => core.makeRng(core.hashSeed('the-blank-answer:' + name + ':' + ctx.seed));
    const scene = new THREE.Scene(); scene.background = new THREE.Color(FAR_DARK);
    const path = makePath(COURSE), L = path.length;
    // the metres of route at which the eye passes a place of the course (the course runs on in +Z)
    const sOfZ = (() => { const N = 1800, zs = []; for (let i = 0; i <= N; i++) zs.push(path.pointAt(i / N).z); return (z) => { let i = 0; while (i < N && zs[i + 1] < z) i++; const f = zs[i + 1] > zs[i] ? (z - zs[i]) / (zs[i + 1] - zs[i]) : 0; return Math.min(L, Math.max(0, (i + Math.min(1, Math.max(0, f))) / N * L)); }; })();
    // the metres of route at which the course turns back behind the pyramid: where its z is greatest
    const sTurn = (() => { const N = 6000; let b = 0, zb = -1e9; for (let i = 0; i <= N; i++) { const z = path.pointAt(i / N).z; if (z > zb) { zb = z; b = i; } } return b / N * L; })();
    const density = Math.min(1.3, Math.max(0.7, ctx.vary?.density ?? 1)), rare = !!ctx.vary?.rare;
    const sys = makeBoards({ far: AIR, air: 0.0009, shade: SHADE }), bodies = [];
    // calm: how bright what is laid next stands (1 a board's full face; the town and the pyramid's carpets stand calmer,
    // so that what is lit behind opened frames and the summit gate are the brightest things of the place)
    let calm = 1;
    const stand = (rect, o, ux, uy, fill, perm, hole) => { sys.board(rect, o, ux, uy, fill, perm, calm); sys.doubled(rect, o, ux, uy, fill, perm); sys.spill(rect, o, ux, uy, fill, perm, Math.min(150, 0.6 * uy.length()));
      bodies.push([o.clone(), ux.clone(), uy.clone(), hole || null]); };
    // a carpet of its own, still: w cells by h; and a plain face laid with it (dimmer than a board's face: a block's end, top or back)
    const carpet = (r, w, h, cutOut) => { const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]; r.shuffle(pool); let g = null;
      for (let tries = 0; tries < 8; tries++) { g = quilt(r, w, h, pool.slice(0, 3), 0.15); let lit = 0; for (let i = 0; i < g.length; i++) if (g[i]) lit++; if (lit >= 0.6 * g.length) break; }   // never a face left nearly blank
      if (cutOut) cutOut(g); return sys.put(w, h, g, g, null); };
    // what stands lit behind a face whose frames are opened: a field of lamps in two hues (w cells by h; out: a cell
    // left out); it stands LAMP.back metres behind its face. BY THE CLOCK the lamps change places: about half of them take the other hue, one after another, are
    // held and turn back, in a wave of LAMP_WAVE seconds; a board's share of the wave is read from where it stands.
    const lampR = stream('lamps');
    const lamps = (r, w, h, out) => { const n = w * h, g = new Uint8Array(n), g2 = new Uint8Array(n), ord = new Float32Array(n);
      for (let i = 0; i < n; i++) { if (out && out(i % w, Math.floor(i / w))) { g[i] = g2[i] = HOLE; continue; } g[i] = r() < 0.7 ? 5 : 4; g2[i] = lampR() < 0.55 ? 9 - g[i] : g[i]; ord[i] = 0.9 * lampR(); }
      return sys.put(w, h, g, g2, ord); };
    const lampFill = (o) => ({ start: (((o.x * 0.0131 + o.y * 0.0173 + o.z * 0.0097) % 1) + 1) % 1, span: -LAMP_WAVE });
    const face = (rect, o, ux, uy, perm, dim, hole) => { sys.board(rect, o, ux, uy, {}, perm, dim * calm); bodies.push([o.clone(), ux.clone(), uy.clone(), hole || null]); };
    // THE BODY OF A STANDING BOARD: every standing board is the face of a block. Behind the face, T metres deep, the
    // block's top and its two ends, laid with carpets of the face's own cell (cs metres); the ends have their doubles.
    const body = (o, ux, uy, T, cs, r, perm, dbl = true) => {
      const nb = ux.clone().cross(uy).normalize().multiplyScalar(-T), wc = Math.max(1, Math.round(ux.length() / cs)), hc = Math.max(1, Math.round(uy.length() / cs)), tc = Math.max(1, Math.round(T / cs));
      const top = carpet(r, wc, tc), end = carpet(r, tc, hc), oA = o.clone().add(nb), uA = nb.clone().negate(), oB = o.clone().add(ux);
      face(top, o.clone().add(uy), ux, nb, perm, 0.72);
      face(end, oA, uA, uy, perm, 0.5); face(end, oB, nb, uy, perm, 0.5);
      if (dbl) { sys.doubled(end, oA, uA, uy, {}, perm, 0.2); sys.doubled(end, oB, nb, uy, {}, perm, 0.2); }
    };
    // a narrower stage set on a block's roof (y): `in0` cells in from each end of the block's face, `back` metres
    // behind it, `sh` cells tall, `deep` metres deep; its face a board of the rule turn, by the clock. Returns its top.
    const stage = (o, ux, cells, cs, y, in0, sh, back, deep, r, perm, fill) => {
      const wc = cells - 2 * in0, out = ux.clone().cross(V(0, 1, 0)).normalize().multiplyScalar(-back), o2 = o.clone().addScaledVector(ux, in0 / cells).add(out).setY(y), ux2 = ux.clone().multiplyScalar(wc / cells), up2 = V(0, sh * cs, 0);
      sys.board(sys.task('turn', wc, sh, r).a, o2, ux2, up2, fill, perm, 1); bodies.push([o2.clone(), ux2.clone(), up2.clone(), null]); body(o2, ux2, up2, deep, cs, r, perm, false); return y + sh * cs; };
    // a pylon: a slender block standing at height y0, its front toward -Z a board of the rule turn, by the clock
    const pylon = (x, y0, z, sd, h, r) => { const cs = sd / 5, hc = Math.round(h / cs), o = V(x + sd / 2, y0, z), ux = V(-sd, 0, 0), up = V(0, hc * cs, 0), perm = r.int(0, 8), rect = sys.task('turn', 5, hc, r).a, fill = { start: r(), span: -ROW2.wave };
      if (y0 === 0) stand(rect, o, ux, up, fill, perm); else { sys.board(rect, o, ux, up, fill, perm, 1); bodies.push([o.clone(), ux.clone(), up.clone(), null]); }
      body(o, ux, up, sd, cs, r, perm, y0 === 0); face(carpet(r, 5, hc), V(x - sd / 2, y0, z + sd), V(sd, 0, 0), up, perm, 0.6); };
    // a house: a block whose face is a face of windows (its frames opened by the law `fill` to lamps behind), with its
    // double and the double of its lamps in the glass
    const house = (o, ux, wc, hc, cs, T, r, fill, k, pitch) => { const up = V(0, hc * cs, 0), hs = [1, 2, 3, 6, 7, 8, 9]; r.shuffle(hs);
      const nb = ux.clone().cross(up).normalize().multiplyScalar(-T), tc = Math.max(1, Math.round(T / cs));
      const wall = (rect, lamp, o1, u1, f) => { const o2 = o1.clone().addScaledVector(u1.clone().cross(up).normalize(), -LAMP.back); const lf = lampFill(o2); stand(rect, o1, u1, up, f, 0); sys.board(lamp, o2, u1, up, lf, 0, 1.25); sys.doubled(lamp, o2, u1, up, lf, 0, 0.5); };
      const t = windowTask(r, wc, hc, hs[0], [hs[1], hs[2]], k, pitch); wall(sys.put(wc, hc, t.before, t.after, t.ord), lamps(r, wc, hc), o, ux, fill);
      // its two ends: faces of windows too, found before we came
      const e = windowTask(r, tc, hc, hs[0], [hs[1], hs[2]], k, pitch), eRect = sys.put(tc, hc, e.before, e.after, e.ord), eLamp = lamps(r, tc, hc);
      wall(eRect, eLamp, o.clone().add(nb), nb.clone().negate(), {}); wall(eRect, eLamp, o.clone().add(ux), nb, {});
      face(carpet(r, wc, tc), o.clone().add(up), ux, nb, 0, 0.72); };
    // ---- THE SUMMIT GATE (the part lays its two boards): toward the street THE BLANK, its great frame lit, coloured
    // BY PLACE while the street is flown; toward the back the last board, whose great frame is the way out. Here: its
    // top and ends, the passage to the way out, what stands lit behind the last board's small frames, two pylons.
    const sWall = sOfZ(WALL.z);
    const last = laySummit(sys, stream('last'), V(GATE.x, GATE.y, GATE.z), { start: BLANK.from, span: sWall - BLANK.short - BLANK.from }, { start: sTurn + GATE.past, span: GATE.span });
    for (const b of last.bodies) bodies.push(b);
    {
      const r = stream('last-bodies'), cs = LAST.cell * LAST.scale, wide = last.side, tall = last.tall, D = LAST.deep, y0 = last.foot, zb = GATE.z, zf = GATE.z - D, up = V(0, tall, 0), dc = Math.round(D / cs), hf = last.door.half, yd = GATE.y - hf, k = LAST.k, d0 = LAST.door;
      face(carpet(r, Math.round(wide / cs), dc), V(wide / 2, y0 + tall, zf), V(-wide, 0, 0), V(0, 0, D), 0, 0.72);
      { const end = carpet(r, 2 * dc, Math.round(2 * tall / cs)); face(end, V(wide / 2, y0, zb), V(0, 0, -D), up, 0, 0.7); face(end, V(-wide / 2, y0, zf), V(0, 0, D), up, 0, 0.7); }
      sys.board(lamps(r, LAST.w, LAST.h, (x, y) => x >= d0[0] && x < d0[0] + k && y >= d0[1] && y < d0[1] + k), V(-wide / 2, y0, zb - LAMP.back), V(wide, 0, 0), up, lampFill(V(-wide / 2, y0, zb)), 0, 1);
      { const sk = GATE.sink, jc = Math.round(sk / cs), kc = Math.round(2 * hf / cs), jamb = carpet(r, jc, kc), lid = carpet(r, kc, jc);
        face(jamb, V(hf, yd, zb - sk), V(0, 0, sk), V(0, 2 * hf, 0), 0, 0.6); face(jamb, V(-hf, yd, zb), V(0, 0, -sk), V(0, 2 * hf, 0), 0, 0.6);
        face(lid, V(-hf, yd + 2 * hf, zb - sk), V(2 * hf, 0, 0), V(0, 0, sk), 0, 0.45); face(lid, V(hf, yd, zb - sk), V(-2 * hf, 0, 0), V(0, 0, sk), 0, 0.7); }
      pylon(wide / 2 + 13, y0, zf + 10, 20, 190, r); pylon(-wide / 2 - 13, y0, zf + 10, 20, 190, r);
    }
    // a tower's foot on the floor: its two ends; and whether a place lies within `pad` metres of a tower's foot, of
    // a board of the summit gate, of a pylon of the square or of a house of the avenue
    const feet = (rare ? TOWERS.concat([TOWER_RARE]) : TOWERS).map(([x, z, side, a]) => { const sd = x < 0 ? -1 : 1, dx = sd * Math.cos(rad(a)), dz = -Math.sin(rad(a)); return [x - dx * side / 2, z - dz * side / 2, x + dx * side / 2, z + dz * side / 2]; });
    const avenue = []; for (const [row, sd] of [[AVENUE.outer, 1], [AVENUE.inner, -1]]) for (let k = 0; k < row.n; k++) avenue.push({ row, sd, z: row.z0 + k * row.step, len: row.w * AVENUE.cell, xf: AVENUE.x + sd * AVENUE.half });
    const keep = feet.concat(last.lines, PYLONS.map(([x, z, sd]) => [x - sd / 2, z, x + sd / 2, z]), avenue.map((a) => [a.xf + a.sd * a.row.deep / 2, a.z, a.xf + a.sd * a.row.deep / 2, a.z + a.len]));
    const taken = (x, z, pad) => keep.some(([ax, az, bx, bz]) => { const ex = bx - ax, ez = bz - az, t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez))); return Math.hypot(x - ax - ex * t, z - az - ez * t) < pad; });
    await ctx.yield();

    // ---- THE FAR PLAIN: pairs lying on the glass in fields, a question and beside it its answer, far out to both
    // sides and behind the pyramid; found, held and let go again by the place's own clock, in a wave that crosses it
    {
      const r = stream('plain'), pool = [], P = PLAIN;
      // the ground kept clear: the lane under the arrival, the street and its rows, the square before the pyramid, the pyramid's foot
      const lane = (x, z) => { const a = Math.abs(x); return z < 80 ? a < 40 : z < 870 ? a < 330 : z < 1440 ? a < 300 : false; };
      for (let k = 0; k < 30; k++) { const n = r.int(7, 10); pool.push(sys.task(WRITTEN_FULL[k % WRITTEN_FULL.length], n, n, r)); }
      let n = 0;
      for (let iz = 0, z = P.z0; z < P.z1; iz++, z += P.plotZ) {
        for (let ix = 0, x = -P.x; x < P.x; ix++, x += P.plotX) {
          const pick = r(), perm = r.int(0, 8), thin = r(), cxm = x + P.plotX / 2;
          if (iz % 6 === 5 || ix % 5 === 4 || lane(cxm, z + P.side / 2) || taken(cxm, z + P.side / 2, 60)) continue;
          if (ctx.noise.fbm2(x / 300, z / 300, 3) < -0.12 + 0.3 * (1 - density)) continue;
          if (thin > 0.8 * detail) continue;
          const t = pool[Math.floor(pick * pool.length)], ph = ((x * 0.55 + z) / 880 + 0.25 * ctx.noise.n2(x / 400, z / 400)) % 1, fill = { start: (ph + 1) % 1, span: -PLAIN_WAVE };
          sys.board(t.q, V(cxm + P.gap / 2 + P.side, 0.03, z), V(-P.side, 0, 0), V(0, 0, P.side), {}, perm, 1);
          sys.board(t.a, V(cxm - P.gap / 2, 0.03, z), V(-P.side, 0, 0), V(0, 0, P.side), fill, perm, 1);
          if (++n % 300 === 0) await ctx.yield();
        }
      }
    }
    await ctx.yield();
    // ---- THE TOWERS and THE SECOND ROWS: by the clock; each board begins as its question and is carried to its
    // answer, held and let go (rules whose question is written full too, so a board is lit at every phase)
    {
      const r = stream('far');
      // the towers: blocks the height of towers, far out in mirrored twos
      const tr = stream('towers'), big = ['turn', 'mend', 'turn', 'mend', 'turn', 'mend'].map((kind) => { const n = tr.int(15, 19); return sys.task(kind, n, n, tr); });
      const tower = (x, side, f, t, perm, ph) => { const fill = { start: ph, span: -TOWER_WAVE }, a = V(f[0], 0, f[1]), b = V(f[2], 0, f[3]), up = V(0, side, 0), o = x > 0 ? b : a, ux = x > 0 ? a.clone().sub(b) : b.clone().sub(a);
        stand(t.a, o, ux, up, fill, perm); body(o, ux, up, 70, side / t.w, tr, perm); };
      TOWERS.forEach((T0, k) => tower(T0[0], T0[2], feet[k], big[k % big.length], tr.int(0, 8), tr()));
      if (rare) { const rr = stream('rare'), n = 17; tower(TOWER_RARE[0], TOWER_RARE[2], feet[TOWERS.length], sys.task('turn', n, n, rr), rr.int(0, 8), rr()); }
      await ctx.yield();
      // the second rows: taller blocks behind the street's, a skyline to either side, each face toward the street
      const R = ROW2, len = R.cells * R.cell;
      for (const sd of [1, -1]) for (let k = 0, z = R.z0; z < R.z1; k++, z += R.step) {
        const hc = k ? r.int(12, 18) : r.int(6, 8), kind = LIT[r.int(0, 1)], perm = r.int(0, 8), ph = (k * 0.23 + (sd > 0 ? 0 : 0.5)) % 1;   // the first of a row is low: the arrival passes above its roof
        if (taken(sd * (R.x + R.deep / 2), z + len / 2, 170)) continue;
        const t = sys.task(kind, R.cells, hc, r), up = V(0, hc * R.cell, 0), o = sd > 0 ? V(R.x, 0, z) : V(-R.x, 0, z + len), ux = V(0, 0, sd > 0 ? len : -len);
        calm = k ? 1 : 0.45; stand(t.a, o, ux, up, { start: ph, span: -R.wave }, perm); body(o, ux, up, R.deep, R.cell, r, perm);
        const y = stage(o, ux, R.cells, R.cell, up.y, 2, k ? r.int(4, 7) : r.int(2, 3), 15, 60, r, perm, { start: (ph + 0.3) % 1, span: -R.wave });
        if (k && r() < 0.6) stage(o, ux, R.cells, R.cell, y, 3, r.int(3, 5), 30, 30, r, perm, { start: (ph + 0.6) % 1, span: -R.wave });
        calm = 1;
      }
      // THE TOWN: blocks in a grid of streets round the pyramid's flanks and behind it, low near it and taller toward
      // the horizon, each face toward the pyramid a board by the clock; ten kinds of block, each used many times
      { const rt = stream('town'), W = TOWN, kits = [];
        for (let k = 0; k < 10; k++) { const wc = rt.int(5, 7), hc = k < 5 ? rt.int(3, 5) : rt.int(6, 14), tc = rt.int(4, 6); const hs = [1, 2, 3, 6, 7, 8, 9]; rt.shuffle(hs); const t = windowTask(rt, wc, hc, hs[0], [hs[1], hs[2]], 1, 4);
          kits.push({ wc, hc, tc, rect: sys.put(wc, hc, t.before, t.after, t.ord), lamp: lamps(rt, wc, hc), top: carpet(rt, wc, tc), end: carpet(rt, tc, hc), back: carpet(rt, wc, hc) }); }
        calm = 0.6;
        for (let z = W.z0; z < W.z1; z += W.step) for (let x = -W.x; x <= W.x; x += W.step) {
          const jx = x + (rt() - 0.5) * 50, jz = z + (rt() - 0.5) * 50, a = Math.abs(jx), far = Math.hypot(jx - W.mid[0], jz - W.mid[1]), pick = rt(), tall = rt(), perm = rt.int(0, 8), ph = rt(), cs = 10 + 4 * rt();
          if (jz < W.zc && a < W.clear) continue;                                           // the pyramid and the way round it
          if (taken(jx, jz, 200) || ctx.noise.fbm2(jx / 400 + 7, jz / 400, 2) < -0.3) continue;
          const low = (a < W.low && jz < W.zl) || tall > (far - 450) / 450, K = kits[(low ? 0 : 5) + Math.floor(pick * 5)], w = K.wc * cs, up = V(0, K.hc * cs, 0), T = K.tc * cs;
          const side = a > 0.8 * Math.abs(jz - W.mid[1]), o = side ? (jx > 0 ? V(jx, 0, jz - w / 2) : V(jx, 0, jz + w / 2)) : V(jx + w / 2, 0, jz), ux = side ? V(0, 0, jx > 0 ? w : -w) : V(-w, 0, 0);
          stand(K.rect, o, ux, up, { start: ph, span: -ROW2.wave }, perm);
          const nb = ux.clone().cross(up).normalize().multiplyScalar(-T), oB = o.clone().add(ux);
          sys.board(K.lamp, o.clone().addScaledVector(nb, LAMP.far / T), ux, up, lampFill(o), 0, 1.25);
          face(K.top, o.clone().add(up), ux, nb, perm, 0.72); face(K.end, o.clone().add(nb), nb.clone().negate(), up, perm, 0.5); face(K.end, oB, nb, up, perm, 0.5); face(K.back, oB.clone().add(nb), ux.clone().negate(), up, perm, 0.5);
        }
        calm = 1; }
      await ctx.yield();
      // THE AVENUE: its houses' windows are opened BY PLACE, house after house as we come (from AVENUE.lead metres of
      // route short of a house's middle, over AVENUE.span metres)
      { const ra = stream('avenue'), A = AVENUE; calm = A.calm;
        for (const a of avenue) { const hc = ra.int(a.row.rows[0], a.row.rows[1]), o = a.sd > 0 ? V(a.xf, 0, a.z) : V(a.xf, 0, a.z + a.len), ux = V(0, 0, a.sd > 0 ? a.len : -a.len);
          house(o, ux, a.row.w, hc, A.cell, a.row.deep, ra, { start: sOfZ(a.z + a.len / 2) - A.lead, span: A.span }, 3, 7); }
        calm = 1; }
      await ctx.yield();
      // the pylons: slender blocks that flank the way across the square, each face a board of the rule turn
      for (const [x, z, sd, h] of PYLONS) pylon(x, 0, z, sd, h, r);
    }
    await ctx.yield();
    // ---- THE STREET: four pairs of blocks, face to face across the track: on the left a block whose street face is a
    // question, on the right its like whose street face is the answer. BY PLACE: a pair's answer is found from
    // PAIR_LEAD metres of route short of the pair's middle to its middle.
    {
      // (the street's stream keeps its first name; the avenue's houses are dealt from a stream of the same name for
      // other things: the two share no thing)
      const r = stream('avenue'), F = STREET, kinds = ['turn', 'mend', 'turn', 'mend'], len = F.cells * F.cell; r.shuffle(kinds);
      for (let k = 0; k < F.n; k++) {
        const z = F.z0 + F.step * k, hc = r.int(9, 15), t = sys.task(kinds[k], F.cells, hc, r), sK = sOfZ(z + len / 2), up = V(0, hc * F.cell, 0);
        const oq = V(F.x, 0, z), uq = V(0, 0, len), oa = V(-F.x, 0, z + len), ua = V(0, 0, -len);
        stand(t.q, oq, uq, up, {}, 0); body(oq, uq, up, F.deep, F.cell, r, 0);
        stand(t.a, oa, ua, up, { start: sK - PAIR_LEAD, span: PAIR_LEAD - PAIR_DONE }, 0); body(oa, ua, up, F.deep, F.cell, r, 0);
        if (r() < 0.65) stage(oq, uq, F.cells, F.cell, up.y, 3, r.int(3, 5), 12, 30, r, 0, { start: r(), span: -ROW2.wave });
        if (r() < 0.65) stage(oa, ua, F.cells, F.cell, up.y, 3, r.int(3, 5), 12, 30, r, 0, { start: r(), span: -ROW2.wave });
        await ctx.yield();
      }
    }
    // ---- THE WALL: a gatehouse across the street, WALL.deep metres deep. Its face toward us is one board: BY PLACE,
    // from WALL_LEAD to WALL_DONE metres of route short of it, what its closed frames hold is opened; the great
    // frame's inside is the gate: a tunnel through the block (its two walls and its roof laid with carpets), open
    // for the last WALL_DONE metres. Its far face is a carpet with the same opening.
    {
      const r = stream('wall'), t = wallTask(r), W = WALL, rect = sys.put(W.cols, W.rows, t.before, t.after, t.ord), wide = W.cols * W.cell, H = W.rows * W.cell, D = W.deep, dc = Math.round(D / W.cell);
      const hole = [W.door[0] / W.cols, (W.door[0] + W.door[2]) / W.cols, W.door[1] / W.rows, (W.door[1] + W.door[3]) / W.rows], gx = W.door[2] * W.cell / 2, gy = W.door[3] * W.cell, up = V(0, H, 0);
      stand(rect, V(wide / 2, 0, W.z), V(-wide, 0, 0), up, { start: sWall - WALL_LEAD, span: WALL_LEAD - WALL_DONE }, 0, hole);
      sys.board(lamps(r, W.cols, W.rows, (x, y) => x >= W.door[0] && x < W.door[0] + W.door[2] && y >= W.door[1] && y < W.door[1] + W.door[3]), V(wide / 2, 0, W.z + LAMP.back), V(-wide, 0, 0), up, lampFill(V(wide / 2, 0, W.z)), 0, 1);   // lit behind the opened frames
      const back = carpet(r, W.cols, W.rows, (g) => { for (let y = W.door[1]; y < W.door[1] + W.door[3]; y++) for (let x = W.door[0]; x < W.door[0] + W.door[2]; x++) g[y * W.cols + x] = HOLE; });
      { const o = V(-wide / 2, 0, W.z + D), ux = V(wide, 0, 0); face(back, o, ux, up, 0, 1, hole); sys.doubled(back, o, ux, up, {}, 0); sys.spill(back, o, ux, up, {}, 0, 60); }
      face(carpet(r, W.cols, dc), V(wide / 2, H, W.z), V(-wide, 0, 0), V(0, 0, D), 0, 0.72);                       // its top
      { const end = carpet(r, dc, W.rows); face(end, V(wide / 2, 0, W.z + D), V(0, 0, -D), up, 0, 0.5); face(end, V(-wide / 2, 0, W.z), V(0, 0, D), up, 0, 0.5); }
      { const jamb = carpet(r, dc, W.door[3]), lintel = carpet(r, W.door[2], dc);                                  // the tunnel
        face(jamb, V(gx, 0, W.z), V(0, 0, D), V(0, gy, 0), 0, 0.6); face(jamb, V(-gx, 0, W.z + D), V(0, 0, -D), V(0, gy, 0), 0, 0.6);
        face(lintel, V(-gx, gy, W.z), V(2 * gx, 0, 0), V(0, 0, D), 0, 0.45); }
    }
    // ---- THE PYRAMID: four tiers. A tier's front is one board: BY PLACE, tier after tier from TIER.lead metres of route
    // short of the arch (each TIER.step metres later, over TIER.span metres), what its closed frames hold is opened
    // to the lit rooms behind (the last board's own rule, shown four times). Its two sides and its back are boards of the same rule, found before we came; its
    // top a carpet of a coarser cell. Pylons stand on its terraces.
    const sTier = [];
    {
      const r = stream('pyramid'), P = PYR, c = P.cell, H = P.rows * c, up = V(0, H, 0);
      for (let k = 0; k < P.cols.length; k++) {
        const w = P.cols[k], wide = w * c, zf = P.z + P.step * k, zb = P.back - P.backStep * k, y0 = H * k, deep = zb - zf, dw = Math.round(deep / c), t = tierTask(r, w, P.rows, last.fc, last.J);
        const rect = sys.put(w, P.rows, t.before, t.after, t.ord), sK = sWall - TIER.lead + TIER.step * k, fill = { start: sK, span: TIER.span }, o = V(wide / 2, y0, zf), ux = V(-wide, 0, 0);
        sTier.push(sK);
        calm = 0.75;
        if (k === 0) stand(rect, o, ux, up, fill, 0); else { sys.board(rect, o, ux, up, fill, 0, calm); bodies.push([o.clone(), ux.clone(), up.clone(), null]); }
        { const fl = lamps(r, w, P.rows), ol = V(wide / 2, y0, zf + LAMP.back), lf = lampFill(ol); sys.board(fl, ol, ux, up, lf, 0, 1.25); if (k === 0) sys.doubled(fl, ol, ux, up, lf, 0, 0.6); }   // lit behind the opened frames
        face(carpet(r, Math.round(wide / P.coarse), Math.round(deep / P.coarse)), V(wide / 2, y0 + H, zf), V(-wide, 0, 0), V(0, 0, deep), 0, 0.55);
        // the two sides and the back: found before we came
        const ts = tierTask(r, dw, P.rows, last.fc, last.J), sRect = sys.put(dw, P.rows, ts.before, ts.after, ts.ord), sLamp = lamps(r, dw, P.rows), tb = tierTask(r, w, P.rows, last.fc, last.J), bRect = sys.put(w, P.rows, tb.before, tb.after, tb.ord);
        const oL = V(wide / 2, y0, zb), uL = V(0, 0, -deep), oR = V(-wide / 2, y0, zf), uR = V(0, 0, deep), oB = V(-wide / 2, y0, zb), uB = V(wide, 0, 0), fL = lampFill(oL), fR = lampFill(oR);
        sys.board(sRect, oL, uL, up, {}, 0, 0.62); sys.board(sLamp, V(wide / 2 - LAMP.back, y0, zb), uL, up, fL, 0, 1.25); bodies.push([oL, uL, up.clone(), null]);
        sys.board(sRect, oR, uR, up, {}, 0, 0.62); sys.board(sLamp, V(-wide / 2 + LAMP.back, y0, zf), uR, up, fR, 0, 1.25); bodies.push([oR, uR, up.clone(), null]);
        sys.board(bRect, oB, uB, up, {}, 0, 0.62); sys.board(lamps(r, w, P.rows), V(-wide / 2, y0, zb - LAMP.back), uB, up, lampFill(oB), 0, 1.25); bodies.push([oB, uB, up.clone(), null]);
        if (k === 0) { sys.doubled(sRect, oL, uL, up, {}, 0, 0.55); sys.doubled(sRect, oR, uR, up, {}, 0, 0.55); sys.doubled(bRect, oB, uB, up, {}, 0, 0.55);
          sys.doubled(sLamp, V(wide / 2 - LAMP.back, y0, zb), uL, up, fL, 0, 0.6); sys.doubled(sLamp, V(-wide / 2 + LAMP.back, y0, zf), uR, up, fR, 0, 0.6); }
        // pylons on this tier's terrace: two before the next tier's front, and along each side
        if (k < 3) { const y1 = y0 + H, xs = wide / 2 - 25.6, fx = k < 2 ? 90 : 60, zn = zf + P.step;
          pylon(fx, y1, zn - 60, 20, 60, r); pylon(-fx, y1, zn - 60, 20, 60, r);
          for (let z = zn + 40; z < zb - 80; z += 150) { pylon(xs, y1, z, 20, 90 - 10 * k, r); pylon(-xs, y1, z, 20, 90 - 10 * k, r); } }
        calm = 1;
        await ctx.yield();
      }
    }
    const look = V(0, 0, 0), look1 = V(LOOK[0], LOOK[1], LOOK[2]), sAv0 = sOfZ(AVENUE.outer.z0), sAv1 = sOfZ(AVENUE.end);
    const boards = sys.finish(); scene.add(boards); scene.add(sys.glow());
    await ctx.yield();
    const air = sys.uniforms.uAir.value, farC = sys.uniforms.uFar.value;
    // ---- THE TRACK: one game board of 48 cells by 222 on the floor; a blank cell of it is clear glass (the doubles
    // show through). The mover (a block of two cells by two) plays BY PLACE: move number m = (s - sGame) / per. Then
    // the board turns into its next arrangement, outward from the goal, over WIN_SPAN metres of route. BY THE CLOCK:
    // the running lights (four rows in every forty of wall cells are turned to the sixth hue; the rows travel up the track).
    const gr = stream('game'), A1 = arrangement(gr, TRACK.bars, true), A2 = arrangement(stream('game-next'), TRACK.bars, false), M = A1.path.length / 2 - 1;
    const sGame = sOfZ(GAME_FROM), sGoal = sOfZ(TRACK.z0 + (A1.goal[1] + 1) * TRACK.cell) - GAME_AHEAD, per = (sGoal - sGame) / M;
    const hueOf = [1, 2, 3, 7]; gr.shuffle(hueOf);                         // the bars' and plates' hues; the walls are the ninth hue, the mover the fourth, the goal the sixth, the strip the eighth
    const gameU = { tGame: { value: null }, uPal: sys.uniforms.uPal, uJoint: sys.uniforms.uJoint, uFar: { value: farC }, uAir: { value: air }, uMove: { value: 0 }, uM: { value: M }, uWin: { value: 0 }, uTime: { value: 0 },
      uMover: { value: new THREE.Vector2(A1.path[0], A1.path[1]) }, uOpen: { value: [0, 0, 0, 0, 0] }, uHue: { value: new THREE.Vector4(hueOf[0], hueOf[1], hueOf[2], hueOf[3]) }, uMeanG: { value: new THREE.Vector4() } };
    {
      const W = TRACK.w, N = TRACK.n, data = new Uint8Array(W * N * 4), visit = new Uint16Array(W * N);
      for (let j = 0; j <= M; j++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { const q = (A1.path[2 * j + 1] + b) * W + A1.path[2 * j] + a; if (!visit[q]) visit[q] = j + 1; }
      let walls = 0;
      for (let i = 0; i < W * N; i++) { data[i * 4] = A1.code[i] + 16 * A2.code[i]; data[i * 4 + 1] = visit[i] & 255; data[i * 4 + 2] = visit[i] >> 8; if (A1.code[i] === 1) walls++;
        data[i * 4 + 3] = Math.round(255 * Math.min(1, Math.hypot(i % W - A1.goal[0] - 0.5, Math.floor(i / W) - A1.goal[1] - 0.5) / 60)); }
      const tex = new THREE.DataTexture(data, W, N, THREE.RGBAFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
      gameU.tGame.value = tex;
      const wallShare = walls / (W * N) * 0.74, cover = Math.min(1, wallShare + 0.14);          // a far track: its walls' share and its joints' faint veil
      gameU.uMeanG.value.set(sys.pal[9].r * wallShare, sys.pal[9].g * wallShare, sys.pal[9].b * wallShare, cover);
      const g = new THREE.BufferGeometry(), x0 = TRACK.left, x1 = TRACK.left - W * TRACK.cell, z0 = TRACK.z0, z1 = TRACK.z0 + N * TRACK.cell;
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0.05, z0, x1, 0.05, z0, x1, 0.05, z1, x0, 0.05, z1], 3)); g.setAttribute('aCell', new THREE.Float32BufferAttribute([0, 0, W, 0, W, N, 0, N], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const mat = new THREE.ShaderMaterial({ uniforms: gameU, transparent: true, premultipliedAlpha: true, depthWrite: false,
        vertexShader: `attribute vec2 aCell; varying vec2 vCell; varying vec3 vW; void main(){ vCell = aCell; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `
          uniform sampler2D tGame; uniform vec3 uPal[10]; uniform vec3 uJoint; uniform vec3 uFar; uniform vec4 uMeanG; uniform float uAir; uniform float uMove; uniform float uM; uniform float uWin; uniform float uTime;
          uniform vec2 uMover; uniform float uOpen[5]; uniform vec4 uHue;
          varying vec2 vCell; varying vec3 vW;
          const vec2 SIZE = vec2(${TRACK.w}., ${TRACK.n}.);
          float pick(vec4 v, float k){ return k < .5 ? v.x : k < 1.5 ? v.y : k < 2.5 ? v.z : v.w; }
          float cover(float d, float h, float w){ return mix(clamp((h - d) / w + .5, 0., 1.), 2. * h, smoothstep(.15, .6, w)); }    // as the part's
          // a cell's look by its code: x the hue, y 1 for a ring (a plate, the goal), z how far a bar is turned away (1 shut, 0 open)
          vec3 look(float c, float next){
            if (c < .5) return vec3(0., 0., 1.);
            if (c < 1.5) return vec3(9., 0., 1.);
            if (c < 6.5) { float k = c - 2., o = next > .5 ? 1. : 1. - uOpen[int(k + .5)]; return o < .03 ? vec3(0., 0., 1.) : vec3(pick(uHue, mod(k + 2. * next, 4.)), 0., o); }
            if (c < 11.5) return vec3(pick(uHue, mod(c - 7. + 2. * next, 4.)), 1., 1.);
            return vec3(6., 1., 1.);
          }
          // the board at one place of it (cells), the pixel's footprint given: its colour times its cover, and its cover
          vec4 at(vec2 cc, vec2 fw2, float fw){
            vec2 ci = clamp(floor(cc), vec2(0.), SIZE - 1.), f = cc - ci;
            vec4 tx = textureLod(tGame, (ci + .5) / SIZE, 0.);
            float rr = floor(tx.r * 255. + .5), c2 = floor(rr / 16.), c1 = rr - 16. * c2;
            float t = uWin <= 0. ? 0. : clamp((uWin * 1.15 - tx.a) / .15, 0., 1.);
            vec3 lk = t < .5 ? look(c1, 0.) : look(c2, 1.);
            float turn = abs(1. - 2. * t);
            if (lk.x > 8.5 && fract(ci.y / 40. - uTime * .4) < .1) lk.x = 6.;                              // the running lights, by the clock
            if (ci.y > SIZE.y - 1.5) { lk = vec3((ci.x + .5) / SIZE.x > uMove / uM ? 8. : 0., 0., 1.); turn = 1.; }     // the strip along the far edge, draining from the left
            vec2 d = abs(f - .5); float hy = .5 - .07, hx = hy * max(lk.z * turn, .04);
            float cell = cover(d.x, hy, fw2.x) * cover(d.y, hy, fw2.y);
            float tile = cover(d.x, hx, fw2.x) * cover(d.y, hy, fw2.y);
            if (lk.y > .5) tile *= smoothstep(.2 - fw, .2 + fw, max(d.x, d.y));
            vec3 c = uJoint; float a = (1. - cell) * .55;                                                  // a blank cell is clear glass; its joints are faint
            if (lk.x > .5) { c = mix(c, uPal[int(lk.x + .5)], tile); a = max(a, tile); }
            float seen = floor(tx.g * 255. + .5) + 256. * floor(tx.b * 255. + .5);                         // where the mover has been: a small mark of its hue
            if (seen > .5 && seen <= floor(uMove) + 1. && t < .5 && lk.x < .5) { float mk = 1. - smoothstep(.15 - fw, .15 + fw, max(d.x, d.y)); c = mix(c, uPal[4], mk); a = max(a, mk); }
            vec2 q = abs(cc - uMover - 1.);                                                                // the mover: two cells by two
            float mv = (1. - smoothstep(.9 - fw2.x, .9 + fw2.x, q.x)) * (1. - smoothstep(.9 - fw2.y, .9 + fw2.y, q.y));
            c = mix(c, uPal[4], mv); a = max(a, mv);
            return vec4(c * a, a);
          }
          void main(){
            // the pixel's footprint: four places along its long axis, each with the short axis's footprint (section 153)
            vec2 gx = dFdx(vCell), gy = dFdy(vCell), major = dot(gx, gx) > dot(gy, gy) ? gx : gy, minor = dot(gx, gx) > dot(gy, gy) ? gy : gx;
            vec2 fw2 = max(min(abs(gx) + abs(gy), abs(minor) + abs(major) * .25), vec2(1e-4)); float fw = max(fw2.x, fw2.y);
            vec4 c = .25 * (at(vCell - major * .375, fw2, fw) + at(vCell - major * .125, fw2, fw) + at(vCell + major * .125, fw2, fw) + at(vCell + major * .375, fw2, fw));
            c = mix(c, uMeanG, smoothstep(.3, .9, fw));
            float k = exp(-length(vW - cameraPosition) * uAir);
            gl_FragColor = vec4(mix(uFar * c.a, c.rgb, k), c.a);
          }` });
      mat.gameTex = tex;
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1; m.name = 'track'; scene.add(m);
    }
    // ---- the floor: black glass, seen by its joints (every ten metres); the night: the air's glow where the glass
    // meets the sky, read from how far the sight is from level; and the stars
    {
      const floor = jointPlane(0, 10, 1, sys.uniforms.uJoint, air); floor.name = 'floor'; scene.add(floor);
      const sky = new THREE.Mesh(new THREE.SphereGeometry(3400, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false,
        uniforms: { uHaze: { value: new THREE.Color(HAZE) }, uDark: { value: new THREE.Color(ZENITH) } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uHaze; uniform vec3 uDark; varying vec3 vW;
          void main(){ float h = abs(normalize(vW - cameraPosition).y); gl_FragColor = vec4(mix(uHaze, uDark, smoothstep(0., 1., sqrt(h))), 1.); }` }));
      sky.position.set(0, 0, 800); sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'far glow'; scene.add(sky);
      // THE STARS: far cells of the nine hues, square to the horizon, each brightening and dimming by the place's own
      // clock; and, fainter, their doubles in the glass
      const r = stream('stars'), pos = [], col = [], ph = [], idx = [], pale = new THREE.Color('#DDE6FF'); let n = 0;
      const quad = (d, size, c, gain, p0, p1) => { const rt = V(0, 1, 0).cross(d).normalize(), upv = d.clone().cross(rt), m = d.clone().multiplyScalar(STARS.r).add(V(0, 0, 800));
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = m.clone().addScaledVector(rt, a * size).addScaledVector(upv, b * size); pos.push(q.x, q.y, q.z); col.push(c.r * gain, c.g * gain, c.b * gain); ph.push(p0, p1); }
        idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; };
      for (let k = 0; k < STARS.n; k++) { const sy = 0.05 + 0.93 * r(), az = r() * Math.PI * 2, cy = Math.sqrt(1 - sy * sy), size = 9 + 24 * r() * r(), c = sys.pal[r.int(1, 9)].clone().lerp(pale, 0.45), gain = Math.min(1, (sy - 0.03) / 0.2), p0 = r(), p1 = 0.3 + 1.2 * r();
        quad(V(cy * Math.sin(az), sy, cy * Math.cos(az)), size, c, gain, p0, p1); quad(V(cy * Math.sin(az), -sy, cy * Math.cos(az)), size, c, gain * 0.3, p0, p1); }
      // THE MOONS: discs of pale cells; a slow wave of light crosses each by the place's own clock; their doubles lie
      // in the glass. One stands over the far towers to the right of the pyramid; the other, smaller, over the street's
      // end (seen from the summit, looking back).
      for (const [el, az, N, hue] of [[0.42, -0.42, 13, 8], [0.2, Math.PI + 0.34, 9, 4]]) { const dm = V(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)), rt = V(0, 1, 0).cross(dm).normalize(), upv = dm.clone().cross(rt), pitch = 34 / STARS.r;
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = i - (N - 1) / 2, b = j - (N - 1) / 2; if (Math.hypot(a, b) > N / 2 - 0.2) continue;
          const d = dm.clone().addScaledVector(rt, a * pitch).addScaledVector(upv, b * pitch).normalize(), c = (r() < 0.16 ? sys.pal[hue] : sys.pal[4]).clone().lerp(pale, 0.72);
          quad(d, 14.5, c, 1.3, 0.25 + i * 0.045, 0.16); quad(V(d.x, -d.y, d.z), 14.5, c, 0.25, 0.25 + i * 0.045, 0.16); } }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); sg.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 2)); sg.setIndex(idx);
      const stars = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { uTime: sys.uniforms.uTime }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `attribute vec3 aCol; attribute vec2 aPh; uniform float uTime; varying vec3 vCol; void main(){ vCol = aCol * (.62 + .38 * sin(uTime * aPh.y + aPh.x * 6.2832)); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
        fragmentShader: `varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }` }));
      stars.frustumCulled = false; stars.renderOrder = -9; stars.name = 'stars'; scene.add(stars);
    }
    await ctx.yield();
    // ---- CLEAR AIR BY PLACE, counted here against the whole course at half a metre: the least air from the lens's
    // place to any face of any block (an opening counted as open: the wall's gate and the way out). It changes
    // nothing; it is written to marks for the count.
    const clear = { body: 1e9 };
    {
      const route = []; for (let d = 0; d <= L; d += 0.5) route.push(path.pointAt(d / L));
      const w = V(0, 0, 0);
      for (let k = 0; k < bodies.length; k++) { const [o, ux, uy, hole] = bodies[k], lu = ux.length(), lv = uy.length(), eu = ux.clone().divideScalar(lu), ev = uy.clone().divideScalar(lv), nrm = eu.clone().cross(ev);
        for (const p of route) { w.copy(p).sub(o); const a = w.dot(eu), b = w.dot(ev), c = w.dot(nrm), da = Math.max(0, -a, a - lu), db = Math.max(0, -b, b - lv); let dd = Math.hypot(da, db, c);
          if (hole && !da && !db && a > hole[0] * lu && a < hole[1] * lu && b > hole[2] * lv && b < hole[3] * lv) dd = Math.hypot(Math.min(a - hole[0] * lu, hole[1] * lu - a, hole[2] > 0 ? b - hole[2] * lv : 1e9, hole[3] * lv - b), c);
          if (dd < clear.body) clear.body = dd; }
        if (k % 20 === 19) await ctx.yield(); }
    }
    const speed = (s) => 1.2 - 0.25 * ss(sWall, sWall + 250, s) + 0.1 * ss(sTurn + QUICK[0], sTurn + QUICK[1], s);
    // the mover's place at s (cells), and what the track shows there
    const moveAt = (s) => Math.max(0, (s - sGame) / per);
    const moverAt = (m, out) => { const i = Math.min(M - 1, Math.floor(m)), f = Math.min(1, m - i), P = A1.path;
      out.set(P[2 * i] + (P[2 * i + 2] - P[2 * i]) * f, P[2 * i + 1] + (P[2 * i + 3] - P[2 * i + 1]) * f + (A1.bump[i + 1] ? 0.42 * Math.sin(Math.PI * Math.min(1, f / 0.8)) : 0)); return out; };
    const gaze = new THREE.Vector2(), gazeAt = V(0, 0, 0);
    return {
      scene, path, duration: 115, pace: (u) => speed(u * L),
      camera: { fov: 62, near: 0.3, far: 4600, lookAhead: 24, sway: 0.25, bank: 0 },
      // the gaze, BY PLACE: toward the mover while it plays ahead of us along the street (its place worked out from u in the look's own function)
      pois: [{ at: (time, u) => { moverAt(moveAt(u * L), gaze); return gazeAt.set(TRACK.left - (gaze.x + 1) * TRACK.cell, 0, TRACK.z0 + (gaze.y + 1) * TRACK.cell); }, from: sOfZ(250) / L, to: (sWall - 200) / L, weight: 0.2 },
        // the gaze is held toward the pyramid, BY PLACE: over the square past the arch; along the avenue it is the
        // course's own (a tower stands at the avenue's end); from the avenue's end round the back; then to the way out
        { at: look1, from: (sWall + 20) / L, to: (sAv0 + 40) / L, weight: 0.8, fade: 0.3, arc: true, steady: true },
        { at: (time, u) => look.copy(look1).lerp(END, ss(sTurn + GAZE.from, sTurn + GAZE.to, u * L)), from: (sAv1 - 220) / L, to: (sTurn + GAZE.end) / L, weight: 0.75, fade: 0.2, arc: true, steady: true }],
      portal: { shape: 'rect', width: last.door.half * 2, height: last.door.half * 2, color: PALETTE[8], frame: 0, glow: 0, halo: false, veil: '#1B2452', revealDistance: 1500 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0.45, radius: 0.6, threshold: 0.42 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      marks: { atlas: sys.rows(), L, sWall, sTurn, sTier, sGame, sGoal, per, M, clear, bodies: bodies.length, boards: sys.count(), openAt: A1.openAt },
      update(dt, time, camera, u) {
        const s = u * L, m = moveAt(s), g = gameU;
        sys.uniforms.uS.value = s; sys.uniforms.uTime.value = time;
        g.uMove.value = Math.min(M, m); g.uTime.value = time; g.uWin.value = Math.min(1, Math.max(0, (s - sGoal) / WIN_SPAN)); moverAt(Math.min(M, m), g.uMover.value);
        for (let k = 0; k < 5; k++) g.uOpen.value[k] = Math.min(1, Math.max(0, (m - A1.openAt[k]) / 2));   // TRACK.bars is five, as uOpen is
      },
      dispose() {},
    };
  },
};
