// Hero set piece for "Carousel Works" (world id carousel-works): THE WHEEL.
//
// WHAT IT IS
//   A three-row carousel built four times life, 86 m across its platform and 27 m to its mast head, turning under
//   test while only half built. Its making runs round it in order, against the turn, from the seam: bare iron cranks
//   and poles over empty planks (40 deg), animals as glued-up blanks, each a band-sawn outline in boards with glue
//   lines and clamps (45), rough carving in gouge flutes (50), sanded limewood (45), flat warm-white primer (40), full paint (60),
//   and the gilded quarter (80): gold leaf, bevelled mirrors and rows of warm bulbs under gilt rounding boards.
//   The seam sets gilt beside bare iron.
//
// COORDINATES (the brief's own: add hero.object at the origin, unrotated, unscaled)
//   x east, y up, z south; floor y 0; wheel centre (0,0,0). hero.object holds two children:
//   hero.wheel   the turning group. update() sets wheel.rotation.y from the clock: one turn in `period` seconds,
//                clockwise from above, starting from opts.phase0 (the world deals it; 0 puts the seam due north).
//   hero.fixed   what stands still: mast foot, the belt engine with flywheel and belt inside the housing.
//   Platform top y 3.2, radius 9 to 43. Sixty stations: radius 16 (14 of them), 24 (20), 32 (26): 51 animals, 4
//   chariots, 5 bare poles. An animal is at most 7.2 m long and 1.5 m either side of its pole; it rides a crank of
//   1.2 m throw (five strokes a turn) and swings about 0.4 m fore and aft with the pole. REACH: below y 16 nothing
//   that turns is beyond radius 34.6 (the platform's rim, radius 43.5 up to y 3.5, excepted); the cranks turn
//   between y 15.4 and 18.4, under the sweeps (y 19; the lowest thing on them is at y 18.5); rounding boards
//   radius 43 to 43.7, y 17 to 21.4 (crests); the hanger straps at the sweeps' ends reach down to y 16.85 at radius 43.3 to 43.5.
//
// PARTS
//   stations   up to twenty InstancedMeshes (six species at two thirds of their sides for the two inner rows, the bare
//              pole, the chariot, six blanks, and the six species again at a finer level, with rounder smooth-shaded
//              forms, for row three, the outer row) sharing ONE patched MeshStandardMaterial. Every stage has a darker
//              under-shade and a rim, and every form is smooth-shaded. Unpainted wood is pale even limewood with a fine long
//              grain that follows each form (aGr: length along the limb or body, and round it), darker in the hollows, and
//              the grain melts away where it is too fine for the picture. The stages are told by the work on them: rough
//              work carries rows of shallow gouge flutes running along the form and a pencilled centre line; sanded work
//              is clean satin wood; the primed stage is a flat warm white with the first colour laid in on saddle and
//              trappings. POSES: every animal's legs and head take one of several poses from its own instance number
//              (aPo weights; legs gathered or stretched, head raised, lowered or turned), so no two neighbours of a
//              species stand alike. TRAPPINGS: each painted animal picks its own saddle-cloth colour, strap colour and
//              cloth pattern (lined, barred, lozenged, spotted) from the scheme's colours by the same number.
//              Each body carries its coat as carved relief by species (fleece in curls, feathers and scales in
//              overlapping rows from sanded on; strokes of hair from primed on), fading where it is too fine for the picture; a blank's
//              broad faces show plank seams, dowels and the pencilled outline; the finer models have knees, hocks and
//              fetlocks, a cheek, a brow over each eye, a jaw, dark nostrils and mouth line, the point of the shoulder,
//              and a breeching strap with gilt bosses; there the long forms of body and neck are cut finer along and round,
//              a feather, an ear or a leaf of ivy is a rounded blade (never a flat lozenge), a heron's wing carries its
//              feather rows as relief and each saddle cloth has a dark piping inside its gilt binding.
//              Pole and crank are part of each geometry. The vertex shader does the
//              rise and fall, the pole's swing and the crank's rotation from the wheel angle; the stage (blank,
//              rough, sanded, primed, painted, gilded) picks colour, tooling and gloss per instance.
//   blanks     the glued-up stage: the animal's own geometry pressed flat across by the shader into three 0.3 m boards
//              band-sawn to its side outline (legs left on the outer boards, no trappings), flat-faced: stacked pale tan deal
//              (its colour held near neutral in every look) with dark glue joints and squeeze-out between the boards,
//              staggered butt joints every 2.6 m along each, end grain on the sawn edges, dowels, the pencilled outline
//              and bar clamps, riding the same cranks.
//   chariots   four bench chariots, two in row one and two in row two (shell backs, scroll sides).
//   structure  platform planks with brass pole sockets, rim fascia, housing drum, mast, sixteen sweeps, tie rods,
//              gear rings, rounding boards as work in hand (bare frames of raw honey deal, boards going on, a painted half and a
//              primed half with the ornament pounced on it, and gilt panels with mirrors, shell crests and sunbursts
//              over the gilded quarter).
//   streamers  a staff at every sweep's end (radius 43.1, y 20.9 to 26.8) with a 7.6 m pennant, 2.7 m deep at the staff, that
//              streams back against the turn and ripples in the shader (aGloss 5 to 5.9): scheme colours over the painted
//              and gilded sectors, pale canvas elsewhere. Part of 'structure'.
//   crown      the mast above the hub and its head are painted pale, the tie rods are stout and pale, a hoop joins the
//              outer rods at radius 21 and a cap of plain canvas is laced from the mast head to the hoop wherever the
//              striped top has not been fitted: with the pennants, the highest and palest things on the wheel.
//   bulbs      warm bulbs on the gilded quarter only (rounding boards, sweeps, housing; none at the platform's foot; fewer on
//              small machines), drawn by the kit's glows in eight bands named 'bulbs' (hero.bulbBands, hero.bulbCount). Steady: no chase.
//   rim        the platform's kerb is the scheme's deep colour over the painted and gilded sectors (bare oak elsewhere) with ONE
//              thin line of gold paint under it there; the three ring rails let into the deck are dark iron lines all the
//              way round; the fascia below is raw deal, primer or the scheme's first colour by sector.
//   housing    the centre's drum is panelled sector by sector: raw boards on two battens, or (primed and painted sectors) a
//              framed scenery panel with a moulding and one device in relief, a different one panel by panel: sun, fan,
//              wreath, shell. Nothing on the wheel is lettered.
//   canopy     striped canvas gores laced on over the gilded quarter only, each stripe with a soft edge (part of 'structure').
//   deck work  few, large and whole, and all of it in the ONE lane between rows one and two, behind two rows of animals from
//              anywhere outside the wheel: for every OTHER station of row three from the rough stage on, by the stage of
//              its sector, one made thing some 5 m long stands there (its middle at radius 19.4): rough work a pair of trestles with a carved leg in a hand-screw clamp over
//              shavings and a mallet; sanded work a wheelbarrow heaped with sawdust, glasspaper on the heap, and a broom laid on the deck beside it;
//              primed work a keg of primer, a tall can and an enamel basin on one drop cloth; painted work a pair of steps
//              with pots on its treads and the painter's tote of pots. The lane between rows two and three and the deck
//              outside the outer row carry nothing but their own boards and the ring rail. The deck itself is dark oiled deal, far darker than any raw animal on it, with a worn
//              ring round each socket and nail heads along the sixteen sweeps.
//              A bare or blank station of row one or two may have a kit in that same lane (trestles with a crank, an
//              open tool chest, a coiled belt and a keg: none within 10 m of another piece), and the poles that wait
//              to be hung stand upright in an A-frame rack by the housing (radius 10.6 to 12.4). All of
//              it rides the wheel and is part of 'structure'; hero.deckBodies lists radius and top of each body of
//              row three, from which the world counts their least distance to the flown line over a whole turn.
//   cat        the shop cat on a chariot of row one (meshes 'cat', 'cat-tail'; the tail flicks). It faces outward,
//              23.5 m from the flown line at its nearest.
//   engine     fixed: belt engine, flywheel (spins), belt (slides), in the housing, seen through the bare sector.
//
// OPTS
//   palette    array of 7 hex strings: [cream wood, iron blue-grey, umber, scarlet, gold, pale sky, deep green]
//   scheme     0 scarlet/gold/green, 1 ultramarine/silver/rose, 2 cream/gold/black (the world deals it)
//   cast       0 equal parts, 1 mostly horses, 2 hares, herons and stags outermost (the world deals it); every cast
//              is dealt from fixed bags, so its count of each species does not change with the seed
//   phase0     the wheel's angle at clock 0, radians (the world deals it)
//   period     seconds per turn (24)
//   canopy     false leaves the striped canvas gores off the gilded quarter (default: on)
//   lights     0, 1 or 2 warm PointLights riding the gilded quarter (default 1; the brief wants 2: pass 2, or
//              add your own at anchors.lightSeats as children of hero.wheel). They never switch, only dim.
//
// ANCHORS (local = world, since the hero sits at the origin)
//   portalSeat   { position, facing }: the brief's portal seat in the paint shop doorway (-170, 12, -41), facing +x.
//   flyThrough   the brief's path points from the arm's mouth round the north-east shoulder to the west leg;
//                never nearer than 6.2 m to anything that turns at any clock time.
//   viewpoints   entry (whole wheel dead ahead), tangent, arc (closest pass), leaving.
//   lightSeats   two points IN THE WHEEL'S FRAME (children of hero.wheel) under the gilt rounding boards.
//   catSeat      the cat's seat in the wheel's frame.
//   reach        the figures of REACH above.
//   hero.gildBearing(time) -> compass bearing (radians, clockwise from north) of the middle of the gilded
//   quarter; hero.state = { angle, bulbs } is refreshed by update() for the hall's sweeping-glow shader.
//
// COPIES  hero.sculptGeometry(kind, so) and hero.makeCopies(geometry, items, name) give the hall animals in the
//   wheel's own look (conveyor, racks, trolleys, the carver's head); hero.extentOf(geometry, blank) says where such a
//   body ends (foot, its gilt shoes included; top; reach round its pole) so the hall can stand it on a deck and keep it
//   clear of the path. The wheel's own animals do not read it: they are set at their stations and ride their cranks.
//
// PROGRESS (the rare bulb failure): hero.setProgress(p), p 0..1 across the event (u 0.47..0.56 in the brief).
//   p 0 or 1: all bulbs burn. 0..0.1 every bulb eases out; to 0.45 dark; 0.45..1 they relight in ONE wave round
//   the rim, each band easing up once. Gilt, mirrors and the PointLights follow. Never driven by wall-clock time.
//
// LIGHT IT WANTS
//   One cool HemisphereLight (sky pale blue-white, ground dark umber). All surfaces are MeshStandardMaterial
//   (patched), so scene lights and fog work; the north glass as a key is worked out in the shader (uKey, no
//   light object for it); gold and mirrors add a faked reflection of pale north glass above and dark floor below,
//   plus the bulbs. Keep the floor dark: the wheel is meant to be the one bright ring.
//   WHAT READS THE EYE here (cameraPosition, per pixel; nothing is placed, hidden or timed by it, no light is added and
//   nothing is drawn twice): (1) the gilt's and the mirrors' faked reflection (uSkyRef above, uFloorRef below, chosen by
//   the mirrored eye line); (2) the deck's mirror of the bulbs (THE DECK, below); (3) the satin highlight of sanded, primed
//   and painted wood (a half-vector of the eye and the piece's key, tight on paint, broad on primer and sanded wood, held
//   back in the hollows) and the rim every matte form takes; (4) the standard material's own specular.
//
// NORTH SHAFTS  every shader here multiplies its albedo by uShaft.x (ambient share) + uShaft.y inside a shaft of north
//   light (cwShaft, exported as SHAFT_GLSL with shaftLattice / shaftGain so the hall draws its shafts and floor pools on
//   the same lattice), so the animals brighten as the wheel carries them through the shafts. uShaft.z shades copies that
//   stand in the wall racks. hero.uniforms.uShaft defaults to (1, 0, 1): no change when the piece is viewed alone.
// GAS LIGHT  hero.uniforms.uGas (a colour, black by default) is the warm light of the works on the wheel: the structure takes it
//   from the hall's ring of pendants (radius 53, y 20) on what faces outward and upward; the animals take it as ONE KEY, by the
//   place of the whole piece: on the wheel the wheel's own lamps, fixed in its frame (from above, ahead and a little from the
//   mast's side), about three to one over the glass's cool fill (the hemisphere's light on carved forms is held to a third), with
//   a warm bounce off the deck; a copy off the wheel takes the lamp it stands under (iLamp) from that lamp's side. HOLLOWS are
//   baked per vertex into every sculpt (where one form meets or runs close to another) and carried twice: as shade in aData.y
//   and, alone, as aHo, which the painted and gilded stages draw per pixel as the dirt line the paint keeps in a crease. Primer is
//   a warm grey-white and a blank a pale tan in every look (their lit colour is drawn toward neutral at the last step). Bare and primed wood is eased under a
//   ceiling (uCap) so that it stays a warm pale tan. Carved bare wood shows glue lines every 0.45 m, gouge flutes that turn the
//   light (a height worked out with the colour tilts the normal), pencil lines on sanded work, brush strokes in the primer.
//   THE DECK is dark oiled radial boards: of the wheel's two lamps they give back an eighth as a wash and no hot spot; instead
//   they mirror the lit quarter's bulbs (the eye's line turned up off the oil and followed to the four rings the bulbs hang in:
//   the rounding boards' at radius 43.3 and the three rows' at y 18), as soft gold bands broken at each joint, with a low pool
//   round each brass socket of the quarter. Poles are brass; cranks, hangers
//   and tie rods dark iron. THE ROUNDING BOARDS go round in the order of the work: bare frame (two slim rails and every other upright, slim too, in a
//   quiet shaded timber, no braces: an outline, not a lattice), first boards, boarded, primed, half painted, gilded, each sector on iron hanger straps at its sweeps;
//   the striped top ends on a sweep with a laced edge; a brass lantern burns on the mast's finial (y 27 to 29).
//   uFogBy, uFogArm, uFogBay, uFogPaint tint the haze by place as the hall does; uPortalC is the portal's gold on the copies.
//   ROOF GLASS  hero.uniforms.uRoof (a colour, black by default) is the bay's roof glass on whatever of the wheel stands above
//   its cranks (y 15 to 20 and up), on every face, and along the backs of the spares in the wall racks. hero.uniforms.uLamp is the hall's lamps on the copies that
//   stand off the wheel (each copy carries how much reaches it); uPlank tints the platform's boards. All set by the world.
//
// COST  164k to 172k triangles by cast and by which stations stand empty (counted from a print of every mesh of the wheel
//   on nine deals, three seeds by three casts; a reader's count over 48 deals: 164.8k to 172.8k: stations 115k to 123k, of which the outer row's finer animals, some 3,000 to
//   4,300 triangles each, 62k to 71k; structure with the deck's work, the streamers and the crown 32k, cartouches 12.4k,
//   bulbs 2.5k, cat, engine, flywheel and the two flywheel belts 1.9k), 33 to 35 meshes, two PointLights; it builds in
//   short steps (0.15 to 0.19 s of the world's build, timed alone outside the browser).
// The cranks' lowest point is y 15.4, not the design's 16.5: the sweeps' underside is at y 18.5 and a crank throw of
// 1.5 m under it cannot be raised without a body through a body.
// Nothing is made in update(): it turns the wheel, sets uniforms, moves the tail's one instance and dims lights.

import * as THREE from 'three';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const PLAT_Y = 3.2, YC = 13.7, YB = -1.3, THROW = 1.2, STROKES = 5;
const SECTORS = [40, 45, 50, 45, 40, 60, 80];            // iron, blocks, rough, sanded, primed, painted, gilded
const SEAM = -Math.PI / 2;                               // wheel-frame angle of the seam (due north while the wheel's angle is 0)
const DEFAULT_PALETTE = ['#E8D9B8', '#4A5560', '#2A221C', '#C8281E', '#E0A62E', '#CFE0EA', '#1F4A3C'];

// Where the north light's shafts are, for every shader in the hall (world space). One row of shafts per roof bay
// (25 m apart in z, slanting south as they fall: direction 0, -1, 0.5), 26 m apart along x, alternate rows staggered.
// The world builds its visible shafts on exactly this lattice (shaftLattice below).
export const SHAFT_GLSL = `
  float cwShaft(vec3 wp) {
    float s = (wp.z + 0.5 * wp.y + 53.) / 25., j = floor(s + 0.5), dz = abs(s - j) * 25.;
    float x0 = 4. + 13. * mod(j, 2.);
    float k = floor((wp.x - x0) / 26. + 0.5), dx = abs(wp.x - x0 - 26. * k);
    float w = mix(7.5, 5.0, clamp(wp.y / 40., 0., 1.));
    return (1. - smoothstep(w * 0.5, w * 1.2, dx)) * (1. - smoothstep(2.0, 7.0, dz)) * (0.62 + 0.38 * sin(j * 2.4 + k * 1.7 + 0.5));
  }\n`;
// the same lattice for geometry: the point at height y on the axis of shaft (row j, column k)
export function shaftLattice(j, k, y) { return [4 + 13 * (((j % 2) + 2) % 2) + 26 * k, y, 25 * j - 53 - 0.5 * y]; }
export function shaftGain(j, k) { return 0.62 + 0.38 * Math.sin(j * 2.4 + k * 1.7 + 0.5); }

// stage (0..6) and fraction through its sector for a wheel-frame angle phi (atan2(z, x))
function stageAt(phi) {
  let s = ((SEAM - phi) / DEG) % 360; if (s < 0) s += 360;
  let a = 0;
  for (let i = 0; i < 7; i++) { if (s < a + SECTORS[i]) return { stage: i, frac: (s - a) / SECTORS[i], deg: s }; a += SECTORS[i]; }
  return { stage: 6, frac: 1, deg: s };
}

