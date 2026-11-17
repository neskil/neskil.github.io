// The Same Field Every Hour: hero set piece, "White noon at the footbridge" (after Claude Monet, 1840 to 1926).
// A slender blue-green arched footbridge (44 m span, deck underside 8 m clear at the crown, trellis to 14 m) hung with
// wisteria racemes, between two 28 m weeping willows on low grass banks, over a pond with lily rafts, the whole doubled
// in the water as vertical drags. Everything is oil touches: nothing is lit, nothing is outlined, no black.
//
// HOW THE STYLE IS MADE (shade the whole world with these exports; post must be { flat: 1, bloom: { strength: 0 }, ... })
//   makeStyle(palette)      -> { pigments, strip, uniforms, touchMaterial(o), canvasMaterial(o), frame(time, camera, renderer),
//                               setHours(a, b, place, fade), dispose() }. Make ONE and pass it as opts.style to buildHero.
//   PALETTE, ROLE, HOUR     the seven pigments, the 24 roles (what a touch describes), the five hours of the day.
//   makePigments / makeStrip  the 96 x 5 strip: for every hour and role two light and two shade pigments, mixed like paint
//                             from the seven pigments only. Linear colour is written as is (no tone map, no inverse).
//   STYLE_GLSL              the shared chunk: sfPig / sfPigNow (strip lookup, two hours mixed by the front), sfHourMix
//                           (front place against a touch's own delay), sfCloud (cloud-shadow footprint -> shade pigment),
//                           sfDistance (distance = stepped paleness toward the hour's air colour, never fog).
//   TouchBatch + touchMaterial   THE MARK. Instanced quads that lie ON their form (centre, stroke direction, form normal,
//                           length, width, role, occlusion, kind, hang). The fragment shader cuts one press of a flat brush:
//                           ragged ends per bristle, dry gaps, ridges in the role's second pigment, white-cut crests.
//                           KIND: STREAK, CURL (wisteria, rose, leaf commas), PAD (level ellipse), DRAG (willow, reflections),
//                           FLOWER (closes with uLily). Light or shade is chosen per touch from its normal against uLight.
//                           Vertex shader: pendulum swing by `hang`; uPart, a push of hanging touches round the lens, is
//                           OFF (0: every hanging thing is held clear of the flown line by place, the world's HEM LAW, so
//                           "parting" is the parting of the hems over the line); no touch shrinks near the lens (the shrink inside 2.4 m of it is
//                           taken out: near the lens a touch is drawn at its built size, held only by the cap on a mark's width below,
//                           from which pads and flower dabs are exempt);
//                           past uAir.y touches grow while neighbours drop out, never under 1.6 px wide,
//                           twinkle (a touch trades its two pigments, 1.6 to 3.2 s cross-fade, off under 6 px), gust.
//   TouchBatch.reflectInto  flipped copies under the water as longer vertical drags in the source's SHADE pigment (roses,
//                           flowers, rims, wisteria and the boat keep their own); draw with touchMaterial({ reflect: true }).
//                           Every double is crossed by level breaks (sfBreakV, one value by the world's x + z and
//                           y). The flipped under-form (canvasMaterial({ double: true }), aRole.y = depth as a share
//                           of the mass's height) is not drawn where that value is over 0.6; a drag
//                           (touchMaterial({ reflect: true }), by the varying vBrk) only where it is over its
//                           material's uBrk (BRK: pond 0.74, stream and bridge 0.8, the rowboat never). So a drag's
//                           break is the narrower core of its under-form's, most of an under-form's breaks are
//                           crossed by its drags unbroken, and the water, or whatever lies behind, shows whole as a
//                           level dash only where both are broken. The value lies in the world, the same for drags
//                           and under-forms; only its step of coarseness by the eye's distance is taken once for a
//                           whole drag (at its middle) and at every fragment of an under-form.
//   Near the lens no touch is wider than a fortieth of the frame (pads and flower dabs excepted): at arm's length a mark
//   is a bristle streak.
//   FormBatch + canvasMaterial   THE CRUST on under-forms: uv = paint coordinates in metres (u = stroke direction),
//                           aRole = (role, occlusion). World-anchored streak cells at two sizes that step up by four with
//                           distance, the second hue and primed canvas in the chinks, mean tint when under about 4 px.
//                           { water: true } takes the cloud map upside down (sfCloudMap: the eye's ray turned up off the
//                           water, so cloud shapes keep the sky's breadth); slide = stream dashes in alternate rows.
//                           Cells are ragged presses of unequal length over another press from a lattice of its own; the
//                           larger size arrives press by press with distance, the small one lies over the large in patches.
//   Shared uniforms (style.uniforms): uFront (hour behind, hour ahead, front place, fade length), uCourse (course dir x,z,
//                           offset, raggedness), uLight, uGust, uCloud, uAir, uTwinkle, uLily, uPart, uWind, uTime.
//   WATER ORDER: water under-form has depthWrite false and renderOrder -0.6, reflections renderOrder -0.5, the sky dome
//   must draw before both (renderOrder -1 or lower); nothing else may go below y = 0.
//
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail (0.6..1, thins drags, leaves, pads and willow reflections),
//   opts.style (a makeStyle() result to share), opts.water (false = bring your own pond), opts.waterRadius (420),
//   opts.hem ({ floor(x, z), min }: the world's law of place for what hangs over the flown line, in the hero's own frame:
//   a raceme anchored at (x, z) ends no lower than floor(x, z), -Infinity where nothing is asked; it is shortened from
//   the tip, or left out when under min metres would be left. Without it the racemes hang as they are made).
// Returns radius 44, height 28, centre (0,8,0); ground false (it brings its water). About 110k triangles, 4 draw calls,
//   300 to 360 ms of build in short steps. Per seed: arch rise, trellis bays and height, white share of the wisteria,
//   which willow is the big one, their lean, lobes and hems, bank sizes, every raft.
// Anchors (local; the span runs along X, the camera's line is the Z axis, the piece is the same from either side):
//   reveal (0,2,90) square-on view; flyThrough: 8 points from z 90 under the crown (0,4.5,0) to z -80 (water under you,
//   3.5 m of air under the deck by design, the racemes over the line end 2.2 m above it: opts.hem); crown (deck underside over the path); trellisTop; lookAt;
//   willows [{ base, top, radius }]; banks, bankRadius; rafts [{ at, rx, rz }]; span; clearance. No portal seat here.
// Hooks: update(dt, time, camera) calls style.frame; setHours(a, b, place, fade) = style.setHours; setProgress(u) is a
//   no-op kept for the contract (fronts, gust, cloud shadow and lilies are uniforms the world sets from u).
// Expects around it: a sky dome and foliage walls behind (it has no backdrop of its own), more water beyond 420 m.
//
// THE LAW OF PIGMENT AT BLUE DUSK (typed once here, where the hour's rows stand in makePigments, and once at the head of
//   the world file, where the rose dabs take their roles). In the blue-dusk hour vermilion and salmon are held by the
//   rose arches, their doubles, the ladder and the opening; lemon also rims crowns, reeds and the low sky, and the raft
//   flowers keep their dabs; each rose arch is one mass in three value shapes by each dab's own place on its hoop (the
//   world's ROSE). The rows of the DUSK hour that say it:
//   CLOUD: its second light is pale cobalt cut with white (it was a salmon cut with white, and the water carries the
//     cloud upside down, so a peach lay all over the blue-violet water). Its first light and both shades are as they
//     were (as typed; for the grey edition see below).
//   POPPY, the roses' role (nothing else carries it but the poppies of the stream meadow, at z under 300, long behind
//     when the dusk comes): its two lights are vermilion cut 0.22 with white and the opening's own salmon (T.salmon,
//     the veil's #F2A27A); its two shades are those the accents loop gives it (as typed; for grey see below).
//   FOLIAGE (the banks, the willows, the hoops' tubes, the roses' leaf): its second light is a foliage pigment,
//     viridian and cobalt cut 0.35 with white (it was the low sky's own first pigment, so that a bare crown melted
//     into the sky as pale lavender ice). Its first light and both shades are as they were (as typed; for grey see
//     below): a mass is two value shapes, a lit one broken between the two lights over a violet shade.
//   What is as it was: FLOWER (the raft flowers' dabs, white and a salmon, and six in ten of the ladder's dashes) and RIM
//     (lemon: the other four in ten of the ladder, the roses' crest and a share of their body, one in twenty of the
//     marks on a bank crown's top, one reed in five, and some of the low sky's dashes ahead).
//   FOR WHICH EDITIONS EACH ROW HOLDS. The rows are typed before the editions are applied. Clear: all three as typed.
//   Late-year: CLOUD and POPPY as typed; FOLIAGE not: that edition writes its own foliage row (lemon and vermilion at
//   every hour) and its own grass light, so there the banks are warm at dusk too and the roses do not hold the warm
//   pigments alone. Grey: all three rows pearled by that edition's own rule (every light cooled toward pearl, every
//   shade stirred with its light: so there the cloud's and the foliage's second shade and both of the roses' shades
//   move with their changed lights too). Long dusk: the DUSK row deepened by that edition's own rule; its SUNSET row, which
//   the front at z 585 brings over the pond, is stirred as it always was from the three rows as they stood before this
//   law (duskEarly), so that edition's pond keeps its peach cloud on the water and the law reaches the dusk hour only.
//   Nothing in it reads the eye, the lens, the clock, a seed's number or a still: a row is a row of the hour's table,
//   and it reaches the picture only by the hour's front.
import * as THREE from 'three';

// ------------------------------------------------------------------ pigments
export const PALETTE = ['#F3EEDD', '#F6C52B', '#E2432A', '#2F5FB3', '#8A5BA8', '#2E8B74', '#3A2F6B'];
const DEFAULT_TINTS = { salmon: '#F2A27A', mauve: '#C9A6CC', pcob: '#A9C1E6', lemon: '#F4E27A', green: '#5DAE66' };

// roles: one column group of the strip each (lightA, lightB, shadeA, shadeB)
export const ROLE = {
  AIR: 0, SKY_LOW: 1, SKY_HIGH: 2, CLOUD: 3, WATER: 4, FOLIAGE: 5, TRUNK: 6, BRIDGE: 7, DEEP: 8, WISTERIA: 9,
  PAD: 10, FLOWER: 11, RIM: 12, GRASS: 13, STUBBLE: 14, FROST: 15, STACK: 16, POPPY: 17, IRIS: 18, ROOF: 19,
  STONE: 20, BOAT: 21, HILL: 22, TOWN: 23,
};
export const ROLES = 24;
export const HOUR = { DAWN: 0, MORNING: 1, NOON: 2, SUNSET: 3, DUSK: 4 };
export const HOURS = 5;

