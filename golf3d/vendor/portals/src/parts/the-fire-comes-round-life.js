// THE ANIMALS of the world "the-fire-comes-round": three kinds of our own form, none after any creature of the
// book or any beast of Earth. Dark, plain, and BODIES: modelled, with the fire's light along back, neck and legs on
// the side toward it, the night's blue on the shaded side; heads are plain wedges (no face).
// A LIFELONG MIGRATION, NOT A ROUT: all go away from the fire, steadily, in good order.
//
//   RUNNERS  a deep keeled chest on four long two-jointed legs, a long neck carried forward and up, a stiff tail
//            with a flat tuft, a ridge of quills; great beasts, 9 to 11 m nose to tail, 3.3 m at the shoulder. A
//            steady run at 13 m a second; each animal's stride rate is dealt and its stride length is the speed over
//            that rate, so no foot slides (the feet are placed by the stride's phase and the knee follows). Loose
//            files: four down the river on its bars and through its shallows (the two nearest 8 to 15 m from the
//            route's line, either side of it), coming over the drowned shallows into it, or out of the plants of
//            their own bank below its mouth where the way over the shallows lies nearer the fire than a lane may
//            begin; along the moat's near shore, wading its shallows; across the channel. STAGE D: FILES ACROSS
//            THE LIT SHALLOWS OF THE RUN, between the route and the wall, where the plan finds a lawful way (out
//            of the plants farther along the front, where the line bays away; never nearer the line than 112 m;
//            under the route's line; away into the plants of the far bank): up to three, one or two on most
//            seeds, a runner to every 27 m. Where a file wades it throws spray at every footfall and every wading
//            runner is doubled in the water. Every lane begins and ends under the crowns.
//   FLIERS   a blunt fore end, a slim body, one pair of broad wings with a bending joint, two long streamers; lit
//            orange from below by the fire, the night's blue above. Each beats at its own rate and glides part of
//            its own cycle. Broken streams going south. STAGE D: GREAT FLIERS (spans of 8 to 14 m, with a neck
//            and a wedge head) on lanes of their own that pass near the route: beside the way down, low across
//            the run (twice), across the turn, across the way down; none within 150 m of the
//            castle's rock, none over the line or through the smoke; clear air kept and tested.
//   SHAPES IN THE WATER   a long low back with a tall ridged sail, a neck and a wedge head carried low before it,
//            two short breathing stalks, a flat tail that sculls; each on its own small loop, with a lit wake; in
//            RAFTS of three and more (stage D): in the river, one raft to every fifth of the run 20 to 62 m from
//            the route's line (mostly on the fire's side, never nearer the part's line than 80 m), two in the
//            channel, and off the moat's near shores.
//
// BY PLACE AND THE WORLD CLOCK. A lane is a line in the land; an animal's place on it is its dealt start plus its
// speed times the world clock, wrapped over the lane's length (the lane's ends lie under the crowns). Starts,
// phases and rates come from the seed's deal, never from the flight. Every lane begins at least 150 m before the
// fuse belt (215 m from the part's line; 285 m beside the drowned shallows). Nothing starts, turns, hurries or
// hides for the lens.
// COMFORT: spray is small and quick (a footfall's splash is up and gone in half a stride, under 2 m high); it is lit
// by the place's light and never brighter than 0.30 (0.12 until stage D); a swimmer's wake the same.
// STAGE F: THE HERD: the outer file of each bank down the river (24 m from the route's line) is the greatest:
// nearly twice as many animals, each a seventh greater, often two abreast. THE GREAT FLIERS: a round five-sided body
// with a round blunt head (never plates), three tenths of an animal's rims, and every lane's whole band (a wing's
// reach with it) 25 m and more from the route's line. AN ANIMAL'S IMAGE IN WATER is darker than the animal (0.55).
// A wake's and a ring's fall-off is a square taken as x*x (never a power of a base under nought).
// STAGE F. WHAT READS THE EYE IN THIS FILE (every term; each is optics only, none places, shows, hides or times
// anything): (1) an animal's rims: the fresnel sheen and the warm rim on what stands between the eye and the fire
// (the look's direction against the skin and against the fire's bearing); (2) the doubles in the water: drawn only
// where the eye's ray meets the water's level (wFace: the mirror); (3) the air between the eye and an animal: the
// dusk's haze and mist by the ray's length (wAir) and the smoke's veil along the ray (the part's fcrSmokeVeil);
// (4) spray and wakes: haze by the ray's length; (5) a spray card is turned about the upright to face the eye.
// Nothing else: lanes, starts, phases, speeds, flocks and what is dealt read place, the seed and the world clock.
// A great flier is one round body with a head and two wings in a beat, and every lane of the great fliers keeps
// 25 m and more from the route's line, so that a whole animal fits the picture (by place at build).
// The idle forks of the world's list and the burnt draws stay as they are: taking them out would move the deal.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);   // lengths (plain roots: these are asked very many times in the build)

// STAGE E: the runners are greater (scale 1.67 to 1.98: heads to 7.4 m), their rims a little stronger; the great
// fliers are plain shapes of our own form (a SHORT neck, a blunt head, a short split tail: no long streamers), go in
// flocks of about seven with one heading, and every lane of the air keeps 150 m and more from the castle (a lane
// over the lagoon is still asked of the plan, and is laid only where its whole length keeps that distance: on none
// of the 25 seeds tested); the lane by the turn from the fire carries the most (a flock every 210 m).
// The shapes in the water go nearly twice as fast, with a working neck stretched forward and a clearer V of wake.
// No file, no shape in the water and no lane of the air is nearer than 30 m to anything of the forest that ever
// burns: by construction (the forest never lets a thing catch by a file; rafts and lanes are refused there), printed.
export const LIFE = { run: 13, fly: 17, flyLane: 2600, laneFromLine: 215, step: 4, head: 7.4, size: [1.67, 1.98], wade: 0.5, span: 1.5, wing: 5.4,
  great: [8, 14], greatWing: 7.6, greatKeep: 25, greatEvery: 48, runEvery: 27, runKeep: 9, spray: 0.30 };
// head: a runner's highest reach (m); size: a grown runner's scale; wade: how deep it stands in water (m); span: the
// lesser fliers' scale on the dealt span; wing: a lesser flier's greatest reach (m); great: the great fliers' spans
// (m); greatWing: a great flier's greatest reach (m); greatEvery: one great flier to so many metres of its lane;
// runEvery: one runner to so many metres of a file across the shallows; runKeep: no plant stands within 3.2 m and
// this of such a file's line; spray: the most a splash or a wake adds (linear)