// ---------------------------------------------------------------------------------------------------------
// Low-poly sculpting kit: lofted tubes, blobs and leaves into one indexed geometry with aData = (zone, ao, vary).
// Zones: 0 body, 1 hair/horn, 2 cloth, 3 strap/trim, 4 ornament (gilt), 5 jewel (mirror), 6 pole, 7 crank, 8 eye.
function makeSculpt(rng, so = {}) {
  const lod = so.lod || 1, lite = !!so.lite, fine = !!so.fine && !lite;
  // the finer level (so.fine: the wheel's outer row, the nearest the flown line): every big mass of the body (barrel, neck and head, limbs: the
  // tubes marked block) gets a ring between each two of its rings, on the smooth curve through them, and more sides
  const refine = (pts, rad) => {
    const m = pts.length, R = (i) => { const r = rad[Math.min(Math.max(i, 0), rad.length - 1)]; return r.length ? r : [r, r]; }, Pt = (i) => pts[Math.min(m - 1, Math.max(0, i))], op = [], or = [];
    for (let i = 0; i < m; i++) {
      op.push(pts[i]); or.push(R(i));
      if (i === m - 1) break;
      const a = Pt(i - 1), b = Pt(i), c = Pt(i + 1), d = Pt(i + 2), ra = R(i - 1), rb = R(i), rc = R(i + 1), rd = R(i + 2);
      op.push([0, 1, 2].map((k) => (-a[k] + 9 * b[k] + 9 * c[k] - d[k]) / 16));
      or.push([0, 1].map((k) => Math.max(0.9 * Math.min(rb[k], rc[k]), (-ra[k] + 9 * rb[k] + 9 * rc[k] - rd[k]) / 16)));
    }
    return [op, or];
  };
  const P = [], D = [], I = [], G = [], Q = [], V = [], caps = []; let nParts = 0;   // V: which form a vertex belongs to; caps: the forms' own segments (for the hollows baked in finish)
                                                        // G: where a vertex lies on its own form (metres along it, and across its section): the grain runs with it.
                                                        // Q: pose weights (how far a leg's vertex is gathered under the body, how far a head's vertex follows the neck)
  const HEAD_X = [1.2, 2.3], LEG_Y = [4.0, 2.5];
  const poseOf = (x, y) => { const m = S.mark || 0; const t = m === 1 ? Math.min(1, Math.max(0, (LEG_Y[0] - y) / (LEG_Y[0] - LEG_Y[1]))) : m === 2 ? Math.min(1, Math.max(0, (x - HEAD_X[0]) / (HEAD_X[1] - HEAD_X[0]))) : 0; Q.push(m === 1 ? t * t * (3 - 2 * t) : 0, m === 2 ? t * t * (3 - 2 * t) : 0); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const S = {
    // pts: [[x,y,z]...]; rad: per point r or [rUp, rSide]; o: { sides, zone, sq, ref, cap, block, vary, ao }
    tube(pts, rad, o = {}) {
      if (!S.body && o.block === true && (o.zone || 0) < 1) S.body = { pts, rad };                   // the barrel: where a glued blank's bar clamps go
      if (lod < 0.6 && rad.every((r) => (r.length ? Math.max(r[0], r[1]) : r) < 0.06)) return S;
      const cPts = pts, cRad = rad;                                                // the form as it was given: the hollows are baked from these segments
      if (fine && !o.thin && !o.keep && (o.zone || 0) < 1.5 && pts.length >= 3 && pts.length <= 9) {   // the finer level: every form of body, limb, hair and wing that is given in few rings gets a ring between each two, on the smooth curve through them, and the barrel and the neck more sides
        const big = rad.reduce((a, r) => Math.max(a, r.length ? Math.max(r[0], r[1]) : r), 0);
        if (big >= (o.lump ? 0.4 : 0.12)) { [pts, rad] = refine(pts, rad); o = { ...o, sides: Math.round((o.sides || 8) * (o.block === true ? 1.6 : 1)) }; }
      }
      if (lite) {                                                                   // a far spare: the big masses only, every other ring
        const zl = o.zone || 0, big = rad.reduce((a, r) => Math.max(a, r.length ? Math.max(r[0], r[1]) : r), 0);
        if ((zl > 1.5 && zl < 6) || zl > 7 || (zl < 6 && big < 0.12)) return S;
        if (pts.length > 4 && zl < 6) { const keep = pts.map((_, i) => i).filter((i) => i % 2 === 0 || i === pts.length - 1); rad = keep.map((i) => rad[Math.min(i, rad.length - 1)]); pts = keep.map((i) => pts[i]); }
      }
      const n0 = lite ? ((o.sides || 8) > 8 ? 5 : 4) : lod < 1 ? Math.max(4, Math.round((o.sides || 8) * lod)) : (o.sides || 8), zone = o.zone || 0, m = pts.length, base = P.length / 3;
      const n = so.even ? n0 + (n0 & 1) : n0;                                         // (so.even, a glued blank's geometry: an even count of sides, so no vertex lies on the form's middle plane and its sawn edges come out square)
      const vary = o.vary ?? rng.range(0.3, 0.7), ref = o.ref || [0, 0, 1], sq = o.sq || 0, aoK = o.ao ?? 1, zd = zone + (zone < 0.5 && o.pat ? o.pat * 0.08 : 0);
      let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], al = 0; const g0 = (base * 0.37) % 9, pid = nParts++;
      if (!lite && !so.even && !o.thin && zone < 1.5) for (let i = 0; i < cPts.length - 1; i++) {
        const R = (k) => { const r = cRad[Math.min(k, cRad.length - 1)]; return r.length ? 0.5 * (r[0] + r[1]) : r; }, ra = R(i), rb = R(i + 1); if (Math.max(ra, rb) < 0.09) continue;
        const a = cPts[i], b = cPts[i + 1], ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], l2 = ux * ux + uy * uy + uz * uz; if (l2 < 1e-8) continue;
        caps.push({ pid, ax: a[0], ay: a[1], az: a[2], ux, uy, uz, l2, ra, rb, cx: a[0] + ux / 2, cy: a[1] + uy / 2, cz: a[2] + uz / 2, br: Math.sqrt(l2) / 2 + Math.max(ra, rb) });
      }
      for (let i = 0; i < m; i++) {
        if (i) al += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
        const t = norm(sub(pts[Math.min(m - 1, i + 1)], pts[Math.max(0, i - 1)]));
        const d = dot(ref, t);
        let b = [ref[0] - t[0] * d, ref[1] - t[1] * d, ref[2] - t[2] * d];
        if (Math.hypot(b[0], b[1], b[2]) < 0.05) b = cross(t, [0, 1, 0]);
        b = norm(b); const up = cross(b, t);
        const r = rad[Math.min(i, rad.length - 1)], ru = r.length ? r[0] : r, rs = r.length ? r[1] : r;
        for (let j = 0; j < n; j++) {
          const a = (j + 0.5) / n * TAU; let c = Math.cos(a), s = Math.sin(a);
          if (sq) { const k = 1 / Math.pow(Math.max(Math.abs(c), Math.abs(s)), sq); c *= k; s *= k; }
          const dy = up[1] * c + b[1] * s;
          const x = pts[i][0] + up[0] * c * ru + b[0] * s * rs, y = pts[i][1] + up[1] * c * ru + b[1] * s * rs, z = pts[i][2] + up[2] * c * ru + b[2] * s * rs;
          P.push(x, y, z); V.push(pid); D.push(zd, 1 - aoK * 0.42 * (0.5 - 0.5 * dy), vary + (zone < 0.5 ? 0 : 0.12 * Math.sin(i * 2.3 + j * 1.7))); G.push(g0 + al, c * ru, s * rs); poseOf(x, y);
          if (x < lo[0]) lo[0] = x; if (y < lo[1]) lo[1] = y; if (z < lo[2]) lo[2] = z;
          if (x > hi[0]) hi[0] = x; if (y > hi[1]) hi[1] = y; if (z > hi[2]) hi[2] = z;
        }
      }
      for (let i = 0; i < m - 1; i++) for (let j = 0; j < n; j++) {
        const a = base + i * n + j, b2 = base + i * n + (j + 1) % n, c = a + n, d2 = b2 + n;
        I.push(a, b2, c, b2, d2, c);
      }
      if (o.cap !== false) for (let e = 0; e < 2; e++) {
        const i = e ? m - 1 : 0, r = rad[Math.min(i, rad.length - 1)], ru = r.length ? r[0] : r;
        if (ru < 0.02) continue;
        const t = norm(sub(pts[e ? m - 1 : 1], pts[e ? m - 2 : 0])), k = (e ? 1 : -1) * ru * (o.round ?? 0.35);
        const ci = P.length / 3; P.push(pts[i][0] + t[0] * k, pts[i][1] + t[1] * k, pts[i][2] + t[2] * k); V.push(pid); D.push(zd, 0.9, vary); G.push(g0 + (e ? al : 0) + k, 0, 0); poseOf(pts[i][0] + t[0] * k, pts[i][1] + t[1] * k);
        for (let j = 0; j < n; j++) { const a = base + i * n + j, b2 = base + i * n + (j + 1) % n; if (e) I.push(a, b2, ci); else I.push(b2, a, ci); }
      }
      return S;
    },
    // ellipsoid: centre c, radii [rx, ry, rz]
    blob(c, r, o = {}) {
      if (lite && (Math.max(r[0], r[1], r[2]) < 0.3 || (o.zone || 0) > 1)) return S;
      const pts = [], rad = [], k = o.rings || 4;
      for (let i = 0; i <= k; i++) { const a = Math.PI * (0.08 + 0.84 * i / k); pts.push([c[0] - Math.cos(a) * r[0], c[1], c[2]]); rad.push([Math.sin(a) * r[1], Math.sin(a) * r[2]]); }
      return S.tube(pts, rad, { sides: 6, round: 0.5, lump: true, ...o });
    },
    // flat pointed leaf: centre c, long axis dir, face normal nrm
    leaf(c, dir, nrm, len, wid, o = {}) {
      const zone = o.zone ?? 4, vary = o.vary ?? rng.range(0.3, 0.7), th = o.th ?? wid * 0.16;
      if (lite && (zone > 1 || len < 0.9)) return S;
      if (lod < 0.6 && zone !== 0) return S;
      // (a leaf of zone 1 is stored as 1.4, one of zone 0 as 0.02: a strand, a feather, a fin ray, an ear; its zone's own look, but too thin to be part of a sawn blank)
      if (fine && (len >= 0.85 || (zone <= 1 && len >= 0.45) || (zone === 3 && len >= 0.55))) {                   // the finer level: a feather, an ear, a fin ray is a rounded blade, thickest along its middle, never a flat lozenge (the small gilt leaves of a hem stay cut flat)
        const d0 = norm(dir), bk0 = o.back ?? 0.5, pp = [], rr = [];
        for (const [t, k] of [[0, 0.16], [0.3, 0.92], [0.68, 0.84], [1, 0.12]]) { const d = len * (t - bk0); pp.push([c[0] + d0[0] * d, c[1] + d0[1] * d, c[2] + d0[2] * d]); rr.push([wid / 2 * k, Math.max(th * 1.25 * k, 0.014)]); }
        return S.tube(pp, rr, { sides: 5, zone: zone === 1 ? 1.4 : zone === 0 ? 0.02 : zone, ref: norm(nrm), vary, thin: true, round: 0.6 });
      }
      dir = norm(dir); nrm = norm(nrm); const s = norm(cross(nrm, dir)), base = P.length / 3, bk = o.back ?? 0.5;
      const add = (kd, ks, kn) => { P.push(c[0] + dir[0] * kd + s[0] * ks + nrm[0] * kn, c[1] + dir[1] * kd + s[1] * ks + nrm[1] * kn, c[2] + dir[2] * kd + s[2] * ks + nrm[2] * kn); V.push(-1); D.push(zone === 1 ? 1.4 : zone === 0 ? 0.02 : zone, 0.95, vary); G.push(kd, ks, kn); poseOf(c[0] + dir[0] * kd + s[0] * ks + nrm[0] * kn, c[1] + dir[1] * kd + s[1] * ks + nrm[1] * kn); };
      add(len * (1 - bk), 0, 0); add(0, wid / 2, 0); add(-len * bk, 0, 0); add(0, -wid / 2, 0); add(0, 0, th); add(0, 0, -th);
      for (let j = 0; j < 4; j++) { const a = base + j, b = base + (j + 1) % 4; I.push(a, b, base + 4, b, a, base + 5); }
      return S;
    },
    // rays round a point in the plane facing nrm (sunburst, star, shell fan), with a boss in the middle
    burst(c, nrm, r, n, o = {}) {
      if (lite) return S;
      if (lod < 0.6 && (o.zone ?? 4) !== 0) return S;
      nrm = norm(nrm); const u = norm(cross(nrm, Math.abs(nrm[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), v = cross(nrm, u);
      const a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, full = Math.abs(a1 - a0 - TAU) < 1e-3;
      for (let i = 0; i < n; i++) {
        const a = a0 + (a1 - a0) * (full ? i / n : i / (n - 1)), rr = r * ((o.alt && (i & 1)) ? o.alt : 1);
        const d = [u[0] * Math.cos(a) + v[0] * Math.sin(a), u[1] * Math.cos(a) + v[1] * Math.sin(a), u[2] * Math.cos(a) + v[2] * Math.sin(a)];
        S.leaf([c[0] + d[0] * rr * 0.1, c[1] + d[1] * rr * 0.1, c[2] + d[2] * rr * 0.1], d, nrm, rr, o.wid ?? r * 0.42, { zone: o.zone ?? 4, back: 0.3, th: o.th ?? r * 0.07 });
      }
      if (o.boss !== 0) S.blob([c[0] + nrm[0] * r * 0.08, c[1] + nrm[1] * r * 0.08, c[2] + nrm[2] * r * 0.08], [r * 0.3, r * 0.3, r * 0.3], { zone: o.boss ?? 5, ref: [0.3, 0.2, 0.9], rings: 3, sides: 5 });
      return S;
    },
    count: () => I.length / 3,
    so,
    finish() {
      // HOLLOWS, baked per vertex: wherever one form of the body meets or runs close to another (a leg under the barrel, the neck at the
      // shoulder, the jaw at the throat, a strand of mane on the crest), the wood is in shade: aData.y falls there, softly, by how near the
      // other form's surface is (within a third of a metre)
      const nv = P.length / 3, nc = caps.length, Hh = new Float32Array(nv);          // Hh: how deep in a hollow each vertex lies (0 to 1): the paint's dirt line
      if (nc) for (let v = 0; v < nv; v++) {
        const zn = D[3 * v]; if (zn > 1.5) continue;                                   // (body, mane and tail; cloth and trappings keep their colours whole)
        const x = P[3 * v], y = P[3 * v + 1], z = P[3 * v + 2], me = V[v]; let dm = 1;
        for (let k = 0; k < nc; k++) { const c = caps[k]; if (c.pid === me) continue;
          const ex = x - c.cx, ey = y - c.cy, ez = z - c.cz, lim = c.br + 0.32; if (ex * ex + ey * ey + ez * ez > lim * lim) continue;
          let t = ((x - c.ax) * c.ux + (y - c.ay) * c.uy + (z - c.az) * c.uz) / c.l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
          const qx = c.ax + c.ux * t - x, qy = c.ay + c.uy * t - y, qz = c.az + c.uz * t - z, d = Math.sqrt(qx * qx + qy * qy + qz * qz) - (c.ra + (c.rb - c.ra) * t);
          if (d < dm) dm = d; }
        if (dm < 0.32) { const k = 1 - Math.min(1, Math.max(0, (dm + 0.02) / 0.34)), h = k * k * (3 - 2 * k); D[3 * v + 1] *= 1 - 0.46 * h; Hh[v] = h; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 3));
      g.setAttribute('aGr', new THREE.Float32BufferAttribute(G, 3)); g.setAttribute('aPo', new THREE.Float32BufferAttribute(Q, 2));
      g.setAttribute('aHo', new THREE.BufferAttribute(Hh, 1));
      g.setIndex(I); g.computeVertexNormals();
      return g;
    },
  };
  return S;
}

// pole (zone 6) and crank (zone 7) shared by every station. Crank axis is local z at (x 0, y YC); pin at +x.
function addPoleAndCrank(S, collars) {
  S.mark = 0;
  if (S.so.pole === false) return;                                                                                               // a piece off its pole (a blank on a trolley)
  const top = S.so.poleTop ?? YC;
  const base = S.so.poleBase ?? YB;
  S.tube([[0, base, 0], [0, base + (top - base) * 0.3, 0], [0, base + (top - base) * 0.7, 0], [0, top, 0]], [0.16], { sides: 8, zone: 6, vary: 0.5, ao: 0, cap: false });
  for (const y of collars) S.tube([[0, y - 0.22, 0], [0, y - 0.08, 0], [0, y + 0.08, 0], [0, y + 0.22, 0]], [0.2, 0.34, 0.34, 0.2], { sides: 8, zone: 4, ao: 0.4 });
  if (S.so.crank === false) {                                                                                                     // a hanging copy: a hook eye, no crank
    S.tube([[0, top - 0.5, 0], [0, top - 0.2, 0], [0, top + 0.25, 0]], [0.2, 0.3, 0.26], { sides: 8, zone: 6, vary: 0.4, ao: 0 });
    return;
  }
  S.tube([[0, YC - 0.45, 0], [0, YC - 0.15, 0], [0, YC + 0.2, 0]], [0.22, 0.3, 0.3], { sides: 8, zone: 6, vary: 0.4, ao: 0 });   // big end
  const o = { sides: 6, zone: 7, vary: 0.5, ao: 0.3, ref: [0, 1, 0] };
  S.tube([[0, YC, -1.9], [0, YC, -0.5]], [0.18], o); S.tube([[0, YC, 0.5], [0, YC, 1.9]], [0.18], o);                              // shaft
  S.tube([[THROW, YC, -0.56], [THROW, YC, 0.56]], [0.175], o);                                                                      // pin
  for (const z of [-0.5, 0.5]) S.tube([[-0.25, YC, z], [THROW + 0.25, YC, z]], [[0.2, 0.09]], { ...o, ref: [0, 0, 1], sq: 0.6 });  // webs
  S.tube([[0, YC, -1.75], [0, YC, -1.45]], [0.46, 0.34], { ...o, sides: 10 });                                                     // bevel gear
  S.tube([[0, YC, 1.3], [0, YC, 1.62]], [0.3], { ...o, sides: 10 });                                                         // hanger bearing
}

// ---------------------------------------------------------------------------------------------------------
// The six species (our own designs). Local frame: +x forward, y up from the platform top, z across; pole at x 0.
// Nothing lower than y 1.4 at mid stroke, nothing above 7.4, nothing beyond |z| 1.6.
const P2 = (xy, z) => xy.map((p, i) => [p[0], p[1], Array.isArray(z) ? z[Math.min(i, z.length - 1)] : z]);

// saddle cloth wrapped round the barrel, a seat on top and a hem of ornaments
function addSaddle(S, x0, x1, y, ru, rs, hem) {
  const xm = (x0 + x1) / 2;
  S.tube(P2([[x0, y], [xm, y - 0.02], [x1, y]], 0), [[ru * 1.06, rs * 1.08], [ru * 1.05, rs * 1.09], [ru * 1.06, rs * 1.08]], { sides: 10, zone: 2, cap: false, vary: 0.5 });
  for (const x of [x0, x1]) S.tube(P2([[x - 0.07, y], [x + 0.07, y]], 0), [[ru * 1.1, rs * 1.13]], { sides: 10, zone: 4, cap: false });   // gilt binding
  S.tube(P2([[x0 + 0.25, y + ru * 0.98], [xm - 0.2, y + ru * 1.0], [x1 - 0.5, y + ru * 1.02], [x1 - 0.15, y + ru * 1.2]], 0), [[0.2, 0.6], [0.16, 0.66], [0.2, 0.6], [0.26, 0.5]], { sides: 8, zone: 3, sq: 0.3 });   // seat with pommel
  S.tube(P2([[x0 + 0.1, y + ru * 1.0], [x0 + 0.02, y + ru * 1.45]], 0), [[0.14, 0.62], [0.08, 0.5]], { sides: 8, zone: 3, sq: 0.3 });   // cantle
  if (S.so.fine && !S.so.lite) {                                // the finer level: breeching round the quarters, a crupper along the back to the dock, a gilt boss on either hip
    S.tube(P2([[x0 - 0.62, y + 0.2], [x0 - 0.5, y + 0.2]], 0), [[ru * 1.13, rs * 1.13]], { sides: 10, zone: 3, cap: false });
    S.tube(P2([[x0 + 0.05, y + ru * 1.05], [x0 - 0.56, y + ru * 1.13 + 0.2], [x0 - 1.0, y + ru * 0.9 + 0.2]], 0), [[0.07, 0.16]], { sides: 4, zone: 3 });
    for (const s of [1, -1]) S.blob([x0 - 0.56, y + 0.2 + ru * 0.45, s * rs * 1.02], [0.17, 0.17, 0.1], { zone: 4, rings: 3, sides: 6 });
    for (const [x, d] of [[x0, 0.12], [x1, -0.12]]) S.tube(P2([[x + d - 0.03, y], [x + d + 0.03, y]], 0), [[ru * 1.074, rs * 1.094]], { sides: 10, zone: 8, cap: false });   // the cloth is lined: a dark line inside each gilt binding
  }
  const n = hem.n ?? 5;
  for (const s of [1, -1]) for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n, a = hem.drop ?? 0.75;
    const c = [x, y - ru * a, s * rs * 1.1 * Math.sqrt(Math.max(0.05, 1 - a * a * 0.8))];
    if (hem.kind === 'star') S.burst([c[0], c[1] + 0.25, c[2] + s * 0.03], [0, -0.35, s], 0.3, 5, { wid: 0.2 });
    else if (hem.kind === 'boss') S.blob([c[0], c[1] + 0.22, c[2] + s * 0.02], [0.17, 0.17, 0.09], { zone: 4, rings: 3, sides: 6 });   // round studs along the hem
    else S.leaf(c, [0.25 * ((i & 1) ? 1 : -1), -1, s * 0.25], [0, 0.4, s], hem.len || 0.62, hem.wid || 0.36, { zone: 4 });
  }
}

function addEyes(S, x, y, z, r) { for (const s of [1, -1]) S.blob([x, y, s * z], [r, r, r * 0.6], { zone: 8, rings: 3, sides: 5 }); }

// the finer level's face (row three, the nearest the flown line): a cheek that stands off the skull, a brow over each eye so the eye sits in a
// socket, a jaw under the muzzle, dark nostrils and a dark mouth line, and the point of the shoulder standing off the chest
function addFace(S, o) {
  if (!S.so.fine || S.so.lite) return;
  const [ex, ey, ez] = o.eye;
  if (o.jaw) S.tube(P2(o.jaw, 0), o.jawR, { sides: 7, zone: 0, pat: 1 });
  for (const s of [1, -1]) {
    if (o.cheek) S.blob([o.cheek[0], o.cheek[1], s * o.cheek[2]], o.cheekR, { zone: 0, rings: 4, sides: 6 });
    S.tube([[ex - 0.16, ey + 0.08, s * (ez - 0.03)], [ex - 0.02, ey + 0.15, s * (ez + 0.03)], [ex + 0.15, ey + 0.07, s * (ez - 0.03)]], [0.04, 0.065, 0.04], { sides: 5, zone: 0 });
    if (o.nostril) S.blob([o.nostril[0], o.nostril[1], s * o.nostril[2]], [0.07, 0.05, 0.04], { zone: 8, rings: 3, sides: 5 });
    if (o.mouth) S.tube([[o.mouth[0], o.mouth[1], s * o.mouth[4]], [o.mouth[2], o.mouth[3], s * o.mouth[4] * 0.55]], [0.028, 0.022], { sides: 4, zone: 8 });
    if (o.shoulder) S.blob([o.shoulder[0], o.shoulder[1], s * o.shoulder[2]], o.shoulderR, { zone: 0, rings: 4, sides: 6, pat: 1 });
  }
}

// four galloping legs: fore reach forward, hind reach back; the near and off legs differ a little
function addLegs(S, fore, hind, zf, zh, rf, rh, o = {}) {
  // the finer level (row three): each leg shows its joints: a knee or hock that stands proud, a lean cannon under it, a fetlock, a pastern
  const fine = !!S.so.fine && !S.so.lite;
  const joint = (pts, rad) => {
    if (!fine) return [pts, rad];
    const n = pts.length, kn = n >= 5 ? n - 3 : 1, fe = n - 2, R = (i) => { const r = rad[Math.min(i, rad.length - 1)]; return r.length ? r : [r, r]; };
    const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], sc = (r, k) => [r[0] * k, r[1] * k], op = [], or = [];
    for (let i = 0; i < n; i++) {
      if (i === kn) { op.push(mid(pts[i - 1], pts[i], 0.72), pts[i], mid(pts[i], pts[i + 1], 0.3)); or.push(sc(R(i), 1.04), sc(R(i), 1.36), sc(R(i), 0.9)); }
      else if (i === fe) { op.push(mid(pts[i - 1], pts[i], 0.72), pts[i]); or.push(sc(R(i), 0.92), sc(R(i), 1.34)); }
      else { op.push(pts[i]); or.push(R(i)); }
    }
    return [op, or];
  };
  const lo = fine ? { sides: 8, zone: 0, pat: 5, keep: true } : { sides: 6, zone: 0, block: 2, pat: 5 }, mark0 = S.mark;   // (keep: a fine leg is given ring by ring, joints and all)
  S.mark = 1;                                                                     // POSE: a leg's vertices can be gathered under the body (the shader, per place)
  for (const s of [1, -1]) {
    const k = s > 0 ? 0 : 1, dx = k * (o.stagger ?? 0.4), dy = k * 0.22;
    const f = fore.map((p, i) => [p[0] - dx * i / (fore.length - 1), p[1] + dy * i / (fore.length - 1)]);
    const h = hind.map((p, i) => [p[0] + dx * i / (hind.length - 1), p[1] + dy * i / (hind.length - 1)]);
    const [fj, rfj] = joint(f, rf), [hj, rhj] = joint(h, rh);
    S.tube(P2(fj, s * zf), rfj, lo); S.tube(P2(hj, s * zh), rhj, lo);
    for (const [pts, r] of [[f, rf], [h, rh]]) {                                  // hoof or paw: a gilt shoe
      const a = pts[pts.length - 2], b = pts[pts.length - 1], z = s * (pts === f ? zf : zh), rr = (r[r.length - 1].length ? r[r.length - 1][0] : r[r.length - 1]) * (o.hoof ?? 1.35);
      const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(d[0], d[1]) || 1;
      S.tube([[b[0], b[1], z], [b[0] + d[0] / l * rr * 1.5, b[1] + d[1] / l * rr * 1.5, z]], [rr * 0.85, rr], { sides: 6, zone: 4, round: 0.15 });
    }
  }
  S.mark = mark0;
}

function buildHorse(S) {
  S.tube(P2([[-2.05, 4.35], [-1.55, 4.5], [-0.6, 4.32], [0.35, 4.28], [1.1, 4.42], [1.6, 4.6]], 0), [[0.5, 0.45], [0.98, 0.86], [0.9, 0.8], [0.92, 0.82], [1.02, 0.86], [0.66, 0.56]], { sides: 10, block: true, pat: 1 });
  S.mark = 2;                                                                     // POSE: from here on, whatever lies forward of the shoulder follows the neck
  S.tube(P2([[1.35, 4.75], [1.9, 5.2], [2.35, 5.5], [2.7, 5.6], [2.95, 5.45], [3.12, 5.12], [3.2, 4.86]], 0), [[0.78, 0.52], [0.6, 0.42], [0.46, 0.36], [0.44, 0.37], [0.38, 0.33], [0.27, 0.25], [0.2, 0.21]], { sides: 8, block: true, pat: 1 });
  addLegs(S, [[1.15, 4.1], [1.7, 3.3], [2.3, 2.75], [2.72, 2.3], [2.9, 1.95]], [[-1.5, 4.1], [-2.0, 3.35], [-2.35, 2.95], [-2.8, 2.4], [-3.02, 2.0]], 0.5, 0.52,
    [0.36, 0.25, 0.17, 0.13, 0.15], [0.5, 0.32, 0.19, 0.14, 0.16]);
  S.tube(P2([[-1.95, 4.75], [-2.4, 5.1], [-2.8, 5.05], [-3.1, 4.7]], 0), [0.2, [0.34, 0.26], [0.3, 0.2], 0.04], { sides: 6, zone: 1, block: true });       // tail
  for (let i = 0; i < 3; i++) {                                                                                                                             // mane: three wind-blown locks
    const x = 1.55 + i * 0.42, y = 5.42 + i * 0.26, z = (i - 1) * 0.12;
    S.tube([[x, y, z], [x - 0.35, y + 0.42, z], [x - 0.9, y + 0.5, z * 2], [x - 1.4, y + 0.3 - i * 0.05, z * 3], [x - 1.65, y + 0.34, z * 3]], [[0.2, 0.2], [0.3, 0.2], [0.24, 0.15], [0.13, 0.08], 0.02], { sides: 6, zone: 1 });
  }
  S.tube([[2.75, 5.95, 0], [3.0, 5.72, 0], [3.25, 5.3, 0]], [[0.14, 0.2], [0.16, 0.2], 0.03], { sides: 5, zone: 1 });                                        // forelock
  for (const s of [1, -1]) S.leaf([2.62, 6.0, s * 0.2], [-0.3, 1, s * 0.25], [0.8, 0.2, s * 0.6], 0.5, 0.24, { zone: 0, th: 0.07 });                        // ears
  addEyes(S, 2.86, 5.6, 0.31, 0.09);
  addFace(S, { eye: [2.86, 5.6, 0.31], cheek: [2.76, 5.3, 0.25], cheekR: [0.25, 0.27, 0.13], jaw: [[2.66, 5.22], [2.9, 5.03], [3.08, 4.88]], jawR: [[0.22, 0.2], [0.17, 0.16], [0.12, 0.13]],
    nostril: [3.22, 4.94, 0.13], mouth: [3.06, 4.85, 3.25, 4.78, 0.18], shoulder: [1.2, 4.42, 0.6], shoulderR: [0.5, 0.62, 0.3] });
  S.tube(P2([[3.02, 5.3], [3.08, 5.2]], 0), [[0.36, 0.33]], { sides: 8, zone: 3, cap: false }); S.tube(P2([[2.45, 5.5], [2.55, 5.56]], 0), [[0.5, 0.42]], { sides: 8, zone: 3, cap: false });   // bridle
  for (const s of [1, -1]) S.burst([2.5, 5.55, s * 0.42], [0.1, 0, s], 0.2, 6, { wid: 0.12 });
  S.tube(P2([[1.25, 4.5], [1.42, 4.62]], 0), [[1.04, 0.86]], { sides: 10, zone: 3, cap: false });                                                           // breast collar
  S.burst([1.78, 4.5, 0], [1, 0.1, 0], 0.34, 8, { wid: 0.2 });
  addSaddle(S, -1.0, 0.45, 4.3, 0.92, 0.82, { n: 5, len: 0.7, wid: 0.4 });                                                                                  // oak-leaf cloth
  addPoleAndCrank(S, [5.75, 3.05]);
}

function buildHare(S) {
  S.tube(P2([[-2.1, 3.9], [-1.6, 4.3], [-0.7, 4.45], [0.3, 4.2], [1.1, 4.1], [1.6, 4.2]], 0), [[0.55, 0.5], [1.05, 0.9], [0.95, 0.8], [0.78, 0.7], [0.74, 0.66], [0.55, 0.5]], { sides: 10, block: true, pat: 1 });
  // neck, a round skull and a short blunt muzzle: the head is a clear head
  S.mark = 2;
  S.tube(P2([[1.38, 4.28], [1.9, 4.66], [2.36, 4.94], [2.76, 4.92], [3.06, 4.7], [3.22, 4.52]], 0), [[0.6, 0.5], [0.54, 0.46], [0.64, 0.56], [0.54, 0.48], [0.36, 0.35], [0.24, 0.26]], { sides: 8, block: true, pat: 1 });
  addLegs(S, [[1.2, 3.9], [1.8, 3.2], [2.4, 2.6], [2.85, 2.1]], [[-1.5, 3.8], [-1.0, 3.0], [-1.9, 2.6], [-2.6, 2.25], [-3.05, 2.05]], 0.42, 0.62,
    [0.3, 0.2, 0.14, 0.13], [[0.7, 0.42], [0.36, 0.26], [0.22, 0.2], [0.17, 0.2], [0.13, 0.18]], { stagger: 0.3, hoof: 1.1 });
  // two long ears that spring from the crown of the skull and slope back, clear of the neck and of each other: each a broad flat blade on
  // a stout root, its hollow face (darker) turned outward
  for (const s of [1, -1]) {
    S.tube([[2.44, 5.28, s * 0.2], [2.2, 5.74, s * 0.27], [1.82, 6.22, s * 0.38], [1.42, 6.66, s * 0.5], [1.06, 7.0, s * 0.6], [0.84, 7.2, s * 0.66]],
      [[0.2, 0.19], [0.25, 0.17], [0.36, 0.15], [0.38, 0.13], [0.27, 0.1], [0.07, 0.05]], { sides: 7, zone: 0, block: s > 0 });
    S.tube([[2.12, 5.86, s * 0.37], [1.8, 6.24, s * 0.5], [1.42, 6.66, s * 0.62], [1.12, 6.94, s * 0.69]], [[0.1, 0.05], [0.22, 0.05], [0.24, 0.05], [0.08, 0.03]], { sides: 5, zone: 1 });   // the ear's inner face
  }
  S.blob([-2.25, 4.55, 0], [0.42, 0.42, 0.4], { zone: 1 });                                                                                                 // scut
  addEyes(S, 2.62, 5.1, 0.42, 0.17);
  addFace(S, { eye: [2.62, 5.1, 0.42], cheek: [2.56, 4.72, 0.34], cheekR: [0.3, 0.26, 0.15], mouth: [2.92, 4.5, 3.12, 4.46, 0.16], shoulder: [1.2, 4.05, 0.5], shoulderR: [0.42, 0.5, 0.26] });
  S.blob([3.3, 4.56, 0], [0.13, 0.11, 0.17], { zone: 8, rings: 3 });                                                                                         // nose
  // the collar of wheat: a smooth plaited band (two gilt beads either side of a strap), nothing standing off it
  S.tube(P2([[1.5, 4.27], [1.64, 4.35], [1.78, 4.43]], 0), [[0.64, 0.55], [0.69, 0.59], [0.64, 0.55]], { sides: 10, zone: 3, cap: false });
  for (const [x, y] of [[1.46, 4.25], [1.82, 4.45]]) S.tube(P2([[x - 0.05, y - 0.03], [x + 0.05, y + 0.03]], 0), [[0.69, 0.59]], { sides: 10, zone: 4, cap: false });
  addSaddle(S, -0.95, 0.35, 4.35, 0.94, 0.8, { n: 0 });
  addPoleAndCrank(S, [5.75, 3.0]);
}

function buildRam(S) {
  const sp = [], rr = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, x = -2.05 + t * 3.6, k = Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) ** 0.5, rib = (i & 1) ? 1.07 : 0.95; sp.push([x, 4.3 + 0.12 * Math.sin(t * 3.1)]); rr.push([1.05 * k * rib, 0.92 * k * rib]); }
  S.tube(P2(sp, 0), rr, { sides: 10, block: true, vary: 0.6, pat: 2 });                                                                                              // fleece in rows
  for (let i = 1; i < 14; i += 2) for (let j = -1; j <= 1; j++) { const a = j * 0.62, x = sp[i][0], r = rr[i]; S.blob([x, sp[i][1] + Math.cos(a) * r[0], Math.sin(a) * r[1]], [0.2, 0.17, 0.2], { zone: 0, rings: 3, sides: 5, vary: 0.85, pat: 2 }); }   // tight curls along the back
  S.mark = 2;
  S.tube(P2([[1.4, 4.5], [1.95, 4.55], [2.4, 4.3], [2.75, 3.85], [2.95, 3.45]], 0), [[0.72, 0.6], [0.6, 0.5], [0.5, 0.44], [0.36, 0.33], [0.24, 0.27]], { sides: 8, block: true, pat: 1 });   // head lowered
  for (const s of [1, -1]) {                                                                                                                                // ribbed spiral horns
    const hp = [], hr = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, a = 2.2 - t * 7.4, r = 0.62 - t * 0.3; hp.push([2.0 + Math.cos(a) * r, 4.55 + Math.sin(a) * r, s * (0.42 + t * 0.62)]); hr.push((0.29 - t * 0.25) * ((i & 1) ? 1.16 : 0.9)); }
    S.tube(hp, hr, { sides: 6, zone: 1, ref: [0.2, 0.1, s], block: s > 0 });
  }
  addLegs(S, [[1.1, 3.9], [1.6, 3.2], [2.15, 2.75], [2.5, 2.35], [2.66, 2.05]], [[-1.5, 3.9], [-1.95, 3.3], [-2.3, 2.95], [-2.7, 2.45], [-2.9, 2.1]], 0.5, 0.5,
    [0.36, 0.24, 0.16, 0.12, 0.14], [0.46, 0.3, 0.18, 0.13, 0.15], { stagger: 0.32 });
  S.blob([-2.2, 4.75, 0], [0.34, 0.26, 0.26], { zone: 0 });
  addEyes(S, 2.5, 4.3, 0.36, 0.09);
  addFace(S, { eye: [2.5, 4.3, 0.36], cheek: [2.5, 3.95, 0.3], cheekR: [0.22, 0.25, 0.12], nostril: [2.99, 3.43, 0.12], mouth: [2.8, 3.42, 2.96, 3.33, 0.16] });
  for (const s of [1, -1]) S.leaf([1.9, 4.2, s * 0.62], [-0.2, -1, s * 0.4], [0.3, 0.2, s], 0.42, 0.2, { zone: 0, th: 0.06 });                             // ears
  S.tube(P2([[1.28, 4.4], [1.46, 4.5]], 0), [[0.86, 0.74]], { sides: 10, zone: 3, cap: false });
  S.blob([1.75, 3.72, 0], [0.24, 0.3, 0.24], { zone: 4 }); S.tube(P2([[1.75, 3.5], [1.75, 3.38]], 0), [0.2, 0.26], { sides: 6, zone: 4 });                  // bell
  addSaddle(S, -0.95, 0.4, 4.36, 1.06, 0.94, { n: 4, kind: 'star', drop: 0.66 });
  addPoleAndCrank(S, [5.95, 2.9]);
}

