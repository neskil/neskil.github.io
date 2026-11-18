// The Same Field Every Hour: one Normandy valley flown east with a whole day laid along it (after Claude Monet).
// Frost dawn on a field of grainstacks, morning on a poplar stream, a drop over a sluice to white noon at an arched
// footbridge hung with wisteria, lily water that is the sky upside down, then sunset and blue dusk at a landing of rose
// arches. Everything is oil touches lying on their forms (src/parts/same-field-every-hour.js holds the style): nothing is
// lit, nothing is outlined, the tone map is off (post.flat) and the hour is a change of pigment that overtakes us as a front.
// World frame: +Z is the course (east), port is +X, starboard is -X. Pond water is y = 0, the stream is y = 6.
// Doubles: every mass over water is laid again upside down under it as an under-form in its shade pigment (MIR, MIRS), with
// flipped drags over it and level dashes of sky colour across it. The banks of the pond are rows of lobed foliage masses.
// What was added in the second pass draws from rng2 (a stream of its own).
//
// LAWS OF PLACE (typed once each, in HEM, BERTH and STUB below; nothing here reads the lens, the eye, a still, the flight's share or a clock; of the deal the stubble's shade reads the density and what the deal has already given a dash, its band, its dealt offset from the line, its place and its role, and it draws no number).
// THE HEM LAW. Every hanging drag laid by willow() and curtain() (the sluice's two willows and its curtain, the ten nave
//   willows, the four pond curtains, the island's willow) is kept off the flown line by where it ends:
//   (1) THE LIFT OVER THE LINE: within HEM.PART (3.3 m) level of the flown line no drag ends lower than the line's height
//       there plus HEM.CLEAR (2.2 m); from 3.3 m that floor eases over HEM.EASE (1.5 m) down to HEM.SINK under the water,
//       lower than any strand trails, and beyond 4.8 m the lift asks nothing. The floor is a function of the drag's place
//       and of the flown line (a table made once from the path, searched over HEM.SPAN whole metres of z either side).
//   (2) THE CURTAINS' HEM, for curtain() only: the four pond curtains end no lower than HEM.POND (2.5 m) above the water
//       across their whole width, the sluice's curtain no lower than HEM.SLUICE (0.8 m) above the stream; that floor
//       carries a slow scallop by place (0 to 2 x HEM.SCAL upward, a wave of 7 to 8 m along the hem), so the lift over
//       the line is the low arch of a valance.
//   (3) The willows keep their own hems outside the lift: their strands trail to the water as they did.
//   (4) Every strand adds a lift of its own of 0 to HEM.RAG (1 m) by a hash of its anchor's place; a strand whose own hem
//       is higher keeps it. A drag that would end under its floor is shortened (its top stays, it ends on the floor), as
//       it is drawn at the build's detail, and takes its hang, place and direction from its new middle; with under HEM.MIN
//       (1.1 m) of room it is left out. Its draws are still drawn, so everything else stands where it stood.
//   (5) The bridge's wisteria racemes come under the same lift (the hero is given it as opts.hem): a raceme anchored within
//       3.3 m level of the line ends no lower than the line's height there plus 2.2 m and a lift of its own of 0 to
//       HEM.RACE by place; it is shortened from the tip, or left out with under HEM.RMIN (0.7 m) left.
//   (6) EVERY DOUBLE OF THE POND IS BUILT IN THE WATER. Every pond double (every touch of RP: the doubles of the pond's
//       touches, and those of the banks, the far banks and the landing laid into RP after them) ends no higher than the
//       water (y 0) as it is built (its upper end taken as its middle plus half its length; what the part adds by the
//       eye's distance is not counted: see dblHem). One that would rise above it is shortened from the top, its lower end
//       staying where it is (so its middle sinks by half of what is cut), unless too little of it would be left: then it
//       is left out. How little goes by the double's place. Within HEM.PART + HEM.EASE (4.8 m) level of the flown line
//       (by the same table as the lift) it is left out with under HEM.MIN (1.1 m) left, the least length of a drag in
//       (4): that is the rule as it stood when the air beside the line was counted clear, kept to the number so that
//       the count still holds. Beyond 4.8 m it is left out only with under HEM.STUB (0.4 m) left: out there a short
//       stub at a bank's waterline is a reflection too, and only a remnant shorter than that is dropped (a guard: on
//       seeds 1 to 48 at details 1 and 0.6 and seeds 1 to 24 at 0.8 none is; the least left there is 0.50 m). This
//       holds at every detail and on every seed, and no number is drawn for it: both streams run as they did.
//   With every hanging thing held clear by place, nothing is pushed round the lens any more (uPart is 0 in the part file):
//   "the drags part" now means the parting of the hems over the line. That parting stands open for good, so update()
//   draws the pond's batches from the eye's z 235 on (it was 256): see there.
// THE ROWBOAT'S BERTH. Moored, its keel lies BERTH.MOORED (4.3 m) to port of the course; adrift it lies BERTH.ADRIFT, so
//   that its swing keeps every vertex of the hull 2.2 m or more from the flown line. The clear water kept for it among the
//   rafts and pads is the moored berth's, as before.
// THE STUBBLE'S SHADE (typed once, in STUB below). In the frost field a share of the level stubble dashes lies in the
//   stubble's shade pigment. (A "level dash", here and in the code, is a stubble dash laid flat on the ground, as against
//   an upright tuft. It is not dead level: it lies on the drawn ground and tilts with it, see THE DASH LIES ON ITS FORM.)
//   Such a dash is laid with occlusion STUB.OCC (0.6) where every other has -0.5 (over 0.54 no tilt of the field turns
//   it light at dawn or in the morning). The shade sets that one number and nothing else of a dash: its x and z, length,
//   width, role and kind are as they were before there was a shade; its height, the rise of its stroke and its normal
//   are not as they were, they are every level dash's, lit or in shade: the drawn ground's (below). The share is
//   STUB.SHARE (0.36) divided by the deal's density, kept between STUB.LO (0.28) and STUB.HI (0.5). Which dashes: those
//   whose hash of their own place (hemHash of the x and z the dash is laid at) is under the share. Nothing of this reads
//   the flight, the eye, a still or a clock. Of the seed's deal it does read the density and what the deal has already
//   given the dash (its place, its band, its dealt offset from the line, its role: numbers of the seed's stream), but
//   no number is DRAWN for the shade: both streams run as they did. A dash whose role is RIM keeps the light
//   (in shade it would turn green and lemon once the sunrise front has passed); so do the upright tufts, the thatch,
//   the hedge and every other mass.
//   THE CORRIDOR'S EVENING OUT, a law of the corridor, built once: the fine dashes are dealt densest under the flown line
//   and thin out to 9.5 m of dealt offset from it, so an even share would paint a lane with pale kerbs. In the fine band
//   the share therefore rises with the dash's DEALT OFFSET from the line (lat in the code): how far to port or starboard,
//   in x, the dash is dealt from the line's own point at the distance of route dealt to it, before up to 1 m of z either
//   way is added to its place. That is not the dash's least distance from the line, which is another number wherever
//   the line slants across the field. The share is itself up to STUB.NEAR (4 m) of that offset, rising smoothly to
//   STUB.KERB (2.2) times itself at STUB.FAR (7 m) and beyond, never over STUB.TOP (0.8). In the outer band (the large
//   dashes, dealt 8 to 60 m off) it is the share itself.
//   THE SHADE THINS TOWARD THE HEDGE, a law of place: in both bands the share so found (after the evening out and its
//   cap) is multiplied by a factor of the dash's own z: 1 up to STUB.Z0 (z 82), falling smoothly to STUB.END (0.35) at
//   STUB.Z1 (z 110) and beyond. Why: the violet shade is the frost's, the opening's picture; the sunrise front passes
//   the eye at z 85 and runs on ahead of it, so the dashes toward the hedge are seen on morning gold, where the same
//   violet dashes read as lilac flecks strewn on the field and not as stubble in shade. The factor is never over 1, so
//   the dashes in shade are some of those that would be without it; nothing else of a dash changes, no number is drawn.
//   THE DASH LIES ON ITS FORM: every level stubble dash, lit or in shade, in both bands, lies on the DRAWN ground, the
//   valley mesh's own flat triangles (drawnAt, built once where the mesh is laid), and no longer dead level 0.04 m over
//   groundAt as it was first laid: the mesh takes groundAt at its corners (every 5 m of z, at the columns of EDGE) and
//   is flat between them, and under the stubble it lies up to 28 cm under groundAt and 5 cm over it, so a dash laid by
//   groundAt floats in one place and is hidden in another. The dash takes that surface's rise along its direction and
//   its normal at its own place (a difference over STUB.LIE, 0.5 m, either way) and its middle stands STUB.LIFT
//   (0.06 m) over it. Why 0.06: the part moves
//   every touch along its normal, up or down, by up to 2.5 cm and more with distance (7 cm at 60 m), and 0.06 m is
//   the least lift of 0.04, 0.05, 0.06, 0.07 and 0.08 that keeps the dashes hidden whole by the ground under 3 in 100
//   at 5 m off and under 8 in 100 at 60 m. No number is drawn for it.
//   THE TUFTS STAND ON THE DRAWN GROUND: an upright tuft's foot is taken from the same height (drawnAt at its own
//   place; its middle 0.42 of its own height over that, as before), and nothing else of it changes.
// THE LAW OF PIGMENT AT BLUE DUSK (typed once here, where the rose dabs take their roles, in ROSE below, and once at the
//   head of the part file, where the hour's rows stand and where it is said for which editions each row holds). In the
//   blue-dusk hour (the table's DUSK row, which the last front brings from z 770) vermilion and salmon are held by the
//   rose arches, their doubles, the ladder and the opening; lemon also rims crowns, reeds and the low sky, and the raft
//   flowers keep their dabs; each rose arch is one mass in three value shapes by each dab's own place on its hoop.
//   (The late-year edition writes its own foliage row, lemon and vermilion, so there the banks are warm at dusk too.)
//   THE THREE VALUE SHAPES. A rose dab's role and its occlusion are taken from its own place. off is its metres outside
//   its hoop's line (the 9 m half circle 1.6 m over the water, and its two feet), the border made ragged by up to
//   ROSE.RAG / 2 (0.45 m) either way by a hash of the dab's place:
//   THE SOFFIT, off under ROSE.IN (-0.9 m, the inside of the ring): rose six in ten, leaf four in ten, all at occlusion
//     1, which is always the shade pigment (the rose's madder, the leaf's violet);
//   THE BODY, off from ROSE.IN to ROSE.OUT (0.75 m): rose 86 in 100, lemon rim 14 in 100, at occlusion -0.5 (light:
//     the rose's cut vermilion and salmon);
//   THE CREST, off over ROSE.OUT: lemon rim with a chance that rises smoothly with the dab's height from none at the
//     hoop's centre height plus ROSE.Y0 (0.15) of its radius to ROSE.CREST (0.55) at centre height plus ROSE.Y1 (0.6)
//     of its radius and above, rose otherwise, at occlusion -0.5: no step at one height;
//   THE LEGS AND FEET, off over ROSE.OUT under that height: rose, at occlusion -0.5 (the same rule: there the chance
//     of lemon is none).
//   This holds for the three arches on every seed, in every edition and in every hour (the arches are in view from the
//   sunset stretch on); the doubles follow by themselves (reflectInto keeps a rose's and a rim's occlusion and lays leaf
//   in its shade). Occlusion -0.5 is the light pigment under the sunset's and the dusk's light for every rose dab as
//   built: their normals lean back toward the light (only the passing cloud's shadow turns such a dab to its shade, as
//   it turns every touch). No dab is added,
//   moved, turned or resized. It reads the dab's own place, which the seed's deal has
//   given it, and nothing else: not the eye, the lens, the clock, a seed's number or a still. No number is drawn for
//   it, and the number or numbers by which the roles were dealt before are still drawn and thrown away, so both streams
//   run as they did and the rafts, the ladder, the town, the swallows and the bridge stand where they stood.
//   THE LADDER is what it was: 170 level dashes on the outflow before the last arch, six in ten in the raft flowers'
//   role, four in ten lemon.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import { buildHero, makeStyle, PALETTE, ROLE, HOUR, KIND, BRK, TouchBatch, FormBatch } from '../parts/same-field-every-hour.js';

