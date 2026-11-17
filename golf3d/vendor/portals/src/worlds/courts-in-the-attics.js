// THE COURTS IN THE ATTICS
// A court whose offices fill the attics of every tenement of a grey city. The flight comes low over wet slate roofs in
// the rain, the cathedral's two towers on the skyline, and in at an open garret window; goes under the tie beams down
// the aisles of three or four lofts crowded with waiting men, clerks behind lattice screens, washing and heaped files,
// each loft joined to the next at an angle by a bent passage, one of them crossed over the void of the common stair;
// down a long corridor of doors; through a painter's small room hung with one picture many times and out by the door
// behind his bed into a dark cathedral with one candle like a tree, one shaft of coloured light and islands of lamp
// light; through the gates of the law (src/parts), each greater than the last and each with its keeper, down halls lit
// in pools by this world's own oil lamps, into the last court, the law's innermost office, vast, its people small and
// many, where the way swings onto the axis of the great door and goes up to it into the radiance. Built at three times life. No three.js lights: light is baked at every
// corner in build. No lettering anywhere: every paper, ledger, notice and picture is blank or pictured without writing.
//
// WHAT IS DRIVEN BY WHAT. The place STANDS: nothing of it begins, turns or ends because the visitor comes. Whatever
// moves does its thing over and over on the WORLD'S CLOCK (uTime), on a round of its own, whether anyone is there or
// not; every air and every light is the place's own, the same from the first frame to the last.
// NO FIGURE REGARDS THE VISITOR: no head, body or pose anywhere reads where the visitor is, how near he is, or the
// flight; every pose, turn and motion of a figure (src/parts: FIG_VERT) is worked out from the world's clock and the
// figure's own number, and nothing else.
//  on the world's clock, each on its own round and phase:
//   people      one who waits on a bench rises, bows and sits down again (16 to 30 s); the carrier of files walks his
//               run and back; hands write, chests breathe; a keeper shifts where he stands; the usher's arm rises to
//               point the way and sinks again (21 to 30 s) (src/parts)
//   heads       each head keeps a slow habit of its own, its period (17.3 to 41.2 s, no two alike, none a round
//               number of seconds) and phase out of the figure's own number:
//                the waiting men, the people of the halls and of the last court, the ushers, the carrier: the head
//                 rests, turns to look down the room one way, rests, turns the other way, and now and then sinks to
//                 the hands;
//                the clerks: bent over their writing, the same turn at a third of its width;
//                the whisperers: turned to their neighbour, as they stand; the readers: down at their papers, and up
//                 from them now and then; the sleepers: sunk on the chest, lifted a little now and then;
//                the woman at the washing, the painter, the sitters in the pews: the same slow turn, each at his own
//                 period; the one who looks up into the vault looks up;
//                the three keepers: each keeps his gate: his gaze stands on the approach to his own gate, with a
//                 slow sweep of a fifth of a radian (47 to 61 s) that goes with the lean he has;
//                the old man on his stool: his head is toward the gate and its light, always (a standing turn);
//                the priest in his pulpit: he reads, he lifts his head to the nave (31 to 40 s), he reads again
//   doors       each door of the corridor is opened a hand's breadth from within and shut again (12 to 26 s)
//   papers      a draught runs down the corridor (one every 11.6 s) and lifts the loose sheets as it passes; those
//               within 4 m of the line only stir where they lie
//   pigeons     each flies over to its other place (the next truss; a ridge, a chimney cap or the hoist of the next
//               roofs) and half a round later back (30 to 60 s); over its whole round it keeps 4 m and more
//               off the line
//   the rest    lamp and candle flames, cloth, rain, drips, dust, smoke, the radiance
//  standing, for every visitor alike:
//   the town    runs on BEHIND the entry, rank behind rank of roofs and the street under them, under the entry's
//               straight continued back (300 m of it, level, at the entry's height): the eye that first sees this
//               world through the ring before it flies that line. No ridge within 3.6 m of it, no stack within 9 m
//   the garret  its two casements stand hooked back against the wall on their stays; a storm lantern burns on the
//               hoist over the window; no window stands in the storey right under it
//   the halls   their walls are built (dado, pilasters, niches with racks of bound files and a lamp before each, a
//               cornice, small barred windows high up with the day's cold light), each hall in its own measure; a
//               pale shaft of the day stands under the eye of the last court's vault (not by night)
//   the last    the two leaves of the door behind the painter's bed stand open; on the rare visit every door of the
//               corridor stands open
//   air         each piece is drawn in the air of the place it stands in (grey rain over the roofs and the yard, brown
//               dusk under the rafters, the cathedral's dark, the court's cool dark); the rain is a standing box over the
//               roofs and the yard that ends at the tenement's wall
//  by the visitor's place on the route (uEye: a PLACE IN THE WORLD, the point of the route's line at the share u of
//  the flight that the engine hands to update; never the camera, never the metres), and only this:
//   dust        dust is not drawn further than 110 m from the visitor's place (95 m in the halls and the last
//               court): that belongs to what is drawn. NOTHING OF LIGHT OR DUST GIVES WAY BY IT: a shaft of light
//               and a mote keep off the route's LINE by their own place, a standing clearance that is the same at
//               every moment (a shaft is nothing within 2.6 m of the line and whole from 6.5 m of it; no mote's run
//               comes within 2.8 m of the line, and one within 6 m of it is thinner). A mote's size is the world's
//               own at every distance; nothing of it reads the lens.
//  by the metres flown, and only these:
//   the film    how fast we go and where the gaze is pulled (src/parts: courtFilm): the candle, then each of the
//               three keepers, one at a time; each pull is decided at its own place (the candle's where the
//               painter's back door first shows it, a keeper's at his own gate) and made on every visit
//   drawing     each piece (loft, corridor) is drawn from two pieces before it until 30 m after it; the painter's room
//               and the cathedral (its shell and its people) with the corridor, the cathedral until 30 m past the
//               first gate; the gates, the halls and the last court from 35 m inside the corridor on (the first
//               hall's stone until 30 m past the second gate, the second hall's until 30 m past the third). Their
//               people are drawn from where each can first be seen through the gates' openings: with the gates,
//               or from 40 m inside the cathedral's door, or (those whom walls hide till then) from 31 m past the
//               first, the second or the third gate; and each only as long as the stone he stands in.
//               The roofs until 14 m inside the window. Every shaft, every mote and every pigeon belongs to the
//               piece whose room it stands in and is drawn with it.
//  These four (the shafts and their dust that give way, the pace, the gaze's pulls, what is drawn) are ALL that reads
//  the visitor. How a thing is PICTURED at its distance from the eye is the picture's own and tells nothing of where
//  a thing is or what it does: the air between (each place's own) and the sheen of wet and polished things and of a
//  rounded form.
//
// THE RULE OF THE LANE. No solid stands within CLEAR (2.5 m) of the line, and no person nearer than 6.15 m in space
// (his whole upright against the whole line; the corridor's sitters, back against its wall, 5.4 m: see person()):
// each thing that could is tested against the line in build (tie beams become collars where the line comes in high,
// lamps and washing are not hung, pigeons do not perch, the stair's handrails and the pulpit move off, door heads rise).
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeBatch, makeLighter, courtUniforms, courtMaterial, figureMaterial, personGeometry, makePeople, makeMotes, makeBeams, courtPlan, courtFilm, ATTIC, GATES, K, PAL, MAN, SITK, STEPK, SEAT, lin } from '../parts/courts-in-the-attics.js';

const TAU = Math.PI * 2, DURATION = 50;
// measures of a loft (world metres, three times life)
// (TIE: the under side of a tie beam; COLLAR: of a collar, where the line comes in too high for a tie; PLATE: the heads of the posts)
// (WINW: the garret window; DOORW, DOORH: the doorways between the lofts, wide and high so that the way through them is roomy)
const HW = 13, KNEE = 3.4, RIDGE = 11.6, TIE = 5.9, COLLAR = 8.4, PLATE = 6.6, POSTX = 7.6, BAY = 7.5, WINW = 7.8, DOORW = 10.4, DOORH = 7.6;
// no solid of a loft stands nearer the line than this (and a person no nearer than his own height)
const CLEAR = 2.5;
// no figure nearer to the line than this, where the room is wide enough (the rule of the people, at person())
const NEARMAN = 6.15;
// (and for those who sit back against the wall of the corridor, which is 15.2 m wide)
const SITLANE = 5.4;
// (and for the crowd of the halls and the last court, for whom the man of half the triangles is drawn)
const FARMAN = 10.5;
// (those of the halls and the court whom nobody can see before then are drawn from this far inside the cathedral's door)
const CROWDIN = 40;
const WARM = [1, 0.62, 0.3], SLIT = [1, 0.76, 0.36];
// (a lit pane seen across the roofs: lamp light behind its glazing bars, amber, never white)
const WLIT = [1, 0.6, 0.25];
const UP = [0, 1, 0], DOWN = [0, -1, 0], PX = [1, 0, 0], NX = [-1, 0, 0], PZ = [0, 0, 1], NZ = [0, 0, -1];
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
// old dry timber, grey-brown: it takes the grey of the day and the yellow of a lamp alike
const OAK = [0.37, 0.265, 0.17];
const WOODS = { floor: mul(OAK, 1.0), board: mul(OAK, 0.72), beam: mul(OAK, 0.6), tie: mul(OAK, 0.92), dark: mul(PAL.shade, 2.1), pale: mul(OAK, 1.3) };
// the dusk of an attic: what the skylights and the gaps under the slates let in (cool), from above and from below
// (from below, the boards give a little of the lamps' light back to the under sides of the timbers)
const DUSK_UP = [0.19, 0.215, 0.27], DUSK_DOWN = [0.2, 0.18, 0.165];

// a wall across a loft at z, under the roof, with a doorway; lit on the side `face` (+1: +z). It is laid in upright
// strips of about 1.3 m whose edges fall on the two edges of the opening and under the ridge, so that an opening is as
// wide as it is asked whatever the wall's width; the upper part of the strip at each eave is built as the triangle it
// is: every end wall is shut to its eaves.
function gable(b, hw, z, face, hole, knee = KNEE, ridge = RIDGE) {
  const top = (x) => knee + (ridge - knee) * (1 - Math.abs(x) / hw);
  const cuts = [-hw, 0, hw];
  if (hole) for (const x of [hole.x0, hole.x1]) if (x > -hw + 0.01 && x < hw - 0.01 && Math.abs(x) > 0.01) cuts.push(x);
  cuts.sort((p, q) => p - q);
  b.tex(0, 2, 1);
  for (let c = 0; c < cuts.length - 1; c++) {
    const n = Math.max(1, Math.round((cuts[c + 1] - cuts[c]) / 1.3)), w = (cuts[c + 1] - cuts[c]) / n;
    for (let i = 0; i < n; i++) {
      const x0 = cuts[c] + i * w, x1 = i === n - 1 ? cuts[c + 1] : x0 + w, xm = (x0 + x1) / 2, inHole = hole && xm > hole.x0 && xm < hole.x1;
      for (const [ya, yb] of inHole ? [[0, hole.y0], [hole.y1, null]] : [[0, knee], [knee, null]]) {
        const t0 = Math.max(yb ?? top(x0), ya), t1 = Math.max(yb ?? top(x1), ya);
        if (Math.max(t0, t1) - ya < 0.02) continue;
        const A = [x0, ya, z], B = [x1, ya, z], C = [x1, t1, z], D = [x0, t0, z];
        if (t0 - ya < 1e-6) { if (face > 0) b.tri(A, B, C); else b.tri(B, A, C); }
        else if (t1 - ya < 1e-6) { if (face > 0) b.tri(A, B, D); else b.tri(B, A, D); }
        else if (face > 0) b.quad(A, B, C, D); else b.quad(B, A, D, C);
      }
    }
  }
}
// the frame of a doorway in a wall at z
function doorFrame(b, x, z, w, h, y0 = 0) {
  // (worn brown timber laid in short lengths, so that the light of the room is taken all along it: never a black band)
  b.col(WOODS.tie, 0.8).surf(K.WOOD, 0);
  for (const s of [-1, 1]) bar(b, 1, [x + s * (w / 2 + 0.2), y0 - 0.15, z], h + 0.3, 0.5, 0.7, 4);
  bar(b, 0, [x - w / 2 - 0.6, y0 + h + 0.25, z], w + 1.2, 0.8, 0.5, 4);
}

// a big sheet laid in n bands along its first side, the page breathing between them
function* banded(b, o, eu, ev, cell, want, n) {
  for (let i = 0; i < n; i++) { b.sheet([o[0] + eu[0] * i / n, o[1] + eu[1] * i / n, o[2] + eu[2] * i / n], [eu[0] / n, eu[1] / n, eu[2] / n], ev, cell, want); yield; }
}

// ---------------------------------------------------------------------------------------------- the shell of one loft
// a straight timber laid in short lengths, so that the light of the lamps is taken all along it (ax: 0 along x, 1 up, 2 along z)
function bar(b, ax, p, len, w, h, seg) {
  const n = Math.max(1, Math.round(seg)), l = len / n;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * l;
    if (ax === 0) b.box(p[0] + t, p[1], p[2], l, h, w); else if (ax === 1) b.box(p[0], p[1] + t, p[2], w, l, h); else b.box(p[0], p[1], p[2] - t, w, h, l);
  }
}
const roofY = (x) => KNEE + (RIDGE - KNEE) * (1 - Math.abs(x) / HW);
// a cobweb spun in a corner at c, along the two timbers that meet there (u and v, their lengths the web's reach)
function cobweb(b, c, u, v) {
  b.col([0.3, 0.31, 0.33]).surf(K.WEB, 0);
  b.tri(c, [c[0] + u[0], c[1] + u[1], c[2] + u[2]], [c[0] + v[0], c[1] + v[1], c[2] + v[2]], [0, 0, 0], [1, 0.02, 0], [0.02, 1, 0]);
}
// Z: { L, nb, well: null | { x, z, rail } (the middle of the stair's void; how far its inner handrails stand from that
//      middle), winA (the open garret window instead of a door), collar: [truss by truss: a collar high up instead of a tie] }
function* loftShell(b, Z) {
  const { L } = Z, bl = L / Z.nb;
  // floor of worn boards, open over the stair
  b.col(WOODS.floor).surf(K.WOOD, 0.9).tex(0, 1, 2);
  if (Z.well) {
    const w = Z.well, za = w.z + 8, zb = w.z - 8, xa = w.x - 4.5, xb = w.x + 4.5;
    yield* banded(b, [-HW, 0, 0], [0, 0, za], [HW * 2, 0, 0], 1.3, UP, 2); yield* banded(b, [-HW, 0, zb], [0, 0, -L - zb], [HW * 2, 0, 0], 1.3, UP, 2);
    b.sheet([-HW, 0, za], [xa + HW, 0, 0], [0, 0, zb - za], 1.3, UP); b.sheet([xb, 0, za], [HW - xb, 0, 0], [0, 0, zb - za], 1.3, UP);
  } else yield* banded(b, [-HW, 0, 0], [0, 0, -L], [HW * 2, 0, 0], 1.3, UP, 8);
  yield;
  // knee walls of boards; the under side of the roof: battens across the rafters, black with a century of lamp smoke
  b.col(WOODS.board, 0.95).surf(K.WOOD, 0.8).tex(1, 0, 2);
  b.sheet([-HW, 0, 0], [0, 0, -L], [0, KNEE, 0], 1.7, PX); b.sheet([HW, 0, 0], [0, 0, -L], [0, KNEE, 0], 1.7, NX);
  yield;
  b.col(WOODS.board, 1.0).surf(K.WOOD, 0.5).tex(1, 0, 2);
  for (const s of [-1, 1]) yield* banded(b, [s * HW, KNEE, 0], [0, 0, -L], [-s * HW, RIDGE - KNEE, 0], 2.2, [-s, -1, 0], 6);
  // rafters; a purlin half way up each slope, a plate along the heads of the posts, the ridge
  b.col(WOODS.beam, 1.15).surf(K.WOOD, 0);
  for (let z = -1.2; z > -L + 0.6; z -= 2.5) for (const s of [-1, 1]) {
    b.rod([s * (HW - 0.2), KNEE - 0.1, z], [s * 6.6, roofY(6.6) - 0.3, z], 0.26, 0.26, 4); b.rod([s * 6.6, roofY(6.6) - 0.3, z], [s * 0.2, RIDGE - 0.35, z], 0.26, 0.26, 4);
  }
  yield;
  b.col(WOODS.beam, 1.3);
  for (const s of [-1, 1]) { bar(b, 2, [s * 6.2, roofY(6.2) - 0.85, 0], L, 0.5, 0.6, L / 3.2); bar(b, 2, [s * POSTX, PLATE - 0.05, 0], L, 0.5, 0.4, L / 3.2); }
  bar(b, 2, [0, RIDGE - 0.6, 0], L, 0.55, 0.6, L / 3.2);
  yield;
  // trusses: posts, a tie beam (or, where the line comes in high, a collar far up), king post, braces; webs in the corners
  for (let i = 0; i <= Z.nb; i++) {
    const z = Z.trussZ[i], k = 0.9 + 0.2 * ((i * 7) % 5) / 5, yb = Z.collar[i] ? COLLAR : TIE, xt = HW * (RIDGE - yb - 0.35) / (RIDGE - KNEE);
    b.col(WOODS.tie, k).surf(K.WOOD, 0);
    bar(b, 0, [-xt, yb + 0.35, z], xt * 2, 0.6, 0.7, xt * 2 / 2.4);
    b.box(0, (yb + 0.7 + RIDGE) / 2, z, 0.45, RIDGE - yb - 0.7, 0.45);
    for (const s of [-1, 1]) {
      b.rod([s * 0.3, RIDGE - 1.2, z], [s * xt * 0.42, yb + 0.6, z], 0.17, 0.17, 4);
      if (Z.well && Math.abs(z - Z.well.z) < 8.5 && Math.abs(s * POSTX - Z.well.x) < 4.9) continue;
      b.col(WOODS.tie, k * 0.9);
      bar(b, 1, [s * POSTX, 0, z], PLATE, 0.55, 0.55, 3);
      if (!Z.collar[i]) { b.rod([s * POSTX, 3.9, z], [s * (POSTX - 1.6), TIE + 0.1, z], 0.17, 0.17, 4); b.rod([s * POSTX, 3.9, z], [s * (POSTX + 1.1), TIE + 0.1, z], 0.17, 0.17, 4); }
      for (const e of [-1, 1]) if (z + e * 1.7 < 0 && z + e * 1.7 > -L) b.rod([s * POSTX, 4.5, z], [s * POSTX, PLATE, z + e * 1.7], 0.15, 0.15, 4);
      if ((i * 3 + (s > 0 ? 1 : 0)) % 4 < 2 && !Z.collar[i]) cobweb(b, [s * (POSTX - 0.3), TIE, z + 0.31], [-s * 2.2, 0, 0], [0, -1.9, 0]);
      if ((i + (s > 0 ? 2 : 0)) % 3 === 0) cobweb(b, [s * POSTX, PLATE, z - 0.3], [0, 0, -2.4], [0, -2.0, 0]);
    }
    yield;
  }
  // the end walls and their doorways
  const hole = { x0: -DOORW / 2, x1: DOORW / 2, y0: 0, y1: DOORH };
  b.col(WOODS.board, 1.1).surf(K.WOOD, 0.75);
  gable(b, HW, 0, -1, Z.winA ? { x0: -WINW / 2, x1: WINW / 2, y0: 0.9, y1: 8.1 } : hole);
  gable(b, HW, -L, 1, hole);
  doorFrame(b, 0, -L + 0.2, DOORW, DOORH);
  if (!Z.winA) doorFrame(b, 0, -0.2, DOORW, DOORH);
  yield;
  if (!Z.well) return;
  // the common stair: three flights down the long sides of its void, landings at the ends, walls far down. The flights
  // are narrow: their inner handrails keep Z.well.rail from the middle of the void, which the line crosses
  // (the well is a made thing: its walls in bands that darken downward, a plastered dado line and a trimmer
  // of dark timber round the opening under the floor's edge; each flight a closed stair, its steps solid with a pale
  // worn nosing, a string under the rail and one against the wall; newels at the head of each flight)
  const w = Z.well, za = w.z + 8, zb = w.z - 8, xa = w.x - 4.5, xb = w.x + 4.5, deep = -29, fw = 4.4 - w.rail, xm = w.rail + fw / 2;
  b.surf(K.STONE, 1.1).tex(0, 1, 2);
  for (const [ya, yb, tone] of [[0, -3.2, 1.0], [-3.2, -9, 0.74], [-9, -18, 0.5], [-18, deep, 0.3]]) {
    b.col([0.33, 0.3, 0.26], tone);
    b.sheet([xa, yb, za], [0, 0, zb - za], [0, ya - yb, 0], 3, PX); b.sheet([xb, yb, za], [0, 0, zb - za], [0, ya - yb, 0], 3, NX);
    b.sheet([xa, yb, za], [xb - xa, 0, 0], [0, ya - yb, 0], 3, NZ); b.sheet([xa, yb, zb], [xb - xa, 0, 0], [0, ya - yb, 0], 3, PZ);
  }
  b.col([0.12, 0.115, 0.11]).sheet([xa, deep, za], [xb - xa, 0, 0], [0, 0, zb - za], 3, UP);
  b.col(WOODS.dark, 1.15).surf(K.WOOD, 0);
  for (const [x, z, sxz, szz] of [[w.x, za - 0.09, 9, 0.18], [w.x, zb + 0.09, 9, 0.18], [xa + 0.09, w.z, 0.18, 16], [xb - 0.09, w.z, 0.18, 16]]) { b.box(x, -0.45, z, sxz, 0.9, szz); b.box(x, -3.2, z, sxz, 0.16, szz); }
  yield;
  for (let f = 0; f < 3; f++) {
    const sx = f % 2 ? -1 : 1, x = w.x + sx * xm, dir = f % 2 ? 1 : -1, zs = f % 2 ? zb + 0.3 : za - 0.3, y0 = -f * 9, xr = w.x + sx * w.rail, xw = w.x + sx * 4.38;
    for (let i = 0; i < 14; i++) {
      const top = y0 - (i + 0.5) * 0.643 + 0.12, zc = zs + dir * (i + 0.5) * 1.1;
      b.col(WOODS.floor, 0.8 - 0.012 * i).surf(K.WOOD, 0).box(x, top - 0.4, zc, fw, 0.8, 1.2);
      b.col(WOODS.pale, 1.0 - 0.015 * i).box(x, top - 0.03, zc + dir * 0.56, fw, 0.1, 0.14);
    }
    b.col(WOODS.floor, 0.7).box(w.x, y0 - 9 - 0.15, zs + dir * 15.55, 8.9, 0.3, 0.9);
    b.col(WOODS.dark, 1.3);
    for (const xs of [xr + sx * 0.22, xw]) b.rod([xs, y0 - 0.45, zs], [xs, y0 - 9 - 0.45, zs + dir * 15.4], 0.34, 0.34, 4);
    b.rod([xr, y0 + 2.9, zs], [xr, y0 - 9 + 2.9, zs + dir * 15.4], 0.12, 0.12, 4);
    for (let i = 0; i <= 14; i += 2) b.rod([xr, y0 - i * 0.643, zs + dir * i * 1.1], [xr, y0 - i * 0.643 + 2.9, zs + dir * i * 1.1], 0.07, 0.07, 4);
    // (the newel at the head of the flight, a hand's breadth outside the rail's line: the lane lies inside the rails)
    b.box(xr + sx * 0.22, y0 + 1.7, zs, 0.36, 3.4, 0.36).box(xr + sx * 0.22, y0 + 3.5, zs, 0.5, 0.16, 0.5);
    yield;
  }
  // the rail along the long sides of the void (the stair heads at the ends stand open)
  b.col(WOODS.dark, 1.3).surf(K.WOOD, 0);
  for (const s of [-1, 1]) {
    const x = w.x + s * 4.6;
    bar(b, 2, [x, 2.9, za], za - zb, 0.24, 0.2, 5);
    for (let z = za; z >= zb - 0.01; z -= 1.6) b.rod([x, 0, z], [x, 2.9, z], 0.08, 0.08, 4);
  }
}

// ---------------------------------------------------------------------------------------------- what fills a loft
const YELLOWED = [0.74, 0.62, 0.4], IRON = [0.07, 0.066, 0.062], ZINC = [0.3, 0.32, 0.34];
// a bundle of files tied with tape; tone: 0.75 (old, yellowed) to 1.05 (new)
function bundle(b, x, y, z, w, h, d, yaw, tone = 1) {
  const t = clamp((tone - 0.78) / 0.25, 0, 1);
  b.col([lerp(YELLOWED[0], PAL.paper[0], t), lerp(YELLOWED[1], PAL.paper[1], t), lerp(YELLOWED[2], PAL.paper[2], t)], tone).surf(K.PAPER, 0, 1).box(x, y + h / 2, z, w, h, d, yaw);
}
// a pile of bundles of many sizes, each askew on the one below, the tall ones leaning; returns the height of its top
function stack(b, x, y, z, n, q, o = 0, w = 1.2, d = 0.85) {
  const at = (i) => q[(i + o) % q.length];
  let yy = y, ox = 0, oz = 0;
  for (let i = 0; i < n; i++) {
    const h = 0.26 + 0.5 * at(i * 3 + 1), k = 0.72 + 0.5 * at(i + 4);
    ox += (at(i * 5 + 2) - 0.4) * 0.15 * (1 + i * 0.3); oz += (at(i * 7 + 3) - 0.5) * 0.14;
    bundle(b, x + ox, yy, z + oz, w * k, h, d * (0.8 + 0.4 * at(i + 6)), (at(i * 2 + 5) - 0.5) * 0.55, 0.78 + 0.28 * at(i + 2));
    yy += h;
  }
  return yy;
}
// a loose sheet lying flat at height y (blank)
function leaf(b, x, y, z, yaw, tone = 1, w = 0.66, d = 0.92) {
  const c = Math.cos(yaw), s = Math.sin(yaw), p = (u, v) => [x + u * c + v * s, y, z - u * s + v * c];
  b.col(PAL.paper, tone).surf(K.PAPER, 0, 0).quad(p(-w / 2, d / 2), p(w / 2, d / 2), p(w / 2, -d / 2), p(-w / 2, -d / 2));
}
// WHAT IS SET DOWN ON A FLOOR ASKS WHO STANDS THERE. keep: where the people of the place stand, sit and walk, each
// [x, z, r] in the place's own frame (keepOf, in the build, makes it out of the people as they are dealt); a pile,
// a bucket or a stool of radius r is set down only where it is clear of every one of them.
const clearOf = (keep, x, z, r) => !keep || keep.every((k) => Math.hypot(x - k[0], z - k[1]) >= k[2] + r);
// files heaped on the floor: piles of every height, a few fallen, loose sheets round their feet (no pile where one stands)
function heap(b, x, z, q, n, spread, keep = null) {
  for (let i = 0; i < n; i++) {
    const a = q[i % q.length] * TAU + i * 2.4, r = spread * Math.sqrt((i + 0.5) / n) * (0.7 + 0.5 * q[(i + 3) % q.length]);
    const px = x + Math.cos(a) * r * 0.75, pz = z + Math.sin(a) * r, m = 1 + Math.floor(q[(i * 3 + 1) % q.length] * (i < n / 3 ? 7 : 3.4));
    const pw = 0.9 + 0.6 * q[(i + 5) % q.length], pd = 0.65 + 0.4 * q[(i + 2) % q.length];
    if (clearOf(keep, px, pz, 0.61 * Math.hypot(pw, pd) + 0.25)) stack(b, px, 0, pz, m, q, i * 3, pw, pd);
    if (i % 3 === 0) leaf(b, px + 0.9 * Math.cos(a + 1), 0.03 + 0.004 * i, pz + 0.9 * Math.sin(a + 1), a * 3, 0.8 + 0.25 * q[(i + 1) % q.length]);
  }
}
// a ledger: shut (boards and the edge of its pages) or lying open (two blank pages)
function ledger(b, x, y, z, yaw, open, tint = 0) {
  const COVER = [[0.12, 0.07, 0.05], [0.07, 0.09, 0.075], [0.11, 0.045, 0.04]][tint % 3];
  if (!open) { b.col(COVER).surf(K.PLAIN, 0).box(x, y + 0.13, z, 1.05, 0.26, 1.45, yaw); b.col(PAL.paper, 0.85).surf(K.PAPER, 0, 0).box(x + 0.03 * Math.cos(yaw), y + 0.13, z - 0.03 * Math.sin(yaw), 1.03, 0.19, 1.47, yaw); return; }
  const c = Math.cos(yaw), s = Math.sin(yaw), p = (u, h, v) => [x + u * c + v * s, y + h, z - u * s + v * c];
  b.col(COVER).surf(K.PLAIN, 0).box(x, y + 0.04, z, 2.1, 0.08, 1.5, yaw);
  b.col(PAL.paper, 1).surf(K.PAPER, 0, 0);
  for (const e of [-1, 1]) {
    const A = p(e * 0.02, 0.1, 0.7), B = p(e * 1.0, 0.16, 0.7), C = p(e * 1.0, 0.16, -0.7), D = p(e * 0.02, 0.1, -0.7);
    if (e > 0) b.quad(A, B, C, D); else b.quad(B, A, D, C);
  }
}
// the small things of a desk: inkwell and pen, blotter, stamp pad and stamp, a candle stub (o: which of them)
function deskThing(b, kind, x, y, z, yaw = 0) {
  if (kind === 0) { b.col([0.05, 0.05, 0.07]).surf(K.METAL, 0.4).lathe([[0.2, y], [0.22, y + 0.2], [0.1, y + 0.26], [0.1, y + 0.32]], 6, x, z); b.col(PAL.paper, 0.8).surf(K.PLAIN, 0).rod([x, y + 0.2, z], [x + 0.3, y + 1.0, z + 0.22], 0.025, 0.012, 3); }
  else if (kind === 1) b.col([0.3, 0.42, 0.36]).surf(K.CLOTH, 0).box(x, y + 0.03, z, 1.1, 0.06, 0.8, yaw);
  else if (kind === 2) { b.col([0.2, 0.05, 0.045]).surf(K.PLAIN, 0).box(x, y + 0.05, z, 0.5, 0.1, 0.36, yaw); b.col(WOODS.dark, 1.6).surf(K.WOOD, 0).lathe([[0.1, y], [0.09, y + 0.12], [0.04, y + 0.2], [0.09, y + 0.42], [0, y + 0.46]], 5, x + 0.55, z + 0.1); }
  else { b.col(PAL.paper, 0.9).surf(K.PLAIN, 0).lathe([[0.2, y], [0.11, y + 0.03], [0.1, y + 0.3], [0, y + 0.32]], 5, x, z); b.col(WARM).surf(K.GLOW, 2.4, 3 + Math.abs(x * 1.3 + z) % 4).lathe([[0, y + 0.32], [0.06, y + 0.42], [0, y + 0.62]], 4, x, z); }
}
// a cabinet of pigeonholes facing -s, stuffed with rolled and folded papers; its middle (x, zc), its length along z, its height
function pigeonholes(b, s, x, zc, len, h, q) {
  const rows = Math.round(h / 0.88), cols = Math.round(len / 0.95), dy = h / rows, dz = len / cols, dep = 1.0;
  b.col(WOODS.dark, 1.7).surf(K.WOOD, 0);
  b.box(x + s * dep / 2, h / 2, zc, 0.08, h, len);
  for (let r = 0; r <= rows; r++) bar(b, 2, [x, r * dy + 0.04, zc + len / 2], len, dep, 0.08, 2);
  for (let c = 0; c <= cols; c++) b.box(x, h / 2, zc + len / 2 - c * dz, dep, h, 0.08);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = q[(r * 5 + c * 3) % q.length], k2 = q[(r * 3 + c * 7 + 1) % q.length], z = zc + len / 2 - (c + 0.5) * dz;
    if (k < 0.14) continue;
    if (k > 0.72) { b.col(PAL.paper, 0.75 + 0.3 * k2).surf(K.PAPER, 0, 0); for (const e of [-0.2, 0.18]) b.rod([x + s * 0.4, r * dy + 0.26, z + e], [x - s * (0.5 + 0.3 * k2), r * dy + 0.26, z + e], 0.15, 0.15, 5, true); }
    else bundle(b, x - s * (k2 - 0.5) * 0.3, r * dy + 0.08, z, dep * 0.9, (dy - 0.2) * (0.35 + 0.6 * k2), dz * 0.72, 0, 0.78 + 0.3 * k);
  }
}
// a coat on a peg in a rail whose face looks along n (level, unit), and the hat on the shelf above it
function coatAndHat(b, p, n, q, col) {
  const ax = [-n[2], 0, n[0]], h = 2.7 + 0.6 * q;
  b.col(WOODS.dark, 1.5).surf(K.WOOD, 0).rod(p, [p[0] + n[0] * 0.3, p[1] + 0.06, p[2] + n[2] * 0.3], 0.05, 0.05, 4);
  b.col(col).surf(K.CLOTH, 0).tex(0, 1, 2);
  b.grid(4, 3, (u, v, o) => {
    const wid = 1.5 * (0.4 + 0.6 * Math.min(1, v * 2.4)) * (u - 0.5), f = 0.14 + (0.1 + 0.12 * Math.sin(u * 9 + q * 7)) * v;
    o[0] = p[0] + n[0] * f + ax[0] * wid; o[1] = p[1] - 0.05 - v * h; o[2] = p[2] + n[2] * f + ax[2] * wid; o[3] = v * 0.35;
  });
  if (q > 0.3) b.col(mul(col, 0.7)).surf(K.PLAIN, 0).lathe([[0.5, p[1] + 0.42], [0.3, p[1] + 0.47], [0.3, p[1] + 0.74], [0.2, p[1] + 0.85], [0, p[1] + 0.87]], 6, p[0] + n[0] * 0.25 + ax[0] * (q - 0.6), p[2] + n[2] * 0.25 + ax[2] * (q - 0.6));
}
// a blank sheet pinned to a board whose face looks along n, at p, hanging a little askew
function pinned(b, p, n, w, h, tilt, tone) {
  const ax = [-n[2], 0, n[0]], c = Math.cos(tilt), s = Math.sin(tilt), P = (u, v) => [p[0] + ax[0] * (u * c + v * s) + n[0] * 0.04, p[1] - u * s + v * c, p[2] + ax[2] * (u * c + v * s) + n[2] * 0.04];
  b.col(PAL.paper, tone).surf(K.PAPER, 0, 0).quad(P(w / 2, -h), P(-w / 2, -h), P(-w / 2, 0), P(w / 2, 0));
}
// a stool; a zinc bucket (with water in it, or coal)
function stool(b, x, z, h = SEAT, y = 0) { b.col(WOODS.pale, 0.8).surf(K.WOOD, 0).lathe([[0.55, y + h - 0.12], [0.55, y + h], [0, y + h]], 7, x, z); for (let i = 0; i < 3; i++) b.rod([x + 0.4 * Math.sin(i * 2.1), y, z + 0.4 * Math.cos(i * 2.1)], [x + 0.2 * Math.sin(i * 2.1), y + h - 0.1, z + 0.2 * Math.cos(i * 2.1)], 0.07, 0.06, 4); }
function bucket(b, x, z, fill, col = ZINC, kind = K.METAL) { b.col(col).surf(kind, kind === K.METAL ? 0.2 : 0).lathe([[0, 0.02], [0.42, 0.02], [0.58, 0.95]], 8, x, z); b.col(fill).surf(K.PLAIN, 0).lathe([[0, 0.72], [0.53, 0.72]], 8, x, z); }

