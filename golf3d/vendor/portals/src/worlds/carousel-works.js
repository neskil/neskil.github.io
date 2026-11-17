// Carousel Works: a carving shop built four times life in which a great three-row carousel turns under test,
// half built, the animals of its sixty stations at every stage of their making in order round the ring.
//
// OUTLINE (x east, y up, z south; the wheel's centre is the origin)
//   1 helpers      a merger for vertex-coloured solids (aK = kind, param, lamp glow) and the hall's one material
//   2 hall         floors, walls, sawtooth roof with north glass, trusses, cast piers, east doors, freight doorway and shed
//   3 carving shop the south arm, in three zones down its length: THE CARVER'S ISLAND on the left (a bench 11 by 30 m whose near
//                  edge is 10.2 m from the arm's axis, 9.4 m from the line at the nearest; on it the great head tall in its vice under the island's lamp, the fan of long
//                  gouges and the rocking mallet, and nothing small; its shavings lie in its lee, west of it); THE TRAVELLING
//                  HOIST across the arm at z 132 with a whole roughed-out horse slung in chains over the line, 7 m above it,
//                  turning a little by the world's clock; THE STORE RACKS on the right in the two middle bays (carved legs and
//                  hair tails hung in a row under timber stood on end; carved heads on a shelf under a row of long bar
//                  clamps), each lit by its bay's bracket lamp; then the mouth with its lit piers. Benches and tool boards
//                  along the east wall, the line shaft belted to the lathe, a band saw and a drum sander (all turning, each
//                  under a wall lamp), the glue pot on its stove by the west wall, the glued blank in its clamps on trestles
//                  beside the timber stack, four half-made animals on trolleys in two pairs, each pair under a pendant; a
//                  few shavings fall at the island. Whatever stands on the arm's floor stands 9 m or more to the side of
//                  the line in plan (the island's near edge 9.4 m, the second bay's sawhorses 9.5 m as typed, the east benches
//                  11.7 m): the middle of the floor is the rails, the lamps' pools and their reflections
//   4 wheel bay    the hero wheel, racks of spare animals lit by their own rack lamps (six species, three sizes, bins of
//                  carved parts, gaps), platform steps, stepladders, timber stacks, trolleys; a ring of twelve gas pendants
//                  (radius 53, y 20) and four in the corners, and under each pendant of the ring one group of low work
//                  (THE RING'S WORK: one rule for every pendant whose pool lies 16 m or more from the line)
//   5 paint shop   the west arm, limewashed warm buff and lit by white-shaded lamps: its mouth is a gate (a green fascia
//                  with six fields of six different devices, gilt, a sunburst and a row of steady bulbs) with two drying
//                  frames on painted posts with gilt caps and a road of trolleys before it, 20 m and more to the side;
//                  drying racks, two conveyors of twenty-four finished animals, kettles on stoves whose painted flues rise
//                  clear of the conveyors, the gilder's bench and the painter's bench (each 20 m to the side of the line,
//                  behind a conveyor's return run, on a drop cloth). THE DESPATCH END (x -136 to -176) is a darker room: a dado of the scheme's deep colour
//                  to y 9 with a gilt rail, four great finished animals whole against the two side walls (nose to tail on the
//                  sidings, x -159.2 to -140.6: the last 30 m before the end wall hold floor, rails and wall only), each under
//                  its own lamp, colour boards, brushes and harness on the wall behind them; THE END WALL is the showpiece
//                  (pilasters fluted in leaf, seven painted panels each with a device of its own: fan, wreath, star, cartouche,
//                  roundel, sunburst, crossed sprays; a cornice of bulbs), deep-toned so that the
//                  portal is the brightest thing in it. The freight doorway (34 m wide at the wall's face, stepping back
//                  in three orders to 28 m) stands OPEN on a dim loading shed 40 m deep (dark boarding, posts and tie
//                  beams, three lanterns a side, crates, a sheeted dray); in the opening the wheel's own finished front
//                  stands free round the portal (a slim hoop of deep colours, leaf, mirrors and bulbs under a sunburst
//                  of ridged blades with a bulb at each root)
//   THE FLOOR      dark oiled boards drawn in the hall's shader by place, 13 by 1.5 m, with joints and grain that melt away where
//                  they are finer than the picture; on them only the shop's railway (two straight tracks: up the arm, down
//                  the paint aisle), swept sawdust at the feet of what stands on them, and in the paint shop crisp drips and
//                  pot rings in the scheme's paints. Nothing drawn on them is larger than a board.
//                  THE FLOOR'S SHEEN READS THE EYE, as the kit's water does and nothing else here may: the oil mirrors a list
//                  of the hall's lights (uSLp, uSLc: every pendant, the wheel's lit quarter as four places that turn with it,
//                  the mast-head lantern, the gate's bulbs, the portal), each as a long soft streak drawn out toward the eye,
//                  only on boards that light can reach (its own room, or through a mouth), stronger at a grazing view.
//                  A far lamp's streak (55 m and more from the eye) widens and fades, so the far lamps of the arm run
//                  together into one low gold band, stepped board by board, and only the near ones stand as streaks; the
//                  list is cut with the picture's detail (52, 39 or 26 lights).
//                  Nothing is placed, hidden or timed by it: it is the floor's surface, worked out per pixel from
//                  cameraPosition; no light is added to the scene and nothing is rendered twice.
//                  BY DAY THE BOARDS STAY DARK (uFloorWash, morning and noon): of the glass's even wash (the hemisphere
//                  and the north key) they give back under a third, the paint shop's fill hardly reaches them, and the
//                  lamps' pools draw in to their cores; the day lies on them as the shafts' pools, the roof's blades,
//                  the lamps' discs, the gold of the wheel and the portal, and the sheen.
//                  IN THE EVENING the boards are a tone lighter than by day (the look's floor colour), each lamp's pool on
//                  them is stronger (lampFloor) and the mirrored streaks are at about half strength (streak 0.55): so the
//                  planks and the pools are seen, and the streaks lie over them without running together into a smear.
//                  EVERYTHING HERE THAT READS THE EYE, named: (1) this sheen of the floor; (2) THE DUSK SKY in the roof
//                  glass and every look's sky there (section 6: drawn by the direction each pane is seen in); (3) on
//                  the wheel (the hero part): the gilt's and the mirrors' faked reflection of pale glass above and dark
//                  floor below, the deck's mirror of the lit quarter's bulbs as soft gold bands, and the satin highlight
//                  and rim of carved wood; (4) the standard material's own specular. None of them places, hides, times
//                  or lights anything for a position: each is a surface answering the eye, as the kit's water does.
//   6 air          shafts of north light (fixed crossed planes on the lattice the shaders share: SHAFT_GLSL), sea glare
//                  through the east doors at noon, a few flakes of gold leaf, a few shavings falling at the carver's island,
//                  steam (tall over the glue pot and the kettles), sparrows, gas mantles, gulls. LIT AIR, all of it additive
//                  with no depth written and 3.0 m or more from the flown line (the build's report prints each least
//                  distance): a cone of lamplight under every pendant whose cone clears the line (33 of 40; nearest edge
//                  6.5 m), the wheel's own gold air in its frame (cones under the gilded sweeps inside radius 33, columns
//                  over the lit rounding boards from y 21.6 up: 8.4 m and 12.1 m clear), and dust motes large enough to
//                  see in six fixed boxes (nearest 5.7 m). The haze is tinted by place in both shaders: blue-grey in the
//                  arm, the wheel's gold in the bay, pale in the paint shop.
//                  THE DUSK SKY in the roof glass is drawn by the direction it is seen in: deep blue in every pane with the
//                  first stars, rose and amber only low toward the west-north-west; glass is toned sky in every look
//   7 looks        winter morning (clear pale-blue north light under a blue sky, thin cloud; cream wood, burning bulbs
//                  and gilt, pale shafts, dark umber boards and lower walls), gas-lit evening, summer noon (cool white north light,
//                  the east doors open to the sea); the lamps burn in all three, low by day; the rare bulb failure
//                  dims every warm thing at once. The gilded quarter's bulbs sweep a warm lobe over floor and racks.
//                  THREE ACTS BY PLACE (world x and z in the shaders, never the flight): THE ARM (z over 76) stands in
//                  the dusk's blue (uArmAmb) with a separate warm pool under each lamp and its walls washed bay by bay;
//                  THE BAY is filled by the wheel's lit quarter (uGoldP, uGoldC: a gold light on whatever faces it, to
//                  the trusses, with the sweeping lobe and slow mirror glints on walls and roof); west of x -78 THE PAINT
//                  SHOP is a whiter room (limewashed walls, scrubbed boards, uPaintCol and uPaintFill), and its last
//                  40 m take the portal's gold on floor, walls and work. By day the same zones in their own keys.
//                  THE WHEEL'S OWN LIGHT, in every look and by place alone: its rim (fascia, rounding boards, staffs,
//                  pennants) takes the ring of twelve pendants (gasWheel), and everything on it above the cranks
//                  (sweeps, rods, cap, mast head, pennants) takes the bay's roof glass (roof). The arm south of z 76
//                  burns lower than the ring (pendant shades, mantles, the wash on its walls), and by day the shafts
//                  whose feet lie south of the mast inside the ring's width are thinned (to a quarter between the
//                  arm and the wheel, to a half in the arm), so the wheel is the bright ring at the end of the arm.
//   THE PLAN       one small texture over the whole floor (0.75 m a texel), drawn once in build: r = the pendants' pools
//                  (a soft disc under each lamp), g = contact shade under whatever stands on the boards and under the
//                  platform's rim, b = where paint is worked (kettles, benches, conveyors), a = swept sawdust round the
//                  feet of what stands in the carving shop and the bay. The walls read r for a wash.
//   8 flight       the brief's path; pace and gaze keyed to places in the hall; update and dispose. The gaze holds the
//                  wheel's crown (a point on the mast at y 15, weight 0.7) from the entry until the tangent leg meets the
//                  arc; on the arc it is the design's: a point on the outer row (radius 32) 30 degrees round the wheel ahead
//                  of the eye, weight 0.5, u 0.40 to 0.62, soft ends. From the entry until 8 m short of the carver's great
//                  head the gaze also leans toward the island (weight 0.3).
//
// DEPARTURES FROM THE DESIGN (design/interiors/carousel-works.json), every one of them, each for clear air on the flown line or
// between bodies:
//   1 THE DOORWAY is 34 m wide and 26 tall at the wall's face, stepping back through three orders to 28 by 23 (design: 18 by 20),
//     and its plank doors are run back out of sight, so that the loading shed shows either side of the hoop (20.8 m across) and
//     over its head. The portal (radius 7) and its seat are the design's.
//   2 THE CONVEYORS' rails end at x -129 (design: -168) and carry twelve hooks each, twenty-four animals (design: thirty-four):
//     the 47 m west of them are the despatch end. Their aisle runs are at z -50.5 and -31.5 (design: -55 and -27) and their return
//     runs at z -62 and -20 (design: -64 and -18): the kettles' flues rise 5.75 m from either rail and the drying racks stand
//     behind the return runs. So a hung animal's pole is 9.5 m to the side of the line (design: 14 m; the design asks 10 m of
//     clear air), and the nearest point of the widest one at full sway is 4.65 m from the line (printed in the build's report).
//   3 THE WHEEL'S ANGLE AT CLOCK 0 is dealt with the look (phase0, one draw of the deal's own stream; design: the seam due north),
//     so that each deal turns a different quarter of the making past the tangent leg.
//   4 THE GAZE DOWN THE ARM AND THE LEG holds the mast's crown (0, 15, 0), weight 0.7, u 0 to 0.40 (design: the east rim at
//     (32, 8, 10), weight 0.4, u 0.16 to 0.42), with a lean toward the carver's island (weight 0.3, u 0 to 0.06) that the design
//     does not have. The gaze on the arc is the design's.
//   5 the wheel's cranks turn no lower than y 15.4 (design: 16.5; see the hero part).
//   6 the finished animals of the despatch end are four, 1.4 times the wheel's, standing against the side walls 25 m either side
//     of the line (the design has none there); the fourth kettle's stove stands west of the conveyors' end with a cranked flue.
//     The drying racks run from x -139 to -80 (the design's run began further west).
//   8 SHAVINGS FALL at the carver's island only, nine curls at full detail (the design has them falling at the entry at large): at
//     the other benches they lie where they were cut.
//   9 THE WHEEL'S DECK WORK AND KITS (trestles, barrow, kegs, steps, chests, belts) all stand in the lane between rows one and two,
//     and the poles that wait to be hung stand upright in a rack by the housing (the design scatters work over the deck): the lane
//     between rows two and three and the outer deck are boards and rails only, so the outer row is seen clean from the arc.
//   7 the shop's railway (two straight tracks), the rack lamps and the store racks are additions; noon's sea light is one band
//     from the open east doors toward the mast, not a general wash.
//  10 THIS ROUND'S ADDITIONS, none in the design: the floor's oiled sheen (it reads the eye: THE FLOOR, above); the travelling
//     hoist and its horse over the line at z 132 (its lowest point, the soles of its gilt shoes, y 18.99 as it hangs and 18.94 at the lowest of its swing, 6.9 m from the line at the nearest); the lit air under
//     the lamps, round the wheel's gilded quarter and the mote boxes (6.5 m, 8.4 m and 5.7 m from the line at the nearest);
//     the mast-head lantern; the two lit niches of the end wall (crates with a finished head in straw; the painter's ladder
//     and pots; 17 m and more from the line); the wheel's rounding boards in stage order (bare frame, first boards, boarded,
//     primed, half painted, gilded) on iron hangers, and its striped top ending on a sweep with a laced edge (the hero part).
//     The design's chalked setting-out round the platform, its turntable plates and the pattern wall's flat profiles are gone.
//  11 ALSO NOT THE DESIGN'S (a reader's list, with the reader's figures): the hanger straps at the sweeps' ends reach down to
//     y 16.85 at radius 43.3 to 43.5, and the platform's kerb line reaches radius 43.46 (design: nothing between y 3.2 and 17
//     from radius 34.6 to 49; the kerb at 43); the gilder's bench stands behind the south conveyor's return run, 21.7 m from the
//     line (design: 7 m off), and a painter's bench is added; the island's near edge is at x -10.2 and the great head at x -14.6
//     (design: -9 and -12); the racks hold 96 spares at most (design: 150); the wheel carries 1,273 bulbs and one lantern
//     (design: 1,400); the animals are 6.6 to 7.1 m long (design: about 6); the pace is keyed to places and differs from the
//     design's by up to 0.04; the kit's sky, god rays and interior builder are not used (the hall draws its own); the exposure
//     is 1.2 in the evening and 0.96 at noon (design: 1); the build is held to steps of 50 ms (design: 30).
// COST  418.9k to 433.9k triangles on the 48 deals counted (seeds 1 to 48; the lightest is seed 3, the heaviest seed 30; seed 7
//   has 423.8k; every mesh of the build counted, the air and the bulbs with them). The 440,000 the build's report prints
//   beside its count is a guard set by hand above the heaviest deal counted; it is not worked out from the most the deal
//   could give, and nothing enforces it. The report prints the count part by part for the deal in hand. 93 to 111 draw calls
//   in the picture along the flight. 1.19 to 1.43 s to build under the build-step tool (tools/buildsteps.mjs, eight runs over
//   two rounds), with no step over 50 ms.
// CAPS  three dealt stocks have a hard cap, each typed two above the most that any of seeds 1 to 1,200 deals: HOOP_CAP (32 hoops on
//   the paint shop's drying shelves), BIN_CAP (28 bins of carved parts in the racks), CURL_CAP (11 shavings at the carver's island).
//   The constants, the most seen of each and what a cap does stand above the build function. The caps change none of seeds 1 to
//   1,200 (each built with them and without them, outside the browser, and compared to the last vertex). They are not a proof of
//   the report's 440,000: with the dealt stocks forced to their heaviest at their sites and the heaviest wheel a search found, the
//   deal built outside the browser weighs 469,458 triangles without the caps (evening or morning; 464,966 at noon) and 456,026 with
//   them (noon; 455,382 in the evening or morning). No other dealt stock has a cap of this kind: not the wheel's cast and row offsets,
//   the racks' dust sheets, the tails, the crates, the curls under the stand, the low things round the wheel (the heaps, planks and
//   buckets between radius 43.5 and 49) or the ring's work. (The racks' spares have an older limit of another kind: STOCK, 16 of a species.)
//
// THE DEAL  look, paint scheme, cast and the wheel's angle at clock 0 are dealt first of all from a fork of the world's
// stream, each by its own weights (LOOK_DEAL, SCHEME_DEAL, CAST_DEAL). ctx.vary.hour, when the viewer asks for an hour,
// overrules the look. Nothing here reads the seed's number.
// The wheel turns by the world clock alone. The only thing keyed to u is the rare bulb failure (u 0.47 to 0.56).
// There is one HemisphereLight and the wheel's two PointLights; the north glass's key is worked out in the shaders.

import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, SHAFT_GLSL, shaftLattice, shaftGain } from '../parts/carousel-works.js';

const TAU = Math.PI * 2;
const PAL = { cream: '#E8D9B8', iron: '#4A5560', umber: '#2A221C', scarlet: '#C8281E', gold: '#E0A62E', sky: '#CFE0EA', green: '#1F4A3C' };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---- 1 helpers ---------------------------------------------------------------------------------------------
// Kinds for aK.x: 0 paint or iron, 1 wood (param = grain axis 0 x, 1 y, 2 z), 2 floor boards, 3 wall,
// 4 cloth that stirs (param = how freely this vertex swings), 5 glowing (param = gain).
const KIND = { PLAIN: 0, WOOD: 1, FLOOR: 2, WALL: 3, CLOTH: 4, GLOW: 5 };

function makeMerger() {
  // four growing typed lists, three numbers a vertex: position, normal, colour, aK
  let cap = 8192, nv = 0, P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), K = new Float32Array(cap * 3);
  const grow = (need) => { if (nv + need <= cap) return; while (cap < nv + need) cap *= 2;
    const more = (a) => { const t = new Float32Array(cap * 3); t.set(a.subarray(0, nv * 3)); return t; }; P = more(P); N = more(N); C = more(C); K = more(K); };
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), nm = new THREE.Matrix3(), col = new THREE.Color(), base = new THREE.Color();
  const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), cyls = {};
  const temps = [BOX], flat = new Map();
  let part = 0;
  const bq = new THREE.Quaternion(), bv = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const api = {
    // o: { p, r (euler xyz), s (number or [x,y,z]), c (hex), kind, par, jit (tone jitter per part), ao: [y0, y1] (darker toward y0),
    //      sway: [yFixed, yFree] (cloth), tint(x, y, z, colour) }
    add(g, o = {}) {
      const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s == null ? [1, 1, 1] : (o.s.length ? o.s : [o.s, o.s, o.s]);
      if (o.q) q.copy(o.q); else q.setFromEuler(e.set(r[0], r[1], r[2]));
      m4.compose(v.set(p[0], p[1], p[2]), q, sc.set(s[0], s[1], s[2])); nm.getNormalMatrix(m4);
      let gg = g;                                                                 // an indexed shape is unrolled once and kept for the next time it is added
      if (g.index) { gg = flat.get(g); if (!gg) { gg = g.toNonIndexed(); flat.set(g, gg); temps.push(gg); } }
      const pa = gg.attributes.position.array, na = gg.attributes.normal.array, cnt = gg.attributes.position.count;
      const tone = 1 + (o.jit ?? 0.1) * (hash1(++part) * 2 - 1), kind = o.kind ?? 0;
      base.set(o.c ?? '#888888');
      const E = m4.elements, M = nm.elements, tint = o.tint, ao = o.ao, sway = o.sway, par = o.par ?? 0, br = base.r, bg = base.g, bb = base.b;
      grow(cnt);
      for (let i = 0, j = 0, w = nv * 3; i < cnt; i++, j += 3, w += 3) {
        const x = pa[j], y = pa[j + 1], z = pa[j + 2], a = na[j], b = na[j + 1], c = na[j + 2];
        const vx = E[0] * x + E[4] * y + E[8] * z + E[12], vy = E[1] * x + E[5] * y + E[9] * z + E[13], vz = E[2] * x + E[6] * y + E[10] * z + E[14];
        let nx = M[0] * a + M[3] * b + M[6] * c, ny = M[1] * a + M[4] * b + M[7] * c, nz = M[2] * a + M[5] * b + M[8] * c;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        P[w] = vx; P[w + 1] = vy; P[w + 2] = vz; N[w] = nx; N[w + 1] = ny; N[w + 2] = nz;
        let cr = br, cg = bg, cb = bb;
        if (tint) { col.copy(base); tint(vx, vy, vz, col); cr = col.r; cg = col.g; cb = col.b; }
        let k = tone; if (ao) k *= 0.5 + 0.5 * sstep(ao[0], ao[1], vy);
        if (ny < -0.5) k *= 0.6;
        C[w] = cr * k; C[w + 1] = cg * k; C[w + 2] = cb * k;
        K[w] = kind; K[w + 1] = sway ? sstep(sway[0], sway[1], vy) : par; K[w + 2] = 0;
      }
      nv += cnt;
      return api;
    },
    box(x, y, z, sx, sy, sz, c, o = {}) { return api.add(BOX, { p: [x, y, z], s: [sx, sy, sz], c, ...o }); },
    // upright cylinder or cone (r0 bottom, r1 top) centred at x, y, z; o.r turns it
    cyl(x, y, z, r0, r1, h, c, o = {}) {
      const sides = o.sides || 10, key = sides + ':' + (r1 / r0).toFixed(3) + (o.open ? 'o' : '');
      if (!cyls[key]) { cyls[key] = new THREE.CylinderGeometry(r1 / r0, 1, 1, sides, 1, !!o.open).toNonIndexed(); temps.push(cyls[key]); }
      return api.add(cyls[key], { p: [x, y, z], s: [r0, h, r0], c, ...o });
    },
    // a table or bench: thick top with an overhang, apron rails, square legs with feet, a low stretcher
    bench(x0, z0, x1, z1, top, c, o = {}) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, th = o.th ?? 0.5, leg = o.leg ?? 0.7, long = w > d;
      api.box(cx, top - th / 2, cz, w, th, d, c, { kind: 1, par: long ? 0 : 2 });
      api.box(cx, top - th - 0.45, cz, w - 1.2, 0.9, d - 1.2, c, { kind: 1, par: long ? 0 : 2, jit: 0.2, tint: (x, y, z, k) => k.multiplyScalar(0.7) });
      const nx = Math.max(2, Math.round(w / 9) + 1), nz = Math.max(2, Math.round(d / 9) + 1);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        if (i > 0 && i < nx - 1 && j > 0 && j < nz - 1) continue;
        const lx = x0 + 0.8 + (w - 1.6) * i / (nx - 1), lz = z0 + 0.8 + (d - 1.6) * j / (nz - 1);
        api.box(lx, (top - th) / 2, lz, leg, top - th, leg, c, { kind: 1, par: 1, ao: [0, 1.6], jit: 0.2 });
        api.box(lx, 0.15, lz, leg + 0.3, 0.3, leg + 0.3, c, { kind: 1, par: 1, tint: (x, y, z, k) => k.multiplyScalar(0.6) });
      }
      api.box(cx, 0.9, cz, long ? w - 1.6 : 0.4, 0.4, long ? 0.4 : d - 1.6, c, { kind: 1, par: long ? 0 : 2, tint: (x, y, z, k) => k.multiplyScalar(0.7) });
      return api;
    },
    // a bar from a to b: square section w by d (o.round: a rod of radius w / 2 with that many sides)
    beam(a, b, w, d, c, o = {}) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz) || 1e-3;
      bq.setFromUnitVectors(UP, bv.set(dx / len, dy / len, dz / len));
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      if (o.round) return api.cyl(mid[0], mid[1], mid[2], w / 2, (o.taper ?? 1) * w / 2, len, c, { sides: o.round, ...o, q: bq });
      return api.add(BOX, { p: mid, s: [w, len, d], c, ...o, q: bq });
    },
    // a part that is dealt but not laid (a cap is reached: CURL_CAP) still takes its number here, so every part added after it keeps the tone it would have had
    skip() { part++; return api; },
    get vertexCount() { return nv; },
    get positions() { return P; }, get K() { return K; },
    // a big merger cuts its four lists to length one at a time, handing the page back between them (wait: ctx.yield)
    async pack(wait) { const T = api.typed = []; for (const a of [P, N, C, K]) { T.push(a.slice(0, nv * 3)); await wait(); } },
    build() {
      const g = new THREE.BufferGeometry(), T = api.typed || [P, N, C, K].map((a) => a.slice(0, nv * 3));
      g.setAttribute('position', new THREE.BufferAttribute(T[0], 3)); g.setAttribute('normal', new THREE.BufferAttribute(T[1], 3));
      g.setAttribute('color', new THREE.BufferAttribute(T[2], 3)); g.setAttribute('aK', new THREE.BufferAttribute(T[3], 3));
      // the bounding sphere, worked out on the bare numbers (the box's middle, then the farthest corner from it: what three.js would find, sooner)
      { const p = T[0], n = p.length; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
        for (let i = 0; i < n; i += 3) { const x = p[i], y = p[i + 1], z = p[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
        if (n) { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2; let r2 = 0;
          for (let i = 0; i < n; i += 3) { const x = p[i] - cx, y = p[i + 1] - cy, z = p[i + 2] - cz, d = x * x + y * y + z * z; if (d > r2) r2 = d; }
          g.boundingBox = new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2)); }
        else g.computeBoundingSphere(); }
      for (const t of temps) t.dispose();
      return g;
    },
  };
  return api;
}

