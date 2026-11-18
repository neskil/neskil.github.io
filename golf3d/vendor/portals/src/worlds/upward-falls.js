// The Day the Falls Flew Up: a Patagonian gale on a turquoise lake under the Cuernos, and the waterfalls going the wrong way.
//
// SPACE: +X is east, out over the lake; -Z is north, up the bay (the way the line sets out and the way the gale runs);
// y = 0 is the lake. The wall's foot runs straight north beside the shore and on past the main horn's cove, then sweeps
// east round the head of the bay. q = metres along it (q = 0 abreast of the entry), d = metres out from it toward the
// lake (negative inside the rock). The wall is one mesh on a (q, d) grid: shore strip, talus, granite apron with fall
// alcoves and forested gullies, the hanging bench, the horns with their shale caps. The cove under the long fall is cut
// into it askew, opening toward the morning sun; its rock, and the buttress before it, are modelled on two skins that
// stand in front of the grid. The towers out in the lake are a mesh of their own, and so is the fin with its arch.
//
// THE FLIGHT (laid metres, table RT), six acts:
//   the shore: 9 m over the steppe beside the moraine ridge, the wall and its falls to the left under the storm deck,
//     the towers ahead on the lake;
//   among the towers: out over the beach and the surf in a right-hand curve, 10 m over the water, then back to the left
//     through an archipelago of granite towers, tall rock on one side or both, the wall seen between them;
//   the arch: the line runs up the bay and in toward the wall, and passes 13 m up through the arch of a granite fin that
//     stands out from the wall into the lake, the head of the bay seen through the opening;
//   along the wall: lifted by the gust to 30 m, 150 to 200 m out from the wall's foot, the look led 30 degrees toward
//     the wall: the bench's falls one after another, condors on the updraft, the gust front on the lake;
//   out and round: out over the lake, then a long left-hand curve round four more towers, condors on the wind between
//     them, down to 8 m over the water, the cove's mouth and the long fall coming ahead;
//   the climb: up at RT.rise degrees to a gate that stands RT.fallAhead metres before the long fall's foot, the fall
//     ahead from its lip to its foot.
//
// PLACED AGAINST THE LINE: the towers, the fin, the condors' stations, the geese's beach, the guanacos and the tall
// notro and nirre beside its first 230 m stand at laid metres of the flown line and metres to its side that are typed in
// the source (a number, or a span a seed draws within), by the same rule on every seed, and each stands so for the
// whole stretch in which it is met.
//
// ONE GALE LAW (parts file) in the world's own time drives the dark sheet and whitecaps on the lake, the grass, the
// crowns, the petals, the guanacos' lean and every fall's state; where in its period a visit begins is dealt by the
// seed. Two things read the flight's share of the route: the look's windows and the pace, both made of the route
// table's own breakpoints. Four things are MOVED by where the eye IS (never by where it looks): the geese flush as it
// passes the laid metres 196 to 235, which is 37 to 122 m before it is abreast of them; ribbons and puffs turn their
// flat side to it (a water strand, a ribbon of a blown fall's climbing rope and banner, and a drop flung from the banner
// are also kept a pixel and a half, the drop a pixel and a third, wide as seen from there); a puff of mist steps
// toward it by up to 0.3 of its own size, so that its square is not cut by the rock it climbs; and the sky's dome is
// drawn round it. Shading reads the eye's place for the lake's mirror, the shine of wet rock and water, the haze
// behind the far ranges, the brightness of mist against the sun and its bow, which long edge of a veil of a blown fall's
// plume is its upper one and which looks to the sun as seen from there, the round of the rope's filaments and the
// light through its spray and drops against the sun (the same at every place), and for which side of a leaf's sheet
// (never a blade of grass) or of a wing is turned to it.
// THE CONDORS' GUARD BY PLACE: at the build every condor's whole wheel (its round, its rise and fall, its wings spread)
// must keep 3.0 m from every tower's and the wall's rock and 2.3 m from the flown line; a station that cannot is moved
// straight out from the nearest rock by what is wanting, or, if 25 m of that does not mend it, is not made; its draws
// are taken either way (facts: clear.condorRock, counts.condorsMoved, counts.condorsNotMade). The build asks 4.3 m of
// its own measure of the rock: the 1.3 m in hand covers the 1 m lattice that measure searches and the skins' cells.
// THE ROCK SEEN FROM NEAR shows its small things (a lit lip under a bed's joint, the whole shadow under a bed that
// stands out, crusts of lichen, the grain, joints on the modelled rock) by the pixel's footprint alone: full where a
// pixel covers under about 9 cm of the rock, gone where it covers over about 22 cm (how far off that is goes by the
// eye's distance, the picture's size and how aslant the face is seen); it hides, moves and removes nothing.
// HOURS: both are storm light under a low sun: the first sun after the night's storm, or the storm breaking later the
// same morning. A RARE visit brings a whole wing of condors over the leg along the wall.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import { buildHero, makeGale, makeNoiseTexture, GLSL_NOISE, GLSL_GALE, GLSL_LIGHT } from '../parts/upward-falls.js';