// one side of one bay. it: { kind, s, z0, z1, q: [draws] }. Everything stands outside the line of the posts (x 7.6); the
// aisle between the posts is the lane and is kept clear
const COATC = [[0.07, 0.066, 0.064], [0.1, 0.085, 0.07], [0.06, 0.06, 0.068], [0.13, 0.105, 0.08], [0.15, 0.135, 0.11]];
function* furnish(b, it) {
  const { s, z0, z1, q } = it, zc = (z0 + z1) / 2, bl = z0 - z1, IN = [-s, 0, 0];
  if (it.kind === 'bench') {
    // the waiting bench; behind it a rail of pegs with coats, a shelf of hats over it
    const len = bl - 1.8, x = s * 9.0;
    b.col(WOODS.pale, 0.85 + 0.2 * q[0]).surf(K.WOOD, 0);
    bar(b, 2, [x, SEAT - 0.09, zc + len / 2], len, 1.25, 0.18, 3);
    for (const dz of [-0.45, 0.45]) for (const dx of [-0.45, 0.45]) b.box(x + dx, (SEAT - 0.18) / 2, zc + dz * len, 0.2, SEAT - 0.18, 0.2);
    bar(b, 2, [x + s * 0.72, 2.75, zc + len / 2], len, 0.14, 0.5, 3);
    for (const dz of [-0.48, 0, 0.48]) b.box(x + s * 0.72, 1.7, zc + dz * len, 0.16, 2.2, 0.18);
    const xr = s * 10.5, yr = Math.min(4.7, roofY(xr) - 0.5);
    b.col(WOODS.dark, 1.5).surf(K.WOOD, 0);
    bar(b, 2, [xr, yr, zc + len / 2], len, 0.12, 0.3, 3); bar(b, 2, [xr - s * 0.25, yr + 0.38, zc + len / 2], len, 0.6, 0.07, 3);
    for (let i = 0, n = Math.floor(len / 1.75); i < n; i++) if (q[(i + 2) % 10] > 0.22) coatAndHat(b, [xr - s * 0.06, yr, zc + len / 2 - 0.9 - i * 1.75], IN, q[(i + 5) % 10], COATC[Math.floor(q[(i + 3) % 10] * 4.99)]);
    // (a pile set down on the boards at the bench's end: the bench's places are the sitters')
    if (q[1] > 0.4 && clearOf(it.keep, x - s * 0.1, zc + len / 2 + 0.5, 0.65)) stack(b, x - s * 0.1, 0, zc + len / 2 + 0.5, 1 + Math.floor(q[3] * 2.5), q, 4, 1.0, 0.7);
    heap(b, s * 11.6, z1 + 1.3, q, 3 + Math.round(q[6] * 3), 0.9, it.keep);
  } else if (it.kind === 'desk') {
    // a clerk's office: a lattice screen fixed between the posts with a hatch in it, his desk behind it, a cabinet of pigeonholes at his back
    const xl = s * POSTX, hatch = 1.5, y0 = 2.9, y1 = 5.3;
    b.col(WOODS.pale, 0.95).surf(K.LATTICE, 0.62).tex(2, 1, 0);
    const lat = (za, zb, ya, yb) => b.sheet([xl, ya, za], [0, 0, zb - za], [0, yb - ya, 0], 1.6, IN);
    lat(z0 - 0.3, z1 + 0.3, 0.25, y0); lat(z0 - 0.3, zc + hatch, y0, y1); lat(zc - hatch, z1 + 0.3, y0, y1); lat(z0 - 0.3, z1 + 0.3, y1, PLATE - 0.3);
    b.col(WOODS.dark, 1.6).surf(K.WOOD, 0);
    for (const y of [0.15, y0, y1]) bar(b, 2, [xl, y, z0 - 0.3], bl - 0.6, 0.22, 0.2, 3);
    for (const dz of [-hatch, hatch]) b.box(xl, (y0 + y1) / 2, zc + dz, 0.22, y1 - y0, 0.16);
    // (the hatch's shelf lies in the screen's own line and behind it: nothing of it stands out into the place of the man at the hatch)
    b.col(WOODS.pale, 0.9).box(xl + s * 0.14, y0 - 0.02, zc, 0.5, 0.12, hatch * 2);
    yield;
    // the desk: a sloped top, the ledger he writes in lying open, ledgers stacked, ink, blotter, stamp, a candle stub, the lamp
    const xd = s * 9.15, top = 2.45;
    b.col(WOODS.pale, 0.7).surf(K.WOOD, 0.7);
    bar(b, 2, [xd, top / 2, zc + 2.3], 4.6, 1.6, top, 2);
    b.col(WOODS.pale, 1.0).surf(K.WOOD, 0).box(xd, top + 0.06, zc, 1.9, 0.12, 5.0);
    ledger(b, xd + s * 0.25, top + 0.12, zc - 0.1, Math.PI / 2 + (q[0] - 0.5) * 0.2, true, 0);
    let yy = top + 0.12;
    for (let i = 0, n = 2 + Math.floor(q[1] * 3); i < n; i++) { ledger(b, xd + (q[i + 2] - 0.5) * 0.2, yy, zc - 1.75, (q[i + 3] - 0.5) * 0.5, false, i + Math.floor(q[4] * 3)); yy += 0.26; }
    deskThing(b, 0, xd - s * 0.5, top + 0.12, zc + 1.15); deskThing(b, 1, xd - s * 0.35, top + 0.12, zc - 0.1, 0.1); deskThing(b, 2, xd - s * 0.45, top + 0.12, zc + 1.7, 0.3); deskThing(b, 3, xd + s * 0.6, top + 0.12, zc - 2.3);
    leaf(b, xd - s * 0.2, top + 0.13, zc + 0.95, q[5], 0.95); leaf(b, xd + s * 0.3, top + 0.135, zc + 1.5, q[6] * 3, 0.85);
    b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0.4).lathe([[0.26, top + 0.12], [0.08, top + 0.3], [0.08, top + 0.95], [0.22, top + 1.05]], 6, xd - s * 0.3, zc + 2.15);
    b.col(WARM).surf(K.GLOW, 3.2, 1 + q[4] * 5).lathe([[0, top + 1.05], [0.16, top + 1.2], [0.12, top + 1.5], [0, top + 1.75]], 6, xd - s * 0.3, zc + 2.15);
    yield;
    // his chair; the pigeonholes
    b.col(WOODS.dark, 1.5).surf(K.WOOD, 0).box(s * 10.55, SEAT / 2, zc, 1.3, SEAT, 1.4).box(s * 11.25, 2.2, zc, 0.14, 1.9, 1.4);
    pigeonholes(b, s, s * 12.1, zc, Math.min(5.4, bl - 1.6), Math.min(3.55, roofY(s * 12.6) - 0.1), q);
    heap(b, s * 9.4 + q[5], z1 + 0.9, q, 3 + Math.round(q[6] * 4), 0.9, it.keep);
  } else if (it.kind === 'heap') {
    // the registry: racks under the slope, a table of piles, files heaped on the floor, sheets pegged to a string
    b.col(WOODS.dark, 1.5).surf(K.WOOD, 0);
    const xr = s * 12.0, hr = roofY(12.5) - 0.15;
    for (const y of [0.1, 1.2, 2.3, hr]) bar(b, 2, [xr, y, z0 - 1.0], bl - 2.0, 0.95, 0.09, 2);
    for (const t of [0, 0.5, 1]) b.box(xr, hr / 2, z0 - 1.0 - t * (bl - 2.0), 0.95, hr, 0.1);
    for (let i = 0, n = Math.floor((bl - 2.4) / 1.25); i < n; i++) for (let lv = 0; lv < 3; lv++) if (q[(i + lv * 3) % 10] > 0.15)
      stack(b, xr - s * 0.05, 0.15 + lv * 1.1, z0 - 1.8 - i * 1.25, 1 + Math.floor(q[(i * 3 + lv) % 10] * 2.2), q, i + lv * 4, 0.85, 1.0);
    // (the heap of the registry lies round the one who sorts at the table and clear of the carrier's walk: each pile asks)
    heap(b, s * 9.6, zc, q, 12 + Math.round(q[0] * 9), 2.2, it.keep);
    b.col(WOODS.pale, 0.8).surf(K.WOOD, 0).box(s * 9.2, 1.9, z1 + 1.5, 2.6, 0.14, 1.5);
    for (const [dx, dz] of [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]]) b.box(s * 9.2 + dx, 0.92, z1 + 1.5 + dz, 0.16, 1.84, 0.16);
    stack(b, s * 8.7, 1.97, z1 + 1.5, 3 + Math.floor(q[7] * 5), q, 2); stack(b, s * 9.9, 1.97, z1 + 1.4, 1 + Math.floor(q[8] * 3), q, 5, 1.0, 0.7);
    yield;
    // a string from post to post behind the aisle, sheets pegged along it (blank)
    const ys = 4.7, xs = s * (POSTX + 0.5);
    b.col([0.3, 0.28, 0.25]).surf(K.PLAIN, 0).rod([xs, ys, z0 - 0.3], [xs, ys - 0.25, zc], 0.03, 0.03, 3).rod([xs, ys - 0.25, zc], [xs, ys, z1 + 0.3], 0.03, 0.03, 3);
    for (let i = 0, n = Math.floor((bl - 1.4) / 0.95); i < n; i++) if (q[(i * 3 + 1) % 10] > 0.3) {
      const z = z0 - 0.9 - i * 0.95, y = ys - 0.25 * (1 - Math.abs(z - zc) / (bl / 2));
      b.col(PAL.paper, 0.78 + 0.25 * q[(i + 4) % 10]).surf(K.CLOTH, 0).tex(2, 1, 0);
      b.grid(1, 2, (u, v, o) => { o[0] = xs + 0.08 * v * (q[(i + 2) % 10] - 0.5); o[1] = y - v * 0.95; o[2] = z + 0.33 - u * 0.66; o[3] = v * 0.6; }, s > 0);
    }
  } else if (it.kind === 'laundry') {
    // washing: a line along the posts, a lower one under the slope; tub, washboard, basket of wet linen
    washLine(b, [s * 8.4, 5.6, z0 - 0.4], [s * 8.4, 5.6, z1 + 0.4], 0.4, q, 0.72);
    washLine(b, [s * 10.9, roofY(10.9) - 0.25, z0 - 0.8], [s * 10.9, roofY(10.9) - 0.25, z1 + 0.8], 0.3, [...q.slice(4), ...q.slice(0, 4)], 0.5);
    b.col([0.45, 0.33, 0.2]).surf(K.WOOD, 0.4).lathe([[0, 0.2], [0.9, 0.2], [1.2, 1.5], [1.1, 1.5], [0.85, 0.5]], 9, s * 9.7 + q[3], zc + 1.6);
    b.col([0.4, 0.42, 0.42]).surf(K.PLAIN, 0).lathe([[0, 1.2], [1.08, 1.2]], 9, s * 9.7 + q[3], zc + 1.6);
    b.col(ZINC).surf(K.METAL, 0.2).box(s * 9.7 + q[3], 1.7, zc + 2.3, 0.9, 1.3, 0.08, 0.3);
    b.col([0.5, 0.4, 0.24]).surf(K.WOOD, 0.25).lathe([[0, 0.05], [0.8, 0.05], [1.0, 0.95]], 8, s * 9.2, zc - 1.9);
    b.col(PAL.paper, 0.9).surf(K.CLOTH, 0).lathe([[0, 1.45], [0.6, 1.25], [0.92, 0.9]], 6, s * 9.2, zc - 1.9);
    if (clearOf(it.keep, s * 10.6, zc - 0.4, 0.6)) stool(b, s * 10.6, zc - 0.4);
  } else if (it.kind === 'stove') {
    // the stove, its pipe up under the slope and out through the roof; stools, the coal bucket, a kettle
    const x = s * 9.7, z = zc, yp = roofY(9.7) - 0.75;
    b.col(IRON).surf(K.METAL, 0.3).lathe([[0.75, 0.5], [0.95, 0.7], [0.95, 2.5], [0.8, 2.8], [0.3, 2.9]], 9, x, z);
    for (let i = 0; i < 3; i++) b.rod([x + 0.7 * Math.sin(i * 2.1 + 0.5), 0, z + 0.7 * Math.cos(i * 2.1 + 0.5)], [x + 0.6 * Math.sin(i * 2.1 + 0.5), 0.6, z + 0.6 * Math.cos(i * 2.1 + 0.5)], 0.08, 0.08, 4);
    b.rod([x, 2.85, z], [x, yp, z], 0.28, 0.28, 7).rod([x, yp, z], [x, yp + 0.25, z - bl * 0.3], 0.28, 0.28, 7).rod([x, yp + 0.25, z - bl * 0.3], [x - s * 0.2, roofY(9.5) + 0.3, z - bl * 0.3], 0.28, 0.28, 7);
    b.col([1, 0.42, 0.1]).surf(K.GLOW, 2.2, 2 + q[0] * 4).box(x - s * 0.93, 1.25, z, 0.08, 0.5, 0.6);
    b.col([0.16, 0.15, 0.15]).surf(K.METAL, 0.3).lathe([[0.3, 2.9], [0.42, 3.1], [0.36, 3.45], [0.1, 3.55], [0.1, 3.62]], 7, x + s * 0.2, z + 0.3);
    // (the first stool is the seat of the man who sits by the stove; the second stands between the stove and the towers
    // of files against the knee wall, clear of both)
    stool(b, s * 8.45, z - 2.1); stool(b, s * 10.75, z + 1.45);
    if (clearOf(it.keep, x + s * 0.4, z + 1.9, 0.6)) bucket(b, x + s * 0.4, z + 1.9, [0.03, 0.03, 0.03]);
    heap(b, s * 11.4, z1 + 1.2, q, 3 + Math.round(q[6] * 3), 0.9, it.keep);
  } else {
    // an office boarded off between the posts: a wall of boards, a door with light under it and a lit pane over it, a board of
    // pinned notices (blank), the returns of the wall running back under the slope
    const xf = s * (POSTX + 0.02), za = z0 - 0.3, zb = z1 + 0.3, top = PLATE - 0.25, dw = 1.3;
    b.col(WOODS.board, 1.5).surf(K.WOOD, 0.7).tex(2, 0, 1);
    b.sheet([xf, 0, za], [0, 0, zc + dw - za], [0, top, 0], 1.5, IN); b.sheet([xf, 0, zc - dw], [0, 0, zb - zc + dw], [0, top, 0], 1.5, IN);
    b.sheet([xf, 5.9, zc + dw], [0, 0, -dw * 2], [0, top - 5.9, 0], 1.5, IN);
    b.tex(0, 2, 1);
    for (const [z, want] of [[za, PZ], [zb, NZ]]) for (let i = 0; i < 3; i++) {
      const xa = xf + s * i * 1.8, xb = xf + s * (i + 1) * 1.8;
      const A = [xa, 0, z], B = [xb, 0, z], C = [xb, Math.min(top, roofY(xb)), z], D = [xa, Math.min(top, roofY(xa)), z];
      if ((want[2] > 0) === (s > 0)) b.quad(A, B, C, D); else b.quad(B, A, D, C);
    }
    // (the door: a leaf of four panels in its frame, a knob; the light of the office shows in a thin slit under the leaf)
    b.col(WOODS.tie, 1.25).surf(K.WOOD, 0.62).box(xf - s * 0.02, 2.44, zc, 0.14, 4.6, dw * 2 - 0.1);
    b.col(WOODS.tie, 0.8).surf(K.WOOD, 0);
    for (const [y, hh] of [[1.45, 1.9], [3.65, 1.7]]) for (const e of [-1, 1]) b.box(xf - s * 0.1, y, zc + e * 0.6, 0.05, hh, 0.86);
    b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0.4).box(xf - s * 0.16, 2.5, zc + 0.95, 0.12, 0.16, 0.16);
    b.col(WOODS.dark, 1.2).surf(K.WOOD, 0);
    for (const e of [-1, 1]) b.box(xf - s * 0.08, 2.95, zc + e * (dw + 0.12), 0.3, 5.9, 0.26);
    b.box(xf - s * 0.08, 4.8, zc, 0.3, 0.22, dw * 2 + 0.5).box(xf - s * 0.08, 5.95, zc, 0.3, 0.22, dw * 2 + 0.5).box(xf - s * 0.08, 5.37, zc, 0.2, 0.95, 0.1);
    b.col(SLIT).surf(K.GLOW, 1.5, 0).box(xf - s * 0.05, 0.07, zc, 0.1, 0.1, dw * 2 - 0.3);
    b.col(WARM).surf(K.GLOW, 0.75, 0).box(xf + s * 0.02, 5.37, zc, 0.06, 0.93, dw * 2 - 0.1);
    const zn = zc + (q[0] > 0.5 ? 1 : -1) * (dw + 1.7);
    b.col(WOODS.pale, 0.75).surf(K.WOOD, 0).box(xf - s * 0.07, 3.7, zn, 0.1, 2.3, 2.3);
    for (let i = 0; i < 6; i++) if (q[i + 1] > 0.25) pinned(b, [xf - s * 0.12, 4.65 - (i % 2) * 1.05 + 0.1 * q[i + 2], zn + 0.75 - Math.floor(i / 2) * 0.75], IN, 0.6, 0.85, (q[i + 3] - 0.5) * 0.3, 0.8 + 0.25 * q[i]);
    // (a pile against the wall at the bay's end, on the side away from the board: clear of the two who wait at the door)
    { const zp = zc + (q[0] > 0.5 ? -1 : 1) * (bl / 2 - 0.45); if (clearOf(it.keep, xf - s * 0.55, zp, 0.55)) stack(b, xf - s * 0.55, 0, zp, 2 + Math.floor(q[5] * 5), q, 3, 0.8, 0.7); }
  }
}

// ---------------------------------------------------------------------------------------------- the corridor of doors
// (CLAMP: the height of the flames of the lamps hung down the middle, 4.5 m over the line)
const CHW = 7.6, CH = 9.2, CLAMP = 7.6, CDW = 2.7, CDH = 6.0, PLASTER = [0.7, 0.58, 0.41], CDADO = 3.7;
// Z: { L, doors: [{ s, z }], benches, lampZ, lines, desk: { s, x, z, q } }; roomLight lights the bright rooms behind the doors
function* corridorShell(b, Z, roomLight, mainLight) {
  const { L } = Z;
  b.col(WOODS.floor, 0.95).surf(K.WOOD, 0.9).tex(0, 1, 2);
  yield* banded(b, [-CHW, 0, 0], [0, 0, -L], [CHW * 2, 0, 0], 1.3, UP, 9);
  // the ceiling: boards laid on joists, brown with lamp smoke; never a plain slab
  b.col(WOODS.board, 0.8).surf(K.WOOD, 0.55).tex(0, 1, 2);
  yield* banded(b, [-CHW, CH, 0], [0, 0, -L], [CHW * 2, 0, 0], 1.9, DOWN, 7);
  b.col(WOODS.tie, 0.95).surf(K.WOOD, 0);
  for (let z = -1.5, i = 0; z > -L; z -= 3, i++) { bar(b, 0, [-CHW, CH - 0.3, z], CHW * 2, 0.4, 0.6, 5); if (i % 4 === 3) yield; }
  yield;
  for (const s of [-1, 1]) bar(b, 2, [s * (CHW - 0.2), CH - 0.75, 0], L, 0.4, 0.3, L / 3);
  yield;
  for (const s of [-1, 1]) {
    const ds = Z.doors.filter((d) => d.s === s).sort((p, q) => q.z - p.z), x = s * CHW, n = [-s, 0, 0];
    let zPrev = 0;
    // a stretch of wall (the attics' own boards and plaster): upright boards to over a man's head, a rail on
    // them, warm plaster above with little grime on it
    const seg = (za, zb) => {
      if (za - zb < 0.05) return;
      b.col(PLASTER).surf(K.PLAIN, 0.16).tex(2, 1, 0).sheet([x, CDADO, za], [0, 0, zb - za], [0, CH - CDADO, 0], 1.6, n);
      b.col(WOODS.board, 1.3).surf(K.WOOD, 0.75).tex(2, 0, 1).sheet([x, 0, za], [0, 0, zb - za], [0, CDADO, 0], 1.5, n);
      b.col(WOODS.dark, 1.6).surf(K.WOOD, 0).box(x - s * 0.06, CDADO, (za + zb) / 2, 0.14, 0.22, za - zb);
    };
    let nd = 0;
    for (const d of ds) {
      if (nd++) yield;
      seg(zPrev, d.z + CDW / 2);
      b.col(PLASTER).surf(K.PLAIN, 0.16).tex(2, 1, 0).sheet([x, CDH, d.z + CDW / 2], [0, 0, -CDW], [0, CH - CDH, 0], 1.8, n);
      b.col(WOODS.beam, 1.15).surf(K.WOOD, 0);
      for (const e of [-1, 1]) bar(b, 1, [x - s * 0.08, 0, d.z + e * (CDW / 2 + 0.16)], CDH + 0.15, 0.3, 0.32, 3);
      b.box(x - s * 0.08, CDH + 0.2, d.z, 0.3, 0.4, CDW + 0.64);
      // the light under the door
      b.col(SLIT).surf(K.GLOW, 1.4, 0).sheet([x - s * 0.03, 0.02, d.z + CDW / 2 - 0.15], [0, 0, -(CDW - 0.3)], [0, 0.1, 0], 3, n);
      // the bright empty room behind the door
      b.light(roomLight).col([0.62, 0.56, 0.44]).surf(K.STONE, 0).tex(0, 1, 2);
      const xr = x + s * 5, za = d.z + 2.2, zb = d.z - 2.2;
      b.sheet([xr, 0, za], [0, 0, zb - za], [0, CDH + 0.5, 0], 3, n);
      b.sheet([x, 0, za], [xr - x, 0, 0], [0, CDH + 0.5, 0], 3, NZ); b.sheet([x, 0, zb], [xr - x, 0, 0], [0, CDH + 0.5, 0], 3, PZ);
      b.col(WOODS.floor, 1.2).surf(K.WOOD, 0.9).sheet([x, 0.01, za], [xr - x, 0, 0], [0, 0, zb - za], 3, UP);
      b.col([0.6, 0.55, 0.45]).surf(K.STONE, 0).sheet([x, CDH + 0.5, za], [xr - x, 0, 0], [0, 0, zb - za], 3, DOWN);
      // (no room is empty: shelves of files on its far wall, a desk before them with a lamp on it; all of it
      // stands clear of the leaf, which swings 2.6 m into the room)
      b.col(WOODS.dark, 1.7).surf(K.WOOD, 0);
      for (const y of [1.5, 2.9, 4.3]) b.box(xr - s * 0.3, y, d.z, 0.55, 0.1, 3.9);
      b.col(PAL.paper, 0.62).surf(K.PAPER, 0, 0);
      for (const [y, h, l, o] of [[1.5, 0.95, 3.3, 0.2], [2.9, 0.8, 2.6, -0.5], [4.3, 1.0, 3.5, 0.1]]) b.box(xr - s * 0.32, y + 0.05 + h / 2, d.z + o, 0.42, h, l);
      b.col(WOODS.board, 1.5).surf(K.WOOD, 0);
      b.box(x + s * 3.55, 2.3, d.z - 0.2, 1.3, 0.14, 2.7).box(x + s * 3.55, 1.15, d.z + 1.05, 1.2, 2.3, 0.14).box(x + s * 3.55, 1.15, d.z - 1.45, 1.2, 2.3, 0.14);
      b.col(PAL.paper, 0.8).surf(K.PAPER, 0, 0).box(x + s * 3.5, 2.47, d.z - 0.7, 0.75, 0.2, 0.95, 0.3);
      b.col([0.05, 0.05, 0.07]).surf(K.METAL, 0.4).lathe([[0.22, 2.37], [0.24, 2.55], [0.1, 2.62], [0.1, 2.7]], 6, x + s * 3.6, d.z + 0.55);
      b.col(WARM).surf(K.GLOW, 2.2, 2).lathe([[0.1, 2.7], [0.17, 2.95], [0.09, 3.25], [0, 3.3]], 6, x + s * 3.6, d.z + 0.55);
      b.light(mainLight);
      zPrev = d.z - CDW / 2;
    }
    seg(zPrev, -L);
    yield;
  }
  // end walls: the way in from the last loft, the way out to the painter's room
  for (const [z, face, w, h] of [[-0.15, NZ, DOORW, DOORH], [-L + 0.15, PZ, 7.2, 6.6]]) {
    // (a hand's breadth inside the wall of the room next door, which stands in the same plane)
    b.col(PLASTER).surf(K.PLAIN, 0.22).tex(0, 1, 2);
    b.sheet([-CHW, 0, z], [CHW - w / 2, 0, 0], [0, CH, 0], 1.8, face); b.sheet([w / 2, 0, z], [CHW - w / 2, 0, 0], [0, CH, 0], 1.8, face);
    b.sheet([-w / 2, h, z], [w, 0, 0], [0, CH - h, 0], 1.8, face);
    doorFrame(b, 0, z + face[2] * 0.2, w, h);
  }
  yield;
  // benches against the walls between the doors; a peg rail of coats and hats over some
  for (const it of Z.benches) {
    // (back against the wall; its top is a seat's top, SEAT)
    const x = it.s * (CHW - 0.62);
    b.col(WOODS.pale, 0.85).surf(K.WOOD, 0);
    bar(b, 2, [x, SEAT - 0.09, it.z + it.len / 2], it.len, 1.2, 0.18, 2);
    for (const e of [-0.42, 0.42]) b.box(x, (SEAT - 0.18) / 2, it.z + e * it.len, 1.0, SEAT - 0.18, 0.18);
    b.box(it.s * (CHW - 0.12), 2.5, it.z, 0.12, 0.5, it.len);
    if (it.q[0] > 0.45) {
      b.col(WOODS.dark, 1.5).box(it.s * (CHW - 0.07), 5.6, it.z, 0.1, 0.3, it.len).box(it.s * (CHW - 0.3), 5.98, it.z, 0.6, 0.07, it.len);
      for (let i = 0; i < 2; i++) if (it.q[i + 1] > 0.3) coatAndHat(b, [it.s * (CHW - 0.13), 5.6, it.z + (i ? -0.7 : 0.7)], [-it.s, 0, 0], it.q[i + 3], mul(COATC[Math.floor(it.q[i + 5] * 4.99)], 2.3));
    }
  }
  yield;
  // lamps hung down the middle, far apart: a pool of light under each and dusk between
  for (const lz of Z.lampZ) {
    b.col(WOODS.dark).surf(K.PLAIN, 0).rod([0, CH - 0.5, lz], [0, CLAMP + 0.7, lz], 0.05, 0.05, 4);
    b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0.3).lathe([[0.1, CLAMP + 0.7], [0.6, CLAMP + 0.55], [0.68, CLAMP + 0.43]], 7, 0, lz);
    b.col([1, 0.76, 0.44]).surf(K.GLOW, 1.9, 2 + Math.abs(lz * 0.37) % 3).lathe([[0, CLAMP], [0.26, CLAMP + 0.1], [0.3, CLAMP + 0.35], [0.12, CLAMP + 0.47]], 6, 0, lz);
  }
  // washing strung from wall to wall, the middle of each line bare over the lane
  for (const ln of Z.lines) { const g = (CHW - 3.5) / (CHW * 2); washLine(b, [-CHW, 8.1, ln.z], [CHW, 8.1, ln.z], 0.4, ln.q, 0.5, [g, 1 - g]); }
  yield;
  // the high desk at the end: a boarded stand as high as a man's chest, the desk on it with a
  // panelled front and a rail, the ledger open on it, ink, files piled at its foot, the lamp hung over it on its cord
  {
    const { s, x, z } = Z.desk, base = 2.4, top = base + 2.15, zb = -Z.L + 0.3;
    b.col(WOODS.board, 1.25).surf(K.WOOD, 0.8).tex(0, 1, 2);
    b.box(x, base / 2, (z + zb) / 2 - 0.1, 2.6, base, z - zb - 0.2);
    // (the stool he sits on, on the stand behind the desk)
    stool(b, x, -Z.L + 1.7, SEAT, base);
    b.col(WOODS.pale, 0.85).surf(K.WOOD, 0.75).box(x, top / 2, z, 2.6, top, 0.3);
    b.col(WOODS.dark, 1.5).surf(K.WOOD, 0);
    for (const e of [-1, 0, 1]) b.box(x + e * 0.82, top / 2 + 0.2, z + 0.17, 0.66, top - 1.2, 0.06);
    b.col(WOODS.pale, 1.0).box(x, top + 0.06, z - 0.5, 2.6, 0.12, 1.5);
    b.col(WOODS.dark, 1.5).box(x, top + 0.4, z + 0.2, 2.6, 0.56, 0.08);
    ledger(b, x - 0.1, top + 0.12, z - 0.55, 0, true, 1);
    deskThing(b, 0, x + 0.95, top + 0.12, z - 0.3); deskThing(b, 2, x - 1.0, top + 0.12, z - 0.3, 0.3);
    stack(b, x + s * 0.3, 0, z + 0.9, 3 + Math.floor(Z.desk.q[0] * 3), Z.desk.q, 2); stack(b, x - s * 0.7, 0, z + 1.0, 1 + Math.floor(Z.desk.q[1] * 3), Z.desk.q, 5, 1.0, 0.7);
    const lx = s * 5.55, lz = z + 0.5, ly = 7.3;
    b.col(WOODS.dark).surf(K.PLAIN, 0).rod([lx, CH - 0.5, lz], [lx, ly + 0.8, lz], 0.05, 0.05, 4);
    b.col([0.16, 0.3, 0.2]).surf(K.METAL, 0.4).lathe([[0.12, ly + 0.8], [0.85, ly + 0.5], [0.95, ly + 0.32]], 9, lx, lz);
    b.col([1, 0.8, 0.5]).surf(K.GLOW, 3.0, 3.3).lathe([[0, ly - 0.1], [0.36, ly + 0.02], [0.4, ly + 0.3], [0.16, ly + 0.46]], 7, lx, lz);
  }
  // files stacked beside some doors: a row of piles hard against the boards of the wall, loose sheets at their feet,
  // and by some a bucket. Each pile and each bucket asks who stands, sits or walks there (Z.keep, clearOf): the
  // corridor is narrow, and the carrier's walk and those who wait keep their places.
  for (const d of Z.doors) if (d.files) {
    const Q = d.q.length;
    for (let i = 0, n = 2 + Math.round(d.q[0] * 1.4); i < n; i++) {
      const x = d.s * (CHW - 0.45), z = d.z + (CDW / 2 + 0.75 + i * 1.02) * d.files;
      if (clearOf(Z.keep, x, z, 0.6)) stack(b, x, 0, z, 1 + Math.floor(d.q[(i * 3 + 1) % Q] * (i < 2 ? 6 : 3.4)), d.q, i * 3, 0.5 + 0.12 * d.q[(i + 5) % Q], 0.8);
      if (i % 2 === 0) leaf(b, x - d.s * (0.8 + 0.3 * d.q[(i + 2) % Q]), 0.03 + 0.004 * i, z + 0.3, d.q[i % Q] * 9, 0.8 + 0.25 * d.q[(i + 1) % Q]);
    }
    const zb = d.z - (CDW / 2 + 0.9) * d.files;
    if (d.q[1] > 0.5 && clearOf(Z.keep, d.s * (CHW - 0.7), zb, 0.6)) bucket(b, d.s * (CHW - 0.7), zb, [0.3, 0.34, 0.38], [0.58, 0.57, 0.54], K.PLAIN);
  }
}