const hex2 = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const mx = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Builds the pigment table (display sRGB triples) : table[hour][role] = [lightA, lightB, shadeA, shadeB].
// Colours are mixed like paint on a palette, in display space, from the seven pigments only.
export function makePigments(palette = PALETTE, edition = 'clear') {
  const [W, Y, R, B, V, G, D] = palette.map(hex2);
  const isDef = palette.every((h, i) => h.toUpperCase() === PALETTE[i]);
  const T = isDef ? Object.fromEntries(Object.entries(DEFAULT_TINTS).map(([k, h]) => [k, hex2(h)])) : {
    salmon: mx(mx(R, Y, 0.25), W, 0.47), mauve: mx(V, W, 0.55), pcob: mx(B, W, 0.62), lemon: mx(Y, W, 0.45), green: mx(mx(G, Y, 0.3), W, 0.2),
  };
  const cut = (c, t) => mx(c, W, t);
  const madder = mx(R, V, 0.45), ultra = mx(B, D, 0.45), bg = mx(G, B, 0.4);
  const noon = [];
  noon[ROLE.AIR] = [cut(T.pcob, 0.55), cut(T.pcob, 0.7), cut(T.pcob, 0.3), cut(T.mauve, 0.4)];
  noon[ROLE.SKY_LOW] = [cut(T.pcob, 0.6), W, cut(T.pcob, 0.35), cut(T.mauve, 0.5)];
  noon[ROLE.SKY_HIGH] = [T.pcob, cut(B, 0.5), cut(B, 0.42), cut(T.mauve, 0.2)];
  noon[ROLE.CLOUD] = [W, cut(T.salmon, 0.7), cut(T.mauve, 0.45), cut(T.salmon, 0.5)];
  noon[ROLE.WATER] = [T.pcob, cut(T.pcob, 0.22), cut(B, 0.36), cut(V, 0.42)];
  noon[ROLE.FOLIAGE] = [T.green, cut(mx(G, Y, 0.55), 0.22), cut(G, 0.08), cut(mx(G, B, 0.45), 0.12)];
  noon[ROLE.TRUNK] = [T.salmon, T.mauve, V, mx(V, madder, 0.5)];
  noon[ROLE.BRIDGE] = [cut(bg, 0.3), cut(G, 0.22), bg, cut(mx(B, V, 0.5), 0.12)];
  noon[ROLE.DEEP] = [mx(G, V, 0.45), G, D, mx(D, V, 0.45)];
  noon[ROLE.WISTERIA] = [T.mauve, cut(T.mauve, 0.55), V, cut(mx(V, B, 0.5), 0.18)];
  noon[ROLE.PAD] = [T.green, cut(G, 0.28), mx(G, V, 0.35), cut(V, 0.22)];
  noon[ROLE.FLOWER] = [W, T.salmon, cut(madder, 0.3), T.mauve];
  noon[ROLE.RIM] = [T.lemon, cut(Y, 0.25), T.green, T.lemon];
  noon[ROLE.GRASS] = [T.green, cut(mx(G, Y, 0.62), 0.25), G, cut(mx(G, B, 0.5), 0.2)];
  noon[ROLE.STUBBLE] = [T.lemon, cut(T.salmon, 0.4), T.mauve, T.pcob];
  noon[ROLE.FROST] = [W, cut(T.mauve, 0.6), T.pcob, T.mauve];
  noon[ROLE.STACK] = [T.salmon, T.lemon, V, cut(mx(V, B, 0.5), 0.15)];
  noon[ROLE.POPPY] = [R, cut(R, 0.25), madder, cut(madder, 0.2)];
  noon[ROLE.IRIS] = [V, T.mauve, mx(V, B, 0.5), D];
  noon[ROLE.ROOF] = [T.salmon, cut(T.salmon, 0.35), V, T.mauve];
  noon[ROLE.STONE] = [T.mauve, cut(T.pcob, 0.3), V, cut(B, 0.3)];
  noon[ROLE.BOAT] = [cut(G, 0.2), cut(mx(G, B, 0.3), 0.32), mx(G, V, 0.4), mx(G, B, 0.5)];
  noon[ROLE.HILL] = [cut(T.pcob, 0.3), cut(T.mauve, 0.35), T.pcob, T.mauve];
  noon[ROLE.TOWN] = [cut(T.mauve, 0.3), cut(T.pcob, 0.35), T.mauve, T.pcob];
  // the hours: what the day does to every role. [light tint, amount, shade tint, amount, air A, air B]
  const hours = [];
  hours[HOUR.DAWN] = { lt: cut(T.mauve, 0.55), la: 0.52, st: mx(T.pcob, V, 0.35), sa: 0.55, air: [cut(T.mauve, 0.6), cut(T.lemon, 0.6), cut(T.mauve, 0.25), T.pcob] };
  hours[HOUR.MORNING] = { lt: mx(T.salmon, T.lemon, 0.5), la: 0.34, st: T.mauve, sa: 0.3, air: [cut(T.salmon, 0.6), cut(T.lemon, 0.55), cut(T.mauve, 0.35), cut(T.pcob, 0.3)] };
  hours[HOUR.NOON] = { lt: W, la: 0.0, st: B, sa: 0.0, air: noon[ROLE.AIR] };
  hours[HOUR.SUNSET] = { lt: mx(R, Y, 0.5), la: 0.5, st: V, sa: 0.45, air: [T.salmon, cut(mx(R, Y, 0.6), 0.35), T.mauve, cut(V, 0.3)] };
  hours[HOUR.DUSK] = { lt: mx(T.pcob, B, 0.45), la: 0.62, st: mx(ultra, V, 0.3), sa: 0.66, air: [mx(T.pcob, B, 0.35), mx(T.mauve, V, 0.3), mx(B, V, 0.4), ultra] };
  const table = [];
  for (let h = 0; h < HOURS; h++) {
    const H = hours[h], row = [];
    for (let r = 0; r < ROLES; r++) {
      const n = noon[r];
      row[r] = r === ROLE.AIR ? H.air : [mx(n[0], H.lt, H.la), mx(n[1], H.lt, H.la * 0.8), mx(n[2], H.st, H.sa), mx(n[3], H.st, H.sa * 0.85)];
    }
    table[h] = row;
  }
  // the accents keep their own pigment through the day (poppy, rose, flower dabs): only half the tint
  for (let h = 0; h < HOURS; h++) for (const r of [ROLE.POPPY, ROLE.FLOWER, ROLE.RIM, ROLE.BOAT]) {
    const n = noon[r], H = hours[h];
    table[h][r] = [mx(n[0], H.lt, H.la * 0.45), mx(n[1], H.lt, H.la * 0.45), mx(n[2], H.st, H.sa * 0.5), mx(n[3], H.st, H.sa * 0.5)];
  }
  // the sky is the hour's own: lemon low and salmon then mauve above at dawn, cobalt by day, salmon and violet late
  const S = ROLE.SKY_LOW, SH = ROLE.SKY_HIGH, C = ROLE.CLOUD, orange = mx(R, Y, 0.55);
  table[HOUR.DAWN][S] = [cut(T.lemon, 0.45), cut(T.lemon, 0.7), cut(T.salmon, 0.5), cut(T.lemon, 0.25)];
  table[HOUR.DAWN][SH] = [cut(T.mauve, 0.5), cut(T.salmon, 0.55), cut(T.mauve, 0.22), cut(T.pcob, 0.4)];
  table[HOUR.DAWN][C] = [cut(T.salmon, 0.35), cut(T.lemon, 0.6), cut(T.mauve, 0.3), cut(T.salmon, 0.6)];
  table[HOUR.MORNING][S] = [cut(T.lemon, 0.6), cut(T.pcob, 0.7), cut(T.salmon, 0.6), cut(T.pcob, 0.5)];
  table[HOUR.MORNING][SH] = [cut(T.pcob, 0.3), cut(T.pcob, 0.55), T.pcob, cut(T.mauve, 0.45)];
  table[HOUR.MORNING][C] = [W, cut(T.salmon, 0.6), cut(T.mauve, 0.5), cut(T.salmon, 0.75)];
  table[HOUR.SUNSET][S] = [cut(orange, 0.45), T.lemon, T.salmon, cut(orange, 0.25)];
  table[HOUR.SUNSET][SH] = [T.mauve, cut(T.salmon, 0.25), cut(V, 0.3), cut(T.pcob, 0.2)];
  table[HOUR.SUNSET][C] = [T.salmon, cut(orange, 0.3), cut(V, 0.25), cut(madder, 0.45)];
  table[HOUR.DUSK][S] = [mx(T.mauve, T.pcob, 0.4), cut(V, 0.35), mx(B, V, 0.5), cut(B, 0.3)];
  table[HOUR.DUSK][SH] = [cut(ultra, 0.3), cut(mx(B, V, 0.5), 0.25), mx(ultra, V, 0.4), cut(ultra, 0.15)];
  table[HOUR.DUSK][C] = [T.mauve, cut(T.pcob, 0.15), cut(V, 0.2), mx(B, V, 0.5)];   // THE LAW OF PIGMENT AT BLUE DUSK: the dusk cloud's second light is pale cobalt (it was a salmon cut with white, and the water carries the cloud upside down)
  // frost dawn: the field is white and mauve, the stacks violet against the light with a salmon rim
  table[HOUR.DAWN][ROLE.STUBBLE] = [cut(T.mauve, 0.66), cut(T.lemon, 0.78), mx(T.pcob, V, 0.38), mx(T.mauve, B, 0.3)];
  table[HOUR.DAWN][ROLE.FROST] = [W, cut(T.mauve, 0.72), mx(T.pcob, V, 0.25), cut(V, 0.4)];
  table[HOUR.DAWN][ROLE.STACK] = [T.salmon, cut(T.salmon, 0.35), mx(V, B, 0.18), cut(mx(V, B, 0.45), 0.12)];
  table[HOUR.DAWN][ROLE.RIM] = [T.salmon, cut(T.lemon, 0.2), T.mauve, T.salmon];
  table[HOUR.MORNING][ROLE.STUBBLE] = [cut(mx(T.salmon, T.lemon, 0.6), 0.25), T.lemon, T.mauve, cut(V, 0.35)];
  table[HOUR.MORNING][ROLE.WATER] = [cut(T.pcob, 0.3), cut(T.salmon, 0.62), cut(B, 0.42), cut(V, 0.42)];
  table[HOUR.SUNSET][ROLE.WATER] = [cut(orange, 0.42), T.salmon, T.mauve, cut(V, 0.3)];      // the sunset sky upside down: never cobalt stirred into orange
  table[HOUR.DUSK][ROLE.WATER] = [mx(T.pcob, B, 0.3), T.mauve, mx(B, V, 0.45), cut(ultra, 0.2)];
  table[HOUR.SUNSET][ROLE.FOLIAGE] = [mx(T.green, orange, 0.45), mx(T.lemon, orange, 0.35), mx(G, B, 0.45), mx(V, B, 0.3)];
  table[HOUR.DUSK][ROLE.FOLIAGE] = [mx(T.pcob, G, 0.3), cut(bg, 0.35), mx(V, B, 0.35), mx(V, ultra, 0.45)];   // THE LAW OF PIGMENT AT BLUE DUSK: the second light is a foliage pigment, viridian and cobalt cut with white (it was the low sky's own first pigment, mx(T.mauve, T.pcob, 0.4), so a bare crown melted into the sky)
  table[HOUR.DUSK][ROLE.TOWN] = [T.pcob, T.mauve, mx(V, B, 0.4), mx(V, ultra, 0.3)];   // the misty town catches the last light: pale cobalt and mauve against its violet sky
  // THE LONG DUSK'S POND IS AS IT WAS: what that edition stirs into its sunset hour (the hour over the pond) are the three dusk rows as they stood before THE LAW OF PIGMENT AT BLUE DUSK (a salmon in the cloud, the roses' accents row, the low sky's pigment in the foliage); the law holds the dusk hour only, in every edition
  const duskEarly = { [C]: [T.mauve, cut(T.salmon, 0.3), cut(V, 0.2), mx(B, V, 0.5)], [ROLE.FOLIAGE]: [mx(T.pcob, G, 0.3), mx(T.mauve, T.pcob, 0.4), mx(V, B, 0.35), mx(V, ultra, 0.45)], [ROLE.POPPY]: table[HOUR.DUSK][ROLE.POPPY] };
  table[HOUR.DUSK][ROLE.POPPY] = [cut(R, 0.22), T.salmon, table[HOUR.DUSK][ROLE.POPPY][2], table[HOUR.DUSK][ROLE.POPPY][3]];   // THE LAW OF PIGMENT AT BLUE DUSK: the roses burn: vermilion cut with white and the opening's own salmon; the two shades are those the accents loop gave
  table[HOUR.MORNING][ROLE.STACK] = [mx(T.salmon, T.lemon, 0.45), cut(orange, 0.4), V, cut(mx(V, B, 0.5), 0.2)];
  const all = (fn) => { for (let h = 0; h < HOURS; h++) for (let r = 0; r < ROLES; r++) table[h][r] = fn(table[h][r], h, r); };
  if (edition === 'grey') {            // overcast: pearly in mauve, pale cobalt and viridian, the hours as brightenings
    const pearl = cut(mx(T.mauve, T.pcob, 0.5), 0.35), amt = [0.4, 0.3, 0.2, 0.34, 0.4], dim = [0.16, 0.06, 0, 0.1, 0.24];
    all((q, h) => { const f = (c) => mx(mx(c, pearl, amt[h]), mx(V, B, 0.5), dim[h]); const l0 = f(q[0]), l1 = mx(f(q[1]), q[1], 0.45); return [l0, l1, mx(f(q[2]), l0, 0.45), mx(f(q[3]), l1, 0.4)]; });
  } else if (edition === 'late') {     // late year: poplars lemon and vermilion, snow light, the bridge red-gold at sunset
    for (let h = 0; h < HOURS; h++) {
      const H = hours[h], k = 1 - H.la * 0.6;
      table[h][ROLE.FOLIAGE] = [mx(T.lemon, H.lt, H.la * 0.5), mx(mx(Y, R, 0.38), H.lt, H.la * 0.5), mx(mx(R, V, 0.35), H.st, H.sa * 0.6), mx(mx(Y, G, 0.45), H.st, H.sa * 0.6)];
      table[h][ROLE.GRASS] = [mx(cut(mx(G, Y, 0.7), 0.3), H.lt, H.la * 0.6 * k + 0.1), table[h][ROLE.GRASS][1], table[h][ROLE.GRASS][2], mx(T.mauve, H.st, H.sa)];
    }
    table[HOUR.SUNSET][ROLE.BRIDGE] = [mx(R, Y, 0.5), T.salmon, mx(V, R, 0.3), V];
    table[HOUR.DAWN][ROLE.FROST] = [W, cut(T.salmon, 0.7), T.pcob, cut(V, 0.5)];
  } else if (edition === 'dusk') {     // long dusk: blue dusk comes early and deepens to ultramarine and violet, never black
    const early = table[HOUR.SUNSET].map((q, r) => q.map((c, k) => mx(c, (duskEarly[r] || table[HOUR.DUSK][r])[k], 0.72)));
    const deep = table[HOUR.DUSK].map((q) => [mx(q[0], mx(ultra, V, 0.4), 0.34), mx(q[1], ultra, 0.3), mx(q[2], mx(D, B, 0.3), 0.4), mx(q[3], mx(D, V, 0.4), 0.4)]);
    table[HOUR.SUNSET] = early; table[HOUR.DUSK] = deep;
  }
  return { table, ground: W, tints: T, pig: { W, Y, R, B, V, G, D }, edition };
}