function buildHeron(S) {
  S.tube(P2([[-1.7, 4.2], [-1.1, 4.4], [-0.2, 4.5], [0.6, 4.6], [1.15, 4.85], [1.4, 5.1]], 0), [[0.36, 0.36], [0.8, 0.7], [0.98, 0.84], [0.92, 0.78], [0.66, 0.56], [0.4, 0.36]], { sides: 10, block: true, pat: 3 });
  S.mark = 2;
  S.tube(P2([[1.3, 5.0], [1.62, 5.5], [1.45, 6.05], [1.2, 6.45], [1.45, 6.8], [1.95, 6.82], [2.3, 6.66]], 0), [[0.4, 0.34], [0.3, 0.26], [0.25, 0.23], [0.23, 0.22], [0.25, 0.24], [0.3, 0.27], [0.2, 0.2]], { sides: 7, block: true, pat: 3 });   // neck folded in an S
  S.tube(P2([[2.25, 6.68], [2.7, 6.56], [3.15, 6.4]], 0), [[0.15, 0.13], [0.1, 0.08], 0.02], { sides: 5, zone: 1 });                                         // beak
  S.tube([[1.75, 6.98, 0], [1.2, 7.05, 0], [0.55, 6.86, 0]], [[0.07, 0.12], [0.06, 0.1], 0.015], { sides: 5, zone: 1 });                                     // crest plume
  addEyes(S, 2.05, 6.84, 0.24, 0.07);
  addFace(S, { eye: [2.05, 6.84, 0.24], cheek: [1.98, 6.7, 0.2], cheekR: [0.2, 0.14, 0.08], mouth: [2.25, 6.62, 2.95, 6.46, 0.1] });
  for (const s of [1, -1]) {                                                                                                                                // wings swept back to make the seat
    S.tube([[0.95, 5.05, s * 0.72], [0.2, 5.5, s * 1.0], [-0.9, 5.45, s * 1.12], [-2.0, 5.05, s * 1.0], [-2.75, 4.7, s * 0.8]], [[0.34, 0.16], [0.56, 0.17], [0.6, 0.15], [0.42, 0.11], 0.05], { sides: 8, zone: 1.08, ref: [0, 0.25, 1], block: s > 0 });   // (zone 1.08: hair's colour, carved in rows of feathers)
    for (let i = 0; i < 7; i++) { const t = i / 6, x = 0.3 - t * 2.7; S.leaf([x, 5.0 - t * 0.38, s * (1.16 - t * 0.2)], [-1, -0.42 - t * 0.2, 0], [0, 0.25, s], 1.0 - t * 0.12, 0.42, { zone: (i & 1) ? 4 : 1, th: 0.06, back: 0.25 }); }
    S.tube([[-0.5, 3.75, s * 0.3], [-1.4, 3.45, s * 0.3], [-2.3, 3.3, s * 0.32], [-3.0, 3.22 + (s > 0 ? 0 : 0.18), s * 0.32]], [0.2, 0.1, 0.085, 0.085], { sides: 5, zone: 1, block: 1 });   // legs trailing
    for (let j = -1; j <= 1; j++) S.leaf([-3.08, 3.2 + (s > 0 ? 0 : 0.18), s * 0.32 + j * 0.13], [-1, -0.2, j * 0.5], [0, 1, 0], 0.4, 0.1, { zone: 4, th: 0.04, back: 0.1 });
  }
  for (let j = -2; j <= 2; j++) S.leaf([-1.9, 4.25, j * 0.16], [-1, -0.12, j * 0.22], [0, 1, 0], 1.1, 0.3, { zone: (j & 1) ? 4 : 1, th: 0.05, back: 0.15 });     // tail fan
  S.tube(P2([[1.22, 4.92], [1.34, 5.06]], 0), [[0.52, 0.46]], { sides: 8, zone: 3, cap: false });
  S.burst([1.62, 4.9, 0], [1, -0.2, 0], 0.32, 8, { wid: 0.18 });
  S.tube(P2([[-0.8, 5.42], [-0.2, 5.5], [0.4, 5.52]], 0), [[0.12, 0.74], [0.12, 0.8], [0.14, 0.7]], { sides: 8, zone: 2, sq: 0.3 });                           // seat cloth between the wings
  addPoleAndCrank(S, [6.1, 3.2]);
}

function buildCarp(S) {
  // one smooth arched fish: nose low and forward, the back's crown over the pole, the tail's root lifting behind
  const sp = [[3.02, 3.72], [2.62, 4.12], [1.95, 4.72], [1.05, 5.16], [0.0, 5.32], [-1.0, 5.18], [-1.75, 4.98], [-2.28, 5.1]];
  const rr = [[0.27, 0.25], [0.62, 0.46], [0.95, 0.63], [1.12, 0.73], [1.14, 0.75], [0.94, 0.62], [0.6, 0.4], [0.37, 0.25]];
  S.tube(P2(sp, 0), rr, { sides: 10, block: true, pat: 4 });                                                                                                        // scales are cut in the surface by the shader, never raised
  S.tube(P2([[2.96, 3.78], [3.14, 3.6]], 0), [[0.29, 0.27], [0.25, 0.23]], { sides: 8, zone: 1, round: 0.3 });                                                 // lips
  // THE FAN TAIL, held high: one broad web that widens from the root to a rounded trailing edge, with a stout ray along its upper and its lower edge
  S.tube(P2([[-2.2, 5.06], [-2.44, 5.46], [-2.72, 5.95], [-2.98, 6.4]], 0), [[0.34, 0.2], [0.54, 0.12], [0.78, 0.085], [0.9, 0.06]], { sides: 8, zone: 1, round: 0.4, block: 1 });
  S.tube(P2([[-2.08, 5.3], [-2.08, 5.84], [-2.14, 6.4], [-2.22, 6.88]], 0), [[0.16, 0.14], [0.17, 0.12], [0.14, 0.1], [0.06, 0.05]], { sides: 6, zone: 1 });
  S.tube(P2([[-2.4, 4.98], [-2.92, 5.3], [-3.4, 5.66], [-3.76, 6.0]], 0), [[0.16, 0.14], [0.17, 0.12], [0.14, 0.1], [0.06, 0.05]], { sides: 6, zone: 1 });
  // the dorsal fin: one low sail behind the seat, ending well short of the tail
  S.tube(P2([[-0.5, 6.5], [-0.82, 6.72], [-1.22, 6.5], [-1.56, 6.08], [-1.72, 5.76]], 0), [[0.07, 0.06], [0.4, 0.08], [0.42, 0.075], [0.22, 0.06], [0.05, 0.04]], { sides: 8, zone: 1 });
  S.tube(P2([[-0.9, 4.32], [-1.3, 3.98], [-1.72, 3.74]], 0), [[0.16, 0.09], [0.36, 0.075], [0.16, 0.05]], { sides: 7, zone: 1, round: 0.5 });                  // the fin under the tail's root
  for (const s of [1, -1]) {
    S.tube([[2.98, 3.6, s * 0.2], [3.12, 3.34, s * 0.34], [3.06, 3.1, s * 0.4]], [0.075, 0.06, 0.035], { sides: 5, zone: 1 });                                   // barbels, short and stout
    // a broad round fin behind each gill, swept back and down
    S.tube([[1.62, 4.3, s * 0.6], [1.22, 3.92, s * 0.92], [0.74, 3.58, s * 1.16], [0.4, 3.4, s * 1.26]], [[0.2, 0.11], [0.5, 0.09], [0.56, 0.075], [0.3, 0.05]], { sides: 8, zone: 1, round: 0.6 });
    S.blob([2.2, 4.42, s * 0.4], [0.5, 0.56, 0.17], { zone: 0, rings: 5, sides: 8, pat: 1 });                                                                     // the gill plate, standing off the head
    const gp = []; for (let i = 0; i <= 6; i++) { const a = -1.15 + i * 2.3 / 6; gp.push([2.22 - Math.cos(a) * 0.5, 4.42 + Math.sin(a) * 0.58, s * (0.44 + 0.1 * Math.cos(a))]); }
    S.tube(gp, [0.045, 0.07, 0.08, 0.08, 0.08, 0.07, 0.045], { sides: 5, zone: 4 });                                                                              // its gilt rim
    S.blob([2.56, 4.5, s * 0.47], [0.15, 0.15, 0.08], { zone: 8, rings: 3, sides: 6 }); S.blob([2.56, 4.5, s * 0.44], [0.23, 0.23, 0.07], { zone: 4, rings: 3, sides: 7 });   // a round eye in a gilt ring
  }
  // THE WAVE it leaps from: ONE low swell with a single round crest, a quiet sea colour (zone 1.25), joined to the belly by a short spout
  S.tube(P2([[-2.6, 1.78], [-1.8, 1.96], [-0.7, 2.2], [0.4, 2.44], [1.3, 2.6], [2.0, 2.56], [2.5, 2.3], [2.72, 1.98]], 0),
    [[0.2, 0.45], [0.42, 0.8], [0.6, 0.98], [0.76, 1.04], [0.8, 0.98], [0.68, 0.84], [0.44, 0.62], [0.2, 0.4]], { sides: 10, zone: 1.25, block: 1, round: 0.5 });
  S.blob([1.55, 2.92, 0], [1.0, 0.56, 0.8], { zone: 1.25, rings: 5, sides: 8 });                                                                                  // its one crest, a round shoulder of water under the chin
  S.tube(P2([[0.1, 3.0], [0.06, 3.6], [0.0, 4.25]], 0), [[0.62, 0.66], [0.42, 0.46], [0.36, 0.4]], { sides: 8, zone: 1.25, cap: false });                           // the spout under the belly
  S.tube(P2([[-0.5, 5.12], [0.5, 5.18]], 0), [[1.2, 0.8], [1.26, 0.84]], { sides: 10, zone: 3, cap: false }); S.tube(P2([[-0.35, 6.15], [0.1, 6.2], [0.5, 6.22]], 0), [[0.16, 0.5], [0.14, 0.56], [0.2, 0.46]], { sides: 8, zone: 2, sq: 0.3 });   // girth and seat
  for (const x of [-0.56, 0.56]) S.tube(P2([[x - 0.06, 5.14], [x + 0.06, 5.16]], 0), [[1.24, 0.84]], { sides: 10, zone: 4, cap: false });                           // the girth's gilt bindings
  addPoleAndCrank(S, [6.75, 3.5]);
}

function buildStag(S) {
  S.tube(P2([[-2.0, 4.5], [-1.5, 4.62], [-0.6, 4.42], [0.3, 4.4], [1.0, 4.55], [1.5, 4.8]], 0), [[0.45, 0.4], [0.9, 0.78], [0.8, 0.7], [0.84, 0.72], [0.94, 0.78], [0.6, 0.5]], { sides: 10, block: true, pat: 1 });
  S.mark = 2;
  S.tube(P2([[1.3, 4.9], [1.7, 5.45], [2.0, 5.95], [2.3, 6.2], [2.7, 6.1], [3.0, 5.86], [3.14, 5.7]], 0), [[0.68, 0.46], [0.48, 0.36], [0.4, 0.33], [0.4, 0.36], [0.32, 0.3], [0.21, 0.22], [0.15, 0.17]], { sides: 8, block: true, pat: 1 });
  addLegs(S, [[1.05, 4.25], [1.7, 3.6], [2.35, 3.25], [2.75, 2.7], [2.95, 2.3]], [[-1.45, 4.25], [-1.95, 3.5], [-2.4, 3.15], [-2.8, 2.55], [-3.0, 2.15]], 0.46, 0.48,
    [0.32, 0.2, 0.13, 0.1, 0.12], [0.44, 0.26, 0.15, 0.11, 0.13], { stagger: 0.45 });
  for (const s of [1, -1]) {                                                                                                                                // antlers swept flat over the shoulders
    const beam = [[2.25, 6.5, s * 0.26], [1.7, 6.85, s * 0.5], [0.9, 6.95, s * 0.8], [0.0, 6.85, s * 1.0], [-0.8, 6.62, s * 1.1]];
    S.tube(beam, [0.13, 0.12, 0.1, 0.08, 0.03], { sides: 5, zone: 1, ref: [0, 1, 0], block: s > 0 });
    for (let i = 1; i < 4; i++) { const b = beam[i]; S.tube([b, [b[0] - 0.15, b[1] + 0.28, b[2] + s * 0.32], [b[0] - 0.42, b[1] + 0.34 - i * 0.05, b[2] + s * 0.5]], [0.08, 0.06, 0.02], { sides: 4, zone: 1, ref: [0, 1, 0] }); }
    S.tube([[2.3, 6.5, s * 0.26], [2.6, 6.85, s * 0.42], [2.95, 6.95, s * 0.46]], [0.09, 0.06, 0.02], { sides: 4, zone: 1, ref: [0, 1, 0] });                 // brow tine
    S.leaf([2.1, 6.3, s * 0.42], [-0.5, 0.3, s], [0.6, 0.6, 0], 0.5, 0.22, { zone: 0, th: 0.06 });                                                         // ear
  }
  S.blob([-2.12, 4.95, 0], [0.26, 0.2, 0.2], { zone: 1 });
  addEyes(S, 2.55, 6.25, 0.3, 0.08); S.blob([3.2, 5.7, 0], [0.09, 0.08, 0.13], { zone: 8, rings: 3 });
  addFace(S, { eye: [2.55, 6.25, 0.3], cheek: [2.58, 5.96, 0.24], cheekR: [0.22, 0.2, 0.1], jaw: [[2.45, 5.92], [2.8, 5.78], [3.05, 5.62]], jawR: [[0.2, 0.18], [0.14, 0.14], [0.09, 0.1]],
    mouth: [2.95, 5.68, 3.13, 5.6, 0.12], shoulder: [1.1, 4.6, 0.56], shoulderR: [0.46, 0.6, 0.28] });
  for (let i = 0; i < 12; i++) {                                                                                                                            // garland of ivy round the neck
    const a = i / 12 * TAU, c = Math.cos(a), s = Math.sin(a), x = 1.42 + c * 0.16;
    S.leaf([x, 4.95 + c * 0.78, s * 0.56], [0.3 * ((i & 1) ? 1 : -1), c * 0.3 - 0.6, s * 0.4], [0.5, c, s], 0.56, 0.46, { zone: (i % 3) ? 3 : 4, th: 0.07 });
  }
  S.tube(P2([[1.28, 4.86], [1.5, 5.02]], 0), [[0.76, 0.56]], { sides: 10, zone: 3, cap: false });
  addSaddle(S, -0.95, 0.4, 4.42, 0.84, 0.73, { n: 5, len: 0.6, wid: 0.44 });
  addPoleAndCrank(S, [5.9, 3.25]);
}

// a bench chariot for rows one and two: shell back, scroll sides, footboard. It does not ride a crank.
// ---------------------------------------------------------------------------------------------------------
// Bench work for the hall (not on the wheel): the great head in the carver's vice and loose parts awaiting fitting.
// The head: 6 m from the foot of its block to its ears, in metres, origin at the middle of its base, nose toward +x. Its back half is still square stock.
function buildHead(S) {
  S.tube(P2([[-0.5, 0], [-0.5, 1.1], [-0.45, 2.2], [-0.4, 2.5]], 0), [[1.25, 1.0], [1.25, 1.0], [1.2, 0.98], [1.0, 0.9]], { sides: 12, sq: 1.0, vary: 0.45 });   // the uncarved foot of the block
  S.tube(P2([[-1.05, 2.3], [-1.0, 3.3], [-0.8, 4.2], [-0.45, 4.75]], 0), [[0.5, 0.6], [0.5, 0.58], [0.45, 0.5], [0.3, 0.4]], { sides: 8, sq: 1.0, vary: 0.6 });   // square stock where the mane will be
  S.tube(P2([[0.0, 1.9], [0.05, 2.7], [0.2, 3.5], [0.5, 4.1], [0.9, 4.4]], 0), [[1.05, 0.8], [0.95, 0.72], [0.8, 0.62], [0.68, 0.55], [0.6, 0.5]], { sides: 12 });   // neck
  S.tube(P2([[0.55, 4.55], [1.0, 4.5], [1.5, 4.1], [1.95, 3.55], [2.3, 3.05], [2.5, 2.7], [2.56, 2.5]], 0),
    [[0.5, 0.46], [0.62, 0.52], [0.6, 0.5], [0.5, 0.43], [0.42, 0.38], [0.38, 0.37], [0.26, 0.3]], { sides: 12 });                                           // skull to muzzle
  S.tube(P2([[1.0, 3.75], [1.35, 3.45], [1.75, 3.05], [2.05, 2.7]], 0), [[0.5, 0.3], [0.44, 0.27], [0.34, 0.24], [0.26, 0.22]], { sides: 8 });               // jaw
  for (const s of [1, -1]) {
    S.blob([1.2, 3.85, s * 0.3], [0.5, 0.46, 0.2], { zone: 0, rings: 5, sides: 8 });                                                                        // cheek
    S.tube([[1.25, 4.42, s * 0.3], [1.5, 4.36, s * 0.4], [1.72, 4.16, s * 0.36]], [0.1, 0.13, 0.08], { sides: 6 });                                          // brow
    S.blob([1.52, 4.2, s * 0.43], [0.15, 0.13, 0.08], { zone: 8, rings: 4, sides: 6 });                                                                      // eye
    S.tube([[2.38, 2.92, s * 0.2], [2.52, 2.82, s * 0.27], [2.58, 2.66, s * 0.2]], [0.07, 0.11, 0.06], { sides: 6 });                                        // nostril
    S.leaf([0.62, 5.0, s * 0.36], [-0.2, 1, s * 0.2], [0.75, 0.25, s * 0.6], 1.0, 0.46, { zone: 0, th: 0.14, back: 0.4 });                                   // ear
    S.tube([[1.9, 3.5, s * 0.4], [1.45, 3.75, s * 0.52], [1.0, 4.05, s * 0.5]], [0.06], { sides: 5, zone: 3 });                                              // cheek strap, roughed in
  }
  for (let i = 0; i < 3; i++) {                                                                                                                             // three locks of mane, the lowest barely started
    const y = 4.55 - i * 0.75, x = 0.25 - i * 0.2, z = (i - 1) * 0.16;
    S.tube([[x, y, z], [x - 0.45, y + 0.3, z], [x - 1.0, y + 0.22, z * 2], [x - 1.5, y - 0.1, z * 3], [x - 1.75, y - 0.12, z * 3]],
      [[0.26, 0.3], [0.36, 0.3], [0.3, 0.22], [0.18, 0.12], 0.04], { sides: 7, zone: 0, sq: i * 0.45 });
  }
  S.tube([[1.05, 4.95, 0], [1.4, 4.8, 0], [1.75, 4.42, 0]], [[0.16, 0.24], [0.2, 0.26], 0.04], { sides: 6, zone: 0 });                                       // forelock
  // the block's glue lines: the foot is built of boards 0.7 m thick, the dark joints run round it, a dowel either side of each
  for (const y of [0.72, 1.44, 2.1]) {
    S.tube([[-1.78, y, -1.03], [0.78, y, -1.03], [0.78, y, 1.03], [-1.78, y, 1.03], [-1.78, y, -1.03]], [0.035], { sides: 4, zone: 8 });
    for (const s of [1, -1]) for (const x of [-1.1, 0.1]) S.blob([x + (y > 1 ? 0.3 : 0), y - 0.36, s * 1.02], [0.09, 0.09, 0.04], { zone: 8, rings: 3, sides: 6 });
  }
  for (const s of [1, -1]) S.tube([[2.3, 2.62, s * 0.3], [2.52, 2.52, s * 0.2]], [0.03, 0.025], { sides: 4, zone: 8 });                                       // mouth line
}
// loose parts on a bench top (metres, y up from the bench): a leg, a tail, two ears and an offcut; about 5 m by 2.6 m
function buildParts(S) {
  S.tube([[-2.3, 0.42, -0.7], [-1.5, 0.36, -0.75], [-0.6, 0.3, -0.5], [0.3, 0.22, -0.72], [1.0, 0.18, -0.6], [1.3, 0.2, -0.45]],
    [0.4, 0.3, 0.2, 0.15, 0.13, 0.19], { sides: 8 });                                                                                                       // leg laid on its side
  S.tube([[1.3, 0.2, -0.45], [1.62, 0.2, -0.3]], [0.2, 0.24], { sides: 8, round: 0.15 });                                                                    // its hoof
  S.tube([[-2.6, 0.4, -0.72], [-2.3, 0.42, -0.7]], [[0.3, 0.3], [0.4, 0.4]], { sides: 8, sq: 0.8 });                                                         // the square tenon
  S.tube([[-2.0, 0.3, 0.7], [-1.3, 0.45, 0.62], [-0.5, 0.42, 0.8], [0.3, 0.3, 0.6], [0.9, 0.2, 0.75]], [[0.26, 0.2], [0.4, 0.3], [0.36, 0.26], [0.22, 0.16], 0.04], { sides: 7 });   // tail
  S.tube([[-1.9, 0.26, 1.0], [-1.1, 0.3, 1.05], [-0.2, 0.22, 1.12], [0.5, 0.16, 0.98]], [[0.2, 0.16], [0.26, 0.2], [0.18, 0.14], 0.03], { sides: 6 });        // a second lock
  S.leaf([1.9, 0.14, 0.75], [1, 0.1, 0.3], [0, 1, 0.2], 1.0, 0.46, { zone: 0, th: 0.14, back: 0.4 });                                                        // ears
  S.leaf([2.2, 0.14, -0.1], [0.8, 0.1, -0.6], [0, 1, -0.2], 1.0, 0.46, { zone: 0, th: 0.14, back: 0.4 });
  S.tube([[1.9, 0.22, -1.0], [2.6, 0.22, -0.95]], [[0.22, 0.3]], { sides: 4, sq: 1.0 });                                                                     // offcut
}

function buildChariot(S) {
  S.tube(P2([[-1.9, 1.05], [-0.6, 0.85], [0.9, 0.85], [2.2, 1.1], [2.75, 1.6]], 0), [[0.34, 1.45], [0.3, 1.5], [0.3, 1.5], [0.3, 1.4], [0.24, 1.15]], { sides: 8, zone: 0, sq: 0.5, block: true });   // floor and footboard
  S.tube(P2([[-1.3, 1.5], [-1.2, 2.1], [-1.25, 2.25]], 0), [[0.5, 1.35], [0.55, 1.4], [0.5, 1.35]].map((r) => [r[0] * 0.5, r[1]]), { sides: 8, zone: 2, sq: 0.4 });   // bench
  S.burst([-1.95, 2.3, 0], [-1, 0.25, 0], 2.9, 9, { a0: -0.08, a1: Math.PI + 0.08, wid: 1.75, th: 0.16, boss: 0, zone: 0, alt: 0.92 });                          // shell back
  S.burst([-2.05, 2.3, 0], [-1, 0.25, 0], 1.2, 7, { a0: 0.1, a1: Math.PI - 0.1, wid: 0.4, th: 0.1, zone: 4 });
  for (const s of [1, -1]) {
    const sc = [], sr = [];                                                                                                                                 // scroll side
    for (let i = 0; i <= 12; i++) { const t = i / 12, a = -0.6 + t * 5.6, r = 0.2 + (1 - t) * 0.72; sc.push([-1.3 + t * 3.55 + Math.cos(a) * r * (t > 0.6 ? 1 : 0.5), 1.9 + (1 - t) * 1.3 + Math.sin(a) * r * 0.6, s * 1.5]); sr.push([0.32 - t * 0.14, 0.14]); }
    S.tube(sc, sr, { sides: 6, zone: 4, ref: [0, 0, 1] });
    S.tube([[-1.9, 1.5, s * 1.45], [0, 1.7, s * 1.5], [2.2, 1.6, s * 1.42]], [[0.75, 0.1], [0.8, 0.1], [0.5, 0.1]], { sides: 6, zone: 0, sq: 0.5 });           // side panel
    S.burst([0.2, 1.8, s * 1.62], [0, 0, s], 0.55, 10, { wid: 0.2 });
    for (let i = 0; i < 4; i++) S.leaf([-1.2 + i * 0.85, 1.25, s * 1.62], [1, 0.25 * ((i & 1) ? 1 : -1), 0], [0, 0.1, s], 0.8, 0.34, { zone: 3, th: 0.06 });
  }
}

// bar clamps left on a glued blank (zone 9, their wooden handles 9.4; the shader folds them away on the blanks that have had theirs taken off). A blank is three 0.3 m boards: BLANK_HALF is half its thickness.
const BLANK_HALF = 0.45;
function addClamps(S) {
  const b = S.body; if (!b) return;
  for (const f of [0.3, 0.68]) {
    const k = f * (b.pts.length - 1), i0 = Math.floor(k), i1 = Math.min(b.pts.length - 1, i0 + 1), t = k - i0;
    const x = b.pts[i0][0] + (b.pts[i1][0] - b.pts[i0][0]) * t, y = b.pts[i0][1] + (b.pts[i1][1] - b.pts[i0][1]) * t;
    const r0 = b.rad[Math.min(i0, b.rad.length - 1)], r1 = b.rad[Math.min(i1, b.rad.length - 1)], ru = Math.max(r0[0], r1[0]) * 1.06 + 0.04;
    const rs = BLANK_HALF, yt = y + ru + 0.22, o = { sides: 4, zone: 9, sq: 1, vary: 0.5, ao: 0.2, ref: [1, 0, 0] };
    S.tube([[x, yt, -rs - 0.5], [x, yt, rs + 0.9]], [[0.11, 0.07]], o);                                              // the bar
    S.tube([[x, yt, -rs - 0.42], [x, yt - 1.0, -rs - 0.42]], [[0.09, 0.16]], { ...o, ref: [0, 0, 1] });                // fixed jaw
    S.tube([[x, yt + 0.05, rs + 0.5], [x, yt - 1.0, rs + 0.5]], [[0.09, 0.16]], { ...o, ref: [0, 0, 1] });             // sliding jaw
    S.tube([[x, yt - 0.75, rs + 0.5], [x, yt - 0.75, rs + 0.06]], [0.07], { sides: 5, zone: 9, vary: 0.5, ao: 0.2 }); // screw
    S.tube([[x, yt - 0.75, rs + 0.5], [x, yt - 0.75, rs + 1.1]], [0.1, 0.13], { sides: 5, zone: 9.4, vary: 0.4 });     // its wooden handle
  }
}

