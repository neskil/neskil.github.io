// The Floor Without Windows (television worlds crew). Built on what the series Severance is known for as an idea only: an
// office floor with no window anywhere, white corridors without end, a few desks alone in a hall far too large, and a
// deeper room that holds what no office should. Every design here is ours (plan, section, lights, desks, floors, the
// tide, the view from above). The world's idea (round nine): A FLOOR WITHOUT A WINDOW AND WITHOUT A SKY. Inside it
// is bright and white; above the floor's ceilings stands A NIGHT-LIKE GREAT HALL WITHOUT END under a dark slab that
// carries a weave of slim bars of light to the horizon (the part's), lit only by things. No daylight, no key light, no
// flock of paper anywhere; no partition stands on or between desks anywhere. ROUND TEN: where hall one stood, A
// ROUND WELL THROUGH THE STOREYS; from above the maze is a plan of districts and warm avenues; the core is the hero
// (three tiers, warm storeys); every tower has a foot; tower B's doorway stands in a porch. ROUND ELEVEN: THE FLIGHT
// BEGINS IN A LOBBY whose glass side shows the court and the hero dead ahead; the well's bridge is glass and its
// galleries are coloured storey by storey; the tide hall is crossed LOW, past a white round stair that stands under
// the round opening, and the rise goes up round that stair; under the diagonal lies A BOULEVARD with two round
// plazas, flown low; the slab is a built roof of ribs and beams, and every great tower meets it in a capital.
// ROUND ELEVEN C: NO ROUND LIGHT STANDS ON ANY CEILING OR SOFFIT OF THE WORLD: a ceiling's lights are A WEAVE OF
// SLIM BARS (one bar to a cell, along in one cell and across in the next; round eleven f: the two flown corridors'
// ceilings and the tide hall's carry no light at all: see THE CEILING LIGHTS); the well reads cool and bright (white,
// turquoise, plum, cobalt, lilac), its tier fronts are thin slab edges, no lift stands in it, and the pendant's
// lamps ride their cord.
// BROUGHT IN (the owner's section 181): the five numbers of the filmic curve in lit() (0.983729, 0.0245786, 0.432951,
// 0.000090537, 0.238081) are those of Stephen Hill's fit of the ACES curve as three.js carries it in its
// ACESFilmicToneMapping (three.js, MIT licence); running that curve backwards is our own. Nothing else in this file
// follows published code. COMMON FORMS, NAMED (round eleven b; each is written here in our own code, none copied):
// the slab test of a ray against a box's pairs of sides (the lobby floor's mirror of the hero's tiers; boxAt, for
// the things in a room); a ray against a ball by the quadratic's nearer root (ballAt); rooms drawn inside one flat
// face by sending the eye's ray into the room's box and taking the nearest of its faces (the method published as
// interior mapping, Joost van Dongen, 2008: the well's rooms, the court's range and windows; the solid things in
// them are ours); the outer half of the exact distance to a box, length(max(abs(p) - h, 0.)) (the form Inigo
// Quilez publishes as sdBox: groundOut and its like); the draws h1c, h1w and the panels' keep the FORM of the
// common one-line sine hash, fract(sin(n * k) * c), with numbers of our own and a cosine term added (none of the
// constants that hash is published with stands in this file); the Hermite ease t * t * (3 - 2 t); coverage by
// clamp((w - d) / fwidth + .5, 0., 1.); a grazing sheen by pow(clamp(1. - cosine, 0., 1.), n) (the shape of
// Schlick's term); the distance to a segment along an axis, length(vec2(max(abs(q.x) - h, 0.), q.y)) (the lobby
// floor's soft bars of light); AN EYE-FACING QUAD, a quad set about a place and turned to face the eye by adding its
// corners in the eye's own frame (commonly called a billboard: the halos of the pendant's lamps).
//
// DECLARED AT THE HEAD (the brief's techNotes 10):
// - SCALE: the whole floor is drawn two and a half times life size (a desk top stands 1.85 m up, a door is 4.4 m by 5.0 m).
// - THE LOBBY (round eleven; the part's P.LOBBY): a white hall 48 m wide, 90 m long and 18 m high. Its east side is
//   glass for 55 m (nine bays from z 22 to z -32.9: as far as the line keeps 5 m from it), the hall's whole
//   height, in slim pale posts every 6.1 m with one slim transom; north of it the side stands open under a lintel;
//   through the glass stand the court, the hero under its capital and the slab's lights. ITS FLOOR (round eleven
//   b) IS PALE POLISHED STONE: broad inlaid bands of a deeper stone across it from the west wall to the glass, one
//   on every line of the ceiling's 6 m lattice; a soft lighter bar under each ceiling light; the court's blue on
//   it from the glass, cool near the glass and warm toward the walls; in its polish the ceiling's lights and,
//   through the glass, the slab's grid and the hero as a grid of lit windows. Its walls are white with fine
//   joints, ONE LINE OF WARM LIGHT round the hall at the corridor's ceiling height. ITS NORTH WALL CARRIES A RANK OF
//   SEVEN TALL NICHES at one even spacing along its whole length, each lit softly from a slot of light in its head
//   and holding one clipped tree in a tub (two kinds, by turns); the wall between them stays white. DOWN THE HALL,
//   8 m and more from the line: two long low planters parallel to that wall, a clipped hedge in each and benches
//   along both its sides. No desk, no relief, no picture, no emblem, no clock, no letter, no figure; no open door.
// - THE CORRIDOR: 7.0 m wide, 6.6 m high, its left wall plumb to 4.6 m with a cove of radius 2.0 m. It leaves the
//   lobby at its north-east corner (z -48) and runs north along x -68 to the well's rim. The flown line runs down
//   its middle: 3.5 m from each side, 3.0 m over the floor, 3.6 m under the ceiling. ITS RIGHT-HAND SIDE IS AN OPEN
//   LOGGIA from the glass's end (z -32.9) to z -78: a low glass rail (1.2 m), the ceiling ending in a seen white edge
//   beam, the plain white ceiling overhead. BESIDE THE LOBBY AND THE LOGGIA: A COURT 24 m deep and 100 m
//   long, OPEN TO THE GREAT HALL: stone paving, lamp standards down its middle, trees in tubs, two rows of long
//   tables with lamps and chairs. ITS FAR SIDE IS A BUILDING WITH ROOMS (round eleven b): a range of bays 4 m wide,
//   each glazed between its posts with one mullion and one transom, and behind the glass a lit room in one of the
//   floors' colours (a floor that goes back, side walls a tone darker, a few solid things under its lamp); its
//   end walls with tall windows of the same making between bracket lamps; over the range the towers of lit floors
//   rising to the slab. THE CORRIDOR'S OPENINGS STAND AT ONE EVEN PITCH from its mouth to the well's rim (round
//   eleven b; as the plan stands, four pitches of 13.65 m): on the left-hand wall a sliding door, THE BAY (12 m
//   wide, one of three special rooms behind it) and a second door; on the right-hand wall, which begins where the
//   loggia ends, one alcove; the last pitch lies in the well's own building and holds nothing. Pale ash panelling
//   between, white above; a warm lamp on a bracket on every plain stretch. Each door stands in a slim frame under
//   a lit pane; its room is lit in one of four saturated colours (coral, plum, cobalt, turquoise: NO GREEN ROOM,
//   WALL OR PANEL) that lies as a pool on the floor before it, AND IS FURNISHED (a desk and its lamp, a chair, a
//   clipped tree in a tub, a low cabinet with plain doors, a standing lamp; its side walls a tone darker than its
//   back wall: never a flat sheet of colour; NO SHELF and no board on a wall). An alcove is a small room 4.2 m
//   deep with a standing lamp and a tree in a tub. THE LINK'S two doors and three alcoves are of the same making.
//   The corridor's floor is the black mirror; nothing translucent hangs in its air.
// - THE WELL OF STOREYS (round ten; the part's P.SHAFT): where hall one stood, a round well 84 m across through the
//   storeys, its axis at (-84, -143), 16 m west of the line. Round it at every storey a ring gallery 6 m deep with
//   a slim glass rail: EIGHTEEN STOREYS BELOW the floor's own (5 m apart), the floor's own (10 m high), SIX ABOVE, a
//   round white ceiling with a weave of slim bars of light at y 40. ROUND ELEVEN: THE WELL IS NOT WHITE. Each
//   gallery's floor is a carpet in its storey's colour (plum, cobalt, turquoise, LILAC in turn; round eleven c: the
//   turquoise a clear turquoise toward blue, the lilac a clear cool pink-violet, and no coral, rose or warm wall
//   in the well), its tier front a thin slab edge in the carpet's colour under the slim glass rail, with no line of
//   light under any tier; its back wall and the slab over it tinted by it, but THE FLOOR'S OWN STOREY'S WALL IS THE
//   LOBBY'S COOL WHITE; under every gallery one slim bar of light to a bay, along the radius; every room in a back wall is seen behind its glazed front, with a reveal, pale side
//   walls, a back wall of one plain tone and A FEW SOLID THINGS (round eleven b: a desk with its lamp and a
//   clipped tree in a tub; or a low cabinet with plain doors and a standing lamp; or a doorway with a lit room
//   beyond and a tree: no shelf, no board on a wall, no rows of marks). White is kept for the floor's own wall, the bars of
//   light and the bridge. The haze below is pale blue-white and begins eight storeys (40 m) down: no
//   bottom is seen. The lights' law runs the well as a slow slanting spiral round and down the rings. THE LINE
//   CROSSES IT ON A GLASS BRIDGE (6 m wide, a chord of 77.7 m): a clear deck between two slim white edge beams, a
//   line of light inside each, a slim white rib every 3 m, glass rails; the galleries below are seen through it.
//   At the axis A ROUND PLATFORM 18 m across hangs on four slim rods, joined to the bridge by a glass spur: on it
//   THE ISLAND (seven desks in a ring facing outward, seven chairs turning) on pale timber. DOWN THE AXIS HANGS ONE
//   LONG PENDANT: a slim cord with a cluster of warm lamps to every storey, and EACH CLUSTER RIDES SLOWLY DOWN ITS
//   CORD AND UP AGAIN at its own dealt rate and reach, on the clock (round eleven c): the well's axis is never
//   still. No lift stands in the well. NO PARTITION, DIVIDER, SCREEN OR PANEL STANDS ON OR BETWEEN ANY DESKS ANYWHERE IN THE WORLD. FROM
//   OUTSIDE the well is one more pile of lit floors among the towers (the part's).
// - THE CEILING LIGHTS (round eleven c): ONE CEILING LANGUAGE, A WEAVE OF SLIM BARS OF LIGHT. A ceiling is cut in
//   square cells; each cell holds one slim bar, a sixth of the cell broad and two thirds of it long, lying along
//   in one cell and across in the next, turn about, by the cell's own place: the lobby's cells are 6 m, the well's
//   ceiling's 6 m about its axis; a room's own ceiling carries slim bars too, a gallery's under side one bar to a
//   bay along the radius, a porch's soffit one to a panel. NO ROUND LIGHT STANDS ON ANY CEILING OR SOFFIT.
//   ROUND ELEVEN F: THE TWO FLOWN CORRIDORS' CEILINGS (the loggia corridor's, the link's) CARRY NO LIGHT FITTING: no
//   bar, strip, panel, disc or lamp, flush or hung; each is plain between its coves. A corridor's light is ITS
//   COVE'S (the glow line along the head of both walls) and that of its shaded lamps on the walls and of the rooms
//   that open off it; THE LIGHTS' ONE LAW IS CARRIED BY THE COVE: its glow rests at three tenths and is whole where
//   a front of the wave passes that metre of the corridor; the white faces take their shares of it (COVE), the wall
//   lamps swell with it. THE LINK'S FLOOR IS CARPETED IN THE TIDE HALL'S BLUE, level and still, from the well's
//   bridge to the hall's mouth: the tide's own carpet. HALL TWO'S CEILING CARRIES NO LIGHT: no line of light and no
//   scallop on a wall under one; it is white and takes THE SEA'S LIGHT: the carpet's blue as a pale cast and a
//   drifting net of whiter light, strongest over the swell's crests; the great round opening stands in it.
// - THE LINE, 965 m in 50 s (955 m of run in plan; its places by name are the part's RUNS; every height, look and
//   pace below goes by them). FROM THE LOBBY (round eleven b: places of the lobby decide it): it begins 20 m inside
//   the south wall, a third of the hall's breadth from the west wall, at (-96.5, 22); 47.9 m straight on a heading
//   27 degrees east of north, toward the glass; then a bend of radius 60 m that ends at the corridor's mouth
//   (-68, -48), heading north. NORTH along x -68, level at 3.0 m: the corridor with its
//   loggia, the throat, THE BRIDGE over the well, THE LINK from the well's north side to THE QUAY (z -222). OVER
//   THE TIDE LOW: across the lapping margin the lens sinks to y 2.0 and holds it to the stair, along a strip 7 m
//   wide that no rider enters. THE RISE: a wheel of radius 30 m about the stair (a white round stair on a fixed
//   round plinth under the round opening, its last landing joined to the opening's rim by a gangway), level for
//   its first eighth, then one even climb through the round opening to y 41. THE LAST LEG: a right turn of radius
//   120 m onto THE DIAGONAL, 35 degrees south of east; level at 41 until the planted border round the opening lies
//   behind, then one even sinking to y 13 at the head plaza's near rim; LEVEL AT 13 DOWN THE BOULEVARD (the part's
//   BLVD: 28 m broad under the diagonal, a round head plaza, a second round plaza on the hero's side, pools, trees
//   and lamp standards, glass roofs over the rooms beside it), through its gate in the garden court's north wall
//   and over the court to the canal's head; over the canal the last 4 m down to y 9; THE TURN DOWN (left, radius
//   150 m) along the canal; where it comes due east at (240.6, 9, -86) THE STREET leaves the court: along z -86,
//   18 m wide, to THE RING, RADIUS 8, at (345, 9, -86), which faces west in tower B's great doorway (30 m wide
//   and high, under a deep reveal, in a porch). The engine's portal takes the radius asked: 8 m.
// - THE LOOK IS ONE, GIVEN BY PLACES (see the two functions before `pois`, where every key is named): the hero
//   through the lobby's glass, until the well's own building covers it; from there round to the well, deepest
//   while the island's platform passes abeam, and back by the bridge's north end; the stair, from the quay round
//   the wheel (a pull of two thirds toward its axis); the hero, from the wheel's west point: from the top of the
//   rise to the head plaza's middle the gaze holds on one place, the point on the hero's axis half way up between
//   its terrace and its capital's rim; part way to the hero down the boulevard; the way ahead from the
//   garden court's wall on. The camera's fastest turn is on the wheel: 26.6 degrees a second.
// - WHAT HAS A CEILING FROM BELOW HAS A ROOF FROM ABOVE: over the lobby, the corridor, the link and hall two stands
//   the part's roof 1.5 m thick with a low parapet and glowing skylights of its own (see the part);
//   hall two's round opening is a real well through it (a deep ring lined with slim upright warm bars on twelve slim
//   columns): from below A ROUND NIGHT IN A WHITE CEILING: the dark slab and its lights. The ceilings themselves
//   are drawn from below only. The rooms beside the boulevard lie under glass roofs; every other room of the floor
//   is roofless: the part's maze over 26 m cells. The court beside the corridor has no roof (the part's sheet has
//   a hole over it; this file draws it).
// - THE LIGHT ABOVE THE CEILINGS (round nine) is the part's: NO SKY, NO DAYLIGHT, NO KEY LIGHT, NO SHADE OF A SUN.
//   A flat dark slab (deep blue-violet, never black), BUILT: ribs on every 24 m joint, great beams through each
//   great tower's axis, a small round cool-white light in every coffer, which carry the lights' law (fronts cross
//   the slab as slanting lines of brighter lights) and converge at the horizon; light only from things: the maze's
//   lit tiles and ribbons, the towers' lit storeys (each tower in a pool of its own light, each great one under
//   the lit rim of its capital), lamps, the pools' and the canal's mirrors, tower B's doorway, the ring; a thin
//   cool haze in sheets, which lies behind the towers' feet. THE TWO OPEN STREETS ARE PAVED IN STONE and stand in
//   that night: deep blue between the lights, a warm pool under every lamp standard, each open door's colour on
//   the paving, the line of light over the door heads, the slot of light at the walls' feet; TOWER B'S DOORWAY
//   pours its warm white light down the forecourt, its pool (still water in a pale kerb: a dark mirror of doorway,
//   pile, slab and ring) and the street, a path 120 m long that keeps its joints.
// - EVERY LIGHT AND MOTION IS BY PLACE AND BY THE WORLD CLOCK. The ceiling lights: brightness rest + (1 - rest)
//   hump(frac((x + z) / 60 + t / 2)), hump 0.3 of the cycle wide, at each light's own place: bright fronts pass from
//   light to light over the lobby and down each flown corridor's coves; under each front a bar
//   of light crosses the floors, a pulse runs along each corridor of the open maze, the lamps of the maze swell as
//   slow visible swells, and the gardens stand out a little brighter; in the two open streets alone the wave goes
//   by (z - x) / 60 + t / 2, so that their lights run east, toward the tower. Sliding doors: open =
//   hump(frac((x + z) / 150 - t / 3.75)), hump 0.45 wide; a door's colour falls out as it slides. The towers'
//   lifts: each car on its own period; the pendant's lamps: each on its own ride. AFTER HOURS (the part's): a sector 100 degrees wide about the round opening's middle
//   turns once in 240 s; in it the tiles are dark but for one in nine and the ribbons glow at a quarter. NO PAPER
//   FLIES. Low jets of water play along the canal's edges and the forecourt's pool; the canal ripples; the trees'
//   leaves stir. THE TIDE (round nine): two trains, 3.2 m from trough to crest / 60 m long / 7 m a second from the
//   north-west and 0.4 m / 23 m / 5 from the north, their sum never over 1.8 m either way (the highest crest at
//   y -0.8), a third of it within 6 m of a wall or a quay and the whole of it from 30 m off. THE SWELL IS THE SAME
//   ON EVERY SEED: its heights, lengths, speeds, directions and phases are fixed numbers (no stream), it runs on
//   the world clock from the first moment, and it stays low and long: steepest slope 11.85 degrees, counted with
//   the edges. update() reads no metres flown for anything of the place.
// - GROUPS ARE DRAWN BY WHERE THE EYE STANDS (which room of the plan the camera's own position lies in), never by metres
//   flown or by time.
// - THE FLOWN PLAN IS FIXED ON EVERY SEED; the seed deals colours, the far maze, the towers, the rooms' contents and
//   all phases. ctx.vary: density sets the width of the after-hours sector (120 to 80 degrees), mood the grade's
//   saturation (1.00 to 1.08); rare stages nothing; the hour is not honoured (no sky, no daylight).
// - camera.nearThrough is NOT set. The world sets neither portal.drawWithin nor portal.drawIn: the ring is whole at every metre.
// - STREAMS, each from ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed)): the part's fww-maze, fww-district,
//   fww-core, fww-towb, fww-far, fww-pile, fww-form, fww-stack, fww-lifts, fww-lifts-b, fww-garden, fww-court,
//   fww-furnish, fww-after, fww-blue, fww-adrift, and the world's own as listed at the head of build(): fww-look,
//   fww-doors, fww-island, fww-hall, fww-rooms, fww-well, fww-gallery, fww-plain, fww-niche, fww-alcove,
//   fww-link-doors, fww-lobby-trees, fww-room-deal, fww-pendant; the slab's provinces and outs: the part's fww-sky.
// - SEEN THROUGH A RING BEFORE THE ENTRY: the lobby's floor, walls and ceiling stand round the entry's own place, and
//   a face of the floor's own stone, in shade, stands under the floor in the entry's own plane (square to the
//   line's heading at its first metre), so that a ring wider than the floor is near shows stone, not the void.
import * as THREE from 'three';
import { makePath, clamp, smoothstep } from '../kit/core.js';
import { buildHero, P, RUNS, COURT, lineAt, heightAt, linePoints, FOG_ABOVE, GLSL_WAVE, GLSL_NIGHT, GLSL_SLAB, GLSL_BRACKET, GLSL_TIDE, GLSL_CARPET, TIDE_SHADE, TIDE_LEVEL, TIDE_TRAINS, tideH, tideSlope, adriftDealStages, STAIR, TIDE_LAP, fleetLampsInto, runAtZ, HERO_SHOULDERS, STACK_PROUD, WEAVE } from '../parts/floor-without-windows.js';

// (round eight: no green among them)
const DISTRICTS = ['#3f7fd6', '#84449a', '#1fa3b8', '#c9457a', '#ee6666'];
// the way out of hall one, the link and the quay: half width and height
const WAY = { hw: 7, h: 8 };
// the lift car's warm light (on the doorway's frame and down the concourse floor)
const LIFT_WARM = [1.2, 0.97, 0.68];
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const WHITE = lin('#f4f3ee'), FLOOR = lin('#d9dad6'), HOLLOW = lin('#f4f3ee', 0.62);
// THE CORRIDOR'S FLOOR IS A DARK MIRROR (round three): deep blue-black, polished
const MIRROR = lin('#1c2028');
const DOOR_H = 5.0, DOOR_W = 4.4, REVEAL = 0.35;
// the corridors' panelling: pale ash
const PANEL = lin('#e9dfcb'), POST = lin('#2b3038');
// THE GLAZED GALLERY (round eight): the flown corridor's right-hand wall is glass from the entry for GAL.len metres
// (to z -78, where hall one's own wall with its rooms begins), and beside it lies A COURT GAL.deep metres deep, open
// to the great hall (round nine: the hall that lay there has lost its ceiling and its far wall)
// (round ten: THE GLASS STANDS ONLY FOR THE FIRST GAL.glass METRES; from there to GAL.len the side is AN OPEN LOGGIA)
// (round eleven: THE GLASS IS THE LOBBY'S, 18 m high, from z 22 north to the part's P.LOBBY.glassN; the loggia from
// there to z -78)
// (z0, zN: the court's south end, abeam of the glass's south end, and its north end, `len` metres on: places of the
// building, never metres of the line)
const GAL = { len: 100, deep: 24, glass: P.LOBBY.glassS - P.LOBBY.glassN, z0: P.LOBBY.glassS, zN: P.LOBBY.glassS - 100 };

// ---------------------------------------------------------------- a builder of quads for the white shells
// attributes: position, normal, color (albedo), aC (metres along the corridor, metres across, x + z of the centre line
// there, its change per metre along), aP (part: 0 floor, 1 wall, 2 glow line, 3 cove, 4 ceiling; then the tangent x, z),
// aS (the opening whose light falls on this face: its place x, z on its wall, its colour's number, its kind: 0 none,
// 1 a door that opens and shuts in the wave, 2 an open bay, 3 a niche)
const NONE4 = [0, 0, 0, 0];
function makeShellBuilder() {
  const pos = [], nor = [], col = [], cc = [], pt = [], sp = [];
  return {
    quad(p, n, c, a, t, s = NONE4) {
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const q = p[i], m = Array.isArray(n[0]) ? n[i] : n, e = Array.isArray(a[0]) ? a[i] : a, f = Array.isArray(t[0]) ? t[i] : t, k = Array.isArray(c[0]) ? c[i] : c;
        pos.push(q[0], q[1], q[2]); nor.push(m[0], m[1], m[2]); col.push(k[0], k[1], k[2]); cc.push(e[0], e[1], e[2], e[3]); pt.push(f[0], f[1], f[2]); sp.push(s[0], s[1], s[2], s[3]);
      }
    },
    tri(p, n, c, a, t) {
      for (let i = 0; i < 3; i++) { const q = p[i]; pos.push(q[0], q[1], q[2]); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); cc.push(a[0], a[1], a[2], a[3]); pt.push(t[0], t[1], t[2]); sp.push(0, 0, 0, 0); }
    },
    get triangles() { return pos.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 4));
      g.setAttribute('aP', new THREE.Float32BufferAttribute(pt, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(sp, 4));
      return g;
    },
    // the same for a very large shell: the page gets a breath after every attribute
    async buildLong(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      await ctx.yield();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      await ctx.yield();
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      await ctx.yield();
      g.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 4));
      await ctx.yield();
      g.setAttribute('aP', new THREE.Float32BufferAttribute(pt, 3));
      await ctx.yield();
      g.setAttribute('aS', new THREE.Float32BufferAttribute(sp, 4));
      return g;
    },
  };
}
// the section of a corridor as pieces of one side, from the floor's middle out and up to the ceiling's middle:
// half width hw, height H, cove radius R; `low` pieces stand open at a door or a bay (up to 5.0 m)
function corridorProfile(hw, H, R, band, floor = MIRROR, panel = WHITE) {
  const spring = H - R, cx = hw - R, P0 = [], th = (y) => Math.asin((y - spring) / R), at = (a) => [cx + R * Math.cos(a), spring + R * Math.sin(a)];
  P0.push({ a: [0, 0], b: [hw - 0.96, 0], part: 0, col: floor }, { a: [hw - 0.96, 0], b: [hw - 0.06, 0], part: 0, col: band || floor });
  P0.push({ a: [hw - 0.06, 0], b: [hw - 0.06, 0.5], part: 1, col: WHITE, low: true }, { a: [hw - 0.06, 0.5], b: [hw, 0.5], part: 1, col: WHITE, low: true });
  let a0;
  if (spring > DOOR_H) {
    P0.push({ a: [hw, 0.5], b: [hw, DOOR_H], part: 1, col: panel, low: true }, { a: [hw, DOOR_H], b: [hw, spring], part: 1, col: WHITE });
    a0 = th(spring + 0.35);
    P0.push({ a: [hw, spring], b: at(a0), part: 2, col: WHITE });
  } else {
    P0.push({ a: [hw, 0.5], b: [hw, spring], part: 1, col: panel, low: true });
    const a1 = th(spring + 0.35); a0 = th(DOOR_H);
    P0.push({ a: [hw, spring], b: at(a1), part: 2, col: WHITE, low: true }, { a: at(a1), b: at(a0), part: 3, col: WHITE, low: true });
  }
  for (let i = 0; i < 5; i++) P0.push({ a: at(a0 + (Math.PI / 2 - a0) * i / 5), b: at(a0 + (Math.PI / 2 - a0) * (i + 1) / 5), part: 3, col: WHITE, smooth: [cx, spring] });
  P0.push({ a: [cx, H], b: [0, H], part: 4, col: WHITE });
  // where the section stands at door-head height (the head of a reveal begins there)
  P0.headD = spring > DOOR_H ? hw : cx + R * Math.cos(th(DOOR_H));
  P0.hw = hw;
  return P0;
}
// a flat wall as a profile (for a hall): d 0 is the wall's face, the hall lies on the minus side
function wallProfile(y0, H, skirt) {
  const P0 = [];
  if (skirt) P0.push({ a: [-0.06, y0], b: [-0.06, y0 + 0.5], part: 1, col: WHITE, low: true }, { a: [-0.06, y0 + 0.5], b: [0, y0 + 0.5], part: 1, col: WHITE, low: true });
  P0.push({ a: [0, y0 + (skirt ? 0.5 : 0)], b: [0, DOOR_H], part: 1, col: WHITE, low: true }, { a: [0, DOOR_H], b: [0, H], part: 1, col: WHITE });
  P0.headD = 0; P0.hw = 0;
  return P0;
}
// the opening of a list nearest to s (each { q, x, z, ci, kind }), as a face's aS
function spillAt(list, s, reach) {
  let best = null, bd = reach;
  for (const o of list) { const d = Math.abs(o.q - s); if (d < bd) { bd = d; best = o; } }
  return best ? [best.x, best.z, best.ci, best.kind] : NONE4;
}
// sweep one side of a profile along a centre line. frame(s) -> [x, z, tx, tz]; side +1 the right hand, -1 the left;
// open: spans [s0, s1] where the low pieces stand open with a reveal 0.35 m deep ([s0, s1, 'full']: the whole side
// stands open under a flat ceiling, as where two corridors cross); stations hold every span's ends. own and opp: the
// openings of this wall and of the wall opposite, whose light falls on this side's floor and on this wall. jambOf: when
// a run is swept in two pieces, which of the reveals' ends this piece makes.
function sweep(B, frame, stations, side, prof, open, own = [], opp = [], jambOf = null) {
  const pt = (f, q) => [f[0] - f[3] * q[0] * side, q[1], f[1] + f[2] * q[0] * side];
  // (a frame whose fifth number is -1 is an open street's: its lights' wave goes by z - x, so that it runs east)
  const cc = (f, s, q) => f[4] === -1 ? [s, q[0] * side, f[1] - f[0], f[3] - f[2]] : [s, q[0] * side, f[0] + f[1], f[2] + f[3]];
  // a soft shade on the wall beside every reveal, fading out over 0.7 m
  const ao = (s) => { let m = 0; for (const o of open) { const d = s < o[0] ? o[0] - s : s > o[1] ? s - o[1] : 0; m = Math.max(m, 1 - smoothstep(0, 0.7, d)); } return 1 - 0.2 * m; };
  const top = prof[prof.length - 1];
  for (let i = 0; i < stations.length - 1; i++) {
    const s0 = stations[i], s1 = stations[i + 1], sm = (s0 + s1) / 2, f0 = frame(s0), f1 = frame(s1);
    const isOpen = open.some((o) => sm > o[0] && sm < o[1]), full = open.some((o) => o[2] === 'full' && sm > o[0] && sm < o[1]);
    const sOwn = spillAt(own, sm, 7.5), sOpp = spillAt(opp, sm, 3);
    for (const g of prof) {
      if (g.low && isOpen) continue;
      if (full && g.part !== 0 && g.part !== 4) continue;
      const nrm = (f, q) => {
        let nd, ny;
        if (g.smooth) { nd = g.smooth[0] - q[0]; ny = g.smooth[1] - q[1]; } else { nd = -(g.b[1] - g.a[1]); ny = g.b[0] - g.a[0]; }
        const l = Math.hypot(nd, ny) || 1;
        return [-f[3] * nd / l * side, ny / l, f[2] * nd / l * side];
      };
      let k0 = g.colAt ? g.colAt(s0) : g.col, k1 = g.colAt ? g.colAt(s1) : g.col;
      const shaded = g.low && g.part === 1 && open.length > 0;
      if (shaded) { const a0 = ao(s0), a1 = ao(s1); k0 = [k0[0] * a0, k0[1] * a0, k0[2] * a0]; k1 = [k1[0] * a1, k1[1] * a1, k1[2] * a1]; }
      B.quad([pt(f0, g.a), pt(f1, g.a), pt(f1, g.b), pt(f0, g.b)], [nrm(f0, g.a), nrm(f1, g.a), nrm(f1, g.b), nrm(f0, g.b)], g.colAt || shaded ? [k0, k1, k1, k0] : g.col,
        [cc(f0, s0, g.a), cc(f1, s1, g.a), cc(f1, s1, g.b), cc(f0, s0, g.b)], [[g.part, f0[2], f0[3]], [g.part, f1[2], f1[3]], [g.part, f1[2], f1[3]], [g.part, f0[2], f0[3]]],
        g.part === 0 ? sOwn : g.part < 3.5 ? sOpp : NONE4);
    }
    if (full) {
      // the flat ceiling of a crossing's square, from the ceiling's own edge out to the wall's plane
      const a = top.a, b = [prof.hw, top.a[1]];
      B.quad([pt(f0, a), pt(f1, a), pt(f1, b), pt(f0, b)], [0, -1, 0], WHITE, [cc(f0, s0, a), cc(f1, s1, a), cc(f1, s1, b), cc(f0, s0, b)], [4, f0[2], f0[3]]);
    } else if (isOpen) {
      // the head and the threshold of the reveal over this stretch
      const w = prof.hw, hd = prof.headD, a = [hd, DOOR_H], b = [w + REVEAL, DOOR_H], c = [w - 0.06, 0], d = [w + REVEAL, 0];
      B.quad([pt(f0, a), pt(f1, a), pt(f1, b), pt(f0, b)], [0, -1, 0], HOLLOW, [cc(f0, s0, a), cc(f1, s1, a), cc(f1, s1, b), cc(f0, s0, b)], [1, f0[2], f0[3]]);
      B.quad([pt(f0, c), pt(f1, c), pt(f1, d), pt(f0, d)], [0, 1, 0], FLOOR, [cc(f0, s0, c), cc(f1, s1, c), cc(f1, s1, d), cc(f0, s0, d)], [0, f0[2], f0[3]], sOwn);
    }
  }
  // the jambs of every reveal
  for (const o of open) for (const e of [0, 1]) {
    if (o[2] === 'full' || (jambOf && !jambOf(o[e]))) continue;
    const s = o[e], f = frame(s), w = prof.hw, sg = e ? -1 : 1;
    const a = [w - 0.06, 0], b = [w + REVEAL, 0], c = [w + REVEAL, DOOR_H], d = [prof.headD, DOOR_H];
    B.quad([pt(f, a), pt(f, b), pt(f, c), pt(f, d)], [f[2] * sg, 0, f[3] * sg], HOLLOW, [cc(f, s, a), cc(f, s, b), cc(f, s, c), cc(f, s, d)], [1, f[2], f[3]]);
  }
}
// stations of a run from s0 to s1: a regular step, with every opening's ends among them (and the end of the shade
// beside each), and the bounds of every opening's light (spills: lists of { q })
function stationsOf(s0, s1, step, opens, spills = []) {
  const set = new Set(), add = (e) => { if (e > s0 && e < s1) set.add(Math.round(e * 1000) / 1000); };
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) set.add(Math.round((s0 + (s1 - s0) * i / n) * 1000) / 1000);
  for (const list of opens) for (const o of list) { add(o[0]); add(o[1]); if (o[2] !== 'full') { add(o[0] - 0.7); add(o[1] + 0.7); } }
  for (const list of spills) {
    const qs = list.map((o) => o.q).sort((a, b) => a - b);
    for (let i = 0; i < qs.length; i++) { add(qs[i] - 2); add(qs[i] + 2); if (i > 0) add((qs[i] + qs[i - 1]) / 2); }
  }
  return [...set].sort((a, b) => a - b);
}

// one room behind an opening (part 5): floor, ceiling, a back wall of one colour, two side walls. f is the frame at the
// opening's middle, d0 the metres from the centre line to the room's front, off a shift of the room along the wall
// each room's light is one of the floors' clear colours (round eight): coral, plum, cobalt, turquoise, white, and a
// deeper turquoise. NO GREEN, no yellow and no orange room stands anywhere.
const PALE = ['#ff6b7a', '#a05ad0', '#3d6fe6', '#22c7c7', '#f1efe9', '#149fb0'].map((h) => lin(h));
const Z4 = [0, 0, 0, 0];
// the colours a room's light may have on the floor before it: the rooms' six, a warm lamp light, plain white, a cool grey
const SPILL = PALE.concat([lin('#ffe2b0'), lin('#ffffff'), lin('#cfd6dc')]);
function roomBox(B, f, side, d0, w, depth, h, back, o = {}) {
  const rx = -f[3] * side, rz = f[2] * side, tx = f[2], tz = f[3], off = o.off || 0, y0 = o.y0 === undefined ? -0.02 : o.y0, hw = w / 2;
  // (round four: a room's faces are part 5.3 and carry the room's own measure: metres along the wall from its middle,
  // metres in from its front, its depth, its half width: the shader lays the carpet, the skirting and the shade by it)
  const c = (a, d, y) => [f[0] + tx * (a + off) + rx * (d0 + d), y, f[1] + tz * (a + off) + rz * (d0 + d)], t5 = [5.3, tx, tz];
  const m = (a, d) => [a, d, depth, hw], A0 = m(-hw, 0), A1 = m(hw, 0), B0 = m(-hw, depth), B1 = m(hw, depth);
  // (the room's own light colours its floor too)
  B.quad([c(-hw, 0, y0), c(hw, 0, y0), c(hw, depth, y0), c(-hw, depth, y0)], [0, 1, 0], o.floor || [FLOOR[0] * 0.55 + back[0] * 0.45, FLOOR[1] * 0.55 + back[1] * 0.45, FLOOR[2] * 0.55 + back[2] * 0.45], [A0, A1, B1, B0], t5);
  B.quad([c(-hw, 0, h), c(hw, 0, h), c(hw, depth, h), c(-hw, depth, h)], [0, -1, 0], WHITE, [A0, A1, B1, B0], t5);
  B.quad([c(-hw, depth, y0), c(hw, depth, y0), c(hw, depth, h), c(-hw, depth, h)], [-rx, 0, -rz], back, [B0, B1, B1, B0], t5);
  const sw = o.wall || [back[0] * 0.86 + 0.08, back[1] * 0.86 + 0.08, back[2] * 0.86 + 0.08];
  B.quad([c(-hw, 0, y0), c(-hw, depth, y0), c(-hw, depth, h), c(-hw, 0, h)], [tx, 0, tz], sw, [A0, B0, B0, A0], t5);
  B.quad([c(hw, 0, y0), c(hw, depth, y0), c(hw, depth, h), c(hw, 0, h)], [-tx, 0, -tz], sw, [A1, B1, B1, A1], t5);
  // the room's own front wall, seen only from inside it
  if (o.front) B.quad([c(-hw, 0, y0), c(hw, 0, y0), c(hw, 0, h), c(-hw, 0, h)], [rx, 0, rz], o.wall || WHITE, [A0, A1, A1, A0], t5);
}
// a door's leaf (part 6), sliding along the wall by the doors' wave at its place: a frame of stiles and rails 0.35 m
// wide, two sunk panels, a kick plate of brushed metal and a long bar handle. Every face carries the same place and
// travel, so the leaf slides as one. d0 is the metres from the centre line to the panels' plane.
const METAL = lin('#c9cdd2'), METAL_D = lin('#8f959d');
// (dir: the way the leaf slides along the wall's frame, travel: how far)
function leafDoor(B, f, side, d0, w, h, col, dir = 1, travel = w + 0.1, slot = null) {
  const rx = -f[3] * side, rz = f[2] * side, tx = f[2], tz = f[3], hw = w / 2;
  const px = f[0] + rx * d0, pz = f[1] + rz * d0, aC = [0, 0, px + pz, dir * travel], t6 = [6, tx, tz], n = [-rx, 0, -rz];
  const c = (a, y, out) => [f[0] + tx * a + rx * (d0 - out), y, f[1] + tz * a + rz * (d0 - out)];
  const k = (m) => [col[0] * m, col[1] * m, col[2] * m];
  const face = (a0, a1, y0, y1, out, kc) => B.quad([c(a0, y0, out), c(a1, y0, out), c(a1, y1, out), c(a0, y1, out)], n, kc, aC, t6);
  const F = 0.5, S = 0.07, mid = 2.55;
  // the frame: two stiles, a head rail, a middle rail, a foot rail under the kick plate
  face(-hw, -hw + F, 0, h, S, k(1)); face(hw - F, hw, 0, h, S, k(1));
  face(-hw + F, hw - F, h - F, h, S, k(0.94)); face(-hw + F, hw - F, mid - F / 2, mid + F / 2, S, k(1)); face(-hw + F, hw - F, 0, 0.62, S, k(1));
  // the two sunk panels with the shade of their rebates (the upper edge in shade, the foot catching light)
  for (const [y0, y1] of [[0.62, mid - F / 2], [mid + F / 2, h - F]]) {
    face(-hw + F, hw - F, y0, y1, 0, k(0.86));
    B.quad([c(-hw + F, y1, S), c(hw - F, y1, S), c(hw - F, y1, 0), c(-hw + F, y1, 0)], n, k(0.55), aC, t6);
    B.quad([c(-hw + F, y0, 0), c(hw - F, y0, 0), c(hw - F, y0, S), c(-hw + F, y0, S)], n, k(1.08), aC, t6);
    B.quad([c(-hw + F, y0, S), c(-hw + F, y0, 0), c(-hw + F, y1, 0), c(-hw + F, y1, S)], n, k(0.7), aC, t6);
    B.quad([c(hw - F, y0, 0), c(hw - F, y0, S), c(hw - F, y1, S), c(hw - F, y1, 0)], n, k(0.96), aC, t6);
  }
  // the kick plate and the bar handle (on the side the leaf leaves last)
  face(-hw + 0.12, hw - 0.12, 0.06, 0.52, S + 0.012, METAL);
  const ha = dir > 0 ? -hw + 0.62 : hw - 0.62;
  face(ha - 0.05, ha + 0.05, 1.0, 3.2, S + 0.13, METAL);
  B.quad([c(ha - 0.05, 1.0, S), c(ha - 0.05, 1.0, S + 0.13), c(ha - 0.05, 3.2, S + 0.13), c(ha - 0.05, 3.2, S)], n, METAL_D, aC, t6);
  B.quad([c(ha + 0.05, 1.0, S + 0.13), c(ha + 0.05, 1.0, S), c(ha + 0.05, 3.2, S), c(ha + 0.05, 3.2, S + 0.13)], n, METAL_D, aC, t6);
  if (slot) {
    // (round ten: A PALE LEAF CARRIES TWO TALL GLAZED SLOTS, one in each panel, on the side away from its handle:
    // the room's own lit colour is seen in them, so that a shut door is never a flat sheet of colour)
    const sa = dir > 0 ? hw - F - 0.8 : -hw + F + 0.25, t7 = [7, tx, tz];
    for (const [y0, y1] of [[0.9, mid - F / 2 - 0.28], [mid + F / 2 + 0.28, h - F - 0.28]]) B.quad([c(sa, y0, 0.004), c(sa + 0.55, y0, 0.004), c(sa + 0.55, y1, 0.004), c(sa, y1, 0.004)], n, slot, aC, t7);
  }
  return [px, pz];
}
// THE GALLERY'S GLAZING (round eight): plain clear glass. It adds only a faint cool sheen, stronger where the look
// lies flat along it and in a soft band at the height of the corridor's cove's spring (4.6 m: its glow line
// stands in the glass there); never more than a fifth of what is seen through it
const GLASS_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GLASS_FRAG = /* glsl */`
varying vec3 vW; uniform float uFogKIn;
void main(){
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 v = toEye / max(dist, 1e-3);
  float fres = pow(clamp(1. - abs(v.x), 0., 1.), 4.), hb = (vW.y - 4.6) / 1.4, band = exp(-hb * hb);
  float a = min(.03 + .2 * fres * (.45 + .55 * band), .2) * exp(-dist * uFogKIn * .5);
  gl_FragColor = vec4(vec3(.86, .93, 1.), a);
}`;
// a flat end across a corridor (part 5)
function capWall(B, f, hw, y0, y1, col) {
  const c = (d, y) => [f[0] - f[3] * d, y, f[1] + f[2] * d];
  B.quad([c(-hw, y0), c(hw, y0), c(hw, y1), c(-hw, y1)], [-f[2], 0, -f[3]], col, Z4, [5, f[2], f[3]]);
}

// where a coved section opens through a flat wall: the wall under it (from y0 up to the floor), over it (to `top`)
// and the two spandrels beside its coves. f is the frame along the wall at the mouth's middle; the wall's face looks
// to the left of that heading
function mouth(B, f, hw, H, R, y0, top, col, sides = [-1, 1]) {
  const c = (a, y) => [f[0] + f[2] * a, y, f[1] + f[3] * a], n = [f[3], 0, -f[2]], t1 = [1, f[2], f[3]];
  // (a mouth's faces stand across their corridor at one metre of it, the mouth's middle on its centre line: THEY
  // TAKE THE PLACE'S NUMBER IN THE LIGHTS' WAVE AT THAT METRE, the centre line's x + z there, as a swept face does,
  // so that a spandrel swells with the cove beside it. Their metres along and across, and the number's change with
  // the metre, are nought: the whole face stands at the one metre. A hall's shell takes no cove's light and reads
  // none of it: its mouths carry the number unread; the well's mouth carries none)
  const cc = () => [0, 0, f[0] + f[1], 0];
  if (y0 < 0) B.quad([c(-hw, y0), c(hw, y0), c(hw, 0), c(-hw, 0)], n, col, cc(), t1);
  if (top > H) B.quad([c(-hw, H), c(hw, H), c(hw, top), c(-hw, top)], n, col, cc(), t1);
  // the ends of the corridor's skirting (0.06 m proud of its wall, 0.5 m high)
  for (const sg of sides) B.quad([c((hw - 0.07) * sg, 0), c((hw + 0.01) * sg, 0), c((hw + 0.01) * sg, 0.5), c((hw - 0.07) * sg, 0.5)], n, col, cc(), t1);
  // the spandrels are cut where the section's own cove is cut (see corridorProfile), so that no sliver stands open
  const spring = H - R, th = (y) => Math.asin(clamp((y - spring) / R, -1, 1)), cuts = [0, th(spring + 0.35)];
  let aLow = cuts[1];
  if (spring <= DOOR_H) { aLow = th(DOOR_H); cuts.push(aLow); }
  for (let i = 1; i <= 5; i++) cuts.push(aLow + (Math.PI / 2 - aLow) * i / 5);
  for (const sg of sides) for (let i = 0; i < cuts.length - 1; i++) {
    const a0 = cuts[i], a1 = cuts[i + 1], cx = (hw - R) * sg, cy = H - R;
    B.tri([c(hw * sg, H), c(cx + R * Math.cos(a0) * sg, cy + R * Math.sin(a0)), c(cx + R * Math.cos(a1) * sg, cy + R * Math.sin(a1))], n, col, cc(), t1);
  }
}

// a box of plain white (part 5)
function box(B, x0, x1, y0, y1, z0, z1, col, part = 5) {
  const t = [part, 1, 0];
  B.quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], col, Z4, t);
  B.quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], col, Z4, t);
  B.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], col, Z4, t);
  B.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], col, Z4, t);
  B.quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], col, Z4, t);
}

// ---------------------------------------------------------------- the white that reads: one shader for every shell
// Shade comes from the section's own coordinates (corners, coves) and, in a flown corridor, from its cove's light by
// the place's own number in the wave. Every pattern is faded by its size on screen. White stays between 0.55 and 0.95.
// A FLOWN CORRIDOR'S LIGHT (round eleven f), in plain shares that were chosen before anything was drawn. ITS CEILING
// CARRIES NO LIGHT FITTING; ITS LIGHT IS ITS COVE'S: the glow line at the spring of each cove, which goes by the
// lights' one law at its own metre of the corridor: `rest` of its light between fronts, the whole at a front. A
// white face's light is `other` (the share that is not the cove's: its lamps', its rooms', the white about it) and
// its own share of the cove's light by its place in the section, so that the brightest face, the cove's own at its
// spring, stands at the whole white at a front. cove: the cove's face, from its spring (beside the glow line) to
// its head (a quarter turn further from it). ceil: the ceiling at the cove's head (the cove's own share there), less
// the second number of that at the third number of metres in from it: the link's axis, half its flat ceiling's
// breadth between its coves; plain between its coves. wall: a wall at the spring (it looks at the cove across the
// corridor: between the cove's two shares), half of that at the second number of metres under the spring: the
// link's wall's foot. floor: the floor (it lies as far from the coves as the link's ceiling's middle and takes
// what that takes). line: the glow line's own light at a front, in whole whites. mirror: the share of the glow
// line's light that the corridor's black stone gives back beyond its polish's own (a fine faint line down each side
// of the floor: the floor stays black). lamp: a wall lamp swells with its cove, from this share of its light at
// rest to the whole at a front (a shaded lamp stays lit between fronts).
const COVE = { rest: 0.3, other: 1 / 4, cove: [3 / 4, 1 / 2], ceil: [1 / 2, 1 / 4, WAY.hw - P.COVE], wall: [5 / 8, WAY.h - P.COVE], floor: 3 / 8, line: 5 / 2, mirror: 1 / 8, lamp: 1 / 2 };
// THE NET OF THE SEA'S LIGHT ON HALL TWO'S CEILING: ITS OWN MEAN, COUNTED FROM ITS LAW (round eleven g). The law (the
// hall's ceiling in SHELL_FRAG): two families of soft lines; a family's light at a place is the cube of 1 - |c|, c
// the sine of that family's own phase there; the net is the two families' sum, at most 1. Over place and clock a
// family's phase passes evenly through its turn, and the two families run across each other: the mean is counted
// here from that law over a lattice of 360 by 360 of the two phases. Far off, where a pixel reaches over the net,
// the ceiling takes this mean.
const NET_MEAN = (() => {
  const n = 360, family = Array.from({ length: n }, (_, i) => (1 - Math.abs(Math.sin((i + 0.5) / n * Math.PI))) ** 3);
  let sum = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) sum += Math.min(family[i] + family[j], 1);
  return sum / (n * n);
})();
const SHELL_VERT = /* glsl */`
${GLSL_WAVE}
attribute vec4 aC; attribute vec3 aP; attribute vec4 aS;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec4 vC; varying vec3 vP; varying vec4 vS;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vS = aS;
  // a door's leaf (part 6) slides along its wall by the doors' wave at its own place
  if (aP.x > 5.5) w.xz += aP.yz * aC.w * doorOpen(aC.z);
  vW = w.xyz; vN = normal; vCol = color; vC = aC; vP = aP;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// The page's last pass lays a filmic curve over the picture, which presses all whites together. lit() undoes it for
// a shade named as the eye should read it: a white face of shade d reaches the screen at about d.
// (BROUGHT IN: the curve's five numbers are those of Stephen Hill's fit of the ACES curve as three.js carries it,
// MIT licence; solving it backwards for the shade is ours)
const GLSL_LIT = /* glsl */`
float lit(float d){
  float s = pow(clamp(d, 0., .9), 2.2), A = 1. - .983729 * s, B = .0245786 - .432951 * s, C = .000090537 + .238081 * s;
  return .663 * (-B + sqrt(max(B * B + 4. * A * C, 0.))) / (2. * A);
}
vec3 lit3(vec3 d){ return vec3(lit(d.r), lit(d.g), lit(d.b)); }
// (the same curve forwards, the same five numbers: the shade at which the eye reads a light x)
float shadeOf(float x){
  float y = max(x, 0.) / .663;
  return pow(clamp((y * (y + .0245786) - .000090537) / (y * (.983729 * y + .432951) + .238081), 0., 1.), 1. / 2.2);
}
`;
// THINGS IN A ROOM THAT IS DRAWN BY THE EYE'S OWN RAY (round eleven b): SOLID BODIES, each met by the ray before the
// room's own faces: boxes and round crowns, a few to a room. No board on a wall, no rows of marks. A room's kind:
// 0: a desk with its lamp lit warm, and a clipped tree in a tub; 1: a low cabinet with plain doors along the back
// wall, and a standing lamp with a warm shade; 2: a doorway in the back wall with a lit room beyond it, and a
// clipped tree in a tub. The frame: x across the room from its middle, y over its floor, z into it from its front.
const GLSL_ROOMS = /* glsl */`
// (the ray o + t d against the box from a to b: x the metres to it, 1e9 where it is missed; y the face it meets: 1
// its top, 0 a face that looks at the room's front, -1 a flank)
vec2 boxAt(vec3 o, vec3 d, vec3 a, vec3 b){
  vec3 dd = vec3(abs(d.x) < 1e-4 ? 1e-4 : d.x, abs(d.y) < 1e-4 ? 1e-4 : d.y, abs(d.z) < 1e-4 ? 1e-4 : d.z);
  vec3 t0 = (a - o) / dd, t1 = (b - o) / dd, tn = min(t0, t1), tf = max(t0, t1);
  float n = max(max(tn.x, tn.y), tn.z), f = min(min(tf.x, tf.y), tf.z);
  if (f <= max(n, 0.)) return vec2(1e9, 0.);
  return vec2(n, n == tn.y ? 1. : n == tn.z ? 0. : -1.);
}
// (against a ball of radius r about c: x the metres to it, y how far its skin looks up where the ray meets it)
vec2 ballAt(vec3 o, vec3 d, vec3 c, float r){
  vec3 oc = o - c;
  float b = dot(oc, d), h = b * b - dot(oc, oc) + r * r;
  if (h <= 0.) return vec2(1e9, 0.);
  float t = -b - sqrt(h);
  if (t <= 0.) return vec2(1e9, 0.);
  return vec2(t, (oc.y + d.y * t) / r);
}
// (a box's tone by its face: the top lightest, the front plain, a flank in shade)
float faceTone(float f){ return f > .5 ? 1. : f > -.5 ? .76 : .6; }
// the place of the room's own light: the desk's lamp, the standing lamp, the doorway
vec3 roomLight(float hw, float dp, float kind){
  return kind < .5 ? vec3(-.52 * hw, 2., dp - 1.9) : kind < 1.5 ? vec3(.5 * hw, 2.8, dp - 1.8) : vec3(-.52 * hw, 1.8, dp - .3);
}
// (a clipped tree in a tub at (x, z): a pale tub, a crown of two rounds, deeper green below and in its waist)
vec4 treeAt(vec3 o, vec3 d, float x, float z, float tb, vec4 got){
  vec2 h = boxAt(o, d, vec3(x - .42, 0., z - .42), vec3(x + .42, .8, z + .42));
  if (h.x < got.w) got = vec4(vec3(.9, .89, .85) * faceTone(h.y), h.x);
  h = ballAt(o, d, vec3(x, 1.72, z), .8);
  if (h.x < got.w) got = vec4(mix(vec3(.16, .42, .26), vec3(.42, .72, .46), .5 + .5 * h.y), h.x);
  h = ballAt(o, d, vec3(x, 2.72, z), .55);
  if (h.x < got.w) got = vec4(mix(vec3(.18, .46, .28), vec3(.45, .75, .5), .5 + .5 * h.y), h.x);
  return got;
}
// o, d: the eye's ray in the room's frame; hw, dp: the room's half width and its depth; tm: the metres to the room's
// own face on this ray; c2: the cabinet's colour; cw: the colour of the room beyond a doorway. Gives the colour of
// the thing the ray meets and, in w, the metres to it (tm where it meets none); glow: the light that thing gives.
vec4 roomThings(vec3 o, vec3 d, float hw, float dp, float tm, float kind, vec3 c2, vec3 cw, out vec3 glow){
  vec4 got = vec4(0., 0., 0., tm);
  float xl = -.52 * hw, xr = .5 * hw, hl = min(1.05, hw + xl - .1);
  glow = vec3(0.);
  vec2 h;
  if (kind < .5) {
    h = boxAt(o, d, vec3(xl - hl, 0., dp - 2.5), vec3(xl + hl, 1.25, dp - 1.3));
    if (h.x < got.w) got = vec4(vec3(.88, .84, .75) * faceTone(h.y), h.x);
    h = boxAt(o, d, vec3(xl - .3, 1.7, dp - 2.2), vec3(xl + .3, 2.25, dp - 1.6));
    if (h.x < got.w) { got = vec4(1., .9, .7, h.x); glow = vec3(1., .8, .46) * 1.1; }
    vec4 tr = treeAt(o, d, xr, dp - 1.9, tm, got);
    if (tr.w < got.w) { got = tr; glow = vec3(0.); }
  } else if (kind < 1.5) {
    float hc = min(1.3, hw + xl - .1);
    h = boxAt(o, d, vec3(xl - hc, 0., dp - .8), vec3(xl + hc, 1.4, dp));
    if (h.x < got.w) got = vec4(h.y > .5 ? vec3(.88, .84, .75) : c2 * (h.y > -.5 ? .86 : .62), h.x);
    h = boxAt(o, d, vec3(xr - .12, 0., dp - 1.92), vec3(xr + .12, 2.5, dp - 1.68));
    if (h.x < got.w) got = vec4(vec3(.74, .75, .78) * faceTone(h.y), h.x);
    h = boxAt(o, d, vec3(xr - .4, 2.45, dp - 2.2), vec3(xr + .4, 3.15, dp - 1.4));
    if (h.x < got.w) { got = vec4(1., .9, .7, h.x); glow = vec3(1., .8, .46) * 1.1; }
  } else {
    vec4 tr = treeAt(o, d, xr, dp - 1.9, tm, got);
    if (tr.w < got.w) got = tr;
    // (the doorway: where the ray goes through it, it meets the jamb, the floor beyond or the lit wall beyond)
    float tw = (dp - o.z) / d.z;
    vec2 pw = o.xy + d.xy * tw;
    if (got.w >= tm && tw <= tm + .01 && abs(pw.x - xl) < .7 && pw.y < 3.1) {
      vec2 pj = o.xy + d.xy * (tw + .3 / d.z), pb = o.xy + d.xy * (tw + 3. / d.z);
      vec3 cb = abs(pj.x - xl) > .7 || pj.y > 3.1 ? vec3(.8, .8, .82) * (pj.y > 3.1 ? .6 : .7) : pb.y < 0. ? cw * .5 : cw * (.8 + .12 * pb.y / 3.);
      got = vec4(cb, tm - .01); glow = cw * .28;
    }
  }
  return got;
}
`;
// THE WELL'S AIR: bright and clean. Downward everything sinks into A PALE BLUE-WHITE HAZE, so that no bottom is
// seen: from EIGHT STOREYS (40 m) under the floor the haze grows with the depth and is whole at 94 m; a thing that
// gives light (glow) keeps a little longer. Never dark, never murk.
const GLSL_WELLAIR = /* glsl */`
vec3 wellAir(vec3 c, vec3 w, float dist, float glow){
  float hz = pow(clamp((-40. - w.y) / 54., 0., 1.), 1.3) * (1. - .4 * glow);
  c = mix(c, lit3(vec3(.76, .84, .95)), hz);
  return mix(c, vec3(.83), 1. - exp(-dist / 1400.));
}
`;
const SHELL_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec4 vC; varying vec3 vP; varying vec4 vS;
uniform vec3 uFogIn, uLeaf; uniform float uFogKIn;
uniform vec4 uSec, uLat;
uniform vec3 uSpill[9];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_SLAB}${GLSL_CARPET}
// THE LIGHTS' ONE LAW IN A SHELL, by place and clock: where a front of the wave passes, a light swells from its rest
// to its whole. A FLOWN CORRIDOR'S CEILING (the loggia corridor's, the link's) CARRIES NO LIGHT FITTING: no bar,
// strip, panel, disc or lamp, flush or hung. ITS LIGHT IS ITS COVE'S: the glow line at the spring of each cove
// rests at three tenths of its light and is whole where a front passes that metre of the corridor; the white faces
// about it take their shares of it (see COVE), and its walls' lamps swell with it. HALL TWO'S CEILING CARRIES NO
// LIGHT EITHER: nothing in that hall's shell goes by the wave. A room's own ceiling carries slim bars in the weave.
#define REST ${COVE.rest.toFixed(2)}
// the bracket lamps of this shell's two walls, for the floor's mirror: (metres along, the wall's side times the metres
// of plain wall the lamp has to either side; 0: none), and the lamps' height
uniform vec2 uLampW[64]; uniform float uLampY;
// an open street's great doorway at its end (metres along to its plane, its half width, its height, the tower's half
// width there) and the ring that stands in it (its middle's height, its radius; 0: none)
uniform vec4 uGate; uniform vec2 uRing; uniform vec3 uSto[10];
// (the flown corridor's right-hand wall is glass from its metre 0 to this one; -1: no glass)
uniform float uGalQ;
// an open street: its own length (its doors stand from 6 m on, every 14 m, to 9 m before its end), a pool in its
// floor (from, to, half width; 0: none), and its lamp standards (round nine: the first one's metres along, their
// pitch, their metres either side of the axis; pitch 0: none)
uniform float uOpenL; uniform vec3 uPool, uStd;
// (the link: 1: its floor is the tide hall's carpet, laid level; the carpet's two blues and its pale lines' colour)
uniform float uCarpet; uniform vec3 uBlueA, uBlueB, uSeam;
// (a cove's light where the place's number in the wave is q)
float coveL(float q){ return REST + (1. - REST) * waveHump(q); }
// how far the opening that lights this face stands open: a door by the doors' wave at its own place, a bay always, a
// niche a little
float spillOpen(){ return vS.w < .5 ? 0. : vS.w < 1.5 ? doorOpen(vS.x + vS.y) : vS.w < 2.5 ? 1. : .4; }
// (the cove's light at the metre s along this corridor, for a face that lies at its metre vC.x: vC.z is the place's
// number in the wave there, vC.w its change with each metre along)
float coveAt(float s){ return coveL(vC.z + (s - vC.x) * vC.w); }
// (a white face's shade as the eye reads it, where it takes the share g of a cove's light k: see COVE)
float coveShade(float g, float k){ return shadeOf(lit(.9) * (${COVE.other.toFixed(4)} + g * k)); }
vec3 floorAlbedo(vec2 p, float fw){ return vCol; }
void main(){
  float part = vP.x, H = uSec.y;
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 v = toEye / max(dist, 1e-3), col;
  #ifdef HALL
  vec2 a = vW.xz, T = vec2(1., 0.), Nr = vec2(0., 1.);
  #else
  vec2 a = vC.xy, T = normalize(vP.yz + vec2(1e-5, 0.)), Nr = vec2(-T.y, T.x);
  #endif
  vec2 fwa = fwidth(a), dq = dFdx(vW.xz), dr = dFdy(vW.xz);
  float fa = max(length(fwa), .01), fw = sqrt(abs(dq.x * dr.y - dq.y * dr.x) + 1e-8);
  // (Kc: the cove's light at this metre of a flown corridor. A hall's shell and an open street's take none of it)
  #if defined(HALL) || defined(OPEN)
  float Kc = 0.;
  #else
  float Kc = coveL(vC.z);
  #endif
  // tone is the shade as the eye reads it (0.55 to 0.95 on white); add is light on top of it
  float tone = .8;
  vec3 alb = vCol, add = vec3(0.);
  if (part < .5) {
    // the floor: its own colour, a shade at the foot of the walls, the light of the rooms that open on it. A
    // corridor's polished stone takes its share of the cove's light and gives back what stands over it; the link's
    // carpet lies as the tide's own does where the swell is level, and gives back nothing
    float ao = 1.;
    #ifndef HALL
    ao = .66 + .34 * smoothstep(0., 1.5, uSec.x - abs(a.y));
    #endif
    alb = floorAlbedo(a, fw);
    #ifdef HALL
    tone = .62;
    #else
    tone = coveShade(${COVE.floor.toFixed(4)}, Kc) * ao;
    if (uCarpet > .5) {
      // THE LINK'S FLOOR IS CARPETED IN THE TIDE HALL'S BLUE (round eleven f), level and still, from the well's bridge
      // to the hall's mouth: THE TIDE'S OWN CARPET (the part's carpetWeave: its two blues in a faint check of 3 m, its
      // grid of pale lines, its pile's grain, all on the hall's own lattice in space, so that the lines run on into
      // the hall), in the shade the tide's carpet has where the swell is level (the part's TIDE_SHADE). The band at
      // the wall's foot is the carpet's border, in its own colour.
      vec3 cw = carpetWeave(vW.xz, dq, dr);
      alb = (alb + (uBlueB - uBlueA) * (cw.x - .5)) * cw.z;
      alb = mix(alb, uSeam * ${(TIDE_SHADE.seam[0] + TIDE_SHADE.seam[1] / 2).toFixed(4)} / ${TIDE_LEVEL.toFixed(5)}, cw.y * ${TIDE_SHADE.seam[2].toFixed(2)});
      tone = shadeOf(${TIDE_LEVEL.toFixed(5)}) * ao;
    }
    #endif
    // the room's light on the floor before its opening: a pool that comes and goes with the leaf
    float so = spillOpen();
    vec3 sc3 = uSpill[int(vS.z + .5)];
    float rs = vS.w > 1.5 && vS.w < 2.5 ? 6.5 : 3.6, gain = .1, sat = .7;
    #ifndef HALL
    #ifndef OPEN
    // (on the black floor each room throws its own colour as a soft patch before its opening)
    gain = .16; sat = .86;
    #endif
    #endif
    float dd = length(vW.xz - vS.xy) / rs, pool = so * (1. - dd * dd) * (1. - dd * dd) * step(dd, 1.);
    #ifndef HALL
    #ifndef OPEN
    {
      // (round seven: A SOFT-EDGED PATCH OF THE ROOM'S LIGHT lies on the black floor before its opening, strongest at
      // the threshold, gone 3.4 m out and a metre beyond the opening's own width: no edge anywhere in it)
      vec2 rel = vW.xz - vS.xy;
      float alw = abs(dot(rel, T)), acr = abs(dot(rel, Nr)), hwd = vS.w > 1.5 && vS.w < 2.5 ? 6. : 2.2;
      pool = so * (1. - smoothstep(hwd - 1.3, hwd + .95, alw)) * (1. - smoothstep(.2, 4.4, acr));
      pool *= pool * (3. - 2. * pool) * .5 + .5;
    }
    #endif
    #endif
    // (a yellow, lime or warm white light lies on the floor as a pale cool sheen: no dim yellow or warm white lies on
    // a dark floor, where it would read brown; the rose, cyan, violet and coral rooms keep their own colour there)
    float yel = clamp((min(sc3.r, sc3.g) - sc3.b) * 3.3, 0., 1.);
    sc3 = mix(sc3, vec3(dot(sc3, vec3(.3, .55, .15))) * vec3(.9, .97, 1.12), yel);
    alb = mix(alb, sc3, sat * pool); tone += gain * pool;
    vec3 r = reflect(-v, vec3(0., 1., 0.));
    #ifndef HALL
    #ifndef OPEN
    // A CRISP BLACK MIRROR (round six): polished black stone. What gives light over it stands in it SHARP, each edge
    // as fine as the pixel and no wider: the glow line at each cove's spring (faint: COVE.mirror), every bracket
    // lamp's shade with its scallop on the wall, each door's coloured light; each by its own light at its own metre
    // of the corridor. The plain white of ceiling and walls comes back only as one even faint sheen: no blur, no
    // smear, no broad grey or white streak. (The link's carpet gives back nothing.)
    if (uCarpet < .5) {
      float R = (.07 + .62 * pow(clamp(1. - v.y, 0., 1.), 2.5)) * uSec.w;
      // the eye's ray, turned at the floor, meets a wall or, over the walls' heads, the ceiling: sdw the wall's side,
      // tw the metres to it, hy the height there, sw the metres along
      float rl = dot(r.xz, Nr), sdw = rl >= 0. ? 1. : -1., tw = (uSec.x * sdw - a.y) / (abs(rl) > 1e-4 ? rl : 1e-4 * sdw), hy = max(r.y, .06) * tw, sw = a.x + dot(r.xz, T) * tw;
      float onWall = step(hy, H - .1), es = max(.75 * fwidth(sw), .012), eh = max(.75 * fwidth(hy), .012);
      // (round nine: where the ray would meet THE GLASS it goes on out into the great hall: the dark slab and its
      // weave of light stand in the floor, sharp; a low ray meets the court's far range first: a dim glow of its lit bays)
      float glz = onWall * step(0., sdw) * step(0., sw) * step(sw, uGalQ);
      vec2 pS = vW.xz + r.xz * (96. / max(r.y, .06));
      vec2 slG = slabLights(pS, dFdx(pS), dFdy(pS));
      vec3 outM = mix(SLAB_NEAR * 1.6 + SLAB_LIGHT * slG.x + SLAB_BLUE * slG.y, vec3(.07, .09, .2), step(max(r.y, .06) * (tw + 24. / max(abs(rl), 1e-3)), 5.));
      onWall *= 1. - glz;
      float gl = onWall * (1. - smoothstep(.175 - eh, .175 + eh, abs(hy - (H - 1.825))));
      vec3 lampM = vec3(0.);
      if (onWall > .5) for (int i = 0; i < 64; i++) {
        vec2 L = uLampW[i];
        float dx = sw - L.x, dy = hy - uLampY, fr = abs(L.y);
        if (L.y * sdw <= 0. || abs(dx) > 3.2) continue;
        // (round seven: THE FLOOR STAYS BLACK: a lamp's scallop comes back small and pale close round its shade, never
        // as a broad warm band, which on black stone would read as a brown floor)
        float wv = .35 + .4 * abs(dy), g = exp(-dx * dx / (wv * wv)) * exp(-abs(dy) / (dy > 0. ? .6 : .9)) * (1. - smoothstep(fr - .6, fr, abs(dx)));
        float sh = (1. - smoothstep(.25 - es, .25 + es, abs(dx))) * (1. - smoothstep(.3 - eh, .3 + eh, abs(dy)));
        // (the lamp swells with the cove at its own metre)
        lampM += (vec3(.58, .52, .42) * .45 * g * (1. - sh) + vec3(1., .82, .56) * 2.4 * sh) * (${COVE.lamp.toFixed(2)} + ${(1 - COVE.lamp).toFixed(2)} * waveHump(vC.z + (L.x - vC.x) * vC.w));
      }
      add = R * (mix(vec3(lit(.56)) * .2, outM, glz) + vec3(1., .95, .86) * (lit(.9) * ${(COVE.line * COVE.mirror).toFixed(4)}) * coveAt(sw) * gl + lampM);
    }
    #endif
    #ifdef OPEN
    // AN OPEN STREET IN THE GREAT HALL'S NIGHT (round nine): NO SKY AND NO KEY LIGHT: light comes only from things.
    // It is paved in stone, tiles of 1.5 m with their joints, deep blue between the lights, never black. A WARM POOL
    // lies under every lamp standard (uStd); before every open door its room's colour lies on the paving; at the
    // foot of each wall a slot of light is set in the floor, the lights' wave running along it toward the tower.
    // THE GREAT DOORWAY AT THE STREET'S END POURS ITS WARM WHITE LIGHT DOWN THE PAVING, a broad path 120 m long,
    // never blown out: the tiles keep their joints in it. A POOL (uPool) is still water in a pale kerb: A DARK
    // MIRROR in which the doorway, the tower's pile of lit storeys and the slab with its weave of light stand; the
    // stone itself has a faint polish in which the slab's lights lie.
    {
      float rT = dot(r.xz, T), rN = dot(r.xz, Nr), sdw = rN >= 0. ? 1. : -1.;
      float tw = (uSec.x * sdw - a.y) / (abs(rN) > 1e-4 ? rN : 1e-4 * sdw), hyw = r.y * tw;
      float tg = rT > 1e-4 ? (uGate.x - a.x) / rT : 1e9, hyg = r.y * tg, acg = a.y + rN * tg;
      float tS = 96. / max(r.y, .03);
      vec2 pS = vW.xz + r.xz * tS;
      vec2 slG = slabLights(pS, dFdx(pS), dFdy(pS));
      vec3 seen = mix(SLAB_NEAR, SLAB_FAR, smoothstep(200., 3200., tS)) + SLAB_LIGHT * slG.x + SLAB_BLUE * slG.y;
      float eg = max(.75 * fwidth(acg), .02), eh = max(.75 * fwidth(hyg), .02);
      if (tw < tg && hyw < H) {
        // (a wall: deep blue, warm where the doorway's light lies on it)
        float wash = exp(-max(uGate.x - a.x - rT * tw, 0.) / 36.);
        seen = lit3(mix(vec3(.2, .26, .5), vec3(.58, .51, .44), wash) * (.75 + .25 * hyw / H));
      } else if (tg < 1e8 && hyg < 96. && abs(acg) < uGate.w) {
        // (the tower's pile as it stands: its plates dark, each storey lit in its own colour; the doorway's room: its
        // wall of warm light)
        float inDoor = (1. - smoothstep(uGate.y - eg, uGate.y + eg, abs(acg))) * (1. - smoothstep(uGate.z - eh, uGate.z + eh, hyg));
        float hs = hyg - uGate.z - 2., fl = floor(max(hs, 0.) / 10.), plate = hs < 0. ? 0. : 1. - smoothstep(2. - eh, 2. + eh, hs - 10. * fl);
        vec3 sto = lit3(mix(uSto[int(clamp(hs < 0. ? 0. : fl + 1., 0., 9.))], vec3(1.), .2) * .84);
        seen = mix(mix(sto, lit3(vec3(.2, .26, .5)), max(plate, .3 * smoothstep(.5, 3., eh))), vec3(1.05, .9, .66), inDoor);
        // (round ten: the ring's own image is drawn here no more: in the stone's polish it lay on the paving before
        // the gate as a faint ring)
      }
      // the paving
      vec2 tj = (.5 - abs(fract(a / 1.5) - .5)) * 1.5;
      float jw = max(fa, .02), jt = max(clamp((.03 - tj.x) / jw + .5, 0., 1.), clamp((.03 - tj.y) / jw + .5, 0., 1.)) * clamp(.06 / jw, 0., 1.);
      vec3 stone = vec3(.62, .64, .72) * (1. - .34 * jt) * ao;
      float sk = uStd.x + uStd.y * floor((a.x - uStd.x) / max(uStd.y, 1.) + .5), d2s = (a.x - sk) * (a.x - sk) + (abs(a.y) - uStd.z) * (abs(a.y) - uStd.z);
      float gp = (exp(-d2s / 10.) + .3 * exp(-d2s / 70.)) * step(.5, uStd.y) * step(0., sk) * step(sk, uOpenL) * (.8 + .4 * waveHump(vC.z));
      float dg = max(uGate.x - a.x, 0.), path = (1. - smoothstep(.7 * uGate.y, 1.25 * uGate.y + .12 * dg, abs(a.y))) * exp(-dg / 55.) * (1. - smoothstep(90., 125., dg));
      vec3 pav = stone * min(vec3(.14, .19, .42) + vec3(1., .84, .56) * .75 * min(gp, 1.) + vec3(1., .9, .7) * .6 * path, vec3(1.2, 1.1, 1.));
      pav = mix(pav, sc3 * (1. - .15 * jt), .55 * pool);
      // (the pool: its kerb 0.5 m broad, its water a dark mirror with long low ripples)
      float dpl = max(max(uPool.x - a.x, a.x - uPool.y), abs(a.y) - uPool.z), ep = max(fa, .03);
      float water = (1. - smoothstep(-ep, ep, dpl)) * step(.5, uPool.z), kerb = (1. - smoothstep(.5 - ep, .5 + ep, dpl)) * step(.5, uPool.z) - water;
      float rip = (sin(a.x * 1.7 + a.y * .6 - uTime * .8) + sin(a.x * 1.1 - a.y * 1.4 + uTime * .6)) * (1. - smoothstep(.2, 1., fa));
      pav = mix(pav, vec3(.5, .54, .68) + vec3(1., .9, .7) * .4 * path, kerb);
      vec3 wat = mix(lit3(vec3(.055, .08, .21)), seen, .5 + .5 * pow(clamp(1. - v.y, 0., 1.), 3.)) * (1. + .06 * rip);
      float Rp = (.02 + .3 * pow(clamp(1. - v.y, 0., 1.), 3.)) * uSec.w;
      tone = 0.; alb = vec3(1.);
      add = mix(lit3(min(pav, vec3(.92))) + seen * Rp * .3, wat, water);
      float k7 = waveHump(vC.z), d7 = abs(abs(a.y) - (uSec.x - .52));
      add += (vec3(1., .93, .8) * (.5 + 1.9 * k7) * (1. - smoothstep(.2 - fa, .2 + fa, d7)) + vec3(1., .88, .66) * (.03 + .1 * k7) * exp(-d7 * d7 / 1.2)) * (1. - water);
    }
    #endif
    #endif
  } else if (part < 1.5) {
    // a wall, with a dark soft line where it meets the floor. A hall's takes an even wash from its white ceiling: a
    // fifth of a shade at the ceiling, falling down the wall
    float yy = max(H - vW.y, 0.), foot = .2 * (1. - smoothstep(0., 1.1, vW.y));
    tone = .57 + .07 * smoothstep(0., H, vW.y) + .2 / (1. + .03 * yy * yy) - foot;
    #ifndef HALL
    #ifndef OPEN
    // (A CORRIDOR'S WALL IS WHITE WITH SHADING: brightest at the cove's spring, a shade deeper toward the floor: its
    // share of the cove's light at the spring, half of that share ${COVE.wall[1].toFixed(0)} m under it; never blown out, so that each
    // bracket lamp's warm scallop stays plain on it)
    alb *= vec3(.975, .985, 1.01);
    float ys = max(H - ${P.COVE.toFixed(1)} - vW.y, 0.);
    tone = coveShade(${COVE.wall[0].toFixed(4)} / (1. + ys * ys / ${(COVE.wall[1] * COVE.wall[1]).toFixed(1)}), Kc) - foot;
    {
      // (round eight: THE PANELLING OF PALE ASH: panels 3 m wide and two high, a fine dark joint between them, each
      // panel a breath lighter or deeper than its neighbour)
      float ash = step(.06, vCol.r - vCol.b) * step(.5, vW.y);
      float jx = (.5 - abs(fract(a.x / 3.) - .5)) * 3., jy = abs(vW.y - 2.55), jw = max(fa, .004), jh = max(fwidth(vW.y), .004);
      float joint = max(clamp((.018 - jx) / jw + .5, 0., 1.) * clamp(.05 / jw, 0., 1.), clamp((.018 - jy) / jh + .5, 0., 1.) * clamp(.05 / jh, 0., 1.));
      float pn = fract(sin(floor(a.x / 3.) * 27.619 + step(2.55, vW.y) * 37.7) * 24634.6345 + cos(floor(a.x / 3.) * 41.233 + step(2.55, vW.y) * 13.171) * 7919.137);
      tone *= 1. - ash * (.16 * joint - .035 * (pn - .5));
    }
    #endif
    #endif
    // the wash of an open door's light from across the corridor
    float so = spillOpen();
    if (so > 0. && vS.w < 2.5) {
      vec2 rel = vW.xz - vS.xy;
      float acr = dot(rel, normalize(vN.xz + vec2(1e-5))), al2 = max(dot(rel, rel) - acr * acr, 0.) / (vS.w > 1.5 ? 36. : 4.4);
      float wash = so * (1. - al2) * (1. - al2) * step(al2, 1.) * (1. - smoothstep(.3, 5.2, vW.y)) * step(3., abs(acr));
      alb = mix(alb, uSpill[int(vS.z + .5)], .72 * wash); tone += .05 * wash;
    }
    #ifdef OPEN
    // under no ceiling (round nine) A STREET'S WALL STANDS IN THE GREAT HALL'S NIGHT: deep blue stone, paler toward
    // its top, a shade at its foot; THE GREAT DOORWAY'S WARM LIGHT lies on it for 80 m from the tower's foot; the
    // line of light over the door heads (uSec.z) washes it, its pulses running. No light of a sun, no shade of one.
    float hy = vW.y - uSec.z, hk = smoothstep(0., uSec.y, vW.y), wash = exp(-max(uGate.x - a.x, 0.) / 36.);
    vec3 wc = mix(vec3(.22, .28, .54), vec3(.62, .54, .45), .72 * wash) * mix(.8, 1., hk) * (1. - .22 * (1. - smoothstep(0., 1.1, vW.y)));
    wc += vec3(.3, .26, .16) * (.3 + .7 * waveHump(vC.z)) * exp(-abs(hy) / .9);
    tone = 0.; alb = vec3(1.); add = lit3(min(wc, vec3(.88)));
    #endif
  } else if (part < 2.5) {
    // the glow line at the cove's spring: THE COVE'S OWN LAMP, by the lights' one law at its metre of the corridor:
    // at a front ${COVE.line.toFixed(1)} whole whites, between fronts three tenths of that
    tone = 0.; add = vec3(1., .95, .86) * (lit(.9) * ${COVE.line.toFixed(2)}) * Kc;
    #ifdef OPEN
    add = vec3(1., .93, .8) * (.62 + .9 * waveHump(vC.z));
    #endif
  } else if (part < 3.5) {
    // the cove: lit from the glow line below, falling off toward the ceiling
    tone = coveShade(mix(${COVE.cove[0].toFixed(4)}, ${COVE.cove[1].toFixed(4)}, smoothstep(0., .85, clamp(-vN.y, 0., 1.))), Kc);
  } else if (part > 6.5) {
    // a thing that gives light (a lamp's shade, a ring lamp)
    tone = 0.; add = vCol * 2.2;
  } else if (part > 4.5) {
    // plain things (a room's faces, a column, a kerb) and a door's leaf: lit from above, walls paler toward the top
    float up = vN.y;
    tone = up > .5 ? .88 : up < -.5 ? .97 : (.74 + .2 * smoothstep(0., 6., vW.y)) * (.92 + .08 * dot(vN, vec3(.45, 0., .89)));
    if (part > 5.2 && part < 5.4) {
      // A ROOM'S FLOOR AND WALLS ARE NEVER ONE FLAT TONE (round four). vC: metres along the wall from the room's
      // middle, metres in from its front, its depth, its half width
      float din = clamp(vC.y / max(vC.z, .5), 0., 1.), ax = abs(vC.x) / max(vC.w, .5);
      // (round ten: A FURNISHED ROOM IS SHADED BY ITS OWN LAMP, which stands on its desk 1 m to one hand of its
      // middle, half way in, 2.8 m up: warm and bright near it, a shade deeper toward the corners)
      vec3 dlp = vec3(vC.x + 1., vW.y - 2.8, vC.y - (.5 * vC.z + .3));
      float lgR = step(vC.w, 3.) * step(3., vC.z), lg = exp(-dot(dlp, dlp) / 20.);
      // (a niche is shaded by the lamp on its own back wall, 4.6 m up)
      vec3 dln = vec3(vC.x, vW.y - 4.6, vC.y - vC.z);
      float lgN = step(vC.z, 3.) * exp(-dot(dln, dln) / 7.);
      if (up > .5) {
        // the carpet: tiles of 0.9 m laid as a check of two near tones, a darker border along the walls; the room's
        // light lies in a pool in its middle and the floor falls to shade toward the back and into the corners
        vec2 tl = vC.xy / .9, tw = fwidth(tl);
        float chk = mod(floor(tl.x) + floor(tl.y), 2.) - .5, fade = 1. - smoothstep(.2, .8, max(tw.x, tw.y));
        float edge = min(min(vC.w - abs(vC.x), vC.y + .4), vC.z - vC.y);
        tone = .86 * (1. + .11 * chk * fade) * (1. - .17 * (1. - smoothstep(.4, .55, edge))) * (1.05 - .3 * din * din - .1 * ax * ax);
        tone += .07 * exp(-(ax * ax * 2.5 + (din - .45) * (din - .45) * 7.));
        tone = mix(tone, tone * (.8 + .34 * lg), lgR); alb *= 1. + lgR * vec3(.2, .1, -.04) * lg;
      } else if (up > -.5) {
        // a wall: a skirting 0.28 m high, panel joints every 2.4 m down a side wall, shade toward the back; the back
        // wall is brightest in its middle
        float isBack = step(vC.z - vC.y, .01), jd = (.5 - abs(fract(vC.y / 2.4) - .5)) * 2.4, jw = max(fwidth(vC.y), .004);
        float joint = clamp((.022 - jd) / jw + .5, 0., 1.) * clamp(.07 / jw, 0., 1.) * (1. - isBack);
        tone *= (1. - .13 * joint) * (1. - .3 * (1. - smoothstep(.26, .3, vW.y))) * mix(1.04 - .24 * din, .93 + .1 * exp(-ax * ax * 3.), isBack);
        // (a furnished room's wall: a dado 1.15 m high in a deeper tone, a pale rail on it)
        float dado = lgR * (1. - isBack) * (1. - smoothstep(1.15, 1.15 + max(fwidth(vW.y), .004), vW.y)), rail = lgR * (1. - isBack) * (1. - smoothstep(.04, .04 + max(fwidth(vW.y), .004), abs(vW.y - 1.19)));
        tone = mix(tone, tone * (.76 + .4 * lg), lgR) * (1. - .14 * dado) + .08 * rail; alb *= 1. + lgR * vec3(.22, .12, -.04) * lg;
        tone *= 1. - step(vC.z, 3.) * (.24 - .42 * lgN); alb *= 1. + vec3(.2, .1, -.04) * lgN;
      } else {
        // its ceiling (round eight; round eleven c): SLIM BARS OF LIGHT IN THE WEAVE, one to a cell 4.5 m broad and 3 m
        // deep: each 2 m long and 0.56 m broad, across the room in one cell and from front to back in the next, the
        // same wave over them (a narrow room has one file of cells, down its middle; no bar's middle stands nearer a
        // wall than 1.3 m, so that none touches one). No round light.
        float ci = vC.w < 3.15 ? 0. : floor(vC.x / 4.5), cs = vC.w < 3.15 ? 0. : (ci + .5) * 4.5, cj = floor(vC.y / 3.), cd = (cj + .5) * 3., sw = max(length(fwidth(vC.xy)), .004);
        vec2 qr = vec2(vC.x - cs, vC.y - cd), qb = abs(mod(ci + cj, 2.) < .5 ? qr : qr.yx) - vec2(1., .28);
        float face = (1. - smoothstep(-sw, sw, max(qb.x, qb.y))) * step(1.3, cd) * step(cd, vC.z - 1.3) * step(1.3, vC.w - abs(cs)), kr = waveHump(vW.x + vW.z);
        tone = .9 * (1. - face); add = vec3(1., .98, .94) * (1.05 + 2.3 * kr * sqrt(max(kr, 0.))) * face;
      }
    }
  } else {
    // the ceiling
    #ifdef HALL
    // (HALL TWO'S CEILING CARRIES NO LIGHT (round eleven f): plain white; round the great opening a shade deeper: its
    // thickness is felt before the reveal is seen)
    tone = .66 * (1. - .14 * uLat.z * (1. - smoothstep(42., 48., length(a - vec2(-98., -292.)))));
    // (round eleven) THE SEA'S LIGHT ON THE CEILING: the swell throws the hall's light back up. The ceiling takes the
    // carpet's blue as a pale cast, and on it plays A NET OF WHITER LIGHT, as under a bridge over water: two families
    // of soft curved lines about 7 m apart that cross and drift (by place and clock), strongest in a band over every
    // crest of the long swell, which runs with the crest (the tide's own first train). Far off, where a pixel
    // reaches over the net, ITS OWN MEAN (${NET_MEAN.toFixed(4)}: NET_MEAN, counted from this law). A ceiling over a sea is never
    // plain white.
    {
      float t1 = ${TIDE_TRAINS[0].kx.toFixed(5)} * a.x + ${TIDE_TRAINS[0].kz.toFixed(5)} * a.y - ${TIDE_TRAINS[0].w.toFixed(5)} * uTime + ${TIDE_TRAINS[0].ph.toFixed(2)};
      float sea = smoothstep(-.2, 1., sin(t1));
      vec2 q = a / 2.2;
      float tt = uTime * .45;
      float c1 = sin(q.x + .6 * q.y + tt + 1.3 * sin(.9 * q.y - .35 * q.x + .7 * tt));
      float c2 = sin(1.1 * q.y - .55 * q.x - .8 * tt + 1.3 * sin(.8 * q.x + .3 * q.y + .5 * tt));
      float n1 = 1. - abs(c1), n2 = 1. - abs(c2);
      float net = min(n1 * n1 * n1 + n2 * n2 * n2, 1.);
      net = mix(net, ${NET_MEAN.toFixed(4)}, smoothstep(1.2, 4.5, fa)) * (.4 + .6 * sea);
      alb = mix(alb, vec3(.42, .62, 1.), .6 * (1. - net));
      tone *= 1. + .08 * net;
    }
    #else
    // (A FLOWN CORRIDOR'S CEILING IS PLAIN BETWEEN ITS COVES (round eleven f): no light fitting stands in it. It takes
    // its share of the cove's light: the cove's own at the cove's head, a quarter less of that ${COVE.ceil[2].toFixed(0)} m in from it;
    // where the ceiling runs out to the glass (part 4.2) A SOFT COVE OF LIGHT lies along the glass's head, in the
    // cove's own share at its spring and by its law)
    float din = max(uSec.x - ${P.COVE.toFixed(1)} - abs(a.y), 0.), cove = part > 4.1 ? exp(-max(uSec.x - a.y, 0.) / .55) : 0.;
    tone = coveShade(mix(${COVE.ceil[0].toFixed(4)} * (1. - ${COVE.ceil[1].toFixed(4)} * smoothstep(0., ${COVE.ceil[2].toFixed(1)}, din)), ${COVE.cove[0].toFixed(4)}, .85 * cove), Kc);
    #endif
  }
  col = alb * lit(tone) + add;
  #ifdef OPEN
  // (an open street stands in the great hall's air)
  gl_FragColor = vec4(nightAir(col, cameraPosition, -toEye), 1.);
  #else
  gl_FragColor = vec4(mix(col, uFogIn, 1. - exp(-dist * uFogKIn)), 1.);
  #endif
  // EVERY CEILING IS ONE-SIDED: an eye that stands above a ceiling (or any face that looks down) does not see it
  if ((vN.y < -.5 || (part > 2.5 && part < 4.5)) && cameraPosition.y > vW.y + .2) discard;
}`;
// sec: [half width, height, an open street's glow line's height (a corridor: 0), sheen]; lat (halls only): [0, 0,
// the flag of the great round opening, 0]; sky: the
// part's deal of the slab's provinces and of its bars that are out (every material that shows the slab takes it)
function makeShellMaterial(timeU, sec, lat, fogK, open, leaf, sky) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uLampW: { value: Array.from({ length: 64 }, () => new THREE.Vector2(0, 0)) }, uLampY: { value: 3.9 },
      uGate: { value: new THREE.Vector4(1e6, 0, 0, 0) }, uRing: { value: new THREE.Vector2(0, 0) }, uGalQ: { value: -1 }, uOpenL: { value: 0 }, uCarpet: { value: 0 }, uBlueA: { value: new THREE.Vector3() }, uBlueB: { value: new THREE.Vector3() }, uSeam: { value: new THREE.Vector3() }, uPool: { value: new THREE.Vector3(0, 0, 0) }, uStd: { value: new THREE.Vector3(0, 0, 0) },
      uSto: { value: Array.from({ length: 10 }, () => new THREE.Vector3(0.16, 0.33, 0.78)) },
      uTime: timeU, uSky: sky, uSec: { value: new THREE.Vector4(...sec) }, uLat: { value: new THREE.Vector4(...(lat || [0, 0, 0, 0])) },
      uFogIn: { value: new THREE.Vector3(...lin('#f4f3ee', 0.92)) }, uFogKIn: { value: fogK },
      uSpill: { value: SPILL.map((c) => new THREE.Vector3(...c)) }, uLeaf: { value: new THREE.Vector3(...(leaf || WHITE)) },
    },
    defines: lat ? { HALL: 1 } : open ? { OPEN: 1 } : {}, vertexColors: true, side: THREE.DoubleSide, vertexShader: SHELL_VERT, fragmentShader: SHELL_FRAG,
  });
}

// ---------------------------------------------------------------- THE LOBBY (round eleven; round eleven b)
// THE FLIGHT BEGINS IN A WHITE HALL (the part's P.LOBBY): 48 m wide, 90 m long, 18 m high. ITS FLOOR IS PALE POLISHED
// STONE: broad inlaid bands of a deeper stone across it, from the west wall to the glass, one on every line of the
// ceiling's 6 m lattice; a soft lighter bar under each ceiling light; the court's blue lying on it from the glass
// (cool near the glass, warm toward the walls); and in its polish the ceiling's bars of light and, through the glass, the
// slab's weave of lights and the hero's lit storeys. Its walls are plain white with fine joints; its flat ceiling
// carries the weave: one slim bar of light 4 m long and 1 m broad to a cell of 6 m, under the lights' one law. ITS EAST SIDE IS GLASS, 55 m
// long and the hall's whole height, in slim pale posts every 6.1 m with one slim transom at the corridor's ceiling
// height (nine bays: as far north as the line keeps 5 m from it: the part's rule); north of the glass the side
// stands open under a lintel: the loggia's first stretch. ITS NORTH WALL CARRIES A RANK OF
// TALL NICHES at one even spacing along its whole length (LOBBY_RANK), each lit softly from a slot of light in its
// head and holding one clipped tree in a tub (the world sets the trees); at its east end the corridor's mouth.
// Kinds (aK): 0 floor, 1 wall, 2 ceiling, 3 the glass's pale frame, 4 the face of stone under the floor in the
// entry's own plane (seen only through a ring wider than the floor is near: it shows stone, not the void), 5 a
// niche's own faces.
// THE RANK: from the hall's west wall to the corridor's west jamb the wall is divided into equal bays, as many as
// the ceiling's 6 m lattice gives that length to the nearest whole number (seven, of 5.86 m); a niche stands in
// the middle of each, three fifths of its bay wide (3.5 m) and three fifths of the hall high (10.8 m), 2.2 m
// deep (the corridor's rooms keep clear of the niches' backs by the corridor's own rule in space: see
// clearGround). The wall between them stays white.
const LOBBY_RANK = (() => {
  const L = P.LOBBY, x1 = L.x1 - P.CW, n = Math.round((x1 - L.x0) / 6), pitch = (x1 - L.x0) / n;
  return { n, pitch, w: 0.6 * pitch, h: 0.6 * L.h, deep: 2.2, at: (k) => L.x0 + (k + 0.5) * pitch };
})();
// DOWN THE LOBBY, WELL OFF THE LINE (round eleven b): LONG LOW PLANTERS PARALLEL TO THE NORTH WALL, each with benches
// along both its sides. They stand on the floor's bands (the lattice's lines), four bays (24 m) apart, the first
// three bays (18 m) off the north wall, so that the rank of niches stands free behind a clear floor. Each begins
// on the lattice's first line off the west wall and runs east, a whole number of bays, as far as it and its
// benches keep LOBBY_OFF metres from the flown line's plan (well off: the lobby's rule is 5 m); a row whose
// planter would come out shorter than two bays is not built (as the plan stands: two rows, 24 m and 12 m long;
// nearer the south wall the line leaves no room). A planter: a trough of pale stone 1.5 m broad and 1.25 m high
// with a clipped hedge in it; 0.45 m off each side a bench 1.2 m deep, its seat 1.1 m up, one length of 5 m to a
// bay.
const LOBBY_OFF = 8, PLANTER = { hw: 0.75, gap: 0.45, bench: 1.2, first: 3, every: 4, least: 2 };
PLANTER.hb = PLANTER.hw + PLANTER.gap + PLANTER.bench;
const LOBBY_PLANTERS = (() => {
  const L = P.LOBBY, hb = PLANTER.hb, out = [], line = [];
  for (let h = 0; h <= RUNS.mouth; h += 0.5) line.push(lineAt(h));
  // (the least way in plan from the planter's whole ground, benches and all, to the line)
  const off = (x0, x1, z) => Math.min(...line.map((q) => Math.hypot(Math.max(x0 - q[0], 0, q[0] - x1), Math.max(z - hb - q[1], 0, q[1] - z - hb))));
  for (let k = PLANTER.first; L.z0 + 6 * k + hb < L.z1; k += PLANTER.every) {
    const z = L.z0 + 6 * k, x0 = L.x0 + 6;
    let n = Math.floor((L.x1 - x0) / 6);
    while (n >= PLANTER.least && off(x0, x0 + 6 * n, z) < LOBBY_OFF) n--;
    if (n >= PLANTER.least) out.push({ x0, x1: x0 + 6 * n, z });
  }
  return out;
})();
function lobbyGeo() {
  const L = P.LOBBY, pos = [], nor = [], kd = [], H = L.h, CH = P.CH;
  const quad = (v, n, k) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); kd.push(k); } };
  const wallX = (x, z0, z1, y0, y1, nx, k = 1) => quad([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [nx, 0, 0], k);
  const wallZ = (z, x0, x1, y0, y1, nz, k = 1) => quad([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, nz], k);
  const flat = (y, x0, x1, z0, z1, ny, k) => quad([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], [0, ny, 0], k);
  // (every wall is cut level at the corridor's ceiling height and at the niches' head, and the floor and the ceiling
  // into strips at the north wall's own uprights, so that every edge is shared whole by its neighbours: a face
  // that ends part way along its neighbour's edge leaves pinholes there)
  // THE NORTH WALL: its rank of tall niches (kind 5: each one's back, its two flanks, its head and its floor), the
  // white wall between and over them, and the corridor's mouth at its east end
  const K = LOBBY_RANK, zb = L.z0 - K.deep, rows = [0, CH, K.h, H], xs = [L.x0];
  for (let k = 0; k < K.n; k++) xs.push(K.at(k) - K.w / 2, K.at(k) + K.w / 2);
  xs.push(L.x1 - P.CW, L.x1);
  for (let i = 0; i + 1 < xs.length; i++) { flat(0, xs[i], xs[i + 1], L.z0, L.z1, 1, 0); flat(H, xs[i], xs[i + 1], L.z0, L.z1, -1, 2); }
  for (let r = 0; r < 3; r++) {
    const y0 = rows[r], y1 = rows[r + 1];
    wallX(L.x0, L.z0, L.z1, y0, y1, 1); wallX(L.x1, L.glassS, L.z1, y0, y1, -1);
    if (r > 0) wallX(L.x1, L.z0, L.glassN, y0, y1, -1);
    for (let i = 0; i + 1 < xs.length; i++) {
      wallZ(L.z1, xs[i], xs[i + 1], y0, y1, -1);
      // (a pier's column stands whole; a niche's from its head up; the mouth's from the corridor's ceiling up)
      const niche = i % 2 === 1 && i < 2 * K.n, mouth = i === xs.length - 2;
      if (niche ? r === 2 : mouth ? r > 0 : true) wallZ(L.z0, xs[i], xs[i + 1], y0, y1, 1);
      if (niche && r < 2) { wallZ(zb, xs[i], xs[i + 1], y0, y1, 1, 5); wallX(xs[i], zb, L.z0, y0, y1, 1, 5); wallX(xs[i + 1], zb, L.z0, y0, y1, -1, 5); }
    }
  }
  for (let k = 0; k < K.n; k++) { flat(K.h, xs[2 * k + 1], xs[2 * k + 2], zb, L.z0, -1, 5); flat(0, xs[2 * k + 1], xs[2 * k + 2], zb, L.z0, 1, 5); }
  // the glass's frame
  const bar = (x0, x1, y0, y1, z0, z1) => {
    wallX(x0, z0, z1, y0, y1, -1, 3); wallX(x1, z0, z1, y0, y1, 1, 3);
    if (z1 - z0 < 1) { wallZ(z0, x0, x1, y0, y1, -1, 3); wallZ(z1, x0, x1, y0, y1, 1, 3); } else { flat(y1, x0, x1, z0, z1, 1, 3); flat(y0, x0, x1, z0, z1, -1, 3); }
  };
  for (let i = 0; i <= Math.round((L.glassS - L.glassN) / L.bay); i++) { const z = L.glassS - i * L.bay; bar(L.x1 - 0.03, L.x1 + 0.03, 0, H, z - 0.03, z + 0.03); }
  bar(L.x1 - 0.04, L.x1 + 0.04, 0, 0.1, L.glassN, L.glassS); bar(L.x1 - 0.04, L.x1 + 0.04, H - 0.1, H, L.glassN, L.glassS); bar(L.x1 - 0.03, L.x1 + 0.03, CH - 0.03, CH + 0.03, L.glassN, L.glassS);
  // under the floor in the entry's own plane: square to the line's heading at its first metre
  const q0 = lineAt(0), ax = -q0[3], az = q0[2];
  quad([[q0[0] - 18 * ax, -16, q0[1] - 18 * az], [q0[0] + 18 * ax, -16, q0[1] + 18 * az], [q0[0] + 18 * ax, -0.03, q0[1] + 18 * az], [q0[0] - 18 * ax, -0.03, q0[1] - 18 * az]], [-az, 0, ax], 4);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 1));
  return g;
}
const LOBBY_VERT = /* glsl */`
attribute float aK;
varying vec3 vW; varying vec3 vN; varying float vK;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vK = aK; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LOBBY_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vK;
uniform vec3 uFogIn;
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_SLAB}
const vec4 LB = vec4(${P.LOBBY.x0.toFixed(1)}, ${P.LOBBY.z0.toFixed(1)}, ${P.LOBBY.x1.toFixed(1)}, ${P.LOBBY.z1.toFixed(1)});
const float LH = ${P.LOBBY.h.toFixed(1)}, GN = ${P.LOBBY.glassN.toFixed(1)}, GS = ${P.LOBBY.glassS.toFixed(1)};
const vec2 HERO = vec2(${P.CORE.x.toFixed(1)}, ${P.CORE.z.toFixed(1)});
// (the north wall's rank: its pitch, a niche's height and depth; the floor's bands: their breadth)
const float NP = ${LOBBY_RANK.pitch.toFixed(4)}, NH = ${LOBBY_RANK.h.toFixed(2)}, ND = ${LOBBY_RANK.deep.toFixed(2)}, BW = 1.5;
const vec3 STONE = vec3(.9, .885, .86);
// THE CEILING'S LIGHTS (round eleven c): SLIM BARS IN THE SLAB'S OWN WEAVE, on the lattice of 6 m: in each cell one
// bar 1 m wide and 4 m long, its ends soft; along x in one cell, along z in the next, turn about (the cell's two
// numbers, summed: even or odd). The bar of the cell (ci) at p. x: how much of a pixel that reaches e (along x,
// along z) its face fills; far off the bars' own mean, a ninth. y: its light by the wave. z: the metres to its
// recess's edge, under nought inside it. w: the metres to its middle line.
const float BC = 6., BSOFT = ${(6 * WEAVE.soft).toFixed(4)};
const vec2 BHB = vec2(${(6 * WEAVE.long / 2).toFixed(4)}, ${(6 * WEAVE.wide / 2).toFixed(4)});
vec4 barCell(vec2 p, vec2 ci, vec2 e){
  vec2 c = (ci + .5) * BC + LB.xy, r = p - c;
  bool ax = mod(ci.x + ci.y, 2.) < .5;
  vec2 q = ax ? r : r.yx, f = ax ? e : e.yx, d = abs(q) - BHB - vec2(.5 * BSOFT, 0.);
  float face = weaveBar(q, BHB, vec2(sqrt(f.x * f.x + BSOFT * BSOFT), f.y), smoothstep(BSOFT, 2. * BSOFT, f.x));
  face = mix(face, ${(WEAVE.long * WEAVE.wide).toFixed(5)}, smoothstep(.35 * BC, .9 * BC, max(e.x, e.y)));
  return vec4(face, waveHump(c.x + c.y), length(max(d, 0.)) + min(max(d.x, d.y), 0.), length(vec2(max(abs(q.x) - BHB.x, 0.), q.y)));
}
vec4 barNear(vec2 p, vec2 e){ return barCell(p, floor((p - LB.xy) / BC), e); }
// (the metres of band between 0 and t: bands BW broad, one in every 6 m, each beginning on a multiple of 6)
float bandI(float t){ float k = floor(t / 6.); return k * BW + min(t - 6. * k, BW); }
// (the metres from p to the ground a planter and its benches stand on: nought inside it)
float groundOut(vec2 p, vec4 b){ return length(max(max(b.xy - p, p - b.zw), 0.)); }
void main(){
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye), fw = max(length(fwidth(vW)), .01);
  vec3 v = toEye / max(dist, 1e-3), col;
  if (vK < .5) {
    // THE STONE'S POLISH: the eye's ray, turned at the floor, meets the ceiling and its lights, a wall, or goes out
    // through the glass: the slab's grid of lights, the hero's lit storeys, low down the court's lit range
    vec3 r = reflect(-v, vec3(0., 1., 0.));
    r.y = max(r.y, .03);
    float tc = LH / r.y, tg = r.x > 1e-4 ? (LB.z - vW.x) / r.x : 1e9, yg = r.y * tg, zg = vW.z + r.z * tg;
    vec2 pc = vW.xz + r.xz * tc;
    vec3 seen;
    if (tg < tc && zg < GS && zg > GN) {
      float tS = 96. / r.y;
      vec2 pS = vW.xz + r.xz * tS, sl = slabLights(pS, dFdx(pS), dFdy(pS));
      seen = SLAB_NEAR * 1.6 + SLAB_LIGHT * sl.x + SLAB_BLUE * sl.y;
      // (the hero's pile as it stands: three tiers, its west face plumb: in the stone it is a grid of warm lit
      // windows between dark plates and posts, as the pile itself is)
      vec2 rd = vec2(abs(r.x) < 1e-4 ? 1e-4 : r.x, abs(r.z) < 1e-4 ? 1e-4 : r.z);
      // (the first of the three tiers that the ray meets: the height and the place along its face where it meets
      // it; what is drawn there is worked out after the loop, which holds no early way out and no pixel's reach)
      float hyH = -1., alH = 0.;
      for (int k = 0; k < 3; k++) {
        float hh = k == 0 ? 50. : k == 1 ? 38. : 27., ya = k == 0 ? 0. : k == 1 ? 40. : 70., yb = k == 0 ? 40. : k == 1 ? 70. : 96.;
        vec2 o = vec2(HERO.x - 50. + hh, HERO.y) - vW.xz, ta = (o - hh) / rd, tb = (o + hh) / rd, t0 = min(ta, tb), t1 = max(ta, tb);
        float tn = max(t0.x, t0.y), hy = r.y * tn;
        if (hyH < 0. && tn > 0. && tn < min(t1.x, t1.y) && hy >= ya && hy < yb) { hyH = hy; alH = t0.x > t0.y ? vW.z + r.z * tn : vW.x + r.x * tn; }
      }
      float fh = max(fwidth(hyH), .05) + .5, fa = max(fwidth(alH), .05) + .35;
      if (hyH >= 0.) {
        float hs = hyH - 8., fl = floor(max(hs, 0.) / 10.), st = hs - 10. * fl;
        float plate = hs < 0. ? 0. : max(1. - smoothstep(2. - fh, 2. + fh, st), smoothstep(10. - fh, 10., st));
        // (the bays' posts, 4 m apart along the face the ray meets: with the plates they make a grid of lit windows)
        float post = (1. - smoothstep(.3, .3 + fa, abs(fract(alH / 4.) - .5) * 4.)) * clamp(1.2 / fa, 0., 1.);
        seen = mix(seen, mix(lit3(vec3(.95, .88, .74) * .82), lit3(vec3(.2, .26, .5)), max(.8 * plate, .7 * post)), .6);
      }
      seen = mix(seen, vec3(.1, .12, .26), step(r.y * (tg + 24. / max(abs(r.x), 1e-3)), 5.));
      // (the glass's posts stand in the mirror as fine pale lines)
      float pz = abs(fract((GS - zg) / ${P.LOBBY.bay.toFixed(1)} + .5) - .5) * ${P.LOBBY.bay.toFixed(1)}, pw = max(.75 * fwidth(zg), .02);
      seen = mix(seen, vec3(lit(.7)), .6 * (1. - smoothstep(.03, .03 + pw, pz)) * clamp(.12 / pw, 0., 1.));
    } else if (pc.x > LB.x && pc.x < LB.z && pc.y > LB.y && pc.y < LB.w) {
      vec4 dn = barNear(pc, max(1.5 * fwidth(pc), vec2(.02)));
      seen = mix(vec3(lit(.69)), vec3(1., .98, .94) * (.8 + 2.1 * dn.y * sqrt(dn.y)), dn.x);
    } else {
      // (a white wall: by the height at which the ray meets it)
      float tx = r.x > 0. ? (LB.z - vW.x) / max(r.x, 1e-4) : (LB.x - vW.x) / min(r.x, -1e-4), tz = r.z > 0. ? (LB.w - vW.z) / max(r.z, 1e-4) : (LB.y - vW.z) / min(r.z, -1e-4);
      // (round eleven: the wall stands in the stone as it is: its skirting's shade at its foot, the line of warm light
      // at the corridor's ceiling height and the wash over and under that line)
      float yw = r.y * min(tx, tz), dyw = yw - ${P.CH.toFixed(1)}, fwy = max(fwidth(yw), .02);
      float lw = clamp((.08 - abs(dyw)) / fwy + .5, 0., 1.) * clamp(.16 / fwy, .45, 1.);
      float tw = .63 + .19 * smoothstep(0., LH, yw) + .07 * exp(-abs(dyw) / (dyw > 0. ? 1.6 : .8)) - .2 * (1. - smoothstep(0., 1.1, yw));
      seen = vec3(lit(min(tw, .9))) * (1. - lw) + vec3(1., .9, .7) * 1.1 * lw;
    }
    // THE STONE ITSELF (round eleven b): PALE AND POLISHED, in slabs of 3 m with a fine joint. BROAD INLAID BANDS of a
    // deeper stone cross the hall from the west wall to the glass, one on every line of the ceiling's lattice
    // (BW m broad in every 6 m: their own mean is a quarter of the floor; the band is counted over the pixel's
    // own reach, so far off it settles to that mean). A SOFT LIGHTER BAR lies under each bar of the ceiling's
    // weave (round eleven c: the bars of the four cells nearest the place, summed, so that no edge stands where
    // one cell ends: a soft patch about each bar's middle line, three times as long as it is broad). THE
    // COURT'S BLUE comes in across the floor from the glass: cool near the glass, warm toward the walls. A shade
    // at the foot of each wall and round each planter.
    float R = .05 + .5 * pow(clamp(1. - v.y, 0., 1.), 3.);
    float ew = min(min(vW.x - LB.x, vW.z - LB.y), LB.w - vW.z), ao = .74 + .26 * smoothstep(0., 2., ew);
    vec2 tj = (.5 - abs(fract((vW.xz - LB.xy) / 3.) - .5)) * 3.;
    float jw = max(fw, .01), jt = max(clamp((.012 - tj.x) / jw + .5, 0., 1.), clamp((.012 - tj.y) / jw + .5, 0., 1.)) * clamp(.05 / jw, 0., 1.);
    float zl = vW.z - LB.y + .5 * BW, wz = max(fwidth(vW.z), 1e-3), band = clamp((bandI(zl + .5 * wz) - bandI(zl - .5 * wz)) / wz, 0., 1.);
    float pool = 0.;
    {
      vec2 c0 = floor((vW.xz - LB.xy) / BC - .5);
      for (int i = 0; i < 4; i++) {
        vec4 bn = barCell(vW.xz, c0 + vec2(float(i - 2 * (i / 2)), float(i / 2)), vec2(.02));
        pool += exp(-bn.w * bn.w / 1.6) * (.6 + .4 * bn.y);
      }
    }
    float cool = exp(-max(LB.z - vW.x, 0.) / 15.) * smoothstep(GN - 8., GN, vW.z) * (1. - smoothstep(GS, GS + 8., vW.z));
    float dP = 1e9;
    ${LOBBY_PLANTERS.map((p) => `dP = min(dP, groundOut(vW.xz, vec4(${p.x0.toFixed(2)}, ${(p.z - PLANTER.hb).toFixed(2)}, ${p.x1.toFixed(2)}, ${(p.z + PLANTER.hb).toFixed(2)})));`).join('\n    ')}
    vec3 stone = mix(STONE, vec3(.7, .675, .64), band) * (1. - .1 * jt), glassLight = mix(vec3(1., .975, .93), vec3(.7, .79, 1.03), .62 * cool);
    col = lit3(min(stone * glassLight * (.84 * ao * (1. - .32 * exp(-dP / .9)) + .14 * pool), vec3(.9))) * (1. - R) + R * seen;
  } else if (vK < 1.5) {
    // a wall: white, a shade deeper toward the floor, brightest under the ceiling's lights; fine upright joints;
    // a skirting half a metre high; ROUND THE WHOLE HALL, AT THE CORRIDOR'S CEILING HEIGHT, ONE FINE LINE OF WARM
    // LIGHT in a slim groove, which washes the wall over it and under it (it goes with the lights' one law)
    float y = vW.y, al = abs(vN.x) > .5 ? vW.z - LB.y : vW.x - LB.x;
    float tone = .63 + .19 * smoothstep(0., LH, y) + .06 * exp(-max(LH - y, 0.) / 2.5) - .2 * (1. - smoothstep(0., 1.1, y));
    // (the north wall's joints stand in the middles of its rank's piers; every other wall's every 6 m)
    float pit = vN.z > .5 && vW.z < LB.y + .5 ? NP : 6.;
    float ja = (.5 - abs(fract(al / pit) - .5)) * pit, jw = max(fw, .01);
    float joint = max(clamp((.02 - ja) / jw + .5, 0., 1.), clamp((.02 - abs(y - ${P.CH.toFixed(1)})) / jw + .5, 0., 1.)) * clamp(.06 / jw, 0., 1.);
    tone *= (1. - .11 * joint) * (1. - .06 * (1. - smoothstep(.5, .5 + jw, y)));
    // (the ceiling's lights nearest the wall wash it: a scallop under each, narrow at the head and widening down)
    float lc = (floor(al / 6.) + .5) * 6., wsc = 1.1 + .32 * max(LH - y, 0.), dsc = al - lc;
    tone += .085 * exp(-dsc * dsc / (wsc * wsc)) * exp(-max(LH - y, 0.) / 8.) * (.6 + .4 * waveHump(vW.x + vW.z + (lc - al)));
    float dyc = y - ${P.CH.toFixed(1)}, lineL = clamp((.08 - abs(dyc)) / jw + .5, 0., 1.) * clamp(.16 / jw, .45, 1.), kl = .6 + .4 * waveHump(vW.x + vW.z);
    tone += .07 * exp(-abs(dyc) / (dyc > 0. ? 1.6 : .8)) * kl;
    if (abs(vN.y) > .5) { tone = .6; lineL = 0.; }
    col = vec3(${WHITE.map((c) => c.toFixed(4)).join(', ')}) * vec3(.975, .985, 1.01) * lit(min(tone, .9)) * (1. - lineL) + vec3(1., .9, .7) * (.9 + .5 * kl) * lineL;
  } else if (vK < 2.5) {
    // the ceiling: each bar of the weave set up into it with a dark rim and a pale halo; fine joints on the lattice's lines
    vec4 dn = barNear(vW.xz, max(fwidth(vW.xz), vec2(.004)));
    vec2 jl = (.5 - abs(fract((vW.xz - LB.xy) / 6.) - .5)) * 6.;
    float face = dn.x, rim = (1. - smoothstep(.16 - fw, .16 + fw, dn.z)) * smoothstep(-fw, fw, dn.z) * (1. - smoothstep(.1, .5, fw));
    float halo = 1. - smoothstep(0., 2., dn.z), jw = max(fw, .01), joint = clamp((.03 - min(jl.x, jl.y)) / jw + .5, 0., 1.) * clamp(.09 / jw, 0., 1.);
    col = vec3(${WHITE.map((c) => c.toFixed(4)).join(', ')}) * lit((.69 + .1 * halo) * (1. - .3 * rim) * (1. - .1 * joint)) * (1. - face) + vec3(1., .98, .94) * (.95 + 2.3 * dn.y * sqrt(dn.y)) * face;
  } else if (vK < 3.5) col = vec3(.86, .85, .8) * lit(.8 + .1 * abs(vN.z));
  else if (vK < 4.5) col = STONE * lit(.5);
  else {
    // A NICHE OF THE NORTH WALL'S RANK (round eleven b): white, LIT SOFTLY FROM ABOVE by a slot of light in its head
    // along its back wall (it goes with the lights' one law): the back wall brightest under the slot and a shade
    // deeper toward the floor, the flanks a tone deeper, the floor pale stone with a soft shade round the tub
    float nb = (vW.x - LB.x) / NP, nx = (fract(nb) - .5) * NP, din = LB.y - vW.z, y = vW.y;
    float kl = .6 + .4 * waveHump(LB.x + (floor(nb) + .5) * NP + LB.y), wash = exp(-max(NH - y, 0.) / 5.5) * kl, e5 = max(fw, .01);
    vec3 white = vec3(${WHITE.map((c) => c.toFixed(4)).join(', ')}) * vec3(.975, .985, 1.01);
    if (vN.y < -.5) {
      float slot = clamp((din - (ND - .5)) / e5 + .5, 0., 1.) * (1. - clamp((din - (ND - .12)) / e5 + .5, 0., 1.));
      col = white * lit(.64) * (1. - slot) + vec3(1., .95, .84) * (.9 + .6 * kl) * slot;
    } else if (vN.y > .5) {
      col = STONE * lit(.66 * (1. - .3 * exp(-max(length(vec2(nx, din - ND * .5)) - .7, 0.) / .5)));
    } else {
      float tone = abs(vN.x) > .5 ? .46 + .2 * wash + .08 * din / ND : .56 + .37 * wash;
      col = mix(white, vec3(1., .94, .82), .5 * wash) * lit(min(tone * (1. - .16 * (1. - smoothstep(0., 1.2, y))), .9));
    }
  }
  gl_FragColor = vec4(mix(col, uFogIn, 1. - exp(-dist / 520.)), 1.);
  if (vK > 1.5 && vK < 2.5 && cameraPosition.y > vW.y + .2) discard;
}`;

// ---------------------------------------------------------------- things: a builder of small bodies and their one shader
// attributes: position, normal, color, aE (how much of its colour a face gives off as light). A transform (place, turn
// about the plumb, size) may be set for the faces that follow.
function makeThingBuilder() {
  const pos = [], nor = [], col = [], glo = [], fac = [];
  let ox = 0, oy = 0, oz = 0, cs = 1, sn = 0, sc = 1;
  const far = [9, 9, 18, 18];
  const T = {
    at(x = 0, y = 0, z = 0, ry = 0, k = 1) { ox = x; oy = y; oz = z; cs = Math.cos(ry); sn = Math.sin(ry); sc = k; return T; },
    // (f: the place's own measure on its face: metres from two sides, the face's two lengths; a face without edges: far)
    v(p, n, c, e, f = far) {
      fac.push(f[0] * sc, f[1] * sc, f[2] * sc, f[3] * sc);
      pos.push(ox + (p[0] * cs + p[2] * sn) * sc, oy + p[1] * sc, oz + (-p[0] * sn + p[2] * cs) * sc);
      nor.push(n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs); col.push(c[0], c[1], c[2]); glo.push(e);
    },
    quad(a, b, c, d, n, k, e = 0) {
      const w = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), h = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      const fa = [0, 0, w, h], fb = [w, 0, w, h], fc = [w, h, w, h], fd = [0, h, w, h];
      T.v(a, n, k, e, fa); T.v(b, n, k, e, fb); T.v(c, n, k, e, fc); T.v(a, n, k, e, fa); T.v(c, n, k, e, fc); T.v(d, n, k, e, fd);
      return T;
    },
    tri(a, b, c, n, k, e = 0) { T.v(a, n, k, e); T.v(b, n, k, e); T.v(c, n, k, e); return T; },
    box(x0, x1, y0, y1, z0, z1, k, e = 0, under = false) {
      T.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], k, e);
      T.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], k, e); T.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], k, e);
      T.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], k, e); T.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], k, e);
      if (under) T.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], k, e);
      return T;
    },
    // a round piece about the plumb through (x, z): radius r0 at y0, r1 at y1; caps: 1 top, 2 under, 3 both
    cyl(x, z, r0, r1, y0, y1, k, e = 0, n = 10, caps = 1, kc = null, ec = null) {
      const sl = (r0 - r1) / Math.max(Math.hypot(r0 - r1, y1 - y0), 1e-6), up = Math.sqrt(Math.max(1 - sl * sl, 0));
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const A = [x + r0 * c0, y0, z + r0 * s0], Bq = [x + r0 * c1, y0, z + r0 * s1], Cq = [x + r1 * c1, y1, z + r1 * s1], D = [x + r1 * c0, y1, z + r1 * s0];
        const n0 = [c0 * up, sl, s0 * up], n1 = [c1 * up, sl, s1 * up];
        T.v(A, n0, k, e); T.v(Bq, n1, k, e); T.v(Cq, n1, k, e); T.v(A, n0, k, e); T.v(Cq, n1, k, e); T.v(D, n0, k, e);
        if (caps & 1) T.tri([x, y1, z], D, Cq, [0, 1, 0], kc || k, ec === null ? e : ec);
        if (caps & 2) T.tri([x, y0, z], A, Bq, [0, -1, 0], kc || k, ec === null ? e : ec);
      }
      return T;
    },
    // a round body of many rings about the plumb through (x, z), SMOOTH from ring to ring and round it (its normals
    // are the surface's own at every ring): prof is [radius, height] from the foot up, cols a colour for each ring
    lathe(x, z, prof, cols, n = 12, e = 0) {
      const N = prof.map((p, i) => { const a = prof[Math.max(i - 1, 0)], b = prof[Math.min(i + 1, prof.length - 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l]; });
      for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], m0 = N[j], m1 = N[j + 1], k0 = cols[j], k1 = cols[j + 1];
        const A = [x + r0 * c0, y0, z + r0 * s0], Bq = [x + r0 * c1, y0, z + r0 * s1], Cq = [x + r1 * c1, y1, z + r1 * s1], D = [x + r1 * c0, y1, z + r1 * s0];
        const nA = [c0 * m0[0], m0[1], s0 * m0[0]], nB = [c1 * m0[0], m0[1], s1 * m0[0]], nC = [c1 * m1[0], m1[1], s1 * m1[0]], nD = [c0 * m1[0], m1[1], s0 * m1[0]];
        T.v(A, nA, k0, e); T.v(Bq, nB, k0, e); T.v(Cq, nC, k1, e); T.v(A, nA, k0, e); T.v(Cq, nC, k1, e); T.v(D, nD, k1, e);
      }
      return T;
    },
    get triangles() { return pos.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(glo, 1));
      g.setAttribute('aF', new THREE.Float32BufferAttribute(fac, 4));
      return g;
    },
    // the same for a large mesh of things: the page gets a breath after every attribute
    async buildLong(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      await ctx.yield();
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      await ctx.yield();
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      await ctx.yield();
      g.setAttribute('aE', new THREE.Float32BufferAttribute(glo, 1)); g.setAttribute('aF', new THREE.Float32BufferAttribute(fac, 4));
      return g;
    },
  };
  return T;
}
// what moves a thing, per instance (aMove: kind, a, b, c), all by the world clock:
// 1 turns about its own plumb (rate a, phase b); 2 slides along its own z by c in a wave (period a, phase b);
// 3 turns about its own z as a clock's hand does (rate a, phase b); 4 nods about its own x at height c (rate a, phase b);
// 5 lifts by c and settles (period a, phase b); 6 stirs (rate a, phase b, reach c); 7 glides up by c and down again
// evenly, as a lamp rides its cord or a lift's car its shaft (period a, start b)
const THING_VERT = /* glsl */`
attribute float aE;
attribute vec4 aF;
#ifdef USE_INSTANCING
attribute vec4 aMove;
#endif
${GLSL_WAVE}
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vE; varying float vY; varying vec4 vF;
void main(){
  vec3 p = position, n = normal;
  vF = aF;
  vY = position.y;
  #ifdef USE_INSTANCING
  float k = aMove.x, ang = aMove.y * uTime + aMove.z, c = cos(ang), s = sin(ang);
  float per = max(aMove.y, .05);
  if (k < .5) { p = position; }
  else if (k < 1.5) { p.xz = vec2(p.x * c + p.z * s, -p.x * s + p.z * c); n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c); }
  else if (k < 2.5) { float ph = fract(aMove.z - uTime / per); p.z += aMove.w * smoothstep(0., .2, ph) * (1. - smoothstep(.4, .6, ph)); }
  else if (k < 3.5) { p.xy *= vec2(fract(aMove.w), floor(aMove.w) / 100.); p.xy = vec2(p.x * c + p.y * s, -p.x * s + p.y * c); }
  else if (k < 4.5) { float a4 = .45 * sin(ang), c4 = cos(a4), s4 = sin(a4); p.y -= aMove.w; p.yz = vec2(p.y * c4 - p.z * s4, p.y * s4 + p.z * c4); n.yz = vec2(n.y * c4 - n.z * s4, n.y * s4 + n.z * c4); p.y += aMove.w; }
  else if (k < 5.5) { float ph = fract(aMove.z - uTime / per), up = sin(3.14159265 * clamp(ph / .55, 0., 1.)); up *= up; float a5 = .9 * up * sin(ph * 19.); p.xy = vec2(p.x * cos(a5) - p.y * sin(a5), p.x * sin(a5) + p.y * cos(a5)); p.y += aMove.w * up; }
  else if (k < 6.5) { p.xz += aMove.w * vec2(sin(ang + p.y * .7), cos(ang * .8 + p.y * .5)); }
  else if (k < 7.5) { p.y += aMove.w * (.5 - .5 * cos(6.2831853 * (uTime / per + aMove.z))); }
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);
  #else
  vec4 w = modelMatrix * vec4(p, 1.);
  vN = normalize(mat3(modelMatrix) * n);
  #endif
  vCol = color; vE = aE;
  #ifdef USE_INSTANCING
  // (kind 8: A CORRIDOR'S WALL LAMP SWELLS WITH ITS COVE: its light goes by the lights' one law at its own metre of
  // the corridor (aMove.z: the place's number in the wave there), from aMove.w of itself at rest to the whole at a
  // front; it does not move)
  if (k > 7.5 && k < 8.5) vE *= aMove.w + (1. - aMove.w) * waveHump(aMove.z);
  #endif
  #ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * w;
  vW = w.xyz;
}`;
const THING_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vE; varying float vY; varying vec4 vF;
uniform vec3 uFogIn, uNight; uniform float uFogKIn; uniform vec4 uLamp;
${GLSL_LIT}${GLSL_NIGHT}${GLSL_WELLAIR}
void main(){
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  // lit from the ceiling, a little from one side so that faces differ, a shade where it meets its floor
  float tone = (.6 + .24 * clamp(n.y, 0., 1.) + .16 * (.5 + .5 * dot(n, vec3(.38, .25, .89))) - .1 * clamp(-n.y, 0., 1.)) * (.84 + .16 * smoothstep(0., .7, vY));
  // EVERY MADE THING CARRIES ITS EDGES AND ITS GLEAM: a darker line along the edges of each flat face (4.5 cm, thinning
  // to its own share of the pixel far off), and on a top a soft gleam of the ceiling's light, stronger the flatter
  // the look (no line of light stands in it: no ceiling carries one)
  vec2 e2 = min(vF.xy, vF.zw - vF.xy);
  float ed = min(e2.x, e2.y), aw = max(fwidth(ed), .004);
  float edge = clamp((.045 - ed) / aw + .5, 0., 1.) * clamp(.09 / aw, 0., 1.);
  tone *= 1. - .3 * edge;
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 ve = toEye / max(dist, 1e-3);
  float top = smoothstep(.7, .95, n.y), graze = pow(clamp(1. - ve.y, 0., 1.), 3.);
  vec3 col = vCol * lit(tone) * (1. - vE) + vCol * vE * 2.4;
  col += vec3(1., .98, .94) * top * (1. - vE) * (1. - edge) * (.03 + .2 * graze);
  // the island's great lamp: its warm pool on whatever stands under it, on the platform (uLamp: the island's place,
  // reach squared, strength)
  vec2 la = vW.xz - uLamp.xy;
  float inH1 = step(dot(la, la), 196.) * step(-1., vW.y) * step(vW.y, 9.);
  col *= 1. + uLamp.w * inH1 * vec3(.9, .64, .32) * exp(-dot(la, la) / uLamp.z) * (.35 + .65 * abs(n.y)) * (1. - vE);
  #ifdef NIGHT
  // (round nine) A THING OF THE COURT BESIDE THE CORRIDOR stands in the great hall's night: lit only by the court's
  // lamp standards (uNight: their x, one's z, their pitch along z), by the white light that falls out through the
  // gallery's glass and by its own lit faces; between lights deep blue, never black
  float dzl = mod(vW.z - uNight.y + .5 * uNight.z, uNight.z) - .5 * uNight.z, dxl = vW.x - uNight.x, d2 = dxl * dxl + dzl * dzl + (vW.y - 4.9) * (vW.y - 4.9) * .4;
  vec3 lightN = vec3(.13, .18, .4) + vec3(1., .84, .56) * 1.1 * (exp(-d2 / 30.) + .35 * exp(-d2 / 170.)) + vec3(.8, .86, 1.) * .5 * exp(-max(vW.x + 64.5, 0.) / 5.);
  // (round ten: what is green is LIT FROM BELOW, warm, as by a lamp set in its tub: the swells' under sides brightest)
  lightN += step(1.25 * max(vCol.r, vCol.b), vCol.g) * vec3(1., .88, .6) * (.3 + .9 * clamp(.3 - n.y, 0., 1.));
  col = lit3(min(vCol * lightN * (.5 + .6 * tone), vec3(.93))) * (1. - vE) + vCol * vE * 2.4;
  gl_FragColor = vec4(nightAir(col, cameraPosition, -toEye), 1.);
  #else
  #ifdef WELLAIR
  col = wellAir(col, vW, dist, vE);
  #endif
  gl_FragColor = vec4(mix(col, uFogIn, 1. - exp(-dist * uFogKIn)), 1.);
  #endif
}`;
// (well: a thing that stands in the well of storeys, in its air: see WELLAIR; night: a thing of the court)
function makeThingMaterial(timeU, fogK, lamp = 0, well = false, night = false) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: timeU, uFogIn: { value: new THREE.Vector3(...lin('#f4f3ee', 0.92)) }, uFogKIn: { value: fogK }, uLamp: { value: new THREE.Vector4(P.ISLAND.x, P.ISLAND.z, 110, lamp) }, uNight: { value: new THREE.Vector3(COURT_LAMPS.x, COURT_LAMPS.z, COURT_LAMPS.step) } },
    defines: well ? { WELLAIR: 1 } : night ? { NIGHT: 1 } : {}, vertexColors: true, side: THREE.DoubleSide, vertexShader: THING_VERT, fragmentShader: THING_FRAG,
  });
}
// an instanced mesh of one thing: list of { m: Matrix4, move: [kind, a, b, c] }
function instanced(geo, mat, list) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1)), mv = new Float32Array(Math.max(list.length, 1) * 4);
  const tint = list.some((q) => q.col), k3 = new THREE.Color();
  list.forEach((q, i) => { mesh.setMatrixAt(i, q.m); mv.set(q.move || [0, 0, 0, 0], i * 4); if (tint) mesh.setColorAt(i, q.col ? k3.setRGB(q.col[0], q.col[1], q.col[2]) : k3.setRGB(1, 1, 1)); });
  mesh.count = list.length;
  geo.setAttribute('aMove', new THREE.InstancedBufferAttribute(mv, 4));
  mesh.frustumCulled = false;
  return mesh;
}

const ISLE_SEAT = lin('#2a55c8');
const ASH = lin('#e0d7c6'), SHELLW = lin('#f1efe9'), TEAL = lin('#2e6f75'), STEEL = lin('#9aa0a8'), WARM = lin('#ffe0b2'), LEAF = lin('#3f8f58'), POT = lin('#e9e6df');
// a swivel chair, two and a half times life: five-star foot, column, a round seat of teal, a white shell back 2.7 m
// high. It looks along +z.
function addChair(T, x = 0, z = 0, ry = 0, seat = TEAL, top = 2.7) {
  for (let i = 0; i < 5; i++) T.at(x, 0, z, ry + i / 5 * Math.PI * 2).box(0.1, 0.95, 0.08, 0.2, -0.07, 0.07, STEEL);
  T.at(x, 0, z, ry).cyl(0, 0, 0.09, 0.09, 0.1, 1.05, STEEL, 0, 6, 0).cyl(0, 0, 0.72, 0.78, 1.05, 1.3, seat, 0, 12, 3);
  for (let i = 0; i < 4; i++) {
    const a0 = Math.PI * (1.15 + 0.7 * i / 4), a1 = Math.PI * (1.15 + 0.7 * (i + 1) / 4), am = (a0 + a1) / 2;
    const q = (a, y, r) => [r * Math.cos(a), y, r * Math.sin(a)];
    T.quad(q(a0, 1.15, 0.8), q(a1, 1.15, 0.8), q(a1, top, 0.94), q(a0, top, 0.94), [-Math.cos(am), 0, -Math.sin(am)], SHELLW);
  }
  return T.at();
}
function chairGeo(seat = TEAL, top = 2.7) { return addChair(makeThingBuilder(), 0, 0, 0, seat, top).build(); }
// A WALL LAMP ON A BRACKET (round five), about its own place on the wall: x along the wall, y up from the lamp's own
// height, z out from the wall: a back plate, an arm, a small warm shade
const BRACKET = lin('#ffd08c');
function bracketGeo() {
  const T = makeThingBuilder();
  T.box(-0.13, 0.13, -0.32, 0.32, 0, 0.05, STEEL).box(-0.04, 0.04, -0.04, 0.04, 0.05, 0.4, STEEL);
  T.cyl(0, 0.4, 0.28, 0.19, -0.3, 0.3, BRACKET, 0.6, 10, 3, BRACKET, 0.8);
  return T.build();
}
// its light: a scallop of warm light up and down the wall behind it and a pool on the floor at the wall's foot, two
// flat pieces laid over what lies under them. The lamp hangs `drop` metres over the floor. uv: the piece's own
// measure, -1 to 1 across; aK: 0 the wall's piece (v in metres from the lamp), 1 the floor's
function bracketGlowGeo(drop) {
  const g = new THREE.BufferGeometry(), pos = [], uv = [], kind = [];
  const quad = (q, t, k) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0], q[i][1], q[i][2]); uv.push(t[i][0], t[i][1]); kind.push(k); } };
  quad([[-3, -drop + 0.05, 0.035], [3, -drop + 0.05, 0.035], [3, 3.0, 0.035], [-3, 3.0, 0.035]], [[-3, -drop + 0.05], [3, -drop + 0.05], [3, 3.0], [-3, 3.0]], 0);
  quad([[-2.6, -drop + 0.03, 3.6], [2.6, -drop + 0.03, 3.6], [2.6, -drop + 0.03, 0.02], [-2.6, -drop + 0.03, 0.02]], [[-2.6, 3.6], [2.6, 3.6], [2.6, 0.02], [-2.6, 0.02]], 1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kind, 1));
  return g;
}
const GLOW_VERT = /* glsl */`
attribute float aK, aFree;
// (aWave: a corridor's wall lamp swells with its cove: the place's number in the wave at its own metre of the
// corridor, and the share of its light it keeps at rest; a lamp that does not swell: 1)
attribute vec2 aWave;
${GLSL_WAVE}
varying vec2 vU; varying float vK; varying float vD; varying float vFree; varying float vSwell;
void main(){
  vU = uv; vK = aK; vFree = aFree;
  vSwell = aWave.y + (1. - aWave.y) * waveHump(aWave.x);
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  vD = length(w.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLOW_FRAG = /* glsl */`
varying vec2 vU; varying float vK; varying float vD; varying float vFree; varying float vSwell;
uniform float uFogK, uGain;
void main(){
  float g;
  if (vK < .5) {
    // the scallop: a fan that widens up and down the wall from the lamp and thins with the height
    // (it ends where its own stretch of plain wall ends: none hangs in an opening)
    float y = vU.y, w = .5 + .5 * abs(y);
    g = exp(-vU.x * vU.x / (w * w)) * exp(-abs(y) / (y > 0. ? 1.5 : 2.3)) * (1. - smoothstep(vFree - .6, vFree, abs(vU.x)));
  } else {
    g = .8 * exp(-(vU.x * vU.x + vU.y * vU.y * .7) / 2.4) * (1. - smoothstep(2., 2.6, abs(vU.x))) * (1. - smoothstep(2.8, 3.6, vU.y));
  }
  // (laid over what is under it as: under * alpha + colour: the face loses half its cool light where the lamp's warm
  // light lies on it, so that the scallop reads on a white wall as well as on a dark floor)
  float k = clamp(uGain * g * vSwell, 0., 1.) * exp(-vD * uFogK);
  // (round seven: ON A FLOOR the lamp's light lies as a faint pale sheen; a warm pool on black stone would read as a
  // brown floor. On the wall the scallop stays warm.)
  gl_FragColor = vec4(mix(vec3(.64, .47, .23), vec3(.3, .3, .33), vK) * k, 1. - .5 * k * (1. - vK));
}`;
// plain stretches of a wall between its openings (spans [q0, q1]) from q = a to b: a lamp to each 6 m of a stretch,
// evenly, none in a stretch shorter than 2.4 m
function lampSpots(a, b, open) {
  const spans = open.filter((o) => o[1] > a && o[0] < b).map((o) => [o[0], o[1]]).sort((p0, p1) => p0[0] - p1[0]), out = [];
  let at = a;
  for (const sp of spans.concat([[b, b]])) {
    const L = sp[0] - at;
    if (L >= 2.4) { const n = Math.max(1, Math.ceil(L / 6 - 1e-6)); for (let i = 0; i < n; i++) out.push([at + (i + 0.5) * L / n, L / (2 * n)]); }
    at = Math.max(at, sp[1]);
  }
  return out;
}
// what rides the tide, each about its own middle on the carpet: a desk of the fleet with its chair drawn up to it (its
// lamp apart, so that it may swing a little late), a tall cabinet, a big potted plant, a low sofa, a round meeting
// table with its chairs
function deskGeo() {
  const T = makeThingBuilder().at(0, 0, -0.95);
  T.box(-2.1, 2.1, 1.71, 1.85, -1.0, 1.0, ASH, 0, true).box(-2.0, -1.9, 0, 1.71, -0.9, 0.9, SHELLW).box(1.9, 2.0, 0, 1.71, -0.9, 0.9, SHELLW);
  T.box(-1.9, 1.9, 0.5, 1.71, -0.82, -0.74, SHELLW).box(0.6, 1.9, 0, 1.71, -0.1, 0.9, SHELLW);
  T.box(-1.5, -0.9, 1.85, 2.05, -0.3, 0.45, [0.93, 0.93, 0.9]);
  // the lamp's own warm pool on the desk top
  T.cyl(1.2, -0.3, 0.85, 0.85, 1.85, 1.856, WARM, 0.32, 10, 1);
  return addLeanChair(T, -0.3, 1.0, Math.PI).build();
}
// (lamps of two kinds: a cone on its stem, and a straight shade)
function lampGeo(straight) {
  const T = makeThingBuilder().at(0, 0, -0.95);
  T.cyl(1.3, -0.4, 0.22, 0.18, 1.85, 1.93, STEEL, 0, 8, 1).box(1.27, 1.33, 1.93, 2.75, -0.43, -0.37, STEEL);
  if (straight) T.cyl(1.3, -0.4, 0.46, 0.46, 2.45, 3.05, WARM, 0.85, 12, 3, WARM, 1); else T.cyl(1.3, -0.4, 0.62, 0.26, 2.55, 3.05, WARM, 0.85, 10, 3, WARM, 1);
  return T.build();
}
// THE STAIR UNDER THE ROUND OPENING, about its own axis (the part's STAIR; the one thing in the tide hall that rides
// nothing): A ROUND PLINTH of pale stone from the hall's deep floor up to half a metre over the highest crest, one
// fine inlaid ring on its top; on it A WHITE ROUND STAIR about a newel: four half turns, each of seven treads
// (22 degrees each, a riser of 0.456 m: 0.18 m at life size) and A LANDING (26 degrees), a slim baluster at every
// tread's outer end and a handrail over them, a band of warm light round the newel at every landing; from the last
// landing, which looks due south, A GANGWAY 2.6 m wide with slim rails runs level to the well's rim (the line's
// wheel passes over that bearing only at its top, 26 m higher). A stair is a thing of known size: the hall and its
// round opening are measured by it.
function stairGeo() {
  const T = makeThingBuilder(), S = STAIR, yt = S.top, STONE = lin('#e6e2d8'), STONE_D = lin('#c9c5bb'), STEP = lin('#f4f3ee'), UNDER = lin('#c3c8cd'), RAILC = lin('#aab0b7');
  T.cyl(0, 0, S.r + 0.3, S.r, P.H2.deep, yt - 0.3, STONE, 0, 28, 0).cyl(0, 0, S.r, S.r - 0.12, yt - 0.3, yt, STONE_D, 0, 28, 1, STONE);
  T.cyl(0, 0, S.r - 0.7, S.r - 0.7, yt, yt + 0.012, GOLD, 0.25, 28, 1).cyl(0, 0, S.r - 0.82, S.r - 0.82, yt + 0.012, yt + 0.02, STONE, 0, 28, 1);
  const rise = (S.head - yt) / (8 * S.halves), D = Math.PI / 180, a0 = (90 + 13) * D, RAIL_H = 2.4, ro = S.out, rb = S.out - 0.12;
  const at = (r, a, y) => [r * Math.cos(a), y, r * Math.sin(a)];
  // a slim bar of square section between two places
  const rod = (a, b, w, col, e = 0) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], hl = Math.hypot(d[0], d[2]) || 1, u = [-d[2] / hl, 0, d[0] / hl];
    const l = Math.hypot(d[0], d[1], d[2]), v = [(u[1] * d[2] - u[2] * d[1]) / l, (u[2] * d[0] - u[0] * d[2]) / l, (u[0] * d[1] - u[1] * d[0]) / l];
    const c = (p, su, sv) => [p[0] + (u[0] * su + v[0] * sv) * w, p[1] + (u[1] * su + v[1] * sv) * w, p[2] + (u[2] * su + v[2] * sv) * w];
    for (const [su, sv, n] of [[1, 0, u], [-1, 0, u.map((q) => -q)], [0, 1, v], [0, -1, v.map((q) => -q)]]) {
      const p0 = su ? c(a, su, -1) : c(a, -1, sv), p1 = su ? c(a, su, 1) : c(a, 1, sv), p2 = su ? c(b, su, 1) : c(b, 1, sv), p3 = su ? c(b, su, -1) : c(b, -1, sv);
      T.quad(p0, p1, p2, p3, n, col, e);
    }
  };
  // a step or a landing: a wedge between two bearings, from the newel out, `th` thick under its top
  const wedge = (aa, ab, y, th) => {
    const m = (aa + ab) / 2, na = [Math.sin(aa), 0, -Math.cos(aa)], nb = [-Math.sin(ab), 0, Math.cos(ab)], no = [Math.cos(m), 0, Math.sin(m)];
    T.quad(at(S.newel, aa, y), at(ro, aa, y), at(ro, ab, y), at(S.newel, ab, y), [0, 1, 0], STEP);
    T.quad(at(S.newel, aa, y - th), at(ro, aa, y - th), at(ro, ab, y - th), at(S.newel, ab, y - th), [0, -1, 0], UNDER);
    T.quad(at(S.newel, aa, y - th), at(ro, aa, y - th), at(ro, aa, y), at(S.newel, aa, y), na, STEP);
    T.quad(at(S.newel, ab, y - th), at(ro, ab, y - th), at(ro, ab, y), at(S.newel, ab, y), nb, STEP);
    T.quad(at(ro, aa, y - th), at(ro, ab, y - th), at(ro, ab, y), at(ro, aa, y), no, STEP);
  };
  let prev = null;
  const post = (a, y) => { const p = at(rb, a, y), top = [p[0], y + RAIL_H, p[2]]; T.cyl(p[0], p[2], 0.05, 0.05, y, y + RAIL_H, RAILC, 0, 4, 0); if (prev) rod(prev, top, 0.07, STEP); prev = top; };
  for (let h = 0; h < S.halves; h++) {
    for (let k = 0; k < 7; k++) {
      const aa = a0 + (h * 180 + k * 22) * D, y = yt + (h * 8 + k + 1) * rise;
      wedge(aa, aa + 22 * D, y, 0.18);
      post(aa + 11 * D, y);
    }
    const aa = a0 + (h * 180 + 154) * D, y = yt + (h * 8 + 8) * rise;
    wedge(aa, aa + 26 * D, y, 0.3);
    post(aa + 3 * D, y); post(aa + 23 * D, y);
    // (the newel's band of warm light at the landing's own height)
    T.cyl(0, 0, S.newel + 0.12, S.newel + 0.12, y + 2.0, y + 2.6, WARM, 0.85, 14, 0);
  }
  T.cyl(0, 0, S.newel, S.newel, yt + 0.02, S.head + RAIL_H + 0.5, STEP, 0, 14, 1);
  // THE GANGWAY, due south from the last landing to the rim's inner face
  const g0 = ro - 0.3, g1 = P.WELL.r + 0.3, gw = 1.3;
  T.box(-gw, gw, S.head - 0.3, S.head, g0, g1, STEP, 0, true);
  for (const sx of [-1, 1]) {
    const x = sx * (gw - 0.08);
    for (let z = g0 + 0.2; z < g1; z += 3.05) T.cyl(x, z, 0.05, 0.05, S.head, S.head + RAIL_H, RAILC, 0, 4, 0);
    rod([x, S.head + RAIL_H, g0 + 0.2], [x, S.head + RAIL_H, g1 - 0.3], 0.07, STEP);
    rod([x, S.head + 0.9, g0 + 0.2], [x, S.head + 0.9, g1 - 0.3], 0.035, RAILC);
  }
  return T.build();
}
// a desk of the fleet alone (its chair pulled out and adrift by itself)
function bareDeskGeo() {
  const T = makeThingBuilder().at(0, 0, -0.95);
  T.box(-2.1, 2.1, 1.71, 1.85, -1.0, 1.0, ASH, 0, true).box(-2.0, -1.9, 0, 1.71, -0.9, 0.9, SHELLW).box(1.9, 2.0, 0, 1.71, -0.9, 0.9, SHELLW);
  T.box(-1.9, 1.9, 0.5, 1.71, -0.82, -0.74, SHELLW).box(0.6, 1.9, 0, 1.71, -0.1, 0.9, SHELLW);
  T.box(-1.5, -0.9, 1.85, 2.05, -0.3, 0.45, [0.93, 0.93, 0.9]);
  T.cyl(1.2, -0.3, 0.85, 0.85, 1.85, 1.856, WARM, 0.32, 10, 1);
  return T.build();
}
// the long meeting table, 12 m, with four chairs a side
function longTableGeo() {
  const T = makeThingBuilder();
  T.box(-6, 6, 1.71, 1.85, -1.3, 1.3, ASH, 0, true).box(-5.2, -4.9, 0, 1.71, -1.0, 1.0, SHELLW).box(4.9, 5.2, 0, 1.71, -1.0, 1.0, SHELLW).box(-0.15, 0.15, 0, 1.71, -1.0, 1.0, SHELLW);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) { addChair(T, x, 2.0, Math.PI); addChair(T, x, -2.0, 0); }
  return T.build();
}
// (round eight: allRound: a cabinet that stands free, as those that ride the tide do, carries its four drawer fronts
// on its back too and a drawer's side on each flank, so that from no side it shows a blank white slab: nothing that
// stands among desks reads as a panel or a partition)
function addCabinet(T, allRound = false) {
  const face = lin('#dfe1e2'), dark = lin('#7d848c');
  T.box(-0.65, 0.65, 0, 3.6, -0.8, 0.8, SHELLW);
  for (let i = 0; i < 4; i++) {
    const y0 = 0.12 + i * 0.87, y1 = y0 + 0.78;
    T.quad([-0.57, y0, 0.81], [0.57, y0, 0.81], [0.57, y1, 0.81], [-0.57, y1, 0.81], [0, 0, 1], face);
    T.box(-0.2, 0.2, y0 + 0.5, y0 + 0.58, 0.81, 0.88, dark);
    if (allRound) {
      T.quad([0.57, y0, -0.81], [-0.57, y0, -0.81], [-0.57, y1, -0.81], [0.57, y1, -0.81], [0, 0, -1], face);
      T.box(-0.2, 0.2, y0 + 0.5, y0 + 0.58, -0.88, -0.81, dark);
      T.quad([0.66, y0, 0.72], [0.66, y0, -0.72], [0.66, y1, -0.72], [0.66, y1, 0.72], [1, 0, 0], face);
      T.quad([-0.66, y0, -0.72], [-0.66, y0, 0.72], [-0.66, y1, 0.72], [-0.66, y1, -0.72], [-1, 0, 0], face);
    }
  }
  return T;
}
function cabinetGeo() { return addCabinet(makeThingBuilder(), true).build(); }
// A TREE'S CROWN (round ten): NO CONE OF FLAT FACETS. Three soft tiers, one over the other, each a rounded swell
// with a waist between: one smooth body of thirteen rings, twelve-sided, its normals the surface's own; deeper
// green in the waists, fresher on the swells. [radius, height] for a tree in a tub (the crown from 1.45 to 6.35 m)
const CROWN = [[0.1, 1.45], [0.9, 1.7], [1.5, 2.25], [1.35, 2.9], [0.6, 3.3], [1.0, 3.55], [1.2, 4.0], [1.0, 4.5], [0.45, 4.8], [0.75, 5.05], [0.85, 5.4], [0.6, 5.85], [0.08, 6.35]];
const LEAF_D = lin('#2f8050'), LEAF_L = lin('#72c080');
// (k: the crown's breadth; y0, ky: its foot and its height's measure)
function crownOf(T, x, z, k = 1, y0 = 1.45, ky = 1, n = 12) {
  const prof = CROWN.map(([r, y]) => [r * k, y0 + (y - 1.45) * ky]);
  const cols = CROWN.map(([r]) => { const t = clamp((r - 0.35) / 1.0, 0, 1); return [LEAF_D[0] + (LEAF_L[0] - LEAF_D[0]) * t, LEAF_D[1] + (LEAF_L[1] - LEAF_D[1]) * t, LEAF_D[2] + (LEAF_L[2] - LEAF_D[2]) * t]; });
  return T.lathe(x, z, prof, cols, n);
}
function addPlant(T) {
  T.cyl(0, 0, 0.62, 0.85, 0, 1.15, POT, 0, 12, 1, lin('#5a4a3a')).cyl(0, 0, 0.1, 0.07, 1.15, 1.5, lin('#7a6248'), 0, 6, 0);
  return crownOf(T, 0, 0, 0.82, 1.3, 0.56);
}
function plantGeo() { return addPlant(makeThingBuilder()).build(); }
function sofaGeo() {
  const T = makeThingBuilder(), cloth = lin('#3d7d84');
  T.box(-2.5, 2.5, 0.25, 1.0, -0.95, 0.95, cloth).box(-2.5, 2.5, 1.0, 2.0, -0.95, -0.5, cloth).box(-2.5, -2.05, 1.0, 1.5, -0.5, 0.95, cloth).box(2.05, 2.5, 1.0, 1.5, -0.5, 0.95, cloth);
  for (const [x, z] of [[-2.3, -0.8], [2.3, -0.8], [-2.3, 0.8], [2.3, 0.8]]) T.box(x - 0.08, x + 0.08, 0, 0.25, z - 0.08, z + 0.08, STEEL);
  return T.build();
}
function tableGeo() {
  const T = makeThingBuilder();
  T.cyl(0, 0, 2.1, 2.1, 1.73, 1.85, ASH, 0, 20, 3).cyl(0, 0, 0.9, 0.3, 0, 0.3, SHELLW, 0, 10, 0).cyl(0, 0, 0.25, 0.25, 0.3, 1.73, SHELLW, 0, 8, 0);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; addLeanChair(T, 3.0 * Math.sin(a), 3.0 * Math.cos(a), a + Math.PI); }
  return T.build();
}
// THE ISLAND OF HALL ONE, about its own middle (round five; round nine: ONE, ALONE in the hall): SEVEN
// OPEN WEDGE DESKS in a ring round its own great lamp, each FACING OUTWARD (who sits at one sits inside the ring, the
// lamp at the back): an ash top 1.85 m up, 4.9 to 7.5 m from the lamp, on four slim legs, a low pedestal of drawers
// under one end. NOTHING STANDS BETWEEN TWO DESKS AND NOTHING UPRIGHT ON ONE but its own small arc lamp and a few
// dealt plain things: no panel, no screen, no wall, no partition; the floor is seen under every top and between
// every two. Nothing else stands by it (round nine: the planting is gone). Returns where the seven chairs stand
// (3.9 m out, inside the ring).
const ISLE_RING = [4.9, 7.5, 3.9], SHADE_W = lin('#ffdca8'), GOLD = lin('#ffd28a');
// THE ISLAND'S PLACE (round nine: one island): on the corridor's own axis, ISLE_OFF metres from the line at the nearest
function islandThings(T, r) {
  const chairs = [], [R0, R1, RC] = ISLE_RING;
  for (let d = 0; d < 7; d++) {
    const th = (d + 0.5) / 7 * Math.PI * 2, half = Math.PI / 7 - 0.055, N = 4;
    const q = (a, y, rad) => [rad * Math.cos(th + a), y, rad * Math.sin(th + a)];
    for (let i = 0; i < N; i++) {
      const a0 = -half + 2 * half * i / N, a1 = -half + 2 * half * (i + 1) / N, am = th + (a0 + a1) / 2, n = [Math.cos(am), 0, Math.sin(am)];
      // (the top is one plain face: its pieces carry no edge of their own)
      T.tri(q(a0, 1.85, R0), q(a1, 1.85, R0), q(a1, 1.85, R1), [0, 1, 0], ASH).tri(q(a0, 1.85, R0), q(a1, 1.85, R1), q(a0, 1.85, R1), [0, 1, 0], ASH);
      T.quad(q(a0, 1.71, R1), q(a1, 1.71, R1), q(a1, 1.85, R1), q(a0, 1.85, R1), n, ASH);
      T.quad(q(a0, 1.71, R0), q(a1, 1.71, R0), q(a1, 1.85, R0), q(a0, 1.85, R0), [-n[0], 0, -n[2]], ASH);
      T.quad(q(a0, 1.71, R0), q(a1, 1.71, R0), q(a1, 1.71, R1), q(a0, 1.71, R1), [0, -1, 0], ASH);
    }
    for (const sg of [-1, 1]) {
      const a = half * sg, n = [-Math.sin(th + a) * sg, 0, Math.cos(th + a) * sg];
      T.quad(q(a, 1.71, R0), q(a, 1.71, R1), q(a, 1.85, R1), q(a, 1.85, R0), n, ASH);
      for (const rad of [R0 + 0.24, R1 - 0.24]) { const g = q(a - sg * 0.24 / rad, 0, rad); T.cyl(g[0], g[2], 0.075, 0.075, 0, 1.71, STEEL, 0, 4, 0); }
    }
    // a pedestal of drawers under one end, the arc lamp at the other, lit warm
    const ry = -th;
    T.at(0, 0, 0, ry).box(5.5, 7.0, 0.12, 1.71, 1.25, 2.1, SHELLW);
    for (let i = 0; i < 3; i++) T.quad([7.01, 0.22 + i * 0.5, 1.33], [7.01, 0.22 + i * 0.5, 2.02], [7.01, 0.64 + i * 0.5, 2.02], [7.01, 0.64 + i * 0.5, 1.33], [1, 0, 0], lin('#dfe1e2'));
    T.box(5.55, 5.63, 1.85, 3.3, -1.94, -1.86, STEEL).box(5.55, 6.5, 3.22, 3.3, -1.94, -1.86, STEEL);
    T.cyl(6.5, -1.9, 0.42, 0.12, 2.92, 3.26, WARM, 0.75, 6, 2, WARM, 1);
    // (the small lamp's own warm pool on the top)
    T.cyl(6.4, -1.5, 0.8, 0.8, 1.85, 1.856, WARM, 0.3, 8, 1);
    // dealt plain things: stacks of blank paper, a tray, a mug, a small plant
    const kinds = r.shuffle([0, 1, 2, 3, 0]).slice(0, 3), spots = [[6.3, 0.2], [5.6, 0.8], [6.8, -0.6]];
    kinds.forEach((k, i) => {
      const [px, pz] = spots[i];
      if (k === 0) T.box(px - 0.3, px + 0.3, 1.85, 1.95 + r.range(0, 0.4), pz - 0.4, pz + 0.4, [0.93, 0.93, 0.9]);
      else if (k === 1) T.box(px - 0.42, px + 0.42, 1.85, 1.93, pz - 0.3, pz + 0.3, STEEL);
      else if (k === 2) T.cyl(px, pz, 0.14, 0.14, 1.85, 2.15, r.chance(0.5) ? ISLE_SEAT : SHELLW, 0, 6, 1);
      else T.cyl(px, pz, 0.17, 0.24, 1.85, 2.17, POT, 0, 6, 0).cyl(px, pz, 0.13, 0.46, 2.17, 2.55, LEAF, 0, 5, 0).cyl(px, pz, 0.46, 0.05, 2.55, 3.0, LEAF, 0, 5, 0);
    });
    T.at();
    chairs.push([RC * Math.cos(th), RC * Math.sin(th)]);
  }
  // the great lamp: a foot, the mast up to the ceiling, the shade (its under side the brightest warm face over the
  // island) and a white collar where the mast meets it
  T.cyl(0, 0, 0.7, 0.3, 0, 0.3, SHELLW, 0, 8, 1).cyl(0, 0, 0.26, 0.2, 0.3, 7.8, SHELLW, 0, 6, 0);
  // (the shade, 10 m across, hangs at 5 to 7 m)
  T.cyl(0, 0, 5.0, 1.4, 5.0, 7.0, SHADE_W, 0.5, 20, 3, SHADE_W, 0.8);
  T.cyl(0, 0, 1.4, 0.7, 7.0, 7.8, SHELLW, 0, 8, 0);
  return chairs;
}
// (an island's chair, plain and few-sided: a five-star foot, a column, a round seat, a shell back)
// (round ten: the fleet's desks and round tables carry the lean chair, the island's own make)
function addLeanChair(T, x, z, ry, seat = TEAL, top = 2.7) {
  for (let i = 0; i < 5; i++) T.at(x, 0, z, ry + i / 5 * Math.PI * 2).quad([0.1, 0.2, -0.07], [0.95, 0.2, -0.07], [0.95, 0.2, 0.07], [0.1, 0.2, 0.07], [0, 1, 0], STEEL);
  T.at(x, 0, z, ry).cyl(0, 0, 0.09, 0.09, 0.1, 1.05, STEEL, 0, 5, 0).cyl(0, 0, 0.72, 0.78, 1.05, 1.3, seat, 0, 8, 3);
  for (let i = 0; i < 3; i++) {
    const a0 = Math.PI * (1.15 + 0.7 * i / 3), a1 = Math.PI * (1.15 + 0.7 * (i + 1) / 3), am = (a0 + a1) / 2, q = (a, y, rr) => [rr * Math.cos(a), y, rr * Math.sin(a)];
    T.quad(q(a0, 1.15, 0.8), q(a1, 1.15, 0.8), q(a1, top, 0.94), q(a0, top, 0.94), [-Math.cos(am), 0, -Math.sin(am)], SHELLW);
  }
  return T.at();
}
function leanChairGeo(seat, top) {
  const T = makeThingBuilder();
  for (let i = 0; i < 5; i++) T.at(0, 0, 0, i / 5 * Math.PI * 2).quad([0.1, 0.2, -0.07], [0.95, 0.2, -0.07], [0.95, 0.2, 0.07], [0.1, 0.2, 0.07], [0, 1, 0], STEEL);
  T.at().cyl(0, 0, 0.09, 0.09, 0.1, 1.05, STEEL, 0, 5, 0).cyl(0, 0, 0.72, 0.78, 1.05, 1.3, seat, 0, 8, 3);
  for (let i = 0; i < 3; i++) {
    const a0 = Math.PI * (1.15 + 0.7 * i / 3), a1 = Math.PI * (1.15 + 0.7 * (i + 1) / 3), am = (a0 + a1) / 2, q = (a, y, rr) => [rr * Math.cos(a), y, rr * Math.sin(a)];
    T.quad(q(a0, 1.15, 0.8), q(a1, 1.15, 0.8), q(a1, top, 0.94), q(a0, top, 0.94), [-Math.cos(am), 0, -Math.sin(am)], SHELLW);
  }
  return T.build();
}
// THE COURT BESIDE THE CORRIDOR (round nine), its things: LONG TABLES in two rows down its length (10 m each, an ash
// top on two slabs, two lamps lit warm and a few stacks of paper on each), chairs along both sides of each (their
// places are returned: [x, z, turn, turning]); LAMP STANDARDS down its middle, one to every 14 m (a slim post, a warm
// globe 4.9 m up), A TREE IN A TUB between every two; TREES AND PLANTS IN TUBS along the glass, one to every fourth
// bay, and a small tree in a tub before the far range every 12 m. Nothing of it stands nearer the glass than 0.8 m.
const PAPERW = lin('#f3f1ea'), COURT_LAMPS = { x: -52, z: 15, step: 14 };
function* courtThings(T, r) {
  const seats = [], z1 = GAL.z0, zN = GAL.zN;
  for (const [x, dz] of [[-57.6, 0], [-46.4, 7]]) for (let z = z1 - 8 - dz; z > zN + 6.5; z -= 14) {
    T.at(x, 0, z).box(-1.25, 1.25, 1.71, 1.85, -5, 5, ASH, 0, true).box(-1.0, 1.0, 0, 1.71, -4.4, -4.15, SHELLW).box(-1.0, 1.0, 0, 1.71, 4.15, 4.4, SHELLW);
    for (const lz of [-2.6, 2.6]) {
      T.cyl(0, lz, 0.22, 0.18, 1.85, 1.93, STEEL, 0, 6, 1).cyl(0, lz, 0.04, 0.04, 1.93, 2.7, STEEL, 0, 4, 0).cyl(0, lz, 0.6, 0.3, 2.6, 3.1, WARM, 0.85, 8, 3, WARM, 1);
      T.cyl(0, lz, 1.0, 1.0, 1.85, 1.856, WARM, 0.3, 10, 1);
    }
    for (let i = 0; i < 3; i++) {
      const sx = r.range(-0.7, 0.7), sz = [-4.2, -1.3, 0, 1.3, 4.2][r.int(0, 4)] + r.range(-0.25, 0.25), h = r.range(0.06, 0.42);
      T.box(sx - 0.3, sx + 0.3, 1.85, 1.85 + h, sz - 0.38, sz + 0.38, PAPERW);
    }
    for (const cz of [-3.2, 0, 3.2]) for (const sg of [-1, 1]) if (r.chance(0.86)) seats.push([x + sg * 2.0 + r.range(-0.25, 0.25), z + cz + r.range(-0.3, 0.3), -sg * Math.PI / 2 + r.range(-0.5, 0.5), r.chance(0.16)]);
  }
  yield null;
  for (let k = 0, z = z1 - 4.5; z > zN + 2; z -= 12, k++) {
    // (round ten: none stands at the open loggia's rail: the view lies open; no draw is made for one that is not put)
    if (z < P.LOBBY.glassN + 3) continue;
    const turn = r.range(0, 6.28);
    if (k % 2) addPlant(T.at(-62.9, 0, z, turn, 1.05)); else tubTreeParts(T.at(-62.8, 0, z, turn, 0.64));
  }
  T.at();
  yield null;
  for (let z = COURT_LAMPS.z; z > zN + 3; z -= COURT_LAMPS.step) {
    T.at(COURT_LAMPS.x, 0, z).cyl(0, 0, 0.34, 0.22, 0, 0.16, STEEL, 0, 8, 1).cyl(0, 0, 0.08, 0.06, 0.16, 4.55, STEEL, 0, 6, 0).cyl(0, 0, 0.12, 0.46, 4.5, 4.9, WARM, 1, 8, 2, WARM, 1).cyl(0, 0, 0.46, 0.12, 4.9, 5.3, WARM, 1, 8, 1, WARM, 1);
    if (z - 7 > zN + 3) tubTreeParts(T.at(COURT_LAMPS.x, 0, z - 7, r.range(0, 6.28), 0.8));
  }
  for (let z = z1 - 10; z > zN + 4; z -= 12) tubTreeParts(T.at(-42.4, 0, z, r.range(0, 6.28), 0.6));
  T.at();
  return seats;
}
// THE COURT'S SHELL (round nine): 24 m deep and as long as the glass; no ceiling: over it stands the great hall. Its
// floor; its far side, A RANGE of lit bays 5 m high under 1.9 m of plain wall, to the maze's own height (6.9 m);
// its two end walls to the same height. (round eleven) ONE WALL FOR EVERY EYE: the range stands 6.9 m for an eye in
// the loggia as for one above it; the stand-in for the maze's wall east of the court's north end is gone (the range
// hides that place from every eye under the wall tops, and an eye above sees the maze itself).
// Each face carries its kind (aK): 0 the floor, 1 the range's bays, 1.5 the plain wall over them, 2 an end wall, 4
// the gallery's own glazed side as the court and an eye above see it (seen from its front only: from inside the
// corridor the glass is clear), 5 the eave's top over the glass (an eye above's: it has no under side).
function courtShellGeo() {
  const pos = [], nor = [], kd = [];
  const quad = (v, n, k) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); kd.push(k); } };
  const x0 = -64.5, x1 = x0 + GAL.deep, zs = GAL.z0, zn = GAL.zN - 0.2, R = P.ROOF;
  quad([[x0, 0, zn], [x1, 0, zn], [x1, 0, zs], [x0, 0, zs]], [0, 1, 0], 0);
  quad([[x1, 0, zn], [x1, 0, zs], [x1, 5, zs], [x1, 5, zn]], [-1, 0, 0], 1);
  quad([[x1, 5, zn], [x1, 5, zs], [x1, R, zs], [x1, R, zn]], [-1, 0, 0], 1.5);
  quad([[x0, 0, zn], [x1, 0, zn], [x1, R, zn], [x0, R, zn]], [0, 0, 1], 2);
  quad([[x0, 0, zs], [x1, 0, zs], [x1, R, zs], [x0, R, zs]], [0, 0, -1], 2);
  quad([[x0 + 0.05, 0, zn], [x0 + 0.05, 0, zs], [x0 + 0.05, R, zs], [x0 + 0.05, R, zn]], [1, 0, 0], 4);
  quad([[x0 + 0.05, R, zn], [-63.3, R, zn], [-63.3, R, zs], [x0 + 0.05, R, zs]], [0, -1, 0], 5);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 1));
  return g;
}
const COURT_VERT = /* glsl */`
attribute float aK;
varying vec3 vW; varying vec3 vN; varying float vK;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vK = aK; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE COURT STANDS IN THE GREAT HALL'S NIGHT: light comes only from things: its lamp standards (a warm pool under
// each, swelling a little as the lights' wave passes), the white light that falls out through the gallery's glass,
// the lit rooms of its range (each in one of the floors' colours, about one in six dim; each lays its colour on
// the paving before it), the bracket lamps on its end walls. Between lights the stone is deep blue, never black.
// ROUND ELEVEN B: THE RANGE IS A BUILDING WITH ROOMS, NOT A ROW OF COLOURED CARDS. Each bay of 4 m is glazed between
// its posts, from a sill 0.5 m up to a head at 4.2 m, with one fine mullion and one transom; behind the glass A
// LIT ROOM is seen along the eye's own ray (courtRoom): the wall's reveal in shade, a floor that goes back 4.5 m,
// side walls a tone darker than the back wall, the back wall in the bay's colour, a white ceiling with its light,
// and A FEW SOLID THINGS under the room's lamp (GLSL_ROOMS). The end walls' tall windows are of the same making.
// For an eye too far to tell a room's things, and from behind, a bay is its room's own mean.
const COURT_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vK;
uniform vec3 uPal[8];
${GLSL_WAVE}${GLSL_LIT}${GLSL_NIGHT}${GLSL_ROOMS}${GLSL_BRACKET}
// (a draw between 0 and 1 from one number: our own numbers in the common sine hash's form, a cosine added)
float h1c(float n){ return fract(sin(n * 27.619 + 3.7) * 24634.6345 + cos(n * 41.233) * 7919.137); }
// A LIT ROOM BEHIND A GLAZED OPENING OF THE COURT, seen along the eye's own ray. u, yy: the place on the wall's face,
// across from the opening's middle and over the floor; d: the eye's ray as (across, up, into the room); op: the
// opening's half width, its sill and its head; rm: the room's half width, depth and height; rc: its back wall's
// colour; c2: its cabinet's. Gives the room's shade at that place; emis: the light its things give.
vec3 courtRoom(float u, float yy, vec3 d, vec3 op, vec3 rm, vec3 rc, vec3 c2, float kind, float hand, out vec3 emis){
  float du = d.x, dy = d.y, dw = max(d.z, .04);
  float tb = rm.y / dw, tu = (du > 0. ? rm.x - u : rm.x + u) / max(abs(du), 1e-4), ty = (dy > 0. ? rm.z - yy : yy) / max(abs(dy), 1e-4), t = min(tb, min(tu, ty));
  vec3 q = vec3(u + du * t, yy + dy * t, dw * t), room, lp = roomLight(rm.x, rm.y, kind), glowT;
  float lampG = exp(-((q.x - lp.x * hand) * (q.x - lp.x * hand) + (q.y - lp.y) * (q.y - lp.y) * 1.4 + (q.z - lp.z) * (q.z - lp.z) * .5) / 3.4);
  emis = vec3(0.);
  // (the back wall one plain tone, a shade lighter toward the ceiling; the side walls a tone darker, darker still
  // toward the back; the ceiling white with its slim bar of light; the floor deep)
  if (tb <= min(tu, ty)) room = rc * (.6 + .14 * q.y / rm.z);
  else if (tu < ty) room = mix(rc, vec3(.9, .89, .86), .4) * (.34 + .34 * (1. - q.z / rm.y));
  else if (dy > 0.) {
    // (round eleven c: one slim bar of light, 2.4 m long and 0.4 m broad, from the front toward the back)
    vec2 qc = abs(vec2(q.x, q.z - rm.y * .5)) - vec2(.2, 1.2);
    float cl = 1. - smoothstep(-.05, .05, max(qc.x, qc.y));
    room = mix(mix(rc, vec3(.97), .7) * .8, vec3(1.), cl); emis = vec3(1., .98, .94) * .8 * cl;
  } else room = (rc * .36 + .04) * (.7 + .3 * (1. - q.z / rm.y));
  room *= 1. + vec3(.9, .62, .24) * lampG;
  vec4 th = roomThings(vec3(u * hand, yy, 0.), vec3(du * hand, dy, dw), rm.x, rm.y, t, kind, c2, vec3(1., .93, .8), glowT);
  if (th.w < t) {
    vec3 pt = vec3(u + du * th.w, yy + dy * th.w, dw * th.w) - vec3(lp.x * hand, lp.y, lp.z);
    room = th.rgb * (1. + vec3(.5, .34, .13) * exp(-dot(pt, pt) / 5.)); emis = glowT;
  }
  // (the wall is 0.4 m thick: a ray still inside that depth meets the reveal: a jamb, the head or the sill, in
  // shade, the sill catching a little of the room's light)
  float tj = .4 / dw;
  vec2 qj = vec2(u + du * tj, yy + dy * tj);
  if (abs(qj.x) > op.x || qj.y > op.z || qj.y < op.y) {
    room = vec3(.17, .21, .42) * (abs(qj.x) > op.x ? .7 + .4 * step(0., du * qj.x) : qj.y > op.z ? .6 : 1.25) + rc * (qj.y < op.y ? .12 : .04);
    emis = vec3(0.);
  }
  return room;
}
void main(){
  vec3 toEye = cameraPosition - vW;
  if (vK > 3.5 && dot(vN, toEye) < 0.) discard;
  // (the eave is a top: it is seen from over its own height only; from the lobby and the loggia the ceiling ends in
  // its own beam)
  if (vK > 4.5 && cameraPosition.y < vW.y) discard;
  float fw = max(length(fwidth(vW)), .02), q = ${GAL.z0.toFixed(1)} - vW.z, y = vW.y;
  vec3 LAMPW = vec3(1., .84, .56), col, emis = vec3(0.);
  float dzl = mod(vW.z - ${COURT_LAMPS.z.toFixed(1)} + ${(COURT_LAMPS.step / 2).toFixed(1)}, ${COURT_LAMPS.step.toFixed(1)}) - ${(COURT_LAMPS.step / 2).toFixed(1)}, dxl = vW.x - ${COURT_LAMPS.x.toFixed(1)}, d2 = dxl * dxl + dzl * dzl;
  float wl = (exp(-d2 / 26.) + .35 * exp(-d2 / 160.)) * (.8 + .4 * waveHump(vW.x + vW.z));
  float bay = floor(q / 4.), fb = q - bay * 4., on = step(.17, h1c(bay)), bci = floor(h1c(bay + 57.) * 5.999);
  vec3 bc = uPal[1 + int(bci)], dv = -toEye / max(length(toEye), 1e-3);
  // (how well an eye at this distance tells a room's things: whole within a pixel's reach of 0.6 m, none from 1.8 m;
  // none from behind the wall)
  float vis = clamp(.9 / fw - .5, 0., 1.) * step(0., dot(vN, toEye));
  if (vK < .5) {
    vec2 tj = (.5 - abs(fract(vW.xz / 1.5) - .5)) * 1.5;
    float jt = max(clamp((.03 - tj.x) / fw + .5, 0., 1.), clamp((.03 - tj.y) / fw + .5, 0., 1.)) * clamp(.06 / fw, 0., 1.);
    float gw = exp(-max(vW.x + 64.5, 0.) / 5.), rw = exp(-max(-40.5 - vW.x, 0.) / 4.) * on * (1. - .6 * smoothstep(1.2, 2.2, abs(fb - 2.)));
    col = vec3(.62, .64, .72) * (1. - .2 * jt) * (vec3(.13, .18, .4) + LAMPW * wl + vec3(.8, .86, 1.) * .55 * gw) + bc * .5 * rw;
  } else if (vK < 1.8) {
    float post = 1. - smoothstep(.16, .16 + fw, min(fb, 4. - fb)), pane = step(.5, y) * step(y, 4.2) * (1. - post);
    vec3 wallC = vec3(.2, .26, .5) * mix(.8, 1.05, smoothstep(0., 6.9, y)) + bc * .12 * on * step(4.2, y) * step(y, 5.);
    // (the room's own mean)
    vec3 room = mix(bc, vec3(1., .95, .85), .25) * (.5 + .16 * smoothstep(.5, 4.2, y)) * (.85 + .15 * waveHump(vW.x + vW.z)), em = vec3(0.);
    if (vis > 0. && pane > 0.) {
      float kd = h1c(bay * 3.31 + 11.), kind = kd < .45 ? 0. : kd < .8 ? 1. : 2., hand = h1c(bay * 5.13 + 23.) < .5 ? -1. : 1.;
      vec3 seen = courtRoom(fb - 2., y, vec3(-dv.z, dv.y, dv.x), vec3(1.84, .5, 4.2), vec3(1.92, 4.5, 4.7), bc, mix(uPal[1 + int(mod(bci + 2., 6.))], vec3(.92), .18), kind, hand, em);
      room = mix(room, seen, vis); em *= vis;
    }
    // (one fine mullion and one transom in each bay's glass; a dim bay keeps a sixth of its room's light)
    float bars = max(1. - smoothstep(.035, .035 + fw, abs(fb - 2.)), 1. - smoothstep(.035, .035 + fw, abs(y - 3.3))) * clamp(.1 / fw, 0., 1.), lr = mix(.16, 1., on);
    col = mix(wallC, mix(mix(vec3(.07, .1, .25), room, lr), vec3(.5, .56, .8), bars), pane);
    col = mix(col, vec3(.5, .56, .8), step(4.86, y) * step(y, 5.));
    emis = (em + bc * .1) * lr * pane * (1. - bars);
  } else if (vK < 2.5) {
    // an end wall: a bracket lamp every 6 m, and BETWEEN THE LAMPS A TALL WINDOW (2 m wide, from 0.7 to 5.3 m, one
    // fine mullion and one transom) WITH A LIT ROOM BEHIND IT (round eleven b: as the range's bays; each in one
    // of the floors' colours); a pale sill; a pale cope along the wall's head
    // (the bracket lamp's one law, the part's: an upright soft bar, to 1/e 0.16 m broad and 1 m high either way, in
    // a wash that falls to 1/e 1.2 m to either side and 3.6 m up and down: it reaches the wall's foot)
    float da = vW.x - (floor(vW.x / 6.) + .5) * 6., dy = y - 3.6, gl = bracketWash(da, dy);
    float wi = floor(vW.x / 6. + .5), dw = vW.x - wi * 6., we = floor(vW.z / 50. + .5) * 13., wci = floor(h1c(wi * 3.1 + 57. + we) * 5.999);
    vec3 wc = uPal[1 + int(wci)];
    float inW = (1. - smoothstep(1. - fw, 1. + fw, abs(dw))) * smoothstep(.7 - fw, .7 + fw, y) * (1. - smoothstep(5.3 - fw, 5.3 + fw, y));
    float bars = max(1. - smoothstep(.04, .04 + fw, abs(dw)), 1. - smoothstep(.04, .04 + fw, abs(y - 3.9))) * clamp(.1 / fw, 0., 1.);
    col = vec3(.24, .3, .56) * mix(.8, 1., smoothstep(0., 6.9, y));
    col = mix(col, vec3(.5, .56, .8), max(step(6.76, y), (1. - smoothstep(.06, .06 + fw, abs(y - .62))) * (1. - smoothstep(1.15, 1.15 + fw, abs(dw)))));
    col = mix(col, LAMPW * .92, .7 * gl) + LAMPW * .14 * gl;
    vec3 roomW = mix(wc, vec3(1., .95, .85), .25) * (.5 + .2 * smoothstep(.7, 5.3, y)) * (.85 + .15 * waveHump(vW.x + vW.z)), emW = vec3(0.);
    if (vis > 0. && inW > 0.) {
      float kd = h1c(wi * 7.7 + we + 3.), kind = kd < .45 ? 0. : kd < .8 ? 1. : 2., hand = h1c(wi * 2.9 + we + 31.) < .5 ? -1. : 1.;
      vec3 seen = courtRoom(dw, y, vec3(dv.x, dv.y, -dv.z * vN.z), vec3(1., .7, 5.3), vec3(1.6, 4.5, 5.9), wc, mix(uPal[1 + int(mod(wci + 2., 6.))], vec3(.92), .18), kind, hand, emW);
      roomW = mix(roomW, seen, vis); emW *= vis;
    }
    col = mix(col, mix(roomW, vec3(.62, .66, .8), bars), inW);
    emis = vec3(1., .8, .5) * 1.5 * bracketBar(da, dy) * (1. - inW) + (emW + wc * .1) * inW * (1. - bars);
  } else if (vK < 4.5) {
    // (the lobby's glass in its slim pale posts, then the open loggia with its rail, which has no post: the
    // corridor's lit inside is seen)
    float pit = ${P.LOBBY.bay.toFixed(1)}, fp = q - floor(q / pit) * pit, post = (1. - smoothstep(.04, .04 + fw, min(fp, pit - fp))) * clamp(.1 / fw, 0., 1.) * step(q, ${GAL.glass.toFixed(1)});
    float frame = max(max(post, step(y, .1)), step(6.6, y));
    col = mix(vec3(.9, .89, .85), vec3(.8, .8, .78), frame);
    emis = vec3(1., .97, .9) * .5 * (1. - frame);
  } else col = vec3(.16, .2, .42);
  gl_FragColor = vec4(nightAir(lit3(min(col, vec3(.93))) + emis, cameraPosition, -toEye), 1.);
}`;
function tubTreeParts(T) {
  T.cyl(0, 0, 0.95, 1.1, 0, 1.25, POT, 0, 12, 1, lin('#5a4a3a')).cyl(0, 0, 0.16, 0.12, 1.25, 1.6, lin('#7a6248'), 0, 6, 0);
  return crownOf(T, 0, 0, 1, 1.45, 1);
}
function addTubTree(T, x, z, ry, k) { return tubTreeParts(T.at(x, 0, z, ry, k)).at(); }
// A CLIPPED TREE IN A TUB FOR A NICHE OF THE LOBBY'S RANK (round eleven b): the court's tree brought indoors, its crown
// of three soft tiers drawn out tall and slim (kind 0: to 8.1 m) or kept lower and rounder (kind 1: to 5.9 m); a
// slim pale tub. It stands wholly inside a niche 2.2 m deep.
function nicheTree(T, kind) {
  T.cyl(0, 0, 0.7, 0.82, 0, 1.25, POT, 0, 14, 1, lin('#5a4a3a')).cyl(0, 0, 0.13, 0.1, 1.25, 1.65, lin('#7a6248'), 0, 6, 0);
  return kind ? crownOf(T, 0, 0, 0.7, 1.5, 0.9) : crownOf(T, 0, 0, 0.6, 1.5, 1.35);
}
// A LONG LOW PLANTER OF THE LOBBY WITH ITS BENCHES (see LOBBY_PLANTERS; p: its two ends along x and its z): the
// trough of pale stone on a dark recessed foot; in it a clipped hedge with a row of low clipped rounds along its
// top; along each side, one to a bay of 6 m, a bench without a back: three slats of ash on two steel legs.
function lobbyPlanter(T, p) {
  const hl = (p.x1 - p.x0) / 2, S = PLANTER, LEAF_M = [(LEAF_D[0] + LEAF_L[0]) / 2, (LEAF_D[1] + LEAF_L[1]) / 2, (LEAF_D[2] + LEAF_L[2]) / 2];
  T.at((p.x0 + p.x1) / 2, 0, p.z);
  T.box(-hl + 0.12, hl - 0.12, 0, 0.14, -S.hw + 0.12, S.hw - 0.12, STEEL).box(-hl, hl, 0.14, 1.25, -S.hw, S.hw, POT);
  T.box(-hl + 0.14, hl - 0.14, 1.25, 1.8, -S.hw + 0.14, S.hw - 0.14, LEAF_D);
  for (let x = -hl + 0.75; x < hl - 0.5; x += 1.5) T.lathe(x, 0, [[0.58, 1.75], [0.7, 2.0], [0.6, 2.28], [0.34, 2.46], [0.04, 2.52]], [LEAF_D, LEAF_M, LEAF_L, LEAF_L, LEAF_L], 10);
  for (const sg of [-1, 1]) for (let x = -hl; x < hl - 1; x += 6) {
    const za = sg * (S.hw + S.gap), zs = sg * S.bench / 3;
    for (let i = 0; i < 3; i++) { const a = za + zs * (i + 0.07), b = za + zs * (i + 0.93); T.box(x + 0.5, x + 5.5, 1.0, 1.1, Math.min(a, b), Math.max(a, b), ASH, 0, true); }
    for (const lx of [x + 1.1, x + 4.9]) T.box(lx - 0.06, lx + 0.06, 0, 1.0, Math.min(za, za + 3 * zs) + 0.1, Math.max(za, za + 3 * zs) - 0.1, STEEL);
  }
  return T.at();
}
// THE THING BY A BAY'S MOUTH (round four), at a place of the room's own frame: a tree in a small tub, a standing lamp
// lit warm, or blank boxes stacked
function mouthThing(T, F, kind, x, z, r) {
  if (kind === 0) tubTreeParts(F.at(T, x, 0, z, r.range(0, 6.28), 0.5));
  else if (kind === 1) F.at(T, x, 0, z).cyl(0, 0, 0.45, 0.3, 0, 0.12, STEEL, 0, 10, 1).cyl(0, 0, 0.06, 0.06, 0.12, 3.4, STEEL, 0, 6, 0).cyl(0, 0, 0.62, 0.42, 3.3, 4.05, WARM, 0.75, 10, 3, WARM, 1);
  else {
    F.at(T, x, 0, z, r.range(-0.3, 0.3)).box(-0.62, 0.62, 0, 0.85, -0.5, 0.5, CARD);
    F.at(T, x, 0.85, z, r.range(-0.5, 0.5)).box(-0.5, 0.5, 0, 0.7, -0.42, 0.42, CARD_D);
    F.at(T, x, 1.55, z, r.range(-0.5, 0.5)).box(-0.4, 0.4, 0, 0.55, -0.36, 0.36, CARD);
  }
  return T.at();
}
// ---------------------------------------------------------------- the rooms of too many things
// A room's own frame: its middle on the front plane is the origin, x runs along the wall, z into the room. `at` sets a
// builder to a place of the room, `mat` gives an instance's matrix there.
function roomFrame(f, side, d0, off) {
  const cs = side * f[2], sn = -side * f[3], ox = f[0] + f[2] * off - f[3] * side * d0, oz = f[1] + f[3] * off + f[2] * side * d0, ry = Math.atan2(sn, cs);
  const wx = (x, z) => ox + x * cs + z * sn, wz = (x, z) => oz - x * sn + z * cs, e = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3(), k = new THREE.Vector3();
  return {
    at: (T, x = 0, y = 0, z = 0, turn = 0, size = 1) => T.at(wx(x, z), y, wz(x, z), ry + turn, size),
    chair: (T, x, z, turn = 0) => addChair(T, wx(x, z), wz(x, z), ry + turn),
    mat: (x, y, z, turn = 0, size = 1) => new THREE.Matrix4().compose(v.set(wx(x, z), y, wz(x, z)), q.setFromEuler(e.set(0, ry + turn, 0)), k.set(size, size, size)),
  };
}
const CLOCK_DARK = lin('#2b3038'), CLOCK_RED = lin('#d8452f');
// a clock's face (looking along -z), a hand (pointing up, turning about z), a drawer (its front at z 0, its body behind),
// a clump of leaves, a desk lamp that nods, a blank sheet
function partsGeo() {
  const face = makeThingBuilder(), hand = makeThingBuilder(), drawer = makeThingBuilder(), blob = makeThingBuilder(), lamp = makeThingBuilder(), sheet = makeThingBuilder();
  for (let i = 0; i < 20; i++) {
    const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2, q = (a, r, z) => [r * Math.cos(a), r * Math.sin(a), z];
    face.tri([0, 0, -0.06], q(a0, 0.9, -0.06), q(a1, 0.9, -0.06), [0, 0, -1], SHELLW);
    face.quad(q(a0, 0.9, -0.07), q(a1, 0.9, -0.07), q(a1, 1, -0.07), q(a0, 1, -0.07), [0, 0, -1], CLOCK_DARK);
    face.quad(q(a0, 1, -0.07), q(a1, 1, -0.07), q(a1, 1, 0), q(a0, 1, 0), [Math.cos(a0), Math.sin(a0), 0], CLOCK_DARK);
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), w = 0.025; face.quad([c * 0.7 - sn * w, sn * 0.7 + c * w, -0.065], [c * 0.7 + sn * w, sn * 0.7 - c * w, -0.065], [c * 0.82 + sn * w, sn * 0.82 - c * w, -0.065], [c * 0.82 - sn * w, sn * 0.82 + c * w, -0.065], [0, 0, -1], CLOCK_DARK); }
  hand.quad([-0.5, -0.12, 0], [0.5, -0.12, 0], [0.5, 1, 0], [-0.5, 1, 0], [0, 0, -1], [1, 1, 1]);
  drawer.box(-0.37, 0.37, -0.27, 0.27, 0, 0.95, lin('#e4e6e6'), 0, true).box(-0.14, 0.14, -0.03, 0.03, -0.06, 0, lin('#6d747c'));
  blob.cyl(0, 0, 0.15, 1, -0.6, 0, [1, 1, 1], 0, 7, 0).cyl(0, 0, 1, 0.1, 0, 0.6, [1, 1, 1], 0, 7, 0);
  lamp.cyl(0, 0, 0.16, 0.14, 0, 0.06, STEEL, 0, 8, 1).box(-0.025, 0.025, 0.06, 0.95, -0.025, 0.025, STEEL).box(-0.025, 0.025, 0.9, 0.95, -0.45, 0.025, STEEL);
  lamp.cyl(0, -0.45, 0.24, 0.08, 0.72, 0.95, WARM, 0.75, 8, 2, WARM, 1);
  sheet.quad([-0.28, 0, -0.375], [0.28, 0, -0.375], [0.28, 0, 0.375], [-0.28, 0, 0.375], [0, 1, 0], [0.97, 0.97, 0.95]);
  return { face: face.build(), hand: hand.build(), drawer: drawer.build(), blob: blob.build(), lamp: lamp.build(), sheet: sheet.build() };
}
// what each room holds: [name, width along the wall, depth, height]. A maker adds its still things to T and its moving
// ones to M (lists by kind of part); F is the room's frame, r its stream.
const ROOMS = [
  ['clocks', 18, 7, 9.6, (T, M, F, r, W, D, Hh) => {
    // about ninety round clocks of five sizes on the back wall, no numerals, every second hand sweeping, each at its own hour
    const cols = 13, rows = 7, cw = (W - 0.6) / cols, ch = (Hh - 0.7) / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const rad = [0.55, 0.66, 0.78, 0.9, 1][r.int(0, 4)] * 0.47 * Math.min(cw, ch), x = -W / 2 + 0.3 + (i + 0.5) * cw + r.range(-0.5, 0.5) * (cw - 2 * rad), y = 0.4 + (j + 0.5) * ch + r.range(-0.5, 0.5) * (ch - 2 * rad);
      M.face.push({ m: F.mat(x, y, D - 0.02, 0, rad) });
      const hr = r.range(0, 6.283), mn = r.range(0, 6.283), z = D - 0.1;
      M.hand.push({ m: F.mat(x, y, z, 0, rad), move: [3, 0, hr, 50.16], col: CLOCK_DARK }, { m: F.mat(x, y, z - 0.01, 0, rad), move: [3, 0, mn, 75.11], col: CLOCK_DARK });
      M.hand.push({ m: F.mat(x, y, z - 0.02, 0, rad), move: [3, -Math.PI * 2 / 60, r.range(0, 6.283), 84.05], col: CLOCK_RED });
    }
  }],
  ['drawers', 18, 6, 9.6, (T, M, F, r, W, D, Hh) => {
    // a wall of filing cabinets 16 m wide and 9 m high: 300 fronts, sliding out and in by 0.9 m in a wave across the wall
    const dark = lin('#39414a');
    F.at(T, 0, 0, D - 0.5).box(-8.1, 8.1, 0, 9.15, -0.02, 0.5, dark);
    F.at(T, 0, 0, D - 0.5).box(-8.3, 8.3, 9.15, 9.3, -0.4, 0.5, SHELLW).box(-8.3, -8.1, 0, 9.15, -0.4, 0.5, SHELLW).box(8.1, 8.3, 0, 9.15, -0.4, 0.5, SHELLW);
    const kx = r.range(0.03, 0.05) * (r.chance(0.5) ? 1 : -1), ky = r.range(0.02, 0.04);
    for (let j = 0; j < 15; j++) for (let i = 0; i < 20; i++) M.drawer.push({ m: F.mat(-7.6 + i * 0.8, 0.35 + j * 0.6, D - 0.55), move: [2, 7, i * kx + j * ky + 10, -0.9] });
  }],
  ['tree', 16, 16, 11, (T, M, F, r, W, D, Hh) => {
    // one tree 8 m tall in a round white tub under the room's slots of light, its leaves stirring
    const bark = lin('#7a6248'), zc = D / 2;
    F.at(T, 0, 0, zc).cyl(0, 0, 1.7, 1.9, 0, 1.2, POT, 0, 16, 1, lin('#5a4a3a')).cyl(0, 0, 0.42, 0.26, 1.2, 4.6, bark, 0, 8, 0);
    for (const [a, len] of [[0.4, 2.4], [2.5, 2.2], [4.4, 2.6]]) F.at(T, 0, 0, zc, a).quad([-0.12, 3.6, 0], [0.12, 3.6, 0], [0.1, 3.6 + len * 0.8, len * 0.6], [-0.1, 3.6 + len * 0.8, len * 0.6], [0, 0.6, -0.8], bark);
    const dk = lin('#2f7a4a');
    for (const [x, y, z, k] of [[0, 6.6, 0, 2.2], [1.6, 5.6, 0.6, 1.6], [-1.5, 5.4, -0.8, 1.7], [0.3, 5.2, -1.7, 1.5], [-0.4, 5.6, 1.7, 1.5], [0.2, 7.6, 0.1, 1.3], [1.3, 6.9, -1.0, 1.2], [-1.3, 6.8, 0.9, 1.2]]) {
      M.blob.push({ m: F.mat(x, y, zc + z, r.range(0, 6), k), move: [6, r.range(0.5, 0.9), r.range(0, 6.283), 0.05], col: r.chance(0.5) ? LEAF : dk });
    }
  }],
  ['chairs', 18, 23, 6.4, (T, M, F, r, W, D, Hh) => {
    // eighty swivel chairs in exact rows, every chair turning slowly, the turning passing through the rows as a wave
    const rate = r.range(0.4, 0.6) * (r.chance(0.5) ? 1 : -1), kx = r.range(0.4, 0.7), kz = r.range(0.4, 0.7);
    for (let j = 0; j < 10; j++) for (let i = 0; i < 8; i++) M.chair.push({ m: F.mat(-7.525 + i * 2.15, 0, 1.6 + j * 2.15), move: [1, rate, i * kx + j * kz, 0] });
  }],
  ['lamps', 16, 7, 6.4, (T, M, F, r, W, D, Hh) => {
    // sixty desk lamps on one long table, nodding up and down in a wave
    F.at(T, 0, 0, 3.4).box(-7.2, 7.2, 1.71, 1.85, -1.1, 1.1, ASH, 0, true);
    for (const x of [-6.6, -2.2, 2.2, 6.6]) F.at(T, x, 0, 3.4).box(-0.08, 0.08, 0, 1.71, -0.9, 0.9, SHELLW);
    const k = r.range(0.16, 0.24), rate = r.range(1.1, 1.5);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 30; i++) M.lamp.push({ m: F.mat(-6.74 + i * 0.465, 1.85, 3.4 + (j ? 0.55 : -0.55), j ? Math.PI : 0, 1.25), move: [4, rate, -i * k + j * 1.3, 0.06] });
  }],
  ['paper', 14, 9, 6.4, (T, M, F, r, W, D, Hh) => {
    // blank white paper in exact piles stacked toward the ceiling, the top sheets lifting and settling
    const side = [0.84, 0.84, 0.82], kx = r.range(0.05, 0.09), kz = r.range(0.07, 0.12);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 16; i++) {
      const x = -6.375 + i * 0.85, z = 1.0 + j * 0.9, h = Math.min(1.1 + (Hh - 1.5) * j / 8 + r.range(-0.12, 0.12), Hh - 0.25);
      F.at(T, x, 0, z).box(-0.28, 0.28, 0, h, -0.375, 0.375, side);
      M.sheet.push({ m: F.mat(x, h + 0.012, z), move: [5, 6, i * kx + j * kz + 10, 0.55] });
    }
  }],
];

// AN ORDINARY ROOM holds one plain thing (9 m wide, 9 m deep): a table and two chairs, a plant, a coat stand with
// nothing on it. F is the room's frame, r the stream that deals.
const CARD = lin('#dcd8ce'), CARD_D = lin('#c4c0b6');
function plainThing(T, F, kind, r, D) {
  const k = D / 9;
  // (round eight: no file storage and no stacked boxes: a table where the cabinets stood, a plant where the boxes)
  if (kind === 1) kind = 0; else if (kind === 4) kind = 2;
  if (kind === 0) {
    F.at(T, 0, 0, 4.6 * k).box(-1.8, 1.8, 1.71, 1.85, -1.0, 1.0, ASH, 0, true).box(-1.65, -1.55, 0, 1.71, -0.85, 0.85, SHELLW).box(1.55, 1.65, 0, 1.71, -0.85, 0.85, SHELLW);
    F.chair(T, -0.5, 4.6 * k - 1.7, r.range(-0.5, 0.5)); F.chair(T, 0.5, 4.6 * k + 1.7, Math.PI + r.range(-0.5, 0.5));
  } else if (kind === 1) {
    const n = r.int(3, 5);
    for (let i = 0; i < n; i++) addCabinet(F.at(T, (i - (n - 1) / 2) * 1.42, 0, D - 0.9, Math.PI));
  } else if (kind === 2) {
    addPlant(F.at(T, r.range(-1.5, 1.5), 0, r.range(4, 6) * k, r.range(0, 6), 1.3));
  } else if (kind === 3) {
    const x = r.range(-2, 2), z = r.range(4, 6.5) * k;
    F.at(T, x, 0, z).cyl(0, 0, 0.62, 0.5, 0, 0.12, STEEL, 0, 12, 1).cyl(0, 0, 0.07, 0.07, 0.12, 4.3, STEEL, 0, 6, 1).cyl(0, 0, 0.16, 0.16, 4.3, 4.5, STEEL, 0, 8, 3);
    for (let i = 0; i < 6; i++) F.at(T, x, 0, z, i / 6 * Math.PI * 2).box(0.05, 0.62, 3.78, 3.86, -0.035, 0.035, STEEL, 0, true).box(0.55, 0.62, 3.86, 4.08, -0.035, 0.035, STEEL);
  } else {
    const n = r.int(2, 3);
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 2.1 + r.range(-0.15, 0.15), z = (5 + r.range(-0.6, 0.6)) * k, hi = r.int(1, 3);
      let y = 0;
      for (let j = 0; j < hi; j++) {
        const w = r.range(0.75, 0.95) - j * 0.08, h = r.range(1.0, 1.5);
        F.at(T, x, y, z, r.range(-0.25, 0.25)).box(-w, w, 0, h, -w * 0.8, w * 0.8, j % 2 ? CARD_D : CARD).box(-0.09, 0.09, h, h + 0.012, -w * 0.8, w * 0.8, lin('#f0ece2'));
        y += h;
      }
    }
  }
  T.at();
}
// A ROOM BEHIND A DOOR OF THE FLOWN CORRIDOR OR OF THE LINK IS FURNISHED (round eleven b: NO SHELF, NO BOARD ON A
// WALL, nothing that carries rows of small things), so that through its open door a lit room is seen and never a
// flat sheet of colour: A DESK across its middle with A LAMP LIT WARM on it (where the shader's light for the room
// stands: a metre toward the south of its middle) and a chair behind it; A CLIPPED TREE IN A TUB near the door, by
// the side wall that an eye coming up the corridor sees first; A LOW CABINET with plain doors along the back wall
// in the room's second colour (c2), its top pale; A STANDING LAMP LIT WARM in the far corner. side: the wall's
// hand (the room's own x runs north on a right-hand wall, south on a left-hand one).
function furnishRoom(T, F, r, w, D, side, c2) {
  const hw = w / 2, lx = -side;
  F.at(T, 0, 0, D * 0.5).box(-1.6, 1.6, 1.71, 1.85, -0.9, 0.9, ASH, 0, true).box(-1.5, -1.4, 0, 1.71, -0.8, 0.8, SHELLW).box(1.4, 1.5, 0, 1.71, -0.8, 0.8, SHELLW);
  T.cyl(lx, 0.3, 0.22, 0.18, 1.85, 1.93, STEEL, 0, 8, 1).cyl(lx, 0.3, 0.04, 0.04, 1.93, 2.7, STEEL, 0, 4, 0).cyl(lx, 0.3, 0.6, 0.3, 2.6, 3.1, WARM, 0.85, 10, 3, WARM, 1);
  F.chair(T, -0.3 * lx, D * 0.5 + 1.7, Math.PI + r.range(-0.4, 0.4));
  tubTreeParts(F.at(T, side * (hw - 1.15), 0, 1.7, r.range(0, 6.28), 0.55));
  // (the cabinet: a body in the second colour on a dark plinth, three plain doors, a pale top)
  F.at(T, -side * (hw - 1.9), 0, D - 0.5).box(-1.6, 1.6, 0.12, 1.5, -0.42, 0.42, c2).box(-1.56, 1.56, 0, 0.12, -0.36, 0.36, STEEL).box(-1.66, 1.66, 1.5, 1.58, -0.46, 0.46, ASH, 0, true);
  for (const x of [-1.07, 0, 1.07]) T.box(x - 0.5, x + 0.5, 0.2, 1.42, -0.44, -0.42, [c2[0] * 0.88, c2[1] * 0.88, c2[2] * 0.88]);
  F.at(T, side * (hw - 0.95), 0, D - 1.05).cyl(0, 0, 0.42, 0.3, 0, 0.1, STEEL, 0, 10, 1).cyl(0, 0, 0.05, 0.05, 0.1, 2.9, STEEL, 0, 6, 0).cyl(0, 0, 0.58, 0.38, 2.85, 3.5, WARM, 0.8, 10, 3, WARM, 1);
  T.at();
}
// A WALL NICHE (4.2 m wide, 5 m high, 1.6 m deep) holds ONE LARGE THING that is named at a glance: a tree in a tub, a
// drinking fountain, a wall clock 2.4 m across (hands and ticks, no numerals), a bench, a stack of chairs, a cart of
// blank paper, a fire-hose reel (no letters). z runs from the niche's front (0) to its back (D).
const RED = lin('#d8452f'), HOSE = lin('#e9dfc8'), HOSE_D = lin('#d3c6a8'), WATER = lin('#bfe3f2');
function nicheThing(T, M, F, kind, r, D) {
  if (kind === 0) {
    F.at(T, 0, 0, D * 0.5, r.range(0, 6)).cyl(0, 0, 0.62, 0.74, 0, 1.05, POT, 0, 14, 1, lin('#5a4a3a')).cyl(0, 0, 0.1, 0.07, 1.05, 1.5, lin('#7a6248'), 0, 6, 0);
    crownOf(T, 0, 0, 0.55, 1.3, 0.68);
  } else if (kind === 1) {
    // a tall back panel, a round bowl on a pedestal, a bent spout and its arc of water
    F.at(T, 0, 0, D - 0.06).box(-1.2, 1.2, 0, 3.4, -0.06, 0.04, lin('#cfd6dc'));
    F.at(T, 0, 0, D - 0.75).cyl(0, 0, 0.3, 0.36, 0, 1.55, SHELLW, 0, 12, 0).cyl(0, 0, 0.36, 0.95, 1.55, 2.05, SHELLW, 0, 16, 0).cyl(0, 0, 0.88, 0.88, 1.98, 2.0, lin('#eef3f6'), 0, 16, 1);
    T.box(-0.05, 0.05, 2.0, 2.75, 0.5, 0.6, STEEL).box(-0.05, 0.05, 2.65, 2.75, 0.05, 0.6, STEEL);
    for (let i = 0; i < 5; i++) { const z0 = 0.05 - i * 0.13, z1 = z0 - 0.13, y0 = 2.7 - i * i * 0.028, y1 = 2.7 - (i + 1) * (i + 1) * 0.028; T.quad([-0.035, y0, z0], [0.035, y0, z0], [0.035, y1, z1], [-0.035, y1, z1], [0, 0.5, -0.8], WATER, 0.3); }
  } else if (kind === 2) {
    const hr = r.range(0, 6.283), mn = r.range(0, 6.283), y = 2.9;
    M.face.push({ m: F.mat(0, y, D - 0.02, 0, 1.2) });
    M.hand.push({ m: F.mat(0, y, D - 0.11, 0, 1.2), move: [3, 0, hr, 50.16], col: CLOCK_DARK }, { m: F.mat(0, y, D - 0.12, 0, 1.2), move: [3, 0, mn, 75.11], col: CLOCK_DARK });
    M.hand.push({ m: F.mat(0, y, D - 0.13, 0, 1.2), move: [3, -Math.PI * 2 / 60, r.range(0, 6.283), 84.05], col: CLOCK_RED });
  } else if (kind === 3) {
    // a bench 3.6 m long: slats of ash on steel legs, a back
    F.at(T, 0, 0, D * 0.55);
    for (let i = 0; i < 4; i++) T.box(-1.8, 1.8, 1.05, 1.13, -0.5 + i * 0.27, -0.3 + i * 0.27, ASH, 0, true);
    for (let i = 0; i < 3; i++) T.box(-1.8, 1.8, 1.5 + i * 0.3, 1.72 + i * 0.3, 0.52, 0.6, ASH, 0, true);
    for (const x of [-1.5, 1.5]) T.box(x - 0.06, x + 0.06, 0, 1.05, -0.45, 0.5, STEEL).box(x - 0.06, x + 0.06, 1.05, 2.35, 0.44, 0.52, STEEL);
  } else if (kind === 4) {
    // seven shells one in another on four legs, 3.9 m
    F.at(T, 0, 0, D * 0.52, r.range(-0.2, 0.2));
    for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]]) T.box(x - 0.05, x + 0.05, 0, 1.1, z - 0.05, z + 0.05, STEEL);
    for (let i = 0; i < 7; i++) {
      const y = 1.1 + i * 0.3, k = i % 2 ? TEAL : lin('#3d8088');
      T.box(-0.7, 0.7, y, y + 0.1, -0.6, 0.6, k, 0, true).box(-0.7, 0.7, y + 0.1, y + 1.0, 0.5 + i * 0.012, 0.6 + i * 0.012, k);
    }
  } else if (kind === 5) {
    // a cart 3 m long: two shelves of reams, a push bar, four wheels
    F.at(T, 0, 0, D * 0.52);
    T.box(-1.5, 1.5, 0.45, 0.55, -0.6, 0.6, STEEL, 0, true).box(-1.5, 1.5, 1.75, 1.85, -0.6, 0.6, STEEL, 0, true);
    for (const x of [-1.46, 1.46]) for (const z of [-0.56, 0.56]) T.box(x - 0.04, x + 0.04, 0.3, 2.9, z - 0.04, z + 0.04, STEEL);
    T.box(-1.5, 1.5, 2.82, 2.9, -0.6, -0.52, STEEL, 0, true);
    for (const x of [-1.2, 1.2]) for (const z of [-0.45, 0.45]) T.cyl(x, z, 0.16, 0.16, 0, 0.3, CLOCK_DARK, 0, 8, 1);
    for (const y of [0.55, 1.85]) for (let i = 0; i < 4; i++) T.box(-1.36 + i * 0.7, -0.76 + i * 0.7, y, y + r.range(0.45, y > 1 ? 0.9 : 1.1), -0.45, 0.45, [0.95, 0.95, 0.92]);
  } else {
    // a square red cabinet on the back wall, in it a steel reel 2.4 m across with four spokes and the hose coiled on it,
    // the hose's end hanging with its nozzle
    const q = (a, rad, z) => [rad * Math.cos(a), 2.9 + rad * Math.sin(a), z], n = [0, 0, -1];
    F.at(T, 0, 0, D - 0.02);
    T.box(-1.5, 1.5, 1.4, 4.4, -0.1, 0, RED).box(-1.5, -1.38, 1.4, 4.4, -0.5, -0.1, RED).box(1.38, 1.5, 1.4, 4.4, -0.5, -0.1, RED).box(-1.5, 1.5, 4.28, 4.4, -0.5, -0.1, RED).box(-1.5, 1.5, 1.4, 1.52, -0.5, -0.1, RED);
    for (let i = 0; i < 24; i++) {
      const a0 = i / 24 * Math.PI * 2, a1 = (i + 1) / 24 * Math.PI * 2;
      T.quad(q(a0, 1.2, -0.4), q(a1, 1.2, -0.4), q(a1, 1.2, -0.12), q(a0, 1.2, -0.12), [Math.cos(a0), Math.sin(a0), 0], STEEL);
      for (let j = 0; j < 4; j++) T.quad(q(a0, 0.4 + j * 0.2, -0.36), q(a1, 0.4 + j * 0.2, -0.36), q(a1, 0.585 + j * 0.2, -0.36), q(a0, 0.585 + j * 0.2, -0.36), n, HOSE);
      for (let j = 0; j < 4; j++) T.quad(q(a0, 0.585 + j * 0.2, -0.355), q(a1, 0.585 + j * 0.2, -0.355), q(a1, 0.6 + j * 0.2, -0.355), q(a0, 0.6 + j * 0.2, -0.355), n, HOSE_D);
      T.tri([0, 2.9, -0.42], q(a0, 0.4, -0.42), q(a1, 0.4, -0.42), n, STEEL);
    }
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.4, c = Math.cos(a), sn = Math.sin(a), w = 0.07;
      T.quad([-sn * w, 2.9 + c * w, -0.43], [sn * w, 2.9 - c * w, -0.43], [c * 1.2 + sn * w, 2.9 + sn * 1.2 - c * w, -0.43], [c * 1.2 - sn * w, 2.9 + sn * 1.2 + c * w, -0.43], n, STEEL);
    }
    T.box(1.02, 1.14, 0.75, 2.6, -0.5, -0.4, HOSE).box(1.0, 1.16, 0.45, 0.75, -0.52, -0.38, STEEL);
  }
  T.at();
}

// ---------------------------------------------------------------- THE WELL OF STOREYS (round ten)
// WHERE HALL ONE STOOD: a round well through the storeys (the part's P.SHAFT). The galleries' floors from the lowest
// up, each [the floor's height, the storey's height]: eighteen under the floor's own, 5 m apart; the floor's own
// storey, 10 m high; six over it. Each gallery is a slab 6 m deep, 0.6 m thick at the wall and 0.3 m at its rim
// (a thin edge in its carpet's colour), a glass rail at its rim, and a back wall of lit rooms (the shader's: see WELL_FRAG).
// (round eleven c: A TIER'S FRONT IS A THIN EDGE: the slab is WELL_LIP thick at the wall and WELL_EDGE at its rim, its
// under side rising gently toward the rim)
const SH = P.SHAFT, WELL_LIP = 0.6, WELL_EDGE = 0.3, WELL_BAYS = 48;
const WELL_ST = (() => { const out = []; for (let k = -SH.below; k <= SH.above; k++) out.push([k <= 0 ? 5 * k : 5 + 5 * k, k === 0 ? 10 : 5]); return out; })();
// THE TWO PORTALS: the corridor and the link each run on through the floor's own gallery as a white portal block to
// a flat face at the well's rim (the block's outer corner on the well's side stands on the rim itself): the south
// face's z and the north face's; the bridge runs from face to face
const GATE = { s: SH.z + Math.sqrt(SH.r * SH.r - (SH.x + 72.5) ** 2), n: SH.z - Math.sqrt(SH.r * SH.r - (SH.x + 76) ** 2) };
// (the angles about the well's axis between which the floor's own back wall stands open for a portal's block)
const wellAng = (x, r, north) => (north ? -1 : 1) * Math.acos((x - SH.x) / r);
function makeWellBuilder() {
  const pos = [], nor = [], kd = [], sv = [];
  const W = {
    // k: the kind (see WELL_FRAG); s: two numbers of the face's own (a gallery's: its floor's height and its storey's)
    quad(v, n, k, s = [0, 5]) {
      for (const i of [0, 1, 2, 0, 2, 3]) { const m = Array.isArray(n[0]) ? n[i] : n, e = Array.isArray(s[0]) ? s[i] : s; pos.push(v[i][0], v[i][1], v[i][2]); nor.push(m[0], m[1], m[2]); kd.push(k); sv.push(e[0], e[1]); }
    },
    tri(v, n, k, s = [0, 5]) { for (let i = 0; i < 3; i++) { pos.push(v[i][0], v[i][1], v[i][2]); nor.push(n[0], n[1], n[2]); kd.push(k); sv.push(s[0], s[1]); } },
    // an upright round piece about (x, z): radius r0 at y0, r1 at y1
    cyl(x, z, r0, r1, y0, y1, n, k, s) {
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        W.quad([[x + r0 * c0, y0, z + r0 * s0], [x + r0 * c1, y0, z + r0 * s1], [x + r1 * c1, y1, z + r1 * s1], [x + r1 * c0, y1, z + r1 * s0]], [[c0, 0, s0], [c1, 0, s1], [c1, 0, s1], [c0, 0, s0]], k, s);
      }
    },
    get triangles() { return pos.length / 9; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 1)); g.setAttribute('aV', new THREE.Float32BufferAttribute(sv, 2));
      return g;
    },
  };
  return W;
}
// the pieces [a0, a1] of a ring cut into n, with the ends of every gap among its cuts and the gaps left out
function ringPieces(n, gaps = []) {
  const set = [];
  for (let i = 0; i < n; i++) set.push(-Math.PI + i / n * Math.PI * 2);
  for (const g of gaps) set.push(g[0], g[1]);
  set.sort((a, b) => a - b); set.push(set[0] + Math.PI * 2);
  const out = [];
  for (let i = 0; i < set.length - 1; i++) { const a0 = set[i], a1 = set[i + 1], m = (a0 + a1) / 2; if (a1 - a0 > 1e-6 && !gaps.some((g) => m > g[0] && m < g[1])) out.push([a0, a1]); }
  return out;
}
const wellPt = (r, y, a) => [SH.x + r * Math.cos(a), y, SH.z + r * Math.sin(a)];
// THE WELL'S SHELL in stages (one storey to a stage): every gallery's floor, lip, under side and back wall; the round
// ceiling; the floor of haze far below; the bridge, the spur, the hanging platform and its four rods. (No lift.)
// Kinds: 0 a gallery's floor, 1 a lip (a slab's thin edge; an edge beam's side with its line of light), 2 a slab's under side, 3 a
// back wall, 4 the well's ceiling, 5 the haze below, 7 the platform's top, 8 a plain white body, 9 a rod. (The
// bridge's deck and the spur's are glass: the rails' mesh's.)
function* wellShellStages(W) {
  const R0 = SH.r, R1 = SH.r + SH.deep, all = ringPieces(72);
  const gaps = [[wellAng(-63.5, R1, false), wellAng(-72.5, R1, false)], [wellAng(-76, R1, true), wellAng(-60, R1, true)]], own = ringPieces(72, gaps);
  for (let k = 0; k < WELL_ST.length; k++) {
    const [y, h] = WELL_ST[k], s = [y, h], top = k === WELL_ST.length - 1;
    for (const [a0, a1] of all) {
      const am = (a0 + a1) / 2, inw = [-Math.cos(am), 0, -Math.sin(am)];
      W.quad([wellPt(R0, y, a0), wellPt(R0, y, a1), wellPt(R1, y, a1), wellPt(R1, y, a0)], [0, 1, 0], 0, s);
      W.quad([wellPt(R0, y - WELL_EDGE, a0), wellPt(R0, y - WELL_EDGE, a1), wellPt(R0, y, a1), wellPt(R0, y, a0)], inw, 1, s);
      if (k > 0) W.quad([wellPt(R0, y - WELL_EDGE, a0), wellPt(R0, y - WELL_EDGE, a1), wellPt(R1, y - WELL_LIP, a1), wellPt(R1, y - WELL_LIP, a0)], [0, -1, 0], 2, s);
    }
    for (const [a0, a1] of (y === 0 ? own : all)) {
      const am = (a0 + a1) / 2, inw = [-Math.cos(am), 0, -Math.sin(am)], yt = top ? SH.top : y + h - WELL_LIP;
      W.quad([wellPt(R1, y, a0), wellPt(R1, y, a1), wellPt(R1, yt, a1), wellPt(R1, yt, a0)], inw, 3, s);
    }
    if (k % 4 === 3) yield null;
  }
  for (const [a0, a1] of all) {
    W.tri([[SH.x, SH.top, SH.z], wellPt(R1, SH.top, a1), wellPt(R1, SH.top, a0)], [0, -1, 0], 4);
    W.tri([[SH.x, -96, SH.z], wellPt(R1, -96, a0), wellPt(R1, -96, a1)], [0, 1, 0], 5);
  }
  yield null;
  // THE BRIDGE (round eleven: ITS DECK IS GLASS, the rails' mesh's own: see wellRailsGeo): 6 m wide along the line
  // from face to face, its top 3 cm over the galleries' floor. Here stand its two slim white edge beams (0.3 m broad,
  // 0.5 m deep), each with its line of light; between them nothing but the glass and its ribs, and the galleries
  // below are seen through it
  const xa = -71, xb = -65, zn = GATE.n, zs = GATE.s, yd = 0.03;
  for (const [x, nx] of [[xa, -1], [xb, 1]]) {
    const xi = x - nx * 0.3;
    W.quad([[x, yd - 0.5, zn], [x, yd - 0.5, zs], [x, yd, zs], [x, yd, zn]], [nx, 0, 0], 1, [yd + 0.1, 6]);
    W.quad([[xi, yd - 0.5, zn], [xi, yd - 0.5, zs], [xi, yd, zs], [xi, yd, zn]], [-nx, 0, 0], 8);
    W.quad([[x, yd - 0.5, zn], [x, yd - 0.5, zs], [xi, yd - 0.5, zs], [xi, yd - 0.5, zn]], [0, -1, 0], 8);
  }
  // THE SPUR to the platform, 3.2 m wide, from the bridge's west edge to the platform's rim: glass too, between two
  // edge beams of the same make
  const sx0 = SH.x + SH.plat - 0.25, sz0 = SH.z - 1.6, sz1 = SH.z + 1.6;
  for (const [z, nz] of [[sz0, -1], [sz1, 1]]) {
    const zi = z - nz * 0.3;
    W.quad([[sx0, yd - 0.5, z], [xa, yd - 0.5, z], [xa, yd, z], [sx0, yd, z]], [0, 0, nz], 1, [yd + 0.1, 6]);
    W.quad([[sx0, yd - 0.5, zi], [xa, yd - 0.5, zi], [xa, yd, zi], [sx0, yd, zi]], [0, 0, -nz], 8);
    W.quad([[sx0, yd - 0.5, z], [xa, yd - 0.5, z], [xa, yd - 0.5, zi], [sx0, yd - 0.5, zi]], [0, -1, 0], 8);
  }
  yield null;
  // THE PLATFORM: a round deck 18 m across at the well's axis, its top level with the galleries' floor; a lip with
  // its line of light; a shallow dish under it; FOUR SLIM RODS carry it from the ceiling
  const RP = SH.plat, pp = (r, y, a) => [SH.x + r * Math.cos(a), y, SH.z + r * Math.sin(a)];
  for (let i = 0; i < 48; i++) {
    const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2, am = (a0 + a1) / 2, out = [Math.cos(am), 0, Math.sin(am)];
    W.tri([[SH.x, 0, SH.z], pp(RP, 0, a1), pp(RP, 0, a0)], [0, 1, 0], 7);
    W.quad([pp(RP, -0.6, a0), pp(RP, -0.6, a1), pp(RP, 0, a1), pp(RP, 0, a0)], out, 1, [0.1, 6]);
    W.quad([pp(RP, -0.6, a0), pp(RP, -0.6, a1), pp(1.2, -2.2, a1), pp(1.2, -2.2, a0)], [out[0] * 0.2, -0.98, out[2] * 0.2], 8);
  }
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; W.cyl(SH.x + (RP - 0.45) * Math.cos(a), SH.z + (RP - 0.45) * Math.sin(a), 0.09, 0.09, 0, SH.top, 6, 9); }
  return W;
}
// THE GLASS RAILS (1.5 m): round every gallery's rim, along both edges of the bridge and of the spur, round the
// platform. uv.y: 0 at the foot, 1 at the handrail. The floor's own rim stands open where the bridge lands; the
// bridge's west rail and the platform's stand open at the spur.
function wellRailsGeo() {
  const pos = [], uv = [], H = 1.5;
  const strip = (a, b) => { for (const [p, v] of [[a, 0], [b, 0], [b, 1], [a, 0], [b, 1], [a, 1]]) { pos.push(p[0], p[1] + v * H, p[2]); uv.push(0, v); } };
  const Rr = SH.r + 0.12, gapsB = [[wellAng(-65, Rr, false), wellAng(-71, Rr, false)], [wellAng(-71, Rr, true), wellAng(-65, Rr, true)]];
  for (const [y] of WELL_ST) for (const [a0, a1] of ringPieces(72, y === 0 ? gapsB : [])) strip(wellPt(Rr, y, a0), wellPt(Rr, y, a1));
  const yd = 0.03, g0 = SH.z - 1.6, g1 = SH.z + 1.6;
  strip([-65, yd, GATE.n], [-65, yd, GATE.s]); strip([-71, yd, GATE.n], [-71, yd, g0]); strip([-71, yd, g1], [-71, yd, GATE.s]);
  const sx0 = SH.x + SH.plat - 0.12;
  strip([sx0, yd, g0], [-71, yd, g0]); strip([sx0, yd, g1], [-71, yd, g1]);
  // (THE GLASS DECKS: the bridge's, uv.x 2, and the spur's, uv.x 3: the look measures along and across by the place)
  for (const [v, m] of [[[[-71, GATE.n], [-65, GATE.n], [-65, GATE.s], [-71, GATE.s]], 2], [[[SH.x + SH.plat - 0.25, g0], [-71, g0], [-71, g1], [SH.x + SH.plat - 0.25, g1]], 3]]) for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(v[i][0], yd, v[i][1]); uv.push(m, 0.5); }
  const ga = Math.asin(1.6 / (SH.plat - 0.12));
  for (let i = 0; i < 46; i++) { const a0 = ga + i / 46 * (Math.PI * 2 - 2 * ga), a1 = ga + (i + 1) / 46 * (Math.PI * 2 - 2 * ga); strip(wellPt(SH.plat - 0.12, 0, a0), wellPt(SH.plat - 0.12, 0, a1)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// THE WELL'S FIVE COLOURS (round eleven c): cobalt, TURQUOISE, LILAC, plum, warm white. THE WELL READS COOL AND
// BRIGHT: white, turquoise, plum, cobalt, lilac. Each is named as it stands after the page's filmic curve (that curve
// mixes the channels, and the well's pale air lies over all): THE TURQUOISE a clear turquoise toward blue, on the
// screen a hue of 185 to 195 degrees (it stood a greyed teal-green); THE LILAC a clear cool pink-violet, on the
// screen a hue between 270 and 300 degrees, lit and in shade, never toward red, orange or brown (a coral and a rose
// stood in its place). No coral, no rose and no warm wall stands in the well.
const WELL_PAL = ['#2a55c8', '#10b4d4', '#d08cf8', '#84449a', '#f3e6cc'];
const WELL_VERT = /* glsl */`
attribute float aK; attribute vec2 aV;
varying vec3 vW; varying vec3 vN; varying float vK; varying vec2 vV;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vK = aK; vV = aV; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE WELL'S LOOK. COOL AND BRIGHT (round eleven c): a tier's front is a thin slab edge in its storey's carpet
// colour, with no line of light under it; the galleries' under sides white, one slim bar of light to a bay along
// the radius; the back walls in the galleries' own soft shade, the floor's own storey's wall the lobby's cool
// white; and in every bay of a back wall (48 to the round, 6.3 m each) A LIT ROOM IN ONE OF
// THE WELL'S COLOURS (cobalt, turquoise, lilac, plum, warm white). EVERY STOREY IS LIT IN ONE OF THEM (no two
// neighbours alike; its bays in near tones, one in seven warm white; its gallery's floor a carpet of that colour, the
// slab over it in its glow); the floor's own storey alone keeps the floor's mixed colours, three bays to a colour,
// on pale stone. Each room is seen through a glazed front along the eye's own ray: its back wall in one plain tone,
// its side walls, floor and ceiling, and (round eleven b) A FEW SOLID THINGS STANDING IN IT (see GLSL_ROOMS: no
// shelf, no board, no rows of marks), all shaded by its lamp; one bay in ten is plain wall, one in five is a door
// whose leaf slides by the doors' law, a few rooms are dim. A room's colour lies on the gallery's floor before
// it; a pool of white light lies under every desk lamp. THE LIGHTS' LAW IN THE WELL: fronts of brighter light travel ROUND
// AND DOWN the rings as a slow slanting spiral (two arms, 40 m from turn to turn, once round in 12 s): the lines
// of light on the bridge's beams, the bars and the walls' wash swell as a front passes their own place.
const WELL_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vK; varying vec2 vV;
uniform vec3 uPalW[5]; uniform float uSeedW, uFront;
${GLSL_WAVE}${GLSL_LIT}${GLSL_WELLAIR}${GLSL_ROOMS}
const vec2 WC = vec2(${SH.x.toFixed(1)}, ${SH.z.toFixed(1)});
const float R0 = ${SH.r.toFixed(1)}, R1 = ${(SH.r + SH.deep).toFixed(1)}, NB = ${WELL_BAYS.toFixed(1)}, LIP = ${WELL_LIP.toFixed(2)}, TAU = 6.2831853;
// (a draw between 0 and 1 from one number: our own, a sine and a cosine)
float h1w(float n){ return fract(sin(n * 27.619 + 3.7) * 24634.6345 + cos(n * 41.233) * 7919.137); }
// (the passing front: two arms round the well, 40 m from turn to turn, a turn of the phase in 6 s; uFront: where the
// front stands at the clock's nought, a share of its period, dealt by the seed)
float wellWave(float th, float y){ float ph = fract(th / 3.14159265 + y / 40. + uTime / 6. + uFront), s = sin(3.14159265 * min(ph / .3, 1.)); return s * s; }
// A STOREY'S OWN COLOUR, as a place of the five (cobalt, turquoise, lilac, plum, warm white). (round eleven) THE
// STOREYS TAKE PLUM, COBALT, TURQUOISE AND LILAC IN TURN, from the lowest up (which of the four the floor's own
// storey takes is the seed's): no two neighbours alike, and no storey is warm white
float storeyCol(float s){ return mod(mod(s + floor(uSeedW), 4.) + 3., 4.); }
// (a gallery's carpet: the storey's colour. The plum and the cobalt deep and calm; THE LILAC AND THE TURQUOISE
// CLEAR AND LIGHTER (round eleven c), each a tone named as it stands after the page's curve: the lilac a pink-violet of hue
// 282 to 285 degrees there, the turquoise a blue turquoise of hue 190)
vec3 carpetOf(float ci){ return abs(ci - 2.) < .5 ? vec3(.86, .5, 1.) : abs(ci - 1.) < .5 ? vec3(.06, .64, .78) : uPalW[int(ci)] * .43 + .02; }
void main(){
  vec3 toEye = cameraPosition - vW;
  float dist = length(toEye);
  vec3 dv = -toEye / max(dist, 1e-3);
  vec2 dC = vW.xz - WC;
  float r = length(dC), th = atan(dC.y, dC.x), fw = max(length(fwidth(vW)), .01), fy = max(fwidth(vW.y), .01);
  float sy = vV.x, sh = vV.y, bay = floor(th / TAU * NB), thc = (bay + .5) * TAU / NB, sIdx = floor(sy / 5. + .5);
  // THE FLOOR'S OWN STOREY keeps the floor's mixed colours (three bays to a colour); EVERY OTHER STOREY IS LIT IN ONE
  // COLOUR, each bay a shade brighter or deeper, one bay in seven warm white
  bool own = abs(sy) < .5;
  float mainI = storeyCol(sIdx), dst = floor((bay + floor(h1w(sIdx * 7.3 + uSeedW) * 9.)) / 3.);
  float cDraw = h1w(dst * 3.17 + sIdx * 17.3 + uSeedW), sDraw = h1w(bay * 1.713 + sIdx * 31.1 + uSeedW * 3.), tDraw = h1w(bay * 2.39 + sIdx * 5.7 + uSeedW);
  vec3 rcS = uPalW[int(mainI)], rc = own ? uPalW[int(cDraw * 4.999)] : mix(rcS * (.8 + .34 * tDraw), uPalW[4], step(.86, fract(tDraw * 7.31)));
  bool plain = sDraw < .08, doorB = sDraw >= .08 && sDraw < .28, dim = sDraw > .92;
  float litR = plain ? 0. : dim ? .15 : 1., wv = wellWave(th, vW.y), tone = .8, glow = 0.;
  vec3 alb = vec3(.955, .95, .93), add = vec3(0.), col;
  if (vK < .5) {
    // a gallery's floor: on the floor's own storey PALE STONE; on every other A CARPET IN THE STOREY'S COLOUR with a
    // border of pale stone along the rim; a joint at every bay; a shade at the wall's foot; each lit room's colour
    // lies before it; a pool of white light under the desk lamp of every other bay
    float rr = r - R0, u = (th - thc) * r, jb = (3.14159265 / NB - abs(th - thc)) * r, ja = abs(rr - 3.);
    // (the joints: 3 cm in a bay of 6 m: their own mean is 0.01 of the floor, and they fade to none)
    float jt = max(clamp((.03 - jb) / fw + .5, 0., 1.), own ? clamp((.03 - ja) / fw + .5, 0., 1.) : 0.) * clamp(.08 / fw, 0., 1.);
    // (round eleven: EVERY gallery's floor is a carpet in its storey's colour, the floor's own storey's too; along
    // the rim a band of the same colour a shade deeper, 0.9 m broad: no pale stone)
    float border = 1. - smoothstep(.9 - fw, .9 + fw, rr);
    tone = .8 - .1 * exp(-(6. - rr) / 1.2) + .05 * wv;
    alb = carpetOf(mainI) * (1. - .3 * border) * (1. - .16 * jt);
    float sp = litR * (1. - smoothstep(1.5, 3.1, abs(u))) * exp(-(6. - rr) / 2.8);
    alb = mix(alb, rc * .92, .5 * sp); tone += .05 * sp;
    vec2 dl = vec2(u - 1.2, rr - 1.6);
    float pool = step(.5, mod(bay + sIdx, 2.)) * exp(-dot(dl, dl) / 2.6);
    // (round eleven c: the lamp's pool is neutral white, not warm)
    alb = mix(alb, vec3(.96), .6 * pool); tone += .08 * pool;
  } else if (vK < 1.5) {
    // a lip. (round eleven c) A TIER'S FRONT IS A THIN SLAB EDGE IN ITS STOREY'S OWN CARPET COLOUR (the shade of the
    // carpet's band along the rim), the slim glass rail over it, and NO LINE OF LIGHT UNDER ANY TIER; the bridge's,
    // the spur's and the platform's edge beams (vV.y 6) stay white, each with its line of light along its foot
    bool beam = abs(sh - 6.) < .25;
    float yy = vW.y - (sy - LIP), line = beam ? clamp((.22 - yy) / fy + .5, 0., 1.) : 0.;
    if (!beam) alb = carpetOf(mainI) * .7;
    // (a tier's edge has its carpet's own tone, .8; THE PASSING FRONT LIFTS A SURFACE OF THE WELL BY A FIFTH OF ITS
    // OWN TONE: the edge, a gallery's under side, a storey's wall)
    tone = (beam ? .86 : .8 * (1. + .2 * wv)) * (1. - line);
    add = vec3(1., .93, .78) * (1. + 1.8 * wv) * line; glow = line;
  } else if (vK < 2.5) {
    // a slab's under side: white, in the glow of the storey under it. (round eleven c) ONE SLIM BAR OF LIGHT TO A BAY,
    // LYING ALONG THE RADIUS (the weave's strand turned to the ring): 4 m long, two thirds of the gallery's depth,
    // and 0.5 m broad, in the middle of its bay. No round light, and no strip of light behind the lip.
    float rr = r - R0;
    vec2 qb = abs(vec2(rr - 3., (th - thc) * r)) - vec2(2., .25);
    float dd = length(max(qb, 0.)) + min(max(qb.x, qb.y), 0.);
    // (a bar of 2 m2 in its bay of 35: the bars' own mean is 0.055 of the under side; far off they settle to it)
    float vis = clamp(1.1 / fw, 0., 1.), face = mix(.055, 1. - smoothstep(-fw, fw, dd), vis), halo = 1. - smoothstep(0., 1.65, dd), kd = wellWave(thc, vW.y);
    float sB = sy > 7.5 && sy < 12.5 ? 0. : sIdx - 1.;
    alb = mix(alb, uPalW[int(storeyCol(sB))], .3);
    // (the under side's own tone: four fifths of the carpet's, .64; the front lifts it by a fifth of that)
    tone = (.64 * (1. + .2 * wv) + .14 * halo) * (1. - face);
    add = vec3(1., .98, .94) * (.95 + 2.2 * kd * sqrt(kd)) * face; glow = face;
  } else if (vK < 3.5) {
    // a back wall and the rooms behind it
    float u = (th - thc) * R1, yy = vW.y - sy, Hs = sh - LIP, hd = min(Hs - .7, 5.), sill = doorB ? 0. : .55, hwO = doorB ? 1.25 : 2.45;
    float inO = (1. - smoothstep(hwO - fw, hwO + fw, abs(u))) * (1. - smoothstep(hd - fy, hd + fy, yy)) * smoothstep(sill - fy, sill + fy, yy) * (plain ? 0. : 1.);
    float jb = 3.14159265 / NB * R1 - abs(u), joint = clamp((.03 - jb) / fw + .5, 0., 1.) * clamp(.08 / fw, 0., 1.);
    // (round eleven c: THE FLOOR'S OWN STOREY'S WALL, the tallest band right round the well, IS THE LOBBY'S COOL WHITE;
    // every other storey's wall keeps its storey's own soft shade. Their own tones at the wall's foot: .84 and .6
    // (three quarters of the carpet's). The front lifts a shaded wall by a fifth of its tone; the white wall, which
    // stands a step under white already, by a tenth)
    tone = ((own ? .84 : .6) * (1. + (own ? .1 : .2) * wv) + (own ? .06 : .12) * smoothstep(0., Hs, yy)) * (1. - .12 * joint) * (1. - .2 * (1. - smoothstep(.25, .3 + fy, yy)));
    alb = own ? vec3(.93, .95, 1.) : mix(alb, rcS, .42);
    // (a fine pale frame round the opening)
    float fr = max(abs(u) - hwO, max(yy - hd, sill - yy));
    tone += .14 * (1. - smoothstep(.1, .1 + fw, abs(fr))) * clamp(.2 / fw, 0., 1.) * (plain ? 0. : 1.);
    vec2 tng = vec2(-sin(thc), cos(thc)), outw = vec2(cos(thc), sin(thc));
    float du = dot(dv.xz, tng), dw = max(dot(dv.xz, outw), .04), dy = dv.y, RW = 2.95, RD = 5.5, RH = Hs - .1;
    float tb = RD / dw, tu = (du > 0. ? RW - u : RW + u) / max(abs(du), 1e-4), ty = (dy > 0. ? RH - yy : yy) / max(abs(dy), 1e-4), t = min(tb, min(tu, ty));
    vec3 q = vec3(u + du * t, yy + dy * t, dw * t), room, emis = vec3(0.);
    // (round eleven b) THE ROOM'S KIND AND ITS HAND (which side its things stand on), dealt by its bay and storey
    float kDraw = h1w(bay * 4.71 + sIdx * 13.7 + uSeedW * 1.3), kind = kDraw < .45 ? 0. : kDraw < .8 ? 1. : 2., hand = h1w(bay * 6.13 + sIdx * 3.9 + uSeedW * 2.1) < .5 ? -1. : 1.;
    vec3 lp = roomLight(RW, RD, kind);
    float lampG = exp(-((q.x - lp.x * hand) * (q.x - lp.x * hand) + (q.y - lp.y) * (q.y - lp.y) * 1.4 + (q.z - lp.z) * (q.z - lp.z) * .5) / 3.4);
    // (round eleven) EVERY ROOM IS A DOORWAY WITH DEPTH AND A LIT INSIDE: the wall is 0.5 m thick, and its pale
    // reveal is seen round the opening (jamb, head or sill, as the eye's ray strikes it); inside, ONE WALL IN THE
    // ROOM'S COLOUR (the back one, deep), the side walls pale and darker toward the back, the floor deep, the
    // ceiling white with its slim bar of light; the room's lamp lights what stands round it
    float tj = .5 / dw;
    vec2 qj = vec2(u + du * tj, yy + dy * tj);
    bool reveal = abs(qj.x) > hwO || qj.y > hd || qj.y < sill;
    // (its back wall: one plain tone, a shade lighter toward the ceiling)
    if (tb <= min(tu, ty)) room = rc * (.58 + .14 * q.y / RH);
    else if (tu < ty) room = mix(rc, vec3(.9, .89, .86), .66) * (.46 + .42 * (1. - q.z / RD));
    else if (dy > 0.) {
      // (round eleven c: one slim bar of light, 2.4 m long and 0.4 m broad, from the front toward the back)
      vec2 qc = abs(vec2(q.x, q.z - RD * .5)) - vec2(.2, 1.2);
      float cl = 1. - smoothstep(-.05, .05, max(qc.x, qc.y));
      room = mix(mix(rc, vec3(.97), .7) * .8, vec3(1.), cl); emis += vec3(1., .98, .94) * .8 * cl;
    } else room = (rc * .36 + .04) * (.7 + .3 * (1. - q.z / RD));
    // (THE ROOM LAMP'S WASH IS WHITE LIGHT: where it is strongest it lifts a face by two thirds of the face's own
    // tone, the same on every channel, so that the room's colour keeps its own hue lit and in shade; the lamp's
    // shade itself stays warm, a small thing)
    room *= 1. + vec3(${(2 / 3).toFixed(4)}) * lampG;
    // (where the wash would lift one channel over .9, the page's white, the whole colour is held back together, so
    // that no channel is cut off alone and the hue stays)
    room *= min(1., .9 / max(max(room.r, max(room.g, room.b)), .02));
    // (the room's things: a second colour for the cabinet's doors, two places on in the storeys' four; the room
    // beyond a doorway warm white)
    vec3 glowT, c2 = mix(uPalW[int(mod(mainI + 2., 4.))], vec3(.92), .18);
    vec4 th = roomThings(vec3(u * hand, yy, 0.), vec3(du * hand, dy, dw), RW, RD, t, kind, c2, vec3(1., .93, .8), glowT);
    if (th.w < t) {
      vec3 pt = vec3(u + du * th.w, yy + dy * th.w, dw * th.w) - vec3(lp.x * hand, lp.y, lp.z);
      room = th.rgb * (1. + vec3(.36) * exp(-dot(pt, pt) / 5.)); emis = glowT;
    }
    if (reveal) { room = vec3(.8, .8, .82) * (abs(qj.x) > hwO ? .62 + .2 * step(0., du * qj.x) : qj.y > hd ? .66 : .88); emis = vec3(0.); }
    room = mix(mix(vec3(.3, .34, .46), rc, .2) * .7, room, litR);
    emis = (emis + rc * .12) * litR;
    // (a door's leaf slides across its opening by the doors' law; a glazed front has one fine mullion)
    if (doorB) {
      float o = doorOpen(WC.x + WC.y + R1 * (outw.x + outw.y) + sy * 3.), le = -hwO + 2. * hwO * o, leaf = smoothstep(le - fw, le + fw, u);
      float pu = u - le;
      vec3 lc = mix(vec3(.93), rc, .45) * (.92 - .1 * step(.3, pu) * step(pu, 2. * hwO - .3) * step(abs(fract(yy / (hd * .5)) - .5), .4));
      room = mix(room, lc, leaf); emis *= 1. - leaf;
    } else room = mix(room, vec3(.9, .91, .93), (1. - smoothstep(.04, .04 + fw, abs(u))) * clamp(.1 / fw, 0., 1.) * .8);
    col = mix(lit3(alb * tone), lit3(min(room, vec3(.9))) + emis, inO);
    gl_FragColor = vec4(wellAir(col, vW, dist, .3 * inO * litR), 1.);
    return;
  } else if (vK < 4.5) {
    // the well's ceiling: white, and THE WEAVE OF LIGHT on it (round eleven c): square cells of 6 m about the well's
    // axis, in each ONE SLIM BAR 4 m long and 1 m broad, along in one cell and across in the next, turn about. No
    // round light stands on it, and none round the pendant's root.
    vec2 cj = floor(dC / 6.), mid = (cj + .5) * 6., r6 = dC - mid;
    vec2 qb = abs(mod(cj.x + cj.y, 2.) < .5 ? r6 : r6.yx) - vec2(2., .5);
    float dd = length(max(qb, 0.)) + min(max(qb.x, qb.y), 0.), rm = length(mid);
    // (a bar of 4 m2 in its cell of 36: the bars' own mean is 0.111 of the ceiling; far off they settle to it; a
    // cell whose middle lies further than 44 m from the axis holds none: a bar's far corner is 2.1 m from its middle)
    float face = mix(.111, 1. - smoothstep(-fw, fw, dd), clamp(1.6 / fw, 0., 1.)) * step(rm, 44.), k4 = wellWave(atan(mid.y, mid.x), 40. + rm * .5);
    tone = .8 * (1. - face);
    add = vec3(1., .98, .94) * (1.05 + 2.1 * k4 * sqrt(k4)) * face; glow = face;
  } else if (vK < 5.5) {
    gl_FragColor = vec4(lit3(vec3(.76, .84, .95)), 1.);
    return;
  } else if (vK < 7.5) {
    // the platform's floor: PALE TIMBER in boards of 0.45 m, each a breath lighter or deeper, ONE FINE INLAID RING
    // near its rim; the island's great lamp lays its warm pool on it; a soft shade under the ring of desks
    float rp = r, bd = vW.x / .45, bj = (.5 - abs(fract(bd) - .5)) * .45, ring = clamp((.06 - abs(rp - 8.2)) / fw + .5, 0., 1.) * clamp(.12 / fw, 0., 1.);
    alb = vec3(.92, .83, .68) * (.95 + .09 * h1w(floor(bd) * 1.37)) * (1. - .16 * clamp((.012 - bj) / fw + .5, 0., 1.) * clamp(.04 / fw, 0., 1.));
    alb = mix(alb, vec3(.5, .42, .34), .8 * ring);
    tone = (.8 + .14 * exp(-rp * rp / 70.)) * (1. - .09 * smoothstep(4.3, 5.2, rp) * (1. - smoothstep(7.2, 8.1, rp)));
    alb *= 1. + vec3(.12, .05, -.04) * exp(-rp * rp / 60.);
  } else if (vK < 8.5) {
    // a plain white body: tops brightest, under sides lit from the bright depth, sides by the way they face
    tone = vN.y > .5 ? .86 : vN.y < -.5 ? .76 + .05 * wv : .78 + .08 * dot(normalize(vN.xz + vec2(1e-4)), vec2(.45, .89));
  } else { alb = vec3(.8, .82, .86); tone = .78 + .1 * abs(dot(normalize(vN.xz + vec2(1e-4)), vec2(.6, .8))); }
  col = lit3(min(alb * tone, vec3(.9))) + add;
  gl_FragColor = vec4(wellAir(col, vW, dist, glow), 1.);
}`;
// a glass rail: all but clear; a pale sheen that grows at the flat look, its handrail a fine bright line
const RAIL_VERT = /* glsl */`
varying vec2 vU; varying vec3 vW;
void main(){ vU = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const RAIL_FRAG = /* glsl */`
varying vec2 vU; varying vec3 vW;
${GLSL_LIT}${GLSL_WELLAIR}
void main(){
  float fv = max(fwidth(vU.y), 1e-3), top = clamp((vU.y - .955) / fv + .5, 0., 1.) * clamp(.09 / fv, .1, 1.), foot = clamp((.03 - vU.y) / fv + .5, 0., 1.) * clamp(.06 / fv, 0., 1.);
  float dist = length(cameraPosition - vW), hz = pow(clamp((-40. - vW.y) / 54., 0., 1.), 1.3);
  float a = max(.035, max(.7 * top, .3 * foot)) * (1. - hz);
  vec3 c = mix(vec3(.9, .95, 1.), vec3(1.12, 1.12, 1.1), max(top, foot));
  if (vU.x > 1.5) {
    // (round eleven) A GLASS DECK (the bridge's, or the spur's): CLEAR, so that the galleries below are seen through
    // it; A FINE LIT EDGE on each side; A SLIM WHITE RIB across it every 3 m; a cool sheen that grows at the flat
    // look and never hides what lies under it
    bool spur = vU.x > 2.5;
    float e = spur ? 1.6 - abs(vW.z - (${SH.z.toFixed(1)})) : 3. - abs(vW.x + 68.), al = spur ? vW.x + 71. : vW.z - (${GATE.n.toFixed(3)});
    float fw = max(length(fwidth(vW.xz)), .01);
    float edge = clamp((.42 - e) / fw + .5, 0., 1.) * clamp((e - .3) / fw + .5, 0., 1.) * clamp(.12 / fw, .3, 1.);
    float rib = clamp((.07 - abs(fract(al / 3.) - .5) * 3.) / fw + .5, 0., 1.) * clamp(.14 / fw, .2, 1.) * step(.3, e);
    float flat_ = pow(max(1. - abs(normalize(cameraPosition - vW).y), 0.), 4.);
    // (the first 0.3 m from each side is the edge beam's own white top)
    float beam = 1. - clamp((e - .3) / fw + .5, 0., 1.);
    a = max(max(max(edge, .9 * rib), beam), .05 + .17 * flat_);
    c = mix(mix(mix(vec3(.62, .78, 1.), vec3(.86, .87, .86), rib), vec3(.84, .84, .82), beam), vec3(1.25, 1.14, .9), edge);
  }
  gl_FragColor = vec4(c, a);
}`;
// A DESK OF THE GALLERIES, few-sided (it is seen from 20 m and more), about its own place on the rim: x runs along
// the rim, z from the rim toward the back wall. An ash top on two slabs 0.8 to 2.6 m from the rim, its lamp lit
// warm at one end, its chair behind it, looking out over the well.
// (far: the same desk in few faces, for the storeys two and more from the floor's own: its top, its slabs as two
// sheets, its lamp's shade, its chair's seat and back)
function galleryDeskGeo(far = false) {
  const T = makeThingBuilder();
  if (far) {
    T.box(-2.1, 2.1, 1.71, 1.85, 0.8, 2.6, ASH, 0, true);
    for (const x of [-1.94, 1.94]) T.quad([x, 0, 0.95], [x, 0, 2.45], [x, 1.71, 2.45], [x, 1.71, 0.95], [x < 0 ? -1 : 1, 0, 0], SHELLW);
    T.cyl(-1.2, 1.6, 0.6, 0.26, 2.5, 3.0, WARM, 0.9, 4, 2, WARM, 1).cyl(0.3, 3.6, 0.7, 0.76, 1.05, 1.28, ISLE_SEAT, 0, 4, 1);
    T.quad([-0.35, 1.15, 4.3], [0.95, 1.15, 4.3], [0.95, 2.5, 4.42], [-0.35, 2.5, 4.42], [0, 0, -1], SHELLW);
    return T.build();
  }
  T.box(-2.1, 2.1, 1.71, 1.85, 0.8, 2.6, ASH, 0, true).box(-2.0, -1.88, 0, 1.71, 0.95, 2.45, SHELLW).box(1.88, 2.0, 0, 1.71, 0.95, 2.45, SHELLW);
  T.cyl(-1.2, 1.6, 0.04, 0.04, 1.85, 2.6, STEEL, 0, 4, 0).cyl(-1.2, 1.6, 0.6, 0.26, 2.5, 3.0, WARM, 0.9, 6, 2, WARM, 1);
  T.cyl(0.3, 3.6, 0.08, 0.08, 0.1, 1.05, STEEL, 0, 4, 0).cyl(0.3, 3.6, 0.7, 0.76, 1.05, 1.28, ISLE_SEAT, 0, 6, 3);
  T.quad([-0.35, 1.15, 4.3], [0.95, 1.15, 4.3], [0.95, 2.5, 4.42], [-0.35, 2.5, 4.42], [0, 0, -1], SHELLW);
  return T.build();
}
// THE PENDANT (round ten; round eleven c): ONE LONG PENDANT down the well's axis, about the axis itself: a slim cord
// from the ceiling (through the island's great lamp, which is its cluster at the floor's own storey) down into the
// haze. ITS LAMPS RIDE THE CORD: one cluster to every storey but the floor's own (a broad lit drum shade round the
// cord and, from 60 m under the floor up, eight small globes on slim arms round it), and EACH RIDES SLOWLY DOWN ITS
// CORD AND UP AGAIN at its own slow rate and by its own reach, both dealt (stream fww-pendant), on the world's
// clock: from its own storey's height down by PENDANT.reach metres and back in PENDANT.period seconds, so that no
// two keep step and the well's axis is never still. None is promised at any place or at any phase. (The next
// cluster down hangs a storey, 5 m, under it; a cluster is 1.5 m high and rides down by 3 m at the most: the two
// never meet. Nothing else moves on the well's wall: no lift stands in the well.)
const PENDANT = { rise: 2, reach: [1.2, 3], period: [24, 60] };
function pendantGeo() {
  const T = makeThingBuilder();
  T.cyl(0, 0, 0.16, 0.16, 7.8, SH.top, SHELLW, 0, 6, 0).cyl(0, 0, 0.16, 0.16, -93, -2.1, SHELLW, 0, 6, 0);
  return T.build();
}
// (one cluster about its own foot on the cord: the lit drum shade; with `globes`, the ring of eight on their arms)
function pendantLampGeo(globes) {
  const T = makeThingBuilder();
  T.cyl(0, 0, 1.3, 1.3, 0, 1.5, GOLD, 0.8, 12, 3, GOLD, 1);
  if (globes) for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) / 8 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), gx = 3.3 * c, gz = 3.3 * sn, R = 0.44;
    T.quad([1.3 * c, 1.1, 1.3 * sn], [gx, 1.1, gz], [gx, 1.18, gz], [1.3 * c, 1.18, 1.3 * sn], [-sn, 0, c], STEEL);
    T.cyl(gx, gz, 0.03, 0.03, 0.75 + R, 1.1, STEEL, 0, 3, 0);
    T.cyl(gx, gz, 0.02, 0.866 * R, 0.75 - R, 0.75 - 0.5 * R, GOLD, 1, 6, 0).cyl(gx, gz, 0.866 * R, 0.866 * R, 0.75 - 0.5 * R, 0.75 + 0.5 * R, GOLD, 1, 6, 0).cyl(gx, gz, 0.866 * R, 0.02, 0.75 + 0.5 * R, 0.75 + R, GOLD, 1, 6, 0);
  }
  return T.build();
}
// (each cluster's ride, from the lowest storey up: [its storey's height, the seconds of one ride down and up, where
// in that ride it stands when the clock starts (a share of it), the metres it rides down])
function pendantRides(r) { return WELL_ST.filter(([y]) => y !== 0).map(([y]) => [y, r.range(PENDANT.period[0], PENDANT.period[1]), r.range(0, 1), r.range(PENDANT.reach[0], PENDANT.reach[1])]); }
// THE PENDANT'S GLOW: about each cluster a soft warm halo, AN EYE-FACING QUAD (one quad to a cluster, set about the
// cluster's own place and turned to face the eye, its light added to what stands behind it), fainter as the cluster
// sinks into the haze: the column of warm light down the well's axis. It rides with its cluster (the same law).
function pendantGlowGeo(rides) {
  const pos = [], uv = [], ride = [];
  for (const [y, per, st, reach] of rides) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { pos.push(SH.x, y + PENDANT.rise + 0.75 - reach, SH.z); uv.push(u, v); ride.push(per, st, reach); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aRide', new THREE.Float32BufferAttribute(ride, 3));
  return g;
}
const PGLOW_VERT = /* glsl */`
attribute vec3 aRide;
uniform float uTime;
varying vec2 vU; varying float vHz;
void main(){
  // (the cluster's own ride: the things' law of a slow glide up and down again)
  vec3 p = position;
  p.y += aRide.z * (.5 - .5 * cos(6.2831853 * (uTime / max(aRide.x, .05) + aRide.y)));
  vU = uv; vHz = pow(clamp((-40. - p.y) / 54., 0., 1.), 1.3);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  mv.xy += uv * 5.;
  gl_Position = projectionMatrix * mv;
}`;
const PGLOW_FRAG = /* glsl */`
varying vec2 vU; varying float vHz;
void main(){
  float d = dot(vU, vU), a = (.42 * exp(-d * 9.) + .07 * exp(-d * 2.2)) * (1. - smoothstep(.6, 1., d));
  gl_FragColor = vec4(vec3(1., .72, .36) * a * (1. - .8 * vHz), 1.);
}`;

export default {
  id: 'floor-without-windows',
  name: 'The Floor Without Windows',
  category: 'screen',
  placeKind: 'interior',
  screen: 'Severance',
  screenYear: '2022',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.6,
  async build(ctx) {
    const mk = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // every stream of the world, in one list, before any loop runs
    const rLook = mk('fww-look'), rDoor = mk('fww-doors'), rIsle = mk('fww-island'), rHall = mk('fww-hall'), rRooms = mk('fww-rooms'), rWell = mk('fww-well'), rPlain = mk('fww-plain'), rNiche = mk('fww-niche'), rGal = mk('fww-gallery');
    // (round eleven c: A STREAM OF ITS OWN FOR EACH KIND OF THING THAT ROUND ELEVEN B OR C ADDED: the alcoves (a colour, a
    // tree or a plant), the link's two doors' colours, the trees of the lobby's rank of niches, the deal of the special
    // room, the pendant's lamps: none draws in the middle of an older stream)
    const rAlc = mk('fww-alcove'), rLinkD = mk('fww-link-doors'), rLobT = mk('fww-lobby-trees'), rDeal = mk('fww-room-deal'), rPend = mk('fww-pendant');
    const detail = ctx.quality ? ctx.quality.detail : 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_ABOVE.color.x, FOG_ABOVE.color.y, FOG_ABOVE.color.z);
    const timeU = { value: 0 };

    // ------------------------------------------------------------ what this visit is like
    // (round ten: THE RARE PAPER SNOW IS STRUCK, so vary.rare stages nothing here. THE VISIT'S DENSITY is how much of
    // the floor works tonight: the after-hours sector seen from above is 120 degrees wide on the emptiest visit
    // (density 0.7), 100 at 1, 80 on the fullest (1.3): set after the part is built. THE VISIT'S MOOD sets the
    // grade's saturation between 1.00 and 1.08. The hour is not honoured: this floor has no sky and no daylight.)
    const vary = ctx.vary || { rare: false, density: 1, mood: 0.5, hour: 'any' };
    const order = rLook.shuffle(DISTRICTS.slice());
    const look = { first: order[0], second: order[1] };

    // ------------------------------------------------------------ the flown line and its measures
    const pts = linePoints(3);
    const path = makePath(pts.map((q) => [q[0], q[1], q[2]]));
    await ctx.yield();
    // metres of run -> share of the path's length (the climb and the descent are longer than their run)
    const fine = linePoints(0.5), cum = new Float32Array(fine.length);
    for (let i = 1; i < fine.length; i++) cum[i] = cum[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1], fine[i][2] - fine[i - 1][2]);
    const total = cum[cum.length - 1];
    const uAt = (h) => { const f = clamp(h / RUNS.end, 0, 1) * (fine.length - 1), i = Math.min(Math.floor(f), fine.length - 2); return (cum[i] + (cum[i + 1] - cum[i]) * (f - i)) / total; };
    const hAt = (u) => {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = cum.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
      return (lo + (d - cum[lo]) / Math.max(cum[hi] - cum[lo], 1e-6)) / (fine.length - 1) * RUNS.end;
    };
    // PLACES OF THE LINE that the pace and the looks go by, in metres of run, EACH FOUND ON THE LINE ITSELF (the part's
    // runAtZ): where the line passes the glass's north end (the loggia's first metre); the loggia's last metre; the
    // bridge over the well, from the well's south face to its north face; where the island's platform at the
    // well's axis begins to stand abeam of the line and where it has passed; and `covered`: the place from which
    // the well's own building covers the hero's mark (the lens, the pile's south-east corner and the mark stand in
    // one line there: found by halving between the glass's end and the loggia's)
    const HERO_MARK = new THREE.Vector3(P.CORE.x, HERO_SHOULDERS[0], P.CORE.z);
    const AT = { glassEnd: runAtZ(P.LOBBY.glassN), loggiaEnd: runAtZ(GAL.zN), bridge0: runAtZ(GATE.s), bridge1: runAtZ(GATE.n), platA: runAtZ(SH.z + SH.plat), platB: runAtZ(SH.z - SH.plat) };
    {
      const cx = SH.x + SH.half, cz = SH.z + SH.half, hand = (h) => { const q = lineAt(h); return (cx - q[0]) * (HERO_MARK.z - q[1]) - (cz - q[1]) * (HERO_MARK.x - q[0]); };
      let a = AT.glassEnd, b = AT.loggiaEnd;
      const ha = hand(a);
      for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (hand(m) * ha > 0) a = m; else b = m; }
      AT.covered = (a + b) / 2;
    }
    // THE PACE: each leg's own speed in true metres a second, from its place on (the table sums to the flight's fifty
    // seconds, so the engine, which scales a world's pace to its duration, flies each as written), eased over
    // 2 EASE metres of run centred on each change. A change that must not act before a place stands EASE metres
    // past it. THE LOBBY, as far as its glass goes, at the arrival's pace (a broad plain hall, the gaze held on the
    // far hero); FROM THE GLASS'S END, THE LOGGIA AND THE THROAT slower (the court lies open beside the line, then
    // the gaze sweeps from the court to the well: 1.4 degrees a metre); THE BRIDGE slower still, to its last metre
    // (the gaze comes back from the well to the heading over its north part: 1.5 degrees a metre); THE LINK at the
    // lobby's pace again (a straight corridor, the gaze the way ahead); the tide; THE WHEEL at 13 (an arc of radius
    // 30 m in plan, climbing 18.3 degrees: the heading turns 23.6 degrees a second: the law is 26), reached before
    // its first metre and kept to its last; OVER HALL TWO'S ROOF fast and level (the hero stands whole ahead from
    // the wheel's last eighth to the head plaza); THE SINKING into the head plaza from the roof's edge; THE
    // BOULEVARD from the head plaza's middle; THE GARDEN COURT from its wall, reached before the wall; THE STREET at
    // one even pace from its first metre to the ring.
    const EASE = 10;
    const LEGS = [[0, 20.8], [AT.glassEnd, 16], [AT.bridge0, 15.4], [AT.bridge1 + EASE, 20.8], [RUNS.quay, 17.8], [RUNS.rise - EASE, 13], [RUNS.top + EASE, 38], [RUNS.roof, 34], [RUNS.plaza, 27], [RUNS.court - EASE, 22], [RUNS.street, 19.5]];
    const speedAt = (h) => { let v = LEGS[0][1]; for (let i = 1; i < LEGS.length; i++) v += (LEGS[i][1] - LEGS[i - 1][1]) * smoothstep(LEGS[i][0] - EASE, LEGS[i][0] + EASE, h); return v; };
    const pace = (u) => speedAt(hAt(u)) / 15;

    await ctx.yield();
    // ------------------------------------------------------------ the view from above and the tide (the part)
    const hero = await buildHero(ctx, { time: timeU });
    const skyU = hero.uniforms.sky;
    hero.uniforms.roof.uAfter.value.z = (50 - (clamp(vary.density ?? 1, 0.7, 1.3) - 1) * 33.3) * Math.PI / 180;
    scene.add(hero.object);
    await ctx.yield();

    // ------------------------------------------------------------ the corridors: shells, doors and the rooms behind them
    const mix3 = (p0, p1, t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
    // a leaf wears its district's colour at two thirds strength
    const bandA = lin(look.first), leafA = mix3(WHITE, bandA, 2 / 3), bandB = lin(look.second), leafB = mix3(WHITE, bandB, 2 / 3);
    // (round eight: A CORRIDOR'S WALL IS PANELLED IN PALE ASH up to the cove's spring, white above; the shader rules
    // the panels' joints)
    const profR = corridorProfile(3.5, P.CH, P.COVE, bandA, MIRROR, PANEL), profL = corridorProfile(3.5, P.CH, P.COVE, null, MIRROR, PANEL);
    // THE GLAZED SIDE of the flown corridor (round eight): the floor out to the glass and a flat ceiling out to it
    // (part 4.2: the shader lays a soft cove of light on it along the glass's head)
    const profG = [{ a: [0, 0], b: [3.5 - 0.96, 0], part: 0, col: MIRROR }, { a: [3.5 - 0.96, 0], b: [3.5, 0], part: 0, col: bandA }, { a: [3.5, P.CH], b: [0, P.CH], part: 4.2, col: WHITE }];
    profG.hw = 3.5; profG.headD = 3.5;
    const doors = [], plain = [], niches = [];
    // one run of corridor swept both sides; pieces are [from, to, step] along its frame; spR and spL are the openings of
    // the right and the left wall whose light falls on the floor before them and on the wall opposite
    const stationsFor = (pieces, openR, openL, spR, spL) => {
      const st = [];
      for (const [a, b, step] of pieces) for (const q of stationsOf(a, b, step, [openR, openL], [spR, spL])) if (!st.length || q > st[st.length - 1] + 1e-6) st.push(q);
      return st;
    };
    function run(B, frame, pieces, openR, openL, pR, pL, spR = [], spL = []) {
      const st = stationsFor(pieces, openR, openL, spR, spL);
      sweep(B, frame, st, 1, pR, openR, spR, spL); sweep(B, frame, st, -1, pL, openL, spL, spR);
    }
    // the same for a long run of many openings: each wall is swept in forty pieces, the page gets a breath after each
    async function runLong(B, frame, pieces, openR, openL, pR, pL, spR = [], spL = []) {
      const st = stationsFor(pieces, openR, openL, spR, spL), n = 40, at = (k) => Math.round((st.length - 1) * k / n);
      await ctx.yield();
      for (const [side, prof, open, own, opp] of [[1, pR, openR, spR, spL], [-1, pL, openL, spL, spR]]) {
        for (let k = 0; k < n; k++) {
          const lo = k === 0 ? -1e9 : st[at(k)], hi = k === n - 1 ? 1e9 : st[at(k + 1)];
          sweep(B, frame, st.slice(at(k), at(k + 1) + 1), side, prof, open, own, opp, (q) => q > lo && q <= hi);
          if (side > 0 || k < n - 1) await ctx.yield();
        }
      }
    }
    const onWall = (f, side, hw, q, ci, kind) => ({ q, x: f[0] - f[3] * hw * side, z: f[1] + f[2] * hw * side, ci, kind });
    // a door with its leaf and its room; the opening's span goes into `open`, its light into `spill`
    function door(B, frame, q, side, hw, open, spill, leafCol, o = {}) {
      const f = frame(q), ci = o.ci === undefined ? rDoor.int(0, 5) : o.ci;
      open.push([q - DOOR_W / 2, q + DOOR_W / 2]);
      // (round seven) A TALL NARROW SIDE-LIGHT BESIDE THE DOOR, on the side its leaf does not slide to: an opening
      // 0.9 m wide from a sill at the skirting's height to the door's head, half a metre of wall between the two;
      // through it the room's lit things are seen. A slim frame of metal with a rail at the leaf's middle rail.
      if (o.light) {
        const qa = q - DOOR_W / 2 - 1.4, qb = qa + 0.9, fm = frame((qa + qb) / 2), rx = -fm[3] * side, rz = fm[2] * side, nI = [-rx, 0, -rz], t5 = [5, fm[2], fm[3]];
        open.push([qa, qb]);
        const c = (a, y, d) => [fm[0] + fm[2] * a + rx * (hw + d), y, fm[1] + fm[3] * a + rz * (hw + d)];
        const bar = (a0, a1, y0, y1, d, col) => B.quad([c(a0, y0, d), c(a1, y0, d), c(a1, y1, d), c(a0, y1, d)], nI, col, Z4, t5);
        bar(-0.45, -0.39, 0.5, DOOR_H, 0.03, METAL); bar(0.39, 0.45, 0.5, DOOR_H, 0.03, METAL); bar(-0.39, 0.39, DOOR_H - 0.06, DOOR_H, 0.03, METAL); bar(-0.39, 0.39, 2.51, 2.59, 0.03, METAL);
        bar(-0.45, 0.45, 0, 0.5, -0.06, WHITE);
        B.quad([c(-0.45, 0.5, -0.06), c(0.45, 0.5, -0.06), c(0.45, 0.5, REVEAL), c(-0.45, 0.5, REVEAL)], [0, 1, 0], WHITE, Z4, t5);
      }
      // (round eleven b) A FURNISHED ROOM'S SIDE WALLS STAND A TONE DARKER THAN ITS BACK WALL. ITS DOOR STANDS IN A
      // FRAME UNDER A LIT PANE: a slim frame of metal round the opening, a rail across it PANE_Y up, the leaf under
      // the rail, and over the rail a fixed pane lit in the room's own colour with two slim bars in it. Shut, the
      // doorway is a pale door with two lit slots under its lit pane; open, a furnished room: never a flat sheet.
      if (o.furnish) {
        const rx = -f[3] * side, rz = f[2] * side, nI = [-rx, 0, -rz], t5 = [5, f[2], f[3]], hd = DOOR_W / 2;
        const c = (a, y, d) => [f[0] + f[2] * a + rx * (hw + d), y, f[1] + f[3] * a + rz * (hw + d)];
        const bar = (a0, a1, y0, y1, d, col, t = t5) => B.quad([c(a0, y0, d), c(a1, y0, d), c(a1, y1, d), c(a0, y1, d)], nI, col, Z4, t);
        bar(-hd, -hd + 0.07, 0, DOOR_H, 0.02, METAL); bar(hd - 0.07, hd, 0, DOOR_H, 0.02, METAL); bar(-hd + 0.07, hd - 0.07, DOOR_H - 0.07, DOOR_H, 0.02, METAL);
        bar(-hd, hd, PANE_Y, PANE_Y + 0.12, 0.14, METAL);
        bar(-hd, hd, PANE_Y + 0.12, DOOR_H, 0.15, PALE[ci].map((v) => v * 0.5), [7, f[2], f[3]]);
        for (const a of [-hd / 3, hd / 3]) bar(a - 0.03, a + 0.03, PANE_Y + 0.12, DOOR_H, 0.14, METAL);
      }
      roomBox(B, f, side, hw + REVEAL, o.w || 9, o.depth || 9, o.h || 5.6, PALE[ci], o.furnish ? { ...o, wall: PALE[ci].map((v) => v * 0.7) } : o);
      // (o.slide: the leaf slides that way, 4.1 m; one that slides against the frame runs on a second track, 9 cm nearer the corridor)
      doors.push(leafDoor(B, f, side, hw + REVEAL - (o.slide < 0 ? 0.12 : 0.03), DOOR_W + 0.3, o.furnish ? PANE_Y : DOOR_H + 0.1, o.furnish ? mix3(WHITE, leafCol, 0.3) : leafCol, o.slide || 1, o.slide ? 4.1 : DOOR_W + 0.4, o.furnish ? PALE[ci].map((v) => v * 0.42) : null));
      spill.push(onWall(f, side, hw, q, ci, 1));
      plain.push({ B, f, side, d0: hw + REVEAL, depth: o.depth || 9, w: o.w || 9, furnish: !!o.furnish, ci });
    }
    // a wall niche 4.2 m wide, 5 m high and 2.5 m deep, for one large thing that stands wholly inside it; `far` niches
    // stand empty (too far to be read)
    const NICHE_W = 4.2, NICHE_D = 2.5, BC = makeShellBuilder();
    // AN ALCOVE (round eleven b: in the flown corridor and in the link every niche is one): an opening as wide and as
    // high as a niche with A SMALL ROOM behind it, ALCOVE_D deep: a floor that goes back, side walls a tone darker
    // than its back wall, the back wall in one of the four saturated colours (dealt); in it A STANDING LAMP LIT WARM
    // (where the shader's light for a furnished room stands: a metre toward the south of its middle, a little past
    // half way in) and A TREE IN A TUB of one of two kinds (dealt). Never a flat sheet of one colour.
    const ALCOVE_D = 4.2, PANE_Y = 4.2, alcoves = [];
    function alcove(B, frame, q, side, hw, open, spill) {
      const f = frame(q), ci = rAlc.int(0, 3);
      open.push([q - NICHE_W / 2, q + NICHE_W / 2]);
      roomBox(B, f, side, hw + 0.12, NICHE_W - 0.04, ALCOVE_D - 0.12, DOOR_H - 0.02, PALE[ci], { y0: 0.012, wall: PALE[ci].map((v) => v * 0.7) });
      spill.push(onWall(f, side, hw, q, ci, 3));
      alcoves.push({ B, f, side, d0: hw + 0.12 });
    }
    // THE WARM LAMPS ON BRACKETS (round five): on every plain stretch of a wall one to each 6 m (a wall has no stretch
    // longer than 6 m without a door, a niche, a bay or a lamp), 3.9 m up; and one on the back wall of every niche that
    // is near enough to be read, 4.6 m up, over the thing that stands there. Each: { x, y, z, nx, nz, free } (n: out of
    // its wall; free: the metres of plain wall it has to either side: its light on the wall ends there)
    const lampsCor = [], lampsNicheC = [], lampsLink = [], lampsNicheO = [];
    const wallLamps = (out, frame, hw, side, a, b, open, y) => {
      // (n: the place's number in the lights' wave at the lamp's own metre: the corridor's centre line's there, as its
      // cove's is: the lamp swells with its cove)
      for (const [q, free] of lampSpots(a, b, open)) { const f = frame(q); out.push({ x: f[0] - f[3] * hw * side, y, z: f[1] + f[2] * hw * side, nx: f[3] * side, nz: -f[2] * side, free, q, side, n: f[0] + f[1] }); }
    };
    // (a shell's floor mirrors its own walls' lamps: the list goes to its material, the nearest to the entry first)
    const mirrorLamps = (mat, list) => list.slice(0, 64).forEach((L, i) => mat.uniforms.uLampW.value[i].set(L.q, L.side * L.free));
    function niche(B, frame, q, side, hw, open, spill, far, W = NICHE_W, kind = -1) {
      const f = frame(q), fa = frame(q - W / 2), fb = frame(q + W / 2), ci = rNiche.int(0, 5);
      open.push([q - W / 2, q + W / 2]);
      // on a bend the opening is as wide as its chord on that wall; the box stands inside the reveal's depth
      const w = Math.hypot(fb[0] - fb[3] * hw * side - fa[0] + fa[3] * hw * side, fb[1] + fb[2] * hw * side - fa[1] - fa[2] * hw * side);
      roomBox(B, f, side, hw + 0.12, w - 0.04, NICHE_D - 0.12, DOOR_H - 0.02, PALE[ci], { y0: 0.012 });
      spill.push(onWall(f, side, hw, q, ci, 3));
      if (!far) {
        niches.push({ B, f, side, d0: hw + 0.12, kind });
        const dn = hw + NICHE_D - 0.02;
        (B === BC ? lampsNicheC : lampsNicheO).push({ x: f[0] - f[3] * dn * side, y: 4.6, z: f[1] + f[2] * dn * side, nx: f[3] * side, nz: -f[2] * side, free: W / 2 - 0.1 });
      }
    }
    const corMat0 = makeShellMaterial(timeU, [3.5, P.CH, 0, 1], null, 1 / 140, false, leafA, skyU);
    // (the corridor's right-hand side stands open, glass and loggia, as far as this metre of run)
    corMat0.uniforms.uGalQ.value = AT.loggiaEnd;
    // THE CORRIDOR LEAVES THE LOBBY at its north-east corner and runs north to the well's rim. ITS OWN MEASURE IS THE
    // LINE'S (round eleven b): its frame is lineAt, its metres are metres of run, from the corridor's mouth
    // (RUNS.mouth, where the lobby's bend ends) to the well's south face (AT.bridge0).
    // ITS OPENINGS STAND AT ONE EVEN PITCH: the corridor's length in COR_N pitches, an opening at the middle of each.
    // THE PITCH is the least that leaves BAY_OFF metres of wall between the room behind the bay (taken as wide as
    // the widest of the three special rooms that may stand there) and a door's room in the next pitch: the
    // corridor holds as many whole pitches as its length holds of that measure (as the plan stands: four, of
    // 13.65 m). A RULE IN SPACE (clearGround): a room or an alcove stands OFF metres and more clear of the lobby
    // (its north wall with the niches in it) and of the well's own building (its foot, the part's P.H1, grown by
    // the reach of its floor plates, STACK_PROUD); a pitch whose room would not holds nothing.
    // THE LEFT-HAND WALL: THE BAY (12 m wide and 5 m high, one of three special rooms behind it) stands in the
    // pitch nearest the corridor's middle in which its room stands clear (as the plan stands the second: no other
    // would do); every other pitch holds a sliding door with its furnished room (the last holds nothing: it lies
    // in the well's building). THE RIGHT-HAND WALL begins where the loggia ends: an alcove in every pitch that
    // lies wholly on it, a metre and more from its beginning (as the plan stands: the third).
    const LB = P.LOBBY, BAY_HW = 6, BAY_ROOMS = [0, 2, 3], BAY_ROOM_HW = Math.max(...BAY_ROOMS.map((i) => ROOMS[i][1])) / 2, BAY_ROOM_D = Math.max(...BAY_ROOMS.map((i) => ROOMS[i][2]));
    const ROOM_HW = 2.7, ROOM_D = 9, BAY_OFF = 1.5, OFF = 0.5, COR_LEN = AT.bridge0 - RUNS.mouth;
    const COR_N = Math.floor(COR_LEN / (BAY_ROOM_HW + ROOM_HW + BAY_OFF)), PITCH = COR_LEN / COR_N, pitchAt = (k) => RUNS.mouth + (k + 0.5) * PITCH;
    // (the four corners of a room's ground: hw to either hand of q, and from the wall's face `depth` in)
    const clearGround = (q, side, depth, hw) => [-hw, hw].every((a) => [3.5, 3.5 + depth].every((d) => {
      const f = lineAt(q + a), x = f[0] - f[3] * d * side, z = f[1] + f[2] * d * side, g = STACK_PROUD + OFF;
      return (x < P.H1.x0 - g || x > P.H1.x1 + g || z < P.H1.z0 - g || z > P.H1.z1 + g) && (x < LB.x0 - OFF || x > LB.x1 + OFF || z < LB.z0 - LOBBY_RANK.deep - OFF);
    }));
    const BAY_K = Array.from({ length: COR_N }, (_, k) => k).filter((k) => clearGround(pitchAt(k), -1, REVEAL + BAY_ROOM_D, BAY_ROOM_HW))
      .sort((a, b) => Math.abs(a + 0.5 - COR_N / 2) - Math.abs(b + 0.5 - COR_N / 2) || a - b)[0];
    const SLOTS = [{ q: pitchAt(BAY_K), side: -1 }];
    // each bay's own light: the clocks white, the tree turquoise, the chairs cobalt
    const SPECIAL_CI = { clocks: 4, drawers: 2, tree: 3, chairs: 2, lamps: 4, paper: 4 };
    // the seed deals which of three stands in the bay: the wall of clocks, the one tree, the room of turning chairs
    const roomDeal = [BAY_ROOMS[rDeal.int(0, BAY_ROOMS.length - 1)]];
    {
      const openR = [], openL = [], spR = [], spL = [];
      SLOTS.forEach((sl, i) => {
        openL.push([sl.q - BAY_HW, sl.q + BAY_HW]);
        spL.push(onWall(lineAt(sl.q), sl.side, 3.5, sl.q, SPECIAL_CI[ROOMS[roomDeal[i]][0]], 2));
      });
      // THE LEFT-HAND WALL'S DOORS: each room is 5.4 m wide and 9 m deep, lit in one of four saturated colours (coral,
      // plum, cobalt, turquoise: dealt, no two alike) and furnished (see furnishRoom); each leaf slides north.
      const ci4 = rDoor.shuffle([0, 1, 2, 3]);
      for (let k = 0, n = 0; k < COR_N; k++) {
        const q = pitchAt(k);
        if (k !== BAY_K && clearGround(q, -1, REVEAL + ROOM_D, ROOM_HW)) door(BC, lineAt, q, -1, 3.5, openL, spL, leafA, { w: 2 * ROOM_HW, depth: ROOM_D, ci: ci4[n++ % 4], slide: 1, furnish: true });
      }
      for (let k = 0; k < COR_N; k++) {
        const q = pitchAt(k);
        if (q - NICHE_W / 2 > AT.loggiaEnd + 1 && clearGround(q, 1, ALCOVE_D, NICHE_W / 2)) alcove(BC, lineAt, q, 1, 3.5, openR, spR);
      }
      await ctx.yield();
      {
        // the corridor: its left wall whole; its right side open (the loggia) to the loggia's last metre, then its
        // own wall
        const st = stationsFor([[RUNS.mouth, AT.loggiaEnd, 15], [AT.loggiaEnd, AT.bridge0, 10]], openR, openL, spR, spL);
        sweep(BC, lineAt, st, -1, profL, openL, spL, spR);
        await ctx.yield();
        // (a station is held to a millimetre: the two pieces of the right side both take the one at the loggia's end)
        sweep(BC, lineAt, st.filter((q) => q <= AT.loggiaEnd + 2e-3), 1, profG, [], [], spL);
        sweep(BC, lineAt, st.filter((q) => q >= AT.loggiaEnd - 2e-3), 1, profR, openR, spR, spL);
        // (where the coved wall begins again: the spandrel beside its cove, looking back down the loggia; and the
        // spandrel beside the left wall's cove in the lobby's north wall)
        mouth(BC, [-68, GAL.zN, -1, 0], 3.5, P.CH, P.COVE, 0, P.CH, WHITE, [-1]);
        mouth(BC, [-68, LB.z0, -1, 0], 3.5, P.CH, P.COVE, 0, P.CH, WHITE, [1]);
        wallLamps(lampsCor, lineAt, 3.5, 1, AT.loggiaEnd + 0.3, AT.bridge0 - 0.3, openR, 3.9);
        wallLamps(lampsCor, lineAt, 3.5, -1, RUNS.mouth + 0.3, AT.bridge0 - 0.3, openL, 3.9);
      }
      {
        // THE LOGGIA (from the glass's end to z -78): the side stands open to the court and the whole great
        // hall: a low glass rail (1.2 m, a slim handrail on it), no post but the pier at the lobby's
        // corner; ITS HEAD IS A SEEN EDGE BEAM (round eleven): a white downstand 0.6 m deep and 0.35 m broad along
        // the ceiling's edge, so that the ceiling ends in a beam and not in a cut sheet.
        const gx = -64.5, gzN = GAL.zN, gzG = P.LOBBY.glassN, H = P.CH, t5 = [5, 0, -1], PALEP = lin('#eeece6'), BEAM = lin('#f4f3ee', 0.78);
        const bar = (x0, x1, y0, y1, z0, z1, col) => {
          BC.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], col, Z4, t5); BC.quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], col, Z4, t5);
          if (z1 - z0 < 1) { BC.quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], col, Z4, t5); BC.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], col, Z4, t5); }
          else { BC.quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], col, Z4, t5); BC.quad([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], col, Z4, t5); }
        };
        bar(gx - 0.3, gx, 0, H - 0.6, LB.z0 - 0.15, LB.z0 + 0.15, PALEP);
        bar(gx - 0.35, gx, H - 0.6, H - 0.001, gzN, gzG, BEAM);
        bar(gx - 0.025, gx + 0.025, 1.17, 1.21, gzN, gzG, METAL); bar(gx - 0.04, gx + 0.04, 0, 0.06, gzN, gzG, PALEP);
      }
    }
    await ctx.yield();
    // the special room behind the bay
    const TR = makeThingBuilder(), movers = { face: [], hand: [], drawer: [], blob: [], lamp: [], sheet: [], chair: [] };
    SLOTS.forEach((sl, i) => {
      const [name, w, depth, h, make] = ROOMS[roomDeal[i]];
      const back = lin(name === 'clocks' ? '#f4f1e8' : name === 'chairs' ? '#bfd4f5' : name === 'drawers' ? '#cfd6dc' : name === 'tree' ? '#c6ecee' : '#f4f3ee');
      const o = { floor: name === 'chairs' ? lin('#b9d2ee') : FLOOR };
      sl.holds = name;
      const f = lineAt(sl.q);
      roomBox(BC, f, sl.side, 3.5 + REVEAL, w, depth, h, back, o);
      make(TR, movers, roomFrame(f, sl.side, 3.5 + REVEAL, 0), rRooms, w, depth, h);
    });
    // THE LOBBY'S TREES AND PLANTERS (round eleven b): one clipped tree in a tub in each niche of the north wall's
    // rank (two kinds by turns: the court's three-tiered tree drawn out tall, and the same kept lower and
    // rounder; each turned as dealt), and the planters with their benches down the hall
    // (they are a mesh of their own: the lobby's air is clearer than a corridor's, as its own shell's is)
    const TLb = makeThingBuilder();
    for (let k = 0; k < LOBBY_RANK.n; k++) nicheTree(TLb.at(LOBBY_RANK.at(k), 0, LB.z0 - LOBBY_RANK.deep / 2, rLobT.range(0, 6.28)), k % 2);
    for (const p of LOBBY_PLANTERS) lobbyPlanter(TLb, p);
    await ctx.yield();
    // the court beside the corridor: its tables, lamps, standards and trees (its chairs are a mesh of their own)
    const TCt = makeThingBuilder(), galStages = courtThings(TCt, rGal);
    let gst = galStages.next();
    while (!gst.done) { await ctx.yield(); gst = galStages.next(); }
    const galSeats = gst.value;
    await ctx.yield();
    // (round four) a thing stands by the bay's mouth, on its far side, 0.9 m inside the room (the room of turning
    // chairs always the lamp: it is slim), and a second on its near side: a standing lamp lit warm, or a tree
    SLOTS.forEach((sl) => {
      const F = roomFrame(lineAt(sl.q), sl.side, 3.5 + REVEAL, 0), first = sl.holds === 'chairs' ? 1 : rHall.int(0, 1);
      mouthThing(TR, F, first, sl.side * 4.4, 0.9, rHall);
      mouthThing(TR, F, first === 1 ? 0 : 1, -sl.side * 4.6, 0.9, rHall);
    });
    await ctx.yield();
    // a hall's wall swept with the hall on its left hand; gaps are spans left out (a mouth stands there)
    function hallWall(B, frame, len, prof, open, gaps) {
      let a = 0;
      for (const g of gaps.concat([[len, len]])) {
        if (g[0] > a) sweep(B, frame, stationsOf(a, g[0], 400, [open]), 1, prof, open.filter((o) => o[0] > a && o[1] < g[0]));
        a = g[1];
      }
    }
    // (the flown corridor's lamps come first in the list; of the arm's the nearest to its mouth)
    mirrorLamps(corMat0, lampsCor);
    const thingMat = makeThingMaterial(timeU, 1 / 900, 0.7);
    // ------------------------------------------------------------ THE WELL OF STOREYS (round ten): its shell and rails
    const gWell = new THREE.Group();
    gWell.name = 'well of storeys';
    const thingMatW = makeThingMaterial(timeU, 0, 0.7, true);
    // (where the well's passing front stands at the clock's nought: set below, by the stream fww-well's last draw)
    const wellFront = { value: 0 };
    {
      const WB = makeWellBuilder(), st = wellShellStages(WB);
      let s = st.next();
      while (!s.done) { await ctx.yield(); s = st.next(); }
      // THE TWO PORTAL BLOCKS (plain white bodies): the corridor's and the link's own sections open in a flat face
      // at the rim, a cheek either side of each, the cheeks' sides back to the drum's wall; each block's head is
      // the under side of the gallery over it
      const asWell = { quad: (v, n) => WB.quad(v, n, 8), tri: (v, n) => WB.tri(v, n, 8) }, yT = 10 - WELL_EDGE, R1 = SH.r + SH.deep;
      for (const [zf, dz, hw, H, xw, xe] of [[GATE.s, 1, 3.5, P.CH, -72.5, -63.5], [GATE.n, -1, WAY.hw, WAY.h, -76, -60]]) {
        mouth(asWell, [-68, zf, dz, 0], hw, H, P.COVE, 0, yT, WHITE);
        for (const [xa, xb] of [[xw, -68 - hw], [-68 + hw, xe]]) WB.quad([[xa, 0, zf], [xb, 0, zf], [xb, yT, zf], [xa, yT, zf]], [0, 0, -dz], 8);
        for (const [x, nx] of [[xw, -1], [xe, 1]]) { const zw = SH.z + dz * Math.sqrt(R1 * R1 - (x - SH.x) ** 2); WB.quad([[x, 0, zf], [x, 0, zw], [x, yT, zw], [x, yT, zf]], [nx, 0, 0], 8); }
      }
      await ctx.yield();
      const hx = (h) => { const c = parseInt(h.slice(1), 16); return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255); };
      const shell = new THREE.Mesh(WB.build(), new THREE.ShaderMaterial({ uniforms: { uTime: timeU, uPalW: { value: WELL_PAL.map(hx) }, uSeedW: { value: rWell.range(0, 40) }, uFront: wellFront }, vertexShader: WELL_VERT, fragmentShader: WELL_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }));
      shell.name = 'well shell';
      gWell.add(shell);
      await ctx.yield();
      const rails = new THREE.Mesh(wellRailsGeo(), new THREE.ShaderMaterial({ vertexShader: RAIL_VERT, fragmentShader: RAIL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      rails.name = 'well rails'; rails.renderOrder = 2;
      gWell.add(rails);
      await ctx.yield();
    }
    // ------------------------------------------------------------ THE ISLAND ON ITS PLATFORM, THE PENDANT, the galleries'
    // desks, what stands on the floor's own gallery
    {
      const m4 = new THREE.Matrix4(), TI = makeThingBuilder(), spots = islandThings(TI, rIsle), ix = P.ISLAND.x, iz = P.ISLAND.z;
      const seats = spots.map(([cx, cz]) => ({ m: m4.clone().makeTranslation(ix + cx, 0, iz + cz), move: [1, rIsle.range(0.25, 0.6) * (rIsle.chance(0.5) ? 1 : -1), rIsle.range(0, 6.28), 0] }));
      for (const [g, l, name] of [[TI.build(), [{ m: m4.clone().makeTranslation(ix, 0, iz) }], 'island'], [leanChairGeo(ISLE_SEAT, 2.25), seats, 'island chairs'], [pendantGeo(), [{ m: m4.clone().makeTranslation(ix, 0, iz) }], 'pendant']]) {
        const mesh = instanced(g, thingMatW, l);
        mesh.name = name;
        gWell.add(mesh);
        await ctx.yield();
      }
      {
        // (the pendant's lamps on their rides: the clusters with their globes from 60 m under the floor up, the drums
        // alone below; each turned about the cord by its storey's height; then their halos)
        const rides = pendantRides(rPend), lampAt = ([y, per, st, reach]) => ({ m: m4.clone().makeRotationY(y * 0.21).setPosition(ix, y + PENDANT.rise - reach, iz), move: [7, per, st, reach] });
        const pl = instanced(pendantLampGeo(true), thingMatW, rides.filter(([y]) => y >= -60).map(lampAt)), plf = instanced(pendantLampGeo(false), thingMatW, rides.filter(([y]) => y < -60).map(lampAt));
        pl.name = 'pendant lamps'; plf.name = 'pendant lamps far';
        gWell.add(pl); gWell.add(plf);
        const pg = new THREE.Mesh(pendantGlowGeo(rides), new THREE.ShaderMaterial({ uniforms: { uTime: timeU }, vertexShader: PGLOW_VERT, fragmentShader: PGLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        pg.name = 'pendant glow'; pg.frustumCulled = false; pg.renderOrder = 3;
        gWell.add(pg);
      }
      await ctx.yield();
      // the galleries' desks: one to every other bay, the bays taking turns from storey to storey (the shader lays the
      // same lamps' pools on the floors); real bodies from 40 m under the floor up; none on the floor's own gallery
      // within 9 m of the line
      const desks = [], desksFar = [], e3 = new THREE.Euler(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), near = [];
      const placeAt = (a, y, rad = SH.r) => new THREE.Matrix4().compose(v3.set(SH.x + rad * Math.cos(a), y, SH.z + rad * Math.sin(a)), q4.setFromEuler(e3.set(0, Math.PI / 2 - a, 0)), one);
      for (const [y] of WELL_ST) {
        if (y < -40) continue;
        const sIdx = Math.floor(y / 5 + 0.5);
        for (let b = 0; b < WELL_BAYS; b++) {
          const a = -Math.PI + (b + 0.5) * Math.PI * 2 / WELL_BAYS, x = SH.x + (SH.r + 1.7) * Math.cos(a);
          if ((((b + sIdx) % 2) + 2) % 2 !== 0) { if (y === 0 && Math.abs(x + 68) > 9) near.push(a); continue; }
          if (y === 0 && Math.abs(x + 68) < 9) continue;
          (y >= -5 && y <= 10 ? desks : desksFar).push({ m: placeAt(a, y) });
        }
      }
      const gd = instanced(galleryDeskGeo(), thingMatW, desks), gdf = instanced(galleryDeskGeo(true), thingMatW, desksFar);
      gd.name = 'gallery desks'; gdf.name = 'gallery desks far';
      gWell.add(gd); gWell.add(gdf);
      await ctx.yield();
      // ON THE FLOOR'S OWN GALLERY, in the bays between the desks: a tree in a tub, a bench that looks over the well,
      // a standing lamp lit warm, by turns
      const TG = makeThingBuilder();
      near.forEach((a, i) => {
        const c = Math.cos(a), sn = Math.sin(a), at = (rr) => [SH.x + (SH.r + rr) * c, SH.z + (SH.r + rr) * sn], k = i % 3;
        if (k === 0) { const p = at(1.9); tubTreeParts(TG.at(p[0], 0, p[1], rWell.range(0, 6.28), 0.62)); }
        else if (k === 1) {
          const p = at(1.5);
          TG.at(p[0], 0, p[1], Math.PI / 2 - a);
          for (let j = 0; j < 4; j++) TG.box(-1.8, 1.8, 1.05, 1.13, -0.5 + j * 0.27, -0.3 + j * 0.27, ASH, 0, true);
          for (const x of [-1.5, 1.5]) TG.box(x - 0.06, x + 0.06, 0, 1.05, -0.45, 0.5, STEEL);
        } else { const p = at(1.4); TG.at(p[0], 0, p[1]).cyl(0, 0, 0.45, 0.3, 0, 0.12, STEEL, 0, 8, 1).cyl(0, 0, 0.06, 0.06, 0.12, 3.4, STEEL, 0, 5, 0).cyl(0, 0, 0.62, 0.42, 3.3, 4.05, WARM, 0.8, 8, 3, WARM, 1); }
      });
      TG.at();
      const gt = new THREE.Mesh(TG.build(), thingMatW);
      gt.name = 'gallery things';
      gWell.add(gt);
      // (THE PASSING FRONT'S START: a share of its period, the stream fww-well's last draw, after every other of it)
      wellFront.value = rWell();
    }
    scene.add(gWell);
    await ctx.yield();
    // ------------------------------------------------------------ the link: ITS FLOOR IS THE TIDE HALL'S CARPET (round
    // eleven f), in the tide's blue from the well's bridge to the hall's mouth; the band at its right wall's foot
    // (the corridor's band, in the visit's first accent colour: rose on one seed, turquoise on another) turns to the
    // tide's pale blue along the link's own building
    const blueA = hero.uniforms.tide.uBlueA.value, blueB = hero.uniforms.tide.uBlueB.value;
    const tideBlue = [(blueA.x + blueB.x) / 2, (blueA.y + blueB.y) / 2, (blueA.z + blueB.z) / 2];
    const BL = makeShellBuilder();
    {
      const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const turn = (prof, band) => prof.map((g) => (g.part !== 0 ? g : g.col === FLOOR ? { ...g, col: tideBlue } : { ...g, colAt: (q) => mixc(band, mixc(tideBlue, [1, 1, 1], 0.25), smoothstep(RUNS.link + 1, RUNS.quay - 1, q)) }));
      // (the link is the way out's own section: 14 m wide and 8 m high, its ceiling plain between its coves)
      const wide = corridorProfile(WAY.hw, WAY.h, P.COVE, bandA, FLOOR), pR = turn(wide, bandA), pL = turn(corridorProfile(WAY.hw, WAY.h, P.COVE, null, FLOOR), bandA);
      pR.hw = pL.hw = WAY.hw; pR.headD = pL.headD = wide.headD;
      const openR = [], openL = [];
      const spR = [], spL = [];
      // (the link's five openings: one every 3.5 m from 4.5 m past its building's first metre, on alternate hands: an
      // alcove, a door, a door, an alcove, an alcove. Round eleven b: each door's room is furnished and stands in one
      // of the four saturated colours; its tall side-light looks into it)
      door(BL, lineAt, RUNS.link + 11.5, 1, WAY.hw, openR, spR, leafA, { light: true, furnish: true, ci: rLinkD.int(0, 3) });
      door(BL, lineAt, RUNS.link + 8, -1, WAY.hw, openL, spL, leafA, { light: true, furnish: true, ci: rLinkD.int(0, 3) });
      alcove(BL, lineAt, RUNS.link + 4.5, 1, WAY.hw, openR, spR); alcove(BL, lineAt, RUNS.link + 18.5, 1, WAY.hw, openR, spR); alcove(BL, lineAt, RUNS.link + 15, -1, WAY.hw, openL, spL);
      run(BL, lineAt, [[AT.bridge1, RUNS.quay, 3]], openR, openL, pR, pL, spR, spL);
      wallLamps(lampsLink, lineAt, WAY.hw, 1, AT.bridge1 + 0.3, RUNS.quay - 0.3, openR, 3.9); wallLamps(lampsLink, lineAt, WAY.hw, -1, AT.bridge1 + 0.3, RUNS.quay - 0.3, openL, 3.9);
      // the quay: a rounded white nosing across the floor's end, a low kerb either side of the line's passage
      const zq = P.H2.z1, nose = [[0, 0.02], [0.2, -0.04], [0.3, -0.2], [0.3, -0.5], [0, -0.5]];
      for (let i = 0; i < nose.length - 1; i++) {
        const a = nose[i], b = nose[i + 1], nz = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nz, ny) || 1;
        BL.quad([[-68 - WAY.hw, a[1], zq - a[0]], [-68 + WAY.hw, a[1], zq - a[0]], [-68 + WAY.hw, b[1], zq - b[0]], [-68 - WAY.hw, b[1], zq - b[0]]], [0, ny / l, -nz / l], WHITE, Z4, [5, 1, 0]);
      }
      box(BL, -68 - WAY.hw, -67.5 - WAY.hw, 0, 0.4, zq - 0.25, zq + 0.3, WHITE); box(BL, -68.5 + WAY.hw, -68 + WAY.hw, 0, 0.4, zq - 0.25, zq + 0.3, WHITE);
    }
    const linkMat = makeShellMaterial(timeU, [WAY.hw, WAY.h, 0, 1], null, 1 / 500, false, leafA, skyU);
    // (its floor is the tide's carpet: the tide's own two blues and its pale lines' colour)
    linkMat.uniforms.uCarpet.value = 1;
    linkMat.uniforms.uBlueA.value = blueA; linkMat.uniforms.uBlueB.value = blueB; linkMat.uniforms.uSeam.value = hero.uniforms.tide.uSeam.value;
    mirrorLamps(linkMat, lampsLink);
    const gLink = new THREE.Mesh(BL.build(), linkMat);
    gLink.name = 'link and quay';
    scene.add(gLink);
    await ctx.yield();
    // ------------------------------------------------------------ hall two: the hall of the tide (shell)
    const BH2 = makeShellBuilder(), H2 = P.H2, C = P.CON;
    {
      const profW = wallProfile(H2.deep, H2.h, false), side = H2.x1 - H2.x0;
      // south wall with the link's mouth, east wall with the concourse's, north wall, west wall
      const walls = [[(q) => [H2.x0 + q, H2.z1, 1, 0], -68 - H2.x0, WAY.hw, WAY.h, P.COVE], [(q) => [H2.x1, H2.z1 - q, 0, -1], H2.z1 - C.z, C.w / 2, 11, 0.02],
        [(q) => [H2.x1 - q, H2.z0, -1, 0], null], [(q) => [H2.x0, H2.z0 + q, 0, 1], null]];
      for (const [frame, mq, hw, hh, rr] of walls) {
        hallWall(BH2, frame, side, profW, [], mq === null ? [] : [[mq - hw, mq + hw]]);
        if (mq !== null) mouth(BH2, frame(mq), hw, hh, rr, H2.deep, H2.h, WHITE);
      }
      // the ceiling with its round opening: wedges from the rim out to the walls
      const O = P.OC, angs = [];
      for (let i = 0; i < 96; i++) angs.push(i / 96 * Math.PI * 2);
      for (const [cx, cz] of [[H2.x0, H2.z0], [H2.x1, H2.z0], [H2.x1, H2.z1], [H2.x0, H2.z1]]) angs.push((Math.atan2(cz - O.z, cx - O.x) + Math.PI * 2) % (Math.PI * 2));
      angs.sort((a, b) => a - b);
      // (round six: the ceiling ends at the outer face of the well's deep ring)
      const rim = (a) => [O.x + (O.r + P.WELL.thick) * Math.cos(a), H2.h, O.z + (O.r + P.WELL.thick) * Math.sin(a)];
      const edge = (a) => {
        const c = Math.cos(a), sn = Math.sin(a);
        const t = Math.min(c > 1e-9 ? (H2.x1 - O.x) / c : c < -1e-9 ? (H2.x0 - O.x) / c : 1e9, sn > 1e-9 ? (H2.z1 - O.z) / sn : sn < -1e-9 ? (H2.z0 - O.z) / sn : 1e9);
        return [O.x + t * c, H2.h, O.z + t * sn];
      };
      for (let i = 0; i < angs.length; i++) { const a0 = angs[i], a1 = i + 1 < angs.length ? angs[i + 1] : angs[0] + Math.PI * 2; BH2.quad([rim(a0), rim(a1), edge(a1), edge(a0)], [0, -1, 0], WHITE, Z4, [4, 1, 0]); }
    }
    const h2Mat = makeShellMaterial(timeU, [0, H2.h, 0, 0], [0, 0, 1, 0], 1 / 900, false, null, skyU);
    const gH2 = new THREE.Mesh(BH2.build(), h2Mat);
    gH2.name = 'hall two';
    scene.add(gH2);
    await ctx.yield();
    // ------------------------------------------------------------ what rides the tide: each piece at its own fixed place in
    // plan, lifted by the tide's own function, tilted by its slope, turning slowly about its own plumb; a desk's lamp
    // answers the slope a little late. Matrices are written in update(); nothing is made there.
    const gRide = new THREE.Group(), riders = [];
    gRide.name = 'riders';
    {
      const adriftStages = adriftDealStages(ctx.seed);
      let ad = adriftStages.next();
      while (!ad.done) { await ctx.yield(); ad = adriftStages.next(); }
      const adrift = ad.value;
      fleetLampsInto(hero.uniforms.tide.tLamps.value, adrift);
      await ctx.yield();
      // (no partition stands between desks anywhere: none is dealt)
      const geos = [deskGeo(), cabinetGeo(), plantGeo(), sofaGeo(), tableGeo(), bareDeskGeo(), chairGeo(), longTableGeo()], m4 = new THREE.Matrix4();
      await ctx.yield();
      geos.forEach((geo, kind) => {
        const items = adrift.filter((q) => q.kind === kind), mesh = instanced(geo, thingMat, items.map(() => ({ m: m4 })));
        gRide.add(mesh); riders.push({ mesh, items, late: 0 });
      });
      // the desks' lamps, of two kinds (each answers the slope a little late)
      for (const straight of [0, 1]) {
        const items = adrift.filter((q) => (q.kind === 0 || q.kind === 5) && q.lamp === straight);
        if (items.length) { const lamps = instanced(lampGeo(straight), thingMat, items.map(() => ({ m: m4 }))); gRide.add(lamps); riders.push({ mesh: lamps, items, late: 0.45 }); }
      }
    }
    await ctx.yield();
    // A DARK SOFT CONTACT SHADE on the carpet under every rider, following it on the swell (tilted with the slope there)
    const shadeGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0.07, 0);
    const shadeMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: 'varying vec2 vU; void main(){ vU = uv * 2. - 1.; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec2 vU; void main(){ float d = length(max(abs(vU) - .62, 0.)) / .38; gl_FragColor = vec4(.008, .014, .07, .82 * (1. - smoothstep(.25, 1., d))); }',
    });
    const allRiders = riders.filter((R) => R.late === 0).flatMap((R) => R.items);
    const shades = new THREE.InstancedMesh(shadeGeo, shadeMat, allRiders.length);
    shades.frustumCulled = false; gRide.add(shades);
    // (round four: every rider's shade is dark to 1.3 times its footprint and gone at 1.75 times: half way at one and a
    // half times; a thin thing's shade is no narrower than 1.75 m)
    allRiders.forEach((it) => { it.sx = Math.max(it.hx, 0.5) * 3.5; it.sz = Math.max(it.hz, 0.5) * 3.5; });
    riders.push({ mesh: shades, items: allRiders, late: 0, flat: true });
    await ctx.yield();
    scene.add(gRide);
    // THE ONE THING THAT STANDS STILL IN THE TIDE: the round stair on its plinth under the round opening
    const tideStair = new THREE.Mesh(stairGeo(), thingMat);
    tideStair.name = 'tide stair'; tideStair.position.set(STAIR.x, 0, STAIR.z); tideStair.frustumCulled = false;
    scene.add(tideStair);
    await ctx.yield();
    const rUp = new THREE.Vector3(0, 1, 0), rN = new THREE.Vector3(), rQ = new THREE.Quaternion(), rY = new THREE.Quaternion(), rP = new THREE.Vector3(), rS = new THREE.Vector3(1, 1, 1), rM = new THREE.Matrix4(), rG = [0, 0];
    function ride(time) {
      for (let g = 0; g < riders.length; g++) {
        const R = riders[g], arr = R.mesh.instanceMatrix.array;
        for (let i = 0; i < R.items.length; i++) {
          const it = R.items[i];
          tideSlope(TIDE_TRAINS, it.x, it.z, time - R.late, rG);
          rQ.setFromUnitVectors(rUp, rN.set(-rG[0], 1, -rG[1]).normalize());
          rQ.multiply(rY.setFromAxisAngle(rUp, it.yaw + it.rate * time));
          rM.compose(rP.set(it.x, P.H2.floor + tideH(TIDE_TRAINS, it.x, it.z, time), it.z), rQ, R.flat ? rS.set(it.sx, 1, it.sz) : rS.set(it.size, it.size, it.size)).toArray(arr, i * 16);
        }
        R.mesh.instanceMatrix.needsUpdate = true;
      }
    }
    ride(0);
    await ctx.yield();
    // ------------------------------------------------------------ the open streets: white, 14 m wide, with NO CEILING
    // AN OPEN STREET along x from x0, `len` long, about z: its walls stand plumb to `top`, a line of light at lineY over
    // the door heads; on each wall a door every 14 m and a niche half way between, the left wall's 3.5 m on from the
    // right's; a warm lamp on a bracket on every plain stretch between them (into `lamps`); the great doorway's warm
    // light lies down the whole floor from the tower's foot, strongest there. (The fifth number of its frame: in a
    // street the lights' wave runs TOWARD THE TOWER: its phase goes by z - x.)
    const lampsOut = [];
    async function openStreet(B, x0, z, len, w, top, lineY, warm = 0.3, warm0 = 0) {
      const frame = (q) => [x0 + q, z, 1, 0, -1], hw = w / 2;
      const base = corridorProfile(hw, 11, 2, bandB).filter((g) => g.part === 0 || g.low);
      const prof = base.concat([{ a: [hw, DOOR_H], b: [hw, lineY], part: 1, col: WHITE }, { a: [hw, lineY], b: [hw, lineY + 0.35], part: 2, col: WHITE }, { a: [hw, lineY + 0.35], b: [hw, top], part: 1, col: WHITE }]);
      prof.hw = hw; prof.headD = hw;
      const openR = [], openL = [], spR = [], spL = [];
      for (const [side, open, spill, d0] of [[1, openR, spR, 6], [-1, openL, spL, 9.5]]) {
        for (let q = d0; q < len - 9; q += 14) door(B, frame, q, side, hw, open, spill, leafB);
        for (let q = d0 + 7; q < len - 9; q += 14) niche(B, frame, q, side, hw, open, spill);
        for (const [q, free] of lampSpots(0.6, len - 0.6, open)) lampsOut.push({ x: x0 + q, y: 3.6, z: z + hw * side, nx: 0, nz: -side, free });
      }
      const glow = (q) => { const t = clamp(q / len, 0, 1); return warm0 + warm * t * t * t * t; };
      const profW = prof.map((g) => (g.part !== 0 ? g : { ...g, colAt: (q) => mix3(g.col, LIFT_WARM, glow(q)) }));
      profW.hw = prof.hw; profW.headD = prof.headD;
      await runLong(B, frame, [[0, len, 6]], openR, openL, profW, profW, spR, spL);
      await ctx.yield();
    }
    // (tower: the tower at the street's end, whose storeys stand in the mirror floor each in its own colour)
    // (std: its lamp standards, see uStd)
    const openMatOf = (w, top, lineY, gate, ring, tower, len = 0, pool = null, std = null) => {
      const mat = makeShellMaterial(timeU, [w / 2, top, lineY + 0.17, 1], null, 1 / 6000, true, leafB, skyU);
      mat.uniforms.uOpenL.value = len;
      if (pool) mat.uniforms.uPool.value.set(...pool);
      if (std) mat.uniforms.uStd.value.set(...std);
      const storeys = tower.pile.filter((b) => !b.plate), pal = hero.uniforms.roof.uPal.value;
      // (round ten: the hero's storeys are warm white and pale gold: the towers' own list holds the pale gold, #f2dcae, at its first place)
      mat.uniforms.uSto.value.forEach((v, i) => { const ci = storeys[Math.min(i, storeys.length - 1)].ci; if (ci === 0) v.set(0.949, 0.863, 0.682); else v.copy(pal[ci]); });
      mat.uniforms.uFogIn.value.set(FOG_ABOVE.color.x, FOG_ABOVE.color.y, FOG_ABOVE.color.z);
      mat.uniforms.uGate.value.set(...gate); mat.uniforms.uRing.value.set(...ring);
      return mat;
    };
    // THE CONCOURSE (round four): from hall two's east side to the core's west foot, where the great ground doorway
    // glows. Its walls stand plumb 12.6 m (the part lays a thick coping on them). The line does not run down it: it is
    // seen from above.
    const BO = makeShellBuilder();
    await openStreet(BO, C.x0, C.z, C.x1 - 1.4 - C.x0, C.w, C.h, 8);
    // the second quay, at hall two
    box(BO, C.x0 - 0.3, C.x0 + 0.25, 0, 0.4, C.z - C.w / 2, C.z + C.w / 2, WHITE);
    const gCon = new THREE.Group();
    gCon.add(new THREE.Mesh(BO.build(), openMatOf(C.w, C.h, 8, [C.x1 - C.x0, P.CORE.door / 2, P.CORE.door, 44], [0, 0], hero.towers[0], C.x1 - 1.4 - C.x0)));
    gCon.children[0].name = 'concourse open stretch';
    await ctx.yield();
    // THE STREET (round seven): 18 m wide, along z -86 FROM THE GARDEN COURT'S EAST WALL at x 248.3 (it opens out of
    // the court: no wall stands across it) to THE FORECOURT at x 319, its walls 6.9 m (the maze's own height). THE
    // LINE RUNS DOWN IT at 9 m, over its walls' tops, to the ring.
    const BS = makeShellBuilder(), ST = P.STREET, FO = P.FORE, TB = P.TOWB, gateB = [TB.door / 2, TB.door, 40], ringB = [P.RING_Y, 8];
    await openStreet(BS, ST.x0, ST.z, FO.x0 - ST.x0, ST.w, P.ROOF, 5.65, 0.1);
    gCon.add(new THREE.Mesh(BS.build(), openMatOf(ST.w, P.ROOF, 5.65, [ST.x1 - ST.x0, ...gateB], ringB, hero.towers[1], FO.x0 - ST.x0, null, [7.75, 13, 6.7])));
    gCon.children[1].name = 'street';
    // THE FORECOURT: for its last 28 m the street opens to 32 m, so that the great doorway stands whole at the end of
    // a square of black mirror. ITS WALLS ARE NOT BLANK (round seven): they are the street's own: a door in the
    // doors' wave and a niche with its lit thing on each, warm lamps on brackets, the line of light over the door
    // heads, the slot of light at the wall's foot. Its two wing walls look east, at the doorway; beside the
    // doorway's frame its floor and its walls run on to the tower's face.
    const BF = makeShellBuilder(), frameF = (q) => [FO.x0 + q, ST.z, 1, 0, -1], lenF = ST.x1 - 1.4 - FO.x0, floorF = mix3(MIRROR, LIFT_WARM, 0.1);
    const profE = [{ a: [TB.door / 2 + P.REVEAL.broad, 0], b: [FO.hw, 0], part: 0, col: floorF }, { a: [FO.hw, 0], b: [FO.hw, P.ROOF], part: 1, col: WHITE }];
    profE.hw = FO.hw; profE.headD = FO.hw;
    await openStreet(BF, FO.x0, ST.z, lenF, 2 * FO.hw, P.ROOF, 5.65, 0, 0.1);
    run(BF, frameF, [[lenF, lenF + 5, 5]], [], [], profE, profE);
    for (const sg of [-1, 1]) BF.quad([[FO.x0, 0, ST.z + sg * ST.w / 2], [FO.x0, 0, ST.z + sg * FO.hw], [FO.x0, P.ROOF, ST.z + sg * FO.hw], [FO.x0, P.ROOF, ST.z + sg * ST.w / 2]], [1, 0, 0], WHITE, [0, sg * 12, ST.z - FO.x0, -1], [1, 1, 0]);
    gCon.add(new THREE.Mesh(BF.build(), openMatOf(2 * FO.hw, P.ROOF, 5.65, [ST.x1 - FO.x0, ...gateB], ringB, hero.towers[1], lenF, [P.POOL.x0 - FO.x0, P.POOL.x1 - FO.x0, P.POOL.hw], [5, 9, P.POOL.hw + 4])));
    gCon.children[2].name = 'forecourt';
    // the streets' lamps on their brackets, each with its light on the wall and on the floor
    const lampMeshes = (list, bodyMat, fogK, gain, drop = 3.6) => {
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
      // (a corridor's wall lamp, which has its number in the wave, swells with its cove: the things' kind 8)
      const items = list.map((L) => ({ m: m4.clone().compose(v3.set(L.x, L.y, L.z), q4.setFromAxisAngle(up, Math.atan2(L.nx, L.nz)), one), move: L.n === undefined ? undefined : [8, 0, L.n, COVE.lamp] }));
      const bodies = instanced(bracketGeo(), bodyMat, items);
      const glows = new THREE.InstancedMesh(bracketGlowGeo(drop), new THREE.ShaderMaterial({ uniforms: { uTime: timeU, uFogK: { value: fogK }, uGain: { value: gain } }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }), Math.max(items.length, 1));
      items.forEach((q, i) => glows.setMatrixAt(i, q.m));
      glows.geometry.setAttribute('aFree', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(items.length, 1)).map((_, i) => (list[i] ? list[i].free : 1)), 1));
      glows.geometry.setAttribute('aWave', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(items.length, 1) * 2).map((_, i) => { const L = list[i >> 1]; return i % 2 ? (L && L.n !== undefined ? COVE.lamp : 1) : (L && L.n !== undefined ? L.n : 0); }), 2));
      glows.count = items.length; glows.frustumCulled = false; glows.renderOrder = 3;
      bodies.name = 'bracket lamps'; glows.name = 'bracket lamps light';
      return [bodies, glows];
    };
    for (const mesh of lampMeshes(lampsOut, thingMat, 1 / 6000, 0.8)) gCon.add(mesh);
    scene.add(gCon);
    // (the link's, and those of the niches of the link and of the streets)
    for (const mesh of lampMeshes(lampsLink, thingMat, 1 / 500, 0.95, 3.9).concat(lampMeshes(lampsNicheO, thingMat, 1 / 900, 0.9, 4.58))) scene.add(mesh);
    await ctx.yield();
    // every ordinary room's one plain thing and every niche's thing: those of the first corridors go with the corridors,
    // those of hall one, the link and the concourse stand on every clock
    const TP = makeThingBuilder(), moversK = { face: [], hand: [] };
    for (let i = 0; i < plain.length; i++) {
      const g = plain[i], T = g.B === BC ? TR : TP, F = roomFrame(g.f, g.side, g.d0, 0);
      // (a furnished room's cabinet wears the room's second colour: the colour two on from its own, a quarter
      // toward white)
      if (g.furnish) furnishRoom(T, F, rPlain, g.w, g.depth, g.side, mix3(PALE[(g.ci + 2) % 4], WHITE, 0.25)); else plainThing(T, F, rPlain.int(0, 4), rPlain, g.depth);
      if (i % 8 === 7) await ctx.yield();
    }
    for (const g of alcoves) {
      const T = g.B === BC ? TR : TP, F = roomFrame(g.f, g.side, g.d0, 0), D = ALCOVE_D - 0.12;
      F.at(T, -g.side, 0, D * 0.5 + 0.3).cyl(0, 0, 0.42, 0.3, 0, 0.1, STEEL, 0, 10, 1).cyl(0, 0, 0.05, 0.05, 0.1, 2.5, STEEL, 0, 6, 0).cyl(0, 0, 0.55, 0.36, 2.45, 3.1, WARM, 0.8, 10, 3, WARM, 1);
      if (rAlc.chance(0.5)) tubTreeParts(F.at(T, g.side * 0.95, 0, D * 0.5, rAlc.range(0, 6.28), 0.5)); else addPlant(F.at(T, g.side * 0.95, 0, D * 0.5, rAlc.range(0, 6.28), 0.8));
      T.at();
    }
    for (let i = 0; i < niches.length; i++) {
      const g = niches[i];
      nicheThing(g.B === BC ? TR : TP, g.B === BC ? movers : moversK, roomFrame(g.f, g.side, g.d0, 0), g.kind >= 0 ? g.kind : rNiche.int(0, 6), rNiche, NICHE_D - 0.12);
      if (i % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
    const gCor = new THREE.Group();
    gCor.add(new THREE.Mesh(await BC.buildLong(ctx), corMat0));
    gCor.children[0].name = 'corridors and rooms';
    {
      const lobby = new THREE.Mesh(lobbyGeo(), new THREE.ShaderMaterial({ uniforms: { uTime: timeU, uSky: skyU, uFogIn: { value: new THREE.Vector3(...lin('#f4f3ee', 0.92)) } }, vertexShader: LOBBY_VERT, fragmentShader: LOBBY_FRAG, side: THREE.DoubleSide }));
      lobby.name = 'lobby';
      gCor.add(lobby);
    }
    {
      // the gallery's glazing: one clear sheet behind the posts' middle, a faint sheen on it that grows at the flat look
      // (round ten: the glass of the first 45 m, and the loggia's low glass rail from there on)
      const gg = new THREE.PlaneGeometry(GAL.glass, P.LOBBY.h);
      gg.rotateY(Math.PI / 2); gg.translate(-64.5, P.LOBBY.h / 2, GAL.z0 - GAL.glass / 2);
      {
        const z0 = GAL.zN, z1 = P.LOBBY.glassN, p = gg.attributes.position.array, n = gg.attributes.normal.array, u = gg.attributes.uv.array, ix = Array.from(gg.index.array);
        const P2 = Array.from(p).concat([-64.5, 1.17, z0, -64.5, 1.17, z1, -64.5, 0.06, z0, -64.5, 0.06, z1]), N2 = Array.from(n).concat([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]), U2 = Array.from(u).concat([0, 1, 1, 1, 0, 0, 1, 0]);
        gg.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2));
        gg.setIndex(ix.concat([4, 6, 5, 6, 7, 5]));
      }
      const glass = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: { uFogKIn: { value: 1 / 140 } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      glass.name = 'gallery glass'; glass.renderOrder = 2;
      gCor.add(glass);
    }
    await ctx.yield();
    {
      const thingMatC = makeThingMaterial(timeU, 1 / 140), parts = partsGeo();
      parts.chair = chairGeo();
      await ctx.yield();
      const still = new THREE.Mesh(await TR.buildLong(ctx), thingMatC);
      still.name = 'room things';
      gCor.add(still);
      const inLobby = new THREE.Mesh(TLb.build(), makeThingMaterial(timeU, 1 / 520));
      inLobby.name = 'lobby things';
      gCor.add(inLobby);
      await ctx.yield();
      // (the corridors' lamps on their brackets and those of their niches go with the corridors)
      for (const mesh of lampMeshes(lampsCor, thingMatC, 1 / 140, 0.95, 3.9).concat(lampMeshes(lampsNicheC, thingMatC, 1 / 140, 0.9, 4.58))) gCor.add(mesh);
      for (const k of Object.keys(movers)) if (movers[k].length) { const mv = instanced(parts[k], thingMatC, movers[k]); mv.name = 'room ' + k + 's'; gCor.add(mv); }
      {
        // THE COURT BESIDE THE CORRIDOR (round nine): its shell, its things and its chairs (plum seats, white backs;
        // about one in six turns slowly by itself) stand on every clock and are drawn from every place: the court is
        // seen through the gallery's glass and from above
        const m4 = new THREE.Matrix4(), nightMat = makeThingMaterial(timeU, 0, 0, false, true);
        const list = galSeats.map(([x, z, turn, turning]) => ({ m: m4.clone().makeRotationY(turn).setPosition(x, 0, z), move: turning ? [1, rGal.range(0.2, 0.5) * (rGal.chance(0.5) ? 1 : -1), 0, 0] : [0, 0, 0, 0] }));
        const gch = instanced(leanChairGeo(lin('#84449a'), 2.5), nightMat, list), cth = new THREE.Mesh(TCt.build(), nightMat);
        const shell = new THREE.Mesh(courtShellGeo(), new THREE.ShaderMaterial({ uniforms: { uTime: timeU, uPal: hero.uniforms.roof.uPal }, vertexShader: COURT_VERT, fragmentShader: COURT_FRAG, side: THREE.DoubleSide }));
        gch.name = 'court chairs'; cth.name = 'court things'; shell.name = 'court';
        for (const m of [shell, cth, gch]) scene.add(m);
      }
      await ctx.yield();
      const beyond = new THREE.Mesh(await TP.buildLong(ctx), thingMat);
      beyond.name = 'rooms beyond';
      scene.add(beyond);
      for (const k of ['face', 'hand']) if (moversK[k].length) { const mv = instanced(parts[k].clone(), thingMat, moversK[k]); mv.name = 'concourse ' + k + 's'; scene.add(mv); }
    }
    scene.add(gCor);
    await ctx.yield();

    // ------------------------------------------------------------ the looks (each a window between two places of the line)
    const eyeAt = (u, out) => { const h = hAt(u), q = lineAt(h); return out.set(q[0], heightAt(h), q[1]); };
    const tmpE = new THREE.Vector3(), tmpT = new THREE.Vector3();
    const RAD = Math.PI / 180;
    // ONE LOOK GIVES THE GAZE ITSELF (its whole weight) FROM THE FIRST METRE TO THE GARDEN COURT'S WALL, by places of
    // the plan only. ITS FIRST PART, THE OPENING, from the first metre to the link's first metre: a compass bearing
    // (east of north) and a pitch, each a sum of even ramps between places of the plan (ramp: even from a to b,
    // eased over 6 m at each end).
    // 1. THE HERO THROUGH THE GLASS: from the first metre the gaze goes to a mark on the hero itself (HERO_MARK: the
    //    head of its first tier, at its axis: 42 degrees east of north from the start and 5.5 degrees up; the line's
    //    own heading there is 27 degrees east of north, and the engine eases every look in from the heading over an
    //    arrival's first metres) and stays on it through the lobby and along the loggia, as far as the place from
    //    which the well's own building covers that mark (AT.covered).
    // 2. FROM THE COURT TO THE WELL: from that place the gaze sweeps left at one even rate, through the corridor's
    //    heading in its throat, to WELL_YAW degrees left of it, reached where the island's platform at the well's
    //    axis begins to stand abeam (AT.platA). The pitch goes down to WELL_DIP degrees between the loggia's last
    //    metre and that same place.
    // 3. THE WELL: yaw and dip HOLD while the platform passes abeam (twice its radius of the bridge: the island on
    //    it, the galleries ring after ring below it); from the place where it has passed (AT.platB) to the well's
    //    north face both come back evenly, the pitch to level and the yaw to the heading: in the link the gaze is
    //    the way ahead.
    // The sweep is 1.35 degrees a metre (with the dip 1.4), flown at 16 m a second: 23 degrees a second; the way
    // back 1.4 (with the pitch 1.5), flown at 15.4.
    const easeRun = (t) => t < -6 ? 0 : t > 6 ? t : (t + 6) * (t + 6) / 24, ramp = (h, a, b) => (easeRun(h - a) - easeRun(h - b)) / (b - a);
    const WELL_YAW = 45, WELL_DIP = 22;
    const openLook = (time, u) => {
      const h = hAt(u); eyeAt(u, tmpE);
      const back = ramp(h, AT.platB, AT.bridge1), turn = ramp(h, AT.covered, AT.platA), well = turn - back, deep = ramp(h, AT.loggiaEnd, AT.platA) - back;
      const dx = HERO_MARK.x - tmpE.x, dn = tmpE.z - HERO_MARK.z;
      const g = Math.atan2(dx, dn) * (1 - turn) - WELL_YAW * RAD * well, p = Math.atan2(HERO_MARK.y - tmpE.y, Math.hypot(dx, dn)) * (1 - turn) - WELL_DIP * RAD * deep, cp = Math.cos(p) * 80;
      return tmpT.set(tmpE.x + Math.sin(g) * cp, tmpE.y + Math.sin(p) * 80, tmpE.z - Math.cos(g) * cp);
    };
    // ITS SECOND PART, from the link's first metre (where the opening's look is the way ahead again) to the garden
    // court's wall. To the top of the rise the gaze is a bearing off the heading (inward: to the left) and a pitch,
    // each a sum of even ramps between places of the plan; from the top on it is the way ahead (the engine's own:
    // toward the line 10 m on) turned toward the hero by a share that goes by places.
    // 4. THE STAIR: ITS MARK IS A PLACE, the stair's axis at its middle height. That axis stands 30 m west of the
    //    line: 23 degrees inward of the heading from the quay, abeam from the wheel's first metre. THE GAZE'S
    //    BEARING IS A PULL TOWARD IT: a share of the angle from the heading to the stair's axis. The share rises
    //    evenly from nought at the quay to STAIR_PULL, two thirds, at 6 m before the wheel's first metre, and stays
    //    two thirds round the wheel: the gaze is two parts the stair's and one part the way ahead (the fleet on the
    //    swell lies ahead, between the gaze and the stair). Over the same stretch the pitch lifts to the stair's
    //    middle height (STAIR_UP degrees from the wheel); from the place where the lens begins to climb to the
    //    wheel's west point the pitch goes down, evenly, to DIP_MAX degrees: the tide, the stair's turns and then
    //    the round opening from above.
    // 5. THE HERO: ITS MARK IS ONE PLACE (HERO_MID): the point on the hero's axis half way up between the terrace
    //    its pile stands on (the walls' tops) and its capital's rim at the slab. At the wheel's west point the hero
    //    stands further inward than the pull toward the stair; the gaze keeps that pull until the wheel has brought
    //    it onto the hero's bearing, and from there its bearing is the hero's axis. ITS PITCH comes up evenly, from
    //    the west point to the top of the rise, to the pitch of HERO_MID from the lens's place at that metre. FROM
    //    THE TOP OF THE RISE TO THE HEAD PLAZA'S MIDDLE THE GAZE HOLDS ON THAT PLACE.
    // 6. THE BOULEVARD: from the head plaza's middle to 6 m before the place where the hero's near corner stands
    //    abeam (from there its face no longer looks at the eye) the hold eases evenly to A PART PULL (PART of the
    //    angle from the way ahead to the hero), and the mark comes down the axis to the middle of the first tier,
    //    the tier that stands beside the street. So down the boulevard the street lies ahead more and more, the
    //    second plaza in its middle, the hero's lower tiers rising at the left, its capital overhead. From the
    //    corner to the garden court's wall the part pull is let go, evenly: there the gaze is the way ahead
    //    again: the gate, the canal, tower B.
    const HERO_MID = new THREE.Vector3(P.CORE.x, (P.ROOF + P.SLAB) / 2, P.CORE.z), HERO_LOW = (P.ROOF + HERO_MARK.y) / 2;
    const HERO_AT = new THREE.Vector3(P.CORE.x, HERO_MID.y, P.CORE.z), STAIR_PULL = 2 / 3, DIP_MAX = 20 * RAD, PART = 0.42;
    const STAIR_UP = Math.atan2((STAIR.top + STAIR.head) / 2 - P.TIDE_EYE, P.RISE);
    // (an angle brought within half a turn of nought)
    const wrap = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vX = new THREE.Vector3(), tmpA = new THREE.Vector3();
    // (a turned toward b by the share w of the angle between them)
    const toward = (a, b, w) => { const ang = Math.acos(clamp(a.dot(b), -1, 1)); if (ang > 1e-4 && w > 0) { vX.crossVectors(a, b); if (vX.lengthSq() > 1e-10) a.applyAxisAngle(vX.normalize(), ang * w); } return a; };
    const gazeLook = (time, u) => {
      const h = hAt(u);
      if (h < RUNS.link) return openLook(time, u);
      eyeAt(u, tmpE);
      const dx = HERO_AT.x - tmpE.x, dz = HERO_AT.z - tmpE.z;
      if (h < RUNS.top) {
        const q = lineAt(h), hd = Math.atan2(q[2], -q[3]);
        // (the pull toward the stair's axis; past the west point the hero's own bearing as soon as it lies less inward)
        let b = STAIR_PULL * ramp(h, RUNS.quay, RUNS.rise - 6) * wrap(Math.atan2(STAIR.x - tmpE.x, tmpE.z - STAIR.z) - hd);
        if (h > RUNS.west) b = Math.max(wrap(Math.atan2(dx, -dz) - hd), b);
        const up = ramp(h, RUNS.west + 6, RUNS.top - 6);
        const p = (STAIR_UP * ramp(h, RUNS.quay, RUNS.rise - 6) - (STAIR_UP + DIP_MAX) * ramp(h, RUNS.rise + P.RISE_LATE, RUNS.west)) * (1 - up) + Math.atan2(HERO_MID.y - tmpE.y, Math.hypot(dx, dz)) * up, cp = Math.cos(p) * 100;
        return tmpT.set(tmpE.x + Math.sin(hd + b) * cp, tmpE.y + Math.sin(p) * 100, tmpE.z - Math.cos(hd + b) * cp);
      }
      // (the mark on the hero's axis: HERO_MID while the hold lasts, then down to the first tier's middle)
      const low = ramp(h, RUNS.plaza, RUNS.corner - 6);
      HERO_AT.y = HERO_MID.y * (1 - low) + HERO_LOW * low;
      eyeAt(Math.min(u + 10 / total, 1), tmpA);
      vA.subVectors(tmpA, tmpE).normalize();
      toward(vA, vB.subVectors(HERO_AT, tmpE).normalize(), 1 - (1 - PART) * low - PART * ramp(h, RUNS.corner, RUNS.court));
      return tmpT.copy(tmpE).addScaledVector(vA, 100);
    };
    // THE LOOK'S WINDOW: it stands open from before the first metre (LOOK_OPENS: 2 EASE metres before it, so that
    // its own fade is over where the flight begins) and closes 2 EASE metres past the garden court's wall, where
    // the look has been the way ahead for as long; its fade at either end is EASE metres of the line (the engine
    // takes a fade as a share of its window).
    const LOOK_OPENS = -2 * EASE / total, LOOK_CLOSES = uAt(RUNS.court + 2 * EASE);
    const pois = [{ at: gazeLook, from: LOOK_OPENS, to: LOOK_CLOSES, weight: 1, fade: EASE / total / (LOOK_CLOSES - LOOK_OPENS), arc: true }];

    // ------------------------------------------------------------ what is drawn, by where the eye stands
    const eye = new THREE.Vector3();
    function update(dt, time, camera) {
      timeU.value = time;
      eye.setFromMatrixPosition(camera.matrixWorld);
      // (above the ceilings, or east of the flown halls, where the floor has no ceiling at any height)
      const up = eye.y > 11.5, high = up || eye.x > 60;
      hero.above.visible = high || eye.z < GATE.n - 6;
      hero.furn.visible = high;
      hero.tide.visible = up ? eye.x < 64 : eye.z < -80 && eye.x < 50;
      gCor.visible = !high;
      gWell.visible = !high;
      gRide.visible = hero.tide.visible; tideStair.visible = hero.tide.visible;
      if (gRide.visible) ride(time);
    }

    return {
      scene, path, duration: 50, pace, pois,
      camera: { fov: 64, near: 0.3, far: 5200, lookAhead: 10, bank: 0.3 },
      portal: { shape: 'circle', radius: 8, color: '#ffe2b8' },
      post: { exposure: 1.0, bloom: { strength: 0.45, radius: 0.6, threshold: 1.25 }, grade: { saturation: 1 + 0.08 * clamp(vary.mood ?? 0.5, 0, 1), contrast: 1.03, vignette: 0.22, grain: 0.012 } },
      ride: 'none', companion: 'none',
      update,
      dispose() {},
    };
  },
};