// ---------- shapes, built in the animal's own frame: x forward, y up, z to its right; metres ----------
function mesh() {
  const pos = [], nor = [], ab = [], ah = [], idx = [];
  // b: x 0 a rigid part, 1 a leg (then y the leg's number, z the joint: 0 hip, 1 knee, 2 foot), 2 a tail part that
  // sculls or a wing (y its side, z how far out), 3 a streamer; h: for a leg, its hip
  const v = (p, n, b = [0, 0, 0, 0], h = [0, 0, 0]) => { const l = hyp3(n[0], n[1], n[2]) || 1; pos.push(p[0], p[1], p[2]); nor.push(n[0] / l, n[1] / l, n[2] / l); ab.push(b[0], b[1], b[2], b[3]); ah.push(h[0], h[1], h[2]); return pos.length / 3 - 1; };
  // a tube through rings: each ring a centre, half height, half width; sides round it
  const tube = (rings, sides, b, cap = true) => {
    const base = pos.length / 3;
    // (a ring's normals lean with the tube's taper: a chest that narrows into a neck faces forward there, and takes no rim)
    rings.forEach((r, i) => {
      const p = rings[Math.max(i - 1, 0)], q = rings[Math.min(i + 1, rings.length - 1)], ax = q[0] - p[0], ay = q[1] - p[1], al = hyp(ax, ay) || 1, k = clamp((0.5 * (q[3] + q[4]) - 0.5 * (p[3] + p[4])) / al, -2.5, 2.5);
      for (let j = 0; j <= sides; j++) { const a = (j / sides) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), nl = hyp(ca * r[4], sa * r[3]) || 1; v([r[0], r[1] + ca * r[3], r[2] + sa * r[4]], [-k * ax / al, (ca * r[4]) / nl - k * ay / al, (sa * r[3]) / nl], b); }
    });
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) { const p = base + i * (sides + 1) + j, q = p + sides + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    if (cap) for (const [i, d] of [[0, -1], [rings.length - 1, 1]]) { const r = rings[i], o = v([r[0] + d * 0.12 * r[3], r[1], r[2]], [d, 0, 0], b), p = base + i * (sides + 1); for (let j = 0; j < sides; j++) idx.push(o, p + j, p + j + 1); }
  };
  const triP = (a, b2, c, n, bb) => { const i = v(a, n, bb), j = v(b2, n, bb), k = v(c, n, bb); idx.push(i, j, k); };
  const done = () => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(ab, 4)); g.setAttribute('aH', new THREE.Float32BufferAttribute(ah, 3)); g.setIndex(idx);
    return { geometry: g, triangles: idx.length / 3 };
  };
  return { v, tube, triP, idx, done };
}
// the runner: a long animal, 6 m nose to tail, shoulder 2.2 m, with a narrow deep keeled chest and a long neck
// carried up and forward (the head at 3.2 m), so that head, neck, body and legs are read from in front as from the
// side; the hind feet stand wider than the fore feet, so that all four legs are plain from in front
export const RUNNER = { hipY: 1.72, upper: 1.28, lower: 1.42, hips: [[0.98, 0.48], [0.98, -0.48], [-1.28, 0.74], [-1.28, -0.74]] };
function runnerGeo(near, quill, tuft) {
  const M = mesh(), sides = near ? 5 : 4;
  // the keeled chest and the long body
  const body = near ? [[-1.75, 1.70, 0, 0.28, 0.3], [-1.15, 1.64, 0, 0.5, 0.5], [-0.1, 1.5, 0, 0.66, 0.54], [0.85, 1.38, 0, 0.88, 0.48], [1.3, 1.62, 0, 0.56, 0.32], [1.52, 1.92, 0, 0.3, 0.2]] : [[-1.75, 1.70, 0, 0.28, 0.3], [-0.1, 1.52, 0, 0.66, 0.54], [1.3, 1.6, 0, 0.6, 0.36], [1.52, 1.92, 0, 0.3, 0.2]];   // (a narrow deep chest that runs on into the neck: no blunt face to it)
  M.tube(body, sides, [0, 0, 0, 0]);
  // the neck, forward and low, and the small wedge of a head
  const neck = near ? [[1.15, 1.8, 0, 0.38, 0.22], [1.66, 2.42, 0, 0.29, 0.16], [2.18, 3.18, 0, 0.2, 0.12]] : [[1.15, 1.8, 0, 0.36, 0.2], [2.18, 3.18, 0, 0.2, 0.12]];
  M.tube(neck, near ? 4 : 3, [0, 0, 0, 0], false);
  const hb = [2.12, 3.2, 0], nose = [2.92, 2.96, 0];
  for (const [a, b, n] of [[[hb[0], hb[1] + 0.17, 0.14], [hb[0], hb[1] + 0.17, -0.14], [0.2, 1, 0]], [[hb[0], hb[1] - 0.16, -0.13], [hb[0], hb[1] - 0.16, 0.13], [0.2, -1, 0]], [[hb[0], hb[1] - 0.16, 0.13], [hb[0], hb[1] + 0.17, 0.14], [0.2, 0, 1]], [[hb[0], hb[1] + 0.17, -0.14], [hb[0], hb[1] - 0.16, -0.13], [0.2, 0, -1]]]) M.triP(a, b, nose, n, [0, 0, 0, 0]);
  // the stiff tail straight out behind, with its flat tuft
  M.tube([[-1.7, 1.72, 0, 0.1, 0.08], [-2.75, 1.78, 0, 0.04, 0.035]], 3, [0, 0, 0, 0], false);
  const t = tuft, tq = [[-2.65, 1.78, 0], [-2.95, 1.78 + 0.3 * t, 0], [-3.4 - 0.1 * t, 1.8, 0], [-2.95, 1.78 - 0.26 * t, 0]];
  M.triP(tq[0], tq[1], tq[2], [0, 0, 1], [0, 0, 0, 0]); M.triP(tq[0], tq[2], tq[3], [0, 0, 1], [0, 0, 0, 0]);
  // the ridge of quills down the neck and the back
  const nq = near ? 6 : 4;
  for (let i = 0; i < nq; i++) {
    const f = (i + 0.5) / nq, onNeck = f < 0.35, x = onNeck ? lerp(1.8, 1.05, f / 0.35) : lerp(0.9, -1.6, (f - 0.35) / 0.65), y = onNeck ? lerp(3.0, 2.2, f / 0.35) : lerp(2.2, 1.96, (f - 0.35) / 0.65), h = quill * (0.34 + 0.16 * Math.sin(i * 2.1)) * (onNeck ? 0.7 : 1), w = near ? 0.18 : 0.34;
    M.triP([x + w, y - 0.05, 0], [x - w, y - 0.05, 0], [x - w - 0.22, y + h, 0], [0, 0.3, 1], [0, 0, 0, 0]);
  }
  // four long two-jointed legs: each vertex rides a joint (hip, knee, foot) and keeps a small offset round the bone
  RUNNER.hips.forEach((hp, leg) => {
    const hip = [hp[0], RUNNER.hipY, hp[1]], rs = [0.3, 0.2, 0.15], ns = near ? 4 : 3, rows = [];
    for (let j = 0; j < 3; j++) { const row = []; for (let k = 0; k <= ns; k++) { const a = (k / ns) * 6.2832 + 0.5, ca = Math.cos(a), sa = Math.sin(a); row.push(M.v([ca * rs[j], 0, sa * rs[j]], [ca, 0, sa], [1, leg, j, 0], hip)); } rows.push(row); }
    for (let j = 0; j < 2; j++) for (let k = 0; k < ns; k++) M.idx.push(rows[j][k], rows[j + 1][k], rows[j][k + 1], rows[j][k + 1], rows[j + 1][k], rows[j + 1][k + 1]);
    if (near) { const a = M.v([0.36, 0.02, 0], [0, 1, 0], [1, leg, 2, 0], hip); M.idx.push(rows[2][0], rows[2][1], a, rows[2][1], rows[2][2], a, rows[2][3], rows[2][0], a); }      // a long toe
  });
  return M.done();
}
// a runner's double in the water: its outline from the side as a flat shape (body, neck, head, tail) and four legs
// that ride the same joints: the water's face breaks it into strokes, so no more is asked of it
function runnerFlat() {
  const M = mesh(), Z = [0, 0, 1], R0 = [0, 0, 0, 0];
  const top = [[-1.75, 1.98], [-0.1, 2.16], [0.85, 2.26], [1.5, 2.2]], bot = [[-1.75, 1.42], [-0.1, 0.84], [0.85, 0.5], [1.3, 1.08]];
  for (let i = 0; i < 3; i++) { M.triP([top[i][0], top[i][1], 0], [bot[i][0], bot[i][1], 0], [top[i + 1][0], top[i + 1][1], 0], Z, R0); M.triP([top[i + 1][0], top[i + 1][1], 0], [bot[i][0], bot[i][1], 0], [bot[i + 1][0], bot[i + 1][1], 0], Z, R0); }
  M.triP([1.15, 2.2, 0], [1.2, 1.5, 0], [2.14, 3.4, 0], Z, R0); M.triP([1.2, 1.5, 0], [2.2, 3.0, 0], [2.14, 3.4, 0], Z, R0);      // the neck
  M.triP([2.12, 3.4, 0], [2.14, 3.02, 0], [2.92, 2.96, 0], Z, R0);                                                                // the head
  M.triP([-1.7, 1.84, 0], [-1.7, 1.62, 0], [-3.35, 1.8, 0], Z, R0);                                                               // the tail
  RUNNER.hips.forEach((hp, leg) => {
    const hip = [hp[0], RUNNER.hipY, hp[1]], rs = [0.3, 0.2, 0.12], q = [];
    for (let j = 0; j < 3; j++) for (const e of [-1, 1]) q.push(M.v([e * rs[j] * 0.75, 0, e * rs[j] * 0.75], Z, [1, leg, j, 0], hip));
    M.idx.push(q[0], q[2], q[1], q[1], q[2], q[3], q[2], q[4], q[3]);
  });
  return M.done();
}
// the flier: a slim body 1.6 m, one pair of broad wings (span 1: the shader gives the dealt span), two streamers
function flierGeo() {
  const M = mesh();
  const nose = [0.55, 0, 0], tail = [-1.05, 0, 0], ring = [[0.25, 0.17, 0], [0.25, 0, 0.16], [0.25, -0.15, 0], [0.25, 0, -0.16]];
  for (let k = 0; k < 4; k++) { const a = ring[k], b = ring[(k + 1) % 4], n = [0.3, a[1] + b[1], a[2] + b[2]]; M.triP(nose, a, b, n, [0, 0, 0, 0]); M.triP(tail, b, a, [-0.2, a[1] + b[1], a[2] + b[2]], [0, 0, 0, 0]); }
  for (const s of [-1, 1]) {                                                 // a wing: root, the bending joint at 0.45 of the half span, the tip
    const r0 = M.v([0.3, 0.04, 0], [0, 1, 0], [2, s, 0, 0]), r1 = M.v([-0.45, 0.04, 0], [0, 1, 0], [2, s, 0, 0]);
    const j0 = M.v([0.42, 0.04, s * 0.45], [0, 1, 0], [2, s, 0.45, 0]), j1 = M.v([-0.55, 0.04, s * 0.45], [0, 1, 0], [2, s, 0.45, 0]);
    const t0 = M.v([0.05, 0.04, s], [0, 1, 0], [2, s, 1, 0]), t1 = M.v([-0.42, 0.04, s * 0.94], [0, 1, 0], [2, s, 1, 0]), m0 = M.v([0.3, 0.04, s * 0.75], [0, 1, 0], [2, s, 0.75, 0]);
    M.idx.push(r0, j0, r1, r1, j0, j1, j0, m0, j1, j1, m0, t1, m0, t0, t1, r1, j1, r0);
  }
  for (const s of [-1, 1]) {                                                 // two long thin streamers, held together
    const w = 0.035, z = s * 0.05, a = [-1.0, 0, z], b = [-2.3, -0.05, z * 1.4], c = [-3.7, -0.16, z * 2.2];
    const q = [M.v([a[0], a[1] + w, a[2]], [0, 0, 1], [3, s, 0, 0]), M.v([a[0], a[1] - w, a[2]], [0, 0, 1], [3, s, 0, 0]), M.v([b[0], b[1] + w, b[2]], [0, 0, 1], [3, s, 0.5, 0]), M.v([b[0], b[1] - w, b[2]], [0, 0, 1], [3, s, 0.5, 0]), M.v([c[0], c[1], c[2]], [0, 0, 1], [3, s, 1, 0])];
    M.idx.push(q[0], q[1], q[2], q[2], q[1], q[3], q[2], q[3], q[4]);
  }
  return M.done();
}
// THE GREAT FLIER (stage D; stage E by the book's rule 23: never a dragon's outline): a plain shape of our own form
// at its full size (spans of 8 to 14 m): a slim body, a SHORT neck with a plain blunt wedge of a head, broad wings
// with a bending joint, a short split tail (no long streamers). Always in flocks with one heading (see the lanes).
function greatGeo() {
  const M = mesh(), R0 = [0, 0, 0, 0];
  // (stage F: a ROUND body and a round blunt head: five-sided, fuller; at the lens the three-sided one was read as plates)
  M.tube([[-1.05, 0, 0, 0.03, 0.03], [-0.55, 0, 0, 0.16, 0.15], [-0.05, -0.01, 0, 0.26, 0.24], [0.45, 0.03, 0, 0.19, 0.175], [0.74, 0.085, 0, 0.1, 0.095], [0.92, 0.1, 0, 0.11, 0.095], [1.06, 0.088, 0, 0.02, 0.02]], 5, R0, false);   // (the book's rule 23: a SHORT neck)
  const zf = [0, 0.22, 0.45, 0.7, 0.9, 1], lead = [0.42, 0.52, 0.56, 0.42, 0.2, -0.04], trail = [-0.62, -0.78, -0.7, -0.62, -0.5, -0.3];
  for (const sd of [-1, 1]) {                                                // a wing: root, the bending joint at 0.45 of the half span, the tip
    const a = zf.map((z, i) => M.v([lead[i], 0.04, sd * z], [0, 1, 0], [2, sd, z, 0])), b = zf.map((z, i) => M.v([trail[i], 0.04, sd * z], [0, 1, 0], [2, sd, z, 0]));
    for (let i = 0; i < zf.length - 1; i++) M.idx.push(a[i], a[i + 1], b[i], b[i], a[i + 1], b[i + 1]);
  }
  for (const sd of [-1, 1]) {                                                // (stage E: NO LONG STREAMERS) a short split tail, two blunt blades
    const w = 0.07, z = sd * 0.06, a = [-1.0, 0, z], b = [-1.26, -0.02, z * 2.4], c = [-1.5, -0.05, z * 3.6];
    const q = [M.v([a[0], a[1] + w, a[2]], [0, 0, 1], [3, sd, 0, 0]), M.v([a[0], a[1] - w, a[2]], [0, 0, 1], [3, sd, 0, 0]), M.v([b[0], b[1] + w, b[2]], [0, 0, 1], [3, sd, 0.5, 0]), M.v([b[0], b[1] - w, b[2]], [0, 0, 1], [3, sd, 0.5, 0]), M.v([c[0], c[1], c[2]], [0, 0, 1], [3, sd, 1, 0])];
    M.idx.push(q[0], q[1], q[2], q[2], q[1], q[3], q[2], q[3], q[4]);
  }
  return M.done();
}
// the shape in the water: a long low back (length 1: the shader gives the dealt length), a tall ridged sail, a short
// neck carried up out of the water at its narrow fore end with a plain wedge of a head and two breathing stalks on
// it, a broad flat tail that sculls. Water level is y 0.
function swimmerGeo() {
  const M = mesh(), N = 9, top = [];
  const hw = (f) => 0.085 * Math.sin(Math.PI * Math.pow(f, 0.8)) + 0.012, hh = (f) => 0.07 * Math.sin(Math.PI * Math.pow(f, 0.75));
  const rows = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, x = 0.5 - f, sc = f > 0.62 ? (f - 0.62) / 0.38 : 0, row = [];
    for (let j = 0; j <= 4; j++) { const a = (j / 4) * Math.PI, ca = Math.cos(a), sa = Math.sin(a); row.push(M.v([x, sa * hh(f) - 0.012, ca * hw(f)], [0, sa + 0.2, ca], [2, 0, sc, 0])); }
    rows.push(row); top.push([x, hh(f) - 0.012, sc]);
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < 4; j++) M.idx.push(rows[i][j], rows[i + 1][j], rows[i][j + 1], rows[i][j + 1], rows[i + 1][j], rows[i + 1][j + 1]);
  // the sail: a ridged crest of fins along the back, tallest behind the middle
  for (let i = 1; i < N - 1; i++) {
    const a = top[i], b = top[i + 1], f = (i + 0.5) / N, h = 0.36 * Math.sin(Math.PI * Math.pow(f, 1.3)) * (0.75 + 0.25 * (i % 2));
    M.triP([a[0], a[1], 0], [b[0], b[1], 0], [0.5 * (a[0] + b[0]) - 0.03, 0.5 * (a[1] + b[1]) + h, 0], [0, 0.2, 1], [2, 1, 0.5 * (a[2] + b[2]), 0]);
    M.triP([a[0], a[1], 0], [0.5 * (a[0] + b[0]) - 0.03, 0.5 * (a[1] + b[1]) + h, 0], [a[0] + 0.02, a[1] + 0.55 * h, 0], [0, 0.2, 1], [2, 1, a[2], 0]);
  }
  // the neck, up and forward out of the water, and the plain wedge of a head (stage D: an animal, never a lump)
  M.tube([[0.37, 0.025, 0, 0.045, 0.038], [0.5, 0.09, 0, 0.034, 0.03], [0.62, 0.135, 0, 0.027, 0.024]], 3, [0, 0, 0, 0], false);   // (stage E: stretched forward and low)
  { const hb = [0.61, 0.14], nose = [0.75, 0.118, 0];
    for (const [a, b, n] of [[[hb[0], hb[1] + 0.028, 0], [hb[0], hb[1] - 0.022, -0.024], [0.2, 0.5, -1]], [[hb[0], hb[1] - 0.022, 0.024], [hb[0], hb[1] + 0.028, 0], [0.2, 0.5, 1]], [[hb[0], hb[1] - 0.022, -0.024], [hb[0], hb[1] - 0.022, 0.024], [0.2, -1, 0]]]) M.triP(a, b, nose, n, [0, 0, 0, 0]); }
  for (const s of [-1, 1]) {                                                 // two short breathing stalks on the head
    const z = s * 0.016, tip = [0.632, 0.2, z * 1.3];
    M.triP([0.615, 0.16, z], [0.645, 0.16, z], tip, [0, 0.2, 1], [0, 0, 0, 0]);
  }
  // the broad flat tail
  const tb = M.v([-0.47, 0.0, 0], [0, 1, 0], [2, 0, 0.9, 0]), tl = M.v([-0.62, 0.0, 0.1], [0, 1, 0], [2, 0, 1, 0]), tr = M.v([-0.62, 0.0, -0.1], [0, 1, 0], [2, 0, 1, 0]), tm = M.v([-0.57, 0.0, 0], [0, 1, 0], [2, 0, 1, 0]);
  M.idx.push(tb, tl, tm, tb, tm, tr);
  return M.done();
}
export const SHAPES = { runnerGeo, runnerFlat, flierGeo, greatGeo, swimmerGeo };