// ---------------------------------------------------------------------------------------------- the painter's room
const PHW = 7, PL = ATTIC.PL, PDW = ATTIC.PDW;
// the boarded ceiling of the room, falling a little to one side
const pTop = (x) => 8.8 - 0.08 * (x + PHW);
// Z: { q, easel, y0, y1 (the sill and the head of the door behind the bed, set in build from the line) }
function* painterShell(b, Z) {
  const { y0, y1 } = Z;
  b.col(WOODS.floor, 1.05).surf(K.WOOD, 0.9).tex(0, 1, 2).sheet([-PHW, 0, 0], [PHW * 2, 0, 0], [0, 0, -PL], 1.3, UP);
  b.col(WOODS.board, 0.85).surf(K.WOOD, 0.55).sheet([-PHW, pTop(-PHW), 0], [PHW * 2, pTop(PHW) - pTop(-PHW), 0], [0, 0, -PL], 2, DOWN);
  b.col(WOODS.tie, 0.95).surf(K.WOOD, 0);
  for (let z = -2.2; z > -PL; z -= 3.5) for (let i = 0; i < 4; i++) { const xa = -PHW + i * 3.5, xb = xa + 3.5; b.rod([xa, pTop(xa) - 0.3, z], [xb, pTop(xb) - 0.3, z], 0.26, 0.26, 4); }
  yield;
  b.col([0.6, 0.56, 0.49]).surf(K.PLAIN, 0.45).tex(2, 1, 0);
  b.sheet([-PHW, 0, 0], [0, 0, -PL], [0, pTop(-PHW), 0], 1.8, PX); b.sheet([PHW, 0, 0], [0, 0, -PL], [0, pTop(PHW), 0], 1.8, NX);
  b.tex(0, 1, 2);
  for (const [z, face, ya, yb] of [[0, NZ, 0, 6.6], [-PL, PZ, y0, y1]]) {
    b.sheet([-PHW, 0, z], [PHW - PDW / 2, 0, 0], [0, 8.8, 0], 1.8, face); b.sheet([PDW / 2, 0, z], [PHW - PDW / 2, 0, 0], [0, 8.8, 0], 1.8, face);
    b.sheet([-PDW / 2, yb, z], [PDW, 0, 0], [0, 8.8 - yb, 0], 1.8, face);
    if (ya > 0) b.sheet([-PDW / 2, 0, z], [PDW, 0, 0], [0, ya, 0], 1.8, face);
  }
  doorFrame(b, 0, -PL + 0.2, PDW, y1 - y0, y0);
  yield;
  // the one picture, many times: hung in rows, leaning in stacks, one on the easel
  const canvas = (c, ux, uy, w, h) => {
    const A = [0, 1, 2].map((i) => c[i] - ux[i] * w / 2 - uy[i] * h / 2), dx = [ux[0] * w, ux[1] * w, ux[2] * w], dy = [uy[0] * h, uy[1] * h, uy[2] * h];
    const p = (u, v) => [A[0] + dx[0] * u + dy[0] * v, A[1] + dx[1] * u + dy[1] * v, A[2] + dx[2] * u + dy[2] * v];
    b.col([1, 1, 1]).surf(K.PICTURE, 0);
    b.quad(p(0, 0), p(1, 0), p(1, 1), p(0, 1), [0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]);
    b.quad(p(1, 0), p(0, 0), p(0, 1), p(1, 1), [0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]);
  };
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) for (let r = 0; r < 2; r++) {
    const z = -2.4 - i * 3.3 - (r ? 0.4 : 0), y = 2.6 + r * 2.5 + (s < 0 ? 0.3 : 0);
    if (y + 1 > pTop(s * PHW) - 0.4) continue;
    canvas([s * (PHW - 0.12 - Z.q[(i + r) % 8] * 0.1), y, z], [0, 0, -s], [0, 1, 0], 2.7, 1.95);
    b.col(WOODS.dark, 1.4).surf(K.WOOD, 0).box(s * (PHW - 0.06), y, z, 0.08, 2.15, 2.9);
  }
  yield;
  for (let i = 0; i < 5; i++) { const s = i % 2 ? 1 : -1, z = -4 - i * 3.6, t = 0.22 + 0.1 * Z.q[i]; canvas([s * (PHW - 1.0 - t), 1.05, z], [0, 0, -s], [-s * Math.sin(t), Math.cos(t), 0], 2.5, 1.9); }
  const ex = Z.easel[0], ez = Z.easel[1], es = Math.sign(ex);
  canvas([ex, 3.3, ez], [0, 0, -es], [es * 0.17, 0.985, 0], 2.9, 2.1);
  b.col(WOODS.dark, 1.4).surf(K.WOOD, 0);
  for (const e of [-1, 1]) b.rod([ex + es * 0.5, 0, ez + e * 1.3], [ex + es * 0.1, 5.2, ez + e * 0.5], 0.09, 0.09, 4);
  b.rod([ex + es * 2.2, 0, ez], [ex + es * 0.15, 5, ez], 0.09, 0.09, 4); b.box(ex - es * 0.1, 2.15, ez, 0.3, 0.14, 3.1);
  // his table of pots and brushes, a stool, rags; the stove pipe of the room below coming up the wall
  const tx = -es * 5.3, tz = -5.5;
  b.col(WOODS.pale, 0.8).surf(K.WOOD, 0).box(tx, 2.0, tz, 2.2, 0.14, 3.4);
  for (const [dx, dz] of [[-0.9, -1.5], [0.9, -1.5], [-0.9, 1.5], [0.9, 1.5]]) b.box(tx + dx, 0.97, tz + dz, 0.16, 1.94, 0.16);
  for (let i = 0; i < 5; i++) {
    const px = tx + (Z.q[i] - 0.5) * 1.3, pz = tz - 1.3 + i * 0.65;
    b.col([[0.5, 0.42, 0.3], [0.2, 0.22, 0.26], [0.42, 0.2, 0.14], [0.3, 0.3, 0.22], [0.55, 0.5, 0.42]][i]).surf(K.PLAIN, 0).lathe([[0, 2.07], [0.2, 2.07], [0.24, 2.5]], 6, px, pz);
    b.col(WOODS.pale).surf(K.WOOD, 0).rod([px, 2.3, pz], [px + 0.25, 3.3, pz + 0.12], 0.03, 0.02, 3);
  }
  stool(b, ex + es * 1.9, ez + 2.4, 1.5);
  b.col(IRON).surf(K.METAL, 0.3).rod([es * 6.5, 0, -1.4], [es * 6.5, pTop(es * 6.5), -1.4], 0.3, 0.3, 7);
  yield;
  // the bed across the door behind it: low, so that the line passes CLEAR over it
  const bz = -PL + 1.9;
  // (its frame, the mattress, a dark blanket with the sheet turned down over it, the pillow, a board at head and foot)
  b.col(WOODS.tie, 0.7).surf(K.WOOD, 0); bar(b, 0, [-PDW / 2 - 0.7, 0.45, bz], PDW + 1.4, 3.2, 0.9, 4);
  b.col([0.46, 0.42, 0.36]).surf(K.CLOTH, 0); bar(b, 0, [-PDW / 2 - 0.6, 1.03, bz], PDW + 1.2, 3.1, 0.26, 4);
  b.col([0.2, 0.23, 0.3]); bar(b, 0, [-PDW / 2 + 1.7, 1.2, bz], PDW - 1.3, 3.16, 0.14, 4);
  b.col([0.52, 0.49, 0.43]).box(-PDW / 2 + 2.05, 1.29, bz, 0.7, 0.08, 3.16);
  b.col(PAL.paper, 0.75).box(-PDW / 2 + 0.2, 1.27, bz, 1.5, 0.28, 2.3);
  b.col(WOODS.tie, 0.7).surf(K.WOOD, 0).box(-PDW / 2 - 0.6, 1.1, bz, 0.2, 2.2, 3.2).box(PDW / 2 + 0.6, 0.85, bz, 0.2, 1.7, 3.2);
  // his coat and hat on a peg by the door
  // (a coat on its peg in a block of wood on the wall and, over it, a short shelf out of the wall that the hat lies on)
  b.col(WOODS.dark, 1.5).surf(K.WOOD, 0).box(PDW / 2 + 1.7, 5.3, -PL + 0.15, 1.2, 0.3, 0.3).box(PDW / 2 + 1.7, 5.3 + 0.385, -PL + 0.47, 2.2, 0.07, 0.94);
  coatAndHat(b, [PDW / 2 + 1.7, 5.3, -PL + 0.3], [0, 0, 1], Z.q[5], COATC[Math.floor(Z.q[6] * 4.99)]);
}

// ---------------------------------------------------------------------------------------------- the cathedral
// (AISLE_H: the aisle is ceiled a metre over the tops of the arcade's arches, so that stone lies behind every arch top)
const NW = 17, AW = 31, ARCH_Y = 18, ARCH_TOP = 31, AISLE_H = ARCH_TOP + 1, NAVE_H = 74, SPRING = 55;
const STONE_N = [0.36, 0.36, 0.37];
// a pointed vault of half-width w from z0 to z1: its webs, a rib across at each of ribsAt, a rib along the ridge
const vaultArc = (w, f) => { const A = 1.15, a = f * A; return [w * (Math.cos(a) - Math.cos(A)) / (1 - Math.cos(A)), SPRING + (NAVE_H - SPRING) * Math.sin(a) / Math.sin(A)]; };
function* vault(b, w, z0, z1, ribsAt) {
  const NS = 6, L = z0 - z1;
  for (let j = 0; j < NS; j++) {
    const p0 = vaultArc(w, j / NS), p1 = vaultArc(w, (j + 1) / NS);
    for (const s of [-1, 1]) {
      const eu = [s * (p1[0] - p0[0]), p1[1] - p0[1], 0];
      b.col(STONE_N, 0.82).surf(K.STONE, 2.2).tex(2, 1, 0).sheet([s * p0[0], p0[1], z0], eu, [0, 0, -L], 7, [-s, -1, 0]);
      b.col(STONE_N, 1.3).surf(K.STONE, 0);
      for (const z of ribsAt) {
        b.sheet([s * p0[0], p0[1] - 1.2, z - 0.8], eu, [0, 0, 1.6], 30, [-s, -1, 0]);
        b.sheet([s * p0[0], p0[1] - 1.2, z + 0.8], eu, [0, 1.2, 0], 30, [0, 0, 1]); b.sheet([s * p0[0], p0[1] - 1.2, z - 0.8], eu, [0, 1.2, 0], 30, [0, 0, -1]);
      }
    }
    yield;
  }
  for (let i = 0, n = Math.max(1, Math.round(L / 9)); i < n; i++) b.box(0, NAVE_H - 0.7, z0 - (i + 0.5) * L / n, 1.4, 1.4, L / n);
}
// a window of coloured glass in a wall that looks along x (s: the side of the wall): two lights under pointed heads and a
// small eye between them, drawn in the glass itself with their leads (np: small panes across); pointed at the top
function lancet(b, x, s, zm, w, y0, y1, gain, np, pane) {
  const X = x - s * 0.12, V1 = (y1 - y0) / w;
  b.tex(0, 1, 2).col(pane).surf(K.STAINED, gain, np, V1);
  b.quad([X, y0, zm + s * w / 2], [X, y0, zm - s * w / 2], [X, y1, zm - s * w / 2], [X, y1, zm + s * w / 2], [0, 0, 0], [0, 1, 0], [0, 1, V1], [0, 0, V1]);
  b.tri([X, y1, zm + s * w / 2], [X, y1, zm - s * w / 2], [X, y1 + w * 0.9, zm], [0, 0, V1], [0, 1, V1], [0, 0.5, V1 + 0.9]);
  // its stone frame and one mullion
  b.col(STONE_N, 1.2).surf(K.STONE, 0);
  for (const e of [-1, 1]) b.box(x - s * 0.25, (y0 + y1) / 2, zm + e * (w / 2 + 0.3), 0.5, y1 - y0 + 0.6, 0.6);
  b.box(x - s * 0.25, y0 - 0.4, zm, 0.7, 0.8, w + 1.6); b.box(x - s * 0.2, (y0 + y1) / 2, zm, 0.3, y1 - y0, 0.3);
}
// Z: { LN, e (the side we come in by), zJ (where the piers begin), hole: { z0, z1, y0, y1 }, pierZ: [], pews: [[x, z, len]], candle, pulpit, statue, altar: [x, z] }
// The crossing (z from 0 to zJ) stands open from wall to wall under one vault; from zJ on, the nave between its piers,
// a low aisle either side, the high wall over the arcade with its windows, the vault on its ribs.
function* naveShell(b, Z) {
  const { LN, zJ } = Z;
  // the paving: worn flags, pale enough to take the windows' colours and the lamps' pools
  b.col([0.29, 0.29, 0.305]).surf(K.STONE, 3.2, 1.3).tex(0, 2, 1);
  yield* banded(b, [-AW, 0, 0], [0, 0, -LN], [AW * 2, 0, 0], 3.1, UP, 8);
  // the walls of the crossing (the low door in one of them), their tall windows; the west wall
  for (const s of [-1, 1]) {
    const x = s * AW, n = [-s, 0, 0];
    b.col(STONE_N).surf(K.STONE, 1.7, 0, 0.6).tex(2, 1, 0);
    if (s === Z.e) {
      const h = Z.hole;
      b.sheet([x, 0, 0], [0, 0, h.z0], [0, SPRING, 0], 4.5, n); b.sheet([x, 0, h.z1], [0, 0, zJ - h.z1], [0, SPRING, 0], 4.5, n);
      b.sheet([x, h.y1, h.z0], [0, 0, h.z1 - h.z0], [0, SPRING - h.y1, 0], 4, n); b.sheet([x, 0, h.z0], [0, 0, h.z1 - h.z0], [0, h.y0, 0], 3, n);
    } else b.sheet([x, 0, 0], [0, 0, zJ], [0, SPRING, 0], 4.5, n);
    yield;
    // (the glass is dark and wet on a day of rain: a dull glimmer, no more; one window alone throws a shaft, see below)
    for (let i = 0; i < 3; i++) lancet(b, x, s, zJ * (i + 0.5) / 3, 6.4, 17, 43, Z.dull, 13, Z.pane);
    // the aisle beyond: its wall with small windows, its roof, the wall that closes it above towards the crossing
    b.col(STONE_N).surf(K.STONE, 1.7, 0, 0.6).tex(2, 1, 0).sheet([x, 0, zJ], [0, 0, -LN - zJ], [0, AISLE_H, 0], 4.5, n);
    b.col(STONE_N, 0.7).tex(0, 2, 1).sheet([s * NW, AISLE_H, zJ], [s * (AW - NW), 0, 0], [0, 0, -LN - zJ], 7, DOWN);
    b.col(STONE_N, 0.95).tex(0, 1, 2).sheet([s * NW, AISLE_H, zJ], [s * (AW - NW), 0, 0], [0, NAVE_H - AISLE_H, 0], 5, PZ);
    yield;
  }
  b.col(STONE_N).surf(K.STONE, 1.7, 0, 0.6).tex(0, 1, 2).sheet([-AW, 0, 0], [AW * 2, 0, 0], [0, NAVE_H, 0], 6, NZ);
  // the wall between the two vaults, over the arch into the nave
  for (let j = 0; j < 6; j++) for (const s of [-1, 1]) {
    const p0 = vaultArc(NW, j / 6), p1 = vaultArc(NW, (j + 1) / 6);
    const A = [s * p0[0], p0[1], zJ], B = [s * p1[0], p1[1], zJ], C = [s * p1[0], NAVE_H + 1, zJ], D = [s * p0[0], NAVE_H + 1, zJ];
    if (s > 0) b.quad(A, D, C, B); else b.quad(A, B, C, D);
  }
  yield;
  yield* vault(b, AW, 0, zJ, [-1.2, zJ / 3, zJ * 2 / 3, zJ + 1.2]);
  yield* vault(b, NW, zJ, -LN, Z.pierZ);
  // piers, the pointed arcade over them, the high wall with its windows
  const pz = Z.pierZ, ends = [zJ, ...pz, -LN];
  for (const s of [-1, 1]) {
    const x = s * NW, n = [-s, 0, 0];
    for (let i = 0; i < pz.length; i++) {
      b.col(STONE_N, 1.15).surf(K.STONE, 1.4);
      b.box(x, 0.7, pz[i], 6.2, 1.4, 6.2);
      b.lathe([[2.5, 1.4], [2.2, 2.6], [1.8, 3.2], [1.8, ARCH_Y - 1.6], [2.2, ARCH_Y - 1], [2.7, ARCH_Y]], 8, x, pz[i]);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.rod([x + dx * 1.75, 1.4, pz[i] + dz * 1.75], [x + dx * 1.75, ARCH_Y - 1, pz[i] + dz * 1.75], 0.52, 0.52, 5);
      // the shaft that runs on up the wall to the rib it carries
      b.rod([x - s * 0.5, ARCH_Y, pz[i]], [x - s * 0.5, SPRING, pz[i]], 0.6, 0.6, 5);
      if (i % 3 === 2) yield;
    }
    b.col(STONE_N).surf(K.STONE, 1.7, 0, 0.5).tex(2, 1, 0);
    for (let i = 0; i < ends.length - 1; i++) {
      // a pointed arch over the bay: two arcs struck from within it (a round one where the bay is wider than twice its rise);
      // the wall above it has two faces, one to the nave and one to the aisle, each with its own light
      const za = ends[i], zb = ends[i + 1], half = (za - zb) / 2, H = ARCH_TOP - ARCH_Y, NS = 7, r = half < H ? (H * H + half * half) / (2 * half) : 0;
      const arc = (t) => { const th = t * (r ? Math.asin(H / r) : Math.PI / 2); return r ? [r - r * Math.cos(th), r * Math.sin(th)] : [half * (1 - Math.cos(th)), H * Math.sin(th)]; };
      for (const [zs, dir] of [[za, -1], [zb, 1]]) for (let j = 0; j < NS; j++) {
        const p0 = arc(j / NS), p1 = arc((j + 1) / NS);
        for (const [xx, face] of [[x, -s], [x + s * 0.5, s]]) {
          const A = [xx, ARCH_TOP, zs], B = [xx, ARCH_Y + p0[1], zs + dir * p0[0]], C = [xx, ARCH_Y + p1[1], zs + dir * p1[0]];
          if (dir * face * -1 > 0) b.tri(A, B, C); else b.tri(A, C, B);
        }
      }
    }
    b.sheet([x, ARCH_TOP, zJ], [0, 0, -LN - zJ], [0, SPRING - ARCH_TOP, 0], 6, n);
    // a string course under the windows
    for (let i = 0; i < ends.length - 1; i++) b.box(x - s * 0.3, ARCH_TOP + 3, (ends[i] + ends[i + 1]) / 2, 0.6, 0.7, ends[i] - ends[i + 1]);
    yield;
    for (let i = 0; i < ends.length - 1; i++) {
      const zm = (ends[i] + ends[i + 1]) / 2;
      lancet(b, x, s, zm, 5, 37, 50, s === -Z.e && i === Z.shaftBay ? Z.bright : Z.dull, 11, Z.pane);
      lancet(b, s * AW, s, zm, 3, 9, 18, Z.dull * 0.8, 9, Z.pane);
    }
    yield;
  }
  // (what stands on the paving takes the lamps further round its timber and the paving's own light back: no pew is black behind)
  if (Z.soft) b.light(Z.soft);
  yield* naveThings(b, Z);
}
// what stands in the cathedral: pews of worn wood, the one candle, the side altar and its picture, the pulpit, the saint
function* naveThings(b, Z) {
  let i = 0;
  for (const [x, z, len] of Z.pews) {
    const tone = 0.9 + 0.2 * ((i * 7) % 5) / 5;
    b.col([0.27, 0.19, 0.12], tone).surf(K.WOOD, 0, 0.9);
    b.box(x, SEAT - 0.1, z, len, 0.2, 1.4); b.box(x, 2.35, z + 0.78, len, 2.3, 0.16); b.box(x, 3.6, z + 0.82, len + 0.3, 0.22, 0.34);
    // (the kneeling board is carried behind the pew's back, for those of the pew behind: clear of every sitter's feet)
    b.box(x, 0.45, z + 1.4, len, 0.16, 0.5);
    for (const e of [-0.45, 0.45]) b.box(x + e * len, 0.3, z + 1.12, 0.14, 0.14, 0.6);
    for (const e of [-0.5, 0.5]) { b.box(x + e * len, 1.75, z + 0.1, 0.22, 3.5, 1.9); b.lathe([[0.2, 3.5], [0.3, 3.75], [0.18, 4.0], [0, 4.1]], 6, x + e * len, z + 0.75); }
    if (++i % 12 === 0) yield;
  }
  yield;
  // lamps hung on long chains down both sides of the middle aisle: a ring on three chains, a lantern of horn in it
  for (const [x, y, z, , , top = SPRING + 4] of Z.hung) {
    b.col([0.16, 0.14, 0.11]).surf(K.METAL, 0);
    b.rod([x, y + 2.6, z], [x, top, z], 0.05, 0.05, 3);
    for (let k = 0; k < 3; k++) b.rod([x, y + 2.6, z], [x + 0.8 * Math.sin(k * 2.1), y + 1.3, z + 0.8 * Math.cos(k * 2.1)], 0.03, 0.03, 3);
    b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0.4).lathe([[0.82, y + 1.36], [0.9, y + 1.22], [0.5, y + 1.14]], 9, x, z).lathe([[0.5, y - 0.05], [0.56, y], [0.18, y - 0.22], [0, y - 0.3]], 9, x, z);
    b.col([1, 0.78, 0.46]).surf(K.GLOW, 2.3, 2 + Math.abs(z * 0.31 + x) % 4).lathe([[0.5, y], [0.56, y + 0.5], [0.5, y + 1.14]], 9, x, z);
  }
  yield;
  // racks of small candles at the pew ends: an iron stand of three stepped rails, the candles at every height, their flames wavering
  for (const [x, z] of Z.racks) {
    const sx = Math.sign(x);
    b.col([0.1, 0.09, 0.08]).surf(K.METAL, 0);
    for (const e of [-1, 1]) { b.box(x + sx * 0.45, 1.3, z + e * 1.1, 0.08, 2.6, 0.08); b.box(x - sx * 0.35, 0.75, z + e * 1.1, 0.08, 1.5, 0.08); b.box(x + sx * 0.05, 0.08, z + e * 1.1, 1.2, 0.1, 0.1); }
    for (let t = 0; t < 3; t++) {
      const xr = x - sx * (0.35 - t * 0.4), yr = 1.5 + t * 0.55;
      b.col([0.1, 0.09, 0.08]).surf(K.METAL, 0).box(xr, yr, z, 0.34, 0.06, 2.4);
      for (let i = 0; i < 7; i++) {
        const k = (i * 5 + t * 3 + Math.round(Math.abs(z))) % 7, zc = z - 1.02 + i * 0.34, h = 0.22 + 0.06 * k;
        if (k === 3) continue;
        b.col(PAL.paper, 0.9).surf(K.PLAIN, 0).lathe([[0.06, yr + 0.03], [0.055, yr + h], [0, yr + h + 0.01]], 5, xr, zc);
        b.col(SLIT).surf(K.GLOW, 3.4, 1.5 + k + t * 1.3).lathe([[0, yr + h], [0.05, yr + h + 0.08], [0, yr + h + 0.3]], 4, xr, zc);
      }
    }
  }
  yield;
  // the one candle, tall as a tree
  const [cx, cz] = Z.candle;
  b.col([0.5, 0.38, 0.16]).surf(K.METAL, 0).lathe([[1.6, 0], [1.3, 0.5], [0.4, 1.2], [0.5, 2.6], [0.3, 3.1], [0.9, 3.6], [0.95, 3.8]], 8, cx, cz);
  b.col(PAL.paper, 0.95).surf(K.PLAIN, 0).lathe([[0.62, 3.8], [0.56, 12.2], [0.24, 12.45]], 8, cx, cz);
  b.col(SLIT).surf(K.GLOW, 6, 3).lathe([[0, 12.4], [0.5, 12.9], [0.62, 13.7], [0.34, 14.9], [0, 16.4]], 7, cx, cz);
  // the side altar between two piers, its picture in a dull gilt frame: a tall dark figure, half seen by the candle
  const [ax, az] = Z.altar, as = Math.sign(ax);
  b.col(STONE_N, 1.2).surf(K.STONE, 0.9).box(ax, 1.6, az, 2.6, 3.2, 8).box(ax - as * 1.9, 0.3, az, 1.6, 0.6, 9);
  b.col([0.75, 0.72, 0.66]).surf(K.CLOTH, 0).box(ax, 3.3, az, 2.8, 0.14, 8.4);
  b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0);
  for (const e of [-1, 1]) b.box(ax + as * 0.9, 9.2, az + e * 3.1, 0.5, 11.4, 0.5);
  // four tall candles on the altar, alight: an island of light far down the side of the nave
  for (const [i, e] of [-3.3, -1.2, 1.2, 3.3].entries()) {
    const zc = az + e, xc = ax - as * 0.5, top = 7.6 + 0.5 * ((i * 3) % 2);
    b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0).lathe([[0.34, 3.4], [0.12, 3.7], [0.1, 4.9], [0.28, 5.0]], 6, xc, zc);
    b.col(PAL.paper, 0.9).surf(K.PLAIN, 0).lathe([[0.16, 5.0], [0.14, top], [0, top + 0.02]], 6, xc, zc);
    b.col(SLIT).surf(K.GLOW, 4.2, 2.1 + i * 1.7).lathe([[0, top], [0.13, top + 0.22], [0.1, top + 0.55], [0, top + 0.9]], 5, xc, zc);
  }
  b.box(ax + as * 0.9, 15.1, az, 0.5, 0.6, 6.7); b.box(ax + as * 0.9, 3.7, az, 0.5, 0.5, 6.7);
  b.tex(0, 1, 2).col([1, 1, 1]).surf(K.PICTURE, 1);
  const X = ax + as * 0.8;
  b.quad([X, 3.9, az - as * 2.9], [X, 3.9, az + as * 2.9], [X, 14.8, az + as * 2.9], [X, 14.8, az - as * 2.9], [0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]);
  yield;
  // the small side pulpit on its pier, a sounding board low over it, its lamp hung out before it
  const [px, pzz] = Z.pulpit, ps = Math.sign(px);
  b.col(STONE_N, 1.4).surf(K.STONE, 0.8);
  // (the bowl is floored: the priest stands on its floor)
  b.lathe([[0.5, 0], [0.6, 2.4], [1.9, 3.5], [2.0, 3.7], [0, 3.7]], 8, px, pzz);
  b.lathe([[2.0, 3.7], [2.0, 6.2], [2.15, 6.35], [1.85, 6.35], [1.85, 3.7]], 8, px, pzz);
  b.lathe([[2.5, 10.6], [2.3, 11.0], [0.3, 11.8]], 8, px, pzz);
  b.col(WOODS.dark, 1.3).surf(K.WOOD, 0, 0.6);
  for (let k = 0; k < 8; k++) b.box(px + ps * (1.4 - k * 0.02), 0.2 + k * 0.44, pzz + 1.9 + (7 - k) * 0.85, 1.6, 0.26, 0.9);
  b.col([0.14, 0.12, 0.1]).surf(K.METAL, 0).rod([px - ps * 0.2, 10.7, pzz], [px - ps * 2.5, 10.3, pzz], 0.07, 0.07, 4).rod([px - ps * 2.5, 10.3, pzz], [px - ps * 2.5, 9.6, pzz], 0.04, 0.04, 4);
  b.lathe([[0.1, 9.6], [0.34, 9.5], [0.3, 8.9], [0.1, 8.8]], 6, px - ps * 2.5, pzz);
  b.col([1, 0.8, 0.5]).surf(K.GLOW, 4, 4).lathe([[0, 8.95], [0.22, 9.05], [0.2, 9.4], [0, 9.5]], 6, px - ps * 2.5, pzz);
  // a saint's statue, silver, on its block
  const [sx, sz] = Z.statue;
  b.col(STONE_N, 1.3).surf(K.STONE, 0.9).box(sx, 2.2, sz, 2.6, 4.4, 2.6).box(sx, 4.5, sz, 3, 0.3, 3);
  b.col([0.36, 0.38, 0.42]).surf(K.METAL, 0.7);
  b.lathe([[1.0, 4.6], [0.85, 6.7], [0.95, 8.6], [0.6, 9.5], [0.3, 9.7], [0.42, 10.0], [0.44, 10.5], [0, 10.9]], 8, sx, sz);
  b.rod([sx - Math.sign(sx) * 0.9, 7.8, sz], [sx - Math.sign(sx) * 1.5, 11.8, sz - 0.2], 0.09, 0.07, 5);
}