// The hall's one material: MeshStandardMaterial (so the wheel's two travelling lamps and the fog fall on everything)
// with procedural boards, grain, masonry, sawdust and paint spatter, pools of north light, gas glow and stirring cloth.
function makeHallMaterial(U) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
  mat.customProgramCacheKey = () => 'carousel-works-hall';
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec3 aK; varying vec3 vK; varying vec3 vWp; uniform float uTime;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if (aK.x > 3.5 && aK.x < 4.5) {
          float w = aK.y, ph = transformed.x * 0.31 + transformed.z * 0.23;
          transformed.x += w * (sin(uTime * 1.1 + ph) * 0.35 + sin(uTime * 2.3 + ph * 2.7 + transformed.y * 0.9) * 0.14);
          transformed.z += w * (cos(uTime * 0.9 + ph * 1.3) * 0.3 + sin(uTime * 2.9 + transformed.y * 1.3) * 0.1);
        }
        vK = aK; vWp = (modelMatrix * vec4(transformed, 1.)).xyz;\n`);
    const head = `varying vec3 vK; varying vec3 vWp; uniform float uTime;
      uniform vec3 uDeep, uEndCol, uRailCol, uRailCol2, uLowTone; uniform float uEndDim; uniform vec3 uDust, uGasCol, uDoorCol, uSpat1, uSpat2, uSpat3, uKey, uBlade, uSheen, uTone, uSweepCol, uPaintCol, uPaintFill; uniform vec2 uPool, uWall, uFloorLamp; uniform float uGlow, uDustK, uFloorWash;
      uniform sampler2D tLm; uniform vec4 uLm; uniform vec3 uGild;
      uniform vec4 uSLp[52]; uniform vec4 uSLc[52]; uniform float uSLn, uGoldA; uniform vec3 uGoldP, uGoldC, uPortalC, uArmAmb, uFogArm, uFogBay, uFogPaint;` + SHAFT_GLSL + `
      float hwHash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float hwHash2(vec2 p) { return hwHash(vec3(p, 3.7)); }
      float hwNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(hwHash(i), hwHash(i + vec3(1, 0, 0)), f.x), mix(hwHash(i + vec3(0, 1, 0)), hwHash(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hwHash(i + vec3(0, 0, 1)), hwHash(i + vec3(1, 0, 1)), f.x), mix(hwHash(i + vec3(0, 1, 1)), hwHash(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
      float hwLine(float d, float w, float fw) { return (1. - smoothstep(w, w + fw + 1e-5, d)) * clamp(w / max(fw, 1e-4), 0.3, 1.); }
      // how much of the east doors' opening a point of the bay sees (the angle it fills in plan, 0 to 1), less what the wheel's platform hides
      // noon, the east doors open: the sea's light lies in one broad band from the opening (x 75, z 30 to 62) north-west toward the mast,
      // hard-edged at the sill, its edges softening and its strength falling with distance (by place alone; the wheel's shader has the same)
      float hwDoor(vec2 p) {
        vec2 q = p - vec2(75., 46.); float s = dot(q, vec2(-0.852, -0.523)), t = dot(q, vec2(-0.523, 0.852)), w = 13.5 + 0.05 * s, e = 0.6 + 0.085 * s;
        return (1. - smoothstep(w - e, w + e, abs(t))) * smoothstep(-1.5, 0.5, s) * mix(1., 0.36, smoothstep(0., 92., s)) * (1. - smoothstep(84., 108., s)) * step(abs(p.x), 75.) * step(abs(p.y), 74.5);
      }
      // and what the lit boards throw back either side of the band, on low things: the racks beside the doors, the platform's flank
      float hwSpill(vec2 p) {
        vec2 q = p - vec2(75., 46.); float s = dot(q, vec2(-0.852, -0.523)), t = dot(q, vec2(-0.523, 0.852)), w = 13.5 + 0.05 * s;
        return (1. - smoothstep(w - 4., w + 26., abs(t))) * smoothstep(-8., 2., s) * mix(1., 0.4, smoothstep(0., 92., s)) * (1. - smoothstep(84., 108., s)) * step(abs(p.x), 75.) * step(abs(p.y), 74.5);
      }
      // the shadow of one gull wheeling outside the doors, thrown in on the boards: a body and two swept wings that beat, on a closed round
      float hwGull(vec2 p, float ph, float w, vec2 c0, vec2 rad) {
        float a = uTime * w + ph; vec2 c = c0 + rad * vec2(cos(a), sin(a)), t = vec2(-sin(a) * rad.x, cos(a) * rad.y) * sign(w); t /= max(length(t), 1e-3);
        vec2 q = p - c; float al = dot(q, t), ac = dot(q, vec2(-t.y, t.x)), span = 2.7 + 0.5 * sin(uTime * 4.6 + ph * 7.);
        float wing = 1. - smoothstep(0.6, 1.25, length(vec2((al + 0.2 * abs(ac)) / 0.62, ac / span)));
        return max(wing, 1. - smoothstep(0.6, 1.25, length(vec2(al / 1.45, ac / 0.42))));
      }\n`;
    sh.fragmentShader = head + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float hwKind = vK.x, hwGlowK = 0., hwFloor = 0., hwBladeK = 0., hwShaft = cwShaft(vWp), hwBoardT = 0.5, hwGapK = 0., hwDustK = 0., hwRailK = 0.; vec4 hwLm = vec4(0., 1., 0., 0.);
        float hwArmZ = smoothstep(76., 100., vWp.z);                                      // THE CARVING ARM, a zone of the hall: the dusk's own light, a warm pool under each lamp
        float hwPz = 1. - smoothstep(-82., -74., vWp.x);                                  // THE PAINT SHOP, a zone of the hall: a room of its own light
        float hwDz = 1. - smoothstep(-146., -130., vWp.x);                                // ITS LAST 40 m, the despatch end: deep-toned and dim, lit by small warm lamps, so the doorway's front and the portal glow
        if (vWp.x < -76.) hwShaft *= 1. - smoothstep(-46., -40., vWp.z);                 // the paint shop keeps its aisle clear of shafts
        if (vWp.z > 76.) hwShaft *= smoothstep(10., 16., abs(vWp.x));                    // and so does the entry axis
        float hwN1 = hwNoise(vWp * 0.21), hwN2 = hwNoise(vWp * 1.7), hwN3 = hwNoise(vWp * 7.3), hwPx = length(fwidth(vWp));
        hwN3 = mix(0.5, hwN3, clamp(1.5 - hwPx * 14., 0., 1.)); hwN2 = mix(0.5, hwN2, clamp(1.5 - hwPx * 3.5, 0., 1.));     // fine figure melts into one tone where it is finer than the picture's grid
        if (hwKind < 0.5) diffuseColor.rgb *= (0.82 + 0.3 * hwN2 + 0.1 * hwN3) * (1. + 0.22 * uPool.y * hwShaft);
        else if (hwKind < 1.5 || (hwKind > 3.5 && hwKind < 4.5)) {
          vec3 g = vK.y < 0.5 ? vWp * vec3(0.5, 7., 7.) : (vK.y < 1.5 ? vWp * vec3(7., 0.5, 7.) : vWp * vec3(7., 7., 0.5));
          if (hwKind > 3.5) g = vWp * vec3(9., 2., 9.);
          float gr = hwNoise(g), ring = 0.5 + 0.5 * sin(gr * 16. + hwN2 * 4.);
          diffuseColor.rgb *= (0.7 + 0.26 * gr + 0.16 * ring + 0.1 * hwN1) * (1. + 0.22 * uPool.y * hwShaft);
          if (hwKind > 3.5) { float fo = (vWp.x + vWp.z) * 0.9 + vWp.y * 0.35;                // a stirring cloth: its folds catch the light as they travel
            diffuseColor.rgb *= 1. + vK.y * (0.26 * sin(uTime * 1.5 + fo) + 0.14 * sin(uTime * 2.6 - fo * 2.3 + vWp.y)); }
          diffuseColor.rgb = min(diffuseColor.rgb, vec3(0.78, 0.71, 0.58));                 // pale timber stays cream, with its shade, in the brightest shaft
        } else if (hwKind < 2.5) {
          // DARK OILED BOARDS, 13 m by 1.5 m (four times life), each its own tone, with joints and a little grain that melt into one tone where
          // they are finer than the picture's grid. Nothing drawn on them is larger than a board: what is larger is light (the lamps' pools, the
          // shafts' feet, the oil's sheen) or comes from the plan (contact shade, swept sawdust).
          vec2 b = vec2(vWp.x / 13., vWp.z / 1.5); b.x += floor(b.y) * 0.37;
          vec2 f = fract(b), id = floor(b); vec2 fw = fwidth(b);
          float hwFine = clamp(1.4 - max(fw.y, fw.x * 5.) * 2.2, 0., 1.);
          float tone = mix(0.5, hwHash2(id), hwFine), grain = mix(0.5, hwNoise(vec3(vWp.x * 0.45, vWp.z * 9., tone * 9.)), hwFine);
          vec3 board = diffuseColor.rgb * (0.74 + 0.52 * tone) * (0.88 + 0.24 * grain);
          float gap = max(hwLine(min(f.y, 1. - f.y), 0.03, fw.y), hwLine(min(f.x, 1. - f.x), 0.004, fw.x));
          board *= 1. - 0.7 * gap;
          hwBoardT = tone; hwGapK = gap;
          hwLm = textureLod(tLm, (vWp.xz - uLm.xy) * uLm.zw, 0.);                       // the floor's plan: r lamp pools, g shade under what stands on it, b paint work, a swept sawdust
          float paint = hwPz;
          board = mix(board, board * (1.5 - 0.42 * uFloorWash) + vec3(0.01, 0.009, 0.007), paint * (1. - 0.7 * hwDz));          // scrubbed boards in the paint shop, a tone lighter
          // SAWDUST lies where it was swept: in low drifts along the feet of the benches, trestles and trolleys (the plan's a), soft-edged, thicker in the joints
          hwDustK = clamp(hwLm.a * (1. + 0.5 * gap) * uDustK, 0., 1.) * (1. - paint);
          board = mix(board, uDust * (0.88 + 0.24 * grain), hwDustK * 0.9);
          // PAINT under the conveyors' aisle runs, where the hung animals drip, and round the kettles and benches: crisp small drips and the rings
          // where pots stood, in the scheme's colours (nothing soft, nothing larger than a board)
          vec2 dc = vWp.xz / vec2(1.9, 1.3), di = floor(dc); float dr = hwHash2(di + 5.3), dr2 = hwHash2(di + 9.9), dfw = fwidth(dc.x) + fwidth(dc.y);
          float dd = length((fract(dc) - 0.5 - (vec2(dr2, hwHash2(di + 1.7)) - 0.5) * 0.7) * vec2(1.9, 1.3)), drad = 0.07 + 0.2 * dr * dr;
          float dhere = hwLm.b * hwLm.b;
          float drip = (1. - smoothstep(drad, drad + 0.02 + dfw, dd)) * step(dr2, dhere * 0.8);
          float ringm = (1. - smoothstep(0.03, 0.04 + dfw, abs(dd - 0.3))) * step(0.72, dr) * step(dr2, dhere * 1.1);
          vec3 dcol = dr > 0.66 ? uSpat2 : (dr > 0.33 ? uSpat3 : uSpat1);
          board = mix(board, dcol * 0.62, max(drip, ringm * 0.8) * 0.85 * paint * clamp(1.6 - dfw * 3., 0., 1.));
          // THE SHOP'S RAILWAY, the way the work travels: two iron rails 2.4 m apart, each a dark foot with a worn bright head, up the arm
          // (x 5.5, z 50.7 to 207) and down the paint aisle (z -41, x -30.3 west through the freight doorway)
          float hwTc = abs(vWp.x - 5.5) + max(0., 50.7 - vWp.z) * 9. + max(0., vWp.z - 207.) * 9.;
          hwTc = min(hwTc, abs(vWp.z + 41.) + max(0., vWp.x + 30.3) * 9. + max(0., -215. - vWp.x) * 9.);
          float hwFwT = fwidth(hwTc) + 1e-4;
          board = mix(board, board * 0.62, (1. - smoothstep(0.9, 1.9, hwTc)) * 0.6);                                   // the way between the rails is trodden dark
          board = mix(board, vec3(0.02, 0.019, 0.018), hwLine(abs(hwTc - 1.2), 0.34, hwFwT) * 0.9);                   // the rail's foot and the shade beside it
          hwRailK = hwLine(abs(hwTc - 1.2), 0.13, hwFwT);
          board = mix(board, uRailCol2 * 0.5, hwRailK);                                                               // its head
          board *= hwLm.g;
          board *= uPool.x + uPool.y * hwShaft;                                                                       // pools where the north shafts land
          // the pale blade each roof tooth's north glass lays across the boards by day (the glass rises 10 m over 5; the light falls 1 south in 2),
          // ruled by the glazing bars and cut by the truss between one tooth and the next
          float hwPitch = vWp.z > 75. ? 27. : (vWp.x < -75. ? 20. : 25.), hwZ0 = vWp.z > 75. ? 75. : (vWp.x < -75. ? -71. : -75.);
          float hwBd = abs(mod((vWp.z - hwZ0) - 22. + 0.5 * hwPitch, hwPitch) - 0.5 * hwPitch);
          float hwBlade = (1. - smoothstep(3.6, 5.2, hwBd)) * (0.5 + 0.5 * smoothstep(0.12, 0.5, abs(fract(vWp.x / 3.75) - 0.5) * 3.75));
          hwBlade *= 0.4 + 0.6 * smoothstep(0.2, 0.8, abs(fract(vWp.x / 15. + 0.5) - 0.5) * 15.);
          diffuseColor.rgb = board;
          hwBladeK = hwBlade * (1. - 0.6 * hwDustK);
          // THE SEA LIGHT THROUGH THE OPEN EAST DOORS (x 75, z 30 to 62), a rule of place: one broad white band lies on the boards from the sill
          // north-west toward the mast (hwDoor), hard-edged by the doors, softer and weaker as it goes. In it wheel the shadows of the gulls
          // outside the doors.
          float door = hwDoor(vWp.xz) * hwLm.g;
          float gull = max(max(hwGull(vWp.xz, 0.3, 0.23, vec2(57., 45.), vec2(13., 9.)), hwGull(vWp.xz, 2.9, -0.19, vec2(53., 36.), vec2(10., 12.))),
                           max(hwGull(vWp.xz, 4.4, 0.16, vec2(61., 30.), vec2(9., 14.)), hwGull(vWp.xz, 1.7, -0.27, vec2(49., 48.), vec2(8., 6.))));
          gull = max(gull, max(hwGull(vWp.xz, 5.3, 0.2, vec2(45., 30.), vec2(11., 7.)), hwGull(vWp.xz, 3.6, -0.22, vec2(52., 26.), vec2(7., 10.))));
          hwGlowK = door * (1. - 0.72 * gull) * (0.75 + 0.25 * tone) * (0.8 + 0.2 * grain) * (1. - 0.5 * gap);
          hwFloor = 1.;
        } else if (hwKind < 3.5) {
          float hi = smoothstep(8.6, 9.0, vWp.y);
          vec2 uvw = vec2(vWp.x + vWp.z, vWp.y);
          vec2 br = vec2(uvw.x / 2.4, uvw.y / 0.8); br.x += floor(br.y) * 0.5; vec2 bf = fract(br), bi = floor(br); vec2 bw = fwidth(br);
          float mortar = max(hwLine(min(bf.y, 1. - bf.y), 0.07, bw.y), hwLine(min(bf.x, 1. - bf.x), 0.025, bw.x));
          float hwBf = clamp(1.3 - max(bw.x, bw.y) * 2.4, 0., 1.);                                   // courses and single bricks soften into the wall's own tone with distance
          vec3 brick = diffuseColor.rgb * mix(0.97, 0.72 + 0.5 * hwHash2(bi), hwBf) * (0.85 + 0.3 * hwN3) * (1. - 0.4 * mortar * (0.35 + 0.65 * hwBf));
          vec2 pl = vec2(uvw.x / 1.6, uvw.y); vec2 pf = fract(pl);
          vec3 plank = diffuseColor.rgb * (0.66 + 0.5 * hwHash2(vec2(floor(pl.x), 2.))) * (0.8 + 0.4 * hwNoise(vec3(uvw.x * 6., uvw.y * 0.5, 1.)));
          plank *= 1. - 0.7 * hwLine(min(pf.x, 1. - pf.x), 0.02, fwidth(pl.x));
          plank *= 1. - 0.5 * smoothstep(8.2, 8.6, vWp.y) * (1. - hi);
          diffuseColor.rgb = mix(plank, brick, hi) * (0.8 + 0.4 * hwN1) * mix(mix(uWall.x, uWall.y, smoothstep(7., 30., vWp.y)), 1., 0.15 * smoothstep(70., 110., vWp.z)) * (1. - 0.2 * smoothstep(76., 100., vWp.z));
          // the paint shop's walls are limewashed over the brick, and its dado is painted pale
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.47, 0.4) * mix(0.92, 0.82 + 0.2 * hwHash2(bi), hwBf) * (1. - 0.3 * mortar * hi * hwBf) * (0.9 + 0.2 * hwN1), hwPz * mix(0.5, 0.86, hi));
          // the despatch end: a deep dado in the scheme's dark colour to 9 m under a lined rail, and the limewash above it left in shade
          float hwDado = 1. - smoothstep(8.9, 9.1, vWp.y), hwLineY = (1. - smoothstep(0.1, 0.16, abs(vWp.y - 9.35))) + 0.6 * (1. - smoothstep(0.05, 0.09, abs(vWp.y - 8.3)));
          vec3 hwDeepC = mix(diffuseColor.rgb * vec3(0.62, 0.56, 0.5), uDeep * (0.75 + 0.5 * hwHash2(vec2(floor(pl.x), 5.))) * (0.8 + 0.4 * hwN1) * (1. - 0.5 * hwLine(min(pf.x, 1. - pf.x), 0.02, fwidth(pl.x))), hwDado);
          hwDeepC = mix(hwDeepC, uRailCol, clamp(hwLineY, 0., 1.) * 0.9);
          diffuseColor.rgb = mix(diffuseColor.rgb, hwDeepC, hwDz);
          float hwShed = 1. - smoothstep(-178.6, -177.4, vWp.x);                                    // the loading shed beyond the doorway: dark upright boarding with a ledger rail
          if (hwShed > 0.) { float sb = (vWp.x + vWp.z) / 0.9, sf = min(fract(sb), 1. - fract(sb));
            vec3 hwShedC = vec3(0.2, 0.15, 0.105) * (0.7 + 0.6 * hwHash2(vec2(floor(sb), 9.))) * (1. - 0.6 * hwLine(sf, 0.04, fwidth(sb))) * (1. - 0.5 * hwLine(abs(vWp.y - 10.), 0.3, fwidth(vWp.y)));
            diffuseColor.rgb = mix(diffuseColor.rgb, hwShedC, hwShed); }
        }
        if (hwKind > 0.5 && hwKind < 4.5) diffuseColor.rgb *= mix(vec3(1.), uTone, hwKind > 1.5 && hwKind < 3.5 ? 0.55 : 1.);    // boards and brick keep more of their own warmth
        if (hwKind < 4.5) diffuseColor.rgb *= mix(uLowTone, vec3(1.), max(max(smoothstep(13., 27., vWp.y), hwPz), hwArmZ));   // below the lamps the hall keeps its own umber in every look: the dusk's blue lives in the roof
        vec3 hwAlb = diffuseColor.rgb * (0.8 + 0.2 * smoothstep(-178., -176.5, vWp.x)); diffuseColor.rgb *= mix(1., uEndDim, hwDz) * (0.6 + 0.4 * smoothstep(-178., -176.5, vWp.x));
        diffuseColor.rgb *= mix(vec3(1.), uArmAmb, hwArmZ);                    // the despatch end stands in shade: only its own lamps light it\n`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = hwKind < 0.5 ? 0.6 : 0.9;\n')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 hwNw = inverseTransformDirection(normal, viewMatrix);
        // the lamps: floors read their pools from the plan (a soft warm disc under each lamp on the dark boards); everything else carries what was
        // worked out for it where it stands, and below 9 m it is lit from above, so tops are bright and sides fall off
        // (by day the pools draw in: where several lamps' skirts overlap into one even field, as down the paint aisle, only their cores stay lit)
        float hwLampK = hwFloor > 0.5 ? (uFloorLamp.x + uFloorLamp.y * hwLm.r * mix(1., hwLm.r * (1. - 0.3 * hwPz), uFloorWash) * 1.5) * (0.35 + 0.65 * hwLm.g)
          : vK.z * mix(1., 0.62 + 0.5 * max(hwNw.y, 0.), 1. - smoothstep(5., 9., vWp.y));
        if (hwKind > 2.5 && hwKind < 3.5) {
          hwLampK += min(0.8, textureLod(tLm, (vWp.xz + hwNw.xz * 3. - uLm.xy) * uLm.zw, 0.).r * 1.1) * (1. - smoothstep(8., 19., vWp.y));   // a wall takes the pool that lies at its foot
          // the arm's two brick walls, bay by bay: each bay's pendant and bracket lamp (z 88.5 and every 27 m) wash its wall from the wainscot up to the truss line,
          // and between two bays the wall falls back into the dusk
          float hwBay = abs(mod(vWp.z - 75., 27.) - 13.5);
          hwLampK += hwArmZ * step(30., abs(vWp.x)) * 0.8 * exp(-hwBay * hwBay / 62.) * smoothstep(1., 9., vWp.y) * (1. - smoothstep(20., 33., vWp.y));
        }
        // the lit boards throw a little of the lamps back up under the roof: slopes, purlins and chords take it on their undersides
        if (hwFloor < 0.5 && hwKind < 2.5) hwLampK += (uFloorLamp.x * 1.7 + 0.3 * hwPz) * smoothstep(19., 26., vWp.y) * (0.3 + 0.7 * max(-hwNw.y, 0.)) * (1. - 0.6 * hwArmZ);
        vec3 hwOil = mix(hwAlb, hwAlb * 0.8 + vec3(0.024, 0.02, 0.014), hwFloor);
        // the lamps' colour goes by the zone of the hall: amber gas in the carving shop and the wheel bay, white-shaded lamps in the paint shop,
        // whose light also fills its whole room
        totalEmissiveRadiance += hwOil * mix(mix(uGasCol, uPaintCol, hwPz), uEndCol, hwDz) * hwLampK + diffuseColor.rgb * uPaintFill * hwPz * (1. - 0.5 * hwDz) * (1. - 0.85 * uFloorWash * hwFloor)
          + uDoorCol * hwGlowK * (0.12 + diffuseColor.rgb * 4.5 + 2.2 * dot(diffuseColor.rgb, vec3(0.4, 0.4, 0.2)));
        if (hwFloor < 0.5 && hwKind < 4.5) {                                                        // whatever stands in the bay takes the doors' light on the faces turned to them, and low things a little of it back off the lit boards
          vec3 hwDl = vec3(75. - vWp.x, 0.3 * (abs(75. - vWp.x) + abs(46. - vWp.z)) + 1., 46. - vWp.z); hwDl /= max(length(hwDl), 1e-3);
          totalEmissiveRadiance += diffuseColor.rgb * uDoorCol * ((0.4 * hwDoor(vWp.xz) * (0.15 + 0.85 * max(dot(hwNw, hwDl), 0.)) * (1. - smoothstep(12., 27., vWp.y))
            + 0.2 * hwSpill(vWp.xz) * (1. - smoothstep(1., 15., vWp.y))) * (1. - hwPz));
        }
        if (hwKind > 4.5) totalEmissiveRadiance += vColor.rgb * vK.y * uGlow;
        float hwRr = length(vWp.xz); vec2 hwGd = vWp.xz / max(hwRr, 1e-3);
        float hwBayZ = (1. - hwPz * 0.85) * (1. - 0.8 * hwArmZ);                                    // the wheel's light belongs to its bay: it reaches a little way into either arm
        if (hwKind < 4.5) {
          // THE WHEEL'S LIT QUARTER FILLS THE BAY (by its place, uGoldP, which turns with the wheel): a broad gold light on whatever faces it, floor,
          // walls, racks, trusses and the roof's underside, strongest near it and falling off to the bay's far corners
          vec3 hwGv = uGoldP - vWp; float hwG2 = dot(hwGv, hwGv); vec3 hwGn = hwGv * inversesqrt(max(hwG2, 1.));
          totalEmissiveRadiance += hwOil * uGoldC * ((0.22 + 0.78 * max(dot(hwNw, hwGn), 0.)) / (1. + hwG2 / 2600.) * hwBayZ * (1. - 0.8 * hwFloor));   // (the dark boards give little of it back as a wash: they mirror it, below)
          // and it sweeps the hall like a slow lighthouse: a stronger lobe on its bearing, on whatever faces the wheel
          float hwSw = max(dot(hwGd, uGild.xy), 0.); hwSw *= hwSw; hwSw *= hwSw;
          vec3 hwSl = vec3(-hwGd.x * 0.9, 0.44, -hwGd.y * 0.9);
          totalEmissiveRadiance += hwOil * uSweepCol * (uGild.z * hwSw * smoothstep(41., 47., hwRr) / (1. + hwRr * hwRr / 9000.) * max(dot(hwNw, hwSl), 0.) * (1. - 0.8 * hwFloor));
          // MIRROR GLINTS: each bevelled mirror of the lit quarter throws one broad soft patch of lamplight on the walls, the racks and the roof's
          // slopes, at its own height; the patches wheel round the bay with the wheel's bearing, slowly and softly (no patch is brighter than a lamp's pool)
          if (hwFloor < 0.5) {
            float hwGa = atan(vWp.z, abs(vWp.x) < 1e-4 ? 1e-4 : vWp.x) - uGoldA; hwGa -= 6.2831853 * floor(hwGa / 6.2831853 + 0.5);
            float hwGc = hwGa * 6., hwGi = floor(hwGc), hwGh = hwHash2(vec2(hwGi, 3.));
            vec2 hwGq = vec2((fract(hwGc) - 0.5) / 6. * hwRr, vWp.y - (7. + 20. * hwGh)) / vec2(3.2, 3.8);
            float hwGl = exp(-dot(hwGq, hwGq)) * (1. - smoothstep(0.45, 0.8, abs(hwGa))) * smoothstep(47., 60., hwRr) * (1. - hwPz) * (1. - hwArmZ);
            totalEmissiveRadiance += (hwAlb * 1.6 + vec3(0.012, 0.008, 0.003)) * uGoldC * (0.42 * hwGl * max(dot(hwNw, hwSl) + 0.25, 0.));
          }
          // THE PORTAL'S GOLD on whatever faces it in the despatch end and down the aisle
          vec3 hwPv = vec3(-170., 12., -41.) - vWp; float hwP2 = dot(hwPv, hwPv);
          totalEmissiveRadiance += hwOil * uPortalC * (max(dot(hwNw, hwPv * inversesqrt(max(hwP2, 1.))), 0.) / (1. + hwP2 / 700.) * hwPz * step(-176., vWp.x) * (1. - 0.5 * uFloorWash * hwFloor));
        }
        if (hwFloor > 0.5) {
          // THE OILED SHEEN (it reads the eye, as the kit's water does; the head comment names everything here that does): the boards mirror the hall's lights. Each light of the
          // list (uSLp: place and size; uSLc: colour and room) is seen in the floor where the eye's line to its image under the boards crosses them,
          // and the satin of the oil draws that image out into a long soft streak toward the eye, a little out of true board by board, never
          // white. A light is mirrored only in boards it can shine on: in its own room, or through the mouth between two rooms.
          vec3 hwEv = vWp - cameraPosition; float hwEh = max(length(hwEv.xz), 1e-3); vec2 hwVh = hwEv.xz / hwEh; float hwTv = hwEv.y / hwEh;
          float hwRoom = vWp.z > 75. ? 0. : (vWp.x < -75. ? 2. : 1.), hwTw = (hwBoardT - 0.5) * 0.012;
          vec3 hwStk = vec3(0.);
          for (int i = 0; i < 52; i++) {
            if (float(i) >= uSLn) break;
            vec4 lp = uSLp[i], lc = uSLc[i];
            vec3 d = vec3(lp.x, -lp.y, lp.z) - cameraPosition;
            float ih = inversesqrt(max(dot(d.xz, d.xz), 0.01)), tl = d.y * ih, sz = abs(lp.w) * ih;
            vec2 dh = d.xz * ih;
            float hwFar = smoothstep(55., 170., 1. / ih);                                  // a far lamp's streak widens and fades: the far lamps run together into one low band, stepped board by board
            float az = hwVh.x * dh.y - hwVh.y * dh.x + hwTw * (1. + 5. * hwFar), el = hwTv - tl;
            float sa = sz + 0.011 + 0.05 * hwFar, se = el < 0. ? 0.05 - 0.36 * tl : 0.03 - 0.3 * tl + sz;
            float vis = step(0., dot(hwVh, dh));
            if (lc.a != hwRoom) {
              if (lc.a + hwRoom == 1.) { float dz = lp.z - vWp.z; float t = (75. - vWp.z) / (abs(dz) < 1e-3 ? 1e-3 : dz); vis *= 1. - smoothstep(29., 33., abs(vWp.x + t * (lp.x - vWp.x))); }
              else if (lc.a + hwRoom == 3.) { float dx = lp.x - vWp.x; float t = (-75. - vWp.x) / (abs(dx) < 1e-3 ? 1e-3 : dx); vis *= 1. - smoothstep(24., 28., abs(vWp.z + t * (lp.z - vWp.z) + 41.)); }
              else vis = 0.;
            }
            if (lp.w < 0.) vis *= smoothstep(-0.25, 0.45, dot(vWp.xz, lp.xz) / (max(hwRr, 1.) * 41.));     // a light on the wheel is hidden from the far side by the wheel itself
            hwStk += lc.rgb * (exp(-az * az / (sa * sa) - el * el / (se * se)) * vis * (1. - 0.45 * hwFar) / (1. + 1. / (ih * ih * 9000.)));
          }
          float hwCv = abs(hwTv) * inversesqrt(1. + hwTv * hwTv), hwFr = 1. - hwCv; hwFr *= hwFr;
          float hwSat = (0.86 + 0.28 * hwBoardT) * (1. - 0.9 * hwDustK) * (1. - 0.5 * hwGapK) * hwLm.g;
          totalEmissiveRadiance += hwStk * ((0.07 + 0.93 * hwFr) * hwSat + 1.2 * hwRailK * hwLm.g);
          totalEmissiveRadiance += uSheen * ((0.01 + 0.2 * hwFr * hwFr) * hwSat + 0.03 * hwRailK);            // and the roof glass lies in the oil as a cool sheen, strongest far off
        }
        totalEmissiveRadiance += diffuseColor.rgb * (uKey * (max(dot(hwNw, vec3(0., 0.8, -0.6)), 0.) * 0.318 * (1. - uFloorWash * hwFloor)) + uBlade * hwBladeK);\n`)
      .replace('#include <opaque_fragment>', `
        // THE BOARDS STAY DARK BY DAY: of the glass's even wash (the hemisphere, and the north key above) the oiled boards give back only a
        // share (uFloorWash is what is withheld); the day reaches them as the shafts' pools, the roof's blades, the lamps' discs and the sheen
        if (hwFloor > 0.5) outgoingLight = max(outgoingLight - uFloorWash * reflectedLight.indirectDiffuse, vec3(0.));
        #include <opaque_fragment>\n`)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          // the haze goes by the place of what is seen through it: blue-grey in the carving arm, the wheel's own gold in the bay, pale in the paint shop
          float hwFogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          vec3 hwFogC = mix(mix(uFogBay, uFogArm, smoothstep(72., 100., vWp.z)), uFogPaint, 1. - smoothstep(-96., -72., vWp.x));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, hwFogC, hwFogK);
        #endif\n`);
  };
  return mat;
}