// ---------- the shaders ----------
// An animal. With MIRROR defined the same animal is drawn doubled in the water's face (turned over about the water's
// level, shown only where the eye's ray meets water, by the mirror's share at that angle: optics).
const ANIMAL_FRAG = /* glsl */`
uniform float uKind;             // 0 a runner, 1 a flier, 2 a shape in the water
varying vec3 vW, vN; varying vec4 vL, vF; varying vec3 vA;
void main(){
  vec3 n = normalize(vN);
  vec3 V = vW - cameraPosition; vec3 rd = V/max(length(V), 1e-3);
#ifdef MIRROR
  vec3 hp; float wat = wFace(cameraPosition, rd, hp);                        // where the eye's ray meets the water's level
  if (wat > -.2) discard;
  float cover = wDouble(hp, rd, wat);
  rd.y = -rd.y;                                                              // the look as the water turns it
  if (dot(n, rd) > 0.) n = -n;
#else
  if (uKind > .5 && uKind < 1.5) { if (dot(n, rd) > 0.) n = -n; }            // (a flier's wing is one skin: the side seen is the side lit)
  else if (!gl_FrontFacing) n = -n;
#endif
  float wE = wFar(vL.w), fl = step(.5, uKind)*step(uKind, 1.5);              // what a dark body makes of the fire's light far off; a flier
  // a dark hide, a little paler along the back: the fire's light models the side toward it, the sky's blue the other
  vec3 alb = mix(vec3(.040, .034, .035), vec3(.088, .072, .066), smoothstep(-.35, .75, n.y));   // (stage E: the back a little paler: a back, never a stump)
  vec3 col = alb*wLitF(n, vL, .18, 3.4);
  vec2 fdir = normalize(vL.xz + vec2(1e-5, 1e-5));
  float fres = pow(1. - clamp(abs(dot(n, rd)), 0., 1.), 3.2), up = smoothstep(-.1, .6, n.y);   // (up: the back, the neck's top, a wing's or a sail's upper side)
  float toward = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), fdir), 0.), facing = clamp(dot(n.xz, fdir)*.5 + .5, 0., 1.);
  // the fire's rim along back, neck and legs on its side and on what stands between the eye and the fire; a cool rim
  // on the other side (optics). The rim of what stands between the eye and the fire, and the night's cool rim, lie
  // along the back and the neck only: a chest seen from in front stays dark, a body and never a pale shield
  col += (uFire*(wE*fres*(.40*facing + .26*toward*up)) + (uAmbSky*.12 + uDuskCol*(.10*max(dot(n, uDuskDir), 0.)))*fres*(1. - .8*facing)*mix(.35, 1., up))*(1. - .7*fl);   // (stage F: a flier takes three tenths of the rims: on a wing seen edge on the whole plate was a pale rim)   // (stage E: both rims a little stronger, the cool one on the legs too: 0.40 and 0.26 of the fire's far grade, 0.12 of the sky's light)
  col += uAmbSky*alb*(.32*(1. - facing));
  // a flier is lit from below by the fire (its light comes up off the land and the water) and from above by the night's blue
  col += uFire*((alb + .04)*(2.6*wE*max(-n.y, 0.)*fl)) + uAmbSky*vec3(.55, .8, 1.25)*(.075*max(n.y, 0.)*fl);   // (stage E: 2.6 for 4.6: a flier's underside is a dark body warmed from below, never an orange flake that could be taken for a brand)   // (the upper side a deep blue: at 0.15 of the sky's light it stood pale against the night)
  // a shape in the water is wet: the night's blue and the fire's light glance off its back and its head (optics)
  col += (uAmbSky*.16 + uFire*(.30*wE*(.3 + .7*toward)))*(fres*up*step(1.5, uKind)*(1. - vA.z));
  // a sail is a thin skin: the fire's light stands in it (most where it is seen toward the fire: optics)
  col = mix(col, vec3(.14, .07, .05)*wLitF(n, vL, .5, 3.) + uFire*(.42*wE*(.25 + .75*toward)), vA.z*.9);
  col = col*(1. - vF.a) + vF.rgb;                                            // the air between: mist, haze, the low air's glow, the part's veil
#ifdef MIRROR
  gl_FragColor = vec4(col*(.55*cover), cover);                              // (stage F: an image in water is darker than its source)
#else
  gl_FragColor = vec4(col, 1.);
#endif
}`;
const TAIL_GLSL = /* glsl */`
void lifeOut(vec3 wp, vec3 n){
  vec3 wa = wp;
#ifdef MIRROR
  wp.y = 2.*W_LEVEL - wp.y;
#endif
  vW = wp; vN = n; vL = fcrLight(wa);
  vec4 air = wAir(wa, vL, 0.);
#ifndef MIRROR
  if (wa.z - fcrFront(wa.x) < 330.) { vec4 vl = fcrSmokeVeil(cameraPosition, wa); air = vec4(vl.rgb*(1. - air.a) + air.rgb, 1. - (1. - vl.a)*(1. - air.a)); }
#endif
  vF = air; vA = vec3(0.);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const RUNNER_VERT = /* glsl */`