// The 96 x 5 strip texture (sRGB8, nearest): x = role*4 + (0 lightA,1 lightB,2 shadeA,3 shadeB), y = hour.
export function makeStrip(pigments) {
  const data = new Uint8Array(ROLES * 4 * HOURS * 4);
  for (let h = 0; h < HOURS; h++) for (let r = 0; r < ROLES; r++) for (let k = 0; k < 4; k++) {
    const c = pigments.table[h][r][k], o = ((h * ROLES + r) * 4 + k) * 4;
    data[o] = Math.round(c[0] * 255); data[o + 1] = Math.round(c[1] * 255); data[o + 2] = Math.round(c[2] * 255); data[o + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, ROLES * 4, HOURS, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------------ shared uniforms and GLSL
// One set of uniforms for every material of the world (pass the same object to every factory).
export function makeStyleUniforms(strip, pigments) {
  const g = pigments.ground;
  return {
    uTime: { value: 0 },
    uStrip: { value: strip },
    uGround: { value: new THREE.Color().setRGB(g[0], g[1], g[2], THREE.SRGBColorSpace) },
    uFront: { value: new THREE.Vector4(HOUR.NOON, HOUR.NOON, -1e5, 50) },   // hour behind the front, hour ahead of it, front place along the course (m), fade length (m)
    uCourse: { value: new THREE.Vector4(0, 1, 0, 0.8) },                    // course direction (x,z), offset, raggedness of the front (in fade lengths)
    uLight: { value: new THREE.Vector3(-0.38, 0.8, 0.46).normalize() },     // direction TO the light of this hour
    uCam: { value: new THREE.Vector3(0, 1e4, 0) },
    uCamR: { value: new THREE.Vector3(1, 0, 0) },
    uCamF: { value: new THREE.Vector3(0, 0, 1) },
    uView: { value: new THREE.Vector2(1280, 720) },
    uWind: { value: new THREE.Vector4(0.8, 0.6, 1, 0) },                    // wind direction (x,z), sway strength, unused
    uGust: { value: new THREE.Vector3(-1e5, 40, 0) },                       // gust place along the course, length, strength
    uCloud: { value: new THREE.Vector3(-1e5, 60, 0) },                      // cloud shadow centre along the course, half length, strength 0..1
    uAir: { value: new THREE.Vector3(900, 60, 0.85) },                      // paleness distance, distance where touches start to grow, most air mixed in
    uTwinkle: { value: 0.12 },                                              // share of touches trading pigment with a neighbour
    uLily: { value: 0 },                                                    // 0 flowers open .. 1 closed
    uPart: { value: 0 },                                                    // 0 = off. (It pushed hanging touches round the lens; they are now held clear of the flown line by place: the world's HEM LAW.)
    uFog: { value: new THREE.Vector4(1e5, 40, 50, 0) },
    uCast: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },   // cast shadows of three round masses: x, z, radius, height
    uCastOn: { value: 0 },
    uCastY: { value: new THREE.Vector3(0, 0, 0) },                          // ground height at each mass: only what lies near that ground is shaded                     // fog: begins at this place along the course, fade length, air distance inside it, 0/1
  };
}

export const STYLE_GLSL = /* glsl */`
uniform float uTime, uTwinkle, uLily, uPart;
uniform sampler2D uStrip;
uniform vec3 uGround, uLight, uCam, uCamR, uCamF, uGust, uCloud, uAir;
uniform vec4 uFront, uCourse, uWind, uFog;
uniform vec4 uCast[3]; uniform float uCastOn; uniform vec3 uCastY;
float gFogK;
uniform vec2 uView;
float sfHash(float n){ return fract(sin(n*12.9898+4.1414)*43758.5453); }
float sfHash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float sfNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(sfHash2(i), sfHash2(i+vec2(1.,0.)), f.x), mix(sfHash2(i+vec2(0.,1.)), sfHash2(i+vec2(1.,1.)), f.x), f.y); }
// the sky upside down: where the eye's ray, turned up off the water at p, meets the cloud field. Cloud shapes keep the
// sky's own breadth however near the water is, and lie still like the sky while the dashes of the water slide through them.
float sfCloudMap(vec3 p){
  vec3 v = p - uCam; v = v/max(length(v), 1e-3);
  vec2 q = v.xz/(max(-v.y, 0.) + .22)*2.4 + uTime*vec2(.012, .005);
  return sfNoise(q + 3.)*.62 + sfNoise(q*2.3 + 11.)*.38; }
// strip lookup: role 0..23, k 0 lightA 1 lightB 2 shadeA 3 shadeB, hour row
vec3 sfPig(float role, float k, float hour){ return textureLod(uStrip, vec2((role*4.+k+.5)/96., (hour+.5)/5.), 0.).rgb; }
// how far the new hour has repainted a touch at world place p whose own delay is 0..1
float sfHourMix(vec3 p, float delay){
  float along = dot(p.xz, uCourse.xy) + uCourse.z;
  float m = clamp((uFront.z - along)/max(uFront.w, 1.) - delay*uCourse.w, 0., 1.);
  return m*m*(3.-2.*m); }
vec3 sfPigNow(float role, float k, float m){ return mix(sfPig(role, k, uFront.y), sfPig(role, k, uFront.x), m); }
// analytic cast shadows: the footprint of a drum with a conical cap (a grainstack) thrown along the hour's light
float sfCast(vec3 p){
  vec2 l = uLight.xz; float ll = max(length(l), 1e-3); vec2 sd = -l/ll; float te = max(uLight.y, .02)/ll, s = 0.;
  vec2 pj = p.xz + (vec2(sfNoise(p.xz*.45), sfNoise(p.xz*.45 + 7.3)) - .5)*2.2;   // the edge of a shadow is ragged touches, never a ruled line
  for (int i = 0; i < 3; i++) { vec4 c = uCast[i]; vec2 v = pj - c.xy;
    float al = dot(v, sd), lat = abs(v.x*sd.y - v.y*sd.x), h = al*te;
    float hw = c.z*(h < c.w*.47 ? 1.04 : 1.1*max(0., (c.w-h)/max(c.w*.53, .01)));
    float gy = i == 0 ? uCastY.x : i == 1 ? uCastY.y : uCastY.z;
    s = max(s, step(c.z*.8, al)*step(h, c.w)*step(lat, hw*(.93 + .14*sin(al*1.7 + lat*2.)))*step(p.y, gy + 2.5 + al*.06)); }
  return s*uCastOn; }
// 1 inside the cloud shadow or a cast shadow footprint
float sfCloud(vec3 p){ float along = dot(p.xz, uCourse.xy) + uCourse.z;
  return max(sfCast(p), uCloud.z*(1.-smoothstep(uCloud.y*.8, uCloud.y, abs(along-uCloud.x) + 14.*(sfNoise(p.xz*.03)-.5)))); }
// fog (the rare morning): past the fog's edge the air closes in; call once before sfDistance
void sfSetFog(vec3 p, float delay){ float along = dot(p.xz, uCourse.xy) + uCourse.z;
  gFogK = uFog.w*clamp((along-uFog.x)/max(uFog.y, 1.) - delay*.6, 0., 1.); }
// distance in the style's own terms: a touch takes one of four steps of the hour's air colour, each on its own threshold
vec3 sfDistance(vec3 col, float dist, float h, float m){
  float p = 1.-exp(-dist/max(mix(uAir.x, uFog.z, gFogK), 1.));
  float q = min(floor(p*5.+h)/5., 1.)*mix(uAir.z, 1., gFogK);
  return mix(col, sfPigNow(0., h < .5 ? 0. : 1., m), q); }
`;

// level breaks that cross every double: the same value for the flipped under-forms (CANVAS_FRAG, uDbl) and the drags
// laid on them (TOUCH_FRAG, uRefl, by vBrk); the under-forms break over 0.6, the drags over their uBrk (BRK below), so
// a break runs across a mass and, narrower, across some of its drags. q = (the world's x + z, the world's y, distance
// from the eye): under the pond's water (y 0) y is negative, and breaks thicken a little with depth, down to 20 m (y
// is the world's: the stream's doubles lie at y 0 to 6 under water at y 6, so there the depth's share is -0.02 to 0).
// The value coarsens by steps of the distance: twice as coarse from 52 m, four times from 104 m, eight from 208 m,
// sixteen from 416 m, doubling on. An under-form takes the distance at each fragment, a drag at its own middle (one
// step for the whole drag), so where a mass straddles a step its drags' breaks and its own can differ, all of a
// drag's gaps are dealt anew as its middle crosses a step, and a short double can be hidden whole at one step and
// shown at the next.
const BREAK_GLSL = /* glsl */`
float sfBreakV(vec3 q){ float sc = exp2(floor(log2(max(q.z/26., 1.))));
  float n = sfNoise(vec2(q.x*.21/sc + 3.7, q.y*2.6/sc));
  float n2 = sfNoise(vec2(q.x*.07 + 9.1, q.y*.9/sc + 2.3));
  return n*.7 + n2*.3 + .07*min(-q.y, 20.)/20.; }
float sfBreak(vec3 q){ return step(.6, sfBreakV(q)); }
`;

const TOUCH_VERT = /* glsl */`
attribute vec4 iA, iB, iC, iD;
uniform float uRefl;
varying vec2 vUv; varying vec3 vColA, vColB; flat varying vec4 vInfo; varying vec3 vBrk;
${STYLE_GLSL}
void main(){
  float role = iD.x, occl = iD.y, seed = iD.z, kind = iD.w, hang = iC.w;
  float h1 = fract(seed*37.37+.11), h2 = fract(seed*91.7+.31), h3 = fract(seed*173.3+.7), h4 = fract(seed*251.9+.53);
  if (role > 23.5) role = sfCloudMap((modelMatrix*vec4(iA.xyz, 1.)).xyz) + (h1-.5)*.2 > .5 ? 3. : 4.;   // a dash of the sky lying on the water: cloud or blue as the cloud map has it there
  mat3 m3 = mat3(modelMatrix);
  vec3 c = (modelMatrix*vec4(iA.xyz, 1.)).xyz;
  vec3 d = m3*iB.xyz; d = d/max(length(d), 1e-4);
  vec3 n = m3*iC.xyz; n = n/max(length(n), 1e-4);
  float len = iA.w, wid = iB.w;
  if (uRefl > .5) { vec2 t = uCam.xz - c.xz; t = t/max(length(t), 1e-3); n = vec3(t.x, 0., t.y); d = vec3(d.x*.3, 1., d.z*.3); d = d/max(length(d), 1e-4); }
  vec3 nLit = n;
  if (uRefl > .5) { nLit = m3*iC.xyz; nLit = nLit/max(length(nLit), 1e-4); }   // a double keeps its source's light and shade  // a reflection is a drag on the water, turned to the eye about the upright
  // the medium's loops: hanging touches swing as pendulums (a strand shares one phase), the gust swings them harder
  float along = dot(c.xz, uCourse.xy) + uCourse.z;
  float gust = uGust.z*(1.-smoothstep(0., max(uGust.y, 1.), abs(along-uGust.x)));
  float ph = sfHash2(floor(iA.xz*.6));
  float hw = min(abs(hang), 6.);
  float sw = sin(uTime*(.55+.5*ph) + ph*6.283 + c.x*.07) + .4*sin(uTime*1.7 + ph*40.);
  vec2 off = uWind.xy*(sw*.065*uWind.z + gust*.3)*hw;
  // the push round the lens is OFF: uPart is 0 (every hanging thing is held clear of the flown line by place, the world's
  // HEM LAW), so push is 0 here and the next line adds nothing to off. (With uPart above 0 these lines pushed hanging
  // touches ahead sideways off the camera's line.)
  vec3 rc = c-uCam; float lat = dot(rc, uCamR), fwd = dot(rc, uCamF);
  float sgn = lat < 0. ? -1. : 1.;
  float push = uPart*max(3.2-abs(lat), 0.)*smoothstep(-3., 1., fwd)*(1.-smoothstep(5., 16., fwd))*min(hw*.5, 1.)*step(.01, hw);
  off += uCamR.xz*sgn*push*.8;
  c.xz += off;
  if (hw > .01) { d.xz -= off/max(hw, .5)*(d.y < 0. ? -1. : 1.); d = d/max(length(d), 1e-4); }
  if (uRefl > .5) c.x += .22*sin(c.y*.9 + uTime*.8 + ph*6.)*(1.+.15*abs(c.y));
  float dist = length(c-uCam);
  // fewer, larger: past uAir.y a touch grows and its neighbours drop out, so the covered area stays
  float g = max(1., dist/max(uAir.y, 1.));
  float keep = smoothstep(0., .12, 1./g - h4*.999 + .12*step(g, 1.001));
  float grow = sqrt(g)*keep;
  if (kind > 3.5) grow *= 1.-uLily*.7;                       // lily flower dabs close
  len *= grow; wid *= grow;
  vec4 cc = projectionMatrix*viewMatrix*vec4(c, 1.);
  float pxk = projectionMatrix[1][1]*uView.y*.5/max(cc.w, .1);   // pixels per metre at the touch
  // at arm's length a mark is a bristle streak: nothing wider than a fortieth of the frame (pads and flower dabs lie as they are)
  float capS = (kind > 1.5) ? (kind > 2.5 && kind < 3.5 ? min(1., .026*uView.x/max(wid*pxk, 1e-3)) : 1.) : min(1., .026*uView.x/max(wid*pxk, 1e-3));
  len *= mix(1., capS, .8); wid *= capS;
  float minW = 1.6/pxk*step(.001, grow);
  wid = max(wid, minW); len = max(len, minW*2.2);
  vec3 a = cross(n, d); a = a/max(length(a), 1e-4);
  c += n*((h1-.5)*.05*(1.+dist*.03));                         // impasto: touches stack, never share a plane
  vec3 wp = c + d*(position.x*len) + a*(position.y*wid);
  // pigment: light or shade by the hour's light, two pigments a role, the hour's front against this touch's delay
  float m = sfHourMix(c, h3);
  sfSetFog(c, h3);
  float lit = step(occl + .40 + (h2-.5)*.3, dot(nLit, uLight)*.5+.5);
  lit *= 1.-step(.5, sfCloud(c) + (h2-.5)*.2);
  float pick = step(.5, h1);
  float base = mix(2., 0., lit);
  vec3 cA = sfPigNow(role, base+pick, m), cB = sfPigNow(role, base+1.-pick, m);
  float P = 5.+6.*h2, tri = abs(fract(uTime/P + h1*9.)*2.-1.);
  float tw = smoothstep(.3, .7, tri)*step(h4, uTwinkle)*smoothstep(5., 8., len*pxk);
  tw = max(tw, gust*step(h4, .6));                            // the gust silvers: touches show their other pigment
  vec3 colA = mix(cA, cB, tw), colB = mix(cB, cA, tw);
  vColA = sfDistance(colA, dist, h2, m); vColB = sfDistance(colB, dist, h2, m);
  vUv = position.xy; vInfo = vec4(kind, seed, wid*pxk, 0.);   // the same at every corner of a touch (flat)
  vBrk = vec3(wp.x + wp.z, wp.y, dist);                       // for sfBreak: this corner's own place in the world, and the touch's distance from the eye (one for the whole touch)
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;

const TOUCH_FRAG = /* glsl */`
uniform vec3 uGround; uniform float uRefl, uBrk;
varying vec2 vUv; varying vec3 vColA, vColB; flat varying vec4 vInfo; varying vec3 vBrk;
float sfHash(float n){ return fract(sin(n*12.9898+4.1414)*43758.5453); }
float sfHash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float sfNoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(sfHash2(i), sfHash2(i+vec2(1.,0.)), f.x), mix(sfHash2(i+vec2(0.,1.)), sfHash2(i+vec2(1.,1.)), f.x), f.y); }
${BREAK_GLSL}
void main(){
  float kind = vInfo.x, seed = vInfo.y;
  float fine = smoothstep(3., 9., vInfo.z);          // bristles are drawn only where they are wider than a pixel
  float u = vUv.x, v = vUv.y, fb, b;
  if (kind > 1.5 && kind < 2.5) {                     // a lily pad: one level ellipse, ragged rim, a notch
    vec2 q = vUv; if (dot(q, q) < 1e-8) q = vec2(1e-4, 0.);
    float r = length(q)*2., ang = atan(q.y, q.x);
    float rag = .72 + .28*sfNoise(vec2(ang*1.9 + seed*30., seed*5.)) - .1*sfNoise(vec2(ang*7. + seed*3., 2.));
    float da = abs(ang - (seed*6.283-3.1416));
    if (r > rag || (da < .16*fine && r > .3)) discard;
    fb = (v+.5)*7. + .9*sfNoise(vec2(u*5. + seed*17., seed*3.)); b = floor(fb);
    if (sfHash2(vec2(b + seed*61., floor(u*7. + sfHash(b + seed*5.)*3.))) > mix(1.1, .9, fine)) discard;
  } else {
    if (kind > .5 && kind < 1.5 || kind > 3.5) {      // a curled dab: the press turns as it lifts
      v += (u*u-.07)*1.25*(fract(seed*7.7) < .5 ? 1. : -1.); v *= 1.75;
    }
    if (abs(v) > .5) discard;
    fb = (v+.5)*7.; b = floor(fb);
    float hb = sfHash(b*13.1 + seed*97.), hb2 = sfHash(b*7.7 + seed*31. + 3.);
    float drag = step(2.5, kind)*step(kind, 3.5);
    float e0 = -.5 + (.02 + .26*hb*hb)*fine, e1 = .5 - (.02 + (.3 + .2*drag)*hb2*hb2)*fine;
    float edge = abs(v) - (.5 - .2*smoothstep(.2, .5, abs(u)) - .12*fine*sfNoise(vec2(u*7. + seed*50., seed*9. + v)));
    if (u < e0 || u > e1 || edge > 0.) discard;
    float gap = sfHash2(vec2(b + seed*61., floor(u*6. + hb*3.)));
    if (gap > mix(1.1, .89 - .09*drag, fine)) discard;   // dry brush: the ground or the touch beneath shows
  }
  float ridge = sfHash(b*3.3 + seed*11.);
  vec3 col = mix(vColA, vColB, mix(.25, step(.62, ridge)*.8, fine));
  float crest = smoothstep(.25, 0., fract(fb))*step(.5, sfHash(b*5.1 + seed*23.));
  col = mix(col, uGround, crest*.3*fine);              // a loaded bristle ridge catches white
  if (uRefl > .5 && sfBreakV(vBrk) > uBrk) discard;     // a double is crossed by level breaks: where a band lies the drag is not drawn, and the water or what lies behind shows (uBrk: BRK below)
  gl_FragColor = vec4(col, 1.);
}`;

// The touch material: every instanced touch of the world, one program. reflect: true for the flipped copies under water.
// HOW STRONGLY A DOUBLE'S DRAGS ARE BROKEN (typed once): a drag is not drawn where the break's value (sfBreakV) is over
// its material's uBrk. The flipped under-forms break at 0.6 (sfBreak); a drag breaks only at a higher value, so a
// break of a drag lies inside a break of its under-form and is narrower wherever the drag's middle and the
// under-form's fragment take the same step of coarseness (near 52, 104 and 208 m from the eye they can differ). Why
// not 0.6 for the drags too: there more than a third of every drag's length is not drawn, many short doubles vanish
// whole (at 0.74 a few still do) and the footbridge's arch in the water is torn to scraps. POND: the pond's doubles
// (the willows', the banks', the landing's). STREAM and BRIDGE: gentler still, the poplars' trunks and the bridge's
// arch are the picture there. NONE: never broken (the rowboat's few short doubles).
export const BRK = { POND: 0.74, STREAM: 0.8, BRIDGE: 0.8, NONE: 9 };
export function touchMaterial(uniforms, { reflect = false, brk = BRK.POND } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uRefl: { value: reflect ? 1 : 0 }, uBrk: { value: brk } }, uniforms),
    vertexShader: TOUCH_VERT, fragmentShader: TOUCH_FRAG, side: THREE.DoubleSide,
  });
}

export const KIND = { STREAK: 0, CURL: 1, PAD: 2, DRAG: 3, FLOWER: 4 };

// Collects touches, then makes one instanced mesh of them.
//   add(p, dir, nrm, len, wid, role, occl, kind, hang): p centre, dir the way the stroke runs ON its form, nrm the form's
//   normal there, len/wid in metres, occl 0 open .. 1 always in shade, hang = metres below the point it hangs from (0 fixed).
export class TouchBatch {
  constructor(rng, detail = 1, cap = 4096) { this.rng = rng; this.detail = detail; this.n = 0; this.cap = cap; this.A = new Float32Array(cap * 16); }
  add(px, py, pz, dx, dy, dz, nx, ny, nz, len, wid, role, occl = 0, kind = 0, hang = 0, thin = true) {
    const seed = this.rng();
    if (thin && this.detail < 1) { if (((seed * 7.13) % 1) > this.detail) return; const k = 1 / Math.sqrt(this.detail); len *= k; wid *= k; }
    if (this.n === this.cap) { this.cap *= 2; const B = new Float32Array(this.cap * 16); B.set(this.A); this.A = B; }
    const A = this.A, o = this.n++ * 16;
    A[o] = px; A[o + 1] = py; A[o + 2] = pz; A[o + 3] = len;
    A[o + 4] = dx; A[o + 5] = dy; A[o + 6] = dz; A[o + 7] = wid;
    A[o + 8] = nx; A[o + 9] = ny; A[o + 10] = nz; A[o + 11] = hang;
    A[o + 12] = role; A[o + 13] = occl; A[o + 14] = seed; A[o + 15] = kind;
  }
  // flipped copies for the water: every nth touch above the water becomes a longer vertical drag below it
  // shade: non-accent roles are laid in their shade pigment (occl raised to this); roses, flowers, rims, wisteria and the boat keep theirs
  reflectInto(dst, every = 2, stretch = 2.2, from = 0, to = this.n, maxY = 1e9, shade = 1.5, minY = 0.05) {
    const A = this.A;
    for (let i = from; i < to; i++) {
      const o = i * 16; if (A[o + 1] < minY || A[o + 1] > maxY) continue;
      if (((A[o + 14] * 53.7) % 1) * every > 1) continue;
      const k = Math.sqrt(every);
      dst.add(A[o], -A[o + 1] * 1.0, A[o + 2], A[o + 4] * 0.25, 1, A[o + 6] * 0.25, A[o + 8], A[o + 9], A[o + 10],
        Math.max(A[o + 3], A[o + 7]) * stretch * k, Math.max(A[o + 7] * k * 0.6, 0.1), A[o + 12], (A[o + 12] === 9 || A[o + 12] === 11 || A[o + 12] === 12 || A[o + 12] === 17 || A[o + 12] === 21) ? A[o + 13] : Math.max(A[o + 13], shade), KIND.DRAG, A[o + 11], false);
    }
  }
  mesh(material) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const ib = new THREE.InstancedInterleavedBuffer(this.A.subarray(0, this.n * 16), 16);
    g.setAttribute('iA', new THREE.InterleavedBufferAttribute(ib, 4, 0));
    g.setAttribute('iB', new THREE.InterleavedBufferAttribute(ib, 4, 4));
    g.setAttribute('iC', new THREE.InterleavedBufferAttribute(ib, 4, 8));
    g.setAttribute('iD', new THREE.InterleavedBufferAttribute(ib, 4, 12));
    g.instanceCount = this.n;
    const m = new THREE.Mesh(g, material); m.frustumCulled = false; return m;
  }
}

// ------------------------------------------------------------------ the touch canvas (under-forms)
// Geometry needs: position, normal, uv = paint coordinates in METRES (u runs the way the strokes run on that form),
// and aRole = vec2(role, occl). Cells of two sizes are world-anchored streaks; under 4 px they become their mean tint.
const CANVAS_VERT = /* glsl */`
attribute vec2 aRole;
varying vec2 vPaint, vRole; varying vec3 vWp, vN;
void main(){
  vPaint = uv; vRole = aRole;
  vec4 w = modelMatrix*vec4(position, 1.); vWp = w.xyz;
  vN = mat3(modelMatrix)*normal;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const CANVAS_FRAG = /* glsl */`
varying vec2 vPaint, vRole; varying vec3 vWp, vN;
uniform vec4 uCell; uniform vec3 uMode; uniform float uFlow, uDbl;   // small cell (len, wid), large cell (len, wid); mode: water 0/1, slide speed, chink share
${STYLE_GLSL}
float gM, gDist; vec3 gN;
${BREAK_GLSL}
float gCellH;
vec4 sfCellLayer(vec2 p, vec2 size, float role, float occl, float so, float fine){
  vec2 q = p/size;
  q.y += .26*(sfNoise(q*vec2(.8, .35) + so) - .5) + .3*(sfNoise(q*vec2(2.3, .9) + so + 5.) - .5);           // rows are never ruled
  float row = floor(q.y);
  q.x += sfHash(row*1.7 + so)*7.3 + uTime*uMode.y*mix(mod(row, 2.) < 1. ? 1. : -1., 1., uFlow)/size.x;
  vec2 id = floor(q), f = fract(q)-.5;
  float h1 = sfHash2(id + so), h2 = sfHash2(id*1.31 + 7.7 + so), h3 = sfHash2(id*.77 + 3.3 + so), h4 = sfHash2(id*2.1 + 9.1 + so);
  float bb = floor((f.y+.5)*5.), hb = sfHash2(id + bb*3.1 + so), hb2 = sfHash2(id*1.7 + bb*5.3 + so);
  // one press of a flat brush: each its own length, the ends rounded and ragged bristle by bristle, never a ruled joint
  float ty = f.y*2., tap = .15*ty*ty*fine, sh = sfHash2(id*4.3 + 1.7 + so);
  float e0 = -.5 + (.015 + .2*sh*sh + .2*hb*hb)*fine + tap, e1 = .5 - (.015 + .2*h4*h4 + .26*hb2*hb2)*fine - tap;
  float inside = step(e0, f.x)*step(f.x, e1)*step(abs(f.y), .5 - .035*h2*fine);
  inside *= step(sfHash2(id*3.7 + bb + floor(f.x*5.)), 1.-.07*fine);
  float m = clamp(gM + (.5-h3)*uCourse.w*.6, 0., 1.);
  // the press beneath shows in the gaps: it belongs to a lattice of its own, so the chinks never draw a grid
  vec2 q2 = q*vec2(.63, 1.) + vec2(.31, .5); vec2 id2 = floor(q2);
  float g1 = sfHash2(id2*1.9 + so + 2.), g2 = sfHash2(id2*2.7 + so + 4.);
  float cloud = 0., cloud2 = 0., csh = 0.;
  if (uMode.x > .5) {                                        // water is the sky upside down: cloud touches by a slow map
    float cn = sfCloudMap(vWp);
    cloud = step(.5, cn + (h1-.5)*.2); cloud2 = step(.5, cn + (g1-.5)*.2);
    csh = step(cn, .55 + (h2-.5)*.08);                       // a cloud's edge is its mauve and rose shade
  }
  float r2 = mix(role, 3., cloud), r3 = mix(role, 3., cloud2);
  float lit = step(occl + .40 + (h2-.5)*.3, dot(gN, uLight)*.5+.5);
  lit *= 1.-step(.5, sfCloud(vWp) + (h2-.5)*.2);
  lit *= 1.-uDbl;                                            // a double is laid in its mass's shade pigments
  float litC = lit*(1.-cloud*csh);
  float base = mix(2., 0., litC), pick = step(.5, h1);
  vec3 col = sfPigNow(r2, base + pick, m), under = sfPigNow(r2, base + 1.-pick, m);
  vec3 below = sfPigNow(r3, mix(2., 0., lit*(1.-cloud2*csh)) + step(.5, g2), m);
  float P = 5. + 6.*h2, tri = abs(fract(uTime/P + h1*9.)*2.-1.);
  float tw = smoothstep(.3, .7, tri)*step(h4, uTwinkle)*fine;
  vec3 c2 = mix(col, under, tw);
  c2 = mix(c2, mix(under, col, tw), step(.6, hb)*.6*fine);    // bristle ridges carry the second pigment
  vec3 chink = mix(below, uGround, step(sfHash2(id*5.3 + bb*1.9 + so), uMode.z*2.)*step(g1, .5));   // another press beneath, primed canvas in a few chinks
  gCellH = sh;
  return vec4(sfDistance(mix(chink, c2, inside), gDist, h2, m), inside);
}
void main(){
  gN = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) gN = -gN;
  gDist = length(vWp - uCam); gM = sfHourMix(vWp, .5); sfSetFog(vWp, .5);
  vec2 fw = fwidth(vPaint); float f1 = max(max(fw.x*.4, fw.y), 1e-5);
  // the hand wanders: paint coordinates are bent a little so rows are never ruled
  vec2 p = vPaint + vec2(0., .35*uCell.w)*(sfNoise(vPaint*vec2(.9, 2.)/max(uCell.z, .01)) - .5)*2.;
  float pxS = uCell.y/f1, pxL = uCell.w/f1;
  // fewer, larger: the cell size steps up by four whenever a cell would fall under about 6 px (the style's distance rule)
  float lod = clamp(log2(7./max(pxL, 1e-3))*.5, 0., 2.);
  float k0 = floor(lod), fr = lod-k0, sc = exp2(2.*k0);
  float tn = smoothstep(.6, 1., fr)*step(lod, 1.999);
  float fS = smoothstep(4., 8., pxS), fL = smoothstep(2.5, 5., pxL*sc*mix(1., 4., tn));
  float fineL = smoothstep(6., 14., pxL*sc);                  // bristles only where a bristle is wider than a pixel
  vec3 col = sfCellLayer(p, uCell.zw*sc, vRole.x, vRole.y, k0*5., fineL).rgb;
  // fewer, larger arrive press by press over the finer crust, and the small touches lie over the large in patches:
  // sizes overlap, a layer never fades in as a sheet
  if (tn > 0.) { vec4 big = sfCellLayer(p, uCell.zw*sc*4., vRole.x, vRole.y, k0*5.+5., 1.); col = mix(col, big.rgb, big.a*smoothstep(gCellH*.8, gCellH*.8 + .2, tn)); }
  if (fS > 0.) { vec4 sm = sfCellLayer(p, uCell.xy, vRole.x, vRole.y, 17., fS); col = mix(col, sm.rgb, fS*sm.a*step(gCellH, .66)); }
  if (fL < 1.) {                                              // too fine to draw: the mean tint of the crust, no shimmer
    float cloud = uMode.x > .5 ? step(.5, sfCloudMap(vWp)) : 0.;
    float lit = smoothstep(vRole.y + .2, vRole.y + .4, dot(gN, uLight)*.5+.5)*(1.-sfCloud(vWp))*(1.-uDbl);
    float r2 = mix(vRole.x, 3., cloud);
    vec3 a = mix(sfPigNow(r2, 2., gM), sfPigNow(r2, 0., gM), lit), b = mix(sfPigNow(r2, 3., gM), sfPigNow(r2, 1., gM), lit);
    col = mix(sfDistance(mix(mix(a, b, .5), uGround, uMode.z*.5), gDist, .5, gM), col, fL);
  }
  if (uDbl > .5) {                                            // a double: level dashes of water cross it, its lower fringe is ragged
    float col1 = sfNoise(vec2((vWp.x + vWp.z)*.8, 1.3)), col2 = sfNoise(vec2((vWp.x + vWp.z)*.19, 5.7));
    if (sfBreak(vec3(vWp.x + vWp.z, vWp.y, gDist)) > .5 || vRole.y > .5 + .3*col2 + .2*col1) discard;
  }
  gl_FragColor = vec4(col, 1.);
}`;

// Under-form material. opts: water (cells take the cloud map), slide (m/s, alternate rows slide: stream dashes),
// small/large = [length, width] of the two cell sizes in metres, chink = share of cells left as bare ground.
// double: true = a flipped under-form below the water (aRole.y = depth as a share of the mass's height, 0 at the water line).
export function canvasMaterial(uniforms, { water = false, slide = 0, small = [0.3, 0.085], large = [1.3, 0.36], chink = 0.08, side = THREE.DoubleSide, flow = 0, double = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uCell: { value: new THREE.Vector4(small[0], small[1], large[0], large[1]) }, uMode: { value: new THREE.Vector3(water ? 1 : 0, slide, chink) }, uFlow: { value: flow }, uDbl: { value: double ? 1 : 0 } }, uniforms),
    vertexShader: CANVAS_VERT, fragmentShader: CANVAS_FRAG, side,
  });
}

