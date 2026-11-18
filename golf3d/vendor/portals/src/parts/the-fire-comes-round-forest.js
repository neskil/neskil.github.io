// THE FIRE-PLANTS of the world "the-fire-comes-round": a wild forest of dark giants on the belt world, its
// ripeness and height by place, and the FUSE BELT's catching by place and the world clock.
//
// One ruling plant of our own form in three kinds (a visit deals one). NO TREE OF EARTH FROM ANY ANGLE OR DISTANCE
// (rule 25; stage D cured the outline, which far off had been a palm's or an umbrella tree's on a buttressed foot):
//   THE FOOT is a swollen ribbed bulb sitting on the ground (pods), a tall onion (spires) or the lowest of the body's
//   four swollen ribbed segments (bottles, stage E): never a flared buttress. A bulb is as great as the dry ground
//   round its foot allows: none stands in water (stage E).
//   THE TRUNK is a ribbed column. STOUT ARMS stand off it at several heights, from two fifths of the way up, and the
//   great pods hang from them (on the spires, strung on one thick stiff cord under each arm; on the bottles, hung
//   from short arms under one great upright head): arms and pods are read in outline against sky and fire.
//   THE CROWN is a sheaf of long dry feathers that stands UP from the trunk's end and is bent DOWNWIND by the
//   shader (the wind dealt and the fire's draught at the place): a tall torn brush, a flame's shape, leaning one
//   way, different on each plant; never a round, flat or drooping radial head. No creepers hang anywhere.
//   The cut-out cards beyond the whole plants are drawn from the same figures and bent by the same wind.
// The common plant stands 22 to 48 m with a trunk one to three metres thick; few and far apart, GIANTS of 60 to
// 90 m stand out of the canopy and lean over the water (fast, soft, swollen growth: this forest burns down and
// grows again each time the fire comes round, so nothing in it is old). Dark: deep umber and violet-brown, lit by
// where each stands (the fire's orange with a bright rim on the side toward it, the night's blue on the other, the
// amber of its own seams). Pods are 2 to 5 m across, ribbed like gourds, and glow amber in their seams only (rule
// 25): calm lanterns, fuller and brighter toward the front; a lit pod's light lies on its own dark body, on the
// trunk, arms and crown round it, and on the ground and the water at the plant's foot (the world's pod map, which
// this part writes at build). Six shapes (two near, a giant, two middle, and the middle shape again for the water's
// mirror) with height, girth, lean, turn, count of pods and of plumes dealt for each plant; crossed cut-out cards
// of two to four plants beyond; one dark canopy to the horizon.
// Under and between them (buildGround): low dark fans, coiled young shoots, old split husks; great trunks fallen
// into the river (old dark relics of the last passing, grown over); and in the DROWNED SHALLOWS before the fire the
// dead trunks and stumps of a drowned wood (dark, wet, barkless, some pale and weathered, with water marks; never
// charred, never glowing: the fire has not passed here and never will) with living growth on the islets.
//
// BY PLACE. d = a plant's distance from the part's line (asked of the part's own law through the world's plan,
// never a typed copy), worked out once at build and kept on the plant. By d alone: height (0.6 of the dealt height
// at 1,300 m and beyond, full from 300 m in), ripeness (1 at 40 m falling to 0 at 1,700 m: pods swell; of the
// plants at a place a share has lit seams, a quarter far off and all by the line: amber points, denser toward the
// fire), the wind's play (the air is drawn toward the fire: 0.3 m at the tips far off, 1.2 m near the line).
// THE FUSE BELT (d 0 to 60 m; 130 m beside the drowned shallows, where it stands on the far bank and on the
// islets): clumps along the line, each with an ignition point on it, a period P and an offset. A clump within 40 m
// of one of the part's burst places takes a whole multiple of that burst's period and catches as the burst comes
// up on that beat; every other clump's P and offset are a hash of its place (in the set piece's ground one period
// for all columns and offsets a golden step apart, so that between a quarter and a half of its plants burn at
// every clock). Each plant carries P, offset, its delay (its distance from the ignition point at 9 m a second,
// plus 0 to 0.6 s) and its rise time; with c the world clock, phase = (c + offset) mod P - delay, and the state is
// that phase alone: ripe | catching (the seams brighten, fire climbs the trunk foot to crown, each pod goes in its
// turn as a burst of deep orange sparks and a puff of dark smoke) | torch (the part's own flame form round the
// black trunk, which is still read inside it) | sinking | black | growing back. The script (fuseState) and the
// shaders read the same figures (FUSE). THE CATCHING IS A HABIT INSIDE THE BELT: no plant farther from the line
// than the belt's depth ever catches (the farthest is printed with the deal), at any clock: the fire never comes on.
// RULE 19: nothing catches or glows within 60 m of the moat's edge (a plant whose torch or bursts would reach
// nearer is not of the belt; no burning card, no spot fire there): tested in build and printed (moatLeast). No
// plant that burns stands within 36 m of the route's line (its torch would be a sheet of flame at the lens).
// STAGE F: no smoothstep in a shader has its first edge over its second; divisors are held over nought. A PLANT'S
// IMAGE IN WATER is darker and softer than the plant (its body at 0.4, its glows at 0.7, the air's light between
// left out, its cover eased): never a pale sharp spike. A GATE IS SEEN AS A GATE: each of its two giants leans
// toward the route's line until its crown stands over it (lean up to 0.85 of its height, clear air by the plants'
// own test), six pods and more: the route flies under them. THE FAR STAND of the first third carries fewer
// lanterns (72 to 50 in a hundred of its lit plants for 92). AT THE WATER'S EDGE of the river's banks: coiled
// shoots, fans and husks on the last metres of ground (dealt at the end of the undergrowth's own stream).
// STAGE F2: A GATE'S GIANT BOWS; it is no slanted beam. Its foot, its bulb and the first third of its mast stand
// upright; from there the mast bows over toward the route's line in one long curve, more and more toward the crown
// (out by the square of the height over that third, down by its cube: level at the crown), the crown over the line
// (the bottles kind's trunk ends at 0.86 of its height: its crown comes six tenths of the way to the line); its
// ribs and arms follow the curve, every pod moves whole with its anchor and HANGS plumb (one that stood up on the
// crown is turned over), the brush streams on past the crown and down. The mark is the plant's own (dealt with the
// gate, carried in the instance's turn value); no other plant's form or test is touched. CLEAR AIR is tested on
// the BOWED form (mast, hanging pods and brush), for every seed, in the build. NO GATE'S GIANT STANDS WITHIN A BELT (the deal refuses the place before any draw): no bowed plant ever burns; their count is printed (bowedThatBurn: nought).
// WHAT READS THE EYE IN THIS FILE (stage F: every term; each is optics only, none places, shows, hides or times
// anything): (1) a plant's, a card's and a ground body's rims: the fresnel sheen, the orange rim on what stands
// between the eye and the fire, a seam seen only on skin that faces the eye; (2) the doubles in the water: drawn
// only where the eye's ray meets the water's level (wFace: the mirror); (3) the air between the eye and a thing:
// the dusk's haze and mist by the ray's length (wAir), the smoke's veil along the ray (the part's fcrSmokeVeil);
// (4) a torch's, a burst's and a steam's card is turned about the upright to face the eye, with haze by the ray's
// length; (5) a pixel's footprint: a rib's and a seam's breadth (fwidth), the carpet's detail, its gaps between
// crowns and its hollows' mist (all filters: what a pixel can hold); (6) the carpet's rim toward the fire along
// the look. Nothing else: what stands, burns, glows or is culled reads place, the seed and the world clock.
// The idle forks of the world's list and the burnt draws stay as they are: taking them out would move the deal.
// STAGE E, BY CONSTRUCTION (what would break a rule is culled at build; the printed flags cannot be false): a
// plant, a card or a spot fire never catches where its flame or bursts would reach within 60 m of the moat's edge
// (rule 19), within 90 m of the route's line down the last channel from the beginning of the turn toward the castle
// (that water runs on unbroken into the lagoon and the moat in sight of the castle), or within 30 m of a file's
// line (rules 22 and 23; burnNear tells the animals' part how near a place lies to what burns).
// STAGE E, ORDER ALONG THE RIVER: the stand is dealt as before and then ordered reach by reach (some 290 m): an
// open reach, a narrows whose gate is a pair of leaning giants, a glade; within 62 m of the route's line the
// plants are fewer and greater, behind them the lit middle shapes and the cards stand as the middle bank.
// STAGE E, THE FEET (rule 25): every bulb stands whole above its own dry ground, as great as that ground allows;
// none stands in water. The bottles' body is four swollen ribbed segments with arms at several heights.
//
// COMFORT: seams breathe by 15 per cent over 5 to 9 s, each plant its own phase, and are never brighter than 0.68
// of their amber (1, 0.43, 0.07): a warm line, never white (0.62 until stage D); the fire's light on the plants is
// the part's law (fcrLight with its fcrFlick). A crown's plumes lean with the wind and stir in a gust every 6 to
// 10 s (form, not light). A TORCH IS NEVER WHITE OR PALE YELLOW: its brightest value is linear (1.80, 0.72, 0.09),
// yellow-orange, in small hearts low in its flame (the part's flame form, cut off at that value); a pod's burst is
// at most (1.40, 0.32, 0.025), deep orange; a plant's own skin never takes the flame's colours (it chars black,
// with a few glowing cracks at most 0.8 of that orange).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);   // lengths (plain roots: these are asked very many times in the build)

// the three kinds (metres at full height; ref: the height the common shapes are modelled at, big: the giant's;
// crown: the reach of crown, arms and pods at ref; top: the crown's tuft stands this far over the trunk's own
// height)
// (stage F2) THE BOW of a gate's giant: nought to a third of its height, then the square of the rest (1 at the crown)
const bowF = (t) => { const b = Math.max(Math.min(t, 1.25) - 1 / 3, 0) * 1.5; return b * b; }, bowAt = (p, h) => p.H * bowF(h / p.H);
// (and as it bows its crown comes DOWN, by the cube of the same measure: at the crown the mast runs level or a little under)
const bowDrop = (p, h) => { const b = Math.min(Math.max(h / p.H - 1 / 3, 0) * 1.5, 1); return p.H * Math.min(0.5 * hyp(p.lx, p.lz), 0.24) * b * b * b; };
const KINDS = {
  pods: { h: [25, 45], ref: 35, big: 75, crown: 8.4, top: 1.3 },
  bottles: { h: [22, 38], ref: 30, big: 68, crown: 7.6, top: 1.24 },
  spires: { h: [30, 48], ref: 40, big: 80, crown: 6.8, top: 1.2 },
};
// the trunk's radius (m, at the kind's reference height) by how high on the plant (0..1): one law for the shapes and
// for the air's test
const RAD = {
  pods: (t) => 1.0 * (1 - 0.5 * t),
  // (stage E, the book's rule 25: never a fat smooth bottle: the body is FOUR SWOLLEN SEGMENTS one on another, a waist
  // between each two, ribbed like the pods; less fat than it was)
  bottles: (t) => (t < 0.62 ? (1.25 + 0.8 * Math.pow(Math.sin((Math.PI * t) / 0.62), 0.8)) * (0.7 + 0.3 * Math.pow(Math.abs(Math.sin((Math.PI * t) / 0.155)), 0.6)) : lerp(0.875, 0.6, smoothstep(0.62, 0.86, t))),
  spires: (t) => 0.72 * (1 - 0.72 * t) + 0.06,
};
// THE FOOT (stage D, the book's rule 25: no tree of Earth in outline): never a flared buttress. What the foot adds
// to the trunk's radius (m at the reference height, by how high on the plant): a swollen ribbed BULB sitting on the
// ground (pods), a tall ONION (spires), nothing (bottles: the bottle itself stands in the ground)
const FOOT = {
  pods: (t) => 1.5 * Math.sqrt(Math.max(0, 1 - ((t - 0.035) / 0.08) ** 2)),
  bottles: () => 0,
  spires: (t) => 1.15 * Math.sqrt(Math.max(0, 1 - ((t - 0.05) / 0.1) ** 2)),
};
const FOOT_MAX = { pods: 1.5, bottles: 0, spires: 1.15 };
const GIANT = [60, 90];
// THE LAW'S FIGURES (the brief's fireLaw): one table for the script and the shaders
export const FUSE = { belt: 60, speed: 9, rise: [1.2, 2.2], torch: [7, 11], sink: 4, black: [12, 16], grow: 50, P: [90, 130], clump: 40,
  // THE SET PIECE'S GROUND (the far bank and the islets of the drowned shallows along the run, by the plan's own
  // field): the belt is deeper there and dealt into smaller clumps with shorter periods (cells this long along the
  // line and this deep; a column of cells goes off from the line outward, each row this many seconds after the one
  // behind it); a plant stands longer as a torch there and a shorter while black, so that about a third of them
  // are catching or torches at any clock
  deep: 130, cell: [26, 34], Pset: [50, 64], lag: [5, 8], growLeast: 12, before: 38, torchSet: [13, 18], blackSet: [8, 12],
  hot: [1.80, 0.72, 0.09], burst: [1.40, 0.32, 0.025] };   // the brightest value of a torch; of a pod's burst (linear)
