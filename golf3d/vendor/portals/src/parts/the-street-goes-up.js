// The Street Goes Up: the bent slab of town, its one fold function, the law of two downs,
// and everything that stands on the land or moves over it on the world's clock.
// BROUGHT IN (section 181), the one thing in this file that is: the hashes that deal this world's chance are the
// widely published form, fract of sin of a dot with a large constant (43758.5453), on that work's own constants
// (12.9898 and 78.233; 127.1 and 311.7; 127.1, 311.7 and 74.7), mixed here in this file's own ways as h21, h31,
// h11 and the town's vH, once inline as the smoke's own screen grain (grainE), and once in javascript at the
// roofs' re-laying. Two of those add a number of this file's own beside the published ones and are brought in all
// the same: the town's vH takes a third constant, 37.719, and h11 adds 3.7 INSIDE THE SINE, after its one argument
// has been scaled by 127.1. The constants and the trick are the published thing and not any one arrangement of
// them, so the line is owed here and stands here, at each of the thirteen places below and in this round's hand-in.
// A FOURTEENTH PLACE LIFTS ONE OF THOSE CONSTANTS ALONE, WITHOUT THE TRICK: a green's tree heights are dealt by
// the sine of a running count times 12.9898, with no fract and no 43758.5453. It is not the published form and so
// carries no mark, and it is written down here so that a reader who counts the constants rather than the whole
// trick (a search for 12.9898 finds all fourteen) is not left to wonder which of them was missed.
// NO LICENCE STATEMENT HAS BEEN FOUND for this form, and NO TERMS ARE CLAIMED for it.
// AND AN ENTRY IS OWED IN THE SITE'S OWN NOTICES (THIRD-PARTY-NOTICES.txt), which the lead read on 14 Oct.
// It does NOT name this form: its hash entry is Hash without Sine, the sine-FREE hashes, which are the work
// published to replace this one, and its also-with-thanks names only mulberry32. That file is the owner's;
// the owner was told on 14 Oct.
// Everything else in this file is written for it or is the kit's own.
// THE READS OF THE EYE in the drawing of the air (cloud and smoke), named here because each is of an edge or of light:
// 1. THE CLOUD'S SKIN IS CUT WHERE IT TURNS FROM THE EYE (makeSmokeMaterial). A lump of cloud is a blunt ball; the part
//    of its skin that lies across the line of sight is left out, sooner where the cloud's own billows stand low, so a
//    lump's outline is ragged and never ruled. The thin bank on the wall is thinned there in the same way and not cut.
//    It moves no skin and lights nothing.
// 2. THE SMOKE'S EDGE IS CUT AND LIT THROUGH BY THE EYE (makePuffMaterial). The part of a puff's skin that lies across
//    the line of sight is left out in tufts. On a steamer's column more of it is left out as the puff grows old, from
//    three fifths of its way up; the chimneys' ropes are not eaten with age. And where the eye looks toward the sun
//    through that thin edge, the sun's colour is added to it. The tufts' cut carries a fine grain by the pixel's own
//    place on the screen, as it did before this round: that grain stands still on the screen and not on the puff.
// 3. THE CLOUD'S SOFT EDGE IS LAID BACK IN DEPTH (makeSmokeMaterial). What is read: the depth before the lens of a
//    pixel of the cloud's one-pixel soft edge. What is done: that pixel is written into the depth buffer 80 m further
//    from the lens than it stands, so that cloud lying close behind it is drawn whole through it and no sky shows in
//    the seam between two lumps. What it never does: it moves no pixel on the screen, fades nothing and swaps nothing,
//    and it is the same 80 m at every distance, measured along the lens's own axis. Its one cost: where a solid
//    thing stands less than 80 m behind a cloud's edge, that edge pixel is hidden by it and the edge is drawn hard
//    there; and which things stand so can change as the lens turns or moves, so a rim can go from soft to hard.
// AND TWO LAWS OF FINENESS there, each by a pixel's own footprint. THE LAW SAID EXACTLY IS OF A THING'S OWN
// STRENGTH AND NOT OF THE AIR BETWEEN: nothing of the cloud, the bank, the ropes, the steamers' puffs or the wisps
// is shown, hidden, sized or faded OF ITSELF by its distance from the lens (the one read of depth is the third read
// above: it fades and swaps nothing, and the one pixel of edge it can cost is told there). THE AIR BETWEEN IS READ
// BY DISTANCE, here as everywhere in this world: airFogShare takes the length of air between the lens and the thing
// and mixes its colour toward the haze by it, which is light's own doing and lawful, and it reaches the cloud, the
// bank, the puffs and the wisps alike. An earlier draft of this head said flatly that no distance from the lens
// fades anything here, which read as a claim about the air too and was therefore untrue as printed. The two laws:
// - the cloud's cut is one pixel soft: the skin goes from nothing to whole across the pixel's own footprint of the cut;
// - a chimney wisp's two scales of billow each fade to their own mean as the pixel's footprint on the blade outgrows
//   them, and the whole plume fades to its mean across its blade as the blade grows narrow on the screen: the fade
//   begins when the blade is about 8 pixels wide and is whole at 2 (so too a blade seen on edge).
// ONE MATERIAL OF THIS FILE IS NOT SO, AND IT IS NAMED HERE BECAUSE IT IS UNTRUE, AND IT IS FOUR DRAWINGS AND NOT
//    ONE. A wisp, a rope and a steamer's puff are lit by the sun and placed by the land, and each has one strength
//    at every distance. The point sprites are not: makeDotMaterial breaks both laws at once, and FOUR THINGS ARE
//    DRAWN WITH IT -- the fountain's jets, the toy balloons, the engine's steam and the canal leap's spray. (An
//    earlier draft of this head named the engine's steam alone, which understated the debt by three.) The sprites
//    SIZE themselves from the depth before the lens, which perspective asks for, but under a floor of one and a
//    half pixels, and that floor holds a thing visible at a size its own body no longer calls for; the screen's own
//    height is read into that size each frame, which is the one read of the screen in this file outside the smoke's
//    grain. And they take their normal from the sprite's own corner, which is the lens's own frame, and light it by
//    a fixed vector instead of by the sun, so the lit side of every drop stays put on the screen as the lens turns
//    about it. THE HONEST MEND of the first: let the size fall below the floor and carry the lost area into the
//    strength, so a far drop goes to its own share of the pixel instead of being held up to a pixel and a half. Of
//    the second: build the normal in the camera's own basis and light it with uSun, uShade and uSkyCol, as a puff of
//    smoke is lit a few lines above. One mend in one material cures all four. Both wait for a round of their own.
// THE TRUTH OF THE TWO CUTS NAMED AT 1 AND 2 ABOVE (the cloud's skin and the smoke's edge), said plainly, as the
//    rule of reading asks of any term that reads the eye's bearing. Both cuts are made by one term: how squarely
//    the skin faces the eye (the size of the dot of its normal with the direction to the eye). On a ROUND lump
//    that reads the bearing as light does, standing in for how much of the lump's own material the ray crosses,
//    long through the middle and short at the rim, so a lump thins to nothing at its own silhouette as a ball of
//    droplets does. TWO PLACES WHERE IT IS NOT TRUE, AND THE HONEST MEND OF EACH:
//  - THE LEVEL HEAPS' PLATES. Out toward a heap's edge a lump is pressed to a plate a metre or three thick and
//    forty across, and the drawing still reads it by its lump's BALL normal: it reports a ball's chord where the
//    ray crosses a metre of cloud, so a plate's flat top is drawn as firm as a ball's flank, and its lip, hardly
//    moved by a facing that barely changes over all the skin a plate turns to the eye, falls wherever the
//    twenty-metre lobes cross, in one long smooth curve: a ruled rim. THE HONEST MEND: carry each lump's own
//    flatness with its corner beside the latitude, build the lump's true normal from its own three radii, read the
//    facing and the light of THAT, and let the strength read the lump's true chord along the ray; a plate is then
//    faint where the ray crosses little of it and firm where it crosses its length, as light does, and its rim is
//    its own and wants no trimming. It needs one carried number more than aLocal has room for, so it waits for a
//    round of its own. (A round of 14 Oct raised the cut toward a lump's crown and foot to trim that skin away
//    instead of making the reading true; it was measured against this drawing and it did not win, so nothing of
//    it stands here and the want is still the want.)
//  - THE SMOKE'S PUFFS. A puff is a ball of droplets and is drawn as one: its facing stands in for how much of
//    its own body a ray crosses, long through the middle and short at the rim, so the reading is true of the body
//    that is there and nothing is faded to cover anything. A round of 14 Oct drew the body longer along its
//    column's axis and leaned its normal to match; eight strangers preferred the columns as they stand here,
//    saying the drawn-out ones read as marks on the lens, so that work was taken out again and the puffs are the
//    ball's own as before. What the ball's reading does NOT yet carry is the column itself: a puff and the one
//    behind it are two balls and meet as two, and that is the honest want here, to be mended by giving the column
//    a body of its own rather than by stretching a ball and calling it one.
// THE REST OF THE FILE IS NOT UNDER THE LAW OF THE LINES ABOVE, AND IT IS HONEST TO SAY SO HERE RATHER THAN LET
//    THAT LAW BE READ AS THE WHOLE FILE'S. No count of the reads of the eye is given here, because an earlier
//    draft gave one (nine) that matched no list anyone could audit. What follows is the list itself.
//    LAWFUL, each reading the bearing or the air as light does: airFogShare's length of air and its own turn
//    toward the sun, so the haze brightens that way; the town's window glass and the wet road, where a sheen and a
//    rim turn with the view; the sky dome, whose colour is of the direction looked in; the canal's, the leap's and
//    the hung lake's fresnel and their reflections; THE GREAT SEA'S OWN FRESNEL AND ITS SKY MIRROR, which an
//    earlier draft left out of this list altogether; the lake's fades by the pixel's footprint, which do go TO
//    THEIR OWN MEAN; and the sprites' corner normal, named above, as the shape of a drop and nothing else.
//    AND ONE READ OF THE LENS'S OWN PLACE THAT IS NEITHER A FADE NOR A LIGHT: the sky dome is moved to stand on
//    the lens every frame, which is what makes its colour a colour of the direction looked in at all. It shows,
//    hides and sizes nothing; it is named because an earlier draft said the movers are placed by the world's clock
//    alone, and this one is placed by the camera.
//    NOT LAWFUL, named here with the honest mend of each, to be mended in rounds of their own; the sprites above
//    are one of them, and these are the rest:
//  - THE SEA'S WHITECAPS AND ITS GLINTS are let go TO NOTHING as the pixel outgrows their cell, and faded out
//    again where the pixel is far finer than it, so the far sea loses the froth's own mean instead of keeping it.
//    The glints are also hidden outright by a term of the DISTANCE from the lens, and the swell's bands damped by
//    the same term, neither of which is a footprint. THE MEND: carry each to its own mean coverage, its share of
//    the cell's own area, as it goes under the pixel, and key the hiding to that footprint too.
//  - THE SEA'S SWELL AND ITS GLITTER ROAD are damped and flattened by the DISTANCE FROM THE LENS and not by a
//    footprint. The damping itself is lawful, a cosine damped toward nothing going to its own mean; its key is
//    not. THE MEND: key both to the pixel's footprint, which is worked out in the same shader (below the swell's
//    own lines, above the glitter road's; an earlier draft said a few lines above both, which was wrong twice).
//  - THE TOWN'S FADES BY THE PIXEL'S FOOTPRINT MOSTLY GO TO ONE AND NOT TO THEIR OWN MEAN, and this is a family of
//    a dozen and not the one brick front an earlier draft of this head confessed. The idiom through the town's
//    shader is to multiply the albedo by a mix from ONE toward the pattern, keyed to the footprint, so as the
//    pixel outgrows the pattern the pattern is let go to FULL BRIGHTNESS. The patterns' own means are a little
//    under one, so the far town ends a few parts in a hundred too bright, pattern by pattern: the brick front's
//    mean is about .96 and the whole mix is laid at .85, so its own gap is about three and a half parts in a
//    hundred, not the four an earlier draft claimed; the roof courses' mean is about .95; the setts' is about .91,
//    the widest gap of the lot. The rain streaks under the sills, the window reveals, the broad flags, the
//    squares' fans, the gutter's shade and the verge's highlight all go the same way, and THE GLAZING BARS GO TO
//    NOTHING, which is the very fault this head condemns in the sea's whitecaps. Three fades there ARE lawful and
//    stand as the pattern for the mend: the panes and the kerb go to about their own share of the cell, and the
//    slates' patches have a mean of one. THE MEND, one idiom in a dozen places: fade each pattern to its own mean
//    rather than to one, which is a round of its own and WILL move pixels in the far town.
//    None of these is this round's work and none is touched by it; they are written down because this head is
//    where a reader must be able to find them. A reader found the first three on 14 Oct and a second reader, set
//    on this head against this code before the hand-in, found the town's family and the sprites' other three users
//    the same evening.
// THIS ROUND (the smoke over the sea, and the pots of the town) IS TOLD WHOLE AT ITS TWO PLACES BELOW, at the
//    steamers' smoke and at the chimney wisps, and in short: a steamer's plume is now sized by the ship under it,
//    two and a half of her own 75.4 m lengths of trail where it was six and a third, so that the ship reads as its
//    source; the sea answers the same wind as the town's chimneys, 17 degrees of standing drift and a fifth again
//    of the day's breeze, leaning down the wall as they do, and the trail bends further over as it climbs; and a
//    fire is in some houses and not in most, WHICH HOUSE HAS ONE TOLD BY ITS PLACE ALONE through the kit's own hash
//    of its row and plot, with no seed, no clock and no draw in that name, and each lit pot with its own size from
//    the same hash. (How many lit pots are DRAWN is capped by the room in the mesh, seven hundred at full detail
//    and four hundred and twenty at the lowest the site uses, and the lit places come to about three hundred and
//    twenty on every seed measured, so the cap does not bite; if it ever did, the shuffled list and not the place
//    would decide which pots stood, and that is why the cap is named here.) NOTHING OF THIS ROUND READS THE EYE:
//    not the lens's place, its depth, its facing, its screen or its footprint. Two laws it leans on are older than
//    it: a pot whose plume would come within two metres of the flown line burns lower or not at all, which is the
//    route's own reckoning and not the lens's; and the wisp's two fades by the pixel's footprint, which are named
//    in the laws of fineness above and were not touched.
// THE WALL'S LARGER THINGS: twelve things of the town's own kind (WALL_THINGS) stand at typed places on the wall's far
// reaches, the same on every seed; a plot one of them takes is marked as a churchyard's is, so it holds no house, garden
// or tree, and nothing is dealt again. The far houses' forms come from one stream of their own ('wall-teeth:' and the seed).
import * as THREE from 'three';

// ---------- the land, in metres ----------
export const LAND = {
  z0: -426, z1: 910,          // the slab's two cut ends
  floorY: 3,                  // top of the level floor
  sCrease: 220,               // plan distance from the quay's edge where the bend begins
  R: 40,                      // radius of the bend
  wallX: 260,                 // the wall's plane
  rimY: 374,                  // the wall's top edge
  thick: 30,                  // thickness of the slab
  avenueZ: -60, canalZ: 875,
};
const HALF_PI = Math.PI / 2;
export const S_WALL = LAND.sCrease + LAND.R * HALF_PI;          // plan s where the wall begins
export const S_RIM = S_WALL + (LAND.rimY - LAND.floorY - LAND.R); // plan s of the rim
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- THE FOLD FUNCTION ----------
// Plan coordinates: s from the quay's edge along the street, z across, h above the ground.
// basisAt(s) gives the ground point and the two turned axes there (along, up); z is never turned.
export function basisAt(s, out = {}) {
  const a = clamp((s - LAND.sCrease) / LAND.R, 0, HALF_PI);
  const ca = Math.cos(a), sa = Math.sin(a);
  out.a = a;
  out.ax = ca; out.ay = sa;          // along
  out.ux = -sa; out.uy = ca;         // up
  out.gx = Math.min(s, LAND.sCrease) + LAND.R * sa;
  out.gy = LAND.floorY + LAND.R * (1 - ca) + Math.max(s - S_WALL, 0);
  return out;
}
const _b = {};
export function fold(s, z, h, out = new THREE.Vector3()) {
  basisAt(s, _b);
  return out.set(_b.gx + h * _b.ux, _b.gy + h * _b.uy, z);
}
// world matrix of a rigid thing standing at plan (s, z), lifted h, turned yaw about its own up, scaled.
// Its local axes: x along the street, y its own up, z across (world z).
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
export function standAt(s, z, h, yaw, scale, out = new THREE.Matrix4()) {
  basisAt(s, _b);
  // columns: local x -> along the street ; local y -> up ; local z -> world z. Determinant +1.
  _m1.set(
    _b.ax, _b.ux, 0, _b.gx + h * _b.ux,
    _b.ay, _b.uy, 0, _b.gy + h * _b.uy,
    0, 0, 1, z,
    0, 0, 0, 1);
  if (yaw) _m1.multiply(_m2.makeRotationY(yaw));
  if (scale !== undefined && scale !== 1) {
    if (typeof scale === 'number') _m1.scale(_v0.set(scale, scale, scale)); else _m1.scale(scale);
  }
  return out.copy(_m1);
}
const _v0 = new THREE.Vector3();

// ---------- THE LAW OF TWO DOWNS ----------
// Within 60 m of the town's ground a thing falls toward that ground; beyond 90 m toward the sea;
// between, the pull turns smoothly. Behind the wall's plane there is only the sea's down.
export function downAt(px, py, pz, out = new THREE.Vector3()) {
  const zc = clamp(pz, LAND.z0, LAND.z1), dz = pz - zc;
  let nx, ny, nz, d;
  const cx = LAND.sCrease, cy = LAND.floorY + LAND.R;
  if (px >= cx && py <= cy && px <= LAND.wallX + 60) {
    // under the bend: the nearest ground is on the quarter cylinder, the normal points at its axis
    const vx = px - cx, vy = py - cy, l = Math.max(Math.hypot(vx, vy), 0.001);
    const qx = cx + LAND.R * vx / l, qy = cy + LAND.R * vy / l;
    const ex = px - qx, ey = py - qy; d = Math.max(Math.hypot(ex, ey, dz), 0.001);
    nx = ex / d; ny = ey / d; nz = dz / d;
  } else {
    const fx = px - clamp(px, 0, cx), fy = py - LAND.floorY;
    const df = Math.max(Math.hypot(fx, fy, dz), 0.001);
    const wx = px - LAND.wallX, wy = py - clamp(py, cy, LAND.rimY);
    const dw = Math.max(Math.hypot(wx, wy, dz), 0.001);
    const m = smooth(-8, 8, df - dw);          // floor and wall equally near: mixed over 16 m
    nx = lerp(fx / df, wx / dw, m); ny = lerp(fy / df, wy / dw, m); nz = lerp(dz / df, dz / dw, m);
    d = lerp(df, dw, m);
  }
  let w = 1 - smooth(60, 90, d);
  if (px > LAND.wallX) w = 0;
  const ox = -nx * w, oy = -ny * w - (1 - w), oz = -nz * w;
  const l = Math.max(Math.hypot(ox, oy, oz), 0.001);
  return out.set(ox / l, oy / l, oz / l);
}

// ---------- light and air, the same text in every shader of the world ----------
// The slab's own shadow is found by a ray to the sun against the wall's box; there is no shadow map.
export const ROW0 = 16, ROW_STEP = 19, CASTERS = 23;      // terraces: plan s of the first row's centre, and their spacing
// a works chimney: a round stack of the town's own brick on a square engine house, tapering to a corbelled
// crown black with soot, hooped with iron; its sizes are the shade it throws and the mouth its smoke leaves by
export const CHIMNEY = { tall: 34, house: 5, foot: 3.0, top: 1.7, n: 12 };
// THE STREETS THAT GO UP: across the town a plot is 8 m; of every eight plots the last two are left open in every
// row alike, so between the terraces a street 16 m wide runs from the quay, round the bend and up the wall to the rim
export const STREET = { plot: 8, every: 8, open: 2, first: 8 };
const STREET_Z = LAND.z0 + STREET.first + (STREET.every - STREET.open - 0.5) * STREET.plot;   // the first street's near kerb
// THE TOWN'S TREES, sizes in metres. A garden runs GARDEN.depth back from its house's back wall, which stands
// GARDEN.wall from the row's centre; a garden tree stands GARDEN.tree out from that wall and GARDEN.aside from its
// plot's centre, on the side where no back kitchen or bay of its row stands, GARDEN.gap across the plot from its own
// house's kitchen and from its neighbour's. A house's gutters reach GARDEN.eaves from its row's centre, its back
// kitchen GARDEN.kitchen. Where a lane of gardens comes out on a street that goes up, a great tree stands in its mouth,
// GARDEN.mouth in from the street's edge. The tree's sizes are of the model: its head reaches GARDEN.head about
// its stem at the furthest of its sway, and turns in to its top at its shoulder, GARDEN.shoulder up. Garden trees
// stand small..big times the model, street trees great[0]..great[1], and no tree reaches higher over its own ground
// than GARDEN.reach: the law of its place.
export const GARDEN = { wall: 5, depth: 4.5, tree: 3.9, aside: 2.4, gap: 2.2, kitchen: 7.4, eaves: 5.74, head: 2.15, shoulder: 5.12, every: 14, mouth: 2.4, trunk: 2.9, crown: 2.0, top: 6.2, small: 0.8, big: 1.18, great: [1.45, 1.75], sway: 0.03 };
GARDEN.reach = GARDEN.top * GARDEN.great[1] * (1 + GARDEN.sway);
// THE TOWN'S PLAN, plot by plot: across the town a plot every STREET.plot metres, up it a terrace every ROW_STEP; the
// ground reads from it where a house stands, for a house has a garden behind it and an empty plot has none; a plot
// taken by a churchyard or by one of the wall's larger things holds no house, so no garden is laid behind it
export const PLAN = { z0: LAND.z0 + STREET.first - STREET.plot / 2, plots: Math.ceil((LAND.z1 - 6 - LAND.z0 - STREET.first) / STREET.plot), rows: Math.floor((S_RIM - 6 - ROW0) / ROW_STEP) + 1 };
function makePlan() {
  const canvas = document.createElement('canvas'); canvas.width = PLAN.plots; canvas.height = PLAN.rows;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.flipY = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return {
    tex,
    // written once, when the houses are known
    fill(houses) {
      const c2 = canvas.getContext('2d'), img = c2.createImageData(PLAN.plots, PLAN.rows), d = img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = 255;
      for (const h of houses) {
        if (h.yard) continue;
        const row = Math.round((h.s - ROW0) / ROW_STEP), j = Math.round((h.z - PLAN.z0) / STREET.plot - 0.5);
        if (row >= 0 && row < PLAN.rows && j >= 0 && j < PLAN.plots) d[(row * PLAN.plots + j) * 4] = 255;
      }
      c2.putImageData(img, 0, 0); tex.needsUpdate = true;
    },
  };
}
const STREET_GLSL = `mod(vL.z - (${STREET_Z.toFixed(1)}), ${(STREET.every * STREET.plot).toFixed(1)})`;
export const AIR_GLSL = /* glsl */`
uniform vec3 uSun; uniform vec3 uSunInv; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uBounce;
uniform vec3 uShade; uniform vec3 uFogCol; uniform float uFogD; uniform vec3 uHazeSun; uniform vec3 uZenith;
uniform vec3 uGlow; uniform vec3 uGlowDir; uniform float uLift;
float slabShadow(vec3 p) {
  vec3 t1 = (vec3(260., 3., -426.) - p) * uSunInv, t2 = (vec3(290., 374., 910.) - p) * uSunInv;
  vec3 lo = min(t1, t2), hi = max(t1, t2);
  float tn = max(max(lo.x, lo.y), lo.z), tf = min(min(hi.x, hi.y), hi.z);
  return (tf > max(tn, 0.) + .02) ? 0. : 1.;
}
// the fold read backwards: plan s and height over the town's ground of a point near the land
vec2 planOf(vec3 p) {
  if (p.x > 220. && p.y < 43.) {
    vec2 v = p.xy - vec2(220., 43.);
    return vec2(220. + 40. * atan(max(v.x, 1e-4), max(-v.y, 1e-4)), 40. - length(v));
  }
  float hf = p.y - 3., hw = 260. - p.x;
  return (p.y < 43. || hf < hw) ? vec2(min(p.x, 220.), hf) : vec2(282.832 + p.y - 43., hw);
}
// the shade one terrace throws on the next: the rows are long prisms across the street, so the sun's
// ray is followed in the plane of (s, h) to the eave and the ridge of the first row toward the sun
float rowShade(vec3 p) {
  vec2 q = planOf(p);
  float a = clamp((q.x - 220.) / 40., 0., 1.5708);
  vec2 al = vec2(cos(a), sin(a));
  float ls = dot(uSun.xy, al), lh = dot(uSun.xy, vec2(-al.y, al.x));
  float lsa = max(abs(ls), 1e-3);
  float k = ls >= 0. ? ceil((q.x + 5.4 - ${ROW0}.) / ${ROW_STEP}.) : floor((q.x - 5.4 - ${ROW0}.) / ${ROW_STEP}.);
  float c = ${ROW0}. + k * ${ROW_STEP}.;
  float rise = lh / lsa;
  float hE = q.y + rise * (abs(c - q.x) - 5.), hR = q.y + rise * abs(c - q.x);
  float open = min(smoothstep(-.5, .5, hE - 7.5), smoothstep(-.5, .5, hR - 11.));
  return open * smoothstep(0., .06, lh);
}
// the shade the tall things throw: each steeple, mill, chimney, tower and pier is a round shaft from A to B
// (its radius at each end in w); the sun's ray from p is tried against every shaft, the edge softer with distance
uniform vec4 uCastA[${CASTERS}]; uniform vec4 uCastB[${CASTERS}];
float castShade(vec3 p) {
  float lit = 1.;
  for (int i = 0; i < ${CASTERS}; i++) {
    vec3 a = uCastA[i].xyz - p, b = uCastB[i].xyz - p;
    float ta = dot(a, uSun), tb = dot(b, uSun);
    vec3 a2 = a - uSun * ta, ab = (b - uSun * tb) - a2;
    float h = clamp(dot(-a2, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
    float d = length(a2 + ab * h), t = mix(ta, tb, h), r = mix(uCastA[i].w, uCastB[i].w, h);
    float soft = .5 + max(t, 0.) * .035;
    lit *= 1. - (1. - smoothstep(r - soft, r + soft, d)) * smoothstep(r * .6, r * 1.6 + 1., t);
  }
  return lit;
}
vec3 lit(vec3 albedo, vec3 n, vec3 p, float contact, float open) {
  float sh = slabShadow(p) * open * castShade(p);
  float ndl = max(dot(n, uSun), 0.);
  float direct = smoothstep(0., .22, ndl) * sh;
  float upw = n.y * .5 + .5;
  // the fill: sky from above, the sea's and the streets' bounce from below, a little of the sun's own
  // colour thrown back off the lit town on what faces away from it
  vec3 hemi = mix(uBounce, uSkyCol, upw) * .5 + uSunCol * .04 * (1. - upw);
  vec3 sun = uSunCol * (.3 + .78 * ndl);
  // what the sun does not reach keeps the fill alone, drawn toward a blue-grey: shade is never black
  // and even in the shade the sky is brightest round the sun: what is turned that way takes more of it, and
  // a little of the hour's own colour
  float toSun = dot(n, uSun) * .5 + .5;
  vec3 shade = hemi * (uShade * 2.25 + .1) * (.76 + .4 * toSun) + uSunCol * uSunCol * (.1 * toSun * toSun);
  // where the town about it lies in the sun, what is turned from the sun is lit warm by the sunlit setts and
  // walls it faces: most what faces the ground, least what faces the sky
  shade += uSunCol * vec3(1., .88, .72) * (.2 * slabShadow(p) * (1. - .62 * upw));
  // the open shade of the late hour: the whole sky lights what the sun does not, and the sea under the sun, a
  // floor of gold from the land's foot to the horizon, throws its colour back on every face turned to it
  float gl = max(dot(n, uGlowDir), 0.);
  shade = shade * uLift + uGlow * (gl * (.35 + .65 * gl));
  vec3 c = albedo * mix(shade, sun + hemi * .62, direct);
  return c * mix(.6, 1., contact);
}
// share: how much of the haze a thing takes. The town's great things (its water, its towers, mills, arches and
// trams) are cleaner-edged and stronger in colour than the terraces about them and hold their own through the haze.
vec3 airFogShare(vec3 c, vec3 p, float share) {
  vec3 dv = p - cameraPosition; float dist = max(length(dv), 1e-3);
  float f = (1. - exp(-uFogD * dist)) * share;
  // the haze is warmer and brighter toward the sun
  float sd = max(dot(dv / dist, uSun), 0.);
  return mix(c, uFogCol + uHazeSun * sd * sd * sd, clamp(f, 0., 1.));
}
vec3 airFog(vec3 c, vec3 p) { return airFogShare(c, p, 1.); }
`;
export function makeAirUniforms() {
  return {
    uSun: { value: new THREE.Vector3(-0.9, 0.31, 0.31) }, uSunInv: { value: new THREE.Vector3(1, 1, 1) },
    uSunCol: { value: new THREE.Color('#FFF1D6') }, uSkyCol: { value: new THREE.Color('#D4E6EF') },
    uBounce: { value: new THREE.Color('#7FA6C0') }, uShade: { value: new THREE.Vector3(0.35, 0.43, 0.57) },
    uFogCol: { value: new THREE.Color('#D4E6EF') }, uFogD: { value: 0.00042 }, uHazeSun: { value: new THREE.Color(0.1, 0.07, 0.03) },
    uZenith: { value: new THREE.Color('#4E8FCF') },
    uGlow: { value: new THREE.Color(0, 0, 0) }, uGlowDir: { value: new THREE.Vector3(-0.6, -0.4, -0.7).normalize() }, uLift: { value: 1 },
    uTime: { value: 0 }, uPlan: { value: null },
    uCastA: { value: Array.from({ length: CASTERS }, () => new THREE.Vector4(0, -900, 0, 0)) },
    uCastB: { value: Array.from({ length: CASTERS }, () => new THREE.Vector4(0, -901, 0, 0)) },
  };
}

// ---------- a small mesh builder: faceted triangles with colour, model coordinates and a surface kind ----------
// kinds: 0 plain, 1 house wall, 2 roof, 3 town ground (model coordinates are plan s, h, z), 4 rock, 5 tram enamel, 6 cloth,
// 7 washing, 8 wing, 9 dressed stone, 10 a brick vault, 11 a round brick stack, 12 a church's banded slating, 13 churchyard turf (and, above the ground, the yard trees' leaves),
// 14 the leaves of the garden and street trees
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.l = []; this.k = []; this.m = null; this.count = 0; }
  tri(a, b, c, col, kind = 0) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.max(Math.hypot(nx, ny, nz), 1e-9); nx /= l; ny /= l; nz /= l;
    const m = this.m;
    for (const q of [a, b, c]) {
      if (m) {
        const e = m.elements, x = q[0], y = q[1], z = q[2];
        this.p.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
        const X = e[0] * nx + e[4] * ny + e[8] * nz, Y = e[1] * nx + e[5] * ny + e[9] * nz, Z = e[2] * nx + e[6] * ny + e[10] * nz;
        const L = Math.max(Math.hypot(X, Y, Z), 1e-9);
        this.n.push(X / L, Y / L, Z / L);
      } else { this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); }
      this.c.push(col.r, col.g, col.b); this.l.push(q[0], q[1], q[2]); this.k.push(kind);
    }
    this.count++;
  }
  quad(a, b, c, d, col, kind = 0) { this.tri(a, b, c, col, kind); this.tri(a, c, d, col, kind); }
  // an upright box: centre of its base at (x, y, z), sizes sx, sy, sz; faces may be left off
  box(x, y, z, sx, sy, sz, col, kind = 0, { top = true, bottom = false, topCol = null, topKind = null } = {}) {
    const x0 = x - sx / 2, x1 = x + sx / 2, y0 = y, y1 = y + sy, z0 = z - sz / 2, z1 = z + sz / 2;
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], col, kind);
    this.quad([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], col, kind);
    this.quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], col, kind);
    this.quad([x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1], col, kind);
    if (top) this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], topCol || col, topKind ?? kind);
    if (bottom) this.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], col, kind);
  }
  // a gable roof over a box footprint, ridge along local z: eaves at y, ridge rise r
  gable(x, y, z, sx, sz, r, col, wallCol, over = 0.5) {
    const x0 = x - sx / 2 - over, x1 = x + sx / 2 + over, z0 = z - sz / 2, z1 = z + sz / 2, ye = y - over * r / (sx / 2), yr = y + r;
    this.quad([x0, ye, z0], [x0, ye, z1], [x, yr, z1], [x, yr, z0], col, 2);
    this.quad([x1, ye, z1], [x1, ye, z0], [x, yr, z0], [x, yr, z1], col, 2);
    this.tri([x - sx / 2, y, z0], [x, yr, z0], [x + sx / 2, y, z0], wallCol, 1);
    this.tri([x + sx / 2, y, z1], [x, yr, z1], [x - sx / 2, y, z1], wallCol, 1);
  }
  // a tapered round stem along local y, n sides; r1 = 0 makes a spire
  stem(x, y, z, r0, r1, h, n, col, kind = 0, cap = false) {
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const A = [x + r0 * c0, y, z + r0 * s0], B = [x + r0 * c1, y, z + r0 * s1];
      const C = [x + r1 * c1, y + h, z + r1 * s1], D = [x + r1 * c0, y + h, z + r1 * s0];
      if (r1 > 0) this.quad(A, D, C, B, col, kind); else this.tri(A, [x, y + h, z], B, col, kind);
      if (cap && r1 > 0) this.tri(D, [x, y + h, z], C, col, kind);
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aLocal', new THREE.Float32BufferAttribute(this.l, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(this.k, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- the one surface shader of the town ----------
const TOWN_VERT = /* glsl */`
attribute vec3 aCol; attribute vec3 aLocal; attribute float aKind;
#ifdef HOUSE
attribute vec3 iWall; attribute vec3 iRoof;
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying float vK; varying float vH;
uniform float uTime;
void main() {
  vec4 p = vec4(position, 1.); vec3 n = normal; vH = .5;
  #ifdef USE_INSTANCING
  float id = float(gl_InstanceID);
  // a thing's own number, from the place it stands: the same over the whole of it
  vH = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);   // (BROUGHT IN: the published hash form, see this file's head)
  // wings beat and washing stirs, each by the clock and its own number
  if (aKind > 7.5 && aKind < 8.5) p.y += abs(aLocal.z) * sin(uTime * 11. + id * 1.7) * .75;
  if (aKind > 6.5 && aKind < 7.5) p.x += sin(uTime * 2.9 + aLocal.z * 1.6 + id * 2.1) * .42 * clamp(4.4 - aLocal.y, 0., 1.6);
  // a tree's head stirs in the air, the more the higher, each by the clock and its own number
  if (aKind > 13.5 && aKind < 14.5) { p.x += sin(uTime * 1.3 + id * 1.9) * ${GARDEN.sway.toFixed(3)} * aLocal.y; p.z += sin(uTime * 1.03 + id * 2.7) * ${(GARDEN.sway * 0.6).toFixed(3)} * aLocal.y; }
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz;
  vec3 nn = mat3(modelMatrix) * n; vN = nn / max(length(nn), 1e-4);
  vC = aCol; vL = aLocal; vK = aKind;
  #ifdef HOUSE
  if (aKind > 1.5 && aKind < 2.5) vC = iRoof * aCol; else if (aKind > .5 && aKind < 1.5) vC = iWall * aCol;
  #endif
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const TOWN_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying float vK; varying float vH;
uniform float uTime; uniform sampler2D uPlan;
${AIR_GLSL}
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main() {
  vec3 n = vN / max(length(vN), 1e-4);
  if (!gl_FrontFacing) n = -n;
  float wet = 0.;
  vec3 alb = vC; float contact = 1.; float open = 1.; float k = floor(vK + .5);
  vec3 toEye = cameraPosition - vW; vec3 v = toEye / max(length(toEye), 1e-3);
  vec3 glint = vec3(0.);
  float px = max(fwidth(vL.x) + fwidth(vL.y) + fwidth(vL.z), 1e-4);     // metres across one pixel
  #ifdef HOUSE
  open = rowShade(vW);
  // the town was built quarter by quarter, each of its own kiln and quarry: districts a hundred metres and more
  // across are a little lighter or darker, warmer or cooler than their neighbours
  vec2 plan = vec2(planOf(vW).x, vW.z);
  float qa = vnoise(plan * .0085 + 3.7), qb = vnoise(plan * .0062 + 41.3);
  alb *= mix(.8, 1.16, smoothstep(.25, .75, qa)) * mix(vec3(1.06, 1., .92), vec3(.93, 1., 1.1), smoothstep(.3, .7, qb));
  // and house by house: no two roofs of a terrace have weathered alike, nor two fronts been painted in one year,
  // so a terrace is a row of houses and not one long bar, from the next street as from across the harbour
  float own = clamp(vH, 0., 1.), own2 = fract(own * 7.31);
  if (k == 2.) alb *= mix(.74, 1.22, own) * mix(vec3(1.07, 1., .92), vec3(.95, 1., 1.06), own2);
  else if (k == 1.) alb *= mix(.82, 1.16, own2);
  #endif
  if (k == 1.) {
    // a house wall: courses of brick or washed plaster, sash windows in floors of three metres with stone
    // sills and lintels, a darker foot, and the eaves' shade under the roof
    float u = vL.x + vL.z + 40.; float fine = clamp(1. - px * 1.6, 0., 1.);
    vec2 cell = vec2(u / 2.5, vL.y / 3.); vec2 f = fract(cell); float below = step(.2, vL.y) * step(vL.y, 7.02);
    float win = step(.27, f.x) * step(f.x, .73) * step(.3, f.y) * step(f.y, .8) * below;
    float sash = step(.21, f.x) * step(f.x, .79) * step(.22, f.y) * step(f.y, .88) * below - win;
    float bars = win * max(step(abs(f.x - .5), .025), step(abs(f.y - .55), .02));
    float isBrick = smoothstep(1.25, 1.7, vC.r / max(vC.b, .02) * .5);
    vec2 bq = vec2(u * 1.6 + .5 * floor(vL.y * 4.4), vL.y * 4.4);
    float brick = (.84 + .3 * h21(floor(bq))) * (1. - .22 * step(.86, fract(bq.y)));
    float wash = .9 + .2 * h21(floor(vec2(u * .35, vL.y * .22) + floor(vW.z / 8.) * 3.1));
    alb *= mix(1., mix(wash, brick, isBrick), fine * .85);
    // rain streaks under each sill and soot toward the eaves
    alb *= 1. - .12 * fine * step(f.y, .22) * step(.27, f.x) * step(f.x, .73) * below;
    float seen = max(dot(n, v), 0.); float fr = 1. - seen; fr *= fr;
    float pane = h21(floor(cell) + floor(vW.z / 8.) * 7.3);
    vec3 glass = mix(vec3(.05, .07, .10), uSkyCol * .8, .16 + .2 * pane + .6 * fr);
    alb = mix(alb, vec3(.9, .88, .82), sash * mix(.12, .9, fine));
    vec3 rv = reflect(-v, n); float toGlow = max(dot(rv, vec3(uGlowDir.x, -uGlowDir.y, uGlowDir.z)), 0.);
    glass += uGlow * (toGlow * toGlow * (.25 + 1.5 * pane * pane));
    alb = mix(alb, glass, win * mix(.28, 1., fine));
    // the panes sit a brick's length in from the face: the reveal shades a band under the lintel and down one jamb
    alb *= 1. - .5 * win * fine * max(step(.71, f.y), step(f.x, .325));
    alb = mix(alb, vec3(.88, .86, .8), bars * fine);
    // a pane throws the sun back along its mirrored ray: a bright window here and there
    vec3 rf = reflect(-uSun, n); float sp = max(dot(rf, v), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    glint = uSunCol * win * (1. - bars) * sp * sp * (.4 + 1.6 * pane) * 1.6;
    contact = smoothstep(-.6, 3.2, vL.y) * (1. - .3 * smoothstep(5.9, 7., vL.y) * step(vL.y, 7.02));
  } else if (k == 2.) {
    // a roof: courses of slate or tile, each one a shade its own, a pale ridge, lichen in long stains
    float fine = clamp(1.15 - px * 1.6, 0., 1.);
    float run = abs(vL.x) * 2.3 + vL.y * .4;
    float row = fract(run); float t = h21(floor(vec2(vL.z * 1.5 + .5 * floor(run), run)));
    float stain = h21(floor(vec2(vL.z * .9 + floor(vW.z / 8.) * 1.7, 3.))) * smoothstep(0., 3., abs(vL.x));
    float joint = fract(vL.z * 1.5 + .5 * floor(run));
    alb *= mix(1., (.64 + .36 * smoothstep(0., .22, row)) * (.78 + .44 * t) * (1. - .2 * (1. - smoothstep(0., .1, joint))), fine);
    alb *= 1. - .2 * stain;
    // slates replaced and weathered in patches a few courses across, which hold where the courses run together
    alb *= mix(1., .88 + .24 * h21(floor(vec2(vL.z * .55 + floor(run * .25) * .37, run * .25))), clamp(1.3 - px * .45, 0., 1.));
    alb = mix(alb, alb * 1.35 + .03, (1. - smoothstep(.15, .5, abs(vL.x))) * step(9.2, vL.y) * fine);
    contact = .86 + .14 * smoothstep(0., 2.5, abs(vL.x));
    alb *= 1. - .42 * smoothstep(3.55, 3.75, abs(vL.z)) * clamp(1.7 - px * 1.1, 0., 1.);
  } else if (k == 3.) {
    // the town's ground. Between two terraces a lane: flagged pavements under the house fronts, a kerb, and
    // a cobbled carriageway with a gutter down its middle; on the open places, larger flags.
    float fine = clamp(1. - px * 2., 0., 1.);
    float lane = mod(vL.x - ${ROW0}., ${ROW_STEP}.);                    // 0 at a row's centre, 5..14 the lane
    float inLane = (1. - step(.5, vL.y)) * step(5., lane) * step(lane, 14.);
    float walk = inLane * (1. - step(6.6, lane) * step(lane, 12.4));
    float kerb = inLane * (step(abs(lane - 6.6), .14) + step(abs(lane - 12.4), .14));
    float gutter = inLane * step(abs(lane - 9.5), .2);
    vec2 cb = mix(vec2(vL.x, vL.z) * 1.4, vec2(vL.x, vL.z + .5 * floor(vL.x * .6)) * vec2(.6, .45), walk);
    float t = h21(floor(cb)); vec2 cf = abs(fract(cb) - .5);
    // a street that goes up: flagged pavements under the terraces' end walls, pale kerbs, and a carriageway of
    // grey setts that crosses every lane; the lanes between the terraces are of darker setts
    float st = ${STREET_GLSL};
    float inStreet = (1. - step(.5, vL.y)) * step(st, ${(STREET.open * STREET.plot).toFixed(1)});
    float carriage = inStreet * step(3., st) * step(st, ${(STREET.open * STREET.plot - 3).toFixed(1)});
    walk = max(walk * (1. - carriage), inStreet - carriage);
    kerb = max(kerb * (1. - inStreet), inStreet * (step(abs(st - 3.), .2) + step(abs(st - ${(STREET.open * STREET.plot - 3).toFixed(1)}), .2)));
    gutter *= 1. - inStreet;
    alb *= mix(1., .66, inLane * (1. - walk) * (1. - carriage));
    alb = mix(alb, alb * .8, walk);
    alb = mix(alb, vec3(.265, .248, .226), carriage);
    alb *= mix(1., (.84 + .28 * t) * (1. - .28 * smoothstep(.36, .5, max(cf.x, cf.y))), fine);
    // the setts are worn pale in two tracks where the carts' wheels run, down every lane and up every street, and
    // laid in bands: every few courses one of darker stone goes across from kerb to kerb
    float broad = clamp(1.3 - px * .45, 0., 1.);
    float ruts = inLane * (1. - walk) * (1. - carriage) * (2. - smoothstep(.25, .6, abs(lane - 8.3)) - smoothstep(.25, .6, abs(lane - 10.7)))
      + carriage * (2. - smoothstep(.3, .7, abs(st - 5.6)) - smoothstep(.3, .7, abs(st - 10.4)));
    alb *= 1. + .17 * ruts * broad;
    float across = mix(vL.z, vL.x, carriage);
    alb *= 1. - .13 * step(fract(across / 3.4), .14) * (inLane * (1. - walk) + carriage) * (1. - min(ruts, 1.)) * broad;
    alb = mix(alb, vec3(.56, .53, .47), kerb * mix(.12, 1., fine));
    // the open places are laid in broad flags, course by course, each a tone of its own
    vec2 fl = vec2(vL.x / 3.2, vL.z / 2.2 + .5 * floor(vL.x / 3.2)); vec2 ff = abs(fract(fl) - .5);
    float fans = step(1.5, vL.y);
    float flagged = step(.5, vL.y) * (1. - fans) * clamp(1. - px * .45, 0., 1.);
    alb *= mix(1., (.9 + .2 * h21(floor(fl) + 2.)) * (1. - .22 * smoothstep(.44, .5, max(ff.x, ff.y))), flagged);
    // the squares are set in fans of small setts, pale and dark by turns, scallop over scallop
    vec2 sc = vec2(vL.z / 4.4, vL.x / 2.2); float rowS = floor(sc.y);
    vec2 sf = vec2(fract(sc.x + .5 * mod(rowS, 2.)) - .5, fract(sc.y) * .5);
    float ringS = fract(length(sf) * 7.);
    alb *= mix(1., mix(.8, 1.07, smoothstep(.35, .5, ringS) * (1. - smoothstep(.85, 1., ringS))) * (.94 + .12 * h21(vec2(rowS, floor(sc.x + .5 * mod(rowS, 2.)))) ), fans * clamp(1. - px * .5, 0., 1.));
    alb *= 1. - .3 * gutter * fine;
    // worn tracks and damp: broad stains that never repeat row to row
    float damp = h21(floor(vec2(vL.x / ${ROW_STEP}., vL.z * .11))) * .5 + h21(floor(vec2(vL.x * .21, vL.z * .05))) * .5;
    alb *= .9 + .2 * damp;
    // THE BACK GARDENS. The terraces stand back to back in pairs: of the lanes between them every other one is no
    // street but two rows of gardens, one behind each house, walled in brick plot from plot and back to back down
    // the middle: grass and a path to the back gate, beds of vegetables, a flagged yard. Where no house stands the
    // ground is left bare setts. On the wall they are the same gardens, hanging.
    float rowK = floor((vL.x - ${ROW0}.) / ${ROW_STEP}.), upper = step(9.5, lane);
    float plotAt = (vL.z - (${PLAN.z0.toFixed(1)})) / ${STREET.plot.toFixed(1)}, plotJ = floor(plotAt);
    vec2 cellG = vec2(plotJ, rowK + upper);
    float hasHouse = textureLod(uPlan, (cellG + .5) / vec2(${PLAN.plots}., ${PLAN.rows}.), 0.).r;
    float garden = inLane * (1. - step(.5, mod(rowK + 64., 2.))) * step(.5, hasHouse);
    if (garden > 0.) {
      float gd = mix(lane - 5., 14. - lane, upper);            // metres from the house's back wall, 0 to 4.5
      float gz = fract(plotAt) * ${STREET.plot.toFixed(1)};       // metres across the plot
      float g1 = h21(cellG + 3.3), g2 = h21(cellG + 17.9), g3 = h21(cellG + 41.1);
      float nearby = clamp(1.25 - px * 1.3, 0., 1.), told = clamp(1.4 - px * .5, 0., 1.);
      // grass, each lawn a green of its own, mown in stripes or let go
      vec3 grass = mix(vec3(.105, .165, .06), vec3(.19, .225, .09), g2) * (.88 + .24 * vnoise(vec2(vL.x, vL.z) * .9));
      grass = mix(grass, vec3(.24, .22, .11), .6 * step(.86, g3));       // one lawn in seven is parched
      grass *= 1. + .1 * nearby * (step(.5, fract(gz * .8)) - .5) * step(g3, .5);
      vec3 gcol = grass;
      // a flagged path from the back door to the gate in the back wall
      float pathZ = 1.6 + 4.8 * g3;
      float pathOn = step(abs(gz - pathZ), .45);
      // some are flagged yards with a bed along the back wall, some kitchen gardens in rows of dark earth and
      // green across the plot; the rest are lawn with a border of flowers down one side
      if (g1 > .78) {
        vec2 fq = vec2(gd / .9, gz / .9 + .5 * floor(gd / .9)); vec2 fa = abs(fract(fq) - .5);
        vec3 yard = vec3(.34, .31, .27) * (.86 + .28 * h21(floor(fq) + cellG));
        yard *= 1. - .25 * nearby * smoothstep(.42, .5, max(fa.x, fa.y));
        gcol = mix(yard, grass * .8, step(3.3, gd));
        pathOn = 0.;
      } else if (g1 > .52) {
        float bedRow = fract(gz / 1.1);
        vec3 earth = vec3(.14, .1, .07), leaf = mix(vec3(.1, .2, .06), vec3(.2, .27, .08), h21(vec2(floor(gz / 1.1), g2 * 9.)));
        vec3 beds = mix(mix(earth, leaf, .55), mix(earth, leaf, smoothstep(.2, .35, bedRow) * (1. - smoothstep(.75, .9, bedRow))), nearby);
        gcol = mix(grass, beds, step(1.2, gd) * (1. - pathOn));
      } else {
        float side = step(.5, g2);
        float border = step(mix(gz, ${STREET.plot.toFixed(1)} - gz, side), 1.25) * (1. - pathOn);
        vec2 fq = floor(vec2(gd, gz) * 2.6);
        float bloom = step(.72, h21(fq + cellG * 3.));
        vec3 flower = mix(vec3(.75, .2, .16), mix(vec3(.85, .65, .12), vec3(.8, .78, .7), step(.5, h21(fq + 9.))), step(.4, h21(fq + 5.)));
        gcol = mix(gcol, mix(vec3(.07, .14, .05), flower, bloom * nearby), border);
      }
      gcol = mix(gcol, vec3(.4, .36, .3) * (.9 + .2 * h21(floor(vec2(gd * 1.3, 2.)) + cellG)), pathOn * told);
      // the walls: brick, plot from plot and back to back down the middle of the lane, with a foot of shade beside
      // them; they hold as far as a wall can be told
      float wallD = min(min(gz, ${STREET.plot.toFixed(1)} - gz), 4.5 - gd);
      float wallOn = 1. - smoothstep(.16, .22, wallD);
      gcol *= 1. - .28 * (1. - smoothstep(.2, .9, wallD)) * told;
      gcol = mix(gcol, vec3(.33, .2, .15) * (.85 + .3 * g3), wallOn * told);
      alb = mix(alb, gcol * (.92 + .16 * damp), garden);
    }
    open = vL.y > .5 ? 1. : mix(rowShade(vW), 1., carriage * .6);
    contact = mix(1., .78 + .22 * smoothstep(5., 7.4, lane) * (1. - smoothstep(11.6, 14., lane)), (1. - step(.5, vL.y)) * step(4.9, lane) * step(lane, 14.1));
  } else if (k == 4.) {
    float st = h21(floor(vec2(vW.y * .35 + sin(vW.z * .02) * 3., 7.)));
    alb *= .82 + .3 * st;
    if (abs(n.y) > .7) {
      // the level top: grey rock dressed flat long ago and cracked along its joints into many-sided flags the
      // size of a doorstep, lichened in patches
      vec2 gq = vW.xz * vec2(.44, .37), gi = floor(gq), gf = fract(gq);
      float d1 = 8., d2 = 8., cid = 0.;
      for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) {
        vec2 o = vec2(float(a), float(b));
        vec2 r = o + vec2(h21(gi + o), h21(gi + o + 17.3)) - gf; float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; cid = h21(gi + o + 5.1); } else if (d < d2) d2 = d;
      }
      float fineT = clamp(1.25 - px * 1.1, 0., 1.);
      float crack = 1. - smoothstep(0., .09, sqrt(d2) - sqrt(d1));
      float grain = vnoise(vW.xz * 2.1) * .5 + vnoise(vW.xz * .23 + 5.) * .5;
      alb = mix(alb, vec3(dot(alb, vec3(.33))) * vec3(.96, 1., 1.06), .72);
      alb *= mix(1., (.86 + .24 * cid) * (1. - .42 * crack), fineT) * (.88 + .24 * grain);
      // lichen: ochre and pale stains that keep to some flags and not others
      float lich = smoothstep(.55, .8, vnoise(vW.xz * .11 + 21.) * .6 + cid * .4);
      alb = mix(alb, alb * vec3(1.16, 1.08, .8), lich * .5);
      alb *= 1. + .2 * (1. - smoothstep(260., 266., vW.x));
      // rain stands in the hollows of the top, level, and holds the sky
      float hollow = vnoise(vW.xz * vec2(.13, .085) + 3.) * .7 + vnoise(vW.xz * .41 + 11.) * .3;
      alb *= 1. - .3 * smoothstep(.52, .66, hollow);
      wet = smoothstep(.665, .685, hollow);
    }
  } else if (k == 9.) {
    // dressed stone in courses, the joints breaking from course to course; long stains of weather run down it
    float fine = clamp(1. - px * 1.6, 0., 1.);
    vec2 b = vec2((vL.x + vL.z) * .7 + .5 * floor(vL.y / .75), vL.y / .75);
    vec2 bf = abs(fract(b) - .5);
    alb *= mix(1., (.84 + .3 * h21(floor(b))) * (1. - .36 * smoothstep(.4, .5, max(bf.x * .55 + .225, bf.y))), fine);
    float stain = vnoise(vec2((vL.x + vL.z) * .55, vL.y * .06)) * .6 + vnoise(vec2((vL.x + vL.z) * .12, vL.y * .2) + 4.) * .4;
    alb *= .84 + .3 * stain;
  } else if (k == 10.) {
    // a vault of brick: rings of bricks laid across its width, bonded ring to ring, each brick a tone of its own
    // and a burnt header here and there, pale lime in the joints; every twelfth ring is a rib of dressed stone.
    // Damp comes through at the edges and runs down the curve in long dark streaks, and lime weeps white beside it
    float along = vL.x + vL.y * .6;
    float fine = clamp(1.2 - px * 1.2, 0., 1.), broad = clamp(1.3 - px * .5, 0., 1.);
    vec2 b = vec2(vL.z * 1.1 + .5 * floor(along * 3.4), along * 3.4);
    vec2 bf = abs(fract(b) - .5); float id = h21(floor(b));
    float joint = smoothstep(.41, .5, max(bf.x * 3.3 - 1.15, bf.y));
    vec3 brickC = alb * (.8 + .34 * id); brickC = mix(brickC, brickC * vec3(.6, .56, .62), step(.9, id));
    vec3 lime = vec3(.8, .76, .68) * (dot(alb, vec3(.34)) + .34);
    alb = mix(alb, mix(brickC, lime, joint), fine);
    float ringNo = floor(along * 3.4), rib = step(mod(ringNo, 12.), .5);
    alb = mix(alb, vec3(.8, .77, .7) * (.86 + .2 * h21(vec2(ringNo, floor(vL.z * .9)))) * (1. - .3 * joint * fine), rib * broad);
    float streak = vnoise(vec2(vL.z * 2.4, along * .1)) * .65 + vnoise(vec2(vL.z * 6.5 + 3., along * .23)) * .35;
    float fromEdge = smoothstep(.4, 2.5, abs(vL.z)) * .6 + .4;
    alb *= 1. - .5 * smoothstep(.5, .78, streak) * fromEdge;
    alb = mix(alb, vec3(.84, .82, .76), .55 * smoothstep(.74, .9, vnoise(vec2(vL.z * 3.1 + 9., along * .16))) * fromEdge);
    alb *= .88 + .24 * vnoise(vec2(vL.z * .5, along * .3));
    // the arris at each edge of the vault is in the ring's own shade
    contact = 1. - .28 * smoothstep(1.7, 2.6, abs(vL.z));
  } else if (k == 11.) {
    // a round stack of brick: courses round it, the bond breaking from course to course, each brick a tone of its
    // own; long stains of rain down it and soot thickening toward the crown
    float fine = clamp(1. - px * 1.4, 0., 1.);
    float ang = atan(vL.z, abs(vL.x) < 1e-4 ? 1e-4 : vL.x);
    vec2 b = vec2(ang * 3.8197 + .5 * floor(vL.y * 2.6), vL.y * 2.6);
    vec2 bf = abs(fract(b) - .5);
    alb *= mix(1., (.78 + .4 * h21(floor(b))) * (1. - .34 * smoothstep(.36, .5, max(bf.x * .5 + .25, bf.y))), fine);
    alb *= .82 + .3 * vnoise(vec2(ang * 2.5, vL.y * .09));
    float sootUp = smoothstep(${(CHIMNEY.tall * 0.5).toFixed(1)}, ${CHIMNEY.tall.toFixed(1)}, vL.y);
    alb = mix(alb, alb * vec3(.42, .4, .42), sootUp * (.55 + .45 * vnoise(vec2(ang * 1.7 + 3., vL.y * .2))));
  } else if (k == 12.) {
    // a church's slating: small slates in level courses, the bond breaking from course to course, each slate a
    // tone of its own; every few metres up a band of paler, greener slate with a toothed lower edge, and long
    // stains of weather down the slope
    float fine = clamp(1.15 - px * 1.6, 0., 1.);
    float across = vL.x * .8 + vL.z * 1.3;
    float run = vL.y * 3.; float row = fract(run), course = floor(run);
    vec2 sl = vec2(across * 2.2 + .5 * course, course);
    float t = h21(floor(sl)), joint = fract(sl.x);
    float tooth = abs(fract(across * .45) - .5) * 1.1;
    float band = 1. - step(.21, fract((vL.y - 9.3 + tooth) / 6.5));
    alb = mix(alb, vec3(.37, .44, .38), band * .85);
    alb *= mix(1., (.66 + .34 * smoothstep(0., .25, row)) * (.8 + .4 * t) * (1. - .2 * (1. - smoothstep(0., .1, joint))), fine);
    alb *= .9 + .2 * vnoise(vec2(across * .35, vL.y * .9));
  } else if (k == 13.) {
    if (vL.y < .5) {
      // a churchyard's turf, in the yard's own axes: rough grass, paler where it is worn and deeper in the damp,
      // daisies in it; and gravel paths from the gate to the west door, from the side gate, and round the church
      float fine = clamp(1.1 - px * 1.8, 0., 1.);
      vec2 q = vL.xz;
      float gate = max(abs(q.x) - 1.2, max(-21. - q.y, q.y + 6.));
      vec2 rb = abs(q - vec2(0., 9.5)) - vec2(8.6, 16.4);
      float ring = abs(length(max(rb, 0.)) + min(max(rb.x, rb.y), 0.)) - .8;
      float side = max(abs(q.y - 8.) - 1., max(-27. - q.x, q.x + 8.));
      float path = 1. - smoothstep(0., .3, min(min(gate, ring), side));
      float broadN = vnoise(q * .16 + 7.) * .6 + vnoise(q * .55) * .4;
      alb *= .74 + .5 * broadN;
      alb = mix(alb, vec3(.3, .29, .13), .5 * smoothstep(.5, .8, vnoise(q * .31 + 31.)));
      alb *= mix(1., .78 + .44 * h21(floor(q * 5.5)), fine);
      alb = mix(alb, vec3(.93, .92, .84), step(.972, h21(floor(q * 3.1) + 9.)) * step(.55, broadN) * fine * .8);
      vec3 gravel = vec3(.62, .55, .44) * mix(1., .8 + .4 * h21(floor(q * 7.)), fine);
      alb = mix(alb, gravel, path);
    } else {
      // leaves: sprays of darker and lighter green, deeper in toward the bole
      float fine = clamp(1.1 - px * 1.2, 0., 1.);
      vec3 q = vL * vec3(1.7, 1.1, 1.7);
      alb *= .78 + .44 * vnoise(q.xz + q.y * 1.3);
      alb *= mix(1., .72 + .56 * h21(floor(vec2(q.x + q.z, q.y * 2.6) * 2.2)), fine);
    }
  } else if (k == 5.) {
    float band = step(1.55, vL.y) * step(vL.y, 2.5); float f = fract(vL.x / 1.4 + .5);
    float win = band * step(.14, f) * step(f, .86);
    alb = mix(alb, vec3(.12, .17, .22), win);
    alb = mix(alb, vec3(.9, .86, .74), step(2.5, vL.y) * step(vL.y, 2.75));
  } else if (k == 14.) {
    // leaves: each tree a green of its own, from holly-dark to lime, and one in a dozen a copper beech
    float tree = clamp(vH, 0., 1.), tree2 = fract(tree * 9.7);
    alb *= mix(.72, 1.22, tree2) * mix(vec3(.9, 1., .95), vec3(1.2, 1.04, .7), tree * tree);
    alb = mix(alb, vec3(.21, .08, .06) * mix(.8, 1.2, tree2), step(.92, fract(tree * 3.3)));
  }
  vec3 c = lit(alb, n, vW, contact, open) + glint * slabShadow(vW) * open;
  if (wet > 0.) {
    float fr = 1. - max(v.y, 0.); fr *= fr;
    float rip = vnoise(vW.xz * 2.3 + vec2(uTime * .6, uTime * .35));
    vec3 pool = mix(uFogCol, uZenith, .62) * (.72 + .2 * fr) * (.92 + .16 * rip);
    vec3 rs = reflect(-v, vec3(0., 1., 0.)); float sp = max(dot(rs, uSun), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    c = mix(c, pool + uSunCol * sp * sp * 2.5 * slabShadow(vW), wet * .92);
  }
  #ifdef HOUSE
  gl_FragColor = vec4(airFog(c, vW), 1.);
  #else
  gl_FragColor = vec4(airFogShare(c, vW, (k == 3. || k == 4. || k == 14.) ? 1. : .5), 1.);
  #endif
}`;
export function makeTownMaterial(air, house = false) {
  return new THREE.ShaderMaterial({
    uniforms: { ...air },
    vertexShader: TOWN_VERT, fragmentShader: TOWN_FRAG, side: THREE.DoubleSide,
    defines: house ? { HOUSE: 1 } : {},
  });
}
// ---------- ribbons: laid out level in plan and passed through the fold ----------
// A band between zA and zB from sA to sB at height h over the ground, cut finely on the bend.
// across > 0 cuts the band into strips along z as well (for long shadows that need no more than a quad each).
const _f = new THREE.Vector3();
export function ribbon(geo, zA, zB, sA, sB, h, col, kind = 3, cut = 2, flag = 0) {
  const stops = [sA];
  let s = sA;
  while (s < sB - 1e-6) {
    let nx;
    if (s < LAND.sCrease) nx = Math.min(sB, LAND.sCrease);
    else if (s < S_WALL) nx = Math.min(sB, S_WALL, s + cut);
    else nx = sB;
    stops.push(nx); s = nx;
  }
  const b0 = {}, b1 = {};
  for (let i = 0; i + 1 < stops.length; i++) {
    const s0 = stops[i], s1 = stops[i + 1];
    basisAt(s0, b0); basisAt(s1, b1);
    const P = (b, sv, z) => { geo.p.push(b.gx + h * b.ux, b.gy + h * b.uy, z); geo.n.push(b.ux, b.uy, 0); geo.c.push(col.r, col.g, col.b); geo.l.push(sv, flag, z); geo.k.push(kind); };
    P(b0, s0, zA); P(b0, s0, zB); P(b1, s1, zB);
    P(b0, s0, zA); P(b1, s1, zB); P(b1, s1, zA);
    geo.count += 2;
  }
}
// a wall of the slab's thickness standing on a line of constant z (the slab's cut ends) or constant s
function slabEnd(geo, z, sA, sB, col, facePlus) {
  let s = sA; const b0 = {}, b1 = {};
  while (s < sB - 1e-6) {
    const nx = s < LAND.sCrease ? Math.min(sB, LAND.sCrease) : s < S_WALL ? Math.min(S_WALL, s + 4) : sB;
    basisAt(s, b0); basisAt(nx, b1);
    const T = LAND.thick;
    const A = [b0.gx, b0.gy, z], B = [b1.gx, b1.gy, z], C = [b1.gx - T * b1.ux, b1.gy - T * b1.uy, z], D = [b0.gx - T * b0.ux, b0.gy - T * b0.uy, z];
    if (facePlus) geo.quad(A, B, C, D, col, 4); else geo.quad(A, D, C, B, col, 4);
    s = nx;
  }
}

export const TONE = {
  brick: new THREE.Color('#B8573B'), plaster: new THREE.Color('#E9D8B6'), sea: new THREE.Color('#3A77A6'),
  sky: new THREE.Color('#D4E6EF'), slate: new THREE.Color('#5C656F'), rock: new THREE.Color('#8C8176'),
  enamel: new THREE.Color('#E2B13C'), tile: new THREE.Color('#A06A55'), cobble: new THREE.Color('#9A8E80'),
  paving: new THREE.Color('#C2B49A'), stone: new THREE.Color('#B9AE9C'), dark: new THREE.Color('#2E343B'),
  white: new THREE.Color('#F2EBDD'), wood: new THREE.Color('#6B4A34'), iron: new THREE.Color('#3A3F46'),
  stack: new THREE.Color('#A0705E'), post: new THREE.Color('#D9D2C2'),
};

// THE LAND: town ground, avenue, tram place, canal banks, and the bare rock of the slab's back, top and cut ends.
export async function buildLand(ctx, group, mat) {
  const g = new Geo();
  const Z0 = LAND.z0, Z1 = LAND.z1, av = LAND.avenueZ, cz = LAND.canalZ;
  // town ground in strips across z so no triangle is longer than it need be
  const edges = [Z0, -100, av - 10, av + 10, 79, 139, 300, 460, 700, cz - 8, cz - 5, cz + 5, cz + 8, Z1];
  for (let i = 0; i + 1 < edges.length; i++) {
    const a = edges[i], b = edges[i + 1];
    const isAvenue = a === av - 10, isCanal = a === cz - 5, isBank = a === cz - 8 || a === cz + 5;
    if (isCanal) continue;
    const col = isAvenue ? TONE.paving : isBank ? TONE.stone : TONE.cobble;
    ribbon(g, a, b, 0, S_RIM, isBank ? 0.4 : 0, col, 3, 2, isAvenue || isBank ? 1 : 0);
  }
  await ctx.yield();
  // the canal's bed under its water, and the banks' inner faces
  ribbon(g, cz - 5, cz + 5, 0, S_RIM, -1.2, TONE.dark, 3, 2, 1);
  // the cobbled tram place beside the avenue at the bend: paler, and no terrace shadow on it
  ribbon(g, -100, -70, 195, 310, 0.06, TONE.paving.clone().lerp(TONE.cobble, 0.3), 3, 2, 2);
  // the quay's stone apron along the water
  ribbon(g, Z0, Z1, 0, 9, 0.05, TONE.stone, 3, 2, 1);
  await ctx.yield();
  // bare rock: the back of the slab (h = -thick), its two cut ends, the quay face and the level top
  const rock = TONE.rock;
  {
    const T = LAND.thick, b0 = {}, b1 = {};
    let s = 0;
    while (s < S_RIM - 1e-6) {
      const nx = s < LAND.sCrease ? LAND.sCrease : s < S_WALL ? Math.min(S_WALL, s + 4) : S_RIM;
      basisAt(s, b0); basisAt(nx, b1);
      for (let zi = 0; zi < 8; zi++) {
        const za = lerp(Z0, Z1, zi / 8), zb = lerp(Z0, Z1, (zi + 1) / 8);
        g.quad([b0.gx - T * b0.ux, b0.gy - T * b0.uy, za], [b1.gx - T * b1.ux, b1.gy - T * b1.uy, za],
          [b1.gx - T * b1.ux, b1.gy - T * b1.uy, zb], [b0.gx - T * b0.ux, b0.gy - T * b0.uy, zb], rock, 4);
      }
      s = nx;
    }
    slabEnd(g, Z0, 0, S_RIM, rock, true); slabEnd(g, Z1, 0, S_RIM, rock, false);
    // the top, level at the rim, and the quay's face
    for (let zi = 0; zi < 8; zi++) {
      const za = lerp(Z0, Z1, zi / 8), zb = lerp(Z0, Z1, (zi + 1) / 8);
      g.quad([LAND.wallX, LAND.rimY, za], [LAND.wallX, LAND.rimY, zb], [LAND.wallX + T, LAND.rimY, zb], [LAND.wallX + T, LAND.rimY, za], rock, 4);
      g.quad([0, LAND.floorY, zb], [0, LAND.floorY, za], [0, LAND.floorY - T, za], [0, LAND.floorY - T, zb], TONE.stone, 4);
    }
  }
  await ctx.yield();
  // the avenue's dress: a bed of dark setts under each track and a pale kerb down each side
  for (const tz of [av - 2, av + 2]) ribbon(g, tz - 1.5, tz + 1.5, 2, S_RIM, 0.07, TONE.cobble.clone().multiplyScalar(0.72), 3, 2, 1);
  for (const kz of [av - 9.6, av + 9.6]) ribbon(g, kz - 0.4, kz + 0.4, 9, S_RIM, 0.3, TONE.white, 0, 2, 1);
  for (let s = 14; s < S_RIM - 4; s += 9.5) ribbon(g, av - 0.25, av + 0.25, s, s + 4, 0.09, TONE.white, 0, 2, 1);
  await ctx.yield();
  // four rails of the double tramline, raised a hand's width, round the bend and up to the rim
  for (const rz of [av - 2.7, av - 1.3, av + 1.3, av + 2.7]) ribbon(g, rz - 0.16, rz + 0.16, 2, S_RIM, 0.14, TONE.iron, 0, 2, 1);
  // the scissors crossing at each end of the line: two tracks slanting across from rail to rail, laid in short lengths
  const pairUp = { up: true, quay: 0, top: 1 }, pairDown = { up: false, quay: 1, top: 0 }, tk = {};
  for (const c of [TRAM.rail0 + TRAM.clearOf, S_RIM - TRAM.clearOf - TRAM.cross]) for (const pr of [pairUp, pairDown]) {
    const cuts = 36, ds = TRAM.cross / cuts;
    for (let j = 0; j < cuts; j++) {
      const z = av + tramTrackAt(c + (j + 0.5) * ds, pr, tk).z;
      for (const o of [-0.7, 0.7]) ribbon(g, z + o - 0.16, z + o + 0.16, c + j * ds, c + (j + 1) * ds, 0.15, TONE.iron, 0, 2, 1);
    }
  }
  const mesh = new THREE.Mesh(g.build(), mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  group.add(mesh);
  return mesh;
}

// ---------- places of the town, in plan (s, z); the lake rides a little higher or lower by deal ----------
export const yToS = (y) => S_WALL + (y - LAND.floorY - LAND.R);
// the hung lake's place across the wall and its radius: the roads' first berth is told from it
export const LAKE = { z: 350, r: 75 };
export function makePlaces(lakeLift = 0) {
  return {
    clock: { s: 26, z: -367 }, millUp: { s: 61, z: -266 }, steepleUp: { s: 135, z: -178 },
    // the quay clock tower's twin lies out from the wall among the top rows, between the railway and the land's end
    clockLying: { s: yToS(345), z: 715 },
    steepleLying: { s: yToS(83), z: 25 },
    square: { s0: yToS(79), s1: yToS(139), z0: 79, z1: 139 },
    carousel: { s: yToS(104), z: 112 }, fountain: { s: yToS(118), z: 130 },
    // two lying windmills between the square and the lake, one after the other up the wall; the third stands on
    // the lake's far shore, where the works begin
    mills: [{ s: yToS(128), z: 170 }, { s: yToS(146), z: 220 }, { s: yToS(232), z: 470 }],
    lake: { s: yToS(226 + lakeLift), z: LAKE.z, r: LAKE.r },
    // the works: five chimneys in a level row along one terrace, beyond the lake's far shore
    // (the row takes one terrace's place: the first row at or above 245 m)
    chimneys: [499, 512, 525, 538, 551].map((z) => ({ s: ROW0 + Math.ceil((yToS(245) - ROW0) / ROW_STEP) * ROW_STEP, z })),
    // the balloon field in the floor town: one terrace's gap, three plots wide, in the row between the upright
    // steeple and the avenue; and its twin on the wall, in a row between the works and the railway
    balloon: { s: ROW0 + 9 * ROW_STEP, z: -186, half: 12 },
    balloonWall: { s: ROW0 + Math.round((yToS(270) - ROW0) / ROW_STEP) * ROW_STEP, z: 614, half: 12 },
    // and a third among the top rows, between the lying clock tower and the land's end: its balloon rides out
    // over the lower cloud, level with the rim
    balloonTop: { s: ROW0 + Math.round((yToS(325) - ROW0) / ROW_STEP) * ROW_STEP, z: 752, half: 12 },
    // the railway's viaduct goes up the wall as the avenue does, leaning a little toward the avenue, from its foot
    // above the works to the rim: four great arches standing square across the flown line, which goes through
    // the third at mid-span
    viaduct: { s0: yToS(273.9), z0: 667.13, s1: S_RIM, z1: 624.75, h: 44 },
    tramPlace: { s0: 195, s1: 310, z0: -100, z1: -70 },
  };
}
// the steeple's plan: its tower 7 m square, its nave 10 m deep running 22.5 m to one side of the tower's centre
export const STEEPLE = { tower: 7, deep: 10, naveEnd: 22.5 };
// the windmill's plan: its tower's foot, the hub's height, how far to one side of the tower the sails' plane stands,
// and the sails' reach about the hub; a house is 8 m wide and, with its eave, 5.5 m deep to either side of its row
export const MILL = { foot: 5, hub: 18, sailsOff: 5.2, reach: 10.2 };
const HOUSE_HALF = { wide: 4, deep: 5.5, turned: 6.5 };      // turned: a terrace's end house, ridge along the street, a metre out
// true where no house may stand: streets, water, squares and the feet of the landmarks
export function keptClear(P, s, z, dealt = false) {
  // the ground of the wall's larger things (WALL_THINGS); `dealt` asks for the town's plan without them, the plan
  // the houses are dealt on
  if (!dealt && thingAt(s, z)) return true;
  if (Math.abs(z - LAND.avenueZ) < 14.5) return true;
  if (Math.abs(z - LAND.canalZ) < 12.5) return true;
  const t = P.tramPlace; if (z > t.z0 - 4 && z < t.z1 + 4 && s > t.s0 - 5 && s < t.s1 + 5) return true;
  const q = P.square; if (z > q.z0 - 4 && z < q.z1 + 4 && s > q.s0 - 5 && s < q.s1 + 5) return true;
  if (Math.hypot(s - P.lake.s, z - P.lake.z) < P.lake.r + 8) return true;
  for (const m of [P.clock, P.clockLying, P.millUp, ...P.mills]) if (Math.abs(s - m.s) < 12 && Math.abs(z - m.z) < 11) return true;
  // a mill's sails, from the model's own sizes: no house stands where its plot comes within a sail's depth of the
  // plane the sails turn in and its row within their reach, upright mill and lying mills alike
  for (const m of [P.millUp, ...P.mills]) if (Math.abs(z - (m.z - MILL.sailsOff)) < HOUSE_HALF.turned + 1.5 && Math.abs(s - m.s) < MILL.reach + HOUSE_HALF.deep) return true;
  // a steeple's whole footprint, from its model's own sizes: the tower and the nave beside it
  for (const m of [P.steepleUp, P.steepleLying]) if (Math.abs(s - m.s) < STEEPLE.deep / 2 + 5 && z > m.z - STEEPLE.tower / 2 - 4 && z < m.z + STEEPLE.naveEnd + 4) return true;
  // the two balloon fields: a gap in one terrace
  for (const m of [P.balloon, P.balloonWall, P.balloonTop]) if (Math.abs(s - m.s) < ROW_STEP / 2 && Math.abs(z - m.z) < m.half) return true;
  const c = P.chimneys; if (Math.abs(s - c[0].s) < 10 && z > c[0].z - 9 && z < c[4].z + 9) return true;
  // the railway's yard: open cobbles under the viaduct and for about a house's height to either side of it, so
  // its piers stand on the wall free of the terraces
  const v = P.viaduct, vs = v.s1 - v.s0, vz = v.z1 - v.z0, vl = Math.hypot(vs, vz);
  const along = ((s - v.s0) * vs + (z - v.z0) * vz) / vl, below = ((s - v.s0) * vz - (z - v.z0) * vs) / vl * (vz < 0 ? 1 : -1);
  if (along > -8 && along < vl + 4 && below > -11 && below < 15) return true;
  return false;
}

// THE CHURCHYARD: each steeple stands in a walled yard of turf, the same yard by the steeple's own place on floor
// and on wall: so far before and after the tower across the street, so far below and above it along the street.
// No house stands in it; every house about it is as it was dealt. Its two gates are YARD.gate to either side of the
// tower's line and of YARD.sideGate after it; the town's own trees keep YARD.clear from its wall, and its street
// trees off the YARD.approach before each gate.
export const YARD = { zBefore: 17.5, zAfter: 38.5, sBelow: 26.5, sAbove: 20, wall: 1.4, yew: 9.5, gate: 1.7, sideGate: 8, approach: 8, clear: 0.8 };
// true where a house of that half width across, standing at plan (s, z), would stand in a churchyard
export function inYard(P, s, z, half) {
  for (const m of [P.steepleUp, P.steepleLying]) if (s > m.s - YARD.sBelow && s < m.s + YARD.sAbove && z + half > m.z - YARD.zBefore && z - half < m.z + YARD.zAfter) return true;
  return false;
}
// true where a thing at plan (s, z) that reaches `by` metres about its own foot would stand in a churchyard or
// across its wall
export function byYard(P, s, z, by) {
  for (const m of [P.steepleUp, P.steepleLying]) {
    const x = s - m.s, w = z - m.z;
    if (x > -YARD.sBelow - by && x < YARD.sAbove + by && w > -YARD.zBefore - by && w < YARD.zAfter + by) return true;
  }
  return false;
}
// true where such a thing would stand in the open way before one of a yard's two gates (the gate before the tower
// and the gate in the side below it), each kept open for YARD.approach metres out from the wall
export function beforeYardGate(P, s, z, by) {
  for (const m of [P.steepleUp, P.steepleLying]) {
    const x = s - m.s, w = z - m.z;
    if (Math.abs(x) < YARD.gate + by && w <= -YARD.zBefore && w > -YARD.zBefore - YARD.approach - by) return true;
    if (Math.abs(w - YARD.sideGate) < YARD.gate + by && x <= -YARD.sBelow && x > -YARD.sBelow - YARD.approach - by) return true;
  }
  return false;
}
// the yard's graves, dealt once from a stream of their own and stood in both yards alike: headstones in lines
// along the street, their faces across it, here and there a cross or a table tomb; none on a path, none
// within a stride of the church, the wall or a tree
export const YARD_TREES = [[-20.5, -13.5, 9], [14, -14, 7.5], [-20, 32.5, 8], [13.5, 33, 9.5], [-15.5, 19, 7]];
export const YARD_LIMES = [[-19.5, -3, 8], [14.5, 9, 9]];
export function dealGraves(rng) {
  const graves = [];
  for (let z = -YARD.zBefore + 3; z <= YARD.zAfter - 3; z += 3.3) for (let x = -YARD.sBelow + 2.5; x <= YARD.sAbove - 2.4; x += 2.1) {
    const jx = rng.range(-0.22, 0.22), jz = rng.range(-0.2, 0.2), kind = rng(), tall = rng.range(1.1, 1.75), wide = rng.range(0.75, 1.05), tone = rng(), lean = rng.range(-0.07, 0.07);
    if (rng() > 0.8) continue;
    const gx = x + jx, gz = z + jz;
    if (Math.abs(gx) < 10.4 && gz > -9.2 && gz < 27.5) continue;                   // the church and the path round it
    if (Math.abs(gx) < 2.6 && gz < -3) continue;                                     // the path from the gate to the west door
    if (Math.abs(gz - 8) < 2.4 && gx < -8) continue;                                 // the path from the side gate
    if ([...YARD_TREES, ...YARD_LIMES].some((t) => Math.hypot(gx - t[0], gz - t[1]) < 3.4)) continue;
    graves.push({ x: gx, z: gz, kind, tall, wide, tone, lean });
  }
  return graves;
}
// The turf is old grass, of the same family of green as the lawns of the town's back gardens and a little duller.
export function yardModel(g, graves) {
  const Y = YARD, stone = TONE.stone.clone().multiplyScalar(0.9), pale = TONE.white, turf = new THREE.Color(0.132, 0.168, 0.07);
  const x0 = -Y.sBelow, x1 = Y.sAbove, z0 = -Y.zBefore, z1 = Y.zAfter;
  g.quad([x0, 0.12, z0], [x0, 0.12, z1], [x1, 0.12, z1], [x1, 0.12, z0], turf, 13);
  // the wall round it, coped in pale stone, with a gate in the side before the tower and one in the side below
  const wallRun = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), alongX = Math.abs(bx - ax) > Math.abs(bz - az);
    g.box((ax + bx) / 2, 0, (az + bz) / 2, alongX ? len : 0.6, Y.wall, alongX ? 0.6 : len, stone, 9, { topCol: pale });
  };
  wallRun(x0, z0, -1.7, z0); wallRun(1.7, z0, x1, z0); wallRun(x0, z1, x1, z1); wallRun(x1, z0, x1, z1);
  wallRun(x0, z0, x0, 6.3); wallRun(x0, 9.7, x0, z1);
  for (const [px, pz] of [[-1.9, z0], [1.9, z0], [x0, 6.1], [x0, 9.9]]) { g.box(px, 0, pz, 0.9, 2.3, 0.9, stone, 9, { topCol: pale }); g.stem(px, 2.3, pz, 0.62, 0, 0.7, 4, pale, 0); }
  // the lychgate inside the gate before the tower: four posts and a little tiled roof, its ridge along the path
  for (const [px, pz] of [[-1.5, z0 + 0.3], [1.5, z0 + 0.3], [-1.5, z0 + 2.5], [1.5, z0 + 2.5]]) g.box(px, 0, pz, 0.28, 2.7, 0.28, TONE.wood, 0, { top: false });
  g.quad([-2.2, 2.5, z0 - 0.2], [-2.2, 2.5, z0 + 3], [0, 4.3, z0 + 3], [0, 4.3, z0 - 0.2], TONE.tile, 2);
  g.quad([2.2, 2.5, z0 + 3], [2.2, 2.5, z0 - 0.2], [0, 4.3, z0 - 0.2], [0, 4.3, z0 + 3], TONE.tile, 2);
  for (const gz of [z0 + 0.3, z0 + 2.5]) g.tri([-1.6, 3, gz], [0, 4.3, gz], [1.6, 3, gz], TONE.wood, 0);
  // the graves
  for (const gr of graves) {
    const col = gr.tone < 0.2 ? TONE.slate.clone().multiplyScalar(1.3) : gr.tone > 0.82 ? pale : stone.clone().multiplyScalar(0.8 + 0.3 * gr.tone);
    if (gr.kind < 0.09) { g.box(gr.x, 0, gr.z, 1.1, 0.9, 2.2, col, 9, { topCol: pale }); continue; }
    if (gr.kind < 0.3) {
      // a cross on a stepped foot
      g.box(gr.x, 0, gr.z, 1.0, 0.35, 0.7, col, 0); g.box(gr.x, 0.35, gr.z, 0.3, gr.tall + 0.9, 0.26, pale, 0); g.box(gr.x, gr.tall + 0.45, gr.z, 1.2, 0.28, 0.26, pale, 0);
      continue;
    }
    // a headstone, leaning a little as it has settled, its head cut to a shoulder
    const h = gr.tall, w = gr.wide / 2, dx = gr.lean * h;
    g.quad([gr.x - w, 0, gr.z - 0.12], [gr.x - w + dx, h, gr.z - 0.12], [gr.x + w + dx, h, gr.z - 0.12], [gr.x + w, 0, gr.z - 0.12], col, 0);
    g.quad([gr.x + w, 0, gr.z + 0.12], [gr.x + w + dx, h, gr.z + 0.12], [gr.x - w + dx, h, gr.z + 0.12], [gr.x - w, 0, gr.z + 0.12], col, 0);
    g.quad([gr.x - w, 0, gr.z + 0.12], [gr.x - w + dx, h, gr.z + 0.12], [gr.x - w + dx, h, gr.z - 0.12], [gr.x - w, 0, gr.z - 0.12], col, 0);
    g.quad([gr.x + w, 0, gr.z - 0.12], [gr.x + w + dx, h, gr.z - 0.12], [gr.x + w + dx, h, gr.z + 0.12], [gr.x + w, 0, gr.z + 0.12], col, 0);
    g.tri([gr.x - w + dx, h, gr.z], [gr.x + dx, h + w * 0.8, gr.z], [gr.x + w + dx, h, gr.z], col, 0);
  }
  // yews: dark tiers, each broader at its skirt than the one below is at its shoulder, drawn up to a point, on
  // a short red bole
  const yew = new THREE.Color('#4C7244'), lime = new THREE.Color('#72934A');
  for (const [tx, tz, h] of YARD_TREES) {
    const R = h * 0.3, top = h - 1.8;
    g.box(tx, 0, tz, 0.7, 2.0, 0.7, TONE.wood, 0, { top: false });
    for (let i = 0; i < 3; i++) {
      const y0 = 1.8 + top * i * 0.3, r0 = R * (1 - 0.24 * i), r1 = i === 2 ? 0 : r0 * 0.5;
      g.stem(tx, y0, tz, r0 * 0.45, r0, 0.5, 9, yew.clone().multiplyScalar(0.7 + 0.14 * i), 13);
      g.stem(tx, y0 + 0.5, tz, r0, r1, (i === 2 ? top * 0.4 : top * 0.36) - 0.5, 9, yew.clone().multiplyScalar(0.92 + 0.16 * i), 13);
    }
  }
  // limes: a clean bole and a round head
  for (const [tx, tz, h] of YARD_LIMES) {
    const R = h * 0.36;
    g.box(tx, 0, tz, 0.5, h * 0.42, 0.5, TONE.wood, 0, { top: false });
    g.stem(tx, h * 0.36, tz, R * 0.4, R * 0.9, h * 0.14, 10, lime.clone().multiplyScalar(0.78), 13);
    g.stem(tx, h * 0.5, tz, R * 0.9, R, h * 0.18, 10, lime.clone().multiplyScalar(0.9), 13);
    g.stem(tx, h * 0.68, tz, R, R * 0.78, h * 0.17, 10, lime, 13);
    g.stem(tx, h * 0.85, tz, R * 0.78, R * 0.3, h * 0.15, 10, lime.clone().multiplyScalar(1.12), 13, true);
  }
}

// THE WALL'S LARGER THINGS, by place: twelve things of the town's own kind on the wall's far reaches, each on the
// ground of several plots of two or four terraces that stand back to back (row: the first of them, an even one;
// plot: the first plot across the town, counted from the town's first), from the kerb of the lane below them to
// the kerb of the lane above. Measured against the flown line itself, the nearest edge of any ground is 117 m
// from it and the nearest built point 120 m (both the stores of row 22); every other thing's ground is 121 m off
// or more. No house, far piece or tree stands on a ground; the ground of the stores of row 18 reaches 3.5 m into the
// margin the town keeps by the canal, as the house of their last plot did, 1 m short of the bank's strip (their
// sheds' walls end half a metre inside the margin). The list is the same on
// every seed and nothing is dealt for it; an empty list leaves the town as it was dealt.
export const WALL_THINGS = [
  { kind: 'green', row: 24, rows: 4, plot: 54, plots: 8 },
  { kind: 'green', row: 16, rows: 2, plot: 12, plots: 6 },
  { kind: 'green', row: 20, rows: 2, plot: 140, plots: 10 },
  { kind: 'hall', row: 18, rows: 2, plot: 20, plots: 10 },
  { kind: 'hall', row: 16, rows: 2, plot: 108, plots: 10 },
  { kind: 'chapel', row: 18, rows: 2, plot: 8, plots: 5 },
  { kind: 'chapel', row: 30, rows: 2, plot: 80, plots: 5 },
  { kind: 'school', row: 28, rows: 2, plot: 68, plots: 6 },
  { kind: 'school', row: 18, rows: 2, plot: 128, plots: 6 },
  { kind: 'works', row: 20, rows: 2, plot: 32, plots: 6 },
  { kind: 'stores', row: 22, rows: 2, plot: 48, plots: 6 },
  { kind: 'stores', row: 18, rows: 2, plot: 154, plots: 7 },
];
// a thing's ground in plan: from s0 to s1 up the town, from z0 to z1 across it. Where its first plot is a street's
// first, or its last a street's last, the terrace across that kerb ends in a house turned to the street, which
// stands 2 m into it, the verge of its cross gable 2.3 m: the ground begins THING_END in from that kerb, clear of
// the house, and the great tree of that lane's mouth (GARDEN.mouth in) still falls on it and is not planted
const THING_KERB = 6.6, THING_END = 2.3;
export const thingGround = (T) => {
  const z = LAND.z0 + STREET.first - STREET.plot / 2, end = T.plot + T.plots - 1;
  const first = T.plot % STREET.every === STREET.every - STREET.open, last = end % STREET.every === STREET.every - 1;
  return {
    s0: ROW0 + T.row * ROW_STEP - THING_KERB, s1: ROW0 + (T.row + T.rows - 1) * ROW_STEP + THING_KERB,
    z0: z + T.plot * STREET.plot + (first ? THING_END : 0), z1: z + (end + 1) * STREET.plot - (last ? THING_END : 0),
  };
};
const THING_GROUNDS = WALL_THINGS.map(thingGround);
// true where plan (s, z) lies on the ground of one of the wall's larger things
export function thingAt(s, z) {
  for (const r of THING_GROUNDS) if (s > r.s0 && s < r.s1 && z > r.z0 && z < r.z1) return true;
  return false;
}
// ---- the larger things' pieces, each laid in a frame F of its thing: x up the town, y its own up, z across ----
// a gable roof, its ridge along local z from z0 to z1 over x: a roof's courses are drawn across local x and its
// verge by local z, so a long roof is built bay by bay, each bay in axes of its own
function roofRun(g, F, x, z0, z1, span, eave, rise, col) {
  const n = Math.max(1, Math.ceil((z1 - z0) / 7)), d = (z1 - z0) / n / 2, keep = g.m, t = new THREE.Matrix4(), h = span / 2;
  for (let i = 0; i < n; i++) {
    g.m = t.copy(F).multiply(_m2.makeTranslation(x, 0, z0 + (2 * i + 1) * d));
    g.quad([-h, eave, -d], [-h, eave, d], [0, eave + rise, d], [0, eave + rise, -d], col, 2);
    g.quad([h, eave, d], [h, eave, -d], [0, eave + rise, -d], [0, eave + rise, d], col, 2);
  }
  g.m = keep;
}
// a shed: four walls, two gables and a roof that oversails them a little; centred at (x, z) of the frame, its ridge
// along the frame's z, or along its x where `turn` is set. Returns the shed's own frame.
// Its walls are of the house wall's stuff, which is drawn for a house 7 m to its eave (two floors of sashes, the
// eaves' shade under 7 m): so the walls are told 7 m high in axes of their own and drawn out to the shed's eave,
// the sashes taller with the wall, the shade under the real eave, and the gable above it plain walling.
function shedInto(g, F, x, z, turn, span, len, eave, rise, wall, roof, kind = 1) {
  const keep = g.m, f = new THREE.Matrix4().copy(F).multiply(_m2.makeTranslation(x, 0, z)), over = 0.45 * rise / (span / 2);
  if (turn) f.multiply(_m2.makeRotationY(HALF_PI));
  const k = eave / 7, top = 7 + rise / k;
  g.m = new THREE.Matrix4().copy(f).scale(_v0.set(1, k, 1));
  g.box(0, 0, 0, span, 7, len, wall, kind, { top: false });
  g.tri([-span / 2, 7, -len / 2], [0, top, -len / 2], [span / 2, 7, -len / 2], wall, kind);
  g.tri([span / 2, 7, len / 2], [0, top, len / 2], [-span / 2, 7, len / 2], wall, kind);
  roofRun(g, f, 0, -len / 2 - 0.4, len / 2 + 0.4, span + 0.9, eave - over, rise + over, roof);
  g.m = keep;
  return f;
}
// a round-headed tree of a green or a yard, h metres tall: a bole and a head in three tiers (the yard trees' leaves)
function thingTree(g, F, x, z, h) {
  const keep = g.m, k = h / 9, leaf = new THREE.Color('#72934A').multiplyScalar(0.82);
  g.m = new THREE.Matrix4().copy(F).multiply(_m2.makeTranslation(x, 0, z)).scale(_v0.set(k, k, k));
  g.box(0, 0, 0, 0.55, 3.4, 0.55, TONE.wood, 0, { top: false });
  g.stem(0, 2.8, 0, 1.0, 3.1, 1.9, 7, leaf.clone().multiplyScalar(0.74), 13);
  g.stem(0, 4.7, 0, 3.1, 2.7, 2.1, 7, leaf.clone().multiplyScalar(0.94), 13);
  g.stem(0, 6.8, 0, 2.7, 0, 2.2, 7, leaf.clone().multiplyScalar(1.14), 13);
  g.m = keep;
}
// A THING'S FLOOR. Every flat piece of a larger thing's ground (paving, setts, gravel, turf) is laid as the town's
// own ground is (kind 3, its plain sort), so it takes the terraces' reckoned shade as the lanes about it do and
// is of no paler stuff than they. Its model coordinates are not its own place's: every corner of every piece is
// told as ONE point of the town's ground, THING_BARE up the town and across it. That point lies under a terrace
// (3.4 m from a row's centre, 54 m past a street's near kerb), where the ground has no kerb, gutter, carriageway
// or garden; and being one point, none of the ground's setts or stains is drawn across the piece: it is one flat
// tone. At that point the ground's drawing takes a tone down by 0.84 (the sett at the plan's first corner) and by
// 0.9 (its stain), on any machine, so the tone is told that much lighter and comes out as written here. The shade
// is reckoned from where the piece really lies: the rows' shade falls across a floor in bars, as across the lanes,
// and so does the shade of the rows that stood on it. The floor returned lays three or four corners given in the
// thing's frame.
const THING_LIFT = 0.16, THING_BARE = 0.5 / 1.4, THING_TURF = new THREE.Color(0.126, 0.167, 0.068), THING_GRAVEL = new THREE.Color(0.29, 0.21, 0.13);
function thingFloor(g, F) {
  const M = new THREE.Matrix4().copy(F).multiply(_m2.makeTranslation(0, THING_LIFT, 0)), c = new THREE.Color(), at = (q) => [q[0], 0, q[1]];
  return (pts, col) => {
    const keep = g.m, from = g.l.length; g.m = M; c.copy(col).multiplyScalar(1 / (0.84 * 0.9));
    if (pts.length === 3) g.tri(at(pts[0]), at(pts[1]), at(pts[2]), c, 3); else g.quad(at(pts[0]), at(pts[1]), at(pts[2]), at(pts[3]), c, 3);
    for (let k = from; k < g.l.length; k += 3) { g.l[k] = THING_BARE; g.l[k + 1] = 0; g.l[k + 2] = THING_BARE; }
    g.m = keep;
  };
}
// ---- the larger things themselves: each on ground 2a up the town by 2b across it, its centre at the frame's 0 ----
// A GREEN: a gravel walk round it, two paths from corner to corner, four lawns between them and trees along its
// sides; at the crossing a bandstand on the largest, a round pond on a long one, an obelisk on a small one.
// Nothing is dealt: a tree's height is told from its own number.
function greenInto(g, F, a, b, lay) {
  const gravel = THING_GRAVEL, stone = TONE.stone, walk = 2.6, w = 1.3;
  const A = a - walk, B = b - walk, L = Math.hypot(A, B), dx = w * L / B, dz = w * L / A;
  const flat = (x0, z0, x1, z1) => lay([[x0, z0], [x0, z1], [x1, z1], [x1, z0]], gravel);
  flat(-a, -b, a, -B); flat(-a, B, a, b); flat(-a, -B, -A, B); flat(A, -B, a, B);
  let n = 0;
  const row = (half, at) => {
    const reach = half - 3, k = Math.max(1, Math.round(2 * reach / 9));
    for (let i = 0; i <= k; i++) { const t = -reach + 2 * reach * i / k, q = at(t); thingTree(g, F, q[0], q[1], 8 + 3 * Math.abs(Math.sin(++n * 12.9898 + a))); }
  };
  for (const sd of [-1, 1]) {
    lay([[sd * A, -B + dz], [sd * A, B - dz], [sd * dx, 0]], THING_TURF);
    lay([[-A + dx, sd * B], [A - dx, sd * B], [0, sd * dz]], THING_TURF);
    // a path: a strip of the walk's gravel along one diagonal
    const px = -B / L * w, pz = A / L * w;
    lay([[-A + px, -sd * B + sd * pz], [-A - px, -sd * B - sd * pz], [A - px, sd * B - sd * pz], [A + px, sd * B + sd * pz]], gravel);
    // trees stand 4.2 m in from the walk, as far along each side as its lawn is deep enough to hold them
    row((B - dz) * (1 - 4.2 / (A - dx)), (t) => [sd * (A - 4.2), t]);
    row((A - dx) * (1 - 4.2 / (B - dz)), (t) => [t, sd * (B - 4.2)]);
  }
  if (a > 30) {
    // the bandstand: eight posts on a stone floor under a copper roof
    g.stem(0, 0, 0, 4.4, 4.4, 0.8, 8, stone, 9, true);
    for (let i = 0; i < 8; i++) g.box(3.8 * Math.cos(i * Math.PI / 4), 0.8, 3.8 * Math.sin(i * Math.PI / 4), 0.24, 3.1, 0.24, TONE.white, 0, { top: false });
    g.stem(0, 3.9, 0, 4.9, 0, 2.3, 8, new THREE.Color('#5E9C8A'), 0);
  } else if (b > 30) {
    // the pond: standing water in a round stone kerb
    g.stem(0, 0, 0, 7.4, 7.4, 0.55, 16, stone, 9); g.stem(0, 0.55, 0, 7.4, 6.6, 0.01, 16, stone, 0);
    g.stem(0, 0.4, 0, 6.6, 0.01, 0.01, 16, new THREE.Color('#3E8F8A'), 0);
  } else {
    g.box(0, 0, 0, 3.2, 0.6, 3.2, stone, 9); g.stem(0, 0.6, 0, 1.0, 0.55, 7.4, 4, stone, 9); g.stem(0, 8, 0, 0.55, 0, 1.1, 4, stone, 9);
  }
}
// A HALL: a market hall of brick, one long roof with a glazed lantern along its ridge and a gabled porch at the
// middle of each long side, on a paved ground
function hallInto(g, F, a, b, roof) {
  const brick = TONE.brick.clone().lerp(TONE.rock, 0.3), glass = new THREE.Color(0.62, 0.72, 0.76), len = 2 * b - 18;
  shedInto(g, F, 0, 0, false, 17, len, 8.5, 5, brick, roof);
  g.box(0, 12.6, 0, 3.4, 2.0, len - 10, glass, 0, { top: false });
  roofRun(g, F, 0, 5.4 - len / 2, len / 2 - 5.4, 4.6, 14.5, 1.0, roof);
  for (const sd of [-1, 1]) shedInto(g, F, sd * 9.4, 0, true, 9, 6.2, 7, 3.4, brick, roof);
  g.box(0, 7.85, 0, 17.3, 0.45, len + 0.3, TONE.stone, 0, { top: false });
}
// A CHAPEL: a stone nave under church slating, a tower with a small spire at its west end, in a walled yard of
// turf with five trees
function chapelInto(g, F, a, b, lay) {
  const stone = TONE.plaster.clone().multiplyScalar(0.8), slate = TONE.slate.clone().multiplyScalar(1.5).lerp(TONE.sea, 0.1), dark = TONE.dark;
  const A = a - 1.6, B = b - 1.6, z0 = -7, z1 = 13, hw = 4.8;
  lay([[-A, -B], [-A, B], [A, B], [A, -B]], THING_TURF);
  g.box(0, 0, (z0 + z1) / 2, 2 * hw, 7, z1 - z0, stone, 9, { top: false });
  g.quad([-hw - 0.4, 6.5, z0], [-hw - 0.4, 6.5, z1 + 0.3], [0, 13, z1 + 0.3], [0, 13, z0], slate, 12);
  g.quad([hw + 0.4, 6.5, z1 + 0.3], [hw + 0.4, 6.5, z0], [0, 13, z0], [0, 13, z1 + 0.3], slate, 12);
  g.tri([hw, 7, z1], [0, 13, z1], [-hw, 7, z1], stone, 9); g.tri([-hw, 7, z0], [0, 13, z0], [hw, 7, z0], stone, 9);
  // lancets down both sides and one in the east gable
  for (const sd of [-1, 1]) for (let z = z0 + 3; z < z1; z += 4.4) g.quad([sd * (hw + 0.05), 2.3, z - 0.6], [sd * (hw + 0.05), 5.6, z - 0.6], [sd * (hw + 0.05), 5.6, z + 0.6], [sd * (hw + 0.05), 2.3, z + 0.6], dark, 0);
  g.quad([-1, 3, z1 + 0.05], [1, 3, z1 + 0.05], [1, 8, z1 + 0.05], [-1, 8, z1 + 0.05], dark, 0);
  // the tower, its cornice, a light in each face under it, and the spire
  const tz = z0 - 2.4;
  g.box(0, 0, tz, 5.4, 15.5, 5.4, stone, 9); g.box(0, 15.5, tz, 6, 0.5, 6, TONE.white, 0, { bottom: true });
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, -1]]) {
    const ox = dx * 2.75, oz = tz + dz * 2.75, ux = Math.abs(dz) * 0.6, uz = Math.abs(dx) * 0.6;
    g.quad([ox - ux, 11.5, oz - uz], [ox + ux, 11.5, oz + uz], [ox + ux, 14.3, oz + uz], [ox - ux, 14.3, oz - uz], dark, 0);
  }
  g.stem(0, 16, tz, 3.1, 0, 10.5, 8, slate, 12);
  // the yard's wall, coped pale, open before the tower
  const wall = (x0, zA, x1, zB) => g.box((x0 + x1) / 2, 0, (zA + zB) / 2, Math.abs(x1 - x0) + 0.5, 1.3, Math.abs(zB - zA) + 0.5, stone, 9, { topCol: TONE.white });
  wall(-A, -B, -A, B); wall(A, -B, A, B); wall(-A, B, A, B); wall(-A, -B, -2, -B); wall(2, -B, A, -B);
  [[-10, -13, 9], [10, -12, 8], [-10.5, 4, 10], [10.5, 8, 9.5], [-9, 14.5, 8.5]].forEach(([x, z, h]) => thingTree(g, F, x, z, h));
}
// A SCHOOL: a long range of brick under tiles with a wing at each end, a bell turret on its ridge and two stacks,
// in a paved yard within a coped wall, two trees by its gate
function schoolInto(g, F, a, b) {
  const brick = TONE.brick.clone().lerp(TONE.plaster, 0.18), tile = TONE.tile.clone().lerp(TONE.rock, 0.2), A = a - 1.4, B = b - 1.4;
  shedInto(g, F, 5.5, 0, false, 9, 2 * b - 14, 7.4, 4.2, brick, tile);
  for (const sd of [-1, 1]) {
    shedInto(g, F, -1, sd * (b - 12), true, 9.6, 13, 7.4, 4.2, brick, tile);
    g.box(5.5, 9.4, sd * 7, 1.3, 4.4, 1.3, TONE.stack, 0, { top: false });
    thingTree(g, F, -10.5, sd * 5, 8 + sd);
  }
  g.box(5.5, 11, 0, 1.8, 2.8, 1.8, TONE.white, 0, { top: false }); g.stem(5.5, 13.8, 0, 1.5, 0, 2.8, 4, TONE.slate, 0);
  const coped = brick.clone().multiplyScalar(0.85);
  const wall = (x0, zA, x1, zB) => g.box((x0 + x1) / 2, 0, (zA + zB) / 2, Math.abs(x1 - x0) + 0.45, 2.1, Math.abs(zB - zA) + 0.45, coped, 9, { topCol: TONE.white });
  wall(A, -B, A, B); wall(-A, -B, A, -B); wall(-A, B, A, B); wall(-A, -B, -A, -2.2); wall(-A, 2.2, -A, B);
}
// THE GAS WORKS: a holder of two lifts under a shallow crown, within its guide frame of ten columns and two rings;
// beside it a retort house and a round brick stack, on a ground of setts
function worksInto(g, F, a, b) {
  const oxide = new THREE.Color('#8C5646'), iron = TONE.iron, crown = new THREE.Color('#9AA09E'), brick = TONE.brick.clone().lerp(TONE.rock, 0.3);
  const hz = -b + a + 0.6, R = a - 3.6, n = 20;
  g.stem(0, 0, hz, R, R, 8.6, n, oxide, 0); g.stem(0, 8.6, hz, R - 0.5, R - 0.5, 4.6, n, oxide.clone().multiplyScalar(1.12), 0);
  g.stem(0, 8.3, hz, R + 0.12, R + 0.12, 0.5, n, iron, 0); g.stem(0, 12.9, hz, R - 0.38, R - 0.38, 0.4, n, iron, 0);
  g.stem(0, 13.2, hz, R - 0.5, 0, 1.8, n, crown, 0);
  for (let j = 0; j < 10; j++) { const an = j * Math.PI / 5; g.box((R + 1.1) * Math.cos(an), 0, hz + (R + 1.1) * Math.sin(an), 0.6, 17, 0.6, iron, 0, { top: false }); }
  for (const y of [8.4, 16.3]) g.stem(0, y, hz, R + 1.1, R + 1.1, 0.7, 10, iron, 0);
  shedInto(g, F, 0, b - 8.5, true, 10, 2 * a - 10, 6.5, 3.6, brick, TONE.slate.clone().multiplyScalar(1.3));
  // the stack, in axes of its own (a round stack's courses are drawn about its own axis)
  g.m = new THREE.Matrix4().copy(F).multiply(_m2.makeTranslation(a - 4.6, 0, b - 16.4));
  g.box(0, 0, 0, 3.4, 2.4, 3.4, brick, 9); g.stem(0, 2.4, 0, 1.45, 1.0, 14, 8, brick, 11); g.stem(0, 16.4, 0, 1.2, 1.2, 0.6, 8, TONE.dark, 0);
  g.m = F;
}
// THE STORES: a row of tall warehouses side by side, each under its own roof with its gables to the two lanes,
// every other one a storey's part higher; a hoist door high in each gable over a cart door; on a paved ground
function storesInto(g, F, a, b) {
  const walls = [TONE.brick.clone().lerp(TONE.rock, 0.35), TONE.brick.clone().lerp(TONE.rock, 0.15).multiplyScalar(0.8), TONE.stone.clone().lerp(TONE.brick, 0.3)];
  const roofs = [TONE.slate.clone().multiplyScalar(1.35), TONE.tile.clone().lerp(TONE.rock, 0.25)];
  const n = Math.floor((2 * b - 5) / 10), len = 2 * a - 9;
  for (let i = 0; i < n; i++) {
    const f = shedInto(g, F, 0, (i - (n - 1) / 2) * 10, true, 10, len, 9.5 + (i % 2) * 1.2, 3.6, walls[i % 3], roofs[i % 2]);
    g.m = f;
    for (const sd of [-1, 1]) {
      const z = sd * (len / 2 + 0.06);
      g.quad([-1.1, 7.6, z], [1.1, 7.6, z], [1.1, 10.2, z], [-1.1, 10.2, z], TONE.dark, 0);
      g.quad([-1.7, 0, z], [1.7, 0, z], [1.7, 3.4, z], [-1.7, 3.4, z], TONE.wood, 0);
    }
    g.m = F;
  }
}
// The larger things are built into one mesh of the town's own stuff (the town's shader, as the landmarks have it),
// each in a frame stood by the fold at its ground's centre, so it falls toward its own ground as a house does.
async function buildWallThings(ctx, group, mat) {
  if (!WALL_THINGS.length) return null;
  const g = new Geo(), lead = new THREE.Color('#A9B0B4').multiplyScalar(0.92), tile = TONE.tile.clone().lerp(TONE.rock, 0.15);
  // the grounds' stuff is the lanes' own: paving (`flags`) a little darker than a lane's pavement, which is the
  // town's ground by 0.8, and setts as dark as a lane's setts, the town's ground by 0.66
  const flags = TONE.cobble.clone().multiplyScalar(0.74), setts = TONE.cobble.clone().multiplyScalar(0.66);
  let halls = 0;
  for (let i = 0; i < WALL_THINGS.length; i++) {
    const T = WALL_THINGS[i], r = THING_GROUNDS[i], a = (r.s1 - r.s0) / 2, b = (r.z1 - r.z0) / 2;
    const F = standAt((r.s0 + r.s1) / 2, (r.z0 + r.z1) / 2, 0, 0, 1), lay = thingFloor(g, F);
    // a green lays its own ground and a chapel's yard is turf; the others stand on paving, the gas works on setts
    g.m = F;
    if (T.kind !== 'green' && T.kind !== 'chapel') lay([[-a, -b], [-a, b], [a, b], [a, -b]], T.kind === 'works' ? setts : flags);
    if (T.kind === 'green') greenInto(g, F, a, b, lay);
    else if (T.kind === 'hall') hallInto(g, F, a, b, halls++ ? tile : lead);
    else if (T.kind === 'chapel') chapelInto(g, F, a, b, lay);
    else if (T.kind === 'school') schoolInto(g, F, a, b);
    else if (T.kind === 'works') worksInto(g, F, a, b);
    else storesInto(g, F, a, b);
    await ctx.yield();
  }
  const mesh = new THREE.Mesh(g.build(), makeTownMaterial(mat.uniforms)); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  group.add(mesh);
  return mesh;
}
// a far house's outshot: a box that stands against the house at x = xIn and out to xOut, between z0 and z1, from y0
// to y1: its outer face, its two sides and a lid of the roof's stuff; the face against the house is not built
function farStub(g, xIn, xOut, z0, z1, y0, y1, W) {
  const a = Math.min(xIn, xOut), b = Math.max(xIn, xOut);
  g.quad([xOut, y0, z0], [xOut, y1, z0], [xOut, y1, z1], [xOut, y0, z1], W, 1);
  g.quad([a, y0, z0], [a, y1, z0], [b, y1, z0], [b, y0, z0], W, 1);
  g.quad([b, y0, z1], [b, y1, z1], [a, y1, z1], [a, y0, z1], W, 1);
  g.quad([a, y1, z0], [a, y1, z1], [b, y1, z1], [b, y1, z0], W, 2);
}
// THE FAR HOUSES' TEETH: four more far pieces, each in a house's own axes and stood by the house's own matrix, so
// that it takes its house's tones. 'turned': a whole house whose roof is turned, its gables to the lane before it
// and to its garden, its ridge a hand higher than its neighbours' and one stack astride it. 'cross': a gable over
// the house's front, its ridge running back into the roof. 'wing': a back kitchen of one storey, where the near
// house has its own; 'wing2': the same of two storeys. (A far house has no bay, no dormer and no second stack:
// at the far houses' distance each is a fleck a pixel or two wide, and tried on every house they made the town
// busier, not more varied.)
// A roof's courses are drawn across local x and run along local z, so each turned roof is built in axes of its own.
const FAR_PIECES = ['turned', 'cross', 'wing', 'wing2'];
function farPieceGeo(piece) {
  const g = new Geo(), W = new THREE.Color(1, 1, 1), eave = 7, m = new THREE.Matrix4();
  if (piece === 'turned') {
    g.box(0, 0, 0, 10, eave, 8, W, 1, { top: false });
    // its roof spans the house's 8 m and runs its 10 m: built 7 m long and drawn out, so its courses hold. Its two
    // gables are hung with the roof's own slates or tiles, so from afar the house is one roof and no pale wall
    const top = eave + 3.6;
    g.m = m.makeRotationY(HALF_PI).scale(_v0.set(1, 1, 10 / 7));
    g.quad([-4, eave, -3.5], [-4, eave, 3.5], [0, top, 3.5], [0, top, -3.5], W, 2);
    g.quad([4, eave, 3.5], [4, eave, -3.5], [0, top, -3.5], [0, top, 3.5], W, 2);
    g.tri([-4, eave, -3.5], [0, top, -3.5], [4, eave, -3.5], W, 2); g.tri([4, eave, 3.5], [0, top, 3.5], [-4, eave, 3.5], W, 2);
    g.m = null;
    g.box(2.2, eave + 2.4, 0, 1.3, 3.2, 1.5, TONE.stack, 0, { top: false });
  } else if (piece === 'cross') {
    // two slopes from the front eave back to where their ridge meets the house's roof, and the gable's own face,
    // hung with the roof's stuff as a turned house's are
    const half = 2.3, top = eave + 2.6, back = 5 * (1 - 2.6 / 3.4), zc = -1.2;
    g.m = m.makeTranslation(-3.3, 0, zc).multiply(_m2.makeRotationY(-HALF_PI));
    for (const sd of [-1, 1]) g.quad([sd * half, eave, 2.0], [0, top, 2.0], [0, top, back - 3.3], [sd * half, eave, 1.7], W, 2);
    g.tri([-half, eave, 1.72], [0, top, 1.72], [half, eave, 1.72], W, 2);
    g.m = null;
  } else farStub(g, 5, 7.4, -0.2, 3.4, 0, piece === 'wing2' ? 5.9 : 3.2, W);
  return g.build();
}
// one house model: depth 10 along local x, width 8 along local z, eaves at 7, ridge along z. Walls and roofs are
// white here and take the house's own brick or plaster, slate or tile, from its instance.
function houseGeo(model, near) {
  const g = new Geo(), W = new THREE.Color(1, 1, 1), trim = TONE.white, pot = TONE.tile;
  const eave = 7, rise = 3.4;
  g.box(0, 0, 0, 10, eave, 8, W, 1, { top: false });
  g.gable(0, eave, 0, 10, 8, rise, W, W, near ? 0.5 : 0);
  if (!near) { g.box(2.2, eave + 1.2, model % 2 ? 2.6 : -2.6, 1.3, 4.2, 1.5, TONE.stack, 0, { top: false }); return g.build(); }
  // chimney stack and two pots
  const cz = model % 2 ? 2.6 : -2.6;
  const stack = (sx, sz) => {
    g.box(sx, eave + 1.2, sz, 1.3, 3.55, 1.6, TONE.stack, 9, { top: false });
    g.box(sx, eave + 4.75, sz, 1.56, 0.45, 1.86, TONE.stone, 0, { bottom: true, topCol: TONE.dark });
    for (const dz of [-0.42, 0.42]) g.stem(sx, eave + 5.2, sz + dz, 0.32, 0.24, 0.9, 6, pot, 0);
  };
  stack(2.2, cz);
  if (model === 1 || model === 2) stack(-2.2, -cz);
  // door step and porch on the street side
  g.box(-5.4, 0, model < 2 ? -2 : 2, 0.8, 0.4, 2.0, TONE.stone, 0);
  g.box(-5.15, 0.4, model < 2 ? -2 : 2, 0.3, 2.4, 1.2, TONE.wood, 0);
  if (model === 1 || model === 3) {
    // a dormer in the street-side roof
    g.box(-2.6, eave + 0.9, 0.6, 2.0, 1.5, 1.8, W, 1, { topCol: W, topKind: 2 });
  }
  if (model >= 2) {
    // a bay on the street side with its own little roof
    g.box(-5.6, 0.5, -1.2, 1.2, 5.2, 2.6, W, 1, { topCol: W, topKind: 2 });
  }
  if (model === 0 || model === 3) {
    // a back kitchen with a lean-to roof
    g.box(6.2, 0, 1.6, 2.4, 3.2, 3.6, W, 1, { topCol: W, topKind: 2 });
  }
  // a pale band under the eaves
  g.box(0, eave - 0.35, 0, 10.2, 0.35, 8.02, trim, 0, { top: false });
  // the roof's own dress, which is what a house on the wall shows the harbour: ridge tiles, gutters along both
  // eaves, and on the houses without a dormer a skylight in the back slope
  g.box(0, eave + rise - 0.16, 0, 0.56, 0.34, 8.3, TONE.stack, 0);
  for (const gx of [-5.62, 5.62]) g.box(gx, eave - 0.62, 0, 0.24, 0.24, 8.1, TONE.iron, 0);
  if (model === 0 || model === 2) {
    const zc = model ? -1.9 : 1.9, nx = 0.562, ny = 0.827;
    const at = (t, z, lift) => [5.5 - 5.5 * t + nx * lift, eave - 0.34 + 3.74 * t + ny * lift, z];
    g.quad(at(0.3, zc - 0.95, 0.07), at(0.3, zc + 0.95, 0.07), at(0.62, zc + 0.95, 0.07), at(0.62, zc - 0.95, 0.07), trim, 0);
    g.quad(at(0.34, zc - 0.75, 0.12), at(0.34, zc + 0.75, 0.12), at(0.58, zc + 0.75, 0.12), at(0.58, zc - 0.75, 0.12), TONE.dark.clone().lerp(TONE.sea, 0.35), 0);
  }
  return g.build();
}

// THE HOUSES: terraces in rows across the street every ROW_STEP metres of plan, on floor, bend and wall alike.
// Each is rigid: one matrix from the fold at its plot's centre, written once.
export async function buildHouses(ctx, group, mat, P, path, nearReach) {
  const rows = [];
  for (let k = 0; ROW0 + ROW_STEP * k + 6 < S_RIM; k++) rows.push(ROW0 + ROW_STEP * k);
  const quarters = [ctx.rng.fork('floor'), ctx.rng.fork('bend'), ctx.rng.fork('wall')];
  const wallTones = [TONE.brick.clone().lerp(TONE.rock, 0.22), TONE.brick.clone().lerp(TONE.rock, 0.12).multiplyScalar(0.84), TONE.brick.clone().lerp(TONE.plaster, 0.3), TONE.plaster.clone().lerp(TONE.brick, 0.2).multiplyScalar(0.84), TONE.plaster.clone().lerp(TONE.rock, 0.3).multiplyScalar(0.74), TONE.plaster.clone().lerp(TONE.enamel, 0.34).multiplyScalar(0.76)];
  const roofTones = [TONE.slate.clone().lerp(TONE.rock, 0.15).multiplyScalar(1.3), TONE.tile.clone().lerp(TONE.rock, 0.3).multiplyScalar(0.9), TONE.slate.clone().lerp(TONE.rock, 0.15).multiplyScalar(1.7), TONE.tile.clone()];
  // lists 0..3 the near houses by model, 4..7 the far houses by model; 8 the far houses whose roof is turned, 9 the
  // far houses that carry a cross gable, 10 those with a back kitchen of one storey, 11 of two (FAR_PIECES, in
  // that order)
  const lists = []; for (let i = 0; i < 8 + FAR_PIECES.length; i++) lists.push([]);
  const all = [];
  const p = new THREE.Vector3();
  // THE TEETH'S OWN DEAL, apart from every other of the town: one draw for every terrace at its first plot and five
  // for every plot of every row, in the rows' and the plots' own order and before any plot is left out, so a
  // plot's draws are its own whatever stands about it
  const teeth = ctx.core.makeRng(ctx.core.hashSeed('wall-teeth:' + ctx.seed));
  let gabled = false;
  // every random draw of a quarter is taken here in one pass
  for (const s of rows) {
    if (rows.indexOf(s) % 6 === 5) await ctx.yield();
    const rng = s < LAND.sCrease ? quarters[0] : s < S_WALL ? quarters[1] : quarters[2];
    let blockModel = 0, blockRoof = 0, blockH = 1, blockWall = 0;
    for (let j = 0, z = LAND.z0 + STREET.first; z < LAND.z1 - 6; j++, z += STREET.plot) {
      const inBlock = j % STREET.every;
      if (inBlock === 0) gabled = teeth() < 1 / 6;
      const tTurn = teeth(), tCross = teeth(), tHigh = teeth(), tBy = teeth(), tWing = teeth();
      // a terrace between two streets is built as one: its model, its roof, its height and its walling, with an
      // odd house here and there
      if (inBlock === 0) { blockModel = rng.int(0, 3); blockRoof = rng.int(0, 3); blockH = rng.range(0.9, 1.25); blockWall = rng.int(0, 5); }
      const model = rng() < 0.7 ? blockModel : rng.int(0, 3), ofBlock = rng() < 0.62, wall = ofBlock ? blockWall : rng.int(0, 5), roof = rng() < 0.8 ? blockRoof : rng.int(0, 3);
      const sy = clamp(blockH + rng.range(-0.1, 0.12), 0.86, 1.33), flip = rng() < 0.5;
      if (inBlock >= STREET.every - STREET.open || keptClear(P, s, z, true)) continue;
      // the town roofs by quarters: here slate, there tile, in broad patches; the draw only picks the shade
      const tiled = ctx.noise.n2(s * 0.0062 + 3.1, z * 0.0048 - 1.7) + 0.35 * ctx.noise.n2(s * 0.021, z * 0.017) > -0.08;
      const roofOf = (r) => (tiled ? 1 : 0) + (r & 2);
      // and its walls likewise: a quarter of brick, a quarter of washed plaster; a terrace takes its quarter's
      // walling in a shade of its own, and the odd house keeps whatever it was dealt
      const plastered = ctx.noise.n2(s * 0.0083 - 6.4, z * 0.0069 + 2.9) + 0.3 * ctx.noise.n2(s * 0.024 + 5, z * 0.02) > 0.12;
      const wallOf = (w) => (plastered ? 3 : 0) + w % 3;
      fold(s, z, 5, p);
      const near = path.distanceTo(p.x, p.y, p.z) < nearReach;
      // the house at each end of a terrace is turned to front the street that goes up beside it, its ridge along
      // the street, and stands a metre out toward it; not where that street is a square, a quay or a yard
      const end = inBlock === 0 ? -1 : inBlock === STREET.every - STREET.open - 1 ? 1 : 0;
      const turned = end !== 0 && !keptClear(P, s, z + end * STREET.plot, true);
      const h = { s, z: turned ? z + end : z, sy, yaw: turned ? end * HALF_PI : flip ? Math.PI : 0, wall: ofBlock ? wallOf(wall) : wall, roof: roofOf(roof), near, model };
      // a house dealt to a plot of a churchyard is not built; it keeps its place in the list, so that every other
      // house's wisp and washing are as they were dealt
      // nor is a house dealt to a plot of one of the wall's larger things: it is marked as a churchyard's is, so it
      // has no garden, no tree and no line, and every other house is as it was dealt
      if (inYard(P, s, h.z, turned ? HOUSE_HALF.turned : HOUSE_HALF.wide) || thingAt(s, z)) h.yard = true;
      else if (near) lists[model].push(h);
      else {
        // A FAR HOUSE'S FORM, from its terrace's draw and its plot's own five. One terrace in six is gabled: every
        // house of it has its roof turned, gables to the lane and the garden; so has one house in eight of the
        // other terraces. Of the rest, one in six carries a cross gable over its front; and of those whose near
        // model has a back kitchen (models 0 and 3), three in five have theirs, one in four of them of two
        // storeys; but a terrace's end house that is turned to the street has none, for its kitchen would stand
        // in its neighbour, or on the open ground where its neighbour is gone. One house in seven stands a fifth
        // to two fifths higher than it was dealt and one in nine a sixth to a quarter lower, kept between 0.64
        // and 1.55 of the model's own height: so a terrace's roofline and its garden side have teeth, and no two
        // terraces the same ones
        h.high = clamp(h.sy * (tHigh < 1 / 7 ? 1.2 + 0.2 * tBy : tHigh > 8 / 9 ? 0.74 + 0.1 * tBy : 1), 0.64, 1.55);
        if (gabled || tTurn < 1 / 8) lists[8].push(h);
        else {
          lists[4 + model].push(h);
          if (tCross < 1 / 6) lists[9].push(h);
          if (!turned && (model === 0 || model === 3) && tWing < 0.6) lists[tWing < 0.15 ? 11 : 10].push(h);
        }
      }
      all.push(h);
    }
  }
  await ctx.yield();
  const m = new THREE.Matrix4(), sc = new THREE.Vector3();
  const meshes = [];
  for (let li = 0; li < lists.length; li++) {
    const list = lists[li]; if (!list.length) continue;
    const geo = li < 8 ? houseGeo(li % 4, li < 4) : farPieceGeo(FAR_PIECES[li - 8]);
    const iWall = new Float32Array(list.length * 3), iRoof = new Float32Array(list.length * 3);
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      // a near house stands as high as it was dealt; a far house and its pieces as high as its form has it
      standAt(h.s, h.z, 0, h.yaw, sc.set(1, h.near ? h.sy : h.high, 1), m);
      mesh.setMatrixAt(i, m);
      // one roof in six has been re-laid in the other stuff: by the house's own place, not by a draw
      const mend = Math.sin(h.s * 12.9898 + h.z * 78.233) * 43758.5453, relaid = mend - Math.floor(mend) < 1 / 6;   // (BROUGHT IN: the published hash form, see this file's head)
      const w = wallTones[h.wall], r = roofTones[relaid ? h.roof ^ 1 : h.roof];
      iWall[i * 3] = w.r; iWall[i * 3 + 1] = w.g; iWall[i * 3 + 2] = w.b;
      iRoof[i * 3] = r.r; iRoof[i * 3 + 1] = r.g; iRoof[i * 3 + 2] = r.b;
      if (i % 150 === 149) await ctx.yield();
    }
    geo.setAttribute('iWall', new THREE.InstancedBufferAttribute(iWall, 3));
    geo.setAttribute('iRoof', new THREE.InstancedBufferAttribute(iRoof, 3));
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    group.add(mesh); meshes.push(mesh);
    await ctx.yield();
  }
  await buildWallThings(ctx, group, mat);
  return { all, meshes };
}

// ---------- sky and sea: the witnesses. The sea is level to the horizon on every side of the land. ----------
export function buildSkyAndSea(ctx, scene, air) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(5200, 32, 16), new THREE.ShaderMaterial({
    uniforms: { ...air, uDeep: { value: TONE.sea.clone() } },
    vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
      if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`varying vec3 vD; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uFogCol; uniform vec3 uHazeSun; uniform vec3 uZenith; uniform vec3 uDeep; uniform float uTime;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      // one rank of heaped cloud standing on a level base: x runs round the horizon, el is the height above it
      vec4 heaps(float x, float el, float base, float tall, float th, vec3 lightC, vec3 shadeC) {
        float heap = vnoise(vec2(x, 1.7)) * .6 + vnoise(vec2(x * 2.3 + 3., 5.1)) * .4;
        float grow = smoothstep(th, th + .34, heap);
        float top = base + tall * grow * (.6 + .4 * vnoise(vec2(x * 5. + 1., 9.3)));
        top += tall * .1 * (vnoise(vec2(x * 13., el * 70.)) - .5) * grow;
        float body = step(th + .005, heap) * smoothstep(base - .0015, base + .0025, el) * (1. - smoothstep(top - .005, top, el));
        float h = clamp((el - base) / max(top - base, 1e-3), 0., 1.);
        float billow = vnoise(vec2(x * 9. + 4., el * 55.));
        vec3 c = mix(shadeC, lightC, smoothstep(.1, .85, h * .75 + billow * .4));
        return vec4(c, body);
      }
      void main() {
        vec3 d = vD / max(length(vD), 1e-4);
        float up = clamp(d.y, 0., 1.);
        float sd = max(dot(d, uSun), 0.);
        float s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
        // the horizon is the haze's own tone, as the far land and sea are; the blue deepens overhead
        vec3 hor = uFogCol + uHazeSun * s2 * sd;
        vec3 c = mix(hor, uZenith, 1. - exp(-up * 4.));
        c = mix(c, mix(uDeep, uFogCol, .58), step(d.y, 0.));
        c += uSunCol * (.08 * s8 + .5 * s64 * s64 * s64 + 5. * smoothstep(.99965, .9998, sd));
        float el = atan(d.y, max(length(d.xz), 1e-4));
        float az = atan(d.z, d.x + step(abs(d.x) + abs(d.z), 1e-5) * 1e-3);
        // mares' tails high up: long thin streaks, drifting slowly
        float streak = vnoise(vec2(az * 2.2 + uTime * .006, el * 26. - az * 3.)) * .6 + vnoise(vec2(az * 7. - uTime * .004, el * 60. - az * 9.)) * .4;
        c = mix(c, vec3(1.) * (.72 + .28 * uSunCol), .2 * smoothstep(.6, .88, streak) * smoothstep(.12, .3, el) * (1. - smoothstep(.5, .85, el)));
        // two ranks of heaped cloud along the horizon, level-based, the nearer taller; each drifts on the clock
        vec3 lightC = mix(vec3(1.), uSunCol * uSunCol, .6) * 1.02, shadeC = mix(hor, vec3(.56, .63, .76), .55);
        vec4 far = heaps(az * 11. + uTime * .0025, el, .012, .035, .44, mix(lightC, hor, .45), mix(shadeC, hor, .5));
        c = mix(c, far.rgb, far.a * .85);
        vec4 near = heaps(az * 4.6 + 20. + uTime * .004, el, .03, .15, .44, lightC, shadeC);
        c = mix(c, near.rgb, near.a * .93);
        // and here and there a great tower of cloud standing over them, upright as a mast
        vec4 tower = heaps(az * 2.1 + 40. + uTime * .005, el, .055, .34, .56, lightC * 1.03, mix(shadeC, vec3(.6, .66, .78), .4));
        c = mix(c, tower.rgb, tower.a * .95);
        gl_FragColor = vec4(c, 1.);
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  // the sea: one great level plane, its swell and glitter worked out per pixel from the clock
  const seaGeo = new THREE.PlaneGeometry(24000, 24000, 1, 1); seaGeo.rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({
    uniforms: { ...air, uDeep: { value: TONE.sea.clone() } },
    vertexShader: /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`varying vec3 vW; uniform float uTime; uniform vec3 uDeep;
      ${AIR_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      // the shade the two level clouds lay on the sea: each an oval with a broken edge, found along the sun's ray
      float cloudLit(vec3 p) {
        float lit = 1.;
        vec4 cl[2]; cl[0] = vec4(${((DECK.x0 + DECK.x1) / 2).toFixed(1)}, ${((DECK.z0 + DECK.z1) / 2).toFixed(1)}, ${((DECK.x1 - DECK.x0) / 2).toFixed(1)}, ${((DECK.z1 - DECK.z0) / 2).toFixed(1)});
        cl[1] = vec4(${((FLOOR.x0 + FLOOR.x1) / 2).toFixed(1)}, ${((FLOOR.z0 + FLOOR.z1) / 2).toFixed(1)}, ${((FLOOR.x1 - FLOOR.x0) / 2).toFixed(1)}, ${((FLOOR.z1 - FLOOR.z0) / 2).toFixed(1)});
        float high[2]; high[0] = ${((DECK.y0 + DECK.y1) / 2).toFixed(1)}; high[1] = ${((FLOOR.y0 + FLOOR.y1) / 2).toFixed(1)};
        for (int i = 0; i < 2; i++) {
          vec2 q = p.xz + uSun.xz * (high[i] / max(uSun.y, .08));
          vec2 d = (q - cl[i].xy) / cl[i].zw;
          float r = dot(d, d) + .4 * (vnoise(q * .021 + 3.) - .5) + .2 * (vnoise(q * .06) - .5);
          lit *= 1. - .4 * (1. - smoothstep(.45, 1.02, r));
        }
        return lit;
      }
      void main() {
        vec3 toEye = cameraPosition - vW; float dist = max(length(toEye), 1e-3); vec3 v = toEye / dist;
        vec2 p = vW.xz; float t = uTime;
        float calm = 1. / (1. + dist * .004); float far = 1. / (1. + dist * dist * .0000012);
        float fg0 = min(1. - exp(-uFogD * 1.6 * dist), .62);
        // the swell: four trains of waves crossing
        vec2 g = vec2(0.);
        g += vec2(.8, .6) * cos(dot(p, vec2(.8, .6)) * .09 + t * .55) * .22 * far;
        g += vec2(-.5, .86) * cos(dot(p, vec2(-.5, .86)) * .21 + t * .9) * .16 * far * calm;
        g += vec2(.95, -.3) * cos(dot(p, vec2(.95, -.3)) * .53 + t * 1.5) * .12 * calm * calm;
        g += vec2(.2, .98) * cos(dot(p, vec2(.2, .98)) * 1.3 + t * 2.3) * .10 * calm * calm;
        vec3 n = vec3(-g.x, 1., -g.y); n /= max(length(n), 1e-4);
        float fr = 1. - max(dot(n, v), 0.); fr = fr * fr; fr = .04 + .96 * fr * fr * (1. - .2 * fr);
        vec3 refl = reflect(-v, n); refl.y = abs(refl.y);
        vec3 skyc = mix(uFogCol, uZenith, 1. - exp(-refl.y * 3.2));
        float sh = slabShadow(vW);
        vec3 water = uDeep * (.34 + .5 * max(dot(n, uSun), 0.) * sh) * mix(uShade, vec3(1.), .55 + .45 * sh);
        // sunlit water takes the hour's colour; the slab's shade on it stays cool
        water *= mix(vec3(1.), uSunCol * uSunCol, .45 * sh);
        float paw = vnoise(p * .06 + vec2(t * .5, t * .23)) * .6 + vnoise(p * .017 - vec2(t * .12, t * .19)) * .4;
        water *= .82 + .36 * paw;
        // the harbour's shallows off the quay are paler and greener; clouds' shadows cross the open sea
        float shoal = smoothstep(-190., -4., vW.x) * step(vW.x, 2.) * smoothstep(-520., -430., vW.z) * (1. - smoothstep(915., 1000., vW.z));
        water = mix(water, vec3(.16, .46, .47) * (.5 + .5 * sh), shoal * .5);
        float cloudSh = smoothstep(.3, .7, vnoise(p * .0042 + vec2(t * .011, t * .006)) * .65 + vnoise(p * .011 - vec2(t * .008, 0.)) * .35);
        water *= mix(.66, 1.1, cloudSh);
        float underCloud = cloudLit(vW); water *= underCloud;
        vec3 c = mix(water, skyc * mix(.86, 1., cloudSh), clamp(fr, 0., 1.) * (.6 + .4 * paw)) * (.5 + .5 * underCloud);
        // whitecaps: flecks that drift with the wind and come and go, in two sizes of cell fixed in the water,
        // the longest a rowing boat's length, so from high on the wall they are specks far below;
        // each size shows where a pixel is finer than its flecks and fades out where it is not
        float pxl = max(fwidth(p.x) + fwidth(p.y), 1e-4), cap = 0.;
        vec2 capCell = vec2(3.5, 9.);
        for (int i = 0; i < 2; i++) {
          float cs = capCell[i];
          vec2 wc = (p + vec2(3.2, 1.9) * t) / cs + float(i) * 17.3;
          vec2 wi = floor(wc), wf = fract(wc) - .5;
          float life = fract(h21(wi) * 7. + t * .42);
          float one = step(.8, h21(wi + 3.7)) * smoothstep(0., .2, life) * (1. - smoothstep(.35, .7, life));
          one *= 1. - smoothstep(.08, .4, length(vec2(wf.x * .55, wf.y * 2.2) + vec2(0., .25 * sin(wf.x * 9. + h21(wi) * 6.))));
          cap = max(cap, one * (1. - smoothstep(.12, .4, pxl / cs)) * smoothstep(.003, .01, pxl / cs));
        }
        // the long swell from seaward, seen as bands of lighter and darker water, and the wind's streaks along it
        float swell = sin(dot(p, vec2(.8, .6)) * .09 + t * .55) * .5 + sin(dot(p, vec2(-.5, .86)) * .21 + t * .9) * .3 + sin(dot(p, vec2(.74, .67)) * .037 - t * .2) * .4;
        float streaks = vnoise(vec2(dot(p, vec2(.6, -.8)) * .05, dot(p, vec2(.8, .6)) * .004 + t * .01));
        c *= 1. + (.11 * swell + .1 * (streaks - .5)) * mix(1., .45, fg0);
        // cat's paws: the breeze ruffles the water in patches that run before it, in sun and in shade alike
        float ruffle = vnoise((p + vec2(8.2, 4.1) * t) * .03) * .6 + vnoise((p + vec2(11., 2.4) * t) * .075) * .4;
        float pawEdge = smoothstep(.45, .56, ruffle);
        c *= mix(.8, 1.07, pawEdge) * (1. + .14 * (vnoise((p + vec2(9., 3.) * t) * .31) - .5) * pawEdge);
        c = mix(c, vec3(.93, .96, .97) * (.5 + .5 * sh), cap * .6);
        // the water's facets throw the bright sky back in short glints that come and go, in sun and in shade
        float gl = 0.;
        vec4 glCell = vec4(.75, 3., 12., 48.);
        for (int i = 0; i < 4; i++) {
          float cs = glCell[i];
          vec2 gc = p / cs + float(i) * 9.1; vec2 gi = floor(gc), gf = fract(gc) - .5;
          float gph = t * 1.9 + h21(gi) * 6.;
          float one = mix(step(.915, h21(gi + floor(gph) * 1.37)), step(.915, h21(gi + (floor(gph) + 1.) * 1.37)), smoothstep(.25, .75, fract(gph)));
          one *= 1. - smoothstep(.18, .5, length(vec2(gf.x * .7, gf.y * 1.5)));
          gl = max(gl, one * (1. - smoothstep(.14, .45, pxl / cs)) * smoothstep(.003, .01, pxl / cs));
        }
        c += (skyc * .5 + uSunCol * .3 * sh) * gl * (1. - smoothstep(.3, .6, fg0));
        // glitter on the sun's road, never brighter than a soft sparkle
        // far off the swell's facets are finer than the eye: the road there is one soft gleam, broken by the cat's paws
        float flat_ = smoothstep(60., 520., dist);
        vec3 nR = vec3(-g.x * (1. - .85 * flat_), 1., -g.y * (1. - .85 * flat_)); nR /= max(length(nR), 1e-4);
        vec3 reflR = reflect(-v, nR); reflR.y = abs(reflR.y);
        float sd = max(dot(reflR, uSun), 0.); float s4 = sd * sd; s4 *= s4; float s32 = s4 * s4; s32 *= s32 * s32;
        s32 *= mix(1., .55 + .7 * ruffle, flat_);
        float tw = h21(floor(p * 1.7) + floor(t * 2.) * .37);
        float tw2 = h21(floor(p * 1.7) + floor(t * 2. + 1.) * .37);
        float spark = mix(tw, tw2, smoothstep(0., 1., fract(t * 2.)));
        c += uSunCol * min(1.4, s32 * (.5 + 1.6 * spark * calm * 2.)) * sh;
        // and all along the road the same facets flash the sun itself, each for a moment
        c += uSunCol * min(.9, s32 * 3.) * gl * sh;
        // vapour lies on the water: far water is paler and bluer than land as far off
        gl_FragColor = vec4(mix(c, mix(uDeep, uFogCol, .58), fg0), 1.);
      }`,
  }));
  sea.frustumCulled = false; sea.matrixAutoUpdate = false;
  scene.add(sea);
  return { sky, sea };
}

// ---------- THE DEVICE: the whole town, built in short steps ----------
// Later sections of this file add their makers to MAKERS; each receives the device D and may add
// to D.tick functions of (time, camera) that place movers by the world's clock alone.
const MAKERS = [];
export const HOURS = {
  // morning: the sun stands over the sea ahead and to seaward, low enough to rake the wall's face, so every terrace
  // and every tall thing lays its shade down the wall and each house has a lit and a shaded side
  morning: { sun: [-0.52, 0.45, 0.73], col: '#FFF1D6', gain: 1.08, zenith: '#4E8FCF', fog: '#D4E6EF', haze: [0.2, 0.13, 0.04] },
  noon: { sun: [-0.45, 0.85, 0.28], col: '#FFFFFF', gain: 1.0, zenith: '#3F86CC', fog: '#D4E6EF', haze: [0.06, 0.06, 0.05] },
  gold: { sun: [0.20, 0.36, -0.91], col: '#FFC98A', gain: 1.25, shade: [0.47, 0.45, 0.56], lift: 1.9, glow: 0.5, zenith: '#4F84C6', fog: '#F2CC9C', haze: [0.42, 0.24, 0.06], bounce: '#A6A3B4', fill: '#B4CBF0' },
};
// the tall things that throw a shade, as round shafts in the world: plan place, height of each end over its own
// ground, radius at each end. A steeple is its tower, its spire and its nave; the viaduct its deck and piers.
function setCasters(air, P) {
  const A = air.uCastA.value, B = air.uCastB.value; let n = 0;
  const shaft = (s0, z0, h0, r0, s1, z1, h1, r1) => {
    if (n >= CASTERS) return;
    fold(s0, z0, h0, _v0); A[n].set(_v0.x, _v0.y, _v0.z, r0); fold(s1, z1, h1, _v0); B[n].set(_v0.x, _v0.y, _v0.z, r1); n++;
  };
  for (const at of [P.steepleLying, P.steepleUp]) {
    shaft(at.s, at.z, 0, 4.2, at.s, at.z, 29, 4.2); shaft(at.s, at.z, 29, 3.8, at.s, at.z, 55, 0.3);
    shaft(at.s, at.z + 4, 4.5, 5.2, at.s, at.z + STEEPLE.naveEnd - 3, 4.5, 5.2);
  }
  for (const at of [...P.mills, P.millUp]) shaft(at.s, at.z, 0, 4.8, at.s, at.z, 20, 1.6);
  for (const at of P.chimneys) shaft(at.s, at.z, 0, CHIMNEY.foot + 0.6, at.s, at.z, CHIMNEY.tall, CHIMNEY.top + 0.3);
  for (const at of [P.clock, P.clockLying]) shaft(at.s, at.z, 0, 4.4, at.s, at.z, 38, 3.6);
  const v = P.viaduct, vl = viaductLine(P), span = vl.len / VIADUCT.arches;
  shaft(v.s0, v.z0, v.h, 3.2, v.s1, v.z1, v.h, 3.2);
  for (let i = 0; i <= VIADUCT.arches && n < CASTERS; i++) shaft(v.s0 + i * span * vl.ds, v.z0 + i * span * vl.dz, 0, 2.9, v.s0 + i * span * vl.ds, v.z0 + i * span * vl.dz, v.h, 2.9);
}
export async function buildDevice(ctx, scene, opts) {
  const air = makeAirUniforms();
  const plan = makePlan(); air.uPlan.value = plan.tex;
  const hour = HOURS[opts.hour] || HOURS.morning;
  air.uSun.value.set(hour.sun[0], hour.sun[1], hour.sun[2]).normalize();
  air.uSunInv.value.set(1 / air.uSun.value.x, 1 / air.uSun.value.y, 1 / air.uSun.value.z);
  air.uSunCol.value.set(hour.col).multiplyScalar(hour.gain);
  // at the late hour the whole wall stands in its own shade: a soft, open shade, lit by the sky and the sea
  if (hour.shade) air.uShade.value.set(hour.shade[0], hour.shade[1], hour.shade[2]);
  air.uZenith.value.set(hour.zenith); air.uFogCol.value.set(hour.fog); air.uHazeSun.value.setRGB(hour.haze[0], hour.haze[1], hour.haze[2]);
  // at the late hour the shade is lit blue by the sky above and warm by the sunlit sea and floor town below
  if (hour.bounce) air.uBounce.value.set(hour.bounce);
  if (hour.fill) air.uSkyCol.value.set(hour.fill);
  // and by the sea's floor of gold, which lies under the sun and to seaward: its glow comes up from there
  if (hour.lift) air.uLift.value = hour.lift;
  if (hour.glow) air.uGlow.value.copy(air.uSunCol.value).multiplyScalar(hour.glow);
  air.uGlowDir.value.set(air.uSun.value.x - 0.6, -0.4, air.uSun.value.z).normalize();
  const group = new THREE.Group(); scene.add(group);
  setCasters(air, makePlaces(opts.lakeLift || 0));
  const D = {
    ctx, scene, group, air, opts, path: opts.path, P: makePlaces(opts.lakeLift || 0), tick: [], hour,
    town: makeTownMaterial(air, false), houseMat: makeTownMaterial(air, true), free: [],
  };
  const { sky, sea } = buildSkyAndSea(ctx, scene, air);
  D.sky = sky; D.sea = sea;
  await ctx.yield();
  D.land = await buildLand(ctx, group, D.town);
  await ctx.yield();
  D.houses = await buildHouses(ctx, group, D.houseMat, D.P, D.path, 110);
  plan.fill(D.houses.all); D.free.push(plan.tex);
  await ctx.yield();
  for (const make of MAKERS) { await make(D); await ctx.yield(); }
  const camPos = new THREE.Vector3();
  return {
    group, air, places: D.P, D,
    update(dt, time, camera) {
      air.uTime.value = time;
      camera.getWorldPosition(camPos);
      sky.position.copy(camPos);
      for (let i = 0; i < D.tick.length; i++) D.tick[i](time, camera);
    },
    dispose() { for (const f of D.free) f.dispose(); },
  };
}

// ---------- the landmarks: twins are one model stood through the fold on floor and on wall ----------
// Each model is drawn in its own axes (x along the street, y its own up, z across) into g, whose matrix places it.
export function steepleModel(g) {
  const stone = TONE.plaster.clone().multiplyScalar(0.82), pale = TONE.white, dark = TONE.dark;
  // the church's slate: a blue-grey that keeps its colour in the shade, and the lead of its hips and ridge
  // (the spire's is the darker, as it stands against the sky and the town; the nave's low roof is weathered paler)
  const slate = TONE.slate.clone().multiplyScalar(1.15).lerp(TONE.sea, 0.14), naveSlate = TONE.slate.clone().multiplyScalar(1.55).lerp(TONE.sea, 0.1), lead = new THREE.Color('#A9B0B4');
  // a point on a wall's face: o its foot, u the level way along the face, n the way out of it (both in x, z)
  const P3 = (o, u, n, a, b, out) => [o[0] + u[0] * a + n[0] * out, o[1] + b, o[2] + u[1] * a + n[1] * out];
  // a lancet: a dark light with a pointed head in a pale stone surround
  const lancet = (o, u, n, w, h, glass = dark) => {
    const hw = w / 2, fw = hw + 0.28;
    g.quad(P3(o, u, n, -fw, -0.25, 0.08), P3(o, u, n, fw, -0.25, 0.08), P3(o, u, n, fw, h, 0.08), P3(o, u, n, -fw, h, 0.08), pale, 0);
    g.tri(P3(o, u, n, -fw, h, 0.08), P3(o, u, n, fw, h, 0.08), P3(o, u, n, 0, h + fw * 1.5, 0.08), pale, 0);
    g.quad(P3(o, u, n, -hw, 0, 0.16), P3(o, u, n, hw, 0, 0.16), P3(o, u, n, hw, h, 0.16), P3(o, u, n, -hw, h, 0.16), glass, 0);
    g.tri(P3(o, u, n, -hw, h, 0.16), P3(o, u, n, hw, h, 0.16), P3(o, u, n, 0, h + hw * 1.5, 0.16), glass, 0);
  };
  const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // nave beside the tower, its ridge across the street: dressed stone, four lancets and three buttresses a side,
  // slated in banded courses, a lead roll along the ridge, an east window and a cross on the gable
  g.box(0, 0, 13, 10, 8, 19, stone, 9, { top: false });
  g.quad([-5.4, 7.6, 3.5], [-5.4, 7.6, 22.5], [0, 12, 22.5], [0, 12, 3.5], naveSlate, 12);
  g.quad([5.4, 7.6, 22.5], [5.4, 7.6, 3.5], [0, 12, 3.5], [0, 12, 22.5], naveSlate, 12);
  g.tri([5, 8, 22.5], [0, 12, 22.5], [-5, 8, 22.5], stone, 9);
  g.box(0, 11.85, 13, 0.5, 0.32, 19.2, lead, 0);
  for (const sd of [-1, 1]) {
    for (const z of [6.5, 10.5, 14.5, 18.5]) lancet([sd * 5, 2.6, z], [0, 1], [sd, 0], 1.0, 3.0);
    for (const z of [8.5, 12.5, 16.5, 21.9]) { g.box(sd * 5.45, 0, z, 0.9, 4.4, 0.8, stone, 9, { topCol: pale }); g.box(sd * 5.25, 4.4, z, 0.5, 2.2, 0.7, stone, 9, { topCol: pale }); }
  }
  lancet([0, 3, 22.5], [1, 0], [0, 1], 1.8, 3.6);
  g.box(0, 12, 22.3, 0.26, 1.7, 0.26, pale, 0); g.box(0, 12.9, 22.3, 1.1, 0.26, 0.26, pale, 0);
  // tower: dressed stone with set-off buttresses at its corners, string courses, lancets in every face, the west
  // door under a tall window, and an open belfry on four posts
  g.box(0, 0, 0, 7, 22, 7, stone, 9);
  for (const cy of [7, 14.5]) g.box(0, cy, 0, 7.4, 0.5, 7.4, pale, 0, { bottom: true });                      // string courses
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.box(dx * 3.55, 0, dz * 3.55, 1.5, 7, 1.5, stone, 9, { topCol: pale }); g.box(dx * 3.5, 7, dz * 3.5, 1.2, 7.5, 1.2, stone, 9, { topCol: pale });
    g.box(dx * 3.4, 14.5, dz * 3.4, 0.7, 4.3, 0.7, stone, 9, { topCol: pale });
  }
  for (const [dx, dz] of FACES) {
    const o = [dx * 3.5, 0, dz * 3.5], u = [-dz, dx], n = [dx, dz];
    if (dz <= 0) lancet(P3(o, u, n, 0, dz < 0 ? 7.9 : 8.6, 0), u, n, dz < 0 ? 1.5 : 1.1, dz < 0 ? 4.2 : 3.2);
    for (const a of [-1.15, 1.15]) lancet(P3(o, u, n, a, 16.3, 0), u, n, 0.8, 2.8);
    // the belfry's openings are pointed: a spandrel in each upper corner between the posts
    for (const a of [-1, 1]) g.tri(P3(o, u, n, a * 2.5, 28, 0), P3(o, u, n, a * 2.5, 25.4, 0), P3(o, u, n, a * 0.25, 28, 0), stone, 0);
  }
  lancet([0, 0.5, -3.5], [1, 0], [0, -1], 1.9, 2.6, TONE.wood);                                                    // the west door
  for (const [px, pz] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) g.box(px, 22, pz, 1, 6, 1, stone, 0, { top: false });
  g.box(0, 28, 0, 7.3, 0.55, 7.3, stone, 0, { bottom: true }); g.box(0, 28.55, 0, 7.6, 0.45, 7.6, pale, 0, { bottom: true });   // the cornice
  // the slate spire, 55 m to its tip: eight sides in banded courses, a lead hip down every edge, and a gabled
  // lucarne low on each of its four cardinal edges
  g.stem(0, 29, 0, 4.4, 0, 26, 8, slate, 12);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, c = Math.cos(a), s = Math.sin(a), T = [0, 55.02, 0];
    g.tri([4.4 * c - 0.24 * s, 29, 4.4 * s + 0.24 * c], [4.64 * c, 29, 4.64 * s], T, lead, 0);
    g.tri([4.64 * c, 29, 4.64 * s], [4.4 * c + 0.24 * s, 29, 4.4 * s - 0.24 * c], T, lead, 0);
  }
  for (const [dx, dz] of FACES) {
    const o = [dx * 4.3, 30.6, dz * 4.3], u = [-dz, dx], n = [dx, dz], Q = (a, b, out) => P3(o, u, n, a, b, out);
    g.quad(Q(-0.75, 0, 0), Q(0.75, 0, 0), Q(0.75, 2, 0), Q(-0.75, 2, 0), stone, 0);
    g.tri(Q(-0.75, 2, 0), Q(0.75, 2, 0), Q(0, 3.1, 0), stone, 0);
    for (const sd of [-1, 1]) {
      g.quad(Q(sd * 0.75, 0, 0), Q(sd * 0.75, 2, 0), Q(sd * 0.75, 2, -1.6), Q(sd * 0.75, 0, -1.6), stone, 0);
      g.quad(Q(sd * 0.95, 1.75, 0.15), Q(0, 3.25, 0.15), Q(0, 3.25, -1.9), Q(sd * 0.95, 1.75, -1.9), slate, 12);
    }
    lancet(Q(0, 0.45, 0), u, n, 0.6, 1.0);
  }
  // the weathercock: a gilt ball at the tip, a rod, the four winds' arms and the cock on his arrow
  g.stem(0, 54.2, 0, 0.5, 0.5, 0.9, 5, TONE.enamel, 0, true);
  g.box(0, 55, 0, 0.16, 2.0, 0.16, TONE.iron, 0, { top: false });
  g.box(0, 55.9, 0, 1.9, 0.12, 0.12, TONE.enamel, 0); g.box(0, 55.9, 0, 0.12, 0.12, 1.9, TONE.enamel, 0);
  g.box(0, 56.7, 0, 2.2, 0.1, 0.1, TONE.enamel, 0);
  g.quad([-0.5, 57.0, 0], [0.45, 57.0, 0], [0.55, 57.55, 0], [-0.45, 57.5, 0], TONE.enamel, 0);
  g.tri([-0.45, 57.1, 0], [-1.15, 58.0, 0], [-0.3, 57.5, 0], TONE.enamel, 0);
  g.tri([0.4, 57.4, 0], [0.95, 57.75, 0], [0.45, 57.98, 0], TONE.enamel, 0);
}
// two bells in the belfry: they hang along the tower's own down, which on the wall is toward the wall
function bellsModel(g) {
  const bronze = new THREE.Color('#8A6A2E');
  for (const bx of [-1.2, 1.2]) { g.stem(bx, 23.2, 0, 1.0, 0.45, 1.5, 7, bronze, 0, true); g.box(bx, 24.7, 0, 0.2, 3.3, 0.2, TONE.iron, 0, { top: false }); }
}
function millModel(g) {
  g.stem(0, 0, 0, 5, 3.2, 17, 8, TONE.plaster.clone().multiplyScalar(0.9), 1);
  g.stem(0, 17, 0, 3.6, 0, 3.4, 8, TONE.slate, 2);
  g.box(0, 17.2, -3.2, 1.0, 1.6, 3.4, TONE.wood, 0);           // the windshaft's housing, toward the sails
}
// four sails, 20 m across, in the plane across local z; turned about local z through the hub at the origin
function sailsModel(g) {
  const cloth = TONE.white, spar = TONE.wood;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    const R = (x, y, z) => [x * c - y * s, x * s + y * c, z];
    g.quad(R(-0.25, 0, 0.15), R(0.25, 0, 0.15), R(0.25, 10, 0.15), R(-0.25, 10, 0.15), spar, 0);
    g.quad(R(0.25, 2.2, 0), R(2.4, 2.2, 0.5), R(2.4, 9.8, 0.5), R(0.25, 9.8, 0), cloth, 6);
    // the sail's lattice: bars across the cloth and a hem bar down its outer edge, on both faces
    for (const off of [-0.04, 0.04]) {
      for (let k = 0; k <= 6; k++) { const y = 2.2 + k * 1.245; g.quad(R(0.25, y, off), R(2.4, y, 0.5 + off), R(2.4, y + 0.14, 0.5 + off), R(0.25, y + 0.14, off), spar, 0); }
      g.quad(R(2.3, 2.2, 0.48 + off), R(2.44, 2.2, 0.5 + off), R(2.44, 9.8, 0.5 + off), R(2.3, 9.8, 0.48 + off), spar, 0);
      g.quad(R(1.28, 2.2, 0.24 + off), R(1.38, 2.2, 0.26 + off), R(1.38, 9.8, 0.26 + off), R(1.28, 9.8, 0.24 + off), spar, 0);
    }
  }
  g.stem(0, -0.6, 0, 0.6, 0.6, 1.2, 6, spar, 0, true);
}
function clockModel(g) {
  const stone = TONE.plaster.clone().multiplyScalar(0.88), pale = TONE.white, glass = TONE.dark.clone().lerp(TONE.sea, 0.45), copper = new THREE.Color('#5E9C8A');
  g.box(0, 0, 0, 9.6, 1.2, 9.6, TONE.stone.clone().multiplyScalar(0.8), 9); g.box(0, 1.2, 0, 9, 2.8, 9, TONE.stone, 9);
  g.box(0, 4, 0, 7, 26, 7, stone, 9);
  // dressed corners, standing a hand proud of the shaft
  for (const [qx, qz] of [[-3.3, -3.3], [3.3, -3.3], [3.3, 3.3], [-3.3, 3.3]]) g.box(qx, 4, qz, 0.9, 26, 0.9, pale, 9, { top: false });
  for (const cy of [11, 18, 25]) g.box(0, cy, 0, 7.7, 0.6, 7.7, pale, 0, { bottom: true });       // string courses
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    const R = (x, y, z) => [x * c + z * s, y, -x * s + z * c];
    const face = (x0, y0, x1, y1, z, col) => g.quad(R(x0, y0, z), R(x1, y0, z), R(x1, y1, z), R(x0, y1, z), col, 0);
    // a tall window to each stage: glass in a pale surround with a sill and a glazing bar, and a door at the foot of one face
    for (const cy of [6.2, 13.2, 20.2]) {
      face(-1.15, cy - 0.3, 1.15, cy + 3.9, 3.53, pale); face(-0.75, cy, 0.75, cy + 3.5, 3.58, glass);
      face(-0.06, cy, 0.06, cy + 3.5, 3.62, pale); face(-0.75, cy + 2.2, 0.75, cy + 2.32, 3.62, pale);
      face(-1.4, cy - 0.6, 1.4, cy - 0.3, 3.7, pale);
    }
    // a door in a pale surround at the foot of every face, a fanlight over it, and a dark course round the plinth
    face(-1.3, 1.2, 1.3, 4.0, 4.52, pale); face(-1.0, 1.2, 1.0, 3.3, 4.55, TONE.wood); face(-1.0, 3.42, 1.0, 3.85, 4.55, glass);
    face(-0.04, 1.2, 0.04, 3.3, 4.57, TONE.dark);
    face(-4.5, 1.25, -1.3, 1.75, 4.52, TONE.rock); face(1.3, 1.25, 4.5, 1.75, 4.52, TONE.rock);
    // a narrow light either side of each tall window, and under the clock stage a round louvred opening in a
    // pale surround, where the bell is heard from
    for (const cy of [6.2, 13.2, 20.2]) for (const sx of [-2.2, 2.2]) {
      face(sx - 0.44, cy + 0.4, sx + 0.44, cy + 3.1, 3.53, pale); face(sx - 0.24, cy + 0.62, sx + 0.24, cy + 2.9, 3.58, glass);
      face(sx - 0.56, cy + 0.18, sx + 0.56, cy + 0.4, 3.66, pale);
    }
    const round = (r0, r1, zz, col) => { for (let j = 0; j < 12; j++) { const a0 = j / 12 * Math.PI * 2, a1 = (j + 1) / 12 * Math.PI * 2;
      g.quad(R(r0 * Math.cos(a0), 27.3 + r0 * Math.sin(a0), zz), R(r1 * Math.cos(a0), 27.3 + r1 * Math.sin(a0), zz), R(r1 * Math.cos(a1), 27.3 + r1 * Math.sin(a1), zz), R(r0 * Math.cos(a1), 27.3 + r0 * Math.sin(a1), zz), col, 0); } };
    round(0, 1.05, 3.56, glass); round(1.05, 1.42, 3.6, pale);
    for (const ly of [-0.5, 0, 0.5]) face(-0.9, 27.3 + ly - 0.07, 0.9, 27.3 + ly + 0.07, 3.62, pale);
    // the dial: a pale face in a thin dark rim, twelve marks and two hands
    const zc = 4.06, ring = (r0, r1, zz, col) => { for (let j = 0; j < 24; j++) { const a0 = j / 24 * Math.PI * 2, a1 = (j + 1) / 24 * Math.PI * 2; g.quad(R(r0 * Math.cos(a0), 33 + r0 * Math.sin(a0), zz), R(r1 * Math.cos(a0), 33 + r1 * Math.sin(a0), zz), R(r1 * Math.cos(a1), 33 + r1 * Math.sin(a1), zz), R(r0 * Math.cos(a1), 33 + r0 * Math.sin(a1), zz), col, 0); } };
    ring(0, 2.55, zc, pale); ring(2.55, 2.8, zc + 0.03, TONE.dark); ring(2.8, 2.95, zc + 0.03, TONE.enamel);
    for (let j = 0; j < 12; j++) { const a0 = j / 12 * Math.PI * 2, cx = Math.cos(a0), sy = Math.sin(a0), w = j % 3 ? 0.05 : 0.1; g.quad(R(1.95 * cx - w * sy, 33 + 1.95 * sy + w * cx, zc + 0.05), R(1.95 * cx + w * sy, 33 + 1.95 * sy - w * cx, zc + 0.05), R(2.4 * cx + w * sy, 33 + 2.4 * sy - w * cx, zc + 0.05), R(2.4 * cx - w * sy, 33 + 2.4 * sy + w * cx, zc + 0.05), TONE.dark, 0); }
    face(-0.09, 33, 0.09, 35.0, zc + 0.08, TONE.dark);
    g.quad(R(0, 32.9, zc + 0.08), R(0, 33.1, zc + 0.08), R(1.45, 33.85, zc + 0.08), R(1.45, 33.65, zc + 0.08), TONE.dark, 0);
  }
  // the clock stage, its cornice and four pinnacles, and a copper spire
  g.box(0, 30, 0, 8, 6, 8, pale, 0); g.box(0, 29.5, 0, 8.6, 0.5, 8.6, stone, 0, { bottom: true }); g.box(0, 36, 0, 8.7, 0.45, 8.7, stone, 0, { bottom: true });
  for (const [qx, qz] of [[-3.8, -3.8], [3.8, -3.8], [3.8, 3.8], [-3.8, 3.8]]) g.stem(qx, 36.45, qz, 0.5, 0, 1.9, 4, copper, 0);
  g.stem(0, 36.45, 0, 4.6, 0, 3.4, 8, copper, 2); g.stem(0, 39.6, 0, 0.3, 0.3, 0.4, 5, TONE.enamel, 0, true);
}
// the light at the land's end: a round tower in bands of white and red on a stone foot, a railed gallery, a
// glazed lantern under a red cap. It stands on the level top, upright as the sea's down has it.
export const LIGHT = { tall: 26.6 };
function lighthouseModel(g) {
  const red = new THREE.Color('#A8322A'), white = TONE.white, n = 12;
  g.stem(0, 0, 0, 4.4, 3.8, 2.6, n, TONE.stone, 9);
  for (let k = 0; k < 5; k++) { const r0 = 3.5 - 0.24 * k, r1 = 3.5 - 0.24 * (k + 1); g.stem(0, 2.6 + k * 3.4, 0, r0, r1, 3.4, n, k % 2 ? red : white, 0); }
  g.stem(0, 19.6, 0, 3.4, 3.4, 0.4, n, TONE.iron, 0, true);
  for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2; g.box(3.3 * Math.cos(a), 20, 3.3 * Math.sin(a), 0.1, 1.1, 0.1, TONE.iron, 0, { top: false }); }
  g.stem(0, 21.05, 0, 3.35, 3.35, 0.1, n, TONE.iron, 0);
  g.stem(0, 20, 0, 1.8, 1.8, 3.0, n, new THREE.Color(0.86, 0.9, 0.82), 0);
  for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; g.box(1.82 * Math.cos(a), 20, 1.82 * Math.sin(a), 0.14, 3.0, 0.14, TONE.iron, 0, { top: false }); }
  g.stem(0, 23, 0, 2.3, 0, 2.6, n, red, 0); g.stem(0, 25.5, 0, 0.35, 0.35, 0.6, 5, TONE.enamel, 0, true);
  g.box(0, 26.1, 0, 0.1, 0.5, 0.1, TONE.iron, 0);
}
function chimneyModel(g) {
  const C = CHIMNEY, brick = TONE.brick.clone().lerp(TONE.rock, 0.22), soot = TONE.dark.clone().lerp(brick, 0.3), H = C.tall, sh = H - C.house - 3.2;
  const rAt = (y) => lerp(C.foot, C.top, (y - C.house) / sh);
  g.box(0, 0, 0, 8, C.house, 8, brick.clone().multiplyScalar(0.86), 1);
  g.box(0, C.house - 0.5, 0, 8.5, 0.5, 8.5, TONE.stone, 0, { bottom: true });
  // a stone plinth ring, the shaft, and iron hoops round it
  g.stem(0, C.house, 0, C.foot + 0.5, C.foot + 0.3, 1.2, C.n, TONE.stone, 9);
  g.stem(0, C.house, 0, C.foot, C.top, sh, C.n, brick, 11);
  for (let k = 1; k <= 4; k++) { const y = C.house + k * sh / 5, r = rAt(y) + 0.09; g.stem(0, y - 0.2, 0, r, r - 0.005, 0.4, C.n, TONE.iron, 0); }
  // the crown: three courses each standing out beyond the last, a pale stone band under them, and a sooted lip
  let y = C.house + sh;
  g.stem(0, y - 0.9, 0, C.top + 0.14, C.top + 0.12, 0.6, C.n, TONE.stone, 0);
  for (let k = 0; k < 3; k++) { const r = C.top + 0.3 + 0.3 * k; g.stem(0, y, 0, r - 0.3, r, 0.35, C.n, soot, 0); g.stem(0, y + 0.35, 0, r, r, 0.55, C.n, k % 2 ? soot : brick.clone().multiplyScalar(0.62), 11); y += 0.9; }
  g.stem(0, y, 0, C.top + 0.9, C.top + 0.5, 0.5, C.n, soot, 0);
  // the lip's flat ring and the dark of the mouth inside it
  const R0 = C.top - 0.25, R1 = C.top + 0.5, black = TONE.dark.clone().multiplyScalar(0.45);
  for (let j = 0; j < C.n; j++) {
    const a0 = j / C.n * Math.PI * 2, a1 = (j + 1) / C.n * Math.PI * 2;
    g.quad([R0 * Math.cos(a0), H, R0 * Math.sin(a0)], [R1 * Math.cos(a0), H, R1 * Math.sin(a0)], [R1 * Math.cos(a1), H, R1 * Math.sin(a1)], [R0 * Math.cos(a1), H, R0 * Math.sin(a1)], soot, 0);
  }
  g.stem(0, H - 0.1, 0, R0, 0.01, -3, C.n, black, 0);
}
// the viaduct: five tall piers and four great arches along local x, its deck at the top, built to lie along its own
// line up the wall. It stands far enough out from the wall that the flown line goes through one arch.
export const VIADUCT = { arches: 4, pier: 4, half: 2.6, spring: 15, rise: 12.5 };
function viaductModel(g, len, tall) {
  const stone = TONE.stone.clone().lerp(TONE.brick, 0.12), dim = stone.clone().multiplyScalar(0.74), vault = TONE.brick.clone().lerp(TONE.stone, 0.3), n = VIADUCT.arches, span = len / n, half = VIADUCT.half;
  const y0 = tall - VIADUCT.spring, hp = VIADUCT.pier / 2, SEG = 20;
  for (let i = 0; i <= n; i++) {
    g.box(i * span, 0, 0, VIADUCT.pier, y0, half * 2, stone, 9, { top: false });
    g.box(i * span, 0, 0, VIADUCT.pier + 1.2, 2.5, half * 2 + 1.2, dim, 0);                       // the pier's foot on the cobbles
    g.box(i * span, y0 - 0.8, 0, VIADUCT.pier + 0.8, 0.8, half * 2 + 0.6, TONE.white, 0, { bottom: true });   // impost
    for (let yb = 9; yb < y0 - 4; yb += 9) g.box(i * span, yb, 0, VIADUCT.pier + 0.5, 0.5, half * 2 + 0.4, TONE.white, 0, { bottom: true });   // string courses up the shaft
  }
  for (let i = 0; i < n; i++) {
    const xa = i * span + hp, w = span - VIADUCT.pier;
    const top = (t) => y0 + VIADUCT.rise * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG, x0 = xa + t0 * w, x1 = xa + t1 * w, a0 = top(t0), a1 = top(t1);
      g.quad([x0, a0, -half], [x0, tall - 1, -half], [x1, tall - 1, -half], [x1, a1, -half], stone, 9);
      g.quad([x1, a1, half], [x1, tall - 1, half], [x0, tall - 1, half], [x0, a0, half], stone, 9);
      g.quad([x0, a0, half], [x0, a0, -half], [x1, a1, -half], [x1, a1, half], vault, 10);        // the soffit: a vault of brick
    }
    // a ring of pale voussoirs round the arch on both faces, standing a hand proud of the stone
    const xc = xa + w / 2, ra = w / 2, rb = VIADUCT.rise, RW = 1.1;
    for (let j = 0; j < SEG; j++) {
      const t0 = Math.PI * j / SEG, t1 = Math.PI * (j + 1) / SEG, col = j % 2 ? TONE.white : TONE.post;
      const I = (t) => [xc - ra * Math.cos(t), y0 + rb * Math.sin(t)], O = (t) => [xc - (ra + RW) * Math.cos(t), y0 + (rb + RW) * Math.sin(t)];
      const i0 = I(t0), i1 = I(t1), o0 = O(t0), o1 = O(t1);
      // each stone is cut with a joint between it and the next, and every stone a shade of its own; round the ring a
      // hood mould stands prouder yet, with its own shade lying on the wall beyond it
      const tj = t0 + (t1 - t0) * 0.09, ij = I(tj), oj = O(tj), own = col.clone().multiplyScalar(0.9 + 0.14 * (((i * 7 + j * 13) % 5) / 4));
      const H = (t, out) => [xc - (ra + RW + out) * Math.cos(t), y0 + (rb + RW + out) * Math.sin(t)];
      const h0 = H(t0, 0.38), h1 = H(t1, 0.38), s0 = H(t0, 0.85), s1 = H(t1, 0.85);
      for (const side of [-1, 1]) {
        const band = (a, b, c, d, out, tone) => { const fz = side * (half + out);
          if (side < 0) g.quad([a[0], a[1], fz], [b[0], b[1], fz], [c[0], c[1], fz], [d[0], d[1], fz], tone, 0);
          else g.quad([d[0], d[1], fz], [c[0], c[1], fz], [b[0], b[1], fz], [a[0], a[1], fz], tone, 0); };
        band(ij, oj, o1, i1, 0.12, own); band(i0, o0, oj, ij, 0.1, dim);
        band(o0, h0, h1, o1, 0.2, TONE.white); band(h0, s0, s1, h1, 0.02, dim);
      }
    }
    // the haunch over each pier, between two arches
    g.box(i * span, y0, 0, VIADUCT.pier, tall - 1 - y0, half * 2, stone, 9, { top: false });
  }
  g.box(n * span, y0, 0, VIADUCT.pier, tall - 1 - y0, half * 2, stone, 9, { top: false });
  // the mason's work on both faces: a buttress up each pier in three set-offs, a pilaster on from it to the
  // parapet, a round blind window in the spandrel over every pier, a keystone on every arch, and a corbel table
  // under the deck
  const pale = stone.clone().lerp(TONE.white, 0.35), deep = TONE.dark.clone().lerp(stone, 0.25), brickDim = vault.clone().multiplyScalar(0.8);
  for (let i = 0; i <= n; i++) {
    const x = i * span;
    for (const side of [-1, 1]) {
      const zf = side * half;
      for (let k = 0; k < 3; k++) { const out = 1.5 - 0.5 * k, h0 = y0 * k / 3; g.box(x, h0, zf + side * out / 2, VIADUCT.pier - 1.2 + 0.4 * (2 - k), y0 / 3, out, k % 2 ? stone : dim, 9, { topCol: pale }); }
      g.box(x, y0, zf + side * 0.2, 1.6, tall - 1 - y0, 0.4, pale, 9, { top: false });
      // the blind window: a dark round in a pale ring
      const yc = y0 + VIADUCT.rise * 0.72, zr = zf + side * 0.42;
      for (let j = 0; j < 12; j++) {
        const a0 = j / 12 * Math.PI * 2, a1 = (j + 1) / 12 * Math.PI * 2;
        const pt = (rad, a, zz) => [x + rad * Math.cos(a), yc + rad * Math.sin(a), zz];
        const tri = (A, B, C, col) => (side > 0 ? g.tri(A, B, C, col, 0) : g.tri(A, C, B, col, 0));
        tri(pt(0, 0, zr + side * 0.02), pt(1.25, a0, zr + side * 0.02), pt(1.25, a1, zr + side * 0.02), deep);
        tri(pt(1.25, a0, zr + side * 0.1), pt(1.75, a0, zr + side * 0.1), pt(1.75, a1, zr + side * 0.1), TONE.white);
        tri(pt(1.25, a0, zr + side * 0.1), pt(1.75, a1, zr + side * 0.1), pt(1.25, a1, zr + side * 0.1), TONE.white);
      }
    }
  }
  for (let i = 0; i < n; i++) {
    const xc = i * span + span / 2;
    for (const side of [-1, 1]) g.box(xc, y0 + VIADUCT.rise - 0.5, side * (half + 0.3), 1.5, 2.6, 0.6, TONE.white, 0, { bottom: true });
    // the brick of the vault shows as a dark arris at each edge of the soffit
    for (const side of [-1, 1]) for (let j = 0; j < SEG; j++) {
      const w = span - VIADUCT.pier, xa = i * span + hp, t0 = j / SEG, t1 = (j + 1) / SEG;
      const top = (t) => y0 + VIADUCT.rise * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
      g.quad([xa + t0 * w, top(t0) - 0.02, side * half], [xa + t1 * w, top(t1) - 0.02, side * half], [xa + t1 * w, top(t1) - 0.02, side * (half - 0.5)], [xa + t0 * w, top(t0) - 0.02, side * (half - 0.5)], brickDim, 0);
    }
  }
  for (let x = -1; x <= len + 1; x += 2.6) for (const side of [-1, 1]) g.box(x, tall - 1.9, side * (half + 0.35), 0.7, 0.9, 0.7, pale, 0, { bottom: true });
  g.box(len / 2, tall - 1, 0, len + 4, 1, half * 2 + 1.6, TONE.white, 0, { bottom: true });
  // the parapet: a wall of stone with a pale coping, and a refuge standing out over every pier
  for (const pz of [-half - 0.45, half + 0.45]) { g.box(len / 2, tall, pz, len + 4, 1.25, 0.45, stone, 9, { top: false }); g.box(len / 2, tall + 1.25, pz, len + 4.4, 0.3, 0.75, TONE.white, 0, { bottom: true }); }
  for (let i = 0; i <= n; i++) for (const side of [-1, 1]) g.box(i * span, tall - 1, side * (half + 1.0), 3.2, 2.7, 0.9, pale, 9, { topCol: TONE.white, bottom: true });
  for (const rz of [-0.75, 0.75]) g.box(len / 2, tall, rz, len + 2, 0.18, 0.14, TONE.iron, 0);
}
// the lake's jetties, by their bearing round the shore (0 is the top of the lake on the wall, a quarter turn its
// far end along the wall): most stand about the two ends of the lake's level diameter, to either side of the
// water its sailing boats keep to
const QT = Math.PI / 2;
export const LAKE_JETTIES = [-QT - 1.0, -QT - 0.75, -QT - 0.5, -QT + 0.5, -QT + 0.75, -QT + 1.0, QT - 1.0, QT - 0.75, QT - 0.5, QT + 0.5, QT + 0.75, QT + 1.0, 0.2, Math.PI - 0.2];
export const JETTY = { len: 15, width: 2.4 };
export function viaductLine(P) {
  const v = P.viaduct, ds = v.s1 - v.s0, dz = v.z1 - v.z0, len = Math.hypot(ds, dz);
  return { len, yaw: -Math.atan2(dz, ds), ds: ds / len, dz: dz / len };
}

MAKERS.push(async (D) => {
  const { P, ctx } = D, g = new Geo(), m = new THREE.Matrix4();
  // the twins: steeple upright on the floor and lying out from the wall; windmill upright and three lying
  for (const at of [P.steepleUp, P.steepleLying]) { g.m = standAt(at.s, at.z, 0, 0, 1, m); steepleModel(g); bellsModel(g); }
  await ctx.yield();
  // each steeple's churchyard: one yard, its graves dealt once, stood at both
  const graves = dealGraves(ctx.core.makeRng(ctx.core.hashSeed('churchyard:' + ctx.seed)));
  for (const at of [P.steepleUp, P.steepleLying]) { g.m = standAt(at.s, at.z, 0, 0, 1, m); yardModel(g, graves); }
  await ctx.yield();
  for (const at of [P.millUp, ...P.mills]) { g.m = standAt(at.s, at.z, 0, 0, 1, m); millModel(g); }
  for (const at of [P.clock, P.clockLying]) { g.m = standAt(at.s, at.z, 0, 0, 1, m); clockModel(g); }
  await ctx.yield();
  for (const at of P.chimneys) { g.m = standAt(at.s, at.z, 0, 0, 1, m); chimneyModel(g); }
  const vl = viaductLine(P);
  g.m = standAt(P.viaduct.s0, P.viaduct.z0, 0, vl.yaw, 1, m); viaductModel(g, vl.len, P.viaduct.h);
  await ctx.yield();
  // the wall square: pale paving inside a kerb; the carousel's round floor; the fountain's basin
  g.m = null;
  const q = P.square;
  ribbon(g, q.z0, q.z1, q.s0, q.s1, 0.08, TONE.paving, 3, 2, 2);
  // the two balloon fields: a flagged yard in the gap of a terrace
  for (const bf of [P.balloon, P.balloonWall, P.balloonTop]) ribbon(g, bf.z - bf.half, bf.z + bf.half, bf.s - ROW_STEP / 2 + 2, bf.s + ROW_STEP / 2 - 2, 0.06, TONE.paving.clone().lerp(TONE.cobble, 0.3), 3, 2, 2);
  g.m = standAt(P.carousel.s, P.carousel.z, 0, 0, 1, m); g.stem(0, 0, 0, 10.4, 10.4, 0.5, 20, TONE.stone, 0, true);
  g.m = standAt(P.fountain.s, P.fountain.z, 0, 0, 1, m);
  // the fountain: a round stone basin of standing water, a stem with a bowl, and the six jets' steady arcs
  // (their drops are the movers); every arc rises along the wall's own up and falls back into the basin
  g.stem(0, 0, 0, JET.basin, JET.basin, 1.1, 20, TONE.stone, 0); g.stem(0, 0, 0, JET.basin - 0.7, JET.basin - 0.7, 1.1, 20, TONE.stone.clone().multiplyScalar(0.8), 0);
  g.stem(0, 0.75, 0, JET.basin - 0.7, 0.01, 0.01, 20, new THREE.Color('#3E8F8A'), 0);
  for (let j = 0; j < 20; j++) {
    const a0 = j / 20 * Math.PI * 2, a1 = (j + 1) / 20 * Math.PI * 2, r0 = JET.land - 0.9, r1 = JET.land + 0.9;
    g.quad([r0 * Math.cos(a0), 0.8, r0 * Math.sin(a0)], [r0 * Math.cos(a1), 0.8, r0 * Math.sin(a1)], [r1 * Math.cos(a1), 0.8, r1 * Math.sin(a1)], [r1 * Math.cos(a0), 0.8, r1 * Math.sin(a0)], TONE.white, 0);
  }
  g.stem(0, 0, 0, 0.9, 0.6, 1.6, 8, TONE.stone, 0); g.stem(0, 1.6, 0, 0.6, 2.0, 0.6, 10, TONE.stone, 0, true);
  const water = new THREE.Color(0.74, 0.86, 0.93);
  for (let k = 0; k < JET.n; k++) {
    const an = k / JET.n * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
    for (let i = 0; i < 18; i++) {
      const t0 = i / 18, t1 = (i + 1) / 18, w0 = 0.16 + 0.3 * t0, w1 = 0.16 + 0.3 * t1;
      const r0 = jetOut(t0), r1 = jetOut(t1), h0 = jetRise(t0), h1 = jetRise(t1);
      g.quad([r0 * c - w0 * sn, h0, r0 * sn + w0 * c], [r0 * c + w0 * sn, h0, r0 * sn - w0 * c], [r1 * c + w1 * sn, h1, r1 * sn - w1 * c], [r1 * c - w1 * sn, h1, r1 * sn + w1 * c], water, 0);
      g.quad([(r0 - w0) * c, h0, (r0 - w0) * sn], [(r0 + w0) * c, h0, (r0 + w0) * sn], [(r1 + w1) * c, h1, (r1 + w1) * sn], [(r1 - w1) * c, h1, (r1 - w1) * sn], water, 0);
    }
  }
  // the hung lake's stone rim and the lip at the rim where the canal's water leaves the land
  g.m = standAt(P.lake.s, P.lake.z, 0, 0, 1, m);
  // a lakeside: a paved quay all round on a dark stone wall that stands in the water, bollards along its edge,
  // and wooden jetties reaching in over the shoals
  const quayFace = TONE.dark.clone().lerp(TONE.stone, 0.3);
  for (let i = 0; i < 48; i++) {
    const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2, r0 = P.lake.r, r1 = P.lake.r + 5;
    const A = [r0 * Math.cos(a0), 1.5, r0 * Math.sin(a0)], B = [r0 * Math.cos(a1), 1.5, r0 * Math.sin(a1)];
    const C = [r1 * Math.cos(a1), 1.5, r1 * Math.sin(a1)], E = [r1 * Math.cos(a0), 1.5, r1 * Math.sin(a0)];
    g.quad(A, B, C, E, i % 2 ? TONE.stone : TONE.paving, 0);
    g.quad(E, C, [C[0], 0, C[2]], [E[0], 0, E[2]], TONE.stone, 0);
    g.quad(B, A, [A[0], 0.3, A[2]], [B[0], 0.3, B[2]], quayFace, 0);
    const am = (a0 + a1) / 2; g.box((r0 + 0.7) * Math.cos(am), 1.5, (r0 + 0.7) * Math.sin(am), 0.5, 0.8, 0.5, TONE.iron, 0);
  }
  await ctx.yield();
  for (const th of LAKE_JETTIES) {
    const c = Math.cos(th), s = Math.sin(th), R = P.lake.r, len = JETTY.len, hw = JETTY.width / 2;
    const at = (rad, off, y) => [rad * c - off * s, y, rad * s + off * c];
    g.quad(at(R, -hw, 1.45), at(R, hw, 1.45), at(R - len, hw, 1.45), at(R - len, -hw, 1.45), TONE.wood, 0);
    for (const off of [-hw, hw]) g.quad(at(R, off, 1.45), at(R - len, off, 1.45), at(R - len, off, 1.0), at(R, off, 1.0), TONE.wood.clone().multiplyScalar(0.7), 0);
    for (let k = 1; k <= 4; k++) for (const off of [-hw, hw]) { const q = at(R - len * k / 4, off, 0.2); g.box(q[0], q[1], q[2], 0.4, 2.1, 0.4, TONE.dark, 0); }
  }
  g.m = standAt(S_RIM - 1, LAND.canalZ, 0, 0, 1, m);
  g.box(-2, 0, -6.4, 6, 3.4, 2.6, TONE.stone, 0); g.box(-2, 0, 6.4, 6, 3.4, 2.6, TONE.stone, 0);
  g.box(0.6, -1.4, 0, 1.2, 1.5, 10.4, TONE.stone.clone().multiplyScalar(0.8), 0);
  // the rim's own dress, upright on the level top as the sea's down has it: a coping of great blocks along both
  // edges, broken where the canal leaps, and at the canal's head two stone pylons with slate caps and an apron of
  // dressed stone between them
  g.m = null;
  const X0 = LAND.wallX, Y = LAND.rimY, cz = LAND.canalZ, cope = TONE.stone.clone().lerp(TONE.white, 0.25), dimStone = TONE.stone.clone().multiplyScalar(0.8);
  for (const [za, zb] of [[LAND.z0, cz - 6.5], [cz + 6.5, LAND.z1]]) {
    g.box(X0 + 1.1, Y, (za + zb) / 2, 2.2, 0.9, zb - za, cope, 9);
    g.box(X0 + LAND.thick - 1.1, Y, (za + zb) / 2, 2.2, 0.9, zb - za, cope, 9);
  }
  await ctx.yield();
  for (const side of [-1, 1]) {
    const pz = cz + side * 9.5, px = X0 + 3.6;
    g.box(px, Y, pz, 6.4, 1.2, 6.4, dimStone, 9);
    g.box(px, Y + 1.2, pz, 5, 6.8, 5, TONE.stone, 9, { top: false });
    for (const dz of [-1, 1]) g.box(px - 2.55, Y + 3.2, pz + dz * 1.2, 0.2, 2.8, 1.0, TONE.dark, 0, { top: false });   // two slit windows toward the harbour
    g.box(px, Y + 8, pz, 6, 0.7, 6, TONE.white, 0, { bottom: true });
    g.stem(px, Y + 8.7, pz, 3.9, 0, 2.6, 4, TONE.slate, 2);
  }
  g.box(X0 + 6, Y, cz, 12, 0.45, 12.4, dimStone, 9);
  await ctx.yield();
  // the promenade along the top's seaward edge, from above the railway's yard to the land's end: an iron
  // railing on the coping, lamp standards and benches, all upright, a house's length above roofs that lie level
  const walk0 = P.viaduct.z1 + 40, tr = new THREE.Matrix4(), lightZ = LAND.z1 - 12;
  for (const [za, zb] of [[walk0, cz - 6.5], [cz + 6.5, LAND.z1 - 1]]) {
    g.box(X0 + 0.3, Y + 1.9, (za + zb) / 2, 0.12, 0.12, zb - za, TONE.iron, 0);
    for (let z = za; z <= zb; z += 2.5) g.box(X0 + 0.3, Y + 0.9, z, 0.1, 1.0, 0.1, TONE.iron, 0, { top: false });
  }
  for (let z = walk0 + 5, k = 0; z < LAND.z1 - 4; z += 12.5, k++) {
    if (Math.abs(z - cz) < 13 || Math.abs(z - lightZ) < 6) continue;
    g.m = tr.makeTranslation(X0 + 1.4, Y + 0.9, z); lampModel(g);
    if (k % 2) { g.m = tr.makeTranslation(X0 + 3.6, Y, z + 6.25); benchModel(g); }
  }
  // the light stands on the seaward corner of the land's end
  g.m = tr.makeTranslation(X0 + 6.6, Y, lightZ); lighthouseModel(g); g.m = null;
  const mesh = new THREE.Mesh(g.build(), D.town); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  D.group.add(mesh);
});

// ---------- movers on lines: each one's place is a closed formula of the world's clock ----------
// THE TRAMLINE'S TWO ENDS. The rails run from rail0 by the quay to the rim's edge, and no car ever runs to a rail's
// end: a pair of coupled cars halts at a terminus where its outer car's middle is yet `end` metres short of it,
// stands, and runs back the way it came (a tram is driven from either end). Between the terminus and the open line,
// `clearOf` metres from the rail's end and `cross` metres long, a scissors crossing is laid in the paving. The pairs
// take the two stub tracks by turns: one runs straight in and leaves over the crossing, the next comes in over the
// crossing and leaves straight, so every pair changes rails once at each end. `ease` is the seconds it takes to
// gather way or to brake; `haltTop` the seconds a pair stands under the rim.
export const TRAM = { speed: 6.3, n: 11, carLen: 14, couple: 14.6, railOut: 2, lift: 0.25, rail0: 2, end: 30, ease: 4, clearOf: 56, cross: 18, haltTop: 18 };
TRAM.lo = TRAM.rail0 + TRAM.end + TRAM.couple / 2;          // plan s of a pair's middle at the quay terminus
TRAM.hi = S_RIM - TRAM.end - TRAM.couple / 2;               // and at the terminus under the rim
TRAM.run = (TRAM.hi - TRAM.lo) / TRAM.speed + TRAM.ease;    // seconds from one terminus to the other
// how long a pair stands at the quay: the shortest halt for which the pairs coming down pass the middle of the
// bend midway between the pairs going up, so that the bend is never without a tram
{
  const mid = LAND.sCrease + LAND.R * HALF_PI / 2, back = 2 * (TRAM.hi - mid) / TRAM.speed + TRAM.ease + TRAM.haltTop;
  let halt = Infinity;
  for (let k = 0; k < 4 * TRAM.n; k++) {
    const d = back * TRAM.n / (k + 0.5) - 2 * TRAM.run - TRAM.haltTop;
    if (d >= 0.75 * TRAM.haltTop && d < halt) halt = d;
  }
  TRAM.haltQuay = halt; TRAM.period = 2 * TRAM.run + TRAM.haltTop + halt;
}
// where the middle of pair i is at a clock's reading, which way it is bound, and by which stub track it uses each
// terminus (0 straight in and out over the crossing, 1 in over the crossing and straight out): up from the quay,
// a halt under the rim, down, a halt at the quay. The pairs follow one another evenly round the line's clock.
export function tramPairAt(time, i, out = {}) {
  const T = TRAM.period, q = time + i * T / TRAM.n, turn = Math.floor(q / T), t = q - turn * T;
  const R = TRAM.run, e = TRAM.ease, v = TRAM.speed, L = TRAM.hi - TRAM.lo;
  const up = t < R + TRAM.haltTop, r = up ? t : t - R - TRAM.haltTop;
  const x = r >= R ? L : r < e ? v * r * r / (2 * e) : r > R - e ? L - v * (R - r) * (R - r) / (2 * e) : v * (r - e / 2);
  const side = (n) => ((n + i) % 2 + 2) % 2;
  out.up = t < R; out.s = up ? TRAM.lo + x : TRAM.hi - x;
  out.top = side(turn); out.quay = side(t < R ? turn - 1 : turn);
  return out;
}
// across the avenue, where the track under a car lies at plan s, and how it slants there
export function tramTrackAt(s, pair, out = {}) {
  const c0 = TRAM.rail0 + TRAM.clearOf, c1 = S_RIM - TRAM.clearOf - TRAM.cross, R = TRAM.railOut;
  const low = s < (c0 + c1) / 2, t = clamp((s - (low ? c0 : c1)) / TRAM.cross, 0, 1);
  const k = t * t * (3 - 2 * t), dk = 6 * t * (1 - t) / TRAM.cross;
  const stub = low ? pair.quay : pair.top;
  // a pair bound away from a terminus it entered straight, or toward the other kind, crosses from the down rail's
  // side to the up rail's as s grows; the other crossing runs the other way; the rest keep to their own rail
  const rising = low ? (pair.up && stub === 0) : (!pair.up && stub === 0), falling = low ? (!pair.up && stub === 1) : (pair.up && stub === 1);
  if (rising) { out.z = -R + 2 * R * k; out.slope = 2 * R * dk; }
  else if (falling) { out.z = R - 2 * R * k; out.slope = -2 * R * dk; }
  else { out.z = pair.up ? R : -R; out.slope = 0; }
  return out;
}
function tramCarModel(g) {
  const en = TONE.enamel, L = TRAM.carLen - 0.8;
  g.box(0, 0.25, 0, L - 2.4, 0.7, 1.8, TONE.dark, 0, { top: false });              // trucks
  g.box(0, 0.8, 0, L, 2.6, 2.8, en, 5, { top: false, bottom: true });
  g.box(0, 3.4, 0, L + 0.3, 0.3, 3.0, en, 0, { bottom: true });     // an enamelled roof, which is the side the wall's houses look down on
  g.box(0, 3.7, 0, L - 3, 0.3, 1.5, en.clone().lerp(TONE.white, 0.4), 0);
  g.box(L * 0.3, 4.0, 0, 0.12, 1.5, 0.12, TONE.iron, 0);                            // trolley pole
}
function engineModel(g) {
  const body = new THREE.Color('#2E7A55');
  g.box(0, 0.2, 0, 9, 0.9, 1.9, TONE.dark, 0, { top: false });
  g.box(4.6, 0.5, 0, 0.3, 0.5, 2.3, TONE.brick, 0);                       // the buffer beam
  g.box(1.2, 1.1, 0, 6.2, 2.0, 2.0, body, 0);
  for (const bx of [-0.6, 1.4, 3.4]) g.box(bx, 1.05, 0, 0.22, 2.1, 2.08, TONE.enamel, 0);   // brass boiler bands
  g.box(-3, 1.1, 0, 2.6, 3.0, 2.5, body, 0, { topCol: TONE.dark });
  g.stem(3.2, 3.1, 0, 0.42, 0.55, 1.5, 7, TONE.dark, 0, true);
  g.stem(1.2, 3.1, 0, 0.5, 0.3, 0.6, 6, TONE.enamel, 0, true);
}
function coachModel(g) {
  g.box(0, 0.2, 0, 8.4, 0.7, 1.8, TONE.dark, 0, { top: false });
  g.box(0, 0.8, 0, 9.6, 2.6, 2.5, TONE.plaster.clone().multiplyScalar(0.95), 5, { top: false, bottom: true });
  g.box(0, 0.8, 0, 9.64, 0.75, 2.54, TONE.brick, 0, { top: false });         // a red waist under the cream
  g.box(0, 3.4, 0, 9.8, 0.3, 2.7, TONE.white, 0, { bottom: true });
}
// a balloon's basket and envelope, hanging from the origin upward along local y: the basket's floor at y 0
function balloonBody(g, gore = TONE.enamel) {
  const red = new THREE.Color('#A8322A'), wicker = TONE.wood.clone().lerp(TONE.enamel, 0.25);
  g.box(0, 0, 0, 2.4, 1.7, 2.4, wicker, 0, { bottom: true });
  g.box(0, 1.7, 0, 2.7, 0.3, 2.7, TONE.wood, 0, { bottom: true });
  const cy = 12.6, R = 8, rings = 10, sides = 16, lo = -1.25;
  const ringAt = (i) => { const p = lo + (i / rings) * (Math.PI / 2 - lo); return [R * Math.cos(p), cy + R * Math.sin(p) * 1.08]; };
  for (let i = 0; i < rings; i++) {
    const [r0, y0] = ringAt(i), [r1, y1] = ringAt(i + 1);
    for (let j = 0; j < sides; j++) {
      const a0 = j / sides * Math.PI * 2, a1 = (j + 1) / sides * Math.PI * 2;
      // gores of yellow and cream, a red belt below the shoulder and a red crown
      const col = i === rings - 1 || i === 4 ? red : j % 2 ? gore : TONE.plaster;
      const A = [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)], B = [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)];
      const C = [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)], E = [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)];
      if (i === rings - 1) g.tri(A, [0, y1, 0], B, col, 0); else g.quad(A, E, C, B, col, 0);
      // the mouth's skirt and the lines down to the basket's rim
      if (i === 0) {
        g.quad(A, B, [B[0] * 0.8, y0 - 1.3, B[2] * 0.8], [A[0] * 0.8, y0 - 1.3, A[2] * 0.8], red, 0);
        if (j % 4 === 0) { const c = Math.cos(a0), sn = Math.sin(a0), w = 0.07; g.quad([A[0] * 0.8 - w * sn, y0 - 1.3, A[2] * 0.8 + w * c], [A[0] * 0.8 + w * sn, y0 - 1.3, A[2] * 0.8 - w * c], [1.3 * c + w * sn, 2, 1.3 * sn - w * c], [1.3 * c - w * sn, 2, 1.3 * sn + w * c], TONE.dark, 0); }
      }
    }
  }
}
// a hawser in bands of two tones about a line of points, four-sided, thick enough to be read from far off
function hawserInto(g, pts, half) {
  const t = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), zAx = new THREE.Vector3(0, 0, 1);
  const ring = (i) => {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)], p = pts[i];
    t.subVectors(b, a).normalize(); n1.crossVectors(t, zAx).normalize(); n2.crossVectors(t, n1);
    return [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([u, v]) => [p.x + (n1.x * u + n2.x * v) * half, p.y + (n1.y * u + n2.y * v) * half, p.z + (n1.z * u + n2.z * v) * half]);
  };
  let prev = ring(0);
  for (let i = 1; i < pts.length; i++) {
    const cur = ring(i), col = (i >> 2) % 2 ? TONE.white : TONE.enamel.clone().lerp(TONE.wood, 0.35);
    for (let j = 0; j < 4; j++) g.quad(prev[j], prev[(j + 1) % 4], cur[(j + 1) % 4], cur[j], col, 0);
    prev = cur;
  }
}
// the town's festival colour, by deal: it is the balloons' gores and the first of the awnings
export const GALA = ['#E2B13C', '#3E8F8A', '#D9703A'];
function balloonModel(g, rope, gore) {
  // the rope is the plumb line of the sea's down: straight from the ground ring to the basket
  const pts = []; for (let y = 0; y <= rope + 1e-6; y += 2) pts.push(new THREE.Vector3(0, y, 0));
  hawserInto(g, pts, 0.24);
  g.stem(0, 0, 0, 1.6, 1.6, 0.5, 10, TONE.stone, 0, true);        // the ground ring's stone
  const keep = g.m; g.m = (keep ? keep.clone() : new THREE.Matrix4()).multiply(new THREE.Matrix4().makeTranslation(0, rope, 0));
  balloonBody(g, gore); g.m = keep;
}
// the wall's balloon, in axes at its ring on the wall (x out to seaward is -x of the world, y up, z along the wall):
// its hawser lies along the pull's own line, level out from the wall and turning skyward where the pull turns, and
// the balloon rides at its end upright, as the sea's down has it
function wallBalloonModel(g, anchor, gore) {
  const line = riseLine(anchor.x - 0.4, anchor.y, anchor.z, Math.round(BALLOON.reach / BALLOON.step), BALLOON.step, 0, undefined);
  const pts = line.map((p) => p.clone().sub(anchor));
  hawserInto(g, pts, 0.3);
  const end = pts[pts.length - 1], up = new THREE.Vector3().subVectors(end, pts[pts.length - 2]).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  g.m = new THREE.Matrix4().compose(end, q, new THREE.Vector3(1, 1, 1));
  balloonBody(g, gore); g.m = null;
  // the ring's stone on the wall
  g.m = new THREE.Matrix4().makeRotationZ(Math.PI / 2); g.stem(0, 0, 0, 1.6, 1.6, 0.5, 10, TONE.stone, 0, true); g.m = null;
  return { end: line[line.length - 1] };
}
// the carousel on the wall square: sizes in its own axes (y is its own up, out from the wall)
export const CAROUSEL = { horses: 12, canopy: 7.3, eave: 7.2, roof: 8.2, ringOut: 8.7, ringIn: 5.2, bob: 0.55, horse: 1.25 };
// a carousel horse, nose along local x, hung on its pole at the origin
function horseModel(g) {
  const white = TONE.white;
  g.box(0, 1.5, 0, 2.5, 1.05, 0.8, white, 0, { bottom: true });                      // barrel
  g.box(1.35, 2.2, 0, 0.6, 1.3, 0.55, white, 0);                                      // neck
  g.box(1.95, 3.0, 0, 1.1, 0.55, 0.5, white, 0, { bottom: true });                    // head
  g.box(-1.5, 1.7, 0, 0.5, 0.9, 0.25, TONE.dark, 0);                                  // tail
  for (const [lx, lz] of [[0.9, 0.28], [0.9, -0.28], [-0.9, 0.28], [-0.9, -0.28]]) g.box(lx + (lx > 0 ? 0.25 : -0.25), 0.35, lz, 0.28, 1.2, 0.22, white, 0, { bottom: true });
  g.box(0, 2.55, 0, 1.0, 0.22, 0.9, new THREE.Color('#A8322A'), 0);                   // saddle
  g.box(1.0, 2.45, 0, 0.3, 0.5, 0.86, TONE.enamel, 0);                                // breast band
}
// the train's place on its viaduct, metres from the foot to the engine: up at about 5 m/s, a halt, back down, a halt: 50 s
export function trainAt(time, len) {
  const ph = (((time / 50) % 1) + 1) % 1, e = ph < 0.42 ? smooth(0, 0.42, ph) : ph < 0.5 ? 1 : ph < 0.92 ? 1 - smooth(0.5, 0.92, ph) : 0;
  return lerp(40, len - 6, e);
}
export const STEAM = { n: 56, every: 0.3, rise: 4.2 };
export const BALLOON = { rope: 40, reach: 108, step: 1.5 };     // the floor balloon's straight rope; the wall balloon's rope, laid along the pull's own line in steps

MAKERS.push(async (D) => {
  const { P, ctx, group, town } = D;
  const add = (geo, count) => {
    const mesh = count ? new THREE.InstancedMesh(geo, town, count) : new THREE.Mesh(geo, town);
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; group.add(mesh); return mesh;
  };
  const m = new THREE.Matrix4(), r = new THREE.Matrix4(), tr = new THREE.Matrix4();
  // windmill sails: the upright mill and its three lying twins turn alike, about their own shafts
  let g = new Geo(); sailsModel(g); const sailGeo = g.build();
  const mills = [P.millUp, ...P.mills].map((at, i) => ({ mesh: add(sailGeo), base: standAt(at.s, at.z - MILL.sailsOff, MILL.hub, 0, 1, new THREE.Matrix4()), ph: i * 0.9 }));
  // the carousel, one turn in 12 s: a painted deck, a mirrored drum, and a red and cream canopy held high on its
  // poles over the inner ring of horses
  g = new Geo();
  const red = new THREE.Color('#A8322A'), cream = TONE.white, teal = TONE.sea.clone().lerp(TONE.dark, 0.25), gold = TONE.enamel;
  const N = CAROUSEL.horses;
  for (let j = 0; j < 24; j++) {
    const a0 = j / 24 * Math.PI * 2, a1 = (j + 1) / 24 * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const R = CAROUSEL.canopy, y0 = CAROUSEL.eave, col = j % 2 ? red : cream;
    // the canopy: a tent in two pitches with a scalloped valance hanging from its eave
    g.quad([R * c0, y0, R * s0], [2.6 * c0, y0 + 4.6, 2.6 * s0], [2.6 * c1, y0 + 4.6, 2.6 * s1], [R * c1, y0, R * s1], col, 0);
    g.tri([2.6 * c0, y0 + 4.6, 2.6 * s0], [0, y0 + CAROUSEL.roof, 0], [2.6 * c1, y0 + 4.6, 2.6 * s1], j % 2 ? cream : red, 0);
    const cm = Math.cos((a0 + a1) / 2), sm = Math.sin((a0 + a1) / 2);
    g.tri([R * c0, y0, R * s0], [R * c1, y0, R * s1], [R * cm, y0 - 1.1, R * sm], j % 2 ? teal : gold, 0);
    // the turning deck, boarded in two tones, with a bright kerb
    g.quad([9.9 * c0, 0.75, 9.9 * s0], [2.4 * c0, 0.75, 2.4 * s0], [2.4 * c1, 0.75, 2.4 * s1], [9.9 * c1, 0.75, 9.9 * s1], j % 2 ? TONE.wood : TONE.wood.clone().lerp(TONE.plaster, 0.35), 0);
    g.quad([9.9 * c0, 0.75, 9.9 * s0], [9.9 * c1, 0.75, 9.9 * s1], [9.9 * c1, 0.3, 9.9 * s1], [9.9 * c0, 0.3, 9.9 * s0], j % 2 ? red : gold, 0);
    // the drum: mirrors between gilt posts
    g.quad([2.4 * c0, 0.75, 2.4 * s0], [2.4 * c0, y0 + 0.4, 2.4 * s0], [2.4 * c1, y0 + 0.4, 2.4 * s1], [2.4 * c1, 0.75, 2.4 * s1], j % 2 ? TONE.sky : gold, 0);
  }
  for (let j = 0; j < N; j++) {
    // a brass pole for each horse, from the deck to the canopy's sweeps
    const am = (j + 0.5) / N * Math.PI * 2, rr = j % 2 ? CAROUSEL.ringOut : CAROUSEL.ringIn;
    g.box(rr * Math.cos(am), 0.75, rr * Math.sin(am), 0.2, CAROUSEL.eave - 0.4, 0.2, gold, 0, { top: false });
    // the outer horses ride in the open beyond the canopy, on sweeps that reach out from its eave
    if (j % 2) { g.m = new THREE.Matrix4().makeRotationY(-am); g.box(CAROUSEL.ringOut / 2 + 1.2, CAROUSEL.eave + 0.1, 0, CAROUSEL.ringOut - 2.2, 0.3, 0.3, red, 0); g.m = null; }
  }
  g.stem(0, CAROUSEL.eave + CAROUSEL.roof - 0.3, 0, 0.55, 0.55, 0.9, 6, gold, 0, true);
  const carousel = add(g.build());
  g = new Geo(); horseModel(g); const horses = add(g.build(), CAROUSEL.horses);
  await ctx.yield();
  // trams: eleven pairs of coupled cars, up one rail and down the other between the line's two termini
  g = new Geo(); tramCarModel(g);
  const trams = add(g.build(), TRAM.n * 2);
  // the steam train on the viaduct: an engine and three coaches
  g = new Geo(); engineModel(g); const engine = add(g.build());
  g = new Geo(); coachModel(g); const coaches = add(g.build(), 3);
  const vl = viaductLine(P), vBase = standAt(P.viaduct.s0, P.viaduct.z0, 0, vl.yaw, 1, new THREE.Matrix4());
  // the tethered balloon over the floor town
  const gore = new THREE.Color(GALA[(D.opts.gala || 0) % GALA.length]);
  g = new Geo(); balloonModel(g, BALLOON.rope, gore); const balloon = add(g.build());
  const bBase = standAt(P.balloon.s, P.balloon.z, 0, 0, 1, new THREE.Matrix4());
  // and its twin, tethered to the wall above the works
  const wbAt = fold(P.balloonWall.s, P.balloonWall.z, 0, new THREE.Vector3());
  g = new Geo(); wallBalloonModel(g, wbAt, gore); const wallBalloon = add(g.build());
  const wbBase = new THREE.Matrix4().makeTranslation(wbAt.x, wbAt.y, wbAt.z);
  // the top rows' balloon, in the next of the festival's colours
  const tbAt = fold(P.balloonTop.s, P.balloonTop.z, 0, new THREE.Vector3());
  g = new Geo(); wallBalloonModel(g, tbAt, new THREE.Color(GALA[((D.opts.gala || 0) + 1) % GALA.length])); const topBalloon = add(g.build());
  const tbBase = new THREE.Matrix4().makeTranslation(tbAt.x, tbAt.y, tbAt.z);
  await ctx.yield();
  const TAU = Math.PI * 2, hs = new THREE.Vector3(CAROUSEL.horse, CAROUSEL.horse, CAROUSEL.horse);
  const pair = {}, track = {};
  D.tick.push((time) => {
    for (const ml of mills) { ml.mesh.matrix.copy(ml.base).multiply(r.makeRotationZ(time * TAU / 9 + ml.ph)); }
    standAt(P.carousel.s, P.carousel.z, 0, time * TAU / 12, 1, carousel.matrix);
    // the horses ride round with the deck and rise and fall on their poles, each along the carousel's own up
    for (let j = 0; j < CAROUSEL.horses; j++) {
      const am = (j + 0.5) / CAROUSEL.horses * TAU, rr = j % 2 ? CAROUSEL.ringOut : CAROUSEL.ringIn;
      m.copy(carousel.matrix).multiply(tr.makeTranslation(rr * Math.cos(am), 0.75 + CAROUSEL.bob * (1 + Math.sin(time * TAU / 3 + j * 2.4)), rr * Math.sin(am))).multiply(r.makeRotationY(Math.PI / 2 - am)).scale(hs);
      horses.setMatrixAt(j, m);
    }
    horses.instanceMatrix.needsUpdate = true;
    // the two cars keep their places in the pair whichever way it is bound, each on the track under its own middle
    for (let i = 0; i < TRAM.n; i++) {
      tramPairAt(time, i, pair);
      for (let c = 0; c < 2; c++) {
        const cs = pair.s + (c ? -0.5 : 0.5) * TRAM.couple;
        tramTrackAt(cs, pair, track);
        standAt(cs, LAND.avenueZ + track.z, TRAM.lift, (c ? Math.PI : 0) - Math.atan(track.slope), 1, m);
        trams.setMatrixAt(i * 2 + c, m);
      }
    }
    trams.instanceMatrix.needsUpdate = true;
    // the train climbs at about 5 m/s, halts, runs back down, halts: 50 s in all
    const d = trainAt(time, vl.len);
    engine.matrix.copy(vBase).multiply(tr.makeTranslation(d, P.viaduct.h + 0.1, 0));
    for (let c = 0; c < 3; c++) { m.copy(vBase).multiply(tr.makeTranslation(d - 10.2 - c * 10.4, P.viaduct.h + 0.1, 0)); coaches.setMatrixAt(c, m); }
    coaches.instanceMatrix.needsUpdate = true;
    // the balloon leans a little on its rope, slowly, about its ground ring
    balloon.matrix.copy(bBase).multiply(r.makeRotationX(0.05 * Math.sin(time * TAU / 11))).multiply(tr.makeRotationZ(0.06 * Math.sin(time * TAU / 17 + 1)));
    // the wall's balloon swings a little about its ring too, the hawser with it
    wallBalloon.matrix.copy(wbBase).multiply(r.makeRotationY(0.018 * Math.sin(time * TAU / 13))).multiply(tr.makeRotationX(0.03 * Math.sin(time * TAU / 19 + 1)));
    topBalloon.matrix.copy(tbBase).multiply(r.makeRotationY(0.02 * Math.sin(time * TAU / 15 + 2))).multiply(tr.makeRotationX(0.03 * Math.sin(time * TAU / 21 + 4)));
  });
});

// ---------- water that stands on the land: the canal, the hung lake, and the leap from the rim ----------
// Geometry carries: aLocal = (distance along the flow, foam 0..1, across), aKind = flow speed in m/s.
function makeWaterMaterial(air) {
  return new THREE.ShaderMaterial({
    uniforms: { ...air, uDeep: { value: TONE.sea.clone().multiplyScalar(0.9) } },
    vertexShader: /* glsl */`attribute vec3 aLocal; attribute float aKind; varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vF;
      void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vL = aLocal; vF = aKind; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vF; uniform float uTime; uniform vec3 uDeep;
      ${AIR_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main() {
        vec3 n = vN / max(length(vN), 1e-4); if (!gl_FrontFacing) n = -n;
        vec3 toEye = cameraPosition - vW; vec3 v = toEye / max(length(toEye), 1e-3);
        vec2 q = vec2(vL.x - vF * uTime, vL.z);
        float r1 = vnoise(q * vec2(.35, .9) + vec2(0., uTime * .15)), r2 = vnoise(q * vec2(.9, 2.1) - vec2(uTime * .3, 0.));
        float rip = r1 * .6 + r2 * .4;
        float fr = 1. - max(dot(n, v), 0.); fr = .05 + .95 * fr * fr * fr;
        vec3 refl = reflect(-v, n); 
        vec3 skyc = mix(uFogCol, uZenith, 1. - exp(-abs(refl.y) * 3.2));
        float sh = slabShadow(vW);
        float ndl = max(dot(n, uSun), 0.) * sh;
        vec3 c = uDeep * (.6 + .6 * ndl) * (.86 + .3 * rip);
        c = mix(c, skyc, clamp(fr * .55 + (rip - .5) * .18, 0., .5));
        float glint = smoothstep(.55, .95, r2 * r1 * 2.) * (.2 + ndl);
        c += uSunCol * glint * .12;
        float foam = clamp(vL.y, 0., 1.);
        // white water: long streaks drawn out along the fall, finer ones among them
        vec2 qs = q + vec2(0., .5 * sin(q.x * .13) + .25 * sin(q.x * .31 + 2.));
        float streak = vnoise(qs * vec2(.045, 1.7)) * .5 + vnoise(qs * vec2(.11, 4.3) + 5.) * .32 + vnoise(qs * vec2(.3, 9.) + 2.) * .18;
        c = mix(c * mix(1., .8, foam), vec3(.95, .97, .99) * (.6 + .5 * ndl + .2), foam * (.3 + .7 * smoothstep(.3, .68, streak)) * (.85 + .15 * r2));
        gl_FragColor = vec4(airFog(c, vW), 1.);
      }`,
    side: THREE.DoubleSide,
  });
}
// THE HUNG LAKE's water: a deep green lake water, clearly not the sky's tone, with wind waves, glitter and the
// boats' wakes all lying in the wall's own plane. Geometry carries aLocal = (metres up the wall from the lake's
// centre, 0, metres across).
export const LAKE_BOATS = 10;
function makeLakeMaterial(air, radius) {
  const boats = []; for (let i = 0; i < LAKE_BOATS; i++) boats.push(new THREE.Vector4(1e4, 1e4, 0, 1));
  return new THREE.ShaderMaterial({
    uniforms: { ...air, uBoat: { value: boats }, uR: { value: radius },
      uDeep: { value: new THREE.Color('#0F5A55') }, uShoal: { value: new THREE.Color('#58AE96') } },
    vertexShader: /* glsl */`attribute vec3 aLocal; varying vec3 vW; varying vec3 vL;
      void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vL = aLocal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    side: THREE.DoubleSide,
    fragmentShader: /* glsl */`varying vec3 vW; varying vec3 vL; uniform float uTime; uniform float uR; uniform vec4 uBoat[${LAKE_BOATS}];
      uniform vec3 uDeep; uniform vec3 uShoal;
      ${AIR_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main() {
        vec2 p = vL.xz; float r = length(p);
        float px = max(fwidth(p.x) + fwidth(p.y), 1e-4);
        vec3 toEye = cameraPosition - vW; float dist = max(length(toEye), 1e-3); vec3 v = toEye / dist;
        // wind waves: three trains of crests of three lengths, crossing the lake in its own plane
        vec2 w0 = vec2(.26, .966), w1 = vec2(.5, .866), w2 = vec2(-.44, .9);
        float warp = vnoise(p * .045 + vec2(uTime * .03, 0.)) * 5.;
        // the shorter trains wander and break, so no two crests cross the same way twice
        float wander = vnoise(p * .17 + vec2(3., uTime * .05)) * 4.2, ruffle = vnoise(p * .37 - vec2(uTime * .08, 7.)) * 5.;
        float a0 = dot(p, w0) * .42 + warp * .8 - uTime * .7, a1 = dot(p, w1) * 1.5 + warp + wander - uTime * 1.3, a2 = dot(p, w2) * 3.1 - warp * .7 + ruffle - uTime * 2.;
        float f0 = clamp(1.4 - px * .22, 0., 1.), f1 = clamp(1.3 - px * .8, 0., 1.), f2 = clamp(1.2 - px * 1.7, 0., 1.);
        vec2 g = w0 * cos(a0) * .10 * f0 + w1 * cos(a1) * .10 * f1 + w2 * cos(a2) * .06 * f2;
        // the water's normal: the wall's own up, leaned by the waves' slope (up the wall is world y, across is world z)
        vec3 n = vec3(-1., -g.x, -g.y); n /= max(length(n), 1e-4);
        float sh = slabShadow(vW);
        float ndl = max(dot(n, uSun), 0.) * sh;
        // deep green in the middle, jade over the shoals by the shore, darker where a gust lies on it
        float shoal = smoothstep(uR - 16., uR - 1., r);
        float gust = vnoise(p * .028 + vec2(uTime * .05, -uTime * .02)) * .6 + vnoise(p * .09 - vec2(uTime * .06, 0.)) * .4;
        vec3 c = mix(uDeep, uShoal, shoal * .7) * (.62 + .55 * ndl) * (.8 + .4 * gust) * mix(uShade * 1.5, vec3(1.), .5 + .5 * sh);
        // crest lines: the pale backs of the waves, long ones first
        float crest = smoothstep(.55, 1., sin(a0)) * .5 * f0 + smoothstep(.7, 1., sin(a1 + 2. * gust)) * .26 * f1 * gust + smoothstep(.8, 1., sin(a2)) * .12 * f2 * (1. - gust);
        c += (uShoal * .5 + uZenith * .25) * crest * (.2 + .5 * gust) * (.5 + .5 * sh);
        // where the waves are finer than the eye can part, their pale backs and the shoals' green run together into
        // one even field of jade, brighter than any one trough
        float evenJade = 1. - f1;
        c = mix(c, uShoal * (.78 + .5 * ndl) * mix(uShade * 1.6, vec3(1.), .5 + .5 * sh) * (.9 + .25 * gust) * 1.25, evenJade * .7);
        float fr = 1. - max(dot(n, v), 0.); fr = fr * fr; fr = fr * fr;
        vec3 refl = reflect(-v, n);
        c = mix(c, mix(uFogCol, uZenith, 1. - exp(-abs(refl.y) * 3.2)) * .8, clamp(fr, 0., .2) * (1. - .7 * evenJade));
        // each boat's wake: a pale curl that follows it round its ring and widens behind
        float wake = 0.;
        for (int i = 0; i < ${LAKE_BOATS}; i++) {
          vec2 d = p - uBoat[i].xy; float rr = length(d);
          float ang = atan(d.y, abs(d.x) < 1e-4 ? 1e-4 : d.x);
          float behind = fract((uBoat[i].z - ang) * uBoat[i].w / 6.2831853);
          float wide = .5 + behind * 9.;
          wake += (1. - smoothstep(wide * .5, wide, abs(rr - 8.))) * (1. - smoothstep(0., .42, behind)) * step(rr, 30.);
        }
        c = mix(c, vec3(.82, .93, .9) * (.45 + .55 * sh + .2), clamp(wake, 0., 1.) * .6 * (.6 + .4 * vnoise(p * 1.3 - uTime * .4)));
        // the lap at the shore, coming and going
        float lap = smoothstep(uR - 2.6, uR - .9, r + 1.2 * vnoise(p * .35 + uTime * .25) + .5 * sin(uTime * .9 + r));
        c = mix(c, vec3(.86, .95, .92) * (.5 + .5 * sh + .15), lap * .55);
        // glitter on the waves' backs where they turn the sun to the eye
        float sd = max(dot(refl, uSun), 0.); float s4 = sd * sd; s4 *= s4; float s16 = s4 * s4; s16 *= s16;
        // the sparkle is the small waves' own: two fine smooth ripples running through each other, bright only where
        // both crest, and gone to an even sheen where a ripple is finer than the eye can part
        float fs = clamp(1.25 - px * 2.4, 0., 1.);
        float rp = vnoise(p * 2.9 + vec2(uTime * 1.1, -uTime * .7)) * vnoise(p * 4.3 - vec2(uTime * .9, uTime * 1.3) + 9.);
        float tw = smoothstep(.34, .62, rp) * fs;
        float s64 = s16 * s16; s64 *= s64;
        c += uSunCol * min(.75, (s64 + s16 * .08) * (.3 + .9 * tw)) * sh;
        // and by the same ripples a fine grain of lighter and darker water close to, in sun and shade alike
        c *= 1. + .16 * (rp - .25) * fs;
        gl_FragColor = vec4(airFogShare(c, vW, .4), 1.);
      }`,
  });
}
// the rim's leap: water leaves the lip at 29 m/s, 12 degrees over toward the back, and behind the wall's plane
// falls as any water does, to the sea behind the slab
export const LEAP = { v: 29, lean: 12 * Math.PI / 180, g: 9.81, width: 10, thick: 1.5 };
export function leapPoint(t, out = new THREE.Vector3()) {
  const vx = LEAP.v * Math.sin(LEAP.lean), vy = LEAP.v * Math.cos(LEAP.lean);
  return out.set(LAND.wallX + vx * t, LAND.rimY + vy * t - 0.5 * LEAP.g * t * t, LAND.canalZ);
}
MAKERS.push(async (D) => {
  const { P, ctx, group, air } = D;
  const mat = makeWaterMaterial(air);
  const pos = [], nor = [], loc = [], flow = [];
  const put = (x, y, z, nx, ny, nz, l0, foam, l2, f) => { pos.push(x, y, z); nor.push(nx, ny, nz); loc.push(l0, foam, l2); flow.push(f); };
  // the canal: 10 m of water from the harbour, round the bend and up the wall to the lip, flowing up at 3 m/s
  const b0 = {}, b1 = {}, cz = LAND.canalZ, hw = 5;
  for (let s = 0; s < S_RIM - 1e-6;) {
    const nx = s < LAND.sCrease ? LAND.sCrease : s < S_WALL ? Math.min(S_WALL, s + 2) : S_RIM;
    basisAt(s, b0); basisAt(nx, b1);
    const A = [b0.gx, b0.gy, cz - hw], B = [b0.gx, b0.gy, cz + hw], C = [b1.gx, b1.gy, cz + hw], E = [b1.gx, b1.gy, cz - hw];
    put(...A, b0.ux, b0.uy, 0, s, 0, -hw, 3); put(...B, b0.ux, b0.uy, 0, s, 0, hw, 3); put(...C, b1.ux, b1.uy, 0, nx, 0, hw, 3);
    put(...A, b0.ux, b0.uy, 0, s, 0, -hw, 3); put(...C, b1.ux, b1.uy, 0, nx, 0, hw, 3); put(...E, b1.ux, b1.uy, 0, nx, 0, -hw, 3);
    s = nx;
  }
  // the hung lake: a disc of water 150 m across, standing on the wall
  {
    const lp = [], ll = [], lk = new THREE.Vector3(), R = P.lake.r;
    const at = (ds, dz) => { fold(P.lake.s + ds, P.lake.z + dz, 0.7, lk); lp.push(lk.x, lk.y, lk.z); ll.push(ds, 0, dz); };
    for (let i = 0; i < 48; i++) {
      const a0 = i / 48 * Math.PI * 2, a1 = (i + 1) / 48 * Math.PI * 2;
      at(0, 0); at(R * Math.cos(a0), R * Math.sin(a0)); at(R * Math.cos(a1), R * Math.sin(a1));
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('aLocal', new THREE.Float32BufferAttribute(ll, 3));
    D.lakeMat = makeLakeMaterial(air, R);
    const lake = new THREE.Mesh(lg, D.lakeMat); lake.frustumCulled = false; lake.matrixAutoUpdate = false; group.add(lake);
  }
  await ctx.yield();
  // the leap: a ribbon along the ballistic curve from the lip, over the top, down to the sea behind the slab
  const vy = LEAP.v * Math.cos(LEAP.lean), tEnd = (vy + Math.sqrt(vy * vy + 2 * LEAP.g * LAND.rimY)) / LEAP.g;
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  // a stream with a body: as wide as the canal, a man's height thick at the lip and swelling as it falls
  const N = 64, SIDES = 10, ringAt = (i) => {
    const t = tEnd * i / N, tb = tEnd * Math.max(i - 1, 0) / N, ta = tEnd * Math.min(i + 1, N) / N;
    leapPoint(t, p0); leapPoint(tb, p1); const bx = p1.x, by = p1.y; leapPoint(ta, p1);
    const dx = p1.x - bx, dy = p1.y - by, len = Math.max(Math.hypot(dx, dy), 1e-3), nx = dy / len, ny = -dx / len;
    const k = t / tEnd, w = hw * (1 + 0.6 * k), th = LEAP.thick * (1 + 2.2 * k), foam = 0.5 + 0.5 * smooth(0, 0.35, k);
    const ring = [];
    for (let j = 0; j <= SIDES; j++) {
      const an = j / SIDES * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
      ring.push([p0.x + nx * th * sn, p0.y + ny * th * sn, cz + w * c, nx * sn, ny * sn, c * 0.6, foam, w * c]);
    }
    return { ring, sp: LEAP.v, x: p0.x, y: p0.y, along: S_RIM + LEAP.v * t };
  };
  let prev = ringAt(0);
  for (let i = 1; i <= N; i++) {
    const cur = ringAt(i), len = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    for (let j = 0; j < SIDES; j++) {
      // along the leap the pattern's coordinate is the water's time of flight times its speed at the lip
      for (const [v, along] of [[prev.ring[j], prev.along], [prev.ring[j + 1], prev.along], [cur.ring[j + 1], cur.along], [prev.ring[j], prev.along], [cur.ring[j + 1], cur.along], [cur.ring[j], cur.along]]) {
        put(v[0], v[1], v[2], v[3], v[4], v[5], along, v[6], v[7], LEAP.v);
      }
    }
    prev = cur;
    if (i % 16 === 0) await ctx.yield();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('aLocal', new THREE.Float32BufferAttribute(loc, 3)); geo.setAttribute('aKind', new THREE.Float32BufferAttribute(flow, 1));
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; group.add(mesh);
});

// ---------- vessels: upright on the level sea (the witness), and boats that sail the lake standing on the wall ----------
function hullModel(g, L, B, H, col, deckCol, draft = 1.2) {
  const o = [[-L / 2, B * 0.34], [-L * 0.32, B / 2], [L * 0.22, B / 2], [L / 2, 0]];
  for (let i = 0; i + 1 < o.length; i++) {
    const [x0, w0] = o[i], [x1, w1] = o[i + 1];
    g.quad([x0, -draft, w0 * 0.7], [x0, H, w0], [x1, H, w1], [x1, -draft, w1 * 0.7], col, 0);
    g.quad([x1, -draft, -w1 * 0.7], [x1, H, -w1], [x0, H, -w0], [x0, -draft, -w0 * 0.7], col, 0);
    g.quad([x0, H, -w0], [x1, H, -w1], [x1, H, w1], [x0, H, w0], deckCol, 0);
  }
  g.quad([-L / 2, -draft, -B * 0.24], [-L / 2, H, -B * 0.34], [-L / 2, H, B * 0.34], [-L / 2, -draft, B * 0.24], col, 0);
}
// a canal barge, the same fore and aft, so it runs either way without turning: the canal is 10 m of water and a
// 16 m hull cannot wind in it. Two strings of four work the canal, one string to a lane: a string runs up its lane,
// slows over BARGE.ease metres to a halt, its first barge 42 m short of the lip, and runs back down the same lane
// to a halt with its last barge at s 22; the other string is half a round behind it. Where the clock finds the
// strings at the world's first second is dealt from a stream of the barges' own.
export const BARGE = { L: 16, B: 4.2, lane: 2.4, gap: 46, speed: 2.4, ease: 24 };
function bargeModel(g) {
  const L = BARGE.L, B = BARGE.B, H = 1.1, draft = 0.4, col = TONE.dark, deckCol = TONE.brick.clone().multiplyScalar(0.7);
  const o = [[-L / 2, 0], [-L * 0.3, B / 2], [L * 0.3, B / 2], [L / 2, 0]];
  for (let i = 0; i + 1 < o.length; i++) {
    const [x0, w0] = o[i], [x1, w1] = o[i + 1];
    g.quad([x0, -draft, w0 * 0.7], [x0, H, w0], [x1, H, w1], [x1, -draft, w1 * 0.7], col, 0);
    g.quad([x1, -draft, -w1 * 0.7], [x1, H, -w1], [x0, H, -w0], [x0, -draft, -w0 * 0.7], col, 0);
    g.quad([x0, H, -w0], [x1, H, -w1], [x1, H, w1], [x0, H, w0], deckCol, 0);
  }
  g.box(0, H, 0, 3, 1.6, 3, TONE.plaster, 0);
}
// a small sailing boat: hull 8 m, mast 12 m, a mainsail and a jib
export const BOAT = { hull: 8, mast: 12, deck: 0.9, heel: 0.2, ring: 8 };
function boatModel(g) {
  hullModel(g, BOAT.hull, 2.6, BOAT.deck, TONE.white, TONE.wood, 0.5);
  g.box(0.4, BOAT.deck, 0, 0.22, BOAT.mast, 0.22, TONE.wood, 0, { top: false });
  g.tri([0.2, 2.2, 0.05], [0.2, BOAT.mast + 0.6, 0.05], [-3.9, 2.4, 0.5], TONE.plaster, 6);
  g.tri([0.7, 2.0, 0], [0.7, BOAT.mast - 1.5, 0], [3.9, 1.3, 0.2], TONE.brick, 6);
}
// a boat lying at a jetty: the same hull and mast, the sail furled along its boom
export const MOORED = { heel: 0.07 };
function mooredModel(g) {
  hullModel(g, BOAT.hull, 2.6, BOAT.deck, TONE.brick.clone().multiplyScalar(0.8), TONE.plaster, 0.5);
  g.box(0, BOAT.deck - 0.25, 0, BOAT.hull * 0.9, 0.25, 2.7, TONE.white, 0, { top: false });
  g.box(0.4, BOAT.deck, 0, 0.24, BOAT.mast, 0.24, TONE.wood, 0, { top: false });
  g.box(-1.7, BOAT.deck + 1.5, 0, 4.2, 0.5, 0.5, TONE.plaster, 0);
}
function luggerModel(g) {
  hullModel(g, 13, 3.8, 1.6, TONE.dark, TONE.wood);
  for (const [mx, mh] of [[2.2, 13], [-3.2, 10]]) {
    g.box(mx, 1.6, 0, 0.3, mh, 0.3, TONE.wood, 0, { top: false });
    g.quad([mx - 2.6, 3.2, 0.3], [mx + 2.2, 2.8, 0.3], [mx + 1.4, mh, 0.3], [mx - 2.9, mh + 1.2, 0.3], TONE.brick.clone().multiplyScalar(0.9), 6);
  }
}
function threeMasterModel(g) {
  hullModel(g, 48, 9, 4.2, TONE.dark, TONE.wood, 2);
  g.box(0, 3.4, 0, 47, 0.6, 9.2, TONE.white, 0, { top: false });
  g.box(21, 4.2, 0, 14, 0.3, 0.3, TONE.wood, 0);                      // bowsprit
  for (const mx of [-15, 0, 14]) {
    g.box(mx, 4.2, 0, 0.6, 32, 0.6, TONE.wood, 0, { top: false });
    // three square sails a mast, yards braced round and the cloth bellied, so they read as sails from any side
    const br = 0.62, cb = Math.cos(br), sb = Math.sin(br);
    for (let k = 0; k < 3; k++) {
      const y0 = 9 + k * 8.2, w = 8 - k * 1.6;
      const at = (f, y, belly) => { const zz = (f * 2 - 1) * w, xx = 0.5 + belly * (1 - (f * 2 - 1) ** 2); return [mx + xx * cb + zz * sb, y, -xx * sb + zz * cb]; };
      g.quad(at(0, y0 + 6.7, 0), at(1, y0 + 6.7, 0), at(1, y0 + 7.0, 0), at(0, y0 + 7.0, 0), TONE.wood, 0);
      for (let j = 0; j < 4; j++) {
        const f0 = j / 4, f1 = (j + 1) / 4;
        g.quad(at(f0, y0, 1.6), at(f1, y0, 1.6), at(f1, y0 + 6.6, 0.5), at(f0, y0 + 6.6, 0.5), j % 2 ? TONE.plaster : TONE.white, 6);
      }
    }
  }
}
function steamerModel(g) {
  hullModel(g, 52, 9, 4.5, TONE.dark, TONE.wood, 2);
  g.box(0, 0.2, 0, 51.5, 0.8, 9.1, TONE.brick, 0, { top: false });
  g.box(-2, 4.5, 0, 24, 3, 6.6, TONE.white, 5);
  g.box(-4, 7.5, 0, 8, 2.4, 5, TONE.white, 0);
  g.stem(2, 7.5, 0, 1.5, 1.5, 7.5, 10, TONE.enamel, 0); g.stem(2, 15, 0, 1.55, 1.55, 1.4, 10, TONE.dark, 0, true);
  for (const mx of [-19, 17]) g.box(mx, 4.5, 0, 0.4, 16, 0.4, TONE.wood, 0, { top: false });
}
// four steamers lie at anchor in the roads, strung out along the land and beyond its far end: one abreast of the
// water 150 m beyond the lake's far shore, one off the canal's mouth, and two beyond the land's end: one 230 m on
// and well to seaward, the last 840 m on and dead off the land's end, where the top rows and the rim look down
// on it. The outer two lie broadside to the upper town.
export const STEAMERS = [{ x: -105, z: LAKE.z + LAKE.r + 150, yaw: 0.5 }, { x: -80, z: LAND.canalZ + 15, yaw: 1.2 },
  { x: -230, z: LAND.z1 + 230, yaw: -0.64 }, { x: 30, z: LAND.z1 + 840, yaw: -0.64 }];
// the fishing fleet works the water off the land's end, between the land and the last steamer: the water is cut
// across into one lane a lugger, and each sails a slow round of its own inside its lane, long across it, with
// FLEET.gap of open water between its round and the lane's edge: so no two rounds meet at any clock
export const FLEET = { n: 4, x0: 60, x1: 250, z0: LAND.z1 + 380, z1: LAND.z1 + 700, gap: 9 };
// a vessel under way drags a wake: the water it crossed in the last seconds, pale at the stern and closing astern
export const WAKE = { cuts: 10, every: 1.5, wide: 7 };
export const STEAMER_SCALE = 1.45, LUGGER_SCALE = 1.6;
export const QUAY_SHIP = { x: -12, z: -339 };
MAKERS.push(async (D) => {
  const { P, ctx, group, town, opts } = D;
  const add = (geo, count) => {
    const mesh = count ? new THREE.InstancedMesh(geo, town, count) : new THREE.Mesh(geo, town);
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; group.add(mesh); return mesh;
  };
  let g = new Geo(); threeMasterModel(g); const big = add(g.build());
  g = new Geo(); steamerModel(g); const steamers = add(g.build(), STEAMERS.length);
  g = new Geo(); luggerModel(g); const luggers = add(g.build(), 6 + FLEET.n);
  await ctx.yield();
  // six luggers, each sailing a slow closed round of its own out in the harbour, clear of the land
  const rng = ctx.rng.fork('luggers'), lug = [];
  for (let i = 0; i < 6; i++) lug.push({ x: rng.range(-190, -60), z: -230 + i * 290 + rng.range(-60, 60), r: rng.range(22, 40), ph: rng() * 6.283, per: rng.range(44, 58) });
  // a harbour round lies long along the shore: r across, 1.6 r along z
  for (const l of lug) { l.rx = l.r; l.rz = 1.6 * l.r; }
  // a lugger whose round would cross a steamer's berth keeps to seaward of it
  for (const l of lug) for (const st of STEAMERS) if (Math.abs(l.z - st.z) < 170) l.x = Math.min(l.x, st.x - 115);
  // the fleet off the land's end, dealt from a stream of its own: a round is r along z and 1.6 r across its lane,
  // and its middle is dealt only so far from the lane's middle as leaves FLEET.gap inside the lane's edge and inside
  // the water's two sides; a hull reaches 4.1 m past its round along z and 5.9 m across, so every hull lies wholly
  // in the fleet's water and in its own lane, and two hulls are never nearer than 9.8 m
  const frng = ctx.core.makeRng(ctx.core.hashSeed('fleet:' + ctx.seed)), lane = (FLEET.z1 - FLEET.z0) / FLEET.n;
  for (let i = 0; i < FLEET.n; i++) {
    const r = frng.range(20, 28), slack = lane / 2 - r - FLEET.gap;
    lug.push({ x: frng.range(FLEET.x0 + 1.6 * r + FLEET.gap, FLEET.x1 - 1.6 * r - FLEET.gap), z: FLEET.z0 + lane * (i + 0.5) + frng.range(-slack, slack), r, rx: 1.6 * r, rz: r, ph: frng() * 6.283, per: frng.range(44, 58) });
  }
  // every lugger's wake: a ribbon laid along where the hull was, cut by cut back in time
  const nWake = lug.length * WAKE.cuts * 6, wPos = new Float32Array(nWake * 3), wNor = new Float32Array(nWake * 3), wCol = new Float32Array(nWake * 3);
  for (let i = 0; i < nWake; i++) { wNor[i * 3 + 1] = 1; }
  const foam = new THREE.Color(0.9, 0.95, 0.97), spent = TONE.sea.clone().lerp(TONE.white, 0.35);
  for (let i = 0; i < lug.length; i++) for (let k = 0; k < WAKE.cuts; k++) for (let v = 0; v < 6; v++) {
    const far = (v === 2 || v === 4 || v === 5) ? k + 1 : k, c = foam.clone().lerp(spent, far / WAKE.cuts), o = ((i * WAKE.cuts + k) * 6 + v) * 3;
    wCol[o] = c.r; wCol[o + 1] = c.g; wCol[o + 2] = c.b;
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); wGeo.setAttribute('normal', new THREE.BufferAttribute(wNor, 3));
  wGeo.setAttribute('aCol', new THREE.BufferAttribute(wCol, 3)); wGeo.setAttribute('aLocal', new THREE.BufferAttribute(new Float32Array(nWake * 3), 3));
  wGeo.setAttribute('aKind', new THREE.BufferAttribute(new Float32Array(nWake), 1));
  const wakes = add(wGeo);
  const lugAt = (l, time, out) => { const a = time * 6.283185 / l.per + l.ph; out.x = l.x + l.rx * Math.cos(a); out.z = l.z + l.rz * Math.sin(a); out.a = a; return out; };
  const wa = {}, wb = {};
  // the lake's boats: stations even along z, alternately above and below the lake's centre line
  const nb = opts.boats || 8;
  g = new Geo(); boatModel(g); const boats = add(g.build(), nb);
  // eight barges on the canal, plain: a canal barge is the same fore and aft, pointed at both ends, its cabin amidships
  g = new Geo(); bargeModel(g);
  const barges = add(g.build(), 8);
  // boats moored at the lake's jetties, one each side, sails furled: their bare masts stand out level from the wall
  g = new Geo(); mooredModel(g);
  const moor = [];
  for (const th of LAKE_JETTIES) for (const side of [-1, 1]) {
    const rad = P.lake.r - (side > 0 ? 8 : 12.5), c = Math.cos(th), sn = Math.sin(th);
    moor.push({ s: P.lake.s + rad * c - side * 3.3 * sn, z: P.lake.z + rad * sn + side * 3.3 * c, yaw: -th });
  }
  const moored = add(g.build(), moor.length);
  await ctx.yield();
  const m = new THREE.Matrix4(), r = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), big3 = new THREE.Vector3(STEAMER_SCALE, STEAMER_SCALE, STEAMER_SCALE), lug3 = new THREE.Vector3(LUGGER_SCALE, LUGGER_SCALE, LUGGER_SCALE);
  const lakeBoats = D.lakeMat.uniforms.uBoat.value;
  // a string's travel between its two halts (the easing takes half its own length off each end)
  const TAU = Math.PI * 2, bargeRun = S_RIM - 30 - 10 - 3 * BARGE.gap;
  const bargeLead = 2 * ctx.core.makeRng(ctx.core.hashSeed('barges:' + ctx.seed))();
  const afloat = (x, z, yaw, time, ph, amp) => {
    e.set(amp * Math.sin(time * TAU / 7.3 + ph), yaw, amp * 0.6 * Math.sin(time * TAU / 5.1 + ph * 1.7), 'YXZ');
    return m.compose(v.set(x, 0.25 * Math.sin(time * TAU / 6.1 + ph), z), q.setFromEuler(e), one);
  };
  D.tick.push((time) => {
    big.matrix.copy(afloat(QUAY_SHIP.x, QUAY_SHIP.z, Math.PI / 2, time, 0.4, 0.02));
    for (let i = 0; i < STEAMERS.length; i++) { const s = STEAMERS[i]; steamers.setMatrixAt(i, afloat(s.x, s.z, s.yaw, time, i * 2.1, 0.012).scale(big3)); }
    steamers.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < lug.length; i++) {
      const l = lug[i], a = time * TAU / l.per + l.ph;
      luggers.setMatrixAt(i, afloat(l.x + l.rx * Math.cos(a), l.z + l.rz * Math.sin(a), -Math.atan2(l.rz * Math.cos(a), -l.rx * Math.sin(a)), time, l.ph, 0.05).scale(lug3));
      // the wake: where the stern was, every WAKE.every seconds back; it swells to its full width and closes to nothing
      for (let k = 0; k < WAKE.cuts; k++) {
        lugAt(l, time - 1.2 - k * WAKE.every, wa); lugAt(l, time - 1.2 - (k + 1) * WAKE.every, wb);
        const o = (i * WAKE.cuts + k) * 18;
        const cut = (q, kk, at) => {
          const f = kk / WAKE.cuts, half = WAKE.wide * 0.5 * Math.sin(Math.PI * Math.min(1, 0.12 + f)) , nx = l.rx * Math.cos(q.a), nz = l.rz * Math.sin(q.a), nl = Math.max(Math.hypot(nx, nz), 1e-3);
          // across the wake is along the round's own radius there
          wPos[at] = q.x - nx / nl * half; wPos[at + 1] = 0.3; wPos[at + 2] = q.z - nz / nl * half;
          wPos[at + 3] = q.x + nx / nl * half; wPos[at + 4] = 0.3; wPos[at + 5] = q.z + nz / nl * half;
        };
        cut(wa, k, o); cut(wb, k + 1, o + 6);
        // two triangles: near-left, near-right, far-right; near-left, far-right, far-left
        wPos[o + 13] = 0.3;
        const flx = wPos[o + 6], flz = wPos[o + 8], frx = wPos[o + 9], frz = wPos[o + 11];
        wPos[o + 6] = frx; wPos[o + 8] = frz; wPos[o + 9] = wPos[o]; wPos[o + 11] = wPos[o + 2];
        wPos[o + 12] = frx; wPos[o + 14] = frz; wPos[o + 15] = flx; wPos[o + 16] = 0.3; wPos[o + 17] = flz;
      }
    }
    luggers.instanceMatrix.needsUpdate = true; wGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < nb; i++) {
      const zs = P.lake.z - 52 + (nb > 1 ? 104 * i / (nb - 1) : 52), ss = P.lake.s + (i % 2 ? -8 : 8);
      const a = time * TAU / (26 + (i % 3) * 5) * (i % 2 ? -1 : 1) + i * 1.9;
      const ds = -Math.sin(a) * (i % 2 ? -1 : 1), dz = Math.cos(a) * (i % 2 ? -1 : 1);
      standAt(ss + BOAT.ring * Math.cos(a), zs + BOAT.ring * Math.sin(a), 0.7, -Math.atan2(dz, ds), 1, m);
      m.multiply(r.makeRotationX(BOAT.heel * Math.sin(time * TAU / 6.7 + i * 2.3)));
      boats.setMatrixAt(i, m);
      lakeBoats[i].set(ss - P.lake.s, zs - P.lake.z, ((a % TAU) + TAU) % TAU, i % 2 ? -1 : 1);
    }
    boats.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < moor.length; i++) {
      const b = moor[i];
      standAt(b.s, b.z, 0.7, b.yaw, 1, m);
      m.multiply(r.makeRotationX(MOORED.heel * Math.sin(time * TAU / (5.3 + (i % 5) * 0.7) + i * 1.3)));
      moored.setMatrixAt(i, m);
    }
    moored.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 8; i++) {
      // the string's place on its travel is a triangle of the clock, rounded to a halt over BARGE.ease at each end
      const side = i < 4 ? 1 : -1, p = (BARGE.speed * time / bargeRun + bargeLead + (side > 0 ? 0 : 1)) % 2;
      let d = (p < 1 ? p : 2 - p) * bargeRun;
      if (d < BARGE.ease) d = BARGE.ease / 2 + d * d / (2 * BARGE.ease);
      else if (d > bargeRun - BARGE.ease) d = bargeRun - BARGE.ease / 2 - (bargeRun - d) * (bargeRun - d) / (2 * BARGE.ease);
      standAt(10 + d + (i % 4) * BARGE.gap, LAND.canalZ + side * BARGE.lane, 0.1, 0, 1, m);
      barges.setMatrixAt(i, m);
    }
    barges.instanceMatrix.needsUpdate = true;
  });
});

// ---------- smoke and cloud: free things take their shape from the law at build and their motion from the clock ----------
// A rope's centre line: from a mouth, stepping along -downAt; level near the wall, turning upward between 60 and 90 m out.
export function riseLine(x, y, z, steps, step, lean, ceil) {
  const pts = [new THREE.Vector3(x, y, z)], d = new THREE.Vector3(), p = new THREE.Vector3(x, y, z);
  for (let i = 0; i < steps; i++) {
    downAt(p.x, p.y, p.z, d);
    const risen = Math.max(-d.y, 0);                       // how far the pull has turned to the sea's down
    d.multiplyScalar(-1); d.z -= lean * risen * risen;      // a sea breeze leans only what has risen, along the wall
    p.addScaledVector(d.normalize(), step);
    if (ceil !== undefined && p.y > ceil) { p.y = ceil; pts.push(p.clone()); break; }
    pts.push(p.clone());
  }
  return pts;
}
function makeSmokeMaterial(air, cloud) {
  // a heap's oval for the drawing: its centre in plan and one over its two half widths
  const ovalGl = (b, grow) => `vec4(${((b.x0 + b.x1) / 2).toFixed(1)}, ${((b.z0 + b.z1) / 2).toFixed(1)}, ${(2 / ((b.x1 - b.x0) * grow)).toFixed(6)}, ${(2 / ((b.z1 - b.z0) * grow)).toFixed(6)})`;
  return new THREE.ShaderMaterial({
    uniforms: { ...air },
    // vZ: the corner's depth before the lens and the two numbers of the lens that turn a depth into the depth buffer's
    vertexShader: /* glsl */`attribute vec3 aLocal; varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vZ;
      void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; vL = aLocal; vec4 e = viewMatrix * w;
        vZ = vec3(e.z, projectionMatrix[2][2], projectionMatrix[3][2]); gl_Position = projectionMatrix * e; }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vZ; uniform float uTime;
      ${AIR_GLSL}
      float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
                   mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
      void main() {
        vec3 n = vN / max(length(vN), 1e-4);
        vec3 toEye = cameraPosition - vW; vec3 v = toEye / max(length(toEye), 1e-3);
        // vL: x = how far along (the wall's bank is marked far along), y = softness of the edge here (0 the hard cloud, the bank a little soft), z = drift speed
        vec3 q = vW * .11; q.z += uTime * .11 * vL.z; q.y -= uTime * .02;
        vec3 qa = vec3(vL.x * .16 - uTime * 1.05, q.x + q.y, q.z);
        float soft = ${cloud ? '0.' : 'vL.y'};
        float tuft = vn3(q * 2.3 + 7. + soft * vec3(0., -uTime * .9, 0.));
        float puff = ${cloud ? 'vn3(q)' : 'mix(vn3(q - n * (uTime * .05)), vn3(qa), soft)'} * .6 + tuft * .4;
        float facing = abs(dot(n, v));
        float a = smoothstep(.12, .62, facing * (.55 + .9 * puff));
        a *= mix(1., .82, min(soft, 1.));
        float ndl = dot(n, uSun) * .5 + .5;
        float sf = min(soft, 1.);
        vec3 body = mix(vec3(.30, .29, .30), vec3(1.), max(1. - sf, smoothstep(30., 120., vL.x) * .55));
        vec3 c = body * mix(uShade * 1.25, vec3(1.), .45 + .55 * ndl) * mix(vec3(1.), uSunCol, .4) * mix(.76 + .36 * puff, .62 + .6 * puff, 1. - sf);
        ${cloud ? `// A HEAP OF CLOUD IS LIT AS ONE SKIN: its light is of fields of its own place, never lump by lump. Its cut is
        // not wholly so: the skin is left out where the lump's own skin turns from the eye (a, above: the lump's own
        // facing), and only the threshold of that cut is of the place. vL.x is the corner's height in the whole
        // cloud. How far out toward the heap's edge a point lies is read from its own place: its share of the heap's
        // oval in plan (the deck's or the lower floor's, told by its height).
        float hk = clamp(vL.x, 0., 1.);
        vec4 ov = vW.y > ${((FLOOR.y1 + DECK.y0) / 2).toFixed(1)} ? ${ovalGl(DECK, CLOUD_OVAL.deck)} : ${ovalGl(FLOOR, CLOUD_OVAL.floor)};
        vec2 od = (vW.xz - ov.xy) * ov.zw; float oval = length(od);
        float ek = clamp(oval, 0., 1.);
        // the skin's facing, by place. The heap's own shape gives it a small part: up where it stands above the heap's
        // middle (which lifts toward the edge as the base does), down under it, outward at the edge. The billows give
        // it the greater part: two fields of the place, broad heaves and on them billows of a house's size, and the
        // skin leans as each field falls away, so that each has a side to the sun and a side away from it. No lump's
        // own facing is in it, so no join between lumps can show as a line in the light
        vec2 og = od * ov.zw; og *= smoothstep(.45, 1., ek) * .4 / max(length(og), 1e-5);
        vec3 nf = vec3(og.x, clamp((hk - .36 - .33 * min(oval * oval, 1.)) * 8., -1., 1.) * .5, og.y);
        vec3 qb = q * 1.35 + 11.; float b0 = vn3(qb);
        vec3 swell = vec3(vn3(qb + vec3(.3, 0., 0.)), vn3(qb + vec3(0., .3, 0.)), vn3(qb + vec3(0., 0., .3))) - b0;
        vec3 qh = q * .4 + 23.; float h0 = vn3(qh);
        vec3 heave = vec3(vn3(qh + vec3(.3, 0., 0.)), vn3(qh + vec3(0., .3, 0.)), vn3(qh + vec3(0., 0., .3))) - h0;
        vec3 nb = nf - swell * 9. - heave * 7.; nb /= max(length(nb), 1e-4);
        // crowns and tops in the sun, flanks, hollows and the level base in the heap's own shade, cool under and
        // paler toward the sky; the sea's glow warms what is turned down to it
        float lw = clamp(dot(nb, uSun) * .62 + .54, 0., 1.);
        float topness = clamp(nb.y * .5 + .5, 0., 1.);
        float crown = smoothstep(.05, .6, hk * .5 + topness * .55);
        // where either field stands high (a crown) the sun reaches sooner, and where it lies low later; and the
        // hollows between the billows keep at most two fifths of the sun whatever the hour. All of it is of the
        // place, so it is the same seen from above and from below
        float hollow = smoothstep(.3, .56, b0 * .55 + puff * .45);
        float sunny = smoothstep(.36, .62, lw + (puff - .5) * .3 + (b0 - .5) * .7 + (h0 - .5) * .6) * crown * mix(.4, 1., hollow);
        vec3 under = mix(uShade * .92 + .04, uSkyCol * .8, .25);
        vec3 shadeC = mix(under, vec3(.68, .74, .86), topness * .45);
        c = mix(shadeC, mix(vec3(1.), uSunCol, .5), sunny) * (.86 + .24 * b0);
        float gl = max(dot(nb, uGlowDir), 0.); c += uGlow * gl * .45 * (1. - sunny);
        // its skin breaks up toward the heap's edge, in bays and tongues: there only the tufts where the billows stand
        // highest are left, and well beyond the oval the last of them thin to nothing. For this cut the way out is
        // measured from the point's place held inside a room smaller than the heap's box (rl: that room's half
        // breadths, metres from the heap's middle; smaller than the box by 25 and 27 m for the floor, a little
        // more than a lump's half breadth, and by 12 and 14.5 m for the deck, two thirds of one), which is about
        // the room the lumps' middles have: so a lump that stands against the box's side is thinned as its middle
        // lies, and not more for its outer skin, and the heap keeps its cover. Of the house-size billows it is the
        // crowns that are left and the hollows that go first (b0 lowers the threshold where it stands high)
        float lobe = vn3(q * .42 + 17.);
        vec2 rl = vW.y > ${((FLOOR.y1 + DECK.y0) / 2).toFixed(1)} ? vec2(33., 143.) : vec2(32., 58.);
        float oc = length(min(abs(vW.xz - ov.xy), rl) * ov.zw);
        float thr = mix(.3, .9, smoothstep(.3, 1., oc)) + .8 * smoothstep(1.15, 1.45, oval) + ((lobe - .5) * 1.7 - (b0 - .5) * .6 + (tuft - .5) * .45) * smoothstep(.15, .6, oc);
        // THE CUT IS ONE PIXEL SOFT: the skin's strength goes from nothing to whole across one pixel's own footprint
        // of the cut, no wider and no narrower. A pixel of that soft edge is laid ${CLOUD_OVAL.back} m back in the depth
        // buffer, so that cloud lying close behind it is drawn whole through it and no sky shows in the seam
        float cut = a - thr; a = clamp(cut / max(fwidth(cut), 1e-4) + .5, 0., 1.);
        if (a <= 0.) discard;
        float ze = vZ.x - (a < 1. ? ${CLOUD_OVAL.back}. : 0.);
        gl_FragDepth = .5 + .5 * (vZ.y * ze + vZ.z) / max(-ze, 1e-3);` : ''}
        ${cloud ? '' : `// the thin cloud lying on the wall (its lumps are marked far along, and are no smoke) lets the roofs show through
        // it lies in the lanes between the terraces in rolls, thinning to nothing against the house fronts on either
        // hand and thickest in mid lane; above the roofs' height it is one bank again. (These lines are the bank's
        // alone: no lump of the level heaps is marked far along, so their drawing leaves them out.)
        vec2 pl = planOf(vW); float laneAt = mod(pl.x - ${ROW0}., ${ROW_STEP}.);
        float inLaneMist = smoothstep(5.2, 8.2, laneAt) * (1. - smoothstep(10.8, 13.8, laneAt));
        float rolls = smoothstep(.3, .72, puff) * (.45 + .55 * smoothstep(.3, .7, vn3(q * .45 + 5.)));
        a *= mix(1., .4 * rolls * mix(inLaneMist, 1., smoothstep(9., 13., pl.y)), step(390., vL.x) * (1. - step(.5, soft)));`}
        gl_FragColor = vec4(airFog(c, vW), ${cloud ? 'a' : 'a * smoothstep(0., 1., vL.x * .6 + (1. - min(soft, 1.)))'});
      }`,
    transparent: true, depthWrite: !!cloud, side: THREE.DoubleSide,
  });
}
// a heap of cloud: round lumps, each a blunt ball pushed about by a fixed noise, that together fill a box.
// keep(x, y, z) may refuse a lump's place; every lump lies wholly inside the box.
// rim.of(x, z), where given, says how far out toward the heap's edge a place is (0 at its heart, 1 at the edge): there
// the heap is a cloud with a level base, each lump standing on it or a little over it, tall at the heart and low and thin
// toward the edge, and every corner of its skin carries its height in the whole cloud (from rim.y0, over rim.tall) and its
// lump's place toward the edge (the lump's place shapes the lump here; the drawing reads the edge from each point's own place).
async function heapInto(A, ctx, rng, box, lump, drift, keep, rim) {
  const nx = Math.max(1, Math.round((box.x1 - box.x0) / (lump.x * 1.25))), ny = Math.max(1, Math.round((box.y1 - box.y0) / (lump.y * 1.25))), nz = Math.max(1, Math.round((box.z1 - box.z0) / (lump.z * 1.25)));
  const SEG = 9, RINGS = 6, v = [];
  for (let ix = 0; ix < nx; ix++) { for (let iy = 0; iy < ny; iy++) for (let iz = 0; iz < nz; iz++) {
    const k = rng.range(0.75, 1.15), rx = Math.min(lump.x * k, (box.x1 - box.x0) / 2), ry = Math.min(lump.y * k, (box.y1 - box.y0) / 2), rz = Math.min(lump.z * k, (box.z1 - box.z0) / 2);
    const cx = clamp(lerp(box.x0, box.x1, (ix + rng.range(0.2, 0.8)) / nx), box.x0 + rx, box.x1 - rx);
    const cy = clamp(lerp(box.y0, box.y1, (iy + rng.range(0.2, 0.8)) / ny), box.y0 + ry, box.y1 - ry);
    const cz = clamp(lerp(box.z0, box.z1, (iz + rng.range(0.2, 0.8)) / nz), box.z0 + rz, box.z1 - rz);
    if (keep && !keep(cx, cy, cz)) continue;
    let ryy = ry, cyy = cy, edge = 0;
    if (rim) {
      edge = clamp(rim.of(cx, cz), 0, 1);
      ryy = ry * (1 - 0.6 * edge * edge) * (0.45 + 0.55 * smooth(-0.5, 0.6, ctx.noise.n2(cx * 0.045 + 11, cz * 0.045 - 5)));
      // the base is level at the heart and lifts and curls toward the edge, so the cloud thins to a ragged lip
      const room = Math.max(box.y1 - box.y0 - 2 * ryy, 0);
      cyy = box.y0 + ryy + room * clamp(0.6 * edge * edge + 0.3 * (0.5 + 0.5 * ctx.noise.n2(cx * 0.07 - 3, cz * 0.07 + 8)), 0, 1);
    }
    v.length = 0;
    for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SEG; j++) {
      const ph = -Math.PI / 2 + Math.PI * i / RINGS, th = Math.PI * 2 * j / SEG;
      const ux = Math.cos(ph) * Math.cos(th), uy = Math.sin(ph), uz = Math.cos(ph) * Math.sin(th);
      // the skin is drawn in a little where the noise is low: never out beyond the lump's own radii
      const dent = 1 - 0.22 * (0.5 + 0.5 * ctx.noise.n3(cx * 0.05 + ux * 1.3, cy * 0.05 + uy * 1.3, cz * 0.05 + uz * 1.3));
      v.push([cx + ux * rx * dent, cyy + uy * ryy * dent, cz + uz * rz * dent, ux, uy, uz]);
    }
    for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEG; j++) {
      const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
      for (const q of [a, c, b, b, c, d]) {
        const w = v[q], nl = Math.hypot(w[3], w[4], w[5]) || 1;
        A.pos.push(w[0], w[1], w[2]); A.nor.push(w[3] / nl, w[4] / nl, w[5] / nl);
        if (rim) A.loc.push((w[1] - rim.y0) / rim.tall, edge, drift); else A.loc.push(40, 0, drift);
      }
    }
  } await ctx.yield(); }
}
// the chimney row's smoke: a puff's radius from the mouth to the deck, the gap between stations (metres, and a share of
// the radius there), and the beat in which a puff goes from one station to the next
export const ROPE_SMOKE = { r0: 1.5, r1: 4.6, gap: 0.6, gapR: 0.6, beat: 0.9 };
// a steamer's smoke: radius r0 at the funnel growing by r1 times (share of the trail)^pow; from apart on, its puffs
// stand apart and dwindle. THE COLUMN IS SIZED BY THE SHIP UNDER IT (SHIP_LEN, 75.4 m): r0 is the funnel's own mouth
// (2.2 m of radius), and it opens almost evenly (pow 0.85, where it was 0.7 -- a cone that flung itself open in its
// first fifth and then stood at one width, which is what read as a hard-edged tube) to 12.1 m of radius at three
// fifths of the way up, 47 m across its skin (PUFF.reach), five eighths of the ship's length, where before it came to
// 18.8 m of radius and 73 m across, as wide as the whole ship is long. Then it loses itself: dwindle
// takes seventeen twentieths of that width back over the last two fifths while gapEnd stands its last puffs apart,
// so the top breaks into separate balls and thins away instead of standing at width to the end.
export const STEAM_SMOKE = { r0: 2.8, r1: 14, pow: 0.85, apart: 0.6, dwindle: 0.85, gap: 0.8, gapR: 0.5, gapEnd: 1.4, beat: 1.6 };
export const PUFF_TONE = { coal: '.055, .045, .038', grey: '.4, .37, .34', pale: 0.75, farPale: 1.05, thinFrom: 0.6 };
// the bounds of a puff about its station: its size against the station's radius, how far its skin's lumps stand in and
// out, and how far off the line it may ride (a share of its radius, each way along x, y and z). A puff's furthest skin
// from its line is therefore the station's radius times PUFF.reach, whatever the clock says.
export const PUFF = { size0: 0.6, size1: 1.4, lump0: 0.8, lump1: 1.12, off: 0.3 };
PUFF.reach = PUFF.size1 * (PUFF.lump1 + PUFF.off * Math.sqrt(3) / 2);
// a train of puffs along a line of points: stations are laid from the mouth on, each a gap beyond the last; every
// station carries its radius and the next one's, so a puff grows on its way. The first station's radius is nothing (a puff
// is born in the mouth) and so is the last one's (it has thinned away, or gone into the cloud).
function puffsInto(S, pts, radiusAt, gapAt, kind, beat, lineNo, rings, segs) {
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = cum[cum.length - 1], at = (s, out) => {
    let i = 1; while (i < pts.length - 1 && cum[i] < s) i++;
    return out.lerpVectors(pts[i - 1], pts[i], clamp((s - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-6), 0, 1));
  };
  const st = []; for (let s = 0; s < total; s += gapAt(s / total)) st.push(s);
  st.push(total);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < st.length - 1; i++) {
    const k0 = st[i] / total, k1 = st[i + 1] / total;
    const r0 = i === 0 ? 0 : radiusAt(k0), r1 = i === st.length - 2 ? 0 : radiusAt(k1);
    at(st[i], a); at(st[i + 1], b);
    const base = S.pos.length / 3;
    for (let u = 0; u <= rings; u++) for (let w = 0; w <= segs; w++) {
      const ph = -Math.PI / 2 + Math.PI * u / rings, th = Math.PI * 2 * w / segs;
      S.pos.push(a.x, a.y, a.z); S.next.push(b.x, b.y, b.z);
      S.dir.push(Math.cos(ph) * Math.cos(th), Math.sin(ph), Math.cos(ph) * Math.sin(th));
      S.puff.push(r0, r1, i, lineNo); S.age.push(k0, k1, kind, beat);
    }
    for (let u = 0; u < rings; u++) for (let w = 0; w < segs; w++) {
      const p = base + u * (segs + 1) + w, q = p + 1, r = p + segs + 1, t = r + 1;
      if (u > 0) S.idx.push(p, r, q); if (u < rings - 1) S.idx.push(q, r, t);
    }
  }
  return st.length - 1;
}
// smoke as a train of billows: round puffs that leave a mouth small, dark and close together, and travel along the line
// the law laid for them, growing, rolling and paling. They are drawn as ONE BODY: the column they make has a side to the
// sun and a side in its own shade, and its billows are the column's, not each puff's (see the drawing below).
// A puff's place is a closed formula of the clock: the line carries stations, and every puff goes from its station to the
// next in one beat; the puff that reaches a station is the puff that station hands on, so the train never jumps.
// tone: PUFF_TONE (how dark the smoke is born and how pale it ends)
function makePuffMaterial(air, tone) {
  return new THREE.ShaderMaterial({
    uniforms: { ...air },
    vertexShader: /* glsl */`attribute vec3 aNext; attribute vec3 aDir; attribute vec4 aPuff; attribute vec4 aAge;
      varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vA; varying vec3 vC; varying vec3 vQ; uniform float uTime;
      float h11(float x) { return fract(sin(x * 127.1 + 3.7) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
                   mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
      void main() {
        // aPuff: radius here, radius at the next station, the station's number, the line's own number
        // aAge: how far along its line this station is (0 the mouth .. 1 the end), the same for the next, the fire's kind, the beat in seconds
        float ph = uTime / max(aAge.w, .05) + h11(aPuff.w) * 7.;
        float f = fract(ph), id = aPuff.z - floor(ph) + aPuff.w * 131.;
        vec3 hs = vec3(h11(id), h11(id + 17.3), h11(id + 41.9));
        float age = mix(aAge.x, aAge.y, f);
        float R = mix(aPuff.x, aPuff.y, f) * (${PUFF.size0.toFixed(2)} + ${(PUFF.size1 - PUFF.size0).toFixed(2)} * hs.x);
        // each puff rides a little off the line, its own way, so the train's edge is never a ruled line
        vec3 c = mix(position, aNext, f) + (hs - .5) * (R * ${PUFF.off.toFixed(2)} * smoothstep(0., .08, age));
        // its skin stands in and out in lumps that roll slowly round it
        vec3 roll = vec3(0., uTime * .13, 0.) + id * 3.31;
        float lump = ${PUFF.lump0.toFixed(2)} + ${(PUFF.lump1 - PUFF.lump0).toFixed(2)} * vn3(aDir * 1.7 + roll);
        vec3 w = c + aDir * (R * lump);
        vW = w; vN = aDir; vL = aDir * lump * 1.9 + roll; vA = vec3(age, aAge.z, hs.y);
        // THE COLUMN'S OWN BODY. Its axis here runs from this station to the next. vC is the way out from that axis to
        // this corner of the skin, in shares of the puff's radius: the column's own normal, the same on every puff that
        // passes. vQ is the corner's place in a field that belongs to the column and not to the puff: the way out from
        // the line in shares of the station's radius, and along the line the puff's own number and the corner's share
        // of a gap beyond it, laid off along one fixed slant; so the field travels up with the train, and two puffs
        // that touch read the same billow where their skins meet.
        // The gap that share is told in is reckoned at each station from that station's radius and share of the line
        // (the same formulas as the makers' gapAt:
        // ROPE_SMOKE's, STEAM_SMOKE's), and between two stations it goes evenly from the one to the other. So it does
        // not step when a puff passes a station, however the gaps grow or the last stretch is cut short. Between two
        // inner stations it is the gap the makers laid. On the first and the last stretch of every line it is not: the
        // station in the mouth and the one at the end carry no radius, so the gap told there is 0.60 m on a rope and
        // 0.80 m on a steamer, where the makers laid 1.50 and 2.20 at the mouth. (The axis
        // still turns at a station where the line bends, and there the field does step as a puff passes: at the
        // most .38 of the field's unit on a rope's puff, .22 on its flank, at the rope's sharpest bend of some 11
        // degrees; .17 on a steamer's. A billow of a puff's size is .59 of that unit across.)
        vec3 ax = aNext - position; ax /= max(length(ax), 1e-3);
        vec3 out0 = w - mix(position, aNext, f);
        float along = dot(out0, ax); out0 -= ax * along;
        vec2 lay = mix(vec2(${ROPE_SMOKE.gap.toFixed(2)}) + ${ROPE_SMOKE.gapR.toFixed(2)} * aPuff.xy,
          vec2(${STEAM_SMOKE.gap.toFixed(2)}) + aPuff.xy * mix(vec2(${STEAM_SMOKE.gapR.toFixed(2)}), vec2(${STEAM_SMOKE.gapEnd.toFixed(2)}), smoothstep(${(STEAM_SMOKE.apart - 0.25).toFixed(2)}, 1., aAge.xy)), step(.5, aAge.z));
        vQ = out0 * (1.1 / max(mix(aPuff.x, aPuff.y, f), .8)) + vec3(-.55, .6, -.4) * (aPuff.z - floor(ph) + along / mix(lay.x, lay.y, f)) + aPuff.w * 7.3;
        vC = out0 / max(R, 1e-3);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vA; varying vec3 vC; varying vec3 vQ; uniform float uTime;
      ${AIR_GLSL}
      float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
                   mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
      void main() {
        vec3 n = vN / max(length(vN), 1e-4);
        vec3 toEye = cameraPosition - vW; vec3 v = toEye / max(length(toEye), 1e-3);
        float age = clamp(vA.x, 0., 1.), steam = step(.5, vA.y);
        // ONE BODY: the light falls on the column, not on each ball. The skin is lit by the way out from the column's
        // own axis, with a sixth of the puff's own normal left in it; so the side to the sun and the side in shade
        // run the column's length, and a puff's crown and its under side are lit as the flank they stand on
        vec3 nc = vC / max(length(vC), .25);
        vec3 nl = mix(n, nc, .84); nl /= max(length(nl), 1e-4);
        // the billows are the column's too (vQ): broad masses that span two or three puffs, and on them the billows
        // of a puff's own size, each with a side to the sun and a side away from it
        vec3 qb = vQ * 1.7; float b0 = vn3(qb), broad = vn3(vQ * .55 + 31.);
        vec3 swell = vec3(vn3(qb + vec3(.3, 0., 0.)), vn3(qb + vec3(0., .3, 0.)), vn3(qb + vec3(0., 0., .3))) - b0;
        vec3 qc = vQ * .55 + 31.;
        vec3 heave = vec3(vn3(qc + vec3(.3, 0., 0.)), vn3(qc + vec3(0., .3, 0.)), vn3(qc + vec3(0., 0., .3))) - broad;
        vec3 nb = nl - swell * 1.8 - heave * 4.; nb /= max(length(nb), 1e-4);
        float fine = vn3(vQ * 3.9 + 9.);
        float lw = clamp(dot(nb, uSun) * .62 + .46, 0., 1.);
        float sunny = smoothstep(.24, .86, lw + (fine - .5) * .14);
        float hollow = smoothstep(.2, .65, b0 * .75 + fine * .25);
        // coal smoke: brown-black and dense where it is born, warm grey as it spreads, near white where it thins
        float pale = ${tone.pale.toFixed(2)} * mix(1., ${tone.farPale.toFixed(2)}, steam);
        float k1 = smoothstep(0., mix(.2, .34, steam), age), k2 = smoothstep(mix(.16, .3, steam), 1., age);
        vec3 body = mix(vec3(${tone.coal}), vec3(${tone.grey}), k1); body = mix(body, vec3(.9, .89, .87), k2 * pale);
        body *= .88 + .24 * broad;
        vec3 lit = body * mix(vec3(1.), uSunCol, .45) * 1.12;
        // in its own shade a puff takes the sky from above all the same: its crown is paler than its underside
        float skyward = nb.y * .5 + .5;
        vec3 shade = body * (uShade * 1.1 + .1) * mix(.82, 1., hollow) * mix(.78, 1.2, skyward) + uSkyCol * (.05 * skyward);
        vec3 c = mix(shade, lit, sunny * mix(.7, 1., hollow));
        float gl = max(dot(nb, uGlowDir), 0.); c += uGlow * gl * .3 * (1. - sunny);
        // smoke between the eye and the sun lets the light through at its thin edges
        float facing = abs(dot(n, v));
        float through = max(dot(-v, uSun), 0.); through *= through;
        c += uSunCol * mix(.25, .6, age) * through * (1. - facing) * (1. - facing);
        // the puff's edge breaks into tufts; an old puff of a steamer's column is eaten away from its edge inward
        // (the chimneys' ropes are not: steam is 0 for them)
        float grainE = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);   // (BROUGHT IN: the published hash form, see this file's head)
        float thin = smoothstep(${tone.thinFrom.toFixed(2)}, 1., age) * steam;
        float thr = mix(.4, .8, thin) + (grainE - .5) * .24;
        if (facing * (.82 + .9 * mix(b0, vn3(vL * 3.7 + 23.), .55)) < thr) discard;
        gl_FragColor = vec4(airFog(c, vW), 1.);
      }`,
  });
}
export const DECK = { x0: 110, x1: 200, y0: 355, y1: 367, z0: 425, z1: 740 };
// a second, lower floor of the same cloud lies level off the land's end, beyond the deck: its top is a house's
// height under the top rows, so from them and from the rim it is looked down on, the sea far under it
export const FLOOR = { x0: 92, x1: 206, y0: 337, y1: 353, z0: 735, z1: 905 };
export const BANK = { x0: 251, x1: 261, y0: 349, y1: 371, z0: 600, z1: 715 };
// the ovals the two level heaps are laid in, as a share of their boxes (deck, floor), and how far back, in metres,
// a pixel of the cloud's soft cut is laid in the depth buffer
const CLOUD_OVAL = { deck: 1.02, floor: 1.04, back: 80 };
// how fast the cloud's own billows pass through its heaps, along the wall: the thin bank's faster than the decks'
const CLOUD_DRIFT = 4.5, BANK_DRIFT = 7;
MAKERS.push(async (D) => {
  const { P, ctx, group, air, opts } = D;
  const A = { pos: [], nor: [], loc: [] }, B = { pos: [], nor: [], loc: [] }, lean = Math.tan(25 * Math.PI / 180) * (opts.breeze || 0);
  const mouth = new THREE.Vector3();
  // the smoke of the five chimneys and of the four steamers: trains of puffs along the lines the law lays
  const S = { pos: [], next: [], dir: [], puff: [], age: [], idx: [] }; let lineNo = 0;
  // the five chimneys' ropes: level from the mouth, turning up, ending in the level deck
  for (const c of P.chimneys) {
    // coal smoke, thick and dark as it pours from the mouth, paler as it climbs
    fold(c.s, c.z, CHIMNEY.tall - 1.2, mouth);
    const rope = riseLine(mouth.x, mouth.y, mouth.z, 150, 1.5, lean, (DECK.y0 + DECK.y1) / 2 + 2);
    const rr = (k) => lerp(ROPE_SMOKE.r0, ROPE_SMOKE.r1, Math.sqrt(k));
    puffsInto(S, rope, rr, (k) => ROPE_SMOKE.gap + ROPE_SMOKE.gapR * rr(k), 0, ROPE_SMOKE.beat, lineNo++, 5, 8);
    await ctx.yield();
  }
  // THE FOUR STEAMERS' SMOKE IS SIZED BY THE SHIP UNDER IT. A steamer's hull is 52 m in her own model and she stands at
  // STEAMER_SCALE, so she is 75.4 m from stem to stern and her funnel's mouth is 24.1 m over the water. Her plume is
  // told from that length and from nothing else: TWO AND A HALF SHIP'S LENGTHS of trail from the funnel, 189 m, where
  // it was 480 m before -- six and a third times her length, standing plumb, which is why the ship read as no source
  // at all and the smoke as a thing of its own. With the lean below, 189 m of trail stands 181 m over the water on the
  // calmest day and 144 m on the breeziest: between 1.9 and 2.4 of her lengths, and well under the rim's 374 m, so the
  // wall of town is taller than the smoke off the roads and not the other way about.
  // ONE WIND FOR THE WHOLE WORLD. The five chimneys' ropes lean by `lean` (tan 25 degrees of the day's breeze, which is
  // nothing on a calm day) and they lean along -z, down the wall. Out in the roads there is no town to break the air and
  // a funnel stands only 24 m up, so the sea's air is never quite still: a steamer answers THE SAME WIND THE SAME WAY,
  // at tan 17 degrees of standing sea drift and a fifth again of whatever the land's breeze is -- stronger than the
  // town's for the open water, never plumb and never against the chimneys' smoke. So her column leaves the funnel 17
  // degrees off the plumb on the calmest day and some 41 degrees off on the breeziest.
  const SHIP_LEN = 52 * STEAMER_SCALE;                    // 75.4 m: the steamer's own length, the measure of her smoke
  const SMOKE_TRAIL = 2.5;                                // her trail, in her own lengths
  const seaLean = Math.tan(17 * Math.PI / 180) + 1.2 * lean;
  // AND THE WIND HAS THE COLUMN TOO, not only the air it leaves in: smoke that has risen has been longer in the wind and
  // has lost the funnel's own throw, so the trail bends over as it climbs, a third of a ship's length further to leeward
  // at its top than the lean alone would carry it. A ruled slant is no truer than a plumb line.
  const SMOKE_BEND = SHIP_LEN / 3;
  for (const s of STEAMERS) {
    const k = STEAMER_SCALE, step = 2.2, steps = Math.round(SMOKE_TRAIL * SHIP_LEN / step);
    const line = riseLine(s.x + 2 * k * Math.cos(s.yaw), 16.6 * k, s.z - 2 * k * Math.sin(s.yaw), steps, step, seaLean, undefined);
    // the bend, and the wander of a plume that is not ruled: both grow with the share of the climb this point has made,
    // so both are nothing at the funnel, where the smoke still has the funnel's own throw. The wander is of the ship's
    // own place (her x and her z stand in the two phases), so no two of the four take the same path up; it is about one
    // slow swing over the whole climb, six metres each way against a column 47 m across: a wander, not a shape of its own.
    // It is laid longer and lower than the waver it replaces (6 m at .026 where that was 4.5 m at .031, 4.5 m at .019
    // where that was 3.5 m at .023), so the line turns no more sharply at a station than it did, and the bend adds less
    // than a tenth to that turn: the step the puffs' billow field takes at a station is the one the drawing above tells
    const y0 = line[0].y, climb = Math.max(line[line.length - 1].y - y0, 1e-3);
    for (const p of line) {
      const up = clamp((p.y - y0) / climb, 0, 1);
      p.z -= SMOKE_BEND * up * up;
      p.x += 6 * up * Math.sin(p.y * 0.026 + s.z); p.z += 4.5 * up * Math.sin(p.y * 0.019 + 1.3 + s.x);
    }
    // the funnel's own mouth at the bottom, five eighths of the ship's length across at its widest, and over the
    // last two fifths its puffs stand apart and dwindle, so the trail loses itself instead of being cut off
    const sr = (q) => (STEAM_SMOKE.r0 + STEAM_SMOKE.r1 * Math.pow(q, STEAM_SMOKE.pow)) * (1 - STEAM_SMOKE.dwindle * smooth(STEAM_SMOKE.apart, 1, q));
    puffsInto(S, line, sr, (q) => STEAM_SMOKE.gap + sr(q) * lerp(STEAM_SMOKE.gapR, STEAM_SMOKE.gapEnd, smooth(STEAM_SMOKE.apart - 0.25, 1, q)), 1, STEAM_SMOKE.beat, lineNo++, 4, 7);
    await ctx.yield();
  }
  await ctx.yield();
  // the level deck the five ropes end in: a floor of broad lumps and a second, smaller heap riding on it
  const crng = ctx.rng.fork('cloud');
  // its outline from below is a long ragged oval, never a slab: lumps toward the box's corners are left out
  const dcx = (DECK.x0 + DECK.x1) / 2, dcz = (DECK.z0 + DECK.z1) / 2, dhx = (DECK.x1 - DECK.x0) / 2, dhz = (DECK.z1 - DECK.z0) / 2;
  const ovalOf = (box, grow) => (x, y, z) => ((x - (box.x0 + box.x1) / 2) / ((box.x1 - box.x0) / 2 * grow)) ** 2 + ((z - (box.z0 + box.z1) / 2) / ((box.z1 - box.z0) / 2 * grow)) ** 2 < 1 + 0.3 * ctx.noise.n2(x * 0.03 + 7, z * 0.03);
  const oval = (grow) => ovalOf(DECK, grow);
  // how far out toward a heap's edge a place is: 0 at the heart, 1 at the edge of the oval
  const rimOf = (box, grow, whole = box) => ({ y0: whole.y0, tall: whole.y1 - whole.y0, of: (x, z) => Math.sqrt(((x - (box.x0 + box.x1) / 2) / ((box.x1 - box.x0) / 2 * grow)) ** 2 + ((z - (box.z0 + box.z1) / 2) / ((box.z1 - box.z0) / 2 * grow)) ** 2) });
  await heapInto(B, ctx, crng, DECK, { x: 17, y: 6, z: 19 }, CLOUD_DRIFT, oval(CLOUD_OVAL.deck), rimOf(DECK, CLOUD_OVAL.deck));
  await ctx.yield();
  await heapInto(B, ctx, crng, { ...DECK, x0: DECK.x0 + 8, x1: DECK.x1 - 8, y0: DECK.y0 + 3 }, { x: 11, y: 4.5, z: 12 }, CLOUD_DRIFT, oval(0.78), rimOf(DECK, 0.78, DECK));
  await ctx.yield();
  // the bank of the same cloud lying on the wall among the upper terraces, whose roofs poke out of it sideways;
  // it keeps off the railway's open yard, so the viaduct stands clear in front of it
  // it is thin: soft at its edges, the roofs and chimneys showing through its rim
  const bankAt = A.loc.length / 3;
  await heapInto(A, ctx, crng, BANK, { x: 4.5, y: 6.5, z: 9 }, 2, (x, y, z) => !keptClear(P, yToS(y), z));
  for (let i = bankAt; i < A.loc.length / 3; i++) { A.loc[i * 3] = 400; A.loc[i * 3 + 1] = 0.15; A.loc[i * 3 + 2] = BANK_DRIFT; }
  // the lower floor off the land's end, dealt from a stream of its own: broad lumps and a smaller heap riding on them
  const frng = ctx.rng.fork('cloud floor');
  await heapInto(B, ctx, frng, FLOOR, { x: 20, y: 6.5, z: 22 }, CLOUD_DRIFT, ovalOf(FLOOR, CLOUD_OVAL.floor), rimOf(FLOOR, CLOUD_OVAL.floor));
  await heapInto(B, ctx, frng, { ...FLOOR, x0: FLOOR.x0 + 10, x1: FLOOR.x1 - 10, y0: FLOOR.y0 + 5 }, { x: 12, y: 4.5, z: 13 }, CLOUD_DRIFT, ovalOf(FLOOR, 0.8), rimOf(FLOOR, 0.8, FLOOR));
  // the cloud is drawn first and keeps its depth, so the wall's thin bank is seen against it where it lies in front and is hidden behind it
  const mats = [makeSmokeMaterial(air, true), makeSmokeMaterial(air, false)];
  for (const [i, S] of [[0, B], [1, A]]) {
    await ctx.yield();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(S.nor, 3));
    geo.setAttribute('aLocal', new THREE.Float32BufferAttribute(S.loc, 3));
    const mesh = new THREE.Mesh(geo, mats[i]); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 3 + i * 2;
    group.add(mesh);
  }
  // the smoke's puffs are solid and keep their depth: a near puff hides a far one, and the cloud hides what has gone into it
  {
    await ctx.yield();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3)); geo.setAttribute('aNext', new THREE.Float32BufferAttribute(S.next, 3));
    geo.setAttribute('aDir', new THREE.Float32BufferAttribute(S.dir, 3)); geo.setAttribute('aPuff', new THREE.Float32BufferAttribute(S.puff, 4));
    geo.setAttribute('aAge', new THREE.Float32BufferAttribute(S.age, 4)); geo.setIndex(S.idx);
    const mesh = new THREE.Mesh(geo, makePuffMaterial(air, PUFF_TONE)); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }
});

// ---------- the fountain's jets and the rare day's toy balloons: round sprites placed by the clock ----------
// soft: false a hard round (a toy balloon), true a drop of water, 2 a puff of steam that thins to nothing at its edge
function makeDotMaterial(air, soft) {
  return new THREE.ShaderMaterial({
    uniforms: { ...air, uPx: { value: 450 } },
    vertexShader: /* glsl */`attribute vec3 aCol; attribute float aSize; varying vec3 vC; varying vec3 vW; uniform float uPx;
      void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vC = aCol; vec4 p = projectionMatrix * viewMatrix * w;
        gl_Position = p; gl_PointSize = clamp(aSize * projectionMatrix[1][1] * uPx * .5 / max(p.w, .1), 1.5, 400.); }`,
    fragmentShader: /* glsl */`varying vec3 vC; varying vec3 vW;
      ${AIR_GLSL}
      void main() { vec2 d = gl_PointCoord * 2. - 1.; float r2 = dot(d, d); if (r2 > 1.) discard;
        vec3 n = vec3(d.x, -d.y, sqrt(max(1. - r2, 0.)));
        float l = .55 + .45 * max(dot(n, vec3(-.5, .6, .6)), 0.);
        vec3 c = vC * l * (uSunCol * .8 + .35) * mix(.7, 1., slabShadow(vW));
        gl_FragColor = vec4(airFog(c, vW), ${soft === 2 ? '.8 * (1. - r2) * (1. - r2 * .4)' : soft ? '.75 * (1. - r2 * .6)' : '1.'}); }`,
    transparent: !!soft, depthWrite: !soft,
  });
}
export const JET = { n: 6, rise: 12, period: 2.4, drops: 1500, basin: 8.4, land: 6.6 };
// a drop's flight in the fountain's own axes, t from 0 at the nozzle to 1 at the water: metres out from the stem,
// and metres above the square (the nozzle at 2.2, the top 12 m and a little over the bowl, the water at 0.9)
const jetOut = (t) => 1 + (JET.land - 1) * t;
const jetRise = (t) => 2.2 + 46 * t * (1 - t) - 1.3 * t;
MAKERS.push(async (D) => {
  const { P, ctx, group, air, opts } = D;
  // six jets: each drop flies a parabola in the wall's own axes, up from the basin 12 m and back into it
  const nDrops = Math.round(JET.drops * clamp(opts.detail || 1, 0.5, 1)), pos = new Float32Array(nDrops * 3), col = new Float32Array(nDrops * 3), size = new Float32Array(nDrops);
  const rng = ctx.rng.fork('jets'), ph = new Float32Array(nDrops), jit = new Float32Array(nDrops * 2);
  for (let i = 0; i < nDrops; i++) {
    ph[i] = rng(); jit[i * 2] = rng.range(-0.5, 0.5); jit[i * 2 + 1] = rng.range(-0.5, 0.5); size[i] = rng.range(0.22, 0.5);
    const w = rng.range(0.8, 1); col[i * 3] = 0.72 * w; col[i * 3 + 1] = 0.88 * w; col[i * 3 + 2] = 1.0 * w;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const jetMat = makeDotMaterial(air, true);
  const jets = new THREE.Points(geo, jetMat); jets.frustumCulled = false; jets.matrixAutoUpdate = false; jets.renderOrder = 6; group.add(jets);
  const fb = basisAt(P.fountain.s, {});
  await ctx.yield();
  // the rare day: sixty toy balloons let go along the square's upper edge. Their road is the law's own line:
  // level out from the wall, turning skyward between 60 and 90 m out.
  const TOY = { bunch: 12, size: 5.2 };
  const nToy = 60, tPos = new Float32Array(nToy * 3), tCol = new Float32Array(nToy * 3), tSize = new Float32Array(nToy);
  const toyTones = [TONE.enamel, TONE.brick, TONE.plaster, TONE.sea, TONE.white];
  const trng = ctx.rng.fork('toys'), toy = [];
  const start = fold(P.square.s1 - 1, (P.square.z0 + P.square.z1) / 2, 2, new THREE.Vector3());
  const road = riseLine(start.x, start.y, start.z, 150, 2, 0, undefined); D.toyRoad = road;
  for (let i = 0; i < nToy; i++) {
    const c = toyTones[i % toyTones.length]; tCol[i * 3] = c.r; tCol[i * 3 + 1] = c.g; tCol[i * 3 + 2] = c.b; tSize[i] = TOY.size;
    // they are let go a bunch at a time, so each bunch climbs its road together
    toy.push({ ph: Math.floor(i / TOY.bunch) * TOY.bunch / nToy + (i % TOY.bunch) * 0.0035 + trng.range(-0.006, 0.006), oz: trng.range(-22, 22), ox: trng.range(-2.5, 2.5), oy: trng.range(-2.5, 2.5), wob: trng() * 6.283 });
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); tGeo.setAttribute('aCol', new THREE.BufferAttribute(tCol, 3)); tGeo.setAttribute('aSize', new THREE.BufferAttribute(tSize, 1));
  const toyMat = makeDotMaterial(air, false);
  const toys = new THREE.Points(tGeo, toyMat); toys.frustumCulled = false; toys.matrixAutoUpdate = false; group.add(toys);
  toys.visible = !!opts.rare;
  // the engine's steam: puffs let go at the funnel one after another, each rising along the engine's own up
  // (out from the wall) from where the funnel was when it left
  const nPuff = STEAM.n, sPos = new Float32Array(nPuff * 3), sCol = new Float32Array(nPuff * 3).fill(0.95), sSize = new Float32Array(nPuff);
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('aCol', new THREE.BufferAttribute(sCol, 3)); sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  const steamMat = makeDotMaterial(air, 2);
  const steam = new THREE.Points(sGeo, steamMat); steam.frustumCulled = false; steam.matrixAutoUpdate = false; steam.renderOrder = 6; group.add(steam);
  const vl = viaductLine(P), sv = new THREE.Vector3(), sd = new THREE.Vector3();
  const sz = new THREE.Vector2(), TAU = Math.PI * 2;
  D.tick.push((time) => {
    ctx.renderer.getDrawingBufferSize(sz); jetMat.uniforms.uPx.value = sz.y; toyMat.uniforms.uPx.value = sz.y; steamMat.uniforms.uPx.value = sz.y;
    for (let i = 0; i < nPuff; i++) {
      const age = (((time - i * STEAM.every) % (nPuff * STEAM.every)) + nPuff * STEAM.every) % (nPuff * STEAM.every), born = time - age;
      const d = trainAt(born, vl.len) + 3.2;
      fold(P.viaduct.s0 + d * vl.ds, P.viaduct.z0 + d * vl.dz, P.viaduct.h + 5, sv);
      // it rises by the law of two downs: straight out from the wall at first, turning skyward further out
      for (let left = STEAM.rise * age; left > 0; left -= 1.5) { downAt(sv.x, sv.y, sv.z, sd); sv.addScaledVector(sd, -Math.min(1.5, left)); }
      sPos[i * 3] = sv.x; sPos[i * 3 + 1] = sv.y + 0.5 * Math.sin(i * 2.7 + age); sPos[i * 3 + 2] = sv.z + 0.6 * Math.sin(i * 1.9 + age * 1.3);
      sSize[i] = (2.2 + 1.05 * age) * Math.min(1, (nPuff * STEAM.every - age) * 0.5);
    }
    sGeo.attributes.position.needsUpdate = true; sGeo.attributes.aSize.needsUpdate = true;
    for (let i = 0; i < nDrops; i++) {
      const t = (time / JET.period + ph[i]) % 1, k = i % JET.n, an = k / JET.n * TAU;
      const h = jetRise(t), out = jetOut(t);
      const ls = Math.cos(an) * out + jit[i * 2] * t, lz = Math.sin(an) * out + jit[i * 2 + 1] * t;
      const s = P.fountain.s + ls;
      pos[i * 3] = fb.gx + (s - P.fountain.s) * fb.ax + h * fb.ux; pos[i * 3 + 1] = fb.gy + (s - P.fountain.s) * fb.ay + h * fb.uy; pos[i * 3 + 2] = P.fountain.z + lz;
    }
    geo.attributes.position.needsUpdate = true;
    if (opts.rare) {
      const last = road.length - 1;
      for (let i = 0; i < nToy; i++) {
        const b = toy[i], f = ((((time / 40 + b.ph) % 1) + 1) % 1) * last, i0 = Math.min(Math.floor(f), last - 1), fr = f - i0, a = road[i0], c = road[i0 + 1];
        const spread = Math.min(1, f / 12);
        tPos[i * 3] = lerp(a.x, c.x, fr) + b.ox * spread; tPos[i * 3 + 1] = lerp(a.y, c.y, fr) + b.oy * spread + 0.4 * Math.sin(time * TAU / 5 + b.wob);
        tPos[i * 3 + 2] = lerp(a.z, c.z, fr) + b.oz;
        // a balloon swells as it is let go at the kerb and dwindles to nothing as it is lost to sight far up its road
        tSize[i] = TOY.size * Math.min(1, f / 4) * Math.min(1, (last - f) / 12);
      }
      tGeo.attributes.position.needsUpdate = true; tGeo.attributes.aSize.needsUpdate = true;
    }
  });
});

// ---------- birds: closed curves of their own inside boxes that stand off the flown line ----------
// Pigeons wheel about the lying steeple; each keeps its back along -downAt where it is, so the flock banks
// through the turn of the pull. Gulls keep to the harbour, beyond the land's pull, on level wings.
export const PIGEON_BOX = { x0: 150, x1: 215, y0: 55, y1: 95, z0: -15, z1: 65 };
// two more companies wheel off the wall higher up, between the lake and the viaduct, on the seaward side of the line
export const WALL_BOXES = [{ x0: 150, x1: 212, y0: 252, y1: 300, z0: 430, z1: 492 }, { x0: 150, x1: 204, y0: 326, y1: 350, z0: 572, z1: 692 }];
// and one company keeps to the lying clock tower, in the narrow air between the top rows and the cloud
export const CLOCK_BOX = { x0: 198, x1: 219, y0: 318, y1: 366, z0: 688, z1: 742 };
export const GULL_BOX = { x0: -260, x1: -40, y0: 14, y1: 80, z0: -250, z1: 560 };
// two companies of gulls keep to the air beside the rim: one out over the drop, one over the sea behind the slab
export const RIM_BOXES = [{ x0: 150, x1: 220, y0: 358, y1: 384, z0: 775, z1: 860 }, { x0: 294, x1: 352, y0: 380, y1: 420, z0: 720, z1: 856 }];
function birdModel(g, span, col, wingCol) {
  const L = span * 0.42;
  g.tri([L * 0.5, 0, 0], [-L * 0.5, 0.12 * span, 0], [-L * 0.2, 0, 0.1 * span], col, 0);
  g.tri([L * 0.5, 0, 0], [-L * 0.2, 0, -0.1 * span], [-L * 0.5, 0.12 * span, 0], col, 0);
  g.tri([L * 0.5, 0, 0], [-L * 0.2, 0, 0.1 * span], [-L * 0.2, 0, -0.1 * span], col, 0);
  g.tri([L * 0.25, 0.02, 0.05 * span], [-L * 0.3, 0.02, 0.05 * span], [-L * 0.1, 0.02, span / 2], wingCol, 8);
  g.tri([L * 0.25, 0.02, -0.05 * span], [-L * 0.1, 0.02, -span / 2], [-L * 0.3, 0.02, -0.05 * span], wingCol, 8);
  g.tri([-L * 0.5, 0.05, 0], [-L * 0.85, 0.05, 0.08 * span], [-L * 0.85, 0.05, -0.08 * span], col, 0);
}
function dealLoops(rng, n, box, rMin, rMax, flock) {
  const out = [];
  let gc = null;
  for (let i = 0; i < n; i++) {
    if (i % flock === 0) {
      // a new company: one round shared by its birds, wholly inside the box with 3 m to spare for each bird's own offset
      const a = rng.range(rMin, Math.min(rMax, (box.x1 - box.x0) / 2 - 4)), c = rng.range(rMin, Math.min(rMax, (box.z1 - box.z0) / 2 - 4)), b = rng.range(2, Math.min(12, (box.y1 - box.y0) / 2 - 4));
      gc = { a, b, c, cx: rng.range(box.x0 + a + 3, box.x1 - a - 3), cy: rng.range(box.y0 + b + 3, box.y1 - b - 3), cz: rng.range(box.z0 + c + 3, box.z1 - c - 3),
        per: rng.range(15, 24) * (a + c) / 50, ph: rng() * 6.283, tilt: rng() * 6.283, dir: rng.sign() };
    }
    out.push({ g: gc, lag: rng.range(0, 0.5), ox: rng.range(-3, 3), oy: rng.range(-3, 3), oz: rng.range(-3, 3) });
  }
  return out;
}
const TAU = Math.PI * 2;
function loopAt(b, time, out) {
  const g = b.g, th = g.dir * (time * TAU / Math.max(g.per, 6)) + g.ph - b.lag;
  return out.set(g.cx + g.a * Math.cos(th) + b.ox, g.cy + g.b * Math.sin(th + g.tilt) + b.oy, g.cz + g.c * Math.sin(th) + b.oz);
}
MAKERS.push(async (D) => {
  const { ctx, group, town, opts } = D;
  const k = (opts.detail || 1) * clamp(opts.density || 1, 0.8, 1.2);
  const nS = Math.round(60 * k), nWall = Math.round(20 * k), nClock = Math.round(36 * k), nP = nS + 2 * nWall + nClock, nH = Math.round(40 * k), nR = Math.round(22 * k), nG = nH + 2 * nR;
  let g = new Geo(); birdModel(g, 1.7, new THREE.Color('#6E7682'), new THREE.Color('#A9B0BA'));
  const pigeons = new THREE.InstancedMesh(g.build(), town, nP);
  g = new Geo(); birdModel(g, 2.6, TONE.white, new THREE.Color('#DDE3E8'));
  const gulls = new THREE.InstancedMesh(g.build(), town, nG);
  for (const mesh of [pigeons, gulls]) { mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; group.add(mesh); }
  const pl = dealLoops(ctx.rng.fork('pigeons'), nS, PIGEON_BOX, 14, 28, 10);
  WALL_BOXES.forEach((box, i) => { for (const b of dealLoops(ctx.rng.fork('wall pigeons ' + i), nWall, box, 12, 26, 10)) pl.push(b); });
  for (const b of dealLoops(ctx.rng.fork('clock pigeons'), nClock, CLOCK_BOX, 4.5, 6.5, 8)) pl.push(b);
  const gl = dealLoops(ctx.rng.fork('gulls'), nH, GULL_BOX, 18, 60, 5);
  RIM_BOXES.forEach((box, i) => { for (const b of dealLoops(ctx.rng.fork('rim gulls ' + i), nR, box, 12, 26, 4)) gl.push(b); });
  await ctx.yield();
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), f = new THREE.Vector3(), up = new THREE.Vector3(), rt = new THREE.Vector3(), dn = new THREE.Vector3(), m = new THREE.Matrix4();
  const place = (mesh, i, b, time, level) => {
    loopAt(b, time, p); loopAt(b, time + 0.05, p2);
    f.subVectors(p2, p); if (f.lengthSq() < 1e-10) f.set(1, 0, 0); f.normalize();
    if (level) up.set(0, 1, 0); else { downAt(p.x, p.y, p.z, dn); up.copy(dn).multiplyScalar(-1); }
    rt.crossVectors(f, up); if (rt.lengthSq() < 1e-8) rt.set(0, 0, 1); rt.normalize(); up.crossVectors(rt, f);
    m.makeBasis(f, up, rt).setPosition(p);
    mesh.setMatrixAt(i, m);
  };
  D.tick.push((time) => {
    for (let i = 0; i < nP; i++) place(pigeons, i, pl[i], time, false);
    for (let i = 0; i < nG; i++) place(gulls, i, gl[i], time, i < nH);
    pigeons.instanceMatrix.needsUpdate = true; gulls.instanceMatrix.needsUpdate = true;
  });
});

// ---------- small life on every terrace: chimney wisps and washing, each along its own house's up ----------
MAKERS.push(async (D) => {
  const { ctx, group, town, air, opts, P } = D;
  const k = (opts.detail || 1) * (opts.density || 1);
  const rng = ctx.rng.fork('small');
  const pool = D.houses.all.filter((h) => h.near);
  const nW = Math.min(pool.length, Math.round(700 * k)), nL = Math.min(pool.length, Math.round(400 * k));
  const picks = rng.shuffle(pool.slice());
  // a wisp: two crossed blades 9 m long standing on the pot
  const wp = [], wl = [];
  for (const [ax, az] of [[1, 0], [0, 1]]) {
    for (let j = 0; j < 4; j++) {
      const y0 = j * 2.25, y1 = y0 + 2.25, w0 = 0.4 + 0.36 * j, w1 = 0.4 + 0.36 * (j + 1);
      const q = [[-w0 * ax, y0, -w0 * az], [w0 * ax, y0, w0 * az], [w1 * ax, y1, w1 * az], [-w1 * ax, y1, -w1 * az]];
      for (const i of [0, 1, 2, 0, 2, 3]) { wp.push(...q[i]); wl.push((i === 1 || i === 2) ? 1 : -1, q[i][1], 0); }
    }
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wGeo.setAttribute('aLocal', new THREE.Float32BufferAttribute(wl, 3));
  const wMat = new THREE.ShaderMaterial({
    uniforms: { ...air },
    // vT: the way across this blade, in the world: the flank of the smoke turned that way is the one the sun may light
    vertexShader: /* glsl */`attribute vec3 aLocal; varying vec3 vL; varying vec3 vW; varying vec3 vT; varying float vId; uniform float uTime;
      void main() { vec3 p = position; float id = float(gl_InstanceID); vId = id;
        float k = aLocal.y / 9.; p.x += sin(uTime * 1.3 + id * 1.3 + aLocal.y * .5) * 1.3 * k * k; p.z += cos(uTime * 1.1 + id * 2.1 + aLocal.y * .4) * 1.3 * k * k;
        vec3 across = mat3(modelMatrix * instanceMatrix) * (abs(position.x) > abs(position.z) ? vec3(1., 0., 0.) : vec3(0., 0., 1.));
        vT = across / max(length(across), 1e-6);
        vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.); vW = w.xyz; vL = aLocal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    // The blade is only the room the smoke has. In it the smoke is a body that leaves the pot dense and plumb, curls from
    // side to side as it climbs and is torn thin toward the tip: its own line wanders across the blade, two scales of
    // billow are carried up it with a sideways curl, and it is cut soft where it thins. One flank is lit and the other in
    // its own shade, by the sun's side of the blade alone. Each scale of billow fades to its own mean as the pixel's
    // footprint on the blade outgrows it, and so does the whole plume across its blade as the blade grows narrow on the
    // screen (the fade begins at a blade about 8 pixels wide and is whole at 2). A wisp has one strength at every
    // distance from the lens.
    fragmentShader: /* glsl */`varying vec3 vL; varying vec3 vW; varying vec3 vT; varying float vId; uniform float uTime;
      ${AIR_GLSL}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }   // (BROUGHT IN: the published hash form, see this file's head)
      float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
      void main() {
        // metres of the model: y up the blade, wide its half width there, px the pixel's footprint on it
        float y = vL.y, k = clamp(y / 9., 0., 1.), wide = .4 + .16 * y;
        float px = max(fwidth(vL.x * wide), fwidth(y));
        // the smoke's own line: plumb in the pot, swinging wider the higher it is, the swing travelling up with the smoke
        float cu = (sin(y * 1.05 - uTime * 2.1 + vId * 2.7) * .22 + sin(y * 2.3 - uTime * 3.1 + vId * 5.1) * .08) * smoothstep(.03, .6, k);
        float d = (vL.x - cu) / .6;
        // the billows ride up with it, a broad scale and a fine one, their rows bent sideways
        vec2 p = vec2((vL.x - cu) * wide, y - uTime * 2.2);
        p.x += sin(p.y * 1.3 + vId) * .6 * k;
        vec2 p1 = p * vec2(.7, .38) + vId * 3.7;
        float n0 = vnoise(p1), n1 = n0, n2 = vnoise(p * vec2(2., 1.1) + vec2(17. + vId, uTime * .4));
        float f1 = smoothstep(.4, 1.2, px / 1.4), f2 = smoothstep(.4, 1.2, px / .5);
        n1 = mix(n1, .5, f1); n2 = mix(n2, .5, f2);
        float nn = n1 * .65 + n2 * .35;
        // dense at the pot, torn at the tip: the body thins and the billows bite deeper the higher it is
        float dens = (1. - d * d) * mix(1.25, .7, k) + (nn - .5) * mix(.5, 2.6, sqrt(k)) * mix(.3 + .7 * min(d * d, 1.), 1., k * k);
        float thr = mix(.25, .45, k), soft = mix(.18, .34, k);
        // it is thin air: whole only in its heart, thinner toward the cut (less so near the pot, where it is densest),
        // and streaked by the fine billows
        float a = smoothstep(thr - soft, thr + soft, dens) * mix(mix(.55, .3, k), 1., smoothstep(0., mix(.5, .9, k), dens - thr)) * (mix(.75, .6, k) + .8 * (n2 - .5) + .5 * (n1 - .5));
        // a blade seen on edge, or small on the screen, is too narrow to carry the plume's shape: the plume fades to
        // its own mean across the blade (reckoned from these same lines: .385 at the pot, .14 at the tip). The blade
        // is two of vL.x wide, so one over its width in pixels is half of vL.x's change from pixel to pixel: the
        // fade begins at .12 of that (a blade about 8 pixels wide) and is whole at .5 (2 pixels wide)
        float whole = smoothstep(.12, .5, fwidth(vL.x) * .5);
        a = mix(clamp(a, 0., 1.), mix(.385, .14, k), whole);
        a *= smoothstep(0., .05, k) * (1. - smoothstep(.72, 1., k)) * mix(.92, .42, smoothstep(.1, .75, k));
        // the flank turned to the sun is lit, the other lies in the smoke's own shade; each billow has its own two sides
        float slope = (vnoise(p1 + vec2(.3, 0.)) - n0) * (1. - f1);
        float lw = mix(clamp(.5 + (clamp(d, -1., 1.) * .9 - slope * 3.) * clamp(dot(vT, uSun) * 1.6, -1., 1.), 0., 1.), .5, whole);
        vec3 tone = mix(vec3(.6, .59, .58), vec3(.97), smoothstep(0., .4, k));
        vec3 c = tone * mix(uShade * 1.15 + .08, uSunCol * .5 + .5, lw * mix(.35, 1., slabShadow(vW)));
        gl_FragColor = vec4(airFog(c, vW), clamp(a, 0., 1.));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const wisps = new THREE.InstancedMesh(wGeo, wMat, Math.max(nW, 1));
  wisps.frustumCulled = false; wisps.matrixAutoUpdate = false; wisps.renderOrder = 4; group.add(wisps);
  // a washing line: two posts, a cord across the lane behind the house, five cloths hanging along the house's down
  const g = new Geo(), cloths = [TONE.white, TONE.plaster, TONE.sea.clone().lerp(TONE.white, 0.4), TONE.enamel, TONE.white, TONE.brick.clone().lerp(TONE.white, 0.5)];
  g.box(0, 0, -3.6, 0.26, 4.7, 0.26, TONE.post, 0, { top: false }); g.box(0, 0, 3.6, 0.26, 4.7, 0.26, TONE.post, 0, { top: false });
  g.box(0, 4.4, 0, 0.08, 0.08, 7.2, TONE.white, 0, { top: false });
  for (let j = 0; j < 5; j++) {
    const z0 = -3.1 + j * 1.3, z1 = z0 + 1.0, y1 = 4.4, y0 = 4.4 - (1.0 + 0.5 * ((j * 7) % 3) / 2);
    g.quad([0, y1, z0], [0, y1, z1], [0, y0, z1], [0, y0, z0], cloths[(j * 5 + 1) % cloths.length], 7);
  }
  const lines = new THREE.InstancedMesh(g.build(), town, Math.max(nL, 1));
  lines.frustumCulled = false; lines.matrixAutoUpdate = false; group.add(lines);
  await ctx.yield();
  const m = new THREE.Matrix4(), tip = new THREE.Vector3();
  // a pot whose wisp, at the furthest of its sway, would come within two metres of the flown line burns lower:
  // its plume is the same plume made smaller, the largest of five sizes that keeps that air, and if none does
  // no fire is lit under it. The plume's reach about its own axis is its half width and its sway at that height.
  const WISP_SIZES = [1, 0.8, 0.62, 0.46, 0.32];
  // WHICH POTS ARE ALIGHT, AND HOW BIG EACH PLUME IS: BY PLACE. A fire in every house of every terrace made the town a
  // pincushion -- one plume a house, all of a height, all of a width, all on the same beat. A town at any hour has a
  // fire going in some houses and none in most. Which house has one is told here BY ITS PLACE ALONE: its row and its
  // plot, the house's own two numbers in the town's plan, run through the kit's own hash of a name. The seed is not in
  // that name, so the lit pots are the same on every seed, at every hour and from every distance, as a roof's re-laying
  // is; no draw, no count and no clock come into it. POT.lit of the houses keep a fire in, and the same hash gives each
  // pot its own size (POT.small to 1, leaning to the small end, so most are low and a few draw well), which is why no
  // two neighbours now send up the same plume. That size is the plume's whole size: the ladder below still takes it
  // down as far as it must to keep its air clear of the flown line, and a place that no size clears lights no fire.
  const POT = { lit: 0.3, small: 0.52 };
  const potOf = (h) => {
    const row = Math.round((h.s - ROW0) / ROW_STEP), plot = Math.round((h.z - PLAN.z0) / STREET.plot - 0.5);
    // two numbers out of the one hash: its low half says whether a fire is in, its high half how big that fire's plume is
    const hp = ctx.core.hashSeed('pot:' + row + ':' + plot);
    if ((hp & 0xffff) / 65536 >= POT.lit) return 0;
    const r = (hp >>> 16) / 65536;
    return POT.small + (1 - POT.small) * r * r;
  };
  const wispClear = (s, z, base, size) => {
    for (let y0 = 0; y0 <= 9; y0 += 1.5) {
      const y = y0 * size;
      fold(s, z, base + y, tip);
      const k = y0 / 9, reach = (0.4 + 0.16 * y0 + 1.3 * 1.42 * k * k) * size;
      // the line is known by its points every few metres: half that spacing is allowed for
      if (D.path.distanceTo(tip.x, tip.y, tip.z) < Math.hypot(reach + 2.0, D.path.length / 640)) return false;
    }
    return true;
  };
  let lit = 0;
  // every near house is asked, in the shuffled list's own order, and its place answers; no more wisps stand than the
  // mesh is made for, which at every level of detail is more than the lit places ever come to
  for (let i = 0; i < picks.length && lit < nW; i++) {
    // the pot's place in the house's own axes, turned as the house is turned
    const h = picks[i], cz = h.model % 2 ? 2.6 : -2.6, cy = Math.cos(h.yaw), sn = Math.sin(h.yaw);
    const own = potOf(h);
    if (!own) continue;                      // no fire in this house: none at any hour and on any seed
    const ps = h.s + 2.2 * cy + cz * sn, pz = h.z - 2.2 * sn + cz * cy;
    const size = WISP_SIZES.map((k) => own * k).find((k) => wispClear(ps, pz, 13.0 * h.sy, k));
    if (!size) continue;
    // a plot of a churchyard (or of one of the wall's larger things, though none of those is near) has no pot: its wisp
    // keeps its number and has no size
    if (h.yard) { wisps.setMatrixAt(lit++, m.makeScale(0, 0, 0)); continue; }
    wisps.setMatrixAt(lit++, standAt(ps, pz, 13.0 * h.sy, 0, size, m));
  }
  wisps.count = lit;
  await ctx.yield();
  // the washing is hung by the trees' maker, when the town's trees are known: no line hangs in a tree's head. Here
  // its mesh holds no line yet, and the lines' turns are told to the makers that come after, with the model's own
  // reach about its foot: half its length across the lane, half its width along the street with its washing at the
  // furthest of its stir (the town shader's own swing of a cloth), and its lowest and highest
  const washing = D.washing = { mesh: lines, candidates: [], most: 0, hung: [], half: 0, wide: 0, low: Infinity, high: -Infinity };
  for (let i = 0; i < g.p.length; i += 3) {
    const x = g.p[i], y = g.p[i + 1], z = g.p[i + 2], stir = g.k[i / 3] === 7 ? 0.42 * clamp(4.4 - y, 0, 1.6) : 0;
    washing.half = Math.max(washing.half, Math.abs(z)); washing.wide = Math.max(washing.wide, Math.abs(x) + stir);
    washing.low = Math.min(washing.low, y); washing.high = Math.max(washing.high, y);
  }
  lines.count = 0;
  // the candidates are the houses of the same shuffled list from its far end, each once, in the list's own order,
  // to the list's other end: a house whose pot is lit may hang a line too. A line stands behind its house, on the
  // back wall of its garden, down the middle of the lane its row shares with the row it backs on: up the town for
  // the even rows, down it for the odd
  for (let i = 0; i < picks.length; i++) {
    const h = picks[picks.length - 1 - i];
    const row = Math.round((h.s - ROW0) / ROW_STEP), back = row % 2 ? -1 : 1, ls = h.s + back * 9.5;
    // a row whose lane would lie over the rim has no place for a line, nor has a plot a churchyard has taken
    if (ls > S_RIM - 1 || h.yard) continue;
    // the line is centred on its house's plot, which is wider than the line: both posts stand within the plot. A
    // terrace's end house stands a metre out toward the street that goes up beside it; its line does not
    const plot = Math.round((h.z - PLAN.z0) / STREET.plot - 0.5), lz = PLAN.z0 + (plot + 0.5) * STREET.plot;
    // nor does a line stand where there is no lane: on a street, a square, a quay, a yard or a landmark's foot
    if (keptClear(P, ls, lz - 3.6) || keptClear(P, ls, lz + 3.6)) continue;
    // two houses that back on each other share the one wall, and so the one place
    washing.candidates.push({ s: ls, z: lz, place: Math.min(row, row + back) * 1000 + plot });
  }
  // no more lines hang than the mesh is made for
  washing.most = nL;
});

// ---------- the leap's spray: drops torn from the stream at the lip, each on a ballistic curve of its own ----------
// A drop leaves the lip a little faster or slower than the stream and a little to one side, so the spray widens
// about the water as it climbs and falls; its place is a closed formula of the clock, wrapped by the fall's time.
export const SPRAY = { drops: 900, dv: 1.5, side: 6.2 };
MAKERS.push(async (D) => {
  const { ctx, group, air, opts } = D;
  const n = Math.round(SPRAY.drops * clamp(opts.detail || 1, 0.5, 1));
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
  const rng = ctx.rng.fork('spray'), drops = [];
  const vx0 = LEAP.v * Math.sin(LEAP.lean), vy0 = LEAP.v * Math.cos(LEAP.lean);
  const fall = (vy0 + Math.sqrt(vy0 * vy0 + 2 * LEAP.g * LAND.rimY)) / LEAP.g;
  for (let i = 0; i < n; i++) {
    // most live only the first seconds after the lip, where the stream is whole and they fly thickest
    const early = rng() < 0.7;
    drops.push({ ph: rng(), span: early ? rng.range(2.5, 6.5) : fall, dx: rng.range(-1, 1) * SPRAY.dv, dy: rng.range(-1, 1) * SPRAY.dv, z: rng.range(-1, 1) * SPRAY.side });
    size[i] = early ? rng.range(0.35, 1.0) : rng.range(0.6, 1.6);
    const w = rng.range(0.82, 1); col[i * 3] = 0.86 * w; col[i * 3 + 1] = 0.93 * w; col[i * 3 + 2] = 1.0 * w;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = makeDotMaterial(air, true);
  const spray = new THREE.Points(geo, mat); spray.frustumCulled = false; spray.matrixAutoUpdate = false; spray.renderOrder = 6; group.add(spray);
  await ctx.yield();
  const sz = new THREE.Vector2();
  D.tick.push((time) => {
    ctx.renderer.getDrawingBufferSize(sz); mat.uniforms.uPx.value = sz.y;
    for (let i = 0; i < n; i++) {
      const d = drops[i], t = ((((time / d.span + d.ph) % 1) + 1) % 1) * d.span;
      pos[i * 3] = LAND.wallX + (vx0 + d.dx) * t;
      pos[i * 3 + 1] = LAND.rimY + (vy0 + d.dy) * t - 0.5 * LEAP.g * t * t;
      pos[i * 3 + 2] = LAND.canalZ + d.z * (1 + 0.1 * t);
    }
    geo.attributes.position.needsUpdate = true;
  });
});

// ---------- the dress of the paved places: the tram place at the bend, the wall square and its market street ----------
// Lamp standards, benches, market stalls under striped awnings, kiosks, tram shelters and strings of pennants.
// Each is rigid and stands through the fold on its own ground: upright on the floor, fanned round the bend,
// lying out level on the wall. Models are in their own axes (x along the street, y their own up, z across).
function lampModel(g) {
  const iron = TONE.iron, glass = TONE.white;
  g.box(0, 0, 0, 0.8, 0.6, 0.8, iron, 0); g.box(0, 0.6, 0, 0.3, 5.2, 0.3, iron, 0, { top: false });
  g.box(0, 5.6, 0, 0.22, 0.22, 2.4, iron, 0);
  for (const lz of [-1.05, 1.05]) { g.stem(0, 5.8, lz, 0.2, 0.5, 0.5, 6, glass, 0); g.stem(0, 6.3, lz, 0.5, 0, 0.5, 6, iron, 0); }
}
function benchModel(g) {
  g.box(0, 0.45, 0, 0.6, 0.1, 2.4, TONE.wood, 0, { bottom: true }); g.box(0.3, 0.55, 0, 0.1, 0.6, 2.4, TONE.wood, 0);
  for (const lz of [-1, 1]) g.box(0, 0, lz, 0.5, 0.45, 0.12, TONE.iron, 0, { top: false });
}
function stallModel(g, col) {
  const cream = TONE.white, post = TONE.post;
  g.box(0, 0, 0, 2.0, 1.0, 3.4, TONE.wood, 0);
  // wares on the board: crates of this and that
  const wares = [TONE.enamel, new THREE.Color('#A8322A'), new THREE.Color('#5E8F4E'), TONE.plaster];
  for (let j = 0; j < 4; j++) g.box(-0.2, 1.0, -1.2 + j * 0.8, 1.3, 0.3 + 0.1 * (j % 2), 0.62, wares[j], 0);
  for (const [px, pz, ph] of [[-1.3, -1.9, 2.5], [-1.3, 1.9, 2.5], [1.1, -1.9, 3.3], [1.1, 1.9, 3.3]]) g.box(px, 0, pz, 0.14, ph, 0.14, post, 0, { top: false });
  // the awning: stripes of colour and cream, sloping to the front, with a valance hanging from its lip
  for (let j = 0; j < 6; j++) {
    const z0 = -2.1 + j * 0.7, z1 = z0 + 0.7, c = j % 2 ? cream : col;
    g.quad([-1.6, 2.45, z0], [-1.6, 2.45, z1], [1.25, 3.35, z1], [1.25, 3.35, z0], c, 6);
    g.quad([-1.6, 2.45, z1], [-1.6, 2.45, z0], [-1.6, 2.0, z0], [-1.6, 2.0, z1], j % 2 ? col : cream, 6);
  }
}
function kioskModel(g) {
  const teal = TONE.sea.clone().lerp(TONE.dark, 0.3);
  g.stem(0, 0, 0, 1.5, 1.5, 3.1, 8, teal, 0); g.stem(0, 0.9, 0, 1.56, 1.56, 1.5, 8, TONE.plaster, 0);
  g.stem(0, 3.1, 0, 2.1, 2.1, 0.25, 8, TONE.white, 0, true); g.stem(0, 3.35, 0, 1.9, 0, 1.7, 8, TONE.slate, 2);
  g.stem(0, 4.9, 0, 0.3, 0.3, 0.5, 5, TONE.enamel, 0, true);
}
// a tram shelter, open toward the track on its -z side: a glazed back, a roof on iron posts, a bench inside
function shelterModel(g) {
  const iron = TONE.iron, glass = TONE.sky.clone().multiplyScalar(0.8);
  g.box(0, 0.5, 1.1, 8.4, 2.1, 0.12, glass, 0, { top: false }); g.box(0, 0, 1.1, 8.6, 0.5, 0.2, TONE.enamel, 0);
  for (const px of [-4.2, 0, 4.2]) { g.box(px, 0, 1.1, 0.16, 2.7, 0.16, iron, 0, { top: false }); g.box(px, 0, -1.0, 0.16, 2.7, 0.16, iron, 0, { top: false }); }
  g.box(0, 2.7, 0, 9.2, 0.18, 2.9, TONE.enamel.clone().lerp(TONE.white, 0.2), 0, { bottom: true });
  g.box(0, 0.45, 0.7, 6, 0.1, 0.5, TONE.wood, 0, { bottom: true });
}
// a string of pennants BUNTING.len long from the origin along local z, sagging between its two ends; the
// pennants hang along their own down and stir by the clock
export const BUNTING = { len: 10.1, high: 4.4, sag: 0.7, flags: 11 };
// THE MARKET STREET beside the wall square. It is laid from the lamps along the square's far edge (the wall square's
// own row in the dress maker, restated here: `edge` in from the square's edge, the corner lamp first and one every
// `pitch` down the wall from it). Across the town, in metres from the square's far edge (the street's near kerb lies
// 2 m beyond that edge, its carriageway is 10 m wide): the middle of the carriageway and the far lamps' line (a
// metre inside the far kerb: lower down, the terraces' end houses front the street across its far pavement). Its
// limes are the tree model at the size `lime` (a garden tree is GARDEN.small to GARDEN.big). THE MILLER'S YARD
// beyond the street is measured from the first lying mill's foot: its row of stalls so far short of the mill
// across the town, and its four limes each so far up the wall and so far across the town from the mill (13 m up
// or down the wall is clear of the sails' reach, MILL.reach, by a lime's own head)
export const MARKET = { edge: 2, pitch: 14, mid: 7, lamps: 11, lime: 1.2, yardRow: 13, yardLimes: [[-13, -12], [13, -12], [-13, 2], [13, 2]] };
// the places up the wall of the five lamps along the square's far edge, the corner lamp's first
export const marketPosts = (q) => [0, 1, 2, 3, 4].map((k) => q.s1 - MARKET.edge - k * MARKET.pitch);
function buntingModel(g) {
  const tones = [new THREE.Color('#A8322A'), TONE.enamel, TONE.white, TONE.sea.clone().lerp(TONE.white, 0.25)];
  const yAt = (t) => BUNTING.high - BUNTING.sag * 4 * t * (1 - t);
  for (let j = 0; j < BUNTING.flags; j++) {
    const t0 = j / BUNTING.flags, t1 = (j + 1) / BUNTING.flags, z0 = t0 * BUNTING.len, z1 = t1 * BUNTING.len;
    g.quad([0, yAt(t0) + 0.05, z0], [0, yAt(t1) + 0.05, z1], [0, yAt(t1) - 0.05, z1], [0, yAt(t0) - 0.05, z0], TONE.dark, 0);
    g.tri([0, yAt(t0), z0 + 0.08], [0, yAt(t1), z1 - 0.08], [0, (yAt(t0) + yAt(t1)) / 2 - 1.3, (z0 + z1) / 2], tones[j % tones.length], 7);
  }
}
MAKERS.push(async (D) => {
  const { P, ctx, group, town } = D, g = new Geo(), m = new THREE.Matrix4(), HP = Math.PI / 2;
  const put = (model, s, z, yaw, arg) => { g.m = standAt(s, z, 0.08, yaw, 1, m); model(g, arg); };
  const awnings = [new THREE.Color(GALA[(D.opts.gala || 0) % GALA.length]), new THREE.Color('#A8322A'), TONE.sea.clone().lerp(TONE.dark, 0.2)];
  const strings = [];      // each string of pennants: where its first post stands, its heading and its stretch
  // THE TRAM PLACE: three rows of lamps along it with pennants strung across from row to row, two rows of
  // market stalls facing each other down its length, benches along its far side, shelters beside the track
  const t = P.tramPlace, rows = [t.z0 + 1.5, (t.z0 + t.z1) / 2, t.z1 - 1.5];
  let n = 0;
  for (let s = t.s0 + 5; s <= t.s1 - 5; s += 12.5, n++) {
    for (const z of rows) put(lampModel, s, z, 0);
    for (let k = 0; k < 2; k++) strings.push({ s, z: rows[k], yaw: 0, stretch: (rows[k + 1] - rows[k]) / BUNTING.len });
    if (s + 12.5 > t.s1 - 5) break;
    for (const ds of [4, 8.5]) {
      put(stallModel, s + ds, t.z0 + 8, HP, awnings[(n * 2 + (ds > 5 ? 1 : 0)) % 3]);
      put(stallModel, s + ds, t.z1 - 8.5, -HP, awnings[(n * 2 + (ds > 5 ? 2 : 1)) % 3]);
    }
    put(benchModel, s + 6.25, t.z0 + 3.2, HP);
    if (n % 3 === 0) put(shelterModel, s + 6.25, t.z1 - 3.4, Math.PI);
    if (n % 3 === 1) put(kioskModel, s + 6.25, (t.z0 + t.z1) / 2, 0);
  }
  await ctx.yield();
  // THE WALL SQUARE: lamps round its edge, a row of stalls along its lower and its upper side, a ring of eight
  // lamps round the carousel with pennants strung from one to the next, benches about the fountain, two kiosks
  const q = P.square, c = P.carousel, f = P.fountain;
  for (let k = 0; k < 4; k++) {
    const d = 2 + k * 14;
    put(lampModel, q.s0 + 2, q.z0 + d, HP); put(lampModel, q.s1 - 2, q.z1 - d, HP); put(lampModel, q.s0 + d + 14, q.z0 + 2, 0); put(lampModel, q.s1 - d - 14, q.z1 - 2, 0);
  }
  for (let k = 0; k < 8; k++) {
    const z = q.z0 + 6 + k * 6.8;
    put(stallModel, q.s0 + 6, z, Math.PI, awnings[k % 3]);
    if (Math.hypot(q.s1 - 6 - f.s, z - f.z) > JET.basin + 4) put(stallModel, q.s1 - 6, z, 0, awnings[(k + 1) % 3]);
  }
  const RING = 13.2, posts = [];
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; posts.push([c.s + RING * Math.sin(a), c.z + RING * Math.cos(a)]); }
  for (let k = 0; k < 8; k++) {
    const [s0, z0] = posts[k], [s1, z1] = posts[(k + 1) % 8];
    put(lampModel, s0, z0, Math.atan2(s1 - s0, z1 - z0) + HP);
    strings.push({ s: s0, z: z0, yaw: Math.atan2(s1 - s0, z1 - z0), stretch: Math.hypot(s1 - s0, z1 - z0) / BUNTING.len });
  }
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, s = f.s + 11.2 * Math.sin(a), z = f.z + 11.2 * Math.cos(a);
    if (z > q.z1 - 2 || s > q.s1 - 2 || Math.hypot(s - c.s, z - c.z) < RING + 2.5) continue;
    put(benchModel, s, z, a - HP);
  }
  put(kioskModel, q.s0 + 12, q.z0 + 9, 0); put(kioskModel, q.s1 - 12, q.z0 + 9, 0);
  // between the two kiosks, on the near side of the carousel, a double row of stalls back to back
  for (let k = 0; k < 5; k++) {
    put(stallModel, q.s0 + 20 + k * 5, q.z0 + 7.6, -HP, awnings[k % 3]); put(stallModel, q.s0 + 20 + k * 5, q.z0 + 10.4, HP, awnings[(k + 2) % 3]);
  }
  await ctx.yield();
  // THE MARKET STREET: the street that goes up along the square's far side is a market for the square's own length.
  // The street and the yard beyond it have no paving of their own, so their dress stands on the ground itself
  // (set) and not at the paving's height. A lamp by the street's far kerb over against each of the four lamps of
  // the square's far edge down the wall from its corner lamp, its arm along the street, pennants strung across the
  // street from the one to the other; midway between each two of the edge's five lamps a lime in the middle of
  // the carriageway (the trees' maker stands them) and, 4 m to either hand of each lime, a stall, facing the one
  // kerb and the other by turns
  const set = (model, s, z, yaw, arg) => { g.m = standAt(s, z, 0, yaw, 1, m); model(g, arg); };
  const edge = marketPosts(q);
  for (let k = 1; k < edge.length; k++) {
    set(lampModel, edge[k], q.z1 + MARKET.lamps, HP);
    strings.push({ s: edge[k], z: q.z1 - MARKET.edge, yaw: 0, stretch: (MARKET.lamps + MARKET.edge) / BUNTING.len });
    const lime = (edge[k - 1] + edge[k]) / 2, odd = k % 2 === 0;
    set(stallModel, lime + 4, q.z1 + MARKET.mid, odd ? HP : -HP, awnings[(k - 1) % 3]); set(stallModel, lime - 4, q.z1 + MARKET.mid, odd ? -HP : HP, awnings[k % 3]);
  }
  // and the market goes on into THE MILLER'S YARD, the open setts about the first lying mill beyond the street:
  // four stalls in a row along the yard's street side, facing the street, their backs to the mill (the sails turn
  // in a plane MILL.sailsOff to the street's side of the mill; the stalls' awnings stop 6 m and more short of that
  // plane, and their tops are 4 m and more lower than the sails' lowest sweep)
  const mill = P.mills[0];
  for (let k = 0; k < 4; k++) set(stallModel, mill.s - 9 + k * 6, mill.z - MARKET.yardRow, -HP, awnings[(k + 2) % 3]);
  g.m = null;
  const dress = new THREE.Mesh(g.build(), town); dress.frustumCulled = false; dress.matrixAutoUpdate = false; group.add(dress);
  await ctx.yield();
  const bg = new Geo(); buntingModel(bg);
  const bunting = new THREE.InstancedMesh(bg.build(), town, strings.length);
  const sc = new THREE.Vector3();
  strings.forEach((b, i) => { bunting.setMatrixAt(i, standAt(b.s, b.z, 0.9, b.yaw, sc.set(1, 1, b.stretch), m)); });
  bunting.frustumCulled = false; bunting.matrixAutoUpdate = false; group.add(bunting);
});

// ---------- the town's trees: one model, in the gardens and at the streets, the same on floor, bend and wall ----------
// A garden lies behind its house, toward the lane its terrace shares with the one it backs on: up the town for the
// even rows, down it for the odd. Every tree stands along its own ground's up, so on the wall it grows out level.
// A garden tree has one place in its plot: by the garden's back wall, to the side of the plot's centre where no back
// kitchen or bay of its row stands. A garden whose tree's head would not clear its own house, its neighbour's
// kitchen or the kitchen of the house it backs on has no tree. The washing is hung here, after the trees: a line
// hangs only where it clears every tree, so a tree's place is the same wherever the washing is.
function treeModel(g) {
  const bark = TONE.wood.clone().multiplyScalar(0.8), leaf = new THREE.Color(0.058, 0.108, 0.045), R = GARDEN.crown;
  g.stem(0, 0, 0, 0.26, 0.16, GARDEN.trunk, 3, bark, 0);
  // the crown: a lumpy round head in facets, two rings of six between a foot and a top, no two corners alike
  const y0 = GARDEN.top - 2 * R, ring = (k, yf, rf) => {
    const out = [];
    for (let i = 0; i < 6; i++) {
      const a = (i + 0.5 * k) * Math.PI / 3, r = R * rf * (0.86 + 0.26 * Math.abs(Math.sin(i * 2.4 + k * 1.3)));
      out.push([r * Math.cos(a), y0 + 2 * R * (yf + 0.05 * Math.sin(i * 1.7 + k)), r * Math.sin(a)]);
    }
    return out;
  };
  const lo = ring(0, 0.3, 0.9), hi = ring(1, 0.68, 0.84), foot = [0, y0, 0], top = [0.2, GARDEN.top, -0.15];
  const shade = (t) => leaf.clone().multiplyScalar(t);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    g.tri(foot, lo[i], lo[j], shade(0.72), 14);
    g.tri(lo[i], hi[i], lo[j], shade(0.92 + 0.1 * (i % 2)), 14); g.tri(lo[j], hi[i], hi[j], shade(1.0 + 0.12 * (i % 3) / 2), 14);
    g.tri(hi[i], top, hi[j], shade(1.16 + 0.1 * (i % 2)), 14);
  }
}
MAKERS.push(async (D) => {
  const { P, ctx, group, town } = D, detail = D.opts.detail || 1;
  // the trees' own deal, apart from every other of the town
  const rng = ctx.core.makeRng(ctx.core.hashSeed('gardens:' + ctx.seed));
  const trees = [], stands = new Set();
  let n = 0;
  for (const h of D.houses.all) {
    if (++n % 400 === 0) await ctx.yield();
    const a = rng(), b = rng(), d = rng(), e = rng(), f = rng();
    const row = Math.round((h.s - ROW0) / ROW_STEP), back = row % 2 ? -1 : 1;
    // a plot a churchyard or one of the wall's larger things has taken holds no house: no garden behind it, and no tree;
    // nor does a great tree stand in a lane's mouth beside it where both end houses are gone
    if (h.yard) continue;
    stands.add(row * 1000 + Math.round((h.z - PLAN.z0) / STREET.plot - 0.5));
    if (a >= 1 / GARDEN.every || f >= detail) continue;
    // a garden's one clear ground lies between its own back kitchen or bay and its neighbour's, short of the kitchen
    // of the house it backs on: every tree stands there, by the back wall, on floor, bend and wall alike (b is dealt, not read)
    const zc = PLAN.z0 + (Math.round((h.z - PLAN.z0) / STREET.plot - 0.5) + 0.5) * STREET.plot;
    const ts = h.s + back * (GARDEN.wall + GARDEN.tree), tz = zc - back * GARDEN.aside;
    const scale = GARDEN.small + (GARDEN.big - GARDEN.small) * d, head = GARDEN.head * scale;
    // its head's room, taken at its shoulder from its own row's centre and from the row's it backs on, each along
    // that row's own street: on the bend the two rows lean in, and a garden that cannot hold its tree has none
    const sh = fold(ts, tz, GARDEN.shoulder * scale), off = (rs) => { const r = basisAt(rs); return Math.abs((sh.x - r.gx) * r.ax + (sh.y - r.gy) * r.ay); };
    const own = off(h.s), far = off(h.s + back * ROW_STEP);
    const holds = own - head >= GARDEN.eaves && Math.hypot(Math.max(own - GARDEN.kitchen, 0), GARDEN.gap) >= head && far - head >= GARDEN.kitchen;
    // no garden tree hangs its head over a churchyard's wall: the yard has its own yews and limes
    if (holds && !keptClear(P, ts, tz) && !byYard(P, ts, tz, GARDEN.crown * scale + YARD.clear)) trees.push({ s: ts, z: tz, yaw: e * Math.PI * 2, scale });
  }
  await ctx.yield();
  // the great trees: in the mouth of every lane of gardens, at each street that goes up, where a terrace ends
  const blocks = Math.ceil(PLAN.plots / STREET.every), last = STREET.every - STREET.open - 1;
  for (let row = 0; row + 1 < PLAN.rows; row += 2) {
    const s = ROW0 + row * ROW_STEP + ROW_STEP / 2;
    for (let blk = 0; blk < blocks; blk++) {
      for (const end of [-1, 1]) {
        const a = rng(), b = rng(), c = rng();
        const plot = blk * STREET.every + (end < 0 ? 0 : last);
        if (!stands.has(row * 1000 + plot) && !stands.has((row + 1) * 1000 + plot)) continue;
        const z = PLAN.z0 + (plot + 0.5) * STREET.plot + end * (STREET.plot / 2 + GARDEN.mouth);
        // one mouth in six has no tree
        const scale = GARDEN.great[0] + (GARDEN.great[1] - GARDEN.great[0]) * b;
        // nor does a street tree stand in a churchyard, over its wall or before its gates
        const by = GARDEN.crown * scale + YARD.clear;
        if (c < 1 / 6 || keptClear(P, s, z) || z < LAND.z0 + 4 || z > LAND.z1 - 4 || byYard(P, s, z, by) || beforeYardGate(P, s, z, by)) continue;
        trees.push({ s, z, yaw: a * Math.PI * 2, scale });
      }
    }
  }
  // the market street's limes: four down the middle of the carriageway beside the wall square, midway between each
  // two lamps of the square's far edge, and four at the corners of the miller's yard beyond it, each turned its own
  // way (by place: nothing is dealt for them)
  marketPosts(P.square).forEach((s, k, edge) => { if (k) trees.push({ s: (edge[k - 1] + s) / 2, z: P.square.z1 + MARKET.mid, yaw: 1.9 * (k - 1) + 0.7, scale: MARKET.lime }); });
  MARKET.yardLimes.forEach(([ds, dz], k) => trees.push({ s: P.mills[0].s + ds, z: P.mills[0].z + dz, yaw: 2.3 * k + 0.2, scale: MARKET.lime }));
  await ctx.yield();
  const g = new Geo(), m = new THREE.Matrix4(); treeModel(g);
  const mesh = new THREE.InstancedMesh(g.build(), town, Math.max(trees.length, 1));
  mesh.count = trees.length;
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    mesh.setMatrixAt(i, standAt(t.s, t.z, 0, t.yaw, t.scale, m));
    if (i % 300 === 299) await ctx.yield();
  }
  mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; group.add(mesh);
  await ctx.yield();
  // the washing is hung here, where the trees are known, and no tree's place depends on it: a line hangs only where its
  // posts, its cord and its washing keep AIR from every tree, garden tree or great. The tree's reach about its own
  // stem is the widest of its model between two of its heights, a leaf's with the furthest of its sway (the town
  // shader's two swings together); an edge is widest at an end, or where it leaves those heights.
  const W = D.washing, AIR = 0.3, sway = GARDEN.sway * Math.hypot(1, 0.6);
  const widest = (y0, y1) => {
    let r = 0;
    for (let i = 0; i < g.p.length; i += 9) for (let j = 0; j < 3; j++) {
      const a = i + j * 3, b = i + (j + 1) % 3 * 3, sw = g.k[i / 3] === 14 ? sway : 0;
      const ax = g.p[a], ay = g.p[a + 1], az = g.p[a + 2], bx = g.p[b], by = g.p[b + 1], bz = g.p[b + 2];
      for (const k of by === ay ? [0, 1] : [clamp((y0 - ay) / (by - ay), 0, 1), clamp((y1 - ay) / (by - ay), 0, 1)]) {
        const y = ay + (by - ay) * k;
        if (y > y0 - 1e-6 && y < y1 + 1e-6) r = Math.max(r, Math.hypot(ax + (bx - ax) * k, az + (bz - az) * k) + sw * y);
      }
    }
    return r;
  };
  if (W) {
    const whole = widest(0, GARDEN.top), bt = {}, bl = {};
    const clear = (l) => {
      for (const t of trees) {
        // across the town nothing is turned: a line whose end is further off than the tree's whole reach is clear of it
        const dz = Math.max(Math.abs(l.z - t.z) - W.half, 0);
        if (dz >= whole * t.scale + AIR) continue;
        // the line's four corners, foot and head, in the tree's own axes, along its street and up from its ground:
        // on the bend the two lean together as they stand
        basisAt(t.s, bt); basisAt(l.s, bl);
        let a0 = Infinity, a1 = -Infinity, u0 = Infinity, u1 = -Infinity;
        for (const x of [-W.wide, W.wide]) for (const y of [W.low, W.high]) {
          const px = bl.gx + x * bl.ax + y * bl.ux - bt.gx, py = bl.gy + x * bl.ay + y * bl.uy - bt.gy;
          const along = px * bt.ax + py * bt.ay, up = px * bt.ux + py * bt.uy;
          a0 = Math.min(a0, along); a1 = Math.max(a1, along); u0 = Math.min(u0, up); u1 = Math.max(u1, up);
        }
        // by place alone: its distance from the stem in plan, against the tree's reach at the line's own heights
        if (Math.hypot(Math.max(a0, -a1, 0), dz) < widest((u0 - AIR) / t.scale, (u1 + AIR) / t.scale) * t.scale + AIR) return false;
      }
      return true;
    };
    // the candidates take their turns in the list's own order: one whose place is hung already, or lies within a
    // tree's reach, passes its turn on to the next, until the most that may hang do or the candidates run out
    const taken = new Set();
    let turn = 0;
    for (const l of W.candidates) {
      if (W.hung.length >= W.most) break;
      if (++turn % 40 === 0) await ctx.yield();
      if (taken.has(l.place) || !clear(l)) continue;
      taken.add(l.place);
      W.mesh.setMatrixAt(W.hung.length, standAt(l.s, l.z, 0, 0, 1, m));
      W.hung.push({ i: W.hung.length, s: l.s, z: l.z });
    }
    W.mesh.count = W.hung.length; W.mesh.instanceMatrix.needsUpdate = true;
  }
});