// One call for the whole look: pigments, strip, shared uniforms, and the factories bound to them.
export function makeStyle(palette = PALETTE, edition = 'clear') {
  const pigments = makePigments(palette, edition), strip = makeStrip(pigments), uniforms = makeStyleUniforms(strip, pigments);
  return {
    pigments, strip, uniforms,
    touchMaterial: (o) => touchMaterial(uniforms, o), canvasMaterial: (o) => canvasMaterial(uniforms, o),
    // call once a frame (the hero's update does it for you when the hero made the style)
    frame(time, camera, renderer) {
      uniforms.uTime.value = time;
      const e = camera.matrixWorld.elements;
      uniforms.uCam.value.set(e[12], e[13], e[14]);
      uniforms.uCamR.value.set(e[0], e[1], e[2]).normalize();
      uniforms.uCamF.value.set(-e[8], -e[9], -e[10]).normalize();
      if (renderer) renderer.getDrawingBufferSize(uniforms.uView.value);
    },
    // hours: a = the hour arriving from behind, b = the hour still ahead, place = where the front stands along the course
    setHours(a, b, place, fade = 50) { uniforms.uFront.value.set(a, b, place, fade); },
    dispose() { strip.dispose(); },
  };
}

// ------------------------------------------------------------------ under-form builder
// Collects triangles for canvasMaterial: every vertex carries paint coordinates in metres and a role.
export class FormBatch {
  constructor() { this.p = []; this.n = []; this.uv = []; this.r = []; this.i = []; this.count = 0; }
  vert(x, y, z, nx, ny, nz, u, v, role, occl = 0) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v); this.r.push(role, occl); return this.count++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // a tube along pts [{x,y,z,r}], strokes running round it (stacked dabs) or along it
  tube(pts, role, occl = 0, seg = 8, along = false, squash = 1) {
    const rings = [], up = new THREE.Vector3(0, 0, 1), t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    let s = 0;
    for (let k = 0; k < pts.length; k++) {
      const P = pts[k], Q = pts[Math.min(k + 1, pts.length - 1)], O = pts[Math.max(k - 1, 0)];
      t.set(Q.x - O.x, Q.y - O.y, Q.z - O.z).normalize();
      a.crossVectors(t, up); if (a.lengthSq() < 1e-6) a.set(1, 0, 0); a.normalize(); b.crossVectors(a, t).normalize();
      if (k > 0) s += Math.hypot(P.x - O.x, P.y - O.y, P.z - O.z);
      const ring = [];
      for (let j = 0; j <= seg; j++) {
        const th = (j / seg) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th) * squash;
        const nx = a.x * c + b.x * sn, ny = a.y * c + b.y * sn, nz = a.z * c + b.z * sn;
        const around = (j / seg) * Math.PI * 2 * P.r;
        ring.push(this.vert(P.x + nx * P.r, P.y + ny * P.r, P.z + nz * P.r, nx, ny, nz, along ? s : around, along ? around : s, role, occl));
      }
      rings.push(ring);
    }
    for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < seg; j++) this.quad(rings[k][j], rings[k][j + 1], rings[k + 1][j + 1], rings[k + 1][j]);
  }
  mesh(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aRole', new THREE.Float32BufferAttribute(this.r, 2));
    g.setIndex(this.i);
    return new THREE.Mesh(g, material);
  }
}