// ---------------------------------------------------------------------------------------------- the roofs of the city
// The city is built at three times life like the lofts: a storey is 9.6 m, a window 4.2 by 6.3 m.
const STREET = -46, STOREY = 9.6;
// a lit or a dark window in a wall that looks along n (in the frame's x and z): the pane, a stone sill and lintel, shutters on some
function wallWindow(b, x, y, z, nx, nz, lit, warm, shut, w = 4.2, h = 6.3, plain = false, stone = [0.46, 0.44, 0.41]) {
  const tx = -nz, tz = nx, P = (a, yy, o) => [x + tx * a + nx * o, yy, z + tz * a + nz * o];
  b.tex(0, 1, 2).col(lit ? mul(WLIT, warm) : [0.2, 0.23, 0.27]).surf(K.GLASS, lit ? 0.92 : 0.16, 2, 3);
  b.quad(P(-w / 2, y, 0.08), P(w / 2, y, 0.08), P(w / 2, y + h, 0.08), P(-w / 2, y + h, 0.08), [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]);
  // (a house 140 m and more from the whole way over the roofs: the pane alone; its sill and lintel are less than a dot there)
  if (plain) return;
  b.col(stone).surf(K.STONE, 0);
  const box = (a, yy, o, ww, hh, dd) => { const p = P(a, yy, o); b.box(p[0], p[1], p[2], Math.abs(tx) * ww + Math.abs(nx) * dd, hh, Math.abs(tz) * ww + Math.abs(nz) * dd); };
  box(0, y - 0.3, 0.45, w + 1.2, 0.6, 0.9); box(0, y + h + 0.35, 0.3, w + 0.9, 0.7, 0.6);
  if (shut) { b.col([0.2, 0.25, 0.22]).surf(K.WOOD, 0.5); for (const e of [-1, 1]) box(e * (w / 2 + 1.1), y + h / 2, 0.2, 2.0, h, 0.2); }
}
// one tenement: h = { x, z, w (along the ridge), d (across), eave, ridge, axis (0: ridge along x, 1: along z), tone, warm, brick,
//   chim: [[t, height, pots]], sky: [[t, side, v]], face: the side (+1 or -1 of its own z) whose wall shows windows, rows: storeys of them, q: [draws] }
function house(b, h, M4, light = null) {
  b.tr(M4.makeRotationY(h.axis ? Math.PI / 2 : 0).setPosition(h.x, 0, h.z));
  const hw = h.w / 2, hd = h.d / 2, ov = 1.3, sl = Math.hypot(hd + ov, h.ridge - h.eave), wall = h.brick ? mul([0.33, 0.22, 0.17], h.tone) : mul([0.4, 0.38, 0.34], h.tone);
  b.col(PAL.slate, 0.55).surf(K.SLATE, 0);
  for (const s of [-1, 1]) {
    const A = [-hw * s, h.eave - 0.35, s * (hd + ov)], B = [hw * s, h.eave - 0.35, s * (hd + ov)], C = [hw * s, h.ridge, 0], D = [-hw * s, h.ridge, 0];
    // (THE WET SLATES TAKE THE ROOF LIGHTS' GLOW: a slope of a near house that carries a lit roof light is laid in
    // cells of 2 m, the same slates in the same courses, and the cells' corners take the lamp glow that falls out
    // of each of its roof lights, warm and soon spent, 8 m at most. A slope without one, and a far house, is one face)
    const lights = h.far || !light ? [] : h.sky.filter((k) => k[1] === s);
    if (!lights.length) b.quad(A, B, C, D, [0, 0, 0], [h.w / 1.5, 0, 0], [h.w / 1.5, sl / 1.5, 0], [0, sl / 1.5, 0]);
    else {
      const G = lights.map(([t, , v]) => new THREE.Vector3((t - 0.5) * h.w * 0.8, lerp(h.eave, h.ridge, 0.41 + 0.3 * v), s * (hd + ov) * (0.59 - 0.3 * v)).applyMatrix4(M4)), R = 8, kw = 1.4 * h.warm;
      b.light((X, Y, Z, nx, ny, nz, o) => {
        light(X, Y, Z, nx, ny, nz, o);
        let w = 0;
        for (const g of G) { const d = Math.hypot(X - g.x, Y - g.y, Z - g.z); if (d < R) w += (1 - d / R) * (1 - d / R); }
        o[0] += kw * w * WLIT[0]; o[1] += kw * w * WLIT[1]; o[2] += kw * w * WLIT[2];
      });
      const nu = Math.max(2, Math.ceil(h.w / 2)), nv = Math.max(2, Math.ceil(sl / 2));
      // (the same share goes with each corner as its fourth number: the wet slate mirrors the glow by it)
      const Gl = lights.map(([t, , v]) => [(t - 0.5) * h.w * 0.8, lerp(h.eave, h.ridge, 0.41 + 0.3 * v), s * (hd + ov) * (0.59 - 0.3 * v)]);
      const share = (p) => { let w = 0; for (const g of Gl) { const d = Math.hypot(p[0] - g[0], p[1] - g[1], p[2] - g[2]); if (d < R) w += (1 - d / R) * (1 - d / R); } return w * h.warm; };
      const Q = (i, j) => [(-hw + h.w * i / nu) * s, lerp(h.eave - 0.35, h.ridge, j / nv), s * (hd + ov) * (1 - j / nv)], Tq = (i, j) => [h.w / 1.5 * i / nu, sl / 1.5 * j / nv, 0, share(Q(i, j))];
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) b.quad(Q(i, j), Q(i + 1, j), Q(i + 1, j + 1), Q(i, j + 1), Tq(i, j), Tq(i + 1, j), Tq(i + 1, j + 1), Tq(i, j + 1));
      b.light(light);
    }
    // the gutter along the eave and the pipe down from it: wet iron
    // (h.tuck: a wing that abuts the tenement we enter carries the gutter of that side 0.7 m in under its eave, where
    // the tenement's own wall hides it: nothing of the wing lies within the loft)
    const gz = s * (hd + ov + 0.2 - (h.tuck && s === h.face ? 0.7 : 0));
    if (!h.far) b.col([0.2, 0.21, 0.23]).surf(K.METAL, 0.4).rod([-hw, h.eave - 0.5, gz], [hw, h.eave - 0.5, gz], 0.3, 0.3, 4);
    if (s === h.face && !h.far) b.rod([hw - 0.8, h.eave - 0.6, s * (hd + 0.5)], [hw - 0.8, STREET, s * (hd + 0.5)], 0.25, 0.25, 4);
    b.col(PAL.slate, 0.55).surf(K.SLATE, 0);
  }
  b.col([0.2, 0.19, 0.19]).surf(K.STONE, 0).box(0, h.ridge + 0.1, 0, h.w, 0.5, 0.9);
  b.col(wall).surf(K.STONE, h.brick ? 0.75 : 0, 0, 1).tex(0, 1, 2);
  for (const s of [-1, 1]) {
    b.sheet([-hw, STREET, s * hd], [h.w, 0, 0], [0, h.eave - STREET, 0], 16, [0, 0, s]);
    b.tex(2, 1, 0).sheet([s * hw, STREET, -hd], [0, 0, h.d], [0, h.eave - STREET, 0], 16, [s, 0, 0]).tex(0, 1, 2);
    const A = [s * hw, h.eave, -hd], B = [s * hw, h.eave, hd], C = [s * hw, h.ridge, 0];
    if (s > 0) b.tri(A, C, B); else b.tri(A, B, C);
  }
  // a cornice under the eave of the wall that shows, its windows storey by storey
  if (h.face) {
    const s = h.face, n = Math.max(2, Math.floor(h.w / 9.5)), q = h.q;
    b.col(wall, 1.2).surf(K.STONE, 0).box(0, h.eave - 1.0, s * (hd + 0.35), h.w, 0.9, 0.7);
    for (let r = 0; r < h.rows; r++) for (let i = 0; i < n; i++) {
      const k = q[(r * 5 + i * 3) % q.length], lit = k < 0.46 * h.warm + 0.14;
      wallWindow(b, (i + 0.5 - n / 2) * (h.w / n), h.eave - 8.4 - r * STOREY, s * hd, 0, s, lit, 0.6 + 0.5 * q[(r + i * 7) % q.length], k > 0.78, 4.2, 6.3, !!h.far);
    }
  }
  // chimney stacks with their pots, skylights lit from within
  for (const [t, ch, pots] of h.chim) {
    const x = (t - 0.5) * h.w * 0.84;
    b.col([0.3, 0.2, 0.15], h.tone).surf(K.STONE, 0.75, 0, 0.8).box(x, h.ridge + ch / 2 - 1.5, 1.0, 1.9 * pots + 1.6, ch + 3, 3.2);
    b.col([0.2, 0.19, 0.18]).surf(K.STONE, 0).box(x, h.ridge + ch + 0.25, 1.0, 1.9 * pots + 2.4, 0.5, 4.0);
    if (!h.far) for (let i = 0; i < pots; i++) b.col([0.4, 0.24, 0.16]).surf(K.PLAIN, 0).lathe([[0.62, h.ridge + ch + 0.5], [0.5, h.ridge + ch + 2.6], [0.66, h.ridge + ch + 2.8]], 5, x + (i - (pots - 1) / 2) * 1.9, 1.0);
  }
  for (const [t, s, v] of h.sky) {
    const x = (t - 0.5) * h.w * 0.8, f0 = 0.28 + 0.3 * v, f1 = f0 + 0.26, P = (dx, f) => [x + dx, lerp(h.eave, h.ridge, f) + 0.14, s * (hd + ov) * (1 - f)];
    // (a roof light: wet glass in glazing bars, three lights by two, the lamp glow of the room under it behind them,
    // amber and never white; a leaded frame stands round it, proud of the slates)
    b.tex(0, 1, 2).col(mul(WLIT, h.warm)).surf(K.GLASS, 0.85, 3, 2);
    b.quad(P(-2.2 * s, f0), P(2.2 * s, f0), P(2.2 * s, f1), P(-2.2 * s, f1), [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]);
    if (!h.far) { const c = [P(-2.3 * s, f0 - 0.012), P(2.3 * s, f0 - 0.012), P(2.3 * s, f1 + 0.012), P(-2.3 * s, f1 + 0.012)]; b.col([0.15, 0.155, 0.17]).surf(K.METAL, 0.3); for (let i = 0; i < 4; i++) b.rod([c[i][0], c[i][1] + 0.1, c[i][2]], [c[(i + 1) % 4][0], c[(i + 1) % 4][1] + 0.1, c[(i + 1) % 4][2]], 0.2, 0.2, 4); }
  }
  b.tr(null);
}
// washing strung on a line from A to B (world), sagging: sheets, shirts and long drawers, each hung in folds; q: [draws]
// (gap: a share of the line, [from, to], left bare)
function washLine(b, A, B, sag, q, drop = 1, gap = null) {
  const n = 10, len = Math.hypot(B[0] - A[0], B[2] - A[2]), ax = (B[0] - A[0]) / len, az = (B[2] - A[2]) / len;
  const P = (t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t) - sag * 4 * t * (1 - t), lerp(A[2], B[2], t)];
  // the line itself, thick enough to be seen, wound twice round what it is tied to at each end and knotted, a tail hanging
  b.col([0.5, 0.45, 0.37]).surf(K.PLAIN, 0);
  for (let i = 0; i < n; i++) b.rod(P(i / n), P((i + 1) / n), 0.075, 0.075, 4);
  for (const E of [A, B]) {
    for (const dy of [-0.13, 0.13]) b.rod([E[0] - az * 0.3, E[1] + dy, E[2] + ax * 0.3], [E[0] + az * 0.3, E[1] + dy, E[2] - ax * 0.3], 0.085, 0.085, 4);
    b.lathe([[0, E[1] - 0.2], [0.17, E[1] - 0.08], [0.17, E[1] + 0.08], [0, E[1] + 0.2]], 5, E[0], E[2]).rod([E[0], E[1] - 0.1, E[2]], [E[0] + az * 0.12, E[1] - 0.95, E[2] - ax * 0.12], 0.06, 0.04, 3);
  }
  let t = 0.05 + 0.05 * q[0], i = 0;
  const TONES = [PAL.paper, PAL.paper, [0.62, 0.64, 0.68], [0.5, 0.36, 0.3], [0.36, 0.4, 0.5], [0.66, 0.6, 0.5]];
  while (t < 0.9 && i < 12) {
    const kind = gap ? 0.5 * q[(i * 3 + 1) % q.length] : q[(i * 3 + 1) % q.length], w0 = (kind > 0.7 ? 2.6 + 3 * q[(i + 2) % q.length] : 1.4 + 1.2 * q[(i + 2) % q.length]), dr = drop * (kind > 0.7 ? 2.2 + 1.4 * q[(i + 4) % q.length] : 1.6 + 2.2 * q[(i + 4) % q.length]), t0 = t, ph = i * 1.7;
    // nothing hangs past the end of its line: the last piece is as wide as the line has left, or is not hung
    const w = Math.min(w0, (0.96 - t) * len);
    if (w < 1.0) break;
    if (gap && t + w / len > gap[0] && t < gap[1]) { t = t + w / len > gap[0] && t < gap[0] - 1.6 / len ? t + 0.5 / len : gap[1] + 0.01; i++; continue; }
    b.col(TONES[Math.floor(q[(i + 5) % q.length] * 5.99)], 0.8 + 0.3 * q[(i + 6) % q.length]).surf(K.CLOTH, 0).tex(0, 1, 2);
    // two legs for drawers, one piece otherwise; folds run down it, deeper toward the hem
    for (const [u0, u1] of kind < 0.25 ? [[0, 0.42], [0.58, 1]] : [[0, 1]]) b.grid(Math.max(2, Math.round(5 * (u1 - u0))), 3, (u, v, o) => {
      const uu = u0 + (u1 - u0) * u, p = P(t0 + uu * w / len), f = 0.28 * (0.3 + v) * Math.sin(uu * 9 + ph) + 0.12 * v * Math.sin(uu * 23 + ph * 2);
      o[0] = p[0] - az * f; o[1] = p[1] - v * dr * (1 - 0.12 * Math.sin(uu * 3.1 + ph)); o[2] = p[2] + ax * f; o[3] = v;
    });
    // its pegs, astride the line
    b.col([0.46, 0.36, 0.24]).surf(K.WOOD, 0);
    for (const u of kind < 0.25 ? [0.08, 0.34, 0.66, 0.92] : w > 2.4 ? [0.06, 0.5, 0.94] : [0.1, 0.9]) { const p = P(t0 + u * w / len); b.box(p[0], p[1] - 0.06, p[2], 0.16, 0.5, 0.16); }
    t += (w + 0.5 + 1.9 * q[(i + 2) % q.length]) / len; i++;
  }
}