attribute vec4 aB, rA, rB; attribute vec3 aH;
// rA: its lane's row, its start along the lane (m), its place to the lane's right (m), its size. rB: strides a second, stride phase, seed, the lane's length (m)
uniform sampler2D uLanes;
varying vec3 vW, vN; varying vec4 vL, vF; varying vec3 vA;
vec4 lanePt(float row, float i){ return texelFetch(uLanes, ivec2(int(i), int(row)), 0); }
` + TAIL_GLSL + /* glsl */`
void main(){
  float size = rA.w;
  float s = mod(rA.y + ${LIFE.run.toFixed(1)}*uFcrT, rB.w), f = s/${LIFE.step.toFixed(1)}, i0 = floor(f), fk = f - i0;    // its place: start + speed x the world clock, wrapped
  vec4 a = lanePt(rA.x, i0), b = lanePt(rA.x, i0 + 1.), c = lanePt(rA.x, i0 + 2.);
  vec3 pos = mix(a.xyz, b.xyz, fk); vec2 fw = normalize(mix(b.xz - a.xz, c.xz - b.xz, fk) + vec2(1e-5, 0.)), rt = vec2(-fw.y, fw.x);
  pos.xz += rt*rA.z; pos.y -= ${LIFE.wade.toFixed(2)}*mix(a.w, b.w, fk)*min(size, 1.);                 // in water it wades
  float ph = fract(uFcrT*rB.x + rB.y);                                        // the stride's phase
  vec3 p = position;
  if (aB.x > .5) {
    // a leg: the foot is planted for 0.42 of the stride and goes back under the body exactly as fast as the body
    // goes on (stride length = speed / stride rate), then is carried forward; the knee follows by the two bones
    float lp = fract(ph + (aB.y < .5 ? 0. : aB.y < 1.5 ? .5 : aB.y < 2.5 ? .75 : .25));
    float reach = .42*${LIFE.run.toFixed(1)}/(rB.x*size);
    vec2 F;
    if (lp < .42) F = vec2(reach*(.5 - lp/.42), 0.);
    else { float t = (lp - .42)/.58, e = t*t*(3. - 2.*t); F = vec2(reach*(e - .5), .46*sin(3.1416*t)*(1. - .3*t)); }
    vec2 H = vec2(0., ${RUNNER.hipY.toFixed(2)}), dv = F - H; float d = clamp(length(dv), .5, ${(RUNNER.upper + RUNNER.lower - 0.02).toFixed(2)}); vec2 dir = dv/max(length(dv), 1e-3);
    F = H + dir*d;
    float al = (${(RUNNER.upper * RUNNER.upper - RUNNER.lower * RUNNER.lower).toFixed(4)} + d*d)/(2.*d), hh = sqrt(max(${(RUNNER.upper * RUNNER.upper).toFixed(4)} - al*al, 0.));
    vec2 K = H + dir*al + vec2(dir.y, -dir.x)*hh, J = aB.z < .5 ? H : aB.z < 1.5 ? K : F;
    p = vec3(aH.x + J.x, J.y, aH.z) + position;
  } else p.y += .035*sin(12.566*ph);                                          // the back nearly level
  p *= size;
  vec3 n = normal;
  lifeOut(pos + vec3(fw.x, 0., fw.y)*p.x + vec3(0., p.y, 0.) + vec3(rt.x, 0., rt.y)*p.z, vec3(fw.x, 0., fw.y)*n.x + vec3(0., n.y, 0.) + vec3(rt.x, 0., rt.y)*n.z);
#ifdef MIRROR
  if (mix(a.w, b.w, fk) < .02) gl_Position = vec4(0., 0., 2., 1.);           // (a double only where it wades)
#endif
}`;
const FLIER_VERT = /* glsl */`
attribute vec4 aB, fA, fB;
// fA: its lane, its start along it (m), its place across (m) and up (m) in the band. fB: half span (m), beats a second, phase, its own cycle (s)
uniform vec4 uFlA[8], uFlB[8];    // a lane: its north end x, z and its heading; its height, the crowns' height at its ends, its length
varying vec3 vW, vN; varying vec4 vL, vF; varying vec3 vA;
` + TAIL_GLSL + /* glsl */`
void main(){
  int li = int(fA.x + .5); vec4 A = uFlA[li], B = uFlB[li];
  float s = mod(fA.y + ${LIFE.fly.toFixed(1)}*uFcrT, B.z);
  vec2 fw = A.zw, rt = vec2(-fw.y, fw.x);
  float up = smoothstep(0., 170., s)*(1. - smoothstep(B.z - 170., B.z, s));          // it rises out of the crowns at the lane's north end and sinks into them at its south end
  vec2 xz = A.xy + fw*s + rt*(fA.z + 5.*sin(s*.011 + fB.z*30.));
  vec3 pos = vec3(xz.x, mix(B.y, B.x + fA.w + 2.*sin(s*.017 + fB.z*50.), up), xz.y);
  float hs = fB.x, sc = hs/2.5;
  float cyc = fract(uFcrT/fB.w + fB.z*3.7), glide = smoothstep(0., .05, cyc)*(1. - smoothstep(.27, .33, cyc));   // it glides about three tenths of its cycle
  float wb = 6.2832*(uFcrT*fB.y + fB.z), a1 = mix(.72*sin(wb), .13, glide), a2 = a1 + mix(.6*sin(wb - 1.1), .08, glide);
  vec3 p = position*sc, n = normal;
  if (aB.x > 1.5 && aB.x < 2.5) {
    float inner = min(aB.z, .45), outer = max(aB.z - .45, 0.);              // the bending joint at 0.45 of the half span
    p = vec3(position.x*sc, (sin(a1)*inner + sin(a2)*outer)*hs + .04*sc, aB.y*(cos(a1)*inner + cos(a2)*outer)*hs);
    n = vec3(0., cos(a1), -aB.y*sin(a1));
  } else if (aB.x > 2.5) p.y += sc*.16*aB.z*sin(uFcrT*5. + fB.z*20. - aB.z*4.);
  lifeOut(pos + vec3(fw.x, 0., fw.y)*p.x + vec3(0., p.y, 0.) + vec3(rt.x, 0., rt.y)*p.z, vec3(fw.x, 0., fw.y)*n.x + vec3(0., n.y, 0.) + vec3(rt.x, 0., rt.y)*n.z);
}`;
const SWIM_VERT = /* glsl */`
attribute vec4 aB, sA, sB;
// sA: its home x, the water's level, its home z, its length (m). sB: its loop's radius (m), its speed (m/s), phase, its own period (s)
varying vec3 vW, vN; varying vec4 vL, vF; varying vec3 vA;
` + TAIL_GLSL + /* glsl */`
void main(){
  float len = sA.w, th = uFcrT*sB.y*1.8/max(sB.x, .5) + sB.z*6.2832;
  vec2 c = vec2(cos(th), sin(th)), fw = normalize(vec2(-c.y, .7*c.x)), rt = vec2(-fw.y, fw.x);
  vec3 pos = vec3(sA.x + c.x*sB.x, sA.y, sA.z + .7*c.y*sB.x);
  vec3 p = position*len, n = normal;
  float dip = smoothstep(.72, 1., .5 + .5*sin(6.2832*(uFcrT/sB.w + sB.z)));  // it dips its sail on its own period
  if (aB.x > 1.5) { p.z += len*.04*aB.z*sin(uFcrT*2.3 + sB.z*40. - aB.z*3.); if (aB.y > .5) p.y = mix(p.y, min(p.y, .02*len), dip); }   // the tail sculls
  p.y -= .015*len*dip;
  if (aB.x < .5) { float nod = sin(uFcrT*1.7 + sB.z*31.), hi = smoothstep(.02, .14, position.y); p.x += len*.035*nod*hi; p.y -= len*.02*nod*hi; }   // (stage E: the neck works to and fro with its stroke: a moving neck, never a post)
  lifeOut(pos + vec3(fw.x, 0., fw.y)*p.x + vec3(0., p.y, 0.) + vec3(rt.x, 0., rt.y)*p.z, vec3(fw.x, 0., fw.y)*n.x + vec3(0., n.y, 0.) + vec3(rt.x, 0., rt.y)*n.z);
  vA.z = step(1.5, aB.x)*step(.5, aB.y);                                      // its sail
}`;
// a swimmer's wake and rings on the water: one flat card behind and round it, a little light on the dark water
const WAKE_VERT = /* glsl */`
attribute vec2 aQ; attribute vec4 sA, sB;
varying vec2 vQ; varying vec4 vK; varying vec3 vW;
void main(){
  float len = sA.w, th = uFcrT*sB.y*1.8/max(sB.x, .5) + sB.z*6.2832;
  vec2 c = vec2(cos(th), sin(th)), fw = normalize(vec2(-c.y, .7*c.x)), rt = vec2(-fw.y, fw.x);
  vec3 pos = vec3(sA.x + c.x*sB.x, sA.y + .04, sA.z + .7*c.y*sB.x);
  vec2 q = vec2(mix(-3.4, .9, aQ.x), (aQ.y - .5)*2.6)*len;                    // metres ahead of its middle, metres to its right
  vec3 wp = pos + vec3(fw.x, 0., fw.y)*q.x + vec3(rt.x, 0., rt.y)*q.y;
  vQ = q/len; vK = vec4(len, sB.z, sB.w, sB.y); vW = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const WAKE_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vK; varying vec3 vW;
void main(){
  float x = vQ.x, z = abs(vQ.y), back = max(.45 - x, 0.);                    // metres (in lengths) behind its fore end
  float wz = (z - .12 - .30*back)/(.035 + .03*back), arm = exp(-wz*wz)*smoothstep(0., .25, back)*exp(-back*.5);   // the V of its wake
  float rip = .5 + .5*sin(back*26. - uFcrT*3.);
  float r = length(vec2(x - .45, vQ.y)), ph = fract(uFcrT/max(vK.z, .1) + vK.y), wr = (r - ph*1.2)/.035;       // rings from its stalks, on its own period
  float ring = exp(-wr*wr)*(1. - ph)*step(r, 1.25);
  float m = 1.5*arm*(.55 + .45*rip) + .7*ring;
  if (m < .01) discard;
  vec4 Lf = fcrLight(vW); float dist = length(vW - cameraPosition);
  vec3 col = min((uAmbSky*.34 + uFire*(.85*wFar(Lf.w)))*m, vec3(${LIFE.spray.toFixed(2)}))*(1. - wFogAt(dist));
  gl_FragColor = vec4(col, 0.);
}`;
// a wading runner's spray: one card at its feet, turned to the eye about the upright (optics); a splash at each
// footfall, thrown up and back and gone within half a stride; where the lane is dry there is none
const SPRAY_VERT = /* glsl */`
attribute vec2 aQ; attribute vec4 rA, rB;
uniform sampler2D uLanes;
varying vec2 vQ; varying vec4 vK; varying vec3 vW;
vec4 lanePt(float row, float i){ return texelFetch(uLanes, ivec2(int(i), int(row)), 0); }
void main(){
  float size = rA.w;
  float s = mod(rA.y + ${LIFE.run.toFixed(1)}*uFcrT, rB.w), f = s/${LIFE.step.toFixed(1)}, i0 = floor(f), fk = f - i0;
  vec4 a = lanePt(rA.x, i0), b = lanePt(rA.x, i0 + 1.);
  vec3 pos = mix(a.xyz, b.xyz, fk); vec2 fw = normalize(b.xz - a.xz + vec2(1e-5, 0.)), rt = vec2(-fw.y, fw.x);
  float wet = mix(a.w, b.w, fk);
  pos.xz += rt*rA.z - fw*(.5*size);
  vec3 ey = cameraPosition - pos; vec2 r = normalize(vec2(ey.z, -ey.x) + vec2(1e-5, 0.));
  vec3 wp = pos + vec3(r.x, 0., r.y)*(aQ.x*3.4*size) + vec3(0., aQ.y*1.8*size, 0.);   // (low: at the legs, never a veil before the body)
  vQ = aQ; vK = vec4(fract(uFcrT*rB.x + rB.y), rB.z, wet, size); vW = wp;
  gl_Position = wet > .02 ? projectionMatrix*viewMatrix*vec4(wp, 1.) : vec4(0., 0., 2., 1.);
}`;
const SPRAY_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vK; varying vec3 vW;
void main(){
  // four footfalls to a stride, each a fan of drops thrown up and back, and the torn white at the legs
  float m = 0.;
  for (int k = 0; k < 4; k++){
    float lp = fract(vK.x + float(k)*.25 + .08), t = lp/.5, on = step(lp, .5);
    vec2 c = vec2((float(k) - 1.5)*.22 + .1*fract(vK.y*7.3 + float(k)*.37), 0.), q = vQ - c; q.x *= 1.1;
    float rr = length(q*vec2(1., .9)), an = atan(q.y, abs(q.x) + 1e-3);
    float drops = smoothstep(.6, .92, fcrN3(vec3(an*7. + vK.y*30. + float(k)*5., rr*9. - t*5., 2.)));
    m += on*(1. - t)*(1. - smoothstep(.0, .2*(t + .25), abs(rr - .42*sqrt(max(t, 0.)))))*step(0., q.y)*drops;
  }
  m += .16*(1. - smoothstep(0., .5, abs(vQ.x)))*(1. - smoothstep(0., .16, vQ.y))*smoothstep(.45, .8, fcrN3(vec3(vW.xz*3.1, uFcrT*2.)));
  m *= vK.z*(1. - smoothstep(.7, 1., abs(vQ.x)))*(1. - smoothstep(.75, 1., vQ.y));
  if (m < .012) discard;
  vec4 Lf = fcrLight(vW); float dist = length(vW - cameraPosition);
  vec3 col = min((uAmbSky*.10 + uFire*(.62*wFar(Lf.w)))*m, vec3(${LIFE.spray.toFixed(2)}))*(1. - wFogAt(dist));
  gl_FragColor = vec4(col, 0.);
}`;
// ---------- the lanes: where the runners' files go (laid before the forest is dealt, so that nothing stands on one) ----------
export async function layLanes(env) {
  const { plan, way, pause, PLAN, trailE } = env, TR = PLAN.trail, D2R = Math.PI / 180;
  const lineD = plan.lineD, w1 = plan.Nt, STEP = LIFE.step, OUT = Math.max(...TR.lanes.map(Math.abs));
  // a rounded line through plan points (E, N), walked in even steps
  const walk = (pts, step) => {
    const q = (i) => pts[clamp(i, 0, pts.length - 1)], fine = [];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 8; k++) {
      const t = k / 8, p0 = q(i - 1), p1 = q(i), p2 = q(i + 1), p3 = q(i + 2), c = [0, 0];
      for (let j = 0; j < 2; j++) c[j] = 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t);
      fine.push(c);
    }
    fine.push(pts[pts.length - 1]);
    const out = [fine[0]]; let need = step;
    for (let i = 1; i < fine.length; i++) {
      let a = fine[i - 1]; const b = fine[i]; let d = hyp(b[0] - a[0], b[1] - a[1]);
      while (d >= need) { const f = need / d; a = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; out.push(a); d -= need; need = step; }
      need -= d;
    }
    return out;
  };
  // how far from the part's line a lane must begin at a place: 150 m before the fuse belt (which is deeper in the set piece's ground)
  const fromAt = (E, N) => (plan.setPiece(E, N) >= 0.5 ? PLAN.cross.from : PLAN.cross.from0);
  // A RUNNERS' LANE: from its fire end to its far end. It begins no nearer the part's line than that and under the
  // crowns; it may end at a water's edge under them. Every place of it knows whether it lies in water (the runner
  // wades there, and throws spray).
  const lanes = [];
  const lane = (planPts, o = {}) => {
    let pts = walk(planPts, STEP), k = 0;
    while (k < pts.length - 40 && lineD(plan.wx(pts[k][0]), plan.wz(pts[k][1])) < fromAt(pts[k][0], pts[k][1])) k++;
    let more = 0; while (k < pts.length - 40 && more < 70 && plan.cover(pts[k][0], pts[k][1]) < 0.9) { k++; more++; }   // (and under the plants: not on a bank's open edge)
    pts = pts.slice(k);
    let end = pts.length; while (end > 44 && plan.cover(pts[end - 1][0], pts[end - 1][1]) < 0.9) end--;   // (and its far end under them)
    pts = pts.slice(0, end);
    if (plan.cover(pts[0][0], pts[0][1]) < 0.9 || plan.cover(pts[pts.length - 1][0], pts[pts.length - 1][1]) < 0.9) return null;   // a lane that cannot begin and end under the plants is not laid
    if (o.toWater) { const j = pts.findIndex((p, i) => i > 12 && plan.watAt(p[0], p[1]) < 5); if (j > 0) pts = pts.slice(0, j); }
    const world = pts.map((p) => { const x = plan.wx(p[0]), z = plan.wz(p[1]), w = plan.watAt(p[0], p[1]); return [x, plan.groundAt(x, z) + 0.03, z, smoothstep(0.3, -1.2, w), o.keep || 0]; });
    const l = { plan: pts, world, length: (pts.length - 1) * STEP, kind: o.kind || 'far', n: o.n || 20, herd: !!o.herd, away: o.away || 0, startD: lineD(world[0][0], world[0][2]), startCover: plan.cover(pts[0][0], pts[0][1]), endCover: plan.cover(pts[pts.length - 1][0], pts[pts.length - 1][1]), wet: +(world.reduce((a, w) => a + w[3], 0) / world.length).toFixed(2), note: o.note };
    lanes.push(l); return l;
  };
  // DOWN THE RIVER a file keeps its own line (the plan's law of the files: on the bars and through the shallows
  // either side of the route's line); south of the entry it leaves the water on its own side and ends under the plants
  const downRiver = (pts, e, from) => {
    const s = e < 0 ? -1 : 1, far = Math.abs(e) > OUT - 1;
    for (let v = from; v >= 130; v -= 10) pts.push(plan.legPt(v, trailE(e, v)));
    if (far) pts.push([e + s * 14, 96], [e + s * 44, 56], [s * 104, 22], [s * 150, -6], [s * 200, -20]);
    else pts.push([e + s * 3, 96], [e + s * 16, 52], [s * 52, 6], [s * 96, -34], [s * 150, -60], [s * 200, -72]);
    return pts;
  };
  // THE FILES COME OVER THE DROWNED SHALLOWS INTO THE RIVER, AWAY FROM THE FIRE. Each of the river's four files begins
  // under the plants beyond the shallows, north of the river's mouth, wades out over the shallows and goes down the
  // river; together they fan out from the mouth (the files toward the east pass under the route's line as it turns).
  // A file's line out from the mouth is tried on its own bearing, then on bearings farther round (the western files
  // to the west, the eastern to the east), until it reaches the plants beyond the shallows without coming nearer the
  // part's line than a lane may begin; no file's bearing passes its outer neighbour's, so none crosses another.
  const mouthN = w1 - 30, fan = [[TR.lanes[0], -80], [TR.lanes[1], -52], [TR.lanes[2], 8], [TR.lanes[3], 40]], H = fan.length / 2;
  // where a file's line leaves the mouth: at its own place across the river; the files that turn into it last pass north of those that turn first
  const leave = (e, b) => { const bb = b * D2R + plan.a0, dE = Math.sin(bb), dN = Math.cos(bb), o = plan.legPt(mouthN + 26 + 1.15 * Math.abs(Math.sin(b * D2R)) * (b < 0 ? e + OUT : OUT - e), e * 1.15); return { dE, dN, oE: o[0], oN: o[1] }; };   // (bearings from the river's own heading at its mouth)
  const reach = (e, b) => {
    const r = leave(e, b);
    for (let s = 30; s <= 560; s += 10) { const E = r.oE + r.dE * s, N = r.oN + r.dN * s; if (plan.lineG(E, N) < fromAt(E, N) + 4) return null; if (s >= 50 && plan.watBase(E, N) > 22) { r.s = s; return r; } }
    return null;
  };
  // FAILING THAT (the river's mouth itself lies nearer the part's line than a lane may begin): the file comes out of
  // the plants of its own bank farther down the river, where a lane may begin, and slants into the water to its line.
  // The inner file of a bank comes out upstream of the outer and has crossed the outer's line before the outer is there.
  const fromBank = (e) => {
    const s = e < 0 ? -1 : 1, inner = Math.abs(e) < OUT - 1;
    const at = (v) => plan.legPt(v, plan.cAt(v) + s * (plan.hwAt(v) + 44));
    for (let v = mouthN - 20; v >= 420; v -= 10) {
      const b = at(v), b2 = at(v + 30);
      if (plan.lineG(b[0], b[1]) < fromAt(b[0], b[1]) + 4 || plan.lineG(b2[0], b2[1]) < fromAt(b2[0], b2[1]) + 4 || plan.cover(b[0], b[1]) < 0.9 || plan.cover(b2[0], b2[1]) < 0.9) continue;
      const v0 = inner ? v : v - 70, q = (dv, f) => plan.legPt(v0 - dv, (1 - f) * (plan.cAt(v0 - dv) + s * (plan.hwAt(v0 - dv) + 44)) + f * trailE(e, v0 - dv));
      return { pts: [at(v0 + 30), at(v0), q(22, 0.3), q(44, 0.72), q(62, 0.94)], from: v0 - 72 };
    }
    return null;
  };
  const got = new Array(fan.length).fill(null);
  const find = (k, step, lo, hi) => {
    const [e, b0] = fan[k];
    for (let n = 0; n < 9; n++) { const b = clamp(b0 + step * n, lo, hi), r = reach(e, b); if (r) { r.b = b; return r; } if (b === lo && step < 0 || b === hi && step > 0) break; }
    return null;
  };
  for (let k = 0, lo = -110; k < H; k++) { got[k] = find(k, -20, lo, 110); if (got[k]) lo = got[k].b; }
  for (let k = fan.length - 1, hi = 110; k >= H; k--) { got[k] = find(k, 20, -110, hi); if (got[k]) hi = got[k].b; }
  for (let k = 0; k < fan.length; k++) {
    const e = fan[k][0], outer = Math.abs(e) > OUT - 1; let r = got[k];
    const nb = r ? null : got.map((q, j) => [q, Math.abs(j - k)]).filter((q) => q[0] && Math.sign(fan[got.indexOf(q[0])][0]) === Math.sign(e)).sort((x, y) => x[1] - y[1])[0];
    if (!r && nb) { r = reach(e, nb[0].b); if (r) r.b = nb[0].b; }                       // (its own side's neighbour's bearing, if that reaches)
    if (!r) { const fb = fromBank(e); if (fb) { lane(downRiver(fb.pts, e, fb.from), { kind: outer ? 'bank' : 'river', n: outer ? 44 : 36, herd: outer, away: -Math.sign(e) * plan.m, note: 'out of its own bank ' + Math.round(w1 - fb.from) + ' m below the mouth' }); await pause(); continue; } }
    if (!r) { const near = got.map((q, j) => [q, Math.abs(j - k)]).filter((q) => q[0]).sort((a, b) => a[1] - b[1])[0]; const b = near ? near[0].b : -80; r = reach(e, b) || leave(e, b); r.b = b; if (!r.s) r.s = 150; }   // (failing all, its neighbour's bearing; the lane's own rule then trims its beginning)
    const pts = []; for (let s = r.s + 88; s > 0; s -= 44) pts.push([r.oE + r.dE * s, r.oN + r.dN * s]);
    pts.push([r.oE, r.oN]);
    lane(downRiver(pts, e, w1 - 60), { kind: outer ? 'bank' : 'river', n: outer ? 50 : 42, herd: outer, away: -Math.sign(e) * plan.m, note: 'over the shallows on bearing ' + Math.round(r.b) });
    await pause();
  }
  // two along the moat's near shore, WADING ITS SHALLOWS (stage D: 7 and 13 m out from the shore's drawn line), through
  // the channel's water under the route's line, and away under the crowns on the side away from the fire
  const mo = PLAN.moat, KK = PLAN.K, L2 = (a, c) => plan.fromLocal(a, c);
  for (let k = 0; k < 2; k++) {
    const a = mo.a[0] + 7 + 6 * k, pts = [];
    for (let c = -260; c <= 70; c += 30) pts.push(L2(a, c * KK));
    pts.push(L2(a - 12, 118 * KK), L2(a - 50, 162 * KK), L2(a - 125, 188 * KK), L2(a - 230, 200 * KK), L2(a - 330, 205 * KK));
    const l = lane(pts, { kind: 'shore', n: 26 });
    // Where the shore toward the fire lies nearer the part's line than a lane may begin, that file would wade nowhere:
    // then it comes out of the plants west of the near shore on the side away from the fire instead, wades the
    // lagoon's shallows across its near corner (40 to 95 m out) and leaves by the side shore, away from the fire
    if (!l || l.wet < 0.2) {
      if (l) lanes.splice(lanes.indexOf(l), 1);
      const a0 = mo.a[0], c0 = 96 + 12 * k;
      lane([L2(a0 - 170, c0), L2(a0 - 90, c0), L2(a0 - 20, c0), L2(a0 + 40, c0 + 10), L2(a0 + 92 - 8 * k, 130 + 8 * k), L2(a0 + 120 - 10 * k, 172 + 6 * k), L2(a0 + 135 - 10 * k, 214 + 4 * k), L2(a0 + 150, 290), L2(a0 + 160, 410)], { kind: 'shore', n: 22, note: "across the lagoon's near corner, away from the fire" });
    }
  }
  // one across the channel before the moat, where the plan found its way
  if (plan.lastCross) { const c = plan.lastCross, at = (s) => [c.E + c.dE * s, c.N + c.dN * s]; lane([at(-c.back - 40), at(-c.back), at(-0.5 * c.back), at(0), at(75), at(150), at(195)], { kind: 'last', n: 22 }); }
  // one far off, along the outflow's bank
  lane([L2(mo.a[1] + 40, mo.c[1] + 160), L2(mo.a[1] + 160, mo.c[1] + 560), L2(mo.a[1] + 196, mo.c[1] + 1100), L2(mo.a[1] + 210, mo.c[1] + 1700)], { kind: 'far', n: 12 });
  await pause();
  // FILES ACROSS THE SHALLOWS OF THE RUN (stage D), where the plan found their ways (see there): out of the plants
  // farther along the front, aslant over the lit water between the route's line and the wall, under the route's line
  // and away from the fire into the plants of the far bank. Up to three, 60 m and more apart where they pass under
  // the route's line; none is laid within a square of 12 m of another file's line (no two files cross; files side
  // by side keep 12 m and more between their lines). One runner to every 27 m of each; no plant stands within 12 m of such a file's line.
  {
    const occ = new Set(), key = (i, j) => (i + 4096) * 8192 + j + 4096;
    const mark = (pts) => { for (const q of pts) { const i = Math.floor(q[0] / 12), j = Math.floor(q[1] / 12); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) occ.add(key(i + a, j + b)); } };
    for (const l of lanes) mark(l.plan);
    const mid = 0.5 * (way.runIn + way.turn2Start), all = plan.crossRunAll || [];
    const cells = (c) => { const out = []; for (let u = -c.back - 30; u <= c.on + 70; u += 8) out.push([c.E + c.dE * u, c.N + c.dN * u]); return out; };
    // (the ways are tried in three orders: nearest the run's middle first, from the run's beginning, from its end;
    // the order that lays the most files is taken, the earlier order where two lay as many)
    const tryOrder = (cands, why) => {
      const mine = new Set(), took = [];
      for (const c of cands) {
        if (took.length >= 3) break;
        if (took.some((o) => Math.abs(o.w - c.w) < 60)) continue;
        const pts = cells(c);
        const hitO = pts.filter((q) => occ.has(key(Math.floor(q[0] / 12), Math.floor(q[1] / 12)))), hitM = pts.some((q) => mine.has(key(Math.floor(q[0] / 12), Math.floor(q[1] / 12))));
        if (hitO.length || hitM) { if (why && hitO.length) why.push([Math.round(c.w), c.slant * c.sense, hitO.map((q) => lanes.findIndex((l) => l.plan.some((p) => Math.abs(p[0] - q[0]) < 26 && Math.abs(p[1] - q[1]) < 26))).filter((v, i, a) => a.indexOf(v) === i).join('/')]); continue; }
        for (const q of pts) { const i = Math.floor(q[0] / 12), j = Math.floor(q[1] / 12); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) mine.add(key(i + a, j + b)); }
        took.push(c);
      }
      return took;
    };
    let best = [];
    for (const order of [all.slice().sort((a, b) => Math.abs(a.w - mid) - Math.abs(b.w - mid) || a.slant - b.slant), all.slice().sort((a, b) => a.w - b.w || a.slant - b.slant), all.slice().sort((a, b) => b.w - a.w || a.slant - b.slant)]) { const t = tryOrder(order); if (t.length > best.length) best = t; }
    let laid = 0;
    for (const c of best) {
      const at = (u) => [c.E + c.dE * u, c.N + c.dN * u];
      const l = lane([at(-c.back - 30), at(-c.back), at(-0.5 * c.back), at(0), at(0.5 * c.on), at(c.on), at(c.on + 70)], { kind: 'run', n: 24, keep: LIFE.runKeep, note: 'under the route at way ' + Math.round(c.w) + ', ' + c.crossesFromLine + ' m from the line; never nearer it than ' + c.leastFromLine + ' m; slant ' + c.slant * c.sense });
      if (l) { l.n = clamp(Math.round(l.length / LIFE.runEvery), 14, 24); laid++; }
    }
    const why = []; tryOrder(all.slice().sort((a, b) => a.w - b.w || a.slant - b.slant), why);   // (how many of the ways found would cross another file's line)
    lanes.runWays = { found: all.length, at: [...new Set(all.map((c) => c.w))].sort((a, b) => a - b).map(Math.round), laid, wouldCrossAnotherFile: why.length };
  }
  await pause();
  // where the lanes run, for whoever lays things on the ground: metres from a place to the nearest lane's line
  // (a file across the shallows keeps the plants farther off: its line counts as 9 m nearer than it is)
  const laneCells = new Map(), lk = (i, j) => (i + 4096) * 8192 + (j + 4096);
  for (const l of lanes) for (const w of l.world) { const k = lk(Math.floor(w[0] / 8), Math.floor(w[2] / 8)); let c = laneCells.get(k); if (!c) laneCells.set(k, (c = [])); c.push(w); }
  const laneNear = (x, z) => { let m = 16; const i = Math.floor(x / 8), j = Math.floor(z / 8); for (let a = i - 2; a <= i + 2; a++) for (let b = j - 2; b <= j + 2; b++) { const c = laneCells.get(lk(a, b)); if (c) for (const w of c) { const d = hyp(w[0] - x, w[2] - z) - w[4]; if (d < m) m = d; } } return Math.max(m, 0); };
  return { lanes, laneNear };
}