// ---------------------------------------------------------------------------------------------------------
// ONE look for everything on the wheel: MeshStandardMaterial patched with (a) the crank motion, (b) the stage
// colours and (c) a faked reflection for gold (gloss 1), mirror (2) and dark polish (3).
// mode 'station': instanced animals (aData, iStage, iBody, iHair, iAlt); 'block': instanced glued blocks
// (iUp, iFwd, iBob); 'static': merged structure with vertex colours and aGloss.
function patchMaterial(mat, mode, U) {
  mat.customProgramCacheKey = () => 'carousel-works-' + mode;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    const K = `#define CW_YC ${YC.toFixed(3)}\n#define CW_YB ${YB.toFixed(3)}\n#define CW_THROW ${THROW.toFixed(3)}\n#define CW_STROKES ${STROKES.toFixed(1)}\n#define CW_BH ${BLANK_HALF.toFixed(2)}\n` + (mode === 'station' ? '#define CW_STATION\n' : '');
    let vHead = K + 'varying vec3 vCwCol; varying vec3 vCwFx; varying vec3 vCwObj; varying vec3 vCwWp;\nuniform float uTheta;\n', vMain = '', vNorm = '', vPos = '';
    if (mode === 'station') {
      vHead += `attribute vec3 aData; attribute vec3 aGr; attribute vec2 aPo; attribute float aHo; varying vec3 vCwGr; attribute vec4 iStage; attribute vec3 iBody; attribute vec3 iHair; attribute float iAlt; attribute float iLamp; varying float vCwLamp; varying float vCwPat;
        uniform vec3 uWood, uPrimer, uIron, uC1, uC2, uC3, uOchre, uGold; varying vec3 vCwR0; varying vec3 vCwR1; varying vec3 vCwR2;\n`;
      vMain = `float cwTh = uTheta * CW_STROKES + iStage.z; float cwS = sin(cwTh), cwC = cos(cwTh); float cwZone = aData.x;
        bool cwCrank = cwZone > 6.5 && cwZone < 7.5;\n`;
      vNorm = 'if (cwCrank) objectNormal.xy = vec2(objectNormal.x * cwC - objectNormal.y * cwS, objectNormal.x * cwS + objectNormal.y * cwC);\n';
      vPos = `// POSE, dealt per place from the station's own number (iStage.z): legs gathered under the body or stretched, the head carried higher or
        // lower and turned a little to one side; pole, crank and clamps keep still. A leg's and a head's vertices carry their share (aPo).
        if (cwZone < 5.5 || (cwZone > 7.5 && cwZone < 8.5)) {
          float cwP1 = fract(iStage.z * 1.731 + 0.13), cwP2 = fract(iStage.z * 4.117 + 0.57), cwP3 = fract(iStage.z * 2.393 + 0.31);
          transformed.x *= 1. - 0.4 * smoothstep(0.35, 0.65, cwP1) * aPo.x;
          float cwHa = mix(-0.06, 0.24, cwP2) * aPo.y, cwHc = cos(cwHa), cwHs = sin(cwHa);
          vec2 cwHq = transformed.xy - vec2(1.3, 4.7);
          transformed.xy = vec2(1.3, 4.7) + vec2(cwHq.x * cwHc - cwHq.y * cwHs, cwHq.x * cwHs + cwHq.y * cwHc);
          transformed.z += (cwP3 - 0.5) * 0.56 * aPo.y * cwHq.x;
        }
        // A GLUED BLANK (stage 1) is the same animal before a gouge has touched it: three 0.3 m boards glued side by side and band-sawn to the
        // animal's own side outline, so across it is flat stock; each leg is left standing on its outer board; none of the trappings exist yet
        // (a chariot at this stage is boards on its frame, not sawn stock: its stage is dealt as 1.25 and it keeps its form)
        if (iStage.x > 0.5 && iStage.x < 1.125 && (cwZone < 5.5 || (cwZone > 7.5 && cwZone < 8.5))) {
          if (cwZone > 1.36 || (cwZone > 0.01 && cwZone < 0.03)) transformed = vec3(0., CW_YB, 0.);
          else if (cwZone > 0.36 && cwZone < 0.5) transformed.z = sign(transformed.z - aGr.z) * 0.3 + 0.15 * clamp(aGr.z * 30., -1., 1.);
          else transformed.z = clamp(transformed.z * 6., -CW_BH, CW_BH) + 0.03 * transformed.z;
        }
        vCwObj = transformed; vCwGr = aGr;
        float cwSt = iStage.x, cwFr = iStage.y, cwV = aData.z;
        // TRAPPINGS, dealt per place: the saddle cloth and the straps take two of the scheme's colours, three ways
        float cwPk = fract(iStage.z * 5.137 + 0.21);
        vec3 cwClothC = cwPk < 0.34 ? uC1 : (cwPk < 0.67 ? uC3 : mix(uC2, uOchre, 0.3)), cwStrapC = cwPk < 0.34 ? uC3 : uC1;
        if (iAlt > 0.5 && cwPk >= 0.67) cwStrapC = uC3;
        if (cwCrank) { vec2 q = transformed.xy - vec2(0., CW_YC); transformed.xy = vec2(q.x * cwC - q.y * cwS, q.x * cwS + q.y * cwC) + vec2(0., CW_YC); }
        else {
          transformed.x += iStage.w * cwC * CW_THROW * (transformed.y - CW_YB) / (CW_YC - CW_YB);
          transformed.y += iStage.w * cwS * CW_THROW;
        }
        if (cwZone > 8.5 && (iAlt < 0.5 || cwSt > 1.5 || cwSt < 0.5)) transformed = vec3(0., CW_YB, 0.);      // bar clamps: still on some of the glued blanks, gone from the rest
        vec3 cwWood = uWood * (0.92 + 0.12 * cwV) * aData.y;                                    // pale even limewood: one tone, darker only in the hollows
        float cwAoB = mix(1., aData.y / max(1. - 0.46 * aHo, 0.3), 0.7);                        // under a coat of primer or paint: the form's own under-shade (the hollows are drawn per pixel, as the dirt line they hold)
        vec3 cwCol = cwWood; float cwGloss = 0., cwFacet = 0., cwPrimed = 0.;
        if (cwZone > 9.2) cwCol = uWood * vec3(0.5, 0.36, 0.24);
        else if (cwZone > 8.5) { cwCol = uIron * 1.5; cwGloss = 3.; }
        else if (cwZone > 5.5 && cwZone < 7.5) {
          cwCol = uIron * (0.75 + 0.5 * cwV); cwGloss = 3.;
          if (cwZone < 6.5) { cwCol = cwSt > 5.5 ? uGold : vec3(0.56, 0.33, 0.085); cwGloss = 1.; }                // every pole is brass, bright under the lamps (gilt on the finished quarter); cranks, hangers and rods are dark iron
        } else if (cwSt < 1.5) { cwCol = mix(uWood, vec3(dot(uWood, vec3(0.3333))), 0.38) * vec3(0.94, 0.92, 0.92) * (0.72 + 0.28 * aData.y); cwFacet = 2.; }   // glued stock: pale sawn deal, greyer than any carved wood and nothing like the brass of the poles
        else if (cwSt < 2.5) { cwCol = cwWood * 0.9; cwFacet = 1.; }
        else if (cwSt < 3.5) { cwCol = cwWood * 1.04; }
        else {
          vec3 prim = uPrimer * (0.9 + 0.14 * cwV) * cwAoB;                                      // one even coat (it lies darker in the hollows: the dirt line, per pixel)
          if (cwSt < 4.5) {                                                                      // primed: on the grey coat the scheme's underpainting is drawn, flat first coats on cloth and trappings
            vec3 cwUnder = prim;
            if (cwZone > 0.5 && cwZone < 1.5) cwUnder = prim * 0.74;
            else if (cwZone > 1.5 && cwZone < 4.5) cwUnder = mix(prim, (cwZone > 3.5 ? uOchre : (cwZone > 2.5 ? cwStrapC : cwClothC)) * cwAoB, 0.7);
            cwPrimed = step(vCwObj.y, 1.0 + cwFr * 22.);
            cwCol = mix(cwWood * 1.1, cwUnder, cwPrimed);
          }
          else {
            float pz = cwSt > 5.5 ? 9. : 0.6 + cwFr * 8.;
            vec3 c = iBody * (0.8 + 0.4 * cwV);
            if (cwZone > 0.5) c = iHair * (0.85 + 0.3 * cwV);
            if (cwZone > 1.15 && cwZone < 1.35) c = vec3(0.1, 0.185, 0.24) * (0.85 + 0.3 * cwV);          // the carp's wave: one quiet sea colour in every scheme
            if (cwZone > 1.5) c = cwClothC;
            if (cwZone > 2.5) c = cwStrapC;
            if (cwZone > 3.5) c = uOchre;
            if (cwZone > 4.5) c = uC2;
            cwCol = mix(prim, c * cwAoB, step(cwZone, pz));
            if (cwSt > 5.5) { if (cwZone > 3.5) { cwCol = uGold; cwGloss = 1.; } if (cwZone > 4.5) { cwCol = vec3(0.04); cwGloss = 2.; } }
            if (cwZone > 7.5) { cwCol = vec3(0.015); cwGloss = 3.; }
          }
        }
        if (cwZone > 7.5 && cwZone < 8.5 && cwSt > 1.5 && cwSt < 4.5) cwCol *= 0.24;                // an eye, a nostril, a mouth line: deep cuts, dark in the bare wood and under the primer
        vCwCol = cwCol; vCwFx = vec3(cwGloss, cwFacet, cwSt);
        #ifdef USE_INSTANCING
          mat3 cwM3 = mat3(modelViewMatrix) * mat3(instanceMatrix);
        #else
          mat3 cwM3 = mat3(modelViewMatrix);
        #endif
        vCwLamp = iLamp;
        // THE KEY LIGHT, one for the whole piece, by where it stands (vCwR0: toward the light; vCwR1.x: 1 on the wheel): on the wheel the wheel's own
        // lamps, fixed in its frame, from above, ahead and a little from the mast's side (so head, chest and back are lit and quarters and belly fall into shade); in the paint shop the white lamps over the aisle; in the
        // carving arm the bay's pendant (or, for what hangs above the lamps, the gold of the wheel bay); elsewhere in the bay the ring of pendants
        #ifdef USE_INSTANCING
          vec3 cwO = (modelMatrix * instanceMatrix * vec4(0., 4., 0., 1.)).xyz;
        #else
          vec3 cwO = (modelMatrix * vec4(0., 4., 0., 1.)).xyz;
        #endif
        float cwOr = length(cwO.xz); vec2 cwOh = cwO.xz / max(cwOr, 1e-3); vec3 cwKd;
        if (cwOr < 44.5) cwKd = vec3(-0.16 * cwOh.x - 0.62 * cwOh.y, 0.74, -0.16 * cwOh.y + 0.62 * cwOh.x);
        else if (cwO.x < -75.) cwKd = vec3(-6., 24. - cwO.y, -41. - cwO.z);
        else if (cwO.z > 75.) cwKd = cwO.y > 17. ? vec3(-cwO.x, 6., -cwO.z) : vec3((cwO.x < 0. ? -18. : 18.) - cwO.x, 21. - cwO.y, 88.5 + 27. * floor((cwO.z - 75.) / 27.) - cwO.z);
        else cwKd = vec3(-0.4 * cwOh.x - 0.3 * cwOh.y, 0.85, -0.4 * cwOh.y + 0.3 * cwOh.x);
        // (vCwR1.y: how far this piece stands under the wheel's lit quarter, by its own place in the wheel's frame; vCwR2: the hollow's depth, the zone, primer here)
        #ifdef USE_INSTANCING
          vec2 cwIp = instanceMatrix[3].xz;
        #else
          vec2 cwIp = vec2(1., 0.);
        #endif
        float cwLa = atan(cwIp.y, abs(cwIp.x) < 1e-4 ? 1e-4 : cwIp.x) - ${(SEAM + 40 * DEG).toFixed(5)}; cwLa -= 6.2831853 * floor(cwLa / 6.2831853 + 0.5);
        vCwR0 = cwKd / max(length(cwKd), 1e-3); vCwR1 = vec3(step(cwOr, 44.5), (1. - smoothstep(0.62, 1.2, abs(cwLa))) * step(cwOr, 44.5), 0.); vCwR2 = vec3(aHo, cwZone, cwPrimed);
        // a carved body's relief (1 hair, 2 fleece, 3 feathers, 4 scales; manes, tails and fins are stranded); on a glued blank, how far across the stock this corner lies
        vCwPat = cwSt < 1.5 ? aData.z * 2. - 1. : (cwZone < 0.5 ? floor(cwZone * 12.5 + 0.5) : (cwZone < 1.5 ? (cwZone > 1.04 && cwZone < 1.12 ? 3. : 1.) : (cwZone < 2.5 ? 6. + floor(fract(iStage.z * 7.919 + 0.4) * 4.) : 0.)));   // 6 to 9: the cloth's own pattern\n`;
    } else {
      vHead += 'attribute float aGloss;\n';
      vPos = `vCwObj = transformed; vCwCol = vec3(1.); vCwFx = vec3(aGloss, 0., 0.);
        if (aGloss > 4.75) {                                                                    // a pennant (gloss 5 at the staff to 5.9 at the fly's end): it ripples, more toward its end
          float cwF = (aGloss - 5.) * 1.1, cwPh = atan(transformed.z, transformed.x) * 43.;
          transformed.y += cwF * (0.55 * sin(uTheta * 48. + cwPh * 1.4) + 0.22 * sin(uTheta * 96. - cwPh * 3.1));
        }\n`;
    }
    sh.vertexShader = vHead + sh.vertexShader
      .replace('void main() {', 'void main() {\n' + vMain)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + vNorm)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vPos + `
        #ifdef USE_INSTANCING
          vCwWp = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;
        #else
          vCwWp = (modelMatrix * vec4(transformed, 1.)).xyz;
        #endif\n`);
    const fHead = K + `varying vec3 vCwCol; varying vec3 vCwFx; varying vec3 vCwObj; varying vec3 vCwWp;
      #ifdef CW_STATION
        varying vec3 vCwR0; varying vec3 vCwR1; varying vec3 vCwR2; varying float vCwLamp; varying float vCwPat; varying vec3 vCwGr;
      #endif
      uniform vec3 uSkyRef, uFloorRef, uBulbCol, uShaft, uGas, uPlank, uKey, uLamp, uLampP, uRoof, uRowOff, uDoor, uOchre, uFogArm, uFogBay, uFogPaint, uPortalC; uniform float uBulb, uCap, uFogBy, uTheta;` + SHAFT_GLSL + `
      float cwHash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float cwNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(cwHash(i), cwHash(i + vec3(1, 0, 0)), f.x), mix(cwHash(i + vec3(0, 1, 0)), cwHash(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(cwHash(i + vec3(0, 0, 1)), cwHash(i + vec3(1, 0, 1)), f.x), mix(cwHash(i + vec3(0, 1, 1)), cwHash(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
      vec3 cwEnv(vec3 r, float sharp) {
        float lights = 0.6 + 0.4 * sin(r.x * 7.0 / max(abs(r.y), 0.2) + r.z * 3.0);
        vec3 c = mix(uFloorRef, uSkyRef * mix(1., lights, sharp), smoothstep(-0.12, 0.22, r.y));
        float wall = smoothstep(-0.02, 0.08, r.y) * (1. - smoothstep(0.3, 0.46, r.y));
        c *= 1. - 0.72 * wall;
        c += uBulbCol * uBulb * wall * (0.3 + 0.7 * sharp * (0.5 + 0.5 * sin(r.x * 31.) * sin(r.z * 29.)));
        float key = max(dot(r, vec3(0., 0.8, -0.6)), 0.); key *= key; key *= key; key *= key;
        c += uSkyRef * key * key * 2.2;
        return c;
      }\n`;
    sh.fragmentShader = fHead + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float cwFw = length(fwidth(vCwObj)), cwBroadF = 0., cwBumpH = 0., cwSock = 9.;                           // cwBumpH: the tooled surface's height, metres (gouge flutes, brush strokes)                                         // cwBroadF: 1 on a glued blank's broad sawn face
        #ifdef CW_STATION
          // the wood's figure on a carved form: fine long grain that runs with the form it is cut from (vCwGr: metres along the form, and across
          // its section), nothing larger than a hand; it melts into one even tone where it is too fine for the picture
          float cwGrain = cwNoise(vec3(vCwGr.x * 0.8, vCwGr.yz * 12.)) * 0.62 + cwNoise(vec3(vCwGr.x * 2.4 + 7., vCwGr.yz * 29.)) * 0.38;
          cwGrain = mix(0.5, cwGrain, clamp(1.5 - cwFw * 12., 0., 1.));
        #else
          float cwGrain = cwNoise(vCwObj * 2.3) * 0.6 + cwNoise(vCwObj * 5.9 + 3.) * 0.4;
        #endif
        float cwPlank = step(3.5, vCwFx.x) * step(vCwFx.x, 4.75);
        float cwMatte = max(step(vCwFx.x, 0.5), cwPlank);
        float cwRaw = cwMatte * (1. - cwPlank) * step(vCwFx.z, 3.5) * step(0.5, vCwFx.z);          // bare wood: blocks, rough, sanded
        diffuseColor.rgb *= vCwCol * mix(1., 0.9 + 0.2 * cwGrain, cwMatte);
        #ifdef CW_STATION
          // every carved form carries its own under-shade: what faces the floor is darker, so belly, the insides of the legs and the underside of
          // neck and head stand apart from what faces the roof glass
          diffuseColor.rgb *= mix(1., 0.5 + 0.5 * smoothstep(-0.85, 0.3, inverseTransformDirection(normalize(vNormal), viewMatrix).y), step(vCwFx.x, 0.5));
          // CARVED RELIEF, by one rule for every sanded, primed and painted body wherever it stands: its coat is cut into the wood (hair in
          // strokes along the form, fleece in curls, feathers and scales in overlapping rows toward the tail), each cut with its own shade, so a
          // body seen close or cut by the picture's edge is a made surface and not a plain field. It melts away where it is too fine for the picture.
          if (vCwFx.x < 0.5 && vCwFx.z > 2.5 && vCwPat > 0.5 && vCwPat < 5.5) {
            // cwSs: how far round the barrel from the spine, in metres (every body's axis lies near y 4.4, its girth near 0.9), so the cuts are spaced
            // evenly over the back and flanks the eye looks down on, not bunched under the belly
            float cwNearR = clamp(1.7 - cwFw * 9., 0., 1.), cwSs = 1.8 * atan(abs(vCwObj.z) / max(vCwObj.y - 3.5, 0.06)), cwRel = 1., cwEdgeG = 0.;
            if (vCwPat < 1.5 || vCwPat > 4.5) {                                                       // hair: strokes of the V tool along the form (down a leg), each a little way and no further
              bool cwLeg = vCwPat > 4.5;
              float cwHs = (cwLeg ? vCwObj.x + 0.8 * vCwObj.z : cwSs) * 5.2 + 0.7 * cwNoise(vCwObj * vec3(0.8, 1.6, 1.6)), cwHi = floor(cwHs);
              float cwHg = smoothstep(0.4, 0.6, cwNoise(vec3((cwLeg ? vCwObj.y : vCwObj.x) * 1.3 + cwHi * 3.7, cwHi * 1.9, 4.)));
              float cwHl = 1. - smoothstep(0.05, 0.2, abs(fract(cwHs) - 0.5));
              cwRel = 0.95 + 0.1 * cwNoise(vCwObj * 4.3) - (vCwFx.z > 4.5 ? 0.11 : (vCwFx.z > 3.5 ? 0.1 : 0.)) * cwHl * cwHg;       // sanded wood is left smooth: the strokes are cut under the primer
              if (vCwFx.z > 4.5) cwRel *= 0.93 + 0.14 * cwNoise(vCwObj * 1.1 + 11.);                              // a painted coat is shaded by hand: broad and soft, never in patches
            } else if (vCwPat < 2.5) {
              vec2 cwQ2 = vec2(vCwObj.x, cwSs) * 3.1, cwQi = floor(cwQ2);
              float cwQh = cwHash(vec3(cwQi, 1.));
              vec2 cwQf = fract(cwQ2) - 0.5 - (vec2(cwQh, cwHash(vec3(cwQi, 2.))) - 0.5) * 0.3;
              float cwQd = length(cwQf), cwQo = dot(cwQf, vec2(cos(cwQh * 6.283), sin(cwQh * 6.283))) / max(cwQd, 1e-3);      // each curl opens on its own side
              cwRel = 0.7 + 0.4 * (0.5 + 0.5 * cos(cwQd * 21.)) * (1. - smoothstep(0.3, 0.62, cwQd)) * smoothstep(-0.7, 0.2, cwQo) + 0.14 * (1. - smoothstep(0., 0.5, cwQd));
            } else {
              vec2 cwKk = vCwPat < 3.5 ? vec2(1.5, 3.4) : vec2(1.7, 2.1);
              vec2 cwQ2 = vec2(-vCwObj.x * cwKk.x, cwSs * cwKk.y); cwQ2.y += 0.5 * mod(floor(cwQ2.x), 2.);
              float cwQd = length(vec2(fract(cwQ2.x), (fract(cwQ2.y) - 0.5) * 1.25));                              // from the root of this scale or feather toward its free edge
              cwRel = 0.8 + 0.26 * (1. - smoothstep(0., 0.6, cwQd)) - 0.42 * smoothstep(0.62, 0.9, cwQd) * (1. - smoothstep(0.9, 1.0, cwQd)) + 0.24 * smoothstep(0.9, 1.0, cwQd);
              if (vCwPat > 3.5 && vCwFx.z > 4.5) cwEdgeG = smoothstep(0.84, 0.93, cwQd) * cwNearR;      // a painted fish: every plate scale is lined along its free edge
            }
            diffuseColor.rgb *= mix(1., cwRel, cwNearR);
            diffuseColor.rgb = mix(diffuseColor.rgb, uOchre * 1.25, cwEdgeG * 0.7);
          }
          // THE DIRT LINE: under primer and paint a hollow (where one form meets another: leg and barrel, neck and shoulder, jaw and throat, a lock
          // on the crest) holds a dark line, soft toward the open surface, so every painted form is drawn round its joints
          if (vCwFx.x < 0.5 && vCwFx.z > 3.5 && vCwR2.y < 1.5) diffuseColor.rgb *= (1. - 0.3 * vCwR2.x) * (1. - 0.42 * smoothstep(0.45, 0.9, vCwR2.x));
          if (vCwFx.x < 0.5 && vCwFx.z > 1.5 && vCwFx.z < 3.5 && vCwPat < 5.5) {
            // CARVED BARE WOOD is glued up from boards 0.45 m thick: each lamination its own shade of the one tan, a fine dark glue line between two
            float cwLz = vCwObj.z / 0.45 + 0.5, cwLd = 0.5 - abs(fract(cwLz) - 0.5), cwLw = fwidth(cwLz) + 1e-4;
            diffuseColor.rgb *= (0.94 + 0.12 * cwHash(vec3(floor(cwLz), 2., 5.))) * (1. - 0.42 * (1. - smoothstep(0.014, 0.014 + cwLw, cwLd)) * clamp(0.03 / cwLw, 0.2, 1.));
            if (vCwPat > 0.5 && vCwPat < 4.5) {                                                       // and the carver's pencil is still on it: the centre line down the back and, on sanded work, station lines squared across it
              float cwPw = fwidth(vCwObj.z) + 1e-4, cwUp = smoothstep(0.1, 0.5, inverseTransformDirection(normalize(vNormal), viewMatrix).y);
              float cwPen = (1. - smoothstep(0.016, 0.016 + cwPw, abs(vCwObj.z))) * clamp(0.032 / cwPw, 0.2, 1.);
              float cwSx = vCwObj.x / 0.9 + 0.3, cwXw = fwidth(cwSx) + 1e-4;
              cwPen = max(cwPen, step(2.5, vCwFx.z) * 0.7 * (1. - smoothstep(0.014, 0.014 + cwXw, 0.5 - abs(fract(cwSx) - 0.5))) * clamp(0.028 / cwXw, 0.2, 1.));
              diffuseColor.rgb *= 1. - 0.5 * cwPen * cwUp;
            }
          }
          // A PAINTED CLOTH carries its own pattern in the scheme's ochre, dealt per place: lined, barred, lozenged or spotted
          if (vCwFx.x < 0.5 && vCwFx.z > 4.5 && vCwPat > 5.5) {
            float cwCn = clamp(1.5 - cwFw * 9., 0., 1.), cwCs = 1.8 * atan(abs(vCwObj.z) / max(vCwObj.y - 3.5, 0.06)), cwCm;
            if (vCwPat < 6.5) cwCm = 1. - smoothstep(0.05, 0.1, abs(abs(cwCs - 1.0) - 0.12));
            else if (vCwPat < 7.5) cwCm = smoothstep(0.3, 0.38, abs(fract(vCwObj.x * 1.7) - 0.5));
            else if (vCwPat < 8.5) { vec2 cwCq = vec2(vCwObj.x * 2.1 + cwCs * 2.1, vCwObj.x * 2.1 - cwCs * 2.1); cwCm = 1. - smoothstep(0.07, 0.13, min(abs(fract(cwCq.x) - 0.5), abs(fract(cwCq.y) - 0.5))); }
            else { vec2 cwCq = vec2(vCwObj.x * 2.3, cwCs * 2.3); cwCq.x += 0.5 * mod(floor(cwCq.y), 2.); cwCm = 1. - smoothstep(0.17, 0.24, length(fract(cwCq) - 0.5)); }
            diffuseColor.rgb = mix(diffuseColor.rgb, uOchre * 1.15, cwCm * cwCn * 0.85);
          }
        #endif
        #ifdef CW_STATION
        if (vCwFx.y > 0.5 && vCwFx.y < 1.5) {                                                       // roughed out: shallow gouge flutes in rows that follow the form, each a run of short strokes; no facets
          float cwGr0 = max(length(vCwGr.yz), 0.12), cwGa = atan(vCwGr.z, abs(vCwGr.y) + 1e-4) * cwGr0 / 0.1, cwGi = floor(cwGa), cwGf = fract(cwGa);
          // cuts a hand wide and half a metre long, each only a shade off its neighbour: from the flown line a roughed body is one smooth form
          // with a tooled surface, never bands; they melt into one tone well before they are as fine as the picture's grain
          float cwGl = vCwGr.x / 0.5 + cwHash(vec3(cwGi, 3., 1.)), cwGn = clamp(1.25 - cwFw * 15., 0., 1.);
          float cwFl = 0.93 + 0.12 * abs(cwGf - 0.5) * 2. - 0.1 * (1. - smoothstep(0., 0.14, fract(cwGl)));
          diffuseColor.rgb *= mix(1., cwFl * (0.97 + 0.06 * cwHash(vec3(cwGi, floor(cwGl), 5.))), cwGn);
          cwBumpH = -0.013 * (1. - 4. * (cwGf - 0.5) * (cwGf - 0.5)) * cwGn * (0.35 + 0.65 * cwHash(vec3(cwGi, floor(cwGl), 8.))) * smoothstep(0., 0.2, fract(cwGl)) * (1. - smoothstep(0.85, 1., fract(cwGl)));                          // each flute is a hollow a hand wide: one edge takes the lamp, the other falls dark
        }
        #endif
        if (vCwFx.z > 3.5 && vCwFx.z < 4.5 && vCwFx.x < 0.5) {                                      // primer: one even coat of warm grey, thin in places
          float cwNearP = clamp(1. - cwFw * 7., 0., 1.);
          float cwBr = cwNoise(vCwObj * 3.1) * 0.6 + cwNoise(vCwObj * 7.7 + 3.) * 0.4;
          float cwThin = smoothstep(0.52, 0.86, cwNoise(vCwObj * 1.4 + 7.) * 0.7 + cwBr * 0.3);       // where the coat is thin the wood shows warm through it
          diffuseColor.rgb *= mix(1., 0.95 + 0.1 * cwBr, cwNearP);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.1, 0.98, 0.8), cwThin * 0.35);
          #ifdef CW_STATION
          {                                                                                         // laid on with a broad brush along the form: the strokes stand in the coat
            float cwBs = cwNoise(vec3(vCwGr.x * 0.9, vCwGr.yz * 26.)) * 0.65 + cwNoise(vec3(vCwGr.x * 2.1 + 5., vCwGr.yz * 55.)) * 0.35, cwBn = clamp(1.3 - cwFw * 14., 0., 1.);
            diffuseColor.rgb *= mix(1., 0.9 + 0.2 * cwBs, cwBn); cwBumpH = 0.012 * cwBs * cwBn;
          }
          #endif

        }
        if (vCwFx.y > 1.5) {                                                                        // a glued blank: boards 0.3 m thick side by side, band-sawn to the outline
          vec3 cwNo = cross(dFdx(vCwObj), dFdy(vCwObj)); cwNo = abs(cwNo) / max(length(cwNo), 1e-9);
          float cwBz = vCwObj.z / 0.3 + 0.5, cwBi = floor(cwBz), cwBd = 0.5 - abs(fract(cwBz) - 0.5), cwBw = fwidth(cwBz) + 1e-4;
          float cwSide = step(0.8, cwNo.z);                                                          // a broad face (the board's own surface); the rest are sawn edges
          float cwGlue = (1. - smoothstep(0.03, 0.03 + cwBw, cwBd)) * clamp(0.03 / cwBw, 0.25, 1.);
          vec3 cwEdge = diffuseColor.rgb * (0.86 + 0.18 * cwHash(vec3(cwBi, 3., 7.))) * (0.94 + 0.12 * cwNoise(vCwObj * vec3(26., 26., 2.)));
          float cwSq = (1. - smoothstep(0.05, 0.12, cwBd)) * smoothstep(0.5, 0.7, cwNoise(vCwObj * vec3(5., 5., 1.) + 3.));   // amber squeeze-out along the joints
          cwEdge = mix(cwEdge, vec3(0.4, 0.23, 0.07), cwSq * 0.4) * (1. - 0.75 * cwGlue);
          vec3 cwBroad = diffuseColor.rgb * (0.93 + 0.14 * cwNoise(vCwObj * 2.7));
          #ifdef CW_STATION
          {
            // a broad face is made work too: each layer is edge-glued from planks 0.8 m wide (seams along the form, stepped from layer to layer, each
            // plank its own tone and flat-sawn figure), pegged with dowels, and carries the pencilled outline the saw was kept proud of, with
            // the butts of its lengths
            float cwNearB = clamp(1. - cwFw * 8., 0., 1.);
            float cwPy = vCwObj.y / 0.8 + cwHash(vec3(cwBi, 5., 1.)), cwPd = 0.5 - abs(fract(cwPy) - 0.5), cwPw = fwidth(cwPy) + 1e-4;
            float cwSeam = (1. - smoothstep(0.025, 0.025 + cwPw, cwPd)) * clamp(0.025 / cwPw, 0.25, 1.);
            float cwFig = 0.5 + 0.5 * sin((vCwObj.y * 4.2 + 2.4 * cwNoise(vCwObj * vec3(0.45, 1.5, 1.)) + 0.7 * floor(cwPy)) * 6.2832);
            cwBroad *= (0.91 + 0.16 * cwHash(vec3(cwBi, floor(cwPy), 9.))) * (1. - 0.06 * cwFig * cwNearB) * (1. - 0.62 * cwSeam);
            vec2 cwDf = vec2((fract(vCwObj.x / 1.3 + 0.5 * floor(cwPy) + 0.37 * cwBi) - 0.5) * 1.3, (fract(cwPy) - 0.5) * 0.8);
            float cwDd = length(cwDf);
            cwBroad *= 1. - cwNearB * 0.16 * (1. - smoothstep(0.055, 0.075, cwDd));                      // (a dowel is a faint ring of end grain, never a spot)
            float cwCu = abs(vCwPat), cwLw = fwidth(vCwPat) + 1e-4;
            float cwPen = (1. - smoothstep(0.03, 0.03 + cwLw, abs(cwCu - 0.84))) * clamp(0.06 / cwLw, 0.25, 1.);
            // each plank is butted from lengths 2.6 m long, the butts stepped plank by plank: stacked stock, not a ruled grid
            float cwBu = vCwObj.x / 2.6 + cwHash(vec3(floor(cwPy), cwBi, 4.)), cwBud = 0.5 - abs(fract(cwBu) - 0.5), cwBuw = fwidth(cwBu) + 1e-4;
            cwBroad *= (0.95 + 0.1 * cwHash(vec3(floor(cwBu), floor(cwPy), cwBi + 2.))) * (1. - 0.5 * (1. - smoothstep(0.008, 0.008 + cwBuw, cwBud)) * clamp(0.016 / cwBuw, 0.2, 1.) * (1. - cwSeam));
            cwBroad *= 1. - 0.5 * cwPen;
          }
          #endif
          diffuseColor.rgb = mix(cwEdge, cwBroad, cwSide); cwBroadF = cwSide;
        }
        if (cwPlank > 0.5) {                                                                        // platform boards: soft joints at any distance
          float cwT = clamp((vCwFx.x - 4.) * 2., 0., 1.), cwD = min(cwT, 1. - cwT), cwTw = fwidth(cwT);
          float cwJ = (1. - smoothstep(0.03, 0.03 + cwTw + 1e-5, cwD)) * clamp(0.03 / max(cwTw, 1e-4), 0.15, 1.);
          float cwRr = length(vCwObj.xz), cwPa = atan(vCwObj.z, abs(vCwObj.x) < 1e-4 ? 1e-4 : vCwObj.x);
          diffuseColor.rgb *= (1. - 0.72 * cwJ) * (0.9 + 0.2 * cwNoise(vec3(cwPa * 230., cwRr * 0.35, 3.)) * clamp(1.4 - cwFw * 5., 0., 1.)) * uPlank;   // radial boards: a fine figure along each, no dapple
          // THE DECK is dark oiled deal, far darker than any raw animal that stands on it: a worn ring round every pole's socket where
          // the fitters turn, and two rows of nail heads along each of the sixteen sweeps the boards are nailed to
          diffuseColor.rgb *= vec3(0.2, 0.14, 0.09);
          float cwDa = (${SEAM.toFixed(5)} - atan(vCwObj.z, vCwObj.x)) / 6.28319, cwNearD = clamp(1. - cwFw * 3., 0., 1.);
          vec3 cwRowN = vec3(${ROWS[0].n}., ${ROWS[1].n}., ${ROWS[2].n}.), cwRowR = vec3(${ROWS[0].r}., ${ROWS[1].r}., ${ROWS[2].r}.);
          vec3 cwAf = (fract(cwDa * cwRowN - uRowOff + 0.5) - 0.5) / cwRowN * 6.28319 * cwRr, cwDr = vec3(cwRr) - cwRowR;
          vec3 cwSd = sqrt(cwAf * cwAf + cwDr * cwDr);
          float cwSk = min(cwSd.x, min(cwSd.y, cwSd.z)); cwSock = cwSk;
          diffuseColor.rgb *= 1. - 0.22 * smoothstep(0.55, 0.9, cwSk) * (1. - smoothstep(1.5, 2.1, cwSk));
          float cwNa = (fract(cwDa * 16. + 0.5) - 0.5) / 16. * 6.28319 * cwRr;
          float cwNd = length(vec2(abs(cwNa) - 0.2, (fract(cwRr / 0.62) - 0.5) * 0.62));
          diffuseColor.rgb *= 1. - 0.6 * (1. - smoothstep(0.035, 0.06, cwNd)) * cwNearD;
        }
        if (vCwFx.x > 0.5 && vCwFx.x < 1.5) diffuseColor.rgb *= 0.4;
        {                                                                                           // north shafts; the racks at the walls sit in shade
          float cwBay = step(abs(vCwWp.x), 76.) * step(abs(vCwWp.z), 76.);
          float cwDim = mix(1., uShaft.z, smoothstep(47., 60., length(vCwWp.xz)) * cwBay);
          diffuseColor.rgb *= uShaft.x * cwDim + uShaft.y * cwShaft(vCwWp) * (0.4 + 0.6 * cwDim);
          if (cwRaw > 0.5) diffuseColor.rgb = min(diffuseColor.rgb, vec3(0.7, 0.56, 0.36));       // bare wood stays a warm pale tan in the brightest shaft
        }\n`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        #ifdef CW_STATION
        {                                                                                           // a glued blank is sawn stock: its broad faces are flat (its sawn edges keep the form's own turning, so no edge is one hard dark block)
          vec3 cwFn = cross(dFdx(vViewPosition), dFdy(vViewPosition)); float cwFl2 = dot(cwFn, cwFn);
          if (vCwFx.y > 1.5 && vCwFx.z < 1.125 && cwBroadF > 0.5 && cwFl2 > 1e-20) { normal = cwFn * inversesqrt(cwFl2); nonPerturbedNormal = normal; }
          // the tooled surface turns the light: the height worked out with the colour (cwBumpH) tilts the normal, so a flute or a brush stroke has a lit edge and a dark one
          vec3 cwBx = dFdx(vViewPosition), cwBy = dFdy(vViewPosition); vec3 cwB1 = cross(cwBy, normal), cwB2 = cross(normal, cwBx);
          float cwBd = dot(cwBx, cwB1); vec2 cwBh = vec2(dFdx(cwBumpH), dFdy(cwBumpH));
          if (abs(cwBd) > 1e-12 && dot(cwBh, cwBh) < 1e-2) normal = normalize(abs(cwBd) * normal - sign(cwBd) * (cwBh.x * cwB1 + cwBh.y * cwB2));
        }
        #endif\n`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = (vCwFx.x > 0.5 && vCwFx.x < 3.5) ? 0.56 : (vCwFx.x > 3.5 ? 0.46 : (vCwFx.z > 4.5 ? 0.55 : (vCwFx.z > 2.5 && vCwFx.z < 3.5 ? 0.6 : 0.86)));   // the deck is oiled; sanded wood is satin\n`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec3 cwN = inverseTransformDirection(normal, viewMatrix);
          vec3 cwV = inverseTransformDirection(normalize(vViewPosition + vec3(0., 0., 1e-5)), viewMatrix);
          vec3 cwR = reflect(-cwV, cwN);
          float cwF = 1. - max(dot(cwN, cwV), 0.); cwF = 0.2 + 0.8 * cwF * cwF;
          if (vCwFx.x < 0.5) { if (vCwFx.z > 4.5) totalEmissiveRadiance += cwEnv(cwR, 0.2) * cwF * 0.13; }
          else if (vCwFx.x < 1.5) { vec3 cwG = vCwCol * cwEnv(cwR, 0.45) * 2.1 * (0.75 + 0.25 * cwGrain) * (0.3 + 0.7 * uBulb); totalEmissiveRadiance += cwG / (1. + 0.45 * max(cwG.r, max(cwG.g, cwG.b))); }   // (gilt and brass go dull with the lamps in the rare failure)
          else if (vCwFx.x < 2.5) totalEmissiveRadiance += cwEnv(cwR, 1.) * vec3(0.86, 0.92, 0.96) * 0.95;
          else if (vCwFx.x > 3.5) totalEmissiveRadiance += cwEnv(cwR, 0.3) * cwF * 0.05;
          else totalEmissiveRadiance += cwEnv(cwR, 0.6) * cwF * 0.25;
          // gas light (evening): the ring of pendants round the wheel bay (radius 53, y 20) lights whatever faces outward and upward, warm against
          // the blue of the glass; in the arms the pendants hang overhead. uGas is black by day and falls with the bulbs in the rare failure.
          float cwRr = length(vCwWp.xz);
          vec3 cwL = vec3(vCwWp.x, 0., vCwWp.z) * (53. / max(cwRr, 1e-3)) + vec3(0., 20., 0.) - vCwWp;
          float cwD2 = dot(cwL, cwL), cwNl = dot(cwN, cwL) / sqrt(max(cwD2, 1e-4));
          float cwLit = (0.05 + 0.95 * smoothstep(-0.2, 0.8, cwNl)) / (1. + cwD2 / 900.) * (1. - smoothstep(46., 58., cwRr));
          float cwBayK = step(abs(vCwWp.x), 76.) * step(abs(vCwWp.z), 76.);
          float cwTake = vCwFx.x < 0.5 ? 1. : (vCwFx.x > 4.75 ? 1. : (vCwFx.x > 3.5 ? 0.4 : (vCwFx.x < 1.5 ? 0.5 : (vCwFx.x < 2.5 ? 0. : 0.6))));   // (the deck's dark oiled boards give little of the lamps back as a wash)
          #ifdef CW_STATION
            // FORM BY ONE KEY, by place (vCwR0, worked out once for the whole piece): about three to one over the cool fill of the glass, with a
            // warm bounce off the boards from below. On the wheel it is the wheel's own lamps and turns with it; off the wheel it is the lamp
            // the piece stands under (below, with iLamp).
            float cwKey = max(dot(cwN, vCwR0), 0.), cwOnW = vCwR1.x;
            totalEmissiveRadiance += diffuseColor.rgb * uGas * (cwOnW * (0.14 + 0.36 * cwKey + 0.12 * max(-cwN.y, 0.))) * cwTake;
            totalEmissiveRadiance += diffuseColor.rgb * uLamp * (0.12 * (1. - cwBayK) * (0.2 + 0.8 * cwKey)) * cwTake;
            // THE SATIN OF SANDED WOOD, PRIMER AND PAINT: the same key lays one soft highlight along whatever is turned between it and the eye (the
            // back, the crest of the neck, the top of a haunch), a tight core in a broad bloom, in the colour of the lamps that make it: on the
            // wheel its own lamps and, under the lit quarter, the bulbs; off the wheel the lamp the piece stands under. Dimmer in a hollow.
            if (vCwFx.x < 0.5 && vCwFx.z > 2.5) {
              float cwHd = max(dot(cwN, normalize(vCwR0 + cwV + vec3(0., 1e-3, 0.))), 0.), cwH2 = cwHd * cwHd, cwH4 = cwH2 * cwH2, cwH16 = cwH4 * cwH4; cwH16 *= cwH16;
              float cwSp = vCwFx.z > 4.5 ? 0.5 * cwH16 * cwH4 + 0.11 * cwH4 : (vCwFx.z > 3.5 ? 0.1 * cwH16 + 0.07 * cwH4 : 0.16 * cwH16 + 0.05 * cwH4);
              vec3 cwSc = cwOnW * (uGas * 0.6 + uBulbCol * (uBulb * vCwR1.y * 0.42)) + mix(uLamp, uLampP, 1. - smoothstep(-82., -74., vCwWp.x)) * (vCwLamp * 0.5);
              float cwHn = max(dot(cwN, normalize(vec3(0., 0.8, -0.6) + cwV + vec3(0., 1e-3, 0.))), 0.); cwHn *= cwHn; cwHn *= cwHn; cwHn *= cwHn;
              totalEmissiveRadiance += ((cwSc * (0.55 + 1.3 * diffuseColor.rgb)) * cwSp + uKey * (0.05 * cwHn * cwHn * (vCwFx.z > 4.5 ? 1. : 0.5))) * (1. - 0.6 * vCwR2.x);
            }
          #else
            totalEmissiveRadiance += diffuseColor.rgb * (uGas * cwLit + uLamp * (0.19 * (1. - cwBayK) * (0.35 + 0.65 * max(cwN.y, 0.)))) * cwTake;
          #endif
          // THE BAY'S ROOF GLASS ON THE WHEEL'S CROWN, a rule of the bay and not of the eye: whatever of the wheel stands above its cranks (sweeps,
          // rounding boards, tie rods, mast head, canopy, pennants) is nearest the glass of all six teeth and takes their light on every face
          totalEmissiveRadiance += diffuseColor.rgb * uRoof * (smoothstep(15., 20., vCwWp.y) * (1. - smoothstep(46., 58., cwRr)) * (0.62 + 0.38 * cwN.y) * cwTake);
          // the open east doors (x 75, z 30 to 62), by place alone: a body that stands in the band the opening throws toward the mast
          // (the hall's floor carries the same band) takes its light on the faces turned to the doors
          { vec2 cwDq = vCwWp.xz - vec2(75., 46.); float cwDs = dot(cwDq, vec2(-0.852, -0.523)), cwDt = dot(cwDq, vec2(-0.523, 0.852)), cwDw = 13.5 + 0.05 * cwDs, cwDe = 0.6 + 0.085 * cwDs;
            float cwDa = (1. - smoothstep(cwDw - cwDe, cwDw + cwDe, abs(cwDt))) * mix(1., 0.36, smoothstep(0., 92., cwDs)) * (1. - smoothstep(84., 108., cwDs));
            vec3 cwDl = vec3(0.79, 0.38, 0.485);
            // the deck's own boards take it only at the platform's rim (the work stands on a darker floor); all that stands above them takes it whole
            float cwDk = cwDa * (0.14 + 0.86 * max(dot(cwN, cwDl), 0.)) * (1. - smoothstep(12., 27., vCwWp.y)) * mix(smoothstep(38.5, 42.6, length(vCwWp.xz)), 1., smoothstep(3.3, 3.9, vCwWp.y));
            // and what the lit boards throw back either side of the band, on low things (the racks beside the doors, the platform's flank)
            cwDk += 0.3 * (1. - smoothstep(cwDw - 4., cwDw + 26., abs(cwDt))) * smoothstep(-8., 2., cwDs) * mix(1., 0.4, smoothstep(0., 92., cwDs)) * (1. - smoothstep(84., 108., cwDs)) * (1. - smoothstep(1., 15., vCwWp.y))
              * mix(smoothstep(38.5, 42.6, length(vCwWp.xz)), 1., smoothstep(3.3, 3.9, vCwWp.y));
            totalEmissiveRadiance += diffuseColor.rgb * uDoor * (cwDk * cwBayK * max(cwTake, 0.3)); }
          // the north glass as a key (shader light: the hall has one HemisphereLight and the wheel's two lamps, no other real light)
          totalEmissiveRadiance += diffuseColor.rgb * uKey * (max(dot(cwN, vec3(0., 0.8, -0.6)), 0.) * 0.318);
          #ifdef CW_STATION
            // a copy off the wheel stands in the light of the hall's own lamps: how much reaches it is worked out once where it stands (iLamp)
            totalEmissiveRadiance += diffuseColor.rgb * mix(uLamp, uLampP, 1. - smoothstep(-82., -74., vCwWp.x)) * (vCwLamp * (0.3 + 1.25 * cwKey + 0.12 * max(-cwN.y, 0.)) * max(cwTake, 0.35));
          #endif
          float cwRim = 1. - max(dot(cwN, cwV), 0.); cwRim *= cwRim * cwRim;                        // bare wood takes a warm rim from the lit quarter
          totalEmissiveRadiance += diffuseColor.rgb * uBulbCol * (cwRaw * uBulb * 0.3 * cwRim * (0.4 + 0.6 * max(cwN.y, 0.)));
          totalEmissiveRadiance += diffuseColor.rgb * (uKey * 0.3 + uGas * 0.22) * (cwRim * step(vCwFx.x, 0.5) * (0.5 + 0.5 * cwN.y));   // and every matte form a rim of the hall's light
          #ifdef CW_STATION
            // a spare in the wall racks stands in shade, but the glass above the racks lays its light along its back and rims it, in every look
            totalEmissiveRadiance += diffuseColor.rgb * uRoof * (smoothstep(47., 60., cwRr) * cwBayK * (1.2 * smoothstep(0.1, 0.85, cwN.y) + 1.5 * cwRim));
            // the portal's gold (the freight doorway, x -170) on whatever of the paint shop's work faces it
            { vec3 cwPv = vec3(-170., 12., -41.) - vCwWp; float cwP2 = dot(cwPv, cwPv);
              totalEmissiveRadiance += diffuseColor.rgb * uPortalC * (max(dot(cwN, cwPv * inversesqrt(max(cwP2, 1.))), 0.) / (1. + cwP2 / 700.) * step(vCwWp.x, -76.) * step(-176., vCwWp.x) * max(cwTake, 0.35)); }
          #else
            if (vCwFx.x > 3.5 && vCwFx.x < 4.75) {
              // THE DECK MIRRORS THE BULBS (it reads the eye, as the hall's floor does): the eye's line to each board is turned up off the oil and
              // followed to the rings the bulbs hang in (the rounding boards at radius 43.3, y 17 to 21; the three rows' rings at y 18), and where it
              // meets one within the lit quarter (the wheel's frame) the board shows that ring's gold, drawn out by the satin of the oil and
              // broken at every joint between two boards. So the bulbs lie in the dark deck as soft gold bands that keep their place as the eye moves,
              // with a low pool round each brass socket of the quarter. No light is added and nothing is drawn twice.
              vec3 cwVd = vCwWp - cameraPosition; cwVd /= max(length(cwVd), 1e-3);
              vec3 cwRd = vec3(cwVd.x, max(-cwVd.y, 0.03), cwVd.z);
              float cwA2 = max(dot(cwRd.xz, cwRd.xz), 1e-4), cwB2 = dot(vCwWp.xz, cwRd.xz), cwP2 = dot(vCwWp.xz, vCwWp.xz), cwBand = 0.;
              vec4 cwRingR = vec4(43.3, 30.37, 22.37, 14.37), cwRingY = vec4(19.2, 18.0, 18.0, 18.0), cwRingS = vec4(1.1, 0.55, 0.55, 0.55), cwRingG = vec4(0.52, 0.36, 0.3, 0.26);
              vec4 cwDisc = vec4(cwB2 * cwB2) - cwA2 * (vec4(cwP2) - cwRingR * cwRingR), cwRoot = sqrt(max(cwDisc, vec4(0.)));
              vec4 cwSf = (vec4(-cwB2) + cwRoot) / cwA2;                                              // each ring's far crossing along the mirrored line
              vec4 cwDy = (vec4(vCwWp.y) + cwSf * cwRd.y - cwRingY) / (cwRingS + 0.04 * cwSf);
              vec4 cwHx = vec4(vCwWp.x) + cwSf * cwRd.x, cwHz = vec4(vCwWp.z) + cwSf * cwRd.z;
              vec4 cwHa = vec4(atan(cwHz.x, abs(cwHx.x) < 1e-4 ? 1e-4 : cwHx.x), atan(cwHz.y, abs(cwHx.y) < 1e-4 ? 1e-4 : cwHx.y), atan(cwHz.z, abs(cwHx.z) < 1e-4 ? 1e-4 : cwHx.z), atan(cwHz.w, abs(cwHx.w) < 1e-4 ? 1e-4 : cwHx.w)) - uTheta - ${(SEAM + 40 * DEG).toFixed(5)};
              cwHa -= 6.2831853 * floor(cwHa / 6.2831853 + 0.5);
              vec4 cwHit = exp(-min(cwDy * cwDy, vec4(30.))) * (1. - smoothstep(vec4(0.42), vec4(0.86), abs(cwHa))) * smoothstep(vec4(0.), vec4(0.45), cwDisc / (cwA2 * cwRingR * cwRingR)) * step(vec4(0.), cwSf);   // (a line that only grazes a ring loses it softly: no cut edge on the boards)
              cwBand = dot(cwHit, cwRingG);
              float cwQa = atan(vCwObj.z, abs(vCwObj.x) < 1e-4 ? 1e-4 : vCwObj.x) - ${(SEAM + 40 * DEG).toFixed(5)}; cwQa -= 6.2831853 * floor(cwQa / 6.2831853 + 0.5);
              float cwQk = 1. - smoothstep(0.55, 0.85, abs(cwQa)), cwQt = clamp((vCwFx.x - 4.) * 2., 0., 1.);
              float cwQf = 1. - abs(cwVd.y); cwQf *= cwQf;
              totalEmissiveRadiance += uBulbCol * (uBulb * ((0.07 + 0.93 * cwQf) * cwBand * (0.8 + 0.4 * abs(cwQt - 0.5)) * (0.45 + 0.55 * smoothstep(0.02, 0.1, min(cwQt, 1. - cwQt))) + 0.05 * cwQk * exp(-cwSock * cwSock / 1.7)));
            }
          #endif
        }\n`)
      .replace('#include <opaque_fragment>', `
        #ifdef CW_STATION
          // bare and primed wood never burns out: what it gives back is eased under a ceiling (uCap), keeping its own colour
          // the glass's cool fill is held to about a third of the key on every carved form (a third of what the hemisphere gives)
          if (vCwFx.x < 0.5) outgoingLight = max(outgoingLight - 0.72 * reflectedLight.indirectDiffuse, vec3(0.));
          // primer is a warm grey-white and glued stock a pale tan whatever the colour of the light on them (the dusk's blue with the lamps' amber
          // would turn the one mauve, the noon's warm light the other mustard): most of the light's own hue is taken out of what they give back
          if (vCwFx.x < 0.5 && vCwR2.y < 1.5) {
            float cwNk = vCwFx.z > 3.5 && vCwFx.z < 4.5 ? 0.8 * vCwR2.z : (vCwFx.z > 0.5 && vCwFx.z < 1.5 ? 0.5 : (vCwFx.z > 1.5 && vCwFx.z < 3.5 ? 0.3 : 0.));
            outgoingLight = mix(outgoingLight, dot(outgoingLight, vec3(0.3, 0.55, 0.15)) * (vCwFx.z > 3.5 ? vec3(1.07, 1.0, 0.87) : vec3(1.1, 0.99, 0.8)), cwNk);
          }
          if (vCwFx.x < 0.5 && vCwFx.z > 0.5 && vCwFx.z < 4.5) { float cwM = max(outgoingLight.r, max(outgoingLight.g, outgoingLight.b)) / (uCap * (vCwFx.z > 3.5 ? 1.4 : 1.)); if (cwM > 0.55) outgoingLight *= (0.55 + 0.45 * (1. - exp(-(cwM - 0.55) / 0.45))) / cwM; }
        #else
          // THE DECK STAYS DARK UNDER THE LIT QUARTER: its oiled boards take an eighth of the two lamps as a wash and none of their gloss; what
          // they show of the bulbs is the mirrored band (above)
          if (cwPlank > 0.5) outgoingLight = max(outgoingLight - 0.875 * reflectedLight.directDiffuse - reflectedLight.directSpecular, vec3(0.));
        #endif
        #include <opaque_fragment>\n`)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          // the haze goes by the place of what is seen through it (the hall's own rule: uFogBy 1 in the works, 0 when the wheel stands alone)
          float cwFogK = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          vec3 cwFogC = mix(fogColor, mix(mix(uFogBay, uFogArm, smoothstep(72., 100., vCwWp.z)), uFogPaint, 1. - smoothstep(-96., -72., vCwWp.x)), uFogBy);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, cwFogC, cwFogK);
        #endif\n`);
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------------------
// Static builder for the wheel's structure: flat-shaded solids with vertex colour and gloss, merged into one mesh.
function makeStatic() {
  const P = [], N = [], C = [], G = [], I = [];
  const quad = (a, b, c, d, col, gl) => {            // a,b,c,d counter-clockwise seen from outside
    const k = P.length / 3, ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const p of [a, b, c, d]) { P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(col[0], col[1], col[2]); G.push(gl); }
    I.push(k, k + 1, k + 2, k, k + 2, k + 3);
  };
  const shade = (col, k) => [col[0] * k, col[1] * k, col[2] * k];
  const B = {
    quad, shade,
    // one platform board, a0..a1 at radius r0..r1: gloss runs 4 to 4.5 across its width so the shader can draw the joints
    plank(r0, r1, y, a0, a1, col) {
      const k = P.length / 3, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      for (const [x, z, gl] of [[r0 * c0, r0 * s0, 4], [r1 * c0, r1 * s0, 4], [r1 * c1, r1 * s1, 4.5], [r0 * c1, r0 * s1, 4.5]]) { P.push(x, y, z); N.push(0, 1, 0); C.push(col[0], col[1], col[2]); G.push(gl); }
      I.push(k, k + 2, k + 1, k, k + 3, k + 2);
    },
    // solid from 8 corners: bottom ring p[0..3] counter-clockwise seen from above, top ring p[4..7] above them
    hexa(p, col, gl = 0, faces = 63) {
      if (faces & 1) quad(p[4], p[5], p[6], p[7], col, gl);                       // top
      if (faces & 2) quad(p[0], p[3], p[2], p[1], shade(col, 0.55), gl);           // bottom
      for (let i = 0; i < 4; i++) if (faces & (4 << i)) { const j = (i + 1) % 4; quad(p[i], p[j], p[j + 4], p[i + 4], shade(col, i & 1 ? 0.86 : 0.94), gl); }
    },
    // box given centre, half sizes along a local frame (ax along, ay up, az across) rotated by yaw about y
    box(cx, cy, cz, hx, hy, hz, yaw, col, gl = 0, faces = 63) {
      const c = Math.cos(yaw), s = Math.sin(yaw), p = [];
      for (const y of [-hy, hy]) for (const [x, z] of [[-hx, -hz], [-hx, hz], [hx, hz], [hx, -hz]]) p.push([cx + x * c + z * s, cy + y, cz - x * s + z * c]);
      B.hexa(p, col, gl, faces);
    },
    // beam between two points with a rectangular section (w across, h up)
    beam(a, b, w, h, col, gl = 0, faces = 63) {
      const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1, sx = dz / l * w / 2, sz = -dx / l * w / 2, p = [];
      for (const y of [-h / 2, h / 2]) p.push([a[0] + sx, a[1] + y, a[2] + sz], [a[0] - sx, a[1] + y, a[2] - sz], [b[0] - sx, b[1] + y, b[2] - sz], [b[0] + sx, b[1] + y, b[2] + sz]);
      B.hexa(p, col, gl, faces);
    },
    // annular sector, angle a0..a1 (wheel frame, atan2(z,x)), seg pieces; col may be a function of the angle
    arc(r0, r1, y0, y1, a0, a1, seg, col, gl = 0, faces = 63) {
      for (let i = 0; i < seg; i++) {
        const A = a0 + (a1 - a0) * i / seg, Bq = a0 + (a1 - a0) * (i + 1) / seg, lo = Math.min(A, Bq), hi = Math.max(A, Bq);
        const c0 = Math.cos(lo), s0 = Math.sin(lo), c1 = Math.cos(hi), s1 = Math.sin(hi), p = [];
        for (const y of [y0, y1]) p.push([r0 * c0, y, r0 * s0], [r0 * c1, y, r0 * s1], [r1 * c1, y, r1 * s1], [r1 * c0, y, r1 * s0]);
        B.hexa(p, typeof col === 'function' ? col((lo + hi) / 2, i) : col, typeof gl === 'function' ? gl((lo + hi) / 2) : gl, faces);
      }
    },
    // round tube along points
    tube(pts, r, sides, col, gl = 0) {
      const m = pts.length, ring = [];
      for (let i = 0; i < m; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)];
        let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(t[0], t[1], t[2]) || 1; t = [t[0] / l, t[1] / l, t[2] / l];
        let u = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
        let v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]; const lv = Math.hypot(v[0], v[1], v[2]) || 1; v = [v[0] / lv, v[1] / lv, v[2] / lv];
        u = [v[1] * t[2] - v[2] * t[1], v[2] * t[0] - v[0] * t[2], v[0] * t[1] - v[1] * t[0]];
        const rr = Array.isArray(r) ? r[Math.min(i, r.length - 1)] : r, row = [];
        for (let j = 0; j < sides; j++) { const an = j / sides * TAU, c = Math.cos(an) * rr, s = Math.sin(an) * rr; row.push([pts[i][0] + u[0] * c + v[0] * s, pts[i][1] + u[1] * c + v[1] * s, pts[i][2] + u[2] * c + v[2] * s]); }
        ring.push(row);
      }
      const base = P.length / 3;
      for (let i = 0; i < m; i++) for (let j = 0; j < sides; j++) {
        const q = ring[i][j], c = pts[i]; let n = [q[0] - c[0], q[1] - c[1], q[2] - c[2]]; const l = Math.hypot(n[0], n[1], n[2]) || 1;
        P.push(q[0], q[1], q[2]); N.push(n[0] / l, n[1] / l, n[2] / l); const k = 0.8 + 0.2 * (n[1] / l); C.push(col[0] * k, col[1] * k, col[2] * k); G.push(gl);
      }
      for (let i = 0; i < m - 1; i++) for (let j = 0; j < sides; j++) { const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides; I.push(a, a + sides, b, b, a + sides, b + sides); }
    },
    // turned form about the y axis at (cx, cz): profile [[r, y]...] from bottom to top
    lathe(cx, cz, prof, sides, col, gl = 0) {
      const base = P.length / 3, m = prof.length;
      for (let i = 0; i < m; i++) {
        const a = prof[Math.max(0, i - 1)], b = prof[Math.min(m - 1, i + 1)]; let ny = -(b[0] - a[0]), nr = b[1] - a[1]; const l = Math.hypot(ny, nr) || 1; ny /= l; nr /= l;
        const cc = typeof col === 'function' ? col(i) : col;
        for (let j = 0; j < sides; j++) { const an = j / sides * TAU, c = Math.cos(an), s = Math.sin(an); P.push(cx + c * prof[i][0], prof[i][1], cz + s * prof[i][0]); N.push(c * nr, ny, s * nr); const k = 0.82 + 0.18 * Math.sin(j * 2.4 + i); C.push(cc[0] * k, cc[1] * k, cc[2] * k); G.push(typeof gl === 'function' ? gl(i) : gl); }
      }
      for (let i = 0; i < m - 1; i++) for (let j = 0; j < sides; j++) { const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides; I.push(a, a + sides, b, b, a + sides, b + sides); }
    },
    // a ribbon between two rows of points, seen from both sides; col(i) and gl(i) are given at each pair of points
    ribbon(top, bot, col, gl) {
      for (let side = 0; side < 2; side++) for (let i = 0; i < top.length - 1; i++) {
        const k = P.length / 3, q = side ? [top[i], bot[i], bot[i + 1], top[i + 1]] : [top[i], top[i + 1], bot[i + 1], bot[i]], ix = side ? [i, i, i + 1, i + 1] : [i, i + 1, i + 1, i];
        const ux = q[1][0] - q[0][0], uy = q[1][1] - q[0][1], uz = q[1][2] - q[0][2], vx = q[3][0] - q[0][0], vy = q[3][1] - q[0][1], vz = q[3][2] - q[0][2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
        for (let j = 0; j < 4; j++) { const c = col(ix[j]); P.push(q[j][0], q[j][1], q[j][2]); N.push(nx / l, ny / l, nz / l); C.push(c[0], c[1], c[2]); G.push(gl(ix[j])); }
        I.push(k, k + 1, k + 2, k, k + 2, k + 3);
      }
    },
    count: () => I.length / 3,
    finish() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aGloss', new THREE.Float32BufferAttribute(G, 1));
      g.setIndex(I);
      return g;
    },
  };
  return B;
}