export default {
  id: 'courts-in-the-attics',
  name: 'The Courts in the Attics',
  category: 'books',
  placeKind: 'interior',
  book: 'The Trial',
  author: 'Franz Kafka, 1883 to 1924',
  media: ['interior'],
  weirdness: 0.7,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' ? 'golden' : 'day';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    const U = courtUniforms();
    U.uOpen.value = rare ? 1 : 0;
    // Every seeded stream of the world, taken here, once: each is made from the visit's seed and its own name.
    const own = (name) => makeRng(hashSeed('courts-' + name + ':' + ctx.seed));
    const rr = own('roofs'), rl = own('lofts'), rc = own('corridor'), rf = own('files');
    const rpL = [0, 1, 2, 3].map((k) => own('people-loft' + k)), rpc = own('people-corridor'), rpp = own('people-painter'), rpn = own('people-nave'), rpf = own('passage-files'), rpap = own('papers');
    // (dust has a stream for each piece, the washing of the lofts, the corridor and the yard one each, the pigeons of the lofts and
    // of the roofs one each: a count that hangs on the hour or the density moves nothing but its own piece)
    const rmL = [0, 1, 2, 3].map((k) => own('motes-loft' + k)), rmP = own('motes-passage'), rmN = own('motes-nave');
    const rw = own('laundry'), rwC = own('laundry-corridor'), rwY = own('laundry-yard'), rb = own('birds'), rbR = own('birds-roofs'), rrain = own('rain'), rcl = own('clutter'), rls = own('loose-sheets'), rsm = own('smoke'), rsk = own('sky');
    const draws = (r, n = 8) => { const q = []; for (let i = 0; i < n; i++) q.push(r()); return q; };

    // ------------------------------------------------------------ the plan and the route (src/parts: courtPlan, from the seed alone)
    const plan = courtPlan(ctx.seed);
    const { lofts, links, cor, pnt, nav, gat, wellAt, side, beyond, dirOf, rightOf } = plan;
    const { e, thN, RN, zE, zJ, LN } = nav, G = GATES, rg = plan.rg, RP = ATTIC.RP;
    await ctx.yield();
    const path = makePath(plan.pts, { samples: 640 });
    await ctx.yield();
    // the film (src/parts: courtFilm): the marks of the route in metres, the pace, the pulls of the gaze
    const film = courtFilm(plan, path), LEN = film.LEN, mOf = film.mOf, mGate = film.mGate;
    await ctx.yield();

    // ------------------------------------------------------------ light by the hour
    const HR = hour === 'night' ? { beam: [0.08, 0.1, 0.16], amb: 0.62, lamp: 1.55, sky: [0.03, 0.04, 0.06], pane: [0.1, 0.13, 0.2], out: 0.36, rad: 1.25 }
      : hour === 'golden' ? { beam: [2.7, 1.75, 0.85], amb: 0.95, lamp: 1, sky: [0.4, 0.33, 0.24], pane: [1.3, 0.95, 0.55], out: 1, rad: 1 }
        : { beam: [1.5, 1.55, 1.65], amb: 1, lamp: 1, sky: [0.3, 0.29, 0.28], pane: [0.9, 0.93, 1.0], out: 1, rad: 1 };
    // one sun: the baked light comes from where the sky is given its sun (elevation, azimuth), hour by hour; by night a high dim
    // moon, which the sky is given at the same place (the kit draws it behind the rain cloud: a pale patch where the light comes from)
    const SUN = hour === 'golden' ? [7, -36] : hour === 'night' ? [40, 25] : [38, -30], sunW = skyDirection(SUN[0], SUN[1]);
    // THE BREAK. The sky over the roofs stands in storm, and low in it, 34 degrees beside the cathedral as
    // the first roofs see it, the cloud is broken and a low warm light comes through. It is a standing light, the
    // same for the whole visit: the sky's second glow, a second far light on the roofs and on the cathedral's spire, a
    // sheen in the wet slates that mirror it. By the golden hour the break is the low sun itself; by night there is none.
    const BRK = (() => {
      const cw = nav.toW(0, 0, zJ / 2), p0 = path.posAtDist(0, new THREE.Vector3()), azC = Math.atan2(cw.x - p0.x, -(cw.z - p0.z)) * 180 / Math.PI;
      const away = ((azC - SUN[1]) % 360 + 540) % 360 - 180 >= 0 ? 34 : -34, az = hour === 'golden' ? SUN[1] : azC + away, el = hour === 'golden' ? SUN[0] : 4;
      return { az, el, dir: skyDirection(el, az), col: hour === 'night' ? [0, 0, 0] : hour === 'golden' ? [0.8, 0.5, 0.24] : [1.0, 0.6, 0.28] };
    })();
    U.uBreak.value.copy(BRK.dir); U.uBreakC.value.set(BRK.col[0] * 0.66, BRK.col[1] * 0.66, BRK.col[2] * 0.66);
    U.uSky.value.set(HR.sky[0], HR.sky[1], HR.sky[2]);
    const personGeo = personGeometry();
    await ctx.yield();
    // THE AIR IS THE PLACE'S OWN, one standing weather for the visit: each piece of the world is drawn in the air of the
    // place it stands in (its own material, with its own fog), and nothing changes that air in flight. Grey rain over the
    // roofs and the yard; brown dusk under the rafters; the corridor's and the painter's a little thicker; the
    // cathedral's dusk; the court's grey (a far wall sinks into dim grey, never into black). The gates reach out of the cathedral into the court: their air is told by how
    // deep a thing stands beyond the first gate's plane (the cathedral's from 20 m before it, the court's from 60 m in).
    const FOG = {
      out: hour === 'night' ? [0.035, 0.045, 0.065, 0.004] : hour === 'golden' ? [0.45, 0.36, 0.26, 0.0032] : [0.285, 0.27, 0.255, 0.0034],
      loft: [0.06 * HR.amb, 0.066 * HR.amb, 0.078 * HR.amb, 0.0055], cor: [0.052 * HR.amb, 0.056 * HR.amb, 0.066 * HR.amb, 0.006], nave: [0.05, 0.055, 0.07, 0.0055],
      court: [0.07, 0.076, 0.096, 0.0017],
    };
    const V4 = (a) => new THREE.Vector4(a[0], a[1], a[2], a[3]);
    const airOf = (fog, more) => { const u = { ...U, uFog: { value: V4(fog) }, ...(more || {}) }; return { u, mat: courtMaterial(u), fig: figureMaterial(u) }; };
    const g0 = gat.w3(0, 0, 0), g1 = gat.w3(0, 0, -1), gf = [g1[0] - g0[0], g1[2] - g0[2]];
    const AIR = { out: airOf(FOG.out), loft: airOf(FOG.loft), cor: airOf(FOG.cor), nave: airOf(FOG.nave),
      court: airOf(FOG.nave, { uBreath: { value: 0.12 }, uFogB: { value: V4(FOG.court) }, uFogP: { value: new THREE.Vector4(gf[0], 0, gf[1], 20 - (g0[0] * gf[0] + g0[2] * gf[1])) }, uFogS: { value: 80 } }) };
    await ctx.yield();
    const people = [], beamsAll = [], naveBeams = [], motesAll = [], zones = [], birdList = [];
    // (every shaft, every mote and every pigeon belongs to the piece whose room it stands in, and is drawn with that
    // piece and never without it: claim(name) gives all that has been listed since the last claim to the piece `name`)
    const claim = (name) => { for (const l of [beamsAll, naveBeams, motesAll, birdList]) for (let i = l.length - 1; i >= 0 && l[i].zone === undefined; i--) l[i].zone = name; };
    // (coats: blacks, browns, greys, a green, a blue, a rust; none so pale that a man is of one colour with his face)
    const COATS = [[0.175, 0.165, 0.16], [0.21, 0.17, 0.135], [0.15, 0.165, 0.215], [0.24, 0.19, 0.13], [0.18, 0.18, 0.175], [0.23, 0.21, 0.18], [0.165, 0.2, 0.15], [0.18, 0.195, 0.24], [0.25, 0.16, 0.11], [0.21, 0.2, 0.195]];
    const out3 = [0, 0, 0];
    // A person of the court at a place of a piece's own frame, dealt from that piece's own stream r. His own five draws
    // are made before the lane or anything else is asked. In the halls, the last court and the nave's pews they are
    // made also for one whom his caller's chance leaves out (o.here false), so that one man's being there or not
    // never shifts the next; in the lofts and the corridor the caller's chance comes first, as it has since their
    // people were dealt (they stand as they stood).
    // THE RULE OF THE PEOPLE: no figure stands nearer than NEARMAN (6.15 m) to the line: the gap is
    // the gap in space of the whole line to his whole upright (feet to crown; one who walks: at nine places of his whole
    // walk). One who would stand nearer steps outward from the middle of the room, a quarter metre at a time as far as
    // o.xmax; if that is not enough he is not there. o.lane says otherwise for those the rule cannot hold for (the
    // corridor's sitters, back against the wall; the painter; those down the stair's well, whom the line passes above).
    // No one is taller than a man (MAN), and no one stands with his crown nearer than 0.7 m to the roof over him (Z.head).
    // (his light is the light of his place: the side of him that the lamps of the room light most, and the way to it)
    const keyOf = (light, x, y, z) => {
      let bx = 0, bz = 0, best = -1; const col = [0, 0, 0];
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        light(x, y, z, nx * 0.8, 0.6, nz * 0.8, out3);
        const l = out3[0] + out3[1] + out3[2]; bx += nx * l; bz += nz * l;
        if (l > best) { best = l; col[0] = out3[0]; col[1] = out3[1]; col[2] = out3[2]; }
      }
      const k = Math.hypot(bx, bz) || 1;
      // (a man who stands in a shaft of the day is lit, not bleached: his light is held to 0.85 at its strongest, its colour kept)
      // (and one who stands away from every lamp is still a man in a coat, never a black lump: his light is no less than 0.4)
      const top = Math.max(col[0], col[1], col[2], 1e-3), hold = top > 0.85 ? 0.85 / top : top < 0.4 ? 0.4 / top : 1;
      col[0] *= hold; col[1] *= hold; col[2] *= hold;
      return { col, dir: [0.62 * bx / k, 0.75, 0.62 * bz / k] };
    };
    // o.kind: 0 one who waits (hat in his hands: seat 1 rises and bows on a round of his own), 1 a clerk writing, 2 a carrier of
    // files, 3 a woman at the washing line, 4 one who looks up, 6 an usher pointing, 8 a whisperer (o.bow: the side he leans to),
    // 9 a sleeper, 10 one who reads his petition, 11 one who bows low, 12 one who stands with his hands behind his back
    // WHAT STANDS AT HIS PLACE IS ASKED. solids: what stands on the floors of the halls and the last court (the part's
    // list: flights, their cheeks, benches, lecterns, posts, bundles; each a box in a frame of its own with the height
    // of its top). One who stands or walks is not dealt into one of them: like one too near the line he steps outward,
    // or he is not there. (One who sits is dealt to his seat. In the lofts, the corridor and the cathedral the things
    // on the floor ask the people instead: clearOf, keepOf.)
    const solids = [], _sv = new THREE.Vector3();
    const inSolid = (x, y, z) => {
      for (const e of solids) {
        if (y > e.top - 0.25) continue;
        _sv.set(x, y, z).applyMatrix4(e.inv);
        if (_sv.x > e.x0 - 0.55 && _sv.x < e.x1 + 0.55 && _sv.z > e.z0 - 0.55 && _sv.z < e.z1 + 0.55) return true;
      }
      return false;
    };
    // (where the people of a list stand, sit and walk, in the frame M: [x, z, r] each, for clearOf)
    const keepOf = (M, list) => {
      const inv = new THREE.Matrix4().copy(M).invert(), v = new THREE.Vector3(), keep = [];
      for (const f of list) {
        const n = f.run ? Math.ceil(f.run) : 0, fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
        for (let k = 0; k <= n; k++) { const d = n ? f.run * k / n : 0; v.set(f.x + fx * d, f.y, f.z + fz * d).applyMatrix4(inv); if (Math.abs(v.y) < 1.5) keep.push([v.x, v.z, 0.85]); }
        if (f.seat) { v.set(f.x + fx * 0.2 * f.h, f.y, f.z + fz * 0.2 * f.h).applyMatrix4(inv); if (Math.abs(v.y) < 1.5) keep.push([v.x, v.z, 0.75]); }
      }
      return keep;
    };
    const person = (Z, light, list, r, o) => {
      let h = (o.h ?? 1) * MAN * (0.84 + 0.16 * r()); const colK = r.pick(COATS), phase = r.range(0, TAU), bowK = r.range(0.3, 0.5), hatK = (o.kind ?? 0) === 0 ? r.pick([2, 2, 2, 1, 0]) : r.pick([1, 0]);
      const lane = o.lane ?? NEARMAN, sx = Math.sign(o.x) || 1, xmax = Math.max(o.xmax ?? 0, Math.abs(o.x)), nine = o.run ? 8 : 0;
      // (o.here === false: his five draws are made and he is not dealt: one left out moves no other of his stream)
      if (o.here === false) return null;
      // (in the halls and the court, where they stand in knots, a man asks for 0.8 m of his own too: no one already
      // dealt to this list stands or sits that near his place)
      const crowded = (q) => lane === FARMAN && list.some((f) => Math.abs(f.y - q.y) < 2.5 && (f.x - q.x) ** 2 + (f.z - q.z) ** 2 < 0.64);
      // (one who sits is dealt to his SEAT: o.y is the floor the seat stands on and o.top the seat's top over it, SEAT
      // if it is not said; his soles are SITK of his own height under the seat's top. Seat 3 sits on a step: o.y is
      // the tread he sits on, and his soles are STEPK of his height under it, over the tread below)
      const oy = (o.y ?? 0) + (o.seat ? (o.top ?? (o.seat === 3 ? 0 : SEAT)) - (o.seat === 3 ? STEPK : SITK) * h : 0);
      let w = null, free = true;
      for (let ax = Math.abs(o.x); ax <= xmax + 1e-6 && !w; ax += 0.25) {
        const hx = !o.seat && Z.head ? Math.min(h, Z.head(ax)) : h;
        if (hx < 0.8 * (o.h ?? 1) * MAN) break;
        let gap = 1e9; free = true;
        for (let k = 0; k <= nine; k++) { const q = Z.toW(sx * ax, oy, o.z - (o.run || 0) * k / (nine || 1)); gap = Math.min(gap, laneSeg(q.x, q.y, q.z, q.x, q.y + hx, q.z, lane + 0.5)); if (!o.seat && solids.length && inSolid(q.x, q.y, q.z)) free = false; }
        if (gap >= lane && free) { const q = Z.toW(sx * ax, oy, o.z); if (crowded(q)) free = false; else { w = q; h = hx; } }
      }
      // (o.alt: other places for him, asked in turn where his own place keeps the lane but something stands in it: one
      // of a knot steps back out of a bench, a lectern or a pile of bundles. No draw is made for it.)
      if (!w && !free && o.alt) for (const [ax, az] of o.alt) {
        const q = Z.toW(ax, oy, az);
        if (laneSeg(q.x, q.y, q.z, q.x, q.y + h, q.z, lane + 0.5) >= lane && !inSolid(q.x, q.y, q.z) && !crowded(q)) { w = q; break; }
      }
      if (!w) return null;
      const key = keyOf(light, w.x, w.y + 0.6 * h, w.z);
      const f = { x: w.x, y: w.y, z: w.z, yaw: Z.psi + o.yaw, h, seat: o.seat === 2 || o.seat === 3 ? o.seat : o.seat ? 1 : 0, kind: o.kind ?? 0, col: o.col || colK, phase,
        light: [key.col[0] + 0.07, key.col[1] + 0.076, key.col[2] + 0.088], bow: o.bow ?? bowK, ld: key.dir, hat: o.hat ?? hatK };
      if (o.run) { f.seat = 0; f.run = o.run; }
      list.push(f);
      return f;
    };
    // Those who wait on a bench of n places along z (its middle zc, the places `gap` apart, facing `face`): the bench's
    // own draws first (who is there, his turn, his role); more.all: an empty place takes its man's draws too.
    // Most sit with their hats in their hands and rise to bow on rounds of their own; one sleeps, one reads his petition over
    // again, and two lean together and whisper.
    const benchRow = (Z, light, list, r, x, zc, n, gap, face, p, more = {}) => {
      const pairAt = r.int(0, Math.max(0, n - 2)), pair = n > 1 && r.chance(0.45);
      for (let j = 0; j < n; j++) {
        // (more.all: on a bench of the halls or the court no two sit a like distance apart: each sits up to 0.35 m
        // along the bench from his place, by a draw he has made already; the two who whisper keep theirs)
        const there = r.chance(p), dy = r.range(-0.2, 0.2), role = r(), z = zc + (j - (n - 1) / 2) * gap + (more.all && !(pair && (j === pairAt || j === pairAt + 1)) ? dy * 1.75 : 0);
        // (more.all: in the halls and the court an empty place takes its man's draws all the same)
        if (!there) { if (more.all) person(Z, light, list, r, { here: false }); continue; }
        if (pair && (j === pairAt || j === pairAt + 1)) { const dz = j === pairAt ? gap : -gap; person(Z, light, list, r, { ...more, x, z, yaw: face + dy * 0.4, seat: 2, kind: 8, still: 1, bow: 0.2 * Math.sign(-Math.sin(face) * dz) || 0.2 }); }
        else if (role < 0.14) person(Z, light, list, r, { ...more, x, z, yaw: face + dy, seat: 2, kind: 9, still: 1, bow: 0.3 });
        else if (role < 0.3) person(Z, light, list, r, { ...more, x, z, yaw: face + dy, seat: 2, kind: 10, still: 1, bow: 0.16 });
        else person(Z, light, list, r, { ...more, x, z, yaw: face + dy, seat: 1 });
      }
    };
    // the line's gap to a point of the world, in space (the rule of the lane: no solid nearer than CLEAR)
    const gapTo = (w) => { const n = path.nearestXZ(w[0], w[2]); return Math.hypot(n.dist, n.y - w[1]); };
    // THE EYE THAT FIRST SEES THIS WORLD looks in through the ring of the world before it: it flies the entry's straight
    // continued BACK behind the entry, level, at the entry's height, from far behind. ENT is the entry (its place and
    // its level heading), BACKLEN how far back that line is kept (the town runs on under the whole of it: 'the town
    // behind the entry', below), backGap the gap in space of a place to it.
    const BACKLEN = 300;
    const ENT = (() => { const p0 = path.posAtDist(0, new THREE.Vector3()), p1 = path.posAtDist(1, new THREE.Vector3()), l = Math.hypot(p1.x - p0.x, p1.z - p0.z) || 1; return { x: p0.x, y: p0.y, z: p0.z, hx: (p1.x - p0.x) / l, hz: (p1.z - p0.z) / l }; })();
    const backGap = (x, y, z) => { const t = clamp(-((x - ENT.x) * ENT.hx + (z - ENT.z) * ENT.hz), 0, BACKLEN); return Math.hypot(x - (ENT.x - ENT.hx * t), y - ENT.y, z - (ENT.z - ENT.hz * t)); };
    // The lane for the many small things that move on the world's own clock (dust, drips, smoke): the line's places every
    // half metre in a grid of 5 m cells, and with them that backward line, BACKLEN of it. laneSeg: the least gap of the
    // lane to a stretch a..b, within `reach`.
    const laneGrid = new Map(), laneCell = 5;
    { const p = new THREE.Vector3(), put = (x, y, z) => { const k = Math.floor(x / laneCell) * 4099 + Math.floor(z / laneCell); let c = laneGrid.get(k); if (!c) laneGrid.set(k, c = []); c.push(x, y, z); };
      for (let m = 0; m <= LEN; m += 0.5) { path.posAtDist(m, p); put(p.x, p.y, p.z); if (m % 150 === 0) await ctx.yield(); }
      for (let t = 0.5; t <= BACKLEN; t += 0.5) put(ENT.x - ENT.hx * t, ENT.y, ENT.z - ENT.hz * t); }
    await ctx.yield();
    const laneSeg = (ax, ay, az, bx, by, bz, reach = 4.5) => {
      const x0 = Math.floor((Math.min(ax, bx) - reach) / laneCell), x1 = Math.floor((Math.max(ax, bx) + reach) / laneCell), z0 = Math.floor((Math.min(az, bz) - reach) / laneCell), z1 = Math.floor((Math.max(az, bz) + reach) / laneCell);
      const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz;
      let best = reach * reach;
      for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
        const c = laneGrid.get(ix * 4099 + iz); if (!c) continue;
        for (let k = 0; k < c.length; k += 3) {
          const px = c[k] - ax, py = c[k + 1] - ay, pz = c[k + 2] - az, t = l2 > 0 ? clamp((px * dx + py * dy + pz * dz) / l2, 0, 1) : 0, ex = px - dx * t, ey = py - dy * t, ez = pz - dz * t, d2 = ex * ex + ey * ey + ez * ez;
          if (d2 < best) best = d2;
        }
      }
      return Math.sqrt(best);
    };
    // dust and drips keep out of the lane at every hour of the world's clock: a mote [x, y, z, number, drift x, y, z, run]
    // whose whole run, with its wander (0.64 m at most for the slowest) and its own size, would come within CLEAR of the
    // lane is left out, after its draws
    // (far: a greater gap asked for, as for the dust of the halls and the last court)
    const moteOk = (m, far = 0) => {
      const sp = Math.hypot(m[4], m[5], m[6]), h = sp > 1e-6 ? 0.5 * Math.max(m[7], 1) / sp : 0, need = Math.max(CLEAR + 0.64 / (1 + sp * sp) + 0.3, far);
      // (m[8]: how near its whole run comes to the line, kept for its standing clearance: a mote within 6 m of the line is thinner)
      m[8] = laneSeg(m[0] - m[4] * h, m[1] - m[5] * h, m[2] - m[6] * h, m[0] + m[4] * h, m[1] + m[5] * h, m[2] + m[6] * h, Math.max(7, need + 0.5));
      return m[8] >= need;
    };
    // (how far a place lies from the line, for the shafts' standing clearance: 8 m and more is all one)
    const gapPt = (x, y, z) => laneSeg(x, y, z, x, y, z, 8);
    // ------------------------------------------------------------ what stands in each loft (seeded), and its light
    // A loft is lit by its own sources and is dark away from them: grey day through the skylights (rain on the panes),
    // a lamp on each clerk's desk, a few lamps hung from the ties, the stove's mouth, the slits under the doors.
    const KINDS = ['bench', 'bench', 'bench', 'desk', 'desk', 'heap', 'laundry', 'booth'];
    const slopeLen = Math.hypot(HW, RIDGE - KNEE), LAMP = mul([1, 0.74, 0.42], 1.75 * HR.lamp), DAY = mul(HR.beam, hour === 'golden' ? 0.7 : 1.0);
    for (const Z of lofts) {
      const bl = Z.L / Z.nb, lamps = [], beams = [], occ = [], items = [], sky = [], pend = [], drips = [], rm = rmL[Z.k];
      // the trusses: a tie beam's under side keeps CLEAR above the line; where the line comes in higher than that allows
      // (inside the garret window) the truss carries a collar far up instead
      Z.trussZ = []; Z.collar = [];
      for (let i = 0; i <= Z.nb; i++) {
        const z = i === 0 ? -0.7 : i === Z.nb ? -Z.L + 0.7 : -i * bl, w = Z.toW(0, 0, z), n = path.nearestXZ(w.x, w.z);
        Z.trussZ.push(z); Z.collar.push(TIE - n.y < CLEAR + 0.2);
      }
      // the stair: its inner handrails keep CLEAR (and their own thickness) from the widest swing of the line over the void
      if (Z.well) {
        let swing = 0;
        for (let z = Z.well.z + 8; z >= Z.well.z - 8; z -= 1) { const w = Z.toW(Z.well.x, 0, z); swing = Math.max(swing, path.nearestXZ(w.x, w.z).dist); }
        Z.well.rail = CLEAR + 0.15 + swing;
      }
      const stove = [rl.int(1, Z.nb - 2), rl.chance(0.5) ? 1 : -1];
      let prev = [null, null];
      for (let i = 0; i < Z.nb; i++) {
        const z0 = -i * bl, z1 = z0 - bl, zc = (z0 + z1) / 2;
        for (const s of [-1, 1]) {
          let kind = rl.pick(KINDS);
          if (kind === prev[s < 0 ? 0 : 1]) kind = rl.pick(['desk', 'heap', 'laundry', 'booth', 'bench']);
          if (i === 0 && Z.k === 0) kind = s < 0 ? 'bench' : 'heap';
          if (i === stove[0] && s === stove[1]) kind = 'stove';
          prev[s < 0 ? 0 : 1] = kind;
          const it = { kind, s, z0, z1, q: draws(rl, 10), n: 0 };
          items.push(it);
          if (kind === 'desk') { lamps.push([...Z.w3(s * 8.7, 4.0, zc + 2.15), LAMP[0], LAMP[1], LAMP[2], 2.7]); occ.push([s * 9.15, zc, 2.4], [s * 12.1, zc, 2.6]); }
          if (kind === 'booth') lamps.push([...Z.w3(s * 7.0, 0.3, zc), SLIT[0] * 1.7, SLIT[1] * 1.7, SLIT[2] * 1.7, 1.3], [...Z.w3(s * 6.9, 5.4, zc), WARM[0] * 0.55, WARM[1] * 0.55, WARM[2] * 0.55, 1.6]);
          if (kind === 'stove') { lamps.push([...Z.w3(s * 8.5, 1.25, zc), 1.7 * HR.lamp, 0.7 * HR.lamp, 0.2 * HR.lamp, 1.9]); occ.push([s * 9.7, zc, 1.5]); }
          if (kind === 'heap') occ.push([s * 9.6, zc, 2.8]);
          if (kind === 'bench') occ.push([s * 9.0, zc - bl * 0.22, 1.7], [s * 9.0, zc + bl * 0.22, 1.7]);
        }
        // a grimy skylight in one slope of the bay: the day falls through it in a grey shaft onto the boards
        if (rl.chance(0.62)) {
          const s = (i + Z.k) % 2 ? 1 : -1, f = rl.range(0.4, 0.56), zz = zc + rl.range(-1, 1);
          const c = [s * HW * (1 - f), KNEE + (RIDGE - KNEE) * f, zz], nIn = new THREE.Vector3(-s * (RIDGE - KNEE), -HW, 0).normalize();
          const d = new THREE.Vector3(nIn.x * 0.55, -1, 0).normalize();
          const dW = new THREE.Vector3(...Z.d3(d.x, d.y, d.z)), nW = new THREE.Vector3(...Z.d3(nIn.x, nIn.y, nIn.z));
          let lit = hour !== 'night';
          if (hour === 'golden') { dW.copy(sunW).negate(); lit = nW.dot(dW) > 0.25; }
          const aW = new THREE.Vector3(...Z.d3(0, 0, 1)), bW = new THREE.Vector3().crossVectors(dW, aW).normalize(), cW = Z.w3(c[0], c[1] - 0.2, c[2]);
          const hb = 1.75 * Math.max(nW.dot(dW), 0.3);
          sky.push({ s, f, z: zz, lit });
          if (lit) {
            beams.push({ c: cW, d: [dW.x, dW.y, dW.z], a: [aW.x, aW.y, aW.z], ha: 2.0, b: [bW.x, bW.y, bW.z], hb, col: DAY, soft: 1.2 });
            const len = Math.min(cW[1] / Math.max(-dW.y, 0.15), 30);
            beamsAll.push({ a: cW, d: [dW.x, dW.y, dW.z], w: [bW.x, bW.y, bW.z], len, w0: hb, w1: hb * 1.1 }, { a: cW, d: [dW.x, dW.y, dW.z], w: [aW.x, aW.y, aW.z], len, w0: 2.0, w1: 2.1 });
            for (let j = 0, n = Math.round(16 * detail * density); j < n; j++) {
              const t = rm.range(0.5, len - 0.3), u = rm.range(-1.9, 1.9), v = rm.range(-hb, hb), sp = rm.range(0.04, 0.14), an = rm.range(0, TAU);
              motesAll.push([cW[0] + dW.x * t + aW.x * u + bW.x * v, cW[1] + dW.y * t + aW.y * u + bW.y * v, cW[2] + dW.z * t + aW.z * u + bW.z * v, rm(), Math.cos(an) * sp, -sp * 0.5, Math.sin(an) * sp, 3]);
            }
          }
        }
      }
      // lamps hung from the tie beams beside the lane, here and there; none where it would hang within CLEAR of the line
      // (every draw of a lamp before its test)
      for (let i = 1; i < Z.nb; i++) {
        const sx = rl.chance(0.5) ? 1 : -1, hang = rl.chance(0.55), drop = rl.range(0.9, 1.5), num = rl(), p = Z.w3(sx * 5.6, TIE - drop, Z.trussZ[i]);
        // (the dust about the lamp takes its draws before the lamp is asked for: a lamp not hung moves no other dust)
        const dust = [];
        for (let j = 0, nm = Math.round(9 * detail); j < nm; j++) { const an = rm.range(0, TAU), sp = rm.range(0.05, 0.16); dust.push([p[0] + rm.range(-2.4, 2.4), rm.range(1, p[1]), p[2] + rm.range(-2.4, 2.4), rm(), Math.cos(an) * sp, sp * 0.4, Math.sin(an) * sp, 3]); }
        if (!hang || Z.collar[i] || gapTo(p) < CLEAR + 0.6 || (Z.well && Math.abs(Z.trussZ[i] - Z.well.z) < 8.5)) continue;
        pend.push({ x: sx * 5.6, y: TIE - drop, z: Z.trussZ[i], num });
        motesAll.push(...dust);
        lamps.push([p[0], p[1] - 0.2, p[2], LAMP[0] * 0.95, LAMP[1] * 0.95, LAMP[2] * 0.95, 3.1]);
      }
      // a lamp hung under the slope just inside the garret window, to one side of the way in: through the window the
      // room is seen by it before we are in it (its draws before its test)
      if (Z.winA) {
        const sx = rl.chance(0.5) ? 1 : -1, num = rl(), p = Z.w3(sx * 5.4, 5.6, -5.5);
        if (gapTo(p) >= CLEAR + 0.6) { pend.push({ x: sx * 5.4, y: 5.6, z: -5.5, num, top: roofY(5.4) - 0.1 }); lamps.push([p[0], p[1] - 0.2, p[2], LAMP[0] * 0.95, LAMP[1] * 0.95, LAMP[2] * 0.95, 3.1]); }
      }
      // the roof leaks: a bucket under each drip, at the lane's edge (its draws before its test)
      for (let j = 0, n = rcl.int(2, 3); j < n; j++) {
        const x = (rcl.chance(0.5) ? 1 : -1) * rcl.range(4.9, 6.1), z = -rcl.range(4, Z.L - 4), num = [rcl(), rcl()];
        if (Z.well && Math.abs(z - Z.well.z) < 10) continue;
        drips.push([x, z]);
        for (let k = 0; k < 2; k++) { const run = roofY(x) - 1.2, w = Z.w3(x, 0.9 + run / 2, z); motesAll.push([w[0], w[1], w[2], num[k], 0, -7, 0, run]); }
      }
      // the garret window: the day comes in by it and lies along the boards of the first bays
      if (Z.winA && hour !== 'night') {
        const d = new THREE.Vector3(...Z.d3(0, -0.34, -1)).normalize(), a = Z.d3(1, 0, 0), bb = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...a)).normalize();
        beams.push({ c: Z.w3(0, 4.5, 0.4), d: [d.x, d.y, d.z], a, ha: 3.4, b: [bb.x, bb.y, bb.z], hb: 3.2, col: mul(DAY, 0.9), soft: 1.6, len: 30 });
        // (the day also spreads to either side inside the window, on the near posts, the first rafters and the
        // boards under them: the loft has a near and a far as we come to it)
        for (const s of [-1, 1]) lamps.push([...Z.w3(s * 6.4, 5.6, -3.2), DAY[0] * 0.2, DAY[1] * 0.2, DAY[2] * 0.2, 8], [...Z.w3(s * 3.2, 2.2, -9), DAY[0] * 0.09, DAY[1] * 0.09, DAY[2] * 0.09, 7]);
      }
      // closed doors either side of the way out, light under each; the head of the stair is lit by gas from below
      for (const s of [-1, 1]) lamps.push([...Z.w3(s * 8.3, 0.25, -Z.L + 0.9), SLIT[0] * 1.6, SLIT[1] * 1.6, SLIT[2] * 1.6, 1.4]);
      if (Z.well) lamps.push([...Z.w3(Z.well.x, -6, Z.well.z), 1.3 * HR.lamp, 1.0 * HR.lamp, 0.62 * HR.lamp, 4.2], [...Z.w3(Z.well.x, -19, Z.well.z), 1.2, 0.9, 0.55, 4.5]);
      Z.items = items; Z.sky = sky; Z.who = []; Z.occ = occ; Z.pend = pend; Z.drips = drips;
      Z.lightSpec = { up: mul(DUSK_UP, HR.amb), down: mul(DUSK_DOWN, HR.amb), lamps, beams, floorY: 0, cut: 3, wrap: 0.5 };
      claim('loft' + Z.k);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the lofts: who waits there, then the shell and all that fills it
    const M4 = new THREE.Matrix4();
    // (ta..td: what the material is drawn in at each corner, where that is not the corner's own place)
    const quadW = (b, A, B, C, D, want, ta = A, tb = B, tc = C, td = D) => {
      const nx = (B[1] - A[1]) * (D[2] - A[2]) - (B[2] - A[2]) * (D[1] - A[1]), ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]), nz = (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0]);
      if (nx * want[0] + ny * want[1] + nz * want[2] < 0) b.quad(A, D, C, B, ta, td, tc, tb); else b.quad(A, B, C, D, ta, tb, tc, td);
    };
    for (const Z of lofts) {
      const pre = makeLighter(Z.lightSpec), who = Z.who, bl = Z.L / Z.nb, rp = rpL[Z.k];
      // (how tall one may stand at x under the slope of the roof: his crown 0.7 m under the boards)
      Z.head = (ax) => roofY(ax) - 0.7;
      for (const it of Z.items) {
        const { s, z0, z1 } = it, zc = (z0 + z1) / 2, face = -s * Math.PI / 2;
        if (it.kind === 'bench') {
          // the waiting men: seated in a row, hats in their hands; each rises and bows on a round of his own
          const n = density > 1.05 ? 4 : 3, len = bl - 1.8;
          benchRow(Z, pre, who, rp, s * 8.85, zc, n, len * 0.9 / n, face, 0.9);
        } else if (it.kind === 'desk') {
          // the clerk writing at his desk behind the screen; a man at the hatch, hat in hand
          person(Z, pre, who, rp, { x: s * 10.5, z: zc, yaw: face, seat: 2, still: 1, kind: 1, bow: 0.12 });
          const there = rp.chance(0.7 * density), dy = rp.range(-0.3, 0.3);
          const low = rp.chance(0.35);
          if (there) person(Z, pre, who, rp, low ? { x: s * 6.7, xmax: 7.0, z: zc + 0.3, yaw: -face + dy, kind: 11, hat: 0 } : { x: s * 6.7, xmax: 7.0, z: zc + 0.3, yaw: -face + dy, bow: 0.42, hat: 2 });
        } else if (it.kind === 'heap') {
          // a man carrying an armful of files along the posts (they slide as he goes); one sorting at the table
          person(Z, pre, who, rp, { x: s * 6.5, xmax: 7.0, z: z0 - 1.6, yaw: Math.PI, kind: 2, run: bl - 3.2, bow: 0.22 });
          person(Z, pre, who, rp, { x: s * 9.3, z: z1 + 3.1, yaw: Math.PI, kind: 1, hat: 0, bow: 0.1, still: 1 });
        } else if (it.kind === 'laundry') {
          // a woman hanging washing on the line; a child by the tub
          const dy = rp.range(-0.3, 0.3), child = rp.chance(0.5);
          person(Z, pre, who, rp, { x: s * 6.95, xmax: 7.05, z: zc - 0.6, yaw: s * Math.PI / 2 + dy, kind: 3, hat: 0, col: [0.27, 0.28, 0.31], bow: 0.05 });
          if (child) person(Z, pre, who, rp, { x: s * 8.6, z: zc + 2.9, yaw: face + 0.4, h: 0.6, bow: 0.1, hat: 0, col: [0.3, 0.27, 0.24] });
        } else if (it.kind === 'stove') {
          // an usher warming himself at the stove; a man on a stool
          person(Z, pre, who, rp, { x: s * 8.2, z: zc + 1.9, yaw: Math.atan2(s * 1.5, -1.9), hat: 1, bow: 0.25 });
          person(Z, pre, who, rp, { x: s * 8.45, z: zc - 2.1, yaw: Math.atan2(s * 1.25, 2.1), seat: 2, hat: 2, bow: 0.3 });
        } else {
          // two who wait at the door of the boarded office, a little way out from its wall
          for (let j = 0; j < 2; j++) { const dy = rp.range(-0.25, 0.25), role = rp(); person(Z, pre, who, rp, { x: s * (6.75 + 0.2 * j), xmax: 7.05, z: zc + (j ? -2.3 : 2.1), yaw: -face + (j ? -0.7 : 0.7) + dy, ...(role < 0.4 ? { kind: 10, bow: 0.16 } : role < 0.7 ? { kind: 12, bow: 0 } : { bow: 0.36 + 0.1 * j, hat: 2 }) }); }
        }
        await ctx.yield();
      }
      // the usher of the loft, by the way out, pointing it
      { const su = rp.chance(0.5) ? 1 : -1; person(Z, pre, who, rp, { x: su * 6.3, xmax: 8.3, z: -Z.L + 3.4, yaw: Math.PI + su * 0.35, kind: 6, hat: 1, bow: 0.2, col: [0.06, 0.06, 0.07] }); }
      if (Z.well) {
        const w = Z.well, xm = w.rail + (4.4 - w.rail) / 2;
        // (those down the stair: the child on the first flight keeps the rule of the people or is not there; the line
        // passes nine metres and more above the two on the landing, who keep the lane and a metre and a half more)
        person(Z, pre, who, rp, { x: w.x + xm, y: -2.77, z: w.z + 8 - 0.3 - 4.95, yaw: 0, h: 0.6, bow: 0.02, hat: 0, col: [0.36, 0.3, 0.27], still: 1 });
        person(Z, pre, who, rp, { x: w.x - 1.5, y: -9, z: w.z - 7.9, yaw: 0.4, h: 0.5, bow: 0.02, hat: 0, col: [0.3, 0.28, 0.3], still: 1, lane: CLEAR + 1.5 });
        person(Z, pre, who, rp, { x: w.x + 1.2, y: -9, z: w.z - 7.6, yaw: -0.3, kind: 3, hat: 0, col: [0.4, 0.37, 0.33], bow: 0.05, still: 1, lane: CLEAR + 1.5 });
      }
      Z.keep = keepOf(Z.M, who);
      // pigeons on the tie beams, out toward the posts: each flies over to the next truss and back on a round of its own
      // (the world's clock); perch and flight keep CLEAR of the line (the flight rises 1.7 m over a straight course)
      for (let i = 1; i <= Z.nb - 2; i++) {
        const fly = rb.chance(0.75), sx = rb.chance(0.5) ? 1 : -1, n = rb.int(2, 4);
        for (let j = 0; j < n; j++) {
          const xa = sx * rb.range(4.6, 7.0), xb = sx * rb.range(4.6, 7.0), ph = rb();
          const ya = (Z.collar[i] ? COLLAR : TIE) + 0.72, yb = (Z.collar[i + 1] ? COLLAR : TIE) + 0.72;
          const p = Z.toW(xa, ya, Z.trussZ[i]), q = Z.toW(xb, yb, Z.trussZ[i + 1]);
          if (!fly || Math.abs(xa) > HW * (RIDGE - ya) / (RIDGE - KNEE) - 0.6 || Math.min(gapTo([p.x, p.y, p.z]), gapTo([q.x, q.y, q.z]), gapTo([(p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2])) < CLEAR + 1.2) continue;
          pre(p.x, p.y, p.z, 0, 1, 0, out3);
          birdList.push({ p, q, light: [out3[0] + 0.03, out3[1] + 0.03, out3[2] + 0.03], ph, fly: p.distanceTo(q) / 6 });
        }
      }
      await ctx.yield();
      for (const f of who) { const l = new THREE.Vector3(f.x, 0, f.z).applyMatrix4(M4.copy(Z.M).invert()); if (Math.abs(f.y - Z.O.y) < 0.5 && f.kind !== 2) Z.occ.push([l.x, l.z, 1.15]); }
      const light = makeLighter({ ...Z.lightSpec, occ: Z.occ.map(([x, z, r]) => { const w = Z.w3(x, 0, z); return [w[0], w[2], r]; }) });
      const b = makeBatch(1 << 17);
      b.tr(Z.M).light(light);
      const shell = loftShell(b, Z);
      while (!shell.next().done) await ctx.yield();
      // skylights: a grimy pane in its frame, rain running on it
      for (const k of Z.sky) {
        const P = (du, dz) => { const f = k.f + du / slopeLen; return [k.s * HW * (1 - f) - k.s * 0.1, KNEE + (RIDGE - KNEE) * f - 0.16, k.z + dz]; };
        b.col(mul(HR.pane, 0.86)).surf(K.GLASS, k.lit ? 0.8 : 0.52, 2, 2);
        quadW(b, P(-1.8, 2), P(-1.8, -2), P(1.8, -2), P(1.8, 2), [-k.s, -1, 0]);
        b.col(WOODS.dark, 1.4).surf(K.WOOD, 0);
        for (const e of [-1, 1]) { b.rod(P(-1.9, e * 2.1), P(1.9, e * 2.1), 0.14, 0.14, 4); b.rod(P(e * 1.9, -2.1), P(e * 1.9, 2.1), 0.14, 0.14, 4); }
        b.rod(P(-1.9, 0), P(1.9, 0), 0.08, 0.08, 4); b.rod(P(0, -2.1), P(0, 2.1), 0.08, 0.08, 4);
      }
      // the lamps hung from the ties: cord, tin shade, flame
      for (const k of Z.pend) {
        b.col(WOODS.dark).surf(K.PLAIN, 0).rod([k.x, k.top ?? TIE, k.z], [k.x, k.y + 0.25, k.z], 0.04, 0.04, 3);
        b.col([0.34, 0.3, 0.2]).surf(K.METAL, 0.3).lathe([[0.1, k.y + 0.25], [0.6, k.y + 0.05], [0.66, k.y - 0.05]], 7, k.x, k.z);
        b.col([1, 0.76, 0.44]).surf(K.GLOW, 1.9, 2 + k.num * 4).lathe([[0, k.y - 0.5], [0.24, k.y - 0.4], [0.26, k.y - 0.12], [0.1, k.y + 0.04]], 6, k.x, k.z);
      }
      for (const [x, z] of Z.drips) if (clearOf(Z.keep, x, z, 0.6)) bucket(b, x, z, [0.1, 0.12, 0.14]);
      // the closed doors either side of the way out, light under each
      for (const s of [-1, 1]) {
        const x = s * 8.3, z = -Z.L + 0.12;
        b.col(WOODS.tie, 1.25).surf(K.WOOD, 0.62).box(x, 2.54, z + 0.1, 2.5, 4.6, 0.14);
        b.col(WOODS.tie, 0.8).surf(K.WOOD, 0);
        for (const [y, hh] of [[1.5, 1.9], [3.7, 1.7]]) for (const e of [-1, 1]) b.box(x + e * 0.58, y, z + 0.19, 0.84, hh, 0.05);
        b.col(WOODS.dark, 1.2).surf(K.WOOD, 0); doorFrameSmall(b, x, z + 0.14);
        b.col(SLIT).surf(K.GLOW, 1.5, 0).box(x, 0.12, z + 0.05, 2.3, 0.1, 0.08);
      }
      await ctx.yield();
      for (const it of Z.items) { it.keep = Z.keep; const f = furnish(b, it); while (!f.next().done) await ctx.yield(); await ctx.yield(); }
      // washing strung across the loft from plate to plate, the lane between the posts left clear under the bare line
      for (let i = 1; i < Z.nb; i += 2) {
        const hang = rw.chance(0.6), q = draws(rw, 9), z = Z.trussZ[i] - bl * 0.5 + (q[0] - 0.5) * 2;
        // (and none is hung over the head of one who stands or walks there: the line asks the loft's people)
        if (!hang || (Z.well && Math.abs(z - Z.well.z) < 9) || gapTo(Z.w3(0, PLATE - 0.8, z)) < CLEAR + 0.1 || Z.keep.some((k) => Math.abs(k[1] - z) < 1.3 && Math.abs(k[0]) > 4)) continue;
        const gap = (POSTX - 4.4) / (POSTX * 2);
        washLine(b, [-POSTX, PLATE - 0.3, z], [POSTX, PLATE - 0.3, z], 0.45, q, 0.7, [gap, 1 - gap]);
      }
      await ctx.yield();
      // more washing in the roof space: lines strung from truss to truss above the ties, well over the lane
      for (let i = 1; i < Z.nb; i++) {
        const hang = rw.chance(0.55), sx = rw.chance(0.5) ? 1 : -1, q = draws(rw, 9), za = Z.trussZ[i] - 0.5, zb = Z.trussZ[i + 1] + 0.5, x = sx * (2.6 + q[1]), y = roofY(x) - 1.3;
        if (!hang || Z.collar[i] || Z.collar[i + 1] || gapTo(Z.w3(x, y - 2.6, (za + zb) / 2)) < CLEAR + 0.3) continue;
        washLine(b, [x, y, za], [x, y, zb], 0.35, q, 0.62);
      }
      await ctx.yield();
      // towers of old files against the knee walls, bay after bay
      for (let i = 0; i < Z.nb; i++) for (const s of [-1, 1]) {
        const q = draws(rf, 9), it = Z.items[i * 2 + (s > 0 ? 1 : 0)];
        if (it.kind === 'desk' || it.kind === 'heap' || it.kind === 'booth') continue;
        for (let j = 0, n = 2 + Math.floor(q[0] * 3); j < n; j++) stack(b, s * (12.25 - 0.3 * q[j + 1]), 0, it.z0 - 1.2 - (j + q[j + 2] * 0.5) * (bl - 2.4) / n, 2 + Math.floor(q[j + 3] * 4), q, j * 2, 0.95, 0.8);
      }
      await ctx.yield();
      // piles of files at the feet of the posts, loose sheets on the boards along the lane's edges (the sheets' count
      // hangs on the density, so they have a stream of their own that nothing else follows on)
      for (let i = 1; i < Z.nb; i++) for (const s of [-1, 1]) { const there = rf.chance(0.6), dz = rf.range(-0.9, 0.9), q = draws(rf), n = rf.int(2, 5); if (there) heap(b, s * (POSTX + 0.9), Z.trussZ[i] + dz, q, n, 0.6, Z.keep); }
      await ctx.yield();
      for (let i = 0, n = Math.round(Z.L * 0.9 * density); i < n; i++) {
        const x = (rls.chance(0.5) ? 1 : -1) * rls.range(3.2, 7.4), z = -rls.range(1.5, Z.L - 1.5), yaw = rls.range(0, TAU), tone = rls.range(0.7, 1);
        if (!(Z.well && Math.abs(z - Z.well.z) < 8.3 && Math.abs(x - Z.well.x) < 4.8)) leaf(b, x, 0.03 + 0.002 * (i % 7), z, yaw, tone);
      }
      Z.batch = b; Z.light = light;
      claim('loft' + Z.k);
      await ctx.yield();
    }
    function doorFrameSmall(b, x, z) { for (const e of [-1, 1]) b.box(x + e * 1.4, 2.45, z, 0.24, 4.9, 0.3); b.box(x, 4.95, z, 3.04, 0.26, 0.3); }

    // ------------------------------------------------------------ the bent passages between the lofts
    // things set against a wall from P0 to P1 (world, on the floor): fn works in a frame whose x runs along the wall and whose +z is the room
    const onWall = (b, P0, P1, inward, fn) => {
      const dx = P1.x - P0.x, dz = P1.z - P0.z, len = Math.hypot(dx, dz), a = Math.atan2(-dz, dx);
      const zx = Math.sin(a), zz = Math.cos(a), sgn = zx * inward.x + zz * inward.z < 0 ? -1 : 1;
      b.tr(M4.makeRotationY(a).setPosition(P0.x, 0, P0.z)); fn(len, sgn); b.tr(null);
    };
    for (const [k, Lk] of links.entries()) {
      const b = lofts[k].batch, n = 6, hwP = DOORW / 2, H = DOORH + 0.6, slit = Lk.at(0.42, RP + hwP - 0.5);
      // two lamps hang short under the ceiling of the passage, one to each side of the way and CLEAR and more above the line;
      // dust turns in their light
      const hung = [0.2, 0.8].map((f, i) => Lk.at(f, RP + (i ? -2.4 : 2.4))), lampY = Math.max(6.05, ...hung.map((p) => path.nearestXZ(p.x, p.z).y + CLEAR + 0.6));
      const lamps = [[slit.x, 0.25, slit.z, SLIT[0] * 1.7, SLIT[1] * 1.7, SLIT[2] * 1.7, 1.3]];
      for (const p of hung) {
        lamps.push([p.x, lampY, p.z, LAMP[0], LAMP[1], LAMP[2], 3.3]);
        for (let j = 0, nm = Math.round(14 * detail); j < nm; j++) { const an = rmP.range(0, TAU), sp = rmP.range(0.05, 0.16); motesAll.push([p.x + rmP.range(-2.6, 2.6), rmP.range(1.2, lampY), p.z + rmP.range(-2.6, 2.6), rmP(), Math.cos(an) * sp, sp * 0.4, Math.sin(an) * sp, 3]); }
      }
      const light = makeLighter({ up: mul(DUSK_UP, HR.amb), down: mul(DUSK_DOWN, HR.amb), cut: 3, wrap: 0.5, lamps });
      b.tr(null).light(light);
      const A = (v, y) => [v.x, y, v.z], mix = (P, Q, t, y) => [lerp(P.x, Q.x, t), y, lerp(P.z, Q.z, t)];
      for (let j = 0; j < n; j++) {
        const I0 = Lk.at(j / n, RP - hwP), I1 = Lk.at((j + 1) / n, RP - hwP), O0 = Lk.at(j / n, RP + hwP), O1 = Lk.at((j + 1) / n, RP + hwP);
        const inw = I0.clone().sub(O0).normalize(), outw = inw.clone().negate();
        // boards under foot, boards on joists overhead, boarded walls
        for (let c = 0; c < 4; c++) {
          b.col(WOODS.floor).surf(K.WOOD, 0.9).tex(0, 1, 2); quadW(b, mix(I0, O0, c / 4, 0), mix(I0, O0, (c + 1) / 4, 0), mix(I1, O1, (c + 1) / 4, 0), mix(I1, O1, c / 4, 0), UP);
          b.col(WOODS.board, 0.8).surf(K.WOOD, 0.55); quadW(b, mix(I0, O0, c / 4, H), mix(I0, O0, (c + 1) / 4, H), mix(I1, O1, (c + 1) / 4, H), mix(I1, O1, c / 4, H), DOWN);
        }
        // boarded walls: the boards stand upright and are laid off along each wall's own length (metres along the inner
        // and the outer wall), so that their seams show whichever way the passage runs
        b.col(WOODS.board, 1.2).surf(K.WOOD, 0.75).tex(0, 1, 2);
        const sI0 = (RP - hwP) * Math.abs(Lk.th) * j / n, sI1 = (RP - hwP) * Math.abs(Lk.th) * (j + 1) / n, sO0 = 40 + (RP + hwP) * Math.abs(Lk.th) * j / n, sO1 = 40 + (RP + hwP) * Math.abs(Lk.th) * (j + 1) / n;
        for (const [ya, yb] of [[0, H / 2], [H / 2, H]]) {
          quadW(b, A(I0, ya), A(I1, ya), A(I1, yb), A(I0, yb), [outw.x, 0, outw.z], [sI0, 0, ya], [sI1, 0, ya], [sI1, 0, yb], [sI0, 0, yb]);
          quadW(b, A(O0, ya), A(O1, ya), A(O1, yb), A(O0, yb), [inw.x, 0, inw.z], [sO0, 0, ya], [sO1, 0, ya], [sO1, 0, yb], [sO0, 0, yb]);
        }
        b.col(WOODS.tie, 0.95).surf(K.WOOD, 0);
        for (let c = 0; c < 3; c++) b.rod(mix(I0, O0, c / 3, H - 0.3), mix(I0, O0, (c + 1) / 3, H - 0.3), 0.28, 0.28, 4);
        onWall(b, O0, O1, inw, (len, sg) => {
          if (j === 2) {
            b.col(WOODS.tie, 1.25).surf(K.WOOD, 0.62).box(len / 2, 2.54, sg * 0.12, 2.5, 4.6, 0.14);
            b.col(WOODS.tie, 0.8).surf(K.WOOD, 0);
            for (const [y, hh] of [[1.5, 1.9], [3.7, 1.7]]) for (const e of [-1, 1]) b.box(len / 2 + e * 0.58, y, sg * 0.21, 0.84, hh, 0.05);
            b.col(WOODS.dark, 1.2).surf(K.WOOD, 0); for (const e of [-1, 1]) b.box(len / 2 + e * 1.4, 2.45, sg * 0.14, 0.24, 4.9, 0.3);
            b.box(len / 2, 4.95, sg * 0.14, 3.04, 0.26, 0.3);
            b.col(SLIT).surf(K.GLOW, 1.5, 0).box(len / 2, 0.12, sg * 0.06, 2.3, 0.1, 0.08);
          } else {
            // a low rack of shelves on uprights (its top under the eye, the boarded wall seen over it), bundles of every
            // size on them, some askew, some two deep
            b.col(WOODS.pale, 0.72).surf(K.WOOD, 0);
            for (const x of [0.2, len / 2, len - 0.2]) b.box(x, 1.3, sg * 0.4, 0.12, 2.6, 0.8);
            for (const y of [0.35, 1.4, 2.45]) {
              b.col(WOODS.pale, 0.72).surf(K.WOOD, 0).box(len / 2, y, sg * 0.4, len - 0.3, 0.1, 0.8);
              for (let i = 0, m = Math.floor((len - 0.6) / 1.5); i < m; i++) {
                const there = rpf.chance(0.75), dx = rpf.range(-0.1, 0.1), h = rpf.range(0.3, 0.9), t = rpf.range(0.76, 1.04), wd = rpf.range(0.8, 1.3), yw = rpf.range(-0.22, 0.22), two = rpf.chance(0.35);
                if (!there) continue;
                bundle(b, 0.9 + i * 1.5 + dx, y + 0.05, sg * 0.42, wd, h, 0.7, yw, t);
                if (two && h < 0.6) bundle(b, 0.82 + i * 1.5 + dx, y + 0.05 + h, sg * 0.42, wd * 0.85, 0.3, 0.62, -yw * 1.5, t - 0.08);
              }
            }
          }
        });
        b.light(light);
        // along the inner wall: a long narrow table heaped with files (the passages are offices too)
        onWall(b, I0, I1, outw, (len, sg) => {
          b.col(WOODS.pale, 0.8).surf(K.WOOD, 0).box(len / 2, 1.5, sg * 0.4, len - 0.1, 0.14, 0.62);
          b.box(len * 0.5, 0.72, sg * 0.4, 0.14, 1.44, 0.5);
          for (let i = 0, m = Math.floor((len - 0.4) / 1.45); i < m; i++) { const top = rpf.int(0, 4), q = draws(rpf, 9); if (top) stack(b, 0.75 + i * 1.45, 1.58, sg * 0.4, top, q, i, 1.1, 0.58); }
        });
        b.light(light);
      }
      for (const [j, p] of hung.entries()) {
        b.col(WOODS.dark).surf(K.PLAIN, 0).rod([p.x, H - 0.3, p.z], [p.x, lampY + 0.6, p.z], 0.05, 0.05, 4);
        b.col([0.5, 0.36, 0.14]).surf(K.METAL, 0.3).lathe([[0.1, lampY + 0.62], [0.5, lampY + 0.5], [0.56, lampY + 0.42]], 7, p.x, p.z);
        b.col([1, 0.76, 0.44]).surf(K.GLOW, 1.9, 2.5 + k + j * 1.7).lathe([[0, lampY], [0.24, lampY + 0.1], [0.28, lampY + 0.35], [0.1, lampY + 0.5]], 6, p.x, p.z);
      }
      claim('loft' + k);
      await ctx.yield();
    }
    for (const Z of lofts) {
      const mesh = new THREE.Mesh(Z.batch.build(), AIR.loft.mat); mesh.frustumCulled = false; scene.add(mesh);
      const ppl = makePeople(personGeo, AIR.loft.fig, Z.who); scene.add(ppl.object);
      zones.push({ name: 'loft' + Z.k, objs: [mesh, ppl.object], m0: mOf(Z.toW(0, 0, 0)), m1: mOf(Z.toW(0, 0, -Z.L)) + (links[Z.k] ? RP * Math.abs(links[Z.k].th) : 0) });
      Z.batch = null;
      await ctx.yield();
    }

    // ------------------------------------------------------------ the corridor of doors
    const doorList = [];
    {
      const Z = cor, who = [], lamps = [], occ = [];
      Z.doors = []; Z.benches = []; Z.lampZ = []; Z.lines = [];
      // (each hung lamp wears a tin shade: a small glow round it, and its light thrown down in a pool on the boards)
      const beams = [], dn = [0, -1, 0], ax = Z.d3(1, 0, 0), az = Z.d3(0, 0, 1);
      for (let i = 0, n = Math.round((Z.L - 9) / 15.5); i <= n; i++) { const z = -4.5 - i * (Z.L - 9) / n; Z.lampZ.push(z); const p = Z.w3(0, CLAMP + 0.05, z); lamps.push([p[0], p[1], p[2], LAMP[0] * 0.8, LAMP[1] * 0.8, LAMP[2] * 0.8, 3.3]); beams.push({ c: p, d: dn, a: ax, ha: 2.6, b: az, hb: 2.6, col: mul(LAMP, 0.42), soft: 2.6 }); }
      // (the side of the clerk's high desk at the corridor's end: no bench and no one at a door stands in its queue's place)
      const deskS = rc.chance(0.5) ? 1 : -1, deskQ = draws(rc, 9), queue = (s, z) => s === deskS && z < -Z.L + 12.5;
      for (const s of [-1, 1]) for (let z = -5 - (s > 0 ? 3.1 : 0), i = 0; z > -Z.L + 5; z -= 6.2, i++) {
        // between this door and the next: a bench for those who wait, or files heaped by the frame, or bare boards
        const q = draws(rc), what = rc(), line = rwC.chance(0.3), ql = draws(rwC, 9);
        const d = { s, z, q, files: what > 0.78 ? -1 : 0 };
        Z.doors.push(d);
        lamps.push([...Z.w3(s * (CHW - 0.7), 0.2, z), SLIT[0] * 1.6, SLIT[1] * 1.6, SLIT[2] * 1.6, 1.3]);
        if (z - 6.2 > -Z.L + 5 && what < 0.62 && !queue(s, z - 3.1)) Z.benches.push({ s, z: z - 3.1, len: 2.9, q });
        if (s < 0 && line && z - 1.55 > -Z.L + 6 && Z.lampZ.every((lz) => Math.abs(lz - z + 1.55) > 2.5)) Z.lines.push({ z: z - 1.55, q: ql });
      }
      // The one thing the corridor leads the eye to: at its end, beside the way out, a clerk at a high desk on a step, under
      // a lamp of his own, and those whose turn it is standing before him.
      Z.desk = { s: deskS, x: deskS * 6.3, z: -Z.L + 3.4, q: deskQ };
      { const p = Z.w3(deskS * 5.55, 7.2, -Z.L + 3.6); lamps.push([p[0], p[1], p[2], LAMP[0] * 1.9, LAMP[1] * 1.9, LAMP[2] * 1.9, 5]); }
      const spec = { up: mul(DUSK_UP, HR.amb), down: mul(DUSK_DOWN, HR.amb), lamps, beams, cut: 3, wrap: 0.5 };
      const pre = makeLighter(spec);
      // THE CORRIDOR IS NOT WIDE ENOUGH for the rule of the people at its walls when the line sways: those who sit there
      // sit back against the wall on low benches (SITLANE: no nearer than 5.4 m; nearly all keep the 6.15 m), the
      // clerk sits raised behind his high desk at the end wall, and one who STANDS in it (at a door, before the desk,
      // walking with his files, the usher) keeps the 6.15 m or is not there: he is seen whole or not at all
      person(Z, pre, who, rpc, { x: Z.desk.x, y: 2.4, z: -Z.L + 1.7, yaw: -deskS * 0.25, seat: 2, still: 1, kind: 1, hat: 0, bow: 0.12, lane: SITLANE });
      { const r1 = rpc(), r2 = rpc();
        person(Z, pre, who, rpc, { x: deskS * 6.5, xmax: 6.9, z: -Z.L + 6.4, yaw: Math.PI - deskS * 0.1, still: 1, ...(r1 < 0.5 ? { kind: 10, bow: 0.16 } : { kind: 11, hat: 0 }) });
        person(Z, pre, who, rpc, { x: deskS * 6.6, xmax: 6.9, z: -Z.L + 9.2, yaw: Math.PI - deskS * 0.1, still: 1, ...(r2 < 0.5 ? { kind: 12, bow: 0 } : { bow: 0.4, hat: 2 }) }); }
      occ.push([Z.desk.x, Z.desk.z - 0.6, 2.2]);
      // those who wait: two to a bench, hats in their hands, rising and bowing on rounds of their own; a few at the doors
      for (const it of Z.benches) {
        benchRow(Z, pre, who, rpc, it.s * (CHW - 0.66), it.z, 2, 1.5, -it.s * Math.PI / 2, 0.85 * Math.min(1, density), { lane: SITLANE });
        occ.push([it.s * (CHW - 0.62), it.z, 1.8]);
      }
      for (const d of Z.doors) { const there = rpc.chance(0.3 * density), dy = rpc.range(-0.3, 0.3), role = rpc(); if (there && !queue(d.s, d.z)) person(Z, pre, who, rpc, { x: d.s * (CHW - 0.75), z: d.z + 0.2, yaw: d.s * Math.PI / 2 + dy, ...(role < 0.35 ? { kind: 10, bow: 0.16 } : role < 0.6 ? { kind: 11, hat: 0 } : { bow: 0.4, hat: 2 }) }); }
      // a man with an armful of files going down the corridor; the usher at its end, pointing the door
      { const sw = rpc.chance(0.5) ? 1 : -1, zw = -rpc.range(0.25, 0.6) * Z.L; person(Z, pre, who, rpc, { x: sw * 5.95, xmax: 6.2, z: zw, yaw: Math.PI, kind: 2, run: 11, bow: 0.22 }); }
      { const su = -deskS; person(Z, pre, who, rpc, { x: su * 6.1, xmax: 6.9, z: -Z.L + 2.6, yaw: Math.PI + su * 0.4, kind: 6, hat: 1, bow: 0.2, col: [0.13, 0.135, 0.17] }); }
      // (THE CORRIDOR'S PEOPLE TAKE ITS LAMPS as its walls and its files do: they stand and sit at the walls, between
      // the pools the hung lamps throw down the middle, and a dark coat in the dusk between two pools came out a black
      // shape. Each has the light the plaster behind him has, and no less than a share of a lamp's; his coat is a
      // dark cloth, a little lighter than the same coat in the lofts' daylight, never black; face and hands are seen)
      for (const f of who) { f.light = f.light.map((c, i) => Math.max(c * 1.15, [0.6, 0.51, 0.39][i] * HR.lamp)); f.col = f.col.map((c) => c * 1.18 + 0.012); }
      Z.keep = keepOf(Z.M, who);
      const light = makeLighter({ ...spec, occ: occ.map(([x, z, r]) => { const w = Z.w3(x, 0, z); return [w[0], w[2], r]; }), floorY: 0 });
      const roomLight = makeLighter({ up: [1.5, 1.2, 0.7], down: [1.1, 0.85, 0.48] });
      const b = makeBatch(1 << 16);
      b.tr(Z.M).light(light);
      const shell = corridorShell(b, Z, roomLight, light);
      while (!shell.next().done) await ctx.yield();
      const mesh = new THREE.Mesh(b.build(), AIR.cor.mat); mesh.frustumCulled = false; scene.add(mesh);
      await ctx.yield();
      const ppl = makePeople(personGeo, AIR.cor.fig, who); scene.add(ppl.object);
      await ctx.yield();
      for (const d of Z.doors) {
        const hinge = Z.toW(d.s * (CHW + 0.05), 0, d.z + CDW / 2 - 0.05), w = Z.toW(d.s * CHW, 0, d.z), al = dirOf(Z.psi), nr = rightOf(Z.psi).multiplyScalar(d.s);
        light(w.x, 3, w.z, ...Z.d3(-d.s, 0, 0), out3);
        doorList.push({ p: hinge, al, nr, light: [out3[0], out3[1], out3[2]], ajar: rc.range(0.75, 1.25) });
      }
      Z.light = light;
      claim('corridor');
      zones.push({ name: 'corridor', objs: [mesh, ppl.object], m0: cor.m0, m1: cor.m1 });
      await ctx.yield();
    }
    // ------------------------------------------------------------ the painter's room, and the porch into the nave
    {
      const Z = pnt, who = [], es = Math.sign(Z.easel[0]), top = pTop(Z.easel[0] - es * 0.6);
      // the door behind the bed, and the porch beyond it: sill and head keep CLEAR (and a frame's depth) from the line
      const dP = dirOf(Z.psi), rN = rightOf(nav.psi), dN = dirOf(nav.psi), cx = dP.dot(rN), jam = [];
      for (const sx of [-1, 1]) {
        const P = Z.toW(sx * PDW / 2, 0, -PL), x0 = P.clone().sub(nav.O).dot(rN), t = (e * AW - x0) / cx, Q = P.clone().addScaledVector(dP, t);
        jam.push({ P, Q, t, z: -Q.clone().sub(nav.O).dot(dN) });
      }
      let yLo = 1e9, yHi = -1e9;
      for (let t = -3, t1 = Math.max(jam[0].t, jam[1].t) + 1; t <= t1; t += 1) { const w = Z.toW(0, 0, -PL).addScaledVector(dP, t), y = path.nearestXZ(w.x, w.z).y; yLo = Math.min(yLo, y); yHi = Math.max(yHi, y); }
      Z.y0 = Math.min(1.5, yLo - CLEAR - 0.3); Z.y1 = yHi + CLEAR + 0.4;
      const hole = { y0: Z.y0, y1: Z.y1 };
      const cW = Z.w3(Z.easel[0] - es * 0.6, top - 0.1, Z.easel[1]), aW = Z.d3(0, 0, 1), bW = Z.d3(1, 0, 0), lampW = Z.w3(-es * 6.1, 5.3, -15);
      const beams = hour === 'night' ? [] : [{ c: cW, d: [0, -1, 0], a: aW, ha: 1.6, b: bW, hb: 1.3, col: mul(DAY, 1.2), soft: 1.1 }];
      // lit by the skylight over the easel and one lamp; the corners keep their dusk
      const light = makeLighter({ up: mul(DUSK_UP, HR.amb * 1.1), down: mul(DUSK_DOWN, HR.amb * 1.1), beams, cut: 3, wrap: 0.5, lamps: [[lampW[0], lampW[1], lampW[2], LAMP[0] * 1.1, LAMP[1] * 1.1, LAMP[2] * 1.1, 3.2]], occ: [[...((w) => [w[0], w[2]])(Z.w3(0, 0, -PL + 1.9)), 3.6]] });
      if (beams.length) beamsAll.push({ a: cW, d: [0, -1, 0], w: bW, len: top - 0.2, w0: 1.3, w1: 1.4 }, { a: cW, d: [0, -1, 0], w: aW, len: top - 0.2, w0: 1.6, w1: 1.7 });
      person(Z, light, who, rpp, { x: Z.easel[0] + es * 1.7, z: Z.easel[1] + 0.4, yaw: -es * Math.PI / 2, kind: 1, hat: 0, col: [0.34, 0.3, 0.25], bow: 0.12, still: 1, lane: 2.6 });
      const b = makeBatch(1 << 13);
      b.tr(Z.M).light(light);
      const shell = painterShell(b, Z);
      while (!shell.next().done) await ctx.yield();
      const sx0 = Z.easel[0] - es * 0.6;
      b.col(mul(HR.pane, 0.9)).surf(K.GLASS, 1.0, 2, 2).quad([sx0 - 1.3, pTop(sx0 - 1.3) - 0.1, Z.easel[1] + 1.6], [sx0 + 1.3, pTop(sx0 + 1.3) - 0.1, Z.easel[1] + 1.6], [sx0 + 1.3, pTop(sx0 + 1.3) - 0.1, Z.easel[1] - 1.6], [sx0 - 1.3, pTop(sx0 - 1.3) - 0.1, Z.easel[1] - 1.6], [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]);
      b.col(WARM).surf(K.GLOW, 3, 2).lathe([[0, 5.0], [0.16, 5.15], [0.12, 5.45], [0, 5.7]], 6, -es * 6.2, -15);
      b.col(WOODS.dark, 1.4).surf(K.WOOD, 0).box(-es * 6.3, 2.4, -15, 1.1, 4.8, 1.6);
      // the porch: from the door behind the bed, straight on to the hole in the nave's aisle wall
      hole.z0 = Math.max(jam[0].z, jam[1].z); hole.z1 = Math.min(jam[0].z, jam[1].z); nav.hole = hole;
      b.tr(null).col([0.33, 0.33, 0.34]).surf(K.STONE, 1.2).tex(0, 1, 2);
      const mid = jam[0].P.clone().add(jam[1].P).multiplyScalar(0.5);
      for (const j of jam) quadW(b, [j.P.x, Z.y0, j.P.z], [j.Q.x, Z.y0, j.Q.z], [j.Q.x, Z.y1, j.Q.z], [j.P.x, Z.y1, j.P.z], [mid.x - j.P.x, 0, mid.z - j.P.z]);
      for (const [y, want] of [[Z.y0, UP], [Z.y1, DOWN]]) quadW(b, [jam[0].P.x, y, jam[0].P.z], [jam[0].Q.x, y, jam[0].Q.z], [jam[1].Q.x, y, jam[1].Q.z], [jam[1].P.x, y, jam[1].P.z], want);
      const mesh = new THREE.Mesh(b.build(), AIR.cor.mat); mesh.frustumCulled = false; scene.add(mesh);
      const ppl = makePeople(personGeo, AIR.cor.fig, who); scene.add(ppl.object);
      // The door behind the bed STANDS OPEN, for every visitor and from the first frame: two leaves hung on the porch's
      // side of the wall, swung back into the porch against its walls. The way goes through it.
      for (const sx of [-1, 1]) {
        const hinge = Z.toW(sx * PDW / 2, Z.y0, -PL - 0.12), k = (PDW / 2) / (CDW - 0.1), al = rightOf(Z.psi).multiplyScalar(-sx * k), nr = dirOf(Z.psi).multiplyScalar(k);
        light(hinge.x, 4, hinge.z, ...Z.d3(0, 0, 1), out3);
        doorList.push({ p: hinge, al, nr, light: [out3[0] * 1.6 + 0.02, out3[1] * 1.6 + 0.02, out3[2] * 1.6 + 0.02], ajar: 9 });
      }
      claim('painter');
      zones.push({ name: 'painter', objs: [mesh, ppl.object], m0: pnt.m0, m1: pnt.m1 + 8 });
      await ctx.yield();
    }

    // ------------------------------------------------------------ the gates of the law (src/parts), at the nave's end wall
    const hero = await buildHero(ctx, { matrix: gat.M, uniforms: U, material: AIR.court.mat, figureMaterial: AIR.court.fig, personGeometry: personGeo, rng: rg, side, beyond, detail, night: hour === 'night', pane: mul(HR.pane, 0.3), moteOk });
    scene.add(hero.object);
    // (the hero's own measures, kept with the scene for the builder's counts in node: nothing reads them in flight)
    scene.userData.anchors = hero.anchors;
    // (what stands on the floors of the halls and the court: the people dealt after this ask it, at person())
    for (const e of hero.anchors.solids) solids.push({ ...e, inv: new THREE.Matrix4().copy(e.F).invert() });
    await ctx.yield();
    // THE PEOPLE OF THE HALLS AND OF THE LAST COURT, each on a stream of their own. They are many and small, and it is
    // by them that the gates and the door are seen to be vast. MOST stand or sit by a lamp of the place (FARLAMP
    // below says how many do not: those stand in the place's own dim light, which is never black, or in the great
    // door's): on the benches by the bracket lamps; in knots by the hung and the standing lamps (and, in the last
    // court, at some places beside the way that the rings of lamps leave empty: a lamp on a standard stands in the
    // middle of each of those knots); on the steps before the second and third gates (in knots, most by the lamp on
    // the newel of each cheek); on the great door's steps (three lamps on each cheek; down the middle of the flight
    // falls the door's own light); on the stands against the gallery's shelves (the lamps along those shelves).
    // The rule of the people holds for each (FARMAN, 10.5 m in space from the whole line), every draw being made
    // before it is asked; each asks what stands at his place (solids) and for 0.8 m of his own among those already
    // dealt.
    // FARLAMP (the builder's own count in node, seeds 1 to 40, round 6; the measure runs in space, chest to lamp,
    // over every lamp of the halls and the court, hung, bracketed, on a standard or over a lectern): of 19,555
    // people of the halls and the court 1,740 stand farther than 12 m from every lamp, one in eleven.
    // (a knot of n men round a place: they stand in a ring and face its middle; a few read, one has his hands behind him.
    // All five take their draws, the first n are dealt: a knot left out, or a smaller one, moves no other)
    const knot = (Z, light, list, r, x, y, z, n) => {
      const a0 = r.range(0, TAU), rad = r.range(1.9, 2.6);
      for (let i = 0; i < 5; i++) {
        const a = a0 + i * TAU / Math.max(n, 3) + r.range(-0.3, 0.3), rr = rad * r.range(0.85, 1.2), role = r(), dy = r.range(-0.35, 0.35);
        person(Z, light, list, r, { here: i < n, lane: FARMAN, x: x + rr * Math.sin(a), y, z: z + rr * Math.cos(a), yaw: a + Math.PI + dy, still: 1, alt: [1.5, 3, 4.5, 6].map((d) => [x + (rr + d) * Math.sin(a), z + (rr + d) * Math.cos(a)]), ...(role < 0.25 ? { kind: 10, bow: 0.16 } : role < 0.45 ? { kind: 12, bow: 0 } : { bow: 0.3, hat: 2 }) });
      }
    };
    // (a knot of the last court: four to eight as its caller draws, an inner ring of five at most and the rest
    // behind it; they stand where they stand, turned to one another, and keep FARMAN from the line: the far man is
    // drawn for them. All nine take their draws, the first n are dealt)
    const knotC = (Z, light, list, r, x, z, n) => {
      const a0 = r.range(0, TAU), rad = r.range(1.9, 2.5), inner = Math.min(n, 5);
      for (let i = 0; i < 9; i++) {
        const out = i >= inner, a = a0 + (out ? (i - inner + 0.5) * TAU / Math.max(n - inner, 3) : i * TAU / Math.max(inner, 3)) + r.range(-0.3, 0.3), rr = (out ? rad + 2.1 : rad) * r.range(0.85, 1.15), role = r(), dy = r.range(-0.35, 0.35);
        person(Z, light, list, r, { here: i < n, lane: FARMAN, x: x + rr * Math.sin(a), y: 0, z: z + rr * Math.cos(a), yaw: a + Math.PI + dy, still: 1, alt: [1.5, 3, 4.5, 6].map((d) => [x + (rr + d) * Math.sin(a), z + (rr + d) * Math.cos(a)]), ...(role < 0.25 ? { kind: 10, bow: 0.16 } : role < 0.45 ? { kind: 12, bow: 0 } : { bow: 0.3, hat: 2 }) });
      }
    };
    const hallWho = [];
    {
      const A = hero.anchors, rh = own('people-halls'), dens = Math.min(1.1, density);
      for (const q of A.benches) { benchRow(gat, A.lights[q.hall], hallWho, rh, q.x - q.s * 0.05, q.z, Math.floor(q.len / 1.8), 1.8, -q.s * Math.PI / 2, 0.7 * dens, { y: q.y, lane: FARMAN, all: 1 }); }
      await ctx.yield();
      for (const q of A.lamps) {
        // (a lamp that hangs high on a pier or a wall (q.up) takes no draw of this stream: no knot stands under one)
        if (q.up) continue;
        const n = rh.int(2, 4), here = rh.chance(0.62 * dens), dx = rh.range(-2, 2), dz = rh.range(-2, 2);
        // (a knot is asked for only where the floor under its place is the hall's own floor: not on the flight to the
        // next gate or on its cheeks; 4 m: the knot's own breadth)
        const st = q.hall >= 1 ? G.steps[q.hall] : null, gz = q.hall >= 1 ? G.gate[q.hall].z : 0;
        const own = !st || q.z + dz > gz + st.land + st.n * st.dz + 4 || Math.abs(q.x + dx) > st.W / 2 + st.pw + 4;
        // (under such a lamp the knot stands on the hall's floor at the foot of the flight, 5 m before its first tread)
        // (by a lamp on a bracket that has no bench by it, the knot stands 3.4 m before the lamp, clear of pier and column)
        const wl = q.wall && !q.k && !A.benches.some((e) => e.hall === q.hall && Math.sign(e.x) === Math.sign(q.x) && Math.abs(e.z - q.z) < 9);
        knot(gat, A.lights[q.hall], hallWho, rh, q.x + (wl ? -Math.sign(q.x) * 3.4 + dx * 0.4 : dx), G.hall[Math.max(0, q.hall - 1)].y, own ? q.z + dz : gz + st.land + st.n * st.dz + 5, (q.top || wl) && q.hall >= 1 && here ? n : 0);
      }
      await ctx.yield();
      // ON THE STEPS BEFORE GATES 2 AND 3, to either side of the way up, they stand and sit IN KNOTS of two to four on
      // neighbouring treads, most of them near a cheek, where the lamp on its newel lights them, a few further in: one
      // sits on the front edge of his tread, facing down the flight, his soles over the tread below (seat 3); one
      // stands by him, turned to him; one stands a tread higher and reads or looks up to the gate; one a tread higher
      // on the other side. Unlike poses, no two knots alike; every draw is made before the place is asked.
      for (let k = 1; k < 3; k++) {
        const st = G.steps[k], g = G.gate[k], y0 = G.hall[k - 1].y;
        for (let i = 0; i < 3 * k + 1; i++) {
          const s = i % 2 ? 1 : -1, n = rh.int(2, 4), step0 = rh.int(0, st.n - 3), side = rh.chance(0.7), xa = rh.range(st.W / 2 - 8, st.W / 2 - 3.2), xb = rh.range(8, st.W / 2 - 9), here = rh.chance(0.75 * dens), x0 = s * (side ? xa : xb);
          for (let j = 0; j < 4; j++) {
            const role = rh(), dy = rh.range(-0.35, 0.35), dx = rh.range(-0.3, 0.3), sit = rh.chance(j === 0 ? 0.7 : 0.3), sits = sit && j !== 1 && j !== 2;
            const step = step0 + (j >= 2 ? 1 : 0), x = x0 + [0, 2.3, 1.15, -1.75][j] + dx;
            person(gat, A.lights[k], hallWho, rh, { here: here && j < n, lane: FARMAN, x, y: y0 + (step + 1) * st.rise, z: g.z + st.land + (st.n - step - (sits ? 0 : 0.5)) * st.dz - (sits ? 0.45 : 0), still: 1,
              ...(sits ? { yaw: dy, seat: 3, kind: role < 0.3 ? 9 : role < 0.6 ? 10 : 0, bow: 0.25 } : j === 1 ? { yaw: -Math.PI / 2 + dy, kind: role < 0.4 ? 12 : 0, bow: 0.2 } : j === 3 ? { yaw: Math.PI / 2 + dy, bow: 0.3, hat: 2 } : { yaw: Math.PI + dy, kind: role < 0.5 ? 10 : role < 0.75 ? 12 : 0, bow: 0.14 }) });
          }
        }
      }
    }
    await ctx.yield();
    // The last court. (A bench's own frame: z along it, x towards the wall.) Those who wait on the benches before its
    // arcades and under some lamps of the rings; a clerk at most of its lecterns, and before each clerk those whose
    // turn it is, in a loose knot; knots of five to eight by the lamps of the rings, of four to eight at the places
    // beside the way; many on the steps of the great door; a man at most of the stands on the gallery.
    const courtWho = [];
    {
      const C = hero.anchors.court, m = C.m, O = gat.toW(0, m.y0, m.zc), rpC = own('people-court'), dens = Math.min(1.1, density);
      const Zf = (j) => plan.frame(gat.psi + m.phi(j) + Math.PI / 2, O);
      for (const q of m.benches) { benchRow(Zf(q.j), C.light, courtWho, rpC, -q.z - 0.1, q.x, Math.max(2, Math.floor(q.len / 2.05)), 2.05, -Math.PI / 2, 0.62 * dens, { lane: FARMAN, all: 1 }); await ctx.yield(); }
      for (const q of m.lecterns) {
        const here = rpC.chance(0.85), dy = rpC.range(-0.15, 0.15), n = rpC.int(1, 3), Zq = Zf(q.j);
        person(Zq, C.light, courtWho, rpC, { here, lane: FARMAN, x: -q.z + 1.6, y: 0.6, z: q.x, yaw: -Math.PI / 2 + dy, still: 1, kind: 1, hat: 0, bow: 0.14 });
        // (those whose turn it is stand before him as a loose knot, not a file: one at the desk, the others a step
        // behind him to either side, each turned his own way towards it)
        for (let i = 0; i < 3; i++) {
          const role = rpC(), dz = rpC.range(-0.4, 0.4), dw = rpC.range(-0.25, 0.25);
          person(Zq, C.light, courtWho, rpC, { here: here && i < n, lane: FARMAN, x: -q.z - [2.4, 4.0, 3.5][i] - 0.5 * dz, z: q.x + [0.2, 1.7, -1.6][i] + dz, yaw: Math.PI / 2 + [0, -0.5, 0.6][i] + dw, still: 1, ...(i === 0 && role < 0.5 ? { kind: 11, hat: 0 } : role < 0.35 ? { kind: 10, bow: 0.16 } : role < 0.6 ? { kind: 12, bow: 0 } : { bow: 0.4, hat: 2 }) });
        }
      }
      await ctx.yield();
      // (under the lamps of the rings, and where a ring has no lamp because the way passes there: fuller knots, nearer)
      for (const q of m.hung) {
        const n = rpC.int(5, 8), here = rpC.chance(Math.min(1, 0.9 * dens)), dx = rpC.range(-2.5, 2.5), dz = rpC.range(-2.5, 2.5);
        // (a knot is asked for only where the floor under the lamp is the court's own: not over the great door's flight)
        knotC(Zf(q.j), C.light, courtWho, rpC, -q.z + dx, q.x + dz, q.z > -m.AP + 4 && here && !m.inDoor(q, 4) ? n : 0);
      }
      // (where a ring has no lamp because the way passes under its place, a knot stands to either side of the way)
      for (const q of m.gaps) for (const sd of [-1, 1]) {
        const n = rpC.int(5, 8), here = rpC.chance(Math.min(1, 0.9 * dens)), dx = rpC.range(-2.5, 2.5), dz = rpC.range(-1.5, 1.5);
        knotC(Zf(q.j), C.light, courtWho, rpC, -q.z + dx, q.x + sd * 15 + dz, here && !m.inDoor({ j: q.j, x: q.x + sd * 15, z: q.z }) ? n : 0);
      }
      // (and at the places beside the way that the rings leave empty)
      for (const q of m.knots) {
        const n = rpC.int(4, 8), here = rpC.chance(Math.min(1, 0.92 * dens));
        knotC(Zf(q.j), C.light, courtWho, rpC, -q.z, q.x, here && !m.inDoor(q, 4) ? n : 0);
      }
      await ctx.yield();
      // many on the steps of the great door, to either side of the way up (the portal's own width and 2.5 m are kept
      // free): some look up to the door, some back down the court, some sit on the steps (every draw before the test)
      const Dr = G.court.door;
      for (let i = 0; i < 40; i++) {
        const s = i % 2 ? 1 : -1, step = rpC.int(0, Dr.n - 1), x = s * rpC.range(G.portal.w / 2 + 2.5, Dr.W / 2 - 1.5), role = rpC(), up = rpC.chance(0.6), sits = rpC.chance(0.3), here = rpC.chance(0.75 * dens), dy = rpC.range(-0.3, 0.3);
        person(Zf(3), C.light, courtWho, rpC, { here, lane: FARMAN, x: -(m.zFoot - (step + (sits ? 0 : 0.5)) * Dr.tread - (sits ? 0.45 : 0)), y: (step + 1) * Dr.rise, z: x, still: 1,
          ...(sits ? { yaw: -Math.PI / 2 + dy, seat: 3, kind: role < 0.3 ? 9 : role < 0.6 ? 10 : 0, bow: 0.25 } : { yaw: (up ? 1 : -1) * Math.PI / 2 + dy, kind: role < 0.3 ? 12 : role < 0.6 ? 10 : 0, bow: 0.12 }) });
      }
      // (on the gallery: at most of the clerks' stands against its shelves a man at the files, his back to the court;
      // a stream of their own, every draw first)
      const rgal = own('people-gallery');
      for (const q of m.stands) {
        const here = rgal.chance(0.8), dy = rgal.range(-0.25, 0.25), role = rgal();
        person(Zf(q.j), C.light, courtWho, rgal, { here, lane: FARMAN, x: -q.z + 0.1, y: q.y - m.y0, z: q.x, yaw: Math.PI / 2 + dy, still: 1, hat: 0, ...(role < 0.5 ? { kind: 12, bow: 0 } : { kind: 10, bow: 0.16 }) });
      }
    }
    // COATS OF SEVERAL TONES in the halls and the court: most keep the dark cloth they were dealt, some wear a lighter
    // grey or brown, a few a pale dust coat (told by each one's own number, the same on every visit; no draw is made)
    for (const f of [...hallWho, ...courtWho]) {
      const t = (f.phase * 7.13) % 1, c = f.col;
      f.col = t < 0.48 ? [c[0] * 1.12, c[1] * 1.12, c[2] * 1.12] : t < 0.76 ? [c[0] * 1.6, c[1] * 1.55, c[2] * 1.5] : t < 0.9 ? [0.3 + c[0] * 0.5, 0.26 + c[1] * 0.45, 0.2 + c[2] * 0.35] : [0.4 + c[2] * 0.4, 0.4 + c[2] * 0.4, 0.39 + c[2] * 0.4];
    }
    // (the vault's eye: the day that falls through the lantern stands in the court's air as one pale shaft, slanting
    // down to the floor on the side of the court the way does not cross; a standing thing, kept off the line by the
    // shafts' own clearance. By night there is none.)
    if (hour !== 'night') {
      const C = hero.anchors.court, m = C.m, a = C.ptF(0, 0, m.Y3 + 2.4 + m.VH - 2, 0);
      const off = (p) => path.nearestXZ(p[0], p[2]).dist, feet = [4, 5, 6, 7].map((j) => C.ptF(j, 0, m.y0, -52)), ft = feet.sort((p, q) => off(q) - off(p))[0];
      const d = new THREE.Vector3(ft[0] - a[0], ft[1] - a[1], ft[2] - a[2]), len = d.length(); d.normalize();
      const w = new THREE.Vector3(-d.z, 0, d.x).normalize();
      naveBeams.push({ a, d: [d.x, d.y, d.z], w: [w.x, w.y, w.z], len, w0: 5, w1: 11, col: mul([0.62, 0.7, 0.86], 0.42), cross: 1, zone: 'gates' });
    }
    // (none of them stands nearer than FARMAN, 10.5 m, to the line: the man of half the triangles is drawn for them)
    // WHICH OF THEM CAN BE SEEN FROM BEFORE THE CATHEDRAL'S DOOR? The gates, the halls and the last court are drawn
    // from 35 m inside the corridor on (the cathedral itself earlier, with the corridor), and from anywhere before
    // the cathedral's door its end wall hides the halls but for what shows through the first gate's opening.
    // A figure whose feet or crown can be joined to any place of the line from there to CROWDIN inside the cathedral's
    // door (every 4 m of it) by a straight line through that opening and every gate's between (and, from a place before the painter's back door, through
    // that door's opening too: there is no other way to see into the cathedral) is drawn with the cathedral; every
    // other one stands behind the wall until we are that far inside the cathedral, and is drawn from there on (by
    // then the corridor and the painter's room are no longer drawn).
    // The same question is asked again for each stretch of the line that follows (through every gate between, both
    // faces of its wall), and each figure is drawn from the first metre of the first stretch it can be seen from:
    //   class 0  seen from before CROWDIN inside the cathedral's door: drawn with the gates;
    //   class 1  from there to 35 m inside the first hall: drawn from CROWDIN inside the cathedral's door;
    //   class 2  from there to 35 m inside the second hall: drawn from 31 m past the first gate (the cathedral is
    //            no longer drawn from there);
    //   class 3  from there to 35 m inside the last court: drawn from 31 m past the second gate;
    //   class 4  the rest (they stand to the sides of the last court, behind the third gate's wall): from 31 m past
    //            the third gate.
    // And each is drawn only as long as the piece of stone he stands in (the first hall's people until 30 m past the
    // second gate, the second hall's until 30 m past the third): crowdSets holds a list for each class and piece.
    const personFar = personGeometry(1), crowdAll = [...hallWho, ...courtWho];
    const mLate = mGate[0] + 31, mClass = [cor.m0 + 35, nav.m0 + CROWDIN, mLate, mGate[1] + 31, mGate[2] + 31], crowdSets = new Map();
    {
      const inv = new THREE.Matrix4().copy(gat.M).invert(), invP = new THREE.Matrix4().copy(pnt.M).invert(), eyesA = [], eyesB = [], e = new THREE.Vector3(), q = new THREE.Vector3(), w = new THREE.Vector3();
      // (every place of the line is asked from the last loft's first metre on: more than is needed. An eye
      // is kept in the gates' frame and in the painter's room's own, whose back door is at its z = -PL)
      const eyesC = [], eyesD = [];
      for (let m = mOf(lofts[lofts.length - 1].toW(0, 0, 0)) - 4; m <= mClass[4] + 4; m += 4) {
        path.posAtDist(m, w); e.copy(w).applyMatrix4(inv); w.applyMatrix4(invP);
        if (m <= mClass[1] + 4) { if (e.z > 1) eyesA.push(e.x, e.y, e.z, w.x, w.y, w.z); } else (m <= mClass[2] + 4 ? eyesB : m <= mClass[3] + 4 ? eyesC : eyesD).push(e.x, e.y, e.z, w.x, w.y, w.z);
      }
      // (through a gate's wall only by its opening, a metre given all round, at both of its faces)
      const through = (ex, ey, ez, qx, qy, qz) => {
        for (const g of G.gate) {
          if (!(ez > g.z && qz < g.z - g.t)) continue;
          for (const zf of [g.z, g.z - g.t]) {
            const t = (ez - zf) / (ez - qz), x = ex + (qx - ex) * t, y = ey + (qy - ey) * t;
            if (Math.abs(x) > g.w / 2 + 1 || y < g.y - 1 || y > g.y + g.h + 1) return false;
          }
        }
        return true;
      };
      const seenBy = (eyes, f, first) => {
        for (let i = 0; i < eyes.length; i += 6) for (const dy of [0, f.h]) {
          if (first && q.z >= 0) continue;
          if (!through(eyes[i], eyes[i + 1], eyes[i + 2], q.x, q.y + dy, q.z)) continue;
          // (the painter's back door: 7.2 m wide in a room 8.8 m high; half a metre is given all round)
          if (first && eyes[i + 5] > -PL + 0.5 && w.z < -PL) {
            const tp = (eyes[i + 5] + PL) / (eyes[i + 5] - w.z), xp = eyes[i + 3] + (w.x - eyes[i + 3]) * tp, yp = eyes[i + 4] + (w.y + dy - eyes[i + 4]) * tp;
            if (Math.abs(xp) > PDW / 2 + 0.5 || yp < -0.5 || yp > 9.3) continue;
          }
          return true;
        }
        return false;
      };
      let done = 0;
      for (const f of crowdAll) {
        // (the page breathes every sixty figures: this is the build's longest piece of counting)
        if (++done % 60 === 0) await ctx.yield();
        q.set(f.x, f.y, f.z).applyMatrix4(inv); w.set(f.x, f.y, f.z).applyMatrix4(invP);
        const cls = seenBy(eyesA, f, true) ? 0 : seenBy(eyesB, f, false) ? 1 : seenBy(eyesC, f, false) ? 2 : seenBy(eyesD, f, false) ? 3 : 4;
        const piece = q.z > hero.anchors.cut[0] ? 0 : q.z > hero.anchors.cut[1] ? 1 : 2, key = cls * 3 + piece;
        if (!crowdSets.has(key)) crowdSets.set(key, []);
        crowdSets.get(key).push(f);
      }
    }
    // (a mesh of people for each class and piece that has any)
    const crowdParts = [...crowdSets.entries()].sort((a, b) => a[0] - b[0]).map(([key, list]) => ({ cls: Math.floor(key / 3), piece: key % 3, ppl: makePeople(personFar, AIR.court.fig, list) }));
    for (const c of crowdParts) scene.add(c.ppl.object);
    await ctx.yield();

    // ------------------------------------------------------------ the cathedral
    {
      const Z = nav, who = [], [cx, cz] = Z.candle, rm = rmN;
      Z.pierZ = [];
      for (let z = zJ - 9; z > -LN + 8; z -= 18) Z.pierZ.push(z);
      Z.altar = [-e * (NW - 1.6), cz];
      Z.statue = [-e * (NW - 3.3), Z.pierZ[2]];
      // the pulpit keeps CLEAR from the line with all that belongs to it (its bowl, the lamp hung 2.5 m out before it,
      // its steps 8 m up the nave): tested here against the line, and moved on a pier at a time if the line came nearer
      for (let i = 0; i < 3; i++) {
        const [px, pz] = Z.pulpit, near = Math.min(gapTo(Z.w3(px - e * 2.5, 9, pz)), gapTo(Z.w3(px - e * 2.2, 5, pz)), gapTo(Z.w3(px - e * 0.6, 3, pz + 8)));
        if (near >= CLEAR + 0.5) break;
        Z.pulpit = [px, pz - 18];
      }
      // the pews: two long blocks down the nave to within sight of the gate, and more rows in the crossing wherever the
      // line leaves room (every row is tried against the whole line: its top keeps CLEAR and more, at every place of it)
      Z.pews = [];
      const pewOk = (x, z, len) => [-0.5, -0.25, 0, 0.25, 0.5].every((f) => gapTo(Z.w3(x + f * len, 3.9, z)) >= CLEAR + 1.2)
        && Math.hypot(x - cx, z - cz) > 8.5 && Math.hypot(x - Z.pulpit[0], z - Z.pulpit[1]) > 8.5 && Math.hypot(x - Z.statue[0], z - Z.statue[1]) > 6.5;
      for (let z = zJ - 5; z > -LN + 24; z -= 3.4) for (const sx of [-1, 1]) if (pewOk(sx * 10.1, z, 7.4)) Z.pews.push([sx * 10.1, z, 7.4]);
      for (let z = zJ + 4; z < -9; z += 3.4) for (const x of [-21.5, -10.1, 10.1, 21.5]) if (pewOk(x, z, 7.4)) Z.pews.push([x, z, 7.4]);
      const ends = [zJ, ...Z.pierZ, -LN], day = hour !== 'night', grey = hour === 'golden' ? [0.8, 0.6, 0.38] : [0.5, 0.56, 0.7];
      const lamps = [[...Z.w3(cx, 14.2, cz), SLIT[0] * 1.9, SLIT[1] * 1.9, SLIT[2] * 1.9, 8], [...Z.w3(Z.pulpit[0] - e * 2.5, 9.2, Z.pulpit[1]), 1.2, 0.95, 0.58, 7],
        [...Z.w3(e * (AW - 2), 4.4, (Z.hole.z0 + Z.hole.z1) / 2), WARM[0] * 0.9, WARM[1] * 0.9, WARM[2] * 0.9, 7], ...hero.anchors.frontLamps];
      const beams = [], aW = Z.d3(0, 0, 1);
      // (the nave is wide: its dust keeps 6 m off the line by its place, so that no mote is a pale disc before the lens)
      const dustN = (m) => { if (moteOk(m, 6)) motesAll.push(m); };
      // A window's shaft falls in a colour of its glass onto the paving, the pews and the piers. It is drawn as a body of
      // light (crossed sheets without an edge) that ends where it falls, dust turning in it. (There is ONE.
      // What read as a flat green panel was the sheets of one window's shaft, which lie across the nave, seen face on.)
      const TINT = [[1.5, 0.42, 0.34], [0.42, 0.62, 1.6], [1.45, 1.05, 0.42], [0.46, 1.25, 0.62], [1.1, 0.48, 1.3]].map((c) => (hour === 'golden' ? [c[0] * 0.7 + 0.5, c[1] * 0.7 + 0.32, c[2] * 0.7 + 0.14] : c));
      const DIRN = new THREE.Vector3(e * 0.5, -1, 0.06).normalize(), dW = Z.d3(DIRN.x, DIRN.y, DIRN.z);
      const bW = new THREE.Vector3().crossVectors(new THREE.Vector3(...dW), new THREE.Vector3(...aW)).normalize(), bw = [bW.x, bW.y, bW.z];
      const shaft = (x, y, z, ha, hb, k, tint, sheets) => {
        const c = Z.w3(x, y, z), len = (y - 0.3) / -DIRN.y;
        beams.push({ c, d: dW, a: aW, ha, b: bw, hb, col: mul(tint, k), soft: 3.4 });
        // (its body: two pairs of crossed sheets with no edge to them, so that from no side is it a pane; a mesh of its own)
        for (const o of sheets) naveBeams.push({ a: [c[0] + aW[0] * ha * o, c[1], c[2] + aW[2] * ha * o], d: dW, w: bw, len, w0: hb, w1: hb * 1.25, col: mul(tint, 0.5 * k), cross: 1 });
        for (let j = 0, n = Math.round(8 * sheets.length * detail * density); j < n; j++) {
          const t = rm.range(4, len - 1), u = rm.range(-ha, ha), v = rm.range(-hb, hb), sp = rm.range(0.1, 0.3), an = rm.range(0, TAU);
          dustN([c[0] + dW[0] * t + aW[0] * u + bW.x * v, c[1] + dW[1] * t + aW[1] * u + bW.y * v, c[2] + dW[2] * t + aW[2] * u + bW.z * v, rm(), Math.cos(an) * sp, -sp * 0.6, Math.sin(an) * sp, 5]);
        }
      };
      // The church is dark on a day of rain: the windows give hardly any light (a dull glimmer of wet glass, a breath of
      // grey inside each). ONE window alone, high in the second bay on the side the light comes from, throws a shaft of
      // its glass's colour down across the nave onto the paving and the pews: this world's own, the same at every hour
      // of the day (by night there is none). Its body passes over the line with CLEAR and more to spare.
      Z.shaftBay = 1; Z.dull = day ? 0.12 : 0.1; Z.bright = day ? 1.05 : Z.dull;
      if (day) {
        const k = hour === 'golden' ? 1.2 : 1.1, zm = (ends[Z.shaftBay] + ends[Z.shaftBay + 1]) / 2;
        shaft(-e * (NW - 0.4), 46, zm, 2.4, 3.2, k, TINT[[0, 1, 2][wellAt % 3]], [-0.5, 0.5]);
        for (let i = 0; i < ends.length - 1; i++) {
          const zi = (ends[i] + ends[i + 1]) / 2;
          for (const s of [-1, 1]) lamps.push([...Z.w3(s * (NW - 2.2), 44, zi), grey[0] * 0.27, grey[1] * 0.27, grey[2] * 0.27, 9], [...Z.w3(s * (AW - 2.2), 13.5, zi), grey[0] * 0.2, grey[1] * 0.2, grey[2] * 0.2, 7]);
        }
        for (let i = 0; i < 3; i++) for (const s of [-1, 1]) lamps.push([...Z.w3(s * (AW - 2.5), 30, zJ * (i + 0.5) / 3), grey[0] * 0.3, grey[1] * 0.3, grey[2] * 0.3, 13]);
      }
      // lamps hung on long chains down both sides of the middle aisle, a pair at every second pair of piers; racks of small
      // candles at the pew ends between them, on one side and the other by turns (none where the pews end, before the
      // gate): pools of warm light on the paving
      Z.hung = []; Z.racks = [];
      Z.pierZ.forEach((z, i) => {
        if (i % 2 === 0) for (const sx of [-1, 1]) Z.hung.push([sx * 5.6, 11.4, z]);
        else if (z > -LN + 24) for (const sx of [-1, 1]) Z.racks.push([sx * 4.9, z]);
        // (a small lamp on its chain in each aisle at every second pier, between the nave's own: enough to read the piers
        // and the aisle's vault by, no more)
        if (i % 2 === 1) for (const sx of [-1, 1]) Z.hung.push([sx * (NW + AW) / 2, 8.6, z, 7.5, 0.6, AISLE_H]);
      });
      // (and six under the crossing's one vault, higher and of a longer reach: its walls are never black, by day or by night;
      // each is hung only where it keeps CLEAR of the line with room to spare)
      for (const sx of [-1, 1]) for (const f of [0.2, 0.5, 0.8]) if (gapTo(Z.w3(sx * 12, 14.4, zJ * f)) >= CLEAR + 0.6) Z.hung.push([sx * 12, 15, zJ * f, 10, 0.62]);
      for (const [x, y, z, reach = 7, k = 1] of Z.hung) lamps.push([...Z.w3(x, y - 0.3, z), 1.15 * HR.lamp * k, 0.85 * HR.lamp * k, 0.48 * HR.lamp * k, reach]);
      for (const [x, z] of Z.racks) lamps.push([...Z.w3(x - Math.sign(x) * 0.6, 3.4, z), 1.25, 0.86, 0.43, 4.5]);
      // (the four candles of the side altar)
      lamps.push([...Z.w3(Z.altar[0] + e * 0.9, 8.6, Z.altar[1]), SLIT[0] * 0.95, SLIT[1] * 0.95, SLIT[2] * 0.95, 6]);
      beams.push(...hero.anchors.frontBeams);
      // dust that turns in the candle's light
      for (let j = 0, n = Math.round(70 * detail * density); j < n; j++) {
        const an = rm.range(0, TAU), r = rm.range(1.5, 9), w = Z.w3(cx + Math.cos(an) * r, rm.range(3, 17), cz + Math.sin(an) * r), sp = rm.range(0.1, 0.3);
        dustN([w[0], w[1], w[2], rm(), Math.cos(an) * sp * 0.4, sp, Math.sin(an) * sp * 0.4, 5]);
      }
      // DEEP AND DIM, LIT IN ISLANDS: grey from everywhere, enough that every wall, the side aisles and the vault are dim
      // stone and never black, a little more of it gathered under the vault (its ribs are seen), and every
      // lamp's light ends at three times its reach: a pool under each lamp, the candle, the pulpit's lamp and the racks
      const spec = { up: [0.152, 0.166, 0.208], down: [0.113, 0.122, 0.152], lamps, beams, floorY: 0, cut: 3, high: { y0: 30, y1: NAVE_H, col: day ? [0.045, 0.055, 0.078] : [0.02, 0.025, 0.036] } };
      // the panes take the hour like every other pane
      Z.pane = mul(HR.pane, 0.7);
      const pre = makeLighter(spec);
      // a man who shades his eyes and looks up into the vault; the sexton, pointing down the nave; the priest in his pulpit
      person(Z, pre, who, rpn, { x: e * 7.6, z: zJ - 33.42, yaw: Math.PI + e * 1.0, kind: 4, bow: 0, col: [0.1, 0.095, 0.1], still: 1, hat: 0 });
      person(Z, pre, who, rpn, { x: -e * 9, z: zJ + 13, yaw: Math.PI - e * 0.9, kind: 6, bow: 0.2, col: [0.13, 0.11, 0.1], still: 1, hat: 0 });
      person(Z, pre, who, rpn, { x: Z.pulpit[0], y: 3.7, z: Z.pulpit[1], yaw: -e * 0.95, kind: 13, bow: 0.16, col: [0.06, 0.06, 0.07], still: 1, hat: 0, h: 0.96 });
      // a few who sit in the pews: one asleep, one with his petition, the rest with their hats in their hands
      { const taken = new Set();
        for (let i = 0, n = Math.round(46 * density); i < n; i++) {
          const pick = rpn.int(0, Z.pews.length - 1), off = rpn.range(-0.36, 0.36), role = rpn(), [px, pz, len] = Z.pews[pick];
          // (a pew drawn a second time seats no one: the man's draws are made all the same)
          const here = !taken.has(pick);
          taken.add(pick);
          person(Z, pre, who, rpn, { here, x: px + off * len, z: pz + 0.1, yaw: Math.PI, seat: 2, still: 1, kind: role < 0.3 ? 9 : role < 0.6 ? 10 : 0, hat: role < 0.6 ? 0 : 2, bow: role < 0.6 ? 0.2 : 0.3 });
        } }
      const light = makeLighter({ ...spec, occ: [...who.filter((f) => f.y < 1).map((f) => [f.x, f.z, 1.2]), ...Z.pews.map(([x, z]) => { const w = Z.w3(x, 0, z); return [w[0], w[2], 2.2]; })] });
      Z.soft = makeLighter({ ...spec, wrap: 0.6, down: [0.075, 0.075, 0.08] });
      const b = makeBatch(1 << 18);
      b.tr(Z.M).light(light);
      const shell = naveShell(b, Z);
      while (!shell.next().done) await ctx.yield();
      const mesh = new THREE.Mesh(b.build(), AIR.nave.mat); mesh.frustumCulled = false; scene.add(mesh);
      const ppl = makePeople(personGeo, AIR.nave.fig, who); scene.add(ppl.object);
      // the small lights the worn flags and the pews mirror: the candle, the pulpit's lamp, the glow in each gate
      const gl = [[Z.w3(cx, 14, cz), [1.6, 1.2, 0.6], 26], [Z.w3(Z.pulpit[0] - e * 2.5, 9.2, Z.pulpit[1]), [1.3, 1.0, 0.6], 20]];
      for (let k = 0; k < 3; k++) { const g = G.gate[k]; gl.push([gat.w3(0, g.y + g.h * 0.4, g.z - g.t * 0.6), [1.5, 1.14, 0.54].map((v) => v * [0.8, 0.9, 1][k]), [30, 46, 70][k]]); }
      { const C = hero.anchors.court; gl.push([C.ptF(3, 0, C.m.yL + G.court.door.h * 0.4, -C.m.A - 6), [1.5, 1.14, 0.54], 95]); }
      gl.forEach(([p, c, reach], i) => { U.uGl.value[i].set(p[0], p[1], p[2], reach); U.uGlC.value[i].set(c[0], c[1], c[2]); });
      claim('nave');
      // (the cathedral's own shell and people; the gates of the law, the halls, the last court and those of their people
      // who can be seen through the first gate; then those whom the cathedral's end wall hides from every place before its door)
      zones.push({ name: 'nave', objs: [mesh, ppl.object], m0: nav.m0, m1: mGate[0] });
      // (the stone of the gates, the halls and the court: the whole of it, and its first two pieces, which are drawn only
      // as far as 30 m past the gate that ends them; then the crowd, a zone for each class and piece: `from` is set below)
      zones.push({ name: 'gates', objs: [hero.object], m0: nav.m0, m1: LEN });
      zones.push({ name: 'hall1', objs: [hero.anchors.pieces[0]], m0: nav.m0, m1: mGate[1], from: mClass[0] });
      zones.push({ name: 'hall2', objs: [hero.anchors.pieces[1]], m0: nav.m0, m1: mGate[2], from: mClass[0] });
      for (const c of crowdParts) zones.push({ name: 'crowd' + c.cls + (c.piece < 2 ? 'h' + (c.piece + 1) : 'c'), objs: [c.ppl.object], m0: nav.m0, m1: c.piece === 0 ? mGate[1] : c.piece === 1 ? mGate[2] : LEN, from: mClass[c.cls] });
      await ctx.yield();
    }

    // ------------------------------------------------------------ the roofs of the city, seen only from outside
    const cityObjs = [];
    {
      const far = sunW.clone().multiplyScalar(1e5), kd = hour === 'golden' ? [2.6, 1.7, 0.9] : hour === 'night' ? [0.1, 0.12, 0.18] : [0.5, 0.5, 0.54];
      // the day's grey from above, less of it the deeper into the yards and streets
      // (and the low warm light of the break in the cloud, raking the stacks, the gables and the slates that face it)
      const farB = BRK.dir.clone().multiplyScalar(1e5), kb = hour === 'golden' ? 0 : 0.42;
      const light = makeLighter({ up: mul([0.2, 0.2, 0.21], HR.out), down: mul([0.09, 0.09, 0.09], HR.out), lamps: [[far.x, far.y, far.z, kd[0], kd[1], kd[2], 1e5], [farB.x, farB.y, farB.z, BRK.col[0] * kb, BRK.col[1] * kb, BRK.col[2] * kb, 1e5], [...lofts[0].w3(0, 8.8, 3.3), 2.1 * HR.lamp, 1.45 * HR.lamp, 0.7 * HR.lamp, 17], [...lofts[0].w3(0, 4.6, 1.6), 1.2 * HR.lamp, 0.84 * HR.lamp, 0.42 * HR.lamp, 9]], high: { y0: STREET + 4, y1: 8, col: mul([0.3, 0.29, 0.28], HR.out) } });
      const b = makeBatch(1 << 17);
      b.light(light);
      const routeY = (z) => path.nearestXZ(0, z).y;
      // the ground the court stands on (the lofts, passages, corridor, painter's room, cathedral and halls): no house of
      // the city stands there. Places of the line every 6 m, each with the half-width of what it runs through.
      const ground = [], gp = new THREE.Vector3();
      for (let m = film.mWin; m < LEN; m += 6) { path.posAtDist(m, gp); ground.push([gp.x, gp.z, m < nav.m0 ? 16 : m < mGate[0] ? 35 : 150]); }
      // (and the chambers behind the great door, which run on past the end of the line)
      for (let d = 0; d <= 160; d += 40) { const q = hero.anchors.court.ptF(3, 0, 0, -hero.anchors.court.m.A - d); ground.push([q[0], q[2], 70]); }
      const onCourt = (x, z, hw, hd, axis) => ground.some(([gx, gz, r]) => Math.abs(axis ? gz - z : gx - x) < hw + r && Math.abs(axis ? gx - x : gz - z) < hd + r);
      const houses = [], stacks = [], ridges = [];
      // (r: the stream that deals the house; h.back: a house of the town behind the entry, which sends up no smoke and
      // carries no pigeon: the smoke and the pigeons of the town ahead are dealt as they were)
      const add = (h, free, r = rr) => {
        for (let i = 0, n = r.int(1, 3); i < n; i++) h.chim.push([r(), r.range(7, 12), r.int(2, 4)]);
        for (let i = 0, n = r.int(1, 4); i < n; i++) h.sky.push([r(), r.chance(0.5) ? 1 : -1, r()]);
        h.q = draws(r, 12);
        if (!free && onCourt(h.x, h.z, h.w / 2, h.d / 2, h.axis)) return;
        const at = (t, lx = 0, lz = 0) => (h.axis ? [h.x + 1.0 + lz, h.z - (t - 0.5) * h.w * 0.84 - lx] : [h.x + (t - 0.5) * h.w * 0.84 + lx, h.z + 1.0 + lz]);
        // no stack within 9 m of the line, nor of the line continued back behind the entry: measured to the stack's own
        // corners (its cap is 1.9 m a pot and 2.4 more wide, 4 m deep) and its middle, at the ridge, half way up and at
        // the pots
        h.chim = h.chim.filter(([t, ch, pots]) => {
          const hx = (1.9 * pots + 2.4) / 2;
          for (const [lx, lz] of [[0, 0], [-hx, -2], [hx, -2], [-hx, 2], [hx, 2]]) for (const y of [h.ridge, h.ridge + (ch + 3) / 2, h.ridge + ch + 3]) { const p = at(t, lx, lz); if (path.distanceTo(p[0], y, p[1]) < 9 || backGap(p[0], y, p[1]) < 9) return false; }
          return true;
        });
        if (!h.back) for (const [t, ch] of h.chim) { const p = at(t); stacks.push([p[0], h.ridge + ch + 3.2, p[1]]); }
        // (far: 140 m and more from the whole of the way over the roofs, x 0 from z 40 to the window and 14 m in; a
        // house of the town behind the entry: as far from the line continued back. Such a house is built without
        // gutters, pipes, chimney pots, sills and lintels, which are less than a dot there)
        h.far = (h.back ? backGap(h.x, ENT.y, h.z) : Math.hypot(h.x, Math.max(0, -120 - h.z, h.z - 40))) - Math.max(h.w, h.d) / 2 > 140;
        if (!h.back) ridges.push(h);
        houses.push(h);
      };
      // (r: the stream that deals the row; back: a row of the town behind the entry)
      const row = (zc, d, x0, x1, eave, rise, rows, r = rr, back = 0) => {
        let x = x0;
        // (where the line continued back crosses the row's own depth)
        const xb = ENT.x - ENT.hx * ((ENT.z - zc) / (ENT.hz || -1));
        while (x < x1) {
          const w = r.range(36, 62), xc = x + w / 2, ev = r.range(eave[0], eave[1]), under = back ? Math.abs(xc - xb) < w / 2 + 8 : Math.abs(xc) < w / 2 + 8 && zc > -ATTIC.ZG;
          // (a roof the line passes over keeps its ridge 4 m under the line; so does one under the line continued back)
          const rg0 = ev + r.range(rise[0], rise[1]), ridge = under ? Math.min(rg0, (back ? ENT.y : routeY(zc)) - 4) : rg0;
          add({ back, x: xc, z: zc, w: w - 0.4, d, eave: Math.min(ev, ridge - 7), ridge, axis: 0, tone: r.range(0.8, 1.15), warm: r.range(0.5, 1.3) * (hour === 'night' ? 1.3 : 1), brick: r.chance(0.55), face: 1, rows, chim: [], sky: [] }, zc > -ATTIC.ZG, r);
          x += w;
        }
      };
      // the row the flight begins over and the row before the yard: their roofs lie under the line
      row(-22, 30, -200, 200, [-6, -2], [9, 13], 2);
      await ctx.yield();
      row(-57, 30, -200, 200, [-10, -6], [9, 12], 2);
      await ctx.yield();
      // the two wings of the tenement we enter, either side of its yard; then rank behind rank to the skyline
      for (const s of [-1, 1]) add({ tuck: 1, x: s * 29.6, z: -106, w: 68, d: 30, eave: rr.range(2.5, 4), ridge: rr.range(13, 15.5), axis: 1, tone: rr.range(0.85, 1.1), warm: rr.range(0.7, 1.2), brick: true, face: -s, rows: 5, chim: [], sky: [] }, true);
      for (const [zc, rows] of [[-150, 2], [-196, 2]]) { row(zc, 30, -230, 230, [-4, 6], [10, 14], rows); await ctx.yield(); }
      for (let zc = -244; zc > -560; zc -= 46) { row(zc, 32, -260, 260, [-6, 10], [10, 15], 1); await ctx.yield(); }
      // THE TOWN BEHIND THE ENTRY. The eye that first sees this world flies the entry's straight continued back, level,
      // from far behind (ENT, BACKLEN, above): the town runs on under the whole of that line and past its far end,
      // rank behind rank of the same roofs, on a stream of their own (the town ahead is dealt as it was). A roof the
      // line passes over keeps its ridge 4 m under it; no stack stands within 9 m of it; the street lies under all.
      const rback = own('roofs-back');
      for (let zc = 24; zc < BACKLEN + 60; zc += 46) { row(zc, 30, -230, 230, [-6, -2], [9, 13], 2, rback, 1); await ctx.yield(); }
      for (let i = 0; i < houses.length; i++) { house(b, houses[i], M4, light); await ctx.yield(); }
      await ctx.yield();
      // the street far below, wet, its gas lamps
      b.col([0.12, 0.12, 0.125]).surf(K.SLATE, 0).tex(0, 2, 1).sheet([-260, STREET, 40], [520, 0, 0], [0, 0, -640], 80, UP);
      // (and on under the town behind the entry, past the far end of the line continued back)
      b.sheet([-260, STREET, BACKLEN + 100], [520, 0, 0], [0, 0, -(BACKLEN + 60)], 80, UP);
      for (const zc of [-39.5, -75]) for (let x = -130; x <= 130; x += 26) if (Math.abs(x) > 12) b.col([1, 0.86, 0.6]).surf(K.GLOW, 2.2, 1 + (x & 3)).box(x + 3, STREET + 9, zc, 0.9, 1.2, 0.9);
      await ctx.yield();
      // the tenement we enter: its brick gable, the open garret window deep in its stone frame, shutters, the hoist over
      // it, windows storey by storey below, a drainpipe at each corner
      const Z = lofts[0], BRICK = [0.33, 0.22, 0.17];
      b.tr(Z.M).col(BRICK).surf(K.STONE, 0.75, 0, 1);
      gable(b, HW + 0.9, 0.3, 1, { x0: -WINW / 2, x1: WINW / 2, y0: 0.9, y1: 8.1 }, KNEE - 0.4, RIDGE + 0.55);
      b.tex(0, 1, 2);
      for (const s of [-1, 0]) b.sheet([s * (HW + 0.9), STREET, 0.3], [HW + 0.9, 0, 0], [0, -STREET, 0], 12, PZ);
      // (THE HOUSE ABOUT THE WINDOW IS AS WIDE AS THE LOFT SEEN THROUGH IT, and is seen to be: a painted bargeboard
      // runs down each rake of its gable from the ridge to the eaves, the full breadth of the loft's roof, with a
      // return of the eaves' cornice at each foot and a band of stone across the whole front at the loft's floor)
      b.col([0.44, 0.42, 0.38]).surf(K.WOOD, 0.4);
      for (const s of [-1, 1]) {
        const E = [s * (HW + 1.5), KNEE - 0.75, 1.05], T = [0, RIDGE + 0.8, 1.05];
        quadW(b, E, T, [T[0], T[1] - 1.1, T[2]], [E[0], E[1] - 1.1, E[2]], [0, 0, 1]);
        quadW(b, [E[0], E[1] - 1.1, 1.05], [T[0], T[1] - 1.1, 1.05], [T[0], T[1] - 1.1, 0.3], [E[0], E[1] - 1.1, 0.3], [0, -1, 0]);
      }
      b.col([0.25, 0.24, 0.23]).surf(K.STONE, 0, 0, 0.8);
      for (const s of [-1, 1]) b.box(s * (HW - 0.6), KNEE - 1.45, 0.75, 3.6, 0.5, 0.9);
      b.box(0, -0.25, 0.5, HW * 2 + 1.8, 0.5, 0.4);
      b.col(BRICK).surf(K.STONE, 0.75, 0, 1);
      b.col([0.25, 0.24, 0.23]).surf(K.STONE, 0, 0, 0.8);
      for (const s of [-1, 1]) b.box(s * (WINW / 2 + 0.3), 4.5, 0.45, 0.6, 7.6, 1.3);
      b.box(0, 8.4, 0.45, WINW + 1.2, 0.6, 1.3);
      // (the sill: wet stone, dark under the rain, a drip moulding under its edge: a sill, not a pale slab)
      b.col([0.15, 0.148, 0.145]).surf(K.STONE, 0, 0.9, 0.8).box(0, 0.65, 0.6, WINW + 1.7, 0.5, 1.6).box(0, 0.3, 1.2, WINW + 1.2, 0.22, 0.5);
      // The window is a real opening: a boarded lining through the wall's depth (jambs, head, an inner sill board), and
      // its TWO CASEMENT LEAVES, each as wide as half the opening, hung on three iron hinges at its jamb and standing
      // open back towards the wall (swung 160 degrees, hooked back out of the rain's way), held there by an iron stay
      // out of the wall: painted stiles, rails and glazing bars, three lights across and five up, wet glass with the
      // grey sky in it. No shutter boards stand beside it. (Nothing of it stands nearer to the line than the jambs.)
      b.col(WOODS.dark, 1.5).surf(K.WOOD, 0.5);
      for (const s of [-1, 1]) b.box(s * (WINW / 2 - 0.09), 4.5, -0.45, 0.18, 7.2, 1.6);
      b.box(0, 8.02, -0.45, WINW, 0.16, 1.6).box(0, 0.82, -0.55, WINW, 0.16, 1.5);
      for (const s of [-1, 1]) {
        const a = 1.22, dx = s * Math.sin(a), dz = Math.cos(a), hx = s * (WINW / 2 + 0.02), hz = 1.22, yaw = Math.atan2(-dz, dx), Lf = WINW / 2;
        const at = (t, y, o = 0) => [hx + dx * t - dz * o * s, y, hz + dz * t + dx * o * s];
        b.col([0.6, 0.585, 0.54]).surf(K.WOOD, 0.4);
        for (const t of [0.1, Lf - 0.1]) { const p = at(t, 4.5); b.box(p[0], p[1], p[2], 0.2, 7.0, 0.14, yaw); }
        for (const y of [1.1, 7.9]) { const p = at(Lf / 2, y); b.box(p[0], p[1], p[2], Lf, 0.2, 0.14, yaw); }
        for (let j = 1; j < 5; j++) { const p = at(Lf / 2, 1.0 + 7.0 * j / 5); b.box(p[0], p[1], p[2], Lf, 0.09, 0.1, yaw); }
        for (const t of [Lf / 3, Lf * 2 / 3]) { const p = at(t, 4.5); b.box(p[0], p[1], p[2], 0.09, 7.0, 0.1, yaw); }
        // (the panes: wet glass with the grey sky's sheen in it; measured along the leaf and up it)
        b.col([0.34, 0.38, 0.45]).surf(K.GLASS, hour === 'night' ? 0.12 : 0.5, 1, 0).tex(0, 1, 2);
        for (const o of [-0.03, 0.03]) quadW(b, at(0.15, 1.15, o), at(Lf - 0.15, 1.15, o), at(Lf - 0.15, 7.85, o), at(0.15, 7.85, o), [-dz * s * Math.sign(o), 0, dx * s * Math.sign(o)], [0.15, 1.15, 0], [Lf - 0.15, 1.15, 0], [Lf - 0.15, 7.85, 0], [0.15, 7.85, 0]);
        // (its hinges: a knuckle on the jamb and a strap along the rail; its stay: a rod out of the wall to its foot)
        b.col(IRON, 1.6).surf(K.METAL, 0.2);
        for (const y of [1.7, 4.5, 7.3]) { b.rod([hx, y - 0.28, hz - 0.04], [hx, y + 0.28, hz - 0.04], 0.1, 0.1, 5, true); const p = at(0.55, y, 0.09); b.box(p[0], p[1], p[2], 1.0, 0.13, 0.05, yaw); }
        { const p = at(2.3, 1.25, -0.08); b.rod([p[0], 1.25, 0.3], p, 0.05, 0.05, 4); }
      }
      // (the hoist over it, and on the hoist's hook a storm lantern, lit: the window we fly to is the warmest and the
      // brightest thing over the roofs. It hangs 4 m over the line, a standing thing; its light lies on the stone of
      // the frame, on the leaves and on the brick about them)
      b.col([0.3, 0.26, 0.2]).surf(K.METAL, 0.2).lathe([[0.1, 9.36], [0.6, 9.18], [0.7, 9.06]], 8, 0, 2.9);
      b.col([1, 0.74, 0.4]).surf(K.GLOW, 2.4, 4.4).lathe([[0.14, 8.52], [0.3, 8.72], [0.25, 9.06], [0.1, 9.3]], 7, 0, 2.9);
      b.col([0.46, 0.33, 0.13]).surf(K.METAL, 0.3).lathe([[0, 8.4], [0.26, 8.44], [0.3, 8.54], [0.14, 8.6]], 7, 0, 2.9);
      b.col(WOODS.dark, 1.3).surf(K.WOOD, 0.6);
      b.box(0, 10.2, 1.6, 0.55, 0.55, 3.4).rod([0, 10.0, 2.9], [0, 9.3, 2.9], 0.06, 0.06, 4);
      // (the heads and sills of the windows under the garret window are the gable's own wet dark stone: they
      // pass under the foot of the picture as we come in, and no pale slab cuts in there)
      // (No window stands in the storey right under the garret window: what the foot of the picture cuts as we come
      // in is brick. The storeys under that keep theirs, whole in the picture from far off and out of it from near.)
      for (let r = 0; r < 4; r++) for (const x of [-8.6, 0, 8.6]) { const k = rr(), warm = 0.7 + 0.4 * rr(); if (r) wallWindow(b, x, -8.4 - r * STOREY, 0.3, 0, 1, k < 0.4, warm, k > 0.75, 4.2, 6.3, false, [0.2, 0.19, 0.185]); }
      b.col([0.2, 0.21, 0.23]).surf(K.METAL, 0.4);
      for (const s of [-1, 1]) b.rod([s * (HW + 0.3), KNEE - 0.6, 0.7], [s * (HW + 0.3), STREET, 0.7], 0.25, 0.25, 4);
      // every loft and passage that can be seen from out here wears slates and walls, lit panes in its slopes
      // (the outer gables open as wide and as high as the passage's own mouth, so that nothing of them shows within it)
      const way = { x0: -DOORW / 2, x1: DOORW / 2, y0: 0, y1: DOORH + 0.6 };
      for (const Zk of lofts.slice(0, 2)) {
        b.tr(Zk.M).col(PAL.slate, 0.55).surf(K.SLATE, 0).tex(2, 1, 0);
        // (a slope that carries a lit roof light is laid in cells of 2.5 m, the same slates, and each corner is given
        // its share of that glow, 8 m at most: the wet slate mirrors it; a slope without one is one face)
        for (const s of [-1, 1]) {
          const Gl = Zk.sky.filter((k) => k.s === s).map((k) => [s * (HW + 1.2) * (1 - k.f), KNEE - 0.6 + (RIDGE + 1.2 - KNEE) * k.f, k.z]);
          if (!Gl.length) { quadW(b, [s * (HW + 1.2), KNEE - 0.6, 0.9], [s * (HW + 1.2), KNEE - 0.6, -Zk.L - 0.9], [0, RIDGE + 0.6, -Zk.L - 0.9], [0, RIDGE + 0.6, 0.9], [s, 1, 0]); continue; }
          const nz = Math.ceil((Zk.L + 1.8) / 2.5), nv = Math.ceil(Math.hypot(HW + 1.2, RIDGE + 1.2 - KNEE) / 2.5);
          const Q = (i, j) => {
            const p = [s * (HW + 1.2) * (1 - j / nv), KNEE - 0.6 + (RIDGE + 1.2 - KNEE) * j / nv, 0.9 - (Zk.L + 1.8) * i / nz];
            let w = 0; for (const g of Gl) { const d = Math.hypot(p[0] - g[0], p[1] - g[1], p[2] - g[2]); if (d < 8) w += (1 - d / 8) * (1 - d / 8); }
            return [p[0], p[1], p[2], 0.95 * w];
          };
          for (let i = 0; i < nz; i++) for (let j = 0; j < nv; j++) { const A = Q(i, j), B = Q(i + 1, j), C = Q(i + 1, j + 1), D = Q(i, j + 1); quadW(b, A.slice(0, 3), B.slice(0, 3), C.slice(0, 3), D.slice(0, 3), [s, 1, 0], A, B, C, D); }
        }
        for (const k of Zk.sky) { const f = k.f, P = (du, dz) => [k.s * (HW + 1.2) * (1 - f - du), KNEE - 0.6 + (RIDGE + 1.2 - KNEE) * (f + du) + 0.15, k.z + dz]; b.col(mul(WLIT, 0.95)).surf(K.GLASS, 0.9, 2, 2); quadW(b, P(-0.09, 1.5), P(-0.09, -1.5), P(0.09, -1.5), P(0.09, 1.5), [k.s, 1, 0]); const c = [P(-0.096, 1.6), P(-0.096, -1.6), P(0.096, -1.6), P(0.096, 1.6)]; b.col([0.15, 0.155, 0.17]).surf(K.METAL, 0.3); for (let i = 0; i < 4; i++) b.rod([c[i][0], c[i][1] + 0.08, c[i][2]], [c[(i + 1) % 4][0], c[(i + 1) % 4][1] + 0.08, c[(i + 1) % 4][2]], 0.18, 0.18, 4); b.col(PAL.slate, 0.55).surf(K.SLATE, 0).tex(2, 1, 0); }
        b.col(BRICK).surf(K.STONE, 0.75, 0, 1).tex(2, 1, 0);
        for (const s of [-1, 1]) b.sheet([s * (HW + 0.9), STREET, 0.3], [0, 0, -Zk.L - 0.6], [0, KNEE - 0.6 - STREET, 0], 16, [s, 0, 0]);
        if (Zk.k) { gable(b, HW + 0.9, 0.3, 1, way, KNEE - 0.4, RIDGE + 0.55); b.tex(0, 1, 2).sheet([-HW - 0.9, STREET, 0.3], [HW * 2 + 1.8, 0, 0], [0, -STREET, 0], 16, PZ); }
        gable(b, HW + 0.9, -Zk.L - 0.3, -1, way, KNEE - 0.4, RIDGE + 0.55);
      }
      b.tr(null);
      for (const Lk of links.slice(0, 2)) {
        const hwP = DOORW / 2 + 0.7, top = DOORH + 1.2, A = (v, y) => [v.x, y, v.z];
        for (let j = 0; j < 3; j++) {
          const I0 = Lk.at(j / 3, RP - hwP), I1 = Lk.at((j + 1) / 3, RP - hwP), O0 = Lk.at(j / 3, RP + hwP), O1 = Lk.at((j + 1) / 3, RP + hwP), inw = I0.clone().sub(O0).normalize();
          b.col(PAL.slate, 0.55).surf(K.SLATE, 0).tex(0, 2, 1); quadW(b, A(I0, top), A(O0, top), A(O1, top), A(I1, top), UP);
          b.col(BRICK).surf(K.STONE, 0.75, 0, 1).tex(0, 1, 2);
          quadW(b, A(I0, STREET), A(I1, STREET), A(I1, top), A(I0, top), [inw.x, 0, inw.z]); quadW(b, A(O0, STREET), A(O1, STREET), A(O1, top), A(O0, top), [-inw.x, 0, -inw.z]);
        }
      }
      await ctx.yield();
      // the cathedral on the skyline, where the cathedral is: its long roof, a spire over the crossing, the two towers of
      // its west front (it stands so far off in the rain that it is a shape and no more)
      {
        const WY = 62, RY = 106, TH = 150, tz = 16, grey = [0.11, 0.115, 0.13];
        // (the faces of it that look to the break in the cloud take its warm light: the spire and the towers stand lit on one flank)
        b.light((x, y, z, nx, ny, nz, o) => { light(x, y, z, nx, ny, nz, o); const d = Math.max(0, nx * BRK.dir.x + ny * BRK.dir.y + nz * BRK.dir.z) * (y > 40 ? 4.2 : 1.4); o[0] += BRK.col[0] * d; o[1] += BRK.col[1] * d; o[2] += BRK.col[2] * d; return o; });
        b.tr(nav.M).col(grey).surf(K.PLAIN, 0, 0.5).tex(0, 1, 2);
        for (const s of [-1, 1]) {
          b.sheet([s * (AW + 2), STREET, 4], [0, 0, -LN - 4], [0, WY - STREET, 0], 40, [s, 0, 0]);
          quadW(b, [s * (AW + 3), WY, 4], [s * (AW + 3), WY, -LN], [0, RY, -LN], [0, RY, 4], [s, 1, 0]);
          b.box(s * (AW - 9), (TH + STREET) / 2, tz, 21, TH - STREET, 21).lathe([[12, TH], [9, TH + 6], [0, TH + 68]], 8, s * (AW - 9), tz);
          for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.lathe([[2.4, TH], [0, TH + 20]], 4, s * (AW - 9) + dx * 9.4, tz + dz * 9.4);
        }
        b.sheet([-AW - 2, STREET, 4], [AW * 2 + 4, 0, 0], [0, WY - STREET, 0], 40, PZ).tri([-AW - 3, WY, 4], [AW + 3, WY, 4], [0, RY, 4]);
        b.lathe([[3.4, RY - 4], [2.2, RY + 8], [0, RY + 44]], 6, 0, zJ / 2);
        b.tr(null); b.light(light);
      }
      await ctx.yield();
      // washing strung across the yard below the way in (its lines at least 3.4 m under the line), and from the wings' walls
      // (the middle of each line is bare for 8 m to either side of the way in: no sheet hangs under the line,
      // where it would cut in along the foot of the picture as we pass over it)
      for (const z of [-78, -86, -93]) { const y = Math.min(routeY(z) - rwY.range(3.4, 4.6), 5.5); washLine(b, [-14.4, y, z], [14.4, y + rwY.range(-0.6, 0.6), z], rwY.range(0.5, 1.1), draws(rwY, 10), 1, [0.22, 0.78]); }
      await ctx.yield();
      for (const s of [-1, 1]) for (const z of [-75, -82, -90]) { const y = routeY(z) + rwY.range(-0.5, 1.4); washLine(b, [s * 14.4, y, z], [s * rwY.range(6.4, 7.4), y - 0.3, z + rwY.range(-1.5, 1.5)], 0.3, draws(rwY, 10)); }
      await ctx.yield();
      const mesh = new THREE.Mesh(b.build(), AIR.out.mat); mesh.frustumCulled = false; scene.add(mesh); cityObjs.push(mesh);
      await ctx.yield();
      // Pigeons on the ridges the line passes over. Each flies over, on a round of its own, to a place of the next roofs that is
      // taken out of the houses' own list: the first row's to a ridge or a chimney cap of the row beyond; those of the row
      // before the yard to the ridge or a chimney cap of a wing, to the tenement's own ridge or to the hoist beam over the
      // window. Every draw is made before any test. The perch, the landing place and seven places along the flight
      // (with its 1.7 m rise) are each asked to keep 6 m from the lane (the line, and the line continued back behind
      // the entry): a pigeon whose way on comes nearer stays on its ridge, and one whose perch is nearer is not made.
      // Between the seven places the flight bows a little nearer: OVER THEIR WHOLE ROUNDS THE PIGEONS KEEP 4 M AND
      // MORE off the lane, not 6 (the builder's own count in node at 33 places of every flight, round 6: 4.49 m the
      // nearest on seeds 1 to 40).
      const T0 = lofts[0], rowAt = (z) => ridges.filter((g) => !g.axis && g.z === z), wings = ridges.filter((g) => g.axis);
      const capOf = (g, u) => {
        const [t, ch, pots] = g.chim[Math.min(g.chim.length - 1, Math.floor(u * g.chim.length))], lx = (u - 0.5) * (1.9 * pots + 1.6), a = (t - 0.5) * g.w * 0.84;
        return g.axis ? [g.x + 2.5, g.ridge + ch + 0.6, g.z - a - lx] : [g.x + a + lx, g.ridge + ch + 0.6, g.z + 2.5];
      };
      const landOn = (h, x, u, cap) => {
        if (h.z === -22) {
          const row = rowAt(-57); if (!row.length) return null;
          const g = row.reduce((a, c) => (Math.abs(c.x - x) < Math.abs(a.x - x) ? c : a));
          return cap && g.chim.length ? capOf(g, u) : [clamp(x, g.x - g.w * 0.45, g.x + g.w * 0.45), g.ridge + 0.45, g.z];
        }
        if (Math.abs(x) < 9) return cap ? T0.w3(0, 10.58, 0.5 + u * 2.4) : T0.w3(0, RIDGE + 0.7, -1 - u * 12);
        const g = wings.find((w) => Math.sign(w.x) === Math.sign(x)); if (!g) return null;
        return cap && g.chim.length ? capOf(g, u) : [g.x, g.ridge + 0.45, -74 - u * 26];
      };
      for (const h of ridges) if (!h.axis && h.z > -ATTIC.ZG && Math.abs(h.x) < 60) for (let j = 0, n = rbR.int(2, 5); j < n; j++) {
        const p = new THREE.Vector3(h.x + rbR.range(-0.4, 0.4) * h.w, h.ridge + 0.45, h.z), dx = rbR.range(-14, 14), u = rbR(), cap = rbR.chance(0.35), ph = rbR();
        if (laneSeg(p.x, p.y, p.z, p.x, p.y, p.z, 7) < 6) continue;
        const to = landOn(h, p.x + dx, u, cap), q = to ? new THREE.Vector3(to[0], to[1], to[2]) : p.clone();
        let free = !!to;
        for (let i = 1; i <= 8 && free; i++) { const f = i / 8; const x = lerp(p.x, q.x, f), y = lerp(p.y, q.y, f) + 1.7 * Math.sin(Math.PI * f), z = lerp(p.z, q.z, f); if (laneSeg(x, y, z, x, y, z, 7) < 6) free = false; }
        // (it flies 14 m a second, there and, half a round later, back; one that stays never leaves)
        light(p.x, p.y, p.z, 0, 1, 0, out3);
        birdList.push({ p, q: free ? q : p, roof: true, light: [out3[0] * 1.6, out3[1] * 1.6, out3[2] * 1.6], ph, fly: free ? p.distanceTo(q) / 14 : 0 });
      }
      await ctx.yield();
      // smoke from the stacks nearest the way whose column stands clear of the lane at every hour of the world's clock:
      // the column as the kit moves it (it rises 30 m and leans with the wind; its puffs spread 0.8 to 5 m about its axis,
      // each 2.4 to 8.5 m across) keeps CLEAR from the lane with all its puffs, or the stack does not smoke
      const SMOKE = { height: 30, radius: [0.8, 5], size: [2.4, 8.5], wind: [0.25, 0, -0.9], bend: 0.45 };
      const smokeClear = (st) => {
        const wl = Math.hypot(SMOKE.wind[0], SMOKE.wind[2]);
        for (let i = 0; i <= 20; i++) {
          const h = i / 20, k = h * h * SMOKE.height * SMOKE.bend / wl, x = st[0] + SMOKE.wind[0] * k, y = st[1] + h * SMOKE.height, z = st[2] + SMOKE.wind[2] * k;
          const need = CLEAR + 1.3 * lerp(SMOKE.radius[0], SMOKE.radius[1], Math.pow(h, 0.8)) + 0.65 * lerp(SMOKE.size[0], SMOKE.size[1], Math.pow(h, 0.7)) + 0.8;
          if (laneSeg(x, y, z, x, y, z, need + 1) < need) return false;
        }
        return true;
      };
      const nearStacks = stacks.filter(smokeClear).map((p) => [path.distanceTo(p[0], p[1], p[2]), p]).sort((p, q) => p[0] - q[0]).slice(0, 9).map((p) => p[1]);
      await ctx.yield();
      for (const st of nearStacks) {
        const sm = fx.makeSmokeColumn({ rng: rsm, time: U.uTime, position: st, height: SMOKE.height, radius: SMOKE.radius, size: SMOKE.size, bend: SMOKE.bend, count: Math.round(30 * detail), color: '#6f6b67', colorTop: '#8e8983', shadowColor: '#4c4844', opacity: 0.3, softness: 1.0, ragged: 0.7, wind: SMOKE.wind, sunDir: [sunW.x, sunW.y, sunW.z] });
        scene.add(sm.object); cityObjs.push(sm.object);
        await ctx.yield();
      }
      // the rain: a standing box of it over the roofs and the yard, the same for the whole visit (it does not follow the
      // visitor and nothing turns it up or down). It ends half a metre before the tenement's wall: it rains on the city
      // and in the yard, never under the rafters
      const rainZ = -ATTIC.ZG + 0.5, RAIN = hour === 'night' ? 0.2 : 0.5;
      const rain = fx.makeParticles({ rng: rrain, preset: 'rain', follow: false, center: [0, 12, (6 + rainZ) / 2], box: [76, 50, 6 - rainZ], size: [0.04, 0.075], stretch: 0.085, opacity: RAIN, count: Math.round(7700 * detail), time: U.uTime });
      rain.setOpacity(RAIN);
      scene.add(rain.object); cityObjs.push(rain.object);
      await ctx.yield();
    }

    // ------------------------------------------------------------ doors opened a hand's breadth on rounds of their own; papers a draught lifts
    {
      const leaf = makeBatch(64).box((CDW - 0.1) / 2, 0.14 + (CDH - 0.2) / 2, 0, CDW - 0.1, CDH - 0.2, 0.14).build();
      const n = doorList.length, g = new THREE.InstancedBufferGeometry(), P = new Float32Array(n * 4), A = new Float32Array(n * 4), Lg = new Float32Array(n * 4);
      doorList.forEach((d, i) => {
        // hung on the jamb we come to first: the leaf swings into its room (al: the way the shut leaf lies; nr: the way it swings)
        P.set([d.p.x, d.p.y, d.p.z, 0], i * 4); A.set([d.al.x, d.al.z, d.nr.x, d.nr.z], i * 4); Lg.set([d.light[0], d.light[1], d.light[2], d.ajar], i * 4);
      });
      g.setAttribute('position', leaf.getAttribute('position')); g.setAttribute('normal', leaf.getAttribute('normal'));
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iL', new THREE.InstancedBufferAttribute(Lg, 4));
      g.instanceCount = n;
      const doors = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: AIR.cor.u, vertexShader: DOOR_VERT, fragmentShader: DOOR_FRAG }));
      doors.frustumCulled = false; scene.add(doors);
      // Loose sheets on the corridor's boards (their own stream). A draught runs down the corridor on the world's clock
      // (5.5 m a second, one every 11.6 s) and lifts the sheets as it passes; they tumble and settle behind it, whether
      // anyone is there or not. A sheet lying within 4 m of the line only stirs where it lies (0.2 m); the others rise,
      // and with their drift (0.85 m at most) and their own half length (0.57 m) stay CLEAR of the line at every phase.
      const np = Math.round(190 * density * detail), g2 = new THREE.InstancedBufferGeometry(), P2 = new Float32Array(np * 4), A2 = new Float32Array(np * 4);
      for (let i = 0; i < np; i++) {
        const x = rpap.range(-CHW + 0.5, CHW - 0.5), y = 0.04 + 0.02 * rpap(), z = rpap.range(-cor.L + 2, -2), num = rpap(), tone = rpap.range(0.75, 1.1), yaw = rpap.range(0, TAU), up = rpap.range(0.9, 2.6);
        const w = cor.toW(x, y, z), near = path.nearestXZ(w.x, w.z);
        cor.light(w.x, w.y, w.z, 0, 1, 0, out3);
        P2.set([w.x, w.y, w.z, num], i * 4); A2.set([-z, tone * Math.min(1.1, 0.9 * Math.max(out3[0], out3[1], out3[2])), cor.psi + yaw, near.dist > CLEAR + 1.5 ? Math.min(up, near.y - 0.6) : 0.2], i * 4);
      }
      // (where the draught's front stands at the world clock's nought is this seed's own: a number of the sheets' stream,
      // drawn after them, added to every sheet's metres down the corridor; the shader reads those metres for nothing else)
      { const front = rpap.range(0, 64); for (let i = 0; i < np; i++) A2[i * 4] += front; }
      g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.33, 0, -0.46, 0.33, 0, -0.46, 0.33, 0, 0.46, -0.33, 0, -0.46, 0.33, 0, 0.46, -0.33, 0, 0.46]), 3));
      g2.setAttribute('iP', new THREE.InstancedBufferAttribute(P2, 4)); g2.setAttribute('iA', new THREE.InstancedBufferAttribute(A2, 4)); g2.instanceCount = np;
      const papers = new THREE.Mesh(g2, new THREE.ShaderMaterial({ uniforms: AIR.cor.u, vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide }));
      papers.frustumCulled = false; scene.add(papers);
      zones.find((z) => z.name === 'corridor').objs.push(doors, papers);
    }
    // pigeons: a body and two wings each; those of the roofs a draw call, those of each loft a draw call of that loft's
    // piece, each in the air of its place
    {
      const V = [], Wg = [], tri = (a, b2, c, w) => { V.push(...a, ...b2, ...c); Wg.push(w[0], w[1], w[2]); };
      const N = [0, 0, 0.5], T = [0, 0.05, -0.6], Tp = [0, 0.22, 0], D = [0, -0.15, 0], Lf = [-0.16, 0, 0], R = [0.16, 0, 0];
      for (const [a, b2, c] of [[N, Tp, R], [N, R, D], [N, D, Lf], [N, Lf, Tp], [T, R, Tp], [T, D, R], [T, Lf, D], [T, Tp, Lf]]) tri(a, b2, c, [0, 0, 0]);
      for (const sd of [-1, 1]) tri([sd * 0.12, 0.1, 0.25], [sd * 0.12, 0.1, -0.2], [sd * 0.9, 0.1, -0.05], [0, 0, sd]);
      const flock = (list, air) => {
        const n = list.length, g = new THREE.InstancedBufferGeometry(), P = new Float32Array(n * 4), Q = new Float32Array(n * 4), R4 = new Float32Array(n * 4), T2 = new Float32Array(n * 2);
        list.forEach((f, i) => {
          const dx = f.q.x - f.p.x, dz = f.q.z - f.p.z;
          // (its round: 30 to 60 s by its own number, and never so short that it would be more in the air than on its feet)
          P.set([f.p.x, f.p.y, f.p.z, Math.atan2(dx, dz)], i * 4); Q.set([dx, f.q.y - f.p.y, dz, 0], i * 4); R4.set([f.light[0], f.light[1], f.light[2], f.ph], i * 4);
          T2.set([f.fly, Math.max(30 + 30 * ((f.ph * 5.3) % 1), 4 * f.fly + 8)], i * 2);
        });
        g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wg, 1));
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(Q, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(R4, 4)); g.setAttribute('iT', new THREE.InstancedBufferAttribute(T2, 2));
        g.instanceCount = n;
        const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: air.u, vertexShader: BIRD_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide }));
        mesh.frustumCulled = false; scene.add(mesh);
        return mesh;
      };
      for (const z of zones) { const own = birdList.filter((f) => !f.roof && f.zone === z.name); if (own.length) z.objs.push(flock(own, AIR.loft)); }
      await ctx.yield();
      cityObjs.push(flock(birdList.filter((f) => f.roof), AIR.out));
    }
    // shafts of the skylights and the high windows; dust in them: a mesh of shafts and one of dust for each piece that
    // has them, drawn with its room and never without it
    {
      const BC = mul(HR.beam, 1 / Math.max(HR.beam[0], HR.beam[1], HR.beam[2]));
      for (const z of zones) {
        const sh = beamsAll.filter((q) => q.zone === z.name), sn = naveBeams.filter((q) => q.zone === z.name), mo = motesAll.filter((m) => m.zone === z.name && moteOk(m));
        for (const o of [sh.length ? makeBeams(sh, U.uTime, BC, 0.1, gapPt) : null, sn.length ? makeBeams(sn, U.uTime, BC, 0.1, gapPt, 2) : null, mo.length ? makeMotes(mo, U.uTime, [1.5, 1.4, 1.2], 0.075, 110, U.uEye) : null]) if (o) { scene.add(o); z.objs.push(o); }
      }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the sky over the roofs
    const sky = makeSky({ rng: rsk, preset: hour === 'night' ? 'night' : 'overcast',
      ...(hour === 'night' ? { zenith: '#0c1018', horizon: '#232b39', ground: '#07080a', bodies: [{ elevation: SUN[0], azimuth: SUN[1], size: 2.1, phase: 0.93, intensity: 0.95, dark: 0.03, glow: 0.3, glowColor: '#9db8ff', glowSize: 6 }] } : hour === 'golden' ? { zenith: '#5a5148', horizon: '#c79a62', ground: '#2a2420', sunElevation: SUN[0], sunAzimuth: SUN[1], scatterColor: '#ffb060', scatter: 0.6 }
        : { zenith: '#39393b', horizon: '#80766a', ground: '#2c2925', sunElevation: SUN[0], sunAzimuth: SUN[1], sunGlow: 0.12,
          clouds: { lit: '#9a958d', shade: '#2b3037', absorb: 2.1 }, clouds2: { lit: '#6c7075', shade: '#30353c' },
          sun2: { elevation: BRK.el, azimuth: BRK.az, color: '#ffb672', size: 0.5, intensity: 0, glow: 1.45, glowTight: 0.2 } }) });
    scene.add(sky.object); cityObjs.push(sky.object);
    await ctx.yield();
    const mWin = film.mWin;

    // ------------------------------------------------------------ the film (the pace, the gaze) and what is drawn, by the metres flown
    const mWell = film.mWell, mLoftEnd = cor.m0, paceAt = film.paceAt;
    const pois = film.pois;
    // Where each piece is first drawn: a piece is drawn from the first metre of the piece two before it (a loft and its
    // bent passage lie between). The painter's room opens off the corridor's end on the corridor's own axis and is drawn
    // with it. The door behind the painter's bed stands open on that same axis, so whatever shows the corridor's end
    // shows a patch of the cathedral across the nave: the cathedral's own shell and people are drawn from where the
    // corridor is drawn. The gates, the halls and the last court lie at the nave's far end, off that axis: they are drawn
    // from 35 m inside the corridor; their people from where each can first be seen (see the crowd's classes).
    zones.forEach((z, i) => { z.from = z.from ?? (i < 2 ? -1 : zones[i - 2].m0); });
    const zoneOf = (name) => zones.find((z) => z.name === name);
    zoneOf('painter').from = zoneOf('corridor').from;
    zoneOf('nave').from = zoneOf('corridor').from;
    // (from 35 m inside the corridor, where no loft is drawn any more. Nothing of them can be seen from the
    // corridor: its axis shows the crossing's far wall alone. Counted by lines of sight on seeds 1 to 60.)
    zoneOf('gates').from = cor.m0 + 35;
    // (each mesh carries its piece's name, for the counts that read the scene)
    for (const z of zones) for (const o of z.objs) o.name = z.name;
    for (const o of cityObjs) o.name = 'roofs';
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    return {
      scene, path, duration: DURATION,
      pace: (u) => paceAt(u * LEN),
      camera: { fov: 64, near: 0.3, far: 1400, lookAhead: 14, sway: 0.4, bank: 0.3 },
      pois,
      // (The portal is whole where its place can first be seen: that is through the THIRD gate's opening, from the metre
      // of the route film.mPortalShown, worked out from the gates and the walk. The engine brings an opening in between
      // its reveal distance and 0.6 of it, so the reveal distance is that sight's distance from the end over 0.6.)
      portal: { shape: 'arch', width: hero.anchors.portal.width, height: hero.anchors.portal.height, color: '#ffe2a0', glow: 1, revealDistance: (LEN - film.mPortalShown) / 0.6, blendDistance: 40 },
      post: { exposure: 1.05, bloom: { strength: 0.4, radius: 0.7, threshold: 0.95 }, grade: { saturation: 1.0, contrast: 1.05, tint: '#ffffff', shadowTint: '#07060a', vignette: 0.34, grain: 0.016, aberration: 0 } },
      update(dt, time, camera, u) {
        // (the metres flown say only what is DRAWN, piece by piece, and where on the route the visitor is; nothing of the
        // world begins, turns or ends by them: every motion is a habit on the world's clock, every air and light a place's own)
        const m = u * LEN;
        U.uTime.value = time;
        path.pointAt(u, U.uEye.value);
        // each piece is drawn from the first place it can be seen from (zones[i].from) until we have left it; the roofs only from outside
        for (let i = 0; i < zones.length; i++) {
          const on = m >= zones[i].from && m <= zones[i].m1 + 30;
          for (const o of zones[i].objs) o.visible = on;
        }
        const outside = m < mWin + 14;
        for (const o of cityObjs) o.visible = outside;
        sky.update(dt, time, camera); hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};

const DOOR_VERT = /* glsl */`
// the hinge (x, y, z)
attribute vec4 iP;
// the way the shut leaf lies (x, z), the way into its room (x, z)
attribute vec4 iA;
// the corridor's light on it; how far this one opens
attribute vec4 iL;
uniform float uOpen, uTime;
varying vec3 vCol, vW, vO;
void main(){
  // a habit on the world's clock: each door is opened a hand's breadth from within and shut again on a round of its own
  // (12 to 26 s, some 4 s of it ajar), whether anyone comes by or not
  float per = 12. + 14. * fract(iL.w * 3.7), tt = fract(uTime / per + fract(iL.w * 11.3 + iP.x * .13 + iP.z * .07)) * per;
  float rip = smoothstep(0., 1.1, tt) * (1. - smoothstep(3.4, 4.8, tt));
  float a = .21 * iL.w * rip + 1.35 * uOpen;
  // (the two leaves of the door behind the painter's bed stand wide open, always)
  if (iL.w > 5.) a = 1.5;
  vec2 dir = iA.xy * cos(a) + iA.zw * sin(a), prp = iA.zw * cos(a) - iA.xy * sin(a);
  vec3 w = iP.xyz + vec3(dir.x, 0., dir.y) * position.x + vec3(prp.x, 0., prp.y) * position.z + vec3(0., position.y, 0.);
  vec3 n = vec3(dir.x, 0., dir.y) * normal.x + vec3(prp.x, 0., prp.y) * normal.z + vec3(0., normal.y, 0.);
  vO = position; vW = w;
  vCol = iL.rgb * (.55 + .6 * max(dot(n, -vec3(iA.z, 0., iA.w)), 0.));
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const DOOR_FRAG = /* glsl */`
uniform vec4 uFog;
varying vec3 vCol, vW, vO;
float dh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float dn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(dh(i), dh(i + vec2(1., 0.)), f.x), mix(dh(i + vec2(0., 1.)), dh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  // a shut door of four panels in its stiles and rails: warm brown wood that the corridor's lamps show, each
  // panel sunk a little (dark under the rail above it and beside the stile, light on its lower edge), a brass knob
  float grain = dn(vec2(vO.x * 3., vO.y * .3)) * .5 + dn(vec2(vO.x * 19., vO.y * 1.1)) * .2;
  vec2 q = vec2(vO.x / 2.6, vO.y / 5.94);
  vec2 c = vec2(abs(q.x - .5) - .24, q.y < .46 ? abs(q.y - .25) - .16 : abs(q.y - .71) - .2), h = vec2(.17, 0.);
  vec2 dq = vec2((abs(c.x) - h.x) * 2.6, c.y * 5.94);
  float inside = step(dq.x, 0.) * step(dq.y, 0.), edge = min(-dq.x, -dq.y);
  float top = q.y < .46 ? q.y - .25 : q.y - .71;
  float bevel = inside * (1. - smoothstep(0., .09, edge)) * (top > 0. && -dq.y < -dq.x ? -.38 : (top <= 0. && -dq.y < -dq.x ? .3 : -.12));
  vec3 col = vec3(.5, .35, .2) * (.72 + .5 * grain) * (1. - .16 * inside + bevel) * (vCol + .05);
  float knob = length(vec2(vO.x - 2.36, vO.y - 2.75));
  col = mix(col, vec3(.62, .47, .2) * (vCol * 1.5 + .08) * (1.2 - 5. * knob), 1. - smoothstep(.07, .085, knob));
  float dist = length(cameraPosition - vW);
  col = mix(col, uFog.rgb, clamp(1. - exp(-dist * uFog.w), 0., 1.));
  gl_FragColor = vec4(col, 1.);
}`;
const PAPER_VERT = /* glsl */`
// where the sheet lies (x, y, z) and its own number
attribute vec4 iP;
// how far down the corridor it lies (m, with the seed's offset of the draught's front), its tone, the way it lies, how high it may rise (m)
attribute vec4 iA;
uniform float uTime;
varying vec3 vCol, vW;
void main(){
  // a habit on the world's clock: the draught's front comes by every 11.6 s (iA.x: the sheet's metres down the corridor
  // and the seed's own offset of the front); g is this sheet's share of the time since
  float sd = iP.w, g = fract((uTime * 5.5 - iA.x) / 64.);
  float lift = smoothstep(0., .08, g) * (1. - smoothstep(.2, .38, g));
  float a = iA.z, t = g * 64. * (.2 + .25 * fract(sd * 3.7)) * lift;
  vec3 p = position;
  float c1 = cos(t * 1.7 + sd * 6.), s1 = sin(t * 1.7 + sd * 6.);
  p.yz = mix(p.yz, vec2(p.y * c1 - p.z * s1, p.y * s1 + p.z * c1), lift * step(.5, iA.w));
  float c = cos(a + t), s = sin(a + t);
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  vec3 w = iP.xyz + p;
  w.y += lift * iA.w * (.55 + .45 * fract(sd * 7.3)) * (.9 + .1 * sin(uTime * 2.1 + sd * 30.));
  w.x += lift * .6 * sin(sd * 40.) * step(.5, iA.w); w.z += lift * .6 * cos(sd * 31.) * step(.5, iA.w);
  vW = w;
  vCol = vec3(.84, .8, .72) * iA.y * (.85 + .25 * lift);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const PAPER_FRAG = /* glsl */`
uniform vec4 uFog;
varying vec3 vCol, vW;
void main(){
  float dist = length(cameraPosition - vW);
  gl_FragColor = vec4(mix(vCol, uFog.rgb, clamp(1. - exp(-dist * uFog.w), 0., 1.)), 1.);
}`;
const BIRD_VERT = /* glsl */`
// 0: body; -1 / +1: the tip of the left / right wing
attribute float aW;
// the perch (x, y, z) and the heading of its flight
attribute vec4 iP;
// the way to the place it flies over to (x, y, z)
attribute vec4 iQ;
// the loft's light on it, its own number
attribute vec4 iR;
// its round on the world's clock: x the seconds one flight takes (0: it stays where it sits), y the seconds of the whole round
attribute vec2 iT;
uniform float uTime;
varying vec3 vCol, vW;
void main(){
  float ph = iR.w;
  // a habit on the world's clock: it sits, flies over to its other place, sits there, and half a round later flies back,
  // whether anyone comes by or not; in between it is in the air
  float tt = fract(uTime / iT.y + fract(ph * 7.31)) * iT.y, half_ = .5 * iT.y, tf = max(iT.x, .001);
  float fl = iT.x > 0. ? smoothstep(0., tf, tt) - smoothstep(half_, half_ + tf, tt) : 0., air = sin(fl * 3.14159), up = smoothstep(0., .15, air);
  vec3 p = position;
  if (abs(aW) > .5) p = mix(vec3(aW * .17, .12, -.5), vec3(p.x, p.y + sin(uTime * 17. + ph * 40.) * .55, p.z), up);
  // on the clock: perched, it nods and turns about
  float nod = (1. - up) * step(.6, fract(uTime * .35 + ph * 7.)) * sin(uTime * 9. + ph * 30.);
  p.y += nod * .05 * step(.2, position.z);
  // (it heads the way it flies: over, and back again)
  float yaw = iP.w + 3.14159 * step(half_, tt) * up + (1. - up) * (.6 * sin(uTime * .4 + ph * 20.) + 3.14159 * step(.5, fract(ph * 5.)));
  float c = cos(yaw), s = sin(yaw), size = 1.25 + .4 * fract(ph * 13.);
  vec3 w = vec3(p.x * c + p.z * s, p.y + .15, -p.x * s + p.z * c) * size + iP.xyz + iQ.xyz * fl + vec3(0., 1.7 * air, 0.);
  vW = w;
  vCol = iR.rgb * mix(vec3(.5, .52, .57), vec3(.3, .31, .35), abs(aW)) * (.8 + .4 * fract(ph * 3.)) * (.7 + .6 * smoothstep(-.15, .22, position.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