// growing back takes 50 s, or as much of it as the clump's period leaves after the longest burning (12 s at the least)
export const growOf = (P) => clamp(P - FUSE.before, FUSE.growLeast, FUSE.grow);
export const SEAM_MAX = 0.68;     // linear ceiling of a seam's amber (1, 0.43, 0.07): a warm orange-amber line, never white (it was 0.62 until stage D)
const CARD_TOP = 1.3;            // a card stands this far over the height of its tallest trunk (the crowns' tufts)
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// A GIANT IS THE RIPEST OF ITS STAND: wherever it stands it is one of the plants whose pods are lit (the law of the
// lit share, fuLit below, reads a plant's dealt number: a giant's number is dealt into the lit share's part of it)
const ripeSeed = (v) => { const q = v * 9.7; return (Math.floor(q) + 0.02 + 0.18 * (q - Math.floor(q))) / 9.7; };
const fr = (v) => v - Math.floor(v);
// the pod map filled from the dealt plants (a plain function: a loop written inside an async function, as the
// build is, is left to the engine's slowest tier)
const podLight = (M, plants, plan) => {
  const n = M.n, cell = M.span / n, acc = new Float32Array(n * n);
  const ripeOf = (d) => 1 - smoothstep(40, 1700, d);
  for (const p of plants) {
    if (!p.pods) continue;
    const r = ripeOf(p.d); if (fr(p.seed * 9.7) >= 0.24 + 0.76 * r) continue;
    const str = (0.55 + 0.45 * r) * Math.min(p.pods, 6) / 6, R = 8 + 0.25 * p.H, E = plan.pe(p.bow ? p.x + p.lx * bowAt(p, 0.7 * p.H) : p.x + p.lx * 0.7 * p.H), N = plan.pn(p.bow ? p.z + p.lz * bowAt(p, 0.7 * p.H) : p.z + p.lz * 0.7 * p.H);
    const i0 = Math.max(0, Math.floor((E - R - M.e0) / cell)), i1 = Math.min(n - 1, Math.ceil((E + R - M.e0) / cell)), j0 = Math.max(0, Math.floor((N - R - M.n0) / cell)), j1 = Math.min(n - 1, Math.ceil((N + R - M.n0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const q = hyp(M.e0 + (i + 0.5) * cell - E, M.n0 + (j + 0.5) * cell - N) / R; if (q < 1) { const k = 1 - q * q; acc[j * n + i] += str * k * k; } }
  }
  return acc;
};
const podBytes = (M, acc) => { const data = M.data, nn = M.n * M.n; for (let k = 0; k < nn; k++) data[k] = Math.round(255 * Math.min(1, acc[k] * 0.8)); M.tex.needsUpdate = true; };

// the state of a plant at a clock, by its own figures (the shaders hold the same law)
export function fuseState(f, c) {
  if (!(f.P > 0)) return 'ripe';
  const ph = fr((c + f.off) / f.P) * f.P - f.delay;
  if (ph < 0) return 'ripe';
  const T = f.set ? FUSE.torchSet : FUSE.torch, B = f.set ? FUSE.blackSet : FUSE.black;
  const tor = lerp(T[0], T[1], fr(f.seed * 13.7)), bl = lerp(B[0], B[1], fr(f.seed * 29.3));
  if (ph < f.rise) return 'catching';
  if (ph < f.rise + tor) return 'torch';
  if (ph < f.rise + tor + FUSE.sink) return 'sinking';
  if (ph < f.rise + tor + FUSE.sink + bl) return 'black';
  if (ph < f.rise + tor + FUSE.sink + bl + growOf(f.P)) return 'growing';
  return 'ripe';
}

// THE FUSE BELT'S TABLE, BEHIND ONE FUNCTION (swap it here and nowhere else). fuseAt(x) gives the clump that holds
// the line's x: its number, its period P, its offset, its ignition point on the line, and the burst place it follows.
// In the set piece's ground (set true) the clump is a cell of the line's x and of the distance d from the line.
function makeFuse(L) {
  const places = (L.bursts && L.bursts.places) || null, C = FUSE.clump;
  const ledBy = (xc, reach = 40) => { let led = -1, bd = reach; if (places) places.forEach((s, i) => { const dd = Math.abs(s.x - xc); if (s.on !== false && dd < bd) { bd = dd; led = i; } }); return led; };
  const GOLD = 0.6180339887, turnOf = (c) => fr(c * GOLD + 0.37); let table = null;
  const at = (x, d = 0, set = false) => {
    if (set) {
      const W = FUSE.cell[0], c = Math.floor((x + 4 * Math.sin(x * 0.171)) / W), row = Math.min(3, Math.floor(Math.max(d, 0) / FUSE.cell[1])), xc = (c + 0.5) * W;
      const ix = xc + (hash(c * 3.17 + row * 0.7) - 0.5) * 12, iz = L.frontZ(ix) + 3 + row * FUSE.cell[1], led = ledBy(xc, 16);
      // (stage D) ONE PERIOD for the set piece's columns and their offsets a golden step apart from column to
      // column: at every clock the same share of the set piece burns (dealt periods and offsets let it fall to an
      // eighth at some clocks). Only the column that holds a burst place follows that place's own clock.
      let P = 0.5 * (FUSE.Pset[0] + FUSE.Pset[1]), off = P * (table && table.has(c) ? table.get(c) : turnOf(c));
      if (led >= 0) { const s = places[led], k = clamp(Math.ceil(50 / s.period), 1, 3); P = k * s.period; off = (s.phase + Math.floor(hash(c * 7.1) * k)) * s.period; }
      off -= row * lerp(FUSE.lag[0], FUSE.lag[1], hash(c * 5.3 + row * 1.9));           // the fire goes through a column from the line outward
      return { c: 1000000 + c * 4 + row, P, off, ix, iz, led, set: true };
    }
    const c = Math.floor((x + 5 * Math.sin(x * 0.131)) / C), xc = (c + 0.5) * C, ix = xc + (hash(c * 3.17) - 0.5) * 14, iz = L.frontZ(ix) + 2, led = ledBy(xc);
    let P = lerp(FUSE.P[0], FUSE.P[1], hash(c * 1.37 + 0.2)), off = P * hash(c * 2.91 + 0.7);
    if (led >= 0) { const s = places[led], k = clamp(Math.round(110 / s.period), 3, 6); P = k * s.period; off = (s.phase + Math.floor(hash(c * 7.1) * k)) * s.period; }
    return { c, P, off, ix, iz, led, set: false };
  };
  // THE SET PIECE'S TURNS (stage D): its columns take their turns in the golden order of their places along the line
  // (a hash of place, as before), and each column's turn is as long as its share of the set piece's plants: so at
  // every clock nearly the same share of the plants burns, whatever the seed deals (with turns of equal length a
  // column of many plants and a column of few made the share swing). A column led by a burst keeps that burst's clock.
  at.spread = (plants) => {
    const w = new Map(); let W = 0;
    for (const p of plants) if (p.set && p.led < 0) { const c = Math.floor((p.clump - 1000000) / 4); w.set(c, (w.get(c) || 0) + 1); W++; }
    if (!W) return 0;
    table = new Map(); let cum = 0;
    for (const c of [...w.keys()].sort((a, b) => turnOf(a) - turnOf(b))) { table.set(c, (cum + 0.5 * w.get(c)) / W); cum += w.get(c); }
    return table.size;
  };
  return at;
}

export async function buildForest(env) {
  const { L, plan, way, forks, deal, detail, pause, routePts, rockY, zoneD } = env;
  const K = KINDS[deal.kind] || KINDS.pods, noise = env.ctx.noise, fuseAt = makeFuse(L), lineD = plan.lineD;
  const heightK = (d) => lerp(1, 0.6, smoothstep(300, 1300, d));
  routePts.forEach((p, i) => { p.i = i; });

  // ---------- the route, for the air: its points in squares of 32 m ----------
  const CELL = 32, cells = new Map(), ck = (i, j) => (i + 4096) * 8192 + (j + 4096);
  for (const p of routePts) { const k = ck(Math.floor(p.x / CELL), Math.floor(p.z / CELL)); let c = cells.get(k); if (!c) cells.set(k, (c = [])); c.push(p); }
  const eachNear = (x, z, R, fn) => {
    const i0 = Math.floor((x - R) / CELL), i1 = Math.floor((x + R) / CELL), j0 = Math.floor((z - R) / CELL), j1 = Math.floor((z + R) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = cells.get(ck(i, j)); if (c) for (const p of c) fn(p); }
  };
  // the least air between the route and an upright body (foot y0, top y1, radius r) standing at x, z
  const airOf = (x, z, y0, y1, r) => { let m = Infinity; eachNear(x, z, r + 48, (p) => { const h = Math.max(hyp(p.x - x, p.z - z) - r, 0), v = p.y > y1 ? p.y - y1 : p.y < y0 ? y0 - p.y : 0, dd = hyp(h, v); if (dd < m) m = dd; }); return m; };
  // THE AIR OF A PLANT: the least air between the route and its whole reach. Its foot is a leaning column (the
  // dealt lean, the trunk's own swing, what the wind adds); from a tenth of its height up, its arms, pods
  // and crown reach p.r round it. Walked up the plant in steps of 3 m at the most, with half a step given away.
  // (what moves it: the trunk's own swing, 0.03 of its height; the wind's lean and play, 0.012 of its height and 1.5 m)
  const slack = (H) => 0.045 * H + 1.6;
  const trunkR = (p, t) => (RAD[deal.kind in RAD ? deal.kind : 'pods'](t) + FOOT_MAX[deal.kind in FOOT_MAX ? deal.kind : 'pods']) * (p.H / K.ref) * p.girth + slack(p.H);   // (the foot's bulb at its greatest)
  const airPlant = (p, R = 30) => {
    const top = p.H * K.top + 0.6, n = Math.max(8, Math.ceil(top / 3)), half = top / n / 2; let m = Infinity;
    for (let k = 0; k <= n; k++) {
      const h = (top * k) / n, cx = p.x + p.lx * h, cz = p.z + p.lz * h, cy = p.y + h, r = h < 0.1 * p.H ? trunkR(p, h / p.H) : p.r;
      if (!p.bow) { eachNear(cx, cz, r + R, (q) => { const dd = hyp3(q.x - cx, q.y - cy, q.z - cz) - r - half; if (dd < m) m = dd; }); continue; }
      // (stage F2) A BOWED GIANT IS TESTED IN ITS BOWED FORM: its mast at this height; the pods that hang plumb at this
      // height from an anchor higher up the curve (to a fifth of its height higher); and, past the crown, its brush
      const ball = (o, y) => { const bx = p.x + p.lx * o, bz = p.z + p.lz * o; eachNear(bx, bz, r + R, (q) => { const dd = hyp3(q.x - bx, q.y - y, q.z - bz) - r - half; if (dd < m) m = dd; }); };
      const dH = bowDrop(p, p.H);
      ball(bowAt(p, h), cy - bowDrop(p, h)); if (h > 0.2 * p.H && h < p.H) { const ha = Math.min(h + 0.2 * p.H, p.H); ball(bowAt(p, ha), cy - bowDrop(p, ha)); }
      if (h > p.H) { const u = h - p.H, L = hyp(p.lx, p.lz), bl = Math.min(2 * L, 1); ball(p.H + u * 0.8 * Math.min(2, 1 / Math.max(L, 0.05)), p.y + p.H - dH + u * (1 - 1.3 * bl)); ball(p.H, cy - dH); }
    }
    return m;
  };
  const routeAt = (x, z, R) => { let m = Infinity, y = 0; eachNear(x, z, R, (p) => { const s = hyp(p.x - x, p.z - z); if (s < m) { m = s; y = p.y; } }); return [m, y]; };
  const coarse = routePts.filter((p, i) => i % 20 === 0), farFromRoute = (x, z, R) => { for (const p of coarse) if (hyp(p.x - x, p.z - z) < R) return false; return true; };
  const laneNear = env.lanes ? env.lanes.laneNear : () => 99;

  // ---------- THE DEAL: every plant by place ----------
  const plants = [], occ = new Map(), ok = (i, j) => (i + 8192) * 16384 + (j + 8192);
  const crowded = (x, z, gap) => {
    const i = Math.floor(x / 16), j = Math.floor(z / 16);
    for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const c = occ.get(ok(a, b)); if (c) for (const q of c) if (hyp(q.x - x, q.z - z) < Math.max(gap, q.gap || 0)) return true; }
    return false;
  };
  const keepP = (p) => { const k = ok(Math.floor(p.x / 16), Math.floor(p.z / 16)); let c = occ.get(k); if (!c) occ.set(k, (c = [])); c.push(p); plants.push(p); return p; };
  const TORCH_OFF = 36;
  // RULE 19, THE MOAT (stage D): nothing of the forest catches or glows within MOAT_OFF of the moat's edge. A plant
  // whose torch (its flame's half breadth) or whose pods' bursts would reach nearer is not of the fuse belt: it
  // stands and never catches. The same for a card of the black rank and for a spot fire. Tested again in build
  // (moatLeast, printed with the deal).
  const MOAT_OFF = 60, flameReach = (H) => Math.max(0.31 * H, 4.5) + 0.07 * H + 10;
  const AIR = 6;                                                              // a plant is dealt only where its whole reach leaves this much air to the route (the test in build asks 2)
  // one plant dealt at a place, or null. level 0 near, 1 middle. o: young (a young plant at a bank's foot), ledge (on
  // the rock's lower ledges), fuse (dealt for the fuse belt: only there), isle (on an islet of the shallows), wild
  // (in clumps with glades between them), giant (one of the forest's giants: 60 to 90 m)
  const dealAt = (rng, x, z, level, o = {}) => {
    const E = plan.pe(x), N = plan.pn(z), d = lineD(x, z), set = plan.setPiece(E, N) >= 0.5, belt = set ? FUSE.deep : FUSE.belt;
    if (d < 3 || (o.fuse && d > belt) || (o.gate && d <= belt)) return null;    // no plant is dealt behind the line; NO GATE'S GIANT WITHIN A BELT (it would burn, bowed over the route): refused here, before any draw
    if (d <= belt && routeAt(x, z, TORCH_OFF)[0] < TORCH_OFF) return null;        // (stage D) no plant that burns stands within 36 m of the route's line: nearer, its torch is a sheet of flame at the lens
    if (o.wild && !o.giant && rng() > smoothstep(0.22, 0.5, 0.5 + 0.5 * noise.n2(x / 47 + 9, z / 47 + 2))) return null;   // clumps and glades (no row, no hedge)
    const heart = 0.5 + 0.5 * noise.n2(x / 31 + 40, z / 31 - 7), quirk = rng();   // taller at a clump's heart
    let H = lerp(K.h[0], K.h[1], clamp(0.2 * rng() + 0.8 * heart * (0.55 + 0.9 * rng()), 0, 1)) * heightK(d), pods = 2 + Math.floor(rng() * 5), plumes = 6 + Math.floor(rng() * 6);
    if (quirk < 0.07) { H *= rng.range(0.7, 0.95); pods = 0; plumes = 0; }      // here and there a dead one, bare
    else if (quirk < 0.11) { H *= 0.45; pods = 0; plumes = 0; }                 // or a broken trunk
    else if (quirk < 0.24) { H *= rng.range(0.45, 0.7); pods = 1 + Math.floor(rng() * 2); plumes = 4 + Math.floor(rng() * 3); }   // or one half grown
    if (o.young) { H = rng.range(4, 11); pods = rng() < 0.4 ? 1 : 0; plumes = 3 + Math.floor(rng() * 3); }
    if (o.ledge) H = Math.min(H, rng.range(9, 16));
    if (o.isle) { H = Math.min(H, rng.range(18, 30)); if (plan.isletAt(E, N) < 1.6) return null; }
    if (o.giant) { H = rng.range(GIANT[0], GIANT[1]); pods = 5 + Math.floor(rng() * 5); plumes = 10 + Math.floor(rng() * 4); }
    const s = H / K.ref, r = K.crown * (o.giant ? 0.62 : 1) * s + slack(H) + 3.2;   // the reach of arms, pods and crown; with the trunk's play and the plumes' streaming (3.2 m)
    let y, w = 99;
    if (o.ledge) y = rockY(plan.sdRock(E, N));
    else {
      w = plan.watAt(E, N);
      if (!o.isle && w < (o.young ? 1 : 2.6 + (o.giant ? 2 : 0))) return null;  // the foot stands on land (a crown may hang over the water)
      y = plan.groundAt(x, z);
    }
    if (laneNear(x, z) < 3.2 + (o.giant ? 2 : 0)) return null;                  // no trunk on a file's line
    const gap = o.young ? 3 : o.giant ? 15 : level === 0 ? 6.5 : 5.5;
    if (crowded(x, z, quirk > 0.96 ? 2.4 : gap)) return null;                   // (now and then a pair grown together)
    // THE LEAN: a plant near a bank leans out over the water (the giants most); elsewhere a little, any way
    let lx = rng.range(-0.045, 0.045), lz = rng.range(-0.045, 0.045);
    if (w < 16 && !o.isle && !o.ledge) { const e = plan.watAt(E + 3, N) - w, n = plan.watAt(E, N + 3) - w, l = hyp(e, n) || 1, a = rng.range(0.03, 0.15) * (o.giant ? 1.5 : 1) * smoothstep(16, 5, w); lx += (-e / l) * a * plan.m; lz += (n / l) * a; }
    const p = { x, y, z, d, H, r, level, young: !!o.young, giant: !!o.giant, isle: !!o.isle, gap, turn: rng() * 6.2832, girth: rng.range(0.85, 1.25), lx, lz, pods, plumes, seed: o.giant ? ripeSeed(rng()) : rng(), wat: w };
    let air = airPlant(p, AIR + 2);
    if (air < AIR && !o.isle) { p.lx = rng.range(-0.02, 0.02); p.lz = rng.range(-0.02, 0.02); air = airPlant(p, AIR + 2); }   // (upright, if its lean would bring it too near the route)
    if (air < AIR) return null;
    const burns = d <= belt && plan.sdMoat(E, N) >= MOAT_OFF + flameReach(H);
    if (o.fuse && !burns) return null;                                          // (dealt for the fuse belt only: not here)
    const f = burns ? fuseAt(x, d, set) : null;
    Object.assign(p, { P: f ? f.P : 0, off: f ? f.off : 0, delay: f ? hyp(x - f.ix, z - f.iz) / FUSE.speed + 0.6 * rng() : 0, rise: rng.range(FUSE.rise[0], FUSE.rise[1]), clump: f ? f.c : -1, led: f ? f.led : -1, set: f ? f.set : false });
    return keepP(p);
  };
  const lowPts = routePts.filter((p) => p.way > way.rideLevel - 40 && p.way < way.rideEnd + 40), downPts = routePts.filter((p) => p.way > 0 && p.way < way.rideLevel - 40);
  const lastPts = routePts.filter((p) => p.way > way.turn2Start + 20 && p.way < way.shore + 6);
  await pause();
  // a place beside the route: s metres to one side of one of its points
  const beside = (rng, pts, s0, s1) => {
    const p = pts[Math.floor(rng() * pts.length)], a = routePts[Math.max(0, p.i - 1)], b = routePts[Math.min(routePts.length - 1, p.i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z, l = hyp(tx, tz) || 1, s = rng.range(s0, s1) * (rng() < 0.5 ? -1 : 1);
    return [p.x - (tz / l) * s, p.z + (tx / l) * s];
  };
  // a place s metres to the fire's side of the route's line at way w (s under 0: the other side)
  const sidePt = (w, s) => { const q = plan.at(w); return [plan.wx(q[0] - Math.cos(q[2]) * s), plan.wz(q[1] + Math.sin(q[2]) * s)]; };
  const watOf = (x, z) => plan.watAt(plan.pe(x), plan.pn(z));
  let tried = 0;                                                             // (tries since the build began: one count for all the dealing, so that a step is as long whichever list it falls in)
  const dealMany = async (rng, n, tries, fn, every = 300) => { let got = 0; for (let t = 0; t < tries && got < n; t++) { if (fn()) got++; if (++tried % every === 0) await pause(); } return got; };   // (a pause every few milliseconds of tries)
  const fn = forks.near, fm = forks.mid, count = { giants: 0, banks: 0, belt: 0, isles: 0, beltBehind: 0, ranks: 0, rims: 0, last: 0, shores: 0, ledges: 0, fuse: 0, young: 0 };
  const flatA = way.rideEnd - 20, flatB = way.turn2Start + 70;
  // THE GIANTS first (they take their room), few and far apart: by the way down, along the river, round the
  // shallows and by the channel; each on a bank or a little behind it, leaning over the water
  for (const [pts, n, s1] of [[downPts, 7, 90], [lowPts, 9, 80], [lastPts, 5, 110]]) if (pts.length) count.giants += await dealMany(fn, Math.round(n * detail), 700, () => { const [x, z] = beside(fn, pts, 24, s1), w = watOf(x, z); return w > 4 && w < 30 ? dealAt(fn, x, z, 0, { giant: true }) : null; });
  // THE RIVER'S BANKS, both sides of the way down and of the ride: near shapes on the bank and close behind it
  const bankPts = routePts.filter((p) => p.way > 60 && p.way < way.rideEnd + 40);
  count.banks = await dealMany(fn, Math.round(88 * detail), 6000, () => { const [x, z] = beside(fn, bankPts, 16, 88), w = watOf(x, z); return w > 2.6 && w < 30 ? dealAt(fn, x, z, 0, { wild: true }) : null; });
  // THE SET PIECE'S BELT, on the far bank of the drowned shallows along the run: its front ranks are near shapes (40 to
  // 105 m from the route's line), the ranks behind them middle shapes, to the line; and plants on the islets
  count.belt = await dealMany(fn, Math.round(34 * detail), 5000, () => { const [x, z] = sidePt(fn.range(flatA, flatB), fn.range(36, 108)); return dealAt(fn, x, z, 0, { fuse: true }); });
  count.isles = await dealMany(fn, Math.round(9 * detail), 4000, () => { const [x, z] = sidePt(fn.range(flatA, flatB), fn.range(22, 78)); return plan.isletAt(plan.pe(x), plan.pn(z)) > 1.6 ? dealAt(fn, x, z, 0, { fuse: true, isle: true }) : null; });
  count.beltBehind = await dealMany(fm, Math.round(120 * detail), 7000, () => { const [x, z] = sidePt(fm.range(flatA, flatB), fm.range(84, 176)); return dealAt(fm, x, z, 1, { fuse: true }); });
  // MIDDLE: the ranks behind the river's banks; the forest's edge round the shallows; the channel's banks
  if (bankPts.length) count.ranks = await dealMany(fm, Math.round(110 * detail), 6000, () => { const [x, z] = beside(fm, bankPts, 30, 128), w = watOf(x, z); return w > 18 ? dealAt(fm, x, z, 1, { wild: true }) : null; });
  count.rims = await dealMany(fm, Math.round(60 * detail), 5000, () => { const [x, z] = sidePt(fm.range(flatA, flatB), fm() < 0.6 ? -fm.range(48, 140) : fm.range(100, 190)); return lineD(x, z) > FUSE.deep ? dealAt(fm, x, z, 1, { wild: true }) : null; });
  if (lastPts.length) count.last = await dealMany(fm, Math.round(70 * detail), 6000, () => { const [x, z] = beside(fm, lastPts, 40, 150); return lineD(x, z) > FUSE.deep ? dealAt(fm, x, z, 1, { wild: true }) : null; });
  // both shores of the moat
  const mo = env.PLAN.moat, rk = env.PLAN.rock, KK = env.PLAN.K;
  count.shores = await dealMany(fm, Math.round(60 * detail), 6000, () => {
    const a = fm.range(mo.a[0] - 60, mo.a[1] + 60), c = fm.range(mo.c[0] - 60, mo.c[1] + 60), [E, N] = plan.fromLocal(a, c), s = plan.sdMoat(E, N);
    if (s < 0 || s > 56) return null; return dealAt(fm, plan.wx(E), plan.wz(N), 1, { wild: true });
  });
  // the rock's lower ledges, on its flanks only (well off the route's line). THE CASTLE'S GROUND IS KEPT FREE (the
  // castle is another part's, greater now; figures in its own frame, by its builder's word): none on its waterside
  // (the water stairs, bridges and landings: a from -140 to -98, c 31 to 63 either side: they stand 4 m farther out since the castle's round 2), none at the feet of its
  // bastions and ward drums (everything within 84.5 of the line's side between a -103 and 72)
  count.ledges = await dealMany(fm, Math.round(16 * detail), 2500, () => {
    const a = fm.range(rk.a[0], rk.a[1]), c = fm.range(rk.c[0], rk.c[1]), [E, N] = plan.fromLocal(a, c), s = plan.sdRock(E, N) / KK, aF = a / KK, cF = Math.abs(c) / KK;
    if ((aF > -140 && aF < -98 && cF > 31 && cF < 63) || (aF > -103 && aF < 72 && cF < 84.5)) return null;
    if (Math.abs(c) < 46 * KK || !((s < -3.8 && s > -6.6) || (s < -11.4 && s > -14.4))) return null; return dealAt(fm, plan.wx(E), plan.wz(N), 1, { ledge: true });
  });
  // THE FUSE BELT within 500 m of the route's line: every clump there has its plants
  let x0 = Infinity, x1 = -Infinity; for (const p of routePts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
  count.fuse = await dealMany(fm, Math.round(80 * detail), 7000, () => {
    const x = fm.range(x0 - 500, x1 + 500), z = L.frontZ(x) + fm.range(4, 62);
    if (farFromRoute(x, z, 500)) return null; return dealAt(fm, x, z, 1, { fuse: true });
  });
  // young plants at the banks' feet
  if (bankPts.length) count.young = await dealMany(fm, Math.round(36 * detail), 5000, () => { const [x, z] = beside(fm, bankPts, 18, 70), w = watOf(x, z); return w > 1 && w < 9 ? dealAt(fm, x, z, 1, { young: true }) : null; });
  await pause();

  // ---------- STAGE E, BY CONSTRUCTION (the book guard's addendum A3, A4) ----------
  // What would break a rule is culled at build, so that the printed flags can never be false. A plant, a card or a
  // spot fire NEVER CATCHES (it stands as it is at every clock): (rule 19) where its flame or its bursts would reach
  // within 60 m of the moat's edge; (A3) on the banks of the last channel, whose water runs on unbroken into the
  // lagoon and the moat in sight of the castle: within CHAN_OFF of the route's line from the beginning of the turn
  // toward the castle on; (rules 22 and 23) within 30 m of any file's line (and 4 m more for the file's breadth).
  const lanePts = new Map();
  if (env.lanes && env.lanes.lanes) for (const l of env.lanes.lanes) for (const w of l.world) { const k = ck(Math.floor(w[0] / CELL), Math.floor(w[2] / CELL)); let c = lanePts.get(k); if (!c) lanePts.set(k, (c = [])); c.push(w); }
  const laneFar = (x, z) => { let m = 128; const i = Math.floor(x / CELL), j = Math.floor(z / CELL); for (let a = i - 4; a <= i + 4; a++) for (let b = j - 4; b <= j + 4; b++) { const c = lanePts.get(ck(a, b)); if (c) for (const w of c) { const q = hyp(w[0] - x, w[2] - z); if (q < m) m = q; } } return m; };
  const chanFrom = way.turn2Start, chanLine = routePts.filter((q) => q.way > chanFrom && q.way < way.shore + 30 && q.i % 3 === 0);
  const chanD = (x, z) => { let m = Infinity; for (const q of chanLine) { const d2 = hyp(q.x - x, q.z - z); if (d2 < m) m = d2; } return m; };
  const CHAN_OFF = 90, LIFE_OFF = 30, culled = { moat: 0, channel: 0, files: 0 };
  const mayBurn = (x, z, reach) => { const why = plan.sdMoat(plan.pe(x), plan.pn(z)) - reach < MOAT_OFF ? 'moat' : chanD(x, z) - reach < CHAN_OFF ? 'channel' : laneFar(x, z) - reach - 4 < LIFE_OFF ? 'files' : null; if (why) culled[why]++; return !why; };
  const torchHalf = (H) => Math.max(0.31 * H, 4.5) + 0.07 * H;
  for (const p of plants) if (p.P > 0 && !mayBurn(p.x, p.z, flameReach(p.H))) Object.assign(p, { P: 0, off: 0, delay: 0, clump: -1, led: -1, set: false });
  await pause();

  // the set piece's columns take their turns by their shares of its plants (see makeFuse): every plant of it takes its column's turn
  count.setColumns = fuseAt.spread(plants);
  for (const p of plants) if (p.set && p.P > 0) { const f = fuseAt(p.x, p.d, true); p.off = f.off; }
  // THE CARDS: two to four plants each. In the ground where plants stand singly (beyond the near ranks), and along
  // the whole foot of the fire as the black rank against the flame (these belong to the fuse belt and catch by its law).
  const fc = forks.cards, cards = [];
  await dealMany(fc, Math.round(1050 * detail), 22000, () => {
    const p = routePts[Math.floor(fc() * routePts.length)], ang = fc() * 6.2832, s = 60 + 190 * Math.sqrt(fc()), x = p.x + Math.cos(ang) * s, z = p.z + Math.sin(ang) * s;
    const d = lineD(x, z), E = plan.pe(x), N = plan.pn(z); if (d < (plan.setPiece(E, N) >= 0.5 ? FUSE.deep : FUSE.belt) + 2) return null;
    if (zoneD(E, N) > 14) return null;
    if (fc() > smoothstep(0.14, 0.5, 0.5 + 0.5 * noise.n2(x / 47 + 9, z / 47 + 2))) return null;
    const W = fc.range(26, 40);
    if (routeAt(x, z, 72)[0] < 64) return null;                                 // the near ranks are whole plants
    if (plan.watAt(E, N) < 0.5 * W + 2 || crowded(x, z, 9)) return null;
    const big = fc() < 0.07, H = (big ? fc.range(1.35, 1.8) * K.h[1] : lerp(0.5 * K.h[0], K.h[1], Math.pow(fc(), 0.7))) * heightK(d), y = plan.groundAt(x, z);
    cards.push({ x, y, z, d, W: big ? W * 1.2 : W, H, variant: Math.floor(fc() * 6), turn: fc() * 6.2832, seed: fc(), P: 0, off: 0, delay: 0, clump: -1 }); return true;
  }, 900);
  await dealMany(fc, Math.round(380 * detail), 7000, () => {
    const x = fc.range(x0 - 1500, x1 + 1500), z = L.frontZ(x) + fc.range(3, 60), d = lineD(x, z);
    if (d < 2 || d > FUSE.belt) return null;
    const E = plan.pe(x), N = plan.pn(z), W = fc.range(24, 36);
    if (plan.watAt(E, N) < 0.5 * W || crowded(x, z, 9)) return null;
    if (plan.sdMoat(E, N) < MOAT_OFF + 0.5 * W + 6) return null;                // (rule 19: no card of the burning rank within 60 m of the moat)
    const f = fuseAt(x, d, plan.setPiece(E, N) >= 0.5);
    cards.push({ x, y: plan.groundAt(x, z), z, d, W, H: lerp(0.6 * K.h[0], K.h[1], Math.pow(fc(), 0.7)), variant: Math.floor(fc() * 6), turn: fc() * 6.2832, seed: fc(),
      P: f.P, off: f.off, delay: hyp(x - f.ix, z - f.iz) / FUSE.speed + 0.6 * fc(), rise: fc.range(FUSE.rise[0], FUSE.rise[1]), clump: f.c, set: f.set }); return true;
  });
  await pause();
  // the thin mist that lies on the drowned shallows: wide thin drifts by place, none within 30 m of the route's line in plan
  const fsm = forks.mist, drifts = [];
  for (let t = 0; t < 700 && drifts.length < Math.round(46 * detail); t++) {
    const [x, z] = sidePt(fsm.range(flatA, flatB), fsm.range(-44, 118)), E = plan.pe(x), N = plan.pn(z);
    if (plan.sdAsh(E, N) > -4 || routeAt(x, z, 48)[0] < 30) continue;
    drifts.push({ x, y: plan.groundAt(x, z), z, H: fsm.range(5, 10), W: fsm.range(36, 70), seed: fsm(), d: lineD(x, z) });
  }
  // SPOT FIRES on the islets of the drowned shallows, INSIDE THE BELT ONLY (stage D: what burns on our side of the
  // line is what the belt gives: brands lodged on an islet of the belt): small flames that stand there (3 to 7 m),
  // none within 26 m of the route's line in plan, none within 60 m of the moat
  const spots = [];
  for (let t = 0; t < 1500 && spots.length < Math.round(18 * detail); t++) {
    const [x, z] = sidePt(fsm.range(flatA, flatB), fsm.range(26, 110)), E = plan.pe(x), N = plan.pn(z), d = lineD(x, z), H = fsm.range(3, 7), seed = fsm();
    if (d < 6 || d > (plan.setPiece(E, N) >= 0.5 ? FUSE.deep : FUSE.belt) || plan.sdMoat(E, N) < MOAT_OFF + 0.6 * H + 4) continue;
    if (plan.isletAt(E, N) < 1.2 || routeAt(x, z, 40)[0] < 26 || crowded(x, z, 5)) continue;
    if (chanD(x, z) - 0.6 * H - 1 < CHAN_OFF || laneFar(x, z) - 0.6 * H - 5 < LIFE_OFF) continue;   // (stage E: none by the last channel, none within 30 m of a file's line: another islet is tried)
    spots.push({ x, y: plan.groundAt(x, z), z, H, seed, d });
  }
  await pause();
  // (stage E, by construction: the same for the cards of the burning rank and for the spot fires)
  for (const c of cards) if (c.P > 0 && !mayBurn(c.x, c.z, 0.5 * c.W)) Object.assign(c, { P: 0, off: 0, delay: 0, clump: -1, set: false });
  for (let i = spots.length - 1; i >= 0; i--) if (!mayBurn(spots[i].x, spots[i].z, 0.6 * spots[i].H + 1)) spots.splice(i, 1);
  count.neverCatchBy = culled;

  // ---------- STAGE E, ORDER IN THE RIVER'S FOREST (E1) ----------
  // The stand along the river is dealt as before (the same deal: the run along the fire and the lagoon are as they
  // were), and then ORDERED by a law of place along the river, reach by reach (a reach is some 290 m, its beginning
  // by the seed's noise): an OPEN REACH (few plants near the water: a far view down the river to the fire), a
  // NARROWS (a grove: the near plants stand, and a pair of leaning giants is its gate), a glade between them.
  // Within 62 m of the route's line the plants are FEWER AND GREATER: of the near shapes a tenth (open reach) to
  // six tenths (grove) stand, of the bare and broken ones a third of that, of the middle shapes and the young
  // plants fewer still; each near shape that stands within 75 m is a quarter to four tenths greater (to 56 m) and
  // carries four pods and more. Behind them, to 140 m, the middle shapes that carry lit pods stand (the middle bank
  // of lantern light) and of the unlit ones under half: the stand closes there as the cards' simpler mass. Which
  // plant stands is by its own dealt number. No plant of the fuse belt, no giant and none on an islet is taken.
  const nearWay = (x, z, R) => { let m = Infinity, wy = -1; eachNear(x, z, R, (q) => { const d2 = hyp(q.x - x, q.z - z); if (d2 < m) { m = d2; wy = q.way; } }); return [m, wy]; };
  const reachPh = 0.5 + 0.5 * noise.n2(0.37, 9.1), groveAt = (wy) => 0.5 + 0.5 * Math.cos(6.2832 * (wy / 290 + reachPh + 0.2 * noise.n2(wy / 230 + 3.1, 7.7)));
  const order = { taken: 0, greater: 0, gates: 0, gatesAtWay: [] }, riverEnd = way.rideEnd + 30, stand = [];
  const orderOne = (p) => {
    if (p.giant || p.isle || p.P > 0) return true;
    const [dist, wy] = nearWay(p.x, p.z, 144); if (wy < 0 || wy >= riverEnd || dist >= 140) return true;
    const G = groveAt(wy), open = smoothstep(0.5, 0.2, G), grove = smoothstep(0.6, 0.85, G), h = fr(p.seed * 13.7 + 0.31), bare = p.pods === 0, lit = fr(p.seed * 9.7) < 0.24;
    const share = p.level === 0 ? (dist < 62 ? lerp(lerp(0.34, 0.6, grove), 0.1, open) * (bare ? 0.3 : 1) : lerp(0.62, 0.3, open) * (bare ? 0.5 : 1))
      : dist < 62 ? lerp(lerp(0.2, 0.4, grove), 0.06, open) : lit ? lerp(0.72, 0.5, open) : lerp(0.45, 0.3, open);   // (stage F: fewer lanterns in the far stand, 72 to 50 in a hundred for 92: amber points in a blue dusk, not an orange bank)
    if (h >= share) return false;
    if (p.level === 0 && !bare && dist < 75) {
      const H0 = p.H, r0 = p.r, H1 = Math.min(Math.max(H0, 56), H0 * (1.24 + 0.16 * fr(p.seed * 5.1)));
      p.H = H1; p.r = K.crown * (H1 / K.ref) + slack(H1) + 3.2;
      if (airPlant(p, AIR + 2) < AIR) { p.H = H0; p.r = r0; } else { p.pods = Math.max(p.pods, 4); order.greater++; }
    }
    return true;
  };
  for (let i = 0; i < plants.length; i++) { if (orderOne(plants[i])) stand.push(plants[i]); else order.taken++; if (i % 60 === 59) await pause(); }
  plants.length = 0; occ.clear(); for (const p of stand) keepP(p);
  // (the cards behind them, to 150 m from the route's line: three quarters stand, in an open reach four tenths: the far view)
  { let k = 0; for (let i = cards.length - 1; i >= 0; i--) { const c = cards[i]; if (c.P > 0) continue; const [dist, wy] = nearWay(c.x, c.z, 152); if (wy < 0 || wy >= riverEnd || dist >= 150) continue; if (fr(c.seed * 13.7 + 0.31) >= lerp(0.75, 0.4, smoothstep(0.5, 0.2, groveAt(wy)))) { cards.splice(i, 1); k++; } } order.cardsTaken = k; }
  // THE GATES: at each narrows of the level ride a PAIR OF LEANING GIANTS, one on either bank, each well back from
  // the water on dry ground (10 to 18 m) and leaning out over it toward the other: a gate to fly toward and pass
  // under, clear air kept by the same test as every plant's (dealt from a fork of its own, added at the list's end)
  const leanOut = (p, a) => { const E = plan.pe(p.x), N = plan.pn(p.z), w = plan.watAt(E, N), e = plan.watAt(E + 3, N) - w, n = plan.watAt(E, N + 3) - w, l = hyp(e, n) || 1; return [(-e / l) * a * plan.m, (n / l) * a]; };
  const fg = forks.gates;
  if (fg) for (let wy = Math.max(way.rideMouth - 30, 240); wy < way.rideEnd - 30; wy += 10) {
    const G = groveAt(wy); if (G < 0.9 || G < groveAt(wy - 10) || G <= groveAt(wy + 10)) continue;   // the narrows' middle
    for (const side of [1, -1]) {
      let got = null;
      // (tried 110 times within 30 m of the narrows' middle, then 110 times more a little wider: a bank's shape, a file's line or another plant may refuse a place)
      for (let t = 0; t < 220 && !got; t++) { const wide = t >= 110, [x, z] = sidePt(wy + fg.range(-30, 30) * (wide ? 1.7 : 1), side * fg.range(12, wide ? 92 : 70)), wt = watOf(x, z); if (wt >= (wide ? 8 : 10) && wt <= (wide ? 26 : 18)) got = dealAt(fg, x, z, 0, { giant: true, gate: true }); }
      await pause();
      if (!got) continue;
      const lx = got.lx, lz = got.lz;
      // (stage F: A GATE IS SEEN AS A GATE: each giant leans toward the route's line until its crown stands over it, so that
      // the two crowns and their pods meet overhead and the route flies under them; clear air by the plants' own test)
      { const [dl, wl] = nearWay(got.x, got.z, 144), c = sidePt(wl, 0), ux = (c[0] - got.x) / Math.max(dl, 1), uz = (c[1] - got.z) / Math.max(dl, 1); let leant = false; got.bow = 1;
        if (wl >= 0 && dl < 140) for (const k of [0.96, 0.8, 0.62]) { const a = Math.min((k * dl) / got.H, 0.85); got.lx = ux * a; got.lz = uz * a; if (airPlant(got, AIR + 2) >= AIR) { leant = true; order.gatesMeet = (order.gatesMeet || 0) + (k > 0.9 ? 1 : 0); break; } }
        if (!leant) { got.lx = lx; got.lz = lz; for (const a of [0.2, 0.13]) { [got.lx, got.lz] = leanOut(got, a); if (airPlant(got, AIR + 2) >= AIR) break; got.lx = lx; got.lz = lz; } }
        else got.pods = Math.max(got.pods, 6); }
      order.gates++; order.gatesAtWay.push(Math.round(wy));
    }
    await pause();
  }
  // (E5) THE TURN TOWARD THE CASTLE: thin drifts of mist on the lagoon's near water (the same drifts as lie on the
  // shallows, lit as they are), none within 30 m of the route's line, none within 70 m of the castle's rock
  if (fg) for (let t = 0, k = 0; t < 400 && k < Math.round(10 * detail); t++) {
    const [x, z] = sidePt(fg.range(way.turn2End - 30, way.shore + 120), fg.range(-110, 110)), E = plan.pe(x), N = plan.pn(z);
    if (plan.watAt(E, N) > -8 || plan.sdRock(E, N) < 70 || routeAt(x, z, 48)[0] < 30) continue;
    drifts.push({ x, y: plan.groundAt(x, z), z, H: fg.range(4, 7.5), W: fg.range(34, 64), seed: fg(), d: lineD(x, z) }); k++;
  }
  count.order = order;
  // RULE 25, THE FEET (the book guard's addendum A1): EVERY SWOLLEN FOOT STANDS WHOLE ABOVE ITS OWN GROUND, none in
  // water. A plant's bulb is as great as the dry ground round its foot allows (2 m kept to the water's edge all
  // round it): on a broad bank the whole bulb; nearer the water a lesser one; at the water's edge none (a plain
  // ribbed trunk: what stands by the water is a thin pole). p.foot: the bulb's share, 0..1 (the shader swells it).
  { const kd = deal.kind in RAD ? deal.kind : 'pods', t0 = kd === 'spires' ? 0.05 : 0.035; let less = 0;
    for (const p of plants) { const sc = (p.H / K.ref) * p.girth, rT = RAD[kd](t0) * sc, rB = (RAD[kd](t0) + FOOT_MAX[kd]) * sc * 1.05, mg = (p.isle ? plan.isletAt(plan.pe(p.x), plan.pn(p.z)) : p.wat) - 2; p.foot = rB > rT + 1e-6 ? clamp((mg - rT) / (rB - rT), 0, 1) : 1; if (p.foot < 1) less++; }
    count.lesserFeet = less; }
  // (rules 22 and 23, A4) how near a place lies to anything of the forest that ever burns: a plant's torch, a card
  // of the burning rank, a spot fire (metres to its flame's side); the animals' part asks it
  const burnCells = new Map(), burnAdd = (x, z, r) => { const k = ck(Math.floor(x / CELL), Math.floor(z / CELL)); let c = burnCells.get(k); if (!c) burnCells.set(k, (c = [])); c.push([x, z, r]); };
  for (const p of plants) if (p.P > 0) burnAdd(p.x, p.z, torchHalf(p.H));
  for (const c of cards) if (c.P > 0) burnAdd(c.x, c.z, 0.5 * c.W);
  for (const q of spots) burnAdd(q.x, q.z, 0.6 * q.H + 1);
  const burnNear = (x, z) => { let m = 160; const i = Math.floor(x / CELL), j = Math.floor(z / CELL); for (let a = i - 5; a <= i + 5; a++) for (let b = j - 5; b <= j + 5; b++) { const c = burnCells.get(ck(a, b)); if (c) for (const q of c) { const d2 = hyp(q[0] - x, q[1] - z) - q[2]; if (d2 < m) m = d2; } } return m; };
  { let least = 160; if (env.lanes && env.lanes.lanes) for (const l of env.lanes.lanes) for (const w of l.world) least = Math.min(least, burnNear(w[0], w[2])); count.filesToWhatBurns = +least.toFixed(1); }
  await pause();
  const nearRoute = (x, z, R) => !farFromRoute(x, z, R);
  // THE POD MAP: what the lit plants' pods lay on the ground and the water round their feet (the world's texture:
  // the land, the water's mirror and the ground's bodies read it). A plant's light reaches 8 m and a quarter of its height
  // from its foot; the same law of the lit plants as the shaders' (fuLit).
  if (env.podMap) { const acc = podLight(env.podMap, plants, plan); await pause(); podBytes(env.podMap, acc); }
  await pause();
  // RULE 19 TESTED: the least metres from the moat's edge to a plant of the fuse belt (its foot; and its torch's
  // and bursts' reach), to a card of the burning rank (its edge), to a spot fire (its flame); and how far from the
  // line the farthest plant that ever catches stands (the belt's own depth: the catching ends there at every clock)
  const moatLeast = (() => {
    const sd = (q) => plan.sdMoat(plan.pe(q.x), plan.pn(q.z)), r1 = (v) => (Number.isFinite(v) ? +v.toFixed(1) : 'none'), m = { fusePlantFoot: Infinity, torchAndBursts: Infinity, burningCard: Infinity, spotFire: Infinity }; let far = 0, farSet = 0;
    for (const p of plants) if (p.P > 0) { const s = sd(p); m.fusePlantFoot = Math.min(m.fusePlantFoot, s); m.torchAndBursts = Math.min(m.torchAndBursts, s - flameReach(p.H)); if (p.set) farSet = Math.max(farSet, p.d); else far = Math.max(far, p.d); }
    for (const c of cards) if (c.P > 0) m.burningCard = Math.min(m.burningCard, sd(c) - 0.5 * c.W);
    for (const q of spots) m.spotFire = Math.min(m.spotFire, sd(q) - 0.6 * q.H - 1);
    const least = Math.min(m.torchAndBursts, m.burningCard, m.spotFire);
    return { need: MOAT_OFF, ok: least >= MOAT_OFF, fusePlantFoot: r1(m.fusePlantFoot), torchAndBursts: r1(m.torchAndBursts), burningCard: r1(m.burningCard), spotFire: r1(m.spotFire), farthestCatchingFromLine: +far.toFixed(1), inTheSetPiece: +farSet.toFixed(1), belt: FUSE.belt, beltOfTheSetPiece: FUSE.deep };
  })();
  const F = { K, plants, cards, drifts, spots, count, moatLeast, burnNear, airOf, airPlant, nearRoute, fuseAt, heightK, x0, x1, tools: { airOf, routeAt, sidePt, beside, watOf, lowPts, bankPts, lastPts, flatA, flatB, laneNear } };
  const made = await makeForest(env, F); made.burnNear = burnNear;
  return made;
}

// ---------- THE SHAPES: a plant modelled at its kind's reference height, in parts ----------
// Every vertex carries the anchor of its part (aC: where a pod hangs, a plume's root, an arm's root on the trunk)
// and aK: the part's kind (0 trunk, 1 pod, 2 plume, 3 the cord pods are strung on, 4 arm), its number among its kind, how far
// along the part it is (0..1) and a co-ordinate round or across it (ribs, seams, a plume's breadth). A plant shows as
// many pods and plumes as it was dealt: the shader folds the rest away into their anchors.
// level 0: a near shape, 1: a middle shape, 2: a giant (modelled at the kind's "big" height, its crown 0.62 of the
// trunk's scale). Returns the pods' places too (where each hangs, how great, how high on the plant).
function plantGeo(kind, level, rng) {
  const K = KINDS[kind], giant = level === 2, near = level !== 1, H = giant ? K.big : K.ref, g = H / K.ref, gc = giant ? g * 0.62 : 1, gp = giant ? 1.5 : 1;
  const pos = [], nor = [], anc = [], ak = [], idx = [], podAt = [];
  const v = (p, n, c, k) => { pos.push(p[0], p[1], p[2]); const l = hyp3(n[0], n[1], n[2]) || 1; nor.push(n[0] / l, n[1] / l, n[2] / l); anc.push(c[0], c[1], c[2]); ak.push(k[0], k[1], k[2], k[3]); return pos.length / 3 - 1; };
  // the trunk's axis, a slow S of its own (0.03 of the height at the most), and its radius by height (the kind's law)
  const b1 = rng.range(-1, 1), b2 = rng.range(-1, 1), bp = rng.range(0, 6.28), A = 0.02 * H, rad = (t) => RAD[kind](t) * g;
  const axis = (y) => { const t = y / H; return [A * b1 * Math.sin(t * 3.1 + bp) * t, A * b2 * Math.sin(t * 2.3 + bp * 1.7) * t]; };
  const topY = kind === 'bottles' ? 0.86 * H : H;
  // THE TRUNK: ribbed; ITS FOOT IS OUR OWN (see FOOT): a swollen bulb or a tall onion, ribbed like the pods (every
  // other vertex of its rings stands a little in), sitting on the ground; no buttress, no flared root
  const sides = giant ? 14 : near ? 12 : 6;
  const ts = kind === 'bottles' ? (near ? [0, 0.0775, 0.155, 0.2325, 0.31, 0.3875, 0.465, 0.5425, 0.62, 0.74, 0.86] : [0, 0.0775, 0.155, 0.2325, 0.31, 0.3875, 0.465, 0.5425, 0.62, 0.86]).map((q) => q / 0.86)   // (a ring at every waist and every belly)
    : kind === 'spires' ? (giant ? [0, 0.025, 0.06, 0.1, 0.135, 0.16, 0.3, 0.4, 0.5, 0.6, 0.69, 0.77, 0.85, 0.93, 1] : near ? [0, 0.025, 0.06, 0.1, 0.135, 0.16, 0.3, 0.5, 0.75, 1] : [0, 0.05, 0.15, 0.5, 1])
    : giant ? [0, 0.02, 0.045, 0.08, 0.105, 0.125, 0.25, 0.38, 0.5, 0.6, 0.69, 0.77, 0.85, 0.93, 1]
    : (near ? [0, 0.02, 0.045, 0.08, 0.105, 0.125, 0.25, 0.45, 0.7, 1] : [0, 0.04, 0.115, 0.5, 1]);
  const radF = (t) => rad(t) + FOOT[kind](Math.max(t, 0)) * g;
  ts.forEach((tt) => {
    const y = topY * tt, t = y / H, [ax, az] = axis(y), bulb = kind === 'bottles' ? t < 0.63 : FOOT[kind](t) > 0.02, sl = clamp((radF(t + 0.004) - radF(Math.max(t - 0.004, 0))) / (H * (t < 0.004 ? 0.004 : 0.008)), -2.5, 2.5);
    for (let j = 0; j <= sides; j++) { const a = (j / sides) * 6.2832, r = radF(t) * (bulb && sides > 6 ? (j % 2 ? (kind === 'bottles' ? 0.89 : 0.93) : 1.05) : 1); v([ax + r * Math.cos(a), y - (tt === 0 ? 0.6 : 0), az + r * Math.sin(a)], [Math.cos(a), 0.1 - sl, Math.sin(a)], [ax, y, az], [0, (FOOT[kind](Math.max(t, 0)) * g) / Math.max(radF(t), 1e-3), t, j / sides]); }
  });
  for (let i = 0; i < ts.length - 1; i++) for (let j = 0; j < sides; j++) { const p = i * (sides + 1) + j, q = p + sides + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
  // a flat strip through centres (the fragment shader cuts a plume's outline out of it)
  const strip = (cs, half, kindN, n, anchor, up) => {
    const rows = cs.map((c, i) => {
      const a = cs[Math.max(0, i - 1)], b = cs[Math.min(cs.length - 1, i + 1)], tx = b[0] - a[0], tz = b[2] - a[2], tl = hyp(tx, tz) || 1, px = -tz / tl, pz = tx / tl, t = i / (cs.length - 1);
      return [v([c[0] - px * half, c[1], c[2] - pz * half], up, anchor, [kindN, n, t, -1]), v([c[0] + px * half, c[1], c[2] + pz * half], up, anchor, [kindN, n, t, 1])];
    });
    for (let i = 0; i < rows.length - 1; i++) idx.push(rows[i][0], rows[i][1], rows[i + 1][0], rows[i + 1][0], rows[i][1], rows[i + 1][1]);
  };
  // a tube through centres (an arm): four sides, tapering
  const tube = (cs, r0, r1, n, anchor) => {
    const ns = 4, b = pos.length / 3;
    cs.forEach((c, i) => {
      const a = cs[Math.max(0, i - 1)], q = cs[Math.min(cs.length - 1, i + 1)]; let d = [q[0] - a[0], q[1] - a[1], q[2] - a[2]]; const dl = hyp3(d[0], d[1], d[2]) || 1; d = [d[0] / dl, d[1] / dl, d[2] / dl];
      let u = [-d[2], 0, d[0]]; const ul = hyp3(u[0], u[1], u[2]) || 1; u = [u[0] / ul, 0, u[2] / ul]; const w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
      const t = i / (cs.length - 1), r = lerp(r0, r1, t);
      for (let j = 0; j < ns; j++) { const an = (j / ns) * 6.2832, ca = Math.cos(an), sa = Math.sin(an), nx = u[0] * ca + w[0] * sa, ny = u[1] * ca + w[1] * sa, nz = u[2] * ca + w[2] * sa; v([c[0] + nx * r, c[1] + ny * r, c[2] + nz * r], [nx, ny, nz], anchor, [4, n, t, j / ns]); }
    });
    for (let i = 0; i < cs.length - 1; i++) for (let j = 0; j < ns; j++) { const p = b + i * ns + j, q = b + i * ns + ((j + 1) % ns); idx.push(p, q, p + ns, q, q + ns, p + ns); }
  };
  // A PLUME OF THE CROWN (stage D, rule 25: never a round, flat or drooping radial head): a long dry feather that
  // stands UP from the trunk's end and a little out (spread: how far out at its tip, as a share of its length), of
  // its own length (torn: long and short side by side). The shader bends every plume DOWNWIND by its height (see
  // PLANT_VERT): the tuft is one torn brush that leans and streams one way with the air dealt, a flame's shape,
  // different on each plant; a skyline of them is a line of leaning brushes.
  const plume = (n, root, a, Lp, spread) => {
    const ca = Math.cos(a), sa = Math.sin(a), up = [ca, 0.25, sa], sp = Math.max(spread, 0.08) * Lp;
    const at = (h, vv) => [root[0] + ca * h * sp, root[1] + vv * Lp, root[2] + sa * h * sp];
    strip(near ? [root, at(0.42, 0.34), at(0.78, 0.68), at(1, 1)] : [root, at(0.6, 0.5), at(1, 1)], 0.1 * Lp + 0.45, 2, n, root, up);
  };
  // A POD: a great gourd, swollen and heavy at its far end, ribbed lengthwise (the seams are drawn by the shader).
  // top: where it hangs (its anchor: it swells and bursts about that point); dir: the way it hangs
  const gourd = (top, dir, len, rd, n) => {
    const ns = giant ? 10 : near ? 8 : 5, l = hyp3(dir[0], dir[1], dir[2]), d = [dir[0] / l, dir[1] / l, dir[2] / l];
    let u = [d[1], -d[0], 0]; const ul = hyp3(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];
    const w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    const at = (f) => [top[0] + d[0] * len * f, top[1] + d[1] * len * f, top[2] + d[2] * len * f];
    const prof = near ? [[0.14, 0.4], [0.47, 0.96], [0.8, 0.86]] : [[0.3, 0.7], [0.72, 1]], tipA = v(at(0), [-d[0], -d[1], -d[2]], top, [1, n, 0, 0.5]), rows = [];
    for (const [f, rr] of prof) {
      const o = at(f), row = [];
      for (let j = 0; j <= ns; j++) { const a = (j / ns) * 6.2832, ca = Math.cos(a), sa = Math.sin(a), nx = u[0] * ca + w[0] * sa, ny = u[1] * ca + w[1] * sa, nz = u[2] * ca + w[2] * sa, k = (f - 0.55) * 1.3; row.push(v([o[0] + nx * rd * rr, o[1] + ny * rd * rr, o[2] + nz * rd * rr], [nx + d[0] * k, ny + d[1] * k, nz + d[2] * k], top, [1, n, f, j / ns])); }
      rows.push(row);
    }
    const tipB = v(at(1), d, top, [1, n, 1, 0.5]), R = rows.length;
    for (let j = 0; j < ns; j++) { idx.push(tipA, rows[0][j + 1], rows[0][j]); idx.push(tipB, rows[R - 1][j], rows[R - 1][j + 1]); }
    for (let r = 0; r < R - 1; r++) for (let j = 0; j < ns; j++) idx.push(rows[r][j], rows[r][j + 1], rows[r + 1][j], rows[r + 1][j], rows[r][j + 1], rows[r + 1][j + 1]);
    const c = at(0.55); podAt.push({ n, x: c[0], y: c[1], z: c[2], r: rd, hp: clamp(top[1] / H, 0, 1.25) });
  };
  // AN ARM out from the trunk at height y, toward a; its end. STOUT (stage D): arms and pods carry in the plant's
  // outline against the sky and the fire (half a metre thick at the root on a common plant; on a middle shape an
  // upright blade of that depth, which is read from every side a look can come from)
  const arm = (n, y, a, out, rise) => {
    const [bx, bz] = axis(y), r = rad(y / H), ca = Math.cos(a), sa = Math.sin(a), root = [bx + ca * r * 0.5, y, bz + sa * r * 0.5], e = [bx + ca * out, y + rise, bz + sa * out], mid = [bx + ca * (r + 0.55 * (out - r)), y + rise * 0.92, bz + sa * (r + 0.55 * (out - r))];
    if (near) tube([root, mid, e], 0.5 * g, 0.27 * g, n, [bx, y, bz]);
    else {
      const h0 = 0.55 * g, h1 = 0.3 * g, c = [bx, y, bz], nn = [-sa, 0, ca];
      const b = v([root[0], root[1] - h0, root[2]], nn, c, [4, n, 0, 0.25]); v([root[0], root[1] + h0, root[2]], nn, c, [4, n, 0, 0.75]); v([e[0], e[1] + h1, e[2]], nn, c, [4, n, 1, 0.75]); v([e[0], e[1] - h1, e[2]], nn, c, [4, n, 1, 0.25]);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    return { e, ca, sa };
  };
  const nPods = giant ? 9 : near ? 6 : 3, order = giant ? [4, 1, 7, 2, 6, 0, 8, 3, 5] : near ? [3, 0, 5, 2, 4, 1] : [1, 2, 0], a0 = rng.range(0, 6.28), ends = [];
  if (kind === 'bottles') {
    // the one great head, upright on the body's neck (it goes off last: it is the highest); pods hung from short arms
    // AT SEVERAL HEIGHTS, from three tenths of the way up to the shoulders (stage E)
    const [ax, az] = axis(topY);
    gourd([ax, topY - 0.3, az], [0.05, 1, 0.03], 0.26 * H * (giant ? 0.7 : 1), 0.09 * H * (giant ? 0.7 : 1), 0);
    for (let i = 1; i < nPods; i++) {
      const f = (order[i] + 0.5) / nPods, y = H * (0.3 + 0.5 * f), a = a0 + order[i] * 2.4 + rng.range(-0.3, 0.3), rd = rng.range(0.9, 1.5) * gp;
      const q = arm(i, y, a, rad(y / H) + rng.range(2.2, 3.4) * gc, rng.range(0.5, 1.4) * gc); ends.push(q);
      gourd([q.e[0], q.e[1] - 0.1 * g, q.e[2]], [q.ca * 0.1, -1, q.sa * 0.1], 2.5 * rd, rd, i);
    }
    // (its plumes stand up round the great head's foot as a ruff and stream past it downwind)
    const np = giant ? 12 : near ? 9 : 5, p0 = rng.range(0, 6.28);
    for (let i = 0; i < np; i++) { const a = p0 + (i * 6.2832) / np + rng.range(-0.3, 0.3); plume(i, [ax + Math.cos(a) * 1.1 * g, topY - 0.5, az + Math.sin(a) * 1.1 * g], a, (i % 3 ? rng.range(5, 7.5) : rng.range(8, 9.5)) * gc, rng.range(0.3, 0.46)); }
  } else if (kind === 'spires') {
    // strings of pods: arms high on the spire, a thread hanging from each with its pods one under another
    const beads = near ? 2 : 1, nA = Math.ceil(nPods / beads);
    for (let s = 0; s < nA; s++) {
      const y = H * (0.9 - (0.44 * s) / nA), a = a0 + s * 2.2 + rng.range(-0.3, 0.3), q = arm(s, y, a, rng.range(3.2, 4.8) * gc, rng.range(0.4, 1.0) * gc), hang = rng.range(7, 10) * gc, e = q.e; ends.push(q);
      strip([e, [e[0] + q.ca * 0.2, e[1] - hang, e[2] + q.sa * 0.2]], 0.2 * g, 3, 0, e, [q.ca, 0.2, q.sa]);   // (a thick stiff cord, ribbed: it does not swing)
      for (let j = 0; j < beads && s * beads + j < nPods; j++) { const f = (j + 0.75) / (beads + 0.3), rd = rng.range(0.8, 1.3) * gp * (j ? 1.15 : 0.9); gourd([e[0] + q.ca * 0.2 * f, e[1] - hang * f + 1.25 * rd, e[2] + q.sa * 0.2 * f], [0.06 * q.ca, -1, 0.06 * q.sa], 2.5 * rd, rd, order.indexOf(s * beads + j)); }
    }
    const [ax, az] = axis(H), np = giant ? 9 : near ? 7 : 4, p0 = rng.range(0, 6.28);
    for (let i = 0; i < np; i++) { const a = p0 + (i * 6.2832) / np + rng.range(-0.3, 0.3); plume(i, [ax, H - 0.3, az], a, (i % 3 ? rng.range(4, 6) : rng.range(6.5, 7.6)) * gc, rng.range(0.08, 0.22)); }
  } else {
    // the pods hang as great gourds under stout arms that stand off the trunk AT SEVERAL HEIGHTS, from two fifths
    // of the way up to the crown's foot, the greatest lowest: arms and pods are the plant's outline
    for (let i = 0; i < nPods; i++) {
      const slot = order[i], f = (slot + 0.5) / nPods, y = H * (0.42 + 0.46 * f + rng.range(-0.015, 0.015)), a = a0 + slot * 2.4 + rng.range(-0.3, 0.3), rd = lerp(2.3, 1.35, f) * rng.range(0.88, 1.1) * (giant ? 1.25 : 1);
      const q = arm(i, y, a, lerp(5.6, 3.2, f) * gc * rng.range(0.88, 1.08), rng.range(0.8, 1.8) * gc); ends.push(q);
      gourd([q.e[0], q.e[1] - 0.15 * g, q.e[2]], [q.ca * 0.12, -1, q.sa * 0.12], 2.5 * rd, rd, i);
    }
    const [ax, az] = axis(H), np = giant ? 14 : near ? 11 : 6, p0 = rng.range(0, 6.28);
    for (let i = 0; i < np; i++) { const a = p0 + (i * 6.2832) / np + rng.range(-0.3, 0.3); plume(i, [ax, H - 0.3, az], a, (i % 3 ? rng.range(5.5, 8) : rng.range(8.5, 10)) * gc, rng.range(0.1, 0.28)); }
  }
  // (NO CREEPERS since stage D: hanging lines from the arms read as a jungle's lianas in outline. What hangs from an
  // arm is a pod, or on the spires the one thick stiff cord its pods are strung on.)
  const ge = new THREE.InstancedBufferGeometry();
  ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  ge.setAttribute('aC', new THREE.Float32BufferAttribute(anc, 3)); ge.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 4)); ge.setIndex(idx);
  return { geometry: ge, triangles: idx.length / 3, podAt, ref: H };
}

// ---------- the shaders ----------
// One law of state for every plant, card and torch (the GLSL twin of fuseState): f = (P, offset, delay, rise); a
// rise under 0 marks the set piece's ground (its own times of torch and black).
const hot3 = (c) => `vec3(${c[0].toFixed(3)}, ${c[1].toFixed(3)}, ${c[2].toFixed(3)})`;
const FUSE_GLSL = /* glsl */`
#define FIRE_PLANT 4.2
#define TORCH_HOT ${hot3(FUSE.hot)}
#define BURST_HOT ${hot3(FUSE.burst)}
#define AMBER vec3(1., .43, .07)
#define SEAM_MAX ${SEAM_MAX.toFixed(2)}
// A RIPE PLANT'S LANTERNS: of the plants at d metres from the line this share has its seams lit (a quarter of the
// far forest, all by the line: amber points, denser toward the fire; every giant is one of them); x: 1 if this plant
// (by its own dealt number) is one of them, y: how strongly its seams show
vec2 fuLit(float d, float seed){ float r = wRipe(d), lit = step(fract(seed*9.7), .24 + .76*r); return vec2(lit, mix(.06, .55 + .45*r, lit)); }

// the phase of a plant in its clump's cycle (s; under 0: ripe and waiting), by the world clock alone
float fuPhase(vec4 f){ return f.x > 0. ? fract((uFcrT + f.y)/f.x)*f.x - f.z : -1.; }
// the ends of its torch, its sinking, its black snag and its growing back (s of phase)
vec4 fuEnds(vec4 f, float seed){
  float st = step(f.w, 0.);
  float t2 = abs(f.w) + mix(${FUSE.torch[0].toFixed(1)} + ${(FUSE.torch[1] - FUSE.torch[0]).toFixed(1)}*fract(seed*13.7), ${FUSE.torchSet[0].toFixed(1)} + ${(FUSE.torchSet[1] - FUSE.torchSet[0]).toFixed(1)}*fract(seed*13.7), st), t3 = t2 + ${FUSE.sink.toFixed(1)};
  float t4 = t3 + mix(${FUSE.black[0].toFixed(1)} + ${(FUSE.black[1] - FUSE.black[0]).toFixed(1)}*fract(seed*29.3), ${FUSE.blackSet[0].toFixed(1)} + ${(FUSE.blackSet[1] - FUSE.blackSet[0]).toFixed(1)}*fract(seed*29.3), st);
  return vec4(t2, t3, t4, t4 + clamp(f.x - ${FUSE.before.toFixed(1)}, ${FUSE.growLeast.toFixed(1)}, ${FUSE.grow.toFixed(1)}));
}
// NO PALE SKIN: what the fire's light gives a plant's skin beyond a deep orange is taken back (by the value alone,
// the same at every look), so that a trunk beside the line is dark with an orange side and never cream or white
vec3 fuDeep(vec3 c){ return c/(1. + 1.2*max(c.r - .22, 0.)); }
// the wind at a place: the air is drawn toward the line and goes with the visit's wind (uWind); x metres of play at a crown's tip
vec3 fuWind(vec3 foot, vec4 Lf, float d, float seed){
  vec2 wd = normalize(normalize(Lf.xz + vec2(1e-4, -1e-4))*uWind.w + uWind.xy);
  float amp = mix(1.2, .3, smoothstep(100., 1300., d))*uWind.z;
  float own = sin(uFcrT*(.9 + .5*fract(seed*7.1)) + seed*40.);
  float gust = smoothstep(.55, 1., sin(dot(foot.xz, vec2(.011, .019)) + uFcrT*.78 + 2.*sin(uFcrT*.11)));   // through the crowns every 6 to 10 s
  return vec3(wd, amp*(.45 + .25*own + .55*gust));
}
`;
// A plant. With MIRROR defined the same plant is drawn doubled in the water's face (turned over about the water's
// level, shown only where the eye's ray meets water, by the mirror's share at that angle: optics).
const PLANT_VERT = /* glsl */`
attribute vec3 aC; attribute vec4 aK, iA, iB, iC, iD;
// iA: foot x, y, z, turn (and 8 times the bulb's share in sevenths: stage E). iB: scale, girth (under 0 in the mirror: a giant), lean x, lean z. iC: pods, plumes, seed, d (m from the line). iD: P, offset, delay, rise
uniform vec4 uShape;             // x reference height (m), y share of the dealt pods this shape shows, z of the plumes, w 1 on a near shape
varying vec3 vW, vN; varying vec4 vK, vS, vL, vF; varying vec3 vA;
void main(){
  float kind = aK.x, refH = uShape.x, d = iC.w, seed = iC.z, s = iB.x, rise = abs(iD.w);
  float ripe = wRipe(d);
  float ph = fuPhase(iD); vec4 e = fuEnds(iD, seed);
  float act = step(0., ph)*(1. - step(e.w, ph));
  bool part = kind > .5 && kind < 2.5;                                      // a pod or a plume: it folds about its anchor
  float hp = clamp((part ? aC.y : position.y)/max(refH, 1e-3), 0., 1.25);              // how high on the plant this part sits
  float tc = hp*rise;                                                       // the fire's edge reaches it then
  float back = clamp((ph - e.z)/max(e.w - e.z, 1e-3), 0., 1.);                       // pods and plumes come back at one rate
  // a pod swells a little as the fire comes up to it and is gone in half a second (its burst is a card of the torches' mesh)
  float gPod = mix(1., ph < e.z ? (1. + .2*smoothstep(tc - .5, tc + .1, ph))*(1. - smoothstep(tc + .12, tc + .55, ph)) : back, act);
  float gPlu = mix(1., ph < e.z ? 1. - smoothstep(tc, tc + 1.4, ph) : back, act);
  float warm = act*smoothstep(tc - 1.6, tc - .1, ph)*(1. - step(e.z, ph));  // its seams brighten to orange before it goes
  float chr = act*smoothstep(tc, tc + 1.2, ph)*(1. - back*back);
  float glow = act*smoothstep(tc, tc + 1., ph)*(1. - smoothstep(e.y, e.z - 2., ph));
  vec3 p = position, n = normal, c = aC;
  float turnQ = floor(iA.w/8. + .001), bowK = step(7.5, turnQ); turnQ -= 8.*bowK;      // (stage F2: a gate's giant is marked: it bows)
  float footK = turnQ/7., turnA = iA.w - 64.*bowK - 8.*turnQ;
#ifdef MIRROR
  if (iB.y < 0. && kind > .5) { p.xz *= .66; c.xz *= .66; }               // (a giant's crown is narrower for its height)
#endif
  if (part) {
    float cnt = kind < 1.5 ? max(iC.x*uShape.y, min(iC.x, 1.)) : iC.y*uShape.z, show = step(aK.y + .5, cnt);
    float sw = kind < 1.5 ? mix(.72, 1., ripe)*gPod : gPlu;
    p = c + (p - c)*(show*sw);
    // (stage F2) on a bowed giant a pod that stands up from its anchor is turned over about it: every pod HANGS
    if (bowK > .5 && kind < 1.5 && p.y > c.y) { p.xy = 2.*c.xy - p.xy; n.xy = -n.xy; }
  } else if (kind < .5) p.xz = c.xz + (p.xz - c.xz)*(abs(iB.y)*(1. - aK.y*(1. - footK)));   // (the trunk; its bulb as great as its dry ground allows)
  else if (kind < 3.5) p = c + (p - c)*step(.5, iC.x);                    // the cords the pods are strung on: gone with the pods
  else p = c + (p - c)*step(.5, iC.x);                                    // an arm: a bare plant has lost its arms with its pods
  float ca = cos(turnA), sa = sin(turnA);
  p.xz = vec2(ca*p.x - sa*p.z, sa*p.x + ca*p.z); n.xz = vec2(ca*n.x - sa*n.z, sa*n.x + ca*n.z);
  p *= s;
  float hy = p.y, hr = clamp(hy/max(refH*s, 1e-3), 0., 1.25);
  vec3 foot = iA.xyz; vec4 Lf = fcrLight(foot); vec3 w = fuWind(foot, Lf, d, seed);
  // THE DEALT LEAN; and (stage F2) THE BOW OF A GATE'S GIANT: its foot, bulb and first third stand upright, then the
  // mast bows over toward the route's line in one long curve, more and more toward the crown (the crown where the
  // straight lean had it); a pod or a plume moves whole with its anchor, so the pods hang plumb, unsheared
  float hb = part ? c.y*s : hy, tb = max(clamp(hb/max(refH*s, 1e-3), 0., 1.25) - .3333, 0.)*1.5, tb1 = min(tb, 1.), bL = length(iB.zw), bD = min(.5*bL, .24);
  float bowDrop = refH*s*bD*(tb1*tb1*tb1)*bowK;                             // (and its crown comes down as it bows: the cube)
  if (bowK > .5 && kind < .5) {                                            // the mast's rings stand square to the curve: a round mast to its crown, never a flat band
    vec2 bu = iB.zw/max(bL, 1e-3), cR = vec2(ca*c.x - sa*c.z, sa*c.x + ca*c.z)*s, tg = normalize(vec2(3.*bL*tb, 1. - 4.5*bD*tb1*tb1)); float ru = dot(p.xz - cR, bu), nu = dot(n.xz, bu);
    p.xz -= bu*(ru*(1. - tg.y)); bowDrop += ru*tg.x; n.xz -= bu*(nu*(1. - tg.y)); n.y -= nu*tg.x; }
  p.xz += iB.zw*mix(hy, refH*s*(tb*tb), bowK) + w.xy*(w.z*hr*hr + .012*hy);    // (and the wind's lean and play toward the fire)
  // THE CROWN STREAMS ONE WAY: every plume is bent downwind by its height over its root (0.42 to 0.76 of that
  // height at its tip, by the plant's own number, and a little more in a gust), and sinks a little as it bends: a
  // torn brush leaning with the air dealt and the fire's draught at this place, never a round or drooping head
  if (kind > 1.5 && kind < 2.5) { float upP = max(p.y - c.y*s, 0.), ln = (.42 + .34*fract(seed*3.3) + .12*w.z)*aK.z; p.xz += w.xy*(upP*ln); p.y -= upP*(.2*ln*ln);
    // (stage F2) the brush of a bowed giant streams on past the crown and DOWN, the way the mast bows
    p.xz += iB.zw*(upP*.8*min(2., 1./max(bL, .05))*bowK); p.y -= upP*(1.3*min(2.*bL, 1.)*bowK); }
  p.y -= bowDrop;
  vec3 wp = foot + p, wa = wp;
#ifdef MIRROR
  float up = max(wp.y - W_LEVEL, 0.);
  wp.xz += vec2(sin(up*.55 + uFcrT*1.3 + wp.x*.3), cos(up*.47 + uFcrT*1.1 + wp.z*.3))*(.35*min(up*.06, 1.));   // the water's face is never still
  wp.y = 2.*W_LEVEL - wp.y;
#endif
  vW = wp; vN = n; vK = vec4(kind, aK.w, aK.z, hr); vL = Lf;
  float breath = 1. + ${0.15.toFixed(2)}*sin(uFcrT*6.2832/(5. + 4.*fract(seed*5.3)) + seed*50.);   // seams breathe by 15 per cent over 5 to 9 s
  float amb = fuLit(d, seed).y*(1. - chr);
  vS = vec4(warm, chr, amb*(.75 + .25*fract(seed*3.7))*breath, glow);
  // x: how open this plant stands to the fire (a bank's plant sees the wall down the river; inside the forest the
  // ranks before it shade its foot); y: right before the line a plant is a dark body with a rim (its lit side is
  // held back); z: how much amber its own pods lay on it
  float wat = (wPlanMap(wPlan(foot)).g - .5)*160.;
  vA = vec3((1. - smoothstep(8., 46., wat)), mix(.3, 1., smoothstep(25., 140., d)), amb*min(iC.x, 6.)/6.);
  // the air between: mist, haze, the low air's glow; and before the line the smoke of a nearer lobe (the part's veil)
  vec4 air = wAir(wa, Lf, 0.);
#ifndef MIRROR
  if (d < 330.) { vec4 vl = fcrSmokeVeil(cameraPosition, wa); air = vec4(vl.rgb*(1. - air.a) + air.rgb, 1. - (1. - vl.a)*(1. - air.a)); }
#endif
  vF = air;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const PLANT_FRAG = /* glsl */`
uniform vec4 uShape;
varying vec3 vW, vN; varying vec4 vK, vS, vL, vF; varying vec3 vA;
void main(){
  float kind = vK.x;
  vec3 n = normalize(vN);
  vec3 V = vW - cameraPosition; vec3 rd = V/max(length(V), 1e-3);
#ifdef MIRROR
  vec3 hp; float wat = wFace(cameraPosition, rd, hp);                      // where the eye's ray meets the water's level
  if (wat > -.2) discard;
  float cover = wDouble(hp, rd, wat);
  rd.y = -rd.y;                                                            // the look as the water turns it
  if (dot(n, rd) > 0.) n = -n;
#else
  if (!gl_FrontFacing) n = -n;
#endif
  vec3 alb; float seam = 0., thin = 0., pod = 0.;
  float g1 = fcrN3(vW*vec3(.9, .22, .9));
  if (kind > 1.5 && kind < 2.5) {
    // a plume: a long dry feather cut out of its strip (its barbs on a near shape)
    float t = clamp(vK.z, 0., 1.), a = abs(vK.y), wd = sin(3.1416*pow(t, .6))*.9 + .1;
    float barb = .62 + .38*step(.4, fract(t*23. + a*2.3));
    if (a > wd*mix(1., barb, uShape.w)) discard;
    alb = vec3(.076, .065, .058)*(.55 + .45*(1. - a))*(.75 + .25*t); thin = 1.;   // dark and dry, darker along its quill
  } else if (kind > .5 && kind < 1.5) {
    // a pod: a gourd of sixteen ribs; in each groove between two ribs a seam, a thin line of amber with the skin beside it lit from within
    float gv = vK.y*16., q = abs(fract(gv) - .5), fq = fwidth(gv);
    vec3 tg = normalize(cross(vec3(0., 1., 0.), n) + vec3(1e-4, 0., 0.));
    n = normalize(n + tg*((fract(gv + .5) - .5)*1.1*(1. - smoothstep(.2, .8, fq))));   // each rib rounded
    float groove = 1. - smoothstep(.0, .5, abs(fract(gv + .5) - .5)*2.);
    seam = mix((1. - smoothstep(.02, .055 + fq, .5 - q))*min(1., .075/max(fq, 1e-3)) + .18*(1. - smoothstep(0., .26, .5 - q)), .21, smoothstep(.25, .7, fq))*smoothstep(.03, .2, vK.z)*(1. - smoothstep(.86, 1., vK.z));
    seam *= smoothstep(.1, .45, abs(dot(n, rd)));                            // (a seam is seen on the skin that faces the eye, never as an outline: optics)
    alb = vec3(.088, .040, .030)*(.6 + .5*vK.z)*(1. - .45*groove); pod = 1.;
  } else if (kind > 2.5 && kind < 3.5) {
    float t = vK.z, a = abs(vK.y);
    if (a > .8) discard;                                                     // a cord: thick, stiff, ribbed across
    alb = vec3(.050, .042, .036)*(.7 + .3*step(.5, fract(t*11.)));  thin = .4;
  } else {
    // the trunk and its arms: ribbed bark, deep umber going to violet-brown, darker in the grooves and at the foot
    float rib = abs(fract(vK.y*(kind > 3.5 ? 2. : 7.) + .12*sin(vK.z*31.)) - .5)*2., fq = fwidth(vK.y*7.);
    alb = mix(vec3(.098, .062, .048), vec3(.082, .056, .074), smoothstep(.3, .7, g1))*mix(mix(.45, 1., smoothstep(.05, .6, rib)), .78, smoothstep(.3, .9, fq));
    alb *= .7 + .3*smoothstep(0., .12, vK.z) + .25*smoothstep(.5, .9, fcrN3(vW*vec3(2.3, .6, 2.3)));
  }
  alb = mix(alb, vec3(.012, .010, .010), vS.y);                              // charred: black
  float crown = mix(mix(.42, 1., smoothstep(.15, .8, vK.w)), 1., vA.x);     // the fire's light comes through the ranks: less of it low down; a bank's plant stands open to it
  float wE = wFar(vL.w);
  vec3 light = wLitF(n, vL, .10, FIRE_PLANT*crown*vA.y);
  // THE FIRE'S SIDE AND THE NIGHT'S (optics for the rims): a bright orange rim on the side toward the fire and on
  // what stands between the eye and the fire; the night's blue as a sheen on the side away from it
  vec2 fdir = normalize(vL.xz + vec2(1e-5, 1e-5));
  float fres = pow(1. - clamp(abs(dot(n, rd)), 0., 1.), 2.6);
  float toward = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), fdir), 0.), facing = clamp(dot(n.xz, fdir)*.5 + .5, 0., 1.);
  light *= 1. - .62*thin;                                                   // (a plume is a dry dark feather: it takes less of every light than the bark; from above the crowns are a dark wood, never a pale one)
  vec3 col = alb*light + uFire*(wE*crown*(.05 + 1.3*alb.r)*(fres*(1.5*facing + 1.1*toward)*(1. - .6*thin)*(1. - .8*pod) + .22*thin*toward));   // (a pod takes no rim: an outline round a dark oval reads as a ring hanging in the air)
  // the night's side is deep blue, never black: the sky's light as a sheen on what faces away from the fire
  col += uAmbSky*((.21*fres + .042)*(1. - facing)*(1. - .5*pod)*(1. - .7*thin)) + alb*uDuskCol*(.5*thin*max(dot(n, uDuskDir), 0.));
  // THE PODS' LIGHT LIES ON THE PLANT: on the trunk from the arms up, on the arms, on the plumes of the crown over
  // them (most on what faces down toward the pods), and on each pod's own dark body between its seams
  col += AMBER*alb*(3.2*vA.z*(1. - pod)*smoothstep(.2, .44, vK.w)*(1. - smoothstep(.96, 1.38, vK.w))*mix(.62 - .38*n.y, .4, thin));
  col += AMBER*(.075*vS.z*pod*(.35 + .65*abs(dot(n, rd))));                 // (the skin between the seams glows a little, least at the limb: a body, lit from within)
  col = fuDeep(col);
  // the seams: amber (the only glow a plant has); as the fire comes up to it they brighten to orange
  vec3 glw = mix(AMBER*min(1.05*vS.z*seam, SEAM_MAX), BURST_HOT*(.9*seam), vS.x*pod);
  // charred and burning: glowing cracks in the black, small, deep orange (never the flame's pale colours)
  float crack = smoothstep(.74, .86, fcrN3(vec3(vW.xz*1.4, vW.y*.8 + 3.)))*(.55 + .45*fcrN3(vec3(vW.xz*.4, vW.y*.3 - uFcrT*.6)));
  glw += BURST_HOT*(.8*vS.w*crack*(1. - .7*thin));
#ifdef MIRROR
  // (stage F: an image in water is DARKER AND SOFTER than its source, never paler: the body at four tenths, the air's
  // light between left out of it, its cover eased; the lanterns' and the cracks' glow stay as paths at seven tenths)
  col = (col*.4 + glw*.7)*(1. - vF.a) + vF.rgb*.2; cover *= .82;
  gl_FragColor = vec4(col*cover, cover);
#else
  col = (col + glw)*(1. - vF.a) + vF.rgb;
  gl_FragColor = vec4(col, 1.);
#endif
}`;
// A torch (the part's own flame form round a plant, never brighter than TORCH_HOT), a clump's own low smoke, the
// thin steam on the shallows, or a pod's burst: one card each, turned about the upright to face the eye (optics);
// its state is its plant's. With MIRROR defined the flames and bursts are drawn doubled in the water's face.
const TORCH_VERT = /* glsl */`
attribute vec2 aQ; attribute vec4 tA, tB, tC;     // tA: foot x, y, z, height. tB: P, offset, delay, rise. tC: seed, kind (0 torch, 1 a clump's smoke, 2 steam, 3 a pod's burst, 4 a spot fire), breadth (m), d
varying vec2 vQ; varying vec4 vT; varying vec3 vW, vM; varying vec2 vA;
void main(){
  float seed = tC.x, H = tA.w, ph = fuPhase(tB); vec4 e = fuEnds(tB, seed);
  float on, hh, ww, y0 = 0.;
  if (tC.y < .5) {
    float up = clamp(ph/max(abs(tB.w), 1e-3), 0., 1.), sink = smoothstep(e.x, e.y, ph);
    on = step(0., ph)*(1. - step(e.y, ph));
    hh = 2.7*H*mix(.22 + .78*up, .55, sink); ww = max(.62*H, 9.)*(.6 + .4*up);   // the card: its flame takes the lower half (one and a third times the plant), its own smoke the rest
    vT = vec4(up, sink, seed, 0.);
  } else if (tC.y < 1.5) {
    on = step(e.x - 2., ph)*(1. - step(e.w, ph));                           // from the sinking to the end of the growing back
    hh = H; ww = tC.z; vT = vec4(smoothstep(e.x - 2., e.y + 3., ph)*(1. - smoothstep(e.w - 10., e.w, ph)), 0., seed, 1.);
  } else if (tC.y < 2.5) { on = 1.; hh = H; ww = tC.z; vT = vec4(1., 0., seed, 2.); }   // the thin steam and low smoke that lie on the drowned shallows: always there
  else if (tC.y < 3.5) {
    // a pod's burst: tB.z is the moment the fire's edge reaches this pod; sparks for 1.6 s, a puff of dark smoke that rises and thins over 3.2 s
    float age = ph/3.2; on = step(0., ph)*(1. - step(3.2, ph));
    ww = 2.*H*(2.2 + 2.6*sqrt(clamp(age, 0., 1.))); hh = ww; y0 = -.5*hh + 2.2*H*age*age + 1.5*H*age;
    vT = vec4(age, 0., seed, 3.);
  } else {
    // a spot fire on an islet of the shallows: a small flame that stands there, higher and lower by turns over 20 to 30 s
    on = 1.; hh = 2.*H; ww = 1.2*H + 2.; vT = vec4(.6 + .3*sin(uFcrT*(.21 + .1*seed) + seed*40.), 0., seed, 0.);
  }
  vec3 c = tA.xyz; vec3 ey = cameraPosition - c; vec2 r = normalize(vec2(ey.z, -ey.x) + vec2(1e-5, 0.));
  vec4 Lf = fcrLight(c); vec3 w = fuWind(c, Lf, tC.w, seed);
  vec3 wp = c + vec3(r.x, 0., r.y)*(aQ.x*ww*.5) + vec3(0., y0 + aQ.y*hh, 0.);
  wp.xz += w.xy*(tC.y < .5 || tC.y > 3.5 ? .1*hh*aQ.y*aQ.y : tC.y < 1.5 ? 16.*aQ.y*aQ.y : tC.y < 2.5 ? 7.*aQ.y*aQ.y : 5.*vT.x);    // it leans with the fire's wind
#ifdef MIRROR
  if (tC.y > .5 && tC.y < 2.5) on = 0.;
  wp.y = 2.*W_LEVEL - wp.y;
#endif
  vQ = aQ; vW = wp; vM = vec3(aQ.x*ww*.5, aQ.y*hh, hh);
  vec3 V = wp - cameraPosition; float dist = length(V);
  vA = vec2(wFogAt(dist), Lf.w);
  gl_Position = on > .5 ? projectionMatrix*viewMatrix*vec4(wp, 1.) : vec4(0., 0., 2., 1.);
}`;
const TORCH_FRAG = /* glsl */`
varying vec2 vQ; varying vec4 vT; varying vec3 vW, vM; varying vec2 vA;
void main(){
  vec2 q = vQ; float seed = vT.z, a; vec3 col; vec4 o;
  if (vT.w < .5) {
    // a torch: one form of the part's own flame (its gift), slender, its hearts small and low; cut off at TORCH_HOT:
    // never pale yellow, never white. The plant's black trunk stands in it (the trunk is nearer the eye than the card)
    vec4 c = fcrFlame(q, vM.xy, max(vM.z, 1.), seed, .5 + .5*fract(seed*7.3), .42*clamp(vT.x*(1. - .6*vT.y), 0., 1.))*(1. - .92*vT.y);
    c.rgb = min(c.rgb, TORCH_HOT*c.a);
    o = vec4(mix(c.rgb, uHazeCol*c.a, vA.x), c.a);
  } else if (vT.w > 2.5) {
    // a pod's burst: a spray of deep orange sparks flung out and falling, and a puff of dark smoke
    vec2 p = vec2(q.x, q.y*2. - 1.); float age = vT.x, r = length(p), an = atan(p.y, p.x);
    float k = floor(an*(23./6.2832)), h1 = fract(sin(k*91.7 + seed*311.)*4375.5), h2 = fract(h1*37.3);
    float t = clamp(age*2., 0., 1.), rs = (.25 + .7*h1)*(1. - (1. - t)*(1. - t))*.8;
    float da = abs(fract(an*(23./6.2832)) - .5 - (h2 - .5)*.5);
    float spark = (1. - smoothstep(.0, .16, da))*(1. - smoothstep(.0, .07, abs(r - rs)))*step(h2, .8)*(1. - t)*(1. - t);
    float core = (1. - smoothstep(0., .34, r))*(1. - smoothstep(0., .22, age));
    float n1 = fcrN3(vec3(vW.x*.35, vW.y*.35 - uFcrT*.4, vW.z*.35 + seed*9.));
    float puff = clamp((1. - smoothstep(.25, .95, r))*(.45 + n1) - .35, 0., 1.)*smoothstep(0., .12, age)*(1. - smoothstep(.45, 1., age))*.75;
    float f = clamp(spark*1.4 + core, 0., 1.);
    col = vec3(.028, .022, .021)*puff*(1. - f) + mix(BURST_HOT*.55, BURST_HOT, clamp(core + spark, 0., 1.))*f; a = max(puff, f);
    o = vec4(mix(col, uHazeCol*a, vA.x), a);
  } else {
    if (vT.w > 1.5) {
      float n1 = fcrN3(vec3(vW.x*.03 + uFcrT*.03, vW.y*.11 - uFcrT*.05, vW.z*.03)), n2 = fcrN3(vec3(vW.x*.09 + 5., vW.y*.3 - uFcrT*.12, vW.z*.09));
      float env = (1. - smoothstep(.25, 1., abs(q.x)))*(1. - smoothstep(.2, 1., q.y))*smoothstep(0., .14, q.y);
      a = clamp(env*(n1*1.5 + n2*.6 - .6), 0., 1.)*.36;
      col = vec3(.050, .047, .050) + uFire*(.2*vA.y*(1. - .5*q.y));
    } else {
      float n1 = fcrN3(vec3(vW.x*.045 + uFcrT*.02, vW.y*.07 - uFcrT*.11, vW.z*.045)), n2 = fcrN3(vec3(vW.x*.13, vW.y*.2 - uFcrT*.2, vW.z*.13 + 7.));
      float env = (1. - smoothstep(.3, 1., abs(q.x)))*(1. - smoothstep(.45, 1., q.y))*smoothstep(0., .1, q.y);
      a = clamp(env*(n1*1.4 + n2*.5 - .5), 0., 1.)*.62*vT.x;
      col = vec3(.034, .028, .026) + uFire*(.11*vA.y*(1. - q.y));
    }
    col = mix(col, uHazeCol, vA.x); o = vec4(col*a, a);
  }
#ifdef MIRROR
  vec3 rd = normalize(vW - cameraPosition), hp; float wat = wFace(cameraPosition, rd, hp);
  if (wat > -.2) discard;
  o *= wDouble(hp, rd, wat);
#endif
  gl_FragColor = o;
}`;

// ---------- the far clumps: crossed cut-out cards of two to four plants, and what they are cut from ----------
// The atlas: six side views and two views from above, drawn once per visit from the kind's own figures. THE OUTLINE
// IS THE WHOLE PLANTS' (stage D, rule 25): a bulb foot, stout arms at several heights with their pods, and the
// crown's feathers standing up in a sheaf; the card's shader bends the sheaves downwind by their height, each leaf
// by the wind's share along it, so that the cards on the skyline are leaning brushes too. From above a crown is a
// brush streaming one way from its trunk's end (the leaf lying at crown height is turned to the wind by the shader).
// r what it is (trunk 1, plume 0.76, pod 0.53), g which way a form turns (left edge dark, right edge bright), b seams.
function drawAtlas(kind, rng) {
  const K = KINDS[kind], T = 256, cv = document.createElement('canvas'); cv.width = T * 8; cv.height = T;
  const g = cv.getContext('2d', { willReadFrequently: true }), TW = 36, TH = K.h[1] * CARD_TOP, col = (r, gg, b) => `rgb(${Math.round(r * 255)},${Math.round(gg * 255)},${Math.round(b * 255)})`;
  const turn = (x0, x1, r) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, col(r, 0.14, 0)); gr.addColorStop(0.5, col(r, 0.5, 0)); gr.addColorStop(1, col(r, 0.86, 0)); return gr; };
  // a great gourd hanging from (hx, hy): heavy at its lower end, with five of its seams
  const gourd = (hx, hy, len, rd, upright) => {
    g.save(); g.translate(hx, hy); if (upright) g.scale(1, -1); g.fillStyle = turn(-rd, rd, 0.53);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(rd * 0.7, -0.2 * len, rd * 1.3, -0.95 * len, 0, -len); g.bezierCurveTo(-rd * 1.3, -0.95 * len, -rd * 0.7, -0.2 * len, 0, 0); g.fill();
    g.strokeStyle = col(0.45, 0.5, 1); g.lineWidth = 0.15;
    for (const o of [-0.8, -0.4, 0, 0.4, 0.8]) { g.beginPath(); g.moveTo(0, -0.05 * len); g.quadraticCurveTo(o * rd * 1.95, -0.62 * len, 0, -0.97 * len); g.stroke(); }
    g.restore();
  };
  // the crown's tuft: n feathers standing up from the trunk's end in a narrow sheaf, long and short side by side
  // (base: half the breadth they are rooted across)
  const tuft = (x, y, n, Lp, base) => {
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n - 0.5, L = Lp * (k % 3 ? rng.range(0.6, 0.85) : rng.range(0.9, 1.05)), x0 = x + f * 2 * base, sp = f * 0.55 * L;
      g.fillStyle = col(0.76, f > 0 ? 0.68 : 0.32, 0); g.beginPath(); g.moveTo(x0 - 0.3, y);
      g.quadraticCurveTo(x0 + 0.55 * sp - 1.0, y + 0.45 * L, x0 + sp, y + L); g.quadraticCurveTo(x0 + 0.55 * sp + 1.0, y + 0.45 * L, x0 + 0.3, y); g.fill();
    }
  };
  const armTo = (x0, y0, x1, y1, w) => { g.strokeStyle = col(1, 0.5, 0); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(0.5 * (x0 + x1), y1, x1, y1); g.stroke(); };
  for (let t = 0; t < 6; t++) {
    g.setTransform(T / TW, 0, 0, -T / TH, t * T, T);
    const n = 2 + Math.floor(rng() * 3), xs = []; for (let i = 0; i < n; i++) xs.push(7 + (22 * (i + 0.2 + 0.6 * rng())) / n);
    const tall = Math.floor(rng() * n);
    xs.forEach((x, i) => {
      // (the plants of one card are of one clump and nearly of one height: the shader bends what stands over their trunks' ends)
      const H = K.h[1] * (i === tall ? 1 : rng.range(0.8, 0.96)), s = H / K.ref, lean = rng.range(-0.04, 0.04) * H, top = kind === 'bottles' ? 0.86 * H : H, bare = rng() < 0.1;
      const rr = (tt) => (RAD[kind](tt) + FOOT[kind](tt)) * s, ax = (y) => x + lean * (y / H) * (y / H);
      g.fillStyle = turn(x - rr(0.3) - 0.4, x + rr(0.3) + 0.4, 1); g.beginPath(); g.moveTo(ax(0) - rr(0), 0);
      for (let k = 1; k <= 40; k++) { const y = (top * k * k) / 1600; g.lineTo(ax(y) - rr(y / H), y); }
      for (let k = 40; k >= 0; k--) { const y = (top * k * k) / 1600; g.lineTo(ax(y) + rr(y / H), y); }
      g.closePath(); g.fill();
      if (bare) return;
      if (kind === 'bottles') {
        gourd(ax(top), top - 0.3, 0.26 * H, 0.09 * H, true);
        for (let k = 0; k < 3; k++) { const y = H * (0.62 + 0.07 * k), dir = k % 2 ? 1 : -1, ex = ax(y) + dir * (rr(y / H) + rng.range(2.2, 3.4) * s), rd = rng.range(0.9, 1.5) * s; armTo(ax(y), y, ex, y + 0.9 * s, 0.9 * s); gourd(ex, y + 0.9 * s, 2.5 * rd, rd, false); }
        tuft(ax(top), top - 0.5, 7, 9 * s, 2.2 * s);
      } else if (kind === 'spires') {
        for (let k = 0; k < 3; k++) {
          const y = H * (0.9 - 0.14 * k), dir = k % 2 ? 1 : -1, ex = ax(y) + dir * rng.range(3.2, 4.8) * s, hang = rng.range(7, 10) * s;
          armTo(ax(y), y, ex, y + 0.7 * s, 0.8 * s); g.strokeStyle = col(1, 0.5, 0); g.lineWidth = 0.4 * s; g.beginPath(); g.moveTo(ex, y + 0.7 * s); g.lineTo(ex, y - hang); g.stroke();
          for (let j = 0; j < 2; j++) { const rd = rng.range(0.8, 1.3) * s * (j ? 1.15 : 0.9); gourd(ex, y - hang * ((j + 0.75) / 2.3) + 1.25 * rd, 2.5 * rd, rd, false); }
        }
        tuft(ax(H), H - 0.3, 6, 7.2 * s, 0.3 * s);
      } else {
        const np = 2 + Math.floor(rng() * 4);
        for (let k = 0; k < np; k++) { const f = (k + 0.5) / np, y = H * (0.42 + 0.46 * f), dir = k % 2 ? 1 : -1, ex = ax(y) + dir * lerp(5.6, 3.2, f) * s * rng.range(0.85, 1.05), rd = lerp(2.3, 1.35, f) * s * rng.range(0.88, 1.1); armTo(ax(y), y, ex, y + 1.2 * s, 0.95 * s); gourd(ex, y + 1.2 * s, 2.5 * rd, rd, false); }
        tuft(ax(H), H - 0.3, 9, 9.6 * s, 0.4 * s);
      }
    });
  }
  for (let t = 6; t < 8; t++) {                         // from above: each crown a brush streaming one way (+x: downwind) from its trunk's end; arms and gourds round the trunk
    g.setTransform(T / TW, 0, 0, -T / TW, t * T, T);
    const n = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + rng(), cx = 18 + Math.cos(a) * rng.range(5, 9), cy = 18 + Math.sin(a) * rng.range(5, 9), R = rng.range(5.5, 8.2);
      for (let k = 0; k < 9; k++) { const b = ((k + 0.5) / 9 - 0.5) * 1.3 + rng.range(-0.08, 0.08), Rk = R * (k % 3 ? rng.range(0.55, 0.8) : rng.range(0.9, 1.05)), x1 = cx + Math.cos(b) * Rk, y1 = cy + Math.sin(b) * Rk; g.strokeStyle = col(0.76, 0.5 + 0.36 * Math.sin(b), 0); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x1, y1); g.stroke(); }
      for (let k = 0; k < 4; k++) { const b = rng() * 6.2832, rr = rng.range(3, 5), px = cx + Math.cos(b) * rr, py = cy + Math.sin(b) * rr, pr = rng.range(1.1, 1.9); g.strokeStyle = col(1, 0.5, 0); g.lineWidth = 0.9; g.beginPath(); g.moveTo(cx, cy); g.lineTo(px, py); g.stroke(); g.fillStyle = col(0.53, 0.5, 0); g.beginPath(); g.arc(px, py, pr, 0, 6.2832); g.fill(); g.strokeStyle = col(0.45, 0.5, 1); g.lineWidth = 0.16; for (let q = 0; q < 4; q++) { const c = (q / 4) * 3.1416; g.beginPath(); g.moveTo(px - Math.cos(c) * pr, py - Math.sin(c) * pr); g.lineTo(px + Math.cos(c) * pr, py + Math.sin(c) * pr); g.stroke(); } }
      g.fillStyle = col(1, 0.5, 0); g.beginPath(); g.arc(cx, cy, 0.9, 0, 6.2832); g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}
const CARD_VERT = /* glsl */`
attribute vec2 aUv; attribute vec3 aT; attribute vec4 cA, cB, cC, cD;   // cA: foot x, y, z, turn. cB: breadth, height, variant, seed. cC: d. cD: P, offset, delay, rise
varying vec2 vUv; varying vec3 vW, vN, vTn; varying vec4 vS, vL, vF; varying vec3 vA; varying float vLn;
void main(){
  float seed = cB.w, d = cC.x, top = aT.z, rise = abs(cD.w);
  float ph = fuPhase(cD); vec4 e = fuEnds(cD, seed);
  float act = step(0., ph)*(1. - step(e.w, ph)), back = clamp((ph - e.z)/max(e.w - e.z, 1e-3), 0., 1.);
  float ca = cos(cA.w), sa = sin(cA.w);
  vec3 p = position; p.xz = vec2(ca*p.x - sa*p.z, sa*p.x + ca*p.z);
  vec2 tn = vec2(ca*aT.x - sa*aT.y, sa*aT.x + ca*aT.y);                    // the card's own breadth, in the world
  p.xz *= cB.x; p.y *= cB.y*${CARD_TOP.toFixed(2)};
  vec4 Lf = fcrLight(cA.xyz); vec3 w = fuWind(cA.xyz, Lf, d, seed);
  p.xz += w.xy*(w.z*position.y*position.y + .012*p.y);
  vec3 wp = cA.xyz + p;
  vW = wp; vTn = vec3(tn.x, 0., tn.y); vN = top > .5 ? vec3(0., 1., 0.) : vec3(-tn.y, 0., tn.x); vL = Lf;
  // THE CROWNS STREAM ONE WAY on the cards too: the wind at this place, in the card's own frame; an upright leaf's
  // crowns are bent along the leaf by the wind's share along it (0.155 of the plants' height at the tufts' tips,
  // by the card's own number); the lying leaf's picture is turned so that its brushes stream downwind
  vec2 wl = vec2(ca*w.x + sa*w.y, -sa*w.x + ca*w.y);
  if (top > .5) { vUv = vec2(dot(aUv - .5, wl), dot(aUv - .5, vec2(-wl.y, wl.x))) + .5; vLn = 0.; }
  else { vUv = aUv; vLn = dot(aT.xy, wl)*(.155*cB.y/max(cB.x, 1e-3))*(.7 + .5*fract(seed*3.3)); }
  float ripeS = fuLit(d, seed).y;                                           // (the same law as the whole plants': amber points, denser toward the fire)
  // x: the fire edge's height (over 1: all of it alight), y: charred, z: pods and plumes grown back, w: ripeness
  vS = vec4(act*(1. - step(e.y, ph))*(ph/max(rise, .1))*1.2, act*smoothstep(0., rise + 1.5, ph)*(1. - back*back), mix(1., ph < e.z ? 1. - smoothstep(rise, rise + 3., ph) : back, act), ripeS);
  vA = vec3(top > .5 ? 6. + mod(cB.z, 2.) : cB.z, mix(.3, 1., smoothstep(25., 140., d)), top);   // (x: which picture of the atlas)
  vec4 air = wAir(wp, Lf, 0.);
  if (d < 330.) { vec4 vl = fcrSmokeVeil(cameraPosition, wp); air = vec4(vl.rgb*(1. - air.a) + air.rgb, 1. - (1. - vl.a)*(1. - air.a)); }
  vF = air;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const CARD_FRAG = /* glsl */`
uniform sampler2D uAtlas;
varying vec2 vUv; varying vec3 vW, vN, vTn; varying vec4 vS, vL, vF; varying vec3 vA; varying float vLn;
void main(){
  // what stands over the trunks' ends (the upper 0.44 of a leaf) is bent along the leaf, more toward the top
  float bend = clamp((vUv.y - .56)/.44, 0., 1.), ul = vUv.x - vLn*bend*bend;
  if (ul < 0. || ul > 1. || vUv.y < 0. || vUv.y > 1.) discard;
  vec4 t = texture2D(uAtlas, vec2((floor(vA.x + .5) + .02 + .96*ul)/8., vUv.y));
  if (t.a < .4) discard;
  float trunk = smoothstep(.82, .95, t.r), hsh = fcrN3(vec3(vW.xz*1.7, vW.y*1.7));
  if (trunk < .5 && hsh > vS.z*1.02) discard;                                // pods and plumes gone with the fire, and back by degrees
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  vec3 tn = normalize(vTn); if (!gl_FrontFacing) tn = -tn;
  n = normalize(n + tn*((t.g - .5)*1.7)*(1. - vA.z));
  vec3 V = vW - cameraPosition; vec3 rd = V/max(length(V), 1e-3);
  vec3 alb = mix(vec3(.088, .040, .030), mix(vec3(.070, .056, .046), vec3(.092, .060, .054), trunk), smoothstep(.5, .7, t.r));
  alb = mix(alb, vec3(.012, .010, .010), vS.y);
  float crown = mix(mix(.5, 1., smoothstep(.15, .8, vUv.y)), 1., vA.z);
  vec3 light = wLitF(n, vL, .10, FIRE_PLANT*crown*vA.y)*mix(.5, 1., trunk)*(1. - .3*vA.z);   // (plumes and pods take less of every light than the bark; the crowns from above are a dark wood)
  float edge = 1. - smoothstep(.4, .8, t.a), wE = wFar(vL.w);                                 // a cut-out's rim (optics): orange toward the fire
  vec2 fdir = normalize(vL.xz + vec2(1e-5, 1e-5));
  float toward = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), fdir), 0.), facing = clamp(dot(n.xz, fdir)*.5 + .5, 0., 1.);
  vec3 col = alb*light + uFire*(wE*crown*(.05 + 1.3*alb.r)*(edge*(.9*facing + 1.1*toward) + .3*(1. - trunk)*toward)) + uAmbSky*(.03 + .05*edge)*(1. - facing);
  col += AMBER*alb*(1.3*vS.w*(1. - vS.y)*smoothstep(.3, .6, vUv.y));          // the pods' amber on the trunks and crowns round them
  col = fuDeep(col);
  col += AMBER*min(.7*vS.w*t.b*(1. - vS.y), SEAM_MAX);                      // the seams' amber
  float fl = fcrN3(vec3(vW.xz*.5, vW.y*.4 - uFcrT*2.));
  float lit = step(vUv.y, vS.x)*step(.001, vS.x);
  col = mix(col, min(fcrRamp(clamp(.25 + .5*fl, 0., 1.)), BURST_HOT), lit*smoothstep(.2, .5, fl + .3)*(1. - .75*trunk));   // alight far off: deep orange, its trunk black in it
  col = col*(1. - vF.a) + vF.rgb;
  gl_FragColor = vec4(col, 1.);
}`;
// the canopy to the horizon: one dark sheet at crown height with the relief of its clumps, cut ragged where plants stand singly
const CARPET_VERT = /* glsl */`
varying vec3 vW;
void main(){ vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`;
const CARPET_FRAG = /* glsl */`
varying vec3 vW;
vec2 ch22(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
// the forest's large forms: clumps whose hearts stand taller, 50 to 110 m across, and the giants' heads over them
float clumpH(vec2 p){ return fcrN3(vec3(p/96., 7.)) + .55*fcrN3(vec3(p/41. + 40., 3.)); }
void main(){
  vec3 wp = vW; float d0 = wp.z - fcrFront(wp.x);
  if (d0 < 3.) discard;
  vec4 pm = wPlanMap(wPlan(wp));
  float ragged = fcrN3(vec3(wp.xz/27., 3.)) - .5;
  if (pm.a < .5 + .45*ragged) discard;
  vec3 V = wp - cameraPosition; float dist = length(V); vec3 rd = V/max(dist, 1e-3);
  float px = max(length(dFdx(wp.xz)), length(dFdy(wp.xz)));
  // far off the forest opens here and there: glades, and old channels as thin wandering lines (the dark land shows)
  float farK = smoothstep(.985, 1., pm.a)*smoothstep(260., 420., d0);
  float open = fcrN3(vec3(wp.xz/210., 19.)), ride = abs(fcrN3(vec3(wp.xz/640. + 5., 23.)) - .5);
  if (farK > .5 && (open < .2 + .05*ragged || ride < .0055)) discard;
  vec2 q = wp.xz/15., iq = floor(q), fq = fract(q); float md = 9., mh = 0.; vec2 mr = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), o = ch22(iq + g), r = g + .15 + .7*o - fq; float dd = dot(r, r); if (dd < md) { md = dd; mr = r; mh = o.x; } }
  float lod = (1. - smoothstep(1.4, 4.5, px)), heart = (1. - smoothstep(0., .7, md));
  if (px < 2. && md > .5 + .25*mh) discard;                                  // the gaps between crowns, where they can be seen
  vec4 Lf = fcrLight(wp);
  vec2 wd = normalize(Lf.xz + vec2(1e-4, -1e-4));
  float along = dot(wp.xz, wd), across = dot(wp.xz, vec2(-wd.y, wd.x));
  float grain = fcrN3(vec3(across*.55, along*.09, mh*9.));                    // the plumes' grain, all streaming one way
  float ripe = wRipe(d0), wE = wFar(Lf.w);
  // CALM LARGE FORMS: each clump of crowns is a dome with a side toward the light and a side in shade; a giant's head here and there
  float c0 = clumpH(wp.xz); vec2 gC = vec2(clumpH(wp.xz + vec2(5., 0.)) - c0, clumpH(wp.xz + vec2(0., 5.)) - c0)*(1./5.);
  float giant = step(.93, mh)*heart;
  vec3 alb = mix(vec3(.050, .030, .027), vec3(.082, .068, .054), .2 + .5*smoothstep(.45, .75, grain)*lod)*mix(.6 + .55*smoothstep(.5, 1.1, c0), .45 + .55*heart, lod*.7);
  vec3 n = normalize(vec3(-gC.x*24. - mr.x*(1.2 + 1.5*giant)*lod, 1., -gC.y*24. - mr.y*(1.2 + 1.5*giant)*lod));
  float toward = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), wd), 0.);
  float lightP = .6 + .8*fcrN3(vec3(wp.xz/330., uFcrT*.01 + 5.));              // the fire's light falls in broad patches (the smoke's shade between)
  float rake = clamp(dot(n, Lf.xyz)/max(Lf.y, .05), 0., 3.);                  // slopes toward the fire take its low light
  vec3 light = mix(uAmbGnd, uAmbSky, .5 + .5*n.y) + uDuskCol*max(dot(n, uDuskDir), 0.)*1.6 + uFire*(FIRE_PLANT*.5*wE*lightP*(rake + .5*toward));
  vec3 col = alb*light;
  float sp = step(1. - .06 - .16*ripe, ch22(iq*1.7 + floor(fq*2.)).y)*lod*(1. - smoothstep(.3, .75, md));
  col += AMBER*((.3 + .7*ripe)*mix(.014, .5*sp, lod));                       // the seams: amber points in the dark wood, denser toward the front; a faint warmth far off
  // thin mist lying in the hollows between the clumps (it takes the dusk's cool and a little of the fire). STAGE F, rule 16: it
  // is there by place at one strength; what is seen of it is what a pixel's footprint leaves of the hollows (a filter by
  // the footprint's root, never by the lens's distance: where a pixel holds a clump whole the hollow's mist is under the crowns)
  float mist = (1. - smoothstep(.35, .8, c0))*smoothstep(3.2, 12., sqrt(max(px, 0.)))*(.35 + .65*fcrN3(vec3(wp.xz/480., 31.)));
  col = mix(col, uHor*1.1 + uFire*(.05*Lf.w), .55*mist);
  vec4 air = wAir(wp, Lf, 0.); col = col*(1. - air.a) + air.rgb;
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- the forest made: five instanced shapes and their doubles in the water, the torches, the cards, the canopy ----------
// of the dealt pods and plumes, how many a near shape, a middle shape and a giant show
const SHARES = { pods: [[1, 1], [0.5, 6 / 11], [1, 1]], bottles: [[1, 9 / 11], [0.5, 5 / 11], [1, 12 / 13]], spires: [[1, 7 / 11], [0.5, 4 / 11], [1, 9 / 13]] };
// what is drawn doubled in the water's face is drawn straight after the land, against the land's depth alone: only
// what lies beyond the water's face along the eye's ray (its double), and there only where that face is water
const mirrorMat = (o) => new THREE.ShaderMaterial({ ...o, defines: { MIRROR: 1 }, side: THREE.DoubleSide, transparent: false, depthWrite: false, depthFunc: THREE.GreaterDepth,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
async function makeForest(env, F) {
  const { L, plan, U, forks, deal, pause, glsl } = env, { K, plants, cards, drifts, spots, count, moatLeast, airOf, airPlant, heightK } = F;
  const group = new THREE.Group(); group.name = 'forest';
  const head = glsl.front + glsl.noise + glsl.ramp + glsl.mirror + glsl.world + glsl.air + FUSE_GLSL, headM = head + glsl.water;
  const tri = { near: 0, giants: 0, middle: 0, doubled: 0, cards: 0, carpet: 0, torches: 0 }; let calls = 0;
  const inst = (g, name, arr) => g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));

  // the five shapes (two near, a giant, two middle), each plant to one of them by its own dealt number
  const shapes = [plantGeo(deal.kind, 0, forks.near), plantGeo(deal.kind, 0, forks.near), plantGeo(deal.kind, 2, forks.near), plantGeo(deal.kind, 1, forks.mid), plantGeo(deal.kind, 1, forks.mid)];
  const byShape = [[], [], [], [], []], shapeOf = (p) => (p.giant ? 2 : p.level === 0 ? (fr(p.seed * 7.7) < 0.5 ? 0 : 1) : 3 + Math.floor(fr(p.seed * 5.3) * 2));
  for (const p of plants) { p.shape = shapeOf(p); byShape[p.shape].push(p); }
  await pause();
  const fill = (list, ref, mirror) => {
    const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4), iD = new Float32Array(n * 4);
    list.forEach((p, i) => { iA.set([p.x, p.y, p.z, p.turn + 8 * Math.round((p.foot === undefined ? 1 : p.foot) * 7) + (p.bow ? 64 : 0)], i * 4); iB.set([p.H / ref, mirror && p.giant ? -p.girth : p.girth, p.lx, p.lz], i * 4); iC.set([p.pods, p.plumes, p.seed, p.d], i * 4); iD.set([p.P, p.off, p.delay, p.set ? -p.rise : p.rise], i * 4); });
    return { iA, iB, iC, iD };
  };
  shapes.forEach((sh, k) => {
    const list = byShape[k], n = list.length; if (!n) return;
    const a = fill(list, sh.ref, false), g = sh.geometry; inst(g, 'iA', a.iA); inst(g, 'iB', a.iB); inst(g, 'iC', a.iC); inst(g, 'iD', a.iD); g.instanceCount = n;
    const sp = SHARES[deal.kind][k < 2 ? 0 : k === 2 ? 2 : 1];
    const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uShape: { value: new THREE.Vector4(sh.ref, sp[0], sp[1], k < 3 ? 1 : 0) } }, vertexShader: head + PLANT_VERT, fragmentShader: head + PLANT_FRAG });
    const m = new THREE.Mesh(g, mat); m.name = 'plants-' + k; m.frustumCulled = false; group.add(m);
    tri[k < 2 ? 'near' : k === 2 ? 'giants' : 'middle'] += sh.triangles * n; calls++;
  });
  await pause();
  // THE PLANTS DOUBLED IN THE WATER: every plant that stands within 22 m of a water and 200 m of the route's line,
  // drawn once more as a middle shape, turned over about the water's level
  const doubled = plants.filter((p) => !p.young && p.wat < 22 && F.nearRoute(p.x, p.z, 200)).sort((p, q) => p.wat - q.wat).slice(0, 92);   // (those nearest the water first; 160 until stage D: the water's face breaks every double into strokes, and the animals took the triangles)
  if (doubled.length) {
    const src = shapes[3].geometry, g = new THREE.InstancedBufferGeometry(), a = fill(doubled, K.ref, true);
    for (const k of ['position', 'normal', 'aC', 'aK']) g.setAttribute(k, src.getAttribute(k)); g.setIndex(src.getIndex());
    inst(g, 'iA', a.iA); inst(g, 'iB', a.iB); inst(g, 'iC', a.iC); inst(g, 'iD', a.iD); g.instanceCount = doubled.length;
    const sp = SHARES[deal.kind][1];
    const m = new THREE.Mesh(g, mirrorMat({ uniforms: { ...U, uShape: { value: new THREE.Vector4(K.ref, sp[0], sp[1], 0) } }, vertexShader: headM + PLANT_VERT, fragmentShader: headM + PLANT_FRAG }));
    m.name = 'plants-doubled'; m.frustumCulled = false; m.renderOrder = -9; group.add(m);
    tri.doubled = shapes[3].triangles * doubled.length; calls++;
  }
  await pause();

  // the torches (one card to a fuse-belt plant), each clump's own low smoke, the shallows' steam, and the pods' bursts
  const fuse = plants.filter((p) => p.P > 0 && !p.young), clumps = new Map(), bursts = [];
  for (const p of fuse) { let c = clumps.get(p.clump); if (!c) clumps.set(p.clump, (c = { n: 0, x: 0, y: 0, z: 0, d: 0, P: p.P, off: p.off, delay: Infinity, led: p.led, set: p.set })); c.n++; c.x += p.x; c.y += p.y; c.z += p.z; c.d += p.d; c.delay = Math.min(c.delay, p.delay); }
  for (const p of fuse) {
    if (p.level !== 0 && !p.set) continue;                                   // (a pod's burst is drawn for the near shapes and all through the set piece's belt)
    const sh = shapes[p.shape], s = p.H / sh.ref, ca = Math.cos(p.turn), sa = Math.sin(p.turn), shown = Math.max(p.pods * SHARES[deal.kind][p.shape < 2 ? 0 : p.shape === 2 ? 2 : 1][0], Math.min(p.pods, 1));
    for (const q of sh.podAt) { if (q.n + 0.5 > shown) continue; const hy = q.y * s; const lo = p.bow ? p.H * bowF(q.hp) : hy; bursts.push({ x: p.x + (ca * q.x - sa * q.z) * s + p.lx * lo, y: p.y + (p.bow ? (hy > q.hp * p.H ? 2 * q.hp * p.H - hy : hy) - bowDrop(p, q.hp * p.H) : hy), z: p.z + (sa * q.x + ca * q.z) * s + p.lz * lo, r: q.r * s, P: p.P, off: p.off, delay: p.delay + q.hp * p.rise, rise: p.set ? -p.rise : p.rise, seed: fr(p.seed * 31.7 + q.n * 0.37), d: p.d }); }
  }
  const nT = fuse.length + clumps.size + drifts.length + bursts.length + spots.length;
  if (nT) {
    const tA = new Float32Array(nT * 4), tB = new Float32Array(nT * 4), tC = new Float32Array(nT * 4);
    fuse.forEach((p, i) => { tA.set([p.x, p.y, p.z, p.H], i * 4); tB.set([p.P, p.off, p.delay, p.set ? -p.rise : p.rise], i * 4); tC.set([p.seed, 0, 0, p.d], i * 4); });
    let i = fuse.length;
    for (const [c, q] of clumps) { tA.set([q.x / q.n, q.y / q.n, q.z / q.n, 30], i * 4); tB.set([q.P, q.off, q.delay, q.set ? -1.7 : 1.7], i * 4); tC.set([hash(c * 5.1), 1, q.set ? 44 : 58, q.d / q.n], i * 4); i++; }
    for (const q of drifts) { tA.set([q.x, q.y, q.z, q.H], i * 4); tB.set([0, 0, 0, 1], i * 4); tC.set([q.seed, 2, q.W, q.d], i * 4); i++; }
    for (const q of bursts) { tA.set([q.x, q.y, q.z, q.r], i * 4); tB.set([q.P, q.off, q.delay, q.rise], i * 4); tC.set([q.seed, 3, 0, q.d], i * 4); i++; }
    for (const q of spots) { tA.set([q.x, q.y, q.z, q.H], i * 4); tB.set([0, 0, 0, 1], i * 4); tC.set([q.seed, 4, 0, q.d], i * 4); i++; }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, 0, 1, 0, 1, 1, -1, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    inst(g, 'tA', tA); inst(g, 'tB', tB); inst(g, 'tC', tC); g.instanceCount = nT;
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, uniforms: U, vertexShader: head + TORCH_VERT, fragmentShader: head + env.hero.glsl.flame + TORCH_FRAG });
    const m = new THREE.Mesh(g, mat); m.name = 'torches'; m.frustumCulled = false; m.renderOrder = 4.5; group.add(m);
    const m2 = new THREE.Mesh(g, mirrorMat({ uniforms: U, vertexShader: headM + TORCH_VERT, fragmentShader: headM + env.hero.glsl.flame + TORCH_FRAG }));
    m2.name = 'torches-doubled'; m2.frustumCulled = false; m2.renderOrder = -8.5; group.add(m2);
    tri.torches = nT * 4; calls += 2;
  }
  await pause();

  // the cards: three upright leaves crossed and one lying at crown height
  if (cards.length) {
    const cp = [], cu = [], ct = [], ci = [];
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a), b = cp.length / 3;
      cp.push(-0.5 * c, 0, -0.5 * s, 0.5 * c, 0, 0.5 * s, 0.5 * c, 1, 0.5 * s, -0.5 * c, 1, -0.5 * s); cu.push(0, 0, 1, 0, 1, 1, 0, 1); for (let q = 0; q < 4; q++) ct.push(c, s, 0); ci.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    cp.push(-0.45, 0.72, -0.45, 0.45, 0.72, -0.45, 0.45, 0.72, 0.45, -0.45, 0.72, 0.45); cu.push(0, 0, 1, 0, 1, 1, 0, 1); for (let q = 0; q < 4; q++) ct.push(1, 0, 1); ci.push(12, 13, 14, 12, 14, 15);
    const n = cards.length, cA = new Float32Array(n * 4), cB = new Float32Array(n * 4), cC = new Float32Array(n * 4), cD = new Float32Array(n * 4);
    cards.forEach((c, i) => { cA.set([c.x, c.y, c.z, c.turn], i * 4); cB.set([c.W, c.H, c.variant, c.seed], i * 4); cC.set([c.d, 0, 0, 0], i * 4); cD.set([c.P, c.off, c.delay, (c.set ? -1 : 1) * (c.rise || 1.7)], i * 4); });
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(cu, 2)); g.setAttribute('aT', new THREE.Float32BufferAttribute(ct, 3)); g.setIndex(ci);
    inst(g, 'cA', cA); inst(g, 'cB', cB); inst(g, 'cC', cC); inst(g, 'cD', cD); g.instanceCount = n;
    const atlas = drawAtlas(deal.kind, forks.atlas);
    const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...U, uAtlas: { value: atlas } }, vertexShader: head + CARD_VERT, fragmentShader: head + CARD_FRAG });
    const m = new THREE.Mesh(g, mat); m.name = 'plant-cards'; m.frustumCulled = false; group.add(m);
    tri.cards = n * 8; calls++;
  }
  await pause();

  // the canopy: a sheet at crown height by place, sinking toward the waters
  const meanH = lerp(K.h[0], K.h[1], 0.55);
  {
    const lines = (a, b, step, lo, hi) => { const out = []; for (let v = a; v <= b + 1e-6; v += step) out.push(v); let s = step, v = out[0]; while (v > lo) { s *= 1.3; v -= s; out.unshift(Math.max(v, lo)); } s = step; v = out[out.length - 1]; while (v < hi) { s *= 1.3; v += s; out.push(Math.min(v, hi)); } return out; };
    const lineN = plan.oz - L.zLo + 20, cE = lines(-900, 1900, 52, -15000, 15000), cN = lines(-500, Math.min(2100, lineN - 60), 52, -9000, lineN);
    const nE = cE.length, nN = cN.length, pos = new Float32Array(nE * nN * 3), idx = new Uint32Array((nE - 1) * (nN - 1) * 6), mean = meanH * 0.86;
    for (let j = 0; j < nN; j++) {
      for (let i = 0; i < nE; i++) {
        const E = cE[i], N = cN[j], x = plan.wx(E), z = plan.wz(N), o = (j * nE + i) * 3, inMap = E > -800 && E < 1700 && N > -400 && N < 2100;
        const edge = inMap ? smoothstep(0, 60, plan.watBase(E, N) - 3) : 1, n2 = env.ctx.noise.n2, swell = 0.8 + 0.2 * n2(x / 190 + 3, z / 190 - 8) + 0.2 * n2(x / 83 - 11, z / 83 + 5) + 0.55 * smoothstep(0.5, 0.8, n2(x / 61 + 40, z / 61 + 9));   // clumps taller and lower, and here and there the giants' heads over them: no level skyline
        pos[o] = x; pos[o + 1] = plan.relief(x, z) + mean * swell * heightK(Math.max(z - L.frontZ(x), 0)) * (0.1 + 0.9 * edge); pos[o + 2] = z;
      }
      if (j % 12 === 11) await pause();
    }
    for (let j = 0, k = 0; j < nN - 1; j++) for (let i = 0; i < nE - 1; i++) { const p = j * nE + i, q = p + nE; idx[k++] = p; idx[k++] = q; idx[k++] = p + 1; idx[k++] = p + 1; idx[k++] = q; idx[k++] = q + 1; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: U, vertexShader: CARPET_VERT, fragmentShader: head + CARPET_FRAG });
    const m = new THREE.Mesh(g, mat); m.name = 'canopy'; m.frustumCulled = false; group.add(m);
    tri.carpet = idx.length / 3; calls++;
  }
  await pause();

  // ---------- the law's check: shares of the fuse belt's plants and clumps at five clocks ----------
  const states = ['ripe', 'catching', 'torch', 'sinking', 'black', 'growing'], clumpList = [...clumps].map(([c, q]) => ({ P: q.P, off: q.off, delay: 0, rise: 1.7, seed: hash(c * 5.1), set: q.set }));
  const shareOf = (list, c) => { const s = Object.fromEntries(states.map((k) => [k, 0])); for (const p of list) s[fuseState(p, c)]++; return Object.fromEntries(states.map((k) => [k, +(s[k] / Math.max(1, list.length)).toFixed(3)])); };
  const shares = {}; for (const c of [0, 17, 43, 500, 5000]) shares[c] = { clumps: shareOf(clumpList, c), plants: shareOf(fuse, c) };
  let rate = 0; for (const q of clumpList) rate += 1 / q.P;
  const setFuse = fuse.filter((p) => p.set), setShares = {}; for (const c of [0, 17, 43, 500, 5000]) setShares[c] = shareOf(setFuse, c);
  const info = { kind: deal.kind, bowedThatBurn: plants.filter((p) => p.bow && p.P > 0).length, count: { ...count, plants: plants.length, doubled: doubled.length, cards: cards.length, torches: fuse.length, bursts: bursts.length, clumps: clumps.size, clumpsLedByBursts: [...clumps.values()].filter((q) => q.led >= 0).length, setPiecePlants: setFuse.length, setPieceClumps: [...clumps.values()].filter((q) => q.set).length, drifts: drifts.length, spotFires: spots.length },
    tri, shapes: shapes.map((s) => s.triangles), moatLeast, setShares, aClumpBeginsEvery: rate > 0 ? +(1 / rate).toFixed(2) : 0, shares, torchBrightest: FUSE.hot, burstBrightest: FUSE.burst };

  // ---------- CLEAR AIR: the route against every plant's whole reach (lean, arms, crown, sway), every torch and every burst ----------
  const clearAir = async (pts, need) => {
    const out = [], least = async (list, fn) => { let m = Infinity, k = 0; for (const p of list) { const a = fn(p); if (a < m) m = a; if (++k % 120 === 0) await pause(); } return m; };
    const body = (p) => airPlant(p, 48);
    for (const [kind, list, fn] of [
      ['fire-plants, giants', plants.filter((p) => p.giant), body], ['fire-plants, near shapes', plants.filter((p) => p.level === 0 && !p.giant), body], ['fire-plants, middle shapes', plants.filter((p) => p.level === 1 && !p.young), body],
      ['young plants', plants.filter((p) => p.young), body], ['plant cards', cards, (c) => airOf(c.x, c.z, c.y, c.y + c.H * CARD_TOP, 0.5 * c.W + 1.6)],
      ['torches (a flame one and a third times the plant)', fuse, (p) => airOf(p.x, p.z, p.y, p.y + 1.35 * p.H, Math.max(0.31 * p.H, 4.5) + 0.07 * p.H)],
      ["pods' bursts (sparks and smoke)", bursts, (q) => airOf(q.x, q.z, q.y - 5 * q.r, q.y + 9 * q.r, 5 * q.r + 5)],
      ['spot fires on the islets', spots, (q) => airOf(q.x, q.z, q.y, q.y + 2 * q.H, 0.6 * q.H + 1)]]) {
      const m = await least(list, fn); out.push({ kind, least: Number.isFinite(m) ? +m.toFixed(1) : 'over 48', need, ok: m >= need, n: list.length }); await pause();
    }
    return out;
  };
  // what grows at a place, for the part (its belt lies where plants stand): the canopy's height; an islet of the shallows answers too
  const heightAt = (x, z) => { const d = z - L.frontZ(x); if (d < 0) return 0; const E = plan.pe(x), N = plan.pn(z); return Math.max(plan.cover(E, N) * meanH * heightK(d), plan.isletAt(E, N) > 0.5 ? 6 : 0); };
  return { object: group, heightAt, update() {}, triangles: Object.values(tri).reduce((a, b) => a + b, 0), calls, info, clearAir, plants, cards, tools: F.tools };
}

// ---------- THE GROUND'S AND THE WATER'S BODIES: what the fire and the forest leave standing and lying ----------
// In and by the water (one mesh, drawn doubled in the water's face too): DROWNED dead trunks and stumps standing in
// the shallows and on its islets (stage D: the shallows are drowned ground, not burnt: the fire has not passed here
// and never will; the dead wood is dark, wet and barkless, some of it pale and weathered, with water marks; it
// never glows); great trunks fallen from the river's banks into the water (old dark relics, grown over). On the
// land (a second mesh): the forest's two lesser growths, low dark fans and coiled young shoots (on the islets too:
// they carry living growth), and the split husks of old pods. All dealt by place; nothing lies on a runners' lane.
const GROUND_VERT = /* glsl */`
attribute vec4 aK;               // what it is (0 drowned wood, 1 a fallen trunk, 2 husk, 3 a fan's blade, 4 a coiled shoot), its seed, how far along it, metres from the line
varying vec3 vW, vN; varying vec4 vK, vL, vF; varying vec2 vA;
void main(){
  vec3 wp = position; vN = normal; vK = aK; vL = fcrLight(position);
  if (aK.x > 2.5) { vec3 w = fuWind(position, vL, aK.w, aK.y); wp.xz += w.xy*(.5*w.z*aK.z*aK.z); }   // fans and shoots stir a little
#ifdef MIRROR
  wp.y = 2.*W_LEVEL - wp.y;
#endif
  vW = wp;
  vA = vec2(wPod(wPlan(position))*smoothstep(110., 260., aK.w), mix(.3, 1., smoothstep(25., 140., aK.w)));   // the pods' amber lying here; right before the line a dark body with a rim
  vec4 air = wAir(position, vL, vA.x);
#ifndef MIRROR
  if (aK.w < 330.) { vec4 vl = fcrSmokeVeil(cameraPosition, position); air = vec4(vl.rgb*(1. - air.a) + air.rgb, 1. - (1. - vl.a)*(1. - air.a)); }
#endif
  vF = air;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const GROUND_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec4 vK, vL, vF; varying vec2 vA;
void main(){
  vec3 n = normalize(vN);
  vec3 V = vW - cameraPosition; vec3 rd = V/max(length(V), 1e-3);
#ifdef MIRROR
  vec3 hp; float wat = wFace(cameraPosition, rd, hp);
  if (wat > -.2) discard;
  float cover = wDouble(hp, rd, wat);
  rd.y = -rd.y; if (dot(n, rd) > 0.) n = -n;
  vec3 P = vec3(vW.x, 2.*W_LEVEL - vW.y, vW.z);
#else
  if (!gl_FrontFacing) n = -n;
  vec3 P = vW;
#endif
  float kind = vK.x, seed = vK.y, g = fcrN3(P*1.7);
  // drowned wood: barkless, dark and wet, one trunk in three pale and weathered (by its own number); cracked down the
  // grain; black-wet at the water's level, and a pale water mark a metre or two over it
  float hgt = P.y - W_LEVEL, grain = fcrN3(vec3(P.xz*3.1, P.y*.3));
  vec3 wood = mix(vec3(.050, .044, .040), vec3(.118, .112, .104), step(.64, fract(seed*7.3))*(.55 + .45*g))*(.7 + .3*smoothstep(.35, .6, grain));
  wood = mix(wood, vec3(.022, .020, .020), (1. - smoothstep(.15, .9, hgt)));
  wood = mix(wood, wood*1.3 + .010, .6*(1. - smoothstep(0., .3, abs(hgt - 1.2 - .7*fract(seed*3.1)))));
  vec3 alb = kind < .5 ? wood
    : kind < 1.5 ? mix(vec3(.060, .042, .036), vec3(.046, .038, .050), g)*(.8 + .2*smoothstep(.35, .65, fract(vK.z*5. + g)))       // a fallen trunk: dark bark, faintly ringed
    : kind < 2.5 ? mix(vec3(.060, .030, .022), vec3(.12, .095, .07), smoothstep(.3, .8, vK.z))                                    // a split husk, paler inside its rim
    : kind < 3.5 ? vec3(.046, .040, .050)*(.6 + .6*vK.z) : mix(vec3(.060, .050, .034), vec3(.105, .075, .040), smoothstep(.55, 1., vK.z));   // a fan's blade; a young shoot, its coil paler
  vec3 col = alb*(wLitF(n, vL, .10, FIRE_PLANT*vA.y) + AMBER*(1.5*vA.x));
  vec2 fdir = normalize(vL.xz + vec2(1e-5, 1e-5));
  float fres = pow(1. - clamp(abs(dot(n, rd)), 0., 1.), 2.6), toward = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), fdir), 0.), facing = clamp(dot(n.xz, fdir)*.5 + .5, 0., 1.);
  col += uFire*(wFar(vL.w)*(.05 + 1.3*alb.r)*fres*(1.5*facing + 1.1*toward)) + uAmbSky*((.12*fres + .03)*(1. - facing));
  col = fuDeep(col);
  // (nothing here glows: no ember stands in drowned wood)
  col = col*(1. - vF.a) + vF.rgb;
#ifdef MIRROR
  gl_FragColor = vec4(col*(.5*cover), cover);                               // (stage F: an image in water is darker than its source)
#else
  gl_FragColor = vec4(col, 1.);
#endif
}`;
export async function buildGround(env) {
  const { plan, U, forks, detail, pause, glsl, forest, life, routePts } = env, T = forest.tools, fl = forks.litter, fu = forks.under, noise = env.ctx.noise, WATER = env.PLAN.water.river;
  const mk = () => ({ P: [], N: [], K: [], I: [] }), wetG = mk(), dryG = mk(), bodies = [], count = { snags: 0, stumps: 0, fallenTrunks: 0, fans: 0, shoots: 0, husks: 0 };
  const vOf = (G) => (x, y, z, nx, ny, nz, k) => { G.P.push(x, y, z); const l = hyp3(nx, ny, nz) || 1; G.N.push(nx / l, ny / l, nz / l); G.K.push(k[0], k[1], k[2], k[3]); return G.P.length / 3 - 1; };
  const vw = vOf(wetG), vd = vOf(dryG);
  const free = (x, z, r) => T.laneNear(x, z) > r + 2.6 && (!life || !life.laneNear || life.laneNear(x, z) > r + 2.6) && (!life || !life.swimNear || life.swimNear(x, z) > r + 2);   // (off the files' lines and off the swimmers' loops)
  // a tapering tube through centres (ns sides), every vertex of kind k; its rings may be ragged at the last (a broken end)
  const tube = (G, v, cs, rs, ns, kind, seed, d, ragged) => {
    const b = G.P.length / 3, n = cs.length;
    cs.forEach((c, i) => {
      const a = cs[Math.max(0, i - 1)], q = cs[Math.min(n - 1, i + 1)]; let dx = q[0] - a[0], dy = q[1] - a[1], dz = q[2] - a[2]; const dl = hyp3(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
      let ux = Math.abs(dy) > 0.9 ? 1 : -dz, uz = Math.abs(dy) > 0.9 ? 0 : dx, uy = 0; const ul = hyp3(ux, uy, uz) || 1; ux /= ul; uz /= ul;
      const wx = dy * uz - dz * uy, wy = dz * ux - dx * uz, wz = dx * uy - dy * ux;
      for (let j = 0; j < ns; j++) {
        const an = (j / ns) * 6.2832 + seed * 6, ca = Math.cos(an), sa = Math.sin(an), nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa, jag = ragged && i === n - 1 ? ragged * (fr(seed * 31.7 + j * 0.618) - 0.3) : 0;
        v(c[0] + nx * rs[i] + dx * jag, c[1] + ny * rs[i] + dy * jag, c[2] + nz * rs[i] + dz * jag, nx, ny, nz, [kind, seed, i / (n - 1), d]);
      }
    });
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < ns; j++) { const p = b + i * ns + j, q = b + i * ns + ((j + 1) % ns); G.I.push(p, q, p + ns, q, q + ns, p + ns); }
    return b;
  };
  // a drowned dead trunk (broken off, with the stubs of its arms) or a stump, standing in the water or on an islet: a
  // plain column at the water's level (no flared foot)
  const snag = (x, y, z, r, h, seed, d) => {
    const lx = (fr(seed * 5.1) - 0.5) * 0.16 * h, lz = (fr(seed * 9.7) - 0.5) * 0.16 * h, tall = h > 3.5;
    const cs = tall ? [[x, y - 0.7, z], [x + lx * 0.15, y + 0.18 * h, z + lz * 0.15], [x + lx * 0.55, y + 0.6 * h, z + lz * 0.55], [x + lx, y + h, z + lz]] : [[x, y - 0.7, z], [x, y + 0.35 * h, z], [x + lx, y + h, z + lz]];
    const b = tube(wetG, vw, cs, tall ? [r * 1.1, r, r * 0.8, r * 0.55] : [r * 1.1, r, r * 0.85], 6, 0, seed, d, tall ? 0.16 * h : 0.5 * h), top = b + (cs.length - 1) * 6;
    const c = vw(x + lx, y + h * 0.9, z + lz, 0, 1, 0, [0, seed, 1, d]); for (let j = 0; j < 6; j++) wetG.I.push(c, top + j, top + ((j + 1) % 6));
    // the stubs of its arms: one low and short, on some a second high on another side (never a pair at one height)
    if (tall) for (let k = 0; k < (fr(seed * 21.7) < 0.5 ? 2 : 1); k++) {
      const f = k ? 0.7 + 0.16 * fr(seed * 20.3) : 0.3 + 0.14 * fr(seed * 13.3), a = seed * 40 + k * (1.1 + 0.9 * fr(seed * 4.7)), ca = Math.cos(a), sa = Math.sin(a), ox = x + lx * f, oy = y + h * f, oz = z + lz * f, len = Math.min(r * 2.6, h * (0.07 + 0.07 * fr(seed * (3.3 + k))));
      tube(wetG, vw, [[ox, oy, oz], [ox + ca * len, oy + (k ? 1.1 : 0.2) * len, oz + sa * len]], [r * 0.42, r * 0.2], 3, 0, seed, d, 0.3);
    }
    bodies.push({ x: x + 0.5 * lx, z: z + 0.5 * lz, y0: y, y1: y + h * 1.17, r: r * 1.7 + 0.5 * hyp(lx, lz) + (tall ? r * 4.8 : 0) });
  };
  // a great trunk fallen from a bank (A, its roots) into the water (B): tapering, a little bent, its root plate standing at the bank
  const fallen = (A, B, r0, seed, d) => {
    // (stage E: it lies BROKEN AND HALF SUNK: bent, its outer half gone under: what shows is a short dark stub
    // going down into the water from its root plate, never a long straight bar across the water)
    B = [lerp(A[0], B[0], 0.6), WATER - 1.1 * r0, lerp(A[2], B[2], 0.6)];
    const cs = [], rs = [], bend = (fr(seed * 7.3) < 0.5 ? -1 : 1) * (0.1 + 0.16 * fr(seed * 3.9)), px = -(B[2] - A[2]), pz = B[0] - A[0];
    for (let i = 0; i <= 4; i++) { const t = i / 4, sw = bend * Math.sin(Math.PI * t); cs.push([lerp(A[0], B[0], t) + px * sw, lerp(A[1], B[1], Math.pow(t, 0.7)), lerp(A[2], B[2], t) + pz * sw]); rs.push(r0 * lerp(1, 0.5, t)); }
    tube(wetG, vw, cs, rs, 6, 1, seed, d, 0);
    const len = hyp(B[0] - A[0], B[2] - A[2]), dx = (B[0] - A[0]) / len, dz = (B[2] - A[2]) / len, c = vw(A[0], A[1], A[2], -dx, 0.2, -dz, [1, seed, 0, d]), rb = wetG.P.length / 3;   // the root plate
    for (let j = 0; j < 7; j++) { const an = (j / 7) * 6.2832, rr = r0 * (1.9 + 1.3 * fr(seed * 17 + j * 0.37)); vw(A[0] - dz * Math.cos(an) * rr - dx * 0.5, A[1] + Math.sin(an) * rr, A[2] + dx * Math.cos(an) * rr - dz * 0.5, -dx, 0.2, -dz, [1, seed, 0.05, d]); }
    for (let j = 0; j < 7; j++) wetG.I.push(c, rb + j, rb + ((j + 1) % 7));
    for (let k = 0; k < 2; k++) { const t = 0.35 + 0.3 * k + 0.1 * fr(seed * (5 + k)), o = cs[Math.round(t * 4)], l2 = r0 * (2.5 + 3 * fr(seed * (11 + k))), sd = k ? 1 : -1; tube(wetG, vw, [o, [o[0] - dz * sd * l2 * 0.5, o[1] + l2, o[2] + dx * sd * l2 * 0.5]], [r0 * 0.4, r0 * 0.18], 3, 1, seed, d, 0.3); }
    for (let i = 0; i <= 4; i++) bodies.push({ x: cs[i][0], z: cs[i][2], y0: cs[i][1] - rs[i], y1: cs[i][1] + rs[i] + (i === 0 ? 3.2 * r0 : r0 * 5.5), r: 0.125 * len + rs[i] + (i === 0 ? 3.2 * r0 : 0) });
  };
  // a low dark fan: broad blades standing out of one foot
  const fan = (x, y, z, L, seed, d) => {
    const nb = 5 + Math.floor(fr(seed * 9.1) * 3), a0 = seed * 6.28;
    for (let k = 0; k < nb; k++) {
      const a = a0 + (k / nb) * 6.2832 + (fr(seed * 3.3 + k * 0.7) - 0.5) * 0.5, el = 0.5 + 0.8 * fr(seed * 5.7 + k * 0.31), l = L * (0.6 + 0.4 * fr(seed * 7.9 + k * 0.53)), ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(el), se = Math.sin(el), w = 0.2 * l;
      const nx = -ca * se, ny = ce, nz = -sa * se, b = vd(x, y - 0.1, z, nx, ny, nz, [3, seed, 0, d]);
      vd(x + ca * ce * 0.55 * l - sa * w, y + se * 0.55 * l, z + sa * ce * 0.55 * l + ca * w, nx - sa * 0.4, ny, nz + ca * 0.4, [3, seed, 0.55, d]); vd(x + ca * ce * 0.55 * l + sa * w, y + se * 0.55 * l, z + sa * ce * 0.55 * l - ca * w, nx + sa * 0.4, ny, nz - ca * 0.4, [3, seed, 0.55, d]);
      vd(x + ca * ce * l, y + se * l * 0.92, z + sa * ce * l, nx, ny, nz, [3, seed, 1, d]); dryG.I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    bodies.push({ x, z, y0: y, y1: y + L, r: L });
  };
  // a coiled young shoot: a stem that rises and rolls up at its head
  const shoot = (x, y, z, h, seed, d) => {
    const a = seed * 6.28, ca = Math.cos(a), sa = Math.sin(a), rc = 0.2 * h, cs = [[x, y - 0.3, z], [x + ca * 0.05 * h, y + 0.45 * h, z + sa * 0.05 * h]], rs = [0.07 * h + 0.05, 0.055 * h + 0.04], cx = 0.12 * h + rc, cy = 0.8 * h;
    for (let k = 0; k <= 6; k++) { const t = k / 6, an = Math.PI - t * 9.2, rr = rc * (1 - 0.72 * t), u = cx + Math.cos(an) * rr, w = cy + Math.sin(an) * rr; cs.push([x + ca * u, y + w, z + sa * u]); rs.push((0.05 * h + 0.03) * (1 - 0.6 * t)); }
    tube(dryG, vd, cs, rs, 3, 4, seed, d, 0);
    bodies.push({ x: x + ca * cx * 0.5, z: z + sa * cx * 0.5, y0: y, y1: y + h * 1.05, r: 0.4 * h });
  };
  // a husk's half shell: a low dome, open
  const husk = (x, y, z, r, h, seed, d, a) => {
    const ns = 5, ca = Math.cos(a), sa = Math.sin(a), top = vd(x, y + h, z, 0, 1, 0, [2, seed, 1, d]), b = top + 1;
    for (let j = 0; j < ns; j++) { const b2 = (j / ns) * 6.2832, ex = Math.cos(b2) * r * 1.7, ez = Math.sin(b2) * r, px = ca * ex - sa * ez, pz = sa * ex + ca * ez; vd(x + px, y - 0.08 + 0.3 * h * fr(seed * 9 + j * 0.7), z + pz, px, 0.7 * r, pz, [2, seed, 0, d]); }
    for (let j = 0; j < ns; j++) dryG.I.push(top, b + ((j + 1) % ns), b + j);
    bodies.push({ x, z, y0: y, y1: y + h, r: r * 1.7 });
  };
  // the air a body would leave to the route (asked before it is laid: nothing is laid within 5 m of the route's air)
  const airy = (x, z, y0, y1, r) => T.airOf(x, z, y0, y1, r) > 5;
  // THE DROWNED SHALLOWS: dead trunks and stumps in loose clumps, standing in the water and on the islets (three in four are stumps or low)
  const nSnag = Math.round(60 * detail), nStump = Math.round(90 * detail);
  for (let t = 0; t < 9000 && (count.snags < nSnag || count.stumps < nStump); t++) {
    if (t % 250 === 249) await pause();
    const [x, z] = T.sidePt(fl.range(T.flatA - 30, T.flatB + 30), fl.range(-58, 124)), E = plan.pe(x), N = plan.pn(z);
    if (plan.sdAsh(E, N) > -3 || fl() > 0.2 + 0.8 * smoothstep(-0.3, 0.3, noise.n2(x / 31 + 9, z / 31 - 4))) continue;
    const d = plan.lineD(x, z), isl = plan.isletAt(E, N) > 0.3, y = isl ? plan.groundAt(x, z) : WATER, seed = fl(), tall = fl() < 0.4;
    if (tall) { if (count.snags >= nSnag) continue; const r = fl.range(0.5, 1.1), h = fl.range(5, 17) * (0.6 + 0.4 * smoothstep(20, 60, T.routeAt(x, z, 64)[0])); if (!free(x, z, r * 2) || !airy(x, z, y, y + h * 1.17, r * 6.5 + 0.08 * h)) continue; snag(x, y, z, r, h, seed, d); count.snags++; }
    else { if (count.stumps >= nStump) continue; const r = fl.range(0.5, 1.2), h = fl.range(0.8, 3.2); if (!free(x, z, r * 2)) continue; snag(x, y, z, r, h, seed, d); count.stumps++; }
  }
  await pause();
  // THE RIVER'S AND THE CHANNEL'S BANKS: great trunks fallen into the water, their roots on the bank; none across a
  // file's line, none within 6 m of the route's air
  const nFall = Math.round(18 * detail), bank = T.bankPts.concat(T.lastPts);
  if (bank.length) for (let t = 0; t < 5000 && count.fallenTrunks < nFall; t++) {
    if (t % 200 === 199) await pause();
    const [x, z] = T.beside(fl, bank, 20, 70), w = T.watOf(x, z); if (w < 1.5 || w > 7) continue;
    const E = plan.pe(x), N = plan.pn(z), ge = plan.watAt(E + 3, N) - w, gn = plan.watAt(E, N + 3) - w, gl = hyp(ge, gn); if (gl < 0.2) continue;
    const a = Math.atan2(gn / gl, (-ge / gl) * plan.m) + fl.range(-0.7, 0.7), len = fl.range(20, 38), dx = Math.cos(a), dz = Math.sin(a), bx = x + dx * len, bz = z + dz * len, r0 = fl.range(0.9, 1.6);
    if (T.watOf(bx, bz) > -3 || T.watOf(x + dx * len * 0.5, z + dz * len * 0.5) > 0) continue;
    let ok = true; for (let k = 0; k <= 6 && ok; k++) { const px = x + dx * len * (k / 6), pz = z + dz * len * (k / 6); ok = free(px, pz, r0) && airy(px, pz, WATER - 1, WATER + 2 + 6 * r0, r0 * 4 + 3); }
    if (!ok) continue;
    const prop = fl() < 0.35 ? fl.range(1, 3.5) : 0;                         // now and then its far end stands propped out of the water
    fallen([x, plan.groundAt(x, z) + 0.7 * r0, z], [bx, WATER - 0.25 * r0 + prop, bz], r0, fl(), plan.lineD(x, z)); count.fallenTrunks++;
  }
  await pause();
  // THE UNDERGROWTH on the banks and under the giants beside the low route: fans in drifts, shoots in twos and threes, old husks
  const nFan = Math.round(160 * detail), nShoot = Math.round(48 * detail), nHusk = Math.round(70 * detail), under = T.bankPts.concat(T.lastPts);
  if (under.length) for (let t = 0; t < 12000 && (count.fans < nFan || count.shoots < nShoot || count.husks < nHusk); t++) {
    if (t % 500 === 499) await pause();
    const [x, z] = T.beside(fu, under, 18, 84), w = T.watOf(x, z); if (w < 0.8 || w > 46) continue;
    const drift = 0.5 + 0.5 * noise.n2(x / 19 + 31, z / 19 + 5); if (fu() > smoothstep(0.3, 0.7, drift) + 0.12) continue;
    const d = plan.lineD(x, z); if (d < 8) continue; const y = plan.groundAt(x, z), seed = fu(), pick = fu();
    if (pick < 0.62) { if (count.fans >= nFan) continue; const L = fu.range(1.4, 4.2); if (!free(x, z, L * 0.7) || !airy(x, z, y, y + L, L)) continue; fan(x, y, z, L, seed, d); count.fans++; }
    else if (pick < 0.85) { if (count.shoots >= nShoot) continue; const n = 1 + Math.floor(fu() * 3); for (let k = 0; k < n && count.shoots < nShoot; k++) { const sx = x + fu.range(-2.5, 2.5), sz = z + fu.range(-2.5, 2.5), h = fu.range(2, 7.5); if (T.watOf(sx, sz) < 0.6 || !free(sx, sz, 1) || !airy(sx, sz, y, y + h * 1.05, 0.4 * h)) continue; shoot(sx, plan.groundAt(sx, sz), sz, h, fu(), d); count.shoots++; } }
    else { if (count.husks >= nHusk || w < 3) continue; const r = fu.range(0.5, 1.5); if (!free(x, z, r)) continue; husk(x, y, z, r, r * fu.range(0.5, 0.9), seed, d, fu() * 6.2832); count.husks++; }
  }
  await pause();
  // THE ISLETS OF THE SHALLOWS CARRY LIVING GROWTH (stage D: drowned ground, not burnt): fans in drifts and coiled
  // young shoots, on every islet's drier ground
  {
    const nIF = Math.round(44 * detail), nIS = Math.round(20 * detail); let iF = 0, iS = 0;
    for (let t = 0; t < 7000 && (iF < nIF || iS < nIS); t++) {
      if (t % 500 === 499) await pause();
      const [x, z] = T.sidePt(fu.range(T.flatA - 30, T.flatB + 30), fu.range(-58, 124)), E = plan.pe(x), N = plan.pn(z);
      if (plan.isletAt(E, N) < 0.9) continue;
      const d = plan.lineD(x, z); if (d < 8) continue; const y = plan.groundAt(x, z), seed = fu();
      if (iF < nIF && fu() < 0.7) { const L = fu.range(1.2, 3.4); if (!free(x, z, L * 0.7) || !airy(x, z, y, y + L, L)) continue; fan(x, y, z, L, seed, d); iF++; }
      else if (iS < nIS) { const h = fu.range(2, 6); if (!free(x, z, 1) || !airy(x, z, y, y + h * 1.05, 0.4 * h)) continue; shoot(x, y, z, h, seed, d); iS++; }
    }
    count.fans += iF; count.shoots += iS; count.onTheIslets = iF + iS;
  }
  await pause();
  // (stage F) THE WATER'S EDGE OF THE NEAR BANKS along the river: low growth of our own kind on the last metres of
  // ground before the water (coiled shoots in twos and threes, fans in drifts, old husks among them): no smooth slab
  {
    const nE = Math.round(110 * detail); let got = 0;
    if (T.bankPts.length) for (let t = 0; t < 14000 && got < nE; t++) {
      if (t % 400 === 399) await pause();
      const [x, z] = T.beside(fu, T.bankPts, 8, 64), w = T.watOf(x, z); if (w < 0.5 || w > 4.5) continue;
      const d = plan.lineD(x, z); if (d < 8) continue; const y = plan.groundAt(x, z), seed = fu(), pick = fu();
      if (pick < 0.5) { const n = 2 + Math.floor(fu() * 2); for (let k = 0; k < n; k++) { const sx = x + fu.range(-1.8, 1.8), sz = z + fu.range(-1.8, 1.8), h = fu.range(1.6, 5); if (T.watOf(sx, sz) < 0.4 || !free(sx, sz, 1) || !airy(sx, sz, y, y + h * 1.05, 0.4 * h)) continue; shoot(sx, plan.groundAt(sx, sz), sz, h, fu(), d); count.shoots++; got++; } }
      else if (pick < 0.86) { const Lf = fu.range(1.2, 3.2); if (!free(x, z, Lf * 0.7) || !airy(x, z, y, y + Lf, Lf)) continue; fan(x, y, z, Lf, seed, d); count.fans++; got++; }
      else { const r = fu.range(0.4, 1.1); if (!free(x, z, r)) continue; husk(x, y, z, r, r * fu.range(0.5, 0.9), seed, d, fu() * 6.2832); count.husks++; got++; }
    }
    count.atTheWatersEdge = got;
  }
  await pause();
  const geo = (G) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(G.N, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(G.K, 4)); g.setIndex(G.I); return g; };
  const head = glsl.front + glsl.noise + glsl.ramp + glsl.mirror + glsl.world + glsl.air + FUSE_GLSL, group = new THREE.Group(); group.name = 'ground-bodies';
  const add = (g, mat, name, order) => { const m = new THREE.Mesh(g, mat); m.name = name; m.frustumCulled = false; if (order !== undefined) m.renderOrder = order; group.add(m); };
  const wg = geo(wetG), dg = geo(dryG), plain = () => new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: U, vertexShader: head + GROUND_VERT, fragmentShader: head + GROUND_FRAG });
  await pause();
  add(wg, plain(), 'snags-and-trunks'); add(dg, plain(), 'undergrowth');
  await pause();
  add(wg, mirrorMat({ uniforms: U, vertexShader: head + glsl.water + GROUND_VERT, fragmentShader: head + glsl.water + GROUND_FRAG }), 'snags-doubled', -8.8);
  const tris = (2 * wetG.I.length + dryG.I.length) / 3;
  const clearAir = async (pts, need) => { let least = Infinity; for (const b of bodies) { const a = T.airOf(b.x, b.z, b.y0, b.y1, b.r); if (a < least) least = a; } return [{ kind: 'snags, stumps, fallen trunks, fans, shoots and husks', least: Number.isFinite(least) ? +least.toFixed(1) : 'over 48', need, ok: least >= need, n: bodies.length }]; };
  return { object: group, triangles: tris, calls: 3, clearAir, info: { ...count, triangles: tris } };
}