// ---------------------------------------------------------------------------------------------------------
const SCHEMES = [
  null,                                                                    // 0: from the palette (scarlet, gold, deep green)
  { c1: '#1E3FA0', c2: '#D97890', c3: '#7E2A4A', gold: '#C9D2DA', ochre: '#8E98A4' },   // ultramarine, silver and rose
  { c1: '#EDE3C8', c2: '#E0A62E', c3: '#17161B', gold: null, ochre: null },             // cream, gold and black
];
const COATS = [                                                            // [body, hair] pairs per species
  [['#E9E2D0', '#3A2A20'], ['#9AA0A6', '#E8E4DA'], ['#7A3B1E', '#1E1512'], ['#1F1D20', '#D8D0BE'], ['#C79A55', '#3B2A1C']],   // horse
  [['#B98A55', '#F0E8D6'], ['#E6DFCF', '#B9A27E'], ['#8A6A4A', '#EFE6D2']],                                                    // hare
  [['#EFE9DA', '#CDB98A'], ['#D9CFB8', '#8A6A3A'], ['#3A3230', '#D8C9A0']],                                                    // ram
  [['#AAB7C2', '#3F5364'], ['#E8ECEF', '#56697A'], ['#6F8296', '#E3E8EC']],                                                    // heron
  [['#D9541E', '#F1E6CE'], ['#E8E2D2', '#C8281E'], ['#B8321E', '#E0A62E']],                                                    // carp
  [['#9A5A2C', '#E2D3AE'], ['#7B4A2A', '#D9C9A0'], ['#D8C9A8', '#6B4A2E']],                                                    // stag
];
const BUILDERS = [buildHorse, buildHare, buildRam, buildHeron, buildCarp, buildStag];
const ROWS = [{ r: 16, n: 14 }, { r: 24, n: 20 }, { r: 32, n: 26 }];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('carousel-works-hero');
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const lin = (h) => new THREE.Color(h);
  const arr = (c, k = 1) => [c.r * k, c.g * k, c.b * k];
  const schemeId = opts.scheme ?? rng.int(0, 2), castId = opts.cast ?? rng.int(0, 2), period = opts.period || 24, phase0 = opts.phase0 ?? 0;
  const sch = SCHEMES[schemeId] || {};
  const C1 = sch.c1 ? lin(sch.c1) : pal[3].clone(), C2 = sch.c2 ? lin(sch.c2) : pal[4].clone(), C3 = sch.c3 ? lin(sch.c3) : pal[6].clone();
  const GOLD = sch.gold ? lin(sch.gold).multiplyScalar(0.8) : pal[4].clone().multiplyScalar(0.95), OCHRE = sch.ochre ? lin(sch.ochre) : pal[4].clone().multiplyScalar(0.62);
  const WOOD = pal[0].clone().multiply(new THREE.Color(0.86, 0.79, 0.68)), IRON = pal[1].clone().multiplyScalar(0.5), UMBER = pal[2].clone();
  const PRIMER = new THREE.Color(0.5, 0.47, 0.4);                        // primer: a flat warm white, held under white in the lamps

  const U = {
    uTheta: { value: 0 }, uBulb: { value: 1 },
    uWood: { value: WOOD }, uPrimer: { value: PRIMER }, uIron: { value: IRON }, uC1: { value: C1 }, uC2: { value: C2 }, uC3: { value: C3 },
    uOchre: { value: OCHRE }, uGold: { value: GOLD },
    uSkyRef: { value: pal[5].clone().multiplyScalar(0.95) }, uFloorRef: { value: UMBER.clone().multiplyScalar(0.5) },
    uBulbCol: { value: new THREE.Color(1.0, 0.55, 0.2).multiplyScalar(1.6) },
    uShaft: { value: new THREE.Vector3(1, 0, 1) },          // x ambient share, y gain inside a north shaft, z how dim the wall racks are
    uGas: { value: new THREE.Color(0, 0, 0) },              // gas light from the hall's pendants (the world sets it in its evening look; black otherwise)
    uPlank: { value: new THREE.Color(1, 1, 1) },
    uDoor: { value: new THREE.Color(0, 0, 0) },             // sea light through the open east doors on whatever faces them (the world sets it in its noon look; black otherwise)
    uRowOff: { value: new THREE.Vector3() },                // where each row's first station stands, as a fraction of its spacing: the deck's wear is drawn round every socket
    uLamp: { value: new THREE.Color(0, 0, 0) },             // the hall's lamps on the copies that stand off the wheel (the world sets it)
    uLampP: { value: new THREE.Color(0, 0, 0) },            // the paint shop's white-shaded lamps on the copies in that room (west of x -78; the world sets it)
    uKey: { value: new THREE.Color(0, 0, 0) },              // the north glass as a key light, done in the shaders (the world sets it)
    uRoof: { value: new THREE.Color(0, 0, 0) },             // the bay's roof glass on the wheel's crown and on the backs of the rack spares (the world sets it)
    uPortalC: { value: new THREE.Color(0, 0, 0) },          // the portal's gold on the copies in the paint shop (the world sets it)
    uCap: { value: 0.3 },                                   // the ceiling under which bare and primed wood is eased (the world sets it by its exposure)
    uFogBy: { value: 0 }, uFogArm: { value: new THREE.Color(0, 0, 0) }, uFogBay: { value: new THREE.Color(0, 0, 0) }, uFogPaint: { value: new THREE.Color(0, 0, 0) },   // haze by place (the world sets these)
            // tint of the platform's boards (the world warms them in its evening look)
  };
  const object = new THREE.Group(); object.name = 'carousel-works-hero';
  const wheel = new THREE.Group(); wheel.name = 'wheel'; object.add(wheel);
  const fixed = new THREE.Group(); fixed.name = 'fixed'; object.add(fixed);

  // (0..5 serve the two inner rows, which stand behind the outer row from everywhere the flight goes: two thirds of the sides round each form)
  // ---- species geometries: 0..5 the carved animals, 6 bare pole and crank, 7 chariot, 8..13 the same six as glued blanks (pressed to sawn stock in the shader) ----
  const geos = [];
  for (let i = 0; i < 6; i++) { const S = makeSculpt(rng.fork('sp' + i), { lod: 0.66 }); await ctx.yield(); BUILDERS[i](S); await ctx.yield(); geos.push(S.finish()); await ctx.yield(); }
  { const S = makeSculpt(rng.fork('pole')); addPoleAndCrank(S, []); geos.push(S.finish()); }
  { const S = makeSculpt(rng.fork('chariot')); buildChariot(S); geos.push(S.finish()); }
  await ctx.yield();
  // 8..13: the six species once more for the stations at the glued-blank stage (all three rows): the animal's own form with an even count of
  // sides and its bar clamps, which the shader presses flat across into sawn stock
  for (let i = 0; i < 6; i++) { const S = makeSculpt(rng.fork('blank' + i), { lod: 0.66, even: true }); BUILDERS[i](S); addClamps(S); geos.push(S.finish()); await ctx.yield(); }
  // 14..19: the six species again at the finer level, for row three (the outer row, the 26 stations nearest the flown line). Their small tone
  // jitter comes from a fixed sequence of their own, so the world's and the wheel's streams deal exactly as before.
  for (let i = 0; i < 6; i++) {
    let q = 7919 + i * 104729; const fr = () => (q = (q * 16807) % 2147483647) / 2147483647; fr.range = (a, b) => a + (b - a) * fr();
    const S = makeSculpt(fr, { fine: true }); await ctx.yield(); BUILDERS[i](S); await ctx.yield(); geos.push(S.finish()); await ctx.yield();
  }

  // ---- stations ----------------------------------------------------------------------------------------
  const stations = [], dealR = rng.fork('stations'), castR = rng.fork('cast'), coatR = rng.fork('coats');
  const chariotAt = [[0, 322], [0, 108], [1, 252], [1, 150]];              // row, degrees from the seam
  for (let row = 0; row < 3; row++) {
    const { r, n } = ROWS[row], off = dealR.range(0, 1); U.uRowOff.value.setComponent(row, off);
    // the cast is dealt without replacement from a fixed bag for each row, so every seed has the same count of each species
    const bag = [];
    for (let i = 0; i < n; i++) {
      if (castId === 1) bag.push(i < Math.round(n * 0.58) ? 0 : 1 + (i % 5));
      else if (castId === 2) bag.push(row === 2 ? [1, 3, 5][i % 3] : [0, 2, 4, 0, 2, 4, 1, 3, 5][i % 9]);
      else bag.push((i + row * 2) % 6);
    }
    castR.shuffle(bag);
    if (castId !== 1) for (let pass = 0; pass < 3; pass++) for (let i = 0; i < n; i++) {     // neighbours in a row do not share a species where a swap can help
      if (bag[i] !== bag[(i + 1) % n]) continue;
      for (let j = 2; j < n - 1; j++) { const k = (i + j) % n, a = bag[(k + n - 1) % n], b = bag[(k + 1) % n], me = bag[(i + 1) % n], it = bag[k];
        if (it !== bag[i] && it !== bag[(i + 2) % n] && me !== a && me !== b) { bag[(i + 1) % n] = it; bag[k] = me; break; } }
    }
    for (let i = 0; i < n; i++) {
      const phi = SEAM - ((i + off) / n) * TAU, st = stageAt(phi);
      stations.push({ row, r, phi, ...st, species: bag[i], chariot: false, phase: dealR.range(0, TAU), lift: dealR.range(-0.25, 0.35) });
    }
  }
  for (const [row, deg] of chariotAt) {
    let best = null, bd = 1e9;
    for (const s of stations) if (s.row === row && !s.chariot) { const d = Math.abs(s.deg - deg); if (d < bd) { bd = d; best = s; } }
    best.chariot = true;
  }
  const stationMatrix = (s, m) => m.makeRotationY(-s.phi - Math.PI / 2).setPosition(s.r * Math.cos(s.phi), PLAT_Y, s.r * Math.sin(s.phi));
  const stationMat = patchMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0 }), 'station', U);
  const lists = []; for (let g = 0; g < 20; g++) lists.push([]);
  for (const s of stations) {
    if (s.chariot) { if (s.stage >= 1) lists[7].push(s); else lists[6].push(s); continue; }
    lists[s.stage >= 2 ? s.species : s.stage === 1 ? 8 + s.species : 6].push(s);
  }
  // coats are dealt in this order (species by species, as they always were); then row three's carved animals move to the finer geometries
  for (let g = 0; g < 14; g++) for (const s of lists[g]) { s.coat = g < 6 ? coatR.pick(COATS[g]) : ['#B8321E', '#E0A62E']; s.alt = coatR.chance(0.5) ? 1 : 0; }
  for (let g = 0; g < 6; g++) { lists[14 + g] = lists[g].filter((s) => s.row === 2); lists[g] = lists[g].filter((s) => s.row !== 2); }
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), col = new THREE.Color();
  const stationMeshes = [];
  for (let g = 0; g < 20; g++) {
    const L = lists[g], n = L.length; if (!n) { stationMeshes.push(null); continue; }
    const mesh = new THREE.InstancedMesh(geos[g], stationMat, n);
    const aSt = new Float32Array(n * 4), aBody = new Float32Array(n * 3), aHair = new Float32Array(n * 3), aAlt = new Float32Array(n);
    L.forEach((s, i) => {
      stationMatrix(s, M);
      mesh.setMatrixAt(i, M);
      aSt.set([g === 7 && s.stage === 1 ? 1.25 : s.stage, s.frac, s.phase, g === 7 ? 0 : 1], i * 4);
      if (g === 7) { col.copy(i & 1 ? C3 : C1); aBody.set([col.r, col.g, col.b], i * 3); col.copy(C2); }
      else { col.set(s.coat[0]); aBody.set([col.r, col.g, col.b], i * 3); col.set(s.coat[1]); }
      aHair.set([col.r, col.g, col.b], i * 3); aAlt[i] = s.alt;
    });
    mesh.geometry.setAttribute('iStage', new THREE.InstancedBufferAttribute(aSt, 4));
    mesh.geometry.setAttribute('iBody', new THREE.InstancedBufferAttribute(aBody, 3));
    mesh.geometry.setAttribute('iHair', new THREE.InstancedBufferAttribute(aHair, 3));
    mesh.geometry.setAttribute('iAlt', new THREE.InstancedBufferAttribute(aAlt, 1));
    mesh.frustumCulled = false; mesh.name = 'station-' + g; wheel.add(mesh); stationMeshes.push(mesh);
  }
  await ctx.yield();

  // ---- structure -----------------------------------------------------------------------------------------
  const B = makeStatic();
  const PINE = arr(WOOD, 0.8), OAK = arr(lin('#7A5632'), 0.75), IRONC = arr(IRON, 1.0), DARK = arr(UMBER, 0.6), GOLDC = arr(GOLD), PRIM = arr(PRIMER);
  const c1 = arr(C1), c3 = arr(C3), OCHREC = arr(OCHRE);
  const DEEPC = arr(schemeId === 1 ? C1 : C3, schemeId === 2 ? 1.0 : (schemeId === 1 ? 0.32 : 0.5));   // the scheme's deep colour: deep green, deep ultramarine, black
  const sweepPhi = (k) => SEAM - k * TAU / 16;
  const timberAt = (phi, k = 1) => { const st = stageAt(phi).stage; return st === 4 ? B.shade(PRIM, k) : st === 5 ? B.shade(c3, k) : st === 6 ? B.shade(c3, k) : B.shade(PINE, k * 0.9); };
  // platform: dark underlayer, three bands of radial planks, trim rings, rim fascia, skirt posts
  B.arc(9, 43, 2.3, 3.1, 0, TAU, 48, DARK);
  const bands = [[9, 20.3, 72], [20.3, 31.6, 120], [31.6, 43, 168]];
  for (const [r0, r1, n] of bands) {
    const off = rng.range(0, 1);
    for (let i = 0; i < n; i++) {
      const a0 = (i + off) / n * TAU, a1 = (i + 1 + off) / n * TAU, st = stageAt((a0 + a1) / 2).stage;
      let k = rng.range(0.8, 1.1) * (rng.chance(0.12) ? 0.72 : 1);
      const tint = st >= 5 ? [PINE[0] * 0.8, PINE[1] * 0.6, PINE[2] * 0.4] : st === 0 ? [PINE[0] * 0.92, PINE[1] * 0.8, PINE[2] * 0.62] : [PINE[0], PINE[1] * 0.85, PINE[2] * 0.62];   // honey deal, darker where it is finished
      B.plank(r0 + 0.04, r1 - 0.04, 3.2, a0, a1, B.shade(tint, k * 0.6));
    }
  }
  await ctx.yield();
  const gilt = (phi) => stageAt(phi).stage === 6;
  for (const r of [9.2, 20.3, 31.6]) B.arc(r - 0.24, r + 0.24, 3.16, 3.27, 0, TAU, 96, B.shade(IRONC, 0.7), 0, 1 | 4 | 16);   // the three ring rails let into the deck: dark iron lines all the way round
  B.arc(42.72, 43.3, 0.9, 3.06, 0, TAU, 128, (a, i) => { const st = stageAt(a).stage; return st <= 3 ? B.shade([PINE[0] * 0.82, PINE[1] * 0.68, PINE[2] * 0.5], 0.86 + 0.14 * ((i * 5) % 3) / 2) : st === 4 ? PRIM : st === 5 ? ((i & 3) === 0 ? DEEPC : B.shade(c1, 0.8)) : ((i & 3) === 0 ? GOLDC : B.shade(c1, 0.8)); },
    (a) => 0, 1 | 2 | 4 | 16);
  // THE KERB: a moulded edge in the scheme's deep colour wherever the wheel is painted (primed where it is primed, oak before), with one thin
  // line of leaf under it on the finished sectors
  B.arc(42.6, 43.42, 3.04, 3.2, 0, TAU, 128, (a) => stageAt(a).stage >= 5 ? DEEPC : B.shade(OAK, 1.0), 0, 1 | 2 | 4 | 16);
  B.arc(43.3, 43.46, 2.86, 2.98, SEAM, SEAM + 140 * DEG, 54, B.shade(OCHREC, 0.9), 0, 1 | 2 | 4 | 16);
  B.arc(42.66, 43.36, 0.75, 0.95, 0, TAU, 128, (a) => gilt(a) ? GOLDC : B.shade(OAK, 0.8), (a) => gilt(a) ? 1 : 0, 1 | 2 | 4 | 16);
  for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; B.box(42.1 * Math.cos(a), 1.2, 42.1 * Math.sin(a), 0.3, 1.2, 0.3, -a, B.shade(OAK, 0.7), 0, 60); B.box(26 * Math.cos(a), 1.2, 26 * Math.sin(a), 0.3, 1.2, 0.3, -a, B.shade(OAK, 0.6), 0, 60); }
  const BRASS = arr(lin('#B88A3A'), 0.9);
  for (const s of stations) if (!s.chariot) {                                // slot plate and brass socket where each pole passes through the deck
    const x = s.r * Math.cos(s.phi), z = s.r * Math.sin(s.phi);
    B.box(x, 3.25, z, 0.8, 0.05, 0.5, -s.phi - Math.PI / 2, s.stage === 6 ? GOLDC : B.shade(BRASS, 0.55), 1, 1 | 60);
    B.lathe(x, z, [[0.6, 3.24], [0.58, 3.52], [0.4, 3.7], [0.24, 3.7]], 8, B.shade(BRASS, 1.0), 3);   // dull brass: a leaf's gloss turned it white under the bulbs
  }
  const deckBodies = [];                                                     // row three's deck work: [radius of a body's far edge, its top y], for the world's count
  // FITTING-OUT of the unfinished sectors (bare iron and glued blanks) and THE DECK'S WORK of the carved ones. ALL of it stands in the one
  // lane between rows one and two (radius 18.2 to 21.7, astride the middle ring rail), behind two rows of animals from anywhere outside the
  // wheel: the lane between rows two and three and the outer deck hold nothing but their boards and the rails, all the way round. A station
  // of row one or two in the bare and blank sectors may have a kit there, half a station on: a trestle with a crank on it, an open tool
  // chest, or a coiled belt with a keg of bolts; no piece in the lane stands within 10 m of another (a kit that would is left out). The
  // poles that wait to be hung stand upright in a rack by the housing (radius 10.6 to 12.4), never laid on the deck.
  {
    const LEATHER = arr(lin('#6a4526')), STEELC = arr(lin('#9aa7b0'), 0.8), CHEST = B.shade(DEEPC, 1.5), TIMB = B.shade(PINE, 0.95), y0 = PLAT_Y;
    const post = (a, b, w, col, gl = 0) => { const p = []; for (const q of [a, b]) for (const [dx, dz] of [[-w, -w], [-w, w], [w, w], [w, -w]]) p.push([q[0] + dx, q[1], q[2] + dz]); B.hexa(p, col, gl); };
    const ringPts = (c, R, y, n = 12) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n * TAU; o.push([c[0] + Math.cos(t) * R, y, c[2] + Math.sin(t) * R]); } return o; };
    let kit = 0, n3 = 0, m3 = 0;
    const LANE = 19.3, taken = [], lone = (a) => taken.every((b) => Math.abs(((a - b) % TAU + TAU + Math.PI) % TAU - Math.PI) > 10 / LANE);
    for (const s of stations) if (s.row === 2 && s.stage >= 2 && s.stage <= 5 && !(m3++ % 2)) taken.push(s.phi - Math.PI / ROWS[2].n);   // the deck's work comes first: the kits fit round it
    await ctx.yield();
    // THE DECK'S WORK FOR ROW THREE, by one rule for each stage's sector: abreast of every other station of the outer row (half a station on)
    // one large piece of its stage's work stands in the lane between rows one and two. deckBodies lists the far edge and top of each body
    // (the world counts its distance from the flown line at every clock).
    const body = (r, top) => { deckBodies.push([r, top]); };
    for (const s of stations) {
      if (s.stage > 1 && (s.row !== 2 || s.stage > 5)) continue;
      await ctx.yield();
      const a = s.phi - Math.PI / ROWS[s.row].n, j1 = s.lift * 0.35, j2 = (s.phase / TAU) % 1, ct = Math.cos(a), sn = Math.sin(a);     // its jitter comes from the station's own dealt numbers
      if (s.row === 2) {
        if (s.stage < 2) continue;                                                                  // (the bare and the blank sectors have their kits, below)
        // FEW, LARGE AND DIFFERENT: for every OTHER station of the outer row one made thing of its stage, each some 5 m long and as tall as
        // a bench at this scale (four times life). Its tall parts keep to radius 18.5 to 20.4 and its low ones (cloths, heaps, shavings:
        // under 1 m) may lie out to 21.7.
        if (n3++ % 2) continue;
        const RC = 19.4, sg = j2 > 0.5 ? 1 : -1, L = (t, o, y) => { const an = a + t / RC; return [(RC + o) * Math.cos(an), y, (RC + o) * Math.sin(an)]; }, yaw = -a - Math.PI / 2;
        const bx = (t, o, y, hx, hy, hz, col, gl = 0, turn = 0) => { const q = L(t, o, y); B.box(q[0], q[1], q[2], hx, hy, hz, yaw - t / RC + turn, col, gl); };
        const lathe = (t, o, prof, sides, col, gl = 0) => { const q = L(t, o, 0); B.lathe(q[0], q[2], prof.map(([r, y]) => [r, y0 + y]), sides, col, gl); };
        const cloth = (col) => { bx(0, 0.35, 0.04 + y0, 2.7, 0.04, 1.45, col); bx(0.3 * sg, 0.45, y0 + 0.115, 2.1, 0.035, 0.85, B.shade(col, 1.35), 0, 0.07); bx(-2.72 * sg, 0.35, y0 + 0.1, 0.11, 0.1, 1.45, B.shade(col, 0.75)); body(RC + 1.8, y0 + 0.2); };
        if (s.stage === 2) {                                                                      // A PAIR OF TRESTLES with a carved leg across them in a hand-screw clamp, shavings under, the mallet on the deck
          for (const t of [-1.8, 1.8]) { bx(t, 0, y0 + 1.55, 0.17, 0.15, 0.95, TIMB); bx(t, 0, y0 + 0.75, 0.05, 0.08, 0.84, B.shade(PINE, 0.7));
            for (const o of [-0.74, 0.74]) for (const d of [-0.42, 0.42]) post(L(t + d, o * 1.22, y0), L(t + d * 0.3, o, y0 + 1.42), 0.11, B.shade(PINE, 0.82)); }
          B.tube([L(-2.95 * sg, 0, y0 + 2.2), L(-2.0 * sg, 0, y0 + 2.24), L(-0.9 * sg, 0, y0 + 2.14), L(0.1 * sg, 0, y0 + 2.02), L(0.75 * sg, 0, y0 + 2.04), L(1.8 * sg, 0, y0 + 1.94), L(2.5 * sg, 0, y0 + 1.92), L(2.95 * sg, 0, y0 + 1.92)],
            [0.47, 0.45, 0.33, 0.23, 0.29, 0.18, 0.21, 0.27], 8, B.shade(PINE, 1.12));
          bx(-3.2 * sg, 0, y0 + 2.2, 0.26, 0.3, 0.3, B.shade(PINE, 1.0));                                                                // the leg's square tenon
          for (const d of [-0.42, 0.42]) bx(0.9 * sg, 0, y0 + 2.04 + d, 0.2, 0.12, 0.72, B.shade(OAK, 1.15));                           // the clamp's two jaws
          for (const o of [-0.48, 0.48]) { B.tube([L(0.9 * sg, o, y0 + 1.5), L(0.9 * sg, o, y0 + 2.86)], 0.07, 5, B.shade(OAK, 0.8)); bx(0.9 * sg, o, y0 + 2.86, 0.3, 0.07, 0.07, B.shade(OAK, 1.2), 0, 0.7 * o); }
          for (const [t, o, R, tw] of [[-0.6, 0.9, 0.42, 0], [0.9, 1.25, 0.34, 1.9], [-1.9, 1.3, 0.3, 3.3]]) { const pts = []; for (let i = 0; i <= 10; i++) { const an = i / 10 * 5.4 + tw; pts.push(L(t * sg + i * 0.1 - 0.5, o + Math.cos(an) * R, y0 + R + 0.1 + Math.sin(an) * R)); } B.tube(pts, 0.11, 5, B.shade(PINE, 1.2)); }
          B.tube([L(2.3 * sg, 1.3, y0 + 0.4), L(3.1 * sg, 1.45, y0 + 0.4)], 0.4, 8, B.shade(OAK, 1.1)); B.tube([L(2.7 * sg, 1.38, y0 + 0.4), L(2.5 * sg, 0.2, y0 + 0.3)], 0.09, 6, B.shade(PINE, 1.0));
          body(RC + 0.47, y0 + 2.72); body(RC + 0.72, y0 + 2.6); body(RC + 0.58, y0 + 2.94); body(RC + 0.95, y0 + 1.7); body(RC + 1.9, y0 + 0.95);
        } else if (s.stage === 3) {                                                               // A WHEELBARROW heaped with sawdust, its wheel forward, a broom laid on the deck beside it, glasspaper on the heap
          const tw = 2.35 * sg, th = -2.9 * sg, DUST = [0.62, 0.5, 0.3];
          bx(0, 0, y0 + 1.02, 1.25, 0.1, 0.72, B.shade(OAK, 0.9));                                                                                  // the tray: its floor...
          for (const o of [-0.84, 0.84]) bx(0, o, y0 + 1.45, 1.45, 0.36, 0.07, B.shade(OAK, o > 0 ? 1.15 : 0.8));                                    // ...its two long sides
          bx(1.42 * sg, 0, y0 + 1.5, 0.07, 0.42, 0.8, B.shade(OAK, 1.0), 0); bx(-1.42 * sg, 0, y0 + 1.42, 0.07, 0.32, 0.8, B.shade(OAK, 0.9));       // head board and tail board
          lathe(0, 0, [[1.05, 1.5], [0.8, 1.9], [0.36, 2.2], [0.02, 2.3]], 9, (i) => i > 1 ? B.shade(DUST, 1.2) : DUST, 0);                         // the heap
          bx(0.3 * sg, 0.1, y0 + 2.2, 0.36, 0.012, 0.28, [0.5, 0.36, 0.2], 0, 0.5); bx(-0.35 * sg, -0.25, y0 + 2.1, 0.24, 0.1, 0.16, [0.45, 0.3, 0.17], 0, -0.3);   // glasspaper and the cork block
          B.tube([L(tw, -0.2, y0 + 0.62), L(tw, 0.2, y0 + 0.62)], 0.62, 12, B.shade(IRONC, 1.25)); B.tube([L(tw, -0.36, y0 + 0.62), L(tw, 0.36, y0 + 0.62)], 0.12, 6, B.shade(IRONC, 1.7));   // the wheel and its axle
          for (const o of [-1, 1]) {
            B.tube([L(tw, o * 0.34, y0 + 0.62), L(1.3 * sg, o * 0.7, y0 + 0.96), L(-1.4 * sg, o * 0.86, y0 + 1.12), L(th, o * 0.95, y0 + 1.55)], 0.1, 6, B.shade(OAK, 1.2));   // a shaft from the axle to the handle
            post(L(-1.0 * sg, o * 0.82, y0), L(-0.8 * sg, o * 0.8, y0 + 1.0), 0.09, B.shade(OAK, 0.8)); }
          bx(-0.95 * sg, 0, y0 + 0.4, 0.06, 0.06, 0.8, B.shade(OAK, 0.8));
          B.tube([L(-2.6 * sg, 1.75, y0 + 0.14), L(1.5 * sg, 1.62, y0 + 0.2)], 0.075, 5, B.shade(PINE, 1.15)); bx(1.75 * sg, 1.6, y0 + 0.22, 0.2, 0.2, 0.62, [0.42, 0.33, 0.18], 0, 0.04);   // the broom
          lathe(-2.3 * sg, 0.3, [[1.0, 0], [0.5, 0.14], [0.02, 0.2]], 9, B.shade(DUST, 0.9), 0);                                                    // what has been swept up so far
          body(RC + 0.92, y0 + 1.94); body(RC + 0.8, y0 + 2.22); body(RC + 0.4, y0 + 2.34); body(RC + 1.06, y0 + 1.7); body(RC + 2.25, y0 + 0.45);
        } else if (s.stage === 4) {                                                               // PRIMING: on one folded drop cloth a keg of primer with a broad brush across it, a tall can and its stick, an enamel basin
          const CANV = [0.15, 0.125, 0.105]; cloth(CANV);
          for (const [t, o, w] of [[0.6, 1.3, 0.3], [-1.9, 0.9, 0.22], [1.9, -0.5, 0.2], [-0.2, 1.55, 0.16]]) bx(t * sg, o, y0 + 0.158, w, 0.008, w * 0.7, B.shade(PRIM, 0.9), 0, t);
          const k0 = -1.2 * sg; lathe(k0, 0, [[0.68, 0.15], [0.86, 0.72], [0.86, 1.2], [0.72, 1.78]], 12, B.shade(OAK, 1.05), 0);
          for (const y of [0.42, 1.42]) lathe(k0, 0, [[0.85 - (y > 1 ? 0.05 : 0.1), y], [0.87 - (y > 1 ? 0.05 : 0.1) + 0.05, y + 0.14]], 12, B.shade(IRONC, 1.3), 3);
          lathe(k0, 0, [[0.67, 1.7], [0.02, 1.71]], 12, B.shade(PRIM, 1.25), 0);
          bx(k0, 0, y0 + 1.84, 0.82, 0.05, 0.1, B.shade(OAK, 1.3), 0, 0.5); bx(k0 + 0.62, 0.34, y0 + 1.84, 0.26, 0.07, 0.2, B.shade(PRIM, 1.1), 0, 0.5);
          lathe(1.0 * sg, -0.3, [[0.42, 0.15], [0.42, 1.36]], 10, STEELC, 3); lathe(1.0 * sg, -0.3, [[0.435, 0.95], [0.44, 1.37]], 10, B.shade(PRIM, 1.1), 0); lathe(1.0 * sg, -0.3, [[0.4, 1.3], [0.02, 1.31]], 10, B.shade(PRIM, 1.2), 0);
          B.tube([L(1.0 * sg, -0.3, y0 + 0.5), L(1.3 * sg, -0.1, y0 + 2.2)], 0.06, 5, B.shade(PINE, 1.1));
          lathe(1.9 * sg, 1.0, [[0.5, 0.15], [0.84, 0.5], [0.9, 0.52]], 12, [0.6, 0.6, 0.56], 0); lathe(1.9 * sg, 1.0, [[0.82, 0.47], [0.02, 0.4]], 12, B.shade(PRIM, 1.15), 0); bx(1.75 * sg, 1.0, y0 + 0.5, 0.25, 0.1, 0.18, [0.55, 0.45, 0.2], 0, 0.6);
          body(RC + 0.88, y0 + 1.92); body(RC + 0.15, y0 + 2.26); body(RC + 1.9, y0 + 0.62);
        } else {                                                                                  // PAINTING: a pair of steps with pots of the scheme's colours on its treads, the painter's tote of pots and a brush, on one drop cloth
          const coat = (s.phase > Math.PI) ? c1 : c3, other = (s.phase > Math.PI) ? c3 : c1, CANV = [0.15, 0.125, 0.105]; cloth(CANV);
          for (const [t, o, w, cc] of [[0.5, 1.35, 0.3, coat], [-2.0, 1.0, 0.22, other], [2.0, -0.4, 0.2, OCHREC], [-0.4, 1.5, 0.16, coat]]) bx(t * sg, o, y0 + 0.158, w, 0.008, w * 0.7, cc, 0, t);
          const t0 = -1.2 * sg;
          bx(t0, -0.25, y0 + 2.0, 0.74, 0.06, 0.34, B.shade(PINE, 1.0)); bx(t0, 0.3, y0 + 1.0, 0.74, 0.06, 0.34, B.shade(PINE, 0.95));
          for (const d of [-0.66, 0.66]) { post(L(t0 + d, -0.62, y0), L(t0 + d * 0.92, -0.42, y0 + 1.96), 0.08, B.shade(PINE, 0.8)); post(L(t0 + d, 0.92, y0), L(t0 + d * 0.92, -0.08, y0 + 1.96), 0.08, B.shade(PINE, 0.8)); }
          const pot = (t, o, y, r, h, cc) => { lathe(t, o, [[r, y], [r * 1.06, y + h]], 9, STEELC, 3); lathe(t, o, [[r * 0.98, y + h - 0.03], [0.02, y + h - 0.02]], 9, cc, 0); };
          pot(t0 - 0.2, -0.25, 2.06, 0.28, 0.5, coat); pot(t0 - 0.3, 0.3, 1.06, 0.26, 0.44, OCHREC); pot(t0 + 0.34, 0.32, 1.06, 0.22, 0.38, other);
          const t1 = 1.5 * sg;
          bx(t1, 0.1, y0 + 0.34, 1.15, 0.18, 0.6, B.shade(OAK, 1.0)); for (const d of [-1.1, 1.1]) bx(t1 + d, 0.1, y0 + 0.8, 0.06, 0.64, 0.6, B.shade(OAK, 0.85));
          B.tube([L(t1 - 1.1, 0.1, y0 + 1.36), L(t1 + 1.1, 0.1, y0 + 1.36)], 0.08, 6, B.shade(OAK, 1.25));
          for (let k = 0; k < 4; k++) pot(t1 - 0.78 + k * 0.52, 0.1 + 0.12 * ((k * 2) % 3 - 1), 0.52, 0.22, 0.42, [coat, OCHREC, other, [0.62, 0.58, 0.46]][k]);
          B.tube([L(0.2 * sg, 1.2, y0 + 0.24), L(1.5 * sg, 1.45, y0 + 0.24)], 0.07, 5, B.shade(OAK, 1.25)); bx(1.75 * sg, 1.5, y0 + 0.25, 0.22, 0.07, 0.16, coat, 0, 0.2);
          body(RC + 0.1, y0 + 2.58); body(RC + 0.64, y0 + 1.5); body(RC + 0.72, y0 + 1.46); body(RC + 1.66, y0 + 0.34);
        }
        continue;
      }
      const pick = [0, 3, 1, 2][kit % 4], rl = pick === 3 ? 11.5 : LANE, yaw = -a - Math.PI / 2;
      if (pick !== 3) { if (!lone(a)) continue; taken.push(a); }
      kit++;
      const P = (t, o, y) => [(rl + o) * ct - t * sn, y, (rl + o) * sn + t * ct];                 // t along the lane, o outward, y up
      if (pick === 0) {                                                                           // a pair of trestles with a crank laid across them
        for (const t of [-1.7, 1.7]) {
          const c = P(t, 0, y0 + 1.86); B.box(c[0], c[1], c[2], 0.15, 0.13, 1.0, yaw, TIMB);
          for (const o of [-0.8, 0.8]) for (const d of [-0.34, 0.34]) post(P(t + d, o * 1.12, y0), P(t + d * 0.3, o, y0 + 1.75), 0.09, B.shade(PINE, 0.82));
          const b = P(t, 0, y0 + 0.7); B.box(b[0], b[1], b[2], 0.05, 0.08, 0.86, yaw, B.shade(PINE, 0.7));
        }
        B.tube([P(-2.7, 0, y0 + 2.14), P(-0.75, 0, y0 + 2.14), P(-0.6, 0.8, y0 + 2.14), P(0.6, 0.8, y0 + 2.14), P(0.75, 0, y0 + 2.14), P(2.7, 0, y0 + 2.14)], 0.15, 6, B.shade(IRONC, 1.15), 3);
        for (const t of [-2.2, 2.2]) { const c = P(t, 0, y0 + 2.14); B.box(c[0], c[1], c[2], 0.2, 0.22, 0.24, yaw, BRASS, 1); }
        const m = P(0.3, -0.5, y0 + 2.06); B.box(m[0], m[1], m[2], 0.5, 0.07, 0.1, yaw + 0.5, STEELC, 3);
      } else if (pick === 1) {                                                                    // an open tool chest, its lid standing back, an oil can on the boards
        const c = P(0, 0, y0 + 0.58); B.box(c[0], c[1], c[2], 1.4, 0.58, 0.66, yaw, CHEST);
        const l = P(0, -0.74, y0 + 1.62); B.box(l[0], l[1], l[2], 1.4, 0.62, 0.07, yaw, B.shade(CHEST, 0.8));
        const inn = P(0, 0, y0 + 1.17); B.box(inn[0], inn[1], inn[2], 1.26, 0.02, 0.52, yaw, DARK, 0, 1);
        for (const t of [-1.36, 1.36]) for (const o of [-0.62, 0.62]) { const q = P(t, o, y0 + 0.2); B.box(q[0], q[1], q[2], 0.1, 0.2, 0.1, yaw, BRASS, 1); }
        const tr = P(0.5, 0.05, y0 + 1.24); B.box(tr[0], tr[1], tr[2], 0.6, 0.06, 0.44, yaw, TIMB);
        for (let k = 0; k < 4; k++) { const q = P(-1.0 + k * 0.3, 0.1 - k * 0.06, y0 + 1.3 + k * 0.05); B.box(q[0], q[1], q[2], 0.05, 0.04, 0.5 + 0.1 * k, yaw + 0.25 * k, STEELC, 3); }
        B.tube([P(0.2, 0.1, y0 + 1.36), P(1.3, -0.2, y0 + 1.75)], 0.07, 5, B.shade(OAK, 1.1)); const mh = P(0.2, 0.1, y0 + 1.4); B.box(mh[0], mh[1], mh[2], 0.2, 0.16, 0.3, yaw + 0.3, B.shade(PINE, 1.0));
        const oc = P(2.2, 0.3, 0); B.lathe(oc[0], oc[2], [[0.3, y0], [0.32, y0 + 0.5], [0.09, y0 + 0.85], [0.05, y0 + 1.25]], 8, BRASS, 1);
        const st = P(-2.4, 0.2, y0 + 0.75); B.box(st[0], st[1], st[2], 0.5, 0.06, 0.5, yaw + j1 * 4, TIMB); for (const [t, o] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) post(P(-2.4 + t * 1.2, 0.2 + o * 1.2, y0), P(-2.4 + t, 0.2 + o, y0 + 0.7), 0.06, B.shade(PINE, 0.8));
      } else if (pick === 2) {                                                                    // a coiled driving belt, a length of it run out, a keg of bolts
        const c = P(-1.0, 0, 0); for (let k = 0; k < 4; k++) B.tube(ringPts(c, 0.95 - 0.04 * k, y0 + 0.14 + 0.25 * k), 0.13, 5, B.shade(LEATHER, 0.85 + 0.1 * (k & 1)));
        const b0 = P(1.6, -0.45, y0 + 0.03); B.box(b0[0], b0[1], b0[2], 2.3, 0.03, 0.24, yaw + j1, LEATHER);
        const kg = P(1.5, 0.35, 0); B.lathe(kg[0], kg[2], [[0.5, y0], [0.64, y0 + 0.45], [0.64, y0 + 0.85], [0.5, y0 + 1.3]], 10, (i) => (i === 1 || i === 2) ? B.shade(OAK, 0.9) : IRONC, 0);
        for (let k = 0; k < 5; k++) { const q = P(1.5 + 0.22 * Math.cos(k * 2.2), 0.35 + 0.22 * Math.sin(k * 2.2), y0 + 1.36 + 0.05 * (k % 2)); B.box(q[0], q[1], q[2], 0.2, 0.06, 0.06, k * 1.3, STEELC, 3); }
        const gp = P(3.0, -0.1, 0); B.lathe(gp[0], gp[2], [[0.34, y0], [0.4, y0 + 0.5], [0.36, y0 + 0.56]], 8, B.shade(IRONC, 0.8), 3);
      } else {                                                                                    // THE POLE RACK by the housing: an A-frame with a head rail, six poles stood upright against it, brass sleeves on, waiting to be hung
        for (const t of [-2.1, 2.1]) { post(P(t, 0.9, y0), P(t, -0.42, y0 + 4.8), 0.12, B.shade(PINE, 0.82)); post(P(t, -0.9, y0), P(t, -0.46, y0 + 4.8), 0.12, B.shade(PINE, 0.74)); }
        const hr = P(0, -0.5, y0 + 4.7); B.box(hr[0], hr[1], hr[2], 2.4, 0.14, 0.12, yaw, TIMB);
        const fr = P(0, 0.86, y0 + 0.16); B.box(fr[0], fr[1], fr[2], 2.4, 0.16, 0.12, yaw, B.shade(PINE, 0.8));
        for (let k = 0; k < 6; k++) { const t = -1.55 + k * 0.62, e = 0.12 * ((k * 7) % 3 - 1), top = 7.4 + 0.5 * ((k * 5) % 3), f = (yy) => 0.62 - 0.84 * (yy - 0.1) / 4.6;
          B.tube([P(t, f(0.1), y0 + 0.1), P(t + e, f(top), y0 + top)], 0.17, 6, B.shade(IRONC, 1.2), 3); B.tube([P(t + e * 0.82, f(top - 1.4), y0 + top - 1.4), P(t + e * 0.93, f(top - 0.6), y0 + top - 0.6)], 0.215, 6, BRASS, 1); }
      }
    }
  }
  await ctx.yield();
  // mast
  const PALE = arr(pal[0], 0.82);                                           // pale paint on what stands highest: the mast above the hub, its head, the tie rods, the canopy's hoop
  B.lathe(0, 0, [[1.4, 0], [1.4, 0.7], [1.0, 1.0], [0.95, 10], [0.85, 18.1], [2.0, 18.3], [2.0, 19.7], [0.95, 19.9], [0.72, 25.1], [1.6, 25.5], [1.8, 26.3], [0.45, 26.5], [0.62, 26.8], [0.03, 27.0]], 12,
    (i) => (i < 2 || i === 5 || i === 6) ? IRONC : i >= 11 ? GOLDC : i >= 7 ? PALE : B.shade(OAK, 0.85), (i) => (i >= 11 ? 1 : (i === 5 || i === 6) ? 3 : 0));
  B.lathe(0, 0, [[0.1, 26.95], [0.5, 27.2], [0.5, 27.32], [0.36, 27.38], [0.4, 28.3], [0.6, 28.42], [0.3, 28.72], [0.03, 29.0]], 8, BRASS, 1);   // the lantern's brass cage on the finial
  // housing drum: posts, plinth, cornice, and panels at the stage of their bearing
  B.arc(7.7, 8.45, 3.2, 4.0, 0, TAU, 64, (a) => timberAt(a, 0.8)); 
  B.arc(7.5, 8.75, 15.8, 16.5, 0, TAU, 64, (a) => gilt(a) ? GOLDC : timberAt(a, 0.9), (a) => gilt(a) ? 1 : 0);
  const housingGilt = [];
  for (let k = 0; k < 16; k++) {
    const pa = sweepPhi(k), a1 = pa - 0.035, a0 = sweepPhi(k + 1) + 0.035, mid = (a0 + a1) / 2, st = stageAt(mid).stage;
    B.box(8.05 * Math.cos(pa), 9.9, 8.05 * Math.sin(pa), 0.3, 5.9, 0.3, -pa, gilt(pa - 0.01) ? GOLDC : timberAt(pa - 0.01, 0.95), gilt(pa - 0.01) ? 1 : 0, 60);
    if (st === 1) B.arc(7.9, 8.15, 9.3, 9.8, a0, a1, 3, B.shade(PINE, 0.85));
    else if (st === 2 || st === 3) { const nb = st === 2 ? 5 : 11; for (let j = 0; j < nb; j++) B.arc(7.92, 8.08, 4.05 + j * 1.07, 5.06 + j * 1.07, a0, a1, 3, B.shade(PINE, rng.range(0.78, 1.05)), 0, 1 | 2 | 4 | 16);
      for (const f of [0.28, 0.72]) { const a = a0 + (a1 - a0) * f; B.arc(8.08, 8.2, 4.1, 4.05 + nb * 1.07, a - 0.012, a + 0.012, 1, B.shade(OAK, 0.9), 0, 60); } }   // raw boards on two battens
    else if (st === 4 || st === 5) {
      // A SCENERY PANEL of the centre, framed: a field (the scheme's first colour; on a primed panel its flat first coat), a moulding, and one device
      // in relief at its middle, a different one panel by panel: a sun, a fan, a wreath, a shell (primed: blocked in; painted: in ochre)
      const fin = st === 5, field = fin ? B.shade(c1, 0.85) : [PRIM[0] * 0.62 + c1[0] * 0.2, PRIM[1] * 0.62 + c1[1] * 0.2, PRIM[2] * 0.62 + c1[2] * 0.2], frame = fin ? DEEPC : B.shade(PRIM, 0.72), dev = fin ? OCHREC : B.shade(PRIM, 1.05);
      B.arc(7.92, 8.08, 4.0, 15.8, a0, a1, 3, frame, 0, 4 | 16); B.arc(8.02, 8.14, 5.0, 14.8, a0 + 0.04, a1 - 0.04, 3, field, 0, 1 | 2 | 4 | 16);
      for (const y of [4.9, 14.7]) B.arc(8.06, 8.22, y, y + 0.3, a0 + 0.03, a1 - 0.03, 3, dev, 0, 1 | 2 | 4 | 16);
      for (const a of [a0 + 0.03, a1 - 0.055]) B.arc(8.06, 8.22, 5.2, 14.7, a, a + 0.025, 1, dev, 0, 60);
      const R = 8.2, yc = 9.9, pt = (t, y) => [R * Math.cos(mid + t / R), y, R * Math.sin(mid + t / R)], ray = (t0, y0, t1, y1, r0, r1) => B.tube([pt(t0, y0), pt(t1, y1)], [r0, r1], 4, dev, 0);
      const kind = k % 4;
      if (kind === 0) { for (let j = 0; j < 12; j++) { const an = j / 12 * TAU, L = j % 2 ? 0.62 : 0.98; ray(Math.cos(an) * 0.22, yc + Math.sin(an) * 0.22, Math.cos(an) * L, yc + Math.sin(an) * L, 0.13, 0.03); } B.box(...pt(0, yc), 0.24, 0.24, 0.1, -mid, dev); }
      else if (kind === 1) { for (let j = 0; j < 7; j++) { const an = (0.12 + 0.76 * j / 6) * Math.PI; ray(0, yc - 0.7, Math.cos(an) * 1.0, yc - 0.7 + Math.sin(an) * 1.5, 0.06, 0.15); }
        const rim = []; for (let j = 0; j <= 8; j++) { const an = (0.1 + 0.8 * j / 8) * Math.PI; rim.push(pt(Math.cos(an) * 1.05, yc - 0.7 + Math.sin(an) * 1.58)); } B.tube(rim, 0.08, 4, dev, 0); }
      else if (kind === 2) { const ring = []; for (let j = 0; j <= 14; j++) { const an = j / 14 * TAU; ring.push(pt(Math.cos(an) * 0.78, yc + Math.sin(an) * 0.95)); } B.tube(ring, 0.1, 4, dev, 0);
        for (let j = 0; j < 12; j++) { const an = (j + 0.5) / 12 * TAU + 0.26, c = Math.cos(an), sn = Math.sin(an), sd = an > Math.PI / 2 && an < 1.5 * Math.PI ? 1 : -1; ray(c * 0.78, yc + sn * 0.95, c * 0.78 + (c * 0.24 + sn * 0.2 * sd), yc + sn * 0.95 + (sn * 0.3 - c * 0.24 * sd), 0.11, 0.02); } }
      else { for (let j = 0; j < 9; j++) { const an = (0.14 + 0.72 * j / 8) * Math.PI, L = 1.25 + 0.3 * Math.sin(an); ray(Math.cos(an) * 0.12, yc - 0.6 + Math.sin(an) * 0.12, Math.cos(an) * L * 0.72, yc - 0.6 + Math.sin(an) * L, 0.07, j % 2 ? 0.17 : 0.12); } B.box(...pt(0, yc - 0.62), 0.42, 0.16, 0.1, -mid, dev); }
    }
    else if (st === 6) {
      B.arc(7.92, 8.08, 4.0, 15.8, a0, a1, 3, c1, 0, 4 | 16);
      B.arc(8.06, 8.14, 5.2, 12.4, a0 + 0.05, a1 - 0.05, 3, [0.04, 0.04, 0.04], 2, 16);                      // tall bevelled mirror
      B.arc(7.9, 8.22, 4.8, 5.2, a0 + 0.03, a1 - 0.03, 3, GOLDC, 1, 1 | 2 | 4 | 16); B.arc(7.9, 8.22, 12.4, 12.8, a0 + 0.03, a1 - 0.03, 3, GOLDC, 1, 1 | 2 | 4 | 16);
      B.arc(7.9, 8.22, 5.2, 12.4, a0 + 0.03, a0 + 0.055, 1, GOLDC, 1, 60); B.arc(7.9, 8.22, 5.2, 12.4, a1 - 0.055, a1 - 0.03, 1, GOLDC, 1, 60);
      housingGilt.push(mid);
    }
  }
  await ctx.yield();

  // sweeps, braces, tie rods, gear rings, running boards
  const bulbs = [];                                                       // [x, y, z, wave 0..1] in the wheel's frame
  const waveAt = (phi) => { const s = stageAt(phi); return s.stage === 6 ? s.frac : (s.stage === 0 ? 1 : 0); };
  const bulb = (r, y, phi) => bulbs.push([r * Math.cos(phi), y, r * Math.sin(phi), waveAt(phi)]);
  for (let k = 0; k < 16; k++) {
    const a = sweepPhi(k), c = Math.cos(a), s = Math.sin(a), g = gilt(a - 0.01) || gilt(a + 0.01), colS = g ? c3 : timberAt(a + 0.01, 0.95);
    B.beam([1.7 * c, 19, 1.7 * s], [43.1 * c, 19, 43.1 * s], 0.44, 0.85, stageAt(a + 0.01).stage <= 3 && !g ? B.shade(OAK, 0.6) : colS);          // a sweep is dark oiled oak until it is painted
    B.beam([8.2 * c, 16.4, 8.2 * s], [13 * c, 18.7, 13 * s], 0.3, 0.4, g ? GOLDC : B.shade(OAK, 0.8), g ? 1 : 0);
    B.beam([34.5 * c, 18.6, 34.5 * s], [43 * c, 17.25, 43 * s], 0.36, 0.36, IRONC, 3);                       // rim strut
    B.box(43.1 * c, 19, 43.1 * s, 0.34, 0.6, 0.34, -a, g ? GOLDC : IRONC, g ? 1 : 3);
    if (g) { B.beam([9 * c, 18.54, 9 * s], [42.6 * c, 18.54, 42.6 * s], 0.52, 0.08, GOLDC, 1); for (let r = 9.6; r < 42.4; r += 0.5) bulb(r, 18.4, a); }
    for (const rr of [29.5, 42.7]) B.tube([[0.7 * c, 26.2, 0.7 * s], [rr * c, 19.45, rr * s]], 0.2, 5, B.shade(IRONC, 0.9), 3);        // tie rods: dark iron, two to a sweep, all at the one pitch
  }
  { const hoop = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU; hoop.push([21 * Math.cos(a), 22.9, 21 * Math.sin(a)]); }       // the canopy's hoop, lashed to the outer tie rods half way down
    B.tube(hoop, 0.2, 5, PALE, 0); }
  for (const { r } of ROWS) {
    const ring = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU; ring.push([(r + 1.72) * Math.cos(a), PLAT_Y + YC, (r + 1.72) * Math.sin(a)]); }
    B.tube(ring, 0.18, 5, B.shade(IRONC, 1.2), 3);
    B.arc(r - 1.9, r - 1.36, 18.18, 18.58, 0, TAU, 72, (a) => gilt(a) ? c3 : timberAt(a, 0.85), 0, 2 | 4 | 16);
    for (let a = SEAM + 0.01; a < SEAM + 80 * DEG; a += 0.4 / r) bulb(r - 1.63, 18.02, a);
  }
  await ctx.yield();

  // ROUNDING BOARDS, one ring in the order the work goes round: a bare frame (two true rails and plain uprights, quiet tan, no braces),
  // the first boards going on, boarded, primed, half painted, gilded. Each sector hangs from its two sweeps by an iron hanger strap.
  const cart = [];                                                        // cartouche instances: [phi, R, y, scale, inward]
  for (let k = 0; k < 16; k++) {
    const a0 = sweepPhi(k + 1), a1 = sweepPhi(k), mid = (a0 + a1) / 2, span = a1 - a0, st = stageAt(mid).stage, g = st === 6;
    const tc = g ? GOLDC : st <= 3 ? [PINE[0] * 0.25, PINE[1] * 0.2, PINE[2] * 0.14] : st === 4 ? B.shade(PRIM, 0.8) : timberAt(mid, 1.0), gl = g ? 1 : 0;      // a bare frame is raw deal in the shade of the boards above it: quiet tan
    const bare = st <= 1, fc = bare ? B.shade(tc, 0.6) : tc;                                                                // where no board is on yet the frame is a quiet outline in the roof's shade: slim rails, three slim uprights to a sector
    if (bare) { B.arc(42.87, 43.13, 17.06, 17.32, a0, a1, 5, fc, gl); B.arc(42.87, 43.13, 20.68, 20.94, a0, a1, 5, fc, gl); }
    else { B.arc(42.78, 43.22, 17.0, 17.4, a0, a1, 5, tc, gl); B.arc(42.78, 43.22, 20.6, 21.0, a0, a1, 5, tc, gl); }       // the two rails run sweep to sweep: the ring is one ring
    { const ca = Math.cos(a1), sa = Math.sin(a1); B.box(43.36 * ca, 19, 43.36 * sa, 0.1, 2.15, 0.16, -a1, g ? GOLDC : B.shade(IRONC, 1.1), g ? 1 : 3);   // the hanger strap at the sweep's end, bolted over both rails
      B.box(43.3 * ca, 19, 43.3 * sa, 0.2, 0.42, 0.3, -a1, g ? GOLDC : B.shade(IRONC, 0.9), g ? 1 : 3); }                                             // and its bracket on the sweep
    const at = (a, y, r = 43) => [r * Math.cos(a), y, r * Math.sin(a)];
    if (st <= 4) {
      for (let j = bare ? 2 : 1; j < 8; j += bare ? 2 : 1) { const p = a0 + span * j / 8; B.box(43 * Math.cos(p), 19, 43 * Math.sin(p), bare ? 0.085 : 0.14, bare ? 1.68 : 1.6, bare ? 0.1 : 0.16, -p, B.shade(fc, 0.92), 0, 60); }
      const nb = st <= 1 ? 0 : st === 2 ? 5 : 13;                                                   // boards: none on the bare frame, the first five of thirteen on the next, then all (raw, then primed)
      for (let j = 0; j < nb; j++) { const p = a0 + span * (0.012 + j * 0.0752); B.arc(42.92, 43.08, 17.4, 20.6, p, p + span * 0.0735, 1, B.shade(st === 4 ? PRIM : PINE, (st === 4 ? 0.78 : 0.56) * (0.94 + 0.12 * ((j * 7 + k * 3) % 5) / 4)), 0, 60); }
    } else {
      B.arc(42.9, 43.1, 17.4, 20.6, a0, a1, 10, (a, i) => g ? c1 : i < 5 ? B.shade(c1, 0.85) : B.shade(PRIM, 0.9 + 0.1 * (i & 1)), 0, 4 | 16);
      if (!g) {                                                                                   // work in hand: half the board painted (field, lining, an oval reserved), the other half primed with the ornament pounced on it in dots
        B.arc(43.1, 43.16, 17.7, 17.95, a0 + span * 0.03, a0 + span * 0.47, 3, c3, 0, 4 | 16); B.arc(43.1, 43.16, 20.05, 20.3, a0 + span * 0.03, a0 + span * 0.47, 3, c3, 0, 4 | 16);
        for (let j = 0; j < 18; j++) { const t = j / 18 * TAU;
          const p1 = a0 + span * 0.25 + Math.cos(t) * 2.2 / 43.1; B.box(43.13 * Math.cos(p1), 19.0 + Math.sin(t) * 0.95, 43.13 * Math.sin(p1), 0.04, 0.09, 0.16, -p1, B.shade(OCHREC, 1.0), 0, 60);
          const p2 = a0 + span * 0.75 + Math.cos(t) * 2.2 / 43.1; B.box(43.12 * Math.cos(p2), 19.0 + Math.sin(t) * 0.95, 43.12 * Math.sin(p2), 0.03, 0.05, 0.05, -p2, B.shade(DARK, 1.4), 0, 60); }
      }
      if (g) {
        for (const f of [0.19, 0.5 - 0.115, 0.5 + 0.115, 0.81]) { const p = a0 + span * f; B.arc(42.82, 43.18, 17.4, 20.6, p - 0.005, p + 0.005, 1, GOLDC, 1, 60); }
        B.arc(42.86, 43.14, 17.4, 17.62, a0, a1, 5, c3, 0, 4 | 16); B.arc(42.86, 43.14, 20.38, 20.6, a0, a1, 5, c3, 0, 4 | 16);
        cart.push([mid, 43.16, 19.0, 1, 0], [a0 + span * 0.095, 43.14, 19.0, 0.5, 0], [a1 - span * 0.095, 43.14, 19.0, 0.5, 0], [mid, 42.84, 19.0, 0.62, 1]);
        for (let j = 0; j < 44; j++) { const a = a0 + span * (j + 0.5) / 44; bulb(43.32, 21.14, a); bulb(43.34, 17.2, a); bulb(42.66, 17.2, a); }
        for (let j = 0; j < 22; j++) { const t = j / 22 * TAU, a = mid - Math.cos(t) * 2.0 / 43.3; bulb(43.4, 19.0 + Math.sin(t) * 1.42, a); }
      }
    }
  }
  await ctx.yield();
  // STREAMERS, so that one glance shows which way the wheel goes round: on a staff at every sweep's end, above the rounding boards (radius 43.1,
  // y 20.9 to 26.8), a long tapering pennant streaming back against the turn, 7.6 m long and 2.7 m deep at the staff, rippling toward its end; in the
  // scheme's colours over the painted and gilded sectors, pale shop canvas (test streamers) elsewhere. Nothing of them is below y 22.6. With the mast
  // head, the rods and the cap they are the wheel's crown: the highest things on it, and the nearest to the roof glass.
  for (let k = 0; k < 16; k++) {
    const a = sweepPhi(k), st = stageAt(a - 0.02).stage, c = Math.cos(a), sn = Math.sin(a), fin = st >= 5;
    B.tube([[43.1 * c, 20.9, 43.1 * sn], [43.1 * c, 26.4, 43.1 * sn]], 0.18, 5, fin ? GOLDC : B.shade(IRONC, 1.3), fin ? 1 : 3);
    B.lathe(43.1 * c, 43.1 * sn, [[0.02, 26.3], [0.3, 26.42], [0.3, 26.62], [0.02, 26.8]], 6, fin ? GOLDC : BRASS, 1);
    const nS = 7, top = [], bot = [], colA = fin ? c1 : [0.9, 0.86, 0.74], colB = fin ? (st === 6 ? GOLDC : c3) : [0.7, 0.66, 0.54];
    for (let i = 0; i <= nS; i++) { const t = i / nS, an = a - t * 7.6 / 43.1, r = 43.1 + 0.3 * Math.sin(t * 5.2 + k), y = 25.0 - 1.1 * t * t, hh = 1.3 * (1 - 0.62 * t) + 0.05;
      top.push([r * Math.cos(an), y + hh, r * Math.sin(an)]); bot.push([r * Math.cos(an), y - hh, r * Math.sin(an)]); }
    B.ribbon(top, bot, (i) => ((i >> 1) & 1) ? colB : colA, (i) => 5 + 0.85 * i / nS);
  }
  await ctx.yield();
  for (const mid of housingGilt) {
    cart.push([mid, 8.2, 14.25, 0.52, 0]);
    for (const a of [mid - 0.16, mid + 0.16]) for (let y = 5.5; y < 12.3; y += 0.5) bulb(8.3, y, a);
  }
  for (let a = SEAM + 0.01; a < SEAM + 80 * DEG; a += 0.42 / 8.9) bulb(8.9, 15.72, a);
  await ctx.yield();
  // canvas top, laced on over the finished quarter only: striped gores from the mast head to the rim, sagging between the rods
  if (opts.canopy !== false) {
    const cream = arr(pal[0], 0.82);
    for (let k = 0; k < 16; k++) {
      const a0 = sweepPhi(k + 1), a1 = sweepPhi(k); if (stageAt((a0 + a1) / 2).stage !== 6) continue;
      // four stripes to a gore, each with a soft edge: between every two stripes lies a narrow band of the two colours' mean
      const JF = [0, 0.03, 0.22, 0.28, 0.47, 0.53, 0.72, 0.78, 0.97, 1], soft = [(c1[0] + cream[0]) / 2, (c1[1] + cream[1]) / 2, (c1[2] + cream[2]) / 2], JC = [soft, c1, soft, cream, soft, c1, soft, cream, soft];
      const nr = 8, na = 9, pt = (i, j) => { const t = i / nr, r = 1.3 + t * 41.9, f = JF[j], a = a0 + (a1 - a0) * f; return [r * Math.cos(a), 26.15 - t * 5.0 - 0.75 * Math.sin(Math.PI * f) * Math.sin(Math.PI * Math.min(1, t * 1.15) * 0.9), r * Math.sin(a)]; };
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
        const cc = JC[j], A = pt(i, j), Bp = pt(i + 1, j), Cp = pt(i + 1, j + 1), Dp = pt(i, j + 1);
        const up = (Bp[2] - A[2]) * (Dp[0] - A[0]) - (Bp[0] - A[0]) * (Dp[2] - A[2]) > 0;
        if (up) { B.quad(A, Bp, Cp, Dp, cc, 0); B.quad(A, Dp, Cp, Bp, B.shade(cc, 0.8), 0); } else { B.quad(A, Dp, Cp, Bp, cc, 0); B.quad(A, Bp, Cp, Dp, B.shade(cc, 0.8), 0); }
      }
      for (let j = 0; j < 8; j++) { const a = a0 + (a1 - a0) * (j + 0.5) / 8, a2 = (a1 - a0) / 16 * 0.9; B.arc(42.94, 43.06, 21.0, 21.2 + 0.16 * (j & 1), a - a2, a + a2, 1, ((j + k) & 1) ? c3 : GOLDC, ((j + k) & 1) ? 0 : 1, 1 | 60); }   // cresting
    }
  }
  // THE STRIPED TOP ENDS ON A SWEEP WITH A LACED EDGE: at either end of the finished quarter its last gore is bound with rope and laced, zigzag,
  // down to the outer tie rod of that sweep (which runs in the same upright plane, from the mast head to the sweep's end)
  if (opts.canopy !== false) for (let k = 0; k < 16; k++) {
    const here = stageAt((sweepPhi(k + 1) + sweepPhi(k)) / 2).stage === 6, next = stageAt((sweepPhi(k) + sweepPhi(k - 1)) / 2).stage === 6;
    if (here === next) continue;
    const ae = sweepPhi(k), c = Math.cos(ae), s = Math.sin(ae), hemp = [0.34, 0.27, 0.16], edge = [], lace = [], n = 34;
    for (let i = 0; i <= n; i++) { const t = 0.06 + 0.94 * i / n, r = 1.3 + t * 41.9, yc = 26.15 - t * 5.0, yr = 26.2 - (r - 0.7) * 6.75 / 42 + 0.12;
      if (i % 2 === 0) edge.push([r * c, yc + 0.04, r * s]);
      lace.push([r * c, i % 2 ? yr : yc, r * s]); }
    B.tube(edge, 0.1, 4, hemp, 0); B.tube(lace, 0.045, 4, B.shade(hemp, 1.25), 0);
  }
  // THE CAP: plain shop canvas laced from the mast head down to the hoop at radius 21 in every sector the striped top has not reached yet,
  // sagging a little between the rods: the wheel wears a pale peak under the roof glass from wherever in the hall it is seen
  { const canv = [0.76, 0.71, 0.58];
    for (let k = 0; k < 16; k++) {
      const a0 = sweepPhi(k + 1), a1 = sweepPhi(k); if (opts.canopy !== false && stageAt((a0 + a1) / 2).stage === 6) continue;
      const nr = 3, na = 2, pt = (i, j) => { const t = i / nr, r = 1.3 + t * 19.7, a = a0 + (a1 - a0) * j / na; return [r * Math.cos(a), 26.15 - t * 3.25 - 0.32 * Math.sin(Math.PI * j / na) * Math.sin(Math.PI * t * 0.9), r * Math.sin(a)]; };
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
        const cc = (k & 1) ? canv : B.shade(canv, 0.88), A = pt(i, j), Bp = pt(i + 1, j), Cp = pt(i + 1, j + 1), Dp = pt(i, j + 1);
        const up = (Bp[2] - A[2]) * (Dp[0] - A[0]) - (Bp[0] - A[0]) * (Dp[2] - A[2]) > 0;
        if (up) { B.quad(A, Bp, Cp, Dp, cc, 0); B.quad(A, Dp, Cp, Bp, B.shade(cc, 0.8), 0); } else { B.quad(A, Dp, Cp, Bp, cc, 0); B.quad(A, Bp, Cp, Dp, B.shade(cc, 0.8), 0); }
      }
    }
  }
  await ctx.yield();
  const structure = new THREE.Mesh(B.finish(), patchMaterial(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.85, metalness: 0 }), 'static', U));
  structure.name = 'structure'; structure.frustumCulled = false; wheel.add(structure);
  await ctx.yield();

  // cartouches: oval bevelled mirror in a gilt rim under a shell crest, with scrolls and leaves
  {
    const S = makeSculpt(rng);
    S.blob([0, 0, 0.04], [1.72, 1.16, 0.16], { zone: 5, sides: 10, rings: 4, ref: [0, 0, 1] });
    const rim = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * TAU; rim.push([Math.cos(t) * 1.74, Math.sin(t) * 1.18, 0.1]); }
    S.tube(rim, [0.14], { sides: 4, zone: 4, cap: false, ref: [0, 0, 1] });
    S.burst([0, 1.28, 0.1], [0, 0, 1], 1.1, 9, { a0: 0.2, a1: Math.PI - 0.2, wid: 0.44, th: 0.12, boss: 5 });
    for (const s of [1, -1]) {
      const sc = [], sr = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = (s > 0 ? Math.PI : 0) + s * (0.3 + t * 4.6), r = 0.62 - t * 0.44; sc.push([s * 2.25 + Math.cos(a) * r, -0.75 + t * 0.5 + Math.sin(a) * r, 0.12]); sr.push(0.15 - t * 0.07); }
      S.tube(sc, sr, { sides: 4, zone: 4, ref: [0, 0, 1] });
      for (let i = 0; i < 3; i++) S.leaf([s * (2.0 + i * 0.36), 0.35 + i * 0.36, 0.1], [s * 0.6, 1, 0], [0, 0, 1], 0.7, 0.34, { zone: i === 1 ? 4 : 3, th: 0.07 });
      S.burst([s * 2.95, -0.2, 0.1], [0, 0, 1], 0.42, 5, { wid: 0.24, boss: 0 });
    }
    S.burst([0, -1.36, 0.1], [0, 0, 1], 0.62, 5, { a0: Math.PI + 0.5, a1: TAU - 0.5, wid: 0.3, boss: 0 });
    const n = Math.max(1, cart.length), mesh = new THREE.InstancedMesh(S.finish(), stationMat, n);
    const aSt = new Float32Array(n * 4), aBody = new Float32Array(n * 3), aHair = new Float32Array(n * 3), aAlt = new Float32Array(n);
    cart.forEach(([phi, R, y, sc, inward], i) => {
      M.makeRotationY(Math.PI / 2 - phi + (inward ? Math.PI : 0)); M.scale(new THREE.Vector3(sc, sc, sc)); M.setPosition(R * Math.cos(phi), y, R * Math.sin(phi)); mesh.setMatrixAt(i, M);
      aSt.set([6, 1, 0, 0], i * 4); aBody.set([C1.r, C1.g, C1.b], i * 3); aHair.set([C3.r, C3.g, C3.b], i * 3); aAlt[i] = 0;
    });
    mesh.geometry.setAttribute('iStage', new THREE.InstancedBufferAttribute(aSt, 4)); mesh.geometry.setAttribute('iBody', new THREE.InstancedBufferAttribute(aBody, 3));
    mesh.geometry.setAttribute('iHair', new THREE.InstancedBufferAttribute(aHair, 3)); mesh.geometry.setAttribute('iAlt', new THREE.InstancedBufferAttribute(aAlt, 1));
    mesh.count = cart.length; mesh.frustumCulled = false; mesh.name = 'cartouches'; wheel.add(mesh);
  }
  await ctx.yield();

  // ---- bulbs: steady warm glows on the gilded quarter (the kit's makeGlows), in eight bands round the rim so that the rare relight
  // can run as one wave: each band has its own intensity uniform, nothing else changes
  const bulbBands = [], BULB_GAIN = 4.4;
  {
    const keep = detail >= 0.99 ? bulbs : bulbs.filter((b, i) => (i % 5) < Math.max(2, Math.round(detail * 5)));
    const bands = []; for (let k = 0; k < 8; k++) bands.push([]);
    for (const b of keep) bands[Math.min(7, Math.floor(b[3] * 8))].push([b[0], b[1], b[2]]);
    const gr = rng.fork('bulbs');
    for (let k = 0; k < 8; k++) {
      const fr = gr.fork('band' + k); if (!bands[k].length) continue;
      const gl = fx.makeGlows({ rng: fr, positions: bands[k], color: [1.0, 0.5, 0.16], size: 1.5, intensity: BULB_GAIN, halo: 0.5, core: 0.55, flicker: 0, minAngle: 0.007, renderOrder: 3 });
      gl.object.name = 'bulbs'; wheel.add(gl.object); bulbBands.push({ glow: gl, wave: (k + 0.5) / 8 });
    }
    await ctx.yield();
  }
  { // THE MAST-HEAD LANTERN: a brass cage on the mast's finial with one warm flame, the highest light in the bay; it goes out and comes back with the bulbs
    const gl = fx.makeGlows({ rng: rng.fork('lantern'), positions: [[0, 27.85, 0]], color: [1.0, 0.62, 0.26], size: 5.5, intensity: 2.4, halo: 0.9, core: 0.7, flicker: 0, renderOrder: 3 });
    gl.object.name = 'lantern'; wheel.add(gl.object); bulbBands.push({ glow: gl, wave: 0.5, gain: 2.4 }); }
  const bulbCount = bulbs.length;

  // ---- fixed: the belt engine inside the housing ---------------------------------------------------------------
  let flywheel, pulley;
  {
    const F = makeStatic(), fmat = structure.material;
    F.box(0, 0.5, 0, 4.6, 0.5, 3.2, 0.3, F.shade(OAK, 0.55));                                                // bed
    F.lathe(-2.6, 1.2, [[1.7, 1.0], [1.75, 1.3], [1.7, 6.6], [1.2, 7.4], [0.5, 7.6], [0.45, 12.5], [0.6, 12.6], [0.6, 13.0]], 12, (i) => i > 3 ? F.shade(IRONC, 0.7) : i === 1 ? GOLDC : F.shade(c3, 0.8), (i) => i === 1 ? 1 : 3);   // upright boiler and flue
    F.box(1.6, 2.3, -1.2, 1.5, 1.3, 0.8, 0.3, F.shade(c3, 0.7), 3);                                          // cylinder block
    F.box(2.2, 2.4, 1.6, 0.35, 1.9, 0.35, 0.3, IRONC, 3); F.box(2.2, 2.4, -2.9, 0.35, 1.9, 0.35, 0.3, IRONC, 3);   // bearing stands
    F.tube([[2.2, 4.3, -3.3], [2.2, 4.3, 2.0]], 0.22, 8, F.shade(IRONC, 1.3), 3);                            // crankshaft
    F.tube([[0.2, 13.2, -1.9], [0.2, 13.2, 1.9]], 0.2, 8, F.shade(IRONC, 1.3), 3);                           // countershaft
    for (const z of [-1.9, 1.9]) F.beam([0.2, 13.2, z], [0.2 + (z > 0 ? 6.5 : -6.5), 15.9, z * 3.2], 0.3, 0.3, F.shade(OAK, 0.7));
    for (const [x0, x1] of [[2.2 - 0.95, 0.2 - 0.75], [2.2 + 0.95, 0.2 + 0.75]]) F.beam([x0, 4.3, 0.75], [x1, 13.2, 0.75], 0.5, 0.6, [0.16, 0.11, 0.07]);   // belt runs
    const m = new THREE.Mesh(F.finish(), fmat); m.name = 'engine'; fixed.add(m);
    const W = makeStatic();
    W.arc(2.75, 3.2, -0.28, 0.28, 0, TAU, 28, (a, i) => W.shade(c1, 0.75 + 0.1 * (i & 1)));
    W.arc(0.3, 0.95, -0.4, 0.4, 0, TAU, 12, IRONC, 3);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; W.beam([0.8 * Math.cos(a), 0, 0.8 * Math.sin(a)], [2.8 * Math.cos(a), 0, 2.8 * Math.sin(a)], 0.3, 0.2, i === 0 ? GOLDC : W.shade(c1, 0.8), i === 0 ? 1 : 0); }
    flywheel = new THREE.Mesh(W.finish(), fmat); flywheel.name = 'flywheel';
    const pivot = new THREE.Group(); pivot.position.set(2.2, 4.3, -1.9); pivot.rotation.x = Math.PI / 2; pivot.add(flywheel); fixed.add(pivot);
    const Q = makeStatic(); Q.arc(0.2, 0.78, -0.42, 0.42, 0, TAU, 14, (a, i) => Q.shade(OAK, 0.6 + 0.35 * (i % 7 === 0 ? 1 : 0)));
    pulley = new THREE.Mesh(Q.finish(), fmat); const pv2 = new THREE.Group(); pv2.position.set(0.2, 13.2, 0.75); pv2.rotation.x = Math.PI / 2; pv2.add(pulley); fixed.add(pv2);
    const p3 = new THREE.Mesh(pulley.geometry, fmat), pv3 = new THREE.Group(); pv3.position.set(2.2, 4.3, 0.75); pv3.rotation.x = Math.PI / 2; pv3.scale.setScalar(1.22); pv3.add(p3); fixed.add(pv3); pulley.userData.twin = p3;
  }
  await ctx.yield();

  // ---- the shop cat, riding a half-carved chariot of row one (the innermost row, radius 16), facing outward ----
  const catSeat = new THREE.Vector3(); let catTail = null; const catM = new THREE.Matrix4();
  {
    const cs = stations.find((s) => s.chariot && s.row === 0 && s.stage >= 1 && s.stage < 4) || stations.find((s) => s.chariot && s.row === 0 && s.stage >= 1) || stations.find((s) => s.chariot && s.row === 0);
    stationMatrix(cs, catM); catM.multiply(M2.makeTranslation(-1.05, 2.42, -0.35)).multiply(M2.makeRotationY(Math.PI / 2)).multiply(M2.makeScale(1.25, 1.25, 1.25));
    catSeat.setFromMatrixPosition(catM);
    const S = makeSculpt(rng);
    S.tube(P2([[-0.42, 0.42], [-0.2, 0.8], [0.08, 1.2], [0.24, 1.55]], 0), [[0.5, 0.56], [0.56, 0.52], [0.42, 0.42], [0.3, 0.3]], { sides: 8, zone: 0 });
    S.blob([0.42, 1.98, 0], [0.38, 0.34, 0.38], { zone: 0, sides: 8 }); S.blob([0.72, 1.88, 0], [0.16, 0.13, 0.2], { zone: 1 }); S.blob([0.4, 1.3, 0], [0.2, 0.42, 0.3], { zone: 1 });
    for (const s of [1, -1]) {
      S.tube([[0.34, 1.35, s * 0.2], [0.44, 0.7, s * 0.2], [0.5, 0.08, s * 0.2]], [0.17, 0.13, 0.15], { sides: 6, zone: s > 0 ? 0 : 1 });
      S.blob([-0.2, 0.42, s * 0.42], [0.5, 0.4, 0.26], { zone: 0 }); S.blob([0.28, 0.1, s * 0.46], [0.3, 0.1, 0.13], { zone: 1 });
      S.leaf([0.34, 2.36, s * 0.22], [-0.1, 1, s * 0.2], [1, 0.1, s * 0.3], 0.4, 0.3, { zone: 0, th: 0.06, back: 0.3 });
      S.blob([0.72, 2.06, s * 0.16], [0.05, 0.08, 0.08], { zone: 4, rings: 3, sides: 5 });
    }
    const cat = new THREE.InstancedMesh(S.finish(), stationMat, 1), T = makeSculpt(rng);
    T.tube([[0, 0, 0], [-0.5, 0.02, 0.1], [-1.0, 0.1, 0.3], [-1.35, 0.4, 0.42], [-1.45, 0.8, 0.4]], [0.12, 0.11, 0.1, 0.09, 0.06], { sides: 6, zone: 0 });
    catTail = new THREE.InstancedMesh(T.finish(), stationMat, 1);
    const fur = rng.pick([['#1B1A1D', '#EDE8DC'], ['#C8682A', '#F1EBDD'], ['#2A2622', '#E8E0D0']]);        // dark or ginger: it must read against bare wood
    for (const m of [cat, catTail]) {
      const b = new THREE.Color(fur[0]), h = new THREE.Color(fur[1]);
      m.geometry.setAttribute('iStage', new THREE.InstancedBufferAttribute(new Float32Array([5, 1, 0, 0]), 4)); m.geometry.setAttribute('iBody', new THREE.InstancedBufferAttribute(new Float32Array([b.r, b.g, b.b]), 3));
      m.geometry.setAttribute('iHair', new THREE.InstancedBufferAttribute(new Float32Array([h.r, h.g, h.b]), 3)); m.geometry.setAttribute('iAlt', new THREE.InstancedBufferAttribute(new Float32Array([0]), 1));
      m.setMatrixAt(0, catM); m.frustumCulled = false; wheel.add(m);
    }
    cat.name = 'cat'; catTail.name = 'cat-tail';
  }

  // ---- warm lights riding the gilded quarter (never switched: only dimmed) ------------------------------------
  const seatAt = (deg, r, y) => new THREE.Vector3(r * Math.cos(SEAM + deg * DEG), y, r * Math.sin(SEAM + deg * DEG));
  const lightSeats = [seatAt(28, 37, 14.5), seatAt(58, 24, 14.0)];
  const lights = [], nLights = Math.max(0, Math.min(2, opts.lights ?? 1));
  for (let i = 0; i < nLights; i++) {
    const L = new THREE.PointLight(new THREE.Color(1.0, 0.62, 0.3), 900, 110, 1.8); L.position.copy(nLights === 1 ? seatAt(40, 33, 14.5) : lightSeats[i]);
    L.userData.base = 900; L.name = 'gilt-light-' + i; wheel.add(L); lights.push(L);
  }

  // ---- anchors, state, update ----------------------------------------------------------------------------------
  const anchors = {
    portalSeat: { position: new THREE.Vector3(-170, 12, -41), facing: new THREE.Vector3(1, 0, 0) },
    flyThrough: [[0, 12, 190], [0, 12, 160], [0, 12, 130], [13.05, 11.16, 90.75], [25.98, 10.33, 51.84], [38.91, 9.5, 12.93], [40.64, 9.5, 5.38], [40.93, 9.5, -2.35], [39.76, 9.5, -10.01],
      [37.17, 9.5, -17.31], [33.25, 9.5, -23.99], [28.15, 9.5, -29.81], [22.04, 9.5, -34.57], [15.14, 9.5, -38.1], [7.71, 9.5, -40.27], [0, 9.5, -41], [-30, 10.75, -41], [-60, 12, -41]].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    viewpoints: {
      entry: { position: new THREE.Vector3(0, 12, 190), lookAt: new THREE.Vector3(0, 11, 0) },
      tangent: { position: new THREE.Vector3(26, 10.3, 52), lookAt: new THREE.Vector3(32, 8, 10) },
      arc: { position: new THREE.Vector3(40.9, 9.5, -2.4), lookAt: new THREE.Vector3(27.7, 8, -16) },
      leaving: { position: new THREE.Vector3(-30, 10.75, -41), lookAt: new THREE.Vector3(0, 11, 0) },
    },
    lightSeats, catSeat,
    reach: { below16: 34.6, rim: 43.5, platformTop: PLAT_Y, cranksMinY: PLAT_Y + YC - THROW - 0.3, cranksMaxY: PLAT_Y + YC + THROW + 0.3, sweepsMinY: 18.5, crestsMaxY: 21.4, mastHead: 27 },
  };
  const state = { angle: 0, bulbs: 1, scheme: schemeId, cast: castId, period };
  let progress = 0;
  const TM = new THREE.Matrix4(), TR = new THREE.Matrix4();
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function update(dt, time, camera) {
    const angle = (TAU * time / period + phase0) % TAU;
    wheel.rotation.y = -angle; U.uTheta.value = angle; state.angle = angle;
    flywheel.rotation.y = time * 2.6; pulley.rotation.y = -time * 3.3; pulley.userData.twin.rotation.y = -time * 2.7;
    // the cat's tail: slow sweeps with a quick flick now and then
    const fl = Math.sin(time * 1.3) * 0.35 + Math.pow(Math.max(0, Math.sin(time * 0.9 + 1.0)), 12) * Math.sin(time * 9.0) * 0.5;
    TM.copy(catM).multiply(TR.makeTranslation(-0.42, 0.22, 0)).multiply(TR.makeRotationY(fl)).multiply(TR.makeRotationZ(-0.1 - 0.12 * Math.sin(time * 0.7)));
    catTail.setMatrixAt(0, TM); catTail.instanceMatrix.needsUpdate = true;
    // bulbs
    let level = 1, wave = 2;
    if (progress > 0 && progress < 1) {
      if (progress < 0.1) level = 1 - sm(0, 0.1, progress);
      else if (progress < 0.45) level = 0;
      else wave = (progress - 0.45) / 0.55 * 1.06;
    }
    for (const b of bulbBands) { const t = Math.min(1, Math.max(0, (wave - b.wave * 0.86) / 0.14)); b.glow.uniforms.uIntensity.value = (b.gain ?? BULB_GAIN) * level * t * t * (3 - 2 * t); }
    const lit = level * Math.min(1, Math.max(0, wave)); state.bulbs = lit; U.uBulb.value = lit;
    for (const L of lights) L.intensity = L.userData.base * lit;
  }
  update(0, 0, null);

  // ---- copies for the hall: lighter animals off the wheel (conveyor, racks) and the bench work, in the wheel's own look ----
  // sculptGeometry(kind, so): kind 0..5 species | 'head' | 'parts'; so = { lod, lite, clamps, even, pole, poleTop, poleBase, footPole, crank }.
  // makeCopies(geometry, items, name): items = [{ matrix, stage, frac, body, hair, alt, lamp }]; nothing bobs (the crank share is 0).
  function sculptGeometry(kind, so = {}) {
    const S = makeSculpt(rng.fork('copy-' + kind + '-' + (so.lod || 1)), so);
    if (kind === 'head') buildHead(S); else if (kind === 'parts') buildParts(S); else { BUILDERS[kind](S); if (so.clamps) addClamps(S); }
    const g = S.finish();
    if (so.footPole) {                                                                                                             // a copy that stands on a deck: its pole ends at its feet (the carp's and the trolley horse's at the pole's own base, 0.02 and 0.01 m above them)
      const P = g.attributes.position, D = g.attributes.aData, foot = extentOf(g).foot;
      for (let i = 0; i < P.count; i++) if (D.getX(i) > 5.5 && D.getX(i) < 6.5 && P.getY(i) < foot) P.setY(i, foot);
    }
    return g;
  }
  // extentOf(geometry, blank): where a sculpted animal's body ends, in its own frame: foot = its lowest point that is not pole, crank or clamp,
  // so the soles of its gilt shoes where it has them (hoofs and paws, 0.10 to 0.29 m below the legs' wood; the heron's gilt toes, 0.02 to 0.03 m). Gilt
  // within 0.35 m of the pole's axis is the pole's own collars (radius 0.34), not the animal's. THE BOUND, to check a later species against:
  // gilt of an animal nearer its pole's axis than 0.35 m is NOT seen by this measure, and a collar wider than 0.35 m would be taken for a
  // shoe; the nearest gilt of any animal now lies 0.38 m from its axis (0.445 m on the trolleys' copies). blank: the geometry of a glued blank, whose
  // shoes the shader folds away with the rest of its trappings: its foot is the end of its sawn legs;
  // top = the highest point of anything in it (pole eye and antlers included); reach = the farthest any point lies from its pole's axis
  function extentOf(geometry, blank) {
    const P = geometry.attributes.position, D = geometry.attributes.aData; let foot = Infinity, top = -Infinity, reach = 0;
    for (let i = 0; i < P.count; i++) { const zn = D.getX(i), y = P.getY(i), r = Math.hypot(P.getX(i), P.getZ(i)); if (y > top) top = y; if (zn < 5.5 && (zn !== 4 || (!blank && r > 0.35)) && y < foot) foot = y; reach = Math.max(reach, r); }
    return { foot, top, reach: reach + 0.15 };                                      // 0.15 m more: a head turned to one side (the pose) reaches about that much further (0.29 m on the ram at the lighter detail)
  }
  function makeCopies(geometry, items, name) {
    const n = Math.max(1, items.length), mesh = new THREE.InstancedMesh(geometry, stationMat, n);
    const aSt = new Float32Array(n * 4), aBody = new Float32Array(n * 3), aHair = new Float32Array(n * 3), aAlt = new Float32Array(n), aLamp = new Float32Array(n), c = new THREE.Color();
    items.forEach((it, i) => {
      aLamp[i] = it.lamp || 0;
      mesh.setMatrixAt(i, it.matrix); aSt.set([it.stage ?? 3, it.frac ?? 0.5, it.pose ?? ((i * 2.3999 + items.length * 0.731 + (name ? name.length : 0) * 1.37) % TAU), 0], i * 4);
      c.set(it.body || '#E9E2D0'); aBody.set([c.r, c.g, c.b], i * 3); c.set(it.hair || '#3A2A20'); aHair.set([c.r, c.g, c.b], i * 3); aAlt[i] = it.alt ? 1 : 0;
    });
    geometry.setAttribute('iStage', new THREE.InstancedBufferAttribute(aSt, 4));
    geometry.setAttribute('iBody', new THREE.InstancedBufferAttribute(aBody, 3));
    geometry.setAttribute('iHair', new THREE.InstancedBufferAttribute(aHair, 3));
    geometry.setAttribute('iAlt', new THREE.InstancedBufferAttribute(aAlt, 1));
    geometry.setAttribute('iLamp', new THREE.InstancedBufferAttribute(aLamp, 1));
    mesh.count = items.length; mesh.frustumCulled = false; mesh.name = name || 'copies';
    return mesh;
  }

  return {
    object, wheel, fixed, lights, state, anchors,
    sculptGeometry, makeCopies, extentOf, coats: COATS,
    radius: 44, height: 27, center: new THREE.Vector3(0, 10, 0),
    uniforms: U, bulbBands, bulbCount, stations, deckBodies,
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); },
    gildBearing(time) { return ((TAU * time / period) + phase0 + 40 * DEG) % TAU; },
    stageAtBearing(bearing, time) { let d = ((360 * time / period + phase0 / DEG - bearing / DEG) % 360 + 360) % 360, a = 0; for (let i = 0; i < 7; i++) { if (d < a + SECTORS[i]) return i; a += SECTORS[i]; } return 6; },
    update, dispose() {},
    ground: true, groundY: 0,
  };
}