// Glass and what is beyond openings: the sawtooth roof's north glass (mode 0), the sea beyond the east doors (1),
// the dim loading shed's high lights (2). uv is in metres.
function makeViewMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: false, side: THREE.DoubleSide,
    vertexShader: `attribute float aMode; varying vec2 vUv; varying float vMode; varying vec3 vWp;
      void main() { vUv = uv; vMode = aMode; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `varying vec2 vUv; varying float vMode; varying vec3 vWp;
      uniform vec3 uZen, uHor, uCloud, uSea, uFogCol; uniform float uTime, uFogD, uGain, uSeaGain, uDusk, uCloudK;
      float h2(vec2 p) { p = fract(p * vec2(0.3183, 0.3671) + 0.137); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x * p.y * 43.3); }
      float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec3 c; vec2 fw = fwidth(vUv);
        if (vMode < 0.5) {
          vec2 q = vec2(vWp.x * 0.018 + uTime * 0.012, vWp.z * 0.02 + vUv.y * 0.05);
          float cl = n2(q) * 0.55 + n2(q * 2.3 + 3.1) * 0.3 + n2(q * 5.1 + uTime * 0.02) * 0.15;
          c = mix(uHor, uZen, clamp(vUv.y / 11., 0., 1.));
          vec3 cloudC = uCloud;
          if (uDusk > 0.5) {
            // THE DUSK SKY, by the direction it is seen in (a sky has depth: it does not ride on the glass): deep blue in every pane, the first
            // stars high up, and only low toward the west-north-west a band of rose afterglow that turns amber lowest (the paint shop's lights
            // and the bay's west panes show it; the carving arm's glass is blue)
            vec3 vd = normalize(vWp - cameraPosition); float el = clamp(vd.y, 0., 1.), west = max(dot(normalize(vd.xz + 1e-4), vec2(-0.8, -0.6)), 0.); west *= west * west;
            c = mix(uHor, uZen * 0.75, smoothstep(0.06, 0.7, el));
            float glow = (1. - smoothstep(0.05, 0.36, el)) * west;
            c = mix(c, vec3(0.72, 0.3, 0.3), glow * 0.78) + vec3(0.8, 0.42, 0.12) * (1. - smoothstep(0.02, 0.2, el)) * west * 0.5;
            cloudC = mix(uCloud, vec3(0.8, 0.4, 0.34), glow);
            vec2 sg = vec2(atan(vd.z, vd.x) * 34., el * 52.), si = floor(sg); float sw = fwidth(sg.x) + fwidth(sg.y), sr = h2(si);
            float star = step(0.86, sr) * (1. - smoothstep(0.05, 0.11 + sw, length(fract(sg) - 0.5 - (vec2(h2(si + 3.1), h2(si + 7.7)) - 0.5) * 0.6)));
            c += vec3(0.75, 0.8, 1.0) * star * (0.4 + 0.6 * h2(si + 1.3)) * smoothstep(0.34, 0.62, el) * clamp(1.4 - sw * 2.4, 0., 1.) * (1. - smoothstep(0.4, 0.6, cl));
          }
          c = mix(c, cloudC, smoothstep(0.45, 0.78, cl) * uCloudK);
          float bx = abs(fract(vUv.x / 3.75) - 0.5) * 3.75, by = abs(fract(vUv.y / 3.73) - 0.5) * 3.73;
          float bar = max((1. - smoothstep(0.13, 0.13 + fw.x + 1e-5, bx)) * clamp(0.26 / max(fw.x, 1e-4), 0.25, 1.), (1. - smoothstep(0.1, 0.1 + fw.y + 1e-5, by)) * clamp(0.2 / max(fw.y, 1e-4), 0.25, 1.));
          c *= uGain * (1. - 0.8 * bar) * (0.82 + 0.18 * n2(vUv * 0.6 + vWp.xz * 0.1));
          c = 1.12 * (1. - exp(-c * 1.15));                                             // glass is toned sky, never a white sheet
        } else if (vMode < 1.5) {
          float y = vUv.y;                                                              // metres above the floor, seen far off
          vec3 sky = mix(uHor * 1.25, uZen, smoothstep(10., 34., y));
          float gl = n2(vec2(vUv.x * 0.9, y * 6. - uTime * 0.5)) * n2(vec2(vUv.x * 2.7 + uTime * 0.3, y * 13.));
          vec3 sea = uSea * (0.75 + 2.6 * gl * gl) * (0.5 + 0.5 * smoothstep(0., 10., y));
          c = mix(sea, sky, smoothstep(9.6, 10.2, y)) * uSeaGain;
        } else {
          c = uHor * 0.16 * uGain * (0.6 + 0.4 * n2(vUv * 0.7)) * step(0.12, fract(vUv.x / 3.));
        }
        float fogK = 1. - exp(-uFogD * uFogD * dot(vWp - cameraPosition, vWp - cameraPosition));
        gl_FragColor = vec4(mix(c, uFogCol, fogK * 0.6), 1.);
      }`,
  });
}

// quads for the view material: each { a, b, c, d (corners, a-b along the bottom), w, h (metres for uv), mode }
function buildViewGeometry(quads) {
  const P = [], UV = [], M = [];
  for (const q of quads) {
    const pts = [q.a, q.b, q.c, q.a, q.c, q.d], uv = [[0, 0], [q.w, 0], [q.w, q.h], [0, 0], [q.w, q.h], [0, q.h]];
    for (let i = 0; i < 6; i++) { P.push(pts[i][0], pts[i][1], pts[i][2]); UV.push(uv[i][0], uv[i][1]); M.push(q.mode); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aMode', new THREE.Float32BufferAttribute(M, 1)); g.computeBoundingSphere();
  return g;
}

// Shafts of light with sawdust hanging in them: three fixed planes crossed on each shaft's axis, soft-edged, so a shaft looks the
// same from any side and nothing in it turns to, or fades for, the eye. items: [{ a: top, b: foot, w0, w1 (half widths), gain, seed,
// col: [r, g, b] }]. One draw call.
function makeShafts(items, time) {
  const P = [], UV = [], PAR = [], C = [], I = [];
  for (const it of items) {
    const ax = [it.b[0] - it.a[0], it.b[1] - it.a[1], it.b[2] - it.a[2]], len = Math.hypot(ax[0], ax[1], ax[2]) || 1e-3; ax[0] /= len; ax[1] /= len; ax[2] /= len;
    let u = [0, ax[2], -ax[1]]; const ul = Math.hypot(u[0], u[1], u[2]) || 1; u = [u[0] / ul, u[1] / ul, u[2] / ul];        // across the axis, in the plane of the fall
    const v = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]];
    for (let k = 0; k < 3; k++) {
      const an = k * Math.PI / 3 + it.seed * 1.3, c = Math.cos(an), sn = Math.sin(an), sd = [u[0] * c + v[0] * sn, u[1] * c + v[1] * sn, u[2] * c + v[2] * sn], base = P.length / 3;
      for (const [x, t] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) {
        const w = it.w0 + (it.w1 - it.w0) * t, q = t ? it.b : it.a;
        P.push(q[0] + sd[0] * x * w, q[1] + sd[1] * x * w, q[2] + sd[2] * x * w); UV.push(x, t); PAR.push(it.gain, it.seed + k * 0.37, w, len); C.push(it.col[0], it.col[1], it.col[2]);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aPar', new THREE.Float32BufferAttribute(PAR, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: time, uGain: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `attribute vec4 aPar; attribute vec3 aCol; uniform float uGain; varying vec2 vUv; varying vec4 vPar; varying vec3 vCol;
      void main() { vUv = uv; vPar = vec4(aPar.x * uGain, aPar.yzw); vCol = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec4 vPar; varying vec3 vCol;
      float h2(vec2 p) { p = fract(p * vec2(0.3183, 0.3671) + 0.137); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x * p.y * 43.3); }
      float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        float x = vUv.x, t = vUv.y, prof = 1. - x * x; prof *= prof;
        float ends = smoothstep(0., 0.05, t) * (1. - 0.4 * t) * smoothstep(0., 0.09, 1. - t);
        float streak = 0.62 + 0.38 * n2(vec2(x * 2.6 + vPar.y * 17., t * 1.6 - uTime * 0.012)) + 0.25 * n2(vec2(x * 7. + vPar.y * 5., t * 0.7 + uTime * 0.02)) - 0.12;
        vec2 q = vec2(x * vPar.z, t * vPar.w) / 0.5 + vPar.y * 31.; q.y -= uTime * 0.07; q.x += 0.35 * sin(uTime * 0.13 + q.y * 0.7);
        vec2 qw = fwidth(q); vec2 id = floor(q), f = fract(q) - 0.5; float rnd = h2(id);
        float mote = (1. - smoothstep(0.035, 0.12, length(f - (vec2(h2(id + 3.1), h2(id + 7.7)) - 0.5) * 0.7))) * step(0.45, rnd);
        mote *= (0.55 + 0.45 * sin(uTime * (0.8 + rnd * 2.) + rnd * 40.)) * clamp(1. - (qw.x + qw.y) * 2.2, 0., 1.);   // specks too fine for the picture's grid melt into the streaks
        gl_FragColor = vec4(vPar.x * prof * ends * (vCol * streak + vec3(1., 0.88, 0.66) * mote * 2.2), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'shafts'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---- 7 looks -------------------------------------------------------------------------------------------------
// floor: board albedo; dust: how much pale sawdust lies on it; pool: [floor base, gain where a shaft lands]; wall: [wainscot, upper brick];
// rack: tone of rack timber and dust sheets; shaft: what the wheel's own shaders get [ambient share, gain inside a shaft, shade on the wall racks];
// raysK: brightness of the visible shafts; door: sea glare through the open east doors; gasWheel: the light of the bay's ring of twelve pendants on the wheel
// (its rim stands nearest them); roof: the bay's roof glass on the wheel's crown, above its cranks, and along the backs of the rack spares; plank: tint of its boards;
// gas: how bright the pendants and bench lamps burn (they burn low by day); blade: the pale blades the roof glass lays across the floor;
// floorWash: how much of the glass's even wash the oiled boards withhold by day (0 in the evening); cloudK: the cloud's cover in the
// glass (0.8 unless given); cap: the ceiling bare and primed wood is eased under (0.3 unless given);
// lampFloor: [the lamps' even glow on the boards, the gain of a pool]; sheen: the glass in the oil of the boards; tone: a tint on timber, boards
// and brick (cool by day); sweep: how strongly the wheel's lit quarter sweeps the hall; paint: the colour and strength of the paint shop's
// white-shaded lamps and the fill they give that whole room (the third light of the flight, by zone of the hall).
const LOOKS = {
  morning: { name: 'morning', fog: '#43597c', fogD: 0.0022, fogArm: '#3e5878', fogBay: '#586e8a', fogPaint: '#70767c', armAmb: [0.86, 0.92, 1.0], gold: 1.2, streak: 0.8, hemiSky: '#d6e4f2', hemiGround: '#2c3038', hemiK: 2.6, keyCol: '#eaf2fc', keyK: 2.5,
    zen: '#3f86e0', hor: '#9ccdf5', cloud: '#f4f8fb', cloudK: 0.5, glass: 1.15, floor: '#4a3424', dust: 0.5, pool: [1.0, 3.2], floorWash: 0.72, wall: [0.66, 1.0], rack: 0.55, shaft: [0.95, 0.8, 0.36], cap: 0.42,
    gasWheel: [1.5, 1.38, 1.2], roof: [0.85, 0.95, 1.1], rays: '#d6e6f4', raysK: 0.26, gas: 0.4, blade: [0.85, 1.05, 1.4], door: 0, bulbs: 1, exposure: 1.0,
    lampFloor: [0.03, 2.6], sheen: [0.42, 0.52, 0.72], tone: [0.96, 0.99, 1.04], sweep: 1.5, paint: [1.12, 1.09, 1.0], paintFill: [0.3, 0.29, 0.265], endLamp: 1.9, endDim: 0.36,
    grade: { saturation: 1.14, contrast: 1.07, tint: '#eef5ff', shadowTint: '#06080c', vignette: 0.32, grain: 0.02 } },
  evening: { name: 'evening', fog: '#2a3350', fogD: 0.0030, fogArm: '#27396c', fogBay: '#8a6a3c', fogPaint: '#807a6a', armAmb: [0.6, 0.72, 1.0], gold: 1.7, streak: 0.55, hemiSky: '#6c80d2', hemiGround: '#474e7c', hemiK: 3.4, keyCol: '#6a7fc0', keyK: 1.1,
    zen: '#16286a', hor: '#3452b4', cloud: '#34468c', glass: 1.4, floor: '#6a4c32', dust: 0.8, pool: [0.95, 0.5], wall: [0.95, 0.9], rack: 1, shaft: [1.1, 0.12, 0.42],
    gasWheel: [1.5, 1.1, 0.52], roof: [0.42, 0.37, 0.38], plank: [1.12, 0.96, 0.72],
    rays: '#5870b8', raysK: 0.06, gas: 1, blade: [0.012, 0.018, 0.04], door: 0, bulbs: 1, exposure: 1.2, lowTone: [1.12, 0.74, 0.44],
    lampFloor: [0.03, 1.5], sheen: [0.1, 0.17, 0.46], tone: [1, 1, 1], sweep: 2.0, paint: [1.72, 1.64, 1.44], paintFill: [0.2, 0.2, 0.185], endLamp: 2.3, endDim: 0.42,
    grade: { saturation: 1.12, contrast: 1.05, tint: '#fff6ea', shadowTint: '#050814', vignette: 0.34, grain: 0.022 } },
  noon: { name: 'noon', fog: '#6e6a62', fogD: 0.0024, fogArm: '#666660', fogBay: '#76705f', fogPaint: '#7e7a70', armAmb: [0.8, 0.86, 0.98], gold: 1.0, streak: 0.75, hemiSky: '#f3eee2', hemiGround: '#3a342e', hemiK: 2.15, keyCol: '#fff3dc', keyK: 2.75,
    zen: '#8fbbe6', hor: '#f6f3e8', cloud: '#ffffff', glass: 1.75, floor: '#4a3424', dust: 0.5, pool: [1.0, 3.2], floorWash: 0.7, wall: [0.76, 1.08], rack: 0.6, shaft: [0.74, 0.7, 0.5],
    gasWheel: [0.88, 0.72, 0.46], roof: [0.72, 0.69, 0.64], rays: '#fff1d6', raysK: 0.22, gas: 0.3, blade: [1.1, 1.0, 0.82], door: 1, bulbs: 0.9, exposure: 0.96,
    lampFloor: [0.03, 2.6], sheen: [0.5, 0.48, 0.42], tone: [1.05, 1.0, 0.93], sweep: 1.3, paint: [1.1, 1.06, 0.97], paintFill: [0.28, 0.265, 0.235], endLamp: 1.9, endDim: 0.36,
    grade: { saturation: 1.12, contrast: 1.11, tint: '#fff7ea', shadowTint: '#0a0806', vignette: 0.26, grain: 0.02 } },
};
// how often each is dealt: looks (morning, evening, noon), paint schemes (0, 1, 2), casts (0, 1, 2)
const LOOK_DEAL = [['morning', 0.4], ['evening', 0.3], ['noon', 0.3]], SCHEME_DEAL = [0.4, 0.3, 0.3], CAST_DEAL = [0.34, 0.33, 0.33];
const dealOf = (x, w) => { let a = 0; for (let i = 0; i < w.length; i++) { a += w[i]; if (x < a) return i; } return w.length - 1; };
// HARD CAPS ON THREE DEALT STOCKS, each typed two above the most that any of seeds 1 to 1,200 deals, so that none of those 1,200 worlds is changed by it (built
// with the caps and without them, each of the 1,200 is the same world to the last vertex). A cap takes no draw and saves none: every draw of the thing is taken
// first, in the same order, and only then is the thing laid, laid as its lighter kind, or left out; so nothing that is dealt after it moves on any seed.
//   HOOP_CAP  hoops on the paint shop's drying shelves: 72 places are dealt, and the most hoops on seeds 1 to 1,200 is 30 (seeds 230, 453, 529 and 1043).
//             A hoop past the cap is laid as a painted board, on the hoop's place of the shelf and in its colour.
//   BIN_CAP   bins of carved parts in the racks' four lower tiers: 120 bays are dealt, and the most bins on seeds 1 to 1,200 is 26 (seed 869).
//             A bin past the cap keeps its low box and gets no carved parts, as the top tier's boxes get none.
//   CURL_CAP  shavings on and round the carver's island: 26 are dealt, and the most laid on seeds 1 to 1,200 is 9 (seed 91 and twelve more).
//             A curl past the cap is not laid.
// No cap is typed for the other shavings: the lathe's twelve and the baskets' fifteen are laid on every seed, and of the fourteen dealt under the carver's stand
// in the bay, seeds 1 to 1,200 lay 13 at the most (seed 23 and nine more), so a cap above that would be the fourteen themselves.
const HOOP_CAP = 32, BIN_CAP = 28, CURL_CAP = 11;

export default {
  id: 'carousel-works',
  name: 'Carousel Works',
  category: 'interior',
  weirdness: 0.1,
  media: ['interior', 'air'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    // dealt before anything else is built, one draw each from a fork of the world's own stream: the look, the paint scheme, the cast
    // and where the wheel stands at clock 0
    const deal = rng.fork('deal'), dLook = deal(), dScheme = deal(), dCast = deal(), dPhase = deal();
    let lookName = LOOK_DEAL[dealOf(dLook, LOOK_DEAL.map((q) => q[1]))][0];
    if (vary.hour === 'night' || vary.hour === 'golden') lookName = 'evening';
    else if (vary.hour === 'day') lookName = 'noon';
    else if (vary.hour === 'dawn') lookName = 'morning';
    const schemeId = dealOf(dScheme, SCHEME_DEAL), castId = dealOf(dCast, CAST_DEAL), phase0 = dPhase * TAU;
    const rare = !!vary.rare;
    const L = LOOKS[lookName], evening = lookName === 'evening', noon = lookName === 'noon';

    await ctx.yield();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(L.fog).multiplyScalar(0.5);
    scene.fog = new THREE.FogExp2(L.fog, L.fogD);                                     // (the hall's and the wheel's own shaders tint this haze by place: uFogArm, uFogBay, uFogPaint)
    const time = { value: 0 };

    const points = [[0, 12, 190], [0, 12, 160], [0, 12, 130], [13.05, 11.16, 90.75], [25.98, 10.33, 51.84], [38.91, 9.5, 12.93], [40.64, 9.5, 5.38], [40.93, 9.5, -2.35],
      [39.76, 9.5, -10.01], [37.17, 9.5, -17.31], [33.25, 9.5, -23.99], [28.15, 9.5, -29.81], [22.04, 9.5, -34.57], [15.14, 9.5, -38.1], [7.71, 9.5, -40.27], [0, 9.5, -41],
      [-30, 10.75, -41], [-60, 12, -41], [-100, 12, -41], [-135, 12, -41], [-170, 12, -41]];
    const path = makePath(points);
    await ctx.yield();

    // ---- the wheel ---------------------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { palette: Object.values(PAL), scheme: schemeId, cast: castId, phase0, lights: 2 });
    scene.add(hero.object);
    hero.uniforms.uShaft.value.set(L.shaft[0], L.shaft[1], L.shaft[2]);
    const gasWheel0 = new THREE.Color().fromArray(L.gasWheel || [0, 0, 0]);          // the pendants' light on the wheel: cream-gold on the lamp side, blue on the glass side
    const plank0 = new THREE.Color().fromArray(L.plank || [1, 1, 1]), plankCold = new THREE.Color(1.12, 1.1, 1.1);
    hero.uniforms.uDoor.value.setRGB(1.0, 0.965, 0.89).multiplyScalar(L.door * 1.1);
    hero.uniforms.uGas.value.copy(gasWheel0); hero.uniforms.uPlank.value.copy(plank0); hero.uniforms.uRoof.value.fromArray(L.roof);
    const roof0 = hero.uniforms.uRoof.value.clone();                                   // by evening most of it is the lamps' own glow under the roof, and falls with them
    const rackTone = (hex) => '#' + new THREE.Color(hex).multiplyScalar(L.rack).getHexString();     // rack timber: dark oiled umber by day
    for (const l of hero.lights) { l.userData.base = (evening ? 250 : 195) * L.bulbs; l.distance = 130; l.decay = 1.6; l.position.y = 15.5; }   // kept low enough that gilt and planks hold their colour
    await ctx.yield();

    // ---- light: one cool hemisphere and the wheel's two warm lamps; the north glass's key is worked out in the shaders (uKey) ----
    const hemi = new THREE.HemisphereLight(new THREE.Color(L.hemiSky), new THREE.Color(L.hemiGround), L.hemiK);
    scene.add(hemi);
    const keyU = { value: new THREE.Color(L.keyCol).multiplyScalar(L.keyK) };
    hero.uniforms.uKey.value.copy(keyU.value);

    // the floor's plan, one texel to 0.75 m: r the lamps' pools, g the shade under whatever stands on the boards, b where paint is worked.
    // Made here, filled once everything is standing (fillPlan, below), never touched after build.
    const LM = { x0: -222, z0: -78, w: 400, h: 390, s: 0.75 };
    const lmData = new Uint8Array(LM.w * LM.h * 4), lmTex = new THREE.DataTexture(lmData, LM.w, LM.h, THREE.RGBAFormat);
    lmTex.magFilter = lmTex.minFilter = THREE.LinearFilter; lmTex.generateMipmaps = false; lmTex.wrapS = lmTex.wrapT = THREE.ClampToEdgeWrapping;
    const U = {
      uTime: time, uDust: { value: new THREE.Color(evening ? '#d6aa6a' : '#c9b48c').multiplyScalar(evening ? 0.4 : 0.46) }, uGasCol: { value: new THREE.Color(1.0, 0.62, 0.28).multiplyScalar(L.gas * 2.4) },
      uDoorCol: { value: new THREE.Color(1.0, 0.965, 0.89).multiplyScalar(L.door * 2.6) }, uPool: { value: new THREE.Vector2(L.pool[0], L.pool[1]) }, uGlow: { value: 1 },
      uWall: { value: new THREE.Vector2(L.wall[0], L.wall[1]) }, uDustK: { value: L.dust }, uFloorWash: { value: L.floorWash ?? 0 }, uKey: keyU, uBlade: { value: new THREE.Color().fromArray(L.blade) },
      uSpat1: { value: new THREE.Color() }, uSpat2: { value: new THREE.Color() }, uSpat3: { value: new THREE.Color() },      // the paint scheme's three colours, set where the scheme is dealt out (below)
      tLm: { value: lmTex }, uLm: { value: new THREE.Vector4(LM.x0, LM.z0, 1 / (LM.w * LM.s), 1 / (LM.h * LM.s)) },
      uFloorLamp: { value: new THREE.Vector2(L.lampFloor[0], L.lampFloor[1]) }, uSheen: { value: new THREE.Color().fromArray(L.sheen) }, uTone: { value: new THREE.Color().fromArray(L.tone) },
      uSweepCol: { value: new THREE.Color(1.0, 0.56, 0.22).multiplyScalar(2.2) }, uGild: { value: new THREE.Vector3(0, -1, L.sweep) },
      uPaintCol: { value: new THREE.Color().fromArray(L.paint) }, uPaintFill: { value: new THREE.Color().fromArray(L.paintFill) },
      uSLp: { value: Array.from({ length: 52 }, () => new THREE.Vector4(0, 20, 0, 1)) }, uSLc: { value: Array.from({ length: 52 }, () => new THREE.Vector4(0, 0, 0, 1)) }, uSLn: { value: 0 },
      uGoldP: { value: new THREE.Vector3(0, 17, -36) }, uGoldA: { value: 0 }, uGoldC: { value: new THREE.Color(1.0, 0.6, 0.24).multiplyScalar(L.gold) }, uPortalC: { value: new THREE.Color(1.75, 0.98, 0.36).multiplyScalar(1.1) },
      uArmAmb: { value: new THREE.Color().fromArray(L.armAmb) }, uFogArm: { value: new THREE.Color(L.fogArm) }, uFogBay: { value: new THREE.Color(L.fogBay) }, uFogPaint: { value: new THREE.Color(L.fogPaint) },
      uDeep: { value: new THREE.Color() }, uRailCol: { value: new THREE.Color() }, uRailCol2: { value: new THREE.Color(0.25, 0.265, 0.29) }, uLowTone: { value: new THREE.Color().fromArray(L.lowTone || [1, 1, 1]) }, uEndCol: { value: new THREE.Color(1.0, 0.6, 0.27).multiplyScalar(L.endLamp) }, uEndDim: { value: L.endDim },
    };
    const hallMat = makeHallMaterial(U);
    const viewU = {
      uTime: time, uZen: { value: new THREE.Color(L.zen) }, uHor: { value: new THREE.Color(L.hor) }, uCloud: { value: new THREE.Color(L.cloud) },
      uSea: { value: new THREE.Color('#9fc6d8') }, uFogCol: { value: new THREE.Color(L.fog) }, uFogD: { value: L.fogD }, uGain: { value: L.glass }, uSeaGain: { value: 1.7 }, uDusk: { value: evening ? 1 : 0 }, uCloudK: { value: L.cloudK ?? 0.8 },
    };
    const viewMat = makeViewMaterial(viewU);
    const occ = [];                                     // rectangles that darken the floor under things: [x0, z0, x1, z1, strength]
    const copies = [], standing = [];                   // { kind, so, items }: animals and bench work in the wheel's look
    const CLOSE = 9;                                    // nothing small or long stands within this of the flown line in plan (floor dress excepted): counted at the end of the build
    const report = [];                                  // print-only counts of this build (scene.userData.report): clear air, the lamps' pools
    hero.uniforms.uLamp.value = U.uGasCol.value;         // one colour object: the copies' lamp light falls with the hall's in the rare failure
    hero.uniforms.uLampP.value = U.uPaintCol.value;      // and the paint shop's white lamps on the copies that stand or hang in that room
    hero.uniforms.uFogArm.value = U.uFogArm.value; hero.uniforms.uFogBay.value = U.uFogBay.value; hero.uniforms.uFogPaint.value = U.uFogPaint.value; hero.uniforms.uFogBy.value = 1; hero.uniforms.uPortalC.value = U.uPortalC.value;   // the wheel's shaders tint the haze by place as the hall's do, and the copies take the portal's gold
    hero.uniforms.uCap.value = (L.cap ?? 0.3) / L.exposure;         // bare and primed wood is eased under this, so that it stays a warm tan on screen in every look
    const gasAt = [];                                   // gas mantles: [x, y, z]
    const meshes = [];
    const addMesh = (mg, name) => { const m = new THREE.Mesh(mg.build(), hallMat); m.name = name; scene.add(m); meshes.push(m); return m; };

    // gas pendants (enamel shades on rods from the trusses) and bracket lamps on the walls and piers: they burn in every look, low by day
    // The ring: twelve pendants at radius 53, one every 30 degrees, well above and outside everything that turns. Under each lies its pool,
    // some 16 m across, and the bay's low work is gathered in those pools.
    const ARM_Z = 76, ARM_POOL = 1.2;                   // south of this lies the carving arm: its lamps burn lower than the bay's ring, in every look, and throw broader pools (9.6 m in radius, bay by bay)
    const RING_N = 12, RING_R = 53, POOL_R = 8, RING_A = (i) => (15 + 30 * i) * Math.PI / 180;
    const pendants = [];
    for (let i = 0; i < 5; i++) for (const sx of [-18, 18]) pendants.push([sx, 19, 88.5 + 27 * i]);
    for (let i = 0; i < RING_N; i++) { const a = RING_A(i); pendants.push([Math.cos(a) * RING_R, 20, Math.sin(a) * RING_R]); }   // the ring round the wheel
    for (const [x, z] of [[50, 61], [-46, 62], [56, -56], [-55, -59]]) pendants.push([x, 21, z]);    // one in each corner of the bay, beyond the ring
    for (let i = 0; i < 3; i++) pendants.push([-90 - 22 * i, 24, -41]);                              // the paint shop's white lamps end 36 m short of the doorway
    pendants.push([-60, 24, -41]);                                                                 // over the west floor, before the paint shop's mouth
    for (const z of [-56, -26]) pendants.push([-80, 22, z]);                                       // over the paint shop's threshold
    // THE FINISHED ANIMALS IN THE DESPATCH END: where each pair stands (x, metres either side of the line). A rule of place for the whole
    // aisle: a great animal stands whole against a side wall, 25 m off the line (its trolley's near edge 21.6 m off), where it leaves a level
    // frame of 62 degrees by the frame's SIDE while the boards at its trolley's foot are still in the picture (25 m to the side it is 23 m
    // ahead as it leaves, and the frame's lower edge is then 2 m under the floor), so nothing of it is ever cut by the picture's lower
    // corners. The 21 m of floor between the two files is left to the rails, the plates and the lamps' pools.
    // (where they stand follows from the room: 25 m to the side, a body leaves the picture while the line is still some 21 m short of it. So
    // the two of each wall stand nose to tail on short decks between x -159.2 and -140.6: all four are seen whole down the length of the paint
    // shop, pass out by the picture's sides while the line runs from x -119 to -138, and the last 30 m before the end wall hold floor, rails
    // and wall only)
    const PROC = [[-145.2, 25], [-154.6, 25]], PROC_K = 1.4;
    for (const [x, dz] of PROC) for (const sd of [-1, 1]) pendants.push([x + 1.5, 18.6, -41 + sd * dz, 0.5]);   // a small warm lamp over every animal of it
    for (const z of [-62, -20]) pendants.push([-66, 22, z]);                                        // one over each drying frame before the paint shop's mouth
    pendants.push([7.2, 19.5, 64.5]);                                                              // over the trolley that waits on the rails between the arm's mouth and the wheel
    pendants.push([-14, 18, 150]);                                                                 // over the carver's island
    for (const p of pendants) gasAt.push([p[0], p[1], p[2], p[3] ?? 1, p[2] > ARM_Z ? ARM_POOL : 1]);   // [x, y, z, strength, how broad its pool is]
    // THE LIGHTS THE FLOOR'S SHEEN MIRRORS (uSLp: place and size; uSLc: colour and room 0 arm, 1 bay, 2 paint shop), most telling first so that
    // a small machine can stop the list short: four places along the wheel's lit quarter (size negative: they ride the wheel, set each frame
    // from its bearing), the mast head's lantern, the portal, the gate's row of bulbs, then every pendant
    const SL = [], lampK = 0.3 + 0.7 * L.gas, SLK = L.streak;
    for (let k = 0; k < 4; k++) SL.push([0, 19, -41, -3, 1.8 * L.bulbs, 1.0 * L.bulbs, 0.34 * L.bulbs, 1]);
    SL.push([0, 27.9, 0, 1.6, 1.0 * lampK, 0.62 * lampK, 0.26 * lampK, 1]);
    SL.push([-170, 12, -41, 6.5, 2.1 / SLK, 1.18 / SLK, 0.42 / SLK, 2]);
    for (const z of [-55, -27]) SL.push([-73.8, 25.2, z, 9, 0.6 * L.bulbs, 0.34 * L.bulbs, 0.12 * L.bulbs, 1]);
    for (const p of pendants) { const room = p[2] > 75 ? 0 : (p[0] < -75 ? 2 : 1), white = p[0] < -78 && p[0] > -136, k = (p[3] ?? 1) * lampK * (room === 0 ? 0.85 : 1);
      SL.push([p[0], p[1], p[2], 1.3, k, (white ? 0.93 : 0.6) * k, (white ? 0.78 : 0.25) * k, room]); }
    const SLN = Math.min(SL.length, 52, Math.max(16, Math.round(52 * Math.min(1, (detail - 0.2) / 0.8)))), slBase = [];   // the list is cut short with the graphics level (52, 39, 26): it is ordered most telling first
    for (let i = 0; i < SLN; i++) { const s = SL[i]; U.uSLp.value[i].set(s[0], s[1], s[2], s[3]); U.uSLc.value[i].set(s[4] * SLK, s[5] * SLK, s[6] * SLK, s[7]); slBase.push([s[4] * SLK, s[5] * SLK, s[6] * SLK]); }
    U.uSLn.value = SLN;
    const shedLamps = [];                                                                          // [x, y, z] of each lantern in the loading shed
    const brackets = [];                                                                           // [x, y, z] of each bracket lamp's mantle
    // a lamp on a scrolled iron bracket: (x, y, z) is where the bracket leaves the wall or pier, (nx, nz) points out into the room
    const bracketLamp = (m, x, y, z, nx, nz, reach = 2.4, k = 0.5) => {
      const ex = x + nx * reach, ez = z + nz * reach;
      m.beam([x, y, z], [ex, y + 0.5, ez], 0.3, 0.3, '#4a5560', { round: 6 }); m.beam([x, y - 1.6, z], [x + nx * reach * 0.7, y + 0.3, z + nz * reach * 0.7], 0.2, 0.2, '#4a5560', { round: 5 });
      m.box(x + nx * 0.1, y - 0.6, z + nz * 0.1, 0.3 + Math.abs(nz) * 0.5, 2.6, 0.3 + Math.abs(nx) * 0.5, '#3d4650', {});
      m.beam([ex, y + 0.5, ez], [ex, y - 0.2, ez], 0.16, 0.16, '#4a5560', { round: 5 });
      m.cyl(ex, y - 0.5, ez, 1.5, 0.35, 0.9, PAL.green, { sides: 12, open: true, jit: 0 });
      m.cyl(ex, y - 1.0, ez, 0.36, 0.26, 0.8, '#ffc070', { sides: 8, kind: 5, par: (ez > ARM_Z ? 2.0 : 3.2) * L.gas, jit: 0 });
      brackets.push([ex, y - 1.1, ez]); gasAt.push([ex, y - 1.0, ez, k]);
    };
    // bake the lamps' light into aK.z, a few thousand vertices at a time. A pendant counts 1, a bracket lamp 0.5 (a smaller pool), the freight doorway's pair 1.
    const lampCells = new Map();                                                  // the lamps that can reach each 25 m square of the plan
    const lampsNear = (x, z) => {
      const cx = Math.floor(x / 25), cz = Math.floor(z / 25), key = (cx + 64) * 256 + (cz + 64); let list = lampCells.get(key);
      if (!list) { list = gasAt.filter((q) => { const dx = Math.max(0, cx * 25 - q[0], q[0] - cx * 25 - 25), dz = Math.max(0, cz * 25 - q[2], q[2] - cz * 25 - 25); return dx * dx + dz * dz < 2500 * q[3]; }); lampCells.set(key, list); }
      return list;
    };
    // how much of the lamps reaches a point: each lamp's glow all round it, and, for whatever stands below it, the pool it throws down
    const lampOn = (x, y, z, near, wall) => {
      let g = 0;
      for (const q of near) {
        const dx = x - q[0], dz = z - q[2], h2 = dx * dx + dz * dz, dy = (y - q[1]) * 0.7, d2 = h2 + dy * dy;
        if (d2 < 900 * q[3]) g += 0.9 * q[3] * Math.exp(-d2 / (60 * q[3]));
        if (!wall && y < q[1]) { const R = POOL_R * Math.sqrt(q[3]) * (q[4] ?? 1); if (h2 < R * R * 1.44) g += 0.75 * q[3] * (1 - sstep(0.45 * R, 1.2 * R, Math.sqrt(h2))); }
      }
      return Math.min(1.1, g);
    };
    const seenK = new Float64Array(512), seenV = new Float32Array(512);
    const bakeGas = async (mg, off = [0, 0, 0]) => {
      const P = mg.positions, K = mg.K, n = mg.vertexCount;
      if (lampCells.lamps !== gasAt.length) { lampCells.clear(); lampCells.lamps = gasAt.length; }      // lamps hung since the last bake count too
      seenK.fill(-1);                                                             // a corner shared by the triangles of one piece is worked out once (to 3 cm): a small direct-mapped memo
      for (let i = 0; i < n; i++) {
        const x = P[i * 3] + off[0], y = P[i * 3 + 1] + off[1], z = P[i * 3 + 2] + off[2], wall = K[i * 3] === 3;
        const kx = Math.round(x * 32) + 16384, ky = Math.round(y * 32) + 2048, kz = Math.round(z * 32) + 16384, key = (kx * 8192 + ky) * 32768 + kz + (wall ? 2 ** 51 : 0), slot = (kx * 31 + ky * 17 + kz * 7) & 511;
        if (seenK[slot] !== key) { seenK[slot] = key; seenV[slot] = lampOn(x, y, z, lampsNear(x, z), wall); }
        K[i * 3 + 2] = seenV[slot];
        if ((i & 4095) === 4095) await ctx.yield();
      }
    };

    // ---- 2 hall --------------------------------------------------------------------------------------------------
    const IRON = '#3d4650', TIMBER = '#5b4634', ROOF = '#7a7268', GREEN = PAL.green, GOLD = PAL.gold;
    const SCH = [[PAL.scarlet, PAL.gold, PAL.green], ['#1E3FA0', '#C9D2DA', '#D97890'], ['#EDE3C8', PAL.gold, '#17161B']][schemeId];
    U.uSpat1.value.set(SCH[0]).multiplyScalar(0.85); U.uSpat2.value.set(SCH[1]).multiplyScalar(0.8); U.uSpat3.value.set(SCH[2]).lerp(new THREE.Color(PAL.cream), 0.4).multiplyScalar(0.8);
    U.uDeep.value.set(['#1F4A3C', '#16296a', '#2a2420'][schemeId]).multiplyScalar(0.8); U.uRailCol.value.set(schemeId === 1 ? '#aab4be' : '#e0a62e').multiplyScalar(0.7);   // the despatch end's dado and its lining
    const ringGeo = new THREE.TorusGeometry(1, 0.1, 5, 18);
    // a panel hung on a wall: a frame, a field and a roundel or a sunburst in relief (leaf, shell and sun ornament only). Finished and painted in
    // the paint shop; everywhere else (raw) it is bare carved wood or flat primer, so the only scarlet and gold near the wheel is on the wheel.
    const bevel = new THREE.CylinderGeometry(0.6, 0.7071, 1, 4, 1).toNonIndexed(); bevel.rotateY(Math.PI / 4); bevel.computeVertexNormals();   // a board with chamfered edges
    const stud = new THREE.SphereGeometry(1, 6, 2, 0, TAU, 0, Math.PI / 2);                                                                // a small boss: a panel's corners
    const dome = new THREE.SphereGeometry(1, 8, 3, 0, TAU, 0, Math.PI / 2);                                                                // a boss
    const mB = new THREE.Matrix4(), qB = new THREE.Quaternion(), vX = new THREE.Vector3(), vY = new THREE.Vector3(), vZ = new THREE.Vector3(), cD = new THREE.Color(), cG = new THREE.Color('#4a4036');
    const dull = (hex) => '#' + cD.set(hex).lerp(cG, 0.34).multiplyScalar(0.5).getHexString();     // rounding-board paint seen high on a wall: quieter than the animals
    const vivid = (hex) => '#' + cD.set(hex).lerp(cG, 0.08).multiplyScalar(0.8).getHexString();    // the same paint at full strength: the paint shop's mouth, the doorway's front
    const GILT = schemeId === 1 ? '#c9d2da' : '#e0a62e', GILTK = 0.1 + 0.2 * L.gas;                // leaf (gold, or silver in the second scheme) and how much lamplight it throws back
    const gateBulbs = [];                                                                          // steady bulbs on the paint shop's mouth and round the freight doorway
    const panel = (m, x, y, z, nx, nz, w, h, i, raw, bright, des) => {
      const ry = Math.atan2(nx, nz), tx = Math.cos(ry), tz = -Math.sin(ry), at = (d) => [x + nx * d, y, z + nz * d], prim = raw && i % 3 === 2;
      qB.setFromRotationMatrix(mB.makeBasis(vX.set(tx, 0, tz), vY.set(nx, 0, nz), vZ.set(0, -1, 0)));
      const tone = bright ? vivid : dull;
      const c1 = raw ? (prim ? '#7f8388' : '#6e583c') : tone(SCH[i % 3 === 1 ? 2 : 0]), c2 = raw ? (prim ? '#8f9396' : '#927850') : tone(SCH[1]), c3 = raw ? (prim ? '#74787c' : '#7d6646') : tone(i % 3 === 1 ? SCH[0] : SCH[2]);
      const k0 = raw ? 0.8 : 1, lit = (px, py, pz, k) => k.multiplyScalar(k0 * (0.5 + 0.5 * Math.min(1, Math.max(0, (py - y + h / 2) / h)))), o = raw && !prim ? { kind: 1, par: 1 } : {};
      m.add(bevel, { p: at(0.25), q: qB, s: [w, 0.5, h], c: c1, jit: 0.06, tint: lit, ...o });                               // frame, moulding, raised field: each chamfered, lit from above
      m.add(bevel, { p: at(0.57), q: qB, s: [w - 1.2, 0.14, h - 1.2], c: c2, jit: 0, tint: lit });
      m.add(bevel, { p: at(0.76), q: qB, s: [w - 1.9, 0.26, h - 1.9], c: c3, jit: 0.06, tint: lit, ...o });
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) m.add(stud, { p: [x + nx * 0.5 + tx * sx * (w / 2 - 0.5), y + sy * (h / 2 - 0.5), z + nz * 0.5 + tz * sx * (w / 2 - 0.5)], q: qB, s: [0.26, 0.26, 0.26], c: c2, jit: 0 });
      // the relief at its centre, one of four designs dealt along a run: a sunburst of tapered ridged rays, a shell, a scrolled cartouche with
      // a leaf spray, a roundel in a carved ring with petals. On a finished panel it is leaf (gold, or silver in the second scheme); on a
      // raw or primed one it is the panel's own wood.
      const cR = raw ? c2 : GILT, oR = raw ? { jit: 0, tint: lit } : { jit: 0, kind: 5, par: GILTK * 1.2 }, pt = (u, v, d) => [x + nx * d + tx * u, y + v, z + nz * d + tz * u];
      const ray = (u0, v0, u1, v1, wd, tp = 0.1, col = cR, oo = oR) => m.beam(pt(u0, v0, 0.98), pt(u1, v1, 0.98), wd, wd, col, { round: 4, taper: tp, ...oo });
      const D = des ?? ((i % 4) + 4) % 4;
      if (des !== undefined) {                                                                                                  // a lined field: a fine line of leaf inside the moulding, a leaf at each corner of it
        const lw = w / 2 - 0.42, lh = h / 2 - 0.42;
        for (const sv of [-1, 1]) { m.beam(pt(-lw, sv * lh, 0.66), pt(lw, sv * lh, 0.66), 0.12, 0.12, cR, { ...oR }); m.beam(pt(sv * lw, -lh, 0.66), pt(sv * lw, lh, 0.66), 0.12, 0.12, cR, { ...oR });
          for (const su of [-1, 1]) ray(su * (lw - 0.25), sv * (lh - 0.25), su * (lw - 0.95), sv * (lh - 0.7), 0.3, 0.1); }
      }
      if (D === 4) {                                                                                                            // a star: five broad points, a small ray between each pair, a boss
        for (let k = 0; k < 10; k++) { const a = 1.5708 + k * 0.6283, r1 = h * (k % 2 ? 0.16 : 0.4), c = Math.cos(a), sn = Math.sin(a); ray(c * h * 0.03, sn * h * 0.03, c * r1, sn * r1, h * (k % 2 ? 0.07 : 0.17), 0.04); }
        m.add(dome, { p: at(0.95), q: qB, s: [h * 0.09, 0.42, h * 0.09], c: cR, ...oR });
        return;
      }
      if (D === 5) {                                                                                                            // a fan: eleven sticks spread from a pivot at the foot, alternate leaves in leaf and in the ground's colour, a rim, a boss on the pivot
        const r1 = Math.min(h * 0.62, (w / 2 - 1.0) / 0.95), fy = -r1 * 0.45;
        for (let k = 0; k < 11; k++) { const a = (0.1 + 0.8 * k / 10) * Math.PI, c = Math.cos(a), sn = Math.sin(a);
          ray(c * r1, fy + sn * r1, c * r1 * 0.1, fy + sn * r1 * 0.1, r1 * 0.2, 0.2, k % 2 ? c1 : cR, k % 2 ? { jit: 0, tint: lit } : oR); }
        for (let k = 0; k < 10; k++) { const a0 = (0.1 + 0.8 * k / 10) * Math.PI, a1 = (0.1 + 0.8 * (k + 1) / 10) * Math.PI, r2 = r1 * 1.03; ray(Math.cos(a0) * r2, fy + Math.sin(a0) * r2, Math.cos(a1) * r2, fy + Math.sin(a1) * r2, r1 * 0.07, 1); }
        m.add(dome, { p: pt(0, fy, 0.95), q: qB, s: [r1 * 0.13, 0.42, r1 * 0.13], c: cR, ...oR });
        return;
      }
      if (D === 6) {                                                                                                            // a wreath: paired leaves climbing both sides of a ring to meet at the top, tied with a bow at the foot
        const rw = Math.min(h * 0.3, w / 2 - 1.5);
        for (let k = 0; k < 14; k++) { const a = -Math.PI / 2 + (k + 0.5) / 14 * TAU, c = Math.cos(a), sn = Math.sin(a), sd = c > 0 ? 1 : -1;
          for (const o of [-1, 1]) ray(c * rw, sn * rw, c * rw - sd * sn * rw * 0.4 + c * o * rw * 0.22, sn * rw + sd * c * rw * 0.4 + sn * o * rw * 0.22, rw * 0.2, 0.12); }
        for (const sx of [-1, 1]) { ray(0, -rw, sx * rw * 0.42, -rw * 1.34, rw * 0.2, 0.5); ray(0, -rw, sx * rw * 0.2, -rw * 1.62, rw * 0.12, 0.6); }
        m.add(dome, { p: pt(0, -rw, 0.95), q: qB, s: [rw * 0.11, 0.42, rw * 0.11], c: cR, ...oR });
        return;
      }
      if (D === 7) {                                                                                                            // two leaf sprays crossed at the foot and tied: a stem either way, five leaves up each, a knot where they cross
        const rs = Math.min(h * 0.4, w / 2 - 1.2);
        for (const sx of [-1, 1]) {
          ray(-sx * rs * 0.25, -rs * 0.85, sx * rs * 0.8, rs * 0.75, rs * 0.11, 0.5);
          for (let k = 0; k < 5; k++) { const t = 0.24 + k * 0.17, pu = sx * rs * (-0.25 + 1.05 * t), pv = rs * (-0.85 + 1.6 * t), o = k % 2 ? 1 : -1;
            ray(pu, pv, pu + sx * rs * (0.1 + 0.26 * o), pv + rs * (0.32 - 0.1 * o), rs * 0.27, 0.1); }
        }
        m.add(dome, { p: pt(0, -rs * 0.47, 0.95), q: qB, s: [rs * 0.12, 0.42, rs * 0.12], c: cR, ...oR });
        return;
      }
      if (D === 0) {                                                                                                            // a sunburst: sixteen tapered rays, long and short by turns
        for (let k = 0; k < 16; k++) { const a = k * 0.3927, r1 = h * (k % 2 ? 0.24 : 0.36), c = Math.cos(a), sn = Math.sin(a); ray(c * h * 0.06, sn * h * 0.06, c * r1, sn * r1, h * (k % 2 ? 0.07 : 0.1)); }
        m.add(dome, { p: at(0.92), q: qB, s: [h * 0.1, 0.42, h * 0.1], c: cR, ...oR });
      } else if (D === 1) {                                                                                                     // a shell: nine ribs fanning up from a boss, a scroll either side of its foot
        for (let k = 0; k < 9; k++) { const a = (0.14 + 0.72 * k / 8) * Math.PI, r1 = h * (0.5 + 0.1 * Math.sin(a)), c = Math.cos(a), sn = Math.sin(a);
          ray(c * r1, -h * 0.27 + sn * r1, c * h * 0.05, -h * 0.27 + sn * h * 0.05, h * 0.13, 0.25, k % 2 ? cR : c1, k % 2 ? oR : { jit: 0, tint: lit }); }
        m.add(dome, { p: pt(0, -h * 0.27, 0.92), q: qB, s: [h * 0.11, 0.42, h * 0.09], c: cR, ...oR });
        for (const sx of [-1, 1]) m.add(ringGeo, { p: pt(sx * h * 0.2, -h * 0.3, 0.95), r: [0, ry, 0], s: [h * 0.07, h * 0.07, 1.6], c: cR, ...oR });
      } else if (D === 2) {                                                                                                     // a scrolled cartouche: a raised oval in a carved ring, a scroll at each corner, a spray of leaves either side
        m.add(dome, { p: at(0.88), q: qB, s: [h * 0.17, 0.5, h * 0.25], c: raw ? c1 : tone(SCH[1]), jit: 0, tint: lit });
        m.add(ringGeo, { p: at(0.95), r: [0, ry, 0], s: [h * 0.19, h * 0.27, 2.0], c: cR, ...oR });
        for (const sx of [-1, 1]) { for (const sy of [-1, 1]) m.add(ringGeo, { p: pt(sx * h * 0.17, sy * h * 0.3, 0.97), r: [0, ry, 0], s: [h * 0.06, h * 0.06, 1.6], c: cR, ...oR });
          for (let k = 0; k < 3; k++) ray(sx * h * 0.2, (k - 1) * h * 0.07, sx * h * (0.42 - 0.04 * Math.abs(k - 1)), (k - 1) * h * 0.2, h * 0.09, 0.08); }
      } else {                                                                                                                  // a roundel: a domed boss in a carved ring, eight petals round it
        m.add(dome, { p: at(0.88), q: qB, s: [h * 0.2, 0.55, h * 0.2], c: raw ? c1 : '#5f7480', jit: 0, tint: lit });
        m.add(ringGeo, { p: at(0.95), r: [0, ry, 0], s: [h * 0.24, h * 0.24, 2.4], c: cR, ...oR });
        for (let k = 0; k < 8; k++) { const a = k * 0.7854 + 0.3927, c = Math.cos(a), sn = Math.sin(a); ray(c * h * 0.27, sn * h * 0.27, c * h * 0.38, sn * h * 0.38, h * 0.1, 0.1); }
      }
    };
    // a riveted plate girder along z (x fixed) or along x (z fixed): web, flanges, stiffeners, rivet heads, and a lower edge that catches the light
    const girder = (m, x0, z0, x1, z1, y, d) => {
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), len = alongX ? x1 - x0 : z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const bx = (c, yy, t, hh, col, o = {}) => m.box(alongX ? cx + c : cx, yy, alongX ? cz : cz + c, alongX ? t : hh, o.h ?? 0.3, alongX ? hh : t, col, o);
      m.box(cx, y, cz, alongX ? len : 0.5, d, alongX ? 0.5 : len, '#414b56', { jit: 0 });
      for (const [yy, wd, col] of [[y + d / 2, 1.7, '#4a5560'], [y - d / 2, 1.9, '#55616c']]) m.box(cx, yy, cz, alongX ? len : wd, 0.3, alongX ? wd : len, col, { jit: 0 });
      for (const sd of [-1, 1]) m.box(alongX ? cx : cx + sd * 0.84, y - d / 2 - 0.1, alongX ? cz + sd * 0.84 : cz, alongX ? len : 0.36, 0.14, alongX ? 0.36 : len, evening ? '#ffb46a' : '#b4c0ca', evening ? { kind: 5, par: 0.22, jit: 0 } : { jit: 0 });
      const n = Math.round(Math.abs(len) / 5);
      for (let k = 0; k <= n; k++) { const c = -len / 2 + len * k / n; bx(c, y, 0.26, 1.5, '#4a5560', { h: d - 0.3 }); }
      const nr = Math.round(Math.abs(len) / 2.5);
      for (let k = 0; k < nr; k++) { const c = -len / 2 + len * (k + 0.5) / nr;
        for (const sd of [-1, 1]) for (const yy of [y + d / 2 - 0.42, y - d / 2 + 0.42]) m.box(alongX ? cx + c : cx + sd * 0.3, yy, alongX ? cz + sd * 0.3 : cz + c, 0.2, 0.2, 0.2, '#6a7682', { jit: 0.1, r: [0.785, 0, 0.785] }); }
    };
    // a hung cloth: its top edge is centred at (x, y1, z) and runs w along (tx, tz); it hangs h. It falls in folds across its width (deeper toward the
    // hem), each fold's crest lighter than its valley, with a darker hem. o.stripes: colours across the width, each stripe its own strip (a canopy
    // gore); o.scallop: a pointed lower edge to each stripe; o.folds, o.depth. One rule for every cloth in the hall: none is a flat rectangle.
    const drape = (m, x, y1, z, tx, tz, w, h, c, o = {}) => {
      const nf = o.folds ?? Math.max(2, Math.round(w / 1.25)), strips = o.stripes ? o.stripes.length * (o.rep ?? 1) : 1, sw = w / strips, segs = Math.max(o.scallop ? 2 : 1, Math.round(nf * 2 / strips));
      const ph = hash1(x * 3.1 + z * 1.7 + y1) * TAU, depth = o.depth ?? 0.24, ry = Math.atan2(-tz, tx), hem = y1 - h + (o.hem ?? 0.45);
      for (let k = 0; k < strips; k++) {
        const g = new THREE.BoxGeometry(sw, h, 0.07, segs, 2, 1), P = g.attributes.position, x0 = -w / 2 + (k + 0.5) * sw;
        g.setIndex(Array.from(g.index.array).slice(g.groups[4].start));           // its two faces only: the edges of a cloth 7 cm thick are never seen
        for (let i = 0; i < P.count; i++) {
          const lx = P.getX(i), py = P.getY(i), sx = (lx + x0) / w + 0.5, t = 0.5 - py / h;
          P.setX(i, lx + x0); P.setZ(i, P.getZ(i) + Math.cos(sx * nf * TAU + ph) * depth * (0.3 + 0.7 * t));
          if (o.scallop && t > 0.99) P.setY(i, py - o.scallop * (1 - Math.abs(2 * lx / sw)));
        }
        g.computeVertexNormals();
        m.add(g, { p: [x, y1 - h / 2, z], r: [0, ry, 0], c: o.stripes ? o.stripes[k % o.stripes.length] : c, kind: 4, sway: [y1, y1 - h], jit: o.jit ?? 0.05,
          tint: (X, Y, Z, col) => { const sx = ((X - x) * tx + (Z - z) * tz) / w + 0.5;
            if (o.stripes) { const f = sx * strips - k, n = o.stripes.length;                                    // stripes meet in a soft edge: the two colours' mean along the seam
              if (f < 0.08 && k > 0) col.lerp(cD.set(o.stripes[(k - 1) % n]), 0.5); else if (f > 0.92 && k < strips - 1) col.lerp(cD.set(o.stripes[(k + 1) % n]), 0.5); }
            col.multiplyScalar((0.66 + 0.46 * (0.5 + 0.5 * Math.cos(sx * nf * TAU + ph))) * (Y < hem ? 0.62 : 1)); } });
        g.dispose();
      }
    };
    const views = [];
    {
      const mg = makeMerger();
      const wallTint = (x, y, z, c) => { c.set('#9a6048').lerp(_c.set('#87919a'), Math.min(1, Math.max(0, (y - 9) / 25))); if (y < 9) c.set('#6e5038'); };
      const _c = new THREE.Color();
      // walls along x (out = +1: the wall lies on the +z side of its face) and along z
      const wx = (x0, x1, zf, out, y0, y1) => mg.box((x0 + x1) / 2, (y0 + y1) / 2, zf + out * 0.75, x1 - x0, y1 - y0, 1.5, '#6a4a3c', { kind: 3, jit: 0, tint: wallTint });
      const wz = (z0, z1, xf, out, y0, y1) => mg.box(xf + out * 0.75, (y0 + y1) / 2, (z0 + z1) / 2, 1.5, y1 - y0, z1 - z0, '#6a4a3c', { kind: 3, jit: 0, tint: wallTint });
      wx(-76.5, 76.5, -75, -1, 0, 34);                                               // bay north
      wz(-75, 30, 75, 1, 0, 44.5); wz(62, 75, 75, 1, 0, 44.5); wz(30, 62, 75, 1, 26, 44.5);   // bay east, with the tall doors
      wx(-76.5, -36.5, 75, 1, 0, 34); wx(36.5, 76.5, 75, 1, 0, 34);                  // bay south, either side of the arm: each ends against the outer face of the arm's side wall
      wz(-11, 75, -75, -1, 0, 44.5); wz(-75, -71, -75, -1, 0, 44.5);                 // bay west, beside the paint shop's mouth
      mg.box(-75.75, 39.5, -41, 1.5, 10, 60, '#6a4a3c', { kind: 3, jit: 0, tint: wallTint });   // brick gable over the paint shop's mouth
      wz(75, 211.5, -35, -1, 0, 44.5); wz(75, 211.5, 35, 1, 0, 44.5); wx(-35, 35, 210, 1, 0, 34);     // south arm
      wx(-177.5, -76.5, -71, -1, 0, 34); wx(-177.5, -76.5, -11, 1, 0, 34);           // west arm: each side wall ends against the west face of the bay's wall
      // (where two walls meet, one ends against the other's face, so that no two of their faces overlap in one plane)
      await ctx.yield();
      wz(-71, -58, -176, -1, 0, 44.5); wz(-24, -11, -176, -1, 0, 44.5); wz(-58, -24, -176, -1, 26, 44.5);
      await ctx.yield();
      // sawtooth roof: north glass rising 10 m over 5, boarded slope falling back to the next truss
      const teeth = async (x0, x1, z0, pitch, n) => {
        const W = x1 - x0, cx = (x0 + x1) / 2, run = pitch - 5, Ls = Math.hypot(run, 10), ang = Math.atan2(10, run);
        for (let i = 0; i < n; i++) {
          const zA = z0 + i * pitch;
          views.push({ a: [x0, 34, zA], b: [x1, 34, zA], c: [x1, 44, zA + 5], d: [x0, 44, zA + 5], w: W, h: 11.18, mode: 0 });
          mg.box(cx, 39.25, zA + 5 + run / 2, W, 0.5, Ls, ROOF, { r: [ang, 0, 0], kind: 1, par: 0, jit: 0 });
          mg.box(cx, 33.5, zA, W, 1.5, 1.0, IRON, {}); mg.box(cx, 32.6, zA, W, 0.35, 1.6, IRON, {});              // bottom chord, flanged
          mg.box(cx, 43.7, zA + 5, W, 0.8, 0.8, IRON, {});                                                           // ridge
          const nr = Math.round(W / 15);
          for (let j = 0; j <= nr; j++) {
            const x = x0 + W * j / nr;
            mg.box(x, 38.6, zA + 5 + run / 2, 0.6, 1.2, Ls, TIMBER, { r: [ang, 0, 0], kind: 1, par: 2 });            // rafter
            if (j < nr) {                                                                                         // web of the truss, in the plane of the glass
              const xb = x + W / nr, xm = (x + xb) / 2;
              mg.beam([x, 34, zA], [xm, 44, zA + 5], 0.8, 0.5, IRON); mg.beam([xm, 44, zA + 5], [xb, 34, zA], 0.8, 0.5, IRON);
              mg.box(xm, 43.2, zA + 4.6, 2.6, 1.7, 0.25, '#4a5560', { r: [0.4636, 0, 0], jit: 0.05 });                // gusset plate at the apex
            }
            mg.beam([x, 34, zA], [x, 44, zA + 5], 0.95, 0.6, IRON);
            mg.box(x, 34.7, zA + 0.35, 2.8, 1.8, 0.25, '#4a5560', { r: [0.4636, 0, 0], jit: 0.05 });                  // gusset plate at the foot
          }
          for (const f of [0.33, 0.66]) mg.box(cx, 44 - 10 * f - 0.9, zA + 5 + run * f, W, 0.7, 0.5, TIMBER, { kind: 1, par: 0 });   // purlins
          await ctx.yield();
        }
      };
      await teeth(-75, 75, -75, 25, 6);
      await teeth(-35, 35, 75, 27, 5);
      await teeth(-176, -75.04, -71, 20, 3);   // the paint shop's roof ends 4 cm inside the gable: its end truss stands a hair behind the bay's own end truss (x -75), which it crosses, and its purlins and ridges end inside the brick, as its boards do but for their lowest 0.46 m, which end in the slot under the gable's foot as they did before
      for (const x of [-37.5, 37.5]) { mg.box(x, 32.2, 0, 1.2, 2.2, 150, IRON, {}); mg.box(x, 31.0, 0, 2.0, 0.3, 150, IRON, {}); }   // girders
      await ctx.yield();
      girder(mg, -35, 75, 35, 75, 32.4, 2.4);                                                                       // riveted lintel girders over the arms' mouths
      await ctx.yield();
      girder(mg, -75, -71, -75, -11, 32.4, 2.4);
      await ctx.yield();
      // cast iron piers at the four corners of the mouths, all alike: stepped plinth, eight-sided shaft with riveted bands, a flared capital
      // with four brackets under the lintel girder, a lamp on a bracket toward the wheel
      const PIER = '#55626e', PIERL = '#6e7c88';
      for (const [x, z, nx, nz] of [[-35, 75, 0, -1], [35, 75, 0, -1], [-75, -11, 1, 0], [-75, -71, 1, 0]]) {
        const lit = (px, py, pz, c) => c.multiplyScalar(0.8 + 0.25 * Math.min(1, Math.max(0, (py - 2) / 28)));
        mg.box(x, 0.6, z, 5.0, 1.2, 5.0, IRON, {}); mg.box(x, 1.7, z, 4.2, 1.0, 4.2, PIER, {}); mg.cyl(x, 2.6, z, 1.9, 1.5, 0.8, PIERL, { sides: 8, jit: 0 });
        mg.cyl(x, 16.2, z, 1.35, 1.2, 26.4, PIER, { sides: 8, ao: [0, 6], jit: 0.04, tint: lit });
        for (const y of [4.2, 9, 14.5, 20, 25.5]) {
          mg.cyl(x, y, z, 1.5, 1.5, 0.5, y === 9 ? GREEN : PIERL, { sides: 8, jit: 0 });
          if (y === 9) for (const dy of [-0.34, 0.34]) mg.cyl(x, y + dy, z, 1.56, 1.56, 0.12, GOLD, { sides: 8, jit: 0 });
          for (let k = 0; k < 8; k++) { const a = (k + 0.5) * 0.7854; mg.box(x + Math.cos(a) * 1.5, y, z + Math.sin(a) * 1.5, 0.24, 0.24, 0.24, '#8492a0', { r: [0.6, a, 0.6], jit: 0 }); }
        }
        mg.cyl(x, 30.0, z, 1.3, 2.4, 1.6, PIERL, { sides: 8, jit: 0 }); mg.box(x, 31.1, z, 5.2, 0.6, 5.2, PIER, {}); mg.box(x, 31.6, z, 4.4, 0.5, 4.4, PIERL, {});
        for (let k = 0; k < 4; k++) { const a = k * 1.5708, c = Math.cos(a), sn = Math.sin(a);
          mg.beam([x + c * 1.3, 26.4, z + sn * 1.3], [x + c * 3.6, 30.7, z + sn * 3.6], 0.5, 0.5, PIER); mg.beam([x + c * 1.3, 29.6, z + sn * 1.3], [x + c * 3.6, 30.9, z + sn * 3.6], 0.36, 0.36, PIERL); }
        bracketLamp(mg, x + nx * 1.4, 13.5, z + nz * 1.4, nx, nz, 2.6);
        occ.push([x - 3, z - 3, x + 3, z + 3, 0.5]);
        await ctx.yield();
      }
      // bracket lamps along the carving shop's walls, the south wall of the bay and the paint shop's walls: one to a bay
      for (let i = 0; i < 5; i++) { bracketLamp(mg, -35, 14.5, 88.5 + 27 * i, 1, 0); bracketLamp(mg, 35, 14.5, 88.5 + 27 * i, -1, 0); }
      // work lamps low on the carving shop's west wall, one over each thing that is worked there (the timber stack, the lathe's two ends, the
      // tool boards, the sander, the trestle): each throws its own pool on the wall, the work and the boards at its foot
      for (const z of [90, 108, 121, 134.5, 147, 165, 178, 192]) bracketLamp(mg, -35, 10.6, z, 1, 0, 3.4, 0.8);
      await ctx.yield();
      for (const x of [48.5, 62, -48.5, -62]) bracketLamp(mg, x, 13, 75, 0, -1);
      for (let i = 0; i < 4; i++) { bracketLamp(mg, -86 - 22 * i, 16.5, -71, 0, 1, 2.4, i === 3 ? 0.3 : 0.5); bracketLamp(mg, -86 - 22 * i, 16.5, -11, 0, -1, 2.4, i === 3 ? 0.3 : 0.5); }
      for (const z of [32, 46, 60]) bracketLamp(mg, 75, 29.5, z, -1, 0, 3.2, 1);                    // over the tall east doors, above their running rail
      await ctx.yield();
      // pendant shades
      for (const p of pendants) {
        mg.beam([p[0], 34, p[2]], [p[0], p[1] + 1.2, p[2]], 0.36, 0.36, IRON, { round: 6 });
        const shop = p[0] < -78 && p[0] > -136, sk = p[3] ? 0.72 : 1;                                // the paint shop's lamps wear white enamel shades and burn whiter; the despatch end's are small and amber
        mg.cyl(p[0], p[1] + 0.6 * sk, p[2], (shop ? 2.9 : 2.4) * sk, 0.5 * sk, 1.5 * sk, shop ? '#d6d2c6' : GREEN, { sides: 14, open: true, jit: 0 });
        mg.cyl(p[0], p[1] + 1.5 * sk, p[2], 0.5 * sk, 0.35 * sk, 0.6, IRON, { sides: 8 });
        mg.cyl(p[0], p[1] - 0.1, p[2], 0.45 * sk, 0.3 * sk, 1.0 * sk, shop ? '#ffe9c8' : '#ffc070', { sides: 8, kind: 5, par: p[3] ? 2.6 : (p[2] > ARM_Z ? 2.0 : 3.2) * L.gas, jit: 0 });
      }
      await ctx.yield();
      // the east doors: two plank leaves, each 16 m wide, on an overhead rail, shut except at noon. Open, the north leaf is run back along the wall
      // (z 13.5 to 29.5). South of the opening there are only 13 m of wall before the bay's south wall (z 62 to 75), so the south leaf is run back as
      // far as the corner lets it (z 58.8 to 74.8, 0.2 m short of the wall's face) and its last 3.2 m still stand across the south end of the opening.
      // The flight's own picture at 16:9 and at 21:9 does not show that stretch (inside the frame it is hidden by the south arm's wall; where a straight line from
      // the flown line reaches it, it lies outside the frame); a window wider than about 2.55:1 does show it with the steady camera (at 32:9 for 51 frames at the
      // usual pace). The sea light's rule (hwDoor) and the fifth sea shaft still take the whole opening, z 30 to 62, as open.
      // The rail ends at the south wall's face in every look (z 13 to 75).
      const leaf = (z0, z1, x) => {
        const nb = Math.round((z1 - z0) / 1.6), bw = (z1 - z0) / nb, zc = (z0 + z1) / 2;
        for (let k = 0; k < nb; k++) mg.box(x, 13, z0 + (k + 0.5) * bw, 0.5, 26, bw - 0.08, GREEN, { kind: 1, par: 1, ao: [0, 4], jit: 0.2 });                 // boards, each its own tone, shade in the joints
        for (const z of [z0 + 0.55, z1 - 0.55]) mg.box(x - 0.36, 13, z, 0.26, 26, 1.1, '#17382e', { kind: 1, par: 1 });                                       // stiles
        for (const y of [2, 13, 24]) { mg.box(x - 0.4, y, zc, 0.3, 1.2, z1 - z0 - 0.6, IRON, {});                                                             // iron rails with their rivets
          for (let k = 0; k < 9; k++) mg.box(x - 0.58, y, z0 + 1.2 + k * (z1 - z0 - 2.4) / 8, 0.14, 0.3, 0.3, '#8492a0', { r: [0.785, 0, 0], jit: 0 }); }
        mg.beam([x - 0.4, 2.6, z0 + 0.5], [x - 0.4, 12.4, z1 - 0.5], 0.9, 0.3, '#17382e', { kind: 1, par: 1 });
        mg.beam([x - 0.4, 13.6, z1 - 0.5], [x - 0.4, 23.4, z0 + 0.5], 0.9, 0.3, '#17382e', { kind: 1, par: 1 });
        for (const dz of [-5, 5]) { mg.box(x - 0.1, 26.8, zc + dz, 0.2, 1.6, 0.5, IRON, {}); mg.cyl(x - 0.1, 27.6, zc + dz, 0.7, 0.7, 0.3, '#56626e', { r: [0, 0, Math.PI / 2], sides: 12 }); }   // hanger wheels on the running rail
        for (const dz of [-2.3, 2.3]) mg.box(x - 0.46, 4.9, zc + dz, 0.2, 9.4, 0.36, '#2a5a48', { kind: 1, par: 1, jit: 0 });                                  // a wicket door 9 m tall let into the leaf
        mg.box(x - 0.46, 9.5, zc, 0.2, 0.36, 4.96, '#2a5a48', { kind: 1, par: 2, jit: 0 }); mg.box(x - 0.6, 4.8, zc + 1.7, 0.2, 1.4, 0.2, '#8492a0', {});
      };
      if (noon) { leaf(13.5, 29.5, 74.2); leaf(58.8, 74.8, 74.2); } else { leaf(30, 46, 75.2); leaf(46, 62, 74.8); }
      mg.box(74.4, 26.6, 44, 0.5, 0.6, 62, IRON, {});
      if (!noon) {                                                                                                // shut doors: lamps on the wall either side, primed boards leaning on the leaves
        for (const z of [27, 65]) bracketLamp(mg, 75, 14, z, -1, 0, 2.6);
        for (let k = 0; k < 4; k++) { const z = [31.5, 44, 48.5, 60.5][k], lean = 0.16 + 0.05 * hash1(k * 3.3), cx = 73.7 - 5.2 * lean, prim = k % 2 === 1;
          mg.box(cx, 5.2, z, 0.35, 10.4, 3.7, prim ? '#868a8e' : '#b9a67e', { r: [0, 0, -lean], kind: prim ? 0 : 1, par: 1 });
          mg.box(cx - 0.2, 5.2, z, 0.2, 9.4, 2.9, prim ? '#75797d' : '#927850', { r: [0, 0, -lean], kind: prim ? 0 : 1, par: 1, jit: 0 });
          mg.add(ringGeo, { p: [cx - 0.36, 5.4, z], r: [0, Math.PI / 2, 0], s: [1.15, 1.15, 1.6], c: prim ? '#9a9ea2' : '#6e583c', jit: 0 });
          occ.push([cx - 1.4, z - 2.2, 75, z + 2.2, 0.5]); }
      }
      views.push({ a: [150, 0, 150], b: [150, 0, -60], c: [150, 70, -60], d: [150, 70, 150], w: 210, h: 70, mode: 1 });
      await ctx.yield();
      // THE FREIGHT DOORWAY in the west end wall, thrown wide for despatch, and THE END WALL round it, the shop's showpiece. The opening is
      // 34 m wide and 26 tall at the wall's face and steps back through three orders into the loading shed (34 by 26, 31 by 24.5, 28 by 23:
      // each order 1.5 m narrower a side and 1 m deeper, with a bead of leaf on its arris). Either side of it the wall is dressed from the dado
      // to the roof: two carved pilasters a side in the scheme's deep colour, fluted in leaf with a leaf capital, two painted panels between them
      // one above the other (a fan and a sun; a wreath and a fan), a third above the cornice, and a moulded cornice right across the wall with
      // a row of steady bulbs on it. All of it is deep-toned and lit only by those bulbs: the portal stays the brightest thing in the end.
      // Its two plank doors are run right back along their rail behind the wall, out of sight.
      const STONE = '#a9a294', STONEL = '#beb5a2', CANVASD = '#8a7658', DEEPH = ['#1F4A3C', '#1b3384', '#3a2c26'][schemeId], DEEPW = '#' + cD.set(DEEPH).multiplyScalar(0.8).getHexString();
      for (const z of [-69.7, -59.3, -22.7, -12.3]) {
        mg.box(-175.4, 14, z, 1.2, 28, 2.6, DEEPW, { jit: 0.04, ao: [0, 5] }); mg.box(-175.2, 1.1, z, 1.6, 2.2, 3.1, STONE, {}); mg.box(-175.2, 28.4, z, 1.7, 0.9, 3.2, STONEL, {});
        for (const dz of [-0.7, 0, 0.7]) mg.box(-174.76, 17.6, z + dz, 0.14, 14.6, 0.28, GILT, { kind: 5, par: GILTK * 0.8, jit: 0 });      // three flutes in leaf
        mg.box(-175.1, 9.5, z, 1.7, 0.6, 3.0, GILT, { kind: 5, par: GILTK * 0.6, jit: 0 });
        mg.box(-175.1, 26.6, z, 1.8, 1.5, 3.2, GILT, { kind: 5, par: GILTK * 0.8, jit: 0 });                                                 // the capital: a block of leaf with a scroll either side
        for (const s2 of [-1, 1]) mg.add(ringGeo, { p: [-174.2, 26.5, z + s2 * 1.0], r: [0, Math.PI / 2, 0], s: [0.55, 0.55, 2.0], c: GILT, kind: 5, par: GILTK, jit: 0 });
      }
      mg.box(-175.4, 27.1, -41, 1.2, 1.7, 34, STONE, {}); mg.box(-175.1, 27.1, -41, 1.5, 2.3, 1.9, STONEL, { jit: 0 });
      mg.box(-175.15, 29.15, -41, 1.9, 0.5, 58.6, STONEL, { jit: 0 }); mg.box(-174.95, 29.6, -41, 2.4, 0.4, 59, STONE, { jit: 0 });      // the cornice, right across the wall
      for (let i = 0; i < 39; i++) mg.box(-174.7, 28.7, -69.5 + i * 1.5, 0.5, 0.5, 0.7, STONEL, { jit: 0.05 });           // dentils
      for (let z = -69; z <= -12.9; z += 2) gateBulbs.push([-173.55, 30.1, z]);                                             // and its bulbs
      for (const sd of [-1, 1]) { const zc = -41 + sd * 23.5;
        gasAt.push([-173.4, 29.6, zc, 0.6]);                                                                                 // the cornice's bulbs light what hangs below them
        panel(mg, -176, 14.5, zc, 1, 0, 7.4, 8.4, sd < 0 ? 0 : 1, false, false, sd < 0 ? 5 : 6);
        panel(mg, -176, 23.4, zc, 1, 0, 7.4, 8.4, sd < 0 ? 1 : 0, false, false, sd < 0 ? 4 : 2);         // (no device twice on this wall, and no shell, which is a fan at this distance: fan and wreath below, star and cartouche over them, roundel, sunburst and crossed sprays along the top)
        await ctx.yield(); }
      for (let k = 1; k <= 2; k++) { const hw = 17 - 1.5 * k, x = -177.0 - k, top = 26 - 1.5 * k, col = k === 1 ? DEEPW : '#6a5a48';   // the second and third orders
        for (const sd of [-1, 1]) { mg.box(x, top / 2, -41 + sd * (hw + 0.75), 1.0, top, 1.5, col, { jit: 0.04, ao: [0, 4] }); mg.box(x + 0.5, top / 2, -41 + sd * hw, 0.16, top, 0.16, GILT, { kind: 5, par: GILTK * 0.6, jit: 0 }); }
        mg.box(x, top + 0.75, -41, 1.0, 1.5, 2 * hw + 3, col, { jit: 0.04 }); mg.box(x + 0.5, top, -41, 0.16, 0.16, 2 * hw, GILT, { kind: 5, par: GILTK * 0.6, jit: 0 }); }
      panel(mg, -176, 34.6, -41, 1, 0, 12, 7.4, 0);
      mg.box(-174.4, 26.0, -41, 0.36, 0.5, 46, IRON, { jit: 0 }); mg.box(-173.9, 0.07, -41, 0.4, 0.14, 46, IRON, { jit: 0 });   // the running rail and its guide in the floor
      await ctx.yield();
      // THE PAINT SHOP'S MOUTH: under the lintel girder a long fascia in the finished green, in bays between gilt strips: fields of the scheme's
      // colours, each framed, lined and carrying a relief in leaf, a great sunburst over the middle with a shell crest above it, and a row of steady bulbs
      // along its foot (drawn with the doorway's bulbs, below). It faces the wheel; its foot is 13.4 m above the flown line.
      { const FX = -74.2, y0 = 25.4, y1 = 30.8, ym = (y0 + y1) / 2;
        mg.box(FX - 0.3, ym, -41, 0.5, y1 - y0, 56.6, GREEN, { kind: 1, par: 2, jit: 0 });
        for (const y of [y0 + 0.22, y1 - 0.22]) mg.box(FX, y, -41, 0.34, 0.44, 57, GILT, { kind: 5, par: GILTK, jit: 0 });
        for (let k = 0; k <= 8; k++) mg.box(FX, ym, -69 + k * 7, 0.3, y1 - y0 - 0.8, 0.5, GILT, { kind: 5, par: GILTK, jit: 0 });
        // six fields, three either side of the middle: each a moulded frame, a lined field and a relief in leaf at its centre (the wall
        // panels' own, six different devices: shell, fan, scrolled cartouche with its leaf spray, wreath, star, roundel), no two alike
        [[0, 1, 0], [1, 5, 1], [2, 2, 0], [5, 6, 1], [6, 4, 0], [7, 3, 1]].forEach(([k, des, i]) => panel(mg, FX - 0.42, ym, -65.5 + k * 7, 1, 0, 6.1, 4.3, i, false, true, des));
        await ctx.yield();
        mg.box(FX - 0.02, ym, -41, 0.2, y1 - y0 - 0.9, 13.4, vivid(SCH[0]), { jit: 0 });
        for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, r1 = k % 2 ? 1.75 : 2.5, c = Math.cos(a), sn = Math.sin(a);                                   // the sunburst
          mg.beam([FX + 0.2, ym + sn * 0.5, -41 + c * 0.5], [FX + 0.2, ym + sn * r1, -41 + c * r1 * (1 + 1.3 * Math.abs(c))], 0.6, 0.6, GILT, { round: 4, taper: 0.08, kind: 5, par: GILTK, jit: 0 }); }
        mg.add(dome, { p: [FX + 0.2, ym, -41], q: qB, s: [0.8, 0.5, 0.8], c: GILT, kind: 5, par: GILTK, jit: 0 });
        for (let k = 0; k < 9; k++) { const a = (0.12 + 0.76 * k / 8) * Math.PI, r1 = k % 2 ? 2.7 : 3.5, c = Math.cos(a), sn = Math.sin(a);                   // the shell crest, before the girder
          mg.beam([FX + 0.5, y1 + sn * 0.3, -41 + c * 0.3], [FX + 0.5, y1 + sn * r1, -41 + c * r1 * 1.5], 1.5, 1.5, k % 2 ? vivid(SCH[2]) : GILT, { round: 4, taper: 0.12, jit: 0, ...(k % 2 ? {} : { kind: 5, par: GILTK }) }); }
        for (let z = -68; z <= -13.9; z += 2) gateBulbs.push([FX + 0.4, y0 - 0.25, z]);
      }
      await ctx.yield();
      // THE FREIGHT DOORWAY'S FRONT, the gilded quarter's own work round the portal: a slim hoop standing proud of the drawn-back doors
      // (x -173.3 to -172.3, radius 8.7 to 10.4 about the portal's centre, so 1.7 m and more outside the portal's rim and 2.9 m behind
      // it): a gilt bead, a field of the scheme's two deep colours panel by panel with a gilt leaf or a bevelled mirror on each, a stepped
      // gilt moulding carrying forty-eight steady bulbs; over its head, on the wall, a sunburst of long tapered blades in two layers
      // (thirteen long, twelve short between them), each blade ridged with a lit side and a shade side and a bulb at its root.
      // Through the hoop and under its lower arc the doorway stands OPEN on the loading shed. Nothing of it crosses the portal's ring.
      { const AX = -172.9, CY = 12, CZ = -41, N = 48, deep = (hex, k = 0.5) => '#' + cD.set(hex).lerp(cG, 0.1).multiplyScalar(k).getHexString();
        const GILT2 = schemeId === 1 ? '#b3aa94' : '#e0a62e', GILTD = deep(GILT2, 0.6), DEEP1 = deep(SCH[0], schemeId === 2 ? 0.42 : 0.6), DEEP2 = deep(SCH[2], schemeId === 2 ? 1.2 : 0.75), gl = (k) => ({ kind: 5, par: GILTK * k, jit: 0 });
        const blades = [-1, 1].map((sd) => { const g = new THREE.BufferGeometry(), A = [-0.5 * sd, 0, 0], R = [0, 0, 0.34], T = [0, 1, 0.05];
          g.setAttribute('position', new THREE.Float32BufferAttribute(sd < 0 ? [...R, ...A, ...T] : [...A, ...R, ...T], 3)); g.computeVertexNormals(); return g; });
        const blade = (am, r0, r1, w, x, k) => { const c = Math.cos(am), sn = Math.sin(am);
          qB.setFromRotationMatrix(mB.makeBasis(vX.set(0, c, -sn), vY.set(0, sn, c), vZ.set(1, 0, 0)));
          mg.add(blades[0], { p: [x, CY + sn * r0, CZ + c * r0], q: qB, s: [w, r1 - r0, 1], c: GILT2, ...gl(0.85 * k) }); mg.add(blades[1], { p: [x, CY + sn * r0, CZ + c * r0], q: qB, s: [w, r1 - r0, 1], c: GILTD, ...gl(0.3 * k) }); };
        for (let k = 0; k < N; k++) { const am = (k + 0.5) / N * TAU, c = Math.cos(am), sn = Math.sin(am), rot = [Math.PI / 2 - am, 0, 0];
          const seg = (r0, r1, x, dep, col, o = {}) => mg.box(x, CY + sn * (r0 + r1) / 2, CZ + c * (r0 + r1) / 2, dep, r1 - r0, TAU * r1 / N * 1.01, col, { r: rot, jit: 0.04, ...o });
          seg(8.7, 9.02, AX + 0.2, 1.0, GILT2, gl(1)); seg(9.0, 10.1, AX, 0.7, (k >> 1) % 2 ? DEEP1 : DEEP2);
          seg(10.08, 10.26, AX + 0.2, 1.0, GILT2, gl(1)); seg(10.24, 10.4, AX + 0.05, 0.8, GILTD, gl(0.5));
          gateBulbs.push([AX + 0.8, CY + sn * 10.17, CZ + c * 10.17]);
          if (k % 2) blade(am, 9.12, 10.0, 0.62, AX + 0.36, 1);                                                             // a gilt leaf on the field
          else if (k % 4 === 0) { mg.cyl(AX + 0.4, CY + sn * 9.55, CZ + c * 9.55, 0.42, 0.42, 0.14, GILT2, { r: [0, 0, Math.PI / 2], sides: 10, ...gl(1) });
            mg.cyl(AX + 0.47, CY + sn * 9.55, CZ + c * 9.55, 0.3, 0.3, 0.12, '#cfe0ea', { r: [0, 0, Math.PI / 2], sides: 10, kind: 5, par: 0.3 + 0.3 * L.gas, jit: 0 }); }   // a bevelled mirror
          else mg.add(dome, { p: [AX + 0.36, CY + sn * 9.55, CZ + c * 9.55], q: qB.setFromRotationMatrix(mB.makeBasis(vX.set(0, 0, -1), vY.set(1, 0, 0), vZ.set(0, -1, 0))), s: [0.3, 0.3, 0.3], c: GILT2, ...gl(1) });
        }
        for (let k = 0; k < 25; k++) { const a = (18 + 144 * k / 24) * Math.PI / 180, long = k % 2 === 0;                    // the sunburst over the head, on the wall above the lintel
          blade(a, 10.5, long ? (k % 4 === 0 ? 16.4 : 15.0) : 12.9, long ? 1.5 : 1.05, AX + (long ? -0.25 : 0.1), long ? 0.8 : 1);
          gateBulbs.push([AX + 0.75, CY + Math.sin(a) * 10.75, CZ + Math.cos(a) * 10.75]); }
        for (const g of blades) g.dispose();
        for (const z of [-64.5, -17.5]) panel(mg, -176, 34, z, 1, 0, 7.4, 7, z < -41 ? 1 : 3, false, false, z < -41 ? 3 : 7);         // finished panels high on the end wall, either side of the head's
      }
      await ctx.yield();
      // THE DIM COVERED LOADING SHED beyond the open doorway, 40 m deep (x -176 to -216): dark boarded walls, a timber roof on two rows of
      // posts with tie beams, low lanterns on the posts receding down both sides of the way, crates on the dock and a dray with a sheeted
      // load. Its lanterns are small and low; its brightest point is far under the portal's disc.
      mg.box(-196.75, 13, -63, 38.5, 26, 1.5, '#6a5a4a', { kind: 3, jit: 0 }); mg.box(-196.75, 13, -19, 38.5, 26, 1.5, '#6a5a4a', { kind: 3, jit: 0 });   // the side walls end against the end wall's west face (x -177.5)
      mg.box(-216, 13, -41, 1.5, 26, 46, '#7a6a56', { kind: 3, jit: 0 }); mg.box(-196, 26.4, -41, 42, 1, 46.1, '#4a3e34', {});   // the roof lies 0.1 m into the walls' tops (y 25.9 to 26.9): the underside of the wall over the doorway (y 26) is inside it; it is 5 cm wider than the far end wall either side (z -64.05 to -17.95), so that its edges share no plane with that wall's ends; the same 5 cm show at its east end, which stands a metre into the hall over the two niches
      mg.box(-196, -0.5, -41, 40, 1, 44, '#4a3828', { kind: 2, jit: 0 });
      views.push({ a: [-215, 15, -24], b: [-215, 15, -58], c: [-215, 22, -58], d: [-215, 22, -24], w: 34, h: 7, mode: 2 });
      for (let i = 0; i < 3; i++) {
        const x = -183 - i * 10.5; mg.box(x, 24.6, -41, 0.8, 1.1, 43, '#3a2c20', { kind: 1, par: 2 });
        for (const sd of [-1, 1]) { const z = -41 + sd * 12.5, lx = -188 - i * 10, lz = -41 + sd * (20 + i * 0.3);
          mg.box(x, 13, z, 0.9, 26, 0.9, DEEPW, { jit: 0.04, ao: [0, 4] }); mg.box(x, 9.4, z, 1.1, 0.7, 1.1, GILT, { kind: 5, par: GILTK * 0.7, jit: 0 });   // the shed's posts are painted in the scheme's deep colour, a gilt band at the lanterns' height mg.beam([x, 17, z], [x, 24.2, z - sd * 5], 0.5, 0.5, '#3a2c20', { kind: 1, par: 1 });
          mg.beam([lx, 9.3, -41 + sd * 21.2], [lx, 9.1, lz], 0.2, 0.2, IRON, { round: 5 }); mg.cyl(lx, 8.9, lz, 0.8, 0.2, 0.4, IRON, { sides: 6 });   // a lantern on a bracket from the shed's wall: three a side, receding
          mg.cyl(lx, 8.1, lz, 0.5, 0.4, 1.2, '#ffb060', { sides: 6, kind: 5, par: 2.4, jit: 0 }); shedLamps.push([lx, 8.1, lz]); gasAt.push([lx, 8.5, lz, 0.9 + 0.25 * i]); }   // (brighter the deeper they hang: the shed's far end is its lightest)
      }
      for (const sd of [-1, 1]) { mg.beam([-213.6, 14.4, -41 + sd * 9], [-212.6, 14.2, -41 + sd * 9], 0.2, 0.2, IRON, { round: 5 }); mg.cyl(-212.6, 13.2, -41 + sd * 9, 0.6, 0.5, 1.5, '#ffb060', { sides: 6, kind: 5, par: 2.4, jit: 0 });
        shedLamps.push([-212.6, 13.2, -41 + sd * 9]); gasAt.push([-212.6, 13.4, -41 + sd * 9, 1.6]); }                 // and two larger lanterns on the far wall, either side of its window
      // THE TWO NICHES OF THE END WALL, the bays between its pilasters either side of the doorway (z -64.5 and -17.5, 23.5 m from the flown line),
      // each under its own bracket lamp with one whole thing standing in it. South: the despatch crates, one open, a finished head packed in
      // straw looking out of it. North: the painter's stepladder, his pots at its foot and one on its top step.
      for (const zc of [-64.5, -17.5]) bracketLamp(mg, -175.2, 10.6, zc, 1, 0, 3.2, 1.2);
      { const cx = -170.6, cz = -64.5;
        mg.box(cx - 1.6, 1.9, cz - 1.6, 4.4, 3.8, 3.8, '#8a7052', { kind: 1, par: 1, ao: [0, 2] }); for (const s2 of [-1, 1]) mg.box(cx - 1.6, 1.9 + s2 * 1.2, cz - 1.6, 4.6, 0.5, 4.0, '#5a4834', { kind: 1, par: 0 });
        mg.box(cx - 1.9, 4.9, cz - 1.9, 3.2, 2.2, 2.8, '#96795a', { kind: 1, par: 1 }); mg.box(cx - 1.9, 4.9, cz - 1.9, 3.4, 0.4, 3.0, '#5a4834', { kind: 1, par: 0 });
        for (const [dx, dz, w, d] of [[0, -2.05, 4.6, 0.3], [0, 2.05, 4.6, 0.3], [-2.15, 0, 0.3, 4.4], [2.15, 0, 0.3, 4.4]]) mg.box(cx + 1.4 + dx, 1.3, cz + 3.4 + dz, w, 2.6, d, '#8a7052', { kind: 1, par: 1, ao: [0, 1.6] });   // the open crate: four sides
        mg.box(cx + 1.4, 0.2, cz + 3.4, 4.6, 0.4, 4.4, '#6a5640', { kind: 1, par: 0 }); mg.box(cx + 1.4, 1.5, cz + 3.4, 4.0, 1.5, 3.8, '#c9ae62', { jit: 0.2 });                                                  // its floor, and the straw
        mg.box(cx + 4.4, 1.9, cz + 3.4, 0.3, 3.8, 4.6, '#96795a', { kind: 1, par: 1, r: [0, 0, -0.22] });                                                                                                       // its lid, leaning on it
        copies.push({ set: 'head', kind: 'head', item: { matrix: new THREE.Matrix4().makeRotationY(0.25).scale(vX.set(0.62, 0.62, 0.62)).setPosition(cx + 1.2, 1.6, cz + 3.4), stage: 6, frac: 1, body: '#8a4a2a', hair: '#2a1a12' } });
        occ.push([cx - 4, cz - 3.8, cx + 5, cz + 5.9, 0.6]); }
      { const lx = -171.2, lz = -15.2, P3 = (a, y, b) => [lx + b, y, lz + a];
        for (const s of [-1, 1]) { mg.beam(P3(s * 1.5, 0, 1.8), P3(s * 1.0, 8, 0), 0.4, 0.22, '#c9b282', { kind: 1, par: 1 }); mg.beam(P3(s * 1.6, 0, -2.4), P3(s * 1.0, 8, 0), 0.3, 0.2, '#c9b282', { kind: 1, par: 1 }); }
        for (let k = 1; k < 8; k++) mg.beam(P3(-1.5 + k * 0.06, k, 1.8 - k * 0.225), P3(1.5 - k * 0.06, k, 1.8 - k * 0.225), 0.14, 0.6, '#b89a6c', { kind: 1, par: 0 });
        mg.box(lx, 8.1, lz, 1.2, 0.25, 2.6, '#b89a6c', { kind: 1, par: 0 });
        const pot = (x, y, z, r, c) => { mg.cyl(x, y + r * 0.7, z, r, r * 0.92, r * 1.4, '#59636c', { sides: 10 }); mg.cyl(x, y + r * 1.42, z, r * 0.9, r * 0.9, 0.06, c, { sides: 10, jit: 0 }); };
        pot(lx, 8.22, lz, 0.5, vivid(SCH[0])); pot(lx + 3.4, 0, lz - 2.6, 0.9, vivid(SCH[0])); pot(lx + 2.6, 0, lz - 5.0, 0.8, vivid(SCH[2])); pot(lx + 4.6, 0, lz - 4.2, 0.7, '#e3d6b4'); pot(lx + 1.2, 0, lz - 3.8, 0.6, GILT);
        mg.beam([lx + 3.4, 1.5, lz - 2.6], [lx + 4.5, 2.6, lz - 2.2], 0.16, 0.16, '#b89a6c', { round: 5, kind: 1, par: 1 });
        occ.push([lx - 2.6, lz - 6, lx + 5.4, lz + 2, 0.5]); }
      for (const [x, z, w, h, ry] of [[-193, -58.5, 4.2, 4.2, -0.15], [-203, -59, 4.6, 3.6, 0.3], [-207, -24, 4.6, 3.8, 0.2]]) {   // crates on the dock, along the walls
        mg.box(x, h / 2, z, w, h, w * 0.85, '#7a6248', { kind: 1, par: 1, r: [0, ry, 0], ao: [0, 2] });
        for (const s2 of [-1, 1]) mg.box(x, h / 2 + s2 * h * 0.3, z, w + 0.2, 0.5, w * 0.85 + 0.2, '#4a3a2c', { kind: 1, par: 0, r: [0, ry, 0] }); }
      { const dx = -188, dz = -25.5;                                                                               // the dray drawn up by the door, its sheeted load roped down
        mg.box(dx, 2.0, dz, 11, 0.5, 5.4, '#5b4634', { kind: 1, par: 0 });
        for (const ex of [-3.8, 3.8]) for (const sd of [-1, 1]) { mg.add(ringGeo, { p: [dx + ex, 1.5, dz + sd * 3.0], s: [1.45, 1.45, 3], c: '#3d4650', jit: 0 }); for (let k = 0; k < 3; k++) mg.box(dx + ex, 1.5, dz + sd * 3.0, 2.8, 0.2, 0.2, '#6b5642', { r: [0, 0, k * 1.047], jit: 0 }); }
        mg.box(dx, 4.1, dz, 8.4, 3.8, 3.6, CANVASD, { jit: 0.05 }); mg.box(dx + 1.2, 6.5, dz, 4.2, 1.4, 2.6, CANVASD, { jit: 0.05 });
        drape(mg, dx, 6.0, dz - 1.85, 1, 0, 8.6, 3.6, CANVASD, { depth: 0.22 });
        for (const ex of [-2.4, 2.4]) mg.box(dx + ex, 4.2, dz, 0.16, 4.1, 3.8, '#8a7658', { jit: 0 }); }
      await ctx.yield();
      // brick piers under the trusses, finished panels hung high on the walls, paint-stained sheets drying in the paint shop
      for (let i = 0; i <= 5; i++) for (const sx of [-1, 1]) { const z = 75 + 27 * i - (i === 5 ? 1.2 : 0) + (i === 0 ? 2.6 : 0); mg.box(sx * 34.3, 17, z, 1.4, 34, 2.4, '#7a4e3c', { kind: 3, jit: 0 }); mg.box(sx * 34.1, 31.6, z, 1.8, 1.2, 3.0, '#a9a294', {}); }
      await ctx.yield();
      for (let i = 0; i < 5; i++) { if (i !== 1 && i !== 2) panel(mg, 35, 23.5, 88.5 + 27 * i, -1, 0, 9, 9, i, true); await ctx.yield(); panel(mg, -35, 28, 88.5 + 27 * i, 1, 0, 7.5, 6.5, i + 1, true); await ctx.yield(); }
      await ctx.yield();
      for (let i = 0; i < 4; i++) { panel(mg, [-65, -48, 48, 65][i], 21, 75, 0, -1, 9, 11, i, true); panel(mg, -75, 20, 2 + i * 19, 1, 0, 9, 11, i + 1, true); mg.box(-74.3, 17, 11.5 + i * 19, 1.4, 34, 2.4, '#7a4e3c', { kind: 3, jit: 0 }); await ctx.yield(); }
      await ctx.yield();
      const CLOTH = ['#d9cfb8', '#c9a0a0', '#9fb0bf', '#d9c48a'];
      for (const [zf, nz] of [[-71, 1], [-11, -1]]) {
        for (let i = 0; i < 4; i++) { panel(mg, -155 + i * 22, 25.5, zf, 0, nz, 9, 8, i + (nz > 0 ? 0 : 1)); await ctx.yield(); }
        mg.box(-125, 19.2, zf + nz * 0.7, 96, 0.36, 0.36, IRON, { jit: 0 });
        for (let i = 0; i < 15; i++) { if (i % 5 === 4) continue; const x = -169 + i * 6.2 + hash1(i * 3 + nz) * 1.2, len = 3.6 + hash1(i * 7 + nz) * 2.2;
          drape(mg, x, 19.1, zf + nz * 0.75, nz, 0, 4.6, len, CLOTH[(i + (nz > 0 ? 1 : 0)) % 4], { folds: 3, depth: 0.2, jit: 0.08 }); }
        await ctx.yield();
      }
      await ctx.yield();
      await bakeGas(mg); await ctx.yield();
      await mg.pack(ctx.yield); addMesh(mg, 'hall-shell');
      await ctx.yield();
      const vm = new THREE.Mesh(buildViewGeometry(views), viewMat); vm.name = 'glass'; vm.frustumCulled = false; scene.add(vm);
    }
    await ctx.yield();

    // ---- 3 carving shop (south arm) --------------------------------------------------------------------------------
    const WOODC = '#b89a6c', CREAM = '#d9c8a2', STEEL = '#9aa7b0', BRASS = '#b88a3a', CANVAS = '#8a7658';
    const rimGeo = new THREE.TorusGeometry(1, 0.1, 5, 16);
    const curl = new THREE.TorusGeometry(1, 0.07, 4, 12, 5.6);                      // a shaving: a curled band
    const spare = (kind, x, y, z, ry, stage, frac, extra) => copies.push({ set: 'spare', kind, item: { matrix: new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z), stage, frac, ...extra } });
    // a low shop trolley (deck top y 1.1, iron wheels, a socket block for the pole, a draw bar) and the animal that stands ON it: its lowest
    // hoof on the deck, its pole in the socket. stage 1 puts a glued, band-sawn blank on it.
    const DECK = 1.1;
    const trolley = (m, x, z, ry, kind, stage, frac = 0.7, extra = {}, y0 = 0, K = 1, bar = true, len = 8.4) => {
      const c = Math.cos(ry), sn = Math.sin(ry), at = (a, b) => [x + a * K * c + b * K * sn, z - a * K * sn + b * K * c];
      const hl = len / 2;                                                                         // (len: the deck's length on the trolley's own scale; 8.4 unless it stands coupled close)
      m.box(x, y0 + 0.9 * K, z, len * K, 0.4 * K, 4.4 * K, '#6a5236', { kind: 1, par: 0, r: [0, ry, 0] });
      for (const b of [-1.7, 1.7]) { const q = at(0, b); m.box(q[0], y0 + 0.58 * K, q[1], (len - 0.8) * K, 0.26 * K, 0.4 * K, IRON, { r: [0, ry, 0] }); }
      for (const [a, b] of [[-hl + 1.2, -2.0], [hl - 1.2, -2.0], [-hl + 1.2, 2.0], [hl - 1.2, 2.0]]) { const q = at(a, b); m.cyl(q[0], y0 + 0.55 * K, q[1], 0.55 * K, 0.55 * K, 0.3 * K, '#56626e', { r: [Math.PI / 2, 0, ry], sides: 10 }); }
      m.box(x, y0 + 1.45 * K, z, 1.1 * K, 0.7 * K, 1.1 * K, '#b89a6c', { kind: 1, par: 1, r: [0, ry, 0] });
      const q = at(-hl, 0), q2 = at(-hl - 2.4, 0);                                               // the draw bar (unshipped where another trolley stands close behind: bar false)
      if (bar) { m.beam([q[0], y0 + 0.9 * K, q[1]], [q2[0], y0 + 2.7 * K, q2[1]], 0.2 * K, 0.2 * K, IRON, { round: 5 }); m.beam([q2[0] - sn * 0.7 * K, y0 + 2.7 * K, q2[1] - c * 0.7 * K], [q2[0] + sn * 0.7 * K, y0 + 2.7 * K, q2[1] + c * 0.7 * K], 0.2 * K, 0.2 * K, IRON, { round: 5 }); }
      copies.push({ set: stage === 1 ? 'blank' : 'trolley', kind, item: { matrix: new THREE.Matrix4().makeRotationY(ry).scale(vX.set(K, K, K)).setPosition(x, y0, z), top: y0 + DECK * K, stage, frac, ...extra } });
      { const cs = [at(bar ? -hl - 2.7 : -hl, -2.2), at(bar ? -hl - 2.7 : -hl, 2.2), at(hl, -2.2), at(hl, 2.2)], xs = cs.map((p) => p[0]), zs = cs.map((p) => p[1]);   // its own footprint, draw bar and all
        occ.push([Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), 0.6]); }
    };
    const HOIST = { x: 3, z: 132, k: 1.25, low: 18.986356, py: 29.8 };               // the travelling hoist: its crab's place, the horse's size on the sculpt's own, its lowest point (the soles of its gilt shoes: 18.986356 leaves its legs' wood at y 19.35, where it hung before the shoes were measured), the hook's height
    const spinners = [];                                                            // { mesh, axis, speed }
    const steamAt = [];
    let mallet = null, ladder = null, hoistTackle = null;
    {
      const mg = makeMerger();
      // the carver's island
      // (its near edge is 10.2 m from the arm's axis, 9.4 m from the flown line at the nearest: the whole island, bench, head and tools, lies in the picture's left as one thing)
      mg.bench(-21, 140, -10.2, 170, 3.6, WOODC, { th: 0.7, leg: 1.0 }); occ.push([-21, 140, -10.2, 170, 0.7]);
      mg.box(-15.6, 3.62, 155, 10.2, 0.06, 29.4, '#8f7650', { kind: 1, par: 2, jit: 0 });                             // worn top
      // the wooden vice holding the great head
      const HX = -14.6, HK = 1.5, VK = HK / 1.15;                                                                     // the head's place on the bench; its size on the sculpt's own (the tallest thing on the island, pale under the island's lamp)
      for (const s of [-1, 1]) {
        mg.box(HX, 3.6 + 1.4 * VK, 155 + s * 2.5 * VK, 4.6 * VK, 2.8 * VK, 1.1, '#7a5a3a', { kind: 1, par: 0 });
        mg.box(HX, 3.95, 155 + s * (2.5 * VK + 0.9), 5.4 * VK, 0.7, 1.5, '#6a4c30', { kind: 1, par: 0 });
        mg.cyl(HX + s * 1.5, 5.4, 155 + s * (2.5 * VK + 1.8), 0.36, 0.36, 3.0, '#8a6a44', { r: [Math.PI / 2, 0, 0], sides: 8, kind: 1, par: 2 });   // screws
        mg.beam([HX + s * 1.5, 4.2, 155 + s * (2.5 * VK + 3.3)], [HX + s * 1.5, 6.7, 155 + s * (2.5 * VK + 3.3)], 0.26, 0.26, IRON, { round: 6 });
        mg.cyl(HX + s * 1.5, 5.4, 155 + s * (2.5 * VK + 3.3), 0.5, 0.5, 0.6, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 });
      }
      copies.push({ set: 'head', kind: 'head', item: { matrix: new THREE.Matrix4().makeRotationY(-0.3).scale(new THREE.Vector3(HK, HK, HK)).setPosition(HX, 3.75, 155), stage: 3, frac: 0.75 } });
      // gouges 3 m long laid in a fan, a rack of smaller chisels, a whetstone, a mug and a stool for scale
      for (let i = 0; i < 6; i++) {
        const a = -0.5 + i * 0.2, ox = -16.5, oz = 147.5, dx = Math.sin(a), dz = -Math.cos(a), y = 3.92;
        mg.beam([ox, y, oz], [ox + dx * 1.2, y, oz + dz * 1.2], 0.5, 0.5, i % 2 ? '#7a3d22' : '#9a6a30', { round: 8, kind: 1, par: 1, taper: 0.7 });
        mg.beam([ox + dx * 1.2, y, oz + dz * 1.2], [ox + dx * 1.45, y, oz + dz * 1.45], 0.4, 0.4, BRASS, { round: 8, jit: 0 });
        mg.beam([ox + dx * 1.45, y - 0.05, oz + dz * 1.45], [ox + dx * 3.0, y - 0.1, oz + dz * 3.0], 0.34 + (i % 3) * 0.12, 0.1, STEEL, { jit: 0.04 });
        mg.beam([ox + dx * 3.0, y - 0.1, oz + dz * 3.0], [ox + dx * 3.25, y - 0.14, oz + dz * 3.25], 0.3 + (i % 3) * 0.12, 0.05, '#c9d4da', { jit: 0 });
      }
      // (the island carries the great head in its vice, the fan of long gouges and the mallet, and nothing small: no rack of chisels, no stone, no mug)
      mg.cyl(-24, 2.6, 163, 0.9, 0.9, 0.3, WOODC, { sides: 12, kind: 1, par: 0 }); for (let i = 0; i < 3; i++) { const a = i * 2.094; mg.beam([-24 + Math.cos(a) * 0.5, 2.5, 163 + Math.sin(a) * 0.5], [-24 + Math.cos(a) * 1.0, 0, 163 + Math.sin(a) * 1.0], 0.22, 0.22, WOODC, { kind: 1, par: 1 }); }
      await ctx.yield();
      // shavings as big as barrels, on the bench and the floor round it
      const cr = rng.fork('curls');
      for (let i = 0, laid = 0; i < 26; i++) {
        const on = i < 9, r = cr.range(0.45, 0.95), x = on ? cr.range(-20, -10) : cr.range(-25, -5.5), z = on ? cr.range(149, 168) : cr.range(138, 173);
        const ry = cr.range(0, 3.14), rz = cr.range(0, 6.28), sz = cr.range(4, 9);                                    // every draw, whether or not the curl is laid
        if (on && (x > -13 || (Math.abs(x - HX) < 5.6 && Math.abs(z - 155) < 9.2))) continue;
        if (!on && x > -21.6 && x < -9 && z > 139.4 && z < 170.6) continue;
        if (!on && x > -22) continue;                                                                               // none on the floor between the island and the flown line: they lie in its lee, west of it
        if (laid >= CURL_CAP) { mg.skip(); continue; }                                                              // THE CAP (CURL_CAP, 11: seeds 1 to 1,200 lay 9 at the most): a curl past it is not laid; its six draws are taken above all the same
        laid++;
        mg.add(curl, { p: [x, (on ? 3.6 : 0) + r * 0.96, z], r: [0, ry, rz], s: [r, r, r * sz], c: '#94703c', jit: 0.16 });
      }
      await ctx.yield();
      // glue pot on its burner, the apron on its hook
      // (it stands on its own iron stove by the west wall, 28 m from the flown line, under the wall lamp: its steam rises tall in that light)
      mg.cyl(-28.5, 1.5, 165.5, 1.5, 1.7, 3.0, IRON, { sides: 10, ao: [0, 2] }); mg.cyl(-28.5, 3.9, 165.5, 1.3, 1.45, 1.8, '#2e3338', { sides: 12 });
      mg.cyl(-28.5, 4.76, 165.5, 1.2, 1.2, 0.08, '#8a6a3a', { sides: 12, jit: 0 }); mg.beam([-28.2, 4.7, 165.7], [-27.3, 6.8, 166.5], 0.16, 0.16, WOODC, { round: 5 });
      occ.push([-30.2, 163.8, -26.8, 167.2, 0.6]);
      steamAt.push([-28.5, 4.9, 165.5, 13, 1.3]);
      mg.box(-21.4, 4.5, 141.2, 0.6, 9, 0.6, WOODC, { kind: 1, par: 1, ao: [0, 2] }); mg.beam([-21.4, 8.4, 141.2], [-22.4, 8.6, 141.2], 0.2, 0.2, IRON, { round: 5 });
      drape(mg, -22.5, 8.3, 141.2, 0, 1, 2.6, 4.2, CANVAS, { folds: 2, depth: 0.14, jit: 0 }); mg.box(-22.6, 5.4, 141.2, 0.1, 1.2, 1.4, '#6f5d44', { kind: 4, sway: [8.3, 4.1], jit: 0 });
      await ctx.yield();
      // east benches with legs, tails and ears awaiting fitting, tool boards on the wall behind
      for (const [z0, z1] of [[95, 126], [131, 162], [167, 200]]) {
        mg.bench(24, z0, 33, z1, 3.6, WOODC, { th: 0.6, leg: 0.9 }); occ.push([24, z0, 33, z1, 0.65]);
        mg.box(34.6, 8.5, (z0 + z1) / 2, 0.3, 7, z1 - z0 - 4, '#4a3828', { kind: 1, par: 2 });                       // tool board
        mg.box(34.2, 4.9, (z0 + z1) / 2, 1.2, 0.25, z1 - z0 - 4, WOODC, { kind: 1, par: 2 });                        // shelf under it
        const n = Math.floor((z1 - z0 - 5) / 1.15);
        for (let i = 0; i < n; i++) {
          const z = z0 + 2.8 + i * 1.15, h = hash1(i * 3.1 + z0), y = 9.6 + (i % 2) * 0.4;
          if (h < 0.18) continue;
          // what the board carries differs bay by bay: chisels and gouges (south bay), carved legs and horsehair tails hung by their tops
          // (middle bay), bow saws, coils of rope and hand saws (north bay)
          if (z0 > 160) { mg.cyl(34.25, y + 1.2, z, 0.2, 0.15, 1.3, h > 0.6 ? '#7a3d22' : '#9a6a30', { sides: 6, kind: 1, par: 1 });
            mg.box(34.3, y - 0.2 - h, z, 0.08, 1.6 + h * 2, 0.2 + 0.3 * hash1(i + 5), STEEL, { jit: 0.05 }); }
          else if (z0 > 120) { if (i % 2) continue;
            if (i % 6 === 4) mg.beam([34.1, 11.6, z], [34.0, 7.6 - h, z], 0.7, 0.5, ['#1e1512', '#e8e0cc', '#7a3b1e'][(i >> 1) % 3], { round: 6, taper: 0.3, jit: 0.15 });
            else { mg.beam([34.0, 11.7, z], [33.9, 9.8, z + 0.25], 0.62, 0.62, CREAM, { round: 6, taper: 0.62, kind: 1, par: 1 }); mg.beam([33.9, 9.8, z + 0.25], [34.0, 7.5 - h * 0.6, z], 0.4, 0.4, CREAM, { round: 6, taper: 0.8, kind: 1, par: 1 }); mg.box(34.0, 7.3 - h * 0.6, z, 0.5, 0.4, 0.5, '#8a6a44', { kind: 1, par: 0 }); }
            mg.box(34.3, 11.9, z, 0.3, 0.3, 0.3, IRON, {}); }
          else { if (i % 4 !== 1) continue;
            const k = (i >> 2) % 3;
            if (k === 0) {                                                                                             // a bow saw hung askew on a peg, each at its own height and tilt: two beech cheeks, a stretcher, the steel blade, the twisted cord with its toggle
              const th = ((i >> 2) % 2 ? 0.34 : -0.42) + (h - 0.5) * 0.3, yc = 9.0 + h * 0.9, cs = Math.cos(th), ss = Math.sin(th);
              const sw = (dy, dz, sy, sz, col, o) => mg.box(34.3, yc + dy * cs - dz * ss, z + dy * ss + dz * cs, 0.14, sy, sz, col, { r: [th, 0, 0], ...o });
              // (old beech gone dark with handling, a dull blade: quiet tools on the board, a tone over it and no more, under the bay's lamp)
              for (const d of [-1.05, 1.05]) sw(0, d, 2.5, 0.2, '#2c2219', { kind: 1, par: 1 });
              sw(0.25, 0, 0.18, 2.1, '#30251b', { kind: 1, par: 2 }); sw(-1.1, 0, 0.16, 2.2, '#4a535a', { jit: 0 });
              sw(1.1, 0, 0.06, 2.1, '#3a3226', { jit: 0 }); sw(0.7, 0.15, 0.8, 0.1, '#261d14', { kind: 1, par: 1 });
              mg.box(34.2, yc + 0.5, z, 0.5, 0.18, 0.18, IRON, {}); }
            else if (k === 1) {                                                                                        // a coil of hemp rope on a peg: six thin turns lying on one another, lashed under the peg
              const yc = 9.9 - h * 0.9;
              for (let j = 0; j < 6; j++) { const q = hash1(i * 7.7 + j * 1.3);
                mg.add(rimGeo, { p: [34.22 - (j % 3) * 0.05, yc - 0.06 * j + 0.1 * q, z + (q - 0.5) * 0.16], r: [0.12 * (q - 0.5), Math.PI / 2, 0], s: [0.66 + 0.05 * ((j * 3) % 4), 0.92 + 0.06 * (j % 3), 0.7], c: ['#3b3324', '#332c1f', '#423928'][j % 3] }); }
              mg.box(34.2, yc + 0.9, z, 0.5, 0.18, 0.18, IRON, {}); mg.box(34.2, yc + 0.66, z, 0.2, 0.46, 0.24, '#332c1f', { jit: 0.05 }); }
            else for (let j = 0; j < 3; j++) { const zz = z - 1.1 + j * 1.1, len = 2.6 + 0.5 * hash1(i * 3.7 + j);       // three hand saws hung by their handles
              mg.box(34.3, 11.0 - len / 2, zz, 0.05, len, 0.62 - j * 0.08, STEEL, { jit: 0.04 }); mg.box(34.28, 11.25, zz, 0.18, 0.75, 0.86, j % 2 ? '#7a3d22' : '#9a6a30', { kind: 1, par: 1 }); } }
          if (i % 4 === 0) mg.cyl(34.0, 5.6, z + 0.5, 0.45, 0.45, 1.1, [PAL.scarlet, PAL.green, GOLD, '#d9cfb8'][(i >> 2) % 4], { sides: 10 });   // paint tins on the shelf
        }
        for (let i = 0; i < 3; i++) copies.push({ set: 'parts', kind: 'parts', item: { matrix: new THREE.Matrix4().makeRotationY(1.57 + (hash1(z0 + i) - 0.5) * 0.7).setPosition(28.5, 3.62, z0 + 5 + i * (z1 - z0 - 10) / 2), stage: i === 1 ? 2 : 3, frac: 0.6 } });
        await ctx.yield();
        mg.box(22.2, 1.3, z0 + 6, 2.2, 0.3, 2.2, WOODC, { kind: 1, par: 0 }); for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) mg.box(22.2 + a, 0.6, z0 + 6 + b, 0.3, 1.2, 0.3, WOODC, { kind: 1, par: 1 });   // stool
      }
      // half-made animals on low trolleys either side of the flown line, in two lit groups (a pair under a pendant each side), drawn up along the arm 16 m and more to the side (whatever stands on the arm's floor
      // leaves the picture by its SIDE, whole: the 9 m either side of the line are left to the rails and the lamps' pools), and by one
      // rule for every bay of the arm: a low pile of boards on stickers, a pair of sawhorses with a plank, a basket of shavings
      await ctx.yield();
      trolley(mg, 18.6, 148.3, Math.PI / 2, 0, 2); trolley(mg, -18.6, 109.7, -Math.PI / 2, 3, 3); trolley(mg, 18.6, 136.7, Math.PI / 2, 5, 2); trolley(mg, -18.6, 121.3, -Math.PI / 2, 1, 2, 0.45);   // two pairs: the west pair under the pendant at (-18, 115.5), the east pair under the one at (18, 142.5)
      // THE GLUED BLANK, the stage before the carving, as work in hand: a band-sawn blank still in its bar clamps, lying across a pair of trestles
      // in the north-west bay beside the tall timber stack, 22 m and more from the flown line (so far to the side that it leaves the picture by
      // its side edge, whole, and never by the lower corner), with the gouges that will start it laid out on a low bench beside it, and a mallet
      { const BX = -22.5, BZ = 86, by = 0.4, cb = Math.cos(by), sb = Math.sin(by), R = (a, b) => [BX + a * cb + b * sb, BZ - a * sb + b * cb];
        for (const a of [-2.2, 2.2]) { const q = R(a, 0);
          for (const s2 of [-1, 1]) for (const e of [-0.9, 0.9]) { const p0 = R(a + e, s2 * 2.3), p1 = R(a, s2 * 1.7); mg.beam([p0[0], 0, p0[1]], [p1[0], 3.0, p1[1]], 0.5, 0.5, WOODC, { kind: 1, par: 1 }); }
          mg.box(q[0], 3.2, q[1], 0.7, 0.5, 5.2, WOODC, { kind: 1, par: 0, r: [0, by, 0] }); mg.box(q[0], 1.2, q[1], 0.3, 0.3, 4.0, '#8a7250', { kind: 1, par: 0, r: [0, by, 0] }); }
        copies.push({ set: 'blank', kind: 2, item: { matrix: new THREE.Matrix4().makeRotationY(by).setPosition(BX, 0, BZ), top: 3.45, stage: 1, frac: 0.5, alt: true } });
        occ.push([BX - 4.6, BZ - 4.6, BX + 4.6, BZ + 4.6, 0.6]);
        const [lx, lz] = R(0.5, 6.2); mg.bench(lx - 3.2, lz - 1.3, lx + 3.2, lz + 1.3, 2.4, WOODC, { th: 0.5, leg: 0.7 }); occ.push([lx - 3.2, lz - 1.3, lx + 3.2, lz + 1.3, 0.6]);
        for (let i = 0; i < 4; i++) { const gx = lx - 2.3 + i * 1.05, y = 2.66;
          mg.beam([gx, y, lz + 0.9], [gx + 0.1, y, lz - 0.1], 0.42, 0.42, i % 2 ? '#7a3d22' : '#9a6a30', { round: 8, kind: 1, par: 1, taper: 0.7 });
          mg.beam([gx + 0.1, y - 0.05, lz - 0.1], [gx + 0.2, y - 0.1, lz - 1.1], 0.3 + (i % 3) * 0.1, 0.1, STEEL, { jit: 0.04 }); }
        mg.cyl(lx + 2.3, 3.0, lz, 0.6, 0.6, 1.3, '#a9825a', { r: [0, 0, Math.PI / 2], sides: 12, kind: 1, par: 0, jit: 0 }); mg.beam([lx + 2.3, 3.0, lz], [lx + 2.5, 2.7, lz + 1.9], 0.3, 0.3, '#8a5a30', { round: 8, kind: 1, par: 2, taper: 0.8 }); }
      const fw = rng.fork('floorwork');
      // (nothing of it within 9 m of the flown line; no two bays hold the same set: null is a thing the bay does not have)
      const BAYWORK = [[null, [29.6, 84.5], null], [null, [19.5, 110], [19, 122]], [null, null, null], [null, [19, 160], [17.4, 166.2]], [[-18.5, 181], null, [-18, 190]]];
      for (const [pile, horse, basket] of BAYWORK) {                                                                // every bay: [boards, sawhorses, basket] at (x, z)
        if (pile) {
        const px = pile[0] + fw.range(-0.4, 0.4), pz = pile[1] + fw.range(-0.4, 0.4), n = 2 + fw.int(0, 2);          // boards on stickers
        for (let k = 0; k < n; k++) { for (let j = 0; j < 3; j++) mg.box(px - 1.5 + j * 1.5, 0.62 + k * 0.72, pz + fw.range(-0.3, 0.3), 1.36, 0.46, 9.2, ['#b9a67c', '#a89468', '#c4b189'][(j + k) % 3], { kind: 1, par: 2, jit: 0.12 });
          for (const dz of [-3.4, 0, 3.4]) mg.box(px, 0.28 + k * 0.72, pz + dz, 4.6, 0.16, 0.36, '#7a6444', { kind: 1, par: 0 }); }
        occ.push([px - 2.4, pz - 4.8, px + 2.4, pz + 4.8, 0.6]); }
        if (horse) {
        const hx = horse[0] + fw.range(-0.4, 0.4), hz = horse[1] + fw.range(-0.4, 0.4);                              // sawhorses and a plank
        for (const dz of [-2.6, 2.6]) { for (const s2 of [-1, 1]) { mg.beam([hx + s2 * 1.5, 0, hz + dz - 0.7], [hx + s2 * 1.1, 2.3, hz + dz], 0.34, 0.34, WOODC, { kind: 1, par: 1 }); mg.beam([hx + s2 * 1.5, 0, hz + dz + 0.7], [hx + s2 * 1.1, 2.3, hz + dz], 0.34, 0.34, WOODC, { kind: 1, par: 1 }); }
          mg.box(hx, 2.45, hz + dz, 3.4, 0.4, 0.5, WOODC, { kind: 1, par: 0 }); }
        mg.box(hx, 2.8, hz, 1.5, 0.3, 8.2, '#c4b189', { kind: 1, par: 2, r: [0, fw.range(-0.06, 0.06), 0] });
        occ.push([hx - 1.8, hz - 4.2, hx + 1.8, hz + 4.2, 0.5]); }
        if (basket) {
        const bx = basket[0], bz = basket[1];                                                                        // a basket heaped with shavings
        mg.cyl(bx, 0.9, bz, 1.3, 1.6, 1.8, '#8a6a44', { sides: 12, kind: 1, par: 1, ao: [0, 1.2] }); mg.add(rimGeo, { p: [bx, 1.8, bz], r: [Math.PI / 2, 0, 0], s: [1.62, 1.62, 1.6], c: '#6a4c30' });
        for (let k = 0; k < 5; k++) { const r = fw.range(0.35, 0.6); mg.add(curl, { p: [bx + fw.range(-0.8, 0.8), 1.9 + r * 0.6 + (k > 2 ? 0.4 : 0), bz + fw.range(-0.8, 0.8)], r: [0, fw.range(0, 3.14), fw.range(0, 6.28)], s: [r, r, r * fw.range(4, 8)], c: '#94703c', jit: 0.16 }); }
        occ.push([bx - 1.8, bz - 1.8, bx + 1.8, bz + 1.8, 0.6]); }
        await ctx.yield();
      }
      await ctx.yield();
      // line shaft hangers on the west wall, the lathe and the grindstone under it
      for (let z = 86; z <= 200; z += 14.25) {
        mg.box(-33, 22.9, z, 4, 0.7, 0.7, IRON, {}); mg.beam([-34.8, 18, z], [-31.4, 22.6, z], 0.5, 0.5, IRON); mg.box(-31, 22, z, 1.3, 1.5, 1.1, IRON, {});
        mg.box(-34.7, 20.5, z, 0.4, 6.5, 1.6, IRON, {});
      }
      for (const zc of [142.5, 196.5]) {
        mg.box(-34.6, 9.5, zc, 0.3, 7, 16, '#4a3828', { kind: 1, par: 2 }); mg.box(-34.2, 5.6, zc, 1.3, 0.25, 16, WOODC, { kind: 1, par: 2 });
        for (let i = 0; i < 13; i++) { const z = zc - 7.2 + i * 1.2, h = hash1(i * 5.7 + zc); if (h < 0.2) continue;
          mg.cyl(-34.25, 11.4 + (i % 2) * 0.4, z, 0.2, 0.15, 1.3, h > 0.6 ? '#7a3d22' : '#9a6a30', { sides: 6, kind: 1, par: 1 }); mg.box(-34.3, 9.8 - h, z, 0.08, 1.6 + h * 2, 0.2 + 0.3 * hash1(i + 9), STEEL, { jit: 0.05 }); }
        for (let i = 0; i < 5; i++) mg.box(-33.9, 6.3 + (i % 2) * 0.5, zc - 6 + i * 3, 0.9, 1.1 + (i % 2), 2.2, ['#b9a67c', '#a89468', '#c4b189'][i % 3], { kind: 1, par: 2, jit: 0.1 });   // blanks on the shelf
      }
      await ctx.yield();
      const stand = (x, z0, z1, y) => { for (const z of [z0, (z0 + z1) / 2, z1]) { mg.box(x, y / 2, z, 2.6, y, 0.7, '#5d6a76', { ao: [0, 2] }); mg.box(x, 0.3, z, 3.6, 0.6, 1.2, '#5d6a76', {}); mg.box(x, y - 0.5, z, 2.9, 0.3, 0.9, '#7c8a96', { jit: 0 }); } };
      stand(-27, 105, 126, 4.9); occ.push([-29.5, 103, -24.5, 128, 0.7]);
      for (const x of [-27.7, -26.3]) { mg.box(x, 5.2, 115.5, 0.6, 0.7, 22, '#6a7884', {}); mg.box(x, 5.58, 115.5, 0.3, 0.06, 22, '#a9b6c0', { jit: 0 }); }
      mg.box(-27, 7.0, 115, 2.6, 3.2, 3.4, GREEN, { ao: [5.4, 7] }); mg.box(-27, 8.75, 115, 2.9, 0.3, 3.7, IRON, {}); mg.box(-25.55, 7.2, 115, 0.3, 1.6, 1.6, GOLD, { jit: 0 });
      mg.cyl(-27, 7.6, 112.6, 1.7, 1.7, 0.7, '#8a2a20', { r: [Math.PI / 2, 0, 0], sides: 16 }); mg.cyl(-27, 7.6, 112.6, 0.5, 0.5, 1.0, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 });   // the headstock's driving pulley and the belt up to the line shaft
      mg.beam([-28.6, 7.9, 112.6], [-31.6, 21.4, 112.6], 0.14, 0.6, '#4a3020', { jit: 0 }); mg.beam([-25.4, 8.0, 112.6], [-30.2, 22.9, 112.6], 0.14, 0.6, '#5a3a26', { jit: 0 });
      mg.box(-27, 6.6, 125.2, 2.0, 2.4, 1.6, GREEN, {}); mg.cyl(-27, 7.2, 124.2, 0.2, 0.05, 0.9, STEEL, { r: [Math.PI / 2, 0, 0], sides: 6 });
      mg.box(-25.6, 6.2, 120.5, 0.4, 0.5, 5, IRON, {}); mg.box(-25.6, 5.8, 120.5, 0.6, 0.8, 0.8, IRON, {});
      mg.beam([-25.9, 6.6, 121.2], [-24.4, 6.9, 121.8], 0.24, 0.24, '#9a6a30', { round: 6, kind: 1, par: 1 });
      const cr2 = rng.fork('curls2');
      for (let i = 0; i < 12; i++) { const r = cr2.range(0.3, 0.6); mg.add(curl, { p: [cr2.range(-26, -22.5), r, cr2.range(117, 125)], r: [0, cr2.range(0, 3.14), cr2.range(0, 6.28)], s: [r, r, r * cr2.range(4, 8)], c: '#94703c', jit: 0.16 }); }
      for (const s of [-1, 1]) { mg.beam([-27 + s * 2.6, 0, 176.6], [-27 + s * 0.6, 4.4, 177.4], 0.6, 0.6, WOODC, { kind: 1, par: 1 }); mg.beam([-27 + s * 2.6, 0, 179.4], [-27 + s * 0.6, 4.4, 178.6], 0.6, 0.6, WOODC, { kind: 1, par: 1 }); }
      mg.box(-27, 1.6, 178, 5.6, 0.4, 3.4, '#5a4a3c', { kind: 1, par: 0 }); mg.box(-27, 1.9, 178, 3.4, 0.5, 1.4, '#39424a', {}); occ.push([-30, 175, -24, 181, 0.6]);
      await ctx.yield();
      // timber stacked on stickers in the north-west corner, boards leaning on the wall
      const tr = rng.fork('timber');
      for (const [x, z, n] of [[-29.5, 87, 7], [-29.5, 99.5, 5]]) {
        for (let k = 0; k < n; k++) {
          for (let j = 0; j < 3; j++) mg.box(x - 1.9 + j * 1.9, 0.75 + k * 0.95, z + tr.range(-0.5, 0.5), 1.7, 0.6, 16 - (z > 95 ? 9 : 0), ['#b9a67c', '#a89468', '#c4b189'][(j + k) % 3], { kind: 1, par: 2, jit: 0.14, tint: (px, py, pz, c) => c.multiplyScalar(py < 0.75 + k * 0.95 ? 0.55 : 1) });
          for (const dz of [-5.5, 0, 5.5]) if (z < 95 || dz === 0) mg.box(x, 0.36 + k * 0.95, z + dz, 5.8, 0.18, 0.4, '#8a7250', { kind: 1, par: 0 });
        }
        occ.push([x - 3.2, z - 8.4, x + 3.2, z + 8.4, 0.6]);
      }
      for (let i = 0; i < 7; i++) mg.beam([-31 + (i % 2) * 0.5, 0, 130 + i * 1.5], [-34.4, 15 + tr.range(0, 5), 130.4 + i * 1.5], 1.3, 0.35, ['#b9a67c', '#a89468'][i % 2], { kind: 1, par: 1, ao: [0, 9] });
      occ.push([-35, 128, -30, 141, 0.5]);
      await ctx.yield();
      // a stepladder 9 m tall
      ladder = (m, x, z, ry) => {
        const c = Math.cos(ry), sn = Math.sin(ry), P3 = (a, y, b) => [x + a * c + b * sn, y, z - a * sn + b * c];
        for (const s of [-1, 1]) { m.beam(P3(s * 1.5, 0, -1.8), P3(s * 1.0, 9, 0), 0.4, 0.22, '#c9b282', { kind: 1, par: 1 }); m.beam(P3(s * 1.6, 0, 2.6), P3(s * 1.0, 9, 0), 0.3, 0.2, '#c9b282', { kind: 1, par: 1 }); }
        for (let k = 1; k < 9; k++) m.beam(P3(-1.5 + k * 0.055, k, -1.8 + k * 0.2), P3(1.5 - k * 0.055, k, -1.8 + k * 0.2), 0.14, 0.6, '#b89a6c', { kind: 1, par: 0 });
        m.box(...P3(0, 9.1, 0), 2.6, 0.25, 1.2, '#b89a6c', { kind: 1, par: 0, r: [0, ry, 0] });
        m.beam(P3(-1.55, 3.4, -1.1), P3(-1.5, 3.4, 1.6), 0.12, 0.12, IRON); m.beam(P3(1.55, 3.4, -1.1), P3(1.5, 3.4, 1.6), 0.12, 0.12, IRON);
        occ.push([x - 2.4, z - 2.8, x + 2.4, z + 2.8, 0.4]);
      };
      ladder(mg, -25.5, 174, 1.3); ladder(mg, 27, 128.5, -1.57);
      await ctx.yield();
      // THE TRAVELLING HOIST: an iron beam across the arm at z 132 (y 31.2 to 32.6, wall to wall, beside the truss at z 129), its crab a little
      // east of the middle, and slung from the crab in chains a whole roughed-out horse, broadside to the arm, its lowest point y 18.99 (the soles of its gilt shoes; its legs' wood ends 0.36 m higher): it
      // hangs in the dusk above the lamps, against the gold of the wheel bay. The crab and beam stand still; the tackle and the horse turn and
      // swing a little on the hook by the world's clock (update, below). The flown line passes 6.9 m under its shoes at the nearest.
      mg.box(0, 31.9, HOIST.z, 70, 1.4, 0.9, IRON, {}); mg.box(0, 31.25, HOIST.z, 70, 0.2, 1.5, IRON, {}); mg.box(0, 32.6, HOIST.z, 70, 0.2, 1.5, IRON, {});
      for (const sx of [-1, 1]) mg.box(sx * 34.2, 30.4, HOIST.z, 1.6, 1.8, 1.8, IRON, {});
      mg.box(HOIST.x, 30.75, HOIST.z, 3.6, 1.0, 2.6, GREEN, {}); for (const dx of [-1.3, 1.3]) for (const dz of [-1.1, 1.1]) mg.cyl(HOIST.x + dx, 31.5, HOIST.z + dz, 0.5, 0.5, 0.3, '#56626e', { r: [Math.PI / 2, 0, 0], sides: 10 });
      mg.cyl(HOIST.x, 30.2, HOIST.z, 0.8, 0.8, 1.6, IRON, { r: [0, 0, Math.PI / 2], sides: 12 });
      copies.push({ set: 'hoist', kind: 0, item: { matrix: new THREE.Matrix4().makeScale(HOIST.k, HOIST.k, HOIST.k).setPosition(HOIST.x, 17, HOIST.z), top: HOIST.low, stage: 2, frac: 0.8, hung: true } });
      // two more machines off the line shaft, each under its own pulley: a band saw (z 134) and a drum sander (z 150). Their frames stand
      // here; their wheels and the drum turn (below), their belts and the saw's band run with the other strips.
      mg.box(-27.4, 0.4, 131.9, 5.2, 0.8, 3.6, IRON, {}); mg.box(-29.9, 4.9, 131.9, 1.0, 8.2, 1.6, GREEN, { ao: [0.8, 3] }); mg.box(-28.7, 9.3, 131.9, 3.4, 0.9, 1.4, GREEN, {});
      mg.box(-28.9, 1.7, 131.9, 3.0, 1.8, 1.4, GREEN, {}); mg.box(-26.0, 4.6, 131.9, 3.4, 0.25, 3.6, '#7c8a96', { jit: 0 }); mg.box(-26.3, 3.8, 131.9, 0.8, 1.4, 0.8, IRON, {});
      mg.box(-25.75, 6.3, 132.9, 0.3, 1.5, 0.5, IRON, {}); mg.box(-25.3, 4.9, 131.2, 1.1, 0.3, 2.4, '#c4b189', { kind: 1, par: 2 }); mg.box(-29.9, 9.0, 131.9, 1.06, 0.3, 1.66, GOLD, { jit: 0 });
      mg.cyl(-27.4, 2.4, 133.2, 0.3, 0.3, 2.4, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 });
      occ.push([-30.6, 129.8, -24.2, 134.6, 0.65]);
      mg.box(-27, 0.3, 152.6, 4.4, 0.6, 5.8, IRON, {});
      for (const dz of [-2.0, 2.0]) { for (const sd of [-1, 1]) mg.beam([-27 + sd * 1.7, 0.6, 152.6 + dz], [-27 + sd * 0.5, 4.5, 152.6 + dz], 0.5, 0.5, GREEN); mg.box(-27, 4.5, 152.6 + dz, 1.3, 0.9, 0.5, IRON, {}); }
      mg.box(-25.2, 3.8, 152.6, 0.4, 0.25, 3.6, WOODC, { kind: 1, par: 2 }); for (const dz of [-1.6, 1.6]) mg.box(-25.2, 1.9, 152.6 + dz, 0.3, 3.6, 0.3, IRON, {});
      mg.box(-24.9, 4.1, 152.9, 0.9, 0.35, 3.0, '#d9c8a2', { kind: 1, par: 2, r: [0, 0.05, 0] });
      occ.push([-29.6, 149.2, -24.2, 156, 0.65]);
      await ctx.yield();
      // cloths that stir: a dust sheet down the face of the timber stack, aprons on their hooks at the east piers
      mg.box(-23.5, 3.95, 87.5, 6.6, 0.1, 10.5, CANVAS, { jit: 0.05 }); drape(mg, -20.05, 3.95, 87.5, 0, 1, 10.5, 3.5, CANVAS, { depth: 0.2 });
      for (let i = 1; i < 5; i++) { const z = 75 + 27 * i + 2.0; mg.beam([33.6, 9.2, z], [32.7, 9.4, z], 0.2, 0.2, IRON, { round: 5 });
        drape(mg, 32.7, 9.1, z, 0, 1, 2.8, 4.6, i % 2 ? CANVAS : '#6f7f8a', { folds: 2, depth: 0.14, jit: 0 }); mg.box(32.6, 6.0, z, 0.1, 1.3, 1.5, i % 2 ? '#6f5d44' : '#56646e', { kind: 4, sway: [9.1, 4.5], jit: 0 }); }
      // canopy gores for the wheel, sewn in the scheme's stripes and hung to air on the east wall in every bay, under the carved panels
      // and over the tool boards: each a fan of four stripes on an iron rail, stirring in the draught of the doors
      for (let i = 0; i < 5; i++) for (let g = 0; g < 2; g++) {
        if (i === 1 || i === 2) continue;                                                                          // (the middle bays carry the store racks)
        const z = 88.5 + 27 * i + (g ? 3.3 : -3.3) + (hash1(i * 7.3 + g) - 0.5) * 1.2, len = 5.4 + 1.3 * hash1(i * 3.1 + g * 5.7), cA = '#' + cD.set(SCH[(i + g) % 2 ? 2 : (schemeId === 2 ? 1 : 0)]).lerp(cG, 0.2).multiplyScalar(0.8).getHexString();
        mg.beam([34.0, 18.6, z - 2.7], [34.0, 18.6, z + 2.7], 0.3, 0.3, IRON, { round: 5, jit: 0 });
        drape(mg, 33.7, 18.5, z, 0, 1, 4.6, len, cA, { stripes: [cA, '#cfc4a8'], rep: 2, scallop: 0.5, folds: 2, depth: 0.2 });
      }
      await ctx.yield();
      // THE STORE RACKS, the middle two bays of the east wall (z 102 to 156) from over the tool boards to the truss line, on the bare brick, each
      // lit by its bay's bracket lamp in the middle: two stout shelves on iron brackets (y 12.6 and 21.4, open at the lamp). North bay: carved
      // legs and horsehair tails hung by their tops in a row, and over them timber stood on end against a rail. South bay: carved heads
      // standing on the shelf (the wheel's own sculpts, in its look) and over them the long bar clamps hung in a row. 22 m and more from the flown line.
      for (let b = 0; b < 2; b++) { const zc = 115.5 + 27 * b;
        for (const y of [12.6, 21.4]) for (const sd of [-1, 1]) { const z0 = zc + sd * (y < 20 ? 1.7 : 0), z1 = zc + sd * 11.8;
          mg.box(33.8, y, (z0 + z1) / 2, 2.2, 0.4, Math.abs(z1 - z0), '#7a6446', { kind: 1, par: 2 });
          for (const f of [0.12, 0.5, 0.88]) { const z = z0 + (z1 - z0) * f; mg.beam([34.8, y - 2.0, z], [33.0, y - 0.25, z], 0.2, 0.2, IRON, {}); } }
        if (b === 0) {
          mg.beam([34.0, 20.3, zc - 11.4], [34.0, 20.3, zc + 11.4], 0.26, 0.26, IRON, { round: 5, jit: 0 });
          for (let i = 0; i < 9; i++) { const z = zc - 10.4 + i * 2.6, h = hash1(i * 3.3 + 1.7); if (Math.abs(z - zc) < 1.6) continue;
            if (i % 4 === 2) mg.beam([33.9, 20.2, z], [33.8, 14.2 - h, z], 1.0, 0.7, ['#241a14', '#cfc4a8', '#6a3620'][(i >> 2) % 3], { round: 6, taper: 0.3, jit: 0.12 });      // a horsehair tail
            else { mg.beam([33.8, 20.1, z], [33.6, 17.3, z + 0.4], 1.0, 1.0, CREAM, { round: 7, taper: 0.6, kind: 1, par: 1 }); mg.beam([33.6, 17.3, z + 0.4], [33.8, 14.2 - h * 0.6, z], 0.62, 0.62, CREAM, { round: 7, taper: 0.78, kind: 1, par: 1 });
              mg.box(33.8, 13.9 - h * 0.6, z, 0.8, 0.6, 0.8, '#7a5a3a', { kind: 1, par: 0 }); }                                                                                // a carved leg, hung by its top, hoof down
            mg.box(34.0, 20.5, z, 0.3, 0.5, 0.3, IRON, {}); }
          mg.beam([33.4, 26.6, zc - 11.4], [33.4, 26.6, zc + 11.4], 0.3, 0.3, '#5b4634', { kind: 1, par: 2 });
          for (let i = 0; i < 16; i++) { const z = zc - 10.9 + i * 1.45, h = hash1(i * 2.9 + 4.1);                                                                              // timber stood on end
            mg.beam([33.2 + 0.5 * hash1(i * 1.3), 21.6, z], [34.3, 27.2 + 3.2 * h, z + (hash1(i * 5.1) - 0.5) * 0.3], 1.25, 0.3, ['#b9a67c', '#a89468', '#c4b189', '#9a875e'][i % 4], { kind: 1, par: 1, jit: 0.08 }); }
        } else {
          for (const [dz, k, st] of [[-8.0, 0.82, 2], [-4.2, 0.74, 3], [4.4, 0.8, 3], [8.3, 0.7, 2]]) copies.push({ set: 'head', kind: 'head', item: { matrix: new THREE.Matrix4().makeRotationY(Math.PI + dz * 0.03).scale(vX.set(k, k, k)).setPosition(33.4, 12.8, zc + dz), stage: st, frac: 0.7 } });
          mg.beam([34.0, 30.0, zc - 11.4], [34.0, 30.0, zc + 11.4], 0.26, 0.26, IRON, { round: 5, jit: 0 });
          for (let i = 0; i < 11; i++) { const z = zc - 10.5 + i * 2.1, h = hash1(i * 4.7 + 2.3), len = 6.4 + 1.6 * hash1(i * 1.9);                                               // a long bar clamp: steel bar, fixed jaw, sliding jaw, screw
            mg.box(34.1, 29.9 - len / 2, z, 0.14, len, 0.42, '#6d7880', { jit: 0.03 }); mg.box(33.75, 29.6, z, 0.9, 0.5, 0.5, '#8a6a44', { kind: 1, par: 0 });
            mg.box(33.75, 29.9 - len * (0.45 + 0.4 * h), z, 0.9, 0.5, 0.5, '#8a6a44', { kind: 1, par: 0 }); mg.cyl(33.5, 29.9 - len + 0.5, z, 0.12, 0.12, 1.1, IRON, { sides: 6 }); mg.box(34.0, 29.9 - len + 0.1, z, 0.5, 0.3, 0.5, IRON, {}); }
        }
        await ctx.yield();
      }
      // (no cloth hangs across the arm between the flown line and the roof glass: cloth lives on the walls. The travelling hoist with its horse is the one thing slung over the line)
      await bakeGas(mg); await ctx.yield();
      await mg.pack(ctx.yield); addMesh(mg, 'carving-shop');
      await ctx.yield();

      // things that turn: the line shaft with its spoked pulleys, the piece in the lathe, the grindstone; and the rocking mallet
      const pulley = (m, z, r, w) => {
        m.add(rimGeo, { r: [0, 0, 0], p: [0, 0, z], s: [r, r, w * 5], c: '#5a646e', jit: 0.05 });
        m.cyl(0, 0, z, 0.6, 0.6, w + 0.5, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 });
        for (let k = 0; k < 3; k++) m.box(0, 0, z, r * 1.96, 0.26, 0.4, k === 0 ? PAL.scarlet : '#5a646e', { r: [0, 0, k * Math.PI / 3], jit: 0 });
      };
      {
        const m = makeMerger();
        m.cyl(0, 0, 143, 0.36, 0.36, 116, '#6a747e', { r: [Math.PI / 2, 0, 0], sides: 8 });
        for (const [z, r] of [[100, 1.7], [116, 2.2], [134, 1.5], [150, 2.4], [164, 1.6], [176.3, 2.2], [192, 1.8]]) pulley(m, z, r, 1.1);
        for (let z = 93; z < 200; z += 14.25) m.cyl(0, 0, z, 0.55, 0.55, 0.5, GOLD, { r: [Math.PI / 2, 0, 0], sides: 6, jit: 0 });
        await bakeGas(m, [-31, 22, 0]);
        const mesh = addMesh(m, 'line-shaft'); mesh.position.set(-31, 22, 0); spinners.push({ mesh, speed: 2.4 });
      }
      await ctx.yield();
      {
        const m = makeMerger(), prof = [];
        for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push(new THREE.Vector2(0.28 + 0.5 * Math.pow(Math.sin(t * 3.14159), 2) * (0.7 + 0.3 * Math.sin(t * 19)), -2.4 + t * 4.8)); }
        const lg = new THREE.LatheGeometry(prof, 12);
        m.add(lg, { r: [Math.PI / 2, 0, 0], p: [0, 0, 0.4], c: CREAM, kind: 1, par: 2, jit: 0 }); lg.dispose();
        m.box(0, 0, -2.6, 1.15, 1.15, 1.4, '#cdb98c', { kind: 1, par: 2, jit: 0 }); m.box(0, 0, 3.0, 0.9, 0.9, 0.6, '#cdb98c', { kind: 1, par: 2, jit: 0 });
        pulley(m, -5.6, 1.0, 0.9);
        await bakeGas(m, [-27, 7.2, 121.6]);
        const mesh = addMesh(m, 'lathe-piece'); mesh.position.set(-27, 7.2, 121.6); spinners.push({ mesh, speed: 7.5 });
      }
      {
        const m = makeMerger();
        m.cyl(0, 0, 0, 2.4, 2.4, 0.8, '#a9a294', { r: [Math.PI / 2, 0, 0], sides: 20, jit: 0 }); m.cyl(0, 0, 0, 0.3, 0.3, 4.4, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 });
        for (let k = 0; k < 5; k++) { const a = k * 1.2566; m.cyl(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0, 0.22, 0.22, 0.95, k ? IRON : GOLD, { r: [Math.PI / 2, 0, 0], sides: 6, jit: 0 }); }
        m.box(0.6, 0, 2.2, 1.6, 0.3, 0.2, IRON, {}); pulley(m, -1.7, 1.2, 0.9);
        await bakeGas(m, [-27, 4.6, 178]);
        const mesh = addMesh(m, 'grindstone'); mesh.position.set(-27, 4.6, 178); spinners.push({ mesh, speed: -3.1 });
      }
      await ctx.yield();
      for (const [y, low] of [[2.4, true], [7.3, false]]) {                                         // the band saw's two wheels; the lower carries the drive pulley
        const m = makeMerger(); pulley(m, 132.9, 1.7, 0.5); if (low) pulley(m, 134, 0.9, 0.9);
        await bakeGas(m, [-27.4, y, 0]);
        const mesh = addMesh(m, low ? 'saw-lower' : 'saw-upper'); mesh.position.set(-27.4, y, 0); spinners.push({ mesh, speed: -4.2 });
      }
      {
        const m = makeMerger();                                                                   // the sander's drum: staves, two dark bands, its pulley
        m.cyl(0, 0, 152.6, 1.0, 1.0, 3.3, '#cdb98c', { r: [Math.PI / 2, 0, 0], sides: 10, kind: 1, par: 2, jit: 0 });
        for (let k = 0; k < 5; k++) { const a = k * 1.2566; m.box(Math.cos(a) * 0.98, Math.sin(a) * 0.98, 152.6, 0.16, 0.5, 3.34, k ? '#8a7250' : PAL.scarlet, { r: [0, 0, a + Math.PI / 2], jit: 0 }); }
        m.cyl(0, 0, 152.3, 0.22, 0.22, 5.2, IRON, { r: [Math.PI / 2, 0, 0], sides: 8 }); pulley(m, 150, 1.0, 0.9);
        await bakeGas(m, [-27, 4.5, 0]);
        const mesh = addMesh(m, 'sander'); mesh.position.set(-27, 4.5, 0); spinners.push({ mesh, speed: 5.1 });
      }
      await ctx.yield();
      {
        const m = makeMerger();
        m.cyl(0, 0.8, 0, 0.8, 0.8, 1.8, '#a9825a', { r: [0, 0, Math.PI / 2], sides: 12, kind: 1, par: 0, jit: 0 });
        for (const s of [-1, 1]) m.cyl(s * 0.75, 0.8, 0, 0.84, 0.84, 0.18, IRON, { r: [0, 0, Math.PI / 2], sides: 12, jit: 0 });
        m.beam([0, 0.8, 0], [0, 0.5, 2.9], 0.36, 0.36, '#8a5a30', { round: 8, kind: 1, par: 2, taper: 0.8 });
        await bakeGas(m, [-14.2, 3.63, 164.5]);
        mallet = addMesh(m, 'mallet'); mallet.position.set(-14.2, 3.63, 164.5); mallet.rotation.y = 0.5;
      }
      {
        // the hoist's tackle, on its own so that it swings with the horse (its frame: the hook at the origin): hook block, two chains to a
        // spreader bar, and from the bar two slings, each a pair of chains to a canvas band under the belly
        const m = makeMerger();
        m.beam([0, 0.4, 0], [0, -0.8, 0], 0.34, 0.34, IRON, { round: 6 }); m.cyl(0, -0.9, 0, 0.5, 0.5, 0.5, IRON, { r: [Math.PI / 2, 0, 0], sides: 10 });
        for (const sx of [-1, 1]) m.beam([0, -0.9, 0], [sx * 3.3, -2.1, 0], 0.22, 0.22, IRON, { round: 6 });
        m.beam([-3.7, -2.2, 0], [3.7, -2.2, 0], 0.5, 0.5, WOODC, { kind: 1, par: 0 });
        for (const sx of [-1.9, 1.5]) {
          for (const sz of [-1, 1]) { m.beam([sx, -2.3, 0], [sx, -5.0, sz * 1.3], 0.2, 0.2, IRON, { round: 5 }); m.beam([sx, -5.0, sz * 1.3], [sx, -7.9, sz * 1.22], 0.8, 0.12, CANVAS, { kind: 4, par: 0 }); }
          m.box(sx, -7.95, 0, 0.8, 0.14, 2.56, CANVAS, { kind: 4, par: 0 });
        }
        await bakeGas(m, [HOIST.x, HOIST.py, HOIST.z]);
        hoistTackle = addMesh(m, 'hoist-tackle'); hoistTackle.position.set(HOIST.x, HOIST.py, HOIST.z);
      }
    }
    await ctx.yield();

    // ---- 4 wheel bay: racks of spares five tiers high, platform steps, work stands, leaning rounding boards ---------
    {
      const mg = makeMerger(), rr = rng.fork('racks');
      const TIERS = [0.4, 7.0, 13.6, 20.2, 26.8], BODY = ['#E9E2D0', '#9AA0A6', '#C79A55', '#E6DFCF'];
      // the spares are dealt without replacement from a bag that holds the six species in equal shares (150 bays, 25 of each)
      const rackBag = [], stock = [0, 0, 0, 0, 0, 0], STOCK = 16; for (let i = 0; i < 150; i++) rackBag.push(i % 6); rr.shuffle(rackBag);   // the racks hold sixteen of a species at most
      let bins = 0;                                                                        // bins of carved parts laid so far in both racks (BIN_CAP)
      // a run of rack along a wall: (ax, az) to (bx, bz) is its front edge, (nx, nz) points back to the wall. Every bay by the same rule:
      // six draws (what stands in it, facing, stage, how far through the stage, coat, the sheet's hang), taken whether or not the thing is built
      const rack = async (ax, az, bx, bz, nx, nz, bays, facing) => {
        const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len, depth = 4.6;
        // a back of dark oiled boards behind the whole run, so that every spare stands pale against it
        mg.box((ax + bx) / 2 + nx * (depth + 0.05), 16.6, (az + bz) / 2 + nz * (depth + 0.05), ux ? len : 0.2, 33, ux ? 0.2 : len, rackTone('#2e2620'), { kind: 1, par: ux ? 0 : 2, jit: 0 });
        for (let i = 0; i <= bays; i++) {
          const x = ax + ux * len * i / bays, z = az + uz * len * i / bays;
          for (const d of [0.2, depth - 0.2]) mg.box(x + nx * d, 16.7, z + nz * d, 0.7, 33.4, 0.7, rackTone('#6b5642'), { kind: 1, par: 1, ao: [0, 3] });
          for (let t = 0; t < 5; t++) mg.beam([x + nx * 0.2, TIERS[t], z + nz * 0.2], [x + nx * (depth - 0.2), TIERS[t], z + nz * (depth - 0.2)], 0.5, 0.5, rackTone('#6b5642'), { kind: 1, par: 0 });
          if (i < bays && i % 2 === 0) mg.beam([x + nx * depth, 0.5, z + nz * depth], [x + ux * len / bays + nx * depth, 32.5, z + uz * len / bays + nz * depth], 0.4, 0.4, IRON);
        }
        for (let t = 0; t < 5; t++) {
          await ctx.yield();
          const y = TIERS[t];
          for (const d of [0.5, 2.3, 4.1]) mg.beam([ax + nx * d, y + 0.3, az + nz * d], [bx + nx * d, y + 0.3, bz + nz * d], 0.2, 1.5, rackTone('#8a7250'), { kind: 1, par: ux ? 0 : 2 });
          mg.beam([ax, y, az], [bx, y, bz], 0.55, 0.35, rackTone('#5b4634'), { kind: 1, par: ux ? 0 : 2 });
          for (let i = 0; i < bays; i++) {
            const what = rr(), face = rr(), stg = rr(), fr = rr(), coat = rr(), hang = rr(), kind = rackBag.pop() ?? 0;
            const f = (i + 0.5) / bays, x = ax + ux * len * f + nx * 2.3, z = az + uz * len * f + nz * 2.3, wide = len / bays - 0.6;
            const sheet = t < 3 && what < (noon ? 0.42 : 0.2), empty = !sheet && what < (t === 4 ? 0.78 : (t === 3 ? 0.56 : 0.34));   // the two top tiers are mostly cleared (boxes of parts)
            if (sheet) {                                                                     // a dust sheet over the bay: it stirs (more of them at noon, in the door's air)
              const drop = 3.4 + 2.2 * hang;
              drape(mg, x - nx * 2.3, y + 6.0, z - nz * 2.3, ux, uz, wide, drop, rackTone(['#8a8068', '#7a705a', '#958a70'][Math.floor(coat * 3) % 3]), { depth: 0.2, jit: 0.1 });
            }
            if (empty) {                                                                     // an empty bay (a gap), or a bin of carved heads, legs and tails on a low box
              if (hang < 0.5) { mg.box(x, y + 0.9, z, ux ? wide * 0.6 : 2.6, 1.0, ux ? 2.6 : wide * 0.6, rackTone('#7a6248'), { kind: 1, par: 1, jit: 0.15 });
                // THE CAP (BIN_CAP, 28: seeds 1 to 1,200 lay 26 at the most): a bin past it keeps its box, laid above, and gets no carved parts; the bay's six draws are taken all the same
                if (t < 4 && bins < BIN_CAP) { bins++; copies.push({ set: 'parts', kind: 'parts', item: { matrix: new THREE.Matrix4().makeRotationY(facing + (face - 0.5) * 0.8).setPosition(x, y + 1.42, z), stage: stg < 0.6 ? 3 : 2, frac: 0.6 } }); } }
              continue; }
            if (stock[kind] >= STOCK) continue; stock[kind]++;
            if (t > 2 && detail < 0.75 && (i & 1)) continue;                                 // far spares thin out on small machines
            const size = [0.72, 0.86, 1][Math.floor(hang * 3) % 3];                         // three sizes of animal stand in the racks (the hang draw: no new draw)
            copies.push({ set: 'spare', kind, item: { matrix: new THREE.Matrix4().makeRotationY(facing + (face < 0.5 ? 0 : Math.PI) + (fr - 0.5) * 0.3).scale(vX.set(size, size, size)).setPosition(x, 0, z), top: y + 0.4,
              stage: stg < 0.5 ? 3 : (stg < 0.8 ? 2 : 4), frac: 0.2 + 0.7 * fr, body: BODY[Math.floor(coat * 4) % 4] } });
          }
        }
      };
      await rack(70, -70, 70, 20, 1, 0, 12, Math.PI / 2); occ.push([69, -72, 75, 22, 0.7]);
      await ctx.yield();
      await rack(-66, -70, 69, -70, 0, -1, 18, 0); occ.push([-68, -75, 70, -69, 0.7]);
      // THE RACK LAMPS: a shaded lamp on an iron bracket from every second post of both racks, 3 m out at the fourth tier, burning in every
      // look: the spares stand in its warm light as carved cream wood on dark shelves (the racks themselves keep little of the sky's light)
      for (let i = 1; i < 12; i += 2) bracketLamp(mg, 70, 20.6, -70 + 7.5 * i, -1, 0, 3.0, 0.8);
      for (let i = 1; i < 18; i += 2) bracketLamp(mg, -66 + 7.5 * i, 20.6, -70, 0, 1, 3.0, 0.8);
      await ctx.yield();
      // steps up to the platform on its south-west side (nothing here rises above the platform's top)
      for (let k = 0; k < 4; k++) {
        const r = 44.4 + k * 1.5, a = 2.356;
        mg.box(Math.cos(a) * r, (3.2 - k * 0.8) / 2, Math.sin(a) * r, 1.5, 3.2 - k * 0.8, 9, '#6b5642', { kind: 1, par: 2, r: [0, -a, 0], ao: [0, 1.5] });
        mg.box(Math.cos(a) * r, 3.2 - k * 0.8 + 0.05, Math.sin(a) * r, 1.6, 0.14, 9.2, '#a08860', { kind: 1, par: 2, r: [0, -a, 0], jit: 0 });
      }
      occ.push([-39, 27, -29, 39, 0.5]);
      // primed rounding boards and bare sweeps leaning on the south wall, a bench of gear wheels, crates
      for (let i = 0; i < 5; i++) {
        const x = 42 + i * 6.6, lean = 0.2 + hash1(i) * 0.08, gilt = i < 3;
        mg.box(x, 4.6, 73.2 - lean * 4.6, 5.6, 9.2, 0.35, gilt ? '#868a8e' : '#b9a67e', { r: [lean, 0, 0], kind: gilt ? 0 : 1, par: 1 });
        if (gilt) {
          mg.box(x, 4.6, 72.95 - lean * 4.6, 4.8, 8.4, 0.2, '#927850', { r: [lean, 0, 0], jit: 0, kind: 1, par: 1 }); mg.box(x, 4.6, 72.8 - lean * 4.6, 3.9, 7.4, 0.2, i === 1 ? '#7b7f84' : '#8f9396', { r: [lean, 0, 0], jit: 0 });
          mg.cyl(x, 4.8, 72.6 - lean * 4.8, 1.3, 1.3, 0.2, '#6e583c', { r: [Math.PI / 2 + lean, 0, 0], sides: 14, jit: 0 }); mg.add(rimGeo, { p: [x, 4.8, 72.55 - lean * 4.8], r: [lean, 0, 0], s: [1.45, 1.45, 1.5], c: '#927850', jit: 0 });
        }
        occ.push([x - 3, 70, x + 3, 75, 0.5]);
      }
      await ctx.yield();
      mg.bench(-70, 40, -62, 66, 3.6, WOODC, { th: 0.6, leg: 0.9 }); occ.push([-70, 40, -62, 66, 0.65]);
      for (let i = 0; i < 6; i++) { const r = 1.0 + hash1(i * 7) * 1.1, z = 43 + i * 4.2; mg.add(rimGeo, { p: [-66 + (i % 2) * 1.5, 3.72, z], r: [Math.PI / 2, 0, 0], s: [r, r, 2.2], c: i % 3 ? '#5a646e' : BRASS });
        for (let k = 0; k < 2; k++) mg.box(-66 + (i % 2) * 1.5, 3.72, z, r * 1.9, 0.14, 0.24, '#5a646e', { r: [0, k * 1.57 + i, 0] }); }
      // finished and half-made animals on trolleys round the bay (all outside radius 49), and ladders
      for (const [x, z, kind, stage, ry] of [[-52, 56, 1, 3, 0.9], [56, 58, 3, 2, 2.2], [-13, 57, 4, 3, 0.3], [-33, 61, 2, 2, 2.6],
        [5.5, 64, 5, 3, Math.PI / 2]])                                                             // and one on the rails before the arm's mouth, under its own lamp, waiting for the wheel
        trolley(mg, x, z, ry, kind, stage, 0.8, { body: '#E9E2D0', hair: '#3A2A20', alt: kind === 0 });
      // THE ROAD FROM WHEEL TO PAINT, on the west floor either side of the way into the paint shop: animals on their trolleys in making order as
      // they near the mouth (sanded, primed, primed, painted), all facing the shop, each standing whole 20 m or more to the side of the flown line
      for (const [x, z, kind, stage, ry, body] of [[-47, -64.5, 3, 3, 3.3, '#E9E2D0'], [-47, -17.5, 1, 4, 2.95, '#E9E2D0'], [-58.5, -63.5, 5, 4, 3.25, '#E9E2D0'], [-58.5, -18.5, 0, 5, 3.02, '#9AA0A6']])
        trolley(mg, x, z, ry, kind, stage, 0.85, { body, hair: '#3A2A20', alt: kind === 0 });
      const cb = rng.fork('crates');
      for (let i = 0; i < 16; i++) {
        const a = [0.55, 0.95, 2.2, 2.75, 3.6, 3.95, 5.5, 5.9][i % 8] + cb.range(-0.12, 0.12), r = cb.range(56, 70), x = Math.cos(a) * r, z = Math.sin(a) * r;
        const h = cb.range(2.4, 4.5), w = cb.range(3.4, 5.5), ry = cb.range(0, 1.5);                                // all five draws, whether or not the crate is kept
        if (x < -68 || Math.abs(z) > 68 || Math.abs(x) > 67 || (x > 60 && z > 26)) continue;
        if (path.distanceTo(x, 4, z) < 16) continue;
        if (occ.some((o) => x + w > o[0] && x - w < o[2] && z + w > o[1] && z - w < o[3])) continue;                 // something stands here already
        mg.box(x, h / 2, z, w, h, w * 0.8, '#7a6248', { kind: 1, par: i % 3, r: [0, ry, 0], ao: [0, 1.6] });
        for (const s of [-1, 1]) mg.box(x, h / 2, z, w + 0.2, 0.5, w * 0.8 + 0.2, '#5b4634', { kind: 1, par: 0, r: [0, ry, 0], p: [x, h / 2 + s * h * 0.3, z] });
        if (i % 2) mg.box(x + 0.4, h + 1.1, z, w * 0.6, 2.2, w * 0.5, '#8a7250', { kind: 1, par: 1, r: [0, ry + 0.4, 0] });
        occ.push([x - w * 0.7, z - w * 0.7, x + w * 0.7, z + w * 0.7, 0.55]);
      }
      await ctx.yield();
      // two drying frames before the paint shop's mouth, one either side of the way in (12 m and more from the flown line), their faces to the
      // wheel. On each hang things being painted: a canopy gore in the scheme's stripes pinned out to dry, a rounding-board panel in full paint,
      // another in its first grey coat, and a second gore
      const dye = (hex) => '#' + cD.set(hex).lerp(cG, 0.12).multiplyScalar(0.8).getHexString();
      for (const [z0, z1] of [[-70.5, -53.5], [-28.5, -11.5]]) {
        const north = z0 < -41;
        // (the posts stand 5 cm west of the frame's line: the north frame's north post stands in the rack's end post, and so shares no face with it)
        for (const z of [z0, z1]) { mg.box(-66.05, 8.7, z, 0.7, 17.4, 0.7, vivid(SCH[schemeId === 2 ? 2 : 0]), { ao: [0, 3], jit: 0.05 }); mg.box(-66, 17.75, z, 1.0, 0.5, 1.0, GILT, { kind: 5, par: GILTK, jit: 0 }); mg.add(dome, { p: [-66, 18.0, z], s: [0.5, 0.7, 0.5], c: GILT, kind: 5, par: GILTK, jit: 0 }); mg.box(-66, 0.3, z, 3.4, 0.6, 0.9, '#5b4634', { kind: 1, par: 0 });
          for (const sd of [-1, 1]) mg.beam([-66 + sd * 1.6, 0.6, z], [-66, 4.2, z], 0.36, 0.36, '#6b5642', { kind: 1, par: 1 }); occ.push([-67.8, z - 0.8, -64.2, z + 0.8, 0.5]); }
        mg.box(-66, 17.2, (z0 + z1) / 2, 0.4, 0.4, z1 - z0 + 1.2, '#6b5642', { kind: 1, par: 2 });
        drape(mg, -66, 17.0, z0 + 2.7, 0, 1, 3.6, 8.6, '#cfc4a8', { stripes: [dye(SCH[north ? 0 : 2]), '#cfc4a8'], rep: 2, scallop: 0.6, folds: 2, depth: 0.22 });
        drape(mg, -66, 17.0, z0 + 14.3, 0, 1, 3.6, 7.8, '#cfc4a8', { stripes: [dye(SCH[north ? 2 : 0]), '#cfc4a8'], rep: 2, scallop: 0.6, folds: 2, depth: 0.22 });
        for (const [dz, i, raw] of [[6.6, north ? 0 : 1, false], [10.5, 2, true]]) {
          panel(mg, -66.3, 11.6, z0 + dz, 1, 0, 3.5, 7.4, i, raw, true);
          for (const d of [-1.2, 1.2]) mg.beam([-66, 17.1, z0 + dz + d], [-66, 15.2, z0 + dz + d], 0.16, 0.16, IRON, { round: 5, jit: 0 });
        }
      }
      await ctx.yield();
      // between radius 43.5 and 49 only low things lie (nothing there rises above the platform's top, y 3.2): heaps of swept sawdust with a
      // broom, short stacks of deck planks, buckets; one group every 30 degrees round the wheel, by the same rule
      const lw = rng.fork('lowwork');
      for (let i = 0; i < 12; i++) {
        const a = (i * 30 + 14) * Math.PI / 180 + lw.range(-0.08, 0.08), r = 46.4, x = Math.cos(a) * r, z = Math.sin(a) * r, pick = i % 3, turn = lw.range(0, 3.14), hgt = lw.range(0.8, 1.3);
        if (Math.abs(a - 2.356) < 0.22 || occ.some((o) => x + 2.6 > o[0] && x - 2.6 < o[2] && z + 2.6 > o[1] && z - 2.6 < o[3])) continue;   // the platform's steps stand here, or something else does
        if (path.nearestXZ(x, z).dist < CLOSE + 2.6) continue;                                                       // A CLOSE THING IS WHOLE OR ABSENT: no small thing within 9 m of the flown line in plan
        if (pick === 0) { mg.cyl(x, hgt / 2, z, 2.1, 0.25, hgt, '#7d6642', { sides: 9, jit: 0.1, ao: [0, hgt] }); mg.cyl(x + 2.2, 0.3, z + 1.1, 1.1, 0.15, 0.6, '#7d6642', { sides: 7, jit: 0.1 });
          mg.beam([x - 2.4, 0.15, z - 1.5], [x - 0.6, 2.9, z - 2.3], 0.16, 0.16, WOODC, { round: 5, kind: 1, par: 1 }); mg.box(x - 2.5, 0.25, z - 1.45, 1.3, 0.5, 0.4, '#5b4634', { r: [0, turn, 0] }); }
        else if (pick === 1) { for (let k = 0; k < 4; k++) mg.box(x, 0.2 + k * 0.36, z, 1.6, 0.3, 5.2, ['#b9a67c', '#a89468', '#c4b189'][k % 3], { kind: 1, par: 2, r: [0, -a + (k - 1.5) * 0.05, 0], jit: 0.1 }); }
        else { for (const d of [-1.2, 0.4, 1.7]) { mg.cyl(x + Math.cos(turn) * d, 0.6, z + Math.sin(turn) * d, 0.55, 0.7, 1.2, d > 1 ? '#5d6a76' : '#8a6a44', { sides: 10, kind: d > 1 ? 0 : 1, par: 1 }); } }
        occ.push([x - 2.6, z - 2.6, x + 2.6, z + 2.6, 0.5]);
      }
      // a tool board and shelf on the south wall east of the arm, above the leaning boards
      mg.box(55, 13.5, 74.6, 26, 6, 0.3, '#4a3828', { kind: 1, par: 0 }); mg.box(55, 10.3, 74.2, 26, 0.25, 1.2, WOODC, { kind: 1, par: 0 });
      for (let i = 0; i < 21; i++) { const x = 43 + i * 1.2, h = hash1(i * 4.3 + 2); if (h < 0.2) continue;
        mg.cyl(x, 15.4 + (i % 2) * 0.4, 74.3, 0.2, 0.15, 1.3, h > 0.6 ? '#7a3d22' : '#9a6a30', { sides: 6, kind: 1, par: 1 }); mg.box(x, 13.8 - h, 74.35, 0.2 + 0.3 * hash1(i + 3), 1.6 + h * 2, 0.08, STEEL, { jit: 0.05 });
        if (i % 4 === 1) mg.cyl(x + 0.5, 11.0, 74.0, 0.45, 0.45, 1.1, [PAL.scarlet, PAL.green, GOLD, '#d9cfb8'][(i >> 2) % 4], { sides: 10 }); }
      ladder(mg, 61, -34, 0.3); ladder(mg, -58, 14, 1.2); ladder(mg, 46, 64, 3.0);
      await ctx.yield();
      // the east floor, beside the tangent leg, set out in the ring's pools: a carver's stand with a half-made stag under the pendant at
      // 15 degrees, timber on trestles under the one at 45, crates by the doors
      const SX = 1, SZ = -28.7;                                                                    // where the stand is, from where it was first drawn
      mg.bench(49.5 + SX, 41 + SZ, 60.5 + SX, 47.5 + SZ, 2.4, WOODC, { th: 0.6, leg: 0.9 }); occ.push([49.5 + SX, 41 + SZ, 60.5 + SX, 47.5 + SZ, 0.7]);
      copies.push({ set: 'trolley', kind: 5, item: { matrix: new THREE.Matrix4().makeRotationY(2.0).setPosition(55 + SX, 0, 44.2 + SZ), top: 2.4, stage: 2, frac: 0.85 } });
      mg.box(51.2 + SX, 2.5, 46.2 + SZ, 0.5, 0.2, 2.6, STEEL, { r: [0, 0.5, 0], jit: 0.04 }); mg.beam([50.6 + SX, 2.56, 45.1 + SZ], [51.0 + SX, 2.56, 46.0 + SZ], 0.36, 0.36, '#7a3d22', { round: 8, kind: 1, par: 1 });
      mg.cyl(59.2 + SX, 2.8, 42.2 + SZ, 0.5, 0.42, 0.8, '#2e3338', { sides: 10 }); mg.box(58.2 + SX, 2.55, 46.3 + SZ, 1.6, 0.3, 0.9, '#5d666e', { r: [0, -0.4, 0] });
      mg.cyl(47.4 + SX, 2.6, 49.5 + SZ, 0.9, 0.9, 0.3, WOODC, { sides: 12, kind: 1, par: 0 }); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; mg.beam([47.4 + SX + Math.cos(a) * 0.5, 2.5, 49.5 + SZ + Math.sin(a) * 0.5], [47.4 + SX + Math.cos(a) * 1.0, 0, 49.5 + SZ + Math.sin(a) * 1.0], 0.22, 0.22, WOODC, { kind: 1, par: 1 }); }
      const cr3 = rng.fork('curls3');
      for (let i = 0; i < 14; i++) { const r = cr3.range(0.4, 0.85), x = cr3.range(46, 63), z = cr3.range(37.5, 51.5), ry = cr3.range(0, 3.14), rz = cr3.range(0, 6.28), sz = cr3.range(4, 9); if (x > 48.9 && x < 61.1 && z > 40.4 && z < 48.1) continue;
        mg.add(curl, { p: [x + SX, r * 0.96, z + SZ], r: [0, ry, rz], s: [r, r, r * sz], c: '#94703c', jit: 0.16 }); }
      const TX = 48.5, TZ = 36.5;                                                                    // the trestles' middle
      for (const z of [TZ - 5, TZ + 5]) {
        for (const s of [-1, 1]) { mg.beam([TX + s * 2.6, 0, z - 1.1], [TX + s * 1.9, 3.0, z], 0.5, 0.5, WOODC, { kind: 1, par: 1 }); mg.beam([TX + s * 2.6, 0, z + 1.1], [TX + s * 1.9, 3.0, z], 0.5, 0.5, WOODC, { kind: 1, par: 1 }); }
        mg.box(TX, 3.2, z, 6.2, 0.5, 0.7, WOODC, { kind: 1, par: 0 }); mg.box(TX, 1.2, z, 4.6, 0.3, 0.3, '#8a7250', { kind: 1, par: 0 });
      }
      for (let k = 0; k < 5; k++) mg.box(TX - 2 + (k % 3) * 1.9 + (k > 2 ? 0.9 : 0), 3.75 + (k > 2 ? 0.62 : 0), TZ + hash1(k * 3.3) * 1.4, 1.7, 0.6, 15 - k * 0.8, ['#b9a67c', '#a89468', '#c4b189'][k % 3], { kind: 1, par: 2, jit: 0.12, r: [0, (hash1(k) - 0.5) * 0.06, 0] });
      occ.push([TX - 3.5, TZ - 8, TX + 3.5, TZ + 8, 0.6]);
      for (const [x, z, w, h, ry] of [[65.5, 35.5, 5.2, 4.4, 0.2], [66.5, 41.6, 4.2, 3.2, -0.3], [64.6, 57.5, 4.6, 3.8, 0.5]]) {
        mg.box(x, h / 2, z, w, h, w * 0.85, '#7a6248', { kind: 1, par: 1, r: [0, ry, 0], ao: [0, 1.6] });
        for (const s of [-1, 1]) mg.box(x, h / 2 + s * h * 0.3, z, w + 0.2, 0.5, w * 0.85 + 0.2, '#5b4634', { kind: 1, par: 0, r: [0, ry, 0] });
        occ.push([x - w * 0.7, z - w * 0.7, x + w * 0.7, z + w * 0.7, 0.55]);
      }
      mg.box(65.8, 5.4, 35.2, 3.2, 2.0, 2.6, '#8a7250', { kind: 1, par: 0, r: [0, 0.6, 0] });
      ladder(mg, 60.5, 7, 2.2);
      await ctx.yield();
      // THE RING'S WORK. Under every pendant of the ring, by one rule, work is gathered in its pool, 5 m out from under the lamp: trestles
      // and a plank with buckets and a heap of sawdust; a crate and a stepladder; a trolley with a half-made animal and a stack of planks.
      // A pool where something stands already, or whose middle would lie within 16 m of the flown line in plan (its nearest piece within 10.5 m), is left as it is.
      const horse = (m, hx, hz, ry) => {
        const c = Math.cos(ry), sn = Math.sin(ry), R = (u, v) => [hx + u * c + v * sn, hz - u * sn + v * c];              // u across the plank, v along it
        for (const v of [-2.6, 2.6]) {
          for (const s2 of [-1, 1]) for (const e of [-0.7, 0.7]) { const p0 = R(s2 * 1.5, v + e), p1 = R(s2 * 1.1, v); m.beam([p0[0], 0, p0[1]], [p1[0], 2.3, p1[1]], 0.34, 0.34, WOODC, { kind: 1, par: 1 }); }
          const q = R(0, v); m.box(q[0], 2.45, q[1], 3.4, 0.4, 0.5, WOODC, { kind: 1, par: 0, r: [0, ry, 0] });
        }
        m.box(hx, 2.8, hz, 1.5, 0.3, 8.2, '#c4b189', { kind: 1, par: 2, r: [0, ry, 0] }); m.box(hx + 0.2, 3.1, hz - 0.6, 1.3, 0.3, 5.6, '#b9a67c', { kind: 1, par: 2, r: [0, ry + 0.07, 0] });
        occ.push([hx - 3.6, hz - 3.6, hx + 3.6, hz + 3.6, 0.5]);
      };
      const bucket = (m, x, z, iron) => { m.cyl(x, 0.6, z, 0.55, 0.7, 1.2, iron ? '#5d6a76' : '#8a6a44', { sides: 10, kind: iron ? 0 : 1, par: 1 }); m.cyl(x, 1.16, z, 0.6, 0.6, 0.06, iron ? '#3a4148' : '#cdb98c', { sides: 10, jit: 0 }); occ.push([x - 0.8, z - 0.8, x + 0.8, z + 0.8, 0.5]); };
      const rw = lw;                                                                               // the low work's own stream goes on: no other deal moves
      for (let i = 0; i < RING_N; i++) {
        const a = RING_A(i), tw = rw.range(-0.5, 0.5), pickK = rw.int(0, 3), fr = rw.range(0.3, 0.9), hgt = rw.range(2.6, 4.2);     // every draw, built or not
        const ca = Math.cos(a), sa = Math.sin(a), cx = ca * (RING_R + 5), cz = sa * (RING_R + 5);
        if (path.nearestXZ(cx, cz).dist < 16 || occ.some((o) => cx + 5.5 > o[0] && cx - 5.5 < o[2] && cz + 5.5 > o[1] && cz - 5.5 < o[3])) continue;
        const Q = (t, o) => [cx + o * ca - t * sa, cz + o * sa + t * ca];                                                  // t along the ring, o outward
        if (i % 3 === 0) {
          const h0 = Q(0.5, 0.5); horse(mg, h0[0], h0[1], -a + tw * 0.4);
          const b0 = Q(-4.2, -1.5), b1 = Q(-4.9, 0.2), b2 = Q(4.6, -2.2); bucket(mg, b0[0], b0[1], false); bucket(mg, b1[0], b1[1], true); bucket(mg, b2[0], b2[1], false);
          const sd = Q(-1.2, -3.6); mg.cyl(sd[0], 0.55, sd[1], 2.2, 0.25, 1.1, '#7d6642', { sides: 9, jit: 0.1, ao: [0, 1.1] }); occ.push([sd[0] - 2, sd[1] - 2, sd[0] + 2, sd[1] + 2, 0.4]);
        } else if (i % 3 === 1) {
          const c0 = Q(1.6, 1.2), w = 4.4;
          mg.box(c0[0], hgt / 2, c0[1], w, hgt, w * 0.8, '#7a6248', { kind: 1, par: 1, r: [0, -a + tw, 0], ao: [0, 1.6] });
          for (const s2 of [-1, 1]) mg.box(c0[0], hgt / 2 + s2 * hgt * 0.3, c0[1], w + 0.2, 0.5, w * 0.8 + 0.2, '#5b4634', { kind: 1, par: 0, r: [0, -a + tw, 0] });
          mg.box(c0[0] + 0.3, hgt + 0.9, c0[1], w * 0.55, 1.8, w * 0.5, '#8a7250', { kind: 1, par: 0, r: [0, -a + tw + 0.5, 0] });
          occ.push([c0[0] - w * 0.7, c0[1] - w * 0.7, c0[0] + w * 0.7, c0[1] + w * 0.7, 0.55]);
          const l0 = Q(-3.4, 0.6); ladder(mg, l0[0], l0[1], -a + 1.57 + tw);
          const b0 = Q(-0.6, -3.2), b1 = Q(0.9, -3.6); bucket(mg, b0[0], b0[1], true); bucket(mg, b1[0], b1[1], false);
        } else {
          const t0 = Q(0.8, 1.0); trolley(mg, t0[0], t0[1], -a + 1.2 + tw, [1, 3, 4, 5][pickK], fr > 0.6 ? 3 : 2, fr);
          const p0 = Q(-5.2, -0.4); for (let k = 0; k < 4; k++) mg.box(p0[0], 0.2 + k * 0.36, p0[1], 1.6, 0.3, 5.2, ['#b9a67c', '#a89468', '#c4b189'][k % 3], { kind: 1, par: 2, r: [0, -a + (k - 1.5) * 0.06, 0], jit: 0.1 });
          occ.push([p0[0] - 2.6, p0[1] - 2.6, p0[0] + 2.6, p0[1] + 2.6, 0.5]);
          const b0 = Q(-2.6, -3.4); bucket(mg, b0[0], b0[1], false);
        }
      }
      await ctx.yield();
      await bakeGas(mg); await ctx.yield();
      await mg.pack(ctx.yield); addMesh(mg, 'wheel-bay');
    }
    await ctx.yield();

    // ---- 5 paint shop (west arm): drying racks, the two conveyors, kettles, the gilder's and the painter's benches -----
    const cartsAt = [];                                  // where paint is worked on the floor besides the kettles and benches: [x, z, radius]
    const strips = [];                                   // moving belts and conveyor chains: { a, b, w: [x,y,z] half-width vector, speed, style }
    const LOOPS = [{ aisle: -50.5, back: -62 }, { aisle: -31.5, back: -20 }], RAIL_Y = 17, X_E = -84, X_W = -129, RUN = X_E - X_W, R_END = 5.75, LOOP_LEN = 2 * RUN + TAU * R_END;
    const HOOKS = 12, HANG = 10.7;                                                   // hooks on each loop; how far below the rail a hung animal's own origin lies
    {
      const mg = makeMerger(), pr = rng.fork('paint');
      const half = new THREE.TorusGeometry(R_END, 0.3, 6, 14, Math.PI);
      for (const lp of LOOPS) {
        const zc = (lp.aisle + lp.back) / 2;
        for (const z of [lp.aisle, lp.back]) {
          mg.box((X_E + X_W) / 2, RAIL_Y + 0.75, z, RUN, 0.9, 0.36, IRON, { jit: 0 }); mg.box((X_E + X_W) / 2, RAIL_Y + 0.28, z, RUN, 0.16, 0.9, IRON, { jit: 0 });
          for (let x = X_W; x <= X_E + 0.1; x += 21) { mg.beam([x, RAIL_Y + 1.1, z], [x, 34, z], 0.36, 0.36, IRON); mg.box(x, RAIL_Y + 1.3, z, 1.2, 0.5, 1.0, IRON, {}); }
          strips.push({ a: [X_W, RAIL_Y - 0.05, z], b: [X_E, RAIL_Y - 0.05, z], w: [0, 0.22, 0], speed: z === lp.aisle ? 1.5 : -1.5, style: 1 });
        }
        mg.add(half, { p: [X_E, RAIL_Y + 0.4, zc], r: [Math.PI / 2, 0, -Math.PI / 2], c: IRON, jit: 0 }); mg.add(half, { p: [X_W, RAIL_Y + 0.4, zc], r: [Math.PI / 2, 0, Math.PI / 2], c: IRON, jit: 0 });
        mg.box(X_E + 1, RAIL_Y + 1.6, zc, 3.4, 2.2, 3.0, GREEN, {}); mg.cyl(X_E + 1, RAIL_Y + 0.3, zc, 2.2, 2.2, 0.5, IRON, { sides: 14 });                  // drive
      }
      half.dispose();
      await ctx.yield();
      // drying racks along both walls: painted panels on the shelves, horsehair tails hung from the top rail
      const PAINTS = [PAL.scarlet, GOLD, GREEN, '#e3d6b4', '#1E3FA0', '#D97890', PAL.scarlet, '#e3d6b4'];
      const TAILS = ['#1e1512', '#e8e0cc', '#7a3b1e', '#3a2a20', '#cdb98c'];
      let hoops = 0;                                                                                 // hoops laid so far on all six runs of shelves (HOOP_CAP)
      for (const [zf, nz] of [[-68, -1], [-14, 1]]) for (let sgm = 1; sgm < 4; sgm++) {              // three runs a wall, x -139 to -80: west of them stand the finished animals
        const x0 = -159.5 + sgm * 20.5, x1 = x0 + 18, zb = zf + nz * 2.6;
        for (let i = 0; i <= 3; i++) for (const z of [zf, zb]) mg.box(x0 + i * 6, 6.5, z, 0.5, 13, 0.5, '#6b5642', { kind: 1, par: 1, ao: [0, 2.5] });
        for (const y of [1.2, 4.8, 8.4, 12.6]) { mg.box((x0 + x1) / 2, y, zf, 18.6, 0.4, 0.4, '#6b5642', { kind: 1, par: 0 }); if (y < 12) for (let j = 0; j < 4; j++) mg.box(x0 + 2.2 + j * 4.5, y + 0.1, (zf + zb) / 2, 0.3, 0.3, 2.8, '#6b5642', { kind: 1, par: 2 }); }
        for (let t = 0; t < 3; t++) for (let j = 0; j < 4; j++) {
          const none = pr.chance(0.2), c = PAINTS[pr.int(0, 7)], x = x0 + 2.4 + j * 4.4 + pr.range(-0.4, 0.4), y = 1.6 + t * 3.6, kind = pr.int(0, 2), tw = [pr.range(-0.1, 0.1), pr.range(-0.1, 0.1), pr.range(-0.1, 0.1)];
          if (none) continue;                                                                                           // an empty place on the shelf (its draws are taken all the same)
          const board = kind === 0 || (kind === 1 && hoops >= HOOP_CAP);                                                // THE CAP (HOOP_CAP, 32: seeds 1 to 1,200 lay 30 at the most): a hoop past it is laid as a board, the lighter kind, in its place and colour; its seven draws are taken above all the same
          if (board) { mg.box(x, y + 1.3, zf + nz * 1.3, 3.4, 2.4, 0.3, c, { r: [nz * 0.25, 0, 0] }); mg.box(x, y + 1.3, zf + nz * 1.3 - nz * 0.2, 2.6, 1.7, 0.1, GOLD, { r: [nz * 0.25, 0, 0], jit: 0 }); }
          else if (kind === 1) { hoops++; mg.add(rimGeo, { p: [x, y + 1.4, zf + nz * 1.2], r: [nz * 0.2, 0, 0], s: [1.3, 1.3, 2.5], c }); mg.cyl(x, y + 1.4, zf + nz * 1.2, 1.2, 1.2, 0.12, '#cfe0ea', { r: [Math.PI / 2 + nz * 0.2, 0, 0], sides: 12, jit: 0 }); }
          else for (let k = 0; k < 3; k++) mg.box(x - 1.2 + k * 1.2, y + 0.25 + k * 0.02, zf + nz * 1.3, 1.0, 0.24, 2.6, k === 1 ? '#e3d6b4' : c, { r: [0, tw[k], 0] });
        }
        mg.box((x0 + x1) / 2, 6.6, zb + nz * 0.3, 18.6, 12.6, 0.2, '#6a5a48', { kind: 1, par: 1 });                    // the rack's boarded back
        for (let t = 0; t < 3; t++) for (let j = 0; j < 8; j++) {                                                       // tins and jars at the back of each shelf
          const h = hash1(sgm * 31 + t * 7 + j * 3 + (nz > 0 ? 50 : 0)), x = x0 + 1.3 + j * 2.2 + (h - 0.5) * 0.6, y = 1.4 + t * 3.6, r = 0.42 + 0.2 * hash1(h * 91);
          if (h < 0.18) continue;
          mg.cyl(x, y + 0.55, zb - nz * 0.55, r, r, 1.1, h > 0.7 ? '#8f9aa2' : (h > 0.45 ? '#b9a67c' : '#5d6a76'), { sides: 7, open: true }); mg.cyl(x, y + 1.12, zb - nz * 0.55, r * 0.9, r * 0.9, 0.05, PAINTS[Math.floor(h * 97) % 8], { sides: 7, jit: 0 });
        }
        for (let j = 0; j < 9; j++) {
          const none = pr.chance(0.25), x = x0 + 1 + j * 2, len = pr.range(2.6, 3.6), c = TAILS[pr.int(0, 4)];
          if (none) continue;
          mg.beam([x, 12.4, zf - nz * 0.3], [x, 12.4 - len, zf - nz * 0.3], 0.55, 0.4, c, { round: 6, taper: 0.25, kind: 4, sway: [12.4, 12.4 - len], jit: 0.15 });
          mg.cyl(x, 12.3, zf - nz * 0.3, 0.3, 0.26, 0.5, BRASS, { sides: 6, jit: 0 });
        }
        occ.push([x0 - 0.5, Math.min(zf, zb) - 0.5, x1 + 0.5, Math.max(zf, zb) + 0.5, 0.7]);
        await ctx.yield();
      }
      await ctx.yield();
      // size kettles on their stoves, between each conveyor's two runs (5.75 m from either rail): a cast stove on four feet with a fire door
      // and a flue, a copper pot with a rolled rim and two lug handles, a paddle standing in it; they steam thinly
      const FLUE = '#' + cD.set(SCH[0]).lerp(cG, 0.2).multiplyScalar(0.95).getHexString();                 // the flues are painted in the scheme's first colour (never black posts in the aisle's picture), with a brass collar every 7 m
      for (const [x, z, c] of [[-104, -56.25, PAL.scarlet], [-138, -56.25, GREEN], [-114, -25.75, '#e3d6b4'], [-100, -25.75, GOLD]]) {
        const s = z < -41 ? -1 : 1, out = x < X_W - R_END, fx0 = out ? x - 4.6 : x + 1.8;        // the flue's own x: the stove beyond the conveyor's end cranks its flue 4.6 m west, clear of the loop's end
        for (const [a, b] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) mg.cyl(x + a, 0.35, z + b, 0.22, 0.3, 0.7, IRON, { sides: 6 });
        mg.box(x, 1.6, z, 3.6, 1.9, 3.6, '#34393f', { ao: [0.6, 1.4] }); mg.box(x, 2.62, z, 4.0, 0.22, 4.0, '#454c54', {}); mg.box(x, 0.72, z, 3.9, 0.16, 3.9, '#454c54', {});
        mg.box(x, 1.55, z - s * 1.82, 1.5, 1.1, 0.12, '#23272b', {}); mg.box(x, 1.55, z - s * 1.9, 1.0, 0.5, 0.06, '#ff9040', { kind: 5, par: 2.4, jit: 0 });    // the fire door faces the aisle
        for (const d of [-0.62, 0.62]) mg.box(x + d, 1.55, z - s * 1.9, 0.1, 1.2, 0.1, IRON, { jit: 0 });
        // the flue, by one rule for every stove inside a conveyor's loop: straight up from the stove's top midway between the two runs (5.75 m
        // from either rail, where no hung animal reaches: FLUE CHECK below; the stove west of the loop's end cranks its flue to x -142.6), and under the roof (y 32, 15 m above the rails) away to the wall behind the return run
        if (out) { mg.beam([x - 1.8, 2.7, z], [fx0, 6.6, z], 0.6, 0.6, FLUE, { round: 8 }); mg.beam([fx0, 6.6, z], [fx0, 32, z], 0.6, 0.6, FLUE, { round: 8 }); }
        else mg.beam([fx0, 2.7, z], [fx0, 32, z], 0.6, 0.6, FLUE, { round: 8 });
        mg.beam([fx0, 32, z], [fx0, 32, z + s * 15.2], 0.6, 0.6, FLUE, { round: 8 });
        mg.cyl(out ? x - 1.8 : fx0, 3.0, z, 0.5, 0.42, 0.5, IRON, { sides: 8 }); for (const y of [11, 18, 25, 31.6]) mg.cyl(fx0, y, z, 0.46, 0.46, 0.7, BRASS, { sides: 8, kind: 5, par: 0.55, jit: 0 });   // a gilt band every 7 m
        mg.cyl(x - 0.3, 3.75, z - s * 0.3, 1.25, 1.5, 0.9, '#a8623a', { sides: 14 }); mg.cyl(x - 0.3, 4.75, z - s * 0.3, 1.5, 1.25, 1.1, '#b46a3c', { sides: 14 });  // the copper: belly and shoulder
        mg.add(rimGeo, { p: [x - 0.3, 5.3, z - s * 0.3], r: [Math.PI / 2, 0, 0], s: [1.5, 1.5, 1.3], c: '#c98a4a' }); mg.cyl(x - 0.3, 5.22, z - s * 0.3, 1.38, 1.38, 0.06, c, { sides: 14, jit: 0 });
        for (const d of [-1, 1]) mg.add(rimGeo, { p: [x - 0.3 + d * 1.62, 4.7, z - s * 0.3], r: [0, Math.PI / 2, 0], s: [0.42, 0.42, 1.2], c: '#3a4148' });
        mg.beam([x - 0.6, 5.2, z - s * 0.1], [x - 1.5, 7.3, z + s * 0.5], 0.2, 0.2, WOODC, { round: 5, kind: 1, par: 1 });
        steamAt.push([x - 0.3, 5.4, z - s * 0.3, 7.5, 0.7]); occ.push([x - 2.6, z - 2.6, x + 2.6, z + 2.6, 0.65]);
        await ctx.yield();
      }
      await ctx.yield();
      // the gilder's bench: books of leaf, a burnisher, a gilt sunburst (leaf that only gives back the lamp: nothing on the bench is brighter
      // than its lamp's shade). Built where it was first drawn and set down 4 m east and 13 m south of there, behind the south conveyor's
      // return run and before the drying racks, so that its near edge is 20 m to the side of the flown line and it leaves the picture by
      // its side; a paint-spotted drop cloth lies under it
      const mgG = makeMerger(), mgP = makeMerger(), GB = [4, 0, 13], PB = [0, 0, -13];
      for (const [m, x0, z0, x1, z1] of [[mgG, -102.4, -36.2, -83.5, -27.8], [mgP, -128.5, -54.4, -106.6, -45.6]]) {
        const g2 = new THREE.PlaneGeometry(x1 - x0, z1 - z0, 14, 6); m.add(g2, { p: [(x0 + x1) / 2, 0.05, (z0 + z1) / 2], r: [-Math.PI / 2, 0, 0], c: '#8a7a5c', jit: 0.22, tint: (X, Y, Z, col) => { const h = hash1(Math.round(X * 1.3) * 7.1 + Math.round(Z * 1.3) * 3.3); if (h > 0.72) col.lerp(cD.set(SCH[Math.floor(h * 40) % 3]), 0.55).multiplyScalar(0.7); } }); g2.dispose(); }
      mgG.bench(-102, -34, -86, -30, 3.6, WOODC, { th: 0.5, leg: 0.8 }); occ.push([-98, -21, -82, -17, 0.7]);
      for (let i = 0; i < 6; i++) { const x = -100.5 + i * 1.5; mgG.box(x, 3.72 + (i % 3) * 0.1, -32.6, 1.1, 0.22 + (i % 3) * 0.2, 1.4, ['#7a2a20', '#3a2a20', GREEN][i % 3], { r: [0, hash1(i) * 0.5 - 0.25, 0] }); mgG.box(x + 0.05, 3.86 + (i % 3) * 0.3, -32.55, 0.9, 0.03, 1.2, '#d9a63c', { kind: 5, par: 0.22, jit: 0, r: [0, hash1(i) * 0.5 - 0.2, 0] }); }
      mgG.beam([-90.5, 3.8, -31], [-88.6, 3.8, -32.4], 0.3, 0.3, '#7a3d22', { round: 6, kind: 1, par: 0 }); mgG.beam([-88.6, 3.8, -32.4], [-88.1, 3.8, -32.8], 0.2, 0.2, '#b05a6a', { round: 6, jit: 0 });
      for (let k = 0; k < 12; k++) { const a = k * 0.5236; mgG.beam([-93 + Math.cos(a) * 0.4, 4.0, -32 + Math.sin(a) * 0.4], [-93 + Math.cos(a) * (k % 2 ? 1.5 : 2.0), 3.74, -32 + Math.sin(a) * (k % 2 ? 1.5 : 2.0)], 0.4, 0.12, GOLD, { taper: 0.1, jit: 0 }); }
      mgG.cyl(-93, 4.0, -32, 0.5, 0.3, 0.4, '#d9a63c', { sides: 10, kind: 5, par: 0.2, jit: 0 });
      // the gilder's cushion and an open book of leaf, a bench lamp on its brass stand over them (its top y 6.7: a metre under the lowest hung animal)
      mgG.box(-97, 3.8, -32, 2.6, 0.3, 1.8, '#6a3a2a', { jit: 0.05 }); mgG.box(-97.6, 4.02, -32, 1.1, 0.1, 1.5, '#e8dcc0', { r: [0, 0, 0.16], jit: 0 }); mgG.box(-96.4, 4.02, -32, 1.1, 0.1, 1.5, '#e8dcc0', { r: [0, 0, -0.16], jit: 0 });
      mgG.box(-96.4, 4.1, -32, 0.9, 0.04, 1.2, '#d9a63c', { r: [0, 0, -0.16], kind: 5, par: 0.25, jit: 0 });
      mgG.cyl(-99.4, 3.75, -33, 0.5, 0.4, 0.2, BRASS, { sides: 8 }); mgG.beam([-99.4, 3.8, -33], [-99.4, 6.3, -33], 0.16, 0.16, BRASS, { round: 6 }); mgG.beam([-99.4, 6.3, -33], [-98.3, 6.5, -32.6], 0.12, 0.12, BRASS, { round: 6 });
      mgG.cyl(-98.3, 6.3, -32.6, 0.7, 0.2, 0.5, GREEN, { sides: 8 }); mgG.cyl(-98.3, 5.95, -32.6, 0.3, 0.26, 0.4, '#ffdcae', { sides: 6, kind: 5, par: 1.1, jit: 0 }); gasAt.push([-94.3, 6.2, -19.6, 0.3]);
      await ctx.yield();
      // the painter's bench across the aisle (set 13 m north of where it was first drawn, behind the north conveyor's return run: 20 m from the line): pots, brushes in a jar, on its own drop cloth
      mgP.bench(-126, -52, -108, -48, 3.6, WOODC, { th: 0.5, leg: 0.8 }); occ.push([-126, -65, -108, -61, 0.7]);
      for (let i = 0; i < 9; i++) { const x = -124.6 + i * 1.9 + hash1(i * 5) * 0.5, z = -50 + (hash1(i * 9) - 0.5) * 1.6, c = PAINTS[i % 8]; mgP.cyl(x, 4.05, z, 0.5, 0.5, 0.9, '#8f9aa2', { sides: 10 }); mgP.cyl(x, 4.52, z, 0.44, 0.44, 0.04, c, { sides: 10, jit: 0 }); mgP.box(x + 0.5, 3.9, z + 0.3, 0.5, 0.5, 0.1, c, { r: [1.2, hash1(i), 0], jit: 0 }); }
      for (let k = 0; k < 5; k++) mgP.beam([-109.5, 4.2, -50], [-109.5 + (k - 2) * 0.22, 5.9, -50 + (k % 2) * 0.3 - 0.15], 0.1, 0.1, k % 2 ? '#3a2a20' : WOODC, { round: 5 });
      mgP.cyl(-109.5, 4.1, -50, 0.4, 0.4, 1.0, '#6a8a9a', { sides: 10 });
      await bakeGas(mgG, GB); await bakeGas(mgP, PB); await ctx.yield();
      addMesh(mgG, 'gilders-bench').position.set(GB[0], GB[1], GB[2]); addMesh(mgP, 'painters-bench').position.set(PB[0], PB[1], PB[2]);
      // THE FINISHED ANIMALS waiting for despatch: four of the great ones (1.4 times the wheel's), on low floor trolleys on the sidings along
      // the two side walls (PROC: 25 m either side of the line, nose to tail on short coupled decks, their draw bars unshipped, all of them
      // more than 30 m before the doorway's wall; the drying racks begin east of them), all facing the doorway, each under its
      // own small warm lamp, the wall behind them hung with the painters' colour boards, brushes and harness.
      { const CASTP = [[0, '#E9E2D0', true], [5, '#9A5A2C', false], [1, '#B98A55', true], [2, '#EFE9DA', false], [3, '#AAB7C2', true], [4, '#D9541E', false]];
        PROC.forEach(([x, dz], i) => [-1, 1].forEach((sd, j) => { const [kind, body, alt] = CASTP[i * 2 + j]; trolley(mg, x, -41 + sd * dz, Math.PI, kind, 6, 1, { body, hair: '#3A2A20', alt }, 0, PROC_K, false, 6.6); cartsAt.push([x, -41 + sd * dz, 2]); })); }
      // the wall behind them, both sides alike by one rule: a colour board (a dark board of the scheme's paints in swatches), a rail of
      // brushes hung by their handles, a collar and traces of harness on a peg
      for (const [zw, nz] of [[-71, 1], [-11, -1]]) {
        const zf = zw + nz * 0.25;
        mg.box(-160, 9.6, zf, 9.4, 6.4, 0.3, '#3a2c20', { kind: 1, par: 0, jit: 0 });
        for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) mg.box(-163.6 + c * 1.8, 7.7 + r * 1.9, zf + nz * 0.2, 1.4, 1.5, 0.12, dull(PAINTS[(r * 5 + c + (nz > 0 ? 0 : 3)) % 8]), { jit: 0.05 });
        mg.box(-146.5, 12.2, zf, 7.4, 0.3, 0.3, IRON, { jit: 0 });
        for (let k = 0; k < 9; k++) { const x = -149.7 + k * 0.8, len = 1.6 + 1.2 * hash1(k * 3.1 + nz);
          mg.box(x, 12.0 - len / 2, zf + nz * 0.2, 0.16, len, 0.16, k % 2 ? '#7a3d22' : '#9a6a30', { kind: 1, par: 1 }); mg.box(x, 11.8 - len - 0.35, zf + nz * 0.2, 0.3 + 0.2 * hash1(k), 0.7, 0.2, dull(PAINTS[(k + (nz > 0 ? 2 : 5)) % 8]), { jit: 0.05 }); }
        mg.add(rimGeo, { p: [-169.5, 10.4, zf + nz * 0.3], s: [1.5, 2.0, 3.2], c: '#3a2a20' }); mg.box(-169.5, 12.6, zf + nz * 0.2, 0.5, 0.3, 0.5, IRON, {});
        for (const d of [-1, 1]) { mg.box(-169.5 + d * 1.0, 7.0, zf + nz * 0.2, 0.3, 3.6, 0.12, '#4a3020', { jit: 0.05 }); mg.cyl(-169.5 + d * 1.0, 8.9, zf + nz * 0.3, 0.26, 0.26, 0.12, BRASS, { r: [Math.PI / 2, 0, 0], sides: 8, jit: 0 }); }
      }
      await bakeGas(mg); await ctx.yield();
      await mg.pack(ctx.yield); addMesh(mg, 'paint-shop');
    }
    await ctx.yield();

    // ---- floors: dark oiled boards; their lamp pools, the shade under everything that stands on them and the paint shop's worked
    // patches are drawn from the plan (tLm), so the slabs themselves are plain ----------------------------------------------------
    const paintAt = [[-104, -56.25, 3], [-138, -56.25, 3], [-114, -25.75, 3], [-100, -25.75, 3], [-94, -19, 2.5], [-86, -19, 2.5], [-121, -63, 2.5], [-112, -63, 2.5], ...cartsAt];
    {
      const W = LM.w, H = LM.h, sz = LM.s, lamp = new Float32Array(W * H), shade = new Float32Array(W * H).fill(1), work = new Float32Array(W * H), dust = new Float32Array(W * H);
      const span = (c0, c1, o, n) => [Math.max(1, Math.floor((c0 - o) / sz)), Math.min(n - 2, Math.ceil((c1 - o) / sz))];
      for (let k = 0; k < gasAt.length; k++) {                                       // a pool under each lamp: a disc with a soft edge on a wide low glow
        const q = gasAt[k], R = POOL_R * Math.sqrt(q[3]) * (q[4] ?? 1), [i0, i1] = span(q[0] - 2.8 * R, q[0] + 2.8 * R, LM.x0, W), [j0, j1] = span(q[2] - 2.8 * R, q[2] + 2.8 * R, LM.z0, H);
        if ((k & 3) === 3) await ctx.yield();
        const R2 = R * R;
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = LM.x0 + (i + 0.5) * sz - q[0], dz = LM.z0 + (j + 0.5) * sz - q[2], d2 = dx * dx + dz * dz;
          lamp[j * W + i] += q[3] * ((d2 < R2 ? 0.9 * (1 - sstep(0.15 * R, R, Math.sqrt(d2))) : 0) + 0.1 * Math.exp(-d2 / (2.0 * R2))); }
      }
      await ctx.yield();
      for (const o of occ) {                                                         // contact shade, 2.4 m wide
        const [i0, i1] = span(o[0] - 2.4, o[2] + 2.4, LM.x0, W), [j0, j1] = span(o[1] - 2.4, o[3] + 2.4, LM.z0, H);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = LM.x0 + (i + 0.5) * sz, z = LM.z0 + (j + 0.5) * sz;
          const dx = x < o[0] ? o[0] - x : (x > o[2] ? x - o[2] : 0), dz = z < o[1] ? o[1] - z : (z > o[3] ? z - o[3] : 0), d = Math.sqrt(dx * dx + dz * dz);
          if (d < 2.4) shade[j * W + i] *= 1 - o[4] * (1 - sstep(0, 2.4, d)); }
      }
      await ctx.yield();
      for (const o of occ) {                                                         // swept sawdust: a low drift with a soft edge round the feet of whatever stands on the carving shop's and the bay's boards
        if (o[2] < -76 || o[4] < 0.45) continue;
        const [i0, i1] = span(o[0] - 3.6, o[2] + 3.6, LM.x0, W), [j0, j1] = span(o[1] - 3.6, o[3] + 3.6, LM.z0, H);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const x = LM.x0 + (i + 0.5) * sz, z = LM.z0 + (j + 0.5) * sz;
          const dx = x < o[0] ? o[0] - x : (x > o[2] ? x - o[2] : 0), dz = z < o[1] ? o[1] - z : (z > o[3] ? z - o[3] : 0), d = Math.sqrt(dx * dx + dz * dz);
          if (d < 3.6) dust[j * W + i] = Math.max(dust[j * W + i], 0.85 * (1 - sstep(0.4, 3.6, d)) * (0.55 + 0.45 * hash1(o[0] * 3.1 + o[1] * 1.7 + Math.floor(Math.atan2(z - (o[1] + o[3]) / 2, x - (o[0] + o[2]) / 2) * 1.6)))); }
      }
      await ctx.yield();
      { const [i0, i1] = span(-47, 47, LM.x0, W), [j0, j1] = span(-47, 47, LM.z0, H);  // under the platform, and a couple of metres out from its rim
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const r = Math.hypot(LM.x0 + (i + 0.5) * sz, LM.z0 + (j + 0.5) * sz); if (r < 46) shade[j * W + i] *= 0.3 + 0.7 * sstep(43.2, 46, r); } }
      for (const q of paintAt) {
        const [i0, i1] = span(q[0] - q[2] - 5, q[0] + q[2] + 5, LM.x0, W), [j0, j1] = span(q[1] - q[2] - 5, q[1] + q[2] + 5, LM.z0, H);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(LM.x0 + (i + 0.5) * sz - q[0], LM.z0 + (j + 0.5) * sz - q[1]); work[j * W + i] = Math.max(work[j * W + i], 1 - sstep(q[2], q[2] + 5, d)); }
      }
      for (const lp of LOOPS) {                                                      // and under each conveyor's aisle run, where the hung animals drip
        const [i0, i1] = span(X_W, X_E, LM.x0, W), [j0, j1] = span(lp.aisle - 9.5, lp.aisle + 9.5, LM.z0, H);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.abs(LM.z0 + (j + 0.5) * sz - lp.aisle); work[j * W + i] = Math.max(work[j * W + i], 0.95 * (1 - sstep(1.5, 9.5, d))); }
      }
      await ctx.yield();
      for (let k = 0; k < W * H; k++) { lmData[k * 4] = Math.min(255, Math.round(lamp[k] * 170)); lmData[k * 4 + 1] = Math.round(shade[k] * 255); lmData[k * 4 + 2] = Math.round(work[k] * 255); lmData[k * 4 + 3] = Math.round(dust[k] * 255); if ((k & 32767) === 32767) await ctx.yield(); }
      lmTex.needsUpdate = true;
      { const at = (x, z) => { const i = Math.floor((x - LM.x0) / sz), j = Math.floor((z - LM.z0) / sz); return L.lampFloor[0] + L.lampFloor[1] * 1.5 * Math.min(1, lamp[j * W + i] * 170 / 255); };
        const a0 = RING_A(0), a1 = RING_A(1), am = (a0 + a1) / 2, mid = at(Math.cos(am) * RING_R, Math.sin(am) * RING_R), mid2 = at(0, 102), c0 = at(Math.cos(a0) * RING_R, Math.sin(a0) * RING_R);
        report.push('lamp pools on the floor: middle of a pool ' + c0.toFixed(2) + ', midpoint between two ring pendants ' + mid.toFixed(2) + ' (' + (mid / c0).toFixed(2) + ' of it), the arm\'s axis between its pendants ' + mid2.toFixed(2) + ' (' + (mid2 / c0).toFixed(2) + ')'); }
      const mg = makeMerger();
      const slab = (x0, z0, x1, z1, step) => {
        const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.round((x1 - x0) / step), Math.round((z1 - z0) / step));
        mg.add(g, { p: [(x0 + x1) / 2, 0, (z0 + z1) / 2], r: [-Math.PI / 2, 0, 0], c: L.floor, kind: 2, jit: 0 }); g.dispose();
      };
      slab(-75, -75, 75, 75, 15); slab(-35, 75, 35, 211, 17); slab(-176, -71, -75, -11, 20);
      addMesh(mg, 'floors');
    }
    await ctx.yield();

    // ---- copies in the wheel's own look: rack spares and trolley animals, the great head, bench parts, the conveyor's animals ----
    const conv = []; let hung = null;                    // hung: the roughed-out horse on the travelling hoist, which turns a little on its slings
    {
      const groups = new Map(), q0 = new THREE.Vector3();
      // how much of the hall's lamps reaches a point: the same sum the walls and benches are baked with
      const lampAt = (x, y, z) => lampOn(x, y, z, gasAt, false);
      // rack spares are the lightest sculpt on a short pole with a hook eye; trolley animals stand by their feet; blanks are off their poles
      const COPY_SO = { spare: { lite: true, lod: 0.5, poleBase: 1.6, poleTop: 7.1, crank: false, footPole: true }, trolley: { lod: 0.8, poleBase: 1.6, poleTop: 7.8, crank: false, footPole: true },
        blank: { pole: false, clamps: true, even: true }, hoist: { pole: false } };
      for (const c of copies) { const k = c.set + ':' + c.kind; if (!groups.has(k)) groups.set(k, { set: c.set, kind: c.kind, items: [] }); groups.get(k).items.push(c.item); }
      for (const g of groups.values()) {
        const so = COPY_SO[g.set] || {}, geo = hero.sculptGeometry(g.kind, so), ext = hero.extentOf(geo, g.set === 'blank');
        await ctx.yield();
        // a copy that names the deck it stands on (item.top) is set down by its own lowest point, whatever its species: the soles of its gilt shoes
        // (the part's measure takes them in), or the ends of its sawn legs if it is a glued blank, which has no shoes yet
        for (const it of g.items) { q0.setFromMatrixPosition(it.matrix); if (it.top !== undefined) it.matrix.setPosition(q0.x, q0.y = it.top - ext.foot * it.matrix.getMaxScaleOnAxis(), q0.z); it.lamp = lampAt(q0.x, q0.y + (ext.foot + ext.top) / 2, q0.z); if (g.set === 'spare') it.lamp = Math.min(2.4, it.lamp / L.shaft[2]); }   // a rack spare keeps the whole of its rack lamp, whatever shade the racks stand in
        const mesh = hero.makeCopies(geo, g.items, g.set + '-' + g.kind); scene.add(mesh);
        mesh.userData.extent = ext;
        g.items.forEach((it, i) => { if (it.hung) { hung = { mesh, i, m0: it.matrix.clone(), low: it.matrix.elements[13] + ext.foot * HOIST.k }; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); } });
        for (const it of g.items) { if (it.hung) continue; q0.setFromMatrixPosition(it.matrix); const k = it.matrix.getMaxScaleOnAxis(); standing.push([q0.x, q0.y + ext.foot * k, q0.y + ext.top * k, q0.z, ext.reach * k, g.set + '-' + g.kind]); }
        await ctx.yield();
      }
      const cr = rng.fork('conveyor'), per = [[], [], [], [], [], []];
      // twelve hooks a loop (the design has seventeen: DEPARTURES), dealt from a bag that holds the six species in turn
      const convBag = []; for (let i = 0; i < 2 * HOOKS; i++) convBag.push(i % 6); cr.shuffle(convBag);
      for (let lp = 0; lp < 2; lp++) for (let i = 0; i < HOOKS; i++) {
        const sp = convBag[lp * HOOKS + i], coat = cr.pick(hero.coats[sp]);
        let lamp = 0; for (let k = 0; k < 6; k++) lamp += lampAt(X_W + RUN * (k + 0.5) / 6, RAIL_Y - 6, LOOPS[lp].aisle) / 6;      // the lamps along its aisle run
        per[sp].push({ loop: lp, s0: (i + cr.range(-0.08, 0.08)) * LOOP_LEN / HOOKS, ph: cr.range(0, TAU), item: { matrix: new THREE.Matrix4(), lamp, stage: cr.chance(0.75) ? 6 : 5, frac: 1, body: coat[0], hair: coat[1], alt: cr.chance(0.5) } });
      }
      for (let sp = 0; sp < 6; sp++) {
        const mesh = hero.makeCopies(hero.sculptGeometry(sp, { lod: 0.8, poleBase: 2.0, poleTop: HANG, crank: false }), per[sp].map((q) => q.item), 'conveyor-' + sp);
        mesh.userData.extent = hero.extentOf(mesh.geometry);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
        per[sp].forEach((q, i) => conv.push({ mesh, i, loop: q.loop, s0: q.s0, ph: q.ph }));
        await ctx.yield();
      }
    }
    // the law of the place: every standing copy's whole body (its reach round its pole, from its feet to its top) keeps 2.0 m from the
    // flown line, and so does every hung animal on the aisle runs with its sway. Kept as a check: it warns, it changes nothing.
    { let least = Infinity;
      for (const [x, y0, y1, z, reach] of standing) for (let y = y0; y <= y1 + 0.01; y += 0.5) least = Math.min(least, path.distanceTo(x, y, z) - reach);
      if (least < 2.0) console.warn('carousel-works: a copy stands too near the path', least);
      { let dk = Infinity; const pp = new THREE.Vector3();                                // the deck's work at row three turns with the wheel: each body is a ring (radius, top) over a whole turn
        for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, pp); const R = Math.hypot(pp.x, pp.z); for (const [r, top] of hero.deckBodies) dk = Math.min(dk, Math.hypot(Math.max(0, R - r), pp.y - top)); }
        report.push('the deck\'s work at row three, over the whole turn: least distance to the flown line ' + dk.toFixed(2) + ' m (the design\'s reach: 6.35)');
        if (dk < 6.35) console.warn('carousel-works: deck work inside the design\'s reach', dk); }
      report.push('standing copies (trolleys, racks, bench work): least clear air to the flown line ' + least.toFixed(2) + ' m');
      if (hung) { let d = Infinity; const pp = new THREE.Vector3(); for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, pp); d = Math.min(d, Math.hypot(Math.max(0, Math.abs(pp.z - HOIST.z) - 1.6), hung.low - 0.15 - pp.y)); }
        report.push('the hoisted horse (z ' + HOIST.z + ', its lowest point, the soles of its gilt shoes, y ' + hung.low.toFixed(2) + ', swinging 0.15 m at most): least distance to the flown line ' + d.toFixed(2) + ' m');
        if (d < 2.0) console.warn('carousel-works: the hoisted horse hangs too near the path', d); }
      // what this round moved out of the 9 m either side of the flown line in the arm, and what it set down by the doorway: [name, x, z, half-width]
      const MOVED = [['the carver\'s island, its near edge', -15.6, 155, 5.4], ['the great head in its vice', -14.6, 155, 4.6], ['arm trolleys (four, drawn up along the arm)', 18.6, 141, 2.2], ['the glued blank on its trestles', -16, 97, 3.2], ['its bench of gouges', -13.1, 102.5, 3.2],
        ['boards on stickers, bay 5', -18.5, 181, 2.4], ['basket, bay 4', 17.4, 166.2, 1.8], ['the trolley waiting on the rails before the arm\'s mouth', 5.5, 64, 2.4], ['timber on trestles, east floor', 48.5, 36.5, 3.5],
        ['road trolleys before the paint shop', -47, -17.5, 3], ['the gilder\'s bench', -90, -19, 2], ['the painter\'s bench', -117, -63, 2],
        ...PROC.map(([x, dz]) => ['finished animal on its trolley', x, -41 - dz, 2.2 * PROC_K]), ['the doorway\'s third order (jamb)', -179, -55.75, 0.75], ['end wall pilaster', -175.4, -59.3, 1.3], ['kettle stove, despatch end', -138, -56.25, 2.6]];
      report.push('set down or moved this round, plan distance from the flown line to its near edge: ' + MOVED.map(([n, x, z, hw]) => n + ' ' + (path.nearestXZ(x, z).dist - hw).toFixed(1) + ' m').join('; '));
      { // the passages the route goes through: clear air from the flown line to each member, and how far off the nearest member is while it
        // is still inside the picture (it leaves a level frame of 62 degrees at the frame's half-angle: 16:9 and 21:9)
        const half = (asp) => Math.sin(Math.atan(Math.tan(31 * Math.PI / 180) * asp));
        const way = (name, members) => { let d = Infinity; for (const [x, y, z, r] of members) d = Math.min(d, path.distanceTo(x, y, z) - r);
          report.push(name + ': ' + d.toFixed(1) + ' m of clear air from the line to its nearest member, which is ' + (d / half(16 / 9)).toFixed(1) + ' m off as it leaves the 16:9 picture (21:9: ' + (d / half(21 / 9)).toFixed(1) + ' m)');
          if (d < 2.0) console.warn('carousel-works: a passage is too narrow', name, d); };
        way('the arm\'s mouth (cast piers at x -35 and 35, z 75; plinths 5 m square, lintel underside y 31.2)', [[-35, 1.2, 75, 3.54], [35, 1.2, 75, 3.54], [-35, 10.5, 75, 1.56], [35, 10.5, 75, 1.56], [18, 31.2, 75, 0]]);
        way('the paint shop\'s mouth (cast piers at z -11 and -71, x -75; the fascia\'s foot y 25.4)', [[-75, 1.2, -11, 3.54], [-75, 1.2, -71, 3.54], [-75, 12, -11, 1.56], [-75, 12, -71, 1.56], [-74.2, 25.4, -41, 0]]);
        const hoop = []; for (let k = 0; k < 16; k++) hoop.push([-172.55, 12 + 8.7 * Math.cos(k / 16 * TAU), -41 + 8.7 * Math.sin(k / 16 * TAU), 0]);
        way('the freight doorway (the hoop\'s inner edge, radius 8.7 round the portal of radius 7)', hoop); }
      { // A CLOSE THING IS WHOLE OR ABSENT, counted over everything that stands on the boards (each thing's own rectangle of the plan, the one
        // its contact shade is drawn from): how many have any part within 9 m of the flown line in plan. Floor dress (drop cloths, rails,
        // plates, chalk, paint) is not in the list. Print-only: it changes nothing.
        let n = 0, least = Infinity; const near = [];
        for (const o of occ) { let d = Infinity; for (let a = 0; a <= 2; a++) for (let b = 0; b <= 2; b++) d = Math.min(d, path.nearestXZ(o[0] + (o[2] - o[0]) * a / 2, o[1] + (o[3] - o[1]) * b / 2).dist);
          least = Math.min(least, d); if (d < CLOSE) { n++; near.push('(' + ((o[0] + o[2]) / 2).toFixed(0) + ', ' + ((o[1] + o[3]) / 2).toFixed(0) + ') ' + d.toFixed(1) + ' m'); } }
        report.push('a close thing is whole or absent: of ' + occ.length + ' things standing on the boards, ' + n + ' have a part within ' + CLOSE + ' m of the flown line in plan' + (n ? ': ' + near.join('; ') : '') + '; the nearest stands ' + least.toFixed(1) + ' m off'); }
      await ctx.yield(); }
    const cM = new THREE.Matrix4(), cT = new THREE.Matrix4();
    const convMeshes = [...new Set(conv.map((c) => c.mesh))];
    // FLUE CHECK and the aisle's clear air, counted for the widest species at any heading (its whole reach round its pole) with the sway of its
    // hook (HANG x sin 0.085 = 0.91 m): a flue of radius 0.3 stands R_END from either rail (the cranked one west of the loops, 7.85 m from the nearer loop's end); the aisle runs lie |aisle + 41| from the flown line.
    { let reach = 0, low = Infinity; for (const m of convMeshes) { reach = Math.max(reach, m.userData.extent.reach); low = Math.min(low, RAIL_Y - HANG + m.userData.extent.foot); }
      const sway = HANG * Math.sin(0.085), flue = Math.min(R_END, X_W + 142.6 - R_END) - reach - sway - 0.3, air = Math.min(...LOOPS.map((lp) => Math.abs(lp.aisle + 41))) - reach - sway;
      report.push('hung animals: widest reach ' + reach.toFixed(2) + ' m, sway ' + sway.toFixed(2) + ' m, lowest point y ' + low.toFixed(2) + '; least gap to a flue ' + flue.toFixed(2) + ' m (every stove, every species, every clock); least clear air to the flown line ' + air.toFixed(2) + ' m');
      if (flue < 0.3 || air < 2.0) console.warn('carousel-works: a hung animal comes too near a flue or the path', flue, air); }
    // where a hook is on its loop at distance s: the aisle run east, round the east end, the back run west, round the west end
    const moveConveyor = (t) => {
      for (const c of conv) {
        const lp = LOOPS[c.loop], zc = (lp.aisle + lp.back) / 2, dir = Math.sign(lp.back - lp.aisle);
        let s = (c.s0 + 1.5 * t) % LOOP_LEN, x, z, h;
        if (s < RUN) { x = X_W + s; z = lp.aisle; h = 0; }
        else if (s < RUN + Math.PI * R_END) { const a = (s - RUN) / R_END; x = X_E + Math.sin(a) * R_END; z = zc - dir * Math.cos(a) * R_END; h = -dir * a; }
        else if (s < 2 * RUN + Math.PI * R_END) { x = X_E - (s - RUN - Math.PI * R_END); z = lp.back; h = Math.PI; }
        else { const a = (s - 2 * RUN - Math.PI * R_END) / R_END; x = X_W - Math.sin(a) * R_END; z = zc + dir * Math.cos(a) * R_END; h = Math.PI - dir * a; }
        const sway = 0.085 * Math.sin(t * 0.9 + c.ph), turn = 0.45 * Math.sin(t * 0.37 + c.ph * 1.7);
        cM.makeTranslation(x, RAIL_Y, z).multiply(cT.makeRotationY(h + turn)).multiply(cT.makeRotationX(sway)).multiply(cT.makeTranslation(0, -HANG, 0));
        c.mesh.setMatrixAt(c.i, cM);
      }
      for (const m of convMeshes) m.instanceMatrix.needsUpdate = true;
    };
    moveConveyor(0);
    await ctx.yield();

    // ---- belts off the line shaft and the conveyor chains: strips whose pattern slides ---------------------------------
    {
      const belt = (cx, cy, z, r, bx, by, br, speed) => {
        const dx = bx - cx, dy = by - cy, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
        for (const s of [-1, 1]) strips.push({ a: [cx + nx * r * s, cy + ny * r * s, z], b: [bx + nx * br * s, by + ny * br * s, z], w: [0, 0, 0.45], speed: speed * s, style: 0 });
      };
      belt(-31, 22, 116, 2.2, -27, 7.2, 1.0, 5.3); belt(-31, 22, 176.3, 2.2, -27, 4.6, 1.2, 5.3);
      belt(-31, 22, 134, 1.5, -27.4, 2.4, 0.9, 5.3); belt(-31, 22, 150, 2.4, -27, 4.5, 1.0, 5.3);
      for (const [x, sp] of [[-25.7, -7], [-29.1, 7]]) strips.push({ a: [x, 2.4, 132.9], b: [x, 7.3, 132.9], w: [0, 0, 0.16], speed: sp, style: 2 });   // the saw's band
      const P = [], UV = [], A = [];
      for (const s of strips) {
        const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]), w = s.w;
        const c = [[s.a, -1, 0], [s.a, 1, 0], [s.b, 1, len], [s.a, -1, 0], [s.b, 1, len], [s.b, -1, len]];
        for (const [p, k, v] of c) { P.push(p[0] + w[0] * k, p[1] + w[1] * k, p[2] + w[2] * k); UV.push(k * 0.5 + 0.5, v); A.push(s.speed, s.style); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aBelt', new THREE.Float32BufferAttribute(A, 2));
      const mat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, fog: false,
        uniforms: { uTime: time, uLight: { value: new THREE.Color(L.hemiSky).multiplyScalar(0.25 * L.hemiK) }, uFogCol: { value: new THREE.Color(L.fog) }, uFogD: { value: L.fogD } },
        vertexShader: `attribute vec2 aBelt; varying vec2 vUv; varying vec2 vBelt; varying vec3 vWp;
          void main() { vUv = uv; vBelt = aBelt; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: `varying vec2 vUv; varying vec2 vBelt; varying vec3 vWp; uniform float uTime, uFogD; uniform vec3 uLight, uFogCol;
          void main() {
            float v = vUv.y - uTime * vBelt.x; vec3 c;
            if (vBelt.y < 0.5) {                                                           // a leather belt: laced joints, and the wear between them
              float join = 1. - smoothstep(0.1, 0.2, abs(fract(v / 6.5) - 0.5) * 6.5 - 0.05), wear = smoothstep(0.35, 0.5, abs(fract(v / 2.6 + 0.3) - 0.5));
              c = mix(mix(vec3(0.2, 0.125, 0.07), vec3(0.34, 0.23, 0.13), wear), vec3(0.62, 0.5, 0.32), join) * (0.7 + 0.3 * sin(vUv.x * 3.14159));
            } else if (vBelt.y > 1.5) {                                                    // the saw's band: bright steel, a weld coming round
              c = mix(vec3(0.5, 0.55, 0.6), vec3(1.1, 1.15, 1.2), smoothstep(0.42, 0.5, abs(fract(v / 2.2) - 0.5)));
            } else {
              float f = fwidth(vUv.y / 0.45), link = smoothstep(0.3, 0.3 + f + 1e-5, abs(fract(v / 0.45) - 0.5) * 2.);
              c = mix(vec3(0.07, 0.08, 0.09), vec3(0.2, 0.22, 0.25), mix(link, 0.5, clamp(f * 1.5, 0., 1.)));
            }
            float fogK = 1. - exp(-uFogD * uFogD * dot(vWp - cameraPosition, vWp - cameraPosition));
            gl_FragColor = vec4(mix(c * uLight, uFogCol, fogK), 1.);
          }`,
      });
      const m = new THREE.Mesh(g, mat); m.name = 'belts'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- 6 air: shafts of north light, sawdust motes, falling shavings, gold leaf, steam, sparrows, mantles, gulls ------
    const set = fx.fxGroup(); scene.add(set.object);
    // north shafts on the shared lattice. One rule for every shaft in every room: its foot lies on a floor of the hall, and its axis keeps
    // its widest half width and 2.0 m more from the flown line along its whole length. Nothing else chooses them.
    const SHAFT_W = [4.0, 6.6], shaftItems = [], rayC = new THREE.Color(L.rays);
    const onFloor = (x, z) => (Math.abs(x) < 66 && Math.abs(z) < 66) || (Math.abs(x) < 30 && z >= 66 && z < 200) || (x > -168 && x <= -66 && z > -66 && z < -16);
    const axisClear = (a, b) => { let least = Infinity; for (let i = 0; i <= 40; i++) { const t = i / 40; least = Math.min(least, path.distanceTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)); } return least; };
    for (let j = 0; j <= 10; j++) {
      for (let k = -7; k <= 3; k++) {
        const a = shaftLattice(j, k, 40), b = shaftLattice(j, k, 0.6);
        if (!onFloor(b[0], b[2]) || axisClear(a, b) < SHAFT_W[1] + 2.0) continue;
        // by day the shafts that stand between the arm and the wheel (feet south of the mast, inside the ring's width) are thinned, the arm's own a little less:
        // a rule of where a shaft's foot lies, so the wheel is seen through clear air from the whole length of the arm
        const thin = evening ? 1 : 1 - sstep(14, 44, b[2]) * (1 - sstep(40, 56, Math.abs(b[0]))) * (0.74 - 0.24 * sstep(96, 112, b[2]));
        shaftItems.push({ a, b, w0: SHAFT_W[0], w1: SHAFT_W[1], gain: shaftGain(j, k) * L.raysK * thin, seed: hash1(j * 13 + k * 7 + 2), col: [rayC.r, rayC.g, rayC.b] });
      }
      await ctx.yield();
    }
    // noon: the sea's light stands in the door's air, in broad low shafts that fan from the opening toward the wheel (the same rule of the
    // axis's distance from the line; their feet are where the floor's white band lies)
    if (noon) for (let k = 0; k < 5; k++) {
      const z0 = 33 + k * 6.5, a = [74.5, 13.5 + (k % 2) * 3, z0], b = [38 + (k % 2) * 7, 0.6, 46 + (z0 - 46) * 1.9 - 9];
      if (axisClear(a, b) < 5.4 + 2.0) continue;
      shaftItems.push({ a, b, w0: 3.6, w1: 5.4, gain: 0.2 + 0.05 * (k % 3), seed: hash1(k * 5 + 91), col: [1.0, 0.95, 0.84] });
    }
    // LIT AIR UNDER THE LAMPS: a soft cone of lamplight with slow motes in it under every pendant whose cone, at its widest, keeps 3.0 m from
    // the flown line along its whole height (so none over the aisle the line flies down, none it passes through). Additive, no depth written.
    let coneLeast = Infinity, coneN = 0; const lampAirItems = [];
    for (const p of pendants) { const k = p[3] ?? 1, w1 = (p[2] > ARM_Z ? 4.0 : 3.6) * Math.sqrt(k), a = [p[0], p[1] - 0.8, p[2]], b = [p[0], 0.5, p[2]], d = axisClear(a, b) - w1;
      if (d < 3.0) continue;
      const white = p[0] < -78 && p[0] > -136; coneLeast = Math.min(coneLeast, d); coneN++;
      lampAirItems.push({ a, b, w0: 0.5, w1, gain: (evening ? 0.085 : 0.035) * (0.5 + 0.5 * k), seed: hash1(p[0] * 0.37 + p[2] * 0.11 + 5), col: white ? [1.0, 0.9, 0.72] : [1.0, 0.62, 0.28] }); }
    report.push('lit air under the lamps: ' + coneN + ' of ' + pendants.length + ' pendants carry a cone; the nearest cone edge to the flown line is ' + coneLeast.toFixed(1) + ' m off (rule: 3.0 m)');
    const shafts = makeShafts(shaftItems, time); scene.add(shafts); shafts.userData.items = shaftItems;
    const lampAir = makeShafts(lampAirItems, time); lampAir.name = 'lamp-air'; scene.add(lampAir);          // (a mesh of their own: they go out with the lamps in the rare failure)
    await ctx.yield();
    // THE WHEEL'S OWN LIT AIR, in the wheel's frame (it turns with the lit quarter): under each gilded sweep two soft cones of gold from its
    // row of bulbs down to the deck (at radius 16 and 28: their edges reach radius 33 at most, 8 m inside the flown arc of radius 41), and
    // over the quarter's rounding boards tall columns of gold rising from the bulbs to the trusses (y 21.6 to 31: 12 m above the line)
    const wheelAirItems = [], QA = -Math.PI / 2;
    for (let k = 0; k < 4; k++) { const a = QA + (k + 0.02) * TAU / 16 + 0.0; const c = Math.cos(a + 0.004), s = Math.sin(a + 0.004);
      for (const [r, w] of [[16, 3.6], [28, 4.6]]) wheelAirItems.push({ a: [r * c, 18.2, r * s], b: [r * c, 4.4, r * s], w0: 0.8, w1: w, gain: 0.13, seed: hash1(k * 3.7 + r), col: [1.0, 0.6, 0.22] }); }   // (thin: the painted animals under them stay readable from close by)
    for (let k = 0; k < 7; k++) { const a = QA + (0.06 + 0.88 * k / 6) * 80 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      wheelAirItems.push({ a: [43.2 * c, 21.6, 43.2 * s], b: [41 * c, 31, 41 * s], w0: 1.6, w1: 4.4, gain: 0.2, seed: hash1(k * 5.3 + 2), col: [1.0, 0.58, 0.2] }); }
    const wheelAir = makeShafts(wheelAirItems, time); wheelAir.name = 'wheel-air'; hero.wheel.add(wheelAir);
    report.push('the wheel\'s lit air: deck cones reach radius 32.6 and y 18.2 at most (the flown arc: radius 41, y 9.5: 8.4 m clear); rim columns stand y 21.6 and up (12.1 m above the line)');
    await ctx.yield();
    // dust motes, large enough to be seen in the lamps: six boxes that stand still, each wholly to one side of the flown line and 5 m and more
    // from it (over the wheel inside the arc; the bay's south-west floor; either side of the arm; either side of the paint shop's aisle)
    const MOTES = [[[0, 15, 0], [50, 22, 50], 520], [[-40, 14, 40], [50, 22, 50], 300], [[-18, 12, 140], [22, 20, 110], 420], [[22, 12, 160], [14, 20, 70], 200], [[-120, 14, -60], [90, 20, 16], 220], [[-120, 14, -22], [90, 20, 16], 220]];
    { let d = Infinity; const pp = new THREE.Vector3();
      for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, pp); for (const [c, b] of MOTES) d = Math.min(d, Math.hypot(Math.max(0, Math.abs(pp.x - c[0]) - b[0] / 2), Math.max(0, Math.abs(pp.y - c[1]) - b[1] / 2), Math.max(0, Math.abs(pp.z - c[2]) - b[2] / 2))); }
      report.push('dust motes: ' + MOTES.length + ' fixed boxes, the nearest ' + d.toFixed(1) + ' m from the flown line'); if (d < 3.0) console.warn('carousel-works: a mote box is too near the path', d); }
    for (const [center, box, n] of MOTES) {
      set.add(fx.makeParticles({ rng: rng.fork('motes' + center[0] + center[2]), time, preset: 'dust', follow: false, center, box, count: Math.round(n * detail * density), size: [0.12, 0.3],
        colors: evening ? ['#ffcf90', '#ffb870', '#ffe2b8'] : ['#f4ead2', '#dfeaf2', '#fff6e0'], intensity: evening ? 0.75 : 0.5, velocity: [0.25, -0.1, 0.35], turbulence: [0.7, 0.4, 0.2] }));
      await ctx.yield();
    }
    // gold leaf drifts off the gilder's bench, a few small flakes no brighter than the bench's lamp shade: its box is fixed where the bench stands.
    // SHAVINGS FALL at the carver's island and nowhere else: a few curls the colour of the wood, no brighter than the bench they fall to, in a
    // box fixed over the great head (x -18.5 to -12.5: 12.5 m and more from the flown line). Everywhere else they lie where they were cut.
    const FALLS = [[[-15.5, 7.2, 155], [6, 6, 10]]], LEAF = [[-92.5, 6.0, -19.2], [5, 4.0, 3]];
    await ctx.yield();
    const leafR = rng.fork('leaf');
    set.add(fx.makeParticles({ rng: leafR, time, preset: 'petals', follow: false, center: LEAF[0], box: LEAF[1], count: Math.round(6 * detail * density), size: [0.3, 0.5],
      colors: ['#d99a30', '#c08a2a', '#d8a848'], velocity: [0.45, -0.22, -0.12], turbulence: [0.8, 0.35, 0.35], intensity: 0.45 }));
    await ctx.yield();
    // (their stream is forked from the leaf's own, after the leaf is made: the world's stream deals everything after exactly as before)
    set.add(fx.makeParticles({ rng: leafR.fork('falls'), time, preset: 'petals', follow: false, center: FALLS[0][0], box: FALLS[0][1], count: Math.round(9 * detail * density), size: [0.32, 0.55],
      colors: ['#a8834c', '#93723f', '#b8945a'], velocity: [0.12, -0.75, 0.08], turbulence: [0.5, 0.2, 0.4], intensity: 0.5 }));
    await ctx.yield();
    // steam: thin vapour that is gone a few metres above its pot
    for (const s of steamAt) {
      set.add(fx.makeSmokeColumn({ rng: rng.fork('steam' + s[0] + s[2]), time, position: [s[0], s[1], s[2]], height: s[3], radius: [0.3, 1.9 * s[4]], size: [0.7, 2.8 * s[4]], count: 30,
        color: evening ? '#c9a880' : '#dfe6ea', colorTop: evening ? '#8f93b0' : '#f4f7f8', shadowColor: evening ? '#4a4258' : '#8f9aa4', ambient: evening ? '#2a2a3c' : '#6a747c', opacity: 0.26, rate: 0.16, wind: [0.2, 0, 0.25], bend: 0.25 }));
      await ctx.yield();
    }
    const birdLight = { sunDir: [0, 0.8, -0.6], sunColor: L.keyCol, sunIntensity: L.keyK * 1.2, sky: L.hemiSky, skyIntensity: L.hemiK, ground: '#6a5a48', groundIntensity: 0.7 };
    // sparrows at the hall's scale (stubby, broad-winged), in loose parties. One circles above the wheel's canopy
    // under the trusses; one beats up and down the west side of the wheel bay, between the west wall and the west girder. Each party is
    // handed its wander and its widest scatter (maxSigma 3), so its whole reach is known WHERE THE KIT KEEPS maxSigma: route, wander box,
    // scatter, wing (4.21 m to the side, 2.50 m up and down). Measured against every triangle of the hall, the least clearance of that
    // reach is: party a 2.29 m to the side (the west girder's flange) and 1.23 m above (the truss chords); party b 3.67 m to the side
    // (the rod of the pendant at 165 degrees) and 1.22 m above (the truss chords); 7.3 m from the west girder and 6.8 m from the west wall.
    // A KIT THAT IGNORES maxSigma (the crew's older test kit does) scatters them wider: a reader's count there is 5.01 m to the side
    // and 3.30 m up and down at three sigma (6.65 and 3.95 at the stream's limit), which leaves party a 1.49 m from the girder and
    // 0.43 m from the truss chords, and 16.9 m from the flown line with its whole reach (15.5 m at the limit).
    // By day they are dark against the bright glass; in the evening the gas light catches their pale bellies against the blue.
    const loop = (cx, cy, cz, rx, rz, n = 14, bob = 0.4) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU * 2) * bob, cz + Math.sin(i / n * TAU) * rz]);
    const sparrowLook = { species: 'crows', form: 'loose', size: 3.4, speed: 12, spread: [1.0, 0.4, 40], wander: [0.8, 0.3, 0.8, 0.6], maxSigma: 3, flap: 6.2, amp: 0.75, glide: 0.18,
      body: evening ? '#8a7254' : '#4a3422', belly: evening ? '#e6d6b8' : '#8a7558', wingC: evening ? '#6e5a44' : '#33251a', tip: '#1e1610', head: evening ? '#6a543c' : '#3a281a',
      light: evening ? { sunDir: [0, -0.9, 0.3], sunColor: '#ffd9ac', sunIntensity: 1.5, sky: L.hemiSky, skyIntensity: 0.6, ground: '#f0c090', groundIntensity: 1.0 }
        : { ...birdLight, skyIntensity: L.hemiK * 0.4, sunIntensity: L.keyK * 0.4 } };
    const routes = [loop(0, 28.4, 0, 30, 30, 18, 0.3), loop(-57, 28.4, 40, 7, 20, 14, 0.3)];
    const flocks = [F.makeFlock({ rng: rng.fork('sparrows-a'), ...sparrowLook, count: 12, route: routes[0], closed: true })];
    await ctx.yield();
    flocks.push(F.makeFlock({ rng: rng.fork('sparrows-b'), ...sparrowLook, count: 10, route: routes[1], closed: true, start: 0.4 }));
    await ctx.yield();
    // noon: gulls wheel just outside the open east doors, large and grey-white against the sea glare
    const gullR = rng.fork('gulls');                                                 // forked in every look, so what follows draws the same
    if (noon) { routes.push(loop(106, 13, 30, 12, 30, 16, 3));
      flocks.push(F.makeFlock({ rng: gullR, species: 'gulls', form: 'loose', count: 14, size: 4, route: routes[2], closed: true, speed: 9, spread: [2, 1.2, 45], wander: [1.2, 0.8, 1.2, 0.35], maxSigma: 3,
        light: { ...birdLight, sky: '#dfe6ea', skyIntensity: 0.8, sunIntensity: 0.7 } })); }
    for (const f of flocks) scene.add(f.object);
    { // the count part by part (print-only): every mesh of the scene, instances counted
      const by = { hall: 0, 'carving shop': 0, 'wheel bay': 0, 'paint shop': 0, wheel: 0, 'copies (racks, trolleys, conveyors, bench work)': 0, air: 0 }; let all = 0;
      scene.traverse((o) => { if (!o.isMesh && !o.isPoints) return; const g = o.geometry; if (!g || !g.attributes.position) return;
        const n = Math.round((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : (g.isInstancedBufferGeometry ? Math.min(g.instanceCount, 1e6) : 1)), nm = o.name || '';
        const k = /^(hall-shell|floors|glass)$/.test(nm) ? 'hall' : /^(carving-shop|line-shaft|lathe-piece|grindstone|saw-|sander|mallet)/.test(nm) ? 'carving shop' : nm === 'wheel-bay' ? 'wheel bay' : /^(paint-shop|gilders-bench|painters-bench|belts)$/.test(nm) ? 'paint shop'
          : /^(spare|trolley|blank|parts|head|conveyor)-/.test(nm) ? 'copies (racks, trolleys, conveyors, bench work)' : (o.parent === scene || o.parent === set.object || !nm) && !/^(station|structure|cartouches|cat|flywheel|belt|engine)/.test(nm) ? 'air' : 'wheel';
        by[k] += n; all += n; });
      report.push('triangles of this deal: ' + all + ' (bound 440000): ' + Object.entries(by).map(([k, v]) => k + ' ' + v).join(', ')); }
    scene.userData.report = report; scene.userData.routes = routes; scene.userData.deal = { look: lookName, scheme: schemeId, cast: castId, phase0 }; scene.userData.wheel = { stations: hero.stations, period: hero.state.period };
    scene.userData.boxes = { motes: MOTES, falls: FALLS, leaf: LEAF }; scene.userData.standing = standing; scene.userData.tiers = [0.4, 7.0, 13.6, 20.2, 26.8];
    // the mantles' glow at every pendant and bracket lamp: they burn in every look, low by day
    const MANTLE = 1.5 * (0.35 + 0.65 * L.gas);
    const lampPts = [...pendants.map((p) => [p[0], p[1] - 0.3, p[2]]), ...brackets], ARM_K = 0.55;
    const mantleSet = (pts, name, k) => fx.makeGlows({ rng: rng.fork(name), time, positions: pts, colors: pts.map((p) => p[0] < -78 && p[0] > -136 ? '#ffdcae' : '#ffb466'), size: (evening ? 9 : 4.5) * (k < 1 ? 0.7 : 1), intensity: MANTLE * k, halo: 1, core: 0.8, flicker: 0.12, near: [0.02, 0.1] });   // (near: a mantle keeps its whole glow as the eye passes: the nearest passes 9.3 m off, and the kit's own default would thin a glow from 1.5 times its size in)
    const mantles = mantleSet(lampPts.filter((p) => p[2] <= ARM_Z), 'mantles', 1), mantlesArm = mantleSet(lampPts.filter((p) => p[2] > ARM_Z), 'mantles-arm', ARM_K);   // the arm's are smaller and lower
    set.add(mantles); set.add(mantlesArm);
    const SHED = 1.6 * (0.5 + 0.5 * L.gas), shedGlows = fx.makeGlows({ rng: rng.fork('shed-lanterns'), time, positions: shedLamps, color: '#ffa550', size: 6.5, intensity: SHED, halo: 1, core: 0.8, flicker: 0.1 });
    set.add(shedGlows);
    const GATE = 1.9 * L.bulbs;
    const gateGlows = fx.makeGlows({ rng: rng.fork('gate-bulbs'), time, positions: gateBulbs, color: [1.0, 0.56, 0.2], size: 1.9, intensity: GATE, halo: 0.6, core: 0.6, flicker: 0, minAngle: 0.006 });
    set.add(gateGlows);
    curl.dispose(); rimGeo.dispose(); ringGeo.dispose(); bevel.dispose(); dome.dispose(); stud.dispose();
    await ctx.yield();

    // ---- 8 flight ---------------------------------------------------------------------------------------------------
    // the flight's keys are places, not typed fractions: each is the fraction of the flown line nearest a thing that stands in the hall
    const s01 = (a, b, u) => sstep(a, b, u), uAt = (x, z) => path.nearestXZ(x, z).u;
    const K = {
      head: uAt(0, 163),                                    // 8 m short of the great head in the carver's vice
      island: uAt(0, 147),                                  // abreast of the gouges on the carver's island
      bend: uAt(4.5, 113.5),                                // where the line leaves the arm's axis for the tangent leg
      mouth: uAt(8, 104.5),                                 // one arm bay short of the arm's mouth: the flight begins to slow
      rim: uAt(35.5, 23.5),                                 // the tangent leg meets the arc: slowest from here
      east: uAt(41, 0),                                     // due east of the mast
      north: uAt(0, -41),                                   // due north of the mast: the arc is done, the flight quickens
      west: uAt(-43, -41),                                  // abreast of the platform's west rim
      hooks: uAt(X_W + 21, -41),                            // abreast of the conveyors' second hanger: it eases for the doorway
      kettles: uAt(-138.3, -41),                            // abreast of the last kettle
    };
    const pace = (u) => 1.15 - 0.15 * s01(K.island, K.bend, u) - 0.20 * s01(K.mouth, K.rim, u) - 0.05 * s01(K.rim, K.east, u) + 0.40 * s01(K.north, K.west, u) - 0.15 * s01(K.hooks, K.kettles, u);
    const pv = new THREE.Vector3(), arcAt = new THREE.Vector3();
    // the gaze: the wheel's crown (a point on the mast at y 15) from the entry until the tangent leg meets the arc, so the wheel stands dead ahead
    // down the whole arm and the leg; then, as the design has it, a point on the outer row (radius 32) 30 degrees round the wheel ahead of the
    // eye, weight 0.5, from where the leg meets the arc (K.rim, u 0.40) to just past due north of the mast (u 0.62), with soft ends: the outer
    // row curves away ahead under the bulbs and the nearest animal passes through the picture's left edge
    const pois = [
      { at: [0, 15, 0], from: 0, to: K.rim, weight: 0.7, fade: 0.2 },
      { at: [-10, 8, 155], from: 0, to: K.head, weight: 0.3, fade: 0.05 },                                      // and leans a little toward the carver's great head until the eye is 8 m short of it
      { at: (t, u) => { path.pointAt(Math.min(K.north + 0.015, Math.max(K.rim, u)), pv); const a = Math.atan2(pv.z, pv.x) - Math.PI / 6; return arcAt.set(Math.cos(a) * 32, 7.5, Math.sin(a) * 32); }, from: K.rim, to: K.north + 0.015, weight: 0.5, fade: 0.2 },
    ];
    // the rare bulb failure takes every warm light in the hall with it: gas glow, mantles and lamp shades fall with the bulbs and
    // come back with their one wave, and the hemisphere goes cold meanwhile (uniforms and intensities only)
    const gold0 = U.uGoldC.value.clone(), end0 = U.uEndCol.value.clone(), gas0 = U.uGasCol.value.clone(), paint0 = U.uPaintCol.value.clone(), hemiG0 = hemi.groundColor.clone(), hemiS0 = hemi.color.clone(), coldG = new THREE.Color('#3a4252'), coldS = new THREE.Color('#93a0bd');
    const portal = { shape: 'circle', radius: 7, color: new THREE.Color(1.75, 0.98, 0.36), glow: 1.25, revealDistance: 260 };   // lamp gold, the brightest thing in the dim despatch end

    return {
      scene, path, duration: 42, pace, pois, portal,
      camera: { fov: 62, near: 0.3, far: 900, bank: 0.4 },
      ride: 'none', style: 'none',
      post: { exposure: L.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 1.0 }, grade: L.grade },
      update(dt, t, camera, u) {
        time.value = t;
        if (rare) hero.setProgress(Math.min(1, Math.max(0, (u - 0.47) / 0.09)));
        hero.update(dt, t, camera);
        { const a = hero.state.angle - 0.8727, hb = hero.state.bulbs; U.uGild.value.set(Math.cos(a), Math.sin(a), L.sweep * hb);   // the lit quarter's middle, 40 degrees on from the seam
          U.uGoldP.value.set(Math.cos(a) * 37, 17, Math.sin(a) * 37); U.uGoldA.value = a; U.uGoldC.value.copy(gold0).multiplyScalar(hb);
          for (let k = 0; k < 4; k++) { const ak = a + (k - 1.5) * 0.349, s = slBase[k]; U.uSLp.value[k].set(Math.cos(ak) * 41, 19, Math.sin(ak) * 41, -3); U.uSLc.value[k].set(s[0] * hb, s[1] * hb, s[2] * hb, 1); } }
        if (rare) {
          const b = hero.state.bulbs, w = b * b * (3 - 2 * b);
          lampAir.material.uniforms.uGain.value = w;
          for (let i = 4; i < SLN; i++) { if (i === 5) continue; const s = slBase[i], c = U.uSLc.value[i]; c.x = s[0] * w; c.y = s[1] * w; c.z = s[2] * w; }   // the floor's mirrored lamps go with them (the portal's stays)
          U.uGasCol.value.copy(gas0).multiplyScalar(0.03 + 0.97 * w); U.uPaintCol.value.copy(paint0).multiplyScalar(0.03 + 0.97 * w); U.uEndCol.value.copy(end0).multiplyScalar(0.03 + 0.97 * w); U.uGlow.value = 0.04 + 0.96 * w;
          hero.uniforms.uGas.value.copy(gasWheel0).multiplyScalar(0.03 + 0.97 * w); hero.uniforms.uPlank.value.copy(plankCold).lerp(plank0, w);
          if (evening) hero.uniforms.uRoof.value.copy(roof0).multiplyScalar(0.3 + 0.7 * w);
          shedGlows.uniforms.uIntensity.value = SHED * w; mantles.uniforms.uIntensity.value = MANTLE * w; mantlesArm.uniforms.uIntensity.value = MANTLE * ARM_K * w; gateGlows.uniforms.uIntensity.value = GATE * w;
          hemi.groundColor.copy(coldG).lerp(hemiG0, w); hemi.color.copy(coldS).lerp(hemiS0, w); hemi.intensity = L.hemiK * (1.25 - 0.25 * w);
        }
        wheelAir.material.uniforms.uGain.value = hero.state.bulbs * L.bulbs * (evening ? 1 : 0.75);
        for (const s of spinners) s.mesh.rotation.z = t * s.speed;
        mallet.rotation.z = 0.13 * Math.sin(t * 2.3) * (0.6 + 0.4 * Math.sin(t * 0.31));
        moveConveyor(t);
        if (hung) { const ha = 0.07 * Math.sin(t * 0.37), hb = 0.012 * Math.sin(t * 0.83);       // the horse on the hoist turns and swings a little on its hook, by the world's clock; its tackle with it
          cM.makeTranslation(HOIST.x, HOIST.py, HOIST.z).multiply(cT.makeRotationY(ha)).multiply(cT.makeRotationZ(hb)).multiply(cT.makeTranslation(-HOIST.x, -HOIST.py, -HOIST.z)).multiply(hung.m0);
          hung.mesh.setMatrixAt(hung.i, cM); hung.mesh.instanceMatrix.needsUpdate = true; hoistTackle.rotation.set(0, ha, hb); }
        set.update(dt, t, camera);
        for (const f of flocks) f.update(dt, t, camera, u);
      },
      dispose() { lmTex.dispose(); },                     // the floor's plan: held by the hall's patched material where the scene's own sweep cannot reach it
    };
  },
};