const STREAM_Y = 6, BRIDGE_Z = 400;
// the laws of place, in metres (said in the open at the head of this file)
const HEM = { CLEAR: 2.2, PART: 3.3, EASE: 1.5, SINK: 4, POND: 2.5, SLUICE: 0.8, SCAL: 0.6, RAG: 1.0, MIN: 1.1, STUB: 0.4, SPAN: 21, RACE: 0.4, RMIN: 0.7 };
const BERTH = { MOORED: 4.3, ADRIFT: 5.2 };
// the stubble's shade: the share (over the deal's density) and its two bounds; in the fine band the share holds to NEAR m
// of dealt offset from the flown line and is KERB times itself from FAR m, never over TOP; in both bands the share so
// found is itself up to z Z0 and falls to END times itself at z Z1 and beyond; OCC is a shade dash's occlusion; LIE is how far
// either way of a dash's place the drawn ground's rise is taken; LIFT is how far a level dash's middle stands over the drawn ground
const STUB = { SHARE: 0.36, LO: 0.28, HI: 0.5, NEAR: 4, FAR: 7, KERB: 2.2, TOP: 0.8, Z0: 82, Z1: 110, END: 0.35, OCC: 0.6, LIE: 0.5, LIFT: 0.06 };
// THE LAW OF PIGMENT AT BLUE DUSK, the rose arches' three value shapes (said in the open at the head of this file): a
// dab's metres outside its hoop's line are ragged by RAG / 2 either way; under IN is the soffit (rose SOFT in 1, else
// leaf; occlusion SHADE), from IN to OUT the body (rose BODY in 1, else rim; occlusion LIGHT), over OUT the crest and the
// legs (rim with a chance of CREST times a smooth rise from centre height + Y0 radii to centre height + Y1 radii, else
// rose; occlusion LIGHT)
const ROSE = { RAG: 0.9, IN: -0.9, OUT: 0.75, SOFT: 0.6, BODY: 0.86, Y0: 0.15, Y1: 0.6, CREST: 0.55, SHADE: 1, LIGHT: -0.5 };
// a hash of a place (whole numbers only, so it is the same on every machine): 0 to 1
const hemHash = (x, z) => { let h = Math.imul(Math.round(x * 64) | 0, 374761393) ^ Math.imul(Math.round(z * 64) | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// a hash of a place in three numbers, with a salt (whole numbers only; each number is taken as the batch holds it, in
// single precision, so that the hash can be found again from a built touch): 0 to 1
const placeHash = (x, y, z, salt) => {
  let h = Math.imul(Math.round(Math.fround(x) * 64) | 0, 374761393) ^ Math.imul(Math.round(Math.fround(y) * 64) | 0, 1103515245) ^ Math.imul(Math.round(Math.fround(z) * 64) | 0, 668265263) ^ Math.imul(salt | 0, 1540483477);
  h = Math.imul(h ^ (h >>> 16), 73244475); h = Math.imul(h ^ (h >>> 15), 739982445); h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// centreline of the water system as x(z): the stream comes in from port, joins the course at z 165, makes its S of two
// bends, falls at the sluice (z 300) into the pond, and from z 640 the pond and its outflow turn 25 degrees to port.
const CZ = [-260, -120, 0, 75, 128, 165, 198, 228, 255, 280, 300, 335, 480, 630, 664, 700, 800, 966, 1200];
const CX = [240, 176, 120, 72, 38, 22, 24, 4, -18, -12, 0, 0, 0, 0, 5, 19, 65.6, 143, 252];
function centreX(z) {
  let i = 1; while (i < CZ.length - 2 && z > CZ[i]) i++;
  i = Math.max(1, i); const i0 = i - 1, i1 = i, im = Math.max(0, i0 - 1), ip = Math.min(CZ.length - 1, i1 + 1);
  const h = CZ[i1] - CZ[i0], t = clamp((z - CZ[i0]) / h, -1, 2);
  const m0 = (CX[i1] - CX[im]) / (CZ[i1] - CZ[im]) * h, m1 = (CX[ip] - CX[i0]) / (CZ[ip] - CZ[i0]) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * CX[i0] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * CX[i1] + (t3 - t2) * m1;
}
// half width of the water: the stream is 14 m wide, the bridge basin 34 m, the pond 130 m, the outflow 44 m
function halfWidth(z) {
  if (z < 300) return 7;
  let w = lerp(7, 34, sstep(300, 340, z));
  w = lerp(w, 65, sstep(410, 470, z));
  w = lerp(w, 22, sstep(770, 880, z));
  return lerp(w, 170, sstep(978, 1050, z));                                // and opens into the lake before the town
}
// ground height. Field: stubble rising 3 degrees toward the hedge; stream banks; pond banks. Under the pond it is < 0.
function groundAt(x, z) {
  const cx = centreX(z), d = Math.abs(x - cx), stb = x < cx;
  // stream country (z < 300)
  const dw = d - 7;
  let hs = STREAM_Y - 0.9 + sstep(-1.5, 4, dw) * 1.9;                        // bank lip 1 m over the water
  const rise = 0.052 * clamp(z + 40, 0, 190) * sstep(10, 70, dw) * (stb ? 1 : 0.55);
  hs += 0.5 * sstep(4, 30, dw) + rise + (stb ? 0 : 5 * sstep(30, 160, dw));
  hs += 13 * Math.exp(-((x + 78) * (x + 78) + (z - 236) * (z - 236)) / 1500);   // the rise with the parasol figure, to starboard
  hs += 1.1 * Math.sin(x * 0.021 + 1.3) * Math.sin(z * 0.017) * sstep(20, 80, dw);
  // pond country (z > 316)
  const dp = d - halfWidth(z);
  let hp = -1.2 + sstep(-2, 6, dp) * 2.6 + 3.2 * sstep(6, 40, dp) + 9 * sstep(40, 260, dp);
  hp += 0.8 * Math.sin(x * 0.05) * Math.sin(z * 0.043) * sstep(4, 30, dp);
  return lerp(hs, hp, sstep(299, 315, z));
}

export default {
  id: 'same-field-every-hour',
  name: 'The Same Field Every Hour',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Claude Monet, 1840 to 1926',
  weirdness: 0.3,
  media: ['air', 'water', 'open'],

  async build(ctx) {
    const rng = ctx.rng, Y = () => ctx.yield();
    const rng2 = makeRng(hashSeed('same-field-every-hour:second:' + (ctx.seed ?? 0)));   // a stream of its own for what was added later
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // ---- the edition (what kind of day), the cast
    const hourWish = vary.hour || 'any';
    const edition = hourWish === 'dawn' ? 'grey' : hourWish === 'golden' ? 'late' : hourWish === 'night' ? 'dusk' : hourWish === 'day' ? 'clear'
      : rng.pick(['clear', 'clear', 'grey', 'late', 'dusk']);
    const rare = !!vary.rare;                                   // the fog lifting
    const threeStacks = rng.chance(0.6), boatAdrift = rng.chance(0.4);
    const style = makeStyle(PALETTE, edition);
    const U = style.uniforms;
    U.uCourse.value.set(0, 1, 0, 0.9);
    scene.background = new THREE.Color().setRGB(...style.pigments.table[HOUR.DAWN][ROLE.AIR][0], THREE.SRGBColorSpace);

    // ---- the path: 1,000 m. Field at 2 m, over the hedge, the stream at 1.5 m, the sluice, under the bridge at 4.5 m,
    // the pond at 1.5 m, the bend to port round the island, and the last 130 m dead straight and level into the third arch.
    const P = [];
    const fieldEye = (x, z) => groundAt(x, z) + 2.0;
    P.push([0, fieldEye(0, 0), 0], [0, fieldEye(0, 30), 30], [0, fieldEye(0, 62), 62], [1.5, fieldEye(1.5, 95) + 0.4, 95],
      [9, fieldEye(9, 126) + 2.2, 126], [17.5, STREAM_Y + 4.6, 148]);
    for (const z of [170, 198, 228, 255, 280]) P.push([centreX(z), STREAM_Y + 1.5, z]);
    P.push([0, STREAM_Y + 1.7, 299], [0, 4.4, 318], [0, 2.0, 338], [0, 2.5, 362], [0, 3.6, 382], [0, 4.5, 400], [0, 4.2, 414],
      [0, 2.8, 445], [0, 1.6, 482], [0, 1.5, 560], [0, 1.6, 620]);
    for (const z of [664, 700, 750, 800]) P.push([centreX(z), lerp(1.8, 4.2, sstep(650, 800, z)), z]);
    const END = new THREE.Vector3(143, 5, 966), EDIR = new THREE.Vector3(Math.sin(25 * Math.PI / 180), 0, Math.cos(25 * Math.PI / 180));
    for (const back of [130, 90, 45, 0]) P.push([END.x - EDIR.x * back, back > 100 ? 4.7 : 5, END.z - EDIR.z * back]);
    const path = makePath(P);
    await Y();
    const L = path.length;
    // u of the places the day is keyed to (found once along the path by z)
    const uAtZ = (z) => { let lo = 0, hi = 1; const v = new THREE.Vector3(); for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; path.pointAt(m, v); if (v.z < z) lo = m; else hi = m; } return (lo + hi) / 2; };

    // the rowboat's berth, the brief's own place: moored with its keel 4.3 m to port of the course at d 610 (read as z, as the
    // stacks, the bridge and the day's fronts are), so we pass the boat and then go under the island's willow at z 644
    // (adrift it lies further to port, BERTH.ADRIFT, so that its swing stays clear of the flown line; MOOR is the moored
    // berth's own place, which the rafts and pads keep clear as they always did)
    const BOAT = { x: 0, z: 0, yaw: 0 }, MOOR = { x: 0, z: 0 };
    { const dB = uAtZ(610) * L, bp = path.posAtDist(dB, new THREE.Vector3()), bt = path.tangentAtDist(dB, new THREE.Vector3()), off = boatAdrift ? BERTH.ADRIFT : BERTH.MOORED;
      MOOR.x = bp.x + bt.z * BERTH.MOORED; MOOR.z = bp.z - bt.x * BERTH.MOORED; BOAT.x = boatAdrift ? bp.x + bt.z * off : MOOR.x; BOAT.z = boatAdrift ? bp.z - bt.x * off : MOOR.z; BOAT.yaw = Math.atan2(bt.x, bt.z) + Math.PI / 2 + rng.range(0.25, 0.5) * (boatAdrift ? -1 : 1); }
    // ---- THE HEM LAW's table of the flown line: a place every 0.5 m of route, kept by whole metre of z (the line runs one way in z)
    const LINE = new Map(); let lineTop = -1e9;
    { const v = new THREE.Vector3(); for (let d = 0; d <= L; d += 0.5) { path.posAtDist(d, v); const k = Math.floor(v.z); let a = LINE.get(k); if (!a) LINE.set(k, a = []); a.push(v.x, v.y, v.z); if (v.z > 225 && v.y > lineTop) lineTop = v.y; } }
    // a quick and exact "nowhere near": the line's reach in x over the whole metres of z that can hold a place of the line
    // within HEM.PART + HEM.EASE (4.8 m) level of a place in this metre (five metres either side)
    const LBOX = new Map(), LNEAR = HEM.PART + HEM.EASE, LK = Math.ceil(LNEAR);
    for (const [k, a] of LINE) { let x0 = 1e9, x1 = -1e9; for (let i = 0; i < a.length; i += 3) { if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i]; }
      for (let j = k - LK; j <= k + LK; j++) { const b = LBOX.get(j); if (!b) LBOX.set(j, [x0, x1]); else { if (x0 < b[0]) b[0] = x0; if (x1 > b[1]) b[1] = x1; } } }
    // the least level distance from a place to the flown line, and the line's greatest height within 0.6 m more than that
    // (a place further than 4.8 m from the line is told only that: its distance is given as 1e9)
    const LAT = [0, 0], LBK = [];
    const lineAt = (x, z) => {
      const k0 = Math.floor(z), b = LBOX.get(k0); let s = 1e9, y = -1e9;
      if (!b || x < b[0] - LNEAR || x > b[1] + LNEAR) { LAT[0] = s; LAT[1] = y; return LAT; }
      let nb = 0, m2 = 1e18;                                       // (squares first, to spare the roots: the distance itself is still Math.hypot's)
      for (let k = k0 - HEM.SPAN; k <= k0 + HEM.SPAN; k++) { const a = LINE.get(k); if (a) { LBK[nb++] = a; for (let i = 0; i < a.length; i += 3) { const ex = a[i] - x, ez = a[i + 2] - z, q = ex * ex + ez * ez; if (q < m2) m2 = q; } } }
      if (m2 >= (LNEAR + 0.01) * (LNEAR + 0.01)) { LAT[0] = s; LAT[1] = y; return LAT; }
      const lim = m2 * 1.000001 + 1e-12;
      for (let j = 0; j < nb; j++) { const a = LBK[j]; for (let i = 0; i < a.length; i += 3) { const ex = a[i] - x, ez = a[i + 2] - z; if (ex * ex + ez * ez <= lim) { const q = Math.hypot(ex, ez); if (q < s) s = q; } } }
      if (s < LNEAR) { const r = s + 0.6, r2 = r * r * 1.000001 + 1e-12; for (let j = 0; j < nb; j++) { const a = LBK[j]; for (let i = 0; i < a.length; i += 3) if (a[i + 1] > y) { const ex = a[i] - x, ez = a[i + 2] - z; if (ex * ex + ez * ez <= r2 && Math.hypot(ex, ez) <= r) y = a[i + 1]; } } }
      LAT[0] = s; LAT[1] = y; return LAT;
    };
    // the lift over the line at a place: the lowest a hanging drag may end there (-Infinity where the lift asks nothing)
    const liftAt = (x, z) => {
      const q = lineAt(x, z), s = q[0]; if (s >= HEM.PART + HEM.EASE) return -Infinity;
      const top = q[1] + HEM.CLEAR; return s <= HEM.PART ? top : lerp(top, (z < 300 ? STREAM_Y : 0) - HEM.SINK, sstep(HEM.PART, HEM.PART + HEM.EASE, s));
    };
    // the curtains' own hem at a place: so high above their water, with a slow scallop along the hem
    const curtainHem = (x, z) => (z < 300 ? STREAM_Y + HEM.SLUICE : HEM.POND) + HEM.SCAL * (1 + Math.sin(x * 0.84 + 0.35 * Math.sin(x * 0.23 + z * 0.3) + z * 0.11));
    const liftCap = lineTop + HEM.CLEAR + HEM.RAG, kDraw = detail < 1 ? 1 / Math.sqrt(detail) : 1;   // (TouchBatch.add draws a thinned touch this much longer)
    // THE CUT. A drag as it would be laid: its middle hangs tm down its strand from height ay, len long (kDraw times that
    // as drawn); pose(tm, P) gives its middle's place and its slope there (P = [x, z, slope x, slope z]); floorAt(x, z) is
    // its strand's floor. Returns 0 = lay it as it is, 1 = lay it shortened (CUT.tm, CUT.len: its top stays, it ends on the
    // floor), -1 = leave it out (under HEM.MIN of room).
    const CUT = { tm: 0, len: 0 }, PZ = [0, 0, 0, 0];
    const hemCut = (ay, tm, len, pose, floorAt) => {
      pose(tm, PZ); let c = 1 / Math.hypot(PZ[2], 1, PZ[3]), half = len * kDraw * 0.5;
      const yTop = ay - tm + c * half; let fl = floorAt(PZ[0] + PZ[2] * c * half, PZ[1] + PZ[3] * c * half);
      if (ay - tm - c * half >= fl) return 0;
      let room = 0, tn = tm;
      for (let i = 0; i < 4; i++) {                                // the end's place moves a little as the drag shortens: the floor is taken again there (it only rises)
        if (yTop <= fl) return -1;
        tn = ay - (yTop + fl) * 0.5; pose(tn, PZ); c = 1 / Math.hypot(PZ[2], 1, PZ[3]); room = (yTop - fl) / c;
        const f2 = floorAt(PZ[0] + PZ[2] * c * room * 0.5, PZ[1] + PZ[3] * c * room * 0.5);
        if (f2 <= fl + 1e-4) break; fl = f2;
      }
      if (room < HEM.MIN) return -1;
      CUT.tm = tn; CUT.len = room / kDraw; return 1;
    };
    // the pond's doubles are copied from what is laid (reflectInto, one rng2 number each): what the law changes is counted
    // here, so that the second stream can be kept in step. seed = the number add() drew (or the one drawn and thrown away).
    const DBL = { lost: 0, made: [], every: 3.0 / Math.max(detail, 0.6) };
    const dblCount = (T, seed, yLive, yNow, at) => {
      if (T !== TP || ((Math.fround(seed) * 53.7) % 1) * DBL.every > 1) return;
      const was = Math.fround(yLive) >= 0.05, is = yNow !== null && Math.fround(yNow) >= 0.05;
      if (was && !is) DBL.lost++; else if (is && !was) DBL.made.push(at);
    };
    // THE HEM LAW (6): what has been laid into RP since this was last called is held in the water, wherever it lies.
    // A double as it is drawn: RP is made at detail 1, so add() lengthens nothing and the double's length is the number it
    // holds (A[o + 3]); the vertex shader lays it about its middle (A[o + 1], under the water) along (0.3 dx, 1, 0.3 dz),
    // nearly upright; a hanging one's swing tilts it a little either way, and its sway moves it sideways only. Its half
    // height is therefore taken as half its length, the most it can stand upright, and its upper end as its middle plus
    // that. (What the shader adds by the eye's distance, the growth of every touch more than 60 m off and its floor of
    // a few pixels, is the air's and is not counted here: a double seen from further off than 60 m is drawn longer about
    // its middle, its upper end over the water again by that growth.) Only the double's own place and the table of the
    // flown line are read (the line only for which least length holds: HEM.MIN beside it, HEM.STUB beyond); no number is
    // drawn; those kept keep their order.
    let dblFrom = 0;
    const dblHem = () => {
      const A = RP.A; let w = dblFrom;
      for (let i = dblFrom; i < RP.n; i++) {
        const o = i * 16;
        if (A[o + 1] + A[o + 3] * 0.5 > 0) {
          const room = A[o + 3] * 0.5 - A[o + 1];                  // from its lower end up to the water
          if (room < (lineAt(A[o], A[o + 2])[0] < LNEAR ? HEM.MIN : HEM.STUB)) continue;   // left out: too little of it would be left (beside the line under HEM.MIN, beyond it under HEM.STUB)
          A[o + 3] = room; A[o + 1] = -A[o + 3] * 0.5;             // shortened from the top: its upper end lies on the water
        }
        if (w !== i) A.copyWithin(w * 16, o, o + 16);
        w++;
      }
      RP.n = dblFrom = w;
    };
    // ---- batches. Touches are split by stretch of the valley so each mesh can be culled when it is behind us.
    const tb = () => new TouchBatch(rng, detail, 16384);
    const TF = tb(), TS = tb(), TL = tb(), TP = tb(), TE = tb(), TFar = tb();     // field, stream, sluice, pond, exit, far
    const RP = new TouchBatch(rng2, 1, 16384);                     // pond reflections (below y = 0)
    const GT = new FormBatch(), G = new FormBatch(), FW = new FormBatch(), SKY = new FormBatch();   // ground and solid forms; stream water; sky dome
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const corridor = (x, y, z) => path.distanceTo(x, y, z);

    // ---- the ground under-form: rows across the valley, columns hugging the water's edge. Each quad has one role.
    // z of the hedge that parts the frost field from the poppy meadow, for a point to starboard of the stream
    const hedgeZ = (x) => 152 + Math.max(0, 6 - x) * 0.115;
    const inField = (x, z) => x < centreX(z) - 16 && z < hedgeZ(x);
    const EDGE = [-2.5, -0.5, 1.5, 4, 7, 11, 16, 22, 30, 40, 52, 66, 84, 108, 140, 190, 260, 360, 520];
    // THE DRAWN GROUND, kept for the stubble: of the rows that can hold field (those whose z0 is short of the hedge at the
    // row's far starboard corner; they are the first rows, one after another) the lines' z, and of each line's corners
    // from the far starboard edge to the water's centre (nc of them) the x and the height: the mesh's own numbers
    const DRAWN = { nc: EDGE.length + 1, rows: 0, Z: [], X: [], H: [] };
    {
      const col = (z) => { const cx = centreX(z), hw = halfWidth(z), xs = []; for (let k = EDGE.length - 1; k >= 0; k--) xs.push(cx - hw - EDGE[k]); xs.push(cx); for (const e of EDGE) xs.push(cx + hw + e); return xs; };
      const nrm = (x, z) => { const e = 1.5, hx = groundAt(x + e, z) - groundAt(x - e, z), hz = groundAt(x, z + e) - groundAt(x, z - e), il = 1 / Math.hypot(hx, 2 * e, hz); return [-hx * il, 2 * e * il, -hz * il]; };
      let z0 = -210, xs0 = col(z0), row = 0;
      while (z0 < 1180) {
        const dz = z0 > 280 && z0 < 345 ? 2.5 : 5, z1 = z0 + dz, xs1 = col(z1);
        const keep = row === DRAWN.rows && z0 < hedgeZ(Math.min(xs0[0], xs1[0])), o0 = row * DRAWN.nc;
        if (keep) { DRAWN.rows++; DRAWN.Z[row] = z0; DRAWN.Z[row + 1] = z1; for (let k = 0; k < DRAWN.nc; k++) { DRAWN.X[o0 + k] = xs0[k]; DRAWN.X[o0 + DRAWN.nc + k] = xs1[k]; } }
        for (let k = 0; k < xs0.length - 1; k++) {
          const c = [[xs0[k], z0], [xs0[k + 1], z0], [xs1[k + 1], z1], [xs1[k], z1]], hgt = c.map((q) => groundAt(q[0], q[1]));
          if (keep && k < DRAWN.nc - 1) { const o = o0 + k; DRAWN.H[o] = hgt[0]; DRAWN.H[o + 1] = hgt[1]; DRAWN.H[o + DRAWN.nc + 1] = hgt[2]; DRAWN.H[o + DRAWN.nc] = hgt[3]; }
          if (z0 > 316 && hgt.every((h) => h < -0.05)) continue;
          if (z1 <= 300 && hgt.every((h) => h < STREAM_Y - 0.12)) continue;        // nor has the stream: its doubles show through it                      // the pond has no bed: the water is sky
          const mx = (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4, mz = (z0 + z1) / 2;
          const field = inField(mx, mz), role = field ? ROLE.STUBBLE : ROLE.GRASS;
          const ids = c.map((q, j) => { const n = nrm(q[0], q[1]); return GT.vert(q[0], z0 > 316 ? Math.max(hgt[j], -0.05) : hgt[j], q[1], n[0], n[1], n[2], q[1], q[0], role, field ? -0.25 : -0.1); });
          GT.quad(ids[0], ids[3], ids[2], ids[1]);
        }
        z0 = z1; xs0 = xs1;
        if (++row % 10 === 0) await Y();
      }
    }
    // the height of the DRAWN ground at a place: that of the valley mesh's own flat triangle there. A quad of row j lies
    // between the lines j and j + 1 and the corners k and k + 1; GT.quad(ids[0], ids[3], ids[2], ids[1]) splits it along the
    // diagonal from its corner (line j, k) to its corner (line j + 1, k + 1). A place on a line of z is given to the row
    // ahead, on a column's edge to the quad to port, on the diagonal to the triangle to starboard: the surface is one sheet,
    // so either side gives the same height. Off what is kept (no field lies there) it is groundAt.
    const drawnAt = (x, z) => {
      const Z = DRAWN.Z, X = DRAWN.X, H = DRAWN.H, nc = DRAWN.nc, last = DRAWN.rows - 1;
      let j = Math.min(last, Math.max(0, Math.floor((z - Z[0]) / (Z[1] - Z[0]))));
      while (j > 0 && z < Z[j]) j--; while (j < last && z >= Z[j + 1]) j++;
      const t = (z - Z[j]) / (Z[j + 1] - Z[j]), a = j * nc, b = a + nc;
      if (!(t >= 0 && t <= 1) || x < X[a] + (X[b] - X[a]) * t || x > X[b - 1] + (X[b + nc - 1] - X[b - 1]) * t) return groundAt(x, z);
      let k = nc - 2; while (k > 0 && x < X[a + k] + (X[b + k] - X[a + k]) * t) k--;
      const xl = X[a + k] + (X[b + k] - X[a + k]) * t, w1 = X[b + k + 1] - X[b + k];
      if (x - xl <= t * w1) return H[a + k] + t * (H[b + k] - H[a + k]) + (x - xl) * (H[b + k + 1] - H[b + k]) / w1;   // to starboard of the diagonal: corners (j, k), (j + 1, k), (j + 1, k + 1)
      const xr = X[a + k + 1] + (X[b + k + 1] - X[a + k + 1]) * t;
      return H[a + k + 1] + t * (H[b + k + 1] - H[a + k + 1]) + (x - xr) * (H[a + k + 1] - H[a + k]) / (X[a + k + 1] - X[a + k]);   // to port of it: corners (j, k), (j + 1, k + 1), (j, k + 1)
    };
    await Y();
    // ---- the stream: a ribbon of level dashes (u runs across the stream, alternate rows slide) from far upstream to the weir
    {
      let prev = null, s = 0;
      for (let z = -260; z <= 300.01; z += 4) {
        const cx = centreX(z), tx = centreX(z + 1) - centreX(z - 1), il = 1 / Math.hypot(tx, 2), nx = 2 * il, nz = -tx * il;   // across
        const hw = 8.2, a = FW.vert(cx - nx * hw, STREAM_Y, z - nz * hw, 0, 1, 0, -hw, s, ROLE.WATER, -0.5), b = FW.vert(cx + nx * hw, STREAM_Y, z + nz * hw, 0, 1, 0, hw, s, ROLE.WATER, -0.5);
        if (prev) FW.quad(prev[0], prev[1], b, a);
        prev = [a, b]; s += 4 / Math.max(nx, 0.3);
      }
    }
    // ---- the sky: a dome of level scumbled touches that follows the eye. Under-form in three ragged bands; the cloud
    // touches and the lemon strip are real touches on the dome (never a gradient, never a sun disc).
    const skyGroup = new THREE.Group(); skyGroup.name = 'sky';
    const SR = 100, TSky = new TouchBatch(rng, 1, 2048);
    {
      const els = [-90, -30, -8, -1, 5, 11, 16, 24, 36, 54, 90], SEG = 40, rows = [];
      for (let j = 0; j < els.length; j++) {
        const rowv = [];
        for (let k = 0; k <= SEG; k++) {
          const az = (k / SEG) * Math.PI * 2, wob = j > 2 && j < 9 ? (rng() - 0.5) * 3.5 : 0, el = (els[j] + wob) * Math.PI / 180;
          rowv.push([-Math.sin(az) * Math.cos(el) * SR, Math.sin(el) * SR, -Math.cos(az) * Math.cos(el) * SR, az * SR * 0.6, el * SR]);
        }
        rowv[SEG][0] = rowv[0][0]; rowv[SEG][1] = rowv[0][1]; rowv[SEG][2] = rowv[0][2];
        rows.push(rowv);
      }
      for (let j = 0; j < els.length - 1; j++) for (let k = 0; k < SEG; k++) {
        const mid = (els[j] + els[j + 1]) / 2, role = mid < -4 ? ROLE.AIR : mid < 12 ? ROLE.SKY_LOW : ROLE.SKY_HIGH;
        const q = [rows[j][k], rows[j][k + 1], rows[j + 1][k + 1], rows[j + 1][k]];
        const ids = q.map((p) => SKY.vert(p[0], p[1], p[2], -p[0] / SR, -p[1] / SR, -p[2] / SR, p[3] + (k === SEG - 1 && p === q[1] || k === SEG - 1 && p === q[2] ? 0 : 0), p[4], role, -1));
        SKY.quad(ids[0], ids[3], ids[2], ids[1]);
      }
      // level touches: lemon and salmon low ahead and to port, cloud touches above, a few high-sky scumbles
      const nSky = Math.round(900 * Math.max(detail, 0.8));
      for (let i = 0; i < nSky; i++) {
        const az = rng() * Math.PI * 2, t = rng(), el = (1 + 44 * t * t) * Math.PI / 180;
        const ahead = Math.cos(az - 0.35) * 0.5 + 0.5;                                    // 0 behind .. 1 ahead and a little to port
        const role = el < 0.2 ? (rng.chance(0.12 * ahead) ? ROLE.RIM : rng.chance(0.3 + 0.5 * ahead) ? ROLE.SKY_LOW : ROLE.CLOUD) : rng.chance(0.5) ? ROLE.CLOUD : rng.chance(0.4) ? ROLE.SKY_LOW : ROLE.SKY_HIGH;
        const x = Math.sin(az) * Math.cos(el), y = Math.sin(el), z = Math.cos(az) * Math.cos(el), len = rng.range(7, 13) * (role === ROLE.CLOUD ? 1.3 : 1);
        TSky.add(x * (SR - 2), y * (SR - 2), z * (SR - 2), Math.cos(az), rng.range(-0.06, 0.06), -Math.sin(az), -x, -y - 0.9, -z, len, len * rng.range(0.2, 0.3), role, role === ROLE.CLOUD ? rng.range(-0.6, 0.3) : -1, KIND.STREAK, 0, false);
      }
    }
    await Y();
    // ---- far hills, 260 m high and 1.5 km off: two ragged ridges of pale touches ringing the valley
    const HILLS = new FormBatch();
    {
      const n2 = (a, b) => ctx.noise.fbm2(a, b, 3);
      for (const ring of [{ r: 1750, h: 260, c: 0.0 }, { r: 1250, h: 150, c: 3.1 }]) {
        const SEG = 72; let prev = null;
        for (let k = 0; k <= SEG; k++) {
          const az = (k / SEG) * Math.PI * 2, ca = Math.sin(az), sa = Math.cos(az), kk = k % SEG;
          const hgt = ring.h * (0.45 + 0.55 * (0.5 + 0.5 * n2(Math.sin(az) * 2.2 + ring.c, Math.cos(az) * 2.2))) * (0.6 + 0.4 * sstep(-0.9, 0.2, -Math.abs(sa) + 0.4 + Math.abs(ca)));
          const x = ca * ring.r, z = 450 + sa * ring.r, lean = 0.75;
          const a = HILLS.vert(x * 1.12, -4, 450 + sa * ring.r * 1.12, -ca * lean, 0.66, -sa * lean, kk * 150, 0, ROLE.HILL, -0.2), b = HILLS.vert(x, hgt, z, -ca * lean, 0.66, -sa * lean, kk * 150, hgt * 1.3, ROLE.HILL, -0.2);
          if (prev) HILLS.quad(prev[0], a, b, prev[1]);
          prev = [a, b];
          for (let j = 0; j < 5; j++) {                                                    // 5 m touches and far larger raking down the slopes
            const f = rng.range(0.2, 1.02), jz = rng.range(-70, 70), len = rng.range(40, 70);
            TFar.add(x * (1.12 - 0.12 * f) - sa * jz, hgt * f, 450 + sa * ring.r * (1.12 - 0.12 * f) + ca * jz, -sa, rng.range(-0.3, 0.3), ca, -ca * lean, 0.66, -sa * lean, len, len * 0.22, ROLE.HILL, rng.chance(0.4) ? 0.5 : -0.3, KIND.STREAK, 0, false);
          }
        }
      }
    }
    await Y();

    // ---- the frost field: grainstacks against the light, their shadows reaching toward us, stubble under the eye
    const LIGHTS = {                                              // direction TO the light, by hour (east is ahead)
      [HOUR.DAWN]: V3(0.26, 0.2, 0.94).normalize(), [HOUR.MORNING]: V3(0.34, 0.42, 0.84).normalize(), [HOUR.NOON]: V3(-0.38, 0.8, 0.46).normalize(),
      [HOUR.SUNSET]: V3(-0.3, 0.3, -0.9).normalize(), [HOUR.DUSK]: V3(-0.2, 0.55, -0.8).normalize(),
    };
    const stacks = [{ x: 13.5, z: 55, r: 7, h: 15 }, { x: -27, z: 106, r: 7, h: 15.5 }];
    if (threeStacks) stacks.push({ x: -66, z: 150, r: 6.6, h: 14.5 });
    for (const s of stacks) s.y = groundAt(s.x, s.z) - 0.3;
    const noShadows = edition === 'grey';
    stacks.forEach((st, i) => { U.uCast.value[i].set(st.x, st.z, st.r, st.h); U.uCastY.value.setComponent(i, st.y); }); U.uCastOn.value = noShadows ? 0 : 1;
    for (let si = 0; si < stacks.length; si++) {
      const s = stacks[si], eave = s.h * 0.47, SEG = 20;
      const prof = [[s.r * 0.96, -0.2], [s.r * 1.02, eave * 0.5], [s.r * 1.08, eave], [s.r * 0.74, eave + (s.h - eave) * 0.36], [s.r * 0.36, eave + (s.h - eave) * 0.74], [0.05, s.h]];
      let prev = null;
      for (let j = 0; j < prof.length; j++) {
        const [r, y] = prof[j], cap = j >= 2, row = [], ny = cap ? 0.62 : 0.05;
        for (let k = 0; k <= SEG; k++) { const th = (k / SEG) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th); row.push(G.vert(s.x + c * r, s.y + y, s.z + sn * r, c, ny, sn, y * 1.2 + (cap ? r : 0), th * s.r, ROLE.STACK, cap ? -0.05 : 0.08)); }
        if (prev) for (let k = 0; k < SEG; k++) G.quad(prev[k], row[k], row[k + 1], prev[k + 1]);
        prev = row;
      }
      // thatch: raked down the cap, near-upright on the drum, the eave fringe overrunning the outline
      const near = si === 0, n = Math.round((near ? 4200 : 2400) * density);
      for (let i = 0; i < n; i++) {
        const th = rng() * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), q = rng(), sz = near ? rng.range(0.5, 0.95) : rng.range(0.8, 1.5);
        if (q < 0.52) {                                           // cap
          const t = Math.sqrt(rng()), r = s.r * 1.1 * t + 0.1, y = s.h - (s.h - eave) * (t * t * 0.4 + t * 0.6), sl = (s.h - eave) / (s.r * 1.1);
          TF.add(s.x + c * r, s.y + y + 0.05, s.z + sn * r, c + rng.range(-0.25, 0.25), -sl * 0.9, sn + rng.range(-0.25, 0.25), c * 0.75, 0.66, sn * 0.75, sz * 1.15, sz * 0.22, edition === 'late' && rng.chance(0.78) ? ROLE.FROST : rng.chance(0.07) ? ROLE.RIM : ROLE.STACK, t > 0.9 ? -0.1 : 0);
        } else {                                                  // drum
          const y = rng.range(0, eave), r = s.r * (0.97 + 0.11 * y / eave) + 0.04, w = rng.range(-0.35, 0.35);
          TF.add(s.x + c * r, s.y + y, s.z + sn * r, -sn * w, 1, c * w, c, 0.05, sn, sz, sz * 0.2, rng.chance(0.03) ? ROLE.RIM : ROLE.STACK, y > eave * 0.8 ? 0.3 : 0.05);
        }
        if (i % 300 === 0) await Y();
      }
    }
    await Y();
    // stubble: dashes laid flat on the drawn ground in rows along the course ("level dashes": they tilt with that ground) and short upright tufts, thick under the eye, larger further out
    {
      const v = new THREE.Vector3(), nNear = Math.round(15500 * density), nMid = Math.round(7500 * density);
      const share = clamp(STUB.SHARE / density, STUB.LO, STUB.HI);   // THE STUBBLE'S SHADE: the share of the level dashes that lie in shade, before the corridor's evening out and the thinning toward the hedge
      for (let i = 0; i < nNear + nMid; i++) {
        const near = i < nNear, d = rng.range(-28, 152), lat = near ? rng.range(-1, 1) * rng.range(2, 9.5) : rng.sign() * rng.range(8, 60);
        path.posAtDist(d, v); const x = v.x + lat, z = v.z + rng.range(-1, 1), frost = rng.chance(0.3);
        const big = near ? 1 : rng.range(2, 4.5), tuft = rng.chance(near ? 0.42 : 0.3);
        if (!inField(x, z)) continue;
        const y = drawnAt(x, z), shade = -0.5, role = frost ? ROLE.FROST : rng.chance(0.02) ? ROLE.RIM : ROLE.STUBBLE;
        if (tuft) { const h = rng.range(0.22, 0.42) * big, a = rng() * 6.283; TF.add(x, y + h * 0.42, z, rng.range(-0.3, 0.3), 1, rng.range(-0.3, 0.3), Math.cos(a), 0.2, -Math.abs(Math.sin(a)) - 0.2, h, h * rng.range(0.26, 0.36), role, shade, KIND.STREAK, 1.0); }
        else {                                                    // a level dash (flat on the drawn ground): in shade by a hash of its own place (never RIM); the share is evened out across the corridor by its dealt offset from the line (lat: the x dealt to it from the line's point at its dealt distance of route, not its least distance from the line) and thins toward the hedge by its own z
          const len = rng.range(0.45, 1.1) * big, thr = lerp(1, STUB.END, sstep(STUB.Z0, STUB.Z1, z)) * (near ? Math.min(STUB.TOP, share * lerp(1, STUB.KERB, sstep(STUB.NEAR, STUB.FAR, Math.abs(lat)))) : share);
          // it lies on its form, the DRAWN ground: that surface's rise to port (gx) and along the course (gz) at its own place give its direction's rise and its normal
          const e = STUB.LIE, gx = (drawnAt(x + e, z) - drawnAt(x - e, z)) / (2 * e), gz = (drawnAt(x, z + e) - drawnAt(x, z - e)) / (2 * e), jx = rng.range(-0.22, 0.22);
          TF.add(x, y + STUB.LIFT, z, jx, jx * gx + gz, 1, -gx, 1, -gz, len, len * rng.range(0.17, 0.25), role, role !== ROLE.RIM && hemHash(x, z) < thr ? STUB.OCC : shade);
        }
        if (i % 400 === 0) await Y();
      }
    }
    await Y();
    // the pollard hedge that parts the frost field from the poppy meadow: stub trunks, round heads of curled dabs
    {
      const pts = [];
      for (let z = -30; z < 146; z += 2.6) { const tx = centreX(z + 1) - centreX(z - 1), il = 1 / Math.hypot(tx, 2); pts.push([centreX(z) - 2 * il * 16.5, z + tx * il * 16.5]); }
      for (let x = pts[pts.length - 1][0] - 2.6; x > -330; x -= 2.6) pts.push([x, hedgeZ(x) + 2 * Math.sin(x * 0.05)]);
      let prev = null, s = 0;
      for (let i = 0; i < pts.length; i++) {
        const [x, z] = pts[i], dc = corridor(x, groundAt(x, z) + 2, z), gap = dc < 11, y = groundAt(x, z);
        const low = gap ? 0.3 : 1.5 + rng.range(0, 0.5);              // a low bank of shade under the pollards
        const a = G.vert(x, y - 0.3, z - 0.9, 0, 0.5, -0.8, s, 0, ROLE.FOLIAGE, 0.3), b = G.vert(x + rng.range(-0.3, 0.3), y + low, z + 0.3, 0, 0.8, -0.5, s, low + 1, ROLE.FOLIAGE, 0.3);
        if (prev) G.quad(prev[0], a, b, prev[1]);
        prev = [a, b]; s += 2.6;
        if (i % 30 === 0) await Y();
        if (gap || i % 2) continue;
        const hy = y + rng.range(2.6, 3.6), R = rng.range(1.5, 2.1), nh = dc < 60 ? 46 : 20, k = dc < 60 ? 1 : 1.5;
        for (let j = 0; j < 5; j++) TF.add(x + rng.range(-0.25, 0.25), y + 0.3 + j * 0.5, z - 0.3, 1, rng.range(-0.2, 0.2), 0, 0, 0.1, -1, 0.6, 0.3, rng.chance(0.5) ? ROLE.TRUNK : ROLE.DEEP, 0.3, KIND.STREAK, 0, false);
        for (let j = 0; j < nh; j++) {                               // a round head of curled dabs, frosted on top
          const th = rng() * 6.283, cph = rng.range(-0.35, 1), sph = Math.sqrt(1 - cph * cph), nx = Math.cos(th) * sph, nz = Math.sin(th) * sph, len = rng.range(0.7, 1.25) * k;
          TF.add(x + nx * R, hy + cph * R * 0.85, z + nz * R, rng.range(-0.6, 0.6), rng.range(0.2, 1), rng.range(-0.4, 0.4), nx, cph, nz, len, len * 0.3, cph > 0.55 && rng.chance(0.45) ? ROLE.FROST : rng.chance(0.15) ? ROLE.DEEP : ROLE.FOLIAGE, cph < 0 ? 0.3 : -0.05, KIND.CURL);
        }
      }
    }
    await Y();
    // farm roofs 300 m to port: salmon and violet lozenges of raked touches, no windows
    for (let i = 0; i < 5; i++) {
      const x = 285 + rng.range(-30, 70), z = 40 + i * 34 + rng.range(-8, 8), y = groundAt(x, z), w = rng.range(14, 24), dp = rng.range(8, 11), hw = rng.range(4.5, 6.5), hr = hw + rng.range(4, 7);
      const c = [[x, z - w / 2], [x, z + w / 2]];
      for (const sd of [-1, 1]) {                                 // two roof slopes and the wall under each
        const e0 = G.vert(x + sd * dp / 2, y + hw, c[0][1], sd * 0.6, 0.8, 0, 0, 0, ROLE.ROOF, 0), e1 = G.vert(x + sd * dp / 2, y + hw, c[1][1], sd * 0.6, 0.8, 0, 0, w, ROLE.ROOF, 0);
        const r0 = G.vert(x, y + hr, c[0][1], sd * 0.6, 0.8, 0, dp * 0.6, 0, ROLE.ROOF, 0), r1 = G.vert(x, y + hr, c[1][1], sd * 0.6, 0.8, 0, dp * 0.6, w, ROLE.ROOF, 0);
        G.quad(e0, e1, r1, r0);
        const b0 = G.vert(x + sd * dp / 2, y - 1, c[0][1], sd, 0, 0, 0, 0, ROLE.STONE, 0.1), b1 = G.vert(x + sd * dp / 2, y - 1, c[1][1], sd, 0, 0, 0, w, ROLE.STONE, 0.1);
        const t0 = G.vert(x + sd * dp / 2, y + hw, c[0][1], sd, 0, 0, hw, 0, ROLE.STONE, 0.1), t1 = G.vert(x + sd * dp / 2, y + hw, c[1][1], sd, 0, 0, hw, w, ROLE.STONE, 0.1);
        G.quad(b0, b1, t1, t0);
        for (let j = 0; j < 7; j++) TFar.add(x + sd * dp * rng.range(0.08, 0.45), y + lerp(hr, hw, rng()) , z + rng.range(-w / 2, w / 2), sd * 0.6, -0.5, rng.range(-0.2, 0.2), sd * 0.6, 0.8, 0, rng.range(4, 6), rng.range(1, 1.5), ROLE.ROOF, 0, KIND.STREAK, 0, false);
      }
      for (const g of [0, 1]) { const zz = c[g][1], nz = g ? 1 : -1; const a = G.vert(x - dp / 2, y - 1, zz, 0, 0, nz, 0, 0, ROLE.STONE, 0.2), b = G.vert(x + dp / 2, y - 1, zz, 0, 0, nz, dp, 0, ROLE.STONE, 0.2), t = G.vert(x, y + hr, zz, 0, 0, nz, dp / 2, hr, ROLE.STONE, 0.2), e0 = G.vert(x - dp / 2, y + hw, zz, 0, 0, nz, 0, hw, ROLE.STONE, 0.2), e1 = G.vert(x + dp / 2, y + hw, zz, 0, 0, nz, dp, hw, ROLE.STONE, 0.2); G.quad(a, b, e1, e0); G.tri(e0, e1, t); }
    }
    await Y();

    // ---- the poplar stream: a file of forty-odd poplars on the port bank, doubled in the water as broken level dashes
    const across = (z) => { const tx = centreX(z + 1) - centreX(z - 1), il = 1 / Math.hypot(tx, 2); return [2 * il, -tx * il]; };   // unit vector to port
    const poplars = [], mirGS = []; let popNear = 0, popEnd = 0, popCut = 0;
    {
      let z = -22;
      while (z < 291) { const a = across(z); poplars.push({ x: centreX(z) + a[0] * 11.2, z: z + a[1] * 11.2, ax: a[0], az: a[1] }); z += 7 / Math.hypot(1, (centreX(z + 1) - centreX(z - 1)) / 2); }
      for (let pi = 0; pi < poplars.length; pi++) {
        const p = poplars[pi], near = p.z > 140, y = groundAt(p.x, p.z), H = rng.range(31, 36), bare = rng.range(6.5, 9.5), Rm = rng.range(2.5, 3.3), lean = rng.range(-0.6, 0.6);
        const rad = (t) => Rm * Math.pow(Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), 0.62)), 0.8);       // spindle, fullest low
        // trunk and crown under-forms
        const gi0 = G.i.length;
        G.tube([{ x: p.x, y: y - 0.4, z: p.z, r: 0.62 }, { x: p.x + lean * 0.2, y: y + bare * 0.6, z: p.z, r: 0.46 }, { x: p.x + lean * 0.4, y: y + bare + 3, z: p.z, r: 0.34 }], ROLE.TRUNK, 0.1, 6, false);
        const cr = []; for (let k = 0; k <= 7; k++) { const t = k / 7; cr.push({ x: p.x + lean * (0.4 + t), y: y + bare + (H - bare) * t, z: p.z, r: Math.max(rad(t) * 0.6, 0.12) }); }
        G.tube(cr, ROLE.FOLIAGE, 0.3, 7, true);
        if (near) mirGS.push([gi0, G.i.length]);
        for (let i = 0; i < 26; i++) { const th = rng() * 6.283, yy = rng.range(0.2, bare + 2), r = 0.62 - 0.25 * yy / (bare + 2); TS.add(p.x + Math.cos(th) * r, y + yy, p.z + Math.sin(th) * r, -Math.sin(th), rng.range(-0.2, 0.2), Math.cos(th), Math.cos(th), 0, Math.sin(th), rng.range(0.7, 1.1), rng.range(0.24, 0.34), ROLE.TRUNK, 0.05, KIND.STREAK, 0, false); }
        // crown: upright comma touches that tremble; a few lemon rims on the light side
        const n = Math.round((near ? 400 : 190) * density), big = near ? 1 : 1.5;
        for (let i = 0; i < n; i++) {
          const t = Math.pow(rng(), 0.8), th = rng() * 6.283, c = Math.cos(th), sn = Math.sin(th), r = rad(t) * rng.range(0.55, 1.12) + 0.1, len = rng.range(1.0, 2.1) * big;
          TS.add(p.x + lean * (0.4 + t) + c * r, y + bare + (H - bare) * t + rng.range(-0.5, 0.5), p.z + sn * r, c * 0.22 + rng.range(-0.15, 0.15), 1, sn * 0.22 + rng.range(-0.15, 0.15), c, 0.25, sn, len, len * rng.range(0.24, 0.34),
            rng.chance(0.06) ? ROLE.RIM : rng.chance(0.12) ? ROLE.DEEP : ROLE.FOLIAGE, rng.chance(0.3) ? 0.25 : 0, KIND.CURL, 0.6);
        }
        if (!near) popNear = TS.n;
        if (p.z < 200) popCut = TS.n;                                  // the file upstream of z 200 is its own mesh: left behind, it is not drawn
        await Y();
      }
      popEnd = TS.n;
    }
    await Y();
    // banks: grass uprights, irises at the water's edge, the poppy bank and meadow to starboard (never in the frost field)
    {
      const nB = Math.round(14000 * density);
      for (let i = 0; i < nB; i++) {
        const z = rng.range(120, 300), side = rng.chance(0.62) ? -1 : 1, a = across(z), q = rng(), off = 7.3 + (q < 0.62 ? rng.range(0, 1) * rng.range(0.3, 11) : rng.range(8, 70));
        const x = centreX(z) + a[0] * side * off, zz = z + a[1] * side * off;
        if (side < 0 && inField(x, zz)) continue;
        if (side > 0 && off > 24) continue;
        const y = groundAt(x, zz), edge = off < 8.6, far = off > 18 ? rng.range(1.6, 3.2) : 1, fz = rng.sign();
        const role = edge && rng.chance(0.5) ? ROLE.IRIS : side < 0 && rng.chance(off < 18 ? 0.3 : 0.42) ? ROLE.POPPY : rng.chance(0.14) ? ROLE.RIM : ROLE.GRASS;
        if (role === ROLE.POPPY) { const sz = rng.range(0.26, 0.4) * far; TS.add(x, y + 0.5 * far, zz, rng.range(-1, 1), rng.range(-0.3, 0.3), rng.range(-1, 1), rng.range(-0.3, 0.3), 0.75, -0.6, sz, sz * 0.8, ROLE.POPPY, -0.6, KIND.CURL); continue; }
        const h = (role === ROLE.IRIS ? rng.range(0.7, 1.2) : rng.range(0.35, 0.7)) * far;
        TS.add(x, y + h * 0.42, zz, rng.range(-0.3, 0.3), 1, rng.range(-0.2, 0.2), rng.range(-0.6, 0.6), 0.3, fz, h, h * (role === ROLE.IRIS ? 0.2 : 0.3), role, rng.chance(0.25) ? 0.4 : -0.2, KIND.STREAK, role === ROLE.IRIS ? 0.25 : 0.12);
        if (i % 400 === 0) await Y();
      }
      await Y();
      for (let z = 150; z < 299; z += 0.2) for (const side of [-1, 1]) {       // the water's edge is irises and grass, never a ruled bank
        const a = across(z), off = 7.7 + rng.range(-0.5, 1.2), x = centreX(z) + a[0] * side * off, zz = z + a[1] * side * off, h = rng.range(0.7, 1.5);
        TS.add(x, STREAM_Y + h * 0.36, zz, rng.range(-0.3, 0.3), 1, rng.range(-0.2, 0.2), -side * a[0], 0.3, rng.sign() * 0.6, h, h * 0.22, rng.chance(0.4) ? ROLE.IRIS : rng.chance(0.15) ? ROLE.RIM : ROLE.GRASS, rng.chance(0.3) ? 0.4 : -0.2, KIND.STREAK, 0.2);
      }
      // the rise to starboard with poppies and one far figure under a parasol, facing us, faceless: six touches
      for (let i = 0; i < 900; i++) {
        const a = rng() * 6.283, r = Math.sqrt(rng()) * 46, x = -78 + Math.cos(a) * r, z = 236 + Math.sin(a) * r * 0.8, y = groundAt(x, z), sz = rng.range(1.0, 1.9);
        if (rng.chance(0.4)) TFar.add(x, y + 0.6, z, 1, 0.1, 0, 0, 0.6, -0.8, sz * 0.7, sz * 0.55, ROLE.POPPY, -0.6, KIND.CURL, 0, false);
        else TFar.add(x, y + sz * 0.4, z, rng.range(-0.3, 0.3), 1, 0, 0.2, 0.3, -1, sz * 1.4, sz * 0.4, rng.chance(0.2) ? ROLE.RIM : ROLE.GRASS, rng.chance(0.3) ? 0.5 : -0.2, KIND.STREAK, 0, false);
      }
      const fx = -72, fz = 224, fy = groundAt(fx, fz) + 0.2, add = (dx, dy, len, wid, role, occ, kind, dirx = 0, diry = 1) => TFar.add(fx + dx, fy + dy, fz, dirx, diry, 0, 0, 0.1, -1, len, wid, role, occ, kind, 0, false);
      add(0, 1.1, 2.3, 1.25, ROLE.CLOUD, -1, KIND.STREAK);            // the long white dress
      add(0.1, 2.5, 1.2, 0.8, ROLE.FROST, -1, KIND.STREAK);           // bodice
      add(0.1, 3.35, 0.55, 0.5, ROLE.TRUNK, -1, KIND.CURL);           // head, a salmon dab
      add(0.75, 2.9, 1.5, 0.22, ROLE.FROST, 1, KIND.STREAK, 0.45, 1); // arm and parasol stick
      add(1.0, 4.25, 3.3, 1.5, ROLE.PAD, -1, KIND.PAD, 1, 0.12);      // the pale green parasol
      add(0.4, 0.1, 3.2, 0.7, ROLE.GRASS, 1, KIND.STREAK, 1, 0);      // her shadow on the grass
    }
    await Y();
    // ---- the stream's doubles: flipped copies of the near poplars under the water plane, drawn through it as broken drags
    // (the doubles take their numbers from the second stream)
    const RS = new TouchBatch(rng2, 1, 8192);
    await Y();
    TS.reflectInto(RS, 1.9, 1.5, popNear, popEnd);                    // trunks as broken columns, crowns between them
    for (let i = 0; i < RS.n; i++) RS.A[i * 16 + 1] += 2 * STREAM_Y;
    await Y();
    // ---- a weeping willow: trunk of stacked dabs, a hull of shade, strands of hanging drags that swing; where a strand
    // hangs over the flown line its hem is lifted (THE HEM LAW), so the strands part over the course by place
    const willow = async (T, cx, cz, by, H, R, hem, o = {}) => {
      const lean = o.lean || 0, fork = by + H * 0.34, yc = by + H * 0.5, Rv = by + H - yc, p1 = rng() * 6.283, p2 = rng() * 6.283;
      const lobe = (th) => 1 + 0.2 * Math.sin(th * 3 + p1) + 0.13 * Math.sin(th * 5 + p2);
      const hemAt = (th) => hem + 1.2 * Math.sin(th * 3 + p2) + 0.8 * Math.sin(th * 7 + p1);
      const tr = []; for (let k = 0; k <= 5; k++) { const t = k / 5; tr.push({ x: cx + lean * t * t + Math.sin(t * 5 + cx) * 0.3, y: by - 0.4 + (fork - by + 0.4) * t, z: cz, r: (1.3 - 0.6 * Math.sqrt(t)) * R / 13 }); }
      G.tube(tr, o.trunk ?? ROLE.TRUNK, 0.15, 8, false);
      for (let k = 0; k < 5; k++) for (let j = 0; j < 14; j++) { const a = tr[k], b = tr[k + 1], t = rng(), th = rng() * 6.283, r = a.r + (b.r - a.r) * t; T.add(a.x + (b.x - a.x) * t + Math.cos(th) * r, a.y + (b.y - a.y) * t, cz + Math.sin(th) * r, -Math.sin(th), rng.range(-0.25, 0.25), Math.cos(th), Math.cos(th), 0, Math.sin(th), rng.range(0.6, 0.95), rng.range(0.2, 0.3), o.trunk ?? ROLE.TRUNK, 0.1, KIND.STREAK, 0, false); }
      const SEG = 18, RNG = 6; let prev = null;
      for (let j = 0; j <= RNG; j++) {
        const row = [], v = j / RNG, ph = v * Math.PI * 0.5;
        for (let k = 0; k <= SEG; k++) {
          const th = (k / SEG) * Math.PI * 2, rr = R * 0.8 * lobe(th) * (j === 0 ? 0.02 : Math.sin(ph)) * (j === RNG ? 0.92 : 1);
          const y = j === RNG ? Math.max(hemAt(th) + 2.5, by + H * 0.3) : yc + Rv * 0.8 * Math.cos(ph) - (v > 0.7 ? (v - 0.7) * 12 : 0);
          row.push(G.vert(cx + lean + Math.cos(th) * rr, y, cz + Math.sin(th) * rr, Math.cos(th) * Math.sin(ph), Math.cos(ph) * 0.8, Math.sin(th) * Math.sin(ph), v * R * 1.6 + (j === RNG ? 6 : 0), th * R * 0.8, ROLE.FOLIAGE, 0.5));
        }
        if (prev) for (let k = 0; k < SEG; k++) G.quad(prev[k], prev[k + 1], row[k + 1], row[k]);
        prev = row;
      }
      const nS = Math.round((o.strands || 560) * (R / 12) * Math.min(density, 1.05));
      for (let i = 0; i < nS; i++) {
        const th = rng() * Math.PI * 2, rho = Math.sqrt(0.2 + 0.8 * rng()), outer = rho > 0.72, Rl = R * lobe(th), ox = Math.cos(th), oz = Math.sin(th);
        const ax = cx + lean + ox * Rl * rho * 0.9, az = cz + oz * Rl * rho * 0.9, ay = yc + Rv * Math.pow(1 - rho * rho * 0.9, 0.42) * rng.range(0.86, 1.06);
        const hm = hemAt(th) + (outer ? rng.range(-1, 1.4) : rng.range(0.6, 5)), drop = Math.max(2, ay - hm), drift = Rl * (1 - rho * 0.9) * 0.5 + rng.range(0.3, 2);
        let t = rng.range(0, 0.8), guard = 0, wx = 0, wz = 0;
        // THE HEM LAW: this strand's floor is the lift over the line where it ends, and a lift of its own by its anchor's place
        const rag = HEM.RAG * hemHash(ax, az), floorAt = (x, z) => liftAt(x, z) + rag;
        const pose = (tm, P) => { const q = Math.exp(-tm / (drop * 0.3)); P[0] = ax + ox * drift * (1 - q); P[1] = az + oz * drift * (1 - q); P[2] = ox * drift * q / (drop * 0.3) + wx; P[3] = oz * drift * q / (drop * 0.3) + wz; };
        while (t < drop && guard++ < 30) {
          const len0 = rng.range(1.5, 3.4), tm0 = t + len0 * 0.5; wx = rng.range(-0.12, 0.12); wz = rng.range(-0.12, 0.12);
          const role = !outer && rng.chance(0.25) ? ROLE.DEEP : rng.chance(0.03) ? ROLE.RIM : ROLE.FOLIAGE;
          const cut = ay - tm0 - len0 * kDraw * 0.5 >= liftCap ? 0 : hemCut(ay, tm0, len0, pose, floorAt);
          if (cut < 0) { const sd = rng(); if (!(detail < 1 && ((sd * 7.13) % 1) > detail)) dblCount(T, sd, ay - tm0, null, 0); }   // left out: the number add() would draw is drawn and thrown away
          else {
            const len = cut ? CUT.len : len0, tm = cut ? CUT.tm : tm0, e = 1 - Math.exp(-tm / (drop * 0.3)), de = Math.exp(-tm / (drop * 0.3)) / (drop * 0.3), n0 = T.n;
            T.add(ax + ox * drift * e, ay - tm, az + oz * drift * e, ox * drift * de + wx, -1, oz * drift * de + wz, ox, 0.05 + 0.6 * (1 - tm / drop) * (1 - tm / drop), oz,
              len, Math.max(0.36, len * 0.22), role, (outer ? 0 : 0.3) + (tm > drop * 0.7 ? 0.12 : 0), KIND.DRAG, tm, true);
            if (cut && T.n > n0) dblCount(T, T.A[n0 * 16 + 14], ay - tm0, ay - tm, n0 * 16 + 1);
          }
          t += len0 * rng.range(0.62, 0.85);
        }
        if (i % 60 === 0) await Y();
      }
      for (let i = 0; i < 260; i++) {
        const th = rng() * Math.PI * 2, rho = Math.sqrt(rng()) * 0.8, Rl = R * lobe(th), ox = Math.cos(th), oz = Math.sin(th), len = rng.range(1.0, 2.2);
        T.add(cx + lean + ox * Rl * rho * 0.9, yc + Rv * Math.pow(1 - rho * rho * 0.9, 0.42) + rng.range(-0.3, 1.1), cz + oz * Rl * rho * 0.9, ox * (0.5 + rho) + rng.range(-0.3, 0.3), rng.range(-0.2, 0.9), oz * (0.5 + rho) + rng.range(-0.3, 0.3), ox * rho, 1, oz * rho, len, len * 0.24, rng.chance(0.05) ? ROLE.RIM : ROLE.FOLIAGE, 0, KIND.CURL, 0);
      }
    };
    // a curtain of drags hung across the course between two crowns: from (x0..x1) at height top down to the hem
    const curtain = (T, z, x0, x1, top, hem, n) => {
      for (let i = 0; i < n; i++) {
        const x = lerp(x0, x1, rng()), zz = z + rng.range(-2.2, 2.2), arch = top + 3 * Math.sin((x - x0) / (x1 - x0) * Math.PI) + rng.range(-1.5, 1.5), hm = hem + rng.range(-0.5, 2.2) + 1.1 * Math.sin(x * 0.7);
        let t = rng.range(0, 1), guard = 0, wx = 0, wz = 0; const drop = arch - hm, fz = rng.sign();
        // THE HEM LAW: this strand's floor is the curtain's own hem or the lift over the line, whichever is higher, and a lift of its own
        const rag = HEM.RAG * hemHash(x, zz), floorAt = (fx, fzz) => Math.max(curtainHem(fx, fzz), liftAt(fx, fzz)) + rag;
        const pose = (tm, P) => { P[0] = x; P[1] = zz; P[2] = wx; P[3] = wz; };
        while (t < drop && guard++ < 24) {
          const len0 = rng.range(1.2, 2.8), tm0 = t + len0 * 0.5; wx = rng.range(-0.1, 0.1); wz = rng.range(-0.1, 0.1);
          const nx = rng.range(-0.4, 0.4), role = rng.chance(0.16) ? ROLE.DEEP : rng.chance(0.04) ? ROLE.RIM : ROLE.FOLIAGE, occ = rng.chance(0.35) ? 0.3 : 0;
          const cut = hemCut(arch, tm0, len0, pose, floorAt);
          if (cut < 0) { const sd = rng(); if (!(detail < 1 && ((sd * 7.13) % 1) > detail)) dblCount(T, sd, arch - tm0, null, 0); }
          else {
            const len = cut ? CUT.len : len0, tm = cut ? CUT.tm : tm0, n0 = T.n;
            T.add(x, arch - tm, zz, wx, -1, wz, nx, 0.1, fz, len, Math.max(0.3, len * 0.2), role, occ, KIND.DRAG, tm, true);
            if (cut && T.n > n0) dblCount(T, T.A[n0 * 16 + 14], arch - tm0, arch - tm, n0 * 16 + 1);
          }
          t += len0 * rng.range(0.6, 0.85);
        }
      }
    };
    // ---- the sluice: two bank willows whose drags close the stream, then the weir's three steps down to the pond
    // (they stand 26 m upstream of the weir, so we are through the parting of their hems before the lip and the bridge stands clear from it)
    const SLZ = 274, SLX = centreX(SLZ);
    await willow(TL, SLX - 15.5, SLZ, groundAt(SLX - 15.5, SLZ), 25, 13, STREAM_Y + 2.4, { lean: 1.5 });
    await willow(TL, SLX + 15.5, SLZ - 2, groundAt(SLX + 15.5, SLZ - 2), 27, 13.5, STREAM_Y + 2.4, { lean: -1.5 });
    curtain(TL, SLZ, SLX - 9, SLX + 9, STREAM_Y + 17, STREAM_Y + 0.8, Math.round(150 * density));
    await Y();
    const WEIR = new FormBatch();
    {
      const prof = [[300, 6], [301.3, 4.05], [304.4, 4], [305.6, 2.05], [308.6, 2], [309.8, 0.02], [313, -0.4]];
      let s = 0, prev = null;
      for (let k = 0; k < prof.length; k++) {
        const [z, y] = prof[k], riser = k % 2 === 1, a = WEIR.vert(-9.5, y, z, 0, riser ? 0.3 : 1, riser ? -1 : 0, s, -9.5, riser ? ROLE.CLOUD : ROLE.WATER, -0.5), b = WEIR.vert(9.5, y, z, 0, riser ? 0.3 : 1, riser ? -1 : 0, s, 9.5, riser ? ROLE.CLOUD : ROLE.WATER, -0.5);
        if (prev) { const [pz, py] = prof[k - 1], fall = k % 2 === 1, a0 = WEIR.vert(-9.5, py, pz, 0, fall ? 0.3 : 1, fall ? -1 : 0, s - Math.hypot(z - pz, y - py), -9.5, fall ? ROLE.CLOUD : ROLE.WATER, -0.5), b0 = WEIR.vert(9.5, py, pz, 0, fall ? 0.3 : 1, fall ? -1 : 0, s - Math.hypot(z - pz, y - py), 9.5, fall ? ROLE.CLOUD : ROLE.WATER, -0.5); WEIR.quad(a0, b0, b, a); }
        prev = [a, b]; if (k < prof.length - 1) s += Math.hypot(prof[k + 1][0] - z, prof[k + 1][1] - y);
        if (k % 2 === 1) for (let i = 0; i < 70; i++) {                 // the fall: upright white-cut cobalt dashes on each face, foam at its foot
          const x = rng.range(-9.3, 9.3), t = rng(), pz = prof[k - 1][0], py = prof[k - 1][1], len = rng.range(0.6, 1.3);
          TL.add(x, lerp(py, y, t), lerp(pz, z, t) - 0.08, 0, -1, 0.5, 0, 0.4, -1, len, len * 0.24, rng.chance(0.5) ? ROLE.FROST : ROLE.WATER, rng.chance(0.3) ? 0.6 : -0.5, KIND.STREAK, 0, false);
          if (i % 3 === 0) TL.add(x, y + 0.12, z + rng.range(0.1, 1.4), 1, 0, rng.range(-0.2, 0.2), 0, 1, 0, rng.range(0.6, 1.2), rng.range(0.2, 0.3), ROLE.FROST, -0.5, KIND.CURL, 0, false);
        }
      }
      for (let i = 0; i < 420; i++) {                                    // violet stone dabs: the cheeks of the weir
        const side = rng.sign(), z = rng.range(297, 314), yTop = z < 301 ? 6.6 : z < 305.4 ? 5 : z < 309.6 ? 3.2 : 1.6, y = rng.range(Math.max(0.1, yTop - 3), yTop), x = side * (9.6 + rng.range(0, 1.4)), sz = rng.range(0.5, 0.95);
        TL.add(x, y, z, 0, rng.range(-0.3, 0.3), 1, -side, 0.3, 0, sz, sz * 0.62, rng.chance(0.12) ? ROLE.IRIS : ROLE.STONE, rng.chance(0.4) ? 0.5 : 0, KIND.CURL, 0, false);
      }
      for (const side of [-1, 1]) { let pv = null; for (let k = 0; k < prof.length; k++) { const [z, y] = prof[k], top = G.vert(side * 9.6, y + 1.2, z, -side, 0.2, 0, z, y + 1.2, ROLE.STONE, 0.2), bot = G.vert(side * 9.6, Math.max(y - 3, -0.05), z, -side, 0.2, 0, z, y - 3, ROLE.STONE, 0.2); if (pv) G.quad(pv[0], top, bot, pv[1]); pv = [top, bot]; } }
    }
    await Y();
    // ---- the pond. Islets with willows whose curtains hang across the course, the island, foliage walls, lily rafts, the boat
    const islet = (T, x, z, r) => {
      const c = G.vert(x, 0.75, z, 0, 1, 0, z, x, ROLE.GRASS, 0), ring = [];
      for (let k = 0; k <= 14; k++) { const th = (k / 14) * 6.283, rr = r * (1 + 0.15 * Math.sin(th * 3 + x)); ring.push(G.vert(x + Math.cos(th) * rr, -0.05, z + Math.sin(th) * rr * 0.8, Math.cos(th) * 0.4, 0.9, Math.sin(th) * 0.4, z + Math.sin(th) * rr, x + Math.cos(th) * rr, ROLE.GRASS, 0)); }
      for (let k = 0; k < 14; k++) G.tri(c, ring[k + 1], ring[k]);
      for (let i = 0; i < Math.round(r * 38); i++) {
        const th = rng() * 6.283, q = Math.sqrt(rng()), rr = r * q, edge = q > 0.8, h = edge ? rng.range(0.7, 1.2) : rng.range(0.35, 0.65), fz = rng.sign();
        T.add(x + Math.cos(th) * rr, 0.75 * (1 - q) + h * 0.42, z + Math.sin(th) * rr * 0.8, rng.range(-0.25, 0.25), 1, 0, rng.range(-0.5, 0.5), 0.35, fz, h, h * (edge ? 0.2 : 0.3), edge && rng.chance(0.5) ? ROLE.IRIS : rng.chance(0.12) ? ROLE.RIM : ROLE.GRASS, rng.chance(0.3) ? 0.4 : 0, KIND.STREAK, edge ? 0.2 : 0.1);
      }
    };
    const pondFrom = TP.n, dens = Math.min(density, 1.05);
    const nave = [];
    for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) nave.push({ x: sd * (22.5 + rng.range(-1.5, 2)), z: 470 + k * 28.5 + (sd > 0 ? 9 : 0) + rng.range(-3, 3), R: rng.range(14, 16.5), H: rng.range(25, 29) });
    for (const w of nave) {                                         // a nave of willows on islets: their crowns close the top of the frame
      islet(TP, w.x, w.z, 4.6);
      await willow(TP, w.x, w.z, 0.5, w.H, w.R, 2.7, { lean: -Math.sign(w.x) * 2.4, strands: 225, trunk: ROLE.DEEP });   // in the nave a trunk is only the willow's depth: no salmon post stands in the water frames
    }
    curtain(TP, 480, -11, 11, 16, 2.5, Math.round(150 * dens));
    curtain(TP, 521, -11, 11, 17, 3.4, Math.round(70 * dens));
    curtain(TP, 560, -11, 11, 16.5, 2.5, Math.round(150 * dens));
    curtain(TP, 598, -11, 11, 17, 3.6, Math.round(60 * dens));
    await Y();
    const ISL = { x: centreX(644) - 21.5, z: 644 };                   // the willow island, 22 m to starboard: its willow hangs over us
    islet(TP, ISL.x, ISL.z, 9.5);
    await willow(TP, ISL.x + 1, ISL.z, 0.6, 29, 18.5, 3.2, { lean: 3.5, strands: 360 });
    await Y();
    await Y();
    const pondTo = TP.n;
    // ---- the banks of the pond as foliage: a front row of rounded crowns and hanging willow masses of different heights
    // at the water's edge and a taller back row behind, so the skyline is broken and no face is flat. Each mass is a lobed
    // dome in three value shapes (light on the crown, shade in the body, the deepest dark only at the water's foot) with
    // its touches lying on it, larger high up. RULE OF PLACEMENT: one mass every 7 to 12 m along both banks from z 318 to
    // z 1004, 3 m back from the water's edge; the port bank sinks to reeds from z 876 to 912, so the town across the lake
    // stands clear to port of the last arch. All numbers come from the second stream.
    // (TW holds what lies before z 660, TW2 what lies beyond: the far part is not drawn until we are down in the bridge basin)
    const TW = new TouchBatch(rng2, detail, 16384), TW2 = new TouchBatch(rng2, detail, 16384), WALLS = new FormBatch(), MIR = new FormBatch(), MIRS = new FormBatch();
    const twFor = (z) => (z < 660 ? TW : TW2);
    // a double: a mass again, upside down under the water, to be drawn in its shade pigment (aRole.y = depth share)
    const dblMass = (B, x, z, R, D, role, wy = 0) => {
      const SEG = 8, LV = [0, 0.35, 0.72, 1], p1 = rng2() * 6.283, p2 = rng2() * 6.283; let prev = null;
      for (let j = 0; j < LV.length; j++) {
        const v = LV[j], row = [], pr = Math.sqrt(Math.max(0.02, 1 - Math.pow(v, 2.4)));
        for (let k = 0; k <= SEG; k++) {
          const th = (k / SEG) * 6.2832, c = Math.cos(th), sn = Math.sin(th), r = R * pr * (1 + 0.2 * Math.sin(th * 3 + p1) + 0.12 * Math.sin(th * 5 + p2));
          row.push(B.vert(x + c * r, wy - 0.03 - D * v, z + sn * r, c, 0, sn, v * D, th * R, role, v));
        }
        if (prev) for (let k = 0; k < SEG; k++) B.quad(prev[k], prev[k + 1], row[k + 1], row[k]);
        prev = row;
      }
    };
    const bankH = (side, z) => sstep(312, 345, z) * (0.78 + 0.22 * sstep(380, 470, z)) * (side > 0 ? 1 - 0.94 * sstep(876, 912, z) : 1 - 0.85 * sstep(966, 1004, z));
    const mass = (mx0, mz0, rr, H, fx, fz, willowy, back, share) => {
      const TQ = twFor(mz0), SEG = 8, LV = [0, 0.2, 0.45, 0.72, 1], p1 = rng2() * 6.283, p2 = rng2() * 6.283;
      const lobe = (th) => 1 + 0.2 * Math.sin(th * 3 + p1) + 0.12 * Math.sin(th * 5 + p2);
      const foot = willowy ? 0.3 : Math.min(2, H * 0.12);
      const P = (th, v) => { const r = rr * lobe(th) * Math.max(Math.sqrt(Math.max(0, 1 - (1 - v) * (1 - v))), 0.03); return [mx0 + Math.cos(th) * r, foot + (H - foot) * (1 - Math.pow(v, 1.5)), mz0 + Math.sin(th) * r]; };
      let prev = null;
      for (let j = 0; j < LV.length; j++) {
        const row = [], v = LV[j], occ = v < 0.3 ? -0.12 : v < 0.6 ? 0.22 : 0.55;
        for (let k = 0; k <= SEG; k++) { const th = (k / SEG) * 6.2832, q = P(th, v); row.push(WALLS.vert(q[0], q[1], q[2], Math.cos(th) * v, 1 - v * 0.9, Math.sin(th) * v, v * H * 1.2, th * rr, ROLE.FOLIAGE, occ)); }
        if (prev) for (let k = 0; k < SEG; k++) WALLS.quad(prev[k], prev[k + 1], row[k + 1], row[k]);
        prev = row;
      }
      if (!back) {                                                    // the dark at the water's foot
        const a = [], b = [];
        for (let k = 0; k <= SEG; k++) { const th = (k / SEG) * 6.2832, q = P(th, 1); a.push(WALLS.vert(q[0], q[1], q[2], Math.cos(th), 0.1, Math.sin(th), 0, th * rr, ROLE.DEEP, 1)); b.push(WALLS.vert(q[0], -0.05, q[2], Math.cos(th), 0.1, Math.sin(th), foot + 0.1, th * rr, ROLE.DEEP, 1)); }
        for (let k = 0; k < SEG; k++) WALLS.quad(a[k], a[k + 1], b[k + 1], b[k]);
      }
      // touches on the side toward the water: commas on a crown, hanging drags on a willow mass, reeds and irises at its foot
      const face = Math.atan2(fz, fx), n = Math.round((back ? 50 : 70 + rr * H * 0.52) * dens * share);
      for (let i = 0; i < n; i++) {
        const th = face + rng2.range(-1.9, 1.9), v = back ? 0.04 + 0.5 * rng2() : Math.pow(rng2(), 0.7), q = P(th, v), ox = Math.cos(th), oz = Math.sin(th);
        const big = (back ? 1.7 : 1) * (1.5 - 0.6 * v) / Math.sqrt(share), len = rng2.range(2.2, 3.8) * big, c2 = rng2.range(-0.9, 0.9), top = v < 0.34, occ = top ? -0.12 : v < 0.62 ? 0.25 : 0.6;
        const role = top && rng2.chance(0.05) ? ROLE.RIM : v > 0.5 && rng2.chance(0.2) ? ROLE.DEEP : ROLE.FOLIAGE;
        if (willowy && v > 0.25) TQ.add(q[0] + ox * 0.35, q[1] - len * 0.2, q[2] + oz * 0.35, rng2.range(-0.12, 0.12), -1, rng2.range(-0.12, 0.12), ox, 0.25, oz, len * 1.15, len * 0.28, role, occ, KIND.DRAG, 1 + v * 3);
        else TQ.add(q[0] + ox * 0.3 * v, q[1] + 0.3, q[2] + oz * 0.3 * v, ox * 0.5 - oz * c2, -(0.15 + 0.9 * v) + rng2.range(-0.2, 0.2), oz * 0.5 + ox * c2, ox * v, 1.05 - v * 0.9, oz * v, len * 0.85, len * 0.36, role, occ, KIND.CURL, 0.3);   // commas lying round the crown, never upright spikes
      }
      if (!back) for (let i = 0; i < 9; i++) {
        const th = face + rng2.range(-1.3, 1.3), q = P(th, 1), hh = rng2.range(0.8, 1.6);
        TQ.add(q[0] + Math.cos(th) * 0.6, hh * 0.45, q[2] + Math.sin(th) * 0.6, rng2.range(-0.25, 0.25), 1, 0, Math.cos(th), 0.35, Math.sin(th), hh, hh * 0.22, rng2.chance(0.5) ? ROLE.IRIS : ROLE.GRASS, rng2.chance(0.3) ? 0.4 : 0, KIND.STREAK, 0.2);
      }
    };
    for (const side of [-1, 1]) {
      let z = 318 + rng2.range(0, 5), k = 0;
      while (z < 1004) {
        const a = across(z), cx = centreX(z), hw = halfWidth(z), hf = bankH(side, z), rr = rng2.range(6.5, 10.5), wl = rng2.chance(0.42);
        const H = (11 + 12 * rng2() + 4 * Math.sin(z * 0.031 + side * 2)) * hf, off = hw + 3 + rr * 0.5;
        const mx0 = cx + a[0] * side * off, mz0 = z + a[1] * side * off;
        const share = hw > 50 ? 0.55 : 1;                              // behind the nave's willows the far banks carry fewer, larger touches
        if (H > 2.5) { mass(mx0, mz0, rr, H, -a[0] * side, -a[1] * side, wl, false, share); dblMass(MIR, mx0, mz0, rr * 0.96, H * 0.95, ROLE.FOLIAGE); }
        else for (let i = 0; i < 22; i++) {                              // where the bank is low: a clump of reeds and irises at the water's edge
          const hh = rng2.range(0.6, 1.3), rx = mx0 - a[0] * side * (rr * 0.5 + 1.5) + rng2.gauss() * 1.6, rz = mz0 - a[1] * side * (rr * 0.5 + 1.5) + rng2.gauss() * 2.2;
          twFor(rz).add(rx, hh * 0.45, rz, rng2.range(-0.45, 0.45), 1, rng2.range(-0.3, 0.3), -a[0] * side, 0.35, -a[1] * side + rng2.range(-0.4, 0.4), hh, hh * 0.3, rng2.chance(0.12) ? ROLE.IRIS : rng2.chance(0.2) ? ROLE.RIM : ROLE.GRASS, rng2.chance(0.3) ? 0.4 : 0, KIND.STREAK, 0.25);
        }
        if (k % 2 === 0 && hf > 0.5) {                                 // the back row: taller, further in, only its crowns show
          const r2 = rng2.range(9, 13), o2 = off + rng2.range(9, 14), H2 = (22 + 9 * rng2()) * hf, bx = cx + a[0] * side * o2, bz = z + 4 + a[1] * side * o2;
          mass(bx, bz, r2, H2, -a[0] * side, -a[1] * side, false, true, share);
        }
        z += rng2.range(7, 12); k++;
        if (k % 3 === 0) await Y();
      }
    }
    await Y();
    // lily rafts: level ellipses flat on the water with single flower dabs, 3 m either side of the course and thinner far off
    const raft = (T, cx, cz, rx, rz, ang, k = 1.7) => {
      const n = Math.round(rx * rz * k), ca = Math.cos(ang), sa = Math.sin(ang);
      for (let i = 0; i < n; i++) {
        const th = rng() * 6.283, r = Math.sqrt(rng()), lx = Math.cos(th) * r * rx, lz = Math.sin(th) * r * rz, x = cx + lx * ca - lz * sa, z = cz + lx * sa + lz * ca, sz = rng.range(0.6, 1.2), a = rng() * 6.283;
        if (groundAt(x, z) > -0.2) continue;
        T.add(x, 0.03, z, Math.cos(a), 0, Math.sin(a) * 0.5, 0, 1, 0, sz * 1.2, sz * 0.72, ROLE.PAD, rng.chance(0.25) ? 0.5 : -0.2, KIND.PAD, 0, true);
        if (rng.chance(0.12)) T.add(x + 0.2, 0.09, z, Math.cos(a + 1), 0, Math.sin(a + 1), 0, 1, 0, rng.range(0.42, 0.62), rng.range(0.34, 0.46), ROLE.FLOWER, -1, KIND.FLOWER, 0, false);
      }
    };
    {
      const v = new THREE.Vector3(), t = new THREE.Vector3(); let side = rng.sign();
      for (let d = uAtZ(452) * L; d < L - 6; d += rng.range(10, 16)) {
        path.posAtDist(d, v); path.tangentAtDist(d, t); const rx = rng.range(5, 9.5), rz = rng.range(2.4, 4.2), under = rng.chance(0.3), lat = under ? rng.range(-1.5, 1.5) : 2.8 + rz + rng.range(0, 2.5);
        const x = v.x + t.z * side * lat, z = v.z - t.x * side * lat;
        if (Math.hypot(x - MOOR.x, z - MOOR.z) > 8 && Math.hypot(x - ISL.x, z - ISL.z) > 13) raft(TP, x, z, rx, rz, Math.atan2(t.x, t.z) + Math.PI / 2 + rng.range(-0.3, 0.3));
        side = -side; await Y();
      }
      for (let i = 0; i < Math.round(46 * density); i++) {                      // the far rafts: wider, sparser
        const z = rng.range(350, 960), cx = centreX(z), hw = halfWidth(z), x = cx + rng.sign() * rng.range(12, Math.max(14, hw - 6));
        raft(TP, x, z, rng.range(6, 13), rng.range(2.5, 5), rng.range(-0.4, 0.4), 1.0);
        if (i % 6 === 0) await Y();
      }
      for (let i = 0; i < 26; i++) raft(TP, rng.sign() * rng.range(9, 34), rng.range(455, 650), rng.range(5, 10), rng.range(2.2, 4), rng.range(-0.3, 0.3), 1.3);   // the nave: pads on sky
    }
    await Y();
    // their doubles in the pond: every third touch above the water as a longer vertical drag below it
    await Y();
    // RULE: under every bank mass, willow, arch and the boat hangs its double: the mass again upside down in its shade
    // pigment (MIR), and over it flipped touches as vertical drags. In the nave (z 455 to 625) the water is the sky: there
    // no drag lies within 16 m of the course or deeper than 9 m, and each willow's double is a short mass on its outer side
    // (the rowboat, moored in this stretch, keeps its own double: it is a batch of its own).
    // (THE HEM LAW keeps the second stream in step: live drew one rng2 number for every double; the doubles the law has
    // lost are drawn here and thrown away. A shortened drag whose middle rose out of the water makes a double it had not:
    // were those ever more than the lost ones, the surplus are kept out of the copy, so the count owed is never negative.)
    const dHide = DBL.made.slice(Math.max(0, DBL.lost)); for (const o of dHide) TP.A[o] = -TP.A[o];
    const r0 = RP.n; TP.reflectInto(RP, DBL.every, 1.6, pondFrom, pondTo);
    for (const o of dHide) TP.A[o] = -TP.A[o];
    { const owed = DBL.lost - (DBL.made.length - dHide.length); if (owed < 0) throw new Error('the hem law: the second stream is out of step'); for (let i = 0; i < owed; i++) rng2(); }
    for (let i = RP.n - 1; i >= r0; i--) {
      const o = i * 16, z = RP.A[o + 2];
      if (z > 455 && z < 625 && (Math.abs(RP.A[o] - centreX(z)) < 16 || RP.A[o + 1] < -9)) { RP.n--; RP.A.copyWithin(o, RP.n * 16, RP.n * 16 + 16); }
    }
    dblHem();                                                         // THE HEM LAW (6): every double of the pond stays in the water
    await Y();
    TW.reflectInto(RP, 3.2 / Math.max(detail, 0.6), 1.6, 0, TW.n, 1e9, 1.5, 1.3);   // (not the reeds: a reed's double would stand as a post)
    dblHem();
    const rNear = RP.n;                                               // what follows in RP lies beyond z 660 (far banks, the arches)
    TW2.reflectInto(RP, 3.2 / Math.max(detail, 0.6), 1.6, 0, TW2.n, 1e9, 1.5, 1.3);
    dblHem();
    await Y();
    for (const w of nave) dblMass(MIR, w.x + Math.sign(w.x) * 6, w.z, w.R * 0.52, w.H * 0.34, ROLE.FOLIAGE);
    dblMass(MIR, ISL.x + 4, ISL.z, 18.5 * 0.8, 26, ROLE.FOLIAGE);
    // the stream's: the near poplars' trunks and crowns laid again under the stream's own level
    for (const [i0, i1] of mirGS) {
      const map = new Map(); await Y();
      for (let k = i0; k < i1; k++) {
        const vi = G.i[k]; let m = map.get(vi);
        if (m === undefined) { const y = G.p[vi * 3 + 1]; m = MIRS.vert(G.p[vi * 3], Math.min(2 * STREAM_Y - y, STREAM_Y - 0.02), G.p[vi * 3 + 2], G.n[vi * 3], -G.n[vi * 3 + 1], G.n[vi * 3 + 2], G.uv[vi * 2], G.uv[vi * 2 + 1], G.r[vi * 2], clamp((y - STREAM_Y) / 40, 0, 1) * 0.7); map.set(vi, m); }
        MIRS.i.push(m);
      }
    }
    await Y();
    // ---- pads on sky. RULE: one small raft about every 6 m of the course from the bridge basin to the last arch, anywhere
    // within 9 m of it (so three to five lie in view from arm's length to the far water), never on land or under the boat.
    const onLand = (x, z) => groundAt(x, z) > -0.15 || (Math.abs(z - BRIDGE_Z) < 17 && Math.abs(x) > 12.5 && Math.abs(x) < 39)
      || Math.hypot(x - ISL.x, z - ISL.z) < 10.5 || Math.hypot(x - MOOR.x, z - MOOR.z) < 4 || nave.some((w) => Math.abs(x - w.x) < 5.5 && Math.abs(z - w.z) < 4.8);
    {
      const v = new THREE.Vector3(), t = new THREE.Vector3();
      for (let d = uAtZ(425) * L + rng2.range(0, 5); d < L - 8; d += rng2.range(4.5, 8)) {
        path.posAtDist(d, v); path.tangentAtDist(d, t);
        const lat = rng2.range(-9, 9), cx = v.x + t.z * lat, cz = v.z - t.x * lat, rx = rng2.range(1.3, 3.4), rz = rng2.range(0.8, 1.7), n = Math.round(rx * rz * rng2.range(2.2, 3.2)) + 3;
        const ang = Math.atan2(t.x, t.z) + Math.PI / 2 + rng2.range(-0.3, 0.3), ca = Math.cos(ang), sa = Math.sin(ang);
        for (let i = 0; i < n; i++) {
          const th = rng2() * 6.283, r = Math.sqrt(rng2()), lx = Math.cos(th) * r * rx, lz = Math.sin(th) * r * rz, x = cx + lx * ca - lz * sa, z = cz + lx * sa + lz * ca, sz = rng2.range(0.55, 1.1), a = rng2() * 6.283, fl = rng2.chance(0.2);
          if (onLand(x, z)) continue;
          twFor(z).add(x, 0.035, z, Math.cos(a), 0, Math.sin(a) * 0.5, 0, 1, 0, sz * 1.2, sz * 0.72, ROLE.PAD, rng2.chance(0.25) ? 0.5 : -0.2, KIND.PAD, 0, false);
          if (fl) twFor(z).add(x + 0.2, 0.09, z, Math.cos(a + 1), 0, Math.sin(a + 1), 0, 1, 0, rng2.range(0.42, 0.62), rng2.range(0.34, 0.46), ROLE.FLOWER, -1, KIND.FLOWER, 0, false);
        }
        await Y();
      }
      await Y();
      // ---- level dashes laid on the water in the sky's own colours (role 24 takes cloud or blue from the cloud map where
      // it lies): what crosses every double and tells the eye the surface is level. RULE: scattered over all the pond from
      // the weir's foot to the last arch, thick and in two sizes within 11 m of the course, larger and fewer out to the banks.
      const d0 = uAtZ(318) * L, nNear = Math.round(4200 * dens), nFar = Math.round(2000 * dens);
      for (let i = 0; i < nNear + nFar; i++) {
        let x, z, sx, sz, len;
        if (i < nNear) {
          const d = lerp(d0, L - 3, rng2()); path.posAtDist(d, v); path.tangentAtDist(d, t);
          const lat = rng2.sign() * rng2() * rng2.range(1.5, 11); x = v.x + t.z * lat; z = v.z - t.x * lat; sx = t.z; sz = -t.x;
          len = rng2.chance(0.62) ? rng2.range(0.3, 0.7) : rng2.range(0.8, 1.6);
        } else {
          const zz = rng2.range(322, 1000), a = across(zz), hw = halfWidth(zz), lat = rng2.sign() * rng2.range(8, Math.max(9, hw - 1)); x = centreX(zz) + a[0] * lat; z = zz + a[1] * lat; sx = a[0]; sz = a[1];
          len = rng2.range(2.2, 5);
        }
        const role = rng2.chance(0.86) ? 24 : rng2.chance(0.5) ? ROLE.CLOUD : ROLE.WATER, wid = len * rng2.range(0.13, 0.2), w = rng2.range(-0.12, 0.12);
        if (onLand(x, z)) continue;
        twFor(z).add(x, 0.02, z, sx + sz * w, 0, sz - sx * w, 0, 1, 0, len, wid, role, -0.6, KIND.STREAK, 0, true);
        if (i % 250 === 0) await Y();
      }
    }
    await Y();
    // ---- the empty rowboat: viridian strakes, a salmon thwart, violet inside, rocking 4 m to port of the course (adrift: BERTH.ADRIFT)
    const boat = new THREE.Group(); boat.name = 'rowboat';
    const BF = new FormBatch(), BT = new TouchBatch(rng, 1, 1024), BR = new TouchBatch(rng, 1, 512);
    {
      const NS = 10, beam = (t) => 0.78 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.6)), 0.55) + 0.03, sheer = (t) => 0.5 + 0.2 * t * t;
      for (const side of [-1, 1]) for (const inner of [0, 1]) {
        let prev = null;
        for (let k = 0; k <= NS; k++) {
          const t = -1 + 2 * k / NS, z = t * 2.25, b = beam(t), g = sheer(t), row = [];
          for (let j = 0; j <= 3; j++) { const v = j / 3, x = side * b * (0.25 + 0.75 * Math.pow(v, 0.6)) * (inner ? 0.93 : 1), y = -0.12 + (g + 0.12) * v + (inner ? 0.05 : 0); row.push(BF.vert(x, y, z, inner ? -side * 0.3 : side * 0.9, inner ? 0.9 : 0.3 - v * 0.2, 0, z, v * 0.8, inner ? ROLE.IRIS : ROLE.BOAT, inner ? 1 : 0.0)); }
          if (prev) for (let j = 0; j < 3; j++) BF.quad(prev[j], row[j], row[j + 1], prev[j + 1]);
          prev = row;
        }
      }
      const bot0 = BF.vert(-0.3, 0.02, -1.9, 0, 1, 0, -1.9, 0, ROLE.IRIS, 1), bot1 = BF.vert(0.3, 0.02, -1.9, 0, 1, 0, -1.9, 0.6, ROLE.IRIS, 1), bot2 = BF.vert(0.3, 0.02, 1.9, 0, 1, 0, 1.9, 0.6, ROLE.IRIS, 1), bot3 = BF.vert(-0.3, 0.02, 1.9, 0, 1, 0, 1.9, 0, ROLE.IRIS, 1);
      BF.quad(bot0, bot1, bot2, bot3);
      for (const tz of [-0.55, 0.75]) { const b = beam(tz / 2.25) * 0.95, y = 0.4, a0 = BF.vert(-b, y, tz - 0.16, 0, 1, 0, 0, 0, ROLE.TRUNK, -1), a1 = BF.vert(b, y, tz - 0.16, 0, 1, 0, 2 * b, 0, ROLE.TRUNK, -1), a2 = BF.vert(b, y, tz + 0.16, 0, 1, 0, 2 * b, 0.32, ROLE.TRUNK, -1), a3 = BF.vert(-b, y, tz + 0.16, 0, 1, 0, 0, 0.32, ROLE.TRUNK, -1); BF.quad(a0, a1, a2, a3);
        for (let i = 0; i < 5; i++) BT.add(lerp(-b, b, (i + 0.5) / 5), y + 0.02, tz, 1, 0, rng.range(-0.1, 0.1), 0, 1, 0, 0.42, 0.26, ROLE.TRUNK, -1, KIND.STREAK, 0, false); }
      for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let k = 0; k < 15; k++) {      // strakes: streaks running the length of the hull
        const t = -0.96 + 1.92 * (k + rng()) / 15, v = (row + 0.6) / 3, b = beam(t) * (0.25 + 0.75 * Math.pow(v, 0.6)) + 0.02, y = -0.12 + (sheer(t) + 0.12) * v;
        BT.add(side * b, y, t * 2.25, side * -0.3 * t, 0.06 * t, 1, side, 0.3, 0, rng.range(0.5, 0.75), rng.range(0.15, 0.2), row === 2 && rng.chance(0.3) ? ROLE.RIM : ROLE.BOAT, row === 0 ? 0.35 : 0, KIND.STREAK, 0, false);
        if (row < 2 && k % 2 === 0) BT.add(side * b * 0.8, y + 0.12, t * 2.2, 0, 0.2, 1, -side * 0.5, 0.8, 0, 0.5, 0.2, rng.chance(0.4) ? ROLE.DEEP : ROLE.IRIS, 1, KIND.STREAK, 0, false);
      }
      BT.reflectInto(BR, 1.3, 2.2);
    }
    boat.position.set(BOAT.x, 0, BOAT.z); boat.rotation.y = BOAT.yaw;
    if (!boatAdrift) {                                                // moored: a violet post and its dabs, 2 m off the bow
      const px = BOAT.x + Math.sin(BOAT.yaw) * 3.3, pz = BOAT.z + Math.cos(BOAT.yaw) * 3.3;
      G.tube([{ x: px, y: -0.05, z: pz, r: 0.13 }, { x: px + 0.1, y: 1.5, z: pz, r: 0.1 }], ROLE.IRIS, 0.2, 5, false);
      for (let i = 0; i < 7; i++) TP.add(px + rng.range(-0.1, 0.1), 0.15 + i * 0.2, pz - 0.14, 1, rng.range(-0.2, 0.2), 0, 0, 0, -1, 0.34, 0.2, i === 6 ? ROLE.RIM : ROLE.IRIS, 0.2, KIND.STREAK, 0, false);
    }
    await Y();
    // ---- the landing: three rose arches over the outflow, each half hoop closed to a ring by its double; the dash ladder; the town
    const exitFrom = TE.n, side0 = V3(EDIR.z, 0, -EDIR.x);              // unit vector across the outflow
    for (const back of [90, 30, 0]) {
      const cx = END.x - EDIR.x * back, cz = END.z - EDIR.z * back, RH = 9, cy = 1.6, pts = [];
      for (let k = 0; k <= 22; k++) { const a = Math.PI * k / 22, lx = Math.cos(a) * RH, y = cy + Math.sin(a) * RH; pts.push({ x: cx + side0.x * lx, y, z: cz + side0.z * lx, r: 0.5 }); }
      pts.unshift({ x: pts[0].x, y: -0.05, z: pts[0].z, r: 0.5 }); pts.push({ x: pts[pts.length - 1].x, y: -0.05, z: pts[pts.length - 1].z, r: 0.5 });
      G.tube(pts, ROLE.FOLIAGE, 0.4, 6, true);
      const n = Math.round(2500 * Math.min(density, 1.15));
      for (let i = 0; i < n; i++) {
        const q = rng(), leg = q < 0.14, a = leg ? (rng.chance(0.5) ? 0 : Math.PI) : Math.PI * rng(), yl = leg ? rng.range(0.1, cy) : cy;
        const th = rng() * 6.283, rr = 0.5 + Math.abs(rng.gauss()) * 0.62, ox = Math.cos(a), oy = Math.sin(a);
        const rad = RH + Math.cos(th) * rr, lx = ox * rad, y = yl + (leg ? 0 : oy * rad), dz = Math.sin(th) * rr, sz = rng.range(0.55, 1.0);
        const dealt = rng.chance(0.36) ? ROLE.POPPY : rng.chance(0.5) ? ROLE.FLOWER : rng.chance(0.16) ? ROLE.RIM : ROLE.FOLIAGE;   // HOLDS THE STREAM, and is not used: the role was dealt here by chance (one to three numbers); the line is kept as it was written so that the same numbers are drawn, because the rafts, the ladder, the town, the swallows and the hero are dealt after it from this stream. Do not tidy it away.
        // THE LAW OF PIGMENT AT BLUE DUSK: the dab's role and its occlusion by its own place on its hoop (ROSE; no number is drawn)
        const px = cx + side0.x * lx + EDIR.x * dz, pz = cz + side0.z * lx + EDIR.z * dz, h2 = placeHash(px, y, pz, 2), h3 = placeHash(px, y, pz, 3);
        const off = Math.cos(th) * rr + (placeHash(px, y, pz, 1) - 0.5) * ROSE.RAG, soffit = off < ROSE.IN;   // its metres outside the hoop's line, the border ragged
        const role = soffit ? (h2 < ROSE.SOFT ? ROLE.POPPY : ROLE.FOLIAGE) : off <= ROSE.OUT ? (h2 < ROSE.BODY ? ROLE.POPPY : ROLE.RIM)
          : h3 < ROSE.CREST * sstep(cy + ROSE.Y0 * RH, cy + ROSE.Y1 * RH, y) ? ROLE.RIM : ROLE.POPPY;
        TE.add(px, y, pz, rng.range(-1, 1), rng.range(-1, 1), rng.range(-0.4, 0.4), side0.x * ox * Math.cos(th) - EDIR.x * 0.8, oy * Math.cos(th) + 0.25, side0.z * ox * Math.cos(th) - EDIR.z * 0.8,
          sz, sz * 0.7, role, soffit ? ROSE.SHADE : ROSE.LIGHT, KIND.CURL, 0, i > 500);
        if (i % 400 === 0) await Y();
      }
      for (const sd of [-1, 1]) raft(TE, cx + side0.x * sd * (RH + 2.5), cz + side0.z * sd * (RH + 2.5), rng.range(5, 7), rng.range(2.4, 3.4), 0.43 + rng.range(-0.3, 0.3), 1.8);
      await Y();
    }
    await Y();
    TE.reflectInto(RP, 1.7, 1.5, exitFrom, TE.n);
    dblHem();
    await Y();
    for (let i = 0; i < 170; i++) {                                    // the ladder of level dashes laid toward us on the outflow
      const back = 4 + Math.pow(rng(), 1.5) * 150, w = lerp(5.5, 2.2, back / 154), lat = rng.range(-1, 1) * w, len = rng.range(1.6, 4.2) * (1 - back / 260);
      TE.add(END.x - EDIR.x * back + side0.x * lat, 0.05, END.z - EDIR.z * back + side0.z * lat, side0.x, 0, side0.z, 0, 1, 0, len, rng.range(0.3, 0.46), rng.chance(0.6) ? ROLE.FLOWER : ROLE.RIM, -1, KIND.STREAK, 0, false);
    }
    {
      const tx = END.x + EDIR.x * 215 + side0.x * 36, tz = END.z + EDIR.z * 215 + side0.z * 36;   // the misty town across the water: roofs and one church tower, no lit window
      const box = (x, z, w, d, h, roof, role) => {
        const c = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([a, b]) => [x + side0.x * a + EDIR.x * b, z + side0.z * a + EDIR.z * b]);
        for (let k = 0; k < 4; k++) { const p = c[k], q = c[(k + 1) % 4], nx = -(q[1] - p[1]), nz = q[0] - p[0], il = 1 / Math.hypot(nx, nz); G.quad(G.vert(p[0], -0.05, p[1], -nx * il, 0, -nz * il, 0, 0, role, 0.1), G.vert(q[0], -0.05, q[1], -nx * il, 0, -nz * il, 2 * w, 0, role, 0.1), G.vert(q[0], h, q[1], -nx * il, 0, -nz * il, 2 * w, h, role, 0.1), G.vert(p[0], h, p[1], -nx * il, 0, -nz * il, 0, h, role, 0.1)); }
        const ap = G.vert(x, h + roof, z, 0, 1, 0, 0, roof, ROLE.ROOF, 0);
        for (let k = 0; k < 4; k++) { const p = c[k], q = c[(k + 1) % 4]; G.tri(G.vert(p[0], h, p[1], -EDIR.x, 0.6, -EDIR.z, 0, 0, ROLE.ROOF, k % 2 ? 0.3 : 0), G.vert(q[0], h, q[1], -EDIR.x, 0.6, -EDIR.z, 2 * w, 0, ROLE.ROOF, k % 2 ? 0.3 : 0), ap); }
        for (let i = 0; i < Math.round(w * h * 0.09) + 3; i++) { const a = rng.range(-w, w), yy = rng.range(1, h + roof * 0.7); TFar.add(x + side0.x * a - EDIR.x * (d + 0.3), yy, z + side0.z * a - EDIR.z * (d + 0.3), side0.x, rng.range(-0.15, 0.15), side0.z, -EDIR.x, 0.2, -EDIR.z, rng.range(4, 6.5), rng.range(1.1, 1.7), yy > h ? ROLE.ROOF : ROLE.TOWN, rng.chance(0.4) ? 0.5 : 0, KIND.STREAK, 0, false); }
      };
      for (let i = 0; i < 11; i++) { const a = (i - 5) * 21 + rng.range(-5, 5); if (Math.abs(a - 36) < 20) continue; box(tx + side0.x * a + EDIR.x * rng.range(-8, 20), tz + side0.z * a + EDIR.z * rng.range(-8, 20), rng.range(6, 10), rng.range(4, 6), rng.range(7, 12), rng.range(4, 7), ROLE.TOWN); }
      box(tx + side0.x * 30, tz + side0.z * 30, 4.2, 4.2, 30, 17, ROLE.TOWN);                          // the church tower and its spire
      box(tx + side0.x * 44 + EDIR.x * 6, tz + side0.z * 44 + EDIR.z * 6, 11, 5.5, 13, 7, ROLE.TOWN);  // its nave
      for (let i = 0; i < 60; i++) { const a = rng.range(-150, 150), b = rng.range(-22, -8); TFar.add(tx + side0.x * a + EDIR.x * b, 0.6, tz + side0.z * a + EDIR.z * b, side0.x, 0, side0.z, -EDIR.x * 0.3, 1, -EDIR.z * 0.3, rng.range(6, 11), rng.range(1.2, 2), rng.chance(0.5) ? ROLE.TOWN : ROLE.GRASS, 0.2, KIND.STREAK, 0, false); }
    }
    await Y();
    // ---- swallows: forty flecks of two touches each, wheeling in four parties, never nearer than 60 m
    const flocks = [];
    for (const f of [{ x: -118, y: 34, z: 62, r: 46 }, { x: 124, y: 38, z: 232, r: 44 }, { x: -128, y: 30, z: 525, r: 48 }, { x: 28 + centreX(880), y: 40, z: 885, r: 30 }]) {
      const SW = new TouchBatch(rng, 1, 32), g = new THREE.Group();
      for (let i = 0; i < 10; i++) {
        const a = rng() * 6.283, r = f.r * rng.range(0.55, 1), y = rng.range(-7, 7), x = Math.cos(a) * r, z = Math.sin(a) * r, tx = -Math.sin(a), tz = Math.cos(a), s = rng.range(1.5, 2.1);
        for (const wing of [-1, 1]) SW.add(x + Math.cos(a) * wing * s * 0.36, y, z + Math.sin(a) * wing * s * 0.36, Math.cos(a) * wing + tx * 0.7, 0.25, Math.sin(a) * wing + tz * 0.7, 0, 1, 0, s, s * 0.3, rng.chance(0.5) ? ROLE.IRIS : ROLE.DEEP, 1, KIND.CURL, 0, false);
      }
      g.position.set(f.x, f.y, f.z); g.userData = { y: f.y, w: rng.range(0.22, 0.34) * rng.sign(), ph: rng() * 6.283 };
      flocks.push({ g, batch: SW }); scene.add(g);
    }
    await Y();

    // ---- the hero: white noon at the footbridge, with the pond it stands in (one water for the whole lower valley)
    // (THE HEM LAW goes with it: the lift over the line for its wisteria racemes, in the hero's own frame, with each raceme's own lift by place)
    const hero = await buildHero(ctx, { style, detail, waterRadius: 900, hem: { floor: (x, z) => { const q = lineAt(x, BRIDGE_Z + z); return q[0] <= HEM.PART ? q[1] + HEM.CLEAR + HEM.RACE * hemHash(x, z) : -Infinity; }, min: HEM.RMIN } });
    hero.object.position.set(0, 0, BRIDGE_Z);
    scene.add(hero.object);
    await Y();
    for (const w of hero.anchors.willows) dblMass(MIR, w.base.x, BRIDGE_Z + w.base.z, w.radius * 0.82, w.top.y * 0.95, ROLE.FOLIAGE);   // the bridge's two willows have their doubles too

    // ---- meshes. Order: sky (-2), pond water (-0.6, in the hero), reflections (-0.5), then forms and touches.
    const mTouch = style.touchMaterial(), mFar = style.touchMaterial(), mRefl = style.touchMaterial({ reflect: true });
    mFar.uniforms.uAir = { value: new THREE.Vector3(3200, 4000, 0.85) };          // authored-size touches: they never grow or drop out
    const mGround = style.canvasMaterial({ small: [0.34, 0.09], large: [1.5, 0.4], chink: 0.055 });
    const mStream = style.canvasMaterial({ water: true, slide: 0.35, small: [0.7, 0.13], large: [2.6, 0.5], chink: 0.05 });
    const mWeir = style.canvasMaterial({ water: true, slide: 3.2, flow: 1, small: [0.8, 0.16], large: [2.2, 0.5], chink: 0.1 });
    const mSky = style.canvasMaterial({ small: [2.4, 0.55], large: [10, 2.3], chink: 0.012 });
    mSky.depthTest = false; mSky.depthWrite = false;
    const mSkyT = style.touchMaterial(); mSkyT.depthTest = false; mSkyT.depthWrite = false;
    mSkyT.uniforms.uAir = mFar.uniforms.uAir;
    const skyFront = { value: new THREE.Vector4(HOUR.DAWN, HOUR.DAWN, 0, 1) };
    for (const m of [mSky, mSkyT]) {
      m.uniforms.uCloud = { value: new THREE.Vector3(-1e5, 60, 0) }; m.uniforms.uCastOn = { value: 0 };
      m.uniforms.uFront = skyFront; m.uniforms.uCourse = { value: new THREE.Vector4(0, 0, 0, 0.9) };
    }
    const skyMesh = SKY.mesh(mSky); skyMesh.renderOrder = -2; skyMesh.frustumCulled = false; skyGroup.add(skyMesh);
    const skyT = TSky.mesh(mSkyT); skyT.renderOrder = -1.9; skyGroup.add(skyT);
    scene.add(skyGroup);
    await Y();
    const mHills = style.canvasMaterial({ small: [9, 2.2], large: [42, 10], chink: 0.03 }); mHills.uniforms.uAir = mFar.uniforms.uAir;
    const hills = HILLS.mesh(mHills); hills.name = 'hills'; hills.frustumCulled = false; scene.add(hills);
    const mWall = style.canvasMaterial({ small: [0.5, 0.13], large: [1.5, 0.4], chink: 0 });
    const walls = WALLS.mesh(mWall); walls.name = 'foliage walls'; walls.frustumCulled = false; scene.add(walls);
    await Y();
    // the doubles' under-forms: after the water (which writes no depth), before the drags laid on them; they write no depth
    const mDbl = style.canvasMaterial({ double: true, small: [0.9, 0.16], large: [3.2, 0.62], chink: 0 }); mDbl.depthWrite = false;
    const mDblS = style.canvasMaterial({ double: true, small: [0.9, 0.16], large: [3.2, 0.62], chink: 0 }); mDblS.depthWrite = false; mDblS.depthTest = false;
    const mir = MIR.mesh(mDbl); mir.name = 'pond doubles'; mir.renderOrder = -0.55; mir.frustumCulled = false; scene.add(mir);
    const mirS = MIRS.mesh(mDblS); mirS.name = 'stream doubles forms'; mirS.renderOrder = -0.455; mirS.frustumCulled = false; scene.add(mirS);
    await Y();
    const terrain = GT.mesh(mGround); terrain.name = 'valley'; terrain.frustumCulled = false; scene.add(terrain);
    await Y();
    const ground = G.mesh(mGround); ground.name = 'forms'; ground.frustumCulled = false; scene.add(ground);
    await Y();
    await Y();
    const stream = FW.mesh(mStream); stream.name = 'stream'; stream.renderOrder = -0.46; scene.add(stream);
    const weir = WEIR.mesh(mWeir); weir.name = 'weir'; scene.add(weir);
    const mReflS = style.touchMaterial({ reflect: true, brk: BRK.STREAM }); mReflS.depthTest = false; mReflS.depthWrite = false;
    const reflS = RS.mesh(mReflS); reflS.name = 'stream doubles'; reflS.renderOrder = -0.45; scene.add(reflS);
    const zoned = (batch, mat, name, z0, z1, x0, x1) => {
      const m = batch.mesh(mat); m.name = name;
      if (z0 !== undefined) { m.frustumCulled = true; m.geometry.boundingSphere = new THREE.Sphere(V3((x0 + x1) / 2, 14, (z0 + z1) / 2), Math.hypot((x1 - x0) / 2, (z1 - z0) / 2, 30)); }
      scene.add(m); return m;
    };
    const mF = zoned(TF, mTouch, 'field touches', -40, 190, -340, 130); await Y();
    const part = (b, i0, i1) => Object.assign(Object.create(TouchBatch.prototype), { A: b.A.subarray(i0 * 16, i1 * 16), n: i1 - i0 });
    const mS0 = zoned(part(TS, 0, popCut), mTouch, 'upstream poplars', -30, 210, 0, 150);
    const mS = zoned(part(TS, popCut, TS.n), mTouch, 'stream touches', -30, 310, -140, 150), mL = zoned(TL, mTouch, 'sluice touches', 240, 320, -55, 30); await Y();
    const mP = zoned(TP, mTouch, 'pond touches', 300, 1060, -110, 240), mE = zoned(TE, mTouch, 'exit touches', 760, 1250, 0, 330); await Y();
    const mW = zoned(TW, mTouch, 'bank and water touches', 300, 680, -110, 110), mW2 = zoned(TW2, mTouch, 'far bank and water touches', 640, 1060, -70, 240); await Y();
    zoned(TFar, mFar, 'far touches');
    for (const f of flocks) { const m = f.batch.mesh(mFar); m.name = 'swallows'; f.g.add(m); }
    const boatHull = BF.mesh(mGround), boatT = BT.mesh(mTouch), boatR = BR.mesh(style.touchMaterial({ reflect: true, brk: BRK.NONE })); boatR.renderOrder = -0.5;   // the rowboat's few short doubles are never broken (BRK in the part)
    boat.add(boatHull, boatT, boatR); scene.add(boat);
    await Y();
    const refl = zoned(RP, mRefl, 'pond reflections', 280, 1100, -110, 260); refl.renderOrder = -0.5;
    await Y();

    // ---- the day. Four fronts, each passing us at a fixed place and running ahead at four times our own progress.
    const fronts = [
      { z: 85, a: HOUR.MORNING, b: HOUR.DAWN }, { z: 250, a: HOUR.NOON, b: HOUR.MORNING },
      { z: 585, a: HOUR.SUNSET, b: HOUR.NOON }, { z: 770, a: HOUR.DUSK, b: HOUR.SUNSET },
    ];
    const poiV = new THREE.Vector3(), camP = new THREE.Vector3(), tmp = new THREE.Vector3(), lightNow = new THREE.Vector3();
    const setDay = (u) => {
      path.pointAt(u, tmp); const zc = tmp.z;
      let k = 0; while (k < fronts.length - 1 && zc > fronts[k + 1].z - 28) k++;
      const f = fronts[k], s = zc - f.z, place = f.z + 4 * s + (s > 0 ? 0.04 * s * s + 0.0015 * s * s * s : 0);
      style.setHours(f.a, f.b, place, 46);
      skyFront.value.set(f.a, f.b, (place - zc) / 46 * 0.8, 1);   // the sky turns touch by touch as the front runs out ahead of us, the same all round
      lightNow.copy(LIGHTS[f.b]).lerp(LIGHTS[f.a], sstep(-8, 55, s)).normalize(); U.uLight.value.copy(lightNow);
      // the gust that silvers the poplars one after another (from d 200), outrunning us
      const sg = zc - 196; U.uGust.value.set(196 + 3.2 * sg, 26, sstep(-4, 6, sg) * (1 - sstep(60, 95, sg)));
      // the violet cloud shadow: it comes up from behind, its middle is over us at d 700 and it runs on ahead at two and a half times
      // our progress (the design says one and a half: at that pace a shadow 110 m long could not pass us inside the sunset stretch)
      const sc = zc - 700; U.uCloud.value.set(700 + 2.5 * sc, 55, noShadows ? 0 : sstep(-70, -40, sc) * (1 - sstep(110, 150, sc)));
      U.uLily.value = sstep(600, 760, zc);                       // the lilies close toward evening
      U.uTwinkle.value = lerp(0.5, 0.16, sstep(140, 300, zc));   // the frost field twinkles most
      if (rare) {                                                // the fog lifting: it stands on the stream, leaves the nearest eight poplars, and the noon front tears it off
        const st = zc - 248, edge = Math.max(172, zc + 22) + (st > 0 ? 9 * st + 0.3 * st * st : 0);
        U.uFog.value.set(edge, 30, 24, 1);
      }
      return zc;
    };
    setDay(0);
    await Y();

    const portal = { shape: 'arch', width: 14, height: 10, color: '#F2A27A', glow: 0, halo: false, veil: '#F2A27A', blendDistance: 25, revealDistance: 300 };
    return {
      scene, path, duration: 42,
      pace: (u) => 1.15 - 0.55 * sstep(0.31, 0.37, u) * (1 - sstep(0.52, 0.58, u)) - 0.15 * sstep(0.86, 0.92, u),
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 22, sway: 0.5, bank: 0.3, nearThrough: 0.3 },
      pois: [
        { at: V3(stacks[0].x - 2, stacks[0].y + 6, stacks[0].z), from: uAtZ(stacks[0].z - stacks[0].r - 45), to: uAtZ(stacks[0].z - stacks[0].r), weight: 0.5 },   // the near stack's thatch, 6 m off: 45 m of looking, let go at the drum's near edge (its radius before its middle is abeam)
        { at: V3(0, 7, BRIDGE_Z), from: uAtZ(284), to: uAtZ(BRIDGE_Z - 20), weight: 0.5 },
        { at: (time, u) => path.posAtDist(Math.min(L, u * L + 36), poiV).setY(-13), from: uAtZ(430), to: uAtZ(565), weight: 0.8 },   // the pond: water past mid frame (a point 36 m ahead on the course, below the water)
        { at: V3(BOAT.x, 0.4, BOAT.z), from: uAtZ(BOAT.z - 55), to: uAtZ(BOAT.z - 2), weight: 0.7 },   // the rowboat, from 55 m off until 2 m before it is abeam
        { at: END.clone(), from: uAtZ(700), to: uAtZ(END.z - EDIR.z * 90), weight: 0.4 },   // the landing, until the first rose arch
      ],
      portal,
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);                             // style.frame: time, eye, view size
        camera.getWorldPosition(camP); skyGroup.position.copy(camP);
        const zc = setDay(u);
        // what cannot be seen from this stretch is not drawn (instance counts only: nothing is made, nothing compiles).
        // The pond's batches come on where the field's go off (z 235, was 256): the hem law leaves the sluice willows parted
        // over the line for good, and the pond shows through that parting from far up the stream. They cannot come on any
        // sooner: with the field's touches still drawn the page would pass 500,000 triangles.
        const pondOn = zc > 235, set = (m, n) => { if (m.geometry.instanceCount !== n) m.geometry.instanceCount = n; };
        set(mF, zc < 235 ? TF.n : 1); set(mS0, zc < 256 ? popCut : 1); set(mS, zc < 297 ? TS.n - popCut : 1); set(reflS, zc < 297 ? RS.n : 1);
        const far = zc > 330;                                      // beyond the nave and round the bend: hidden from the stream and the sluice
        set(mP, pondOn ? TP.n : 1); set(mE, far ? TE.n : 1); set(mW2, far ? TW2.n : 1); set(refl, far ? RP.n : pondOn ? rNear : 1); set(mW, pondOn ? TW.n : 1);
        mirS.position.y = zc < 297 ? 0 : -1e4;                    // the stream's doubles are left behind at the weir
        // the boat rocks at its mooring (or turns slowly adrift): a loop with no beginning
        boat.rotation.set(0.05 * Math.sin(time * 1.1), BOAT.yaw + (boatAdrift ? 0.25 * Math.sin(time * 0.17) : 0.05 * Math.sin(time * 0.4)), 0.09 * Math.sin(time * 0.83));
        skyT.rotation.y = time * 0.012;                            // the cloud touches drift
        for (const f of flocks) { const d = f.g.userData; f.g.rotation.y = d.ph + time * d.w; f.g.position.y = d.y + 3 * Math.sin(time * 0.31 + d.ph); }
        boat.position.set(BOAT.x + (boatAdrift ? 0.8 * Math.sin(time * 0.21) : 0), 0.04 * Math.sin(time * 1.3), BOAT.z);
      },
      dispose() { hero.dispose(); style.dispose(); },
    };
  },
};