// ------------------------------------------------------------------ the footbridge at white noon
const HALF = 22;                               // half span, m
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, Y = () => ctx.yield ? ctx.yield() : null;
  const detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyle(opts.palette || PALETTE);
  const ownStyle = !opts.style;
  const root = new THREE.Group(); root.name = 'footbridge-at-noon';
  const T = new TouchBatch(rng, detail, 32768);        // everything above the water
  const F = new FormBatch();
  // per-seed character
  const rise = rng.range(6.6, 7.0), foot = 8 - rise;   // underside: foot at the banks, crown 8 m clear
  const bays = rng.int(7, 9);                          // trellis bays
  const trellisH = rng.range(5.3, 5.8);
  const whiteWist = rng.range(0.15, 0.45);             // share of white-cut racemes
  const deckW = 2.1;                                   // half width of the deck
  const yU = (x) => foot + rise * (1 - (x / HALF) * (x / HALF));          // deck underside
  const slope = (x) => -2 * rise * x / (HALF * HALF);
  const TH = 0.62;
  // ---- deck slab under-form (sides along the span, underside across it)
  const NX = 44; let s = 0; const arc = [0];
  for (let i = 1; i <= NX; i++) { const x0 = -HALF + (i - 1) * 2 * HALF / NX, x1 = x0 + 2 * HALF / NX; s += Math.hypot(x1 - x0, yU(x1) - yU(x0)); arc.push(s); }
  const arcLen = s;
  for (const face of ['top', 'bottom', 'front', 'back']) {
    const prev = [];
    for (let i = 0; i <= NX; i++) {
      const x = -HALF + i * 2 * HALF / NX, y = yU(x), sl = slope(x), il = 1 / Math.hypot(1, sl);
      let a, b;
      if (face === 'top') { a = F.vert(x, y + TH, -deckW, -sl * il, il, 0, arc[i], 0, ROLE.BRIDGE, -0.1); b = F.vert(x, y + TH, deckW, -sl * il, il, 0, arc[i], 2 * deckW, ROLE.BRIDGE, -0.1); }
      else if (face === 'bottom') { a = F.vert(x, y, deckW, sl * il, -il, 0, deckW, arc[i], ROLE.DEEP, 0.2); b = F.vert(x, y, -deckW, sl * il, -il, 0, -deckW, arc[i], ROLE.DEEP, 0.2); }
      else { const z = face === 'front' ? deckW : -deckW, nz = face === 'front' ? 1 : -1; a = F.vert(x, y, z, 0, 0, nz, arc[i], 0, ROLE.BRIDGE, 0.05); b = F.vert(x, y + TH, z, 0, 0, nz, arc[i], TH, ROLE.BRIDGE, 0.05); }
      if (i > 0) F.quad(prev[0], a, b, prev[1]);
      prev[0] = a; prev[1] = b;
    }
  }
  // ---- deck touches: fascia rows, plank-wise underside with lemon chinks, top
  const stepAlong = (ds, fn) => { for (let d = 0; d < arcLen; d += ds) { const x = -HALF + (d / arcLen) * 2 * HALF * 1; fn(x, yU(x), slope(x)); } };
  for (const zs of [1, -1]) for (let row = 0; row < 3; row++) stepAlong(0.26, (x, y, sl) => {
    const il = 1 / Math.hypot(1, sl), w = rng.range(-0.25, 0.25);
    T.add(x + rng.range(-0.1, 0.1), y + 0.1 + row * 0.24 + rng.range(-0.05, 0.05), zs * (deckW + 0.03), il, (sl + w) * il, 0, 0, 0, zs, rng.range(0.34, 0.52), rng.range(0.15, 0.22), rng.chance(0.04) ? ROLE.RIM : ROLE.BRIDGE, row === 0 ? 0.25 : 0.0, KIND.STREAK, 0, false);
  });
  stepAlong(0.21, (x, y, sl) => {
    const il = 1 / Math.hypot(1, sl);
    for (let z = -deckW + 0.3; z < deckW; z += 0.52) {
      const q = rng(), chink = q > 0.9;
      T.add(x + rng.range(-0.06, 0.06), y - 0.03, z + rng.range(-0.15, 0.15), rng.range(-0.2, 0.2), 0, 1, sl * il, -il, 0, chink ? rng.range(0.5, 0.9) : rng.range(0.5, 0.75), chink ? 0.055 : rng.range(0.15, 0.22),
        chink ? ROLE.RIM : q < 0.2 ? ROLE.DEEP : q < 0.42 ? ROLE.FOLIAGE : ROLE.BRIDGE, chink ? -1 : 0.3, KIND.STREAK, 0, chink);
    }
  });
  stepAlong(0.3, (x, y, sl) => {
    const il = 1 / Math.hypot(1, sl);
    for (let z = -deckW + 0.25; z < deckW; z += 0.6) T.add(x + rng.range(-0.1, 0.1), y + TH + 0.02, z + rng.range(-0.2, 0.2), il, sl * il, rng.range(-0.25, 0.25), -sl * il, il, 0, rng.range(0.45, 0.7), rng.range(0.16, 0.24), rng.chance(0.3) ? ROLE.RIM : ROLE.BRIDGE, -0.2);
  });
  await Y();
  // ---- rails: ribbons of stacked touches (lemon on top, viridian on the face, violet beneath), never a cylinder
  const rail = (h, z, zs, fat) => stepAlong(0.2, (x, y, sl) => {
    const il = 1 / Math.hypot(1, sl), yy = y + TH + h, L = () => rng.range(0.3, 0.44);
    T.add(x, yy + fat * 0.5, z, il, sl * il, rng.range(-0.08, 0.08), -sl * il, il, 0, L(), fat * 1.25, ROLE.RIM, -1, KIND.STREAK, 0, false);
    T.add(x + 0.1, yy, z + zs * fat * 0.5, il, (sl + rng.range(-0.12, 0.12)) * il, 0, 0, 0, zs, L(), fat * 1.5, ROLE.BRIDGE, 0, KIND.STREAK, 0, false);
    if (rng.chance(0.6)) T.add(x + 0.05, yy - fat * 0.5, z, il, sl * il, 0, sl * il, -il, 0, L(), fat * 1.2, ROLE.BRIDGE, 1, KIND.STREAK, 0, false);
  });
  for (const zs of [1, -1]) { rail(1.12, zs * deckW, zs, 0.15); rail(0.58, zs * deckW, zs, 0.11); }
  for (const zs of [1, -1]) for (let x = -HALF + 0.6; x < HALF; x += 1.45) {      // balusters
    const y = yU(x) + TH;
    for (let k = 0; k < 3; k++) T.add(x + rng.range(-0.03, 0.03), y + 0.2 + k * 0.36, zs * (deckW + 0.02), rng.range(-0.1, 0.1), 1, 0, 0, 0, zs, 0.4, 0.1, ROLE.BRIDGE, k === 0 ? 0.3 : 0, KIND.STREAK, 0, false);
  }
  await Y();
  // ---- the trellis: posts, two arched top beams, cross bars
  const topY = (x) => yU(x) + TH + trellisH * (0.9 + 0.1 * (1 - (x / HALF) * (x / HALF)));
  const postX = []; for (let i = 0; i <= bays; i++) postX.push(-HALF * 0.93 + i * (2 * HALF * 0.93 / bays));
  for (const zs of [1, -1]) for (const x of postX) {
    const y0 = yU(x) + TH, y1 = topY(x);
    for (let y = y0 + 0.15; y < y1; y += 0.3) {
      T.add(x + rng.range(-0.03, 0.03), y, zs * (deckW + 0.08), rng.range(-0.08, 0.08), 1, 0, 0, 0, zs, rng.range(0.4, 0.5), 0.15, rng.chance(0.15) ? ROLE.RIM : ROLE.BRIDGE, 0, KIND.STREAK, 0, false);
      T.add(x + (rng.chance(0.5) ? 0.08 : -0.08), y + 0.1, zs * deckW, 0, 1, rng.range(-0.08, 0.08), x < 0 ? -1 : 1, 0, 0.2 * zs, rng.range(0.4, 0.5), 0.13, ROLE.BRIDGE, 0.35, KIND.STREAK, 0, false);
    }
  }
  for (const zs of [1, -1]) for (const dz of [0, -0.7]) stepAlong(0.22, (x, y, sl) => {
    const il = 1 / Math.hypot(1, sl), yy = topY(x), z = zs * (deckW + 0.08 + dz);
    T.add(x, yy, z + zs * 0.06, il, sl * il * 0.9, 0, 0, 0.2, zs, rng.range(0.36, 0.5), 0.15, ROLE.BRIDGE, 0, KIND.STREAK, 0, false);
    if (rng.chance(0.5)) T.add(x, yy + 0.07, z, il, sl * il * 0.9, 0, 0, 1, 0, 0.4, 0.13, ROLE.RIM, -1, KIND.STREAK, 0, false);
  });
  for (let x = -HALF * 0.93; x <= HALF * 0.93; x += 1.1) for (let z = -deckW; z < deckW; z += 0.42)
    T.add(x, topY(x) + 0.05, z + 0.2, rng.range(-0.1, 0.1), 0, 1, 0, 1, 0, 0.5, 0.12, ROLE.BRIDGE, rng.chance(0.5) ? 0 : 0.6, KIND.STREAK, 0, false);
  await Y();
  // ---- wisteria: leaf commas heaped on the trellis, racemes of curled mauve dabs down both faces
  stepAlong(0.3, (x, y, sl) => {
    const yy = topY(x);
    for (const zs of [1, -1]) for (let k = 0; k < 5; k++) {
      const up = rng.range(-0.5, 1.1), out = rng.range(-0.9, 0.5);
      T.add(x + rng.range(-0.3, 0.3), yy + up, zs * (deckW + 0.25 + out * 0.6), rng.range(-0.6, 0.6), rng.range(-1, 0.3), rng.range(-0.3, 0.3), rng.range(-0.3, 0.3), 0.5 + up * 0.6, zs * (0.9 + out * 0.4),
        rng.range(0.45, 0.75), rng.range(0.28, 0.42), ROLE.FOLIAGE, up < -0.1 ? 0.45 : 0, KIND.CURL, 0);
    }
    if (rng.chance(0.7)) T.add(x, yy + rng.range(0.2, 0.7), rng.range(-deckW, deckW), 1, 0.2, rng.range(-0.5, 0.5), 0, 1, 0, rng.range(0.4, 0.6), 0.28, ROLE.FOLIAGE, -0.3, KIND.CURL, 0);
  });
  // THE HEM LAW at the bridge (the world's law of place; it comes in as opts.hem): a raceme anchored where the law gives
  // a floor ends no lower than that floor. It is shortened from the tip: the dabs that could reach under the floor (by
  // their largest drawn size) are not laid, and with under hem.min of raceme left none is. Every draw of a dab that is
  // not laid is still drawn, and the number add() would draw too, so everything else stands where it stood.
  const hem = opts.hem || null, kDab = detail < 1 ? 1 / Math.sqrt(detail) : 1; let owedDbl = 0;
  const raceme = (ax, ay, az, len, zs, white, occ) => {
    const n = Math.max(3, Math.round(len / 0.27)), lean = rng.range(-0.12, 0.12);
    let keep = n; const fl = hem ? hem.floor(ax, az) : -Infinity;
    if (fl > -1e8) { keep = 0; while (keep < n) { const t = (keep + 0.5) / n; if (ay - t * len - (0.2 + 0.3 * (1 - t * 0.72)) * 0.6 * (keep > 1 ? kDab : 1) < fl) break; keep++; } if (keep / n * len < hem.min) keep = 0; }
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, w = 1 - t * 0.72, size = (0.2 + 0.3 * w) * rng.range(0.85, 1.2);
      const px = ax + lean * t * len + rng.range(-0.2, 0.2) * w, pz = az + rng.range(-0.16, 0.16) * w, dx = rng.range(-0.5, 0.5), dz = rng.range(-0.2, 0.2), nx = rng.range(-0.5, 0.5), oc = white ? -1 : occ + (rng.chance(0.3) ? 0.3 : 0);
      if (k >= keep) {                                             // not laid: its number is drawn and thrown away; the double it would have had is owed to the stream
        const sd = rng(); if (!(k > 1 && detail < 1 && ((sd * 7.13) % 1) > detail) && ay - t * len >= 0.05 && ((Math.fround(sd) * 53.7) % 1) * 1.6 <= 1) owedDbl++;
        continue;
      }
      T.add(px, ay - t * len, pz, dx, -1, dz, nx, 0.25, zs, size, size * 0.62, ROLE.WISTERIA, oc, KIND.CURL, t * len + 0.25, k > 1);
    }
  };
  let nRac = 0;
  for (const zs of [1, -1]) {
    for (let x = -HALF * 0.95; x < HALF * 0.95; x += rng.range(0.38, 0.72)) {       // upper tier, from the top beams
      raceme(x, topY(x) - rng.range(0, 0.4), zs * (deckW + rng.range(0.15, 0.6)), rng.range(2.0, 4.0), zs, rng.chance(whiteWist), 0); nRac++;
      if (rng.chance(0.35)) raceme(x + 0.2, topY(x) - 0.3, zs * rng.range(0.2, deckW - 0.3), rng.range(1.2, 2.6), zs, false, 0.4);
    }
    for (let x = -HALF * 0.97; x < HALF * 0.97; x += rng.range(0.3, 0.55)) {         // lower tier, off the rail and fascia
      const ay = yU(x) + rng.range(-0.05, 0.12), tip = Math.max(4 + rng.range(0, 1.6) * rng(), 1.3), len = Math.min(4.2, ay - tip);
      if (len > 0.7) { raceme(x, ay, zs * (deckW + rng.range(-0.3, 0.3)), len * rng.range(0.6, 1), zs, rng.chance(whiteWist), 0.15); nRac++; }
      else if (ay > 2.4 && rng.chance(0.6)) { raceme(x, ay, zs * (deckW + rng.range(-0.2, 0.3)), Math.min(2.4, ay - 1.3) * rng.range(0.5, 1), zs, false, 0.15); nRac++; }
    }
    await Y();
  }
  const nBridge = T.n;
  // ---- the banks: two low mounds of upright grass touches, irises at the water's edge
  const moundH = foot + 0.55, moundRx = rng.range(10, 12), moundRz = rng.range(12, 15);
  const moundY = (x, z, side) => { const dx = (x - side * (HALF + 3.5)) / moundRx, dz = z / moundRz, r2 = dx * dx + dz * dz; return r2 >= 1 ? 0 : moundH * Math.pow(1 - r2, 1.5); };
  for (const side of [-1, 1]) {
    const cx = side * (HALF + 3.5), ring = [];
    const cv = F.vert(cx, moundH, 0, 0, 1, 0, 0, cx, ROLE.GRASS, 0);
    for (let j = 1; j <= 6; j++) {
      const r = j / 6, row = [];
      for (let k = 0; k <= 24; k++) {
        const th = (k / 24) * Math.PI * 2, x = cx + Math.cos(th) * r * moundRx, z = Math.sin(th) * r * moundRz;
        row.push(F.vert(x, moundY(x, z, side), z, Math.cos(th) * r * 0.5, 1, Math.sin(th) * r * 0.5, z, x, ROLE.GRASS, 0));
      }
      for (let k = 0; k < 24; k++) { if (j === 1) F.tri(cv, row[k + 1], row[k]); else F.quad(ring[k], ring[k + 1], row[k + 1], row[k]); }
      ring.length = 0; ring.push(...row);
    }
    for (let i = 0; i < 900; i++) {
      const th = rng() * Math.PI * 2, r = Math.sqrt(rng()), x = cx + Math.cos(th) * r * moundRx, z = Math.sin(th) * r * moundRz, edge = r > 0.86;
      const y = moundY(x, z, side), hgt = edge ? rng.range(0.6, 1.1) : rng.range(0.3, 0.6), fz = rng.sign();
      T.add(x, y + hgt * 0.45, z, rng.range(-0.25, 0.25), 1, 0, rng.range(-0.5, 0.5), 0.35, fz, hgt, hgt * (edge ? 0.2 : 0.3),
        edge && rng.chance(0.45) ? ROLE.IRIS : rng.chance(0.12) ? ROLE.RIM : ROLE.GRASS, rng.chance(0.3) ? 0.4 : 0);
    }
  }
  await Y();
  // ---- two weeping willows: trunk of stacked dabs, limbs, a hull of shade, hanging drags
  const willows = [];
  const willow = async (cx, cz, H, lean, R, sub = false) => {
    const side = cx < 0 ? -1 : 1, by = moundY(cx, cz, side);
    const fork = { x: cx + lean * 2.4, y: by + H * 0.33, z: cz + rng.range(-1, 1) };
    if (!sub) {
    const tr = []; for (let k = 0; k <= 7; k++) { const t = k / 7; tr.push({ x: cx + (fork.x - cx) * t * t + Math.sin(t * 5 + cx) * 0.35, y: by - 0.3 + (fork.y - by + 0.3) * t, z: cz + (fork.z - cz) * t, r: 1.5 - 0.75 * Math.sqrt(t) + (k === 0 ? 0.5 : 0) }); }
    F.tube(tr, ROLE.TRUNK, 0.1, 9, false);
    for (let k = 0; k < 7; k++) for (let y = 0; y < 1; y += 0.22) {
      const a = tr[k], b = tr[k + 1], px = a.x + (b.x - a.x) * y, py = a.y + (b.y - a.y) * y, pz = a.z + (b.z - a.z) * y, r = a.r + (b.r - a.r) * y;
      for (let j = 0; j < 7; j++) { const th = (j + rng()) / 7 * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th); if (py > by + 0.2) T.add(px + c * r, py + rng.range(-0.1, 0.1), pz + sn * r, -sn, rng.range(-0.25, 0.25), c, c, 0, sn, rng.range(0.6, 0.95), rng.range(0.2, 0.3), ROLE.TRUNK, 0.05, KIND.STREAK, 0, false); }
    }
    }
    const yc = by + H * 0.52, Rv = by + H - yc;
    const nl = sub ? 0 : rng.int(4, 6);
    for (let l = 0; l < nl; l++) {                                   // limbs arc up and out into the crown
      const th = (l + rng.range(-0.3, 0.3)) / nl * Math.PI * 2, out = R * rng.range(0.35, 0.6), top = yc + Rv * rng.range(0.35, 0.7), lp = [];
      for (let k = 0; k <= 6; k++) { const t = k / 6, e = Math.sin(t * Math.PI / 2); lp.push({ x: fork.x + Math.cos(th) * out * t * (0.4 + 0.6 * t), y: fork.y + (top - fork.y) * e, z: fork.z + Math.sin(th) * out * t * (0.4 + 0.6 * t), r: 0.62 - 0.45 * t }); }
      F.tube(lp, ROLE.TRUNK, 0.3, 6, false);
      for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) { const a = lp[k], b = lp[k + 1], t = rng(), th2 = rng() * 6.283; T.add(a.x + (b.x - a.x) * t + Math.cos(th2) * a.r, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t + Math.sin(th2) * a.r, -Math.sin(th2), 0.3, Math.cos(th2), Math.cos(th2), 0.2, Math.sin(th2), 0.7, 0.22, ROLE.TRUNK, 0.3, KIND.STREAK, 0, false); }
    }
    // hull: a ragged-hemmed dome of shade so the crown is closed behind its drags
    const p1 = rng() * 6.283, p2 = rng() * 6.283;
    const lobe = (th) => 1 + 0.2 * Math.sin(th * 3 + p1) + 0.13 * Math.sin(th * 5 + p2) + 0.16 * Math.sin(th + p2);
    const topF = (th) => 0.66 + 0.28 * lobe(th * 2 + 1);
    const hemAt = (th) => by + 2.3 + 1.3 * Math.sin(th * 3 + p2) + 0.9 * Math.sin(th * 7 + p1) + 5 * Math.pow(Math.max(0, Math.sin(th + p1)), 6);
    const SEG = 22, RNG = 7; let prev = null;
    for (let j = 0; j <= RNG; j++) {
      const row = [], v = j / RNG;
      for (let k = 0; k <= SEG; k++) {
        const th = (k / SEG) * Math.PI * 2, ph = v * Math.PI * 0.5, rr = R * 0.8 * lobe(th) * (j === 0 ? 0.02 : Math.sin(ph)) * (j === RNG ? 0.93 : 1);
        const y = j === RNG ? hemAt(th) + 2.2 : yc + Rv * 0.76 * Math.cos(ph) * topF(th) - (v > 0.7 ? (v - 0.7) * 14 : 0);
        row.push(F.vert(cx + lean + Math.cos(th) * rr, y, cz + Math.sin(th) * rr, Math.cos(th) * Math.sin(ph), Math.cos(ph) * 0.8, Math.sin(th) * Math.sin(ph), v * R * 1.6 + (j === RNG ? 6 : 0), th * R * 0.8, ROLE.FOLIAGE, 0.5));
      }
      if (prev) for (let k = 0; k < SEG; k++) F.quad(prev[k], prev[k + 1], row[k + 1], row[k]);
      prev = row;
    }
    await Y();
    // strands of drags
    const nS = Math.round(700 * (R / 12));
    for (let i = 0; i < nS; i++) {
      const th = rng() * Math.PI * 2, rho = Math.sqrt(0.25 + 0.75 * rng()), outer = rho > 0.74, Rl = R * lobe(th);
      const ax = cx + lean + Math.cos(th) * Rl * rho * 0.9, az = cz + Math.sin(th) * Rl * rho * 0.9, ay = yc + Rv * Math.pow(1 - rho * rho * 0.9, 0.42) * topF(th) * rng.range(0.84, 1.07);
      const hem = hemAt(th) + (outer ? rng.range(-1.2, 1.5) : rng.range(1, 6)), drop = Math.max(2, ay - hem), drift = Rl * (1 - rho * 0.9) * 0.55 + rng.range(0.4, 2.2);
      const ox = Math.cos(th), oz = Math.sin(th), occ = (outer ? 0 : 0.3) + (lobe(th) < 0.93 ? 0.22 : 0);
      let t = rng.range(0, 0.8), guard = 0;
      while (t < drop && guard++ < 30) {
        const len = rng.range(1.1, 2.7), tm = t + len * 0.5, e = 1 - Math.exp(-tm / (drop * 0.3)), de = Math.exp(-tm / (drop * 0.3)) / (drop * 0.3);
        const role = !outer && rng.chance(0.25) ? ROLE.DEEP : rng.chance(0.025) ? ROLE.RIM : ROLE.FOLIAGE;
        T.add(ax + ox * drift * e, ay - tm, az + oz * drift * e, ox * drift * de + rng.range(-0.12, 0.12), -1, oz * drift * de + rng.range(-0.12, 0.12), ox, 0.05 + 0.6 * (1 - tm / drop) * (1 - tm / drop), oz,
          len, Math.max(0.3, len * 0.2), role, occ + (tm > drop * 0.7 ? 0.12 : 0), KIND.DRAG, tm, true);
        t += len * rng.range(0.62, 0.85);
      }
      if (i % 120 === 0) await Y();
    }
    for (let i = 0; i < (sub ? 220 : 420); i++) {                                 // the top: upright commas overrunning the outline
      const th = rng() * Math.PI * 2, rho = Math.sqrt(rng()) * 0.8, Rl = R * lobe(th), ox = Math.cos(th), oz = Math.sin(th);
      const y = yc + Rv * Math.pow(1 - rho * rho * 0.9, 0.42) * topF(th) + rng.range(-0.3, 1.1), len = rng.range(1.0, 2.2);
      T.add(cx + lean + ox * Rl * rho * 0.9, y, cz + oz * Rl * rho * 0.9, ox * (0.5 + rho) + rng.range(-0.3, 0.3), rng.range(-0.2, 0.9), oz * (0.5 + rho) + rng.range(-0.3, 0.3), ox * rho, 1, oz * rho, len, len * 0.24, rng.chance(0.05) ? ROLE.RIM : ROLE.FOLIAGE, 0, KIND.CURL, 0);
    }
    if (!sub) willows.push({ x: cx + lean, z: cz, H, R, top: by + H });
  };
  const bigSide = rng.sign();
  for (const side of [-1, 1]) {
    const big = bigSide === side, H = big ? 28 : rng.range(25, 27), R = big ? 14 : 12;
    const wx = side * (HALF + rng.range(7.5, 9.5)), wz = side * rng.range(-1.5, 4), lean = -side * rng.range(0.2, 1.2);
    await willow(wx, wz, H, lean, R);
    // a shoulder mass beside it, so the tree is a compound of hanging curtains and never one dome
    await willow(wx + side * R * rng.range(0.5, 0.7), wz + rng.sign() * R * rng.range(0.35, 0.6), H * rng.range(0.66, 0.78), lean, R * rng.range(0.6, 0.72), true);
  }
  const nAbove = T.n;
  // ---- lily rafts: level ellipses flat on the water, single flower dabs; shade under the deck and the willows
  const rafts = [], nRafts = rng.int(26, 32), WR = opts.waterRadius ?? 420;
  const shaded = (x, z) => (Math.abs(z + 1.5) < 3.2 && Math.abs(x) < HALF) || willows.some((w) => Math.hypot(x - w.x, z - w.z) < w.R * 0.8);
  for (let i = 0; i < nRafts; i++) {
    const near = i < 10, rx = rng.range(4, 9), rz = rng.range(2.2, 4.5);
    const cx = near ? rng.sign() * rng.range(3.5 + rx * 0.6, 14) : rng.range(-58, 58), cz = near ? rng.range(7, 58) * (i < 6 ? 1 : -1) : rng.range(-75, 75);
    const n = Math.round(rx * rz * rng.range(1.4, 2.0)); rafts.push({ x: cx, z: cz, rx, rz });
    for (let k = 0; k < n; k++) {
      const th = rng() * 6.283, r = Math.sqrt(rng()), x = cx + Math.cos(th) * r * rx, z = cz + Math.sin(th) * r * rz, sz = rng.range(0.6, 1.2), a = rng() * 6.283;
      if (moundY(x, z, x < 0 ? -1 : 1) > 0) continue;
      T.add(x, 0.03, z, Math.cos(a), 0, Math.sin(a) * 0.5, 0, 1, 0, sz * 1.2, sz * 0.72, ROLE.PAD, shaded(x, z) ? 1 : rng.chance(0.25) ? 0.5 : -0.2, KIND.PAD, 0, true);
      if (rng.chance(0.11)) T.add(x + 0.2, 0.09, z, Math.cos(a + 1), 0, Math.sin(a + 1), 0, 1, 0, rng.range(0.42, 0.62), rng.range(0.34, 0.46), ROLE.FLOWER, shaded(x, z) ? 0.6 : -1, KIND.FLOWER, 0, false);
    }
  }
  await Y();
  // ---- reflections: flipped copies as vertical drags of the shade pigment, drawn through the water
  const Rf = new TouchBatch(rng, 1, 16384);
  T.reflectInto(Rf, 1.6, 2.3, 0, nBridge);
  for (let i = 0; i < owedDbl; i++) rng();                       // THE HEM LAW: the doubles of the raceme dabs it left out are drawn and thrown away
  await Y();
  T.reflectInto(Rf, 3.2 / Math.max(detail, 0.6), 2.0, nBridge, nAbove);
  await Y();
  // ---- meshes: water first (no depth written), reflections through it, then forms and touches
  const mats = { touch: style.touchMaterial(), reflect: style.touchMaterial({ reflect: true, brk: BRK.BRIDGE }), form: style.canvasMaterial(), water: null };
  if (opts.water !== false) {
    const W = new FormBatch(), radii = [0, 6, 14, 26, 42, 64, 95, 140, 200, 290, WR], SEGW = 40; let prev = null;
    for (let j = 0; j < radii.length; j++) {
      const row = []; for (let k = 0; k <= SEGW; k++) { const th = (k / SEGW) * Math.PI * 2, x = Math.cos(th) * radii[j], z = Math.sin(th) * radii[j]; row.push(W.vert(x, 0, z, 0, 1, 0, x, z, ROLE.WATER, -0.5)); }
      if (prev) for (let k = 0; k < SEGW; k++) W.quad(prev[k], row[k], row[k + 1], prev[k + 1]);
      prev = row;
    }
    mats.water = style.canvasMaterial({ water: true, slide: 0.07, small: [0.6, 0.12], large: [2.4, 0.5], chink: 0.05 });
    mats.water.depthWrite = false;
    const wm = W.mesh(mats.water); wm.renderOrder = -0.6; wm.frustumCulled = false; wm.name = 'pond'; root.add(wm);
  }
  const refl = Rf.mesh(mats.reflect); refl.renderOrder = -0.5; refl.name = 'reflections'; root.add(refl);
  const forms = F.mesh(mats.form); forms.name = 'under-forms'; root.add(forms);
  const touches = T.mesh(mats.touch); touches.name = 'touches'; root.add(touches);
  await Y();

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    reveal: V(0, 2, 90),                         // the sluice lip: bridge square-on, half the frame
    lookAt: V(0, 7, 0),
    flyThrough: [V(0, 2, 90), V(0, 2.4, 62), V(0, 3.4, 34), V(0, 4.3, 12), V(0, 4.5, 0), V(0, 4.2, -14), V(0, 2.8, -45), V(0, 1.5, -80)],
    crown: V(0, 8, 0),                           // underside of the deck over the path
    trellisTop: V(0, yU(0) + TH + trellisH, 0),
    willows: willows.map((w) => ({ base: V(w.x, 0, w.z), top: V(w.x, w.top, w.z), radius: w.R })),
    banks: [V(-(HALF + 3.5), 0, 0), V(HALF + 3.5, 0, 0)], bankRadius: V(moundRx, moundH, moundRz),
    rafts: rafts.map((r) => ({ at: V(r.x, 0, r.z), rx: r.rx, rz: r.rz })),
    span: 2 * HALF, clearance: 8,
  };
  const stats = { touches: T.n, reflections: Rf.n, formTriangles: F.i.length / 3, racemes: nRac, triangles: (T.n + Rf.n) * 2 + F.i.length / 3 + (opts.water !== false ? 800 : 0) };
  return {
    object: root, radius: 44, height: 28, center: V(0, 8, 0), anchors, style, stats, materials: mats,
    ground: false, groundY: 0,
    // the world sets the hour: a arriving from behind, b still ahead, place of the front along the course, fade length
    setHours(a, b, place, fade) { style.setHours(a, b, place, fade); },
    // nothing here has a beginning except the fronts, which the world owns; kept so the contract is uniform
    setProgress(u) { this.progress = u; },
    update(dt, time, camera) { style.frame(time, camera, ctx.renderer); },
    dispose() { if (ownStyle) style.dispose(); },
  };
}