const D2R = Math.PI / 180, FOV = 62;                               // (FOV: the field of view this world hands the engine, degrees)
const sat =(x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

// ---------- THE ROUTE TABLE: every place on the flown line, in laid metres from the entry ----------
const RT = {
  shoreEnd: 180,       // level along the shore strip
  // the turns of the line: [from, to, degrees], + to the right
  turns: [
    [180, 300, 50],    // out over the beach and the surf
    [320, 455, -64],   // left among the towers: from here it runs up the bay and in toward the wall, to the arch
    [590, 790, 34],    // through the arch and along the wall, drawing slowly out from it
    [790, 880, 34],    // out over the lake
    [975, 1235, -164], // the long left turn that brings the cove's mouth and the long fall dead ahead
  ],
  towersIn: 318,       // the first tower comes abreast
  towerTall: 496,      // the 82 m tower comes abreast, 43 m to the left: no tower as tall stands between it and the fin
  towerLast: 552,      // the last tower the line passes near comes abreast, 39 m to the left: the two beyond stand 64 m off and more
  towersOut: 585,      // the last one falls behind
  arch: 612,           // the line passes through the arch
  wallOpen: 662,       // the fin's far face is 36 m behind and the lift 36 m under way: the wall stands open on the left
  liftFrom: 626,       // the gust begins to lift the line
  liftTo: 725,         // the line is up at the wall leg's height
  wallTo: 850,         // the leg along the wall ends: the line swings out over the lake
  lowFrom: 1010,       // the descent toward the water begins
  low: 1185,           // down at the low height
  riseFrom: 1225,      // the last climb begins: up toward the gate, the long fall whole ahead
  end: 1310,
  fallOver: 100,       // metres from the last turn's first metre in which the eye's rest goes over from the wall to the long
                       // fall: over them the line swings the first 54 of that turn's 164 degrees toward the cove
  eyeShore: 9, eyeTowers: 10, eyeArch: 13, eyeWall: 30, eyeLow: 8,   // metres over the ground / the water
  rise: 24,                                                    // degrees: how steeply the line climbs to its gate
  gateRadius: 7,
  wallOff: 118,                                                // the shore leg runs this far out from the wall's foot
  fallAhead: 300,                                              // the long fall's foot stands this far beyond the line's end (plan metres)
  // the cove, in the wall's own frame (metres along the foot from the mouth's middle, metres into the rock): its mouth
  // reaches coveS to the south and coveN to the north of its middle; its two sides run back into the rock at coveSkew
  // degrees south of square, so that it opens toward the morning sun; at the long fall's foot, coveBack metres in, it
  // is coveEnd to either side; the fall's own line stands fallDq along the foot from the mouth's middle
  coveS: 92, coveN: 92, coveSkew: 20, coveBack: 120, coveEnd: 66, fallDq: -48,
};
const heading = (s) => { let h = 0; for (const [a, b, deg] of RT.turns) h += deg * sstep(a, b, s); return h; };

// ---------- the wall's foot ----------
// (BAY_ARM: north of the cove the foot runs straight on this far, then sweeps east round the head of the bay on BAY_R)
const DQ = 4, Q_SOUTH = -430, Q_NORTH = 2800, BAY_ARM = 340, BAY_R = 600;

// ---------- the hours ----------
// Both are storm light: a low morning sun in the north-east (this is the south of the world), ahead of the flight and
// to its right, raking down the wall from its far end, so that every buttress shows a lit face and a dark flank; a
// slate-blue storm deck standing beyond and above the wall, torn open toward the sun; clear air over the open lake.
// (colours are linear; zen, hor: the clear sky; deckLo, deckHi: the deck low behind the horns and high overhead; deckLit:
// its edges where the sun comes through; gap: how wide the deck stands open round the sun's bearing (cosines: closed
// beyond the first, open within the second); scud: how deep the drifting cloud shadows are, and 1 / their size)
const LOOKS = {
  // the storm breaking later the same morning: a silver-gold sun 20 degrees up through gaps in the deck, broad cloud
  // shadows drifting over wall and lake
  day: { sunEl: 20, sunAz: 46, sun: [1.0, 0.86, 0.66], sunK: 1.7, sky: [0.2, 0.34, 0.72], skyK: 0.42, bounce: [0.1, 0.24, 0.24],
    zen: [0.1, 0.24, 0.5], hor: [0.68, 0.71, 0.72], deckLo: [0.04, 0.055, 0.095], deckHi: [0.11, 0.145, 0.21], deckLit: [1.25, 1.02, 0.74], glow: [1.0, 0.8, 0.55], gap: [0.48, 0.97],
    fog: [0.42, 0.48, 0.6], fogD: 0.0004, exposure: 1.0, scud: 0.8, scudSize: 1 / 2100, portal: '#fff1d6' },
  // first sun after the night's storm: 12 degrees up, the granite orange-pink, the shadows blue-violet
  golden: { sunEl: 12, sunAz: 54, sun: [1.0, 0.6, 0.34], sunK: 1.95, sky: [0.22, 0.27, 0.74], skyK: 0.42, bounce: [0.14, 0.2, 0.2],
    zen: [0.14, 0.24, 0.5], hor: [0.95, 0.7, 0.5], deckLo: [0.05, 0.055, 0.105], deckHi: [0.13, 0.13, 0.22], deckLit: [1.4, 0.8, 0.46], glow: [1.0, 0.62, 0.34], gap: [0.3, 0.93],
    fog: [0.56, 0.47, 0.54], fogD: 0.0004, exposure: 1.0, scud: 0.4, scudSize: 1 / 2600, portal: '#ffe6c0' },
};

export default {
  id: 'upward-falls',
  name: 'The Day the Falls Flew Up',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1, rare = !!vary.rare;
    // the hour: the storm breaking in mid-morning unless the first sun is asked for (or dealt, three visits in ten, when any hour will do)
    // (the hour's own draw is always taken, so that a visit has the same land and life whichever hour it is given)
    const earlyDealt = rng.fork('hour').chance(0.3);
    const lookId = vary.hour === 'golden' || vary.hour === 'dawn' ? 'golden' : vary.hour === 'any' && earlyDealt ? 'golden' : 'day', L = LOOKS[lookId];
    const scene = new THREE.Scene();
    const instanced = [];                                            // every instanced mesh this build makes: released in dispose
    const n2 = noise.n2;
    await ctx.yield();

    // ---------- the gale: one period for the whole visit ----------
    // (its fronts cross the line on which run = 0, which passes through the wall's foot abreast of the entry, once a
    // period; at which second of the world's clock is `start`, dealt at the end of the build)
    const gale = makeGale({ period: rng.range(18.5, 20.5), wave: 1250, skew: 0.45 });
    const WIND = new THREE.Vector2(0.62, -0.785).normalize();          // the gale blows north-east: along the bay and out over the lake

    // ---------- the flown line in plan, from the route table alone: [x, z] at every laid metre ----------
    // (the plan is laid first; the bay, its cove and the stacks are then built round it)
    const laid = [];
    { let x = RT.wallOff, z = 0; for (let s = 0; s <= RT.end; s++) { laid.push([x, z]); const h = heading(s + 0.5) * D2R; x += Math.sin(h); z -= Math.cos(h); } }
    const endHead = heading(RT.end) * D2R, EX = Math.sin(endHead), EZ = -Math.cos(endHead);       // the way the line runs at its end
    // the long fall's foot stands dead ahead of the line's end; the cove's mouth and the wall's own line are found from it
    const FALL_X = laid[RT.end][0] + EX * RT.fallAhead, FALL_Z = laid[RT.end][1] + EZ * RT.fallAhead;
    const WALL_X = FALL_X + RT.coveBack, MOUTH_Z = FALL_Z + RT.fallDq;                            // (north is -z)
    // ---------- the wall's foot in plan: straight north beside the shore and on up the bay past the cove (between the
    // two it steps sideways to the cove's line, over a run long enough that its bend is nowhere tighter than the wall's
    // grid is deep), then an arc east round the head of the bay ----------
    const FOOT_PTS = [[0, 760], [0, 380], [0, 0], [0, -90], [WALL_X, -410]];                    // [x, z]
    { // (the extra points to either side keep the foot dead straight across the cove)
      for (const al of [-170, -150, 0, 150, 170]) FOOT_PTS.push([WALL_X, MOUTH_Z - al]);
      const z0 = MOUTH_Z - BAY_ARM; FOOT_PTS.push([WALL_X, z0]);
      for (let k = 1; k <= 6; k++) { const a = (k * Math.PI) / 12; FOOT_PTS.push([WALL_X + BAY_R * (1 - Math.cos(a)), z0 - BAY_R * Math.sin(a)]); }
      for (const al of [400, 800, 1200]) FOOT_PTS.push([WALL_X + BAY_R + al, z0 - BAY_R]);
    }
    // ---------- the wall's foot: places and lake-side normals every DQ metres ----------
    const footCurve = new THREE.CatmullRomCurve3(FOOT_PTS.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
    footCurve.arcLengthDivisions = 1200;
    await ctx.yield();
    const footLen = footCurve.getLength(), q0Arc = 760;                // the entry is abreast of the third point: the curve is straight up to it
    const NF = Math.floor(footLen / DQ), FX = new Float32Array(NF + 1), FZ = new Float32Array(NF + 1), FNX = new Float32Array(NF + 1), FNZ = new Float32Array(NF + 1);
    await ctx.yield();
    { const P = new THREE.Vector3(), Tn = new THREE.Vector3();
      for (let i = 0; i <= NF; i++) { const a = Math.min(1, (i * DQ) / footLen); footCurve.getPointAt(a, P); footCurve.getTangentAt(a, Tn); const hl = Math.hypot(Tn.x, Tn.z) || 1;
        FX[i] = P.x; FZ[i] = P.z; FNX[i] = -Tn.z / hl; FNZ[i] = Tn.x / hl; if (i % 250 === 249) await ctx.yield(); } }
    await ctx.yield();
    const QMIN = -q0Arc, QMAX = NF * DQ - q0Arc;
    // (q, d) -> world; out = { x, z, nx, nz }
    const toWorld = (q, d, o) => { const f = Math.min(NF - 1.001, Math.max(0, (q - QMIN) / DQ)), i = Math.floor(f), t = f - i;
      const nx = mix(FNX[i], FNX[i + 1], t), nz = mix(FNZ[i], FNZ[i + 1], t), nl = Math.hypot(nx, nz) || 1;
      o.nx = nx / nl; o.nz = nz / nl; o.x = mix(FX[i], FX[i + 1], t) + o.nx * d; o.z = mix(FZ[i], FZ[i + 1], t) + o.nz * d; return o; };
    // world -> (q, d): the nearest place on the foot; `hint` (an index) makes it a short search for a neighbour of the last answer
    const nearOut = { q: 0, d: 0, i: 0 };
    const nearest = (x, z, hint = -1) => {
      let bi = 0, best = Infinity;
      if (hint >= 0) { for (let i = Math.max(0, hint - 14); i <= Math.min(NF, hint + 14); i++) { const dx = x - FX[i], dz = z - FZ[i], dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } } }
      else { for (let i = 0; i <= NF; i += 5) { const dx = x - FX[i], dz = z - FZ[i], dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } }
        const a = Math.max(0, bi - 5), b = Math.min(NF, bi + 5); for (let i = a; i <= b; i++) { const dx = x - FX[i], dz = z - FZ[i], dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } } }
      // along the tangent at that point (the tangent is the normal turned a quarter)
      const tx = FNZ[bi], tz = -FNX[bi], al = (x - FX[bi]) * tx + (z - FZ[bi]) * tz;
      nearOut.q = QMIN + bi * DQ + Math.max(-DQ, Math.min(DQ, al)); nearOut.d = (x - FX[bi]) * FNX[bi] + (z - FZ[bi]) * FNZ[bi]; nearOut.i = bi; return nearOut; };

    // ---------- what stands along the wall ----------
    const lay = rng.fork('lay');
    // nine falls: seven off the bench's lip, one beside the col, one down the main horn's granite foot (two seep falls
    // on the cove's north side are added further on, laid on the cove's skin)
    // the long fall comes down into the cove that the line ends in: QM is the fall's own line along the foot, QMO the
    // middle of the cove's mouth
    const QM = Math.round(nearest(FALL_X, FALL_Z).q), QMO = QM - RT.fallDq;
    const COVE_BACK = RT.coveBack, COVE_LIP = COVE_BACK + 72, COVE_TAN = Math.tan(RT.coveSkew * D2R);   // metres in from the mouth: the long fall's foot, and its lip
    // the cove's middle line at a depth, and how far a place stands to the north of it (metres along the foot)
    const coveOff = (q, w) => q - QMO + COVE_TAN * Math.min(Math.max(w, 0), COVE_BACK);
    // the cove's own rock is a skin of rays that go out level from one place over its water (cq along the foot, cw metres
    // in), from under the water to `top`, its columns `du` apart; behind the long fall the land's own face is set back by
    // `niche` metres over the fall's breadth, and the skin roofs that niche at `roof`
    const SK = { cq: QMO - COVE_TAN * 55, cw: 55, top: 170, du: 2.7, roof: 37, niche: 11 };
    const nicheIn = (lat) => 1 - sstep(27, 34, Math.abs(lat + 1));   // 1 inside the niche's breadth (lat: metres along from the fall's line)
    // two seep falls come down the cove's north side, which stands in the shade: [metres along the cove's rock north of
    // the long fall's line, the height each starts at]
    const SEEPS = [[63, 132], [86, 104]];
    // the fin that carries the arch stands square across the line at the laid metre RT.arch and runs in to the wall.
    // FIN: where the line crosses it; its own two ways in plan (a: out toward the lake, b: the way the line runs through
    // it); root: metres from the crossing in to the wall's foot; q: where along the foot it meets the wall
    const FIN = (() => { const h = heading(RT.arch) * D2R, p = laid[RT.arch]; return { x: p[0], z: p[1], ax: Math.cos(h), az: Math.sin(h), bx: Math.sin(h), bz: -Math.cos(h), root: 0, q: 0 }; })();
    { let a = 0; while (a > -400 && nearest(FIN.x + FIN.ax * a, FIN.z + FIN.az * a).d > 0) a -= 2; FIN.root = -a; FIN.q = Math.round(nearOut.q); }
    // In the fin's own frame (a: metres out toward the lake from where the line crosses it, b: metres along the line's
    // run, y) it is a slab: finTop its crest, finHalf half its thickness; the opening's outline is a boxy arch from the
    // water up (hw: half its width at the water, top: its crown, p: how square its shoulders); toward the lake the fin
    // ends at `tip`; `body`: where the rock about the opening gives way to the plain run in to the wall.
    const AR = { hw: 30, top: 48, p: 2.6, body: 62, tip: 66 };
    const finTop = (a) => { const e = sat((a - 46) / (AR.tip - 46)); return (74 + 14 * sstep(-110, -40, a) + 4 * n2(a * 0.03 + 5.5, 7.7)) * (1 - Math.pow(e, 2.2)) - 3 * e; };
    const finHalf = (a, y) => (13 + 2.5 * n2(a * 0.04, 3.3) + 4 * sstep(-60, -160, a)) * Math.sqrt(sat((AR.tip - a) / 14)) * (1 - 0.7 * Math.pow(sat((y + 3) / Math.max(1, finTop(a) + 3)), 1.4));
    // how far a place stands outside the fin's rock (metres, roughly; negative inside)
    const finOut = (a, b, y) => { const open = (Math.pow(Math.abs(a) / AR.hw, AR.p) + Math.pow(Math.max(0, y + 3) / (AR.top + 3), AR.p) - 1) * 14;
      return Math.max(y - finTop(a), Math.abs(b) - finHalf(a, y), -open, a - AR.tip); };
    const finW = (a, b, o) => { o.x = FIN.x + FIN.ax * a + FIN.bx * b; o.z = FIN.z + FIN.az * a + FIN.bz * b; return o; };
    // five bench falls: three beside the shore leg and the towers' water, two on the leg along the wall beyond the fin
    // (these two the broadest, each in a wide shallow alcove that stands open to the lake); two more come off the bench
    // round the head of the bay beyond the cove, where the wall turns to face down the lake
    // (the first stands well up the shore from the entry: abreast of the laid metre 215)
    const FALL_Q = [215, 330, FIN.q - 106, FIN.q + 102, FIN.q + 190], FALLS_NORTH = [QM + 600, QM + 880];
    // (half: half the alcove's breadth at the lip; back: how far back its headwall stands, as a share of the apron's depth)
    const FALLS = [0, 1, 2, 3, 4, 5, 6].map((i) => { const open = i === 3 || i === 4;
      return { q: (i < 5 ? FALL_Q[i] : FALLS_NORTH[i - 5]) + lay.range(-8, 8), width: lay.range(7, 13.5) * (i < 5 && !open ? 1 : 0.3) + (i < 5 && !open ? 0 : 12.5), kind: 'lip', half: open ? 25 : 21, back: open ? 0.62 : 0.86 }; });
    FALLS.push({ q: QM + 330 + lay.range(-10, 10), width: 15, kind: 'col', half: 21, back: 0.86 }, { q: QM, width: 38, kind: 'long', half: 21, back: 0.86 });
    // forested gullies cut back through the bench between the falls south of the fin, and beyond the cove
    const GULLIES = [-210, 20];
    for (let i = 0; i < 4; i++) { const take = lay.chance(0.35); if (i === 0 || (i === 1 && take)) GULLIES.push((FALLS[i].q + FALLS[i + 1].q) * 0.5 + lay.range(-6, 6)); }
    GULLIES.push(QM + 225, QM + 460, QM + 760, QM + 1060);
    // the horns: [q, how far behind the foot, tip height, reach along the wall, reach across]
    // (and the cosine and sine of how its pyramid is turned in plan; where the foot curves, the ground behind it fans out,
    // so a horn's reach along the foot is cut by as much as its own ground is stretched: by 2.5 at most, and it is never
    // lengthened)
    const fan = (q, w) => { const a = toWorld(q - 10, -w, {}), b = toWorld(q + 10, -w, {}); return Math.min(2.5, Math.max(1, Math.hypot(b.x - a.x, b.z - a.z) / 20)); };
    const HQ = (QM - 6 - 110) / 3, MAIN = 4;                          // (the horns stand evenly up the bay to the main horn, the last of them)
    const HORNS = [[-320, 385, 640, 250, 215], [110, 390, 700, 245, 215], [110 + HQ, 380, 760, 255, 220], [110 + 2 * HQ, 392, 690, 240, 210],
      [QM - 6, 335, 900, 310, 290], [QM + 430, 380, 640, 250, 210], [QM + 830, 385, 560, 260, 210], [QM + 1230, 385, 500, 270, 210]].map((h) => { const rot = lay.range(-0.55, 0.55), q = h[0] + lay.range(-25, 25);
      // (a horn is no cone: a broad body with a shoulder, a blunt summit tower, two side spires with a notch between each
      // and the summit, and buttresses running down from it; x: how steep each of its four sides, the spires
      // [along, across, girth, height as a share of the horn's], where its buttresses stand)
      const x = { side: [lay.range(0.82, 1.2), lay.range(0.82, 1.2), lay.range(0.85, 1.15), lay.range(0.85, 1.15)],
        spires: [[lay.range(0.24, 0.36) * (lay.chance(0.5) ? 1 : -1), lay.range(-0.16, 0.1), lay.range(0.1, 0.15), lay.range(0.5, 0.7)], [lay.range(-0.12, 0.12), -lay.range(0.2, 0.32), lay.range(0.09, 0.13), lay.range(0.36, 0.56)]],
        butt: lay.range(0, 6.283) };
      return [q, h[1], h[2] * lay.range(0.97, 1.03), h[3] / fan(q, h[1]), h[4], Math.cos(rot), Math.sin(rot), x]; });
    HORNS[MAIN][0] = QM - 6; HORNS[MAIN][2] = 900; HORNS[MAIN][3] = 310 / fan(QM - 6, 335); HORNS[MAIN][5] = Math.cos(0.3); HORNS[MAIN][6] = Math.sin(0.3);
    await ctx.yield();

    // ---------- the land's height: a profile across the wall at every q ----------
    const smax = (a, b, k) => { const h = sat(0.5 + (0.5 * (a - b)) / k); return mix(b, a, h) + k * h * (1 - h); };
    const blockOf = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };   // a number for a block of rock
    const stair = (h, S) => { const t = h / S, i = Math.floor(t), f = t - i; return (i + sstep(0.22, 0.78, f)) * S; };
    // the rock of the cove and of the fin is a pile of courses some 13 m high that wander a little as they run, each cut
    // into great blocks some 22 m long; a block stands out of the face by an amount of its own, and its own face is a
    // little turned and tipped, so that it takes the light in its own way; the same from wherever its place in the world
    // is asked; its ends and its top are eased over two or three metres
    const BLOCK = 22, COURSE = 13;
    const courseWander = (x, z) => 0.35 * n2(x * 0.017 + 3.1, z * 0.017);
    const blockRow = (cr, x, z, up) => { const fx = x / BLOCK + 7.7 * blockOf(cr, 3, 1), fz = z / BLOCK + 7.7 * blockOf(cr, 5, 2), ix = Math.floor(fx), iz = Math.floor(fz), ex = sstep(0.88, 1, fx - ix), ez = sstep(0.88, 1, fz - iz);
      const one = (i, j) => 3 * blockOf(i, j, cr) + 3 * ((blockOf(i, j, cr + 40) - 0.5) * (fx - i - 0.5) + (blockOf(i, j, cr + 80) - 0.5) * (fz - j - 0.5)) + 2.4 * (blockOf(i, j, cr + 120) - 0.5) * up;
      return mix(mix(one(ix, iz), one(ix + 1, iz), ex), mix(one(ix, iz + 1), one(ix + 1, iz + 1), ex), ez); };
    const standAt = (x, y, z) => { const fy = (y + 4) / COURSE + courseWander(x, z), c0 = Math.floor(fy), f = fy - c0; return mix(blockRow(c0, x, z, f - 0.5), blockRow(c0 + 1, x, z, f - 1.5), sstep(0.82, 1, f)); };
    // (and every block has weathered to a shade of its own, 0..1)
    const blockTone = (x, y, z) => { const cr = Math.floor((y + 4) / COURSE + courseWander(x, z) + 0.09); return blockOf(Math.floor(x / BLOCK + 7.7 * blockOf(cr, 3, 1) + 0.06), Math.floor(z / BLOCK + 7.7 * blockOf(cr, 5, 2) + 0.06), cr + 160); };
    // old water stains on a face: dark bands that hang down from a ledge for some metres and die away
    const seepAt = (x, y, z) => 0.42 * sstep(0.18, 0.42, n2(x * 0.06 + 11.3, z * 0.06 + 2.7)) * sstep(-0.2, 0.25, n2(x * 0.011 + y * 0.005, z * 0.011 + 5.5)) * sstep(-0.15, 0.3, n2(x * 0.045 + z * 0.045 + 3.1, y * 0.05 + 7.7));
    const mainK = (q) => Math.exp(-Math.pow((q - QM) / 165, 2));
    // (the bench's rim is ragged: teeth and saddles along it, never a level line)
    // (and round the head of the bay it rises and falls by a third of its height)
    const benchY = (q) => 168 + 13 * n2(q * 0.0031, 1.7) + 6 * n2(q * 0.011, 5.2) + 24 * (noise.ridged2(q * 0.0075, 3.3, 2) - 0.55) + 8 * n2(q * 0.034, 8.8) + 252 * mainK(q)
      + (75 * n2(q * 0.0027, 4.1) - 15) * sstep(QM + 380, QM + 700, q);
    const coveK = (q) => 1 - sstep((RT.coveS + RT.coveN) * 0.5 + 13, 250, Math.abs(q - QMO - (RT.coveN - RT.coveS) * 0.5));   // 1 where the lake laps the wall's own foot
    // foot to waterline: wide where the shore leg runs, a talus belt and a strip of beach up the bay, nothing at the cove
    const shoreW = (q) => (66 + 112 * (1 - sstep(210, 430, q)) + 5 * n2(q * 0.006, 8.3)) * (1 - coveK(q));
    const shoreY = (q, d, x, z) => {
      const e = shoreW(q) - d;                                                                  // metres inland of the waterline
      if (e < 0) return Math.max(-16, e * 0.085);
      let y = 4 * (1 - Math.exp(-e / 14));
      const offLeg = Math.max(sstep(6, 28, Math.abs(d - RT.wallOff)), sstep(200, 250, q), sstep(-40, -90, q));   // the ground under the shore leg is level
      y += 0.55 * n2(x * 0.021, z * 0.021) * sstep(8, 40, e) * offLeg;
      // talus against the wall (none where the wall stands in the water), and a moraine ridge on the lake side of the shore leg
      if (d < 62) { const k = 1 - sstep(0, 62, d); y += 12 * Math.pow(k, 1.6) * (0.72 + 0.28 * n2(q * 0.021, 2.2)) * sstep(-2, 45, e); }
      const rm = sstep(-175, -110, q) * (1 - sstep(165, 218, q));
      if (rm > 0) { const rd = (d - 135 - 2 * n2(q * 0.02, 7.1)) / 8.5; y += 7 * Math.exp(-rd * rd) * rm * (0.86 + 0.14 * n2(q * 0.06, 1.1)); }
      return y;
    };
    const wInfo = { gul: 0, alc: 0, fall: -1, lip: 0, coul: 0, cap: 0 };
    // pillars along a face: 0 on a pillar's crown, 1 in the dihedral between two
    const ribPat = (q, per, ph) => 1 - Math.pow(Math.abs(Math.sin((Math.PI * q) / per + ph)), 0.65);
    const BENCH_W = 92;                                              // lip of the bench to the foot of the upper wall
    const lipAt = (q) => mix(78 + 12 * n2(q * 0.008, 3.1), COVE_LIP + 4, mainK(q));   // foot of the apron to the bench's lip
    const wallY = (q, w, x, z, o) => {
      const fy = shoreY(q, 0, x, z), mk = mainK(q), by = benchY(q);
      let gul = 0; for (let i = 0; i < GULLIES.length; i++) { const a = Math.abs(q - GULLIES[i]); if (a < 60) gul = Math.max(gul, 1 - sstep(15, 58, a)); }
      // the apron's face stands in and out along the wall (pillars and dihedrals): a set-back in metres, not a change of height
      const sb = (9 * ribPat(q, 57, 1.4 * n2(q * 0.006, 5.1)) + 5 * n2(q * 0.031, 9.3) + 5) * (1 - gul), wq = Math.max(0, w - sb);
      const lipW = lipAt(q), lipE = mix(lipW, lipW + BENCH_W - 6, gul), t = wq / lipE;
      let y;
      if (t < 1) {
        // a buttress: a convex slab, steep at its foot, stepping back in ledges; a gully: an even ramp that trees can stand on
        const H = by - fy, hb = (1 - Math.pow(1 - t, 2.4)) * H, hs = mix(hb, stair(hb + 5 * n2(q * 0.011, w * 0.02), 31), 0.38), hg = Math.pow(t, 1.3) * H;
        y = fy + Math.min(w, sb) * 0.5 + mix(hs, hg, gul) + 6 * noise.fbm2(q * 0.012 + 3, w * 0.02, 3) * sstep(0, 30, wq) * (1 - 0.6 * gul);
      } else y = by + (wq - lipE) * 0.09 + 2.2 * n2(x * 0.018, z * 0.018) + 1.1 * n2(x * 0.05, z * 0.05);
      // the alcove under a fall: a level floor and a sheer headwall under the lip
      let alc = 0, fi = -1;
      for (let i = 0; i < FALLS.length; i++) { const long = FALLS[i].kind === 'long', off = long ? coveOff(q, w) : q - FALLS[i].q, a = Math.abs(off); if (a < (long ? 130 : 80)) {
        // (the cove narrows from its mouth to the long fall's foot, and its middle line runs back askew)
        const hw = (long ? mix(off < 0 ? RT.coveS : RT.coveN, RT.coveEnd, sat(w / COVE_BACK)) : FALLS[i].half * (1 + 0.8 * (1 - sat(w / lipW)))) + 4 * n2(w * 0.05, q * 0.03);
        const k = 1 - sstep(hw * 0.72, hw * 1.2, a); if (k > alc) { alc = k; fi = i; } } }
      if (alc > 0) { let ya;
        if (FALLS[fi].kind === 'long') {
          // the cove: its floor lies under the lake and shoals to the long fall's foot; the headwall climbs to the lip in
          // five risers with a ledge on each
          // (the headwall is fluted in pillars 17 m broad, the fall on the middle one's crown; the dihedrals between them stand
          // 7 m back, and every pillar has its ledges at heights of its own)
          const pil = Math.round((q - QM) / 17), wv = w - (7 + 2 * n2(q * 0.09, 1.1)) * ribPat(q - QM, 17, 1.5708) - SK.niche * nicheIn(q - QM), t5 = ((wv - COVE_BACK) / (COVE_LIP - COVE_BACK)) * 5;
          if (t5 <= 0) ya = -6 + 5.2 * sstep(COVE_BACK - 26, COVE_BACK, wv);
          else if (t5 < 5) { const tt = t5 + (pil === 0 ? 0 : (blockOf(pil, 3, 1) - 0.5) * 0.9 * Math.min(1, t5) * Math.min(1, 5 - t5)), fl = Math.floor(tt); ya = -0.8 + (by + 0.8) * Math.min(1, (fl + sstep(0, 0.62, tt - fl)) / 5); }
          else ya = by + (wv - COVE_LIP) * 0.09;
        } else { const wh = lipW * FALLS[fi].back; ya = w < wh + 1.5 ? mix(fy + 3 + w * 0.05, by, sstep(wh - 10, wh + 1.5, w)) : by + (w - wh) * 0.09; }
        y = mix(y, ya, alc);
        // (the cove's own sides stand in ledges)
        if (FALLS[fi].kind === 'long' && y > 2 && w < COVE_LIP) y = mix(y, stair(y + 6 * n2(q * 0.02, w * 0.02), 23), 0.55 * sstep(0, 0.2, alc) * (1 - sstep(0.9, 1, alc))); }
      // the upper wall: sheer granite from the back of the bench to the massif's top (G), fluted in pillars; it stands taller under
      // each horn, and the wall under the main horn stands forward
      const taper = (1 - 0.5 * sstep(QM + 300, QM + 1300, q)) * (0.8 + 0.2 * sstep(-430, -200, q));
      // (each horn stands on a granite tower of its own; between two towers the wall drops to a col)
      let prox = 0; for (let i = 0; i < HORNS.length; i++) { const a = Math.abs(q - HORNS[i][0]) / (HORNS[i][3] * 0.68); if (a < 1) prox = Math.max(prox, 1 - sstep(0.55, 1, a)); }
      const colY = 262 + 26 * n2(q * 0.004, 7.7) + 40 * (noise.ridged2(q * 0.0052, 9.9, 3) - 0.5), G = (colY + (462 + 14 * n2(q * 0.0023, 4.4) - colY) * prox) * taper;
      const wF = 78 + BENCH_W + 14 * ribPat(q, 83, 2.2 * n2(q * 0.004, 1.3) + 0.7) + 20 * n2(q * 0.0041, 2.2) + 6 * n2(q * 0.027, 6.1) + 52 * mk, tU = (w - wF) / 88;
      let hf = 0, cap = 0, coul = 0;
      if (tU > 0) {
        if (tU < 1) { hf = G * (1 - Math.pow(1 - tU, 2.2)); hf = mix(hf, stair(hf + 8 * n2(q * 0.009, w * 0.02), 46), 0.3); }
        else hf = G + (w - wF - 88) * 0.05;
        hf *= 1 - sstep(575, 640, w);
        // the horns: four-sided pyramids of shale standing on the massif, their faces cut by couloirs
        for (let i = 0; i < HORNS.length; i++) { const h = HORNS[i], a0 = (q - h[0]) / h[3], b0 = (w - h[1]) / h[4]; if (Math.abs(a0) > 0.9 || Math.abs(b0) > 0.9) continue;
          const cr = h[5], sr = h[6], x = h[7], a = (a0 * cr - b0 * sr - 0.05) * (a0 > 0 ? x.side[0] : x.side[1]), b = (a0 * sr + b0 * cr) * (b0 > 0 ? x.side[2] : x.side[3]);
          const r = mix(Math.max(Math.abs(a), Math.abs(b)), Math.hypot(a, b), 0.3), HH = h[2] - G;
          if (r < 0.62) { const t = 1 - r / 0.62, ang = Math.atan2(b, a);
            // the body with its shoulder, the summit tower, the buttresses that run down from it
            let pk = HH * (0.7 * Math.pow(t, 0.92) + 0.3 * sstep(0.5, 0.8, t));
            pk += HH * 0.07 * Math.pow(Math.abs(Math.cos(ang * 2.5 + x.butt)), 5) * sstep(0.08, 0.4, t) * (1 - sstep(0.55, 0.85, t));
            if (pk > cap) cap = pk; }
          for (let k = 0; k < 2; k++) { const sp = x.spires[k], rs = Math.hypot(a - sp[0], (b - sp[1]) * 1.25) / sp[2]; if (rs < 1) { const pk = HH * sp[3] * (0.35 + 0.65 * Math.pow(1 - rs, 0.8)); if (pk > cap) cap = pk; } } }
        if (cap > 0) { const rib = noise.ridged2(q * 0.0085 + 0.35 * n2(q * 0.002, w * 0.002), w * 0.0032 + 7, 3); coul = (1 - sstep(0.1, 0.3, rib)) * sstep(10, 60, cap);
          // (its ridges are broken: teeth and gaps, larger toward the top)
          cap = cap * (0.86 + 0.28 * rib) + (12 * n2(q * 0.017, w * 0.017) + 5 * n2(q * 0.05, w * 0.05) + 22 * (noise.ridged2(q * 0.021 + 3, w * 0.021, 2) - 0.5) * sstep(60, 260, cap)) * sstep(0, 80, cap); }
        hf += Math.max(0, cap);
      }
      if (tU > 0) y = smax(y, hf, 9);
      if (o) { o.gul = gul; o.alc = alc; o.fall = fi; o.lip = lipW; o.coul = coul; o.cap = sat(cap / 40); }
      return y;
    };
    // the land anywhere (o: the wall's masks when the place is inside the rock)
    const landAt = (x, z, o, hint = -1) => { const nr = nearest(x, z, hint), q = nr.q, d = nr.d;
      if (d < 0) return wallY(q, -d, x, z, o);
      if (o) { o.gul = 0; o.alc = 0; o.fall = -1; o.coul = 0; o.cap = 0; }
      return shoreY(q, d, x, z); };
    await ctx.yield();

    // ---------- the flown line's height, from the route table ----------
    // (the last climb: eased in over 30 m, then straight at RT.rise degrees to the gate)
    const eyeY = (s) => {
      const p = laid[Math.min(RT.shoreEnd, Math.round(s))], y0 = landAt(p[0], p[1]) + RT.eyeShore, up = Math.max(0, s - RT.riseFrom);
      return mix(y0, RT.eyeTowers, sstep(RT.shoreEnd, RT.turns[0][1] + 20, s)) + (RT.eyeArch - RT.eyeTowers) * sstep(RT.arch - 100, RT.arch - 10, s)
        + (RT.eyeWall - RT.eyeArch) * sstep(RT.liftFrom, RT.liftTo, s) + (RT.eyeLow - RT.eyeWall) * sstep(RT.lowFrom, RT.low, s)
        + Math.tan(RT.rise * D2R) * (up < 30 ? (up * up) / 60 : up - 15); };
    const pts = []; for (let k = 0, n = Math.round(RT.end / 20); k <= n; k++) { const s = Math.round((k * RT.end) / n); pts.push([laid[s][0], eyeY(s), laid[s][1]]); }
    const path = makePath(pts, { samples: 500 });
    const PL = path.length, uAt = (s) => s / PL;                     // a laid place as the engine's share of the route
    const END = path.end.clone(), endDir = path.endTangent.clone();
    const routeAt = (s, left, o) => { const i = Math.min(RT.end - 1, Math.max(0, Math.round(s))), a = laid[i], b = laid[i + 1], tx = b[0] - a[0], tz = b[1] - a[1]; o.x = a[0] + tz * left; o.z = a[1] - tx * left; o.tx = tx; o.tz = tz; return o; };
    // ---------- the towers: an archipelago of granite stacks that the line weaves through, each placed against the laid
    // line (laid metre, metres to its left), never the line round them ----------
    // A tower is a pile of jointed blocks: each storey a many-sided block a little smaller and a little turned on the one
    // below (a ledge between them; here and there the upper block overhangs), every block of a storey standing a little
    // in or out of its face, the pile split by chimneys, a wave-cut notch at the water, a spire of shale on top.
    // grade: 2 the line passes near it, 1 it stands further off, 0 far
    const STACKS = [];
    { const o = {}, sr = rng.fork('stacks'), T0 = RT.towersIn;
      // [laid metre, metres to the line's left, half-width, height, grade]: fourteen in the archipelago, 25 to 90 m
      // tall, neighbours some 45 to 70 m apart, some in pairs
      const list = [[T0, -39, 13, 52, 2], [T0 + 30, 41, 15, 74, 2], [T0 + 62, -45, 17, 88, 2], [T0 + 80, -80, 10, 40, 1], [T0 + 104, 39, 12, 46, 2], [T0 + 138, -41, 15, 66, 2],
        [T0 + 152, 68, 10, 34, 1], [RT.towerTall, 43, 16, 82, 2], [T0 + 208, -39, 12, 38, 2], [RT.towerLast, 39, 13, 58, 2], [T0 + 248, -64, 14, 70, 1], [T0 + 264, 72, 9, 28, 1],
        [T0 + 60, -125, 9, 30, 0], [T0 + 190, -118, 8, 25, 0],
        // and four more out in the lake, inside the line's last long turn: it comes round them to the cove
        [890, 44, 12, 46, 2], [958, 52, 15, 80, 2], [1050, 84, 11, 50, 1], [1100, 40, 14, 66, 2]];
      for (const [s, left, R0, H0, grade] of list) {
        const near = grade >= 2, ds = near ? 0 : sr.range(-8, 8), dl = near ? 0 : sr.range(0, 10) * Math.sign(left), n = 5 + Math.floor(sr() * 3), sides = [];
        const R = R0 * sr.range(0.94, 1.06), H = H0 * sr.range(0.95, 1.05);
        for (let k = 0; k < n; k++) sides.push(((k + sr.range(-0.28, 0.28)) / n) * 6.283);
        // (a tall tower carries a spire of shale from `contact` up; a lower one is granite to its top, a low dome that
        // trees stand on)
        const flat = H0 < 60;
        routeAt(s + ds, left + dl, o); const storeys = Math.max(3, Math.round(H / 12)), contact = H * (flat ? 0.6 + 0.5 * sr.range(0.62, 0.7) : sr.range(0.62, 0.7)), lev = [0], prof = [1], hang = 1 + Math.floor(sr() * (storeys - 1));
        // each storey has a height and a girth of its own; one of them stands out over the one below it
        for (let l = 1; l <= storeys; l++) { lev.push(lev[l - 1] + sr.range(0.7, 1.3)); prof.push(l === hang ? prof[l - 1] * 1.07 : prof[l - 1] * (1 - sr.range(0.03, 0.11))); }
        for (let l = 0; l <= storeys; l++) lev[l] *= contact / lev[storeys];
        // chimneys: [bearing, half-width (m), depth (m), from, to (heights)]
        const cracks = []; for (let k = 0, nk = near ? 4 + Math.floor(sr() * 3) : 2; k < nk; k++) { const y0 = sr.range(-2, contact * 0.45); cracks.push([sr() * 6.283, sr.range(0.7, 1.6), sr.range(1.1, 2.6), y0, y0 + sr.range(0.35, 0.8) * contact]); }
        const lean = [sr.range(-0.1, 0.1), sr.range(-0.1, 0.1)];
        STACKS.push({ x: o.x, z: o.z, R, H, grade, flat, sides, c0: Math.cos(Math.PI / n) * 0.97, seed: sr() * 50, storeys, lev, prof, contact, turn: sr.range(0.12, 0.3) * (sr() < 0.5 ? -1 : 1), cracks, lean }); } }
    // a tower's radius at a bearing and a height; and the place of that point of its skin
    // (a ledge wanders in height as it runs round its tower; everything that turns with the bearing closes on itself)
    const stackWander = (st, th) => { const cx = Math.cos(th), sx = Math.sin(th); return 1.3 * n2(cx * 1.1 + st.seed, sx * 1.1 + 4.7) + 0.6 * n2(cx * 3.1, sx * 3.1 + st.seed); };
    // one block of a course: how far it stands in or out of its storey's face, 0..1 (a course is some 4 m high, a block 4 to 7 m long)
    const blockStand = (st, l, th, course) => { const nb = Math.max(6, Math.round((6.2832 * st.R * st.prof[l]) / (4 + 3 * blockOf(course, l, st.seed))));
      const fb = ((th / 6.2832 + blockOf(course, 5, st.seed)) % 1) * nb, bi = Math.floor(fb) % nb;
      return mix(blockOf(bi, course, st.seed + l), blockOf((bi + 1) % nb, course, st.seed + l), sstep(0.78, 1, fb - Math.floor(fb))); };
    // a storey's own radius at a bearing: its many-sided plan, a little turned on the storey below, and its blocks
    const storeyRad = (st, th, y, l) => { let c = 0; for (let k = 0; k < st.sides.length; k++) c = Math.max(c, Math.cos(th - st.sides[k] - l * st.turn));
      let r = st.R * st.prof[l] * Math.min(1, st.c0 / c);
      if (st.grade > 0 && y > 1.5) { const fy = y / 4.1 + 0.3 * n2(Math.cos(th) * 2.3 + st.seed, Math.sin(th) * 2.3 + 1.7), c0 = Math.floor(fy);
        r += (mix(blockStand(st, l, th, c0), blockStand(st, l, th, c0 + 1), sstep(0.7, 1, fy - c0)) - 0.5) * 0.6; }
      return r; };
    const stackRad = (st, th, y) => {
      if (y >= st.contact) { const t = (y - st.contact) / (st.H - st.contact);
        if (st.flat) return storeyRad(st, th, st.contact, st.storeys - 1) * 0.94 * Math.sqrt(Math.max(0, 1 - t * t));
        let c = 0; for (let k = 0; k < 4; k++) c = Math.max(c, Math.cos(th - st.seed - k * 1.5708));
        return st.R * st.prof[st.storeys - 1] * 0.8 * Math.pow(Math.max(0, 1 - t), 0.85) * Math.min(1.25, 0.8 / c) * (1 + 0.1 * n2(Math.cos(th) * 2 + st.seed, Math.sin(th) * 2 + y * 0.3)); }
      // (every step of the pile, storey to storey, course to course, block to block, is eased over a metre or two, so
      // that the skin's own cells can carry it without a saw's edge)
      const yy = y + stackWander(st, th) * sstep(2, 6, y); let l = 0; while (l < st.storeys - 1 && yy >= st.lev[l + 1]) l++;
      let r = storeyRad(st, th, y, l);
      if (l < st.storeys - 1 && st.lev[l + 1] - yy < 1.6) r = mix(storeyRad(st, th, y, l + 1), r, sstep(0, 1.6, st.lev[l + 1] - yy));
      if (st.grade > 0 && y > 1.5) {
        for (let k = 0; k < st.cracks.length; k++) { const ck = st.cracks[k]; if (y < ck[3] || y > ck[4]) continue;
          let dth = th - ck[0]; dth -= Math.round(dth / 6.2832) * 6.2832; const a = (dth * r) / ck[1]; if (a > 2.6 || a < -2.6) continue;
          r -= ck[2] * Math.exp(-a * a) * sstep(ck[3], ck[3] + 5, y) * (1 - sstep(ck[4] - 5, ck[4], y)); } }
      r -= 0.8 * (1 - sstep(1.0, 2.2, y)) * sstep(-1.5, 0.2, y);                                    // the notch the waves have cut
      return y < 0 ? r - y * 0.5 : r; };
    const stackAt = (st, th, y, o) => { const r = stackRad(st, th, y), k = sat(y / st.H); o.x = st.x + Math.cos(th) * r + st.lean[0] * st.H * k * k; o.y = y; o.z = st.z + Math.sin(th) * r + st.lean[1] * st.H * k * k; return o; };
    await ctx.yield();

    // ---------- light and air shared by every shader of this world ----------
    const sunDir = new THREE.Vector3(Math.sin(L.sunAz * D2R) * Math.cos(L.sunEl * D2R), Math.sin(L.sunEl * D2R), -Math.cos(L.sunAz * D2R) * Math.cos(L.sunEl * D2R)).normalize();
    // (rock and plants read the noise plainly: drawn out along a wall seen aslant it turns to hatching; the lake, always seen
    // aslant, reads a copy that keeps its detail across the line of sight)
    const tNoise = await makeNoiseTexture(rng.fork('noise'), ctx.yield, 1);
    const tNoiseLake = tNoise.clone(); tNoiseLake.anisotropy = Math.min(8, ctx.renderer?.capabilities?.getMaxAnisotropy?.() || 1); tNoiseLake.needsUpdate = true;
    const fogColor = new THREE.Color(...L.fog);
    scene.fog = new THREE.FogExp2(fogColor, L.fogD);
    const sunB = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
    const LU = {
      tNoise: { value: tNoise }, uGale: gale.uniform, uTime: { value: 0 },
      uSunDir: { value: sunDir.clone() }, uSunCol: { value: new THREE.Vector3(...L.sun).multiplyScalar(L.sunK) },
      uSkyCol: { value: new THREE.Vector3(...L.sky).multiplyScalar(L.skyK) }, uBounce: { value: new THREE.Vector3(...L.bounce) },
      uScud: { value: new THREE.Vector4(WIND.x * 40, WIND.y * 40, L.scud, L.scudSize) },
      // the sky: clear zenith and horizon, the storm deck low and high, its sunlit edges, the glow round the sun; the sun's
      // bearing and the bearing of the lake's far side (east by north); how the deck drifts
      uZen: { value: new THREE.Vector3(...L.zen) }, uHor: { value: new THREE.Vector3(...L.hor) }, uDeckLo: { value: new THREE.Vector3(...L.deckLo) }, uDeckHi: { value: new THREE.Vector3(...L.deckHi) },
      uDeckLit: { value: new THREE.Vector3(...L.deckLit) }, uGlow: { value: new THREE.Vector3(...L.glow) },
      uSkyB: { value: new THREE.Vector4(sunB.x, sunB.y, Math.sin(80 * D2R), -Math.cos(80 * D2R)) }, uDrift: { value: new THREE.Vector2(WIND.x * 0.012, WIND.y * 0.012) },
      uSkyO: { value: new THREE.Vector2(...L.gap) },
      // each tower: x, z, girth, seed; and its height
      uStk: { value: STACKS.map((st) => new THREE.Vector4(st.x, st.z, st.R * st.c0, st.seed)) }, uStkH: { value: STACKS.map((st) => st.H) },
      // the fin: where the line crosses it and its way out toward the lake (x, z each); the sun in the fin's own frame (a, b, y)
      uFin: { value: new THREE.Vector4(FIN.x, FIN.z, FIN.ax, FIN.az) },
      uFinS: { value: new THREE.Vector3(sunDir.x * FIN.ax + sunDir.z * FIN.az, sunDir.x * FIN.bx + sunDir.z * FIN.bz, sunDir.y) },
    };
    // the shade a tower throws down the sun's way onto water and land (a tapering shaft; its edge softens with distance,
    // and it comes on over 3 m from the tower's own middle)
    const GLSL_TOWERS = /* glsl */`
      #define NTOW ${STACKS.length}
      uniform vec4 uStk[NTOW]; uniform float uStkH[NTOW];
      float towerShade(vec3 wp){ float sh = 1.; float hl = max(length(uSunDir.xz), 1e-3); vec2 s = uSunDir.xz / hl; float tanEl = uSunDir.y / hl;
        for (int i = 0; i < NTOW; i++) { vec4 c = uStk[i]; vec2 dv = c.xy - wp.xz; float al = dot(dv, s), off = abs(dv.x * s.y - dv.y * s.x);
          float hh = uStkH[i], h = wp.y + al * tanEl, rr = c.z * (1.05 - .55 * clamp(h / hh, 0., 1.));
          sh = min(sh, 1. - smoothstep(0., 3., al) * (1. - smoothstep(rr * .75, rr * 1.1 + .03 * max(al, 0.), off)) * (1. - smoothstep(hh * .8, hh, h))); }
        return sh; }
      // the fin in its own frame: a place's metres out along it and across it; its crest (without its small wander)
      uniform vec4 uFin; uniform vec3 uFinS;
      vec2 finAB(vec2 xz){ vec2 dv = xz - uFin.xy; return vec2(dot(dv, uFin.zw), dot(dv, vec2(uFin.w, -uFin.z))); }
      float finCrest(float a){ float e = clamp((a - 46.) / ${(AR.tip - 46).toFixed(1)}, 0., 1.); return (74. + 14. * smoothstep(-110., -40., a)) * (1. - pow(e, 2.2)) - 3. * e; }
      // the shade the fin throws down the sun's way (0 in it .. 1 clear): the sun's ray from a place is followed to the
      // fin's middle plane; the opening lets it through; the shade comes on over the ray's first 3 m
      float finShade(vec3 wp){ vec2 ab = finAB(wp.xz); float t = -ab.y / max(uFinS.y, .05), ah = ab.x + uFinS.x * t, yh = wp.y + uFinS.z * t + (nG(wp.xz * .045) - .5) * 5., soft = 1.5 + .05 * abs(t);
        float rock = (1. - smoothstep(-soft, soft, yh - finCrest(ah))) * smoothstep(-soft, soft, ah + ${(FIN.root + 40).toFixed(1)});
        float open = pow(abs(ah) / ${AR.hw.toFixed(1)}, ${AR.p.toFixed(1)}) + pow(max(yh + 3., 0.) / ${(AR.top + 3).toFixed(1)}, ${AR.p.toFixed(1)});
        return 1. - smoothstep(0., 3., t) * rock * smoothstep(1. - .1 * soft / 3., 1. + .1 * soft / 3., open); }`;
    // the sky of this world, by direction: clear air, the storm deck, the pale band over the lake's far side
    // (needs the noise and the light's own lines before it)
    const GLSL_SKY = /* glsl */`
      uniform vec3 uZen, uHor, uDeckLo, uDeckHi, uDeckLit, uGlow; uniform vec4 uSkyB; uniform vec2 uDrift, uSkyO;
      // the clear air: pale at the horizon, deep overhead, warm round the sun
      vec3 skyClear(vec3 d){ float y = max(d.y, 0.), s = max(dot(d, uSunDir), 0.);
        return mix(uHor, uZen, pow(y, .42)) + uGlow * (.5 * pow(s, 10.) + .22 * pow(s, 3.)) * (1. - .5 * y); }
      // how far the storm deck stands open at a bearing: 1 toward the sun, 0 over the wall and behind it
      float skyOpen(vec2 b){ return smoothstep(uSkyO.x, uSkyO.y, dot(b, uSkyB.xy)); }
      // the band of clear air low over the lake's far side
      float skyBand(vec2 b, float y){ return (1. - smoothstep(.02, .17, y)) * smoothstep(-.15, .55, dot(b, uSkyB.zw)); }
      // the sky without its clouds' grain: what the lake mirrors and the far haze takes
      vec3 skyTone(vec3 d){ vec2 b = normalize(d.xz + vec2(1e-4, 0.)); float y = max(d.y, 0.);
        return mix(mix(uDeckLo, uDeckHi, smoothstep(0., .6, y)), skyClear(d), max(skyOpen(b) * .75, skyBand(b, y))); }
      // the whole sky: the deck is one drifting field seen from below, closed over the wall and torn open toward the sun;
      // a mass is dark in its belly and darkest low behind the wall, and lit where its sunward side thins
      vec3 skyFull(vec3 d){
        vec2 b = normalize(d.xz + vec2(1e-4, 0.)); float y = max(d.y, 0.), gap = skyOpen(b), low = skyBand(b, y);
        vec2 uv = d.xz / (y + .17) - uDrift * uTime, su = uSkyB.xy * .55;
        float grain = nA(uv * .31 + .11) * .6 + nG(uv * .57) * .4;
        float n = nR(uv * .043) * .55 + nG(uv * .11 + .37) * .31 + grain * .14;
        float ns = nR((uv + su) * .043) * .55 + nG((uv + su) * .11 + .37) * .31 + grain * .14;   // the same cloud a step nearer the sun
        float thr = mix(.22, .53, gap) + .12 * low, dens = smoothstep(thr - .07, thr + .13, n), thick = smoothstep(thr, thr + .3, n);
        float densS = smoothstep(thr - .07, thr + .13, ns), thickS = smoothstep(thr, thr + .3, ns);
        vec3 cloud = mix(uDeckHi, uDeckLo, clamp(thick * .8 + .5 * (1. - smoothstep(0., .34, y)) * (1. - gap), 0., 1.));
        // (lit only where the cloud ends, or thins, toward the sun: its rim, never its belly)
        float rim = clamp(dens - densS, 0., 1.) + .3 * clamp(thick - thickS, 0., 1.), nearSun = .1 + .9 * pow(max(dot(b, uSkyB.xy) * .5 + .5, 0.), 3.);
        cloud += uDeckLit * nearSun * rim;
        vec3 clear = skyClear(d); float s = dot(d, uSunDir);
        clear += uSunCol * (smoothstep(.99988, .99994, s) * 14. + pow(max(s, 0.), 1500.) * 2.);
        return mix(clear, cloud, dens * (1. - low * .85)); }`;
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

    // ---------- the wall: one mesh on the (q, d) grid ----------
    const qs = []; for (let q = Q_SOUTH; q < Q_NORTH;) { qs.push(q); q += q < -70 ? 12 : q < QM + 300 ? 6 : q < QM + 520 ? 10 : 22; }
    for (const f of FALLS) { let bi = 0; for (let i = 1; i < qs.length; i++) if (Math.abs(qs[i] - f.q) < Math.abs(qs[bi] - f.q)) bi = i; qs[bi] = f.q; }   // a column down the middle of every alcove
    const ds = []; for (let d = 215; d > -620;) { ds.push(d); d -= d > 132 ? 6 : d > 0 ? 4 : d > -160 ? 5 : d > -310 ? 2.7 : 9.5; }   // (close rows where the upper wall stands)
    const NQ = qs.length, ND = ds.length, NV = NQ * ND;
    const pos = new Float32Array(NV * 3), aA = new Float32Array(NV * 4), aB = new Float32Array(NV * 4), HT = new Float32Array(NV);
    // each fall's lip, pool and run-off, from the same profile the mesh is made of
    const tw = {};
    for (const f of FALLS) { const wh = lipAt(f.q) * f.back; f.lipW = wh + 2.5; f.poolD = -(wh - 21);
      if (f.kind === 'long') { f.lipW = COVE_LIP + 2 + SK.niche; f.poolD = -(COVE_BACK - 5); }
      toWorld(f.q, -f.lipW, tw); f.x = tw.x; f.z = tw.z; f.out = [tw.nx, tw.nz]; f.top = wallY(f.q, f.lipW, tw.x, tw.z);
      toWorld(f.q, f.poolD, tw); f.px = tw.x; f.pz = tw.z; f.foot = wallY(f.q, -f.poolD, tw.x, tw.z);
      f.dw = WIND.x * f.out[1] - WIND.y * f.out[0] >= 0 ? 1 : -1; }                                   // (which way along the foot is downwind there)
    // how thick the lenga stands at a place, 0..1 (d = metres out from the foot, negative on the wall; wi: the wall's masks
    // there): tongues climbing the gullies, ragged at their sides and thinning upward to single trees; a broken belt on the
    // talus at the wall's foot
    const woodAt = (q, d, wi) => {
      const rag = 0.5 * n2(q * 0.021 + 7, d * 0.021) + 0.32 * n2(q * 0.057, d * 0.057 + 3) + 0.18 * n2(q * 0.14 + 1, d * 0.14);
      // (the canopy is broken: glades open in it here and there)
      const glade = 0.3 + 0.7 * sstep(-0.62, -0.34, n2(q * 0.041 + 31.7, d * 0.041 + 5.9));
      if (d >= 0) return sat(1.5 * (1 - sstep(16, 60, d + 22 * rag)) * sstep(-0.25, 0.3, n2(q * 0.0105, 9.1) + 0.5 * rag) * (1 - coveK(q))) * glade;
      const t = -d / mix(wi.lip, wi.lip + BENCH_W - 6, wi.gul);
      return sat(1.7 * wi.gul * (1 - wi.alc) * (1 - sstep(0.12, 0.92, t + 0.42 * rag)) + 0.5 * (1 - sstep(0, 0.12, t)) * sstep(-0.25, 0.3, n2(q * 0.0105, 9.1) + 0.5 * rag) * (1 - coveK(q)) * (1 - wi.alc)) * glade; };
    // how wet the rock is at a place on the wall, 0..1: the dark chute under a fall's lip, fanning out as it comes down; the
    // stream's bed above the lip; seeps in the gullies (f: the nearest fall; lat: metres along the foot from its line)
    const wetAt = (f, lat, w, y, wi) => { let wet = 0.4 * wi.gul * (1 - wi.alc); const a = Math.abs(lat), below = f.top - y, long = f.kind === 'long';
      // (the long fall's chute is on the cove's headwall: the cove's sides nearer the mouth are dry)
      // (and on its downwind side as far as the rope of blown water leans as it climbs the chute's upper part)
      if (w < f.lipW + 4) { const hw = f.width * 0.5 + (long ? 9 : 3) + (long ? 0.05 : 0.1) * Math.max(0, below) + (lat * f.dw > 0 ? (long ? 34 : 8 + Math.min(26, Math.max(8, 0.09 * (f.top - f.foot)))) * sat(1 - below / (0.6 * (f.top - f.foot))) : 0);
        wet = Math.max(wet, (1 - sstep(hw, hw + (long ? 16 : 9), a)) * sstep(-4, 2, below) * (long ? sstep(COVE_BACK - 45, COVE_BACK - 15, w) : 1)); }
      else wet = Math.max(wet, (1 - sstep(f.width * 0.5, f.width * 0.5 + 6, a)) * (1 - sstep(f.lipW + 25, f.lipW + 70, w)));
      return wet; };
    const aC = new Float32Array(NV);
    for (let i = 0, k = 0; i < NQ; i++) {
      const q = qs[i]; let fi = 0; for (let j = 1; j < FALLS.length; j++) if (Math.abs(FALLS[j].q - q) < Math.abs(FALLS[fi].q - q)) fi = j;
      const lat = q - FALLS[fi].q, sw = shoreW(q);
      for (let j = 0; j < ND; j++, k++) {
        const d = ds[j]; toWorld(q, d, tw); let y, wood = 0, rib = 0.5;
        if (d >= 0) { y = shoreY(q, d, tw.x, tw.z); wood = woodAt(q, d, null); }
        else { y = wallY(q, -d, tw.x, tw.z, wInfo); rib = wInfo.coul;
          wood = woodAt(q, d, wInfo); aC[k] = 1.4 * wetAt(FALLS[fi], lat, -d, y, wInfo); }   // (over 1 at a chute's heart: its ragged edge is only at its edge)
        pos[k * 3] = tw.x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = tw.z; HT[k] = y;
        aA[k * 4 + 2] = d < 0 ? d - 40 * coveK(q) : d; aA[k * 4 + 3] = wood;            // (no talus is painted where the wall stands in the water)
        const along = d - FALLS[fi].poolD, on = Math.abs(lat) < 56 && d < sw + 14 ? 1 : 0;
        // (the side figure is always true metres: a made-up one would cross zero between two columns)
        aB[k * 4] = lat; aB[k * 4 + 1] = on ? along : -999; aB[k * 4 + 2] = rib; aB[k * 4 + 3] = q;
      }
      await ctx.yield();
    }
    // the sun's shadow and the sky's share, marched over the grid's own heights (each column in its own frame of the foot)
    const qT = new Float32Array(Math.ceil(Q_NORTH - Q_SOUTH) + 2), dT = new Float32Array(840);
    { for (let m = 0, i = 0; m < qT.length; m++) { const q = Q_SOUTH + m; while (i < NQ - 2 && qs[i + 1] <= q) i++; qT[m] = Math.min(NQ - 1, i + sat((q - qs[i]) / (qs[i + 1] - qs[i]))); }
      for (let m = 0, j = 0; m < dT.length; m++) { const d = 215 - m; while (j < ND - 2 && ds[j + 1] >= d) j++; dT[m] = Math.min(ND - 1, j + sat((ds[j] - d) / (ds[j] - ds[j + 1]))); } }
    // the height inside one cell of a mesh, on the same two triangles the mesh is cut into (corner heights: this column and
    // the next, this row and the next; a, b: the share of the way across)
    const triH = (h00, h10, h01, h11, a, b) => Math.abs(h00 - h11) < Math.abs(h10 - h01)
      ? (a >= b ? h00 + a * (h10 - h00) + b * (h11 - h10) : h00 + b * (h01 - h00) + a * (h11 - h01))
      : (a + b <= 1 ? h00 + a * (h10 - h00) + b * (h01 - h00) : h11 + (1 - a) * (h01 - h11) + (1 - b) * (h10 - h11));
    // the land's height at a place, on the wall's grid
    const hAt = (q, d) => { const fq = Math.min(qT.length - 1.001, Math.max(0, q - Q_SOUTH)), fd = Math.min(dT.length - 1.001, Math.max(0, 215 - d));
        const iq = Math.floor(fq), id = Math.floor(fd), ci = mix(qT[iq], qT[iq + 1], fq - iq), ri = mix(dT[id], dT[id + 1], fd - id);
        const c0 = Math.min(NQ - 2, Math.floor(ci)), r0 = Math.min(ND - 2, Math.floor(ri)), a = ci - c0, b = ri - r0, k = c0 * ND + r0;
        return triH(HT[k], HT[k + ND], HT[k + 1], HT[k + ND + 1], a, b); };
    const surfAt = hAt;
    // the sun's share and the sky's share at a vertex: marched over the land's heights in the column's own frame of the foot
    const sh = Math.hypot(sunDir.x, sunDir.z), tanEl = sunDir.y / sh, sxh = sunDir.x / sh, szh = sunDir.z / sh;
    const DIRS = []; for (let a = 0; a < 8; a++) DIRS.push([Math.cos(a * Math.PI / 4 + 0.3), Math.sin(a * Math.PI / 4 + 0.3)]);
    const bake = (q, d, y, sq, sd, arr, k, near) => { let occ = 0;
      if (y > -1) for (let m = 0, l = near; m < 27; m++, l *= 1.22) { const o = (surfAt(q + sq * l, d + sd * l) - (y + l * tanEl)) / (0.05 * l + 1.6); if (o > occ) { occ = o; if (occ >= 1) break; } }
      let ao = 0; for (let a = 0; a < 8; a++) { const e = DIRS[a]; ao += sat((surfAt(q + e[0] * 12, d + e[1] * 12) - y) / 12 - 0.3) + sat((surfAt(q + e[0] * 42, d + e[1] * 42) - y) / 42 - 0.3); }
      arr[k * 4] = 1 - sat(occ); arr[k * 4 + 1] = 1 - 0.62 * sat(ao / 9); };
    for (let i = 0, k = 0; i < NQ; i++) { toWorld(qs[i], 0, tw); const tx = tw.nz, tz = -tw.nx, sq = sxh * tx + szh * tz, sd = sxh * tw.nx + szh * tw.nz;
      for (let j = 0; j < ND; j++, k++) bake(qs[i], ds[j], HT[k], sq, sd, aA, k, 5);
      if ((i & 3) === 3) await ctx.yield(); }
    // ---------- the cove's own rock: a skin over its sides and its headwall ----------
    // The wall's grid cannot carry the cove (its sides run back across the grid's rows and its headwall stands on a few
    // of them), and the cove is the rock that is seen nearest. So level rays go out from one place over the cove's water,
    // at every height of a ladder of heights, to the first rock they meet on the wall's grid; their bearings are chosen so
    // that the skin's columns stand evenly along the rock. The skin stands in front of the grid everywhere, and on it the
    // rock is modelled in the mesh itself: courses of great blocks, each standing out by its own amount with a ledge on
    // its top; a flake leaning against the headwall; a chimney between two ribs beside the long fall; and where the land
    // itself is set back behind the fall (SK.niche), the skin carries the old face on over a roof, so that under it there
    // is a dark niche which the water leaps clear of. Toward its own edges the skin lies down on the grid.
    // A second skin of the same kind, from a place on the lake before the cove's mouth, carries the buttress south of
    // the mouth: the wall's outer face there, as far as the mouth's corner. The two skins carry the same
    // rock: a block's standing is asked by its place in the world.
    // K: cq, cw (where the rays leave from), top, th0, th1 (the bearings looked through, from straight into the rock, +
    // to the north), ref (a bearing at which its rock surely stands), nt (how many steps of 1.5 m a ray is walked),
    // inside (its rays never leave the cove), fall (it carries the long fall)
    const buildSkin = async (K) => {
      const skin = { geo: null, face: null, ledges: [], sp: null, bad: null };
      const rows = []; for (let y = -2.5; y < K.top - 2;) { rows.push(y); y += y < 40 ? 1.4 : 1.4 + (y - 40) * 0.035; } rows.push(K.top);
      const NR = rows.length, TS = 1.5, NT = K.nt, hM = new Float32Array(NT + 1);
      // a ray's profile: the land's height at every step of TS along it, on the wall's grid
      const walk = (th) => { const sa = Math.sin(th), ca = Math.cos(th);
        for (let k = 0; k <= NT; k++) { const t = 6 + k * TS, w = K.cw + ca * t; hM[k] = K.inside && w < 1 ? -9 : hAt(K.cq + sa * t, -w); } };
      // is a place of the rock this skin's own: the cove's skin keeps inside the mouth; the buttress's keeps to the rock
      // that stands nearer the wall's outer foot than the cove's south side. (Each lies down on the grid toward its own
      // edge, so along the corner's arete the two meet on the wall's own face.)
      const mine = (q, w) => K.inside ? w > 4 : -coveOff(q, w) - mix(RT.coveS, RT.coveEnd, sat(w / COVE_BACK)) > w - 2;
      // first, where the rock stands 14 m over the water: the bearings that reach it, and the metres along the rock
      // between them
      const N0 = 200, TH0 = K.th0, TH1 = K.th1, hq = new Float32Array(N0 + 1), hw = new Float32Array(N0 + 1), hit = new Uint8Array(N0 + 1);
      for (let i = 0; i <= N0; i++) { const th = mix(TH0, TH1, i / N0); walk(th);
        for (let k = 1; k <= NT; k++) if (hM[k] >= 14) { const t = 6 + (k - 1 + sat((14 - hM[k - 1]) / (hM[k] - hM[k - 1]))) * TS; hq[i] = K.cq + Math.sin(th) * t; hw[i] = K.cw + Math.cos(th) * t; hit[i] = mine(hq[i], hw[i]) ? 1 : 0; break; }
        if (i % 20 === 19) await ctx.yield(); }
      const thF = K.ref, iF = Math.round(((thF - TH0) / (TH1 - TH0)) * N0);
      let i0 = iF, i1 = iF; while (i0 > 0 && hit[i0 - 1]) i0--; while (i1 < N0 && hit[i1 + 1]) i1++;
      const arc = new Float32Array(N0 + 1); for (let i = i0 + 1; i <= i1; i++) arc[i] = arc[i - 1] + Math.hypot(hq[i] - hq[i - 1], hw[i] - hw[i - 1]);
      // (no rock of its own at the bearing `ref`: a skin with no cells, and no face for the long fall)
      if (!(arc[i1] >= 1)) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3)); g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(0), 4));
        g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(0), 4)); g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(0), 1)); g.setIndex([]);
        skin.geo = g; skin.sp = new Float32Array(0); skin.bad = new Uint8Array(0); skin.tally = { columns: 0, rows: NR, cells: 0, modelled: 0 }; return skin; }
      const NC = Math.max(8, Math.round(arc[i1] / SK.du)), NCV = (NC + 1) * NR, TH = new Float32Array(NC + 1);
      for (let c = 0, i = i0; c <= NC; c++) { const a = (c / NC) * arc[i1]; while (i < i1 - 1 && arc[i + 1] < a) i++; TH[c] = mix(TH0, TH1, (i + sat((a - arc[i]) / Math.max(1e-6, arc[i + 1] - arc[i]))) / N0); }
      const cF = ((arc[iF] + (arc[Math.min(i1, iF + 1)] - arc[iF]) * (((thF - TH0) / (TH1 - TH0)) * N0 - iF)) / arc[i1]) * NC;   // the column at the bearing `ref` (the long fall's own)
      // then every ray at every height: TM where the wall's grid stands, TB a hand in front of it, TA the same face with
      // the grid's own creases eased (the face the modelled rock is laid on)
      // (DB: 0 where a ray meets no rock, and along the skin's own edge; BAD: no rock, or rock only grazed)
      const TM = new Float32Array(NCV), TA = new Float32Array(NCV), TB = new Float32Array(NCV), DB = new Float32Array(NCV).fill(1e6), BAD = new Uint8Array(NCV);
      for (let c = 0; c <= NC; c++) { walk(TH[c]); const sa = Math.sin(TH[c]), ca = Math.cos(TH[c]);
        for (let r = 0, km = 1; r < NR; r++) { const y = rows[r], k = c * NR + r;
          while (km <= NT && hM[km] < y) km++;
          if (km > NT) { BAD[k] = 1; TM[k] = 6 + NT * TS; continue; }
          TM[k] = 6 + (km - 1 + sat((y - hM[km - 1]) / (hM[km] - hM[km - 1]))) * TS; if (!mine(K.cq + sa * TM[k], K.cw + ca * TM[k])) BAD[k] = 1; }
        if (c % 24 === 23) await ctx.yield(); }
      // (rock that a ray only grazes, and ground that is nearer level than steep, are none of the skin's: the wall's grid
      // carries them; but over the niche's breadth the skin is whole)
      for (let c = 0; c <= NC; c++) { if (K.fall && nicheIn((c - cF) * SK.du) > 0) continue;
        for (let r = 0; r < NR; r++) { const k = c * NR + r; if (BAD[k] === 1) continue;
          if (c < NC && BAD[k + NR] !== 1 && Math.abs(TM[k + NR] - TM[k]) > (K.inside ? 3.2 : 1.9) * SK.du) { BAD[k] |= 2; BAD[k + NR] |= 2; }
          if (r < NR - 1 && BAD[k + 1] !== 1 && Math.abs(TM[k + 1] - TM[k]) > 1.3 * (rows[r + 1] - rows[r]) + 0.5) { BAD[k] |= 2; BAD[k + 1] |= 2; } } }
      await ctx.yield();
      for (let k = 0; k < NCV; k++) { const c = (k / NR) | 0, r = k % NR; TB[k] = TM[k] - 0.6; if (BAD[k] || c === 0 || c === NC || r === NR - 1) DB[k] = 0;
        let s = 0, n = 0; for (let dc = -2; dc <= 2; dc++) for (let dr = -2; dr <= 2; dr++) { const cc = c + dc, rr = r + dr; if (cc < 0 || cc > NC || rr < 0 || rr >= NR || BAD[cc * NR + rr]) continue; s += TM[cc * NR + rr]; n++; }
        TA[k] = n ? s / n : TM[k]; if (k % 2500 === 2499) await ctx.yield(); }
      await ctx.yield();
      // metres (along the skin) from each of its places to the nearest place that is not rock of the cove, or is its edge
      const spread = (D) => {
        for (let c = 0; c <= NC; c++) for (let r = 0; r < NR; r++) { const k = c * NR + r; let v = D[k];
          if (c > 0) v = Math.min(v, D[k - NR] + SK.du); if (r > 0) v = Math.min(v, D[k - 1] + rows[r] - rows[r - 1]); D[k] = v; }
        for (let c = NC; c >= 0; c--) for (let r = NR - 1; r >= 0; r--) { const k = c * NR + r; let v = D[k];
          if (c < NC) v = Math.min(v, D[k + NR] + SK.du); if (r < NR - 1) v = Math.min(v, D[k + 1] + rows[r + 1] - rows[r]); D[k] = v; } };
      spread(DB); await ctx.yield();
      // a bearing's column and a height's row on the skin (shares between two of them)
      const colOf = (th) => { if (th <= TH[0]) return 0; if (th >= TH[NC]) return NC; let a = 0, b = NC; while (b - a > 1) { const m = (a + b) >> 1; if (TH[m] <= th) a = m; else b = m; } return a + (th - TH[a]) / (TH[b] - TH[a]); };
      const rowOf = (y) => { if (y <= rows[0]) return 0; if (y >= rows[NR - 1]) return NR - 1; let a = 0, b = NR - 1; while (b - a > 1) { const m = (a + b) >> 1; if (rows[m] <= y) a = m; else b = m; } return a + (y - rows[a]) / (rows[b] - rows[a]); };
      const fTop = FALLS[8].top, rl = { wet: 0, cave: 0 };
      // the height of the niche's roof at a place (us metres along the skin from the long fall's line)
      const roofAt = (us) => SK.roof + 3 * n2(us * 0.06, 2.9);
      // the modelled rock at a place of the skin (us metres along it from the bearing `ref`, height y; x, z: the place of
      // the wall's grid behind it): how far it stands out of the grid toward the open air (metres, never less than
      // nothing); o.wet: how wet it is; o.cave: 1 under the niche's roof
      const relief = (us, y, x, z, o) => {
        // blocks that stand out of the face, and the grain of the face between them
        let p = 2 * Math.max(0, standAt(x, y, z) - 0.9) + 0.4 * sat(0.5 + n2(x * 0.11 + y * 0.07, z * 0.11 - y * 0.05));
        // (old water stains hang down the faces in dark bands here and there)
        const seep = seepAt(x, y, z);
        o.wet = seep; o.cave = 0; if (!K.fall) return p;
        // a great flake leaning against the headwall north of the fall; the gap behind its edge is the wall's own face
        const sl = us - 46 - 0.17 * y, top = 1 - sstep(44, 47, y + 2 * n2(us * 0.2, 3)), gap = sstep(6.4, 7, sl) * (1 - sstep(8.4, 9, sl)) * top;
        p = p * (1 - gap) + (1.5 + 4 * (1 - sat(y / 46))) * (1 - sstep(5.6, 6.4, Math.abs(sl))) * top;
        // a chimney south of the fall, a little aslant: a slot of the wall's own face between two ribs that stand 5 m out
        const cx = us + 44 - 0.05 * y, ch = cx / 2.3, chim = Math.exp(-ch * ch * ch * ch), tall = 1 - sstep(84, 104, y);
        p = (p + 5 * (1 - sstep(8, 11.5, Math.abs(cx))) * tall) * (1 - chim * tall);
        // the niche: the land is set back over the fall's breadth; above the roof the skin carries the old face on, with a
        // brow standing out over the roof; under the roof it lies on the land
        const nk = nicheIn(us), roof = roofAt(us), under = sstep(-1.2, 1.2, roof - y);
        if (nk > 0) p = mix(p, (0.5 * p + SK.niche + 3 * (1 - sstep(0, 10, y - roof))) * (1 - under) + 0.4 * p * under, nk);
        // wet rock: the chute the fall comes down, widening downward; the niche; the chimney; whatever the spray reaches
        const hw = 28 + 0.05 * Math.max(0, fTop - y);
        // (and the thread of rock under each seep fall)
        let sw = 0; for (const [u0, top] of SEEPS) sw = Math.max(sw, (1 - sstep(2.5, 8, Math.abs(us - u0))) * (1 - sstep(top - 3, top + 3, y)));
        o.wet = Math.max(seep, 1 - sstep(hw, hw + 16, Math.abs(us)), nk * under, 0.9 * chim * tall, 0.8 * (1 - sstep(8, 30, y)) * (1 - sstep(34, 80, Math.abs(us))), sw);
        o.cave = nk * under; return p; };
      // every place of the skin: how far along its ray, and where that is (toward its own edge the modelling dies away
      // and the skin lies down on the grid)
      const T = new Float32Array(NCV), sp = new Float32Array(NCV * 3), sA = new Float32Array(NCV * 4), sB = new Float32Array(NCV * 4), sC = new Float32Array(NCV), o = {};
      for (let c = 0, k = 0; c <= NC; c++) { const sa = Math.sin(TH[c]), ca = Math.cos(TH[c]), us = (c - cF) * SK.du;
        for (let r = 0; r < NR; r++, k++) { const y = rows[r], t0 = Math.min(TA[k], TB[k] + 0.6), e = sstep(0, 7, DB[k]);
          toWorld(K.cq + sa * t0, -(K.cw + ca * t0), o); const p = relief(us, y, o.x, o.z, rl), tone = blockTone(o.x, y, o.z);
          T[k] = t0 - mix(0.25, K.inside ? 0.6 : 0.45, e) - p * e; sA[k * 4 + 3] = rl.cave; toWorld(K.cq + sa * T[k], -(K.cw + ca * T[k]), o);
          sp[k * 3] = o.x; sp[k * 3 + 1] = y; sp[k * 3 + 2] = o.z; sC[k] = rl.wet * 1.4;
          sA[k * 4 + 2] = -60; sB[k * 4] = 999; sB[k * 4 + 1] = -1200; sB[k * 4 + 2] = tone; sB[k * 4 + 3] = K.q0 + us; }
        if (c % 12 === 11) await ctx.yield(); }
      // the light on it: the land's own shade and sky (asked a little clear of the rock, on the wall's grid), then the
      // skin's own: a block's shadow on its neighbour, a ledge's on the face under it, the niche's dark
      toWorld(QMO, 0, o); const tq = sxh * o.nz - szh * o.nx, td = sxh * o.nx + szh * o.nz, LS = [1.3, 2.6, 4.2, 6.5, 10, 15];
      const tAt = (cf, rf) => { const c = Math.min(NC - 1, Math.floor(cf)), r = Math.min(NR - 2, Math.floor(rf)), a = cf - c, b = rf - r, k = c * NR + r; return mix(mix(T[k], T[k + NR], a), mix(T[k + 1], T[k + NR + 1], a), b); };
      for (let c = 0, k = 0; c <= NC; c++) { const sa = Math.sin(TH[c]), ca = Math.cos(TH[c]);
        for (let r = 0; r < NR; r++, k++) { const y = rows[r], tb = TB[k] - 1.9; bake(K.cq + sa * tb, -(K.cw + ca * tb), y, tq, td, sA, k, 5);
          let lit = 1; const a0 = sa * T[k], w0 = ca * T[k];
          for (let m = 0; m < LS.length && lit > 0; m++) { const l = LS[m], a = a0 + tq * sh * l, w = w0 - td * sh * l, yy = y + sunDir.y * l; if (yy >= K.top) break;
            lit = Math.min(lit, 1 - sat((Math.hypot(a, w) - tAt(colOf(Math.atan2(a, w)), rowOf(yy)) - 0.2) / (0.3 + 0.07 * l))); }
          // (a face that the sun only grazes, taken broadly, lies in the shade of its own blocks)
          { const cA = Math.max(0, c - 3), cB = Math.min(NC, c + 3), rA = Math.max(0, r - 3), rB = Math.min(NR - 1, r + 3), kA = cA * NR + r, kB = cB * NR + r, kC = c * NR + rA, kD = c * NR + rB;
            if (!(BAD[kA] || BAD[kB] || BAD[kC] || BAD[kD])) {
              const ax = Math.sin(TH[cB]) * TA[kB] - Math.sin(TH[cA]) * TA[kA], aw = Math.cos(TH[cB]) * TA[kB] - Math.cos(TH[cA]) * TA[kA], ux = sa * (TA[kD] - TA[kC]), uw = ca * (TA[kD] - TA[kC]), uy = rows[rB] - rows[rA];
              let nx = aw * uy, nw = -ax * uy, ny = ax * uw - aw * ux; const nl = Math.hypot(nx, nw, ny) || 1; if (nx * a0 + nw * w0 > 0) { nx = -nx; nw = -nw; ny = -ny; }
              lit *= sstep(0.03, 0.26, (nx * tq * sh - nw * td * sh + ny * sunDir.y) / nl); } }
          const cave = sA[k * 4 + 3]; sA[k * 4 + 3] = 0; sA[k * 4] *= lit * (1 - 0.4 * cave); sA[k * 4 + 1] *= 1 - 0.5 * cave;
          // (the cove's rock stands under the open sky and faces its own sunlit side: it has more of the sky's cool
          // light than the land's march gives it; the more, the further in from the skin's own edge)
          sA[k * 4 + 1] *= 1 + 1.1 * sstep(0, 24, DB[k]);
          if (c > 2 && c < NC - 2 && r > 2 && r < NR - 3) sA[k * 4 + 1] *= 1 - 0.5 * sat((T[k] - 0.25 * (T[k - 3 * NR] + T[k + 3 * NR] + T[k - 3] + T[k + 3])) / 2.5); }
        if (c % 8 === 7) await ctx.yield(); }
      // (the edge of a shade is eased over a few metres of the skin, so that it never follows the mesh's own cells)
      { const tmp = new Float32Array(NCV);
        for (let again = 0; again < 2; again++) {
          for (let k = 0; k < NCV; k++) { const c = (k / NR) | 0, r = k % NR; let s = 0, n = 0;
            for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const cc = c + dc, rr = r + dr; if (cc < 0 || cc > NC || rr < 0 || rr >= NR) continue;
              const w = (2 - Math.abs(dc)) * (2 - Math.abs(dr)); s += w * sA[(cc * NR + rr) * 4]; n += w; }
            tmp[k] = s / n; }
          for (let k = 0; k < NCV; k++) sA[k * 4] = tmp[k];
          await ctx.yield(); } }
      const si = []; for (let c = 0; c < NC; c++) for (let r = 0; r < NR - 1; r++) { const a = c * NR + r, b = a + NR; if (BAD[a] || BAD[b] || BAD[a + 1] || BAD[b + 1]) continue; si.push(a, b, a + 1, b, b + 1, a + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aA', new THREE.BufferAttribute(sA, 4)); g.setAttribute('aB', new THREE.BufferAttribute(sB, 4)); g.setAttribute('aC', new THREE.BufferAttribute(sC, 1));
      g.setIndex(si); skin.geo = g; skin.sp = sp; skin.bad = BAD;
      { let full = 0; for (let k = 0; k < NCV; k++) if (DB[k] > 7) full++; skin.tally = { columns: NC + 1, rows: NR, cells: si.length / 6, modelled: full }; }
      // the ledges that are deep and dry enough for a plant: [x, y, z, how deep]. A course's top is a ledge where the
      // block under it stands further out than the block over it.
      for (let c = 4; c < NC - 3; c++) { const us = (c - cF) * SK.du, sa = Math.sin(TH[c]), ca = Math.cos(TH[c]);
        for (let cr = 1; cr < 12; cr++) { let y = COURSE * cr - 4, k = c * NR + Math.round(rowOf(y)), t0 = Math.min(TA[k], TB[k] + 0.6); toWorld(K.cq + sa * t0, -(K.cw + ca * t0), o);
          y = COURSE * (cr - courseWander(o.x, o.z)) - 4; if (y < 3 || y > K.top - 24) continue; k = c * NR + Math.round(rowOf(y)); if (DB[k] < 9) continue;
          const up = Math.max(0, standAt(o.x, y + 1.6, o.z) - 1), deep = Math.max(0, standAt(o.x, y - 1.6, o.z) - 1) - up; relief(us, y, o.x, o.z, rl);
          if (deep < 0.5 || rl.wet > 0.5 || (K.fall && (nicheIn(us) > 0 || Math.abs(us - 46 - 0.17 * y) < 10 || Math.abs(us + 44 - 0.05 * y) < 12))) continue;
          t0 = Math.min(TA[k], TB[k] + 0.6) - 0.6 - 2 * up - deep; toWorld(K.cq + sa * t0, -(K.cw + ca * t0), o); skin.ledges.push([o.x, y + 0.15, o.z, deep]); } }
      if (!K.fall) return skin;
      // a place on the skin for the long fall's water: lat metres along from its line at height y, standing 0.45 m clear of
      // the rock; under the niche's roof it has left the rock and falls clear, thrown a little out toward the lake
      toWorld(K.cq, -K.cw, o); const ccx = o.x, ccz = o.z, outX = o.nx, outZ = o.nz;
      const spot = (cf, rf, oo) => { const c = Math.min(NC - 1, Math.floor(cf)), r = Math.min(NR - 2, Math.floor(rf)), a = cf - c, b = rf - r, k = (c * NR + r) * 3, k2 = k + NR * 3;
        oo.x = mix(mix(sp[k], sp[k2], a), mix(sp[k + 3], sp[k2 + 3], a), b); oo.z = mix(mix(sp[k + 2], sp[k2 + 2], a), mix(sp[k + 5], sp[k2 + 5], a), b); };
      skin.face = (lat, y, oo) => { const cf = Math.min(NC - 0.01, Math.max(0, cF + lat / SK.du)), nk = nicheIn(lat), roof = roofAt(lat);
        if (nk > 0.5 && y < roof + 1.8) { spot(cf, rowOf(roof + 1.8), oo); const th = 0.5 + 0.45 * Math.sqrt(Math.max(0, roof + 1.8 - y)); oo.x += outX * th; oo.z += outZ * th; }
        else spot(cf, rowOf(y), oo);
        const dx = ccx - oo.x, dz = ccz - oo.z, dl = Math.hypot(dx, dz) || 1; oo.x += (dx / dl) * 0.45; oo.z += (dz / dl) * 0.45; oo.y = y + 0.2; return oo; };
      // whether the skin is whole rock at such a place
      skin.sound = (lat, y) => { const c = Math.round(cF + lat / SK.du); return c > 1 && c < NC - 1 && !BAD[c * NR + Math.round(rowOf(y))]; };
      return skin;
    };
    const skin = await buildSkin({ cq: SK.cq, cw: SK.cw, top: SK.top, th0: -2.75, th1: 2.25, ref: Math.atan2(QM - SK.cq, COVE_BACK - SK.cw), nt: 124, inside: true, fall: true, q0: QM });
    const skinOut = await buildSkin({ cq: QMO - 30, cw: -62, top: 140, th0: -1.5, th1: 0.5, ref: Math.atan2(-RT.coveS - 10, 66), nt: 110, inside: false, fall: false, q0: QMO - RT.coveS - 40 });
    // the nearest of the wall's own dry rock to the flown line (the cove's sides and the buttress south of its mouth)
    let coveClear = Infinity;
    for (let i = 0, k = 0; i < NQ; i++) { if (qs[i] > 250 && qs[i] < QM + 320) for (let j = 0; j < ND; j++) { const kk = k + j; if (ds[j] < 0 && HT[kk] > 0.3 && HT[kk] < 70) { const dd = path.distanceTo(pos[kk * 3], HT[kk], pos[kk * 3 + 2]); if (dd < coveClear) coveClear = dd; } }
      k += ND; if ((i & 31) === 31) await ctx.yield(); }
    for (const s of [skin, skinOut]) { const sp = s.sp; for (let k = 0, n = sp.length / 3; k < n; k++) { const y = sp[k * 3 + 1]; if (y > 0.3 && y < 70 && !s.bad[k]) { const dd = path.distanceTo(sp[k * 3], y, sp[k * 3 + 2]); if (dd < coveClear) coveClear = dd; }
      if (k % 1500 === 1499) await ctx.yield(); } }
    const idx = new Uint32Array((NQ - 1) * (ND - 1) * 6); let ni = 0;
    for (let i = 0; i < NQ - 1; i++) { for (let j = 0; j < ND - 1; j++) { const a = i * ND + j, b = a + ND, c = a + 1, e = b + 1;
      if (Math.max(HT[a], HT[b], HT[c], HT[e]) < -2.5) continue;                                  // under the lake
      if (Math.abs(HT[a] - HT[e]) < Math.abs(HT[b] - HT[c])) { idx[ni++] = a; idx[ni++] = b; idx[ni++] = e; idx[ni++] = a; idx[ni++] = e; idx[ni++] = c; }
      else { idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; idx[ni++] = b; idx[ni++] = e; idx[ni++] = c; } }
      if (i % 120 === 119) await ctx.yield(); }
    await ctx.yield();
    // a mesh's smooth normals, summed in short steps (a big mesh's would hold the page in one piece)
    const normalsInSteps = async (geo, every = 60000) => { const p = geo.attributes.position.array, ix = geo.index.array, nn = new Float32Array(p.length);
      for (let t = 0; t < ix.length; t += 3) { const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3, ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; nn[a] += nx; nn[a + 1] += ny; nn[a + 2] += nz; nn[b] += nx; nn[b + 1] += ny; nn[b + 2] += nz; nn[c] += nx; nn[c + 1] += ny; nn[c + 2] += nz;
        if (t % every === every - 3) await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < nn.length; i += 3) { const l = Math.sqrt(nn[i] * nn[i] + nn[i + 1] * nn[i + 1] + nn[i + 2] * nn[i + 2]) || 1; nn[i] /= l; nn[i + 1] /= l; nn[i + 2] /= l;
        if (i % 150000 === 149997) await ctx.yield(); }
      geo.setAttribute('normal', new THREE.BufferAttribute(nn, 3)); await ctx.yield(); };
    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); wallGeo.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); wallGeo.setAttribute('aB', new THREE.BufferAttribute(aB, 4)); wallGeo.setAttribute('aC', new THREE.BufferAttribute(aC, 1));
    wallGeo.setIndex(new THREE.BufferAttribute(idx.subarray(0, ni), 1)); await normalsInSteps(wallGeo);
    // ---------- the land's material: granite, shale, snow, wet rock, talus, steppe, beach, pools and run-off, in one program ----------
    // On the wall and the cove nothing is a drawn line (on the towers and the fin the beds' joints and cracks are drawn,
    // each as wide as itself or as a pixel's footprint). A joint is relief: the face is a pile of blocks of three sizes, each standing a
    // little in or out, fluted down its height; the light falls on the lips and leaves the recesses dark. The mip chain of
    // the noise and the widening of every step with the pixel's footprint calm it with distance.
    // vA: sun's share (baked), sky's share (baked), d (metres out from the foot), how thick the trees stand; vB: metres off
    // the nearest fall's run-off, metres down it from the pool, couloir (1 in a horn's couloir, 0 on its arete, 0.5 on the
    // shore), q; vWet: wet rock
    // (on the cove's and the buttress's skins the second of vB is -1200, which marks rock modelled in the mesh, and the
    // third is the block's own shade; on a tower's skin the second of vB is under -2000, its first says how near the
    // place lies on a ledge and vWet how near under one it hangs)
    const landMat = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...LU, uContact: { value: 442 } },
      vertexShader: /* glsl */`attribute vec4 aA, aB; attribute float aC; varying vec3 vW, vN; varying vec4 vA, vB; varying float vWet;
        #include <fog_pars_vertex>
        void main(){ vA = aA; vB = aB; vWet = aC; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = normal; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform float uContact; varying vec3 vW, vN; varying vec4 vA, vB; varying float vWet;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_GALE}
        ${GLSL_LIGHT}
        ${GLSL_TOWERS}
        float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float h21(vec2 v){ return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453); }
        // jointed blocks: courses of blocks, every course set along by its own amount; each block stands in or out of the
        // face by its own share (0..1). The steps between blocks are e wide (in blocks), never narrower than the pixel.
        float blocks(vec2 c, vec2 e){
          float j = floor(c.y), x0 = c.x + h11(j * 7.31) * 9., x1 = c.x + h11(j * 7.31 + 7.31) * 9., i0 = floor(x0), i1 = floor(x1);
          float a = mix(h21(vec2(i0, j)), h21(vec2(i0 + 1., j)), smoothstep(1. - e.x, 1., fract(x0)));
          float b = mix(h21(vec2(i1, j + 1.)), h21(vec2(i1 + 1., j + 1.)), smoothstep(1. - e.x, 1., fract(x1)));
          return mix(a, b, smoothstep(1. - e.y, 1., fract(c.y))); }
        // beds of uneven thickness along one measure c: every whole number has a joint within .35 of it, so that a bed is
        // .3 to 1.7 thick. x: how far c stands over the joint under it, y: how far under the joint over it, z: its bed's number
        vec3 bedAt(float c){
          float j = floor(c), j0 = j + .7 * (h11(j * 1.37) - .5), j1 = j + 1. + .7 * (h11((j + 1.) * 1.37) - .5);
          float lo = step(c, j0), hi = step(j1, c);
          float under = mix(mix(j0, j1, hi), j - 1. + .7 * (h11((j - 1.) * 1.37) - .5), lo);
          float over = mix(mix(j1, j + 2. + .7 * (h11((j + 2.) * 1.37) - .5), hi), j0, lo);
          return vec3(c - under, over - c, j - lo + hi); }
        // how far the rock stands out of the smooth face at a place of it (f: metres along the face, metres up it), in metres.
        // wp: how the joints wander there; e12, e3s: the widths of the steps of the four sets of blocks; kk: how much of
        // each set is still seen at this distance; capK: 1 in the shale. bb: each set's standing at the place.
        // big: how much of the pillars and the flutes is left to this relief (little where the mesh itself is modelled).
        // fl: the scale of the flutes along the face and up it.
        float reliefAt(vec2 f, vec2 wp, vec2 fine, vec4 e12, vec4 e3s, vec4 kk, float capK, float big, vec2 fl, out vec4 bb){
          vec2 c1 = vec2(f.x + .12 * f.y + wp.x * 9., f.y + wp.y * 12.) / vec2(15., 41.);             // pillars and great slabs
          vec2 c2 = vec2(f.x - .08 * f.y + wp.y * 4. + fine.x * .3, f.y + wp.x * 4.) / vec2(5.2, 8.6); // blocks
          vec2 c3 = vec2(f.x + .05 * f.y + wp.x * 1.5, f.y + wp.y * 1.) / vec2(1.7, 2.3);             // the small jointing seen from near
          vec2 cs = vec2(f.x + wp.x * 9., f.y + 6. * wp.y) / vec2(8., 3.1);                            // the shale's thin beds
          bb = (vec4(blocks(c1, e12.xy), blocks(c2, e12.zw), blocks(c3, e3s.xy), blocks(cs, e3s.zw)) - .5) * kk;
          float flute = nR(f * fl + .2) + .5 * nG(f * fl * 2.44);
          return mix((2.4 * bb.x + 1.3 * flute) * big + .85 * bb.y * (.5 + .5 * big) + .26 * bb.z, 1.1 * bb.w + .5 * bb.x + .3 * flute, capK); }
        // the ground's own roughness on a ledge, a bench, the talus
        float groundAt(vec2 xz){ return .9 * nG(xz * .045) + .35 * nA(xz * .09) + .1 * nA(xz * .37); }
        void main(){
          vec3 Ns = normalize(vN);
          float px = max(length(dFdx(vW)), length(dFdy(vW)));                      // a pixel's footprint on this surface, metres
          float d = vA.z, y = vW.y;
          // a tower in the lake is the same rock in small: its blocks and flutes are two and a half times finer
          // (the fin is the wall's rock seen from near: its blocks are twice as fine)
          float own = step(vB.y, -1500.), finK = step(1500., vB.x), sc = mix(mix(1., 2., finK), 2.5, own), yg = y * sc, pg = px * sc;
          float isle = max(own, finK);                                             // (rock that stands out in the lake)
          // every face is measured in the world's own axes, so that nothing on it is drawn out: a steep face that looks
          // east or west by its metres north and its height, one that looks north or south by its metres east and its
          // height (a tower's by the metres round its girth); ground that lies nearer level than steep, and the underside
          // of an overhang, by its plan
          float run = abs(Ns.x) > abs(Ns.z) ? -vW.z * sign(Ns.x) : vW.x * sign(Ns.z), under = step(.7, abs(Ns.y));
          float q = mix(run, vB.w, own) * sc;
          vec2 fq = mix(vec2(q, yg), vW.xz * sc, under);                           // the face's own coordinates: along it, up it
          float steep = 1. - smoothstep(.45, .8, Ns.y);
          float nBig = nR(fq * .0011 + .37), nMid = nG(fq * .0047), nFine = nA(fq * .021 + .11), nGrain = nA(vW.xz * .09 + y * .05);
          // ----- the shale's foot: above it the rock is dark and thin-bedded -----
          // (a tower's own contact comes with its skin, where it wanders by some metres round the girth)
          float yc = mix(uContact + 34. * (nBig - .5) + 9. * (nMid - .5) + .012 * vB.w, -2000. - vB.y + nMid - .5, own);
          float us = (y - yc) * sc, cap = smoothstep(-max(pg, .3), max(pg, .3), us);
          // ----- relief: how far the rock stands out of the smooth face, metres -----
          // (measured across one pixel of the face itself, along it and up it: the slope of the standing gives the normal.
          // A step between two blocks is never narrower than two pixels, and a set of blocks goes once a pixel spans a
          // third of one.)
          vec2 warp = vec2(nMid, nR(fq * .0043 + .61)) - .5, fine = vec2(nFine, nGrain);
          vec2 pb = vec2(pg);
          // (seen from near a step between blocks is a crisp edge; from far it is eased, so that it never draws a thin line)
          float crisp = smoothstep(.2, 1.4, pg);
          vec4 e12 = clamp(vec4(pb / vec2(15., 41.), pb / vec2(5.2, 8.6)) * 2., mix(vec4(.05, .03, .06, .04), vec4(.3, .1, .3, .16), crisp), vec4(.5));
          vec4 e3s = clamp(vec4(pb / vec2(1.7, 2.3), pb / vec2(8., 3.1)) * 2., mix(vec4(.1, .08, .1, .14), vec4(.42, .3, .1, .14), crisp), vec4(.5));
          vec4 kk = 1. - smoothstep(.3, .8, vec4(pg / 15., pg / 5.2, pg / 1.7, pg / 3.1));
          vec4 bb, bx;
          // (the cove's and the buttress's rock is modelled in the mesh; the fin's in part)
          float modelled = step(vB.y, -1100.) * (1. - own), big = 1. - mix(.2, .3, finK) * modelled, nearK = max(modelled, own);
          // (the far wall is fluted in long thin runnels; the rock that is seen from near, the cove's, the fin's and the
          // towers', in grooves a few metres across and some ten metres long)
          vec2 fl = mix(vec2(.037, .0034), vec2(.045, .012) / sc, nearK);
          float dl = max(pg, .08), H0 = reliefAt(fq, warp, fine, e12, e3s, kk, cap, big, fl, bb);
          // (the face's own two directions: level along it, the way its own metres run, and up it)
          vec3 Tl = normalize(vec3(-Ns.z, 0., Ns.x) + vec3(1e-5, 0., 0.)) * (2. * own - 1.), Tu = cross(Tl, Ns); if (Tu.y < 0.) Tu = -Tu;
          float Ha = reliefAt(fq + vec2(dl, 0.), warp, fine, e12, e3s, kk, cap, big, fl, bx), Hu = reliefAt(fq + vec2(0., dl * mix(Tu.y, 1., under)), warp, fine, e12, e3s, kk, cap, big, fl, bx);
          vec2 gs = vec2(Ha - H0, Hu - H0) / dl;                                   // metres out per metre along, per metre up the face
          float G0 = groundAt(vW.xz), gd = max(px, .1);
          vec2 gf = vec2(groundAt(vW.xz + vec2(gd, 0.)) - G0, groundAt(vW.xz + vec2(0., gd)) - G0) / gd;
          // (seen from near, the joint between two blocks is a crease that little light reaches)
          float crease = clamp(length(gs) * .4 - .15, 0., 1.) * steep * (1. - crisp);
          // (and from far it is a soft dark seam, never narrower than the step itself)
          float seam = clamp(length(gs) * 1.1 - .08, 0., 1.) * steep * crisp;
          gs *= min(1., 2.4 / max(length(gs), 1e-4)); gf *= min(1., 1.6 / max(length(gf), 1e-4));
          vec3 N = normalize(Ns - (Tl * gs.x + Tu * gs.y) * steep - vec3(gf.x, 0., gf.y) * (1. - steep) + (vec3(nFine, nA(fq * .13), nGrain) - .5) * .22);
          float b1 = bb.x, b2 = bb.y, bs = bb.w;
          // ----- granite: warm, in great zones of ochre, cream and rose; every block weathers its own shade -----
          vec3 granite = mix(vec3(.56, .41, .27), vec3(.71, .58, .44), nBig);
          granite = mix(granite, vec3(.74, .55, .47), smoothstep(.42, .72, nR(fq * .0031 + 5.3)) * .7);
          // (on the rock that stands out in the lake the great blocks keep less of a shade of their own: there the beds do)
          granite *= (1. + (.3 * b1 + .24 * b2) * (1. - .55 * isle)) * (.9 + .2 * nFine);
          granite *= 1. + modelled * (vB.z - .5) * vec3(.7, .62, .5) * (1. - .45 * finK);              // (a modelled block's own shade)
          // ----- the rock that stands out in the lake, passed at 20 to 45 m: its beds, its cracks, its grain -----
          // The beds lie level in the world (gently warped, by the place's plan), a hand to a metre thick in the granite
          // and thinner in the shale; a joint is a dark line under the bed above it, broader where that bed stands out
          // further, and dies out and comes again along the face; a crack runs down through one to four beds; within
          // a bed the rock is laminated and grained. Every line is as wide as it is or as a pixel's footprint, whichever
          // is more, and fainter by as much, so that with distance the face goes to its mean.
          // (seen from near, every rock of the wall shows its small things as the rock in the lake does: joints, cracks,
          // a lit lip on a bed that stands out, crusts of lichen, the grain. They go by the pixel's footprint alone: full
          // where a pixel covers under about 9 cm of the rock, gone where it covers over about 22 cm; that is the eye's
          // distance, the picture's size and how aslant the face is seen; it is a filter and hides nothing.)
          float nearD = 1. - smoothstep(.09, .22, px), isleN = max(isle, modelled * nearD);
          float ym = y + .9 * (nG(vW.xz * .017 + .3) - .5), qm = q / sc, capS = step(.5, cap), cellM = mix(.5, .24, capS);
          vec3 bd = bedAt(ym / cellM);
          float bedTone = h11(bd.z * 2.91 + 1.7), bedOver = h11((bd.z + 1.) * 2.91 + 1.7), jw = max(px * 1.4, .012);
          // (a bed's own shade does not end on a ruled line: over a pixel's footprint at each of its edges it goes over to
          // its neighbour's, half way at the edge itself, so that the two sides meet)
          float ew = max(px, .004), bedShade = mix(mix(bedTone, bedOver, .5 - .5 * smoothstep(0., ew, bd.y * cellM)), h11((bd.z - 1.) * 2.91 + 1.7), .5 - .5 * smoothstep(0., ew, bd.x * cellM));
          float tb = (.02 + .1 * max(bedOver - bedTone, 0.)) * (1. + .8 * nearD);   // (from near the shadow under a bed that stands out is seen whole)
          // (where a joint dies out and comes again is read off the noise by the bed's own number, a coordinate that jumps
          // from bed to bed: the lookup's level is given from the pixel's footprint, not from that jump)
          float joint = (1. - smoothstep(tb, tb + jw, bd.y * cellM)) * min(1., (tb + .012) / (tb + .5 * jw)) * smoothstep(.4, .6, textureGrad(tNoise, vec2(qm * .031, bd.z * .173 + .5), vec2(px * .031, 0.), vec2(0., px * .031)).r);
          // (a run of one to four beds shares its cracks, which lean a little, each run its own way)
          float g4 = floor(bd.z / 4.), band = g4 * 2. + step(2. + floor(h11(g4 * 4.7) * 3.), bd.z - 4. * g4);
          vec3 ck = bedAt((qm + (h11(band * 2.3) - .5) * .5 * ym) / 2.3 + h11(band * 5.3) * 17.);
          float crack = (1. - smoothstep(.012, .012 + jw, min(ck.x, ck.y) * 2.3)) * min(1., .024 / (.012 + .5 * jw)) * step(.66, h11((ck.z + step(ck.y, ck.x)) * 7.7 + band * 3.1));
          float lines = max(joint, crack * (1. - .6 * capS)) * steep * isleN;
          float bedsK = steep * isleN * (1. - smoothstep(.25, .8, px / cellM));
          // (a bed that stands out further than the one over it has a top that takes the light: a pale lip under its joint)
          float dj = bd.y * cellM, tl = .03 + .08 * max(bedTone - bedOver, 0.);
          float lip = smoothstep(tb, tb + jw, dj) * (1. - smoothstep(tb + tl, tb + tl + jw, dj)) * min(1., tl / (tl + .5 * jw)) * smoothstep(0., .3, bedTone - bedOver) * steep * isleN * nearD;
          // (no face is ruled by them: each bed's lip has a strength of its own, one bed in three none; along the face it
          // comes and goes in runs of some metres, read off the noise by the bed's own number as a joint's gaps are; and
          // it fades with the pixel's footprint sooner than the joints do)
          lip *= smoothstep(.3, .75, h11(bd.z * 5.3 + 2.9)) * (1. - smoothstep(.03, .12, px))
               * smoothstep(.4, .56, textureGrad(tNoise, vec2(qm * .043 + .37, bd.z * .291 + .13), vec2(px * .043, 0.), vec2(0., px * .043)).r);
          granite *= 1. + bedsK * (bedShade - .5) * .26 + steep * isle * ((nA(vec2(qm * .05, ym * .35)) - .5) * mix(.32, .22, finK) + (nA(fq * .1 + 5.1) - .5) * .3);
          // dark streaks of lichen and old water hanging down the faces, and rust
          // (on the rock that is seen from near, the cove's, the fin's and the towers', they are short: a few metres)
          float sy = mix(1., 1.7, nearK);
          float streak = smoothstep(.56, .8, nG(vec2(q * .027, yg * .007 * sy) + 3.) * .62 + nR(vec2(q * .083, yg * .021 * sy)) * .38) * steep;
          granite = mix(granite, granite * vec3(.46, .42, .42), streak * mix(.5, .3, nearK));
          granite = mix(granite, vec3(.5, .27, .11), smoothstep(.66, .84, nR(fq * .0057 + 7.1) * .7 + nFine * .3) * .45);
          // ----- shale above its foot: near-black, with pale sills of the granite running through it and rust at its foot -----
          vec3 shale = mix(vec3(.045, .042, .05), vec3(.12, .105, .1), bs * .6 + .3 + nFine * .4);
          float sill = (1. - smoothstep(1.4 + 3. * nBig, 2.2 + 3. * nBig + pg, abs(us - 30. - 14. * (nMid - .5))))
                     + (1. - smoothstep(.8 + 1.6 * nBig, 1.4 + 1.6 * nBig + pg, abs(us - 68. - 20. * (nMid - .5))));
          shale = mix(shale, vec3(.5, .45, .38) * (.8 + .4 * nFine), clamp(sill, 0., 1.) * .85 * (1. - own));
          shale = mix(shale, vec3(.24, .12, .07), (1. - smoothstep(0., 22., us)) * .5 * nMid);
          // (a tower's spire is passed near: dark grey-brown shale, every metre or so of its beds a shade of its own, here
          // and there a rusty one, the thin beds within them seen from near; no pale sill runs through it)
          vec3 bg = bedAt(ym / 1.15 + 40.);
          float groupK = 1. - smoothstep(.3, .9, px / 1.15), eo = .5 - .5 * smoothstep(0., ew, bg.y * 1.15), eu = .5 - .5 * smoothstep(0., ew, bg.x * 1.15);
          float toneG = mix(mix(h11(bg.z * 3.3 + .7), h11((bg.z + 1.) * 3.3 + .7), eo), h11((bg.z - 1.) * 3.3 + .7), eu);
          float rustG = mix(mix(step(.78, h11(bg.z * 1.9 + 4.)), step(.78, h11((bg.z + 1.) * 1.9 + 4.)), eo), step(.78, h11((bg.z - 1.) * 1.9 + 4.)), eu);
          vec3 shaleT = mix(vec3(.2, .175, .15), mix(vec3(.15, .13, .115), vec3(.3, .26, .215), toneG * .75 + .25 * nFine), groupK);
          shaleT = mix(shaleT, vec3(.27, .18, .115), rustG * .35 * groupK);
          shaleT *= 1. + bedsK * (bedShade - .5) * .5 + (nA(vec2(qm * .05, ym * .35)) - .5) * .3 * steep;
          shaleT *= 1. - .5 * (1. - smoothstep(.03, .03 + jw, min(bg.x, bg.y) * 1.15)) * min(1., .05 / (.03 + .5 * jw)) * steep;
          shale = mix(shale, shaleT, own);
          vec3 rock = mix(granite, shale, cap);
          // (a joint or a crack of the rock in the lake: little light reaches into it)
          rock *= (1. - .6 * lines) * (1. + .7 * lip);
          // (lichen: crusts a hand to a pace across, grey-green or rusty gold, sharp-edged, in drifts on the dry steep
          // granite; and the rock's grain. Laid in the face's own metres, so that nothing of them is drawn out.)
          float lv = nG(fq * .27 + 7.7) * .5 + nA(fq * .19 + 2.3) * .35 + nA(fq * .71) * .15, le = clamp(pg * .5, .012, .2);
          float lich = smoothstep(.64, .64 + le, lv) * smoothstep(.38, .62, nMid) * nearD * steep * (1. - cap) * (1. - under);
          rock = mix(rock, mix(vec3(.47, .5, .4), vec3(.6, .4, .13), smoothstep(.55, .6, nR(fq * .013 + 3.3))) * (.75 + .5 * nFine), lich * .7);
          rock *= 1. + nearD * steep * ((nA(fq * .06 + .21) - .5) * .3 + (nA(fq * .17 + .5) - .5) * .2);
          // (dark streaks of old water hang under a tower's ledges, each some decimetres to a metre broad)
          float dampT = own * (1. - cap) * steep * smoothstep(.5, .6, nR(vec2(vB.w * .21, y * .004 + 5.)) + (nA(fq * .21 + 1.3) - .5) * .1 * nearD - .45 * (1. - vWet)) * smoothstep(0., .15, vWet);
          rock = mix(rock, rock * vec3(.42, .39, .39), dampT * .75);
          // ----- wet rock: the chute under a fall's lip and the seeps of the gullies, near black, ragged at their edges -----
          // (on a tower the skin's third figure is not wet rock: it says how near under a ledge the place hangs)
          float wetV = vWet * (1. - own);
          float wetK = smoothstep(.25, .75, wetV + (nG(vec2(q * .019, yg * .0075) + 1.7) - .5) * .45 * step(.02, wetV));
          rock = mix(rock, rock * vec3(.2, .18, .18) + vec3(.012, .01, .008), wetK * .93);
          // ----- snow: couloirs of the horns, ledges, patches on the bench; clean edges -----
          float up = mix(Ns.y, N.y, .5), se = max(px * .02, .012);
          float coul = vB.z;
          // (the couloirs' snow ends downward on no level: its lower edge is eased over some tens of metres and wanders
          // with the rock's fine grain)
          float snowK = max(smoothstep(.5 - se, .5 + se, coul * .8 + (up - .55) * .45 + (nFine - .5) * .25) * smoothstep(282., 330., y + (nFine - .5) * 44. + (nMid - .5) * 30.),
                            smoothstep(.56 - se, .56 + se, nR(vW.xz * .0061 + .5) * .6 + (Ns.y - .72) * 1.1 + (nFine - .5) * .1) * smoothstep(120., 150., y) * (1. - smoothstep(-3., 1., d)));
          // ----- the ground under the trees: dark leaf litter, ragged at its edge; talus at the wall's foot -----
          float fo = smoothstep(.3, .56, vA.w + (nFine - .5) * .5 + (nA(vW.xz * .043 + y * .03) - .5) * .5);
          vec3 litter = mix(vec3(.11, .06, .035), vec3(.24, .13, .05), nGrain * .7 + nFine * .3);
          float tal = (1. - smoothstep(18., 62., d)) * smoothstep(-34., -6., d) * (1. - steep * .7);
          vec3 talus = mix(vec3(.3, .25, .2), vec3(.6, .5, .4), nGrain) * (.7 + .6 * nA(vW.xz * .23));
          vec3 alb = mix(rock, talus, tal * .85);
          // (grass and rusty cushions on the ledges of the lower wall)
          // (the paint ends raggedly at the wall's foot, not on the foot's own straight line)
          float ledge = smoothstep(.62, .86, Ns.y) * (1. - smoothstep(-3., 1., d + (nFine - .5) * 4.)) * (1. - smoothstep(190., 300., y)) * (1. - wetK);
          alb = mix(alb, mix(vec3(.6, .47, .2), vec3(.42, .17, .07), smoothstep(.4, .62, nGrain)), ledge * smoothstep(.36, .56, nMid * .5 + nFine * .5) * .8);
          alb = mix(alb, litter, fo * .85);
          alb = mix(alb, vec3(.8, .84, .9), snowK);
          // ----- the shore: beach pebbles, and the steppe: coiron packed crown by crown, cushion plants between -----
          float tau = galeTau(vW.xz), gust = galeGust(tau);
          if (d > 0.) {
            float nS = nR(vW.xz * .011), nP = nA(vW.xz * .13), nC = nG(vW.xz * .037 + .7);
            vec3 pebble = mix(vec3(.2, .2, .2), vec3(.5, .49, .46), nP) * (.8 + .3 * nGrain);
            // grass lying down in gust bands that run with the gale
            float band = nR(vec2(dot(vW.xz, vec2(.785, .62)) * .012, dot(vW.xz, vec2(.62, -.785)) * .004 - uTime * .19)) ;
            // the steppe seen from above: a pale straw crown in every pace of ground, each brighter on the sun's side, with dark
            // thatch and its own shadow lying beside it; as the pixel grows past a crown they run together into their mean
            vec2 tc = vW.xz / 1.3 + (vec2(nP, nGrain) - .5) * .5, ti = floor(tc), tf = fract(tc) - .5 - (vec2(h11(ti.x + ti.y * 57.), h11(ti.x * 1.3 + ti.y * 91. + 3.)) - .5) * .5;
            float tr = length(tf), tk = dot(tf, normalize(uSunDir.xz)) / max(tr, .05), tsz = h11(ti.x * 3.7 + ti.y * 13.1);
            float crown = (1. - smoothstep(.16 + .14 * tsz, .34 + .2 * tsz, tr)) * step(.12, tsz), blur = smoothstep(.2, .9, px);
            float tuftL = mix(mix(.4 - .15 * (1. - crown) * smoothstep(-.2, .9, -tk), .82 + .22 * tk, crown), .62, blur);
            vec3 strawC = mix(mix(vec3(.74, .58, .25), vec3(.86, .77, .46), nS), vec3(.5, .52, .22), smoothstep(.5, .75, nC) * .45);
            vec3 straw = strawC * tuftL * (.85 + .5 * smoothstep(.45, .7, band) * (.4 + .6 * gust));
            vec3 cushion = mix(vec3(.27, .33, .24), vec3(.42, .47, .36), nP);
            vec3 steppe = mix(straw, cushion, smoothstep(.6, .66, nC * .6 + nA(vW.xz * .021 + 3.) * .4 + (nP - .5) * .12) * .85);
            steppe = mix(steppe, pebble, smoothstep(.72, .8, nS + (nP - .5) * .3) * .6);
            float beach = 1. - smoothstep(2.1, 3.0, y + (nS - .5) * 1.2);
            vec3 sh = mix(steppe, pebble, beach);
            sh *= 1. - .45 * (1. - smoothstep(.15, .9, y));                     // wet at the waterline
            alb = mix(sh, alb, tal * .85);
          } else {
            // rock that stands in the lake: rusty and grey-green lichen on its ledges and tops, dark and wet where the waves reach
            float top = smoothstep(.55, .85, Ns.y) * (1. - fo) * (1. - snowK);
            alb = mix(alb, mix(vec3(.5, .36, .14), vec3(.4, .44, .3), nGrain), isle * top * smoothstep(.42, .6, nMid + (nFine - .5) * .5) * .75);
            // (moss on a tower's ledges and hanging a little way over their edges: the skin's own first figure says where)
            alb = mix(alb, mix(vec3(.1, .125, .05), vec3(.21, .22, .1), nGrain), own * (1. - cap) * smoothstep(.42, .62, vB.x * (.5 + nG(fq * .03 + 7.)) + (nFine - .5) * .5 + (nA(fq * .1 + 5.1) - .5) * .3) * .75);
            alb *= 1. - .6 * (1. - smoothstep(.2, 2.6, y + (nFine - .5) * 1.6));
          }
          // ----- plunge pools and their run-off: turquoise-white water, never thinner than two pixels -----
          float along = vB.y, lat = vB.x + 3.2 * sin(along * .043 + q * .013) * smoothstep(14., 40., along);
          float hwid = max(2.1 + .011 * along, px * 1.1), aw = max(px, .08);
          float strm = (1. - smoothstep(hwid - aw, hwid + aw, abs(lat))) * step(0., along) * step(-.2, y);
          float pr = length(vec2(vB.x, along)), pool = (1. - smoothstep(12. - aw, 12. + aw, pr + 3. * (nFine - .5))) * smoothstep(.55, .8, Ns.y);
          float flow = nA(vec2(lat * .21, along * .06 - uTime * .55)) * .6 + nG(vec2(lat * .09, along * .02 - uTime * .2)) * .4;
          vec3 wat = mix(vec3(.24, .47, .46), vec3(.82, .9, .9), smoothstep(.4, .75, flow) * .8 + .2 * (1. - smoothstep(0., 9., pr)));
          float wet = max(strm, pool);
          alb = mix(alb, wat, wet);
          // ----- light: the low sun on whatever faces it, the sky's blue in the shade, the lake's and the lit rock's glow from below -----
          N = normalize(mix(N, Ns, wet));
          // (a face the sun only grazes is in the shade of its own roughness: the small relief cannot light it)
          float graze = mix(1., smoothstep(.0, .16, dot(Ns, uSunDir)), steep);
          float ndl = max(dot(N, uSunDir), 0.) * graze, shade = vA.x * scudShade(vW) * mix(towerShade(vW), 1., own) * mix(finShade(vW), 1., finK);
          float cav = (1. + .5 * b1 * steep) * (1. + .34 * b2 * steep);                          // a block that stands back sees less of the sky
          // (in the shade the relief still shows: the open sky to one side of the sun is brighter than the deck to the other)
          float fill = (1. + mix(.42, 1.2, isle) * dot(N - Ns, normalize(vec3(uSunDir.z, .6, -uSunDir.x))) * steep) * (1. - .5 * crease - .4 * seam);
          vec3 light = uSunCol * ndl * shade * (1. - .35 * crease - .35 * seam) + uSkyCol * (.42 + .58 * (.5 + .5 * N.y)) * vA.y * cav * fill
                     + uBounce * (1. - N.y) * .5 * (1. - smoothstep(0., mix(340., 60., own), y)) * vA.y + uSunCol * .06 * (1. - shade) * vA.y
                     + uSunCol * .1 * isle * (1. - shade);                         // (a tower in the shade still has the lit lake and the lit wall round it)
          vec3 col = alb * light;
          // wet rock shines where the sun finds it
          vec3 V = normalize(cameraPosition - vW);
          col += uSunCol * pow(max(dot(reflect(-uSunDir, N), V), 0.), 30.) * .16 * smoothstep(.5, 1., wetK) * shade * (1. - wet);
          // and throws back the sky: a cool sheen, strongest where the face is seen aslant
          col += (uSkyCol * 1.3 + vec3(.02, .03, .05)) * smoothstep(.4, 1., wetK) * (.2 + .8 * pow(max(1. - max(dot(N, V), 0.), 0.), 3.)) * vA.y * (1. - wet) * (1. - .7 * shade);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    const wall = new THREE.Mesh(wallGeo, landMat); wall.frustumCulled = false; scene.add(wall);
    for (const s of [skin, skinOut]) { await normalsInSteps(s.geo, 30000); const m = new THREE.Mesh(s.geo, landMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();
    // ---------- the towers: one mesh, each a skin of rows round its own axis; finer for those the line passes near, and
    // closer set near the water, where the eye flies ----------
    // aA: sun's share (its own far side, its own ledges and chimneys, and whatever tower stands toward the sun), sky's share,
    // -40 (rock), 0; aB: how near it lies on a ledge (moss), -2000 - the height of its own shale contact at that bearing
    // (over its top where it has no spire), 0.5, metres round its girth; aC: how near under a ledge it hangs
    const stackClear = [Infinity, Infinity];                        // the nearest dry rock to the flown line: of a tower passed near, of a lesser one
    const gridOf = (st) => st.grade === 2 ? [64, 40] : st.grade === 1 ? [44, 24] : [32, 16];
    // how far a place stands outside a tower's skin (metres; negative inside the rock)
    const towerOut = (b, x, y, z) => { const k = sat(y / b.H), dx = x - b.x - b.lean[0] * b.H * k * k, dz = z - b.z - b.lean[1] * b.H * k * k; return Math.hypot(dx, dz) - stackRad(b, Math.atan2(dz, dx), y); };
    { const ip = [], ia = [], ib = [], iw = [], ii = [], o = {}, sl = Math.hypot(sunDir.x, sunDir.z), STEPS = [1.1, 2.2, 4, 7, 11, 17, 26, 38];
      for (const st of STACKS) { const [NT, NY] = gridOf(st), base = ip.length / 3, y0 = -3.5;
        // at each bearing of the skin: how far under the spire's shoulder the shale's contact lies there (0.5 to 7.1 m: it
        // rises and falls slowly on the top storey's face, a few times round the girth); the height of every ledge, how
        // much moss lies on it there (where it steps back, in patches) and how much old water has run down from it (in
        // patches of the girth; each ledge's streaks have a length of their own)
        const wand = [], ledgeY = [], ledgeMoss = [], ledgeRun = [], runLen = [];
        for (let l = 1; l <= st.storeys; l++) runLen.push(4 + 3.5 * (1 + n2(l * 5.7 + st.seed, 2.1)));
        for (let i = 0; i <= NT; i++) { const th = (i / NT) * 6.2832, cx = Math.cos(th), sx = Math.sin(th), wd = stackWander(st, th);
          wand.push(-3.8 + 3.3 * n2(cx * 0.8 + st.seed * 1.7, sx * 0.8 + 9.1));
          for (let l = 1; l <= st.storeys; l++) { const yl = st.lev[l] - wd; ledgeY.push(yl);
            ledgeMoss.push(sat((stackRad(st, th, yl - 1.3) - stackRad(st, th, yl + 1.3) - 0.4) / 1.2) * sat(0.35 + 1.2 * n2(cx * 3.1 + l * 1.7, sx * 3.1 + st.seed + 5)));
            ledgeRun.push(0.9 * sat(-0.15 + 1.4 * n2(cx * 2.2 + l * 3.1 + st.seed, sx * 2.2 + 1.3))); } }
        await ctx.yield();
        // which other towers stand toward the sun, near enough to shade this one
        const toSun = STACKS.filter((b) => { if (b === st) return false; const dx = b.x - st.x, dz = b.z - st.z, al = (dx * sunDir.x + dz * sunDir.z) / sl; return al > 0 && Math.abs(dx * sunDir.z - dz * sunDir.x) / sl < (b.R + st.R) * 2.4; });
        for (let j = 0; j <= NY; j++) { const y = y0 + (st.H - y0) * Math.pow(j / NY, 1.35);
          for (let i = 0; i <= NT; i++) { const th = (i / NT) * 6.2832; stackAt(st, th, y, o); ip.push(o.x, y, o.z);
            // its own rock toward the sun: a ledge, a chimney's wall, its far side
            let lit = 1;
            if (y > -1) for (let m = 0; m < STEPS.length && lit > 0; m++) { const l = STEPS[m], py = y + sunDir.y * l; if (py > st.H) break; lit = Math.min(lit, sat((towerOut(st, o.x + sunDir.x * l, py, o.z + sunDir.z * l) + 0.25) / (0.3 + 0.05 * l))); }
            // another tower standing toward the sun
            for (const b of toSun) { const dx = b.x - o.x, dz = b.z - o.z, al = (dx * sunDir.x + dz * sunDir.z) / sl; if (al < 0) continue;
              const off = Math.abs(dx * sunDir.z - dz * sunDir.x) / sl, top = y + (al * sunDir.y) / sl; if (top < b.H * 0.85) lit = Math.min(lit, sstep(b.R * 0.55, b.R * 1.0, off + b.R * 0.5 * sat(top / b.H))); }
            // its ledges: how near under one the place hangs (old water streaks the face there), how near it lies on one
            // that steps back (moss)
            let hang = 0, moss = 0;
            if (st.grade > 0 && y > 1) for (let l = 0; l < st.storeys; l++) { const up = ledgeY[i * st.storeys + l] - y;
              if (up > 0) hang = Math.max(hang, ledgeRun[i * st.storeys + l] * (1 - sstep(0.3, runLen[l], up)));
              moss = Math.max(moss, ledgeMoss[i * st.storeys + l] * (1 - sstep(1, 2.5, -up)) * (1 - sstep(0.3, 1.2, up))); }
            ia.push(lit, 0.6 + 0.4 * sat(y / 6), -40, 0); ib.push(moss, -2000 - (st.flat ? st.H + 60 : st.contact + wand[i]), 0.5, st.seed * 40 + th * st.R); iw.push(hang);
            if (y > 0.3) { const dd = path.distanceTo(o.x, y, o.z), k = st.grade === 2 ? 0 : 1; if (dd < stackClear[k]) stackClear[k] = dd; } }
          await ctx.yield(); }
        for (let j = 0; j < NY; j++) for (let i = 0; i < NT; i++) { const a = base + j * (NT + 1) + i, b = a + NT + 1; ii.push(a, b, a + 1, b, b + 1, a + 1); }
        await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(ia, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ib, 4));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(iw, 1));
      g.setIndex(ii); await ctx.yield(); await normalsInSteps(g, 30000);
      // (the seam where a skin closes on itself: both edges take the same normal)
      { const nn = g.attributes.normal.array; let base = 0; for (const st of STACKS) { const [NT, NY] = gridOf(st);
        for (let j = 0; j <= NY; j++) { const a = (base + j * (NT + 1)) * 3, b = a + NT * 3; for (let c = 0; c < 3; c++) { const v = nn[a + c] + nn[b + c]; nn[a + c] = v; nn[b + c] = v; }
          const l = Math.hypot(nn[a], nn[a + 1], nn[a + 2]) || 1; for (let c = 0; c < 3; c++) { nn[a + c] /= l; nn[b + c] /= l; } }
        base += (NT + 1) * (NY + 1); } }
      const m = new THREE.Mesh(g, landMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---------- the fin and its arch: a wall of the same granite standing out from the wall's foot across the line's
    // way, pierced where the line passes ----------
    // Its skin is rings of places from the opening's outline out to a frame (up the fin's side, along its crest to its
    // tip), the opening's own underside from face to face, and a plain run of columns in to the wall.
    // (foot: its outline at the water, for the lake's surf: FOOT_N places from FOOT_A0 to FOOT_A1 out along it, two
    // figures each: how far the rock stands to the one side and to the other of its middle plane)
    const FOOT_N = 512, FOOT_A0 = -(FIN.root + 40), FOOT_A1 = AR.tip;
    const fin = { clear: Infinity, tris: 0, foot: new Uint16Array(FOOT_N * 2) };
    { const NO = 84, NJ = 14, NB = 8, FINE = 400, o = {}, ip = [], ia = [], ib = [], ic = [], ii = [];
      // the outline, and the frame round it (up the fin's side at `body`, then along the crest to the tip), each cut
      // into NO steps of its own length; kc: the frame's corner
      const cut = (as, ys, n) => { const ls = [0]; for (let k = 1; k < as.length; k++) ls.push(ls[k - 1] + Math.hypot(as[k] - as[k - 1], ys[k] - ys[k - 1]));
        const ra = [], ry = []; for (let k = 0, i = 0; k <= n; k++) { const l = (k / n) * ls[ls.length - 1]; while (i < ls.length - 2 && ls[i + 1] < l) i++; const t = sat((l - ls[i]) / Math.max(1e-6, ls[i + 1] - ls[i])); ra.push(mix(as[i], as[i + 1], t)); ry.push(mix(ys[i], ys[i + 1], t)); }
        return [ra, ry, ls[ls.length - 1]]; };
      const fa = [], fy = []; for (let k = 0; k <= FINE; k++) { const ph = Math.PI * (1 - k / FINE), c = Math.cos(ph), s = Math.sin(ph); fa.push(AR.hw * Math.sign(c) * Math.pow(Math.abs(c), 2 / AR.p)); fy.push(-3 + (AR.top + 3) * Math.pow(Math.max(0, s), 2 / AR.p)); }
      const [OA, OY, OL] = cut(fa, fy, NO), yB = finTop(-AR.body), ca = [], cy = [];
      for (let k = 0; k <= 240; k++) { const a = -AR.body + (AR.tip + AR.body) * (k / 240); ca.push(a); cy.push(finTop(a)); }
      const crestLen = cut(ca, cy, 1)[2], kc = Math.round((NO * (yB + 3)) / (yB + 3 + crestLen)), [CA, CY] = cut(ca, cy, NO - kc), BA = [], BY = [];
      for (let k = 0; k <= NO; k++) { BA.push(k <= kc ? -AR.body : CA[k - kc]); BY.push(k <= kc ? -3 + (yB + 3) * (k / kc) : CY[k - kc]); }
      // the way into the opening at each place of its outline (in the fin's own a and y)
      const NA = [], NY = []; for (let k = 0; k <= NO; k++) { const k0 = Math.max(0, k - 1), k1 = Math.min(NO, k + 1), da = OA[k1] - OA[k0], dy = OY[k1] - OY[k0], l = Math.hypot(da, dy) || 1; NA.push(dy / l); NY.push(-da / l); }
      const sunF = [sunDir.x * FIN.ax + sunDir.z * FIN.az, sunDir.x * FIN.bx + sunDir.z * FIN.bz, sunDir.y], STEPS = [1.2, 2.4, 4, 6.5, 10, 15, 22, 32, 46, 64];
      // one place of the fin's skin: its light, its shade of weathering, its damp; and its clear air from the line
      const vert = (a, b, y, sky, damp) => { finW(a, b, o); ip.push(o.x, y, o.z);
        let lit = 1; if (y > -1) for (let m = 0; m < STEPS.length && lit > 0; m++) { const l = STEPS[m]; lit = Math.min(lit, sat((finOut(a + sunF[0] * l, b + sunF[1] * l, y + sunF[2] * l) + 0.25) / (0.3 + 0.05 * l))); }
        const seep = seepAt(o.x, y, o.z);
        ia.push(lit, sky * (0.6 + 0.4 * sat(y / 6)), -60, 0); ib.push(1999, -1200, blockTone(o.x, y, o.z), a); ic.push(1.4 * Math.max(0.55 * seep, damp));
        if (y > 0.3) { const dd = path.distanceTo(o.x, y, o.z); if (dd < fin.clear) fin.clear = dd; }
        return ip.length / 3 - 1; };
      // rock standing out of a face: the same courses of blocks the cove is piled of
      const stand = (a, b, y) => { finW(a, b, o); return 1.15 * Math.max(0, standAt(o.x, y, o.z) - 0.9) + 0.4 * sat(0.5 + n2(o.x * 0.11 + y * 0.07, o.z * 0.11 - y * 0.05)); };
      // the fin's outline at the water: at each place the least that the skin's own places round about stand out (the
      // two columns it lies between on the run in to the wall, 3 m to either side elsewhere), and 0.6 m inside that
      { const face = (a, sg) => { const h = finHalf(a, 0), ease = a < -AR.body ? 1 : sstep(0, 2.5, NJ * Math.pow(sat((Math.abs(a) - AR.hw) / (a < 0 ? AR.body - AR.hw : AR.tip - AR.hw)), 1 / 1.3));
          return h + stand(a, sg * h, 0) * sstep(0, 5, finTop(a)) * ease; };
        for (let i = 0; i < FOOT_N; i++) { const a = mix(FOOT_A0, FOOT_A1, (i + 0.5) / FOOT_N);
          for (let f = 0; f < 2; f++) { const sg = f ? 1 : -1; let m = Infinity;
            if (a < -AR.body) { const c = Math.floor((-AR.body - a) / 5.5); m = Math.min(face(-AR.body - c * 5.5, sg), face(-AR.body - (c + 1) * 5.5, sg)); }
            else for (let da = -3; da <= 3; da += 1.5) m = Math.min(m, face(Math.min(AR.tip, a + da), sg));
            fin.foot[i * 2 + f] = THREE.DataUtils.toHalfFloat(m - 0.6); }
          if (i % 128 === 127) await ctx.yield(); } }
      // rock standing into the opening (never more than 5 m in all): blocks; a plinth at each pier's foot and a ledge
      // higher up it; one block hanging from the lintel's underside toward the lake
      const kHang = NO * 0.61;
      const into = (k, v, a, b, y) => { finW(a, b, o); const pier = sstep(0.75, 0.95, Math.abs(NA[k]));
        return Math.min(2.4, 0.55 * Math.max(0, standAt(o.x, y, o.z) - 0.9) + 0.3 * sat(0.5 + n2(o.x * 0.13 + y * 0.09, o.z * 0.13)))
          + pier * (1.3 * (1 - sstep(6, 8, y + 1.2 * n2(b * 0.11 + 3, a * 0.05))) + 0.9 * (1 - sstep(18, 20, y + 1.5 * n2(b * 0.08, a * 0.05 + 7))))
          + 4.4 * (1 - sstep(1.3, 2.6, Math.abs(k - kHang))) * (1 - sstep(0.2, 0.34, Math.abs(v - 0.5))); };
      const F0 = [[], []], body = [[], []], NCB = Math.ceil((FIN.root + 40 - AR.body) / 5.5);
      for (let f = 0; f < 2; f++) { const sg = f ? 1 : -1;
        // the rock about the opening: rings from its outline out to the frame
        for (let k = 0; k <= NO; k++) { const row = [];
          for (let j = 0; j <= NJ; j++) { const t = Math.pow(j / NJ, 1.3); let a = mix(OA[k], BA[k], t), y = mix(OY[k], BY[k], t); const h = finHalf(a, y);
            if (j === 0) { const d = into(k, f, a, sg * h, y); a += NA[k] * d; y += NY[k] * d; row.push(vert(a, sg * h, y, 0.75, 0.25)); }
            else row.push(vert(a, sg * (h + stand(a, sg * h, y) * sstep(0, 5, finTop(a) - y) * sstep(0, 2.5, j)), y, 1 - 0.25 * (1 - sstep(0, 0.5, t)), 0)); }
          F0[f].push(row); if (k % 12 === 11) await ctx.yield(); }
        // the plain run in to the wall: the same rows as the frame's side, column after column
        for (let c = 1; c <= NCB; c++) { const a = -AR.body - c * 5.5, col = [];
          for (let m = 0; m <= kc; m++) { const y = -3 + (finTop(a) + 3) * (m / kc), h = finHalf(a, y); col.push(vert(a, sg * (h + stand(a, sg * h, y) * sstep(0, 5, finTop(a) - y)), y, 1, 0)); }
          body[f].push(col); }
        await ctx.yield(); }
      // the opening's own skin, from one face's outline across to the other's
      const under = []; for (let k = 0; k <= NO; k++) { const row = [F0[0][k][0]], h = finHalf(OA[k], OY[k]);
        for (let v = 1; v < NB; v++) { const b = mix(-h, h, v / NB), d = into(k, v / NB, OA[k], b, OY[k]); row.push(vert(OA[k] + NA[k] * d, b, OY[k] + NY[k] * d, mix(0.42, 0.8, Math.abs((2 * v) / NB - 1)), 0.3 * sstep(-0.1, 0.4, n2(b * 0.21 + 1.7, k * 0.13)))); }
        row.push(F0[1][k][0]); under.push(row); }
      await ctx.yield();
      // (a cell between four places; `out`: whether its first way round faces out of the rock)
      const cell = (p00, p10, p01, p11, out) => { if (out) ii.push(p00, p10, p01, p10, p11, p01); else ii.push(p00, p01, p10, p10, p01, p11); };
      for (let f = 0; f < 2; f++) { const g = F0[f], bd = body[f];
        for (let k = 0; k < NO; k++) for (let j = 0; j < NJ; j++) cell(g[k][j], g[k + 1][j], g[k][j + 1], g[k + 1][j + 1], f === 0);
        for (let c = 0; c < NCB; c++) for (let m = 0; m < kc; m++) { const c0 = c === 0 ? null : bd[c - 1]; cell(c0 ? c0[m] : g[m][NJ], bd[c][m], c0 ? c0[m + 1] : g[m + 1][NJ], bd[c][m + 1], f === 1); } }
      for (let k = 0; k < NO; k++) for (let v = 0; v < NB; v++) cell(under[k][v], under[k + 1][v], under[k][v + 1], under[k + 1][v + 1], false);
      // the crest, from face to face
      for (let k = kc; k < NO; k++) cell(F0[0][k][NJ], F0[0][k + 1][NJ], F0[1][k][NJ], F0[1][k + 1][NJ], true);
      for (let c = 0; c < NCB; c++) cell(c ? body[0][c - 1][kc] : F0[0][kc][NJ], body[0][c][kc], c ? body[1][c - 1][kc] : F0[1][kc][NJ], body[1][c][kc], false);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(ia, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(ib, 4));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(ic, 1)); g.setIndex(ii); fin.tris = ii.length / 3; await ctx.yield(); await normalsInSteps(g, 30000);
      const m = new THREE.Mesh(g, landMat); m.frustumCulled = false; scene.add(m); }
    await ctx.yield();

    // ---------- the lake bed's height round the bay, for the lake's colour, its surf and its shores ----------
    // (inside the rock it reads as land, except in the cove, whose floor lies under the lake)
    // Its rectangle is taken from the foot's own extent: from west of the wall's line to the foot's last point in the
    // east, from 100 m north of the foot at the bay's head to south of the entry; cells some 5.8 by 5.4 m. Where the wall
    // itself ends in the east (Q_NORTH) the bed goes down to deep water over the wall's last hundred metres.
    const bedN = MOUTH_Z - BAY_ARM - BAY_R - 100, bedE = WALL_X + BAY_R + 1200;
    const DR = { x0: -260, z0: bedN, w: bedE + 260, h: 480 - bedN, nx: Math.round((bedE + 260) / 5.81), nz: Math.round((480 - bedN) / 5.44) };
    const bedData = new Uint16Array(DR.nx * DR.nz);
    for (let j = 0, k = 0; j < DR.nz; j++) { let hint = -1;
      for (let i = 0; i < DR.nx; i++, k++) { const x = DR.x0 + ((i + 0.5) / DR.nx) * DR.w, z = DR.z0 + ((j + 0.5) / DR.nz) * DR.h, nr = nearest(x, z, hint); hint = nr.i;
        const y = nr.d > 400 ? -16 : nr.d >= 0 ? Math.min(6, shoreY(nr.q, nr.d, x, z)) : nr.q > QM - 130 && nr.q < QM + 190 ? Math.min(6, wallY(nr.q, -nr.d, x, z)) : 6;
        bedData[k] = THREE.DataUtils.toHalfFloat(mix(y, -16, sstep(Q_NORTH - 140, Q_NORTH - 20, nr.q))); }
      await ctx.yield(); }
    const tBed = new THREE.DataTexture(bedData, DR.nx, DR.nz, THREE.RedFormat, THREE.HalfFloatType); tBed.magFilter = tBed.minFilter = THREE.LinearFilter; tBed.wrapS = tBed.wrapT = THREE.ClampToEdgeWrapping; tBed.needsUpdate = true;
    await ctx.yield();
    // the towers' and the fin's own outlines at the water, which the surf breaks on: a row for each tower (its radius at
    // FEET_N bearings: the least within half a step to either side, and 0.3 m inside that), and the fin's two sides
    const FEET_N = 64, feetData = new Uint16Array(FEET_N * STACKS.length);
    STACKS.forEach((st, r) => { for (let i = 0; i < FEET_N; i++) { let m = Infinity; for (let e = 0; e <= 2; e++) m = Math.min(m, stackRad(st, ((i + e * 0.5) / FEET_N) * 6.2832, 0)); feetData[r * FEET_N + i] = THREE.DataUtils.toHalfFloat(m - 0.3); } });
    const tFeet = new THREE.DataTexture(feetData, FEET_N, STACKS.length, THREE.RedFormat, THREE.HalfFloatType); tFeet.magFilter = tFeet.minFilter = THREE.LinearFilter; tFeet.wrapS = THREE.RepeatWrapping; tFeet.wrapT = THREE.ClampToEdgeWrapping; tFeet.needsUpdate = true;
    const tFinFoot = new THREE.DataTexture(fin.foot, FOOT_N, 1, THREE.RGFormat, THREE.HalfFloatType); tFinFoot.magFilter = tFinFoot.minFilter = THREE.LinearFilter; tFinFoot.wrapS = tFinFoot.wrapT = THREE.ClampToEdgeWrapping; tFinFoot.needsUpdate = true;
    await ctx.yield();

    // ---------- the lake: glacial turquoise, wind streaks, whitecaps, the gust's dark sheet, surf ----------
    const lakeMat = new THREE.ShaderMaterial({ fog: true,
      uniforms: { ...fogU(), ...LU, tNoise: { value: tNoiseLake }, tBed: { value: tBed }, tFeet: { value: tFeet }, tFinFoot: { value: tFinFoot }, uBedRect: { value: new THREE.Vector4(DR.x0, DR.z0, 1 / DR.w, 1 / DR.h) }, uWind: { value: WIND.clone() },
        // (uFoot: where the long fall meets its cove, x and z; then the bay's middle, x and z)
        uFoot: { value: new THREE.Vector4(FALLS[8].px, FALLS[8].pz, 400, -900) } },
      vertexShader: /* glsl */`varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`uniform sampler2D tBed, tFeet, tFinFoot; uniform vec4 uBedRect; uniform vec2 uWind; uniform vec4 uFoot; varying vec3 vW;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_GALE}
        ${GLSL_LIGHT}
        ${GLSL_TOWERS}
        ${GLSL_SKY}
        void main(){
          vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-3);
          vec2 p = vW.xz, duv = (p - uBedRect.xy) * uBedRect.zw;
          float inside = step(0., duv.x) * step(duv.x, 1.) * step(0., duv.y) * step(duv.y, 1.);
          float depth = -mix(-16., texture2D(tBed, clamp(duv, 0., 1.)).r, inside);
          // along the wind and across it
          vec2 wa = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x)));
          // the gale: tau = seconds since the front crossed here (its edge is ragged), gust = how hard it blows now
          float rag = nR(p * .0031 + uTime * .01) - .5;
          float tau = galeTauRun(galeRun(p) + rag * 46.), gust = galeGust(tau);
          // the towers stand in deep water: the bed shoals steeply to the nearest one's foot, so the surf wraps it. The
          // foot is that tower's own outline at the water, a little inside its rock (tFeet: its radius by bearing)
          float tD = 1e4, tL = 0., tI = 0., tA = 0.;
          for (int i = 0; i < NTOW; i++) { vec4 c = uStk[i]; vec2 dv = p - c.xy; float l = length(dv);
            if (l - c.z < tD) { tD = l - c.z; tL = l; tI = float(i); tA = atan(dv.y, dv.x + 1e-4); } }
          depth = min(depth, (tL - texture2D(tFeet, vec2(tA / 6.2832, (tI + .5) / float(NTOW))).r) * .42);
          // and to the fin's two feet, either side of its opening: the fin's own outline at the water, a little inside
          // its rock (tFinFoot: how far the rock stands to either side of its middle plane, by the metres out along it)
          { vec2 ab = finAB(p), hf = texture2D(tFinFoot, vec2((ab.x - ${FOOT_A0.toFixed(1)}) / ${(FOOT_A1 - FOOT_A0).toFixed(1)}, .5)).rg;
            depth = min(depth, max(max(-ab.y - hf.x, ab.y - hf.y), max(${(AR.hw - 1.6).toFixed(1)} - abs(ab.x), ab.x - ${FOOT_A1.toFixed(1)})) * .42); }
          // wavelets: slopes from two scales of the noise sliding down the wind (the texture's mip chain smooths them to the pixel's footprint)
          float chop = .55 + .8 * gust;
          vec2 s1 = texture2D(tNoise, wa * vec2(.021, .034) - vec2(uTime * .11, 0.)).rg + texture2D(tNoise, wa * vec2(.017, .029) + vec2(-uTime * .07, .37)).gr - 1.;
          vec2 s2 = texture2D(tNoise, wa * vec2(.11, .17) - vec2(uTime * .31, .2), -.5).rg + texture2D(tNoise, wa * vec2(.14, .21) + vec2(-uTime * .22, .61), -.5).gr - 1.;
          vec2 s3 = texture2D(tNoise, wa * vec2(.06, .095) - vec2(uTime * .2, .4), -.6).ba + texture2D(tNoise, wa * vec2(.083, .12) + vec2(-uTime * .16, .13), -.6).ab - 1.;
          vec2 slope = (s1 * .34 + s2 * .26 + s3 * .2) * chop;
          vec3 N = normalize(vec3(-slope.x * uWind.x + slope.y * uWind.y, 1., -slope.x * uWind.y - slope.y * uWind.x));
          float ndv = max(dot(N, V), 0.), fres = .02 + .5 * pow(max(1. - ndv, 0.), 4.);
          vec3 R = reflect(-V, N); R.y = abs(R.y);
          vec3 skyR = skyTone(R);
          float sh = scudShade(vW) * towerShade(vW) * finShade(vW);
          // the body: milky at the shore, turquoise, deeper and bluer far out; darker and bluer under the gust
          vec3 body = mix(vec3(.3, .6, .56), vec3(.035, .43, .41), smoothstep(0., 4.5, depth));
          body = mix(body, vec3(.02, .31, .37), smoothstep(5., 16., depth) * .8);
          // (the dark sheet is the water just behind the front, a band some hundreds of metres deep; behind it the lake is
          // turquoise again under its whitecaps while the gust blows on)
          float sheet = smoothstep(0., .35, tau) * (1. - smoothstep(2.2, 6.5, tau));
          body *= 1. - .5 * sheet; body = mix(body, body * vec3(.7, .9, 1.15), sheet * .5);
          skyR = mix(skyR, uZen * .55, sheet * .7);                                  // ruffled water throws back the high dark sky, not the pale horizon
          float facing = .55 + .45 * clamp(dot(N, uSunDir), 0., 1.) / max(uSunDir.y, .2);
          // (the milky water scatters the low sun back nearly white: it keeps its own colour under an orange sun)
          vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .55);
          vec3 col = body * (sunW * (.42 + .5 * uSunDir.y) * sh * facing + uSkyCol * 1.1);
          col = mix(col, skyR, fres);
          // the sun's glitter
          float gl = pow(max(dot(R, uSunDir), 0.), 220.) * 5. + pow(max(dot(R, uSunDir), 0.), 28.) * .22;
          col += uSunCol * gl * sh;
          // whitecaps that break and fade (two fields sliding through each other), wind streaks and spume lines
          // (crests are short white dashes lying across the wind, about a metre deep and three or four long)
          // (the two fields lie askew of each other and are pulled about by a slow third, so no rank of crests comes round again)
          vec2 pull = vec2(nG(wa * vec2(.0031, .0027) + .37), nR(wa * vec2(.0024, .0034) - .21)) - .5;
          vec2 cuv = wa * vec2(.095, .03) - vec2(uTime * .34, 0.) + pull * vec2(2.6, .8);
          float capA = nR(cuv), capB = nG(vec2(wa.x * .14 + wa.y * .033, wa.y * .041 - wa.x * .019) - vec2(uTime * .52, .3) + pull.yx * vec2(1.8, 1.1)), cf = (capA + capB) * .5;
          float lace = nB(wa * vec2(.19, .12) - vec2(uTime * .6, 0.));
          float th = mix(.71, .65, gust);
          th += .15 * (.5 - nG(wa * vec2(.0052, .0037) - vec2(uTime * .021, .6)));                        // (the breaking comes in fields, not evenly)
          // a crest breaking, with a thinner veil of foam around it
          float cap = max(smoothstep(th, th + .04, cf) * smoothstep(.25, .6, lace + (cf - th) * 3.), smoothstep(th - .05, th + .03, cf) * smoothstep(.5, .85, lace) * .4);
          // where the dashes are finer than the eye's grain the water takes their even share of white instead of losing them
          vec2 cw = fwidth(cuv); float fine = smoothstep(.06, .2, max(cw.x, cw.y));
          cap = mix(cap, .016 + .075 * clamp((.71 - th) / .09, 0., 1.), fine);
          // (wind streaks and spume lines are a few metres across: where a pixel spans one they are gone into the water's
          // own tone, and they wander, so that far off they never draw lines running to one point)
          float sw = fwidth(wa.y), wob = (pull.x * 60. + (nR(wa * vec2(.0011, .006) + .5) - .5) * 26.);
          float streak = smoothstep(.68, .86, nA(vec2(wa.x * .004 - uTime * .03, (wa.y + wob) * .09))) * (.1 + .28 * gust) * (1. - smoothstep(1.2, 4., sw));
          float spume = smoothstep(.6, .88, nB(vec2(wa.x * .012 - uTime * .12, (wa.y + wob) * .22))) * smoothstep(th - .08, th + .04, cf) * .5 * (1. - smoothstep(.5, 1.8, sw));
          // surf: bands of foam running in over the shallows, a ragged line at the water's edge
          float sn = nA(p * .07 + uTime * .02), band = fract(depth * .5 + uTime * .32 + sn * .9 + nR(p * .01) * 2.);
          float surf = (1. - smoothstep(.0, .34, band)) * (1. - smoothstep(.9, 2.6, depth)) * smoothstep(.25, .6, lace + .25) + (1. - smoothstep(.0, .3 + .25 * sn, depth));
          float front = (1. - smoothstep(0., .8, tau)) * smoothstep(.5, .78, lace + rag * .3);            // the spray torn off at the gust's leading edge
          // where the long fall meets the cove: churned white water at its foot, and rings running out from it over the cove
          vec2 fv = p - uFoot.xy; float fr = length(fv), pour = 1. - .75 * galeFail(galeTauRun(galeRun(uFoot.xy)));
          float churn = (1. - smoothstep(7., 24., fr + 9. * (lace - .5))) * pour;
          float ring = smoothstep(.72, .93, sin(fr * .5 - uTime * 2.4 + 3. * sn) * .5 + .5) * (1. - smoothstep(20., 80., fr)) * smoothstep(8., 20., fr) * pour * (1. - smoothstep(1., 4., fwidth(fr)));
          float foam = clamp(max(max(cap, surf), max(front * .6, max(churn, ring * .55))) + streak * .5 + spume, 0., 1.) * step(-.05, depth);
          col = mix(col, vec3(.86, .9, .92) * (uSunCol * (.45 + .4 * uSunDir.y) * sh + uSkyCol * .8), foam * .92);
          // far out the lake goes into the low sky's own tone: by the water's distance from the bay's middle, a fixed place
          col = mix(col, skyTone(vec3(-V.x, .02, -V.z)), smoothstep(3600., 7400., length(p - uFoot.zw)));
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000, 4, 4).rotateX(-Math.PI / 2), lakeMat);
    lake.position.set(400, 0, -900); lake.frustumCulled = false; lake.renderOrder = 1; scene.add(lake);
    await ctx.yield();
    // ---------- the sky: a dome that goes with the eye, drawn behind everything ----------
    { const m = new THREE.ShaderMaterial({ fog: false, depthWrite: false, side: THREE.BackSide, uniforms: { ...LU },
        vertexShader: /* glsl */`varying vec3 vDir;
          void main(){ vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
        fragmentShader: /* glsl */`varying vec3 vDir;
          ${GLSL_NOISE}
          ${GLSL_LIGHT}
          ${GLSL_SKY}
          void main(){ gl_FragColor = vec4(skyFull(normalize(vDir)), 1.); }` });
      const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), m); dome.frustumCulled = false; dome.renderOrder = -1; scene.add(dome); }
    await ctx.yield();

    // ---------- far ranges across the lake: two blue rings with snow on their tops, the further one deep in the haze ----------
    { const rp = [], ra = [], ri = [], nz = ctx.core.makeNoise(rng.fork('ranges').int(1, 1e9)), N = 300;
      [[5200, 480, 1300, 0.2], [6900, 640, 1900, 0.48]].forEach(([R, h0, h1, haze], k) => { const base = rp.length / 3;
        for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI * 2, cx = Math.cos(th), sz = Math.sin(th);
          const top = mix(h0, h1, sat(nz.ridged2(cx * 2.6 + k * 7.1, sz * 2.6 - k * 3.3, 4) * (0.45 + 0.55 * (0.5 + 0.5 * nz.n2(cx * 1.2 + k, sz * 1.2)))));
          rp.push(300 + cx * R, -40, -900 + sz * R, 300 + cx * R, top, -900 + sz * R); ra.push(top, haze, i * 0.21, k, top, haze, i * 0.21, k);
          if (i < N) { const q = base + i * 2; ri.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.setAttribute('aV', new THREE.Float32BufferAttribute(ra, 4)); g.setIndex(ri);
      const m = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...LU },
        vertexShader: /* glsl */`attribute vec4 aV; varying vec3 vW; varying vec4 vA; void main(){ vA = aV; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`varying vec3 vW; varying vec4 vA;
          ${GLSL_NOISE}
          ${GLSL_LIGHT}
          ${GLSL_SKY}
          void main(){ float s = vA.z, n = nR(vec2(s * .09 + vA.w * .37, vW.y * .0016)), n2 = nG(vec2(s * .31, vW.y * .004 + vA.w));
            float rel = vW.y / max(vA.x, 1.), se = max(fwidth(rel) * 1.5, .02);
            float snow = smoothstep(.5 - se, .5 + se, rel * .75 + (vW.y - 360.) * .0012 + (n - .5) * .5);
            vec3 alb = mix(vec3(.08, .13, .25) * (.7 + .6 * n2), vec3(.78, .82, .9), snow);
            vec3 col = alb * (uSunCol * (.35 + .5 * n) + uSkyCol);
            // (a range takes the tone of the low sky at its own bearing: pale under the clear band, slate under the deck)
            vec3 dir = normalize(vW - cameraPosition); vec3 haze = skyTone(vec3(dir.x, .05, dir.z));
            gl_FragColor = vec4(mix(col, haze, clamp(vA.y + .3 + .22 * (1. - rel), 0., .96)), 1.); }` });
      const ranges = new THREE.Mesh(g, m); ranges.frustumCulled = false; scene.add(ranges); }
    await ctx.yield();
    // ---------- the water going the wrong way: the falls and their mist ----------
    const clear = { towerRock: stackClear[0], lesserTowerRock: stackClear[1], archRock: fin.clear, wallRock: coveClear };
    // a place on the rock face by a fall: `lat` metres along the foot from the fall's own line, at height y: the first rock met
    // at that height coming in from the lake (read off the meshes themselves); it stands 0.45 m clear of the rock
    // (the long fall's face is looked for from inside its cove: the cove runs back askew, and a place abreast of the fall
    // on the lake's side lies behind the cove's outer buttress)
    const faceAt = (f, lat, y, o) => { const q = f.q + lat, dEnd = -f.lipW - 40; let d = f.kind === 'long' ? -(COVE_BACK - 25) : 40, h0 = surfAt(q, d);
      while (d > dEnd) { const d1 = d - 1.2, h1 = surfAt(q, d1); if (h1 >= y) { d -= 1.2 * (h1 > h0 ? sat((y - h0) / (h1 - h0)) : 0); break; } d = d1; h0 = h1; }
      toWorld(q, d + 0.45, o); o.y = y + 0.2;
      // (the long fall's lower part runs on the cove's own skin; the two faces are joined over the skin's last 16 m)
      if (f.kind === 'long' && skin.face && y < SK.top - 6) { const k = sstep(SK.top - 22, SK.top - 6, y), x = o.x, z = o.z; skin.face(lat, y, o); o.x = mix(o.x, x, k); o.z = mix(o.z, z, k); }
      return o; };
    // how much of the sun reaches a place in the air (0 in the wall's shade .. 1): marched toward the sun over the land's own heights
    const sunAt = (x, y, z) => { let lit = 1;
      for (let m = 0, l = 5; m < 14 && lit > 0; m++, l *= 1.42) { const py = y + sunDir.y * l; if (py > 950) break;
        const nr = nearest(x + sunDir.x * l, z + sunDir.z * l), h = nr.d < 0 ? hAt(nr.q, nr.d) : 0; lit = Math.min(lit, sat((py - h) / (2 + 0.06 * l) + 0.5)); }
      return lit; };
    // where spray smoke may rise on the open lake: a loose lattice over the water the flight looks across, each place a
    // little off its cell's middle, none on a tower's foot
    const smoke = [];
    { const sm = rng.fork('smoke');
      for (let ix = 0; ix < 15; ix++) for (let iz = 0; iz < 30; iz++) { const x = 130 + (ix + sm()) * 44, z = -80 - (iz + sm()) * 44, size = sm.range(24, 40), keep = sm();
        const nr = nearest(x, z); if (nr.d < shoreW(nr.q) + 20 || nr.d > 760 || keep > 0.62) continue;
        let free = true; for (const st of STACKS) if (Math.hypot(x - st.x, z - st.z) < st.R + size) free = false;
        if (free) smoke.push([x, z, size]); }
      await ctx.yield(); }
    // the seep falls: each a thin thread laid on the cove's own skin, from its ledge to the cove's water; one is made
    // only where the skin is whole rock all the way down its line
    const seepFalls = [];
    if (skin.face) { const a = {}, b = {}, cW = toWorld(SK.cq, -SK.cw, {});
      for (const [u0, top] of SEEPS) { let ok = true; for (let y = 2; y <= top; y += 6) if (!skin.sound(u0, y)) ok = false;
        if (!ok) continue;
        skin.face(u0 - 3, top * 0.5, a); skin.face(u0 + 3, top * 0.5, b); const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1, tx = (b.x - a.x) / tl, tz = (b.z - a.z) / tl;
        skin.face(u0, top, a); skin.face(u0, 0.3, b); let ox = -tz, oz = tx; if (ox * (cW.x - b.x) + oz * (cW.z - b.z) < 0) { ox = -ox; oz = -oz; }
        seepFalls.push({ x: a.x, z: a.z, top, foot: 0.3, width: 3.4, out: [ox, oz], tan: [tx, tz], px: b.x, pz: b.z, long: false, seep: true, face: (lat, y, o) => skin.face(u0 + lat, y, o) }); } }
    // (the blown water's own stream of draws is seeded from the gale's dealt period: it takes no draw of the world's)
    const hero = await buildHero(ctx, { gale, light: LU, fog: fogU, wind: [WIND.x, WIND.y], rng: rng.fork('water'), ropeRng: makeRng(hashSeed('rope:' + Math.round(gale.period * 1e6))), yield: ctx.yield, clearOf: (x, y, z) => path.distanceTo(x, y, z), sunAt, smoke, fov: FOV, detail,
      falls: [...FALLS.map((f) => ({ x: f.x, z: f.z, top: surfAt(f.q, -f.lipW) - 0.5, foot: f.kind === 'long' ? 0.3 : surfAt(f.q, f.poolD), width: f.width, out: f.out, tan: [f.out[1], -f.out[0]], px: f.px, pz: f.pz, long: f.kind === 'long',
        face: (lat, y, o) => faceAt(f, lat, y, o) })), ...seepFalls] });
    scene.add(hero.object);
    clear.fallMist = hero.facts.mistClear; clear.fallStrand = hero.facts.strandClear; clear.fallRope = hero.facts.ropeClear;
    await ctx.yield();

    // ---------- how far every place of the shore stands from the flown line (plan metres), on a 6 m lattice ----------
    // Richness is chosen once, here at the build, by this distance from the ROUTE: thick beside the line, thin far off.
    const LD = { x0: -60, z0: -470, nx: 60, nz: 88, c: 6 }, ldF = new Float32Array(LD.nx * LD.nz);
    for (let j = 0; j < LD.nz; j++) { for (let i = 0; i < LD.nx; i++) ldF[j * LD.nx + i] = path.nearestXZ(LD.x0 + i * LD.c, LD.z0 + j * LD.c).dist; if ((j & 15) === 15) await ctx.yield(); }
    const lineDist = (x, z) => { const fx = Math.min(LD.nx - 1.001, Math.max(0, (x - LD.x0) / LD.c)), fz = Math.min(LD.nz - 1.001, Math.max(0, (z - LD.z0) / LD.c)), i = Math.floor(fx), j = Math.floor(fz), a = j * LD.nx + i;
      return mix(mix(ldF[a], ldF[a + 1], fx - i), mix(ldF[a + LD.nx], ldF[a + LD.nx + 1], fx - i), fz - j); };
    // the nearest thing of each kind to the flown line, by place, kept as the things are made (metres of clear air)
    // (only a thing that is then made counts; `nearby` lists what stands within 30 m, with the laid metre it stands abreast of)
    const nearby = [], airSeen = {};
    const air = (kind, x, y, z, r) => { const dd = path.distanceTo(x, y, z) - r; airSeen.kind = kind; airSeen.d = dd; airSeen.s = dd < 30 ? Math.round(path.nearestXZ(x, z).u * PL) : -1; return dd; };
    const made = () => { const k = airSeen.kind, dd = airSeen.d; if (!(clear[k] <= dd)) clear[k] = dd; if (airSeen.s >= 0) nearby.push([k, airSeen.s, Math.round(dd * 10) / 10]); };

    // ---------- plants: one material for blades, cushions, crowns and stems; the gale bends them all by the same law ----------
    // aP: how far the wind moves this vertex (0 rooted .. 1 tip), 1 on a grass blade, the light let in (0 deep inside .. 1 open), 1 where flowers may sit
    // aQ: 1 on wood (its colour is its own, not the instance's tint)
    // iT: tint, seed; iK: flowers 0..1, how far the tip is pushed (metres), 1 for rock (no leaf light), leaf (0 none, 0.5 a
    // mass of green leaves, 1 a crown of autumn leaf)
    const plantMat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), ...LU, uWindDir: { value: WIND.clone() } },
      vertexShader: /* glsl */`attribute vec4 aP, iT, iK; attribute vec3 color; attribute float aQ; uniform vec2 uWindDir; uniform float uTime;
        varying vec3 vW, vN, vC, vO; varying vec4 vK; varying vec2 vL;
        #include <fog_pars_vertex>
        ${GLSL_NOISE}
        ${GLSL_GALE}
        void main(){
          vec4 wp = instanceMatrix * vec4(position, 1.); vec3 root = instanceMatrix[3].xyz;
          float gust = galeGust(galeTau(root.xz));
          // the same travelling bands the steppe's straw shows
          float band = nR(vec2(dot(root.xz, vec2(.785, .62)) * .012, dot(root.xz, vec2(.62, -.785)) * .004 - uTime * .19));
          // (the wind is seen as bands of bent grass that travel: a blade bends hard inside a band and stands between two)
          float push = .14 + .4 * gust + .8 * smoothstep(.42, .66, band) * (.4 + .6 * gust);
          float flut = sin(uTime * (3.1 + iT.w * 2.) + iT.w * 40. + wp.x * .7) * .14 + sin(uTime * 7.3 + iT.w * 90. + wp.z * 1.3) * .06;
          float mv = aP.x * iK.y * push * (1. + flut);
          wp.xz += uWindDir * mv; wp.y -= mv * aP.x * .3;
          vW = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal); vC = mix(color * iT.rgb, color, aQ); vO = mat3(instanceMatrix) * position + iT.w * 17.;
          vK = vec4(iK.x, aP.y, aP.z, aP.w * (1. - iK.z) + 2. * iK.z); vL = vec2(iK.w * (1. - aQ), aQ);
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`varying vec3 vW, vN, vC, vO; varying vec4 vK; varying vec2 vL;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        void main(){
          vec3 N = normalize(vN); if (!gl_FrontFacing && vK.y < .5) N = -N;             // (a blade's two sides share its upward lean)
          // (lf: a mass of leaves; aut: in its autumn)
          float rock = step(1.5, vK.w), n1 = nA(vO.xy * .35 + vO.z * .21), n2 = nG(vO.xz * .11 + vO.y * .07), lf = step(.25, vL.x), aut = step(.75, vL.x), fpx = length(fwidth(vO));
          vec3 alb = vC * (.72 + .56 * n1) * (.85 + .3 * n2);
          // a crown in its autumn is no one colour: boughs gone to gold, boughs still deep red, here and there one green;
          // and it is a mass of leaves: a speckle of lit sprays and the dark between them, the size of a spray of leaves
          // (where a pixel spans many sprays the crown takes their mean)
          float hv = nG(vO.xz * .17 + vO.y * .12) + (n2 - .5) * .5, tone = max(alb.r, alb.g) * 1.8;
          vec3 turned = mix(alb, vec3(.6, .4, .08) * tone, smoothstep(.54, .72, hv) * .8 * aut);
          turned = mix(turned, vec3(.42, .07, .035) * tone, (1. - smoothstep(.26, .44, hv)) * .7 * aut);
          turned = mix(turned, vec3(.13, .2, .06) * tone, smoothstep(.7, .8, nR(vO.zx * .23 + vO.y * .19 + .4)) * .6 * aut);
          float spray = nA(vO.xy * 1.7 + vO.z * 1.1) * .6 + nA(vO.zy * 3.7 + vO.x * 2.3) * .4;
          alb = mix(alb, turned * (.5 + mix(.5, spray, 1. - smoothstep(.12, .7, fpx))), lf);
          // scarlet sprays among the leaves
          // (flower heads a hand across; where a pixel spans many of them the bush takes their share of red evenly)
          float spots = smoothstep(.53, .6, nA(vO.xy * .5 + vO.z * .31) * .5 + nA(vO.zy * .45 + vO.x * .27 + .5) * .5);
          float fl = vK.w * (1. - rock) * vK.x * mix(spots, .26, smoothstep(.1, .6, fpx));
          alb = mix(alb, vec3(.95, .06, .03) * (.75 + .5 * n1), fl);
          // a boulder wears rusty and grey-green lichen
          alb = mix(alb, mix(vec3(.6, .4, .12), vec3(.46, .52, .38), n2), rock * smoothstep(.5, .6, nA(vO.xz * .9 + vO.y * .5)) * .7);
          N = normalize(N + (vec3(n1, n2, nA(vO.zy * .35)) - .5) * .5 * (1. - vK.y));
          // (a crown is matt: the sun finds its whole top and sunward side evenly, and its underside and its inside are dark)
          float ndl = dot(N, uSunDir), wrap = clamp(ndl * mix(mix(.6, .9, rock), .4, lf) + mix(mix(.4, .1, rock), .6, lf), 0., 1.), open = mix(mix(.42, .16, lf), 1., vK.z);
          vec3 col = alb * (uSunCol * wrap * open * scudShade(vW) + uSkyCol * ((.6 + .4 * N.y) * open + .2 * (1. - .6 * lf)) + uBounce * .14);
          col += alb * uSunCol * .22 * pow(clamp(-ndl, 0., 1.), 2.) * vK.z * (1. - rock) * (1. - vL.y);          // leaves let the sun through
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    // geometries (unit size; the instance gives place, size and lean)
    const geoOf = (P, Nn, C, A, I, Q) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q || new Float32Array(P.length / 3), 1));
      if (I) g.setIndex(I); return g; };
    const pg = rng.fork('plantshapes');
    // a tussock of coiron: a clump of stiff narrow blades standing nearly upright round one root, dark at the base and
    // straw-bright at the tips
    const tuftGeo = (() => { const P = [], Nn = [], C = [], A = [];
      for (let b = 0; b < 8; b++) { const a = (b / 8) * 6.283 + pg.range(-0.3, 0.3), lean = pg.range(0.08, 0.42), h = pg.range(0.6, 1), w = pg.range(0.1, 0.16), off = pg.range(0.06, 0.2), ca = Math.cos(a), sa = Math.sin(a);
        P.push(ca * off - sa * w, 0, sa * off + ca * w, ca * off + sa * w, 0, sa * off - ca * w, ca * (off + lean * h), h, sa * (off + lean * h));
        for (let k = 0; k < 3; k++) Nn.push(ca * 0.45, 0.88, sa * 0.45);
        C.push(0.17, 0.13, 0.05, 0.17, 0.13, 0.05, 0.95, 0.72, 0.31); A.push(0, 1, 0.5, 0, 0, 1, 0.5, 0, 1, 1, 1, 0); }
      return geoOf(P, Nn, C, A); })();
    // a cushion plant: a low firm dome
    const domeGeo = (() => { const P = [], Nn = [], C = [], A = [], I = [], SEG = 8, RNG = 3;
      for (let r = 0; r <= RNG; r++) for (let s = 0; s < SEG; s++) { const el = (r / RNG) * 1.5708, a = (s / SEG) * 6.283, cr = Math.cos(el), y = Math.sin(el);
        P.push(Math.cos(a) * cr, y * 0.45, Math.sin(a) * cr); Nn.push(Math.cos(a) * cr * 0.6, 0.55 + 0.45 * y, Math.sin(a) * cr * 0.6); C.push(1, 1, 1); A.push(0, 0, 0.35 + 0.65 * y, 0); }
      for (let r = 0; r < RNG; r++) for (let s = 0; s < SEG; s++) { const a = r * SEG + s, b = r * SEG + (s + 1) % SEG; I.push(a, a + SEG, b, b, a + SEG, b + SEG); }
      return geoOf(P, Nn, C, A, I); })();
    // a lump of leaves (or of stone): a ball with a lumpy skin; the fine one for bushes and near trees, the coarse one for far crowns and boulders
    const lumpGeo = (detail) => { const src = new THREE.IcosahedronGeometry(1, detail), sp = src.attributes.position, P = [], Nn = [], C = [], A = [];
      for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i), r = 1 + 0.3 * Math.sin(4.1 * x + 1.3) * Math.sin(3.7 * y + 0.4) * Math.sin(4.3 * z + 2.1) + 0.14 * Math.sin(9 * x + 5 * z + 3 * y);
        P.push(x * r, y * r, z * r); Nn.push(x, y, z); C.push(1, 1, 1); A.push(0.3 + 0.7 * Math.max(0, y), 0, 0.45 + 0.55 * Math.max(0, y * 0.8 + 0.2), 1); }
      src.dispose(); return geoOf(P, Nn, C, A); };
    const lumpFine = lumpGeo(1), lumpCoarse = lumpGeo(0);
    // a stem: three-sided, tapering, one length from foot to tip
    const stemGeo = (() => { const P = [], Nn = [], C = [], A = [], I = [];
      for (let r = 0; r <= 1; r++) for (let s = 0; s < 3; s++) { const a = (s / 3) * 6.283, k = 1 - 0.55 * r; P.push(Math.cos(a) * 0.5 * k, r, Math.sin(a) * 0.5 * k); Nn.push(Math.cos(a), 0.1, Math.sin(a)); C.push(1, 1, 1); A.push(r * 0.6, 0, 0.6, 0); }
      for (let s = 0; s < 3; s++) { const a = s, b = (s + 1) % 3; I.push(a, a + 3, b, b, a + 3, b + 3); }
      return geoOf(P, Nn, C, A, I); })();
    // lenga: a small crooked tree with a broad crown, level on top and ragged: flat pads of leaf of several sizes run
    // together, the largest over the trunk's head and lesser ones on boughs to its sides. One shape holds a whole tree
    // in units of its crown's half-width: pads [x, y, z, half-width, depth as a share of it, the solid it is cut from],
    // wood [x0, y0, z0, x1, y1, z1, girth at its foot, at its tip] (three-sided, tapering). A pad's top is nearly level
    // and its rim hangs; its underside and whatever lies low in the crown take little light.
    const ICO = new THREE.IcosahedronGeometry(1, 0), OCT = new THREE.OctahedronGeometry(1, 0), LENGA_BARK = [0.3, 0.25, 0.2];
    const lengaGeo = (pads, wood, bark = LENGA_BARK) => { const P = [], Nn = [], C = [], A = [], Q = [];
      let top = -1e9, low = 1e9; for (const p of pads) { top = Math.max(top, p[1] + p[3] * p[4] * 0.6); low = Math.min(low, p[1] - p[3] * p[4]); }
      pads.forEach(([px, py, pz, r, deep, solid], n) => { const sp = (solid || ICO).attributes.position, shade = 0.78 + 0.44 * ((n * 0.618 + 0.3) % 1);
        for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
          const k = 1 + 0.36 * Math.sin(5.1 * x + 1.3 + n * 2.1) * Math.sin(4.3 * z + 0.4 + n) + 0.2 * Math.sin(9 * x + 7 * z + 3 * y + n * 4.7);
          const yy = Math.sign(y) * (Math.min(Math.abs(y), 0.25) + Math.max(0, Math.abs(y) - 0.25) * (y > 0 ? 0.4 : 0.6)) - 0.3 * (x * x + z * z) * (k - 0.6);
          const Y = py + yy * r * deep, hgt = sat((Y - low) / Math.max(0.01, top - low));
          P.push(px + x * r * k, Y, pz + z * r * k);
          const nx = x * 0.5 + px * 0.25, ny = 0.75 + 0.5 * Math.max(0, y) - 0.9 * Math.max(0, -y), nz = z * 0.5 + pz * 0.25, nl = Math.hypot(nx, ny, nz) || 1;
          Nn.push(nx / nl, ny / nl, nz / nl); C.push(shade, shade, shade); A.push(0.3 + 0.7 * hgt, 0, (0.15 + 0.85 * hgt) * (y < -0.1 ? 0.25 : 1), 0); Q.push(0); } });
      for (const [x0, y0, z0, x1, y1, z1, r0, r1] of wood) { const ax = x1 - x0, ay = y1 - y0, az = z1 - z0, al = Math.hypot(ax, ay, az) || 1;
        // (two directions square to the limb)
        let ux = ay, uy = -ax, uz = 0; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul; const vx = (ay * uz - az * uy) / al, vy = (az * ux - ax * uz) / al, vz = (ax * uy - ay * ux) / al;
        const ring = (t, a, out) => { const c = Math.cos(a), s = Math.sin(a), rr = mix(r0, r1, t); out.n = [ux * c + vx * s, uy * c + vy * s, uz * c + vz * s]; out.p = [x0 + ax * t + out.n[0] * rr, y0 + ay * t + out.n[1] * rr, z0 + az * t + out.n[2] * rr]; return out; };
        for (let s = 0; s < 3; s++) { const a0 = (s / 3) * 6.283, a1 = ((s + 1) / 3) * 6.283, c = [ring(0, a0, {}), ring(1, a0, {}), ring(0, a1, {}), ring(0, a1, {}), ring(1, a0, {}), ring(1, a1, {})], ts = [0, 1, 0, 0, 1, 1];
          c.forEach((e, i) => { P.push(e.p[0], e.p[1], e.p[2]); Nn.push(e.n[0], e.n[1], e.n[2]); C.push(bark[0], bark[1], bark[2]); A.push(0.3 * sat(mix(y0, y1, ts[i]) / 1.4), 0, 0.7, 0); Q.push(1); }); } }
      return geoOf(P, Nn, C, A, null, Q); };
    // three trees, two crowns for the forest further off (a broad pad and a lesser one beside it), one dead snag
    const lengaTree = () => { const fx = pg.range(-0.22, 0.22), fz = pg.range(-0.22, 0.22), hF = pg.range(0.6, 0.85), hT = hF + pg.range(0.45, 0.65), tx = fx + pg.range(-0.25, 0.25), tz = fz + pg.range(-0.25, 0.25), a0 = pg() * 6.283;
      const pads = [[tx, hT + 0.3, tz, pg.range(0.9, 1.05), 0.72]], wood = [[0, -0.15, 0, fx, hF, fz, 0.13, 0.095], [fx, hF, fz, tx, hT + 0.1, tz, 0.095, 0.055]];
      for (let b = 0; b < 3; b++) { const a = a0 + (b + pg.range(-0.25, 0.25)) * 2.094, reach = pg.range(0.62, 0.9), bx = tx + Math.cos(a) * reach, bz = tz + Math.sin(a) * reach, by = hT + pg.range(-0.3, 0.05);
        pads.push([bx, by + 0.14, bz, pg.range(0.55, 0.75), 0.7, b === 2 ? OCT : ICO]); if (b < 2) wood.push([fx, hF, fz, mix(tx, bx, 0.85), by, mix(tz, bz, 0.85), 0.06, 0.035]); }
      pads.push([tx + pg.range(-0.45, 0.45), hT + 0.72, tz + pg.range(-0.45, 0.45), pg.range(0.45, 0.6), 0.6, OCT]);
      return lengaGeo(pads, wood); };
    const lengaCrown = () => { const a = pg() * 6.283; return lengaGeo([[0, 0, 0, 1, 0.85], [Math.cos(a) * 0.75, pg.range(0, 0.35), Math.sin(a) * 0.75, pg.range(0.55, 0.72), 0.8, OCT]], []); };
    const snagGeo = lengaGeo([], [[0, -0.15, 0, 0.12, 0.9, 0.05, 0.11, 0.07], [0.12, 0.9, 0.05, 0.02, 1.75, -0.08, 0.07, 0.025], [0.1, 0.8, 0.04, 0.62, 1.25, 0.22, 0.045, 0.015], [0.08, 1.15, 0, -0.5, 1.5, -0.25, 0.04, 0.012]], [0.5, 0.49, 0.47]);
    const lengaTrees = [lengaTree(), lengaTree(), lengaTree()], lengaCrowns = [lengaCrown(), lengaCrown()];
    ICO.dispose(); OCT.dispose();
    // a bin of instances for one geometry: place, size and lean go into the matrix; tint, seed, flowers and sway beside it
    const bin = (geo) => ({ geo, m: [], t: [], k: [] });
    const _M = new THREE.Matrix4();
    // put(bin, x, y, z, sx, sy, sz, yaw, tint [r, g, b], seed, flowers, sway, rock, leanX, leanZ): lean = metres the top stands downwind per metre of height
    // (the last, leaf: 0.5 for a mass of green leaves, 1 for a crown of autumn leaf)
    const put = (b, x, y, z, sx, sy, sz, yaw, tint, seed, fl = 0, sway = 0, rock = 0, lx = 0, lz = 0, leaf = 0) => { const c = Math.cos(yaw), s = Math.sin(yaw);
      b.m.push(c * sx, 0, -s * sx, 0, lx * sy, sy, lz * sy, 0, s * sz, 0, c * sz, 0, x, y, z, 1); b.t.push(tint[0], tint[1], tint[2], seed); b.k.push(fl, sway, rock, leaf); };
    const raise = (b) => { const n = b.t.length / 4; if (!n) return null; const g = b.geo.clone(), im = new THREE.InstancedMesh(g, plantMat, n);
      im.instanceMatrix.array.set(b.m); g.setAttribute('iT', new THREE.InstancedBufferAttribute(new Float32Array(b.t), 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(new Float32Array(b.k), 4));
      im.frustumCulled = false; scene.add(im); instanced.push(im); return im; };
    const B = { tuft: bin(tuftGeo), dome: bin(domeGeo), leaf: bin(lumpFine), far: bin(lumpCoarse), stem: bin(stemGeo),
      trees: lengaTrees.map(bin), crowns: lengaCrowns.map(bin), snag: bin(snagGeo) };
    await ctx.yield();
    // ---------- where the plants stand ----------
    const pr = rng.fork('plants'), pk = Math.min(1.3, Math.max(0.7, dens));
    // coiron over the steppe: every cell of a fine lattice takes its draws; whether a tussock stands there, and how big, is
    // decided by the place's distance from the flown line
    { let hint = -1, hz = 1e9;
      for (let ix = 0, x0 = -30; ix < 243; ix++) {
        for (let iz = 0; iz < 417; iz++) {
          const keep = pr(), jx = pr(), jz = pr(), v = pr(), x = x0 + (ix + jx) * 1.15, z = 30 - (iz + jz) * 1.15, ld = lineDist(x, z);
          // (they stand in drifts: thick here, thin there, the cushions and the bare ground showing between)
          const drift = 0.45 + 0.95 * sstep(-0.35, 0.3, n2(x * 0.06 + 9.1, z * 0.06));
          // (beside the line the steppe is never thin; on a low graphics level a share of the tussocks is left out, the
          // draws all taken as ever)
          const want = (ld < 26 ? 0.62 * Math.max(pk, 0.92) : ld < 55 ? 0.22 * pk : ld < 95 ? 0.06 * pk : 0) * drift * detail; if (keep >= want) continue;
          if (Math.abs(z - hz) > 40) hint = -1;
          const y = landAt(x, z, undefined, hint); hint = nearOut.i; hz = z;
          if (y < 2.35 || nearOut.d < 22 || nearOut.d > 400) continue;
          const big = (ld < 26 ? 1 : ld < 55 ? 1.4 : 2.0) * (0.85 + 0.4 * sstep(-0.2, 0.5, n2(x * 0.11, z * 0.11 + 4.3))), s = (0.7 + 0.55 * v) * big, tone = 0.78 + 0.4 * ((v * 7.3) % 1);
          // three kinds, each in its own patches of ground: tall straw coiron, a lower rust-red grass, grey-green bunches;
          // and all of them stand taller beside the line
          const kn = n2(x * 0.035 + 17.3, z * 0.035) + (((v * 29.3) % 1) - 0.5) * 0.6, tall = 1 + 0.7 * (1 - sstep(7, 22, ld));
          if (kn > 0.28) put(B.tuft, x, y - 0.03, z, s * 1.15, s * tall * (0.5 + 0.3 * ((v * 3.1) % 1)), s * 1.15, v * 6.283, [tone * 0.7, tone * 0.52, tone * 0.42], v, 0, 0.3 * s);
          else if (kn < -0.36) put(B.tuft, x, y - 0.03, z, s * 0.9, s * tall * (0.45 + 0.3 * ((v * 3.1) % 1)), s * 0.9, v * 6.283, [tone * 0.56, tone * 0.8, tone * 0.78], v, 0, 0.2 * s);
          else put(B.tuft, x, y - 0.03, z, s, s * tall * (0.8 + 0.5 * ((v * 3.1) % 1)), s, v * 6.283, [tone, tone, tone * 0.95], v, 0, 0.3 * s);
        }
        if (ix % 16 === 15) await ctx.yield();
      } }
    // cushion plants: firm grey-green domes among the tussocks, a few of them yellow-green
    for (let i = 0, n = Math.round(760 * pk); i < n; i++) { const x = pr.range(15, 235), z = pr.range(20, -430), r = pr.range(0.5, 2.1), v = pr(), yaw = pr() * 6.283;
      if (lineDist(x, z) > 70) continue; const y = landAt(x, z); if (y < 2.6 || nearOut.d < 34 || nearOut.d > 400) continue;
      put(B.dome, x, y - 0.06 * r, z, r, r * (0.7 + 0.5 * v), r, yaw, v < 0.25 ? [0.4 * (0.8 + 0.4 * v), 0.47, 0.15] : [0.33 + 0.1 * v, 0.41 + 0.08 * v, 0.3], v); }
    await ctx.yield();
    // one notro bush: lumps of dark leaf hung with scarlet, on a few stems; one flagged nirre: a stem leaning with the gale and its
    // crown strung out downwind. Both take all their draws first, and are not made where they would stand within 8 m of the line.
    const NOTRO = [0.105, 0.19, 0.065], NIRRE = [0.2, 0.27, 0.1], BARK = [0.33, 0.29, 0.24];
    const notro = (x, y, z, size) => { const lobes = [], n = 4 + Math.floor(pr() * 2), seed = pr();
      // (an open bush: each bough ends in its own small head of leaves, with air between the heads)
      for (let i = 0; i < 5; i++) lobes.push([pr.range(-0.95, 0.95) * size, pr.range(0.8, 1.7) * size, pr.range(-0.95, 0.95) * size, pr.range(0.36, 0.54) * size, pr() * 6.283, pr()]);
      lobes.length = n;
      if (air('bush', x, y + size, z, 2.05 * size) < 8) return false; made();
      for (const [ox, oy, oz, r, yaw, v] of lobes) { const tint = [NOTRO[0] * (0.8 + 0.4 * v), NOTRO[1] * (0.8 + 0.4 * v), NOTRO[2]], c = Math.cos(yaw) * r, s = Math.sin(yaw) * r;
        // (a shallow head at the bough's tip and a lesser one part way up it, to one side; the tall bushes beside the line
        // carry the finer leaf)
        put(size > 1.45 ? B.leaf : B.far, x + ox, y + oy, z + oz, r, r * 0.62, r * 0.85, yaw, tint, seed + v, 0.75 + 0.25 * v, 0.14 * size);
        put(B.far, x + ox * 0.62 + c * 0.8, y + oy * 0.66, z + oz * 0.62 + s * 0.8, r * 0.66, r * 0.4, r * 0.6, yaw + 2, tint, seed + v + 0.5, 0.6, 0.1 * size);
        put(B.stem, x + ox * 0.12, y - 0.1, z + oz * 0.12, 0.075 * size, oy, 0.075 * size, yaw, BARK, v, 0, 0.1 * size, 0, (ox * 0.88) / oy, (oz * 0.88) / oy); }
      return true; };
    const nirre = (x, y, z, size) => { const h = pr.range(2.2, 3.8) * size, lean = pr.range(0.4, 0.75), n = 4 + Math.floor(pr() * 2), seed = pr(), lobes = [];
      for (let i = 0; i < 5; i++) lobes.push([pr.range(-0.3, 0.3), pr.range(-0.25, 0.25), pr.range(0.85, 1.25), pr() * 6.283, pr()]);
      lobes.length = n;
      const tx = x + WIND.x * lean * h, tz = z + WIND.y * lean * h;
      if (air('tree', tx + WIND.x * 1.9 * size, y + h, tz + WIND.y * 1.9 * size, 3.9 * size) < 8) return false; made();
      put(B.stem, x, y - 0.15, z, 0.27 * size, h * 1.04, 0.27 * size, seed * 6.283, BARK, seed, 0, 0.12, 0, WIND.x * lean, WIND.y * lean);
      // the crown is a flag: shallow pads of leaf stepping away down the wind and sinking, each on its own bough off the trunk
      const fx = x + WIND.x * lean * h * 0.55, fy = y + h * 0.55, fz = z + WIND.y * lean * h * 0.55;
      lobes.forEach(([ja, jy, r, yaw, v], i) => { const al = (i - 0.3) * 1.2 * size, rr = r * size * (1.0 - 0.11 * i);
        const cx = tx + WIND.x * al - WIND.y * ja * 2.8 * size, cy = y + h + (jy * 1.5 - 0.2 * i + (i === 0 ? 0.35 : 0)) * size, cz = tz + WIND.y * al + WIND.x * ja * 2.8 * size;
        put(size > 0.88 ? B.leaf : B.far, cx, cy, cz, rr, rr * 0.5, rr, yaw, [NIRRE[0] * (0.7 + 0.5 * v), NIRRE[1] * (0.7 + 0.5 * v), NIRRE[2]], seed + v, 0, 0.3 * size, 0, WIND.x * 0.9, WIND.y * 0.9, 0.5);
        if (i > 0) { const dy = Math.max(0.6 * size, cy - fy - rr * 0.15); put(B.stem, fx, fy, fz, 0.1 * size, dy, 0.1 * size, yaw, BARK, v, 0, 0.2 * size, 0, (cx - fx) / dy, (cz - fz) / dy); } });
      return true; };
    // notro in clumps and nirre singly over the shore, by their distance from the line
    for (let c = 0, n = Math.round(15 * pk); c < n; c++) { const cx = pr.range(25, 225), cz = pr.range(10, -400), m = 2 + Math.floor(pr() * 3), ok = lineDist(cx, cz) < 75;
      for (let i = 0; i < m; i++) { const x = cx + pr.range(-4.5, 4.5), z = cz + pr.range(-4.5, 4.5), size = pr.range(0.85, 1.4), y = landAt(x, z);
        if (ok && y > 2.7 && nearOut.d > 30 && nearOut.d < 400) notro(x, y, z, size); else { pr(); pr(); for (let k = 0; k < 5; k++) for (let j = 0; j < 6; j++) pr(); } } }
    // the scarlet bushes of the shore leg: tall notro to either side of the line, 10 to 14 m off it, and flagged nirre a
    // little further off, each placed against a laid metre of its own
    { const o = {};
      for (let i = 0; i < 8; i++) { const at = 14 + i * 29 + pr.range(-8, 8), side = (i & 1 ? -1 : 1) * pr.range(10.2, 14), size = pr.range(1.5, 2.2); routeAt(at, side, o); notro(o.x, landAt(o.x, o.z), o.z, size); }
      for (let i = 0; i < 4; i++) { const at = 30 + i * 55 + pr.range(-10, 10), side = (i & 1 ? 1 : -1) * pr.range(16, 24), size = pr.range(0.9, 1.25); routeAt(at, side, o); nirre(o.x, landAt(o.x, o.z), o.z, size); } }
    for (let i = 0, n = Math.round(24 * pk); i < n; i++) { const x = pr.range(10, 230), z = pr.range(20, -420), size = pr.range(0.8, 1.25), y = landAt(x, z);
      if (lineDist(x, z) < 95 && y > 2.7 && nearOut.d > 26 && nearOut.d < 400) nirre(x, y, z, size); else for (let k = 0; k < 29; k++) pr(); }
    await ctx.yield();
    // lenga: a forest of trees in its autumn. Every cell of a lattice over the gullies and the talus takes its draws; a
    // tree stands there by how thick the wood is at the place (woodAt), so the tongues thin out upward and sideways into
    // single trees and, at their tops, krummholz. Its colour goes by the stand it is in (deep red, rust, old gold, here
    // and there one still dark green), and runs on within its own crown. A tree whose place is within 125 m of the flown
    // line is a whole tree (trunk, boughs, pads of leaf) with its shade on the ground; one 125 to 230 m off is its crown
    // on a plain trunk; one further off still is its crown alone, low on its ground.
    const AUTUMN = [[0.46, 0.07, 0.03], [0.52, 0.17, 0.035], [0.55, 0.34, 0.06], [0.07, 0.13, 0.045]];
    const tallies = { trees: 0, trunks: 0, snags: 0, onLedges: 0, onRock: 0, ferns: 0 };
    const shades = [];                                               // the shade each whole tree lays on its ground: one matrix each
    { const o = {}, wi = {}, sunH = Math.hypot(sunDir.x, sunDir.z) || 1, ax = -sunDir.x / sunH, az = -sunDir.z / sunH, reach = Math.min(2.6, (0.9 * sunH) / Math.max(0.05, sunDir.y));
      const tree = (qq, d) => { const keep = pr(), r0 = 2.2 + 3.1 * Math.pow(pr(), 1.5), v = pr(), hue = pr(), yaw = pr() * 6.283;
        toWorld(qq, d, o); const y = d < 0 ? wallY(qq, -d, o.x, o.z, wi) : shoreY(qq, d, o.x, o.z), wood = woodAt(qq, d, d < 0 ? wi : null);
        if (keep > Math.pow(wood, 1.3) * 0.92 || y < 2.2) return;
        // (small where the wood is thin and at a tongue's top: wind-cut krummholz)
        const up = d < 0 ? sat(-d / 150) : 0, r = r0 * (0.5 + 0.5 * sstep(0.15, 0.7, wood)) * (1 - 0.45 * up);
        // a stand turns together: its trees share a colour, each a little off it
        const stand = n2(qq * 0.013 + 3.3, d * 0.013) * 0.5 + 0.5, pick = sat(stand * 0.8 + (hue - 0.5) * 0.36), tint = AUTUMN[pick < 0.36 ? 0 : pick < 0.62 ? 1 : pick < 0.9 ? 2 : 3], tone = 0.8 + 0.4 * v;
        const col = [tint[0] * tone, tint[1] * tone, tint[2] * tone], x = o.x, z = o.z, off = path.distanceTo(x, y + r, z);
        if (off < 125) {
          // within 125 m of the line: a whole tree on its trunk, or at the wood's thin edge now and then a dead grey snag
          if (air('tree', x, y + r * 1.5, z, r * 1.6) < 8) return; made();
          if (wood < 0.42 && hue > 0.8) { put(B.snag, x, y, z, r, r * (1.1 + 0.5 * v), r, yaw, [1, 1, 1], v, 0, 0.05); tallies.snags++; return; }
          put(B.trees[Math.floor(v * 2.999)], x, y, z, r, r * (0.9 + 0.35 * hue), r, yaw, col, v, 0, 0.3, 0, WIND.x * 0.08, WIND.y * 0.08, 1); tallies.trees++; tallies.trunks++;
          // its shade lies on the slope away from the sun
          const gx = (landAt(x + 1.5, z) - landAt(x - 1.5, z)) / 3, gz = (landAt(x, z + 1.5) - landAt(x, z - 1.5)) / 3, ay = ax * gx + az * gz, by = -az * gx + ax * gz, la = Math.hypot(1, ay), lb = Math.hypot(1, by), L2 = (r * reach) / la, W2 = (r * 1.1) / lb;
          shades.push(ax * L2, ay * L2, az * L2, 0, 0, 1, 0, 0, -az * W2, by * W2, ax * W2, 0, x + ax * L2 * 0.7, y + ay * L2 * 0.7 + 0.15, z + az * L2 * 0.7, 1);
        } else {
          // further off: its crown, broad enough to close with its neighbours' into a canopy; within 230 m on a plain
          // trunk, beyond that low on its ground with the wood's own dark under it
          const mid = off < 230, rc = r * 1.3, h = mid ? r * (0.7 + 0.4 * hue) : 0;
          put(B.crowns[v < 0.5 ? 0 : 1], x, y + h + rc * 0.55, z, rc, rc * (0.75 + 0.3 * v), rc, yaw, col, v, 0, 0.3, 0, 0, 0, 1); tallies.trees++;
          if (mid) { put(B.stem, x, y - 0.3, z, 0.24 * r, h + rc * 0.4, 0.24 * r, yaw, LENGA_BARK, v, 0, 0.1, 0, WIND.x * 0.08, WIND.y * 0.08); tallies.trunks++; } } };
      for (const gq of GULLIES) { const step = gq > -260 && gq < QM + 330 ? 6.4 : 12;
        // (a yield every fourth column: nothing else draws from the plants' stream meanwhile, so the draws keep their order)
        for (let q = gq - 58, c = 0; q <= gq + 58; q += step, c++) { for (let w = 5; w < 196; w += step) tree(q + pr.range(-0.48, 0.48) * step, -(w + pr.range(-0.48, 0.48) * step));
          if (c % 4 === 3) await ctx.yield(); }
        await ctx.yield(); }
      // the belt on the talus at the wall's foot
      for (let q = Q_SOUTH + 20, n = 0; q < QM + 420; q += 6.2, n++) { for (let d = 4; d < 62; d += 6.2) tree(q + pr.range(-0.48, 0.48) * 6.2, d + pr.range(-0.48, 0.48) * 6.2);
        if (n % 40 === 39) await ctx.yield(); } }
    // the ledges of the cove and of the buttress before it: ferns on most, a small red lenga where a ledge is deep
    for (const s of [skin, skinOut]) for (const [x, y, z, deep] of s.ledges) { const kind = pr(), v = pr(), yaw = pr() * 6.283;
      if (kind < 0.45 && deep > 0.9) { const r = 1.6 + 1.5 * v, tint = AUTUMN[v < 0.6 ? 0 : 1], tone = 0.8 + 0.5 * kind;
        if (air('tree', x, y + r * 1.3, z, r * 1.3) < 8) continue; made();
        put(B.crowns[v < 0.5 ? 0 : 1], x, y + r * 1.0, z, r, r * 0.8, r, yaw, [tint[0] * tone, tint[1] * tone, tint[2] * tone], v, 0, 0.3, 0, 0, 0, 1);
        put(B.stem, x, y - 0.4, z, 0.2 * r, r * 1.0, 0.2 * r, yaw, BARK, v, 0, 0.1); tallies.trees++; tallies.onLedges++; }
      else { const sc = 1.3 + 1.0 * v; put(B.tuft, x, y - 0.05, z, sc * 1.4, sc * 0.75, sc * 1.4, yaw, [0.3, 0.62 + 0.2 * kind, 0.22], v, 0, 0.25 * sc); tallies.ferns++; } }
    // boulders: on the talus, the moraine and the beach; one over a metre across keeps 12 m of clear air from the line
    const STONE = [0.5, 0.48, 0.45];
    const boulder = (x, y, z, size, v, yaw) => { if (air(size > 0.5 ? 'block' : 'pebble', x, y + size * 0.3, z, size) < (size > 0.5 ? 12 : 4)) return false; made();
      put(B.far, x, y + size * 0.22, z, size, size * (0.5 + 0.35 * v), size * (0.7 + 0.5 * ((v * 5.3) % 1)), yaw, [STONE[0] * (0.7 + 0.5 * v), STONE[1] * (0.7 + 0.5 * v), STONE[2] * (0.72 + 0.5 * v)], v, 0, 0, 1); return true; };
    for (let i = 0, n = Math.round(150 * pk); i < n; i++) { const x = pr.range(-10, 240), z = pr.range(30, -440), v = pr(), size = 0.3 + 2.1 * Math.pow(pr(), 2.6), yaw = pr() * 6.283;
      if (lineDist(x, z) > 120) continue; const y = landAt(x, z), d = nearOut.d; if (y < 0.2 || d < 6 || d > 400) continue;
      const onTalus = d < 66, onRidge = y > 7.5 && d > 100, onBeach = y < 2.4; if (onTalus || onRidge || onBeach || v < 0.25) boulder(x, y, z, size * (onTalus ? 1.3 : 1), v, yaw); }
    // a whole lenga on rock that stands in the lake (a tower's top, the fin's crest): it takes its draws, and is not
    // made within 8 m of the line
    const lengaOn = (x, y, z, rMax, s = pr) => { const v = s(), hue = s(), yaw = s() * 6.283, r = Math.min(rMax, 2.3 + 1.6 * v), tint = AUTUMN[hue < 0.42 ? 0 : hue < 0.72 ? 1 : hue < 0.93 ? 2 : 3], tone = 0.8 + 0.4 * v;
      if (air('tree', x, y + r * 1.5, z, r * 1.6) < 8) return; made();
      put(B.trees[Math.floor(v * 2.999)], x, y, z, r, r * (0.9 + 0.35 * hue), r, yaw, [tint[0] * tone, tint[1] * tone, tint[2] * tone], v, 0, 0.3, 0, WIND.x * 0.08, WIND.y * 0.08, 1); tallies.trees++; tallies.trunks++; tallies.onRock++; };
    // the stacks' ledges, wherever a storey steps back far enough to hold a plant: tussocks, some notro, some flagged nirre;
    // and on the top of a tower that has no spire, a few lenga and a notro at its rim
    for (const st of STACKS) {
      if (st.flat) { const top = (th, rr) => { const rc = Math.max(1, stackRad(st, th, st.contact)), y = st.contact + (st.H - st.contact) * Math.sqrt(Math.max(0, 1 - (rr * rr) / (rc * rc))), k = sat(y / st.H);
          return [st.x + Math.cos(th) * rr + st.lean[0] * st.H * k * k, y - 0.45, st.z + Math.sin(th) * rr + st.lean[1] * st.H * k * k]; };
        for (let i = 0, n = 2 + Math.floor(st.R / 5.5); i < n; i++) { const th = pr() * 6.283, rr = st.R * 0.5 * Math.sqrt(pr()), p = top(th, rr); lengaOn(p[0], p[1], p[2], st.R * 0.3); }
        { const th = pr() * 6.283, size = pr.range(0.7, 1.1), p = top(th, st.R * 0.55); notro(p[0], p[1], p[2], size); } }
      for (let l = 1; l <= st.storeys; l++) for (let i = 0, n = st.grade >= 2 ? 26 : 10; i < n; i++) {
        const th = pr() * 6.283, v = pr(), kind = pr(), size = pr.range(0.5, 0.8), yb = st.lev[l] - stackWander(st, th);
        const ro = stackRad(st, th, yb - 1.2), ri = stackRad(st, th, yb + 1.2), r = ri + (ro - ri) * 0.5, kk = sat(yb / st.H);
        const x = st.x + Math.cos(th) * r + st.lean[0] * st.H * kk * kk, z = st.z + Math.sin(th) * r + st.lean[1] * st.H * kk * kk;
        if (ro - ri < 1.0) { for (let k = 0; k < 32; k++) pr(); continue; }
        if (kind < 0.17) notro(x, yb, z, size); else if (kind < 0.27) { nirre(x, yb, z, size * 0.85); for (let k = 0; k < 3; k++) pr(); }
        else { for (let k = 0; k < 32; k++) pr(); const sc = 0.5 + 0.5 * v; put(B.tuft, x, yb - 0.05, z, sc, sc, sc, v * 6.283, [0.9, 0.95, 0.85], v, 0, 0.3 * sc); } }
      await ctx.yield(); }
    // red lenga along the fin's crest: over the opening and some 80 m on toward the wall (not as far as its root)
    { const o = {}; for (let i = 0; i < 9; i++) { const a = -76 + i * 14 + pr.range(-4, 4), b = pr.range(-1.4, 1.4); finW(a, b, o); lengaOn(o.x, finTop(a) - 0.45, o.z, 3.6); } }
    // small lenga clinging to the ledges of the towers the line passes near, up to three on each, where a ledge steps
    // back 1.2 m and more (their draws come from a fork of the plants' stream taken after its last draw, so that no
    // other plant's draw moves)
    { const cl = pr.fork('clinging');
      for (const st of STACKS) { if (st.grade < 2) continue;
        for (let k = 0, got = 0; k < 16 && got < 3; k++) { const l = 1 + Math.floor(cl() * (st.storeys - 1)), th = cl() * 6.283, size = cl.range(1.2, 2.1), yb = st.lev[l] - stackWander(st, th);
          const ro = stackRad(st, th, yb - 1.2), ri = stackRad(st, th, yb + 1.2), r = ri + (ro - ri) * 0.45, kk = sat(yb / st.H);
          if (ro - ri < 1.2 || yb < 5) continue;
          const before = tallies.onRock; lengaOn(st.x + Math.cos(th) * r + st.lean[0] * st.H * kk * kk, yb - 0.3, st.z + Math.sin(th) * r + st.lean[1] * st.H * kk * kk, size, cl);
          if (tallies.onRock > before) { got++; tallies.onLedges++; } } } }
    await ctx.yield();
    for (const b of [B.tuft, B.dome, B.leaf, B.far, B.stem, ...B.trees, ...B.crowns, B.snag]) raise(b);
    await ctx.yield();
    // the shade things lay on their ground: a soft dark patch, long down the sun's way
    const shadeGeo = new THREE.PlaneGeometry(2, 2); shadeGeo.rotateX(-Math.PI / 2);
    const shadeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: `varying vec2 vU; void main(){ vU = position.xz; gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.); }`,
      fragmentShader: `varying vec2 vU; void main(){ float r = dot(vU, vU); gl_FragColor = vec4(.03, .04, .03, .5 * (1. - smoothstep(.15, 1., r))); }` });
    const layShades = (M) => { const n = M.length / 16; if (!n) return; const im = new THREE.InstancedMesh(shadeGeo, shadeMat, n); im.instanceMatrix.array.set(M); im.frustumCulled = false; im.renderOrder = 2; scene.add(im); instanced.push(im); };
    layShades(shades);
    await ctx.yield();
    // ---------- guanacos on the moraine ridge, 9 to 15 m to the lake side of the shore leg ----------
    // They stand: hooves anchored, the body leaning with the gusts as a shear (the further up, the further over), necks going
    // down to graze and coming up to look, each in its own time; tails and ears busy.
    const ar = rng.fork('animals'), herdSide = [Infinity, -Infinity];       // (nearest and farthest of the herd from the line, metres on the ground)
    { const preset = { ...F.HERD_PRESETS.antelope, h: 1.12, bodyLen: 1.02, width: 0.3, depth: 0.43, hip: 1.0, leg: [0.056, 0.035, 0.023], neckLen: 0.68, neckAng: 74, neck: [0.135, 0.078],
        headLen: 0.27, headR: 0.07, headPitch: 10, ears: 0.13, tail: 0.2, tailType: 'thin', horns: 0, antlers: 0, coat: '#b47c48', belly: '#f1e9d8', legs: '#cfa672', sock: '#eadfc8', accent: '#5c5650' };
      const g = F.quadrupedGeometry(preset); if (!g.attributes.normal) g.computeVertexNormals();
      const n = Math.round(15 * pk), M = [], G = [], SH = [], o = {};
      for (let i = 0; i < n; i++) {
        const at = 3 + (i + ar.range(0.1, 0.9)) * (160 / n), dOff = ar.range(-2.2, 3.4), yaw = ar.range(-1.2, 1.2) + (ar() < 0.7 ? Math.atan2(-WIND.x, -WIND.y) : 1.6), calf = i % 5 === 3, scA = ar.range(1.3, 1.5), sc = calf ? 0.8 : scA, seed = ar(), bias = ar();
        // abreast of its own metre of the shore leg, between 9 and 15 m out from the line: wherever in that band lies nearest the ridge's crest
        let side = 8.8, miss = 1e9;
        for (let w = 8.8; w < 15; w += 0.7) { routeAt(at, -w, o); const e = Math.abs(nearest(o.x, o.z).d - (129 + dOff)); if (e < miss) { miss = e; side = w; } }
        routeAt(at, -side, o); const y = landAt(o.x, o.z);
        if (air('guanaco', o.x, y + 0.9 * sc, o.z, 1.45 * sc) < 2) continue; made(); herdSide[0] = Math.min(herdSide[0], side); herdSide[1] = Math.max(herdSide[1], side);
        const c = Math.cos(yaw) * sc, s = Math.sin(yaw) * sc; M.push(c, 0, -s, 0, 0, sc, 0, 0, s, 0, c, 0, o.x, y - 0.03, o.z, 1); G.push(seed, bias, sc, 0);
        // its shadow lies on the ground away from the sun
        const sx = -sunDir.x / Math.hypot(sunDir.x, sunDir.z), sz = -sunDir.z / Math.hypot(sunDir.x, sunDir.z), L2 = 1.5 * sc, W2 = 0.75 * sc;
        SH.push(sx * L2, 0, sz * L2, 0, 0, 1, 0, 0, -sz * W2, 0, sx * W2, 0, o.x + sx * 0.75 * sc, y + 0.07, o.z + sz * 0.75 * sc, 1);
      }
      const cnt = G.length / 4;
      if (cnt) {
        const mat = new THREE.ShaderMaterial({ fog: true, uniforms: { ...fogU(), ...LU, uWindDir: { value: WIND.clone() } },
          vertexShader: /* glsl */`attribute vec4 aAnim, iG; attribute vec3 aPivot, color; uniform vec2 uWindDir; uniform float uTime; varying vec3 vW, vN, vC;
            #include <fog_pars_vertex>
            ${GLSL_GALE}
            void main(){
              vec3 p = position, n = normal; float part = aAnim.z, seed = iG.x;
              if (part > 1.5 && (part < 2.5 || part > 4.5)) {           // neck, head and ears: down to graze, up to look round
                float gz = smoothstep(.5, .72, sin(uTime * (.2 + .12 * seed) + seed * 40.) * .5 + .5 + (iG.y - .5) * .7);
                float a = aAnim.x * (gz * 1.75 + .05 * sin(uTime * 1.3 + seed * 9.)), c = cos(a), s = sin(a); vec3 r = p - aPivot;
                r = vec3(r.x, r.y * c - r.z * s, r.y * s + r.z * c); n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
                float b = aAnim.x * (1. - gz) * .7 * sin(uTime * .31 + seed * 17.), cb = cos(b), sb = sin(b);
                r = vec3(r.x * cb + r.z * sb, r.y, -r.x * sb + r.z * cb); n = vec3(n.x * cb + n.z * sb, n.y, -n.x * sb + n.z * cb);
                p = aPivot + r;
              } else if (part > 2.5 && part < 3.5) {                     // the tail
                float a = aAnim.y * (.5 * sin(uTime * 2.3 + seed * 20.) + .3), c = cos(a), s = sin(a); vec3 r = p - aPivot; p = aPivot + vec3(r.x * c - r.y * s, r.x * s + r.y * c, r.z);
              }
              vec4 wp = instanceMatrix * vec4(p, 1.);
              // the lean: nothing at the hooves, most at the ears
              float gust = galeGust(galeTau(instanceMatrix[3].xz));
              wp.xz += uWindDir * (p.y * iG.z) * ((.012 + .03 * gust) * sin(uTime * 1.15 + seed * 30.) + .035 * gust + .012 * sin(uTime * 2.9 + seed * 50.));
              vW = wp.xyz; vN = normalize(mat3(instanceMatrix) * n); vC = color;
              vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`varying vec3 vW, vN, vC;
            #include <fog_pars_fragment>
            ${GLSL_NOISE}
            ${GLSL_LIGHT}
            void main(){
              vec3 N = normalize(vN); float n1 = nA(vW.xy * .9 + vW.z * .7);
              float ndl = dot(N, uSunDir), wrap = clamp(ndl * .75 + .25, 0., 1.);
              vec3 col = vC * (.86 + .28 * n1) * (uSunCol * wrap * scudShade(vW) + uSkyCol * (.55 + .45 * N.y) + vec3(.2, .17, .09) * (.5 - .5 * N.y));
              gl_FragColor = vec4(col, 1.);
              #include <fog_fragment>
            }` });
        const im = new THREE.InstancedMesh(g, mat, cnt); im.instanceMatrix.array.set(M); g.setAttribute('iG', new THREE.InstancedBufferAttribute(new Float32Array(G), 4)); im.frustumCulled = false; scene.add(im); instanced.push(im);
        layShades(SH);
      }
    }
    await ctx.yield();
    // ---------- birds: upland geese that flush from the beach, condors hanging on the gale ----------
    // One shape maker and one shader for both. aW: wing side (-1 left, +1 right, 0 body), share of the way out along the wing,
    // 1 at the tip of a finger feather, unused. iA: place, seed; iB: heading x, z, then for a goose (the laid metre at which
    // it flushes, how high it rises) and for a condor (how far its station drifts, unused).
    const eyeS = { value: 0 };                                       // the laid metre the eye is abreast of
    const birdShape = (S) => { const P = [], Nn = [], C = [], W = [], I = [];
      const v = (x, y, z, c, w, ny = 1) => { P.push(x, y, z); Nn.push(0, ny, 0); C.push(c[0], c[1], c[2]); W.push(w[0], w[1], w[2], 0); return P.length / 3 - 1; };
      // the body: rings along its length, back and belly each their colour
      const SD = 6, r0 = P.length / 3;
      S.rings.forEach(([z, y, rx, ry, top, bel]) => { for (let s = 0; s < SD; s++) { const a = (s / SD) * 6.283, cy = Math.cos(a), k = v(Math.sin(a) * rx, y + cy * ry, z, cy > -0.2 ? top : bel, [0, 0, 0]); Nn[k * 3] = Math.sin(a); Nn[k * 3 + 1] = cy; } });
      for (let r = 0; r < S.rings.length - 1; r++) for (let s = 0; s < SD; s++) { const a = r0 + r * SD + s, b = r0 + r * SD + (s + 1) % SD; I.push(a, b, a + SD, b, b + SD, a + SD); }
      for (const sd of [-1, 1]) {
        // the wing: a row of stations from shoulder to hand, leading and trailing edge at each
        const st = S.wing.map(([x, zl, zt, cl, ct], i) => [v(sd * x, S.wingY, zl, cl, [sd, i / (S.wing.length - 1) * S.handAt, 0]), v(sd * x, S.wingY, zt, ct, [sd, i / (S.wing.length - 1) * S.handAt, 0])]);
        for (let i = 0; i < st.length - 1; i++) I.push(st[i][0], st[i + 1][0], st[i][1], st[i + 1][0], st[i + 1][1], st[i][1]);
        // the fingers: separate feathers fanning from the hand
        const hand = S.wing[S.wing.length - 1];
        for (let f = 0; f < S.fingers; f++) { const t = S.fingers > 1 ? f / (S.fingers - 1) : 0.5, z0 = mix(hand[1], hand[2], t), len = S.fingerLen * (1 - 0.3 * Math.abs(t - 0.35)), fan = (0.35 - t) * S.fan;
          const a = v(sd * hand[0], S.wingY, z0 + 0.045 * S.fingerW, S.tipC, [sd, S.handAt, 0]), b = v(sd * hand[0], S.wingY, z0 - 0.045 * S.fingerW, S.tipC, [sd, S.handAt, 0]);
          const c = v(sd * (hand[0] + len * Math.cos(fan)), S.wingY, z0 + len * Math.sin(fan), S.tipC, [sd, 1, 1]); I.push(a, c, b); }
      }
      // the tail: a flat fan
      { const t = S.tail, a = v(-t[2], t[4], t[0], S.tailC, [0, 0, 0]), b = v(t[2], t[4], t[0], S.tailC, [0, 0, 0]), c = v(-t[3], t[4], t[1], S.tailC, [0, 0, 0]), d = v(t[3], t[4], t[1], S.tailC, [0, 0, 0]); I.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 4)); g.setIndex(I); return g; };
    const birdMaterial = (kind, shoulder) => new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide,
      uniforms: { ...fogU(), ...LU, uKind: { value: kind }, uShoulder: { value: shoulder }, uEyeS: eyeS },
      vertexShader: /* glsl */`attribute vec4 aW, iA, iB; attribute vec3 color; uniform float uTime, uKind, uShoulder, uEyeS; varying vec3 vW, vN, vC;
        #include <fog_pars_vertex>
        void main(){
          float seed = iA.w, side = aW.x, s = aW.y, th, climb = 0., roll = 0.; vec3 p = position, pos; vec2 dir;
          if (uKind < .5) {
            // a goose sits until the eye has come to its flushing place along the line (this reads where the eye IS, not where
            // it looks); from there on its flight is told in the metres the eye has gone on, as far as pT = 14 (some 125 m
            // from its beach): there it holds its place in the air
            float pT = clamp((uEyeS - iB.z) / 26., 0., 14.), fly = smoothstep(0., .45, pT);
            float dist = 9.5 * pT * pT / (pT + .9), rise = iB.w * (1. - exp(-pT / 1.3));
            dir = iB.xy; pos = iA.xyz + vec3(dir.x, 0., dir.y) * dist + vec3(0., rise + .25 * sin(uTime * 2.1 + seed * 30.) * fly, 0.);
            th = mix(-1.3, sin(uTime * 20. + seed * 40. - s * .9) * .75 + .1, fly);
            p.x = mix(p.x * mix(1., .3, abs(side)), p.x, fly);                       // wings folded while it sits
            climb = .3 * exp(-pT / 1.5) * fly;
          } else {
            // a condor wheels on the updraft at its station: a slow round in the world's time, banked into its turn, so that
            // its spread wings are shown now from above and now from below
            float wh = uTime * .45 + seed * 40.;
            pos = iA.xyz + vec3(cos(wh), sin(uTime * .33 + seed * 5.) * .35, sin(wh)) * iB.z;
            dir = vec2(-sin(wh), cos(wh));
            roll = .52 + .1 * sin(uTime * .9 + seed * 7.) + .05 * sin(uTime * 2.3 + seed * 11.);
            th = .1 + .05 * sin(uTime * 1.1 + seed * 3.);
          }
          vec3 n = normal;
          if (abs(side) > .5) {                                                      // the wing bends up about the shoulder, more toward the tip
            float a = th * (.5 + .8 * s), xr = p.x - side * uShoulder; p.y += abs(xr) * sin(a); p.x = side * uShoulder + xr * cos(a); n = vec3(-side * sin(a), cos(a), 0.);
            // the finger feathers flex at the hand, each a little out of step with its neighbour
            p.y += aW.z * uKind * .5 * sin(.14 + .1 * sin(uTime * 2.7 + seed * 13. + position.z * 9.));
          }
          vec3 f = normalize(vec3(dir.x, climb, dir.y)), r = normalize(cross(vec3(0., 1., 0.), f)), u = cross(f, r);
          r = r * cos(roll) + u * sin(roll); u = cross(f, r);
          vec3 wp = pos + r * p.x + u * p.y + f * p.z;
          vW = wp; vN = r * n.x + u * n.y + f * n.z;
          vC = color * mix(vec3(1.), vec3(.62, .43, .28), step(fract(seed * 7.13), .45) * (1. - uKind));     // (the goose's mate is brown)
          vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`varying vec3 vW, vN, vC;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_LIGHT}
        void main(){
          vec3 N = normalize(vN); if (dot(N, cameraPosition - vW) < 0.) N = -N;         // (a wing is one sheet: its lit side is the side seen)
          float wrap = clamp(dot(N, uSunDir) * .7 + .3, 0., 1.);
          vec3 col = vC * (uSunCol * wrap * scudShade(vW) + uSkyCol * (.55 + .45 * N.y) + uBounce * (.5 - .5 * N.y) * .8);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    const flock = (geo, mat, A, Bv) => { const n = A.length / 4; if (!n) return null; const im = new THREE.InstancedMesh(geo, mat, n);
      geo.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(Bv), 4)); im.frustumCulled = false; scene.add(im); instanced.push(im); return im; };
    { const WHT = [0.9, 0.9, 0.87], GRY = [0.5, 0.5, 0.52], BLK = [0.035, 0.035, 0.04], DRK = [0.1, 0.1, 0.1], o = {}, P3 = new THREE.Vector3();
      const gooseGeo = birdShape({ wingY: 0.03, handAt: 0.8, fingers: 1, fingerLen: 0.17, fingerW: 1, fan: 0, tipC: BLK, tailC: DRK, tail: [-0.2, -0.36, 0.04, 0.07, 0],
        rings: [[-0.34, 0, 0, 0, DRK, DRK], [-0.22, 0, 0.055, 0.045, GRY, WHT], [-0.06, 0, 0.1, 0.085, GRY, WHT], [0.1, 0, 0.105, 0.09, GRY, WHT], [0.21, 0.015, 0.07, 0.065, WHT, WHT], [0.3, 0.035, 0.034, 0.034, WHT, WHT],
          [0.42, 0.055, 0.027, 0.027, WHT, WHT], [0.47, 0.065, 0.04, 0.038, WHT, WHT], [0.52, 0.06, 0.02, 0.018, DRK, DRK], [0.56, 0.055, 0, 0, DRK, DRK]],
        wing: [[0.08, 0.1, -0.1, WHT, WHT], [0.36, 0.1, -0.09, WHT, [0.1, 0.2, 0.12]], [0.56, 0.06, -0.08, BLK, BLK]] });
      const RUFF = [0.88, 0.88, 0.85], SKIN = [0.42, 0.3, 0.29], BEAK = [0.7, 0.66, 0.55];
      const condorGeo = birdShape({ wingY: 0.04, handAt: 0.7, fingers: 6, fingerLen: 0.5, fingerW: 1.3, fan: 1.1, tipC: BLK, tailC: BLK, tail: [-0.36, -0.72, 0.09, 0.2, 0],
        rings: [[-0.5, 0, 0, 0, BLK, BLK], [-0.36, 0, 0.09, 0.07, BLK, BLK], [-0.1, 0, 0.165, 0.14, BLK, BLK], [0.16, 0, 0.175, 0.15, BLK, BLK], [0.33, 0.02, 0.125, 0.115, RUFF, RUFF], [0.4, 0.03, 0.05, 0.05, SKIN, SKIN],
          [0.5, 0.03, 0.06, 0.055, SKIN, SKIN], [0.58, 0.012, 0.03, 0.03, BEAK, BEAK], [0.63, 0, 0, 0, BEAK, BEAK]],
        wing: [[0.16, 0.24, -0.3, BLK, WHT], [0.6, 0.25, -0.3, BLK, WHT], [1.02, 0.22, -0.27, BLK, BLK]] });
      // geese: on the beach where the line comes down to the water, to its left; each takes its draws, and one whose
      // flight (all of it: the shader flies it no further than pT = 14, the last place asked here) would not keep 12 m
      // from the line is not made
      { const A = [], Bv = [];
        for (let i = 0, n = Math.round(15 * pk); i < n; i++) { const s0 = ar.range(272, 318), left = ar.range(13, 29), delay = ar.range(0, 1.5), rise = ar.range(2.8, 5.5), ang = ar.range(-0.35, 0.35), seed = ar();
          routeAt(s0, left, o); const y = Math.max(0, landAt(o.x, o.z)) + 0.1, dx = -WIND.x * Math.cos(ang) + WIND.y * Math.sin(ang), dz = -WIND.y * Math.cos(ang) - WIND.x * Math.sin(ang);
          let near = Infinity; for (let pT = 0; pT <= 14; pT += 0.25) { const dist = (9.5 * pT * pT) / (pT + 0.9), h = rise * (1 - Math.exp(-pT / 1.3)); near = Math.min(near, path.distanceTo(o.x + dx * dist, y + h, o.z + dz * dist) - 1.05); }
          if (near < 12) continue; if (!(clear.goose <= near)) clear.goose = near;
          A.push(o.x, y, o.z, seed); Bv.push(dx, dz, 196 + delay * 26, rise); }
        flock(gooseGeo, birdMaterial(0, 0.08), A, Bv); }
      // condors: each at a station given against the laid line (metres along, metres left, metres above the line there, drift);
      // three wheel on the updraft among the towers, about 20 m to one side of the line at the line's own height; one rides
      // high over the shore; four work the updraft along the wall leg, some 18 to 27 m to one side at the line's height
      { const A = [], Bv = [];
        const T0 = RT.towersIn, stations = [[T0 + 72, 19, 2, 2.5], [T0 + 158, -20, 4, 2.5], [T0 + 222, -20, 1, 2.5], [140, 62, 34, 8],
          [RT.arch + 48, 20, 1, 3], [RT.arch + 100, 26, -2, 3.2], [RT.arch + 156, -18.5, 2, 2.5], [RT.arch + 210, 23, 3, 3]];
        // three more on the leg out and round, by the four later towers: 20 to 24 m to the line's left (the side the
        // towers stand on, the inside of the long turn) at the line's own height, between one tower and the next
        // (they take their draws after the eight above, so those keep their order)
        stations.push([924, 22, 2, 3], [1004, 24, 3, 3], [1074, 20, 1, 2.5]);
        // (a rare visit: a whole wing of them stacked on the updraft along the wall; it draws last, so that every other
        // condor stands the same whether the visit is rare or not)
        if (rare) for (let i = 0; i < 6; i++) stations.push([RT.liftTo + i * 14, (i & 1 ? -1 : 1) * (19.5 + i * 1.5), 5 + i * 3.2, 2.5]);
        // THE GUARD BY PLACE. A condor's whole wheel (every place of its round and of its rise and fall, its wings spread:
        // all of it lies within `reach` = 1.06 times its drift and 1.6 m of the station) keeps 3.0 m from every tower's
        // and the wall's rock and 2.3 m from the flown line. A station that cannot is moved straight out from the nearest
        // rock by what is wanting; if 25 m of that does not mend it, the condor is not made. Its draws are taken first, so
        // that nothing else moves. (The build asks 4.3 m of its own measure, 1.3 m in hand over the law's 3.0: on forty
        // seeds the skins' cells stood up to 0.24 m nearer than the forms they are laid by, and the wall's fine pass
        // searches a 1 m lattice about one coarse least, so that against a sheer face that fine pass can read up to a metre too far.) rockOut: how far a place in the air stands from that rock, and the level way out from
        // it: of each tower near enough, the least over the heights round about of its skin's distance at that height
        // (every metre, then every eighth of a metre about the least); of the wall, the least over the plan round
        // about of the distance to its tabled surface (every 4 m, then every metre about the least).
        const ro = { d: 0, nx: 0, nz: 0 }, sk = {};
        const rockOut = (x, y, z, care) => { let best = Infinity, bx = 1, bz = 0;
          for (const b of STACKS) { if (Math.hypot(x - b.x, z - b.z) > b.R * 1.7 + 45 || y > b.H + 40) continue;
            let m = Infinity, ym = y; const lo = Math.max(-2, y - 14), hi = Math.min(b.H, y + 14);
            for (let yy = lo; yy <= hi; yy += 1) { const d = Math.hypot(Math.max(0, towerOut(b, x, yy, z)), yy - y); if (d < m) { m = d; ym = yy; } }
            for (let yy = Math.max(lo, ym - 1); yy <= Math.min(hi, ym + 1); yy += 0.125) m = Math.min(m, Math.hypot(Math.max(0, towerOut(b, x, yy, z)), yy - y));
            const k = sat(ym / b.H), ax = x - b.x - b.lean[0] * b.H * k * k, az = z - b.z - b.lean[1] * b.H * k * k;
            // (a tower that near is asked with care: the places of its skin round about the nearest, every tenth of a
            // radian of bearing and metre of height, then eight times finer about the least of those)
            if (m < care) { const th0 = Math.atan2(az, ax); let tb = th0, yb = ym;
              for (let dt = -0.6; dt <= 0.601; dt += 0.1) for (let yy = Math.max(lo, ym - 6); yy <= Math.min(hi, ym + 6); yy += 1) { stackAt(b, th0 + dt, yy, sk); const d = Math.hypot(sk.x - x, yy - y, sk.z - z); if (d < m) { m = d; tb = th0 + dt; yb = yy; } }
              for (let dt = -0.1; dt <= 0.1001; dt += 0.0125) for (let yy = Math.max(lo, yb - 1); yy <= Math.min(hi, yb + 1); yy += 0.125) { stackAt(b, tb + dt, yy, sk); m = Math.min(m, Math.hypot(sk.x - x, yy - y, sk.z - z)); } }
            if (m < best) { best = m; bx = ax; bz = az; } }
          const wall = (dx, dz) => { const nr = nearest(x + dx, z + dz); return Math.hypot(dx, dz, Math.max(0, y - (nr.d < 0 ? hAt(nr.q, nr.d) : -40))); };
          let m = Infinity, mx = 0, mz = 0;
          for (let dx = -20; dx <= 20; dx += 4) for (let dz = -20; dz <= 20; dz += 4) { const d = wall(dx, dz); if (d < m) { m = d; mx = dx; mz = dz; } }
          if (m < 22) { const cx = mx, cz = mz; for (let dx = cx - 4; dx <= cx + 4; dx += 1) for (let dz = cz - 4; dz <= cz + 4; dz += 1) { const d = wall(dx, dz); if (d < m) { m = d; mx = dx; mz = dz; } } }
          if (m < best) { best = m; if (mx || mz) { bx = -mx; bz = -mz; } else { bx = nearest(x + 2, z).d - nearest(x - 2, z).d; bz = nearest(x, z + 2).d - nearest(x, z - 2).d; } }   // (over the wall's own rock: out is toward the lake)
          const bl = Math.hypot(bx, bz) || 1; ro.d = best; ro.nx = bx / bl; ro.nz = bz / bl; return ro; };
        tallies.condorsMoved = 0; tallies.condorsNotMade = 0;
        for (const [s, left, up, drift] of stations) { await ctx.yield();   // (every pass yields, made or not)
          const ss = s + ar.range(-6, 6), ll = left + ar.range(-1, 1), seed = ar(), reach = drift * 1.06 + 1.6;
          routeAt(ss, ll, o); let x = o.x, z = o.z, gone = 0; const y = eyeY(ss) + up; rockOut(x, y, z, reach + 9);
          for (let it = 0; it < 8 && ro.d - reach < 4.3 && gone <= 25; it++) { const need = 4.35 + reach - ro.d; x += ro.nx * need; z += ro.nz * need; gone += need; rockOut(x, y, z, reach + 9); }
          if (ro.d - reach < 4.3 || gone > 25) { tallies.condorsNotMade++; continue; }
          if (air('condor', x, y, z, reach) < 2.3) { tallies.condorsNotMade++; continue; } made();
          if (gone > 0) tallies.condorsMoved++; if (!(clear.condorRock <= ro.d - reach)) clear.condorRock = ro.d - reach;
          A.push(x, y, z, seed); Bv.push(-WIND.x, -WIND.y, drift, 0); }
        flock(condorGeo, birdMaterial(1, 0.16), A, Bv); }
    }
    await ctx.yield();
    // ---------- notro petals torn off by the gusts, streaming low over the steppe across the shore leg ----------
    // Each petal flies its own short track downwind, over and over, at a height of its own between 4.15 and 6.6 m over
    // the lake's level (a fixed height, not one over the ground under it), with 0.7 m of play up and down; it tumbles as
    // it goes, and is small in the lull and full size in the gust.
    { const n = Math.round(420 * pk), sr = rng.fork('petals'), PA = new Float32Array(n * 4), PB = new Float32Array(n * 4), o = {};
      for (let i = 0; i < n; i++) { toWorld(sr.range(-40, 210), sr.range(40, 92), o); PA[i * 4] = o.x; PA[i * 4 + 1] = 3.9 + sr.range(0.25, 2.7); PA[i * 4 + 2] = o.z; PA[i * 4 + 3] = sr();
        PB[i * 4] = sr.range(34, 58); PB[i * 4 + 1] = sr.range(9, 17); PB[i * 4 + 2] = sr(); PB[i * 4 + 3] = sr.range(0.05, 0.085);
        // (the clear air its whole track keeps, with its rise and sideways play)
        for (let k = 0; k <= 5; k++) { const al = (PB[i * 4] * k) / 5, dd = path.distanceTo(o.x + WIND.x * al, PA[i * 4 + 1] + 0.7, o.z + WIND.y * al) - 0.9; if (!(clear.petal <= dd)) clear.petal = dd; }
        if (i % 120 === 119) await ctx.yield(); }
      const g = new THREE.PlaneGeometry(1, 0.62); g.setAttribute('iA', new THREE.InstancedBufferAttribute(PA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(PB, 4));
      const m = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...LU, uWindDir: { value: WIND.clone() } },
        vertexShader: /* glsl */`attribute vec4 iA, iB; uniform vec2 uWindDir; uniform float uTime; varying vec3 vW, vN;
          #include <fog_pars_vertex>
          ${GLSL_GALE}
          void main(){
            float seed = iA.w, len = iB.x, along = mod(uTime * iB.y + iB.z * len, len), k = along / len;
            vec3 c = iA.xyz + vec3(uWindDir.x, 0., uWindDir.y) * along;
            c.y += sin(k * 6.283 + seed * 20.) * .5 + sin(uTime * 3.1 + seed * 50.) * .2; c.xz += vec2(-uWindDir.y, uWindDir.x) * sin(uTime * 1.7 + seed * 33.) * .8;
            float gust = galeGust(galeTau(c.xz)), size = iB.w * (.35 + .65 * gust) * smoothstep(0., .08, k) * (1. - smoothstep(.9, 1., k));
            // tumbling: two turns of its own
            float a = uTime * (5. + 4. * seed) + seed * 40., b = uTime * (3.1 + 2. * seed) + seed * 17.;
            // (its second axis is the first one a quarter turn on: always of unit length and square to it)
            vec3 ax = vec3(cos(a), sin(a) * cos(b), sin(a) * sin(b)), ay = vec3(-sin(a), cos(a) * cos(b), cos(a) * sin(b));
            vec3 wp = c + (ax * position.x + ay * position.y) * size;
            vW = wp; vN = cross(ax, ay);
            vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`varying vec3 vW, vN;
          #include <fog_pars_fragment>
          ${GLSL_NOISE}
          ${GLSL_LIGHT}
          void main(){ vec3 N = normalize(vN); float l = abs(dot(N, uSunDir));
            gl_FragColor = vec4(vec3(.86, .07, .035) * (uSunCol * (.45 + .55 * l) * scudShade(vW) + uSkyCol * .7), 1.);
            #include <fog_fragment>
          }` });
      // (on a low graphics level only the first share of the petals is drawn)
      const im = new THREE.InstancedMesh(g, m, Math.max(1, Math.round(n * detail))); im.frustumCulled = false; scene.add(im); instanced.push(im); }
    await ctx.yield();

    // ---------- the look: one sliding rest for the eye, its windows made of the route table ----------
    // the main horn over the long fall on the shore leg; among the towers it goes ahead along the line's own run, at the
    // towers' middle height; before the arch it rests far beyond the opening, on the line's own run through it; on the
    // leg along the wall it leads the heading by 30 degrees toward the wall, well up it; on the way out and round it runs
    // ahead of the turn and comes to rest high on the long fall
    const farW = toWorld(QM, -(COVE_BACK + 30), {});
    const lookShore = new THREE.Vector3(farW.x, 170, farW.z), lookFar = new THREE.Vector3(farW.x, 255, farW.z), lookP = new THREE.Vector3(), lookQ = new THREE.Vector3();
    // a place `far` metres from the laid metre s, `turn` degrees to the right of the line's run there, at height y
    const aheadAt = (s, far, turn, y, out) => { const f = Math.min(RT.end - 0.001, Math.max(0, s)), i = Math.floor(f), t = f - i, h = (heading(f) + turn) * D2R;
      return out.set(mix(laid[i][0], laid[i + 1][0], t) + Math.sin(h) * far, y, mix(laid[i][1], laid[i + 1][1], t) - Math.cos(h) * far); };
    // how far the long fall stands to the right of the line's run at a laid metre (degrees; negative to the left)
    const fallOff = (s) => { const i = Math.min(RT.end, Math.max(0, Math.round(s))); let r = Math.atan2(farW.x - laid[i][0], -(farW.z - laid[i][1])) / D2R - heading(s); return r - Math.round(r / 360) * 360; };
    // Every breakpoint is a laid metre of the route table:
    //   to the towers: from the shore leg's last metre (the line begins to swing out over the beach and the horn falls
    //     away to its left) to the first turn's last metre (the line runs straight; the first tower comes abreast 18 m on, 39 m to its right);
    //   to the opening: from the tall tower on the left abreast (none as tall stands between it and the fin) to the
    //     last tower behind;
    //   to the wall: from the first metre of the turn through the arch to the wall standing open (RT.wallOpen);
    //   to the long fall: from the last turn's first metre, whole RT.fallOver metres further on.
    const TURN = RT.turns, lookFallFrom = TURN[4][0], lookFallTo = TURN[4][0] + RT.fallOver;
    const lookAt = (time, u) => { const s = u * PL;
      const kT = sstep(RT.shoreEnd, TURN[0][1], s) * (1 - sstep(RT.towerTall, RT.towersOut, s));
      const kA = sstep(RT.towerTall, RT.towersOut, s) * (1 - sstep(TURN[2][0], RT.wallOpen, s));
      const kW = sstep(TURN[2][0], RT.wallOpen, s) * (1 - sstep(lookFallFrom, lookFallTo, s));
      // on the way round to the cove the look runs ahead of the turn, never more than 58 degrees off the line's run, and
      // comes to rest on the long fall
      const kF = sstep(lookFallFrom, lookFallTo, s), off = fallOff(s), lead = Math.max(-58, Math.min(58, off)), on = 1 - sstep(4, 40, Math.abs(off - lead));
      lookP.copy(lookShore);
      if (kT > 0) lookP.lerp(aheadAt(s + 120, 0, 0, 38, lookQ), kT);
      if (kA > 0) lookP.lerp(aheadAt(RT.arch, 700, 0, 70, lookQ), kA);
      if (kW > 0) lookP.lerp(aheadAt(s, 420, -30, 115, lookQ), kW);
      if (kF > 0) lookP.lerp(aheadAt(s, 420, lead, mix(110, 190, on), lookQ).lerp(lookFar, on), kF);
      return lookP; };
    // (the one rest is on for the whole flight: its window opens well before the entry and closes well beyond the end,
    // so that neither of its fades falls on the flown line)
    const pois = [{ at: lookAt, from: uAt(-0.3 * RT.end), to: 1.3, fade: 0.15, weight: 0.85, steady: true }];
    // the pace: it slows from the last near tower abreast to the arch itself, holds along the wall, and is back as the
    // leg along the wall gives way to the last turn (from RT.wallTo to that turn's first metre)
    const pace = (u) => 1.06 - 0.14 * sstep(uAt(RT.towerLast), uAt(RT.arch), u) * (1 - sstep(uAt(RT.wallTo), uAt(lookFallFrom), u));
    // the gale's phase: where in its period the visit begins. It is dealt from the seeded stream on a fork of its own,
    // taken after every other draw of that stream, so that no other draw moves; any second of the period may come up,
    // and every thing the gale moves is a law of the seconds since the front crossed its place, whole at any of them
    gale.start = rng.fork('galePhase')() * gale.period;

    return {
      scene, path, duration: 46, pace, pois,
      camera: { fov: FOV, near: 0.8, far: 9000, lookAhead: 30, bank: 0.45 },
      portal: { shape: 'circle', radius: RT.gateRadius, color: L.portal, glow: 1, tilt: true, revealDistance: 320, blendDistance: 40 },
      post: { exposure: L.exposure, bloom: { strength: 0.28, radius: 0.6, threshold: 0.94 }, grade: { saturation: 1.08, contrast: 1.05, vignette: 0.22, grain: 0.015 } },
      ride: 'none', companion: 'none',
      // what was made, and the clear air each kind keeps from the flown line (metres, by place)
      facts: { clear, nearby, counts: { tufts: B.tuft.t.length / 4, cushions: B.dome.t.length / 4, leafLumps: B.leaf.t.length / 4, farLumps: B.far.t.length / 4, stems: B.stem.t.length / 4, ...tallies }, herdSide,
        stacks: STACKS.map((st) => { let m = 1e9; for (const p of laid) m = Math.min(m, Math.hypot(p[0] - st.x, p[1] - st.z)); return [Math.round(m), Math.round(st.R), Math.round(st.H)]; }),
        QM, period: gale.period, galeStart: gale.start, hour: lookId, dens, rare, coveSkin: skin.tally, buttressSkin: skinOut.tally },
      update(dt, time, camera, u) {
        LU.uTime.value = time; gale.set(time);
        hero.update(dt, time);
        // the laid metre the eye is abreast of (its place, never its gaze): the geese flush by it
        // (the eye's place is read from the camera's world matrix)
        { const ex = camera.matrixWorld.elements[12], ez = camera.matrixWorld.elements[14]; let bi = 0, best = Infinity;
          for (let i = 0; i <= RT.end; i += 8) { const dx = laid[i][0] - ex, dz = laid[i][1] - ez, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } }
          for (let i = Math.max(0, bi - 8), e = Math.min(RT.end - 1, bi + 8); i <= e; i++) { const dx = laid[i][0] - ex, dz = laid[i][1] - ez, dd = dx * dx + dz * dz; if (dd < best) { best = dd; bi = i; } }
          const a = laid[Math.min(RT.end - 1, bi)], b = laid[Math.min(RT.end - 1, bi) + 1]; eyeS.value = bi + (ex - a[0]) * (b[0] - a[0]) + (ez - a[1]) * (b[1] - a[1]); }
      },
      dispose() { hero.dispose(); for (const im of instanced) im.dispose(); },
    };
  },
};