// what is drawn doubled in the water's face is drawn straight after the land, against the land's depth alone (the
// forest part's own way: only what lies beyond the water's face along the eye's ray, and there only where it is water)
const mirrorMat = (o) => new THREE.ShaderMaterial({ ...o, defines: { MIRROR: 1 }, side: THREE.DoubleSide, transparent: false, depthWrite: false, depthFunc: THREE.GreaterDepth,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });

// ---------- the deal ----------
export async function buildLife(env) {
  const { plan, way, U, forks, deal, detail, pause, routePts, glsl, PLAN } = env;
  const group = new THREE.Group(); group.name = 'life';
  const head = glsl.front + glsl.noise + glsl.ramp + glsl.mirror + glsl.world + glsl.air, headM = head + glsl.water, STEP = LIFE.step, { lanes, laneNear } = env.lanes || (await layLanes(env));
  const inst = (g, name, arr) => g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
  // the lanes as one small table for the shader: a row to a lane, a place every 4 m
  const TW = Math.max(4, ...lanes.map((l) => l.world.length)) + 3, table = new Float32Array(TW * Math.max(1, lanes.length) * 4);
  lanes.forEach((l, row) => { const n = l.world.length; for (let i = 0; i < TW; i++) { const j = Math.min(i, n - 1), w = l.world[j], o = (row * TW + i) * 4, ex = i - j, p = l.world[n - 2]; table[o] = w[0] + (w[0] - p[0]) * ex; table[o + 1] = w[1]; table[o + 2] = w[2] + (w[2] - p[2]) * ex; table[o + 3] = w[3]; } });
  const laneTex = new THREE.DataTexture(table, TW, Math.max(1, lanes.length), THREE.RGBAFormat, THREE.FloatType);
  laneTex.magFilter = laneTex.minFilter = THREE.NearestFilter; laneTex.generateMipmaps = false; laneTex.needsUpdate = true;

  // THE RUNNERS: loose files. Groups of 5 to 11 spread along each lane's whole length, 11 to 17 m between animals
  // (each is 9 to 11 m long), now and then two abreast (on a river lane the second runs on the side away from the
  // route's line); neighbours' strides at least a quarter apart; one in five a calf at a grown one's flank.
  const fr = forks.runners, share = (deal.runners / 400) * detail, runners = { near: [], far: [] }, SZ = LIFE.size;
  lanes.forEach((l, row) => {
    let left = Math.max(4, Math.round(l.n * share)), phase = fr(); const groups = Math.max(1, Math.round(left / 8)), per = l.length / groups, s0 = fr() * l.length, list = l.kind === 'river' || l.kind === 'bank' || l.kind === 'run' ? runners.near : runners.far;   // (the full shape down the river and across the shallows of the run; the lighter one along the shore, across the channel and far off)
    l.count = left;
    for (let g = 0; g < groups && left > 0; g++) {
      const size = g === groups - 1 ? left : Math.min(left, 5 + Math.floor(fr() * 7)); let s = s0 + g * per + fr.range(-0.2, 0.2) * per;
      for (let i = 0; i < size && left > 0; i++) {
        // (stage F: THE HERD: the outer file of each bank down the river, 24 m from the route's line, is the greatest: twice as many, a seventh greater, often two abreast)
        const hk = l.herd ? 1.14 : 1, abreast = i > 0 && fr() < (l.herd ? 0.42 : 0.25), sgn = l.away || (fr() < 0.5 ? -1 : 1), side = fr.range(-0.8, 0.8) + (abreast ? sgn * 3.0 * hk : 0); if (!abreast) s += fr.range(11, 17) * hk;
        phase = (phase + 0.25 + 0.5 * fr()) % 1;
        list.push([row, s, side, fr.range(SZ[0], SZ[1]) * hk, fr.range(1.02, 1.24), phase, fr(), l.length]); left--;
        if (left > 0 && fr() < 0.2) { list.push([row, s - 1.2, side + (l.away || (side > 0 ? -1 : 1)) * 2.4, 0.82, 1.7, (phase + 0.3 + 0.4 * fr()) % 1, fr(), l.length]); left--; i++; }
      }
    }
  });
  const tri = { runners: 0, doubles: 0, spray: 0, fliers: 0, swimmers: 0, wakes: 0 }; let calls = 0;
  const pack = (list) => { const n = list.length, rA = new Float32Array(n * 4), rB = new Float32Array(n * 4); list.forEach((r, i) => { rA.set(r.slice(0, 4), i * 4); rB.set(r.slice(4), i * 4); }); return { n, rA, rB }; };
  for (const [key, near] of [['near', true], ['far', false]]) {
    const { n, rA, rB } = pack(runners[key]); if (!n) continue;
    const sh = SHAPES.runnerGeo(near, deal.quill, deal.tuft);
    inst(sh.geometry, 'rA', rA); inst(sh.geometry, 'rB', rB); sh.geometry.instanceCount = n;
    const m = new THREE.Mesh(sh.geometry, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uLanes: { value: laneTex }, uKind: { value: 0 } }, vertexShader: head + RUNNER_VERT, fragmentShader: head + ANIMAL_FRAG }));
    m.name = 'runners-' + key; m.frustumCulled = false; group.add(m); tri.runners += sh.triangles * n; calls++;
  }
  {
    const { n, rA, rB } = pack(runners.near.concat(runners.far));
    if (n) {
      // EVERY WADING RUNNER DOUBLED IN THE WATER (stage D): its outline turned over about the water's level, drawn
      // straight after the land and shown only where the eye's ray meets water (as the plants' doubles are)
      const sh = SHAPES.runnerFlat(); inst(sh.geometry, 'rA', rA); inst(sh.geometry, 'rB', rB); sh.geometry.instanceCount = n;
      const dm = new THREE.Mesh(sh.geometry, mirrorMat({ uniforms: { ...U, uLanes: { value: laneTex }, uKind: { value: 0 } }, vertexShader: headM + RUNNER_VERT, fragmentShader: headM + ANIMAL_FRAG }));
      dm.name = 'runners-doubled'; dm.frustumCulled = false; dm.renderOrder = -8.7; group.add(dm); tri.doubles = sh.triangles * n; calls++;
      // the spray of those that wade: one card to a runner
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, 0, 1, 0, 1, 1, -1, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      inst(g, 'rA', rA); inst(g, 'rB', rB); g.instanceCount = n;
      const sp = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...U, uLanes: { value: laneTex } }, vertexShader: head + SPRAY_VERT, fragmentShader: head + SPRAY_FRAG }));
      sp.name = 'spray'; sp.frustumCulled = false; sp.renderOrder = 3; group.add(sp); tri.spray = n * 2; calls++;
    }
  }
  await pause();
  return moreLife(env, { group, head, inst, lanes, runners, tri, calls, laneNear });
}

// ---------- the fliers, the shapes in the water, the clear air ----------
async function moreLife(env, X) {
  const { plan, way, U, forks, deal, detail, pause, PLAN } = env, { group, head, inst, lanes, runners, tri } = X; let calls = X.calls;
  const lineD = plan.lineD, cst = plan.castle, D2R = Math.PI / 180, FL = LIFE.flyLane, ff = forks.fliers;
  // A FLIERS' LANE: a straight band over the land. It begins where the land is 215 m and more from the part's line
  // (150 m before the fuse belt): there the fliers rise out of the crowns; at its far end they sink into them.
  const laneOf = (E0, N0, dE, dN, hLo, hHi, deep, name, back) => {
    const castleAt = (len) => { let m = Infinity; for (let t = 0; t <= len; t += 40) m = Math.min(m, hyp(E0 + dE * t - cst.E, N0 + dN * t - cst.N) - 110 * PLAN.K); return m; };
    return { name, back, castleAt, nearCastle: castleAt(FL), len: FL, hLo, hHi, deep, x0: plan.wx(E0), z0: plan.wz(N0), dx: plan.m * dE, dz: -dN };
  };
  // a lane going on a bearing over a place of the plan: its beginning is found by going back from that place
  const lanePlan = (E, N, bearing, hLo, hHi, name, deep = 7.5) => {
    const dE = Math.sin(bearing * D2R), dN = Math.cos(bearing * D2R); let s = 0;
    while (s < 1300 && lineD(plan.wx(E - dE * (s + 20)), plan.wz(N - dN * (s + 20))) >= LIFE.laneFromLine + 5) s += 20;
    return laneOf(E - dE * s, N - dN * s, dE, dN, hLo, hHi, deep, name, s);
  };
  // a lane's whole band against the route: its breadth and depth, the wander, a wing's reach, the rise at its ends
  const bandLeast = (l, pts) => {
    let least = Infinity;
    for (const p of pts) {
      const rx = p.x - l.x0, rz = p.z - l.z0, s = rx * l.dx + rz * l.dz, lat = Math.abs(rx * -l.dz + rz * l.dx); if (s < -6 || s > l.len + 6) continue;
      const wing = l.wing || LIFE.wing, up = smoothstep(0, 170, s) * smoothstep(l.len, l.len - 170, s), lo = lerp(15, l.h - l.deep - 2, up) - wing, hi = lerp(15, l.h + l.deep + 2, up) + wing;
      const d = hyp(Math.max(lat - l.half - 5 - wing, 0), Math.max(lo - p.y, p.y - hi, 0)); if (d < least) least = d;
    }
    return least;
  };
  // (rules 22 and 23, by construction: stage E) what the forest says of a place: metres to the nearest thing of it that ever burns
  const burnNear = env.forest && env.forest.burnNear ? env.forest.burnNear : () => 999;
  const laneBurn = (l) => { let m = 999; for (let t = 0; t <= l.len; t += 30) m = Math.min(m, burnNear(l.x0 + l.dx * t, l.z0 + l.dz * t) - l.half - 5 - (l.wing || LIFE.wing)); return m; };
  // THE TEST CHOOSES THE PLACE: a lane is taken where its whole band keeps 8 m from the route's line and 150 m from
  // the castle (every lane, those across the route too: stage E); if its drawn place
  // fails it is tried 60 m at a time to either side, and left out if none will do.
  // A lane that meets the route or the castle again farther on is taken shorter (it sinks into the crowns before that).
  // THE GREAT FLIERS KEEP LOW (stage D): the lanes that lie low over the crowns beside the way down, across the run,
  // by the turn from the fire and over the lagoon are theirs (spans of 8 to 14 m, a wing's reach of 7.6 m in the
  // test); the lesser fliers keep the high lanes.
  const dealt = [0, 1, 2, 3, 4, 5, 6, 7].map(() => [ff(), ff.range(15, 25)]);
  const LENS = [FL, 1900, 1400, 1100, 900, 800, 700, 620, 540];
  const place = (make, k, lens = [FL], great = false) => {
    for (const off of [0, 60, -60, 120, -120, 180, 240]) {
      const l = make(off); if (!l) continue;
      l.great = great; l.wing = great ? LIFE.greatWing : LIFE.wing;
      l.h = lerp(l.hLo + l.deep, l.hHi - l.deep, dealt[k][0]); l.half = dealt[k][1];
      for (const len of lens) {
        if (len < l.back + 340) continue;
        l.len = len; l.nearCastle = l.castleAt(len); if (l.nearCastle < (l.castleNeed || 150)) continue;
        l.least = bandLeast(l, env.routePts); l.burn = laneBurn(l);
        if (l.least >= (great ? LIFE.greatKeep : 8) && l.burn >= 30) { l.moved = off; return l; }   // (stage F: a great flier's whole band keeps 25 m from the route's line: a whole animal fits the picture)   // (stage E: and 30 m and more from anything of the forest that ever burns)
      }
    }
    return null;
  };
  // a way for a lane across a stretch of the route, where the plan's search finds one (see there)
  const across = (list, hLo, hHi, deep, name, k) => {
    for (const c of list || []) {
      const l = laneOf(c.E - c.dE * c.back, c.N - c.dN * c.back, c.dE, c.dN, hLo, hHi, deep, name, c.back); l.crossesAtWay = Math.round(c.w); l.beginsFromLine = c.beginsFromLine; l.castleNeed = 150;   // (stage E, the brief's figure for every lane: 150 m and more from the castle)
      const got = place((o) => (o === 0 ? l : null), k, LENS, true); if (got) return got;
    }
    return null;
  };
  // IN THE FIRST THIRD: a ribbon close beside the way down; another to the right of the entry line
  const A = place((o) => lanePlan(-52 - o, 500, 180, 52, 80, 'beside the way down'), 0, [FL], true), B = place((o) => lanePlan(140 + o, 500, 180, 60, 100, 'right of the entry line'), 1);
  await pause();
  // IN THE MIDDLE: low across the run (the plan found its way: it begins farther along the front and crosses the
  // route's line going away from the fire), 16 to 37 m over the lens's highest place there (the great fliers' wings
  // and the band's play within that); failing that, the lane slanting over the river
  let yR = 0; for (let w = way.rideEnd; w <= way.turn2Start; w += 10) yR = Math.max(yR, env.yAt(w));
  const Xl = across(plan.crossFlyAll, yR + 35, yR + 50, 5, 'low across the run', 2);   // (stage F: 40 to 45 m over the lens's highest place there)
  await pause();
  // and a second low across the run, 180 m and more of way from the first, where the plan found another way
  const Xl2 = Xl ? across((plan.crossFlyAll || []).filter((c) => Math.abs(c.w - Xl.crossesAtWay) >= 180), yR + 35, yR + 50, 5, 'low across the run, farther on', 7) : null;
  await pause();
  const C = place((o) => lanePlan(o, 800, 163, 75, 110, 'slanting over the river'), 2);
  await pause();
  // IN THE LAST THIRD: across the turn from the fire and the last leg, 24 to 40 m over the lens there (its way found
  // by the plan likewise). Where the part's line allows none (a lane may not begin so near it), a lane that begins
  // beside that turn on the side away from the fire, under the crowns there, and goes off aslant away from fire and route.
  let yT = 0; for (let w = way.turn2Start; w <= way.shore; w += 10) yT = Math.max(yT, env.yAt(w));
  let Tl = across(plan.crossFly2All, yT + 35, yT + 58, 7.5, 'across the turn from the fire', 3);   // (stage F: 42 to 50 m over the lens there)
  if (!Tl) Tl = place((o) => {
    for (let w = way.turn2Start; w <= way.shore - 20; w += 20) {
      const q = plan.at(w), h = q[2], sd = 52 + Math.abs(o) * 0.5, E = q[0] + Math.cos(h) * sd, N = q[1] - Math.sin(h) * sd, b = h + (55 + (o < 0 ? 20 : 0)) * D2R;
      if (plan.lineG(E, N) < PLAN.cross.fromAir || lineD(plan.wx(E), plan.wz(N)) < PLAN.cross.fromAir || plan.cover(E, N) < 0.5) continue;
      const l = laneOf(E, N, Math.sin(b), Math.cos(b), yT + 30, yT + 54, 6, 'rising beside the turn from the fire', 0); l.castleNeed = 150; l.beginsAtWay = Math.round(w); return l;
    }
    return null;
  }, 3, LENS, true);
  const E5 = place((o) => lanePlan(-340 - o, 500, 180, 85, 125, 'far to the left'), 4);
  // OVER THE LAGOON (stage D): across the last leg between the moat's near shore and the castle's rock, 19 to 36 m
  // over the lens there, going away from the fire (its way found by the plan likewise; never nearer the castle than 150 m:
  // a way that comes nearer is refused, and on the 25 seeds tested every way of the plan's does, so no lane is laid here)
  let yM = 0; for (let w = way.shore; w <= way.shore + 130; w += 10) yM = Math.max(yM, env.yAt(w));
  const Lg = across(plan.crossFly3All, yM + 19, yM + 36, 6, 'over the lagoon', 5);
  // ACROSS THE WAY DOWN (stage D): over the river where the lens comes down to the water (290 m of way from the
  // entry), aslant from the fire's side, 52 to 66 m up (over the common crowns; the lens is 25 m and more under it
  // there): from the entry the great fliers are seen ahead at the lens's own height, crossing the river
  const Dn = place((o) => lanePlan(o, PLAN.n0 + 290, 216, 52, 66, 'across the way down', 5), 6, LENS, true);
  await pause();
  const want = deal.flierLanes, midL = Xl || C, lastL = Tl || E5;
  const fl = [...new Set((want >= 5 ? [A, B, midL, lastL, Xl ? C : E5] : want === 4 ? [A, B, midL, lastL] : [A, midL, lastL]).concat([Lg, Dn, Xl2]).filter((l) => l))].slice(0, 8);
  // the lesser fliers: the dealt number shared among the lanes the visit deals (as before), each high lane taking its
  // share (72 at the most); the great: one to every 48 m of each low lane. Thick and thin by turns along every lane.
  const per = Math.min(72, Math.round((deal.fliers * detail) / Math.max(3, Math.min(want, 5)))), small = [], great = [];
  fl.forEach((l, li) => {
    const n = l.great ? Math.max(8, Math.round((l.len / (l === Tl ? 30 : LIFE.greatEvery)) * detail)) : per, LL = l.len; l.count = n;   // (stage E: the lane by the turn from the fire carries the most: the turn's own event)
    for (let i = 0; i < n; i++) {
      let s0 = ff() * LL;
      for (let t = 0; t < 6 && ff() > 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s0 / 190 + li * 2.1 + 1.7 * Math.sin(s0 / 71))); t++) s0 = ff() * LL;      // thick and thin by turns
      // (stage E, rule 23: the great fliers go IN FLOCKS of about seven, one heading: each to a flock of its lane, 84 m long)
      if (l.great) { const nFl = Math.max(1, Math.round(n / 7)), k = i % nFl; s0 = ((k + 0.5 + 0.3 * Math.sin(li * 2.3 + k * 1.7)) * LL) / nFl + (s0 / LL - 0.5) * 84; s0 = ((s0 % LL) + LL) % LL; }
      const half = l.great ? 0.5 * ff.range(LIFE.great[0], LIFE.great[1]) : 0.5 * deal.span * LIFE.span * ff.range(0.85, 1.15);
      (l.great ? great : small).push([li, s0, ff.range(-1, 1) * l.half, ff.range(-1, 1) * l.deep, half, l.great ? lerp(0.44, 0.3, clamp((half - 4) / 3, 0, 1)) : lerp(0.62, 0.42, clamp((half - 2.5) / 2.7, 0, 1)), ff(), ff.range(6, 10)]);
    }
  });
  const nF = small.length + great.length;
  if (nF) {
    const uA = [], uB = [];
    for (let i = 0; i < 8; i++) { const l = fl[Math.min(i, fl.length - 1)]; uA.push(new THREE.Vector4(l.x0, l.z0, l.dx, l.dz)); uB.push(new THREE.Vector4(l.h, 15, l.len, 0)); }
    for (const [list, sh, name] of [[small, SHAPES.flierGeo(), 'fliers'], [great, SHAPES.greatGeo(), 'fliers-great']]) {
      const n = list.length; if (!n) continue;
      const fA = new Float32Array(n * 4), fB = new Float32Array(n * 4); list.forEach((q, i) => { fA.set(q.slice(0, 4), i * 4); fB.set(q.slice(4), i * 4); });
      inst(sh.geometry, 'fA', fA); inst(sh.geometry, 'fB', fB); sh.geometry.instanceCount = n;
      const m = new THREE.Mesh(sh.geometry, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uFlA: { value: uA }, uFlB: { value: uB }, uKind: { value: 1 } }, vertexShader: head + FLIER_VERT, fragmentShader: head + ANIMAL_FRAG }));
      m.name = name; m.frustumCulled = false; group.add(m); tri.fliers += sh.triangles * n; calls++;
    }
  }
  await pause();

  // THE SHAPES IN THE WATER, sails up: in the river's broad reaches beside the files (6), in the drowned shallows along
  // the run and in the channel (20: stage D, where the route passes them against the mirrored fire), and the rest
  // in the moat in rafts of four to seven off its near shores; young keep beside the grown.
  // Each well inside its water, off every file's line and its bars, none within 13 m of the route's line.
  const fs = forks.swimmers, sw = [], count = { river: 0, shallows: 0, channel: 0, moat: 0 }, WL = PLAN.water.river + 0.02;
  const apart = (x, z, gap) => sw.every((q) => hyp(q[0] - x, q[2] - z) >= gap);
  const add = (E, N, len, R, loose) => {
    const x = plan.wx(E), z = plan.wz(N), reach = 0.62 * len + R;
    if (!loose && (plan.watAt(E, N) > -(reach + 1.5) || X.laneNear(x, z) < reach + 6)) return false;
    if (burnNear(x, z) < 30 + reach) return false;                              // (stage E: 30 m and more from what burns, its whole loop)
    if (!apart(x, z, 0.75 * len + 1.5)) return false;
    sw.push([x, WL, z, len, R, fs.range(0.3, 0.6), fs(), fs.range(6, 14)]); return true;
  };
  for (let t = 0; t < 900 && count.river < 6; t++) { const len = count.river % 3 === 2 ? 3.6 : fs.range(5.5, 8), R = fs.range(0.6, 1.6), lat = fs.range(-78, 78), q = plan.legPt(fs.range(250, plan.Nt - 20), lat); if (Math.abs(lat) < 13 + 0.62 * len + R) continue; if (add(q[0], q[1], len, R)) count.river++; }
  // IN RAFTS (stage D: none alone, and each raft is read as animals from the route): along the run one raft of three
  // or four in each fifth of the way, 20 to 62 m from the route's line on the fire's side (seven in ten: there the
  // route sees their sails against the mirrored flame) or 20 to 44 m on the other; none nearer the part's line than
  // 80 m; and two rafts of three in the channel. A raft is laid whole (three at the least) or not at all.
  const raft = (w0, w1, want, key, lat) => {
    for (let t = 0; t < 60; t++) {
      const w = fs.range(w0, w1), sd = lat(), q = plan.at(w), cE = q[0] - Math.cos(q[2]) * sd, cN = q[1] + Math.sin(q[2]) * sd, got = [];
      if (plan.lineG(cE, cN) < 92) continue;
      for (let j = 0; j < 40 && got.length < want; j++) {
        const len = got.length % 3 === 2 ? 3.6 : fs.range(5.5, 8.5), R = fs.range(1, 3), E = cE + fs.range(-14, 14), N = cN + fs.range(-14, 14), x = plan.wx(E), z = plan.wz(N), reach = 0.62 * len + R;
        if (plan.routeD(E, N) < 13 + reach || plan.lineG(E, N) < 80 || plan.watAt(E, N) > -(reach + 1.5) || X.laneNear(x, z) < reach + 6 || burnNear(x, z) < 30 + reach) continue;
        if (!apart(x, z, reach + 2) || !got.every((o) => hyp(o[0] - x, o[2] - z) >= reach + 2)) continue;
        got.push([x, WL, z, len, R, fs.range(0.3, 0.6), fs(), fs.range(6, 14)]);
      }
      if (got.length >= 3) { for (const o of got) sw.push(o); count[key] += got.length; return got.length; }
    }
    return 0;
  };
  { const a = way.rideEnd + 20, b = way.turn2Start; for (let k = 0; k < 5; k++) raft(a + ((b - a) * k) / 5, a + ((b - a) * (k + 1)) / 5, 3 + (fs() < 0.5 ? 1 : 0), 'shallows', () => (fs() < 0.7 ? fs.range(20, 62) : -fs.range(20, 44))); }
  { const a = way.turn2Start + 40, b = way.shore - 10; for (let k = 0; k < 2; k++) raft(a + ((b - a) * k) / 2, a + ((b - a) * (k + 1)) / 2, 3, 'channel', () => (fs() < 0.5 ? 1 : -1) * fs.range(20, 56)); }
  // in the moat: what is left of the dealt number, and 14 at the least (stage D: the rafts lie where the route passes,
  // 34 to 100 m either side of its line off the near shore)
  const mo = PLAN.moat; let left = Math.max(Math.round(14 * detail), Math.round(deal.swimmers * detail) - sw.length);
  for (let t = 0; t < 60 && left > 0; t++) {
    const KK = PLAN.K, a = fs.range(mo.a[0] + 24 * KK, mo.a[0] + 105 * KK), c = (fs() < 0.5 ? -1 : 1) * fs.range(26, 77) * KK, raft = Math.min(left, 4 + Math.floor(fs() * 4));
    for (let k = 0, q = 0; k < raft && q < 60; q++) {
      const len = k % 4 === 3 ? 3.4 : fs.range(7, 9.5), [E, N] = plan.fromLocal(a + fs.range(-11, 11), c + fs.range(-11, 11));
      if (plan.sdMoat(E, N) > -13 || plan.sdRock(E, N) < 28 || Math.abs(plan.toLocal(E, N)[1]) < 21 || X.laneNear(plan.wx(E), plan.wz(N)) < 0.62 * len + 4.5 + 6) continue;   // (and off every file's line)
      // (and clear of the castle's water stairs and landings, which stand before the rock's front rim from a -138 to -100 of its frame at c 37 to 61 either side: a shape's whole loop keeps 6 m from them)
      { const [la, lc] = plan.toLocal(E, N), da = Math.max(-138 * KK - la, la + 100 * KK, 0), dc = Math.max(37 * KK - Math.abs(lc), Math.abs(lc) - 61 * KK, 0); if (hyp(da, dc) < 0.62 * len + 4.5 + 6) continue; }
      if (add(E, N, len, fs.range(2, 4.5), true)) { k++; left--; count.moat++; }
    }
  }
  if (sw.length) {
    const n = sw.length, sA = new Float32Array(n * 4), sB = new Float32Array(n * 4);
    sw.forEach((q, i) => { sA.set(q.slice(0, 4), i * 4); sB.set(q.slice(4), i * 4); });
    const sh = SHAPES.swimmerGeo(); inst(sh.geometry, 'sA', sA); inst(sh.geometry, 'sB', sB); sh.geometry.instanceCount = n;
    const m = new THREE.Mesh(sh.geometry, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uKind: { value: 2 } }, vertexShader: head + SWIM_VERT, fragmentShader: head + ANIMAL_FRAG }));
    m.name = 'swimmers'; m.frustumCulled = false; group.add(m); tri.swimmers = sh.triangles * n; calls++;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    inst(g, 'sA', sA); inst(g, 'sB', sB); g.instanceCount = n;
    const wk = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: U, vertexShader: head + WAKE_VERT, fragmentShader: head + WAKE_FRAG }));
    wk.name = 'wakes'; wk.frustumCulled = false; wk.renderOrder = 2; group.add(wk); tri.wakes = n * 2; calls++;
  }
  await pause();

  // ---------- CLEAR AIR: the route against every mover's whole reach, at any clock ----------
  const clearAir = async (pts, need) => {
    let run = Infinity, fly = Infinity, swim = Infinity;
    const CELL = 18, cells = new Map(), ck = (i, j) => (i + 4096) * 8192 + (j + 4096);   // the route's points in squares of 18 m (what stands farther off than that is not measured: "over 18")
    for (const p of pts) { const k = ck(Math.floor(p.x / CELL), Math.floor(p.z / CELL)); let c = cells.get(k); if (!c) cells.set(k, (c = [])); c.push(p); }
    // (the loops in plain functions: a loop written inside an async function is left to the engine's slowest tier)
    const laneLeast = (l) => {                                                // a lane's whole length: heads at 6.4 m, 5.8 m either side of its line
      for (const w of l.world) {
        const i0 = Math.floor(w[0] / CELL), j0 = Math.floor(w[2] / CELL);
        for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
          const c = cells.get(ck(i, j)); if (!c) continue;
          for (const p of c) { const dx = p.x - w[0], dz = p.z - w[2]; const d = hyp(Math.max(hyp(dx, dz) - 5.8, 0), Math.max(p.y - w[1] - LIFE.head, 0)); if (d < run) run = d; }
        }
      }
    };
    const swimLeast = (q) => { for (const p of pts) { const d = hyp(Math.max(hyp(p.x - q[0], p.z - q[2]) - q[4] - 0.62 * q[3], 0), Math.max(p.y - q[1] - 0.4 * q[3], 0)); if (d < swim) swim = d; } };
    for (const l of lanes) { laneLeast(l); await pause(); }
    for (const l of fl) { fly = Math.min(fly, bandLeast(l, pts)); await pause(); }   // every lane's whole band
    let k = 0; for (const q of sw) { swimLeast(q); if (++k % 12 === 0) await pause(); }
    const row = (kind, v, n) => ({ kind, least: Number.isFinite(v) ? +v.toFixed(1) : n ? 'over 18' : 'none dealt', need, ok: v >= need, n });
    return [row('runners (every lane, heads at ' + LIFE.head + ' m)', run, runners.near.length + runners.far.length), row("fliers (every lane's band, wings included)", fly, nF), row('shapes in the water', swim, sw.length)];
  };
  const info = { runners: { dealt: runners.near.length + runners.far.length, nearShape: runners.near.length, acrossTheRun: lanes.runWays, lanes: lanes.map((l) => ({ kind: l.kind, m: Math.round(l.length), n: l.count, beginsFromLine: Math.round(l.startD), underCover: +l.startCover.toFixed(2), endsUnderCover: +l.endCover.toFixed(2), inWater: l.wet, note: l.note })) },
    fliers: { dealt: nF, great: great.length, lanes: fl.map((l) => ({ name: l.name, great: l.great, n: l.count, height: Math.round(l.h), halfBreadth: Math.round(l.half), riseRoom: l.back, fromCastle: Math.round(l.nearCastle), fromRoute: +l.least.toFixed(1), length: l.len, movedBy: l.moved, crossesAtWay: l.crossesAtWay, beginsFromLine: l.beginsFromLine })), lowAcrossTheRun: Xl ? 'dealt' : plan.crossFly ? 'its place failed the clear air' : 'no way for it on this line', byTheTurnFromTheFire: Tl ? Tl.name : 'no place for it on this line', overTheLagoon: Lg ? 'dealt' : (plan.crossFly3All || []).length ? 'its place failed the clear air' : 'no way for it on this line' },
    swimmers: { dealt: sw.length, ...count }, tri,
    whatBurns: (() => { const r1 = (v) => +Math.min(v, 160).toFixed(1), rafts = sw.reduce((m, q) => Math.min(m, burnNear(q[0], q[2]) - 0.62 * q[3] - q[4]), 999), air = fl.reduce((m, l) => Math.min(m, l.burn === undefined ? 999 : l.burn), 999), files = env.forest && env.forest.info && env.forest.info.count ? env.forest.info.count.filesToWhatBurns : 'not known';
      return { need: 30, note: 'least metres from every file, every shape in the water (its whole loop) and every lane of the air (its band) to anything of the forest that ever burns: a torch, a burning card, a spot fire (160: none within 160 m)', files, shapesInTheWater: r1(rafts), lanesOfTheAir: r1(air), ok: rafts >= 30 && air >= 30 && (typeof files !== 'number' || files >= 30) }; })() };
  return { object: group, update() {}, triangles: tri.runners + tri.doubles + tri.spray + tri.fliers + tri.swimmers + tri.wakes, calls, clearAir, info, laneNear: X.laneNear, swimNear: (x, z) => { let m = 99; for (const q of sw) { const dd = hyp(q[0] - x, q[2] - z) - 0.62 * q[3] - q[4]; if (dd < m) m = dd; } return m; } };
}
